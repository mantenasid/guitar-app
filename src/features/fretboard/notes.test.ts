import { describe, expect, it } from "vitest";
import { NOTE_SET_BY_ID } from "@/content/fretboard";
import { noteAt } from "@/music/theory";
import { nextSpot, spotsFor } from "./notes";

describe("spotsFor", () => {
  it("low E naturals are 8 spots, frets 0-12", () => {
    const spots = spotsFor(NOTE_SET_BY_ID["low-e"]!);
    expect(spots.map(p => noteAt(p.s, p.f))).toEqual(["E", "F", "G", "A", "B", "C", "D", "E"]);
  });

  it("sets with sharps include every fret", () => {
    expect(spotsFor(NOTE_SET_BY_ID["e-a"]!)).toHaveLength(26);
  });
});

describe("nextSpot", () => {
  it("never repeats the last spot", () => {
    const set = NOTE_SET_BY_ID["low-e"]!;
    const first = spotsFor(set)[0]!;
    expect(nextSpot(set, first, () => 0)).not.toEqual(first);
  });
});
