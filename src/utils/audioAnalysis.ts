// Utility functions for analyzing entire audio buffers
import { getChromagram, classifyChord, smoothChordSequence } from '@/lib/audio/analysis';
import type { ChordFrame } from '@/types/chords';

/**
 * Analyze an entire AudioBuffer to extract chords
 * @param audioBuffer The audio buffer to analyze
 * @param windowSizeMs Size of analysis window in milliseconds (default 500ms)
 * @param hopSizeMs Hop size between windows in milliseconds (default 250ms)
 * @param onProgress Optional progress callback (0-1)
 * @param onChordFound Optional callback called when a chord is detected (for progressive updates)
 * @returns Array of detected chord frames
 */
export async function analyzeAudioBufferForChords(
  audioBuffer: AudioBuffer,
  windowSizeMs: number = 1000,  // Increased for better frequency resolution
  hopSizeMs: number = 500,      // Increased for faster processing
  onProgress?: (progress: number) => void,
  onChordFound?: (chord: ChordFrame) => void
): Promise<ChordFrame[]> {
  const sampleRate = audioBuffer.sampleRate;
  const windowSizeSamples = Math.floor((windowSizeMs / 1000) * sampleRate);
  const hopSizeSamples = Math.floor((hopSizeMs / 1000) * sampleRate);
  const duration = audioBuffer.duration;
  
  const frames: ChordFrame[] = [];
  
  // Use the first channel for analysis (or mix channels)
  const channelData = audioBuffer.getChannelData(0);
  const numChannels = audioBuffer.numberOfChannels;
  
  // If multiple channels, mix them
  let mixedData: Float32Array;
  if (numChannels > 1) {
    mixedData = new Float32Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      let sum = channelData[i];
      for (let ch = 1; ch < numChannels; ch++) {
        sum += audioBuffer.getChannelData(ch)[i];
      }
      mixedData[i] = sum / numChannels;
    }
  } else {
    mixedData = channelData;
  }
  
  // Analyze in windows
  const totalWindows = Math.floor((mixedData.length - windowSizeSamples) / hopSizeSamples);
  let processedWindows = 0;
  let detectedCount = 0;
  
  console.log(`Analyzing ${totalWindows} windows from audio buffer (duration: ${duration.toFixed(2)}s)`);
  
  for (let start = 0; start < mixedData.length - windowSizeSamples; start += hopSizeSamples) {
    const window = mixedData.slice(start, start + windowSizeSamples);
    const time = start / sampleRate;
    
    // Get chromagram for this window
    const chroma = getChromagram(window, sampleRate);
    
    // Classify chord
    const chordResult = classifyChord(chroma);
    
    if (chordResult && chordResult.confidence >= 0.2) { // Lowered from 0.3 to 0.2 for more sensitivity
      const chordFrame: ChordFrame = {
        time,
        chord: chordResult.label,
        confidence: chordResult.confidence,
      };
      frames.push(chordFrame);
      detectedCount++;
      
      // Notify about the found chord immediately for progressive updates
      if (onChordFound) {
        onChordFound(chordFrame);
      }
    }
    
    processedWindows++;
    
    // Report progress and yield more frequently to prevent UI freezing
    if (processedWindows % 10 === 0) {
      const progress = processedWindows / totalWindows;
      if (onProgress) {
        onProgress(Math.min(progress, 0.99)); // Cap at 99% until smoothing is done
      }
      // Yield to prevent blocking - yield every 10 windows instead of 50
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  console.log(`Detected ${detectedCount} chord frames before smoothing`);
  
  // Report progress before smoothing
  if (onProgress) {
    onProgress(0.99);
  }
  
  // Smooth the chord sequence
  const smoothed = smoothChordSequence(frames, windowSizeMs);
  
  console.log(`After smoothing: ${smoothed.length} chord frames`);
  
  // Report 100% completion
  if (onProgress) {
    onProgress(1.0);
  }
  
  return smoothed;
}

