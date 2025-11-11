/**
 * Comprehensive guitar chord fingerings database
 * Format: { stringIndex: fretNumber } where -1 = muted string, 0 = open string
 * Based on standard guitar tuning (E A D G B E)
 */

export interface ChordFingering {
  frets: number[]; // Matches the instrument string count (-1 = muted, 0 = open)
  fingers?: number[]; // Optional finger numbers (1=index, 2=middle, 3=ring, 4=pinky)
  baseFret?: number; // If chord is played higher up the neck
  barres?: Array<{ fromString: number; toString: number; fret: number }>; // Barre positions
}

export type ChordDatabase = Record<string, ChordFingering[]>;
export type ChordInstrument = 'guitar' | 'ukulele';

// Standard guitar chord fingerings - most common positions
export const GUITAR_CHORD_FINGERINGS: ChordDatabase = {
  // Major Chords
  'C': [
    { frets: [0, 1, 0, 2, 1, 0], fingers: [0, 1, 0, 3, 2, 0] }, // Open C
    { frets: [3, 3, 5, 5, 5, 3], fingers: [1, 1, 2, 3, 4, 1], baseFret: 3, barres: [{ fromString: 0, toString: 0, fret: 3 }] }, // C barre
  ],
  'D': [
    { frets: [-1, 0, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }, // Open D
    { frets: [-1, 5, 7, 7, 7, 5], fingers: [0, 1, 2, 3, 4, 1], baseFret: 5, barres: [{ fromString: 1, toString: 1, fret: 5 }] }, // D barre
  ],
  'E': [
    { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] }, // Open E
    { frets: [7, 9, 9, 8, 7, 7], fingers: [1, 3, 4, 2, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 0, fret: 7 }] }, // E barre
  ],
  'F': [
    { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [{ fromString: 0, toString: 5, fret: 1 }] }, // F barre
    { frets: [-1, 8, 10, 10, 10, 8], fingers: [0, 1, 2, 3, 4, 1], baseFret: 8, barres: [{ fromString: 1, toString: 1, fret: 8 }] }, // F higher
  ],
  'G': [
    { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] }, // Open G
    { frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], baseFret: 3, barres: [{ fromString: 0, toString: 0, fret: 3 }] }, // G barre
  ],
  'A': [
    { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] }, // Open A
    { frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], baseFret: 5, barres: [{ fromString: 0, toString: 0, fret: 5 }] }, // A barre
  ],
  'B': [
    { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 2 }] }, // B barre
    { frets: [7, 9, 9, 8, 7, 7], fingers: [1, 3, 4, 2, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 0, fret: 7 }] }, // B higher
  ],

  // Minor Chords
  'Cm': [
    { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [{ fromString: 1, toString: 1, fret: 3 }] }, // Cm barre
    { frets: [8, 10, 10, 8, 8, 8], fingers: [1, 3, 4, 1, 1, 1], baseFret: 8, barres: [{ fromString: 0, toString: 5, fret: 8 }] }, // Cm higher
  ],
  'Dm': [
    { frets: [-1, 0, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] }, // Open Dm
    { frets: [-1, 5, 7, 7, 6, 5], fingers: [0, 1, 3, 4, 2, 1], baseFret: 5, barres: [{ fromString: 1, toString: 1, fret: 5 }] }, // Dm barre
  ],
  'Em': [
    { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] }, // Open Em
    { frets: [7, 9, 9, 7, 7, 7], fingers: [1, 3, 4, 1, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 5, fret: 7 }] }, // Em barre
  ],
  'Fm': [
    { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [{ fromString: 0, toString: 5, fret: 1 }] }, // Fm barre
    { frets: [-1, 8, 10, 10, 9, 8], fingers: [0, 1, 3, 4, 2, 1], baseFret: 8, barres: [{ fromString: 1, toString: 1, fret: 8 }] }, // Fm higher
  ],
  'Gm': [
    { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [{ fromString: 0, toString: 5, fret: 3 }] }, // Gm barre
    { frets: [-1, 10, 12, 12, 11, 10], fingers: [0, 1, 3, 4, 2, 1], baseFret: 10, barres: [{ fromString: 1, toString: 1, fret: 10 }] }, // Gm higher
  ],
  'Am': [
    { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] }, // Open Am
    { frets: [5, 7, 7, 5, 5, 5], fingers: [1, 3, 4, 1, 1, 1], baseFret: 5, barres: [{ fromString: 0, toString: 5, fret: 5 }] }, // Am barre
  ],
  'Bm': [
    { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 2 }] }, // Bm barre
    { frets: [7, 9, 9, 7, 7, 7], fingers: [1, 3, 4, 1, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 5, fret: 7 }] }, // Bm higher
  ],

  // 7th Chords
  'C7': [
    { frets: [0, 1, 0, 2, 1, 3], fingers: [0, 1, 0, 2, 1, 3] }, // Open C7
    { frets: [3, 3, 5, 3, 5, 3], fingers: [1, 1, 2, 1, 3, 1], baseFret: 3, barres: [{ fromString: 0, toString: 0, fret: 3 }] }, // C7 barre
  ],
  'D7': [
    { frets: [-1, 0, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] }, // Open D7
    { frets: [-1, 5, 7, 5, 7, 5], fingers: [0, 1, 3, 1, 4, 1], baseFret: 5, barres: [{ fromString: 1, toString: 1, fret: 5 }] }, // D7 barre
  ],
  'E7': [
    { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] }, // Open E7
    { frets: [7, 9, 7, 8, 7, 7], fingers: [1, 3, 1, 2, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 0, fret: 7 }] }, // E7 barre
  ],
  'F7': [
    { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [{ fromString: 0, toString: 5, fret: 1 }] }, // F7 barre
    { frets: [-1, 8, 10, 8, 10, 8], fingers: [0, 1, 3, 1, 4, 1], baseFret: 8, barres: [{ fromString: 1, toString: 1, fret: 8 }] }, // F7 higher
  ],
  'G7': [
    { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] }, // Open G7
    { frets: [3, 5, 3, 4, 3, 3], fingers: [1, 3, 1, 2, 1, 1], baseFret: 3, barres: [{ fromString: 0, toString: 0, fret: 3 }] }, // G7 barre
  ],
  'A7': [
    { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] }, // Open A7
    { frets: [5, 7, 5, 6, 5, 5], fingers: [1, 3, 1, 2, 1, 1], baseFret: 5, barres: [{ fromString: 0, toString: 0, fret: 5 }] }, // A7 barre
  ],
  'B7': [
    { frets: [-1, 2, 4, 2, 4, 2], fingers: [0, 1, 3, 1, 4, 1], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 2 }] }, // B7 barre
    { frets: [7, 9, 7, 8, 7, 7], fingers: [1, 3, 1, 2, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 0, fret: 7 }] }, // B7 higher
  ],

  // Major 7th Chords
  'Cmaj7': [
    { frets: [0, 0, 0, 2, 1, 0], fingers: [0, 0, 0, 2, 1, 0] }, // Open Cmaj7
    { frets: [3, 3, 5, 4, 5, 3], fingers: [1, 1, 2, 1, 3, 1], baseFret: 3, barres: [{ fromString: 0, toString: 0, fret: 3 }] }, // Cmaj7 barre
  ],
  'Dmaj7': [
    { frets: [-1, 0, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] }, // Open Dmaj7
    { frets: [-1, 5, 7, 6, 7, 5], fingers: [0, 1, 3, 2, 4, 1], baseFret: 5, barres: [{ fromString: 1, toString: 1, fret: 5 }] }, // Dmaj7 barre
  ],
  'Emaj7': [
    { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 2, 1, 1, 0, 0] }, // Open Emaj7
    { frets: [7, 9, 8, 8, 7, 7], fingers: [1, 3, 2, 2, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 0, fret: 7 }] }, // Emaj7 barre
  ],
  'Fmaj7': [
    { frets: [1, 3, 2, 2, 1, 1], fingers: [1, 3, 2, 2, 1, 1], baseFret: 1, barres: [{ fromString: 0, toString: 5, fret: 1 }] }, // Fmaj7 barre
    { frets: [-1, 8, 10, 9, 10, 8], fingers: [0, 1, 3, 2, 4, 1], baseFret: 8, barres: [{ fromString: 1, toString: 1, fret: 8 }] }, // Fmaj7 higher
  ],
  'Gmaj7': [
    { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] }, // Open Gmaj7
    { frets: [3, 5, 4, 4, 3, 3], fingers: [1, 3, 2, 2, 1, 1], baseFret: 3, barres: [{ fromString: 0, toString: 0, fret: 3 }] }, // Gmaj7 barre
  ],
  'Amaj7': [
    { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] }, // Open Amaj7
    { frets: [5, 7, 6, 6, 5, 5], fingers: [1, 3, 2, 2, 1, 1], baseFret: 5, barres: [{ fromString: 0, toString: 0, fret: 5 }] }, // Amaj7 barre
  ],
  'Bmaj7': [
    { frets: [-1, 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 2 }] }, // Bmaj7 barre
    { frets: [7, 9, 8, 8, 7, 7], fingers: [1, 3, 2, 2, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 0, fret: 7 }] }, // Bmaj7 higher
  ],

  // Minor 7th Chords
  'Cm7': [
    { frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], baseFret: 3, barres: [{ fromString: 1, toString: 1, fret: 3 }] }, // Cm7 barre
    { frets: [8, 10, 8, 8, 8, 8], fingers: [1, 3, 1, 1, 1, 1], baseFret: 8, barres: [{ fromString: 0, toString: 5, fret: 8 }] }, // Cm7 higher
  ],
  'Dm7': [
    { frets: [-1, 0, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] }, // Open Dm7
    { frets: [-1, 5, 7, 5, 6, 5], fingers: [0, 1, 3, 1, 2, 1], baseFret: 5, barres: [{ fromString: 1, toString: 1, fret: 5 }] }, // Dm7 barre
  ],
  'Em7': [
    { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] }, // Open Em7
    { frets: [7, 9, 7, 7, 7, 7], fingers: [1, 3, 1, 1, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 5, fret: 7 }] }, // Em7 barre
  ],
  'Fm7': [
    { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [{ fromString: 0, toString: 5, fret: 1 }] }, // Fm7 barre
    { frets: [-1, 8, 10, 8, 9, 8], fingers: [0, 1, 3, 1, 2, 1], baseFret: 8, barres: [{ fromString: 1, toString: 1, fret: 8 }] }, // Fm7 higher
  ],
  'Gm7': [
    { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], baseFret: 3, barres: [{ fromString: 0, toString: 5, fret: 3 }] }, // Gm7 barre
    { frets: [-1, 10, 12, 10, 11, 10], fingers: [0, 1, 3, 1, 2, 1], baseFret: 10, barres: [{ fromString: 1, toString: 1, fret: 10 }] }, // Gm7 higher
  ],
  'Am7': [
    { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] }, // Open Am7
    { frets: [5, 7, 5, 5, 5, 5], fingers: [1, 3, 1, 1, 1, 1], baseFret: 5, barres: [{ fromString: 0, toString: 5, fret: 5 }] }, // Am7 barre
  ],
  'Bm7': [
    { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 2 }] }, // Bm7 barre
    { frets: [7, 9, 7, 7, 7, 7], fingers: [1, 3, 1, 1, 1, 1], baseFret: 7, barres: [{ fromString: 0, toString: 5, fret: 7 }] }, // Bm7 higher
  ],

  // Suspended Chords
  'Csus2': [
    { frets: [0, 0, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] }, // Open Csus2
  ],
  'Csus4': [
    { frets: [0, 1, 0, 3, 3, 0], fingers: [0, 1, 0, 2, 3, 0] }, // Open Csus4
  ],
  'Dsus2': [
    { frets: [-1, 0, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] }, // Open Dsus2
  ],
  'Dsus4': [
    { frets: [-1, 0, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] }, // Open Dsus4
  ],
  'Esus2': [
    { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] }, // Open Esus2
  ],
  'Esus4': [
    { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 2, 3, 0, 0] }, // Open Esus4
  ],
  'Fsus2': [
    { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [{ fromString: 0, toString: 5, fret: 1 }] }, // Fsus2 barre
  ],
  'Fsus4': [
    { frets: [1, 3, 3, 3, 1, 1], fingers: [1, 3, 4, 4, 1, 1], baseFret: 1, barres: [{ fromString: 0, toString: 5, fret: 1 }] }, // Fsus4 barre
  ],
  'Gsus2': [
    { frets: [3, 0, 0, 0, 3, 3], fingers: [2, 0, 0, 0, 3, 4] }, // Open Gsus2
  ],
  'Gsus4': [
    { frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4] }, // Open Gsus4
  ],
  'Asus2': [
    { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] }, // Open Asus2
  ],
  'Asus4': [
    { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] }, // Open Asus4
  ],
  'Bsus2': [
    { frets: [-1, 2, 4, 4, 2, 2], fingers: [0, 1, 3, 4, 1, 1], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 2 }] }, // Bsus2 barre
  ],
  'Bsus4': [
    { frets: [-1, 2, 4, 4, 5, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 2 }] }, // Bsus4 barre
  ],

  // Diminished Chords
  'Cdim': [
    { frets: [-1, 3, 4, 5, 4, -1], fingers: [0, 1, 2, 4, 3, 0] }, // Cdim
  ],
  'Ddim': [
    { frets: [-1, 0, 1, 2, 1, -1], fingers: [0, 0, 1, 3, 2, 0] }, // Ddim
  ],
  'Edim': [
    { frets: [0, 1, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0] }, // Edim
  ],
  'Fdim': [
    { frets: [1, 2, 3, 1, 3, 1], fingers: [1, 2, 3, 1, 4, 1], baseFret: 1, barres: [{ fromString: 0, toString: 0, fret: 1 }] }, // Fdim
  ],
  'Gdim': [
    { frets: [3, 4, 5, 3, 5, 3], fingers: [1, 2, 3, 1, 4, 1], baseFret: 3, barres: [{ fromString: 0, toString: 0, fret: 3 }] }, // Gdim
  ],
  'Adim': [
    { frets: [-1, 0, 1, 2, 1, 2], fingers: [0, 0, 1, 2, 1, 3] }, // Adim
  ],
  'Bdim': [
    { frets: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0] }, // Bdim
  ],

  // Augmented Chords
  'Caug': [
    { frets: [-1, 3, 2, 1, 1, 0], fingers: [0, 3, 2, 1, 1, 0] }, // Caug
  ],
  'Daug': [
    { frets: [-1, 0, 3, 2, 2, 1], fingers: [0, 0, 4, 2, 3, 1] }, // Daug
  ],
  'Eaug': [
    { frets: [0, 3, 2, 1, 1, 0], fingers: [0, 3, 2, 1, 1, 0] }, // Eaug
  ],
  'Faug': [
    { frets: [1, 4, 3, 2, 2, 1], fingers: [1, 4, 3, 2, 2, 1], baseFret: 1, barres: [{ fromString: 0, toString: 0, fret: 1 }] }, // Faug
  ],
  'Gaug': [
    { frets: [3, 2, 1, 0, 0, 3], fingers: [3, 2, 1, 0, 0, 4] }, // Gaug
  ],
  'Aaug': [
    { frets: [-1, 0, 3, 2, 2, 1], fingers: [0, 0, 4, 2, 3, 1] }, // Aaug
  ],
  'Baug': [
    { frets: [-1, 2, 1, 0, 0, 3], fingers: [0, 2, 1, 0, 0, 3] }, // Baug
  ],
};

// Core ukulele chord fingerings (G C E A tuning)
export const UKULELE_CHORD_FINGERINGS: ChordDatabase = {
  // Major chords
  'C': [{ frets: [0, 0, 0, 3] }],
  'D': [{ frets: [2, 2, 2, 0] }],
  'E': [{ frets: [4, 4, 4, 2] }],
  'F': [{ frets: [2, 0, 1, 0] }],
  'G': [{ frets: [0, 2, 3, 2] }],
  'A': [{ frets: [2, 1, 0, 0] }],
  'B': [{ frets: [4, 3, 2, 2] }],

  // Minor chords
  'Cm': [{ frets: [0, 3, 3, 3] }],
  'Dm': [{ frets: [2, 2, 1, 0] }],
  'Em': [{ frets: [0, 4, 3, 2] }],
  'Fm': [{ frets: [1, 0, 1, 3] }],
  'Gm': [{ frets: [0, 2, 3, 1] }],
  'Am': [{ frets: [2, 0, 0, 0] }],
  'Bm': [{ frets: [4, 2, 2, 2] }],

  // Dominant 7th chords
  'C7': [{ frets: [0, 0, 0, 1] }],
  'D7': [{ frets: [2, 0, 2, 0] }],
  'E7': [{ frets: [1, 2, 0, 2] }],
  'F7': [{ frets: [2, 3, 1, 3] }],
  'G7': [{ frets: [0, 2, 1, 2] }],
  'A7': [{ frets: [0, 1, 0, 0] }],
  'B7': [{ frets: [2, 3, 2, 3] }],

  // Major 7th chords
  'Cmaj7': [{ frets: [0, 0, 0, 2] }],
  'Dmaj7': [{ frets: [2, 2, 2, 4] }],
  'Emaj7': [{ frets: [4, 4, 4, 6] }],
  'Fmaj7': [{ frets: [2, 4, 1, 3] }],
  'Gmaj7': [{ frets: [0, 2, 2, 2] }],
  'Amaj7': [{ frets: [1, 1, 0, 0] }],
  'Bmaj7': [{ frets: [4, 3, 2, 1] }],

  // Minor 7th chords
  'Cm7': [{ frets: [3, 3, 3, 3] }],
  'Dm7': [{ frets: [2, 2, 1, 3] }],
  'Em7': [{ frets: [0, 2, 0, 2] }],
  'Fm7': [{ frets: [1, 3, 1, 3] }],
  'Gm7': [{ frets: [0, 2, 1, 1] }],
  'Am7': [{ frets: [0, 0, 0, 0] }],
  'Bm7': [{ frets: [2, 2, 2, 2] }],
};

const CHORD_DATABASES: Record<ChordInstrument, ChordDatabase> = {
  guitar: GUITAR_CHORD_FINGERINGS,
  ukulele: UKULELE_CHORD_FINGERINGS,
};

const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_INDEX: Record<string, number> = NOTE_ORDER.reduce((acc, note, idx) => {
  acc[note] = idx;
  return acc;
}, {} as Record<string, number>);

const ENHARMONICS: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  Fb: 'E',
  'E#': 'F',
  'B#': 'C',
};

const QUALITY_CANONICAL: Record<string, string> = {
  '': 'maj',
  maj: 'maj',
  major: 'maj',
  m: 'm',
  min: 'm',
  minor: 'm',
  m7: 'm7',
  min7: 'm7',
  maj7: 'maj7',
  dominant7: '7',
  dom7: '7',
  '7': '7',
  sus2: 'sus2',
  sus4: 'sus4',
  dim: 'dim',
  diminished: 'dim',
  dim7: 'dim',
  aug: 'aug',
  augmented: 'aug',
  '+': 'aug',
};

const QUALITY_KEYS = Object.keys(QUALITY_CANONICAL)
  .filter((key) => key.length > 0)
  .sort((a, b) => b.length - a.length);

type TemplateChord = {
  root: string;
  fingering: ChordFingering;
};

const TEMPLATE_FINGERINGS: Record<ChordInstrument, Partial<Record<string, TemplateChord>>> = {
  guitar: {
    maj: { root: 'F', fingering: GUITAR_CHORD_FINGERINGS['F'][0] },
    m: { root: 'Fm', fingering: GUITAR_CHORD_FINGERINGS['Fm'][0] },
    '7': { root: 'F7', fingering: GUITAR_CHORD_FINGERINGS['F7'][0] },
    maj7: { root: 'Fmaj7', fingering: GUITAR_CHORD_FINGERINGS['Fmaj7'][0] },
    m7: { root: 'Fm7', fingering: GUITAR_CHORD_FINGERINGS['Fm7'][0] },
    sus2: { root: 'Fsus2', fingering: GUITAR_CHORD_FINGERINGS['Fsus2'][0] },
    sus4: { root: 'Fsus4', fingering: GUITAR_CHORD_FINGERINGS['Fsus4'][0] },
    dim: { root: 'Fdim', fingering: GUITAR_CHORD_FINGERINGS['Fdim'][0] },
    aug: { root: 'Faug', fingering: GUITAR_CHORD_FINGERINGS['Faug'][0] },
  },
  ukulele: {
    maj: { root: 'F', fingering: UKULELE_CHORD_FINGERINGS['F'][0] },
    m: { root: 'Fm', fingering: UKULELE_CHORD_FINGERINGS['Fm'][0] },
    '7': { root: 'F7', fingering: UKULELE_CHORD_FINGERINGS['F7'][0] },
    maj7: { root: 'Fmaj7', fingering: UKULELE_CHORD_FINGERINGS['Fmaj7'][0] },
    m7: { root: 'Fm7', fingering: UKULELE_CHORD_FINGERINGS['Fm7'][0] },
  },
};

function cloneFingering(fingering: ChordFingering): ChordFingering {
  return {
    frets: [...fingering.frets],
    fingers: fingering.fingers ? [...fingering.fingers] : undefined,
    baseFret: fingering.baseFret,
    barres: fingering.barres ? fingering.barres.map((barre) => ({ ...barre })) : undefined,
  };
}

function formatRootNote(root: string): string {
  const letter = root[0]?.toUpperCase() || '';
  const accidental = root[1]
    ? root[1]
        .replace('♭', 'b')
        .replace('♯', '#')
        .replace('B', 'b')
    : '';
  return `${letter}${accidental}`;
}

function normalizeNoteName(note: string): string {
  const formatted = formatRootNote(note);
  return ENHARMONICS[formatted] || formatted;
}

function getNoteIndex(note: string): number | null {
  const normalized = normalizeNoteName(note);
  return normalized in NOTE_INDEX ? NOTE_INDEX[normalized] : null;
}

function resolveQuality(rawQuality: string): string {
  const quality = rawQuality.toLowerCase();
  for (const key of QUALITY_KEYS) {
    if (quality.startsWith(key.toLowerCase())) {
      return QUALITY_CANONICAL[key];
    }
  }
  return QUALITY_CANONICAL[''];
}

function splitChordName(chordName: string): { root: string | null; quality: string } {
  const match = chordName.trim().match(/^([A-G][#b♯♭]?)(.*)$/i);
  if (!match) {
    return { root: null, quality: '' };
  }
  const root = normalizeNoteName(formatRootNote(match[1]));
  const quality = match[2]?.toLowerCase() || '';
  return { root, quality };
}

function transposeFingering(base: ChordFingering, semitoneShift: number): ChordFingering {
  if (semitoneShift === 0) {
    return base;
  }

  const frets = base.frets.map((fret) => {
    if (fret < 0) return fret;
    if (fret === 0) {
      return semitoneShift;
    }
    return fret + semitoneShift;
  });

  const barres = base.barres
    ? base.barres.map((barre) => ({
        ...barre,
        fret: barre.fret + semitoneShift,
      }))
    : undefined;

  const baseFret =
    base.baseFret !== undefined
      ? base.baseFret + semitoneShift
      : semitoneShift > 0
      ? semitoneShift
      : undefined;

  return {
    ...base,
    frets,
    barres,
    baseFret,
  };
}

function generateTemplateFingering(chordName: string, instrument: ChordInstrument): ChordFingering | null {
  const normalized = normalizeChordName(chordName);
  const { root, quality } = splitChordName(normalized);
  if (!root) return null;

  const canonicalQuality = resolveQuality(quality);
  const template = TEMPLATE_FINGERINGS[instrument]?.[canonicalQuality];
  if (!template) return null;

  const chordIndex = getNoteIndex(root);
  const templateIndex = getNoteIndex(template.root);
  if (chordIndex === null || templateIndex === null) return null;

  const semitoneShift = (chordIndex - templateIndex + 12) % 12;
  const baseFingering = cloneFingering(template.fingering);
  return transposeFingering(baseFingering, semitoneShift);
}

/**
 * Get the best chord fingering for a given chord name
 * Returns the first (most common) fingering, or null if not found
 */
export function getChordFingering(
  chordName: string,
  instrument: ChordInstrument = 'guitar'
): ChordFingering | null {
  const database = CHORD_DATABASES[instrument] || GUITAR_CHORD_FINGERINGS;
  const candidates = [chordName, normalizeChordName(chordName)];

  for (const candidate of candidates) {
    const fingerings = database[candidate];
    if (fingerings && fingerings.length > 0) {
      return fingerings[0];
    }
  }

  return generateTemplateFingering(chordName, instrument);
}

/**
 * Get all fingerings for a chord (useful for showing alternative positions)
 */
export function getAllChordFingerings(
  chordName: string,
  instrument: ChordInstrument = 'guitar'
): ChordFingering[] {
  const database = CHORD_DATABASES[instrument] || GUITAR_CHORD_FINGERINGS;
  const normalized = normalizeChordName(chordName);
  const explicit = [
    ...(database[chordName] || []),
    ...(normalized !== chordName ? database[normalized] || [] : []),
  ];

  if (explicit.length > 0) {
    return explicit;
  }

  const fallback = generateTemplateFingering(chordName, instrument);
  return fallback ? [fallback] : [];
}

/**
 * Convert chord name variations to standard format
 * Handles cases like "C#", "Db", "C#m", etc.
 */
export function normalizeChordName(chordName: string): string {
  // Remove spaces and trim
  let normalized = chordName.trim();

  // Preserve case for chord quality (m, maj7, etc.) but uppercase root note
  const rootMatch = normalized.match(/^([A-Ga-g][#b]?)(.*)/);
  if (rootMatch) {
    const root = rootMatch[1].toUpperCase();
    const quality = rootMatch[2].toLowerCase();
    normalized = root + quality;
  }

  // Handle sharp/flat conversions (simplified - assumes enharmonic equivalents)
  const enharmonics: Record<string, string> = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#',
  };

  for (const [flat, sharp] of Object.entries(enharmonics)) {
    if (normalized.startsWith(flat)) {
      normalized = normalized.replace(flat, sharp);
      break;
    }
  }

  // Normalize chord quality names - check longer patterns first to avoid partial matches
  const qualityMap: Record<string, string> = {
    'maj7': 'maj7',  // Keep maj7 as-is
    'min7': 'm7',     // Convert min7 to m7
    'dom7': '7',      // Convert dom7 to 7
    'dominant7': '7', // Convert dominant7 to 7
    'sus4': 'sus4',   // Keep sus4 as-is
    'sus2': 'sus2',   // Keep sus2 as-is
    'suspended4': 'sus4',
    'suspended2': 'sus2',
    'min': 'm',       // Convert min to m (but not if it's part of min7)
    'minor': 'm',
    'major': '',
    'maj': 'maj',     // Keep maj as-is (but not if it's part of maj7)
    'dim': 'dim',
    'diminished': 'dim',
    'aug': 'aug',
    'augmented': 'aug',
  };

  // Check for longer patterns first (maj7, min7, etc.) before shorter ones (maj, min)
  const sortedQualities = Object.keys(qualityMap).sort((a, b) => b.length - a.length);
  
  for (const oldQuality of sortedQualities) {
    if (normalized.toLowerCase().includes(oldQuality)) {
      const root = normalized.match(/^([A-G][#b]?)/)?.[1] || '';
      const newQuality = qualityMap[oldQuality];
      normalized = root + newQuality;
      break;
    }
  }

  return normalized;
}
