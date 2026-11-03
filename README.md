# Woodshed

Learn guitar through small, timed games: chords, chord changes (target: 80 clean changes a minute), strumming patterns and scales.

Installable web app (PWA) that works offline. Progress is stored on the device.

## How the game works

Every skill is atomic and measured, with four levels:

| Skill | Game | Levels 1 / 2 / 3 / 4 (mastered) |
| --- | --- | --- |
| Chord shape | Chord recall: time from name to clean shape | 3 / 2 / 1.5 / 1 s |
| Chord change | One-minute changes | 20 / 40 / 60 / 80 a minute |
| Strum pattern | Tempo challenge | 60 / 80 / 100 / 120 BPM |
| Scale | Tempo challenge | 60 / 80 / 100 / 120 BPM |

Reaching level 1 unlocks what comes next (the next chord, changes between chords you know, the next pattern or scale). Attempts earn XP, with bonuses for personal bests and level-ups. The home screen builds a daily plan from reviews that are due (spaced repetition), skills close to their next level, and new unlocks. All progress is worked out from saved attempts by pure functions in `src/skills/progress.ts`.

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
