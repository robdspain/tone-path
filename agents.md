# Tone Path Agents

This document tracks the autonomous (or automation-ready) agents that power Tone Path’s practice workflow. Each agent bundles the logic, data contracts, and integration points needed to deliver a cohesive experience, making it easier to extend functionality or hand work to specialized contributors.

## Quick Reference

| Agent | Primary Goal | Status | Key Code Anchors | Immediate Next Step |
| --- | --- | --- | --- | --- |
| Transcription Agent | Convert live audio into normalized note events | ✅ Shipping | `src/hooks/usePitchDetection.ts`, `src/hooks/useAudioInput.ts` | Host CREPE model to unlock ML mode |
| Harmony Agent | Aggregate notes into chord changes with confidence scoring | ✅ Shipping | `src/hooks/useChordDetection.ts` | Add minor 9 / altered chord templates |
| Playback Agent | Turn captured events into synchronized playback | ✅ Shipping | `src/hooks/usePlayback.ts`, Tone.js | Expose swing/feel presets |
| Export Agent | Produce shareable artifacts (MIDI, MusicXML, JSON) | ✅ Shipping | `src/utils/convertToMIDI.ts`, `src/utils/convertToMusicXML.ts` | Add MusicXML articulations |
| Import Concierge Agent | Pull note data from external (YouTube) sources | ⚠️ Server dependent | `src/components/YouTubeImport.tsx`, `netlify/functions/youtube-audio` | Provision yt-dlp in Netlify build |
| Jam Companion Agent | Generate AI backing tracks that follow the player | 🛠️ Foundation only | `src/hooks/useJamAI.ts`, `src/lib/ai/magenta.ts` | Finish Magenta.js integration |

---

## 1. Transcription Agent
- **Mission**: Deliver low-latency note events for visualizations, tuners, and exports.
- **Inputs**: Microphone stream via `useAudioInput`, user-selected instrument profile.
- **Pipeline**: Autocorrelation pitch detection with optional CREPE model (pending hosted weights), smoothing/quantization, and event emission.
- **Outputs**: `NoteEvent` objects consumed by visualization layers, chord detection, exports.
- **Risks / Needs**:
  - Hosting for `/public/models/crepe/*` to enable ML detection.
  - Device calibration presets (brass vs. guitar) to reduce octave jumps.

## 2. Harmony Agent
- **Mission**: Interpret batched note events into musically useful chord labels.
- **Inputs**: Sliding window of note events from the Transcription Agent.
- **Pipeline**: Pattern matching across an expanded chord dictionary (~30 shapes) plus confidence scoring and duplicate filtering.
- **Outputs**: Time-stamped chord changes for UI overlays and export metadata.
- **Next Focus**:
  - Extend library to cover minor 9, altered dominants, and quartal voicings.
  - Surface confidence to UI so users know when a chord is uncertain.

## 3. Playback Agent
- **Mission**: Reconstruct recorded sessions with Tone.js instruments for review.
- **Inputs**: Normalized note timeline, tempo, transport state.
- **Pipeline**: Schedules Tone.js synth voices, tracks cursor position, exposes `play/pause/stop`.
- **Outputs**: Audible playback plus transport events used by the UI.
- **Opportunities**:
  - Allow feel presets (straight, swing, double-time).
  - Persist playback settings per session.

## 4. Export Agent
- **Mission**: Let musicians leave with artifacts they can reuse elsewhere.
- **Capabilities**:
  - MIDI via `midi-writer-js`.
  - MusicXML 3.1 with measures, tempo, and chord annotations.
  - JSON session dumps for debugging.
- **Upcoming Enhancements**:
  - MusicXML articulations/dynamics.
  - Batch export that bundles MIDI + MusicXML + JSON.

## 5. Import Concierge Agent
- **Mission**: Translate online references (currently YouTube audio) into Tone Path sessions.
- **Flow**:
  1. `YouTubeImport.tsx` captures URLs and shows progress/errors.
  2. Netlify function `youtube-audio` (Python via yt-dlp) downloads and returns audio buffers.
  3. Audio feeds directly into the Transcription Agent for processing.
- **Dependencies**: yt-dlp availability in the Netlify runtime; user-supplied API quotas if expanded beyond YouTube.
- **Next Step**: Lock in a deployment path for yt-dlp (either layer, dockerized build, or prebuilt binary).

## 6. Jam Companion Agent
- **Mission**: Provide an adaptive backing band so practice sessions feel musical.
- **Current State**:
  - `useJamAI.ts` orchestrates timing and interacts with `generateBandPattern`.
  - `src/lib/ai/magenta.ts` has a pattern-based fallback and scaffolding for Magenta.js.
- **Roadmap**:
  1. Add `@magenta/music` dependency and implement `generateWithMagenta`.
  2. Let the agent subscribe to chord changes to reharmonize in real time.
  3. Surface parameters (style, intensity) in the UI.
- **Risks**: Model bundle size (needs code splitting) and deterministic timing on low-end devices.

---

## Handoff Notes
- Each agent exposes clear inputs/outputs; new contributors can tackle one agent without touching the others.
- When filing work, reference the agent name so design, product, and engineering stay aligned (e.g., “Jam Companion Agent: Add bossa pattern”).
- Keep this document updated whenever an agent’s scope or status changes to maintain a shared map of Tone Path’s intelligent systems.
