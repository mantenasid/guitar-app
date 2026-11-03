import { beforeEach, describe, expect, it } from "vitest";
import { addPractice, db, recordAttempt, setLearned } from "./db";

beforeEach(async () => {
  await Promise.all([db.attempts.clear(), db.learned.clear(), db.practice.clear()]);
});

describe("progress db", () => {
  it("stores every attempt with its local date", async () => {
    await recordAttempt("change:A|D", 22);
    await recordAttempt("change:A|D", 31);
    const all = await db.attempts.where("skillId").equals("change:A|D").toArray();
    expect(all.map(a => a.value)).toEqual([22, 31]);
    expect(all[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("marks and unmarks learned skills", async () => {
    await setLearned("chord:E", true);
    expect(await db.learned.get("chord:E")).toBeDefined();
    await setLearned("chord:E", false);
    expect(await db.learned.get("chord:E")).toBeUndefined();
  });

  it("adds up practice time per day", async () => {
    await addPractice(90, "2026-11-03");
    await addPractice(30.4, "2026-11-03");
    await addPractice(0, "2026-11-03");
    expect((await db.practice.get("2026-11-03"))?.seconds).toBe(120);
  });
});
