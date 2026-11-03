import { useEffect, useMemo, useRef, useState } from "react";
import { CHORD_BY_KEY } from "@/content";
import { chordVoicing } from "@/music/shapes";
import { useSettings } from "@/progress/settings";
import { DEFAULT_MATCH, LEARNED_MATCH, averageChroma, chordTemplate, matchChord, type Candidate, type Chroma } from "./chroma";
import { ChordListener, type Source } from "./listener";
import { usePrints } from "./prints";

export type ListenStatus = "off" | "starting" | "listening" | "denied" | "unsupported" | "error";

/** In development, `?listen=synth` analyses the app's own synth instead of the mic. */
const source = (): Source =>
  import.meta.env.DEV && new URLSearchParams(location.search).get("listen") === "synth" ? "synth" : "mic";

export function theoryCandidates(keys: string[]): Candidate[] {
  return keys.filter(k => CHORD_BY_KEY[k]).map(k => ({ id: k, template: chordTemplate(chordVoicing(CHORD_BY_KEY[k]!.shape).map(n => n.midi)) }));
}

/** Teaching: frames to skip while the strum's attack settles, then frames to average. */
const TEACH_SKIP = 3;
const TEACH_KEEP = 14;
const TEACH_TIMEOUT_MS = 8000;

interface Options {
  /** Use theory templates even when learned ones exist (when comparing against many chords). */
  theoryOnly?: boolean;
  /** Called when a new strum starts (a sudden jump in loudness). */
  onStrum?: () => void;
}

/** A strum: loudness jumps this many dB above the last few frames… */
const STRUM_RISE_DB = 6;
/** …and at least this long after the previous one. */
const STRUM_GAP_MS = 200;

/**
 * Listens for the given chords while the user has listening switched on.
 * Calls `onLabel` every frame with the chord heard, or null for silence/unclear.
 * When every chord has been taught on this guitar, its learned sound is used.
 */
export function useChordListener(keys: string[], onLabel?: (label: string | null) => void, opts: Options = {}) {
  const { on, gate } = useSettings(s => s.listen);
  const setListen = useSettings(s => s.setListen);
  const prints = usePrints(s => s.prints);
  const savePrint = usePrints(s => s.save);
  const [status, setStatus] = useState<ListenStatus>("off");
  const [level, setLevel] = useState(-100);
  const [heard, setHeard] = useState<string | null>(null);
  const [teaching, setTeaching] = useState<string | null>(null);
  const [teachNote, setTeachNote] = useState("");

  const keyList = keys.join("|");
  const allLearned = !opts.theoryOnly && keys.length > 0 && keys.every(k => prints[k]);
  const { candidates, match } = useMemo(() => {
    const list = keyList.split("|");
    return allLearned
      ? { candidates: list.map(k => ({ id: k, template: Float32Array.from(prints[k]!) })), match: LEARNED_MATCH }
      : { candidates: theoryCandidates(list), match: DEFAULT_MATCH };
  }, [keyList, allLearned, prints]);

  const teachBuf = useRef<{ key: string; frames: Chroma[]; started: number } | null>(null);
  const live = useRef({ candidates, match, gate, onLabel, onStrum: opts.onStrum });
  live.current = { candidates, match, gate, onLabel, onStrum: opts.onStrum };
  const recent = useRef<number[]>([]);
  const lastStrum = useRef(0);
  /** Loudness before a possible strum; it must stay up for a second frame to count. */
  const pendingFrom = useRef<number | null>(null);

  useEffect(() => {
    if (!on) {
      setStatus("off");
      return;
    }
    if (source() === "mic" && !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    const listener = new ChordListener(frame => {
      const { candidates, match, gate, onLabel, onStrum } = live.current;
      const loud = frame.level >= gate;
      setLevel(frame.level);

      // A strum is a jump in loudness that is still there a frame later: a click
      // or beep (about 50 ms) fades before then, a strummed chord keeps ringing.
      const prev = recent.current;
      const now = Date.now();
      const base = pendingFrom.current;
      pendingFrom.current = null;
      if (base !== null && loud && frame.level - base >= STRUM_RISE_DB) {
        lastStrum.current = now;
        onStrum?.();
      } else if (loud && prev.length === 3 && frame.level - Math.min(...prev) >= STRUM_RISE_DB && now - lastStrum.current > STRUM_GAP_MS) {
        pendingFrom.current = Math.min(...prev);
      }
      prev.push(frame.level);
      if (prev.length > 3) prev.shift();

      // While teaching, collect the ringing part of one strum instead of matching.
      const t = teachBuf.current;
      if (t) {
        if (loud) t.frames.push(frame.chroma);
        if (t.frames.length >= TEACH_SKIP + TEACH_KEEP) {
          usePrints.getState().save(t.key, averageChroma(t.frames.slice(TEACH_SKIP)));
          teachBuf.current = null;
          setTeaching(null);
          setTeachNote(`Learned ${t.key}.`);
        } else if (Date.now() - t.started > TEACH_TIMEOUT_MS) {
          teachBuf.current = null;
          setTeaching(null);
          setTeachNote(`Didn't hear ${t.key}. Strum it a bit louder, or raise the sensitivity.`);
        }
        setHeard(null);
        return;
      }

      const label = loud ? matchChord(frame.chroma, candidates, match).id : null;
      setHeard(label);
      onLabel?.(label);
    });
    let cancelled = false;
    setStatus("starting");
    listener.start(source()).then(
      () => !cancelled && setStatus("listening"),
      (e: unknown) => {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
      },
    );
    return () => {
      cancelled = true;
      listener.stop();
      teachBuf.current = null;
      setTeaching(null);
      setHeard(null);
      setLevel(-100);
    };
  }, [on]);

  const teach = (key: string) => {
    setTeachNote("");
    teachBuf.current = { key, frames: [], started: Date.now() };
    setTeaching(key);
  };

  return {
    on,
    status,
    level,
    heard,
    gate,
    keys,
    learned: Object.fromEntries(keys.map(k => [k, !!prints[k]])) as Record<string, boolean>,
    usingLearned: allLearned,
    teaching,
    teachNote,
    teach,
    forget: (key: string) => usePrints.getState().forget(key),
    toggle: () => setListen({ on: !on }),
    setGate: (g: number) => setListen({ gate: g }),
    savePrint,
  };
}

export type ChordListen = ReturnType<typeof useChordListener>;
