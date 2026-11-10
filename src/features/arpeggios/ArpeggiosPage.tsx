// Arpeggios: chord tones one at a time in movable shapes, with degrees on the neck, played up a tempo ladder.
import { useSearchParams } from "react-router";
import { Fretboard } from "@/components/Fretboard";
import { ClickDrill } from "@/components/TempoDrill";
import { DrillTip, DrillTitle, DrillWindow } from "@/components/DrillWindow";
import { NoteWalk } from "@/components/NoteWalk";
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
      <PageHeader title="Arpeggios" lead="The notes of a chord, one at a time. Learn each shape with its degrees, then slide it up or down the neck for any key. Up to the top root and back down, in time." />
      <DrillWindow
        value={a.id}
        options={drillOptions(progress, ARPEGGIOS, x => `arp:${x.id}`)}
        onChange={id => setParams({ arp: id })}
        side={<ClickDrill key={a.id} skillId={playId} hint="One note per click, up to the top root and back down. Let each note stop as the next one sounds." />}
      >
        <DrillTitle title={a.title} sub={`Shown as ${a.chord} · ${a.tag} · ${a.steps.length} notes, up and back down`} />
        <div className="overflow-x-auto pb-1">
          <Fretboard shape={shapeFor(a)} scope={playId} fluid className="mx-auto max-w-[560px]" />
        </div>
        <div className="mt-3 flex flex-col items-center gap-3">
          <PlayButton playId={playId} onPlay={() => toggle(playId, () => playSequence(playId, a.steps.map(toNote), 0.32))} label="Hear it" title="Hear the arpeggio up and down" />
          <NoteWalk key={a.id} notes={a.steps.map(toNote)} scope={playId} />
        </div>
        <DrillTip>{a.tip}</DrillTip>

        <details className="mx-auto mt-5 max-w-[640px] text-[12.5px] text-muted">
          <summary className="cursor-pointer text-center text-[13px] hover:text-ink">Going up, written out (fret, finger, degree)</summary>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 rounded-lg bg-surface-2 px-3 py-2.5">
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
        </details>
      </DrillWindow>
    </>
  );
}
