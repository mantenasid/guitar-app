import { create } from "zustand";
import type { AttemptScore } from "@/skills/progress";
import { useSession } from "@/features/practice/session";
import { maxLevel, type SkillKind } from "@/skills/registry";

interface Toast {
  id: number;
  title: string;
  detail: string;
  xp: number;
  big: boolean;
}

const useToasts = create<{ toasts: Toast[] }>(() => ({ toasts: [] }));
let nextId = 1;

/** Show what an attempt earned. Level-ups get a bigger toast. */
export function celebrate(kind: SkillKind, skillTitle: string, score: AttemptScore) {
  if (!score.xp) return;
  const levelled = score.levelAfter > score.levelBefore;
  const toast: Toast = {
    id: nextId++,
    title: levelled ? `${skillTitle}: ${score.levelAfter >= maxLevel(kind) ? "Mastered" : `Level ${score.levelAfter}`}!` : score.newBest ? `New best on ${skillTitle}` : skillTitle,
    detail: levelled ? "Level up" : score.newBest ? "Personal best" : "Practice logged",
    xp: score.xp,
    big: levelled,
  };
  useToasts.setState(s => ({ toasts: [...s.toasts.slice(-2), toast] }));
  setTimeout(() => useToasts.setState(s => ({ toasts: s.toasts.filter(t => t.id !== toast.id) })), levelled ? 4000 : 2600);
}

export function Toasts() {
  const toasts = useToasts(s => s.toasts);
  // Sit above the session bar while a session is running.
  const lifted = useSession(s => s.startedAt !== null);
  return (
    <div className={`no-print pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4 ${lifted ? "bottom-28" : "bottom-5"}`} aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg ring-1 ring-black/5 animate-[toast-in_0.25s_ease-out] ${t.big ? "bg-ink text-bg" : "bg-surface text-ink"}`}
        >
          <span className={`grid size-9 place-items-center rounded-full text-[13px] font-bold ${t.big ? "bg-accent text-white" : "bg-accent-soft text-accent"}`}>+{t.xp}</span>
          <span className="flex flex-col leading-tight">
            <b className="text-sm font-semibold">{t.title}</b>
            <span className={`text-xs ${t.big ? "opacity-70" : "text-muted"}`}>
              {t.detail} · {t.xp} XP
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
