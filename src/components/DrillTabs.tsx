import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Progress } from "@/skills/progress";
import { LevelPips } from "./LevelPips";

export interface DrillTab<T extends string> {
  value: T;
  label: string;
  /** Still selectable, so you can look ahead; claiming is what the page holds back. */
  locked?: boolean;
  level?: number;
  /** Drills in the same group (a section) are counted together on a path. */
  group?: string;
}

/** Tab entries for a list of drills, each locked and levelled from progress. */
export function drillOptions<I extends { id: string; title: string }>(progress: Progress, items: readonly I[], skillId: (x: I) => string, label: (x: I) => string = x => x.title): DrillTab<I["id"]>[] {
  return items.map(x => {
    const p = progress.skills.get(skillId(x));
    return { value: x.id, label: label(x), locked: !p?.unlocked, level: p?.level };
  });
}

/** Fade the edge that has more drills past it, so the strip reads as something to swipe. */
const FADES = {
  none: "",
  left: "[mask-image:linear-gradient(to_right,transparent,black_48px)]",
  right: "[mask-image:linear-gradient(to_left,transparent,black_48px)]",
  both: "[mask-image:linear-gradient(to_right,transparent,black_48px,black_calc(100%-48px),transparent)]",
} as const;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d={dir === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A swipeable row of drills, in order. A pill slides under the chosen one and the row glides to keep it centred. */
export function DrillTabs<T extends string>({ value, options, onChange }: { value: T; options: DrillTab<T>[]; onChange: (v: T) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const tabs = useRef(new Map<T, HTMLButtonElement>());
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = tabs.current.get(value);
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    const s = scroller.current;
    if (s) setEdges({ left: s.scrollLeft > 2, right: s.scrollLeft + s.clientWidth < s.scrollWidth - 2 });
  }, [value]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const s = scroller.current;
    if (!s) return;
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    return () => ro.disconnect();
  }, [measure]);

  // Glide the chosen drill to the middle of the row; the first render jumps there so the page doesn't open mid-scroll.
  const first = useRef(true);
  useEffect(() => {
    const s = scroller.current;
    const el = tabs.current.get(value);
    if (!s || !el) return;
    s.scrollTo({ left: el.offsetLeft - (s.clientWidth - el.offsetWidth) / 2, behavior: first.current ? "instant" : "smooth" });
    first.current = false;
  }, [value]);

  const nudge = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.7, behavior: "smooth" });

  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[options.findIndex(o => o.value === value) + step];
    if (next) {
      onChange(next.value);
      tabs.current.get(next.value)?.focus();
    }
  };

  const fade = edges.left && edges.right ? "both" : edges.left ? "left" : edges.right ? "right" : "none";
  const arrow = "hidden size-8 shrink-0 items-center justify-center rounded-full text-muted transition duration-200 ease-in-out hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-0 sm:flex";

  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Earlier drills" disabled={!edges.left} onClick={() => nudge(-1)} className={arrow}>
        <Chevron dir="left" />
      </button>
      <div ref={scroller} onScroll={measure} className={`no-scrollbar min-w-0 flex-1 snap-x overflow-x-auto scroll-px-6 ${FADES[fade]}`}>
        <div role="tablist" onKeyDown={onKey} className="relative flex w-max gap-1.5 py-1">
          {pill && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-1 rounded-xl border border-line-2 bg-surface shadow-card transition-[left,width] duration-300 ease-[cubic-bezier(.3,1.3,.5,1)] motion-reduce:transition-none"
              style={{ left: pill.left, width: pill.width }}
            />
          )}
          {options.map((o, i) => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                ref={el => {
                  if (el) tabs.current.set(o.value, el);
                  else tabs.current.delete(o.value);
                }}
                type="button"
                role="tab"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                onClick={() => onChange(o.value)}
                className={`group relative flex snap-start flex-col items-start gap-1 whitespace-nowrap rounded-xl px-3.5 py-2 text-left transition duration-200 ease-in-out ${
                  on ? "text-ink" : "text-muted hover:bg-surface-2/70 hover:text-ink"
                } ${o.locked && !on ? "opacity-60" : ""}`}
              >
                <span className="flex items-baseline gap-1.5 text-[13.5px] font-[560]">
                  <span className={`text-[11px] tabular-nums ${on ? "text-accent" : "text-faint"}`}>{i + 1}</span>
                  {o.label}
                </span>
                {o.locked ? (
                  <span className="flex items-center gap-1 text-[11px] text-faint">
                    <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
                      <rect x="2" y="5.5" width="8" height="5.5" rx="1.2" fill="currentColor" />
                      <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                    Locked
                  </span>
                ) : (
                  <LevelPips level={o.level ?? 0} className="h-[14px] items-center" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <button type="button" aria-label="Later drills" disabled={!edges.right} onClick={() => nudge(1)} className={arrow}>
        <Chevron dir="right" />
      </button>
    </div>
  );
}
