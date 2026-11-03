// One-minute chord changes: every transition pair, and progress towards 80.
import { ALL_CHORDS, TRANSITION_SECTIONS } from "@/content";

export const CHANGE_TARGET = 80;
/** Only full one-minute drills count towards the target. */
export const DRILL_SECONDS = 60;

/** Average speed needed for levels 1–3. Level 3 is the target. */
export const CHANGE_LEVELS = [40, 60, CHANGE_TARGET] as const;
/** Levels and current speed are averages of this many one-minute drills in a row. */
export const RECENT_DRILLS = 3;

const average = (values: readonly number[]) => Math.round(values.reduce((x, y) => x + y, 0) / values.length);

/** Current speed: the average of the last few drills (fewer while there aren't enough yet). */
export function currentSpeed(values: readonly number[]): number | undefined {
  return values.length ? average(values.slice(-RECENT_DRILLS)) : undefined;
}

/** Best average over RECENT_DRILLS drills in a row, so a level once reached is kept. */
export function bestAverage(values: readonly number[]): number | undefined {
  let best: number | undefined;
  for (let i = RECENT_DRILLS; i <= values.length; i++) best = Math.max(best ?? 0, average(values.slice(i - RECENT_DRILLS, i)));
  return best;
}

const levelOf = (avg: number | undefined) => (avg === undefined ? 0 : CHANGE_LEVELS.filter(t => avg >= t).length);

export interface Stage {
  name: string;
  hint: string;
  id: "s0" | "s1" | "s2" | "s3" | "s4" | "s5";
}

/** Not tried, then one stage per level. */
export const STAGES: Stage[] = [
  { name: "Not tried", hint: "", id: "s0" },
  { name: "Practising", hint: `under ${CHANGE_LEVELS[0]}`, id: "s2" },
  { name: "Level 1", hint: `${CHANGE_LEVELS[0]}+`, id: "s3" },
  { name: "Level 2", hint: `${CHANGE_LEVELS[1]}+`, id: "s4" },
  { name: "Mastered", hint: `${CHANGE_LEVELS[2]}+`, id: "s5" },
];

export function stageOf(level: number, tried: boolean): Stage {
  return tried ? STAGES[Math.min(level, CHANGE_LEVELS.length) + 1]! : STAGES[0]!;
}

/** Build up a few changes at a time from the current speed, stopping at the next level. */
export function nextGoal(current: number): number | null {
  if (!current) return null;
  if (current >= CHANGE_TARGET) return CHANGE_TARGET;
  const next = CHANGE_LEVELS.find(t => t > current) ?? CHANGE_TARGET;
  return Math.min(next, current + (current < 40 ? 5 : current < 60 ? 4 : 3));
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

/** What the change helpers need from a skill's progress. */
export interface PairProgress {
  current?: number;
  level: number;
  attempts: number;
}

export type PairSkills = ReadonlyMap<string, PairProgress>;

const UNTRIED: PairProgress = { level: 0, attempts: 0 };

export const pairProgress = (skills: PairSkills, a: string, b: string) => skills.get(changeSkillId(a, b)) ?? UNTRIED;

/** Current speed for a pair, 0 if not tried. */
export const speedFor = (skills: PairSkills, a: string, b: string) => pairProgress(skills, a, b).current ?? 0;

export function summarise(pairs: Pair[], skills: PairSkills) {
  const ps = pairs.map(p => pairProgress(skills, p.a, p.b));
  return {
    total: pairs.length,
    tried: ps.filter(p => p.attempts > 0).length,
    mastered: ps.filter(p => p.level >= CHANGE_LEVELS.length).length,
    /** Current speeds averaged over every pair, untried ones counting as 0. */
    average: ps.length ? average(ps.map(p => p.current ?? 0)) : 0,
  };
}

/**
 * Work through the list in order, finishing one section before the next:
 * the slowest pairs already started, plus one new pair to keep adding.
 */
export function suggestedPairs(skills: PairSkills, count = 3): Pair[] {
  const open = ALL_PAIRS.filter(p => pairProgress(skills, p.a, p.b).level < CHANGE_LEVELS.length);
  if (!open.length) return [];
  const first = Math.min(...open.map(p => p.sectionIndex));
  const pool = open.filter(p => p.sectionIndex === first);
  const tried = (p: Pair) => pairProgress(skills, p.a, p.b).attempts > 0;
  const started = pool.filter(tried).sort((x, y) => speedFor(skills, x.a, x.b) - speedFor(skills, y.a, y.b));
  const fresh = pool.filter(p => !tried(p));
  const picks = started.slice(0, count - (fresh.length ? 1 : 0));
  return picks.concat(fresh, started.slice(picks.length)).slice(0, count);
}

/** Feedback after a finished one-minute drill, given the drills before it (oldest first). */
export function drillFeedback(count: number, previous: readonly number[]): string {
  const all = [...previous, count];
  const current = currentSpeed(all)!;
  const before = levelOf(bestAverage(previous));
  const after = Math.max(before, levelOf(bestAverage(all)));
  const nextLevel = after < CHANGE_LEVELS.length ? ` Level ${after + 1} at ${CHANGE_LEVELS[after]}.` : "";
  if (after > before) return after >= CHANGE_LEVELS.length ? `Averaging ${current}: this change is mastered!` : `Level ${after} reached, averaging ${current}!${nextLevel}`;
  if (all.length < RECENT_DRILLS) {
    const left = RECENT_DRILLS - all.length;
    return `${previous.length ? `${count} this time.` : `Baseline set: ${count}.`} ${left} more drill${left === 1 ? "" : "s"} for your current speed.`;
  }
  const best = Math.max(...previous);
  const lead = count > best ? `New best: ${count}.` : `${count} this time.`;
  return `${lead} Current speed ${current}.${nextLevel || " Mastered: keep it there."}`;
}
