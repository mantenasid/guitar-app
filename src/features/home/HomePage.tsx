import { Link } from "react-router";
import { PageHeader, cardClass } from "@/components/ui";
import { useRunningSeconds } from "@/components/AppShell";
import { useBests, useDailyPlan, useLearned, usePracticeDays, useProgress, useStreak } from "@/progress/hooks";
import { LevelPips } from "@/components/LevelPips";
import { DAILY_XP_GOAL, type TaskReason } from "@/skills/progress";
import { METRICS, formatValue } from "@/skills/registry";
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

const REASON: Record<TaskReason, { label: string; cls: string }> = {
  review: { label: "Review", cls: "bg-surface-2 text-ink-2" },
  "level-up": { label: "Level up", cls: "bg-accent-soft text-accent" },
  new: { label: "New", cls: "bg-good-soft text-good" },
};

function TodayPlan() {
  const plan = useDailyPlan();
  const { xpToday, skills } = useProgress();
  const done = plan.filter(t => t.done).length;
  const goalPct = Math.min(1, xpToday / DAILY_XP_GOAL);
  return (
    <div className={`${cardClass} mb-3.5 p-5 sm:p-[22px]`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-[620] tracking-[-0.015em]">Today's plan</h2>
          <p className="text-[13.5px] text-muted">
            {done === plan.length && plan.length ? "All done. Great session!" : `${done} of ${plan.length} done · picked from what's due, what's close, and what's next`}
          </p>
        </div>
        <div className="min-w-[180px] text-right">
          <div className="text-[13px] text-muted">
            <b className="font-semibold tabular-nums text-ink">{xpToday}</b> / {DAILY_XP_GOAL} XP today
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <span className={`block h-full rounded-full ${goalPct >= 1 ? "bg-good" : "bg-accent"}`} style={{ width: `${goalPct * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        {plan.map(t => (
          <Link key={t.skill.id} to={t.skill.href} className="group flex items-center gap-3 border-b border-line py-3 last:border-b-0">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] ${t.done ? "border-good bg-good text-white" : "border-line-2"}`}>
              {t.done && (
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
                  <path d="M4.5 8.2l2.3 2.3 4.7-4.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-[15px] font-[550] ${t.done ? "text-muted line-through" : ""}`}>{t.skill.title}</span>
              <span className="text-[12.5px] text-muted">
                {METRICS[t.skill.kind].game}
                {t.target !== undefined && ` · reach ${formatValue(t.skill.kind, t.target)}`}
              </span>
            </span>
            <LevelPips level={skills.get(t.skill.id)?.level ?? t.level} className="hidden sm:inline-flex" />
            <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${REASON[t.reason].cls}`}>{REASON[t.reason].label}</span>
            <span className="text-faint transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
          </Link>
        ))}
      </div>
      <div className="mt-3 text-[13px]">
        <Link to="/path" className="font-medium text-muted hover:text-ink">See the whole path →</Link>
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
      <PageHeader title={greeting()} lead="Work through today's plan. Every attempt earns XP; beat a level target to unlock what's next." />
      <TodayPlan />
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
