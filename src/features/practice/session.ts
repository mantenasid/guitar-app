// A guided practice session: today's plan as timed steps, walked through one drill at a time.
import { create } from "zustand";
import { addPractice } from "@/progress/db";
import type { PlanTask, TaskReason } from "@/skills/progress";
import { METRICS } from "@/skills/registry";

export interface Step {
  skillId: string;
  title: string;
  href: string;
  reason: TaskReason;
  /** Name of the drill, e.g. "One-minute changes". */
  game: string;
  seconds: number;
}

/** Time on each step: long enough for a few focused tries, short enough to stay sharp. */
export const STEP_SECONDS: Record<TaskReason, number> = { "warm-up": 120, review: 120, "level-up": 180, new: 180 };

export const REASON_LABEL: Record<TaskReason, string> = { "warm-up": "Warm-up", review: "Review", "level-up": "Nearly there", new: "New" };

export const toStep = (t: PlanTask): Step => ({
  skillId: t.skill.id,
  title: t.skill.title,
  href: t.skill.href,
  reason: t.reason,
  game: METRICS[t.skill.kind].game,
  seconds: STEP_SECONDS[t.reason],
});

export interface Summary {
  steps: Step[];
  startedAt: number;
  endedAt: number;
}

interface Session {
  steps: Step[];
  index: number;
  /** When the session started (ms), or null when none is running. */
  startedAt: number | null;
  /** When the step now showing started (ms). */
  stepStart: number;
  /** The last finished session, for the wrap-up. */
  summary: Summary | null;
  begin: (steps: Step[]) => void;
  goTo: (index: number) => void;
  finish: () => void;
  clearSummary: () => void;
}

export const useSession = create<Session>()((set, get) => ({
  steps: [],
  index: 0,
  startedAt: null,
  stepStart: 0,
  summary: null,
  begin: steps => set({ steps, index: 0, startedAt: Date.now(), stepStart: Date.now(), summary: null }),
  goTo: index => set({ index, stepStart: Date.now() }),
  finish: () => {
    const { steps, startedAt } = get();
    if (startedAt === null) return;
    const endedAt = Date.now();
    void addPractice((endedAt - startedAt) / 1000);
    set({ steps: [], index: 0, startedAt: null, summary: { steps, startedAt, endedAt } });
  },
  clearSummary: () => set({ summary: null }),
}));
