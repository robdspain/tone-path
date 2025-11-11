# Netlify Dev Status

## Current Setup

Netlify Dev is running! Here's what you need to know:

### Access the App

**Option 1: Netlify Dev (with functions)**
- URL: `http://localhost:8888` (if Netlify Dev is proxying)
- OR: `http://localhost:3000` (if Next.js is running directly)
- This enables YouTube import functionality

**Option 2: Regular Next.js Dev**
- URL: `http://localhost:3000`
- Run: `pnpm dev`
- YouTube import will show helpful error messages

### Check Which Port is Active

Run this command to see what's running:
```bash
lsof -ti:8888 -ti:3000
```

### Testing YouTube Import

1. Make sure Netlify Dev is running: `netlify dev`
2. Open the app in your browser (check both ports 8888 and 3000)
3. Try importing a YouTube URL
4. If you get "Failed to fetch", check:
   - Browser console for errors
   - That Netlify Dev is actually running
   - Try accessing: `http://localhost:8888/.netlify/functions/youtube-audio` directly

### Troubleshooting

If port 8888 isn't accessible:
- Netlify Dev might be proxying to port 3000
- Check the terminal output from `netlify dev` to see which port it's using
- The app should work on whichever port Netlify Dev assigns

### Quick Test

Test the function endpoint:
```bash
curl -X POST http://localhost:8888/.netlify/functions/youtube-audio \
  -H "Content-Type: application/json" \
  -d '{"videoId":"test"}'
```

Or try port 3000 if 8888 doesn't work:
```bash
curl -X POST http://localhost:3000/.netlify/functions/youtube-audio \
  -H "Content-Type: application/json" \
  -d '{"videoId":"test"}'
```

