import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAllSongs,
  searchSongs,
  deleteSong,
  getSongsByInstrument,
  type SavedSong,
} from '@/utils/songStorage';
import { initializeJingleBells } from '@/utils/sampleSongs';
import type { TranscriptionData } from '@/types/transcription';

interface SongLibraryProps {
  currentInstrument: string;
  onLoadSong: (song: SavedSong) => void;
  onPlaySong: (song: SavedSong) => void;
}

export const SongLibrary: React.FC<SongLibraryProps> = ({
  currentInstrument,
  onLoadSong,
  onPlaySong,
}) => {
  const [songs, setSongs] = useState<SavedSong[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<SavedSong[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterByInstrument, setFilterByInstrument] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    loadSongs();
    // Auto-initialize Jingle Bells if it doesn't exist
    checkAndInitializeJingleBells();
  }, []);

  const checkAndInitializeJingleBells = async () => {
    try {
      // Check if Jingle Bells exists for any instrument
      const allSongs = await getAllSongs();
      const hasJingleBellsSong = allSongs.some(
        (song) => song.name.toLowerCase() === 'jingle bells'
      );
      
      // If no Jingle Bells exists, initialize it
      if (!hasJingleBellsSong) {
        await initializeJingleBells();
        await loadSongs();
      }
    } catch (error) {
      console.error('Failed to auto-initialize Jingle Bells:', error);
      // Don't show error to user, just log it
    }
  };

  useEffect(() => {
    filterSongs();
  }, [searchQuery, filterByInstrument, songs, currentInstrument]);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      const allSongs = await getAllSongs();
      setSongs(allSongs);
    } catch (error) {
      console.error('Failed to load songs:', error);
      alert('Failed to load songs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeJingleBells = async () => {
    try {
      setIsInitializing(true);
      await initializeJingleBells();
      await loadSongs();
      alert('Jingle Bells added to library for all instruments!');
    } catch (error) {
      console.error('Failed to initialize Jingle Bells:', error);
      alert('Failed to initialize Jingle Bells');
    } finally {
      setIsInitializing(false);
    }
  };

  const filterSongs = async () => {
    let filtered = songs;

    // Filter by instrument if enabled
    if (filterByInstrument) {
      filtered = filtered.filter((song) => song.instrument === currentInstrument);
    }

    // Search filter
    if (searchQuery.trim()) {
      try {
        filtered = await searchSongs(searchQuery);
        if (filterByInstrument) {
          filtered = filtered.filter((song) => song.instrument === currentInstrument);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }

    setFilteredSongs(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSong(id);
      await loadSongs();
      setShowDeleteConfirm(null);
    } catch (error) {
      alert('Failed to delete song');
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gray-800/50 rounded-lg p-6 text-center text-gray-400">
        Loading songs...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gold mb-2">🎵 Song Library</h3>
        <p className="text-sm text-gray-400">
          {filteredSongs.length} song{filteredSongs.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs by name, instrument, or tags..."
            className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadSongs}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
          >
            🔄 Refresh
          </motion.button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="filterInstrument"
              checked={filterByInstrument}
              onChange={(e) => setFilterByInstrument(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="filterInstrument" className="text-sm text-gray-400">
              Show only {currentInstrument} songs
            </label>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInitializeJingleBells}
            disabled={isInitializing}
            className="px-4 py-2 bg-gold hover:bg-gold-light dark:text-gray-900 text-gray-900 rounded-lg font-semibold border border-gold-dark/30 dark:border-gold-dark/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isInitializing ? '⏳ Adding...' : '🎄 Add Jingle Bells'}
          </motion.button>
        </div>
      </div>

      {/* Song List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredSongs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchQuery ? 'No songs found matching your search' : 'No songs saved yet. Record a session to save it!'}
          </div>
        ) : (
          filteredSongs.map((song) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white text-lg mb-1">{song.name}</div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      📅 {formatDate(song.createdAt)} | 🎸 {song.instrument} | 
                      ⏱️ {formatDuration(song.duration)}
                    </div>
                    <div>
                      🎵 {song.noteCount || 0} notes | 🎹 {song.chordCount || 0} chords
                    </div>
                    {song.tags && song.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {song.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-teal/20 text-teal rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onLoadSong(song)}
                    className="px-3 py-1 bg-teal hover:bg-teal-light text-white rounded text-sm font-semibold"
                  >
                    Load
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onPlaySong(song)}
                    className="px-3 py-1 bg-gold hover:bg-gold-light dark:text-gray-900 text-gray-900 rounded text-sm font-semibold border border-gold-dark/30 dark:border-gold-dark/50"
                  >
                    Play
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeleteConfirm(song.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-red-400 mb-4">Delete Song?</h3>
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete this song? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                >
                  Delete
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


