// Chord recall: see a chord name, form the shape, tap the moment it's fretted.
// The time to a clean shape is the skill's score (3 s → 2 s → 1.5 s → 1 s).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CHORD_BY_KEY } from "@/content";
import { Fretboard } from "@/components/Fretboard";
import { LevelPips } from "@/components/LevelPips";
import { PageHeader, PlayButton, cardClass } from "@/components/ui";
import { strumChord } from "@/features/chords/ChordCard";
import * as guitar from "@/audio/guitar";
import { useProgress } from "@/progress/hooks";
import { recordResult } from "@/progress/record";
import { METRICS, SKILLS, formatValue, levelFor } from "@/skills/registry";

const ROUNDS = 5;

type Phase = "ready" | "wait" | "go" | "check" | "done";

interface Round {
  key: string;
  seconds: number;
  clean?: boolean;
}

function pickChords(focus: string | null, unlocked: string[]): string[] {
  if (focus) return Array(ROUNDS).fill(focus);
  const pool = unlocked.length ? unlocked : ["Em"];
  // Avoid the same chord twice in a row when there is a choice.
  const out: string[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    const options = pool.length > 1 ? pool.filter(k => k !== out[i - 1]) : pool;
    out.push(options[Math.floor(Math.random() * options.length)]!);
  }
  return out;
}

export default function RecallGame() {
  const [params] = useSearchParams();
  const focus = params.get("chord");
  const progress = useProgress();
  const unlocked = useMemo(
    () => SKILLS.filter(s => s.kind === "chord" && progress.skills.get(s.id)?.unlocked).map(s => s.id.slice("chord:".length)),
    [progress],
  );

  const [queue, setQueue] = useState<string[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const startAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const index = rounds.length;
  const key = queue[index] ?? focus ?? "Em";
  const chord = CHORD_BY_KEY[key];

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const begin = useCallback(() => {
    clearTimers();
    if (!queue.length || phase === "done") {
      setQueue(pickChords(focus && CHORD_BY_KEY[focus] ? focus : null, unlocked));
      setRounds([]);
    }
    setPhase("wait");
    // A random wait, so you react to the name rather than anticipate it.
    timers.current.push(setTimeout(() => {
      startAt.current = performance.now();
      setElapsed(0);
      setPhase("go");
      guitar.click({ accent: true });
    }, 900 + Math.random() * 1200));
  }, [queue.length, phase, focus, unlocked]);

  const gotIt = useCallback(() => {
    setElapsed((performance.now() - startAt.current) / 1000);
    setPhase("check");
  }, []);

  const judge = useCallback(async (clean: boolean) => {
    const seconds = Math.round(elapsed * 100) / 100;
    const next = [...rounds, { key, seconds, clean }];
    setRounds(next);
    if (clean) await recordResult(`chord:${key}`, seconds);
    if (next.length >= ROUNDS) setPhase("done");
    else setPhase("ready");
  }, [elapsed, rounds, key]);

  // Live clock while waiting for the shape.
  useEffect(() => {
    if (phase !== "go") return;
    let raf = 0;
    const tick = () => {
      setElapsed((performance.now() - startAt.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Space does the obvious thing in every phase; N marks a wrong shape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes((e.target as HTMLElement).tagName) && e.code !== "Space") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (phase === "ready" || phase === "done") begin();
        else if (phase === "go") gotIt();
        else if (phase === "check") void judge(true);
      }
      if (e.code === "KeyN" && phase === "check") void judge(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, begin, gotIt, judge]);

  const skillProgress = progress.skills.get(`chord:${key}`);
  const metric = METRICS.chord;
  const clean = rounds.filter(r => r.clean);
  const best = clean.length ? Math.min(...clean.map(r => r.seconds)) : undefined;

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/path" className="hover:text-ink">Path</Link>}
        title="Chord recall"
        lead="Take your hand off the neck. When a chord name appears, form the shape and tap the moment every finger is down."
      />

      <div className={`${cardClass} mx-auto max-w-[640px] p-5 sm:p-8`}>
        <div className="mb-6 flex items-center justify-between text-[13px] text-muted">
          <span>
            Round {Math.min(index + 1, ROUNDS)} of {ROUNDS}
            {focus && CHORD_BY_KEY[focus] ? ` · ${CHORD_BY_KEY[focus]!.name}` : " · mixed chords you've unlocked"}
          </span>
          <span className="flex gap-1">
            {Array.from({ length: ROUNDS }, (_, i) => (
              <i key={i} className={`size-2 rounded-full ${i < rounds.length ? (rounds[i]!.clean ? "bg-good" : "bg-[var(--s1)]") : "bg-line-2"}`} />
            ))}
          </span>
        </div>

        <div className="flex min-h-[300px] flex-col items-center justify-center gap-5 text-center">
          {phase === "ready" && (
            <>
              <p className="text-muted">{index === 0 ? "Hands off the neck, ready?" : "Shake your hand out, then go again."}</p>
              <button onClick={begin} className="rounded-xl bg-ink px-8 py-3 text-[15px] font-medium text-bg hover:opacity-90">
                {index === 0 ? "Start" : "Next chord"} <span className="ml-1 opacity-60">Space</span>
              </button>
            </>
          )}

          {phase === "wait" && <p className="animate-pulse text-2xl text-faint">Get ready…</p>}

          {phase === "go" && chord && (
            <>
              <div className="text-[72px] font-[650] leading-none tracking-[-0.04em] animate-[pop_0.2s_ease-out]">{chord.key}</div>
              <div className="text-sm text-muted">{chord.name}</div>
              <div className="font-mono text-xl tabular-nums text-muted">{elapsed.toFixed(1)} s</div>
              <button onClick={gotIt} className="rounded-xl bg-accent px-10 py-4 text-[16px] font-semibold text-white hover:opacity-90">
                Got it <span className="ml-1 opacity-70">Space</span>
              </button>
            </>
          )}

          {phase === "check" && chord && (
            <>
              <div className="font-mono text-4xl font-semibold tabular-nums">{elapsed.toFixed(2)} s</div>
              <p className="text-sm text-muted">Check your hand against the diagram. Every string should ring.</p>
              <div className="w-full max-w-[360px]">
                <Fretboard shape={chord.shape} scope="recall" fluid />
                <PlayButton playId="recall" onPlay={() => strumChord(chord, "recall")} label="Hear it" title="Strum the chord" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => void judge(true)} className="rounded-xl bg-good px-6 py-3 font-semibold text-white hover:opacity-90">
                  Clean <span className="ml-1 opacity-70">Space</span>
                </button>
                <button onClick={() => void judge(false)} className="rounded-xl border border-line-2 px-6 py-3 font-medium hover:border-faint">
                  Not quite <span className="ml-1 text-muted">N</span>
                </button>
              </div>
            </>
          )}

          {phase === "done" && (
            <>
              <div className="text-xl font-semibold">Round complete</div>
              <div className="flex flex-wrap justify-center gap-2">
                {rounds.map((r, i) => (
                  <span key={i} className={`rounded-lg px-3 py-1.5 font-mono text-sm ${r.clean ? "bg-good-soft text-good" : "bg-surface-2 text-muted line-through"}`}>
                    {r.key} {r.seconds.toFixed(1)}s
                  </span>
                ))}
              </div>
              {best !== undefined && <p className="text-muted">Fastest clean shape: <b className="text-ink">{best.toFixed(2)} s</b> ({["not yet level 1", "level 1", "level 2", "level 3", "mastered"][levelFor("chord", best)]})</p>}
              <div className="flex gap-2">
                <button onClick={begin} className="rounded-xl bg-ink px-6 py-3 font-medium text-bg hover:opacity-90">Play again</button>
                <Link to="/path" className="rounded-xl border border-line-2 px-6 py-3 font-medium hover:border-faint">Back to path</Link>
              </div>
            </>
          )}
        </div>

        {skillProgress && focus && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[13px] text-muted">
            <span className="inline-flex items-center gap-2">
              <LevelPips level={skillProgress.level} /> {chord?.name}
            </span>
            <span>
              Best {skillProgress.best !== undefined ? formatValue("chord", skillProgress.best) : "–"} · levels at {metric.levels.join(" / ")} s
            </span>
          </div>
        )}
      </div>
    </>
  );
}
