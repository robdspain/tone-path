// Live Note Display component for trumpet and other single-note instruments
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NoteEvent } from '@/types/transcription';
import type { Instrument } from '@/types/transcription';
import { getTrumpetFingeringLabel } from '@/utils/trumpetFingerings';

interface LiveNoteDisplayProps {
  currentNote: NoteEvent | null;
  recentNotes: NoteEvent[];
  instrument: Instrument;
}

// Note colors for visual distinction
const NOTE_COLORS: Record<string, string> = {
  C: 'bg-red-500',
  'C#': 'bg-red-600',
  D: 'bg-orange-500',
  'D#': 'bg-orange-600',
  E: 'bg-yellow-500',
  F: 'bg-green-500',
  'F#': 'bg-green-600',
  G: 'bg-blue-500',
  'G#': 'bg-blue-600',
  A: 'bg-indigo-500',
  'A#': 'bg-indigo-600',
  B: 'bg-purple-500',
};

function getNoteName(note: string): string {
  return note.replace(/\d/g, '');
}

function getOctave(note: string): number {
  const match = note.match(/\d+/);
  return match ? parseInt(match[0]) : 4;
}

export const LiveNoteDisplay: React.FC<LiveNoteDisplayProps> = ({
  currentNote,
  recentNotes,
  instrument,
}) => {
  const [noteHistory, setNoteHistory] = useState<NoteEvent[]>([]);

  // Update note history from current note
  useEffect(() => {
    if (currentNote) {
      setNoteHistory((prev) => {
        // Avoid duplicates by checking timestamp
        const exists = prev.some(n => Math.abs(n.timestamp - currentNote.timestamp) < 0.01);
        if (exists) return prev;
        const updated = [...prev, currentNote].slice(-20); // Keep last 20 notes
        return updated;
      });
    }
  }, [currentNote]);

  // Also populate from recentNotes if provided
  useEffect(() => {
    if (recentNotes && recentNotes.length > 0) {
      setNoteHistory((prev) => {
        // Merge with existing, avoiding duplicates
        const merged = [...prev];
        recentNotes.forEach(note => {
          const exists = merged.some(n => Math.abs(n.timestamp - note.timestamp) < 0.01);
          if (!exists) {
            merged.push(note);
          }
        });
        return merged.slice(-20).sort((a, b) => a.timestamp - b.timestamp);
      });
    }
  }, [recentNotes]);

  const getFingering = (note: string): string | null => {
    if (instrument === 'trumpet') {
      return getTrumpetFingeringLabel(note);
    }
    return null;
  };

  const getNoteColor = (note: string): string => {
    const noteName = getNoteName(note);
    return NOTE_COLORS[noteName] || 'bg-gray-500';
  };

  const formatDuration = (duration: number): string => {
    if (duration < 0.1) return 'Staccato';
    if (duration < 0.3) return 'Short';
    if (duration < 0.6) return 'Medium';
    if (duration < 1.0) return 'Long';
    return 'Very Long';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-6"
    >
      <div className="text-sm text-gray-400 mb-4">
        Live Note Display {instrument === 'trumpet' && '🎺'}
        {instrument === 'guitar' && '🎸'}
        {instrument === 'bass' && '🎸'}
        {instrument === 'ukulele' && '🎸'}
      </div>

      {/* Current Note - Large Display */}
      {currentNote ? (
        <div className="mb-6">
          <div className="text-center">
            <motion.div
              key={currentNote.timestamp}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`inline-block ${getNoteColor(currentNote.note)} rounded-lg px-8 py-6 mb-4`}
            >
              <div className="text-6xl font-bold text-white mb-2">
                {currentNote.note}
              </div>
              <div className="text-lg text-white/80">
                {currentNote.frequency.toFixed(1)} Hz
              </div>
              {instrument === 'trumpet' && getFingering(currentNote.note) && (
                <div className="text-sm text-white/60 mt-2">
                  Fingering: {getFingering(currentNote.note)}
                </div>
              )}
            </motion.div>
            
            <div className="text-sm dark:text-gray-300 text-gray-700 space-y-1">
              <div>
                Duration: {formatDuration(currentNote.duration)} ({currentNote.duration.toFixed(2)}s)
              </div>
              <div>
                Confidence: {(currentNote.confidence ? currentNote.confidence * 100 : 0).toFixed(0)}%
              </div>
              <div>
                Octave: {getOctave(currentNote.note)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">🎵</div>
          <div>No note detected</div>
          <div className="text-sm text-gray-600 mt-2">
            Play a note to see live display
          </div>
        </div>
      )}

      {/* Recent Notes Sequence */}
      {noteHistory.length > 0 && (
        <div className="mt-6">
          <div className="text-sm text-gray-400 mb-3">Recent Notes</div>
          <div className="flex gap-2 flex-wrap justify-center">
            <AnimatePresence>
              {noteHistory.slice(-12).map((note, index) => {
                const isCurrent = note === currentNote;
                const noteName = getNoteName(note.note);
                
                return (
                  <motion.div
                    key={`${note.timestamp}-${index}`}
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ 
                      opacity: isCurrent ? 1 : 0.7,
                      scale: isCurrent ? 1.1 : 1,
                      y: 0,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`${getNoteColor(note.note)} rounded-lg px-4 py-2 text-center min-w-[60px] ${
                      isCurrent ? 'ring-2 ring-gold ring-offset-2 ring-offset-gray-800' : ''
                    }`}
                  >
                    <div className="text-lg font-bold text-white">
                      {note.note}
                    </div>
                    {instrument === 'trumpet' && getFingering(note.note) && (
                      <div className="text-xs text-white/70 mt-1">
                        {getFingering(note.note)}
                      </div>
                    )}
                    <div className="text-xs text-white/60 mt-1">
                      {note.duration.toFixed(1)}s
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Note Statistics */}
      {noteHistory.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-gray-400">Total Notes</div>
              <div className="text-xl font-bold text-gold">{noteHistory.length}</div>
            </div>
            <div>
              <div className="text-gray-400">Unique Notes</div>
              <div className="text-xl font-bold text-teal">
                {new Set(noteHistory.map(n => n.note)).size}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Avg Duration</div>
              <div className="text-xl font-bold text-blue-400">
                {(noteHistory.reduce((sum, n) => sum + n.duration, 0) / noteHistory.length).toFixed(2)}s
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
