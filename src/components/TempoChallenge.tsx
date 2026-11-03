// Play along with a metronome and claim the tempo once you play it cleanly.
import { useEffect, useRef, useState } from "react";
import { startMetronome } from "@/audio/metronome";
import { stopPlayback } from "@/audio/playback";
import { useProgress } from "@/progress/hooks";
import { recordResult } from "@/progress/record";
import { METRICS, SKILLS, kindOf, maxLevel } from "@/skills/registry";
import { LevelPips } from "./LevelPips";
import { cardClass } from "./ui";

/** Beats you must play before a tempo can be claimed. */
const MIN_BEATS = 8;

const titleOf = (id: string) => SKILLS.find(s => s.id === id)?.title ?? id;

export function TempoChallenge({ skillId, hint }: { skillId: string; hint: string }) {
  const kind = kindOf(skillId);
  const metric = METRICS[kind];
  const progress = useProgress();
  const p = progress.skills.get(skillId);
  // Anything is unlocked by reaching level 1 on each skill it requires.
  const waitingOn = (SKILLS.find(s => s.id === skillId)?.requires ?? []).filter(id => (progress.skills.get(id)?.level ?? 0) < 1);
  const unlocks = SKILLS.filter(s => s.requires.includes(skillId));
  const level = p?.level ?? 0;
  const max = maxLevel(kind);
  const nextTarget = level < max ? metric.levels[level]! : metric.levels[max - 1]!;
  const [bpm, setBpm] = useState(nextTarget);
  const [running, setRunning] = useState(false);
  const [beats, setBeats] = useState(0);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  useEffect(() => {
    if (!running) return;
    stopPlayback();
    setBeats(0);
    return startMetronome(() => bpmRef.current, b => setBeats(b + 1));
  }, [running]);

  const claim = async () => {
    setRunning(false);
    await recordResult(skillId, bpm);
  };

  return (
    <div className={`${cardClass} no-print p-4 sm:p-5`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-[620]">Tempo challenge</div>
          <div className="text-[13px] text-muted">{hint}</div>
        </div>
        <span className="flex items-center gap-2 text-[13px] text-muted">
          <LevelPips level={level} />
          {p?.best !== undefined ? `Best ${p.best} BPM` : "Not tried"}
        </span>
      </div>
      {p && !p.unlocked && waitingOn.length > 0 && (
        <p className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-ink-2">
          🔒 Unlocks when you claim {metric.levels[0]} BPM or faster on {waitingOn.map(titleOf).join(" and ")}. You can still practise it now.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[13.5px] text-muted">
          <input type="range" min={40} max={180} step={2} value={bpm} onChange={e => setBpm(+e.target.value)} className="w-36" />
          <b className="min-w-[64px] font-[550] tabular-nums text-ink">{bpm} BPM</b>
        </label>
        <button onClick={() => setRunning(r => !r)} className={`rounded-[9px] px-4 py-2 text-[13.5px] font-medium ${running ? "bg-accent-soft text-accent" : "bg-ink text-bg"}`}>
          {running ? "Stop" : "Start metronome"}
        </button>
        <button
          disabled={!running || beats < MIN_BEATS}
          onClick={() => void claim()}
          className="rounded-[9px] border border-good px-4 py-2 text-[13.5px] font-medium text-good disabled:border-line-2 disabled:text-faint"
          title={beats < MIN_BEATS ? `Play along for ${MIN_BEATS} beats first` : "Save this tempo"}
        >
          ✓ Clean at {bpm}
        </button>
        {running && (
          <span className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map(i => (
              <i key={i} className={`size-2.5 rounded-full ${(beats - 1) % 4 === i ? (i === 0 ? "bg-accent" : "bg-ink") : "bg-line-2"}`} />
            ))}
          </span>
        )}
      </div>
      <p className="mt-3 text-[12.5px] text-faint">
        Levels at {metric.levels.join(" / ")} BPM. Only claim a tempo you can play without a single mistake.
        {unlocks.length > 0 && (
          level >= 1
            ? ` Unlocked ${unlocks.map(s => s.title).join(" and ")}.`
            : ` Press “✓ Clean at” at ${metric.levels[0]} BPM or faster to unlock ${unlocks.map(s => s.title).join(" and ")}.`
        )}
      </p>
    </div>
  );
}
