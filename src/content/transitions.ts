// Generated from the legacy site by scripts/generate-content.py.
import type { TransitionSection } from "./types";

export const TRANSITION_SECTIONS: TransitionSection[] = [
  {
    id: "basic", title: "Open chords",
    rows: [
      {"label": "A ↔", "root": "A", "pairs": [["A", "C"], ["A", "G"], ["A", "E"], ["A", "Em"], ["A", "D"], ["A", "Dm"]]},
      {"label": "C ↔", "root": "C", "pairs": [["C", "G"], ["C", "E"], ["C", "D"], ["C", "Dm"], ["C", "Am"], ["C", "Em"]]},
      {"label": "G ↔", "root": "G", "pairs": [["G", "E"], ["G", "D"], ["G", "Dm"], ["G", "Am"], ["G", "Em"]]},
      {"label": "E ↔", "root": "E", "pairs": [["E", "D"], ["E", "Dm"], ["E", "Am"]]},
      {"label": "D ↔", "root": "D", "pairs": [["D", "Am"], ["D", "Em"]]},
      {"label": "Dm ↔", "root": "Dm", "pairs": [["Dm", "Am"], ["Dm", "Em"]]},
      {"label": "Am ↔", "root": "Am", "pairs": [["Am", "Em"]]},
      {"label": "Maj ↔ Min", "tag": "Same Root", "pairs": [["E", "Em"], ["A", "Am"], ["D", "Dm"]]},
    ],
  },
  {
    id: "blues", title: "Blues",
    rows: [
      {"label": "Key of E", "tag": "E7 · A7 · B7", "pairs": [["E7", "A7"], ["E7", "B7"], ["A7", "B7"]]},
      {"label": "Key of A", "tag": "A7 · D7 · E7", "pairs": [["A7", "D7"], ["A7", "E7"], ["D7", "E7"]]},
      {"label": "Key of G", "tag": "G7 · C7 · D7", "pairs": [["G7", "C7"], ["G7", "D7"], ["C7", "D7"]]},
      {"label": "Key of D", "tag": "D7 · G7 · A7", "pairs": [["D7", "G7"], ["D7", "A7"], ["G7", "A7"]]},
      {"label": "C7 Extras", "tag": "Full key of C needs F7", "pairs": [["C7", "G7"], ["C7", "E7"]]},
      {"label": "Shuffle in E", "tag": "E · A · B", "pairs": [["E5/E6", "A5/A6"], ["E5/E6", "B5/B6"], ["A5/A6", "B5/B6"]]},
      {"label": "Shuffle in A", "tag": "A · D · E", "pairs": [["A5/A6", "D5/D6"], ["A5/A6", "E5/E6"], ["D5/D6", "E5/E6"]]},
    ],
  },
  {
    id: "power", title: "Power chords",
    rows: [
      {"label": "Open 5ths", "pairs": [["E5", "A5"], ["E5", "D5"], ["A5", "D5"]]},
      {"label": "6th String", "tag": "Slide", "pairs": [["F5", "G5"], ["F5", "A5 (movable)"], ["F#5", "G5"], ["F#5", "A5 (movable)"], ["G5", "A5 (movable)"]]},
      {"label": "5th String", "tag": "Slide", "pairs": [["B5", "C5"], ["B5", "D5 (movable)"], ["C5", "D5 (movable)"]]},
      {"label": "Across Strings", "tag": "Jump", "pairs": [["G5", "C5"], ["G5", "D5 (movable)"], ["A5 (movable)", "D5 (movable)"], ["A5 (movable)", "E5"], ["E5", "F5"], ["E5", "G5"]]},
    ],
  },
  {
    id: "cross", title: "Mixing types",
    rows: [
      {"label": "E ↔", "root": "E", "tag": "Basic ↔ 7th", "pairs": [["E", "E7"], ["E", "B7"]]},
      {"label": "A ↔", "root": "A", "tag": "Basic ↔ 7th", "pairs": [["A", "A7"], ["A", "D7"]]},
      {"label": "D ↔", "root": "D", "tag": "Basic ↔ 7th", "pairs": [["D", "D7"], ["D", "A7"]]},
      {"label": "G ↔", "root": "G", "tag": "Basic ↔ 7th", "pairs": [["G", "G7"], ["G", "C7"]]},
      {"label": "C ↔", "root": "C", "tag": "Basic ↔ 7th", "pairs": [["C", "C7"], ["C", "E7"]]},
      {"label": "Am ↔", "root": "Am", "tag": "Basic ↔ 7th", "pairs": [["Am", "E7"]]},
      {"label": "Em ↔", "root": "Em", "tag": "Basic ↔ 7th", "pairs": [["Em", "B7"]]},
      {"label": "E ↔", "root": "E", "tag": "Basic ↔ 5th", "pairs": [["E", "A5"], ["E", "B5"]]},
      {"label": "A ↔", "root": "A", "tag": "Basic ↔ 5th", "pairs": [["A", "D5"], ["A", "E5"]]},
      {"label": "G ↔", "root": "G", "tag": "Basic ↔ 5th", "pairs": [["G", "C5"], ["G", "D5"]]},
      {"label": "C ↔", "root": "C", "tag": "Basic ↔ 5th", "pairs": [["C", "G5"], ["C", "F5"]]},
      {"label": "E5/E6 ↔", "root": "E5/E6", "tag": "Shuffle ↔ 7th", "pairs": [["E5/E6", "B7"], ["E5/E6", "A7"]]},
      {"label": "A5/A6 ↔", "root": "A5/A6", "tag": "Shuffle ↔ 7th", "pairs": [["A5/A6", "E7"], ["A5/A6", "D7"]]},
    ],
  },
  {
    id: "barre", title: "Barre chords",
    rows: [
      {"label": "Mini barre", "tag": "Into the first barres", "pairs": [["C", "Fmaj7"], ["C", "F (mini)"], ["Am", "Dm7"]]},
      {"label": "F ↔", "root": "F", "tag": "Full barre", "pairs": [["Am", "F"], ["C", "F"], ["F", "G"]]},
      {"label": "Bm ↔", "root": "Bm", "tag": "Full barre", "pairs": [["G", "Bm"], ["D", "Bm"]]},
      {"label": "Moving shapes", "tag": "Slide the barre", "pairs": [["G (barre)", "C (barre)"]]},
    ],
  },
];
