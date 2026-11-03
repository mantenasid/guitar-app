// Tuner for standard tuning: six strings fill the page, thick to thin, and each one turns gold once it's in tune.
import { useEffect, useState } from "react";
import { centsFrom } from "@/audio/listen/pitch";
import { usePitch } from "@/audio/listen/useInput";
import { OPEN_MIDI, STRINGS, STRING_NAMES, type StringNum } from "@/music/theory";

/** Within this many cents counts as in tune. */
export const IN_TUNE_CENTS = 5;

/** Past this many cents the shadow stops moving further out. */
const MAX_CENTS = 50;

const STATUS_TEXT: Record<string, string> = {
  starting: "Opening the microphone…",
  denied: "Microphone access was blocked. Allow it in your browser's site settings.",
  unsupported: "This browser can't use the microphone.",
  error: "Couldn't open the microphone.",
};

/** String gauge in pixels, low E the heaviest. */
const GAUGE: Record<StringNum, number> = { 6: 7, 5: 5.6, 4: 4.4, 3: 3.3, 2: 2.5, 1: 1.8 };
const WOUND = new Set<StringNum>([6, 5, 4]);

/** Tight coil wrapped round the heavy strings, a bright edge then a dark groove on every turn. */
const WINDING = "repeating-linear-gradient(168deg, rgb(255 255 255 / 0.22) 0 0.8px, rgb(0 0 0 / 0.5) 0.8px 1.6px, transparent 1.6px 2.4px)";
/** Light running down one side of a round wire, so each string reads as a cylinder rather than a flat line. */
const SHADE = "linear-gradient(90deg, rgb(0 0 0 / 0.55), rgb(255 255 255 / 0.4) 38%, rgb(255 255 255 / 0.08) 55%, rgb(0 0 0 / 0.6))";
const GOLD = "linear-gradient(90deg, #7a4d10, #f6dc8c 45%, #c9952f)";

/** The open string closest to a pitch. */
export function nearestString(hz: number): StringNum {
  return STRINGS.reduce((best, s) => (Math.abs(centsFrom(hz, OPEN_MIDI[s])) < Math.abs(centsFrom(hz, OPEN_MIDI[best])) ? s : best), STRINGS[0]!);
}

interface StringProps {
  string: StringNum;
  /** Cents off the open note while this string is ringing, else null. */
  cents: number | null;
  tuned: boolean;
}

function TunerString({ string, cents, tuned }: StringProps) {
  const ringing = cents !== null;
  const gold = ringing ? Math.abs(cents) <= IN_TUNE_CENTS : tuned;
  // Flat throws the shadow left, sharp throws it right; the further off, the further it falls from the string.
  const off = ringing && !gold ? Math.sign(cents) * (6 + (Math.min(Math.abs(cents), MAX_CENTS) / MAX_CENTS) * 34) : 0;
  const width = GAUGE[string];
  const texture = WOUND.has(string) ? `${WINDING}, ${SHADE}` : SHADE;

  return (
    <div role="img" aria-label={`${STRING_NAMES[string]} string${gold ? ", in tune" : ""}`} className="flex h-full justify-center">
      <span
        className="relative h-full rounded-full bg-[#f4f4f5]/85 transition-[box-shadow] duration-200 ease-in-out"
        style={{
          width,
          backgroundImage: texture,
          boxShadow: gold
            ? "0 0 18px 2px rgb(232 187 88 / 0.55)"
            : off
              ? `${off}px 0 ${8 + Math.abs(off) / 4}px ${width / 2}px color-mix(in srgb, var(--ink) 50%, transparent)`
              : "none",
        }}
      >
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full transition-opacity duration-200 ease-in-out ${gold ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundImage: `${texture}, ${GOLD}` }}
        />
      </span>
    </div>
  );
}

export default function TunerPage() {
  const [on, setOn] = useState(false);
  const { status, pitch } = usePitch(on);
  const [tuned, setTuned] = useState<ReadonlySet<StringNum>>(new Set());

  const ringing = pitch ? nearestString(pitch.hz) : null;
  const cents = pitch && ringing ? centsFrom(pitch.hz, OPEN_MIDI[ringing]) : null;

  // A string stays gold once you've brought it in, until it's heard out of tune again.
  useEffect(() => {
    if (ringing === null || cents === null) return;
    const inTune = Math.abs(cents) <= IN_TUNE_CENTS;
    setTuned(prev => {
      if (prev.has(ringing) === inTune) return prev;
      const next = new Set(prev);
      if (inTune) next.add(ringing);
      else next.delete(ringing);
      return next;
    });
  }, [ringing, cents]);

  useEffect(() => {
    if (!on) setTuned(new Set());
  }, [on]);

  return (
    <div className="flex h-[calc(100svh-12rem)] min-h-[420px] flex-col gap-5">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="h-2 rounded-full bg-line-2" aria-hidden />
        <div className="grid min-h-0 flex-1 grid-cols-6 gap-1 sm:gap-3">
          {STRINGS.map(s => (
            <TunerString key={s} string={s} cents={ringing === s ? cents : null} tuned={tuned.has(s)} />
          ))}
        </div>
        <div className="h-2 rounded-full bg-line-2" aria-hidden />
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => setOn(o => !o)}
          className={`rounded-full px-6 py-2.5 text-[14px] font-medium transition duration-200 ease-in-out ${on ? "bg-accent-soft text-accent" : "bg-ink text-bg"}`}
        >
          {on ? "Stop listening" : "Start tuner"}
        </button>
        {STATUS_TEXT[status] && <p className="text-[13px] text-muted">{STATUS_TEXT[status]}</p>}
      </div>
    </div>
  );
}
