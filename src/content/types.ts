import type { Finger, StringNum } from "@/music/theory";

/** One fretted note in a diagram. */
export interface Dot {
  s: StringNum;
  f: number;
  /** Fretting-hand finger: 1 index, 2 middle, 3 ring, 4 little. */
  finger?: Finger;
  /** Text to show instead of a finger number, e.g. a note name. */
  label?: string;
  /** root = the key's root note; extra = blue note / shuffle bounce. Chords work roots out from `root`. */
  kind?: "root" | "extra";
}

/** A fretboard window and the notes in it. */
export interface Shape {
  startFret: number;
  /** How many frets to draw (default 5). */
  frets?: number;
  /** Draw the nut (only when the window starts at fret 1). */
  nut?: boolean;
  muted?: StringNum[];
  open?: StringNum[];
  /** Open strings that are the root note. */
  openRoots?: StringNum[];
  /** Root note name. When set, every dot and open string matching it is marked as a root. */
  root?: string;
  dots: Dot[];
}

export interface Chord {
  key: string;
  name: string;
  tag: string;
  shape: Shape;
}

export interface ChordGroup {
  id: string;
  title: string;
  note: string;
  sections: { title: string; chords: Chord[] }[];
}

export interface TransitionRow {
  label: string;
  root?: string;
  tag?: string;
  pairs: [string, string][];
}

export interface TransitionSection {
  id: string;
  title: string;
  rows: TransitionRow[];
}

/** D/D> down, U up, X chuck, B bass note, P palm mute, · miss. */
export type StrumToken = string;

export interface StrumPattern {
  num: number;
  name: string;
  tag: string;
  /** e.g. "4/4 Beat" */
  meter: string;
  /** The count above the pattern, e.g. ["1","+","2","+",...] */
  count: string[];
  slots: StrumToken[];
}

export interface StrumLevel {
  id: string;
  title: string;
  note: string;
  patterns: StrumPattern[];
}

export interface ScaleShape extends Shape {
  title: string;
  subtitle: string;
}

export type SpecialScale = "first-position" | "sequences" | "keys" | "extended";

export interface Scale {
  id: string;
  num: number;
  name: string;
  /** Diagram used on the overview card. */
  card: Shape;
  title?: string;
  meta?: [string, string][];
  shapes?: ScaleShape[];
  /** Scales with their own interactive page. */
  special?: SpecialScale;
}

export interface ScaleGroup {
  id: string;
  title: string;
  note: string;
  scales: Scale[];
}
