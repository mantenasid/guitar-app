import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { hit, type Drum } from "@/audio/drums";
import { glassClass } from "@/components/ui";
import { useDark } from "@/progress/settings";
import day from "./day.webp";
import studio from "./studio.webp";

interface Pad {
  drum: Drum;
  label: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

interface Scene {
  src: string;
  title: string;
  /** The photo's size, in the SVG's units. */
  w: number;
  h: number;
  /** How far across and down to keep in view when the screen crops the photo: the drum kit is on the right. */
  focusX: number;
  focusY: number;
  /** Where each drum sits in the photo. Later pads are in front, so they win where they overlap. */
  pads: Pad[];
}

/** Fetch and decode both photos ahead of time, so coming home never flashes an empty frame before the picture lands. */
export function preloadHomePhotos() {
  for (const src of [studio, day]) {
    const img = new Image();
    img.src = src;
    void img.decode().catch(() => {});
  }
}

/** The studio at night for dark mode, and open to the hills by day for light mode. */
const NIGHT: Scene = {
  src: studio,
  title: "A dark studio just after a session. Tap the drums to play them.",
  w: 1024,
  h: 1024,
  focusX: 0.8,
  focusY: 0.3,
  pads: [
    { drum: "kick", label: "Kick drum", cx: 655, cy: 675, rx: 50, ry: 64 },
    { drum: "floorTom", label: "Floor tom", cx: 895, cy: 640, rx: 62, ry: 40 },
    { drum: "rackTom", label: "Tom", cx: 716, cy: 565, rx: 46, ry: 30 },
    { drum: "snare", label: "Snare", cx: 778, cy: 660, rx: 62, ry: 40 },
    { drum: "splash", label: "Splash cymbal", cx: 919, cy: 506, rx: 62, ry: 17 },
    { drum: "ride", label: "Ride cymbal", cx: 817, cy: 543, rx: 72, ry: 29 },
    { drum: "crash", label: "Crash cymbal", cx: 636, cy: 490, rx: 66, ry: 19 },
    { drum: "hihat", label: "Hi-hat", cx: 678, cy: 597, rx: 59, ry: 18 },
  ],
};

const DAY: Scene = {
  src: day,
  title: "A studio open to green hills on a summer morning. Tap the drums to play them.",
  w: 1376,
  h: 768,
  focusX: 0.75,
  focusY: 0.5,
  pads: [
    { drum: "kick", label: "Kick drum", cx: 885, cy: 630, rx: 48, ry: 62 },
    { drum: "rackTom", label: "Tom", cx: 935, cy: 540, rx: 46, ry: 38 },
    { drum: "floorTom", label: "Floor tom", cx: 1120, cy: 615, rx: 60, ry: 55 },
    { drum: "snare", label: "Snare", cx: 1010, cy: 598, rx: 60, ry: 36 },
    { drum: "splash", label: "Splash cymbal", cx: 1155, cy: 472, rx: 62, ry: 14 },
    { drum: "ride", label: "Ride cymbal", cx: 1040, cy: 500, rx: 70, ry: 20 },
    { drum: "crash", label: "Crash cymbal", cx: 868, cy: 452, rx: 60, ry: 14 },
    { drum: "hihat", label: "Hi-hat", cx: 925, cy: 530, rx: 55, ry: 12 },
  ],
};

/** The part of the photo that covers a w×h box, like `object-fit: cover`. */
function coverViewBox(scene: Scene, w: number, h: number) {
  if (!w || !h) return `0 0 ${scene.w} ${scene.h}`;
  if (w / h >= scene.w / scene.h) {
    const vh = (scene.w * h) / w;
    return `0 ${(scene.h - vh) * scene.focusY} ${scene.w} ${vh}`;
  }
  const vw = (scene.h * w) / h;
  return `${(scene.w - vw) * scene.focusX} 0 ${vw} ${scene.h}`;
}

export function HomePage() {
  const ref = useRef<HTMLElement>(null);
  const dark = useDark();
  const scene = dark ? NIGHT : DAY;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [lit, setLit] = useState<Drum | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => entry && setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
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
    <section ref={ref} className="grid grid-rows-[minmax(0,1fr)] overflow-hidden bg-bg [grid-area:1/1]">
      <svg viewBox={coverViewBox(scene, size.w, size.h)} preserveAspectRatio="xMaxYMid slice" className="block size-full [grid-area:1/1]">
        <title>{scene.title}</title>
        <image href={scene.src} width={scene.w} height={scene.h} />
        {scene.pads.map(({ drum, label, ...shape }) => (
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
      {/* At night, darken the edges and the top so the nav reads over the photo. By day, just a soft shade at the top so the bright
       * window frames don't fight the logo. */}
      {dark ? (
        <>
          <div className="pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_60%,rgb(0_0_0/0.7))] [grid-area:1/1]" />
          <div className="pointer-events-none bg-gradient-to-b from-black/70 to-transparent to-[18%] [grid-area:1/1]" />
        </>
      ) : (
        <div className="pointer-events-none bg-gradient-to-b from-black/35 to-transparent to-[22%] [grid-area:1/1]" />
      )}
      <div className="pointer-events-none flex items-end justify-center pb-[6vh] [grid-area:1/1]">
        <Link
          to="/gym"
          className={`pointer-events-auto rounded-full px-5 py-2 text-[14px] font-[560] tracking-wide text-ink transition duration-200 ease-in-out hover:scale-[1.03] ${glassClass}`}
        >
          Pick it up →
        </Link>
      </div>
    </section>
  );
}
