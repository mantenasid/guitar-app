// Chord shapes, shared by chords.html and the change drill on transitions.html.
// key = the short name used on the Transitions page.
// Strings: 1 = high e ... 6 = low E. Dot colours are worked out from each chord's root.

// 1. BASIC OPEN CHORDS
const basicMajor = [
  { key: "E", name: "E Major", tag: "All 6 Strings", startFret: 1, nut: true, muted: [], open: [1,2,6], dots: [{s:5, f:2, lbl:"2"}, {s:4, f:2, lbl:"3"}, {s:3, f:1, lbl:"1"}] },
  { key: "A", name: "A Major", tag: "5th String Root", startFret: 1, nut: true, muted: [6], open: [1,5], dots: [{s:4, f:2, lbl:"1"}, {s:3, f:2, lbl:"2"}, {s:2, f:2, lbl:"3"}] },
  { key: "D", name: "D Major", tag: "4th String Root Triangle", startFret: 1, nut: true, muted: [5,6], open: [4], dots: [{s:3, f:2, lbl:"1"}, {s:2, f:3, lbl:"3"}, {s:1, f:2, lbl:"2"}] },
  { key: "G", name: "G Major", tag: "6th String Root Stretch", startFret: 1, nut: true, muted: [], open: [2,3,4], dots: [{s:6, f:3, lbl:"2"}, {s:5, f:2, lbl:"1"}, {s:1, f:3, lbl:"3"}] },
  { key: "C", name: "C Major", tag: "5th String Root Diagonal", startFret: 1, nut: true, muted: [6], open: [1,3], dots: [{s:5, f:3, lbl:"3"}, {s:4, f:2, lbl:"2"}, {s:2, f:1, lbl:"1"}] }
];

const basicMinor = [
  { key: "Em", name: "E Minor (Em)", tag: "2-Finger Open Minor", startFret: 1, nut: true, muted: [], open: [1,2,3,6], dots: [{s:5, f:2, lbl:"2"}, {s:4, f:2, lbl:"3"}] },
  { key: "Am", name: "A Minor (Am)", tag: "Same Shape as E Major, Down 1 Str", startFret: 1, nut: true, muted: [6], open: [1,5], dots: [{s:4, f:2, lbl:"2"}, {s:3, f:2, lbl:"3"}, {s:2, f:1, lbl:"1"}] },
  { key: "Dm", name: "D Minor (Dm)", tag: "4th String Root Minor Triangle", startFret: 1, nut: true, muted: [5,6], open: [4], dots: [{s:3, f:2, lbl:"2"}, {s:2, f:3, lbl:"3"}, {s:1, f:1, lbl:"1"}] }
];

// 2. BLUES CHORDS
const blues7 = [
  { key: "E7", name: "E7", tag: "Open E + Lift Ring Finger", startFret: 1, nut: true, muted: [], open: [1,2,4,6], dots: [{s:5, f:2, lbl:"2"}, {s:3, f:1, lbl:"1"}] },
  { key: "A7", name: "A7", tag: "Open A + Open 3rd String", startFret: 1, nut: true, muted: [6], open: [1,3,5], dots: [{s:4, f:2, lbl:"2"}, {s:2, f:2, lbl:"3"}] },
  { key: "B7", name: "B7", tag: "5th-Str Root Blues Turnaround", startFret: 1, nut: true, muted: [6], open: [2], dots: [{s:5, f:2, lbl:"2"}, {s:4, f:1, lbl:"1"}, {s:3, f:2, lbl:"3"}, {s:1, f:2, lbl:"4"}] },
  { key: "D7", name: "D7", tag: "Inverted Triangle on Top 3 Strings", startFret: 1, nut: true, muted: [5,6], open: [4], dots: [{s:3, f:2, lbl:"2"}, {s:2, f:1, lbl:"1"}, {s:1, f:2, lbl:"3"}] },
  { key: "G7", name: "G7", tag: "Open G + 1st String Fret 1", startFret: 1, nut: true, muted: [], open: [2,3,4], dots: [{s:6, f:3, lbl:"3"}, {s:5, f:2, lbl:"2"}, {s:1, f:1, lbl:"1"}] },
  { key: "C7", name: "C7", tag: "Open C + Pinky on 3rd String Fret 3", startFret: 1, nut: true, muted: [6], open: [1], dots: [{s:5, f:3, lbl:"3"}, {s:4, f:2, lbl:"2"}, {s:3, f:3, lbl:"4"}, {s:2, f:1, lbl:"1"}] }
];

const bluesShuffle = [
  { key: "E5/E6", name: "E5 ↔ E6 Shuffle", tag: "Hold 1 on Fret 2, Bounce 3 on Fret 4", startFret: 1, nut: true, muted: [1,2,3,4], open: [6], dots: [{s:5, f:2, lbl:"1"}, {s:5, f:4, c:"bounce", lbl:"3"}] },
  { key: "A5/A6", name: "A5 ↔ A6 Shuffle", tag: "Hold 1 on Fret 2, Bounce 3 on Fret 4", startFret: 1, nut: true, muted: [1,2,3,6], open: [5], dots: [{s:4, f:2, lbl:"1"}, {s:4, f:4, c:"bounce", lbl:"3"}] },
  { key: "D5/D6", name: "D5 ↔ D6 Shuffle", tag: "Hold 1 on Fret 2, Bounce 3 on Fret 4", startFret: 1, nut: true, muted: [1,2,5,6], open: [4], dots: [{s:3, f:2, lbl:"1"}, {s:3, f:4, c:"bounce", lbl:"3"}] },
  { key: "B5/B6", name: "B5 ↔ B6 Shuffle", tag: "Movable: 1 on Fret 2, 3 on Fret 4, Bounce 4 on Fret 6", startFret: 2, nut: false, muted: [1,2,3,6], open: [], dots: [{s:5, f:2, lbl:"1"}, {s:4, f:4, lbl:"3"}, {s:4, f:6, c:"bounce", lbl:"4"}] }
];

// 3. POWER CHORDS
const powerOpen = [
  { key: "E5", name: "E5 (1-Finger)", tag: "Open 6th + 5th Str Fret 2", startFret: 1, nut: true, muted: [1,2,3,4], open: [6], dots: [{s:5, f:2, lbl:"1"}] },
  { key: "A5", name: "A5 (1-Finger)", tag: "Open 5th + 4th Str Fret 2", startFret: 1, nut: true, muted: [1,2,3,6], open: [5], dots: [{s:4, f:2, lbl:"1"}] },
  { key: "D5", name: "D5 (1-Finger)", tag: "Open 4th + 3rd Str Fret 2", startFret: 1, nut: true, muted: [1,2,5,6], open: [4], dots: [{s:3, f:2, lbl:"1"}] }
];

const power6 = [
  { key: "F5", name: "F5", tag: "6th Str Fret 1 + 5th Str Fret 3", startFret: 1, nut: true, muted: [1,2,3,4], open: [], dots: [{s:6, f:1, lbl:"1"}, {s:5, f:3, lbl:"3"}] },
  { key: "F#5", name: "F#5", tag: "6th Str Fret 2 + 5th Str Fret 4", startFret: 2, nut: false, muted: [1,2,3,4], open: [], dots: [{s:6, f:2, lbl:"1"}, {s:5, f:4, lbl:"3"}] },
  { key: "G5", name: "G5", tag: "6th Str Fret 3 + 5th Str Fret 5", startFret: 3, nut: false, muted: [1,2,3,4], open: [], dots: [{s:6, f:3, lbl:"1"}, {s:5, f:5, lbl:"3"}] },
  { key: "A5 (movable)", name: "A5 (Movable)", tag: "6th Str Fret 5 + 5th Str Fret 7", startFret: 5, nut: false, muted: [1,2,3,4], open: [], dots: [{s:6, f:5, lbl:"1"}, {s:5, f:7, lbl:"3"}] }
];

const power5 = [
  { key: "B5", name: "B5", tag: "5th Str Fret 2 + 4th Str Fret 4", startFret: 2, nut: false, muted: [1,2,3,6], open: [], dots: [{s:5, f:2, lbl:"1"}, {s:4, f:4, lbl:"3"}] },
  { key: "C5", name: "C5", tag: "5th Str Fret 3 + 4th Str Fret 5", startFret: 3, nut: false, muted: [1,2,3,6], open: [], dots: [{s:5, f:3, lbl:"1"}, {s:4, f:5, lbl:"3"}] },
  { key: "D5 (movable)", name: "D5 (Movable)", tag: "5th Str Fret 5 + 4th Str Fret 7", startFret: 5, nut: false, muted: [1,2,3,6], open: [], dots: [{s:5, f:5, lbl:"1"}, {s:4, f:7, lbl:"3"}] }
];

const ALL_CHORDS = [...basicMajor, ...basicMinor, ...blues7, ...bluesShuffle, ...powerOpen, ...power6, ...power5];
const CHORD_BY_KEY = Object.fromEntries(ALL_CHORDS.map(c => [c.key, c]));

// Root letter from the chord name, e.g. "F#5" -> "F#", "Em" -> "E".
function chordRootOf(c) { return c.key.match(/^[A-G][#b]?/)[0]; }

// MIDI notes the chord sounds, low string to high (bounce notes left out).
function chordMidis(c) {
  const out = [];
  for (let s = 6; s >= 1; s--) {
    if (c.muted.includes(s)) continue;
    const held = c.dots.filter(d => d.s === s && d.c !== "bounce");
    if (held.length) out.push(OPEN_MIDI[s] + Math.max(...held.map(d => d.f)));
    else if (c.open.includes(s)) out.push(OPEN_MIDI[s]);
  }
  return out;
}

// One card per chord: name, short note, diagram, strum + learned buttons.
function chordCardHTML(c, extra = "") {
  return `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${c.name}</div>
          <div class="card-sub">${c.tag}</div>
        </div>
      </div>
      ${drawSVG({ ...c, chordRoot: chordRootOf(c) })}
      <div class="card-foot">
        <button type="button" class="play-btn" data-play="chord" title="Strum ${c.name}" aria-label="Strum ${c.name}">${ICON_PLAY}</button>
        <span class="spacer"></span>
        ${GPH.tickHTML("chord:" + c.key)}
      </div>
      ${extra}
    </div>`;
}
