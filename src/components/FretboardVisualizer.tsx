// Instrument visualizer for guitar, ukulele, piano, and trumpet
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SVGuitarChord } from 'svguitar';
import { Piano, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import type { Instrument } from '@/types/transcription';
import {
  getChordFingering,
  getAllChordFingerings,
  type ChordFingering,
  type ChordInstrument,
} from '@/utils/chordFingerings';

interface FretboardVisualizerProps {
  instrument: Instrument;
  targetNotes?: string[];
  playedNotes?: string[];
  chord?: string;
  showFretNumbers?: boolean;
  variant?: 'full' | 'compact';
  detectedKey?: string | null; // Optional detected key for scale display
}

// Trumpet fingering chart component
const TrumpetFingering: React.FC<{ note: string }> = ({ note }) => {
  // Trumpet fingering map (standard Bb trumpet)
  const TRUMPET_FINGERINGS: Record<string, string> = {
    'F#3': '1-2-3',
    'G3': '1-3',
    'G#3': '2-3',
    'A3': '1-2',
    'A#3': '1',
    'B3': '2',
    'C4': '0',
    'C#4': '1-2-3',
    'D4': '1-3',
    'D#4': '2-3',
    'E4': '1-2',
    'F4': '1',
    'F#4': '2',
    'G4': '0',
    'G#4': '2-3',
    'A4': '1-2',
    'A#4': '1',
    'B4': '2',
    'C5': '0',
    'C#5': '1-2',
    'D5': '1',
    'D#5': '2',
    'E5': '1-2',
    'F5': '1',
    'F#5': '2',
    'G5': '0',
  };

  // Try exact match first, then try without accidentals
  const fingering = TRUMPET_FINGERINGS[note] || TRUMPET_FINGERINGS[note.replace(/[#b]/, '')] || '—';

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-white/10">
      <div className="text-xl font-bold text-white mb-1">{note}</div>
      <div className="flex gap-3">
        {[1, 2, 3].map((valve) => {
          const isPressed = fingering !== '—' && fingering !== '0' && fingering.includes(valve.toString());
          return (
            <div key={valve} className="flex flex-col items-center gap-1">
              <div className="text-xs text-gray-400">Valve {valve}</div>
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all ${
                  isPressed
                    ? 'bg-teal border-teal-light text-white shadow-lg'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}
              >
                {valve}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-sm text-gray-300 mt-1">
        {fingering === '0' ? 'Open' : fingering === '—' ? 'Unknown' : fingering}
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
          strokeColor: '#FFFFFF',
          strokeWidth: 2,
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
        });

        // Convert chord fingering to SVGuitar format
        if (chordFingering && chordFingering.frets) {
          const fingers: Array<[number, number | string, string?]> = [];
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
        className="w-full flex flex-col items-center gap-4 bg-gray-900 rounded-lg p-4"
      >
        {chord && (
          <div className="text-center mb-2">
            <span className="text-2xl font-semibold text-white">{chord}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {notesToShow.slice(0, 6).map((note, idx) => (
            <TrumpetFingering key={`${note}-${idx}`} note={note} />
          ))}
        </div>
        {targetNotes.length > 6 && (
          <div className="text-sm text-gray-400 mt-2">
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
    color: string, 
    isUkulele: boolean,
    currentPosition: number,
    onPositionChange: (newPosition: number) => void
  ) => {
    const strings = isUkulele ? ['G', 'C', 'E', 'A'] : ['E', 'A', 'D', 'G', 'B', 'E'];
    const fretsToShow = 5; // Show 5 frets at a time
    const maxFret = 12; // Maximum fret to navigate to
    
    const startFret = currentPosition;
    const endFret = Math.min(startFret + fretsToShow - 1, maxFret);
    
    const canGoLeft = startFret > 0;
    const canGoRight = endFret < maxFret;
    
    return (
      <div className="w-full bg-gray-800/30 rounded-lg p-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => onPositionChange(Math.max(0, startFret - 1))}
            disabled={!canGoLeft}
            className={`px-2 py-1 rounded text-white font-semibold transition-all text-sm ${
              canGoLeft
                ? 'bg-teal/80 hover:bg-teal shadow-md'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          >
            ←
          </button>
          <div className="text-xs font-semibold text-white text-center">
            {scaleName}
            <div className="text-[10px] text-gray-400 mt-0.5">
              Frets {startFret === 0 ? 'Open' : startFret} - {endFret}
            </div>
          </div>
          <button
            onClick={() => onPositionChange(Math.min(maxFret - fretsToShow + 1, startFret + 1))}
            disabled={!canGoRight}
            className={`px-2 py-1 rounded text-white font-semibold transition-all text-sm ${
              canGoRight
                ? 'bg-teal/80 hover:bg-teal shadow-md'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          >
            →
          </button>
        </div>
        
        <div className="inline-block min-w-full pt-4">
          {/* Strings */}
          {strings.map((openNote, stringIdx) => (
            <div key={stringIdx} className="flex items-center mb-1 relative">
              {/* String label */}
              <div className="w-6 sm:w-8 text-[10px] sm:text-xs font-semibold text-gray-300 text-right pr-1">
                {openNote}
              </div>
              
              {/* Frets */}
              <div className="flex-1 flex relative h-8">
                {Array.from({ length: fretsToShow }, (_, i) => {
                  const fret = startFret + i;
                  const note = getNoteAtFret(stringIdx, fret, isUkulele);
                  const isInScale = note && isNoteInScale(note, scale);
                  const isRoot = note && isRootNote(note, scale);
                  
                  return (
                    <div
                      key={fret}
                      className={`flex-1 flex items-center justify-center border-r border-gray-600 min-w-[24px] relative ${
                        fret === 0 ? 'border-l-2 border-gray-500' : ''
                      }`}
                    >
                      {/* Fret number on top of the line (only show on first string) */}
                      {stringIdx === 0 && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 font-semibold whitespace-nowrap">
                          {fret === 0 ? 'O' : fret}
                        </div>
                      )}
                      
                      {/* Note marker - show circle for all notes */}
                      {note && (
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isRoot
                              ? 'bg-red-500 ring-1 ring-white text-white shadow-md'
                              : isInScale
                              ? 'bg-green-500/60 text-white border border-green-400/50'
                              : 'bg-gray-700/30 text-gray-500 border border-gray-600'
                          }`}
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

  // Guitar/Ukulele (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-4 bg-gray-900/50 rounded-lg p-4"
    >
      {/* Scale Display */}
      {detectedKey && majorScale.length > 0 && (isGuitar || isUkulele) && (
        <div className="space-y-3">
          {/* Scale Note Badges */}
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-2">
              Key: {detectedKey} Major
            </div>
            <div className="flex gap-2 flex-wrap justify-center mb-3">
              {majorScale.map((note, idx) => (
                <div
                  key={`major-${note}-${idx}`}
                  className="px-3 py-1 bg-teal/80 text-white rounded-full text-sm font-semibold"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
          
          {/* Major Scale Fretboards - Multiple positions on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2].map((offset) => {
              const position = majorScalePosition + offset;
              if (position > 12 - 5) return null; // Don't show if beyond max fret
              
              return (
                <div key={`major-${position}`} className={offset > 0 ? 'hidden md:block' : ''}>
                  {renderScaleFretboard(
                    majorScale, 
                    offset === 0 ? `${detectedKey} Major Scale` : `Position ${position + 1}`, 
                    'bg-teal', 
                    isUkulele,
                    position,
                    setMajorScalePosition
                  )}
                </div>
              );
            })}
          </div>
          
          {relativeMinorKey && relativeMinorScale.length > 0 && (
            <>
              {/* Relative Minor Note Badges */}
              <div className="text-center mt-4">
                <div className="text-lg font-semibold text-white mb-2">
                  Relative Minor: {relativeMinorKey}
                </div>
                <div className="flex gap-2 flex-wrap justify-center mb-3">
                  {relativeMinorScale.map((note, idx) => (
                    <div
                      key={`minor-${note}-${idx}`}
                      className="px-3 py-1 bg-purple-600/80 text-white rounded-full text-sm font-semibold"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Relative Minor Scale Fretboards - Multiple positions on larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[0, 1, 2].map((offset) => {
                  const position = minorScalePosition + offset;
                  if (position > 12 - 5) return null; // Don't show if beyond max fret
                  
                  return (
                    <div key={`minor-${position}`} className={offset > 0 ? 'hidden md:block' : ''}>
                      {renderScaleFretboard(
                        relativeMinorScale, 
                        offset === 0 ? `${relativeMinorKey} Minor Scale` : `Position ${position + 1}`, 
                        'bg-purple-600', 
                        isUkulele,
                        position,
                        setMinorScalePosition
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Chord Diagram */}
      {chord && (
        <div className="w-full flex flex-col gap-3">
          {/* Fingering Selector - Show if multiple fingerings available */}
          {allChordFingerings.length > 1 && (
            <div className="flex gap-2 flex-wrap justify-center">
              {allChordFingerings.map((fingering, index) => {
                const isSelected = index === selectedFingeringIndex;
                const position = fingering.baseFret || 1;
                const positionLabel = position > 1 ? `${position}fr` : 'Open';
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedFingeringIndex(index)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-teal text-white shadow-lg ring-2 ring-teal/50'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {index === 0 ? 'Most Popular' : `Position ${index + 1}`}
                    <span className="ml-1 text-xs opacity-75">({positionLabel})</span>
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Chord Diagram Container */}
          <div className="w-full flex justify-center relative">
            <div
              ref={containerRef}
              className="chord-diagram"
              style={{
                width: '100%',
                maxWidth: '100%',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            {!chordFingering && (
              <div className="absolute inset-0 flex items-center justify-center text-white/60 text-xs p-2">
                <div className="text-center">
                  <div className="font-semibold">{chord}</div>
                  <div className="text-[10px] mt-1">No diagram</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
