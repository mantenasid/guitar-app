// Walk through a run of notes with the mic checking each one: the next note lights up on the neck
// and only the right pitch moves you on. No tempo, so the shape goes in before speed does.
import { useEffect, useRef, useState } from "react";
import { useInput } from "@/audio/listen/useInput";
import { litId, stopPlayback, usePlayback } from "@/audio/playback";
import type { ShapeNote } from "@/music/shapes";
import { STRING_NAMES } from "@/music/theory";
import { sameNote } from "@/skills/timing";
import { buttonClass } from "./ui";

/** Seconds a note must be held off before the same pitch counts again. */
const REPEAT_GAP = 0.15;

const MIC_TEXT: Record<string, string> = {
  starting: "Opening the microphone…",
  denied: "Microphone blocked. Allow it in the browser's site settings.",
  unsupported: "This browser can't use the microphone.",
  error: "Couldn't open the microphone.",
};

export function NoteWalk({ notes, scope }: { notes: ShapeNote[]; scope: string }) {
  const [on, setOn] = useState(false);
  const [at, setAt] = useState(0);
  const [took, setTook] = useState<number | null>(null);
  const atRef = useRef(0);
  const began = useRef(0);
  /** When the last note was accepted, and whether the pitch has let go of it since. */
  const last = useRef({ time: 0, released: true });

  const status = useInput(on, {
    onPitch: p => {
      const want = notes[atRef.current];
      if (!want) return;
      const now = performance.now() / 1000;
      const prev = notes[atRef.current - 1];
      if (!p || p.clarity < 0.8 || !sameNote(p.hz, want.midi)) {
        if (!p || (prev && !sameNote(p.hz, prev.midi))) last.current.released = true;
        return;
      }
      // The same pitch twice running needs a fresh pluck, not the last one still ringing.
      const repeat = prev !== undefined && prev.midi % 12 === want.midi % 12;
      if (repeat && (!last.current.released || now - last.current.time < REPEAT_GAP)) return;
      last.current = { time: now, released: false };
      if (atRef.current === 0) began.current = now;
      atRef.current++;
      setAt(atRef.current);
      if (atRef.current >= notes.length) {
        setTook(now - began.current);
        setOn(false);
      }
    },
  });

  // Light the note to play next on the diagram.
  const next = on ? notes[at] : undefined;
  useEffect(() => {
    if (!next) return;
    usePlayback.setState({ lit: new Set([litId(scope, next)]) });
    return () => usePlayback.setState({ lit: new Set() });
  }, [next, scope]);

  const toggle = () => {
    if (!on) {
      stopPlayback();
      atRef.current = 0;
      setAt(0);
      setTook(null);
      last.current = { time: 0, released: true };
    }
    setOn(o => !o);
  };

  return (
    <div className="no-print flex flex-col items-center gap-2.5">
      <button type="button" onClick={toggle} className={on ? buttonClass.active : buttonClass.quiet}>
        {on ? "Stop" : took !== null ? "Walk it again" : "Walk through it with the mic"}
      </button>
      {on && status === "listening" && next && (
        <div className="flex w-full max-w-[360px] flex-col gap-1.5 text-center text-[13.5px] text-muted" aria-live="polite">
          <span>
            Play the lit note: <b className="text-ink">{STRING_NAMES[next.s]} string, {next.f === 0 ? "open" : `fret ${next.f}`}</b>
          </span>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-good transition-[width] duration-150 ease-out" style={{ width: `${(at / notes.length) * 100}%` }} />
          </div>
          <span className="text-[12px] text-faint tabular-nums">
            {at} of {notes.length}
          </span>
        </div>
      )}
      {on && status !== "listening" && MIC_TEXT[status] && <span className="text-[13px] text-muted">{MIC_TEXT[status]}</span>}
      {!on && took !== null && (
        <span className="text-[13.5px] text-good" aria-live="polite">
          Every note right, in {took.toFixed(1)} s. Now put it to the click.
        </span>
      )}
      {!on && took === null && <span className="text-[12.5px] text-faint">No tempo: each right note lights the next one.</span>}
    </div>
  );
}
