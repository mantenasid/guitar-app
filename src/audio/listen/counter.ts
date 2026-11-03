// Turns a stream of per-frame chord labels into counted chord changes.
// A chord only "lands" once it has been heard for several frames in a row,
// so re-strums, string noise and clicks don't count as changes.

export interface CounterOptions {
  /** Consecutive matching frames before a chord counts as landed. */
  stableFrames: number;
}

export class ChangeCounter {
  /** The chord most recently landed (null before the first one). */
  current: string | null = null;
  count = 0;
  private candidate: string | null = null;
  private streak = 0;

  constructor(private opts: CounterOptions = { stableFrames: 3 }) {}

  /** Feed one frame's label (null = silence or unclear). Returns true when a change was counted. */
  feed(label: string | null): boolean {
    if (label === null) {
      this.candidate = null;
      this.streak = 0;
      return false;
    }
    if (label === this.candidate) this.streak++;
    else {
      this.candidate = label;
      this.streak = 1;
    }
    if (this.streak !== this.opts.stableFrames || label === this.current) return false;
    const changed = this.current !== null;
    this.current = label;
    if (changed) this.count++;
    return changed;
  }

  reset() {
    this.current = null;
    this.count = 0;
    this.candidate = null;
    this.streak = 0;
  }
}
