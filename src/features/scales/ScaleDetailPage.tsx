import { Link, Navigate, useParams } from "react-router";
import { ALL_SCALES, SCALE_BY_ID, scaleGroupOf } from "@/content";
import type { Scale } from "@/content/types";
import { PageHeader, TickButton, cardClass } from "@/components/ui";
import { ShapePanel } from "./ShapePanel";
import { ClickDrill } from "@/components/TempoDrill";
import { FirstPosition } from "./special/FirstPosition";
import { Sequences } from "./special/Sequences";
import { PopularKeys } from "./special/PopularKeys";
import { Extended } from "./special/Extended";

const SPECIAL_INTRO: Record<NonNullable<Scale["special"]>, { title: string; meta: [string, string][] }> = {
  "first-position": { title: "First position", meta: [["Hand", "Index fret 1 · Middle 2 · Ring 3 · Little 4"], ["Notes", "C D E F G A B"]] },
  sequences: { title: "Minor pentatonic sequences", meta: [["Shape", "A minor pentatonic, box 1 at fret 5"], ["Goal", "Play the box in patterns, not just up and down"]] },
  keys: { title: "Minor pentatonic in popular keys", meta: [["Formula", "1 b3 4 5 b7"], ["Idea", "One shape, moved so finger 1 sits on the root"]] },
  extended: { title: "Minor pentatonic, extended", meta: [["Notes", "A C D E G"], ["Goal", "Break out of box 1 and use the whole neck"]] },
};

function Pager({ index }: { index: number }) {
  const prev = ALL_SCALES[index - 1];
  const next = ALL_SCALES[index + 1] ?? ALL_SCALES[0]!;
  const link = "flex max-w-[48%] flex-col gap-0.5 text-[15px] font-[550] hover:text-accent";
  return (
    <nav className="no-print mt-12 flex justify-between gap-3 border-t border-line pt-5">
      {prev ? (
        <Link to={`/scales/${prev.id}`} className={link}>
          <span className="text-[12.5px] font-normal text-muted">← Previous</span>
          {prev.name}
        </Link>
      ) : <span />}
      <Link to={`/scales/${next.id}`} className={`${link} ml-auto text-right`}>
        <span className="text-[12.5px] font-normal text-muted">{index < ALL_SCALES.length - 1 ? "Next →" : "Back to start →"}</span>
        {next.name}
      </Link>
    </nav>
  );
}

export default function ScaleDetailPage() {
  const { id = "" } = useParams();
  const scale = SCALE_BY_ID[id];
  if (!scale) return <Navigate to="/scales" replace />;
  const index = ALL_SCALES.indexOf(scale);
  const intro = scale.special ? SPECIAL_INTRO[scale.special] : { title: scale.title ?? scale.name, meta: scale.meta ?? [] };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Link to="/scales" className="hover:text-ink">Scales</Link> / {scaleGroupOf(scale.id)?.title} · {index + 1} of {ALL_SCALES.length}
          </>
        }
        title={intro.title}
        aside={<TickButton skillId={`scale:${scale.id}`} label="Learned" />}
      >
        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          {intro.meta.map(([k, v]) => (
            <span key={k}>
              {k} <b className="font-[550] text-ink">{v}</b>
            </span>
          ))}
        </div>
      </PageHeader>

      {scale.special === "first-position" && <FirstPosition />}
      {scale.special === "sequences" && <Sequences />}
      {scale.special === "keys" && <PopularKeys />}
      {scale.special === "extended" && <Extended />}
      {scale.shapes && (
        <div className="grid items-start gap-5 md:grid-cols-2">
          {scale.shapes.map((sh, i) => (
            <ShapePanel key={i} shape={sh} title={sh.title} subtitle={sh.subtitle} playId={`scale:${scale.id}:${i}`} />
          ))}
        </div>
      )}

      <div className={`${cardClass} mt-5`}>
        <ClickDrill key={scale.id} skillId={`scale:${scale.id}`} hint="Up and down the scale, one note per click, or two for an 8th-note feel." />
      </div>

      <Pager index={index} />
    </>
  );
}
