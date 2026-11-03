// Fingerpicking: which strings each token plucks, and a looping player.
import type { PickPattern, PickToken } from "@/content/fingerpicking";
import type { ShapeNote } from "@/music/shapes";
import * as guitar from "./guitar";
import { startBarLoop, type BarLoopOptions } from "./strum";

const FINGER_STRING = { i: 3, m: 2, a: 1 } as const;

/** Notes a token plucks from a chord voicing (low to high), as MIDI numbers. */
export function pickNotes(tok: PickToken, voicing: ShapeNote[]): number[] {
  const root = voicing[0];
  if (!root || tok === "·") return [];
  const onString = (s: number) => (voicing.find(n => n.s === s) ?? voicing.at(-1)!).midi;
  // The thumb alternates to the 4th string, or the next string up when the root is already there.
  const alt = () => (root.s >= 5 ? onString(4) : (voicing[1] ?? root).midi);
  const out: number[] = [];
  if (tok.startsWith("p")) out.push(tok === "p2" ? alt() : root.midi);
  const finger = tok.at(-1);
  if (finger === "i" || finger === "m" || finger === "a") out.push(onString(FINGER_STRING[finger]));
  return out;
}

export interface PickOptions extends BarLoopOptions {
  sound: boolean;
  /** Chord voicing, low to high. */
  voicing: ShapeNote[];
}

/** Loops a picking pattern after a one-bar count-in until `stop()` is called. */
export function startPickLoop(pattern: PickPattern, getOptions: () => PickOptions) {
  return startBarLoop(pattern.count, false, getOptions, (i, when, o) => {
    if (!o.sound) return;
    const tok = pattern.slots[i]!;
    for (const midi of pickNotes(tok, o.voicing)) guitar.pluck(midi, { when, gain: tok.startsWith("p") && midi === o.voicing[0]?.midi ? 0.6 : 0.45 });
  });
}
