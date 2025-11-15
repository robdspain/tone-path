// Netlify function to extract audio from YouTube using Node.js
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import ytdl from '@distube/ytdl-core';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const videoId = body.videoId;

    if (!videoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Video ID required' }),
      };
    }

    // Construct YouTube URL
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Verify the video is available
    try {
      const info = await ytdl.getInfo(youtubeUrl);

      // Get the best audio format
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

      if (audioFormats.length === 0) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'No audio formats available for this video' }),
        };
      }

      // Get the best quality audio format
      const bestAudio = audioFormats.reduce((best, current) => {
        const bestBitrate = best.audioBitrate || 0;
        const currentBitrate = current.audioBitrate || 0;
        return currentBitrate > bestBitrate ? current : best;
      });

      // Download the audio
      const chunks: Buffer[] = [];
      const stream = ytdl(youtubeUrl, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });

      // Collect chunks
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        stream.on('end', () => {
          resolve();
        });

        stream.on('error', (err: Error) => {
          reject(err);
        });
      });

      // Combine chunks into single buffer
      const audioBuffer = Buffer.concat(chunks);
      const audioBase64 = audioBuffer.toString('base64');

      // Determine content type from format
      const mimeType = bestAudio.mimeType || 'audio/webm';
      const contentType = mimeType.split(';')[0];

      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="audio_${videoId}.${bestAudio.container || 'webm'}"`,
        },
        body: audioBase64,
        isBase64Encoded: true,
      };
    } catch (error: any) {
      console.error('Error downloading video:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to extract audio',
          message: error.message || String(error),
        }),
      };
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error processing request',
        message: error.message || String(error),
      }),
    };
  }
};
