// Cover art for the gym's albums: an abstract motif for each practice area, drawn on a 100×100 square.
import type { ReactNode } from "react";

export type Art = "rings" | "inlays" | "picking" | "chordBox" | "barre" | "changes" | "strums" | "steps" | "arc" | "beams" | "waves";

export interface Palette {
  /** Tailwind gradient stops for the sleeve, dark at the top left to the colour at the bottom right. */
  bg: string;
  /** Text colour the motif and titles are drawn in. */
  ink: string;
  /** Fill for the record's centre label. */
  label: string;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Six strings and four frets, shared by the chord motifs. */
function grid(x: number, y: number, w: number, h: number) {
  return (
    <g stroke="currentColor" strokeWidth=".8" opacity=".55">
      {range(6).map(i => (
        <line key={`s${i}`} x1={x + (w / 5) * i} y1={y} x2={x + (w / 5) * i} y2={y + h} />
      ))}
      {range(5).map(i => (
        <line key={`f${i}`} x1={x} y1={y + (h / 4) * i} x2={x + w} y2={y + (h / 4) * i} />
      ))}
    </g>
  );
}

const ART: Record<Art, ReactNode> = {
  rings: (
    <g fill="none" stroke="currentColor">
      {range(11).map(i => (
        <circle key={i} cx="72" cy="30" r={5 + i * 6} strokeWidth=".8" opacity={0.9 - i * 0.075} />
      ))}
      <circle cx="72" cy="30" r="2.5" fill="currentColor" />
    </g>
  ),
  inlays: (
    <g fill="currentColor">
      <g stroke="currentColor" strokeWidth=".6" opacity=".45">
        {range(6).map(i => (
          <line key={`s${i}`} x1="0" y1={18 + i * 9} x2="100" y2={18 + i * 9} />
        ))}
        {range(8).map(i => (
          <line key={`f${i}`} x1={6 + i * 13} y1="18" x2={6 + i * 13} y2="63" />
        ))}
      </g>
      {[25.5, 51.5, 77.5].map(x => (
        <circle key={x} cx={x} cy="40.5" r="3" />
      ))}
      <circle cx="90.5" cy="31.5" r="3" opacity=".6" />
      <circle cx="90.5" cy="49.5" r="3" opacity=".6" />
    </g>
  ),
  picking: (
    <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
      {range(6).map(i => {
        const x = 28 + i * 9;
        const amp = 1 + i * 0.9;
        return <path key={i} d={`M${x} 20 q${amp} 7 0 14 t0 14 t0 14 t0 14`} opacity={0.35 + i * 0.12} />;
      })}
    </g>
  ),
  chordBox: (
    <g fill="currentColor">
      {grid(38, 14, 44, 48)}
      <rect x="37" y="12" width="46" height="3" rx="1" />
      <circle cx="55.6" cy="20" r="4" />
      <circle cx="64.4" cy="32" r="4" />
      <circle cx="73.2" cy="32" r="4" />
    </g>
  ),
  barre: (
    <g fill="currentColor">
      {grid(38, 14, 44, 48)}
      <rect x="34" y="21" width="52" height="7" rx="3.5" />
      <circle cx="64.4" cy="38" r="4" />
      <circle cx="55.6" cy="50" r="4" />
      <circle cx="64.4" cy="50" r="4" opacity=".7" />
    </g>
  ),
  changes: (
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="42" cy="36" r="22" opacity=".9" />
      <circle cx="62" cy="36" r="22" opacity=".5" />
      <path d="M30 70 q22 12 44 0" strokeLinecap="round" />
      <path d="M70 66 l4 4 -5 2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  strums: (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {range(4).map(i => (
        <path key={i} d={i % 2 ? `M${22 + i * 16} 60 v-40 m-5 5 l5 -5 5 5` : `M${22 + i * 16} 20 v40 m-5 -5 l5 5 5 -5`} opacity={i % 2 ? 0.5 : 1} />
      ))}
    </g>
  ),
  steps: (
    <g fill="currentColor">
      {range(7).map(i => (
        <rect key={i} x={14 + i * 11} y={60 - i * 7} width="8" height={4 + i * 7} rx="1" opacity={0.35 + i * 0.1} />
      ))}
    </g>
  ),
  arc: (
    <g fill="currentColor">
      <path d="M10 66 Q50 -6 90 30" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".4" />
      {range(7).map(i => {
        const t = i / 6;
        const x = (1 - t) ** 2 * 10 + 2 * (1 - t) * t * 50 + t ** 2 * 90;
        const y = (1 - t) ** 2 * 66 + 2 * (1 - t) * t * -6 + t ** 2 * 30;
        return <circle key={i} cx={x} cy={y} r={2 + i * 0.8} opacity={0.45 + t * 0.55} />;
      })}
    </g>
  ),
  waves: (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      {range(5).map(i => (
        <path key={i} d={`M${58 + i * 7} ${30 - i * 5} q${6 + i * 2} ${8 + i * 5} 0 ${16 + i * 10}`} opacity={1 - i * 0.17} />
      ))}
      <circle cx="48" cy="38" r="4" fill="currentColor" stroke="none" />
    </g>
  ),
  beams: (
    <g fill="currentColor">
      <polygon points="30,-2 36,-2 58,74 6,74" opacity=".14" />
      <polygon points="64,-2 70,-2 96,74 44,74" opacity=".1" />
      <circle cx="33" cy="2" r="3" />
      <circle cx="67" cy="2" r="3" />
    </g>
  ),
};

export function CoverArt({ art }: { art: Art }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      {ART[art]}
    </svg>
  );
}
