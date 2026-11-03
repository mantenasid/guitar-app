import type { ReactNode } from "react";
import { usePlayback } from "@/audio/playback";
import { setLearned } from "@/progress/db";
import { useLearned } from "@/progress/hooks";
import { CHANGE_LEVELS, CHANGE_TARGET, stageOf } from "@/skills/changes";

export function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
      <path d="M4.5 2.8v10.4l8.6-5.2z" fill="currentColor" />
    </svg>
  );
}

export function StopIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
      <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function PageHeader({ title, lead, eyebrow, children, aside }: { title: ReactNode; lead?: ReactNode; eyebrow?: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="mb-9 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div>
        {eyebrow && <div className="mb-2 text-[13px] text-muted">{eyebrow}</div>}
        <h1 className="text-[26px] font-[650] leading-tight tracking-[-0.025em] sm:text-[30px]">{title}</h1>
        {lead && <p className="mt-2 max-w-[62ch] text-[15px] text-muted">{lead}</p>}
        {children}
      </div>
      {aside}
    </header>
  );
}

export function Section({ id, num, title, note, aside, children }: { id?: string; num?: number; title: ReactNode; note?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mt-12 first:mt-0 sm:mt-14">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[19px] font-[620] tracking-[-0.015em]">
          {num !== undefined && <span className="mr-2 font-medium tabular-nums text-faint">{num}</span>}
          {title}
        </h2>
        {note && <p className="text-sm text-muted">{note}</p>}
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * Liquid glass: a thin tint that lets what is behind show through, blurred and with its colours lifted,
 * with a bright rim along the top edge and light catching the top left.
 */
export const glassClass =
  "border border-glass-rim/40 bg-glass bg-linear-to-br from-glass-rim/45 via-transparent to-transparent backdrop-blur-xl backdrop-saturate-[1.8] shadow-[inset_0_1px_0_var(--glass-rim),inset_0_-1px_0_rgb(255_255_255/0.06),0_12px_32px_-12px_rgb(30_40_30/0.35)]";

export const cardClass = "block rounded-[14px] border border-line bg-surface shadow-card";

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(232px,1fr))] [&>*]:min-w-0">{children}</div>;
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[10px] bg-surface-2 p-[3px]" role="tablist">
      {options.map(o => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13.5px] ${o.value === value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Play/stop toggle for anything driven by the shared playback controller. */
export function PlayButton({ playId, onPlay, label, title }: { playId: string; onPlay: () => void; label?: string; title: string }) {
  const active = usePlayback(s => s.activeId === playId);
  return (
    <button
      type="button"
      title={active ? "Stop" : title}
      aria-label={active ? "Stop" : title}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onPlay();
      }}
      className={`inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] ${active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
    >
      {active ? <StopIcon /> : <PlayIcon />}
      {label && <span>{active ? "Stop" : label}</span>}
    </button>
  );
}

/** Circle that marks a skill as learned. */
export function TickButton({ skillId, label }: { skillId: string; label?: string }) {
  const done = useLearned().has(skillId);
  return (
    <button
      type="button"
      title={done ? "Learned (click to undo)" : "Mark as learned"}
      aria-pressed={done}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        void setLearned(skillId, !done);
      }}
      className={`inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] hover:bg-surface-2 ${done ? "text-good" : "text-muted hover:text-ink"}`}
    >
      <span className={`grid size-4 place-items-center rounded-full border-[1.5px] ${done ? "border-good bg-good" : "border-line-2"}`}>
        {done && (
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
            <path d="M4.5 8.2l2.3 2.3 4.7-4.9" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}

/** Thin bar towards the 80-changes target, coloured by level, with marks at each level below it. */
export function TargetBar({ value, level, className = "" }: { value: number; level: number; className?: string }) {
  return (
    <div className={`stage ${stageOf(level, value > 0).id} relative h-1 overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <span className="block h-full rounded-full bg-[var(--stage)]" style={{ width: `${Math.min(100, (value / CHANGE_TARGET) * 100)}%` }} />
      {CHANGE_LEVELS.slice(0, -1).map(m => (
        <i key={m} className="absolute inset-y-0 w-0.5 bg-surface" style={{ left: `${(m / CHANGE_TARGET) * 100}%` }} />
      ))}
    </div>
  );
}

export function StageDot({ level, tried }: { level: number; tried: boolean }) {
  return <span className={`stage ${stageOf(level, tried).id} inline-block size-[7px] shrink-0 rounded-full bg-[var(--stage)]`} />;
}

/** Recent scores as a small line, with a dashed line at the target. */
export function Sparkline({ values, width = 96, height = 22 }: { values: number[]; width?: number; height?: number }) {
  const pts = values.slice(-12);
  if (!pts.length) return null;
  const x = (i: number) => (pts.length === 1 ? width / 2 : 3 + (i * (width - 6)) / (pts.length - 1));
  const y = (n: number) => height - 3 - (Math.min(n, CHANGE_TARGET) / CHANGE_TARGET) * (height - 6);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-label="Recent scores">
      <line x1={0} x2={width} y1={y(CHANGE_TARGET)} y2={y(CHANGE_TARGET)} stroke="var(--good)" strokeDasharray="3 3" />
      <path d={pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join("")} fill="none" stroke="var(--ink-2)" strokeWidth={1.5} />
      {pts.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p)} r={2.2} fill="var(--ink-2)" />
      ))}
    </svg>
  );
}

const FINGERS = [
  { n: 1, name: "Index" },
  { n: 2, name: "Middle" },
  { n: 3, name: "Ring" },
  { n: 4, name: "Little" },
];

/** Key for the diagrams: finger colours, root ring, extra notes, open/muted. */
export function DiagramLegend({ extra }: { extra?: string }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
      {FINGERS.map(f => (
        <span key={f.n} className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-full" style={{ background: `var(--f${f.n})` }} />
          {f.name}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <i className="inline-block size-3 rounded-full border-[1.8px] border-ink" />
        Root
      </span>
      {extra && (
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-3 rounded-full border-[1.8px] border-dashed border-ink" />
          {extra}
        </span>
      )}
      <span>O open · × muted</span>
    </div>
  );
}
