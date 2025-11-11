import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePresetManager } from '@/hooks/usePresetManager';
import type { TranscriptionPreset } from '@/types/presets';
import type { Instrument, AudioSettings } from '@/types/transcription';

interface PresetManagerProps {
  currentInstrument: Instrument;
  currentSettings: AudioSettings;
  onLoadPreset: (preset: TranscriptionPreset) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentInstrument,
  currentSettings,
  onLoadPreset,
}) => {
  const {
    presets,
    isLoaded,
    savePreset,
    deletePreset,
    getPresetsByInstrument,
    exportPreset,
    exportPresetLibrary,
    importPreset,
    importPresetLibrary,
    createPresetFromCurrent,
    generateShareableURL,
  } = usePresetManager();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [importText, setImportText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<TranscriptionPreset | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareURL, setShareURL] = useState('');

  const instrumentPresets = getPresetsByInstrument(currentInstrument);

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    try {
      const preset = createPresetFromCurrent(
        presetName,
        presetDescription,
        currentInstrument,
        currentSettings
      );
      savePreset(preset);
      setShowSaveDialog(false);
      setPresetName('');
      setPresetDescription('');
      alert('Preset saved successfully!');
    } catch (error) {
      alert('Failed to save preset');
    }
  };

  const handleLoadPreset = (preset: TranscriptionPreset) => {
    onLoadPreset(preset);
    alert(`Loaded preset: ${preset.name}`);
  };

  const handleDeletePreset = (preset: TranscriptionPreset) => {
    if (confirm(`Delete preset "${preset.name}"?`)) {
      try {
        deletePreset(preset.id);
        alert('Preset deleted');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete preset');
      }
    }
  };

  const handleExportPreset = (preset: TranscriptionPreset) => {
    const json = exportPreset(preset);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preset-${preset.name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportLibrary = () => {
    const json = exportPresetLibrary();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preset-library-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportPreset = () => {
    if (!importText.trim()) {
      alert('Please paste preset JSON');
      return;
    }

    try {
      const preset = importPreset(importText);
      savePreset(preset);
      setShowImportDialog(false);
      setImportText('');
      alert(`Imported preset: ${preset.name}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to import preset');
    }
  };

  const handleImportLibrary = () => {
    if (!importText.trim()) {
      alert('Please paste library JSON');
      return;
    }

    try {
      const count = importPresetLibrary(importText);
      setShowImportDialog(false);
      setImportText('');
      alert(`Imported ${count} preset(s)`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to import library');
    }
  };

  const handleSharePreset = (preset: TranscriptionPreset) => {
    const url = generateShareableURL(preset);
    setShareURL(url);
    setSelectedPreset(preset);
    setShowShareDialog(true);
  };

  const copyShareURL = () => {
    navigator.clipboard.writeText(shareURL);
    alert('Share URL copied to clipboard!');
  };

  if (!isLoaded) {
    return (
      <div className="w-full bg-gray-800/50 rounded-lg p-6 text-center dark:text-gray-300 text-gray-700">
        Loading presets...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gold mb-2">📚 Preset Library</h3>
        <p className="text-sm dark:text-gray-300 text-gray-700">
          Save, load, and share practice settings for {currentInstrument}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSaveDialog(true)}
          className="px-4 py-2 bg-teal hover:bg-teal-light dark:text-white text-white rounded-lg font-semibold"
        >
          💾 Save Current Settings
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowImportDialog(true)}
          className="px-4 py-2 bg-gold hover:bg-gold-light dark:text-gray-900 text-gray-900 font-semibold rounded-lg border-2 border-gold-dark/30 dark:border-gold-dark/50"
        >
          📥 Import Preset
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportLibrary}
          className="px-4 py-2 dark:bg-gray-700 bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-700 dark:text-white text-white rounded-lg font-semibold"
        >
          📤 Export Library
        </motion.button>
      </div>

      {/* Preset List */}
      <div className="space-y-2">
        {instrumentPresets.length === 0 ? (
          <div className="text-center dark:text-gray-400 text-gray-600 py-8">
            No presets saved for {currentInstrument}. Save your current settings to get started!
          </div>
        ) : (
          instrumentPresets.map((preset) => (
            <motion.div
              key={preset.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="dark:bg-gray-700/50 bg-gray-200/80 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-semibold dark:text-white text-gray-900">{preset.name}</div>
                {preset.description && (
                  <div className="text-sm dark:text-gray-300 text-gray-600 mt-1">{preset.description}</div>
                )}
                <div className="text-xs dark:text-gray-500 text-gray-500 mt-1">
                  Sensitivity: {preset.audioSettings.sensitivity.toFixed(2)} | 
                  Smoothing: {preset.audioSettings.smoothing.toFixed(2)}
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLoadPreset(preset)}
                  className="px-3 py-1 bg-teal hover:bg-teal-light text-white rounded text-sm"
                >
                  Load
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExportPreset(preset)}
                  className="px-3 py-1 dark:bg-gray-600 bg-gray-500 dark:hover:bg-gray-500 hover:bg-gray-600 dark:text-white text-white rounded text-sm"
                >
                  Export
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSharePreset(preset)}
                  className="px-3 py-1 bg-gold hover:bg-gold-light dark:text-gray-900 text-gray-900 rounded text-sm font-semibold border border-gold-dark/30 dark:border-gold-dark/50"
                >
                  Share
                </motion.button>
                {!preset.id.startsWith('default-') && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeletePreset(preset)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    Delete
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="dark:bg-gray-800 bg-gray-100 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gold mb-4">Save Preset</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="My Custom Preset"
                    className="w-full px-4 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-lg border dark:border-gray-600 border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Description</label>
                  <textarea
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    placeholder="Optional description..."
                    className="w-full px-4 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-lg border dark:border-gray-600 border-gray-300"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSavePreset}
                    className="flex-1 px-4 py-2 bg-teal hover:bg-teal-light text-white rounded-lg font-semibold"
                  >
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Dialog */}
      <AnimatePresence>
        {showImportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowImportDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="dark:bg-gray-800 bg-gray-100 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gold mb-4">Import Preset</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Paste JSON</label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste preset or library JSON here..."
                    className="w-full px-4 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-lg border dark:border-gray-600 border-gray-300 font-mono text-sm"
                    rows={8}
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleImportPreset}
                    className="flex-1 px-4 py-2 bg-teal hover:bg-teal-light text-white rounded-lg font-semibold"
                  >
                    Import Preset
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleImportLibrary}
                    className="flex-1 px-4 py-2 bg-gold hover:bg-gold-light dark:text-gray-900 text-gray-900 rounded-lg font-semibold border-2 border-gold-dark/30 dark:border-gold-dark/50"
                  >
                    Import Library
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowImportDialog(false)}
                    className="px-4 py-2 dark:bg-gray-700 bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-700 dark:text-white text-white rounded-lg font-semibold"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Dialog */}
      <AnimatePresence>
        {showShareDialog && selectedPreset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowShareDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="dark:bg-gray-800 bg-gray-100 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gold mb-4">
                Share: {selectedPreset.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Share URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareURL}
                      readOnly
                      className="flex-1 px-4 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-lg border dark:border-gray-600 border-gray-300 text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyShareURL}
                      className="px-4 py-2 bg-teal hover:bg-teal-light dark:text-white text-white rounded-lg font-semibold"
                    >
                      Copy
                    </motion.button>
                  </div>
                </div>
                <p className="text-sm dark:text-gray-300 text-gray-700">
                  Share this URL with others to let them import this preset!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowShareDialog(false)}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

