import { useEffect, useState } from "react";
import type { Shape } from "@/content/types";
import { PlayButton, cardClass } from "@/components/ui";
import { playSequence, toggle, usePlayback } from "@/audio/playback";
import { shapeNotes } from "@/music/shapes";
import type { Finger, StringNum } from "@/music/theory";
import { ShapePanel } from "../ShapePanel";

/** A minor pentatonic box 1 in pitch order, as [string, fret]. */
const BOX: [StringNum, number][] = [[6, 5], [6, 8], [5, 5], [5, 7], [4, 5], [4, 7], [3, 5], [3, 7], [2, 5], [2, 8], [1, 5], [1, 8]];

const SHAPE: Shape = { startFret: 5, root: "A", dots: BOX.map(([s, f]) => ({ s, f, finger: (f - 4) as Finger })) };
const NOTES = shapeNotes(SHAPE);
const note = ([s, f]: [StringNum, number]) => NOTES.find(n => n.s === s && n.f === f)!;

type Group = [StringNum, number][];
const groupsOf = (size: number, list: Group): Group[] =>
  Array.from({ length: list.length - size + 1 }, (_, i) => list.slice(i, i + size));
const up = BOX;
const down = [...BOX].reverse();
const both = (fn: (l: Group) => Group[]) => [...fn(up), ...fn(down)];

export const SEQUENCES: { name: string; desc: string; groups: Group[] }[] = [
  { name: "Straight up & down", desc: "The plain box: warm up first", groups: [up, down.slice(1)] },
  { name: "Groups of 3", desc: "1-2-3, 2-3-4, 3-4-5… then back down", groups: both(l => groupsOf(3, l)) },
  { name: "Groups of 4", desc: "1-2-3-4, 2-3-4-5… then back down", groups: both(l => groupsOf(4, l)) },
  { name: "Skipping", desc: "1-3, 2-4, 3-5… jump over one note", groups: both(l => groupsOf(3, l).map(g => [g[0]!, g[2]!])) },
  { name: "Pairs that climb", desc: "1-2, 2-3, 3-4…", groups: both(l => groupsOf(2, l)) },
  { name: "Triplet rolls", desc: "1-2-3-2, 2-3-4-3… a classic blues lick shape", groups: both(l => groupsOf(3, l).map(g => [g[0]!, g[1]!, g[2]!, g[1]!])) },
];

/** Index of the note sounding right now for this play id, or -1. */
function useNoteIndex(playId: string, step: number) {
  const active = usePlayback(s => s.activeId === playId);
  const [index, setIndex] = useState(-1);
  useEffect(() => {
    if (!active) return setIndex(-1);
    const start = performance.now() + 50;
    let raf = 0;
    const frame = () => {
      setIndex(Math.floor((performance.now() - start) / (step * 1000)));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, step]);
  return index;
}

function SequenceRow({ seq, i, bpm }: { seq: (typeof SEQUENCES)[number]; i: number; bpm: number }) {
  const playId = "seq:box";
  const mine = usePlayback(s => s.activeId === `${playId}:${i}`);
  // One note per 8th note at the chosen tempo.
  const step = 30 / bpm;
  const index = useNoteIndex(`${playId}:${i}`, step);
  let offset = 0;
  return (
    <div className="border-b border-line py-3">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <PlayButton
          playId={`${playId}:${i}`}
          title={`Play ${seq.name}`}
          onPlay={() => toggle(`${playId}:${i}`, () => playSequence(`${playId}:${i}`, seq.groups.flat().map(note), step))}
        />
        <span className="text-[14.5px] font-semibold">{seq.name}</span>
        <span className="text-[13px] text-muted">{seq.desc}</span>
      </div>
      <div className="font-mono text-[12.5px] leading-[1.9] text-ink-2">
        {seq.groups.map((g, gi) => {
          const from = offset;
          offset += g.length;
          const lit = mine && index >= from && index < offset;
          return (
            <span key={gi} className={`mr-3 inline-block rounded px-[3px] ${lit ? "bg-accent-soft text-accent" : ""}`}>
              {g.map(([s, f]) => `${s}.${f}`).join(" ")}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function Sequences() {
  const [bpm, setBpm] = useState(100);
  const activeId = usePlayback(s => s.activeId);
  // The box diagram lights up whichever sequence is playing.
  const scope = activeId?.startsWith("seq:box:") ? activeId : "seq:box";
  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      <ShapePanel shape={SHAPE} title="A minor pentatonic, box 1 (fret 5)" subtitle="12 notes, low to high" playId={scope} steps={false}>
        <p className="mt-3 text-[13.5px] text-muted">
          <b className="font-semibold text-ink-2">Note numbers:</b> the sequences count the box's 12 notes from 1 (low A, 6th string fret 5) to 12 (high C, 1st string fret 8). Each group is written as <em>string.fret</em>.
        </p>
        <p className="mt-3 text-[13.5px] text-muted">Use alternate picking (down-up) and only speed up once every note is clean.</p>
      </ShapePanel>
      <div className={`${cardClass} min-w-0 p-4 sm:p-5`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-base font-[620]">Sequences I</span>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            Speed <input type="range" min={60} max={200} value={bpm} onChange={e => setBpm(+e.target.value)} className="w-32" />
            <span className="tabular-nums text-ink">{bpm}</span> BPM
          </label>
        </div>
        <div className="border-t border-line">
          {SEQUENCES.map((s, i) => (
            <SequenceRow key={s.name} seq={s} i={i} bpm={bpm} />
          ))}
        </div>
      </div>
    </div>
  );
}

