// Backing up progress to a file and restoring it, so a cleared browser or a new device
// doesn't mean starting over. Everything else stays on the device.
import { db, localDate, type Attempt, type Learned, type PracticeDay } from "./db";

const SETTINGS_KEY = "gp-settings";
const LAST_BACKUP_KEY = "gp-last-backup";

export interface Backup {
  app: "woodshed";
  version: 1;
  exportedAt: number;
  attempts: Attempt[];
  learned: Learned[];
  practice: PracticeDay[];
  /** The raw saved preferences (theme, tempo, mic), or null if none were saved. */
  settings: unknown;
}

export async function makeBackup(): Promise<Backup> {
  const [attempts, learned, practice] = await Promise.all([
    db.attempts.toArray(),
    db.learned.toArray(),
    db.practice.toArray(),
  ]);
  let settings: unknown = null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    settings = raw ? JSON.parse(raw) : null;
  } catch {
    settings = null;
  }
  return {
    app: "woodshed",
    version: 1,
    exportedAt: Date.now(),
    attempts: attempts.map(({ id: _id, ...a }) => a),
    learned,
    practice,
    settings,
  };
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isDate = (v: unknown): v is string => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Checks a parsed file and keeps only well-formed rows; throws if it isn't a Woodshed backup. */
export function readBackup(data: unknown): Backup {
  const d = data as Partial<Backup> | null;
  if (!d || typeof d !== "object" || d.app !== "woodshed" || !Array.isArray(d.attempts)) {
    throw new Error("That file isn't a Woodshed backup.");
  }
  if (d.version !== 1) throw new Error("This backup is from a newer version of Woodshed.");
  const rows = <T>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
  return {
    app: "woodshed",
    version: 1,
    exportedAt: isNum(d.exportedAt) ? d.exportedAt : 0,
    attempts: rows<Attempt>(d.attempts)
      .filter(a => a && isStr(a.skillId) && isNum(a.value) && isDate(a.date) && isNum(a.at))
      .map(a => ({ skillId: a.skillId, value: a.value, date: a.date, at: a.at })),
    learned: rows<Learned>(d.learned)
      .filter(l => l && isStr(l.skillId) && isNum(l.at))
      .map(l => ({ skillId: l.skillId, at: l.at })),
    practice: rows<PracticeDay>(d.practice)
      .filter(p => p && isDate(p.date) && isNum(p.seconds) && p.seconds >= 0)
      .map(p => ({ date: p.date, seconds: Math.round(p.seconds) })),
    settings: d.settings ?? null,
  };
}

/**
 * Merges a backup into what's on this device, so restoring never loses anything:
 * attempts already here are skipped, learned chords are kept, and each day keeps the
 * larger practice time. Returns how many new attempts were added.
 */
export async function restoreBackup(b: Backup, { settings = false } = {}): Promise<number> {
  let added = 0;
  await db.transaction("rw", db.attempts, db.learned, db.practice, async () => {
    const have = new Set((await db.attempts.toArray()).map(a => `${a.skillId}@${a.at}`));
    const fresh = b.attempts.filter(a => !have.has(`${a.skillId}@${a.at}`));
    await db.attempts.bulkAdd(fresh);
    added = fresh.length;
    for (const l of b.learned) {
      const cur = await db.learned.get(l.skillId);
      if (!cur || l.at < cur.at) await db.learned.put(l);
    }
    for (const p of b.practice) {
      const cur = await db.practice.get(p.date);
      if (!cur || p.seconds > cur.seconds) await db.practice.put(p);
    }
  });
  if (settings && b.settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(b.settings));
    } catch {
      // Preferences are a nicety; progress is what matters.
    }
  }
  return added;
}

/** Saves a backup file to the device (Downloads on a computer, Files or Share on a phone). */
export async function downloadBackup() {
  const backup = await makeBackup();
  const name = `woodshed-backup-${localDate()}.json`;
  const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
  const file = new File([blob], name, { type: "application/json" });
  // On phones the share sheet is the natural place to save a file (iCloud Drive, Files, AirDrop).
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  const touch = matchMedia("(pointer: coarse)").matches;
  if (touch && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Woodshed backup" });
      markBackedUp();
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      // Fall through to a plain download.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  markBackedUp();
}

export async function restoreFromFile(file: File, opts?: { settings?: boolean }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't a Woodshed backup.");
  }
  return restoreBackup(readBackup(parsed), opts);
}

function markBackedUp() {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function lastBackup(): number | null {
  try {
    const v = Number(localStorage.getItem(LAST_BACKUP_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

/**
 * Asks the browser not to clear this site's storage when space runs low or the site
 * hasn't been opened for a while. Installed apps usually get this automatically.
 */
export async function keepStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function storageKept(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}
