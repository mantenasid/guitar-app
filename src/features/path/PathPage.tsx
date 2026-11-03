// The skill tree: every atomic skill, unit by unit, with its level and what unlocks it.
import { Link } from "react-router";
import { LevelPips } from "@/components/LevelPips";
import { PageHeader, Section, cardClass } from "@/components/ui";
import { useProgress, useStreak } from "@/progress/hooks";
import { useSettings } from "@/progress/settings";
import { ALL_PAIRS } from "@/skills/changes";
import { DAILY_XP_GOAL, playerLevel, progressToNext, type SkillProgress } from "@/skills/progress";
import { METRICS, SKILLS, SKILL_BY_ID, formatValue, kindOf, maxLevel, type Skill } from "@/skills/registry";
import { TRANSITION_SECTIONS } from "@/content";

const UNITS: { unit: string; note: string }[] = [
  { unit: "Open chords", note: "Recall each shape from memory, faster each time." },
  { unit: "Changes", note: "Switch between chords you know. Target: 80 a minute." },
  { unit: "Strumming", note: "Claim a clean tempo for each pattern." },
  { unit: "Scales", note: "Play each scale up and down in time." },
  { unit: "Blues chords", note: "Dominant 7ths for the 12-bar blues." },
  { unit: "Shuffles", note: "Hold one finger, bounce another." },
  { unit: "Power chords", note: "Two-note shapes, open and movable." },
  { unit: "Barre chords", note: "Opens after C: a two-string barre, then full E and A shapes." },
  { unit: "Fretboard notes", note: "Name any note on the neck, one string at a time." },
  { unit: "Warm-ups", note: "Finger independence and stretch, claimed at a clean tempo." },
  { unit: "Fingerpicking", note: "Thumb on the bass, fingers on top. Claim a clean tempo for each pattern." },
  { unit: "Arpeggios", note: "Opens after the first scale: chord tones one at a time, in movable shapes." },
  { unit: "Ear training", note: "Ten questions a round. Major or minor first, then qualities, your own chords and changes." },
  { unit: "Play-along", note: "Opens once you can make each change in a progression at 40 a minute." },
];

function Lock() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="currentColor" />
      <path d="M5.5 7V5.2a2.5 2.5 0 015 0V7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function needs(skill: Skill, progress: Map<string, SkillProgress>) {
  return skill.requires.filter(id => (progress.get(id)?.level ?? 0) < 1).map(id => SKILL_BY_ID.get(id)?.title ?? id);
}

function SkillNode({ skill, p, all }: { skill: Skill; p: SkillProgress; all: Map<string, SkillProgress> }) {
  const metric = METRICS[skill.kind];
  const max = maxLevel(skill.kind);
  const target = p.level < max ? metric.levels[p.level]! : undefined;
  // Changes are judged on current speed (an average), the rest on the best attempt.
  const shown = p.current ?? p.best;
  const near = progressToNext(skill.kind, shown, p.level);
  if (!p.unlocked) {
    return (
      <div className="flex min-h-[92px] flex-col justify-between rounded-xl border border-dashed border-line-2 p-3 text-faint" title={`Unlock by reaching level 1 on: ${needs(skill, all).join(", ")}`}>
        <span className="flex items-center justify-between gap-2 text-sm font-medium">
          {skill.title}
          <Lock />
        </span>
        <span className="text-xs">Needs {needs(skill, all).join(" + ")}</span>
      </div>
    );
  }
  const fresh = p.level === 0 && p.attempts === 0 && !p.learned;
  return (
    <Link
      to={skill.href}
      className={`${cardClass} flex min-h-[92px] flex-col justify-between gap-2 p-3 transition hover:-translate-y-px ${
        p.level >= max ? "border-good" : fresh ? "border-accent ring-1 ring-accent" : "hover:border-line-2"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-sm font-[620] leading-snug">{skill.title}</span>
        <LevelPips level={p.level} max={max} className="mt-1 shrink-0" />
      </span>
      {p.level >= max ? (
        <span className="text-xs font-medium text-good">Mastered · best {formatValue(skill.kind, p.best!)}</span>
      ) : fresh ? (
        <span className="text-xs font-medium text-accent">Start · {metric.game}</span>
      ) : (
        <span className="flex flex-col gap-1">
          <span className="flex justify-between text-xs text-muted">
            <span>{shown !== undefined ? `${p.current !== undefined ? "Now" : "Best"} ${formatValue(skill.kind, shown)}` : "Ticked as learned"}</span>
            <span>Next {target !== undefined ? formatValue(skill.kind, target) : ""}</span>
          </span>
          <span className="h-1 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${near * 100}%` }} />
          </span>
        </span>
      )}
    </Link>
  );
}

function Summary() {
  const { xp, xpToday, skills } = useProgress();
  const running = useSettings(s => s.timerStart !== null);
  const streak = useStreak(running);
  const lvl = playerLevel(xp);
  const mastered = [...skills].filter(([id, s]) => s.level >= maxLevel(kindOf(id))).length;
  const started = [...skills.values()].filter(s => s.level >= 1).length;
  const stats = [
    ["Level", `${lvl.level}`],
    ["Total XP", `${xp}`],
    ["Today", `${xpToday} / ${DAILY_XP_GOAL}`],
    ["Streak", `${streak} day${streak === 1 ? "" : "s"}`],
    ["Skills started", `${started} / ${SKILLS.length}`],
    ["Mastered", `${mastered}`],
  ];
  return (
    <div className={`${cardClass} mb-12 p-5`}>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {stats.map(([k, v]) => (
          <div key={k}>
            <div className="text-xs text-muted">{k}</div>
            <div className="text-lg font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-muted">
          <span>Level {lvl.level}</span>
          <span>{lvl.needed - lvl.into} XP to level {lvl.level + 1}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${(lvl.into / lvl.needed) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function PathPage() {
  const { skills } = useProgress();
  const grid = "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 [&>*]:min-w-0";

  return (
    <>
      <PageHeader
        title="Your path"
        lead="Every skill is one small, measurable thing. Reach level 1 to unlock what comes next, then push each one to mastery."
      />
      <Summary />

      {UNITS.map(({ unit, note }, i) => {
        const list = SKILLS.filter(s => s.unit === unit);
        const done = list.filter(s => (skills.get(s.id)?.level ?? 0) >= maxLevel(s.kind)).length;
        return (
          <Section key={unit} num={i + 1} title={unit} note={note} aside={<span className="text-[13px] text-muted">{done} of {list.length} mastered</span>}>
            {unit === "Changes" ? (
              TRANSITION_SECTIONS.map(sec => {
                const ids = new Set(ALL_PAIRS.filter(p => p.section === sec.id).map(p => `change:${p.key}`));
                const items = list.filter(s => ids.has(s.id));
                // Show what you can play now first; keep the locked ones compact.
                const open = items.filter(s => skills.get(s.id)!.unlocked);
                const locked = items.length - open.length;
                return (
                  <div key={sec.id} className="mb-6">
                    <div className="mb-2.5 text-[13px] text-muted">
                      {sec.title} · {open.length} unlocked{locked ? `, ${locked} locked until you know both chords` : ""}
                    </div>
                    {open.length > 0 && <div className={grid}>{open.map(s => <SkillNode key={s.id} skill={s} p={skills.get(s.id)!} all={skills} />)}</div>}
                  </div>
                );
              })
            ) : (
              <div className={grid}>
                {list.map(s => (
                  <SkillNode key={s.id} skill={s} p={skills.get(s.id)!} all={skills} />
                ))}
              </div>
            )}
          </Section>
        );
      })}
    </>
  );
}
