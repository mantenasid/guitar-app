import { describe, expect, it } from "vitest";
import { CHORD_BY_KEY } from "@/content";
import { chordRoot, midiAt, noteAt, normaliseNote, spellFlat, transpose } from "./theory";
import { chordVoicing, scaleRun, shapeNotes, stringSteps } from "./shapes";

describe("theory", () => {
  it("knows the open strings in standard tuning", () => {
    expect([6, 5, 4, 3, 2, 1].map(s => noteAt(s as 1, 0))).toEqual(["E", "A", "D", "G", "B", "E"]);
    expect(midiAt(6, 0)).toBe(40);
    expect(midiAt(1, 0)).toBe(64);
  });

  it("finds notes up the neck", () => {
    expect(noteAt(6, 5)).toBe("A");
    expect(noteAt(5, 3)).toBe("C");
    expect(noteAt(6, 12)).toBe("E");
  });

  it("handles flats, sharps and chord roots", () => {
    expect(normaliseNote("Bb")).toBe("A#");
    expect(spellFlat("A#")).toBe("Bb");
    expect(transpose("A", 3)).toBe("C");
    expect(transpose("C", -3)).toBe("A");
    expect(chordRoot("F#5")).toBe("F#");
    expect(chordRoot("Em")).toBe("E");
    expect(chordRoot("Bb7")).toBe("A#");
  });
});

describe("shapes", () => {
  it("voices an open E major as E B E G# B E", () => {
    const notes = chordVoicing(CHORD_BY_KEY.E!.shape).map(n => noteAt(n.s, n.f));
    expect(notes).toEqual(["E", "B", "E", "G#", "B", "E"]);
  });

  it("skips muted strings", () => {
    const d = chordVoicing(CHORD_BY_KEY.D!.shape);
    expect(d.map(n => n.s)).toEqual([4, 3, 2, 1]);
  });

  it("marks only real roots, including open strings", () => {
    const roots = shapeNotes(CHORD_BY_KEY.D7!.shape).filter(n => n.isRoot);
    expect(roots.map(n => `${n.s}:${n.f}`)).toEqual(["4:0"]);
  });

  it("swaps in the bounce note for shuffle shapes", () => {
    const shape = CHORD_BY_KEY["B5/B6"]!.shape;
    expect(chordVoicing(shape).map(n => n.f)).toEqual([2, 4]);
    expect(chordVoicing(shape, true).map(n => n.f)).toEqual([2, 6]);
  });

  it("runs a scale up and back down without repeating the top note", () => {
    const run = scaleRun({ startFret: 5, dots: [{ s: 6, f: 5 }, { s: 6, f: 8 }, { s: 5, f: 5 }] });
    expect(run.map(n => n.midi)).toEqual([45, 48, 50, 48, 45]);
  });

  it("lists steps per string, low string first", () => {
    const rows = stringSteps({ startFret: 1, nut: true, open: [1], dots: [{ s: 2, f: 1, finger: 1 }] });
    expect(rows.map(r => [r.s, r.notes.map(n => n.f)])).toEqual([[2, [1]], [1, [0]]]);
  });
});
