// One thing plays at a time. Diagrams read `lit` to highlight the notes as they sound.
// Lit ids are "<scope>|<string>:<fret>", so only the diagram that is playing lights up.
import { create } from "zustand";
import { noteId, type ShapeNote } from "@/music/shapes";
import * as guitar from "./guitar";

interface PlaybackState {
  /** Which control is playing, e.g. "chord:E" or "scale:a-minor-blues:0". */
  activeId: string | null;
  lit: ReadonlySet<string>;
}

export const usePlayback = create<PlaybackState>(() => ({ activeId: null, lit: new Set() }));

let timers: ReturnType<typeof setTimeout>[] = [];
/** Everything the current playback has queued on the audio clock. */
let sounding: guitar.Voice | null = null;

function light(ids: string[], on: boolean) {
  usePlayback.setState(s => {
    const lit = new Set(s.lit);
    ids.forEach(id => (on ? lit.add(id) : lit.delete(id)));
    return { lit };
  });
}

export function stopPlayback() {
  timers.forEach(clearTimeout);
  timers = [];
  sounding?.stop();
  sounding = null;
  usePlayback.setState({ activeId: null, lit: new Set() });
}

/** Stops what's playing, then runs `fn`; whatever it schedules is cut by the next `stopPlayback`. */
export function playScheduled(fn: () => void) {
  stopPlayback();
  sounding = guitar.voice();
  sounding.run(fn);
}

/** Run timed events; each lights its notes for `hold` seconds. */
function run(activeId: string, events: { at: number; notes: ShapeNote[]; hold: number; sound: (when: number) => void }[]) {
  stopPlayback();
  usePlayback.setState({ activeId });
  const t0 = guitar.now() + 0.05;
  let end = 0;
  sounding = guitar.voice();
  for (const e of events) {
    sounding.run(() => e.sound(t0 + e.at));
    const ids = e.notes.map(n => litId(activeId, n));
    timers.push(setTimeout(() => light(ids, true), (0.05 + e.at) * 1000));
    timers.push(setTimeout(() => light(ids, false), (0.05 + e.at + e.hold) * 1000));
    end = Math.max(end, e.at + e.hold);
  }
  timers.push(setTimeout(stopPlayback, (end + 0.3) * 1000));
}

export function toggle(activeId: string, start: () => void) {
  if (usePlayback.getState().activeId === activeId) stopPlayback();
  else start();
}

export function playSequence(activeId: string, notes: ShapeNote[], step = 0.3) {
  run(activeId, notes.map((n, i) => ({
    at: i * step,
    notes: [n],
    hold: step * 0.9,
    sound: when => guitar.pluck(n.midi, { when, gain: 0.55 }),
  })));
}

/** Strum each voicing in turn (a shuffle alternates plain and bounce). */
export function playStrums(activeId: string, voicings: ShapeNote[][], gap = 0.42) {
  run(activeId, voicings.map((v, i) => ({
    at: i * gap,
    notes: v,
    hold: 0.38,
    sound: when => guitar.strum(v.map(n => n.midi), { when, gain: 0.6 }),
  })));
}

export const litId = (scope: string, n: { s: number; f: number }) => `${scope}|${noteId(n.s, n.f)}`;

export function playNote(scope: string, n: ShapeNote) {
  guitar.pluck(n.midi, { gain: 0.6 });
  const id = litId(scope, n);
  light([id], true);
  setTimeout(() => light([id], false), 300);
}
