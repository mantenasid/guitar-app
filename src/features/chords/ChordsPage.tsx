import { useState } from "react";
import { Link } from "react-router";
import { CHORD_GROUPS } from "@/content";
import { CardGrid, DiagramLegend, PageHeader, Section, Tabs, TargetBar, cardClass } from "@/components/ui";
import { useProgress } from "@/progress/hooks";
import { ALL_PAIRS, CHANGE_LEVELS, CHANGE_TARGET, pairProgress, suggestedPairs, summarise } from "@/skills/changes";
import { ChordCard } from "./ChordCard";

function ChangeGoal() {
  const skills = useProgress().skills;
  const sum = summarise(ALL_PAIRS, skills);
  const next = suggestedPairs(skills, 3);
  const lowest = Math.min(...ALL_PAIRS.map(p => pairProgress(skills, p.a, p.b).level));
  return (
    <div className={`${cardClass} mb-11 flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4`}>
      <div className="min-w-[220px] flex-1 text-sm text-muted">
        <b className="font-semibold text-ink">Change target: {CHANGE_TARGET} a minute.</b> Levels at {CHANGE_LEVELS.join(" / ")}. {sum.mastered} of {sum.total} pairs mastered · average speed {sum.average}
      </div>
      <TargetBar value={sum.average} level={lowest} className="w-40" />
      <div className="w-full text-[13.5px] text-muted">
        {next.length ? "Next up: " : "Every pair is mastered."}
        {next.map((p, i) => (
          <span key={p.key}>
            {i > 0 && " · "}
            <Link to={`/transitions?pair=${encodeURIComponent(`${p.a}|${p.b}`)}`} className="font-medium text-ink hover:text-accent">
              {p.a} ↔ {p.b}
            </Link>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ChordsPage() {
  const [filter, setFilter] = useState("all");
  const skills = useProgress().skills;
  return (
    <>
      <PageHeader
        title="Chords"
        lead="28 shapes, from the first open chords to movable power chords. Tap any dot to hear it."
        aside={
          <Tabs
            value={filter}
            onChange={setFilter}
            options={[{ value: "all", label: "All" }, ...CHORD_GROUPS.map(g => ({ value: g.id, label: g.title.replace(" chords", "") }))]}
          />
        }
      >
        <DiagramLegend extra="Shuffle bounce" />
      </PageHeader>

      <ChangeGoal />

      {CHORD_GROUPS.filter(g => filter === "all" || g.id === filter).map(g => (
        <Section key={g.id} title={g.title} note={g.note}>
          {g.sections.map(s => (
            <div key={s.title}>
              <div className="mt-6 mb-3 text-[13px] text-muted first:mt-0">{s.title}</div>
              <CardGrid>
                {s.chords.map(c => (
                  <ChordCard key={c.key} chord={c} skills={skills} />
                ))}
              </CardGrid>
            </div>
          ))}
        </Section>
      ))}
    </>
  );
}
