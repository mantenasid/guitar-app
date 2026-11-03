import { describe, expect, it } from "vitest";
import { ALL_PAIRS, CHANGE_TARGET, changeSkillId, drillFeedback, nextGoal, pairKey, stageOf, suggestedPairs, summarise } from "./changes";
import { SKILLS } from "./registry";

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
    expect([0, 1, 20, 40, 60, 80].map(n => stageOf(n).name)).toEqual(["Not tried", "Learning", "Building", "Solid", "Fluent", "Mastered"]);
  });

  it("gives feedback after a drill", () => {
    expect(drillFeedback(22, 0)).toMatch(/Baseline set: 22/);
    expect(drillFeedback(30, 25)).toMatch(/Goal hit/);
    expect(drillFeedback(27, 25)).toMatch(/New best/);
    expect(drillFeedback(20, 25)).toMatch(/Best is 25/);
    expect(drillFeedback(81, 70)).toMatch(/mastered/);
  });
});

describe("suggestions", () => {
  it("starts with new open-chord pairs", () => {
    const next = suggestedPairs(new Map());
    expect(next).toHaveLength(3);
    expect(next.every(p => p.section === "basic")).toBe(true);
  });

  it("keeps a started pair in focus, plus one new pair", () => {
    const bests = new Map([[changeSkillId("A", "D"), 30], [changeSkillId("A", "C"), 12]]);
    const next = suggestedPairs(bests).map(p => p.key);
    expect(next.slice(0, 2)).toEqual([pairKey("A", "C"), pairKey("A", "D")]);
    expect(bests.has(changeSkillId(...(next[2]!.split("|") as [string, string])))).toBe(false);
  });

  it("moves to the next section once a section is mastered", () => {
    const bests = new Map(ALL_PAIRS.filter(p => p.section === "basic").map(p => [`change:${p.key}`, 80]));
    expect(suggestedPairs(bests).every(p => p.section === "blues")).toBe(true);
    expect(summarise(ALL_PAIRS, bests).mastered).toBe(28);
  });
});

describe("skill registry", () => {
  it("registers every skill once", () => {
    expect(SKILLS).toHaveLength(28 + 84 + 29 + 16);
    expect(new Set(SKILLS.map(s => s.id)).size).toBe(SKILLS.length);
  });
});
