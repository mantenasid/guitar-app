import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { computeProgress, dailyPlan, type Progress } from "@/skills/progress";
import { db, localDate, type Attempt, type Learned } from "./db";

const EMPTY_SET: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: Attempt[] = [];
const NO_LEARNED: Learned[] = [];

/** Raw data the progress engine works from; updates live. */
function useRecords() {
  const attempts = useLiveQuery(() => db.attempts.toArray(), [], NO_ATTEMPTS);
  const learned = useLiveQuery(() => db.learned.toArray(), [], NO_LEARNED);
  return { attempts, learned };
}

/** Levels, XP, unlocks and bests for every skill. */
export function useProgress(): Progress {
  const { attempts, learned } = useRecords();
  return useMemo(() => computeProgress(attempts, learned), [attempts, learned]);
}

/** Best value per skill (fastest time, or highest speed). */
export function useBests(): ReadonlyMap<string, number> {
  return useProgress().bests;
}

export function useDailyPlan() {
  const { attempts, learned } = useRecords();
  return useMemo(() => dailyPlan(attempts, learned), [attempts, learned]);
}

export function useLearned(): ReadonlySet<string> {
  return useLiveQuery(async () => new Set((await db.learned.toArray()).map(l => l.skillId)), [], EMPTY_SET);
}

/** The most recent attempts at one skill, oldest first. */
export function useHistory(skillId: string, limit = 12): Attempt[] {
  return useLiveQuery(
    async () => (await db.attempts.where("[skillId+at]").between([skillId, 0], [skillId, Infinity]).reverse().limit(limit).toArray()).reverse(),
    [skillId, limit],
    [],
  );
}

/** Practice seconds for the last `days` days, oldest first. */
export function usePracticeDays(days = 7) {
  return useLiveQuery(async () => {
    const out: { date: string; label: string; seconds: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = localDate(d);
      out.push({ date, label: d.toLocaleDateString(undefined, { weekday: "short" }), seconds: (await db.practice.get(date))?.seconds ?? 0 });
    }
    return out;
  }, [days], []);
}

/** Days in a row with any practice (timer or a scored attempt), counting back from today or yesterday. */
export function useStreak(runningToday: boolean): number {
  return useLiveQuery(async () => {
    const days = new Set((await db.practice.toArray()).filter(d => d.seconds > 0).map(d => d.date));
    (await db.attempts.toArray()).forEach(a => days.add(a.date));
    if (runningToday) days.add(localDate());
    const d = new Date();
    if (!days.has(localDate(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(localDate(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [runningToday], 0);
}
