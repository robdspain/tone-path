# YouTube Import Setup Guide

## Quick Setup for Local Development

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Install yt-dlp

**Option A: Using Homebrew (macOS - Recommended)**
```bash
brew install yt-dlp
```

**Option B: Using pip**
```bash
pip3 install yt-dlp
```

### Step 3: Stop current dev server
Press `Ctrl+C` in the terminal running `pnpm dev`

### Step 4: Start with Netlify Dev
```bash
netlify dev
```

This will:
- Start the Next.js app (usually on port 8888)
- Enable Netlify functions (including YouTube audio extraction)
- Allow YouTube import to work locally

## Alternative: Manual File Upload

If you prefer not to set up Netlify Dev, you can:
1. Download audio from YouTube manually (using yt-dlp or online tools)
2. Use a file input component to upload the audio file
3. Process it directly in the browser

## Troubleshooting

- If `netlify dev` fails, make sure Python 3.9+ is installed
- If yt-dlp fails, try updating it: `brew upgrade yt-dlp` or `pip3 install --upgrade yt-dlp`
- Check that the function file exists: `netlify/functions/youtube-audio/index.py`

