import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { ALL_CHORDS, CHORD_BY_KEY, TRANSITION_SECTIONS } from "@/content";
import { Fretboard } from "@/components/Fretboard";
import { PageHeader, PlayButton, Section, Sparkline, StageDot, TargetBar, cardClass } from "@/components/ui";
import { formatDuration } from "@/components/AppShell";
import * as guitar from "@/audio/guitar";
import { recordAttempt } from "@/progress/db";
import { useBests, useHistory } from "@/progress/hooks";
import { useSettings } from "@/progress/settings";
import {
  ALL_PAIRS, CHANGE_TARGET, DRILL_SECONDS, STAGES, bestFor, changeSkillId, drillFeedback, nextGoal, pairKey, stageOf, suggestedPairs, summarise,
  type Bests,
} from "@/skills/changes";
import { strumChord } from "@/features/chords/ChordCard";

function PairChip({ a, b, text, bests, current, onPick }: { a: string; b: string; text: string; bests: Bests; current: boolean; onPick: (a: string, b: string) => void }) {
  const best = bestFor(bests, a, b);
  const st = stageOf(best);
  return (
    <button
      type="button"
      onClick={() => onPick(a, b)}
      title={`${a} ↔ ${b}: ${st.name}${best ? `, best ${best}` : ""}`}
      className={`inline-flex items-center gap-[7px] rounded-full border py-1 pr-[11px] pl-[9px] text-sm font-medium ${
        current ? "border-ink ring-1 ring-ink" : best >= CHANGE_TARGET ? "border-good bg-good-soft" : "border-line bg-surface hover:border-line-2"
      }`}
    >
      <StageDot value={best} />
      {text}
      {best > 0 && <b className="text-[12.5px] font-medium tabular-nums text-faint">{best}</b>}
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

function Drill({ a, b, onPick, bests }: { a: string; b: string; onPick: (a: string, b: string) => void; bests: Bests }) {
  const [secs, setSecs] = useState(DRILL_SECONDS);
  const [run, setRun] = useState<Run | null>(null);
  const [left, setLeft] = useState(DRILL_SECONDS);
  const [pacer, setPacer] = useState(false);
  const [result, setResult] = useState("");
  const runRef = useRef(run);
  runRef.current = run;

  const best = bestFor(bests, a, b);
  const goal = nextGoal(best);
  const st = stageOf(best);
  const history = useHistory(changeSkillId(a, b)).map(h => h.value);
  const chordA = CHORD_BY_KEY[a]!;
  const chordB = CHORD_BY_KEY[b]!;

  useEffect(() => setResult(""), [a, b]);

  const finish = useCallback(async (r: Run) => {
    // Clear the ref straight away so the countdown can't save the same run twice.
    runRef.current = null;
    setRun(null);
    setLeft(r.secs);
    guitar.beep({ hz: 660, dur: 0.5 });
    if (r.secs !== DRILL_SECONDS) {
      setResult(`Warm-up: ${r.count} in ${r.secs}s (about ${Math.round((r.count * 60) / r.secs)} a minute). Warm-ups don't count.`);
      return;
    }
    const previous = bestFor(bests, r.a, r.b);
    await recordAttempt(changeSkillId(r.a, r.b), r.count);
    setResult(drillFeedback(r.count, previous));
  }, [bests]);

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
    const pace = pacer ? setInterval(() => guitar.click(), 60000 / rate) : undefined;
    return () => {
      clearInterval(tick);
      if (pace) clearInterval(pace);
    };
  }, [run !== null, pacer, goal, finish]);

  const add = (n: number) => setRun(r => (r ? { ...r, count: Math.max(0, r.count + n) } : r));

  useEffect(() => {
    if (!run) return;
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === "Space") { e.preventDefault(); add(1); }
      if (e.code === "Backspace") { e.preventDefault(); add(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run !== null]);

  const start = () => {
    if (run) {
      setRun(null);
      setLeft(secs);
      return;
    }
    setResult("");
    setRun({ a, b, secs, end: Date.now() + secs * 1000, count: 0 });
    setLeft(secs);
    guitar.beep({ hz: 880, dur: 0.15 });
  };

  const chordOptions = ALL_CHORDS.map(c => <option key={c.key} value={c.key}>{c.key}</option>);
  const chordTile = (key: string) => {
    const c = CHORD_BY_KEY[key]!;
    const playId = `drill:${key}`;
    return (
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center justify-between text-[17px] font-[620] tracking-[-0.01em]">
          {c.name}
          <PlayButton playId={playId} onPlay={() => strumChord(c, playId)} title={`Strum ${c.name}`} />
        </div>
        <Fretboard shape={c.shape} scope={playId} fluid className="max-w-[440px]" />
      </div>
    );
  };

  return (
    <section className={`${cardClass} no-print mb-14 p-4 sm:p-[22px]`}>
      <div className="mb-[18px] flex flex-wrap items-center gap-2">
        <select aria-label="First chord" value={a} disabled={!!run} onChange={e => onPick(e.target.value, b)}>{chordOptions}</select>
        <span className="text-faint">↔</span>
        <select aria-label="Second chord" value={b} disabled={!!run} onChange={e => onPick(a, e.target.value)}>{chordOptions}</select>
        <select aria-label="Drill length" className="sm:ml-auto" value={secs} disabled={!!run} onChange={e => { setSecs(+e.target.value); setLeft(+e.target.value); }}>
          <option value={60}>1 minute</option>
          <option value={30}>30 s warm-up</option>
        </select>
      </div>

      <div className="grid grid-cols-2 items-start gap-3 sm:gap-6 lg:grid-cols-[1fr_1fr_260px]">
        <div className="col-span-2 flex flex-col gap-2.5 lg:order-last lg:col-span-1">
          <div className="flex items-baseline justify-between">
            <span>
              <strong className="text-[56px] font-[650] leading-none tracking-[-0.04em] tabular-nums">{run?.count ?? 0}</strong>
              <small className="ml-1.5 text-[13px] text-muted">changes</small>
            </span>
            <span className="text-xl tabular-nums text-muted">{formatDuration(Math.max(0, Math.ceil(left)))}</span>
          </div>
          <button onClick={start} className="w-full rounded-[10px] bg-ink py-[11px] text-[14.5px] font-medium text-bg hover:opacity-90">
            {run ? "Stop" : "Start one minute"}
          </button>
          <div className="flex gap-1.5">
            <button disabled={!run} onClick={() => add(1)} className="flex-1 rounded-[9px] border border-line-2 bg-surface py-[7px] text-[13.5px] disabled:opacity-35">
              +1 <span className="text-muted">Space</span>
            </button>
            <button disabled={!run} onClick={() => add(-1)} title="Take one back (Backspace)" className="rounded-[9px] border border-line-2 bg-surface px-3.5 text-[13.5px] disabled:opacity-35">
              −1
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" checked={pacer} onChange={e => setPacer(e.target.checked)} /> Pacer click at goal speed
          </label>
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <div className="grid grid-cols-3 gap-1.5">
              {[["Best", best || "–"], ["Goal", goal || "–"], ["Target", CHANGE_TARGET]].map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-xs text-muted">{k}</span>
                  <b className="text-lg font-semibold tabular-nums">{v}</b>
                </div>
              ))}
            </div>
            <TargetBar value={best} />
            <div className="flex items-center justify-between text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5"><StageDot value={best} /> {st.name}</span>
              <Sparkline values={history} />
            </div>
            <div className="min-h-[1.4em] text-[13.5px]">{result || (best ? "" : "First try sets your baseline.")}</div>
          </div>
        </div>
        {chordTile(chordA.key)}
        {chordTile(chordB.key)}
      </div>

      <NextUp bests={bests} a={a} b={b} onPick={onPick} />
    </section>
  );
}

function NextUp({ bests, a, b, onPick }: { bests: Bests; a: string; b: string; onPick: (a: string, b: string) => void }) {
  const sum = summarise(ALL_PAIRS, bests);
  const next = suggestedPairs(bests, 3);
  const current = pairKey(a, b);
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[13.5px] text-muted">
      <span>{next.length ? "Next up" : `Every pair is at ${CHANGE_TARGET}.`}</span>
      {next.map(p => (
        <PairChip key={p.key} a={p.a} b={p.b} text={`${p.a} ↔ ${p.b}`} bests={bests} current={p.key === current} onPick={onPick} />
      ))}
      <span className="w-full sm:ml-auto sm:w-auto">
        {sum.mastered} of {sum.total} pairs at {CHANGE_TARGET} · average {sum.average}
      </span>
    </div>
  );
}

export default function TransitionsPage() {
  const bests = useBests();
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
      <PageHeader title="Transitions" lead={`Switch between two chords for one minute and count the clean changes. Build every pair up to ${CHANGE_TARGET}.`} />
      <Drill a={a} b={b} onPick={pick} bests={bests} />

      {TRANSITION_SECTIONS.map((sec, i) => {
        const sum = summarise(ALL_PAIRS.filter(p => p.section === sec.id), bests);
        return (
          <Section
            key={sec.id}
            num={i + 1}
            title={sec.title}
            aside={
              <span className="flex items-center gap-2.5 text-[13px] text-muted">
                {sum.mastered} of {sum.total} at {CHANGE_TARGET}
                <TargetBar value={sum.average} className="w-24" />
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
                      <PairChip key={x + y} a={x} b={y} text={row.root ? y : `${x} ↔ ${y}`} bests={bests} current={pairKey(x, y) === current} onPick={pick} />
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
            <StageDot value={s.min} /> {s.name}
            {s.min ? ` ${s.min}+` : ""}
          </span>
        ))}
      </div>
    </>
  );
}
