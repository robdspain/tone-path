import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import type { ChordEvent, NoteEvent } from '@/types/transcription';

interface BackingTrackState {
  isPlaying: boolean;
  tempo: number;
  volume: number;
  drumsEnabled: boolean;
  bassEnabled: boolean;
  currentPattern: string | null;
}

// Drum patterns (simplified - can be expanded)
const DRUM_PATTERNS: Record<string, number[][]> = {
  '4/4-basic': [
    [0, 0.5, 1, 1.5], // Kick on beats
    [0.25, 0.75, 1.25, 1.75], // Hi-hat
    [1, 3], // Snare on 2 and 4
  ],
  '4/4-rock': [
    [0, 1.5], // Kick
    [0.5, 1, 1.5, 2, 2.5, 3, 3.5], // Hi-hat
    [1, 3], // Snare
  ],
  '4/4-jazz': [
    [0, 2], // Kick
    [0.5, 1, 1.5, 2.5, 3, 3.5], // Ride
    [1.5, 3.5], // Snare
  ],
};

// Bass patterns based on chord progressions
function generateBassPattern(chord: string, duration: number, tempo: number): number[] {
  // Convert chord to root note
  const chordRoot = chord.replace(/[^A-G#]/g, '');
  const noteMap: Record<string, number> = {
    C: 36, 'C#': 37, D: 38, 'D#': 39, E: 40, F: 41, 'F#': 42,
    G: 43, 'G#': 44, A: 45, 'A#': 46, B: 47,
  };
  const rootNote = noteMap[chordRoot] || 36;

  // Generate simple bass pattern (root note on beats)
  const beatsPerMeasure = 4;
  const beats = [];
  for (let i = 0; i < duration * (tempo / 60) / beatsPerMeasure; i++) {
    beats.push(i * beatsPerMeasure);
    beats.push(i * beatsPerMeasure + 2); // Add off-beat
  }
  return beats;
}

export const useBackingTrack = (
  detectedChords: ChordEvent[],
  detectedNotes: NoteEvent[],
  tempo: number = 120
) => {
  const [state, setState] = useState<BackingTrackState>({
    isPlaying: false,
    tempo: 120,
    volume: 0.7,
    drumsEnabled: true,
    bassEnabled: true,
    currentPattern: null,
  });

  const drumSynthRef = useRef<Tone.MembraneSynth | null>(null);
  const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
  const hiHatRef = useRef<Tone.NoiseSynth | null>(null);
  const scheduleRef = useRef<number[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize synths
  useEffect(() => {
    drumSynthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: {
        type: 'sawtooth',
      },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
      },
    }).toDestination();

    bassSynthRef.current = new Tone.MonoSynth({
      oscillator: {
        type: 'square',
      },
      envelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.5,
        release: 0.8,
      },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.7,
        sustain: 0.1,
        release: 0.8,
        baseFrequency: 300,
        octaves: 4,
      },
    }).toDestination();

    hiHatRef.current = new Tone.NoiseSynth({
      noise: {
        type: 'white',
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      },
    }).toDestination();

    // Set volumes
    drumSynthRef.current.volume.value = Tone.gainToDb(state.volume);
    bassSynthRef.current.volume.value = Tone.gainToDb(state.volume * 0.8);
    hiHatRef.current.volume.value = Tone.gainToDb(state.volume * 0.6);

    return () => {
      drumSynthRef.current?.dispose();
      bassSynthRef.current?.dispose();
      hiHatRef.current?.dispose();
    };
  }, []);

  // Update volume when state changes
  useEffect(() => {
    if (drumSynthRef.current) {
      drumSynthRef.current.volume.value = Tone.gainToDb(state.volume);
    }
    if (bassSynthRef.current) {
      bassSynthRef.current.volume.value = Tone.gainToDb(state.volume * 0.8);
    }
    if (hiHatRef.current) {
      hiHatRef.current.volume.value = Tone.gainToDb(state.volume * 0.6);
    }
  }, [state.volume]);

  // Generate and play backing track based on detected chords
  const generateAndPlay = async () => {
    if (!drumSynthRef.current || !bassSynthRef.current || !hiHatRef.current) return;

    try {
      await Tone.start();
      
      Tone.Transport.cancel();
      scheduleRef.current = [];
      Tone.Transport.bpm.value = state.tempo;

      // Determine pattern based on detected chords
      const recentChords = detectedChords.slice(-4);
      const pattern = recentChords.length > 0 ? '4/4-rock' : '4/4-basic';
      setState((prev) => ({ ...prev, currentPattern: pattern }));

      const drumPattern = DRUM_PATTERNS[pattern] || DRUM_PATTERNS['4/4-basic'];
      const measureDuration = 4; // 4 beats per measure

      // Schedule drums
      if (state.drumsEnabled) {
        // Kick drum
        drumPattern[0].forEach((beat) => {
          const id = Tone.Transport.scheduleRepeat(
            (time) => {
              drumSynthRef.current?.triggerAttackRelease('C1', '8n', time);
            },
            measureDuration,
            beat
          );
          scheduleRef.current.push(id);
        });

        // Hi-hat
        drumPattern[1].forEach((beat) => {
          const id = Tone.Transport.scheduleRepeat(
            (time) => {
              hiHatRef.current?.triggerAttackRelease('8n', time);
            },
            measureDuration,
            beat
          );
          scheduleRef.current.push(id);
        });

        // Snare
        drumPattern[2].forEach((beat) => {
          const id = Tone.Transport.scheduleRepeat(
            (time) => {
              drumSynthRef.current?.triggerAttackRelease('C2', '8n', time);
            },
            measureDuration,
            beat
          );
          scheduleRef.current.push(id);
        });
      }

      // Schedule bass based on detected chords
      if (state.bassEnabled && recentChords.length > 0) {
        recentChords.forEach((chord, index) => {
          const startTime = index * measureDuration;
          const bassBeats = generateBassPattern(chord.chord, measureDuration, state.tempo);
          
          bassBeats.forEach((beat) => {
            const chordRoot = chord.chord.replace(/[^A-G#]/g, '');
            const noteMap: Record<string, string> = {
              C: 'C2', 'C#': 'C#2', D: 'D2', 'D#': 'D#2', E: 'E2', F: 'F2', 'F#': 'F#2',
              G: 'G2', 'G#': 'G#2', A: 'A2', 'A#': 'A#2', B: 'B2',
            };
            const bassNote = noteMap[chordRoot] || 'C2';

            const id = Tone.Transport.schedule(
              (time) => {
                bassSynthRef.current?.triggerAttackRelease(bassNote, '4n', time);
              },
              startTime + beat
            );
            scheduleRef.current.push(id);
          });
        });
      }

      Tone.Transport.start();
      isPlayingRef.current = true;
      setState((prev) => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Backing track error:', error);
    }
  };

  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    scheduleRef.current = [];
    isPlayingRef.current = false;
    setState((prev) => ({ ...prev, isPlaying: false }));
  };

  const setVolume = (volume: number) => {
    setState((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  };

  const toggleDrums = () => {
    setState((prev) => ({ ...prev, drumsEnabled: !prev.drumsEnabled }));
    if (state.isPlaying) {
      stop();
      setTimeout(() => generateAndPlay(), 100);
    }
  };

  const toggleBass = () => {
    setState((prev) => ({ ...prev, bassEnabled: !prev.bassEnabled }));
    if (state.isPlaying) {
      stop();
      setTimeout(() => generateAndPlay(), 100);
    }
  };

  const setTempo = (newTempo: number) => {
    setState((prev) => ({ ...prev, tempo: newTempo }));
    Tone.Transport.bpm.value = newTempo;
  };

  // Auto-generate when chords are detected
  useEffect(() => {
    if (detectedChords.length > 0 && state.isPlaying) {
      // Regenerate backing track when new chords are detected
      const timeout = setTimeout(() => {
        if (isPlayingRef.current) {
          stop();
          setTimeout(() => generateAndPlay(), 100);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedChords.length, state.isPlaying]);

  return {
    ...state,
    play: generateAndPlay,
    stop,
    setVolume,
    toggleDrums,
    toggleBass,
    setTempo,
  };
};

