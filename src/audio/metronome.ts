// A sample-accurate metronome: clicks are scheduled on the audio clock a little ahead of time.
import * as guitar from "./guitar";

export function startMetronome(getBpm: () => number, onBeat: (beat: number, when: number) => void, beatsPerBar = 4) {
  let beat = 0;
  let next = guitar.now() + 0.1;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const schedule = () => {
    while (next < guitar.now() + 0.25) {
      const b = beat;
      const when = next;
      guitar.click({ when: next, accent: b % beatsPerBar === 0 });
      timers.push(setTimeout(() => onBeat(b, when), Math.max(0, (next - guitar.now()) * 1000)));
      next += 60 / getBpm();
      beat++;
    }
    if (timers.length > 64) timers.splice(0, timers.length - 16);
  };
  schedule();
  const interval = setInterval(schedule, 50);
  return () => {
    clearInterval(interval);
    timers.forEach(clearTimeout);
  };
}
