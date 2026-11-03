import type { ReactNode } from "react";
import type { Shape } from "@/content/types";
import { Fretboard } from "@/components/Fretboard";
import { PlayButton, cardClass } from "@/components/ui";
import { playSequence, toggle } from "@/audio/playback";
import { scaleRun, stringSteps } from "@/music/shapes";
import { STRING_NAMES, noteAt } from "@/music/theory";

/** A diagram with a play button, and optionally the per-string steps under it. */
export function ShapePanel({ shape, title, subtitle, playId, steps = true, spell = n => n, children }: {
  shape: Shape;
  /** Spell note names, e.g. as flats in flat keys. */
  spell?: (note: string) => string;
  title: ReactNode;
  subtitle?: ReactNode;
  playId: string;
  steps?: boolean;
  children?: ReactNode;
}) {
  const rows = stringSteps(shape);
  const up = rows.map(r => r.notes.map(n => n.f).join("."));
  return (
    <div className={`${cardClass} min-w-0 p-4 sm:p-5`}>
      <div className="mb-3.5">
        <div className="text-base font-[620] tracking-[-0.01em]">{title}</div>
        {subtitle && <div className="text-[13px] text-muted">{subtitle}</div>}
      </div>
      <div className={shape.frets && shape.frets > 6 ? "overflow-x-auto pb-1" : ""}>
        <Fretboard shape={shape} scope={playId} fluid className={shape.frets && shape.frets > 6 ? "" : "max-w-[440px]"} />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <PlayButton playId={playId} onPlay={() => toggle(playId, () => playSequence(playId, scaleRun(shape)))} label="Play up & down" title="Play up and down" />
        <span className="text-[12.5px] text-faint">Tap any dot to hear it</span>
      </div>

      {steps && (
        <>
          <div className="mt-3.5 border-t border-line">
            {rows.map(({ s, notes }) => (
              <div key={s} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b border-line py-2 text-[13.5px] sm:grid-cols-[96px_auto_1fr]">
                <span className="text-[13px] text-muted">{STRING_NAMES[s]}</span>
                <span className="flex items-center gap-1.5 font-mono">
                  {notes.map((n, i) => (
                    <span key={n.f} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-[11px] text-faint">→</span>}
                      <span
                        className={`inline-flex h-6 min-w-[26px] items-center justify-center rounded-md px-1.5 text-[12.5px] font-semibold ${
                          n.isRoot ? "bg-ink text-bg" : n.isExtra ? "text-accent ring-[1.5px] ring-accent ring-inset" : "bg-surface-2"
                        }`}
                        style={n.dot?.finger ? { boxShadow: `inset 0 -3px 0 var(--f${n.dot.finger})` } : undefined}
                      >
                        {n.f}
                      </span>
                    </span>
                  ))}
                </span>
                <span className="col-span-2 text-[12.5px] text-muted sm:col-span-1 sm:text-right">
                  {notes.some(n => n.dot?.finger) && <>Fingers {notes.map(n => n.dot?.finger ?? "0").join(" → ")} · </>}
                  {notes.map(n => spell(noteAt(n.s, n.f))).join(" → ")}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-1 text-[12.5px] text-muted">
            <span>Up, low string to high</span>
            <code className="overflow-x-auto whitespace-nowrap rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-[13px] text-ink">{up.join("  →  ")}</code>
            <span className="mt-1.5">Down, high string to low</span>
            <code className="overflow-x-auto whitespace-nowrap rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-[13px] text-ink">
              {rows.slice().reverse().map(r => r.notes.map(n => n.f).reverse().join(".")).join("  →  ")}
            </code>
          </div>
        </>
      )}
      {children}
    </div>
  );
}
