import { useRef, type ReactNode } from "react";
import { DrillPath } from "./DrillPath";
import { DrillTabs, type DrillTab } from "./DrillTabs";
import { cardClass } from "./ui";

/** One section of a drill window, with a small heading so each part reads on its own. */
export function WindowPane({ title, aside, children, className = "" }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 p-5 sm:p-6 ${className}`}>
      {(title || aside) && (
        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
          {title && <div className="min-w-0">{title}</div>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** A drill's whole workspace in one window: the drills run along the top as tabs, the chosen one fills the body,
 * and practice tools (metronome, tempo claim) get a pane of their own beside it. The body slides in from the side you moved to. */
export function DrillWindow<T extends string>({
  value,
  options,
  onChange,
  children,
  side,
  footer,
  path,
  unlockHint,
}: {
  value: T;
  options: DrillTab<T>[];
  onChange: (v: T) => void;
  children: ReactNode;
  side?: ReactNode;
  footer?: ReactNode;
  /** Show one drill at a time along a path, with later drills locked until you earn them, instead of every drill as a tab. */
  path?: boolean;
  unlockHint?: string;
}) {
  // Which way the body slides: from the right when you go to a later drill, from the left for an earlier one.
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
        <div
          key={value}
          className={`grid motion-reduce:animate-none ${dir.current === 1 ? "animate-slide-next" : "animate-slide-prev"} ${side ? "lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]" : ""}`}
        >
          <div className="min-w-0">{children}</div>
          {side && <div className="min-w-0 border-t border-line bg-surface-2/30 lg:border-t-0 lg:border-l">{side}</div>}
        </div>
      </div>
      {footer && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3.5 text-[13px] text-muted sm:px-6">{footer}</div>}
    </div>
  );
}
