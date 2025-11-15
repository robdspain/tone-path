import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Instrument, ChordEvent } from '@/types/transcription';
import { PianoChordDisplay } from './PianoChordDisplay';
import { ChordPositionsGrid } from './ChordPositionsGrid';
import { getAllChordFingerings, type ChordInstrument, type ChordFingering } from '@/utils/chordFingerings';

interface ScaleChordViewProps {
  instrument: Instrument;
  detectedKey?: string | null;
  currentChord?: ChordEvent | null;
  tempo?: number | null;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_RAIL = ['N', ...NOTE_NAMES];
const MODE_OPTIONS = ['Chord', 'Scale', 'Custom'] as const;
const FINGERING_SYSTEMS = ['3NPS', 'CAGED', 'None'] as const;

type ModeOption = (typeof MODE_OPTIONS)[number];
type FingeringOption = (typeof FINGERING_SYSTEMS)[number];

type LabelState = {
  notes: boolean;
  degrees: boolean;
  intervals: boolean;
  root: boolean;
};

const DEFAULT_LABELS: LabelState = {
  notes: true,
  degrees: false,
  intervals: false,
  root: false,
};

const ROOT_BADGE_CLASSES =
  'bg-gradient-to-br from-rose-400 via-orange-400 to-yellow-200 text-slate-900 shadow-[0_6px_18px_rgba(249,115,22,0.45)]';

const buildMajorScale = (root: string): string[] => {
  const intervals = [0, 2, 4, 5, 7, 9, 11];
  const rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) return [];
  return intervals.map((interval) => NOTE_NAMES[(rootIndex + interval) % 12]);
};

const normalizeRoot = (value?: string | null): string | null => {
  if (!value) return null;
  const match = value.match(/^([A-G][#b]?)/i);
  if (!match) return null;
  const root = match[1].toUpperCase();
  if (root === 'DB') return 'C#';
  if (root === 'EB') return 'D#';
  if (root === 'GB') return 'F#';
  if (root === 'AB') return 'G#';
  if (root === 'BB') return 'A#';
  return root;
};

const CHORD_INTERVALS: Record<string, number[]> = {
  maj: [0, 4, 7],
  m: [0, 3, 7],
  '': [0, 4, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
};

const deriveChordNotes = (chordName: string, fallbackRoot: string): string[] => {
  const root = normalizeRoot(chordName) || fallbackRoot;
  if (!root) return [];
  const remainder = chordName.slice(root.length);
  const quality = Object.keys(CHORD_INTERVALS).find((q) => remainder.toLowerCase().startsWith(q)) || '';
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS.maj;
  const rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) return [];
  return intervals.map((interval) => NOTE_NAMES[(rootIndex + interval) % 12]);
};

const intervalLabel = (semitones: number, type: 'degrees' | 'intervals'): string => {
  const DEGREE_MAP: Record<number, string> = {
    0: '1',
    1: 'b2',
    2: '2',
    3: 'b3',
    4: '3',
    5: '4',
    6: 'b5',
    7: '5',
    8: '#5',
    9: '6',
    10: 'b7',
    11: '7',
  };
  const INTERVAL_MAP: Record<number, string> = {
    0: 'P1',
    1: 'm2',
    2: 'M2',
    3: 'm3',
    4: 'M3',
    5: 'P4',
    6: 'TT',
    7: 'P5',
    8: 'm6',
    9: 'M6',
    10: 'm7',
    11: 'M7',
  };
  return type === 'degrees' ? DEGREE_MAP[semitones] || '?' : INTERVAL_MAP[semitones] || '?';
};

const getNoteAtFret = (openNote: string, fret: number): string => {
  const openIndex = NOTE_NAMES.indexOf(openNote);
  if (openIndex === -1) return '';
  return NOTE_NAMES[(openIndex + fret) % 12];
};

const getVoicingChips = (fingering: ChordFingering): string[] => {
  const chips: string[] = [];
  if (fingering.barres && fingering.barres.length > 0) chips.push('Barre');
  if (fingering.frets.some((fret) => fret === 0)) chips.push('Open');
  if (fingering.baseFret && fingering.baseFret > 7) chips.push('Upper');
  if (!chips.length) chips.push('Shape');
  return chips;
};

export const ScaleChordView: React.FC<ScaleChordViewProps> = ({
  instrument,
  detectedKey,
  currentChord,
  tempo,
}) => {
  const chordInstrument: ChordInstrument = instrument === 'ukulele' ? 'ukulele' : 'guitar';
  const [harmonyView, setHarmonyView] = useState<'Chord' | 'Scale'>('Chord');
  const [mode, setMode] = useState<ModeOption>('Chord');
  const [fingeringSystem, setFingeringSystem] = useState<FingeringOption>('3NPS');
  const [labels, setLabels] = useState<LabelState>(DEFAULT_LABELS);
  const [selectedRoot, setSelectedRoot] = useState<string>('C');
  const [fretRange, setFretRange] = useState<[number, number]>([0, 12]);
  const [showAllNotes, setShowAllNotes] = useState(true);
  const [additionalBoards, setAdditionalBoards] = useState(0);

  const detectedRoot = normalizeRoot(currentChord?.chord) || normalizeRoot(detectedKey) || 'C';

  useEffect(() => {
    setSelectedRoot(detectedRoot || 'C');
  }, [detectedRoot]);

  const activeChordName = useMemo(() => {
    if (currentChord?.chord) return currentChord.chord;
    if (harmonyView === 'Scale') return `${selectedRoot}maj7`;
    return `${selectedRoot}`;
  }, [currentChord?.chord, harmonyView, selectedRoot]);

  const chordNotes = useMemo(
    () => deriveChordNotes(activeChordName, selectedRoot),
    [activeChordName, selectedRoot],
  );
  const scaleNotes = useMemo(() => buildMajorScale(selectedRoot), [selectedRoot]);
  const displayNotes = harmonyView === 'Scale' || mode === 'Scale' ? scaleNotes : chordNotes;
  const noteSet = useMemo(() => new Set(displayNotes), [displayNotes]);
  const rootNote = displayNotes[0] || selectedRoot;

  const handleNoteSelect = (note: string) => {
    if (note === 'N') {
      if (detectedRoot) setSelectedRoot(detectedRoot);
      return;
    }
    setSelectedRoot(note);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        (navigator as any).vibrate?.(10);
      } catch {
        // ignore vibration errors
      }
    }
  };

  const toggleLabel = (key: keyof LabelState) => {
    setLabels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setRangeValue = (index: 0 | 1, value: number) => {
    setFretRange((prev) => {
      const next: [number, number] = [...prev] as [number, number];
      next[index] = value;
      if (next[0] > next[1]) {
        return index === 0 ? [value, value] : [value, value];
      }
      return next;
    });
  };

  const fretWindow = fretRange[1] - fretRange[0] + 1;

  const strings =
    instrument === 'ukulele'
      ? ['G', 'C', 'E', 'A']
      : instrument === 'bass'
      ? ['E', 'A', 'D', 'G']
      : ['E', 'A', 'D', 'G', 'B', 'E'];

  const renderFretboard = (index: number) => {
    const start = Math.min(12, fretRange[0] + index * 5);
    const end = Math.min(17, start + fretWindow - 1);
    const columns = Math.max(1, end - start + 1);

    return (
      <div
        key={`board-${index}-${start}`}
        className="rounded-2xl border border-white/10 bg-[#060b18] p-4 space-y-3 shadow-[0_15px_35px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.4em] text-white/60 mb-1">
          <span>
            {start === 0 ? 'Open' : `Fret ${start}`} – {`Fret ${end}`}
          </span>
          <span>{fingeringSystem}</span>
        </div>
        <div className="space-y-2">
          {strings.map((open, stringIdx) => (
            <div key={`${open}-${stringIdx}`} className="flex items-center gap-2">
              <span className="w-6 text-xs font-semibold text-white/60 text-right">{open}</span>
              <div
                className="flex-1 grid gap-1 relative"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(32px, 1fr))` }}
              >
                {Array.from({ length: columns }, (_, offset) => {
                  const fret = start + offset;
                  const note = getNoteAtFret(open, fret);
                  const inCollection = noteSet.has(note);
                  const interval = ((NOTE_NAMES.indexOf(note) - NOTE_NAMES.indexOf(rootNote) + 12) % 12) as number;
                  const isRoot = interval === 0;
                  const isThird = interval === 3 || interval === 4;
                  const isFifth = interval === 7;
                  const showMarker = showAllNotes ? inCollection : isRoot;

                  let badgeColor = 'bg-white/10 text-white/70';
                  if (showMarker) {
                    if (isRoot) badgeColor = ROOT_BADGE_CLASSES;
                    else if (isThird) badgeColor = 'bg-teal-300/90 text-slate-900';
                    else if (isFifth) badgeColor = 'bg-white text-slate-900';
                    else badgeColor = 'bg-sky-400/80 text-slate-900';
                  }

                  let labelText = '';
                  if (labels.notes && showMarker) labelText = note;
                  else if (labels.degrees && showMarker) labelText = intervalLabel(interval, 'degrees');
                  else if (labels.intervals && showMarker) labelText = intervalLabel(interval, 'intervals');
                  else if (labels.root && showMarker && isRoot) labelText = 'R';

                  return (
                    <div
                      key={`${stringIdx}-${fret}`}
                      className="relative h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center"
                    >
                      {stringIdx === 0 && (
                        <span className="absolute -top-4 text-[10px] font-semibold text-white/60">
                          {fret === 0 ? 'O' : fret}
                        </span>
                      )}
                      {showMarker && (
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold ${badgeColor}`}
                        >
                          {labelText || note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const allFingerings = useMemo(() => getAllChordFingerings(activeChordName, chordInstrument), [activeChordName, chordInstrument]);
  const positionsPerSlide = instrument === 'ukulele' ? 2 : 3;
  const slideCount = Math.max(1, Math.ceil(allFingerings.length / positionsPerSlide));

  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-950/70 p-5 sm:p-6 lg:p-8 space-y-6">
      {/* Sticky header */}
      <div className="sticky top-[72px] z-10 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-900/40 p-4 shadow-lg shadow-black/40 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Now Playing</p>
            <div className="flex items-center gap-3 text-white text-2xl font-semibold">
              <span>{currentChord?.chord || '—'}</span>
              <span className="text-white/60 text-lg">•</span>
              <span>{detectedKey || selectedRoot}</span>
              <span className="text-white/60 text-lg">•</span>
              <span>{tempo ? `${tempo} bpm` : '— bpm'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-full p-1">
            {(['Chord', 'Scale'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setHarmonyView(item)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition ${
                  harmonyView === item ? 'bg-white text-slate-900' : 'text-white/70'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick note rail */}
      <div className="flex overflow-x-auto gap-2 pb-2" role="tablist" aria-label="Root selector">
        {NOTE_RAIL.map((note) => (
          <button
            key={note}
            type="button"
            onClick={() => handleNoteSelect(note)}
            className={`px-3 py-2 rounded-2xl border text-sm font-semibold min-w-[48px] ${
              (note === 'N' && selectedRoot === detectedRoot) || (note !== 'N' && selectedRoot === note)
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'border-white/10 text-white/70'
            }`}
          >
            {note}
          </button>
        ))}
      </div>

      {/* Mode panel */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">Mode</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ModeOption)}
              className="rounded-xl bg-white/10 border border-white/10 text-white px-3 py-2"
            >
              {MODE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">Fingering System</span>
            <div className="flex bg-white/10 rounded-xl p-1">
              {FINGERING_SYSTEMS.map((system) => (
                <button
                  key={system}
                  type="button"
                  onClick={() => setFingeringSystem(system)}
                  className={`flex-1 px-2 py-1 text-xs font-semibold rounded-lg ${
                    fingeringSystem === system ? 'bg-white text-slate-900' : 'text-white/70'
                  }`}
                >
                  {system}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['notes', 'degrees', 'intervals', 'root'] as Array<keyof LabelState>).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleLabel(label)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  labels[label] ? 'bg-white text-slate-900 border-white' : 'border-white/10 text-white/70'
                }`}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fret range slider */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Fret Window</span>
          <span>
            {fretRange[0]} – {fretRange[1]}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min={0}
            max={12}
            value={fretRange[0]}
            onChange={(e) => setRangeValue(0, Math.min(parseInt(e.target.value, 10), fretRange[1] - 1))}
            className="accent-emerald-400"
          />
          <input
            type="range"
            min={fretRange[0] + 1}
            max={18}
            value={fretRange[1]}
            onChange={(e) => setRangeValue(1, Math.max(parseInt(e.target.value, 10), fretRange[0] + 1))}
            className="accent-emerald-400"
          />
        </div>
      </div>

      {/* Stacked visualizers */}
      <div className="space-y-4">
        {[0, ...Array.from({ length: additionalBoards }, (_, idx) => idx + 1)].map((index) =>
          renderFretboard(index),
        )}
      </div>

      {/* Companion piano */}
      {(instrument === 'guitar' || instrument === 'bass') && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <PianoChordDisplay chordName={activeChordName} showControls={false} showVoicings={false} />
        </div>
      )}

      {/* One-handed controls */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 flex flex-col sm:flex-row gap-3 sticky bottom-4">
        <button
          type="button"
          onClick={() => setShowAllNotes((prev) => !prev)}
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm"
        >
          {showAllNotes ? 'Root Only' : 'Show All Notes'}
        </button>
        <button
          type="button"
          onClick={() => setAdditionalBoards((prev) => (prev + 1) % 3)}
          className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-slate-900 font-semibold text-sm"
        >
          {additionalBoards === 0 ? 'Add Fretboard' : 'Cycle Fretboards'}
        </button>
      </div>
    </section>
  );
};
