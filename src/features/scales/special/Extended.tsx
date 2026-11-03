import type { Dot, Shape } from "@/content/types";
import { Fretboard } from "@/components/Fretboard";
import { PlayButton, cardClass } from "@/components/ui";
import { playSequence, toggle } from "@/audio/playback";
import { scaleRun, shapeNotes } from "@/music/shapes";
import { noteAt, STRINGS, type Finger, type StringNum } from "@/music/theory";
import { ShapePanel } from "../ShapePanel";

const SCALE = new Set(["A", "C", "D", "E", "G"]);
const inScale = (s: StringNum, f: number) => SCALE.has(noteAt(s, f));

/** Every A minor pentatonic note from the nut to fret 17. */
const NECK: Shape = {
  startFret: 1,
  frets: 17,
  nut: true,
  root: "A",
  open: STRINGS.filter(s => inScale(s, 0)),
  dots: STRINGS.flatMap(s => Array.from({ length: 17 }, (_, i) => i + 1).filter(f => inScale(s, f)).map((f): Dot => ({ s, f, label: noteAt(s, f) }))),
};

/** The 5 connected boxes: frets per string from the 6th string to the 1st. */
export const BOXES: number[][][] = [
  [[5, 8], [5, 7], [5, 7], [5, 7], [5, 8], [5, 8]],
  [[8, 10], [7, 10], [7, 10], [7, 9], [8, 10], [8, 10]],
  [[10, 12], [10, 12], [10, 12], [9, 12], [10, 13], [10, 12]],
  [[12, 15], [12, 15], [12, 14], [12, 14], [13, 15], [12, 15]],
  [[15, 17], [15, 17], [14, 17], [14, 17], [15, 17], [15, 17]],
];

export function boxShape(frets: number[][]): Shape {
  const min = Math.min(...frets.flat());
  return {
    startFret: min,
    root: "A",
    dots: frets.flatMap((fs, i) => fs.map((f): Dot => ({ s: (6 - i) as StringNum, f, finger: Math.min(4, f - min + 1) as Finger }))),
  };
}

/** Box 1 plus the box 2 note on each string: slide up to change box. */
const RUN: [StringNum, number[]][] = [[6, [5, 8, 10]], [5, [5, 7, 10]], [4, [5, 7, 10]], [3, [5, 7, 9]], [2, [5, 8, 10]], [1, [5, 8, 10]]];
const RUN_SHAPE: Shape = { startFret: 5, frets: 6, root: "A", dots: RUN.flatMap(([s, fs]) => fs.map((f): Dot => ({ s, f, label: noteAt(s, f) }))) };
const RUN_UP = RUN.flatMap(([s, fs]) => fs.map(f => shapeNotes(RUN_SHAPE).find(n => n.s === s && n.f === f)!));

export function Extended() {
  return (
    <div className="grid gap-5">
      <ShapePanel shape={NECK} title="The whole neck: frets 0–17" subtitle="Ringed notes are A, the root. Scroll sideways on a phone." playId="ext:neck" steps={false}>
        <p className="mt-3 text-[13.5px] text-muted">The 5 boxes below fit together like puzzle pieces: the right-hand notes of one box are the left-hand notes of the next. Learn box 1, then add box 2, and so on.</p>
      </ShapePanel>

      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="mb-3.5">
          <div className="text-base font-[620]">The 5 connected boxes</div>
          <div className="text-[13px] text-muted">Numbers are suggested fingers</div>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
          {BOXES.map((b, i) => {
            const shape = boxShape(b);
            const playId = `ext:box${i + 1}`;
            return (
              <div key={i} className="rounded-xl border border-line p-3.5 pb-2">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-semibold">Box {i + 1}</span>
                  <span className="text-[13px] text-muted">Frets {shape.startFret}–{Math.max(...b.flat())}</span>
                </div>
                <Fretboard shape={shape} scope={playId} />
                <PlayButton playId={playId} onPlay={() => toggle(playId, () => playSequence(playId, scaleRun(shape)))} title={`Play box ${i + 1}`} />
              </div>
            );
          })}
        </div>
      </div>

      <ShapePanel shape={RUN_SHAPE} title="Extended run: box 1 → box 2" subtitle="Three notes per string, sliding up to change box" playId="ext:run" steps={false}>
        <div className="mt-2">
          <PlayButton
            playId="ext:run"
            label="Play the run"
            title="Play the run"
            onPlay={() => toggle("ext:run", () => playSequence("ext:run", RUN_UP.concat([...RUN_UP].reverse().slice(1)), 0.24))}
          />
        </div>
        <code className="mt-3 block overflow-x-auto whitespace-nowrap rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-[13px]">
          {RUN.map(([s, fs]) => `${s}: ${fs.join(".")}`).join("  →  ")}
        </code>
        <p className="mt-3 text-[13.5px] text-muted">Play the first two notes on each string with fingers 1 and 3 (or 4), then <b className="font-semibold text-ink-2">slide</b> finger 3 up to the third note. You end up in box 2 and can keep climbing.</p>
      </ShapePanel>
    </div>
  );
}
