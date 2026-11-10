// Note finder: name the highlighted fretboard note as many times as you can in a minute.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Fretboard } from "@/components/Fretboard";
import { LevelPips } from "@/components/LevelPips";
import { DrillTitle, DrillWindow } from "@/components/DrillWindow";
import { drillOptions } from "@/components/DrillTabs";
import { PageHeader } from "@/components/ui";
import { hzToNote } from "@/audio/listen/pitch";
import { usePitch } from "@/audio/listen/useInput";
import { NOTE_FRETS, NOTE_SETS, NOTE_SET_BY_ID } from "@/content/fretboard";
import type { Shape } from "@/content/types";
import { NOTE_NAMES, noteAt } from "@/music/theory";
import { useProgress } from "@/progress/hooks";
import { recordResult } from "@/progress/record";
import { METRICS, formatValue } from "@/skills/registry";
import { nextSpot, type Spot } from "./notes";

const ROUND_SECONDS = 60;
const NATURALS = NOTE_NAMES.filter(n => !n.includes("#"));

type Phase = "ready" | "playing" | "done";

function shapeFor(spot: Spot | null): Shape {
  const base = { startFret: 1, frets: NOTE_FRETS, nut: true };
  if (!spot) return { ...base, dots: [] };
  return spot.f === 0 ? { ...base, open: [spot.s], dots: [] } : { ...base, dots: [{ s: spot.s, f: spot.f, label: "?" }] };
}

export default function FretboardPage() {
  const [params, setParams] = useSearchParams();
  const progress = useProgress();
  const unlocked = NOTE_SETS.filter(s => progress.skills.get(`note:${s.id}`)?.unlocked);
  // A locked set can't be opened, even from a link; fall back to the furthest one you've reached.
  const asked = NOTE_SET_BY_ID[params.get("set") ?? ""];
  const set = (asked && unlocked.includes(asked) ? asked : unlocked.at(-1)) ?? NOTE_SETS[0]!;
  const skill = progress.skills.get(`note:${set.id}`);

  const [phase, setPhase] = useState<Phase>("ready");
  const [spot, setSpot] = useState<Spot | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [flash, setFlash] = useState<{ note: string; ok: boolean } | null>(null);
  const [byEar, setByEar] = useState(false);
  const endsAt = useRef(0);

  const answerNote = spot ? noteAt(spot.s, spot.f) : null;
  const buttons = set.naturals ? NATURALS : NOTE_NAMES;

  const start = () => {
    setCorrect(0);
    setWrong(0);
    setFlash(null);
    setSpot(nextSpot(set, null));
    endsAt.current = Date.now() + ROUND_SECONDS * 1000;
    setLeft(ROUND_SECONDS);
    setPhase("playing");
  };

  // Countdown; saves the score when time runs out.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      const secs = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setLeft(secs);
      if (secs === 0) setPhase("done");
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  const saved = useRef(false);
  useEffect(() => {
    if (phase === "playing") saved.current = false;
    if (phase === "done" && !saved.current) {
      saved.current = true;
      void recordResult(`note:${set.id}`, correct);
    }
  }, [phase, correct, set.id]);

  const answer = (note: string) => {
    if (phase !== "playing" || !answerNote) return;
    const ok = note === answerNote;
    setFlash({ note, ok });
    if (ok) {
      setCorrect(c => c + 1);
      setSpot(s => nextSpot(set, s));
    } else setWrong(w => w + 1);
  };

  // Answer by playing: the note heard (any octave) counts once it matches.
  const { status, pitch } = usePitch(byEar && phase === "playing");
  const heard = pitch ? hzToNote(pitch.hz).note : null;
  const answerRef = useRef(answer);
  answerRef.current = answer;
  useEffect(() => {
    if (heard && heard === answerNote) answerRef.current(heard);
  }, [heard, answerNote]);

  const metric = METRICS.note;

  return (
    <>
      <PageHeader title="Note finder" lead="Name the highlighted note as many times as you can in a minute. Natural notes first, then sharps, then more strings." />
      <DrillWindow
        value={set.id}
        options={drillOptions(progress, NOTE_SETS, s => `note:${s.id}`)}
        onChange={id => {
          setPhase("ready");
          setSpot(null);
          setParams({ set: id });
        }}
        path
        unlockHint={`Name ${metric.levels[0]} notes in a minute here to unlock the next set.`}
        footer={
          <>
            <span className="inline-flex items-center gap-2">
              <LevelPips level={skill?.level ?? 0} /> {set.title}
            </span>
            <span>
              Best {skill?.best !== undefined ? formatValue("note", skill.best) : "–"} · levels at {metric.levels.join(" / ")} a minute
            </span>
          </>
        }
      >
        <div>
          <DrillTitle title={set.title} sub="Name the lit note. One minute on the clock." />
          <div className="mb-5 flex justify-center gap-10 text-center text-[12.5px] text-muted">
            <span>
              <b className="block text-[36px] font-[650] leading-none tracking-[-0.03em] tabular-nums text-ink">{left}</b> seconds
            </span>
            <span>
              <b className="block text-[36px] font-[650] leading-none tracking-[-0.03em] tabular-nums text-good">{correct}</b> right
            </span>
            <span>
              <b className="block text-[36px] font-[650] leading-none tracking-[-0.03em] tabular-nums text-ink-2">{wrong}</b> wrong
            </span>
          </div>

          <div className="overflow-x-auto">
            <Fretboard shape={shapeFor(phase === "playing" ? spot : null)} scope="note-finder" />
          </div>

          {phase === "playing" ? (
            <div className={`mt-6 grid grid-cols-4 gap-2 ${set.naturals ? "sm:grid-cols-7" : "sm:grid-cols-6"}`}>
              {buttons.map(n => (
                <button
                  key={n}
                  onClick={() => answer(n)}
                  className={`rounded-xl border px-3 py-4 text-[18px] font-[600] transition duration-200 ease-in-out ${
                    flash?.note === n
                      ? flash.ok
                        ? "border-good bg-good-soft text-good"
                        : "border-line-2 bg-surface-2 text-muted"
                      : "border-line hover:border-line-2 hover:bg-surface-2"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-7 flex flex-col items-center gap-3">
              {phase === "done" && (
                <span className="text-[15px] font-[550] text-ink">
                  {correct} right in a minute{wrong ? `, ${wrong} wrong` : ""}.
                </span>
              )}
              <button onClick={start} className="h-14 w-full max-w-[300px] rounded-full bg-ink text-[16px] font-[600] text-bg transition duration-200 ease-in-out hover:opacity-90">
                {phase === "done" ? "Go again" : "Start"}
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 text-[13.5px] text-muted">
                <input type="checkbox" checked={byEar} onChange={e => setByEar(e.target.checked)} />
                Answer by playing the note on your guitar
              </label>
            </div>
          )}
          {byEar && phase === "playing" && status !== "listening" && <p className="mt-3 text-[13px] text-muted">Microphone: {status}</p>}
        </div>
      </DrillWindow>
    </>
  );
}
