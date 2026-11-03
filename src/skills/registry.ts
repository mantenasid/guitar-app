// Every practisable skill: what it measures, its four level thresholds, and what unlocks it.
// Skills are atomic (one chord, one change, one pattern, one scale) and build on each other.
import { ALL_CHORDS, ALL_PATTERNS, ALL_SCALES } from "@/content";
import { ALL_PAIRS } from "./changes";

export type SkillKind = "chord" | "change" | "strum" | "scale";

export interface Metric {
  /** Shown after values, e.g. "s" or "/min". */
  unit: string;
  /** Whether a bigger value is better (speed) or a smaller one (time). */
  better: "higher" | "lower";
  /** Value needed for levels 1–4. Level 4 is mastery. */
  levels: [number, number, number, number];
  /** How the game is described. */
  game: string;
}

export const MAX_LEVEL = 4;

export const METRICS: Record<SkillKind, Metric> = {
  // Chord recall: seconds from seeing the name to a clean shape.
  chord: { unit: "s", better: "lower", levels: [3, 2, 1.5, 1], game: "Chord recall" },
  // One-minute changes: clean switches per minute.
  change: { unit: "/min", better: "higher", levels: [20, 40, 60, 80], game: "One-minute changes" },
  // Tempo challenge: cleanest tempo in BPM.
  strum: { unit: "BPM", better: "higher", levels: [60, 80, 100, 120], game: "Tempo challenge" },
  scale: { unit: "BPM", better: "higher", levels: [60, 80, 100, 120], game: "Tempo challenge" },
};

export interface Skill {
  id: string;
  kind: SkillKind;
  title: string;
  /** Skills that must reach level 1 before this one unlocks. */
  requires: string[];
  /** Where to practise it. */
  href: string;
  /** Unit on the path, e.g. "Open chords". */
  unit: string;
}

/** Beginner-friendly order: two-finger Em first, three-finger shapes after. */
const CHORD_ORDER = ["Em", "Am", "E", "A", "D", "Dm", "G", "C", "E7", "A7", "D7", "B7", "G7", "C7", "E5", "A5", "D5",
  "E5/E6", "A5/A6", "D5/D6", "B5/B6", "F5", "F#5", "G5", "A5 (movable)", "B5", "C5", "D5 (movable)"];

const CHORD_UNIT = (key: string) =>
  ["Em", "Am", "E", "A", "D", "Dm", "G", "C"].includes(key) ? "Open chords" : key.includes("7") ? "Blues chords" : key.includes("/") ? "Shuffles" : "Power chords";

const chordId = (key: string) => `chord:${key}`;

function sequential<T>(items: T[], id: (t: T) => string): Map<string, string[]> {
  return new Map(items.map((t, i) => [id(t), i === 0 ? [] : [id(items[i - 1]!)]]));
}

const chordRequires = sequential(CHORD_ORDER, chordId);

export const SKILLS: Skill[] = [
  ...CHORD_ORDER.map(key => ({
    id: chordId(key),
    kind: "chord" as const,
    title: ALL_CHORDS.find(c => c.key === key)!.name,
    requires: chordRequires.get(chordId(key))!,
    href: `/play/recall?chord=${encodeURIComponent(key)}`,
    unit: CHORD_UNIT(key),
  })),
  ...ALL_PAIRS.map(p => ({
    id: `change:${p.key}`,
    kind: "change" as const,
    title: `${p.a} ↔ ${p.b}`,
    // You can only switch between chords you can already find.
    requires: [chordId(p.a), chordId(p.b)],
    href: `/transitions?pair=${encodeURIComponent(`${p.a}|${p.b}`)}`,
    unit: "Changes",
  })),
  ...ALL_PATTERNS.map((p, i) => ({
    id: `strum:${p.num}`,
    kind: "strum" as const,
    title: p.name,
    requires: i === 0 ? [] : [`strum:${ALL_PATTERNS[i - 1]!.num}`],
    href: `/strumming?pattern=${p.num}`,
    unit: "Strumming",
  })),
  ...ALL_SCALES.map((s, i) => ({
    id: `scale:${s.id}`,
    kind: "scale" as const,
    title: s.name,
    requires: i === 0 ? [] : [`scale:${ALL_SCALES[i - 1]!.id}`],
    href: `/scales/${s.id}`,
    unit: "Scales",
  })),
];

export const SKILL_BY_ID = new Map(SKILLS.map(s => [s.id, s]));

export const kindOf = (skillId: string) => skillId.split(":")[0] as SkillKind;

export function countByKind(kind: SkillKind) {
  return SKILLS.filter(s => s.kind === kind).length;
}

/** Level 0–4 for a best value. */
export function levelFor(kind: SkillKind, best: number | undefined): number {
  if (best === undefined) return 0;
  const m = METRICS[kind];
  return m.levels.filter(t => (m.better === "higher" ? best >= t : best <= t)).length;
}

/** Whether `value` beats `best` for this kind of skill. */
export function isBetter(kind: SkillKind, value: number, best: number | undefined): boolean {
  if (best === undefined) return true;
  return METRICS[kind].better === "higher" ? value > best : value < best;
}

export function formatValue(kind: SkillKind, value: number): string {
  return kind === "chord" ? `${value.toFixed(2)} s` : `${Math.round(value)} ${METRICS[kind].unit}`;
}
