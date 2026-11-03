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
