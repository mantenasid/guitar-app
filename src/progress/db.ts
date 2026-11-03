// Everything the learner does is stored on the device in IndexedDB.
import Dexie, { type EntityTable } from "dexie";

/** One measured try at a skill, e.g. 42 changes in a one-minute drill. */
export interface Attempt {
  id?: number;
  skillId: string;
  value: number;
  /** Local date, YYYY-MM-DD. */
  date: string;
  at: number;
}

export interface Learned {
  skillId: string;
  at: number;
}

/** Seconds of practice per local day. */
export interface PracticeDay {
  date: string;
  seconds: number;
}

export const db = new Dexie("guitar-practice") as Dexie & {
  attempts: EntityTable<Attempt, "id">;
  learned: EntityTable<Learned, "skillId">;
  practice: EntityTable<PracticeDay, "date">;
};

db.version(1).stores({
  attempts: "++id, skillId, date, [skillId+at]",
  learned: "skillId",
  practice: "date",
});

export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function recordAttempt(skillId: string, value: number) {
  await db.attempts.add({ skillId, value, date: localDate(), at: Date.now() });
}

export async function setLearned(skillId: string, on: boolean) {
  if (on) await db.learned.put({ skillId, at: Date.now() });
  else await db.learned.delete(skillId);
}

export async function addPractice(seconds: number, date = localDate()) {
  if (seconds <= 0) return;
  await db.transaction("rw", db.practice, async () => {
    const day = await db.practice.get(date);
    await db.practice.put({ date, seconds: (day?.seconds ?? 0) + Math.round(seconds) });
  });
}

/** Best value per skill across all attempts. */
export async function loadBests(): Promise<Map<string, number>> {
  const bests = new Map<string, number>();
  await db.attempts.each(a => {
    if (a.value > (bests.get(a.skillId) ?? 0)) bests.set(a.skillId, a.value);
  });
  return bests;
}
