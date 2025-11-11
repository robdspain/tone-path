// Song Note Display - Shows notes from a playing song synchronized with playback time
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NoteEvent, TranscriptionData, Instrument } from '@/types/transcription';
import { TrumpetNoteDisplay } from './TrumpetNoteDisplay';

interface SongNoteDisplayProps {
  songData: TranscriptionData | null;
  currentTime: number; // Current playback time in seconds
  isPlaying: boolean;
  instrument: Instrument;
}

// Trumpet fingerings (simplified - shows common fingerings)
const TRUMPET_FINGERINGS: Record<string, string> = {
  'C4': 'Open',
  'C#4': '2',
  'D4': '1',
  'D#4': '1-2',
  'E4': '2-3',
  'F4': '1',
  'F#4': '2',
  'G4': 'Open',
  'G#4': '2-3',
  'A4': '1-2',
  'A#4': '2',
  'B4': '1',
  'C5': 'Open',
  'C#5': '2',
  'D5': '1',
  'D#5': '1-2',
  'E5': '2-3',
  'F5': '1',
  'F#5': '2',
  'G5': 'Open',
};

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

export const SongNoteDisplay: React.FC<SongNoteDisplayProps> = ({
  songData,
  currentTime,
  isPlaying,
  instrument,
}) => {
  // Extract all note events from song data
  const noteEvents = useMemo(() => {
    if (!songData) return [];
    return songData.events
      .filter((e): e is NoteEvent => 'note' in e)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [songData]);

  // Find the current note being played (within a small time window)
  // When not playing, show the first note
  const currentNote = useMemo(() => {
    if (!songData || noteEvents.length === 0) return null;
    
    const startTime = songData.startTime || 0;
    
    // If not playing, show the first note
    if (!isPlaying && currentTime === 0) {
      return noteEvents[0];
    }
    
    const relativeTime = currentTime;
    const tolerance = 0.2; // 200ms tolerance for note matching

    // Find notes that are currently active (started but not ended)
    const activeNotes = noteEvents.filter((note) => {
      const noteStart = note.timestamp - startTime;
      const noteEnd = noteStart + note.duration;
      return relativeTime >= noteStart - tolerance && relativeTime <= noteEnd + tolerance;
    });

    if (activeNotes.length === 0) {
      // If no active note, show the first upcoming note or the first note
      const upcomingNote = noteEvents.find((note) => {
        const noteStart = note.timestamp - startTime;
        return noteStart >= relativeTime;
      });
      return upcomingNote || noteEvents[0];
    }

    // Return the note that started most recently before or at current time
    const sortedByStart = activeNotes.sort((a, b) => {
      const aStart = a.timestamp - startTime;
      const bStart = b.timestamp - startTime;
      return bStart - aStart; // Most recent first
    });

    return sortedByStart[0];
  }, [songData, currentTime, noteEvents, isPlaying]);

  // Get upcoming notes (next 3-5 notes)
  // When not playing, show first few notes
  const upcomingNotes = useMemo(() => {
    if (!songData || noteEvents.length === 0) return [];
    
    const startTime = songData.startTime || 0;
    const relativeTime = currentTime;
    
    // If not playing, show first 5 notes
    if (!isPlaying && currentTime === 0) {
      return noteEvents.slice(0, 5);
    }
    
    return noteEvents
      .filter((note) => {
        const noteStart = note.timestamp - startTime;
        return noteStart > relativeTime && noteStart <= relativeTime + 3; // Next 3 seconds
      })
      .slice(0, 5); // Show up to 5 upcoming notes
  }, [songData, currentTime, noteEvents, isPlaying]);

  // Get recent notes (last 5 notes)
  const recentNotes = useMemo(() => {
    if (!songData || noteEvents.length === 0) return [];
    
    const startTime = songData.startTime || 0;
    const relativeTime = currentTime;
    
    return noteEvents
      .filter((note) => {
        const noteStart = note.timestamp - startTime;
        return noteStart < relativeTime && noteStart >= relativeTime - 2; // Last 2 seconds
      })
      .slice(-5); // Last 5 notes
  }, [songData, currentTime, noteEvents]);

  const getFingering = (note: string): string | null => {
    if (instrument === 'trumpet') {
      return TRUMPET_FINGERINGS[note] || null;
    }
    return null;
  };

  const getNoteColor = (note: string): string => {
    const noteName = getNoteName(note);
    return NOTE_COLORS[noteName] || 'bg-gray-500';
  };

  if (!songData || noteEvents.length === 0) {
    return (
      <div className="w-full bg-gray-800/50 rounded-lg p-6 text-center">
        <div className="text-gray-500 mb-2">🎵</div>
        <div className="text-gray-400">No song loaded</div>
        <div className="text-sm text-gray-600 mt-2">
          Load a song from the library to see notes
        </div>
      </div>
    );
  }

  // For trumpet, show musical notation with valve indicators
  if (instrument === 'trumpet' && noteEvents.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gray-800/50 rounded-lg p-6"
      >
        <div className="text-sm dark:text-gray-300 text-gray-700 mb-4">
          Song Notes 🎺
          {isPlaying && <span className="ml-2 text-teal">● Playing</span>}
        </div>
        <TrumpetNoteDisplay
          notes={noteEvents}
          currentTime={(songData.startTime || 0) + currentTime}
          isPlaying={isPlaying}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-6"
    >
      <div className="text-sm dark:text-gray-300 text-gray-700 mb-4">
        Song Notes {instrument === 'trumpet' && '🎺'}
        {instrument === 'guitar' && '🎸'}
        {instrument === 'bass' && '🎸'}
        {instrument === 'ukulele' && '🎸'}
        {isPlaying && <span className="ml-2 text-teal">● Playing</span>}
      </div>

      {/* Current Note - Large Display */}
      {currentNote ? (
        <div className="mb-6">
          <div className="text-center">
            <motion.div
              key={`${currentNote.timestamp}-${currentTime}`}
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
                Duration: {currentNote.duration.toFixed(2)}s
              </div>
              <div>
                Confidence: {(currentNote.confidence ? currentNote.confidence * 100 : 0).toFixed(0)}%
              </div>
              <div>
                Octave: {getOctave(currentNote.note)}
              </div>
              {!isPlaying && currentTime === 0 && (
                <div className="text-teal text-xs mt-2">
                  Ready to play - First note shown
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">🎵</div>
          <div>No note at this time</div>
          {!isPlaying && (
            <div className="text-sm text-gray-600 mt-2">
              Press play to see notes
            </div>
          )}
        </div>
      )}

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <div className="mt-6">
          <div className="text-sm text-gray-400 mb-3">Recent Notes</div>
          <div className="flex gap-2 flex-wrap justify-center">
            {recentNotes.map((note, index) => {
              const noteName = getNoteName(note.note);
              return (
                <motion.div
                  key={`recent-${note.timestamp}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.6, scale: 1 }}
                  className={`${getNoteColor(note.note)} rounded-lg px-3 py-2 text-center min-w-[50px]`}
                >
                  <div className="text-sm font-bold text-white">
                    {note.note}
                  </div>
                  {instrument === 'trumpet' && getFingering(note.note) && (
                    <div className="text-xs text-white/70 mt-1">
                      {getFingering(note.note)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Notes */}
      {upcomingNotes.length > 0 && (
        <div className="mt-6">
          <div className="text-sm text-gray-400 mb-3">Upcoming Notes</div>
          <div className="flex gap-2 flex-wrap justify-center">
            {upcomingNotes.map((note, index) => {
              const noteName = getNoteName(note.note);
              const startTime = songData.startTime || 0;
              const noteStart = note.timestamp - startTime;
              const timeUntil = (noteStart - currentTime).toFixed(1);
              
              return (
                <motion.div
                  key={`upcoming-${note.timestamp}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  className={`${getNoteColor(note.note)} rounded-lg px-3 py-2 text-center min-w-[50px] border-2 border-dashed border-white/30`}
                >
                  <div className="text-sm font-bold text-white">
                    {note.note}
                  </div>
                  {instrument === 'trumpet' && getFingering(note.note) && (
                    <div className="text-xs text-white/70 mt-1">
                      {getFingering(note.note)}
                    </div>
                  )}
                  <div className="text-xs text-white/60 mt-1">
                    {isPlaying ? `+${timeUntil}s` : `#${index + 1}`}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Song Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-400">Total Notes</div>
            <div className="text-xl font-bold text-gold">{noteEvents.length}</div>
          </div>
          <div>
            <div className="text-gray-400">Unique Notes</div>
            <div className="text-xl font-bold text-teal">
              {new Set(noteEvents.map(n => n.note)).size}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Progress</div>
            <div className="text-xl font-bold text-blue-400">
              {songData.endTime ? `${((currentTime / (songData.endTime - songData.startTime)) * 100).toFixed(0)}%` : '--'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

