import { describe, expect, it } from "vitest";
import { ALL_PATTERNS } from "@/content";
import { isSwing, slotTimes } from "./strum";

describe("slotTimes", () => {
  it("places straight 8ths on the beat and half beat", () => {
    const { times, beats } = slotTimes(["1", "+", "2", "+", "3", "+", "4", "+"], false);
    expect(beats).toBe(4);
    expect(times).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
  });

  it("pushes the + late with swing", () => {
    expect(slotTimes(["1", "+"], true).times[1]).toBeCloseTo(2 / 3);
  });

  it("handles 16th-note counts", () => {
    const { times } = slotTimes(["1", "+", "2", "e", "+", "3", "+", "4", "e", "+"], false);
    expect(times).toEqual([0, 0.5, 1, 1.25, 1.5, 2, 2.5, 3, 3.25, 3.5]);
  });

  it("knows 3/4", () => {
    expect(slotTimes(["1", "+", "2", "+", "3", "+"], false).beats).toBe(3);
  });

  it("only swings shuffle patterns", () => {
    expect(ALL_PATTERNS.filter(isSwing).map(p => p.num)).toEqual([12, 24, 29]);
  });
});
