// Shared helpers for trumpet fingering lookups so every view stays consistent

type ValveStates = [boolean, boolean, boolean];

const ENHARMONIC_TO_SHARP: Record<string, string> = {
  CB: 'B',
  DB: 'C#',
  EB: 'D#',
  FB: 'E',
  GB: 'F#',
  AB: 'G#',
  BB: 'A#',
};

export const TRUMPET_FINGERING_PATTERNS: Record<string, string> = {
  'F#3': '1-2-3',
  'G3': '1-3',
  'G#3': '2-3',
  'A3': '1-2',
  'A#3': '1',
  'B3': '2',
  'C4': '0',
  'C#4': '1-2-3',
  'D4': '1-3',
  'D#4': '2-3',
  'E4': '1-2',
  'F4': '1',
  'F#4': '2',
  'G4': '0',
  'G#4': '2-3',
  'A4': '1-2',
  'A#4': '1',
  'B4': '2',
  'C5': '0',
  'C#5': '1-2',
  'D5': '1',
  'D#5': '2',
  'E5': '1-2',
  'F5': '1',
  'F#5': '2',
  'G5': '0',
  'G#5': '2-3',
  'A5': '1-2',
  'A#5': '1',
  'B5': '2',
  'C6': '0',
  'C#6': '1-2',
  'D6': '1',
  'D#6': '2',
  'E6': '1-2',
  'F6': '1',
  'F#6': '2',
  'G6': '0',
};

const normalizeTrumpetNote = (note: string): string | null => {
  if (!note) return null;
  const trimmed = note.trim();
  const match = trimmed.match(/^([A-Ga-g])([#b♯♭]?)(\d+)?$/);
  if (!match) return null;

  let [, letter, accidental = '', octave = '4'] = match;
  letter = letter.toUpperCase();
  accidental = accidental.replace('♯', '#').replace('♭', 'b');

  let noteName = letter;
  if (accidental === '#') {
    noteName = `${letter}#`;
  } else if (accidental === 'b') {
    noteName = ENHARMONIC_TO_SHARP[`${letter}B`] || letter;
  }

  return `${noteName}${octave}`;
};

const fingeringPatternToValves = (pattern: string): ValveStates => {
  const valves: ValveStates = [false, false, false];
  if (!pattern || pattern === '0' || pattern === 'open' || pattern === '—') {
    return valves;
  }

  pattern.split('-').forEach((valve) => {
    const valveNumber = parseInt(valve, 10);
    if (!Number.isNaN(valveNumber) && valveNumber >= 1 && valveNumber <= 3) {
      valves[valveNumber - 1] = true;
    }
  });

  return valves;
};

export const getTrumpetFingeringPattern = (note: string): string | null => {
  const normalized = normalizeTrumpetNote(note);
  if (!normalized) return null;
  return TRUMPET_FINGERING_PATTERNS[normalized] || null;
};

export const getTrumpetFingeringLabel = (note: string): string | null => {
  const pattern = getTrumpetFingeringPattern(note);
  if (!pattern) return null;
  if (pattern === '0') return 'Open';
  return pattern;
};

export const getTrumpetValveStates = (note: string): ValveStates | null => {
  const pattern = getTrumpetFingeringPattern(note);
  if (!pattern) return null;
  return fingeringPatternToValves(pattern);
};

export const listTrumpetNotes = (): string[] => Object.keys(TRUMPET_FINGERING_PATTERNS);

export type { ValveStates };
