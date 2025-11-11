# Netlify function to extract audio from YouTube using Python
import json
import subprocess
import tempfile
import os
import base64

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
            # Use yt-dlp to extract audio
            # Try to find yt-dlp in common locations
            yt_dlp_paths = [
                '/opt/homebrew/bin/yt-dlp',  # Homebrew on Apple Silicon
                '/usr/local/bin/yt-dlp',     # Homebrew on Intel Mac
                'yt-dlp',                    # System PATH
            ]
            
            yt_dlp_cmd = None
            for path in yt_dlp_paths:
                if os.path.exists(path) or path == 'yt-dlp':
                    yt_dlp_cmd = path
                    break
            
            if not yt_dlp_cmd:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': 'yt-dlp not found. Please install it: brew install yt-dlp'})
                }
            
            # Use yt-dlp to extract audio
            result = subprocess.run([
                yt_dlp_cmd,
                '-x',  # Extract audio
                '--audio-format', 'mp3',
                '--audio-quality', '0',  # Best quality
                '-o', audio_path,
                youtube_url
            ], check=True, capture_output=True, text=True)
            
            # Read audio file
            with open(audio_path, 'rb') as f:
                audio_data = f.read()
            
            # Convert to base64 for transmission
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'audio/mpeg',
                    'Content-Disposition': f'attachment; filename="audio_{video_id}.mp3"'
                },
                'body': audio_base64,
                'isBase64Encoded': True
            }
        finally:
            # Clean up temporary file
            if os.path.exists(audio_path):
                os.unlink(audio_path)
                
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


