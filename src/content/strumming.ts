// Generated from the legacy site by scripts/generate-content.py.
import type { StrumLevel } from "./types";

export const STRUM_LEVELS: StrumLevel[] = [
  {
    id: "lvl1", title: "Foundation", note: "Steady timing and a hand that never stops moving.",
    patterns: [
      { num: 1, name: "Quarter Downs", tag: "Easiest", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "D", "·", "D", "·", "D", "·"] },
      { num: 2, name: "Stop-Time Hit", tag: "Count 2-3-4", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D>", "·", "·", "·", "·", "·", "·", "·"] },
      { num: 3, name: "Metronome 8ths", tag: "All Down", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "D", "D", "D", "D", "D", "D", "D"] },
      { num: 4, name: "Steady 8ths", tag: "Down-Up", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "U", "D", "U", "D", "U", "D", "U"] },
      { num: 5, name: "Folk Basic #1", tag: "Half-Bar", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "D", "U", "D", "·", "D", "U"] },
      { num: 6, name: "Folk Basic #2", tag: "Build-Up", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "D", "·", "D", "U", "D", "U"] },
      { num: 7, name: "Waltz Basic", tag: "3/4 Down", meter: "3/4 Beat", count: ["1", "+", "2", "+", "3", "+"], slots: ["D", "·", "D", "·", "D", "·"] },
      { num: 8, name: "6/8 All Downs", tag: "Accent 1&4", meter: "6/8 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+", "5", "+", "6", "+"], slots: ["D>", "·", "D", "·", "D", "·", "D>", "·", "D", "·", "D", "·"] },
    ],
  },
  {
    id: "lvl2", title: "Core grooves", note: "Skip downbeats, add bass notes and a little swing.",
    patterns: [
      { num: 9, name: "Old Faithful", tag: "#1 Staple", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "D", "U", "·", "U", "D", "U"] },
      { num: 10, name: "Pop Ballad", tag: "Open End", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "D", "U", "·", "U", "D", "·"] },
      { num: 11, name: "Backbeat 2 & 4", tag: "Accent", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "D>", "·", "D", "·", "D>", "·"] },
      { num: 12, name: "Blues Shuffle", tag: "Swing +", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "D", "U", "D", "·", "D", "U"] },
      { num: 13, name: "Country Bass", tag: "Root Pick", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["B", "·", "D", "U", "B", "·", "D", "U"] },
      { num: 14, name: "Waltz Folk", tag: "3/4 Brush", meter: "3/4 Beat", count: ["1", "+", "2", "+", "3", "+"], slots: ["D", "·", "D", "U", "D", "U"] },
      { num: 15, name: "Bass Waltz", tag: "3/4 Pick", meter: "3/4 Beat", count: ["1", "+", "2", "+", "3", "+"], slots: ["B", "·", "D", "U", "D", "U"] },
      { num: 16, name: "6/8 Folk Strum", tag: "Whiteboard", meter: "6/8 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+", "5", "+", "6", "+"], slots: ["D>", "·", "U", "D", "·", "·", "D>", "·", "U", "D", "·", "·"] },
    ],
  },
  {
    id: "lvl3", title: "Intermediate", note: "Palm mutes, percussive chucks and off-beat accents.",
    patterns: [
      { num: 17, name: "Palm Mute Chug", tag: "Bridge Mute", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["P", "P", "P", "P", "P", "P", "P", "P"] },
      { num: 18, name: "Pop-Punk Drive", tag: "Mute+Open", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["P", "P", "D>", "P", "P", "P", "D>", "P"] },
      { num: 19, name: "Tresillo Rock", tag: "3+3+2", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D>", "P", "P", "D>", "P", "P", "D>", "P"] },
      { num: 20, name: "Syncopated", tag: "Beat 2 Miss", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "·", "U", "·", "U", "D", "U"] },
      { num: 21, name: "Pop Chuck #1", tag: "Slap 2 & 4", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "X", "U", "·", "U", "X", "U"] },
      { num: 22, name: "Pop Chuck #2", tag: "Steady", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "X", "U", "D", "·", "X", "U"] },
      { num: 23, name: "Rock Riff", tag: "End Chuck", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "·", "D", "·", "D", "U", "X", "U"] },
      { num: 24, name: "Acoustic Blues", tag: "Swung Bass", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["B", "·", "D", "U", "B", "U", "D", "U"] },
    ],
  },
  {
    id: "lvl4", title: "Advanced", note: "16th-note flicks, ska upbeats and the Texas shuffle.",
    patterns: [
      { num: 25, name: "Dynamic 16th #1", tag: "2e & 4e", meter: "16th Count", count: ["1", "+", "2", "e", "+", "3", "+", "4", "e", "+"], slots: ["D", "D", "D", "U", "D", "D", "D", "D", "U", "D"] },
      { num: 26, name: "Dynamic 16th #2", tag: "+a & 3e", meter: "16th Count", count: ["1", "+", "2", "+", "a", "3", "e", "+", "4", "+"], slots: ["D", "D", "D", "·", "U", "D", "U", "D", "D", "D"] },
      { num: 27, name: "Acoustic Slap", tag: "Pick+Chuck", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["B", "·", "X", "U", "·", "U", "X", "U"] },
      { num: 28, name: "Ska Off-Beat", tag: "Upbeats", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["X", "U", "X", "U", "X", "U", "X", "U"] },
      { num: 29, name: "Texas Shuffle", tag: "SRV Rake", meter: "4/4 Beat", count: ["1", "+", "2", "+", "3", "+", "4", "+"], slots: ["D", "U", "X", "U", "D", "U", "X", "U"] },
    ],
  },
];
