import type { Dot, Shape } from "@/content/types";
import { midiAt, noteAt, normaliseNote, STRINGS, type StringNum } from "./theory";

/** A note in a diagram, including open strings (fret 0). */
export interface ShapeNote {
  s: StringNum;
  f: number;
  midi: number;
  dot?: Dot;
  isRoot: boolean;
  isExtra: boolean;
}

export const noteId = (s: number, f: number) => `${s}:${f}`;

/** Every playable note in a shape, low string first. */
export function shapeNotes(shape: Shape): ShapeNote[] {
  const root = shape.root ? normaliseNote(shape.root) : null;
  const isRootNote = (s: StringNum, f: number, dot?: Dot) =>
    root ? noteAt(s, f) === root : dot?.kind === "root";
  const out: ShapeNote[] = [];
  for (const s of STRINGS) {
    if (shape.muted?.includes(s)) continue;
    const isOpenRoot = shape.openRoots?.includes(s) ?? false;
    if (shape.open?.includes(s) || isOpenRoot) {
      out.push({ s, f: 0, midi: midiAt(s, 0), isRoot: isOpenRoot || isRootNote(s, 0), isExtra: false });
    }
    for (const dot of shape.dots.filter(d => d.s === s).sort((a, b) => a.f - b.f)) {
      out.push({ s, f: dot.f, midi: midiAt(s, dot.f), dot, isRoot: dot.kind !== "extra" && isRootNote(s, dot.f, dot), isExtra: dot.kind === "extra" });
    }
  }
  return out;
}

/** Up then down through each distinct pitch, the way you'd practise a scale. */
export function scaleRun(shape: Shape): ShapeNote[] {
  const seen = new Set<number>();
  const up = shapeNotes(shape)
    .sort((a, b) => a.midi - b.midi || b.s - a.s)
    .filter(n => (seen.has(n.midi) ? false : (seen.add(n.midi), true)));
  return up.concat(up.slice(0, -1).reverse());
}

/**
 * One note per string, low to high, as you'd strum the chord.
 * With `withExtra`, shuffle shapes swap in their bounce note.
 */
export function chordVoicing(shape: Shape, withExtra = false): ShapeNote[] {
  const byString = new Map<StringNum, ShapeNote>();
  for (const n of shapeNotes(shape)) {
    const cur = byString.get(n.s);
    if (n.isExtra && !withExtra) continue;
    if (!cur || (withExtra && n.isExtra) || (!cur.isExtra && n.f > cur.f)) byString.set(n.s, n);
  }
  return STRINGS.map(s => byString.get(s)).filter((n): n is ShapeNote => !!n);
}

export const hasExtra = (shape: Shape) => shape.dots.some(d => d.kind === "extra");

/** Per-string steps for scale pages: frets low to high with fingers and note names. */
export function stringSteps(shape: Shape) {
  const notes = shapeNotes(shape);
  return STRINGS.map(s => ({ s, notes: notes.filter(n => n.s === s) })).filter(r => r.notes.length);
}
