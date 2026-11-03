import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { CHORD_BY_KEY, TRANSITION_SECTIONS } from "@/content";
import { Fretboard } from "@/components/Fretboard";
import { PageHeader, PlayButton, Sparkline, StageDot, TargetBar } from "@/components/ui";
import { DrillWindow } from "@/components/DrillWindow";
import type { DrillTab } from "@/components/DrillTabs";
import { LevelPips } from "@/components/LevelPips";
import { formatDuration } from "@/components/AppShell";
import * as guitar from "@/audio/guitar";
import { startMetronome } from "@/audio/metronome";
import { recordResult } from "@/progress/record";
import { db, recordAttempt } from "@/progress/db";
import { useHistory, useProgress } from "@/progress/hooks";
import { useSettings } from "@/progress/settings";
import {
  ALL_PAIRS, CHANGE_LEVELS, DRILL_SECONDS, RECENT_DRILLS, STAGES, changeSkillId, drillFeedback, nextGoal, pairKey, pairProgress, stageOf,
  summarise, type Pair, type PairSkills,
} from "@/skills/changes";
import { strumChord } from "@/features/chords/ChordCard";
import { ChangeCounter } from "@/audio/listen/counter";
import { useChordListener } from "@/audio/listen/useChordListener";
import { useInput } from "@/audio/listen/useInput";
import { defaultSource } from "@/audio/listen/listener";
import { recentTiming, timingId, timingScore } from "@/skills/timing";
import { nearTwins } from "@/audio/listen/rivals";
import { ListenPanel } from "@/components/ListenPanel";

interface Run {
  a: string;
  b: string;
  secs: number;
  end: number;
  count: number;
}

/** Seconds of "get set" before the minute starts, so both hands can get on the guitar. */
const PRIMER_SECONDS = 5;

type Phase = "idle" | "primer" | "running";

/** Seconds from a click being scheduled to the player hearing it; the dev synth source has none. */
function playLatency(): number {
  if (defaultSource() === "synth") return 0;
  const ctx = guitar.audioContext();
  return (ctx.outputLatency || 0) + ctx.baseLatency;
}

function Drill({ a, b, skills }: { a: string; b: string; skills: PairSkills }) {
  const [secs, setSecs] = useState(DRILL_SECONDS);
  const [phase, setPhase] = useState<Phase>("idle");
  const [primerLeft, setPrimerLeft] = useState(PRIMER_SECONDS);
  const [run, setRun] = useState<Run | null>(null);
  const [left, setLeft] = useState(DRILL_SECONDS);
  const [pacer, setPacer] = useState(false);
  const [result, setResult] = useState("");
  const [bump, setBump] = useState(0);
  const runRef = useRef(run);
  runRef.current = run;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const primerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const counter = useRef(new ChangeCounter());
  /** When "Go" sounded; the beep itself must not count as a strum. */
  const goAt = useRef(0);
  /** Pacer clicks and heard strums during the minute, on the audio clock, for the timing score. */
  const clicks = useRef<number[]>([]);
  const strums = useRef<number[]>([]);

  const p = pairProgress(skills, a, b);
  const speed = p.current ?? 0;
  const goal = nextGoal(speed);
  const st = stageOf(p.level, p.attempts > 0);
  const nextLevel = CHANGE_LEVELS[p.level];
  const history = useHistory(changeSkillId(a, b)).map(h => h.value);
  const timing = recentTiming(useHistory(timingId(pairKey(a, b)), 3).map(h => h.value));
  const chordA = CHORD_BY_KEY[a]!;
  const chordB = CHORD_BY_KEY[b]!;

  const add = (n: number) => {
    setRun(r => (r ? { ...r, count: Math.max(0, r.count + n) } : r));
    if (n > 0) setBump(x => x + 1);
  };

  // Chords one note apart (G and G7) are too alike to tell apart by ear, so for
  // those every new strum after "Go" counts as a change.
  const twins = nearTwins(a, b);

  // The mic listens during the primer too, so it already knows which chord you're holding at "Go".
  const listen = useChordListener([a, b], label => {
    if (twins || phaseRef.current === "idle") return;
    const changed = counter.current.feed(label);
    if (changed && phaseRef.current === "running") add(1);
  }, {
    onStrum: () => {
      if (twins && phaseRef.current === "running" && Date.now() - goAt.current > 400) add(1);
    },
  });

  // Timing needs both the pacer to play along to and the mic to hear the strums.
  const timingOn = pacer && listen.on && phase !== "idle";
  useInput(timingOn, {
    onStrum: t => {
      if (phaseRef.current === "running") strums.current.push(t);
    },
  });

  useEffect(() => setResult(""), [a, b]);

  const clearPrimer = () => {
    primerTimers.current.forEach(clearTimeout);
    primerTimers.current = [];
  };
  useEffect(() => clearPrimer, []);

  const finish = useCallback(async (r: Run) => {
    // Clear the ref straight away so the countdown can't save the same run twice.
    runRef.current = null;
    setRun(null);
    setPhase("idle");
    setLeft(r.secs);
    guitar.beep({ hz: 660, dur: 0.5 });
    if (r.secs !== DRILL_SECONDS) {
      setResult(`Warm-up: ${r.count} in ${r.secs}s (about ${Math.round((r.count * 60) / r.secs)} a minute). Warm-ups don't count.`);
      return;
    }
    const id = changeSkillId(r.a, r.b);
    const previous = (await db.attempts.where("skillId").equals(id).sortBy("at")).map(x => x.value);
    await recordResult(id, r.count);
    const onClick = timingScore(strums.current, clicks.current, playLatency());
    if (onClick !== null) await recordAttempt(timingId(pairKey(r.a, r.b)), onClick);
    setResult(drillFeedback(r.count, previous) + (onClick !== null ? ` ${onClick}% of strums on the click.` : ""));
  }, []);

  // Countdown, plus the pacer click at goal speed.
  useEffect(() => {
    if (!run) return;
    const tick = setInterval(() => {
      const r = runRef.current;
      if (!r) return;
      const remaining = (r.end - Date.now()) / 1000;
      setLeft(remaining);
      if (remaining <= 0) void finish(r);
    }, 100);
    const rate = goal ?? 20;
    const stopPacer = pacer ? startMetronome(() => rate, (_, when) => clicks.current.push(when)) : undefined;
    return () => {
      clearInterval(tick);
      stopPacer?.();
    };
  }, [run !== null, pacer, goal, finish]);

  useEffect(() => {
    if (phase !== "running") return;
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === "Space") { e.preventDefault(); add(1); }
      if (e.code === "Backspace") { e.preventDefault(); add(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const stop = () => {
    clearPrimer();
    setRun(null);
    setPhase("idle");
    setLeft(secs);
  };

  const start = () => {
    if (phase !== "idle") return stop();
    setResult("");
    counter.current.reset();
    setPhase("primer");
    setPrimerLeft(PRIMER_SECONDS);
    // 5, 4, 3, 2, 1 with a tick each second, then a higher "go" and the minute starts.
    for (let i = 0; i < PRIMER_SECONDS; i++) {
      primerTimers.current.push(setTimeout(() => {
        setPrimerLeft(PRIMER_SECONDS - i);
        guitar.beep({ hz: 660, dur: 0.12 });
      }, i * 1000));
    }
    primerTimers.current.push(setTimeout(() => {
      guitar.beep({ hz: 1320, dur: 0.3 });
      // Keep the chord already being held; only changes from here on count.
      counter.current.count = 0;
      goAt.current = Date.now();
      clicks.current = [];
      strums.current = [];
      setPhase("running");
      setRun({ a, b, secs, end: Date.now() + secs * 1000, count: 0 });
      setLeft(secs);
    }, PRIMER_SECONDS * 1000));
  };

  const busy = phase !== "idle";
  const chordTile = (key: string) => {
    const c = CHORD_BY_KEY[key]!;
    const playId = `drill:${key}`;
    const hearing = listen.on && listen.heard === key;
    return (
      <div className={`min-w-0 rounded-xl p-2 transition ${hearing ? "bg-good-soft ring-2 ring-good" : ""}`}>
        <div className="mb-1.5 flex items-center justify-between text-[17px] font-[620] tracking-[-0.01em]">
          <span>
            {c.name}
            {hearing && <span className="ml-2 text-xs font-medium text-good">hearing</span>}
          </span>
          <PlayButton playId={playId} onPlay={() => strumChord(c, playId)} title={`Strum ${c.name}`} />
        </div>
        <Fretboard shape={c.shape} scope={playId} fluid className="max-w-[440px]" />
      </div>
    );
  };

  return (
    <div className="no-print p-4 sm:p-[22px]">
      <div className="grid grid-cols-2 items-start gap-3 sm:gap-6 lg:grid-cols-[1fr_1fr_260px]">
        <div className="col-span-2 flex flex-col gap-2.5 lg:order-last lg:col-span-1">
          {phase === "primer" ? (
            <div className="flex flex-col items-center justify-center py-1 text-center">
              <strong key={primerLeft} className="text-[56px] font-[650] leading-none tracking-[-0.04em] tabular-nums text-accent animate-[pop_0.25s_ease-out]">{primerLeft}</strong>
              <small className="mt-1 text-[13px] text-muted">Get set: fret {a}, the minute starts on the high beep</small>
            </div>
          ) : (
            <div className="flex items-baseline justify-between">
              <span>
                <strong key={bump} className={`inline-block text-[56px] font-[650] leading-none tracking-[-0.04em] tabular-nums ${bump ? "animate-[pop_0.2s_ease-out]" : ""}`}>{run?.count ?? 0}</strong>
                <small className="ml-1.5 text-[13px] text-muted">changes</small>
              </span>
              <span className="text-xl tabular-nums text-muted">{formatDuration(Math.max(0, Math.ceil(left)))}</span>
            </div>
          )}
          <button onClick={start} className="w-full rounded-[10px] bg-ink py-[11px] text-[14.5px] font-medium text-bg hover:opacity-90">
            {phase === "idle" ? `Start (${PRIMER_SECONDS} s to get set)` : "Stop"}
          </button>
          <div className="flex gap-1.5">
            <button disabled={phase !== "running"} onClick={() => add(1)} className="flex-1 rounded-[9px] border border-line-2 bg-surface py-[7px] text-[13.5px] disabled:opacity-35">
              +1 <span className="text-muted">Space</span>
            </button>
            <button disabled={phase !== "running"} onClick={() => add(-1)} title="Take one back (Backspace)" className="rounded-[9px] border border-line-2 bg-surface px-3.5 text-[13.5px] disabled:opacity-35">
              −1
            </button>
          </div>
          <ListenPanel
            listen={listen}
            teachable={!twins}
            hint={twins
              ? `${a} and ${b} differ by one note, so every strum after "Go" counts as a change. Strum once per change.`
              : "Each change counts once the new chord rings clearly. Re-strumming the same chord doesn't count."}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={pacer} onChange={e => setPacer(e.target.checked)} /> Pacer click at goal speed
            </label>
            <select aria-label="Drill length" value={secs} disabled={busy} onChange={e => { setSecs(+e.target.value); setLeft(+e.target.value); }}>
              <option value={60}>1 minute</option>
              <option value={30}>30 s warm-up</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-2.5">
              {[
                ["Current", speed || "–", p.attempts && p.attempts < RECENT_DRILLS ? `from ${p.attempts} drill${p.attempts === 1 ? "" : "s"}` : `last ${RECENT_DRILLS} avg`],
                ["Timing", timing !== undefined ? `${timing}%` : "–", timing !== undefined ? "on the click" : "turn on pacer + mic"],
                ["Goal", goal || "–", "pacer speed"],
                ["Next level", nextLevel ?? "Done", nextLevel ? `level ${p.level + 1}` : "mastered"],
              ].map(([k, v, note]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-xs text-muted">{k}</span>
                  <b className="text-lg font-semibold tabular-nums">{v}</b>
                  <span className="text-[11.5px] text-faint">{note}</span>
                </div>
              ))}
            </div>
            <TargetBar value={speed} level={p.level} />
            <div className="flex items-center justify-between text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <StageDot level={p.level} tried={p.attempts > 0} /> {st.name}
                <LevelPips level={p.level} max={CHANGE_LEVELS.length} className="ml-1" />
              </span>
              <Sparkline values={history} />
            </div>
            <div className="min-h-[1.4em] text-[13.5px]">
              {result || (p.attempts ? "" : `First try sets your baseline. Levels count the average of ${RECENT_DRILLS} drills in a row.`)}
            </div>
          </div>
        </div>
        {chordTile(chordA.key)}
        {chordTile(chordB.key)}
      </div>
    </div>
  );
}

const SECTION_TITLE = new Map(TRANSITION_SECTIONS.map(sec => [sec.id, sec.title]));

/** Every pair in learning order. A pair opens once the one before it reaches level 1; any pair you've already drilled stays open. */
function pathOptions(skills: PairSkills): DrillTab<string>[] {
  return ALL_PAIRS.map((p, i) => {
    const prev = ALL_PAIRS[i - 1];
    const own = pairProgress(skills, p.a, p.b);
    const locked = !!prev && own.attempts === 0 && pairProgress(skills, prev.a, prev.b).level < 1;
    return { value: p.key, label: `${p.a} ↔ ${p.b}`, locked, level: own.level, group: SECTION_TITLE.get(p.section) };
  });
}

export default function TransitionsPage() {
  const skills = useProgress().skills;
  const [params, setParams] = useSearchParams();
  const saved = useSettings(s => s.drillPair);
  const setSaved = useSettings(s => s.setDrillPair);

  const options = pathOptions(skills);
  const open = (key: string | undefined) => (key ? options.find(o => o.value === key && !o.locked) : undefined);
  const byKey = (key: string) => ALL_PAIRS.find(p => p.key === key);
  // The pair in the link, else the last one you drilled, else the furthest one open. A locked pair can't be opened.
  const fromUrl = params.get("pair")?.split("|");
  const asked = fromUrl?.length === 2 ? pairKey(fromUrl[0]!, fromUrl[1]!) : undefined;
  const chosen = open(asked) ?? open(pairKey(saved[0], saved[1])) ?? options.filter(o => !o.locked).at(-1)!;
  const pair: Pair = byKey(chosen.value)!;

  const pick = (key: string) => {
    const p = byKey(key);
    if (!p) return;
    setSaved([p.a, p.b]);
    setParams({ pair: `${p.a}|${p.b}` }, { replace: true });
  };
  const sum = summarise(ALL_PAIRS, skills);

  return (
    <>
      <PageHeader title="Transitions" lead={`Switch between two chords for one minute and count the clean changes. Your current speed is the average of your last ${RECENT_DRILLS} drills; hold an average of ${CHANGE_LEVELS.join(" / ")} for levels 1 / 2 / 3.`} />
      <DrillWindow
        value={pair.key}
        options={options}
        onChange={pick}
        path
        unlockHint={`Average ${CHANGE_LEVELS[0]} changes a minute here to unlock the next pair.`}
        footer={
          <>
            <span>
              {sum.mastered} of {sum.total} pairs mastered
            </span>
            <span>Average speed {sum.average}</span>
          </>
        }
      >
        <Drill a={pair.a} b={pair.b} skills={skills} />
      </DrillWindow>

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
        {[...STAGES].reverse().map(s => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <StageDot level={STAGES.indexOf(s) - 1} tried={s.id !== "s0"} /> {s.name}
            {s.hint && ` ${s.hint}`}
          </span>
        ))}
      </div>
    </>
  );
}
