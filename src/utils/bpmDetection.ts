/**
 * Detect BPM (Beats Per Minute) from an AudioBuffer
 * Uses autocorrelation on onset detection to find tempo
 */
export async function detectBPM(
  audioBuffer: AudioBuffer,
  onProgress?: (progress: number) => void
): Promise<number | null> {
  try {
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const duration = audioBuffer.duration;
    
    // Limit analysis to first 30 seconds for performance
    const maxDuration = Math.min(30, duration);
    const maxSamples = Math.floor(maxDuration * sampleRate);
    const samples = channelData.slice(0, maxSamples);
    
    // Downsample for faster processing (target ~8kHz)
    const downsampleFactor = Math.max(1, Math.floor(sampleRate / 8000));
    const downsampled: number[] = [];
    for (let i = 0; i < samples.length; i += downsampleFactor) {
      downsampled.push(samples[i]);
    }
    const downsampledRate = sampleRate / downsampleFactor;
    
    if (onProgress) onProgress(0.2);
    
    // Detect onsets (peaks in energy)
    const onsets = detectOnsets(downsampled, downsampledRate);
    
    if (onProgress) onProgress(0.5);
    
    if (onsets.length < 4) {
      // Not enough onsets to detect tempo
      return null;
    }
    
    // Calculate inter-onset intervals (IOI)
    const iois: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      iois.push(onsets[i] - onsets[i - 1]);
    }
    
    if (onProgress) onProgress(0.7);
    
    // Use autocorrelation to find periodic patterns
    const bpm = autocorrelationBPM(iois, downsampledRate);
    
    if (onProgress) onProgress(1.0);
    
    return bpm;
  } catch (error) {
    console.error('BPM detection error:', error);
    return null;
  }
}

/**
 * Detect onsets (note starts) in audio signal
 */
function detectOnsets(samples: number[], sampleRate: number): number[] {
  const onsets: number[] = [];
  const windowSize = Math.floor(0.05 * sampleRate); // 50ms windows
  const hopSize = Math.floor(0.01 * sampleRate); // 10ms hop
  
  let previousEnergy = 0;
  
  for (let i = windowSize; i < samples.length - windowSize; i += hopSize) {
    // Calculate energy in window
    let energy = 0;
    for (let j = i - windowSize; j < i + windowSize; j++) {
      energy += Math.abs(samples[j] || 0);
    }
    energy /= windowSize * 2;
    
    // Detect onset if energy increases significantly
    const energyIncrease = energy - previousEnergy;
    if (energyIncrease > 0.01 && energy > 0.05) {
      const time = i / sampleRate;
      // Avoid duplicate onsets too close together
      if (onsets.length === 0 || time - onsets[onsets.length - 1] > 0.1) {
        onsets.push(time);
      }
    }
    
    previousEnergy = energy;
  }
  
  return onsets;
}

/**
 * Use autocorrelation to find BPM from inter-onset intervals
 */
function autocorrelationBPM(iois: number[], sampleRate: number): number | null {
  if (iois.length < 4) return null;
  
  // Normalize IOIs to seconds
  const ioiSeconds = iois.map(ioi => ioi / sampleRate);
  
  // Find most common IOI (likely beat interval)
  const ioiHistogram: Map<number, number> = new Map();
  const binSize = 0.01; // 10ms bins
  
  for (const ioi of ioiSeconds) {
    // Focus on reasonable tempo range (60-200 BPM = 0.3s to 1.0s intervals)
    if (ioi >= 0.3 && ioi <= 1.0) {
      const bin = Math.round(ioi / binSize) * binSize;
      ioiHistogram.set(bin, (ioiHistogram.get(bin) || 0) + 1);
    }
  }
  
  if (ioiHistogram.size === 0) return null;
  
  // Find most common IOI
  let maxCount = 0;
  let bestIOI = 0;
  for (const [ioi, count] of ioiHistogram.entries()) {
    if (count > maxCount) {
      maxCount = count;
      bestIOI = ioi;
    }
  }
  
  // Convert IOI to BPM
  const bpm = 60 / bestIOI;
  
  // Clamp to reasonable range (60-200 BPM)
  if (bpm < 60 || bpm > 200) {
    // Try doubling or halving
    const doubled = bpm * 2;
    const halved = bpm / 2;
    
    if (doubled >= 60 && doubled <= 200) return Math.round(doubled);
    if (halved >= 60 && halved <= 200) return Math.round(halved);
    
    return null;
  }
  
  return Math.round(bpm);
}

