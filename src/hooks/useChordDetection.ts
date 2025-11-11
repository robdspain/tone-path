import { useState, useRef, useEffect } from 'react';
import type { ChordEvent, NoteEvent } from '@/types/transcription';

// Enhanced chord patterns with more variations
const CHORD_PATTERNS: Record<string, string[]> = {
  // Major chords
  'C': ['C', 'E', 'G'],
  'D': ['D', 'F#', 'A'],
  'E': ['E', 'G#', 'B'],
  'F': ['F', 'A', 'C'],
  'G': ['G', 'B', 'D'],
  'A': ['A', 'C#', 'E'],
  'B': ['B', 'D#', 'F#'],
  
  // Minor chords
  'Cm': ['C', 'D#', 'G'],
  'Dm': ['D', 'F', 'A'],
  'Em': ['E', 'G', 'B'],
  'Fm': ['F', 'G#', 'C'],
  'Gm': ['G', 'A#', 'D'],
  'Am': ['A', 'C', 'E'],
  'Bm': ['B', 'D', 'F#'],
  
  // Seventh chords
  'C7': ['C', 'E', 'G', 'A#'],
  'D7': ['D', 'F#', 'A', 'C'],
  'E7': ['E', 'G#', 'B', 'D'],
  'F7': ['F', 'A', 'C', 'D#'],
  'G7': ['G', 'B', 'D', 'F'],
  'A7': ['A', 'C#', 'E', 'G'],
  'B7': ['B', 'D#', 'F#', 'A'],
  
  // Major 7th
  'Cmaj7': ['C', 'E', 'G', 'B'],
  'Dmaj7': ['D', 'F#', 'A', 'C#'],
  'Emaj7': ['E', 'G#', 'B', 'D#'],
  'Fmaj7': ['F', 'A', 'C', 'E'],
  'Gmaj7': ['G', 'B', 'D', 'F#'],
  'Amaj7': ['A', 'C#', 'E', 'G#'],
  'Bmaj7': ['B', 'D#', 'F#', 'A#'],
  
  // Minor 7th
  'Cm7': ['C', 'D#', 'G', 'A#'],
  'Dm7': ['D', 'F', 'A', 'C'],
  'Em7': ['E', 'G', 'B', 'D'],
  'Fm7': ['F', 'G#', 'C', 'D#'],
  'Gm7': ['G', 'A#', 'D', 'F'],
  'Am7': ['A', 'C', 'E', 'G'],
  'Bm7': ['B', 'D', 'F#', 'A'],
  
  // Suspended chords
  'Csus2': ['C', 'D', 'G'],
  'Csus4': ['C', 'F', 'G'],
  'Dsus2': ['D', 'E', 'A'],
  'Dsus4': ['D', 'G', 'A'],
  'Gsus2': ['G', 'A', 'D'],
  'Gsus4': ['G', 'C', 'D'],
};

function getNoteName(note: string): string {
  return note.replace(/\d/g, '');
}

function getOctave(note: string): number {
  const match = note.match(/\d/);
  return match ? parseInt(match[0]) : 4;
}

// Enhanced chord detection with confidence scoring
function detectChordFromNotes(notes: string[]): { chord: string; confidence: number } | null {
  if (notes.length < 3) return null;

  const noteNames = notes.map(getNoteName);
  const uniqueNotes = [...new Set(noteNames)];

  let bestMatch: { chord: string; confidence: number } | null = null;
  let bestScore = 0;

  for (const [chord, pattern] of Object.entries(CHORD_PATTERNS)) {
    const matches = pattern.filter((note) => uniqueNotes.includes(note));
    const score = matches.length / pattern.length;
    
    // Require at least 3 matching notes and high confidence
    if (matches.length >= 3 && score > bestScore) {
      bestScore = score;
      bestMatch = {
        chord,
        confidence: Math.min(score * 1.2, 1.0), // Boost confidence slightly
      };
    }
  }

  return bestMatch && bestScore > 0.7 ? bestMatch : null;
}

export const useChordDetection = () => {
  const [currentChord, setCurrentChord] = useState<ChordEvent | null>(null);
  const activeNotesRef = useRef<Map<string, number>>(new Map());
  const chordHistoryRef = useRef<ChordEvent[]>([]);
  const detectionWindowRef = useRef<number>(0.8); // 800ms window (increased for sequential playing)

  // Update chord detection based on active notes
  const updateChord = (notes: NoteEvent[], timestamp: number) => {
    const now = timestamp;
    const windowStart = now - detectionWindowRef.current;

    // Filter notes within detection window (increased window for sequential playing)
    const recentNotes = notes.filter((n) => n.timestamp >= windowStart);
    
    // Need at least 2 notes to attempt chord detection (lowered from 3)
    if (recentNotes.length < 2) {
      setCurrentChord(null);
      return;
    }

    // Extract unique note names (ignoring octave for chord detection)
    const noteNames = recentNotes.map((n) => getNoteName(n.note));
    const uniqueNotes = [...new Set(noteNames)];

    // If we have 2 notes, try to infer the third note of a chord
    if (uniqueNotes.length === 2 && recentNotes.length >= 2) {
      // Try to detect partial chords (power chords, intervals)
      const result = detectPartialChord(uniqueNotes);
      if (result && result.confidence > 0.6) {
        const chordNotes = recentNotes
          .map((n) => n.note)
          .filter((note, index, self) => self.indexOf(note) === index)
          .slice(0, 6);

        const chordEvent: ChordEvent = {
          timestamp: now,
          chord: result.chord,
          notes: chordNotes,
          confidence: result.confidence,
        };

        const lastChord = chordHistoryRef.current[chordHistoryRef.current.length - 1];
        if (!lastChord || lastChord.chord !== chordEvent.chord || now - lastChord.timestamp > 0.5) {
          setCurrentChord(chordEvent);
          chordHistoryRef.current.push(chordEvent);
          if (chordHistoryRef.current.length > 10) {
            chordHistoryRef.current.shift();
          }
        }
        return;
      }
    }

    // Full chord detection (3+ notes)
    const result = detectChordFromNotes(uniqueNotes);
    
    if (result && result.confidence > 0.6) { // Lowered threshold from 0.7
      // Get full note names with octaves for the chord
      const chordNotes = recentNotes
        .map((n) => n.note)
        .filter((note, index, self) => self.indexOf(note) === index)
        .slice(0, 6); // Limit to 6 notes

      const chordEvent: ChordEvent = {
        timestamp: now,
        chord: result.chord,
        notes: chordNotes,
        confidence: result.confidence,
      };

      // Avoid duplicate chords
      const lastChord = chordHistoryRef.current[chordHistoryRef.current.length - 1];
      if (!lastChord || lastChord.chord !== chordEvent.chord || now - lastChord.timestamp > 0.3) {
        setCurrentChord(chordEvent);
        chordHistoryRef.current.push(chordEvent);
        if (chordHistoryRef.current.length > 10) {
          chordHistoryRef.current.shift();
        }
      }
    } else {
      setCurrentChord(null);
    }
  };

  // Detect partial chords (power chords, intervals) from 2 notes
  function detectPartialChord(notes: string[]): { chord: string; confidence: number } | null {
    if (notes.length !== 2) return null;

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const [note1, note2] = notes;
    const idx1 = noteNames.indexOf(note1);
    const idx2 = noteNames.indexOf(note2);

    if (idx1 === -1 || idx2 === -1) return null;

    const interval = (idx2 - idx1 + 12) % 12;

    // Power chord (root + 5th)
    if (interval === 7 || interval === 5) {
      const root = interval === 7 ? note1 : note2;
      return {
        chord: `${root}5`, // Power chord notation
        confidence: 0.75,
      };
    }

    // Major 3rd interval
    if (interval === 4) {
      return {
        chord: `${note1} (M3)`,
        confidence: 0.65,
      };
    }

    // Minor 3rd interval
    if (interval === 3) {
      return {
        chord: `${note1} (m3)`,
        confidence: 0.65,
      };
    }

    return null;
  }

  return {
    currentChord,
    updateChord,
  };
};
