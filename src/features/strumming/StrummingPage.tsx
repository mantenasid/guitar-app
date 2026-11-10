// Strumming: one pattern at a time, looped with a count-in, up a tempo ladder.
import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { ALL_PATTERNS, CHORD_BY_KEY, STRUM_LEVELS } from "@/content";
import type { StrumPattern } from "@/content/types";
import { DrillTip, DrillTitle, DrillWindow } from "@/components/DrillWindow";
import type { DrillTab } from "@/components/DrillTabs";
import { PatternGrid } from "@/components/PatternGrid";
import { TempoDrill, type DrillLoop } from "@/components/TempoDrill";
import { PageHeader } from "@/components/ui";
import { StrumToken } from "./StrumToken";
import { isSwing, startStrumLoop } from "@/audio/strum";
import { chordVoicing } from "@/music/shapes";
import { useProgress } from "@/progress/hooks";
import { useSettings } from "@/progress/settings";

const CHORDS = ["G", "C", "D", "Em", "Am", "E", "A", "Dm", "E7", "A7", "B7", "E5", "A5"];

const LEGEND: [string, string][] = [["↓", "down"], ["↑", "up"], ["×", "chuck"], ["B", "bass note"], ["PM", "palm mute"], [">", "accent"]];

/** How many strokes a bar has, which sets how many you must land for a pass: two bars' worth. */
const strokes = (p: StrumPattern) => p.slots.filter(t => t !== "·").length;

export default function StrummingPage() {
  const [params, setParams] = useSearchParams();
  const progress = useProgress();
  const strum = useSettings(s => s.strum);
  const setStrum = useSettings(s => s.setStrum);
  const [slot, setSlot] = useState(-1);
  // The loop reads the latest settings every bar, so changes apply as you play.
  const settings = useRef(strum);
  settings.current = strum;

  const options: DrillTab<string>[] = STRUM_LEVELS.flatMap(l =>
    l.patterns.map(p => {
      const sp = progress.skills.get(`strum:${p.num}`);
      return { value: String(p.num), label: p.name, locked: !sp?.unlocked, level: sp?.level, group: l.title };
    }),
  );
  const open = (num: string | null) => options.find(o => o.value === num && !o.locked);
  // The pattern in the link, else the furthest one you've reached. A locked pattern can't be opened.
  const chosen = open(params.get("pattern")) ?? options.filter(o => !o.locked).at(-1) ?? options[0]!;
  const pattern = ALL_PATTERNS.find(p => String(p.num) === chosen.value)!;

  const start = (loop: DrillLoop) =>
    startStrumLoop(pattern, () => ({
      bpm: loop.bpm(),
      click: settings.current.click,
      sound: settings.current.sound && !loop.quiet(),
      notes: chordVoicing(CHORD_BY_KEY[settings.current.chord]!.shape).map(n => n.midi),
      onSlot: setSlot,
      onBar: times => times.forEach((t, i) => pattern.slots[i] !== "·" && loop.expect(t)),
    }));

  return (
    <>
      <PageHeader title="Strumming" lead={`${ALL_PATTERNS.length} patterns, easy to hard. Keep your hand swinging down and up on every count, and only touch the strings where the pattern says.`} />
      <DrillWindow
        value={chosen.value}
        options={options}
        onChange={num => setParams({ pattern: num }, { replace: true })}
        path
        unlockHint="Pass 60 BPM here to unlock the next pattern."
        side={
          <TempoDrill
            key={pattern.num}
            skillId={`strum:${pattern.num}`}
            hint="Strum along after the count-in."
            start={start}
            onStop={() => setSlot(-1)}
            need={Math.max(4, Math.min(16, strokes(pattern) * 2))}
            controls={
              <>
                <label className="inline-flex items-center gap-2">
                  Chord
                  <select value={strum.chord} onChange={e => setStrum({ chord: e.target.value })} className="py-1">
                    {CHORDS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={strum.click} onChange={e => setStrum({ click: e.target.checked })} /> Click
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2" title="Silent while the mic is scoring, so it only hears you">
                  <input type="checkbox" checked={strum.sound} onChange={e => setStrum({ sound: e.target.checked })} /> Backing guitar
                </label>
              </>
            }
          />
        }
      >
        <DrillTitle title={pattern.name} sub={`${pattern.tag} · ${pattern.meter}${isSwing(pattern) ? " · swing" : ""}`} />
        <PatternGrid count={pattern.count} slots={pattern.slots} active={slot >= 0 ? slot : undefined} render={t => <StrumToken t={t} />} />
        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
          {LEGEND.map(([t, l]) => (
            <span key={t}>
              <b className="font-mono font-semibold text-ink-2">{t}</b> {l}
            </span>
          ))}
        </div>
        <DrillTip>Count it out loud first. An empty box is a swing of the hand that misses the strings: the hand keeps moving, so the next stroke lands in time.</DrillTip>
      </DrillWindow>
    </>
  );
}
