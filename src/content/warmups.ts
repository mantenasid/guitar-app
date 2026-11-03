// Warm-ups for the fretting hand: finger independence, stretch and accuracy.
// Each exercise is a list of steps played one note per click, in order.
import type { Finger, StringNum } from "@/music/theory";

export interface WarmupStep {
  s: StringNum;
  f: number;
  finger: Finger;
}

export interface Warmup {
  id: string;
  title: string;
  /** What it works on. */
  tag: string;
  tip: string;
  /** First fret of the diagram window. */
  startFret: number;
  frets: number;
  steps: WarmupStep[];
}

const LOW_TO_HIGH: StringNum[] = [6, 5, 4, 3, 2, 1];

/** Every finger in `order` on each string, low E to high e, then back down. */
function spider(order: Finger[], fretFor: (finger: Finger, s: StringNum, i: number) => number, strings = LOW_TO_HIGH): WarmupStep[] {
  const up = strings.flatMap((s, i) => order.map(finger => ({ s, f: fretFor(finger, s, i), finger })));
  const down = [...strings].reverse().flatMap((s, i) => [...order].reverse().map(finger => ({ s, f: fretFor(finger, s, strings.length - 1 - i), finger })));
  return [...up, ...down];
}

/** One finger per fret, starting at `start`. */
const perFret = (start: number) => (finger: Finger) => start + finger - 1;

/** Two fingers in turn, four times each, for every pair. */
function trills(pairs: [Finger, Finger][], s: StringNum, start: number): WarmupStep[] {
  return pairs.flatMap(([a, b]) => Array.from({ length: 8 }, (_, i) => {
    const finger = i % 2 ? b : a;
    return { s, f: start + finger - 1, finger };
  }));
}

export const WARMUPS: Warmup[] = [
  {
    id: "spider-1234",
    title: "Spider 1-2-3-4",
    tag: "One finger per fret",
    tip: "Keep each finger down until the next string. Thumb behind the neck, fingertips just behind the fret.",
    startFret: 1,
    frets: 5,
    steps: spider([1, 2, 3, 4], perFret(1)),
  },
  {
    id: "spider-1324",
    title: "Spider 1-3-2-4",
    tag: "Finger independence",
    tip: "Skipping a finger is the point: the middle finger should wait without lifting off the string.",
    startFret: 1,
    frets: 5,
    steps: spider([1, 3, 2, 4], perFret(1)),
  },
  {
    id: "spider-1243",
    title: "Spider 1-2-4-3",
    tag: "Ring and little finger",
    tip: "The little finger goes before the ring finger. Go slowly; this one fights back.",
    startFret: 1,
    frets: 5,
    steps: spider([1, 2, 4, 3], perFret(1)),
  },
  {
    id: "diagonal",
    title: "Diagonal walk",
    tag: "Shifting",
    tip: "Move up one fret on every new string, then back down. Shift the whole hand, not just the fingers.",
    startFret: 1,
    frets: 9,
    steps: spider([1, 2, 3, 4], (finger, _s, i) => 1 + i + finger - 1),
  },
  {
    id: "trills-index",
    title: "Trills with the index",
    tag: "Strength",
    tip: "Hammer on and pull off between the two fingers on the G string. Keep the index down the whole time.",
    startFret: 5,
    frets: 5,
    steps: trills([[1, 2], [1, 3], [1, 4]], 3, 5),
  },
  {
    id: "trills-weak",
    title: "Trills, weak fingers",
    tag: "Strength",
    tip: "Middle, ring and little finger in pairs. Keep the fingers you aren't using hovering close to the string.",
    startFret: 5,
    frets: 5,
    steps: trills([[2, 3], [2, 4], [3, 4]], 3, 5),
  },
  {
    id: "string-skip",
    title: "String-skip spider",
    tag: "Picking accuracy",
    tip: "Jump a string, come back one, jump again. Mute the strings you skip with your picking hand.",
    startFret: 5,
    frets: 5,
    steps: spider([1, 2, 3, 4], perFret(5), [6, 4, 5, 3, 4, 2, 3, 1]),
  },
  {
    id: "stretch",
    title: "Wide stretch",
    tag: "Stretch",
    tip: "Index on 5, middle on 7, ring on 8, little on 9. Stop if anything hurts; reach comes with time.",
    startFret: 5,
    frets: 5,
    steps: spider([1, 2, 3, 4], finger => [0, 5, 7, 8, 9][finger]!),
  },
];

export const WARMUP_BY_ID: Record<string, Warmup> = Object.fromEntries(WARMUPS.map(w => [w.id, w]));
