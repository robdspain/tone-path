// File upload component for MP3/WAV/OGG audio files
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface FileUploadProps {
  onImport: (audioBuffer: AudioBuffer, audioContext: AudioContext, metadata?: { title?: string; artist?: string }) => void;
  onError: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onImport, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|webm)$/i)) {
      onError('Invalid file type. Please upload MP3, WAV, or OGG files.');
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      onError('File too large. Maximum size is 50MB.');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Try to extract metadata from filename (basic parsing)
      let metadata: { title?: string; artist?: string } | undefined = undefined;
      
      // Try to parse "Artist - Title" or "Title" from filename
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const artistTitleMatch = fileNameWithoutExt.match(/^(.+?)\s*-\s*(.+)$/);
      if (artistTitleMatch) {
        metadata = {
          artist: artistTitleMatch[1].trim(),
          title: artistTitleMatch[2].trim(),
        };
      } else {
        // If no "Artist - Title" format, use filename as title
        metadata = {
          title: fileNameWithoutExt,
        };
      }
      
      // Create AudioContext and decode audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      onImport(audioBuffer, audioContext, metadata);
      setFileName(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load audio file';
      onError(errorMsg);
      console.error('File upload error:', error);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-3 sm:p-4"
    >
      <div className="text-xs sm:text-sm text-gray-400 mb-2">Upload Audio File</div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          onClick={handleClick}
          disabled={isLoading}
          className="flex-shrink-0 min-h-[44px] px-6 py-2.5 bg-teal hover:bg-teal-light text-white rounded-lg font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? 'Loading...' : '📁 Choose File'}
        </motion.button>
        {fileName && (
          <span className="flex-1 min-w-0 text-xs sm:text-sm text-gray-400 truncate flex items-center min-h-[44px] px-2">
            {fileName}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Supported: MP3, WAV, OGG, M4A, WebM (max 50MB)
      </p>
    </motion.div>
  );
};

