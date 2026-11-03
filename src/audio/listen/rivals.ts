import { ALL_CHORDS, CHORD_BY_KEY } from "@/content";
import { chordVoicing } from "@/music/shapes";

const pitchSet = (key: string) => new Set(chordVoicing(CHORD_BY_KEY[key]!.shape).map(n => n.midi % 12));

/** How many notes two chords don't share (G vs G7 = 1, A vs D = 3). */
export function pitchDifference(a: string, b: string): number {
  const x = pitchSet(a);
  const y = pitchSet(b);
  return [...x].filter(n => !y.has(n)).length + [...y].filter(n => !x.has(n)).length;
}

/** Chords one note apart sound too alike to tell apart reliably by ear. */
export const nearTwins = (a: string, b: string) => pitchDifference(a, b) <= 1;

/**
 * The target plus every chord that differs from it by at least two notes, so a
 * wrong shape isn't credited. One-note neighbours (G and G7) are left out: from
 * theory alone they sound too alike to separate reliably.
 */
export function rivalsOf(key: string): string[] {
  const own = pitchSet(key);
  return [key, ...ALL_CHORDS.map(c => c.key).filter(k => {
    if (k === key) return false;
    const other = pitchSet(k);
    const differ = [...own].filter(n => !other.has(n)).length + [...other].filter(n => !own.has(n)).length;
    return differ >= 2;
  })];
}
