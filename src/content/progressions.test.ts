import { describe, expect, it } from "vitest";
import { CHORD_BY_KEY } from ".";
import { PROGRESSIONS, PROGRESSION_BY_ID, progressionChanges } from "./progressions";

describe("progressions", () => {
  it("use real chords, with a numeral per bar", () => {
    expect(new Set(PROGRESSIONS.map(p => p.id)).size).toBe(PROGRESSIONS.length);
    for (const p of PROGRESSIONS) {
      expect([4, 12]).toContain(p.bars.length);
      expect(p.numerals).toHaveLength(p.bars.length);
      for (const c of p.bars) expect(CHORD_BY_KEY[c], c).toBeDefined();
    }
  });

  it("lists each change once, wrapping back to the start", () => {
    expect(progressionChanges(PROGRESSION_BY_ID["i-iv-v-a"]!)).toEqual([["A", "D"], ["D", "E"], ["E", "A"]]);
    expect(progressionChanges(PROGRESSION_BY_ID["blues-a"]!)).toEqual([["A7", "D7"], ["A7", "E7"], ["E7", "D7"]]);
  });
});
