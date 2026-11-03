// Fingerpicking: thumb and finger patterns over a chord, looped with a count-in and claimed at a tempo.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { CHORD_BY_KEY } from "@/content";
import { PICK_PATTERNS, type PickPattern, type PickToken } from "@/content/fingerpicking";
import { LevelPips } from "@/components/LevelPips";
import { PageHeader, PlayIcon, StopIcon, cardClass } from "@/components/ui";
import { startPickLoop } from "@/audio/pick";
import { stopPlayback } from "@/audio/playback";
import { chordVoicing } from "@/music/shapes";
import { useProgress } from "@/progress/hooks";
import { recordResult } from "@/progress/record";

/** Full bars you must play before claiming a tempo. */
const MIN_BARS = 2;

const CHORDS = ["C", "G", "Am", "Em", "D", "A", "E", "Dm"];

const LEGEND: [string, string][] = [
  ["p", "thumb, root bass"],
  ["p2", "thumb, other bass string"],
  ["i", "index, G string"],
  ["m", "middle, B string"],
  ["a", "ring, high E"],
  ["pa", "pinch: thumb and finger together"],
];

function Token({ t }: { t: PickToken }) {
  if (t === "·") return <span className="font-normal text-line-2">·</span>;
  return <span className={t.startsWith("p") ? (t.length > 1 && t !== "p2" ? "text-good" : "text-ink") : "text-accent"}>{t}</span>;
}

function Slots({ items, active, count }: { items: string[]; active?: number; count?: boolean }) {
  return (
    <div
      className={`grid text-center font-mono ${count ? "text-[11.5px] text-faint" : "text-sm font-semibold"}`}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 30px))` }}
    >
      {items.map((s, i) => (
        <span key={i} className={`rounded-md py-0.5 transition-colors duration-200 ${i === active ? "bg-accent-soft text-accent" : ""}`}>
          {count ? s : <Token t={s as PickToken} />}
        </span>
      ))}
    </div>
  );
}

export default function FingerpickingPage() {
  const [params] = useSearchParams();
  const focus = params.get("pattern");
  const progress = useProgress();
  const [bpm, setBpm] = useState(70);
  const [chord, setChord] = useState("C");
  const [click, setClick] = useState(true);
  const [sound, setSound] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [slot, setSlot] = useState(-1);
  const [bars, setBars] = useState(0);
  const stopRef = useRef<(() => void) | null>(null);

  // The scheduler reads the latest settings every bar, so changes apply live.
  const settingsRef = useRef({ bpm, chord, click, sound });
  settingsRef.current = { bpm, chord, click, sound };

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(null);
    setSlot(-1);
    setBars(0);
  };

  const play = (p: PickPattern) => {
    if (playing === p.id) return stop();
    stop();
    stopPlayback();
    setPlaying(p.id);
    stopRef.current = startPickLoop(p, () => ({
      ...settingsRef.current,
      voicing: chordVoicing(CHORD_BY_KEY[settingsRef.current.chord]!.shape),
      onSlot: i => {
        setSlot(i);
        if (i === -1) setBars(b => b + 1);
      },
    }));
  };

  useEffect(() => () => stopRef.current?.(), []);
  // Arriving from the path: jump to that pattern.
  useEffect(() => {
    if (focus) document.getElementById(`pick-${focus}`)?.scrollIntoView({ block: "center" });
  }, [focus]);

  const claim = async () => {
    if (playing === null) return;
    const id = playing;
    stop();
    await recordResult(`pick:${id}`, bpm);
  };

  const current = PICK_PATTERNS.find(p => p.id === playing);

  return (
    <>
      <PageHeader title="Fingerpicking" lead="Ten patterns, easy to hard. The thumb keeps the bass steady while the fingers pick the top three strings. Press play, pick along, then claim the tempo.">
        <div className="mt-3.5 flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-muted">
          {LEGEND.map(([t, l]) => (
            <span key={t} className="font-mono">
              <b className="font-semibold"><Token t={t as PickToken} /></b> <span className="font-sans">{l}</span>
            </span>
          ))}
        </div>
      </PageHeader>

      <div className={`${cardClass} sticky top-3 z-10 mb-8 flex flex-wrap items-center gap-x-[22px] gap-y-2.5 px-[18px] py-3 text-[13.5px] text-muted max-sm:static`}>
        <label className="inline-flex items-center gap-2">
          Tempo
          <input type="range" min={40} max={160} value={bpm} onChange={e => setBpm(+e.target.value)} className="w-28" />
          <span className="min-w-[26px] font-[550] tabular-nums text-ink">{bpm}</span>
        </label>
        <label className="inline-flex items-center gap-2">
          Chord
          <select value={chord} onChange={e => setChord(e.target.value)} className="py-1">
            {CHORDS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={click} onChange={e => setClick(e.target.checked)} /> Click</label>
        <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Guitar</label>
        <span className="flex w-full flex-wrap items-center gap-3 sm:ml-auto sm:w-auto">
          {current ? (
            <>
              <span>
                <b className="font-[550] text-accent">{current.name}</b> on {chord}
              </span>
              <button
                disabled={bars < MIN_BARS}
                onClick={() => void claim()}
                title={bars < MIN_BARS ? `Play along for ${MIN_BARS} full bars first` : "Save this tempo for the pattern"}
                className="rounded-[9px] border border-good px-3 py-1.5 text-[13px] font-medium text-good transition-colors duration-200 disabled:border-line-2 disabled:text-faint"
              >
                ✓ Clean at {bpm}
              </button>
            </>
          ) : (
            "Press play, pick along, then claim the tempo"
          )}
        </span>
      </div>

      <div>
        {PICK_PATTERNS.map((p, i) => {
          const prev = PICK_PATTERNS[i - 1];
          const newCount = !prev || prev.count.join() !== p.count.join();
          const skill = progress.skills.get(`pick:${p.id}`);
          const locked = !skill?.unlocked;
          return (
            <div key={p.id}>
              {newCount && (
                <div className="hidden grid-cols-[34px_minmax(150px,220px)_1fr_auto] items-center gap-2.5 pt-3.5 pb-1.5 sm:grid">
                  <span />
                  <span className="text-xs text-faint">{p.meter}</span>
                  <Slots items={p.count} count />
                </div>
              )}
              <div
                id={`pick-${p.id}`}
                className={`grid scroll-mt-24 grid-cols-[34px_1fr] items-center gap-x-2.5 gap-y-1 border-b border-line py-[9px] first:border-t sm:grid-cols-[34px_minmax(150px,220px)_1fr_auto] ${focus === p.id ? "rounded-lg bg-accent-soft/60" : ""}`}
              >
                <button
                  onClick={() => play(p)}
                  title={playing === p.id ? "Stop" : `Play ${p.name}`}
                  className={`inline-flex size-8 items-center justify-center rounded-lg transition-colors duration-200 ${playing === p.id ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
                >
                  {playing === p.id ? <StopIcon /> : <PlayIcon />}
                </button>
                <span className="flex flex-wrap items-center gap-x-2.5 text-[14.5px] font-[550]">
                  <span>
                    <span className="mr-1.5 font-normal tabular-nums text-faint">{i + 1}</span>
                    {locked ? `🔒 ${p.name}` : p.name}
                  </span>
                  <LevelPips level={skill?.level ?? 0} />
                </span>
                <div className="col-start-2 sm:col-start-auto">
                  <Slots items={p.slots} active={playing === p.id ? slot : undefined} />
                </div>
                <span className="hidden whitespace-nowrap text-[12.5px] text-faint sm:inline">{p.tag}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
