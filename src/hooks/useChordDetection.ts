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

const ENHARMONIC_MAP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
};

function getNoteName(note: string): string {
  const sanitized = note
    .replace(/\d/g, '')
    .replace('♭', 'b')
    .replace('♯', '#')
    .trim();
  const letter = sanitized.charAt(0).toUpperCase();
  const accidental = sanitized.length > 1 ? sanitized.charAt(1) : '';
  const normalizedAccidental = accidental === 'b' || accidental === '#' ? accidental : '';
  return `${letter}${normalizedAccidental}`;
}

function normalizeNoteName(note: string): string {
  const base = getNoteName(note);
  return ENHARMONIC_MAP[base as keyof typeof ENHARMONIC_MAP] || base;
}

function getOctave(note: string): number {
  const match = note.match(/\d/);
  return match ? parseInt(match[0]) : 4;
}

// Enhanced chord detection with confidence scoring
function detectChordFromNotes(noteWeights: Record<string, number>): { chord: string; confidence: number } | null {
  const entries = Object.entries(noteWeights);
  if (!entries.length) return null;

  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight === 0) return null;

  let bestMatch: { chord: string; confidence: number } | null = null;
  let bestScore = 0;

  for (const [chord, pattern] of Object.entries(CHORD_PATTERNS)) {
    let matchedWeight = 0;
    let matchCount = 0;

    pattern.forEach((note) => {
      const weight = noteWeights[note] || 0;
      if (weight > 0) {
        matchedWeight += weight;
        matchCount += 1;
      }
    });

    if (matchCount < 2 || matchedWeight === 0) {
      continue;
    }

    const coverage = matchCount / pattern.length;
    const weightedScore = matchedWeight / totalWeight;
    const combinedScore = (coverage * 0.6) + (weightedScore * 0.4);

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      const confidence = Math.min(0.45 + combinedScore * 0.55, 1);
      bestMatch = { chord, confidence };
    }
  }

  return bestMatch && bestScore >= 0.45 ? bestMatch : null;
}

export const useChordDetection = () => {
  const [currentChord, setCurrentChord] = useState<ChordEvent | null>(null);
  const activeNotesRef = useRef<Map<string, number>>(new Map());
  const chordHistoryRef = useRef<ChordEvent[]>([]);
  const detectionWindowRef = useRef<number>(1.2); // Allow more staggered notes to accumulate
  const lastDetectionTimeRef = useRef<number>(0);

  // Update chord detection based on active notes
  const updateChord = (notes: NoteEvent[], timestamp: number) => {
    const now = timestamp;
    const windowStart = now - detectionWindowRef.current;

    // Filter notes within detection window (increased window for sequential playing)
    const recentNotes = notes.filter((n) => n.timestamp >= windowStart);
    
    if (recentNotes.length < 2) {
      if (currentChord && now - lastDetectionTimeRef.current < 0.4) {
        return;
      }
      setCurrentChord(null);
      return;
    }

    const weightedNoteMap = recentNotes.reduce<Record<string, number>>((acc, note) => {
      const normalized = normalizeNoteName(note.note);
      const velocity = note.velocity ?? 0.7;
      const normalizedDuration = Math.min(Math.max(note.duration / 0.6, 0), 1);
      const weight = velocity * 0.6 + normalizedDuration * 0.4;
      acc[normalized] = (acc[normalized] || 0) + weight;
      return acc;
    }, {});

    const rankedNotes = Object.entries(weightedNoteMap)
      .sort((a, b) => b[1] - a[1])
      .map(([note]) => note);

    // If we have at least two strong notes, attempt partial inference first
    if (rankedNotes.length >= 2) {
      const partial = detectPartialChord(rankedNotes.slice(0, 2), weightedNoteMap);
      if (partial && partial.confidence >= 0.55) {
        emitChord(partial.chord, now, partial.confidence, recentNotes);
        return;
      }
    }

    // Full chord detection (use weighted notes for robustness)
    const result = detectChordFromNotes(weightedNoteMap);
    
    if (result) {
      emitChord(result.chord, now, result.confidence, recentNotes);
    } else if (!currentChord || now - lastDetectionTimeRef.current > 0.6) {
      setCurrentChord(null);
    }
  };

  const emitChord = (label: string, timestamp: number, confidence: number, notes: NoteEvent[]) => {
    const chordNotes = notes
      .map((n) => n.note)
      .filter((note, index, self) => self.indexOf(note) === index)
      .slice(0, 6);

    const chordEvent: ChordEvent = {
      timestamp,
      chord: label,
      notes: chordNotes,
      confidence,
    };

    const lastChord = chordHistoryRef.current[chordHistoryRef.current.length - 1];
    if (!lastChord || lastChord.chord !== chordEvent.chord || timestamp - lastChord.timestamp > 0.25) {
      lastDetectionTimeRef.current = timestamp;
      setCurrentChord(chordEvent);
      chordHistoryRef.current.push(chordEvent);
      if (chordHistoryRef.current.length > 10) {
        chordHistoryRef.current.shift();
      }
    }
  };

  // Detect partial chords (power chords, intervals) from 2 notes
  function detectPartialChord(notes: string[], weights: Record<string, number>): { chord: string; confidence: number } | null {
    if (notes.length < 2) return null;

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const [note1, note2] = notes;
    const idx1 = noteNames.indexOf(note1);
    const idx2 = noteNames.indexOf(note2);

    if (idx1 === -1 || idx2 === -1) return null;

    const interval = (idx2 - idx1 + 12) % 12;
    const emphasis = (weights[note1] || 0) + (weights[note2] || 0);

    // Power chord (root + 5th)
    if (interval === 7 || interval === 5) {
      const root = interval === 7 ? note1 : note2;
      return {
        chord: `${root}5`, // Power chord notation
        confidence: Math.min(0.7 + emphasis * 0.15, 0.95),
      };
    }

    // Major 3rd interval
    if (interval === 4) {
      return {
        chord: `${note1} (M3)`,
        confidence: Math.min(0.55 + emphasis * 0.1, 0.8),
      };
    }

    // Minor 3rd interval
    if (interval === 3) {
      return {
        chord: `${note1} (m3)`,
        confidence: Math.min(0.55 + emphasis * 0.1, 0.8),
      };
    }

    return null;
  }

  return {
    currentChord,
    updateChord,
  };
};
