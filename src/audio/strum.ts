// Strumming-pattern timing and a looping player with a lookahead scheduler.
import type { StrumPattern } from "@/content/types";
import * as guitar from "./guitar";

/**
 * Where each slot lands inside the bar, in beats. Numbers are beats,
 * "+" the half beat (pushed late to 2/3 with swing), "e"/"a" the quarter beats.
 */
export function slotTimes(count: string[], swing: boolean): { times: number[]; beats: number } {
  let beat = 0;
  const times = count.map(tok => {
    if (/^\d+$/.test(tok)) {
      beat = Number(tok) - 1;
      return beat;
    }
    if (tok === "+") return beat + (swing ? 2 / 3 : 0.5);
    if (tok === "e") return beat + 0.25;
    if (tok === "a") return beat + 0.75;
    return beat;
  });
  const beats = Math.max(...count.filter(t => /^\d+$/.test(t)).map(Number));
  return { times, beats };
}

export const isSwing = (p: StrumPattern) => /shuffle|swing|swung/i.test(`${p.name} ${p.tag}`);

export interface StrumOptions {
  bpm: number;
  click: boolean;
  sound: boolean;
  /** Chord notes, low to high. */
  notes: number[];
  /** Called when a slot starts sounding (-1 when the bar ends). */
  onSlot: (index: number) => void;
}

function hit(tok: string, notes: number[], when: number) {
  const accent = tok.endsWith(">");
  if (tok.startsWith("D")) guitar.strum(notes, { when, dir: "down", gain: accent ? 0.85 : 0.55 });
  else if (tok === "U") guitar.strum(notes.slice(-4), { when, dir: "up", gain: 0.38, spread: 0.01 });
  else if (tok === "X") {
    guitar.chuck({ when });
    guitar.strum(notes, { when, dir: "down", gain: 0.25, damped: true, spread: 0.006 });
  } else if (tok === "B" && notes[0] !== undefined) guitar.pluck(notes[0], { when, gain: 0.7 });
  else if (tok === "P") guitar.strum(notes.slice(0, 3), { when, dir: "down", gain: 0.6, damped: true, spread: 0.008 });
}

/** Loops a pattern after a one-bar count-in until `stop()` is called. */
export function startStrumLoop(pattern: StrumPattern, getOptions: () => StrumOptions) {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let countIn = true;
  let next = guitar.now() + 0.1;

  const scheduleBar = (barStart: number) => {
    const o = getOptions();
    const spb = 60 / o.bpm;
    const { times, beats } = slotTimes(pattern.count, isSwing(pattern));
    const t = guitar.now();
    if (o.click || countIn) {
      for (let b = 0; b < beats; b++) guitar.click({ when: barStart + b * spb, accent: b === 0 && !countIn });
    }
    if (!countIn) {
      pattern.slots.forEach((tok, i) => {
        const when = barStart + times[i]! * spb;
        if (o.sound) hit(tok, o.notes, when);
        timers.push(setTimeout(() => o.onSlot(i), Math.max(0, (when - t) * 1000)));
      });
      timers.push(setTimeout(() => o.onSlot(-1), Math.max(0, (barStart + beats * spb - t) * 1000)));
    }
    countIn = false;
    return barStart + beats * spb;
  };

  next = scheduleBar(next);
  const interval = setInterval(() => {
    while (next < guitar.now() + 0.4) next = scheduleBar(next);
    // Old timers have long since fired; keep the list short on long loops.
    if (timers.length > 400) timers.splice(0, timers.length - 100);
  }, 100);

  return function stop() {
    clearInterval(interval);
    timers.forEach(clearTimeout);
  };
}
