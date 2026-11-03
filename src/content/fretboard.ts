// Fretboard note sets, easiest first: one string with natural notes, then sharps, then more strings.
import type { StringNum } from "@/music/theory";

export interface NoteSet {
  id: string;
  title: string;
  /** Strings asked about. */
  strings: StringNum[];
  /** Only notes without a sharp (A B C D E F G). */
  naturals: boolean;
}

/** Frets 0–12 are asked; above 12 the notes repeat. */
export const NOTE_FRETS = 12;

export const NOTE_SETS: NoteSet[] = [
  { id: "low-e", title: "Low E string", strings: [6], naturals: true },
  { id: "a", title: "A string", strings: [5], naturals: true },
  { id: "e-a", title: "E and A strings, with sharps", strings: [6, 5], naturals: false },
  { id: "d-g", title: "D and G strings", strings: [4, 3], naturals: false },
  { id: "b-e", title: "B and high e strings", strings: [2, 1], naturals: false },
  { id: "all", title: "Every string", strings: [6, 5, 4, 3, 2, 1], naturals: false },
];

export const NOTE_SET_BY_ID: Record<string, NoteSet> = Object.fromEntries(NOTE_SETS.map(s => [s.id, s]));
