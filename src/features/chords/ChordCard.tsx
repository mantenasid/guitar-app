import { Link } from "react-router";
import type { Chord } from "@/content/types";
import { Fretboard } from "@/components/Fretboard";
import { PlayButton, TargetBar, TickButton, cardClass } from "@/components/ui";
import { playStrums, toggle } from "@/audio/playback";
import { chordVoicing, hasExtra } from "@/music/shapes";
import { ALL_PAIRS, CHANGE_LEVELS, pairProgress, type PairSkills } from "@/skills/changes";

export function strumChord(chord: Chord, playId: string) {
  toggle(playId, () => {
    const plain = chordVoicing(chord.shape);
    // Shuffle shapes alternate the held note and the bounce note.
    playStrums(playId, hasExtra(chord.shape) ? [plain, chordVoicing(chord.shape, true), plain, chordVoicing(chord.shape, true)] : [plain]);
  });
}

/** How this chord's changes are going, with a link to drill the weakest. */
function ChangeProgress({ chordKey, skills }: { chordKey: string; skills: PairSkills }) {
  const pairs = ALL_PAIRS.filter(p => p.a === chordKey || p.b === chordKey);
  if (!pairs.length) return null;
  const scored = pairs.map(p => {
    const pp = pairProgress(skills, p.a, p.b);
    return { other: p.a === chordKey ? p.b : p.a, speed: pp.current ?? 0, level: pp.level };
  });
  const weakest = [...scored].sort((x, y) => x.speed - y.speed)[0]!;
  const mastered = scored.filter(s => s.level >= CHANGE_LEVELS.length).length;
  const average = Math.round(scored.reduce((x, s) => x + s.speed, 0) / scored.length);
  const lowest = Math.min(...scored.map(s => s.level));
  return (
    <div className="mt-2.5 flex flex-col gap-2 border-t border-line pt-2.5" title={`${mastered} of ${scored.length} changes mastered · average speed ${average}`}>
      <TargetBar value={average} level={lowest} />
      <div className="flex items-center justify-between gap-2 text-[12.5px] text-muted">
        <span>
          Changes {mastered}/{scored.length}
        </span>
        <Link to={`/transitions?pair=${encodeURIComponent(`${chordKey}|${weakest.other}`)}`} className="whitespace-nowrap font-medium text-ink hover:text-accent">
          Drill ↔ {weakest.other} →
        </Link>
      </div>
    </div>
  );
}

export function ChordCard({ chord, skills }: { chord: Chord; skills: PairSkills }) {
  const playId = `chord:${chord.key}`;
  return (
    <div className={`${cardClass} px-4 pt-4 pb-3`}>
      <div className="mb-2.5">
        <div className="text-base font-[620] tracking-[-0.01em]">{chord.name}</div>
        <div className="min-h-[1.5em] text-[12.5px] text-muted">{chord.tag}</div>
      </div>
      <Fretboard shape={chord.shape} scope={playId} />
      <div className="mt-1.5 flex items-center justify-between">
        <PlayButton playId={playId} onPlay={() => strumChord(chord, playId)} title={`Strum ${chord.name}`} />
        <TickButton skillId={`chord:${chord.key}`} />
      </div>
      <ChangeProgress chordKey={chord.key} skills={skills} />
    </div>
  );
}
