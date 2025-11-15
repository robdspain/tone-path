import React, { useEffect, useRef } from 'react';
import { Vex } from 'vexflow';
import type { NoteEvent } from '@/types/transcription';
import { getTrumpetValveStates } from '@/utils/trumpetFingerings';

interface TrumpetNoteDisplayProps {
  notes: NoteEvent[];
  currentTime: number;
  isPlaying?: boolean;
}

// Default scale (C through G) so we can render a helpful reference even without playback data
const DEFAULT_TRUMPET_SEQUENCE: NoteEvent[] = ['C4', 'D4', 'E4', 'F4', 'G4'].map((note, index) => ({
  note,
  timestamp: index,
  duration: 1.2,
  frequency: 0,
  velocity: 0.8,
  confidence: 1,
}));

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
      rendererRef.current.resize(900, 350);
      contextRef.current = rendererRef.current.getContext();
    }

    const context = contextRef.current;
    context.clear();

    // Get notes to display (current and upcoming)
    let visibleNotes = notes
      .filter(note => {
        const noteStart = note.timestamp;
        return Math.abs(noteStart - currentTime) < 3; // Show notes within 3 seconds
      })
      .slice(0, 12) // Show up to 12 notes
      .sort((a, b) => a.timestamp - b.timestamp);

    if (visibleNotes.length === 0 && notes.length === 0) {
      visibleNotes = DEFAULT_TRUMPET_SEQUENCE;
    }

    if (visibleNotes.length === 0) {
      // Show empty staff
      const stave = new Stave(10, 60, 880);
      stave.addClef('treble');
      stave.setContext(context).draw();
      return;
    }

    // Create a single staff for now
    const stave = new Stave(10, 60, 880);
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
        const fingering = getTrumpetValveStates(note.note);
        const noteX = staveNote.getAbsoluteX();

        // Draw note label above the staff (e.g., C, D, E)
        context.fillStyle = '#0f172a';
        context.font = '600 26px "Libre Baskerville", serif';
        context.textAlign = 'center';
        context.textBaseline = 'alphabetic';
        context.fillText(note.note.replace(/\d/g, ''), noteX, 38);

        if (fingering) {
          const valveBaseY = 210; // Position for valve row
          const diamondSize = 14;

          [0, 1, 2].forEach((valveIndex) => {
            const valveX = noteX + (valveIndex - 1) * 32;
            const isPressed = fingering[valveIndex];

            // Diamond (rotated square) to match reference style
            context.beginPath();
            context.moveTo(valveX, valveBaseY - diamondSize);
            context.lineTo(valveX + diamondSize, valveBaseY);
            context.lineTo(valveX, valveBaseY + diamondSize);
            context.lineTo(valveX - diamondSize, valveBaseY);
            context.closePath();
            context.fillStyle = isPressed ? '#111827' : '#ffffff';
            context.strokeStyle = '#111827';
            context.lineWidth = 2;
            context.fill();
            context.stroke();

            // Valve numbers underneath
            context.fillStyle = '#111827';
            context.font = '600 14px "Inter", sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'top';
            context.fillText((valveIndex + 1).toString(), valveX, valveBaseY + diamondSize + 8);
          });
        }
      });
    }
  }, [notes, currentTime, isPlaying]);

  return (
    <div className="w-full bg-white text-slate-900 rounded-2xl p-5 sm:p-8 shadow-2xl border border-slate-200 overflow-x-auto">
      <div ref={containerRef} className="w-full" />
    </div>
  );
};
