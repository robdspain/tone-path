import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import type { TranscriptionData, NoteEvent } from '@/types/transcription';

// Convert note name to MIDI number
function noteToMIDI(note: string): number {
  const noteMap: Record<string, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
  };
  
  const match = note.match(/([A-G]#?)(\d)/);
  if (!match) return 60;
  
  const [, noteName, octave] = match;
  const noteNumber = noteMap[noteName] || 0;
  const octaveNum = parseInt(octave);
  
  return 12 + (octaveNum * 12) + noteNumber;
}

export const usePlayback = (data: TranscriptionData | null, tempo: number = 120) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const scheduleRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize Tone.js synth
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    Tone.Transport.bpm.value = tempo;

    if (data && data.events.length > 0) {
      const lastEvent = data.events[data.events.length - 1];
      const endTime = 'duration' in lastEvent 
        ? lastEvent.timestamp + lastEvent.duration 
        : lastEvent.timestamp + 1;
      setDuration(endTime - (data.startTime || 0));
    }

    return () => {
      Tone.Transport.cancel();
      synthRef.current?.dispose();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [data, tempo]);

  // Update current time during playback
  useEffect(() => {
    if (!isPlaying || !data) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateTime = () => {
      if (Tone.Transport.state === 'started') {
        const elapsed = Tone.Transport.seconds;
        setCurrentTime(Math.max(0, elapsed));
        animationFrameRef.current = requestAnimationFrame(updateTime);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, data]);

  const play = async () => {
    if (!data || !synthRef.current) return;

    try {
      await Tone.start();
      
      Tone.Transport.cancel();
      scheduleRef.current = [];
      Tone.Transport.seconds = 0; // Reset transport time

      const startOffset = data.startTime || 0;
      startTimeRef.current = Tone.now();

      // Schedule all note events
      for (const event of data.events) {
        if ('note' in event) {
          const noteEvent = event as NoteEvent;
          const midiNote = noteToMIDI(noteEvent.note);
          const noteName = Tone.Frequency(midiNote, 'midi').toNote();
          const start = noteEvent.timestamp - startOffset;
          const duration = noteEvent.duration;

          const id1 = Tone.Transport.schedule((time) => {
            synthRef.current?.triggerAttack(noteName, time, noteEvent.velocity);
          }, start);

          const id2 = Tone.Transport.schedule((time) => {
            synthRef.current?.triggerRelease(noteName, time);
          }, start + duration);

          scheduleRef.current.push(id1, id2);
        }
      }

      Tone.Transport.start();
      setIsPlaying(true);
      setCurrentTime(0);
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const pause = () => {
    Tone.Transport.pause();
    setIsPlaying(false);
  };

  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.seconds = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const seek = (time: number) => {
    if (!data) return;
    
    stop();
    const startOffset = data.startTime || 0;
    const adjustedTime = startOffset + time;
    
    // Filter events after seek time and reschedule
    const remainingEvents = data.events.filter((e) => e.timestamp >= adjustedTime);
    const newData = { ...data, events: remainingEvents, startTime: adjustedTime };
    
    // Update data and play from new position
    // Note: This would require updating parent component's data
  };

  return {
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    stop,
    seek,
  };
};


