import type { ChordListen, ListenStatus } from "@/audio/listen/useChordListener";

const STATUS_TEXT: Record<ListenStatus, string> = {
  off: "Mic off: count with +1 or Space",
  starting: "Starting the microphone…",
  listening: "Listening",
  denied: "Microphone blocked. Allow it in the browser's site settings, then try again.",
  unsupported: "This browser can't use the microphone here.",
  error: "Couldn't start the microphone.",
};

/** Mic on/off, a level meter with the sensitivity mark, the chord being heard, and chord teaching. */
export function ListenPanel({ listen, hint, teachable = true }: { listen: ChordListen; hint?: string; teachable?: boolean }) {
  const { on, status, level, heard, gate, teaching } = listen;
  const ready = on && status === "listening";
  // Meter spans −80 … −10 dBFS.
  const pct = (db: number) => Math.max(0, Math.min(100, ((db + 80) / 70) * 100));
  const untaught = listen.keys.filter(k => !listen.learned[k]);
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={listen.toggle}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13.5px] font-medium ${on ? "bg-accent text-white" : "bg-surface text-ink ring-1 ring-line-2"}`}
          aria-pressed={on}
        >
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
            <rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" fill="currentColor" />
            <path d="M3.5 7.5a4.5 4.5 0 009 0M8 12v2.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {on ? "Listening" : "Listen with mic"}
        </button>
        <span className="text-right text-[12.5px] text-muted">
          {ready ? (
            teaching ? (
              <b className="text-accent">Strum {teaching} and let it ring…</b>
            ) : heard ? (
              <>Hearing <b className="text-[15px] text-ink">{heard}</b></>
            ) : level < gate ? (
              "Waiting for sound"
            ) : (
              "Unclear chord"
            )
          ) : (
            STATUS_TEXT[status]
          )}
        </span>
      </div>

      {ready && (
        <>
          <div className="relative h-2 overflow-hidden rounded-full bg-line" title="Input level">
            <span className={`block h-full rounded-full transition-[width] duration-75 ${level >= gate ? "bg-good" : "bg-faint"}`} style={{ width: `${pct(level)}%` }} />
            <i className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${pct(gate)}%` }} />
          </div>
          <label className="flex items-center gap-2 text-[12px] text-muted">
            Sensitivity
            {/* 0 = only loud playing counts (−20 dBFS), 100 = very quiet playing counts (−75 dBFS). */}
            <input type="range" min={0} max={100} value={Math.round(((-20 - gate) / 55) * 100)} onChange={e => listen.setGate(-20 - (+e.target.value * 55) / 100)} className="flex-1" />
          </label>

          {teachable && (
            <div className="border-t border-line pt-2 text-[12px] text-muted">
              <div className="mb-1.5">
                {untaught.length
                  ? "For the most accurate counting, teach it how these chords sound on your guitar: tap one, then strum it once."
                  : "Using your guitar's own sound for these chords."}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {listen.keys.map(k => (
                  <button
                    key={k}
                    disabled={!!teaching}
                    onClick={() => listen.teach(k)}
                    title={listen.learned[k] ? `Re-teach ${k}` : `Teach ${k}`}
                    className={`rounded-md px-2 py-1 font-medium ring-1 disabled:opacity-50 ${
                      teaching === k ? "bg-accent text-white ring-accent" : listen.learned[k] ? "bg-good-soft text-good ring-good" : "bg-surface text-ink ring-line-2"
                    }`}
                  >
                    {listen.learned[k] ? "✓ " : "Teach "}
                    {k}
                  </button>
                ))}
              </div>
              {listen.teachNote && <div className="mt-1.5 text-ink-2">{listen.teachNote}</div>}
            </div>
          )}
          {hint && <p className="text-[12px] text-faint">{hint}</p>}
        </>
      )}
    </div>
  );
}
