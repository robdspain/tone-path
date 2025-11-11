# Netlify function to extract audio from YouTube using Python
import json
import subprocess
import tempfile
import os
import base64
import sys
import shutil

def handler(event, context):
    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        video_id = body.get('videoId')
        
        if not video_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Video ID required'})
            }
        
        # Extract YouTube URL
        youtube_url = f'https://www.youtube.com/watch?v={video_id}'
        
        # Create temporary file for audio
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            audio_path = tmp_file.name
        
        try:
            # Try to find yt-dlp in multiple locations
            # 1. Check Python environment's bin directory (where pip installs scripts)
            python_bin_dir = os.path.dirname(sys.executable)
            yt_dlp_paths = [
                os.path.join(python_bin_dir, 'yt-dlp'),  # Python environment
                os.path.join(python_bin_dir, 'yt-dlp.exe'),  # Windows
                '/opt/homebrew/bin/yt-dlp',  # Homebrew on Apple Silicon
                '/usr/local/bin/yt-dlp',     # Homebrew on Intel Mac
                shutil.which('yt-dlp'),      # System PATH (returns None if not found)
                'yt-dlp',                    # Fallback: try direct command
            ]
            
            # Filter out None values
            yt_dlp_paths = [p for p in yt_dlp_paths if p]
            
            yt_dlp_cmd = None
            for path in yt_dlp_paths:
                if path == 'yt-dlp' or os.path.exists(path):
                    # Test if command works
                    try:
                        test_result = subprocess.run(
                            [path, '--version'],
                            capture_output=True,
                            timeout=5,
                            text=True
                        )
                        if test_result.returncode == 0:
                            yt_dlp_cmd = path
                            break
                    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
                        continue
            
            # If yt-dlp binary not found, try using yt-dlp as Python module
            if not yt_dlp_cmd:
                try:
                    import yt_dlp
                    # Use yt-dlp as Python module
                    # Download best audio format directly (no FFmpeg needed)
                    ydl_opts = {
                        'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best[height<=480]',
                        'outtmpl': audio_path.replace('.mp3', '.%(ext)s'),
                        'quiet': True,
                        'no_warnings': True,
                    }
                    
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.download([youtube_url])
                    
                    # Find the actual output file (yt-dlp may add extension)
                    if not os.path.exists(audio_path):
                        # Look for files with similar name
                        base_name = audio_path.replace('.mp3', '')
                        for ext in ['.m4a', '.webm', '.opus', '.mp3', '.mp4']:
                            candidate = base_name + ext
                            if os.path.exists(candidate):
                                audio_path = candidate
                                break
                    
                    if not os.path.exists(audio_path):
                        return {
                            'statusCode': 500,
                            'body': json.dumps({'error': 'Failed to extract audio file'})
                        }
                except ImportError:
                    return {
                        'statusCode': 500,
                        'body': json.dumps({
                            'error': 'yt-dlp not found',
                            'message': 'Please install yt-dlp: pip install yt-dlp or brew install yt-dlp'
                        })
                    }
                except Exception as e:
                    return {
                        'statusCode': 500,
                        'body': json.dumps({
                            'error': 'Failed to extract audio using yt-dlp module',
                            'message': str(e)[:200]
                        })
                    }
            else:
                # Use yt-dlp command-line tool
                result = subprocess.run([
                    yt_dlp_cmd,
                    '-x',  # Extract audio
                    '--audio-format', 'mp3',
                    '--audio-quality', '0',  # Best quality
                    '-o', audio_path,
                    youtube_url
                ], check=True, capture_output=True, text=True, timeout=300)
            
            # Read audio file
            with open(audio_path, 'rb') as f:
                audio_data = f.read()
            
            # Determine content type based on file extension
            ext = os.path.splitext(audio_path)[1].lower()
            content_types = {
                '.mp3': 'audio/mpeg',
                '.m4a': 'audio/mp4',
                '.webm': 'audio/webm',
                '.opus': 'audio/opus',
                '.mp4': 'audio/mp4',
            }
            content_type = content_types.get(ext, 'audio/mpeg')
            
            # Convert to base64 for transmission
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': content_type,
                    'Content-Disposition': f'attachment; filename="audio_{video_id}{ext}"'
                },
                'body': audio_base64,
                'isBase64Encoded': True
            }
        finally:
            # Clean up temporary file(s)
            if os.path.exists(audio_path):
                os.unlink(audio_path)
            # Also clean up any files with different extensions from the same base name
            base_name = os.path.splitext(audio_path)[0]
            for ext in ['.m4a', '.webm', '.opus', '.mp3', '.mp4']:
                candidate = base_name + ext
                if os.path.exists(candidate) and candidate != audio_path:
                    try:
                        os.unlink(candidate)
                    except OSError:
                        pass
                
    except subprocess.CalledProcessError as e:
        error_output = e.stderr if hasattr(e, 'stderr') else str(e)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Failed to extract audio',
                'message': error_output[:200] if error_output else str(e)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Error: {str(e)}'})
        }


