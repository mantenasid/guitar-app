import { describe, expect, it } from "vitest";
import { ALL_CHORDS, CHORD_BY_KEY } from "@/content";
import { chordVoicing } from "@/music/shapes";
import { ALL_PAIRS } from "@/skills/changes";
import { LEARNED_MATCH, averageChroma, chordTemplate, matchChord, spectrumToChroma, syntheticSpectrum } from "./chroma";
import { rivalsOf } from "./rivals";
import { ChangeCounter } from "./counter";

const SR = 48000;
const FFT = 8192;
const midis = (key: string) => chordVoicing(CHORD_BY_KEY[key]!.shape).map(n => n.midi);
const heard = (key: string, noise = 0.01, seed = 1) => spectrumToChroma(syntheticSpectrum(midis(key), SR, FFT, noise, seed), SR, FFT);
const candidates = (...keys: string[]) => keys.map(k => ({ id: k, template: chordTemplate(midis(k)) }));

describe("chroma", () => {
  it("finds the notes of a single string", () => {
    const c = spectrumToChroma(syntheticSpectrum([45], SR, FFT), SR, FFT); // open A
    const top = [...c.keys()].sort((a, b) => c[b]! - c[a]!)[0];
    expect(top).toBe(9); // A
  });

  it("matches a chord's sound to its own template best", () => {
    for (const c of ALL_CHORDS) {
      const m = matchChord(heard(c.key), candidates(c.key));
      expect(m.id, c.key).toBe(c.key);
    }
  });

  it("tells the two chords apart in every transition pair", () => {
    const failures: string[] = [];
    for (const p of ALL_PAIRS) {
      for (const [played, other] of [[p.a, p.b], [p.b, p.a]] as const) {
        // Same pitch content (e.g. open A5 and movable A5) can't be told apart; skip those.
        if (midis(played).map(m => m % 12).sort().join() === midis(other).map(m => m % 12).sort().join()) continue;
        const m = matchChord(heard(played, 0.02, 7), candidates(p.a, p.b));
        if (m.id !== played) failures.push(`${played} vs ${other}: got ${m.id} ${JSON.stringify(m.scores)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("matches nothing in silence-like noise", () => {
    const noise = spectrumToChroma(syntheticSpectrum([], SR, FFT, 0.05, 3), SR, FFT);
    expect(matchChord(noise, candidates("A", "D")).id).toBeNull();
  });
});

describe("chord recall rivals", () => {
  it("leaves out one-note neighbours but keeps clearly different chords", () => {
    const r = rivalsOf("G");
    expect(r[0]).toBe("G");
    expect(r).not.toContain("G7");
    expect(r).toContain("C");
    expect(r).toContain("Em");
  });

  it("recognises every chord among its rivals", () => {
    for (const c of ALL_CHORDS) {
      const m = matchChord(heard(c.key, 0.02, 11), candidates(...rivalsOf(c.key)));
      expect(m.id, c.key).toBe(c.key);
    }
  });
});

describe("learned templates", () => {
  it("averages taught frames and tells near-identical chords apart", () => {
    const learn = (key: string) => averageChroma([1, 2, 3, 4].map(seed => heard(key, 0.03, seed)));
    const learned = [{ id: "G", template: learn("G") }, { id: "G7", template: learn("G7") }];
    expect(matchChord(heard("G", 0.03, 99), learned, LEARNED_MATCH).id).toBe("G");
    expect(matchChord(heard("G7", 0.03, 98), learned, LEARNED_MATCH).id).toBe("G7");
  });
});

describe("ChangeCounter", () => {
  const run = (labels: (string | null)[], stableFrames = 3) => {
    const c = new ChangeCounter({ stableFrames });
    labels.forEach(l => c.feed(l));
    return c;
  };

  it("counts a change once the new chord holds for a few frames", () => {
    expect(run(["A", "A", "A", "D", "D", "D"]).count).toBe(1);
  });

  it("does not count the first chord, re-strums or blips", () => {
    expect(run(["A", "A", "A"]).count).toBe(0);
    expect(run(["A", "A", "A", null, "A", "A", "A"]).count).toBe(0);
    expect(run(["A", "A", "A", "D", "A", "A"]).count).toBe(0);
  });

  it("counts back-and-forth changes through silence between them", () => {
    const seq = ["A", "A", "A", null, null, "D", "D", "D", null, "A", "A", "A", "D", "D", "D"];
    expect(run(seq).count).toBe(3);
  });

  it("resets", () => {
    const c = run(["A", "A", "A", "D", "D", "D"]);
    c.reset();
    expect([c.count, c.current]).toEqual([0, null]);
  });
});
