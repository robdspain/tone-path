import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChordPositionsGrid } from './ChordPositionsGrid';
import {
  GUITAR_CHORD_FINGERINGS,
  UKULELE_CHORD_FINGERINGS,
  type ChordFingering,
  type ChordInstrument,
} from '@/utils/chordFingerings';

interface ChordDictionaryProps {
  instrument?: ChordInstrument;
  initialChord?: string;
  maxPositions?: number;
}

const POPULAR_CHORDS = ['C', 'G', 'Am', 'F', 'Dm', 'Em', 'E', 'A', 'D', 'Bm', 'F#m', 'Esus2', 'Gsus4'];

const inputStyles =
  'w-full rounded-2xl bg-slate-900/60 border border-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent';

function getChordLabel(fingering?: ChordFingering): string {
  if (!fingering) return 'Shape';

  const hasOpen = fingering.frets.some((fret) => fret === 0);
  const hasMuted = fingering.frets.some((fret) => fret === -1);
  const hasBarre = Boolean(fingering.barres && fingering.barres.length > 0);

  if (hasBarre) return 'Barre';
  if (hasOpen && hasMuted) return 'Open';
  if (hasOpen) return 'Campfire';
  return 'Shape';
}

export const ChordDictionary: React.FC<ChordDictionaryProps> = ({
  instrument = 'guitar',
  initialChord,
  maxPositions = 6,
}) => {
  const chordDatabase = instrument === 'ukulele' ? UKULELE_CHORD_FINGERINGS : GUITAR_CHORD_FINGERINGS;
  const chordNames = useMemo(() => {
    const baseList = Object.keys(chordDatabase);
    const prioritized = POPULAR_CHORDS.filter((name) => baseList.includes(name));
    const remaining = baseList
      .filter((name) => !prioritized.includes(name))
      .sort((a, b) => a.localeCompare(b));
    return [...prioritized, ...remaining];
  }, [chordDatabase]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChord, setSelectedChord] = useState<string>(() => {
    if (initialChord && chordNames.includes(initialChord)) return initialChord;
    return chordNames[0] || '';
  });
  const [hasUserOverride, setHasUserOverride] = useState(false);

  const filteredChords = useMemo(() => {
    if (!searchTerm.trim()) return chordNames;
    const query = searchTerm.trim().toLowerCase();
    return chordNames.filter((name) => name.toLowerCase().includes(query));
  }, [searchTerm, chordNames]);

  const selectedExists = chordNames.includes(selectedChord);
  const activeChord = selectedExists ? selectedChord : filteredChords[0];

  useEffect(() => {
    if (!initialChord || hasUserOverride) return;
    if (!chordNames.includes(initialChord)) return;
    setSelectedChord(initialChord);
  }, [initialChord, chordNames, hasUserOverride]);

  const handleChordSelect = (name: string) => {
    setHasUserOverride(true);
    setSelectedChord(name);
  };

  const handleSearchChange = (value: string) => {
    setHasUserOverride(true);
    setSearchTerm(value);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6 lg:p-8 shadow-2xl shadow-slate-900/50">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-1/3 space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Dictionary</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">Guitar Chords</h3>
            <p className="text-white/70 text-sm sm:text-base">
              Search any chord and view positions ranked from easiest to most difficult.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search chords (e.g., Esus2)"
                className={inputStyles}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" aria-hidden="true">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m0-6.65a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
                </svg>
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                {filteredChords.length} results
              </span>
              {instrument === 'ukulele' && (
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">Ukulele</span>
              )}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 max-h-[360px] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredChords.map((name) => {
                const tag = getChordLabel(chordDatabase[name]?.[0]);
                const isSelected = name === activeChord;
                return (
                  <motion.button
                    key={name}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleChordSelect(name)}
                    className={`rounded-2xl border px-3 py-2 text-left transition-all ${
                      isSelected
                        ? 'bg-white text-slate-900 border-white shadow-lg shadow-emerald-300/30'
                        : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="text-lg font-semibold">{name}</div>
                    <div className={`text-xs font-medium ${isSelected ? 'text-slate-600' : 'text-white/60'}`}>
                      {tag}
                    </div>
                  </motion.button>
                );
              })}
              {filteredChords.length === 0 && (
                <div className="col-span-full text-center text-sm text-white/60 py-6">
                  No matches. Try a simpler spelling.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:flex-1">
          <AnimatePresence mode="wait">
            {activeChord ? (
              <motion.div
                key={activeChord}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <ChordPositionsGrid chordName={activeChord} instrument={instrument} maxPositions={maxPositions} />
              </motion.div>
            ) : (
              <motion.div
                className="w-full h-full flex items-center justify-center text-white/60 text-sm bg-slate-900/40 rounded-2xl border border-white/5 min-h-[320px]"
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
              >
                Select a chord to preview its voicings.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
