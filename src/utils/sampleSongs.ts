// Sample songs for testing - Jingle Bells for all instruments
import type { TranscriptionData, NoteEvent, ChordEvent, Instrument } from '@/types/transcription';
import type { SavedSong } from '@/utils/songStorage';
import { saveSong } from '@/utils/songStorage';

// Jingle Bells melody notes (simplified version)
// E E E, E E E, E G C D E, F F F F F E E E E E D D E D G
const JINGLE_BELLS_MELODY = [
  // First phrase: "Jingle bells, jingle bells"
  { note: 'E4', duration: 0.5 },
  { note: 'E4', duration: 0.5 },
  { note: 'E4', duration: 1.0 },
  { note: 'E4', duration: 0.5 },
  { note: 'E4', duration: 0.5 },
  { note: 'E4', duration: 1.0 },
  // Second phrase: "Jingle all the way"
  { note: 'E4', duration: 0.5 },
  { note: 'G4', duration: 0.5 },
  { note: 'C4', duration: 0.5 },
  { note: 'D4', duration: 0.5 },
  { note: 'E4', duration: 2.0 },
  // Third phrase: "Oh what fun"
  { note: 'F4', duration: 0.5 },
  { note: 'F4', duration: 0.5 },
  { note: 'F4', duration: 0.5 },
  { note: 'F4', duration: 0.5 },
  { note: 'F4', duration: 0.5 },
  { note: 'E4', duration: 0.5 },
  { note: 'E4', duration: 0.5 },
  { note: 'E4', duration: 0.5 },
  { note: 'E4', duration: 0.5 },
  // Fourth phrase: "it is to ride"
  { note: 'D4', duration: 0.5 },
  { note: 'D4', duration: 0.5 },
  { note: 'E4', duration: 0.5 },
  { note: 'D4', duration: 0.5 },
  { note: 'G4', duration: 2.0 },
];

// Helper function to convert note name to frequency
function noteToFrequency(note: string): number {
  const noteMap: Record<string, number> = {
    'C4': 261.63,
    'C#4': 277.18,
    'D4': 293.66,
    'D#4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'F#4': 369.99,
    'G4': 392.00,
    'G#4': 415.30,
    'A4': 440.00,
    'A#4': 466.16,
    'B4': 493.88,
  };
  return noteMap[note] || 440;
}

// Generate Jingle Bells song data for an instrument
function generateJingleBells(instrument: Instrument): TranscriptionData {
  const events: (NoteEvent | ChordEvent)[] = [];
  let currentTime = 0;
  const startTime = currentTime;

  // Add melody notes
  JINGLE_BELLS_MELODY.forEach((melodyNote) => {
    const noteEvent: NoteEvent = {
      timestamp: currentTime,
      note: melodyNote.note,
      frequency: noteToFrequency(melodyNote.note),
      duration: melodyNote.duration,
      velocity: 0.8,
      confidence: 0.9,
    };
    events.push(noteEvent);
    currentTime += melodyNote.duration;
  });

  // Add some chord events (simplified - just on downbeats)
  const chordTimes = [0, 2, 4, 6, 8, 10, 12, 14];
  const chords = ['C', 'C', 'G', 'G', 'C', 'C', 'G', 'G'];
  
  chordTimes.forEach((time, index) => {
    if (time < currentTime) {
      const chordEvent: ChordEvent = {
        timestamp: time,
        chord: chords[index],
        notes: getChordNotes(chords[index]),
        confidence: 0.85,
      };
      events.push(chordEvent);
    }
  });

  return {
    instrument,
    events,
    startTime,
    endTime: currentTime,
  };
}

// Helper to get chord notes
function getChordNotes(chord: string): string[] {
  const chordMap: Record<string, string[]> = {
    'C': ['C4', 'E4', 'G4'],
    'G': ['G4', 'B4', 'D5'],
    'F': ['F4', 'A4', 'C5'],
    'Am': ['A4', 'C5', 'E5'],
  };
  return chordMap[chord] || ['C4', 'E4', 'G4'];
}

// Create and save Jingle Bells for all instruments
export async function initializeJingleBells(): Promise<void> {
  const instruments: Instrument[] = ['trumpet', 'guitar', 'bass', 'ukulele', 'piano'];
  const now = Date.now();

  for (const instrument of instruments) {
    const transcriptionData = generateJingleBells(instrument);
    const noteCount = transcriptionData.events.filter((e) => 'note' in e).length;
    const chordCount = transcriptionData.events.filter((e) => 'chord' in e).length;
    const duration = transcriptionData.endTime 
      ? transcriptionData.endTime - transcriptionData.startTime 
      : undefined;

    const song: SavedSong = {
      id: `jingle-bells-${instrument}-${now}`,
      name: 'Jingle Bells',
      instrument,
      transcriptionData,
      createdAt: now,
      updatedAt: now,
      duration,
      noteCount,
      chordCount,
      tags: ['sample', 'christmas', 'test'],
    };

    try {
      await saveSong(song);
      console.log(`✅ Saved Jingle Bells for ${instrument}`);
    } catch (error) {
      console.error(`❌ Failed to save Jingle Bells for ${instrument}:`, error);
    }
  }
}

// Check if Jingle Bells already exists for an instrument
export async function hasJingleBells(instrument: Instrument): Promise<boolean> {
  const { getAllSongs } = await import('@/utils/songStorage');
  const songs = await getAllSongs();
  return songs.some(
    (song) => 
      song.name.toLowerCase() === 'jingle bells' && 
      song.instrument === instrument
  );
}

