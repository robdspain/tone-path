import React, { useEffect, useRef } from 'react';
import { Vex } from 'vexflow';
import type { NoteEvent } from '@/types/transcription';

interface TrumpetNoteDisplayProps {
  notes: NoteEvent[];
  currentTime: number;
  isPlaying?: boolean;
}

// Trumpet fingerings mapping: note -> [valve1, valve2, valve3] where true = pressed
const TRUMPET_FINGERINGS: Record<string, [boolean, boolean, boolean]> = {
  // Lower octave (below staff)
  'F#3': [false, true, false],   // 2
  'G3': [true, true, false],      // 1-2
  'G#3': [true, false, true],     // 1-3
  'A3': [true, false, false],     // 1
  'A#3': [false, true, false],    // 2
  'B3': [false, false, false],    // Open
  'C4': [true, true, false],      // 1-2
  'C#4': [true, false, false],    // 1
  
  // Middle octave (on staff)
  'D4': [false, true, false],      // 2
  'D#4': [true, true, true],      // 1-2-3
  'E4': [false, false, false],    // Open
  'F4': [true, false, false],     // 1
  'F#4': [false, true, false],    // 2
  'G4': [true, true, false],      // 1-2
  'G#4': [true, false, true],     // 1-3
  'A4': [true, false, false],     // 1
  'A#4': [false, true, false],    // 2
  'B4': [false, false, false],    // Open
  'C5': [true, true, false],      // 1-2
  'C#5': [true, false, false],    // 1
  
  // Higher octave (above staff)
  'D5': [false, true, false],     // 2
  'D#5': [true, true, true],      // 1-2-3
  'E5': [false, false, false],    // Open
  'F5': [true, false, false],     // 1
  'F#5': [false, true, false],    // 2
  'G5': [false, false, false],    // Open
  'G#5': [true, false, true],     // 1-3
  'A5': [true, false, false],     // 1
  'A#5': [false, true, false],    // 2
  'B5': [false, false, false],    // Open
  'C6': [true, true, false],      // 1-2
  'C#6': [true, false, false],    // 1
  'D6': [false, true, false],     // 2
  'D#6': [true, true, true],      // 1-2-3
  'E6': [false, false, false],    // Open
  'F6': [true, false, false],     // 1
  'F#6': [false, true, false],    // 2
};

// Map note names to VexFlow note positions
function getNotePosition(note: string): { line: number; accidental?: string } {
  const noteName = note.replace(/\d/g, '');
  const octave = parseInt(note.match(/\d+/)?.[0] || '4');
  
  // Base positions for octave 4 (middle C = C4)
  const positions: Record<string, number> = {
    'C': 0,   // Middle C (below staff, ledger line)
    'C#': 0,
    'D': 1,   // D on first space
    'D#': 1,
    'E': 2,   // E on first line
    'F': 3,   // F on first space
    'F#': 3,
    'G': 4,   // G on second line
    'G#': 4,
    'A': 5,   // A on second space
    'A#': 5,
    'B': 6,   // B on third line
  };
  
  const basePosition = positions[noteName] ?? 0;
  const octaveOffset = (octave - 4) * 7; // Each octave = 7 positions
  const line = basePosition + octaveOffset;
  
  return {
    line,
    accidental: noteName.includes('#') ? '#' : undefined,
  };
}

export const TrumpetNoteDisplay: React.FC<TrumpetNoteDisplayProps> = ({
  notes,
  currentTime,
  isPlaying = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const contextRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize VexFlow renderer
    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Vex.Flow;
    
    if (!rendererRef.current) {
      rendererRef.current = new Renderer(containerRef.current, Renderer.Backends.SVG);
      rendererRef.current.resize(800, 300);
      contextRef.current = rendererRef.current.getContext();
    }

    const context = contextRef.current;
    context.clear();

    // Get notes to display (current and upcoming)
    const visibleNotes = notes
      .filter(note => {
        const noteStart = note.timestamp;
        return Math.abs(noteStart - currentTime) < 3; // Show notes within 3 seconds
      })
      .slice(0, 12) // Show up to 12 notes
      .sort((a, b) => a.timestamp - b.timestamp);

    if (visibleNotes.length === 0) {
      // Show empty staff
      const stave = new Stave(10, 50, 780);
      stave.addClef('treble');
      stave.setContext(context).draw();
      return;
    }

    // Create a single staff for now
    const stave = new Stave(10, 50, 780);
    stave.addClef('treble');
    stave.setContext(context).draw();

    // Create VexFlow notes
    const staveNotes = visibleNotes.map(note => {
      const noteName = note.note.replace(/\d/g, '');
      const octave = parseInt(note.note.match(/\d+/)?.[0] || '4');
      
      // Convert note to VexFlow format (e.g., "C/4" for C4)
      const vexKey = `${noteName.replace('#', 's')}/${octave}`;
      
      const staveNote = new StaveNote({
        keys: [vexKey],
        duration: 'w', // Whole note
        clef: 'treble',
      });

      if (noteName.includes('#')) {
        staveNote.addModifier(new Accidental('#'));
      }

      return { staveNote, note };
    });

    if (staveNotes.length > 0) {
      const voice = new Voice({ num_beats: staveNotes.length, beat_value: 1 });
      voice.addTickables(staveNotes.map(sn => sn.staveNote));
      new Formatter().joinVoices([voice]).format([voice], 750);
      voice.draw(context, stave);

      // Draw valve indicators below each note
      staveNotes.forEach(({ staveNote, note }) => {
        const fingering = TRUMPET_FINGERINGS[note.note];
        if (fingering) {
          const noteX = staveNote.getAbsoluteX();
          const noteY = 130; // Below the staff

          // Draw valve circles
          [0, 1, 2].forEach((valveIndex) => {
            const valveX = noteX + (valveIndex - 1) * 20;
            const valveY = noteY;
            const isPressed = fingering[valveIndex];

            // Draw circle
            context.beginPath();
            context.arc(valveX, valveY, 8, 0, Math.PI * 2);
            context.fillStyle = isPressed ? '#ef4444' : '#e5e7eb'; // Red if pressed, grey if not
            context.fill();
            context.strokeStyle = '#6b7280';
            context.lineWidth = 1;
            context.stroke();

            // Draw valve number
            context.fillStyle = isPressed ? '#ffffff' : '#6b7280';
            context.font = '10px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText((valveIndex + 1).toString(), valveX, valveY);
          });
        }
      });
    }
  }, [notes, currentTime, isPlaying]);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
      <div ref={containerRef} className="w-full" />
    </div>
  );
};

