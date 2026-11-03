// One-off: pull content data out of the legacy HTML site into JSON.
// Usage: node scripts/extract-legacy.mjs > /tmp/legacy.json
import fs from "node:fs";
import vm from "node:vm";

const L = new URL("../legacy/", import.meta.url);
const read = f => fs.readFileSync(new URL(f, L), "utf8");
const out = {};

// Chords (assets/chords-data.js)
{
  const ctx = { OPEN_MIDI: {}, GPH: {}, drawSVG: () => "" };
  vm.createContext(ctx);
  vm.runInContext(read("assets/chords-data.js") + "\nthis.__ = {basicMajor, basicMinor, blues7, bluesShuffle, powerOpen, power6, power5};", ctx);
  out.chords = ctx.__;
}

// Transition sections (assets/changes.js)
{
  const ctx = { ALL_CHORDS: out.chords ? Object.values(out.chords).flat() : [], GPH: { store: { get: (k, d) => d } } };
  vm.createContext(ctx);
  vm.runInContext(read("assets/changes.js") + "\nthis.__ = TRANSITION_SECTIONS;", ctx);
  out.transitions = ctx.__;
}

// Strumming patterns
{
  const html = read("strumming.html");
  const js = html.slice(html.indexOf("const header8"), html.indexOf("function styleToken"));
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(js + "\nthis.__ = {lvl1_1, lvl1_2, lvl2_1, lvl2_2, lvl3_1, lvl3_2, lvl4_1, lvl4_2};", ctx);
  out.strumming = ctx.__;
}

// Scale overview groups (scales.html)
{
  const html = read("scales.html");
  const js = html.slice(html.indexOf("// A minor pentatonic box 1"), html.indexOf("function cardHTML"));
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(js + "\nthis.__ = GROUPS;", ctx);
  out.scaleGroups = ctx.__;
}

// Standard scale detail pages: title, meta and each shape's diagram.
const STANDARD = ["scale-e-minor-pentatonic", "scale-a-minor-pentatonic", "scale-e-minor-blues", "scale-a-minor-blues",
  "scale-g-major-pentatonic", "scale-c-major-pentatonic", "scale-a-major-pentatonic", "scale-a-major-blues",
  "scale-c-major", "scale-g-major", "scale-a-major-movable", "scale-a-natural-minor"];
out.scalePages = {};
for (const id of STANDARD) {
  const html = read(id + ".html");
  const title = html.match(/<h1>(.*?)<\/h1>/)[1];
  const meta = [...html.match(/<div class="meta-line">(.*?)<\/div>/s)[1].matchAll(/<span>(\w[\w ]*?) <b>(.*?)<\/b><\/span>/g)]
    .map(m => [m[1], m[2].replace(/<[^>]+>/g, "").replace(/&middot;/g, "·").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()]);
  const titles = [...html.matchAll(/<span class="col-card-title">(.*?)<\/span>\s*<span class="col-card-subtitle">(.*?)<\/span>/g)]
    .map(m => [m[1], m[2]].map(s => s.replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&amp;/g, "&")));
  const shapes = [];
  const ctx = { document: { getElementById: () => ({ set innerHTML(_) {} }) }, drawSVG: c => { shapes.push(c); return ""; } };
  vm.createContext(ctx);
  const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));
  vm.runInContext(script, ctx);
  out.scalePages[id] = { title: title.replace(/&amp;/g, "&"), meta, shapes: shapes.map((s, i) => ({ title: titles[i]?.[0], subtitle: titles[i]?.[1], ...s })) };
}
process.stdout.write(JSON.stringify(out, null, 1));
