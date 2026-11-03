import { beforeEach, describe, expect, it } from "vitest";
import { addPractice, db, loadBests, recordAttempt, setLearned } from "./db";

beforeEach(async () => {
  await Promise.all([db.attempts.clear(), db.learned.clear(), db.practice.clear()]);
});

describe("progress db", () => {
  it("keeps the best attempt per skill", async () => {
    await recordAttempt("change:A|D", 22);
    await recordAttempt("change:A|D", 31);
    await recordAttempt("change:A|D", 27);
    await recordAttempt("change:C|G", 12);
    const bests = await loadBests();
    expect(bests.get("change:A|D")).toBe(31);
    expect(bests.get("change:C|G")).toBe(12);
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
