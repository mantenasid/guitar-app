import { Link } from "react-router";
import { PageHeader, cardClass } from "@/components/ui";
import { useDailyPlan, useProgress } from "@/progress/hooks";
import { LevelPips } from "@/components/LevelPips";
import { type TaskReason } from "@/skills/progress";
import { METRICS, formatValue, maxLevel } from "@/skills/registry";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const REASON: Record<TaskReason, { label: string; cls: string }> = {
  "warm-up": { label: "Warm up", cls: "bg-surface-2 text-ink-2" },
  review: { label: "Review", cls: "bg-surface-2 text-ink-2" },
  "level-up": { label: "Level up", cls: "bg-accent-soft text-accent" },
  new: { label: "New", cls: "bg-good-soft text-good" },
};

function TodayPlan() {
  const plan = useDailyPlan();
  const { skills } = useProgress();
  const done = plan.filter(t => t.done).length;
  return (
    <div className={`${cardClass} mb-3.5 p-5 sm:p-[22px]`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-[620] tracking-[-0.015em]">Today's plan</h2>
          <p className="text-[13.5px] text-muted">
            {done === plan.length && plan.length ? "All done. Great session!" : `${done} of ${plan.length} done · picked from what's due, what's close, and what's next`}
          </p>
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
            <LevelPips level={skills.get(t.skill.id)?.level ?? t.level} max={maxLevel(t.skill.kind)} className="hidden sm:inline-flex" />
            <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${REASON[t.reason].cls}`}>{REASON[t.reason].label}</span>
            <span className="text-faint transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
          </Link>
        ))}
      </div>
      <div className="mt-3 flex gap-5 text-[13px]">
        <Link to="/gym" className="font-medium text-muted hover:text-ink">Open the gym →</Link>
        <Link to="/path" className="font-medium text-muted hover:text-ink">See the whole path →</Link>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <>
      <PageHeader title={greeting()} lead="Here's today's plan. Tap one to start." />
      <TodayPlan />
    </>
  );
}
