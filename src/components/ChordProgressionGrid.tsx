import { motion } from 'framer-motion';
import type { ChordEvent } from '@/types/transcription';

// Simplify chord names for display (e.g., "Cmaj7" -> "C", "Am" -> "Am", "F#m" -> "F#m")
function simplifyChordName(chord: string): string {
  // Extract root note (can be A-G with optional # or b)
  const rootMatch = chord.match(/^([A-G][#b]?)/);
  if (!rootMatch) return chord.substring(0, 2);
  
  const root = rootMatch[1];
  
  // Check for minor (m, min)
  if (/m(?:in|aj)?/i.test(chord)) {
    return root + 'm';
  }
  
  // Otherwise just return root
  return root;
}

interface ChordProgressionGridProps {
  chords: ChordEvent[];
  currentTime: number;
  bpm?: number; // BPM for timing calculation
  beatsPerMeasure?: number; // Default 4
  beatsPerCell?: number; // Default 1 (each cell = 1 beat)
  rows?: number; // Number of rows to display
}

export const ChordProgressionGrid: React.FC<ChordProgressionGridProps> = ({
  chords,
  currentTime,
  bpm,
  beatsPerMeasure = 4,
  beatsPerCell = 1,
  rows = 4,
}) => {
  console.log('ChordProgressionGrid props:', {
    chordsCount: chords.length,
    currentTime,
    bpm,
    chords: chords.slice(0, 5),
  });

  if (chords.length === 0) {
    return (
      <div className="w-full bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-400 text-center">No chords available</p>
      </div>
    );
  }

  // Calculate total duration
  const totalDuration = Math.max(
    ...chords.map(c => c.timestamp),
    currentTime
  ) || 1;

  // Use provided BPM or default to 120
  const estimatedBPM = bpm || 120;
  const secondsPerBeat = 60 / estimatedBPM;
  const secondsPerCell = secondsPerBeat * beatsPerCell;
  const cellsPerMeasure = beatsPerMeasure / beatsPerCell;
  const totalCells = Math.ceil(totalDuration / secondsPerCell);
  const cellsPerRow = cellsPerMeasure;

  // Create grid cells
  const gridCells: Array<{
    time: number;
    chord: string | null;
    isCurrent: boolean;
    row: number;
    col: number;
  }> = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cellsPerRow; col++) {
      const cellIndex = row * cellsPerRow + col;
      const cellTime = cellIndex * secondsPerCell;
      
      if (cellTime > totalDuration) break;

      // Find the chord active at this time
      let activeChord: ChordEvent | null = null;
      for (let i = chords.length - 1; i >= 0; i--) {
        if (chords[i].timestamp <= cellTime) {
          activeChord = chords[i];
          break;
        }
      }

      // Check if this is the current cell
      const cellStart = cellTime;
      const cellEnd = cellTime + secondsPerCell;
      const isCurrent = currentTime >= cellStart && currentTime < cellEnd;

      gridCells.push({
        time: cellTime,
        chord: activeChord ? activeChord.chord : null,
        isCurrent,
        row,
        col,
      });
    }
  }

  // Extract unique chord names for column labels
  const uniqueChords = Array.from(new Set(chords.map(c => c.chord)));
  
  // Group cells by column to determine which columns need labels
  const columnChords = new Map<number, Set<string>>();
  gridCells.forEach(cell => {
    if (cell.chord) {
      if (!columnChords.has(cell.col)) {
        columnChords.set(cell.col, new Set());
      }
      columnChords.get(cell.col)!.add(cell.chord);
    }
  });

  // Get the most common chord per column for labels
  const columnLabels = new Map<number, string>();
  columnChords.forEach((chordSet, col) => {
    const chords = Array.from(chordSet);
    // Count occurrences
    const counts = new Map<string, number>();
    gridCells
      .filter(c => c.col === col && c.chord)
      .forEach(c => {
        counts.set(c.chord!, (counts.get(c.chord!) || 0) + 1);
      });
    
    if (counts.size > 0) {
      const mostCommon = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      columnLabels.set(col, simplifyChordName(mostCommon));
    }
  });

  return (
    <div className="w-full bg-gray-900 rounded-lg p-4 overflow-x-auto">
      {/* Column Labels */}
      <div className="flex mb-2">
        <div className="w-12"></div>
        {Array.from({ length: cellsPerRow }, (_, col) => {
          const label = columnLabels.get(col);
          return (
            <div key={col} className="flex-1 text-center min-w-[60px]">
              {label && (
                <span className="text-white text-lg font-semibold">{label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="space-y-1">
        {Array.from({ length: rows }, (_, row) => {
          const rowCells = gridCells.filter(c => c.row === row);
          if (rowCells.length === 0) return null;

          return (
            <div key={row} className="flex gap-1">
              {/* Row number (optional) */}
              <div className="w-12 flex items-center justify-center">
                <span className="text-xs text-gray-500">{row + 1}</span>
              </div>

              {/* Cells */}
              {rowCells.map((cell, idx) => (
                <motion.div
                  key={`${cell.row}-${cell.col}`}
                  className={`flex-1 min-w-[60px] h-12 rounded flex items-center justify-center text-white font-semibold ${
                    cell.isCurrent
                      ? 'bg-red-500'
                      : cell.chord
                      ? 'bg-gray-800 border border-gray-700'
                      : 'bg-gray-900 border border-gray-800'
                  }`}
                  animate={cell.isCurrent ? {
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {cell.chord && (
                    <span className="text-lg">
                      {simplifyChordName(cell.chord)}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

