// Levels, XP, unlocks and the daily plan, all worked out from saved attempts.
// Pure functions: the same attempts always give the same progress.
import type { Attempt } from "@/progress/db";
import { bestAverage, currentSpeed } from "./changes";
import { METRICS, SKILLS, isBetter, kindOf, levelFor, maxLevel, type Skill, type SkillKind } from "./registry";

export const DAILY_XP_GOAL = 50;

/** XP rules. Effort XP is capped per skill per day so grinding one thing doesn't pay. */
export const XP = {
  attempt: 3,
  attemptsPerDay: 10,
  firstTry: 5,
  newBest: 5,
  /** Reaching level n pays perLevel × n, so later levels are worth more. */
  perLevel: 10,
  learnedTick: 5,
} as const;

export interface AttemptScore {
  xp: number;
  newBest: boolean;
  levelBefore: number;
  levelAfter: number;
}

/** Best single value, direction-aware. */
function bestOf(kind: SkillKind, values: readonly number[]): number | undefined {
  let best: number | undefined;
  for (const v of values) if (isBetter(kind, v, best)) best = v;
  return best;
}

/**
 * The value a level is judged on, from values in the order they were played.
 * Changes use the best average of RECENT_DRILLS drills in a row, so one lucky
 * minute doesn't count but a level, once reached, is kept. Others use the best value.
 */
export function levelValue(kind: SkillKind, values: readonly number[]): number | undefined {
  return kind === "change" ? bestAverage(values) : bestOf(kind, values);
}

/** What one attempt earns, given the values before it (oldest first) and how many tries today. */
export function scoreAttempt(kind: SkillKind, value: number, prevValues: readonly number[], triesTodayBefore: number): AttemptScore {
  const prevBest = bestOf(kind, prevValues);
  const levelBefore = levelFor(kind, levelValue(kind, prevValues));
  const levelAfter = Math.max(levelBefore, levelFor(kind, levelValue(kind, [...prevValues, value])));
  const better = isBetter(kind, value, prevBest);
  let xp = triesTodayBefore < XP.attemptsPerDay ? XP.attempt : 0;
  if (prevBest === undefined) xp += XP.firstTry;
  else if (better) xp += XP.newBest;
  for (let l = levelBefore + 1; l <= levelAfter; l++) xp += XP.perLevel * l;
  return { xp, newBest: prevBest !== undefined && better, levelBefore, levelAfter };
}

export interface SkillProgress {
  /** Best single attempt. */
  best?: number;
  /** Changes only: average of the last RECENT_DRILLS drills. */
  current?: number;
  /** 0 to maxLevel(kind). A "learned" tick counts as at least level 1. */
  level: number;
  attempts: number;
  lastAt?: number;
  learned: boolean;
  unlocked: boolean;
}

export interface Progress {
  skills: Map<string, SkillProgress>;
  xp: number;
  xpToday: number;
  /** Best value per skill, direction-aware. */
  bests: Map<string, number>;
}

export function localDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeProgress(attempts: Attempt[], learned: { skillId: string; at: number }[], now = Date.now()): Progress {
  const today = localDay(now);
  const raw = new Map<string, { best?: number; values: number[]; lastAt?: number }>();
  const triesPerDay = new Map<string, number>();
  let xp = 0;
  let xpToday = 0;

  for (const a of [...attempts].sort((x, y) => x.at - y.at)) {
    const kind = kindOf(a.skillId);
    if (!METRICS[kind]) continue;
    const s = raw.get(a.skillId) ?? { values: [] };
    const dayKey = `${a.skillId}@${localDay(a.at)}`;
    const score = scoreAttempt(kind, a.value, s.values, triesPerDay.get(dayKey) ?? 0);
    triesPerDay.set(dayKey, (triesPerDay.get(dayKey) ?? 0) + 1);
    if (isBetter(kind, a.value, s.best)) s.best = a.value;
    s.values.push(a.value);
    s.lastAt = Math.max(s.lastAt ?? 0, a.at);
    raw.set(a.skillId, s);
    xp += score.xp;
    if (localDay(a.at) === today) xpToday += score.xp;
  }

  const learnedIds = new Map(learned.map(l => [l.skillId, l.at]));
  for (const [, at] of learnedIds) {
    xp += XP.learnedTick;
    if (localDay(at) === today) xpToday += XP.learnedTick;
  }

  const skills = new Map<string, SkillProgress>();
  const bests = new Map<string, number>();
  for (const skill of SKILLS) {
    const r = raw.get(skill.id);
    const isLearned = learnedIds.has(skill.id);
    const values = r?.values ?? [];
    const level = Math.max(levelFor(skill.kind, levelValue(skill.kind, values)), isLearned ? 1 : 0);
    const lastAt = Math.max(r?.lastAt ?? 0, learnedIds.get(skill.id) ?? 0) || undefined;
    const current = skill.kind === "change" ? currentSpeed(values) : undefined;
    skills.set(skill.id, { best: r?.best, current, level, attempts: values.length, lastAt, learned: isLearned, unlocked: false });
    if (r?.best !== undefined) bests.set(skill.id, r.best);
  }
  for (const skill of SKILLS) {
    skills.get(skill.id)!.unlocked = skill.requires.every(id => (skills.get(id)?.level ?? 0) >= 1);
  }
  return { skills, xp, xpToday, bests };
}

/** Overall player level: level n needs 50·n·(n−1) XP (0, 100, 300, 600, 1000…). */
export function playerLevel(xp: number) {
  let level = 1;
  while (50 * (level + 1) * level <= xp) level++;
  const floor = 50 * level * (level - 1);
  const next = 50 * (level + 1) * level;
  return { level, into: xp - floor, needed: next - floor };
}

/** Days before a skill should be practised again, by level (spaced repetition). */
export const REVIEW_AFTER_DAYS = [0, 1, 2, 4, 10];

export type TaskReason = "warm-up" | "review" | "level-up" | "new";

export interface PlanTask {
  skill: Skill;
  reason: TaskReason;
  level: number;
  /** Value needed for the next level, when there is one. */
  target?: number;
  done: boolean;
}

/** How far a value (best, or current speed for changes) is towards the next level, 0–1. */
export function progressToNext(kind: SkillKind, best: number | undefined, level: number): number {
  if (best === undefined || level >= maxLevel(kind)) return level >= maxLevel(kind) ? 1 : 0;
  const m = METRICS[kind];
  const lo = level === 0 ? (m.better === "higher" ? 0 : m.levels[0]! * 2) : m.levels[level - 1]!;
  const hi = m.levels[level]!;
  return Math.max(0, Math.min(1, (best - lo) / (hi - lo)));
}

/**
 * Today's plan, chosen from progress as it stood at the start of the day so it
 * doesn't reshuffle while you work through it: overdue reviews, the skills
 * closest to their next level, and new unlocks on each track, after a warm-up.
 */
export function dailyPlan(attempts: Attempt[], learned: { skillId: string; at: number }[], now = Date.now(), size = 7): PlanTask[] {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const startOfDay = dayStart.getTime();
  const before = computeProgress(attempts.filter(a => a.at < startOfDay), learned.filter(l => l.at < startOfDay), startOfDay);
  const doneToday = new Set([...attempts, ...learned].filter(x => x.at >= startOfDay).map(x => x.skillId));
  const day = 86_400_000;

  const task = (skill: Skill, reason: TaskReason): PlanTask => {
    const p = before.skills.get(skill.id)!;
    return { skill, reason, level: p.level, target: p.level < maxLevel(skill.kind) ? METRICS[skill.kind].levels[p.level] : undefined, done: doneToday.has(skill.id) };
  };
  const picked = new Set<string>();
  const out: PlanTask[] = [];
  const add = (skill: Skill, reason: TaskReason) => {
    if (picked.has(skill.id) || out.length >= size) return;
    picked.add(skill.id);
    out.push(task(skill, reason));
  };

  const started = SKILLS.filter(s => {
    const p = before.skills.get(s.id)!;
    return p.unlocked && p.level >= 1;
  });

  // 0. Warm up first: the earliest unlocked warm-up not yet mastered, else the last one.
  const warmups = SKILLS.filter(s => s.kind === "warmup" && before.skills.get(s.id)!.unlocked);
  const warmup = warmups.find(s => before.skills.get(s.id)!.level < maxLevel(s.kind)) ?? warmups.at(-1);
  if (warmup) add(warmup, "warm-up");

  // 1. Overdue reviews, most overdue first.
  started
    .map(s => {
      const p = before.skills.get(s.id)!;
      return { s, overdue: startOfDay - ((p.lastAt ?? 0) + REVIEW_AFTER_DAYS[p.level]! * day) };
    })
    .filter(x => x.overdue >= 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 2)
    .forEach(x => add(x.s, "review"));

  // 2. Closest to the next level.
  SKILLS.filter(s => {
    const p = before.skills.get(s.id)!;
    return s.kind !== "warmup" && p.unlocked && p.attempts > 0 && p.level < maxLevel(s.kind);
  })
    .map(s => {
      const p = before.skills.get(s.id)!;
      return { s, near: progressToNext(s.kind, p.current ?? p.best, p.level) };
    })
    .sort((a, b) => b.near - a.near)
    .slice(0, 2)
    .forEach(x => add(x.s, "level-up"));

  // 3. One new skill per track. For the hands, drill a change between chords you
  //    know before learning another chord.
  const fresh = (kind: SkillKind) =>
    SKILLS.find(s => s.kind === kind && !picked.has(s.id) && before.skills.get(s.id)!.unlocked && before.skills.get(s.id)!.level === 0 && before.skills.get(s.id)!.attempts === 0);
  for (const s of [fresh("change") ?? fresh("chord"), fresh("strum"), fresh("scale"), fresh("note"), fresh("pick"), fresh("ear"), fresh("prog")]) {
    if (s) add(s, "new");
  }
  return out;
}
