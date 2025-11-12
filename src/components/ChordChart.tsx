import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { ChordEvent } from '@/types/transcription';

interface ChordChartProps {
  chords: ChordEvent[];
  currentTime?: number;
  showAll?: boolean; // New prop to show all chords
}

export const ChordChart: React.FC<ChordChartProps> = ({
  chords,
  currentTime = 0,
  showAll = false,
}) => {
  // Show all chords if showAll is true or currentTime is 0 (song loaded but not playing)
  // Otherwise show recent chords based on currentTime
  const displayChords = useMemo(() => {
    if (chords.length === 0) return [];
    
    // If showAll is true, show all chords
    if (showAll) {
      return chords;
    }
    
    // If currentTime is 0, show all chords (song just loaded)
    if (currentTime === 0) {
      return chords; // Show all chords instead of just last 10
    }
    
    // Otherwise filter by currentTime
    const recentChords = chords
      .filter((chord) => chord.timestamp >= currentTime - 2)
      .slice(-5);
    
    return recentChords.length > 0 ? recentChords : chords.slice(-5);
  }, [chords, currentTime, showAll]);

  return (
    <div className="w-full bg-gray-800/50 rounded-lg p-4">
      <div className="text-sm dark:text-gray-300 text-gray-700 mb-2 flex items-center justify-between">
        <span>Chord Chart</span>
        {chords.length > 0 && (
          <span className="text-xs dark:text-gray-400 text-gray-600">
            {chords.length} chord{chords.length !== 1 ? 's' : ''} detected
          </span>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {displayChords.length === 0 ? (
          <div className="w-full py-6 text-center">
            <div className="dark:text-gray-400 text-gray-600 text-sm mb-2">No chords detected</div>
            <div className="text-xs dark:text-gray-500 text-gray-600 space-y-1">
              <p>💡 Tips for chord detection:</p>
              <ul className="list-disc list-inside text-left max-w-md mx-auto space-y-1">
                <li>Play 3+ notes simultaneously (guitar/ukulele)</li>
                <li>Or play notes quickly in sequence (within 0.5s)</li>
                <li>Try playing common chords like C, G, Am, F</li>
                <li>Make sure "Start Listening" is active</li>
              </ul>
            </div>
          </div>
        ) : (
          displayChords.map((chord, index) => (
            <motion.div
              key={`${chord.timestamp}-${index}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 dark:bg-teal-deep/50 bg-teal-200/70 rounded-lg p-4 min-w-[120px] text-center"
            >
              <div className="text-2xl font-bold text-gold mb-1">{chord.chord}</div>
            <div className="text-xs dark:text-gray-300 text-gray-600">
              {chord.notes.join(' ')}
            </div>
            <div className="text-xs dark:text-gray-400 text-gray-600 mt-1">
                {(chord.confidence * 100).toFixed(0)}% confidence
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

