// Live pitch and onsets from the mic (or the dev synth), for the tuner, note games and timing.
import { useEffect, useRef, useState } from "react";
import { audioContext } from "@/audio/guitar";
import { defaultSource, openInput } from "./listener";
import { OnsetDetector, StrumOnsets } from "./onsets";
import { detectPitch, type Pitch } from "./pitch";
import type { ListenStatus } from "./useChordListener";

const BUFFER = 2048;
/** Onset frames: about 10 ms each. */
const ONSET_FRAME = 512;
const ONSET_MS = 10;
const PITCH_MS = 50;

interface Handlers {
  /** Every ~50 ms with the note heard, or null. */
  onPitch?: (p: Pitch | null) => void;
  /** Each onset, as a time on the audio clock (seconds). */
  onOnset?: (time: number) => void;
  /** Onsets that keep ringing (strums, not clicks), reported about 60 ms late with their start time. */
  onStrum?: (time: number) => void;
}

export function useInput(active: boolean, handlers: Handlers) {
  const [status, setStatus] = useState<ListenStatus>("off");
  const live = useRef(handlers);
  live.current = handlers;

  useEffect(() => {
    if (!active) {
      setStatus("off");
      return;
    }
    const source = defaultSource();
    if (source === "mic" && !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    let cancelled = false;
    let cleanup = () => {};
    setStatus("starting");
    openInput(source).then(
      input => {
        if (cancelled) return input.close();
        const ctx = audioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = BUFFER;
        input.node.connect(analyser);
        const buf = new Float32Array(BUFFER);
        const onsets = new OnsetDetector();
        const strums = new StrumOnsets();
        const frameSecs = ONSET_FRAME / ctx.sampleRate;
        const onsetTimer = setInterval(() => {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = BUFFER - ONSET_FRAME; i < BUFFER; i++) sum += buf[i]! * buf[i]!;
          // The frame is the last ~10 ms of audio; date the onset to its middle.
          const t = ctx.currentTime - frameSecs / 2;
          const rms = Math.sqrt(sum / ONSET_FRAME);
          if (onsets.push(rms, t)) live.current.onOnset?.(t);
          const strum = strums.push(rms, t);
          if (strum !== null) live.current.onStrum?.(strum);
        }, ONSET_MS);
        const pitchTimer = setInterval(() => {
          if (!live.current.onPitch) return;
          analyser.getFloatTimeDomainData(buf);
          live.current.onPitch(detectPitch(buf, ctx.sampleRate));
        }, PITCH_MS);
        cleanup = () => {
          clearInterval(onsetTimer);
          clearInterval(pitchTimer);
          try {
            input.node.disconnect(analyser);
          } catch {
            // Already disconnected.
          }
          input.close();
        };
        setStatus("listening");
      },
      (e: unknown) => {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
      },
    );
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [active]);

  return status;
}

/** The latest pitch, smoothed over a few readings so the display doesn't jitter. */
export function usePitch(active: boolean) {
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const recent = useRef<number[]>([]);
  const status = useInput(active, {
    onPitch: p => {
      const r = recent.current;
      if (!p || p.clarity < 0.8) {
        r.length = 0;
        setPitch(null);
        return;
      }
      r.push(p.hz);
      if (r.length > 4) r.shift();
      const sorted = [...r].sort((a, b) => a - b);
      setPitch({ hz: sorted[Math.floor(sorted.length / 2)]!, clarity: p.clarity });
    },
  });
  return { status, pitch };
}
