import { useRef, type ReactNode } from "react";
import { DrillPath } from "./DrillPath";
import { DrillTabs, type DrillTab } from "./DrillTabs";
import { cardClass } from "./ui";

/** The stage: a centred column with room around the one thing to play. */
export const STAGE = "mx-auto min-w-0 max-w-[820px] px-5 py-8 sm:px-8 sm:py-10";
/** The controls strip under the stage. */
export const STRIP = "border-t border-line bg-surface-2/30";

/** The name of the drill on the stage, centred over what you play. */
export function DrillTitle({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="font-brand text-[26px] font-[560] leading-tight tracking-[-0.02em] sm:text-[30px]">{title}</h2>
      {sub && <div className="mt-1 text-[14px] text-muted">{sub}</div>}
    </div>
  );
}

/** A line of coaching under the stage. */
export function DrillTip({ children }: { children: ReactNode }) {
  return <p className="mx-auto mt-6 max-w-[56ch] text-center text-[14.5px] text-ink-2">{children}</p>;
}

/** A drill's whole workspace, top to bottom: which drill you're on, a stage with the one thing to play, and the controls
 * (tempo, start, score) in a strip under it. The stage slides in from the side you moved to. */
export function DrillWindow<T extends string>({
  value,
  options,
  onChange,
  children,
  side,
  footer,
  path,
  unlockHint,
  bare,
}: {
  value: T;
  options: DrillTab<T>[];
  onChange: (v: T) => void;
  children: ReactNode;
  /** The controls strip under the stage. */
  side?: ReactNode;
  footer?: ReactNode;
  /** Show one drill at a time along a path, with later drills locked until you earn them, instead of every drill as a tab. */
  path?: boolean;
  unlockHint?: string;
  /** The drill lays out its own stage and controls strip. */
  bare?: boolean;
}) {
  // Which way the stage slides: from the right when you go to a later drill, from the left for an earlier one.
  const prev = useRef(value);
  const dir = useRef<1 | -1>(1);
  if (prev.current !== value) {
    const idx = (v: T) => options.findIndex(o => o.value === v);
    dir.current = idx(value) >= idx(prev.current) ? 1 : -1;
    prev.current = value;
  }

  return (
    <div className={`${cardClass} min-w-0 overflow-hidden`}>
      <div className="no-print border-b border-line bg-surface-2/50 px-1.5 py-1">
        {path ? <DrillPath value={value} options={options} onChange={onChange} unlockHint={unlockHint} /> : <DrillTabs value={value} options={options} onChange={onChange} />}
      </div>
      <div className="overflow-hidden">
        <div key={value} className={`motion-reduce:animate-none ${dir.current === 1 ? "animate-slide-next" : "animate-slide-prev"}`}>
          {bare ? children : <div className={STAGE}>{children}</div>}
          {side && <div className={STRIP}>{side}</div>}
        </div>
      </div>
      {footer && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3.5 text-[13px] text-muted sm:px-6">{footer}</div>}
    </div>
  );
}
