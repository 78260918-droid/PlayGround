const random = (a, b) => a + Math.random() * (b - a);

export const audio = {
  ctx: null,
  master: null,
  muted: false,
  ambience: null,
  heartbeatId: null,
  fireNodes: null,

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.82;
    this.master.connect(this.ctx.destination);
  },

  tone(freq, dur = 0.15, type = 'sine', vol = 0.2, slide = null, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.04);
  },

  noise(dur = 0.3, vol = 0.2, freq = 1200, type = 'lowpass', delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(t);
    source.stop(t + dur + 0.03);
  },

  startAmbience() {
    if (!this.ctx || this.ambience) return;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.028;
    gain.connect(this.master);
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 47;
    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.009;
    gain2.connect(this.master);
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 71;
    osc.connect(gain);
    osc2.connect(gain2);
    osc.start();
    osc2.start();
    this.ambience = { osc, osc2, gain, gain2 };
  },

  step() {
    this.noise(0.055, 0.028, 240, 'lowpass');
    this.tone(85, 0.05, 'sine', 0.018);
  },

  pickup() {
    this.tone(680, 0.09, 'sine', 0.09, 1080);
    this.tone(1080, 0.12, 'triangle', 0.04, 1360, 0.05);
  },

  friend() {
    this.tone(420, 0.12, 'sine', 0.09, 760);
    this.tone(760, 0.16, 'triangle', 0.06, 980, 0.07);
    this.tone(980, 0.14, 'sine', 0.05, 1220, 0.15);
  },

  quest() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.07, null, i * 0.11));
  },

  meow() {
    this.tone(620, 0.34, 'sawtooth', 0.1, 300);
    this.tone(880, 0.18, 'triangle', 0.04, 470, 0.04);
  },

  scare() {
    this.noise(0.55, 0.42, 980, 'highpass');
    this.tone(120, 0.75, 'sawtooth', 0.24, 38);
    this.tone(1400, 0.22, 'square', 0.09, 260);
    this.noise(0.3, 0.2, 240, 'lowpass', 0.12);
  },

  glitch() {
    for (let i = 0; i < 7; i++) {
      this.tone(random(100, 1700), 0.05, i % 2 ? 'square' : 'sawtooth', 0.05, random(60, 500), i * 0.075);
      this.noise(0.05, 0.05, random(300, 2800), 'bandpass', i * 0.075);
    }
  },

  cook() {
    this.noise(0.7, 0.07, 1400, 'bandpass');
    this.noise(0.7, 0.05, 700, 'lowpass', 0.2);
    this.noise(0.7, 0.04, 2200, 'highpass', 0.45);
  },

  fireStart() {
    if (!this.ctx || this.fireNodes) return;
    const len = Math.floor(this.ctx.sampleRate * 2);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 920;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.12;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    this.fireNodes = { source, gain, filter };
  },

  fireStop() {
    if (!this.fireNodes) return;
    try {
      this.fireNodes.source.stop();
    } catch (error) {
      /* the source may already be stopped */
    }
    this.fireNodes = null;
  },

  thump() {
    this.tone(54, 0.16, 'sine', 0.18, 34);
    this.tone(52, 0.13, 'sine', 0.11, 30, 0.19);
  },

  startHeartbeat() {
    if (this.heartbeatId) return;
    this.thump();
    this.heartbeatId = setInterval(() => this.thump(), 860);
  },

  stopHeartbeat() {
    if (!this.heartbeatId) return;
    clearInterval(this.heartbeatId);
    this.heartbeatId = null;
  },

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.82;
  },
};
