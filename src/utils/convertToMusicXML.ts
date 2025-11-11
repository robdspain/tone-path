// MusicXML conversion utilities
import type { TranscriptionData, NoteEvent, ChordEvent } from '@/types/transcription';

function getNoteStep(note: string): string {
  const match = note.match(/([A-G])/);
  return match ? match[1] : 'C';
}

function getNoteAlter(note: string): number {
  return note.includes('#') ? 1 : note.includes('b') ? -1 : 0;
}

function getNoteOctave(note: string): number {
  const match = note.match(/\d/);
  return match ? parseInt(match[0]) : 4;
}

function durationToType(duration: number): string {
  // Convert duration in seconds to MusicXML note type
  // Assuming 120 BPM (0.5s per quarter note)
  const quarterNotes = duration / 0.5;
  
  if (quarterNotes >= 4) return 'whole';
  if (quarterNotes >= 2) return 'half';
  if (quarterNotes >= 1) return 'quarter';
  if (quarterNotes >= 0.5) return 'eighth';
  if (quarterNotes >= 0.25) return '16th';
  return '32nd';
}

function durationToDivisions(duration: number, divisions: number = 480): number {
  // Convert duration in seconds to MusicXML divisions
  // Assuming 120 BPM
  const quarterNotes = duration / 0.5;
  return Math.round(quarterNotes * divisions);
}

export function convertToMusicXML(data: TranscriptionData): string {
  const divisions = 480;
  const tempo = 120;
  
  const notes: Array<{
    step: string;
    alter: number;
    octave: number;
    duration: number;
    divisions: number;
    type: string;
    time: number;
    isChord?: boolean;
  }> = [];
  
  // Process all events
  for (const event of data.events) {
    if ('note' in event) {
      const noteEvent = event as NoteEvent;
      const step = getNoteStep(noteEvent.note);
      const alter = getNoteAlter(noteEvent.note);
      const octave = getNoteOctave(noteEvent.note);
      
      notes.push({
        step,
        alter,
        octave,
        duration: noteEvent.duration,
        divisions: durationToDivisions(noteEvent.duration, divisions),
        type: durationToType(noteEvent.duration),
        time: noteEvent.timestamp - (data.startTime || 0),
      });
    } else if ('chord' in event) {
      const chordEvent = event as ChordEvent;
      const chordNotes = chordEvent.notes.map((note) => ({
        step: getNoteStep(note),
        alter: getNoteAlter(note),
        octave: getNoteOctave(note),
        duration: 0.5,
        divisions: durationToDivisions(0.5, divisions),
        type: durationToType(0.5),
        time: chordEvent.timestamp - (data.startTime || 0),
        isChord: true,
      }));
      
      notes.push(...chordNotes);
    }
  }
  
  // Sort by time
  notes.sort((a, b) => a.time - b.time);
  
  // Group into measures (simplified - 4/4 time, 4 beats per measure)
  const beatsPerMeasure = 4;
  const secondsPerBeat = 60 / tempo;
  const secondsPerMeasure = beatsPerMeasure * secondsPerBeat;
  
  const measures: typeof notes[] = [];
  let currentMeasure: typeof notes = [];
  let currentMeasureTime = 0;
  
  for (const note of notes) {
    const measureIndex = Math.floor(note.time / secondsPerMeasure);
    
    if (measureIndex >= measures.length) {
      if (currentMeasure.length > 0) {
        measures.push(currentMeasure);
      }
      currentMeasure = [];
      currentMeasureTime = measureIndex * secondsPerMeasure;
    }
    
    currentMeasure.push({
      ...note,
      time: note.time - currentMeasureTime,
    });
  }
  
  if (currentMeasure.length > 0) {
    measures.push(currentMeasure);
  }
  
  // Generate MusicXML
  const measureXML = measures.map((measure, index) => {
    const noteXML = measure.map((note, noteIndex) => {
      const chordAttr = noteIndex > 0 && Math.abs(note.time - measure[noteIndex - 1].time) < 0.01 
        ? '<chord/>' 
        : '';
      
      return `
        <note>
          ${chordAttr}
          <pitch>
            <step>${note.step}</step>
            ${note.alter !== 0 ? `<alter>${note.alter}</alter>` : ''}
            <octave>${note.octave}</octave>
          </pitch>
          <duration>${note.divisions}</duration>
          <type>${note.type}</type>
        </note>`;
    }).join('');
    
    return `
    <measure number="${index + 1}">
      ${index === 0 ? `
      <attributes>
        <divisions>${divisions}</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction>
        <sound tempo="${tempo}"/>
      </direction>
      ` : ''}
      ${noteXML}
    </measure>`;
  }).join('');
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${data.instrument} Transcription</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>${data.instrument}</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    ${measureXML}
  </part>
</score-partwise>`;
  
  return xml;
}

// Export as blob for download
export function exportMusicXMLFile(data: TranscriptionData): Blob {
  const xml = convertToMusicXML(data);
  return new Blob([xml], { type: 'application/xml' });
}
