import { describe, expect, it } from "vitest";
import { recentTiming, timingScore } from "./timing";

const clicks = Array.from({ length: 20 }, (_, i) => 1 + i * 1.5);

describe("timingScore", () => {
  it("needs enough strums and some clicks", () => {
    expect(timingScore([], clicks)).toBeNull();
    expect(timingScore([1, 2.5, 4], clicks)).toBeNull();
    expect(timingScore([1, 2.5, 4, 5.5], [])).toBeNull();
  });

  it("scores strums on the click", () => {
    expect(timingScore([1.02, 2.47, 4.05, 5.5], clicks)).toBe(100);
  });

  it("misses strums far from any click", () => {
    expect(timingScore([1.2, 2.2, 4.0, 5.5], clicks)).toBe(50);
  });

  it("all early strums miss", () => {
    expect(timingScore([0.85, 2.35, 3.85, 5.35], clicks)).toBe(0);
  });

  it("takes latency off before matching", () => {
    const late = [1.1, 2.6, 4.1, 5.6];
    expect(timingScore(late, clicks)).toBe(0);
    expect(timingScore(late, clicks, 0.1)).toBe(100);
  });

  it("matches the click after a strum too", () => {
    expect(timingScore([2.46, 3.97, 5.48, 6.95], clicks)).toBe(100);
  });
});

describe("recentTiming", () => {
  it("averages the last three", () => {
    expect(recentTiming([])).toBeUndefined();
    expect(recentTiming([10, 80, 90, 100])).toBe(90);
  });
});
