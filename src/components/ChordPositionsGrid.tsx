import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SVGuitarChord } from 'svguitar';
import { getAllChordFingerings, type ChordFingering, type ChordInstrument } from '@/utils/chordFingerings';

interface ChordPositionsGridProps {
  chordName: string;
  instrument?: 'guitar' | 'ukulele';
  maxPositions?: number;
}

// Calculate difficulty score for a chord fingering
function calculateDifficulty(fingering: ChordFingering): number {
  let difficulty = 0;
  
  // Count fretted strings (excluding muted/open)
  const frettedCount = fingering.frets.filter(f => f > 0).length;
  difficulty += frettedCount * 2;
  
  // Barre chords are harder
  if (fingering.barres && fingering.barres.length > 0) {
    difficulty += fingering.barres.length * 5;
  }
  
  // Higher positions are harder
  if (fingering.baseFret && fingering.baseFret > 0) {
    difficulty += fingering.baseFret;
  }
  
  // Stretch (distance between highest and lowest fret)
  const frettedFrets = fingering.frets.filter(f => f > 0);
  if (frettedFrets.length > 0) {
    const minFret = Math.min(...frettedFrets);
    const maxFret = Math.max(...frettedFrets);
    const stretch = maxFret - minFret;
    if (stretch > 3) difficulty += (stretch - 3) * 2;
  }
  
  return difficulty;
}

// Get notes played for each string in a chord fingering
function getStringNotes(fingering: ChordFingering, isUkulele: boolean): string[] {
  const tuning = isUkulele ? ['G', 'C', 'E', 'A'] : ['E', 'A', 'D', 'G', 'B', 'E'];
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const baseFret = fingering.baseFret || 0;
  
  return fingering.frets.map((fret, stringIdx) => {
    if (fret === -1) return 'X'; // Muted
    if (fret === 0) return 'O'; // Open
    
    const openNote = tuning[stringIdx];
    const openIndex = notes.indexOf(openNote);
    if (openIndex === -1) return '';
    
    const actualFret = baseFret > 0 ? baseFret + fret - 1 : fret;
    const noteIndex = (openIndex + actualFret) % 12;
    return notes[noteIndex];
  });
}

// Extract unique notes from chord name
function getChordNotes(chordName: string): string[] {
  // Simple extraction - get root note and common intervals
  const rootMatch = chordName.match(/^([A-G][#b]?)/);
  if (!rootMatch) return [];
  
  const root = rootMatch[1];
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = notes.indexOf(root);
  if (rootIndex === -1) return [root];
  
  const chordNotes: string[] = [root];
  
  // Add intervals based on chord quality
  if (chordName.includes('sus2')) {
    chordNotes.push(notes[(rootIndex + 2) % 12]);
    chordNotes.push(notes[(rootIndex + 7) % 12]);
  } else if (chordName.includes('sus4')) {
    chordNotes.push(notes[(rootIndex + 5) % 12]);
    chordNotes.push(notes[(rootIndex + 7) % 12]);
  } else if (chordName.includes('m') && !chordName.includes('maj')) {
    // Minor chord
    chordNotes.push(notes[(rootIndex + 3) % 12]);
    chordNotes.push(notes[(rootIndex + 7) % 12]);
  } else {
    // Major chord
    chordNotes.push(notes[(rootIndex + 4) % 12]);
    chordNotes.push(notes[(rootIndex + 7) % 12]);
  }
  
  return [...new Set(chordNotes)]; // Remove duplicates
}

export const ChordPositionsGrid: React.FC<ChordPositionsGridProps> = ({
  chordName,
  instrument = 'guitar',
  maxPositions = 9,
}: ChordPositionsGridProps) => {
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chartRefs = useRef<(SVGuitarChord | null)[]>([]);
  const isUkulele = instrument === 'ukulele';
  const chordInstrument: ChordInstrument = isUkulele ? 'ukulele' : 'guitar';
  
  // Get all chord fingerings
  const allFingerings = getAllChordFingerings(chordName, chordInstrument);
  
  // Sort by difficulty (easiest first)
  const sortedFingerings = [...allFingerings]
    .map(f => ({ fingering: f, difficulty: calculateDifficulty(f) }))
    .sort((a, b) => a.difficulty - b.difficulty)
    .slice(0, maxPositions)
    .map(item => item.fingering);
  
  const chordNotes = getChordNotes(chordName);
  
  // Render chord diagrams
  useEffect(() => {
    sortedFingerings.forEach((fingering, index) => {
      const container = containerRefs.current[index];
      if (!container) return;
      
      // Clear previous chart
      container.innerHTML = '';
      
      const timeoutId = setTimeout(() => {
        if (!container) return;
        
        try {
          const chart = new SVGuitarChord(container);
          const baseFret = fingering.baseFret || 0;
          const position = baseFret > 0 ? baseFret : 1;
          
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
            fingerSize: 0.6,
            fretSize: 1.2,
            nutSize: 4,
            sidePadding: 8,
            titleFontSize: 0, // Hide title, we'll show it separately
            titleBottomMargin: 0,
            fretLabelFontSize: 12,
            tuningsFontSize: 0, // Hide tunings
            barreChordRadius: 0.25,
            emptyStringIndicatorSize: 0.5,
            fixedDiagramPosition: false,
          });
          
          const fingers: Array<[number, number | string, string?]> = [];
          const barres: Array<{ fromString: number; toString: number; fret: number }> = [];
          
          // Process frets
          fingering.frets.forEach((fret, stringIdx) => {
            const svgStringIdx = fingering.frets.length - stringIdx;
            
            if (fret === -1) {
              fingers.push([svgStringIdx, 'x']);
            } else if (fret > 0) {
              let displayFret: number;
              if (baseFret > 0) {
                displayFret = fret - baseFret + 1;
              } else {
                displayFret = fret;
              }
              
              if (displayFret >= 1 && displayFret <= 5) {
                fingers.push([svgStringIdx, displayFret]);
              }
            }
          });
          
          // Process barres
          if (fingering.barres && fingering.barres.length > 0) {
            fingering.barres.forEach((barre) => {
              let displayFret: number;
              if (baseFret > 0) {
                displayFret = barre.fret - baseFret + 1;
              } else {
                displayFret = barre.fret;
              }
              
              if (displayFret >= 1 && displayFret <= 5) {
                barres.push({
                  fromString: fingering.frets.length - barre.toString,
                  toString: fingering.frets.length - barre.fromString,
                  fret: displayFret,
                });
              }
            });
          }
          
          chart
            .chord({
              fingers,
              barres,
              title: '',
            })
            .draw();
          
          chartRefs.current[index] = chart;
        } catch (error) {
          console.error(`Error rendering chord diagram ${index}:`, error);
        }
      }, 50);
      
      return () => {
        clearTimeout(timeoutId);
        if (container) {
          container.innerHTML = '';
        }
      };
    });
  }, [chordName, sortedFingerings, isUkulele]);
  
  if (sortedFingerings.length === 0) {
    return (
      <div className="w-full p-6 text-center text-white/60">
        <div className="text-lg font-semibold mb-2">{chordName}</div>
        <div className="text-sm">No fingerings available</div>
      </div>
    );
  }
  
  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">
          {chordName}
        </h2>
        <p className="text-sm sm:text-base text-white/80 text-center mb-3">
          Positions ranked from <span className="text-yellow-400 font-semibold">easiest</span> to{' '}
          <span className="text-yellow-400 font-semibold">most difficult</span>
        </p>
        
        {/* Chord notes buttons */}
        {chordNotes.length > 0 && (
          <div className="flex gap-2 justify-center flex-wrap mb-4">
            {chordNotes.map((note, idx) => (
              <div
                key={`${note}-${idx}`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-lg"
              >
                {note}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Chord positions grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {sortedFingerings.map((fingering, index) => {
          const stringNotes = getStringNotes(fingering, isUkulele);
          const difficulty = calculateDifficulty(fingering);
          const position = fingering.baseFret || 1;
          const positionLabel = position > 1 ? `${position}fr` : 'Open';
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 rounded-xl p-2 sm:p-3 border border-white/10"
            >
              {/* Position number and difficulty */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-white/60 font-medium">
                  #{index + 1}
                </span>
                <span className="text-xs text-white/40">{positionLabel}</span>
              </div>
              
              {/* Chord diagram */}
              <div
                ref={(el: HTMLDivElement | null) => {
                  containerRefs.current[index] = el;
                }}
                className="chord-diagram mb-2"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
              
              {/* String notes */}
              <div className="text-[10px] sm:text-xs text-white/70 text-center font-mono space-y-0.5">
                {stringNotes.map((note, noteIdx) => (
                  <div key={noteIdx} className={note === 'X' ? 'text-red-400' : note === 'O' ? 'text-green-400' : ''}>
                    {note}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

