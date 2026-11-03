// Progressions to play along with: common, generic chord sequences, one chord per bar.

export interface Progression {
  id: string;
  title: string;
  key: string;
  tag: string;
  tip: string;
  /** One chord key per bar. */
  bars: string[];
  /** Roman numeral per bar, matching `bars`. */
  numerals: string[];
}

function prog(id: string, title: string, key: string, tag: string, tip: string, bars: [string, string][]): Progression {
  return { id, title, key, tag, tip, bars: bars.map(b => b[0]), numerals: bars.map(b => b[1]) };
}

const blues = (I: string, IV: string, V: string): [string, string][] => [
  [I, "I7"], [I, "I7"], [I, "I7"], [I, "I7"],
  [IV, "IV7"], [IV, "IV7"], [I, "I7"], [I, "I7"],
  [V, "V7"], [IV, "IV7"], [I, "I7"], [V, "V7"],
];

export const PROGRESSIONS: Progression[] = [
  prog("i-iv-v-a", "I–IV–V", "A", "The three chords behind countless rock and folk songs",
    "Look at the next chord a beat early so your fingers are on their way before the bar ends.",
    [["A", "I"], ["D", "IV"], ["E", "V"], ["A", "I"]]),
  prog("i-v-vi-iv-g", "I–V–vi–IV", "G", "The pop progression",
    "Keep the strum going through every change, even if a chord sounds rough at first.",
    [["G", "I"], ["D", "V"], ["Em", "vi"], ["C", "IV"]]),
  prog("i-vi-iv-v-g", "I–vi–IV–V", "G", "The doo-wop progression",
    "G to Em is the easy one; C to D needs the ring finger to lead.",
    [["G", "I"], ["Em", "vi"], ["C", "IV"], ["D", "V"]]),
  prog("ii-v-i-c", "ii–V–I", "C", "The strongest pull home in music",
    "Feel how G wants to land on C. Let the last bar ring.",
    [["Dm", "ii"], ["G", "V"], ["C", "I"], ["C", "I"]]),
  prog("vi-iv-i-v-c", "vi–IV–I–V", "C", "The pop progression, starting on the minor chord",
    "The mini F keeps the change from Am small: only the index finger flattens.",
    [["Am", "vi"], ["F (mini)", "IV"], ["C", "I"], ["G", "V"]]),
  prog("blues-a", "12-bar blues", "A", "Twelve bars of dominant 7ths",
    "Count the bars out loud at first: four of A7, two of D7, two of A7, then E7 D7 A7 E7.",
    blues("A7", "D7", "E7")),
  prog("blues-e", "12-bar blues", "E", "The guitar's home key for the blues",
    "B7 is the stretch. Get it on beat one, even if you skip the last strum of the bar before.",
    blues("E7", "A7", "B7")),
];

export const PROGRESSION_BY_ID: Record<string, Progression> = Object.fromEntries(PROGRESSIONS.map(p => [p.id, p]));

/** Each distinct change in the progression, including the one from the last bar back to the first. */
export function progressionChanges(p: Progression): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  p.bars.forEach((a, i) => {
    const b = p.bars[(i + 1) % p.bars.length]!;
    const key = [a, b].sort().join("|");
    if (a !== b && !seen.has(key)) {
      seen.add(key);
      out.push([a, b]);
    }
  });
  return out;
}
