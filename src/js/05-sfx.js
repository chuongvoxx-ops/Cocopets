/* ---------- sound: tiny synthesized blips, no files ---------- */
const sfx = (() => {
  let ctx = null, out = null, noiseBuf = null;
  const on = () => (st ? st.sound : true) && ctx && ctx.state === 'running';
  function unlock() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.16; out.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }
  function tone(f0, dur, type, vol, f1, delay) {
    if (!on()) return;
    try {
      const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.5, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.03);
    } catch (e) {}
  }
  function noise(dur, vol, freq, delay) {
    if (!on()) return;
    try {
      if (!noiseBuf) {
        noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const t = ctx.currentTime + (delay || 0), src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + dur + 0.02);
    } catch (e) {}
  }
  /* a looping battle theme: lead and bass on eighth notes with a soft kick, scheduled just ahead of time */
  function note(f, dur, type, vol, t) { try { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.03); } catch (e) {} }
  function theme(sp, dur) {
    if (!on() || !sp) return { stop() {}, beat() {} };
    // the game calls beat() every frame; without it (paused, hidden, closed) the theme holds, and gives up after a minute
    const spb = 60 / sp.bpm / 2, f = n => sp.root * Math.pow(2, n / 12);
    let step = 0, next = ctx.currentTime + 0.06, alive = true, fade = 1, end = ctx.currentTime + (dur || 20), lastBeat = performance.now();
    const id = setInterval(() => {
      if (!alive || !on()) { clearInterval(id); return; }
      const gap = performance.now() - lastBeat;
      if (gap > 250) { if (gap > 60000) { alive = false; clearInterval(id); return; } end += 0.03; next = ctx.currentTime + 0.06; return; }
      while (next < ctx.currentTime + 0.15) {
        if (next > end) { alive = false; clearInterval(id); return; }
        const i = step % 16, L = sp.lead[i], B = sp.bass[i], k = fade * (step < 8 ? step / 8 : 1);
        if (L != null) note(f(L), spb * 0.85, sp.wave || 'triangle', 0.2 * k, next);
        if (B != null && step % 2 === 0) note(f(B) / 2, spb * 1.7, sp.bwave || 'triangle', 0.16 * k, next);
        if (step % 4 === 0) { note(110, 0.12, 'sine', 0.28 * k, next); }
        if (step % 8 === 4) { try { const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); if (!noiseBuf) noise(0.01, 0.0001, 1000); src.buffer = noiseBuf; fl.type = 'highpass'; fl.frequency.value = 5000; g.gain.setValueAtTime(0.06 * k, next); g.gain.exponentialRampToValueAtTime(0.0001, next + 0.08); src.connect(fl); fl.connect(g); g.connect(out); src.start(next); src.stop(next + 0.1); } catch (e) {} }
        step++; next += spb;
      }
    }, 30);
    return { stop() { if (!alive) return; fade = 0.5; setTimeout(() => { alive = false; clearInterval(id); }, 400); }, beat() { lastBeat = performance.now(); } };
  }
  return {
    unlock, theme,
    boop: () => tone(520, 0.14, 'sine', 0.8, 900),
    chirp: () => { tone(900, 0.07, 'triangle', 0.5, 1300); tone(1150, 0.08, 'triangle', 0.45, 1600, 0.07); },
    giggle: () => { for (let i = 0; i < 4; i++) tone(700 + i * 80, 0.07, 'triangle', 0.45, 1050 + i * 80, i * 0.075); },
    chomp: () => noise(0.06, 0.5, 700),
    yum: () => { tone(660, 0.1, 'sine', 0.55, 880); tone(880, 0.16, 'sine', 0.5, 1320, 0.09); },
    kick: () => { tone(190, 0.1, 'sine', 0.9, 90); noise(0.04, 0.25, 2200); },
    bounce: v => tone(260, 0.07, 'sine', v || 0.3, 170),
    squeak: () => tone(1050, 0.13, 'sine', 0.5, 1650),
    grumble: () => tone(190, 0.28, 'sawtooth', 0.18, 130),
    sleepy: () => tone(480, 0.45, 'sine', 0.35, 280),
    mumble: () => tone(300, 0.18, 'triangle', 0.2, 240),
    sparkle: () => { [0, 1, 2, 3].forEach(i => tone(1046 + i * 262, 0.14, 'sine', 0.3, 0, i * 0.06)); },
    pop: () => tone(420, 0.06, 'square', 0.15, 820),
    bubble: () => tone(700 + Math.random() * 500, 0.08, 'sine', 0.35, 1400),
    whoosh: () => noise(0.18, 0.25, 1400),
    purr: () => { for (let i = 0; i < 5; i++) tone(70, 0.07, 'triangle', 0.35, 60, i * 0.08); },
    crack: () => noise(0.08, 0.6, 1800),
    coin: () => { tone(988, 0.06, 'square', 0.12); tone(1318, 0.12, 'square', 0.12, 0, 0.06); },
    dig: () => noise(0.12, 0.45, 450),
    splash: () => noise(0.3, 0.35, 1100),
    wrong: () => tone(220, 0.18, 'triangle', 0.3, 180),
    fanfare: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.16, 'triangle', 0.4, 0, i * 0.13)); },
    hum: () => { tone(220, 1.6, 'sine', 0.2, 880); tone(330, 1.6, 'sine', 0.15, 1320, 0.2); },
    blip: () => tone(1250, 0.04, 'square', 0.04, 1900),
    thud: () => { tone(150, 0.08, 'sine', 0.55, 90); noise(0.04, 0.18, 500); },
    clear: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'triangle', 0.32, 0, i * 0.06)); },
    jump: () => tone(380, 0.12, 'square', 0.1, 760),
    stomp: () => { tone(300, 0.08, 'square', 0.14, 120); noise(0.05, 0.3, 900); },
    twang: () => tone(160, 0.25, 'sawtooth', 0.12, 520),
    crash: () => noise(0.22, 0.42, 650),
    // pitched cues for fights that speak in tones: a struck note, a breath of noise, and a hush over everything
    note: (f, dur, type, vol, f1, delay) => tone(f, dur || 0.3, type || 'sine', vol == null ? 0.3 : vol, f1, delay),
    hiss: (dur, vol, freq, delay) => noise(dur || 0.2, vol == null ? 0.2 : vol, freq || 1200, delay),
    chime: (f, k) => { const v = k == null ? 1 : k; tone(f, 0.55, 'sine', 0.32 * v); tone(f * 2.01, 0.35, 'sine', 0.12 * v, 0, 0.01); tone(f * 3.02, 0.22, 'triangle', 0.05 * v, 0, 0.02); },
    hollow: f => { tone(f || 300, 0.5, 'sine', 0.1, (f || 300) * 0.7); noise(0.4, 0.05, (f || 300) * 2); },
    duck(k, dur) { if (!out || !ctx) return; try { const t = ctx.currentTime, g = out.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.16 * k, t + 0.35); g.setValueAtTime(0.16 * k, t + Math.max(0.4, dur)); g.linearRampToValueAtTime(0.16, t + Math.max(0.4, dur) + 0.6); } catch (e) {} },
  };
})();
