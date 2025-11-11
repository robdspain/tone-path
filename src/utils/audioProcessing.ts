// Utility functions for audio processing

export function applySmoothing(values: number[], smoothingFactor: number): number[] {
  if (values.length === 0) return values;
  
  const smoothed = [values[0]];
  for (let i = 1; i < values.length; i++) {
    smoothed.push(
      smoothingFactor * values[i] + (1 - smoothingFactor) * smoothed[i - 1]
    );
  }
  return smoothed;
}

export function normalizeAudioBuffer(buffer: Float32Array): Float32Array {
  const max = Math.max(...Array.from(buffer).map(Math.abs));
  if (max === 0) return buffer;
  
  return new Float32Array(buffer.map((val) => val / max));
}

export function calculateRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

export function applyHighPassFilter(buffer: Float32Array, cutoffFreq: number, sampleRate: number): Float32Array {
  const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
  const dt = 1.0 / sampleRate;
  const alpha = rc / (rc + dt);
  
  const filtered = new Float32Array(buffer.length);
  filtered[0] = buffer[0];
  
  for (let i = 1; i < buffer.length; i++) {
    filtered[i] = alpha * (filtered[i - 1] + buffer[i] - buffer[i - 1]);
  }
  
  return filtered;
}

