// Generated from the legacy site by scripts/generate-content.py.
import type { ChordGroup } from "./types";

export const CHORD_GROUPS: ChordGroup[] = [
  {
    id: "basic", title: "Open chords", note: "The 5 major and 3 minor shapes everything else builds on.",
    sections: [
      {
        title: "Major",
        chords: [
          { key: "E", name: "E Major", tag: "All 6 Strings", shape: {"startFret": 1, "nut": true, "open": [1, 2, 6], "root": "E", "dots": [{"s": 5, "f": 2, "finger": 2}, {"s": 4, "f": 2, "finger": 3}, {"s": 3, "f": 1, "finger": 1}]} },
          { key: "A", name: "A Major", tag: "5th String Root", shape: {"startFret": 1, "nut": true, "muted": [6], "open": [1, 5], "root": "A", "dots": [{"s": 4, "f": 2, "finger": 1}, {"s": 3, "f": 2, "finger": 2}, {"s": 2, "f": 2, "finger": 3}]} },
          { key: "D", name: "D Major", tag: "4th String Root Triangle", shape: {"startFret": 1, "nut": true, "muted": [5, 6], "open": [4], "root": "D", "dots": [{"s": 3, "f": 2, "finger": 1}, {"s": 2, "f": 3, "finger": 3}, {"s": 1, "f": 2, "finger": 2}]} },
          { key: "G", name: "G Major", tag: "6th String Root Stretch", shape: {"startFret": 1, "nut": true, "open": [2, 3, 4], "root": "G", "dots": [{"s": 6, "f": 3, "finger": 2}, {"s": 5, "f": 2, "finger": 1}, {"s": 1, "f": 3, "finger": 3}]} },
          { key: "C", name: "C Major", tag: "5th String Root Diagonal", shape: {"startFret": 1, "nut": true, "muted": [6], "open": [1, 3], "root": "C", "dots": [{"s": 5, "f": 3, "finger": 3}, {"s": 4, "f": 2, "finger": 2}, {"s": 2, "f": 1, "finger": 1}]} },
        ],
      },
      {
        title: "Minor",
        chords: [
          { key: "Em", name: "E Minor (Em)", tag: "2-Finger Open Minor", shape: {"startFret": 1, "nut": true, "open": [1, 2, 3, 6], "root": "E", "dots": [{"s": 5, "f": 2, "finger": 2}, {"s": 4, "f": 2, "finger": 3}]} },
          { key: "Am", name: "A Minor (Am)", tag: "Same Shape as E Major, Down 1 Str", shape: {"startFret": 1, "nut": true, "muted": [6], "open": [1, 5], "root": "A", "dots": [{"s": 4, "f": 2, "finger": 2}, {"s": 3, "f": 2, "finger": 3}, {"s": 2, "f": 1, "finger": 1}]} },
          { key: "Dm", name: "D Minor (Dm)", tag: "4th String Root Minor Triangle", shape: {"startFret": 1, "nut": true, "muted": [5, 6], "open": [4], "root": "D", "dots": [{"s": 3, "f": 2, "finger": 2}, {"s": 2, "f": 3, "finger": 3}, {"s": 1, "f": 1, "finger": 1}]} },
        ],
      },
    ],
  },
  {
    id: "blues", title: "Blues chords", note: "Dominant 7ths for the 12-bar blues, plus four shuffle shapes.",
    sections: [
      {
        title: "Dominant 7ths",
        chords: [
          { key: "E7", name: "E7", tag: "Open E + Lift Ring Finger", shape: {"startFret": 1, "nut": true, "open": [1, 2, 4, 6], "root": "E", "dots": [{"s": 5, "f": 2, "finger": 2}, {"s": 3, "f": 1, "finger": 1}]} },
          { key: "A7", name: "A7", tag: "Open A + Open 3rd String", shape: {"startFret": 1, "nut": true, "muted": [6], "open": [1, 3, 5], "root": "A", "dots": [{"s": 4, "f": 2, "finger": 2}, {"s": 2, "f": 2, "finger": 3}]} },
          { key: "B7", name: "B7", tag: "5th-Str Root Blues Turnaround", shape: {"startFret": 1, "nut": true, "muted": [6], "open": [2], "root": "B", "dots": [{"s": 5, "f": 2, "finger": 2}, {"s": 4, "f": 1, "finger": 1}, {"s": 3, "f": 2, "finger": 3}, {"s": 1, "f": 2, "finger": 4}]} },
          { key: "D7", name: "D7", tag: "Inverted Triangle on Top 3 Strings", shape: {"startFret": 1, "nut": true, "muted": [5, 6], "open": [4], "root": "D", "dots": [{"s": 3, "f": 2, "finger": 2}, {"s": 2, "f": 1, "finger": 1}, {"s": 1, "f": 2, "finger": 3}]} },
          { key: "G7", name: "G7", tag: "Open G + 1st String Fret 1", shape: {"startFret": 1, "nut": true, "open": [2, 3, 4], "root": "G", "dots": [{"s": 6, "f": 3, "finger": 3}, {"s": 5, "f": 2, "finger": 2}, {"s": 1, "f": 1, "finger": 1}]} },
          { key: "C7", name: "C7", tag: "Open C + Pinky on 3rd String Fret 3", shape: {"startFret": 1, "nut": true, "muted": [6], "open": [1], "root": "C", "dots": [{"s": 5, "f": 3, "finger": 3}, {"s": 4, "f": 2, "finger": 2}, {"s": 3, "f": 3, "finger": 4}, {"s": 2, "f": 1, "finger": 1}]} },
        ],
      },
      {
        title: "Shuffle: hold one finger, bounce the other",
        chords: [
          { key: "E5/E6", name: "E5 ↔ E6 Shuffle", tag: "Hold 1 on Fret 2, Bounce 3 on Fret 4", shape: {"startFret": 1, "nut": true, "muted": [1, 2, 3, 4], "open": [6], "root": "E", "dots": [{"s": 5, "f": 2, "finger": 1}, {"s": 5, "f": 4, "finger": 3, "kind": "extra"}]} },
          { key: "A5/A6", name: "A5 ↔ A6 Shuffle", tag: "Hold 1 on Fret 2, Bounce 3 on Fret 4", shape: {"startFret": 1, "nut": true, "muted": [1, 2, 3, 6], "open": [5], "root": "A", "dots": [{"s": 4, "f": 2, "finger": 1}, {"s": 4, "f": 4, "finger": 3, "kind": "extra"}]} },
          { key: "D5/D6", name: "D5 ↔ D6 Shuffle", tag: "Hold 1 on Fret 2, Bounce 3 on Fret 4", shape: {"startFret": 1, "nut": true, "muted": [1, 2, 5, 6], "open": [4], "root": "D", "dots": [{"s": 3, "f": 2, "finger": 1}, {"s": 3, "f": 4, "finger": 3, "kind": "extra"}]} },
          { key: "B5/B6", name: "B5 ↔ B6 Shuffle", tag: "Movable: 1 on Fret 2, 3 on Fret 4, Bounce 4 on Fret 6", shape: {"startFret": 2, "muted": [1, 2, 3, 6], "root": "B", "dots": [{"s": 5, "f": 2, "finger": 1}, {"s": 4, "f": 4, "finger": 3}, {"s": 4, "f": 6, "finger": 4, "kind": "extra"}]} },
        ],
      },
    ],
  },
  {
    id: "power", title: "Power chords", note: "Two-note chords: one-finger open shapes, then movable ones.",
    sections: [
      {
        title: "Open, one finger",
        chords: [
          { key: "E5", name: "E5 (1-Finger)", tag: "Open 6th + 5th Str Fret 2", shape: {"startFret": 1, "nut": true, "muted": [1, 2, 3, 4], "open": [6], "root": "E", "dots": [{"s": 5, "f": 2, "finger": 1}]} },
          { key: "A5", name: "A5 (1-Finger)", tag: "Open 5th + 4th Str Fret 2", shape: {"startFret": 1, "nut": true, "muted": [1, 2, 3, 6], "open": [5], "root": "A", "dots": [{"s": 4, "f": 2, "finger": 1}]} },
          { key: "D5", name: "D5 (1-Finger)", tag: "Open 4th + 3rd Str Fret 2", shape: {"startFret": 1, "nut": true, "muted": [1, 2, 5, 6], "open": [4], "root": "D", "dots": [{"s": 3, "f": 2, "finger": 1}]} },
        ],
      },
      {
        title: "Root on the 6th string",
        chords: [
          { key: "F5", name: "F5", tag: "6th Str Fret 1 + 5th Str Fret 3", shape: {"startFret": 1, "nut": true, "muted": [1, 2, 3, 4], "root": "F", "dots": [{"s": 6, "f": 1, "finger": 1}, {"s": 5, "f": 3, "finger": 3}]} },
          { key: "F#5", name: "F#5", tag: "6th Str Fret 2 + 5th Str Fret 4", shape: {"startFret": 2, "muted": [1, 2, 3, 4], "root": "F#", "dots": [{"s": 6, "f": 2, "finger": 1}, {"s": 5, "f": 4, "finger": 3}]} },
          { key: "G5", name: "G5", tag: "6th Str Fret 3 + 5th Str Fret 5", shape: {"startFret": 3, "muted": [1, 2, 3, 4], "root": "G", "dots": [{"s": 6, "f": 3, "finger": 1}, {"s": 5, "f": 5, "finger": 3}]} },
          { key: "A5 (movable)", name: "A5 (Movable)", tag: "6th Str Fret 5 + 5th Str Fret 7", shape: {"startFret": 5, "muted": [1, 2, 3, 4], "root": "A", "dots": [{"s": 6, "f": 5, "finger": 1}, {"s": 5, "f": 7, "finger": 3}]} },
        ],
      },
      {
        title: "Root on the 5th string",
        chords: [
          { key: "B5", name: "B5", tag: "5th Str Fret 2 + 4th Str Fret 4", shape: {"startFret": 2, "muted": [1, 2, 3, 6], "root": "B", "dots": [{"s": 5, "f": 2, "finger": 1}, {"s": 4, "f": 4, "finger": 3}]} },
          { key: "C5", name: "C5", tag: "5th Str Fret 3 + 4th Str Fret 5", shape: {"startFret": 3, "muted": [1, 2, 3, 6], "root": "C", "dots": [{"s": 5, "f": 3, "finger": 1}, {"s": 4, "f": 5, "finger": 3}]} },
          { key: "D5 (movable)", name: "D5 (Movable)", tag: "5th Str Fret 5 + 4th Str Fret 7", shape: {"startFret": 5, "muted": [1, 2, 3, 6], "root": "D", "dots": [{"s": 5, "f": 5, "finger": 1}, {"s": 4, "f": 7, "finger": 3}]} },
        ],
      },
    ],
  },
  {
    id: "barre", title: "Barre chords", note: "Build the barre a step at a time: two strings, then all six. Press with the bony edge of your index, thumb behind the neck.",
    sections: [
      {
        title: "Mini barre",
        chords: [
          { key: "Fmaj7", name: "F Major 7 (Fmaj7)", tag: "No Barre Yet: The Shape F Grows From", shape: {"startFret": 1, "nut": true, "muted": [5, 6], "open": [1], "root": "F", "dots": [{"s": 4, "f": 3, "finger": 3}, {"s": 3, "f": 2, "finger": 2}, {"s": 2, "f": 1, "finger": 1}]} },
          { key: "Dm7", name: "D Minor 7 (Dm7)", tag: "Index Flat Over 2 Strings", shape: {"startFret": 1, "nut": true, "muted": [5, 6], "open": [4], "root": "D", "barre": {"f": 1, "from": 1, "to": 2}, "dots": [{"s": 3, "f": 2, "finger": 2}, {"s": 2, "f": 1, "finger": 1}, {"s": 1, "f": 1, "finger": 1}]} },
          { key: "F (mini)", name: "F Major (Mini Barre)", tag: "Fmaj7 + Index Over the Top 2", shape: {"startFret": 1, "nut": true, "muted": [5, 6], "root": "F", "barre": {"f": 1, "from": 1, "to": 2}, "dots": [{"s": 4, "f": 3, "finger": 3}, {"s": 3, "f": 2, "finger": 2}, {"s": 2, "f": 1, "finger": 1}, {"s": 1, "f": 1, "finger": 1}]} },
        ],
      },
      {
        title: "Full barre, root on the 6th string",
        chords: [
          { key: "F", name: "F Major (Full Barre)", tag: "E Shape, Barre at Fret 1", shape: {"startFret": 1, "nut": true, "root": "F", "barre": {"f": 1, "from": 1, "to": 6}, "dots": [{"s": 6, "f": 1, "finger": 1}, {"s": 5, "f": 3, "finger": 3}, {"s": 4, "f": 3, "finger": 4}, {"s": 3, "f": 2, "finger": 2}, {"s": 2, "f": 1, "finger": 1}, {"s": 1, "f": 1, "finger": 1}]} },
          { key: "Fm", name: "F Minor (Fm)", tag: "Em Shape, Barre at Fret 1", shape: {"startFret": 1, "nut": true, "root": "F", "barre": {"f": 1, "from": 1, "to": 6}, "dots": [{"s": 6, "f": 1, "finger": 1}, {"s": 5, "f": 3, "finger": 3}, {"s": 4, "f": 3, "finger": 4}, {"s": 3, "f": 1, "finger": 1}, {"s": 2, "f": 1, "finger": 1}, {"s": 1, "f": 1, "finger": 1}]} },
          { key: "F7", name: "F7 (Barre)", tag: "E7 Shape, Barre at Fret 1", shape: {"startFret": 1, "nut": true, "root": "F", "barre": {"f": 1, "from": 1, "to": 6}, "dots": [{"s": 6, "f": 1, "finger": 1}, {"s": 5, "f": 3, "finger": 3}, {"s": 4, "f": 1, "finger": 1}, {"s": 3, "f": 2, "finger": 2}, {"s": 2, "f": 1, "finger": 1}, {"s": 1, "f": 1, "finger": 1}]} },
          { key: "G (barre)", name: "G Major (Barre)", tag: "Same F Shape, Slid to Fret 3", shape: {"startFret": 3, "root": "G", "barre": {"f": 3, "from": 1, "to": 6}, "dots": [{"s": 6, "f": 3, "finger": 1}, {"s": 5, "f": 5, "finger": 3}, {"s": 4, "f": 5, "finger": 4}, {"s": 3, "f": 4, "finger": 2}, {"s": 2, "f": 3, "finger": 1}, {"s": 1, "f": 3, "finger": 1}]} },
        ],
      },
      {
        title: "Full barre, root on the 5th string",
        chords: [
          { key: "Bm7", name: "B Minor 7 (Bm7)", tag: "A Shape, Barre at Fret 2, 2 Fingers", shape: {"startFret": 1, "nut": true, "muted": [6], "root": "B", "barre": {"f": 2, "from": 1, "to": 5}, "dots": [{"s": 5, "f": 2, "finger": 1}, {"s": 4, "f": 4, "finger": 3}, {"s": 3, "f": 2, "finger": 1}, {"s": 2, "f": 3, "finger": 2}, {"s": 1, "f": 2, "finger": 1}]} },
          { key: "Bm", name: "B Minor (Bm)", tag: "Am Shape, Barre at Fret 2", shape: {"startFret": 1, "nut": true, "muted": [6], "root": "B", "barre": {"f": 2, "from": 1, "to": 5}, "dots": [{"s": 5, "f": 2, "finger": 1}, {"s": 4, "f": 4, "finger": 3}, {"s": 3, "f": 4, "finger": 4}, {"s": 2, "f": 3, "finger": 2}, {"s": 1, "f": 2, "finger": 1}]} },
          { key: "Bb", name: "B♭ Major (Bb)", tag: "A Shape, Barre at Fret 1", shape: {"startFret": 1, "nut": true, "muted": [6], "root": "Bb", "barre": {"f": 1, "from": 1, "to": 5}, "dots": [{"s": 5, "f": 1, "finger": 1}, {"s": 4, "f": 3, "finger": 2}, {"s": 3, "f": 3, "finger": 3}, {"s": 2, "f": 3, "finger": 4}, {"s": 1, "f": 1, "finger": 1}]} },
          { key: "C (barre)", name: "C Major (Barre)", tag: "Same B♭ Shape, Slid to Fret 3", shape: {"startFret": 3, "muted": [6], "root": "C", "barre": {"f": 3, "from": 1, "to": 5}, "dots": [{"s": 5, "f": 3, "finger": 1}, {"s": 4, "f": 5, "finger": 2}, {"s": 3, "f": 5, "finger": 3}, {"s": 2, "f": 5, "finger": 4}, {"s": 1, "f": 3, "finger": 1}]} },
        ],
      },
    ],
  },
];
