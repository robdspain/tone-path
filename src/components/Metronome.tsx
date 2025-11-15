// Metronome component with visual and audio feedback
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as Tone from 'tone';

export type MetronomeSound = 'classic' | 'wood' | 'electronic' | 'tick' | 'beep' | 'click';

interface MetronomeProps {
  initialBpm?: number;
  onBpmChange?: (bpm: number) => void;
}

export const Metronome: React.FC<MetronomeProps> = ({
  initialBpm = 120,
  onBpmChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(initialBpm);
  const [beat, setBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [volume, setVolume] = useState(0.7);
  const [soundType, setSoundType] = useState<MetronomeSound>('classic');
  
  const loopRef = useRef<Tone.Loop | null>(null);
  const beatRef = useRef(0);
  const soundTypeRef = useRef(soundType);
  const volumeRef = useRef(volume);
  const transportOwnedRef = useRef(false);

  const triggerMetronomeSound = (sound: MetronomeSound, isAccent: boolean, time: number) => {
    const gain = new Tone.Gain(Math.max(0, Math.min(1, volumeRef.current * (isAccent ? 1 : 0.8)))).toDestination();

    const disposeLater = (instrument: any) => {
      setTimeout(() => {
        instrument.dispose();
        gain.dispose();
      }, 300);
    };

    switch (sound) {
      case 'classic': {
        const synth = new Tone.MembraneSynth({
          pitchDecay: 0.005,
          octaves: 6,
          envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.04 },
        });
        synth.connect(gain);
        synth.triggerAttackRelease(isAccent ? 'C5' : 'G4', '16n', time);
        disposeLater(synth);
        break;
      }
      case 'wood': {
        const synth = new Tone.PluckSynth({
          resonance: 0.95,
          dampening: 2600,
        });
        synth.connect(gain);
        synth.triggerAttackRelease(isAccent ? 'C4' : 'A3', '8n', time);
        disposeLater(synth);
        break;
      }
      case 'electronic': {
        const synth = new Tone.FMSynth({
          harmonicity: 3,
          modulationIndex: 10,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
          modulation: { type: 'square' },
          modulationEnvelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
        });
        synth.connect(gain);
        synth.triggerAttackRelease(isAccent ? 'E6' : 'C6', '16n', time);
        disposeLater(synth);
        break;
      }
      case 'tick': {
        const synth = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
        });
        synth.connect(gain);
        synth.triggerAttackRelease('32n', time, isAccent ? 1 : 0.7);
        disposeLater(synth);
        break;
      }
      case 'beep': {
        const synth = new Tone.Synth({
          oscillator: { type: isAccent ? 'triangle' : 'sine' },
          envelope: { attack: 0.001, decay: 0.05, sustain: 0.1, release: 0.02 },
        });
        synth.connect(gain);
        synth.triggerAttackRelease(isAccent ? 'A5' : 'F5', '16n', time, 0.9);
        disposeLater(synth);
        break;
      }
      case 'click': {
        const synth = new Tone.MetalSynth({
          resonance: 400,
          modulationIndex: 10,
          envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
          harmonicity: 5.1,
        });
        synth.connect(gain);
        synth.triggerAttackRelease('16n', time, 0.8);
        disposeLater(synth);
        break;
      }
    }
  };

  // Update refs when state changes
  useEffect(() => {
    soundTypeRef.current = soundType;
  }, [soundType]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      Tone.Transport.bpm.value = bpm;
    }
    onBpmChange?.(bpm);
  }, [bpm, onBpmChange, isPlaying]);

  useEffect(() => {
    return () => {
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current.dispose();
        loopRef.current = null;
      }
      if (transportOwnedRef.current) {
        Tone.Transport.stop();
        transportOwnedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    const disposeLoop = () => {
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current.dispose();
        loopRef.current = null;
      }
    };

    if (!isPlaying) {
      disposeLoop();
      if (transportOwnedRef.current) {
        Tone.Transport.stop();
        transportOwnedRef.current = false;
      }
      beatRef.current = 0;
      setBeat(0);
      return;
    }

    disposeLoop();

    const loop = new Tone.Loop((time) => {
      const currentBeat = beatRef.current;
      triggerMetronomeSound(soundTypeRef.current, currentBeat === 0, time);

      beatRef.current = (beatRef.current + 1) % beatsPerMeasure;
      setBeat(beatRef.current);
    }, '4n');

    loopRef.current = loop;
    loop.start(0);

    if (Tone.Transport.state !== 'started') {
      transportOwnedRef.current = true;
      Tone.Transport.position = 0;
      Tone.Transport.start('+0.02');
    } else {
      transportOwnedRef.current = false;
    }

    return () => {
      disposeLoop();
    };
  }, [isPlaying, beatsPerMeasure]);

  const toggle = async () => {
    if (!isPlaying) {
      // Resume audio context if suspended
      await Tone.start();
    }
    setIsPlaying(!isPlaying);
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.max(30, Math.min(300, newBpm)));
  };
  const tempoPercent = (bpm - 30) / (300 - 30);
  const volumePercent = volume;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          className={`px-8 py-3 rounded-xl font-semibold btn-modern transition-all ${
            isPlaying
              ? 'bg-error hover:bg-error-dark text-white shadow-lg'
              : 'bg-gradient-primary text-white shadow-glow-primary'
          }`}
        >
          {isPlaying ? '⏹ Stop' : '▶ Start'}
        </motion.button>
      </div>

      <div className="space-y-6">
        {/* BPM Control */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold dark:text-gray-300 text-gray-700">Tempo</label>
            <motion.span
              animate={{ scale: isPlaying && beat === 0 ? [1, 1.1, 1] : 1 }}
              className="text-4xl font-bold gradient-text"
            >
              {bpm}
            </motion.span>
          </div>
          <div className="relative h-10">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/10" />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-sky-400 shadow-[0_0_18px_rgba(59,130,246,0.35)]"
              style={{ width: `${tempoPercent * 100}%` }}
            />
            <input
              type="range"
              min="30"
              max="300"
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="slider-thumb absolute inset-x-0 top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent z-10"
            />
          </div>
          <div className="flex justify-between text-xs dark:text-gray-600 text-gray-600 mt-2">
            <span>30 BPM</span>
            <span>300 BPM</span>
          </div>
        </div>

        {/* Volume Control */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold dark:text-gray-300 text-gray-700">
              Volume
            </label>
            <span className="text-sm font-bold dark:text-secondary-400 text-teal-400">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <div className="relative h-10">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/10" />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-gradient-to-r from-emerald-300 to-teal-400 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
              style={{ width: `${volumePercent * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="slider-thumb absolute inset-x-0 top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent z-10"
            />
          </div>
        </div>

        {/* Quick BPM Buttons */}
        <div>
            <label className="block text-sm dark:text-gray-500 text-gray-600 mb-2">Quick Set</label>
          <div className="flex gap-2 flex-wrap">
            {[60, 80, 100, 120, 140, 160].map((quickBpm) => (
              <motion.button
                key={quickBpm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBpmChange(quickBpm)}
                className={`px-4 py-2 text-sm rounded-xl font-semibold transition-all ${
                  Math.abs(bpm - quickBpm) < 5
                    ? 'bg-gradient-accent text-white shadow-glow-accent'
                    : 'dark:bg-dark-800 bg-gray-300 dark:text-gray-300 text-gray-900 dark:hover:bg-dark-700 hover:bg-gray-400 border dark:border-white/10 border-gray-400'
                }`}
              >
                {quickBpm}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time Signature */}
        <div>
          <label className="block text-base font-semibold dark:text-gray-300 text-gray-700 mb-3">Time Signature</label>
          <div className="flex gap-3">
            {[2, 3, 4, 6].map((beats) => (
              <motion.button
                key={beats}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBeatsPerMeasure(beats)}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-lg transition-all ${
                  beatsPerMeasure === beats
                    ? 'bg-gradient-secondary text-white shadow-glow-secondary'
                    : 'dark:bg-dark-800 bg-gray-300 dark:text-gray-300 text-gray-900 dark:hover:bg-dark-700 hover:bg-gray-400 border dark:border-white/10 border-gray-400'
                }`}
              >
                {beats}/4
              </motion.button>
            ))}
          </div>
        </div>

        {/* Visual Beat Indicator */}
        <div className="bg-dark-900/80 rounded-2xl p-6 border border-white/10">
          <div className="flex gap-3 justify-center items-center h-20">
            {Array.from({ length: beatsPerMeasure }, (_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: beat === i && isPlaying ? 1.4 : 1,
                  opacity: beat === i && isPlaying ? 1 : 0.3,
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white ${
                  i === 0
                    ? beat === i && isPlaying
                      ? 'bg-gradient-to-br from-warning to-warning-dark shadow-glow-primary'
                      : 'bg-warning/30'
                    : beat === i && isPlaying
                      ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow-accent'
                      : 'bg-primary-500/30'
                }`}
              >
                {i + 1}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sound Type Selection */}
        <div>
          <label className="block text-base font-semibold dark:text-gray-300 text-gray-700 mb-3">Sound Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['classic', 'wood', 'electronic', 'tick', 'beep', 'click'] as MetronomeSound[]).map((sound) => (
              <motion.button
                key={sound}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSoundType(sound)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  soundType === sound
                    ? 'bg-gradient-accent text-white shadow-glow-accent'
                    : 'dark:bg-dark-800 bg-gray-300 dark:text-gray-300 text-gray-900 dark:hover:bg-dark-700 hover:bg-gray-400 border dark:border-white/10 border-gray-400'
                }`}
              >
                {sound === 'classic' && '🎵 '}
                {sound === 'wood' && '🪵 '}
                {sound === 'electronic' && '⚡ '}
                {sound === 'tick' && '⏱️ '}
                {sound === 'beep' && '🔊 '}
                {sound === 'click' && '👆 '}
                {sound}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #8b5cf6, #0ea5e9);
          box-shadow: 0 8px 20px rgba(14, 165, 233, 0.45);
          border: 2px solid rgba(255, 255, 255, 0.35);
          cursor: pointer;
          position: relative;
        }
        .slider-thumb::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #8b5cf6, #0ea5e9);
          box-shadow: 0 8px 20px rgba(14, 165, 233, 0.45);
          border: 2px solid rgba(255, 255, 255, 0.35);
          cursor: pointer;
        }
        .slider-thumb::-webkit-slider-runnable-track {
          height: 0;
        }
        .slider-thumb::-moz-range-track {
          height: 0;
        }
      `}</style>
    </motion.div>
  );
};
