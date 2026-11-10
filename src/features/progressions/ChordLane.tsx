// A scrolling lane for the play-along: the chords and strums roll towards a line, and you play each one as it crosses.
// Strums the mic hears land green; ones you miss fade as they pass.
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import * as guitar from "@/audio/guitar";
import { StrumToken } from "@/features/strumming/StrumToken";

/** Width of one bar, and where the line you play on sits, in pixels. */
const BAR_W = 400;
const HEAD_X = 88;
/** A heard strum this close to a due one (after the steady lag is taken off) lands it. */
const LAND = 0.09;
/** Strums this long past the line without being heard count as missed. */
const MISSED_AFTER = 0.35;

export interface Lane {
  /** Start scrolling towards a first bar due at `time`, each bar lasting `dur` seconds. */
  reset: (time: number, dur: number) => void;
  /** A bar has been scheduled: when it starts, how long it lasts, and when each of its slots falls. */
  bar: (index: number, slotTimes: number[], dur: number) => void;
  /** The mic heard a strum at `time`. */
  heard: (time: number) => void;
  stop: () => void;
}

interface Props {
  ref: Ref<Lane>;
  chords: string[];
  numerals: string[];
  /** One bar of the strum: where each slot falls in the bar (0 to 1) and what it is. */
  slots: { at: number; token: string }[];
}

const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;

export function ChordLane({ ref, chords, numerals, slots }: Props) {
  const strip = useRef<HTMLDivElement>(null);
  const clock = useRef<{ index: number; time: number; dur: number }[]>([]);
  const due = useRef(new Map<string, number>());
  const hit = useRef(new Set<string>());
  const lags = useRef<number[]>([]);
  const [running, setRunning] = useState(false);
  /** First bar drawn; follows the scroll so only a few bars are ever on the page. */
  const [base, setBase] = useState(0);
  const [, redraw] = useState(0);

  useImperativeHandle(ref, () => ({
    reset: (time, dur) => {
      clock.current = [{ index: 0, time, dur }];
      due.current.clear();
      hit.current.clear();
      lags.current = [];
      setBase(0);
      setRunning(true);
    },
    bar: (index, slotTimes, dur) => {
      const time = slotTimes[0]!;
      clock.current = [...clock.current.filter(c => c.index !== index).slice(-3), { index, time, dur }];
      slotTimes.forEach((t, i) => slots[i] && slots[i].token !== "·" && due.current.set(`${index}:${i}`, t));
      for (const key of due.current.keys()) if (Number(key.split(":")[0]) < index - 3) due.current.delete(key);
    },
    heard: time => {
      // The speakers and mic make every strum arrive late by about the same amount; learn it from the playing.
      const lag = lags.current.length ? median(lags.current) : 0.08;
      let best: { key: string; off: number } | null = null;
      for (const [key, t] of due.current) {
        const off = time - t;
        if (!hit.current.has(key) && Math.abs(off - lag) <= (best ? Math.abs(best.off - lag) : 0.3)) best = { key, off };
      }
      if (!best) return;
      lags.current = [...lags.current.slice(-11), Math.min(0.25, Math.max(-0.04, best.off))];
      if (Math.abs(best.off - lag) > LAND) return;
      hit.current.add(best.key);
      redraw(n => n + 1);
    },
    stop: () => setRunning(false),
  }), [slots]);

  // Where the line is, in bars, at an audio-clock time.
  const position = (now: number) => {
    const entries = clock.current;
    const cur = entries.findLast(c => c.time <= now) ?? entries[0];
    return cur ? cur.index + (now - cur.time) / cur.dur : 0;
  };

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let shown = 0;
    let last = 0;
    const frame = (ms: number) => {
      const p = position(guitar.now());
      if (strip.current) strip.current.style.transform = `translate3d(${HEAD_X - p * BAR_W}px,0,0)`;
      const first = Math.max(0, Math.floor(p) - 1);
      if (first !== shown) setBase((shown = first));
      // Redraw a few times a second so strums that slipped past fade.
      if (ms - last > 200) {
        last = ms;
        redraw(n => n + 1);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const now = running ? guitar.now() : 0;
  const scoring = hit.current.size > 0;

  return (
    <div className="relative h-[168px] overflow-hidden rounded-2xl border border-line bg-surface-2/40 [mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-80px),transparent)]">
      <div ref={strip} className="absolute inset-y-0 left-0 will-change-transform" style={running ? undefined : { transform: `translate3d(${HEAD_X}px,0,0)` }}>
        {Array.from({ length: 5 }, (_, k) => base + k).map(n => (
          <div key={n} className="absolute inset-y-0 border-l border-line-2" style={{ left: n * BAR_W, width: BAR_W }}>
            <div className="flex items-baseline gap-2 pt-4 pl-4">
              <span className="font-brand text-[34px] font-[600] leading-none tracking-[-0.02em]">{chords[n % chords.length]}</span>
              <span className="text-[13px] text-faint">{numerals[n % chords.length]}</span>
            </div>
            {slots.map((s, i) => {
              if (s.token === "·") return null;
              const key = `${n}:${i}`;
              const t = due.current.get(key);
              const landed = hit.current.has(key);
              const missed = scoring && !landed && t !== undefined && now - t > MISSED_AFTER;
              return (
                <span
                  key={i}
                  className={`absolute bottom-6 grid size-10 -translate-x-1/2 place-items-center rounded-full font-mono text-[17px] font-semibold transition-[background-color,opacity,transform] duration-150 ${
                    landed ? "scale-110 bg-good text-white [&_*]:text-white" : missed ? "bg-surface-2 opacity-35" : "bg-surface ring-1 ring-line-2"
                  }`}
                  style={{ left: s.at * BAR_W }}
                >
                  <StrumToken t={s.token} />
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {/* The line you play on. */}
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent shadow-[0_0_12px_2px_var(--accent)]" style={{ left: HEAD_X }} />
    </div>
  );
}
