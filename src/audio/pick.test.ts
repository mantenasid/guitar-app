import { describe, expect, it } from "vitest";
import { CHORD_BY_KEY } from "@/content";
import { PICK_PATTERNS } from "@/content/fingerpicking";
import { chordVoicing } from "@/music/shapes";
import { slotTimes } from "./strum";
import { pickNotes } from "./pick";

const voicing = (key: string) => chordVoicing(CHORD_BY_KEY[key]!.shape);

describe("fingerpicking patterns", () => {
  it("have one slot per count and unique ids", () => {
    expect(PICK_PATTERNS).toHaveLength(10);
    expect(new Set(PICK_PATTERNS.map(p => p.id)).size).toBe(10);
    for (const p of PICK_PATTERNS) {
      expect(p.slots).toHaveLength(p.count.length);
      expect(slotTimes(p.count, false).beats).toBe(p.meter === "3/4" ? 3 : 4);
    }
  });
});

describe("pickNotes", () => {
  it("puts the thumb on the root and the fingers on strings 3 to 1", () => {
    // C: x32010 → C3 48, E3 52, G3 55, C4 60, E4 64
    const c = voicing("C");
    expect(pickNotes("p", c)).toEqual([48]);
    expect(pickNotes("i", c)).toEqual([55]);
    expect(pickNotes("m", c)).toEqual([60]);
    expect(pickNotes("a", c)).toEqual([64]);
    expect(pickNotes("pa", c)).toEqual([48, 64]);
    expect(pickNotes("·", c)).toEqual([]);
  });

  it("alternates the thumb to the 4th string", () => {
    expect(pickNotes("p2", voicing("C"))).toEqual([52]);
    // D: xx0232, root already on the 4th string → next string up.
    expect(pickNotes("p2", voicing("D"))).toEqual([57]);
  });
});
