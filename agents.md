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

## Atomic Design: Principles & Implementation

### What it is (quick definition)

Atomic Design is a method for building UI design systems by composing interfaces from five hierarchical levels: atoms → molecules → organisms → templates → pages. It promotes consistency, reusability, and clear structure while still validating components in real context.

### The five levels with examples

- **Atoms**: the smallest, indivisible UI parts (e.g., color tokens, typography styles, spacing units; primitive components like Button, Input, Icon).
- **Molecules**: simple groupings of atoms that function together (e.g., SearchField = Label + Input + IconButton).
- **Organisms**: relatively complex, distinct sections of UI (e.g., Header with logo, nav, search).
- **Templates**: page-level wireframes showing layout/regions without final content (structure, not copy).
- **Pages**: real content applied to templates to validate copy, edge cases, and fidelity.

⸻

### Core principles (the "why")

- **Composition over inheritance**: build small parts and compose them up the hierarchy.
- **Single source of truth via tokens**: centralize decisions like color, type, spacing, radius in design tokens to make themes and platforms consistent. The DTCG (W3C Community) publishes an interop spec for token formats.
- **Context matters**: validate components in templates/pages so they're tested with real content and flows—not just in isolation.
- **Consistency & scalability**: shared parts reduce divergence and speed up delivery as the system grows.

⸻

### Practical implementation guide

#### 1) Name & organize

- Keep names functional (what it is/does), not metaphorical.
- Example folders (map to Storybook categories if used):

```
/tokens                # color, type, space, radii, motion
/atoms                 # Button, Input, Avatar, Tag
/molecules             # SearchField, AvatarWithName, FormRow
/organisms             # AppHeader, ChatSidebar, MessageComposer
/templates             # DashboardTemplate, ChatLayout
/pages                 # /chat/[id], /settings
```

- Storybook: group stories under Atoms/, Molecules/, etc., but avoid bike-shedding boundaries—opt for clarity over perfect taxonomy.

#### 2) Design tokens (the real "atoms")

- Store tokens in DTCG JSON; generate platform artifacts (CSS vars, TS, iOS, Android).

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025-10.schema.json",
  "color": {
    "brand": { "primary": { "value": "#0EA5E9" } },
    "text":  { "default": { "value": "{color.neutral.900}" } }
  },
  "radius": { "md": { "value": "8px" } },
  "space":  { "2":  { "value": "8px" } }
}
```

- Build with Style Dictionary or equivalent to emit cross-platform assets.

#### 3) Component standards

- **Atoms**: single responsibility; no external layout; respect tokens; full a11y (labels, roles, focus).
- **Molecules/Organisms**: compose smaller parts; pass content via props/slots; keep layout predictable (no surprise margins).
- **Templates**: define regions & data contracts; avoid hard-coded content.
- **Pages**: fetch real data; handle loading/empty/error states; prove the design.

#### 4) Testing

- Unit: atoms/molecules (props, states).
- Visual regression: snapshots for key variants.
- Accessibility: automated (axe), plus manual keyboard/screen-reader checks.
- Integration: templates/pages with real data/fixtures.

#### 5) Governance & versioning

- RFC/change proposals for new components or breaking changes.
- Semantic versioning; changelogs with migration notes.
- Deprecation path (lint rules, codemods).
- Usage analytics: track component adoption, duplication hotspots.

⸻

### Applying it to Tone Path UIs (quick mapping)

- **Atoms**: Button, Badge, Icon, Input, Textarea, ThemeToggle, ErrorBoundary.
- **Molecules**: SearchField, FileUpload, LiveNoteDisplay, SimpleTuner, Controls.
- **Organisms**: PracticeShell, ChordChart, PianoRoll, Metronome, AudioVisualizer, FretboardVisualizer.
- **Templates**: PracticeLayout (shell + visualizer + controls + sidebar).
- **Pages**: `/` (index), `/admin`, `/404` with real practice session data.

⸻

### Do/Don't checklist

**Do**
- Centralize style decisions in tokens and wire components to them.
- Keep atoms dumb/pure; lift data and side-effects up.
- Validate components in pages with real content.
- Document props, a11y, examples, and edge cases in Storybook.

**Don't**
- Over-optimize labels like "is this a molecule or organism?" If unclear, choose the bucket that best serves discoverability. Common confusion between those two is normal.
- Treat templates as production pages (they're for structure).
- Bypass tokens with ad-hoc values (causes theme drift).

⸻

### Known pitfalls & how to avoid them

- **Fuzzy boundaries (molecule vs organism)**: write a one-line purpose statement in each README; organize for team comprehension, not metaphor purity.
- **Rigidity / context loss**: pair isolation (component dev) with page-context checks to keep components adaptable and experience-driven.
- **Stakeholder misunderstanding at scale**: publish a short contribution playbook (naming, review process, examples) and hold lightweight office hours.

⸻

### Quick start (copy/paste)

1. Add DTCG tokens → generate CSS vars/TS.
2. Build core atoms (Button, Input, Icon, Avatar) using tokens only.
3. Compose key molecules (SearchField, TagList) and organisms (Header, Composer).
4. Create one template per major layout and a demo page with real content to validate.
5. Wire up Storybook: Atoms/*, Molecules/*, …; add a11y and visual tests.

⸻

### Further reading

- Brad Frost, Atomic Design (free web book overview).
- Brad Frost, "Atomic Design and Storybook."
- Design Tokens Community Group (spec + schema).

---

## Handoff Notes
- Each agent exposes clear inputs/outputs; new contributors can tackle one agent without touching the others.
- When filing work, reference the agent name so design, product, and engineering stay aligned (e.g., "Jam Companion Agent: Add bossa pattern").
- Keep this document updated whenever an agent's scope or status changes to maintain a shared map of Tone Path's intelligent systems.
- Follow Atomic Design principles when creating new UI components: start with tokens, build atoms, compose molecules/organisms, validate in pages.
