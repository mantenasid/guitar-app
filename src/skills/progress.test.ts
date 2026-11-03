import { describe, expect, it } from "vitest";
import type { Attempt } from "@/progress/db";
import { DAILY_XP_GOAL, XP, computeProgress, dailyPlan, levelValue, playerLevel, progressToNext, scoreAttempt } from "./progress";
import { SKILLS, levelFor } from "./registry";

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 3, 18, 0).getTime();
let id = 0;
const at = (skillId: string, value: number, daysAgo = 0, hour = 9): Attempt => {
  const d = new Date(NOW - daysAgo * DAY);
  d.setHours(hour, 0, 0, 0);
  return { id: ++id, skillId, value, at: d.getTime(), date: "" };
};

describe("levels", () => {
  it("rates chord recall by speed (lower is better)", () => {
    expect([undefined, 4, 3, 2, 1.5, 0.9].map(v => levelFor("chord", v))).toEqual([0, 0, 1, 2, 3, 4]);
  });

  it("rates changes and tempo by speed (higher is better)", () => {
    expect([10, 40, 59, 80].map(v => levelFor("change", v))).toEqual([0, 1, 1, 3]);
    expect([50, 60, 100, 130].map(v => levelFor("strum", v))).toEqual([0, 1, 3, 4]);
  });

  it("measures progress towards the next level", () => {
    expect(progressToNext("change", 50, 1)).toBeCloseTo(0.5);
    expect(progressToNext("change", 20, 0)).toBeCloseTo(0.5);
    expect(progressToNext("chord", 2.5, 1)).toBeCloseTo(0.5);
    expect(progressToNext("change", undefined, 0)).toBe(0);
    expect(progressToNext("change", 70, 3)).toBe(1);
  });
});

describe("XP", () => {
  it("rewards a first try, new bests and level-ups", () => {
    expect(scoreAttempt("strum", 60, [], 0)).toEqual({ xp: XP.attempt + XP.firstTry + XP.perLevel, newBest: false, levelBefore: 0, levelAfter: 1 });
    expect(scoreAttempt("strum", 65, [60], 1).xp).toBe(XP.attempt + XP.newBest);
    expect(scoreAttempt("strum", 80, [60, 65], 2).xp).toBe(XP.attempt + XP.newBest + XP.perLevel * 2);
    expect(scoreAttempt("strum", 50, [60, 65, 80], 3).xp).toBe(XP.attempt);
  });

  it("levels changes on the average of three drills in a row", () => {
    // One fast minute is a new best, not a level.
    expect(scoreAttempt("change", 45, [], 0)).toMatchObject({ levelAfter: 0 });
    expect(scoreAttempt("change", 41, [38], 1)).toMatchObject({ levelAfter: 0 });
    expect(scoreAttempt("change", 42, [38, 41], 2)).toEqual({ xp: XP.attempt + XP.newBest + XP.perLevel, newBest: true, levelBefore: 0, levelAfter: 1 });
  });

  it("keeps a change level after a bad run", () => {
    expect(levelValue("change", [38, 42, 45, 20, 20, 20])).toBe(42);
    const p = computeProgress([38, 42, 45, 20, 20, 20].map((v, i) => at("change:Em|Am", v, 0, 8 + i)), [], NOW);
    expect(p.skills.get("change:Em|Am")).toMatchObject({ current: 20, level: 1, best: 45, attempts: 6 });
  });

  it("stops effort XP after 10 tries at one skill in a day", () => {
    expect(scoreAttempt("change", 10, [25], XP.attemptsPerDay).xp).toBe(0);
  });

  it("adds up across attempts and counts today's XP separately", () => {
    const p = computeProgress([at("change:A|D", 22, 1), at("change:A|D", 30)], [], NOW);
    expect(p.xp).toBe(XP.attempt + XP.firstTry + XP.attempt + XP.newBest);
    expect(p.xpToday).toBe(XP.attempt + XP.newBest);
    expect(p.bests.get("change:A|D")).toBe(30);
  });

  it("levels the player up on a growing curve", () => {
    expect(playerLevel(0)).toEqual({ level: 1, into: 0, needed: 100 });
    expect(playerLevel(150)).toEqual({ level: 2, into: 50, needed: 200 });
    expect(playerLevel(300).level).toBe(3);
    expect(DAILY_XP_GOAL).toBeGreaterThan(0);
  });
});

describe("unlocks", () => {
  it("starts with Em, the first pattern and the first scale", () => {
    const p = computeProgress([], [], NOW);
    const unlocked = SKILLS.filter(s => p.skills.get(s.id)!.unlocked).map(s => s.id);
    expect(unlocked).toEqual(["chord:Em", "strum:1", "scale:first-position"]);
  });

  it("unlocks the next chord, and the change between known chords", () => {
    const p = computeProgress([at("chord:Em", 2.5), at("chord:Am", 2.9)], [], NOW);
    expect(p.skills.get("chord:E")!.unlocked).toBe(true);
    expect(p.skills.get("change:Em|Am")?.unlocked ?? p.skills.get("change:Am|Em")!.unlocked).toBe(true);
    expect(p.skills.get("chord:A")!.unlocked).toBe(false);
  });

  it("counts a learned tick as level 1", () => {
    const p = computeProgress([], [{ skillId: "chord:Em", at: NOW }], NOW);
    expect(p.skills.get("chord:Em")!.level).toBe(1);
    expect(p.skills.get("chord:Am")!.unlocked).toBe(true);
    expect(p.xpToday).toBe(XP.learnedTick);
  });
});

describe("daily plan", () => {
  it("gives a beginner one new skill per track", () => {
    const plan = dailyPlan([], [], NOW);
    expect(plan.map(t => [t.skill.id, t.reason])).toEqual([["chord:Em", "new"], ["strum:1", "new"], ["scale:first-position", "new"]]);
  });

  it("prefers a change between known chords over a new chord", () => {
    const plan = dailyPlan([at("chord:Em", 2.5, 1), at("chord:Am", 2.8, 1)], [], NOW);
    const fresh = plan.filter(t => t.reason === "new").map(t => t.skill.kind);
    expect(fresh[0]).toBe("change");
  });

  it("brings back skills that are due for review", () => {
    const plan = dailyPlan([at("chord:Em", 1.9, 5)], [], NOW);
    expect(plan[0]).toMatchObject({ reason: "review", level: 2, target: 1.5 });
  });

  it("does not reshuffle during the day, and ticks off what you did", () => {
    const yesterday = [at("chord:Em", 2.5, 1)];
    const morning = dailyPlan(yesterday, [], NOW);
    const evening = dailyPlan([...yesterday, at("chord:Em", 1.4)], [], NOW);
    expect(evening.map(t => t.skill.id)).toEqual(morning.map(t => t.skill.id));
    expect(evening.find(t => t.skill.id === "chord:Em")?.done).toBe(true);
  });

  it("never plans more than 5 tasks", () => {
    const lots = SKILLS.slice(0, 20).map((s, i) => at(s.id, s.kind === "chord" ? 2.5 : 30, 3 + i));
    expect(dailyPlan(lots, [], NOW).length).toBeLessThanOrEqual(5);
  });
});
