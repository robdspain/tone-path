// MIDI conversion using midi-writer-js
import MidiWriter from 'midi-writer-js';
import type { TranscriptionData, NoteEvent } from '@/types/transcription';

// Convert note name to MIDI note number
function noteToMIDINumber(note: string): number {
  const noteMap: Record<string, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
  };
  
  const match = note.match(/([A-G]#?)(\d)/);
  if (!match) return 60; // Default to C4
  
  const [, noteName, octave] = match;
  const noteNumber = noteMap[noteName] || 0;
  const octaveNum = parseInt(octave);
  
  return 12 + (octaveNum * 12) + noteNumber;
}

// Convert MIDI number to note name for midi-writer-js
function midiNumberToNote(midiNumber: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const note = notes[midiNumber % 12];
  return `${note}${octave}`;
}

export function convertToMIDI(data: TranscriptionData, tempo: number = 120): ArrayBuffer {
  const track = new MidiWriter.Track();
  
  // Group events by timestamp and process in order
  const sortedEvents = [...data.events].sort((a, b) => a.timestamp - b.timestamp);
  
  let lastTimestamp = data.startTime || 0;
  
  for (const event of sortedEvents) {
    if ('note' in event) {
      const noteEvent = event as NoteEvent;
      const startTime = noteEvent.timestamp;
      const waitTime = startTime - lastTimestamp;
      const duration = noteEvent.duration;
      
      const midiNote = noteToMIDINumber(noteEvent.note);
      const noteName = midiNumberToNote(midiNote);
      const velocity = Math.round(noteEvent.velocity * 127);
      
      // Convert duration to ticks (simplified - using quarter notes as base)
      const quarterNotes = (duration * tempo) / 60;
      let durationStr: string = '4'; // Default to quarter note
      
      if (quarterNotes >= 4) durationStr = '1';
      else if (quarterNotes >= 2) durationStr = '2';
      else if (quarterNotes >= 1) durationStr = '4';
      else if (quarterNotes >= 0.5) durationStr = '8';
      else if (quarterNotes >= 0.25) durationStr = '16';
      else durationStr = '32';
      
      // Add wait time if needed
      if (waitTime > 0.1) {
        const waitQuarterNotes = (waitTime * tempo) / 60;
        let waitStr: string = '4';
        if (waitQuarterNotes >= 4) waitStr = '1';
        else if (waitQuarterNotes >= 2) waitStr = '2';
        else if (waitQuarterNotes >= 1) waitStr = '4';
        else if (waitQuarterNotes >= 0.5) waitStr = '8';
        else if (waitQuarterNotes >= 0.25) waitStr = '16';
        else waitStr = '32';
        
        track.addEvent(new MidiWriter.NoteEvent({
          pitch: ['C4'],
          duration: waitStr as any,
          velocity: 0,
          wait: waitStr as any,
        }));
      }
      
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: [noteName] as any,
        duration: durationStr as any,
        velocity: velocity,
      }));
      
      lastTimestamp = startTime + duration;
    } else if ('chord' in event) {
      // Handle chord events - add all notes simultaneously
      const chordNotes = event.notes.map(noteToMIDINumber).map(midiNumberToNote);
      const startTime = event.timestamp;
      const waitTime = startTime - lastTimestamp;
      const duration = 0.5; // Default chord duration
      
      const quarterNotes = (duration * tempo) / 60;
      let durationStr: string = '4';
      if (quarterNotes >= 4) durationStr = '1';
      else if (quarterNotes >= 2) durationStr = '2';
      else if (quarterNotes >= 1) durationStr = '4';
      else if (quarterNotes >= 0.5) durationStr = '8';
      else if (quarterNotes >= 0.25) durationStr = '16';
      else durationStr = '32';
      
      // Add wait time if needed
      if (waitTime > 0.1) {
        const waitQuarterNotes = (waitTime * tempo) / 60;
        let waitStr: string = '4';
        if (waitQuarterNotes >= 4) waitStr = '1';
        else if (waitQuarterNotes >= 2) waitStr = '2';
        else if (waitQuarterNotes >= 1) waitStr = '4';
        else if (waitQuarterNotes >= 0.5) waitStr = '8';
        else if (waitQuarterNotes >= 0.25) waitStr = '16';
        else waitStr = '32';
        
        track.addEvent(new MidiWriter.NoteEvent({
          pitch: ['C4'],
          duration: waitStr as any,
          velocity: 0,
          wait: waitStr as any,
        }));
      }
      
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: chordNotes as any,
        duration: durationStr as any,
        velocity: 100,
      }));
      
      lastTimestamp = startTime + duration;
    }
  }
  
  // Generate MIDI file
  const writer = new MidiWriter.Writer([track]);
  const midiArrayBuffer = writer.buildFile();
  
  // Convert to ArrayBuffer
  if (midiArrayBuffer instanceof ArrayBuffer) {
    return midiArrayBuffer;
  }
  // If it's a Uint8Array or similar, convert to ArrayBuffer
  const buffer = new ArrayBuffer(midiArrayBuffer.byteLength);
  const view = new Uint8Array(buffer);
  view.set(new Uint8Array(midiArrayBuffer));
  return buffer;
}

// Export as blob for download
export function exportMIDIFile(data: TranscriptionData, tempo: number = 120): Blob {
  const midiData = convertToMIDI(data, tempo);
  return new Blob([midiData], { type: 'audio/midi' });
}
