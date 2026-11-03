import type { KeyboardEvent } from "react";
import type { DrillTab } from "./DrillTabs";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d={dir === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Lock({ className = "size-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden>
      <rect x="2" y="5.5" width="8" height="5.5" rx="1.2" fill="currentColor" />
      <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** One drill at a time along a path: only the drill in front of you is named, the ones ahead stay locked until you earn them,
 * and a row of dots shows how far along you are. Drills that share a group (a section) are counted and dotted together. */
export function DrillPath<T extends string>({ value, options, onChange, unlockHint = "Reach level 1 here to unlock the next drill." }: {
  value: T;
  options: DrillTab<T>[];
  onChange: (v: T) => void;
  unlockHint?: string;
}) {
  const i = Math.max(0, options.findIndex(o => o.value === value));
  const current = options[i]!;
  const prev = options[i - 1];
  const next = options[i + 1];
  const group = options.filter(o => o.group === current.group);
  const place = group.indexOf(current);

  const go = (o: DrillTab<T> | undefined) => o && !o.locked && onChange(o.value);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(next);
    if (e.key === "ArrowLeft") go(prev);
  };
  const arrow = "flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition duration-200 ease-in-out hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30";

  return (
    <div onKeyDown={onKey} className="flex flex-col gap-1.5 px-1.5 py-2.5">
      <div className="flex items-center gap-2">
        <button type="button" aria-label={prev ? `Back to ${prev.label}` : "Back"} disabled={!prev} onClick={() => go(prev)} className={arrow}>
          <Chevron dir="left" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          <span className="text-[11.5px] text-faint tabular-nums">
            {current.group ? `${current.group} · ` : ""}
            {place + 1} of {group.length}
          </span>
          <span key={value} className="animate-rise truncate text-[15px] font-[620] tracking-[-0.01em] text-ink">{current.label}</span>
          <div role="tablist" aria-label="Drills" className="flex flex-wrap items-center justify-center gap-1">
            {group.map(o => {
              const on = o.value === value;
              const done = (o.level ?? 0) >= 1;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={`${o.label}${o.locked ? ", locked" : done ? ", done" : ""}`}
                  title={o.locked ? `${o.label} (locked)` : o.label}
                  disabled={o.locked}
                  onClick={() => go(o)}
                  className={`h-1.5 rounded-full transition-all duration-200 ease-in-out ${on ? "w-5 bg-ink" : `w-1.5 ${o.locked ? "bg-line-2 opacity-50" : done ? "bg-good hover:scale-150" : "bg-faint hover:scale-150"}`}`}
                />
              );
            })}
          </div>
        </div>
        <button
          type="button"
          aria-label={next ? (next.locked ? `${next.label} is locked` : `On to ${next.label}`) : "Next"}
          title={next?.locked ? unlockHint : undefined}
          disabled={!next || next.locked}
          onClick={() => go(next)}
          className={`${arrow} ${next?.locked ? "disabled:opacity-60" : ""}`}
        >
          {next?.locked ? <Lock /> : <Chevron dir="right" />}
        </button>
      </div>
      {next?.locked && (current.level ?? 0) < 1 && (
        <p className="flex items-center justify-center gap-1.5 text-[12px] text-faint">
          <Lock className="size-2.5" /> {unlockHint}
        </p>
      )}
    </div>
  );
}
