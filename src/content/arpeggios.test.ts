import { describe, expect, it } from "vitest";
import { ARPEGGIOS, ARPEGGIO_BY_ID } from "./arpeggios";
import { midiAt } from "@/music/theory";

const up = (id: string) => {
  const steps = ARPEGGIO_BY_ID[id]!.steps;
  return steps.slice(0, (steps.length + 1) / 2);
};

describe("arpeggios", () => {
  it("have unique ids, stay in their window and rise then fall", () => {
    expect(new Set(ARPEGGIOS.map(a => a.id)).size).toBe(ARPEGGIOS.length);
    for (const a of ARPEGGIOS) {
      expect(a.steps[0]!.degree).toBe("R");
      expect(a.steps.at(-1)).toEqual(a.steps[0]);
      const rising = up(a.id).map(st => midiAt(st.s, st.f));
      expect(rising).toEqual([...rising].sort((x, y) => x - y));
      for (const st of a.steps) {
        expect(st.f).toBeGreaterThanOrEqual(a.startFret);
        expect(st.f).toBeLessThan(a.startFret + a.frets);
      }
    }
  });

  it("plays the A major shape over two octaves", () => {
    expect(up("major-6").map(st => [st.s, st.f, st.degree])).toEqual([
      [6, 5, "R"], [5, 4, "3"], [5, 7, "5"], [4, 7, "R"], [3, 6, "3"], [2, 5, "5"], [1, 5, "R"],
    ]);
    expect(up("major-6").map(st => st.finger)).toEqual([2, 1, 4, 4, 3, 2, 2]);
  });

  it("adds the b7 for a dominant 7", () => {
    expect(up("dom7-6").map(st => st.degree)).toEqual(["R", "3", "5", "b7", "R", "3", "5", "R"]);
    expect(up("min7-5").map(st => st.degree)).toEqual(["R", "b3", "5", "b7", "R", "b3", "5"]);
  });
});
