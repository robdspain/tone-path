// Magenta.js integration for AI backing band generation
// Note: Magenta.js requires additional setup - this is a foundation

/**
 * Generate backing band pattern using Magenta.js models
 * Falls back to pattern-based generation if Magenta.js not available
 */
export async function generateBandPattern(input: {
  key: string;
  bpm: number;
  style: "rock" | "blues" | "funk" | "jazz" | "pop" | "lofi";
  bars: number;
  detectedChords?: string[];
}): Promise<{
  drums: number[][];
  bass: { note: string; time: number; duration: number }[];
  style: "rock" | "blues" | "funk" | "jazz" | "pop" | "lofi";
}> {
  // Check if Magenta.js is available
  // Note: Magenta.js is optional - if not installed, use pattern-based generation
  // For now, always use pattern-based generation
  // To enable Magenta.js: pnpm add @magenta/music
  // Then uncomment the code below and implement generateWithMagenta
  
  // TODO: Implement Magenta.js integration when package is installed
  // try {
  //   const mm = await import('@magenta/music');
  //   if (mm && mm.MusicRNN) {
  //     return await generateWithMagenta(input, mm);
  //   }
  // } catch (error) {
  //   console.warn('Magenta.js not available, using pattern-based generation');
  // }
  
  // Always use pattern-based generation (works without Magenta.js)
  return generatePatternBased(input);
}

/**
 * Generate pattern using Magenta.js (if available)
 */
async function generateWithMagenta(input: any, mm: any): Promise<any> {
  // TODO: Implement Magenta.js MusicRNN integration
  // This requires loading pre-trained models
  // For now, fall back to pattern-based
  return generatePatternBased(input);
}

/**
 * Pattern-based generation (fallback when Magenta.js not available)
 */
function generatePatternBased(input: {
  key: string;
  bpm: number;
  style: "rock" | "blues" | "funk" | "jazz" | "pop" | "lofi";
  bars: number;
  detectedChords?: string[];
}): {
  drums: number[][];
  bass: { note: string; time: number; duration: number }[];
  style: "rock" | "blues" | "funk" | "jazz" | "pop" | "lofi";
} {
  const beatsPerBar = 4;
  const totalBeats = input.bars * beatsPerBar;
  const beatDuration = 60 / input.bpm; // seconds per beat
  
  // Generate drum pattern based on style
  const drums = generateDrumPattern(input.style, totalBeats, beatDuration);
  
  // Generate bass pattern based on key and detected chords
  const bass = generateBassPattern(input.key, input.detectedChords || [], totalBeats, beatDuration);
  
  return { drums, bass, style: input.style };
}

/**
 * Generate drum pattern based on style
 */
function generateDrumPattern(style: string, totalBeats: number, beatDuration: number): number[][] {
  const pattern: number[][] = [];
  
  // Basic patterns per style
  const patterns: Record<string, number[]> = {
    rock: [1, 0, 0, 0, 1, 0, 0, 0],      // Kick on 1 and 3
    blues: [1, 0, 1, 0, 1, 0, 1, 0],     // Shuffle
    funk: [1, 0, 0, 1, 0, 1, 0, 0],      // Syncopated
    jazz: [1, 0, 0, 0, 0, 0, 1, 0],      // Sparse
    pop: [1, 0, 0, 1, 0, 0, 1, 0],       // Steady
    lofi: [1, 0, 0, 0, 0, 1, 0, 0],      // Laid-back
  };
  
  const stylePattern = patterns[style] || patterns.pop;
  
  for (let beat = 0; beat < totalBeats; beat++) {
    const patternIndex = beat % stylePattern.length;
    if (stylePattern[patternIndex] > 0) {
      pattern.push([beat * beatDuration, 0.8]); // [time, velocity]
    }
  }
  
  return pattern;
}

/**
 * Generate bass pattern based on key and chords
 */
function generateBassPattern(
  key: string,
  chords: string[],
  totalBeats: number,
  beatDuration: number
): { note: string; time: number; duration: number }[] {
  const bassNotes: { note: string; time: number; duration: number }[] = [];
  
  // Map chord names to root notes
  const chordToRoot = (chord: string): string => {
    // Extract root note (first letter(s))
    const match = chord.match(/^([A-G]#?b?)/);
    return match ? match[1] : 'C';
  };
  
  // If chords provided, use them; otherwise generate from key
  const roots = chords.length > 0 
    ? chords.map(chordToRoot)
    : generateChordProgression(key, totalBeats);
  
  const notesPerBeat = Math.max(1, Math.floor(4 / roots.length));
  
  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    const time = (i * totalBeats / roots.length) * beatDuration;
    bassNotes.push({
      note: root + '2', // Bass octave
      time,
      duration: beatDuration * notesPerBeat,
    });
  }
  
  return bassNotes;
}

/**
 * Generate chord progression from key
 */
function generateChordProgression(key: string, totalBeats: number): string[] {
  // Simple I-IV-V progression
  const keyMap: Record<string, string[]> = {
    'C': ['C', 'F', 'G'],
    'D': ['D', 'G', 'A'],
    'E': ['E', 'A', 'B'],
    'F': ['F', 'Bb', 'C'],
    'G': ['G', 'C', 'D'],
    'A': ['A', 'D', 'E'],
    'B': ['B', 'E', 'F#'],
  };
  
  const root = key.replace(/[^A-G]/, '').toUpperCase();
  const progression = keyMap[root] || keyMap['C'];
  
  // Repeat progression to fill total beats
  const repeats = Math.ceil(totalBeats / progression.length);
  return Array(repeats).fill(progression).flat().slice(0, Math.ceil(totalBeats / 4));
}

