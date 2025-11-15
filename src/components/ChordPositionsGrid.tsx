import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getAllChordFingerings, type ChordFingering, type ChordInstrument } from '@/utils/chordFingerings';

interface ChordPositionsGridProps {
  chordName: string;
  instrument?: 'guitar' | 'ukulele';
  maxPositions?: number;
  startIndex?: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const GUITAR_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];
const UKULELE_TUNING = ['G', 'C', 'E', 'A'];
const ROOT_BADGE_CLASSES =
  'bg-gradient-to-br from-rose-400 via-orange-400 to-yellow-200 text-slate-900 shadow-[0_6px_18px_rgba(249,115,22,0.45)]';

type StringNoteDetail = {
  display: string;
  pitch: string | null;
};

function calculateDifficulty(fingering: ChordFingering): number {
  let difficulty = 0;
  const frettedCount = fingering.frets.filter((f) => f > 0).length;
  difficulty += frettedCount * 2;

  if (fingering.barres && fingering.barres.length > 0) {
    difficulty += fingering.barres.length * 5;
  }

  if (fingering.baseFret && fingering.baseFret > 0) {
    difficulty += fingering.baseFret;
  }

  const frettedFrets = fingering.frets.filter((f) => f > 0);
  if (frettedFrets.length > 0) {
    const minFret = Math.min(...frettedFrets);
    const maxFret = Math.max(...frettedFrets);
    const stretch = maxFret - minFret;
    if (stretch > 3) difficulty += (stretch - 3) * 2;
  }

  return difficulty;
}

function getStringNotes(fingering: ChordFingering, isUkulele: boolean): StringNoteDetail[] {
  const tuning = isUkulele ? UKULELE_TUNING : GUITAR_TUNING;
  const baseFret = fingering.baseFret || 0;

  return fingering.frets.map((fret, stringIdx) => {
    if (fret === -1) {
      return { display: 'X', pitch: null };
    }

    const openNote = tuning[stringIdx];
    if (fret === 0) {
      return { display: 'O', pitch: openNote };
    }

    const openIndex = NOTE_NAMES.indexOf(openNote);
    if (openIndex === -1) {
      return { display: '', pitch: null };
    }

    const actualFret = baseFret > 0 ? baseFret + fret - 1 : fret;
    const noteIndex = (openIndex + actualFret) % 12;
    const pitch = NOTE_NAMES[noteIndex];
    return { display: pitch, pitch };
  });
}

function getChordNotes(chordName: string): string[] {
  const rootMatch = chordName.match(/^([A-G][#b]?)/);
  if (!rootMatch) return [];

  const root = rootMatch[1];
  const rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) return [root];

  const chordNotes: string[] = [root];

  if (chordName.includes('sus2')) {
    chordNotes.push(NOTE_NAMES[(rootIndex + 2) % 12]);
    chordNotes.push(NOTE_NAMES[(rootIndex + 7) % 12]);
  } else if (chordName.includes('sus4')) {
    chordNotes.push(NOTE_NAMES[(rootIndex + 5) % 12]);
    chordNotes.push(NOTE_NAMES[(rootIndex + 7) % 12]);
  } else if (chordName.includes('m') && !chordName.includes('maj')) {
    chordNotes.push(NOTE_NAMES[(rootIndex + 3) % 12]);
    chordNotes.push(NOTE_NAMES[(rootIndex + 7) % 12]);
  } else {
    chordNotes.push(NOTE_NAMES[(rootIndex + 4) % 12]);
    chordNotes.push(NOTE_NAMES[(rootIndex + 7) % 12]);
  }

  return [...new Set(chordNotes)];
}

function normalizeRoot(note?: string | null): string | null {
  if (!note) return null;
  const match = note.match(/^([A-G][#b]?)/i);
  if (!match) return null;
  const root = match[1].toUpperCase();
  if (root === 'DB') return 'C#';
  if (root === 'EB') return 'D#';
  if (root === 'GB') return 'F#';
  if (root === 'AB') return 'G#';
  if (root === 'BB') return 'A#';
  return root;
}

function getDifficultyLabel(score: number): string {
  if (score <= 6) return 'Beginner';
  if (score <= 12) return 'Intermediate';
  return 'Advanced';
}

function getDifficultyPercent(score: number): number {
  const clamped = Math.min(Math.max(score, 2), 20);
  return ((clamped - 2) / 18) * 100;
}

const IGNORED_SUFFIXES = ['add9', 'add11', 'add13'];
const POWER_CHORD_SUFFIX = /5$/;

function simplifyChordForDiagram(name: string): { chord: string } {
  let working = name.trim();
  const original = working;

  // Remove parenthetical hints (e.g., C (M3))
  if (/\(/.test(working)) {
    working = working.replace(/\([^)]*\)/g, '').trim();
  }

  // Remove slash bass notes (use main chord)
  if (working.includes('/')) {
    working = working.split('/')[0]?.trim() || working;
  }

  // Remove explicit add extensions (convert to base triad)
  IGNORED_SUFFIXES.forEach((suffix) => {
    if (working.toLowerCase().includes(suffix)) {
      working = working.replace(new RegExp(suffix, 'ig'), '');
    }
  });

  // Convert extensions 9/11/13 to 7 where possible
  if (/(9|11|13)/.test(working)) {
    working = working.replace(/(maj|m|sus|dim|aug)?(9|11|13)/gi, (match, quality, extent) => {
      if (!quality) return '';
      return quality.toLowerCase().includes('maj') ? 'maj7' : quality.toLowerCase().includes('m') ? 'm7' : quality;
    });
  }

  // Power chords -> use root major
  if (POWER_CHORD_SUFFIX.test(working)) {
    working = working.replace(POWER_CHORD_SUFFIX, '');
  }

  // Remove whitespace
  working = working.replace(/\s+/g, '');

  if (!working) {
    return { chord: original };
  }

  return { chord: working };
}

const ChordDiagramSvg: React.FC<{ fingering: ChordFingering; isUkulele: boolean; rootNote?: string | null }> = ({
  fingering,
  isUkulele,
  rootNote,
}) => {
  const gradientId = useMemo(() => `root-grad-${Math.random().toString(36).slice(2, 9)}`, []);
  const strings = isUkulele ? 4 : 6;
  const fretsToShow = 4;
  const width = isUkulele ? 140 : 170;
  const height = 200;
  const paddingX = 24;
  const paddingY = 26;
  const stringSpacing = strings > 1 ? (width - paddingX * 2) / (strings - 1) : 0;
  const fretSpacing = (height - paddingY * 2) / fretsToShow;
  const baseFret = fingering.baseFret && fingering.baseFret > 0 ? fingering.baseFret : 1;
  const showNut = baseFret <= 1;
  const tuning = isUkulele ? UKULELE_TUNING : GUITAR_TUNING;

  const stringXPositions = Array.from({ length: strings }, (_, idx) => paddingX + idx * stringSpacing);
  const fretLines = Array.from({ length: fretsToShow + 1 }, (_, idx) => paddingY + idx * fretSpacing);

  const getDisplayFret = (fret: number) => {
    if (fret <= 0) return fret;
    return baseFret > 1 ? fret - baseFret + 1 : fret;
  };

  const getPitchForString = (stringIdx: number, fret: number): string | null => {
    if (fret < 0) return null;
    const openNote = tuning[stringIdx];
    const openIndex = NOTE_NAMES.indexOf(openNote);
    if (openIndex === -1) return null;
    if (fret === 0) return openNote;
    const actualFret = fingering.baseFret && fingering.baseFret > 0 ? fingering.baseFret + fret - 1 : fret;
    return NOTE_NAMES[(openIndex + actualFret) % 12];
  };

  const fingerDots = (fingering.frets
    .map((fret, idx) => ({ fret, idx }))
    .filter(({ fret }) => fret > 0)
    .map(({ fret, idx }) => {
      const displayFret = getDisplayFret(fret);
      if (displayFret < 1 || displayFret > fretsToShow + (showNut ? 0 : 1)) {
        return null;
      }
      const cx = stringXPositions[idx];
      const cy = paddingY + (displayFret - 0.5) * fretSpacing;
      const pitch = getPitchForString(idx, fret);
      const isRootFinger = rootNote && pitch === rootNote;
      const fill = isRootFinger ? `url(#${gradientId})` : '#FFE29F';
      return <circle key={`finger-${idx}`} cx={cx} cy={cy} r={9} fill={fill} stroke="#0B1221" strokeWidth={2} />;
    })
    .filter(Boolean)) as JSX.Element[];

  const barreShapes = (fingering.barres || []).map((barre, idx) => {
    const displayFret = getDisplayFret(barre.fret);
    if (displayFret < 1 || displayFret > fretsToShow) return null;
    const y = paddingY + (displayFret - 0.5) * fretSpacing;
    const startX = stringXPositions[barre.fromString];
    const endX = stringXPositions[barre.toString];
    return (
      <rect
        key={`barre-${idx}`}
        x={Math.min(startX, endX) - 10}
        y={y - 8}
        width={Math.abs(endX - startX) + 20}
        height={16}
        rx={8}
        fill="#FFD18C"
        stroke="#0B1221"
        strokeWidth={2}
      />
    );
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="200" className="text-white">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
      </defs>
      {/* Strings */}
      {stringXPositions.map((x, idx) => (
        <line key={`string-${idx}`} x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke="#27314a" strokeWidth={2} />
      ))}

      {/* Frets */}
      {fretLines.map((y, idx) => (
        <line
          key={`fret-${idx}`}
          x1={paddingX - 10}
          x2={width - paddingX + 10}
          y1={y}
          y2={y}
          stroke={idx === 0 && showNut ? '#F4F8FF' : '#27314a'}
          strokeWidth={idx === 0 && showNut ? 5 : 2}
        />
      ))}

      {/* Base fret indicator for movable shapes */}
      {!showNut && (
        <text x={width - paddingX} y={paddingY - 8} textAnchor="end" fontSize={12} fill="#9AA8C8">
          {baseFret}fr
        </text>
      )}

      {/* Barre shapes */}
      {barreShapes}

      {/* Finger dots */}
      {fingerDots}

      {/* Open/muted markers */}
      {fingering.frets.map((fret, idx) => {
        const marker = fret === -1 ? 'X' : fret === 0 ? 'O' : '';
        if (!marker) return null;
        const x = stringXPositions[idx];
        const pitch = getPitchForString(idx, fret);
        const isRoot = pitch && rootNote && pitch === rootNote;
        const fill =
          marker === 'X' ? '#FCA5A5' : isRoot ? '#f97316' : '#9AE6B4';
        return (
          <text key={`marker-${idx}`} x={x} y={paddingY - 12} textAnchor="middle" fontSize={14} fill={fill}>
            {marker}
          </text>
        );
      })}
    </svg>
  );
};

const ChordDiagramCard: React.FC<{
  fingering: ChordFingering;
  index: number;
  startIndex: number;
  isUkulele: boolean;
  rootNote?: string | null;
}> = ({ fingering, index, startIndex, isUkulele, rootNote }) => {
  const stringNotes = useMemo(() => getStringNotes(fingering, isUkulele), [fingering, isUkulele]);
  const difficulty = calculateDifficulty(fingering);
  const position = fingering.baseFret || 1;
  const positionLabel = position > 1 ? `${position}fr` : 'Open';
  const difficultyLabel = getDifficultyLabel(difficulty);
  const difficultyPercent = getDifficultyPercent(difficulty);
  const shapeIndex = startIndex + index + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c162c] to-[#050b18] p-4 flex flex-col gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/50">
        <span>Shape {shapeIndex}</span>
        <span>{positionLabel}</span>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
          <span>{difficultyLabel}</span>
          <span>{Math.round(difficultyPercent)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full ${difficulty <= 6 ? 'bg-emerald-400' : difficulty <= 12 ? 'bg-amber-400' : 'bg-rose-400'}`}
            style={{ width: `${difficultyPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-[#050b18] border border-white/5 flex items-center justify-center">
        <ChordDiagramSvg fingering={fingering} isUkulele={isUkulele} rootNote={rootNote} />
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-widest flex-wrap">
        {stringNotes.map(({ display, pitch }, noteIdx) => (
          <span
            key={`${shapeIndex}-${noteIdx}`}
            className={`px-2 py-1 rounded-full ${
              display === 'X'
                ? 'bg-rose-500/20 text-rose-200'
                : pitch && rootNote && pitch === rootNote
                ? ROOT_BADGE_CLASSES
                : display === 'O'
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'bg-white/10 text-white'
            }`}
          >
            {display === 'O' && pitch ? pitch : display}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export const ChordPositionsGrid: React.FC<ChordPositionsGridProps> = ({
  chordName,
  instrument = 'guitar',
  maxPositions = 6,
  startIndex = 0,
}: ChordPositionsGridProps) => {
  const isUkulele = instrument === 'ukulele';
  const chordInstrument: ChordInstrument = isUkulele ? 'ukulele' : 'guitar';

  const { chord: diagramChordName } = useMemo(() => simplifyChordForDiagram(chordName), [chordName]);

  const chordNotes = useMemo(() => getChordNotes(diagramChordName), [diagramChordName]);
  const rootNote = useMemo(() => chordNotes[0] || normalizeRoot(diagramChordName), [chordNotes, diagramChordName]);
  const sortedFingerings = useMemo(() => {
    const allFingerings = getAllChordFingerings(diagramChordName, chordInstrument);
    return [...allFingerings]
      .map((f) => ({ fingering: f, difficulty: calculateDifficulty(f) }))
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(startIndex, startIndex + maxPositions)
      .map((item) => item.fingering);
  }, [diagramChordName, chordInstrument, maxPositions, startIndex]);

  if (sortedFingerings.length === 0) {
    return (
      <div className="w-full p-6 text-center text-white/60 space-y-2 rounded-2xl border border-white/10 bg-slate-900/40">
        <div className="text-lg font-semibold">{chordName}</div>
        <div className="text-sm">
          No diagrams yet for this chord voicing. Try a related shape or simplify the chord quality.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[32px] bg-gradient-to-b from-[#040a1d] to-[#020611] border border-white/10 p-5 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.55)] space-y-6">
      <div className="text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.65em] text-white/60">Positions ranked</p>
        <h2 className="text-3xl font-semibold text-white">{chordName}</h2>
        <p className="text-sm text-white/60">from easiest to most difficult</p>
        {diagramChordName !== chordName && (
          <p className="text-xs text-white/40">
            Displaying voicings for {diagramChordName} (closest available match).
          </p>
        )}
        {chordNotes.length > 0 && (
          <div className="flex gap-3 justify-center flex-wrap pt-3">
            {chordNotes.map((note, idx) => (
              <span
                key={`${note}-${idx}`}
                className="w-12 h-12 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white font-semibold text-lg shadow-inner shadow-black/30"
              >
                {note}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sortedFingerings.map((fingering, index) => (
          <ChordDiagramCard
            key={`${chordName}-${startIndex + index}`}
            fingering={fingering}
            index={index}
            startIndex={startIndex}
            isUkulele={isUkulele}
            rootNote={rootNote}
          />
        ))}
      </div>
    </div>
  );
};
