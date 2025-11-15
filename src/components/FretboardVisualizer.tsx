// Instrument visualizer for guitar, ukulele, piano, and trumpet
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SVGuitarChord } from 'svguitar';
import { Piano, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import type { Instrument } from '@/types/transcription';
import { getTrumpetFingeringLabel, getTrumpetValveStates } from '@/utils/trumpetFingerings';
import {
  getChordFingering,
  getAllChordFingerings,
  type ChordFingering,
  type ChordInstrument,
} from '@/utils/chordFingerings';
import { ChordPositionsGrid } from './ChordPositionsGrid';
import { PianoChordDisplay } from './PianoChordDisplay';

interface FretboardVisualizerProps {
  instrument: Instrument;
  targetNotes?: string[];
  playedNotes?: string[];
  chord?: string;
  showFretNumbers?: boolean;
  variant?: 'full' | 'compact' | 'grid' | 'mobile'; // 'grid' shows all positions in a grid, 'mobile' shows mobile-style piano
  detectedKey?: string | null; // Optional detected key for scale display
}

// Trumpet fingering chart component
const TrumpetFingering: React.FC<{ note: string }> = ({ note }) => {
  const fingeringLabel = getTrumpetFingeringLabel(note);
  const valveStates = getTrumpetValveStates(note);

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-slate-800/50 rounded-xl border-2 border-white/20">
      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">{note}</div>
      <div className="flex gap-4">
        {[1, 2, 3].map((valve) => {
          const isPressed = valveStates ? valveStates[valve - 1] : false;
          return (
            <div key={valve} className="flex flex-col items-center gap-2">
              <div className="text-sm sm:text-base text-gray-300 font-medium">Valve {valve}</div>
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 flex items-center justify-center font-bold text-xl sm:text-2xl transition-all ${
                  isPressed
                    ? 'bg-teal border-teal-light text-white shadow-lg shadow-teal/50'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}
              >
                {valve}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-base sm:text-lg text-white font-semibold mt-2">
        {fingeringLabel ?? 'Unknown'}
      </div>
    </div>
  );
};

export const FretboardVisualizer: React.FC<FretboardVisualizerProps> = ({
  instrument,
  targetNotes = [],
  playedNotes = [],
  chord,
  showFretNumbers = true,
  variant = 'full',
  detectedKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<SVGuitarChord | null>(null);
  const [selectedFingeringIndex, setSelectedFingeringIndex] = useState(0);
  const [majorScalePosition, setMajorScalePosition] = useState(0); // Starting fret for major scale
  const [minorScalePosition, setMinorScalePosition] = useState(0); // Starting fret for minor scale
  const [viewMode, setViewMode] = useState<'scales' | 'chords' | 'piano'>(chord ? 'chords' : 'scales');
  const [scaleFlavor, setScaleFlavor] = useState<'major' | 'minor'>('major');

  const isGuitar = instrument === 'guitar' || instrument === 'bass';
  const isUkulele = instrument === 'ukulele';
  const isPiano = instrument === 'piano';
  const isTrumpet = instrument === 'trumpet';
  const chordInstrument: ChordInstrument = isUkulele ? 'ukulele' : 'guitar';

  // Get all chord fingerings from database (for guitar/ukulele)
  let allChordFingerings: ChordFingering[] = [];
  if (chord && (isGuitar || isUkulele)) {
    allChordFingerings = getAllChordFingerings(chord, chordInstrument);
    // Limit to top 4 fingerings
    allChordFingerings = allChordFingerings.slice(0, 4);
    
    if (allChordFingerings.length === 0) {
      console.log(`No fingering found for chord: "${chord}"`);
    }
  }

  // Reset selected index when chord changes
  useEffect(() => {
    setSelectedFingeringIndex(0);
  }, [chord]);

  // Get the currently selected fingering
  const chordFingering = allChordFingerings.length > 0 
    ? allChordFingerings[selectedFingeringIndex] || allChordFingerings[0]
    : null;

  // For piano, convert note names to MIDI numbers
  const notesToMidiNumbers = (notes: string[]): number[] => {
    return notes
      .map((note) => {
        try {
          // Handle different note formats: "C4", "C#4", "Cb4", etc.
          const normalizedNote = note.trim();
          // Convert note like "C4" to MIDI number
          // react-piano expects lowercase note names
          const lowerNote = normalizedNote.toLowerCase();
          return MidiNumbers.fromNote(lowerNote);
        } catch (e) {
          console.warn(`Could not convert note ${note} to MIDI number:`, e);
          return null;
        }
      })
      .filter((n): n is number => n !== null);
  };

  // Guitar/Ukulele chord diagram
  useEffect(() => {
    if (!containerRef.current || (!isGuitar && !isUkulele)) return;
    if (!chord) return; // Don't render if no chord provided

    // Clear previous chart
    containerRef.current.innerHTML = '';

    // Small delay to ensure container is ready
    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;

      try {
        // Initialize SVGuitar
        const chart = new SVGuitarChord(containerRef.current);

        // Ensure position is at least 1
        const baseFret = chordFingering?.baseFret || 0;
        const position = baseFret > 0 ? baseFret : 1;

        // Configure chart
        chart.configure({
          strings: isUkulele ? 4 : 6,
          frets: 4,
          position: position,
          tuning: isUkulele ? ['G', 'C', 'E', 'A'] : ['E', 'A', 'D', 'G', 'B', 'E'],
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#FFFFFF',
          backgroundColor: 'transparent',
          fingerColor: '#FFFFFF',
          fingerSize: 0.7,
          fretSize: 1.5,
          nutSize: 6,
          sidePadding: 10,
          titleFontSize: 24, // Reduced for smaller cards
          titleBottomMargin: 10, // Reduced for smaller cards
          fretLabelFontSize: 16, // Reduced for smaller cards
          tuningsFontSize: 14, // Reduced for smaller cards
          barreChordRadius: 0.3,
          emptyStringIndicatorSize: 0.6,
          fixedDiagramPosition: false,
        } as any);

        // Convert chord fingering to SVGuitar format
        if (chordFingering && chordFingering.frets) {
          const fingers: Array<[number, number | 'x']> = [];
          const barres: Array<{ fromString: number; toString: number; fret: number }> = [];

          // Process frets
          chordFingering.frets.forEach((fret, stringIdx) => {
            const svgStringIdx = chordFingering.frets.length - stringIdx;

            if (fret === -1) {
              // Muted string
              fingers.push([svgStringIdx, 'x']);
            } else if (fret === 0) {
              // Open string - SVGuitar handles this automatically
              // Explicitly mark as open by not adding to fingers array
              // SVGuitar will show open strings automatically
            } else if (fret > 0) {
              // Calculate display fret relative to position
              let displayFret: number;
              if (baseFret > 0) {
                // If baseFret is set, fret is absolute, so calculate relative to position
                displayFret = fret - baseFret + 1;
              } else {
                // If no baseFret, fret is already relative (1-based)
                displayFret = fret;
              }
              
              // Ensure displayFret is at least 1 (SVGuitar requirement)
              if (displayFret >= 1 && displayFret <= 5) {
                fingers.push([svgStringIdx, displayFret]);
              }
            }
          });

          // Process barres
          if (chordFingering.barres && chordFingering.barres.length > 0) {
            chordFingering.barres.forEach((barre) => {
              let displayFret: number;
              if (baseFret > 0) {
                displayFret = barre.fret - baseFret + 1;
              } else {
                displayFret = barre.fret;
              }
              
              // Ensure displayFret is at least 1
              if (displayFret >= 1 && displayFret <= 5) {
                barres.push({
                  fromString: chordFingering.frets.length - barre.toString,
                  toString: chordFingering.frets.length - barre.fromString,
                  fret: displayFret,
                });
              }
            });
          }

          // Always draw if we have a chord fingering (even if all strings are open)
          chart
            .chord({
              fingers,
              barres,
              title: chord || '',
            })
            .draw();
          
          console.log(`✅ Rendered chord diagram for "${chord}":`, {
            fingers,
            barres,
            position,
            hasFingering: !!chordFingering,
          });
        } else if (chord) {
          // No fingering found, but show chord name
          console.warn(`⚠️ No fingering found for chord: "${chord}"`);
          chart
            .chord({
              fingers: [],
              barres: [],
              title: chord,
            })
            .draw();
        }

        chartRef.current = chart;
      } catch (error) {
        console.error('❌ Error rendering chord diagram:', error, {
          chord,
          chordFingering,
          instrument,
        });
        // Show fallback text if rendering fails
        if (containerRef.current && chord) {
          containerRef.current.innerHTML = `
            <div style="text-align: center; padding: 20px; color: white;">
              <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${chord}</div>
              <div style="font-size: 12px; color: #999;">Diagram unavailable</div>
            </div>
          `;
        }
      }
    }, 50); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timeoutId);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [chord, chordFingering, isUkulele, isGuitar, selectedFingeringIndex]);

  // Render based on instrument type
  if (isPiano) {
    // Use mobile-style piano display if variant is 'mobile'
    if (variant === 'mobile' && chord) {
      return <PianoChordDisplay chordName={chord} showControls={true} showVoicings={true} />;
    }
    
    const firstNote = MidiNumbers.fromNote(variant === 'compact' ? 'c4' : 'c3');
    const lastNote = MidiNumbers.fromNote(variant === 'compact' ? 'c5' : 'c6');
    const activeNotes = notesToMidiNumbers(targetNotes.length > 0 ? targetNotes : (chord ? getChordNotes(chord) : []));
    const pianoWidth = variant === 'compact' ? 260 : 800;
    const pianoWrapperClass = variant === 'compact' ? 'min-w-[220px]' : 'min-w-[600px]';
    const pianoPadding = variant === 'compact' ? 'p-3' : 'p-4';

    // Helper to get chord notes if chord name provided
    function getChordNotes(chordName: string): string[] {
      const CHORD_PATTERNS: Record<string, string[]> = {
        'C': ['C4', 'E4', 'G4'],
        'D': ['D4', 'F#4', 'A4'],
        'E': ['E4', 'G#4', 'B4'],
        'F': ['F4', 'A4', 'C5'],
        'G': ['G4', 'B4', 'D5'],
        'A': ['A4', 'C#5', 'E5'],
        'B': ['B4', 'D#5', 'F#5'],
        'Cm': ['C4', 'D#4', 'G4'],
        'Dm': ['D4', 'F4', 'A4'],
        'Em': ['E4', 'G4', 'B4'],
        'Fm': ['F4', 'G#4', 'C5'],
        'Gm': ['G4', 'A#4', 'D5'],
        'Am': ['A4', 'C5', 'E5'],
        'Bm': ['B4', 'D5', 'F#5'],
      };
      return CHORD_PATTERNS[chordName] || [];
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full flex flex-col items-center gap-4 bg-gray-900 rounded-lg ${pianoPadding}`}
      >
        {chord && (
          <div className="text-center mb-2">
            <span className="text-2xl font-semibold text-white">{chord}</span>
          </div>
        )}
        <div className="w-full overflow-x-auto pb-4">
          <div className={pianoWrapperClass}>
            <Piano
              noteRange={{ first: firstNote, last: lastNote }}
              activeNotes={activeNotes}
              playNote={() => {}}
              stopNote={() => {}}
              width={pianoWidth}
            />
          </div>
        </div>
        {targetNotes.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-center">
            {targetNotes.map((note, idx) => (
              <div
                key={`${note}-${idx}`}
                className="px-3 py-1 bg-teal text-white rounded-full text-sm font-semibold"
              >
                {note}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  if (isTrumpet) {
    // For trumpet, show fingering for all target notes or first note
    const notesToShow = targetNotes.length > 0 ? targetNotes : (chord ? ['C4'] : ['C4']);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center gap-6 bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl p-5 sm:p-8"
      >
        {chord && (
          <div className="text-center mb-4">
            <span className="text-3xl sm:text-4xl font-bold text-white">{chord}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full">
          {notesToShow.slice(0, 6).map((note, idx) => (
            <TrumpetFingering key={`${note}-${idx}`} note={note} />
          ))}
        </div>
        {targetNotes.length > 6 && (
          <div className="text-base text-white/70 mt-3 font-medium">
            Showing first 6 of {targetNotes.length} notes
          </div>
        )}
      </motion.div>
    );
  }

  // Scale calculation functions
  const getMajorScale = (root: string): string[] => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const intervals = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals (W-W-H-W-W-W-H)
    const rootIndex = notes.indexOf(root);
    if (rootIndex === -1) return [];
    
    return intervals.map(interval => notes[(rootIndex + interval) % 12]);
  };

  const getRelativeMinor = (majorKey: string): string => {
    const majorToMinor: Record<string, string> = {
      'C': 'Am', 'C#': 'A#m', 'D': 'Bm', 'D#': 'Cm',
      'E': 'C#m', 'F': 'Dm', 'F#': 'D#m', 'G': 'Em',
      'G#': 'Fm', 'A': 'F#m', 'A#': 'Gm', 'B': 'G#m',
    };
    return majorToMinor[majorKey] || 'Am';
  };

  const getMinorScale = (root: string): string[] => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const intervals = [0, 2, 3, 5, 7, 8, 10]; // Natural minor scale intervals (W-H-W-W-H-W-W)
    const rootIndex = notes.indexOf(root.replace('m', ''));
    if (rootIndex === -1) return [];
    
    return intervals.map(interval => notes[(rootIndex + interval) % 12]);
  };

  // Get scales if key is detected
  const majorScale = detectedKey ? getMajorScale(detectedKey) : [];
  const relativeMinorKey = detectedKey ? getRelativeMinor(detectedKey) : null;
  const relativeMinorScale = relativeMinorKey ? getMinorScale(relativeMinorKey) : [];

  const chordRoot = useMemo(() => {
    if (!chord) return null;
    const match = chord.match(/^[A-G](#|b)?/);
    return match ? match[0].replace('♭', 'b') : null;
  }, [chord]);

  const fallbackMajorKey = detectedKey || chordRoot || 'C';
  const fallbackMajorScale = majorScale.length > 0 ? majorScale : getMajorScale(fallbackMajorKey);
  const derivedMinorKey = relativeMinorKey || getRelativeMinor(fallbackMajorKey);
  const fallbackMinorScale =
    relativeMinorScale.length > 0 ? relativeMinorScale : getMinorScale(derivedMinorKey);

  const activeScaleNotes = scaleFlavor === 'major' ? fallbackMajorScale : fallbackMinorScale;
  const activeScaleLabel =
    scaleFlavor === 'major'
      ? `${fallbackMajorKey} Major`
      : `${derivedMinorKey.replace('m', '')} Minor`;
  const scaleHighlightColor = scaleFlavor === 'major' ? '#7dd3fc' : '#c084fc';
  const scaleDegrees = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const scalePosition = scaleFlavor === 'major' ? majorScalePosition : minorScalePosition;
  const setScalePosition = scaleFlavor === 'major' ? setMajorScalePosition : setMinorScalePosition;
  const canShowScale = (isGuitar || isUkulele) && activeScaleNotes.length > 0;
  const canShowChord = Boolean(chord && (isGuitar || isUkulele));
  const canShowPianoOverlay = Boolean(chord);
  const availableTabs = useMemo(
    () =>
      [
        { id: 'scales' as const, label: 'Scales', enabled: canShowScale },
        { id: 'chords' as const, label: 'Chords', enabled: canShowChord },
        { id: 'piano' as const, label: 'Piano', enabled: canShowPianoOverlay },
      ] as const,
    [canShowScale, canShowChord, canShowPianoOverlay],
  );

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.id === viewMode && tab.enabled)) {
      const fallbackTab = availableTabs.find((tab) => tab.enabled);
      if (fallbackTab) {
        setViewMode(fallbackTab.id);
      }
    }
  }, [availableTabs, viewMode]);

  // Function to get note at a specific fret and string
  const getNoteAtFret = (stringIndex: number, fret: number, isUkulele: boolean): string => {
    const tuning = isUkulele ? ['G', 'C', 'E', 'A'] : ['E', 'A', 'D', 'G', 'B', 'E'];
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const openNote = tuning[stringIndex];
    const openIndex = notes.indexOf(openNote);
    if (openIndex === -1) return '';
    const noteIndex = (openIndex + fret) % 12;
    return notes[noteIndex];
  };

  // Function to check if a note is in a scale
  const isNoteInScale = (note: string, scale: string[]): boolean => {
    // Remove octave numbers and compare note names
    const noteName = note.replace(/\d/g, '');
    return scale.includes(noteName);
  };

  // Function to check if a note is the root of the scale
  const isRootNote = (note: string, scale: string[]): boolean => {
    const noteName = note.replace(/\d/g, '');
    return scale.length > 0 && scale[0] === noteName;
  };

  // Render scale fretboard diagram with position navigation
  const renderScaleFretboard = (
    scale: string[],
    scaleName: string,
    colorHex: string,
    isUkulele: boolean,
    currentPosition: number,
    onPositionChange: (newPosition: number) => void,
  ) => {
    const strings = isUkulele ? ['G', 'C', 'E', 'A'] : ['E', 'A', 'D', 'G', 'B', 'E'];
    const fretsToShow = 5;
    const maxFret = 12;
    const startFret = currentPosition;
    const endFret = Math.min(startFret + fretsToShow - 1, maxFret);
    const canGoLeft = startFret > 0;
    const canGoRight = endFret < maxFret;

    const buttonClasses =
      'px-3 py-1.5 text-xs font-semibold rounded-full border border-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed';

    return (
      <div className="w-full rounded-2xl bg-[#030a19] border border-white/5 p-4 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">{scaleName}</p>
            <p className="text-xs text-white/50 mt-1">
              Frets {startFret === 0 ? 'Open' : startFret} – {endFret}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPositionChange(Math.max(0, startFret - 1))}
              disabled={!canGoLeft}
              className={`${buttonClasses} bg-white/5 hover:bg-white/10 text-white`}
            >
              Prev
            </button>
            <button
              onClick={() => onPositionChange(Math.min(maxFret - fretsToShow + 1, startFret + 1))}
              disabled={!canGoRight}
              className={`${buttonClasses} bg-white/5 hover:bg-white/10 text-white`}
            >
              Next
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {strings.map((openNote, stringIdx) => (
            <div key={openNote + stringIdx} className="flex items-center gap-3">
              <span className="w-6 text-xs font-semibold text-white/60 text-right">{openNote}</span>
              <div
                className="flex-1 grid gap-2 relative"
                style={{ gridTemplateColumns: `repeat(${fretsToShow}, minmax(34px, 1fr))` }}
              >
                {Array.from({ length: fretsToShow }, (_, i) => {
                  const fret = startFret + i;
                  const note = getNoteAtFret(stringIdx, fret, isUkulele);
                  const isInScale = note && isNoteInScale(note, scale);
                  const isRoot = note && isRootNote(note, scale);

                  return (
                    <div
                      key={`${stringIdx}-${fret}`}
                      className="relative h-12 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center"
                    >
                      <div className="absolute inset-y-0 left-0 w-px bg-white/10" />
                      {stringIdx === 0 && (
                        <span className="absolute -top-4 text-[10px] font-semibold text-white/60">
                          {fret === 0 ? 'O' : fret}
                        </span>
                      )}
                      {note && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tracking-wide"
                          style={{
                            backgroundColor: isInScale ? colorHex : 'rgba(255,255,255,0.04)',
                            color: isRoot ? '#0a0912' : isInScale ? '#05080f' : 'rgba(255,255,255,0.35)',
                            boxShadow: isInScale
                              ? `0 8px 18px ${colorHex}40`
                              : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                            border: isRoot ? '2px solid rgba(255,255,255,0.9)' : 'none',
                          }}
                        >
                          {note.replace('#', '♯')}
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

  const renderChordPanel = () => {
    if (!chord) return null;

    if (variant === 'grid' && (isGuitar || isUkulele)) {
      return (
        <div className="rounded-2xl bg-[#040b1a] border border-white/5 p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <ChordPositionsGrid
            chordName={chord}
            instrument={isUkulele ? 'ukulele' : 'guitar'}
            maxPositions={6}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-[#13233f] via-[#0a1425] to-[#05080f] border border-white/5 p-5 sm:p-6 shadow-[0_35px_80px_rgba(0,0,0,0.55)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.6em] text-white/60">Chord</p>
              <p className="text-4xl font-bold text-white mt-1">{chord}</p>
              <p className="text-sm text-white/50 mt-1">
                {isUkulele ? 'Standard ukulele tuning' : 'Standard guitar tuning'}
              </p>
            </div>
            {targetNotes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {targetNotes.slice(0, 5).map((note, idx) => (
                  <span
                    key={`${note}-chip-${idx}`}
                    className="px-3 py-1 rounded-full bg-white/10 text-sm font-semibold text-white/80"
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}
          </div>

          {allChordFingerings.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {allChordFingerings.map((fingering, index) => {
                const isSelected = index === selectedFingeringIndex;
                const position = fingering.baseFret || 1;
                const positionLabel = position > 1 ? `${position}fr` : 'Open';

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedFingeringIndex(index)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-[0_15px_35px_rgba(255,255,255,0.35)]'
                        : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                    }`}
                  >
                    {index === 0 ? 'Primary shape' : `Shape ${index + 1}`}
                    <span className="ml-2 text-xs text-white/50">{positionLabel}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#050b17] border border-white/5 p-4 sm:p-6 relative flex items-center justify-center shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
          <div
            ref={containerRef}
            className="chord-diagram w-full"
            style={{ minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
          {!chordFingering && (
            <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm p-4 text-center">
              Diagram unavailable for {chord}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#040b1a] border border-white/5 p-4 sm:p-5">
          <ChordPositionsGrid
            chordName={chord}
            instrument={isUkulele ? 'ukulele' : 'guitar'}
            maxPositions={4}
          />
        </div>
      </div>
    );
  };

  // Guitar/Ukulele (default)
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="rounded-[32px] bg-[#030714] border border-white/10 p-5 sm:p-8 shadow-[0_45px_120px_rgba(0,0,0,0.6)] flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.65em] text-white/60">Explorer</p>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-1">
              {chord || detectedKey || 'Tone Path'}
            </p>
            <p className="text-sm text-white/50 mt-1">
              Modern chord & scale visualizer inspired by fretastic.com
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
            {availableTabs
              .filter((tab) => tab.enabled)
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                    viewMode === tab.id ? 'bg-white text-black shadow-lg' : 'text-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>
        </div>

        {viewMode === 'scales' && canShowScale && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-white/60">Active scale</p>
                <p className="text-2xl sm:text-3xl font-semibold text-white mt-1">{activeScaleLabel}</p>
              </div>
              <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                {(['major', 'minor'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setScaleFlavor(mode)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                      scaleFlavor === mode ? 'bg-white text-black shadow' : 'text-white/60'
                    }`}
                  >
                    {mode === 'major' ? 'Major' : 'Minor'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {activeScaleNotes.map((note, idx) => (
                <div
                  key={`${note}-${idx}`}
                  className="flex flex-col items-center justify-center min-w-[72px] rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white"
                >
                  <span className="text-[10px] uppercase tracking-[0.35em] text-white/50">
                    {scaleDegrees[idx]}
                  </span>
                  <span className="text-2xl font-semibold mt-1">{note}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {renderScaleFretboard(
                activeScaleNotes,
                activeScaleLabel,
                scaleHighlightColor,
                isUkulele,
                scalePosition,
                setScalePosition,
              )}
              <div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  value={scalePosition}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    const clamped = Math.max(0, Math.min(8, value));
                    setScalePosition(clamped);
                  }}
                  className="w-full h-1.5 rounded-full bg-white/10 accent-white"
                />
                <div className="flex justify-between text-[11px] text-white/60 mt-1">
                  <span>Open</span>
                  <span>12th fret</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'chords' && canShowChord && renderChordPanel()}

        {viewMode === 'piano' && canShowPianoOverlay && chord && (
          <div className="rounded-3xl bg-[#061022] border border-white/10 p-4 sm:p-6">
            <PianoChordDisplay chordName={chord} showControls showVoicings />
          </div>
        )}

        {!canShowScale && viewMode === 'scales' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center text-white/60">
            Provide a chord or detected key to unlock the scale view.
          </div>
        )}

        {!canShowChord && viewMode === 'chords' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center text-white/60">
            Select or detect a chord to explore fretboard shapes.
          </div>
        )}

        {viewMode === 'piano' && !chord && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center text-white/60">
            Add a chord to preview the piano voicings.
          </div>
        )}
      </div>
    </motion.div>
  );
};
