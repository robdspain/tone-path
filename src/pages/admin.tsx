import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { PresetManager } from '@/components/PresetManager';
import { SongLibrary } from '@/components/SongLibrary';
import { Metronome } from '@/components/Metronome';
import { generateWaveform, detectSections, type SongSection } from '@/utils/waveform';
import type { Instrument, AudioSettings } from '@/types/transcription';
import type { TranscriptionPreset } from '@/types/presets';
import type { SavedSong } from '@/utils/songStorage';
import { useTheme } from '@/contexts/ThemeContext';

export default function Admin() {
  const { theme } = useTheme();
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    sensitivity: 0.5,
    latency: 100,
    smoothing: 0.8,
  });
  const [importedAudioBuffer, setImportedAudioBuffer] = useState<AudioBuffer | null>(null);
  const [detectedSections, setDetectedSections] = useState<SongSection[]>([]);
  const [useCREPE, setUseCREPE] = useState(false);
  const [showSongLibrary, setShowSongLibrary] = useState(true);
  const [metronomeBPM, setMetronomeBPM] = useState(120);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setImportedAudioBuffer(audioBuffer);

      // Generate waveform and detect sections
      const waveform = generateWaveform(audioBuffer);
      const sections = detectSections(waveform);
      setDetectedSections(sections);
    } catch (error) {
      console.error('Failed to process audio file:', error);
      alert('Failed to process audio file');
    }
  };

  const handleLoadPreset = (preset: TranscriptionPreset) => {
    setInstrument(preset.instrument);
    setAudioSettings(preset.audioSettings);
  };

  const handleLoadSong = (song: SavedSong) => {
    alert(`Song "${song.name}" loaded. Use the main app to play songs.`);
  };

  const handlePlaySong = (song: SavedSong) => {
    alert(`Song "${song.name}" selected. Use the main app to play songs.`);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSectionColor = (type: string): string => {
    const colors: Record<string, string> = {
      verse: 'dark:bg-blue-500/20 bg-blue-200/50 dark:border-blue-400/30 border-blue-400/50',
      chorus: 'dark:bg-green-500/20 bg-green-200/50 dark:border-green-400/30 border-green-400/50',
      bridge: 'dark:bg-purple-500/20 bg-purple-200/50 dark:border-purple-400/30 border-purple-400/50',
      intro: 'dark:bg-yellow-500/20 bg-yellow-200/50 dark:border-yellow-400/30 border-yellow-400/50',
      outro: 'dark:bg-red-500/20 bg-red-200/50 dark:border-red-400/30 border-red-400/50',
    };
    return colors[type] || 'dark:bg-gray-500/20 bg-gray-200/50 dark:border-gray-400/30 border-gray-400/50';
  };

  const getSectionLabel = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <>
      <Head>
        <title>Admin - Tone Path</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold gradient-text">Admin Panel</h1>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-semibold"
              >
                ← Back to App
              </motion.button>
            </Link>
          </div>

          {/* Instrument Selector */}
          <div className="mb-6 flex justify-center gap-4 flex-wrap">
            {(['trumpet', 'guitar', 'bass', 'ukulele', 'piano'] as Instrument[]).map((inst) => (
              <motion.button
                key={inst}
                onClick={() => setInstrument(inst)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-xl font-semibold capitalize transition-all ${
                  instrument === inst
                    ? 'bg-gradient-primary text-white shadow-glow-primary'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600 border border-white/10'
                }`}
              >
                {inst === 'trumpet' && '🎺 '}
                {inst === 'guitar' && '🎸 '}
                {inst === 'bass' && '🎸 '}
                {inst === 'ukulele' && '🎸 '}
                {inst === 'piano' && '🎹 '}
                {inst}
              </motion.button>
            ))}
          </div>

          {/* Preset Manager */}
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary-400">🎛️</span>
              Preset Library
            </h2>
            <PresetManager
              currentInstrument={instrument}
              currentSettings={audioSettings}
              onLoadPreset={handleLoadPreset}
            />
          </div>

          {/* Song Library */}
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <button
              type="button"
              onClick={() => setShowSongLibrary(!showSongLibrary)}
              className="w-full flex items-center justify-between mb-4 text-left"
            >
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-primary-400">📚</span>
                Song Library
              </h2>
              <span className="text-gray-400">{showSongLibrary ? '▼' : '▶'}</span>
            </button>
            {showSongLibrary && (
              <div>
                <SongLibrary currentInstrument={instrument} onLoadSong={handleLoadSong} onPlaySong={handlePlaySong} />
              </div>
            )}
          </div>

          {/* Audio Section Detection */}
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary-400">🎵</span>
              Audio Section Detection
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">
                  Upload Audio File to Detect Sections
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-lg border dark:border-gray-600 border-gray-300"
                />
              </div>

              {detectedSections.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm dark:text-gray-300 text-gray-700 mb-3 font-semibold">
                    Detected Sections ({detectedSections.length}):
                  </div>
                  <div className="space-y-2">
                    {detectedSections.map((section, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getSectionColor(section.type)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold dark:text-white text-gray-900">
                              {getSectionLabel(section.type)}
                            </div>
                            <div className="text-xs dark:text-gray-300 text-gray-700 mt-1">
                              {formatTime(section.start)} - {formatTime(section.end)} (
                              {formatTime(section.end - section.start)} duration)
                            </div>
                          </div>
                          <div className="text-xs dark:text-gray-400 text-gray-600">
                            Confidence: {(section.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importedAudioBuffer && detectedSections.length === 0 && (
                <div className="text-sm dark:text-gray-400 text-gray-600">
                  No sections detected. Try uploading a different audio file.
                </div>
              )}

              {!importedAudioBuffer && (
                <div className="text-sm dark:text-gray-400 text-gray-600">
                  Upload an audio file to detect song sections (verse, chorus, bridge, etc.)
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary-400">⚙️</span>
              Advanced Settings
            </h2>
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-3 text-base font-semibold dark:text-gray-300 text-gray-700 mb-3">
                  <input
                    type="checkbox"
                    checked={useCREPE}
                    onChange={(e) => setUseCREPE(e.target.checked)}
                    className="w-5 h-5 accent-teal"
                  />
                  Use CREPE Model (More Accurate, Slower)
                </label>
                <p className="text-sm dark:text-gray-400 text-gray-600 ml-8">
                  Uses TensorFlow.js CREPE model for pitch detection. More accurate but requires more processing power.
                </p>
              </div>

              <div>
                <label className="block text-base font-semibold dark:text-gray-300 text-gray-700 mb-2">
                  Sensitivity: {Math.round(audioSettings.sensitivity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={audioSettings.sensitivity}
                  onChange={(e) =>
                    setAudioSettings((prev) => ({ ...prev, sensitivity: Number(e.target.value) }))
                  }
                  className="w-full"
                />
                <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                  Higher values detect quieter sounds but may produce more false positives.
                </p>
              </div>

              <div>
                <label className="block text-base font-semibold dark:text-gray-300 text-gray-700 mb-2">
                  Latency: {audioSettings.latency} ms
                </label>
                <input
                  type="range"
                  min="50"
                  max="250"
                  step="10"
                  value={audioSettings.latency}
                  onChange={(e) =>
                    setAudioSettings((prev) => ({ ...prev, latency: Number(e.target.value) }))
                  }
                  className="w-full"
                />
                <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                  Lower values reduce delay but may cause more processing overhead.
                </p>
              </div>

              <div>
                <label className="block text-base font-semibold dark:text-gray-300 text-gray-700 mb-2">
                  Smoothing: {Math.round(audioSettings.smoothing * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.05"
                  value={audioSettings.smoothing}
                  onChange={(e) =>
                    setAudioSettings((prev) => ({ ...prev, smoothing: Number(e.target.value) }))
                  }
                  className="w-full"
                />
                <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                  Higher values create smoother note transitions but may lag behind rapid changes.
                </p>
              </div>

              <div className="pt-4 border-t dark:border-gray-700 border-gray-300">
                <h3 className="text-lg font-semibold dark:text-gray-300 text-gray-700 mb-3">
                  Current Settings Preview
                </h3>
                <div className="bg-dark-800/50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="dark:text-gray-400 text-gray-600">Instrument:</span>
                    <span className="dark:text-white text-gray-900 font-semibold capitalize">{instrument}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="dark:text-gray-400 text-gray-600">CREPE:</span>
                    <span className="dark:text-white text-gray-900 font-semibold">{useCREPE ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="dark:text-gray-400 text-gray-600">Sensitivity:</span>
                    <span className="dark:text-white text-gray-900 font-semibold">{Math.round(audioSettings.sensitivity * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="dark:text-gray-400 text-gray-600">Latency:</span>
                    <span className="dark:text-white text-gray-900 font-semibold">{audioSettings.latency} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="dark:text-gray-400 text-gray-600">Smoothing:</span>
                    <span className="dark:text-white text-gray-900 font-semibold">{Math.round(audioSettings.smoothing * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metronome */}
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary-400">🥁</span>
              Metronome
            </h2>
            <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
              <Metronome
                initialBpm={metronomeBPM}
                onBpmChange={setMetronomeBPM}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

