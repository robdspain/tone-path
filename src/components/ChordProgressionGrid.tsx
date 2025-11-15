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
  rows?: number; // Minimum rows to display
  keySignature?: string | null;
  timeSignature?: string;
  instrumentLabel?: string;
  onCellClick?: (time: number) => void;
}

const formatTimestamp = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const ChordProgressionGrid: React.FC<ChordProgressionGridProps> = ({
  chords,
  currentTime,
  bpm,
  beatsPerMeasure = 4,
  beatsPerCell = 1,
  rows = 4,
  keySignature,
  timeSignature,
  instrumentLabel,
  onCellClick,
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
  const lastChordTimestamp = chords.length > 0 ? chords[chords.length - 1].timestamp : 0;
  const totalDuration = Math.max(...chords.map(c => c.timestamp), currentTime, lastChordTimestamp + 1) || 1;

  // Use provided BPM or default to 120
  const estimatedBPM = bpm || 120;
  const secondsPerBeat = 60 / estimatedBPM;
  const secondsPerCell = secondsPerBeat * beatsPerCell;
  const cellsPerMeasure = beatsPerMeasure / beatsPerCell;
  const totalCells = Math.ceil(totalDuration / secondsPerCell);
  const cellsPerRow = cellsPerMeasure;
  const computedRows = Math.ceil(totalCells / cellsPerRow);
  const rowCount = Math.max(rows, computedRows);

  // Create grid cells
  const gridCells: Array<{
    time: number;
    chord: string | null;
    isCurrent: boolean;
    row: number;
    col: number;
  }> = [];

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < cellsPerRow; col++) {
      const cellIndex = row * cellsPerRow + col;
      const cellTime = cellIndex * secondsPerCell;

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

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs uppercase tracking-wide">
        <div className="flex flex-wrap gap-2 text-white/70">
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
            Key {keySignature || '—'}
          </span>
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
            {timeSignature || `${beatsPerMeasure}/${beatsPerCell}`}
          </span>
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
            BPM ≈ {Math.round(estimatedBPM)}
          </span>
          {instrumentLabel && (
            <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 capitalize">
              {instrumentLabel}
            </span>
          )}
        </div>
        <div className="text-white/60">
          Cells per measure: {cellsPerRow}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="flex bg-white/5 text-[11px] uppercase text-white/60">
          <div className="w-14 px-2 py-2 border-r border-white/10">Bar</div>
          {Array.from({ length: cellsPerRow }, (_, idx) => (
            <div
              key={`label-${idx}`}
              className="flex-1 min-w-[60px] px-2 py-2 text-center border-r border-white/5 last:border-r-0"
            >
              Beat {idx + 1}
            </div>
          ))}
        </div>

        {Array.from({ length: rowCount }, (_, row) => {
          const rowCells = gridCells.filter(c => c.row === row);
          return (
            <div
              key={row}
              className="flex border-t border-white/10 last:border-b-0"
            >
              <div className="w-14 px-2 py-3 text-center text-xs text-white/60 border-r border-white/10">
                {row}
              </div>

              <div className="flex flex-1 divide-x divide-white/10">
                {rowCells.map((cell) => {
                  const chordLabel = cell.chord ? simplifyChordName(cell.chord) : '';
                  return (
                    <motion.button
                      type="button"
                      key={`${cell.row}-${cell.col}`}
                      onClick={() => onCellClick?.(cell.time)}
                      className={`flex-1 min-w-[70px] px-2 py-3 text-left transition ${
                        cell.isCurrent
                          ? 'bg-emerald-500/15 border border-emerald-400 text-white shadow-inner shadow-emerald-500/40'
                          : 'bg-slate-900/40 border border-transparent hover:bg-slate-800/60'
                      }`}
                      animate={
                        cell.isCurrent
                          ? {
                              scale: [1, 1.01, 1],
                              transition: { duration: 1, repeat: Infinity },
                            }
                          : undefined
                      }
                    >
                      <div className="text-sm font-semibold text-white">
                        {cell.chord ? chordLabel : '—'}
                      </div>
                      <div className="text-[11px] text-white/60">
                        {cell.chord ? cell.chord : 'Empty'}
                      </div>
                      <div className="text-[10px] text-white/40 mt-1">
                        {formatTimestamp(cell.time)}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
