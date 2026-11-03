import { useEffect, useRef, useState } from "react";
import { CHORD_BY_KEY, STRUM_LEVELS } from "@/content";
import type { StrumPattern } from "@/content/types";
import { PageHeader, PlayIcon, Section, StopIcon, Tabs, TickButton, cardClass } from "@/components/ui";
import { isSwing, startStrumLoop } from "@/audio/strum";
import { stopPlayback } from "@/audio/playback";
import { chordVoicing } from "@/music/shapes";
import { useSettings } from "@/progress/settings";
import { useProgress } from "@/progress/hooks";
import { recordResult } from "@/progress/record";
import { LevelPips } from "@/components/LevelPips";
import { useSearchParams } from "react-router";

/** Full bars you must play before claiming a tempo. */
const MIN_BARS = 2;

const CHORDS = ["G", "C", "D", "Em", "Am", "E", "A", "Dm", "E7", "A7", "B7", "E5", "A5"];

const TOKEN_CLASS: Record<string, string> = { D: "text-ink", U: "text-accent", X: "text-muted", B: "text-good", P: "text-muted underline underline-offset-[3px]" };

function Token({ t }: { t: string }) {
  if (t === "·") return <span className="font-normal text-line-2">·</span>;
  return <span className={TOKEN_CLASS[t[0]!] ?? ""}>{t}</span>;
}

function Beats({ slots, active, count }: { slots: string[]; active?: number; count?: boolean }) {
  return (
    <div
      className={`grid text-center font-mono ${count ? "text-[11.5px] text-faint" : "text-sm font-semibold"}`}
      style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 26px))` }}
    >
      {slots.map((s, i) => (
        <span key={i} className={`rounded-md py-0.5 ${i === active ? "bg-accent-soft text-accent" : ""}`}>
          {count ? s : <Token t={s} />}
        </span>
      ))}
    </div>
  );
}

export default function StrummingPage() {
  const [filter, setFilter] = useState("all");
  const strum = useSettings(s => s.strum);
  const setStrum = useSettings(s => s.setStrum);
  const [playing, setPlaying] = useState<number | null>(null);
  const [slot, setSlot] = useState(-1);
  const [bars, setBars] = useState(0);
  const progress = useProgress();
  const [params] = useSearchParams();
  const focus = Number(params.get("pattern")) || null;
  const stopRef = useRef<(() => void) | null>(null);

  // The scheduler reads the latest settings every bar, so tempo changes apply live.
  const settingsRef = useRef(strum);
  settingsRef.current = strum;

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(null);
    setSlot(-1);
    setBars(0);
  };

  const play = (p: StrumPattern) => {
    if (playing === p.num) return stop();
    stop();
    stopPlayback();
    setPlaying(p.num);
    stopRef.current = startStrumLoop(p, () => ({
      bpm: settingsRef.current.bpm,
      click: settingsRef.current.click,
      sound: settingsRef.current.sound,
      notes: chordVoicing(CHORD_BY_KEY[settingsRef.current.chord]!.shape).map(n => n.midi),
      onSlot: i => {
        setSlot(i);
        if (i === -1) setBars(b => b + 1);
      },
    }));
  };

  useEffect(() => () => stopRef.current?.(), []);
  // Arriving from the path: jump to that pattern.
  useEffect(() => {
    if (focus) document.getElementById(`pattern-${focus}`)?.scrollIntoView({ block: "center" });
  }, [focus]);

  const claim = async () => {
    if (playing === null) return;
    const num = playing;
    stop();
    await recordResult(`strum:${num}`, strum.bpm);
  };
  useEffect(() => {
    if (playing === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        stop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  const current = STRUM_LEVELS.flatMap(l => l.patterns).find(p => p.num === playing);

  return (
    <>
      <PageHeader
        title="Strumming"
        lead="29 patterns, easy to hard. Press play to hear any pattern loop with a count-in and metronome."
        aside={
          <Tabs
            value={filter}
            onChange={setFilter}
            options={[{ value: "all", label: "All" }, ...STRUM_LEVELS.map(l => ({ value: l.id, label: l.title.replace(" grooves", "") }))]}
          />
        }
      >
        <div className="mt-3.5 flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-muted">
          {[["D", "down"], ["U", "up"], ["X", "chuck"], ["B", "bass note"], ["P", "palm mute"], ["·", "miss"], [">", "accent"]].map(([t, l]) => (
            <span key={t} className="font-mono">
              <b className="font-semibold"><Token t={t!} /></b> <span className="font-sans">{l}</span>
            </span>
          ))}
        </div>
      </PageHeader>

      <div className={`${cardClass} no-print sticky top-3 z-10 mb-12 flex flex-wrap items-center gap-x-[22px] gap-y-2.5 px-[18px] py-3 text-[13.5px] text-muted max-sm:static`}>
        <label className="inline-flex items-center gap-2">
          Tempo
          <input type="range" min={40} max={180} value={strum.bpm} onChange={e => setStrum({ bpm: +e.target.value })} className="w-28" />
          <span className="min-w-[26px] font-[550] tabular-nums text-ink">{strum.bpm}</span>
        </label>
        <label className="inline-flex items-center gap-2">
          Chord
          <select value={strum.chord} onChange={e => setStrum({ chord: e.target.value })} className="py-1">
            {CHORDS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={strum.click} onChange={e => setStrum({ click: e.target.checked })} /> Click</label>
        <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={strum.sound} onChange={e => setStrum({ sound: e.target.checked })} /> Guitar</label>
        <span className="flex w-full flex-wrap items-center gap-3 sm:ml-auto sm:w-auto">
          {current ? (
            <>
              <span>
                <b className="font-[550] text-accent">{current.name}</b> on {strum.chord}
                {isSwing(current) ? " · swing" : ""}
              </span>
              <button
                disabled={bars < MIN_BARS}
                onClick={() => void claim()}
                title={bars < MIN_BARS ? `Play along for ${MIN_BARS} full bars first` : "Save this tempo for the pattern"}
                className="rounded-[9px] border border-good px-3 py-1.5 text-[13px] font-medium text-good disabled:border-line-2 disabled:text-faint"
              >
                ✓ Clean at {strum.bpm}
              </button>
            </>
          ) : (
            "Press play, strum along, then claim the tempo"
          )}
        </span>
      </div>

      {STRUM_LEVELS.filter(l => filter === "all" || l.id === filter).map(level => (
        <Section key={level.id} num={STRUM_LEVELS.indexOf(level) + 1} title={level.title} note={level.note}>
          <div>
            {level.patterns.map((p, i) => {
              const prev = level.patterns[i - 1];
              const newCount = !prev || prev.count.join() !== p.count.join();
              return (
                <div key={p.num}>
                  {newCount && (
                    <div className="hidden grid-cols-[34px_minmax(150px,220px)_1fr_auto_34px] items-center gap-2.5 pt-3.5 pb-1.5 sm:grid">
                      <span />
                      <span className="text-xs text-faint">{p.meter}</span>
                      <Beats slots={p.count} count />
                    </div>
                  )}
                  <div
                    id={`pattern-${p.num}`}
                    className={`grid scroll-mt-24 grid-cols-[34px_1fr_34px] items-center gap-x-2.5 gap-y-1 border-b border-line py-[9px] first:border-t sm:grid-cols-[34px_minmax(150px,220px)_1fr_auto_34px] ${focus === p.num ? "rounded-lg bg-accent-soft/60" : ""}`}
                  >
                    <button
                      onClick={() => play(p)}
                      title={playing === p.num ? "Stop" : `Play ${p.name}`}
                      className={`inline-flex size-8 items-center justify-center rounded-lg ${playing === p.num ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
                    >
                      {playing === p.num ? <StopIcon /> : <PlayIcon />}
                    </button>
                    <span className="flex flex-wrap items-center gap-x-2.5 text-[14.5px] font-[550]">
                      <span>
                        <span className="mr-1.5 font-normal tabular-nums text-faint">{p.num}</span>
                        {p.name}
                      </span>
                      <LevelPips level={progress.skills.get(`strum:${p.num}`)?.level ?? 0} />
                    </span>
                    <div className="col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto">
                      <Beats slots={p.slots} active={playing === p.num ? slot : undefined} />
                    </div>
                    <span className="hidden whitespace-nowrap text-[12.5px] text-faint sm:inline">{p.tag}</span>
                    <span className="col-start-3 row-start-1 sm:col-start-auto sm:row-start-auto">
                      <TickButton skillId={`strum:${p.num}`} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      ))}
    </>
  );
}
