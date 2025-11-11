// Smart Jam AI controls component
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useJamAI } from '@/hooks/useJamAI';
import type { JamStyle } from '@/types/jam';
import type { ChordEvent, NoteEvent } from '@/types/transcription';

interface JamAIControlsProps {
  detectedChords: ChordEvent[];
  detectedNotes: NoteEvent[];
  onStartJam?: () => void;
}

export const JamAIControls: React.FC<JamAIControlsProps> = ({
  detectedChords,
  detectedNotes,
  onStartJam,
}) => {
  const { session, createJam, loading, error, clearSession } = useJamAI();
  const [style, setStyle] = useState<JamStyle>('funk');
  const [bars, setBars] = useState(4);

  const handleStartJam = async () => {
    try {
      // Detect key and tempo from user input
      const detectedKey = detectKey(detectedChords, detectedNotes);
      const detectedBpm = detectTempo(detectedNotes);
      
      const input = {
        key: detectedKey || 'C',
        bpm: detectedBpm || 120,
        style,
        bars,
        detectedChords: detectedChords.map(c => c.chord),
      };

      await createJam(input);
      onStartJam?.();
    } catch (error) {
      console.error('Error starting jam:', error);
      // Error will be handled by useJamAI hook
    }
  };

  const styles: JamStyle[] = ['rock', 'blues', 'funk', 'jazz', 'pop'];
  const styleLabels: Partial<Record<JamStyle, string>> = {
    rock: '🎸 Rock',
    blues: '🎵 Blues',
    funk: '🎺 Funk',
    jazz: '🎷 Jazz',
    pop: '🎤 Pop',
    lofi: '🎧 Lo-Fi',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gold mb-2">
          🎸 Smart Jam AI - Virtual Band
        </h3>
        <p className="text-sm dark:text-gray-300 text-gray-700">
          {detectedChords.length > 0
            ? `Detected ${detectedChords.length} chord${detectedChords.length !== 1 ? 's' : ''} - Ready to generate backing track!`
            : 'Play some chords or notes to generate a backing track'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {session ? (
        <div className="space-y-4">
          <div className="p-4 dark:bg-gray-700/50 bg-gray-200/80 rounded-lg">
            <div className="text-sm dark:text-gray-300 text-gray-800 mb-2">
              Pattern Generated: {session.input.key} @ {session.input.bpm} BPM ({session.input.style})
            </div>
            <div className="text-xs dark:text-gray-300 text-gray-600">
              {session.pattern.drums.length} drum hits, {session.pattern.bass.length} bass notes
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearSession}
            className="px-4 py-2 dark:bg-gray-700 bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-700 dark:text-white text-white rounded-lg font-semibold"
          >
            Clear & Generate New
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Style Selection */}
          <div>
            <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Style</label>
            <div className="flex gap-2 flex-wrap">
              {styles.map((s) => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStyle(s)}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    style === s
                      ? 'bg-gold dark:text-gray-900 text-gray-900 border-2 border-gold-dark/30 dark:border-gold-dark/50'
                      : 'dark:bg-gray-700 bg-gray-600 dark:text-gray-300 text-gray-900 dark:hover:bg-gray-600 hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  {styleLabels[s]}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bars Selection */}
          <div>
            <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">
              Length: {bars} bar{bars !== 1 ? 's' : ''}
            </label>
            <input
              type="range"
              min="2"
              max="16"
              step="2"
              value={bars}
              onChange={(e) => setBars(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            onClick={handleStartJam}
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg font-semibold bg-teal hover:bg-teal-light dark:text-white text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🎵 Generating Pattern...' : '🎸 Start Jam'}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

// Helper functions
function detectKey(chords: ChordEvent[], notes: NoteEvent[]): string | null {
  if (chords.length === 0 && notes.length === 0) return null;
  
  // Simple key detection based on most common root note
  const rootCounts: Record<string, number> = {};
  
  chords.forEach(chord => {
    const root = chord.chord.replace(/[^A-G]/, '').toUpperCase();
    rootCounts[root] = (rootCounts[root] || 0) + 1;
  });
  
  notes.forEach(note => {
    const root = note.note.replace(/\d/, '').replace('#', '').toUpperCase();
    rootCounts[root] = (rootCounts[root] || 0) + 0.5;
  });
  
  const mostCommon = Object.entries(rootCounts).reduce((a, b) => 
    a[1] > b[1] ? a : b
  );
  
  return mostCommon ? mostCommon[0] : null;
}

function detectTempo(notes: NoteEvent[]): number | null {
  if (notes.length < 4) return null;
  
  // Simple tempo detection based on note intervals
  const intervals: number[] = [];
  for (let i = 1; i < notes.length; i++) {
    const interval = notes[i].timestamp - notes[i - 1].timestamp;
    if (interval > 0.1 && interval < 2) { // Filter out outliers
      intervals.push(interval);
    }
  }
  
  if (intervals.length === 0) return null;
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = 60 / avgInterval;
  
  // Clamp to reasonable range
  return Math.max(60, Math.min(180, Math.round(bpm)));
}

