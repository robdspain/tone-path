import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { NoteEvent } from '@/types/transcription';

interface TunerProps {
  currentNote: NoteEvent | null;
}

export const Tuner: React.FC<TunerProps> = ({ currentNote }) => {
  // Throttle updates when no note is detected to slow down visual interface
  const [displayedNote, setDisplayedNote] = useState<NoteEvent | null>(currentNote);
  const lastUpdateRef = useRef<number>(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // When a note is detected, update immediately
    if (currentNote) {
      setDisplayedNote(currentNote);
      // Clear any pending throttled update
      if (updateIntervalRef.current) {
        clearTimeout(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }

    // When no note is detected, throttle updates to slow down visual changes
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    const throttleDelay = 500; // Update every 500ms when no note detected

    if (timeSinceLastUpdate >= throttleDelay) {
      setDisplayedNote(null);
      lastUpdateRef.current = now;
    } else {
      // Schedule update after remaining time
      const remainingTime = throttleDelay - timeSinceLastUpdate;
      updateIntervalRef.current = setTimeout(() => {
        setDisplayedNote(null);
        lastUpdateRef.current = Date.now();
      }, remainingTime);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearTimeout(updateIntervalRef.current);
      }
    };
  }, [currentNote]);

  if (!displayedNote) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full text-center py-8"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-4xl mb-3 opacity-30"
        >
          🎯
        </motion.div>
        <div className="text-gray-400 font-medium">No note detected</div>
        <div className="text-sm text-gray-600 mt-2">Play a note to see tuning</div>
      </motion.div>
    );
  }

  // Calculate cents deviation (simplified)
  const noteName = displayedNote.note.replace(/\d/g, '');
  const frequency = displayedNote.frequency;
  
  // This is simplified - full implementation would calculate exact cents
  const isInTune = displayedNote.confidence && displayedNote.confidence > 0.8;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: isInTune ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.3 }}
          className="text-6xl font-bold gradient-text mb-3"
        >
          {displayedNote.note}
        </motion.div>
        <div className="text-lg text-gray-400 mb-6 font-mono">
          {frequency.toFixed(2)} Hz
        </div>

        {/* Modern Tuner Meter */}
        <div className="relative h-40 bg-dark-900/80 rounded-2xl overflow-hidden mb-6 p-4 border border-white/10">
          {/* Center line */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-full bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
          </div>

          {/* Tick marks */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full relative">
              {[-40, -20, 0, 20, 40].map((pos) => (
                <div
                  key={pos}
                  className="absolute top-1/2 transform -translate-y-1/2"
                  style={{ left: `${50 + pos}%` }}
                >
                  <div className={`h-8 w-0.5 ${pos === 0 ? 'bg-success h-12' : 'bg-gray-700'}`}></div>
                  <div className="text-xs text-gray-600 text-center mt-1">
                    {pos > 0 ? `+${pos}` : pos}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tuning indicator */}
          <motion.div
            animate={{
              x: isInTune ? 0 : (displayedNote.confidence && displayedNote.confidence < 0.8 ? -30 : 30),
              scale: isInTune ? [1, 1.2, 1] : 1
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full z-10 ${
              isInTune ? 'bg-gradient-to-r from-success to-success shadow-glow-success' : 'bg-gradient-primary shadow-glow-primary'
            }`}
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-75"></div>
          </motion.div>
        </div>

        {/* Status indicator */}
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`text-lg font-bold mb-3 ${isInTune ? 'text-success' : 'text-warning'}`}
        >
          {isInTune ? '✓ In Tune!' : '⚠ Adjust tuning'}
        </motion.div>

        {/* Confidence meter */}
        <div className="flex items-center gap-3 justify-center">
          <span className="text-xs text-gray-500">Confidence:</span>
          <div className="w-32 h-2 bg-dark-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(displayedNote.confidence || 0) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-accent"
            />
          </div>
          <span className="text-xs font-bold text-accent-400">
            {(displayedNote.confidence ? displayedNote.confidence * 100 : 0).toFixed(0)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

