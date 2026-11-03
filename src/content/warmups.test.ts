import { describe, expect, it } from "vitest";
import { WARMUPS, WARMUP_BY_ID } from "./warmups";

describe("warm-ups", () => {
  it("have unique ids and stay inside their diagram", () => {
    expect(new Set(WARMUPS.map(w => w.id)).size).toBe(WARMUPS.length);
    for (const w of WARMUPS) {
      expect(w.steps.length).toBeGreaterThan(0);
      for (const st of w.steps) {
        expect(st.f).toBeGreaterThanOrEqual(w.startFret);
        expect(st.f).toBeLessThan(w.startFret + w.frets);
      }
    }
  });

  it("walks the spider up and back down", () => {
    const steps = WARMUP_BY_ID["spider-1324"]!.steps;
    expect(steps.slice(0, 4).map(s => [s.s, s.f])).toEqual([[6, 1], [6, 3], [6, 2], [6, 4]]);
    expect(steps.slice(20, 28).map(s => [s.s, s.f])).toEqual([[1, 1], [1, 3], [1, 2], [1, 4], [1, 4], [1, 2], [1, 3], [1, 1]]);
    expect(steps.at(-1)).toEqual({ s: 6, f: 1, finger: 1 });
  });

  it("shifts up a fret per string on the diagonal", () => {
    const steps = WARMUP_BY_ID.diagonal!.steps;
    expect(steps.filter(s => s.s === 1 && s.finger === 1)[0]!.f).toBe(6);
    expect(steps.filter(s => s.s === 5 && s.finger === 4)[0]!.f).toBe(5);
  });
});
