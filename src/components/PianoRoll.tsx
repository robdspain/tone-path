import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { NoteEvent } from '@/types/transcription';

interface PianoRollProps {
  notes: NoteEvent[];
  currentTime?: number;
  height?: number;
}

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

export const PianoRoll: React.FC<PianoRollProps> = ({
  notes,
  currentTime = 0,
  height = 400,
}) => {
  const [visibleNotes, setVisibleNotes] = useState<NoteEvent[]>([]);
  const timeWindow = 5; // Show 5 seconds of notes

  useEffect(() => {
    const filtered = notes.filter(
      (note) => note.timestamp >= currentTime - timeWindow && note.timestamp <= currentTime + timeWindow
    );
    setVisibleNotes(filtered);
  }, [notes, currentTime]);

  // Calculate note positions
  const minOctave = Math.min(...visibleNotes.map((n) => getOctave(n.note)), 3);
  const maxOctave = Math.max(...visibleNotes.map((n) => getOctave(n.note)), 6);
  const octaveRange = maxOctave - minOctave + 1;
  const noteHeight = height / (octaveRange * 12);

  const getNoteY = (note: string): number => {
    const noteName = getNoteName(note);
    const octave = getOctave(note);
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = noteOrder.indexOf(noteName);
    const totalNotes = (octave - minOctave) * 12 + noteIndex;
    return height - (totalNotes + 1) * noteHeight;
  };

  const getNoteX = (timestamp: number): number => {
    const relativeTime = timestamp - (currentTime - timeWindow);
    return (relativeTime / (timeWindow * 2)) * 100;
  };

  const getNoteWidth = (duration: number): number => {
    return (duration / (timeWindow * 2)) * 100;
  };

  return (
    <div className="w-full bg-gray-800/50 rounded-lg p-4 overflow-hidden">
      <div className="text-sm text-gray-400 mb-2">Piano Roll</div>
      <div className="relative" style={{ height: `${height}px` }}>
        {visibleNotes.map((note, index) => {
          const noteName = getNoteName(note.note);
          const color = NOTE_COLORS[noteName] || 'bg-gray-500';
          const x = getNoteX(note.timestamp);
          const y = getNoteY(note.note);
          const width = Math.max(getNoteWidth(note.duration), 1);

          return (
            <motion.div
              key={`${note.timestamp}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute ${color} rounded note-active`}
              style={{
                left: `${x}%`,
                top: `${y}px`,
                width: `${width}%`,
                height: `${noteHeight}px`,
                zIndex: 10,
              }}
            >
              <div className="text-xs text-white p-1 truncate">{note.note}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

