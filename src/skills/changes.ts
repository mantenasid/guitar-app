// One-minute chord changes: every transition pair, and progress towards 80.
import { ALL_CHORDS, TRANSITION_SECTIONS } from "@/content";

export const CHANGE_TARGET = 80;
/** Only full one-minute drills count towards the target. */
export const DRILL_SECONDS = 60;

export interface Stage {
  min: number;
  name: string;
  id: "s0" | "s1" | "s2" | "s3" | "s4" | "s5";
}

export const STAGES: Stage[] = [
  { min: 80, name: "Mastered", id: "s5" },
  { min: 60, name: "Fluent", id: "s4" },
  { min: 40, name: "Solid", id: "s3" },
  { min: 20, name: "Building", id: "s2" },
  { min: 1, name: "Learning", id: "s1" },
  { min: 0, name: "Not tried", id: "s0" },
];

export function stageOf(best: number): Stage {
  return STAGES.find(s => best >= s.min)!;
}

/** Build up a few changes at a time, with smaller steps near the top. */
export function nextGoal(best: number): number | null {
  if (!best) return null;
  if (best >= CHANGE_TARGET) return CHANGE_TARGET;
  return Math.min(CHANGE_TARGET, best + (best < 40 ? 5 : best < 60 ? 4 : 3));
}

const ORDER = new Map(ALL_CHORDS.map((c, i) => [c.key, i]));

/** A pair is stored once whichever way round it is drilled: "A|D" == "D|A". */
export function pairKey(a: string, b: string): string {
  return (ORDER.get(a) ?? 0) <= (ORDER.get(b) ?? 0) ? `${a}|${b}` : `${b}|${a}`;
}

export const changeSkillId = (a: string, b: string) => `change:${pairKey(a, b)}`;

export interface Pair {
  key: string;
  a: string;
  b: string;
  section: string;
  sectionIndex: number;
}

/** Every distinct pair in learning order. */
export const ALL_PAIRS: Pair[] = (() => {
  const seen = new Map<string, Pair>();
  TRANSITION_SECTIONS.forEach((sec, sectionIndex) =>
    sec.rows.forEach(row =>
      row.pairs.forEach(([a, b]) => {
        const key = pairKey(a, b);
        if (!seen.has(key)) seen.set(key, { key, a, b, section: sec.id, sectionIndex });
      }),
    ),
  );
  return [...seen.values()];
})();

export type Bests = ReadonlyMap<string, number>;

export const bestFor = (bests: Bests, a: string, b: string) => bests.get(changeSkillId(a, b)) ?? 0;

export function summarise(pairs: Pair[], bests: Bests) {
  const values = pairs.map(p => bestFor(bests, p.a, p.b));
  return {
    total: pairs.length,
    tried: values.filter(v => v > 0).length,
    mastered: values.filter(v => v >= CHANGE_TARGET).length,
    average: values.length ? Math.round(values.reduce((x, y) => x + y, 0) / values.length) : 0,
  };
}

/**
 * Work through the list in order, finishing one section before the next:
 * the weakest pairs already started, plus one new pair to keep adding.
 */
export function suggestedPairs(bests: Bests, count = 3): Pair[] {
  const open = ALL_PAIRS.filter(p => bestFor(bests, p.a, p.b) < CHANGE_TARGET);
  if (!open.length) return [];
  const first = Math.min(...open.map(p => p.sectionIndex));
  const pool = open.filter(p => p.sectionIndex === first);
  const started = pool.filter(p => bestFor(bests, p.a, p.b) > 0).sort((x, y) => bestFor(bests, x.a, x.b) - bestFor(bests, y.a, y.b));
  const fresh = pool.filter(p => !bestFor(bests, p.a, p.b));
  const picks = started.slice(0, count - (fresh.length ? 1 : 0));
  return picks.concat(fresh, started.slice(picks.length)).slice(0, count);
}

/** Feedback after a finished one-minute drill. */
export function drillFeedback(count: number, previousBest: number): string {
  if (count >= CHANGE_TARGET) return `${count}! This change is mastered.`;
  if (!previousBest) return `Baseline set: ${count}. Next goal ${nextGoal(count)}.`;
  const goal = nextGoal(previousBest);
  if (goal && count >= goal) return `Goal hit with ${count}! Next goal ${nextGoal(count)}.`;
  if (count > previousBest) return `New best: ${count}. Keep going for ${nextGoal(count)}.`;
  return `${count} this time. Best is ${previousBest}: slow down and keep it clean.`;
}
