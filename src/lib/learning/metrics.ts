// Learning mode metrics and evaluation
import type { PerformanceMetrics, PracticeTarget } from '@/types/learning';
import type { NoteEvent } from '@/types/transcription';

/**
 * Evaluate user performance against target pattern
 */
export function evaluatePerformance(
  liveNotes: NoteEvent[],
  target: PracticeTarget
): PerformanceMetrics {
  if (!target.targetPattern || target.targetPattern.length === 0) {
    return {
      accuracy: 0,
      timingDeviation: 0,
      pitchError: 0,
      correctNotes: 0,
      totalNotes: 0,
    };
  }
  
  let correctNotes = 0;
  let totalTimingDeviation = 0;
  let totalPitchError = 0;
  const totalNotes = Math.max(liveNotes.length, target.targetPattern.length);
  
  // Match live notes to target pattern
  const timingWindow = 0.2; // 200ms tolerance
  
  for (const targetNote of target.targetPattern) {
    // Find closest live note within timing window
    const matchingNote = liveNotes.find(note => 
      Math.abs(note.timestamp - targetNote.time) < timingWindow &&
      note.note === targetNote.note
    );
    
    if (matchingNote) {
      correctNotes++;
      totalTimingDeviation += Math.abs(matchingNote.timestamp - targetNote.time) * 1000; // Convert to ms
      
      // Calculate pitch error in cents
      const targetFreq = noteToFrequency(targetNote.note);
      const liveFreq = matchingNote.frequency;
      if (targetFreq && liveFreq) {
        const cents = 1200 * Math.log2(liveFreq / targetFreq);
        totalPitchError += Math.abs(cents);
      }
    }
  }
  
  const accuracy = totalNotes > 0 ? correctNotes / totalNotes : 0;
  const avgTimingDeviation = correctNotes > 0 ? totalTimingDeviation / correctNotes : 0;
  const avgPitchError = correctNotes > 0 ? totalPitchError / correctNotes : 0;
  
  return {
    accuracy,
    timingDeviation: avgTimingDeviation,
    pitchError: avgPitchError,
    correctNotes,
    totalNotes,
  };
}

/**
 * Convert note name to frequency
 */
function noteToFrequency(note: string): number | null {
  const NOTE_FREQUENCIES: Record<string, number> = {
    'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
    'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
    'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
    'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
    'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  };
  
  return NOTE_FREQUENCIES[note] || null;
}

/**
 * Calculate accuracy percentage with color coding
 */
export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 0.9) return 'text-green-400';
  if (accuracy >= 0.7) return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Format timing deviation for display
 */
export function formatTimingDeviation(ms: number): string {
  if (ms < 50) return `±${Math.round(ms)}ms`;
  return `±${Math.round(ms)}ms`;
}

/**
 * Format pitch error for display
 */
export function formatPitchError(cents: number): string {
  return `±${Math.round(cents)}c`;
}

