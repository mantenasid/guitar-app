import { Link } from "react-router";
import { SCALE_GROUPS } from "@/content";
import type { Scale } from "@/content/types";
import { Fretboard } from "@/components/Fretboard";
import { CardGrid, DiagramLegend, PageHeader, PlayButton, Section, TickButton, cardClass } from "@/components/ui";
import { playSequence, toggle } from "@/audio/playback";
import { scaleRun } from "@/music/shapes";

function ScaleCard({ scale }: { scale: Scale }) {
  const playId = `scale-card:${scale.id}`;
  return (
    <Link to={`/scales/${scale.id}`} className={`${cardClass} px-4 pt-4 pb-3 transition hover:-translate-y-px hover:border-line-2`}>
      <div className="mb-2.5 text-base font-[620] tracking-[-0.01em]">
        <span className="mr-1.5 font-normal tabular-nums text-faint">{scale.num}</span>
        {scale.name}
      </div>
      <Fretboard shape={scale.card} scope={playId} />
      <div className="mt-1.5 flex items-center justify-between">
        <PlayButton playId={playId} onPlay={() => toggle(playId, () => playSequence(playId, scaleRun(scale.card)))} title="Play up and down" />
        <TickButton skillId={`scale:${scale.id}`} />
      </div>
    </Link>
  );
}

const FORMULAS = [
  ["Minor pentatonic", "1 b3 4 5 b7"],
  ["Minor blues", "1 b3 4 b5 5 b7"],
  ["Major pentatonic", "1 2 3 5 6"],
  ["Major blues", "1 2 b3 3 5 6"],
  ["Major", "W W H W W W H"],
  ["Natural minor", "W H W W H W W"],
];
const RELATIVES = [
  ["E min = G maj", "E G A B D"],
  ["A min = C maj", "A C D E G"],
  ["D min = F maj", "D F G A C"],
  ["F# min = A maj", "A B C# E F#"],
  ["B min = D maj", "D E F# A B"],
  ["G min = Bb maj", "G Bb C D F"],
];

function KeyList({ rows }: { rows: string[][] }) {
  return (
    <div className="border-t border-line">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3.5 border-b border-line px-0.5 py-[11px] text-sm">
          <span className="font-semibold">{k}</span>
          <span className="text-right font-mono text-[13px] text-ink-2">{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function ScalesPage() {
  return (
    <>
      <PageHeader title="Scales" lead="16 scales, easiest first. Open one to walk through its notes with the mic, then take it up the tempo ladder.">
        <DiagramLegend extra="Blue note" />
      </PageHeader>

      {SCALE_GROUPS.map((g, i) => (
        <Section key={g.id} num={i + 1} title={g.title} note={g.note}>
          <CardGrid>
            {g.scales.map(s => (
              <ScaleCard key={s.id} scale={s} />
            ))}
          </CardGrid>
        </Section>
      ))}

      <Section title="Formulas & keys" note="How each scale is built, and which keys share notes.">
        <div className="grid gap-x-10 md:grid-cols-2">
          <KeyList rows={FORMULAS} />
          <KeyList rows={RELATIVES} />
        </div>
      </Section>
    </>
  );
}
