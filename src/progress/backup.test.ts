import { beforeEach, describe, expect, it } from "vitest";
import { addPractice, db, recordAttempt, setLearned } from "./db";
import { makeBackup, readBackup, restoreBackup } from "./backup";

beforeEach(async () => {
  await Promise.all([db.attempts.clear(), db.learned.clear(), db.practice.clear()]);
});

describe("backup", () => {
  it("round-trips progress through a backup file", async () => {
    await recordAttempt("change:A|D", 22);
    await setLearned("chord:E", true);
    await addPractice(300, "2026-11-03");
    const file = JSON.parse(JSON.stringify(await makeBackup()));

    await Promise.all([db.attempts.clear(), db.learned.clear(), db.practice.clear()]);
    expect(await restoreBackup(readBackup(file))).toBe(1);
    expect((await db.attempts.toArray()).map(a => a.value)).toEqual([22]);
    expect(await db.learned.get("chord:E")).toBeDefined();
    expect((await db.practice.get("2026-11-03"))?.seconds).toBe(300);
  });

  it("merges without duplicating or losing anything", async () => {
    await recordAttempt("change:A|D", 22);
    await addPractice(300, "2026-11-03");
    const file = readBackup(JSON.parse(JSON.stringify(await makeBackup())));

    await recordAttempt("change:A|D", 30);
    await addPractice(500, "2026-11-03");
    expect(await restoreBackup(file)).toBe(0);
    expect(await db.attempts.count()).toBe(2);
    expect((await db.practice.get("2026-11-03"))?.seconds).toBe(800);
  });

  it("rejects files that aren't backups and drops malformed rows", () => {
    expect(() => readBackup({ hello: 1 })).toThrow(/isn't a Woodshed backup/);
    expect(() => readBackup(null)).toThrow();
    const b = readBackup({
      app: "woodshed",
      version: 1,
      attempts: [{ skillId: "x", value: 1, date: "2026-11-03", at: 5 }, { skillId: 3 }],
      learned: "nope",
      practice: [{ date: "bad", seconds: 5 }],
    });
    expect(b.attempts).toHaveLength(1);
    expect(b.learned).toEqual([]);
    expect(b.practice).toEqual([]);
  });
});
