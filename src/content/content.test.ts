// Guards the teaching content itself: wrong notes in a diagram are the worst bug this app can have.
import { describe, expect, it } from "vitest";
import { ALL_CHORDS, ALL_PATTERNS, ALL_SCALES, CHORD_BY_KEY, TRANSITION_SECTIONS } from ".";
import type { Shape } from "./types";
import { shapeNotes } from "@/music/shapes";
import { noteAt, normaliseNote } from "@/music/theory";

const notesIn = (shape: Shape) => new Set(shapeNotes(shape).map(n => noteAt(n.s, n.f)));
const inWindow = (shape: Shape) => shape.dots.every(d => d.f >= shape.startFret && d.f < shape.startFret + (shape.frets ?? 5));

const SCALE_NOTES: Record<string, string[][]> = {
  "e-minor-pentatonic": [["E", "G", "A", "B", "D"]],
  "a-minor-pentatonic": [["A", "C", "D", "E", "G"], ["D", "F", "G", "A", "C"]],
  "e-minor-blues": [["E", "G", "A", "A#", "B", "D"]],
  "a-minor-blues": [["A", "C", "D", "D#", "E", "G"], ["D", "F", "G", "G#", "A", "C"]],
  "g-major-pentatonic": [["G", "A", "B", "D", "E"]],
  "c-major-pentatonic": [["C", "D", "E", "G", "A"]],
  "a-major-pentatonic": [["A", "B", "C#", "E", "F#"], ["D", "E", "F#", "A", "B"]],
  "a-major-blues": [["A", "B", "C", "C#", "E", "F#"]],
  "c-major": [["C", "D", "E", "F", "G", "A", "B"]],
  "g-major": [["G", "A", "B", "C", "D", "E", "F#"]],
  "a-major-movable": [["A", "B", "C#", "D", "E", "F#", "G#"], ["D", "E", "F#", "G", "A", "B", "C#"]],
  "a-natural-minor": [["A", "B", "C", "D", "E", "F", "G"]],
};

describe("chords", () => {
  it("has all 39 shapes with dots inside their window", () => {
    expect(ALL_CHORDS).toHaveLength(39);
    for (const c of ALL_CHORDS) expect(inWindow(c.shape), c.key).toBe(true);
  });

  it("every chord contains its root note", () => {
    for (const c of ALL_CHORDS) expect(notesIn(c.shape).has(normaliseNote(c.shape.root!)), c.key).toBe(true);
  });

  it("finger numbers are 1–4", () => {
    for (const c of ALL_CHORDS) for (const d of c.shape.dots) expect([1, 2, 3, 4]).toContain(d.finger);
  });
});

describe("scales", () => {
  it("has 16 scales numbered 1–16 in order", () => {
    expect(ALL_SCALES.map(s => s.num)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  it("every diagram only uses notes from its scale", () => {
    for (const s of ALL_SCALES) {
      const allowed = SCALE_NOTES[s.id];
      if (!allowed) continue;
      const shapes = [s.card, ...(s.shapes ?? [])];
      for (const [i, shape] of shapes.entries()) {
        const ok = allowed.some(set => [...notesIn(shape)].every(n => set.includes(n)));
        expect(ok, `${s.id} diagram ${i}: ${[...notesIn(shape)]}`).toBe(true);
        expect(inWindow(shape), `${s.id} diagram ${i} window`).toBe(true);
      }
    }
  });

  it("standard scales have two shapes; special ones have their own page", () => {
    for (const s of ALL_SCALES) expect(s.special ? !s.shapes : s.shapes?.length === 2, s.id).toBe(true);
  });
});

describe("transitions and strumming", () => {
  it("every transition pair uses chords that exist", () => {
    for (const sec of TRANSITION_SECTIONS) for (const row of sec.rows) for (const [a, b] of row.pairs) {
      expect(CHORD_BY_KEY[a], a).toBeDefined();
      expect(CHORD_BY_KEY[b], b).toBeDefined();
    }
  });

  it("each pair appears once, and rows with a root list it first", () => {
    const seen = new Set<string>();
    for (const sec of TRANSITION_SECTIONS) for (const row of sec.rows) for (const [a, b] of row.pairs) {
      const key = [a, b].sort().join("|");
      expect(seen.has(key), `${a} ↔ ${b} repeated`).toBe(false);
      seen.add(key);
      if (row.root) expect(a, `${row.label} ${a} ↔ ${b}`).toBe(row.root);
    }
  });

  it("every strum pattern lines up with its count", () => {
    expect(ALL_PATTERNS).toHaveLength(29);
    for (const p of ALL_PATTERNS) expect(p.slots.length, p.name).toBe(p.count.length);
  });
});
