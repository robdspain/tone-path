# Atomic Design Migration Plan

This document outlines the migration strategy for reorganizing Tone Path's component structure according to Atomic Design principles.

## Current State

Components are currently flat in `src/components/` with some organization:
- Layout components in `src/components/layout/`
- Various visualization and feature components at the root level

## Target Structure

```
src/
├── tokens/                    # Design tokens (JSON, CSS vars, TS)
│   ├── design-tokens.json    # DTCG-compliant token definitions
│   ├── tokens.css            # Generated CSS custom properties
│   └── tokens.ts              # TypeScript token exports
├── components/
│   ├── atoms/                 # Primitive, indivisible components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Icon/
│   │   ├── Badge/
│   │   └── ThemeToggle/
│   ├── molecules/             # Simple component groupings
│   │   ├── SearchField/
│   │   ├── FileUpload/
│   │   ├── LiveNoteDisplay/
│   │   ├── SimpleTuner/
│   │   └── Controls/
│   ├── organisms/             # Complex, distinct UI sections
│   │   ├── PracticeShell/
│   │   ├── ChordChart/
│   │   ├── PianoRoll/
│   │   ├── Metronome/
│   │   ├── AudioVisualizer/
│   │   └── FretboardVisualizer/
│   └── templates/             # Page-level layouts
│       └── PracticeLayout/
└── pages/                     # Next.js pages (already exists)
```

## Migration Steps

### Phase 1: Design Tokens (Week 1)
- [x] Create `src/tokens/design-tokens.json` with DTCG schema
- [ ] Generate CSS custom properties from tokens
- [ ] Generate TypeScript exports from tokens
- [ ] Update `globals.css` to use token-based CSS vars
- [ ] Document token usage guidelines

### Phase 2: Identify Atoms (Week 1-2)
- [ ] Audit existing components for atomic candidates
- [ ] Extract primitive components (Button, Input, Icon, Badge)
- [ ] Refactor to use design tokens exclusively
- [ ] Add accessibility attributes (ARIA labels, roles, focus states)
- [ ] Create Storybook stories for atoms

**Candidate Atoms:**
- `ThemeToggle` → `atoms/ThemeToggle`
- `ErrorBoundary` → `atoms/ErrorBoundary` (or keep as utility)
- Extract button styles → `atoms/Button`
- Extract input styles → `atoms/Input`

### Phase 3: Identify Molecules (Week 2)
- [ ] Group related atoms into molecules
- [ ] Refactor components that combine 2-3 atoms
- [ ] Ensure molecules don't handle external layout
- [ ] Add Storybook stories

**Candidate Molecules:**
- `FileUpload` → `molecules/FileUpload`
- `SimpleTuner` → `molecules/SimpleTuner`
- `LiveNoteDisplay` → `molecules/LiveNoteDisplay`
- `Controls` → `molecules/Controls`

### Phase 4: Identify Organisms (Week 2-3)
- [ ] Move complex, feature-specific components
- [ ] Ensure organisms compose molecules/atoms
- [ ] Document data contracts and props
- [ ] Add Storybook stories with real data

**Candidate Organisms:**
- `PracticeShell` → `organisms/PracticeShell`
- `ChordChart` → `organisms/ChordChart`
- `PianoRoll` → `organisms/PianoRoll`
- `Metronome` → `organisms/Metronome`
- `AudioVisualizer` → `organisms/AudioVisualizer`
- `FretboardVisualizer` → `organisms/FretboardVisualizer`
- `ChordProgressionGrid` → `organisms/ChordProgressionGrid`
- `CircleOfFifths` → `organisms/CircleOfFifths`

### Phase 5: Templates & Pages (Week 3)
- [ ] Create `PracticeLayout` template
- [ ] Refactor pages to use templates
- [ ] Validate with real data
- [ ] Document template contracts

### Phase 6: Cleanup & Documentation (Week 4)
- [ ] Remove deprecated component files
- [ ] Update all imports across codebase
- [ ] Add component READMEs with purpose statements
- [ ] Create contribution guidelines
- [ ] Set up lint rules to enforce structure

## Component Classification Guide

### Is it an Atom?
- ✅ Single responsibility
- ✅ No external layout dependencies
- ✅ Uses only design tokens
- ✅ Fully accessible
- ✅ No business logic

### Is it a Molecule?
- ✅ Combines 2-3 atoms
- ✅ Simple, focused functionality
- ✅ No complex state management
- ✅ Predictable layout

### Is it an Organism?
- ✅ Complex, distinct UI section
- ✅ Composes multiple molecules/atoms
- ✅ May have business logic
- ✅ Feature-specific (e.g., "Metronome", "ChordChart")

### Is it a Template?
- ✅ Defines page structure/layout
- ✅ No hard-coded content
- ✅ Data contracts via props
- ✅ Reusable across pages

## Breaking Changes

### Import Path Updates
All component imports will need to be updated:

**Before:**
```typescript
import { Metronome } from '@/components/Metronome';
```

**After:**
```typescript
import { Metronome } from '@/components/organisms/Metronome';
```

### Component Exports
Create index files for easier imports:

```typescript
// src/components/organisms/index.ts
export { Metronome } from './Metronome';
export { ChordChart } from './ChordChart';
```

## Testing Strategy

1. **Unit Tests**: Atoms and molecules (props, states, accessibility)
2. **Visual Regression**: Key component variants
3. **Integration Tests**: Templates and pages with real data
4. **Accessibility**: Automated (axe-core) + manual keyboard/screen-reader checks

## Success Metrics

- [ ] All components use design tokens (no hard-coded values)
- [ ] Component hierarchy is clear and discoverable
- [ ] Storybook stories cover all components
- [ ] Zero accessibility violations
- [ ] Import paths are consistent
- [ ] New contributors can find components easily

## Notes

- Don't over-optimize boundaries; choose clarity over perfect taxonomy
- Some components may blur lines (molecule vs organism) - document the decision
- Migrate incrementally to avoid breaking the app
- Keep existing functionality working throughout migration
- Update this document as decisions are made

