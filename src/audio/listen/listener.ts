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

const FFT_SIZE = 8192;
const FRAME_MS = 40;

export class ChordListener {
  private stream: MediaStream | null = null;
  private input: AudioNode | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private onFrame: (f: Frame) => void) {}

  async start(source: Source) {
    this.stop();
    const ctx = audioContext();
    if (ctx.state === "suspended") await ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.4;

    if (source === "mic") {
      // Voice processing (echo cancellation, noise suppression, auto gain) mangles
      // instrument sound, so ask for the raw signal.
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      this.input = ctx.createMediaStreamSource(this.stream);
    } else {
      this.input = synthOutput();
    }
    this.input.connect(analyser);
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
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    try {
      if (this.input && this.analyser) this.input.disconnect(this.analyser);
    } catch {
      // Already disconnected.
    }
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.input = null;
    this.analyser = null;
  }
}
