import { describe, expect, it } from "vitest";
import { landedScore, recentTiming, sameNote, timingScore, withHalves } from "./timing";

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

describe("landedScore", () => {
  const due = Array.from({ length: 16 }, (_, i) => 2 + i * 0.5);

  it("needs enough notes to judge", () => {
    expect(landedScore([1, 2], [1, 2, 3])).toBeNull();
  });

  it("ignores a steady lag from the speakers and mic", () => {
    expect(landedScore(due.map(t => t + 0.12), due)?.percent).toBe(100);
  });

  it("counts missed notes", () => {
    expect(landedScore(due.slice(0, 8).map(t => t + 0.1), due)?.percent).toBe(50);
  });

  it("counts stray extra notes against the score", () => {
    const heard = [...due, ...due.slice(0, 8).map(t => t + 0.25)];
    expect(landedScore(heard, due)!.percent).toBeLessThan(70);
  });

  it("marks unsteady notes as missed", () => {
    const heard = due.map((t, i) => t + (i % 2 ? 0.15 : -0.02));
    expect(landedScore(heard, due)!.percent).toBeLessThanOrEqual(50);
  });

  it("scores silence as nothing landed", () => {
    expect(landedScore([], due)).toEqual({ percent: 0, hit: 0, due: 16 });
  });
});

describe("withHalves", () => {
  it("adds the off-beats", () => {
    expect(withHalves([1, 2, 3])).toEqual([1, 1.5, 2, 2.5, 3]);
  });
});

describe("sameNote", () => {
  it("accepts the note a little out of tune, in any octave", () => {
    expect(sameNote(110, 45)).toBe(true);
    expect(sameNote(112, 45)).toBe(true);
    expect(sameNote(220, 45)).toBe(true);
  });

  it("rejects the note a semitone away", () => {
    expect(sameNote(116.5, 45)).toBe(false);
  });
});
