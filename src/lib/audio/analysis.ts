// Audio analysis utilities for chord recognition
import * as tf from '@tensorflow/tfjs';

/**
 * Convert an audio frame to 12-bin chromagram using proper FFT
 * @param frame Audio frame (Float32Array)
 * @param sampleRate Sample rate of the audio
 * @returns 12-element array representing chroma bins (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
 */
export function getChromagram(frame: Float32Array, sampleRate: number): number[] {
  const chroma = new Array(12).fill(0);

  // Use optimized FFT size (power of 2)
  const N = 4096;
  const workingFrame = new Float32Array(N);

  // Copy and window the frame
  const windowSize = Math.min(frame.length, N);
  for (let i = 0; i < windowSize; i++) {
    // Apply Hann window
    const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / windowSize));
    workingFrame[i] = frame[i] * window;
  }

  // Perform optimized FFT-like operation directly for chroma
  // Instead of full FFT, compute energy in specific frequency bands
  const minFreq = 80;  // C2 ≈ 65 Hz
  const maxFreq = 1200; // D#6 ≈ 1245 Hz

  // For each of the 12 pitch classes, compute energy in relevant frequency bands
  for (let pitchClass = 0; pitchClass < 12; pitchClass++) {
    let energy = 0;
    let count = 0;

    // Check multiple octaves for this pitch class
    for (let octave = 2; octave <= 5; octave++) {
      const freq = pitchClassToFrequency(pitchClass, octave);

      if (freq < minFreq || freq > maxFreq) continue;

      // Find the frequency bin for this pitch
      const binFloat = (freq * N) / sampleRate;
      const bin = Math.round(binFloat);

      if (bin < 1 || bin >= N / 2) continue;

      // Compute magnitude at this bin and neighboring bins
      let real = 0;
      let imag = 0;

      for (let n = 0; n < N; n++) {
        const angle = (-2 * Math.PI * bin * n) / N;
        real += workingFrame[n] * Math.cos(angle);
        imag += workingFrame[n] * Math.sin(angle);
      }

      const magnitude = Math.sqrt(real * real + imag * imag);
      energy += magnitude;
      count++;
    }

    if (count > 0) {
      chroma[pitchClass] = energy / count;
    }
  }

  // Normalize
  const max = Math.max(...chroma);
  if (max > 0) {
    return chroma.map(val => val / max);
  }

  return chroma;
}

/**
 * Convert pitch class and octave to frequency
 * @param pitchClass 0=C, 1=C#, 2=D, etc.
 * @param octave octave number
 */
function pitchClassToFrequency(pitchClass: number, octave: number): number {
  // C0 = 16.35 Hz
  const C0 = 16.35;
  const semitones = octave * 12 + pitchClass;
  return C0 * Math.pow(2, semitones / 12);
}

/**
 * Extract individual notes from chromagram (for single-note instruments like trumpet)
 * Returns the most prominent note(s) at each time window
 */
export function extractNotes(chroma: number[]): Array<{ note: string; confidence: number; octave: number }> {
  if (chroma.length !== 12) return [];

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const threshold = 0.2; // Minimum energy to consider a note
  
  // Find all notes above threshold
  const notes: Array<{ note: string; confidence: number; octave: number }> = [];
  
  for (let pitchClass = 0; pitchClass < 12; pitchClass++) {
    const energy = chroma[pitchClass];
    if (energy > threshold) {
      // Determine octave based on energy distribution
      // For trumpet, typically C4-G5 range, but we'll use C4 as default
      // In a more sophisticated implementation, we'd analyze frequency bins
      const octave = 4; // Default to octave 4 for trumpet range
      notes.push({
        note: noteNames[pitchClass],
        confidence: energy,
        octave,
      });
    }
  }
  
  // Sort by confidence (highest first)
  notes.sort((a, b) => b.confidence - a.confidence);
  
  // Return top 3 notes (or all if fewer than 3)
  return notes.slice(0, 3);
}

/**
 * Convert frequency to pitch class (0-11 where 0=C, 1=C#, etc.)
 */
function frequencyToPitchClass(freq: number): number {
  // Reference: C0 = 16.35 Hz
  const C0 = 16.35;
  const semitones = 12 * Math.log2(freq / C0);
  const pitchClass = Math.round(semitones) % 12;
  return pitchClass < 0 ? pitchClass + 12 : pitchClass;
}

/**
 * Chord templates for pattern matching
 */
const CHORD_TEMPLATES: Record<string, number[]> = {
  // Major chords
  'major': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0], // Root, Major 3rd, Perfect 5th
  // Minor chords
  'minor': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], // Root, Minor 3rd, Perfect 5th
  // Dominant 7th
  'dom7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], // Root, Major 3rd, Perfect 5th, Minor 7th
  // Major 7th
  'maj7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1], // Root, Major 3rd, Perfect 5th, Major 7th
  // Minor 7th
  'min7': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0], // Root, Minor 3rd, Perfect 5th, Minor 7th
  // Suspended 2nd
  'sus2': [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0], // Root, Major 2nd, Perfect 5th
  // Suspended 4th
  'sus4': [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0], // Root, Perfect 4th, Perfect 5th
  // Diminished
  'dim': [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], // Root, Minor 3rd, Diminished 5th
  // Augmented
  'aug': [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // Root, Major 3rd, Augmented 5th
};

/**
 * Classify chord from chromagram using template matching
 */
export function classifyChord(chroma: number[]): { label: string; confidence: number; notes?: string[] } | null {
  if (chroma.length !== 12) return null;

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Threshold for considering a note "active"
  const threshold = 0.1; // Lowered from 0.15 for more sensitivity

  // Check if we have enough energy in the chromagram
  const totalEnergy = chroma.reduce((sum, val) => sum + val, 0);
  if (totalEnergy < 0.3) return null; // Lowered from 0.5 for more sensitivity

  // Count active notes
  const activeNotes = chroma.filter(val => val > threshold).length;

  // If too many or too few notes are active, it's not a clear chord
  // Relaxed upper limit from 6 to 8 to catch more complex chords
  if (activeNotes < 2 || activeNotes > 8) {
    return null;
  }

  let bestMatch = {
    root: 0,
    type: 'major',
    score: 0,
    suffix: '',
  };

  // Try all 12 roots with all chord types
  for (let root = 0; root < 12; root++) {
    for (const [type, template] of Object.entries(CHORD_TEMPLATES)) {
      let score = 0;
      let noteCount = 0;

      // Calculate correlation between chromagram and template
      for (let i = 0; i < 12; i++) {
        const chromaIdx = (i + root) % 12;
        const templateVal = template[i];

        if (templateVal === 1) {
          // This note should be present
          score += chroma[chromaIdx];
          noteCount++;
        } else {
          // Penalize unwanted notes (but not too heavily)
          score -= chroma[chromaIdx] * 0.2; // Reduced penalty from 0.3 to 0.2
        }
      }

      // Normalize score by number of notes in chord
      score = score / noteCount;

      if (score > bestMatch.score) {
        bestMatch = {
          root,
          type,
          score,
          suffix: getChordSuffix(type),
        };
      }
    }
  }

  // Minimum confidence threshold - lowered for more sensitivity
  if (bestMatch.score < 0.25) return null; // Lowered from 0.4 to 0.25

  // Build chord label
  const rootName = noteNames[bestMatch.root];
  const chordLabel = rootName + bestMatch.suffix;

  // Get chord notes
  const template = CHORD_TEMPLATES[bestMatch.type];
  const chordNotes: string[] = [];
  for (let i = 0; i < 12; i++) {
    if (template[i] === 1) {
      chordNotes.push(noteNames[(bestMatch.root + i) % 12]);
    }
  }

  return {
    label: chordLabel,
    confidence: Math.min(bestMatch.score, 1.0),
    notes: chordNotes,
  };
}

/**
 * Convert chord type to suffix
 */
function getChordSuffix(type: string): string {
  const suffixMap: Record<string, string> = {
    'major': '',
    'minor': 'm',
    'dom7': '7',
    'maj7': 'maj7',
    'min7': 'm7',
    'sus2': 'sus2',
    'sus4': 'sus4',
    'dim': 'dim',
    'aug': 'aug',
  };
  return suffixMap[type] || '';
}

/**
 * Smooth chord sequence to reduce jitter and eliminate short-lived chords
 */
export function smoothChordSequence(
  frames: Array<{ time: number; chord: string; confidence: number }>,
  windowMs: number = 500
): Array<{ time: number; chord: string; confidence: number }> {
  if (frames.length === 0) return [];

  // Remove consecutive duplicates first
  const deduplicated: typeof frames = [];
  for (let i = 0; i < frames.length; i++) {
    if (i === 0 || frames[i].chord !== frames[i - 1].chord) {
      deduplicated.push(frames[i]);
    }
  }

  // Filter out chords that last less than 100ms (reduced from 200ms for more sensitivity)
  const minDuration = 0.1; // 100ms
  const filtered: typeof frames = [];

  for (let i = 0; i < deduplicated.length; i++) {
    const current = deduplicated[i];
    const next = deduplicated[i + 1];

    if (!next) {
      // Last chord, keep it
      filtered.push(current);
      continue;
    }

    const duration = next.time - current.time;
    if (duration >= minDuration) {
      filtered.push(current);
    }
  }

  // Apply median filter for additional smoothing
  const smoothed: typeof frames = [];
  const windowSize = 3;

  for (let i = 0; i < filtered.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(filtered.length, i + Math.ceil(windowSize / 2));
    const window = filtered.slice(start, end);

    // Find most common chord in window
    const chordCounts: Record<string, { count: number; totalConf: number }> = {};

    for (const frame of window) {
      if (!chordCounts[frame.chord]) {
        chordCounts[frame.chord] = { count: 0, totalConf: 0 };
      }
      chordCounts[frame.chord].count++;
      chordCounts[frame.chord].totalConf += frame.confidence;
    }

    // Get chord with highest weighted score (count * average confidence)
    let bestChord = filtered[i].chord;
    let bestScore = 0;

    for (const [chord, stats] of Object.entries(chordCounts)) {
      const avgConf = stats.totalConf / stats.count;
      const score = stats.count * avgConf;
      if (score > bestScore) {
        bestScore = score;
        bestChord = chord;
      }
    }

    smoothed.push({
      time: filtered[i].time,
      chord: bestChord,
      confidence: filtered[i].confidence,
    });
  }

  return smoothed;
}
