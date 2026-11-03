import type { Dot, Shape } from "@/content/types";
import type { Finger, StringNum } from "@/music/theory";
import { ShapePanel } from "../ShapePanel";

// Natural notes in frets 0–3, labelled by finger (fret 1 = index, 2 = middle, 3 = ring).
const NATURAL: Shape = {
  startFret: 1,
  nut: true,
  open: [1, 2, 3, 4, 5, 6],
  root: "C",
  dots: (
    [[6, 1], [6, 3], [5, 2], [5, 3], [4, 2], [4, 3], [3, 2], [2, 1], [2, 3], [1, 1], [1, 3]] as [StringNum, number][]
  ).map(([s, f]): Dot => ({ s, f, finger: f as Finger })),
};

// The 1-2-3-4 warm-up: every fret 1–4 on every string.
const WARM_UP: Shape = {
  startFret: 1,
  nut: true,
  dots: ([6, 5, 4, 3, 2, 1] as StringNum[]).flatMap(s => ([1, 2, 3, 4] as Finger[]).map((f): Dot => ({ s, f, finger: f }))),
};

export function FirstPosition() {
  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      <ShapePanel shape={NATURAL} title="Natural notes, frets 0–3" subtitle="C is ringed: say each note name as you play it" playId="first:natural">
        <p className="mt-3 text-[13.5px] text-muted">Fret 1 = index, fret 2 = middle, fret 3 = ring. Your hand never moves.</p>
      </ShapePanel>
      <ShapePanel shape={WARM_UP} title="1-2-3-4 finger warm-up" subtitle="One finger per fret, every string" playId="first:warmup">
        <p className="mt-3 text-[13.5px] text-muted">Keep each finger down until you need it again. Clean and slow first, then speed up.</p>
      </ShapePanel>
    </div>
  );
}
