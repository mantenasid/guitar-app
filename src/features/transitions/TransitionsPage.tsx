import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { ALL_CHORDS, CHORD_BY_KEY, TRANSITION_SECTIONS } from "@/content";
import { Fretboard } from "@/components/Fretboard";
import { PageHeader, PlayButton, Section, Sparkline, StageDot, TargetBar, cardClass } from "@/components/ui";
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
  suggestedPairs, summarise, type PairSkills,
} from "@/skills/changes";
import { strumChord } from "@/features/chords/ChordCard";
import { ChangeCounter } from "@/audio/listen/counter";
import { useChordListener } from "@/audio/listen/useChordListener";
import { useInput } from "@/audio/listen/useInput";
import { defaultSource } from "@/audio/listen/listener";
import { recentTiming, timingId, timingScore } from "@/skills/timing";
import { nearTwins } from "@/audio/listen/rivals";
import { ListenPanel } from "@/components/ListenPanel";

function PairChip({ a, b, text, skills, current, onPick }: { a: string; b: string; text: string; skills: PairSkills; current: boolean; onPick: (a: string, b: string) => void }) {
  const p = pairProgress(skills, a, b);
  const speed = p.current ?? 0;
  const st = stageOf(p.level, p.attempts > 0);
  return (
    <button
      type="button"
      onClick={() => onPick(a, b)}
      title={`${a} ↔ ${b}: ${st.name}${speed ? `, current speed ${speed}` : ""}`}
      className={`inline-flex items-center gap-[7px] rounded-full border py-1 pr-[11px] pl-[9px] text-sm font-medium ${
        current ? "border-ink ring-1 ring-ink" : p.level >= CHANGE_LEVELS.length ? "border-good bg-good-soft" : "border-line bg-surface hover:border-line-2"
      }`}
    >
      <StageDot level={p.level} tried={p.attempts > 0} />
      {text}
      {speed > 0 && <b className="text-[12.5px] font-medium tabular-nums text-faint">{speed}</b>}
    </button>
  );
}

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

function Drill({ a, b, onPick, skills }: { a: string; b: string; onPick: (a: string, b: string) => void; skills: PairSkills }) {
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

  const chordOptions = ALL_CHORDS.map(c => <option key={c.key} value={c.key}>{c.key}</option>);
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
    <section className={`${cardClass} no-print mb-14 p-4 sm:p-[22px]`}>
      <div className="mb-[18px] flex flex-wrap items-center gap-2">
        <select aria-label="First chord" value={a} disabled={busy} onChange={e => onPick(e.target.value, b)}>{chordOptions}</select>
        <span className="text-faint">↔</span>
        <select aria-label="Second chord" value={b} disabled={busy} onChange={e => onPick(a, e.target.value)}>{chordOptions}</select>
        <select aria-label="Drill length" className="sm:ml-auto" value={secs} disabled={busy} onChange={e => { setSecs(+e.target.value); setLeft(+e.target.value); }}>
          <option value={60}>1 minute</option>
          <option value={30}>30 s warm-up</option>
        </select>
      </div>

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
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" checked={pacer} onChange={e => setPacer(e.target.checked)} /> Pacer click at goal speed
          </label>
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

      <NextUp skills={skills} a={a} b={b} onPick={onPick} />
    </section>
  );
}

function NextUp({ skills, a, b, onPick }: { skills: PairSkills; a: string; b: string; onPick: (a: string, b: string) => void }) {
  const sum = summarise(ALL_PAIRS, skills);
  const next = suggestedPairs(skills, 3);
  const current = pairKey(a, b);
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[13.5px] text-muted">
      <span>{next.length ? "Next up" : "Every pair is mastered."}</span>
      {next.map(p => (
        <PairChip key={p.key} a={p.a} b={p.b} text={`${p.a} ↔ ${p.b}`} skills={skills} current={p.key === current} onPick={onPick} />
      ))}
      <span className="w-full sm:ml-auto sm:w-auto">
        {sum.mastered} of {sum.total} pairs mastered · average speed {sum.average}
      </span>
    </div>
  );
}

export default function TransitionsPage() {
  const skills = useProgress().skills;
  const [params, setParams] = useSearchParams();
  const saved = useSettings(s => s.drillPair);
  const setSaved = useSettings(s => s.setDrillPair);

  const fromUrl = params.get("pair")?.split("|");
  const [a, b] = fromUrl && fromUrl.length === 2 && CHORD_BY_KEY[fromUrl[0]!] && CHORD_BY_KEY[fromUrl[1]!] ? (fromUrl as [string, string]) : saved;

  const pick = (x: string, y: string) => {
    setSaved([x, y]);
    setParams({ pair: `${x}|${y}` }, { replace: true });
    document.getElementById("drill-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const current = pairKey(a, b);

  return (
    <>
      <div id="drill-top" />
      <PageHeader title="Transitions" lead={`Switch between two chords for one minute and count the clean changes. Your current speed is the average of your last ${RECENT_DRILLS} drills; hold an average of ${CHANGE_LEVELS.join(" / ")} for levels 1 / 2 / 3.`} />
      <Drill a={a} b={b} onPick={pick} skills={skills} />

      {TRANSITION_SECTIONS.map((sec, i) => {
        const pairs = ALL_PAIRS.filter(p => p.section === sec.id);
        const sum = summarise(pairs, skills);
        const lowest = Math.min(...pairs.map(p => pairProgress(skills, p.a, p.b).level));
        return (
          <Section
            key={sec.id}
            num={i + 1}
            title={sec.title}
            aside={
              <span className="flex items-center gap-2.5 text-[13px] text-muted">
                {sum.mastered} of {sum.total} mastered
                <TargetBar value={sum.average} level={lowest} className="w-24" />
              </span>
            }
          >
            <div className="border-t border-line">
              {sec.rows.map(row => (
                <div key={row.label + row.pairs.join()} className="flex flex-col gap-2 border-b border-line px-0.5 py-[11px] sm:flex-row sm:gap-3.5">
                  <div className="min-w-[116px] text-sm font-[550]">
                    {row.label}
                    {row.tag && <small className="block text-xs font-normal text-faint">{row.tag}</small>}
                  </div>
                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {row.pairs.map(([x, y]) => (
                      <PairChip key={x + y} a={x} b={y} text={row.root ? y : `${x} ↔ ${y}`} skills={skills} current={pairKey(x, y) === current} onPick={pick} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        );
      })}

      <div className="mt-10 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
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
