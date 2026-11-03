// Chord-change practice: every transition pair, and progress towards 80 clean
// changes in one minute. Needs assets/chords-data.js and assets/site.js first.
const CHANGE_TARGET = 80;
const DRILL_SECS = 60; // only full one-minute drills count towards the target

const CHANGE_STAGES = [
  { min: 80, name: "Mastered", cls: "s5" },
  { min: 60, name: "Fluent", cls: "s4" },
  { min: 40, name: "Solid", cls: "s3" },
  { min: 20, name: "Building", cls: "s2" },
  { min: 1, name: "Learning", cls: "s1" },
  { min: 0, name: "Not tried", cls: "s0" }
];
function changeStage(n) { return CHANGE_STAGES.find(s => (n || 0) >= s.min); }

// Build up a few changes at a time; smaller steps near the top.
function nextGoal(best) {
  if (!best) return null;
  if (best >= CHANGE_TARGET) return CHANGE_TARGET;
  return Math.min(CHANGE_TARGET, best + (best < 40 ? 5 : best < 60 ? 4 : 3));
}

// Rows either have a `root` chord with `to` targets, or a `label` with explicit `pairs`.
const TRANSITION_SECTIONS = [
  {
    id: "basic", title: "Open chords",
    rows: [
      { root: "A", to: ["C", "G", "E", "Em", "D", "Dm"] },
      { root: "C", to: ["G", "E", "D", "Dm", "Am", "Em"] },
      { root: "G", to: ["E", "D", "Dm", "Am", "Em"] },
      { root: "E", to: ["D", "Dm", "Am"] },
      { root: "D", to: ["Am", "Em"] },
      { root: "Dm", to: ["Am", "Em"] },
      { root: "Am", to: ["Em"] },
      { label: "Maj ↔ Min", tag: "Same Root", pairs: [["E", "Em"], ["A", "Am"], ["D", "Dm"]] }
    ]
  },
  {
    id: "blues", title: "Blues",
    rows: [
      { label: "Key of E", tag: "E7 · A7 · B7", pairs: [["E7", "A7"], ["E7", "B7"], ["A7", "B7"]] },
      { label: "Key of A", tag: "A7 · D7 · E7", pairs: [["A7", "D7"], ["A7", "E7"], ["D7", "E7"]] },
      { label: "Key of G", tag: "G7 · C7 · D7", pairs: [["G7", "C7"], ["G7", "D7"], ["C7", "D7"]] },
      { label: "Key of D", tag: "D7 · G7 · A7", pairs: [["D7", "G7"], ["D7", "A7"], ["G7", "A7"]] },
      { label: "C7 Extras", tag: "Full key of C needs F7", pairs: [["C7", "G7"], ["C7", "E7"]] },
      { label: "Shuffle in E", tag: "E · A · B", pairs: [["E5/E6", "A5/A6"], ["E5/E6", "B5/B6"], ["A5/A6", "B5/B6"]] },
      { label: "Shuffle in A", tag: "A · D · E", pairs: [["A5/A6", "D5/D6"], ["A5/A6", "E5/E6"], ["D5/D6", "E5/E6"]] }
    ]
  },
  {
    id: "power", title: "Power chords",
    rows: [
      { label: "Open 5ths", pairs: [["E5", "A5"], ["E5", "D5"], ["A5", "D5"]] },
      { label: "6th String", tag: "Slide", pairs: [["F5", "G5"], ["F5", "A5 (movable)"], ["F#5", "G5"], ["F#5", "A5 (movable)"], ["G5", "A5 (movable)"]] },
      { label: "5th String", tag: "Slide", pairs: [["B5", "C5"], ["B5", "D5 (movable)"], ["C5", "D5 (movable)"]] },
      { label: "Across Strings", tag: "Jump", pairs: [["G5", "C5"], ["G5", "D5 (movable)"], ["A5 (movable)", "D5 (movable)"], ["A5 (movable)", "E5"], ["E5", "F5"], ["E5", "G5"]] }
    ]
  },
  {
    id: "cross", title: "Mixing types",
    rows: [
      { root: "E", to: ["E7", "B7"], tag: "Basic ↔ 7th" },
      { root: "A", to: ["A7", "D7"], tag: "Basic ↔ 7th" },
      { root: "D", to: ["D7", "A7"], tag: "Basic ↔ 7th" },
      { root: "G", to: ["G7", "C7"], tag: "Basic ↔ 7th" },
      { root: "C", to: ["C7", "E7"], tag: "Basic ↔ 7th" },
      { root: "Am", to: ["E7"], tag: "Basic ↔ 7th" },
      { root: "Em", to: ["B7"], tag: "Basic ↔ 7th" },
      { root: "E", to: ["A5", "B5"], tag: "Basic ↔ 5th" },
      { root: "A", to: ["D5", "E5"], tag: "Basic ↔ 5th" },
      { root: "G", to: ["C5", "D5"], tag: "Basic ↔ 5th" },
      { root: "C", to: ["G5", "F5"], tag: "Basic ↔ 5th" },
      { root: "E5/E6", to: ["B7", "A7"], tag: "Shuffle ↔ 7th" },
      { root: "A5/A6", to: ["E7", "D7"], tag: "Shuffle ↔ 7th" }
    ]
  }
];

function rowPairs(row) { return row.pairs || row.to.map(t => [row.root, t]); }

// A pair is stored once whichever way round it was drilled ("A|D" == "D|A").
const CHORD_ORDER = Object.fromEntries(ALL_CHORDS.map((c, i) => [c.key, i]));
function pairKeyOf(a, b) { return CHORD_ORDER[a] <= CHORD_ORDER[b] ? `${a}|${b}` : `${b}|${a}`; }

// Every distinct pair, in learning order, tagged with its section.
const ALL_PAIRS = (() => {
  const seen = new Map();
  TRANSITION_SECTIONS.forEach((sec, si) => sec.rows.forEach(row => rowPairs(row).forEach(([a, b]) => {
    const key = pairKeyOf(a, b);
    if (!seen.has(key)) seen.set(key, { key, a, b, section: sec.id, sectionIndex: si });
  })));
  return [...seen.values()];
})();

// Saved scores: { "A|D": { 60: best, hist: [{ d: "2026-11-03", n: 34 }, ...], date } }
function changeData() {
  const raw = GPH.store.get("drill-best", {});
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const [a, b] = k.split("|");
    if (!(a in CHORD_ORDER) || !(b in CHORD_ORDER)) continue;
    const key = pairKeyOf(a, b);
    const cur = out[key] || { hist: [] };
    cur[DRILL_SECS] = Math.max(cur[DRILL_SECS] || 0, v[DRILL_SECS] || 0);
    cur.hist = cur.hist.concat(v.hist || []).sort((x, y) => x.d.localeCompare(y.d)).slice(-30);
    cur.date = [cur.date, v.date].filter(Boolean).sort().pop();
    out[key] = cur;
  }
  return out;
}
function bestFor(a, b, data = changeData()) { return (data[pairKeyOf(a, b)] || {})[DRILL_SECS] || 0; }
function historyFor(a, b, data = changeData()) { return (data[pairKeyOf(a, b)] || {}).hist || []; }

function recordChanges(a, b, count) {
  const data = changeData();
  const key = pairKeyOf(a, b);
  const rec = data[key] || { hist: [] };
  const prev = rec[DRILL_SECS] || 0;
  rec[DRILL_SECS] = Math.max(prev, count);
  rec.hist = (rec.hist || []).concat({ d: GPH.today(), n: count }).slice(-30);
  rec.date = GPH.today();
  data[key] = rec;
  GPH.store.set("drill-best", data);
  return prev;
}

function changeSummary(pairs = ALL_PAIRS, data = changeData()) {
  const bests = pairs.map(p => bestFor(p.a, p.b, data));
  return {
    total: pairs.length,
    tried: bests.filter(n => n > 0).length,
    mastered: bests.filter(n => n >= CHANGE_TARGET).length,
    average: bests.length ? Math.round(bests.reduce((x, y) => x + y, 0) / bests.length) : 0
  };
}

// Work through the list in order, finishing one section before the next:
// the weakest pairs you have started, plus one new pair to keep adding.
function suggestedPairs(count = 3, data = changeData()) {
  const open = ALL_PAIRS.filter(p => bestFor(p.a, p.b, data) < CHANGE_TARGET);
  if (!open.length) return [];
  const firstSection = Math.min(...open.map(p => p.sectionIndex));
  const pool = open.filter(p => p.sectionIndex === firstSection);
  const started = pool.filter(p => bestFor(p.a, p.b, data) > 0)
    .sort((x, y) => bestFor(x.a, x.b, data) - bestFor(y.a, y.b, data));
  const fresh = pool.filter(p => !bestFor(p.a, p.b, data));
  const picks = started.slice(0, count - (fresh.length ? 1 : 0));
  return picks.concat(fresh, started.slice(picks.length)).slice(0, count);
}

// Small line chart of the last attempts, with a dashed line at the target.
function sparklineSVG(hist, w = 120, h = 30) {
  const pts = hist.slice(-12);
  if (!pts.length) return "";
  const max = CHANGE_TARGET;
  const x = i => pts.length === 1 ? w / 2 : 3 + i * (w - 6) / (pts.length - 1);
  const y = n => h - 3 - Math.min(n, max) / max * (h - 6);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.n).toFixed(1)}`).join("");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-label="Recent scores">
    <line x1="0" x2="${w}" y1="${y(max)}" y2="${y(max)}" class="spark-target"/>
    <path d="${line}" class="spark-line"/>
    ${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.n).toFixed(1)}" r="2.2" class="spark-dot"/>`).join("")}
  </svg>`;
}

// Progress bar towards 80 with marks at each stage.
function targetBarHTML(best) {
  const pct = Math.min(100, best / CHANGE_TARGET * 100);
  const marks = [20, 40, 60].map(m => `<i style="left:${m / CHANGE_TARGET * 100}%"></i>`).join("");
  return `<div class="target-bar ${changeStage(best).cls}"><span style="width:${pct}%"></span>${marks}</div>`;
}

// Chords page: how this chord's changes are going, with a link to drill the weakest one.
function chordChangesHTML(key, data = changeData()) {
  const pairs = ALL_PAIRS.filter(p => p.a === key || p.b === key);
  if (!pairs.length) return "";
  const scored = pairs.map(p => ({ other: p.a === key ? p.b : p.a, best: bestFor(p.a, p.b, data) }));
  const weakest = [...scored].sort((x, y) => x.best - y.best)[0];
  const mastered = scored.filter(s => s.best >= CHANGE_TARGET).length;
  const average = Math.round(scored.reduce((x, s) => x + s.best, 0) / scored.length);
  return `
    <div class="chord-changes" title="${mastered} of ${scored.length} changes at ${CHANGE_TARGET}">
      ${targetBarHTML(average)}
      <div class="cc-line">
        <span>Changes ${mastered}/${scored.length}</span>
        <a class="cc-drill" href="transitions.html#pair=${encodeURIComponent(key)}|${encodeURIComponent(weakest.other)}">Drill &harr; ${weakest.other} &rarr;</a>
      </div>
    </div>`;
}
