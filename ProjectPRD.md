## Project PRD — Unified Minimal Interface

### 1. Problem Statement
Tone Path currently offers a powerful feature set—live transcription, chord/harmony tracking, jam assistance, imports, and exports—but the surface area has grown organically. Users on smaller screens (tablets, phones) must scroll through stacked widgets, while desktop users see dense clusters that compete for attention. We need a single, minimal interface that preserves every existing capability yet feels intuitive, consistent, and responsive across desktop, tablet, and mobile.

### 2. Goals
1. Deliver a single responsive layout that keeps recording, transcription visuals, smart jam, imports, and exports accessible without extra navigation.
2. Prioritize “practice flow” (listen → visualize → control → export) with zero hidden functionality.
3. Ensure controls remain thumb-friendly on touch devices while retaining precision on desktop.
4. Provide obvious affordances for auxiliary tools (tuner, metronome, presets, loop controller) without overwhelming the main canvas.

### 3. Design Principles
- **Minimal surfaces**: One primary canvas, one utility rail, one bottom transport.
- **Progressive disclosure**: Advanced panels slide in/out (sheet/export, jam settings, imports) but never remove access to core actions.
- **Consistency**: Shared typography scale, neutral background, accent color reserved for state (recording, active loop, AI jam).
- **Touch parity**: All controls ≥44 px tappable; sliders + toggles support gesture input.
- **Latency-first**: Visualizations stay within a single canvas to avoid layout shifts that could impact rendering performance.

### 4. Layout Overview
```
┌─────────────────────────────────────────────┐
│ Global Practice Bar                         │
├─────────────┬───────────────────────────────┤
│ Utility Rail │ Primary Practice Canvas       │
│ (stacked)    │                               │
│              │                               │
│              │                               │
│              │                               │
├─────────────┴───────────────────────────────┤
│ Transport & Actions Dock                    │
└─────────────────────────────────────────────┘
```

#### 4.1 Global Practice Bar (persistent top)
- Left: App identity + quick instrument selector (maps to `instrument` state).
- Center: Status pills (Listening, Recording, Smart Jam, Import) with live feedback from hooks `useAudioStream`, `useRecorder`, `useJamAI`.
- Right: Preset manager, theme toggle, overflow for account/settings.

#### 4.2 Utility Rail (left column on desktop, top tab bar on tablet/mobile)
Stack vertically on desktop; convert to segmented control (tabs) on smaller viewports. Modules:
1. **Session Stack**: Song library (`SongLibrary`), file upload (`FileUpload`), YouTube import (`YouTubeImport`).
2. **Practice Tools**: Tuner, metronome, loop controller, preset manager, Jam AI controls.
3. **Learning Insights**: Feedback HUD, progress chart, practice targets.
Each module collapses to icon + label; expands on demand without covering primary canvas.

#### 4.3 Primary Practice Canvas
- **Mode switcher** (pills) toggles between three visual focus states:
  1. **Live View**: Audio visualizer + live note display + chord stream overlay stacked vertically.
  2. **Timeline View**: Piano roll + chord chart + fretboard visualizer for recorded/imported material.
  3. **Jam View**: Smart Jam panel with AI accompaniment timeline plus metering from `usePlaybackVisualizer`.
- The selected mode fills the canvas; inactive panels remain accessible through mini-previews at the bottom edge.
- Canvas uses responsive CSS grid to ensure waveform + piano roll adapt to available width (two columns on desktop, single column on mobile).

#### 4.4 Transport & Actions Dock (bottom sticky)
- Primary CTA row: Listen/Stop, Record, Play/Pause, Export (split button for MIDI/MusicXML/JSON), Save.
- Secondary row (collapsible): Tempo slider, swing preset, loop in/out, CREPE toggle, latency/sensitivity knobs.
- On mobile, convert to two rows of icon buttons with labels; record remains centered and red for clarity.

### 5. Responsive Behavior
| Breakpoint | Treatment |
| --- | --- |
| ≥1200px (Desktop) | Three-column grid (Utility rail 280px, canvas flexible, optional secondary insights). Transport dock spans full width. |
| 768–1199px (Tablet) | Utility rail becomes horizontal tab strip pinned under global bar; canvas switches to stacked layout; transport dock uses two-line arrangement. |
| ≤767px (Mobile) | Global bar shrinks to two rows (status pills wrap); utility modules accessible via bottom sheet launched from FAB; canvas uses swipeable views for Live/Timeline/Jam; transport buttons become large floating bar with thumb spacing. |

### 6. Functional Requirements
1. **Parity with existing components**: Every feature exposed in `src/pages/index.tsx` remains available from the new layout.
2. **State continuity**: Switching views or collapsing modules must not reset ongoing processes (recording, playback, jam generation, imports).
3. **Modular slots**: Components (e.g., `ProgressChart`, `FeedbackHUD`) drop into predefined slots so future features can reuse patterns.
4. **Offline + PWA safe**: Layout must avoid heavy dynamic imports that could slow first paint; rely on CSS/grid for responsiveness.
5. **Accessibility**: Keyboard navigable (logical tab order), sufficient contrast, aria labels on icon-only buttons, screen-reader announcements for recording state changes.

### 7. Success Metrics
- Time to first recording on mobile ≤ 15 seconds (measured via usability tests).
- ≥80% of beta users describe the interface as “easy to find things” (survey prompt).
- No feature regressions reported vs. previous UI after two weeks in dogfood.
- Layout renders within 1 animation frame during live transcription (monitor FPS dip <5%).

### 8. Technical Notes
- Leverage existing Tailwind setup; define layout primitives (global bar, rail, dock) in a `PracticeShell` component to wrap `Home`.
- Use CSS grid + flexbox; avoid heavy JS layout thrash.
- Share breakpoint constants via `styles/tokens.css` or Tailwind config to keep hooks/components aligned.
- Introduce a lightweight view state store (e.g., `usePracticeLayout` hook) so different components can react to mode/viewport changes without prop drilling.

### 9. Open Questions
1. Do we need a dedicated “coach” persona mode that hides advanced tools, or is the single layout sufficient?
2. Should Smart Jam controls live in the utility rail or inline with the Jam View for quicker tweaking?
3. Do we surface import progress in the global bar or as a toast for clarity on small screens?

### 10. Timeline & Owners
- **Design prototype**: 1 week (high-fidelity mock for each breakpoint).
- **Implementation**: 2 sprints (shell, responsive behaviors, QA).
- **Owner**: Frontend team (Tone Path web) with design support for responsive states.
