// Chromatic tuner for standard tuning, with reference tones for each string.
import { useEffect, useState } from "react";
import * as guitar from "@/audio/guitar";
import { centsFrom, hzToNote, type Pitch } from "@/audio/listen/pitch";
import { usePitch } from "@/audio/listen/useInput";
import { PageHeader, cardClass } from "@/components/ui";
import { OPEN_MIDI, STRINGS, STRING_NAMES, noteAt, type StringNum } from "@/music/theory";

/** Within this many cents counts as in tune. */
export const IN_TUNE_CENTS = 5;

const STATUS_TEXT: Record<string, string> = {
  starting: "Opening the microphone…",
  denied: "Microphone access was blocked. Allow it in your browser's site settings.",
  unsupported: "This browser can't use the microphone.",
  error: "Couldn't open the microphone.",
};

/** The open string closest to a pitch. */
export function nearestString(hz: number): StringNum {
  return STRINGS.reduce((best, s) => (Math.abs(centsFrom(hz, OPEN_MIDI[s])) < Math.abs(centsFrom(hz, OPEN_MIDI[best])) ? s : best), STRINGS[0]!);
}

export default function TunerPage() {
  const [on, setOn] = useState(false);
  const { status, pitch } = usePitch(on);
  // Keep the last note on screen (dimmed) while the string fades.
  const [last, setLast] = useState<Pitch | null>(null);
  useEffect(() => {
    if (pitch) setLast(pitch);
  }, [pitch]);
  useEffect(() => {
    if (!on) setLast(null);
  }, [on]);

  const shown = pitch ?? last;
  const reading = shown ? hzToNote(shown.hz) : null;
  const string = shown ? nearestString(shown.hz) : null;
  const cents = reading?.cents ?? 0;
  const inTune = !!pitch && Math.abs(cents) <= IN_TUNE_CENTS;

  return (
    <>
      <PageHeader title="Tuner" lead="Play one string at a time and let it ring. Tune up to the note from below; green means within 5 cents." />
      <div className={`${cardClass} mx-auto max-w-[560px] p-6 text-center sm:p-8`}>
        <div className={`transition ${pitch ? "opacity-100" : "opacity-40"}`}>
          <div className={`text-[88px] font-[650] leading-none tracking-[-0.04em] tabular-nums ${inTune ? "text-good" : "text-ink"}`}>
            {reading ? reading.note : "–"}
            {reading && <span className="ml-1 align-top text-2xl font-medium text-muted">{reading.octave}</span>}
          </div>
          <div className="mt-2 h-5 text-[13.5px] tabular-nums text-muted">
            {shown && reading ? `${shown.hz.toFixed(1)} Hz · ${cents > 0 ? "+" : ""}${cents} cents` : on ? "Play a string…" : ""}
          </div>
        </div>

        <div className="relative mx-auto mt-6 h-10 max-w-[420px]" aria-label={`${cents} cents`}>
          <div className="absolute inset-x-0 top-1/2 h-px bg-line-2" />
          {[-50, -25, 0, 25, 50].map(m => (
            <span key={m} className={`absolute top-1/2 w-px -translate-y-1/2 ${m === 0 ? "h-6 bg-ink-2" : "h-3 bg-line-2"}`} style={{ left: `${50 + m}%` }} />
          ))}
          <span className="absolute inset-y-0 rounded-sm bg-good-soft" style={{ left: `${50 - IN_TUNE_CENTS}%`, width: `${IN_TUNE_CENTS * 2}%` }} />
          {reading && (
            <span
              className={`absolute top-0 h-10 w-1 -translate-x-1/2 rounded-full transition-all duration-150 ${inTune ? "bg-good" : "bg-accent"} ${pitch ? "" : "opacity-40"}`}
              style={{ left: `${50 + Math.max(-50, Math.min(50, cents))}%` }}
            />
          )}
        </div>
        <div className="mx-auto flex max-w-[420px] justify-between text-[12px] text-faint">
          <span>Flat</span>
          <span>Sharp</span>
        </div>

        <button
          onClick={() => setOn(o => !o)}
          className={`mt-6 rounded-[9px] px-5 py-2.5 text-[14px] font-medium ${on ? "bg-accent-soft text-accent" : "bg-ink text-bg"}`}
        >
          {on ? "Stop listening" : "Start tuner"}
        </button>
        {STATUS_TEXT[status] && <p className="mt-3 text-[13px] text-muted">{STATUS_TEXT[status]}</p>}
      </div>

      <div className="mx-auto mt-4 grid max-w-[560px] grid-cols-6 gap-2">
        {STRINGS.map(s => {
          const midi = OPEN_MIDI[s];
          const active = string === s && !!pitch;
          return (
            <button
              key={s}
              onClick={() => guitar.pluck(midi, { gain: 0.9 })}
              title={`Play ${STRING_NAMES[s]} string reference`}
              className={`${cardClass} py-3 text-center transition hover:border-line-2 ${active ? (inTune ? "border-good text-good" : "border-accent text-accent") : ""}`}
            >
              <div className="text-lg font-[620]">{s === 1 ? "e" : noteAt(s, 0)}</div>
              <div className="text-[11.5px] text-muted">{s}</div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[12.5px] text-faint">Tap a string to hear its reference note.</p>
    </>
  );
}
