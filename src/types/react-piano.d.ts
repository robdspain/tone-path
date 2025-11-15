declare module 'react-piano' {
  import * as React from 'react';

  export interface NoteRange {
    first: number;
    last: number;
  }

  export interface PianoProps {
    noteRange: NoteRange;
    activeNotes?: number[];
    playNote: (midiNumber: number) => void;
    stopNote: (midiNumber: number) => void;
    width?: number;
    keyWidthToHeight?: number;
    renderNoteLabel?: (props: { midiNumber: number }) => React.ReactNode | null;
    className?: string;
  }

  export class Piano extends React.Component<PianoProps> {}

  export class MidiNumbers {
    static fromNote(note: string): number;
    static getAttributes(midiNumber: number): {
      note: string;
      pitchName: string;
      octave: number;
      midiNumber: number;
      isAccidental: boolean;
    };
  }
}
