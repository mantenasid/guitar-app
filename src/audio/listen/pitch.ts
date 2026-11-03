// Single-note pitch detection (YIN) for the tuner and the "answer by playing" games.
import { NOTE_NAMES, type NoteName } from "@/music/theory";

export interface Pitch {
  hz: number;
  /** 0–1: how periodic the signal is. Above ~0.85 is a clear note. */
  clarity: number;
}

const THRESHOLD = 0.15;
/** Below this RMS the signal is treated as silence. */
const SILENCE = 0.004;

/** The fundamental of a single note in `buf`, or null for silence or noise. */
export function detectPitch(buf: Float32Array, sampleRate: number, minHz = 70, maxHz = 1100): Pitch | null {
  let sum = 0;
  for (const v of buf) sum += v * v;
  if (Math.sqrt(sum / buf.length) < SILENCE) return null;

  const minTau = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxTau = Math.min(Math.floor(sampleRate / minHz), Math.floor(buf.length / 2));
  const w = buf.length - maxTau;
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < w; i++) {
      const x = buf[i]! - buf[i + tau]!;
      s += x * x;
    }
    d[tau] = s;
  }
  // Cumulative mean normalised difference: dips well below 1 at the period.
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += d[tau]!;
    cmnd[tau] = running ? (d[tau]! * tau) / running : 1;
  }

  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (cmnd[t]! < THRESHOLD) {
      while (t + 1 <= maxTau && cmnd[t + 1]! < cmnd[t]!) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) {
    // No clear dip: take the lowest one, but report it as unclear.
    let best = minTau;
    for (let t = minTau; t <= maxTau; t++) if (cmnd[t]! < cmnd[best]!) best = t;
    if (cmnd[best]! > 0.4) return null;
    tau = best;
  }
  // Parabolic interpolation around the dip for sub-sample accuracy.
  const a = cmnd[tau - 1] ?? cmnd[tau]!;
  const b = cmnd[tau]!;
  const c = cmnd[tau + 1] ?? cmnd[tau]!;
  const den = a - 2 * b + c;
  const shift = den ? (a - c) / (2 * den) : 0;
  return { hz: sampleRate / (tau + shift), clarity: Math.max(0, Math.min(1, 1 - b)) };
}

export interface NoteReading {
  note: NoteName;
  octave: number;
  midi: number;
  /** −50 to +50: how far off the nearest note. */
  cents: number;
}

export function hzToNote(hz: number): NoteReading {
  const exact = 69 + 12 * Math.log2(hz / 440);
  const midi = Math.round(exact);
  return { note: NOTE_NAMES[((midi % 12) + 12) % 12]!, octave: Math.floor(midi / 12) - 1, midi, cents: Math.round((exact - midi) * 100) };
}

/** Cents from `hz` to a target MIDI note. */
export const centsFrom = (hz: number, midi: number) => 1200 * Math.log2(hz / (440 * Math.pow(2, (midi - 69) / 12)));
