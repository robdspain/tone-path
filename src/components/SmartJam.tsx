import { motion } from 'framer-motion';
import { useBackingTrack } from '@/hooks/useBackingTrack';
import type { ChordEvent, NoteEvent } from '@/types/transcription';

interface SmartJamProps {
  detectedChords: ChordEvent[];
  detectedNotes: NoteEvent[];
  tempo: number;
}

export const SmartJam: React.FC<SmartJamProps> = ({
  detectedChords,
  detectedNotes,
  tempo,
}) => {
  const {
    isPlaying,
    volume,
    drumsEnabled,
    bassEnabled,
    currentPattern,
    play,
    stop,
    setVolume,
    toggleDrums,
    toggleBass,
    setTempo,
  } = useBackingTrack(detectedChords, detectedNotes, tempo);

  const hasChords = detectedChords.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gold mb-2">🎸 Smart Jam - Virtual Band</h3>
        <p className="text-sm text-gray-400">
          {hasChords
            ? `Detected ${detectedChords.length} chord${detectedChords.length !== 1 ? 's' : ''} - Backing track ready!`
            : 'Play some chords to generate a backing track'}
        </p>
        {currentPattern && (
          <p className="text-xs text-gray-500 mt-1">Pattern: {currentPattern}</p>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Play/Stop */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isPlaying ? stop : play}
            disabled={!hasChords}
            className={`px-6 py-2 rounded-lg font-semibold ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-teal hover:bg-teal-light text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPlaying ? '⏹ Stop Band' : '▶ Start Band'}
          </motion.button>
        </div>

        {/* Instrument Toggles */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleDrums}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 border-2 ${
              drumsEnabled
                ? 'bg-gold dark:text-gray-900 text-gray-900 border-gold-dark/30 dark:border-gold-dark/50'
                : 'dark:bg-gray-700 bg-gray-600 dark:text-gray-300 text-gray-900 dark:hover:bg-gray-600 hover:bg-gray-700 border-transparent'
            }`}
          >
            🥁 Drums {drumsEnabled ? 'ON' : 'OFF'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleBass}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 border-2 ${
              bassEnabled
                ? 'bg-gold dark:text-gray-900 text-gray-900 border-gold-dark/30 dark:border-gold-dark/50'
                : 'dark:bg-gray-700 bg-gray-600 dark:text-gray-300 text-gray-900 dark:hover:bg-gray-600 hover:bg-gray-700 border-transparent'
            }`}
          >
            🎸 Bass {bassEnabled ? 'ON' : 'OFF'}
          </motion.button>
        </div>

        {/* Volume Control */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Tempo Control */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Tempo: {tempo} BPM
          </label>
          <input
            type="range"
            min="60"
            max="180"
            step="1"
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Info */}
        {!hasChords && (
          <div className="p-3 bg-gray-700/50 rounded-lg text-sm text-gray-400">
            💡 Tip: Start playing chords on your instrument to generate a backing track!
          </div>
        )}

        {hasChords && !isPlaying && (
          <div className="p-3 bg-teal/20 rounded-lg text-sm text-teal">
            ✨ Ready! Click "Start Band" to begin the backing track.
          </div>
        )}

        {isPlaying && (
          <div className="p-3 bg-gold/20 rounded-lg text-sm text-gold">
            🎵 Virtual band is playing! Keep playing to update the backing track.
          </div>
        )}
      </div>
    </motion.div>
  );
};


