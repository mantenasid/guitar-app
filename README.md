# Guitar Practice

Learn guitar through small, timed games: chords, chord changes (target: 80 clean changes a minute), strumming patterns and scales.

Installable web app (PWA) that works offline. Progress is stored on the device.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # unit tests
pnpm build      # typecheck + production build into dist/
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · Zustand (settings) · Dexie/IndexedDB (progress) · Web Audio (synthesised guitar, metronome) · Vitest.

## Layout

```
src/
  content/     Teaching content as typed data: chords, transitions, strumming, scales
  music/       Theory (notes, tuning) and shape maths (voicings, scale runs, steps)
  audio/       Guitar synth, playback controller, strumming scheduler
  progress/    IndexedDB (attempts, learned skills, practice time) and settings
  skills/      Skill registry and the one-minute-changes rules
  components/  App shell, fretboard diagram, shared UI
  features/    One folder per screen
legacy/        The original HTML pages, kept for reference
scripts/       One-off scripts that converted the legacy content
```

Diagrams colour each dot by fretting finger (index amber, middle purple, ring blue, little burnt orange); a dark ring marks the root.
