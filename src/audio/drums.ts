// Synthesised drum kit for the home page: every hit is built from oscillators and noise, so it works offline.
import { audioContext, synthOutput } from "./guitar";

export type Drum = "kick" | "snare" | "rackTom" | "floorTom" | "hihat" | "crash" | "ride" | "splash";

let noise: AudioBuffer | null = null;

function noiseBuffer(ctx: AudioContext) {
  if (noise) return noise;
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

/** A gain that jumps to `peak` and dies away over `decay` seconds. */
function envelope(ctx: AudioContext, t: number, peak: number, decay: number) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  g.connect(synthOutput());
  return g;
}

function noiseHit(ctx: AudioContext, t: number, filters: BiquadFilterNode[], peak: number, decay: number) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const out = envelope(ctx, t, peak, decay);
  let last: AudioNode = src;
  for (const f of filters) last = last.connect(f);
  last.connect(out);
  src.start(t);
  src.stop(t + decay + 0.05);
}

function filter(ctx: AudioContext, type: BiquadFilterType, hz: number, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = hz;
  f.Q.value = q;
  return f;
}

/** A sine whose pitch falls from `from` to `to`: the body of a kick or tom. */
function thump(ctx: AudioContext, t: number, from: number, to: number, peak: number, decay: number) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + 0.12);
  osc.connect(envelope(ctx, t, peak, decay));
  osc.start(t);
  osc.stop(t + decay + 0.05);
}

/** Clashing square waves at inharmonic ratios give a cymbal its metallic ring. */
function metal(ctx: AudioContext, t: number, base: number, peak: number, decay: number) {
  const out = envelope(ctx, t, peak, decay);
  const hp = filter(ctx, "highpass", 6000);
  hp.connect(out);
  for (const r of [2, 3, 4.16, 5.43, 6.79, 8.21]) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = base * r;
    osc.connect(hp);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  }
}

export function hit(drum: Drum) {
  const ctx = audioContext();
  const t = ctx.currentTime;
  switch (drum) {
    case "kick":
      thump(ctx, t, 140, 42, 1.1, 0.45);
      noiseHit(ctx, t, [filter(ctx, "lowpass", 2500)], 0.25, 0.02);
      break;
    case "snare":
      thump(ctx, t, 260, 180, 0.45, 0.12);
      noiseHit(ctx, t, [filter(ctx, "highpass", 1400)], 0.7, 0.22);
      break;
    case "rackTom":
      thump(ctx, t, 260, 165, 0.8, 0.4);
      break;
    case "floorTom":
      thump(ctx, t, 170, 95, 0.9, 0.55);
      break;
    case "hihat":
      metal(ctx, t, 40, 0.12, 0.07);
      noiseHit(ctx, t, [filter(ctx, "highpass", 7500)], 0.35, 0.06);
      break;
    case "crash":
      metal(ctx, t, 38, 0.08, 1.4);
      noiseHit(ctx, t, [filter(ctx, "highpass", 4500)], 0.45, 1.7);
      break;
    case "splash":
      metal(ctx, t, 46, 0.08, 0.7);
      noiseHit(ctx, t, [filter(ctx, "highpass", 6000)], 0.4, 0.8);
      break;
    case "ride":
      metal(ctx, t, 52, 0.1, 1.1);
      noiseHit(ctx, t, [filter(ctx, "bandpass", 9000, 1.2)], 0.18, 0.9);
      break;
  }
}
