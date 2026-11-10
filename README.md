# Woodshed

Learn guitar through small, timed games: chords, chord changes (target: 80 clean changes a minute), strumming patterns and scales.

Installable web app (PWA) that works offline. Progress is stored on the device.

## How it works

**Practice** builds a short session each day from your own progress: a warm-up, skills due for review (spaced repetition), the ones closest to their next level, and one new thing per area. A session walks you through them in order with a timer on each.

**Gym** has every drill by area. Each skill is atomic and measured, with levels:

| Skill | Drill | Levels |
| --- | --- | --- |
| Chord shape | Ring check (every string sounds), then chord recall: time from name to clean shape | 3 / 2 / 1.5 / 1 s |
| Chord change | One-minute changes, counted by the mic | 40 / 60 / 80 a minute |
| Strum, picking pattern, play-along | Tempo ladder | 60 / 80 / 100 / 120 BPM |
| Warm-up, scale, arpeggio | Note walk (right notes, no tempo), then tempo ladder | 60 / 80 / 100 / 120 BPM |
| Fretboard notes | Note finder | 10 / 20 / 30 / 40 a minute |
| Ear | Ten-question quiz | 70 / 80 / 90 / 100% |

The **tempo ladder** is the core loop: play in time, and with the mic on the app checks how many of your notes landed (`landedScore` in `src/skills/timing.ts`). Land 80% and the tempo steps up 4 BPM by itself. Without a mic you mark a tempo clean yourself.

Reaching level 1 unlocks what comes next. Attempts earn XP, with bonuses for personal bests and level-ups. All progress is worked out from saved attempts by pure functions in `src/skills/progress.ts`.

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
