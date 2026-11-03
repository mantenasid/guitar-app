"""One-off: turn the extracted legacy JSON into typed TypeScript content files.
Usage: python3 scripts/generate-content.py <legacy.json>"""
import json, re, sys, html

d = json.load(open(sys.argv[1]))
OUT = "src/content/"

def dot(x, chord=False):
    o = {"s": x["s"], "f": x["f"]}
    lbl = str(x.get("lbl", ""))
    if lbl.isdigit(): o["finger"] = int(lbl)
    elif lbl: o["label"] = lbl
    c = x.get("c")
    if c == "bounce": o["kind"] = "extra"
    elif c == "root" and not chord: o["kind"] = "root"
    return o

def shape(x, chord=False, root=None):
    o = {"startFret": x["startFret"]}
    if x.get("numFrets"): o["frets"] = x["numFrets"]
    if x.get("nut"): o["nut"] = True
    for k in ("muted", "open", "openRoots"):
        if x.get(k): o[k] = x[k]
    r = root or x.get("chordRoot")
    if r: o["root"] = r
    o["dots"] = [dot(y, chord) for y in x["dots"]]
    return o

def ts(v):
    return json.dumps(v, ensure_ascii=False)

def clean(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).replace("–", "–")

# ---- chords ----
GROUPS = [
  ("basic", "Open chords", "The 5 major and 3 minor shapes everything else builds on.",
   [("Major", "basicMajor"), ("Minor", "basicMinor")]),
  ("blues", "Blues chords", "Dominant 7ths for the 12-bar blues, plus four shuffle shapes.",
   [("Dominant 7ths", "blues7"), ("Shuffle: hold one finger, bounce the other", "bluesShuffle")]),
  ("power", "Power chords", "Two-note chords: one-finger open shapes, then movable ones.",
   [("Open, one finger", "powerOpen"), ("Root on the 6th string", "power6"), ("Root on the 5th string", "power5")]),
]
lines = ['// Generated from the legacy site by scripts/generate-content.py.',
         'import type { ChordGroup } from "./types";', '', 'export const CHORD_GROUPS: ChordGroup[] = [']
for gid, title, note, subs in GROUPS:
    lines.append(f'  {{\n    id: {ts(gid)}, title: {ts(title)}, note: {ts(note)},\n    sections: [')
    for st, key in subs:
        lines.append(f'      {{\n        title: {ts(st)},\n        chords: [')
        for c in d["chords"][key]:
            root = re.match(r"[A-G][#b]?", c["key"]).group(0)
            lines.append(f'          {{ key: {ts(c["key"])}, name: {ts(c["name"])}, tag: {ts(c["tag"])}, shape: {ts(shape(c, True, root))} }},')
        lines.append('        ],\n      },')
    lines.append('    ],\n  },')
lines.append('];\n')
open(OUT + "chords.ts", "w").write("\n".join(lines))

# ---- strumming ----
LEVELS = [("lvl1", "Foundation", "Steady timing and a hand that never stops moving.", ["lvl1_1", "lvl1_2"]),
          ("lvl2", "Core grooves", "Skip downbeats, add bass notes and a little swing.", ["lvl2_1", "lvl2_2"]),
          ("lvl3", "Intermediate", "Palm mutes, percussive chucks and off-beat accents.", ["lvl3_1", "lvl3_2"]),
          ("lvl4", "Advanced", "16th-note flicks, ska upbeats and the Texas shuffle.", ["lvl4_1", "lvl4_2"])]
lines = ['// Generated from the legacy site by scripts/generate-content.py.',
         'import type { StrumLevel } from "./types";', '', 'export const STRUM_LEVELS: StrumLevel[] = [']
for lid, title, note, keys in LEVELS:
    lines.append(f'  {{\n    id: {ts(lid)}, title: {ts(title)}, note: {ts(note)},\n    patterns: [')
    for k in keys:
        count = None
        for item in d["strumming"][k]:
            if item.get("header"):
                count = {"label": item["label"], "slots": item["slots"]}
                continue
            num, name = item["name"].split(". ", 1)
            lines.append(f'      {{ num: {num}, name: {ts(name)}, tag: {ts(item.get("tag", ""))}, meter: {ts(count["label"])}, count: {ts(count["slots"])}, slots: {ts(item["slots"])} }},')
    lines.append('    ],\n  },')
lines.append('];\n')
open(OUT + "strumming.ts", "w").write("\n".join(lines))

# ---- transitions ----
lines = ['// Generated from the legacy site by scripts/generate-content.py.',
         'import type { TransitionSection } from "./types";', '', 'export const TRANSITION_SECTIONS: TransitionSection[] = [']
for sec in d["transitions"]:
    lines.append(f'  {{\n    id: {ts(sec["id"])}, title: {ts(sec["title"])},\n    rows: [')
    for r in sec["rows"]:
        pairs = r.get("pairs") or [[r["root"], t] for t in r["to"]]
        row = {"label": r.get("label") or r["root"] + " ↔"}
        if r.get("root"): row["root"] = r["root"]
        if r.get("tag"): row["tag"] = r["tag"]
        row["pairs"] = pairs
        lines.append(f'      {ts(row)},')
    lines.append('    ],\n  },')
lines.append('];\n')
open(OUT + "transitions.ts", "w").write("\n".join(lines))

# ---- scales ----
SPECIAL = {"scale-first-position.html": "first-position", "scale-minor-pentatonic-sequences.html": "sequences",
           "scale-minor-pentatonic-keys.html": "keys", "scale-minor-pentatonic-extended.html": "extended"}
lines = ['// Generated from the legacy site by scripts/generate-content.py.',
         'import type { ScaleGroup } from "./types";', '', 'export const SCALE_GROUPS: ScaleGroup[] = [']
for g in d["scaleGroups"]:
    title = re.sub(r"^\d+\. Scale: ", "", g["title"])
    lines.append(f'  {{\n    id: {ts(g["id"])}, title: {ts(title)}, note: {ts(clean(g["note"]))},\n    scales: [')
    for s in g["scales"]:
        num, name = s["name"].split(". ", 1)
        sid = s["url"].replace(".html", "").replace("scale-", "")
        entry = {"id": sid, "num": int(num), "name": name, "card": shape(s)}
        page = d["scalePages"].get(s["url"].replace(".html", ""))
        if page:
            entry["title"] = page["title"]
            entry["meta"] = [[k, clean(v)] for k, v in page["meta"]]
            entry["shapes"] = [{"title": clean(x["title"] or ""), "subtitle": clean(x["subtitle"] or ""), **shape(x)} for x in page["shapes"]]
        else:
            entry["special"] = SPECIAL[s["url"]]
        lines.append(f'      {ts(entry)},')
    lines.append('    ],\n  },')
lines.append('];\n')
open(OUT + "scales.ts", "w").write("\n".join(lines))
print("ok")
