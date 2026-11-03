import { useState } from "react";
import type { Shape } from "@/content/types";
import { Tabs, cardClass } from "@/components/ui";
import { stopPlayback } from "@/audio/playback";
import { transpose, spellFlat, type Finger, type NoteName, type StringNum } from "@/music/theory";
import { ShapePanel } from "../ShapePanel";

/** Box 1 relative to the root fret: [string, fret offset, finger]. */
const BOX: [StringNum, number, Finger][] = [[6, 0, 1], [6, 3, 4], [5, 0, 1], [5, 2, 3], [4, 0, 1], [4, 2, 3], [3, 0, 1], [3, 2, 3], [2, 0, 1], [2, 3, 4], [1, 0, 1], [1, 3, 4]];

export const KEYS: { key: NoteName; fret: number; why?: string }[] = [
  { key: "E", fret: 12, why: "Most common rock & blues key" },
  { key: "F#", fret: 2 },
  { key: "G", fret: 3 },
  { key: "A", fret: 5, why: "The classic blues box" },
  { key: "B", fret: 7 },
  { key: "C", fret: 8 },
  { key: "D", fret: 10 },
];

const PENTATONIC = [0, 3, 5, 7, 10];
/** G minor and C minor are written with flats (Bb, Eb). */
const FLAT_KEYS: NoteName[] = ["G", "C"];
export const spellIn = (key: NoteName) => (n: string) => (FLAT_KEYS.includes(key) ? spellFlat(n as NoteName) : n);
export const keyNotes = (key: NoteName) => PENTATONIC.map(i => spellIn(key)(transpose(key, i)));

export function boxAt(key: NoteName, fret: number): Shape {
  return { startFret: fret, root: key, dots: BOX.map(([s, o, finger]) => ({ s, f: fret + o, finger })) };
}

export function PopularKeys() {
  const [key, setKey] = useState<NoteName>("A");
  const k = KEYS.find(x => x.key === key)!;
  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      <div className="min-w-0">
        <div className="mb-3">
          <Tabs
            value={key}
            onChange={v => {
              stopPlayback();
              setKey(v);
            }}
            options={KEYS.map(x => ({ value: x.key, label: `${x.key}m` }))}
          />
        </div>
        <ShapePanel
          shape={boxAt(k.key, k.fret)}
          title={`${k.key} minor pentatonic`}
          subtitle={`Box 1 at fret ${k.fret}${k.why ? ` · ${k.why}` : ""}`}
          playId={`keys:${k.key}`}
          spell={spellIn(k.key)}
        />
      </div>
      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="mb-3.5">
          <div className="text-base font-[620]">Where to put finger 1</div>
          <div className="text-[13px] text-muted">Same shape, different fret</div>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              {["Key", "6th-string fret", "Notes", "Relative major"].map(h => <th key={h} className="border-b border-line px-1.5 py-2 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {KEYS.map(x => (
              <tr key={x.key} className={x.key === key ? "bg-surface-2" : ""}>
                <td className="border-b border-line px-1.5 py-2 font-semibold">{x.key}m</td>
                <td className="border-b border-line px-1.5 py-2">Fret {x.fret}</td>
                <td className="border-b border-line px-1.5 py-2">{keyNotes(x.key).join(" ")}</td>
                <td className="border-b border-line px-1.5 py-2">{spellIn(x.key)(transpose(x.key, 3))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[13.5px] text-muted">The box never changes. Find the key's root on the 6th string, put your index finger there, and play box 1 from that fret.</p>
        <p className="mt-3 text-[13.5px] text-muted"><b className="font-semibold text-ink-2">E minor</b> also works in open position (frets 0–3): see scale 2.</p>
      </div>
    </div>
  );
}
