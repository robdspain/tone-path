import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Instrument, NoteEvent } from '@/types/transcription';

interface TunerProps {
  currentNote: NoteEvent | null;
  instrument?: Instrument;
}

const STRING_TUNINGS: Record<string, string[]> = {
  guitar: ['E', 'A', 'D', 'G', 'B', 'E'],
  bass: ['E', 'A', 'D', 'G'],
  ukulele: ['G', 'C', 'E', 'A'],
};

function calculateCents(frequency: number, targetFrequency: number): number {
  if (!targetFrequency) return 0;
  return 1200 * Math.log2(frequency / targetFrequency);
}

function getTargetFrequency(note: string): number {
  const NOTE_FREQUENCIES: Record<string, number> = {
    C0: 16.35, C1: 32.7, C2: 65.41, C3: 130.81, C4: 261.63, C5: 523.25, C6: 1046.5, C7: 2093, C8: 4186.01,
    'C#0': 17.32, 'C#1': 34.65, 'C#2': 69.3, 'C#3': 138.59, 'C#4': 277.18, 'C#5': 554.37, 'C#6': 1108.73, 'C#7': 2217.46,
    D0: 18.35, D1: 36.71, D2: 73.42, D3: 146.83, D4: 293.66, D5: 587.33, D6: 1174.66, D7: 2349.32, D8: 4698.64,
    'D#0': 19.45, 'D#1': 38.89, 'D#2': 77.78, 'D#3': 155.56, 'D#4': 311.13, 'D#5': 622.25, 'D#6': 1244.51, 'D#7': 2489.02,
    E0: 20.6, E1: 41.2, E2: 82.41, E3: 164.81, E4: 329.63, E5: 659.25, E6: 1318.51, E7: 2637.02, E8: 5274.04,
    F0: 21.83, F1: 43.65, F2: 87.31, F3: 174.61, F4: 349.23, F5: 698.46, F6: 1396.91, F7: 2793.83, F8: 5587.65,
    'F#0': 23.12, 'F#1': 46.25, 'F#2': 92.5, 'F#3': 185, 'F#4': 369.99, 'F#5': 739.99, 'F#6': 1479.98, 'F#7': 2959.96,
    G0: 24.5, G1: 49, G2: 98, G3: 196, G4: 392, G5: 783.99, G6: 1567.98, G7: 3135.96, G8: 6271.93,
    'G#0': 25.96, 'G#1': 51.91, 'G#2': 103.83, 'G#3': 207.65, 'G#4': 415.3, 'G#5': 830.61, 'G#6': 1661.22, 'G#7': 3322.44,
    A0: 27.5, A1: 55, A2: 110, A3: 220, A4: 440, A5: 880, A6: 1760, A7: 3520, A8: 7040,
    'A#0': 29.14, 'A#1': 58.27, 'A#2': 116.54, 'A#3': 233.08, 'A#4': 466.16, 'A#5': 932.33, 'A#6': 1864.66, 'A#7': 3729.31,
    B0: 30.87, B1: 61.74, B2: 123.47, B3: 246.94, B4: 493.88, B5: 987.77, B6: 1975.53, B7: 3951.07, B8: 7902.13,
  };
  return NOTE_FREQUENCIES[note] || 0;
}

export const Tuner: React.FC<TunerProps> = ({ currentNote, instrument }) => {
  const [displayedNote, setDisplayedNote] = useState<NoteEvent | null>(currentNote);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    if (currentNote) {
      setDisplayedNote(currentNote);
    } else {
      const timer = setTimeout(() => setDisplayedNote(null), 600);
      return () => clearTimeout(timer);
    }
  }, [currentNote]);

  useEffect(() => {
    if (!currentNote) return;
    const cents = calculateCents(currentNote.frequency, getTargetFrequency(currentNote.note));
    setHistory((prev) => [...prev.slice(-29), cents]);
  }, [currentNote]);

  const noteName = displayedNote?.note ?? '--';
  const frequency = displayedNote?.frequency ?? 0;
  const targetFrequency = displayedNote ? getTargetFrequency(displayedNote.note) : 0;
  const cents = displayedNote ? calculateCents(frequency, targetFrequency) : 0;
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const pointerRotation = (clampedCents / 50) * 45;
  const isSharp = cents > 5;
  const isFlat = cents < -5;
  const isInTune = displayedNote ? !isSharp && !isFlat : false;
  const guidanceMessage = !displayedNote
    ? 'Play a note to begin tuning.'
    : isInTune
    ? 'Locked in! Hold steady.'
    : isSharp
    ? 'Too sharp • relax tension or move down a hair.'
    : 'Too flat • add tension or move up slightly.';

  const stringNotes = STRING_TUNINGS[instrument || ''] || STRING_TUNINGS.guitar;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full flex items-center justify-center py-6"
    >
      <div className="relative bg-[#070c1a]/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.55)] w-full max-w-4xl space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Pitch Center</p>
            <p className="text-2xl font-semibold text-white">Tuner</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 rounded-full border border-white/10 text-xs text-white/70">Live input</div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                displayedNote ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-white/5 text-white/50 border border-white/10'
              }`}
            >
              {displayedNote ? 'Tracking' : 'Idle'}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px),minmax(0,1fr)]">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center min-w-0">
            <div className="relative w-48 h-48 flex items-center justify-center max-w-full">
              <div className="absolute inset-0 rounded-full border-4 border-white/5" />
              <div className="absolute inset-6 rounded-full border border-white/5" />
              <div className="absolute inset-3 rounded-full border border-white/5" />
              <div className="absolute w-full h-full flex items-center justify-center">
                <div className="w-[2px] h-24 bg-gradient-to-b from-transparent via-white to-white origin-bottom rotate-0" />
              </div>
              <motion.div
                className="absolute bottom-1 left-1/2 origin-bottom w-1 h-20 rounded-full bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.6)]"
                animate={{ rotate: pointerRotation }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-between text-[10px] text-white/40 px-4">
                <span>-50¢</span>
                <span>0¢</span>
                <span>+50¢</span>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm uppercase tracking-[0.3em] text-white/40">Note</p>
              <p className="text-5xl font-bold text-white">{noteName}</p>
              <p className="text-sm text-emerald-300 mt-1">{displayedNote ? `${frequency.toFixed(2)} Hz` : '— Hz'}</p>
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-w-0">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Cents</p>
                <p className={`text-3xl font-semibold ${isInTune ? 'text-emerald-300' : 'text-white'}`}>
                  {displayedNote ? `${cents > 0 ? '+' : ''}${cents.toFixed(1)}¢` : '—'}
                </p>
                <p className="text-xs text-white/60 mt-1">{isInTune ? 'Perfect center' : isSharp ? 'Sharp' : isFlat ? 'Flat' : 'Waiting'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-w-0">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Target</p>
                <p className="text-3xl font-semibold text-white">{displayedNote ? targetFrequency.toFixed(2) : '—'} Hz</p>
                <p className="text-xs text-white/60 mt-1">Concert A = 440Hz</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 to-teal-900/20 p-4">
              <p className="text-sm text-white/70">{guidanceMessage}</p>
            </div>

            {(instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele') && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Open Strings</p>
                <div className="flex flex-col gap-2">
                  {stringNotes.map((note, idx) => {
                    const label =
                      instrument === 'ukulele'
                        ? `String ${idx + 1}`
                        : `String ${(stringNotes.length - idx).toString()}`;
                    return (
                      <div key={`${note}-${idx}`} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 text-white">
                        <span className="text-sm text-white/70">{label}</span>
                        <span className="text-lg font-semibold">{note}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-w-0 overflow-hidden">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Pitch History</p>
              <div className="flex items-end gap-1 h-16">
                {Array.from({ length: 30 }).map((_, idx) => {
                  const value = history[history.length - 30 + idx] ?? 0;
                  const magnitude = Math.min(1, Math.abs(value) / 50);
                  const height = 10 + magnitude * 46;
                  const color = Math.abs(value) < 5 ? 'bg-emerald-400/80' : value > 0 ? 'bg-rose-400/80' : 'bg-sky-400/80';
                  return <div key={idx} className={`w-1.5 rounded-full ${color}`} style={{ height }} />;
                })}
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                <span>-50¢</span>
                <span>Recent 30 samples</span>
                <span>+50¢</span>
              </div>
            </div>
          </div>
        </div>

        {!displayedNote && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-sm text-white/70">
            🎯 Waiting for audio • Click “Start Listening” or play a reference pitch.
          </div>
        )}
      </div>
    </motion.div>
  );
};
