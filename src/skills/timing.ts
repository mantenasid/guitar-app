// Timing accuracy: how many strums land on the pacer click. Stored as `timing:<pair>`
// attempts next to the change drill. It isn't a skill, so it earns no XP and has no levels.

/** A strum within this many seconds of a click counts as on the click. */
export const TIMING_WINDOW = 0.06;
/** Drills averaged for the timing figure shown. */
export const TIMING_RECENT = 3;
/** Fewer strums than this and the drill gives no timing score. */
export const MIN_STRUMS = 4;

export const timingId = (pairKey: string) => `timing:${pairKey}`;

/**
 * Percent of onsets within `window` of the nearest click. Onsets are when the mic
 * heard a strum, so `latency` (seconds from a click being scheduled to it being
 * heard and played along to) is taken off them first. Null when there's too little to judge.
 */
export function timingScore(onsets: readonly number[], clicks: readonly number[], latency = 0, window = TIMING_WINDOW): number | null {
  if (onsets.length < MIN_STRUMS || !clicks.length) return null;
  const sorted = [...clicks].sort((a, b) => a - b);
  let onTime = 0;
  let i = 0;
  for (const t of [...onsets].sort((a, b) => a - b).map(o => o - latency)) {
    while (i + 1 < sorted.length && sorted[i + 1]! <= t) i++;
    const near = Math.min(Math.abs(t - sorted[i]!), i + 1 < sorted.length ? Math.abs(sorted[i + 1]! - t) : Infinity);
    if (near <= window) onTime++;
  }
  return Math.round((onTime / onsets.length) * 100);
}

/** Average of the last few timing scores, oldest first in `values`. */
export function recentTiming(values: readonly number[]): number | undefined {
  const last = values.slice(-TIMING_RECENT);
  return last.length ? Math.round(last.reduce((a, b) => a + b, 0) / last.length) : undefined;
}

/** A note within this many seconds of where it belongs counts as landed. */
export const LAND_WINDOW = 0.07;
/** Fewer expected notes than this and there's nothing to judge yet. */
export const MIN_NOTES = 4;
/** The steady lag between a note being due and the mic hearing it (speaker and mic delay), within these bounds. */
const LAG_RANGE = [-0.04, 0.25] as const;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
};

/** Nearest value in a sorted list. */
function nearest(sorted: readonly number[], t: number): number {
  let lo = 0;
  let hi = sorted.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid]! <= t) lo = mid;
    else hi = mid;
  }
  return Math.abs(sorted[lo]! - t) <= Math.abs(sorted[hi]! - t) ? sorted[lo]! : sorted[hi]!;
}

export interface Landed {
  /** Percent of the notes that were due and landed, with stray extra notes counting against it. */
  percent: number;
  hit: number;
  due: number;
}

/**
 * How well what was heard matches the notes that were due. Speaker and mic delay push every
 * heard note late by about the same amount, so that steady lag is measured from the playing
 * itself and taken off first: only unsteady timing, missed notes and extra notes cost points.
 */
export function landedScore(heard: readonly number[], due: readonly number[], window = LAND_WINDOW): Landed | null {
  if (due.length < MIN_NOTES) return null;
  const grid = [...due].sort((a, b) => a - b);
  if (!heard.length) return { percent: 0, hit: 0, due: grid.length };
  const lag = Math.min(LAG_RANGE[1], Math.max(LAG_RANGE[0], median(heard.map(t => t - nearest(grid, t)))));
  const notes = heard.map(t => t - lag).sort((a, b) => a - b);
  let hit = 0;
  let i = 0;
  for (const t of grid) {
    while (i < notes.length && notes[i]! < t - window) i++;
    if (i < notes.length && notes[i]! <= t + window) {
      hit++;
      i++;
    }
  }
  return { percent: Math.round((hit / Math.max(grid.length, notes.length)) * 100), hit, due: grid.length };
}

/** The grid with a note added halfway between each pair, for playing two notes to the click. */
export function withHalves(due: readonly number[]): number[] {
  const grid = [...due].sort((a, b) => a - b);
  return grid.flatMap((t, i) => (i + 1 < grid.length ? [t, (t + grid[i + 1]!) / 2] : [t]));
}

/** Whether a heard pitch is the wanted note, in any octave: low strings are often heard an octave up. */
export function sameNote(hz: number, midi: number, cents = 45): boolean {
  const off = 1200 * Math.log2(hz / (440 * Math.pow(2, (midi - 69) / 12)));
  const wrapped = ((off % 1200) + 1200) % 1200;
  return Math.min(wrapped, 1200 - wrapped) <= cents;
}
