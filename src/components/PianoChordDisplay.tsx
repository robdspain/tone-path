import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Piano, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';

interface PianoChordDisplayProps {
  chordName: string;
  showControls?: boolean;
  showVoicings?: boolean;
  onTranspose?: (semitones: number) => void;
}

// Extended chord patterns including 7th chords and more
const CHORD_PATTERNS: Record<string, string[]> = {
  // Major chords
  'C': ['C4', 'E4', 'G4'],
  'D': ['D4', 'F#4', 'A4'],
  'E': ['E4', 'G#4', 'B4'],
  'F': ['F4', 'A4', 'C5'],
  'G': ['G4', 'B4', 'D5'],
  'A': ['A4', 'C#5', 'E5'],
  'B': ['B4', 'D#5', 'F#5'],
  
  // Minor chords
  'Cm': ['C4', 'D#4', 'G4'],
  'Dm': ['D4', 'F4', 'A4'],
  'Em': ['E4', 'G4', 'B4'],
  'Fm': ['F4', 'G#4', 'C5'],
  'Gm': ['G4', 'A#4', 'D5'],
  'Am': ['A4', 'C5', 'E5'],
  'Bm': ['B4', 'D5', 'F#5'],
  
  // 7th chords
  'C7': ['C4', 'E4', 'G4', 'A#4'],
  'D7': ['D4', 'F#4', 'A4', 'C5'],
  'E7': ['E4', 'G#4', 'B4', 'D5'],
  'F7': ['F4', 'A4', 'C5', 'D#5'],
  'G7': ['G4', 'B4', 'D5', 'F5'],
  'A7': ['A4', 'C#5', 'E5', 'G5'],
  'B7': ['B4', 'D#5', 'F#5', 'A5'],
  
  // Major 7th chords
  'Cmaj7': ['C4', 'E4', 'G4', 'B4'],
  'Dmaj7': ['D4', 'F#4', 'A4', 'C#5'],
  'Emaj7': ['E4', 'G#4', 'B4', 'D#5'],
  'Fmaj7': ['F4', 'A4', 'C5', 'E5'],
  'Gmaj7': ['G4', 'B4', 'D5', 'F#5'],
  'Amaj7': ['A4', 'C#5', 'E5', 'G#5'],
  'Bmaj7': ['B4', 'D#5', 'F#5', 'A#5'],
  
  // Minor 7th chords
  'Cm7': ['C4', 'D#4', 'G4', 'A#4'],
  'Dm7': ['D4', 'F4', 'A4', 'C5'],
  'Em7': ['E4', 'G4', 'B4', 'D5'],
  'Fm7': ['F4', 'G#4', 'C5', 'D#5'],
  'Gm7': ['G4', 'A#4', 'D5', 'F5'],
  'Am7': ['A4', 'C5', 'E5', 'G5'],
  'Bm7': ['B4', 'D5', 'F#5', 'A5'],
  
  // Suspended chords
  'Csus2': ['C4', 'D4', 'G4'],
  'Csus4': ['C4', 'F4', 'G4'],
  'Dsus2': ['D4', 'E4', 'A4'],
  'Dsus4': ['D4', 'G4', 'A4'],
  'Esus2': ['E4', 'F#4', 'B4'],
  'Esus4': ['E4', 'A4', 'B4'],
  'Fsus2': ['F4', 'G4', 'C5'],
  'Fsus4': ['F4', 'A#4', 'C5'],
  'Gsus2': ['G4', 'A4', 'D5'],
  'Gsus4': ['G4', 'C5', 'D5'],
  'Asus2': ['A4', 'B4', 'E5'],
  'Asus4': ['A4', 'D5', 'E5'],
  'Bsus2': ['B4', 'C#5', 'F#5'],
  'Bsus4': ['B4', 'E5', 'F#5'],
};

// Get all voicings for a chord (different octaves/inversions)
function getAllVoicings(chordName: string): string[][] {
  const baseNotes = CHORD_PATTERNS[chordName] || [];
  if (baseNotes.length === 0) return [];
  
  const voicings: string[][] = [];
  
  // Root position (original)
  voicings.push([...baseNotes]);
  
  // First inversion
  if (baseNotes.length >= 3) {
    const firstInv = [
      baseNotes[1],
      baseNotes[2],
      baseNotes[0] ? `${baseNotes[0][0]}${parseInt(baseNotes[0][1]) + 1}` : baseNotes[0],
    ];
    voicings.push(firstInv);
  }
  
  // Second inversion
  if (baseNotes.length >= 3) {
    const secondInv = [
      baseNotes[2],
      baseNotes[0] ? `${baseNotes[0][0]}${parseInt(baseNotes[0][1]) + 1}` : baseNotes[0],
      baseNotes[1] ? `${baseNotes[1][0]}${parseInt(baseNotes[1][1]) + 1}` : baseNotes[1],
    ];
    voicings.push(secondInv);
  }
  
  // Lower octave version
  const lowerOctave = baseNotes.map(note => {
    const match = note.match(/^([A-G#]+)(\d)$/);
    if (match) {
      const noteName = match[1];
      const octave = parseInt(match[2]);
      return `${noteName}${Math.max(2, octave - 1)}`;
    }
    return note;
  });
  voicings.push(lowerOctave);
  
  return voicings;
}

// Get note name without octave
function getNoteName(note: string): string {
  return note.replace(/\d/g, '');
}

// Check if a note is a black key
function isBlackKey(note: string): boolean {
  return note.includes('#') || note.includes('b');
}

export const PianoChordDisplay: React.FC<PianoChordDisplayProps> = ({
  chordName,
  showControls = true,
  showVoicings = true,
  onTranspose,
}) => {
  const [chordType, setChordType] = useState<'basic' | 'all'>('basic');
  const [voicingsEnabled, setVoicingsEnabled] = useState(true);
  const [selectedVoicing, setSelectedVoicing] = useState(0);
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  
  // Get chord notes
  const baseNotes = useMemo(() => {
    return CHORD_PATTERNS[chordName] || [];
  }, [chordName]);
  
  // Get all voicings
  const allVoicings = useMemo(() => {
    if (!voicingsEnabled) return [baseNotes];
    return getAllVoicings(chordName);
  }, [chordName, voicingsEnabled, baseNotes]);
  
  // Get current voicing
  const currentNotes = allVoicings[selectedVoicing] || baseNotes;
  
  // Transpose notes
  const transposedNotes = useMemo(() => {
    if (transposeSemitones === 0) return currentNotes;
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return currentNotes.map(note => {
      const match = note.match(/^([A-G#]+)(\d)$/);
      if (!match) return note;
      
      const noteName = match[1];
      const octave = parseInt(match[2]);
      const noteIndex = notes.indexOf(noteName);
      
      if (noteIndex === -1) return note;
      
      const newIndex = (noteIndex + transposeSemitones + 12) % 12;
      const newOctave = octave + Math.floor((noteIndex + transposeSemitones) / 12);
      const newNoteName = notes[newIndex];
      
      return `${newNoteName}${newOctave}`;
    });
  }, [currentNotes, transposeSemitones]);
  
  // Convert to MIDI numbers for Piano component
  const activeNotes = useMemo(() => {
    return transposedNotes
      .map(note => {
        try {
          return MidiNumbers.fromNote(note.toLowerCase());
        } catch {
          return null;
        }
      })
      .filter((n): n is number => n !== null);
  }, [transposedNotes]);
  
  // Get note labels for highlighted keys (without octave)
  const noteLabels = transposedNotes.map(getNoteName);
  
  // Piano range (C3 to C6)
  const firstNote = MidiNumbers.fromNote('c3');
  const lastNote = MidiNumbers.fromNote('c6');
  
  // Transpose handler
  const handleTranspose = (semitones: number) => {
    setTransposeSemitones(prev => prev + semitones);
    if (onTranspose) {
      onTranspose(semitones);
    }
  };
  
  if (baseNotes.length === 0) {
    return (
      <div className="w-full p-6 text-center text-white/60">
        <div className="text-lg font-semibold mb-2">{chordName}</div>
        <div className="text-sm">Chord pattern not available</div>
      </div>
    );
  }
  
  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6">
      {/* Navigation Controls */}
      {showControls && (
        <div className="flex items-center justify-between mb-4 gap-2 sm:gap-4">
          {/* Chords: Basic/All */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-white/70">Chords</span>
            <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setChordType('basic')}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded transition-all ${
                  chordType === 'basic'
                    ? 'bg-white text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Basic
              </button>
              <button
                onClick={() => setChordType('all')}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded transition-all ${
                  chordType === 'all'
                    ? 'bg-white text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All
              </button>
            </div>
            <button className="text-white/40 hover:text-white/60 text-xs sm:text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Voicings Toggle */}
          {showVoicings && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-white/70">Voicings</span>
              <button
                onClick={() => setVoicingsEnabled(!voicingsEnabled)}
                className={`relative inline-flex h-5 sm:h-6 w-10 sm:w-12 items-center rounded-full transition-colors ${
                  voicingsEnabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 sm:h-5 w-4 sm:w-5 transform rounded-full bg-white transition-transform ${
                    voicingsEnabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <button className="text-white/40 hover:text-white/60 text-xs sm:text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Transpose Button */}
          <button
            onClick={() => handleTranspose(1)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium rounded-lg border border-white/20 transition-all"
          >
            Transpose
          </button>
        </div>
      )}
      
      {/* Progress Bar / Slider */}
      {showVoicings && allVoicings.length > 1 && (
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={allVoicings.length - 1}
            value={selectedVoicing}
            onChange={(e) => setSelectedVoicing(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>
      )}
      
      {/* Chord Name */}
      <div className="text-center mb-4">
        <motion.div
          key={chordName}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl sm:text-4xl font-bold text-green-400"
        >
          {chordName}
        </motion.div>
        {transposeSemitones !== 0 && (
          <div className="text-xs sm:text-sm text-white/60 mt-1">
            {transposeSemitones > 0 ? '+' : ''}{transposeSemitones} semitones
          </div>
        )}
      </div>
      
      {/* Piano Keyboard */}
      <div className="w-full overflow-x-auto pb-4 mb-4">
        <div className="min-w-full flex justify-center">
          <div className="relative" style={{ width: '100%', maxWidth: '800px' }}>
            <Piano
              noteRange={{ first: firstNote, last: lastNote }}
              activeNotes={activeNotes}
              playNote={() => {}}
              stopNote={() => {}}
              width={800}
              keyWidthToHeight={0.11}
              renderNoteLabel={({ midiNumber }: { midiNumber: number }) => {
                const note = MidiNumbers.toNote(midiNumber);
                const noteName = getNoteName(note);
                const isActive = activeNotes.includes(midiNumber);
                
                if (!isActive) return null;
                
                // Find the index in noteLabels to show label below
                const noteIndex = transposedNotes.findIndex(n => getNoteName(n) === noteName);
                if (noteIndex === -1) return null;
                
                return (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6">
                    <div className="text-xs sm:text-sm font-semibold text-black bg-transparent">
                      {noteName}
                    </div>
                  </div>
                );
              }}
            />
            
          </div>
        </div>
      </div>
      
      {/* Note Labels Below Piano */}
      <div className="flex gap-2 justify-center flex-wrap mt-2">
        {noteLabels.map((note, idx) => (
          <div
            key={`${note}-${idx}`}
            className="text-xs sm:text-sm font-semibold text-black"
          >
            {note}
          </div>
        ))}
      </div>
      
      {/* Voicing Selector */}
      {showVoicings && allVoicings.length > 1 && (
        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          {allVoicings.map((voicing, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedVoicing(idx)}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-all ${
                selectedVoicing === idx
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              Voicing {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

