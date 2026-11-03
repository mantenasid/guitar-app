// Note/strum onsets from short loudness frames: a sudden jump above the recent level.

export interface OnsetOptions {
  /** dB the frame must jump above the quietest of the recent frames. */
  riseDb: number;
  /** Frames quieter than this never count. */
  floorDb: number;
  /** Seconds before another onset can count. */
  gap: number;
  /** How many earlier frames to compare against. */
  history: number;
}

export const DEFAULT_ONSETS: OnsetOptions = { riseDb: 9, floorDb: -48, gap: 0.09, history: 6 };

export const toDb = (rms: number) => (rms > 0 ? 20 * Math.log10(rms) : -100);

export class OnsetDetector {
  private recent: number[] = [];
  private last = -Infinity;
  /** dB of the quietest recent frame, before the latest push. */
  base = -100;

  constructor(private opts: OnsetOptions = DEFAULT_ONSETS) {}

  /** Feed one frame's RMS and its time; returns true when an onset starts at this frame. */
  push(rms: number, time: number): boolean {
    const db = toDb(rms);
    const { riseDb, floorDb, gap, history } = this.opts;
    const base = this.recent.length ? Math.min(...this.recent) : db;
    this.base = base;
    this.recent.push(db);
    if (this.recent.length > history) this.recent.shift();
    if (db < floorDb || db - base < riseDb || time - this.last < gap) return false;
    this.last = time;
    return true;
  }
}

/** Onset times in a list of frames, e.g. for tests or offline analysis. */
export function detectOnsets(frames: { rms: number; time: number }[], opts: OnsetOptions = DEFAULT_ONSETS): number[] {
  const det = new OnsetDetector(opts);
  return frames.filter(f => det.push(f.rms, f.time)).map(f => f.time);
}

/** Seconds a strum must keep ringing before its onset counts. */
export const RING_SECONDS = 0.06;
/** How far above the level before it a strum must still be by then. */
const RING_RISE_DB = 6;

/**
 * Onsets that keep ringing: a metronome click or beep (about 50 ms) has died away
 * by RING_SECONDS, a strummed string hasn't. Reports the onset's own time, late.
 */
export class StrumOnsets {
  private det: OnsetDetector;
  private pending: { time: number; base: number } | null = null;

  constructor(opts: OnsetOptions = DEFAULT_ONSETS) {
    this.det = new OnsetDetector(opts);
  }

  /** Feed one frame; returns the time of a confirmed strum, or null. */
  push(rms: number, time: number): number | null {
    const started = this.det.push(rms, time);
    const p = this.pending;
    let confirmed: number | null = null;
    if (p && time - p.time >= RING_SECONDS) {
      if (toDb(rms) - p.base >= RING_RISE_DB) confirmed = p.time;
      this.pending = null;
    }
    if (started) this.pending = { time, base: this.det.base };
    return confirmed;
  }
}
