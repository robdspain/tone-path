import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { PianoRoll } from '@/components/PianoRoll';
import { ChordProgressionGrid } from '@/components/ChordProgressionGrid';
import { Tuner } from '@/components/Tuner';
import { SimpleTuner } from '@/components/SimpleTuner';
import { Metronome } from '@/components/Metronome';
import { TraditionalMetronome } from '@/components/TraditionalMetronome';
import { LiveNoteDisplay } from '@/components/LiveNoteDisplay';
import { SongNoteDisplay } from '@/components/SongNoteDisplay';
import { saveSong, type SavedSong } from '@/utils/songStorage';
import type { PracticeTarget } from '@/types/learning';
import { exportMIDIFile } from '@/utils/convertToMIDI';
import { exportMusicXMLFile } from '@/utils/convertToMusicXML';
import { analyzeAudioBufferForChords } from '@/utils/audioAnalysis';
import { detectBPM } from '@/utils/bpmDetection';
import type { Instrument, AudioSettings, PlaybackState, NoteEvent, ChordEvent, TranscriptionData, TranscriptionEvent } from '@/types/transcription';
import type { TranscriptionPreset } from '@/types/presets';
import { PracticeShell } from '@/components/layout/PracticeShell';
import type { ChordFrame } from '@/types/chords';
import { SmartJam } from '@/components/SmartJam';
import { YouTubeImport } from '@/components/YouTubeImport';
import { FileUpload } from '@/components/FileUpload';
import { SoundCloudImport } from '@/components/SoundCloudImport';
import { ChordStreamDisplay } from '@/components/ChordStreamDisplay';
import { LoopController } from '@/components/LoopController';
import { JamAIControls } from '@/components/JamAIControls';
import { FretboardVisualizer } from '@/components/FretboardVisualizer';
import { FeedbackHUD } from '@/components/FeedbackHUD';
import { ProgressChart } from '@/components/ProgressChart';
import { ChordChart } from '@/components/ChordChart';
import { usePlaybackVisualizer } from '@/hooks/usePlaybackVisualizer';
import { useAudioStream } from '@/hooks/useAudioStream';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useRecorder } from '@/hooks/useRecorder';
import { useChordDetection } from '@/hooks/useChordDetection';
import { usePlayback } from '@/hooks/usePlayback';
import { useChordRecognition } from '@/hooks/useChordRecognition';
import { useLearningMode } from '@/hooks/useLearningMode';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';

export default function Home() {
  // Debug logging
  useEffect(() => {
    console.log('Home component mounted');
  }, []);

  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    sensitivity: 0.5,
    latency: 100,
    smoothing: 0.8,
  });
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    tempo: 120,
  });
  const [detectedNotes, setDetectedNotes] = useState<NoteEvent[]>([]);
  const [detectedChords, setDetectedChords] = useState<ChordEvent[]>([]);
  const [useCREPE, setUseCREPE] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedAudioBuffer, setImportedAudioBuffer] = useState<AudioBuffer | null>(null);
  const [importedAudioContext, setImportedAudioContext] = useState<AudioContext | null>(null);
  const [importedAudioSource, setImportedAudioSource] = useState<AudioNode | null>(null);
  const [importedSongMetadata, setImportedSongMetadata] = useState<{ title?: string; artist?: string } | null>(null);
  const [analyzedChords, setAnalyzedChords] = useState<ChordFrame[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const [isDetectingBPM, setIsDetectingBPM] = useState(false);
  const [isImportSectionExpanded, setIsImportSectionExpanded] = useState(true);
  const [isToolsSectionExpanded, setIsToolsSectionExpanded] = useState(false);
  const hasAnalyzedRef = useRef(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [songName, setSongName] = useState('');
  const [pendingSongData, setPendingSongData] = useState<TranscriptionData | null>(null);
  const [learningModeEnabled, setLearningModeEnabled] = useState(false);
  const [practiceTarget, setPracticeTarget] = useState<PracticeTarget | null>(null);
  const [practiceProgress, setPracticeProgress] = useState<any[]>([]);
  const [loadedSongId, setLoadedSongId] = useState<string | null>(null);
  const [canvasView, setCanvasView] = useState<'live' | 'timeline' | 'jam'>('live');

  // Expand tools section when navigating via MobileNav
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#tools') {
        setIsToolsSectionExpanded(true);
        // Small delay to ensure smooth scroll
        setTimeout(() => {
          const element = document.getElementById('tools');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load preset from URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const presetData = params.get('preset');
      if (presetData) {
        try {
          const decoded = atob(presetData);
          const preset = JSON.parse(decoded);
          if (preset.audioSettings && preset.instrument) {
            setInstrument(preset.instrument);
            setAudioSettings(preset.audioSettings);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (error) {
          console.error('Failed to load preset from URL:', error);
        }
      }
    }
  }, []);

  // Restore loaded song from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSongId = localStorage.getItem('currentLoadedSongId');
      if (savedSongId) {
        // Load the song from IndexedDB
        import('@/utils/songStorage').then(({ getSong }) => {
          getSong(savedSongId).then((song) => {
            if (song) {
              setRecordedData(song.transcriptionData);
              setInstrument(song.instrument as Instrument);
              const notes = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'note' in e) as NoteEvent[];
              const chords = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'chord' in e) as ChordEvent[];
              setDetectedNotes(notes);
              setDetectedChords(chords);
              setLoadedSongId(song.id);
            }
          }).catch((error) => {
            console.error('Failed to restore song:', error);
            localStorage.removeItem('currentLoadedSongId');
          });
        });
      }
    }
  }, []);

  // Save loaded song ID to localStorage when song is loaded
  useEffect(() => {
    if (loadedSongId && typeof window !== 'undefined') {
      localStorage.setItem('currentLoadedSongId', loadedSongId);
    } else if (!loadedSongId && typeof window !== 'undefined') {
      localStorage.removeItem('currentLoadedSongId');
    }
  }, [loadedSongId]);

  const { isListening, audioContext, analyser, startListening, stopListening, getAudioData, getFrequencyData, error } =
    useAudioStream(audioSettings);

  const { currentNote } = usePitchDetection(audioContext, analyser, audioSettings.sensitivity, useCREPE);
  const { isRecording, recordedData, startRecording, stopRecording, addEvent, clearRecording, setRecordedData } = useRecorder();
  const { currentChord, updateChord } = useChordDetection();
  const { isPlaying, currentTime, duration, play, pause, stop } = usePlayback(recordedData, playbackState.tempo);

  // Visualizer for playback audio
  const playbackVisualizer = usePlaybackVisualizer(isPlaying);

  // Handle page visibility changes and window focus/blur (when clicking off/on page)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && loadedSongId) {
        // Small delay to ensure state is stable
        setTimeout(() => {
          // Restore song when page becomes visible again
          import('@/utils/songStorage').then(({ getSong }) => {
            getSong(loadedSongId).then((song) => {
              if (song) {
                setRecordedData(song.transcriptionData);
                setInstrument(song.instrument as Instrument);
                const notes = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'note' in e) as NoteEvent[];
                const chords = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'chord' in e) as ChordEvent[];
                setDetectedNotes(notes);
                setDetectedChords(chords);
              }
            }).catch((error) => {
              console.error('Failed to restore song on visibility change:', error);
            });
          });
        }, 100);
      }
    };

    const handleWindowFocus = () => {
      // Also restore on window focus
      if (loadedSongId) {
        setTimeout(() => {
          import('@/utils/songStorage').then(({ getSong }) => {
            getSong(loadedSongId).then((song) => {
              if (song && !recordedData) {
                // Only restore if data is missing
                setRecordedData(song.transcriptionData);
                setInstrument(song.instrument as Instrument);
                const notes = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'note' in e) as NoteEvent[];
                const chords = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'chord' in e) as ChordEvent[];
                setDetectedNotes(notes);
                setDetectedChords(chords);
              }
            }).catch((error) => {
              console.error('Failed to restore song on focus:', error);
            });
          });
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadedSongId, recordedData, setRecordedData]);

  // Chord recognition for imported audio
  const { chords: importedChords } = useChordRecognition(
    importedAudioContext,
    importedAudioSource,
    { enabled: !!importedAudioSource }
  );

  // Audio playback for imported audio (with loop/tempo control)
  const importedAudioPlayback = useAudioPlayback(importedAudioBuffer);

  // Learning mode
  const { progress: learningProgress, currentMetrics, updateMetrics } = useLearningMode({
    mode: practiceTarget?.mode || 'chords',
    target: practiceTarget,
    enabled: learningModeEnabled && !!practiceTarget,
  });

  // Save learning progress when it updates
  useEffect(() => {
    if (learningProgress) {
      setPracticeProgress((prev) => [...prev, learningProgress].slice(-20)); // Keep last 20 sessions
    }
  }, [learningProgress]);

  // Update playback state
  useEffect(() => {
    setPlaybackState((prev) => ({ ...prev, isPlaying, currentTime }));
  }, [isPlaying, currentTime]);

  // Update detected notes and trigger chord detection
  useEffect(() => {
    if (currentNote) {
      setDetectedNotes((prev) => {
        const updated = [...prev, currentNote].slice(-100);
        // Update chord detection with recent notes
        updateChord(updated.slice(-10), currentNote.timestamp);
        return updated;
      });
      if (isRecording) {
        addEvent(currentNote);
      }
      
      // Update learning mode metrics if enabled
      if (learningModeEnabled && practiceTarget && updateMetrics) {
        updateMetrics([currentNote], []);
      }
    }
  }, [currentNote, isRecording, addEvent, updateChord, learningModeEnabled, practiceTarget, updateMetrics]);

  // Update detected chords
  useEffect(() => {
    if (currentChord) {
      setDetectedChords((prev) => [...prev, currentChord].slice(-50));
      if (isRecording) {
        addEvent(currentChord);
      }
    }
  }, [currentChord, isRecording, addEvent]);

  const handleStartListening = () => {
    startListening();
  };

  const handleStopListening = () => {
    stopListening();
    if (isRecording) {
      stopRecording();
    }
    stop();
  };

  const handleStartRecording = () => {
    startRecording(instrument);
  };

  const handleStopRecording = () => {
    const data = stopRecording();
    if (data && data.events.length > 0) {
      setPendingSongData(data);
      setShowSaveDialog(true);
    }
  };

  const handleSaveSong = async () => {
    if (!pendingSongData || !songName.trim()) {
      alert('Please enter a song name');
      return;
    }

    try {
      const noteCount = pendingSongData.events.filter((e) => 'note' in e).length;
      const chordCount = pendingSongData.events.filter((e) => 'chord' in e).length;
      const duration = pendingSongData.endTime 
        ? pendingSongData.endTime - pendingSongData.startTime 
        : undefined;

      const song: SavedSong = {
        id: `song-${Date.now()}`,
        name: songName.trim(),
        instrument: pendingSongData.instrument,
        transcriptionData: pendingSongData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        duration,
        noteCount,
        chordCount,
        tags: [],
      };

      await saveSong(song);
      setShowSaveDialog(false);
      setSongName('');
      setPendingSongData(null);
      alert('Song saved successfully!');
    } catch (error) {
      alert('Failed to save song');
      console.error(error);
    }
  };

  const handleLoadSong = (song: SavedSong) => {
    setRecordedData(song.transcriptionData);
    setInstrument(song.instrument as Instrument);
    const notes = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'note' in e) as NoteEvent[];
    const chords = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'chord' in e) as ChordEvent[];
    setDetectedNotes(notes);
    setDetectedChords(chords);
    setLoadedSongId(song.id); // Persist the loaded song ID
    alert(`Loaded song: ${song.name}`);
  };

  const handlePlaySong = (song: SavedSong) => {
    setRecordedData(song.transcriptionData);
    setInstrument(song.instrument as Instrument);
    const notes = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'note' in e) as NoteEvent[];
    const chords = song.transcriptionData.events.filter((e: TranscriptionEvent) => 'chord' in e) as ChordEvent[];
    setDetectedNotes(notes);
    setDetectedChords(chords);
    setLoadedSongId(song.id); // Persist the loaded song ID
    // Auto-play after a short delay
    setTimeout(() => {
      play();
    }, 100);
  };

  const handleClearLoadedSong = () => {
    setRecordedData(null);
    setDetectedNotes([]);
    setDetectedChords([]);
    setLoadedSongId(null);
    stop();
  };

  const handlePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handlePause = () => {
    pause();
  };

  const handleExportMIDI = async () => {
    if (!recordedData) {
      alert('No recording to export');
      return;
    }
    
    try {
      const blob = exportMIDIFile(recordedData, playbackState.tempo);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription_${instrument}_${Date.now()}.mid`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('MIDI export error:', error);
      alert('Failed to export MIDI file');
    }
  };

  const handleExportXML = async () => {
    if (!recordedData) {
      alert('No recording to export');
      return;
    }
    
    try {
      const blob = exportMusicXMLFile(recordedData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription_${instrument}_${Date.now()}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('MusicXML export error:', error);
      alert('Failed to export MusicXML file');
    }
  };

  const handleLoadPreset = (preset: TranscriptionPreset) => {
    setInstrument(preset.instrument);
    setAudioSettings(preset.audioSettings);
  };

  const handleYouTubeImport = async (audioBuffer: AudioBuffer, ctx: AudioContext, metadata?: { title?: string; artist?: string }) => {
    try {
      // Store the imported audio buffer for playback
      setImportedAudioBuffer(audioBuffer);
      setImportedAudioContext(ctx);
      setImportError(null);
      setAnalyzedChords([]); // Clear previous analysis
      setImportedSongMetadata(metadata || null); // Store metadata
      setDetectedBPM(null); // Clear previous BPM
      setIsImportSectionExpanded(false); // Collapse import section after import
      setCanvasView('timeline'); // Switch to timeline view after import
      
      // Auto-detect BPM in the background
      setIsDetectingBPM(true);
      detectBPM(audioBuffer)
        .then((bpm) => {
          if (bpm) {
            setDetectedBPM(bpm);
          }
        })
        .catch((error) => {
          console.warn('BPM detection failed:', error);
        })
        .finally(() => {
          setIsDetectingBPM(false);
        });
      
      // Create source node for chord recognition
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const gainNode = ctx.createGain();
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      setImportedAudioSource(gainNode);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to process imported audio');
      setIsDetectingBPM(false);
    }
  };

  const handleFileImport = async (audioBuffer: AudioBuffer, ctx: AudioContext, metadata?: { title?: string; artist?: string }) => {
    // Use the same handler as YouTube import
    await handleYouTubeImport(audioBuffer, ctx, metadata);
  };

  const handleClearImportedAudio = () => {
    setImportedAudioBuffer(null);
    setImportedAudioContext(null);
    setImportedAudioSource(null);
    setImportedSongMetadata(null);
    setAnalyzedChords([]);
    setDetectedBPM(null);
    setImportError(null);
    setIsImportSectionExpanded(true); // Expand import section when cleared
    importedAudioPlayback.stop();
  };

  // Auto-analyze chords when audio is imported
  useEffect(() => {
    if (importedAudioBuffer && !hasAnalyzedRef.current && !isAnalyzing) {
      console.log('Auto-triggering chord analysis for imported audio...');
      hasAnalyzedRef.current = true;
      // Use a small delay to ensure state is ready
      const timer = setTimeout(() => {
        handleAnalyzeAudio();
      }, 100);
      return () => clearTimeout(timer);
    } else if (!importedAudioBuffer) {
      // Reset flag when audio is cleared
      hasAnalyzedRef.current = false;
    }
  }, [importedAudioBuffer]); // Only depend on importedAudioBuffer

  // Helper function to convert chord name to notes
  const getChordNotes = (chordName: string): string[] => {
    const CHORD_PATTERNS: Record<string, string[]> = {
      'C': ['C', 'E', 'G'],
      'D': ['D', 'F#', 'A'],
      'E': ['E', 'G#', 'B'],
      'F': ['F', 'A', 'C'],
      'G': ['G', 'B', 'D'],
      'A': ['A', 'C#', 'E'],
      'B': ['B', 'D#', 'F#'],
      'Cm': ['C', 'D#', 'G'],
      'Dm': ['D', 'F', 'A'],
      'Em': ['E', 'G', 'B'],
      'Fm': ['F', 'G#', 'C'],
      'Gm': ['G', 'A#', 'D'],
      'Am': ['A', 'C', 'E'],
      'Bm': ['B', 'D', 'F#'],
      'C7': ['C', 'E', 'G', 'A#'],
      'D7': ['D', 'F#', 'A', 'C'],
      'E7': ['E', 'G#', 'B', 'D'],
      'F7': ['F', 'A', 'C', 'D#'],
      'G7': ['G', 'B', 'D', 'F'],
      'A7': ['A', 'C#', 'E', 'G'],
      'B7': ['B', 'D#', 'F#', 'A'],
      'Cmaj7': ['C', 'E', 'G', 'B'],
      'Dmaj7': ['D', 'F#', 'A', 'C#'],
      'Emaj7': ['E', 'G#', 'B', 'D#'],
      'Fmaj7': ['F', 'A', 'C', 'E'],
      'Gmaj7': ['G', 'B', 'D', 'F#'],
      'Amaj7': ['A', 'C#', 'E', 'G#'],
      'Bmaj7': ['B', 'D#', 'F#', 'A#'],
      'Cm7': ['C', 'D#', 'G', 'A#'],
      'Dm7': ['D', 'F', 'A', 'C'],
      'Em7': ['E', 'G', 'B', 'D'],
      'Fm7': ['F', 'G#', 'C', 'D#'],
      'Gm7': ['G', 'A#', 'D', 'F'],
      'Am7': ['A', 'C', 'E', 'G'],
      'Bm7': ['B', 'D', 'F#', 'A'],
    };
    
    const noteNames = CHORD_PATTERNS[chordName];
    if (!noteNames) {
      // Fallback: try to extract root note
      const root = chordName.replace(/[^A-G#]/g, '');
      return root ? [`${root}4`] : ['C4'];
    }
    
    // Convert to full note names with octaves (default to octave 4)
    return noteNames.map(note => `${note}4`);
  };

  // Helper function to detect key from chord progression
  const detectKeyFromChords = (chords: ChordFrame[]): string | null => {
    if (chords.length === 0) return null;
    
    // Count root notes
    const rootCounts: Record<string, number> = {};
    chords.forEach(chord => {
      const root = chord.chord.replace(/[^A-G#]/g, '').toUpperCase();
      if (root) {
        rootCounts[root] = (rootCounts[root] || 0) + chord.confidence;
      }
    });
    
    if (Object.keys(rootCounts).length === 0) return null;
    
    // Find most common root
    const mostCommon = Object.entries(rootCounts).reduce((a, b) => 
      a[1] > b[1] ? a : b
    );
    
    return mostCommon ? mostCommon[0] : null;
  };

  // Helper function to save imported song to library
  const saveImportedSongToLibrary = async () => {
    if (!importedAudioBuffer || analyzedChords.length === 0) {
      console.warn('Cannot save: no audio buffer or chords');
      return;
    }

    try {
      // Generate song name from metadata or use default
      const songName = importedSongMetadata?.title 
        ? `${importedSongMetadata.title}${importedSongMetadata.artist ? ` - ${importedSongMetadata.artist}` : ''}`
        : `Imported Song ${new Date().toLocaleDateString()}`;

      // Convert ChordFrame[] to ChordEvent[]
      const chordEvents: ChordEvent[] = analyzedChords.map(frame => ({
        timestamp: frame.time,
        chord: frame.chord,
        notes: getChordNotes(frame.chord),
        confidence: frame.confidence,
      }));

      // Detect key
      const detectedKeyValue = detectKeyFromChords(analyzedChords);
      setDetectedKey(detectedKeyValue);

      // Create transcription data
      const transcriptionData: TranscriptionData = {
        instrument: instrument,
        events: chordEvents,
        startTime: 0,
        endTime: importedAudioBuffer.duration,
      };

      // Create saved song object
      const song: SavedSong = {
        id: `imported-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: songName,
        instrument: instrument,
        transcriptionData: transcriptionData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        duration: importedAudioBuffer.duration,
        noteCount: 0,
        chordCount: chordEvents.length,
        tags: [
          'imported',
          detectedKeyValue ? `key-${detectedKeyValue}` : undefined,
          detectedBPM ? `bpm-${detectedBPM}` : undefined,
          importedSongMetadata?.artist ? `artist-${importedSongMetadata.artist.toLowerCase().replace(/\s+/g, '-')}` : undefined,
        ].filter(Boolean) as string[],
      };

      await saveSong(song);
      console.log(`✅ Saved imported song to library: ${songName}`, song);
      
      // Show success message
      alert(`Song saved to library: ${songName}\n${chordEvents.length} chords detected${detectedKeyValue ? `\nKey: ${detectedKeyValue}` : ''}${detectedBPM ? `\nBPM: ${detectedBPM}` : ''}`);
    } catch (error) {
      console.error('Failed to save imported song:', error);
      alert('Failed to save song to library. Please try again.');
    }
  };

  const handleAnalyzeAudio = async () => {
    if (!importedAudioBuffer) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalyzedChords([]); // Clear previous results
    try {
      console.log('Starting chord analysis...');
      const chords = await analyzeAudioBufferForChords(
        importedAudioBuffer,
        1000,  // Use 1-second windows for better frequency resolution
        500,   // Use 0.5-second hop for better performance
        (progress) => {
          setAnalysisProgress(progress);
        },
        (chord) => {
          // Add chord progressively as it's found
          setAnalyzedChords(prev => {
            // Avoid duplicates by checking if chord already exists at this time
            const exists = prev.some(c => Math.abs(c.time - chord.time) < 0.1 && c.chord === chord.chord);
            if (exists) return prev;
            return [...prev, chord].sort((a, b) => a.time - b.time);
          });
        }
      );
      console.log(`Analysis complete: ${chords.length} chords found`, chords);
      // Final update with smoothed results
      setAnalyzedChords(chords);
      
      // Detect and set key
      const detectedKeyValue = detectKeyFromChords(chords);
      setDetectedKey(detectedKeyValue);
      
      setAnalysisProgress(1);
      
      if (chords.length === 0) {
        console.warn('No chords detected. This might be due to:');
        console.warn('- Audio contains mostly scales or arpeggios (filtered out)');
        console.warn('- Low confidence in chord detection');
        console.warn('- Audio quality issues');
        setImportError('No chords detected. The audio might contain scales or arpeggios rather than clear chords.');
      } else {
        // Automatically save to library after successful analysis
        await saveImportedSongToLibrary();
      }
      
      // Reset progress after a short delay
      setTimeout(() => {
        setAnalysisProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Failed to analyze audio:', error);
      setImportError('Failed to analyze audio. Please try again.');
      setAnalysisProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChordClick = (time: number) => {
    // Seek to the clicked chord time in the imported audio playback
    if (importedAudioBuffer) {
      importedAudioPlayback.seek(time);
    }
  };

  const recordedNoteEvents = recordedData
    ? (recordedData.events.filter((e): e is NoteEvent => 'note' in e) as NoteEvent[])
    : [];
  const recordedChordEvents = recordedData
    ? (recordedData.events.filter((e): e is ChordEvent => 'chord' in e) as ChordEvent[])
    : [];
  
  // Convert analyzed chords (ChordFrame[]) to ChordEvent[] for display
  const analyzedChordEvents: ChordEvent[] = analyzedChords.map(frame => {
    try {
      return {
        timestamp: frame.time,
        chord: frame.chord,
        notes: getChordNotes(frame.chord),
        confidence: frame.confidence,
      };
    } catch (error) {
      console.error('Error converting chord frame:', frame, error);
      return {
        timestamp: frame.time,
        chord: frame.chord,
        notes: [],
        confidence: frame.confidence,
      };
    }
  }).filter(event => event.chord && event.chord.length > 0);
  
  // Priority: analyzed chords > recorded chords > detected chords
  const displayChordEvents = analyzedChordEvents.length > 0 
    ? analyzedChordEvents 
    : recordedChordEvents.length > 0 
    ? recordedChordEvents 
    : detectedChords;
  
  console.log('Chord analysis state:', {
    analyzedChordsCount: analyzedChords.length,
    analyzedChordEventsCount: analyzedChordEvents.length,
    displayChordEventsCount: displayChordEvents.length,
    analyzedChords: analyzedChords.slice(0, 5),
    analyzedChordEvents: analyzedChordEvents.slice(0, 5),
    displayChordEvents: displayChordEvents.slice(0, 5),
  });
  
  const latestDetectedChord = detectedChords.length ? detectedChords[detectedChords.length - 1] : null;
  const latestRecordedChord = recordedChordEvents.length ? recordedChordEvents[recordedChordEvents.length - 1] : null;
  const latestAnalyzedChord = analyzedChordEvents.length ? analyzedChordEvents[analyzedChordEvents.length - 1] : null;
  const latestChord = latestAnalyzedChord || latestRecordedChord || latestDetectedChord;
  const recentNoteNames = detectedNotes.slice(-16).map((note) => note.note);
  const sessionNoteCount = recordedNoteEvents.length || detectedNotes.length;
  const sessionChordCount = displayChordEvents.length;

  // Trumpet fingerings for note display
  const TRUMPET_FINGERINGS: Record<string, string> = {
    'C4': 'Open',
    'C#4': '2',
    'D4': '1',
    'D#4': '1-2',
    'E4': '2-3',
    'F4': '1',
    'F#4': '2',
    'G4': 'Open',
    'G#4': '2-3',
    'A4': '1-2',
    'A#4': '2',
    'B4': '1',
    'C5': 'Open',
    'C#5': '2',
    'D5': '1',
    'D#5': '1-2',
    'E5': '2-3',
    'F5': '1',
    'F#5': '2',
    'G5': 'Open',
  };

  const instrumentOptions: Instrument[] = ['trumpet', 'guitar', 'bass', 'ukulele', 'piano'];

  const statusIndicators = [
    { label: 'Listening', active: isListening },
    { label: 'Recording', active: isRecording },
    { label: 'Playback', active: playbackState.isPlaying },
    { label: 'Import', active: !!importedAudioBuffer },
    { label: 'Learning', active: learningModeEnabled },
  ];

  const viewTabs: Array<{ id: typeof canvasView; label: string; description: string }> = [
    { id: 'timeline', label: 'Timeline', description: 'Recorded/imported material' },
    { id: 'live', label: 'Live View', description: 'Microphone + instant feedback' },
    { id: 'jam', label: 'Jam', description: 'AI accompaniment + loops' },
  ];

  const renderCanvasView = () => {
    if (canvasView === 'timeline') {
      return (
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-white/60">Session Timeline</p>
                <p className="text-xl font-semibold text-white">Song Note Display</p>
              </div>
              <span className="text-sm text-white/60">
                {recordedNoteEvents.length > 0 ? `${recordedNoteEvents.length} notes` : 'No notes yet'}
              </span>
            </div>
            {recordedData ? (
              <SongNoteDisplay
                songData={recordedData}
                currentTime={playbackState.currentTime}
                isPlaying={isPlaying}
                instrument={instrument}
              />
            ) : (
              <p className="text-sm text-white/60">
                Record a take or load a song from the library to populate the timeline.
              </p>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {instrument === 'piano' && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-semibold text-white">Piano Roll</p>
                  <span className="text-sm text-white/60">
                    {(instrument === 'piano' || recordedNoteEvents.length > 0) ? 'Detailed view' : 'Switch to piano to enable'}
                  </span>
                </div>
                {(instrument === 'piano' || recordedNoteEvents.length > 0) ? (
                  <PianoRoll
                    notes={recordedNoteEvents.length > 0 ? recordedNoteEvents : detectedNotes}
                    currentTime={playbackState.currentTime}
                  />
                ) : (
                  <p className="text-sm text-white/60">
                    The piano roll activates automatically when you record or import piano data.
                  </p>
                )}
              </div>
            )}

            {(instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele') && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-semibold text-white">Chord Chart</p>
                  <span className="text-sm text-white/60">
                    {displayChordEvents.length > 0 
                      ? (analyzedChordEvents.length > 0 ? 'Analyzed' : recordedChordEvents.length > 0 ? 'Loaded song' : 'Live analysis')
                      : 'No chords detected'}
                  </span>
                </div>
                {displayChordEvents.length > 0 ? (
                  <ChordChart
                    chords={displayChordEvents}
                    currentTime={analyzedChordEvents.length > 0 ? importedAudioPlayback.currentTime : playbackState.currentTime}
                  />
                ) : (
                  <p className="text-sm text-white/60">
                    Start playing chords, load a session, or analyze imported audio to see harmonic analysis.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Chord Progression Grid */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-lg font-semibold text-white">Chord Progression</p>
              <span className="text-sm text-white/60">
                {displayChordEvents.length > 0 
                  ? `Follow along with the song (${displayChordEvents.length} chords)`
                  : analyzedChords.length > 0
                  ? `Analysis complete but no displayable chords (${analyzedChords.length} analyzed)`
                  : 'No chords detected'}
              </span>
            </div>
            {displayChordEvents.length > 0 ? (
              <ChordProgressionGrid
                chords={displayChordEvents}
                currentTime={analyzedChordEvents.length > 0 ? importedAudioPlayback.currentTime : playbackState.currentTime}
                bpm={detectedBPM || undefined}
                beatsPerMeasure={4}
                beatsPerCell={1}
                rows={4}
              />
            ) : analyzedChords.length > 0 ? (
              <div className="w-full bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-400 text-center mb-2">
                  Analysis found {analyzedChords.length} chord frames, but they couldn't be converted for display.
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Check console for details. Sample chords: {analyzedChords.slice(0, 3).map(c => c.chord).join(', ')}
                </p>
              </div>
            ) : (
              <div className="w-full bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-400 text-center">
                  Click "Analyze Chords" after importing a song to see the progression grid.
                </p>
              </div>
            )}
          </div>

        </div>
      );
    }

    if (canvasView === 'jam') {
      return (
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
            <SmartJam
              detectedChords={detectedChords.length ? detectedChords : recordedChordEvents}
              detectedNotes={detectedNotes.length ? detectedNotes : recordedNoteEvents}
              tempo={playbackState.tempo}
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
            <div className="mb-3">
              <p className="text-lg font-semibold text-white">Jam Companion Controls</p>
              <p className="text-sm text-white/60">Shape the AI band and backing textures.</p>
            </div>
            <JamAIControls detectedChords={detectedChords} detectedNotes={detectedNotes} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-lg font-semibold text-white">Imported Audio Looping</p>
                <p className="text-sm text-white/60">
                  Stretch, loop, and scrub through imported references.
                </p>
              </div>
              {importedAudioBuffer && (
                <span className="text-sm text-white/60">
                  {(importedAudioPlayback.duration || 0).toFixed(1)}s
                </span>
              )}
            </div>
            {importedAudioBuffer ? (
              <>
                <LoopController
                  loopStart={importedAudioPlayback.loopStart}
                  loopEnd={importedAudioPlayback.loopEnd}
                  isLooping={importedAudioPlayback.isLooping}
                  duration={importedAudioPlayback.duration}
                  tempo={importedAudioPlayback.tempo}
                  audioBuffer={importedAudioBuffer}
                  currentTime={importedAudioPlayback.currentTime}
                  detectedBPM={detectedBPM}
                  onLoopStartChange={importedAudioPlayback.setLoopStart}
                  onLoopEndChange={importedAudioPlayback.setLoopEnd}
                  onToggleLoop={importedAudioPlayback.toggleLoop}
                  onTempoChange={importedAudioPlayback.setTempo}
                  onSeek={importedAudioPlayback.seek}
                />
                <div className="flex flex-wrap gap-3 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      importedAudioPlayback.isPlaying
                        ? importedAudioPlayback.pause()
                        : importedAudioPlayback.play()
                    }
                    className="px-5 py-2 rounded-2xl bg-emerald-500/90 text-white font-semibold shadow-lg"
                  >
                    {importedAudioPlayback.isPlaying ? '⏸ Pause' : '▶ Play'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => importedAudioPlayback.stop()}
                    className="px-5 py-2 rounded-2xl border border-white/20 text-white/80"
                  >
                    ⏹ Stop
                  </motion.button>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/60">
                Import audio from the utility rail to unlock looping controls.
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/60">Live Capture</p>
              <p className="text-xl font-semibold text-white">Audio Visualizer</p>
            </div>
            <span className="text-xs text-emerald-300">{isListening ? 'Live' : isPlaying ? 'Playback' : 'Idle'}</span>
          </div>
          <AudioVisualizer
            audioData={isPlaying ? playbackVisualizer.audioData : getAudioData()}
            frequencyData={isPlaying ? playbackVisualizer.frequencyData : getFrequencyData()}
            isActive={isListening || isPlaying}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-lg font-semibold text-white">Live Notes</p>
              <span className="text-sm text-white/60 capitalize">{instrument}</span>
            </div>
            {isListening ? (
              <LiveNoteDisplay
                currentNote={currentNote}
                recentNotes={detectedNotes.slice(-20)}
                instrument={instrument}
              />
            ) : (
              <p className="text-sm text-white/60">
                Click “Start Listening” to populate live notes in real time.
              </p>
            )}
          </div>

          {(instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele') && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-lg font-semibold text-white">Chord Tracker</p>
                <span className="text-sm text-white/60">
                  {detectedChords.length || recordedChordEvents.length ? 'Realtime' : '—'}
                </span>
              </div>
              {displayChordEvents.length || recordedChordEvents.length ? (
                <ChordChart
                  chords={displayChordEvents.length ? displayChordEvents : recordedChordEvents}
                  currentTime={analyzedChordEvents.length > 0 ? importedAudioPlayback.currentTime : playbackState.currentTime}
                />
              ) : (
                <p className="text-sm text-white/60">
                  Start playing, load a take, or analyze imported audio to see the harmonic timeline.
                </p>
              )}
            </div>
          )}
        </div>

        {(analyzedChords.length > 0 || importedChords.frames.length > 0) && (
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-lg font-semibold text-white">Imported Chord Stream</p>
                <p className="text-sm text-white/60">
                  {analyzedChords.length > 0 
                    ? `${analyzedChords.length} chords analyzed from audio` 
                    : 'Tap a chord to jump the reference audio.'}
                </p>
              </div>
              <span className="text-sm text-white/60">
                {analyzedChords.length > 0 ? analyzedChords.length : importedChords.frames.length} chords
              </span>
            </div>
            <ChordStreamDisplay
              chords={{
                source: 'file',
                frames: analyzedChords.length > 0 ? analyzedChords : importedChords.frames,
              }}
              currentTime={importedAudioPlayback.currentTime}
              onChordClick={handleChordClick}
            />
          </div>
        )}
      </div>
    );
  };

  const globalBarContent = (
    <div className="flex flex-col gap-3 w-full">
      {/* Simplified header for mobile */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-lg sm:text-xl font-semibold text-white truncate">Tone Path</p>
        </div>
        {/* Essential status indicators only */}
        <div className="flex gap-2 shrink-0">
          {statusIndicators
            .filter((s) => s.active)
            .slice(0, 2)
            .map((status) => (
              <span
                key={status.label}
                className="px-2 py-1 rounded-full text-xs font-semibold border border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
              >
                {status.label}
              </span>
            ))}
        </div>
      </div>

      {/* Instrument selector - larger touch targets for mobile */}
      <div className="flex flex-wrap items-center gap-2">
        {instrumentOptions.map((inst) => (
          <button
            key={inst}
            type="button"
            onClick={() => setInstrument(inst)}
            className={`min-h-[44px] px-4 sm:px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold capitalize border transition ${
              instrument === inst
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'border-white/20 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {inst}
          </button>
        ))}
      </div>
    </div>
  );

  // Sidebar removed - content moved to transport dock and main canvas
  const utilityRailContent = null;

  const primaryCanvasContent = (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {/* Import Section - Collapsible - Mobile-first */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsImportSectionExpanded(!isImportSectionExpanded)}
        >
          <div className="flex items-center gap-3 flex-1">
            <motion.div
              animate={{ rotate: isImportSectionExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/60 text-sm"
            >
              ▶
            </motion.div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white">📥 Import Audio</h2>
              {!isImportSectionExpanded && importedAudioBuffer && (
                <p className="text-xs sm:text-sm text-white/60 mt-1">
                  {importedSongMetadata?.title || 'Song imported'} • Click to expand
                </p>
              )}
              {isImportSectionExpanded && (
                <p className="text-xs sm:text-sm text-white/60 mt-1">Import audio from YouTube, SoundCloud, or upload a file to practice along</p>
              )}
            </div>
          </div>
          {importedAudioBuffer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearImportedAudio();
              }}
              className="px-4 py-2 rounded-full border border-red-400/40 text-red-200 text-sm hover:bg-red-500/20 transition-colors ml-2"
            >
              Clear Import
            </button>
          )}
        </div>
        
        {isImportSectionExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              {!importedAudioBuffer && (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <YouTubeImport onImport={handleYouTubeImport} onError={setImportError} />
                  </div>
                  <div className="space-y-2">
                    <SoundCloudImport onImport={handleYouTubeImport} onError={setImportError} />
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <FileUpload onImport={handleFileImport} onError={setImportError} />
                  </div>
                </div>
              )}
              
              {importError && (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100 space-y-2">
                  <p className="font-semibold">Import error</p>
                  <p>{importError}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Practice Tools Section - Collapsible */}
      <div id="tools" className="rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsToolsSectionExpanded(!isToolsSectionExpanded)}
        >
          <div className="flex items-center gap-3 flex-1">
            <motion.div
              animate={{ rotate: isToolsSectionExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/60 text-sm"
            >
              ▶
            </motion.div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white">🎵 Practice Tools</h2>
              {!isToolsSectionExpanded && (
                <p className="text-xs sm:text-sm text-white/60 mt-1">
                  Tuner and Metronome • Click to expand
                </p>
              )}
              {isToolsSectionExpanded && (
                <p className="text-xs sm:text-sm text-white/60 mt-1">Essential tools for practice sessions</p>
              )}
            </div>
          </div>
        </div>
        
        {isToolsSectionExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-6">
              {/* Simple Tuner */}
              <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tuner</h3>
                <SimpleTuner currentNote={currentNote} />
              </div>

              {/* Metronome */}
              <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Metronome</h3>
                <TraditionalMetronome 
                  initialBpm={detectedBPM || 120}
                  onBpmChange={(bpm) => {
                    // Optionally sync with playback tempo
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Visual Display of Imported Song */}
      {importedAudioBuffer && (
        <div className="rounded-3xl border border-emerald-400/40 bg-slate-900/60 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">
                {importedSongMetadata?.title ? `🎵 ${importedSongMetadata.title}` : '🎵 Imported Song'}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/70">
                {importedSongMetadata?.artist && (
                  <span className="font-semibold">{importedSongMetadata.artist}</span>
                )}
                {importedSongMetadata?.artist && ' • '}
                {isDetectingBPM && (
                  <>
                    <span className="text-yellow-400">Detecting BPM...</span> • 
                  </>
                )}
                {detectedBPM && !isDetectingBPM && (
                  <>
                    <span className="font-semibold text-gold">🎵 {detectedBPM} BPM</span> • 
                  </>
                )}
                Duration: {Math.floor(importedAudioBuffer.duration / 60)}:
                {Math.floor(importedAudioBuffer.duration % 60).toString().padStart(2, '0')} • 
                Sample Rate: {importedAudioBuffer.sampleRate}Hz • 
                Channels: {importedAudioBuffer.numberOfChannels}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 relative">
              {isAnalyzing && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 rounded-full h-2 overflow-hidden z-10">
                  <motion.div
                    className="bg-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisProgress * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}
              {isAnalyzing && (
                <span className="text-sm text-white/60 px-2 py-2 order-1 sm:order-none">
                  ⏳ Analyzing chords... {Math.round(analysisProgress * 100)}%
                </span>
              )}
              <div className="flex gap-2 order-2 sm:order-none">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    importedAudioPlayback.isPlaying
                      ? importedAudioPlayback.pause()
                      : importedAudioPlayback.play()
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm whitespace-nowrap"
                >
                  {importedAudioPlayback.isPlaying ? '⏸ Pause' : '▶ Play'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => importedAudioPlayback.stop()}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm whitespace-nowrap"
                >
                  ⏹ Stop
                </motion.button>
              </div>
            </div>
          </div>

          {/* Loop Controller with Waveform */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <LoopController
              loopStart={importedAudioPlayback.loopStart}
              loopEnd={importedAudioPlayback.loopEnd}
              isLooping={importedAudioPlayback.isLooping}
              duration={importedAudioPlayback.duration}
              tempo={importedAudioPlayback.tempo}
              audioBuffer={importedAudioBuffer}
              currentTime={importedAudioPlayback.currentTime}
              detectedBPM={detectedBPM}
              onLoopStartChange={importedAudioPlayback.setLoopStart}
              onLoopEndChange={importedAudioPlayback.setLoopEnd}
              onToggleLoop={importedAudioPlayback.toggleLoop}
              onTempoChange={importedAudioPlayback.setTempo}
              onSeek={importedAudioPlayback.seek}
            />
          </div>

          {/* Instrument-Specific Display: Chords for Guitar, Notes for Trumpet */}
          {importedAudioBuffer && (analyzedChords.length > 0 || importedChords.frames.length > 0) && (
            <div className="rounded-3xl border border-emerald-400/40 bg-slate-900/60 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
                {instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele' 
                  ? '🎸 Scales' 
                  : instrument === 'trumpet' 
                  ? '🎺 Notes' 
                  : instrument === 'piano'
                  ? '🎹 Notes'
                  : '🎵 Music Display'}
              </h3>
              
              {/* Get current chord based on playback time */}
              {(() => {
                const currentTime = importedAudioPlayback.currentTime;
                // Use analyzed chords if available, otherwise fall back to real-time detected chords
                const chordsToUse = analyzedChords.length > 0 ? analyzedChords : importedChords.frames;
                const currentChordFrame = chordsToUse.reduce((prev, curr) => {
                  if (!prev) return curr;
                  const prevDist = Math.abs(prev.time - currentTime);
                  const currDist = Math.abs(curr.time - currentTime);
                  return currDist < prevDist ? curr : prev;
                }, chordsToUse[0] || null);

                if (!currentChordFrame) return null;

                // Convert chord name to notes using CHORD_PATTERNS
                const getChordNotes = (chordName: string): string[] => {
                  const CHORD_PATTERNS: Record<string, string[]> = {
                    'C': ['C', 'E', 'G'],
                    'D': ['D', 'F#', 'A'],
                    'E': ['E', 'G#', 'B'],
                    'F': ['F', 'A', 'C'],
                    'G': ['G', 'B', 'D'],
                    'A': ['A', 'C#', 'E'],
                    'B': ['B', 'D#', 'F#'],
                    'Cm': ['C', 'D#', 'G'],
                    'Dm': ['D', 'F', 'A'],
                    'Em': ['E', 'G', 'B'],
                    'Fm': ['F', 'G#', 'C'],
                    'Gm': ['G', 'A#', 'D'],
                    'Am': ['A', 'C', 'E'],
                    'Bm': ['B', 'D', 'F#'],
                    'C7': ['C', 'E', 'G', 'A#'],
                    'D7': ['D', 'F#', 'A', 'C'],
                    'E7': ['E', 'G#', 'B', 'D'],
                    'F7': ['F', 'A', 'C', 'D#'],
                    'G7': ['G', 'B', 'D', 'F'],
                    'A7': ['A', 'C#', 'E', 'G'],
                    'B7': ['B', 'D#', 'F#', 'A'],
                    'Cmaj7': ['C', 'E', 'G', 'B'],
                    'Dmaj7': ['D', 'F#', 'A', 'C#'],
                    'Emaj7': ['E', 'G#', 'B', 'D#'],
                    'Fmaj7': ['F', 'A', 'C', 'E'],
                    'Gmaj7': ['G', 'B', 'D', 'F#'],
                    'Amaj7': ['A', 'C#', 'E', 'G#'],
                    'Bmaj7': ['B', 'D#', 'F#', 'A#'],
                    'Cm7': ['C', 'D#', 'G', 'A#'],
                    'Dm7': ['D', 'F', 'A', 'C'],
                    'Em7': ['E', 'G', 'B', 'D'],
                    'Fm7': ['F', 'G#', 'C', 'D#'],
                    'Gm7': ['G', 'A#', 'D', 'F'],
                    'Am7': ['A', 'C', 'E', 'G'],
                    'Bm7': ['B', 'D', 'F#', 'A'],
                  };
                  
                  const noteNames = CHORD_PATTERNS[chordName];
                  if (!noteNames) {
                    // Fallback: try to extract root note
                    const root = chordName.replace(/[^A-G#]/g, '');
                    return root ? [`${root}4`] : ['C4'];
                  }
                  
                  // Convert to full note names with octaves (default to octave 4)
                  return noteNames.map(note => `${note}4`);
                };

                const chordNotes = getChordNotes(currentChordFrame.chord);

                if (instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele') {
                  return (
                    <div className="space-y-4">
                      {/* Current Chord Display */}
                      <motion.div 
                        className={`flex items-center justify-between mb-4 p-3 rounded-lg ${
                          Math.abs(currentChordFrame.time - currentTime) < 0.5 
                            ? 'bg-emerald-500/20 border-2 border-emerald-400' 
                            : 'bg-transparent'
                        }`}
                        animate={Math.abs(currentChordFrame.time - currentTime) < 0.5 ? {
                          scale: [1, 1.02, 1],
                        } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div>
                          <div className="text-3xl font-bold text-gold mb-1">
                            {currentChordFrame.chord}
                          </div>
                          <div className="text-sm text-white/60">
                            {Math.abs(currentChordFrame.time - currentTime) < 0.5 ? '🎵 Playing Now' : `At ${currentChordFrame.time.toFixed(1)}s`}
                          </div>
                        </div>
                        <div className="text-xs text-white/40">
                          {(currentChordFrame.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </motion.div>

                      {/* Fretboard Visualizer */}
                      <FretboardVisualizer
                        instrument={instrument}
                        targetNotes={chordNotes}
                        chord={currentChordFrame.chord}
                        showFretNumbers={true}
                        variant="grid"
                        detectedKey={detectedKey}
                      />
                    </div>
                  );
                } else if (instrument === 'trumpet') {
                  // For trumpet, extract root note from chord and show as single note
                  const rootNote = currentChordFrame.chord.replace(/[^A-G#]/g, '') + '4';
                  const noteColors: Record<string, string> = {
                    C: 'bg-red-500',
                    'C#': 'bg-red-600',
                    D: 'bg-orange-500',
                    'D#': 'bg-orange-600',
                    E: 'bg-yellow-500',
                    F: 'bg-green-500',
                    'F#': 'bg-green-600',
                    G: 'bg-blue-500',
                    'G#': 'bg-blue-600',
                    A: 'bg-indigo-500',
                    'A#': 'bg-indigo-600',
                    B: 'bg-purple-500',
                  };
                  const noteName = rootNote.replace(/\d/g, '');
                  const color = noteColors[noteName] || 'bg-gray-500';
                  const isPlaying = Math.abs(currentChordFrame.time - currentTime) < 0.5;

                  return (
                    <div className="space-y-4">
                      {/* Current Note Display */}
                      <motion.div 
                        className={`flex items-center justify-between mb-4 p-3 rounded-lg ${
                          isPlaying
                            ? 'bg-emerald-500/20 border-2 border-emerald-400' 
                            : 'bg-transparent'
                        }`}
                        animate={isPlaying ? {
                          scale: [1, 1.02, 1],
                        } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div>
                          <div className="text-3xl font-bold text-gold mb-1">
                            {rootNote}
                          </div>
                          <div className="text-sm text-white/60">
                            {isPlaying ? '🎵 Playing Now' : `At ${currentChordFrame.time.toFixed(1)}s`}
                          </div>
                        </div>
                        <div className="text-xs text-white/40">
                          {(currentChordFrame.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </motion.div>

                      {/* Note Display with Fingering */}
                      <div className="flex justify-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ 
                            scale: isPlaying ? [1, 1.1, 1] : 1, 
                            opacity: 1 
                          }}
                          transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
                          className={`${color} rounded-lg p-6 text-center shadow-lg w-full max-w-xs ${
                            isPlaying ? 'ring-2 ring-gold ring-offset-2 ring-offset-slate-900' : ''
                          }`}
                        >
                          <div className="text-4xl font-bold text-white mb-2">
                            {rootNote}
                          </div>
                          <div className="text-lg text-white/90 font-semibold">
                            {TRUMPET_FINGERINGS[rootNote] || '—'}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  );
                } else if (instrument === 'piano') {
                  return (
                    <div className="space-y-4">
                      {/* Current Chord/Notes Display */}
                      <motion.div 
                        className={`flex items-center justify-between mb-4 p-3 rounded-lg ${
                          Math.abs(currentChordFrame.time - currentTime) < 0.5 
                            ? 'bg-emerald-500/20 border-2 border-emerald-400' 
                            : 'bg-transparent'
                        }`}
                        animate={Math.abs(currentChordFrame.time - currentTime) < 0.5 ? {
                          scale: [1, 1.02, 1],
                        } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div>
                          <div className="text-2xl font-bold text-gold mb-1">
                            {currentChordFrame.chord}
                          </div>
                          <div className="text-sm text-white/60">
                            {Math.abs(currentChordFrame.time - currentTime) < 0.5 ? '🎵 Playing Now' : `At ${currentChordFrame.time.toFixed(1)}s`}
                          </div>
                        </div>
                        <div className="text-xs text-white/40">
                          {(currentChordFrame.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </motion.div>

                      {/* Notes Display */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {chordNotes.map((note, index) => {
                          const noteColors: Record<string, string> = {
                            C: 'bg-red-500',
                            'C#': 'bg-red-600',
                            D: 'bg-orange-500',
                            'D#': 'bg-orange-600',
                            E: 'bg-yellow-500',
                            F: 'bg-green-500',
                            'F#': 'bg-green-600',
                            G: 'bg-blue-500',
                            'G#': 'bg-blue-600',
                            A: 'bg-indigo-500',
                            'A#': 'bg-indigo-600',
                            B: 'bg-purple-500',
                          };
                          const noteName = note.replace(/\d/g, '');
                          const color = noteColors[noteName] || 'bg-gray-500';
                          
                          const isPlaying = Math.abs(currentChordFrame.time - currentTime) < 0.5;
                          return (
                            <motion.div
                              key={`${note}-${index}`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ 
                                scale: isPlaying ? [1, 1.1, 1] : 1, 
                                opacity: 1 
                              }}
                              transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
                              className={`${color} rounded-lg p-4 text-center shadow-lg ${
                                isPlaying ? 'ring-2 ring-gold ring-offset-2 ring-offset-slate-900' : ''
                              }`}
                            >
                              <div className="text-2xl font-bold text-white mb-1">
                                {note}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          )}

          {/* All Analyzed Chords Grid - Show all unique chords from analysis */}
          {analyzedChords.length > 0 && (
            <div className="rounded-3xl border border-emerald-400/40 bg-slate-900/60 p-4 sm:p-6 mt-4">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
                {instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele' 
                  ? '🎸 All Chords in Song' 
                  : instrument === 'trumpet' 
                  ? '🎺 All Notes in Song' 
                  : instrument === 'piano'
                  ? '🎹 All Notes in Song'
                  : '🎵 All Chords'}
              </h3>
              
              {(() => {
                const currentTime = importedAudioPlayback.currentTime;
                
                // Get relative minor key if detected
                const getRelativeMinor = (majorKey: string): string => {
                  const majorToMinor: Record<string, string> = {
                    'C': 'Am', 'C#': 'A#m', 'D': 'Bm', 'D#': 'Cm',
                    'E': 'C#m', 'F': 'Dm', 'F#': 'D#m', 'G': 'Em',
                    'G#': 'Fm', 'A': 'F#m', 'A#': 'Gm', 'B': 'G#m',
                  };
                  return majorToMinor[majorKey] || 'Am';
                };
                
                const relativeMinorKey = detectedKey ? getRelativeMinor(detectedKey) : null;
                
                // Get unique chords (by chord name, keep first occurrence)
                const uniqueChordsMap = new Map<string, ChordFrame>();
                analyzedChords.forEach(chord => {
                  // Skip relative minor chords
                  if (relativeMinorKey && chord.chord === relativeMinorKey) {
                    return;
                  }
                  if (!uniqueChordsMap.has(chord.chord)) {
                    uniqueChordsMap.set(chord.chord, chord);
                  }
                });
                // Sort by first occurrence time
                const uniqueChords = Array.from(uniqueChordsMap.values())
                  .sort((a, b) => a.time - b.time);

                // Convert chord name to notes using CHORD_PATTERNS
                const getChordNotes = (chordName: string): string[] => {
                  const CHORD_PATTERNS: Record<string, string[]> = {
                    'C': ['C', 'E', 'G'],
                    'D': ['D', 'F#', 'A'],
                    'E': ['E', 'G#', 'B'],
                    'F': ['F', 'A', 'C'],
                    'G': ['G', 'B', 'D'],
                    'A': ['A', 'C#', 'E'],
                    'B': ['B', 'D#', 'F#'],
                    'Cm': ['C', 'D#', 'G'],
                    'Dm': ['D', 'F', 'A'],
                    'Em': ['E', 'G', 'B'],
                    'Fm': ['F', 'G#', 'C'],
                    'Gm': ['G', 'A#', 'D'],
                    'Am': ['A', 'C', 'E'],
                    'Bm': ['B', 'D', 'F#'],
                    'C7': ['C', 'E', 'G', 'A#'],
                    'D7': ['D', 'F#', 'A', 'C'],
                    'E7': ['E', 'G#', 'B', 'D'],
                    'F7': ['F', 'A', 'C', 'D#'],
                    'G7': ['G', 'B', 'D', 'F'],
                    'A7': ['A', 'C#', 'E', 'G'],
                    'B7': ['B', 'D#', 'F#', 'A'],
                    'Cmaj7': ['C', 'E', 'G', 'B'],
                    'Dmaj7': ['D', 'F#', 'A', 'C#'],
                    'Emaj7': ['E', 'G#', 'B', 'D#'],
                    'Fmaj7': ['F', 'A', 'C', 'E'],
                    'Gmaj7': ['G', 'B', 'D', 'F#'],
                    'Amaj7': ['A', 'C#', 'E', 'G#'],
                    'Bmaj7': ['B', 'D#', 'F#', 'A#'],
                    'Cm7': ['C', 'D#', 'G', 'A#'],
                    'Dm7': ['D', 'F', 'A', 'C'],
                    'Em7': ['E', 'G', 'B', 'D'],
                    'Fm7': ['F', 'G#', 'C', 'D#'],
                    'Gm7': ['G', 'A#', 'D', 'F'],
                    'Am7': ['A', 'C', 'E', 'G'],
                    'Bm7': ['B', 'D', 'F#', 'A'],
                  };
                  
                  const noteNames = CHORD_PATTERNS[chordName];
                  if (!noteNames) {
                    // Fallback: try to extract root note
                    const root = chordName.replace(/[^A-G#]/g, '');
                    return root ? [`${root}4`] : ['C4'];
                  }
                  
                  // Convert to full note names with octaves (default to octave 4)
                  return noteNames.map(note => `${note}4`);
                };

                // Render chord fretboard diagram (similar to scale diagrams)
                const renderChordFretboard = (chordName: string, chordNotes: string[], isUkulele: boolean) => {
                  const strings = isUkulele ? ['G', 'C', 'E', 'A'] : ['E', 'A', 'D', 'G', 'B', 'E'];
                  const fretsToShow = 5;
                  const startFret = 0;
                  
                  // Get note names without octaves for comparison
                  const chordNoteNames = chordNotes.map(note => note.replace(/\d/g, ''));
                  const rootNote = chordNoteNames[0] || '';
                  
                  // Function to get note at a specific fret and string
                  const getNoteAtFret = (stringIndex: number, fret: number): string => {
                    const tuning = isUkulele ? ['G', 'C', 'E', 'A'] : ['E', 'A', 'D', 'G', 'B', 'E'];
                    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    const openNote = tuning[stringIndex];
                    const openIndex = notes.indexOf(openNote);
                    if (openIndex === -1) return '';
                    const noteIndex = (openIndex + fret) % 12;
                    return notes[noteIndex];
                  };
                  
                  // Check if note is in chord
                  const isNoteInChord = (note: string): boolean => {
                    const noteName = note.replace(/\d/g, '');
                    return chordNoteNames.includes(noteName);
                  };
                  
                  // Check if note is root
                  const isRootNote = (note: string): boolean => {
                    const noteName = note.replace(/\d/g, '');
                    return noteName === rootNote;
                  };
                  
                  return (
                    <div className="w-full bg-gray-800/30 rounded-lg p-2">
                      <div className="text-xs font-semibold text-white text-center mb-2">
                        {chordName}
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
                                const note = getNoteAtFret(stringIdx, fret);
                                const isInChord = note && isNoteInChord(note);
                                const isRoot = note && isRootNote(note);
                                
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
                                            : isInChord
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

                if (instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele') {
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uniqueChords.map((chord, index) => {
                        const chordNotes = getChordNotes(chord.chord);
                        const isCurrent = Math.abs(chord.time - currentTime) < 0.5;
                        const isUpcoming = chord.time > currentTime && chord.time <= currentTime + 2;
                        
                        return (
                          <motion.div
                            key={`${chord.chord}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl border-2 p-3 ${
                              isCurrent 
                                ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-400/50' 
                                : isUpcoming
                                ? 'border-emerald-400/50 bg-emerald-500/10'
                                : 'border-white/10 bg-slate-800/50'
                            }`}
                          >
                            <div className="text-center mb-2">
                              <div className={`text-xl font-bold mb-1 ${
                                isCurrent ? 'text-gold' : 'text-white'
                              }`}>
                                {chord.chord}
                              </div>
                              <div className="text-xs text-white/60">
                                {chord.time.toFixed(1)}s
                              </div>
                            </div>
                            {renderChordFretboard(chord.chord, chordNotes, instrument === 'ukulele')}
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                } else if (instrument === 'trumpet') {
                  // For trumpet, show individual notes instead of chords
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uniqueChords.map((chord, index) => {
                        // Extract root note from chord
                        const rootNote = chord.chord.replace(/[^A-G#]/g, '') + '4';
                        const isCurrent = Math.abs(chord.time - currentTime) < 0.5;
                        const noteColors: Record<string, string> = {
                          C: 'bg-red-500',
                          'C#': 'bg-red-600',
                          D: 'bg-orange-500',
                          'D#': 'bg-orange-600',
                          E: 'bg-yellow-500',
                          F: 'bg-green-500',
                          'F#': 'bg-green-600',
                          G: 'bg-blue-500',
                          'G#': 'bg-blue-600',
                          A: 'bg-indigo-500',
                          'A#': 'bg-indigo-600',
                          B: 'bg-purple-500',
                        };
                        const noteName = rootNote.replace(/\d/g, '');
                        const color = noteColors[noteName] || 'bg-gray-500';
                        
                        return (
                          <motion.div
                            key={`${rootNote}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl border-2 p-4 ${
                              isCurrent 
                                ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-400/50' 
                                : 'border-white/10 bg-slate-800/50'
                            }`}
                          >
                            <div className={`${color} rounded-lg p-4 text-center ${
                              isCurrent ? 'ring-2 ring-gold' : ''
                            }`}>
                              <div className="text-2xl font-bold text-white mb-2">
                                {rootNote}
                              </div>
                              <div className="text-sm text-white/90 font-semibold">
                                {TRUMPET_FINGERINGS[rootNote] || '—'}
                              </div>
                              <div className="text-xs text-white/70 mt-2">
                                {chord.time.toFixed(1)}s
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                } else if (instrument === 'piano') {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {uniqueChords.map((chord, index) => {
                        const chordNotes = getChordNotes(chord.chord);
                        const isCurrent = Math.abs(chord.time - currentTime) < 0.5;
                        
                        return (
                          <motion.div
                            key={`${chord.chord}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl border-2 p-3 ${
                              isCurrent 
                                ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-400/50' 
                                : 'border-white/10 bg-slate-800/50'
                            }`}
                          >
                            <div className="text-center mb-2">
                              <div className={`text-xl font-bold ${
                                isCurrent ? 'text-gold' : 'text-white'
                              }`}>
                                {chord.chord}
                              </div>
                              <div className="text-xs text-white/60 mt-1">
                                {chord.time.toFixed(1)}s
                              </div>
                            </div>
                            <FretboardVisualizer
                              instrument="piano"
                              targetNotes={chordNotes}
                              chord={chord.chord}
                              variant="mobile"
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          )}
        </div>
      )}

      {/* Loaded Song Chord Diagrams - Show all chords from loaded song */}
      {recordedData && recordedChordEvents.length > 0 && (
        <div className="rounded-3xl border border-emerald-400/40 bg-slate-900/60 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            {instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele' 
              ? '🎸 Song Chords' 
              : instrument === 'trumpet' 
              ? '🎺 Song Notes' 
              : instrument === 'piano'
              ? '🎹 Song Notes'
              : '🎵 Song Chords'}
          </h3>
          
          {/* Get current chord based on playback time */}
          {(() => {
            const songCurrentTime = playbackState.currentTime;
            const currentChord = recordedChordEvents.reduce((prev, curr) => {
              if (!prev) return curr;
              const prevDist = Math.abs(prev.timestamp - songCurrentTime);
              const currDist = Math.abs(curr.timestamp - songCurrentTime);
              return currDist < prevDist ? curr : prev;
            }, recordedChordEvents[0] || null);

            // Convert chord name to notes
            const getChordNotes = (chordName: string): string[] => {
              const CHORD_PATTERNS: Record<string, string[]> = {
                'C': ['C', 'E', 'G'],
                'D': ['D', 'F#', 'A'],
                'E': ['E', 'G#', 'B'],
                'F': ['F', 'A', 'C'],
                'G': ['G', 'B', 'D'],
                'A': ['A', 'C#', 'E'],
                'B': ['B', 'D#', 'F#'],
                'Cm': ['C', 'D#', 'G'],
                'Dm': ['D', 'F', 'A'],
                'Em': ['E', 'G', 'B'],
                'Fm': ['F', 'G#', 'C'],
                'Gm': ['G', 'A#', 'D'],
                'Am': ['A', 'C', 'E'],
                'Bm': ['B', 'D', 'F#'],
                'C7': ['C', 'E', 'G', 'A#'],
                'D7': ['D', 'F#', 'A', 'C'],
                'E7': ['E', 'G#', 'B', 'D'],
                'F7': ['F', 'A', 'C', 'D#'],
                'G7': ['G', 'B', 'D', 'F'],
                'A7': ['A', 'C#', 'E', 'G'],
                'B7': ['B', 'D#', 'F#', 'A'],
                'Cmaj7': ['C', 'E', 'G', 'B'],
                'Dmaj7': ['D', 'F#', 'A', 'C#'],
                'Emaj7': ['E', 'G#', 'B', 'D#'],
                'Fmaj7': ['F', 'A', 'C', 'E'],
                'Gmaj7': ['G', 'B', 'D', 'F#'],
                'Amaj7': ['A', 'C#', 'E', 'G#'],
                'Bmaj7': ['B', 'D#', 'F#', 'A#'],
                'Cm7': ['C', 'D#', 'G', 'A#'],
                'Dm7': ['D', 'F', 'A', 'C'],
                'Em7': ['E', 'G', 'B', 'D'],
                'Fm7': ['F', 'G#', 'C', 'D#'],
                'Gm7': ['G', 'A#', 'D', 'F'],
                'Am7': ['A', 'C', 'E', 'G'],
                'Bm7': ['B', 'D', 'F#', 'A'],
              };
              
              const noteNames = CHORD_PATTERNS[chordName];
              if (!noteNames) {
                const root = chordName.replace(/[^A-G#]/g, '');
                return root ? [`${root}4`] : ['C4'];
              }
              
              return noteNames.map(note => `${note}4`);
            };

            if (instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele') {
              return (
                <div className="space-y-4">
                  {/* All Chords Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {recordedChordEvents.map((chord, index) => {
                      const chordNotes = getChordNotes(chord.chord);
                      const isCurrent = currentChord && Math.abs(chord.timestamp - songCurrentTime) < 0.5;
                      const isUpcoming = chord.timestamp > songCurrentTime && chord.timestamp <= songCurrentTime + 2;
                      
                      return (
                        <motion.div
                          key={`${chord.timestamp}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-xl border-2 p-3 ${
                            isCurrent 
                              ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-400/50' 
                              : isUpcoming
                              ? 'border-emerald-400/50 bg-emerald-500/10'
                              : 'border-white/10 bg-slate-800/50'
                          }`}
                        >
                          <div className="text-center mb-2">
                            <div className={`text-xl font-bold mb-1 ${
                              isCurrent ? 'text-gold' : 'text-white'
                            }`}>
                              {chord.chord}
                            </div>
                            <div className="text-xs text-white/60">
                              {chord.timestamp.toFixed(1)}s
                            </div>
                          </div>
                          <FretboardVisualizer
                            instrument={instrument}
                            targetNotes={chordNotes}
                            chord={chord.chord}
                            showFretNumbers={false}
                            variant={(instrument === 'guitar' || instrument === 'ukulele') ? 'grid' : 'full'}
                            detectedKey={detectedKey}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            } else if (instrument === 'trumpet' || instrument === 'piano') {
              // Get unique chords to display
              const uniqueChords = Array.from(
                new Map(recordedChordEvents.map(c => [c.chord, c])).values()
              );

              return (
                <div className="space-y-4">
                  {/* All Chords Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uniqueChords.map((chord, index) => {
                      const chordNotes = getChordNotes(chord.chord);
                      const isCurrent = currentChord && Math.abs(chord.timestamp - songCurrentTime) < 0.5;
                      
                      return (
                        <motion.div
                          key={`${chord.chord}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-xl border-2 p-3 ${
                            isCurrent 
                              ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-400/50' 
                              : 'border-white/10 bg-slate-800/50'
                          }`}
                        >
                          <div className="text-center mb-3">
                            <div className={`text-xl font-bold mb-1 ${
                              isCurrent ? 'text-gold' : 'text-white'
                            }`}>
                              {chord.chord}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {chordNotes.map((note, noteIndex) => {
                              const noteColors: Record<string, string> = {
                                C: 'bg-red-500',
                                'C#': 'bg-red-600',
                                D: 'bg-orange-500',
                                'D#': 'bg-orange-600',
                                E: 'bg-yellow-500',
                                F: 'bg-green-500',
                                'F#': 'bg-green-600',
                                G: 'bg-blue-500',
                                'G#': 'bg-blue-600',
                                A: 'bg-indigo-500',
                                'A#': 'bg-indigo-600',
                                B: 'bg-purple-500',
                              };
                              const noteName = note.replace(/\d/g, '');
                              const color = noteColors[noteName] || 'bg-gray-500';
                              
                              return (
                                <div
                                  key={`${note}-${noteIndex}`}
                                  className={`${color} rounded-lg p-2 text-center ${
                                    isCurrent ? 'ring-2 ring-gold' : ''
                                  }`}
                                >
                                  <div className="text-sm font-bold text-white">
                                    {note}
                                  </div>
                                  {instrument === 'trumpet' && (
                                    <div className="text-xs text-white/80">
                                      {TRUMPET_FINGERINGS[note] || '—'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return null;
          })()}
        </div>
      )}

      {/* View Tabs - Mobile-friendly with larger touch targets */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        {viewTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCanvasView(tab.id)}
            className={`min-h-[60px] sm:min-h-[auto] flex flex-col items-center sm:items-start justify-center px-3 sm:px-4 py-3 sm:py-3 rounded-xl sm:rounded-2xl border transition ${
              canvasView === tab.id
                ? 'border-white text-white bg-white/10 shadow-lg'
                : 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm sm:text-base font-semibold">{tab.label}</span>
            <span className="text-xs hidden sm:block mt-0.5">{tab.description}</span>
          </button>
        ))}
      </div>

      <div className="rounded-[32px] border border-white/10 bg-slate-900/40 p-3 sm:p-4">
        {renderCanvasView()}
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Tone Path - Music Practice & Transcription</title>
        <meta name="description" content="Real-time music transcription and practice tools for musicians" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <PracticeShell
        globalBar={globalBarContent}
        utilityRail={utilityRailContent}
        primaryCanvas={primaryCanvasContent}
      />

      {learningModeEnabled && currentMetrics && (
        <FeedbackHUD metrics={currentMetrics} isVisible />
      )}

      {showSaveDialog && pendingSongData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 max-w-md w-full border-primary-500/30"
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-success">💾</span>
              Save Song
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-base font-semibold mb-3">Song Name *</label>
                <input
                  type="text"
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  placeholder="My Practice Session"
                  className="w-full px-5 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveSong();
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-gray-400 bg-dark-800 p-4 rounded-xl">
                <span className="text-accent-400">📊</span>
                {pendingSongData.events.filter((e) => 'note' in e).length} notes,{' '}
                {pendingSongData.events.filter((e) => 'chord' in e).length} chords
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveSong}
                  className="flex-1 px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-glow-primary btn-modern"
                >
                  💾 Save
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowSaveDialog(false);
                    setPendingSongData(null);
                  }}
                  className="flex-1 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-semibold btn-modern"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
