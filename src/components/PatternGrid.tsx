import type { ReactNode } from "react";

/** One bar of a strumming or picking pattern, drawn large: the count on top, what to play under it, and the slot now sounding lit up. */
export function PatternGrid({ count, slots, active, render }: { count: string[]; slots: string[]; active?: number; render: (token: string) => ReactNode }) {
  return (
    <div className="pb-1">
      <div className="mx-auto grid w-full justify-center gap-x-1 gap-y-2 sm:gap-x-1.5" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, ${slots.length > 8 ? 46 : 60}px))` }}>
        {count.map((c, i) => (
          <span key={`c${i}`} className={`text-center font-mono text-[13px] ${/^\d+$/.test(c) ? "font-semibold text-ink" : "text-faint"}`}>
            {c}
          </span>
        ))}
        {slots.map((s, i) => (
          <span
            key={`s${i}`}
            className={`grid h-12 place-items-center rounded-lg font-mono text-[17px] font-semibold sm:h-16 sm:rounded-xl sm:text-[22px] transition-[background-color,transform] duration-100 ${
              i === active ? "scale-105 bg-accent text-white [&_*]:text-white" : s === "·" ? "bg-surface-2/40" : "bg-surface-2"
            }`}
          >
            {render(s)}
          </span>
        ))}
      </div>
    </div>
  );
}
