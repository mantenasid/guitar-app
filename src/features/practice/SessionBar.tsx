// The strip along the bottom while a practice session runs: which step you're on, the time left on it, and the way to the next one.
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useLocation, useNavigate } from "react-router";
import { formatDuration } from "@/components/AppShell";
import { buttonClass } from "@/components/ui";
import { db } from "@/progress/db";
import { REASON_LABEL, useSession } from "./session";

export function SessionBar() {
  const { steps, index, startedAt, stepStart, goTo, finish } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const step = steps[index];
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [startedAt]);

  // A scored try at this step's skill since the step began means it's done.
  const tries = useLiveQuery(
    () => (step ? db.attempts.where("[skillId+at]").between([step.skillId, stepStart], [step.skillId, Infinity]).count() : 0),
    [step?.skillId, stepStart],
    0,
  );

  if (startedAt === null || !step) return null;

  const left = step.seconds - (now - stepStart) / 1000;
  const over = left <= 0;
  const last = index === steps.length - 1;
  const away = pathname !== step.href.split("?")[0];

  const next = () => {
    if (last) {
      finish();
      void navigate("/practice", { viewTransition: true });
    } else {
      goTo(index + 1);
      void navigate(steps[index + 1]!.href, { viewTransition: true });
    }
  };
  const end = () => {
    finish();
    void navigate("/practice", { viewTransition: true });
  };

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [view-transition-name:session-bar] sm:px-6 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className={`pointer-events-auto mx-auto flex max-w-[760px] flex-col gap-2 overflow-hidden rounded-2xl border border-line-2 bg-surface px-4 py-3 shadow-[0_16px_48px_-12px_rgb(0_0_0/0.55)]`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[12px] text-muted">
              <span className="tabular-nums">
                Step {index + 1} of {steps.length}
              </span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-ink-2">{REASON_LABEL[step.reason]}</span>
              {tries > 0 && <span className="text-good">Scored</span>}
            </div>
            <div className="truncate text-[15px] font-[620] tracking-[-0.01em]">
              {away ? (
                <Link to={step.href} viewTransition className="underline decoration-line-2 underline-offset-4 hover:decoration-ink">
                  {step.title}
                </Link>
              ) : (
                step.title
              )}
              <span className="font-normal text-muted"> · {step.game}</span>
            </div>
          </div>
          <span className={`text-[22px] font-[620] tabular-nums tracking-[-0.02em] ${over ? "text-accent" : "text-ink"}`} title={over ? "Time's up: finish this try, then move on" : "Time left on this step"}>
            {over ? "Time" : formatDuration(Math.ceil(left))}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={end} className="rounded-[10px] px-3 py-2.5 text-[13.5px] text-muted transition duration-200 ease-in-out hover:text-ink">
              End
            </button>
            <button type="button" onClick={next} className={over || tries > 0 ? buttonClass.primary : buttonClass.quiet}>
              {last ? "Finish" : "Next"}
            </button>
          </div>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-surface-2">
          <span className={`block h-full rounded-full transition-[width] duration-500 ease-linear ${over ? "bg-accent" : "bg-ink-2"}`} style={{ width: `${Math.min(100, Math.max(0, (1 - left / step.seconds) * 100))}%` }} />
        </div>
      </div>
    </div>
  );
}
