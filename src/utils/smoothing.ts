// Smoothing utilities for note detection

export interface SmoothingBuffer {
  values: number[];
  maxSize: number;
}

export function createSmoothingBuffer(maxSize: number): SmoothingBuffer {
  return {
    values: [],
    maxSize,
  };
}

export function addToBuffer(buffer: SmoothingBuffer, value: number): void {
  buffer.values.push(value);
  if (buffer.values.length > buffer.maxSize) {
    buffer.values.shift();
  }
}

export function getSmoothedValue(buffer: SmoothingBuffer): number {
  if (buffer.values.length === 0) return 0;
  
  const sum = buffer.values.reduce((a, b) => a + b, 0);
  return sum / buffer.values.length;
}

export function exponentialMovingAverage(current: number, previous: number, alpha: number): number {
  return alpha * current + (1 - alpha) * previous;
}

