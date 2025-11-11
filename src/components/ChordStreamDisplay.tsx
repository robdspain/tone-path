// Chord stream display component for real-time chord visualization
import { motion, AnimatePresence } from 'framer-motion';
import type { ChordStream } from '@/types/chords';

interface ChordStreamDisplayProps {
  chords: ChordStream;
  currentTime?: number;
  onChordClick?: (time: number) => void;
}

export const ChordStreamDisplay: React.FC<ChordStreamDisplayProps> = ({
  chords,
  currentTime = 0,
  onChordClick,
}) => {
  // Get chords around current time (±2 seconds)
  const relevantChords = chords.frames.filter(
    (c) => Math.abs(c.time - currentTime) <= 2
  );

  // Get current chord (closest to current time)
  const currentChord = chords.frames.reduce((prev, curr) => {
    const prevDist = Math.abs(prev.time - currentTime);
    const currDist = Math.abs(curr.time - currentTime);
    return currDist < prevDist ? curr : prev;
  }, chords.frames[0] || null);

  // Get upcoming chords
  const upcomingChords = chords.frames
    .filter((c) => c.time > currentTime)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-4"
    >
      <div className="text-sm dark:text-gray-300 text-gray-700 mb-3 flex items-center justify-between">
        <span>Chord Stream</span>
        {chords.key && (
          <span className="text-xs dark:text-gray-400 text-gray-600">Key: {chords.key}</span>
        )}
        {chords.bpm && (
          <span className="text-xs dark:text-gray-400 text-gray-600">{chords.bpm} BPM</span>
        )}
      </div>

      {/* Current Chord (Large) */}
      {currentChord && (
        <div className="mb-4">
          <div className="text-xs dark:text-gray-400 text-gray-600 mb-1">Current</div>
          <motion.div
            key={currentChord.time}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block bg-teal-deep/70 rounded-lg px-6 py-4 text-center"
          >
            <div className="text-4xl font-bold text-gold mb-1">
              {currentChord.chord}
            </div>
            <div className="text-xs dark:text-gray-300 text-gray-600">
              {(currentChord.confidence * 100).toFixed(0)}% confidence
            </div>
          </motion.div>
        </div>
      )}

      {/* Recent Chords */}
      <div className="mb-3">
        <div className="text-xs dark:text-gray-400 text-gray-600 mb-2">Recent</div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <AnimatePresence>
            {relevantChords.slice(-5).map((chord, index) => (
              <motion.div
                key={`${chord.time}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => onChordClick?.(chord.time)}
                className={`flex-shrink-0 dark:bg-gray-700/50 bg-gray-300/80 rounded-lg px-4 py-2 text-center cursor-pointer dark:hover:bg-gray-700 hover:bg-gray-400 transition-colors ${
                  Math.abs(chord.time - currentTime) < 0.5 ? 'ring-2 ring-teal' : ''
                }`}
              >
                <div className="text-lg font-semibold dark:text-white text-gray-900">
                  {chord.chord}
                </div>
                <div className="text-xs dark:text-gray-300 text-gray-600">
                  {chord.time.toFixed(1)}s
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Upcoming Chords Preview */}
      {upcomingChords.length > 0 && (
        <div>
          <div className="text-xs dark:text-gray-400 text-gray-600 mb-2">Upcoming</div>
          <div className="flex gap-2">
            {upcomingChords.map((chord, index) => (
              <div
                key={`upcoming-${chord.time}-${index}`}
                className="flex-shrink-0 dark:bg-gray-700/30 bg-gray-300/50 rounded-lg px-3 py-1.5 text-center opacity-60"
              >
                <div className="text-sm font-semibold dark:text-gray-300 text-gray-800">
                  {chord.chord}
                </div>
                <div className="text-xs dark:text-gray-400 text-gray-600">
                  +{(chord.time - currentTime).toFixed(1)}s
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {chords.frames.length === 0 && (
        <div className="dark:text-gray-400 text-gray-600 text-sm text-center py-4">
          No chords detected yet. Play some music to see chord recognition.
        </div>
      )}
    </motion.div>
  );
};

