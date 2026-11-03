// Arpeggios: chord tones one at a time in movable shapes, with degrees on the neck, claimed at a tempo.
import { useSearchParams } from "react-router";
import { Fretboard } from "@/components/Fretboard";
import { TempoChallenge } from "@/components/TempoChallenge";
import { DrillWindow } from "@/components/DrillWindow";
import { drillOptions } from "@/components/DrillTabs";
import { PageHeader, PlayButton } from "@/components/ui";
import { playSequence, toggle } from "@/audio/playback";
import { ARPEGGIOS, ARPEGGIO_BY_ID, type ArpStep, type Arpeggio } from "@/content/arpeggios";
import type { Dot, Shape } from "@/content/types";
import type { ShapeNote } from "@/music/shapes";
import { STRING_NAMES, midiAt } from "@/music/theory";
import { useProgress } from "@/progress/hooks";

/** Each note once, labelled with its degree; the root rings. */
function shapeFor(a: Arpeggio): Shape {
  const seen = new Map<string, Dot>();
  for (const st of a.steps) seen.set(`${st.s}:${st.f}`, { s: st.s, f: st.f, label: st.degree });
  return { startFret: a.startFret, frets: a.frets, nut: a.startFret === 1, root: a.root, dots: [...seen.values()] };
}

const toNote = (st: ArpStep): ShapeNote => ({ s: st.s, f: st.f, midi: midiAt(st.s, st.f), dot: { s: st.s, f: st.f, finger: st.finger }, isRoot: st.degree === "R", isExtra: false });

/** The way up, grouped by string, for the written-out order. */
function runs(steps: ArpStep[]) {
  const up = steps.slice(0, (steps.length + 1) / 2);
  const out: { s: ArpStep["s"]; steps: ArpStep[] }[] = [];
  for (const st of up) {
    const last = out.at(-1);
    if (last && last.s === st.s) last.steps.push(st);
    else out.push({ s: st.s, steps: [st] });
  }
  return out;
}

export default function ArpeggiosPage() {
  const [params, setParams] = useSearchParams();
  const progress = useProgress();
  const unlocked = ARPEGGIOS.filter(a => progress.skills.get(`arp:${a.id}`)?.unlocked);
  const a = ARPEGGIO_BY_ID[params.get("arp") ?? ""] ?? unlocked.at(-1) ?? ARPEGGIOS[0]!;
  const playId = `arp:${a.id}`;

  return (
    <>
      <PageHeader title="Arpeggios" lead="The notes of a chord, one at a time. Learn each shape with its degrees, then slide it up or down the neck for any key. Up to the top root and back down, then claim the tempo." />
      <DrillWindow
        value={a.id}
        options={drillOptions(progress, ARPEGGIOS, x => `arp:${x.id}`)}
        onChange={id => setParams({ arp: id })}
        side={<TempoChallenge key={a.id} bare skillId={playId} hint="One note per click, up to the top root and back down. Let each note stop as the next one sounds." />}
      >
        <div className="p-5 sm:p-6">
        <div className="mb-3.5">
          <div className="text-base font-[620] tracking-[-0.01em]">
            {a.title} <span className="font-normal text-muted">· shown as {a.chord}</span>
          </div>
          <div className="text-[13px] text-muted">{a.tag}</div>
        </div>
        <div className="overflow-x-auto pb-1">
          <Fretboard shape={shapeFor(a)} scope={playId} fluid className="max-w-[440px]" />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <PlayButton playId={playId} onPlay={() => toggle(playId, () => playSequence(playId, a.steps.map(toNote), 0.32))} label="Hear it" title="Hear the arpeggio up and down" />
          <span className="text-[12.5px] text-faint">{a.steps.length} notes, up and back down</span>
        </div>
        <p className="mt-3 text-[14px] text-ink-2">{a.tip}</p>

        <div className="mt-4 grid gap-1 text-[12.5px] text-muted">
          <span>Going up (fret, finger, degree)</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg bg-surface-2 px-3 py-2.5">
            {runs(a.steps).map((r, i) => (
              <span key={i} className="inline-flex items-baseline gap-1.5">
                <span className="text-[11.5px] text-faint">{STRING_NAMES[r.s]}</span>
                <span className="inline-flex gap-1.5 font-mono text-[13px] text-ink">
                  {r.steps.map((st, j) => (
                    <span key={j} className="inline-flex flex-col items-center leading-tight">
                      {st.f}
                      <span className="text-[10.5px] text-faint">{st.finger}</span>
                      <span className={`text-[10.5px] ${st.degree === "R" ? "text-accent" : "text-faint"}`}>{st.degree}</span>
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </div>
        </div>
        </div>
      </DrillWindow>
    </>
  );
}
