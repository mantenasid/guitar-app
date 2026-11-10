// Fingerpicking: thumb and finger patterns over a chord, one at a time, up a tempo ladder.
import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { CHORD_BY_KEY } from "@/content";
import { PICK_BY_ID, PICK_PATTERNS, type PickToken } from "@/content/fingerpicking";
import { DrillTip, DrillTitle, DrillWindow } from "@/components/DrillWindow";
import { drillOptions } from "@/components/DrillTabs";
import { PatternGrid } from "@/components/PatternGrid";
import { TempoDrill, type DrillLoop } from "@/components/TempoDrill";
import { PageHeader } from "@/components/ui";
import { startPickLoop } from "@/audio/pick";
import { chordVoicing } from "@/music/shapes";
import { useProgress } from "@/progress/hooks";

const CHORDS = ["C", "G", "Am", "Em", "D", "A", "E", "Dm"];

const LEGEND: [string, string][] = [
  ["p", "thumb, root bass"],
  ["p2", "thumb, other bass string"],
  ["i", "index, G string"],
  ["m", "middle, B string"],
  ["a", "ring, high E"],
  ["pa", "pinch: thumb and finger together"],
];

function Token({ t }: { t: PickToken }) {
  if (t === "·") return <span className="size-1 rounded-full bg-line-2" />;
  return <span className={t.startsWith("p") ? (t.length > 1 && t !== "p2" ? "text-good" : "text-ink") : "text-accent"}>{t}</span>;
}

export default function FingerpickingPage() {
  const [params, setParams] = useSearchParams();
  const progress = useProgress();
  const [chord, setChord] = useState("C");
  const [click, setClick] = useState(true);
  const [sound, setSound] = useState(true);
  const [slot, setSlot] = useState(-1);
  // The loop reads the latest settings every bar, so changes apply as you play.
  const settings = useRef({ chord, click, sound });
  settings.current = { chord, click, sound };

  const unlocked = PICK_PATTERNS.filter(p => progress.skills.get(`pick:${p.id}`)?.unlocked);
  // A locked pattern can't be opened, even from a link; fall back to the furthest one you've reached.
  const asked = PICK_BY_ID[params.get("pattern") ?? ""];
  const pattern = (asked && unlocked.includes(asked) ? asked : unlocked.at(-1)) ?? PICK_PATTERNS[0]!;
  const plucks = pattern.slots.filter(t => t !== "·").length;

  const start = (loop: DrillLoop) =>
    startPickLoop(pattern, () => ({
      bpm: loop.bpm(),
      click: settings.current.click,
      sound: settings.current.sound && !loop.quiet(),
      voicing: chordVoicing(CHORD_BY_KEY[settings.current.chord]!.shape),
      onSlot: setSlot,
      onBar: times => times.forEach((t, i) => pattern.slots[i] !== "·" && loop.expect(t)),
    }));

  return (
    <>
      <PageHeader title="Fingerpicking" lead="Ten patterns, easy to hard. The thumb keeps the bass steady while the fingers pick the top three strings." />
      <DrillWindow
        value={pattern.id}
        options={drillOptions(progress, PICK_PATTERNS.map(p => ({ id: p.id, title: p.name })), x => `pick:${x.id}`)}
        onChange={id => setParams({ pattern: id }, { replace: true })}
        path
        unlockHint="Pass 60 BPM here to unlock the next pattern."
        side={
          <TempoDrill
            key={pattern.id}
            skillId={`pick:${pattern.id}`}
            hint="Pick along after the count-in."
            start={start}
            onStop={() => setSlot(-1)}
            need={Math.max(8, Math.min(16, plucks * 2))}
            controls={
              <>
                <label className="inline-flex items-center gap-2">
                  Chord
                  <select value={chord} onChange={e => setChord(e.target.value)} className="py-1">
                    {CHORDS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={click} onChange={e => setClick(e.target.checked)} /> Click
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2" title="Silent while the mic is scoring, so it only hears you">
                  <input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Backing guitar
                </label>
              </>
            }
          />
        }
      >
        <DrillTitle title={pattern.name} sub={`${pattern.tag} · ${pattern.meter}`} />
        <PatternGrid count={pattern.count} slots={pattern.slots} active={slot >= 0 ? slot : undefined} render={t => <Token t={t as PickToken} />} />
        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
          {LEGEND.map(([t, l]) => (
            <span key={t}>
              <b className="font-mono font-semibold text-ink-2">{t}</b> {l}
            </span>
          ))}
        </div>
        <DrillTip>Hold the chord and let every string ring. Plant the thumb's rhythm first; the fingers fit around it.</DrillTip>
      </DrillWindow>
    </>
  );
}
