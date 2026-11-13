/* ---------- Fire's Nidhogg (11th Fire ult): §9-§11 Ultima, the finisher ----------
   The dragon, the flight, the ctx, the meter and the exit live in 20k6g (U.nidhogg); the Strongs in 20k6h; the model in
   20k6f (NIDHOGG_MODEL). This file adds NIDHOGG_MOVES.ultima(ctx), .TUNE_U and .warmU (docs/FIRE-NIDHOGG-GAMEPLAY-BRIEF.md).
   Every hit goes through ctx.hitArea with noCharge (monsters only: the dragon, the rider and allies are never hit). No
   timers: one "act" stepped by one fx that checks ctx.alive() every frame and drops everything when the form is cancelled.
   The sequence (the model's own clips drive the pose: ultima -> beam -> settle):
   1. the dragon rises into a hover, wings spread; the glowing traced outlines light up, then the dorsal ring appears over
      its back and accelerates (a smooth spin, never a strobe), the throat, chest and belly light from within and the
      energy runs to the mouth into a white-hot core; embers are drawn in round the ring; the camera pulls back a little.
   2. the beam: a massive fire beam from the mouth down to the ground point (white-yellow centre, dense scrolling flame,
      turbulent red edges, two molten streams spiralling round it), continuous every frame from the mouth anchor to the
      impact; the dragon braces against the recoil (pushed back and up, a tremble). It ticks every 0.15 s on the monsters in
      the impact ring (drawn on the floor). Under it an impact sphere swells, pressure rings race out and fiery cracks run.
   3. the explosion: one hit per monster inside the dome's radius (the ring drawn on the floor through the beam, and the
      dome's own base): a short white flash, an immense fire dome, a broad shockwave, a rolling fire-and-smoke column
      climbing into a mushroom cloud lit from within, flying embers and glowing ground fractures (light only). The cloud
      thins as it rises and fades within about three seconds, and is cut away round the pet, so the field stays readable.
   4. the ring breaks into embers and the glow dims (the settle clip); then ctx.safeReturn() and ctx.done(); the cloud
      finishes fading on its own (it no longer touches the dragon).
   Sprites are baked once (lazily, a little each frame through the charge, or ahead through warmU); particles are pooled. */
(() => {
  const NM = (self.NIDHOGG_MOVES = self.NIDHOGG_MOVES || {});
  const TAU = Math.PI * 2;
  const C = { wht: '#FFF8E6', yel: '#FFD866', amb: '#FFA640', org: '#FF7A2E', red: '#D2401A', dred: '#7A1E0E', crim: '#B8141E', gold: '#FFC24A', ember: '#FF5A1A' };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const eio = u => { u = cl(u); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }, eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

  /* ---- the numbers (DK = base x K x (1 + 0.08 (evo - 1)); tiers: evo 1-3 / 4-6 / 7) ----
     timeline (s from the press): charge 4.52 (the model's 5.2 s ultima clip played 1.15x) | beam 1.5 (10 ticks, one every
     0.15 s from 4.67) | explosion at 6.07 | settle 1.6 from 6.4 | safeReturn + done at about 8.1; the cloud fades by 9.1 */
  const TUNE = {
    chargeK: 1.15, beam: 1.5, tick: 0.15, tickDmg: 0.6, beamR: 1.8, reach: [3.8, 7.0],
    blast: 14, blastR: [7.0, 7.5, 8.0], blastKb: 6, blastAt: 0.05, settleAt: 0.35, settle: 1.6,   /* (round 2: the dome and its damage radius 6.0/6.5/7.0 -> 7.0/7.5/8.0) */
    zoom: 0.6, cloudLife: 5.5, columnH: 13, secondary: [6, 9, 12], fires: [6, 8, 10],
  };

  /* ================= baked sprites ================= */
  /* per-pixel sprites bake row by row: within warm()'s budget (DEADLINE) a picture may take several calls; a draw that
     needs one before it is done finishes it at once (warm runs from the press, so that should not happen in play) */
  const JOBS = {}; let DEADLINE = 0;
  function imgSprite(key, w, h, fn) { const hit = fxCache.get(key); if (hit) return hit; const J = JOBS[key] || (JOBS[key] = { y: 0, fn });
    if (!J.cv) { J.cv = document.createElement('canvas'); J.cv.width = w; J.cv.height = h; J.g = J.cv.getContext('2d'); J.im = J.g.createImageData(w, h); }
    const d = J.im.data, F = J.fn, lim = DEADLINE; J.x = J.x || 0; while (J.y < h) { const y = J.y, x1 = Math.min(w, J.x + 64); for (let x = J.x; x < x1; x++) { const o = F(x, y, w, h); if (!o) continue; const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255 * cl(o[3]); } if (x1 >= w) { J.x = 0; J.y++; } else J.x = x1; if (lim && performance.now() > lim) break; }
    if (J.y < h) return null; J.g.putImageData(J.im, 0, 0); fxCache.set(key, J.cv); delete JOBS[key]; return J.cv; }
  function radialSprite(key, w, prof) { const hit = fxCache.get(key); if (hit) return hit; const N = 512, LUT = []; for (let i = 0; i < N; i++) LUT.push(prof((i + 0.5) / N)); return imgSprite(key, w, w, (x, y) => { const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - w / 2) / (w / 2); return d >= 1 ? null : LUT[Math.min(N - 1, (d * N) | 0)]; }); }
  /* value noise (tileable in x when per is given) and fbm */
  const HT = new Float32Array(4096); for (let i = 0; i < 4096; i++) HT[i] = R1(i * 0.7317 + 0.173);
  function vnoise(x, y, s, per) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), sk = s * 71;
    const h = (i, j) => { if (per) i = ((i % per) + per) % per; return HT[(((i * 157 + j * 311 + sk) % 4096) + 4096) % 4096]; };
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); }
  function fbm(x, y, s, per) { let a = 0.5, f = 1, v = 0; for (let o = 0; o < 4; o++) { v += a * vnoise(x * f, y * f, s + o * 3, per ? per * f : 0); a *= 0.5; f *= 2; } return v; }
  /* a fire ramp: 0 dark red .. 0.35 red .. 0.6 orange .. 0.8 yellow .. 1 white-hot */
  const RAMP = [[0, [90, 16, 8]], [0.35, [210, 64, 26]], [0.6, [255, 122, 46]], [0.8, [255, 216, 102]], [1, [255, 250, 232]]];
  function ramp(k) { k = cl(k); for (let i = 1; i < RAMP.length; i++) if (k <= RAMP[i][0]) { const a = RAMP[i - 1], b = RAMP[i], u = (k - a[0]) / (b[0] - a[0]); return [lerp(a[1][0], b[1][0], u), lerp(a[1][1], b[1][1], u), lerp(a[1][2], b[1][2], u)]; } return RAMP[4][1]; }
  /* the beam's flame texture (tileable along x): white core, yellow, dense orange, ragged red edges; streaks along it */
  const sprBeam = () => imgSprite('nuBeam', 256, 64, (x, y) => { const v = (y + 0.5 - 32) / 32, n = fbm(x / (256 / 12), y / 9, 3, 12), n2 = fbm(x / (256 / 28), y / 5, 9, 28), edge = 1 - Math.abs(v) - (n - 0.5) * 0.55 - (n2 - 0.5) * 0.2;
    if (edge <= 0) return null; const core = Math.exp(-v * v * 9) * (0.85 + 0.3 * (n2 - 0.5)), k = cl(0.25 + 0.75 * core + 0.25 * (n - 0.5)), c = ramp(k); return [c[0], c[1], c[2], cl(edge / 0.25) * (0.75 + 0.25 * core)]; });
  /* the impact sphere: a white-hot heart in an orange shell, a turbulent rim (rotated as it draws) */
  const sprBall = () => imgSprite('nuBall', 128, 128, (x, y) => { const dx = (x + 0.5 - 64) / 56, dy = (y + 0.5 - 64) / 56, d = Math.hypot(dx, dy), n = fbm(dx * 2.6 + 5, dy * 2.6 + 5, 5), n2 = fbm(dx * 6 + 9, dy * 6 + 9, 8), rr = 0.86 + 0.2 * (n - 0.5);
    if (d >= rr + 0.14) return null; const inside = d < rr, k = inside ? cl(1 - d * d * 0.8 + 0.3 * (n2 - 0.5)) : 0.3 * (1 - (d - rr) / 0.14), c = ramp(k); return [c[0], c[1], c[2], inside ? cl((rr - d) / 0.06 + 0.5) : 0.6 * (1 - (d - rr) / 0.14)]; });
  /* the fire dome: a half-ellipse standing on its floor ellipse (the bottom edge of the sprite is the ground line through the
     centre): white-hot at the base centre, yellow, orange, a ragged red rim, turbulence (normal blend; feathered) */
  const sprDome = () => imgSprite('nuDome', 256, 160, (x, y) => { const dx = (x + 0.5 - 128) / 124, dy = (y + 0.5 - 150) / 140, d = Math.hypot(dx, Math.min(0, dy) * 1 + Math.max(0, dy) * 6), n = fbm(x / 26, y / 20, 11), n2 = fbm(x / 10, y / 8, 17);
    const rr = 0.9 + 0.14 * (n - 0.5) + 0.05 * (n2 - 0.5); if (d >= rr + 0.08) return null; const hot = cl(1 - d * 0.95 + 0.35 * (n2 - 0.5) + 0.12 * sm((dy + 0.45) / 0.35)), c = ramp(0.2 + 0.8 * hot);
    return [c[0], c[1], c[2], cl((rr + 0.08 - d) / 0.16) * (0.82 + 0.18 * hot) * sm((158 - y) / 16)]; });
  /* rolling puffs: 'hot' (glowing fire, normal blend) and 'smoke' (warm grey, lit orange from below) */
  const sprPuff = (kind, v) => fxCache.get('nuPuff' + kind + v) || imgSprite('nuPuff' + kind + v, 96, 96, (() => { let s = 7 + v * 31 + (kind === 'hot' ? 5 : 0); const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const B = []; for (let k = 0; k < 9; k++) B.push([48 + (R() - 0.5) * 42, 46 + (R() - 0.5) * 34, 9 + R() * 12, 0.6 + R() * 0.6]);
    const D = (x, y) => { let d2 = 0; for (const b of B) { const dx = x - b[0], dy = y - b[1]; d2 += b[3] * Math.exp(-(dx * dx + dy * dy) / (b[2] * b[2])); } return d2; };
    return (x, y) => { const d2 = D(x, y), r = Math.hypot(x - 48, y - 48) / 48, n = fbm(x / 7, y / 7, v * 5 + (kind === 'hot' ? 2 : 0)), dd = d2 + 0.35 * (n - 0.5), a = sm((dd - 0.3) / 0.35) * sm((1 - r) / 0.25); if (a < 0.01) return null;
      const lit = cl(0.5 + (D(x, y - 4) - D(x, y + 4)) * 0.9), dark = cl(0.5 + (D(x + 4, y + 4) - D(x - 4, y - 4)) * 0.6), k = cl(dd / 1.8);
      if (kind === 'hot') { const c = ramp(0.32 + 0.4 * k + 0.16 * lit - 0.08 * dark + 0.25 * (n - 0.5)); return [c[0], c[1], c[2], a * (0.7 + 0.3 * k)]; }
      const g0 = 78 + 60 * (1 - lit) * 0.6 + 40 * k - 30 * dark + 24 * (n - 0.5), w = lit * lit; return [Math.round(g0 + 120 * w), Math.round(g0 * 0.9 + 50 * w), Math.round(g0 * 0.85 + 10 * w), a * 0.95]; }; })());
  /* a shockwave on the floor: a white-hot leading edge, an orange band, a red haze inside (additive) */
  const sprShock = () => radialSprite('nuShock', 192, d => { const pk = Math.exp(-Math.pow((d - 0.9) / 0.035, 2)), band = 0.5 * Math.exp(-Math.pow((d - 0.84) / 0.07, 2)), hz = 0.16 * sm((d - 0.3) / 0.5) * (d < 0.9 ? 1 : 0), s = pk + band + hz; if (s < 0.004) return null; const k = pk / s, c = ramp(0.45 + 0.55 * k); return [c[0], c[1], c[2], Math.min(1, s) * sm((1 - d) / 0.05)]; });
  /* the damage telegraph ring: a thin bright orange rim with a soft halo (additive) */
  const sprEdge = () => radialSprite('nuEdge', 192, d => { const pk = Math.exp(-Math.pow((d - 0.92) / 0.022, 2)), halo = 0.3 * Math.exp(-Math.pow((d - 0.92) / 0.07, 2)), s = pk + halo; if (s < 0.004) return null; const c = ramp(0.55 + 0.35 * pk / s); return [c[0], c[1], c[2], Math.min(1, s) * sm((1 - d) / 0.05)]; });
  /* glowing ground fractures (light only, additive): jagged branching cracks from the centre */
  function jag(x0, y0, x1, y1, s, jit, n) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, p = [[x0, y0]]; for (let i = 1; i < n; i++) { const u = i / n, o = (R1(s * 7.13 + i * 3.37) - 0.5) * 2 * jit * Math.sqrt(Math.sin(u * Math.PI)); p.push([x0 + dx * u + nx * o, y0 + dy * u + ny * o]); } p.push([x1, y1]); return p; }
  function crackG(g, pts, w) { g.lineCap = 'round'; g.lineJoin = 'round'; for (const [col, k] of [['rgba(210,64,26,0.35)', 3.4], ['rgba(255,122,46,0.7)', 1.8], ['rgba(255,216,102,0.95)', 0.9], ['rgba(255,250,232,1)', 0.35]]) { g.strokeStyle = col; g.lineWidth = Math.max(0.6, w * k); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } }
  const sprCrack = v => fxCache.get('nuCrack' + v) || fxSprite('nuCrack' + v, 320, 320, g => { g.globalCompositeOperation = 'lighter'; const N = 11;
    for (let i = 0; i < N; i++) { const a = i / N * TAU + (R1(i + v * 9) - 0.5) * 0.45, L = 95 + 60 * R1(i * 3 + v), p = jag(160 + Math.cos(a) * 12, 160 + Math.sin(a) * 12, 160 + Math.cos(a) * L, 160 + Math.sin(a) * L, i + v * 17, 14, 10); crackG(g, p, 2.4 - 0.8 * R1(i + 4));
      for (let k = 0; k < 2; k++) { const q = p[3 + k * 3], b = a + (R1(i * 5 + k + v) - 0.5) * 1.5, l2 = 24 + 30 * R1(i + k * 7 + v); crackG(g, jag(q[0], q[1], q[0] + Math.cos(b) * l2, q[1] + Math.sin(b) * l2, i * 13 + k + v, 6, 5), 1.2); } } });
  /* a rune band for nothing: the ring is the model's. An ember glint for particles */
  const sprGlint = () => fxCache.get('nuGlint') || fxSprite('nuGlint', 32, 32, g => { let gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,170,64,0.7)'); gr.addColorStop(0.6, 'rgba(255,90,26,0.18)'); gr.addColorStop(1, 'rgba(255,90,26,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  /* a streak (an ember's or a shard's tail): head at the right, white-yellow, tapering to red nothing at the left */
  const sprStreak = () => imgSprite('nuStreak', 128, 32, (x, y, w, h) => { const u = (x + 0.5) / w, hw = 0.1 + 0.9 * Math.pow(u, 0.75), v = (y + 0.5 - h / 2) / (h / 2), q = v / hw; if (q * q >= 1) return null; const across = Math.exp(-q * q * 3.4), a = across * Math.pow(u, 1.5) * Math.min(1, (1 - u) / 0.05 + 0.4), c = ramp(0.35 + 0.65 * across * u); return [c[0], c[1], c[2], a]; });
  /* ---- round 2 (2026-11-11, the user: "fire is meant to be formless": soft, feathered, no hard edges) ----
     every flame below is soft by construction: alpha falls off along smooth curves (no thresholds), so the stretched
     sprites read as glowing gas, not cut-outs (no filter: Safari's canvas has none) */
  /* the beam's soft flame strip (tileable along x): a hot core blooming out, billowing turbulence, edges that melt away */
  const sprBeamSoft = () => imgSprite('nuBeamS', 256, 96, (x, y) => { const v = (y + 0.5 - 48) / 48, n = fbm(x / (256 / 10), y / 14, 4, 10), n2 = fbm(x / (256 / 24), y / 7, 13, 24), wv = 0.5 + 0.28 * (n - 0.5) + 0.1 * (n2 - 0.5), q = v / Math.max(0.12, wv), a = Math.exp(-q * q * 1.6) * (0.75 + 0.5 * (n2 - 0.35));
    if (a < 0.01) return null; const core = Math.exp(-v * v * 10), k = cl(0.18 + 0.7 * core + 0.4 * (n - 0.5) + 0.25 * Math.exp(-q * q * 2.5)), c = ramp(k); return [c[0], c[1], c[2], cl(a)]; });
  /* a licking flame tongue (tip up, base at the bottom centre), soft all round; 3 variants */
  const sprTongue = v => imgSprite('nuTongue' + v, 64, 128, (x, y) => { const u = 1 - (y + 0.5) / 128, sw = Math.sin(u * 3.1 + v * 2) * 0.18 * u + (fbm(u * 3 + v * 7, v, 21 + v) - 0.5) * 0.35 * u, dx = (x + 0.5 - 32) / 32 - sw, wid = 0.62 * Math.pow(1 - u, 0.55) * (0.6 + 0.4 * Math.sin(Math.min(1, u * 6) * 1.57)) + 0.02, q = dx / wid;
    const a = Math.exp(-q * q * 2.2) * sm((1 - u) / 0.35) * sm(u / 0.06) * (0.8 + 0.4 * (fbm(x / 9, y / 9, 30 + v) - 0.5)); if (a < 0.01) return null; const c = ramp(0.25 + 0.75 * Math.exp(-q * q * 4) * (1 - u * 0.7)); return [c[0], c[1], c[2], cl(a)]; });
  /* a soft rolling flame puff (no hard silhouette: a cloud of gaussian blobs, lit hot in the middle); 3 variants */
  const sprSoft = v => fxCache.get('nuSoft' + v) || imgSprite('nuSoft' + v, 96, 96, (() => { let s = 11 + v * 37; const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const Bl = []; for (let k = 0; k < 7; k++) Bl.push([48 + (R() - 0.5) * 36, 48 + (R() - 0.5) * 30, 10 + R() * 11, 0.5 + R() * 0.5]);
    return (x, y) => { let d2 = 0; for (const b of Bl) { const dx = x - b[0], dy = y - b[1]; d2 += b[3] * Math.exp(-(dx * dx + dy * dy) / (b[2] * b[2])); } const r = Math.hypot(x - 48, y - 48) / 48, n = fbm(x / 8, y / 8, 40 + v), dd = d2 * (0.75 + 0.5 * n), a = cl(dd * 0.9) * sm((1 - r) / 0.45); if (a < 0.01) return null; const c = ramp(0.22 + 0.6 * cl(dd / 1.6) + 0.2 * (n - 0.5)); return [c[0], c[1], c[2], a * 0.9]; }; })());
  /* a wave of fire blowing outward: a soft ring whose radius wanders with the angle (distorted), a flame band with a hot
     leading edge and a trailing haze, feathered both sides (additive); 2 variants */
  const sprWave = v => imgSprite('nuWave' + v, 192, 192, (x, y) => { const dx = (x + 0.5 - 96) / 96, dy = (y + 0.5 - 96) / 96, d = Math.hypot(dx, dy); if (d >= 1) return null; const an = Math.atan2(dy, dx), n = fbm(Math.cos(an) * 2.2 + 3 + v * 5, Math.sin(an) * 2.2 + 3, 50 + v), n2 = fbm(Math.cos(an) * 6 + 9, Math.sin(an) * 6 + v * 4, 60 + v);
    const rr = 0.74 + 0.16 * (n - 0.5) + 0.06 * (n2 - 0.5), e = (d - rr) / 0.07, band = e > 0 ? Math.exp(-e * e * 1.4) : Math.exp(-e * e * 0.18) * 0.55, a = band * (0.55 + 0.6 * n2) * sm((1 - d) / 0.12); if (a < 0.01) return null; const c = ramp(0.3 + 0.62 * Math.exp(-e * e * 0.9)); return [c[0], c[1], c[2], cl(a)]; });
  const BAKE = [sprGlint, sprEdge, sprShock, sprStreak, sprBeam, sprBall, () => sprCrack(0), () => sprCrack(1), sprDome, () => sprPuff('hot', 0), () => sprPuff('hot', 1), () => sprPuff('hot', 2), () => sprPuff('smoke', 0), () => sprPuff('smoke', 1), () => sprPuff('smoke', 2),
    () => glowSprite(C.org), () => glowSprite(C.yel), () => glowSprite(C.wht), () => glowSprite(C.red), () => glowSprite(C.amb), () => glowSprite('#FFFFFF'),
    () => sprWave(0), () => sprWave(1), () => sprSoft(0), () => sprSoft(1), () => sprSoft(2), sprBeamSoft, () => sprTongue(0), () => sprTongue(1), () => sprTongue(2), () => beamSprite(C.yel), () => beamSprite('#FFFFFF'), () => beamSprite(C.org)];
  let baked = 0;
  function warm(budgetMs) { const t0 = performance.now(), B = budgetMs == null ? 4 : budgetMs; DEADLINE = t0 + B;
    try { while (baked < BAKE.length && performance.now() - t0 < B) { let r = null; try { r = BAKE[baked](); } catch (e) { r = 1; } if (!r) break; baked++; } } finally { DEADLINE = 0; } return baked >= BAKE.length; }

  /* ================= drawing helpers ================= */
  function setT(c, B, x, y, rot, sy) { const cs = rot ? Math.cos(rot) : 1, sn = rot ? Math.sin(rot) : 0, k = sy == null ? 1 : sy; c.setTransform(B.a * cs + B.c * k * sn, B.b * cs + B.d * k * sn, -B.a * sn + B.c * k * cs, -B.b * sn + B.d * k * cs, B.a * x + B.c * y + B.e, B.b * x + B.d * y + B.f); }
  function put(c, B, img, x, y, w, h, a, rot, sy, add) { if (!(a > 0.01) || !(w > 0.5)) return; c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, x, y, rot, sy); c.drawImage(img, -w / 2, -h / 2, w, h); }
  /* draw soft things at a fraction (k) of the screen's resolution into a reused canvas, then blit it up with smoothing:
     the fire is soft anyway (the upscale blurs it a little more, which the user asked for), and it costs a quarter of the
     pixels at k = 0.5. (x0, y0)-(x1, y1) is the screen box; op the composite for the blit. Falls back to drawing straight
     when the base transform is turned */
  const LRC = {};
  function lowRes(c, B, key, x0, y0, x1, y1, k, op, fn) {
    if (B.b || B.c || !(B.a > 0) || !(B.d > 0)) { fn(c, B); return; }
    const W = c.canvas.width, Hc = c.canvas.height; x0 = Math.max(x0, -B.e / B.a); y0 = Math.max(y0, -B.f / B.d); x1 = Math.min(x1, (W - B.e) / B.a); y1 = Math.min(y1, (Hc - B.f) / B.d); if (x1 - x0 < 2 || y1 - y0 < 2) return;
    const dw = Math.ceil((x1 - x0) * B.a * k), dh = Math.ceil((y1 - y0) * B.d * k); let cv = LRC[key]; if (!cv) cv = LRC[key] = document.createElement('canvas');
    if (cv.width < dw || cv.height < dh) { cv.width = Math.max(cv.width, dw + 16); cv.height = Math.max(cv.height, dh + 16); }
    const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, dw + 2, dh + 2);
    g.save(); try { fn(g, { a: B.a * k, b: 0, c: 0, d: B.d * k, e: -x0 * B.a * k, f: -y0 * B.d * k }); } catch (e) {} g.restore();
    { const Sx = S0(); if (Sx && Sx.PY > -1e3) softMask(g, (Sx.PX * B.a + B.e - (x0 * B.a + B.e)) * k, (Sx.PY * B.d + B.f - (y0 * B.d + B.f)) * k, Sx.PR * B.a * k); }
    c.save(); c.setTransform(B); c.globalCompositeOperation = op || 'source-over'; c.globalAlpha = 1; c.imageSmoothingEnabled = true; c.drawImage(cv, 0, 0, dw, dh, x0, y0, dw / (B.a * k), dh / (B.d * k)); c.restore(); }
  let CUR_S = null; const S0 = () => CUR_S;
  /* (2026-11-12, the user: "a circle around the pet masking it from the effects ... fix this") the pet is no longer cut out
     with a clip (it showed as a hard disc). The fire drawn over the actors goes through buffers (lowRes), and each buffer is
     thinned round the rider by a very wide, smooth falloff (a raised-cosine, no edge anywhere: at most 55% at the rider,
     nothing beyond about 2.4 tiles); the few things drawn straight scale their alpha by the same kind of falloff (petK).
     petHole stays as a no-op so nothing else changes shape */
  function petHole() {}
  const sprPetMask = () => fxCache.get('nuPetMask') || fxSprite('nuPetMask', 64, 64, g => { const im = g.createImageData(64, 64), d = im.data; for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const r = Math.hypot(x + 0.5 - 32, y + 0.5 - 32) / 32, a = r >= 1 ? 0 : 0.5 + 0.5 * Math.cos(r * Math.PI), i = (y * 64 + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(255 * a); } g.putImageData(im, 0, 0); });
  function softMask(g, px, py, pr) { if (!PET_SOFT) return; const R = pr * 2.6; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.55; g.drawImage(sprPetMask(), px - R, py - R * 1.1, R * 2, R * 2.2); g.restore(); }

  /* ================= the per-transformation system: one act + pooled particles + a depth-sorted ent ================= */
  const POOL = [];
  /* particle kinds: 0 ember glint, 1 streak, 2 hot puff, 3 smoke puff, 4 flash (glow), 5 shard (dark red streak, gravity) */
  const ADD = [1, 1, 0, 0, 1, 1, 0, 1];   /* 6 soft flame puff (normal), 7 soft flame puff (additive) */
  function kitH(ctx) { return ctx.H && ctx.H.add ? ctx.H : null; }
  function zk(ctx, T) { try { if (ctx.scr && T > 0) { const a = ctx.scr(0, 0, 0), b = ctx.scr(0, 0, 1), k = (a[1] - b[1]) / T; if (k > 0.2 && k < 2) return k; } } catch (e) {} return 0.695; }
  function sysOf(ctx) {
    if (ctx._nmu && ctx._nmu.on) return ctx._nmu;
    const H = kitH(ctx); if (!H) return null;
    const S = { H, ctx, on: true, keep: false, acts: [], parts: [], ents: [], T: H.X.Tz(), ZT: H.X.Tz() * 0.695, PX: 0, PY: -1e4, PR: 30 };
    ctx._nmu = S;
    function kill() { for (const a of S.acts) if (a.abort) try { a.abort(); } catch (e) {} S.acts.length = 0; for (const p of S.parts) POOL.push(p); S.parts.length = 0; for (const e of S.ents) e.life = 0; S.ents.length = 0; S.on = false; }
    S.kill = kill;
    S.fx = H.add({ key: 'nidhogg-ultima', life: 1e9,
      update(dt, f) {
        if (!S.on) { f.life = 0; return; }
        let alive = true; try { alive = !ctx.alive || ctx.alive(); } catch (e) { alive = false; }
        if (!alive && !S.keep) { kill(); f.life = 0; return; }
        S.T = H.X.Tz(); S.ZT = S.T * zk(ctx, S.T);
        for (let i = S.acts.length - 1; i >= 0; i--) { const a = S.acts[i]; a.update(dt); if (a.dead) S.acts.splice(i, 1); }
        const P = S.parts; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); POOL.push(p); continue; }
          if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; } p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = 0; p.vx *= 0.8; p.vy *= 0.8; } p.rot += p.vr * dt; }
        if (!S.acts.length && !P.length) { kill(); f.life = 0; }
      },
      drawUnder(c) { if (!S.on) return; petPos(S); CUR_S = S; const B = c.getTransform(); c.save();
        if (gpuOn()) { const Q = NM.FGFX.begin(c, null); for (const a of S.acts) { if (a.gpuUnder) a.gpuUnder(Q); else if (a.under) a.under(c, B); } c.setTransform(B); gpuParts(S, Q, 1); NM.FGFX.flush(c); c.restore(); return; }
        for (const a of S.acts) if (a.under) a.under(c, B); drawParts(S, c, B, 1); c.restore(); },
      draw(c) { if (!S.on) return; petPos(S); CUR_S = S; const B = c.getTransform(); c.save();
        if (gpuOn()) { S.f3d = (() => { try { return !!(NM.F3D && NM.F3D.usable()); } catch (e) { return false; } })(); if (S.f3d) { const o = anchorW(S.ctx, 'seat'), Q3 = NM.F3D.begin(c, S.H, S.ZT, o.x, o.y, null); for (const a of S.acts) if (a.gpu3d) a.gpu3d(Q3); NM.F3D.flush(c); }   /* (v327: the volumes in true 3D first; the soft glows over them) */
          const Q = NM.FGFX.begin(c, null); for (const a of S.acts) { if (a.gpuOver) a.gpuOver(Q); else if (a.over) a.over(c, B); } c.setTransform(B); gpuParts(S, Q, 0); NM.FGFX.flush(c); c.restore(); return; }   /* (the ultima keeps nothing off the rider: the user's call) */
        for (const a of S.acts) if (a.over) a.over(c, B); drawParts(S, c, B, 0); c.restore(); },
      onEnd() { if (S.on) kill(); } });
    return S;
  }
  function ent(S, y, fn) { const e = S.H.add({ key: 'nidhogg-ultima-ent', life: 1e9, entY: y, update(dt, f) { if (!S.on) f.life = 0; }, drawEnt(c) { if (!S.on) return; const B = c.getTransform(); c.save(); try { fn(c, B, e); } catch (er) {} c.restore(); } }); S.ents.push(e); return e; }
  function anchorW(ctx, name) { try { const p = ctx.anchor && ctx.anchor(name); if (p && isFinite(p.x)) return p; } catch (e) {} const d = ctx.dragon || {}, a = d.heading || 0, f = { mouth: 2.2, head: 2.0, chest: 0.8, belly: 0.2, ring: -0.2, seat: 0.3 }[name] || 0, z = { mouth: -0.3, head: 0.1, belly: -0.5, ring: 1.0, seat: 0.5 }[name] || 0; return { x: (d.x || 0) + Math.cos(a) * f, y: (d.y || 0) + Math.sin(a) * f * 0.72, z: (d.z || 0) + z }; }
  function petPos(S) { const H = S.H, ctx = S.ctx, T = S.T; S.PR = T * 0.95; let s = null; if (ctx.dragon && !ctx.dragon.gone && S.seatOK !== false) s = anchorW(ctx, 'seat');
    if (s) { S.PX = H.sx(s.x); S.PY = H.sy(s.y) - ((s.z || 0) + 0.35) * S.ZT; } else { S.PX = H.sx(H.me.x); S.PY = H.sy(H.me.y) - 0.45 * T; } }
  /* (2026-11-12, the user: "the effect from the explosion will have to be in front of the pet and cover it, it's only temporary":
     the Ultima no longer cuts or dims anything round the rider. PET_SOFT = true would bring back the soft falloff) */
  const PET_SOFT = false;
  const petK = (S, X, Y, lo) => { if (!PET_SOFT) return 1; const d = Math.hypot(X - S.PX, (Y - S.PY) * 1.15) / S.PR; return d >= 2.4 ? 1 : lo + (1 - lo) * sm(d / 2.4); };
  function part(S, kind, x, y, z, vx, vy, vz, life, size, o) { if (!S || S.parts.length > (LOW() ? 260 : 600)) return null; const p = POOL.pop() || {};
    p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.t = 0; p.size = size; p.g = 0; p.drag = 0; p.rot = 0; p.vr = 0; p.grow = 0; p.a = 1; p.u = 0; p.v = 0; p.fin = 0.08; p.flat = 0;
    if (o) for (const k in o) p[k] = o[k]; S.parts.push(p); return p; }
  function partImg(p) { switch (p.kind) { case 0: return sprGlint(); case 1: case 5: return sprStreak(); case 2: return sprPuff('hot', p.v); case 3: return sprPuff('smoke', p.v); case 6: case 7: return sprSoft(p.v); default: return glowSprite(C.yel); } }
  function drawParts(S, c, B, under) { const H = S.H, T = S.T, P = S.parts; if (!P.length) return;
    for (let pass = 0; pass < 2; pass++) { c.globalCompositeOperation = pass ? 'lighter' : 'source-over';
      for (let i = 0; i < P.length; i++) { const p = P[i]; if (ADD[p.kind] !== pass || (p.u ? 1 : 0) !== under) continue;
        const u = p.t / p.life, a = p.a * Math.min(1, p.t / p.fin) * (p.kind === 2 || p.kind === 3 || p.kind >= 6 ? (1 - u) * (1 - u) : 1 - u * u); if (a < 0.015) continue;
        const X = H.sx(p.x), Y = H.sy(p.y) - p.z * S.ZT, s = p.size * T * (1 + p.grow * u), img = partImg(p), k = under ? 1 : petK(S, X, Y, pass ? 0.4 : 0.5); if (a * k < 0.015) continue;
        c.globalAlpha = a * k > 1 ? 1 : a * k;
        if (p.kind === 1 || p.kind === 5) { const ang = Math.atan2(p.vy * 0.72 - p.vz * 0.7, p.vx); setT(c, B, X, Y, ang); c.drawImage(img, -s, -s * 0.11, s, s * 0.22); }
        else { setT(c, B, X, Y, p.rot, p.flat ? 0.55 : 1); c.drawImage(img, -s / 2, -s / 2, s, s); } } }
    c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }

  /* the particles on the GPU layer (0 glint, 1/5 streak, 2 hot puff, 3 smoke puff, 6/7 soft flame, else a glow) */
  const gpuOn = () => { try { return !!(NM.FGFX && NM.FGFX.usable()); } catch (e) { return false; } };
  function gpuParts(S, Q, under) { const H = S.H, T = S.T, P = S.parts;
    for (let i = 0; i < P.length; i++) { const p = P[i]; if ((p.u ? 1 : 0) !== under) continue;
      const u = p.t / p.life, a = p.a * Math.min(1, p.t / p.fin) * (p.kind === 2 || p.kind === 3 || p.kind >= 6 ? (1 - u) * (1 - u) : 1 - u * u); if (a < 0.015) continue;
      const X = H.sx(p.x), Y = H.sy(p.y) - p.z * S.ZT, s = p.size * T * (1 + p.grow * u), sd = (p.rot || 0) * 0.3 + i * 0.11;
      switch (p.kind) {
        case 0: Q.glow(X, Y, s * 0.7, C.amb, a * 0.8); Q.glow(X, Y, s * 0.25, C.wht, a); break;
        case 1: case 5: { const sx = p.vx, sy = p.vy * 0.72 - p.vz * 0.7, sp = Math.hypot(sx, sy) || 1; Q.beam(X - sx / sp * s, Y - sy / sp * s, X, Y, s * 0.08, p.kind === 5 ? C.org : C.yel, a); Q.glow(X, Y, s * 0.12, C.wht, a * 0.8); break; }
        case 2: Q.billow(X, Y, s * 0.6, 0.9 - 0.6 * u, a, sd, p.flat ? 0.55 : 1); break;
        case 3: Q.smoke(X, Y, s * 0.55, a * 0.85, sd, '#3A302C', 0.3 * (1 - u)); break;
        case 6: case 7: Q.billow(X, Y, s * 0.55, 0.85 - 0.5 * u, a * 0.9, sd, p.flat ? 0.55 : 1); break;
        default: Q.glow(X, Y, s * 0.5, C.yel, a); } } }

  /* ================= shared bits ================= */
  const sfx = (X, k, ...a) => { try { const F = X.sfx; if (F && F[k]) F[k](...a); } catch (e) {} };
  const once = ctx => { let d = false; return () => { if (d) return; d = true; try { ctx.done && ctx.done(); } catch (e) {} }; };
  function cam(ctx, o) { try { if (ctx.camera) ctx.camera(o); } catch (e) {} }
  function shake(ctx, X, k, d) { if (RM()) k *= 0.35; try { if (ctx.camera) { ctx.camera({ shake: k, dur: d }); return; } } catch (e) {} if (X.shake) X.shake(k, d); }
  function monsOf(ctx, H) { try { if (ctx.mons) { const L = ctx.mons(); if (L) return L; } } catch (e) {} return H.living(); }
  function ground(ctx, x, y) { try { return ctx.groundAt ? !!ctx.groundAt(x, y) : true; } catch (e) { return true; } }
  function land(ctx, x, y) { try { const p = ctx.nearestLand && ctx.nearestLand(x, y); if (p && isFinite(p.x)) return [p.x, p.y]; if (Array.isArray(p)) return p; } catch (e) {} return null; }
  /* the impact point: the aimed crowd (the centroid of the monsters round the target), else the aim point, else ahead;
     held between reach[0] and reach[1] tiles of the dragon; on solid ground (else the nearest land along the way, else the
     nearest land at all: from offshore the beam reaches back to the shore) */
  function planImpact(ctx, H, d, L) {
    let tg = null; try { tg = ctx.target && ctx.target(); } catch (e) {}
    let tx, ty; if (tg && tg.m && !tg.m.dead) { let sx = 0, sy = 0, n = 0; for (const m of L) if (Math.hypot(m.x - tg.m.x, m.y - tg.m.y) < 2.6) { sx += m.x; sy += m.y; n++; } tx = n ? sx / n : tg.m.x; ty = n ? sy / n : tg.m.y; }
    else { let ap = null; try { ap = ctx.aimPoint && ctx.aimPoint(); } catch (e) {} if (ap && isFinite(ap.x)) { tx = ap.x; ty = ap.y; } else if (tg && isFinite(tg.x)) { tx = tg.x; ty = tg.y; } else { tx = d.x + Math.cos(d.heading || 0) * 4; ty = d.y + Math.sin(d.heading || 0) * 4; } }
    let dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy); if (dd < 0.05) { dx = Math.cos(d.heading || 0); dy = Math.sin(d.heading || 0); dd = 1; }
    if (dd > TUNE.reach[1] + 2) { tx = d.x + dx / dd * (TUNE.reach[1] + 2); ty = d.y + dy / dd * (TUNE.reach[1] + 2); }   /* (no farther than it can glide to and reach) */
    if (!ground(ctx, tx, ty)) { let ok = null; for (let k = 1; k <= 12 && !ok; k++) { const u = k / 12, x = lerp(tx, d.x, u), y = lerp(ty, d.y, u); if (ground(ctx, x, y)) ok = [x, y]; } if (!ok) ok = land(ctx, tx, ty); if (ok) { tx = ok[0]; ty = ok[1]; } }
    return { x: tx, y: ty, a: Math.atan2(ty - d.y, tx - d.x) };
  }

  /* ================= Ultima ================= */
  function ultima(ctx) {
    const S = sysOf(ctx), done = once(ctx); const d = ctx.dragon; if (!S || !d) { done(); return; }
    const H = S.H, X = H.X, Cc = ctx.C || {}, ev = Math.max(1, Math.min(7, Math.round(ctx.evo || Cc.evo || 1))), tier = ctx.tier != null ? ctx.tier : ev >= 7 ? 2 : ev >= 4 ? 1 : 0;
    const DK = ctx.DK > 0 ? ctx.DK : (Cc.base || 10) * (Cc.K || 1) * (1 + 0.08 * (ev - 1)), tu = TUNE, RX = tu.blastR[tier], RB = tu.beamR;
    const M = typeof NIDHOGG_MODEL !== 'undefined' ? NIDHOGG_MODEL : null, CL = M && M.CLIPS;
    const P = d.pose || (d.pose = M ? M.blankPose() : {});
    d.locked = true; d.vx = d.vy = 0;
    const L0 = monsOf(ctx, H), IP = planImpact(ctx, H, d, L0), ix = IP.x, iy = IP.y;
    d.heading = IP.a; if (d.wantHeading !== undefined) d.wantHeading = IP.a;   /* (faces the impact; the core's turn driver may spin to it) */
    // it glides into place as it rises: back from the impact (or forward to it) so the beam has its reach
    const ax = Math.cos(IP.a), ay = Math.sin(IP.a), xs = d.x, ys = d.y, Dd = Math.max(tu.reach[0], Math.min(tu.reach[1], Math.hypot(ix - xs, iy - ys))), x0 = ix - ax * Dd, y0 = iy - ay * Dd;
    const TC = (CL && CL.ultima ? CL.ultima.dur : 5.2) / tu.chargeK, TB = TC + tu.beam, TE = TB + tu.blastAt, TS = TE + tu.settleAt, TD = TS + tu.settle;
    let t = 0, ph = 'charge', nTick = 0, blast = null, finished = false, recoil = 0, pTick = -9, warmed = false;
    const waves = [], ticks = [], cwaves = [];   /* cwaves: the charge's waves of fire blowing outward */
    /* the strings of fire drawn into the mouth while it charges: each a wavy glowing ribbon spiralling in from round the
       dragon, flowing toward the mouth (a moving window along its path), more and quicker as the charge builds */
    const STR = []; for (let i = 0; i < 18; i++) STR.push({ th: i / 18 * TAU + rnd(-0.2, 0.2), R: rnd(3.0, 5.4), z0: rnd(-1.2, 2.6), spin: (i % 2 ? 1 : -1) * rnd(0.45, 0.85), ph: Math.random(), sp: rnd(0.55, 0.85), wf: rnd(0.8, 1.4), wa: rnd(0.14, 0.3), wp: Math.random() * TAU, on: i / 18 });
    let nextWave = 0.35;
    ctx.ultimaPlan = { x: ix, y: iy, beamR: RB, blastR: RX, ticks: Math.round(tu.beam / tu.tick) };   /* (read-only, for tests) */
    cam(ctx, { zoom: tu.zoom, x: lerp(x0, ix, 0.5), y: lerp(y0, iy, 0.5) - 1.5, k: 0.7 });
    sfx(X, 'note', 55, 2.4, 'sawtooth', 0.12, 110); sfx(X, 'note', 82, 2.4, 'sine', 0.3, 165); sfx(X, 'hum'); sfx(X, 'grumble');
    const sfxT = { ring: 0 };

    const act = { update(dt) { t += dt;
        if (!warmed) warmed = warm(1.5);
        if (!finished) { stepDragon(dt); }
        // the beam's ticks: one every tick (s), ten in all; one hit per monster in the impact ring each tick
        if (ph === 'beam') { while (nTick < Math.round(tu.beam / tu.tick) && t >= TC + tu.tick * (nTick + 1) - 1e-6) tick(nTick++); }
        if (ph === 'beam' && t >= TE) { ph = 'blast'; explode(); }
        if (blast) { blast.t += dt; blastFx(dt); }
        for (let i = waves.length - 1; i >= 0; i--) { waves[i].t += dt; if (waves[i].t > 0.7) waves.splice(i, 1); }
        for (let i = cwaves.length - 1; i >= 0; i--) { cwaves[i].t += dt; if (cwaves[i].t > 1.0) cwaves.splice(i, 1); }
        if (ph === 'blast' && t >= TS && !S.ret) { S.ret = true; let rp = null; try { rp = ctx.safeReturn ? ctx.safeReturn() : null; } catch (e) {} ctx.returnPoint = rp; }   /* (the validated landing, asked as it settles) */
        if (ph === 'blast' && t >= TD && !finished) { finished = true; S.keep = true; S.seatOK = false; cam(ctx, null); done(); }
        if (finished && (!blast || blast.t > tu.cloudLife + 0.2)) act.dead = true; },
      under(c, B) { drawUnder(c, B); c.setTransform(B); if (ph === 'charge' || cwaves.length) { chargeUnder(c, B); c.setTransform(B); } },
      gpuUnder(Q) { gpuUnder(Q); }, gpuOver(Q) { gpuOver(Q); }, gpu3d(Q3) { gpu3d(Q3); },   /* (the GPU layer's pictures of the same moment) */
      over(c, B) { if (blast) { drawAfter(c, B); c.setTransform(B); } drawCloud(c, B); c.setTransform(B); if (ph === 'charge' || cwaves.length) { chargeOver(c, B); c.setTransform(B); } drawOver(c, B); c.setTransform(B); },
      abort() { if (!finished) { cam(ctx, null); try { for (const k of ['core', 'jaw', 'throat', 'ring', 'trace']) if (P[k] != null) P[k] = 0; } catch (e) {} } } };
    S.acts.push(act);

    /* ---- the dragon: the model's own clips (ultima at chargeK, beam, settle), the rise, the recoil ---- */
    function stepDragon(dt) {
      let hint = {};
      if (t < TC) { if (CL) hint = CL.ultima.run(P, t * tu.chargeK, dt * tu.chargeK) || {}; if (hint.dz) d.z += hint.dz * dt * tu.chargeK; const g2 = eio(t / 1.1); d.x = lerp(xs, x0, g2); d.y = lerp(ys, y0, g2); chargeFx(dt); }
      else if (t < TB) { if (ph === 'charge') { ph = 'beam'; beamStart(); } if (CL) hint = CL.beam.run(P, t - TC, dt) || {};
        // the recoil: pushed back and a little up against the beam, trembling
        recoil = lerp(recoil, 1, Math.min(1, dt * 6)); const tr = Math.sin(t * 43) * 0.04 + Math.sin(t * 27) * 0.03;
        d.x = x0 - ax * 0.35 * recoil + tr * ay; d.y = y0 - ay * 0.35 * recoil - tr * ax; d.zR = (d.zR || 0); beamFx(dt); }
      else if (t < TS) { if (CL) hint = CL.beam.run(P, t - TC, dt) || {}; P.core = Math.max(0, 1 - (t - TB) / 0.2); P.jaw = 1; recoil = lerp(recoil, 0, Math.min(1, dt * 3)); d.x = x0 - ax * 0.35 * recoil; d.y = y0 - ay * 0.35 * recoil; }
      else if (t < TD) { if (CL) hint = CL.settle.run(P, t - TS, dt) || {}; recoil = lerp(recoil, 0, Math.min(1, dt * 3)); d.x = x0 - ax * 0.35 * recoil; d.y = y0 - ay * 0.35 * recoil; if (hint.ringBreak) ringBreakFx(dt); }
      d.vx = d.vy = 0; }
    /* ---- effects ---- */
    function chargeFx(dt) { const u = t / TC, q = LOW() ? 0.4 : 1;
      // rhythmic waves of fire blowing outward from the dragon, quicker as the charge builds (a beat: the ring's pulse)
      if (t >= nextWave && t < TC - 0.45) { nextWave = t + lerp(0.85, 0.32, eio(u)); const ch = anchorW(ctx, 'chest'), w = { t: 0, x: ch.x, y: ch.y, z: ch.z, k: 0.55 + 0.6 * u, rot: Math.random() * TAU, v: (Math.random() * 2) | 0 }; cwaves.push(w);
        sfx(X, 'whoosh'); if (u > 0.4) shake(ctx, X, 1 + 2.5 * u, 0.15);
        const n = Math.round((LOW() ? 5 : 12) * (0.6 + 0.6 * u)); for (let i = 0; i < n; i++) { const a = i / n * TAU + rnd(-0.25, 0.25), v = rnd(4.5, 7) * (0.8 + 0.4 * u); part(S, i % 3 ? 6 : 7, ch.x + Math.cos(a) * 0.9, ch.y + Math.sin(a) * 0.65, Math.max(0.2, ch.z + rnd(-0.6, 0.4)), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(-0.5, 0.8), rnd(0.55, 0.85), rnd(0.9, 1.5) * (0.8 + 0.4 * u), { drag: 2.4, grow: 1.1, a: i % 3 ? 0.55 : 0.5, v: i % 3, rot: Math.random() * TAU, vr: rnd(-2, 2), fin: 0.05 }); } }
      // embers drawn in round the ring once it shows, then toward the mouth as the core forms
      if (u > 0.25) { const rc = anchorW(ctx, 'ring'), mo = anchorW(ctx, 'mouth'), toMouth = u > 0.68; let k = (14 + 26 * u) * dt * q + Math.random(); while (k-- >= 1) { const a = Math.random() * TAU, r = rnd(1.6, 2.6), sx = rc.x + Math.cos(a) * r, sy = rc.y + Math.sin(a) * r * 0.72, sz = rc.z + rnd(-0.4, 0.8), T2 = toMouth ? mo : rc, life = rnd(0.35, 0.55);
        part(S, toMouth ? 1 : 0, sx, sy, sz, (T2.x - sx) / life, (T2.y - sy) / life, (T2.z - sz) / life, life, toMouth ? rnd(0.7, 1.1) : rnd(0.22, 0.34), { fin: 0.06 }); } }
      // the ring's resonance rising; the rumble
      if (t > 0.35 * TC && Math.floor(t / 0.3) !== Math.floor((t - dt) / 0.3)) { const k = Math.floor(t / 0.3); sfx(X, 'note', 220 + k * 30, 0.32, 'triangle', 0.05, 230 + k * 32); }
      if (Math.floor(t / 0.9) !== Math.floor((t - dt) / 0.9)) { sfx(X, 'note', 48, 1.0, 'sawtooth', 0.08, 60); shake(ctx, X, 1 + 2 * u, 0.3); }
      if (u > 0.75 && Math.random() < dt * 20 * q) { const mo = anchorW(ctx, 'mouth'); part(S, 4, mo.x, mo.y, mo.z, 0, 0, 0, 0.12, rnd(0.6, 1.0), { fin: 0.02, a: 0.5 }); } }
    function beamStart() { sfx(X, 'crash'); sfx(X, 'whoosh'); sfx(X, 'note', 70, tu.beam + 0.3, 'sawtooth', 0.22, 46); sfx(X, 'hiss', tu.beam, 0.32, 900); sfx(X, 'note', 140, tu.beam, 'square', 0.05, 120); shake(ctx, X, 6, 0.3); X.flash && X.flash(RM() ? 0.05 : 0.1, '#FFD7A0'); }
    function beamFx(dt) { const q = LOW() ? 0.35 : 1, u = (t - TC) / tu.beam;
      if (Math.random() < dt * 10) shake(ctx, X, 2.5 + 2 * u, 0.12);
      if (!(S.lt > t)) { S.lt = t + 0.1; X.light && X.light(ix, iy, 3 + 3 * u, 0.25); }
      // sparks and embers thrown off the impact; fire licking up
      let k = 40 * dt * q + Math.random(); while (k-- >= 1) { const a = Math.random() * TAU, v = rnd(3, 8); part(S, Math.random() < 0.6 ? 1 : 0, ix + Math.cos(a) * 0.4, iy + Math.sin(a) * 0.3, 0.3, Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(1, 5), rnd(0.3, 0.6), rnd(0.5, 1.0), { g: 9, drag: 1.2 }); }
      if (Math.random() < dt * 14 * q) { const a = Math.random() * TAU, r = rnd(0.5, 1.4); part(S, 2, ix + Math.cos(a) * r, iy + Math.sin(a) * r * 0.7, 0.2, Math.cos(a) * 0.8, Math.sin(a) * 0.6, rnd(1.2, 2.4), rnd(0.4, 0.6), rnd(0.8, 1.3), { grow: 0.6, a: 0.85, v: (Math.random() * 3) | 0, rot: Math.random() * TAU, vr: rnd(-2, 2) }); }
      // billowing flame volumes rolling down and off the beam (soft puffs carried along it, drifting out and up)
      { const mo = anchorW(ctx, 'mouth'), bdx = ix - mo.x, bdy = iy - mo.y, bdz = 0.25 - mo.z; let k2 = (LOW() ? 18 : 46) * dt + Math.random(); while (k2-- >= 1) { const v = Math.random(), a = Math.random() * TAU, sp = rnd(0.6, 1.2), lat = rnd(0.6, 1.8) * (0.4 + v);
        part(S, Math.random() < 0.6 ? 6 : 7, mo.x + bdx * v, mo.y + bdy * v, Math.max(0.1, mo.z + bdz * v), bdx * sp + Math.cos(a) * lat, bdy * sp + Math.sin(a) * lat * 0.72, bdz * sp + rnd(0.3, 1.4), rnd(0.35, 0.6), rnd(0.7, 1.3) * (0.6 + 0.8 * v), { drag: 1.6, grow: 1.2, a: rnd(0.45, 0.7), v: (Math.random() * 3) | 0, rot: Math.random() * TAU, vr: rnd(-3, 3), fin: 0.05 }); } }
      if (Math.floor(u * 6) !== Math.floor((u - dt / tu.beam) * 6)) waves.push({ t: 0 }); }
    function tick(k) { let n = 0; try { n = ctx.hitArea(ix, iy, RB, DK * tu.tickDmg, { noCharge: true, kb: 0 }); } catch (e) {} ticks.push(t); pTick = t; if (n && k % 2 === 0) sfx(X, 'crack'); }
    function ringBreakFx(dt) { const rc = anchorW(ctx, 'ring'), q = LOW() ? 0.4 : 1; let k = 60 * dt * q + Math.random(); while (k-- >= 1) { const a = Math.random() * TAU, v = rnd(1.2, 2.6); part(S, 0, rc.x + Math.cos(a) * 1.3, rc.y + Math.sin(a) * 0.95, rc.z + rnd(-0.2, 0.2), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(-0.5, 1.2), rnd(0.6, 1.0), rnd(0.2, 0.32), { drag: 1.2, g: 0.8 }); } }
    /* the explosion: one hit per monster inside the dome's radius */
    function explode() { let n = 0; try { n = ctx.hitArea(ix, iy, RX, DK * tu.blast, { noCharge: true, kb: tu.blastKb }); } catch (e) {}
      blast = { t: 0, n, rot: Math.random() * TAU, v: (Math.random() * 2) | 0, puffs: [] };
      for (let i = 0; i < 14; i++) blast.puffs.push({ a: i / 14 * TAU + rnd(-0.2, 0.2), r: rnd(0.85, 1.05), s: rnd(0.85, 1.15), v: i % 3, ph: Math.random() * TAU });
      // secondary bursts round the field (visual only: the one damage event above is the explosion's), and fires left burning
      blast.sec = []; const NSC = tu.secondary[tier]; for (let i = 0; i < NSC; i++) { const a = i / NSC * TAU + rnd(-0.3, 0.3), r = RX * rnd(0.35, 0.92); blast.sec.push({ x: ix + Math.cos(a) * r, y: iy + Math.sin(a) * r * 0.85, t0: rnd(0.22, 1.5), s: rnd(0.8, 1.3), done: false, v: i % 3 }); }
      blast.fires = []; const NF = tu.fires[tier]; for (let i = 0; i < NF; i++) { const a = Math.random() * TAU, r = RX * Math.sqrt(rnd(0.08, 0.85)); blast.fires.push({ x: ix + Math.cos(a) * r, y: iy + Math.sin(a) * r * 0.85, t0: rnd(0.3, 0.9), life: rnd(2.6, 4.0), s: rnd(0.7, 1.2), v: i % 3, ph: Math.random() * TAU }); }
      shake(ctx, X, 16, 0.6); X.flash && X.flash(RM() ? 0.1 : 0.22, '#FFE9C8'); X.hitstop && X.hitstop(n ? 0.1 : 0.04); X.light && X.light(ix, iy, RX * 1.6, 0.9);
      sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'note', 36, 2.2, 'sine', 0.95, 22); sfx(X, 'note', 72, 1.4, 'triangle', 0.35, 36); sfx(X, 'hiss', 2.0, 0.4, 500); sfx(X, 'stomp');
      cam(ctx, { zoom: tu.zoom * 0.95, x: ix, y: iy - 2.5, k: 0.8 });
      const L = LOW();
      for (let i = 0; i < (L ? 14 : 44); i++) { const a = Math.random() * TAU, v = rnd(6, 15); part(S, 1, ix + Math.cos(a) * 0.8, iy + Math.sin(a) * 0.6, rnd(0.3, 1.5), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(2, 9), rnd(0.5, 0.9), rnd(1.2, 2.2), { g: 6, drag: 1.4, fin: 0.02 }); }
      for (let i = 0; i < (L ? 12 : 44); i++) { const a = Math.random() * TAU, v = rnd(2, 9); part(S, 0, ix, iy, rnd(0.5, 3.5), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(2, 9), rnd(1.4, 3.4), rnd(0.25, 0.5), { g: 0.6, drag: 0.9 }); }
      for (let i = 0; i < (L ? 8 : 26); i++) { const a = Math.random() * TAU, v = rnd(4, 11); part(S, 5, ix, iy, 0.5, Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(5, 12), rnd(0.9, 1.6), rnd(0.6, 1.2), { g: 13, drag: 0.5 }); }
      // the ground surge: low rolling puffs racing out to the dome's edge
      for (let i = 0; i < (L ? 8 : 24); i++) { const a = i / 24 * TAU + rnd(-0.1, 0.1), v = RX * rnd(1.6, 2.1); part(S, i % 2 ? 3 : 2, ix + Math.cos(a) * 0.8, iy + Math.sin(a) * 0.6, 0.3, Math.cos(a) * v, Math.sin(a) * v * 0.72, 0.4, rnd(1.2, 1.6), rnd(1.4, 2.0), { grow: 0.8, a: i % 2 ? 0.55 : 0.7, drag: 2.2, v: i % 3, rot: Math.random() * TAU, vr: rnd(-1, 1) }); } }

    /* the explosion's aftermath each frame: secondary bursts going off round the field, embers rising off the fires */
    function blastFx(dt) { const L = LOW(), q = L ? 0.35 : 1;
      for (const b of blast.sec) { if (b.done || blast.t < b.t0) continue; b.done = true; b.at = blast.t; sfx(X, b.v ? 'thud' : 'crash'); shake(ctx, X, 4, 0.2); X.light && X.light(b.x, b.y, 3.2 * b.s, 0.5);
        for (let i = 0; i < (L ? 5 : 11); i++) { const a = Math.random() * TAU, v = rnd(3, 8) * b.s; part(S, i % 2 ? 1 : 0, b.x, b.y, 0.4, Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(2, 7), rnd(0.4, 0.9), rnd(0.5, 1.1), { g: 7, drag: 1.2, fin: 0.02 }); }
        for (let i = 0; i < (L ? 3 : 8); i++) { const a = Math.random() * TAU, v = rnd(0.8, 2.2) * b.s; part(S, i % 2 ? 6 : 2, b.x, b.y, rnd(0.3, 1.2), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(1.5, 3.5), rnd(0.8, 1.3), rnd(1.4, 2.2) * b.s, { grow: 0.9, drag: 1.4, a: 0.8, v: i % 3, rot: Math.random() * TAU, vr: rnd(-1.5, 1.5) }); }
        for (let i = 0; i < (L ? 2 : 5); i++) { const a = Math.random() * TAU, v = rnd(3, 7); part(S, 5, b.x, b.y, 0.4, Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(4, 8), rnd(0.8, 1.3), rnd(0.5, 0.8), { g: 13, drag: 0.5 }); } }
      for (const f of blast.fires) { const a2 = blast.t - f.t0; if (a2 < 0 || a2 > f.life) continue; if (Math.random() < dt * 3 * q) part(S, 0, f.x + rnd(-0.3, 0.3), f.y + rnd(-0.2, 0.2), rnd(0.3, 1.0), rnd(-0.4, 0.4), rnd(-0.3, 0.3), rnd(1.2, 2.6), rnd(0.8, 1.6), rnd(0.18, 0.32), { drag: 0.6, g: -0.4 }); }
      // the field keeps shedding embers as it cools
      if (blast.t < 3.5 && Math.random() < dt * 16 * q) { const a = Math.random() * TAU, r = RX * Math.sqrt(Math.random()); part(S, 0, ix + Math.cos(a) * r, iy + Math.sin(a) * r * 0.85, rnd(0.2, 1.2), rnd(-0.6, 0.6), rnd(-0.4, 0.4), rnd(1.5, 3.5), rnd(1.0, 2.0), rnd(0.2, 0.36), { drag: 0.7, g: -0.2 }); } }
    /* the secondary bursts (a flash, a fireball, a ring) and the fires left burning, over the actors (the pet cut out) */
    function drawAfter(c, B) { const T = S.T, GY = H.GY || 0.55, L = LOW(); c.save(); c.setTransform(B); petHole(c, S);
      for (const b of blast.sec) { if (!b.done) continue; const a2 = blast.t - b.at; if (a2 > 1.1) continue; const X0 = H.sx(b.x), Y0 = H.sy(b.y), r = T * 1.6 * b.s * eout(a2 / 0.35);
        if (a2 < 0.25) putK(c, B, glowSprite('#FFFFFF'), X0, Y0 - r * 0.4, r * 2.4, r * 2.4, (1 - a2 / 0.25) * 0.7, 0, 1, true);
        putK(c, B, sprShock(), X0, Y0, r * 3.2, r * 3.2, Math.max(0, 1 - a2 / 0.6) * 0.8, 0, GY, true);
        const fa = Math.pow(Math.max(0, 1 - a2 / 1.1), 1.3); putK(c, B, sprSoft(b.v), X0, Y0 - r * 0.55, r * 2.2, r * 2.0, fa * 0.9, a2 * 1.5 + b.v, 1, false); putK(c, B, sprSoft((b.v + 1) % 3), X0, Y0 - r * 0.7, r * 1.4, r * 1.3, fa * 0.8, -a2 * 2, 1, true); putK(c, B, glowSprite(C.yel), X0, Y0 - r * 0.5, r * 1.6, r * 1.6, fa * 0.5, 0, 1, true); }
      for (const f of blast.fires) { const a2 = blast.t - f.t0; if (a2 < 0 || a2 > f.life) continue; const k = sm(a2 / 0.25) * (1 - sm((a2 - f.life + 0.9) / 0.9)), X0 = H.sx(f.x), Y0 = H.sy(f.y), hh = T * 1.1 * f.s * k;
        putK(c, B, glowSprite(C.org), X0, Y0, T * 2.2 * f.s, T * 2.2 * f.s * GY, 0.55 * k, 0, 1, true);
        for (let j = 0; j < (L ? 1 : 3); j++) { const fl = 0.75 + 0.25 * Math.sin(blast.t * (13 + j * 4) + f.ph + j * 2), w = hh * (0.55 - j * 0.1), hj = hh * fl * (1 - j * 0.2); setT(c, B, X0 + (j - 1) * w * 0.45, Y0 + T * 0.05, Math.sin(blast.t * 5 + f.ph + j) * 0.12); c.globalCompositeOperation = j === 1 ? 'source-over' : 'lighter'; c.globalAlpha = Math.min(1, 0.85 * k * petK(S, X0, Y0 - hj * 0.5, 0.45)); c.drawImage(sprTongue((f.v + j) % 3), -w / 2, -hj, w, hj); } }
      c.restore(); }
    /* ---- drawing ---- */
    const scr = (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * S.ZT];
    /* ---- the GPU pictures (the same numbers as the 2D ones below): turbulent fire, solid smoke, light-only floor marks ---- */
    const GP0 = [], GP1 = [];
    function gpuUnder(Q) { const T = S.T, GY = H.GY || 0.55, X0 = H.sx(ix), Y0 = H.sy(iy), L = LOW();
      // the telegraphs: the beam's impact ring, the dome's ring
      const tA = sm((t - (TC - 0.8)) / 0.5) * (blast ? Math.max(0, 1 - blast.t / 0.15) : 1);
      if (tA > 0.01) { const pul = 1 + 0.03 * Math.sin(t * 12); Q.ring(X0, Y0, RB * T * pul, C.amb, tA * 0.95, T * 0.25, GY); Q.ground(X0, Y0, RB * T, 0.45 * tA, 0.5 * tA, 1, GY, 0.2);
        const dA = sm((t - (TC - 0.3)) / 0.6) * (blast ? Math.max(0, 1 - blast.t / 0.2) : 1); Q.ring(X0, Y0, RX * T, C.org, dA * (0.55 + 0.25 * Math.sin(t * 9)), T * 0.3, GY); }
      // the charge: waves of fire blowing out over the floor, the light under the dragon
      for (const w of cwaves) { const v = w.t / 1.0, r = T * lerp(1.2, 5.8, eout(v)) * (0.85 + 0.3 * w.k), a = Math.min(1, Math.pow(1 - v, 1.2) * 1.6 * w.k); Q.ring(H.sx(w.x), H.sy(w.y), r, C.org, a * 0.9, T * 0.22, GY); Q.ring(H.sx(w.x), H.sy(w.y), r * 0.94, C.yel, a * 0.5, T * 0.07, GY); }   /* (crisp rings over the floor: no filled disc, no haze) */
      if (ph === 'charge') { const u = t / TC, dg = anchorW(ctx, 'belly'); Q.ground(H.sx(dg.x), H.sy(dg.y), T * (1.0 + 1.0 * u), 0.3 + 0.35 * u, 0.2 + 0.25 * u, 2, GY, 0.3); }
      // under the beam: the floor burning, pressure rings, cracks growing
      if (ph === 'beam' || (blast && blast.t < 0.2)) { const u = cl((t - TC) / tu.beam); Q.ground(X0, Y0, T * (1.6 + 2.6 * eout(u)), 0.75 + 0.3 * u, 1, 4, GY, 1);
        for (const w of waves) { const v = w.t / 0.7; Q.ring(X0, Y0, T * lerp(RB * 0.5, RB * 2.2, eout(v)), C.yel, (1 - v) * 0.9, T * 0.2, GY); } }
      // the explosion on the floor: the broad shockwave, the burning field, the glowing fractures
      if (blast) { const u = blast.t; if (u < 0.5) Q.glow(X0, Y0, RX * 1.1 * T, '#FFFFFF', (1 - u / 0.5) * 0.45, GY);
        Q.ground(X0, Y0, RX * 1.15 * T, 0.75 * Math.max(0, 1 - u / 4.5), 0.6 * Math.max(0, 1 - u / 4.2), blast.rot, GY, Math.max(0, 1 - Math.max(0, u - 0.8) / 1.8));
        for (let k = 0; k < 3; k++) { const v = (u - k * 0.12) / (0.5 + 0.15 * k); if (v <= 0 || v >= 1) continue; Q.ring(X0, Y0, RX * T * (1.11 - 0.06 * k) * eout(v), k ? C.org : C.yel, Math.min(1, (1 - v) * (k ? 0.85 : 1.2)), T * (0.24 - 0.05 * k), GY); Q.ring(X0, Y0, RX * T * (1.11 - 0.06 * k) * eout(v) * 0.97, '#FFFFFF', (1 - v) * (k ? 0.25 : 0.6), T * 0.06, GY); Q.shimmer(X0, Y0, RX * T * (1.2 - 0.06 * k) * eout(v), (1 - v) * 0.4, GY); }   /* (distinct shock fronts, a white-hot leading edge) */
        for (const f of blast.fires) { const a2 = blast.t - f.t0; if (a2 < 0 || a2 > f.life) continue; const k = sm(a2 / 0.25) * (1 - sm((a2 - f.life + 0.9) / 0.9)); Q.ground(H.sx(f.x), H.sy(f.y), T * 1.2 * f.s, 0.8 * k, 0.8 * k, f.ph, GY, 0.6); } } }
    function gpuOver(Q) { const T = S.T, GY = H.GY || 0.55, L = LOW();
      // the charge: pressure discs round the dragon at chest height, strings of fire flowing into the mouth, the mouth's core
      for (const w of cwaves) { const v = w.t / 1.0, r = T * lerp(1.0, 4.3, eout(v)) * (0.85 + 0.3 * w.k), a = Math.min(1, Math.pow(1 - v, 1.4) * 1.35 * w.k), [X1, Y1] = scr(w.x, w.y, w.z); Q.ring(X1, Y1, r, C.amb, a * 0.85, T * 0.18, 0.62); Q.shimmer(X1, Y1, r * 1.05, a * 0.25, 0.62); }
      if (ph === 'charge') { const u = t / TC, mo = anchorW(ctx, 'mouth'), [mx, my] = scr(mo.x, mo.y, mo.z), live = u < 0.06 ? 0 : sm((u - 0.06) / 0.3), n = Math.round((L ? 6 : 13) * (0.45 + 0.55 * u)), PT = GP0;
        for (let i = 0; i < n; i++) { const st = STR[i], head = ((t * st.sp * (0.8 + 1.2 * u) + st.ph) % 1.25), win = 0.55 + 0.2 * u; if (head <= 0.02) continue; const s0 = Math.max(0, head - win), s1 = Math.min(1, head); if (s1 <= s0) continue;
          const NP = L ? 8 : 12; let m = 0; for (let j = NP; j >= 0; j--) { const sv = lerp(s0, s1, j / NP), rr = st.R * Math.pow(1 - sv, 1.15), an = st.th + st.spin * (1 - sv) * 1.4 + t * 0.3 * st.spin, z = lerp(mo.z + st.z0, mo.z, Math.pow(sv, 0.8)), q = scr(mo.x + Math.cos(an) * rr, mo.y + Math.sin(an) * rr * 0.72, z), w = Math.sin(sv * st.wf * TAU - t * 9 + st.wp) * st.wa * T * (1 - sv); PT[m++] = [q[0], q[1] + w]; }
          const fl = (0.75 + 0.25 * Math.sin(t * 23 + i * 1.7)) * live; Q.trail(PT, m, T * 0.34, 0.95, fl, i * 1.3); for (let j = 0; j < m - 1; j++) { const k = j / (m - 1); Q.beam(PT[j][0], PT[j][1], PT[j + 1][0], PT[j + 1][1], T * (0.09 - 0.06 * k), k < 0.3 ? '#FFF1C9' : C.yel, fl * (1 - k * k)); }   /* (a bright thread down each string keeps it vivid on any floor) */ Q.glow(PT[0][0], PT[0][1], T * 0.4, C.amb, 0.45 * fl); Q.glow(PT[0][0], PT[0][1], T * 0.16, '#FFFFFF', 0.8 * fl); }
        const pul = 1 + (0.08 + 0.2 * u) * Math.sin(t * (6 + 18 * u)), rc = T * (0.5 + 2.2 * eio(u)) * pul; Q.glow(mx, my, rc * 1.0, C.org, 0.12 + 0.18 * u); Q.billow(mx, my, rc * 0.5, 0.9, 0.5 + 0.4 * u, 7.1); Q.fire(mx, my, rc * 0.45, 1.0 + 0.2 * u, 0.6 + 0.4 * u, 7.7); Q.glow(mx, my, rc * 0.18, '#FFFFFF', 0.5 + 0.5 * u);   /* (a tight bright core, a soft low glow round it) */
        if (!L) for (let k = 0; k < 3; k++) { const a = t * 2.5 + k * 2.1; Q.tongue(mx + Math.cos(a) * rc * 0.25, my + Math.sin(a) * rc * 0.25, rc * 0.3, rc * 0.7, a + Math.PI / 2, 0.95, 0.45 * u, k); }
        const ir = (t - (TC - 0.45)) / 0.45; if (ir > 0 && ir < 1) Q.ring(mx, my, T * 5 * (1 - eio(ir)), C.yel, 0.9 * Math.sin(ir * Math.PI), T * 0.35, 0.7); }
      // the beam: a broad heat bloom, turbulent flame racing from the mouth to the ground, a white-hot core, tongues licking off it, two molten streams round it
      if (ph === 'beam' || (blast && blast.t < 0.12)) { const m = anchorW(ctx, 'mouth'), [ax0, ay0] = scr(m.x, m.y, m.z), [bx, by] = scr(ix, iy, 0.25), dx = bx - ax0, dy = by - ay0, Lb = Math.hypot(dx, dy);
        if (Lb >= 4) { const fade = blast ? Math.max(0, 1 - blast.t / 0.12) : sm((t - TC) / 0.06), w0 = T * 0.75, w1 = T * 1.5, pul = 1 + 0.06 * Math.sin(t * 47) + 0.04 * Math.sin(t * 29), nx = -dy / Lb, ny = dx / Lb, NSEG = L ? 3 : 5;
          for (let i = 0; i <= 4; i++) { const u = i / 4; Q.glow(lerp(ax0, bx, u), lerp(ay0, by, u), T * lerp(1.0, 1.8, u), C.org, 0.2 * fade); }
          if (!S.f3d) Q.firebody(ax0, ay0, bx, by, w1 * 1.3, 0.9, 0.9 * fade, 2.7, 5.5);   /* (the beam's body, so it holds its colour over a pale floor) */
          if (!S.f3d) for (let k = 0; k < NSEG; k++) { const u0 = k / NSEG, u1 = (k + 1) / NSEG, hw = lerp(w0, w1, (u0 + u1) / 2) * pul, e0 = -0.04, e1 = 0.04; Q.firebeam(lerp(ax0, bx, u0 + e0 * (k > 0)), lerp(ay0, by, u0 + e0 * (k > 0)), lerp(ax0, bx, u1 + e1 * (k < NSEG - 1)), lerp(ay0, by, u1 + e1 * (k < NSEG - 1)), hw * 1.7, 1.0, fade, k * 0.31, 5.5); }
          if (!S.f3d) Q.firebeam(ax0, ay0, bx, by, w0 * 1.2, 1.25, 0.8 * fade, 9.1, 8); Q.beam(ax0, ay0, bx, by, w0 * 0.55 * pul, C.yel, 0.75 * fade); Q.beam(ax0, ay0, bx, by, w0 * 0.25 * pul, '#FFFFFF', fade);
          for (let i = 0; i < (L ? 5 : 10); i++) { const u = ((i * 0.618 + t * 0.9) % 1), side = i % 2 ? 1 : -1, hw = lerp(w0, w1, u) * 0.75, fl = 0.65 + 0.35 * Math.sin(t * 17 + i * 2.3) * Math.sin(t * 11 + i), sz = T * lerp(0.8, 1.8, u) * fl, px = lerp(ax0, bx, u) + nx * side * hw * 0.8, py = lerp(ay0, by, u) + ny * side * hw * 0.8;
            Q.tongue(px, py, sz * 0.28, sz * 0.5, Math.atan2(ny * side, nx * side) + Math.PI / 2 + side * 0.3, 0.85, fade * Math.sin(u * Math.PI) * 0.8, i); }
          const PT = GP1; if (!S.f3d) for (let s2 = 0; s2 < 2; s2++) { let m2 = 0; for (let i = 0; i <= 18; i++) { const u = i / 18, ph2 = u * 14 - t * 22 + s2 * Math.PI, o = Math.sin(ph2) * lerp(w0, w1, u) * 0.62; PT[m2++] = [lerp(ax0, bx, u) + nx * o, lerp(ay0, by, u) + ny * o]; } for (let i = 0; i < m2 - 1; i++) Q.beam(PT[i][0], PT[i][1], PT[i + 1][0], PT[i + 1][1], T * 0.08, i % 2 ? C.amb : C.yel, 0.7 * fade); }
          const u = cl((t - TC) / tu.beam), rs = T * (0.55 + 1.15 * eout(u)) * pul; Q.glow(bx, by, rs * 2, C.yel, 0.35 * fade); Q.billow(bx, by - rs * 0.25, rs * 1.2, 0.95, 0.9 * fade, 6.1); Q.fire(bx, by - rs * 0.25, rs * 0.9, 1.05, 0.8 * fade, 3.3); Q.glow(bx, by - rs * 0.25, rs * 0.5, '#FFFFFF', 0.6 * fade); Q.glow(ax0, ay0, T * 0.8, C.yel, 0.8 * fade); Q.glow(ax0, ay0, T * 0.35, '#FFFFFF', fade); } }
      if (!blast) return;
      // the secondary bursts round the field and the fires left burning
      for (const b of blast.sec) { if (!b.done) continue; const a2 = blast.t - b.at; if (a2 > 1.1) continue; const X1 = H.sx(b.x), Y1 = H.sy(b.y), r = T * 1.6 * b.s * eout(a2 / 0.35), fa = Math.pow(Math.max(0, 1 - a2 / 1.1), 1.3);
        if (a2 < 0.2) Q.glow(X1, Y1 - r * 0.4, r * 0.9, '#FFFFFF', (1 - a2 / 0.2) * 0.45); Q.smoke(X1, Y1 - r * 0.9, r * 0.9, fa * 0.6 * sm(a2 / 0.4), b.v + 1, '#3A302C', 0.5); Q.fire(X1, Y1 - r * 0.55, r * 1.0, 0.85 - 0.55 * a2, fa, b.v * 2.1); Q.glow(X1, Y1 - r * 0.5, r * 0.8, C.yel, fa * 0.25); }
      for (const f of blast.fires) { const a2 = blast.t - f.t0; if (a2 < 0 || a2 > f.life) continue; const k = sm(a2 / 0.25) * (1 - sm((a2 - f.life + 0.9) / 0.9)), X1 = H.sx(f.x), Y1 = H.sy(f.y), hh = T * 1.1 * f.s * k;
        for (let j = 0; j < (L ? 1 : 3); j++) { const fl = 0.75 + 0.25 * Math.sin(blast.t * (13 + j * 4) + f.ph + j * 2), w = hh * (0.55 - j * 0.1), hj = hh * fl * (1 - j * 0.2); Q.tongue(X1 + (j - 1) * w * 0.45, Y1 + T * 0.05, w * 0.5, hj * 0.5, Math.sin(blast.t * 5 + f.ph + j) * 0.12, 0.95 - j * 0.1, 0.9 * k, f.ph + j); } }
      // the dome, the column and the mushroom cloud: fire cooling into smoke as it climbs, the cap lit from within
      const u = blast.t, life = tu.cloudLife; if (u > life) return; const X0 = H.sx(ix), Y0 = H.sy(iy), fadeAll = 1 - sm((u - (life - 1.3)) / 1.3);
      if (u < 0.25) Q.glow(X0, Y0 - T * RX * 0.25, RX * 1.0 * T, '#FFFFFF', Math.pow(1 - u / 0.25, 1.5) * 0.7);
      const puff = (x, y, s, sd, cool, a) => { if (s < 2 || a < 0.01) return; const k = sm((cool - 0.3) / 0.4); if (k > 0.01) Q.smoke(x, y, s * 0.55, a * (0.35 + 0.65 * k), sd, '#3A302C', 1 - k); if (k < 0.99) Q.billow(x, y, s * 0.55, 0.85 - 0.6 * cool, a * (1 - k), sd); };   /* (not too hot: stacked, the billows must stay orange and read as volumes) */
      const dr = RX * T * eout(u / 0.3), dA = (u < 0.9 ? 1 : 1 - sm((u - 0.9) / 1.1)) * fadeAll; if (dA > 0.01 && dr > 2) { const hh = dr * 0.82 * (1 + 0.25 * sm((u - 0.4) / 1.0)), lift = T * 1.2 * sm((u - 0.5) / 1.2);
        Q.billow(X0, Y0 - hh * 0.45 - lift, dr * 0.95, 0.95 - 0.65 * sm(u / 1.6), 0.9 * dA, 4.4, hh / dr * 0.75);   /* (the dome: one great turbulent ball of fire, squat) */
        const NB = L ? 6 : 11; for (let i = 0; i < NB; i++) { const th = Math.PI + (i + 0.5) / NB * Math.PI, ro = 0.92 + 0.06 * Math.sin(u * 4 + i * 2.1); puff(X0 + Math.cos(th) * dr * ro, Y0 - lift + Math.sin(th) * hh * ro, dr * (0.34 + 0.06 * Math.sin(i * 1.7)) * (0.8 + 0.4 * eout(u / 0.5)), i * 1.3, sm((u - 0.35) / 1.0) * 0.8, dA * 0.95); }
        Q.glow(X0, Y0 - hh * 0.3 - lift, dr * 0.6, C.yel, 0.22 * dA * (1 - sm(u / 0.8)));
        const hc = (1 - sm((u - 0.2) / 1.0)) * dA; if (hc > 0.01) { Q.fire(X0, Y0 - hh * 0.4 - lift, dr * 0.42, 1.15, hc, 8.3, 0.85); Q.glow(X0, Y0 - hh * 0.4 - lift, dr * 0.16, '#FFFFFF', 0.7 * hc); } }   /* (the dome's white-hot heart: structure inside the wash) */
      const rise = eout((u - 0.15) / 1.6), Hc = tu.columnH * rise, cool = sm((u - 1.5) / 2.0), puffA = sm((u - 0.15) / 0.3) * fadeAll * 0.92;
      if (puffA > 0.01 && Hc > 0.3) { const NSt = L ? 6 : 12; for (let i = 0; i < NSt; i++) { const v = i / (NSt - 1), z = Hc * v * 0.88, w = RX * (0.34 - 0.1 * v) * (0.85 + 0.15 * Math.sin(u * 3 + i)); puff(X0 + Math.sin(u * 2 + i * 1.7) * T * 0.15, Y0 - z * S.ZT, w * T * 2.1, i * 0.7, cool * (0.7 + 0.3 * v), puffA); }
        const capZ = Hc + RX * 0.22, cy = Y0 - capZ * S.ZT, cw = RX * T * (0.55 + 0.4 * rise), ch = cw * 0.4; Q.glow(X0, cy + ch * 0.5, cw * 1.2, C.org, 0.3 * puffA * (1 - cool * 0.6), 0.6);
        const PF = blast.puffs, n = L ? 6 : PF.length; for (let i = 0; i < n; i++) { const p = PF[i], a = p.a + u * 0.6, sn = Math.sin(a); puff(X0 + Math.cos(a) * cw * p.r, cy + sn * ch * p.r, cw * 0.7 * p.s, i * 1.9, cool * (sn < 0 ? 0.85 : 0.9), puffA); }
        puff(X0, cy - ch * 0.35, cw * 1.05, 0.5, cool * 0.75, puffA); Q.glow(X0, cy, cw * 0.6, C.yel, 0.22 * puffA * (1 - cool * 0.7), 0.7); } }

    /* (v327) the Ultima in true 3D: the rune ring a tilted spinning torus (three bands, runes on the outer) over the dragon;
       the mouth's core; the beam a cylinder of churning fire, a white-hot core and two spiralling fire tubes, seen in
       perspective; the blast a dome of fire swelling from the floor, a stem and a mushroom cap of fire cooling into smoke,
       shock rings as tori on the floor; the secondary bursts as balls of fire */
    const GP3 = [[], [], []], BLAST3D = false;   /* (v329, the user: the blast and the mushroom cloud looked better as the GPU-painted version (v327); only the ring, the charge and the beam stay in 3D) */
    function gpu3d(Q3) { const K = Q3.K, low = Q3.low, now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if ((P.ring || 0) > 0.02) { const rg = anchorW(ctx, 'ring'), A = Math.min(1, P.ring), sp = (P.ringSpin || 0) * 1.5, R1 = 2.2 * (d.scale || 1), tl = [0.16 * Math.cos(sp * 0.3), 0.16 * Math.sin(sp * 0.3), 0.975];
        Q3.torus(rg.x, rg.y, rg.z, R1, 0.1, tl, sp, K.runes, '#FF4A22', A, {}); Q3.torus(rg.x, rg.y, rg.z, R1 * 0.91, 0.045, tl, -sp * 0.7, K.floor, '#FF7A2E', A * 0.9, { heat: 1.0 });
        Q3.torus(rg.x, rg.y, rg.z, R1 * 0.74, 0.07, tl, -sp * 1.6, K.runes, '#FF6A2A', A * 0.8, { nu: low ? 18 : 30 }); Q3.torus(rg.x, rg.y, rg.z, R1 * 0.54, 0.05, tl, sp * 1.2, K.floor, '#FFB060', A * 0.85, { heat: 0.9 });
        NM.ring3dT = now; }   /* (the model's flat ring stands down while this one is drawn) */
      if (ph === 'charge') { const u = t / TC, mo = anchorW(ctx, 'mouth'), r = 0.12 + 0.55 * eio(u); Q3.sphere(mo.x, mo.y, mo.z, r, K.fire, '#FF7A2E', 0.6 + 0.4 * u, { heat: 0.95 + 0.25 * u, seed: 7.7, amp: 0.3, flow: 2.5 }); Q3.sphere(mo.x, mo.y, mo.z, r * 0.4, K.core, '#FFF2C8', 0.5 + 0.5 * u, { amp: 0 }); }
      if (ph === 'beam' || (blast && blast.t < 0.12)) { const m = anchorW(ctx, 'mouth'), fade = blast ? Math.max(0, 1 - blast.t / 0.12) : sm((t - TC) / 0.06), pul = 1 + 0.06 * Math.sin(t * 47), N = low ? 5 : 9, A0 = GP3[0], A1 = GP3[1], A2 = GP3[2];
        for (let i = 0; i < N; i++) { const u = i / (N - 1), q = A0[i] || (A0[i] = [0, 0, 0]); q[0] = lerp(m.x, ix, u); q[1] = lerp(m.y, iy, u); q[2] = lerp(m.z, 0.25, u); }
        Q3.tube(A0, N, u => lerp(0.32, 0.62, u) * pul, K.body, '#FF7A2E', 0.85 * fade, { heat: 0.9, seed: 2.7, m: low ? 7 : 12 }); Q3.tube(A0, N, u => lerp(0.4, 0.75, u) * pul, K.fire, '#FF7A2E', fade, { heat: 1.05, seed: 2.7, scroll: 6, m: low ? 7 : 12, qlen: 6 });
        Q3.tube(A0, N, u => lerp(0.1, 0.16, u), K.core, '#FFF6E0', fade, { m: 6 });
        if (!low) for (let s2 = 0; s2 < 2; s2++) { const AS = s2 ? A2 : A1, NS = 18; for (let i = 0; i < NS; i++) { const u = i / (NS - 1), ph2 = u * 14 - t * 22 + s2 * Math.PI, rr = lerp(0.48, 0.85, u), q = AS[i] || (AS[i] = [0, 0, 0]); q[0] = lerp(m.x, ix, u) + Math.cos(ph2) * rr * 0.7; q[1] = lerp(m.y, iy, u) + Math.sin(ph2) * rr * 0.7; q[2] = lerp(m.z, 0.25, u) + Math.sin(ph2) * rr * 0.5; }
          Q3.tube(AS, NS, () => 0.07, K.fire, '#FFB060', 0.8 * fade, { heat: 1.0, seed: s2 + 4, m: 5 }); }
        const u = cl((t - TC) / tu.beam); Q3.sphere(ix, iy, 0.3, 0.5 + 0.8 * eout(u), K.fire, '#FF7A2E', fade, { heat: 1.0, seed: 3.3, amp: 0.35, flow: 2, sz: 0.7 }); }
      if (!blast || !BLAST3D) return; const u = blast.t, life = tu.cloudLife; if (u > life) return; const fadeAll = 1 - sm((u - (life - 1.3)) / 1.3);
      for (const b of blast.sec) { if (!b.done) continue; const a2 = blast.t - b.at; if (a2 > 1.1) continue; const r = 0.8 * b.s * eout(a2 / 0.35), fa = Math.pow(Math.max(0, 1 - a2 / 1.1), 1.3); Q3.sphere(b.x, b.y, r * 0.6, r, K.fire, '#FF7A2E', fa, { heat: 0.9 - 0.5 * a2, seed: b.v * 2.1, amp: 0.3 }); if (a2 > 0.3) Q3.sphere(b.x, b.y, r * 0.9, r * 1.1, K.smoke, '#3A2A24', fa * 0.7, { seed: b.v, amp: 0.3, warm: 0.5 }); }
      for (let k = 0; k < 3; k++) { const v = (u - k * 0.12) / (0.5 + 0.15 * k); if (v <= 0 || v >= 1) continue; Q3.torus(ix, iy, 0.05, RX * (1.11 - 0.06 * k) * eout(v), 0.12 * (1 - v) + 0.03, [0, 0, 1], 0, K.floor, k ? '#FF7A2E' : '#FFD27A', (1 - v), { heat: 1.0 - 0.3 * k }); }
      const dr = RX * eout(u / 0.3), dA = (u < 0.9 ? 1 : 1 - sm((u - 0.9) / 1.1)) * fadeAll, cool0 = sm(u / 1.6);
      if (dA > 0.01 && dr > 0.1) { const lift = 1.2 * sm((u - 0.5) / 1.2), hz = 0.82 * (1 + 0.25 * sm((u - 0.4) / 1.0));
        Q3.sphere(ix, iy, lift * 0.5, dr * 0.85, K.body, '#FF7A2E', 0.55 * dA * (1 - cool0), { heat: 0.95 - 0.6 * cool0, seed: 4.4, amp: 0.22, sz: hz, hemi: true });
        Q3.sphere(ix, iy, lift * 0.5, dr, K.fire, '#FF7A2E', dA, { heat: 1.0 - 0.65 * cool0, seed: 4.4, amp: 0.25, sz: hz, hemi: true, flow: 1.2 });
        if (u > 0.5) Q3.sphere(ix, iy, lift * 0.5, dr * 1.04, K.smoke, '#3A2A24', dA * 0.4 * sm((u - 0.5) / 1.0), { seed: 5.1, amp: 0.3, sz: hz, hemi: true, warm: 0.8 }); }
      const rise = eout((u - 0.15) / 1.6), Hc = tu.columnH * rise, cool = sm((u - 1.5) / 2.0), pA = sm((u - 0.15) / 0.3) * fadeAll * 0.92;
      if (pA > 0.01 && Hc > 0.3) { const A0 = GP3[0]; for (let i = 0; i < 5; i++) { const q = A0[i] || (A0[i] = [0, 0, 0]); q[0] = ix + Math.sin(u * 2 + i * 1.7) * 0.08; q[1] = iy; q[2] = Hc * i / 4; }
        const rc = w => RX * (0.32 - 0.12 * w);
        Q3.tube(A0, 5, rc, K.smoke, '#3A2A24', pA * (0.2 + 0.45 * cool), { seed: 1.3, m: low ? 8 : 12, warm: 0.8 * (1 - cool) }); Q3.tube(A0, 5, w => rc(w) * 1.05, K.fire, '#FF7A2E', pA * (1 - cool), { heat: 0.85 - 0.5 * cool, seed: 1.3, scroll: 1.2, m: low ? 8 : 12 });
        const capZ = Hc * 0.72 + RX * 0.12, cw = RX * (0.42 + 0.22 * rise);   /* (lower and larger: a crown of a few big rolling balls) */
        /* the mushroom cap: a crown of billowing 3D balls of fire (the 2D cloud's own puff layout), rolling and cooling into smoke */
        const nP = low ? 4 : 6, cA = pA * (1 - cool * 0.75);
        for (let i = 0; i < nP; i++) { const a = i / nP * Math.PI * 2 + u * 0.7, x = ix + Math.cos(a) * cw * 0.62, y = iy + Math.sin(a) * cw * 0.3, z = capZ + Math.sin(a) * cw * 0.12, r = cw * 0.5;
          Q3.sphere(x, y, z, r * 0.92, K.body, '#FF7A2E', cA * 0.9, { heat: 0.95 - 0.45 * cool, seed: i * 1.9, amp: 0.28, flow: 0.7 }); Q3.sphere(x, y, z, r, K.fire, '#FF7A2E', cA, { heat: 1.1 - 0.5 * cool, seed: i * 1.9, amp: 0.3, flow: 0.7 }); if (cool > 0.05) Q3.sphere(x, y, z + r * 0.15, r * 1.08, K.smoke, '#3A2A24', pA * 0.75 * cool, { seed: i * 1.9 + 3, amp: 0.3, warm: 0.6, flow: 0.4 }); }
        Q3.sphere(ix, iy, capZ + cw * 0.12, cw * 0.55, K.fire, '#FF7A2E', cA, { heat: 1.05 - 0.5 * cool, seed: 2.9, amp: 0.3, sz: 0.7, flow: 0.6 }); } }
    /* a sprite drawn straight over the actors: its alpha eased down softly near the rider (no clip, no edge) */
    const putK = (c, B, img, x, y, w, h, a, rot, sy, add) => put(c, B, img, x, y, w, h, a * petK(S, x, y, 0.45), rot, sy, add);
    function drawUnder(c, B) { const T = S.T, GY = H.GY || 0.55, X0 = H.sx(ix), Y0 = H.sy(iy);
      // the telegraphs: the beam's impact ring (its ticks) from the late charge, the dome's ring (the explosion) through the beam
      const tA = sm((t - (TC - 0.8)) / 0.5) * (blast ? Math.max(0, 1 - blast.t / 0.15) : 1);
      if (tA > 0.01) { const pul = 1 + 0.03 * Math.sin(t * 12); put(c, B, sprEdge(), X0, Y0, 2 * RB * T * 1.09 * pul, 2 * RB * T * 1.09 * pul, tA * 0.95, 0, GY, true); put(c, B, glowSprite(C.org), X0, Y0, 2 * RB * T, 2 * RB * T, 0.3 * tA, 0, GY, true);
        const dA = sm((t - (TC - 0.3)) / 0.6) * (blast ? Math.max(0, 1 - blast.t / 0.2) : 1); put(c, B, sprEdge(), X0, Y0, 2 * RX * T * 1.09, 2 * RX * T * 1.09, dA * (0.55 + 0.25 * Math.sin(t * 9)), 0, GY, true); }
      // under the beam: the floor glowing, pressure rings racing out, fiery cracks growing
      if (ph === 'beam' || (blast && blast.t < 0.2)) { const u = cl((t - TC) / tu.beam);
        put(c, B, glowSprite(C.org), X0, Y0, T * (3 + 4 * u), T * (3 + 4 * u), 0.55, 0, GY, true);
        const cs = T * (1.4 + 3.2 * eout(u)) * 2; put(c, B, sprCrack(0), X0, Y0, cs, cs, 0.5 + 0.5 * u, 0.4, GY, true);
        for (const w of waves) { const v = w.t / 0.7, sz = 2 * T * lerp(RB * 0.5, RB * 2.2, eout(v)); put(c, B, sprShock(), X0, Y0, sz, sz, (1 - v) * 0.9, 0, GY, true); } }
      // the explosion on the floor: the broad shockwave (its edge reaches the dome's radius), the glowing fractures, light
      if (blast) { const u = blast.t;
        if (u < 0.5) put(c, B, glowSprite('#FFFFFF'), X0, Y0, RX * 2.2 * T, RX * 2.2 * T, (1 - u / 0.5) * 0.45, 0, GY, true);
        put(c, B, glowSprite(C.org), X0, Y0, RX * 2.6 * T, RX * 2.6 * T, 0.55 * Math.max(0, 1 - u / 4.2), 0, GY, true); put(c, B, glowSprite(C.red), X0, Y0, RX * 1.6 * T, RX * 1.6 * T, 0.4 * Math.max(0, 1 - u / 5.0), 0, GY, true);
        for (let k = 0; k < 3; k++) { const v = (u - k * 0.12) / (0.5 + 0.15 * k); if (v <= 0 || v >= 1) continue; const sz = 2 * RX * T * (1.11 - 0.06 * k) * eout(v); put(c, B, sprShock(), X0, Y0, sz, sz, (1 - v) * (k ? 0.6 : 1), 0, GY, true); }
        const ca = (u < 0.15 ? u / 0.15 : 1) * Math.max(0, 1 - Math.max(0, u - 0.8) / 1.8); if (ca > 0.01) { const s = 2 * RX * T * 1.05 * eout(u / 0.3); put(c, B, sprCrack(blast.v), X0, Y0, s, s, ca, blast.rot, GY, true); if (!LOW()) put(c, B, sprCrack(1 - blast.v), X0, Y0, s * 0.62, s * 0.62, ca * 0.8, blast.rot + 1.4, GY, true); } } }
    /* ---- the charge: waves of fire blowing outward (on the floor and as a pressure ring round the dragon at chest
       height), wavy glowing strings of fire flowing into the mouth, the mouth's core swelling and a final inrush ---- */
    function chargeUnder(c, B) { const T = S.T, GY = H.GY || 0.55;
      for (const w of cwaves) { const v = w.t / 1.0, r = T * lerp(1.2, 5.8, eout(v)) * (0.85 + 0.3 * w.k), a = Math.min(1, Math.pow(1 - v, 1.2) * 1.6 * w.k); put(c, B, sprWave(w.v), H.sx(w.x), H.sy(w.y), r * 2, r * 2, a, w.rot + v * 0.6, GY, true); }
      if (ph === 'charge') { const u = t / TC, dg = anchorW(ctx, 'belly'); put(c, B, glowSprite(C.org), H.sx(dg.x), H.sy(dg.y), T * (2.5 + 3 * u), T * (2.5 + 3 * u), 0.18 + 0.4 * u, 0, GY, true); } }
    function chargeOver(c, B) { const T = S.T, GY = H.GY || 0.55, L = LOW(); c.save(); c.setTransform(B);
      // the pressure rings round the dragon (a disc of flame at chest height; in a buffer, thinned softly round the rider)
      if (cwaves.length) { const ch0 = anchorW(ctx, 'chest'), [cx0, cy0] = scr(ch0.x, ch0.y, ch0.z); lowRes(c, B, 'cwave', cx0 - T * 5.6, cy0 - T * 3.4, cx0 + T * 5.6, cy0 + T * 3.4, L ? 0.34 : 0.5, 'lighter', (c, B) => { for (const w of cwaves) { const v = w.t / 1.0, r = T * lerp(1.0, 4.3, eout(v)) * (0.85 + 0.3 * w.k), a = Math.min(1, Math.pow(1 - v, 1.4) * 1.35 * w.k), [X0, Y0] = scr(w.x, w.y, w.z); put(c, B, sprWave(1 - w.v), X0, Y0, r * 2, r * 2, a, -w.rot - v * 0.8, GY * 0.9, true); } }); c.setTransform(B); }
      if (ph !== 'charge') { c.restore(); return; }
      const u = t / TC, mo = anchorW(ctx, 'mouth'), [mx, my] = scr(mo.x, mo.y, mo.z), live = u < 0.06 ? 0 : sm((u - 0.06) / 0.3), n = Math.round((L ? 6 : 13) * (0.45 + 0.55 * u));
      // the strings (drawn at half resolution into a buffer and added on: soft glowing ribbons, a quarter of the fill)
      lowRes(c, B, 'strings', mx - T * 6.5, my - T * 5.5, mx + T * 6.5, my + T * 5, L ? 0.34 : 0.5, 'lighter', (c, B) => {
      // the strings: points along a spiral from far round the dragon into the mouth, waving across their path
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      for (let i = 0; i < n; i++) { const st = STR[i], head = ((t * st.sp * (0.8 + 1.2 * u) + st.ph) % 1.25), win = 0.55 + 0.2 * u; if (head <= 0.02) continue; const s0 = Math.max(0, head - win), s1 = Math.min(1, head); if (s1 <= s0) continue;
        const NP = L ? 10 : 16, pts = []; for (let j = 0; j <= NP; j++) { const sv = lerp(s0, s1, j / NP), rr = st.R * Math.pow(1 - sv, 1.15), an = st.th + st.spin * (1 - sv) * 1.4 + t * 0.3 * st.spin, z = lerp(mo.z + st.z0, mo.z, Math.pow(sv, 0.8)); const [px, py] = scr(mo.x + Math.cos(an) * rr, mo.y + Math.sin(an) * rr * 0.72, z); pts.push([px, py, sv]); }
        // the wave across the path (screen), shrinking as it nears the mouth
        for (let j = 0; j < pts.length; j++) { const p = pts[j], q = pts[Math.min(pts.length - 1, j + 1)], o = pts[Math.max(0, j - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, w = Math.sin(p[2] * st.wf * Math.PI * 2 - t * 9 + st.wp) * st.wa * T * (1 - p[2]) * 1.2; p[0] += -dy / dl * w; p[1] += dx / dl * w; }
        const fl = (0.75 + 0.25 * Math.sin(t * 23 + i * 1.7)) * live, chunks = 3; c.setTransform(B); c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < chunks; k++) { const j0 = Math.floor(k * NP / chunks), j1 = Math.floor((k + 1) * NP / chunks), wk = (k + 1) / chunks;   /* (thin at the tail, full at the head) */
          /* (a smooth curve through the midpoints, so the ribbon flows instead of zigzagging) */
          c.beginPath(); c.moveTo(pts[j0][0], pts[j0][1]); for (let j = j0 + 1; j < j1; j++) c.quadraticCurveTo(pts[j][0], pts[j][1], (pts[j][0] + pts[j + 1][0]) / 2, (pts[j][1] + pts[j + 1][1]) / 2); c.lineTo(pts[j1][0], pts[j1][1]);
          c.globalAlpha = 0.3 * fl; c.strokeStyle = C.org; c.lineWidth = T * 0.6 * wk; c.stroke(); c.globalAlpha = 0.7 * fl; c.strokeStyle = C.amb; c.lineWidth = T * 0.22 * wk; c.stroke(); c.globalAlpha = 0.65 * fl; c.strokeStyle = C.yel; c.lineWidth = Math.max(1, T * 0.08 * wk); c.stroke(); }
        const hp = pts[pts.length - 1]; put(c, B, glowSprite(C.amb), hp[0], hp[1], T * 1.5, T * 1.5, 0.7 * fl, 0, 1, true); put(c, B, glowSprite('#FFFFFF'), hp[0], hp[1], T * 0.55, T * 0.55, 0.9 * fl, 0, 1, true);
        if (s1 >= 0.995) put(c, B, glowSprite(C.yel), mx, my, T * 1.4, T * 1.4, 0.5 * fl, 0, 1, true); }
      }); c.setTransform(B);
      // the mouth's core: a swelling, throbbing heat (faster and brighter as it fills), and a final inrush ring
      const pul = 1 + (0.08 + 0.2 * u) * Math.sin(t * (6 + 18 * u)), rc = T * (0.5 + 2.2 * eio(u)) * pul; putK(c, B, glowSprite(C.org), mx, my, rc * 2.5, rc * 2.5, 0.3 + 0.45 * u, 0, 1, true); putK(c, B, glowSprite(C.yel), mx, my, rc * 1.6, rc * 1.6, 0.35 + 0.5 * u, 0, 1, true); putK(c, B, glowSprite('#FFFFFF'), mx, my, rc * 0.7, rc * 0.7, 0.4 + 0.6 * u, 0, 1, true);
      if (!L) for (let k = 0; k < 3; k++) { const a = t * 2.5 + k * 2.1; putK(c, B, sprTongue(k), mx + Math.cos(a) * rc * 0.25, my + Math.sin(a) * rc * 0.25, rc * 0.7, rc * 1.4, 0.45 * u, a + Math.PI / 2, 1, true); }
      const ir = (t - (TC - 0.45)) / 0.45; if (ir > 0 && ir < 1) { const r = T * 5 * (1 - eio(ir)); putK(c, B, sprWave(0), mx, my, r * 2, r * 2, 0.9 * Math.sin(ir * Math.PI), t * 3, 0.7, true); }
      c.restore(); }
    /* the beam over the actors (the pet cut out): from the mouth anchor to the impact every frame */
    function drawOver(c, B) { const T = S.T; if (!(ph === 'beam' || (blast && blast.t < 0.12))) return;
      const m = anchorW(ctx, 'mouth'), [ax0, ay0] = scr(m.x, m.y, m.z), [bx, by] = scr(ix, iy, 0.25), dx = bx - ax0, dy = by - ay0, Lb = Math.hypot(dx, dy); if (Lb < 4) return;
      const fade = blast ? Math.max(0, 1 - blast.t / 0.12) : sm((t - TC) / 0.06), ang = Math.atan2(dy, dx), w0 = T * 0.75, w1 = T * 1.5, pul = 1 + 0.06 * Math.sin(t * 47) + 0.04 * Math.sin(t * 29);
      c.save(); c.setTransform(B); petHole(c, S);
      // round 2: no clip and no hard edge anywhere; soft layers drawn at half resolution and blitted up (softer, cheaper)
      { const mg = Math.max(w1 * 2.6, T * 2.2); lowRes(c, B, 'beam', Math.min(ax0, bx) - mg, Math.min(ay0, by) - mg, Math.max(ax0, bx) + mg, Math.max(ay0, by) + mg, LOW() ? 0.34 : 0.5, 'source-over', (c, B) => {
      // a broad heat bloom along it, and the heat haze: a faint wavering envelope round the fire
      for (let i = 0; i <= 4; i++) { const u = i / 4; put(c, B, glowSprite(C.org), lerp(ax0, bx, u), lerp(ay0, by, u), T * lerp(2.0, 3.6, u), T * lerp(2.0, 3.6, u), 0.32 * fade, 0, 1, true); }
      const L2 = LOW(), tex = sprBeamSoft(), NSEG = L2 ? 4 : 7;
      /* one soft strip along the beam, widening from the mouth (w0) to the ground (w1): drawn in segments that each take the
         next stretch of the scrolling texture, so the flame flows from the mouth to the ground */
      const strip = (img, scroll, wk, a, add, wob) => { setT(c, B, ax0, ay0, ang); c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; const o = ((t * scroll) % 1 + 1) % 1;
        for (let k = 0; k < NSEG; k++) { const u0 = k / NSEG, u1 = (k + 1) / NSEG, x0 = Lb * u0, x1 = Lb * u1, hw = lerp(w0, w1, (u0 + u1) / 2) * wk * pul, sx0 = ((o + u0 * 1.6) % 1) * 256, sw = 1.6 / NSEG * 256, yo = wob ? Math.sin(t * 11 + k * 1.9) * wob * T : 0;
          if (sx0 + sw <= 256) c.drawImage(img, sx0, 0, sw, 96, x0, -hw + yo, x1 - x0 + 1, hw * 2); else { const f1 = (256 - sx0) / sw; c.drawImage(img, sx0, 0, 256 - sx0, 96, x0, -hw + yo, (x1 - x0) * f1 + 0.5, hw * 2); c.drawImage(img, 0, 0, sw - (256 - sx0), 96, x0 + (x1 - x0) * f1, -hw + yo, (x1 - x0) * (1 - f1) + 1, hw * 2); } } };
      if (!L2) strip(tex, 1.1, 2.4, 0.13 * fade, true, 0.12);                  // the heat haze
      strip(tex, 2.4, 1.6, 0.8 * fade, false, 0.05);                            // the billowing body (normal blend: it has volume)
      strip(tex, 3.6, 1.15, 0.55 * fade, true, 0.03);                           // hotter flame racing down it
      // the hot core blooming out (gaussian strips, no caps)
      setT(c, B, ax0, ay0, ang); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.75 * fade; c.drawImage(beamSprite(C.yel), -w0 * 0.3, -w0 * 0.75 * pul, Lb + w0 * 0.6, w0 * 1.5 * pul);
      c.globalAlpha = fade; c.drawImage(beamSprite('#FFFFFF'), -w0 * 0.2, -w0 * 0.32 * pul, Lb + w0 * 0.4, w0 * 0.64 * pul);
      // flickering tongues licking off both sides, leaning back toward the ground (they slide down the beam)
      const NT = L2 ? 5 : 10; for (let i = 0; i < NT; i++) { const u = ((i * 0.618 + t * 0.9) % 1), side = i % 2 ? 1 : -1, hw = lerp(w0, w1, u) * 0.75, fl = 0.65 + 0.35 * Math.sin(t * 17 + i * 2.3) * Math.sin(t * 11 + i), sz = T * lerp(0.8, 1.8, u) * fl;
        const tx = Lb * u, ty = side * hw * 0.8, rot = side > 0 ? Math.PI * 0.85 : Math.PI * 0.15; setT(c, B, ax0, ay0, ang); c.translate(tx, ty); c.rotate(rot - (side > 0 ? 0.35 : -0.35) * Math.sin(t * 7 + i)); c.globalCompositeOperation = i % 3 ? 'lighter' : 'source-over'; c.globalAlpha = Math.min(1, fade * Math.sin(u * Math.PI) * (i % 3 ? 0.75 : 0.6)); c.drawImage(sprTongue(i % 3), -sz * 0.25, -sz, sz * 0.5, sz); }
      // two molten streams spiralling round it (a soft glow under a thin bright thread; the far half dimmer)
      setT(c, B, ax0, ay0, ang); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      const NS = 26; for (let s2 = 0; s2 < 2; s2++) { for (let half = 0; half < 2; half++) { c.beginPath(); let pen = false; for (let i = 0; i <= NS; i++) { const u = i / NS, x = u * Lb, ph2 = u * 14 - t * 22 + s2 * Math.PI, z = Math.cos(ph2), y = Math.sin(ph2) * lerp(w0, w1, u) * 0.62; if ((z >= 0) === !!half) { pen ? c.lineTo(x, y) : c.moveTo(x, y); pen = true; } else pen = false; }
          c.globalAlpha = (half ? 0.3 : 0.12) * fade; c.strokeStyle = C.org; c.lineWidth = T * (half ? 0.4 : 0.26); c.stroke(); c.globalAlpha = (half ? 0.8 : 0.3) * fade; c.strokeStyle = C.amb; c.lineWidth = T * (half ? 0.11 : 0.07); c.stroke(); if (half) { c.globalAlpha = 0.7 * fade; c.strokeStyle = C.wht; c.lineWidth = T * 0.03; c.stroke(); } } }
      c.setTransform(B);
      }); c.setTransform(B); }
      // the impact sphere swelling under the pressure, its glow; the mouth's flare
      const u = cl((t - TC) / tu.beam), rs = T * (0.55 + 1.15 * eout(u)) * pul;
      putK(c, B, glowSprite(C.yel), bx, by, rs * 4, rs * 4, 0.6 * fade, 0, 1, true); putK(c, B, sprBall(), bx, by - rs * 0.25, rs * 2.3, rs * 2.3, fade, t * 2.4, 1, false); putK(c, B, sprBall(), bx, by - rs * 0.25, rs * 1.6, rs * 1.6, 0.6 * fade, -t * 3.1, 1, true); putK(c, B, glowSprite('#FFFFFF'), bx, by - rs * 0.25, rs * 1.3, rs * 1.3, 0.8 * fade, 0, 1, true);
      putK(c, B, glowSprite(C.yel), ax0, ay0, T * 1.6, T * 1.6, 0.8 * fade, 0, 1, true); putK(c, B, glowSprite('#FFFFFF'), ax0, ay0, T * 0.7, T * 0.7, fade, 0, 1, true);
      c.restore(); }
    /* the dome, the column and the mushroom cloud (over everything but the pet: an explosion this size engulfs the scene,
       then thins and fades so the field reads again) */
    function drawCloud(c, B) { if (!blast) return; const u = blast.t, T = S.T, life = tu.cloudLife; if (u > life) return;
      const X0 = H.sx(ix), Y0 = H.sy(iy), fadeAll = 1 - sm((u - (life - 1.3)) / 1.3);
      c.save(); c.setTransform(B); petHole(c, S);
      // the white flash core (short; bounded; full resolution)
      if (u < 0.3) putK(c, B, glowSprite('#FFFFFF'), X0, Y0 - T * RX * 0.25, RX * 2.2 * T, RX * 2.2 * T, (1 - u / 0.3) * 0.75, 0, 1, true);
      c.restore();
      // the rest at half resolution (a third on low effects) and blitted up: soft, and a quarter of the pixels
      lowRes(c, B, 'cloud', X0 - RX * T * 1.7, Y0 - (tu.columnH + RX * 0.9) * S.ZT - RX * T * 1.0, X0 + RX * T * 1.7, Y0 + RX * T * 0.7, LOW() ? 0.34 : 0.5, 'source-over', (c, B) => {
      // the fire dome: its base the dome's radius (the damage area), rising and thinning into the column
      const dr = RX * T * eout(u / 0.3), dA = (u < 0.9 ? 1 : 1 - sm((u - 0.9) / 1.1)) * fadeAll; if (dA > 0.01 && dr > 2) { const hh = dr * 0.82 * (1 + 0.25 * sm((u - 0.4) / 1.0)), lift = T * 1.2 * sm((u - 0.5) / 1.2);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.92 * dA; setT(c, B, X0, Y0 - lift, 0); c.drawImage(sprDome(), -dr * 1.032, -hh * 1.07, dr * 2.065, hh * 1.143);
        // rolling fire billows along its silhouette (cooling as the dome lifts), so it reads as a churning volume
        const NB = LOW() ? 6 : 11; for (let i = 0; i < NB; i++) { const th = Math.PI + (i + 0.5) / NB * Math.PI, ro = 0.92 + 0.06 * Math.sin(u * 4 + i * 2.1), bx2 = X0 + Math.cos(th) * dr * ro, by2 = Y0 - lift + Math.sin(th) * hh * ro, bs = dr * (0.34 + 0.06 * Math.sin(i * 1.7)) * (0.8 + 0.4 * eout(u / 0.5));
          drawPuff(c, B, bx2, by2, bs, u * (i % 2 ? 1.2 : -1.2) + i, i % 3, sm((u - 0.35) / 1.0) * 0.8, dA * 0.95); }
        put(c, B, glowSprite(C.yel), X0, Y0 - hh * 0.3 - lift, dr * 1.4, dr * 1.1, 0.45 * dA, 0, 1, true); }
      // the column and the cap: rolling puffs climbing; hot to smoke as they cool; the cap lit from within (underside glow)
      const rise = eout((u - 0.15) / 1.6), Hc = tu.columnH * rise, cool = sm((u - 1.5) / 2.0), puffA = sm((u - 0.15) / 0.3) * fadeAll * 0.92;
      if (puffA > 0.01 && Hc > 0.3) {
        const NSt = LOW() ? 6 : 12; for (let i = 0; i < NSt; i++) { const v = i / (NSt - 1), z = Hc * v * 0.88, w = RX * (0.34 - 0.1 * v) * (0.85 + 0.15 * Math.sin(u * 3 + i)), x = X0 + Math.sin(u * 2 + i * 1.7) * T * 0.15, y = Y0 - z * S.ZT, s = w * T * 2.1, rot = u * (i % 2 ? 0.8 : -0.8) + i;
          drawPuff(c, B, x, y, s, rot, i % 3, cool * (0.7 + 0.3 * v), puffA); }
        const capZ = Hc + RX * 0.22, cy = Y0 - capZ * S.ZT, cw = RX * T * (0.55 + 0.4 * rise), ch = cw * 0.4;
        put(c, B, glowSprite(C.org), X0, cy + ch * 0.5, cw * 2.4, cw * 1.4, 0.55 * puffA * (1 - cool * 0.6), 0, 1, true);
        // the toroidal cap: back puffs, the middle, then front puffs; each a little curled under
        const PF = blast.puffs, n = LOW() ? 6 : PF.length, order = []; for (let i = 0; i < n; i++) { const a = PF[i].a + u * 0.6; order.push([Math.sin(a), i, a]); } order.sort((p, q) => p[0] - q[0]);
        for (const [sn, i, a] of order) { if (sn >= 0) continue; const p = PF[i]; drawPuff(c, B, X0 + Math.cos(a) * cw * p.r, cy + sn * ch * p.r, cw * 0.7 * p.s, a + u, p.v, cool * 0.85, puffA); }
        drawPuff(c, B, X0, cy - ch * 0.35, cw * 1.05, u * 0.5, 1, cool * 0.75, puffA);
        for (const [sn, i, a] of order) { if (sn < 0) continue; const p = PF[i]; drawPuff(c, B, X0 + Math.cos(a) * cw * p.r, cy + sn * ch * p.r, cw * 0.7 * p.s, a + u, p.v, cool * 0.9, puffA); }
        // lit from within: the core of the cap and the column's stem glowing through
        put(c, B, glowSprite(C.yel), X0, cy, cw * 1.2, cw * 0.8, 0.45 * puffA * (1 - cool * 0.7), 0, 1, true); { const hotA = puffA * (1 - cool * 0.8); if (hotA > 0.02) { for (let k = 0; k < (LOW() ? 3 : 6); k++) { const a2 = k / 6 * TAU + u * 0.9, px = X0 + Math.cos(a2) * cw * 0.55, py = cy + ch * 0.35 + Math.sin(a2) * ch * 0.3; put(c, B, sprSoft(k % 3), px, py, cw * 0.75, cw * 0.6, 0.45 * hotA, a2, 1, true); } for (let k = 0; k < (LOW() ? 3 : 5); k++) { const v = (k + 0.5) / 5; put(c, B, sprSoft((k + 1) % 3), X0 + Math.sin(u * 3 + k) * T * 0.2, lerp(Y0, cy, v), RX * T * 0.42, RX * T * 0.42, 0.4 * hotA, u * 2 + k, 1, true); } } } put(c, B, glowSprite(C.amb), X0, lerp(Y0, cy, 0.5), cw * 0.6, Math.abs(Y0 - cy) * 1.1 + 1, 0.35 * puffA * (1 - cool * 0.7), 0, 1, true); }
      }); }
    /* one rolling puff: the hot sprite crossfading to the smoke sprite as it cools (light from the fire underneath) */
    function drawPuff(c, B, x, y, s, rot, v, cool, a) { if (s < 2 || a < 0.01) return; const k = sm((cool - 0.3) / 0.4);   /* (one sprite outside the crossfade: half the fill) */
      if (k < 0.99) put(c, B, sprPuff('hot', v), x, y, s, s, a * (1 - k), rot, 1, false); if (k > 0.01) put(c, B, sprPuff('smoke', v), x, y, s, s, a * k, rot, 1, false); }
  }

  NM.ultima = ultima;
  NM.TUNE_U = TUNE;
  NM.warmU = warm;
  NM.__bk = () => baked;
  NM.__dbgU = { sprBeam, sprBall, sprDome, sprPuff, sprShock, sprEdge, sprCrack };
})();
