// Chord recognition from a magnitude spectrum.
// The spectrum is folded into a 12-value "chroma" profile (how much of each note
// is sounding) and compared with what each candidate chord should sound like.

export type Chroma = Float32Array; // 12 values, C..B, unit length

const LOWEST_HZ = 70; // just under low E (82 Hz)
const HIGHEST_HZ = 2100; // fundamentals and the strongest harmonics

const freqToMidi = (f: number) => 69 + 12 * Math.log2(f / 440);
const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function normalise(v: Float32Array): Float32Array {
  let sum = 0;
  for (const x of v) sum += x * x;
  const len = Math.sqrt(sum);
  if (len > 0) for (let i = 0; i < v.length; i++) v[i]! /= len;
  return v;
}

/**
 * Fold a linear magnitude spectrum (bins 0..fftSize/2) into 12 note classes.
 * Bins far from a semitone centre count less, which keeps neighbouring notes apart.
 */
export function spectrumToChroma(mags: ArrayLike<number>, sampleRate: number, fftSize: number): Chroma {
  const chroma = new Float32Array(12);
  const binHz = sampleRate / fftSize;
  const first = Math.max(1, Math.floor(LOWEST_HZ / binHz));
  const last = Math.min(mags.length - 1, Math.ceil(HIGHEST_HZ / binHz));
  for (let k = first; k <= last; k++) {
    const m = mags[k]!;
    if (m <= 0) continue;
    const midi = freqToMidi(k * binHz);
    const nearest = Math.round(midi);
    const closeness = Math.max(0, 1 - 2 * Math.abs(midi - nearest));
    chroma[((nearest % 12) + 12) % 12]! += m * m * closeness;
  }
  for (let i = 0; i < 12; i++) chroma[i] = Math.sqrt(chroma[i]!);
  return normalise(chroma);
}

/** Harmonics a plucked string adds, as [interval in semitones, relative strength]. */
const HARMONICS: [number, number][] = [[0, 1], [12, 0.5], [19, 0.35], [24, 0.25], [28, 0.2]];

/** The chroma a chord's notes should produce, including their main harmonics. */
export function chordTemplate(midis: number[]): Chroma {
  const t = new Float32Array(12);
  for (const m of midis) for (const [semi, w] of HARMONICS) t[(m + semi) % 12]! += w;
  return normalise(t);
}

export function similarity(a: Chroma, b: Chroma): number {
  let s = 0;
  for (let i = 0; i < 12; i++) s += a[i]! * b[i]!;
  return s;
}

export interface Candidate {
  id: string;
  template: Chroma;
}

export interface Match {
  /** Best-matching candidate, or null when nothing matches clearly. */
  id: string | null;
  scores: Record<string, number>;
}

export interface MatchOptions {
  /** Minimum similarity for a match (0–1). */
  minScore: number;
  /** How far ahead of the runner-up the winner must be. */
  minMargin: number;
  /** Shrink the margin for chords that are alike on paper (theory templates only). */
  adaptiveMargin?: boolean;
}

/** For templates worked out from theory. */
export const DEFAULT_MATCH: MatchOptions = { minScore: 0.82, minMargin: 0.03, adaptiveMargin: true };

/**
 * For templates learned from the player's own strums. Tuned on recordings of
 * every hard pair (G/G7, E/Em, A/A7…): no missed and no phantom changes.
 */
export const LEARNED_MATCH: MatchOptions = { minScore: 0.75, minMargin: 0.02, adaptiveMargin: false };

export function matchChord(chroma: Chroma, candidates: Candidate[], opts: MatchOptions = DEFAULT_MATCH): Match {
  const scores: Record<string, number> = {};
  const ranked = candidates
    .map(c => ({ c, s: (scores[c.id] = similarity(chroma, c.template)) }))
    .sort((a, b) => b.s - a.s);
  const [first, second] = ranked;
  if (!first || first.s < opts.minScore) return { id: null, scores };
  if (!second) return { id: first.c.id, scores };
  // Chords that share most notes (G and G7 differ by one string) can only ever be
  // a little apart, so the lead needed shrinks with how alike they are on paper.
  const alike = similarity(first.c.template, second.c.template);
  const needed = opts.adaptiveMargin ? Math.min(opts.minMargin, 0.4 * (1 - alike)) : opts.minMargin;
  return { id: first.s - second.s >= needed ? first.c.id : null, scores };
}

/** Average several frames' chroma into one learned template. */
export function averageChroma(frames: Chroma[]): Chroma {
  const sum = new Float32Array(12);
  for (const f of frames) for (let i = 0; i < 12; i++) sum[i]! += f[i]!;
  return normalise(sum);
}

/**
 * A synthetic magnitude spectrum for some notes: each note's harmonics as narrow
 * peaks, plus a little noise. Used by tests and the simulated-guitar check.
 */
export function syntheticSpectrum(midis: number[], sampleRate: number, fftSize: number, noise = 0.01, seed = 1): Float32Array {
  const bins = new Float32Array(fftSize / 2);
  const binHz = sampleRate / fftSize;
  let r = seed;
  const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < bins.length; k++) bins[k] = noise * rand();
  for (const m of midis) {
    for (let h = 1; h <= 6; h++) {
      const f = midiToFreq(m) * h;
      const centre = f / binHz;
      for (let k = Math.floor(centre) - 2; k <= Math.ceil(centre) + 2; k++) {
        if (k < 0 || k >= bins.length) continue;
        bins[k]! += (1 / h) * Math.exp(-((k - centre) ** 2) / 1.2);
      }
    }
  }
  return bins;
}
