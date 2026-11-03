import { memo } from "react";
import type { Shape } from "@/content/types";
import { litId, playNote, usePlayback } from "@/audio/playback";
import { shapeNotes, type ShapeNote } from "@/music/shapes";
import type { StringNum } from "@/music/theory";

const X0 = 34;
const Y0 = 15;
const FRET_W = 44;
const STR_H = 20;
const R = 7.6;

interface Props {
  shape: Shape;
  /** Playback scope: notes light up while this id is playing. */
  scope: string;
  /** Scale the drawing up to fill the width instead of a fixed height. */
  fluid?: boolean;
  className?: string;
}

const y = (s: StringNum) => Y0 + (s - 1) * STR_H;

/** Horizontal fretboard: top line = high e, bottom line = low E. Tap any note to hear it. */
export const Fretboard = memo(function Fretboard({ shape, scope, fluid, className }: Props) {
  const lit = usePlayback(s => s.lit);
  const frets = shape.frets ?? 5;
  const width = X0 + FRET_W * frets + 14;
  const height = Y0 + STR_H * 5 + 26;
  const notes = shapeNotes(shape);
  const isLit = (n: ShapeNote) => lit.has(litId(scope, n));
  const bottom = Y0 + STR_H * 5;

  return (
    <svg
      className={`fb ${className ?? ""}`}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={fluid ? undefined : 132}
      style={frets > 5 ? { minWidth: Math.round(width * 1.1) } : undefined}
      role="img"
      aria-label="Fretboard diagram"
    >
      {Array.from({ length: frets + 1 }, (_, i) => {
        const x = X0 + i * FRET_W;
        const nut = i === 0 && shape.nut;
        return (
          <g key={`fret${i}`}>
            <line className={nut ? "fb-nut" : "fb-fret"} x1={x} y1={Y0 - 6} x2={x} y2={bottom + 6} />
            {i < frets && (
              <text className="fb-num" x={x + FRET_W / 2} y={bottom + 22} textAnchor="middle">
                {shape.startFret + i}
              </text>
            )}
          </g>
        );
      })}

      {([1, 2, 3, 4, 5, 6] as StringNum[]).map(s => {
        const muted = shape.muted?.includes(s);
        return (
          <g key={`str${s}`}>
            <line className={`fb-str${muted ? " muted" : ""}`} x1={X0} y1={y(s)} x2={X0 + FRET_W * frets} y2={y(s)} />
            {muted && <text className="fb-x" x={X0 - 14} y={y(s) + 3.5} textAnchor="middle">×</text>}
          </g>
        );
      })}

      {notes.map(n => {
        const key = `${n.s}:${n.f}`;
        const onClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          playNote(scope, n);
        };
        if (n.f === 0) {
          const cx = X0 - 14;
          return (
            <g key={key} className={`fb-note${isLit(n) ? " lit" : ""}`} onClick={onClick}>
              <circle cx={cx} cy={y(n.s)} r={8} fill="transparent" />
              <circle className="fb-open" cx={cx} cy={y(n.s)} r={4.2} />
              {n.isRoot && <circle className="fb-ring" cx={cx} cy={y(n.s)} r={7.4} />}
            </g>
          );
        }
        const cx = X0 + (n.f - shape.startFret) * FRET_W + FRET_W / 2;
        const finger = n.dot?.finger;
        const text = finger ?? n.dot?.label;
        return (
          <g key={key} className={`fb-note${isLit(n) ? " lit" : ""}`} onClick={onClick}>
            {(n.isRoot || n.isExtra) && <circle className={`fb-ring${n.isExtra ? " extra" : ""}`} cx={cx} cy={y(n.s)} r={R + 2.6} />}
            <circle className={`fb-dot${finger ? ` f${finger}` : ""}`} cx={cx} cy={y(n.s)} r={R} />
            {text !== undefined && (
              <text
                className={`fb-lbl${finger === 1 ? " dark" : ""}${String(text).length > 1 ? " small" : ""}`}
                x={cx}
                y={y(n.s) + 3.4}
                textAnchor="middle"
              >
                {text}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
});
