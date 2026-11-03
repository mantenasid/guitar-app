import { describe, expect, it } from "vitest";
import { barreVoicing, makeQuestion, makeRound, scorePercent, type Rng } from "./quiz";

/** Small seeded generator so rounds repeat exactly. */
function seeded(seed: number): Rng {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

describe("ear quiz", () => {
  it("voices chords as E-shape barres in guitar range", () => {
    expect(barreVoicing(4, "Major")).toEqual([40, 47, 52, 56, 59, 64]);
    expect(barreVoicing(9, "Minor")).toEqual([45, 52, 57, 60, 64, 69]);
    expect(barreVoicing(3, "Dominant 7")[0]).toBe(51);
  });

  it("asks major or minor with the answer among the choices", () => {
    const rng = seeded(1);
    for (let i = 0; i < 30; i++) {
      const q = makeQuestion("major-minor", rng);
      expect(q.choices).toEqual(["Major", "Minor"]);
      expect(q.choices).toContain(q.answer);
      expect(q.chords).toHaveLength(1);
    }
  });

  it("plays home then the change, a fourth, fifth or sixth above", () => {
    const rng = seeded(7);
    for (let i = 0; i < 30; i++) {
      const q = makeQuestion("changes", rng);
      const [home, to] = q.chords.map(c => c[0]!);
      const up = ((to! - home!) % 12 + 12) % 12;
      expect({ IV: 5, V: 7, vi: 9 }[q.answer]).toBe(up);
    }
  });

  it("names chords from the player's own pool", () => {
    const pool = [{ key: "Em", midis: [40] }, { key: "A", midis: [45] }, { key: "D", midis: [50] }];
    const round = makeRound("chords", seeded(3), pool);
    expect(round).toHaveLength(10);
    for (const q of round) expect(q.chords[0]).toEqual(pool.find(p => p.key === q.answer)!.midis);
    round.slice(1).forEach((q, i) => expect(q.reveal).not.toBe(round[i]!.reveal));
  });

  it("scores a round as a percentage", () => {
    expect(scorePercent(7, 10)).toBe(70);
    expect(scorePercent(0, 0)).toBe(0);
  });
});
