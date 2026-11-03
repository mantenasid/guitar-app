// Arpeggios: the notes of a chord played one at a time, in movable shapes.
// Each shape is worked out from its chord tones inside a small fret window, so the
// notes, fingers and degrees always agree.
import { midiAt, noteAt, type Finger, type NoteName, type StringNum } from "@/music/theory";

/** Degree names by semitones above the root. */
const DEGREES: Record<number, string> = { 0: "R", 3: "b3", 4: "3", 7: "5", 10: "b7", 11: "7" };

export interface ArpStep {
  s: StringNum;
  f: number;
  finger: Finger;
  /** Chord degree: R, b3, 3, 5, b7 or 7. */
  degree: string;
}

export interface Arpeggio {
  id: string;
  title: string;
  /** Chord the shape is drawn on. Move it up or down the neck for other keys. */
  chord: string;
  root: NoteName;
  tag: string;
  tip: string;
  startFret: number;
  frets: number;
  /** Up from the lowest root, then back down. */
  steps: ArpStep[];
}

const LOW_TO_HIGH: StringNum[] = [6, 5, 4, 3, 2, 1];

/**
 * Every chord tone from the root up to the top string, inside frets start..start+frets-1.
 * Fingers follow one per fret from `start`, with the little finger taking any stretch.
 */
export function arpeggioSteps(rootString: StringNum, rootFret: number, intervals: number[], start: number, frets: number): ArpStep[] {
  const rootMidi = midiAt(rootString, rootFret);
  const up: ArpStep[] = [];
  let last = rootMidi - 1;
  for (const s of LOW_TO_HIGH.slice(LOW_TO_HIGH.indexOf(rootString))) {
    for (let f = start; f < start + frets; f++) {
      const midi = midiAt(s, f);
      const interval = (((midi - rootMidi) % 12) + 12) % 12;
      if (midi <= last || !intervals.includes(interval)) continue;
      up.push({ s, f, finger: Math.min(4, f - start + 1) as Finger, degree: DEGREES[interval]! });
      last = midi;
    }
  }
  return [...up, ...up.slice(0, -1).reverse()];
}

const MAJOR = [0, 4, 7];
const MINOR = [0, 3, 7];
const DOM7 = [0, 4, 7, 10];
const MIN7 = [0, 3, 7, 10];
const MAJ7 = [0, 4, 7, 11];

function arp(id: string, title: string, chord: string, tag: string, tip: string, rootString: StringNum, rootFret: number, intervals: number[], start: number, frets = 5): Arpeggio {
  return { id, title, chord, root: noteAt(rootString, rootFret), tag, tip, startFret: start, frets, steps: arpeggioSteps(rootString, rootFret, intervals, start, frets) };
}

export const ARPEGGIOS: Arpeggio[] = [
  arp("major-6", "Major, low E root", "A", "R 3 5 over two octaves",
    "The shape of an E-shape barre chord, one note at a time. Say the degree as you play it.", 6, 5, MAJOR, 4, 4),
  arp("minor-6", "Minor, low E root", "Am", "R b3 5",
    "Only the 3rd moves: one fret lower than the major shape. Stretch the little finger for the 5th.", 6, 5, MINOR, 3),
  arp("major-5", "Major, A string root", "C", "R 3 5",
    "The A-shape barre chord. Roll the little finger across the 5th fret.", 5, 3, MAJOR, 2, 4),
  arp("minor-5", "Minor, A string root", "Cm", "R b3 5",
    "Start on the root with the ring finger so the index is ready for the b3.", 5, 3, MINOR, 1),
  arp("dom7-6", "Dominant 7, low E root", "A7", "R 3 5 b7",
    "The b7 sits two frets below the root. It gives the bluesy pull back home.", 6, 5, DOM7, 4, 4),
  arp("min7-6", "Minor 7, low E root", "Am7", "R b3 5 b7",
    "The minor pentatonic without the 4th. Great for soloing over minor chords.", 6, 5, MIN7, 3),
  arp("maj7-5", "Major 7, A string root", "Cmaj7", "R 3 5 7",
    "The 7th is one fret below the root. Let it ring; it sounds soft and jazzy.", 5, 3, MAJ7, 2, 4),
  arp("dom7-5", "Dominant 7, A string root", "C7", "R 3 5 b7",
    "Same as the major shape with the b7 added on the G string.", 5, 3, DOM7, 2, 4),
  arp("min7-5", "Minor 7, A string root", "Cm7", "R b3 5 b7",
    "Keep the hand still: every note sits in frets 1 to 5.", 5, 3, MIN7, 1),
];

export const ARPEGGIO_BY_ID: Record<string, Arpeggio> = Object.fromEntries(ARPEGGIOS.map(a => [a.id, a]));
