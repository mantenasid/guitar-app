// Question picking for the note finder.
import { NOTE_FRETS, type NoteSet } from "@/content/fretboard";
import { noteAt, type StringNum } from "@/music/theory";

export interface Spot {
  s: StringNum;
  f: number;
}

/** Every spot in a set: its strings at frets 0–12, naturals only if the set says so. */
export function spotsFor(set: NoteSet): Spot[] {
  return set.strings.flatMap(s =>
    Array.from({ length: NOTE_FRETS + 1 }, (_, f) => ({ s, f })).filter(p => !set.naturals || !noteAt(p.s, p.f).includes("#")),
  );
}

/** A random spot, never the same one twice in a row. */
export function nextSpot(set: NoteSet, prev: Spot | null, rng: () => number = Math.random): Spot {
  const all = spotsFor(set);
  const pool = all.length > 1 && prev ? all.filter(p => p.s !== prev.s || p.f !== prev.f) : all;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]!;
}
