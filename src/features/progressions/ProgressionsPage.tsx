// Progression play-along: a bar timeline over a count-in, with an optional backing strum, claimed at a tempo.
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { LevelPips } from "@/components/LevelPips";
import { DrillWindow } from "@/components/DrillWindow";
import { drillOptions } from "@/components/DrillTabs";
import { PageHeader } from "@/components/ui";
import { stopPlayback } from "@/audio/playback";
import { isSwing, startStrumLoop } from "@/audio/strum";
import { ALL_PATTERNS, CHORD_BY_KEY } from "@/content";
import { PROGRESSIONS, PROGRESSION_BY_ID, progressionChanges } from "@/content/progressions";
import { chordVoicing } from "@/music/shapes";
import { useProgress } from "@/progress/hooks";
import { recordResult } from "@/progress/record";
import { changeSkillId } from "@/skills/changes";
import { METRICS, SKILL_BY_ID, maxLevel } from "@/skills/registry";

/** Bars you must play, at least one full pass, before a tempo can be claimed. */
const MIN_BARS = 8;

const notesOf = (chord: string) => chordVoicing(CHORD_BY_KEY[chord]!.shape).map(n => n.midi);

export default function ProgressionsPage() {
  const [params, setParams] = useSearchParams();
  const progress = useProgress();
  const unlocked = PROGRESSIONS.filter(p => progress.skills.get(`prog:${p.id}`)?.unlocked);
  const prog = PROGRESSION_BY_ID[params.get("prog") ?? ""] ?? unlocked.at(-1) ?? PROGRESSIONS[0]!;
  const skillId = `prog:${prog.id}`;
  const p = progress.skills.get(skillId);
  const level = p?.level ?? 0;
  const metric = METRICS.prog;
  const patterns = ALL_PATTERNS.filter((x, i) => i === 0 || progress.skills.get(`strum:${x.num}`)?.unlocked);

  const [bpm, setBpm] = useState<number>(metric.levels[Math.min(level, maxLevel("prog") - 1)]!);
  const [patternNum, setPatternNum] = useState(ALL_PATTERNS[0]!.num);
  const [sound, setSound] = useState(true);
  const [click, setClick] = useState(true);
  const [running, setRunning] = useState(false);
  /** Bar now sounding, or -1 during the count-in. */
  const [bar, setBar] = useState(-1);
  const [played, setPlayed] = useState(0);
  const settings = useRef({ bpm, sound, click });
  settings.current = { bpm, sound, click };
  const pattern = ALL_PATTERNS.find(x => x.num === patternNum) ?? ALL_PATTERNS[0]!;

  useEffect(() => {
    if (!running) return;
    stopPlayback();
    setBar(-1);
    setPlayed(0);
    // The loop schedules ahead, so the chord it plays and the bar on screen are counted separately.
    let scheduled = -2;
    let shown = -1;
    return startStrumLoop(pattern, () => {
      scheduled++;
      return {
        ...settings.current,
        notes: notesOf(prog.bars[Math.max(0, scheduled) % prog.bars.length]!),
        onSlot: i => {
          if (i === 0) setBar((shown = (shown + 1) % prog.bars.length));
          if (i === -1) setPlayed(n => n + 1);
        },
      };
    });
  }, [running, pattern, prog]);

  // A new progression or pattern starts from the top.
  useEffect(() => setRunning(false), [prog.id]);

  const needed = Math.max(MIN_BARS, prog.bars.length);
  const claim = async () => {
    setRunning(false);
    await recordResult(skillId, bpm);
  };

  const locked = !p?.unlocked;
  const requires = SKILL_BY_ID.get(skillId)?.requires ?? [];

  return (
    <>
      <PageHeader
        title="Play-along"
        lead="Common progressions, one chord per bar. Strum along after the count-in and keep going through every change. Claim a tempo once you get round without stopping."
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
          <div className="no-print p-5 sm:p-6">
            <div className="mb-3 text-base font-[620]">Play along</div>
            <div className="flex flex-wrap items-center gap-x-[22px] gap-y-3 text-[13.5px] text-muted">
              <label className="inline-flex items-center gap-2">
                Tempo
                <input type="range" min={40} max={180} step={2} value={bpm} onChange={e => setBpm(+e.target.value)} className="w-32" />
                <b className="min-w-[64px] font-[550] tabular-nums text-ink">{bpm} BPM</b>
              </label>
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
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Backing guitar
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setRunning(r => !r)}
                className={`rounded-[9px] px-4 py-2 text-[13.5px] font-medium transition-colors duration-200 ${running ? "bg-accent-soft text-accent" : "bg-ink text-bg"}`}
              >
                {running ? "Stop" : "Start"}
              </button>
              <button
                disabled={!running || locked || played < needed}
                onClick={() => void claim()}
                className="rounded-[9px] border border-good px-4 py-2 text-[13.5px] font-medium text-good disabled:border-line-2 disabled:text-faint"
                title={locked ? "Unlock this progression first" : played < needed ? `Play along for ${needed} bars first` : "Save this tempo"}
              >
                ✓ Clean at {bpm}
              </button>
              {running && (
                <span className="text-[12.5px] text-faint">
                  {Math.min(played, needed)} / {needed} bars
                </span>
              )}
            </div>
            <p className="mt-3 text-[12.5px] text-faint">
              Levels at {metric.levels.join(" / ")} BPM.{" "}
              {locked ? "You can play along now; claiming opens once the changes are at level 1." : "Only claim a tempo you can play all the way round without stopping."}
            </p>
          </div>
        }
      >
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-base font-[620] tracking-[-0.01em]">
                {prog.title} <span className="font-normal text-muted">in {prog.key}</span>
              </div>
              <div className="text-[13px] text-muted">{prog.tag}</div>
            </div>
            <span className="flex items-center gap-2 text-[13px] text-muted">
              <LevelPips level={level} />
              {p?.best !== undefined ? `Best ${p.best} BPM` : "Not tried"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {prog.bars.map((c, i) => (
              <div
                key={i}
                className={`flex flex-col items-center rounded-lg border px-2 py-3 transition-colors duration-200 ${
                  running && bar === i ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface-2"
                }`}
              >
                <span className="text-[17px] font-[620] tracking-[-0.01em]">{c}</span>
                <span className="text-[11.5px] text-faint">{prog.numerals[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 h-5 text-[12.5px] text-muted">
            {running && (bar === -1 ? "Count-in…" : `Bar ${bar + 1} of ${prog.bars.length} · next ${prog.bars[(bar + 1) % prog.bars.length]}`)}
          </div>
          <p className="mt-2 text-[14px] text-ink-2">{prog.tip}</p>

          <div className="mt-4 grid gap-1.5 text-[12.5px] text-muted">
            <span>{locked ? "Unlock it by reaching level 1 on:" : "Changes in this progression"}</span>
            <div className="flex flex-wrap gap-2">
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
