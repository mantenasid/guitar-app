import { describe, expect, it } from "vitest";
import { ALL_PAIRS, CHANGE_TARGET, bestAverage, changeSkillId, currentSpeed, drillFeedback, nextGoal, pairKey, stageOf, suggestedPairs, summarise } from "./changes";
import { SKILLS } from "./registry";

const at = (current: number, level: number, attempts = 3) => ({ current, level, attempts });

describe("pairs", () => {
  it("stores a pair once whichever way round", () => {
    expect(pairKey("A", "D")).toBe(pairKey("D", "A"));
    expect(changeSkillId("C", "G")).toBe(changeSkillId("G", "C"));
    // Ordered by the chord list, where G comes before C.
    expect(changeSkillId("C", "G")).toBe("change:G|C");
  });

  it("has 84 distinct pairs, all 28 open-chord pairs first", () => {
    expect(ALL_PAIRS).toHaveLength(84);
    expect(ALL_PAIRS.filter(p => p.section === "basic")).toHaveLength(28);
    expect(new Set(ALL_PAIRS.map(p => p.key)).size).toBe(84);
  });
});

describe("goals and stages", () => {
  it("builds up a few changes at a time", () => {
    expect(nextGoal(0)).toBeNull();
    expect(nextGoal(22)).toBe(27);
    expect(nextGoal(45)).toBe(49);
    expect(nextGoal(70)).toBe(73);
    expect(nextGoal(79)).toBe(CHANGE_TARGET);
    expect(nextGoal(90)).toBe(CHANGE_TARGET);
  });

  it("names the stages", () => {
    expect(stageOf(0, false).name).toBe("Not tried");
    expect([0, 1, 2, 3].map(l => stageOf(l, true).name)).toEqual(["Practising", "Level 1", "Level 2", "Mastered"]);
  });

  it("gives feedback after a drill", () => {
    expect(drillFeedback(22, [])).toMatch(/Baseline set: 22\. 2 more drills/);
    expect(drillFeedback(30, [25])).toMatch(/1 more drill for/);
    expect(drillFeedback(32, [25, 28])).toMatch(/New best: 32\. Current speed 28\. Level 1 at 40/);
    expect(drillFeedback(20, [25, 28, 30])).toMatch(/20 this time\. Current speed 26/);
    expect(drillFeedback(45, [38, 40])).toMatch(/Level 1 reached, averaging 41! Level 2 at 60/);
    expect(drillFeedback(81, [80, 82])).toMatch(/mastered/);
  });
});

describe("current speed", () => {
  it("averages the last three drills", () => {
    expect(currentSpeed([])).toBeUndefined();
    expect(currentSpeed([30])).toBe(30);
    expect(currentSpeed([10, 38, 42, 45])).toBe(42);
  });

  it("finds the best run of three, needing at least three drills", () => {
    expect(bestAverage([50, 50])).toBeUndefined();
    expect(bestAverage([38, 42, 45, 20, 20, 20])).toBe(42);
  });
});

describe("suggestions", () => {
  it("starts with new open-chord pairs", () => {
    const next = suggestedPairs(new Map());
    expect(next).toHaveLength(3);
    expect(next.every(p => p.section === "basic")).toBe(true);
  });

  it("keeps a started pair in focus, plus one new pair", () => {
    const skills = new Map([[changeSkillId("A", "D"), at(30, 0)], [changeSkillId("A", "C"), at(12, 0)]]);
    const next = suggestedPairs(skills).map(p => p.key);
    expect(next.slice(0, 2)).toEqual([pairKey("A", "C"), pairKey("A", "D")]);
    expect(skills.has(changeSkillId(...(next[2]!.split("|") as [string, string])))).toBe(false);
  });

  it("moves to the next section once a section is mastered", () => {
    // A mastered pair stays mastered even if its current speed has slipped.
    const skills = new Map(ALL_PAIRS.filter(p => p.section === "basic").map(p => [`change:${p.key}`, at(70, 3)]));
    expect(suggestedPairs(skills).every(p => p.section === "blues")).toBe(true);
    expect(summarise(ALL_PAIRS, skills).mastered).toBe(28);
  });
});

describe("skill registry", () => {
  it("registers every skill once", () => {
    expect(SKILLS).toHaveLength(28 + 84 + 29 + 16);
    expect(new Set(SKILLS.map(s => s.id)).size).toBe(SKILLS.length);
  });
});
