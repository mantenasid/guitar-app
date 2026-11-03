// Plucked-string synth (Karplus-Strong) plus metronome click and muted "chuck".
// Everything is generated in the browser, so the site still works offline.
const GuitarAudio = (() => {
  let ctx = null, master = null;
  const cache = new Map();

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  // One Karplus-Strong string: a noise burst fed through an averaging delay line.
  function stringBuffer(midi, damped) {
    const key = midi + (damped ? "d" : "");
    if (cache.has(key)) return cache.get(key);
    const sr = ctx.sampleRate;
    const period = Math.max(2, Math.round(sr / freq(midi)));
    const length = Math.floor(sr * (damped ? 0.28 : 2.4));
    const buf = ctx.createBuffer(1, length, sr);
    const out = buf.getChannelData(0);
    const ring = new Float32Array(period);
    let prev = 0;
    for (let i = 0; i < period; i++) {
      // Lightly low-passed noise gives a rounder, less harsh attack.
      const n = Math.random() * 2 - 1;
      prev = prev * 0.45 + n * 0.55;
      ring[i] = prev;
    }
    const decay = damped ? 0.93 : 0.9965;
    let idx = 0, peak = 0;
    for (let i = 0; i < length; i++) {
      const next = idx + 1 === period ? 0 : idx + 1;
      const v = ring[idx];
      ring[idx] = decay * 0.5 * (v + ring[next]);
      out[i] = v;
      if (Math.abs(v) > peak) peak = Math.abs(v);
      idx = next;
    }
    if (peak > 0) for (let i = 0; i < length; i++) out[i] /= peak;
    // Short fade-out so notes never click when they end.
    const fade = Math.min(length, Math.floor(sr * 0.03));
    for (let i = 0; i < fade; i++) out[length - 1 - i] *= i / fade;
    cache.set(key, buf);
    return buf;
  }

  function pluck(midi, opts = {}) {
    const c = ac();
    const when = opts.when ?? c.currentTime;
    const src = c.createBufferSource();
    src.buffer = stringBuffer(midi, !!opts.damped);
    const g = c.createGain();
    g.gain.value = opts.gain ?? 0.5;
    src.connect(g);
    if (opts.damped) {
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      g.connect(lp);
      lp.connect(master);
    } else {
      g.connect(master);
    }
    src.start(when);
    return src;
  }

  // midis are low-to-high; an up-strum plays them in reverse.
  function strum(midis, opts = {}) {
    const c = ac();
    const when = opts.when ?? c.currentTime;
    const order = opts.dir === "up" ? [...midis].reverse() : midis;
    const spread = opts.spread ?? 0.014;
    const gain = (opts.gain ?? 0.5) / Math.sqrt(Math.max(1, order.length) / 2);
    order.forEach((m, i) => pluck(m, { when: when + i * spread, gain, damped: opts.damped }));
  }

  // Percussive muted hit: a short band-passed noise burst.
  function chuck(opts = {}) {
    const c = ac();
    const when = opts.when ?? c.currentTime;
    const len = Math.floor(c.sampleRate * 0.06);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.8;
    const g = c.createGain();
    g.gain.value = opts.gain ?? 0.9;
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(when);
  }

  function click(opts = {}) {
    const c = ac();
    const when = opts.when ?? c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.frequency.value = opts.accent ? 1600 : 1050;
    g.gain.setValueAtTime(opts.gain ?? (opts.accent ? 0.35 : 0.22), when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    osc.connect(g); g.connect(master);
    osc.start(when);
    osc.stop(when + 0.06);
  }

  function beep(opts = {}) {
    const c = ac();
    const when = opts.when ?? c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.frequency.value = opts.hz ?? 880;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.3, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + (opts.dur ?? 0.25));
    osc.connect(g); g.connect(master);
    osc.start(when);
    osc.stop(when + (opts.dur ?? 0.25) + 0.02);
  }

  return { ctx: ac, now: () => ac().currentTime, pluck, strum, chuck, click, beep };
})();
