// A tempo ladder: play in time at one tempo, pass it, and the tempo steps up a notch.
// With the mic on, the app hears whether your notes landed; without it, you say so yourself.
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as guitar from "@/audio/guitar";
import { defaultSource } from "@/audio/listen/listener";
import { startMetronome } from "@/audio/metronome";
import { useInput } from "@/audio/listen/useInput";
import { stopPlayback } from "@/audio/playback";
import { useProgress } from "@/progress/hooks";
import { recordResult } from "@/progress/record";
import { useSettings } from "@/progress/settings";
import { METRICS, SKILLS, kindOf, maxLevel } from "@/skills/registry";
import { landedScore, withHalves, type Landed } from "@/skills/timing";
import { LevelPips } from "./LevelPips";
import { buttonClass } from "./ui";

/** What a drill's backing loop is given to run with. */
export interface DrillLoop {
  /** The tempo now; read it again every bar so steps up apply as you play. */
  bpm: () => number;
  /** True while the mic is judging, so backing sound it would pick up should stay silent. */
  quiet: () => boolean;
  /** Report each note the player should land, by its time on the audio clock. */
  expect: (when: number) => void;
}

const STEP = 4;
const MIN_BPM = 40;
const MAX_BPM = 200;
/** Percent of notes landed that passes a tempo. */
const PASS = 80;
/** Below this over a long stretch, the tempo is too fast for now. */
const STRUGGLE = 50;
/** Where a first try starts: under the first level, so there's a tempo to pass on day one. */
const FIRST_BPM = 52;

const clamp = (bpm: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, bpm));

const MIC_TEXT: Record<string, string> = {
  starting: "Opening the microphone…",
  denied: "Microphone blocked. Allow it in the browser's site settings, or mark tempos yourself.",
  unsupported: "This browser can't use the microphone, so mark tempos yourself.",
  error: "Couldn't open the microphone, so mark tempos yourself.",
};

interface Props {
  skillId: string;
  hint: string;
  /** Starts the backing (metronome, strum loop…) and returns how to stop it. */
  start: (loop: DrillLoop) => () => void;
  /** Called when the backing stops, to clear any highlight. */
  onStop?: () => void;
  /** Notes in a row to land for a pass. */
  need?: number;
  /** One note per click may also be played two to the click. */
  halves?: boolean;
  /** Passing saves nothing until the skill is unlocked. */
  locked?: boolean;
  /** Extra settings for this drill, such as the chord to strum. */
  controls?: ReactNode;
  /** Each note the mic hears, by its time on the audio clock. */
  onHeard?: (when: number) => void;
}

export function TempoDrill({ skillId, hint, start, onStop, need = 16, halves = false, locked = false, controls, onHeard }: Props) {
  const kind = kindOf(skillId);
  const metric = METRICS[kind];
  const progress = useProgress();
  const p = progress.skills.get(skillId);
  const level = p?.level ?? 0;
  const max = maxLevel(kind);
  const unlocks = SKILLS.filter(s => s.requires.includes(skillId) && s.kind === kind);

  const micScore = useSettings(s => s.micScore);
  const setMicScore = useSettings(s => s.setMicScore);
  const [bpm, setBpm] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState<Landed | null>(null);
  const [played, setPlayed] = useState(0);
  const [note, setNote] = useState("");

  // Progress loads a moment after the page, so the starting tempo waits for it: one step past your best.
  const tempo = bpm ?? (p?.best !== undefined ? clamp(p.best + (level >= max ? 0 : STEP)) : FIRST_BPM);
  const tempoRef = useRef(tempo);
  tempoRef.current = tempo;
  const due = useRef<number[]>([]);
  const heard = useRef<number[]>([]);
  const startRef = useRef(start);
  startRef.current = start;
  const stopRef = useRef(onStop);
  stopRef.current = onStop;

  const status = useInput(running && micScore, {
    onStrum: t => {
      heard.current.push(t);
      onHeard?.(t);
    },
  });
  const judging = running && micScore && status === "listening";
  const judgingRef = useRef(judging);
  judgingRef.current = judging;

  useEffect(() => {
    if (!running) return;
    stopPlayback();
    due.current = [];
    heard.current = [];
    setLive(null);
    setPlayed(0);
    const stop = startRef.current({
      bpm: () => tempoRef.current,
      quiet: () => judgingRef.current && defaultSource() === "mic",
      expect: when => due.current.push(when),
    });
    return () => {
      stop();
      stopRef.current?.();
    };
  }, [running]);

  const pass = (at: number) => {
    due.current = [];
    heard.current = [];
    setLive(null);
    setPlayed(0);
    const next = clamp(at + STEP);
    setBpm(next);
    setNote(locked ? `Clean at ${at}. It will count once this is unlocked.` : next > at ? `Clean at ${at} BPM, saved. Now try ${next}.` : `Clean at ${at} BPM, saved.`);
    if (!locked) void recordResult(skillId, at);
  };
  const passRef = useRef(pass);
  passRef.current = pass;

  // Four times a second, look at the notes that have come due and what the mic heard over them.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const now = guitar.now();
      const ready = due.current.filter(t => t < now - 0.2);
      setPlayed(ready.length);
      if (!judgingRef.current) return setLive(null);
      const recent = ready.slice(-need);
      if (!recent.length) return;
      const strums = heard.current.filter(t => t >= recent[0]! - 0.05);
      const grid = halves && strums.length > recent.length * 1.5 ? withHalves(recent) : recent;
      const score = landedScore(strums, grid);
      setLive(score);
      if (!score || recent.length < need) return;
      if (score.percent >= PASS) passRef.current(tempoRef.current);
      else if (ready.length >= need * 2 && score.percent < STRUGGLE && tempoRef.current > MIN_BPM) {
        setNote(`Too quick for now. Drop to ${clamp(tempoRef.current - STEP * 2)} and build back up.`);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [running, need, halves]);

  const step = (by: number) => {
    setBpm(clamp(tempo + by));
    setNote("");
  };
  const toggle = () => {
    setNote("");
    setRunning(r => !r);
  };

  const round = "grid size-11 shrink-0 place-items-center rounded-full text-[22px] leading-none text-muted transition duration-200 ease-in-out hover:bg-surface-2 hover:text-ink disabled:opacity-30";
  const passing = !!live && live.percent >= PASS;

  return (
    <div className="no-print mx-auto flex max-w-[820px] flex-col gap-5 px-5 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:justify-between">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Slower" onClick={() => step(-STEP)} disabled={tempo <= MIN_BPM} className={round}>
            −
          </button>
          <div className="w-[104px] text-center leading-none">
            <strong key={tempo} className="block animate-[pop_0.2s_ease-out] text-[48px] font-[650] tracking-[-0.04em] tabular-nums">{tempo}</strong>
            <span className="text-[12px] tracking-wide text-muted">BPM</span>
          </div>
          <button type="button" aria-label="Faster" onClick={() => step(STEP)} disabled={tempo >= MAX_BPM} className={round}>
            +
          </button>
        </div>

        <button
          type="button"
          onClick={toggle}
          className={`h-14 min-w-[200px] flex-1 rounded-full text-[16px] font-[600] transition duration-200 ease-in-out sm:max-w-[300px] ${running ? "bg-accent-soft text-accent" : "bg-ink text-bg hover:opacity-90"}`}
        >
          {running ? "Stop" : "Start"}
        </button>

        <div className="flex min-w-[120px] flex-col items-center gap-1.5 text-[13px] text-muted sm:items-end">
          <LevelPips level={level} max={max} />
          <span>{p?.best !== undefined ? `Best ${p.best} BPM` : "Not tried yet"}</span>
        </div>
      </div>

      {running && (
        <div className="flex flex-col gap-2" aria-live="polite">
          {judging ? (
            <>
              <div className="flex items-baseline justify-between text-[13.5px] text-muted">
                <span>
                  Notes landed · {Math.min(played, need)} of {need}
                </span>
                <b className={`text-[20px] font-[650] tabular-nums ${passing ? "text-good" : "text-ink"}`}>{live ? `${live.percent}%` : "…"}</b>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-2">
                <span className={`block h-full rounded-full transition-[width] duration-200 ease-in-out ${passing ? "bg-good" : "bg-accent"}`} style={{ width: `${live?.percent ?? 0}%` }} />
                <i className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${PASS}%` }} title={`${PASS}% passes this tempo`} />
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13.5px] text-muted">{(micScore && MIC_TEXT[status]) || "Play it through, then say whether it was clean."}</span>
              <button type="button" disabled={played < need} onClick={() => pass(tempo)} title={played < need ? `Play ${need} notes first` : "Save this tempo and step up"} className={buttonClass.good}>
                {played < need ? `${played} of ${need} notes` : `Clean at ${tempo}`}
              </button>
            </div>
          )}
        </div>
      )}

      {note && (
        <p className="text-center text-[14.5px] font-[550] text-ink" aria-live="polite">
          {note}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 border-t border-line pt-4 text-[13.5px] text-muted">
        <label className="inline-flex cursor-pointer items-center gap-2" title={micScore ? "The mic hears whether your notes land, and the tempo steps up by itself" : "You decide when a tempo was clean"}>
          <input type="checkbox" checked={micScore} onChange={e => setMicScore(e.target.checked)} /> Mic keeps score
        </label>
        {controls}
      </div>

      <p className="text-center text-[12.5px] text-faint">
        {hint} Land {PASS}% of the notes and the tempo steps up {STEP}. Levels at {metric.levels.join(" / ")} BPM.
        {unlocks.length > 0 && level < 1 && ` Pass ${metric.levels[0]} to unlock ${unlocks.map(s => s.title).join(" and ")}.`}
      </p>
    </div>
  );
}

/** A tempo ladder over a plain metronome: one note to the click, or two. */
export function ClickDrill(props: Omit<Props, "start" | "halves">) {
  return <TempoDrill {...props} halves start={loop => startMetronome(loop.bpm, (_, when) => loop.expect(when))} />;
}
