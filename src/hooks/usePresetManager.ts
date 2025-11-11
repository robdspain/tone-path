import { useState, useEffect } from 'react';
import type { TranscriptionPreset, PresetLibrary } from '@/types/presets';
import { DEFAULT_PRESETS } from '@/types/presets';

const STORAGE_KEY = 'transcription-presets';
const STORAGE_VERSION = '1.0.0';

export const usePresetManager = () => {
  const [presets, setPresets] = useState<TranscriptionPreset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const library: PresetLibrary = JSON.parse(stored);
        if (library.version === STORAGE_VERSION) {
          setPresets(library.presets);
        } else {
          // Migrate or reset if version mismatch
          initializeDefaults();
        }
      } else {
        initializeDefaults();
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
      initializeDefaults();
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const initializeDefaults = () => {
    const defaultPresets = Object.values(DEFAULT_PRESETS);
    setPresets(defaultPresets);
    savePresets(defaultPresets);
  };

  const savePresets = (presetsToSave: TranscriptionPreset[]) => {
    try {
      const library: PresetLibrary = {
        presets: presetsToSave,
        version: STORAGE_VERSION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch (error) {
      console.error('Failed to save presets:', error);
      throw new Error('Failed to save presets');
    }
  };

  const savePreset = (preset: TranscriptionPreset) => {
    const updated = [...presets];
    const index = updated.findIndex((p) => p.id === preset.id);
    
    if (index >= 0) {
      updated[index] = { ...preset, updatedAt: Date.now() };
    } else {
      updated.push({ ...preset, createdAt: Date.now(), updatedAt: Date.now() });
    }
    
    setPresets(updated);
    savePresets(updated);
  };

  const deletePreset = (id: string) => {
    // Don't allow deleting default presets
    if (id.startsWith('default-')) {
      throw new Error('Cannot delete default presets');
    }
    
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    savePresets(updated);
  };

  const getPreset = (id: string): TranscriptionPreset | undefined => {
    return presets.find((p) => p.id === id);
  };

  const getPresetsByInstrument = (instrument: string): TranscriptionPreset[] => {
    return presets.filter((p) => p.instrument === instrument);
  };

  const exportPreset = (preset: TranscriptionPreset): string => {
    return JSON.stringify(preset, null, 2);
  };

  const exportPresetLibrary = (): string => {
    const library: PresetLibrary = {
      presets,
      version: STORAGE_VERSION,
    };
    return JSON.stringify(library, null, 2);
  };

  const importPreset = (json: string): TranscriptionPreset => {
    try {
      const preset = JSON.parse(json) as TranscriptionPreset;
      
      // Validate preset structure
      if (!preset.id || !preset.name || !preset.instrument || !preset.audioSettings) {
        throw new Error('Invalid preset format');
      }

      // Generate new ID if importing someone else's preset
      const newId = preset.id.startsWith('default-') 
        ? preset.id 
        : `imported-${Date.now()}-${preset.id}`;
      
      return {
        ...preset,
        id: newId,
        createdAt: preset.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
    } catch (error) {
      throw new Error('Failed to parse preset JSON');
    }
  };

  const importPresetLibrary = (json: string): number => {
    try {
      const library = JSON.parse(json) as PresetLibrary;
      
      if (!library.presets || !Array.isArray(library.presets)) {
        throw new Error('Invalid library format');
      }

      let importedCount = 0;
      const updated = [...presets];

      library.presets.forEach((preset) => {
        try {
          // Skip if already exists (unless it's a default)
          if (!preset.id.startsWith('default-') && updated.find((p) => p.id === preset.id)) {
            return;
          }

          const imported = importPreset(JSON.stringify(preset));
          updated.push(imported);
          importedCount++;
        } catch (error) {
          console.warn('Failed to import preset:', preset.name, error);
        }
      });

      setPresets(updated);
      savePresets(updated);
      return importedCount;
    } catch (error) {
      throw new Error('Failed to parse library JSON');
    }
  };

  const createPresetFromCurrent = (
    name: string,
    description: string,
    instrument: string,
    audioSettings: any
  ): TranscriptionPreset => {
    return {
      id: `user-${Date.now()}`,
      name,
      description,
      instrument: instrument as any,
      audioSettings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
    };
  };

  const generateShareableURL = (preset: TranscriptionPreset): string => {
    const encoded = btoa(JSON.stringify(preset));
    return `${window.location.origin}${window.location.pathname}?preset=${encoded}`;
  };

  const loadPresetFromURL = (): TranscriptionPreset | null => {
    if (typeof window === 'undefined') return null;
    
    const params = new URLSearchParams(window.location.search);
    const presetData = params.get('preset');
    
    if (!presetData) return null;

    try {
      const decoded = atob(presetData);
      return importPreset(decoded);
    } catch (error) {
      console.error('Failed to load preset from URL:', error);
      return null;
    }
  };

  return {
    presets,
    isLoaded,
    savePreset,
    deletePreset,
    getPreset,
    getPresetsByInstrument,
    exportPreset,
    exportPresetLibrary,
    importPreset,
    importPresetLibrary,
    createPresetFromCurrent,
    generateShareableURL,
    loadPresetFromURL,
  };
};


