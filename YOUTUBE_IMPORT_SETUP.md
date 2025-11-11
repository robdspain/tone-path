# YouTube Import Setup Instructions

## Current Status
YouTube import functionality requires server-side audio extraction which is not available in local development by default.

## Options for Local Development

### Option 1: Use Netlify Dev (Recommended)
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Install yt-dlp: `pip install yt-dlp` (or `brew install yt-dlp` on macOS)
3. Run: `netlify dev`
4. The Python function will work locally

### Option 2: Use External API Service
For production, consider using a third-party service like:
- YouTube Data API + audio extraction service
- Cloud function with yt-dlp
- External API that handles YouTube audio extraction

### Option 3: Manual Audio Upload
As a workaround, you can:
1. Download audio from YouTube manually
2. Use browser's file input to load audio file
3. Process the audio file directly

## Error Messages
The app will show helpful error messages when YouTube import fails, including setup instructions.

## Production Deployment
For Netlify deployment:
1. Ensure Python runtime is configured
2. Add yt-dlp to requirements.txt or install via build command
3. The Python function (`netlify/functions/youtube-audio/index.py`) will handle extraction


