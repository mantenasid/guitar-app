// Ear quiz questions as pure functions of a random source, so rounds are testable.
import type { EarStageId } from "@/content/ear";
import { NOTE_NAMES } from "@/music/theory";

export type Rng = () => number;

export interface EarQuestion {
  choices: string[];
  answer: string;
  /** Chords to play in turn, each as midi notes low to high. */
  chords: number[][];
  /** What was played, shown after answering. */
  reveal: string;
}

/** A chord the player knows, with the notes of its open voicing. */
export interface PoolChord {
  key: string;
  midis: number[];
}

export const ROUND_LENGTH = 10;

/** Six-string E-shape barre voicings, by semitones above the bass root. */
const QUALITIES = {
  Major: [0, 7, 12, 16, 19, 24],
  Minor: [0, 7, 12, 15, 19, 24],
  "Dominant 7": [0, 7, 10, 16, 19, 24],
} as const;
type Quality = keyof typeof QUALITIES;

const SUFFIX: Record<Quality, string> = { Major: "", Minor: "m", "Dominant 7": "7" };

const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]!;

/** Barre voicing with its bass between E2 and D#3, where a guitar plays it. */
export function barreVoicing(pitchClass: number, quality: Quality): number[] {
  const bass = 40 + ((pitchClass - 4 + 12) % 12);
  return QUALITIES[quality].map(i => bass + i);
}

const chordName = (pc: number, q: Quality) => `${NOTE_NAMES[pc % 12]}${SUFFIX[q]}`;

function qualityQuestion(rng: Rng, choices: Quality[]): EarQuestion {
  const pc = Math.floor(rng() * 12);
  const q = pick(rng, choices);
  return { choices, answer: q, chords: [barreVoicing(pc, q)], reveal: chordName(pc, q) };
}

/** Diatonic chords heard against the home chord, by semitones above it. */
const DEGREES = [
  { name: "IV", up: 5, quality: "Major" as Quality },
  { name: "V", up: 7, quality: "Major" as Quality },
  { name: "vi", up: 9, quality: "Minor" as Quality },
];

function changeQuestion(rng: Rng): EarQuestion {
  const home = Math.floor(rng() * 12);
  const d = pick(rng, DEGREES);
  const to = (home + d.up) % 12;
  return {
    choices: DEGREES.map(x => x.name),
    answer: d.name,
    chords: [barreVoicing(home, "Major"), barreVoicing(to, d.quality)],
    reveal: `${chordName(home, "Major")} → ${chordName(to, d.quality)}`,
  };
}

function chordQuestion(rng: Rng, pool: PoolChord[]): EarQuestion {
  const c = pick(rng, pool);
  return { choices: pool.map(p => p.key), answer: c.key, chords: [c.midis], reveal: c.key };
}

export function makeQuestion(stage: EarStageId, rng: Rng, pool: PoolChord[] = []): EarQuestion {
  switch (stage) {
    case "major-minor": return qualityQuestion(rng, ["Major", "Minor"]);
    case "quality": return qualityQuestion(rng, ["Major", "Minor", "Dominant 7"]);
    case "chords": return chordQuestion(rng, pool);
    case "changes": return changeQuestion(rng);
  }
}

/** A round of questions, never asking the same thing twice in a row. */
export function makeRound(stage: EarStageId, rng: Rng, pool: PoolChord[] = [], length = ROUND_LENGTH): EarQuestion[] {
  const out: EarQuestion[] = [];
  while (out.length < length) {
    const q = makeQuestion(stage, rng, pool);
    if (out.at(-1)?.reveal !== q.reveal) out.push(q);
  }
  return out;
}

/** Percent of answers that were right. */
export const scorePercent = (right: number, total: number) => (total === 0 ? 0 : Math.round((right / total) * 100));
