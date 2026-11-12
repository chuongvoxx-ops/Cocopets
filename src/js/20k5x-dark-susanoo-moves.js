/* ---------- Dark's Susano O (12th Dark ult): the attacks (worker E) ----------
   The model is 20k5v (SUSANO_MODEL), the session, both forms, movement, menus and timers are 20k5w (U.susanoo). This file
   adds the four attacks to the SUSANOO_MOVES contract (docs/DARK-SUSANOO-BRIEF.md):
   - SM.darkBlade(ctx): True Dark Blade. The sword rises overhead in both hands while violet light climbs its channel, then
     drives down; at the slam a thin slash of darkness flies out ahead: a crescent lying flat just above the ground, bowed
     forward with tapering tips, a dark sharp-edged core with a bright violet edge glow and a feathered outer glow,
     sparks and dark wisps trailing, violet fissures lighting under it and fading behind. Its front (the drawn crescent,
     tips trailing) is the hit: one hit per enemy per activation, the blade's own impact counted in the same set. Each
     part of the slash stops at a wall (nothing is hit behind one).
   - SM.darkSpikes(ctx): Dark Spikes. The sword turns point-down and is driven into the ground; dark fissures race from it
     to the aimed area; then the Earth ult Crystal Coronation (20k2f, assumed to be the spec's "Crown of Rock") runs as
     its Dark variant through its V hook: the same ray-cast crystal spires, formation and eruption, in glossy black
     obsidian with silver-violet edges and violet fissures. Two damage phases, each one hit per enemy over the whole
     formation: the eruption, then the dark burst.
   - SM.pulsar(ctx): Shockwave Pulsar. A compact white-violet charge at the docked sword's point, a short bright ray to the
     ground, the darkness compressing to a point, then a black-violet shockwave: one hit per enemy within its radius
     (the drawn footprint), once per cast.
   - SM.messiah(ctx): Dark Messiah (v2, the user's design). Dark pulsing energy is drawn in from all round into the
     airship's underbelly (tendrils, spiralling motes, inward pulses beating faster); it condenses into one small speck of
     purple-white light (a beat of near-silence); the ship drops the speck, which falls with a thin trail onto the
     telegraphed ground; then a nuclear-style blast of dark energy: core flash, shockwave dome, pulsing dark ground rings,
     glowing fractures, a fireball rising into a column and a rolling mushroom cap lit from within, thousands of sparks,
     embers, debris and dark motes, a lingering pulse. ONE decisive hit per enemy, dealt as the dome's front reaches it
     (noCharge). Then ctx.safeReturn() and ctx.done(); the cloud fades on its own. The explosion may cover the pet.
     Drawn on the GPU by SUSANOO_GFX (end of this file) where WebGL runs on real hardware; a simplified 2D fallback
     otherwise.
   Soft by construction: every flame of darkness is a baked sprite with feathered edges (no strokes for bodies, no crisp
   rims). Sprites bake lazily in slices (SM.warm(ms)); particles are pooled; nothing uses timers: one per-session fx steps
   the acts and checks ctx.alive() every frame, dropping everything (no damage) when the session ends. */
(() => {
  const SM = (self.SUSANOO_MOVES = self.SUSANOO_MOVES || {});
  const TAU = Math.PI * 2;
  const C = { ink: '#120B1E', ink2: '#2A1F3A', ink3: '#4A3A66', vio: '#B983F5', vio2: '#8A4DFF', pale: '#E0D2FF', silv: '#CFC3E8', wht: '#FFFFFF' };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const eio = u => { u = cl(u); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }, eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); }, ein = u => { u = cl(u); return u * u * u; };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const wrapA = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };

  /* ---- the numbers (DK = ctx.DK = base x K x (1 + 0.08 (evo - 1)); tiers 0/1/2 = evo 1-3 / 4-6 / 7) ---- */
  const TUNE = SM.TUNE = {
    /* True Dark Blade: lift + slam, then the wave rolls `range` tiles at `speed`; `width` across at the start, widening
       by `spread` per tile; one hit per enemy (the blade's impact r `impactR` included). Cooldown is 20k5w's (~2.5 s) */
    blade: { dmg: 4.0, lift: 0.38, slam: 0.12, recoil: 0.32, range: [7, 8, 9], speed: 9, width: [4.6, 5.6, 6.6], spread: 0.18, height: [2.4, 2.8, 3.2], impactR: 1.3, kb: 3, lanes: 13, cd: 2.5, thick: 0.62, z: 0.35, band: 0.5 },
    /* Dark Spikes: the impalement, then Coronation's Dark variant: phase 1 the eruption (one hit per enemy over the whole
       formation), phase 2 the burst (one hit per enemy); timings of the build-up scaled by timeK. Cooldown ~3.5 s */
    spikes: { erupt: 2.5, burst: 3.0, turn: 0.3, plunge: 0.12, fissure: 0.26, timeK: 0.55, recoil: 0.35, cd: 3.5 },
    /* Shockwave Pulsar: aim, charge, a short ray, the compression, then one hit per enemy within r (the drawn footprint) */
    pulsar: { dmg: 5.0, r: [2.8, 3.0, 3.2], aim: 0.14, charge: 0.28, ray: 0.12, squeeze: 0.08, recoil: 0.3, kb: 4, cd: 2.0 },
    /* Dark Messiah: gather, condense, drop (no damage), then the explosion: blast x DK once per
       enemy within R (the drawn shockfront), noCharge. blast [tier 0/1/2 = evo 1-3 / 4-6 / 7] is from H's damage audit (the brief's Notes, 2026-11-12) */
    messiah: { gather: 2.4, condense: 0.6, drop: 0.55, bellyDrop: 0.9, front: 0.42, blast: [130, 175, 210], R: [7.0, 7.5, 8.0], kb: 7, cloud: 5.6, settle: 0.9, zoom: 0.7,
      /* the GPU layer: canvas scale, its cap, low-effects scale and point share */
      gpu: { res: 0.5, resLow: 0.36, maxSide: 1100, lowK: 0.4 } },
  };

  /* ================= baked sprites (per-pixel, a few rows per slice) ================= */
  const JOBS = {}; let DEADLINE = 0;
  function imgSprite(key, w, h, fn) { const hit = fxCache.get(key); if (hit) return hit; const J = JOBS[key] || (JOBS[key] = { y: 0, fn });
    if (!J.cv) { J.cv = document.createElement('canvas'); J.cv.width = w; J.cv.height = h; J.g = J.cv.getContext('2d'); J.im = J.g.createImageData(w, h); }
    const d = J.im.data, F = J.fn, lim = DEADLINE; while (J.y < h) { const y = J.y; for (let x = 0; x < w; x++) { const o = F(x, y, w, h); if (!o) continue; const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255 * cl(o[3]); } J.y++; if (lim && performance.now() > lim) break; }
    if (J.y < h) return null; J.g.putImageData(J.im, 0, 0); fxCache.set(key, J.cv); delete JOBS[key]; return J.cv; }
  const HT = new Float32Array(4096); for (let i = 0; i < 4096; i++) HT[i] = R1(i * 0.7317 + 0.173);
  function vnoise(x, y, s, per) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), sk = s * 71;
    const h = (i, j) => { if (per) i = ((i % per) + per) % per; return HT[(((i * 157 + j * 311 + sk) % 4096) + 4096) % 4096]; };
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); }
  function fbm(x, y, s, per) { let a = 0.5, f = 1, v = 0; for (let o = 0; o < 4; o++) { v += a * vnoise(x * f, y * f, s + o * 3, per ? per * f : 0); a *= 0.5; f *= 2; } return v; }
  /* the dark ramp: 0 black-ink, 0.5 deep violet-grey, 1 pale violet; and the light ramp for additive glows */
  const DR = [[0, [8, 5, 14]], [0.4, [26, 16, 44]], [0.7, [58, 38, 96]], [1, [140, 112, 196]]];
  const LR = [[0, [70, 24, 150]], [0.45, [138, 77, 255]], [0.75, [185, 131, 245]], [1, [246, 240, 255]]];
  function ramp(R, k) { k = cl(k); for (let i = 1; i < R.length; i++) if (k <= R[i][0]) { const a = R[i - 1], b = R[i], u = (k - a[0]) / (b[0] - a[0]); return [lerp(a[1][0], b[1][0], u), lerp(a[1][1], b[1][1], u), lerp(a[1][2], b[1][2], u)]; } return R[R.length - 1][1]; }
  /* the wave's face, one lane wide (tileable across x): smoky black-violet rising from the floor, densest low, thinning
     and churning toward the crest; 'b' the body (normal blend), 'r' the crest's soft violet light and inner veins (additive) */
  const sprWave = (kind, v) => imgSprite('smW' + kind + v, 64, 128, (x, y, w, h) => { const u = 1 - (y + 0.5) / h, n = fbm(x / (w / 4), y / 13 + v * 3, 30 + v, 4), n2 = fbm(x / (w / 8), y / 6 + v * 7, 50 + v, 8), top = 0.78 + 0.16 * (n - 0.5) + 0.06 * (n2 - 0.5), side = sm(Math.min(x + 0.5, w - x - 0.5) / (w * 0.32));   /* (soft sides: lanes overlap and melt together) */
    if (kind === 'b') { const a = side * sm(u / 0.06) * (1 - sm((u - top + 0.12) / 0.16)) * (0.62 + 0.45 * (n2 - 0.3)); if (a < 0.01) return null; const c = ramp(DR, 0.12 + 0.45 * n + 0.35 * sm((u - 0.4) / 0.4)); return [c[0], c[1], c[2], cl(a)]; }
    const crest = Math.exp(-Math.pow((u - top + 0.06) / 0.07, 2)), vein = Math.max(0, 1 - Math.abs(n2 - 0.5) * 9) * 0.45 * sm(u / 0.2) * (1 - sm((u - top) / 0.1)), a = side * (crest * (0.7 + 0.5 * (n - 0.4)) + vein); if (a < 0.01) return null; const c = ramp(LR, 0.35 + 0.6 * crest); return [c[0], c[1], c[2], cl(a)]; });
  /* a soft dark smoke puff (gaussian blobs, ink to violet-grey, lit violet from below): 3 variants */
  const sprSmoke = v => fxCache.get('smS' + v) || imgSprite('smS' + v, 80, 80, (() => { let s = 13 + v * 41; const Rr = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const Bl = []; for (let k = 0; k < 7; k++) Bl.push([40 + (Rr() - 0.5) * 30, 40 + (Rr() - 0.5) * 26, 8 + Rr() * 9, 0.5 + Rr() * 0.5]);
    const D = (x, y) => { let d2 = 0; for (const b of Bl) { const dx = x - b[0], dy = y - b[1]; d2 += b[3] * Math.exp(-(dx * dx + dy * dy) / (b[2] * b[2])); } return d2; };
    return (x, y) => { const d2 = D(x, y), r = Math.hypot(x - 40, y - 40) / 40, n = fbm(x / 7, y / 7, 60 + v), a = cl(d2 * (0.75 + 0.5 * n)) * sm((1 - r) / 0.45); if (a < 0.01) return null; const lit = cl(0.5 + (D(x, y + 4) - D(x, y - 4)) * 0.8), c = ramp(DR, 0.1 + 0.35 * cl(d2 / 1.6) + 0.35 * lit * lit + 0.15 * (n - 0.5)); return [c[0], c[1], c[2], a * 0.92]; }; })());
  /* a soft violet light band round a circle (shock fronts, ground rings): no crisp rim, it melts both sides */
  const sprBand = () => imgSprite('smBand', 160, 160, (x, y, w) => { const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - w / 2) / (w / 2); if (d >= 1) return null; const b = Math.exp(-Math.pow((d - 0.8) / 0.09, 2)), hz = 0.22 * Math.exp(-Math.pow((d - 0.62) / 0.2, 2)), a = (b + hz) * sm((1 - d) / 0.1); if (a < 0.008) return null; const c = ramp(LR, 0.3 + 0.65 * b); return [c[0], c[1], c[2], cl(a)]; });
  /* a dark disc of shadow volume (the shockwave's body): ink, densest at its rim, transparent in the middle (normal) */
  const sprShadowRing = () => imgSprite('smShR', 128, 128, (x, y, w) => { const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - w / 2) / (w / 2); if (d >= 1) return null; const n = fbm(x / 10, y / 10, 77), a = Math.exp(-Math.pow((d - 0.72) / 0.18, 2)) * (0.55 + 0.5 * (n - 0.4)) * sm((1 - d) / 0.12); if (a < 0.01) return null; const c = ramp(DR, 0.15 + 0.3 * n); return [c[0], c[1], c[2], cl(a)]; });
  /* violet fissures on the floor (light only, additive): branching cracks from the centre; 2 variants */
  const sprCracks = v => fxCache.get('smCr' + v) || fxSprite('smCr' + v, 256, 256, g => { g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round'; let s = 7 + v * 31; const Rr = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const paths = [];
    for (let i = 0; i < 9; i++) { let b = i / 9 * TAU + (Rr() - 0.5) * 0.5, x = 128 + Math.cos(b) * 10, y = 128 + Math.sin(b) * 10; const p = [[x, y]]; for (let k = 0; k < 8; k++) { b += (Rr() - 0.5) * 0.8; x += Math.cos(b) * 13; y += Math.sin(b) * 13; p.push([x, y]); } paths.push(p); if (Rr() < 0.7) { const q = p[3 + (Rr() * 3 | 0)]; let bb = b + (Rr() < 0.5 ? -1 : 1) * 0.9, xx = q[0], yy = q[1]; const p2 = [[xx, yy]]; for (let k = 0; k < 4; k++) { bb += (Rr() - 0.5) * 0.7; xx += Math.cos(bb) * 9; yy += Math.sin(bb) * 9; p2.push([xx, yy]); } paths.push(p2); } }
    for (const [col, lw] of [['rgba(110,40,220,0.12)', 9], ['rgba(138,77,255,0.32)', 4.5], ['rgba(185,131,245,0.7)', 2], ['rgba(240,232,255,0.85)', 0.8]]) { g.strokeStyle = col; g.lineWidth = lw; for (const p of paths) { g.beginPath(); p.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); } }
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  /* the Messiah beam (tileable along x): 'c' the dark core column (normal), 'e' the violet boundary and inner light (additive) */
  const sprBeam = kind => imgSprite('smBm' + kind, 256, 96, (x, y, w, h) => { const v = (y + 0.5 - h / 2) / (h / 2), n = fbm(x / (w / 10), y / 12, 90, 10), n2 = fbm(x / (w / 22), y / 6, 95, 22), wv = 0.62 + 0.18 * (n - 0.5) + 0.08 * (n2 - 0.5), q = v / wv;
    if (kind === 'c') { const a = Math.exp(-q * q * 2.2) * (0.85 + 0.3 * (n2 - 0.5)); if (a < 0.01) return null; const c = ramp(DR, 0.05 + 0.3 * n + 0.25 * Math.abs(q)); return [c[0], c[1], c[2], cl(a)]; }
    const edge = Math.exp(-Math.pow((Math.abs(q) - 0.82) / 0.2, 2)), core = 0.35 * Math.exp(-v * v * 30) * (0.6 + 0.8 * (n2 - 0.4)), a = edge * (0.6 + 0.6 * (n - 0.4)) + core; if (a < 0.01) return null; const c = ramp(LR, 0.3 + 0.6 * edge + 0.8 * core); return [c[0], c[1], c[2], cl(a)]; });
  /* the explosion's bloom: a dense black-violet sphere of smoke with a violet glow coming through it (normal) */
  const sprBloom = () => imgSprite('smBloom', 160, 160, (x, y, w) => { const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - w / 2) / (w / 2), d = Math.hypot(dx, dy), n = fbm(dx * 2.4 + 5, dy * 2.4 + 5, 110), n2 = fbm(dx * 6 + 9, dy * 6 + 9, 120), rr = 0.8 + 0.18 * (n - 0.5);
    const a = (1 - sm((d - rr + 0.12) / 0.24)) * (0.8 + 0.3 * (n2 - 0.5)); if (a < 0.01) return null; const lit = cl(0.6 - dy * 0.5 + 0.4 * (n2 - 0.5)), c = ramp(DR, 0.12 + 0.55 * lit * (1 - d * 0.5)); return [c[0], c[1], c[2], cl(a)]; });
  /* Dark Spikes' Coronation variant: the obsidian palette (EARTHC.clusterGen's pal) and its light sprites */
  const OBS = { key: 'obsidian', cry: [[6, 4, 12], [16, 12, 28], [32, 24, 54], [58, 46, 92], [112, 98, 160], [214, 206, 242]], rock: [[8, 7, 12], [18, 16, 26], [32, 28, 44], [52, 46, 68], [84, 76, 104]],
    inner: [40, 34, 22, 16, 70], st: [20, 14, 40], spec: [236, 230, 255], frs: [150, 96, 255], edge: [214, 204, 255], bounce: [110, 50, 210], sedge: [112, 102, 148], seam: [186, 120, 255],
    glow: (k, d, o) => { d[o] = 110 + 120 * sm(k * 1.3); d[o + 1] = 40 + 160 * sm((k - 0.3) / 0.7); d[o + 2] = 210 + 45 * sm(k * 1.5); } };
  const vband = () => fxSprite('smVBand', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); [[0, 'rgba(138,77,255,0)'], [0.6, 'rgba(138,77,255,0)'], [0.8, 'rgba(110,50,230,0.3)'], [0.9, 'rgba(160,110,255,0.7)'], [0.955, 'rgba(226,210,255,0.8)'], [1, 'rgba(226,210,255,0)']].forEach(q => gr.addColorStop(q[0], q[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const vdust = () => fxSprite('smVDust', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); [[0, 'rgba(20,12,32,0)'], [0.45, 'rgba(20,12,32,0)'], [0.68, 'rgba(22,14,36,0.3)'], [0.84, 'rgba(30,20,48,0.55)'], [0.93, 'rgba(46,32,70,0.4)'], [1, 'rgba(46,32,70,0)']].forEach(q => gr.addColorStop(q[0], q[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const vwarm = () => fxSprite('smVWarm', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 'rgba(226,206,255,0.85)'], [0.12, 'rgba(185,131,245,0.62)'], [0.3, 'rgba(138,77,255,0.32)'], [0.52, 'rgba(100,40,210,0.13)'], [0.75, 'rgba(100,40,210,0.04)'], [1, 'rgba(100,40,210,0)']].forEach(q => gr.addColorStop(q[0], q[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const vmote = () => fxSprite('smVMote', 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(246,240,255,1)'); gr.addColorStop(0.25, 'rgba(185,131,245,0.8)'); gr.addColorStop(0.6, 'rgba(110,40,220,0.2)'); gr.addColorStop(1, 'rgba(110,40,220,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const vpuff = () => fxSprite('smVPuff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(26,16,40,0.6)'); gr.addColorStop(0.45, 'rgba(22,14,34,0.32)'); gr.addColorStop(1, 'rgba(18,12,28,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  const VAR = { pal: OBS, col: { AMBER: '#7A3CFF', GOLD: '#A070FF', HONEY: '#C9A8FF', PALE: '#E6DAFF', CORE: '#F4EEFF' },
    fis: ['rgba(110,40,220,1)', 'rgba(124,58,240,1)', 'rgba(170,120,255,1)', 'rgba(238,228,255,1)'], crk: ['rgba(160,100,255,1)', 'rgba(240,232,255,1)'],
    band: vband, dust: vdust, warm: vwarm, mote: vmote, puff: vpuff };

  const BAKE = [() => glowSprite(C.vio), () => glowSprite(C.vio2), () => glowSprite(C.pale), () => glowSprite(C.wht), () => sprBand(), () => sprShadowRing(), () => sprCracks(0), () => sprCracks(1),
    () => sprSmoke(0), () => sprSmoke(1), () => sprSmoke(2),
    () => sprBeam('c'), () => sprBeam('e'), () => sprBloom(), vband, vdust, vwarm, vmote, vpuff, () => beamSprite(C.vio), () => beamSprite(C.pale)];
  let baked = 0, sp = { done: false, Spx: 0 };
  /* SM.warm(ms): bake a slice; true when every sprite is ready. A Spikes prewarm (the obsidian spires at the screen's
     size) follows when the core passes ctx (SM.warm(ms, ctx)); without it the spires bake on the first cast (spread). */
  let lastCtx = null;   /* (the core's ctx, seen through SM.update: the core calls SM.warm(ms) without it) */
  function warm(ms, ctx0) { const ctx = ctx0 || (lastCtx && (!lastCtx.form || lastCtx.form === 'robot') ? lastCtx : null), t0 = performance.now(), B = ms == null ? 3 : ms; DEADLINE = t0 + B;
    try { while (baked < BAKE.length && performance.now() - t0 < B) { let r = null; try { r = BAKE[baked](); } catch (e) { r = 1; } if (!r) break; baked++; }
      if (baked >= BAKE.length && ctx && !sp.done) { const left = B - (performance.now() - t0); if (left > 0.5) { const want = spireSpx(ctx); if (want) { const U = ELEM_IMPL.earth && ELEM_IMPL.earth.ult, ev = evoOf(ctx); if (U && U.coronation && U.coronation.prewarm) { try { sp.done = U.coronation.prewarm(want, ev, ev >= 7 ? 3 : ev >= 4 ? 2 : 1, OBS, left); } catch (e) { sp.done = true; } } else sp.done = true; } } } }
    finally { DEADLINE = 0; } if (baked < BAKE.length) return false; if (sp.done || (!ctx && !lastCtx)) return true; return (sp.n = (sp.n || 0) + 1) > 2400; }   /* (waits for the robot form to prewarm the spires; gives up after ~2400 slices) */
  const evoOf = ctx => Math.max(1, Math.min(7, Math.round(ctx.evo || (ctx.C && ctx.C.evo) || 1)));
  function spireSpx(ctx) { try { const T = ctx.H.X.Tz(), k = Math.min(typeof arc !== 'undefined' && arc.dpr || 1, 2); return Math.max(16, Math.min(150, Math.round(T * k / 8) * 8)); } catch (e) { return 0; } }

  /* ================= drawing helpers ================= */
  function setT(c, B, x, y, rot, sx, sy) { const cs = rot ? Math.cos(rot) : 1, sn = rot ? Math.sin(rot) : 0, kx = sx == null ? 1 : sx, ky = sy == null ? kx : sy; c.setTransform((B.a * cs + B.c * sn) * kx, (B.b * cs + B.d * sn) * kx, (-B.a * sn + B.c * cs) * ky, (-B.b * sn + B.d * cs) * ky, B.a * x + B.c * y + B.e, B.b * x + B.d * y + B.f); }
  function put(c, B, img, x, y, w, h, a, rot, add) { if (!img || !(a > 0.01) || !(w > 0.5)) return; c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, x, y, rot); c.drawImage(img, -w / 2, -h / 2, w, h); }
  function floor(c, B, img, x, y, r, a, add, GY) { if (!img || !(a > 0.01) || !(r > 0.5)) return; c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, x, y, 0, 1, GY); c.drawImage(img, -r, -r, r * 2, r * 2); }

  /* ================= the per-session system: acts + pooled particles ================= */
  const POOL = [];
  /* particle kinds: 0 violet mote (add), 1 white spark (add), 2 dark smoke (normal), 3 fragment (dark sliver, normal), 4 violet glow (add) */
  const ADD = [1, 1, 0, 0, 1];
  function zk(ctx, T) { try { if (ctx.scr && T > 0) { const a = ctx.scr(0, 0, 0), b = ctx.scr(0, 0, 1), k = (a[1] - b[1]) / T; if (k > 0.2 && k < 2) return k; } } catch (e) {} return 0.8; }
  function anchorW(ctx, name) { try { const p = ctx.anchor && ctx.anchor(name); if (p && isFinite(p.x)) return { x: p.x, y: p.y, z: p.z || 0 }; } catch (e) {} const v = ctx.vehicle || {}, a = v.heading || 0, air = v.form === 1 || v.form === 'airship';
    const f = { swordTip: air ? 2.2 : 1.8, swordChannel: air ? 1.4 : 1.2, cockpit: 0.2, seat: 0.2, thrusterL: -1.2, thrusterR: -1.2, wingRootL: 0, wingRootR: 0, helm: 0.3, feet: 0 }[name] || 0, z = { swordTip: air ? 0.6 : 0.2, swordChannel: air ? 1.2 : 1.8, cockpit: 2.2, seat: 2.2, thrusterL: 1.6, thrusterR: 1.6, wingRootL: 2.0, wingRootR: 2.0, helm: 3.2, feet: 0 }[name] || 0, sd = name === 'thrusterL' || name === 'wingRootL' ? -1 : name === 'thrusterR' || name === 'wingRootR' ? 1 : 0;
    return { x: (v.x || 0) + Math.cos(a) * f - Math.sin(a) * sd * 1.4, y: (v.y || 0) + Math.sin(a) * f * 0.72 + Math.cos(a) * sd * 1.0, z: (v.z || 0) + z }; }
  function sysOf(ctx) {
    if (ctx._sm && ctx._sm.on) return ctx._sm;
    const H = ctx.H && ctx.H.add ? ctx.H : null; if (!H) return null;
    const S = { H, ctx, on: true, keep: 0, acts: [], parts: [], T: H.X.Tz(), ZT: H.X.Tz() * 0.8, PX: 0, PY: -1e4, PR: 30, t: 0 };
    ctx._sm = S;
    function kill() { for (const a of S.acts) if (a.abort) try { a.abort(); } catch (e) {} S.acts.length = 0; for (const p of S.parts) POOL.push(p); S.parts.length = 0; S.on = false; }
    S.kill = kill;
    S.fx = H.add({ key: 'susanoo-moves', life: 1e9,
      update(dt, f) {
        if (!S.on) { f.life = 0; return; }
        let alive = true; try { alive = !ctx.alive || ctx.alive(); } catch (e) { alive = false; }
        S.alive = alive; S.t += dt;
        if (!alive && !S.keep) { kill(); f.life = 0; return; }
        S.T = H.X.Tz(); S.ZT = S.T * zk(ctx, S.T);
        for (let i = S.acts.length - 1; i >= 0; i--) { const a = S.acts[i]; try { a.update(dt); } catch (e) { a.dead = true; } if (a.dead) S.acts.splice(i, 1); }
        const P = S.parts; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); POOL.push(p); continue; }
          if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; } p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = 0; p.vx *= 0.8; p.vy *= 0.8; } p.rot += p.vr * dt; }
        if (!S.acts.length && !P.length) { kill(); f.life = 0; }
      },
      drawUnder(c) { if (!S.on) return; view(S); const B = c.getTransform(); c.save(); S.layer = true; S.cur = null; for (const a of S.acts) if (a.under) { try { a.under(c, B); } catch (e) {} c.setTransform(B); } drawParts(S, c, B, 1); endLayer(S, c); c.restore(); },
      draw(c) { if (!S.on) return; view(S); const B = c.getTransform(); c.save(); S.layer = true; S.cur = null; for (const a of S.acts) if (a.over) { try { a.over(c, B); } catch (e) {} c.setTransform(B); } drawParts(S, c, B, 0); endLayer(S, c); c.restore(); },
      onEnd() { if (S.on) kill(); } });
    return S;
  }
  function endLayer(S, c) { S.layer = false; const L = S.cur; S.cur = null; if (L) { L.shared = false; lowFlush(c, L); } }
  /* the pet's place on screen (the cockpit), for the soft dimming of bright things over it */
  function view(S) { const H = S.H, ctx = S.ctx, T = S.T; S.PR = T * 0.9; S.GY = H.GY || 0.55; let s = null; if (!S.noPet) s = anchorW(ctx, 'cockpit'); if (s) { S.PX = H.sx(s.x); S.PY = H.sy(s.y) - (s.z || 0) * S.ZT; } else { S.PX = -1e5; S.PY = -1e5; } }
  /* a wide smooth easing of brightness near the pet (never a disc); 1 when the pet is not to be protected */
  /* a low-res buffer for big soft layers (Dark Messiah's beam glow and explosion): one canvas at 1/3 size, drawn in
     order with a scaled transform (the dark smoke normal, the light additive inside it) and blitted once over the
     touched area; soft energy loses nothing and the fill cost drops ~9x */
  const LRK = 3;
  function lowBegin(S, c) { if (S.layer && S.cur) return S.cur; const cv = c.canvas, W = Math.max(1, Math.ceil(cv.width / LRK)), Hh = Math.max(1, Math.ceil(cv.height / LRK)); let L = S.lr;
    if (!L || L.W !== W || L.H !== Hh) { const mk = () => { const q = document.createElement('canvas'); q.width = W; q.height = Hh; return q; }; const dc = mk(), d = dc.getContext('2d'); L = S.lr = { W, H: Hh, dc, lc: dc, d, l: d }; }
    const B = c.getTransform(); L.B = { a: B.a / LRK, b: B.b / LRK, c: B.c / LRK, d: B.d / LRK, e: B.e / LRK, f: B.f / LRK };
    const box = q => q && q.x1 > q.x0 ? [Math.max(0, Math.floor(q.x0)), Math.max(0, Math.floor(q.y0)), Math.min(W, Math.ceil(q.x1)), Math.min(Hh, Math.ceil(q.y1))] : null;
    for (const [k, q] of [['ud', L.d]]) { const b = box(L[k]); if (b && b[2] > b[0] && b[3] > b[1]) { q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); } L[k] = null; }
    L.box = box; const sk = Math.hypot(L.B.a, L.B.b);
    /* the touched area of each buffer (low-res px), so only that is cleared and blitted */
    L.mark = (add, x, y, r) => { const k = 'ud', q = L[k] || (L[k] = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }), X = L.B.a * x + L.B.c * y + L.B.e, Y = L.B.b * x + L.B.d * y + L.B.f, R = r * sk + 2;
      if (X - R < q.x0) q.x0 = X - R; if (Y - R < q.y0) q.y0 = Y - R; if (X + R > q.x1) q.x1 = X + R; if (Y + R > q.y1) q.y1 = Y + R; };
    L.put = (img, x, y, w, h, a, rot, add) => { if (!(a > 0.01) || !img) return; put(add ? L.l : L.d, L.B, img, x, y, w, h, a, rot, add); L.mark(add, x, y, Math.hypot(w, h) / 2); };
    L.floor = (img, x, y, r, a, add, GY) => { if (!(a > 0.01) || !img) return; floor(add ? L.l : L.d, L.B, img, x, y, r, a, add, GY); L.mark(add, x, y, r); };
    L.shared = !!S.layer; if (S.layer) S.cur = L;   /* (inside a layer of the system the buffer is shared and blitted once, at the layer's end) */
    return L; }
  function lowFlush(c, L) { if (L.shared) return; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    for (const [k, cv, op] of [['ud', L.dc, 'source-over']]) { const b = L.box(L[k]); if (!b || b[2] <= b[0] || b[3] <= b[1]) continue; c.globalCompositeOperation = op; c.drawImage(cv, b[0], b[1], b[2] - b[0], b[3] - b[1], b[0] * LRK, b[1] * LRK, (b[2] - b[0]) * LRK, (b[3] - b[1]) * LRK); }
    c.restore(); }
  const petK = (S, X, Y, lo) => { if (S.cover) return 1; const d = Math.hypot(X - S.PX, (Y - S.PY) * 1.15) / S.PR; return d >= 2.2 ? 1 : lo + (1 - lo) * sm(d / 2.2); };
  function part(S, kind, x, y, z, vx, vy, vz, life, size, o) { if (!S || S.parts.length > (LOW() ? 240 : 560)) return null; const p = POOL.pop() || {};
    p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.t = 0; p.size = size; p.g = 0; p.drag = 0; p.rot = 0; p.vr = 0; p.grow = 0; p.a = 1; p.u = 0; p.v = 0; p.fin = 0.06;
    if (o) for (const k in o) p[k] = o[k]; S.parts.push(p); return p; }
  function partImg(p) { switch (p.kind) { case 0: return glowSprite(C.vio); case 1: return glowSprite(C.pale); case 2: return sprSmoke(p.v); case 3: return sprSmoke(p.v); default: return glowSprite(C.vio2); } }
  function drawParts(S, c, B, under) { const H = S.H, T = S.T, P = S.parts; if (!P.length) return;
    for (let pass = 0; pass < 2; pass++) { c.globalCompositeOperation = pass ? 'lighter' : 'source-over'; let LO = null;
      for (let i = 0; i < P.length; i++) { const p = P[i]; if (ADD[p.kind] !== pass || (p.u ? 1 : 0) !== under) continue;
        const u = p.t / p.life, a = p.a * Math.min(1, p.t / p.fin) * (p.kind === 2 ? (1 - u) * (1 - u) : 1 - u * u); if (a < 0.015) continue;
        const X = H.sx(p.x), Y = H.sy(p.y) - p.z * S.ZT, s = p.size * T * (1 + p.grow * u), img = partImg(p), k = under ? 1 : petK(S, X, Y, pass ? 0.35 : 0.5); if (a * k < 0.015 || !img) continue;
        c.globalAlpha = a * k > 1 ? 1 : a * k;
        if (p.kind === 3) { setT(c, B, X, Y, p.rot); c.drawImage(img, -s / 2, -s * 0.12, s, s * 0.24); }   // a dark sliver
        else if (p.kind === 2 && s > T * 1.2) { if (!LO) LO = lowBegin(S, c); LO.put(img, X, Y, s, s, c.globalAlpha, p.rot, false); }   // big soft smoke: low-res
        else { setT(c, B, X, Y, p.rot); c.drawImage(img, -s / 2, -s / 2, s, s); } }
      if (LO) { lowFlush(c, LO); c.setTransform(B); } }
    c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }

  /* ================= shared bits ================= */
  const sfx = (X, k, ...a) => { try { const F = X.sfx; if (F && F[k]) F[k](...a); } catch (e) {} };
  const once = ctx => { let d = false; return () => { if (d) return; d = true; try { ctx.done && ctx.done(); } catch (e) {} }; };
  function cam(ctx, o) { try { if (ctx.camera) ctx.camera(o); } catch (e) {} }
  function shake(ctx, X, k, d) { if (RM()) k *= 0.35; try { if (ctx.camera) { ctx.camera({ shake: k, dur: d }); return; } } catch (e) {} if (X.shake) X.shake(k, d); }
  function monsOf(ctx, H) { try { if (ctx.mons) { const L = ctx.mons(); if (L) return L; } } catch (e) {} return H.living(); }
  const gone = m => !m || m.dead || m.under || m.falling;
  function hitM(ctx, m, dmg, o) { try { return ctx.hit ? ctx.hit(m, dmg, o) : 0; } catch (e) { return 0; } }
  function ground(ctx, x, y) { try { return ctx.groundAt ? !!ctx.groundAt(x, y) : true; } catch (e) { return true; } }
  function blocked(X, x, y) { try { return X.blocked ? !!X.blocked(x, y, 0.2, 0) : false; } catch (e) { return false; } }
  /* the pose: A's helpers when they exist (ctx.pose(name, u) / ctx.poseClip), else the model's channels written directly */
  function poseOf(ctx) { const v = ctx.vehicle; return v && (v.pose || (v.pose = {})); }
  function setPose(ctx, name, u, extra) { try { if (typeof ctx.pose === 'function') { ctx.pose(name, u, extra); return; } } catch (e) {} const P = poseOf(ctx); if (!P) return; P.sword = name; P.swordT = u; if (extra) for (const k in extra) P[k] = extra[k]; }
  /* the aimed direction / point */
  function aimOf(ctx, H, v, range) { let tg = null; try { tg = ctx.target && ctx.target(); } catch (e) {} const a0 = v.heading || 0;
    if (tg && isFinite(tg.x)) { const d = Math.hypot(tg.x - v.x, tg.y - v.y); return { a: d > 0.3 ? Math.atan2(tg.y - v.y, tg.x - v.x) : a0, x: tg.x, y: tg.y, m: tg.m || null, d }; }
    let ap = null; try { ap = ctx.aimPoint && ctx.aimPoint(); } catch (e) {} if (ap && isFinite(ap.x)) return { a: Math.atan2(ap.y - v.y, ap.x - v.x), x: ap.x, y: ap.y, m: null, d: Math.hypot(ap.x - v.x, ap.y - v.y) };
    return { a: a0, x: v.x + Math.cos(a0) * range, y: v.y + Math.sin(a0) * range, m: null, d: range }; }
  function tierOf(ctx) { const ev = evoOf(ctx); return ctx.tier != null ? ctx.tier : ev >= 7 ? 2 : ev >= 4 ? 1 : 0; }
  function dkOf(ctx) { const ev = evoOf(ctx), Cc = ctx.C || {}; return ctx.DK > 0 ? ctx.DK : (Cc.base || 10) * (Cc.K || 1) * (1 + 0.08 * (ev - 1)); }

  /* ================= True Dark Blade ================= */
  function darkBlade(ctx) {
    const S = sysOf(ctx), done = once(ctx), v = ctx.vehicle; if (!S || !v) { done(); return; }
    const H = S.H, X = H.X, tu = TUNE.blade, tier = tierOf(ctx), DK = dkOf(ctx), dmg = DK * tu.dmg, L = LOW();
    const A = aimOf(ctx, H, v, 4), ang = A.a, ca = Math.cos(ang), sa = Math.sin(ang), RANGE = tu.range[tier], W0 = tu.width[tier], HW = tu.height[tier], NL = tu.lanes;
    v.heading = ang; if (v.wantHeading !== undefined) v.wantHeading = ang;
    const hits = new Set(); let t = 0, ph = 'lift', fired = false, finished = false, ox = 0, oy = 0, front = 0;
    const lanes = []; for (let i = 0; i < NL; i++) lanes.push({ u: (i + 0.5) / NL - 0.5, stop: RANGE, s: Math.random() * 10, seed: i });
    const marks = [], bowOf = w => Math.min(1.5, w * 0.24);   // floor fissures left under the leading edge (light only, fading); the crescent's bow
    /* the slash's frame: whatever the direction, its chord lies roughly along screen-x (world x, leaning a little with
       the travel), so it always reads as a wide horizontal arc; it bulges toward the travel's depth side (down the screen
       going down or sideways, up the screen going up, passing smoothly through straight at about 20 deg above level) */
    const lean = 0.24 * ca, ex = Math.cos(lean), ey = Math.sin(lean), nx = -ey, ny = ex, fb = sa >= 0 ? 1 : lerp(1, -1, sm(-sa / 0.7));
    const arcPt = (u, f) => { const w = W0 + tu.spread * Math.min(f, RANGE), b = bowOf(w) * 1.6 * fb * (1 - Math.min(1, 4 * u * u)); return { x: ox + ca * f + ex * u * w + nx * b, y: oy + sa * f + ey * u * w + ny * b }; };
    sfx(X, 'note', 70, 0.4, 'sawtooth', 0.07, 120); sfx(X, 'hum');
    const act = { update(dt) { t += dt;
        if (!S.alive) { if (!finished) { finished = true; done(); } if (!fired || front >= RANGE + 1 || t > 3) act.dead = true; return; }
        const T1 = tu.lift, T2 = T1 + tu.slam, T3 = T2 + tu.recoil;
        if (t < T1) { setPose(ctx, 'overhead', sm(t / T1), { channel: sm(t / T1), glow: 0.4 + 0.6 * sm(t / T1), crouch: 0.1 }); const tip = anchorW(ctx, 'swordTip'); if (Math.random() < (L ? 0.3 : 0.8)) part(S, 0, tip.x + rnd(-0.3, 0.3), tip.y + rnd(-0.2, 0.2), tip.z + rnd(-0.4, 0.2), 0, 0, rnd(0.5, 1.5), rnd(0.25, 0.4), rnd(0.25, 0.4), { fin: 0.03 }); }
        else if (t < T2) { setPose(ctx, 'overheadSlam', ein((t - T1) / tu.slam), { channel: 1, glow: 1, crouch: 0.3 }); }
        else if (!fired) { fired = true; impact(); }
        if (fired && t < T3) setPose(ctx, 'overheadSlam', 1, { channel: 1 - sm((t - T2) / tu.recoil), glow: 1 - 0.6 * sm((t - T2) / tu.recoil), crouch: 0.3 * (1 - sm((t - T2) / tu.recoil)), recoil: 1 - (t - T2) / tu.recoil });
        if (fired && t >= T3 && !finished) { finished = true; setPose(ctx, 'rest', 1, { channel: 0, glow: 0, recoil: 0 }); done(); }
        if (fired) { const prev = front; front = Math.min(RANGE + 1.2, front + tu.speed * dt);
          // each lane advances until a wall: the hit is the lane's front passing over a monster (once per activation)
          for (const ln of lanes) { if (ln.stop < RANGE) continue; const f2 = Math.min(front, RANGE), q = arcPt(ln.u, f2); if (f2 > 0.6 && blocked(X, q.x, q.y)) ln.stop = Math.max(0.4, f2 - 0.3); }
          // the hit: the drawn arc (each lane at its own front, stopped ones excluded) passing over a monster, once per activation
          if (front <= RANGE + 0.3) { const A = lanes.map(ln => front > ln.stop + 0.4 ? null : arcPt(ln.u, Math.min(front, ln.stop))), band = tu.band;
            for (const m of monsOf(ctx, H)) { if (gone(m) || hits.has(m)) continue; const r = (m.r || 0.4) + band; let hit = false;
              for (let i = 1; i < A.length && !hit; i++) { const p = A[i - 1], q = A[i]; if (!p || !q) continue; const vx = q.x - p.x, vy = q.y - p.y, l2 = vx * vx + vy * vy || 1e-6, k = Math.max(0, Math.min(1, ((m.x - p.x) * vx + (m.y - p.y) * vy) / l2)); if (Math.hypot(m.x - p.x - vx * k, m.y - p.y - vy * k) < r) hit = true; }
              if (hit) { hits.add(m); hitM(ctx, m, dmg, { kb: tu.kb, el: 'dark', src: 'strong' }); } } }
          // fragments drawn up the face, smoke rolling off the crest; floor fissures under the leading edge
          if (front < RANGE) { let k = (L ? 10 : 26) * dt + Math.random(); while (k-- >= 1) { const ln = lanes[(Math.random() * NL) | 0]; if (front > ln.stop) continue; const q0 = arcPt(ln.u, front);
              const qx = q0.x, qy = q0.y, rr = Math.random();
              if (rr < 0.5) part(S, 1, qx, qy, tu.z, ca * tu.speed * rnd(0.5, 0.9) + rnd(-1.5, 1.5), sa * tu.speed * rnd(0.5, 0.9) + rnd(-1.5, 1.5), rnd(0.5, 2), rnd(0.2, 0.4), rnd(0.14, 0.24), { g: 4, drag: 2.5 });   // sparks thrown off the edge
              else if (rr < 0.85) part(S, 2, qx - ca * 0.3, qy - sa * 0.3, tu.z * rnd(0.5, 1.2), ca * rnd(0.5, 1.5), sa * rnd(0.5, 1.5), rnd(0.1, 0.5), rnd(0.35, 0.6), rnd(0.35, 0.6), { v: (Math.random() * 3) | 0, rot: Math.random() * TAU, vr: rnd(-2, 2), grow: 0.9, drag: 3, a: 0.45 });   // dark wisps trailing
              else part(S, 0, qx, qy, tu.z, ca * 1.5, sa * 1.5, rnd(0.3, 1), rnd(0.3, 0.6), rnd(0.18, 0.3), { drag: 2, fin: 0.03 }); }
            if (Math.floor(front / 1.1) !== Math.floor(prev / 1.1)) marks.push({ x: ox + ca * front, y: oy + sa * front, t: 0, rot: Math.random() * TAU, v: marks.length % 2, s: 0.8 + 0.3 * Math.random() + 0.1 * front }); }
          for (const mk of marks) mk.t += dt;
          if (front >= RANGE + 1.2 && marks.every(m => m.t > 1.4)) act.dead = true; } },
      under(c, B) { if (!fired) return; const T = S.T, GY = S.GY;
        // fissures that light under the leading edge and fade behind it (light only)
        for (const mk of marks) { const a = Math.min(1, mk.t / 0.08) * (1 - sm((mk.t - 0.2) / 1.2)); if (a > 0.01) { setT(c, B, H.sx(mk.x), H.sy(mk.y), 0, 1, GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.85; c.rotate(mk.rot); const r = T * 1.7 * mk.s; c.drawImage(sprCracks(mk.v), -r, -r, r * 2, r * 2); } }
        // the blade's impact: a soft violet bloom and a band of light
        const it = t - tu.lift - tu.slam; if (it < 0.7) { floor(c, B, glowSprite(C.vio2), H.sx(ox), H.sy(oy), T * 2.6, 0.7 * (1 - it / 0.7), true, GY); floor(c, B, sprBand(), H.sx(ox), H.sy(oy), T * (0.6 + 2.6 * eout(it / 0.4)), (1 - sm(it / 0.5)) * 0.9, true, GY); }
        // a light under the wave's front
        if (front < RANGE + 0.6) { const w = W0 + tu.spread * Math.min(front, RANGE); for (let i = 0; i < 3; i++) { const u = (i - 1) / 3, q = arcPt(u, front); floor(c, B, glowSprite(C.vio2), H.sx(q.x), H.sy(q.y), T * w * 0.3, 0.22 * (1 - sm((front - RANGE) / 0.6)), true, GY); } } },
      over(c, B) { if (!fired) return; const T = S.T, fade = 1 - sm((front - RANGE) / 1.0); if (fade <= 0.01) return;
        /* the slash: a thin crescent lying flat over the ground (a little above it), bowed forward, its tips trailing and
           tapering to points; a dark core with a sharp edge, a bright violet edge glow along its front, a feathered outer
           glow, a pale hot thread. Each part of it stops at its lane's wall. */
        const N = 26, zz = tu.z * S.ZT, grow = sm(front / 0.7), P = [], GY = S.GY, nl = Math.hypot(nx, ny * GY) || 1, sg = fb < 0 ? -1 : 1, bnx = -sg * nx / nl, bny = -sg * ny * GY / nl;   /* (bn: the inner side, on screen) */
        for (let i = 0; i <= N; i++) { const u = i / N - 0.5, ln = lanes[Math.max(0, Math.min(NL - 1, Math.floor((u + 0.5) * NL)))], endA = 1 - sm((front - ln.stop) / 0.4), q = arcPt(u, Math.min(front, ln.stop)), tp = Math.pow(Math.max(0, 1 - 4 * u * u), 0.6), th = tu.thick * T * 0.75 * tp * (0.5 + 0.5 * grow);
          const X0 = H.sx(q.x), Y0 = H.sy(q.y) - zz;
          P.push({ X: X0, Y: Y0, BX: X0 + bnx * th, BY: Y0 + bny * th, a: fade * endA * petK(S, X0, Y0, 0.35), tp }); }
        const strip = (img, wk, ak, back) => { for (let i = 1; i < P.length; i++) { const p = P[i - 1], q = P[i], x0 = back ? p.BX : p.X, y0 = back ? p.BY : p.Y, x1 = back ? q.BX : q.X, y1 = back ? q.BY : q.Y, a = Math.min(p.a, q.a) * ak * (0.25 + 0.75 * Math.min(p.tp, q.tp)); if (a < 0.02) continue;
            const Ls = Math.hypot(x1 - x0, y1 - y0), wc = T * wk * (0.35 + 0.65 * Math.max(p.tp, q.tp)); setT(c, B, x0, y0, Math.atan2(y1 - y0, x1 - x0)); c.globalAlpha = Math.min(1, a); c.drawImage(img, -wc * 0.5, -wc, Ls + wc, wc * 2); } };
        // the feathered outer glow (behind the core), the dark core, then the edge light
        c.globalCompositeOperation = 'lighter'; strip(beamSprite(C.vio2), 0.9, 0.55, false); strip(beamSprite(C.vio2), 0.55, 0.3, true);
        c.setTransform(B); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#140822';   /* (per segment, so a part stopped at a wall fades with its glow) */
        for (let i = 1; i < P.length; i++) { const p = P[i - 1], q = P[i], a = Math.min(p.a, q.a); if (a < 0.02) continue; c.globalAlpha = Math.min(1, 0.92 * a); c.beginPath(); c.moveTo(p.X, p.Y); c.lineTo(q.X + (q.X - p.X) * 0.04, q.Y + (q.Y - p.Y) * 0.04); c.lineTo(q.BX, q.BY); c.lineTo(p.BX, p.BY); c.closePath(); c.fill(); }
        c.globalCompositeOperation = 'lighter'; strip(beamSprite(C.vio), 0.32, 0.9, false); strip(beamSprite(C.pale), 0.11, 0.95, false);
        c.setTransform(B); c.globalCompositeOperation = 'source-over'; }
    };
    function impact() { const tip = anchorW(ctx, 'swordTip'); ox = tip.x; oy = tip.y; if (!isFinite(ox)) { ox = v.x + ca * 1.8; oy = v.y + sa * 1.8; }
      // the blade's own impact: in the same hit set as the wave
      for (const m of monsOf(ctx, H)) { if (gone(m) || hits.has(m)) continue; if (Math.hypot(m.x - ox, m.y - oy) < tu.impactR + (m.r || 0.4)) { hits.add(m); hitM(ctx, m, dmg, { kb: tu.kb, el: 'dark', src: 'strong' }); } }
      shake(ctx, X, 8, 0.25); X.hitstop && X.hitstop(0.05); X.light && X.light(ox, oy, 3, 0.4); sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'whoosh'); sfx(X, 'note', 48, 0.6, 'sawtooth', 0.12, 30);
      for (let i = 0; i < (L ? 6 : 16); i++) { const a2 = Math.random() * TAU, sp2 = rnd(2, 6); part(S, i % 3 ? 3 : 1, ox, oy, 0.2, Math.cos(a2) * sp2, Math.sin(a2) * sp2 * 0.7, rnd(2, 6), rnd(0.35, 0.7), i % 3 ? rnd(0.25, 0.45) : rnd(0.3, 0.5), { g: 12, drag: 1, v: i % 3, rot: Math.random() * TAU, vr: rnd(-8, 8) }); } }
    S.acts.push(act);
  }
  /* a tileable vertical-scrolling blit (the smoke climbs the face) */
  function drawScroll(c, img, x, y, w, h, o) { if (!img) return; const H2 = img.height, off = ((o % H2) + H2) % H2, k = h / H2; if (off < 0.5) { c.drawImage(img, x, y, w, h); return; } c.drawImage(img, 0, off, img.width, H2 - off, x, y, w, (H2 - off) * k); c.drawImage(img, 0, 0, img.width, off, x, y + (H2 - off) * k, w, off * k); }

  /* ================= Dark Spikes (Crystal Coronation's Dark variant) ================= */
  function darkSpikes(ctx) {
    const S = sysOf(ctx), done = once(ctx), v = ctx.vehicle; if (!S || !v) { done(); return; }
    const H = S.H, X = H.X, tu = TUNE.spikes, DK = dkOf(ctx), ev = evoOf(ctx), L = LOW();
    const A = aimOf(ctx, H, v, 4.5); let tx = A.x, ty = A.y; if (!ground(ctx, tx, ty)) { try { const p = ctx.nearestLand && ctx.nearestLand(tx, ty); if (p && isFinite(p.x)) { tx = p.x; ty = p.y; } } catch (e) {} }
    v.heading = A.a; if (v.wantHeading !== undefined) v.wantHeading = A.a;
    let t = 0, impaled = false, launched = false, finished = false, sx0 = 0, sy0 = 0, fis = null;
    sfx(X, 'note', 60, 0.35, 'sawtooth', 0.07, 90);
    const act = { update(dt) { t += dt;
        if (!S.alive) { if (!finished) { finished = true; done(); } act.dead = true; return; }
        const T1 = tu.turn, T2 = T1 + tu.plunge, T3 = T2 + tu.fissure, T4 = T3 + tu.recoil;
        if (t < T1) setPose(ctx, 'pointDown', sm(t / T1), { channel: 0.6 * sm(t / T1), glow: 0.5, crouch: 0.1 });
        else if (t < T2) setPose(ctx, 'pointDownPlunge', ein((t - T1) / tu.plunge), { channel: 1, glow: 1, crouch: 0.35 });
        else if (!impaled) { impaled = true; const tip = anchorW(ctx, 'swordTip'); sx0 = tip.x; sy0 = tip.y; if (!isFinite(sx0)) { sx0 = v.x + Math.cos(A.a) * 1.6; sy0 = v.y + Math.sin(A.a) * 1.6; } fis = { t: 0, paths: fissurePaths(sx0, sy0, tx, ty) };
          shake(ctx, X, 7, 0.22); X.hitstop && X.hitstop(0.04); X.light && X.light(sx0, sy0, 2.5, 0.35); sfx(X, 'crash'); sfx(X, 'crack'); sfx(X, 'note', 40, 0.5, 'sine', 0.4, 28);
          for (let i = 0; i < (L ? 5 : 12); i++) { const a2 = Math.random() * TAU, sp2 = rnd(1.5, 4); part(S, i % 2 ? 3 : 2, sx0, sy0, 0.1, Math.cos(a2) * sp2, Math.sin(a2) * sp2 * 0.7, rnd(1, 4), rnd(0.4, 0.8), i % 2 ? rnd(0.2, 0.4) : rnd(0.7, 1.1), { g: i % 2 ? 10 : 0, drag: 1.4, v: i % 3, rot: Math.random() * TAU, vr: rnd(-6, 6), grow: i % 2 ? 0 : 0.8, a: 0.7 }); } }
        if (impaled && t < T4) setPose(ctx, 'pointDownPlunge', 1, { channel: 1 - 0.5 * sm((t - T2) / (T4 - T2)), glow: 1 - 0.5 * sm((t - T2) / (T4 - T2)), crouch: 0.35 * (1 - sm((t - T3) / tu.recoil)) });
        if (fis) fis.t += dt;
        // the fissures reach the area: the formation (Crystal Coronation's Dark variant) takes over there
        if (impaled && !launched && t >= T3) { launched = true; launch(); }
        if (t >= T4 && !finished) { finished = true; setPose(ctx, 'rest', 1, { channel: 0, glow: 0 }); done(); }
        if (finished && launched && (!fis || fis.t > 1.6)) act.dead = true; },
      under(c, B) { if (!fis) return; const T = S.T, u = cl(fis.t / tu.fissure), fa = 1 - sm((fis.t - 0.6) / 1.0); if (fa <= 0.01) return; c.setTransform(B); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        // dark fissures racing from the sword to the area: a violet haze under a pale thread, the head glowing (light only)
        for (const [col, w, al] of [['rgba(110,40,220,1)', 0.34, 0.1], ['rgba(138,77,255,1)', 0.15, 0.3], ['rgba(185,131,245,1)', 0.065, 0.7], ['rgba(240,232,255,1)', 0.025, 0.85]]) { c.strokeStyle = col; c.lineWidth = Math.max(0.7, w * T); c.globalAlpha = al * fa; c.beginPath();
          for (const p of fis.paths) { const n = Math.max(2, Math.ceil(p.length * u)); c.moveTo(H.sx(p[0][0]), H.sy(p[0][1])); for (let i = 1; i < n; i++) c.lineTo(H.sx(p[i][0]), H.sy(p[i][1])); } c.stroke(); }
        if (u < 1) for (const p of fis.paths) { const q = p[Math.max(0, Math.ceil(p.length * u) - 1)]; floor(c, B, glowSprite(C.vio), H.sx(q[0]), H.sy(q[1]), T * 0.7, 0.7 * fa, true, S.GY); }
        floor(c, B, glowSprite(C.vio2), H.sx(sx0), H.sy(sy0), T * 1.4, 0.5 * (1 - sm(fis.t / 0.8)), true, S.GY); } };
    function fissurePaths(x0, y0, x1, y1) { const out = [], d = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / d, ny = (x1 - x0) / d;
      for (let k = 0; k < (L ? 2 : 3); k++) { const p = [], off = (k - 1) * 0.5, N = 12; for (let i = 0; i <= N; i++) { const u = i / N, j = (Math.random() - 0.5) * 0.35 * Math.sin(u * Math.PI) + off * Math.sin(u * Math.PI); p.push([lerp(x0, x1, u) + nx * j, lerp(y0, y1, u) + ny * j]); } out.push(p); } return out; }
    function launch() { const U = ELEM_IMPL.earth && ELEM_IMPL.earth.ult; if (!U || !U.coronation) return;
      const live = () => { try { return !ctx.alive || !!ctx.alive(); } catch (e) { return false; } };
      const Cc = ctx.C || {}, K = Cc.K || 1, base = DK / (K * (1 + 0.08 * (ev - 1)));
      const C2 = { tx, ty, evo: ev, K, base, el: 'dark', dmgO: o => Object.assign({ el: 'dark', src: 'strong' }, o || {}) };
      const V = Object.assign({}, VAR, { banner: false, timeK: tu.timeK, oneHit: true, crownDmg: DK * tu.erupt, finDmg: DK * tu.burst, alive: live, petAt: () => { const q = anchorW(ctx, 'cockpit'); return [H.sx(q.x), H.sy(q.y) - (q.z || 0) * H.X.Tz() * zk(ctx, H.X.Tz())]; }, petDim: 0.85,   /* (spires in front of the cockpit fade softly: the pet stays visible) */   /* (the core's alive: the eruption outlives this move's own system) */
        hit: (m, d, o) => { if (!live()) return; hitM(ctx, m, d, Object.assign({ el: 'dark', src: 'strong' }, o || {})); } });
      try { const F = U.coronation(C2, H, V); if (F) F.key = 'susanoo-spikes'; } catch (e) {} }
    S.acts.push(act);
  }

  /* ================= Shockwave Pulsar ================= */
  function pulsar(ctx) {
    const S = sysOf(ctx), done = once(ctx), v = ctx.vehicle; if (!S || !v) { done(); return; }
    const H = S.H, X = H.X, tu = TUNE.pulsar, tier = tierOf(ctx), DK = dkOf(ctx), R = tu.r[tier], L = LOW();
    // a valid ground point (the aimed enemy, else the aim point); none: the cast fizzles at the focus (no damage)
    let A = null; try { const tg = ctx.target && ctx.target(); if (tg && isFinite(tg.x)) A = { x: tg.x, y: tg.y }; } catch (e) {} if (!A) { try { const ap = ctx.aimPoint && ctx.aimPoint(); if (ap && isFinite(ap.x)) A = { x: ap.x, y: ap.y }; } catch (e) {} }
    if (A && !ground(ctx, A.x, A.y)) A = null;
    const a0 = v.heading || 0, aT = A ? Math.atan2(A.y - v.y, A.x - v.x) : a0;
    let t = 0, fired = false, hitDone = false, finished = false, ix = A ? A.x : 0, iy = A ? A.y : 0, shock = -1;
    sfx(X, 'note', 330, 0.25, 'triangle', 0.05, 520);
    const T1 = tu.aim, T2 = T1 + tu.charge, T3 = T2 + tu.ray, T4 = T3 + tu.squeeze, T5 = T4 + tu.recoil;
    const act = { update(dt) { t += dt;
        if (!S.alive) { if (!finished) { finished = true; done(); } act.dead = true; return; }
        // turn toward the point (bounded), gather the charge at the focus
        if (t < T1) { const d = wrapA(aT - (v.heading || 0)); v.heading = (v.heading || 0) + d * Math.min(1, dt * 14); setPose(ctx, 'pulsarAim', sm(t / T1), { channel: 0.3 }); }
        else if (t < T2) { setPose(ctx, 'pulsarAim', 1, { channel: 0.3 + 0.7 * sm((t - T1) / tu.charge), charge: sm((t - T1) / tu.charge) }); const tip = anchorW(ctx, 'swordTip'); if (Math.random() < (L ? 0.4 : 0.9)) { const a2 = Math.random() * TAU, r = rnd(0.6, 1.1); part(S, 0, tip.x + Math.cos(a2) * r, tip.y + Math.sin(a2) * r * 0.7, tip.z + rnd(-0.4, 0.4), -Math.cos(a2) * r * 5, -Math.sin(a2) * r * 3.5, 0, 0.18, rnd(0.2, 0.32), { fin: 0.03 }); } }
        else if (!fired) { fired = true; if (A) { sfx(X, 'zap'); sfx(X, 'note', 880, 0.12, 'square', 0.04, 440); shake(ctx, X, 3, 0.1); } else { sfx(X, 'wrong'); } }
        if (fired && A && t >= T4 && shock < 0) { shock = 0; boom(); }
        if (shock >= 0) { shock += dt; if (!hitDone) { hitDone = true;
            // one hit per enemy within the shockwave's footprint (the drawn ring's radius), once per cast
            for (const m of monsOf(ctx, H)) { if (gone(m)) continue; if (Math.hypot(m.x - ix, m.y - iy) < R + (m.r || 0.4)) hitM(ctx, m, DK * tu.dmg, { kb: tu.kb, el: 'dark', src: 'strong' }); } } }
        if (t >= T5 && !finished) { finished = true; setPose(ctx, 'rest', 1, { channel: 0, charge: 0, recoil: 0 }); done(); }
        if (fired && t < T5) setPose(ctx, 'pulsarFire', sm((t - T2) / (T5 - T2)), t < T3 ? { channel: 1, charge: 1 } : { channel: 1 - sm((t - T3) / (T5 - T3)), charge: 0, recoil: 1 - sm((t - T3) / (T5 - T3)) });
        if (finished && (!A || shock > 1.4)) act.dead = true; },
      under(c, B) { if (shock < 0) return; const T = S.T, GY = S.GY, X0 = H.sx(ix), Y0 = H.sy(iy), u = shock;
        floor(c, B, glowSprite(C.vio2), X0, Y0, T * R * 1.6, 0.7 * Math.exp(-u * 3), true, GY);
        if (u < 1.2) { setT(c, B, X0, Y0, 0, 1, GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, cl(u / 0.05) * (1 - sm((u - 0.3) / 0.9))); c.rotate(ix * 3.1); const rr = T * R * 1.1 * eout(u / 0.25); c.drawImage(sprCracks(1), -rr, -rr, rr * 2, rr * 2); }
        // the shadow volume and the bright expanding rim (its edge at R when it peaks: the hit's footprint)
        const q = cl(u / 0.32), rr = T * R * (0.25 + 0.8 * eout(q)); floor(c, B, sprShadowRing(), X0, Y0, rr * 1.05, (1 - sm((u - 0.25) / 0.8)) * 0.85, false, GY); floor(c, B, sprBand(), X0, Y0, rr * 1.12, (1 - sm(u / 0.55)) * 1.0, true, GY); },
      over(c, B) { const T = S.T;
        // the charge at the focus, the ray, the compression and the burst of light
        const tip = anchorW(ctx, 'swordTip'), PX = H.sx(tip.x), PY = H.sy(tip.y) - tip.z * S.ZT;
        if (t > T1 && t < T3 + 0.05) { const g = sm((t - T1) / tu.charge), k = petK(S, PX, PY, 0.4); put(c, B, glowSprite(C.vio2), PX, PY, T * (0.6 + 1.2 * g), T * (0.6 + 1.2 * g), 0.7 * g * k, 0, true); put(c, B, glowSprite(C.wht), PX, PY, T * (0.25 + 0.5 * g), T * (0.25 + 0.5 * g), g * k, 0, true); }
        if (!A) { if (fired && t < T3 + 0.2) put(c, B, glowSprite(C.vio), PX, PY, T * 1.2, T * 1.2, 1 - (t - T3) / 0.2, 0, true); return; }
        const X1 = H.sx(ix), Y1 = H.sy(iy);
        if (fired && t < T4 + 0.1) { const a = t < T3 ? 1 : 1 - sm((t - T3) / (tu.squeeze + 0.1)), dx = X1 - PX, dy = Y1 - PY, Lr = Math.hypot(dx, dy), an = Math.atan2(dy, dx), w = T * 0.7, grow = cl((t - T2) / 0.05);
          setT(c, B, PX, PY, an); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(beamSprite(C.vio), -w * 0.2, -w, Lr * grow + w * 0.4, w * 2); c.globalAlpha = a; c.drawImage(beamSprite(C.pale), -w * 0.1, -w * 0.35, Lr * grow + w * 0.2, w * 0.7); c.setTransform(B); }
        if (fired && t >= T3 - 0.02 && shock < 0.2) { const sq = t < T4 ? 1 - (t - T3) / tu.squeeze : 0, r = T * (0.25 + 0.6 * sq) + (shock >= 0 ? T * R * 0.6 * eout(shock / 0.2) : 0), a = shock >= 0 ? 1 - shock / 0.2 : 1; put(c, B, glowSprite(C.wht), X1, Y1 - T * 0.2, r * 2, r * 2, a, 0, true); put(c, B, glowSprite(C.vio2), X1, Y1 - T * 0.2, r * 3.5, r * 3.5, 0.6 * a, 0, true); } } };
    function boom() { shake(ctx, X, 10, 0.3); X.hitstop && X.hitstop(0.05); X.light && X.light(ix, iy, R * 1.6, 0.5); X.flash && X.flash(RM() ? 0.04 : 0.08, '#D8C2FF'); sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'note', 44, 0.7, 'sine', 0.5, 26);
      for (let i = 0; i < (L ? 6 : 16); i++) { const a2 = Math.random() * TAU, sp2 = rnd(2, 6); part(S, 3, ix + Math.cos(a2) * 0.4, iy + Math.sin(a2) * 0.3, 0.2, Math.cos(a2) * sp2, Math.sin(a2) * sp2 * 0.7, rnd(3, 7), rnd(0.5, 0.9), rnd(0.25, 0.5), { g: 12, drag: 0.8, v: i % 3, rot: Math.random() * TAU, vr: rnd(-8, 8) }); }
      for (let i = 0; i < (L ? 5 : 12); i++) { const a2 = i / 12 * TAU + rnd(-0.2, 0.2), sp2 = R * rnd(1.6, 2.2); part(S, 2, ix + Math.cos(a2) * 0.6, iy + Math.sin(a2) * 0.45, 0.25, Math.cos(a2) * sp2, Math.sin(a2) * sp2 * 0.72, rnd(0.3, 1), rnd(0.7, 1.1), rnd(1.0, 1.5), { drag: 2.6, grow: 0.9, v: i % 3, rot: Math.random() * TAU, vr: rnd(-1, 1), a: 0.75 }); }
      for (let i = 0; i < (L ? 6 : 14); i++) { const a2 = Math.random() * TAU, sp2 = rnd(1, 4); part(S, 0, ix, iy, 0.3, Math.cos(a2) * sp2, Math.sin(a2) * sp2 * 0.7, rnd(1, 4), rnd(0.5, 1.0), rnd(0.25, 0.45), { drag: 1.2 }); } }
    S.acts.push(act);
  }

  /* ================= Dark Messiah ================= */
  /* ================= Dark Messiah (v2: gather, condense, drop, detonate) =================
     Gather: dark pulsing energy drawn in from all round into the airship's underbelly (tendrils, spiralling motes, pulses
     beating faster). Condense: all of it collapses to one small speck of purple-white light; a beat of near-silence.
     Drop: the speck falls to the battlefield with a thin trail, the telegraph on the ground. Detonate: a nuclear-style
     blast of dark energy; ONE hit per enemy as the visible shockfront (dome radius, R at `front` s) reaches it, noCharge.
     Drawn by SUSANOO_GFX on the GPU where it can be; the 2D fallback keeps the simplified sprite visuals. */
  const GFX = () => { try { const G = self.SUSANOO_GFX; return G && G.usable() ? G : null; } catch (e) { return null; } };
  function messiah(ctx) {
    const S = sysOf(ctx), done = once(ctx), v = ctx.vehicle; if (!S || !v) { done(); return; }
    const H = S.H, X = H.X, tu = TUNE.messiah, tier = tierOf(ctx), DK = dkOf(ctx), RX = tu.R[tier], L = LOW();
    v.locked = true;
    // the impact: the aimed crowd (centroid round the target), else the aim point, else ahead; on ground
    let tx, ty; { const Ls = monsOf(ctx, H); let tg = null; try { tg = ctx.target && ctx.target(); } catch (e) {}
      if (tg && tg.m && !gone(tg.m)) { let sx = 0, sy = 0, n = 0; for (const m of Ls) if (!gone(m) && Math.hypot(m.x - tg.m.x, m.y - tg.m.y) < 3) { sx += m.x; sy += m.y; n++; } tx = n ? sx / n : tg.m.x; ty = n ? sy / n : tg.m.y; }
      else if (tg && isFinite(tg.x)) { tx = tg.x; ty = tg.y; } else { let ap = null; try { ap = ctx.aimPoint && ctx.aimPoint(); } catch (e) {} if (ap && isFinite(ap.x)) { tx = ap.x; ty = ap.y; } else { tx = v.x + Math.cos(v.heading || 0) * 3; ty = v.y + Math.sin(v.heading || 0) * 3; } }
      if (!ground(ctx, tx, ty)) { try { const p = ctx.nearestLand && ctx.nearestLand(tx, ty); if (p && isFinite(p.x)) { tx = p.x; ty = p.y; } } catch (e) {} } }
    const ix = tx, iy = ty, aI = Math.atan2(iy - v.y, ix - v.x);
    if (Math.hypot(ix - v.x, iy - v.y) > 0.4) { v.heading = aI; if (v.wantHeading !== undefined) v.wantHeading = aI; }
    const TG = tu.gather, TC = TG + tu.condense, TQ = TC + tu.drop, TE = TQ + tu.front, TS = TE + 0.25, TD = TS + tu.settle;
    let t = 0, ph = 'gather', blast = null, finished = false, retAsked = false, drop0 = null, lastPulse = 0;
    const hits = new Set(), trail = [];
    ctx.messiahPlan = { x: ix, y: iy, R: RX, blast: tu.blast[tier], tDetonate: TQ };   /* (read-only, for tests and H's audit) */
    cam(ctx, { zoom: tu.zoom, x: lerp(v.x, ix, 0.5), y: lerp(v.y, iy, 0.5) - 1.5, k: 0.6 });
    sfx(X, 'note', 45, TG + 0.2, 'sawtooth', 0.1, 70); sfx(X, 'note', 68, TG, 'sine', 0.25, 120); sfx(X, 'hum'); sfx(X, 'grumble');
    /* the underbelly: under the hull's centre (M's `center`, else the vehicle's height) */
    const belly = () => { const c0 = anchorW(ctx, 'center'), ok = c0 && isFinite(c0.z) && Math.abs(c0.x - v.x) + Math.abs(c0.y - v.y) < 4; return ok ? { x: c0.x, y: c0.y, z: Math.max(0.6, c0.z - tu.bellyDrop) } : { x: v.x, y: v.y, z: (v.z || 0) + 2.3 }; };
    const speck = () => { if (!drop0) return null; const u = cl((t - TC) / tu.drop), e = u * u * (0.35 + 0.65 * u); return { x: lerp(drop0.x, ix, eio(u)), y: lerp(drop0.y, iy, eio(u)), z: drop0.z * (1 - e) }; };
    const SRC = ['thrusterL', 'thrusterR', 'wingRootL', 'wingRootR'];
    const act = { update(dt) { t += dt; const G = GFX();
        if (!S.alive && !S.keep) { if (!finished) { finished = true; done(); } act.dead = true; return; }
        // light the dark round the effect (the floor's darkness is drawn over the effects): the gather, the fall, the cloud
        if (X.light && !(S.lt2 > t)) { S.lt2 = t + 0.2; if (t < TQ) { const f = belly(); X.light(f.x, f.y, t < TG ? 3 + 4 * cl(t / TG) : 5, 0.35); if (ph === 'drop') { const p = speck(); if (p) X.light(p.x, p.y, 3, 0.3); } }
          else if (blast && blast.t < tu.cloud - 0.5) { const k = 1 - sm((blast.t - (tu.cloud - 2)) / 1.5); X.light(ix, iy, RX * 1.3 * k + 1, 0.35); X.light(ix, iy - 3.5, 5.5 * k + 1, 0.35); X.light(ix, iy - 7, 6 * k + 1, 0.35); } }
        if (t < TG) { const u = t / TG, pr = 0.7 + 2.3 * u * u; setPose(ctx, 'messiah', u * 0.9, { channel: 0.4 * sm(u), charge: 0, glow: 0.4 + 0.6 * sm(u), thrust: 1 - 0.4 * sm(u) });
          // the pulses: a low beat that quickens (sound, a small shake)
          lastPulse += dt * pr; if (lastPulse >= 1) { lastPulse -= 1; sfx(X, 'note', 38 + 22 * u, 0.35, 'sine', 0.18 + 0.2 * u, 30); if (u > 0.35) shake(ctx, X, 0.6 + 2 * u, 0.12); }
          if (!G) { const f = belly(); let k = (L ? 10 : 32) * (0.4 + u) * dt + Math.random(); while (k-- >= 1) { const a2 = Math.random() * TAU, r = rnd(2.5, 7), life = rnd(0.5, 0.9), sx = f.x + Math.cos(a2) * r, sy = f.y + Math.sin(a2) * r * 0.75, sz = Math.max(0.2, f.z + rnd(-2.5, 1.5)); part(S, Math.random() < 0.35 ? 2 : Math.random() < 0.6 ? 0 : 1, sx, sy, sz, (f.x - sx) / life, (f.y - sy) / life, (f.z - sz) / life, life, rnd(0.25, 0.5), { fin: 0.05, v: (Math.random() * 3) | 0, rot: Math.random() * TAU, a: 0.7 }); }
            let k2 = (L ? 3 : 8) * dt + Math.random() * 0.5; while (k2-- >= 1) { const src = anchorW(ctx, SRC[(Math.random() * SRC.length) | 0]), life = rnd(0.3, 0.5); part(S, 0, src.x, src.y, src.z, (f.x - src.x) / life, (f.y - src.y) / life, (f.z - src.z) / life, life, rnd(0.2, 0.3), { fin: 0.04 }); } } }
        else if (t < TC) { if (ph === 'gather') { ph = 'condense'; sfx(X, 'note', 1400, 0.25, 'sine', 0.05, 2600); shake(ctx, X, 2, 0.1); }
          setPose(ctx, 'messiah', 0.9 + 0.1 * (t - TG) / tu.condense, { channel: 0.5, charge: 0, glow: 1, thrust: 0.5 }); }
        else if (t < TQ) { if (ph === 'condense') { ph = 'drop'; drop0 = belly(); sfx(X, 'note', 1800, tu.drop, 'sine', 0.08, 300); sfx(X, 'whoosh'); }
          setPose(ctx, 'messiahFire', (t - TC) / tu.drop, { channel: 0.3, charge: 0, glow: 0.8, recoil: 0.3 * (1 - (t - TC) / tu.drop) });
          const p = speck(); trail.push({ x: p.x, y: p.y, z: p.z, t }); while (trail.length && t - trail[0].t > 0.22) trail.shift();
          if (!G && Math.random() < 0.8) part(S, 0, p.x, p.y, p.z, 0, 0, 0, 0.25, 0.25, { fin: 0.02 }); }
        else { if (ph === 'drop') { ph = 'blast'; explode(G); }
          if (blast) { blast.t += dt;
            // ONE decisive hit per enemy, as the drawn shockfront (the dome's radius) reaches it
            const fr = RX * eout3(blast.t / tu.front); if (blast.t <= tu.front + 0.05 && S.alive !== false) for (const m of monsOf(ctx, H)) { if (gone(m) || hits.has(m)) continue; if (Math.hypot(m.x - ix, m.y - iy) - (m.r || 0.4) < fr) { hits.add(m); hitM(ctx, m, DK * tu.blast[tier], { noCharge: true, kb: tu.kb, el: 'dark', src: 'ult' }); } }
            if (blast.t > 0.8 && blast.t < 3.5 && Math.floor(blast.t / 0.9) !== Math.floor((blast.t - dt) / 0.9)) { shake(ctx, X, 1.5, 0.15); sfx(X, 'note', 36, 0.5, 'sine', 0.25, 28); X.light && X.light(ix, iy, RX, 0.5); }
            if (!G && blast.t < 3 && Math.random() < dt * (L ? 8 : 22)) { const a2 = Math.random() * TAU, r = RX * Math.sqrt(Math.random()); part(S, 0, ix + Math.cos(a2) * r, iy + Math.sin(a2) * r * 0.8, rnd(0.2, 1.5), 0, 0, rnd(1, 2.5), rnd(1, 1.8), rnd(0.2, 0.34), { drag: 0.5, g: -0.3 }); } }
          if (t >= TS && !retAsked) { retAsked = true; let rp = null; try { rp = ctx.safeReturn ? ctx.safeReturn() : null; } catch (e) {} ctx.returnPoint = rp; setPose(ctx, 'rest', 1, { channel: 0, glow: 0.2, thrust: 0.3 }); }
          if (t >= TD && !finished) { finished = true; S.keep = 1; S.noPet = true; cam(ctx, null); done(); } }
        if (finished && (!blast || blast.t > tu.cloud)) act.dead = true; },
      under(c, B) { if (GFX()) return; const T = S.T, GY = S.GY, X0 = H.sx(ix), Y0 = H.sy(iy), LO = lowBegin(S, c);   /* (2D fallback: big soft floor light at 1/3 size; the cracks stay sharp) */
        const tA = sm((t - (TC - 0.3)) / 0.4) * (blast ? Math.max(0, 1 - blast.t / 0.2) : 1); if (tA > 0.01) { LO.floor(sprBand(), X0, Y0, RX * T * 1.08, tA * (0.45 + 0.15 * Math.sin(t * 8)), true, GY); LO.floor(glowSprite(C.vio2), X0, Y0, RX * T * 0.8, 0.15 * tA, true, GY); }
        if (blast) { const u = blast.t;
          if (u < 0.5) LO.floor(glowSprite(C.wht), X0, Y0, RX * T * 1.1, (1 - u / 0.5) * 0.5, true, GY);
          LO.floor(glowSprite(C.vio2), X0, Y0, RX * T * 1.3, 0.6 * Math.max(0, 1 - u / 3.5), true, GY);
          for (const [d, sc, w] of [[0, 1.0, 1], [0.15, 1.25, 0.6], [0.35, 1.5, 0.4]]) { const q = cl((u - d) / (tu.front + 0.25 + d)); if (q > 0 && q < 1) { LO.floor(sprShadowRing(), X0, Y0, RX * T * sc * eout(q) * 1.02, (1 - q) * 0.8 * w, false, GY); LO.floor(sprBand(), X0, Y0, RX * T * sc * eout(q) * 1.1, (1 - q) * w, true, GY); } }
          const ca = (u < 0.1 ? u / 0.1 : 1) * Math.max(0, 1 - Math.max(0, u - 0.6) / 1.1); if (ca > 0.01) { setT(c, B, X0, Y0, 0, 1, GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ca; c.rotate(1.3); const rr = RX * T * 1.05 * eout(u / 0.3); c.drawImage(sprCracks(1), -rr, -rr, rr * 2, rr * 2); } }
        lowFlush(c, LO); },
      over(c, B) { const G = GFX(); if (G) { gpu(G, c, B); return; }
        const T = S.T, f = belly(), FX = H.sx(f.x), FY = H.sy(f.y) - f.z * S.ZT;
        // 2D fallback: the orb under the hull, beating; the speck; its trail; then the blast sprites
        if (t < TC) { const u = cl(t / TG), cd = cl((t - TG) / tu.condense), k = petK(S, FX, FY, 0.4), beat = Math.pow(0.5 + 0.5 * Math.sin(t * TAU * (0.7 + 2.3 * u * u)), 3), r = T * lerp(0.25 + 0.75 * u * (0.85 + 0.3 * beat), 0.1, sm(cd / 0.6));
          put(c, B, glowSprite(C.vio2), FX, FY, r * 5, r * 5, (0.3 + 0.4 * u) * k * (1 - 0.6 * cd), 0, true); put(c, B, glowSprite(C.pale), FX, FY, r * 1.8, r * 1.8, (0.5 + 0.4 * u) * k, 0, true); put(c, B, glowSprite(C.wht), FX, FY, r * 0.8, r * 0.8, (0.6 + 0.4 * u) * k, 0, true); }
        if (ph === 'drop') { const p = speck(), SX = H.sx(p.x), SY = H.sy(p.y) - p.z * S.ZT; if (trail.length > 1) { const q = trail[0], QX = H.sx(q.x), QY = H.sy(q.y) - q.z * S.ZT, Ls = Math.hypot(SX - QX, SY - QY), an = Math.atan2(QY - SY, QX - SX), wc = T * 0.2; setT(c, B, SX, SY, an); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; c.drawImage(beamSprite(C.vio2), 0, -wc, Ls, wc * 2); c.setTransform(B); }
          put(c, B, glowSprite(C.vio2), SX, SY, T * 1.6, T * 1.6, 0.7, 0, true); put(c, B, glowSprite(C.wht), SX, SY, T * 0.5, T * 0.5, 1, 0, true); }
        if (blast) drawBlast(c, B); } };
    const eout3 = u => { u = cl(u); return 1 - Math.pow(1 - u, 3); };   /* (the dome's growth: the same curve the shader draws) */
    /* the GPU frame: every uniform from the world, in the GL canvas's pixels */
    function gpu(G, c, B) { const cv0 = c.canvas, cw = cv0.width, chh = cv0.height, res = L ? tu.gpu.resLow : tu.gpu.res, k0 = Math.min(res, tu.gpu.maxSide / Math.max(cw, chh)), W = Math.max(8, Math.round(cw * k0)), Hh = Math.max(8, Math.round(chh * k0)), kx = W / cw;
      const sc = Math.sqrt(Math.abs(B.a * B.d - B.b * B.c)) || 1, T = S.T, toG = (sx, sy) => [(B.a * sx + B.c * sy + B.e) * kx, (B.b * sx + B.d * sy + B.f) * kx], wG = (x, y, z) => toG(H.sx(x), H.sy(y) - (z || 0) * S.ZT);
      const f = belly(), p = speck(), q = trail.length ? trail[0] : null, cd = t < TG ? -1 : cl((t - TG) / tu.condense);
      const U = { u_T: T * sc * kx, u_gy: S.GY, u_zk: S.ZT / T, u_time: t, u_f: wG(f.x, f.y, f.z), u_g: t < TC ? cl(t / TG) : -1, u_cd: t < TC ? cd : -1,
        u_sp: p ? wG(p.x, p.y, p.z) : [0, 0], u_tr: q ? wG(q.x, q.y, q.z) : [0, 0], u_spa: ph === 'drop' ? 1 : 0, u_c: wG(ix, iy, 0), u_R: RX,
        u_tel: sm((t - (TC - 0.3)) / 0.4) * (blast ? Math.max(0, 1 - blast.t / 0.15) : 1), u_bt: blast ? blast.t : -1, u_front: tu.front, u_life: tu.cloud,
        u_pet: toG(S.PX, S.PY), u_pr: Math.max(4, S.PR * sc * kx), u_prot: S.cover ? 0 : 1, u_px: T * sc * kx / 18, u_oct: L ? 3 : 5 };
      const n = Math.round(G.total() * (L ? tu.gpu.lowK : 1)), cvG = G.render({ W, H: Hh, u: U, n }); if (!cvG) return;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); G.blit(c, W, Hh, 0, 0, cw, chh); c.restore(); }
    function explode(G) { blast = { t: 0, cols: [], puffs: [] }; S.cover = true;   /* (the finisher may cover the pet) */
      shake(ctx, X, 18, 0.7); X.flash && X.flash(RM() ? 0.06 : 0.12, '#D9C4FF'); X.hitstop && X.hitstop(0.12); X.light && X.light(ix, iy, RX * 1.6, 1.0);
      sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'stomp'); sfx(X, 'note', 30, 3.0, 'sine', 1.0, 16); sfx(X, 'note', 60, 1.8, 'triangle', 0.4, 26); sfx(X, 'hiss', 3.0, 0.4, 380);
      cam(ctx, { zoom: tu.zoom * 0.95, x: ix, y: iy - 3.6, k: 0.8 });
      if (G) return;   /* (the GPU draws its own thousands of particles) */
      for (let i = 0; i < (L ? 5 : 9); i++) { const a2 = i / 9 * TAU + rnd(-0.3, 0.3), r = RX * rnd(0.25, 0.75); blast.cols.push({ x: ix + Math.cos(a2) * r, y: iy + Math.sin(a2) * r * 0.85, d: rnd(0.05, 0.5), h: rnd(4, 7), w: rnd(0.8, 1.3), v: i % 3 }); }
      for (let i = 0; i < 12; i++) blast.puffs.push({ a: i / 12 * TAU + rnd(-0.2, 0.2), r: rnd(0.8, 1.05), s: rnd(0.8, 1.2), v: i % 3 });
      for (let i = 0; i < (L ? 12 : 40); i++) { const a2 = Math.random() * TAU, sp2 = rnd(4, 11); part(S, 3, ix, iy, rnd(0.3, 1.2), Math.cos(a2) * sp2, Math.sin(a2) * sp2 * 0.72, rnd(4, 10), rnd(0.8, 1.6), rnd(0.35, 0.7), { g: 9, drag: 0.6, v: i % 3, rot: Math.random() * TAU, vr: rnd(-6, 6) }); }
      for (let i = 0; i < (L ? 14 : 44); i++) { const a2 = Math.random() * TAU, sp2 = rnd(3, 9); part(S, i % 2, ix, iy, rnd(0.5, 2.5), Math.cos(a2) * sp2, Math.sin(a2) * sp2 * 0.72, rnd(2, 7), rnd(1.0, 2.0), rnd(0.25, 0.45), { g: 1, drag: 0.9 }); }
      for (let i = 0; i < (L ? 8 : 22); i++) { const a2 = i / 22 * TAU + rnd(-0.1, 0.1), sp2 = RX * rnd(1.6, 2.1); part(S, 2, ix + Math.cos(a2) * 0.8, iy + Math.sin(a2) * 0.6, 0.3, Math.cos(a2) * sp2, Math.sin(a2) * sp2 * 0.72, 0.4, rnd(1.2, 1.7), rnd(1.4, 2.2), { grow: 0.9, a: 0.85, drag: 2.2, v: i % 3, rot: Math.random() * TAU, vr: rnd(-1, 1) }); } }
    /* the explosion over everything (it may cover the pet): the flash, the black-violet bloom rising, columns of shadow
       climbing, a cap of dark smoke lit violet from within; it thins and fades by `cloud` s */
    function drawBlast(c, B) { const u = blast.t, T = S.T, life = tu.cloud; if (u > life) return; const LO = lowBegin(S, c), X0 = H.sx(ix), Y0 = H.sy(iy), fadeAll = 1 - sm((u - (life - 1.4)) / 1.4);
      if (u < 0.35) LO.put(glowSprite(C.wht), X0, Y0 - T * RX * 0.25, RX * 2.4 * T, RX * 2.4 * T, (1 - u / 0.35) * 0.8, 0, true);
      // the bloom: a dense sphere erupting outward and rising, violet light through it
      const br = RX * T * 0.75 * eout(u / 0.35) * (1 + 0.15 * sm((u - 0.4) / 1.5)), lift = T * 2.2 * sm((u - 0.3) / 1.6), ba = (u < 1 ? 1 : 1 - sm((u - 1) / 1.6)) * fadeAll;
      if (ba > 0.01 && br > 2) { LO.put(glowSprite(C.vio2), X0, Y0 - br * 0.5 - lift, br * 3.2, br * 2.8, 0.5 * ba, 0, true); LO.put(sprBloom(), X0, Y0 - br * 0.55 - lift, br * 2.2, br * 2.0, 0.95 * ba, u * 0.4, false);
        const NB = L ? 6 : 12; for (let i = 0; i < NB; i++) { const th = Math.PI + (i + 0.5) / NB * Math.PI, bx = X0 + Math.cos(th) * br * 0.95, by = Y0 - br * 0.55 - lift + Math.sin(th) * br * 0.85, bs = br * (0.5 + 0.1 * Math.sin(i * 1.7)); LO.put(sprSmoke(i % 3), bx, by, bs, bs, 0.85 * ba, u * (i % 2 ? 1 : -1) + i, false); }
        LO.put(glowSprite(C.pale), X0, Y0 - br * 0.55 - lift, br * 0.9, br * 0.9, 0.5 * ba * (1 - sm(u / 1.5)), 0, true); }
      // rising columns of shadow
      for (const cdef of blast.cols) { const q = u - cdef.d; if (q <= 0) continue; const hh = cdef.h * eout(q / 1.2), ca = (1 - sm((q - 1.2) / 1.4)) * fadeAll; if (ca <= 0.01) continue; const SX = H.sx(cdef.x), SY = H.sy(cdef.y), n = L ? 3 : 5;
        for (let j = 0; j < n; j++) { const vj = j / (n - 1), z = hh * vj, s = T * cdef.w * (1.2 - 0.4 * vj) * (0.8 + 0.4 * sm(q / 0.4)); LO.put(sprSmoke((cdef.v + j) % 3), SX + Math.sin(u * 2 + j) * T * 0.1, SY - z * S.ZT, s, s, 0.8 * ca * (1 - 0.4 * vj), u + j, false); }
        LO.put(glowSprite(C.vio2), SX, SY - hh * S.ZT * 0.5, T * cdef.w * 1.4, hh * S.ZT + T, 0.35 * ca * (1 - sm(q / 1.6)), 0, true); }
      // the cap: dark smoke ringing the top of the bloom, lit violet from inside
      const rise = eout((u - 0.2) / 1.8), capZ = 3 + 6 * rise, cy = Y0 - capZ * S.ZT, cw = RX * T * (0.45 + 0.35 * rise), ch = cw * 0.4, pa = sm((u - 0.25) / 0.4) * fadeAll * 0.9;
      if (pa > 0.01) { LO.put(glowSprite(C.vio2), X0, cy + ch * 0.4, cw * 2.4, cw * 1.3, 0.45 * pa, 0, true); const PF = blast.puffs, n = L ? 6 : PF.length;
        for (let i = 0; i < n; i++) { const p = PF[i], a = p.a + u * 0.5; LO.put(sprSmoke(p.v), X0 + Math.cos(a) * cw * p.r, cy + Math.sin(a) * ch * p.r, cw * 0.7 * p.s, cw * 0.7 * p.s, pa, a + u, false); }
        LO.put(sprSmoke(1), X0, cy - ch * 0.3, cw * 1.05, cw * 0.9, pa, u * 0.5, false); LO.put(glowSprite(C.vio), X0, cy, cw * 1.1, cw * 0.7, 0.4 * pa * (1 - sm((u - 1.5) / 2)), 0, true); } lowFlush(c, LO); }
    S.acts.push(act);
  }

  SM.darkBlade = darkBlade;
  SM.darkSpikes = darkSpikes;
  SM.pulsar = pulsar;
  SM.messiah = messiah;
  SM.warm = warm;
  SM.update = (ctx) => { lastCtx = ctx; };   /* (the core calls it every frame: only remembers the ctx for the spires' prewarm) */
  SM.__dbg = { BAKE, baked: () => baked, VAR, OBS };
})();

/* ---------- SUSANOO_GFX: a small WebGL effects layer for Dark Messiah (worker E) ----------
   One offscreen WebGL canvas (WebGL2, else WebGL1), sized to the game canvas x `res`, cleared and redrawn each frame
   while the finisher runs, then drawn into the game canvas with one drawImage (as GLM's model is). Two draw calls:
   - a full-canvas quad whose fragment shader paints everything soft and volumetric-looking, from noise: the gather's
     tendrils and inward pulses, the orb and the condensed speck, its fall and trail, the ground telegraph, then the
     detonation (core flash, shockwave dome, pulsing dark ground rings, glowing fractures, the fireball, the rising
     column, the rolling mushroom cap and the base surge, lit from within, with the lingering pulse);
   - one batch of GPU point sprites, stateless (each point's whole life is a function of its seed and the time, so the
     CPU never touches them): gather motes spiralling in, sparks, rising embers, dark debris, drifting dark motes.
   Every output is valid premultiplied colour (rgb <= a): the canvas is twice as wide and each frame draws two passes,
   the smoke (and dark points) in the left half, the light alone in the right half with alpha = its brightest channel;
   blit() lays the left half 'source-over' and the right half 'lighter', so the light adds the same in every browser
   (WebKit included). 4 draw calls a frame.
   Used only where WebGL works on a real GPU (a software rasteriser draws the 2D fallback) unless window.__SM_GL = 1.
   window.__SM_GL = 0 forces the fallback. A lost context falls back; a restored one is rebuilt on the next use. */
self.SUSANOO_GFX = self.SUSANOO_GFX || (() => {
  const KINDS = [['gather', 2600], ['spark', 4000], ['ember', 2600], ['debris', 900], ['mote', 1900]];
  const VS_Q = 'attribute vec2 a_p; uniform vec2 u_res; void main(){ gl_Position = vec4(a_p.x / u_res.x * 2.0 - 1.0, 1.0 - a_p.y / u_res.y * 2.0, 0.0, 1.0); }';
  const HDR = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  const NOISE = `
float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
uniform int u_oct;
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { if (i >= u_oct) break; s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s + a * 0.5; }
vec2 vor(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = vec2(h1(i + g), h1(i + g + 17.3)); vec2 r = g + o - f; float d = dot(r, r); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
  return vec2(sqrt(d1), sqrt(d2)); }`;
  const FS_Q = HDR + `
uniform vec2 u_res, u_f, u_sp, u_tr, u_c, u_pet;
uniform float u_T, u_gy, u_zk, u_time, u_g, u_cd, u_spa, u_R, u_tel, u_bt, u_front, u_life, u_pr, u_prot, u_pass, u_off;
` + NOISE + `
void main(){
  vec2 p = vec2(gl_FragCoord.x - u_off, u_res.y - gl_FragCoord.y);   /* (u_off: the light pass draws in the right half) */
  vec3 L = vec3(0.0), Lx = vec3(0.0); vec4 Sm = vec4(0.0); float T = u_T;   /* (Lx: the orb and the speck, never dimmed for the pet) */
  // ---- the gather: tendrils of dark energy and inward pulses into the underbelly, the orb beating faster ----
  if (u_g >= 0.0) {
    vec2 q = (p - u_f) / T; float r = length(q * vec2(1.0, 1.3)), an = atan(q.y, q.x), g = u_g, cd = max(u_cd, 0.0);
    float pr = 0.7 + 2.3 * g * g, vis = smoothstep(0.0, 0.25, g) * (1.0 - smoothstep(0.0, 0.5, cd));
    float nz = fbm(vec2(an * 1.6 + u_time * 0.25, r * 0.7 - u_time * 1.4));
    float sw = an * 4.0 + log(r + 0.08) * 3.4 - u_time * (1.6 + 3.5 * g) + nz * 3.2;
    float tend = pow(max(0.0, 0.5 + 0.5 * sin(sw)), 5.0) * smoothstep(10.0, 2.0, r) * smoothstep(0.12, 0.9, r) * vis;
    float beat = pow(0.5 + 0.5 * sin(u_time * 6.2832 * pr), 3.0);
    float tedge = pow(max(0.0, 0.5 + 0.5 * sin(sw + 0.55)), 9.0) * smoothstep(10.0, 2.0, r) * smoothstep(0.12, 0.9, r) * vis;
    Sm += vec4(vec3(0.05, 0.015, 0.09), 1.0) * tend * (0.62 + 0.25 * beat);
    L += vec3(0.55, 0.28, 1.0) * (tend * 0.3 + tedge * 1.1) * (0.5 + 0.6 * g) * (0.6 + 0.7 * beat);
    for (int k = 0; k < 2; k++) { float ph = fract(u_time * pr * 0.5 + float(k) * 0.5), rp = 7.0 * (1.0 - ph);
      float ring = exp(-pow((r - rp) / (0.16 + 0.35 * (1.0 - ph)), 2.0)) * ph * vis; L += vec3(0.62, 0.36, 1.0) * ring * (0.25 + 0.3 * g); Sm += vec4(vec3(0.03, 0.0, 0.06), 1.0) * ring * 0.2; }
    Sm += vec4(vec3(0.02, 0.0, 0.05), 1.0) * smoothstep(6.5, 1.0, r) * 0.38 * g * vis * (1.0 - Sm.a);
    float ro = mix(0.22 + 0.75 * g * (0.8 + 0.4 * beat), 0.05, smoothstep(0.0, 0.55, cd)), d = r / ro;
    Lx += vec3(1.0, 0.92, 1.0) * exp(-d * d * 1.6) * (0.7 + 0.8 * g + 0.6 * cd) + vec3(0.55, 0.22, 1.0) * exp(-d * 0.9) * (0.35 + 0.45 * g) * (1.0 - 0.6 * smoothstep(0.0, 0.6, cd));
    Sm += vec4(vec3(0.03, 0.0, 0.07), 1.0) * smoothstep(1.9, 1.15, d) * smoothstep(0.5, 1.1, d) * 0.55 * (1.0 - cd);
    if (cd > 0.0) { float ci = clamp(cd / 0.4, 0.0, 1.0), rc = 5.5 * (1.0 - ci * ci); L += vec3(0.75, 0.5, 1.0) * exp(-pow((r - rc) / (0.12 + 0.4 * (1.0 - ci)), 2.0)) * (1.0 - ci) * 0.9; Sm += vec4(vec3(0.02, 0.0, 0.05), 1.0) * smoothstep(rc + 0.5, rc - 1.5, r) * smoothstep(rc - 3.0, rc - 0.5, r) * 0.35 * (1.0 - ci); }
    if (cd > 0.0) { float k2 = smoothstep(0.35, 1.0, cd) * (0.85 + 0.15 * sin(u_time * 40.0)); vec2 a = abs(q);
      Lx += vec3(1.0, 0.88, 1.0) * k2 * (exp(-a.x * 0.7) * exp(-a.y * 26.0) + exp(-a.y * 1.3) * exp(-a.x * 34.0)) * 1.8 + vec3(0.65, 0.35, 1.0) * k2 * exp(-r * 1.6) * 0.8; }
  }
  // ---- the speck falling, its thin trail ----
  if (u_spa > 0.0) { vec2 q = (p - u_sp) / T; float r = length(q);
    Lx += (vec3(1.0, 0.94, 1.0) * exp(-r * r / 0.006) * 1.6 + vec3(0.7, 0.38, 1.0) * exp(-r * 2.6) * (0.7 + 0.2 * sin(u_time * 50.0)) + vec3(1.0, 0.9, 1.0) * exp(-abs(q.x) * 1.4) * exp(-abs(q.y) * 26.0) * 0.35) * u_spa;
    vec2 ab = u_tr - u_sp; float l2 = max(dot(ab, ab), 1.0), hh = clamp(dot(p - u_sp, ab) / l2, 0.0, 1.0), dd = length(p - u_sp - ab * hh) / T;
    L += vec3(0.72, 0.46, 1.0) * exp(-dd * dd / (0.004 + 0.02 * hh)) * pow(1.0 - hh, 1.2) * u_spa * 1.2; }
  // ---- the ground: telegraph, then the blast ----
  vec2 e = (p - u_c) / T, ge = vec2(e.x, e.y / u_gy); float rr = length(ge);
  if (u_tel > 0.0) { float ring = exp(-pow((rr - u_R) / 0.2, 2.0)), fill = smoothstep(u_R, u_R * 0.15, rr) * 0.1 * (0.6 + 0.4 * sin(u_time * 10.0 - rr * 1.6));
    L += vec3(0.6, 0.3, 1.0) * (ring * 0.5 + fill) * u_tel; Sm += vec4(vec3(0.03, 0.0, 0.06), 1.0) * smoothstep(u_R, 0.0, rr) * 0.18 * u_tel; }
  if (u_bt >= 0.0) {
    float bt = u_bt, R = u_R, fade = 1.0 - smoothstep(u_life - 1.8, u_life, bt), pulse = 0.72 + 0.28 * sin(bt * 7.0 - 1.5);
    float Rd = bt < u_front ? R * (1.0 - pow(1.0 - bt / u_front, 3.0)) : R * (1.0 + 0.24 * (bt - u_front) / 0.8), da = 1.0 - smoothstep(u_front, u_front + 0.8, bt);
    // the core flash
    float fl = exp(-bt * 9.0), dsc = length(vec2(e.x, e.y + 1.2 * u_zk)) / R;
    L += mix(vec3(0.62, 0.35, 1.0), vec3(1.0, 0.95, 1.0), fl) * fl * (1.8 * exp(-dsc * dsc * 7.0) + 3.0 * exp(-dsc * dsc * 80.0) + 0.1);
    // glowing fractures, revealed under the front
    if (rr < Rd * 1.03) { vec2 v = vor(ge * 0.95 + vec2(3.7, 1.3)), v2 = vor(ge * 2.3 + vec2(9.1, 4.4));
      float edge = 1.0 - smoothstep(0.0, 0.06 + 0.04 * rr / R, v.y - v.x), edge2 = (1.0 - smoothstep(0.0, 0.05, v2.y - v2.x)) * 0.45;
      float glow = max(edge, edge2) * (1.0 - smoothstep(0.2, 1.05, rr / R)) * (exp(-bt * 0.85) * 1.3 + 0.28 * pulse) * fade * smoothstep(Rd * 1.03, Rd * 0.88, rr);
      L += mix(vec3(0.6, 0.3, 1.0), vec3(1.0, 0.85, 1.0), clamp(glow - 0.6, 0.0, 1.0)) * glow * 0.85; }
    // pulsing dark rings along the ground
    for (int k = 0; k < 7; k++) { float b0 = float(k) * 0.45, q = (bt - b0) / 1.6; if (q < 0.0 || q > 1.0) continue;
      float rk = R * (0.12 + 1.3 * (1.0 - pow(1.0 - q, 2.0))), w = 0.22 + 0.55 * q, band = exp(-pow((rr - rk) / w, 2.0)), ed = exp(-pow((rr - rk - w * 0.7) / (w * 0.3), 2.0)), a = (1.0 - q) * fade;
      Sm += vec4(vec3(0.03, 0.0, 0.06), 1.0) * band * 0.5 * a * (1.0 - Sm.a); L += vec3(0.62, 0.32, 1.0) * ed * 0.65 * a; }
    // the shockwave dome: a bright shell, faint refraction inside
    if (da > 0.0) { float dn = e.y < 0.0 ? length(vec2(e.x / Rd, e.y / (Rd * u_zk * 1.05))) : length(vec2(e.x / Rd, e.y / (Rd * u_gy)));
      float shell = exp(-pow((dn - 1.0) / 0.05, 2.0)) * (0.7 + 0.5 * n2(e * 2.0 + bt * 4.0)), inner = smoothstep(1.0, 0.5, dn) * (0.08 + 0.12 * n2(e * 1.4 - bt * 3.0));
      L += vec3(0.82, 0.62, 1.0) * (shell * 1.25 + inner) * da; Sm += vec4(vec3(0.04, 0.0, 0.07), 1.0) * smoothstep(1.0, 0.8, dn) * 0.2 * da * (1.0 - Sm.a); }
    // the mushroom: fireball, column, rolling cap, base surge (x across, z up the screen)
    float z = -e.y / u_zk, rise = 1.0 - exp(-bt * 1.5), capZ = 1.0 + 7.6 * rise, cw = R * (0.2 + 0.46 * rise), chh = cw * 0.66;
    float nn = fbm(vec2(e.x * 0.8, z * 0.8 - bt * 0.9) * 1.3 + 4.0);
    float colW = (0.6 + 0.6 * rise) * (1.0 + 0.5 * smoothstep(capZ * 0.4, capZ, z) + 0.6 * smoothstep(1.2, 0.0, z)) * (0.8 + 0.4 * nn);
    float colD = smoothstep(colW, colW * 0.3, abs(e.x + 0.25 * sin(z * 1.2 + bt))) * smoothstep(-0.4, 0.3, z) * smoothstep(capZ + chh * 0.2, capZ - chh * 0.5, z);
    vec2 cq = vec2(e.x / cw, (z - capZ) / chh); float cr = length(vec2(cq.x, cq.y > 0.0 ? cq.y * 0.95 : cq.y * 1.9 - 0.25 * cq.x * cq.x)), cang = atan(cq.y, cq.x);   /* (a domed top, a flatter rolled underside) */
    float roll = fbm(vec2(cang * 2.4 + bt * 0.45, cr * 3.0 - bt * 1.2) * 1.25), capD = smoothstep(1.05, 0.45, cr + (roll - 0.5) * 0.55) * smoothstep(0.0, 0.5, bt);
    float torus = exp(-pow((cr - 0.72) / 0.22, 2.0)) * capD;
    float rs = R * (0.3 + 0.8 * (1.0 - exp(-bt * 1.5))), baseD = smoothstep(0.0, 1.0, 1.0 - abs(rr - rs * 0.62) / (rs * 0.5)) * smoothstep(1.4, -0.2, z) * smoothstep(0.08, 0.5, bt) * (0.5 + 0.7 * nn);
    float fbR = R * 0.32 * (1.0 - pow(1.0 - min(bt / 0.3, 1.0), 3.0)) * (1.0 + 0.3 * rise), fbZ = 0.6 + capZ * 0.75 * smoothstep(0.1, 1.2, bt); vec2 fq = vec2(e.x, (z - fbZ) * 1.1) / max(fbR, 0.01); float fd = length(fq);
    float fireD = smoothstep(1.0, 0.25, fd + (fbm(fq * 2.2 + bt * 2.0) - 0.5) * 0.7) * (1.0 - smoothstep(0.9, 2.4, bt));
    float D = max(max(colD * (0.5 + 0.65 * nn), capD * (0.6 + 0.5 * nn)), max(baseD, fireD)) * smoothstep(0.0, 0.1, bt) * fade;
    // pseudo-lit billows: a second sample offset toward the light gives a slope; the underside glows from the core
    float nl = fbm(vec2(e.x * 0.8 + 0.18, z * 0.8 - bt * 0.9 + 0.22) * 1.3 + 4.0), lit = clamp((nn - nl) * 5.0 + 0.45, 0.0, 1.0);
    float under = max(capD * smoothstep(0.2, -0.9, cq.y) * smoothstep(1.1, 0.3, cr), colD * smoothstep(colW, 0.0, abs(e.x)) * 0.8);
    float heat = exp(-bt * 1.1), glowP = 0.35 + 0.65 * pulse;
    vec3 sc = mix(vec3(0.05, 0.02, 0.09), vec3(0.5, 0.38, 0.66), lit * 0.7 + torus * 0.25) * (0.75 + 0.5 * nn);
    float a = clamp(D * 1.05, 0.0, 1.0);
    Sm += vec4(sc * a, a) * (1.0 - Sm.a);
    vec3 em = mix(vec3(0.7, 0.4, 1.0), vec3(1.0, 0.92, 1.0), heat) * fireD * (heat * 2.6 + 0.4) + mix(vec3(0.45, 0.14, 0.95), vec3(0.95, 0.7, 1.0), heat) * under * (0.45 + 1.4 * heat) * glowP + vec3(0.35, 0.14, 0.7) * 0.22 * glowP + vec3(0.5, 0.25, 1.0) * capD * smoothstep(0.85, 1.05, cr + (roll - 0.5) * 0.55) * 0.35 * glowP + vec3(0.75, 0.45, 1.0) * torus * smoothstep(0.3, -0.5, cq.y) * (0.3 + 0.9 * heat) * glowP;
    L += em * D;
  }
  if (u_prot > 0.0) { float k = mix(1.0, 0.35 + 0.65 * smoothstep(0.0, 1.6, length(p - u_pet) / u_pr), u_prot); L *= k; Sm *= k; }
  L = min(L + Lx, vec3(1.5));
  // two valid premultiplied outputs (rgb <= a): pass 0 the smoke (composited source-over), pass 1 the light alone with
  // alpha = its brightest channel (composited 'lighter', so it adds exactly; nothing relies on colour above alpha)
  if (u_pass < 0.5) gl_FragColor = vec4(min(Sm.rgb, vec3(Sm.a)), clamp(Sm.a, 0.0, 1.0));
  else { vec3 Lc = min(L * (1.0 - Sm.a * 0.65), vec3(1.0)); gl_FragColor = vec4(Lc, max(max(Lc.r, Lc.g), Lc.b)); }
}`;
  const VS_P = `attribute vec4 a_s; attribute float a_k;
uniform vec2 u_res, u_f, u_c, u_pet; uniform float u_T, u_gy, u_zk, u_time, u_g, u_cd, u_bt, u_R, u_px, u_pr, u_prot;
varying vec4 v_c; varying float v_d;
void main(){
  vec3 w = vec3(0.0); vec2 O = u_c; float al = 0.0, sz = 2.0, dk = 0.0; vec3 col = vec3(1.0); float k = a_k; bool on = true;
  if (k < 0.5) {
    if (u_g < 0.0) on = false; else {
      float life = 0.5 + 0.9 * a_s.x, ph = fract(u_time / life + a_s.y), cd = max(u_cd, 0.0), u = mix(ph, 1.0, smoothstep(0.0, 0.45, cd));
      float r0 = 2.0 + 9.0 * a_s.z, an = a_s.w * 6.2832 + 2.8 * u * (1.0 + a_s.z), r = r0 * pow(1.0 - u, 1.6);
      w = vec3(cos(an) * r, sin(an) * r, (a_s.x - 0.5) * 5.0 * (1.0 - u)); O = u_f;
      al = smoothstep(0.0, 0.15, ph) * (0.3 + 0.7 * u) * smoothstep(0.0, 0.2, u_g) * (1.0 - smoothstep(0.45, 0.85, cd)) * (0.4 + 0.6 * u_g);
      dk = a_s.y < 0.18 ? 1.0 : 0.0; col = dk > 0.5 ? vec3(0.06, 0.0, 0.11) : (a_s.y < 0.82 ? vec3(0.62, 0.34, 1.0) : vec3(1.0, 0.88, 1.0)); sz = (0.8 + 1.4 * a_s.z) * (0.6 + 0.6 * u); al *= 0.75; }
  } else if (u_bt < 0.0) on = false;
  else if (k < 1.5) { float t = u_bt - a_s.x * 0.12, life = 0.45 + 1.5 * a_s.y; if (t < 0.0 || t > life) on = false; else {
      float an = a_s.z * 6.2832, el = 0.04 + 1.25 * a_s.w, v = 8.0 + 20.0 * a_s.y, s = (1.0 - exp(-2.0 * t)) / 2.0;
      w = vec3(cos(an) * (cos(el) * v * s + 0.7), sin(an) * (cos(el) * v * s + 0.7), max(0.0, sin(el) * v * s + 0.3 - 2.6 * t * t)); float q = t / life;
      al = (1.0 - q) * (1.0 - q) * 0.75 * smoothstep(0.0, 0.06, t) * (0.4 + 0.6 * a_s.y); col = mix(vec3(1.0, 0.96, 1.0), vec3(0.66, 0.36, 1.0), q); sz = 0.7 + 1.3 * a_s.w * (1.0 - q); } }
  else if (k < 2.5) { float t = u_bt - 0.1 - a_s.x * 1.8, life = 1.8 + 2.6 * a_s.y; if (t < 0.0 || t > life) on = false; else {
      float an = a_s.z * 6.2832, r = u_R * (0.08 + 0.14 * sqrt(a_s.w)) * (1.0 + 0.4 * t); w = vec3(cos(an) * r + 0.35 * sin(t * 3.0 + a_s.x * 20.0), sin(an) * r * 0.6, 0.6 + t * (1.6 + 2.8 * a_s.y)); float q = t / life;
      al = smoothstep(0.0, 0.15, q) * (1.0 - q) * (0.45 + 0.4 * sin(t * 17.0 + a_s.y * 30.0)); col = mix(vec3(0.95, 0.66, 1.0), vec3(0.55, 0.22, 1.0), q); sz = 0.8 + 1.4 * a_s.z; } }
  else if (k < 3.5) { float t = u_bt - a_s.x * 0.08, life = 1.0 + 1.4 * a_s.y; if (t < 0.0 || t > life) on = false; else {
      float an = a_s.z * 6.2832, el = 0.25 + 1.05 * a_s.w, v = 5.0 + 12.0 * a_s.y; w = vec3(cos(an) * cos(el) * v * t * 0.8, sin(an) * cos(el) * v * t * 0.8, max(0.0, sin(el) * v * t - 6.5 * t * t)); float q = t / life;
      w.xy += vec2(cos(an), sin(an)) * 0.6; al = (1.0 - q * q) * smoothstep(0.0, 0.1, t) * 0.85; col = vec3(0.035, 0.01, 0.06); dk = 1.0; sz = 1.0 + 1.8 * a_s.z; } }
  else { float t = u_bt - 0.5 - a_s.x * 2.6, life = 2.0 + 2.2 * a_s.y; if (t < 0.0 || t > life) on = false; else {
      float an = a_s.z * 6.2832, r = u_R * 1.15 * sqrt(a_s.w); w = vec3(cos(an) * r + 0.4 * sin(t + a_s.y * 9.0), sin(an) * r, 0.2 + t * (0.35 + 0.9 * a_s.y)); float q = t / life;
      al = sin(q * 3.1416) * 0.6; dk = a_s.y < 0.3 ? 1.0 : 0.0; col = dk > 0.5 ? vec3(0.04, 0.0, 0.08) : vec3(0.62, 0.36, 1.0); sz = 0.9 + 1.8 * a_s.z; } }
  vec2 sp = O + vec2(w.x, w.y * u_gy - w.z * u_zk) * u_T;
  if (!on || al < 0.004) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; v_c = vec4(0.0); v_d = 0.0; return; }
  if (u_prot > 0.0) al *= mix(1.0, 0.25 + 0.75 * smoothstep(0.0, 2.0, length(sp - u_pet) / u_pr), u_prot);
  gl_Position = vec4(sp.x / u_res.x * 2.0 - 1.0, 1.0 - sp.y / u_res.y * 2.0, 0.0, 1.0); gl_PointSize = clamp(sz * u_px, 1.0, 48.0);
  v_c = vec4(col, al); v_d = dk;
}`;
  const FS_P = HDR + `uniform float u_pass; varying vec4 v_c; varying float v_d;
void main(){ vec2 d = gl_PointCoord - 0.5; float m = exp(-dot(d, d) * 13.0), a = clamp(v_c.a * m, 0.0, 1.0);
  if ((v_d > 0.5) != (u_pass < 0.5)) discard;   /* (dark points in the smoke pass, light points in the light pass) */
  if (u_pass < 0.5) gl_FragColor = vec4(v_c.rgb * a, a);
  else { vec3 c = min(v_c.rgb * a * 1.25, vec3(1.0)); gl_FragColor = vec4(c, max(max(c.r, c.g), c.b)); } }`;

  let cv = null, gl = null, PQ = null, PP = null, qb = null, pb = null, NP = 0, ok = null, soft = false, info = '', why = '';
  const stats = { points: 0, draws: 0, W: 0, H: 0, frames: 0 };
  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const m = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error('shader: ' + m); } return s; }
  function prog(vs, fs, attrs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p)); const U = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(p, i); U[u.name] = gl.getUniformLocation(p, u.name); } return { p, U }; }
  /* the points: kinds interleaved in a fixed shuffled order, so a prefix (low effects) keeps every kind */
  function points() { const tot = KINDS.reduce((s, k) => s + k[1], 0), a = new Float32Array(tot * 5); let s = 7, o = 0; const R = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const left = KINDS.map(k => k[1]); for (let i = 0; i < tot; i++) { let k = 0, best = -1; for (let j = 0; j < KINDS.length; j++) { const f = left[j] / KINDS[j][1]; if (f > best) { best = f; k = j; } } left[k]--;
      a[o++] = R(); a[o++] = R(); a[o++] = R(); a[o++] = R(); a[o++] = k; } NP = tot; return a; }
  function build() {
    if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 4; cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; why = 'context lost'; }); cv.addEventListener('webglcontextrestored', () => { ok = null; PQ = PP = null; }); }
    const o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false };
    gl = gl || cv.getContext('webgl2', o) || cv.getContext('webgl', o); if (!gl) { why = 'no WebGL'; return false; }
    try { const di = gl.getExtension('WEBGL_debug_renderer_info'); info = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { info = '?'; }
    soft = /swiftshader|llvmpipe|software|softpipe/i.test(info);
    PQ = prog(VS_Q, FS_Q, ['a_p']); PP = prog(VS_P, FS_P, ['a_s', 'a_k']);
    qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(12), gl.DYNAMIC_DRAW);
    pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, points(), gl.STATIC_DRAW);
    return true; }
  /* may this device draw with it? (builds on first ask; true / false) */
  function usable() { let f = null; try { f = typeof window !== 'undefined' ? window.__SM_GL : null; } catch (e) {} if (f === 0) return false;
    if (ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Susano O GFX: ' + why); } catch (e2) {} } }
    if (!ok) return false; return !soft || f === 1 || (typeof window !== 'undefined' && window.__SUSANO_GL === 1); }
  /* draw one frame: F = { W, H (GL px), u: { name: value }, n (points to draw) }; returns the canvas, 2W wide: the smoke
     in [0, W), the light in [W, 2W) (see blit) - or null */
  function render(F) { if (!usable()) return null;
    try { if (cv.width !== F.W * 2 || cv.height !== F.H) { cv.width = F.W * 2; cv.height = F.H; }
      gl.viewport(0, 0, F.W * 2, F.H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
      const set = (P, k, v) => { const l = P.U[k]; if (l == null) return; if (k === 'u_oct') gl.uniform1i(l, v); else if (Array.isArray(v)) gl.uniform2f(l, v[0], v[1]); else gl.uniform1f(l, v); };
      const b = F.box || [0, 0, F.W, F.H], x0 = b[0], y0 = b[1], x1 = b[2], y1 = b[3], n = Math.min(NP, F.n || NP);
      gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1]));
      /* pass 0, the left half: smoke and dark points, premultiplied 'over'; pass 1, the right half: light only, added
         (each output keeps rgb <= a, so the 2D canvas composites them the same in every browser) */
      for (let pass = 0; pass < 2; pass++) { gl.viewport(pass * F.W, 0, F.W, F.H); if (pass) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(PQ.p); for (const k in F.u) set(PQ, k, F.u[k]); set(PQ, 'u_res', [F.W, F.H]); set(PQ, 'u_pass', pass); set(PQ, 'u_off', pass * F.W);
        gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.disableVertexAttribArray(1); gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.useProgram(PP.p); for (const k in F.u) set(PP, k, F.u[k]); set(PP, 'u_res', [F.W, F.H]); set(PP, 'u_pass', pass);
        gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16);
        gl.drawArrays(gl.POINTS, 0, n); gl.disableVertexAttribArray(1); }
      stats.points = n; stats.draws = 4; stats.W = F.W; stats.H = F.H; stats.frames++;
      return cv; } catch (e) { ok = false; why = String(e && e.message || e); return null; } }
  /* composite a rendered frame into a 2D context over (dx, dy, dw, dh): the smoke 'over', then the light 'lighter' */
  function blit(c, W, H, dx, dy, dw, dh) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, 0, W, H, dx, dy, dw, dh); c.globalCompositeOperation = 'lighter'; c.drawImage(cv, W, 0, W, H, dx, dy, dw, dh); c.globalCompositeOperation = 'source-over'; }
  /* (tests) right after render: how many pixels break rgb <= a (premultiplied validity), out of how many */
  function check() { if (!gl) return null; const W = cv.width, H = cv.height, px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); let bad = 0, lit = 0; for (let i = 0; i < px.length; i += 4) { const a = px[i + 3]; if (a) lit++; if (px[i] > a + 1 || px[i + 1] > a + 1 || px[i + 2] > a + 1) bad++; } return { bad, lit, px: W * H }; }
  return { usable, render, blit, stats, check, KINDS, total: () => KINDS.reduce((s, k) => s + k[1], 0), info: () => ({ ok, soft, renderer: info, why }) };
})();
