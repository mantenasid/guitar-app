// Progression play-along: a bar timeline over a count-in, with an optional backing strum, up a tempo ladder.
import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { LevelPips } from "@/components/LevelPips";
import { DrillTip, DrillTitle, DrillWindow } from "@/components/DrillWindow";
import { drillOptions } from "@/components/DrillTabs";
import { TempoDrill, type DrillLoop } from "@/components/TempoDrill";
import { PageHeader } from "@/components/ui";
import * as guitar from "@/audio/guitar";
import { isSwing, slotTimes, startStrumLoop } from "@/audio/strum";
import { ALL_PATTERNS, CHORD_BY_KEY } from "@/content";
import { ChordLane, type Lane } from "./ChordLane";
import { PROGRESSIONS, PROGRESSION_BY_ID, progressionChanges } from "@/content/progressions";
import { chordVoicing } from "@/music/shapes";
import { useProgress } from "@/progress/hooks";
import { changeSkillId } from "@/skills/changes";
import { SKILL_BY_ID, maxLevel } from "@/skills/registry";

const notesOf = (chord: string) => chordVoicing(CHORD_BY_KEY[chord]!.shape).map(n => n.midi);

export default function ProgressionsPage() {
  const [params, setParams] = useSearchParams();
  const progress = useProgress();
  const unlocked = PROGRESSIONS.filter(p => progress.skills.get(`prog:${p.id}`)?.unlocked);
  const prog = PROGRESSION_BY_ID[params.get("prog") ?? ""] ?? unlocked.at(-1) ?? PROGRESSIONS[0]!;
  const skillId = `prog:${prog.id}`;
  const p = progress.skills.get(skillId);
  const patterns = ALL_PATTERNS.filter((x, i) => i === 0 || progress.skills.get(`strum:${x.num}`)?.unlocked);

  const [patternNum, setPatternNum] = useState(ALL_PATTERNS[0]!.num);
  const [sound, setSound] = useState(true);
  const [click, setClick] = useState(true);
  /** Bar now sounding, or -1 before the first one. */
  const [bar, setBar] = useState(-1);
  const [running, setRunning] = useState(false);
  const settings = useRef({ sound, click });
  settings.current = { sound, click };
  const pattern = ALL_PATTERNS.find(x => x.num === patternNum) ?? ALL_PATTERNS[0]!;
  const strokes = pattern.slots.filter(t => t !== "·").length;

  const lane = useRef<Lane>(null);
  const { times, beats } = slotTimes(pattern.count, isSwing(pattern));
  const laneSlots = useMemo(() => pattern.slots.map((token, i) => ({ at: times[i]! / beats, token })), [pattern]);

  const start = (loop: DrillLoop) => {
    setRunning(true);
    setBar(-1);
    const barSecs = () => (beats * 60) / loop.bpm();
    // The count-in is one bar long, so that's when the first chord crosses the line.
    lane.current?.reset(guitar.now() + 0.1 + barSecs(), barSecs());
    // The loop schedules ahead, so the chord it plays and the bar on screen are counted separately.
    let scheduled = -2;
    let shown = -1;
    return startStrumLoop(pattern, () => {
      scheduled++;
      const index = scheduled;
      const dur = barSecs();
      return {
        bpm: loop.bpm(),
        click: settings.current.click,
        sound: settings.current.sound && !loop.quiet(),
        notes: notesOf(prog.bars[Math.max(0, scheduled) % prog.bars.length]!),
        onSlot: i => {
          if (i === 0) setBar((shown = (shown + 1) % prog.bars.length));
        },
        onBar: slotAt => {
          lane.current?.bar(index, slotAt, dur);
          slotAt.forEach((t, i) => pattern.slots[i] !== "·" && loop.expect(t));
        },
      };
    });
  };

  const locked = !p?.unlocked;
  const requires = SKILL_BY_ID.get(skillId)?.requires ?? [];

  return (
    <>
      <PageHeader
        title="Play-along"
        lead="Common progressions, one chord per bar. Strum along after the count-in and keep going through every change. Get once round without dropping a strum and the tempo steps up."
      />
      <DrillWindow
        value={prog.id}
        options={drillOptions(
          progress,
          PROGRESSIONS,
          x => `prog:${x.id}`,
          x => `${x.title} in ${x.key}`,
        )}
        onChange={id => setParams({ prog: id })}
        side={
          <TempoDrill
            key={`${prog.id}:${pattern.num}`}
            skillId={skillId}
            hint="Strum along after the count-in and keep going through every change."
            start={start}
            onStop={() => {
              setRunning(false);
              lane.current?.stop();
            }}
            onHeard={t => lane.current?.heard(t)}
            // Once round the whole progression, so every change is in the pass.
            need={Math.min(64, Math.max(8, strokes * prog.bars.length))}
            locked={locked}
            controls={
              <>
                <label className="inline-flex items-center gap-2">
                  Strum
                  <select value={patternNum} onChange={e => setPatternNum(+e.target.value)} className="max-w-[200px] py-1">
                    {patterns.map(x => (
                      <option key={x.num} value={x.num}>
                        {x.num}. {x.name}
                        {isSwing(x) ? " (swing)" : ""}
                      </option>
                    ))}
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
        <DrillTitle title={<>{prog.title} <span className="text-muted">in {prog.key}</span></>} sub={prog.tag} />
        <ChordLane key={`${prog.id}:${pattern.num}`} ref={lane} chords={prog.bars} numerals={prog.numerals} slots={laneSlots} />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {prog.bars.map((c, i) => (
            <span
              key={i}
              className={`min-w-10 rounded-lg px-2 py-1 text-center text-[13px] font-[600] transition-colors duration-200 ${running && bar === i ? "bg-accent text-white" : "bg-surface-2 text-ink-2"}`}
            >
              {c}
            </span>
          ))}
        </div>
        <DrillTip>{prog.tip}</DrillTip>

        <div>
          <div className="mt-6 grid justify-items-center gap-2 text-[12.5px] text-muted">
            <span>{locked ? "Unlock it by reaching level 1 on:" : "Changes in this progression"}</span>
            <div className="flex flex-wrap justify-center gap-2">
              {progressionChanges(prog).map(([a, b]) => {
                const id = changeSkillId(a, b);
                const drill = SKILL_BY_ID.get(id);
                const lv = progress.skills.get(id)?.level ?? 0;
                return drill ? (
                  <Link key={id} to={drill.href} className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-ink hover:text-accent">
                    {a} ↔ {b} <LevelPips level={lv} max={maxLevel("change")} />
                  </Link>
                ) : null;
              })}
              {requires
                .filter(r => r.startsWith("chord:"))
                .map(r => (
                  <Link key={r} to={SKILL_BY_ID.get(r)!.href} className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-ink hover:text-accent">
                    {r.slice(6)} chord <LevelPips level={progress.skills.get(r)?.level ?? 0} />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </DrillWindow>
    </>
  );
}
