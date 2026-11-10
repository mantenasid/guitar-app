// Where progress lives, and a backup file to keep it safe or move it to another device.
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { buttonClass, cardClass } from "@/components/ui";
import { downloadBackup, keepStorage, lastBackup, restoreFromFile, storageKept } from "@/progress/backup";
import { db } from "@/progress/db";

const DAY = 24 * 60 * 60 * 1000;

function ago(at: number) {
  const days = Math.floor((Date.now() - at) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function SaveCard() {
  const tries = useLiveQuery(() => db.attempts.count(), [], 0);
  const learned = useLiveQuery(() => db.learned.count(), [], 0);
  const [backedUp, setBackedUp] = useState(lastBackup);
  const [kept, setKept] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void storageKept().then(setKept);
  }, []);

  const backup = async () => {
    setBusy(true);
    setNote(null);
    try {
      await downloadBackup();
      setBackedUp(lastBackup());
      setKept(await keepStorage());
    } catch {
      setNote({ ok: false, text: "Couldn't make the backup file. Try again." });
    } finally {
      setBusy(false);
    }
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setNote(null);
    try {
      // On a fresh device, bring the preferences across too; otherwise leave this device's alone.
      const fresh = tries === 0;
      const added = await restoreFromFile(file, { settings: fresh });
      if (fresh) {
        location.reload();
        return;
      }
      setNote({
        ok: true,
        text: added ? `Restored. ${added} scored tr${added === 1 ? "y" : "ies"} added from the backup.` : "Everything in that backup is already here.",
      });
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const stale = tries > 0 && (!backedUp || Date.now() - backedUp > 14 * DAY);

  return (
    <div className={`${cardClass} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-[52ch]">
          <div className="flex items-center gap-2 text-base font-[620] tracking-[-0.01em]">
            <span className="size-2 rounded-full bg-good" aria-hidden />
            Saved on this device
          </div>
          <p className="mt-1 text-[13.5px] text-muted">
            Every scored try is saved the moment you finish it, with nothing to press. It stays in this browser only, so back it up now and then to keep it safe
            or to carry on from another phone or computer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={backup} disabled={busy} className={buttonClass.primary}>
            Back up
          </button>
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className={buttonClass.quiet}>
            Restore
          </button>
          <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={e => void restore(e.target.files?.[0])} />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[13px] sm:grid-cols-4">
        <div>
          <dt className="text-faint">Scored tries</dt>
          <dd className="mt-0.5 font-[600] tabular-nums">{tries}</dd>
        </div>
        <div>
          <dt className="text-faint">Learned</dt>
          <dd className="mt-0.5 font-[600] tabular-nums">{learned}</dd>
        </div>
        <div>
          <dt className="text-faint">Last backup</dt>
          <dd className={`mt-0.5 font-[600] ${stale ? "text-accent" : ""}`}>{backedUp ? ago(backedUp) : "Never"}</dd>
        </div>
        <div>
          <dt className="text-faint">Browser clean-up</dt>
          <dd className="mt-0.5 font-[600]">{kept === null ? "…" : kept ? "Protected" : "Not protected"}</dd>
        </div>
      </dl>

      {note && (
        <p role="status" className={`mt-4 text-[13px] ${note.ok ? "text-good" : "text-[var(--f4)]"}`}>
          {note.text}
        </p>
      )}
      {!note && kept === false && (
        <p className="mt-4 text-[12.5px] text-faint">
          Install Woodshed to your home screen or dock and the browser won't clear it to free up space. Clearing your browsing data still will, which is what the
          backup is for.
        </p>
      )}
    </div>
  );
}
