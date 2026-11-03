// The one way to save a scored attempt: stores it, works out what it earned, and celebrates.
import { celebrate } from "@/components/Toasts";
import { scoreAttempt, localDay, type AttemptScore } from "@/skills/progress";
import { SKILL_BY_ID, kindOf } from "@/skills/registry";
import { db, recordAttempt } from "./db";

export async function recordResult(skillId: string, value: number): Promise<AttemptScore> {
  const kind = kindOf(skillId);
  const prior = (await db.attempts.where("skillId").equals(skillId).toArray()).sort((x, y) => x.at - y.at);
  const today = localDay(Date.now());
  const triesToday = prior.filter(a => localDay(a.at) === today).length;
  const score = scoreAttempt(kind, value, prior.map(a => a.value), triesToday);
  await recordAttempt(skillId, value);
  celebrate(kind, SKILL_BY_ID.get(skillId)?.title ?? skillId, score);
  return score;
}
