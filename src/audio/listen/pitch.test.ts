import { describe, expect, it } from "vitest";
import { StrumOnsets, detectOnsets } from "./onsets";
import { centsFrom, detectPitch, hzToNote } from "./pitch";
import { nearestString } from "@/features/tuner/TunerPage";

const SR = 48000;

/** A guitar-ish tone: fundamental plus a few harmonics. */
function tone(hz: number, n = 2048, harmonics = [1, 0.6, 0.4, 0.25]) {
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) harmonics.forEach((a, h) => (buf[i]! += 0.2 * a * Math.sin((2 * Math.PI * hz * (h + 1) * i) / SR)));
  return buf;
}

describe("pitch", () => {
  it("reads every open string", () => {
    for (const [midi, name] of [[40, "E"], [45, "A"], [50, "D"], [55, "G"], [59, "B"], [64, "E"]] as const) {
      const hz = 440 * Math.pow(2, (midi - 69) / 12);
      const p = detectPitch(tone(hz), SR)!;
      expect(p.clarity).toBeGreaterThan(0.85);
      const r = hzToNote(p.hz);
      expect(r.note).toBe(name);
      expect(r.midi).toBe(midi);
      expect(Math.abs(r.cents)).toBeLessThanOrEqual(1);
    }
  });

  it("measures a string that is 10 cents sharp", () => {
    const hz = 82.407 * Math.pow(2, 10 / 1200);
    const p = detectPitch(tone(hz), SR)!;
    expect(Math.round(centsFrom(p.hz, 40))).toBeGreaterThanOrEqual(9);
    expect(Math.round(centsFrom(p.hz, 40))).toBeLessThanOrEqual(11);
  });

  it("ignores silence and noise", () => {
    expect(detectPitch(new Float32Array(2048), SR)).toBeNull();
    let seed = 3;
    const noise = Float32Array.from({ length: 2048 }, () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.4);
    expect(detectPitch(noise, SR)).toBeNull();
  });

  it("finds the nearest string for the tuner", () => {
    expect(nearestString(80)).toBe(6);
    expect(nearestString(112)).toBe(5);
    expect(nearestString(250)).toBe(2);
    expect(nearestString(330)).toBe(1);
  });
});

describe("onsets", () => {
  it("finds each pluck in a decaying click train", () => {
    const hits = [0.5, 1.0, 1.25, 2.0];
    const frames = [];
    for (let t = 0; t < 2.5; t += 0.01) {
      let rms = 0.0005;
      for (const h of hits) if (t >= h - 0.004) rms += 0.3 * Math.exp(-(t - h) * 6);
      frames.push({ rms, time: t });
    }
    const found = detectOnsets(frames);
    expect(found).toHaveLength(hits.length);
    found.forEach((t, i) => expect(Math.abs(t - hits[i]!)).toBeLessThan(0.015));
  });

  it("ignores quiet wobble", () => {
    const frames = Array.from({ length: 200 }, (_, i) => ({ rms: 0.0005 * (1 + (i % 7)), time: i * 0.01 }));
    expect(detectOnsets(frames)).toEqual([]);
  });

  it("counts ringing strums but not short clicks", () => {
    // Strums ring for seconds; clicks die away within about 50 ms.
    const strumsAt = [0.5, 1.5];
    const clicksAt = [1.0, 2.0];
    const det = new StrumOnsets();
    const found: number[] = [];
    for (let t = 0; t < 2.5; t += 0.01) {
      let rms = 0.0005;
      for (const h of strumsAt) if (t >= h) rms += 0.3 * Math.exp(-(t - h) * 2);
      for (const h of clicksAt) if (t >= h) rms += 0.3 * Math.exp(-(t - h) * 180);
      const hit = det.push(rms, t);
      if (hit !== null) found.push(hit);
    }
    expect(found).toHaveLength(2);
    found.forEach((t, i) => expect(Math.abs(t - strumsAt[i]!)).toBeLessThan(0.015));
  });
});
