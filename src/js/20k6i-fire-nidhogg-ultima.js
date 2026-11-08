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
    blast: 14, blastR: [6.0, 6.5, 7.0], blastKb: 6, blastAt: 0.05, settleAt: 0.35, settle: 1.6,
    zoom: 0.6, cloudLife: 4.0, columnH: 10,
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
  const BAKE = [sprGlint, sprEdge, sprShock, sprStreak, sprBeam, sprBall, () => sprCrack(0), () => sprCrack(1), sprDome, () => sprPuff('hot', 0), () => sprPuff('hot', 1), () => sprPuff('hot', 2), () => sprPuff('smoke', 0), () => sprPuff('smoke', 1), () => sprPuff('smoke', 2),
    () => glowSprite(C.org), () => glowSprite(C.yel), () => glowSprite(C.wht), () => glowSprite(C.red), () => glowSprite(C.amb), () => glowSprite('#FFFFFF')];
  let baked = 0;
  function warm(budgetMs) { const t0 = performance.now(), B = budgetMs == null ? 4 : budgetMs; DEADLINE = t0 + B;
    try { while (baked < BAKE.length && performance.now() - t0 < B) { let r = null; try { r = BAKE[baked](); } catch (e) { r = 1; } if (!r) break; baked++; } } finally { DEADLINE = 0; } return baked >= BAKE.length; }

  /* ================= drawing helpers ================= */
  function setT(c, B, x, y, rot, sy) { const cs = rot ? Math.cos(rot) : 1, sn = rot ? Math.sin(rot) : 0, k = sy == null ? 1 : sy; c.setTransform(B.a * cs + B.c * k * sn, B.b * cs + B.d * k * sn, -B.a * sn + B.c * k * cs, -B.b * sn + B.d * k * cs, B.a * x + B.c * y + B.e, B.b * x + B.d * y + B.f); }
  function put(c, B, img, x, y, w, h, a, rot, sy, add) { if (!(a > 0.01) || !(w > 0.5)) return; c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, x, y, rot, sy); c.drawImage(img, -w / 2, -h / 2, w, h); }
  function petHole(c, S) { c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(S.PX, S.PY, S.PR * 0.7, S.PR * 0.85, 0, 0, TAU); c.clip('evenodd'); }

  /* ================= the per-transformation system: one act + pooled particles + a depth-sorted ent ================= */
  const POOL = [];
  /* particle kinds: 0 ember glint, 1 streak, 2 hot puff, 3 smoke puff, 4 flash (glow), 5 shard (dark red streak, gravity) */
  const ADD = [1, 1, 0, 0, 1, 1];
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
      drawUnder(c) { if (!S.on) return; petPos(S); const B = c.getTransform(); c.save(); for (const a of S.acts) if (a.under) a.under(c, B); drawParts(S, c, B, 1); c.restore(); },
      draw(c) { if (!S.on) return; petPos(S); const B = c.getTransform(); c.save(); for (const a of S.acts) if (a.over) a.over(c, B); drawParts(S, c, B, 0); c.restore(); },
      onEnd() { if (S.on) kill(); } });
    return S;
  }
  function ent(S, y, fn) { const e = S.H.add({ key: 'nidhogg-ultima-ent', life: 1e9, entY: y, update(dt, f) { if (!S.on) f.life = 0; }, drawEnt(c) { if (!S.on) return; const B = c.getTransform(); c.save(); try { fn(c, B, e); } catch (er) {} c.restore(); } }); S.ents.push(e); return e; }
  function anchorW(ctx, name) { try { const p = ctx.anchor && ctx.anchor(name); if (p && isFinite(p.x)) return p; } catch (e) {} const d = ctx.dragon || {}, a = d.heading || 0, f = { mouth: 2.2, head: 2.0, chest: 0.8, belly: 0.2, ring: -0.2, seat: 0.3 }[name] || 0, z = { mouth: -0.3, head: 0.1, belly: -0.5, ring: 1.0, seat: 0.5 }[name] || 0; return { x: (d.x || 0) + Math.cos(a) * f, y: (d.y || 0) + Math.sin(a) * f * 0.72, z: (d.z || 0) + z }; }
  function petPos(S) { const H = S.H, ctx = S.ctx, T = S.T; S.PR = T * 0.95; let s = null; if (ctx.dragon && !ctx.dragon.gone && S.seatOK !== false) s = anchorW(ctx, 'seat');
    if (s) { S.PX = H.sx(s.x); S.PY = H.sy(s.y) - ((s.z || 0) + 0.35) * S.ZT; } else { S.PX = H.sx(H.me.x); S.PY = H.sy(H.me.y) - 0.45 * T; } }
  const petK = (S, X, Y, lo) => { const d = Math.hypot(X - S.PX, (Y - S.PY) * 1.15) / S.PR; return d >= 1.4 ? 1 : lo + (1 - lo) * sm((d - 0.35) / 1.05); };
  function part(S, kind, x, y, z, vx, vy, vz, life, size, o) { if (!S || S.parts.length > (LOW() ? 260 : 600)) return null; const p = POOL.pop() || {};
    p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.t = 0; p.size = size; p.g = 0; p.drag = 0; p.rot = 0; p.vr = 0; p.grow = 0; p.a = 1; p.u = 0; p.v = 0; p.fin = 0.08; p.flat = 0;
    if (o) for (const k in o) p[k] = o[k]; S.parts.push(p); return p; }
  function partImg(p) { switch (p.kind) { case 0: return sprGlint(); case 1: case 5: return sprStreak(); case 2: return sprPuff('hot', p.v); case 3: return sprPuff('smoke', p.v); default: return glowSprite(C.yel); } }
  function drawParts(S, c, B, under) { const H = S.H, T = S.T, P = S.parts; if (!P.length) return;
    for (let pass = 0; pass < 2; pass++) { c.globalCompositeOperation = pass ? 'lighter' : 'source-over';
      for (let i = 0; i < P.length; i++) { const p = P[i]; if (ADD[p.kind] !== pass || (p.u ? 1 : 0) !== under) continue;
        const u = p.t / p.life, a = p.a * Math.min(1, p.t / p.fin) * (p.kind === 2 || p.kind === 3 ? (1 - u) * (1 - u) : 1 - u * u); if (a < 0.015) continue;
        const X = H.sx(p.x), Y = H.sy(p.y) - p.z * S.ZT, s = p.size * T * (1 + p.grow * u), img = partImg(p), k = under ? 1 : petK(S, X, Y, pass ? 0.1 : 0.25); if (a * k < 0.015) continue;
        c.globalAlpha = a * k > 1 ? 1 : a * k;
        if (p.kind === 1 || p.kind === 5) { const ang = Math.atan2(p.vy * 0.72 - p.vz * 0.7, p.vx); setT(c, B, X, Y, ang); c.drawImage(img, -s, -s * 0.11, s, s * 0.22); }
        else { setT(c, B, X, Y, p.rot, p.flat ? 0.55 : 1); c.drawImage(img, -s / 2, -s / 2, s, s); } } }
    c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }

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
    const waves = [], ticks = [];
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
        if (blast) blast.t += dt;
        for (let i = waves.length - 1; i >= 0; i--) { waves[i].t += dt; if (waves[i].t > 0.7) waves.splice(i, 1); }
        if (ph === 'blast' && t >= TS && !S.ret) { S.ret = true; let rp = null; try { rp = ctx.safeReturn ? ctx.safeReturn() : null; } catch (e) {} ctx.returnPoint = rp; }   /* (the validated landing, asked as it settles) */
        if (ph === 'blast' && t >= TD && !finished) { finished = true; S.keep = true; S.seatOK = false; cam(ctx, null); done(); }
        if (finished && (!blast || blast.t > tu.cloudLife + 0.2)) act.dead = true; },
      under(c, B) { drawUnder(c, B); c.setTransform(B); },
      over(c, B) { drawCloud(c, B); c.setTransform(B); drawOver(c, B); c.setTransform(B); },
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
      if (Math.floor(u * 6) !== Math.floor((u - dt / tu.beam) * 6)) waves.push({ t: 0 }); }
    function tick(k) { let n = 0; try { n = ctx.hitArea(ix, iy, RB, DK * tu.tickDmg, { noCharge: true, kb: 0 }); } catch (e) {} ticks.push(t); pTick = t; if (n && k % 2 === 0) sfx(X, 'crack'); }
    function ringBreakFx(dt) { const rc = anchorW(ctx, 'ring'), q = LOW() ? 0.4 : 1; let k = 60 * dt * q + Math.random(); while (k-- >= 1) { const a = Math.random() * TAU, v = rnd(1.2, 2.6); part(S, 0, rc.x + Math.cos(a) * 1.3, rc.y + Math.sin(a) * 0.95, rc.z + rnd(-0.2, 0.2), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(-0.5, 1.2), rnd(0.6, 1.0), rnd(0.2, 0.32), { drag: 1.2, g: 0.8 }); } }
    /* the explosion: one hit per monster inside the dome's radius */
    function explode() { let n = 0; try { n = ctx.hitArea(ix, iy, RX, DK * tu.blast, { noCharge: true, kb: tu.blastKb }); } catch (e) {}
      blast = { t: 0, n, rot: Math.random() * TAU, v: (Math.random() * 2) | 0, puffs: [] };
      for (let i = 0; i < 9; i++) blast.puffs.push({ a: i / 9 * TAU + rnd(-0.2, 0.2), r: rnd(0.85, 1.05), s: rnd(0.85, 1.15), v: i % 3, ph: Math.random() * TAU });
      shake(ctx, X, 16, 0.6); X.flash && X.flash(RM() ? 0.1 : 0.22, '#FFE9C8'); X.hitstop && X.hitstop(n ? 0.1 : 0.04); X.light && X.light(ix, iy, RX * 1.6, 0.9);
      sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'note', 36, 2.2, 'sine', 0.95, 22); sfx(X, 'note', 72, 1.4, 'triangle', 0.35, 36); sfx(X, 'hiss', 2.0, 0.4, 500); sfx(X, 'stomp');
      cam(ctx, { zoom: tu.zoom * 0.95, x: ix, y: iy - 2.5, k: 0.8 });
      const L = LOW();
      for (let i = 0; i < (L ? 12 : 36); i++) { const a = Math.random() * TAU, v = rnd(6, 13); part(S, 1, ix + Math.cos(a) * 0.8, iy + Math.sin(a) * 0.6, rnd(0.3, 1.5), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(2, 9), rnd(0.5, 0.9), rnd(1.2, 2.2), { g: 6, drag: 1.4, fin: 0.02 }); }
      for (let i = 0; i < (L ? 10 : 30); i++) { const a = Math.random() * TAU, v = rnd(2, 8); part(S, 0, ix, iy, rnd(0.5, 3), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(2, 8), rnd(1.2, 2.2), rnd(0.25, 0.45), { g: 1.5, drag: 0.9 }); }
      for (let i = 0; i < (L ? 6 : 16); i++) { const a = Math.random() * TAU, v = rnd(4, 9); part(S, 5, ix, iy, 0.5, Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(5, 10), rnd(0.7, 1.1), rnd(0.6, 1.0), { g: 14, drag: 0.6 }); }
      // the ground surge: low rolling puffs racing out to the dome's edge
      for (let i = 0; i < (L ? 6 : 14); i++) { const a = i / 14 * TAU + rnd(-0.1, 0.1), v = RX * rnd(1.6, 2.1); part(S, i % 2 ? 3 : 2, ix + Math.cos(a) * 0.8, iy + Math.sin(a) * 0.6, 0.3, Math.cos(a) * v, Math.sin(a) * v * 0.72, 0.4, rnd(1.2, 1.6), rnd(1.4, 2.0), { grow: 0.8, a: i % 2 ? 0.55 : 0.7, drag: 2.2, v: i % 3, rot: Math.random() * TAU, vr: rnd(-1, 1) }); } }

    /* ---- drawing ---- */
    const scr = (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * S.ZT];
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
        put(c, B, glowSprite(C.org), X0, Y0, RX * 2.4 * T, RX * 2.4 * T, 0.5 * Math.max(0, 1 - u / 2.2), 0, GY, true);
        for (let k = 0; k < 3; k++) { const v = (u - k * 0.12) / (0.5 + 0.15 * k); if (v <= 0 || v >= 1) continue; const sz = 2 * RX * T * (1.11 - 0.06 * k) * eout(v); put(c, B, sprShock(), X0, Y0, sz, sz, (1 - v) * (k ? 0.6 : 1), 0, GY, true); }
        const ca = (u < 0.15 ? u / 0.15 : 1) * Math.max(0, 1 - Math.max(0, u - 0.8) / 1.8); if (ca > 0.01) { const s = 2 * RX * T * 1.05 * eout(u / 0.3); put(c, B, sprCrack(blast.v), X0, Y0, s, s, ca, blast.rot, GY, true); if (!LOW()) put(c, B, sprCrack(1 - blast.v), X0, Y0, s * 0.62, s * 0.62, ca * 0.8, blast.rot + 1.4, GY, true); } } }
    /* the beam over the actors (the pet cut out): from the mouth anchor to the impact every frame */
    function drawOver(c, B) { const T = S.T; if (!(ph === 'beam' || (blast && blast.t < 0.12))) return;
      const m = anchorW(ctx, 'mouth'), [ax0, ay0] = scr(m.x, m.y, m.z), [bx, by] = scr(ix, iy, 0.25), dx = bx - ax0, dy = by - ay0, Lb = Math.hypot(dx, dy); if (Lb < 4) return;
      const fade = blast ? Math.max(0, 1 - blast.t / 0.12) : sm((t - TC) / 0.06), ang = Math.atan2(dy, dx), w0 = T * 0.75, w1 = T * 1.5, pul = 1 + 0.06 * Math.sin(t * 47) + 0.04 * Math.sin(t * 29);
      c.save(); c.setTransform(B); petHole(c, S);
      // a broad heat bloom along it
      for (let i = 0; i <= 4; i++) { const u = i / 4; put(c, B, glowSprite(C.org), lerp(ax0, bx, u), lerp(ay0, by, u), T * lerp(1.8, 3.2, u), T * lerp(1.8, 3.2, u), 0.35 * fade, 0, 1, true); }
      // the body: the scrolling flame texture in a trapezoid (narrow at the mouth, wide at the ground), red edges
      setT(c, B, ax0, ay0, ang); c.beginPath(); c.moveTo(0, -w0 * 0.55 * pul); c.lineTo(Lb, -w1 * 0.6 * pul); c.lineTo(Lb, w1 * 0.6 * pul); c.lineTo(0, w0 * 0.55 * pul); c.closePath(); c.save(); c.clip();
      const tex = sprBeam(), o = ((t * 3.2) % 1) * 256, segW = Lb * (256 - o) / 256, H2 = w1 * 1.35 * pul;
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = fade; c.drawImage(tex, o, 0, 256 - o, 64, 0, -H2 / 2, segW, H2); if (o > 0.5) c.drawImage(tex, 0, 0, o, 64, segW, -H2 / 2, Lb - segW, H2);
      const o2 = ((t * 5.1 + 0.37) % 1) * 256, seg2 = Lb * (256 - o2) / 256, H3 = w1 * 0.85; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * fade; c.drawImage(tex, o2, 0, 256 - o2, 64, 0, -H3 / 2, seg2, H3); if (o2 > 0.5) c.drawImage(tex, 0, 0, o2, 64, seg2, -H3 / 2, Lb - seg2, H3);
      c.restore();
      // the white-yellow centre
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(Lb, 0); c.globalAlpha = 0.7 * fade; c.strokeStyle = C.yel; c.lineWidth = w0 * 0.55 * pul; c.stroke(); c.globalAlpha = fade; c.strokeStyle = C.wht; c.lineWidth = w0 * 0.22 * pul; c.stroke();
      // two molten streams spiralling round it (the far half dimmer)
      const NS = 26; for (let s = 0; s < 2; s++) { for (let half = 0; half < 2; half++) { c.beginPath(); let pen = false; for (let i = 0; i <= NS; i++) { const u = i / NS, x = u * Lb, ph2 = u * 14 - t * 22 + s * Math.PI, z = Math.cos(ph2), y = Math.sin(ph2) * lerp(w0, w1, u) * 0.62; if ((z >= 0) === !!half) { pen ? c.lineTo(x, y) : c.moveTo(x, y); pen = true; } else pen = false; }
          c.globalAlpha = (half ? 0.9 : 0.35) * fade; c.strokeStyle = C.amb; c.lineWidth = T * (half ? 0.12 : 0.08); c.stroke(); if (half) { c.globalAlpha = 0.9 * fade; c.strokeStyle = C.wht; c.lineWidth = T * 0.035; c.stroke(); } } }
      // the impact sphere swelling under the pressure, its glow; the mouth's flare
      const u = cl((t - TC) / tu.beam), rs = T * (0.55 + 1.15 * eout(u)) * pul;
      put(c, B, glowSprite(C.yel), bx, by, rs * 4, rs * 4, 0.6 * fade, 0, 1, true); put(c, B, sprBall(), bx, by - rs * 0.25, rs * 2.3, rs * 2.3, fade, t * 2.4, 1, false); put(c, B, sprBall(), bx, by - rs * 0.25, rs * 1.6, rs * 1.6, 0.6 * fade, -t * 3.1, 1, true); put(c, B, glowSprite('#FFFFFF'), bx, by - rs * 0.25, rs * 1.3, rs * 1.3, 0.8 * fade, 0, 1, true);
      put(c, B, glowSprite(C.yel), ax0, ay0, T * 1.6, T * 1.6, 0.8 * fade, 0, 1, true); put(c, B, glowSprite('#FFFFFF'), ax0, ay0, T * 0.7, T * 0.7, fade, 0, 1, true);
      c.restore(); }
    /* the dome, the column and the mushroom cloud (over everything but the pet: an explosion this size engulfs the scene,
       then thins and fades so the field reads again) */
    function drawCloud(c, B) { if (!blast) return; const u = blast.t, T = S.T, life = tu.cloudLife; if (u > life) return;
      const X0 = H.sx(ix), Y0 = H.sy(iy), fadeAll = 1 - sm((u - (life - 1.3)) / 1.3);
      c.save(); c.setTransform(B); petHole(c, S);
      // the white flash core (short; bounded)
      if (u < 0.3) put(c, B, glowSprite('#FFFFFF'), X0, Y0 - T * RX * 0.25, RX * 2.2 * T, RX * 2.2 * T, (1 - u / 0.3) * 0.75, 0, 1, true);
      // the fire dome: its base the dome's radius (the damage area), rising and thinning into the column
      const dr = RX * T * eout(u / 0.3), dA = (u < 0.6 ? 1 : 1 - sm((u - 0.6) / 0.9)) * fadeAll; if (dA > 0.01 && dr > 2) { const hh = dr * 0.82 * (1 + 0.25 * sm((u - 0.4) / 1.0)), lift = T * 1.2 * sm((u - 0.5) / 1.2);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.92 * dA; setT(c, B, X0, Y0 - lift, 0); c.drawImage(sprDome(), -dr * 1.032, -hh * 1.07, dr * 2.065, hh * 1.143);
        // rolling fire billows along its silhouette (cooling as the dome lifts), so it reads as a churning volume
        const NB = LOW() ? 6 : 11; for (let i = 0; i < NB; i++) { const th = Math.PI + (i + 0.5) / NB * Math.PI, ro = 0.92 + 0.06 * Math.sin(u * 4 + i * 2.1), bx2 = X0 + Math.cos(th) * dr * ro, by2 = Y0 - lift + Math.sin(th) * hh * ro, bs = dr * (0.34 + 0.06 * Math.sin(i * 1.7)) * (0.8 + 0.4 * eout(u / 0.5));
          drawPuff(c, B, bx2, by2, bs, u * (i % 2 ? 1.2 : -1.2) + i, i % 3, sm((u - 0.35) / 1.0) * 0.8, dA * 0.95); }
        put(c, B, glowSprite(C.yel), X0, Y0 - hh * 0.3 - lift, dr * 1.4, dr * 1.1, 0.45 * dA, 0, 1, true); }
      // the column and the cap: rolling puffs climbing; hot to smoke as they cool; the cap lit from within (underside glow)
      const rise = eout((u - 0.15) / 1.6), Hc = tu.columnH * rise, cool = sm((u - 0.9) / 1.6), puffA = sm((u - 0.15) / 0.3) * fadeAll * 0.92;
      if (puffA > 0.01 && Hc > 0.3) {
        const NSt = LOW() ? 5 : 8; for (let i = 0; i < NSt; i++) { const v = i / (NSt - 1), z = Hc * v * 0.88, w = RX * (0.24 - 0.08 * v) * (0.85 + 0.15 * Math.sin(u * 3 + i)), x = X0 + Math.sin(u * 2 + i * 1.7) * T * 0.15, y = Y0 - z * S.ZT, s = w * T * 2.1, rot = u * (i % 2 ? 0.8 : -0.8) + i;
          drawPuff(c, B, x, y, s, rot, i % 3, cool * (0.7 + 0.3 * v), puffA); }
        const capZ = Hc + RX * 0.22, cy = Y0 - capZ * S.ZT, cw = RX * T * (0.42 + 0.3 * rise), ch = cw * 0.38;
        put(c, B, glowSprite(C.org), X0, cy + ch * 0.5, cw * 2.4, cw * 1.4, 0.55 * puffA * (1 - cool * 0.6), 0, 1, true);
        // the toroidal cap: back puffs, the middle, then front puffs; each a little curled under
        const PF = blast.puffs, n = LOW() ? 6 : PF.length, order = []; for (let i = 0; i < n; i++) { const a = PF[i].a + u * 0.6; order.push([Math.sin(a), i, a]); } order.sort((p, q) => p[0] - q[0]);
        for (const [sn, i, a] of order) { if (sn >= 0) continue; const p = PF[i]; drawPuff(c, B, X0 + Math.cos(a) * cw * p.r, cy + sn * ch * p.r, cw * 0.7 * p.s, a + u, p.v, cool * 0.85, puffA); }
        drawPuff(c, B, X0, cy - ch * 0.35, cw * 1.05, u * 0.5, 1, cool * 0.75, puffA);
        for (const [sn, i, a] of order) { if (sn < 0) continue; const p = PF[i]; drawPuff(c, B, X0 + Math.cos(a) * cw * p.r, cy + sn * ch * p.r, cw * 0.7 * p.s, a + u, p.v, cool * 0.9, puffA); }
        // lit from within: the core of the cap and the column's stem glowing through
        put(c, B, glowSprite(C.yel), X0, cy, cw * 1.2, cw * 0.8, 0.45 * puffA * (1 - cool * 0.7), 0, 1, true); put(c, B, glowSprite(C.amb), X0, lerp(Y0, cy, 0.5), cw * 0.6, Math.abs(Y0 - cy) * 1.1 + 1, 0.35 * puffA * (1 - cool * 0.7), 0, 1, true); }
      c.restore(); }
    /* one rolling puff: the hot sprite crossfading to the smoke sprite as it cools (light from the fire underneath) */
    function drawPuff(c, B, x, y, s, rot, v, cool, a) { if (s < 2 || a < 0.01) return; if (cool < 0.98) put(c, B, sprPuff('hot', v), x, y, s, s, a * (1 - cool), rot, 1, false); if (cool > 0.02) put(c, B, sprPuff('smoke', v), x, y, s, s, a * cool, rot, 1, false); }
  }

  NM.ultima = ultima;
  NM.TUNE_U = TUNE;
  NM.warmU = warm;
  NM.__bk = () => baked;
  NM.__dbgU = { sprBeam, sprBall, sprDome, sprPuff, sprShock, sprEdge, sprCrack };
})();
