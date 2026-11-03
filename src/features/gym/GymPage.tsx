// The gym: every practice area, grouped into sections from warm-up to playing along.
import { Link } from "react-router";
import { PageHeader, Section, cardClass } from "@/components/ui";
import { useProgress } from "@/progress/hooks";
import { SKILLS } from "@/skills/registry";

interface Area {
  title: string;
  blurb: string;
  /** Unset while the area is still being built. */
  to?: string;
  /** Path units whose skills count towards this area's progress. */
  units: string[];
}

const GYM_SECTIONS: { title: string; note: string; areas: Area[] }[] = [
  {
    title: "Warm up",
    note: "Loosen up before you play.",
    areas: [{ title: "Warm-ups", blurb: "Spider walks, trills and stretches for finger independence.", to: "/warmups", units: ["Warm-ups"] }],
  },
  {
    title: "Notes and picking",
    note: "Know the neck, and pick single strings.",
    areas: [
      { title: "Note finder", blurb: "Name any note on the neck, one string at a time.", to: "/fretboard", units: ["Fretboard notes"] },
      { title: "Fingerpicking", blurb: "Thumb and finger patterns, from steady bass to Travis picking.", to: "/fingerpicking", units: ["Fingerpicking"] },
    ],
  },
  {
    title: "Chords",
    note: "Shapes, changes between them, and rhythm.",
    areas: [
      { title: "Chords", blurb: "Open, blues and power chords, recalled faster each time.", to: "/chords?group=basic", units: ["Open chords", "Blues chords", "Shuffles", "Power chords"] },
      { title: "Barre chords", blurb: "Mini barres first, then full E and A shapes.", to: "/chords?group=barre", units: ["Barre chords"] },
      { title: "Transitions", blurb: "One-minute changes between chords you know.", to: "/transitions", units: ["Changes"] },
      { title: "Strumming", blurb: "Patterns from steady downs to 16th-note grooves.", to: "/strumming", units: ["Strumming"] },
    ],
  },
  {
    title: "Scales and arpeggios",
    note: "Single-note lines in time.",
    areas: [
      { title: "Scales", blurb: "Pentatonic, blues and major scales, up and down in time.", to: "/scales", units: ["Scales"] },
      { title: "Arpeggios", blurb: "The notes of a chord, one at a time, in movable shapes.", to: "/arpeggios", units: ["Arpeggios"] },
    ],
  },
  {
    title: "Play along",
    note: "Put it together over a progression.",
    areas: [{ title: "Progression play-along", blurb: "Common progressions with a count-in and a backing strum.", to: "/progressions", units: ["Play-along"] }],
  },
];

export default function GymPage() {
  const { skills } = useProgress();
  const learned = (units: string[]) => {
    const list = SKILLS.filter(s => units.includes(s.unit));
    return { done: list.filter(s => (skills.get(s.id)?.level ?? 0) >= 1).length, total: list.length };
  };

  return (
    <>
      <PageHeader
        title="Gym"
        lead="Work through it top to bottom: warm up, then notes, chords, scales, and finish by playing along."
        aside={
          <Link to="/path" className="text-[13.5px] font-medium text-muted hover:text-ink">
            See the whole path →
          </Link>
        }
      />
      {GYM_SECTIONS.map((sec, i) => (
        <Section key={sec.title} num={i + 1} title={sec.title} note={sec.note}>
          <div className="grid gap-3 sm:grid-cols-2">
            {sec.areas.map(a => {
              const { done, total } = learned(a.units);
              const body = (
                <>
                  <h3 className="text-[17px] font-[620] tracking-[-0.01em]">{a.title}</h3>
                  <p className="flex-1 text-sm text-muted">{a.blurb}</p>
                  <div className="mt-2 text-[13px] text-muted">
                    {!a.to ? "Coming soon" : total ? (
                      <>
                        <b className="font-[550] text-ink">{done}</b> of {total} learned
                      </>
                    ) : null}
                  </div>
                  {a.to && total > 0 && (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                      <span className="block h-full rounded-full bg-good" style={{ width: `${(done / total) * 100}%` }} />
                    </div>
                  )}
                </>
              );
              return a.to ? (
                <Link key={a.title} to={a.to} className={`${cardClass} flex min-h-[148px] flex-col gap-1.5 p-5 transition hover:-translate-y-px hover:border-line-2`}>
                  {body}
                </Link>
              ) : (
                <div key={a.title} className={`${cardClass} flex min-h-[148px] flex-col gap-1.5 p-5 opacity-60`}>
                  {body}
                </div>
              );
            })}
          </div>
        </Section>
      ))}
    </>
  );
}
