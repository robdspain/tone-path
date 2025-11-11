# YouTube Import - Simple Local Solution

## ✅ Setup Complete!

YouTube import now works with **regular `pnpm dev`** - no Netlify Dev required!

### How It Works

1. **Next.js API Route** (`/api/youtube-audio`) uses `yt-dlp` directly
2. Works with `pnpm dev` - no special setup needed
3. Automatically finds `yt-dlp` installed via Homebrew
4. Falls back to Netlify function in production if available

### Requirements

- ✅ `yt-dlp` installed: `brew install yt-dlp` (already done!)
- ✅ Next.js dev server: `pnpm dev`
- ✅ That's it!

### Usage

1. Start the dev server:
   ```bash
   pnpm dev
   ```

2. Open `http://localhost:3000`

3. Paste a YouTube URL and click "Import"

4. The audio will be extracted and loaded automatically!

### How It Works Technically

- The component calls `/api/youtube-audio` endpoint
- The API route executes `yt-dlp` as a subprocess
- Audio is extracted to a temporary file
- File is read and sent back as binary data
- Browser decodes it into an AudioBuffer for playback

### Troubleshooting

**If import fails:**
- Check that `yt-dlp` is installed: `which yt-dlp`
- Check browser console for errors
- Make sure the dev server is running on port 3000
- Some YouTube videos may be restricted or unavailable

**Error: "yt-dlp not found"**
- Install: `brew install yt-dlp`
- Or: `pip3 install yt-dlp`

### Production

For production deployment on Netlify:
- The Netlify function (`netlify/functions/youtube-audio/index.py`) will be used
- No changes needed - it automatically falls back

