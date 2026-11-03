// Listens to the microphone (or, in development, the app's own synth) and reports
// ~25 analysis frames a second: loudness and the 12-note chroma profile.
import { audioContext, synthOutput } from "@/audio/guitar";
import { spectrumToChroma, type Chroma } from "./chroma";

export interface Frame {
  /** Loudness in dBFS (about −100 silent, 0 maximum). */
  level: number;
  chroma: Chroma;
}

export type Source = "mic" | "synth";

/** In development, `?listen=synth` analyses the app's own synth instead of the mic. */
export const defaultSource = (): Source =>
  import.meta.env.DEV && new URLSearchParams(location.search).get("listen") === "synth" ? "synth" : "mic";

export interface Input {
  node: AudioNode;
  close: () => void;
}

/** Opens the mic (raw signal) or the synth's output as an audio node to analyse. */
export async function openInput(source: Source): Promise<Input> {
  const ctx = audioContext();
  if (ctx.state === "suspended") await ctx.resume();
  if (source === "synth") return { node: synthOutput(), close: () => {} };
  // Voice processing (echo cancellation, noise suppression, auto gain) mangles
  // instrument sound, so ask for the raw signal.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  return { node: ctx.createMediaStreamSource(stream), close: () => stream.getTracks().forEach(t => t.stop()) };
}

const FFT_SIZE = 8192;
const FRAME_MS = 40;

export class ChordListener {
  private input: Input | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** Bumped by every start and stop, so a start still waiting on the mic knows it was cancelled. */
  private run = 0;

  constructor(private onFrame: (f: Frame) => void) {}

  async start(source: Source) {
    this.stop();
    const run = this.run;
    const ctx = audioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.4;

    const input = await openInput(source);
    // Stopped (page left, listening turned off) while the mic was opening: close it again.
    if (run !== this.run) return input.close();
    this.input = input;
    this.input.node.connect(analyser);
    this.analyser = analyser;

    const db = new Float32Array(analyser.frequencyBinCount);
    const mags = new Float32Array(analyser.frequencyBinCount);
    const wave = new Float32Array(2048);
    this.timer = setInterval(() => {
      analyser.getFloatFrequencyData(db);
      for (let i = 0; i < db.length; i++) mags[i] = db[i]! > -140 ? Math.pow(10, db[i]! / 20) : 0;
      analyser.getFloatTimeDomainData(wave);
      let sum = 0;
      for (const v of wave) sum += v * v;
      const rms = Math.sqrt(sum / wave.length);
      this.onFrame({ level: rms > 0 ? 20 * Math.log10(rms) : -100, chroma: spectrumToChroma(mags, ctx.sampleRate, FFT_SIZE) });
    }, FRAME_MS);
  }

  stop() {
    this.run++;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    try {
      if (this.input && this.analyser) this.input.node.disconnect(this.analyser);
    } catch {
      // Already disconnected.
    }
    this.input?.close();
    this.input = null;
    this.analyser = null;
  }
}
