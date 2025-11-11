// Next.js API route for YouTube audio extraction (works with pnpm dev)
import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID required' });
    }

    // Find yt-dlp in common locations
    const ytDlpPaths = [
      '/opt/homebrew/bin/yt-dlp',  // Homebrew on Apple Silicon
      '/usr/local/bin/yt-dlp',      // Homebrew on Intel Mac
      'yt-dlp',                     // System PATH
    ];
    
    let ytDlpCmd = null;
    for (const ytPath of ytDlpPaths) {
      if (ytPath === 'yt-dlp' || fs.existsSync(ytPath)) {
        ytDlpCmd = ytPath;
        break;
      }
    }
    
    if (!ytDlpCmd) {
      return res.status(500).json({ 
        error: 'yt-dlp not found',
        message: 'Please install yt-dlp: brew install yt-dlp'
      });
    }

    // Find ffmpeg in common locations (needed for MP3 conversion)
    const ffmpegPaths = [
      '/opt/homebrew/bin/ffmpeg',  // Homebrew on Apple Silicon
      '/usr/local/bin/ffmpeg',      // Homebrew on Intel Mac
      'ffmpeg',                     // System PATH
    ];
    
    let ffmpegCmd = null;
    for (const ffPath of ffmpegPaths) {
      if (ffPath === 'ffmpeg' || fs.existsSync(ffPath)) {
        ffmpegCmd = ffPath;
        break;
      }
    }
    
    // Set PATH to include ffmpeg location if found
    const env = { ...process.env };
    if (ffmpegCmd && ffmpegCmd !== 'ffmpeg') {
      const ffmpegDir = path.dirname(ffmpegCmd);
      env.PATH = `${ffmpegDir}:${env.PATH}`;
    }

    // Clean video ID (remove any extra characters)
    const cleanVideoId = videoId.trim().split('&')[0].split('?')[0];
    
    const youtubeUrl = `https://www.youtube.com/watch?v=${cleanVideoId}`;
    
    // First, extract metadata using yt-dlp --print
    let metadata: { title?: string; uploader?: string; artist?: string } = {};
    try {
      const metadataCommand = `"${ytDlpCmd}" --print "%(title)s|||%(uploader)s|||%(artist)s" --no-download "${youtubeUrl}"`;
      const metadataResult = await execAsync(metadataCommand, { 
        maxBuffer: 1024 * 1024,
        env: env
      });
      const metadataParts = metadataResult.stdout.trim().split('|||');
      if (metadataParts.length >= 2) {
        metadata.title = metadataParts[0] || undefined;
        metadata.uploader = metadataParts[1] || undefined;
        metadata.artist = metadataParts[2] || metadataParts[1] || undefined;
      }
    } catch (metadataError) {
      // If metadata extraction fails, continue without it
      console.warn('Failed to extract metadata:', metadataError);
    }
    
    // Create temporary file for audio with unique timestamp
    const tmpDir = os.tmpdir();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    let audioPath = path.join(tmpDir, `audio_${cleanVideoId}_${timestamp}_${randomId}.mp3`);

    try {
      // Try to extract audio as MP3 first (requires ffmpeg)
      let command = `"${ytDlpCmd}" -x --audio-format mp3 --audio-quality 0 -o "${audioPath}" "${youtubeUrl}"`;
      let stdout = '';
      let stderr = '';
      
      try {
        const result = await execAsync(command, { 
          maxBuffer: 10 * 1024 * 1024,
          env: env
        });
        stdout = result.stdout;
        stderr = result.stderr;
      } catch (mp3Error: any) {
        // If MP3 conversion fails (no ffmpeg), extract best audio format directly
        if (mp3Error.stderr && mp3Error.stderr.includes('ffmpeg') && mp3Error.stderr.includes('not found')) {
          // Extract best audio format without conversion
          const audioPathNoExt = audioPath.replace('.mp3', '');
          command = `"${ytDlpCmd}" -f "bestaudio[ext=m4a]/bestaudio" -o "${audioPathNoExt}.%(ext)s" "${youtubeUrl}"`;
          
          try {
            const result = await execAsync(command, { 
              maxBuffer: 10 * 1024 * 1024,
              env: env
            });
            stdout = result.stdout;
            stderr = result.stderr;
            
            // Find the actual file that was created (most recent one matching our pattern)
            const files = fs.readdirSync(tmpDir)
              .filter(f => f.startsWith(`audio_${cleanVideoId}_`) && f.includes(timestamp.toString()))
              .map(f => ({
                name: f,
                path: path.join(tmpDir, f),
                time: fs.statSync(path.join(tmpDir, f)).mtime.getTime()
              }))
              .sort((a, b) => b.time - a.time);
            
            if (files.length > 0) {
              const actualPath = files[0].path;
              if (fs.existsSync(actualPath)) {
                // Update audioPath to the actual file
                audioPath = actualPath;
              }
            }
          } catch (fallbackError: any) {
            throw fallbackError;
          }
        } else {
          throw mp3Error;
        }
      }

      // Check if file was created
      if (!fs.existsSync(audioPath)) {
        return res.status(500).json({ 
          error: 'Failed to extract audio',
          message: stderr || 'Audio file was not created'
        });
      }

      // Read audio file
      const audioData = fs.readFileSync(audioPath);
      
      // Clean up temporary file
      fs.unlinkSync(audioPath);

      // Verify we got the right file (check file size is reasonable)
      if (audioData.length < 1000) {
        return res.status(500).json({ 
          error: 'Invalid audio file',
          message: 'Downloaded file is too small or corrupted'
        });
      }

      // Return audio with metadata in headers
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="audio_${cleanVideoId}.mp3"`);
      res.setHeader('Content-Length', audioData.length.toString());
      if (metadata.title) {
        res.setHeader('X-Song-Title', encodeURIComponent(metadata.title));
      }
      if (metadata.artist || metadata.uploader) {
        res.setHeader('X-Song-Artist', encodeURIComponent(metadata.artist || metadata.uploader || ''));
      }
      res.send(audioData);

    } catch (execError: any) {
      // Clean up on error
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
      
      return res.status(500).json({ 
        error: 'Failed to extract audio',
        message: execError?.stderr || execError?.message || 'Unknown error'
      });
    }
  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Failed to process YouTube URL',
      message: error?.message || 'Unknown error'
    });
  }
}

