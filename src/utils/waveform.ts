// Utility to generate waveform data from AudioBuffer
export interface WaveformData {
  peaks: number[];
  sampleRate: number;
  duration: number;
}

/**
 * Generate waveform peaks from AudioBuffer
 * @param audioBuffer The audio buffer to analyze
 * @param samples Number of samples to generate (default: 2000 for good detail)
 * @returns Array of peak values normalized to 0-1
 */
export function generateWaveform(
  audioBuffer: AudioBuffer,
  samples: number = 2000
): WaveformData {
  const rawData = audioBuffer.getChannelData(0); // Use first channel
  const blockSize = Math.floor(rawData.length / samples);
  const peaks: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, rawData.length);
    
    let max = 0;
    let min = 0;
    
    for (let j = start; j < end; j++) {
      const value = rawData[j];
      if (value > max) max = value;
      if (value < min) min = value;
    }
    
    // Store peak amplitude (absolute value of max deviation)
    peaks.push(Math.max(Math.abs(max), Math.abs(min)));
  }

  return {
    peaks,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
  };
}

/**
 * Detect potential song sections based on waveform energy changes
 * This is a simple heuristic - more sophisticated analysis would use ML
 */
export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro';
  start: number;
  end: number;
  confidence: number;
}

export function detectSections(waveform: WaveformData): SongSection[] {
  const sections: SongSection[] = [];
  const { peaks, duration } = waveform;
  
  // Calculate energy levels
  const energyLevels = peaks.map(p => p * p);
  const avgEnergy = energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length;
  
  // Find high-energy regions (potential choruses)
  const highEnergyThreshold = avgEnergy * 1.3;
  const lowEnergyThreshold = avgEnergy * 0.7;
  
  let currentSection: { type: SongSection['type']; start: number; energy: number } | null = null;
  const sectionDuration = duration / 8; // Approximate section length
  
  for (let i = 0; i < peaks.length; i++) {
    const time = (i / peaks.length) * duration;
    const energy = energyLevels[i];
    
    if (energy > highEnergyThreshold) {
      if (!currentSection || currentSection.type !== 'chorus') {
        if (currentSection) {
          sections.push({
            type: currentSection.type,
            start: currentSection.start,
            end: time,
            confidence: 0.6,
          });
        }
        currentSection = { type: 'chorus', start: time, energy };
      }
    } else if (energy < lowEnergyThreshold) {
      if (!currentSection || currentSection.type !== 'verse') {
        if (currentSection) {
          sections.push({
            type: currentSection.type,
            start: currentSection.start,
            end: time,
            confidence: 0.6,
          });
        }
        currentSection = { type: 'verse', start: time, energy };
      }
    }
  }
  
  // Add final section
  if (currentSection) {
    sections.push({
      type: currentSection.type,
      start: currentSection.start,
      end: duration,
      confidence: 0.6,
    });
  }
  
  // Label intro/outro
  if (sections.length > 0) {
    sections[0].type = 'intro';
    sections[sections.length - 1].type = 'outro';
  }
  
  return sections;
}

