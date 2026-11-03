import { Link } from "react-router";
import { PageHeader, cardClass } from "@/components/ui";
import { useRunningSeconds } from "@/components/AppShell";
import { useBests, useLearned, usePracticeDays, useStreak } from "@/progress/hooks";
import { useSettings } from "@/progress/settings";
import { ALL_PAIRS, CHANGE_TARGET, summarise } from "@/skills/changes";
import { countByKind, type SkillKind } from "@/skills/registry";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Area({ to, title, blurb, progress, value }: { to: string; title: string; blurb: string; progress: React.ReactNode; value: number }) {
  return (
    <Link to={to} className={`${cardClass} flex min-h-[168px] flex-col gap-1.5 p-[22px] transition hover:-translate-y-px hover:border-line-2`}>
      <h2 className="text-xl font-[620] tracking-[-0.015em]">{title}</h2>
      <p className="flex-1 text-sm text-muted">{blurb}</p>
      <div className="mt-2.5 text-[13px] text-muted">{progress}</div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
        <span className="block h-full rounded-full bg-good" style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
    </Link>
  );
}

function Week() {
  const running = useSettings(s => s.timerStart !== null);
  const runningSecs = useRunningSeconds();
  const days = usePracticeDays(7).map((d, i, all) => (i === all.length - 1 ? { ...d, seconds: d.seconds + runningSecs } : d));
  const streak = useStreak(running);
  const total = days.reduce((a, d) => a + d.seconds, 0);
  const max = Math.max(900, ...days.map(d => d.seconds));
  return (
    <div className={`${cardClass} mt-3.5 p-[22px]`}>
      <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-1.5">
        <h2 className="text-base font-[620]">This week</h2>
        <span className="text-[13.5px] text-muted">
          {Math.round(total / 60)} min practised · {streak} day streak
        </span>
      </div>
      <div className="grid h-24 grid-cols-7 items-end gap-2.5">
        {days.map((d, i) => (
          <div key={d.date} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span className="min-h-[1em] text-[11.5px] tabular-nums text-muted">{d.seconds >= 60 ? `${Math.round(d.seconds / 60)}m` : ""}</span>
            <span className={`w-full max-w-[34px] rounded-md ${d.seconds >= 60 ? "bg-ink" : "bg-surface-2"}`} style={{ height: Math.max(4, (d.seconds / max) * 64) }} />
            <span className={`text-xs ${i === days.length - 1 ? "font-semibold text-ink" : "text-faint"}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  const learned = useLearned();
  const bests = useBests();
  const count = (kind: SkillKind) => [...learned].filter(id => id.startsWith(kind + ":")).length;
  const changes = summarise(ALL_PAIRS, bests);
  const learnedLine = (kind: SkillKind) => (
    <>
      <b className="font-[550] text-ink">{count(kind)}</b> of {countByKind(kind)} learned
    </>
  );

  return (
    <>
      <PageHeader title={greeting()} lead="Start the timer at the top, pick an area, and beat yesterday." />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Area to="/chords" title="Chords" blurb="28 shapes: open, blues and power chords." progress={learnedLine("chord")} value={count("chord") / countByKind("chord")} />
        <Area
          to="/transitions"
          title="Transitions"
          blurb={`One-minute changes. Build every pair to ${CHANGE_TARGET}.`}
          progress={
            changes.tried ? (
              <>
                <b className="font-[550] text-ink">{changes.mastered}</b> of {changes.total} pairs at {CHANGE_TARGET} · avg {changes.average}
              </>
            ) : (
              `Target: ${CHANGE_TARGET} changes a minute`
            )
          }
          value={changes.average / CHANGE_TARGET}
        />
        <Area to="/strumming" title="Strumming" blurb="29 patterns from steady downs to 16th-note grooves." progress={learnedLine("strum")} value={count("strum") / countByKind("strum")} />
        <Area to="/scales" title="Scales" blurb="16 scales in Yousician order, from first position up." progress={learnedLine("scale")} value={count("scale") / countByKind("scale")} />
      </div>
      <Week />
    </>
  );
}
