// Ear training: ten questions a round, from major or minor up to hearing chord changes.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { LevelPips } from "@/components/LevelPips";
import { DrillWindow } from "@/components/DrillWindow";
import { drillOptions } from "@/components/DrillTabs";
import { PageHeader } from "@/components/ui";
import { now, strum } from "@/audio/guitar";
import { playScheduled, stopPlayback } from "@/audio/playback";
import { CHORD_BY_KEY } from "@/content";
import { EAR_STAGES, EAR_STAGE_BY_ID } from "@/content/ear";
import { chordVoicing } from "@/music/shapes";
import { useProgress } from "@/progress/hooks";
import { recordResult } from "@/progress/record";
import { METRICS, formatValue } from "@/skills/registry";
import { ROUND_LENGTH, makeRound, scorePercent, type EarQuestion, type PoolChord } from "./quiz";

/** Open chords for "name the chord", in the order they're learned. */
const OPEN_CHORDS = ["Em", "Am", "E", "A", "D", "G", "C", "Dm"];
const MIN_POOL = 3;

type Phase = "ready" | "playing" | "done";

/** Strum each chord in turn, a little over a second apart. */
function playChords(chords: number[][]) {
  playScheduled(() => {
    const t = now() + 0.05;
    chords.forEach((midis, i) => strum(midis, { when: t + i * 1.3 }));
  });
}

export default function EarPage() {
  const [params, setParams] = useSearchParams();
  const progress = useProgress();
  const unlocked = EAR_STAGES.filter(s => progress.skills.get(`ear:${s.id}`)?.unlocked);
  const stage = EAR_STAGE_BY_ID[params.get("stage") ?? ""] ?? unlocked.at(-1) ?? EAR_STAGES[0]!;
  const skillId = `ear:${stage.id}`;
  const skill = progress.skills.get(skillId);

  // Chords you can play, padded with the next open chords so there's always a choice.
  const known = OPEN_CHORDS.filter(k => progress.skills.get(`chord:${k}`)?.unlocked);
  const poolKeys = known.length >= MIN_POOL ? known : OPEN_CHORDS.slice(0, MIN_POOL);
  const poolId = poolKeys.join(",");
  const pool = useMemo<PoolChord[]>(() => poolId.split(",").map(key => ({ key, midis: chordVoicing(CHORD_BY_KEY[key]!.shape).map(n => n.midi) })), [poolId]);

  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState<EarQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = round[index];

  const start = () => {
    const next = makeRound(stage.id, Math.random, pool);
    setRound(next);
    setIndex(0);
    setRight(0);
    setPicked(null);
    setPhase("playing");
    playChords(next[0]!.chords);
  };

  const answer = (choice: string) => {
    if (!q || picked) return;
    setPicked(choice);
    if (choice === q.answer) setRight(r => r + 1);
  };

  const next = () => {
    setPicked(null);
    if (index + 1 >= round.length) return setPhase("done");
    setIndex(index + 1);
    playChords(round[index + 1]!.chords);
  };

  const saved = useRef(false);
  const percent = scorePercent(right, ROUND_LENGTH);
  useEffect(() => {
    if (phase === "playing") saved.current = false;
    if (phase === "done" && !saved.current) {
      saved.current = true;
      void recordResult(skillId, percent);
    }
  }, [phase, percent, skillId]);

  useEffect(() => stopPlayback, []);

  const locked = !skill?.unlocked;
  const choiceClass = (c: string) => {
    if (!picked || !q) return "border-line hover:border-line-2 hover:bg-surface-2";
    if (c === q.answer) return "border-good bg-good-soft text-good";
    if (c === picked) return "border-line-2 bg-surface-2 text-muted line-through";
    return "border-line text-faint";
  };

  return (
    <>
      <PageHeader title="Ear training" lead="Ten questions a round. Hear major from minor, then chord qualities, then name your own chords and the changes between them." />
      <DrillWindow
        value={stage.id}
        options={drillOptions(progress, EAR_STAGES, s => `ear:${s.id}`)}
        onChange={id => {
          stopPlayback();
          setPhase("ready");
          setParams({ stage: id });
        }}
        footer={
          <>
            <span className="inline-flex items-center gap-2">
              <LevelPips level={skill?.level ?? 0} /> {stage.title}
            </span>
            <span>
              Best {skill?.best !== undefined ? formatValue("ear", skill.best) : "–"} · levels at {METRICS.ear.levels.join(" / ")}%
            </span>
          </>
        }
      >
        <div className="p-5 sm:p-6">
          <div className="mb-4">
            <div className="text-base font-[620] tracking-[-0.01em]">{stage.title}</div>
            <div className="text-[13px] text-muted">{stage.id === "chords" ? `From ${poolKeys.join(", ")}` : stage.tag}</div>
          </div>
          <p className="text-[14px] text-ink-2">{stage.tip}</p>

          {phase === "playing" && q ? (
            <div className="mt-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[13.5px] text-muted">
                <span>
                  Question <b className="tabular-nums text-ink">{index + 1}</b> of {round.length} · <b className="tabular-nums text-good">{right}</b> right
                </span>
                <button
                  onClick={() => playChords(q.chords)}
                  className="rounded-lg border border-line px-3 py-1.5 text-[13.5px] font-[560] transition hover:border-line-2 hover:bg-surface-2"
                >
                  ↻ Play again
                </button>
              </div>
              <div className={`grid gap-2 ${q.choices.length > 4 ? "grid-cols-4" : q.choices.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {q.choices.map(c => (
                  <button key={c} onClick={() => answer(c)} disabled={!!picked} className={`rounded-lg border px-3 py-3 text-[15px] font-[600] transition ${choiceClass(c)}`}>
                    {c}
                  </button>
                ))}
              </div>
              {picked && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[14px]">
                  <span className={picked === q.answer ? "text-good" : "text-ink-2"}>
                    {picked === q.answer ? "Right" : `It was ${q.answer}`}: {q.reveal}
                  </span>
                  {picked !== q.answer && (
                    <button onClick={() => playChords(q.chords)} className="rounded-lg border border-line px-3 py-1.5 text-[13.5px] transition hover:bg-surface-2">
                      Hear it again
                    </button>
                  )}
                  <button onClick={next} className="ml-auto rounded-lg bg-ink px-4 py-2 text-[14px] font-[600] text-bg">
                    {index + 1 >= round.length ? "See score" : "Next"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button onClick={start} disabled={locked} className="rounded-lg bg-ink px-5 py-2.5 text-[15px] font-[600] text-bg disabled:opacity-40">
                {phase === "done" ? "Go again" : "Start"}
              </button>
              {locked && <span className="text-[14px] text-muted">Score {METRICS.ear.levels[0]}% on the stage before to open this one.</span>}
              {phase === "done" && (
                <span className="text-[14px] text-muted">
                  {right} of {ROUND_LENGTH} right: {percent}%.
                </span>
              )}
            </div>
          )}
        </div>
      </DrillWindow>
    </>
  );
}
