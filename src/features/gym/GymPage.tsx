// The gym: every practice area, grouped into sections from warm-up to playing along.
import { Link } from "react-router";
import { PageHeader, Section } from "@/components/ui";
import { useProgress } from "@/progress/hooks";
import { SKILLS } from "@/skills/registry";
import { AlbumCard } from "./AlbumCard";
import type { Art, Palette } from "./covers";

interface Area {
  title: string;
  blurb: string;
  to: string;
  /** The album's cover motif and colours. */
  art: Art;
  palette: Palette;
  /** Path units whose skills count towards this area's progress. */
  units: string[];
}

const GYM_SECTIONS: { title: string; note: string; areas: Area[] }[] = [
  {
    title: "Warm up",
    note: "Loosen up before you play.",
    areas: [{ title: "Warm-ups", blurb: "Spider walks, trills and stretches for finger independence.", to: "/warmups", art: "rings", palette: { bg: "from-[#1f0b04] to-[#c2410c]", ink: "text-[#fed7aa]", label: "fill-[#ea580c]" }, units: ["Warm-ups"] }],
  },
  {
    title: "Notes and picking",
    note: "Know the neck, and pick single strings.",
    areas: [
      { title: "Note finder", blurb: "Name any note on the neck, one string at a time.", to: "/fretboard", art: "inlays", palette: { bg: "from-[#021b1b] to-[#0f766e]", ink: "text-[#99f6e4]", label: "fill-[#14b8a6]" }, units: ["Fretboard notes"] },
      { title: "Fingerpicking", blurb: "Thumb and finger patterns, from steady bass to Travis picking.", to: "/fingerpicking", art: "picking", palette: { bg: "from-[#150b26] to-[#6d28d9]", ink: "text-[#ddd6fe]", label: "fill-[#8b5cf6]" }, units: ["Fingerpicking"] },
    ],
  },
  {
    title: "Chords",
    note: "Shapes, changes between them, and rhythm.",
    areas: [
      { title: "Chords", blurb: "Open, blues and power chords, recalled faster each time.", to: "/chords?group=basic", art: "chordBox", palette: { bg: "from-[#1a1003] to-[#b45309]", ink: "text-[#fde68a]", label: "fill-[#f59e0b]" }, units: ["Open chords", "Blues chords", "Shuffles", "Power chords"] },
      { title: "Barre chords", blurb: "Mini barres first, then full E and A shapes.", to: "/chords?group=barre", art: "barre", palette: { bg: "from-[#22040a] to-[#be123c]", ink: "text-[#fecdd3]", label: "fill-[#e11d48]" }, units: ["Barre chords"] },
      { title: "Transitions", blurb: "One-minute changes between chords you know.", to: "/transitions", art: "changes", palette: { bg: "from-[#061026] to-[#1d4ed8]", ink: "text-[#bfdbfe]", label: "fill-[#3b82f6]" }, units: ["Changes"] },
      { title: "Strumming", blurb: "Patterns from steady downs to 16th-note grooves.", to: "/strumming", art: "strums", palette: { bg: "from-[#07170a] to-[#15803d]", ink: "text-[#bbf7d0]", label: "fill-[#22c55e]" }, units: ["Strumming"] },
    ],
  },
  {
    title: "Scales and arpeggios",
    note: "Single-note lines in time.",
    areas: [
      { title: "Scales", blurb: "Pentatonic, blues and major scales, up and down in time.", to: "/scales", art: "steps", palette: { bg: "from-[#1c0619] to-[#a21caf]", ink: "text-[#f5d0fe]", label: "fill-[#d946ef]" }, units: ["Scales"] },
      { title: "Arpeggios", blurb: "The notes of a chord, one at a time, in movable shapes.", to: "/arpeggios", art: "arc", palette: { bg: "from-[#031a22] to-[#0e7490]", ink: "text-[#a5f3fc]", label: "fill-[#06b6d4]" }, units: ["Arpeggios"] },
    ],
  },
  {
    title: "Play along",
    note: "Put it together over a progression.",
    areas: [{ title: "Progression play-along", blurb: "Common progressions with a count-in and a backing strum.", to: "/progressions", art: "beams", palette: { bg: "from-[#050505] to-[#52525b]", ink: "text-[#f4f4f5]", label: "fill-[#a1a1aa]" }, units: ["Play-along"] }],
  },
];

/** Every area in page order, so each album gets its number in the series. */
const ALL_AREAS = GYM_SECTIONS.flatMap(sec => sec.areas);

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
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {sec.areas.map(a => {
              const n = ALL_AREAS.indexOf(a);
              return <AlbumCard key={a.title} {...a} {...learned(a.units)} num={n + 1} index={n} />;
            })}
          </div>
        </Section>
      ))}
    </>
  );
}
