/* ---------- Dark's Susano O (12th Dark ult): the attacks (worker E) ----------
   The model is 20k5v (SUSANO_MODEL), the session, both forms, movement, menus and timers are 20k5w (U.susanoo). This file
   adds the four attacks to the SUSANOO_MOVES contract (docs/DARK-SUSANOO-BRIEF.md):
   - SM.darkBlade(ctx): True Dark Blade. The sword rises overhead in both hands while violet light climbs its channel, then
     drives down; at the slam a towering, curved wave of darkness rolls out ahead (a smoky black-violet face, a soft
     violet crest, fragments drawn up its surface, violet fissures lighting under its leading edge and fading behind). Its
     front is the hit: one hit per enemy per activation, the blade's own impact counted in the same set. Each lane of the
     wave stops at a wall (nothing is hit behind one).
   - SM.darkSpikes(ctx): Dark Spikes. The sword turns point-down and is driven into the ground; dark fissures race from it
     to the aimed area; then the Earth ult Crystal Coronation (20k2f, assumed to be the spec's "Crown of Rock") runs as
     its Dark variant through its V hook: the same ray-cast crystal spires, formation and eruption, in glossy black
     obsidian with silver-violet edges and violet fissures. Two damage phases, each one hit per enemy over the whole
     formation: the eruption, then the dark burst.
   - SM.pulsar(ctx): Shockwave Pulsar. A compact white-violet charge at the docked sword's point, a short bright ray to the
     ground, the darkness compressing to a point, then a black-violet shockwave: one hit per enemy within its radius
     (the drawn footprint), once per cast.
   - SM.messiah(ctx): Dark Messiah. Energy runs from the thrusters and wing roots through the hull into the sword's
     channel, a violet-white charge at the point inside a turning ring; one massive dark beam from the point to the
     ground (a dark core, a bright violet boundary, twisting filaments, turbulent smoke); the darkness compresses into a
     dense sphere and erupts: a black-violet bloom, a brilliant purple shockfront, rising columns of shadow, ground rings,
     lifted debris. ONE decisive hit per enemy, dealt as the drawn shockfront reaches it (noCharge). Then
     ctx.safeReturn() and ctx.done(); the cloud fades on its own. The explosion may cover the pet (the user's rule for
     finishers); everything else never does.
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
    blade: { dmg: 4.0, lift: 0.38, slam: 0.12, recoil: 0.32, range: [7, 8, 9], speed: 9, width: [4.6, 5.6, 6.6], spread: 0.18, height: [2.4, 2.8, 3.2], impactR: 1.3, kb: 3, lanes: 13, cd: 2.5 },
    /* Dark Spikes: the impalement, then Coronation's Dark variant: phase 1 the eruption (one hit per enemy over the whole
       formation), phase 2 the burst (one hit per enemy); timings of the build-up scaled by timeK. Cooldown ~3.5 s */
    spikes: { erupt: 2.5, burst: 3.0, turn: 0.3, plunge: 0.12, fissure: 0.26, timeK: 0.55, recoil: 0.35, cd: 3.5 },
    /* Shockwave Pulsar: aim, charge, a short ray, the compression, then one hit per enemy within r (the drawn footprint) */
    pulsar: { dmg: 5.0, r: [2.8, 3.0, 3.2], aim: 0.14, charge: 0.28, ray: 0.12, squeeze: 0.08, recoil: 0.3, kb: 4, cd: 2.0 },
    /* Dark Messiah: charge, the beam (no damage of its own), the compression, then the explosion: blast x DK once per
       enemy within R (the drawn shockfront), noCharge. blast [tier 0/1/2 = evo 1-3 / 4-6 / 7] is from H's damage audit (the brief's Notes, 2026-11-12) */
    messiah: { charge: 2.6, beam: 1.6, squeeze: 0.32, front: 0.42, blast: [130, 175, 210], R: [7.0, 7.5, 8.0], kb: 7, cloud: 4.2, settle: 0.9, zoom: 0.62 },
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
    () => sprWave('b', 0), () => sprWave('b', 1), () => sprWave('r', 0), () => sprWave('r', 1), () => sprSmoke(0), () => sprSmoke(1), () => sprSmoke(2),
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
    const marks = [];   // floor fissures left under the leading edge (light only, fading)
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
          for (const ln of lanes) { if (ln.stop < RANGE) continue; const f2 = Math.min(front, RANGE), w = W0 + tu.spread * f2, px = ox + ca * f2 - sa * ln.u * w, py = oy + sa * f2 + ca * ln.u * w; if (f2 > 0.6 && blocked(X, px, py)) ln.stop = Math.max(0.4, f2 - 0.3); }
          if (front <= RANGE + 0.3) for (const m of monsOf(ctx, H)) { if (gone(m) || hits.has(m)) continue; const dx = m.x - ox, dy = m.y - oy, al = dx * ca + dy * sa, of = -dx * sa + dy * ca, r = m.r || 0.4; if (al < -r || al > front + r || al < prev - 1.2) continue;
            const w = W0 + tu.spread * Math.max(0, al), lu = of / w; if (Math.abs(lu) > 0.5 + r / w) continue; const ln = lanes[Math.max(0, Math.min(NL - 1, Math.floor((lu + 0.5) * NL)))]; if (al > ln.stop + r) continue;
            hits.add(m); hitM(ctx, m, dmg, { kb: tu.kb, el: 'dark', src: 'strong' }); }
          // fragments drawn up the face, smoke rolling off the crest; floor fissures under the leading edge
          if (front < RANGE) { let k = (L ? 10 : 26) * dt + Math.random(); while (k-- >= 1) { const ln = lanes[(Math.random() * NL) | 0]; if (front > ln.stop) continue; const w = W0 + tu.spread * front, px = ox + ca * front - sa * ln.u * w, py = oy + sa * front + ca * ln.u * w;
              if (Math.random() < 0.6) part(S, 3, px, py, rnd(0.1, HW * 0.6), ca * tu.speed * 0.6, sa * tu.speed * 0.6, rnd(2, 5), rnd(0.3, 0.55), rnd(0.25, 0.45), { v: (Math.random() * 3) | 0, rot: Math.random() * TAU, vr: rnd(-6, 6), g: 3, drag: 1.5 });
              else part(S, 2, px, py, HW * rnd(0.6, 0.95), ca * tu.speed * 0.4, sa * tu.speed * 0.4, rnd(0.5, 1.5), rnd(0.5, 0.8), rnd(0.9, 1.4), { v: (Math.random() * 3) | 0, rot: Math.random() * TAU, vr: rnd(-1, 1), grow: 0.8, drag: 2, a: 0.7 }); }
            if (Math.floor(front / 1.1) !== Math.floor(prev / 1.1)) marks.push({ x: ox + ca * front, y: oy + sa * front, t: 0, rot: Math.random() * TAU, v: marks.length % 2, s: 0.8 + 0.3 * Math.random() + 0.1 * front }); }
          for (const mk of marks) mk.t += dt;
          if (front >= RANGE + 1.2 && marks.every(m => m.t > 1.4)) act.dead = true; } },
      under(c, B) { if (!fired) return; const T = S.T, GY = S.GY;
        // fissures that light under the leading edge and fade behind it (light only)
        for (const mk of marks) { const a = Math.min(1, mk.t / 0.08) * (1 - sm((mk.t - 0.2) / 1.2)); if (a > 0.01) { setT(c, B, H.sx(mk.x), H.sy(mk.y), 0, 1, GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.85; c.rotate(mk.rot); const r = T * 1.7 * mk.s; c.drawImage(sprCracks(mk.v), -r, -r, r * 2, r * 2); } }
        // the blade's impact: a soft violet bloom and a band of light
        const it = t - tu.lift - tu.slam; if (it < 0.7) { floor(c, B, glowSprite(C.vio2), H.sx(ox), H.sy(oy), T * 2.6, 0.7 * (1 - it / 0.7), true, GY); floor(c, B, sprBand(), H.sx(ox), H.sy(oy), T * (0.6 + 2.6 * eout(it / 0.4)), (1 - sm(it / 0.5)) * 0.9, true, GY); }
        // a light under the wave's front
        if (front < RANGE + 0.6) { const w = W0 + tu.spread * Math.min(front, RANGE); for (let i = 0; i < 3; i++) { const u = (i - 1) / 3; floor(c, B, glowSprite(C.vio2), H.sx(ox + ca * front - sa * u * w), H.sy(oy + sa * front + ca * u * w), T * w * 0.35, 0.35 * (1 - sm((front - RANGE) / 0.6)), true, GY); } } },
      over(c, B) { if (!fired) return; const T = S.T, fade = 1 - sm((front - RANGE) / 1.2); if (fade <= 0.01) return;
        // the wave: a curved standing face of lanes, its back lanes first; each lane a stretched body + crest sprite
        const w = W0 + tu.spread * Math.min(front, RANGE), bow = Math.min(1.2, w * 0.18), order = lanes;
        const rise = sm(front / 1.0);
        const crest = []; for (const ln of order) { const fl = Math.min(front, ln.stop), endA = 1 - sm((front - ln.stop) / 0.5); if (endA <= 0.01) { crest.push(null); continue; }
          const lu = ln.u, f2 = fl - bow * (lu * lu * 4), px = ox + ca * f2 - sa * lu * w, py = oy + sa * f2 + ca * lu * w, X0 = H.sx(px), Y0 = H.sy(py), hh = T * HW * (0.9 + 0.12 * Math.sin(S.t * 3 + ln.seed * 0.55)) * (1 - 0.35 * Math.abs(lu) * 2) * (0.55 + 0.45 * rise) * (0.75 + 0.25 * fade), lsx = Math.abs(sa) * w / NL * T, ws = Math.max(lsx * 2.2, T * (1.3 + 1.6 * Math.abs(ca))) * (1 + 0.15 * Math.sin(S.t * 5 + ln.seed));   /* (a lane's width on screen: wide enough to overlap its neighbours however the face is turned) */
          const a = fade * endA * rise * petK(S, X0, Y0 - hh * 0.5, 0.35), vv = ln.seed % 2;
          crest.push([X0, Y0 - hh * 0.9, a, ws]); const scroll = ((S.t * 0.6 + ln.seed * 0.37) % 1) * 128;
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a * 0.92); setT(c, B, X0, Y0, 0); drawScroll(c, sprWave('b', vv), -ws / 2, -hh, ws, hh, scroll);
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * 0.4); drawScroll(c, sprWave('r', vv), -ws / 2, -hh, ws, hh, scroll * 1.6); c.globalAlpha = Math.min(1, a * 0.18); c.drawImage(glowSprite(C.vio2), -ws * 0.7, -hh * 0.95, ws * 1.4, hh * 0.9); }
        // the crest: one continuous soft violet edge along the tops of the lanes (whatever the face's turn), a pale thread in it
        c.setTransform(B); c.globalCompositeOperation = 'lighter'; const xs = sm((Math.abs(sa) - 0.35) / 0.5);   /* (only when the face is broad on screen: seen edge-on the lanes stack in depth and a line through their tops would zigzag) */
        for (let i = 1; i < crest.length; i++) { const p = crest[i - 1], q = crest[i]; if (!p || !q) continue; const dx = q[0] - p[0], dy = q[1] - p[1], Ls = Math.hypot(dx, dy), an = Math.atan2(dy, dx), a = Math.min(p[2], q[2]) * xs, wc = T * 0.55; if (a < 0.02) continue;
          setT(c, B, p[0], p[1], an); c.globalAlpha = Math.min(1, 0.85 * a); c.drawImage(beamSprite(C.vio2), -wc * 0.6, -wc, Ls + wc * 1.2, wc * 2); c.globalAlpha = Math.min(1, 0.45 * a); c.drawImage(beamSprite(C.pale), -wc * 0.3, -wc * 0.3, Ls + wc * 0.6, wc * 0.6); }
        c.setTransform(B); }
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
    const TC = tu.charge, TB = TC + tu.beam, TQ = TB + tu.squeeze, TE = TQ + tu.front, TS = TE + 0.25, TD = TS + tu.settle;
    let t = 0, ph = 'charge', blast = null, finished = false, retAsked = false;
    const hits = new Set();
    ctx.messiahPlan = { x: ix, y: iy, R: RX, blast: tu.blast[tierOf(ctx)] };   /* (read-only, for tests and H's audit) */
    cam(ctx, { zoom: tu.zoom, x: lerp(v.x, ix, 0.5), y: lerp(v.y, iy, 0.5) - 1.5, k: 0.6 });
    sfx(X, 'note', 50, TC + 0.2, 'sawtooth', 0.12, 100); sfx(X, 'note', 75, TC, 'sine', 0.3, 150); sfx(X, 'hum'); sfx(X, 'grumble');
    // the conduits: energy runs from these anchors into the sword's channel
    const SRC = ['thrusterL', 'thrusterR', 'wingRootL', 'wingRootR', 'cockpit'];
    const act = { update(dt) { t += dt;
        if (!S.alive && !S.keep) { if (!finished) { finished = true; done(); } act.dead = true; return; }
        const P = poseOf(ctx);
        if (t < TC) { const u = t / TC; setPose(ctx, 'messiah', u, { channel: sm(u * 1.3), charge: sm(u), glow: 0.4 + 0.6 * sm(u), thrust: 1 - 0.5 * sm(u) });
          // energy streaming in along the hull to the channel; dark particles drawn inward from all round
          const ch = anchorW(ctx, 'swordChannel'); let k = (L ? 10 : 30) * (0.4 + u) * dt + Math.random(); while (k-- >= 1) { const src = anchorW(ctx, SRC[(Math.random() * SRC.length) | 0]), life = rnd(0.3, 0.5); part(S, Math.random() < 0.5 ? 0 : 1, src.x, src.y, src.z, (ch.x - src.x) / life, (ch.y - src.y) / life, (ch.z - src.z) / life, life, rnd(0.2, 0.32), { fin: 0.04 }); }
          if (u > 0.3) { const tip = anchorW(ctx, 'swordTip'); let k2 = (L ? 6 : 18) * u * dt + Math.random(); while (k2-- >= 1) { const a2 = Math.random() * TAU, r = rnd(2.5, 5), life = rnd(0.45, 0.7), sx = tip.x + Math.cos(a2) * r, sy = tip.y + Math.sin(a2) * r * 0.7, sz = Math.max(0.2, tip.z + rnd(-2, 2)); part(S, 2, sx, sy, sz, (tip.x - sx) / life, (tip.y - sy) / life, (tip.z - sz) / life, life, rnd(0.4, 0.7), { v: (Math.random() * 3) | 0, rot: Math.random() * TAU, a: 0.6 }); } }
          if (Math.floor(t / 0.8) !== Math.floor((t - dt) / 0.8)) { shake(ctx, X, 1 + 2.5 * u, 0.3); sfx(X, 'note', 40 + 8 * u, 0.8, 'sawtooth', 0.07, 52); } }
        else if (t < TB) { if (ph === 'charge') { ph = 'beam'; sfx(X, 'crash'); sfx(X, 'whoosh'); sfx(X, 'hiss', tu.beam, 0.3, 700); sfx(X, 'note', 60, tu.beam + 0.4, 'sawtooth', 0.22, 40); shake(ctx, X, 7, 0.3); X.flash && X.flash(RM() ? 0.05 : 0.1, '#D8C2FF'); }
          setPose(ctx, 'messiahFire', (t - TC) / tu.beam, { channel: 1, charge: 1, glow: 1, recoil: 0.6 + 0.4 * Math.sin(t * 40) * 0.2 });
          if (Math.random() < dt * 10) shake(ctx, X, 3, 0.12); if (!(S.lt > t)) { S.lt = t + 0.1; X.light && X.light(ix, iy, 3.5, 0.25); }
          // smoke rolling up from the impact, sparks thrown off it
          let k = (L ? 12 : 34) * dt + Math.random(); while (k-- >= 1) { const a2 = Math.random() * TAU, r = rnd(0.3, 1.4); if (Math.random() < 0.55) part(S, 2, ix + Math.cos(a2) * r, iy + Math.sin(a2) * r * 0.7, 0.2, Math.cos(a2) * 1.2, Math.sin(a2) * 0.9, rnd(1.5, 3), rnd(0.6, 1.0), rnd(1.0, 1.6), { grow: 0.9, drag: 1.4, v: (Math.random() * 3) | 0, rot: Math.random() * TAU, vr: rnd(-1.5, 1.5), a: 0.75 }); else part(S, 1, ix, iy, 0.3, Math.cos(a2) * rnd(3, 7), Math.sin(a2) * rnd(3, 7) * 0.7, rnd(1, 5), rnd(0.3, 0.5), rnd(0.25, 0.4), { g: 9, drag: 1.2 }); } }
        else if (t < TQ) { if (ph === 'beam') { ph = 'squeeze'; sfx(X, 'note', 120, tu.squeeze, 'sine', 0.3, 30); } setPose(ctx, 'messiahFire', 1, { channel: 1 - sm((t - TB) / tu.squeeze), charge: 0, recoil: 0.3 }); }
        else { if (ph === 'squeeze') { ph = 'blast'; explode(); }
          if (blast) { blast.t += dt;
            // ONE decisive hit per enemy, as the drawn shockfront reaches it
            const fr = RX * eout(blast.t / tu.front); if (blast.t <= tu.front + 0.05 && S.alive !== false) for (const m of monsOf(ctx, H)) { if (gone(m) || hits.has(m)) continue; if (Math.hypot(m.x - ix, m.y - iy) - (m.r || 0.4) < fr) { hits.add(m); hitM(ctx, m, DK * tu.blast[tierOf(ctx)], { noCharge: true, kb: tu.kb, el: 'dark', src: 'ult' }); } }
            if (blast.t < 3 && Math.random() < dt * (L ? 8 : 22)) { const a2 = Math.random() * TAU, r = RX * Math.sqrt(Math.random()); part(S, 0, ix + Math.cos(a2) * r, iy + Math.sin(a2) * r * 0.8, rnd(0.2, 1.5), 0, 0, rnd(1, 2.5), rnd(1, 1.8), rnd(0.2, 0.34), { drag: 0.5, g: -0.3 }); } }
          if (t >= TS && !retAsked) { retAsked = true; let rp = null; try { rp = ctx.safeReturn ? ctx.safeReturn() : null; } catch (e) {} ctx.returnPoint = rp; setPose(ctx, 'rest', 1, { channel: 0, glow: 0.2, thrust: 0.3 }); }
          if (t >= TD && !finished) { finished = true; S.keep = 1; S.noPet = true; cam(ctx, null); done(); } }
        if (finished && (!blast || blast.t > tu.cloud)) act.dead = true; },
      under(c, B) { const T = S.T, GY = S.GY, X0 = H.sx(ix), Y0 = H.sy(iy), LO = lowBegin(S, c);   /* (big soft floor light at 1/3 size; the cracks stay sharp) */
        // the telegraph: the explosion's footprint, soft, from the late charge
        const tA = sm((t - (TC - 1.0)) / 0.6) * (blast ? Math.max(0, 1 - blast.t / 0.2) : 1); if (tA > 0.01) { LO.floor(sprBand(), X0, Y0, RX * T * 1.08, tA * (0.45 + 0.15 * Math.sin(t * 8)), true, GY); LO.floor(glowSprite(C.vio2), X0, Y0, RX * T * 0.8, 0.15 * tA, true, GY); }
        if (ph === 'beam' || ph === 'squeeze') { const u = cl((t - TC) / tu.beam); LO.floor(glowSprite(C.vio2), X0, Y0, T * (2 + 3 * u), 0.7, true, GY); setT(c, B, X0, Y0, 0, 1, GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 + 0.5 * u; c.rotate(0.6); const rr = T * (1.6 + 3 * eout(u)); c.drawImage(sprCracks(0), -rr, -rr, rr * 2, rr * 2); }
        if (blast) { const u = blast.t;
          if (u < 0.5) LO.floor(glowSprite(C.wht), X0, Y0, RX * T * 1.1, (1 - u / 0.5) * 0.5, true, GY);
          LO.floor(glowSprite(C.vio2), X0, Y0, RX * T * 1.3, 0.6 * Math.max(0, 1 - u / 3.5), true, GY);
          // the shockfront (its peak at RX when the hits finish), then two expanding ground rings
          for (const [d, sc, w] of [[0, 1.0, 1], [0.15, 1.25, 0.6], [0.35, 1.5, 0.4]]) { const q = cl((u - d) / (tu.front + 0.25 + d)); if (q > 0 && q < 1) { LO.floor(sprShadowRing(), X0, Y0, RX * T * sc * eout(q) * 1.02, (1 - q) * 0.8 * w, false, GY); LO.floor(sprBand(), X0, Y0, RX * T * sc * eout(q) * 1.1, (1 - q) * w, true, GY); } }
          const ca = (u < 0.1 ? u / 0.1 : 1) * Math.max(0, 1 - Math.max(0, u - 0.6) / 1.1); if (ca > 0.01) { setT(c, B, X0, Y0, 0, 1, GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ca; c.rotate(1.3); const rr = RX * T * 1.05 * eout(u / 0.3); c.drawImage(sprCracks(1), -rr, -rr, rr * 2, rr * 2); const c2 = ca * 0.8 * (1 - sm((u - 0.5) / 0.4)); if (c2 > 0.01) { c.rotate(1.7); c.globalAlpha = c2; c.drawImage(sprCracks(0), -rr * 0.7, -rr * 0.7, rr * 1.4, rr * 1.4); } }   /* (the full-size crack layers are the costly fill here: brief) */ }  lowFlush(c, LO); },
      over(c, B) { const T = S.T;
        const tip = anchorW(ctx, 'swordTip'), FX = H.sx(tip.x), FY = H.sy(tip.y) - tip.z * S.ZT, X0 = H.sx(ix), Y0 = H.sy(iy);
        // the charge at the focus: a compact violet-white core inside a turning ring of energy, its light controlled
        if (t < TB + 0.1) { const u = cl(t / TC), k = petK(S, FX, FY, 0.4), pul = 1 + 0.1 * Math.sin(t * (8 + 20 * u)), r = T * (0.3 + 0.9 * eio(u)) * pul, fa = t < TB ? 1 : 1 - (t - TB) / 0.1;
          put(c, B, glowSprite(C.vio2), FX, FY, r * 4, r * 4, (0.25 + 0.5 * u) * k * fa, 0, true); put(c, B, glowSprite(C.pale), FX, FY, r * 1.6, r * 1.6, (0.4 + 0.5 * u) * k * fa, 0, true); put(c, B, glowSprite(C.wht), FX, FY, r * 0.7, r * 0.7, (0.5 + 0.5 * u) * k * fa, 0, true);
          if (u > 0.2) { setT(c, B, FX, FY, 0, 1, 0.45); c.globalCompositeOperation = 'lighter'; c.globalAlpha = sm((u - 0.2) / 0.3) * 0.4 * k * fa; c.rotate(t * 3.2); const rr = r * 2.4; c.drawImage(sprBand(), -rr, -rr, rr * 2, rr * 2); c.globalAlpha *= 0.7; c.drawImage(glowSprite(C.vio), -rr * 1.2, -rr * 1.2, rr * 2.4, rr * 2.4); c.setTransform(B); }   /* (one faint turning band in a haze: no stack of crisp rings) */ }
        // the beam: continuous from the focus to the ground; a dark core, the violet boundary, twisting filaments
        if (ph === 'beam' || ph === 'squeeze') { const dx = X0 - FX, dy = Y0 - FY, Lb = Math.hypot(dx, dy); if (Lb > 4) { const an = Math.atan2(dy, dx), fade = ph === 'squeeze' ? 1 - (t - TB) / tu.squeeze : sm((t - TC) / 0.08), w0 = T * 0.9, w1 = T * 1.7, pul = 1 + 0.05 * Math.sin(t * 43) + 0.04 * Math.sin(t * 27);
            const LO = lowBegin(S, c), NSEG = L ? 4 : 7, strip = (img, scroll, wk, a, add) => { const c = add ? LO.l : LO.d; LO.mark(add, FX, FY, w1 * wk * 1.2); LO.mark(add, X0, Y0, w1 * wk * 1.2); LO.mark(add, (FX + X0) / 2, (FY + Y0) / 2, w1 * wk * 1.2); setT(c, LO.B, FX, FY, an); c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; const o = ((t * scroll) % 1 + 1) % 1;
                for (let k = 0; k < NSEG; k++) { const u0 = k / NSEG, u1 = (k + 1) / NSEG, x0 = Lb * u0, x1 = Lb * u1, hw = lerp(w0, w1, (u0 + u1) / 2) * wk * pul, s0 = ((o + u0 * 1.5) % 1) * 256, sw = 1.5 / NSEG * 256;
                  if (s0 + sw <= 256) c.drawImage(img, s0, 0, sw, 96, x0, -hw, x1 - x0 + 1, hw * 2); else { const f1 = (256 - s0) / sw; c.drawImage(img, s0, 0, 256 - s0, 96, x0, -hw, (x1 - x0) * f1 + 0.5, hw * 2); c.drawImage(img, 0, 0, sw - (256 - s0), 96, x0 + (x1 - x0) * f1, -hw, (x1 - x0) * (1 - f1) + 1, hw * 2); } } };
            for (let i = 0; i <= 3; i++) { const u = i / 3; LO.put(glowSprite(C.vio2), lerp(FX, X0, u), lerp(FY, Y0, u), T * lerp(2.2, 3.8, u), T * lerp(2.2, 3.8, u), 0.3 * fade, 0, true); }
            strip(sprBeam('c'), 2.2, 1.5, 0.95 * fade, false); strip(sprBeam('e'), 3.4, 1.6, 0.9 * fade, true); strip(sprBeam('e'), 1.3, 2.2, 0.25 * fade, true); lowFlush(c, LO);
            // twisting translucent filaments (soft: a wide faint pass under a thin one)
            setT(c, B, FX, FY, an); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const NS = 24;
            const cyc = Math.max(0.6, Lb / (T * 3.2)) * TAU;   /* (about one turn per 3 tiles of beam, whatever its length: no lattice) */
            for (let s2 = 0; s2 < 2; s2++) { c.beginPath(); for (let i = 0; i <= NS; i++) { const u = i / NS, x = u * Lb, y = Math.sin(u * cyc - t * 9 + s2 * Math.PI) * lerp(w0, w1, u) * 0.6; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.globalAlpha = 0.16 * fade; c.strokeStyle = C.vio2; c.lineWidth = T * 0.35; c.stroke(); c.globalAlpha = 0.3 * fade; c.strokeStyle = C.pale; c.lineWidth = Math.max(1, T * 0.06); c.stroke(); }
            c.setTransform(B);
            // the impact: darkness pressing into a dense sphere under the beam
            const u = cl((t - TC) / tu.beam), sq = ph === 'squeeze' ? 1 - (t - TB) / tu.squeeze : 1, rs = T * (0.7 + 1.3 * eout(u)) * sq + T * 0.25; const L2 = lowBegin(S, c); L2.put(glowSprite(C.vio2), X0, Y0 - rs * 0.3, rs * 4, rs * 4, 0.6 * fade, 0, true); lowFlush(c, L2); put(c, B, sprBloom(), X0, Y0 - rs * 0.3, rs * 2.2, rs * 2.2, 0.95, t * 1.5, false); put(c, B, glowSprite(C.pale), X0, Y0 - rs * 0.3, rs * 1.0, rs * 1.0, 0.7 * fade, 0, true); } }
        if (blast) drawBlast(c, B); } };
    function explode() { blast = { t: 0, cols: [], puffs: [] }; S.cover = true;   /* (the finisher may cover the pet) */
      for (let i = 0; i < (L ? 5 : 9); i++) { const a2 = i / 9 * TAU + rnd(-0.3, 0.3), r = RX * rnd(0.25, 0.75); blast.cols.push({ x: ix + Math.cos(a2) * r, y: iy + Math.sin(a2) * r * 0.85, d: rnd(0.05, 0.5), h: rnd(4, 7), w: rnd(0.8, 1.3), v: i % 3 }); }
      for (let i = 0; i < 12; i++) blast.puffs.push({ a: i / 12 * TAU + rnd(-0.2, 0.2), r: rnd(0.8, 1.05), s: rnd(0.8, 1.2), v: i % 3 });
      shake(ctx, X, 18, 0.7); X.flash && X.flash(RM() ? 0.12 : 0.3, '#E6D4FF'); X.hitstop && X.hitstop(0.12); X.light && X.light(ix, iy, RX * 1.6, 1.0);
      sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'stomp'); sfx(X, 'note', 30, 2.6, 'sine', 1.0, 18); sfx(X, 'note', 60, 1.6, 'triangle', 0.4, 30); sfx(X, 'hiss', 2.4, 0.4, 400);
      cam(ctx, { zoom: tu.zoom * 0.95, x: ix, y: iy - 2.5, k: 0.8 });
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
