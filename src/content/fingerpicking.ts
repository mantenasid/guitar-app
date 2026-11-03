// Fingerpicking patterns, easiest first. The thumb (p) plays the bass, the fingers
// (i, m, a) the G, B and high E strings. Counts use the strumming format.

/**
 * p = thumb on the root bass, p2 = thumb on the alternate bass,
 * i/m/a = index, middle, ring on strings 3/2/1, pi/pm/pa = thumb and finger together (a pinch),
 * "·" = rest.
 */
export type PickToken = "p" | "p2" | "i" | "m" | "a" | "pi" | "pm" | "pa" | "·";

export interface PickPattern {
  id: string;
  name: string;
  tag: string;
  meter: string;
  count: string[];
  slots: PickToken[];
}

const QUARTERS = ["1", "2", "3", "4"];
const EIGHTHS = ["1", "+", "2", "+", "3", "+", "4", "+"];
const WALTZ = ["1", "+", "2", "+", "3", "+"];

export const PICK_PATTERNS: PickPattern[] = [
  { id: "thumb", name: "Thumb quarters", tag: "steady bass", meter: "4/4", count: QUARTERS, slots: ["p", "p", "p", "p"] },
  { id: "pinch", name: "Thumb and pinch", tag: "bass with a pinch", meter: "4/4", count: QUARTERS, slots: ["pa", "p", "pa", "p"] },
  { id: "pima", name: "p-i-m-a", tag: "rolling arpeggio", meter: "4/4", count: EIGHTHS, slots: ["p", "i", "m", "a", "p", "i", "m", "a"] },
  { id: "pimi", name: "p-i-m-i", tag: "up and back", meter: "4/4", count: EIGHTHS, slots: ["p", "i", "m", "i", "p", "i", "m", "i"] },
  { id: "alt-bass", name: "Alternating bass", tag: "thumb walks", meter: "4/4", count: EIGHTHS, slots: ["p", "i", "p2", "m", "p", "i", "p2", "m"] },
  { id: "travis", name: "Basic Travis", tag: "thumb on every beat", meter: "4/4", count: EIGHTHS, slots: ["p", "m", "p2", "i", "p", "m", "p2", "i"] },
  { id: "waltz", name: "Waltz arpeggio", tag: "3/4", meter: "3/4", count: WALTZ, slots: ["p", "i", "m", "a", "m", "i"] },
  { id: "travis-pinch", name: "Travis with pinch", tag: "pinch on the one", meter: "4/4", count: EIGHTHS, slots: ["pm", "i", "p2", "m", "p", "i", "p2", "m"] },
  { id: "pami", name: "p-a-m-i", tag: "descending roll", meter: "4/4", count: EIGHTHS, slots: ["p", "a", "m", "i", "p", "a", "m", "i"] },
  { id: "travis-sync", name: "Syncopated Travis", tag: "fingers off the beat", meter: "4/4", count: EIGHTHS, slots: ["pa", "·", "p2", "m", "p", "i", "p2", "·"] },
];

export const PICK_BY_ID: Record<string, PickPattern> = Object.fromEntries(PICK_PATTERNS.map(p => [p.id, p]));
