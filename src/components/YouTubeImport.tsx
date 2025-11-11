import { useState } from 'react';
import { motion } from 'framer-motion';

interface YouTubeImportProps {
  onImport: (audioBuffer: AudioBuffer, audioContext: AudioContext, metadata?: { title?: string; artist?: string }) => void;
  onError: (error: string) => void;
}

export const YouTubeImport: React.FC<YouTubeImportProps> = ({ onImport, onError }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const extractVideoId = (url: string): string | null => {
    // Clean the URL first
    const cleanUrl = url.trim();
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        // Extract just the video ID (11 characters)
        return match[1].substring(0, 11);
      }
    }
    return null;
  };

  const handleImport = async () => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      onError('Invalid YouTube URL');
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      // Use Next.js API route (works with pnpm dev)
      // Falls back to Netlify function in production if available
      let response: Response;
      
      try {
        // Try Next.js API route first (simpler, works locally)
        response = await fetch('/api/youtube-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        });
        
        // If API route fails, try Netlify function (for production)
        if (!response.ok && response.status !== 500) {
          const netlifyResponse = await fetch('/.netlify/functions/youtube-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId }),
          });
          if (netlifyResponse.ok) {
            response = netlifyResponse;
          }
        }
      } catch (fetchError) {
        // If fetch fails completely, try Netlify function as fallback
        try {
          response = await fetch('/.netlify/functions/youtube-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId }),
          });
        } catch {
          throw fetchError;
        }
      }

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to extract audio from YouTube';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.message) {
            errorMessage += `: ${errorData.message}`;
          }
        } catch {
          // If response isn't JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Failed to extract audio'}`;
        }
        
        // Provide helpful error message
        if (response.status === 501 || response.status === 404) {
          try {
            const errorData = await response.json();
            if (errorData.development) {
              errorMessage = errorData.message || errorMessage;
            } else {
              errorMessage = 'YouTube import requires server-side setup. For local development, please use "netlify dev" instead of "pnpm dev" to enable Netlify functions.';
            }
          } catch {
            if (response.status === 404) {
              errorMessage = 'YouTube import requires Netlify functions. Please run "netlify dev" instead of "pnpm dev" for local development.';
            }
          }
        }
        
        throw new Error(errorMessage);
      }

      setProgress(50);

      // Get audio data - API route returns binary, Netlify function may return base64
      const contentType = response.headers.get('content-type');
      let audioData: ArrayBuffer;
      
      if (contentType?.includes('application/json')) {
        // Handle JSON response with base64 data (Netlify function format)
        const jsonData = await response.json();
        if (jsonData.body && jsonData.isBase64Encoded) {
          const binaryString = atob(jsonData.body);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioData = bytes.buffer;
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        // Direct binary response (Next.js API route)
        audioData = await response.arrayBuffer();
      }

      setProgress(75);

      // Extract metadata from response headers
      const title = response.headers.get('X-Song-Title');
      const artist = response.headers.get('X-Song-Artist');
      const metadata = title || artist ? {
        title: title ? decodeURIComponent(title) : undefined,
        artist: artist ? decodeURIComponent(artist) : undefined,
      } : undefined;

      // Create AudioContext and decode audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      
      setProgress(100);
      onImport(audioBuffer, audioContext, metadata);
      
      setUrl('');
    } catch (error) {
      let errorMsg = 'Failed to import audio';
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        errorMsg = 'Network error: Could not connect to server. Make sure Netlify Dev is running. Try: netlify dev';
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      onError(errorMsg);
      console.error('YouTube import error:', error);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-3 sm:p-4"
    >
      <div className="text-xs sm:text-sm text-gray-400 mb-2">Import from YouTube</div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="YouTube URL or video ID"
          className="flex-1 min-w-0 min-h-[44px] px-4 py-2.5 text-sm sm:text-base bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal"
          disabled={isLoading}
        />
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          onClick={handleImport}
          disabled={isLoading || !url.trim()}
          className="flex-shrink-0 min-h-[44px] px-6 py-2.5 bg-teal hover:bg-teal-light text-white rounded-lg font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? 'Importing...' : 'Import'}
        </motion.button>
      </div>
      {isLoading && (
        <div className="mt-2">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-teal h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Extracting audio from YouTube...
          </p>
        </div>
      )}
    </motion.div>
  );
};

