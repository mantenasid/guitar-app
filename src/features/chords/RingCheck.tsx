// Ring check: hold a chord and pluck it one string at a time. The mic checks each string sounds its note,
// so a muted or buzzing string shows up before it becomes a habit.
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { hzToNote } from "@/audio/listen/pitch";
import { useInput } from "@/audio/listen/useInput";
import { litId, stopPlayback, usePlayback } from "@/audio/playback";
import { DrillTip, DrillTitle, STAGE, STRIP } from "@/components/DrillWindow";
import { Fretboard } from "@/components/Fretboard";
import { PageHeader, PlayButton, buttonClass, cardClass } from "@/components/ui";
import { CHORD_BY_KEY } from "@/content";
import { chordVoicing } from "@/music/shapes";
import { STRING_NAMES, noteAt } from "@/music/theory";
import { recordAttempt, setLearned } from "@/progress/db";
import { sameNote } from "@/skills/timing";
import { strumChord } from "./ChordCard";

/** Readings in a row (about 50 ms each) that must agree before a string is judged. */
const SURE = 2;
const WRONG = 5;
/** Seconds after a pluck with no clear note before the string counts as muted. */
const MUTED_AFTER = 0.9;

type Mark = "clean" | "fixed";

const MIC_TEXT: Record<string, string> = {
  starting: "Opening the microphone…",
  denied: "Microphone blocked. Allow it in the browser's site settings, then try again.",
  unsupported: "This browser can't use the microphone.",
  error: "Couldn't open the microphone.",
};

export default function RingCheck() {
  const [params] = useSearchParams();
  const chord = CHORD_BY_KEY[params.get("chord") ?? ""] ?? CHORD_BY_KEY.Em!;
  const notes = chordVoicing(chord.shape);
  const scope = `ring:${chord.key}`;

  const [on, setOn] = useState(false);
  const [at, setAt] = useState(0);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [fault, setFault] = useState("");
  const [done, setDone] = useState(false);
  const live = useRef({ at: 0, good: 0, bad: 0, pluckedAt: 0, faulted: false });

  const advance = () => {
    const l = live.current;
    const mark: Mark = l.faulted ? "fixed" : "clean";
    l.at++;
    l.good = l.bad = l.pluckedAt = 0;
    l.faulted = false;
    setFault("");
    setAt(l.at);
    setMarks(m => {
      const next = [...m, mark];
      if (next.length >= notes.length) {
        setOn(false);
        setDone(true);
        void recordAttempt(`ring:${chord.key}`, Math.round((next.filter(x => x === "clean").length / next.length) * 100));
        // Every string ringing is what knowing a chord means, so it counts as learned.
        void setLearned(`chord:${chord.key}`, true);
      }
      return next;
    });
  };

  const flag = (message: string) => {
    const l = live.current;
    l.faulted = true;
    l.good = l.bad = l.pluckedAt = 0;
    setFault(message);
  };

  const status = useInput(on, {
    onOnset: () => {
      live.current.pluckedAt = performance.now() / 1000;
    },
    onPitch: p => {
      const l = live.current;
      const want = notes[l.at];
      // Nothing is judged until a string has been plucked, so the last string still ringing can't pass the next one.
      if (!want || !l.pluckedAt) return;
      const since = performance.now() / 1000 - l.pluckedAt;
      if (p && p.clarity >= 0.85 && sameNote(p.hz, want.midi)) {
        if (++l.good >= SURE) advance();
      } else if (p && p.clarity >= 0.85) {
        l.good = 0;
        if (++l.bad >= WRONG) flag(`That sounded like ${hzToNote(p.hz).note}, not ${noteAt(want.s, want.f)}. Check which fret and string that finger is on.`);
      } else if (since > MUTED_AFTER) {
        flag("That string is muted or buzzing. Press with the fingertip just behind the fret, and arch the fingers next to it so they don't touch.");
      }
    },
  });

  // Light the string to pluck next.
  const next = on ? notes[at] : undefined;
  useEffect(() => {
    if (!next) return;
    usePlayback.setState({ lit: new Set([litId(scope, next)]) });
    return () => usePlayback.setState({ lit: new Set() });
  }, [next, scope]);

  const start = () => {
    stopPlayback();
    live.current = { at: 0, good: 0, bad: 0, pluckedAt: 0, faulted: false };
    setAt(0);
    setMarks([]);
    setFault("");
    setDone(false);
    setOn(true);
  };

  const firstTime = marks.filter(m => m === "clean").length;

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/chords" viewTransition className="hover:text-ink">Chords</Link>}
        title="Ring check"
        lead="Hold the chord and pluck one string at a time, lowest first. The mic checks every string sounds its note, so you find the muted one now instead of in a song."
      />
      <div className={`${cardClass} overflow-hidden`}>
        <div className={STAGE}>
          <DrillTitle title={chord.name} sub={chord.tag} />
          <Fretboard shape={chord.shape} scope={scope} fluid className="mx-auto max-w-[520px]" />
          <div className="mt-2 flex justify-center">
            <PlayButton playId={scope} onPlay={() => strumChord(chord, scope)} label="Hear it" title={`Strum ${chord.name}`} />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {notes.map((n, i) => {
              const mark = marks[i];
              const current = on && i === at;
              return (
                <div
                  key={n.s}
                  className={`flex w-[84px] flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition duration-200 ease-in-out ${
                    mark === "clean" ? "border-good bg-good-soft" : mark === "fixed" ? "border-line-2 bg-surface-2" : current ? "border-accent bg-accent-soft" : "border-line"
                  }`}
                >
                  <span className="text-[11.5px] text-muted">{STRING_NAMES[n.s]} string</span>
                  <b className="text-[20px] font-[620] leading-none">{noteAt(n.s, n.f)}</b>
                  <span className={`text-[11.5px] ${mark === "clean" ? "text-good" : current ? "text-accent" : "text-faint"}`}>
                    {mark === "clean" ? "rings" : mark === "fixed" ? "fixed" : current ? "pluck it" : n.f === 0 ? "open" : `fret ${n.f}`}
                  </span>
                </div>
              );
            })}
          </div>
          {fault && <DrillTip>{fault}</DrillTip>}
        </div>

        <div className={STRIP}>
          <div className="mx-auto flex max-w-[820px] flex-col items-center gap-4 px-5 py-6 sm:px-8 sm:py-7">
            <button
              type="button"
              onClick={on ? () => setOn(false) : start}
              className={`h-14 w-full max-w-[300px] rounded-full text-[16px] font-[600] transition duration-200 ease-in-out ${on ? "bg-accent-soft text-accent" : "bg-ink text-bg hover:opacity-90"}`}
            >
              {on ? "Stop" : done ? "Check it again" : "Start"}
            </button>
            {on && status !== "listening" && MIC_TEXT[status] && <span className="text-[13.5px] text-muted">{MIC_TEXT[status]}</span>}
            {on && status === "listening" && next && (
              <span className="text-[14.5px] text-ink" aria-live="polite">
                Pluck the <b>{STRING_NAMES[next.s]} string</b> and let it ring.
              </span>
            )}
            {on && status === "listening" && (
              <button type="button" onClick={() => { live.current.faulted = true; advance(); }} className="text-[13px] text-muted underline decoration-line-2 underline-offset-4 hover:text-ink">
                Skip this string
              </button>
            )}
            {done && (
              <div className="flex flex-col items-center gap-3 text-center" aria-live="polite">
                <span className="text-[15px] font-[550]">
                  {firstTime === notes.length ? `All ${notes.length} strings rang first time. ${chord.key} is marked as learned.` : `${firstTime} of ${notes.length} strings rang first time. ${chord.key} is marked as learned; run it again until they all do.`}
                </span>
                <Link to={`/play/recall?chord=${encodeURIComponent(chord.key)}`} viewTransition className={buttonClass.quiet}>
                  Now time how fast you can find it
                </Link>
              </div>
            )}
            {!on && !done && <span className="text-[12.5px] text-faint">Needs the microphone. Strings the chord doesn't use are left out.</span>}
          </div>
        </div>
      </div>
    </>
  );
}
