// Shared fretboard diagram drawing + click-to-play.
// Strings: 1 = high e (top line) ... 6 = low E (bottom line).
const OPEN_MIDI = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ICON_PLAY = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4l8.6-5.2z" fill="currentColor"/></svg>`;
const ICON_STOP = `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3.5" width="9" height="9" rx="1.5" fill="currentColor"/></svg>`;
const DOT_CLASS = { root: "root", fifth: "tone", tone: "tone", bounce: "bounce" };

function noteMidi(s, f) { return OPEN_MIDI[s] + f; }
function noteName(s, f) { return NOTE_NAMES[noteMidi(s, f) % 12]; }
function normaliseNote(n) {
  const flats = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };
  return flats[n] || n;
}

// c: { startFret, nut, muted, open, openRoots, dots:[{s,f,c,lbl}], numFrets?, chordRoot? }
// chordRoot (e.g. "D") recolours dots so only notes matching the root are yellow.
function drawSVG(c) {
  const x0 = 34, y0 = 13, fretW = 42, strH = 17;
  const numFrets = c.numFrets || 5;
  const width = x0 + fretW * numFrets + 18;
  const muted = c.muted || [], open = c.open || [];
  let openRoots = c.openRoots || [];
  const root = c.chordRoot ? normaliseNote(c.chordRoot) : null;
  if (root) openRoots = open.filter(s => noteName(s, 0) === root);

  const sizing = numFrets > 5 ? `width="100%" style="min-width:${Math.round(width * 1.15)}px"` : `width="100%"`;
  let svg = `<svg class="fb" viewBox="0 0 ${width} 128" ${sizing} height="128" xmlns="http://www.w3.org/2000/svg" role="img">`;
  svg += `<rect class="fb-board" x="${x0}" y="${y0 - 5}" width="${fretW * numFrets}" height="${strH * 5 + 10}" rx="5"/>`;

  for (let i = 0; i <= numFrets; i++) {
    const x = x0 + i * fretW;
    const isNut = i === 0 && c.nut;
    svg += `<line class="${isNut ? "fb-nut" : "fb-fret"}" x1="${x}" y1="${y0 - 5}" x2="${x}" y2="${y0 + strH * 5 + 5}"/>`;
    if (i < numFrets) {
      svg += `<text class="fb-num" x="${x + fretW / 2}" y="${y0 + strH * 5 + 20}" text-anchor="middle">${c.startFret + i}</text>`;
    }
  }

  for (let s = 1; s <= 6; s++) {
    const y = y0 + (s - 1) * strH;
    const isMuted = muted.includes(s);
    svg += `<line class="fb-str${isMuted ? " muted" : ""}" x1="${x0}" y1="${y}" x2="${x0 + fretW * numFrets}" y2="${y}"/>`;
    const ox = x0 - 13;
    if (isMuted) {
      svg += `<text class="fb-x" x="${ox}" y="${y + 4}" text-anchor="middle">X</text>`;
    } else if (openRoots.includes(s)) {
      svg += `<g class="fb-note" data-s="${s}" data-f="0" data-kind="root"><circle class="fb-dot root" cx="${ox}" cy="${y}" r="5.5"/><text class="fb-lbl small" x="${ox}" y="${y + 3}" text-anchor="middle">O</text></g>`;
    } else if (open.includes(s)) {
      svg += `<g class="fb-note" data-s="${s}" data-f="0" data-kind="tone"><circle cx="${ox}" cy="${y}" r="7" fill="transparent"/><circle class="fb-open" cx="${ox}" cy="${y}" r="4.5"/></g>`;
    }
  }

  (c.dots || []).forEach(d => {
    const col = d.f - c.startFret;
    const cx = x0 + col * fretW + fretW / 2;
    const cy = y0 + (d.s - 1) * strH;
    let kind = DOT_CLASS[d.c] || "tone";
    if (root && kind !== "bounce") kind = noteName(d.s, d.f) === root ? "root" : "tone";
    svg += `<g class="fb-note" data-s="${d.s}" data-f="${d.f}" data-kind="${kind}">`;
    svg += `<circle class="fb-dot ${kind}" cx="${cx}" cy="${cy}" r="7.2"/>`;
    if (d.lbl) svg += `<text class="fb-lbl${String(d.lbl).length > 1 ? " small" : ""}" x="${cx}" y="${cy + 3.5}" text-anchor="middle">${d.lbl}</text>`;
    svg += `</g>`;
  });

  return svg + `</svg>`;
}

const Fretboard = (() => {
  let active = null; // { btn, timers }

  function noteEls(svg) {
    return [...svg.querySelectorAll(".fb-note")].map(el => ({
      el, s: +el.dataset.s, f: +el.dataset.f, kind: el.dataset.kind,
      midi: noteMidi(+el.dataset.s, +el.dataset.f)
    }));
  }

  function flash(el, delayMs, durMs = 260) {
    return [
      setTimeout(() => el.classList.add("lit"), delayMs),
      setTimeout(() => el.classList.remove("lit"), delayMs + durMs)
    ];
  }

  function stop() {
    if (!active) return;
    active.timers.forEach(clearTimeout);
    active.btn.classList.remove("on");
    active.btn.innerHTML = active.label;
    active = null;
  }

  function start(btn, timers, totalMs) {
    active = { btn, timers, label: btn.innerHTML };
    btn.classList.add("on");
    btn.innerHTML = ICON_STOP + (btn.dataset.label ? " Stop" : "");
    timers.push(setTimeout(stop, totalMs));
  }

  // Ascending then descending through every distinct pitch in the diagram.
  function playScale(svg, btn, step = 0.3) {
    const seen = new Set();
    const notes = noteEls(svg).sort((a, b) => a.midi - b.midi || b.s - a.s)
      .filter(n => (seen.has(n.midi) ? false : seen.add(n.midi)));
    const run = notes.concat(notes.slice(0, -1).reverse());
    const t0 = GuitarAudio.now() + 0.05;
    const timers = [];
    run.forEach((n, i) => {
      GuitarAudio.pluck(n.midi, { when: t0 + i * step, gain: 0.55 });
      timers.push(...flash(n.el, (0.05 + i * step) * 1000));
    });
    start(btn, timers, (run.length * step + 0.4) * 1000);
  }

  // Play an explicit list of [string, fret] pairs, lighting matching dots in svg.
  function playSequence(svg, list, btn, step = 0.25) {
    stop();
    const t0 = GuitarAudio.now() + 0.05;
    const timers = [];
    list.forEach(([s, f], i) => {
      GuitarAudio.pluck(noteMidi(s, f), { when: t0 + i * step, gain: 0.55 });
      const el = svg && svg.querySelector(`.fb-note[data-s="${s}"][data-f="${f}"]`);
      if (el) timers.push(...flash(el, (0.05 + i * step) * 1000, step * 900));
    });
    start(btn, timers, (list.length * step + 0.4) * 1000);
  }

  // One note per string, low to high. Shuffle shapes also play their "bounce" note.
  function chordVoicing(svg, useBounce) {
    const byString = {};
    noteEls(svg).forEach(n => {
      if (n.kind === "bounce" && !useBounce) return;
      if (useBounce && byString[n.s] && byString[n.s].kind === "bounce") return;
      if (!byString[n.s] || n.kind === "bounce" || n.f > byString[n.s].f) byString[n.s] = n;
    });
    return [6, 5, 4, 3, 2, 1].map(s => byString[s]).filter(Boolean);
  }

  function strumChord(svg, btn) {
    const plain = chordVoicing(svg, false);
    const hasBounce = svg.querySelector('.fb-note[data-kind="bounce"]');
    const t0 = GuitarAudio.now() + 0.05;
    const timers = [];
    const hits = hasBounce ? [plain, chordVoicing(svg, true), plain, chordVoicing(svg, true)] : [plain];
    hits.forEach((v, i) => {
      GuitarAudio.strum(v.map(n => n.midi), { when: t0 + i * 0.42, gain: 0.6 });
      v.forEach(n => timers.push(...flash(n.el, (0.05 + i * 0.42) * 1000, 380)));
    });
    start(btn, timers, (hits.length * 0.42 + 0.8) * 1000);
  }

  function svgFor(btn) {
    if (btn.dataset.target) return document.getElementById(btn.dataset.target)?.querySelector("svg");
    return btn.closest(".card, .col-card, [data-fb-scope]")?.querySelector("svg.fb");
  }

  document.addEventListener("click", e => {
    const note = e.target.closest(".fb-note");
    if (note) {
      e.preventDefault();
      e.stopPropagation();
      GuitarAudio.pluck(noteMidi(+note.dataset.s, +note.dataset.f), { gain: 0.6 });
      flash(note, 0, 300);
      return;
    }
    const btn = e.target.closest("[data-play]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const wasActive = active && active.btn === btn;
    stop();
    if (wasActive) return;
    const svg = svgFor(btn);
    if (!svg) return;
    if (btn.dataset.play === "chord") strumChord(svg, btn);
    else playScale(svg, btn, +(btn.dataset.step || 0.3));
  });

  return { noteMidi, noteName, playScale, playSequence, strumChord, chordVoicing, stop, isActive: btn => !!active && active.btn === btn };
})();
