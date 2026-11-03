// Every practisable skill: what it measures, its level thresholds, and what unlocks it.
// Skills are atomic (one chord, one change, one pattern, one scale) and build on each other.
import { ALL_CHORDS, ALL_PATTERNS, ALL_SCALES } from "@/content";
import { NOTE_SETS } from "@/content/fretboard";
import { ARPEGGIOS } from "@/content/arpeggios";
import { EAR_STAGES } from "@/content/ear";
import { PICK_PATTERNS } from "@/content/fingerpicking";
import { PROGRESSIONS, progressionChanges } from "@/content/progressions";
import { WARMUPS } from "@/content/warmups";
import { ALL_PAIRS, CHANGE_LEVELS, changeSkillId } from "./changes";

export type SkillKind = "chord" | "change" | "strum" | "scale" | "note" | "warmup" | "pick" | "arp" | "ear" | "prog";

export interface Metric {
  /** Shown after values, e.g. "s" or "/min". */
  unit: string;
  /** Whether a bigger value is better (speed) or a smaller one (time). */
  better: "higher" | "lower";
  /** Value needed for each level, from level 1. The last level is mastery. */
  levels: readonly number[];
  /** How the game is described. */
  game: string;
}

/** Most levels any skill has. Changes have fewer: see maxLevel. */
export const MAX_LEVEL = 4;

export const METRICS: Record<SkillKind, Metric> = {
  // Chord recall: seconds from seeing the name to a clean shape.
  chord: { unit: "s", better: "lower", levels: [3, 2, 1.5, 1], game: "Chord recall" },
  // One-minute changes: clean switches per minute, averaged over three drills in a row.
  change: { unit: "/min", better: "higher", levels: CHANGE_LEVELS, game: "One-minute changes" },
  // Tempo challenge: cleanest tempo in BPM.
  strum: { unit: "BPM", better: "higher", levels: [60, 80, 100, 120], game: "Tempo challenge" },
  scale: { unit: "BPM", better: "higher", levels: [60, 80, 100, 120], game: "Tempo challenge" },
  // Note finder: notes named correctly in a one-minute round.
  note: { unit: "/min", better: "higher", levels: [10, 20, 30, 40], game: "Note finder" },
  warmup: { unit: "BPM", better: "higher", levels: [60, 80, 100, 120], game: "Tempo challenge" },
  pick: { unit: "BPM", better: "higher", levels: [60, 80, 100, 120], game: "Tempo challenge" },
  arp: { unit: "BPM", better: "higher", levels: [60, 80, 100, 120], game: "Tempo challenge" },
  // Ear quiz: percent right in a round of ten.
  ear: { unit: "%", better: "higher", levels: [70, 80, 90, 100], game: "Ear quiz" },
  // Play-along: cleanest tempo through the whole progression.
  prog: { unit: "BPM", better: "higher", levels: [60, 80, 100, 120], game: "Play-along" },
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
const BARRE_CHORDS = ["Fmaj7", "Dm7", "F (mini)", "F", "Fm", "F7", "G (barre)", "Bm7", "Bm", "Bb", "C (barre)"];

const CHORD_ORDER = ["Em", "Am", "E", "A", "D", "Dm", "G", "C", "E7", "A7", "D7", "B7", "G7", "C7", "E5", "A5", "D5",
  "E5/E6", "A5/A6", "D5/D6", "B5/B6", "F5", "F#5", "G5", "A5 (movable)", "B5", "C5", "D5 (movable)", ...BARRE_CHORDS];

const CHORD_UNIT = (key: string) =>
  BARRE_CHORDS.includes(key) ? "Barre chords"
  : ["Em", "Am", "E", "A", "D", "Dm", "G", "C"].includes(key) ? "Open chords"
  : key.includes("7") ? "Blues chords" : key.includes("/") ? "Shuffles" : "Power chords";

const chordId = (key: string) => `chord:${key}`;

function sequential<T>(items: T[], id: (t: T) => string): Map<string, string[]> {
  return new Map(items.map((t, i) => [id(t), i === 0 ? [] : [id(items[i - 1]!)]]));
}

/** Barre chords branch off once the open chords are done, instead of waiting for the power chords. */
const BARRE_START = chordId("C");

const chordRequires = new Map([
  ...sequential(CHORD_ORDER.filter(k => !BARRE_CHORDS.includes(k)), chordId),
  ...sequential(BARRE_CHORDS, chordId),
]);
chordRequires.set(chordId(BARRE_CHORDS[0]!), [BARRE_START]);

const PAIR_IDS = new Set(ALL_PAIRS.map(p => `change:${p.key}`));

/** Every change in the progression at level 1; chords whose change has no drill just need to be known. */
function progRequires(bars: string[], changes: [string, string][]): string[] {
  const ids = changes.map(([a, b]) => changeSkillId(a, b)).filter(id => PAIR_IDS.has(id));
  const covered = new Set(changes.filter(([a, b]) => PAIR_IDS.has(changeSkillId(a, b))).flat());
  return [...ids, ...[...new Set(bars)].filter(c => !covered.has(c)).map(chordId)];
}

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
  ...NOTE_SETS.map((n, i) => ({
    id: `note:${n.id}`,
    kind: "note" as const,
    title: n.title,
    requires: i === 0 ? [] : [`note:${NOTE_SETS[i - 1]!.id}`],
    href: `/fretboard?set=${n.id}`,
    unit: "Fretboard notes",
  })),
  ...WARMUPS.map((w, i) => ({
    id: `warmup:${w.id}`,
    kind: "warmup" as const,
    title: w.title,
    requires: i === 0 ? [] : [`warmup:${WARMUPS[i - 1]!.id}`],
    href: `/warmups?ex=${w.id}`,
    unit: "Warm-ups",
  })),
  ...PICK_PATTERNS.map((p, i) => ({
    id: `pick:${p.id}`,
    kind: "pick" as const,
    title: p.name,
    requires: i === 0 ? [] : [`pick:${PICK_PATTERNS[i - 1]!.id}`],
    href: `/fingerpicking?pattern=${p.id}`,
    unit: "Fingerpicking",
  })),
  ...ARPEGGIOS.map((a, i) => ({
    id: `arp:${a.id}`,
    kind: "arp" as const,
    title: a.title,
    // Arpeggios open once the first scale is clean, so single notes in time come first.
    requires: i === 0 ? [`scale:${ALL_SCALES[0]!.id}`] : [`arp:${ARPEGGIOS[i - 1]!.id}`],
    href: `/arpeggios?arp=${a.id}`,
    unit: "Arpeggios",
  })),
  ...EAR_STAGES.map((e, i) => ({
    id: `ear:${e.id}`,
    kind: "ear" as const,
    title: e.title,
    // Listening needs no technique, so the first stage is open from day one.
    requires: i === 0 ? [] : [`ear:${EAR_STAGES[i - 1]!.id}`],
    href: `/ear?stage=${e.id}`,
    unit: "Ear training",
  })),
  ...PROGRESSIONS.map(p => ({
    id: `prog:${p.id}`,
    kind: "prog" as const,
    title: `${p.title} in ${p.key}`,
    requires: progRequires(p.bars, progressionChanges(p)),
    href: `/progressions?prog=${p.id}`,
    unit: "Play-along",
  })),
];

export const SKILL_BY_ID = new Map(SKILLS.map(s => [s.id, s]));

export const kindOf = (skillId: string) => skillId.split(":")[0] as SkillKind;

export function countByKind(kind: SkillKind) {
  return SKILLS.filter(s => s.kind === kind).length;
}

/** Number of levels for a kind of skill; reaching it means mastered. */
export const maxLevel = (kind: SkillKind) => METRICS[kind].levels.length;

/** Level from 0 to maxLevel(kind) for a value. */
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
  if (kind === "chord") return `${value.toFixed(2)} s`;
  const unit = METRICS[kind].unit;
  return unit === "%" ? `${Math.round(value)}%` : `${Math.round(value)} ${unit}`;
}
