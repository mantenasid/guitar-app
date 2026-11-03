// Standard tuning, note names and fretboard maths.
// Strings are numbered like guitar tab: 1 = high e (top line), 6 = low E (bottom line).

export type StringNum = 1 | 2 | 3 | 4 | 5 | 6;
export type Finger = 1 | 2 | 3 | 4;

export const STRINGS: StringNum[] = [6, 5, 4, 3, 2, 1];

/** MIDI note of each open string in standard tuning (E2 A2 D3 G3 B3 E4). */
export const OPEN_MIDI: Record<StringNum, number> = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };

export const STRING_NAMES: Record<StringNum, string> = {
  6: "Low E", 5: "A", 4: "D", 3: "G", 2: "B", 1: "High e",
};

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export type NoteName = (typeof NOTE_NAMES)[number];

const FLAT_TO_SHARP: Record<string, NoteName> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };
const SHARP_TO_FLAT: Partial<Record<NoteName, string>> = { "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb" };

export function midiAt(s: StringNum, fret: number): number {
  return OPEN_MIDI[s] + fret;
}

export function noteAt(s: StringNum, fret: number): NoteName {
  return NOTE_NAMES[midiAt(s, fret) % 12]!;
}

/** "Bb" -> "A#", so notes can be compared regardless of spelling. */
export function normaliseNote(n: string): NoteName {
  if (n in FLAT_TO_SHARP) return FLAT_TO_SHARP[n]!;
  if ((NOTE_NAMES as readonly string[]).includes(n)) return n as NoteName;
  throw new Error(`Unknown note: ${n}`);
}

export function spellFlat(n: NoteName): string {
  return SHARP_TO_FLAT[n] ?? n;
}

export function transpose(n: NoteName, semitones: number): NoteName {
  return NOTE_NAMES[(NOTE_NAMES.indexOf(n) + semitones + 120) % 12]!;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Root letter of a chord name: "F#5" -> "F#", "Em" -> "E", "Bb7" -> "A#". */
export function chordRoot(name: string): NoteName {
  const m = name.match(/^[A-G][#b]?/);
  if (!m) throw new Error(`No root in chord name: ${name}`);
  return normaliseNote(m[0]);
}
