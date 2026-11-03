import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { hit, type Drum } from "@/audio/drums";
import studio from "./studio.webp";

/** The photo is square; this is its size in the SVG's units. */
const SIZE = 1024;
/** How far down the photo to keep in view when a wide screen crops its top and bottom. */
const FOCUS_Y = 0.3;
/** How far right to keep in view when a tall screen crops the sides: the drum kit is on the right. */
const FOCUS_X = 0.8;

interface Pad {
  drum: Drum;
  label: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** Where each drum sits in the photo. Later pads are in front, so they win where they overlap. */
const PADS: Pad[] = [
  { drum: "kick", label: "Kick drum", cx: 655, cy: 675, rx: 50, ry: 64 },
  { drum: "floorTom", label: "Floor tom", cx: 895, cy: 640, rx: 62, ry: 40 },
  { drum: "rackTom", label: "Tom", cx: 716, cy: 565, rx: 46, ry: 30 },
  { drum: "snare", label: "Snare", cx: 778, cy: 660, rx: 62, ry: 40 },
  { drum: "splash", label: "Splash cymbal", cx: 919, cy: 506, rx: 62, ry: 17 },
  { drum: "ride", label: "Ride cymbal", cx: 817, cy: 543, rx: 72, ry: 29 },
  { drum: "crash", label: "Crash cymbal", cx: 636, cy: 490, rx: 66, ry: 19 },
  { drum: "hihat", label: "Hi-hat", cx: 678, cy: 597, rx: 59, ry: 18 },
];

/** The part of the photo that covers a w×h box, like `object-fit: cover`. */
function coverViewBox(w: number, h: number) {
  if (!w || !h) return `0 0 ${SIZE} ${SIZE}`;
  if (w >= h) {
    const vh = (SIZE * h) / w;
    return `0 ${(SIZE - vh) * FOCUS_Y} ${SIZE} ${vh}`;
  }
  const vw = (SIZE * w) / h;
  return `${(SIZE - vw) * FOCUS_X} 0 ${vw} ${SIZE}`;
}

export function HomePage() {
  const ref = useRef<HTMLElement>(null);
  const [viewBox, setViewBox] = useState(coverViewBox(0, 0));
  const [lit, setLit] = useState<Drum | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => entry && setViewBox(coverViewBox(entry.contentRect.width, entry.contentRect.height)));
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer.current);
    };
  }, []);

  const play = (drum: Drum) => {
    hit(drum);
    setLit(drum);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLit(null), 120);
  };

  return (
    // Fills the whole screen; the app shell lays the nav over its top edge.
    <section ref={ref} className="grid grid-rows-[minmax(0,1fr)] overflow-hidden bg-black [grid-area:1/1]">
      <svg viewBox={viewBox} preserveAspectRatio="xMaxYMid slice" className="block size-full [grid-area:1/1]">
        <title>A dark studio just after a session. Tap the drums to play them.</title>
        <image href={studio} width={SIZE} height={SIZE} />
        {PADS.map(({ drum, label, ...shape }) => (
          <ellipse
            key={drum}
            {...shape}
            role="button"
            tabIndex={0}
            aria-label={label}
            onPointerDown={() => play(drum)}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), play(drum))}
            className={`cursor-pointer outline-none transition-[fill] duration-200 ease-in-out hover:fill-white/[0.07] focus-visible:fill-white/[0.1] ${lit === drum ? "fill-white/30" : "fill-transparent"}`}
          />
        ))}
      </svg>
      {/* Darken the edges, and the top more so the nav reads over the photo. */}
      <div className="pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_60%,rgb(0_0_0/0.7))] [grid-area:1/1]" />
      <div className="pointer-events-none bg-gradient-to-b from-black/70 to-transparent to-[18%] [grid-area:1/1]" />
      <div className="pointer-events-none flex items-end justify-center pb-[6vh] [grid-area:1/1]">
        <Link
          to="/gym"
          className="pointer-events-auto rounded-full border border-white/25 bg-black/40 px-5 py-2 text-[14px] font-[560] tracking-wide text-white/85 backdrop-blur-sm transition duration-200 ease-in-out hover:border-white/60 hover:text-white"
        >
          Pick it up →
        </Link>
      </div>
    </section>
  );
}
