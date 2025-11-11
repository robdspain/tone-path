import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PlaybackState } from '@/types/transcription';

interface ControlsProps {
  isListening: boolean;
  isRecording: boolean;
  playbackState: PlaybackState;
  onStartListening: () => void;
  onStopListening: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlay: () => void;
  onPause: () => void;
  onTempoChange: (tempo: number) => void;
  onExportMIDI?: () => void;
  onExportXML?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isListening,
  isRecording,
  playbackState,
  onStartListening,
  onStopListening,
  onStartRecording,
  onStopRecording,
  onPlay,
  onPause,
  onTempoChange,
  onExportMIDI,
  onExportXML,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="w-full">
      {/* Mobile-first layout: Stack vertically on small screens */}
      <div className="flex flex-col gap-4">
        {/* Main Controls - Large touch targets for mobile */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isListening ? onStopListening : onStartListening}
            className={`min-h-[56px] flex-1 px-4 sm:px-6 py-3.5 rounded-xl font-semibold text-base sm:text-lg transition-all ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
            }`}
          >
            {isListening ? '⏹ Stop' : '🎤 Start'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={!isListening}
            className={`min-h-[56px] flex-1 px-4 sm:px-6 py-3.5 rounded-xl font-semibold text-base sm:text-lg transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg'
            } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            {isRecording ? '⏹ Stop' : '⏺ Record'}
          </motion.button>
        </div>

        {/* Playback Controls - Large touch targets */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={playbackState.isPlaying ? onPause : onPlay}
            className="min-h-[56px] flex-1 sm:flex-none px-6 sm:px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg"
          >
            {playbackState.isPlaying ? '⏸ Pause' : '▶ Play'}
          </motion.button>

          {/* Tempo Control - Larger for mobile */}
          <div className="flex items-center gap-3 dark:bg-dark-800 bg-gray-200 px-4 py-3 rounded-xl border dark:border-white/10 border-gray-300 flex-1 sm:flex-none">
            <label className="text-sm sm:text-base font-semibold dark:text-gray-300 text-gray-800 shrink-0">Tempo:</label>
            <input
              type="range"
              min="60"
              max="200"
              value={playbackState.tempo}
              onChange={(e) => onTempoChange(Number(e.target.value))}
              className="flex-1 min-w-0"
            />
            <span className="text-sm sm:text-base font-bold text-warning w-16 shrink-0 text-center">{playbackState.tempo}</span>
          </div>

          {/* Export Menu - Larger touch target */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="min-h-[56px] w-full sm:w-auto px-6 py-3.5 dark:bg-dark-700 bg-gray-300 dark:hover:bg-dark-600 hover:bg-gray-400 rounded-xl dark:text-white text-gray-900 font-semibold text-base sm:text-lg border dark:border-white/10 border-gray-400"
            >
              💾 Export {showExportMenu ? '▲' : '▼'}
            </motion.button>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 dark:bg-slate-800 bg-white rounded-xl border dark:border-white/10 border-gray-300 overflow-hidden z-10 min-w-[200px] shadow-xl"
              >
                <button
                  onClick={() => {
                    onExportMIDI?.();
                    setShowExportMenu(false);
                  }}
                  className="block w-full text-left px-5 py-4 hover:bg-primary-500/20 dark:text-white text-gray-900 transition-colors border-b dark:border-white/10 border-gray-200 min-h-[44px] flex items-center"
                >
                  🎹 Export MIDI
                </button>
                <button
                  onClick={() => {
                    onExportXML?.();
                    setShowExportMenu(false);
                  }}
                  className="block w-full text-left px-5 py-4 hover:bg-primary-500/20 dark:text-white text-gray-900 transition-colors min-h-[44px] flex items-center"
                >
                  📄 Export MusicXML
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

