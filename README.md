# Tone Path

A browser-based real-time music transcription and visualization app for trumpet, guitar, bass, and ukulele practice.

## Features

- 🎤 Real-time microphone capture with WebAudio API
- 🎵 Pitch detection using autocorrelation (TensorFlow.js models can be integrated)
- 🎸 Chord recognition for guitar/ukulele
- 📊 Real-time visualizations (waveform, frequency spectrum, piano roll, chord chart)
- 🎹 Built-in tuner
- 💾 Recording and export capabilities (JSON, MIDI, MusicXML)
- 📱 PWA-ready for mobile installation
- 🌐 Fully offline capable

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript
- **Styling**: TailwindCSS
- **Audio**: WebAudio API
- **ML**: TensorFlow.js (ready for CREPE model integration)
- **Visualization**: Framer Motion, Canvas API
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Run development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
src/
├── pages/           # Next.js pages
├── components/      # React components
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── types/          # TypeScript definitions
└── styles/         # Global styles

netlify/
└── functions/      # Netlify serverless functions
```

## Usage

1. **Select Instrument**: Choose your instrument (trumpet, guitar, bass, ukulele)
2. **Start Listening**: Click "Start Listening" to begin microphone capture
3. **Record**: Click "Record" to save your session
4. **View Visualizations**: See real-time waveform, piano roll, and chord charts
5. **Export**: Export your session as JSON, MIDI, or MusicXML

## Development Notes

- Pitch detection currently uses autocorrelation algorithm
- TensorFlow.js CREPE model integration is ready but commented out
- Chord detection uses pattern matching (ML model integration pending)
- Netlify functions are set up for MIDI/MusicXML export

## Future Enhancements

- [ ] Integrate CREPE model for improved pitch detection
- [ ] Add ML-based chord recognition
- [ ] Implement Tone.js playback
- [ ] Add VexFlow staff notation
- [ ] PWA service worker for offline support
- [ ] Mobile app wrapper (Capacitor/Ionic)

## License

MIT

