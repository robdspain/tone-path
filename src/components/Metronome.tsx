// Metronome component with visual and audio feedback
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as Tone from 'tone';

export type MetronomeSound = 'classic' | 'wood' | 'electronic' | 'tick' | 'beep' | 'click';

interface MetronomeProps {
  initialBpm?: number;
  onBpmChange?: (bpm: number) => void;
}

const SOUND_PRESETS: Record<MetronomeSound, { accentFreq: number; beatFreq: number; type: OscillatorType; attack?: number; decay?: number }> = {
  classic: { accentFreq: 1000, beatFreq: 800, type: 'sine' },
  wood: { accentFreq: 600, beatFreq: 500, type: 'sine' },
  electronic: { accentFreq: 1200, beatFreq: 900, type: 'square' },
  tick: { accentFreq: 800, beatFreq: 600, type: 'sine' },
  beep: { accentFreq: 1500, beatFreq: 1200, type: 'sine' },
  click: { accentFreq: 2000, beatFreq: 1500, type: 'sine' },
};

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

  // Update refs when state changes
  useEffect(() => {
    soundTypeRef.current = soundType;
  }, [soundType]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    onBpmChange?.(bpm);
  }, [bpm, onBpmChange]);

  useEffect(() => {
    if (!isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (loopRef.current) {
        loopRef.current.dispose();
        loopRef.current = null;
      }
      beatRef.current = 0;
      setBeat(0);
      return;
    }

    // Start metronome
    Tone.Transport.start();

    // Create loop for metronome clicks
    loopRef.current = new Tone.Loop((time) => {
      const preset = SOUND_PRESETS[soundTypeRef.current];
      const currentBeat = beatRef.current;
      
      // Determine frequency based on beat
      const frequency = currentBeat === 0 ? preset.accentFreq : preset.beatFreq;
      
      // Create a new oscillator for each click (more reliable)
      const osc = new Tone.Oscillator({
        frequency,
        type: preset.type,
      });
      
      // Create gain node for volume control
      const gain = new Tone.Gain(0);
      
      // Create envelope to control gain (for click sound shaping)
      const envelope = new Tone.Envelope({
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.05,
      }).connect(gain.gain);
      
      // Connect: osc -> gain -> destination
      osc.connect(gain);
      gain.toDestination();
      
      // Start oscillator
      osc.start(time);
      
      // Trigger envelope to create click sound
      envelope.triggerAttackRelease(volumeRef.current, 0.05, time);
      
      // Stop oscillator after envelope completes
      osc.stop(time + 0.15);
      
      // Clean up after sound completes
      setTimeout(() => {
        osc.dispose();
        envelope.dispose();
        gain.dispose();
      }, 200);
      
      // Update beat counter
      beatRef.current = (beatRef.current + 1) % beatsPerMeasure;
      setBeat(beatRef.current);
    }, '4n').start(0);

    return () => {
      if (loopRef.current) {
        loopRef.current.dispose();
        loopRef.current = null;
      }
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
          <input
            type="range"
            min="30"
            max="300"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-full h-2"
          />
          <div className="flex justify-between text-xs dark:text-gray-600 text-gray-600 mt-2">
            <span>30 BPM</span>
            <span>300 BPM</span>
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

        {/* Volume Control */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold dark:text-gray-300 text-gray-700">
              Volume
            </label>
            <span className="text-sm font-bold dark:text-secondary-400 text-teal-600">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2"
          />
        </div>
      </div>
    </motion.div>
  );
};

