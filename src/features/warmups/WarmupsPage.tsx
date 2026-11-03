// Warm-ups: finger independence and stretch, played one note per click and claimed at a tempo.
import { useSearchParams } from "react-router";
import { Fretboard } from "@/components/Fretboard";
import { TempoChallenge } from "@/components/TempoChallenge";
import { DrillWindow } from "@/components/DrillWindow";
import { drillOptions } from "@/components/DrillTabs";
import { PageHeader, PlayButton } from "@/components/ui";
import { playSequence, toggle } from "@/audio/playback";
import { WARMUPS, WARMUP_BY_ID, type Warmup, type WarmupStep } from "@/content/warmups";
import type { Dot, Shape } from "@/content/types";
import type { ShapeNote } from "@/music/shapes";
import { STRING_NAMES, midiAt } from "@/music/theory";
import { useProgress } from "@/progress/hooks";

function shapeFor(w: Warmup): Shape {
  const seen = new Map<string, Dot>();
  for (const st of w.steps) seen.set(`${st.s}:${st.f}`, { s: st.s, f: st.f, finger: st.finger });
  return { startFret: w.startFret, frets: w.frets, nut: w.startFret === 1, dots: [...seen.values()] };
}

const toNote = (st: WarmupStep): ShapeNote => ({ s: st.s, f: st.f, midi: midiAt(st.s, st.f), dot: { s: st.s, f: st.f, finger: st.finger }, isRoot: false, isExtra: false });

/** Consecutive steps on the same string, for the written-out order. */
function runs(steps: WarmupStep[]) {
  const out: { s: WarmupStep["s"]; steps: WarmupStep[] }[] = [];
  for (const st of steps) {
    const last = out.at(-1);
    if (last && last.s === st.s) last.steps.push(st);
    else out.push({ s: st.s, steps: [st] });
  }
  return out;
}

export default function WarmupsPage() {
  const [params, setParams] = useSearchParams();
  const progress = useProgress();
  const unlocked = WARMUPS.filter(w => progress.skills.get(`warmup:${w.id}`)?.unlocked);
  const w = WARMUP_BY_ID[params.get("ex") ?? ""] ?? unlocked.at(-1) ?? WARMUPS[0]!;
  const playId = `warmup:${w.id}`;

  return (
    <>
      <PageHeader title="Warm-ups" lead="A few minutes before you practise. Each finger gets its own fret, so the weak ones catch up. Go slow and clean, then claim the tempo." />
      <DrillWindow
        value={w.id}
        options={drillOptions(progress, WARMUPS, x => `warmup:${x.id}`)}
        onChange={id => setParams({ ex: id })}
        side={<TempoChallenge key={w.id} bare skillId={playId} hint="One note per click, every note clean and ringing. Lift each finger only when the next one lands." />}
      >
        <div className="p-5 sm:p-6">
        <div className="mb-3.5">
          <div className="text-base font-[620] tracking-[-0.01em]">{w.title}</div>
          <div className="text-[13px] text-muted">{w.tag}</div>
        </div>
        <div className="overflow-x-auto pb-1">
          <Fretboard shape={shapeFor(w)} scope={playId} fluid className={w.frets > 6 ? "" : "max-w-[440px]"} />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <PlayButton playId={playId} onPlay={() => toggle(playId, () => playSequence(playId, w.steps.map(toNote), 0.32))} label="Hear it" title="Hear the exercise" />
          <span className="text-[12.5px] text-faint">{w.steps.length} notes, one per click</span>
        </div>
        <p className="mt-3 text-[14px] text-ink-2">{w.tip}</p>

        <div className="mt-4 grid gap-1 text-[12.5px] text-muted">
          <span>Order (fret, finger underneath)</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg bg-surface-2 px-3 py-2.5">
            {runs(w.steps).map((r, i) => (
              <span key={i} className="inline-flex items-baseline gap-1.5">
                <span className="text-[11.5px] text-faint">{STRING_NAMES[r.s]}</span>
                <span className="inline-flex gap-1 font-mono text-[13px] text-ink">
                  {r.steps.map((st, j) => (
                    <span key={j} className="inline-flex flex-col items-center leading-tight">
                      {st.f}
                      <span className="text-[10.5px] text-faint">{st.finger}</span>
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
