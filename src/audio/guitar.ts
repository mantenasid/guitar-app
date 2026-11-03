// Plucked-string synth (Karplus-Strong), metronome click and muted "chuck".
// Everything is synthesised in the browser, so it works offline.
import { midiToFrequency } from "@/music/theory";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const cache = new Map<string, AudioBuffer>();

function audio(): { ctx: AudioContext; master: GainNode } {
  if (!ctx || !master) {
    ctx = new AudioContext({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, master };
}

export const now = () => audio().ctx.currentTime;

/** The shared audio context and the synth's output, for analysis. */
export const audioContext = () => audio().ctx;
export const synthOutput = () => audio().master;

/** A noise burst fed through an averaging delay line sounds like a plucked string. */
function stringBuffer(midi: number, damped: boolean): AudioBuffer {
  const key = `${midi}${damped ? "d" : ""}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { ctx } = audio();
  const sr = ctx.sampleRate;
  const period = Math.max(2, Math.round(sr / midiToFrequency(midi)));
  const length = Math.floor(sr * (damped ? 0.28 : 2.4));
  const buf = ctx.createBuffer(1, length, sr);
  const out = buf.getChannelData(0);
  const ring = new Float32Array(period);
  let prev = 0;
  for (let i = 0; i < period; i++) {
    // Lightly low-passed noise gives a rounder attack.
    prev = prev * 0.45 + (Math.random() * 2 - 1) * 0.55;
    ring[i] = prev;
  }
  const decay = damped ? 0.93 : 0.9965;
  let idx = 0;
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const next = idx + 1 === period ? 0 : idx + 1;
    const v = ring[idx]!;
    ring[idx] = decay * 0.5 * (v + ring[next]!);
    out[i] = v;
    peak = Math.max(peak, Math.abs(v));
    idx = next;
  }
  if (peak > 0) for (let i = 0; i < length; i++) out[i]! /= peak;
  const fade = Math.min(length, Math.floor(sr * 0.03));
  for (let i = 0; i < fade; i++) out[length - 1 - i]! *= i / fade;
  cache.set(key, buf);
  return buf;
}

interface NoteOpts {
  when?: number;
  gain?: number;
  damped?: boolean;
}

export function pluck(midi: number, { when, gain = 0.5, damped = false }: NoteOpts = {}) {
  const { ctx, master } = audio();
  const src = ctx.createBufferSource();
  src.buffer = stringBuffer(midi, damped);
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g);
  if (damped) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    g.connect(lp);
    lp.connect(master);
  } else {
    g.connect(master);
  }
  src.start(when ?? ctx.currentTime);
}

/** midis low to high; an up-strum plays them in reverse. */
export function strum(midis: number[], opts: NoteOpts & { dir?: "down" | "up"; spread?: number } = {}) {
  const when = opts.when ?? now();
  const order = opts.dir === "up" ? [...midis].reverse() : midis;
  const spread = opts.spread ?? 0.014;
  const gain = (opts.gain ?? 0.5) / Math.sqrt(Math.max(1, order.length) / 2);
  order.forEach((m, i) => pluck(m, { when: when + i * spread, gain, damped: opts.damped }));
}

/** Percussive muted hit: a short band-passed noise burst. */
export function chuck({ when, gain = 0.9 }: NoteOpts = {}) {
  const { ctx, master } = audio();
  const len = Math.floor(ctx.sampleRate * 0.06);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(when ?? ctx.currentTime);
}

export function click({ when, accent = false }: { when?: number; accent?: boolean } = {}) {
  const { ctx, master } = audio();
  const t = when ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.value = accent ? 1600 : 1050;
  g.gain.setValueAtTime(accent ? 0.35 : 0.22, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + 0.06);
}

export function beep({ when, hz = 880, dur = 0.25 }: { when?: number; hz?: number; dur?: number } = {}) {
  const { ctx, master } = audio();
  const t = when ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.value = hz;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}
