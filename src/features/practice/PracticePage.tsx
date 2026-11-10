// Practice: today's session, picked from your progress, with a guided run through it.
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router";
import { LevelPips } from "@/components/LevelPips";
import { PageHeader, Section, buttonClass, cardClass } from "@/components/ui";
import { db, localDate } from "@/progress/db";
import { useDailyPlan, usePracticeDays, useProgress, useStreak } from "@/progress/hooks";
import { DAILY_XP_GOAL, playerLevel, type PlanTask } from "@/skills/progress";
import { METRICS, formatValue, kindOf, maxLevel, type SkillKind } from "@/skills/registry";
import { SaveCard } from "./SaveCard";
import { REASON_LABEL, STEP_SECONDS, toStep, useSession, type Summary } from "./session";

const minutes = (seconds: number) => Math.max(1, Math.round(seconds / 60));

function Tick({ on }: { on: boolean }) {
  return (
    <span className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] ${on ? "border-good bg-good" : "border-line-2"}`} aria-label={on ? "Done" : "Not done yet"}>
      {on && (
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
          <path d="M4.5 8.2l2.3 2.3 4.7-4.9" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/** What the next level asks for, in the drill's own units. */
function goal(t: PlanTask) {
  const kind = t.skill.kind;
  if (t.target === undefined) return "Mastered: keep it there";
  return `${t.level === 0 ? "Level 1" : `Level ${t.level + 1}`} at ${formatValue(kind, t.target)}${METRICS[kind].better === "lower" ? " or under" : ""}`;
}

function TaskRow({ task, num }: { task: PlanTask; num: number }) {
  return (
    <Link
      to={task.skill.href}
      viewTransition
      className="group grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line px-5 py-3.5 transition-colors duration-200 ease-in-out last:border-b-0 hover:bg-surface-2/50 sm:px-6"
    >
      <span className="text-[13px] tabular-nums text-faint">{num}</span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <b className="truncate text-[15px] font-[620] tracking-[-0.01em]">{task.skill.title}</b>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] text-ink-2">{REASON_LABEL[task.reason]}</span>
          <LevelPips level={task.level} max={maxLevel(task.skill.kind)} />
        </span>
        <span className="mt-0.5 block text-[13px] text-muted">
          {METRICS[task.skill.kind].game} · {goal(task)}
        </span>
      </span>
      <span className="flex items-center gap-3 text-[13px] text-muted">
        <span className="tabular-nums">{minutes(STEP_SECONDS[task.reason])} min</span>
        <Tick on={task.done} />
      </span>
    </Link>
  );
}

/** What a finished session got done: time, and the best score on each step. */
function WrapUp({ summary }: { summary: Summary }) {
  const clear = useSession(s => s.clearSummary);
  const scores = useLiveQuery(async () => {
    const rows = await db.attempts.where("date").equals(localDate(new Date(summary.startedAt))).toArray();
    return rows.filter(a => a.at >= summary.startedAt && a.at <= summary.endedAt + 1000);
  }, [summary], []);
  const best = (skillId: string) => {
    const kind = kindOf(skillId) as SkillKind;
    const values = scores.filter(a => a.skillId === skillId).map(a => a.value);
    if (!values.length) return null;
    return formatValue(kind, METRICS[kind].better === "higher" ? Math.max(...values) : Math.min(...values));
  };
  const scored = summary.steps.filter(s => best(s.skillId)).length;
  return (
    <div className={`${cardClass} mb-8 overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-good-soft px-5 py-4 sm:px-6">
        <div>
          <div className="text-base font-[620] tracking-[-0.01em] text-good">Session done</div>
          <div className="text-[13px] text-ink-2">
            {minutes((summary.endedAt - summary.startedAt) / 1000)} min · {scored} of {summary.steps.length} drills scored
          </div>
        </div>
        <button type="button" onClick={clear} className={buttonClass.quiet}>
          Close
        </button>
      </div>
      {summary.steps.map(s => (
        <div key={s.skillId} className="flex items-center justify-between gap-3 border-b border-line px-5 py-2.5 text-[14px] last:border-b-0 sm:px-6">
          <span className="min-w-0 truncate">
            {s.title} <span className="text-muted">· {s.game}</span>
          </span>
          <b className={`shrink-0 font-[550] tabular-nums ${best(s.skillId) ? "text-ink" : "text-faint"}`}>{best(s.skillId) ?? "No score"}</b>
        </div>
      ))}
    </div>
  );
}

function Week({ running }: { running: boolean }) {
  const days = usePracticeDays(7);
  const streak = useStreak(running);
  const progress = useProgress();
  const lvl = playerLevel(progress.xp);
  const most = Math.max(15 * 60, ...days.map(d => d.seconds));
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className={`${cardClass} p-5`}>
        <div className="text-[13px] text-muted">Streak</div>
        <div className="mt-1 text-[28px] font-[650] leading-none tracking-[-0.03em] tabular-nums">
          {streak} <span className="text-[14px] font-normal tracking-normal text-muted">day{streak === 1 ? "" : "s"}</span>
        </div>
        <div className="mt-4 flex h-12 items-end gap-1.5" aria-label="Minutes practised over the last seven days">
          {days.map(d => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.label}: ${Math.round(d.seconds / 60)} min`}>
              <span className={`w-full rounded-sm ${d.seconds ? "bg-good" : "bg-surface-2"}`} style={{ height: `${Math.max(8, (d.seconds / most) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1.5 text-center text-[10.5px] text-faint">
          {days.map(d => (
            <span key={d.date} className="flex-1">
              {d.label[0]}
            </span>
          ))}
        </div>
      </div>
      <div className={`${cardClass} p-5`}>
        <div className="text-[13px] text-muted">Today</div>
        <div className="mt-1 text-[28px] font-[650] leading-none tracking-[-0.03em] tabular-nums">
          {progress.xpToday} <span className="text-[14px] font-normal tracking-normal text-muted">of {DAILY_XP_GOAL} XP</span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <span className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-in-out" style={{ width: `${Math.min(100, (progress.xpToday / DAILY_XP_GOAL) * 100)}%` }} />
        </div>
        <p className="mt-3 text-[12.5px] text-faint">Every scored try earns XP, with more for a personal best or a new level.</p>
      </div>
      <div className={`${cardClass} p-5`}>
        <div className="text-[13px] text-muted">Player level</div>
        <div className="mt-1 text-[28px] font-[650] leading-none tracking-[-0.03em] tabular-nums">{lvl.level}</div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <span className="block h-full rounded-full bg-ink-2 transition-[width] duration-300 ease-in-out" style={{ width: `${(lvl.into / lvl.needed) * 100}%` }} />
        </div>
        <p className="mt-3 text-[12.5px] text-faint">
          {lvl.needed - lvl.into} XP to level {lvl.level + 1}
        </p>
      </div>
    </div>
  );
}

export default function PracticePage() {
  const plan = useDailyPlan();
  const navigate = useNavigate();
  const { startedAt, steps, index, summary, begin } = useSession();
  const running = startedAt !== null;
  const todo = plan.filter(t => !t.done);
  // Everything ticked: the same plan can be run again.
  const queue = todo.length ? todo : plan;
  const total = queue.reduce((sum, t) => sum + STEP_SECONDS[t.reason], 0);

  const start = () => {
    if (!queue.length) return;
    const session = queue.map(toStep);
    begin(session);
    void navigate(session[0]!.href, { viewTransition: true });
  };

  return (
    <>
      <PageHeader
        title="Practice"
        lead="One short session a day beats a long one a week. Today's is picked from your own progress: a warm-up, what's due for review, what's closest to its next level, and one new thing in each area."
      />

      {summary && <WrapUp summary={summary} />}

      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2/50 px-5 py-4 sm:px-6">
          <div>
            <div className="text-base font-[620] tracking-[-0.01em]">Today's session</div>
            <div className="text-[13px] text-muted">
              {plan.length === 0
                ? "Loading your plan…"
                : todo.length === 0
                  ? "All done for today. Run it again if you've got more in you."
                  : `${todo.length} drill${todo.length === 1 ? "" : "s"} left · about ${minutes(total)} minutes`}
            </div>
          </div>
          {running ? (
            <Link to={steps[index]?.href ?? "/practice"} viewTransition className={buttonClass.primary}>
              Back to the session
            </Link>
          ) : (
            <button type="button" onClick={start} disabled={!queue.length} className={buttonClass.primary}>
              {todo.length === plan.length ? "Start session" : todo.length ? "Carry on" : "Go again"}
            </button>
          )}
        </div>
        {plan.map((t, i) => (
          <TaskRow key={t.skill.id} task={t} num={i + 1} />
        ))}
      </div>
      <p className="mt-3 text-[13px] text-muted">
        A session walks you through these in order with a timer on each. You can also open any one on its own, or pick anything from the{" "}
        <Link to="/gym" viewTransition className="text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink">
          gym
        </Link>
        .
      </p>

      <Section title="This week">
        <Week running={running} />
      </Section>

      <Section title="Your progress">
        <SaveCard />
      </Section>
    </>
  );
}
