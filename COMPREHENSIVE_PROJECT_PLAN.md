# Tone Path — Unified Project Plan

This plan consolidates every previous markdown artifact (build summaries, feature plans, design docs, setup guides, enhancement logs, etc.) into a single reference. `AGENTS.md` and `ProjectPRD.md` remain the authoritative sources for agent responsibilities and the unified interface PRD.

---

## 1. Product Snapshot
- **Mission**: Tone Path delivers browser-based real-time transcription, visualization, and practice workflows for trumpet, guitar, bass, ukulele, and auxiliary instruments.
- **Key Capabilities** (from `README.md`, `NEW_FEATURES.md`, `PRACTICE_TOOLS_CHECKLIST.md`):
  - Live microphone capture with WebAudio API, autocorrelation pitch detection, and CREPE-ready ML hooks.
  - Harmony agent supplying chords, scales, and chord progressions to visualizers (fretboard, piano, trumpet fingerings, VexFlow staff).
  - Visual suite: waveform, spectrum, piano roll, chord charts, chord dictionary, tuner, metronome, loop/transport controls, Jam AI backing tracks, and practice analytics (Feedback HUD, Progress Chart).
  - Recording, looping, and export flows (JSON, MIDI, MusicXML) backed by Tone.js playback + Jam AI, with PWA/offline support and Netlify serverless imports/exports.
- **Tech Stack**: Next.js 14 + TypeScript, TailwindCSS, Framer Motion/Canvas for visuals, WebAudio API, optional TensorFlow.js CREPE, Tone.js playback, Netlify deployment (functions for exports/imports).
- **Usage Basics**:
  1. Install dependencies (`pnpm install`), run `pnpm dev`, open `http://localhost:3000`.
  2. Select an instrument, click “Start Listening,” optionally record, view visualizations, trigger Jam AI/backing tracks, and export artifacts.
  3. Project structure: `src/pages`, `components`, `hooks`, `utils`, `types`, `styles`, and `netlify/functions`.

---

## 2. Build History & Current Status
- **Initial Prototype (from `BUILD_SUMMARY.md`)**:
  - Completed Next.js setup, Tailwind theme, directory scaffolding, type definitions for transcription data, hooks for audio stream/pitch detection/chord detection/recording, UI components (AudioVisualizer, PianoRoll, ChordChart, Tuner, Controls), audio utilities, smoothing, MIDI/MusicXML conversion stubs, Netlify functions, and PWA manifest.
  - Open enhancements identified: TensorFlow CREPE integration, improved chord detection, Tone.js playback, export completion, PWA/service worker, mobile optimization.
- **Feature Delivery (from `FEATURE_IMPLEMENTATION_PLAN.md` & `FEATURE_IMPLEMENTATION_SUMMARY.md`)**:
  - ✅ Feasible focus items shipped: File Upload component, Auto chord recognition for imported audio, Smart Jam AI upgrade foundation, Learning Mode (fretboard/piano displays, accuracy feedback, exercises, tracking).
  - ❌ De-prioritized: Apple Music integration (no web API/DRM), Spotify audio analysis (no raw streams). These remain off roadmap per `STREAMING_INTEGRATION_ASSESSMENT.md`.
  - **Phase progression**:
    - Phase 1 (Core): File upload, auto chord recognition, ChordStreamDisplay, enhanced LoopController.
    - Phase 2 (AI/Learning): Smart Jam (Magenta-ready), FretboardVisualizer, FeedbackHUD, Learning Mode hook.
    - Phase 3 (Polish): Progress tracking, advanced loop features, export improvements.
  - **Supporting libraries/hooks** now live: `src/lib/audio/analysis.ts`, `src/lib/ai/magenta.ts`, `src/lib/learning/metrics.ts`, `useChordRecognition`, `useJamAI`, `useLearningMode`.
- **Current Status Dashboard (from `README.md`)**:
  - Completed: Collapsible tools workspace, upgraded piano chord display, VexFlow staff notation, Fretastic-inspired explorer, integrated chord dictionary, Jam/Play-Along workflow upgrades.
  - In progress: CREPE model hosting, Harmony Agent chord extensions (minor9/altered), Playback feel presets (swing/double-time), Import Concierge server provisioning (yt-dlp), Jam Companion Magenta integration and AI patterns.

---

## 3. Design System & Visual Direction
- **Visual Refresh (from `DESIGN_SYSTEM.md` & `NEW_FEATURES.md`)**:
  - Glassmorphism cards (`glass-card`), backdrop blur, gradient text/buttons, glow shadows, particle background, responsive spacing (gap-6) with rounded-xl (12px).
  - Palette: Primary Blue `#0066ff`, Electric Purple `#8f00ff`, Neon Cyan `#00e6e6`, semantic Success `#00ff88`, Warning `#ffaa00`, Error `#ff3366`, layered dark surfaces `#0a0e1a`→`#1f2937`.
  - Gradients: `gradient-primary`, `gradient-accent`, `gradient-mesh`; ambient radial glows anchored to screen corners.
  - Typography: gradient hero text (`h1.gradient-text`), icon-infused headers (`🎸 Section Title`), consistent iconography across instruments, transport, learning, loops, etc.
  - Components: Mobile nav bar (“Practice / Library / Tools / Settings”), floating theme toggle (sun/moon), particle background, Framer Motion hover/tap interactions (`whileHover { scale: 1.05 }`).
  - Animations: fade-in, slide-up/down, glow, pulse; interactive buttons scale with spring physics.
  - Layout primitives: max width 1600px, responsive padding (`p-4 md:p-6 lg:p-8`), grid conversions (single column mobile, 2-column tablet, 3-column desktop).
  - Touch targets ≥44px (preferred 48px), custom scrollbars, modal/backdrop conventions, gradient sliders, accent checkboxes.
  - Future design tasks: more gradient variations, theme customization, extra micro-interactions, sound effects.

---

## 4. Interface Organization & Practice Flow
- **Structure (from `INTERFACE_ORGANIZATION.md` & `ProjectPRD.md`)**:
  - Header/global practice bar: instrument selector, status pills (Listening/Recording/Smart Jam/Import), preset manager, theme toggle, overflow menu.
  - Utility rail modules (desktop left rail, tablet/tab strip, mobile bottom sheet): Session stack (Song Library, FileUpload, YouTubeImport), Practice tools (Tuner, Metronome, Loop Controller, Jam AI controls), Learning insights (Feedback HUD, Progress Chart, targets/presets).
  - Primary canvas supports three modes:
    1. **Live View** – Audio visualizer, live note display, chord chart overlay.
    2. **Timeline View** – Piano roll, chord stream, fretboard visualizer, loop controller.
    3. **Jam View** – Jam AI panel, backing pattern timeline, meters from `usePlaybackVisualizer`.
    - Each mode remains active; mini-previews surface inactive modules for quick switches.
  - Transport & actions dock (sticky bottom): Listen/Stop, Record, Play/Pause, Export (MIDI/MusicXML/JSON), Save plus secondary controls (tempo slider, swing presets, loop in/out, CREPE toggle, latency/sensitivity knobs). Mobile uses two rows of icon buttons with thumb spacing; record button remains central and red.
  - Progressive disclosure tiers:
    - Tier 1 (always visible): Instrument select, main visualization, listening/recording controls.
    - Tier 2 (easy access): Practice tools, imports, song library, preset manager.
    - Tier 3 (hidden): Advanced settings, detailed learning insights, presets editing.

---

## 5. Practice Tools, Jam, and Learning Systems
- **Metronome & Tuner (from `PRACTICE_TOOLS_CHECKLIST.md`)**:
  - Metronome: visual beat indicators, BPM slider (30–300), quick BPM buttons, time signatures (2/4, 3/4, 4/4, 6/4), volume control, strong/weak beat audio, playback tempo sync.
  - Tuner: real-time pitch detection, tuning meter, frequency + confidence readouts, in-tune cues.
- **Looper**: drag handles to set loop region, toggle loop, tempo control (0.25x–2x) plus quick ratios (0.5x–1.5x), time display, integration with imported audio; chords clickable for seek.
- **Backing Tracks (JamAIControls)**: genre presets (Rock, Blues, Funk, Jazz, Pop, Lo-Fi), auto-detected key/tempo, drum/bass generation, adjustable length (2–16 bars), ready-state feedback.
- **Learning Mode**: FretboardVisualizer, FeedbackHUD, ProgressChart, `useLearningMode` metrics with accuracy feedback and practice exercises (foundation ready for difficulty levels/persistence).
- **Workflow Organization**: Audio import → Looper controls (when applicable) → Live chord display → Practice tools → Backing tracks → Learning metrics → Visualization layers → Song library/presets.

---

## 6. Feature Delivery & Enhancements
- **Core & Library Deliverables (from `FEATURE_IMPLEMENTATION_SUMMARY.md`)**:
  - Types: `src/types/chords.ts`, `jam.ts`, `learning.ts`.
  - Libraries: `audio/analysis.ts` (chromagram + chord classification), `ai/magenta.ts` (pattern fallback + scaffolding), `learning/metrics.ts`.
  - Hooks: `useChordRecognition`, `useJamAI`, `useLearningMode`, `usePlayback`, `usePitchDetection` (CREPE-ready), `useChordDetection`.
  - UI: `FileUpload`, `ChordStreamDisplay`, `LoopController`, `JamAIControls`, `FretboardVisualizer`, `FeedbackHUD`, `ProgressChart`, `ThemeToggle`, `MobileNav`, `ParticleBackground`.
  - Integration next steps: embed these components into the new `PracticeShell` layout, wiring mode states and context.
- **Enhancement Highlights (from `ENHANCEMENTS.md`)**:
  1. **YouTube URL Import** – `YouTubeImport.tsx` + Netlify function (`youtube-audio/index.ts`, `index.py`), progress + error handling, audio buffer handoff. Requires yt-dlp in Netlify runtime.
  2. **TensorFlow.js CREPE Integration** – toggled in `usePitchDetection.ts`, automatic model load with resampling normalization, fallback to autocorrelation, configurable via `NEXT_PUBLIC_CREPE_MODEL_URL`.
  3. **Tone.js Playback** – `usePlayback.ts` for transport control, tempo sync, note scheduling, real-time cursor, polyphonic support.
  4. **Enhanced Chord Detection** – expanded dictionary (~30 shapes), confidence scoring, time-window detection, duplicate filtering.
  5. **MIDI Export** – `convertToMIDI.ts` using `midi-writer-js` for proper tempo, velocity, chords, durations, binary download.
  6. **MusicXML Export** – `convertToMusicXML.ts` with 3.1 spec (measures, tempo, chord notation) and direct download.
  7. **PWA Service Worker** – `next-pwa` config, `serviceWorker.ts`, offline caching (assets/audio/API), manifest integration.
- **Backlog Enhancements**: host CREPE weights, provision yt-dlp for Netlify, integrate advanced chord ML, VexFlow staff expansions, Magenta.js full integration, MusicXML articulations/dynamics + batch export bundles, Jam Companion style controls, Learning exercises persistence.

---

## 7. External Audio & Streaming Feasibility
- **Feasible Inputs (from `FEATURE_IMPLEMENTATION_PLAN.md`, `STREAMING_INTEGRATION_ASSESSMENT.md`)**:
  - YouTube (yt-dlp extraction) ✅
  - File Uploads (MP3/WAV/OGG) ✅
  - Microphone (WebAudio) ✅
- **Non-feasible**:
  - Apple Music ❌ – No accessible web API; DRM prevents browser audio extraction.
  - Spotify ❌ for analysis – Web Playback SDK requires Premium + OAuth and provides control only; no raw audio for chord detection. Could support visualization sync later but not analysis.
- **Roadmap Emphasis**: Focus on audio sources above, expand to optional streaming sync only after core UX is complete.

---

## 8. Jam Companion & Agent Alignment
- **Jam Companion Agent** (foundation per `AGENTS.md`, referenced here) uses `useJamAI` and `src/lib/ai/magenta.ts` with pattern fallback. Next steps: install `@magenta/music`, finalize `generateWithMagenta`, subscribe to chord changes in real time, expose style/intensity controls, manage bundle size via code splitting.
- **Other agents**: Transcription (pitch detection + CREPE hosting), Harmony (chord dictionary expansion + confidence surfacing), Playback (Tone.js swing/feel presets, setting persistence), Export (MusicXML articulations + batch export), Import Concierge (yt-dlp provisioning). Each agent stays in sync with this master plan while `AGENTS.md` continues to hold detailed scope.

---

## 9. Unified Interface Implementation Plan
1. **Design Sprint** – produce high-fidelity mockups for ≥1200px desktop, 768–1199px tablet, ≤767px mobile states, mapping global bar/utility rail/canvas/transport.
2. **PracticeShell Component (Sprint 1)** – build layout scaffolding with CSS grid/flex, implement `usePracticeLayout` store for mode/responsive state, wire global practice bar states, ensure progressive disclosure.
3. **Utility Rail Modules (Sprint 1–2)** – integrate session stack (SongLibrary/FileUpload/YouTubeImport), practice tools (Tuner/Metronome/LoopController/Jam AI controls), learning insights (FeedbackHUD/ProgressChart/targets) with collapsible behavior.
4. **Primary Canvas Modes (Sprint 2)** – implement Live, Timeline, Jam views with mini-previews and state continuity.
5. **Transport Dock (Sprint 2)** – finalize Listen/Stop, Record, Play/Pause, Export, Save plus secondary control row (tempo, swing, loop, CREPE, latency knobs).
6. **Responsive & Accessibility QA** – validate breakpoints, keyboard navigation, aria labels, high-contrast states, maintain latency (<1 animation frame impact).

---

## 10. Setup, Tooling, and Import Infrastructure
- **Local Development (from `README.md`, `NETLIFY_DEV_STATUS.md`)**:
  - Prereqs: Node 18+, pnpm (recommended), Netlify CLI for function emulation, `yt-dlp` installed (brew/pip).
  - Commands: `pnpm install`, `pnpm dev` (port 3000), optionally `netlify dev` (port 8888 proxies Next.js, enables Netlify functions). Use `lsof -ti:8888 -ti:3000` to inspect running processes.
  - Testing Netlify functions: `curl -X POST http://localhost:8888/.netlify/functions/youtube-audio -H "Content-Type: application/json" -d '{"videoId":"test"}'` (swap port 3000 if proxied).
- **YouTube Import Setup (from `SETUP_YOUTUBE_IMPORT.md`, `YOUTUBE_IMPORT_SETUP.md`, `YOUTUBE_IMPORT_SIMPLE.md`)**:
  - Local workflow: install Netlify CLI + yt-dlp, stop `pnpm dev`, run `netlify dev`. Alternatively, manual audio upload (download via yt-dlp, use file input).
  - Simplified path: `/api/youtube-audio` Next.js API route now executes `yt-dlp` directly during `pnpm dev` (requires `yt-dlp` visible via `which yt-dlp`). Flow: endpoint spawns subprocess, extracts audio to temp file, returns binary, browser decodes to `AudioBuffer`. Falls back to Netlify function in production automatically.
  - Troubleshooting: ensure `yt-dlp` installed/up to date (`brew install/upgrade yt-dlp` or `pip3 install --upgrade yt-dlp`), confirm dev server port, note restricted videos may fail.
  - Production deployment: configure Netlify Python runtime, include yt-dlp via requirements/build, ensure `netlify/functions/youtube-audio/index.py` is packaged. Alternative is external API or Dockerized function image.
- **Streaming alternatives**: manual upload fallback, eventual external API for audio extraction if Netlify environment restricts yt-dlp.

---

## 11. Deployment & Offline Readiness
- **PWA**: `next-pwa` integration registers service worker (via `serviceWorker.ts`, auto registration in `_app.tsx`), caches assets/audio/API responses, uses `public/manifest.json`. Works automatically in production builds (`pnpm build && pnpm start`).
- **Netlify**: `netlify.toml` config, serverless functions for MIDI, MusicXML, youtube-audio, healthcheck. Deployment needs Python runtime for yt-dlp, optionally docker/bin packaging.
- **Monitoring**: ensure service worker not registered during dev; verify offline caches, test PWA install on mobile.

---

## 12. Risks, Dependencies, and Metrics
- **Dependencies**:
  - yt-dlp availability in Netlify runtime (critical for Import Concierge).
  - Hosted CREPE model weights (`/public/models/crepe/*` or CDN via `NEXT_PUBLIC_CREPE_MODEL_URL`).
  - Bundle size/time-to-interactive when adding Magenta.js or ML assets (requires code splitting, lazy loading).
  - Deterministic timing for Jam Companion on low-end devices.
- **Metrics (from `ProjectPRD.md`)**:
  - ≤15 seconds to first recording on mobile.
  - ≥80% “easy to find things” satisfaction post-launch.
  - Zero feature regressions compared to legacy UI after two-week dogfood window.
  - Live transcription rendering maintains <5% FPS dip (single animation frame budgets).

---

## 13. Next Actions Checklist
1. Finish `PracticeShell` mockups + implementation per unified interface plan.
2. Integrate delivered components (FileUpload, ChordStreamDisplay, JamAIControls, FretboardVisualizer, FeedbackHUD, ProgressChart) into the new shell, ensuring state continuity.
3. Host CREPE model + update env var; expose toggle in Transport secondary row.
4. Provision yt-dlp for Netlify builds (layer/prebuilt binary) and document quotas/licenses.
5. Implement MusicXML articulations/dynamics, plus batch export bundling MIDI + MusicXML + JSON.
6. Add Jam Companion Magenta integration with style/intensity UI and chord-change subscription.
7. Expand Harmony Agent chord templates (minor 9, altered dominants, quartal voicings) and surface confidence to UI.
8. Add device calibration presets for brass/guitar to reduce octave jumps.
9. Validate Netlify Dev + Next.js API dual-path for YouTube import; add automated smoke test.
10. Extend Learning Mode with structured exercises, difficulty levels, and persistence (localStorage).

This document now supersedes all previously scattered `.md` guides except `AGENTS.md` and `ProjectPRD.md`. All future updates should be reflected here.

---

## 14. Expo/React Native Conversion Plan — SIMPLIFIED ROADMAP

### Overview
**Simplified, lean, execution-ready approach using Expo Bare (Ejected) workflow.**

**Key Decisions:**
- ✅ Expo Bare/Ejected (prebuild) for native module access
- ✅ Minimal native code: Swift/Kotlin audio input modules only
- ✅ **NO C++ DSP** - Keep pitch/chord detection in JavaScript
- ✅ Optional TFLite ML later (not required for v1.0)
- ✅ **Target: 8-11 weeks** (vs 14-19 weeks in full rewrite)

**Philosophy:** Ship fast with great performance using proven JS algorithms. Add ML optimization in v1.1+.

### PHASE 0 — Project Setup (Week 1)

#### 0.1 Expo Bare Bootstrapping

- ⬜ `npx create-expo-app tone-path-mobile --template`
- ⬜ `expo prebuild` to generate iOS + Android native folders
  - This "ejects" to bare workflow, giving access to native code
- ⬜ Set up EAS build profiles (dev/preview/prod)
  - Configure `eas.json` for cloud builds
- ⬜ Add TypeScript config, ESLint, Prettier
- ⬜ Initialize git repository (separate from web app)

#### 0.2 Essential Dependencies (Minimal Set)

**Core:**
- ⬜ `expo-av` (microphone + audio playback)
- ⬜ `expo-file-system` (save recordings, exports)
- ⬜ `expo-document-picker` (file import)
- ⬜ `expo-haptics` (tuner feedback)
- ⬜ `expo-sharing` (share exported files)

**UI & Animation:**
- ⬜ `react-native-reanimated` (60 FPS animations)
- ⬜ `react-native-gesture-handler` (swipe, pan gestures)
- ⬜ `react-native-svg` OR `@shopify/react-native-skia` (visualizations)
  - **Recommended: Skia** for better performance

**State & Data:**
- ⬜ `zustand` (lightweight global state)
- ⬜ `@react-native-async-storage/async-storage` (song library, settings)

**Charts (Optional):**
- ⬜ `victory-native` (simple practice stats charts)

**NO heavy dependencies:**
- ❌ No TensorFlow.js (too slow)
- ❌ No Tone.js (web-only)
- ❌ No react-piano, svguitar, vexflow (web-only)

#### 0.3 Folder Structure

```
tone-path-mobile/
├── src/
│   ├── components/
│   │   ├── ui/              # Button, Card, Modal primitives
│   │   ├── practice/        # Tuner, Metronome, LiveNoteDisplay
│   │   ├── visualizers/     # Fretboard, Piano, Trumpet
│   │   └── transport/       # Controls, LoopController
│   ├── hooks/
│   │   ├── useAudioInput.ts
│   │   ├── usePitchDetection.ts
│   │   ├── useChordDetection.ts
│   │   └── usePlayback.ts
│   ├── screens/
│   │   ├── Practice.tsx
│   │   ├── Library.tsx
│   │   ├── Tools.tsx
│   │   └── Settings.tsx
│   ├── state/
│   │   └── store.ts         # Zustand store
│   ├── utils/
│   │   ├── audio/           # Pure JS audio algorithms
│   │   ├── chordFingerings.ts ✅
│   │   ├── trumpetFingerings.ts ✅
│   │   ├── smoothing.ts ✅
│   │   └── exportMIDI.ts ✅
│   ├── audio/
│   │   ├── js/
│   │   │   ├── pitchDetection.ts
│   │   │   └── chromagram.ts
│   │   └── native/
│   │       ├── ios/
│   │       │   └── AudioInputModule.swift
│   │       └── android/
│   │           └── AudioInputModule.kt
│   ├── theme/
│   │   ├── colors.ts
│   │   └── typography.ts
│   └── types/               # ✅ Port from web
│       └── transcription.ts
├── ios/                     # Generated by expo prebuild
├── android/                 # Generated by expo prebuild
├── app.json
└── eas.json
```

#### 0.4 Port Pure JS Utilities

**These work as-is, no changes needed:**
- ✅ `src/utils/chordFingerings.ts` - Direct copy
- ✅ `src/utils/trumpetFingerings.ts` - Direct copy
- ✅ `src/utils/smoothing.ts` - Direct copy
- ✅ `src/types/*.ts` - All type definitions
- 🔄 `src/utils/bpmDetection.ts` - May need minor audio API adjustments
- ✅ `src/utils/convertToMIDI.ts` - Works with `midi-writer-js` (pure JS)

---

### PHASE 1 — Native Audio Input (Week 2)

**Goal:** Get microphone PCM data flowing into JavaScript reliably with low latency.

**Why native module?** `expo-av` Recording API doesn't provide real-time PCM frame access needed for pitch detection. We need a thin native bridge.

#### 1.1 Build Native Audio Input Module

**iOS Implementation (Swift + AVAudioEngine):**

File: `ios/AudioInputModule.swift`

- ⬜ Set up `AVAudioEngine` with input node
- ⬜ Configure audio format: 44.1kHz or 48kHz, mono, Float32
- ⬜ Install tap on input node with 512–1024 sample buffer size
  - Lower = lower latency, higher CPU
  - 512 samples @ 48kHz = ~10ms latency
- ⬜ Convert `AVAudioPCMBuffer` to `Float32Array`
- ⬜ Send PCM frames to JavaScript via `RCTEventEmitter`
  - Event name: `onAudioFrame`
  - Payload: `{samples: Float32Array, sampleRate: number}`
- ⬜ Handle audio session interruptions (phone calls, Siri)
- ⬜ Request microphone permissions

**Android Implementation (Kotlin + AudioRecord):**

File: `android/AudioInputModule.kt`

- ⬜ Set up `AudioRecord` with low-latency mode
  - `AudioFormat.ENCODING_PCM_FLOAT`
  - 44100Hz or 48000Hz sample rate
  - 512–1024 frame buffer
- ⬜ Read audio in background thread
- ⬜ Convert to float array
- ⬜ Emit PCM frames to JS via `ReactContext.getJSModule()`
  - Event: `onAudioFrame`
- ⬜ Handle audio focus (phone calls, notifications)
- ⬜ Request `RECORD_AUDIO` permission

**Bridge Interface:**

```typescript
// src/audio/native/AudioInputModule.ts
import { NativeEventEmitter, NativeModules } from 'react-native';

const { AudioInputModule } = NativeModules;
const audioInputEmitter = new NativeEventEmitter(AudioInputModule);

export const startAudioInput = () => AudioInputModule.start();
export const stopAudioInput = () => AudioInputModule.stop();
export const audioInputEvents = audioInputEmitter;
```

#### 1.2 JavaScript Hook: `useAudioInput()`

File: `src/hooks/useAudioInput.ts`

- ⬜ Subscribe to `onAudioFrame` events
- ⬜ Debounce to ~20–40ms hops (don't process every single frame)
- ⬜ Normalize PCM values (ensure -1.0 to 1.0 range)
- ⬜ Expose: `{ isListening: boolean, start(), stop() }`
- ⬜ Pass PCM frames to pitch detection hook
- ⬜ Handle cleanup on unmount

**Sample usage:**
```typescript
const { isListening, start, stop } = useAudioInput((pcmFrame) => {
  // pcmFrame is Float32Array of audio samples
  detectPitch(pcmFrame);
});
```

**Performance Targets:**
- Audio callback latency: <20ms
- CPU usage: <10% on iPhone 12 / Pixel 5

### PHASE 2 — Core Audio Processing (Weeks 3–4)

**Goal:** Pitch and chord detection pipeline running entirely in **JavaScript**.

**Why JavaScript?** The autocorrelation algorithm from the web version already works well. Porting to native C++ adds complexity without major performance gains for this use case.

#### 2.1 Pitch Detection (JavaScript Autocorrelation)

File: `src/audio/js/pitchDetection.ts`

**Port from web version:**
- ✅ Autocorrelation algorithm already exists (`src/hooks/usePitchDetection.ts:44-69`)
- ⬜ Extract pure function: `detectPitch(buffer: Float32Array, sampleRate: number): number | null`
- ⬜ Frequency → note name conversion
  - ✅ Logic exists (`usePitchDetection.ts:21-41`)
  - Use existing `NOTE_FREQUENCIES` table
- ⬜ Cents offset calculation
  - Formula: `cents = 1200 * log2(frequency / closestFreq)`
- ⬜ Confidence calculation
  - Based on autocorrelation peak strength
  - Threshold: >0.3 for valid detection
- ⬜ Smoothing filter
  - ✅ Utility exists: `src/utils/smoothing.ts`
  - Apply median or moving average filter
- ⬜ Output: `{note: string, frequency: number, cents: number, confidence: number}`

**Hook: `usePitchDetection()`**

- ⬜ Receives PCM frames from `useAudioInput`
- ⬜ Calls `detectPitch()` on each frame
- ⬜ Applies smoothing
- ⬜ Debounces rapid note changes
- ⬜ Exposes: `currentNote`, `frequency`, `cents`, `confidence`

**Performance:**
- Target: <5ms per frame (512 samples)
- JavaScript is fast enough for autocorrelation at this scale

#### 2.2 Optional: TFLite CREPE (Native ML)

**Skip this for v1.0. Add in v1.1 if autocorrelation isn't accurate enough.**

If you decide to add it later:

- ⬜ Convert CREPE model to `.tflite` (TensorFlow Lite Converter)
- ⬜ Load model on iOS (CoreML wrapper) and Android (TFLite Interpreter)
- ⬜ Feed PCM frames to ML inference
- ⬜ Return frequency confidence array
- ⬜ Blend ML confidence with autocorrelation fallback
- ⬜ Add UI toggle: "Use ML Pitch Detection"

**Complexity:** Medium-High
**Performance gain:** ~10-15% accuracy improvement
**Decision:** Ship v1.0 without it, validate demand first

#### 2.3 Chromagram + Chord Detection (JavaScript)

File: `src/audio/js/chromagram.ts`

**Port from web version:**
- ✅ Chromagram algorithm exists: `src/lib/audio/analysis.ts`
- ⬜ Extract pure function: `computeChromagram(buffer: Float32Array, sampleRate: number): number[]`
  - Returns 12-bin pitch class histogram (C, C#, D, ... B)
- ⬜ FFT implementation (use existing or lightweight library like `fft.js`)
- ⬜ Map FFT bins to pitch classes

**Chord Detection:**

File: `src/hooks/useChordDetection.ts`

- ✅ Chord dictionary already exists (~30 chord shapes)
- ⬜ Port chord dictionary from `src/hooks/useChordDetection.ts`
- ⬜ Expand basic chord types:
  - Major, minor, dom7, minor7, maj7
  - Optional: sus2, sus4, dim, aug
- ⬜ Time-window detection (aggregate over 500ms–1s)
- ⬜ Confidence scoring (how well chromagram matches template)
- ⬜ Duplicate filtering (don't emit same chord twice in a row)
- ⬜ Output: `[{timestamp, chord, confidence}]`

**Performance:**
- Target: <10ms per frame for chromagram + chord matching
- Run on separate frame from pitch detection (stagger processing)

---

### PHASE 4 — Essential Practice Tools (Weeks 6–7)

**Goal:** Core practice tools are functional and polished.

#### 4.1 Tuner

File: `src/components/practice/Tuner.tsx`

**Web version**: ✅ `src/components/Tuner.tsx` + `src/components/SimpleTuner.tsx`

**UI Components:**

- ⬜ Needle meter visualization
  - Use `react-native-svg` or `@shopify/react-native-skia`
  - Animated arc showing tuning range (-50 to +50 cents)
  - Rotating needle with spring physics (Reanimated)
- ⬜ Color-coded feedback zones:
  - **Green**: ±10 cents (in tune)
  - **Yellow**: ±10-30 cents (close)
  - **Red**: >30 cents (out of tune)
- ⬜ Large center display
  - Note name (e.g., "A4")
  - Cents offset (e.g., "+12¢")
  - Frequency (e.g., "442.5 Hz")
- ⬜ Confidence indicator (circular progress or bar)
- ⬜ Tie into `usePitchDetection()` hook
- ⬜ Haptic feedback when crossing into "in tune" zone
  - Use `expo-haptics.impactAsync(ImpactFeedbackStyle.Light)`
- ⬜ Settings:
  - Sensitivity slider
  - A4 tuning reference (440Hz, 442Hz, 443Hz picker)

**Performance:**
- Smooth 60 FPS needle animation (use Reanimated worklets)

#### 4.2 Live Note Display

File: `src/components/practice/LiveNoteDisplay.tsx`

**Web version**: ✅ `src/components/LiveNoteDisplay.tsx`

- ⬜ Large active note name (centered, bold, e.g., "C#5")
- ⬜ Octave display (subscript or separate)
- ⬜ Confidence indicator
  - Circular progress ring around note
  - Or horizontal bar below
- ⬜ Smooth transitions with Reanimated
  - Fade out old note, fade in new note
  - Scale animation on note change
- ⬜ Color-coded by pitch stability
  - Stable (high confidence): green/cyan
  - Unstable: yellow/orange
- ⬜ Optional: Pitch history bar
  - Last 10 notes scrolling horizontally
  - Mini note labels
- ⬜ Optional: Frequency display toggle
  - Show/hide Hz readout

#### 4.3 Metronome

File: `src/components/practice/Metronome.tsx`

**Web version**: ✅ `src/components/Metronome.tsx` + `src/components/TraditionalMetronome.tsx`

- ⬜ BPM slider (30–300 BPM)
  - ✅ Logic exists in web version
  - Large touch target for mobile
- ⬜ Tap tempo button
  - ✅ Algorithm exists
  - Calculate BPM from tap intervals
  - Large circular button
- ⬜ Beat pulse animation
  - Scale/opacity animation on each beat (Reanimated)
  - Visual indicator (dot or circle)
- ⬜ Beat sounds using `expo-av` Sound
  - Load click samples (strong beat, weak beat)
  - Play on interval using `setInterval()` or better: audio-accurate scheduler
- ⬜ Time signatures
  - ✅ Logic exists: 2/4, 3/4, 4/4, 6/4
  - Picker/selector UI
- ⬜ Visual beat indicators
  - Row of dots (4 dots for 4/4, first dot emphasized)
- ⬜ Optional: Haptic feedback on each beat
  - Stronger haptic on downbeat

**Performance:**
- Timing accuracy: ±5ms (use precise interval scheduling)

#### 4.4 Simple Transport Controls

File: `src/components/transport/Controls.tsx`

**Web version**: ✅ `src/components/Controls.tsx`

- 🔄 Listen button (start/stop microphone)
  - Large circular button
  - Visual indicator when listening (pulsing animation)
- 🔄 Record button
  - Red circle
  - Recording indicator (red dot pulsing)
- 🔄 Play / Pause
  - Toggle state
  - Icon change
- 🔄 Stop button
- 🔄 Loop toggle
  - On/off switch
- ⬜ Add haptics on button press
  - `expo-haptics.impactAsync(ImpactFeedbackStyle.Medium)`
- ⬜ Implement Reanimated scale animations for active states
- ⬜ Status pills (Listening / Recording / Playing)
  - Small colored badges

**Layout:**
- Bottom-sticky bar (iOS safe area aware)
- Large touch targets (≥44pt)

#### 2.2 Core Component Migration Priority

**Tier 1 - Critical Path Components** (Week 1-2):
1. **Controls.tsx** → `Controls.native.tsx`
   - Transport buttons (Listen, Record, Play, Stop)
   - Use `<Pressable>` with haptic feedback (`expo-haptics`)
   - Implement recording indicator animations with Reanimated
2. **LiveNoteDisplay.tsx** → `LiveNoteDisplay.native.tsx`
   - Real-time note visualization
   - Use React Native Reanimated for smooth transitions
3. **Tuner.tsx** / **SimpleTuner.tsx** → `Tuner.native.tsx`
   - Pitch meter visualization with `react-native-svg` or Skia
   - Frequency/cents display
4. **Metronome.tsx** / **TraditionalMetronome.tsx** → `Metronome.native.tsx`
   - Beat visualization
   - Use `expo-av` Sound for metronome clicks
   - Consider haptic feedback for beats

**Tier 2 - Visualization Components** (Week 2-3):
5. **FretboardVisualizer.tsx** → `FretboardVisualizer.native.tsx`
   - **Challenge**: Replace `svguitar` library (web-only)
   - **Solution**: Rebuild using `react-native-svg` with custom SVG path rendering
   - Or use `@shopify/react-native-skia` for high-performance canvas rendering
6. **PianoChordDisplay.tsx** → `PianoChordDisplay.native.tsx`
   - **Challenge**: Replace `react-piano` library (web-only)
   - **Solution**: Build custom piano keyboard with `<View>` components and touch handlers
   - Use SVG for key rendering or absolute positioned Views
7. **TrumpetNoteDisplay.tsx** → `TrumpetNoteDisplay.native.tsx`
   - Valve state visualization (simpler, primarily View/Text components)
8. **AudioVisualizer.tsx** → `AudioVisualizer.native.tsx`
   - **Challenge**: Replace Canvas API
   - **Solution**: Use `react-native-svg` for waveform/spectrum or Skia for performance
   - Implement `d3-shape` for path generation (compatible with React Native)
9. **ChordChart.tsx** → `ChordChart.native.tsx`
   - Chord progression display
   - Use FlatList for scrollable chord timeline

**Tier 3 - Feature Components** (Week 3-4):
10. **LoopController.tsx** → `LoopController.native.tsx`
    - Loop region selection with draggable handles
    - Use `react-native-gesture-handler` PanGestureHandler
    - Timeline scrubbing with haptic feedback
11. **PianoRoll.tsx** → `PianoRoll.native.tsx`
    - **Challenge**: Canvas-based note grid
    - **Solution**: Use `react-native-svg` or Skia for note rectangles
    - Implement virtualized rendering for long recordings
12. **FileUpload.tsx** → `FileUpload.native.tsx`
    - Replace with `expo-document-picker` for audio file selection
    - Support iOS Files app and Android file picker
13. **ChordDictionary.tsx** → `ChordDictionary.native.tsx`
    - Searchable chord library with FlatList
14. **CircleOfFifths.tsx** → `CircleOfFifths.native.tsx`
    - Interactive circle using `react-native-svg` or Skia
15. **ProgressChart.tsx** / **FeedbackHUD.tsx** → Native equivalents
    - Use `react-native-svg` for charts or `victory-native` library
16. **ParticleBackground.tsx** → Consider removing or simplify
    - Particle effects are expensive on mobile; use subtle gradient instead
    - If needed, implement with Skia for 60 FPS performance

#### 2.3 Animation Migration
**Challenge**: Replace Framer Motion with React Native Reanimated
- Migrate all `motion.*` components to Reanimated's `Animated.View`
- Convert spring animations: `whileHover`, `whileTap` → Reanimated gesture handlers
- Implement fade-in, slide-up, scale animations with `useSharedValue()` and `useAnimatedStyle()`
- Use `react-native-gesture-handler` for swipe, pan, pinch gestures

---

### PHASE 5 — Visualizers (Weeks 8–9)

**Goal:** Instrument visualizers are functional and beautiful.

#### 5.1 Fretboard Visualizer

File: `src/components/visualizers/Fretboard.tsx`

**Web version**: ✅ `src/components/FretboardVisualizer.tsx` (uses `svguitar` - web only)

**Rebuild using `@shopify/react-native-skia` (recommended) or `react-native-svg`**

- ⬜ Render strings (6 for guitar, 4 for bass/ukulele)
  - Vertical lines
  - Proper spacing
- ⬜ Render frets (12-15 visible frets)
  - Horizontal lines
  - Fret numbers at bottom
- ⬜ Fret markers (dots at 3, 5, 7, 9, 12)
  - Centered on fretboard
- ⬜ Highlight detected pitch
  - Dot or circle at string/fret intersection
  - Animated glow effect
- ⬜ Multi-position support
  - Same note can appear on multiple strings/frets
  - Show all valid positions dimmed, highlight closest
- ⬜ Show scale notes (optional mode)
  - Pass scale from Harmony Agent or user selection
  - Dim non-scale frets
- ⬜ Responsive layout
  - Landscape: wider fretboard
  - Portrait: vertical scrolling
- ⬜ Gesture support
  - Horizontal scroll to show frets 0-12, 5-17, etc.
  - `react-native-gesture-handler` ScrollView
- ✅ Chord fingering data exists (`src/utils/chordFingerings.ts`)
- ⬜ Port `ChordPositionsGrid` for chord diagram view
  - Show all positions for a chord in a grid

**Performance:**
- 60 FPS during note changes (use Skia for best performance)

#### 5.2 Piano Keyboard Visualizer

File: `src/components/visualizers/Piano.tsx`

**Web version**: ✅ `src/components/PianoChordDisplay.tsx` (uses `react-piano` - web only)

**Rebuild custom piano keyboard with SVG or Skia**

- ⬜ Render white keys (C, D, E, F, G, A, B)
  - Calculate widths based on screen width
  - Proper proportions (standard piano key ratio)
- ⬜ Render black keys (C#, D#, F#, G#, A#)
  - Overlapping layout (positioned absolutely)
  - Shorter than white keys
- ⬜ Highlight detected pitch
  - Active key color change (cyan/electric blue)
  - Glow effect around key
- ⬜ Octave selection controls
  - Left/right arrows
  - Or octave picker dropdown
- ⬜ Support 1-2 octaves visible at a time
  - Default: C4-C6 (2 octaves)
- ⬜ Optional: Multi-touch support for chord playback (future feature)
- ⬜ Responsive sizing
  - Fit to screen width
  - Scale proportionally
- ⬜ Use Skia for smooth rendering

#### 5.3 Trumpet Fingering Display

File: `src/components/visualizers/Trumpet.tsx`

**Web version**: ✅ `src/components/TrumpetNoteDisplay.tsx`

- 🔄 Valve diagrams (3 valves)
  - ✅ Fingering logic exists (`src/utils/trumpetFingerings.ts`)
  - ⬜ Rebuild UI with React Native Views/SVG
- ⬜ Circular valve buttons
  - 3 circles labeled "1", "2", "3"
- ⬜ Highlight active valves (pressed vs unpressed)
  - Pressed: colored fill (cyan) + glow
  - Unpressed: gray outline
- ⬜ Note name display (large, above valves)
- ⬜ Fingering label below (e.g., "1-2", "Open", "1-3")
- ⬜ Smooth transitions when note changes
  - Reanimated scale/opacity animations

**Simplest visualizer to build - start here to validate UI patterns.**

#### 5.4 Timeline View

File: `src/components/visualizers/Timeline.tsx`

**Web version**: ✅ `src/components/PianoRoll.tsx` + `src/components/ChordStreamDisplay.tsx`

- ⬜ Scrollable horizontal timeline
  - Use `ScrollView` or `FlatList` for performance
- ⬜ Note rectangles (mini piano roll)
  - Each note as colored rectangle
  - Y-axis: pitch (MIDI note number)
  - X-axis: time
  - Use Skia or SVG for rendering
- ⬜ Chord name lane
  - Above or below piano roll
  - Chord symbols with timestamps (e.g., "Cmaj7 @ 0:12")
- ⬜ Time markers
  - Vertical lines at second intervals
  - Labels: "0:00", "0:05", "0:10", etc.
- ⬜ Current-position cursor
  - Animated vertical line following playback
  - Reanimated smooth scrolling
- ⬜ Tap-to-seek functionality
  - User taps timeline → jump to that position
- ⬜ Zoom controls
  - Pinch-to-zoom gesture OR +/- buttons
  - Zoom into 5s, 10s, 30s, 1min views
- ⬜ Auto-scroll during playback
  - Keep cursor centered or scroll with cursor
- 🔄 Integration with `useChordDetection()` and `usePitchDetection()`

**Performance:**
- Virtualized rendering for long recordings (only render visible notes)
- Target 60 FPS during scrolling

---

### PHASE 6 — Export & Library (Week 10)

**Goal:** Users can export transcriptions and manage their song library.

#### 6.1 MIDI Export

File: `src/utils/exportMIDI.ts`

**Web version**: ✅ `src/utils/convertToMIDI.ts` (uses `midi-writer-js`)

- ✅ MIDI conversion logic exists and is pure JavaScript
- ⬜ Port `convertToMIDI()` function to React Native
  - `midi-writer-js` works as-is (no DOM dependencies)
- ⬜ Convert note array to MIDI events
  - Track tempo, time signature
  - Note velocity, duration
  - Chord annotations as meta events
- ⬜ Generate MIDI file buffer (binary)
- ⬜ Save to device using `expo-file-system`
  - Path: `/Documents/tonepath/exports/song_name.mid`
- ⬜ Share via `expo-sharing`
  - System share sheet (AirDrop, email, save to Files)
- ⬜ Success/error feedback (toast or modal)

**UI:**
- Export button in transport or menu
- Modal with format selection (MIDI, JSON)
- Progress indicator during generation

#### 6.2 JSON Export

File: `src/utils/exportJSON.ts`

- ⬜ Export transcription data structure
  - Notes array: `[{timestamp, note, frequency, duration, confidence}]`
  - Chords array: `[{timestamp, chord, confidence}]`
  - Metadata: tempo, key, instrument, date
- ⬜ JSON.stringify with formatting
- ⬜ Save to file using `expo-file-system`
- ⬜ Share via `expo-sharing`
- ⬜ Optional: Pretty-print for readability

#### 6.3 Simple Song Library

File: `src/components/Library.tsx`

**Web version**: ✅ `src/components/SongLibrary.tsx` + `src/utils/songStorage.ts`

- 🔄 Save imported songs/recordings to `AsyncStorage`
  - ✅ Storage logic exists (localStorage in web)
  - ⬜ Port to `@react-native-async-storage/async-storage`
  - Data structure: `{id, name, duration, filePath, dateAdded, instrument}`
- ⬜ Display list with `FlatList`
  - Song name
  - Duration (formatted: "2:34")
  - Date added (relative: "2 days ago")
  - Optional: Waveform thumbnail
- ⬜ Quick actions per song:
  - Load into player
  - Delete (with confirmation)
  - Rename (inline edit)
  - Share (export MIDI/JSON)
- ⬜ Persist last-used file across app launches
  - Store in AsyncStorage: `lastSongId`
  - Auto-load on app open
- ⬜ Empty state
  - "No songs yet. Import or record to get started."
- ⬜ Search/filter (optional for v1, add in v1.1)

**Performance:**
- Virtualized list with `FlatList` (handles 100+ songs smoothly)

---

### PHASE 7 — Polish, QA, & Beta Release (Weeks 11–12)

**Goal:** App is stable, polished, and ready for beta users.

#### 7.1 UI Polish

- ⬜ Implement simplified gradient theme
  - Primary colors: Blue `#0066ff`, Purple `#8f00ff`, Cyan `#00e6e6`
  - Dark background: `#0a0e1a`
  - Accent gradients using `LinearGradient`
- ⬜ Larger buttons for mobile
  - Minimum 48pt touch targets
  - Clear visual hierarchy
- ⬜ Dark mode (default)
  - Support light mode in settings (optional)
  - Use `useColorScheme()` hook
- ⬜ Consistent spacing and padding
  - 8pt grid system
- ⬜ Loading states
  - Skeleton screens or spinners
  - Smooth transitions
- ⬜ Error states
  - Clear error messages
  - Retry buttons
- ⬜ Empty states
  - Helpful prompts
  - Call-to-action buttons

#### 7.2 Device Testing

**Test on physical devices (simulators not sufficient for audio latency):**

- ⬜ **iPhone**
  - iPhone 12 or newer (A14+ chip)
  - Test with built-in mic
  - Test with wired headphones
  - Test with Bluetooth headphones (note: higher latency)
- ⬜ **Android**
  - Pixel 5 or newer
  - Samsung Galaxy S21+
  - Test with built-in mic
  - Test with USB-C/3.5mm headphones
  - Test with Bluetooth
- ⬜ **Audio scenarios**
  - Quiet room
  - Moderate background noise
  - Multiple instruments playing
  - Loud environment
- ⬜ **Edge cases**
  - App backgrounding during recording
  - Phone call interrupting audio
  - Low battery mode
  - Airplane mode (offline features)
  - Storage nearly full

#### 7.3 Performance Targets

**Must meet these benchmarks:**

- ⬜ **Pitch detection latency**: <40ms (autocorrelation only)
  - Measure: mic input → pitch detected → UI updated
  - Tools: Add performance logging
- ⬜ **60 FPS visualizers**
  - Skia recommended for fretboard, piano, timeline
  - Profile with React Native Performance Monitor
  - Use Reanimated worklets for animations
- ⬜ **Playback stable at all speeds**
  - 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
  - No crackling or dropouts
- ⬜ **App launch time**: <2s cold start
- ⬜ **Memory usage**: <150MB during active transcription
- ⬜ **Battery drain**: <10% per hour during recording

**Optimization:**
- Use Hermes JavaScript engine (enabled by default in Expo)
- Minimize re-renders with `React.memo` and `useMemo`
- Lazy load heavy components
- Reduce bridge traffic (batch audio frames)

#### 7.4 Beta Build & Distribution

**iOS (TestFlight):**

- ⬜ Configure `app.json`:
  - Bundle identifier: `com.tonepath.mobile`
  - App name: "Tone Path"
  - Version: `1.0.0` (build `1`)
  - Permissions: Microphone, file access
  - Background modes: audio
- ⬜ Build with EAS: `eas build --platform ios --profile preview`
- ⬜ Upload to TestFlight via EAS Submit
- ⬜ Add beta testers (max 10,000 external testers)
- ⬜ Write clear beta instructions
- ⬜ Set up crash reporting (Sentry or Firebase Crashlytics)

**Android (Internal Testing):**

- ⬜ Configure `app.json`:
  - Package name: `com.tonepath.mobile`
  - Permissions: `RECORD_AUDIO`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`
- ⬜ Build with EAS: `eas build --platform android --profile preview`
- ⬜ Upload to Google Play Console → Internal testing
- ⬜ Add beta testers via email list
- ⬜ Set up crash reporting

**Beta Goals:**
- ⬜ Recruit 20-50 beta testers (musicians, music teachers, students)
- ⬜ Gather feedback on:
  - Pitch detection accuracy
  - UI/UX usability
  - Feature requests
  - Bugs and crashes
- ⬜ Iterate based on feedback (1-2 week cycle)

---

## OPTIONAL POST-LAUNCH FEATURES (v1.1+)

### YouTube Import

**Web version**: ✅ `src/components/YouTubeImport.tsx` + Netlify function

**Implementation:**
- Call Netlify `youtube-audio` endpoint from mobile
  - URL: `https://tonepath.netlify.app/.netlify/functions/youtube-audio`
  - POST with `{ videoId }`
- Download binary audio data to temp file
- Convert to PCM using `expo-av` decoder
- Handle errors (invalid ID, restricted videos, quota)
- Add progress indicator

**Complexity:** Medium
**Priority:** Low for v1.0 (file import covers most use cases)

### Jam AI (Magenta Server-Side)

**Web version**: ✅ `src/hooks/useJamAI.ts`, `src/lib/ai/magenta.ts`

**Server-side generation approach:**
- Mobile sends chord progression to backend API
- Backend generates backing track using Magenta.js
- Return MP3/WAV file
- Download + cache on device
- UI controls: style, tempo, length
- Auto sync with loop region

**Complexity:** High
**Priority:** Low for v1.0 (nice-to-have feature)

### Learning Mode & Analytics

**Web version**: ✅ `src/components/ProgressChart.tsx`, `src/hooks/useLearningMode.ts`

- Practice session tracking
- Accuracy charts (`victory-native`)
- Streak counter
- Goals and exercises

**Complexity:** Medium
**Priority:** Medium for v1.1

---

### Phase 6: Platform-Specific Features (1 week)

#### 6.1 iOS Optimizations
- Configure Audio Session for low-latency recording
- Implement Core Audio bridge for <10ms latency (optional native module)
- Add Siri Shortcuts for "Start Practice Session"
- Use Haptic Engine for metronome/tuner feedback
- Support iPad multitasking (Split View, Slide Over)
- Add Apple Pencil support for chord chart annotations (optional)

#### 6.2 Android Optimizations
- Configure Audio Attributes for recording/playback
- Use Oboe library for low-latency audio (via native module)
- Implement foreground service for recording indicator
- Add home screen widgets (practice timer, tuner)
- Support DeX mode (Samsung desktop mode)

#### 6.3 Accessibility
- Add VoiceOver/TalkBack screen reader support
- Implement haptic feedback for tuner (accessibility alternative to visual)
- Add high-contrast color scheme
- Ensure touch targets ≥44pt (iOS) / ≥48dp (Android)
- Support Dynamic Type (iOS) and font scaling (Android)

---

### Phase 7: Testing & Optimization (2 weeks)

#### 7.1 Testing Strategy
- Unit tests for shared utilities (Jest, same as web)
- Component tests with React Native Testing Library
- Integration tests for audio workflows
- E2E tests with Detox (iOS/Android simulators)
- Manual testing on physical devices (iPhone, iPad, Android phones/tablets)

#### 7.2 Performance Optimization
- Profile with React Native Performance Monitor
- Optimize pitch detection loop (target 60 FPS during listening)
- Implement virtualized lists for long song libraries
- Lazy load heavy components (VexFlow equivalent, ML models)
- Reduce app bundle size:
  - Code splitting with dynamic imports
  - On-demand model downloads (TFLite models)
  - Image optimization with `expo-optimize`

#### 7.3 Audio Latency Tuning
- Measure and minimize latency: mic input → pitch detection → UI update
- Target <100ms total latency (professional-grade)
- Platform-specific audio buffer tuning:
  - iOS: `AVAudioSession.setPreferredIOBufferDuration()`
  - Android: Oboe library low-latency streams

---

### Phase 8: Deployment & Distribution (1 week)

#### 8.1 Build Configuration
- Configure `app.json` / `app.config.ts`:
  - App name: "Tone Path"
  - Bundle identifiers: `com.tonepath.mobile` (iOS), `com.tonepath.mobile` (Android)
  - Permissions: microphone, audio recording, file system access
  - Background modes: audio (iOS)
- Set up EAS Build profiles (development, preview, production)
- Configure code signing (iOS: App Store Connect, Android: keystore)

#### 8.2 App Store Preparation
- Create App Store Connect / Google Play Console listings
- Design app icon (1024x1024px) and splash screen
- Write app descriptions emphasizing features:
  - "Real-time music transcription for trumpet, guitar, bass, ukulele"
  - "Professional tuner and metronome"
  - "Learn with interactive fretboard and piano visualizations"
- Prepare screenshots (iPhone, iPad, Android phones, tablets)
- Record demo video

#### 8.3 Release Strategy
- Beta testing with TestFlight (iOS) and Internal Testing (Android)
- Gather feedback from musicians (target beta users: 20-50)
- Iterate on UX issues
- Phased rollout: 10% → 50% → 100% over 2 weeks
- Monitor crash reports (Sentry, Firebase Crashlytics)

---

### Major Technical Challenges & Solutions

#### Challenge 1: Web Audio API Replacement
**Web**: Full-featured Web Audio API with real-time analysis
**Mobile**: Limited built-in audio APIs, higher latency
**Solutions**:
- Use `expo-av` for basic recording/playback
- Build native audio module with Core Audio (iOS) / Oboe (Android) for pro features
- Accept slightly higher latency on Android (<50ms vs <10ms)

#### Challenge 2: Canvas/SVG Visualization Libraries
**Web**: VexFlow, react-piano, svguitar all use DOM Canvas/SVG
**Mobile**: No direct equivalent, requires custom rendering
**Solutions**:
- Use `@shopify/react-native-skia` for high-performance 2D rendering (recommended)
- Alternative: `react-native-svg` for simpler visualizations
- Rebuild guitar chord diagrams, piano keyboard, and music notation from scratch

#### Challenge 3: TensorFlow.js CREPE Model
**Web**: TensorFlow.js with WebGL acceleration
**Mobile**: Needs TensorFlow Lite conversion
**Solutions**:
- Convert CREPE model to `.tflite` format with TensorFlow Model Converter
- Use `react-native-tensorflow-lite` for inference
- Implement quantization for smaller model size (INT8 instead of FP32)
- Fallback to autocorrelation-only mode for low-end devices

#### Challenge 4: Netlify Functions Backend
**Web**: Integrated serverless functions (yt-dlp, MIDI export)
**Mobile**: No built-in backend
**Solutions**:
- Keep existing Netlify deployment as API backend
- Mobile app calls `https://tonepath.netlify.app/.netlify/functions/*`
- Implement request queuing for offline mode
- Cache API responses with React Query

#### Challenge 5: Real-time Performance
**Target**: 60 FPS UI + <50ms audio latency + <100ms ML inference
**Solutions**:
- Use Reanimated 3 for UI animations (runs on UI thread)
- Offload pitch detection to native module or Web Worker equivalent
- Use `InteractionManager.runAfterInteractions()` for heavy tasks
- Implement frame skipping for audio visualizations on low-end devices

---

### Dependencies Comparison

| Feature               | Web Stack                     | React Native Stack                              |
|-----------------------|-------------------------------|-------------------------------------------------|
| Audio Input           | `navigator.mediaDevices`      | `expo-av`, `react-native-audio-toolkit`         |
| Audio Playback        | `Tone.js`, `AudioContext`     | `expo-av`, native audio modules                 |
| Pitch Detection (ML)  | TensorFlow.js CREPE           | TensorFlow Lite, MediaPipe                      |
| UI Framework          | React DOM, Tailwind CSS       | React Native, StyleSheet / styled-components    |
| Animations            | Framer Motion                 | React Native Reanimated, Gesture Handler        |
| Navigation            | Next.js Pages/App Router      | Expo Router or React Navigation                 |
| Chord Diagrams        | `svguitar` (SVG)              | Custom SVG with `react-native-svg` or Skia      |
| Piano Display         | `react-piano` (DOM)           | Custom keyboard with Views/SVG                  |
| Music Notation        | VexFlow (Canvas)              | Custom rendering with Skia or SVG               |
| Charts/Graphs         | D3.js, Canvas                 | `victory-native`, `react-native-svg`            |
| File System           | Browser APIs                  | `expo-file-system`, `expo-document-picker`      |
| Storage               | `localStorage`                | `@react-native-async-storage/async-storage`    |
| Backend               | Netlify Functions             | REST API calls to Netlify or custom backend     |
| Build/Deploy          | Vercel/Netlify                | EAS Build, App Store, Google Play               |

---

### Estimated Timeline Summary (SIMPLIFIED)

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 0. Setup | 1 week | Expo bare project, dependencies, folder structure |
| 1. Native Audio Input | 1 week | Swift/Kotlin audio modules, PCM to JS |
| 2. Audio Processing | 1-2 weeks | JS pitch detection, chord detection |
| 3. Playback & Import | 1 week | expo-av playback, file import, recorder |
| 4. Practice Tools | 1-2 weeks | Tuner, metronome, live note display, transport |
| 5. Visualizers | 2 weeks | Fretboard, piano, trumpet, timeline |
| 6. Export & Library | 1 week | MIDI export, JSON export, song library |
| 7. QA & Beta | 1-2 weeks | Polish, testing, TestFlight/Play Console |
| **Total** | **8-11 weeks** | **Production-ready v1.0** |

**Key Difference from Original Plan:**
- ❌ **Removed**: C++ DSP modules, TensorFlow Lite (v1.0), full React Native rewrite of all components
- ✅ **Added**: Minimal native code (Swift/Kotlin audio only), JS-based algorithms, faster iteration
- 📉 **Timeline reduction**: 14-19 weeks → 8-11 weeks (42% faster)

---

### Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Audio latency >100ms on Android | High | Use Oboe native library, target newer Android versions (10+) |
| TFLite model conversion fails | Medium | Fall back to autocorrelation-only, investigate alternative ML frameworks |
| Skia/Canvas performance issues | Medium | Use react-native-svg for simpler visualizations, optimize render cycles |
| Backend API costs (yt-dlp usage) | Low | Implement rate limiting, consider user quotas |
| App Store rejection (audio recording) | Low | Clearly document use case in privacy policy and app review notes |

---

### Success Metrics

**Must-Have for v1.0**:
- ✅ Real-time pitch detection with <100ms latency
- ✅ Tuner and metronome functional
- ✅ Fretboard/piano visualization for at least 2 instruments
- ✅ Recording and basic export (MIDI or audio file)
- ✅ Runs at 60 FPS on iPhone 12 / Pixel 5 or newer

**Nice-to-Have for v1.0**:
- Jam AI backing tracks (can be v1.1)
- YouTube import (can be v1.1)
- Full learning mode with analytics (can be v1.2)
- Chord recognition for imported audio (can be v1.2)

**Long-term Goals**:
- ≥4.5 star rating on App Store / Google Play
- <1% crash rate
- ≥70% 7-day retention rate
- Featured in "App of the Day" (App Store) or "Editor's Choice" (Google Play)

---

### Next Steps to Begin

1. **Approve this plan** and decide on phased approach vs. full rebuild
2. **Set up Expo project** and initial development environment
3. **Create proof-of-concept** for audio input + pitch detection (Phase 1.1 + 1.2)
4. **Build 2-3 core components** (Controls, Tuner, LiveNoteDisplay) to validate UI patterns
5. **Evaluate TensorFlow Lite** CREPE model conversion feasibility
6. **Decide on backend strategy** (keep Netlify vs. new backend)
7. **Recruit beta testers** from musician community (start outreach now)

---

## 15. Simplified Component Checklist

**Migration Status Legend:**
- ✅ = Ready to port from web (pure JS)
- 🔄 = Logic exists, needs mobile UI rebuild
- ⬜ = Build fresh for mobile
- 🎯 = Native module required

### Native Modules (Must Build Fresh)

- 🎯 **iOS AudioInputModule.swift**
  - AVAudioEngine mic input
  - PCM frame emission to JS
- 🎯 **Android AudioInputModule.kt**
  - AudioRecord mic input
  - PCM frame emission to JS
- ⬜ **(Optional) TFLite ML Engine** - Skip for v1.0

### Core Hooks (Port from Web)

- 🔄 **useAudioInput** - New, wraps native module
- 🔄 **usePitchDetection** - ✅ Algorithm exists, adapt for mobile
- 🔄 **useChordDetection** - ✅ Algorithm exists, adapt for mobile
- 🔄 **usePlayback** - ✅ Logic exists, use expo-av instead of Tone.js
- 🔄 **useRecorder** - ✅ Logic exists, use expo-av

### Practice Tool Components

- 🔄 **Tuner** - ✅ Logic exists, rebuild UI with SVG/Skia
- 🔄 **LiveNoteDisplay** - ✅ Logic exists, rebuild with Reanimated
- 🔄 **Metronome** - ✅ Logic exists, rebuild UI + use expo-av for clicks
- 🔄 **Controls** - ✅ Logic exists, rebuild with Pressable + haptics

### Visualizer Components

- 🔄 **Fretboard** - ✅ Fingering data exists, rebuild with Skia/SVG
- 🔄 **Piano** - ✅ Note logic exists, rebuild keyboard from scratch
- 🔄 **Trumpet** - ✅ Fingering data exists, rebuild with Views
- 🔄 **Timeline** - ✅ Data structure exists, rebuild with Skia/SVG

### Utility Functions (Direct Port)

- ✅ **chordFingerings.ts** - Pure JS, copy as-is
- ✅ **trumpetFingerings.ts** - Pure JS, copy as-is
- ✅ **smoothing.ts** - Pure JS, copy as-is
- ✅ **exportMIDI.ts** - Pure JS, `midi-writer-js` works
- 🔄 **bpmDetection.ts** - May need minor tweaks

### Data & Storage

- 🔄 **songStorage.ts** - Port localStorage → AsyncStorage
- ⬜ **File system management** - Use expo-file-system
- ⬜ **AsyncStorage setup** - Settings, library metadata

### What You DON'T Need to Build

- ❌ TensorFlow Lite CREPE (optional for v1.1+)
- ❌ C++ DSP modules
- ❌ YouTube import (optional for v1.1+)
- ❌ Jam AI (optional for v1.1+)
- ❌ MusicXML export (optional for v1.1+)
- ❌ Advanced learning mode (optional for v1.1+)

---

### PHASE 0 — Foundation & Setup (Week 1)

#### 0.1 Expo + Repo Setup

- ⬜ Create Expo project (TS template)
  - Command: `npx create-expo-app@latest tone-path-mobile --template`
- ⬜ Install base dependencies
  - `expo-av`, `expo-audio`, `expo-file-system`
  - `react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`
  - `@react-navigation/native` or Expo Router
  - `zustand` (state management)
  - `@react-native-async-storage/async-storage`
- ⬜ Set up Expo Router for file-based navigation
- ⬜ Create folder structure:
  - `src/components/`
  - `src/hooks/`
  - `src/utils/`
  - `src/theme/`
  - `src/types/`
  - `app/` (Expo Router screens)
- ✅ Extract and copy over pure-JS utilities from web build
  - `src/utils/chordFingerings.ts` ✅
  - `src/utils/trumpetFingerings.ts` ✅
  - `src/utils/smoothing.ts` ✅
  - `src/utils/bpmDetection.ts` 🔄 (may need audio API adjustments)
  - `src/types/*.ts` ✅ (all type definitions)
- ⬜ Configure EAS build profiles (dev / preview / production)

#### 0.2 Shared UI & Theme Setup

- ⬜ Create color palette (`src/theme/colors.ts`)
  - Port from Tailwind config: Primary Blue `#0066ff`, Electric Purple `#8f00ff`, Neon Cyan `#00e6e6`, etc.
- ⬜ Create typography (`src/theme/typography.ts`)
  - Map web font classes to React Native TextStyle objects
- ⬜ Build UI primitives in `src/components/ui/`:
  - ⬜ `Button.tsx` (Pressable with variants: primary, secondary, ghost)
  - ⬜ `Card.tsx` (glassmorphism with blur effect)
  - ⬜ `IconButton.tsx` (circular touch target ≥44pt)
  - ⬜ `Slider.tsx` (tempo, volume, sensitivity controls)
  - ⬜ `Modal.tsx` (full-screen and bottom-sheet variants)
  - ⬜ `TextInput.tsx` (styled input with validation states)
- ⬜ Add global styles (dark mode, spacing, border radii, shadows)
- 🔄 Port glassmorphism styles using `expo-blur` and `LinearGradient`

---

### PHASE 1 — Core Audio Engine (Weeks 2–3)

#### 1.1 useAudioStreamNative

**Web version**: ✅ `src/hooks/useAudioStream.ts` (Web Audio API)

- ⬜ Connect microphone using `expo-av` Audio.Recording
- ⬜ Configure recording to PCM format (iOS: `.wav`, Android: `.wav` or `.m4a`)
- ⬜ Set sample rate to 44.1kHz or 48kHz
- ⬜ Add permissions check (iOS: `NSMicrophoneUsageDescription`, Android: `RECORD_AUDIO`)
- ⬜ Implement on-audio-frame listener (`setOnRecordingStatusUpdate`)
- ⬜ Pipe PCM frames to pitch detector
- ⬜ Handle interruptions (phone calls, app switching, audio session interruptions)
- ⬜ Error handling and fallback states

#### 1.2 usePitchDetectionNative

**Web version**: ✅ `src/hooks/usePitchDetection.ts` (autocorrelation + TensorFlow.js CREPE)

**Start with autocorrelation → add ML in Phase 6**

- 🔄 Port autocorrelation pitch detection algorithm
  - ✅ Core algorithm already implemented in web version
  - ⬜ Adapt for React Native audio buffers
- 🔄 Smooth output (median filter)
  - ✅ Smoothing utility exists (`src/utils/smoothing.ts`)
  - ⬜ Integrate with React Native hook
- ✅ Convert frequency → note (already in `usePitchDetection.ts:21-41`)
- ⬜ Add cents offset calculation
- ⬜ Add confidence score
- ⬜ Expose: `{ frequency, note, cents, confidence, isModelLoaded }`
- ⬜ Optimize for 60 FPS (target <16ms per frame)

**TFLite CREPE version arrives in PHASE 6**

#### 1.3 Playback Engine — usePlaybackNative

**Web version**: ✅ `src/hooks/usePlayback.ts` (Tone.js)

- ⬜ Initialize `expo-av` Sound API
- ⬜ Load audio from file URI (`Sound.createAsync()`)
- ⬜ Play / pause / stop
- ⬜ Scrub/seek (`setPositionAsync`)
- ⬜ Implement playback rate (0.25x–2x) using `setRateAsync`
- ⬜ Expose position + duration with polling or status updates
- ⬜ Add event listeners for buffered/unloaded/finished states
- ⬜ Support looping with in/out points

### PHASE 3 — Playback & File Import (Week 5)

**Goal:** Audio input/output pipeline is stable and complete.

#### 3.1 Playback Engine (expo-av)

File: `src/hooks/usePlayback.ts`

**Web version**: ✅ `src/hooks/usePlayback.ts` (Tone.js) - logic can be ported

- ⬜ Initialize `expo-av` Sound API
- ⬜ Load audio from file URI: `await Sound.createAsync({ uri })`
- ⬜ Play / Pause / Stop
- ⬜ Seek: `await sound.setPositionAsync(positionMs)`
- ⬜ Playback rate (0.5x–2x): `await sound.setRateAsync(rate, shouldCorrectPitch)`
- ⬜ Expose position + duration
  - Poll with `setOnPlaybackStatusUpdate()` every 100ms
- ⬜ Handle playback completion
- ⬜ Error handling (file not found, unsupported format)

**State exposed:**
```typescript
{
  isPlaying: boolean,
  position: number,
  duration: number,
  rate: number,
  play(),
  pause(),
  stop(),
  seek(ms: number),
  setRate(rate: number)
}
```

#### 3.2 MP3/WAV File Import

File: `src/components/FileUpload.tsx`

**Web version**: ✅ `src/components/FileUpload.tsx` - UI can be adapted

- ⬜ Use `expo-document-picker` to select audio files
- ⬜ Allowed formats: `.mp3`, `.wav`, `.ogg`, `.m4a`
- ⬜ Read file URI
- ⬜ Decode audio to PCM using `expo-av` or lightweight decoder
  - For real-time transcription, need raw PCM data
  - May use `expo-av` Sound with `getStatusAsync()` hack or Web Audio API polyfill
- ⬜ Feed PCM into pitch/chord pipeline
- ⬜ Show file metadata (name, duration, size)
- ⬜ Loading state during decode
- ⬜ Error handling (corrupted file, unsupported format)

**Optional: Waveform extraction**
- Downsample PCM to 100-200 points for visual waveform

#### 3.3 Basic Recorder

File: `src/hooks/useRecorder.ts`

**Web version**: ✅ `src/hooks/useRecorder.ts` (MediaRecorder API)

- ⬜ Start recording: `await Audio.Recording.createAsync()`
- ⬜ Stop recording: `await recording.stopAndUnloadAsync()`
- ⬜ Get recording URI: `recording.getURI()`
- ⬜ Save to app Documents directory: `/Documents/tonepath/recordings/`
- ⬜ Return file path for playback
- ⬜ Recording format: WAV (uncompressed, best for transcription)
- ⬜ Show recording duration timer (real-time)
- ⬜ Max duration limit (e.g., 10 minutes to prevent storage issues)
- ⬜ Error handling (storage full, permissions denied, interrupted by call)

---

### PHASE 2 — v1 Practice Tools (Weeks 4–5)

*Migrate the simplest UI first*

#### 2.1 Transport Controls

**Web version**: ✅ `src/components/Controls.tsx`

- 🔄 Listen button (start/stop microphone)
- 🔄 Record button (visual recording indicator)
- 🔄 Play/Pause (for playback)
- 🔄 Stop
- 🔄 Tempo slider (for metronome sync)
- ⬜ Add haptics using `expo-haptics` (light impact on button press)
- ⬜ Implement Reanimated scale animations for active states
- ⬜ Status indicators (Listening/Recording/Playing pills)

#### 2.2 Tuner — Tuner.native.tsx

**Web version**: ✅ `src/components/Tuner.tsx` + `src/components/SimpleTuner.tsx`

- ⬜ SVG needle component (using `react-native-svg`)
  - Animated Arc for tuning range
  - Rotating needle with spring physics (Reanimated)
- ⬜ Color-coded "in tune / sharp / flat" feedback
  - Green zone: ±10 cents
  - Yellow: ±10-30 cents
  - Red: >30 cents
- 🔄 Frequency + note readout
  - ✅ Logic exists in web version
  - ⬜ Style for mobile (large, readable text)
- ⬜ Large center display (note name + octave)
- ⬜ Tie into `usePitchDetectionNative` hook
- ⬜ Haptic feedback on "in tune" threshold crossing
- ⬜ Settings: sensitivity slider, A4 tuning reference (440Hz, 442Hz, etc.)

#### 2.3 Metronome — Metronome.native.tsx

**Web version**: ✅ `src/components/Metronome.tsx` + `src/components/TraditionalMetronome.tsx`

- 🔄 Beat pulse animation (Reanimated scale/opacity on each beat)
- ✅ BPM slider (30–300 BPM) - logic exists
- 🔄 Tap tempo button
  - ✅ Algorithm exists
  - ⬜ Mobile UI with large touch target
- ⬜ Beat sounds with `expo-av` Sound (load click samples)
  - Strong beat (downbeat)
  - Weak beat (other beats)
- 🔄 Time signatures: 2/4, 3/4, 4/4, 6/4
  - ✅ Logic exists
  - ⬜ Mobile picker/selector
- ⬜ Visual beat indicators (dots or bars)
- ⬜ Haptic feedback on each beat (optional)

#### 2.4 Live Note Display — LiveNoteDisplay.native.tsx

**Web version**: ✅ `src/components/LiveNoteDisplay.tsx`

- 🔄 Show note name (large, centered)
- 🔄 Show octave
- 🔄 Add confidence indicator (circular progress or bar)
- ⬜ Smooth transitions with Reanimated (fade between notes)
- ⬜ Color-coded by pitch stability
- ⬜ Optional: pitch history bar (last 10 notes scrolling horizontally)
- ⬜ Optional: frequency display toggle

---

### PHASE 3 — Instrument Visualizers (Weeks 6–7)

*These components unlock the "play along" experience.*

#### 3.1 FretboardVisualizer

**Web version**: ✅ `src/components/FretboardVisualizer.tsx` (uses `svguitar` - web only)

**Rebuild using `react-native-svg` or `@shopify/react-native-skia`**

- ⬜ Render strings (6 for guitar, 4 for bass/ukulele)
- ⬜ Render frets (12-15 visible frets)
- ⬜ Fret markers (dots at 3, 5, 7, 9, 12)
- ⬜ Highlight detected pitch on fretboard
  - Dot or circle on string/fret intersection
  - Multi-position support (same note, different positions)
- ⬜ Show scale notes (optional mode)
  - Pass scale from Harmony Agent
  - Dim non-scale notes
- ⬜ Responsive layout (landscape vs portrait)
- ⬜ Gesture support for horizontal scrolling (show frets 0-12, 5-17, etc.)
- ✅ Chord fingering data already exists (`src/utils/chordFingerings.ts`)
- ⬜ Port `ChordPositionsGrid` for chord diagram view

#### 3.2 PianoVisualizer

**Web version**: ✅ `src/components/PianoChordDisplay.tsx` (uses `react-piano` - web only)

**Rebuild custom piano keyboard**

- ⬜ Render white keys (C, D, E, F, G, A, B)
- ⬜ Render black keys (C#, D#, F#, G#, A#)
  - Overlapping layout
  - Proper key widths and offsets
- ⬜ Highlight detected pitch
  - Active key color change
  - Glow effect
- ⬜ Octave selection controls (arrows or picker)
- ⬜ Support 1-2 octaves visible at a time
- ⬜ Basic multi-touch support for chord playback (future)
- ⬜ Use SVG or Skia for rendering
- ⬜ Responsive sizing (fit to screen width)

#### 3.3 TrumpetFingeringDisplay

**Web version**: ✅ `src/components/TrumpetNoteDisplay.tsx` (simpler, uses SVG/divs)

- 🔄 Valve diagrams (3 valves)
  - ✅ Fingering logic exists (`src/utils/trumpetFingerings.ts`)
  - ⬜ Rebuild UI with React Native View/SVG
- ⬜ Highlight active valves (pressed vs unpressed)
  - Pressed: colored fill + glow
  - Unpressed: gray outline
- ⬜ Note name display
- ⬜ Fingering label (e.g., "1-2", "Open", "1-3")
- ⬜ Smooth transitions when note changes (Reanimated)

---

### PHASE 4 — Transcription Views (Weeks 8–9)

*These components let users see the full transcription.*

#### 4.1 Chroma Analysis (Shared util + native wrapper)

**Web version**: ✅ `src/lib/audio/analysis.ts` (chromagram + chord classification)

- 🔄 Port chroma algorithm
  - ✅ Core algorithm exists
  - ⬜ Adapt for React Native audio processing
- ⬜ Process PCM frames → chromagram (12-bin pitch class histogram)
- ⬜ Track peaks in chromagram
- ⬜ Return candidate pitch classes
- ⬜ Optimize for real-time performance (<10ms per frame)

#### 4.2 Chord Detection — useChordRecognitionNative

**Web version**: ✅ `src/hooks/useChordRecognition.ts`

- 🔄 Port chord dictionary
  - ✅ ~30 chord shapes already defined in web version
  - ⬜ Integrate with React Native hook
- 🔄 Time-window chord voting (aggregate over 500ms–1s)
- 🔄 Confidence score per chord
- 🔄 Duplicate filtering (don't emit same chord twice)
- ⬜ Emit chord stream array: `[{ timestamp, chord, confidence }]`
- ⬜ Real-time performance optimization

#### 4.3 TimelineView

**Web version**: ✅ `src/components/PianoRoll.tsx` + `src/components/ChordStreamDisplay.tsx`

- ⬜ Scrollable horizontal view (FlatList or ScrollView)
- ⬜ Mini piano roll rectangles (SVG)
  - Each note as colored rectangle (pitch on Y-axis, time on X-axis)
- ⬜ Chord name lane (above or below piano roll)
  - Chord symbols with timestamps
- ⬜ Time markers (seconds or measures)
- ⬜ Current-position cursor (animated line)
- ⬜ Tap-to-seek functionality
- ⬜ Zoom controls (pinch-to-zoom or +/- buttons)
- ⬜ Basic scroll-follow during playback
- 🔄 Integration with `useChordRecognitionNative` and `usePitchDetectionNative`

---

### PHASE 5 — Import/Export (Weeks 10–11)

*Keep this simple for v1.*

#### 5.1 File Upload — FileUpload.native.tsx

**Web version**: ✅ `src/components/FileUpload.tsx`

- ⬜ Use `expo-document-picker` to select files
- ⬜ Allowed formats: `.mp3`, `.wav`, `.ogg`, `.m4a`
- ⬜ Decode audio to PCM (using `expo-av` or native decoder)
- ⬜ Feed into playback + transcription pipeline
- ⬜ Show file name, duration, file size
- ⬜ Error handling (unsupported format, decode failure)
- ⬜ Loading state during decode

#### 5.2 Export

**Web version**: ✅ `src/utils/convertToMIDI.ts`, `src/utils/convertToMusicXML.ts`

**Minimal v1 set:**

- 🔄 **JSON Export**: Notes + timestamps
  - ✅ Data structure already defined
  - ⬜ Save to file using `expo-file-system`
  - ⬜ Share using `expo-sharing`
- 🔄 **MIDI Export**: Using `midi-writer-js` (pure JS, compatible)
  - ✅ Conversion logic exists
  - ⬜ Generate MIDI file buffer in React Native
  - ⬜ Save binary file to device
  - ⬜ Share via system share sheet
- ⬜ File saved to app Documents directory
- ⬜ Success/error feedback
- ⬜ Export modal with format selection (JSON, MIDI)

**MusicXML comes in v1.2** (lower priority)

---

### PHASE 6 — ML Upgrade (CREPE TFLite) (Weeks 12–14)

*This is optional for launch. Add later if needed.*

#### 6.1 Convert CREPE Model

**Web version**: ✅ CREPE integrated in `src/hooks/usePitchDetection.ts` (TensorFlow.js)

- ⬜ Convert CREPE model from `.h5` or TensorFlow.js to `.tflite`
  - Use TensorFlow Lite Converter
  - Test model output matches original
- ⬜ Quantize to INT8 (reduce size from ~5MB to ~1.5MB)
- ⬜ Store in app bundle (`assets/models/crepe.tflite`)
- ⬜ Alternative: host on CDN for on-demand download

#### 6.2 ML Inference Hook — usePitchDetectionML.ts

- ⬜ Load TFLite model using `react-native-tensorflow-lite` or `@tensorflow/tfjs-react-native`
- ⬜ Feed 1024-sample audio windows (16kHz resampled)
- ⬜ Run inference at 10–20ms hop size
- ⬜ Parse model output (360-bin frequency confidence)
- ⬜ Merge ML confidence with autocorrelation fallback
- ⬜ Add confidence smoothing (exponential moving average)
- ⬜ Add fallback if ML model fails to load or crashes
- ⬜ Expose toggle: `useML: boolean` parameter

#### 6.3 UI Integration

- ⬜ Settings screen toggle: "Use ML Pitch Detection (CREPE)"
- ⬜ Show improved pitch stability in tuner
- ⬜ Profile CPU usage (target <20% on iPhone 12 / Pixel 5)
- ⬜ Optimize for Android low-end devices (disable ML if too slow)
- ⬜ Add model download progress indicator (if using CDN)

---

### PHASE 7 — Additional Tools (Weeks 15–17)

*Add these after the core product works.*

#### 7.1 LoopController — LoopController.native.tsx

**Web version**: ✅ `src/components/LoopController.tsx`

- 🔄 Timeline scrubber (horizontal bar with playhead)
- 🔄 Two draggable handles (loop start / loop end)
  - ✅ Logic exists in web version
  - ⬜ Rebuild with `react-native-gesture-handler` PanGestureHandler
- 🔄 Loop enable toggle
- ⬜ Snap to beat (optional, based on BPM detection)
- ⬜ Haptic feedback on handle snap
- ⬜ Visual loop region highlight
- ⬜ Integration with `usePlaybackNative` (respect loop boundaries)

#### 7.2 Simple Song Library

**Web version**: ✅ `src/components/SongLibrary.tsx` + `src/utils/songStorage.ts`

- 🔄 Save imported songs/recordings to `AsyncStorage`
  - ✅ Storage logic exists (localStorage in web)
  - ⬜ Port to `@react-native-async-storage/async-storage`
- ⬜ Show list with:
  - Song name
  - Duration
  - Date added
  - Thumbnail (optional)
- ⬜ Quick load song into player
- ⬜ Delete song
- ⬜ Rename song
- ⬜ Persist last-used file across app launches
- ⬜ Use FlatList for performance with large libraries

#### 7.3 Practice Stats (v1.2)

**Web version**: ✅ `src/components/ProgressChart.tsx`, `src/components/FeedbackHUD.tsx`, `src/hooks/useLearningMode.ts`

- 🔄 Accuracy over time
  - ✅ Metrics calculation exists (`src/lib/learning/metrics.ts`)
  - ⬜ Port to React Native
- ⬜ Simple charts using `victory-native` or `react-native-svg`
  - Line chart: pitch accuracy over session
  - Bar chart: notes practiced
- ⬜ Streak counter (days practiced)
- ⬜ Session duration timer
- ⬜ Saved practice presets (scales, exercises)
- ⬜ Store stats in AsyncStorage

---

### PHASE 8 — Advanced Features (Weeks 18–22)

*Optional, post-launch*

#### 8.1 YouTube Import

**Web version**: ✅ `src/components/YouTubeImport.tsx` + Netlify function

- ⬜ Call Netlify `youtube-audio` endpoint from mobile
  - URL: `https://tonepath.netlify.app/.netlify/functions/youtube-audio`
  - POST with `{ videoId }`
- ⬜ Download binary audio data to temp file
- ⬜ Convert to PCM using `expo-av` decoder
- ⬜ Handle errors:
  - Invalid video ID
  - Restricted videos
  - Network timeout
  - Quota exceeded
- ⬜ Add progress indicator (download %)
- ⬜ Implement retry logic
- ⬜ Cache downloaded audio (optional)

#### 8.2 Jam AI (Magenta Server-Side)

**Web version**: ✅ `src/hooks/useJamAI.ts`, `src/lib/ai/magenta.ts`

**Server-side generation approach:**

- ⬜ Mobile sends chord progression to backend API
  - Endpoint: `POST /api/jam-ai`
  - Payload: `{ chords: string[], tempo: number, style: string, length: number }`
- ⬜ Backend generates backing track using Magenta.js
  - Run on Netlify Function or separate Node.js server
  - Return MP3/WAV file URL or binary
- ⬜ Download + cache generated track on device
- ⬜ `JamControls.native.tsx` UI:
  - Style picker (Rock, Blues, Jazz, Funk, etc.)
  - Tempo slider
  - Length slider (2–16 bars)
  - Generate button
  - Loading state
- ⬜ Auto sync with loop region (optional)
- ⬜ Play backing track alongside user recording

---

### Final High-Level Timeline

| Phase | Weeks | Output |
|-------|-------|--------|
| **0. Setup** | 1 | ⬜ Expo project + theme |
| **1. Audio Engine** | 2–3 | ⬜ Mic, pitch, playback, recorder |
| **2. Practice Tools** | 2 | ⬜ Tuner, metronome, transport |
| **3. Visualizers** | 2 | ⬜ Fretboard, piano, trumpet |
| **4. Transcription** | 2 | ⬜ Chords + timeline |
| **5. Import/Export** | 1–2 | ⬜ File input + MIDI export |
| **6. ML Upgrade** | 2–3 | ⬜ CREPE TFLite (optional) |
| **7. Tools & Library** | 2 | ⬜ Looping + library |
| **8. Advanced** | 2–4 | ⬜ YouTube + Jam AI |
| **TOTAL** | **14–19 weeks** | **Production iOS/Android app** |

---

### Migration Status Summary

**Ready to Port (Logic Exists):**
- ✅ All type definitions (`src/types/`)
- ✅ Pure utilities: `chordFingerings.ts`, `trumpetFingerings.ts`, `smoothing.ts`
- ✅ Pitch detection algorithm (autocorrelation)
- ✅ Chord detection algorithm + dictionary
- ✅ MIDI/JSON export converters
- ✅ Song storage logic
- ✅ Learning mode metrics
- ✅ BPM detection
- ✅ Jam AI backend integration pattern

**Needs Full Rewrite:**
- ⬜ All audio I/O (Web Audio API → expo-av)
- ⬜ All UI components (DOM → React Native)
- ⬜ All visualizations (Canvas/SVG → react-native-svg/Skia)
- ⬜ Navigation (Next.js → Expo Router)
- ⬜ Storage (localStorage → AsyncStorage)
- ⬜ Animations (Framer Motion → Reanimated)

**Significant Rework Required:**
- 🔄 Playback engine (Tone.js → expo-av)
- 🔄 File handling (Browser APIs → expo-file-system)
- 🔄 TensorFlow.js CREPE → TFLite

---

---

## 16. Recommended Starting Point — Week 1 Proof-of-Concept

**Goal**: Validate that JavaScript pitch detection on mobile is fast enough.

### Week 1 Checklist:

1. ⬜ Create Expo bare project
   - `npx create-expo-app tone-path-mobile --template`
   - `cd tone-path-mobile && expo prebuild`
2. ⬜ Build iOS audio input module (`AudioInputModule.swift`)
   - Set up AVAudioEngine
   - Emit PCM frames to JS
3. ⬜ Build Android audio input module (`AudioInputModule.kt`)
   - Set up AudioRecord
   - Emit PCM frames to JS
4. ⬜ Create `useAudioInput()` hook
   - Subscribe to native events
   - Normalize PCM data
5. ⬜ Port pitch detection algorithm
   - Copy autocorrelation function from web
   - Frequency → note conversion
6. ⬜ Build minimal tuner UI
   - Just display detected note (e.g., "A4")
   - No fancy graphics yet
7. ⬜ Test on physical devices
   - iPhone 12+
   - Pixel 5+
8. ⬜ Measure latency
   - Log timestamps: audio input → pitch detected → UI updated
   - Target: <40ms

### Success Criteria:

- ✅ Detected pitch updates in real-time
- ✅ Latency <40ms
- ✅ Note name is accurate (test with tuned instrument)
- ✅ No crashes or audio glitches

**If successful**: Proceed to Phase 2 (polish tuner UI, add metronome)
**If too slow**: Consider adding TFLite CREPE or optimizing autocorrelation

---

## 17. Next Steps for Rob

Choose one to start:

### Option 1: Generate Full Project Skeleton
I'll create the complete folder structure with placeholder files, package.json, tsconfig, and native module templates ready to paste.

### Option 2: Write Native Audio Module Code
I'll generate production-ready `AudioInputModule.swift` and `AudioInputModule.kt` with proper error handling and bridging.

### Option 3: Write JavaScript Audio Pipeline
I'll create `useAudioInput.ts`, `usePitchDetection.ts`, and autocorrelation algorithm ready to use.

### Option 4: Build UI Component Templates
I'll create starter code for `Tuner.tsx`, `Metronome.tsx`, `LiveNoteDisplay.tsx` with Reanimated animations.

### Option 5: Create Week-by-Week Task Board
I'll generate a Notion/Markdown task breakdown with daily goals for the 8-11 week timeline.

**Which one do you want first?**

---

## 18. Authentication & Monetization System

### Overview

**Goal:** One shared account, one subscription, works on iOS, Android, and Web with entitlements stored in Supabase.

**Stack:**
- **Supabase Auth** → users, sessions, profiles
- **Supabase Database** → user entitlements, usage, history
- **Superwall** → iOS/Android subscription paywalls
- **Netlify Functions** → secure business logic, webhooks
- **Expo Bare (EAS)** → mobile app with Superwall SDK
- **Next.js Web** → hosted on Netlify with optional Superwall web integration

---

### PHASE 1 — User Accounts (Supabase)

#### 1.1 Auth Methods

Use **Supabase Auth** for ALL platforms:
- ⬜ Email/password
- ⬜ Magic link
- ⬜ Apple Sign-in (iOS/macOS)
- ⬜ Google Sign-in (Android/Web/iOS)

**Why Supabase?**
- Works everywhere (web, iOS, Android)
- Zero-password friction with magic links
- Superwall can attach to Supabase user IDs
- Easy entitlements sync across platforms

#### 1.2 Supabase Database Schema

**Auto-created tables:**
- `auth.users` (Supabase managed)
- `auth.sessions` (Supabase managed)

**Custom table: `profiles`**

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  subscription_status text DEFAULT 'free', -- 'free', 'trialing', 'active', 'expired', 'cancelled'
  subscription_level text DEFAULT 'free', -- 'free', 'pro', 'lifetime'
  subscription_expiration timestamp with time zone,
  platform_source text, -- 'ios', 'android', 'web'
  device_count integer DEFAULT 0,
  max_devices integer DEFAULT 3,
  CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('free', 'trialing', 'active', 'expired', 'cancelled')),
  CONSTRAINT valid_subscription_level CHECK (subscription_level IN ('free', 'pro', 'lifetime'))
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Additional table: `song_library`**

```sql
CREATE TABLE public.song_library (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  song_name text NOT NULL,
  duration integer, -- seconds
  file_path text,
  instrument text,
  transcription_data jsonb, -- notes, chords, etc.
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.song_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own songs"
  ON public.song_library FOR ALL
  USING (auth.uid() = user_id);
```

#### 1.3 Web Auth Flow (Next.js + Supabase)

**Install dependencies:**
```bash
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Setup Supabase client:**

File: `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Auth context provider:**

File: `src/context/AuthContext.tsx`
- ⬜ Create auth context
- ⬜ Track user session
- ⬜ Fetch profile + entitlements
- ⬜ Provide auth state to app

**Protected routes:**
- ⬜ Wrap practice screens with auth guard
- ⬜ Redirect to login if not authenticated
- ⬜ Check entitlements before unlocking features

---

### PHASE 2 — Subscriptions & Paywalls (Superwall)

#### 2.1 Why Superwall?

- Fast customizable paywalls
- Native support for App Store / Google Play
- Handles purchase flows
- Analytics + A/B testing
- Server-side subscription validation
- Webhook integration with Netlify + Supabase

#### 2.2 Superwall Setup

**Create in Superwall Dashboard:**
- ⬜ Products:
  - Monthly: $9.99/mo
  - Annual: $59.99/yr (save 50%)
  - Lifetime: $149 one-time
- ⬜ Paywall templates (3 variations for A/B testing)
- ⬜ Free trial: 7 or 14 days
- ⬜ Configure webhooks → Netlify

**Mobile Integration (Expo):**
- ⬜ Install `@superwall/react-native-superwall`
- ⬜ Configure paywall triggers
- ⬜ Link to Supabase user ID

**Web Integration (Optional):**
- ⬜ Use Stripe for web subscriptions
- ⬜ Stripe webhook → Netlify → Supabase

#### 2.3 Superwall + Supabase Sync Flow

**When user purchases subscription:**

1. Superwall completes Apple/Google purchase verification
2. Superwall sends webhook → `netlify/functions/superwall-webhook.ts`
3. Netlify function updates Supabase:
   ```sql
   UPDATE profiles SET
     subscription_status = 'active',
     subscription_level = 'pro',
     subscription_expiration = '2025-12-31'
   WHERE id = $user_id
   ```
4. App refreshes entitlements via Supabase client
5. Web/mobile apps instantly unlock PRO features

**This guarantees:**
- Cross-platform entitlement sync
- iOS subscription works on Android and web
- No double-charging
- Centralized source of truth

---

### PHASE 3 — Netlify Webhooks (Subscription Backend)

#### 3.1 Superwall Webhook Handler

File: `netlify/functions/superwall-webhook.ts`

**Responsibilities:**
- ⬜ Verify webhook signature (Superwall secret)
- ⬜ Handle events:
  - `subscription_started`
  - `subscription_cancelled`
  - `subscription_renewed`
  - `trial_started`
  - `trial_converted`
  - `subscription_expired`
- ⬜ Update Supabase `profiles` table
- ⬜ Log events for debugging
- ⬜ Return 200 OK to Superwall

**Security:**
- ⬜ Verify webhook signature using Superwall secret
- ⬜ Only accept POST requests
- ⬜ Rate limiting
- ⬜ Log suspicious calls

**Example implementation:**
```typescript
import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for admin access
)

export const handler: Handler = async (event) => {
  // Verify signature
  const signature = event.headers['x-superwall-signature']
  // ... signature verification logic

  const payload = JSON.parse(event.body!)
  const { event_type, user_id, subscription } = payload

  switch (event_type) {
    case 'subscription_started':
      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_level: 'pro',
        subscription_expiration: subscription.expiration_date
      }).eq('id', user_id)
      break

    case 'subscription_cancelled':
      await supabase.from('profiles').update({
        subscription_status: 'cancelled'
      }).eq('id', user_id)
      break

    // ... handle other events
  }

  return { statusCode: 200 }
}
```

#### 3.2 Stripe Webhook (Web Subscriptions)

File: `netlify/functions/stripe-webhook.ts`

- ⬜ Handle Stripe checkout.session.completed
- ⬜ Handle invoice.payment_succeeded
- ⬜ Handle customer.subscription.deleted
- ⬜ Update Supabase accordingly

---

### PHASE 4 — Entitlements Logic

#### 4.1 Source of Truth: Supabase

**On every app boot:**

```typescript
// 1. Get Supabase session
const { data: { session } } = await supabase.auth.getSession()

// 2. Fetch profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single()

// 3. Check entitlements
const isPro =
  profile.subscription_status === 'active' &&
  profile.subscription_level === 'pro' &&
  new Date(profile.subscription_expiration) > new Date()

// 4. Unlock features
if (isPro) {
  unlockProFeatures()
} else {
  showPaywall()
}
```

#### 4.2 Feature Tiers

**FREE Tier:**
- ✅ Tuner
- ✅ Live note display
- ✅ Basic metronome
- ✅ 20 seconds of transcription
- ✅ Basic chord detection (major/minor only)
- ❌ Timeline view (locked)
- ❌ Export (locked)
- ❌ File import (locked)
- ❌ Loop controller (locked)

**PRO Tier ($9.99/mo or $59.99/yr):**
- ✅ Unlimited transcription length
- ✅ Full chord detection (extended chords, inversions)
- ✅ Full timeline view
- ✅ Export (MIDI, JSON, MusicXML)
- ✅ Unlimited file imports
- ✅ Loop controller with advanced features
- ✅ Backing track generation (Jam AI)
- ✅ Practice analytics
- ✅ Cloud sync (save songs to Supabase)
- ✅ Up to 3 devices

**LIFETIME ($149 one-time):**
- ✅ All PRO features forever
- ✅ Unlimited devices
- ✅ Priority support

#### 4.3 Entitlement Helper

File: `src/utils/entitlements.ts`

```typescript
export const checkEntitlement = (
  profile: Profile,
  feature: 'pro' | 'export' | 'timeline' | 'jam_ai'
): boolean => {
  if (!profile) return false

  const isActive =
    profile.subscription_status === 'active' &&
    new Date(profile.subscription_expiration) > new Date()

  const isLifetime = profile.subscription_level === 'lifetime'

  return isActive || isLifetime
}

export const getFeatureLimits = (profile: Profile) => {
  const isPro = checkEntitlement(profile, 'pro')

  return {
    maxTranscriptionLength: isPro ? Infinity : 20, // seconds
    canExport: isPro,
    canImportFiles: isPro,
    canUseTimeline: isPro,
    canUseJamAI: isPro,
    canUseLoopController: isPro,
    maxDevices: profile.subscription_level === 'lifetime' ? Infinity : 3,
  }
}
```

---

### PHASE 5 — Web App Implementation

#### 5.1 Auth UI Components

**Components to build:**
- ⬜ `src/components/auth/LoginModal.tsx`
  - Email/password form
  - Magic link option
  - Social login buttons (Google, Apple)
- ⬜ `src/components/auth/SignupModal.tsx`
  - Email signup
  - Password requirements
  - Terms acceptance
- ⬜ `src/components/auth/AuthGuard.tsx`
  - Wrapper for protected routes
  - Redirect to login if not authenticated

#### 5.2 Paywall UI

**Web paywall component:**
- ⬜ `src/components/paywall/PaywallModal.tsx`
  - Show pricing tiers
  - Stripe checkout integration
  - Feature comparison table
  - "Start Free Trial" CTA

**Trigger paywall when:**
- User hits 20-second transcription limit
- User tries to export
- User tries to access timeline
- User tries to import files

#### 5.3 Stripe Integration

**Setup:**
```bash
pnpm add @stripe/stripe-js stripe
```

**Create Stripe checkout session:**

File: `netlify/functions/create-checkout-session.ts`
```typescript
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const handler = async (event) => {
  const { priceId, userId } = JSON.parse(event.body!)

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    client_reference_id: userId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.URL}/subscription-success`,
    cancel_url: `${process.env.URL}/pricing`,
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId: session.id })
  }
}
```

---

### PHASE 6 — Pricing & Billing Models

#### 6.1 Subscription Tiers

**Monthly:**
- $9.99/month
- 7-day free trial
- Cancel anytime

**Annual (Best Value):**
- $59.99/year (save 50%)
- 14-day free trial
- Cancel anytime

**Lifetime:**
- $149 one-time payment
- No recurring charges
- Unlimited devices

#### 6.2 Optional Add-ons (Future v1.2+)

**Pro Packs:**
- Stem Separation Pack: $4.99/mo
- Advanced Timeline Pack: $2.99/mo
- Jam AI Pack: $6.99/mo
- Export Pack: $1.99/mo

**Education/Team Plans:**
- Student: $4.99/mo (50% off with .edu email)
- Teacher: $14.99/mo (up to 30 students)
- School License: Custom pricing
- Studio License: $49.99/mo (10 seats)

---

### PHASE 7 — Security Best Practices

#### 7.1 Web Security

- ⬜ All Stripe operations via Netlify functions (not client-side)
- ⬜ Supabase RLS policies prevent unauthorized access
- ⬜ No sensitive API keys in client code
- ⬜ HTTPS only (enforced by Netlify)
- ⬜ CSRF protection on forms

#### 7.2 Mobile Security

- ⬜ No price-checking in client JS
- ⬜ All entitlement validation via Supabase
- ⬜ Superwall handles App Store/Play Store receipt validation
- ⬜ No hardcoded subscription logic in app

#### 7.3 Database Security

- ⬜ Row Level Security (RLS) on all tables
- ⬜ Service role key only in Netlify functions
- ⬜ Anon key for client-side operations
- ⬜ No direct database access from clients

---

### PHASE 8 — Implementation Timeline

| Week | Task | Status |
|------|------|--------|
| **1** | Supabase project setup, schema, RLS policies | ⬜ |
| **2** | Web login/signup UI with Supabase Auth | ⬜ |
| **3** | Stripe integration + checkout flow | ⬜ |
| **4** | Netlify webhook handlers (Stripe + Superwall) | ⬜ |
| **5** | Entitlements logic (client + server) | ⬜ |
| **6** | Paywall UI + A/B test setup | ⬜ |
| **7** | Mobile Superwall integration | ⬜ |
| **8** | Beta launch with subscription | ⬜ |

---

### PHASE 9 — User Flows

#### 9.1 New User Signup (Web)

1. User visits Tone Path
2. Clicks "Start Listening" → Auth modal appears
3. User signs up with email or Google
4. Supabase creates account + profile
5. User gets 7-day free trial (FREE tier limits apply initially)
6. User hits 20-second limit → Paywall appears
7. User subscribes via Stripe
8. Netlify webhook updates Supabase → subscription_status = 'active'
9. App refreshes → unlocks PRO features

#### 9.2 Returning User Login

1. User logs in with email/magic link
2. Supabase returns session + profile
3. App checks entitlements
4. If PRO → unlock everything
5. If FREE → show limits

#### 9.3 Cross-Platform Sign-in

**Scenario:** User subscribes on iOS, then logs in on web

1. User logs in with same email on web
2. Supabase returns profile with `subscription_status: 'active'`
3. Web app unlocks PRO features
4. No repurchase needed

---

### PHASE 10 — Monetization Optimization

#### 10.1 Paywall Strategy

**3 Paywall Variations (A/B Test with Superwall):**

**Variant A:** Feature-focused
- "Unlimited Transcriptions"
- "Export to MIDI"
- "Advanced Chord Detection"

**Variant B:** Value-focused
- "Save 2 hours per week"
- "Learn songs 3x faster"
- "Professional-grade tools"

**Variant C:** Social proof
- "Join 10,000+ musicians"
- "4.8★ rating"
- "Used by pros at Berklee, Juilliard"

#### 10.2 Conversion Triggers

**When to show paywall:**
- ⬜ After 20 seconds of transcription (FREE limit)
- ⬜ When user clicks "Export"
- ⬜ When user tries to access timeline
- ⬜ After 3rd session (engagement-based)
- ⬜ When importing a file

**Trial messaging:**
- "Start your 7-day free trial"
- "No credit card required"
- "Cancel anytime"

#### 10.3 Retention Tactics

- ⬜ Email onboarding sequence (via Resend or Supabase Edge Functions)
- ⬜ Practice streak tracking
- ⬜ Weekly progress reports
- ⬜ Personalized tips based on instrument
- ⬜ Reminder to use trial before expiration

---

### PHASE 11 — Analytics & Metrics

#### 11.1 Track Key Metrics

**Acquisition:**
- Sign-ups per day
- Source (organic, ads, referral)

**Activation:**
- % who complete first transcription
- Time to first value

**Monetization:**
- Trial → paid conversion rate
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Churn rate

**Retention:**
- DAU/MAU (Daily/Monthly Active Users)
- Session length
- Practice frequency

#### 11.2 Tools

- ⬜ Superwall Analytics (paywall performance)
- ⬜ Supabase Analytics (auth, database usage)
- ⬜ Stripe Dashboard (revenue, churn)
- ⬜ Optional: PostHog or Mixpanel for product analytics

---

## 19. Next Steps — Start Web Implementation

Now that the plan is integrated, let's start building the web version with auth:

### Immediate Next Steps:

1. ⬜ Set up Supabase project
2. ⬜ Create database schema (profiles, song_library)
3. ⬜ Implement Supabase Auth in Next.js app
4. ⬜ Build login/signup UI
5. ⬜ Add auth guard to practice screens
6. ⬜ Set up Stripe for web subscriptions
7. ⬜ Create Netlify webhook for Stripe
8. ⬜ Implement entitlements logic
9. ⬜ Build paywall modal
10. ⬜ Test end-to-end flow

**Ready to start?**
