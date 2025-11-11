// Netlify function for MIDI export
import type { Handler } from '@netlify/functions';
import type { TranscriptionData } from '../types';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data: TranscriptionData = JSON.parse(event.body || '{}');
    const tempo = data.events.length > 0 ? 120 : 120; // Default tempo
    
    // Use client-side conversion (midi-writer-js)
    // For server-side, you'd need to install midi-writer-js here
    // For now, return the data and let client handle conversion
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Use client-side export for MIDI files',
        data,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process MIDI export' }),
    };
  }
};
