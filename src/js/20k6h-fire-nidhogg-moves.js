/* ---------- Fire's Nidhogg (11th Fire ult): the two Strongs (Fireballs, Flare) ----------
   The dragon, free flight, Dive Bomb, the Ultima meter, the HUD and the cooldowns live in 20k6g (U.nidhogg); Ultima is
   20k6i. This file adds NM.fireballs(ctx), NM.flare(ctx), NM.TUNE_S and NM.warmS to the NIDHOGG_MOVES contract
   (docs/FIRE-NIDHOGG-GAMEPLAY-BRIEF.md). Every hit goes through ctx.hit / ctx.hitArea. No timers: each move is an "act"
   stepped by one per-form fx that checks ctx.alive() every frame; when the form ends nothing more is launched and
   whatever is in the air burns out harmlessly.
   Fireballs (exactly 1/2/3): for each shot the throat swells and glows (pose.throat, glow), the jaw opens, the head
   snaps back with the release (headPitch, neckCurve, pitch recoil); shots follow 0.3 s apart. A fireball is a baked
   dimensional ball (white-yellow core, dense orange body, rolling red rim tongues; two turbulent frames turning against
   each other), shedding rolling flame puffs that cool into a tapered smoke trail, with a comet tail along its flight. It
   flies an aimed downward arc from the mouth to the aimed enemy (followed while it falls), the aim point, or a point
   ahead; it bursts on contact with a monster, a wall or the ground. One AoE event per fireball (ctx.hitArea, no
   separate direct hit): a dimensional fire burst (an expanding ball that cools, flame puffs thrown out and up, embers,
   smoke), a floor flash of light and a shock ring. The surface rule (ctx.surfaceAt, else ctx.groundAt): on 'floor' it
   bursts on the ground; on 'wall' it bursts against it (no floor light); over a 'gap' (water, pit, lava) it deals nothing
   and leaves no mark, dropping in with steam, sparks and a hiss; over 'void' (off the map) it falls on out of sight,
   fading, with no damage. A monster touched in the air above a gap still sets it off (an air burst, no floor light).
   Flare (exactly 10/20/30): the vents at the wing roots and back open (pose.vents, glow, heat), the wings kick with each
   fan (spread, pitch), and a ring of heat shimmer spreads out round the dragon. The lances leave in fans of five, each
   fan from alternate sides and turned round the dragon, 0.028 s apart within a fan and 0.13 s between fans, so each
   can be followed: out and up, then curving down on to the monsters (dealt round, nearest first) or aimed ground
   points round the aim. Each lance is a real projectile: a swept segment against every monster each frame, its first
   contact takes one hit (0.5 DK) and the lance is spent; one that reaches the floor bursts into sparks with no damage.
   A lance is a baked molten head (white core, yellow, orange) with a red-orange comet trail along its path.
   Sprites are baked once (lazily, or ahead through NM.warmS(budgetMs)); particles and projectiles are pooled. */
const NM = (self.NIDHOGG_MOVES = self.NIDHOGG_MOVES || {});
(() => {
  const TAU = Math.PI * 2;
  const WHT = '#FFF6D8', YEL = '#FFD866', AMB = '#FFA640', ORG = '#FF7A2E', RED = '#D2401A', DRED = '#7A1E0E', GOLD = '#FFC24A';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

  /* ---- the numbers (DK = base x K x (1 + 0.08 (evo - 1)); tiers 0/1/2 = evo 1-3 / 4-6 / 7) ---- */
  const TUNE = NM.TUNE_S = {
    /* the cooldowns (20k6g owns them; from the press of a complete activation, once per activation) */
    fireballCd: 2.0, flareCd: 4.0,
    /* Fireballs: one shot every `gap` s after a `wind` s draw-in; ctx.done() `tail` s after the last release
       (0.5 / 0.8 / 1.1 s after the press); flight `fly0 + flyPer x distance` s, an arc `arc` tiles high */
    fireball: { count: [1, 2, 3], dmg: 3.0, R: 1.8, kb: 2.2, wind: 0.2, gap: 0.3, tail: 0.3, fly0: 0.32, flyPer: 0.05, arc: 0.6, r: 0.55, range: 10, ahead: 4.5, spread: 3.2 },
    /* Flare: fans of `fan` lances; `gapIn` within a fan, `gapFan` between fans after `open` s of venting; ctx.done() `tail`
       s after the last launch (0.75 / 1.05 / 1.4 s); flight `fly0 + flyPer x distance` s; lance contact radius `hitR` */
    flare: { count: [10, 20, 30], dmg: 0.5, kb: 0.35, fan: 5, open: 0.22, gapIn: 0.028, gapFan: 0.13, tail: 0.25, fly0: 0.42, flyPer: 0.035, out: [2.4, 3.6], up: [1.4, 2.4], range: 8.5, hitR: 0.2, hitZ: 1.25, life: 2.2, scatter: 2.6 },
  };

  /* ================= baked sprites ================= */
  /* pixel sprites are painted a few rows at a time when baked ahead (NM.warmS): SLICE is the time left in this warm call;
     a sprite not finished returns null and carries on next call. Asked for while drawing (SLICE null), it finishes at once. */
  let SLICE = null; const JOBS = new Map();
  function imgSprite(key, w, h, fn) { const had = fxCache.get(key); if (had) return had;
    let J = JOBS.get(key); if (!J) { J = { im: new ImageData(w, h), y: 0 }; JOBS.set(key, J); } const d = J.im.data, t0 = performance.now();
    while (J.y < h) { const y = J.y++; for (let x = 0; x < w; x++) { const o = fn(x, y, w, h); if (!o) continue; const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255 * cl(o[3]); }
      if (SLICE != null && J.y < h && performance.now() - t0 > SLICE) return null; }
    JOBS.delete(key); return fxSprite(key, w, h, g => g.putImageData(J.im, 0, 0)); }
  const memo = (fn) => { const M = new Map(); return k => { let s = M.get(k); if (!s) { s = fn(k); if (s) M.set(k, s); } return s; }; };
  /* the fire ramp: 0 cold (dark red, thin) .. 1 white-hot */
  const RAMP = [[0, [122, 30, 14]], [0.25, [210, 64, 26]], [0.5, [255, 122, 46]], [0.7, [255, 166, 64]], [0.86, [255, 216, 102]], [1, [255, 248, 222]]];
  function ramp(k) { k = cl(k); for (let i = 1; i < RAMP.length; i++) if (k <= RAMP[i][0]) { const a = RAMP[i - 1], b = RAMP[i], u = (k - a[0]) / (b[0] - a[0]); return [Math.round(lerp(a[1][0], b[1][0], u)), Math.round(lerp(a[1][1], b[1][1], u)), Math.round(lerp(a[1][2], b[1][2], u))]; } return RAMP[RAMP.length - 1][1]; }
  /* smooth angular + radial noise for turbulent surfaces (seeded sums of sines) */
  function noiseFn(seed) { const W = []; for (let i = 0; i < 7; i++) W.push([1 + Math.floor(R1(seed + i) * 6), R1(seed + i * 3.1) * TAU, 0.5 + R1(seed + i * 5.7) * 4, R1(seed + i * 7.3) * TAU, 0.35 / (1 + i * 0.35)]);
    return (th, r) => { let v = 0; for (const w of W) v += w[4] * Math.sin(w[0] * th + w[1] + Math.sin(w[2] * r * TAU + w[3]) * 1.3); return v; }; }
  /* a fireball frame (96 x 96): a turbulent ball lit from the upper left; tongues of red flame round the rim */
  const sprBall = memo(i => { const N = noiseFn(11 + i * 23), N2 = noiseFn(97 + i * 7);
    return imgSprite('nm2ball' + i, 96, 96, (x, y, w) => { const dx = (x + 0.5 - 48) / 40, dy = (y + 0.5 - 48) / 40, r = Math.hypot(dx, dy); if (r > 1.2) return null; const th = Math.atan2(dy, dx);
      const n = N(th, r), edge = 0.8 + 0.16 * n + 0.08 * N2(th * 2, r * 2), a = sm((edge - r) / 0.16 + 0.35) ; if (a < 0.01) return null;
      const lit = cl(0.5 - 0.42 * (dx * 0.62 + dy * 0.78)), mott = 0.12 * N2(th + r * 3, r * 1.7), core = Math.exp(-(r * r) / 0.12);
      const k = cl(0.95 * core + (1 - r / edge) * 0.55 + lit * 0.32 + mott - 0.1); const c = ramp(k);
      return [c[0], c[1], c[2], a * (0.75 + 0.25 * cl(k * 2))]; }); });
  /* a flame puff (48 x 48) at a heat (0 hot .. 2 cooling to smoke-red) */
  const sprPuff = memo(h => { const N = noiseFn(301 + h * 17);
    return imgSprite('nm2pf' + h, 48, 48, (x, y, w) => { const dx = (x + 0.5 - 24) / 20, dy = (y + 0.5 - 24) / 20, r = Math.hypot(dx, dy); if (r > 1.2) return null; const th = Math.atan2(dy, dx), edge = 0.78 + 0.2 * N(th, r);
      const a = sm((edge - r) / 0.3) * (h === 2 ? 0.7 : 0.95); if (a < 0.01) return null; const lit = cl(0.5 - 0.4 * (dx * 0.6 + dy * 0.8)); const k = cl((1 - r / edge) * 0.7 + lit * 0.3 + 0.12 * N(th * 3, r * 2)) * [1, 0.72, 0.42][h]; const c = ramp(k);
      return [c[0], c[1], c[2], a]; }); });
  /* smoke (48 x 48): a soft warm-grey puff, feathered to nothing (in the air only: nothing dark is left on the floor) */
  const sprSmoke = memo(i => { const N = noiseFn(501 + i * 13);
    return imgSprite('nm2sm' + i, 48, 48, (x, y) => { const dx = (x + 0.5 - 24) / 22, dy = (y + 0.5 - 24) / 22, r = Math.hypot(dx, dy); if (r > 1) return null; const th = Math.atan2(dy, dx), v = 0.75 + 0.2 * N(th, r * 1.5);
      const a = sm((v - r) / 0.45) * 0.55; if (a < 0.01) return null; const lit = cl(0.55 - 0.45 * (dx * 0.6 + dy * 0.8)); return [Math.round(lerp(70, 132, lit)), Math.round(lerp(56, 110, lit)), Math.round(lerp(52, 98, lit)), a]; }); });
  /* steam (48 x 48): white, soft */
  const sprSteam = () => imgSprite('nm2stm', 48, 48, (x, y) => { const r = Math.hypot(x + 0.5 - 24, y + 0.5 - 24) / 24; if (r > 1) return null; const a = Math.pow(1 - sm(r), 1.6) * 0.75; return [236, 240, 244, a]; });
  /* a comet tail (additive): the head at the right edge, a yellow-white core in orange in red, tapering, fading */
  const sprTail = () => imgSprite('nm2tail', 128, 32, (x, y, w, h) => { const u = (x + 0.5) / w, hw = 0.12 + 0.88 * Math.pow(u, 0.7), v = (y + 0.5 - h / 2) / (h / 2), q = v / hw;
    if (q * q >= 1) return null; const across = (Math.exp(-q * q * 3.2) - Math.exp(-3.2)) / (1 - Math.exp(-3.2)), a = across * Math.pow(u, 1.5) * Math.min(1, (1 - u) / 0.05 + 0.4), k = cl(across * 1.1) * (0.2 + 0.8 * u), c = ramp(0.2 + 0.8 * k);
    return [c[0], c[1], c[2], a]; });
  /* a lance head (additive), nose to the right: a molten spindle, white core in yellow in orange in red */
  const sprLance = () => imgSprite('nm2lance', 64, 20, (x, y, w, h) => { const u = (x + 0.5) / w, v = (y + 0.5 - h / 2) / (h / 2), hw = Math.pow(Math.sin(Math.PI * Math.pow(u, 1.35)), 0.8) * (0.25 + 0.75 * u), q = hw > 0 ? v / hw : 9;
    if (q * q >= 1.6) return null; const body = Math.exp(-q * q * 2.4), a = body * Math.min(1, u * 3), c = ramp(0.35 + 0.65 * body * (0.4 + 0.6 * u)); return [c[0], c[1], c[2], a]; });
  /* an ember streak (additive): a bright head at the right, a fading tail */
  const sprStreak = () => imgSprite('nm2stk', 48, 8, (x, y, w, h) => { const u = (x + 0.5) / w, v = Math.abs(y + 0.5 - h / 2) / (h / 2), a = Math.pow(u, 1.6) * Math.exp(-v * v * 4) * (1 - v * v) * Math.min(1, (1 - u) / 0.08 + 0.3); if (a < 0.004) return null; const c = ramp(0.45 + 0.55 * Math.pow(u, 2) * (1 - v)); return [c[0], c[1], c[2], a]; });
  /* rings (radial, additive): 'shock' a fire shock ring (bright rim, soft haze in), 'heat' the heat wave (soft warm
     bands: a shimmer of light, never dark), 'mark' an aim reticle */
  const RAD = new Map();
  function radialSprite(key, w, prof) { const had = RAD.get(key); if (had) return had; const N = 512, LUT = []; for (let i = 0; i < N; i++) LUT.push(prof((i + 0.5) / N));
    const s = imgSprite(key, w, w, (x, y) => { const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - w / 2) / (w / 2); return d >= 1 ? null : LUT[Math.min(N - 1, (d * N) | 0)]; }); if (s) RAD.set(key, s); return s; }
  const sprRing = kind => radialSprite('nm2r' + kind, kind === 'mark' ? 96 : 128, d => {
    const edge = sm((1 - d) / 0.06);
    if (kind === 'heat') { const b = Math.exp(-Math.pow((d - 0.86) / 0.06, 2)) * 0.5 + Math.exp(-Math.pow((d - 0.7) / 0.04, 2)) * 0.22 + Math.exp(-Math.pow((d - 0.56) / 0.03, 2)) * 0.1; if (b < 0.004) return null; return [255, 170, 110, b * edge]; }
    if (kind === 'mark') { const b = Math.exp(-Math.pow((d - 0.86) / 0.05, 2)) + 0.5 * Math.exp(-Math.pow((d - 0.5) / 0.04, 2)) + 0.25 * (d < 0.2 ? 1 - d / 0.2 : 0); if (b < 0.004) return null; const c = ramp(0.55 + 0.4 * cl(b)); return [c[0], c[1], c[2], Math.min(1, b) * edge]; }
    const pk = Math.exp(-Math.pow((d - 0.88) / 0.04, 2)), hz = 0.42 * Math.exp(-Math.pow((d - 0.84) / 0.13, 2)), s = pk + hz; if (s < 0.004) return null; const c = ramp(0.45 + 0.5 * pk / s); return [c[0], c[1], c[2], Math.min(1, s) * edge]; });
  const BAKE = [() => sprBall(0), () => sprBall(1), () => sprBall(2), () => sprPuff(0), () => sprPuff(1), () => sprPuff(2), () => sprSmoke(0), () => sprSmoke(1), () => sprSmoke(2), sprSteam, sprTail, sprLance, sprStreak,
    () => sprRing('shock'), () => sprRing('heat'), () => sprRing('mark'), () => glowSprite(ORG), () => glowSprite(YEL), () => glowSprite(WHT), () => glowSprite(RED), () => glowSprite(AMB)];
  let baked = 0;
  function warmS(budgetMs) { const t0 = performance.now(), B = budgetMs == null ? 4 : budgetMs;
    while (baked < BAKE.length) { const left = B - (performance.now() - t0); if (left <= 0.2) break; SLICE = left; let r = 1; try { r = BAKE[baked](); } catch (e) {} SLICE = null; if (r === null) break; baked++; }
    return baked >= BAKE.length; }
  NM.warmS = warmS;

  /* ================= drawing helpers ================= */
  function setT(c, B, x, y, rot, kx, ky) { const cs = rot ? Math.cos(rot) : 1, sn = rot ? Math.sin(rot) : 0, a = kx == null ? 1 : kx, d = ky == null ? a : ky;
    c.setTransform((B.a * cs + B.c * sn) * a, (B.b * cs + B.d * sn) * a, (-B.a * sn + B.c * cs) * d, (-B.b * sn + B.d * cs) * d, B.a * x + B.c * y + B.e, B.b * x + B.d * y + B.f); }
  function put(c, B, img, x, y, w, h, a, rot, add) { if (!(a > 0.01) || !(w > 0.5)) return; c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, x, y, rot); c.drawImage(img, -w / 2, -h / 2, w, h); }

  /* ================= the per-form system: acts + pooled particles ================= */
  const POOL = [], FPOOL = [], LPOOL = [], DST = { hit: 0, wall: 0, floor: 0, life: 0 };   // (DST: how lances ended, for the tests)
  /* particle kinds: 0 flame puff (cools with age), 1 smoke, 2 ember streak, 3 white-yellow flash, 4 orange glow,
     5 floor shock ring, 6 floor light, 7 steam, 8 heat wave (floor) */
  const ADD = [0, 0, 1, 1, 1, 1, 1, 0, 1];
  function sysOf(ctx) {
    if (ctx._nm2 && ctx._nm2.on) return ctx._nm2;
    const H = ctx.H && ctx.H.add ? ctx.H : null; if (!H) return null;
    const S = { H, ctx, on: true, acts: [], parts: [], T: H.X.Tz(), ZT: H.X.Tz(), PX: 0, PY: -1e4, PR: 30, sndT: 0, t: 0, alive: true };
    ctx._nm2 = S;
    function kill() { for (const a of S.acts) if (a.abort) try { a.abort(); } catch (e) {} S.acts.length = 0; for (const p of S.parts) POOL.push(p); S.parts.length = 0; S.on = false; }
    S.fx = H.add({ key: 'nidhogg-strongs', life: 1e9,
      update(dt, f) {
        if (!S.on) { f.life = 0; return; }
        let alive = true; try { alive = !ctx.alive || ctx.alive(); } catch (e) { alive = false; }
        S.alive = alive; S.t += dt; S.sndT -= dt; S.T = H.X.Tz();
        if (!alive) for (const a of S.acts) a.dying = true;
        for (let i = S.acts.length - 1; i >= 0; i--) { const a = S.acts[i]; a.update(dt); if (a.dead) S.acts.splice(i, 1); }
        const P = S.parts; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); POOL.push(p); continue; }
          if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; } p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < p.floor) { p.z = p.floor; p.vz = 0; } p.rot += p.vr * dt; }
        if (!S.acts.length && !P.length) { S.on = false; f.life = 0; }
      },
      drawUnder(c) { if (!S.on) return; view(S); const B = c.getTransform(); c.save();
        if (gpuOn()) { const Q = NM.FGFX.begin(c, null); for (const a of S.acts) { if (a.gpuUnder) a.gpuUnder(Q); else if (a.under) a.under(c, B); } c.setTransform(B); gpuParts(S, Q, 1); NM.FGFX.flush(c); c.restore(); return; }   /* (the GPU layer; a move without a GPU picture keeps its 2D one) */
        for (const a of S.acts) if (a.under) a.under(c, B); drawParts(S, c, B, 1); c.setTransform(B); c.restore(); },
      draw(c) { if (!S.on) return; view(S); const B = c.getTransform(); c.save();
        if (gpuOn()) { S.f3d = f3dOn(); if (S.f3d) { const o = anchor(S.ctx, 'seat'), Q3 = NM.F3D.begin(c, S.H, S.ZT, o.x, o.y, [S.PX, S.PY, S.PR]); for (const a of S.acts) if (a.gpu3d) a.gpu3d(Q3); NM.F3D.flush(c); }   /* (v327: the volumes in true 3D first; the soft glows over them) */
          const Q = NM.FGFX.begin(c, [S.PX, S.PY, S.PR]); gpuParts(S, Q, 0); for (const a of S.acts) { if (a.gpuOver) a.gpuOver(Q); else if (a.over) a.over(c, B); } c.setTransform(B); NM.FGFX.flush(c); c.restore(); return; }
        drawParts(S, c, B, 0); for (const a of S.acts) if (a.over) a.over(c, B); c.setTransform(B); c.restore(); },
      onEnd() { if (S.on) kill(); } });
    return S;
  }
  function zk(ctx, T) { try { if (ctx.scr && T > 0) { const a = ctx.scr(0, 0, 0), b = ctx.scr(0, 0, 1), k = (a[1] - b[1]) / T; if (k > 0.2 && k < 2) return k; } } catch (e) {} return 0.695; }
  /* the rider's place on the screen: bright things dim over it, so the pet always reads */
  function view(S) { const H = S.H, ctx = S.ctx, T = S.T = H.X.Tz(); S.ZT = T * zk(ctx, T); S.PR = T * 0.9; S.GY = H.GY || 0.55;
    const s = anchor(ctx, 'seat'); S.PX = H.sx(s.x); S.PY = H.sy(s.y) - (s.z + 0.45) * S.ZT; }
  const petK = (S, X, Y, lo) => { const d = Math.hypot(X - S.PX, (Y - S.PY) * 1.1) / S.PR; return d >= 1.4 ? 1 : lo + (1 - lo) * sm((d - 0.3) / 1.1); };
  function part(S, kind, x, y, z, vx, vy, vz, life, size, o) { if (!S || S.parts.length > (LOW() ? 240 : 560)) return null; const p = POOL.pop() || {};
    p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.t = 0; p.size = size; p.g = 0; p.drag = 0; p.rot = 0; p.vr = 0; p.grow = 0; p.a = 1; p.u = 0; p.v = 0; p.fin = 0.05; p.floor = 0; p.h0 = 0;
    if (o) for (const k in o) p[k] = o[k]; S.parts.push(p); return p; }
  function partImg(p, u) { switch (p.kind) { case 0: return sprPuff(Math.min(2, p.h0 + Math.floor(u * 3))); case 1: return sprSmoke(p.v); case 2: return sprStreak(); case 3: return glowSprite(WHT); case 4: return glowSprite(ORG); case 5: return sprRing('shock'); case 6: return glowSprite(ORG); case 7: return sprSteam(); default: return sprRing('heat'); } }
  function drawParts(S, c, B, under) { const H = S.H, T = S.T, P = S.parts; if (!P.length) return;
    for (let pass = 0; pass < 2; pass++) { c.globalCompositeOperation = pass ? 'lighter' : 'source-over';
      for (let i = 0; i < P.length; i++) { const p = P[i]; if (ADD[p.kind] !== pass || (p.u ? 1 : 0) !== under) continue;
        const u = p.t / p.life, a = p.a * Math.min(1, p.t / p.fin) * (p.kind === 1 || p.kind === 7 || p.kind === 0 ? (1 - u) * (1 - u) * (p.kind === 0 ? 1 : 1) : 1 - u * u); if (a < 0.015) continue;
        const X = H.sx(p.x), Y = H.sy(p.y) - p.z * S.ZT, s = p.size * T * (1 + p.grow * u), img = partImg(p, u);
        const k = under ? 1 : petK(S, X, Y, pass ? 0.1 : 0.15), al = a * k; if (al < 0.015) continue;
        c.globalAlpha = al > 1 ? 1 : al;
        if (p.kind === 2) { const sx = p.vx * T, sy = p.vy * T - p.vz * S.ZT; setT(c, B, X, Y, Math.atan2(sy, sx)); const L = s * (0.6 + Math.min(1.4, Math.hypot(sx, sy) / (T * 5))); c.drawImage(img, -L, -s * 0.09, L, s * 0.18); }
        else if (p.u) { setT(c, B, X, Y, 0, 1, S.GY); c.drawImage(img, -s / 2, -s / 2, s, s); }
        else { setT(c, B, X, Y, p.rot); c.drawImage(img, -s / 2, -s / 2, s, s); } } }
    c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }

  /* the particles on the GPU layer: fire puffs as turbulent balls of fire cooling with age, smoke and steam as solid
     billowing volumes, embers as streaks with hot heads, floor rings and light as light-only marks */
  const gpuOn = () => { try { return !!(NM.FGFX && NM.FGFX.usable()); } catch (e) { return false; } };
  const f3dOn = () => { try { return !!(NM.F3D && NM.F3D.usable()); } catch (e) { return false; } };
  function gpuParts(S, Q, under) { const H = S.H, T = S.T, P = S.parts, GY = S.GY || 0.55;
    for (let i = 0; i < P.length; i++) { const p = P[i]; if ((p.u ? 1 : 0) !== under) continue;
      const u = p.t / p.life, a = p.a * Math.min(1, p.t / p.fin) * (p.kind === 1 || p.kind === 7 || p.kind === 0 ? (1 - u) * (1 - u) : 1 - u * u); if (a < 0.015) continue;
      const X = H.sx(p.x), Y = H.sy(p.y) - p.z * S.ZT, s = p.size * T * (1 + p.grow * u), sd = (p.rot || 0) * 0.3 + i * 0.13;
      switch (p.kind) {
        case 0: Q.billow(X, Y, s * 0.6, 0.78 - 0.6 * u, a * 0.85, sd); break;
        case 1: Q.smoke(X, Y, s * 0.55, a * 0.85, sd, '#3A302C', 0.4 * (1 - u)); break;
        case 2: { const sx = p.vx * T, sy = p.vy * T - p.vz * S.ZT, sp = Math.hypot(sx, sy) || 1, L = s * (0.6 + Math.min(1.4, sp / (T * 5))); Q.beam(X - sx / sp * L, Y - sy / sp * L, X, Y, s * 0.07, u < 0.4 ? YEL : AMB, a); Q.glow(X, Y, s * 0.18, WHT, a * 0.8); break; }
        case 3: Q.glow(X, Y, s * 0.6, WHT, a); Q.star(X, Y, s * 0.5, a * 0.6); break;
        case 4: Q.glow(X, Y, s * 0.6, ORG, a); break;
        case 5: Q.ring(X, Y, s * 0.5, AMB, a, s * 0.06, GY); Q.ground(X, Y, s * 0.4, 0.5 * (1 - u), a * 0.5, sd, GY, 0.4); break;
        case 6: Q.ground(X, Y, s * 0.62, 0.35 + 0.6 * (1 - u), a, sd, GY, 0.7); break;
        case 7: Q.smoke(X, Y, s * 0.55, a * 0.7, sd, '#D9D2CC', 0); break;
        default: Q.shimmer(X, Y, s * 0.5, a, GY); } } }

  /* ================= shared bits ================= */
  const sfx = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
  const once = ctx => { let d = false; return () => { if (d) return; d = true; try { ctx.done && ctx.done(); } catch (e) {} }; };
  /* an anchor from the core (NIDHOGG_MODEL.anchor through ctx), else a fair guess from the dragon's place and heading */
  const GUESS = { mouth: [2.6, 0, 3.0], seat: [-0.2, 0, 1.0], ventL: [-0.3, -0.7, 0.6], ventR: [-0.3, 0.7, 0.6], wingL: [0.1, -0.9, 0.9], wingR: [0.1, 0.9, 0.9], ring: [-0.4, 0, 1.6], belly: [0, 0, -0.3], chest: [0.8, 0, 0.3] };
  function anchor(ctx, name) { try { const p = ctx.anchor && ctx.anchor(name); if (p && isFinite(p.x) && isFinite(p.y)) return { x: p.x, y: p.y, z: p.z || 0 }; } catch (e) {}
    const d = ctx.dragon || { x: 0, y: 0, z: 0, heading: 0 }, q = GUESS[name] || [0, 0, 0.6], a = d.heading != null ? d.heading : (d.a || 0), ca = Math.cos(a), sa = Math.sin(a); return { x: d.x + ca * q[0] - sa * q[1], y: d.y + sa * q[0] + ca * q[1], z: (d.z || 0) + q[2] }; }
  const headingOf = d => (d && (d.heading != null ? d.heading : d.a)) || 0;
  function setup(ctx) { const S = sysOf(ctx); if (!S) return null; const H = S.H, C = ctx.C || {}, ev = Math.max(1, Math.min(7, Math.round(ctx.evo || C.evo || 1)));
    const base = C.base != null ? C.base : (H.X.ST ? H.X.ST().atk : 10), tier = ctx.tier != null ? ctx.tier : ev >= 7 ? 2 : ev >= 4 ? 1 : 0;
    return { S, H, X: H.X, d: ctx.dragon || {}, tier, DK: ctx.DK > 0 ? ctx.DK : base * (C.K || 1) * (1 + 0.08 * (ev - 1)) }; }
  function mons(ctx, H) { try { const L = ctx.mons && ctx.mons(); if (L) return L; } catch (e) {} return H.living(); }
  const gone = m => !m || m.dead || m.under || m.falling || m.fobj || !(m.hp > 0);
  const pose = d => d && (d.pose || (d.pose = {}));
  /* the model's own clip for the wings and body while a move owns the pose (20k6g runs no flight clip meanwhile) */
  function clip(ctx, name) { try { const M = ctx.model || (typeof NIDHOGG_MODEL !== 'undefined' ? NIDHOGG_MODEL : null); return M && M.CLIPS && M.CLIPS[name] || null; } catch (e) { return null; } }
  function surface(ctx, x, y) { try { if (ctx.surfaceAt) { const s = ctx.surfaceAt(x, y); if (s) return s; } } catch (e) {} return ground(ctx, x, y) ? 'floor' : 'gap'; }
  function ground(ctx, x, y) { try { if (ctx.groundAt) return !!ctx.groundAt(x, y); } catch (e) {} return true; }
  function aimPt(ctx) { try { const p = ctx.aimPoint && ctx.aimPoint(); if (p && isFinite(p.x)) return { x: p.x, y: p.y }; } catch (e) {} return null; }
  function tgt(ctx) { try { const p = ctx.target && ctx.target(); if (p && (p.m || isFinite(p.x))) return p; } catch (e) {} return null; }
  /* a solid wall at a floor point (a projectile low enough to meet it bursts there) */
  const wallAt = (X, x, y) => !!(X.blocked && X.blocked(x, y, 0.05, 1));
  /* a puff of fire, cooling as it rises (the burst and the fireball's rolling trail) */
  function puff(S, x, y, z, vx, vy, vz, life, size, h0) { return part(S, 0, x, y, z, vx, vy, vz, life, size, { h0: h0 || 0, drag: 2.2, g: -0.8, grow: 0.9, rot: Math.random() * TAU, vr: rnd(-2, 2), fin: 0.03 }); }

  /* ================= Fireballs ================= */
  function fireballs(ctx) {
    const E = setup(ctx), done = once(ctx); if (!E) { done(); return; }
    const { S, H, X, d, tier, DK } = E, tu = TUNE.fireball, N = tu.count[tier], dmg = DK * tu.dmg;
    const balls = []; let t = 0, fired = 0, sent = false; const CF = clip(ctx, 'fireball');
    // the aims: the targeted enemy, then the next ones near it (else the same, a little apart); else the aim point; else ahead
    const aims = (() => { const out = [], tg = tgt(ctx), L = mons(ctx, H).filter(m => !gone(m)), hx = d.x, hy = d.y, a = headingOf(d);
      // (order: the aimed enemy; else an aimed point (the target's, else the ground aim); else the nearest enemy in range; else ahead)
      let first = tg && tg.m && !gone(tg.m) ? tg.m : null; const ap0 = first ? null : tg && isFinite(tg.x) ? { x: tg.x, y: tg.y } : aimPt(ctx);
      if (!first && !ap0) { let bd = tu.range; for (const m of L) { const q = Math.hypot(m.x - hx, m.y - hy); if (q < bd) { bd = q; first = m; } } }
      if (first) { out.push({ m: first }); const near = L.filter(m => m !== first && Math.hypot(m.x - first.x, m.y - first.y) < tu.spread).sort((p, q) => Math.hypot(p.x - first.x, p.y - first.y) - Math.hypot(q.x - first.x, q.y - first.y));
        for (let i = 1; i < N; i++) out.push(near[i - 1] ? { m: near[i - 1] } : { m: first, off: [Math.cos(i * 2.4) * 0.5, Math.sin(i * 2.4) * 0.5] }); return out; }
      const ap = ap0 || { x: hx + Math.cos(a) * tu.ahead, y: hy + Math.sin(a) * tu.ahead };
      for (let i = 0; i < N; i++) { const b = a + Math.PI / 2, o = (i - (N - 1) / 2) * 1.3; out.push({ x: ap.x + Math.cos(b) * o, y: ap.y + Math.sin(b) * o }); } return out; })();
    const aimXY = (A) => A.m && !gone(A.m) ? [A.m.x + (A.off ? A.off[0] : 0), A.m.y + (A.off ? A.off[1] : 0), 0.45 + (A.m.z || 0)] : A.m ? [A.lx, A.ly, 0] : [A.x, A.y, 0];
    sfx(X, 'note', 92, 0.35, 'sawtooth', 0.08, 60);
    function release(i) { const A = aims[i], mo = anchor(ctx, 'mouth'), b = FPOOL.pop() || {}, p3 = aimXY(A); if (A.m) { A.lx = p3[0]; A.ly = p3[1]; }
      const dist = Math.hypot(p3[0] - mo.x, p3[1] - mo.y, p3[2] - mo.z); b.x0 = mo.x; b.y0 = mo.y; b.z0 = mo.z; b.x = mo.x; b.y = mo.y; b.z = mo.z; b.A = A; b.tx = p3[0]; b.ty = p3[1]; b.tz = p3[2];
      b.dur = tu.fly0 + dist * tu.flyPer; b.t = 0; b.ex = 0; b.i = i; b.vx = 0; b.vy = 0; b.vz = 0; b.sx = 0; b.sy = 0; b.sp = 0; b.lock = false; b.trT = 0; balls.push(b);
      const P = pose(d); if (P) { P.jaw = 1; P.throat = 0.6; P.headPitch = 0.15; P.neckCurve = 0.75; P.pitch = -0.28; P.core = 0.3; }
      part(S, 3, mo.x, mo.y, mo.z, 0, 0, 0, 0.14, 1.6, { fin: 0.01 }); part(S, 4, mo.x, mo.y, mo.z, 0, 0, 0, 0.3, 2.2, { fin: 0.01, a: 0.6 });
      for (let k = 0; k < (LOW() ? 3 : 7); k++) { const an = Math.random() * TAU; puff(S, mo.x, mo.y, mo.z, Math.cos(an) * rnd(1, 2.5), Math.sin(an) * rnd(1, 2.5), rnd(-0.5, 1.2), rnd(0.25, 0.4), rnd(0.3, 0.5), 0); }
      X.shake && X.shake(RM() ? 1 : 2.5, 0.1); sfx(X, 'whoosh'); sfx(X, 'note', 140, 0.3, 'sawtooth', 0.12, 55); sfx(X, 'hiss', 0.3, 0.12, 900); }
    function burst(b, x, y, z, onGround) { b.ex = 1; b.end = S.t; b.x = x; b.y = y; b.z = z;
      // one AoE explosion event (the fireball's only damage)
      let n = 0; if (S.alive && !b.dying) { try { n = ctx.hitArea(x, y, tu.R, dmg, { kb: tu.kb, src: 'strong', el: 'fire' }) || 0; } catch (e) {} }
      const big = !LOW(), z0 = Math.max(0, z);
      b.bz = z0; b.bg = onGround;
      for (let k = 0; k < (big ? 12 : 6); k++) { const an = k / 12 * TAU + rnd(-0.2, 0.2), v = rnd(2.2, 4.2); puff(S, x, y, z0 + 0.2, Math.cos(an) * v, Math.sin(an) * v * 0.8, rnd(0.8, 2.6), rnd(0.5, 0.75), rnd(0.55, 0.85), 0); }
      for (let k = 0; k < (big ? 18 : 8); k++) { const an = Math.random() * TAU, v = rnd(3, 8); part(S, 2, x, y, z0 + 0.3, Math.cos(an) * v, Math.sin(an) * v * 0.8, rnd(2, 7), rnd(0.4, 0.8), rnd(0.35, 0.55), { g: 9, drag: 1.2 }); }
      for (let k = 0; k < (big ? 5 : 2); k++) part(S, 1, x + rnd(-0.6, 0.6), y + rnd(-0.4, 0.4), z0 + rnd(0.4, 1.0), rnd(-0.4, 0.4), rnd(-0.3, 0.3), rnd(0.6, 1.3), rnd(1.0, 1.5), rnd(1.0, 1.5), { v: k % 3, drag: 1, grow: 1.2, rot: Math.random() * TAU, vr: rnd(-0.6, 0.6), fin: 0.25, a: 0.85 });
      part(S, 3, x, y, z0 + 0.3, 0, 0, 0, 0.16, 3.4, { fin: 0.01 }); part(S, 4, x, y, z0 + 0.4, 0, 0, 0.6, 0.55, 4.4, { fin: 0.01, a: 0.75 });
      if (onGround) { part(S, 6, x, y, 0, 0, 0, 0, 0.6, tu.R * 3.4, { u: 1, fin: 0.01, a: 0.85 }); part(S, 5, x, y, 0, 0, 0, 0, 0.45, 0.6, { u: 1, grow: tu.R * 2.2 / 0.6 - 1, fin: 0.01 }); }
      X.light && X.light(x, y, tu.R * 2.2, 0.35);
      X.shake && X.shake(RM() ? 2 : 6, 0.22); X.hitstop && n && X.hitstop(0.04);
      sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'note', 72, 0.5, 'sine', 0.45, 34); sfx(X, 'hiss', 0.4, 0.14, 700, 0.05); }
    function sink(b, vd) { b.ex = 2; b.end = S.t; const x = b.x, y = b.y;
      // off the map (void): it falls on out of sight, fading, with a few sparks; no damage, no sound but a faint whoosh
      if (vd) { b.ex = 3; for (let k = 0; k < 3; k++) part(S, 2, x, y, 0, rnd(-1, 1), rnd(-1, 1), rnd(-2, 0), 0.4, 0.3, { g: 6, floor: -9 }); sfx(X, 'whoosh'); return; }
      // over water, pits or lava (gap): no ground blast, no damage; it drops in with steam, sparks and a hiss
      for (let k = 0; k < (LOW() ? 3 : 7); k++) part(S, 7, x + rnd(-0.4, 0.4), y + rnd(-0.3, 0.3), rnd(0, 0.3), rnd(-0.6, 0.6), rnd(-0.4, 0.4), rnd(0.8, 1.8), rnd(0.8, 1.2), rnd(0.7, 1.1), { drag: 1.5, grow: 1.4, rot: Math.random() * TAU, fin: 0.06, a: 0.75 });
      for (let k = 0; k < (LOW() ? 3 : 6); k++) { const an = Math.random() * TAU; part(S, 2, x, y, 0.1, Math.cos(an) * 3, Math.sin(an) * 2.4, rnd(2, 4), 0.4, 0.35, { g: 9, drag: 1.2 }); }
      part(S, 4, x, y, 0.2, 0, 0, 0, 0.3, 1.8, { fin: 0.01, a: 0.5 }); sfx(X, 'hiss', 0.6, 0.18, 2400); sfx(X, 'splash'); }
    const act = { update(dt) { t += dt; const P = pose(d);
        // the throat and jaw: per shot a draw-in with the throat swelling and glowing, the release, the jaw easing shut
        const tEnd = tu.wind + (N - 1) * tu.gap;
        if (!act.dying && !sent && P && CF && isFinite(P.flap)) try { CF.run(P, t, dt, { n: 0 }); } catch (e) {}   // (wings, body; the throat and jaw are ours, below)
        if (!act.dying && !sent && P) { const k = t < tu.wind ? -1 : Math.min(N - 1, Math.floor((t - tu.wind) / tu.gap)), u = k < 0 ? t / tu.wind : (t - tu.wind - k * tu.gap) / tu.gap, nx = k + 1 < N && k >= 0 ? cl((u - 0.35) / 0.65) : 0;
          if (k < 0) { P.throat = sm(u); P.jaw = 0.25 * u; P.headPitch = 0.45 - 0.2 * u; P.neckCurve = 0.3 + 0.2 * u; P.glow = Math.max(P.glow || 0, 0.45 * u); P.core = 0.2 * u; P.pitch = -0.12; }
          else { const after = cl(u / 0.35); P.jaw = lerp(1, 0.35, sm(after)) + 0.5 * nx; P.throat = lerp(0.6, 0.15, sm(after)) + 0.85 * nx; P.headPitch = lerp(0.15, 0.45, sm(after)) - 0.15 * nx; P.neckCurve = lerp(0.75, 0.35, sm(after)) + 0.15 * nx; P.pitch = lerp(-0.28, -0.12, sm(after)); P.glow = 0.35 + 0.3 * nx; P.core = 0.25 * nx; } }
        if (!act.dying) while (fired < N && t >= tu.wind + fired * tu.gap) release(fired++);
        if (!sent && (act.dying || (fired >= N && t >= tEnd + tu.tail))) { sent = true; done(); }   // (20k6g relaxes the pose after done())
        if (!act.dying && P && !sent && Math.random() < (LOW() ? 0.3 : 0.7)) { const mo = anchor(ctx, 'mouth'); part(S, 2, mo.x, mo.y, mo.z, rnd(-1, 1), rnd(-1, 1), rnd(0.5, 2), 0.3, 0.25, { g: 3 }); }
        const L = balls.length ? mons(ctx, H) : null;
        for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i];
          if (b.ex) { if (S.t - b.end > 0.9) { balls[i] = balls[balls.length - 1]; balls.pop(); FPOOL.push(b); } continue; }
          if (act.dying) b.dying = true;
          b.t += dt; const u = cl(b.t / b.dur);
          // the aim: a monster is followed until the last third of the fall
          if (!b.lock) { const p3 = aimXY(b.A); if (b.A.m && !gone(b.A.m)) { b.tx = p3[0]; b.ty = p3[1]; b.tz = p3[2]; } if (u > 0.68) b.lock = true; }
          const x = lerp(b.x0, b.tx, u), y = lerp(b.y0, b.ty, u), z = lerp(b.z0, b.tz, u * u * 0.4 + u * 0.6) + tu.arc * 4 * u * (1 - u) * 0.6;
          b.vx = (x - b.x) / dt; b.vy = (y - b.y) / dt; b.vz = (z - b.z) / dt; const x0 = b.x, y0 = b.y; b.x = x; b.y = y; b.z = z;
          // contact: a monster (swept), a wall low enough to meet, the floor
          let hitM = null; if (!b.dying) for (const m of L) { if (gone(m)) continue; if (z > 1.1 + (m.z || 0) + tu.r) continue; const dx = x - x0, dy = y - y0, ll = dx * dx + dy * dy, s = ll > 1e-9 ? cl(((m.x - x0) * dx + (m.y - y0) * dy) / ll) : 1, qx = x0 + dx * s - m.x, qy = y0 + dy * s - m.y, rr = (m.r || 0.4) + tu.r; if (qx * qx + qy * qy < rr * rr) { hitM = m; break; } }
          if (hitM) { burst(b, x, y, z, ground(ctx, x, y) && z < 0.9); continue; }
          if (z < 1.4 && wallAt(X, x, y)) { burst(b, x0, y0, z, false); continue; }
          if (u >= 1 || z <= 0.02) { const sf = surface(ctx, x, y); if (sf === 'floor' || sf === 'wall') burst(b, x, y, sf === 'wall' ? 0.6 : 0, sf === 'floor'); else sink(b, sf === 'void'); continue; }
          // the rolling flame and the smoke trail
          b.trT -= dt; if (b.trT <= 0) { b.trT = LOW() ? 0.04 : 0.022; const sp = Math.hypot(b.vx, b.vy, b.vz) || 1;
            puff(S, x - b.vx / sp * 0.25 + rnd(-0.08, 0.08), y - b.vy / sp * 0.25 + rnd(-0.08, 0.08), z - b.vz / sp * 0.25, -b.vx * 0.12 + rnd(-0.3, 0.3), -b.vy * 0.12 + rnd(-0.3, 0.3), -b.vz * 0.12 + rnd(0, 0.4), rnd(0.34, 0.5), rnd(0.55, 0.8), 0);
            if (Math.random() < 0.4) part(S, 1, x - b.vx / sp * 0.5, y - b.vy / sp * 0.5, z - b.vz / sp * 0.5, rnd(-0.2, 0.2), rnd(-0.2, 0.2), rnd(0.2, 0.6), rnd(0.7, 1.0), rnd(0.55, 0.8), { v: (i + Math.floor(S.t * 30)) % 3, drag: 1.5, grow: 1.4, rot: Math.random() * TAU, vr: rnd(-1, 1), fin: 0.1, a: 0.7 }); } }
        if (sent && !balls.length && (fired >= N || act.dying)) act.dead = true; },
      under(c, B) { const T = S.T; // the aim reticles and the light a falling fireball throws on the floor ahead of it
        for (const b of balls) { if (b.ex) continue; const u = cl(b.t / b.dur), gx = H.sx(b.tx), gy = H.sy(b.ty); if (!ground(ctx, b.tx, b.ty)) continue;
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.65 * sm(u * 4) * (1 - 0.3 * u); setT(c, B, gx, gy, S.t * 1.5, 1, S.GY); const r = T * tu.R * 2 * (1.08 - 0.08 * u); c.drawImage(sprRing('mark'), -r / 2, -r / 2, r, r);
          const k = sm((u - 0.3) / 0.7); put(c, B, glowSprite(ORG), H.sx(b.x), H.sy(b.y), T * (1.5 + 2 * k), T * (1.5 + 2 * k) * S.GY, 0.5 * k, 0, true); }
        c.setTransform(B); },
      over(c, B) { const T = S.T, ZT = S.ZT;
        for (const b of balls) { if (b.ex !== 1) continue; const u = (S.t - b.end) / 0.75; if (u >= 1) continue; // the burst: a dimensional ball of fire that swells and cools
          const X0 = H.sx(b.x), Y0 = H.sy(b.y) - (b.bz + 0.5 * eout(u)) * ZT, r = T * tu.R * (0.35 + 0.75 * eout(u / 0.45)), a = 1 - sm((u - 0.25) / 0.75), k = petK(S, X0, Y0, 0.35);
          put(c, B, glowSprite(ORG), X0, Y0, r * 3.2, r * 3.2, 0.55 * a * k, 0, true);
          put(c, B, sprBall(b.i % 3), X0, Y0, r * 2.2, r * 2.2, a * k, S.t * 1.5 + b.i, false); put(c, B, sprPuff(u < 0.35 ? 0 : u < 0.6 ? 1 : 2), X0, Y0 - r * 0.2, r * 2.0, r * 2.0, a * 0.8 * k, -S.t * 2 + b.i, false);
          put(c, B, glowSprite(YEL), X0, Y0, r * 1.6, r * 1.6, (1 - sm(u / 0.4)) * 0.9 * k, 0, true); }
        for (const b of balls) { if (b.ex !== 3) continue; const u = (S.t - b.end) / 0.5; if (u >= 1) continue; const X0 = H.sx(b.x), Y0 = H.sy(b.y) + u * u * T * 2.2, R = T * tu.r * 2.5 * (1 - 0.6 * u); put(c, B, glowSprite(ORG), X0, Y0, R * 3, R * 3, 0.4 * (1 - u), 0, true); put(c, B, sprBall(b.i % 3), X0, Y0, R * 1.3, R * 1.3, 1 - u, S.t * 2, false); }
        for (const b of balls) { if (b.ex) continue; const X0 = H.sx(b.x), Y0 = H.sy(b.y) - b.z * ZT, k = petK(S, X0, Y0, 0.4), R = T * tu.r * 2.5, ia = Math.min(1, b.t / 0.06);
          const svx = b.vx * T, svy = b.vy * T - b.vz * ZT, ang = Math.atan2(svy, svx), sp = Math.hypot(svx, svy);
          put(c, B, glowSprite(ORG), X0, Y0, R * 3.4, R * 3.4, 0.5 * k * ia, 0, true);
          const L = Math.min(T * 4.2, sp * 0.24 + R); if (L > R) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.95 * k * ia; setT(c, B, X0, Y0, ang); c.drawImage(sprTail(), -L, -R * 0.62, L + R * 0.2, R * 1.24); }
          const f0 = Math.floor(S.t * 7 + b.i) % 3, f1 = (f0 + 1) % 3, fu = (S.t * 7 + b.i) % 1;
          put(c, B, sprBall(f0), X0, Y0, R * 1.35, R * 1.35, k * ia, S.t * 2.2 + b.i, false); put(c, B, sprBall(f1), X0, Y0, R * 1.32, R * 1.32, fu * k * ia, -S.t * 3.1 + b.i * 2, false);
          put(c, B, glowSprite(WHT), X0 - R * 0.08, Y0 - R * 0.1, R * 0.8, R * 0.8, 0.85 * k * ia, 0, true); }
        c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; },
      /* the GPU pictures: the same numbers, drawn as turbulent fire, smoke and light */
      gpuUnder(Q) { const T = S.T; for (const b of balls) { if (b.ex) continue; const u = cl(b.t / b.dur), gx = H.sx(b.tx), gy = H.sy(b.ty); if (!ground(ctx, b.tx, b.ty)) continue;
          const r = T * tu.R * (1.08 - 0.08 * u), k = sm((u - 0.3) / 0.7); Q.ring(gx, gy, r, AMB, 0.65 * sm(u * 4) * (1 - 0.3 * u), T * 0.12, S.GY); Q.ring(gx, gy, r * (1 - 0.6 * u), ORG, 0.4 * sm(u * 4), T * 0.08, S.GY); Q.ground(H.sx(b.x), H.sy(b.y), T * (1 + 1.6 * k), 0.6 * k, 0.6 * k, b.i, S.GY, 0.3); }
        for (const b of balls) { if (b.ex !== 1) continue; const u = (S.t - b.end) / 0.75; if (u >= 1 || b.bz > 0.6) continue; Q.ground(H.sx(b.x), H.sy(b.y), T * tu.R * (0.6 + 0.8 * eout(u / 0.3)), 1 - 0.8 * u, 1 - u, b.i + 3, S.GY, 1); } },   /* (the scorched, glowing ground under a burst) */
      gpuOver(Q) { const T = S.T, ZT = S.ZT;
        for (const b of balls) { if (b.ex !== 1) continue; const u = (S.t - b.end) / 0.75; if (u >= 1) continue; // the burst: a ball of fire that swells, rolls and cools, its smoke, its flash
          const X0 = H.sx(b.x), Y0 = H.sy(b.y) - (b.bz + 0.5 * eout(u)) * ZT, r = T * tu.R * (0.35 + 0.75 * eout(u / 0.45)), a = 1 - sm((u - 0.25) / 0.75);
          Q.smoke(X0, Y0 - r * 0.4 * u, r * (0.95 + 0.5 * u), 0.75 * sm((u - 0.08) / 0.35) * a, b.i * 1.7, '#3A2A24', 0.7 * (1 - u)); Q.glow(X0, Y0, r * 1.4, ORG, 0.2 * a);
          { Q.billow(X0, Y0, r * 1.05, 0.8 - 0.55 * u, a, b.i * 2.3); Q.fire(X0, Y0 - r * 0.25, r * 0.6, 0.8 - 0.5 * u, 0.55 * a, b.i * 2.3 + 5); }   /* (v329: the burst back to the GPU-painted version, the user's pick) */   /* (v327: drawn as a 3D volume instead) */
          if (u < 0.3) { Q.glow(X0, Y0, r * 0.55, WHT, (1 - u / 0.3) * 0.45); Q.ring(X0, Y0, r * (0.6 + 1.3 * eout(u / 0.3)), YEL, 0.5 * (1 - u / 0.3), r * 0.1, 1); } }
        for (const b of balls) { if (b.ex !== 3) continue; const u = (S.t - b.end) / 0.5; if (u >= 1) continue; const X0 = H.sx(b.x), Y0 = H.sy(b.y) + u * u * T * 2.2, R = T * tu.r * 2.5 * (1 - 0.6 * u); Q.glow(X0, Y0, R * 1.5, ORG, 0.4 * (1 - u)); Q.fire(X0, Y0, R * 0.7, 0.9 - 0.5 * u, 1 - u, b.i); }
        for (const b of balls) { if (b.ex) continue; const X0 = H.sx(b.x), Y0 = H.sy(b.y) - b.z * ZT, R = T * tu.r * 2.5, ia = Math.min(1, b.t / 0.06);   // in flight: a rolling ball of fire, a comet tail of flame behind it, a hot core
          const svx = b.vx * T, svy = b.vy * T - b.vz * ZT, sp = Math.hypot(svx, svy) || 1, L = Math.min(T * 4.2, sp * 0.24 + R);
          Q.glow(X0, Y0, R * 1.5, ORG, 0.35 * ia); if (L > R && !S.f3d) Q.firebeam(X0 - svx / sp * L * 0.8, Y0 - svy / sp * L * 0.8, X0, Y0, R * 0.42, 0.62, 0.85 * ia, b.i * 1.3, 6);
          if (!S.f3d) Q.fire(X0, Y0, R * 0.7, 0.88, ia, b.i * 3.1); Q.glow(X0 - R * 0.08, Y0 - R * 0.1, R * 0.28, WHT, 0.6 * ia); } },
      /* (v327) in true 3D: a churning fireball (a displaced sphere of fire round a hot body and a white core) under a comet
         tail curving back along its own arc; the burst a swelling 3D ball of fire cooling into smoke, a shock ring on the floor */
      gpu3d(Q3) { const K = Q3.K, PT = act._P3 || (act._P3 = []);
        for (const b of balls) { if (b.ex) continue; const u = cl(b.t / b.dur), ia = Math.min(1, b.t / 0.06), r = tu.r * 1.55;   /* (as big as the old ball: about 0.85 of a tile) */
          let n = 0; for (let i = 0; i < (Q3.low ? 7 : 11); i++) { const v = u - i * 0.06; if (v < 0) break; const q = PT[n] || (PT[n] = [0, 0, 0]); q[0] = lerp(b.x0, b.tx, v); q[1] = lerp(b.y0, b.ty, v); q[2] = lerp(b.z0, b.tz, v * v * 0.4 + v * 0.6) + tu.arc * 4 * v * (1 - v) * 0.6; n++; }
          if (n > 1) { Q3.tube(PT, n, w => r * 0.7 * (1 - 0.8 * w), K.body, '#FF7A2E', 0.75 * ia, { heat: 0.9, seed: b.i * 1.3, af: w => 1 - w }); Q3.tube(PT, n, w => r * 0.9 * (1 - 0.75 * w), K.fire, '#FF7A2E', ia, { heat: 1.05, seed: b.i * 1.3, scroll: 3, af: w => 1 - w * w }); }
          Q3.sphere(b.x, b.y, b.z, r * 0.82, K.body, '#FF7A2E', 0.9 * ia, { heat: 0.95, seed: b.i * 2.1, amp: 0.2 }); Q3.sphere(b.x, b.y, b.z, r, K.fire, '#FF7A2E', ia, { heat: 1.12, seed: b.i * 2.1, amp: 0.25, flow: 1.6 }); Q3.sphere(b.x, b.y, b.z, r * 0.42, K.core, '#FFF0C8', ia, { amp: 0 }); }
        for (const b of balls) { if (b.ex !== 1 || true) continue; const u = (S.t - b.end) / 0.75; if (u >= 1) continue; const z = b.bz + 0.5 * eout(u), r = tu.R * 1.05 * (0.35 + 0.75 * eout(u / 0.45)), a = 1 - sm((u - 0.25) / 0.75);   /* (the old burst's size: about 2 tiles across at its peak) */
          if (u > 0.15) Q3.sphere(b.x, b.y, z + r * 0.35 * u, r * (0.95 + 0.4 * u), K.smoke, '#3A2A24', 0.85 * sm((u - 0.15) / 0.35) * a, { seed: b.i * 1.7, amp: 0.3, warm: 0.7 * (1 - u), rise: u });
          Q3.sphere(b.x, b.y, z, r * 0.95, K.body, '#FF7A2E', Math.min(1, a * 1.15), { heat: 1.0 - 0.45 * u, seed: b.i * 2.3, amp: 0.3 }); Q3.sphere(b.x, b.y, z, r, K.fire, '#FF7A2E', a, { heat: 1.12 - 0.6 * u, seed: b.i * 2.3, amp: 0.32, flow: 1.4 }); if (u < 0.45) Q3.sphere(b.x, b.y, z, r * 0.45 * (1 - u), K.core, '#FFF0C8', (1 - u / 0.45), { amp: 0.1 });
          if (b.bz < 0.6) Q3.torus(b.x, b.y, 0.04, tu.R * (0.3 + 0.75 * eout(u / 0.6)), 0.06 + 0.06 * (1 - u), [0, 0, 1], 0, K.floor, '#FF7A2E', (1 - u) * 0.9, { heat: 0.9 - 0.4 * u }); } },
      abort() { for (const b of balls) FPOOL.push(b); balls.length = 0; } };
    S.acts.push(act);
  }

  /* ================= Flare ================= */
  function bez(P, u, o) { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; for (let k = 0; k < 3; k++) o[k] = a * P[0][k] + b * P[1][k] + c * P[2][k] + d * P[3][k]; return o; }
  function flare(ctx) {
    const E = setup(ctx), done = once(ctx); if (!E) { done(); return; }
    const { S, H, X, d, tier, DK } = E, tu = TUNE.flare, N = tu.count[tier], dmg = DK * tu.dmg, NF = Math.ceil(N / tu.fan);
    const ls = []; let t = 0, fired = 0, sent = false, waves = 0, kick = 0; const tmp = [0, 0, 0], CL = clip(ctx, 'flare');
    // the plan: monsters in range dealt round (nearest first), the rest aimed points scattered round the aim (on ground)
    const plan = (() => { const L = mons(ctx, H).filter(m => !gone(m) && Math.hypot(m.x - d.x, m.y - d.y) < tu.range + (m.r || 0.4)).sort((p, q) => Math.hypot(p.x - d.x, p.y - d.y) - Math.hypot(q.x - d.x, q.y - d.y));
      const out = []; if (L.length) { for (let i = 0; i < N; i++) out.push({ m: L[i % L.length] }); return out; }
      const a = headingOf(d), ap = aimPt(ctx) || { x: d.x + Math.cos(a) * 3.5, y: d.y + Math.sin(a) * 3.5 };
      for (let i = 0; i < N; i++) { const r = tu.scatter * Math.sqrt((i + 0.5) / N), th = i * 2.39996; let x = ap.x + Math.cos(th) * r, y = ap.y + Math.sin(th) * r; out.push({ x, y }); } return out; })();
    sfx(X, 'hiss', 0.5, 0.16, 1400); sfx(X, 'note', 110, 0.4, 'sawtooth', 0.07, 70); sfx(X, 'stomp');
    const SRC = ['ventL', 'ventR', 'wingL', 'wingR', 'ring'];
    function launch(i) { const f = Math.floor(i / tu.fan), j = i % tu.fan, side = f % 2 ? 1 : -1, src = SRC[j === 4 ? 4 : (j % 2 ? (side > 0 ? 1 : 0) : (side > 0 ? 3 : 2))], o = anchor(ctx, src), Pn = plan[i], l = LPOOL.pop() || { P: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], tr: [] };
      // the fan: five directions spread over ~150 deg round one side, each fan turned on round the dragon
      const a0 = headingOf(d), fa = a0 + side * (1.3 + 0.55 * f) + (j - 2) * 0.45 + rnd(-0.1, 0.1), out = lerp(tu.out[0], tu.out[1], R1(i * 1.7)), up = lerp(tu.up[0], tu.up[1], R1(i * 2.3 + 0.4));
      l.P[0][0] = o.x; l.P[0][1] = o.y; l.P[0][2] = o.z; l.P[1][0] = o.x + Math.cos(fa) * out; l.P[1][1] = o.y + Math.sin(fa) * out * 0.75; l.P[1][2] = o.z + up;
      l.m = Pn.m || null; l.gx = Pn.m ? Pn.m.x : Pn.x; l.gy = Pn.m ? Pn.m.y : Pn.y; l.fx = Math.cos(fa) * out * 0.12; l.fy = Math.sin(fa) * out * 0.1; aimL(l);   // (the last leg comes in from above, so a monster by a wall is not shielded by it. A, 2026-11-13: aimL was inside this comment, so a fresh lance timed its flight to the map's origin, not its mark, and ran out its life first: Flare dealt nothing far from (0, 0))
      const dist = Math.hypot(l.P[3][0] - o.x, l.P[3][1] - o.y); l.dur = tu.fly0 + dist * tu.flyPer + rnd(0, 0.08); l.t = 0; l.age = 0; l.ex = 0; l.i = i; l.x = o.x; l.y = o.y; l.z = o.z; l.vx = 0; l.vy = 0; l.vz = 0; l.tr.length = 0; l.trT = 0; l.free = 0; ls.push(l);
      part(S, 3, o.x, o.y, o.z, 0, 0, 0, 0.1, 0.9, { fin: 0.01 }); if (!LOW() || j % 2 === 0) { const an = fa + rnd(-0.4, 0.4); puff(S, o.x, o.y, o.z, Math.cos(an) * 2, Math.sin(an) * 1.6, rnd(0.5, 1.5), 0.3, 0.45, 0); }
      if (j === 0) { kick = 1; sfx(X, 'hiss', 0.16, 0.1, 2200 + f * 200); sfx(X, 'note', 180 + f * 20, 0.12, 'square', 0.04, 90); if (waves < 3 || f === NF - 1) { waves++; const c0 = anchor(ctx, 'seat'); part(S, 8, d.x, d.y, 0, 0, 0, 0, 0.6, 1.2, { u: 1, grow: 5, fin: 0.02, a: 0.7 }); part(S, 4, c0.x, c0.y, c0.z - 0.2, 0, 0, 0, 0.25, 2.6, { fin: 0.02, a: 0.35 }); } } }
    function aimL(l) { const z = l.m && !gone(l.m) ? 0.45 + (l.m.z || 0) : 0; if (l.m && !gone(l.m)) { l.gx = l.m.x; l.gy = l.m.y; } l.P[3][0] = l.gx; l.P[3][1] = l.gy; l.P[3][2] = z; l.P[2][0] = l.gx + l.fx; l.P[2][1] = l.gy + l.fy; l.P[2][2] = z + 1.9; }
    function pop(l, x, y, z, hit) { if (ctx.smashArea && z < 1.3) { try { ctx.smashArea(l.x, l.y, 0.6); } catch (e) {} }   /* (N1, round 4: a lance's strike smashes the scenery where it lands; 20k6g's VEH_SMASH, no damage, no charge) */ l.ex = 1; l.end = S.t; l.x = x; l.y = y; l.z = z; const big = !LOW();
      part(S, 3, x, y, z + 0.1, 0, 0, 0, 0.12, hit ? 1.2 : 0.7, { fin: 0.01 }); part(S, 4, x, y, z + 0.1, 0, 0, 0, 0.24, hit ? 1.6 : 1.0, { fin: 0.01, a: 0.6 });
      for (let k = 0; k < (big ? (hit ? 5 : 3) : 2); k++) { const an = Math.random() * TAU, v = rnd(2, 4.5); part(S, 2, x, y, z + 0.1, Math.cos(an) * v, Math.sin(an) * v * 0.8, rnd(1, 3.5), rnd(0.25, 0.45), 0.3, { g: 9, drag: 1.3 }); }
      if (hit && big) puff(S, x, y, z + 0.1, 0, 0, 0.8, 0.3, 0.45, 0);
      if (z < 0.6 && ground(ctx, x, y)) part(S, 6, x, y, 0, 0, 0, 0, 0.35, 1.3, { u: 1, fin: 0.01, a: 0.7 }); else if (z < 0.6) part(S, 7, x, y, 0.1, 0, 0, 0.8, 0.6, 0.6, { grow: 1, fin: 0.05, a: 0.6 });
      if (S.sndT <= 0) { S.sndT = 0.045; sfx(X, 'hiss', 0.07, hit ? 0.1 : 0.05, hit ? 1600 : 3200); if (hit) sfx(X, 'note', 150 + Math.random() * 60, 0.12, 'triangle', 0.08, 70); } }
    const act = { update(dt) { t += dt; const P = pose(d);
        const tEnd = tu.open + (NF - 1) * tu.gapFan + (tu.fan - 1) * tu.gapIn;
        kick *= Math.exp(-dt * 9);
        if (!act.dying && !sent && P) { if (CL && isFinite(P.flap)) try { CL.run(P, Math.min(t, 1.15), dt); } catch (e) {}   // (the model's flare clip, held open until our done)
          const op = sm(t / tu.open); P.vents = op; P.glow = Math.max(P.glow || 0, 0.5 * op); P.heat = 0.7 * op; P.spread = Math.min(1, (P.spread || 0) + 0.45 * kick); P.pitch = (P.pitch || 0) - 0.16 * kick; P.neckCurve = 0.4 + 0.15 * kick; }
        if (!act.dying) while (fired < N && t >= tu.open + Math.floor(fired / tu.fan) * tu.gapFan + (fired % tu.fan) * tu.gapIn) launch(fired++);
        if (!sent && (act.dying || (fired >= N && t >= tEnd + tu.tail))) { sent = true; done(); }
        if (!act.dying && !sent && t < tEnd && Math.random() < (LOW() ? 0.3 : 0.8)) { const o = anchor(ctx, SRC[Math.floor(Math.random() * 4)]); puff(S, o.x, o.y, o.z, rnd(-0.5, 0.5), rnd(-0.5, 0.5), rnd(0.6, 1.4), 0.25, 0.32, 0); }
        const L = ls.length ? mons(ctx, H) : null;
        for (let i = ls.length - 1; i >= 0; i--) { const l = ls[i];
          if (l.ex) { if (S.t - l.end > 0.3) { ls[i] = ls[ls.length - 1]; ls.pop(); LPOOL.push(l); } continue; }
          if (act.dying) l.dying = true;
          l.t += dt; l.age += dt; const x0 = l.x, y0 = l.y, z0 = l.z;
          if (!l.free) { if (l.m && gone(l.m)) { let best = null, bd = 3; for (const q of L) { if (gone(q)) continue; const dd = Math.hypot(q.x - l.gx, q.y - l.gy); if (dd < bd) { bd = dd; best = q; } } l.m = best; }
            if (l.t / l.dur < 0.85) aimL(l); const u = cl(l.t / l.dur); bez(l.P, u, tmp); l.x = tmp[0]; l.y = tmp[1]; l.z = tmp[2];
            if (u >= 1) { l.free = 1; l.vx = (l.x - x0) / dt; l.vy = (l.y - y0) / dt; l.vz = Math.min(-2, (l.z - z0) / dt); } }
          else { l.vz -= 12 * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.z += l.vz * dt; }
          if (!l.free && dt > 0) { l.vx = (l.x - x0) / dt; l.vy = (l.y - y0) / dt; l.vz = (l.z - z0) / dt; }
          // real collision: the swept segment against every monster at lance height; the first contact takes the one hit
          let hm = null, hs = 2; if (!l.dying && Math.min(l.z, z0) < tu.hitZ) { const dx = l.x - x0, dy = l.y - y0, ll = dx * dx + dy * dy;
            for (const m of L) { if (gone(m)) continue; const s = ll > 1e-9 ? cl(((m.x - x0) * dx + (m.y - y0) * dy) / ll) : 1, zz = lerp(z0, l.z, s); if (zz > tu.hitZ + (m.z || 0)) continue; const qx = x0 + dx * s - m.x, qy = y0 + dy * s - m.y, rr = (m.r || 0.4) + tu.hitR; if (qx * qx + qy * qy < rr * rr && s < hs) { hs = s; hm = m; } } }
          if (hm) { const hx = lerp(x0, l.x, hs), hy = lerp(y0, l.y, hs), hz = lerp(z0, l.z, hs); if (S.alive) { try { ctx.hit(hm, dmg, { kb: tu.kb, src: 'strong', el: 'fire' }); } catch (e) {} } pop(l, hx, hy, Math.max(0, hz), true); DST.hit++; continue; }
          if (l.z < 0.9 && wallAt(X, l.x, l.y)) { pop(l, x0, y0, Math.max(0, z0), false); DST.wall++; continue; }
          if (l.z <= 0 || l.age > tu.life) { pop(l, l.x, l.y, Math.max(0, l.z), false); DST[l.z <= 0 ? 'floor' : 'life']++; continue; }
          l.trT -= dt; if (l.trT <= 0 && l.age > 0.05) { l.trT = 0.024;   /* (the first few hundredths are not kept: the trail never starts on the rider beside the vents) */ const q = l.tr.length >= 12 ? l.tr.pop() : [0, 0, 0]; q[0] = l.x; q[1] = l.y; q[2] = l.z; l.tr.unshift(q); } }
        if (sent && !ls.length && (fired >= N || act.dying)) act.dead = true; },
      over(c, B) { const T = S.T, ZT = S.ZT; c.setTransform(B); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        // trails: a red haze under an orange body under a yellow core, tapering in two steps (cheap for thirty)
        const LAY = LOW() ? [[RED, 1.4, 0.35], [AMB, 0.5, 0.85]] : [[RED, 1.9, 0.28], [ORG, 0.95, 0.6], [YEL, 0.38, 0.95]], TW = T * 0.12;
        for (const l of ls) { const n = l.tr.length; if (n < 2) continue; const fo = l.ex ? cl(1 - (S.t - l.end) / 0.3) : 1; if (fo <= 0.01) continue; const hx = H.sx(l.x), hy = H.sy(l.y) - l.z * ZT, h = n >> 1, kq = j => petK(S, H.sx(l.tr[j][0]), H.sy(l.tr[j][1]) - l.tr[j][2] * ZT, 0.06), kc = [Math.min(petK(S, hx, hy, 0.06), kq(h)), Math.min(kq(h), kq(n - 1))];
          for (const [col, wk, al] of LAY) { c.strokeStyle = col;
            for (let ch = 0; ch < 2; ch++) { const i0 = ch ? h : 0, i1 = ch ? n - 1 : h; if (i1 <= i0 && ch) continue; c.globalAlpha = Math.min(1, al * fo * kc[ch] * (ch ? 0.5 : 1)); c.lineWidth = Math.max(0.5, TW * wk * (ch ? 0.5 : 1)); c.beginPath();
              if (ch === 0) c.moveTo(hx, hy); else c.moveTo(H.sx(l.tr[i0][0]), H.sy(l.tr[i0][1]) - l.tr[i0][2] * ZT); for (let j = i0 + (ch ? 1 : 0); j <= i1; j++) c.lineTo(H.sx(l.tr[j][0]), H.sy(l.tr[j][1]) - l.tr[j][2] * ZT); c.stroke(); } } }
        const lh = sprLance(), gl = glowSprite(ORG);
        for (const l of ls) { if (l.ex) continue; const X0 = H.sx(l.x), Y0 = H.sy(l.y) - l.z * ZT, k = petK(S, X0, Y0, 0.1), ang = Math.atan2(l.vy * T - l.vz * ZT, l.vx * T), ia = Math.min(1, l.age / 0.04);
          put(c, B, gl, X0, Y0, T * 1.1, T * 1.1, 0.5 * k * ia, 0, true); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * ia; setT(c, B, X0, Y0, ang); c.drawImage(lh, -T * 0.55, -T * 0.16, T * 0.8, T * 0.26); }
        c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; },
      /* the GPU pictures: each lance a molten head with a tapering trail of turbulent fire; the vents' heat shimmer */
      gpuOver(Q) { const T = S.T, ZT = S.ZT, PT = act._PT || (act._PT = []);
        for (const l of ls) { const n = l.tr.length; if (n < 1) continue; const fo = l.ex ? cl(1 - (S.t - l.end) / 0.3) : 1; if (fo <= 0.01) continue; let m = 0;
          const stp = LOW() ? 2 : 1; PT[m++] = [H.sx(l.x), H.sy(l.y) - l.z * ZT]; for (let j = 0; j < n; j += stp) PT[m++] = [H.sx(l.tr[j][0]), H.sy(l.tr[j][1]) - l.tr[j][2] * ZT];
          if (m > 1 && !S.f3d) { Q.trail(PT, m, T * 0.14, 0.85, 0.85 * fo, l.i * 0.7); const nb = Math.min(m - 1, LOW() ? 2 : 6); for (let j = 0; j < nb; j++) { const k = j / nb; Q.beam(PT[j][0], PT[j][1], PT[j + 1][0], PT[j + 1][1], T * 0.055 * (1 - k), j < 2 ? WHT : YEL, 0.85 * fo * (1 - k)); } } }   /* (a white-hot thread down the first of it keeps the lance sharp) */
        for (const l of ls) { if (l.ex) continue; const X0 = H.sx(l.x), Y0 = H.sy(l.y) - l.z * ZT, ia = Math.min(1, l.age / 0.04); Q.glow(X0, Y0, T * 0.55, ORG, 0.5 * ia); if (!S.f3d) Q.fire(X0, Y0, T * 0.2, 1.2, ia, l.i); Q.glow(X0, Y0, T * 0.12, WHT, ia); }
        if (!sent) { const op = sm(t / tu.open), c0 = anchor(ctx, 'seat'); Q.shimmer(H.sx(c0.x), H.sy(c0.y) - c0.z * ZT, T * 2.4 * (0.7 + 0.3 * op), 0.3 * op, 0.75); } },
      /* (v327) in true 3D: each lance a tapered shaft of fire along its own path, wrapped in two spiralling fire ribbons, a molten head */
      gpu3d(Q3) { const K = Q3.K, PT = act._P3 || (act._P3 = []), PS = act._PS || (act._PS = [[], []]), low = Q3.low;
        for (const l of ls) { const n0 = l.tr.length; if (n0 < 1) continue; const fo = l.ex ? cl(1 - (S.t - l.end) / 0.3) : 1; if (fo <= 0.01) continue; let n = 0;
          const put = (x, y, z) => { const q = PT[n] || (PT[n] = [0, 0, 0]); q[0] = x; q[1] = y; q[2] = z; n++; }; put(l.x, l.y, l.z); for (let j = 0; j < n0; j += low ? 2 : 1) put(l.tr[j][0], l.tr[j][1], l.tr[j][2]);
          if (n > 1) { Q3.tube(PT, n, w => 0.12 * (1 - 0.75 * w), K.body, '#FF7A2E', 0.8 * fo, { heat: 0.95, seed: l.i * 0.7, m: low ? 5 : 7, af: w => 1 - w }); Q3.tube(PT, n, w => 0.19 * (1 - 0.75 * w), K.fire, '#FF7A2E', fo, { heat: 1.15, seed: l.i * 0.7, scroll: 4, m: low ? 5 : 7, af: w => 1 - w * 0.8 }); Q3.tube(PT, Math.max(2, n >> 1), w => 0.05 * (1 - w), K.core, '#FFF0C8', fo, { m: 4 });
            if (!low) for (let s2 = 0; s2 < 2; s2++) { const P2 = PS[s2]; for (let j = 0; j < n; j++) { const q = PT[j], w = j / (n - 1), ph = S.t * 14 + j * 1.3 + s2 * Math.PI, rr = 0.24 * (1 - 0.5 * w), p = P2[j] || (P2[j] = [0, 0, 0]); p[0] = q[0] + Math.cos(ph) * rr * 0.7; p[1] = q[1] + Math.cos(ph) * rr * 0.7; p[2] = q[2] + Math.sin(ph) * rr; }
              Q3.tube(P2, n, w => 0.06 * (1 - 0.6 * w), K.fire, '#FFB060', fo, { heat: 1.05, seed: l.i + s2, m: 4, af: w => 1 - w }); } }
          if (!l.ex) { Q3.sphere(l.x, l.y, l.z, 0.24, K.fire, '#FF7A2E', 1, { heat: 1.2, seed: l.i, amp: 0.3, flow: 2 }); Q3.sphere(l.x, l.y, l.z, 0.11, K.core, '#FFF2C8', 1, { amp: 0 }); } } },
      abort() { for (const l of ls) LPOOL.push(l); ls.length = 0; } };
    S.acts.push(act);
  }

  NM.fireballs = fireballs;
  NM.flare = flare;
  NM.__dbgS = { ST: DST, TUNE, BAKE, sprBall, sprPuff, sprLance, anchor };
})();

/* ================= FIRE_GFX (NIDHOGG_MOVES.FGFX): Nidhogg's effects on the GPU =================
   One offscreen WebGL canvas (WebGL2, else WebGL1), twice the game canvas's width x `res`: the left half takes what is
   solid (smoke and steam, premultiplied, laid over), the right half takes light alone (alpha = its brightest channel,
   added). blit() lays the left half 'source-over' and the right 'lighter', so every output is valid premultiplied colour
   and adds the same in every browser. Two draw calls a pass (smoke, light), one shader; each quad's kind is drawn from
   maths and noise in the fragment shader:
     0 a feathered glow · 1 a ring sharp outside and fading inward · 2 a gaussian beam · 3 a ball of fire (turbulent fbm,
     a temperature ramp white -> yellow -> orange -> red -> nothing, rolling with time) · 4 a flame tongue (a licking
     teardrop of fire, scrolling up it) · 5 burning ground (patchy embers and glowing cracks, light only) · 6 a fire beam
     (scrolling turbulent flame along a strip, white-hot core, ragged edges) · 7 a sparkle · 8 a heat shimmer ring ·
     9 smoke (solid: billowing fbm density).
   The painter takes the 2D path's own screen coordinates (under the game's camera transform), so each move's GPU picture
   is drawn from the same numbers as its 2D one; the pet's face is protected by a soft hole in the shader where asked.
   Used on real-GPU WebGL; a software rasteriser or no WebGL keeps the 2D path. window.__NG_GL = 1 forces it, 0 forces
   2D; a lost context falls back to 2D (rebuilt when restored). Draw calls, quads and the light / smoke split are in stats. */
(() => {
  const NM = self.NIDHOGG_MOVES;
  let cv = null, gl = null, PR = null, PRW = null, bq = null, ok = null, soft = false, info = '', why = '', whyW = '';
  /* (v375) two programs: the main one without Wind's kinds (33..39), and the whole shader for Wind's quads. If a device cannot
     build the larger one, only Wind's quads go without (the wind kit then draws them in 2D) and everything else stays on the GPU */
  const FSM = () => FS.replace(/\/\*<W>\*\/[\s\S]*?\/\*<\/W>\*\//g, '');
  const stats = { draws: 0, quads: 0, smoke: 0, W: 0, H: 0, frames: 0, maxDraws: 0, maxQuads: 0, maxSmoke: 0 };
  const HDR = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  const VS = `attribute vec2 a_p, a_uv; attribute float a_k; attribute vec4 a_c; attribute vec3 a_q; uniform vec2 u_res; varying vec2 v_uv, v_px; varying float v_k; varying vec4 v_c; varying vec3 v_q;
void main(){ gl_Position = vec4(a_p.x / u_res.x * 2.0 - 1.0, 1.0 - a_p.y / u_res.y * 2.0, 0.0, 1.0); v_uv = a_uv; v_k = a_k; v_c = a_c; v_q = a_q; v_px = a_p; }`;
  const FS = HDR + `uniform float u_t, u_pass; uniform vec3 u_pet; varying vec2 v_uv, v_px; varying float v_k; varying vec4 v_c; varying vec3 v_q;
float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
vec3 ramp(float k){ k = clamp(k, 0.0, 1.2); vec3 c = mix(vec3(0.0), vec3(0.62, 0.1, 0.03), smoothstep(0.0, 0.25, k)); c = mix(c, vec3(0.95, 0.32, 0.09), smoothstep(0.2, 0.45, k)); c = mix(c, vec3(1.0, 0.6, 0.2), smoothstep(0.42, 0.65, k)); c = mix(c, vec3(1.0, 0.86, 0.42), smoothstep(0.62, 0.85, k)); return mix(c, vec3(1.0, 0.98, 0.9), smoothstep(0.85, 1.1, k)); }
float sq(float x){ return x * x; }
vec3 eramp(float k, vec3 c){ k = clamp(k, 0.0, 1.2); vec3 r = mix(vec3(0.0), c * 0.3, smoothstep(0.0, 0.22, k)); r = mix(r, c, smoothstep(0.18, 0.55, k)); r = mix(r, mix(c, vec3(1.0), 0.55), smoothstep(0.55, 0.85, k)); return mix(r, vec3(1.0), smoothstep(0.85, 1.1, k)); }   /* (v354) the fire ramp in any colour: dark, the colour, pale, white-hot */
float fth(float k){ float d = k - floor(k + 0.5); return d > 0.02 ? 0.2 + (d - 0.05) * 1.5 : 0.0; }   /* (v388 E) a beam's far-end feather (0: an inner link): how much of its length it thins and fades over */
float fte(float al, float fe){ return fe > 0.0 ? clamp((al - 1.0 + fe) / fe, 0.0, 1.0) : 0.0; }   /* (v388 E) 0..1 through that feather */
float ftk(float e){ float s = 1.0 - smoothstep(0.0, 1.0, e); return s * sqrt(s); }   /* (v388 E) the fade through it: no edge, a long soft tail */
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float fbm3(vec3 p){ return 0.5 * n3(p) + 0.27 * n3(p * 2.07 + 3.1) + 0.15 * n3(p * 4.13 + 7.7) + 0.08 * n3(p * 8.3 + 1.3); }
float caus(vec2 p, float t){ vec2 i = p; float c = 1.0; for (int n = 0; n < 4; n++) { float tt = t * (1.0 - 3.5 / float(n + 1)); i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x)); c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005))); } c /= 4.0; c = 1.17 - pow(c, 1.4); return clamp(pow(abs(c), 8.0), 0.0, 1.6); }   /* (v361) the web of light that water throws (after the classic tileable caustic) */
float hsd(vec2 p){ p.x = abs(p.x); if (p.y + p.x > 1.0) return length(p - vec2(0.25, 0.75)) - 0.35355; vec2 a = p - vec2(0.0, 1.0), b = p - vec2(0.5 * max(p.x + p.y, 0.0)); return sqrt(min(dot(a, a), dot(b, b))) * sign(p.x - p.y); }   /* (v402, Sunflare) a rounded love heart's signed distance: its point at the origin, its lobes' top at y 1.1, 1.2 wide */
vec2 hmap(vec2 u){ return vec2(u.x * 0.72, 0.53 - u.y * 0.68); }   /* (v402) a quad's uv to the heart's own space: the heart fills 84% of the quad */
float sd5(vec2 p, float r, float rf){ vec2 k1 = vec2(0.809017, -0.587785), k2 = vec2(-0.809017, -0.587785); p.x = abs(p.x); p -= 2.0 * max(dot(k1, p), 0.0) * k1; p -= 2.0 * max(dot(k2, p), 0.0) * k2; p.x = abs(p.x); p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0); float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r); return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y); }   /* (v404 LT) a five-pointed star's signed distance (a point up, r its points' reach, rf how deep its notches) */
float wprof(float a){ float u = mod(a, 1.2566371); u = min(u, 1.2566371 - u); float c = cos(u), s = sin(u); return 0.31153 / (c * 0.31153 + s * 0.57122) * (1.0 - 0.07 * exp(-u * u / 0.008)); }   /* (v404 LT, Wish Upon a Star) its star's polar profile (20k4h prof): 1 at a point (angle 0, 72 deg ...), 0.53 at a notch */
vec4 u4s(vec4 c, float r, float x0, float x1, vec4 c1){ return mix(c, c1, clamp((r - x0) / (x1 - x0), 0.0, 1.0)); }   /* (v391 U4) */
vec4 u4g(float p, float r){ vec4 c;   /* (v391 U4) Dead Scream's 2D sprites (20k5k) as exact gradients: 1 the scream band, 2 the wide wave, 3 the darkened air, 4 dark smoke, 5 pale smoke, 6 the mouth's hollow, 11 the light band; colour and alpha, not premultiplied */
  if (p < 1.5) { c = vec4(0.0941, 0.0431, 0.1804, 0.0); c = u4s(c, r, 0.5, 0.68, vec4(0.0549, 0.0275, 0.102, 0.32)); c = u4s(c, r, 0.68, 0.82, vec4(0.1686, 0.0431, 0.2706, 0.62)); c = u4s(c, r, 0.82, 0.9, vec4(0.4275, 0.1569, 0.6588, 0.7)); c = u4s(c, r, 0.9, 0.945, vec4(0.6471, 0.3608, 1.0, 0.8)); c = u4s(c, r, 0.945, 0.975, vec4(0.8157, 0.6824, 1.0, 0.35)); c = u4s(c, r, 0.975, 1.0, vec4(0.8157, 0.6824, 1.0, 0.0)); }
  else if (p < 2.5) { c = vec4(0.0941, 0.0431, 0.1804, 0.0); c = u4s(c, r, 0.42, 0.66, vec4(0.0706, 0.0353, 0.1333, 0.42)); c = u4s(c, r, 0.66, 0.84, vec4(0.1686, 0.0431, 0.2706, 0.62)); c = u4s(c, r, 0.84, 0.93, vec4(0.2745, 0.1569, 0.4314, 0.45)); c = u4s(c, r, 0.93, 1.0, vec4(0.2745, 0.1569, 0.4314, 0.0)); }
  else if (p < 3.5) { c = vec4(0.0314, 0.0196, 0.0588, 0.6); c = u4s(c, r, 0.0, 0.45, vec4(0.0549, 0.0314, 0.102, 0.34)); c = u4s(c, r, 0.45, 0.75, vec4(0.0941, 0.0431, 0.1804, 0.1)); c = u4s(c, r, 0.75, 1.0, vec4(0.0941, 0.0431, 0.1804, 0.0)); }
  else if (p < 4.5) { c = vec4(0.0549, 0.0275, 0.102, 0.7); c = u4s(c, r, 0.0, 0.45, vec4(0.1686, 0.0431, 0.2706, 0.38)); c = u4s(c, r, 0.45, 0.8, vec4(0.2745, 0.1882, 0.3216, 0.08)); c = u4s(c, r, 0.8, 1.0, vec4(0.2745, 0.1882, 0.3216, 0.0)); }
  else if (p < 5.5) { c = vec4(0.3843, 0.2745, 0.502, 0.42); c = u4s(c, r, 0.0, 0.45, vec4(0.2745, 0.1882, 0.3216, 0.24)); c = u4s(c, r, 0.45, 1.0, vec4(0.1686, 0.0431, 0.2706, 0.0)); }
  else if (p < 6.5) { c = vec4(0.0314, 0.0196, 0.0588, 0.96); c = u4s(c, r, 0.0, 0.6, vec4(0.0392, 0.0235, 0.0784, 0.88)); c = u4s(c, r, 0.6, 0.85, vec4(0.0941, 0.0431, 0.1804, 0.4)); c = u4s(c, r, 0.85, 1.0, vec4(0.0941, 0.0431, 0.1804, 0.0)); }
  else if (p < 11.5) { c = vec4(0.4275, 0.1569, 0.6588, 0.0); c = u4s(c, r, 0.66, 0.84, vec4(0.4275, 0.1569, 0.6588, 0.28)); c = u4s(c, r, 0.84, 0.93, vec4(0.6471, 0.3608, 1.0, 0.7)); c = u4s(c, r, 0.93, 0.965, vec4(0.8157, 0.6824, 1.0, 0.75)); c = u4s(c, r, 0.965, 1.0, vec4(0.8157, 0.6824, 1.0, 0.0)); }
  else c = vec4(0.0); return c; }
vec3 dcr(vec2 u, float span, float th){ float rr = length(u), an = atan(u.y, u.x), s = mod(-an + 0.04, 6.2831853) - 0.04, v = s / max(span, 0.05), tk = th * (1.0 - 0.6 * clamp(v, 0.0, 1.0));
  return vec3((0.8 - rr) / max(tk, 0.004), v, smoothstep(-0.035, 0.0, s) * step(v, 1.0)); }   /* (v404 DK) a crescent cut (kinds 54, 55): an arc of radius 0.8, its head at angle 0, its tail round toward -v: x across (0 the sharp outer edge .. 1 the inner), y along (0 head .. 1 tail), z inside */
vec2 uhP(float t){ float s = sin(t), c = cos(t), c2 = 2.0 * c * c - 1.0, c3 = c * (4.0 * c * c - 3.0), c4 = 2.0 * c2 * c2 - 1.0; return vec2(16.0 * s * s * s / 17.0, -(13.0 * c - 5.0 * c2 - 2.0 * c3 - c4) / 17.0 + 0.15); }   /* (v409 DK2, Umbra Heart) its 2D heart curve (lobes up, the point at y 1.15, the cleft at -0.144) */
vec3 uhd(vec2 p){ float sx = p.x < 0.0 ? -1.0 : 1.0; p.x = abs(p.x); vec2 a = uhP(0.0), bq = a, bn = vec2(0.0, -1.0); float best = 1e9;
  for (int i = 1; i <= 22; i++) { vec2 b = uhP(3.1415927 * float(i) / 22.0), e = b - a, w = p - a; vec2 q = a + e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0); float dd = dot(p - q, p - q); if (dd < best) { best = dd; bq = q; bn = normalize(vec2(e.y, -e.x)); } a = b; }
  float d = sqrt(best) * (dot(p - bq, bn) > 0.0 ? 1.0 : -1.0); return vec3(d, bn.x * sx, bn.y); }   /* (v409 DK2) that curve's signed distance (negative inside) and its outward normal */
vec3 sat5(float k, vec3 a, vec3 b, vec3 c, vec3 d, vec3 e){ k = clamp(k, 0.0, 1.0) * 4.0; return k < 1.0 ? mix(a, b, k) : k < 2.0 ? mix(b, c, k - 1.0) : k < 3.0 ? mix(c, d, k - 2.0) : mix(d, e, k - 3.0); }   /* (v412 SA) the satin's colour ramps, dark to lit (kind 64): its upper face and its underside per palette (0 Eternal Light, 1 rose, 2 pearl, 3 Heartache: the 2D strips' own ramps) */
vec3 satTop(float p, float k){ if (p < 0.5) return sat5(k, vec3(0.561, 0.176, 0.451), vec3(0.768, 0.261, 0.535), vec3(0.925, 0.353, 0.637), vec3(1.0, 0.565, 0.771), vec3(1.0, 0.941, 0.969)); if (p < 1.5) return sat5(k, vec3(0.851, 0.294, 0.569), vec3(0.934, 0.359, 0.645), vec3(1.0, 0.458, 0.725), vec3(1.0, 0.69, 0.824), vec3(1.0, 0.941, 0.969));
  if (p < 2.5) return sat5(k, vec3(0.898, 0.545, 0.745), vec3(0.949, 0.631, 0.79), vec3(1.0, 0.718, 0.835), vec3(1.0, 0.859, 0.918), vec3(1.0)); return sat5(k, vec3(0.788, 0.322, 0.624), vec3(0.954, 0.459, 0.783), vec3(1.0, 0.609, 0.863), vec3(1.0, 0.736, 0.904), vec3(1.0, 0.918, 0.969)); }
vec3 satBack(float p, float k){ if (p < 0.5) return sat5(k, vec3(0.29, 0.071, 0.22), vec3(0.459, 0.137, 0.364), vec3(0.618, 0.198, 0.464), vec3(0.761, 0.251, 0.498), vec3(0.906, 0.478, 0.71)); if (p > 1.5 && p < 2.5) return sat5(k, vec3(0.62, 0.282, 0.471), vec3(0.741, 0.408, 0.58), vec3(0.839, 0.541, 0.69), vec3(0.918, 0.69, 0.8), vec3(0.969, 0.847, 0.906)); if (p < 2.5) return sat5(k, vec3(0.431, 0.114, 0.294), vec3(0.486, 0.139, 0.331), vec3(0.541, 0.165, 0.369), vec3(0.71, 0.302, 0.525), vec3(0.878, 0.439, 0.682));
  return sat5(k, vec3(0.478, 0.133, 0.384), vec3(0.629, 0.189, 0.479), vec3(0.826, 0.229, 0.616), vec3(0.964, 0.314, 0.747), vec3(1.0, 0.604, 0.875)); }
vec4 lmO(vec4 A, vec3 c, float a){ a = clamp(a, 0.0, 1.0); return vec4(c * a + A.rgb * (1.0 - a), a + A.a * (1.0 - a)); }   /* (v412 LM) premultiplied 'over' */
vec2 lmIB(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d){ vec2 e = b - a, f = d - a, g = a - b + c - d, h = p - a; float k2 = g.x * f.y - g.y * f.x, k1 = e.x * f.y - e.y * f.x + h.x * g.y - h.y * g.x, k0 = h.x * e.y - h.y * e.x, v, s; vec2 dn;
  if (abs(k2) < 1e-4) { v = -k0 / (abs(k1) > 1e-6 ? k1 : 1e-6); dn = e + g * v; return vec2(abs(dn.x) > abs(dn.y) ? (h.x - f.x * v) / dn.x : (h.y - f.y * v) / dn.y, v); }
  float w = k1 * k1 - 4.0 * k0 * k2; if (w < 0.0) return vec2(-9.0); w = sqrt(w); v = (-k1 - w) / (2.0 * k2); dn = e + g * v; s = abs(dn.x) > abs(dn.y) ? (h.x - f.x * v) / dn.x : (h.y - f.y * v) / dn.y;
  if (s < -0.01 || s > 1.01 || v < -0.01 || v > 1.35) { v = (-k1 + w) / (2.0 * k2); dn = e + g * v; s = abs(dn.x) > abs(dn.y) ? (h.x - f.x * v) / dn.x : (h.y - f.y * v) / dn.y; } return vec2(s, v); }   /* (v412 LM) a point's place in a quad a b c d: s across a -> b, v down a -> d (inverse bilinear) */
float lmSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0)); }   /* (v412 LM) */
float lmAr(vec2 p, float hw, float hh){ p.x = abs(p.x); float cy = -hh + hw; if (p.y < cy) return length(p - vec2(0.0, cy)) - hw; float rb = 0.62 * hw; vec2 q = p - vec2(hw - rb, hh - rb); return (q.x > 0.0 && q.y > 0.0) ? length(q) - rb : max(p.x - hw, p.y - hh); }   /* (v412 LM, Love Mirrors) the mirror's outline (20k4l mPath: an arched top, straight sides, a rounded foot), signed distance in sprite px */
float lmFh(float f){ f = clamp(f, 0.0, 1.0); return 0.5 * smoothstep(0.0, 0.16, f) + 0.22 * sin(3.1416 * clamp((f - 0.16) / 0.44, 0.0, 1.0)) - 0.12 * exp(-sq((f - 0.65) / 0.06)) + 0.5 * sqrt(max(0.0, 1.0 - sq((f - 0.84) / 0.16))) * smoothstep(0.66, 0.72, f); }   /* (v412 LM) the mirror frame's moulding across it (0 at the face .. 1 its outer edge): a lip, a cove, the wire's groove, a round outer bead */
vec3 lmMt(vec3 n, vec3 Ld, vec3 Hv){ float df = max(dot(n, Ld), 0.0); return mix(vec3(0.42, 0.24, 0.27), vec3(0.96, 0.75, 0.78), df) + vec3(1.0, 0.94, 0.97) * (pow(max(dot(n, Hv), 0.0), 36.0) * 0.95 + sq(1.0 - n.z) * 0.15); }   /* (v412 LM) polished rose gold */
vec3 lmRt(vec3 n, float cy, float sy, float ct, float st){ n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy); return vec3(n.x, n.y * ct + n.z * st, -n.y * st + n.z * ct); }   /* (v412 LM) a normal turned by a yaw (cos, sin) then tilted down (cos, sin) */
/* (v415 EA) Earth's ults (20k2b/c/d/f/k), kinds 73..79. Solids are ray-cast (convex crystals and stones: the exact ray through the intersection of
   half-spaces n.p <= d, as the 2D bakes in 20k2e cast it) or ray-marched (Rocky's fists) per pixel in the EARTHC view: x right, y toward the viewer,
   z up; screen x = x, screen y = y GY - z (GY 0.55), so a pixel's ray is the world step (0, 1, GY). eaPl takes one face; eaSE gives the distance to
   the silhouette and to the nearest edge in px (for the soft edge and the bevels) */
float eaU1, eaU2, eaLo, eaMs, eaSil, eaEd, eaTh, eaSS, eaRR, eaMD, eaSD; vec4 eaN1, eaN2, eaNB; mat3 eaM; vec3 eaQ;
const vec3 eaLt = vec3(-0.5105, 0.4641, 0.7239), eaVw = vec3(0.0, 0.83662, 0.54778), eaHv = vec3(-0.2702, 0.6884, 0.6731);
void eaI(){ eaU1 = 1e9; eaU2 = 1e9; eaLo = -1e9; eaMs = 0.0; eaN1 = vec4(0.0, 1.0, 0.0, 0.0); eaN2 = eaN1; eaNB = vec4(0.0, -1.0, 0.0, 0.0); }
void eaPl(vec3 n, float d, vec2 s){ float a = n.y + n.z * 0.55, r = d - n.x * s.x + n.z * s.y;
  if (a > 1e-4) { float v = r / a; if (v < eaU1) { eaU2 = eaU1; eaN2 = eaN1; eaU1 = v; eaN1 = vec4(n, d); } else if (v < eaU2) { eaU2 = v; eaN2 = vec4(n, d); } }
  else if (a < -1e-4) { float v = r / a; if (v > eaLo) { eaLo = v; eaNB = vec4(n, d); } }
  else if (r < 0.0) eaMs = 1.0; }
vec2 eaG(vec3 n){ float a = n.y + n.z * 0.55; return vec2(-n.x, n.z) / (abs(a) > 1e-4 ? a : 1e-4); }
vec2 eaSE(float S){ return vec2(eaMs > 0.5 || eaLo < -1e8 ? -9.0 : (eaU1 - eaLo) / clamp(length(eaG(eaN1.xyz) - eaG(eaNB.xyz)), 1e-3, 6.0) * S, eaU2 > 1e8 ? 1e4 : (eaU2 - eaU1) / max(length(eaG(eaN2.xyz) - eaG(eaN1.xyz)), 1e-3) * S); }
mat3 eaFr(vec3 A, float sp){ vec3 X = normalize(cross(abs(A.z) < 0.95 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0), A)), Y = cross(A, X); float c = cos(sp), s = sin(sp); return mat3(c * X + s * Y, c * Y - s * X, A); }
vec3 eaLoc(mat3 M, vec3 p){ return vec3(dot(p, M[0]), dot(p, M[1]), dot(p, M[2])); }
/* a crystal's faces: six sides of radius rr jittered by sd; md 0 a spire (its root at the origin, a pyramid tip at z 1, tapering, cut by the floor),
   1 doubly terminated (z -0.5 .. 0.5), 2 a shard (a point at +0.5, broken off at -0.45) */
void eaCry(vec2 s, mat3 M, float sd, float rr, float md){
  vec2 to = (vec2(h1(vec2(sd, 1.3)), h1(vec2(sd, 2.9))) - 0.5) * rr * 0.5, tb = (vec2(h1(vec2(sd, 4.1)), h1(vec2(sd, 5.7))) - 0.5) * rr * 0.4;
  for (int i = 0; i < 6; i++) { float fi = float(i), a = fi * 1.0471976 + (h1(vec2(sd + fi * 2.3, 3.1)) - 0.5) * 0.35, ri = rr * (0.82 + 0.3 * h1(vec2(sd + fi * 5.1, 1.7))), kk = 0.8 + 0.4 * h1(vec2(sd + fi * 3.7, 8.3)); vec2 cs = vec2(cos(a), sin(a)); vec3 n;
    if (md < 0.5) { float rs = ri * 0.62; n = vec3(cs, (ri - rs) / 0.5); eaPl(M * normalize(n), ri / length(n), s); n = vec3(cs, rs / 0.5 * kk); eaPl(M * normalize(n), dot(n, vec3(to, 1.0)) / length(n), s); }
    else { eaPl(M * vec3(cs, 0.0), ri, s); n = vec3(cs, ri / 0.28 * kk); eaPl(M * normalize(n), dot(n, vec3(to, 0.5)) / length(n), s);
      if (md < 1.5) { n = vec3(cs, -ri / 0.28 * (1.8 - kk)); eaPl(M * normalize(n), dot(n, vec3(tb, -0.5)) / length(n), s); } } }
  if (md < 0.5) eaPl(vec3(0.0, 0.0, -1.0), 0.0, s);
  else if (md > 1.5) { vec3 n = normalize(vec3(h1(vec2(sd, 6.6)) - 0.5, h1(vec2(sd, 7.7)) - 0.5, -1.2)); eaPl(M * n, 0.45 * abs(n.z), s); } }
/* kinds 73 / 76 (a crystal's body / its light) share this: v_q.x md x 1000 + seed, v_q.y px per unit + its radius (fraction), v_q.z an angle + 7 x
   floor(100 x a second one): md 0 the lean's azimuth and the lean (the unit its height; the quad from 0.14 below the root to 1.14 above it),
   md 1 / 2 the axis's angle on screen and its roll (the unit its length; the quad 0.62 of it either way) */
void eaCSet(vec2 u){ eaMD = floor(v_q.x / 1000.0 + 0.0001); eaSD = v_q.x - eaMD * 1000.0; eaSS = floor(v_q.y); eaRR = max(v_q.y - eaSS, 0.02); float lq = floor(v_q.z / 7.0 + 0.0001), an = v_q.z - lq * 7.0, sk = 0.0; vec2 s; vec3 A; float sp;
  if (eaMD < 0.5) { sk = floor(lq / 200.0 + 0.0001); lq -= sk * 200.0; sk /= 40.0; float ln = lq / 100.0; s = vec2(u.x * 0.62, u.y * 0.66 - 0.48); A = vec3(sin(ln) * cos(an), sin(ln) * sin(an), cos(ln)); sp = eaSD * 2.39; }   /* (md 0: + 200 x floor(40 x its sink): its root that far under the floor, of its height) */
  else { s = u * 0.62; A = normalize(vec3(cos(an), eaMD > 1.5 ? (h1(vec2(eaSD, 9.1)) - 0.5) * 1.2 : 0.12, -sin(an))); sp = lq / 100.0; }
  eaM = eaFr(A, sp); eaI(); eaCry(s, eaM, eaSD, eaRR, eaMD); if (eaMD < 0.5) eaPl(vec3(0.0, 0.0, -1.0), -sk, s); vec2 se = eaSE(eaSS); eaSil = se.x; eaEd = se.y; eaTh = (eaU1 - eaLo) * 1.14127; eaQ = eaLoc(eaM, vec3(s.x, eaU1, eaU1 * 0.55 - s.y)); }
vec3 eaAm(float k, float p){ k = clamp(k, 0.0, 1.0) * 5.0; vec3 a = vec3(0.204, 0.086, 0.02), b = vec3(0.408, 0.196, 0.043), c = vec3(0.69, 0.376, 0.075), d = vec3(0.886, 0.573, 0.141), e = vec3(0.973, 0.753, 0.314), f = vec3(1.0, 0.902, 0.675);
  if (p > 0.5) { a = vec3(0.17, 0.035, 0.015); b = vec3(0.4, 0.09, 0.025); c = vec3(0.74, 0.24, 0.05); d = vec3(0.95, 0.46, 0.1); e = vec3(1.0, 0.69, 0.29); f = vec3(1.0, 0.9, 0.66); }   /* (1: ember crystal, redder) */
  return k < 1.0 ? mix(a, b, k) : k < 2.0 ? mix(b, c, k - 1.0) : k < 3.0 ? mix(c, d, k - 2.0) : k < 4.0 ? mix(d, e, k - 3.0) : mix(e, f, k - 4.0); }
/* rough stone at world normal n, object point q (about a unit across): grained albedo, soft-banded light, a warm bounce from below, a cool sky
   rim, a matte sheen; moss (0..1) on what faces up */
vec3 eaStone(vec3 n, vec3 q, float sd, float moss){ float ndl = max(dot(n, eaLt), 0.0), ndv = max(dot(n, eaVw), 0.0), t1 = n3(q * 3.0 + sd), t2 = n3(q * 11.0 + 3.0), t3 = n3(q * 27.0 + sd * 1.7);
  float alb = 0.8 + 0.34 * (t1 - 0.5) + 0.24 * (t2 - 0.5) + 0.16 * (t3 - 0.5) + (t3 > 0.78 ? 0.3 * (t3 - 0.78) / 0.22 : 0.0), b = clamp((0.3 * smoothstep(0.04, 0.18, ndl) + 0.35 * smoothstep(0.34, 0.48, ndl) + 0.35 * smoothstep(0.66, 0.78, ndl)) * 0.45 + 0.55 * ndl, 0.0, 1.0) * alb + 0.07;
  vec3 c = mix(vec3(0.05, 0.038, 0.028), vec3(0.21, 0.165, 0.12), smoothstep(0.0, 0.45, b)); c = mix(c, vec3(0.52, 0.42, 0.31), smoothstep(0.4, 1.05, b));
  float fr = pow(1.0 - ndv, 2.4); c += vec3(0.59, 0.34, 0.08) * fr * clamp(-n.z * 1.1 + 0.25, 0.0, 1.0) * 0.55 + vec3(0.16, 0.17, 0.2) * fr * clamp(n.z * 1.2 - 0.3, 0.0, 1.0) * 0.3 + vec3(0.9, 0.8, 0.67) * pow(max(dot(n, eaHv), 0.0), 22.0) * 0.2 * (0.4 + t2);
  float mo = moss * smoothstep(0.2, 0.65, n.z) * smoothstep(0.45, 0.6, n3(q * 3.5 + sd + 20.0) + 0.2 * (t3 - 0.5)); c = mix(c, mix(vec3(0.06, 0.09, 0.03), vec3(0.29, 0.4, 0.12), 0.3 + 0.7 * ndl) * (0.7 + 0.6 * t3), mo * 0.92);
  return c; }
/* a stone's faces (kind 74 md 0): nine broad ones round it and four chips, radius about 0.85 */
void eaRk(vec2 s, mat3 M, float sd){ for (int i = 0; i < 9; i++) { float fi = float(i), yy = 1.0 - (fi + 0.5) / 4.5, rr = sqrt(1.0 - yy * yy), th = fi * 2.39996 + h1(vec2(sd + fi, 1.0)) * 0.6;
    eaPl(M * normalize(vec3(cos(th) * rr + (h1(vec2(sd + fi * 3.1, 2.0)) - 0.5) * 0.3, yy + (h1(vec2(sd + fi * 4.3, 3.0)) - 0.5) * 0.3, sin(th) * rr + (h1(vec2(sd + fi * 5.9, 4.0)) - 0.5) * 0.3)), 0.8 + 0.1 * h1(vec2(sd + fi * 7.7, 5.0)), s); }
  for (int i = 0; i < 4; i++) { float fi = float(i); eaPl(M * normalize(vec3(h1(vec2(sd + fi, 6.0)), h1(vec2(sd + fi * 1.3, 7.0)), h1(vec2(sd + fi * 1.7, 8.0))) - 0.5), 0.86 + 0.08 * h1(vec2(sd + fi, 9.0)), s); } }
/* a slab's faces (kind 74 md 1): a block 1 x 0.62 x 0.2 (half sizes), its edges chamfered, a corner knocked off */
void eaSb(vec2 s, mat3 M, float sd){ vec3 e = vec3(1.0, 0.62, 0.2); for (int i = 0; i < 3; i++) { vec3 n = i == 0 ? vec3(1.0, 0.0, 0.0) : i == 1 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0); float d = dot(n, e); eaPl(M * n, d, s); eaPl(-(M * n), d, s); }
  for (int i = 0; i < 4; i++) { float fi = float(i), sx = mod(fi, 2.0) * 2.0 - 1.0, sy = floor(fi / 2.0) * 2.0 - 1.0; eaPl(M * normalize(vec3(sx, 0.0, 1.0)), (1.0 + 0.2) * 0.7071 - 0.06 - 0.04 * h1(vec2(sd, fi)), s); eaPl(M * normalize(vec3(0.0, sy, 1.0)), (0.62 + 0.2) * 0.7071 - 0.06 - 0.04 * h1(vec2(sd + 3.0, fi)), s); }
  eaPl(M * normalize(vec3(1.0, 1.0, 0.6) * vec3(sign(h1(vec2(sd, 4.4)) - 0.5), sign(h1(vec2(sd, 5.5)) - 0.5), 1.0)), 1.32, s); }
/* Rocky's fist (kind 75), ray-marched: ~18 stones on a hand (fist units: x toward the knuckles, y the pinky side, z the back of the hand; a right
   fist, 20k2k model()); each a block with rounded, chamfered corners; the nearest two distances and the nearest stone's group are kept (eaFk, eaFg)
   for the crevices between them */
vec2 eaFk; float eaFg;
void eaFu(float d, float g){ if (d < eaFk.x) { eaFk.y = eaFk.x; eaFk.x = d; eaFg = g; } else if (d < eaFk.y) eaFk.y = d; }
vec3 eaRy(vec3 p, float c, float s){ return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z); }   /* (a turn about y given as its cosine and sine: no trigonometry per step) */
vec3 eaRxyz(vec3 p, vec3 r){ float c = cos(r.z), s = sin(r.z); p = vec3(c * p.x + s * p.y, -s * p.x + c * p.y, p.z); c = cos(r.y); s = sin(r.y); p = vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z); c = cos(r.x); s = sin(r.x); return vec3(p.x, c * p.y + s * p.z, -s * p.y + c * p.z); }
float eaSt(vec3 p, vec3 e){ float r = min(e.x, min(e.y, e.z)) * 0.42; vec3 q = abs(p) - e + r; return max(length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r, (dot(abs(p) / e, vec3(1.0)) - 2.3) * 0.33 * min(e.x, min(e.y, e.z))); }
float eaFist(vec3 p, float tier, float bld, float kb){ eaFk = vec2(9.0); eaFg = 0.0; float g1 = (1.0 - smoothstep(0.0, 0.34, bld)) * 0.45, g2 = (1.0 - smoothstep(0.3, 0.68, bld)) * 0.45, g3 = (1.0 - smoothstep(0.62, 1.0, bld)) * 0.45, bg = kb - 1.0;
  eaFu(eaSt(p - vec3(-0.05, 0.0, -0.06), vec3(0.53, 0.6, 0.35)) + g1, 1.0);
  eaFu(eaSt(eaRy(p - vec3(-0.1, 0.02, 0.3), 0.995004, -0.0998334), vec3(0.5, 0.63, 0.13)) + g1, 2.0);
  if (tier > 1.5 || bg > 0.05) eaFu(eaSt(eaRy(p - vec3(0.16, 0.0, 0.41), 0.968912, -0.247404), vec3(0.11, 0.57, 0.08)) + g1, 2.0);
  if (tier > 2.5 || bg > 0.05) { eaFu(eaSt(eaRy(p - vec3(-0.34, 0.0, 0.43), 0.998201, -0.059964), vec3(0.22, 0.52, 0.09)) + g1, 2.0); eaFu(eaSt(p - vec3(-0.1, 0.6, 0.02), vec3(0.37, 0.08, 0.26)) + g3, 15.0); }
  if (bg > 0.05) eaFu(eaSt(eaRxyz(p - vec3(0.0, 0.05, 0.47 + 0.1 * bg), vec3(0.06, -0.12, 0.12)), vec3(0.33, 0.46, 0.09)) + (1.0 - smoothstep(0.0, 0.3, bg)) * 0.4, 15.0);
  for (int i = 0; i < 4; i++) { float fi = float(i), y = mix(-0.42, 0.41, fi / 3.0), w = fi > 2.5 ? 0.135 : abs(fi - 1.0) < 0.5 ? 0.155 : 0.15, x = abs(fi - 1.0) < 0.5 ? 0.03 : fi > 2.5 ? -0.06 : 0.0, z = abs(fi - 1.0) < 0.5 ? 0.02 : fi > 2.5 ? -0.04 : 0.0;
    eaFu(eaSt(eaRy(p - vec3(0.47 + x + 0.2 * bg, y, 0.19 + z + 0.1 * bg), 0.975897, 0.21823), vec3(0.275 * kb, w * 1.1 * (1.0 + 0.2 * bg), 0.253 * kb)) + g1, 3.0 + fi);
    eaFu(eaSt(eaRy(p - vec3(0.7 + x + 0.27 * bg, y, -0.19 + z), 0.980067, -0.198669), vec3(0.165, w * 1.03, 0.242)) + g2, 3.0 + fi); }
  eaFu(eaSt(eaRxyz(p - vec3(0.12, -0.6, -0.1), vec3(0.2, 0.1, 0.45)), vec3(0.33, 0.2, 0.23)) + g2, 7.0);
  eaFu(eaSt(eaRxyz(p - vec3(0.86 + 0.1 * bg, -0.27, -0.3), vec3(0.0, 0.05, 0.3)), vec3(0.154, 0.308, 0.165)) + g2, 7.0);
  eaFu(eaSt(p - vec3(-0.72, 0.0, -0.02), vec3(0.286, 0.418, 0.33)) + g3, 8.0);
  for (int k = 0; k < 4; k++) { float an = (k == 3 ? 4.0 : float(k)) * 1.2566371 + 0.5, ck = 1.0 + 0.12 * bg, ca = cos(an), sa = sin(an); vec3 pc = p - vec3(-0.93, ca * 0.44 * ck, sa * 0.418 * ck); eaFu(eaSt(vec3(pc.x, sa * pc.y - ca * pc.z, ca * pc.y + sa * pc.z), vec3(0.154, 0.275 * ck, 0.121)) + g3, 9.0 + float(k)); }
  return eaFk.x; }
/* the floor's patterns (floor units: x, y before the squash). The six-pointed fissure pattern of Crystal Coronation (radius 1; its two triangles from
   d0 0.15 / 0.2 of the trace on, the spokes from the start), traced to tr: the distance to the nearest drawn line, the nearest tracing head */
vec2 eaHex(vec2 p, float tr, float sd){ p += (vec2(n2(p * 6.0 + sd), n2(p * 6.0 + sd + 17.3)) - 0.5) * 0.075 + (vec2(n2(p * 21.0 - sd), n2(p * 21.0 + 5.1)) - 0.5) * 0.02; float best = 9.0, hd = 9.0;
  for (int i = 0; i < 6; i++) { float fi = float(i), d0 = 0.15 + 0.05 * mod(fi, 2.0), uu = clamp((tr - d0) / (1.0 - d0), 0.0, 1.0), as = (fi + 0.5) * 1.0471976, us = clamp(tr, 0.0, 1.0);
    vec2 A = vec2(cos(fi * 1.0471976), sin(fi * 1.0471976)), B = vec2(cos((fi + 2.0) * 1.0471976), sin((fi + 2.0) * 1.0471976)), E = mix(A, B, uu), S0 = vec2(cos(as), sin(as)) * 0.12, S1 = mix(S0, vec2(cos(as), sin(as)) * 0.52, us);
    if (uu > 0.0) { best = min(best, lmSeg(p, A, E)); if (uu < 1.0) hd = min(hd, length(p - E)); }
    if (us > 0.0) { best = min(best, lmSeg(p, S0, S1)); if (us < 1.0) hd = min(hd, length(p - S1)); } }
  return vec2(best, hd); }
/* radial ground cracks round an impact (p in units of the reach): n jagged rays, each forking once, growing out to rch (0..1), and a cell network
   near the middle; the distance to the nearest crack (in units) and how far out along its ray (0..1) */
vec2 eaWeb(vec2 p, float sd, float n, float rch){ float r = length(p), a = atan(p.y, p.x), sec = 6.2831853 / n, i0 = floor(a / sec), best = 9.0, al = 0.0;
  for (int k = -1; k <= 1; k++) { float ii = mod(i0 + float(k), n), L = (0.55 + 0.45 * h1(vec2(ii + 3.1, sd))) * rch, ar = (ii + 0.5 + (h1(vec2(ii, sd)) - 0.5) * 0.6) * sec + 0.3 * (n2(vec2(r * 3.0 + ii * 7.0, sd)) - 0.5) + 0.08 * (n2(vec2(r * 14.0, ii * 3.0 + sd)) - 0.5);
    float da = a - ar; da -= 6.2831853 * floor(da / 6.2831853 + 0.5); float tp = clamp(r / max(L, 1e-3), 0.0, 1.0), d = abs(da) * r / mix(1.0, 0.25, tp * tp) + max(r - L, 0.0) * 3.0; if (d < best) { best = d; al = tp; }
    float r0 = 0.4 * L, sg = h1(vec2(ii, sd + 9.0)) < 0.5 ? -1.0 : 1.0, af = ar + sg * 0.55 * clamp((r - r0) / max(L, 1e-3), 0.0, 1.0) + 0.1 * (n2(vec2(r * 9.0, ii + sd * 2.0)) - 0.5), db = a - af; db -= 6.2831853 * floor(db / 6.2831853 + 0.5);
    float L2 = r0 + 0.38 * L, t2 = clamp((r - r0) / max(L2 - r0, 1e-3), 0.0, 1.0); if (r > r0) { float d2 = abs(db) * r / mix(1.0, 0.25, t2 * t2) + max(r - L2, 0.0) * 3.0; if (d2 < best) { best = d2; al = mix(0.4, 1.0, t2); } } }
  vec2 g = p * 6.0 + sd, gi = floor(g), gf = g - gi; float f1 = 9.0, f2 = 9.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)), q = o + vec2(h1(gi + o), h1(gi + o + 7.7)) * 0.8 + 0.1 - gf; float dd = dot(q, q); if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd; }
  float cw = (sqrt(f2) - sqrt(f1)) / 6.0 + smoothstep(0.1, 0.32, r / max(rch, 0.05)) * 0.2; if (cw < best) { best = cw; al = 0.0; }
  return vec2(best, al); }
/* (v415 EB) Earth's kit (kinds 80..87): a turn about a unit axis, a 3D hash, a seed's turning axis */
vec3 ebR(vec3 p, vec3 k, float c, float s){ return p * c + cross(k, p) * s + k * dot(k, p) * (1.0 - c); }
vec3 ebH(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453); }
vec3 ebAx(float sd){ return normalize(vec3(0.62 + 0.3 * sin(sd * 1.7), 0.42 + 0.3 * cos(sd * 2.3), 0.55 + 0.3 * sin(sd * 3.1 + 1.0))); }
/* (v415 EB) a rough convex rock (26 planes round a sphere, each pushed in by its seed) cast through the view along -z at the point s (rock units: it spans
   about 0.95): md 0 a boulder, 1 a slab (1.25 x 0.95 x 0.55), turned by ang about its seed's axis. Returns x 1 on a hit, y its thickness there, z the gap to the
   next face (small along an edge), w that edge's own random (0..1); P the point (its own space, turning with it), N the view normal (bevelled at the edges) */
vec4 ebCast(vec2 s, float md, float ang, float sd, out vec3 P, out vec3 N){
  vec3 k = ebAx(sd), S = md < 0.5 ? vec3(1.0) : vec3(1.25, 0.95, 0.55); float c = cos(ang), sn = sin(ang); s *= md < 0.5 ? 1.0 : 1.25;   /* (a slab: drawn smaller, to stay in its quad) */
  vec3 o = ebR(vec3(s, 3.0), k, c, -sn) / S, d = ebR(vec3(0.0, 0.0, -1.0), k, c, -sn) / S; float t1 = -1e4, t2 = -1e4, tO = 1e4, i1 = 0.0, i2 = 0.0; vec3 n1 = vec3(0.0, 0.0, 1.0), n2 = n1;
  for (int i = 0; i < 26; i++) { float fi = float(i), yy = 1.0 - (fi + 0.5) / 13.0, rr = sqrt(max(0.0, 1.0 - yy * yy)), th = fi * 2.39996 + sd; vec3 h = ebH(vec3(fi, sd, 3.7));
    vec3 n = normalize(vec3(cos(th) * rr, yy, sin(th) * rr) + (h - 0.5) * 0.42); float dn = dot(n, d), t = (0.8 + 0.13 * h.z - dot(n, o)) / (abs(dn) > 1e-4 ? dn : 1e-4);
    if (dn < -1e-4) { if (t > t1) { t2 = t1; n2 = n1; i2 = i1; t1 = t; n1 = n; i1 = fi; } else if (t > t2) { t2 = t; n2 = n; i2 = fi; } } else if (dn > 1e-4) tO = min(tO, t); }
  P = o + d * t1; float e = t1 - t2; vec3 n = normalize(mix(n1, n2, 0.5 * (1.0 - smoothstep(0.0, 0.05, e)))); N = ebR(normalize(n / S), k, c, sn);
  return vec4(step(t1, tO), tO - t1, e, fract(sin(min(i1, i2) * 91.3 + max(i1, i2) * 17.1 + sd) * 4375.85)); }
/* (v415 EB) the boulder's ember veins at its point P (e, eh: ebCast's z, w): x the vein, y the warm halo round it, z the groove (darkened stone beside it) */
float ebW3(vec3 x){ vec3 i = floor(x), f = fract(x); float d1 = 9.0, d2 = 9.0;
  for (int c = -1; c <= 1; c++) for (int b = -1; b <= 1; b++) for (int a = -1; a <= 1; a++) { vec3 g = vec3(float(a), float(b), float(c)), rv = g + ebH(i + g) * 0.8 + 0.1 - f; float dd = dot(rv, rv); if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
  return sqrt(d2) - sqrt(d1); }   /* (v415 EB) 3D cells: about twice the distance to the nearest cell wall (a network of cracks) */
vec3 ebVein(vec3 P, float sd, float e, float eh){
  vec3 wp = P + (vec3(n3(P * 2.3 + sd), n3(P * 2.3 + 5.1), n3(P * 2.3 + 9.7)) - 0.5) * 0.3; float rg = 1.0 - ebW3(wp * 2.0 + sd * 0.37) * 2.2, dm = smoothstep(0.44, 0.6, n3(P * 1.5 + vec3(9.0, sd, 3.0)));
  float ev = step(eh, 0.22) * (1.0 - smoothstep(0.003, 0.012, e)), v = max(smoothstep(0.905, 0.965, rg) * dm, ev);
  return vec3(v, max(smoothstep(0.82, 0.96, rg) * dm, ev * 0.5), smoothstep(0.85, 0.93, rg)); }
/* (v415 EB) 2D cells: x about the distance to the nearest cell wall, y the cell's random, zw its centre */
vec4 ebCell(vec2 p){ vec2 i = floor(p), f = fract(p), c1 = vec2(0.0); float d1 = 9.0, d2 = 9.0, hv = 0.0;
  for (int b = -1; b <= 1; b++) for (int a = -1; a <= 1; a++) { vec2 g = vec2(float(a), float(b)), o = vec2(h1(i + g), h1(i + g + 17.3)) * 0.8 + 0.1, rv = g + o - f; float dd = dot(rv, rv);
    if (dd < d1) { d2 = d1; d1 = dd; c1 = i + g + o; hv = h1(i + g + 5.7); } else if (dd < d2) d2 = dd; }
  return vec4((sqrt(d2) - sqrt(d1)) * 0.5, hv, c1); }
/* (v415 EB) an irregular seven-cornered outline: 1 at its middle, 0 on its straight edges (negative outside) */
float ebPoly(vec2 w, float sd){ float rw = length(w), i0 = floor(atan(w.y, w.x) / 6.2831853 * 7.0); vec2 pA = (0.56 + 0.38 * h1(vec2(mod(i0, 7.0), sd))) * vec2(cos(i0 * 0.8975979), sin(i0 * 0.8975979)), pB = (0.56 + 0.38 * h1(vec2(mod(i0 + 1.0, 7.0), sd))) * vec2(cos(i0 * 0.8975979 + 0.8975979), sin(i0 * 0.8975979 + 0.8975979)), ab = pB - pA, dw = w / max(rw, 1e-4);
  return 1.0 - rw * (dw.x * ab.y - dw.y * ab.x) / (pA.x * ab.y - pA.y * ab.x); }
/* (v415 EB) a crater's height at the floor point p (uv of its disc): a bowl, a broken raised rim, rubble */
float ebCh(vec2 p, float sd){ float r = length(p), an = atan(p.y, p.x), R0 = 0.4 * (1.0 + 0.14 * (fbm(vec2(an * 1.3, sd)) - 0.5)), q = min(r / R0, 1.0);
  return -0.32 * (1.0 - q * q) + 0.15 * exp(-sq((r - R0) / (0.09 + 0.05 * n2(vec2(an * 3.0, sd))))) * (0.6 + 0.8 * n2(vec2(an * 4.0, sd + 2.0))) + 0.07 * (fbm(p * 6.0 + sd) - 0.5) * (1.0 - smoothstep(0.3, 0.95, r))
    + 0.05 * smoothstep(0.6, 0.75, n2(p * 11.0 + sd)) * smoothstep(R0, R0 + 0.1, r) * (1.0 - smoothstep(0.55, 0.9, r)); }
/* (v415 EB, Obsidian Drill) the drill at a model point p (x right, y toward the viewer, z up; its flights' radius 1, its tip at 4.42), turned by rot: negative
   inside. A faceted core, two starts of sloping flights (pitch 1.7) cut into wedges, each gap holding a joint of gold crystal set back */
vec4 ebDrP(vec3 p, float rot){ float z = p.z, rc = 0.54 * clamp(1.0 - (z - 2.3) / 2.12, 0.0, 1.0), ro = z < 2.3 ? 1.0 : rc + 0.46 * pow(clamp(1.0 - (z - 2.3) / 2.0, 0.0, 1.0), 1.15), r = length(p.xy);
  float ph = atan(p.y, p.x) - rot, w = z / 0.85 - ph / 3.14159265, sc = clamp((r - rc) / max(ro - rc, 0.01), 0.0, 1.0), cw = w + 0.12 * sc; cw -= floor(cw + 0.5);
  float al = 3.14159265 * (z / 0.85 - floor(w + 0.5)) / 1.2566371, jt = step(0.88, al - floor(al)) * step(-0.3, z);
  return vec4(r - rc * (0.94 + 0.06 * cos(ph * 14.0)), r - mix(ro, rc + 0.62 * (ro - rc), jt), (abs(cw) - mix(0.27, 0.12, sc)) * 0.85, min(sc, 0.999) + 2.0 * jt); }   /* (its parts: x core, y the flights' outer face, z their faces, w how far out (fract) + 2 in a joint) */
float ebDr(vec3 p, float rot){ vec4 q = ebDrP(p, rot); return min(q.x, max(q.y, q.z)); }
/* (v415 TI, Titan: kinds 88..91) floor fractures in a unit disc: radial trunks that wander, thin and end at their own reach, a net of side cracks near them. x the trunks' line, y the side cracks', z the arc distance to the nearest trunk */
vec3 ttnCr(vec2 u, float sd, float wk){ float r = length(u), an = atan(u.y, u.x), nr = 11.0 + floor(fract(sd * 0.37) * 4.0);
  float s = an / 6.2831853 * nr + (n2(vec2(r * 2.7, sd * 1.7)) - 0.5) * 1.7 + (n2(u * 4.5 + sd + 4.0) - 0.5) * 0.7 + (n2(u * 12.0 + sd + 9.0) - 0.5) * 0.3 + sd, id = floor(s + 0.5), d = abs(s - id) * 6.2831853 / nr * max(r, 0.04);
  float reach = 0.55 + 0.45 * h1(vec2(id, sd)), w = max(wk * 0.016 * (1.25 - 0.7 * r) * (1.0 - smoothstep(reach - 0.18, reach, r)), 1e-4), tr = exp(-d * d / (w * w)) * smoothstep(0.02, 0.07, r);
  float nn = n2(u * 6.5 + sd * 3.0), sc = exp(-sq((nn - 0.5) / (0.03 * wk))) * exp(-d * 5.0) * step(0.36, n2(u * 2.2 + sd)) * smoothstep(0.1, 0.25, r) * (1.0 - smoothstep(reach - 0.1, reach + 0.05, r));
  return vec3(tr, sc, d); }
/* (v415 TI) the summoning sigil's lines (three rings, a hexagon, spokes, a triangle, a band of 18 runes): the least distance / width to any */
float ttnSig(vec2 u, float sd){ float r = length(u), an = atan(u.y, u.x), m = 1e3;
  m = min(m, abs(r - 0.93) / 0.012); m = min(m, abs(r - 0.8) / 0.008); m = min(m, abs(r - 0.42) / 0.007);
  if (r < 0.81) m = min(m, abs(r * cos(mod(an, 1.0471976) - 0.5235988) - 0.69282) / 0.007);
  if (r > 0.42 && r < 0.8) m = min(m, abs(r * sin(mod(an, 1.0471976) - 0.5235988)) / 0.006);
  if (r < 0.3) m = min(m, abs(r * cos(mod(an + 1.5708, 2.0943951) - 1.0471976) - 0.14) / 0.006);
  if (abs(r - 0.865) < 0.04) { float ca = an / 0.34906585, c = floor(ca), h = h1(vec2(c, sd)), ly = (ca - c - 0.5) * 0.34906585 * r, lx = r - 0.865, cut = step(0.026, abs(lx)) * 1e3;
    m = min(m, abs(ly) / 0.005 + cut); if (h > 0.45) m = min(m, abs(lx * 0.8 - ly) / 0.005 + cut); if (fract(h * 7.3) > 0.55) m = min(m, abs(lx - 0.016) / 0.005 + step(0.014, abs(ly)) * 1e3); }
  return m; }
/*<W>*/vec4 wbl(vec2 u, float q0, float th0){ float md = floor(q0 / 10.0), span = max(0.05, q0 - md * 10.0), rr = length(u), an = atan(u.y, u.x), v = 0.0, tk = th0, m = 1.0;   /* (v370, wind) a blade of wind: an arc of radius 0.8 in its quad (mode 0 a trail, its head at angle 0 and its tail round toward -v; 1 a crescent tapering both ways; 2 a whole ring): x across (0 its sharp outer edge .. 1 its inner), y along (0 the head .. 1 the tail), z inside, w arc length */
  if (md < 0.5) { float s = mod(-an + 0.03, 6.2831853) - 0.03; v = s / span; tk = th0 * (1.0 - 0.78 * clamp(v, 0.0, 1.0)) * smoothstep(-0.03 / span, 0.05, v); m = step(v, 1.0); }
  else if (md < 1.5) { v = an / (span * 0.5); tk = th0 * pow(clamp(1.0 - v * v, 0.0, 1.0), 0.6); v = abs(v); m = step(v, 1.0); }
  return vec4((0.8 - rr) / max(tk, 0.004), v, m, an * rr); }
vec2 wfun(float h, float br, float t){ return vec2(sin(h * 4.0 - t * 1.7) * 0.05 * (0.3 + h) + sin(t * 0.9) * 0.03 * h, mix(br, 0.92, pow(h, 1.25)) * (0.94 + 0.06 * sin(h * 9.0 - t * 3.0))); }   /* (v370, wind) a funnel's centre and half-width at height h (0 its foot .. 1 its top) */
/*</W>*/void main(){ vec2 u = v_uv; float r = length(u), m = 0.0, edge = 1.0 - smoothstep(0.85, 1.0, r); vec3 col = v_c.rgb; float t = u_t + v_q.y * 7.3, pk = u_pet.z > 0.0 ? mix(0.12, 1.0, smoothstep(0.4, 1.4, length((v_px - u_pet.xy) * vec2(1.0, 1.1)) / u_pet.z)) : 1.0;   /* (the rider's face stays clear: light, body and smoke) */
  pk *= v_k > 11.5 ? 1.0 : (v_k > 1.5 && v_k < 2.5) || (v_k > 5.5 && v_k < 6.5) || v_k > 10.5 ? 1.0 - smoothstep(0.8, 1.0, abs(u.y)) : (v_k > 3.5 && v_k < 4.5) ? (1.0 - smoothstep(0.8, 1.0, abs(u.x))) * (1.0 - smoothstep(0.86, 1.0, u.y)) : (v_k > 0.5 && v_k < 1.5) || (v_k > 7.5 && v_k < 8.5) ? 1.0 - smoothstep(0.92, 1.0, r) : 1.0 - smoothstep(0.72, 1.0, r);   /* (every picture fades to nothing well inside its own quad: no straight cut where noise or a halo reaches the quad's edge) */
  if (v_k > 70.5 && v_k < 72.5) { // (v391 U4, Dead Scream) its 2D pictures drawn exactly, soft, on the GPU: 71 laid over (solid), 72 light. v_q.x
    // the picture: 1..6 and 11 the sprites' own gradients (u4g), 7 a soft stroke in v_c (uv.x along, its ends fading; uv.y across,
    // gaussian), 12 the game's round glow sprite in v_c (glowSprite), 13 its beam sprite in v_c (beamSprite: uv.x -1 the root .. 1 the tip)
    float p = v_q.x; vec4 g;
    if (p > 12.5) { float uu = u.x * 0.5 + 0.5, e = clamp((uu - 0.7) / 0.3, 0.0, 1.0), s = 1.0 - e * e * (3.0 - 2.0 * e), v = u.y / (1.0 - 0.3 * e), st = min(1.0, uu / 0.07); g = vec4(col, max(0.0, (exp(-v * v * 4.2) - 0.015) / 0.985) * st * st * (3.0 - 2.0 * st) * s * sqrt(s) * step(0.0, uu)); }
    else if (p > 11.5) { g = vec4(col, 1.0); g = u4s(g, r, 0.0, 0.22, vec4(col, 0.62)); g = u4s(g, r, 0.22, 0.55, vec4(col, 0.18)); g = u4s(g, r, 0.55, 1.0, vec4(col, 0.0)); }
    else if (p > 6.5 && p < 7.5) g = vec4(col, exp(-u.y * u.y * 5.0) * (1.0 - smoothstep(0.6, 1.0, abs(u.x))));
    else g = u4g(p, r);
    float a = g.a * v_c.a;
    if (v_k < 71.5) gl_FragColor = vec4(g.rgb * a, a);
    else { vec3 L = min(g.rgb * a, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); } }
  else if (v_k > 79.5 && v_k < 80.5) { // (v415 EB) a rock (solid): a rough convex rock cast per pixel (ebCast), turned by v_q.x about its seed's axis; v_q.y its seed (whole)
    // + 0.9 x its entry heat (its leading side glowing as it falls); v_q.z its mode + 0.9 x heat. Mode 0 Cataclysm's boulder: dark vesicular basalt in bevelled
    // facets, ember veins recessed in grooves, hotter with the heat; mode 1 Rock Steady's stone: a chipped slab of warm grey stone, fresh pale chips along its
    // edges, moss on its upper side, gold flecks, a gold seam right round it brightening with the heat
    float md = floor(v_q.z), ht = fract(v_q.z) / 0.9, sd = floor(v_q.y), en = fract(v_q.y) / 0.9; vec3 P, N; vec4 Hc = ebCast(u * 1.12, md, v_q.x, sd, P, N); float a = 0.0; vec3 c = vec3(0.0);
    if (Hc.x > 0.5) {
      vec3 Ld = normalize(vec3(-0.5, -0.62, 0.6)), Hv = normalize(Ld + vec3(0.0, 0.0, 1.0)); float bev = 1.0 - smoothstep(0.0, 0.05, Hc.z);
      vec3 bp = P * (md < 0.5 ? 5.5 : 7.0) + sd; N = normalize(N + (vec3(n3(bp), n3(bp + 17.1), n3(bp + 31.7)) - 0.5) * (md < 0.5 ? 0.55 : 0.4) * (1.0 - 0.6 * bev));
      float g1 = fbm3(P * 2.6 + sd), g2 = n3(P * 13.0 + 2.0), g3 = n3(P * 29.0 + sd), dif = max(dot(N, Ld), 0.0), wr = clamp(dot(N, Ld) * 0.5 + 0.5, 0.0, 1.0), sp = pow(max(dot(N, Hv), 0.0), 36.0), fr = pow(1.0 - max(N.z, 0.0), 2.5), dn = max(N.y, 0.0);
      if (md < 0.5) {
        vec3 V = ebVein(P, sd, Hc.z, Hc.w), alb = mix(vec3(0.085, 0.075, 0.075), vec3(0.32, 0.28, 0.25), g1) * (0.8 + 0.4 * g2) * (1.0 - 0.55 * smoothstep(0.74, 0.86, g3));
        float cel = 0.3 * smoothstep(0.04, 0.18, dif) + 0.35 * smoothstep(0.34, 0.48, dif) + 0.35 * smoothstep(0.66, 0.78, dif);   /* (soft cel bands, as the game's art) */
        c = alb * (0.16 + 0.75 * cel + 0.6 * dif + 0.15 * wr) + vec3(0.95, 0.88, 0.8) * sp * (0.3 + 0.4 * g2) + vec3(0.42, 0.5, 0.7) * fr * max(-N.y, 0.0) * 0.3 + vec3(0.85, 0.35, 0.06) * dn * fr * (0.4 + 0.6 * ht);
        c = mix(c, vec3(0.97, 0.86, 0.68), bev * (0.15 + dif) * 0.3) * (1.0 - 0.7 * V.z * (1.0 - V.x));   /* (lit bevels; grooves round the veins) */
        float pu = 0.8 + 0.2 * sin(u_t * 3.0 + n3(P * 3.0) * 9.0); c += vec3(0.8, 0.22, 0.03) * V.y * (0.08 + 0.25 * ht); c = mix(c, ramp(0.5 + 0.38 * pu + 0.3 * ht), V.x);
        c += ramp(0.45 + 0.3 * en) * en * smoothstep(0.2, 0.95, N.y + 0.2) * fr * 0.8; }   /* (its entry: the leading side hot) */
      else {
        vec3 alb = mix(vec3(0.16, 0.14, 0.12), vec3(0.4, 0.36, 0.3), g1) * (0.78 + 0.42 * g2); alb = mix(alb, vec3(0.6, 0.55, 0.47), bev * 0.35);   /* (fresh pale chips at the edges) */
        float ms = smoothstep(0.1, 0.3, (fbm3(P * 3.3 + 7.0) - 0.5) * 1.4 - N.y * 0.6 - 0.35) * (1.0 - bev);   /* (moss in patches on its upper side) */
        alb = mix(alb, mix(vec3(0.1, 0.17, 0.04), vec3(0.32, 0.44, 0.1), n3(P * 22.0) * 0.7 + g2 * 0.3), ms);
        float fk = 1.0 - abs(fbm3(P * 3.4 + sd) * 2.0 - 1.0); alb *= 1.0 - 0.6 * smoothstep(0.93, 0.985, fk) * (1.0 - ms);   /* (fractures) */
        vec3 gq = floor(P * 9.0), gh = ebH(gq + sd), gf = P * 9.0 - gq - 0.5 - (gh - 0.5) * 0.5; float fl = step(0.86, gh.x) * (1.0 - smoothstep(0.08, 0.18, length(gf))) * (1.0 - ms);
        float sg = dot(P, normalize(vec3(1.0, 0.35 * sin(sd), 0.3))) - 0.12 * sin(sd * 2.1), seam = 1.0 - smoothstep(0.022, 0.05, abs(sg + (n3(P * 6.0) - 0.5) * 0.06));
        c = alb * (0.25 + 1.2 * dif + 0.2 * wr) + vec3(0.9, 0.86, 0.78) * sp * 0.18 * (1.0 - ms) + vec3(0.85, 0.55, 0.2) * dn * fr * 0.3 + vec3(0.5, 0.55, 0.65) * fr * max(-N.y, 0.0) * 0.18;
        c = mix(c, vec3(0.95, 0.68, 0.2) * (0.45 + 0.8 * dif) + vec3(1.0, 0.95, 0.78) * pow(max(dot(N, Hv), 0.0), 12.0) * 0.8, fl); c = mix(c, mix(vec3(0.75, 0.48, 0.1), vec3(1.0, 0.86, 0.5), 0.3 + 0.7 * ht), seam); }
      c *= 0.35 + 0.65 * smoothstep(0.0, 0.1, Hc.y); a = smoothstep(0.0, 0.03, Hc.y) * v_c.a * pk; }
    gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 81.5 && v_k < 82.5) { // (v415 EB) a crater punched in the floor (solid; uv a unit disc squashed by its quad): a scorched bowl (ebCh) under a broken raised
    // rim, rubble and dark ejecta rays round it, lit from the upper left, molten in its heart with the heat v_q.x; v_q.y seed
    float sd = v_q.y, an = atan(u.y, u.x), e = 0.012, h0 = ebCh(u, sd), hx = ebCh(u + vec2(e, 0.0), sd), hy = ebCh(u + vec2(0.0, e), sd);
    vec3 n = normalize(vec3((h0 - hx) / e * 0.55, (h0 - hy) / e * 0.55, 1.0)), Ld = normalize(vec3(-0.45, -0.55, 0.7)); float dif = max(dot(n, Ld), 0.0), g = fbm(u * 9.0 + sd);
    vec3 c = mix(vec3(0.07, 0.055, 0.045), vec3(0.32, 0.25, 0.19), g) * (0.25 + 1.15 * dif) * (0.5 + 0.5 * smoothstep(-0.32, 0.0, h0));
    float ray = smoothstep(0.55, 0.85, n2(vec2(an * 4.5, sd))) * smoothstep(0.42, 0.55, r) * (1.0 - smoothstep(0.6, 1.0, r)); c *= 1.0 - 0.45 * ray;
    float mol = v_q.x * (1.0 - smoothstep(0.0, 0.3, r)) * (0.6 + 0.6 * fbm(u * 5.0 - u_t * 0.3 + sd)); c = mix(c, ramp(0.35 + 0.55 * mol), smoothstep(0.1, 0.5, mol));
    float a = (1.0 - smoothstep(0.62, 0.98, r + 0.14 * (g - 0.5))) * v_c.a; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 83.5 && v_k < 84.5) { // (v415 EB) dust and sand (solid; v_c its colour, v_q.y seed, v_q.z mode + 0.9 x the ember light under it): 0 a billowing plume (v_q.x
    // its age 0..1: it thins and opens), 1 a ring of dust rolling out (uv a unit disc squashed by its quad, its crest at radius v_q.x), 2 a lip of sand piled round a
    // foot (the front half of a ring, grains lit on top), 3 a ring of grains sliding inward (radius v_q.x)
    float md = floor(v_q.z), wm = fract(v_q.z) / 0.9, sd = v_q.y, an = atan(u.y, u.x), a = 0.0; vec3 c = col;
    if (md < 0.5) { vec2 w = u + 0.3 * vec2(fbm(u * 1.5 + vec2(sd, u_t * 0.25)) - 0.5, fbm(u * 1.5 + vec2(sd + 4.1, -u_t * 0.3)) - 0.5); float rr = length(w), f = fbm(w * 2.4 + vec2(sd * 3.1, sd - u_t * 0.3)), g = fbm(w * 5.5 + vec2(-u_t * 0.4, sd * 2.0));
      float d = clamp((1.0 - rr * rr) * (0.3 + 1.4 * f * f) - 0.1 - 0.25 * v_q.x, 0.0, 1.0) * (0.8 + 0.4 * g), lit = smoothstep(-0.7, 0.7, -w.y * 0.9 - w.x * 0.4 + (f - 0.5) * 1.3);
      c = col * (0.5 + 0.75 * lit) * (0.8 + 0.35 * g) + vec3(0.9, 0.42, 0.08) * wm * smoothstep(-0.2, 0.9, w.y) * (0.5 + 0.5 * f); a = smoothstep(0.0, 0.45, d) * 0.92 * (1.0 - smoothstep(0.85, 1.0, r)); }
    else if (md < 1.5) { float R0 = v_q.x * (1.0 + 0.06 * (fbm(vec2(an * 2.5, sd)) - 0.5)), f = fbm(vec2(an * 5.0 + sd, r * 5.0 - u_t * 0.8)), g = fbm(vec2(an * 11.0 - sd, r * 9.0 + u_t)), x = (r - R0) / (0.12 + 0.1 * f);
      float d = exp(-x * x * (x > 0.0 ? 2.2 : 0.9)) * (0.45 + 0.9 * f) * (0.75 + 0.4 * g) - 0.18, lit = smoothstep(-0.6, 0.8, -u.y * 0.6 + x * 0.35 + (g - 0.5));
      c = col * (0.55 + 0.7 * lit) + vec3(0.9, 0.42, 0.08) * wm * (1.0 - smoothstep(-0.5, 0.5, x)) * 0.6; a = smoothstep(0.0, 0.4, d) * 0.9 * (1.0 - smoothstep(0.88, 1.0, r)); }
    else if (md < 2.5) { float x = (r - 0.76) / 0.2, d = (1.0 - x * x) * smoothstep(-0.05, 0.25, u.y) * (0.7 + 0.5 * n2(u * 30.0 + sd)), gr = n2(u * vec2(60.0, 90.0) + sd);
      c = mix(vec3(0.16, 0.11, 0.06), vec3(0.6, 0.44, 0.2), clamp(0.3 - 0.4 * x, 0.0, 1.0) * 0.6 + gr * 0.4) + vec3(1.0, 0.85, 0.5) * step(0.93, gr) * 0.6; a = smoothstep(0.0, 0.3, d); }
    else { float x = (r - v_q.x) / 0.09, gr = n2(vec2(an * 70.0, r * 40.0) + sd), d = exp(-x * x) * (0.4 + 0.8 * gr) - 0.15;
      c = mix(vec3(0.12, 0.08, 0.04), vec3(0.55, 0.4, 0.18), clamp(0.4 - 0.4 * x, 0.0, 1.0) * 0.5 + gr * 0.5) + vec3(1.0, 0.85, 0.5) * step(0.94, gr) * 0.5; a = smoothstep(0.0, 0.35, d) * (1.0 - smoothstep(0.9, 1.0, r)); }
    a *= v_c.a * pk; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 84.5 && v_k < 85.5) { // (v415 EB) a shard, chip or crystal (solid): v_q.x the light's turn (the quad's own rotation, so the light stays at the upper left),
    // v_q.y seed, v_q.z material + 0.9 x its glow: 0 a basalt chip (an irregular faceted lump, ember-lit edges by the glow), 1 a shard of obsidian (a kite of black
    // volcanic glass, mirror facets, a sharp specular), 2 a gold crystal shard, 3 a chip of mossy stone, 4 an amber crystal standing on the floor (a hexagonal
    // prism with a point, lit from inside by the glow; v_q.x how far it has risen out of the floor: its foot at uv.y 0.85), 5 a plate of hardened sand
    float md = floor(v_q.z + 0.001), gw = fract(v_q.z) / 0.9, sd = v_q.y, la = md > 3.5 && md < 4.5 ? 0.0 : v_q.x, ca = cos(la), sa = sin(la), a = 0.0;
    vec3 Ld = normalize(vec3(-0.5 * ca - 0.62 * sa, 0.5 * sa - 0.62 * ca, 0.6)), Hv = normalize(Ld + vec3(0.0, 0.0, 1.0)), c = vec3(0.0), n = vec3(0.0, 0.0, 1.0);
    if (md < 0.5 || (md > 2.5 && md < 3.5) || md > 4.5) { // an irregular faceted lump (7 sides, raised in the middle); a plate: flat on top, its dark side below
      vec2 w = md > 4.5 ? (u + vec2(0.0, 0.14)) / 0.9 : u; float i0 = floor(atan(w.y, w.x) / 6.2831853 * 7.0), e = ebPoly(w, sd);   /* (straight edges between seven corners) */
      float mid = (i0 + 0.5) / 7.0 * 6.2831853, tp = smoothstep(0.38, 0.5, e); n = normalize(mix(vec3(cos(mid) * 0.95, sin(mid) * 0.95, 0.66 + 0.25 * h1(vec2(i0, sd + 4.0))), vec3((h1(vec2(sd, 1.0)) - 0.5) * 0.5, (h1(vec2(sd, 2.0)) - 0.5) * 0.5, 1.0), md > 4.5 ? 0.85 : tp));
      float dif = max(dot(n, Ld), 0.0), sp = pow(max(dot(n, Hv), 0.0), 30.0), g = n2(u * 7.0 + sd), g2 = n2(u * 19.0 + sd);
      if (md < 0.5) { c = mix(vec3(0.05, 0.045, 0.05), vec3(0.22, 0.2, 0.19), g) * (0.25 + 1.25 * dif) + vec3(0.9, 0.85, 0.8) * sp * 0.3; c += ramp(0.45 + 0.4 * gw) * gw * (1.0 - smoothstep(0.02, 0.16, e)) * 0.8; }
      else if (md < 3.5) { c = mix(vec3(0.2, 0.17, 0.14), vec3(0.46, 0.41, 0.34), g) * (0.25 + 1.2 * dif) + vec3(0.9, 0.86, 0.78) * sp * 0.15; float ms = smoothstep(0.0, 0.3, -w.y + (g2 - 0.5) * 0.8 - 0.1); c = mix(c, mix(vec3(0.1, 0.17, 0.04), vec3(0.3, 0.42, 0.1), g2) * (0.4 + 0.9 * dif), ms); }
      else { float side = 1.0 - smoothstep(0.0, 0.05, e); float e2 = ebPoly(u / 0.9, sd);
        float gm = n2(u * 40.0 + sd); c = mix(vec3(0.14, 0.1, 0.055), vec3(0.5, 0.37, 0.17), g * 0.6 + gm * 0.4) * (0.45 + 0.8 * dif) + vec3(1.0, 0.88, 0.55) * step(0.94, gm) * 0.5; c = mix(c, vec3(0.75, 0.6, 0.38), (1.0 - smoothstep(0.0, 0.06, e)) * 0.4);
        if (e < 0.0) { c = mix(vec3(0.07, 0.05, 0.035), vec3(0.16, 0.11, 0.07), g) + vec3(1.0, 0.6, 0.15) * gw * 0.5 * smoothstep(-0.1, 0.0, e2); e = e2; } }
      a = smoothstep(0.0, 0.07, e); c *= 0.55 + 0.45 * smoothstep(0.0, 0.12, e); }
    else if (md < 2.5) { // a kite: obsidian or gold crystal
      float sk = 0.3 + 0.2 * h1(vec2(sd, 1.3)), m = -0.2 + 0.15 * h1(vec2(sd, 7.1)), x = u.x, y = u.y, pr = y < m ? (y + 0.98) / (m + 0.98) : (0.72 - y) / (0.72 - m), e = 1.0 - abs(x) / max(sk * pr, 0.001);
      a = smoothstep(0.0, 0.1, e) * step(-0.98, y) * step(y, 0.72); float sx = x < 0.0 ? -1.0 : 1.0; n = normalize(vec3(sx * 0.62, y < m ? -0.45 : 0.42, 0.66));
      float dif = max(dot(n, Ld), 0.0), sp = pow(max(dot(n, Hv), 0.0), 80.0), rid = exp(-sq(x / 0.03)) * 0.6 + exp(-sq((y - m) / 0.035)) * 0.4, fres = pow(1.0 - n.z, 2.0); vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);
      if (md < 1.5) c = vec3(0.02, 0.018, 0.026) + vec3(0.07, 0.065, 0.09) * dif + mix(vec3(0.5, 0.26, 0.07), vec3(0.32, 0.33, 0.42), smoothstep(-0.2, 0.2, -R.y)) * (0.12 + 0.6 * fres) + vec3(1.0, 0.97, 0.94) * sp * 1.6 + vec3(0.75, 0.7, 0.9) * rid * 0.12 + vec3(1.0, 0.7, 0.25) * gw * (1.0 - smoothstep(0.0, 0.3, e)) * 0.6;
      else c = mix(vec3(0.5, 0.28, 0.05), vec3(1.0, 0.8, 0.38), 0.25 + 0.75 * dif) + vec3(1.0, 0.97, 0.88) * (sp * 1.4 + rid * 0.35) + vec3(1.0, 0.75, 0.3) * gw * 0.35; }
    else { // an amber crystal standing on the floor: a hexagonal prism (three faces seen) with a point; brighter inside with the glow
      float y = u.y + (1.0 - clamp(v_q.x, 0.0, 1.0)) * 1.85, x = u.x, tip = -0.3, hw = y < tip ? 0.62 * clamp((y + 0.95) / (tip + 0.95), 0.0, 1.0) : 0.62 * (1.0 + 0.1 * (y - tip)), f = (x - 0.12 * (y < tip ? (tip - y) : 0.0) * sign(h1(vec2(sd, 9.0)) - 0.5)) / max(hw, 0.001), e = 1.0 - abs(f);
      a = smoothstep(0.0, 0.12, e) * step(-0.95, y) * (1.0 - smoothstep(0.8, 0.86, u.y)); float fc = f < -0.34 ? -1.0 : f > 0.34 ? 1.0 : 0.0; n = normalize(vec3(fc * 0.75, y < tip ? -0.55 : -0.05, 0.62));
      float dif = max(dot(n, Ld), 0.0), th = 1.0 - abs(f) * 0.8, eg = exp(-sq((abs(f) - 0.34) / 0.045)) + (y < tip ? exp(-sq((y - tip) / 0.03)) * 0.0 : exp(-sq((y - tip) / 0.03))) * 0.7;
      float stk = smoothstep(0.55, 0.85, n2(vec2(x * 9.0 + sd, y * 1.6))) * (1.0 - abs(fc) * 0.5);   /* (streaks inside, along its axis) */
      c = mix(vec3(0.3, 0.12, 0.02), vec3(1.0, 0.72, 0.28), 0.08 + 0.8 * dif) * (0.7 + 0.3 * th) + vec3(0.35, 0.18, 0.03) * stk + ramp(0.55 + 0.4 * gw) * th * gw * 0.45 + vec3(1.0, 0.92, 0.7) * eg * (0.25 + 0.5 * dif) + vec3(1.0, 0.95, 0.85) * pow(max(dot(n, Hv), 0.0), 50.0); }
    a *= v_c.a * pk; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 85.5 && v_k < 86.5) { // (v415 EB, Obsidian Drill) a drill (solid; uv.x across: 1.15 of its flights' radius; uv.y -1 at 3.8 above its foot's screen point .. 1 at 0.75
    // below it, in its own units, through the game's view: screen y = y 0.55 - z 0.835): ebDr ray-marched through the view, glossy black volcanic glass in sharp
    // conchoidal facets reflecting a warm floor and a pale sky, gold crystal along its flights' rims and in their joints, brighter with the glow; v_q.x its turn,
    // v_q.y how deep it is still sunk (its own units), v_q.z its px per unit (whole) + 0.9 x its glow. The floor hides what is below it. Lit from the upper left:
    // a lit grey-violet flank with a soft sheen band and a rainbow sheen in its glints, dark core shadow, a rim light on the shadow edge, occlusion in the grooves
    float X = u.x * 1.15, Y = mix(-3.8, 0.75, u.y * 0.5 + 0.5), rot = v_q.x, dz = v_q.y, gw = fract(v_q.z) / 0.9, SE = 0.55, CE = 0.835, q = 1.0404 - X * X, a = 0.0; vec3 c = vec3(0.0);
    vec3 p0 = vec3(X, Y * SE, -Y * CE), Vv = vec3(0.0, CE, SE);
    if (q > 0.0) { q = sqrt(q); float lhi = min((q - Y * SE) / CE, (4.45 - dz + Y * CE) / SE), llo = max((-q - Y * SE) / CE, Y * CE / SE);
      if (lhi > llo) { float aa = clamp(1.4 / max(floor(v_q.z), 1.0), 0.006, 0.06), lam = lhi, hf = 0.0, dm = 9.0;   /* (sphere-traced: ebDr is close to a distance; v_q.z's whole part its px per unit, for a smooth edge) */
        for (int i = 0; i < 28; i++) { vec3 pm = p0 + Vv * lam; pm.z += dz; float d = ebDr(pm, rot); dm = min(dm, d); if (d < aa * 0.2) { hf = 1.0; lam -= max(d, 0.0); break; } lam -= max(d * 0.85, 0.006); if (lam < llo) break; }
        if (hf > 0.5) { vec3 pm = p0 + Vv * lam; pm.z += dz; float ee = 0.012;
          vec3 n = normalize(vec3(ebDr(pm + vec3(ee, 0.0, 0.0), rot) - ebDr(pm - vec3(ee, 0.0, 0.0), rot), ebDr(pm + vec3(0.0, ee, 0.0), rot) - ebDr(pm - vec3(0.0, ee, 0.0), rot), ebDr(pm + vec3(0.0, 0.0, ee), rot) - ebDr(pm - vec3(0.0, 0.0, ee), rot)));
          vec4 pa = ebDrP(pm, rot); float sc = fract(pa.w), jt = step(1.5, pa.w), isC = step(pa.x, max(pa.y, pa.z)), cr = cos(rot), sr = sin(rot), zw = pm.z - dz; vec3 pr = vec3(pm.x * cr + pm.y * sr, -pm.x * sr + pm.y * cr, pm.z);
          float ang = atan(pr.y, pr.x); vec4 ce = ebCell(vec2(ang * 3.0, pm.z * 4.2) + 3.0); vec3 fh = ebH(vec3(ce.zw, 7.0)); n = normalize(n + (fh - 0.5) * 0.42 * (1.0 - jt));   /* (conchoidal facets, turning with it) */
          vec3 Lm = normalize(vec3(-0.62, 0.38, 0.68)), R = reflect(-Vv, n); float nl = dot(n, Lm), dif = max(nl, 0.0), wr = clamp(nl * 0.5 + 0.5, 0.0, 1.0), nv = max(dot(n, Vv), 0.0), F = pow(1.0 - nv, 4.0), rl = max(dot(R, Lm), 0.0);
          float ao = isC > 0.5 ? 0.35 + 0.65 * smoothstep(0.0, 0.16, max(pa.y, pa.z)) : 0.45 + 0.55 * smoothstep(0.0, 0.16, pa.x);   /* (the groove where flight meets core) */
          vec3 bd = mix(vec3(0.016, 0.014, 0.022), vec3(0.075, 0.066, 0.1), smoothstep(0.25, 0.6, wr)); bd = mix(bd, vec3(0.27, 0.235, 0.34), smoothstep(0.62, 0.97, wr));   /* (shadow side, mid faces, the lit flank in glassy grey-violet) */
          bd *= 0.88 + 0.22 * (0.5 + 0.5 * sin(pm.z * 7.0 + ang * 0.6 + 3.0 * (n2(vec2(ang * 2.0, pm.z * 1.5)) - 0.5)));   /* (faint flow banding) */
          vec3 ir = 0.5 + 0.5 * cos(6.2832 * (nv * 1.6 + fh.x * 0.5 + vec3(0.0, 0.33, 0.67)));   /* (the obsidian's rainbow sheen) */
          c = bd * ao + vec3(0.55, 0.52, 0.68) * pow(rl, 7.0) * 0.24 * ao + ir * pow(rl, 22.0) * 0.5 * ao + vec3(1.0, 0.98, 0.95) * (pow(rl, 140.0) * 2.5 + pow(rl, 50.0) * 0.6 * step(0.6, fh.z));   /* (crisp glints, some facets flashing as it turns) */
          c += mix(vec3(0.72, 0.6, 1.0), vec3(1.0, 0.6, 0.26), smoothstep(-0.2, 0.3, -n.z)) * F * (1.0 - dif) * 0.6;   /* (a rim light on the shadow edge: cool above, warm from the floor below) */
          c += vec3(0.8, 0.75, 0.95) * (1.0 - smoothstep(0.0, 0.04, ce.x)) * (0.05 + 0.6 * dif) * 0.2 * (1.0 - jt);   /* (facet ridges catching the light) */
          c += vec3(1.0, 0.92, 0.8) * (1.0 - isC) * exp(-sq(pa.y / 0.035)) * exp(-sq(pa.z / 0.04)) * (0.25 + 0.9 * dif) * (0.5 + 0.8 * step(0.55, n2(vec2(ang * 30.0, pm.z * 20.0))));   /* (micro-chips on the flights' edges) */
          c += vec3(0.75, 0.38, 0.08) * (1.0 - smoothstep(0.0, 1.3, zw)) * max(0.35 - n.z, 0.0) * (0.35 + 0.5 * gw);   /* (the floor's warm bounce) */
          float seam = (1.0 - isC) * smoothstep(0.8, 0.9, sc) * (1.0 - smoothstep(-0.03, -0.008, pa.z)), lip = (1.0 - isC) * smoothstep(0.91, 0.97, sc) * (1.0 - smoothstep(0.0, 0.015, abs(pa.z))), gk = max(jt * (1.0 - isC), max(seam, lip * 0.7));
          vec3 gc = (mix(vec3(0.42, 0.22, 0.03), vec3(1.0, 0.78, 0.3), 0.15 + 0.85 * dif) + vec3(1.0, 0.97, 0.85) * pow(rl, 30.0) * 1.4 + vec3(1.0, 0.62, 0.15) * (0.35 + 0.55 * gw)) * (0.85 + 0.3 * fh.y); c = mix(c, gc, gk);
          c *= 0.4 + 0.6 * smoothstep(0.0, 0.3, zw); a = 1.0; }
        else { a = (1.0 - smoothstep(0.0, aa, dm)) * 0.9; c = vec3(0.05, 0.04, 0.06); } } }
    a *= v_c.a * pk; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 86.5 && v_k < 87.5) { // (v415 EB, Gilded Quicksand) the field (solid; uv a unit disc squashed by its quad): mineral sand of dark umber and gold grains swirling
    // slowly into a shallow funnel, rippled dunes lit from the upper left (Adept: a second set crossing them; Celestial: broad terraces drifting inward), dark patches,
    // paler streaks following the swirl, glittering grains catching the light, a grainy feathered rim; v_q.x the flow's clock (it stops at the halt), v_q.y seed,
    // v_q.z its tier (0, 1, 2) + 0.9 x the hardening (the sand turns to plates of stone, dark gaps between them)
    float tr = floor(v_q.z), hd = fract(v_q.z) / 0.9, sd = v_q.y, ft = v_q.x, an = atan(u.y, u.x);
    float rim = 0.93 + 0.025 * sin(an * 7.0 + sd) + 0.018 * sin(an * 13.0 + sd * 2.3) + 0.04 * (fbm(vec2(an * 2.0, sd)) - 0.5), e = r / rim;
    float sw = ft * 0.2 * (1.25 - min(e, 1.0)) + 0.5 * sq(1.0 - min(e, 1.0)), cs = cos(sw), ss = sin(sw); vec2 p = vec2(u.x * cs - u.y * ss, u.x * ss + u.y * cs) * 4.0;
    float rr = e + ft * 0.045, wv = fbm(p * 0.6 + sd + vec2(0.0, ft * 0.05)) * 3.0, ph = dot(p, vec2(1.5, 6.0)) + wv * 2.0; vec2 G = vec2(0.24, 0.97);
    if (tr > 1.5) { ph = rr * 34.0 + wv * 0.6; G = u / max(r, 1e-3); }
    float h = sin(ph) + 0.35 * sin(2.0 * ph - 0.6); vec2 gr = G * (cos(ph) + 0.7 * cos(2.0 * ph - 0.6)) * 0.3;
    if (tr > 0.5) { float ph2 = dot(p, vec2(5.0, -2.2)) + wv * 1.6 + ft * 0.4; h += 0.5 * (sin(ph2) + 0.35 * sin(2.0 * ph2 - 0.6)); gr += vec2(0.91, -0.41) * (cos(ph2) + 0.7 * cos(2.0 * ph2 - 0.6)) * 0.15; }
    float arm = 0.5 + 0.5 * sin(an * 3.0 + log(max(e, 0.03)) * 5.0 + ft * 0.9 + (wv - 1.5) * 1.2);   /* (spiral arms of paler sand flowing in) */
    vec3 n = normalize(vec3(-gr * (0.6 + 0.4 * arm) - u * 0.75, 1.0)), Ld = normalize(vec3(-0.45, -0.55, 0.7)); float dif = max(dot(n, Ld), 0.0);
    float gn = n2(p * 14.0 + vec2(ft * 0.6, 0.0)), gm = n2(p * 33.0 - vec2(0.0, ft * 0.9)), bl = smoothstep(0.5, 0.78, fbm(p * 0.8 + vec2(sd, ft * 0.04)));
    vec3 c = mix(vec3(0.13, 0.09, 0.05), vec3(0.52, 0.38, 0.18), clamp(0.4 + 0.2 * h + 0.18 * arm + (gn - 0.5) * 0.3 + (gm - 0.5) * 0.15, 0.0, 1.0)) * (1.0 - 0.4 * bl);
    c = c * (0.3 + 1.15 * dif) + vec3(0.95, 0.72, 0.32) * smoothstep(0.7, 1.0, sin(ph + 0.4)) * dif * 0.3;
    float st = smoothstep(0.55, 0.9, fbm(vec2((an + sw) * 5.0, rr * 16.0) + sd)) * arm; c = mix(c, vec3(0.66, 0.5, 0.27) * (0.5 + 0.7 * dif), st * 0.35);   /* (paler streaks swirling in) */
    c *= 0.42 + 0.58 * smoothstep(0.0, 0.8, e); c += vec3(0.45, 0.22, 0.04) * (1.0 - smoothstep(0.0, 0.3, e)) * 0.2; c += vec3(0.5, 0.38, 0.2) * exp(-sq((e - 0.86) / 0.05)) * dif * 0.3;   /* (the funnel's depth, a mineral glow in it; a lip at its rim) */
    for (int k = 0; k < 2; k++) { float S = k == 0 ? 7.0 : 16.0; vec2 gq = p * S, gi = floor(gq), gf = fract(gq) - 0.5; float hh = h1(gi + sd + float(k) * 7.0); vec2 of = (vec2(h1(gi + 1.3), h1(gi + 2.7)) - 0.5) * 0.5;
      float spot = exp(-dot(gf - of, gf - of) * (k == 0 ? 34.0 : 26.0)), tw = pow(0.5 + 0.5 * sin(u_t * (2.0 + hh * 9.0) + hh * 80.0), 10.0);
      c += vec3(1.0, 0.9, 0.62) * spot * step(0.88, hh) * (tw * 1.5 + 0.2) * (k == 0 ? 1.0 : 0.6) * (0.5 + dif) + vec3(0.9, 0.62, 0.2) * spot * step(0.7, hh) * step(hh, 0.88) * 0.3 * dif; }   /* (glitter) */
    if (hd > 0.0) { vec4 ce = ebCell(u * 4.6 + sd); vec2 dc = u * 4.6 + sd - ce.zw; float gp = 1.0 - smoothstep(0.0, 0.012 + 0.03 * hd, ce.x - 0.004), bv = (1.0 - smoothstep(0.0, 0.07, ce.x)) * sign(dot(dc, vec2(-0.6, -0.8)));
      vec3 sc2 = mix(c, vec3(dot(c, vec3(0.33))) * vec3(1.05, 0.95, 0.82) * 1.1, 0.5) * (1.0 + 0.35 * bv); c = mix(c, mix(sc2, vec3(0.025, 0.018, 0.012), gp), hd); }
    float a = (1.0 - smoothstep(0.8, 1.0, e + 0.1 * (n2(u * 45.0 + sd) - 0.5))) * v_c.a; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if ((v_k > 72.5 && v_k < 75.5) || (v_k > 77.5 && v_k < 78.5)) { // (v415 EA) Earth's solids: 73 a crystal, 74 a stone, 75 Rocky's fist, 78 dust and floor shade
    vec4 A = vec4(0.0);
    if (v_k < 73.5 && v_q.x > 2999.5) { // md 3 (World Shaking) the golden orb (the quad its radius; screen space: x right, y down, z toward the viewer): a mineral
      // globe of bands, seams, veins and pockets turning about a tilted axis (v_q.z its turn), glossy gold metal reflecting a warm room, a hard specular, a
      // dark limb, a pale rim; at Adept (v_q.y fraction > 0.25) a counter-turning inner globe seen through its translucent pockets. v_c.r the seams' light, v_c.g a white flash
      float S = floor(v_q.y), ade = v_q.y - S > 0.25 ? 1.0 : 0.0, sp = v_q.z, cov = clamp((1.0 - r) * S + 0.5, 0.0, 1.0);
      if (cov > 0.003) { vec3 n = vec3(u, sqrt(max(0.0, 1.0 - r * r))) / max(1.0, r), AX = vec3(-0.3, -0.88, 0.37) / 1.0011, q = n * cos(-sp) + cross(AX, n) * sin(-sp) + AX * dot(AX, n) * (1.0 - cos(-sp));
        float lat = dot(q, AX), w1 = fbm3(q * 1.7 + 3.0), w2 = fbm3(q * 4.6 + 9.0), arg = lat * (2.5 + 0.8 * ade) * 1.5708 + (w1 - 0.5) * 1.5 + (w2 - 0.5) * 0.35, band = 0.5 + 0.5 * sin(arg * 6.2832), gr = fbm3(q * 9.0 + 3.0), pk = smoothstep(0.56, 0.72, fbm3(q * 2.6 + 21.0));
        float fr = fract(arg), bd = min(abs(fr - 0.25), abs(fr - 0.75)), sb = exp(-sq(bd / 0.03)) * (0.45 + 0.55 * gr), vein = pow(1.0 - abs(2.0 * fbm3(q * 3.3 + 31.0) - 1.0), 14.0), tone = clamp(0.26 + 0.58 * band + 0.28 * (gr - 0.5) - 0.42 * pk + 0.12 * vein, 0.0, 1.0), seam = clamp(max(sb * 0.75 * (1.0 - 0.6 * pk), vein * 0.95), 0.0, 1.0);
        vec3 bc = mix(vec3(0.18, 0.086, 0.024), vec3(0.44, 0.23, 0.055), smoothstep(0.0, 0.22, tone)); bc = mix(bc, vec3(0.745, 0.44, 0.1), smoothstep(0.22, 0.42, tone)); bc = mix(bc, vec3(0.91, 0.63, 0.165), smoothstep(0.42, 0.6, tone)); bc = mix(bc, vec3(0.97, 0.78, 0.29), smoothstep(0.6, 0.76, tone)); bc = mix(bc, vec3(1.0, 0.89, 0.59), smoothstep(0.76, 0.95, tone));
        vec3 Lv = vec3(-0.5, -0.66, 0.56) / 0.9934, Hh = normalize(Lv + vec3(0.0, 0.0, 1.0)); float ndl = max(dot(n, Lv), 0.0), ndh = max(dot(n, Hh), 0.0), up = -reflect(vec3(0.0, 0.0, -1.0), n).y;
        vec3 env = mix(vec3(0.3, 0.15, 0.04), vec3(1.0, 0.9, 0.7), smoothstep(-0.35, 0.65, up)) + vec3(1.0, 0.85, 0.55) * exp(-sq((up - 0.08) / 0.09)) * 0.5;
        vec3 c = mix(bc * (0.38 + 0.62 * (0.4 * smoothstep(0.05, 0.3, ndl) + 0.6 * ndl)), bc * env * 1.15, 0.5 * (1.0 - pk));
        if (ade > 0.5 && r < 0.66) { vec3 m = vec3(u / 0.66, sqrt(max(0.0, 1.0 - r * r / 0.4356))), A2 = vec3(0.55, -0.62, 0.56) / 0.9978, m2 = m * cos(sp * 2.0) + cross(A2, m) * sin(sp * 2.0) + A2 * dot(A2, m) * (1.0 - cos(sp * 2.0));
          float t2 = fbm3(m2 * 2.4 + 7.0), s2 = pow(1.0 - abs(2.0 * fbm3(m2 * 3.0 + 13.0) - 1.0), 10.0); c = mix(c, mix(vec3(0.6, 0.3, 0.06), vec3(1.0, 0.8, 0.4), t2) + vec3(1.0, 0.93, 0.75) * s2 * 0.7, pk * 0.75 * smoothstep(0.0, 0.25, m.z)); }
        c += vec3(1.0, 0.95, 0.85) * (pow(ndh, 70.0) * 1.1 + pow(ndh, 12.0) * 0.12) + vec3(1.0, 0.91, 0.72) * pow(1.0 - n.z, 3.0) * clamp(-(u.x * 0.7 + u.y * 0.72), 0.0, 1.0) * 0.6 + vec3(0.85, 0.54, 0.12) * pow(1.0 - n.z, 2.4) * clamp(u.y * 0.9 + u.x * 0.2, 0.0, 1.0) * 0.4;
        c += vec3(1.0, 0.94, 0.77) * seam * (0.15 + 0.6 * v_c.r) * (0.62 + 0.38 * ndl); c *= 1.0 - 0.55 * pow(1.0 - n.z, 1.6) * clamp(0.2 + u.x * 0.5 + u.y * 0.75, 0.0, 1.0);
        c = mix(c, vec3(1.0, 0.97, 0.88), v_c.g); c *= 0.42 + 0.58 * smoothstep(0.0, 3.2, (1.0 - r) * S); A = vec4(min(c, vec3(1.0)), 1.0) * cov; } }
    else if (v_k < 73.5) { // a faceted crystal (eaCSet): honey to amber by the light and its thickness, the back facets showing through as inner planes, the view
      // bent in at the front face and out at the back in bands of light, streaks along its axis, inner fracture planes, pale gold bevelled edges, a hard
      // specular and fresnel; md 0 a dark stone root (v_c.g its height) with a gold seam. v_c.r its palette (0 amber, 1 ember)
      eaCSet(u); float cov = clamp(eaSil + 0.5, 0.0, 1.0);
      if (cov > 0.003) { vec3 n = eaN1.xyz; float bw = max(1.1, eaSS * eaRR * 0.07); if (eaEd < bw) n = normalize(mix(n, eaN2.xyz, 0.5 * (1.0 - smoothstep(0.0, bw, eaEd))));
        float ndl = max(dot(n, eaLt), 0.0), ndv = max(dot(n, eaVw), 0.0), ndh = max(dot(n, eaHv), 0.0), th = clamp(eaTh / (eaRR * 2.0), 0.0, 1.0), z = eaQ.z, fh = h1(floor(eaN1.xy * 23.0 + 50.0) + eaN1.z * 3.7);
        vec3 rf = refract(-eaVw, n, 0.66), ro = refract(rf, -eaNB.xyz, 1.5); if (dot(ro, ro) < 0.01) ro = reflect(rf, -eaNB.xyz);
        float rb = 0.5 + 0.5 * sin(dot(ro, vec3(2.7, 4.1, 3.3)) * 2.6 + z * 5.0 / max(eaRR * 5.0, 0.3) + eaSD), rb2 = smoothstep(0.55, 0.95, rb);
        vec3 c = eaAm(0.03 + 0.58 * pow(ndl, 1.3) + 0.12 * fh + 0.18 * rb * (0.3 + 0.7 * th) - 0.1 * th * (1.0 - ndl), v_c.r);
        float ip = smoothstep(0.2, 0.9, abs(dot(eaNB.xyz, eaLt))) * (0.3 + 0.7 * th) * (1.0 - 0.5 * ndl); c += vec3(0.24 + 0.16 * fh, 0.17 + 0.13 * fh, 0.05) * ip * 0.7 + vec3(0.5, 0.38, 0.16) * rb2 * th * 0.3;
        c += vec3(0.11, 0.086, 0.047) * smoothstep(0.6, 0.82, n3(vec3(eaQ.xy * 9.0 / max(eaRR, 0.05), z * 2.0) + eaSD));
        float fp = abs(fract(dot(eaQ, vec3(0.55, 0.25, 0.8)) / max(eaRR, 0.05) * 0.9 + eaSD * 0.37) - 0.5); c += vec3(0.55, 0.42, 0.18) * exp(-fp * fp * 300.0) * th * 0.45;
        c += vec3(1.0, 0.965, 0.88) * pow(ndh, 46.0) * 1.1 + vec3(0.47, 0.41, 0.27) * pow(1.0 - ndv, 3.0) * 0.3;
        c = mix(c, vec3(1.0, 0.914, 0.722), (1.0 - smoothstep(0.45, 1.5, eaEd)) * (0.4 + 0.6 * clamp(ndl * 1.6, 0.0, 1.0)) * 0.85);
        float rh = v_c.g * 0.3; if (rh > 0.001 && eaMD < 0.5) { float zr = rh * (0.8 + 0.5 * n3(eaQ * 9.0 + eaSD)), rk = 1.0 - smoothstep(-0.02, 0.02, z - zr), sm2 = 1.0 - smoothstep(0.0, rh * 0.16, abs(z - zr));
          c = mix(c, eaStone(n, eaQ / max(eaRR, 0.05) * 0.5, eaSD, 0.5), rk); c = mix(c, vec3(1.0, 0.77, 0.33), sm2 * 0.8); }
        c *= 0.32 + 0.68 * smoothstep(0.0, 2.0, eaSil); A = vec4(min(c, vec3(1.0)), 1.0) * cov; } }
    else if (v_k < 74.5) { // a stone: v_q.x md x 1000 + seed, v_q.y px per unit + its moss (fraction), v_q.z its turn + 7 x floor(100 x its embers). md 0 a rough rock
      // (radius about 0.85; the quad 1.15 units either way), md 1 a slab (half sizes 1 x 0.62 x 0.2; the quad 1.25 either way; v_q.z its heading on the floor
      // + 7 x floor(100 x its lift, 0..1 of upright)). Lit faces, worn pale edges, grain, chips and pits, moss, ember veins; v_c.r a warm light from below, v_c.g dust on it
      float md = floor(v_q.x / 1000.0 + 0.0001), sd = v_q.x - md * 1000.0, S = floor(v_q.y), moss = v_q.y - S, lq = floor(v_q.z / 7.0 + 0.0001), an = v_q.z - lq * 7.0, hot = lq / 100.0; vec2 s; mat3 M;
      if (md > 1.5) { // md 2 (World Shaking) the carved ring round the orb, ray-marched: a chamfered torus (radius 1.46 orb radii, 0.17 x 0.1 its half section) tilted
        // back 1.15 and turned -0.3 on screen; its outer faces dark carved stone (a groove, notched runes), gold bevels catching the light, gold studs turning
        // with it (v_q.z its turn), its inner edge luminous honey (v_c.r its light). The quad 1.75 units either way; v_q.y fraction < 0.5 its back half, else its
        // front; v_c.g (ry - 0.7) / 0.6 its squash, v_c.b (rw + 0.4) / 0.8 its wobble (as the 2D draws it)
        float S2 = floor(v_q.y), fr = v_q.y - S2 > 0.5 ? 1.0 : 0.0, rw = v_c.b * 0.8 - 0.4, ry = 0.7 + v_c.g * 0.6, ta = v_q.z; vec2 w0 = u * 1.75; w0 = vec2(cos(rw) * w0.x + sin(rw) * w0.y, (-sin(rw) * w0.x + cos(rw) * w0.y) / ry);
        vec3 E1 = vec3(cos(-0.3), sin(-0.3), 0.0), E2 = vec3(-sin(-0.3) * cos(1.15), cos(-0.3) * cos(1.15), sin(1.15)), EN = vec3(sin(-0.3) * sin(1.15), -cos(-0.3) * sin(1.15), cos(1.15)), dl = -vec3(E1.z, E2.z, EN.z), ol = vec3(dot(vec3(w0, 4.0), E1), dot(vec3(w0, 4.0), E2), dot(vec3(w0, 4.0), EN));
        float ta0 = (ol.z - 0.16) / -dl.z, ta1 = (ol.z + 0.16) / -dl.z, tt = min(ta0, ta1), te = max(ta0, ta1), hit = 0.0, dm = 9.0, px = 1.0 / max(S2 / 1.75, 1.0); vec3 p = ol;
        for (int i = 0; i < 28; i++) { p = ol + dl * tt; vec2 qq = vec2(abs(length(p.xy) - 1.46), abs(p.z)), aa = qq - vec2(0.17, 0.1); float d = max(length(max(aa, 0.0)) + min(max(aa.x, aa.y), 0.0), (qq.x + qq.y - 0.22) * 0.7071); dm = min(dm, d); if (d < px * 0.3) { hit = 1.0; break; } tt += max(d, px * 0.4); if (tt > te) break; }
        float zs = 4.0 - tt, side = zs > 0.0 ? 1.0 : 0.0, cov = (hit > 0.5 ? 1.0 : clamp(1.0 - dm / px, 0.0, 1.0)) * (1.0 - abs(side - fr));
        if (cov > 0.003) { vec2 e = vec2(0.004, 0.0); vec3 g3; float th = atan(p.y, p.x);
          vec2 q0 = vec2(abs(length(p.xy) - 1.46), abs(p.z));
          #define EARS(P) max(length(max(vec2(abs(length((P).xy) - 1.46), abs((P).z)) - vec2(0.17, 0.1), 0.0)) + min(max(abs(length((P).xy) - 1.46) - 0.17, abs((P).z) - 0.1), 0.0), (abs(length((P).xy) - 1.46) + abs((P).z) - 0.22) * 0.7071)
          g3 = normalize(vec3(EARS(p + e.xyy) - EARS(p - e.xyy), EARS(p + e.yxy) - EARS(p - e.yxy), EARS(p + e.yyx) - EARS(p - e.yyx)));
          #undef EARS
          vec3 rd = vec3(cos(th), sin(th), 0.0); float nr = dot(g3.xy, rd.xy), nw = g3.z, qx = length(p.xy) - 1.46; vec3 ns = g3.x * E1 + g3.y * E2 + g3.z * EN, ne = normalize(vec3(ns.x, ns.z, -ns.y)), q3 = vec3(p.xy * 2.0, p.z * 2.0);
          float ndl = max(dot(ne, eaLt), 0.0), ndh = max(dot(ne, eaHv), 0.0), bev = abs(nw) > 0.3 && abs(nr) > 0.3 ? 1.0 : 0.0, inr = clamp((-nr - 0.25) / 0.6, 0.0, 1.0), fl3 = smoothstep(0.75, 0.9, abs(nw));
          vec3 c = eaStone(ne, q3 * 1.5, 7.0, 0.25);
          float grv = exp(-sq((abs(qx) - 0.066) / 0.011)) * fl3, run = fl3 * smoothstep(0.095, 0.105, abs(qx)) * (1.0 - smoothstep(0.14, 0.15, abs(qx))) * smoothstep(0.3, 0.4, abs(fract((th - ta) * 36.0 / 6.2832) - 0.5));
          c *= 1.0 - 0.6 * grv - 0.45 * run; c = mix(c, vec3(0.95, 0.68, 0.22) * (0.45 + 0.75 * ndl) + vec3(1.0, 0.93, 0.75) * pow(ndh, 30.0), bev * 0.85); c += vec3(0.9, 0.62, 0.2) * exp(-sq((abs(qx) - 0.083) / 0.008)) * fl3 * 0.5 * (0.4 + ndl);
          float stp = 6.2832 / 8.0, ds = length(vec2((mod(th - ta + stp * 0.5, stp) - stp * 0.5) * 1.46, qx)); if (fl3 > 0.5) { float sm3 = 1.0 - smoothstep(0.045, 0.055, ds); c = mix(c, vec3(0.97, 0.75, 0.3) * (0.5 + 0.6 * ndl) + vec3(1.0, 0.95, 0.8) * pow(ndh, 20.0) * 0.8 + vec3(0.12, 0.08, 0.04) * (1.0 - smoothstep(0.02, 0.035, ds)), sm3); }
          c = mix(c, mix(vec3(1.0, 0.75, 0.3), vec3(1.0, 0.93, 0.75), inr), inr * (0.55 + 0.4 * v_c.r) * (0.75 + 0.25 * sin(th * 6.0 - ta * 2.0)));
          c *= 0.45 + 0.55 * smoothstep(0.04, 0.32, abs(ns.z)); A = vec4(min(c, vec3(1.0)), 1.0) * cov; }
        gl_FragColor = A * v_c.a; return; }
      if (md < 0.5) { s = u * 1.15; M = eaFr(normalize(vec3(h1(vec2(sd, 1.1)) - 0.5, h1(vec2(sd, 2.2)) - 0.5, 0.7)), an); eaI(); eaRk(s, M, sd); }
      else { s = u * 1.25; vec3 X = vec3(cos(an), sin(an), 0.0), Z = vec3(0.0, 0.0, 1.0); float ct = cos(hot * 1.5708), st = sin(hot * 1.5708); M = mat3(ct * X + st * Z, vec3(-sin(an), cos(an), 0.0), ct * Z - st * X); hot = 0.0; eaI(); eaSb(s, M, sd); }
      vec2 se = eaSE(S); float cov = clamp(se.x + 0.5, 0.0, 1.0);
      if (cov > 0.003) { vec3 n = eaN1.xyz; float bw = max(1.3, S * 0.06); if (se.y < bw) n = normalize(mix(n, eaN2.xyz, 0.5 * (1.0 - smoothstep(0.0, bw, se.y))));
        vec3 q = eaLoc(M, vec3(s.x, eaU1, eaU1 * 0.55 - s.y)), gq = vec3(n3(q * 5.0 + vec3(0.08, 0.0, 0.0)), n3(q * 5.0 + vec3(0.0, 0.08, 0.0)), n3(q * 5.0 + vec3(0.0, 0.0, 0.08))) - n3(q * 5.0);
        n = normalize(n - (M * gq) * 1.2);
        vec3 c = eaStone(n, q, sd, moss); float ndl = max(dot(n, eaLt), 0.0);
        c = mix(c, vec3(0.6, 0.5, 0.38), (1.0 - smoothstep(0.35, 1.7, se.y)) * 0.5 * clamp(ndl * 2.0, 0.0, 1.0)); c *= 1.0 - 0.35 * smoothstep(0.7, 0.85, n3(q * 13.0 + sd * 3.0));
        c += vec3(0.85, 0.48, 0.12) * v_c.r * clamp(-n.z * 0.8 + 0.5, 0.0, 1.0) * 0.5; c = mix(c, vec3(0.55, 0.47, 0.38) * (0.6 + 0.5 * ndl), v_c.g * smoothstep(0.0, 0.6, n.z + 0.3) * 0.7);
        if (hot > 0.01) { float rv = abs(n3(q * 2.4 + sd + 30.0) - 0.5) + 0.25 * abs(n3(q * 6.0 + 9.0) - 0.5), vn = (1.0 - smoothstep(0.03, 0.07, rv)) * smoothstep(0.35, 0.55, n3(q * 1.3 + sd));
          c = mix(c, mix(vec3(0.45, 0.16, 0.03), mix(vec3(0.95, 0.5, 0.1), vec3(1.0, 0.86, 0.55), smoothstep(0.5, 1.0, hot)), smoothstep(0.0, 0.5, hot)), vn); }
        c *= 0.3 + 0.7 * smoothstep(0.0, 2.2, se.x); A = vec4(min(c, vec3(1.0)), 1.0) * cov; } }
    else if (v_k < 75.5) { // Rocky's fist, ray-marched (eaFist): v_q.x heading + 8 x floor(500 x pitch) (20k2k orient), v_q.y +-(px per unit + tier / 10) (-: a left fist,
      // the right one mirrored on screen as the 2D draws it), v_q.z its build (0..1) + 2 x floor(100 x its reinforcement); v_c.r its veins' light, v_c.g the final
      // punch's charge (light running wrist -> knuckles), v_c.b the floor's light from below. Hewn stones lit and grained, moss on top, dark crevices with amber
      // light deep in them (brightest between the knuckles), a network of ember veins. The quad 1.3 units either way
      float qq = floor(v_q.x / 8.0 + 0.0001), psi = v_q.x - qq * 8.0, phi = qq / 500.0, aq = abs(v_q.y), S = floor(aq), tier = floor((aq - S) * 10.0 + 0.3), rq = floor(v_q.z / 2.0 + 0.0001), bld = v_q.z - rq * 2.0, kb = 1.0 + 0.3 * rq / 100.0;
      vec2 s = u * 1.3; if (v_q.y < 0.0) s.x = -s.x;
      vec3 f = vec3(cos(psi), sin(psi), 0.0), D = vec3(0.0, 0.0, cos(phi)) + f * sin(phi), B0 = f * cos(phi) - vec3(0.0, 0.0, sin(phi)), Bv = B0 * cos(2.0 * phi) - cross(B0, D) * sin(2.0 * phi); mat3 M = mat3(D, cross(Bv, D), Bv);
      vec3 ro = eaLoc(M, vec3(s.x, 2.0, 1.1 - s.y)), rd = eaLoc(M, vec3(0.0, -0.87622, -0.48192)); float b = dot(ro, rd), h = b * b - dot(ro, ro) + 1.96;
      if (h > 0.0) { float tt = -b - sqrt(h), t1 = -b + sqrt(h), dm = 9.0, hit = 0.0, px = 1.0 / max(S, 1.0); vec3 p = ro;
        for (int i = 0; i < 44; i++) { p = ro + rd * tt; float d = eaFist(p, tier, bld, kb); dm = min(dm, d); if (d < px * 0.35) { hit = 1.0; break; } tt += max(d, px * 0.3); if (tt > t1) break; }
        float cov = hit > 0.5 ? 1.0 : clamp(1.0 - dm / (px * 1.1), 0.0, 1.0);
        if (cov > 0.003) { vec2 e = vec2(0.006, -0.006); vec3 nl = normalize(e.xyy * eaFist(p + e.xyy, tier, bld, kb) + e.yyx * eaFist(p + e.yyx, tier, bld, kb) + e.yxy * eaFist(p + e.yxy, tier, bld, kb) + e.xxx * eaFist(p + e.xxx, tier, bld, kb));
          eaFist(p, tier, bld, kb); float gap = eaFk.y - eaFk.x, grp = eaFg, gl = v_c.r, ch = v_c.g;
          vec3 gq = vec3(n3(p * 9.0 + vec3(0.07, 0.0, 0.0)), n3(p * 9.0 + vec3(0.0, 0.07, 0.0)), n3(p * 9.0 + vec3(0.0, 0.0, 0.07))) - n3(p * 9.0), n = normalize(M * normalize(nl - gq * 1.6));
          float plate = (grp > 1.5 && grp < 2.5) || grp > 14.5 ? 1.0 : 0.0, knk = grp > 2.5 && grp < 7.5 ? 1.0 : 0.0, ndv = max(dot(n, eaVw), 0.0);
          vec3 c = eaStone(n, p * 1.7 + grp * 3.1, grp, 0.32 - 0.22 * knk) * (1.0 + 0.14 * plate - 0.1 * knk);
          c = mix(c, vec3(0.66, 0.56, 0.44), smoothstep(0.045, 0.06, gap) * (1.0 - smoothstep(0.06, 0.1, gap)) * clamp(dot(n, eaLt) * 1.5, 0.0, 1.0) * 0.5 * hit);   /* (worn pale rims along each stone's edge) */
          float cv = (1.0 - smoothstep(0.0, 0.05, gap)) * hit, hc = (1.0 - smoothstep(0.0, 0.028, gap)) * hit * (knk > 0.5 ? 1.0 : 0.4) * clamp(gl, 0.0, 1.5);
          c *= 1.0 - 0.72 * cv; c = mix(c, vec3(0.95, 0.52, 0.1), clamp(hc * 0.8, 0.0, 1.0));
          float rv = abs(n3(p * 2.3 + 20.0) - 0.5) + 0.3 * abs(n3(p * 6.5 + 4.0) - 0.5), vn = (1.0 - smoothstep(0.025, 0.06, rv)) * smoothstep(0.44 - 0.06 * tier, 0.58 - 0.06 * tier, n3(p * 1.2 + 7.0)) * hit;
          float run = 1.0 - smoothstep(ch * 2.2 - 0.95, ch * 2.2 - 0.75, p.x), vg = clamp(gl * 0.75 + ch * run * 0.8, 0.0, 1.6);
          c = mix(c, mix(vec3(0.3, 0.1, 0.02), mix(vec3(0.95, 0.5, 0.1), vec3(1.0, 0.9, 0.62), clamp(vg - 0.6, 0.0, 1.0)), clamp(vg, 0.0, 1.0)), vn);
          c += vec3(1.0, 0.62, 0.18) * ch * run * 0.25 * (1.0 - ndv) + vec3(0.85, 0.48, 0.12) * v_c.b * clamp(-n.z * 0.8 + 0.4, 0.0, 1.0) * 0.45;
          c *= 0.42 + 0.58 * smoothstep(0.02, 0.3, ndv); A = vec4(min(c, vec3(1.0)), 1.0) * cov; } } }
    else { // 78 dust and floor shade (v_q.x its form): 0 a billow of dust (v_q.y seed, v_q.z its age 0..1: it swells and thins), lit warm from below; 1 a ring
      // of dust (an annulus at 0.8 of the quad, v_q.z its width of the radius, trailing inward), torn by noise; 2 the fissures' charred lips (eaHex: v_q.y seed,
      // v_q.z the trace); 3 an impact's charred cracks (eaWeb: v_q.y seed, v_q.z rays + 0.99 x their reach). v_c the dust's colour
      float md = v_q.x, a = 0.0; vec3 c = v_c.rgb;
      if (md < 0.5) { float ag = v_q.z; vec2 p = u * 1.15; float n = fbm(p * 2.1 + v_q.y + vec2(0.0, ag * 0.9)), nb = fbm(p * 4.3 - v_q.y * 1.3 + vec2(ag * 0.6, 0.0));
        a = (1.0 - smoothstep(0.3 + 0.1 * ag, 1.0, length(p) + (n - 0.5) * 0.7)) * (0.45 + 0.75 * n * (0.6 + 0.4 * nb)) * (1.0 - 0.45 * ag);
        c = mix(c * 0.62, c * 1.15 + vec3(0.16, 0.08, 0.0), smoothstep(-0.7, 0.8, u.y + (nb - 0.5) * 0.4)) * (0.82 + 0.3 * (1.0 - smoothstep(-0.8, 0.2, u.x + u.y))); }
      else if (md < 1.5) { float rr = r / 0.8, w = max(v_q.z, 0.02), an = atan(u.y, u.x), n = fbm(vec2(an * 3.0, rr * 4.0) + v_q.y), x = (rr - 1.0) / w;
        a = exp(-x * x * 2.2 - max(-x, 0.0) * 0.6) * (0.35 + 0.9 * n) * (1.0 - smoothstep(0.85, 1.0, r)); c *= 0.75 + 0.45 * n; }
      else if (md < 2.5) { a = exp(-eaHex(u * 1.18, v_q.z, v_q.y).x / 0.02) * 0.8 * (1.0 - smoothstep(0.9, 1.0, r)); c = vec3(0.06, 0.04, 0.028); }
      else { a = exp(-eaWeb(u * 1.1, v_q.y, floor(v_q.z + 0.0001), fract(v_q.z) / 0.99).x / 0.018) * 0.75 * (1.0 - smoothstep(0.85, 1.0, r)); c = vec3(0.06, 0.04, 0.028); }
      a = clamp(a, 0.0, 1.0); A = vec4(c * a, a); }
    gl_FragColor = A * v_c.a; }
  else if (v_k > 88.5 && v_k < 89.5) { // (v415 TI, Titan) broken ground (solid; a unit disc on the floor): dark fissures out to v_q.x, and v_q.z a dark pit at the middle (0 none .. 1 a deep opening with a heaved dirt rim); v_q.y seed
    vec3 cr = ttnCr(u * 0.97, v_q.y, 1.7); float lt = 1.0 - smoothstep(v_q.x - 0.06, v_q.x + 0.02, r), f = fbm(u * 4.0 + v_q.y), fis = min(1.0, cr.x * 1.15 + cr.y * 0.7) * lt, pz = v_q.z, pr = r + 0.2 * (f - 0.5);
    float pit = pz * (1.0 - smoothstep(0.4 * pz + 0.08, 0.6 * pz + 0.14, pr)), rim = pz * exp(-sq((pr - (0.6 * pz + 0.2)) / 0.11)) * (1.0 - pit);
    vec3 c = mix(vec3(0.06, 0.045, 0.035), vec3(0.012, 0.009, 0.008), pit), rc = vec3(0.42, 0.36, 0.29) * (0.72 + 0.45 * f) * (1.0 - 0.3 * smoothstep(-0.3, 0.8, u.y));
    float a = max(fis * 0.85, pit * (0.78 + 0.22 * f)); c = mix(c, rc, rim * 0.9 * (1.0 - fis)); a = max(a, rim * 0.62 * (0.55 + 0.45 * f));
    a = clamp(a, 0.0, 1.0) * v_c.a * (1.0 - smoothstep(0.88, 1.0, r)); gl_FragColor = vec4(c * a, a); }
  else if (v_k > 89.5 && v_k < 90.5) { // (v415 TI, Titan) a rolling ring of dust on the floor (quad 1.3 times its radius): billows streaming outward, densest just behind the front, thinning inward over v_q.x radii; v_q.y seed, v_q.z age 0..1 (thinner, broken); v_c its colour
    float rr = r * 1.3, d = rr - 1.0, th = max(v_q.x, 0.03); vec2 dr = u / max(r, 0.001);
    float f = fbm3(vec3(dr * 3.0, rr * 3.5 - t * 1.3) + v_q.y), f2 = fbm3(vec3(dr * 7.0, rr * 8.0 - t * 2.0) + v_q.y * 1.7);
    float body = smoothstep(-th * (1.0 + 0.8 * f), -th * 0.12, d) * (1.0 - smoothstep(-0.01, th * (0.18 + 0.55 * f), d)), dns = body * smoothstep(0.22 + 0.3 * v_q.z, 0.72, f * 0.75 + f2 * 0.45) * (1.0 - 0.55 * v_q.z);
    vec3 c = col * (0.8 - 0.16 * dr.y + 0.25 * (f2 - 0.5) + 0.18 * smoothstep(-th * 0.5, 0.0, d)); float a = clamp(dns * 1.2, 0.0, 1.0) * v_c.a * (1.0 - smoothstep(1.18, 1.3, rr)); gl_FragColor = vec4(c * a, a); }
  else if (v_k > 67.5 && v_k < 68.5) { // (v412 LM, Lantern Fall) a lantern (solid): its 2D design (20k4l lantern()) as a lit object. A hexagonal silk lantern
    // seen a little from above, turned by v_q.x: six upper panels and six lower petals (hinged at the equator, opening by fract(v_q.y) / 0.98) of
    // pearly pink silk with the light scattering through them (brightest before its heart of light, shaded along the ribs, heart cutouts glowing
    // in the front panels; the back panels lit from inside, seen through), rose-gold rods and rings, a lacquered dome cap with a rose-gold rim,
    // knob and loop, a rose-gold base bead, two silk tassels swinging (v_q.z: 4 x seed + 2 + sway), a heart of flame flickering inside, a flame
    // licking from its cleft; floor(v_q.y) its tier; v_c: its glow, its flash, its dissolution (0..1: tassels, petals, body, cap in turn).
    // Lantern units: w across, y down, the equator at 0 (the quad: 0.95 w either side, 0.9 h above and below 0.1 h)
    vec2 p = vec2(u.x * 0.95, (0.1 + u.y * 0.9) * 1.25); float spin = v_q.x, tier = floor(v_q.y + 0.001), op = clamp((v_q.y - tier) / 0.98, 0.0, 1.0), sd = floor(v_q.z / 4.0), sw = v_q.z - sd * 4.0 - 2.0;
    float gl = v_c.r, dis = v_c.b, nz = n2(p * 13.0 + sd * 7.1) - 0.5, fk = 1.0 + 0.07 * sin(u_t * 17.0 + sd * 3.0) + 0.05 * sin(u_t * 29.3 + sd);
    float aPet = 1.0 - smoothstep(0.15, 0.6, dis + 0.14 * nz), aBody = 1.0 - smoothstep(0.35, 0.85, dis + 0.14 * nz), aCap = 1.0 - smoothstep(0.55, 1.0, dis + 0.14 * nz), aCr = 1.0 - smoothstep(0.0, 0.35, dis + 0.14 * nz);
    float rbo = 0.3 + op * 0.34, yB = mix(0.4, 0.175, op), ks = 0.24 * (1.0 + 1.4 * op), bY = mix(0.472, 0.25, op * 0.6);
    vec3 PE = vec3(1.0, 0.941, 0.969), BL = vec3(1.0, 0.718, 0.835), RO = vec3(1.0, 0.412, 0.706), DP = vec3(0.851, 0.294, 0.569), DE = vec3(0.561, 0.176, 0.451), RG = vec3(0.91, 0.686, 0.722), RD = vec3(0.612, 0.353, 0.4);
    vec3 Ld = normalize(vec3(-0.5, -0.62, 0.6)), Hv = normalize(Ld + vec3(0.0, 0.0, 1.0));
    float vU = clamp((p.y + 0.45) / 0.45, 0.0, 1.0), vL = clamp(p.y / max(yB, 0.1), 0.0, 1.0); vec2 q = vec2(p.x / (1.0 + (p.y < 0.0 ? 0.24 * vU * (1.0 - vU) : 0.2 * vL * (1.0 - vL))), p.y);   /* (the panels' sides bow out a little, as the 2D curves) */
    vec2 dc = (p - vec2(0.0, 0.02)) * vec2(1.2, 1.0); float gc = exp(-dot(dc, dc) / 0.075);   /* (the light falls off from the heart of light) */
    vec4 A = vec4(0.0);
    for (int ps = 0; ps < 2; ps++) { bool fr = ps == 1;
      if (fr) { // the heart of light inside, behind the front panels: a volume of rose light, a heart of flame, a flame licking from its cleft, light pouring down when open
        A = lmO(A, RO, 0.5 * gl * gc * aBody);
        float kh = 0.3 * (0.85 + 0.25 * gl) * (0.97 + 0.03 * fk) / 1.2; vec2 hp = vec2(p.x / kh, 0.55 - p.y / kh); hp.x += (n2(vec2(hp.y * 3.0, u_t * 4.0 + sd)) - 0.5) * 0.14 * smoothstep(0.3, 1.1, hp.y);
        float dh = hsd(hp), ins = clamp(-dh / 0.32, 0.0, 1.0); vec3 hc = mix(RO, vec3(1.0, 0.72, 0.8), smoothstep(0.0, 0.35, ins)); hc = mix(hc, vec3(1.0, 0.92, 0.86), smoothstep(0.35, 0.8, ins)); hc = mix(hc, vec3(1.0, 0.99, 0.96), smoothstep(0.75, 1.0, ins) * min(fk, 1.0));
        A = lmO(A, RO, exp(-max(dh, 0.0) / 0.16) * 0.5 * gl * aBody * step(0.0, dh)); A = lmO(A, hc, (1.0 - smoothstep(-0.03, 0.02, dh)) * (0.5 + 0.5 * gl) * aBody);
        float ty = (-0.45 * kh - p.y) / (0.7 * kh * fk), tx = p.x - sin(u_t * 9.0 + sd + ty * 3.0) * 0.18 * kh * ty, tw = 0.16 * kh * pow(max(1.0 - ty, 0.0), 0.8) * sqrt(max(ty, 0.0) + 0.08);
        A = lmO(A, mix(vec3(1.0, 0.98, 0.94), vec3(1.0, 0.8, 0.74), clamp(ty, 0.0, 1.0)), (1.0 - smoothstep(0.55, 1.0, abs(tx) / max(tw, 1e-3))) * smoothstep(-0.15, 0.05, ty) * (1.0 - smoothstep(0.7, 1.0, ty)) * 0.9 * gl * aBody);
        if (op > 0.02) A = lmO(A, PE, 0.5 * op * gl * aPet * exp(-sq(p.x / 0.24) - sq((p.y - 0.3) / 0.13))); }
      for (int k = 0; k < 6; k++) { // the panels: back ones first, then front ones; each its upper panel then its petal
        float a0 = spin + float(k) * 1.0471976, a1 = a0 + 1.0471976, am = a0 + 0.5235988, ms = sin(am); if ((ms >= 0.0) != fr) continue;
        vec2 c0 = vec2(cos(a0), sin(a0)), c1 = vec2(cos(a1), sin(a1)), t0 = vec2(0.3 * c0.x, -0.45 + 0.072 * c0.y), t1 = vec2(0.3 * c1.x, -0.45 + 0.072 * c1.y), e0 = vec2(0.5 * c0.x, 0.12 * c0.y), e1 = vec2(0.5 * c1.x, 0.12 * c1.y);
        vec2 b0 = vec2(rbo * c0.x, yB + rbo * ks * c0.y), b1 = vec2(rbo * c1.x, yB + rbo * ks * c1.y); float lt = 0.5 + 0.5 * cos(am - 2.2708); vec3 tg = vec3(-ms, 0.0, cos(am));
        vec2 st = lmIB(q, t0, t1, e1, e0); float cu = smoothstep(-0.007, 0.007, min(min(st.x, 1.0 - st.x) * length(mix(t1 - t0, e1 - e0, st.y)), min(st.y, 1.0 - st.y) * length(mix(e0 - t0, e1 - t1, st.x))));
        if (aBody > 0.01 && cu > 0.0) {
          if (fr) { vec3 n = normalize(vec3(cos(am), -0.385, ms) - tg * (st.x - 0.5) * 0.7 + vec3(0.0, (st.y - 0.5) * 0.45, 0.0)); float df = max(dot(n, Ld), 0.0), spc = pow(max(dot(n, Hv), 0.0), 26.0);
            float rib = smoothstep(0.0, 0.2, min(st.x, 1.0 - st.x)) * smoothstep(0.0, 0.16, st.y) * smoothstep(0.0, 0.14, 1.0 - st.y), tr = gl * fk * (0.52 + 0.9 * gc) * (0.5 + 0.5 * rib) * (0.92 + 0.08 * n2(vec2(st.x * 30.0, st.y * 44.0) + sd));
            vec3 c = mix(DP * 0.62, RO, smoothstep(0.0, 0.45, tr)); c = mix(c, mix(RO, BL, 0.55), smoothstep(0.45, 0.9, tr)); c = mix(c, BL, smoothstep(0.9, 1.3, tr)); c = c * (0.78 + 0.22 * df) + mix(DP, BL, lt * 0.7) * df * 0.12 + PE * spc * 0.4; float al = (mix(0.88, 0.64, gc) + 0.06 * lt) * cu;
            float hv = smoothstep(tier > 1.5 ? 0.25 : 0.6, tier > 1.5 ? 0.45 : 0.8, ms);
            if (hv > 0.0) { float hs = tier > 1.5 ? 0.63 : 0.58, dh = hsd(vec2((st.x - 0.5) / hs * 1.2, (0.5 - st.y) / (hs * 0.81) * 1.1 + 0.55)), hin = 1.0 - smoothstep(-0.02, 0.03, dh);   /* (a heart cut in the silk: the light comes through it) */
              c = mix(c, mix(BL, PE, 0.3 + 0.6 * gl), hin * hv * (0.45 + 0.55 * gl)); al = mix(al, 0.97 * cu, hin * hv); c = mix(c, DE, exp(-sq((dh - 0.025) / 0.03)) * 0.6 * hv); if (tier > 1.5) c += PE * exp(-sq((dh - 0.11) / 0.03)) * 0.5 * gl * hv; }
            A = lmO(A, min(c, vec3(1.0)), al * aBody); }
          else A = lmO(A, mix(DE, RO, 0.25 + 0.3 * gl * gc), 0.55 * aBody * cu); }
        vec2 sp = lmIB(q, e0, e1, b1, b0); float sg = 0.044 * (1.0 - 0.5 * op) / max(abs(0.5 * (b0.y + b1.y - e0.y - e1.y)), 0.06), sb = 1.0 + sg * 4.0 * sp.x * (1.0 - sp.x);
        float W = length(mix(e1 - e0, b1 - b0, sp.y)), Hh = length(mix(b0 - e0, b1 - e1, sp.x)), de = min(min(sp.x, 1.0 - sp.x) * W, min(sp.y, sb - sp.y) * Hh), cp = smoothstep(-0.007, 0.007, de);
        if (aPet > 0.01 && cp > 0.0) { vec3 c; float al;
          if (fr) { vec3 n = normalize(vec3(cos(am), mix(0.433, -0.69, op), ms) - tg * (sp.x - 0.5) * 0.6); float df = max(dot(n, Ld), 0.0), spc = pow(max(dot(n, Hv), 0.0), 26.0), rib = smoothstep(0.0, 0.2, min(sp.x, 1.0 - sp.x)) * smoothstep(0.0, 0.14, sp.y);
            float tr = gl * fk * (0.38 + 0.8 * gc + 0.4 * op * (0.4 + 0.6 * sp.y)) * (0.55 + 0.45 * rib);
            c = mix(DP * 0.62, RO, smoothstep(0.0, 0.45, tr)); c = mix(c, mix(RO, BL, 0.55), smoothstep(0.45, 0.9, tr)); c = mix(c, BL, smoothstep(0.9, 1.3, tr)); c = c * (0.78 + 0.22 * df) + mix(DP, BL, lt * 0.7 * (1.0 - 0.3 * op)) * df * 0.12 + PE * spc * 0.35; al = 0.74 + 0.1 * lt;
            if (tier > 1.5 && ms > 0.4) { float dh = hsd(vec2((sp.x - 0.5) / 0.34 * 1.2, (0.5 - sp.y) / 0.3 * 1.1 + 0.55)); c = mix(c, BL * (0.7 + 0.4 * gl), (1.0 - smoothstep(-0.02, 0.03, dh)) * smoothstep(0.4, 0.6, ms) * gl); } }
          else { c = mix(DE, RO, 0.2 + 0.3 * gl * min(gc + op, 1.0)); al = 0.45; }
          c = mix(c, fr ? mix(RD, RG, 0.55) : RD * 0.8, (1.0 - smoothstep(0.012, 0.024, de)) * (fr ? 0.9 : 0.45)); A = lmO(A, min(c, vec3(1.0)), al * aPet * cp); } }   /* (its rose-gold piping) */
      // the rods (each corner from the top ring down to the equator) and the two rings: rounded rose-gold, the back ones dim behind the light
      float bw = 0.034, cov = 0.0; vec3 bn = vec3(0.0, 0.0, 1.0);
      for (int k = 0; k < 6; k++) { float a0 = spin + float(k) * 1.0471976, s0 = sin(a0); if ((s0 > -0.05) != fr) continue;
        vec2 ta = vec2(0.3 * cos(a0), -0.45 + 0.072 * s0), ba = vec2(0.5 * cos(a0), 0.12 * s0) - ta, pa = q - ta, dv = pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); float d = length(dv), cv = 1.0 - smoothstep(bw - 0.01, bw + 0.006, d);
        if (cv > cov) { cov = cv; vec2 nn = dv / max(d, 1e-4) * clamp(d / bw, 0.0, 1.0); bn = vec3(nn, sqrt(max(0.0, 1.0 - dot(nn, nn)))); } }
      for (int k = 0; k < 2; k++) { float R = k == 0 ? 0.3 : 0.5, y0 = k == 0 ? -0.45 : 0.0; if ((q.y >= y0) != fr) continue; vec2 e = vec2(q.x / R, (q.y - y0) / (0.24 * R)); float le = length(e);
        vec2 gg = vec2(e.x / R, e.y / (0.24 * R)) / max(le, 1e-4); float d = abs(le - 1.0) / max(length(gg), 1e-4), cv = 1.0 - smoothstep(bw - 0.01, bw + 0.006, d);
        if (cv > cov) { cov = cv; vec2 nn = normalize(gg + 1e-5) * sign(le - 1.0) * clamp(d / bw, 0.0, 1.0); bn = vec3(nn, sqrt(max(0.0, 1.0 - dot(nn, nn)))); } }
      if (cov > 0.0) A = lmO(A, fr ? min(lmMt(bn, Ld, Hv) * mix(0.45, 1.0, smoothstep(0.0, 0.55, bn.z)) + RO * 0.15 * gl * (1.0 - bn.z), vec3(1.0)) : mix(RD, RO, 0.35) * 0.75, cov * aBody * (fr ? 1.0 : 0.45)); }
    if (aCap > 0.01) { // the cap: a lacquered dome on a rose-gold rim, its knob, the loop it hangs from
      float X = p.x / 0.336, s2 = max(0.0, 1.0 - X * X), yTop = -0.45 - 0.3125 * pow(s2, 0.55), yBot = -0.45 + 0.081 * sqrt(s2);
      float m = smoothstep(yTop - 0.008, yTop + 0.01, p.y) * (1.0 - smoothstep(yBot - 0.01, yBot + 0.006, p.y)) * (1.0 - smoothstep(0.985, 1.02, abs(X)));
      if (m > 0.0) { float Y = (p.y + 0.45) / 0.3125; bool dome = p.y < -0.462; vec3 c;
        if (dome) { vec3 n = normalize(vec3(X * 0.95, Y * 0.85, sqrt(max(0.03, 1.0 - X * X * 0.9 - Y * Y * 0.72)))); float df = max(dot(n, Ld), 0.0), spc = pow(max(dot(n, Hv), 0.0), 48.0);
          c = mix(DE * 0.65, DP, 0.25 + 0.75 * df) + BL * smoothstep(-0.2, 0.6, -n.y) * 0.16 * (1.0 - 0.5 * df) + PE * spc * 0.45 + BL * exp(-sq((n.x + 0.42) / 0.2) - sq((n.y + 0.4) / 0.32)) * 0.4 + RO * 0.22 * gl * sq(1.0 - n.z);
          c = mix(c, lmMt(n, Ld, Hv), exp(-sq((p.y + 0.49) / 0.014)) * 0.85); c = mix(c, RD * 0.6, exp(-sq((p.y - yTop) / 0.012)) * 0.5); }
        else c = lmMt(normalize(vec3(X * 0.85, 0.45, sqrt(max(0.05, 1.0 - X * X * 0.72)))), Ld, Hv);
        A = lmO(A, min(c, vec3(1.0)), m * aCap); }
      float ld = (length(p - vec2(0.0, -0.85)) - 0.07) / 0.022; if (abs(ld) < 1.3) { vec2 dr = normalize(p - vec2(0.0, -0.85) + 1e-5) * clamp(ld, -1.0, 1.0); A = lmO(A, min(lmMt(vec3(dr, sqrt(max(0.0, 1.0 - dot(dr, dr)))), Ld, Hv), vec3(1.0)), (1.0 - smoothstep(0.75, 1.25, abs(ld))) * aCap); }
      vec2 kq = (p - vec2(0.0, -0.7625)) / 0.05; float kr = length(kq); if (kr < 1.2) A = lmO(A, min(lmMt(vec3(kq * min(1.0, 1.0 / max(kr, 1e-3)) * min(kr, 1.0), sqrt(max(0.0, 1.0 - kr * kr))), Ld, Hv), vec3(1.0)), (1.0 - smoothstep(0.85, 1.15, kr)) * aCap); }
    if (aCr > 0.01) { // the crystal's thread, the two silk tassels (cords of twisted silk, a rose-gold knot, a tuft of fine threads), the base bead
      A = lmO(A, RG * 0.9, (1.0 - smoothstep(0.008, 0.016, lmSeg(p, vec2(0.0, bY), vec2(0.0, bY + 0.175)))) * aCr * 0.9);
      for (int s = 0; s < 2; s++) { float sg = s == 0 ? -1.0 : 1.0, x0 = sg * 0.255, sww = sw + sg * 0.12; vec2 pp = vec2(x0, bY), pv = pp;
        for (int j = 1; j <= 4; j++) { float fj = float(j) / 4.0, an = sww * fj, hw = 0.5 * (0.075 - float(j) * 0.013); vec2 nq = vec2(x0 + sin(an) * 0.6875 * fj, bY + cos(an) * 0.625 * fj), bb = nq - pp, pa = p - pp;
          float h = clamp(dot(pa, bb) / max(dot(bb, bb), 1e-6), 0.0, 1.0), d = length(pa - bb * h), cv = 1.0 - smoothstep(hw - 0.006, hw + 0.006, d);
          if (cv > 0.0) { float x = clamp(d / hw, 0.0, 1.0) * sign(bb.x * pa.y - bb.y * pa.x), al = dot(pa, bb) / max(length(bb), 1e-4), tw = 0.5 + 0.5 * sin(al * 150.0 + x * 2.6);
            A = lmO(A, min((j < 3 ? DP : RO) * (0.5 + 0.6 * sqrt(max(0.0, 1.0 - x * x))) * (0.82 + 0.18 * tw) + PE * pow(max(0.0, 1.0 - abs(x + 0.4)), 6.0) * 0.3, vec3(1.0)), cv * aCr); }
          pv = pp; pp = nq; }
        vec2 dr = normalize(pp - pv + 1e-5), pr = vec2(-dr.y, dr.x), lq = p - pp; float v = dot(lq, dr) / 0.15, x = dot(lq, pr) / (0.016 + 0.03 * clamp(v, 0.0, 1.0));
        float tf = (1.0 - smoothstep(0.75, 1.05, abs(x))) * smoothstep(-0.02, 0.06, v) * (1.0 - smoothstep(0.8, 1.0, v)), th = 0.6 + 0.4 * sin(x * 9.0 + v * 2.0 + sd);
        A = lmO(A, mix(RO, BL, clamp(v, 0.0, 1.0)) * th * (0.7 + 0.3 * sqrt(max(0.0, 1.0 - x * x))), tf * aCr);
        vec2 kq = (p - pp) / 0.024; float kr = length(kq); if (kr < 1.2) A = lmO(A, min(lmMt(vec3(kq * min(kr, 1.0) / max(kr, 1e-3), sqrt(max(0.0, 1.0 - kr * kr))), Ld, Hv), vec3(1.0)), (1.0 - smoothstep(0.8, 1.15, kr)) * aCr); }
      vec2 kq = (p - vec2(0.0, bY)) / 0.04; float kr = length(kq); if (kr < 1.2) A = lmO(A, min(lmMt(vec3(kq * min(kr, 1.0) / max(kr, 1e-3), sqrt(max(0.0, 1.0 - kr * kr))), Ld, Hv), vec3(1.0)), (1.0 - smoothstep(0.85, 1.12, kr)) * aCr); }
    gl_FragColor = A * v_c.a; }
  else if (v_k > 68.5 && v_k < 69.5) { // (v412 LM, Love Mirrors) a mirror (solid): its 2D design (20k4l frameSpr) as a polished object. An arched mirror in a
    // moulded pink lacquer frame lit from the upper left (a lip, a cove, a raised rose-gold wire, a round outer bead; a second wire and pearl beads at
    // Adept, rose-gold hearts at Celestial) and a silvered face reflecting a room of light (a pearl ceiling, arched windows, a rose floor) that shifts as
    // it turns (yaw) and tilts down, a specular sweep crossing it, fresnel brightening as it turns away, a fine bevel at the face's edge, a soft inner
    // shade; faint hearts drifting in the reflection, its suspended heart of light, the lance's ripple. uv: its sprite (96 x 176) about its centre.
    // v_q.x mode + 10 x tier (0 the mirror, 1 its thickness swept back by v_q.y sprite px, 2 / 3 its left / right half, 4 a soft shadow on the floor);
    // v_q.y 4 x round(100 x its heart's size) + 2 + yaw; v_q.z 16 x round(100 x its heart's light) + 2 x seed + tilt; v_c: its heart (0..1), a flash, the ripple (0 none)
    float tier = floor(v_q.x / 10.0 + 0.01), md = v_q.x - tier * 10.0, a = 0.0; vec3 c = vec3(0.0);
    vec3 PE = vec3(1.0, 0.941, 0.969), BL = vec3(1.0, 0.718, 0.835), RO = vec3(1.0, 0.412, 0.706), DP = vec3(0.851, 0.294, 0.569), DE = vec3(0.561, 0.176, 0.451), RG = vec3(0.91, 0.686, 0.722), LV = vec3(0.847, 0.706, 1.0);
    if (md > 3.5) { float e = 1.0 - smoothstep(0.0, 1.0, r); a = e * e * 0.6; c = vec3(0.15, 0.04, 0.13); }
    else if (md > 0.5 && md < 1.5) { float off = v_q.y, hw = 48.0 + abs(off) * 0.5; vec2 p = vec2(u.x * hw + off * 0.5, u.y * 88.0); float d = lmAr(vec2(p.x - clamp(p.x, min(off, 0.0), max(off, 0.0)), p.y), 42.0, 84.0), w = clamp(p.x / (abs(off) > 0.01 ? off : 0.01), 0.0, 1.0);
      a = 1.0 - smoothstep(-0.8, 0.8, d); c = mix(DP * 0.8, DE * 0.45, w) * (0.75 + 0.25 * smoothstep(84.0, -84.0, p.y)) + RG * 0.35 * exp(-sq(d / 1.3)) * (1.0 - w); }
    else { float gi = floor(v_q.y / 4.0), yaw = v_q.y - gi * 4.0 - 2.0, grow = gi / 100.0, bi = floor(v_q.z / 16.0), rs = v_q.z - bi * 16.0, sd = floor(rs / 2.0), tilt = clamp((rs - sd * 2.0) / 0.999, 0.0, 1.0), hb = bi / 100.0;
      vec2 p = vec2(u.x * 48.0, u.y * 88.0); float dO = lmAr(p, 42.0, 84.0), dI = lmAr(p, 29.0, 71.0);
      a = 1.0 - smoothstep(-0.7, 0.7, dO); if (md > 1.5) a *= md < 2.5 ? 1.0 - smoothstep(-0.5, 0.5, p.x) : smoothstep(-0.5, 0.5, p.x);
      float ya = yaw + 0.07 * sin(u_t * 0.6 + sd * 1.9), cy = cos(ya), sy = -sin(ya), ta = tilt * 0.68, ct = cos(ta), st = sin(ta); vec3 Ld = normalize(vec3(-0.5, -0.62, 0.6)), Hv = normalize(Ld + vec3(0.0, 0.0, 1.0));
      vec2 gI = vec2(lmAr(p + vec2(0.6, 0.0), 29.0, 71.0) - lmAr(p - vec2(0.6, 0.0), 29.0, 71.0), lmAr(p + vec2(0.0, 0.6), 29.0, 71.0) - lmAr(p - vec2(0.0, 0.6), 29.0, 71.0)); gI /= max(length(gI), 1e-4);
      vec3 cf = vec3(0.0), cm = vec3(0.0);
      if (dI > -1.0) { // the frame
        float fw = clamp(dI / max(dI - dO, 0.01), 0.0, 1.0), dh = (lmFh(fw + 0.02) - lmFh(fw - 0.02)) / 0.04; vec3 n = lmRt(normalize(vec3(-gI * dh * 0.3, 1.0)), cy, sy, ct, st);
        float df = max(dot(n, Ld), 0.0), spc = pow(max(dot(n, Hv), 0.0), 40.0), gk = clamp((p.x / 42.0 + p.y / 84.0) * 0.5 + 0.5, 0.0, 1.0);
        vec3 base = mix(BL, RO, smoothstep(0.0, 0.36, gk)); base = mix(base, DP, smoothstep(0.36, 0.8, gk)); base = mix(base, mix(DP, DE, 0.5), smoothstep(0.8, 1.0, gk));
        cf = base * (0.58 + 0.62 * df) + PE * spc * 0.8 + BL * sq(1.0 - n.z) * 0.25;
        float dw = lmAr(p, 37.5, 79.5), wv = 1.0 - smoothstep(0.75, 1.15, abs(dw)); if (wv > 0.0) cf = mix(cf, lmMt(lmRt(vec3(gI * clamp(dw / 0.95, -1.0, 1.0), sqrt(max(0.0, 1.0 - sq(dw / 0.95)))), cy, sy, ct, st), Ld, Hv), wv);
        if (tier > 1.5) { float d2 = lmAr(p, 35.2, 77.2), w2 = 1.0 - smoothstep(0.35, 0.65, abs(d2)); if (w2 > 0.0) cf = mix(cf, lmMt(lmRt(vec3(gI * clamp(d2 / 0.5, -1.0, 1.0), sqrt(max(0.0, 1.0 - sq(d2 / 0.5)))), cy, sy, ct, st), Ld, Hv) * 0.9, w2 * 0.85);
          float an = atan(p.y + 42.0, p.x), bi2 = clamp(floor((an + 3.1415927) / 0.3926991 + 0.5), 1.0, 7.0), ba = -3.1415927 + bi2 * 0.3926991; vec2 bp = vec2(cos(ba), sin(ba)) * 39.6 + vec2(0.0, -42.0);
          vec2 bs = vec2(sign(p.x) * 39.6, -30.0 + 16.0 * clamp(floor((p.y + 30.0) / 16.0 + 0.5), 0.0, 5.0)); if (p.y > -42.0 || length(p - bs) < length(p - bp)) bp = bs;
          vec2 bq = (p - bp) / 1.9; float br = length(bq); if (br < 1.3) { vec3 nb = lmRt(vec3(bq * min(br, 1.0) / max(br, 1e-3), sqrt(max(0.0, 1.0 - br * br))), cy, sy, ct, st);
            vec3 pc = PE * (0.62 + 0.42 * max(dot(nb, Ld), 0.0)) + vec3(1.0) * pow(max(dot(nb, Hv), 0.0), 50.0) * 0.9 + LV * sq(1.0 - nb.z) * 0.25; pc = mix(pc, vec3(0.62, 0.38, 0.42), exp(-sq((br - 1.0) / 0.18)) * 0.4); cf = mix(cf, pc, 1.0 - smoothstep(1.0, 1.25, br)); } }
        if (tier > 2.5) { vec2 hq = vec2((p.x - sign(p.x) * 38.0) / 8.4, (13.4 - p.y) / 8.4); float d3 = hsd(hq) * 8.4; if (d3 < 1.5) { vec2 g3 = vec2(hsd(hq + vec2(0.02, 0.0)) - hsd(hq - vec2(0.02, 0.0)), hsd(hq + vec2(0.0, 0.02)) - hsd(hq - vec2(0.0, 0.02))); g3 = vec2(g3.x, -g3.y) / max(length(g3), 1e-4);
            float e3 = clamp(-d3 / 3.0, 0.0, 1.0); vec3 hc = lmMt(lmRt(normalize(vec3(g3 * (1.0 - e3) * 1.4, 0.5 + e3)), cy, sy, ct, st), Ld, Hv); hc = mix(hc, DE * 0.8, exp(-sq(d3 / 0.6)) * 0.8); hc = mix(hc, PE, (1.0 - smoothstep(1.0, 1.6, length(p - vec2(sign(p.x) * 38.0 - 1.6, 6.8)))) * 0.9);
            cf = mix(cf, hc, 1.0 - smoothstep(-0.2, 0.6, d3)); } }
        cf = mix(cf, DE * 0.7, exp(-sq(dO / 0.8)) * 0.6); cf = mix(cf, DE * 0.75, exp(-sq(dI / 0.9)) * 0.65); cf += (PE * 0.45 + RO * 0.15) * v_c.g * (0.5 + 0.5 * df); }
      if (dI < 1.0) { // the face: the room of light reflected (its view widening with the face: a near viewer), tinted pink silver, lavender to its foot
        vec3 N = vec3(-sin(ya) * ct, st, cy * ct), V = normalize(vec3(p.x * 0.007, p.y * 0.0055 + 0.08, -1.0)), R = reflect(V, N); float el = -R.y, az = atan(R.x, R.z) + sd * 0.83;
        float wx = abs(fract(az / 0.9 + 0.5) - 0.5) * 0.9, wt = 0.34 + 0.09 * sqrt(max(0.0, 1.0 - sq(wx / 0.14)));
        vec3 sky = mix(vec3(1.0, 0.86, 0.93), vec3(1.0, 0.98, 1.0), smoothstep(0.0, 0.45, el)), flr = mix(vec3(0.95, 0.74, 0.9), vec3(0.8, 0.44, 0.7), smoothstep(0.0, 0.45, -el));
        cm = mix(flr, sky, smoothstep(-0.03, 0.03, el)) + LV * exp(-sq(el / 0.045)) * 0.22 + RO * exp(-sq((el + 0.17) / 0.04)) * 0.3 * (0.6 + 0.4 * sin(az * 3.0 + u_t));
        float win = (1.0 - smoothstep(0.125, 0.145, wx)) * smoothstep(0.05, 0.07, el) * (1.0 - smoothstep(wt - 0.015, wt, el)), mul = max(1.0 - smoothstep(0.006, 0.012, wx), 1.0 - smoothstep(0.005, 0.01, abs(el - 0.2)));
        cm = mix(cm, mix(vec3(1.0, 0.99, 1.0), vec3(0.95, 0.8, 0.9), mul * 0.85), win * 0.8);
        cm *= vec3(0.97, 0.9, 0.95); cm = mix(cm, cm * mix(vec3(1.0), LV, 0.6), smoothstep(5.0, 71.0, p.y) * 0.5);
        for (int k = 1; k <= 3; k++) { float fq = float(k); if (fq > (tier > 1.5 ? 3.5 : 1.5)) break; vec2 o = vec2(sin(u_t * 0.9 + sd * 1.3 + fq * 2.0) * 11.5 * fq, -7.0 * fq + cos(u_t * 0.7 + fq) * 3.5); float kk = 45.0 * (0.95 - 0.15 * fq) / 1.2, d4 = hsd(vec2((p.x - o.x) / kk, 0.55 - (p.y - o.y) / kk)) * kk;
          cm = mix(cm, mod(fq, 2.0) > 0.5 ? LV : BL, (1.0 - smoothstep(-5.0, 3.0, d4)) * (0.34 - 0.07 * fq) * 1.2); }
        cm = mix(cm, PE, (1.0 - abs(dot(V, N))) * 0.6);   /* (fresnel: whiter as it turns away) */
        float sx = (fract((u_t * 0.45 + sd * 0.37) / 1.6) * 1.6 - 0.8) * 134.0, xr = (p.x - sx) * 0.9 + p.y * 0.435; cm += PE * (exp(-sq(xr / 10.0)) * 0.42 + exp(-sq((xr - 15.0) / 2.2)) * 0.3);
        if (md < 0.5 && v_c.r > 0.01) { float kk = 45.0 * grow / 1.2; vec2 hp = vec2(p.x / kk, 0.55 - p.y / kk); float d5 = hsd(hp), rc = length(hp - vec2(-0.07, 0.64));   /* (its suspended heart of light, glossy, in the glass) */
          vec3 hc = mix(PE, BL, smoothstep(0.0, 0.22, rc)); hc = mix(hc, RO, smoothstep(0.2, 0.55, rc)); hc = mix(hc, DP, smoothstep(0.52, 0.85, rc)); hc = hc * (0.8 + 0.45 * hb) + PE * exp(-sq(length(hp - vec2(-0.27, 0.8)) / 0.09)) * 0.7;
          cm = mix(cm, RO, exp(-max(d5, 0.0) / 0.22) * step(0.0, d5) * 0.4 * v_c.r * (0.6 + 0.6 * hb)); cm = mix(cm, min(hc, vec3(1.0)), (1.0 - smoothstep(-0.02, 0.02, d5)) * (0.35 + 0.65 * v_c.r)); }
        if (md < 0.5 && v_c.b > 0.01) { float rp = v_c.b, kk = 45.0 * 1.15 * (0.5 + 1.4 * rp) / 1.2, d6 = hsd(vec2(p.x / kk, 0.55 - p.y / kk)) * kk, rr = length(p / vec2(1.0, 1.3)) - 96.0 * (0.2 + 0.6 * rp);
          cm += (PE * exp(-sq(d6 / 1.4)) * 0.8 + RO * exp(-sq(d6 / 4.5)) * 0.35 + PE * exp(-sq(rr / 1.2)) * 0.6) * (1.0 - rp); }
        cm *= 1.0 - 0.32 * exp(min(dI, 0.0) / 4.5); float bv = smoothstep(-3.0, -1.6, dI) * (1.0 - smoothstep(-0.9, -0.2, dI)), bl = dot(-gI, vec2(-0.63, -0.78)); cm += PE * bv * max(bl, 0.0) * 0.75 - cm * bv * max(-bl, 0.0) * 0.25; }
      c = mix(cf, cm, 1.0 - smoothstep(-0.5, 0.5, dI)); }
    a *= v_c.a; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 63.5 && v_k < 66.5) { // (v412 SA) satin ribbons, each ONE continuous strip (Q.satin): 64 its body (solid), 65 the light along its edges (added); 66 a soft contact shadow (solid, a quad)
    // a strip's vertex: uv (arc length along, signed px across), v_q (its twist, its half width px, its direction on screen), v_c (flash, pale edges or glow reach px, palette + trim, alpha)
    if (v_k > 65.5) { float a = v_c.a * exp(-r * r * 2.8) * (1.0 - smoothstep(0.7, 1.0, r)); gl_FragColor = vec4(v_c.rgb * a, a); }
    else { float hw = max(v_q.y, 0.05), ed = hw - abs(v_uv.y), s = clamp(v_uv.y / hw, -1.0, 1.0), pal = floor(v_c.b + 0.01), trim = v_c.b - pal, ar = v_uv.x;
      // the cross-section bows gently and rolls in slow soft folds along the ribbon: the normal's turn about the ribbon at this pixel; the face
      // shown flips where the twist turns it edge-on (a soft crease there), the underside lit by the reversed normal
      float ph = v_q.x + 0.9 * s + 0.1 * sin(ar * 0.8 - s * 1.2 + pal * 1.7) + 0.05 * sin(ar * 1.9 + s * 1.6), cf = cos(v_q.x + 0.3 * s), face = smoothstep(-0.07, 0.07, cf);
      vec3 T = vec3(cos(v_q.z), sin(v_q.z), 0.0), N = vec3(-T.y * sin(ph), T.x * sin(ph), cos(ph)), LD = vec3(-0.6, -0.62, 0.5), HV = normalize(LD + vec3(0.0, 0.0, 1.0)), hp = HV - T * dot(HV, T);
      float hl = length(hp), an = hl * hl * hl, dT = dot(N, LD), hT = dot(N, hp) / max(hl, 0.001);   /* (fibres along the ribbon: anisotropic, its sheen a band across it where the twist faces the light, dimmer where it runs toward the light) */
      float bS = an * pow(max(hT, 0.0), 10.0), sS = an * pow(max(hT, 0.0), 34.0), bB = an * pow(max(-hT, 0.0), 6.0);   /* (a broad soft sheen with a brighter core: satin, never a razor line) */
      float lift = pal < 0.5 ? 0.08 : 0.0;   /* (Eternal Light's satin is a ribbon of light: lifted) */
      vec3 cT = satTop(pal, 0.16 + lift + 0.56 * max(dT, 0.0) + 0.08 * dT + 0.3 * bS) + vec3(1.0, 0.84, 0.93) * (0.3 * sS + 0.05 * bS);
      vec3 cB = satBack(pal, 0.12 + lift * 2.0 + 0.6 * max(-dT, 0.0) + 0.12 * bB);   /* (the back is matte) */
      vec3 c = mix(cB, cT, face) * (1.0 - 0.22 * exp(-cf * cf * 60.0));
      float eg = (1.0 - smoothstep(0.0, 0.8 + hw * 0.1, ed)) * smoothstep(0.5, 3.0, hw); c = mix(c, vec3(1.0, 0.95, 0.98), v_c.g * eg * mix(0.25, 0.6, face) * (0.6 + 0.5 * max(dot(N * sign(cf), LD), 0.0)));   // pale selvedges
      if (pal < 0.5) c = mix(c, vec3(1.0, 0.94, 0.97), trim * exp(-s * s / 0.02) * mix(0.35, 0.9, face));   // (Eternal Light) a pearl centre stripe
      else c = mix(c, vec3(0.91, 0.69, 0.72), trim * exp(-sq((abs(s) - 0.55) * hw / 0.9)) * face * 0.8);   // rose-gold trim lines
      c += v_c.r * 0.4 * vec3(1.0, 0.9, 0.96);
      if (v_k < 64.5) { float a = v_c.a * smoothstep(-0.5, 0.5, ed); gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
      else { float gw = max(v_c.g, 0.5); vec3 gc = pal > 1.5 && pal < 2.5 ? vec3(1.0, 0.75, 0.88) : vec3(1.0, 0.36, 0.75);
        float e2 = max(ed, 0.0); vec3 L = (gc * 0.45 * exp(-e2 / gw) + vec3(1.0, 0.92, 0.97) * 0.7 * exp(-sq(e2 - 0.6) / 0.6) * (0.4 + 0.6 * face)) * smoothstep(-0.5, 0.5, ed) * (1.0 + v_c.r) * v_c.a * smoothstep(1.5, 3.0 + 3.0 * gw, hw);   /* (inside its edges only, so its folds never stack; a narrow stretch keeps its colour) */ L = min(L, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); } } }
  else if (v_k > 52.5 && v_k < 58.5 && (v_k < 54.5 || v_k > 55.5)) { // (v404 DK) Dark's solids: 53 void smoke, 54 a cut's body, 56 a sphere of darkness, 57 a rift, 58 a crystal shard
    vec3 c = vec3(0.0); float a = 0.0;
    if (v_k < 53.5) { // void smoke: billowing violet-black, curling, a violet rim where it thins (v_q.x), crimson embers deep in it (v_q.z); v_q.y seed
      vec2 w = u + 0.28 * vec2(fbm(u * 1.6 + vec2(v_q.y, t * 0.22)) - 0.5, fbm(u * 1.6 + vec2(v_q.y + 4.1, -t * 0.27)) - 0.5); float rr = length(w), f = fbm(w * 2.3 + vec2(v_q.y * 3.1, v_q.y - t * 0.38)), g = fbm(w * 5.2 + vec2(-t * 0.5, v_q.y * 2.0));
      float d = clamp((1.0 - rr * rr) * (0.25 + 1.5 * f * f) - 0.14, 0.0, 1.0) * (1.0 - smoothstep(0.75, 1.0, r)) * (0.75 + 0.5 * g), rim = smoothstep(0.0, 0.08, d) * (1.0 - smoothstep(0.08, 0.3, d));
      c = mix(col * 0.4, col, smoothstep(-0.6, 0.6, -u.y + f * 0.6)) * (0.7 + 0.55 * g) + vec3(0.55, 0.3, 0.95) * rim * v_q.x * (0.45 + 0.55 * g) + vec3(0.85, 0.08, 0.25) * v_q.z * smoothstep(0.55, 0.85, g) * smoothstep(0.3, 0.7, d);
      a = smoothstep(0.0, 0.55, d) * 0.9; }
    else if (v_k < 54.5) { // a cut's crescent body: translucent indigo-black, densest at the sharp outer edge, its inner side breaking into smoke; v_q.x span, v_q.y its strength at the tail, v_q.z thickness
      vec3 B = dcr(u, v_q.x, v_q.z); float d = B.x, v = clamp(B.y, 0.0, 1.0), sl = atan(u.y, u.x) * r, f = fbm(vec2(sl * 3.0 + t * 1.4, d * 2.2 + v_q.x * 3.0)), lim = 1.0 + 0.4 * (f - 0.5) + 0.2 * v, e = clamp(1.0 - d, 0.0, 1.0);
      a = (0.26 + 0.5 * pow(e, 1.4)) * (0.7 + 0.5 * f) * (1.0 - smoothstep(lim - 0.55, lim, d)) * smoothstep(-0.05, 0.02, d) * mix(1.0, v_q.y, v) * B.z;
      c = mix(vec3(0.04, 0.015, 0.09), vec3(0.3, 0.11, 0.52), pow(e, 1.6)); }
    else if (v_k < 56.5) { // a sphere of darkness: a turning globe of void, violet currents swirling in it, a violet limb, fissures of light opening
      // as it strains (v_q.x 0..1); v_q.y seed; v_q.z 1: a dome (its lower half below the floor)
      a = 1.0 - smoothstep(0.9, 1.0, r); vec3 n = vec3(u, sqrt(max(0.0, 1.0 - r * r))); float ang = t * 0.9 + v_q.y, ca = cos(ang), sa = sin(ang); vec3 p = vec3(n.x * ca + n.z * sa, n.y, -n.x * sa + n.z * ca);
      vec2 q = vec2(fbm3(p * 2.0 + vec3(0.0, t * 0.4, v_q.y)), fbm3(p * 2.0 + vec3(4.3, -t * 0.3, 1.7)));
      float f = fbm3(p * 3.0 + vec3(q * 2.5, t * 0.2)), sw = smoothstep(0.45, 0.8, f), lit = clamp(dot(n, vec3(-0.45, -0.6, 0.66)), 0.0, 1.0), fres = pow(1.0 - n.z, 2.4);
      float rg = 1.0 - abs(fbm3(p * 3.4 + vec3(q * 1.2, v_q.y)) * 2.0 - 1.0), rg2 = 1.0 - abs(fbm3(p * 7.0 - vec3(q * 0.8, v_q.y)) * 2.0 - 1.0), fis = (smoothstep(0.93 - 0.08 * v_q.x, 0.985, rg) + 0.35 * smoothstep(0.95 - 0.06 * v_q.x, 0.99, rg2)) * min(1.0, v_q.x * 1.6);
      c = mix(vec3(0.02, 0.012, 0.045), vec3(0.13, 0.055, 0.24), lit * 0.8 + sw * 0.5) + vec3(0.43, 0.16, 0.66) * sw * 0.35 * (1.0 - fres);
      c += vec3(0.65, 0.36, 1.0) * fres * 0.95 + vec3(0.82, 0.09, 0.25) * pow(1.0 - n.z, 6.0) * 0.5 + vec3(0.92, 0.85, 1.0) * pow(lit, 30.0) * 0.25 + mix(vec3(1.0, 0.25, 0.45), vec3(1.0, 0.9, 1.0), clamp(fis - 0.5, 0.0, 1.0)) * fis * 1.3 + vec3(0.65, 0.36, 1.0) * exp(-sq((rg - 0.9) / 0.05)) * v_q.x * 0.35;
      if (v_q.z > 0.5) a *= 1.0 - smoothstep(-0.02, 0.06, u.y); }
    else if (v_k < 57.5) { // a rift torn in the air (uv.y along it, uv.x across): a black slit between ragged lips lit violet from within, a violet
      // haze round it; v_q.x its opening 0..1, v_q.y seed
      float y = u.y, f = fbm(vec2(y * 3.0 + v_q.y, t * 0.8)), g = fbm(vec2(y * 7.0 - t * 1.3, u.x * 2.0 + v_q.y)), w = 0.6 * pow(max(0.0, 1.0 - y * y), 0.75) * v_q.x * (0.8 + 0.4 * f), x = abs(u.x + (f - 0.5) * 0.16 * (1.0 - y * y));
      float inner = 1.0 - smoothstep(w * 0.5, w * 0.72, x), lip = exp(-sq((x - w * 0.62) / max(w * 0.2, 0.012))), hz = exp(-max(x - w * 0.6, 0.0) / max(w * 0.7, 0.03)) * (1.0 - inner) * (1.0 - smoothstep(0.7, 1.0, abs(y)));
      c = vec3(0.012, 0.004, 0.03) * inner + vec3(0.62, 0.34, 1.0) * lip * (0.6 + 0.5 * g) + vec3(0.25, 0.1, 0.45) * hz * 0.35; a = clamp(inner + lip * 0.9 + hz * 0.35, 0.0, 1.0) * (1.0 - smoothstep(0.8, 1.0, abs(y))); c = min(c + vec3(0.95, 0.88, 1.0) * pow(lip, 5.0) * 0.5 * a, vec3(1.0)); c /= max(a, 0.001); }
    else { // a shard of black crystal: a faceted kite (its long point up), four facets lit from the upper left (v_q.x turns the light), violet
      // light along its ridges and edges (v_q.z), a glint; v_q.y seed
      float sk = 0.32 + 0.22 * h1(vec2(v_q.y, 1.3)), m = -0.2 + 0.15 * h1(vec2(v_q.y, 7.1)), x = u.x, y = u.y, pr = y < m ? (y + 0.98) / (m + 0.98) : (0.72 - y) / (0.72 - m), e = 1.0 - abs(x) / max(sk * pr, 0.001);
      a = smoothstep(0.0, 0.1, e) * step(-0.98, y) * step(y, 0.72); float la = v_q.x, sx = x < 0.0 ? -1.0 : 1.0; vec3 n = normalize(vec3(sx * 0.62, y < m ? -0.45 : 0.42, 0.66)), Ld = normalize(vec3(-0.5 * cos(la) - 0.3 * sin(la), -0.6 * cos(la) + 0.4 * sin(la), 0.62));
      float df = max(dot(n, Ld), 0.0), sp = pow(max(dot(n, normalize(Ld + vec3(0.0, 0.0, 1.0))), 0.0), 40.0), rid = exp(-sq(x / 0.035)) * 0.6 + exp(-sq((y - m) / 0.04)) * 0.4, ed = exp(-sq(e / 0.14));
      c = vec3(0.035, 0.02, 0.07) + vec3(0.2, 0.12, 0.34) * df * df + vec3(0.95, 0.9, 1.0) * sp * 0.7 + vec3(0.65, 0.36, 1.0) * (rid * 0.35 + ed * 0.6) * (0.35 + v_q.z); }
    a *= v_c.a * pk; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 59.5 && v_k < 63.5) { // (v409 DK2, Umbra Heart; 63 Requiem's portal) 60 its heart of glossy shadow, 61 a pool of liquid shadow, 62 a strand or drop of it (solids)
    vec3 c = vec3(0.0); float a = 0.0; vec3 VI = vec3(0.65, 0.36, 1.0), EN = vec3(0.43, 0.16, 0.66), BD = vec3(0.094, 0.043, 0.18);
    if (v_k < 60.5) { // the heart (its own curve, in heart units: uv x 1.25 about its visual centre), a thick slab turned about the vertical: the
      // near face at v_q.x (heart units), its side band swept back to -v_q.x. v_q.y seed; v_q.z its tier (0..2) + its fissures' base light x 0.9;
      // v_c.rgb: the inner light, the beat's flash, the widening (the end)
      vec2 hp = u * 1.25 + vec2(0.0, 0.295); float nh = v_q.x, sd = v_q.y, tier = floor(v_q.z), crk = fract(v_q.z) / 0.9, inn = v_c.r, fl = v_c.g, wide = v_c.b;
      vec3 F = uhd(hp - vec2(nh, 0.0)); float db = F.x; for (int i = 0; i < 4; i++) db = min(db, uhd(hp - vec2(nh * (-1.0 + 0.5 * float(i)), 0.0)).x);
      float yy = clamp((hp.y + 0.56) / 1.71, 0.0, 1.0); vec3 bc = mix(vec3(0.243, 0.173, 0.322), vec3(0.169, 0.043, 0.271), smoothstep(0.0, 0.3, yy)); bc = mix(bc, BD, smoothstep(0.3, 0.68, yy)); bc = mix(bc, vec3(0.11, 0.043, 0.2), smoothstep(0.68, 0.88, yy)); bc = mix(bc, vec3(0.227, 0.09, 0.392), smoothstep(0.88, 1.0, yy));
      bc *= 0.75 + 0.25 * smoothstep(-0.05, -0.0, -abs(db + 0.03)); bc *= 1.0 - 0.75 * exp(-sq(db / 0.018));   /* (the band: lit on top, a violet bounce from the pool beneath, inked) */
      float ins = -F.x; vec2 q = hp - vec2(nh, 0.0), od = F.yz; float e = clamp(ins / 0.34, 0.0, 1.0), sl = (1.0 - e) / max(sqrt(max(1.0 - sq(1.0 - e), 0.0)), 0.1);
      vec2 g = od * min(sl, 3.5) * 0.55; for (int i = 0; i < 2; i++) { vec2 dq = q - vec2(i == 0 ? -0.46 : 0.46, -0.18); g += dq * 2.2 * exp(-dot(dq, dq) / 0.2) * 0.5; }
      vec3 n = normalize(vec3(g, 1.0)), Ld = normalize(vec3(-0.5 - nh * 1.2, -0.62, 0.6)); float dif = max(dot(n, Ld), 0.0), fres = pow(1.0 - n.z, 1.8);
      vec3 fc = mix(BD * 0.8, vec3(0.44, 0.33, 0.57), pow(dif, 1.7) * 0.9); fc *= 1.0 - 0.55 * smoothstep(-0.2, 1.3, q.x * 0.55 + (q.y - 0.25) * 0.75); fc += vec3(0.17, 0.06, 0.27) * exp(-sq(length((q - vec2(0.0, 0.4)) * vec2(1.0, 1.1)) / 0.55)) * 0.6;
      if (tier > 0.5) { float nc = tier > 1.5 ? 4.0 : 2.0; for (int j = 0; j < 4; j++) { if (float(j) >= nc) break; float dir = mod(float(j), 2.0) > 0.5 ? -1.0 : 1.0, ph = u_t * (0.5 + 0.18 * float(j)) * dir + float(j) * 2.3, y0 = -0.3 + float(j) * 1.1 / nc + 0.06 * sin(u_t * 0.4 + float(j) * 1.7);
          float cy2 = y0 + 0.08 * sin(q.x * 3.1 + ph) + 0.03 * sin(q.x * 7.0 - ph * 1.6), dd = abs(q.y - cy2); fc = mix(fc, vec3(0.2, 0.13, 0.28), exp(-sq(dd / 0.05)) * 0.45 * (1.0 - fres)); fc += EN * exp(-sq(dd / 0.014)) * (0.25 + 0.3 * fl) * (1.0 - fres); } }   /* (Adept: currents under the surface; Celestial: four, crossing) */
      fc += VI * inn * exp(-dot(q - vec2(0.0, 0.32), q - vec2(0.0, 0.32)) / 0.42) * (0.25 + 0.5 * (1.0 - dif)) * 0.7 + EN * inn * 0.12;
      vec2 fq = q * vec2(1.0, 0.9) + vec2(sd * 0.37, sd * 0.61); float rg = 1.0 - abs(fbm(fq * 2.4) * 2.0 - 1.0), rg2 = 1.0 - abs(fbm(fq * 4.6 + 3.7) * 2.0 - 1.0), w = 0.035 + 0.075 * wide;
      float fis = (smoothstep(1.0 - w, 1.0 - w * 0.2, rg) + 0.45 * smoothstep(1.0 - w * 0.7, 1.0 - w * 0.12, rg2)) * smoothstep(0.03, 0.12, ins), hal = smoothstep(1.0 - w * 4.0, 1.0 - w, rg) * smoothstep(0.03, 0.12, ins);
      float bl = 0.0; for (int i = 0; i < 3; i++) { if (float(i) >= (tier > 1.5 ? 3.0 : tier > 0.5 ? 1.0 : 0.0)) break; float yb = -0.6 + fract(u_t * (0.22 + 0.09 * float(i)) + float(i) * 0.37) * 1.9; bl += max(0.0, 1.0 - abs(q.y - yb) / 0.22) * 0.7; }
      float tr = tier > 0.5 ? smoothstep(0.82, 0.97, fract(rg2 * 3.0 + q.x * 0.7 - u_t * 0.6)) * 0.5 : 0.0, br = min(1.7, crk * (0.55 + 0.45 * sin(u_t * 1.7 + q.x * 2.3 + q.y * 1.3 + sd)) + fl * 0.85 + wide * 0.9 + bl + tr * fis);
      fc += EN * hal * br * (0.32 + 0.3 * wide); fc = mix(fc, VI, clamp(fis * br * 0.9, 0.0, 1.0)); fc += vec3(0.85, 0.72, 1.0) * fis * max(br - 0.6, 0.0) * (0.9 + 0.6 * wide);
      vec3 Hh = normalize(Ld + vec3(0.0, 0.0, 1.0)); float nh2 = max(dot(n, Hh), 0.0); fc += vec3(0.96, 0.94, 1.0) * (pow(nh2, 70.0) * 0.95 + pow(nh2, 9.0) * 0.12);
      float shp = q.x * 0.9 + q.y * 0.44 - (nh * 2.5 + 0.12 * sin(u_t * 0.5)); fc += vec3(0.82, 0.68, 1.0) * exp(-sq(shp / 0.22)) * 0.13 * (0.4 + dif);   /* (a sheen sliding over it as it turns) */
      fc += VI * fres * clamp(dot(od, vec2(0.55, 0.83)), 0.0, 1.0) * 0.75 + vec3(0.82, 0.68, 1.0) * fres * clamp(dot(od, vec2(-0.7, -0.7)), 0.0, 1.0) * 0.18;
      fc *= 1.0 - 0.8 * exp(-sq(ins / 0.016)); fc += VI * 0.35 * exp(-sq((ins - 0.03) / 0.012)) * clamp(dot(od, vec2(0.55, 0.83)), 0.0, 1.0);
      float af = smoothstep(-0.008, 0.008, ins), ab = smoothstep(-0.008, 0.008, -db); c = mix(bc, fc, af); a = max(af, ab); }
    else if (v_k < 61.5) { // a pool of liquid shadow on the floor (uv a unit disc): a dark translucent surface, its edge breathing in lobes (v_q.z), a slow
      // liquid sheen and glints, veins beneath lit by the beat (v_q.x), the heart's violet light reflected in it; v_q.y seed; v_c tints its depth
      float an = atan(u.y, u.x), sd = v_q.y, lb = v_q.z, rim = 0.84 + lb * (0.06 * sin(an * 3.0 + sd + t * 0.6) + 0.045 * sin(an * 5.0 - t * 0.9 + sd * 2.0) + 0.06 * (fbm(vec2(an * 1.6 + sd, t * 0.25)) - 0.5)), e = r / rim;
      vec2 sp = u * 2.6 + vec2(sd * 1.3, sd * 0.7) + vec2(t * 0.12, -t * 0.09); float h0 = fbm(sp), hx = fbm(sp + vec2(0.06, 0.0)), hy = fbm(sp + vec2(0.0, 0.06));
      vec3 n = normalize(vec3((h0 - hx) * 7.0, (h0 - hy) * 7.0, 1.0)); float spc = pow(max(dot(n, normalize(vec3(-0.25, -0.75, 0.6))), 0.0), 30.0);
      c = mix(vec3(0.024, 0.014, 0.05), v_c.rgb * 0.4 + vec3(0.06, 0.025, 0.1), smoothstep(0.35, 0.95, e)) + vec3(0.06, 0.03, 0.1) * h0;
      float vr = 1.0 - abs(fbm(vec2(an * 2.2 + r * 1.5 + sd, r * 3.2 - t * 0.08)) * 2.0 - 1.0), vn = smoothstep(0.87, 0.975, vr) * smoothstep(0.08, 0.3, e) * (1.0 - smoothstep(0.85, 1.0, e));
      c += VI * vn * (0.12 + 0.9 * v_q.x) + EN * smoothstep(0.7, 0.95, vr) * v_q.x * 0.35 * (1.0 - smoothstep(0.85, 1.0, e)) + EN * exp(-dot(u - vec2(0.0, -0.05), u - vec2(0.0, -0.05)) * 2.6) * (0.12 + 0.4 * v_q.x);
      c += vec3(0.78, 0.66, 1.0) * spc * 0.55 * (1.0 - smoothstep(0.75, 1.0, e)) + vec3(0.4, 0.22, 0.62) * exp(-sq((e - 0.86) / 0.05)) * 0.28;
      a = (1.0 - smoothstep(0.8, 1.0, e)) * mix(0.86, 0.66, smoothstep(0.35, 0.85, e)); }
    else if (v_k < 62.5) { // a strand or a drop of liquid shadow (uv.x across in its half-widths, uv.y along: -1 its root .. 1 its bulb's foot): v_q.x its half-length
      // over its half-width, v_q.y its neck's half-width, v_q.z its root's (both in half-widths); a bulb of radius 0.92 at the foot
      float asp = max(v_q.x, 1.0); vec2 p = vec2(u.x, u.y * asp), pb = p - vec2(0.0, asp - 0.95); float dbb = length(pb) - 0.92, v = clamp((p.y + asp) / max(2.0 * asp - 0.95, 0.01), 0.0, 1.0);
      float hw = mix(v_q.z, v_q.y, smoothstep(0.0, 0.75, v)), dn = abs(p.x) - hw, k = 0.35, hh = clamp(0.5 + 0.5 * (dn - dbb) / k, 0.0, 1.0), d = mix(dn, dbb, hh) - k * hh * (1.0 - hh);
      a = (1.0 - smoothstep(-0.05, 0.04, d)) * smoothstep(-asp, -asp + 0.3, p.y);
      vec2 nx = mix(vec2(clamp(p.x / max(hw, 0.04), -1.0, 1.0), -0.15), pb / 0.92, hh); vec3 n = normalize(vec3(nx * 0.92, sqrt(max(0.06, 1.0 - dot(nx, nx) * 0.85))));
      float dif = max(dot(n, normalize(vec3(-0.55, -0.55, 0.62))), 0.0), fr = pow(1.0 - n.z, 1.6), spc = pow(max(dot(n, normalize(vec3(-0.35, -0.4, 1.0))), 0.0), 50.0);
      c = mix(BD * 0.85, vec3(0.4, 0.3, 0.55), pow(dif, 1.8) * 0.75) + VI * fr * clamp(dot(nx, vec2(0.6, 0.8)), 0.0, 1.0) * 0.8 + vec3(0.92, 0.88, 1.0) * spc * 0.95;
      c *= 1.0 - 0.7 * exp(-sq(d / 0.07)); }
    else { // (Requiem) a portal (uv a unit disc, squashed by its quad): a hollow of void opened to v_q.x, violet currents spiralling down into
      // it (v_q.z their turn), a ragged lip of void smoke, a crisp flickering rim of violet light with a pale core; v_q.y seed
      float an = atan(u.y, u.x), sd = v_q.y, R = 0.8 * max(v_q.x, 0.02), ln = fbm(vec2(an * 2.6 + sd, t * 0.7)) - 0.5, ed = R * (1.0 + 0.07 * ln), e = r - ed, rr = clamp(r / ed, 0.0, 1.0);
      float sp = an * 2.0 + log(max(r / max(R, 0.05), 0.03)) * 2.6 - t * 1.7 * v_q.z, arm = pow(0.5 + 0.5 * sin(sp * 3.0 + (fbm(u * 3.0 + sd) - 0.5) * 4.0), 3.0);
      vec3 hole = mix(vec3(0.008, 0.004, 0.02), EN * 0.75 + VI * 0.12 * arm, arm * smoothstep(0.15, 1.0, rr) * 0.85) + VI * 0.35 * smoothstep(0.75, 1.0, rr) * (0.6 + 0.4 * arm);
      float fk = 0.75 + 0.4 * fbm(vec2(an * 5.0 - t * 2.6, sd + t)), rim = exp(-sq(e / (0.03 + 0.012 * ln))) * fk, core = exp(-sq(e / 0.011)) * fk;
      float lip = (1.0 - smoothstep(0.0, 0.13 + 0.08 * fbm(vec2(an * 4.0 - sd, t * 0.5)), e)) * step(0.0, e) * 0.75;
      vec3 lc = mix(vec3(0.07, 0.03, 0.12), BD, 0.5);
      float ins = 1.0 - smoothstep(-0.012, 0.004, e); c = mix(lc, hole, ins); a = max(ins, lip); c = mix(c, VI * 1.15, clamp(rim, 0.0, 1.0)); c = mix(c, vec3(0.93, 0.88, 1.0), clamp(core * 0.8, 0.0, 1.0)); a = max(a, clamp(rim * 1.2, 0.0, 1.0));
      a *= 1.0 - smoothstep(0.92, 1.0, r); }
    a *= v_c.a; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 15.5 && v_k < 16.5) { // (v346, Thunderstorm) a storm cloud (solid): billowing lobes of night violet, darker beneath, a cool rim
    // of light along the top, lit from within by its lightning (v_q.x) in electric blue-white; v_c its colour, v_q.y seed
    float f = fbm(u * 1.9 + vec2(v_q.y, t * 0.07)), g = fbm(u * 4.4 + vec2(-t * 0.11, v_q.y * 2.3)), d = clamp((1.0 - dot(u, u)) * (0.35 + 1.25 * f * f) - 0.12, 0.0, 1.0);
    float rim = smoothstep(0.02, 0.16, d) * (1.0 - smoothstep(0.16, 0.5, d)); d = smoothstep(0.0, 0.42, d) * (0.8 + 0.2 * g); float top = clamp(-u.y * 0.85 + (f - 0.5) * 1.1 + 0.1, 0.0, 1.0), cav = smoothstep(0.35, 0.75, g);
    vec3 c = mix(vec3(0.04, 0.03, 0.1), col, 0.22 + 0.55 * top) * (0.4 + 0.9 * cav) + vec3(0.62, 0.7, 1.0) * pow(top, 3.0) * 0.35 + vec3(0.55, 0.6, 1.0) * rim * (0.25 + 0.5 * top);   /* (dark folds, lit billows, a silver lining) */
    c += vec3(0.5, 0.82, 1.0) * v_q.x * (0.3 + 1.1 * f * cav) * exp(-dot(u, u) * 1.2);
    float a = d * v_c.a * pk; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 11.5 && v_k < 12.5) { // (v342, Apocalypse) a great sphere of fire (solid), seen as a turning globe: domain-warped
    // turbulence over its surface (3D noise on the sphere, so nothing stretches), a crust of cooler crimson plasma lit from the
    // upper left, hotter fire welling up through it, ridged molten veins that brighten and widen as it grows unstable
    // (v_q.z), a limb glowing hot where the fire is seen edge-on; v_c its crust colour, v_q.x heat, v_q.y seed
    float a = 1.0 - smoothstep(0.965, 1.0, r), inst = v_q.z; vec3 n = vec3(u, sqrt(max(0.0, 1.0 - r * r)));
    float ang = t * 0.16 + v_q.y, ca = cos(ang), sa = sin(ang); vec3 p = vec3(n.x * ca + n.z * sa, n.y, -n.x * sa + n.z * ca);
    vec3 w = p * 2.1 + vec3(0.0, t * 0.12, 0.0), q = vec3(fbm3(w + vec3(0.0, 0.0, t * 0.3)), fbm3(w + vec3(5.2, 1.3, -t * 0.25)), fbm3(w + vec3(2.7, 8.1, t * 0.2)));
    float f = fbm3(p * 3.0 + q * 2.4 + vec3(0.0, -t * 0.35, 0.0)), g = fbm3(p * 7.0 + q * 1.2 + vec3(t * 0.5, 0.0, -t * 0.3));
    float rg = 1.0 - abs(fbm3(p * 4.6 + q * 1.8 - vec3(t * 0.22)) * 2.0 - 1.0), veins = pow(rg, mix(11.0, 4.0, inst)) * (0.6 + 0.4 * g);
    float lit = clamp(dot(n, vec3(-0.45, -0.55, 0.7)) * 1.15, 0.0, 1.0), fres = pow(1.0 - n.z, 2.2);
    vec3 crust = col * mix(0.2, 0.85, lit) * (0.55 + 0.7 * f) * (0.85 + 0.3 * g);
    float temp = v_q.x * (0.12 + 0.7 * f * f + 0.18 * g + 0.5 * veins) + 0.08 * lit, hk = smoothstep(0.5, 0.95, f * 0.95 + g * 0.2 + veins * 0.55 + inst * 0.2);
    vec3 c = mix(crust, ramp(min(temp, 0.72)), hk * 0.8) + ramp(min(1.05, v_q.x * (0.85 + 0.25 * inst))) * veins * (0.3 + 0.7 * inst);   /* (mostly crimson crust; fire wells up in patches; the veins carry the heat) */
    c += vec3(0.95, 0.3, 0.08) * fres * (0.35 + 0.3 * f) + vec3(1.0, 0.9, 0.72) * pow(lit, 26.0) * 0.18;   /* (the hot limb; a soft sheen) */
    a *= v_c.a * pk; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 10.5 && v_k < 11.5) { // the body of a fire beam (solid, under its light): it keeps its colour over a pale floor
    float al = u.x * 0.5 + 0.5, fe = fth(v_k), ee = fte(al, fe), f = fbm(vec2(al * 6.0 - t * v_q.z, u.y * 2.2 + v_q.y)), ay = abs(u.y) / (0.62 + 0.4 * f) / (1.0 - 0.6 * ee);   /* (v388 E: a far end feathers out) */
    float dns = (1.0 - smoothstep(0.45, 0.95, ay)) * smoothstep(0.0, 0.06, al) * (fe > 0.0 ? ftk(ee) : 1.0 - smoothstep(0.9, 1.0, al)), temp = (v_q.x * (1.2 - ay * 1.05) + (f - 0.5) * 0.4) * (1.0 - 0.3 * ee), a = dns * v_c.a * pk * smoothstep(0.1, 0.45, temp);
    gl_FragColor = vec4(ramp(min(temp, 0.78)) * 0.9 * a, a); }
  else if (v_k > 9.5 && v_k < 10.5) { // the body of fire (the solid pass, under its light): the same turbulent ball, its colour laid over so it reads on a bright floor
    vec2 w = u + 0.22 * vec2(fbm(u * 2.0 + vec2(t * 0.7, -t * 1.6)) - 0.5, fbm(u * 2.0 + vec2(5.2, -t * 1.9)) - 0.5); float rr = length(w), f = fbm(w * 3.0 + vec2(0.0, -t * 2.2)), dns = 1.0 - smoothstep(0.4 + 0.35 * f, 0.95, rr);
    float temp = v_q.x * (1.15 - rr * 0.95) + (f - 0.5) * 0.55, a = dns * v_c.a * pk * smoothstep(0.1, 0.45, temp); gl_FragColor = vec4(ramp(min(temp, 0.8)) * 0.85 * a, a); }
  else if (v_k > 8.5 && v_k < 9.5) { // smoke (the solid pass): billowing density, darker in its heart, lit a little from below
    float f = fbm(u * 2.2 + vec2(v_q.y * 3.1, v_q.y - t * 0.35)), d = clamp((1.0 - r * r) * (0.55 + 0.9 * f) - 0.25, 0.0, 1.0) * edge; float a = d * v_c.a * pk;
    vec3 c = mix(col * 0.6, col, smoothstep(-0.5, 0.6, -u.y + f * 0.5)) + vec3(0.35, 0.12, 0.03) * v_q.x * smoothstep(0.0, 1.0, u.y + 0.3); gl_FragColor = vec4(c * a, a); }
  else if (v_k > 23.5 && v_k < 24.5) { // (v361, water) a sphere of water (solid): a turning globe of translucent water, deep
    // sapphire low in it and in its heart, its colour above, currents banding round it, clearer water swirling through, a bright
    // rim of reflected light all round its limb (fresnel: clear in the middle, denser at the edge); feathered limb. v_c its
    // colour, v_q.x density, v_q.y seed, v_q.z the turn of its currents
    float a = 1.0 - smoothstep(0.86, 1.0, r); vec3 n = vec3(u, sqrt(max(0.0, 1.0 - r * r)));   /* (v364: a defined limb, just feathered) */
    float ang = t * 0.3 * v_q.z + v_q.y, ca = cos(ang), sa = sin(ang); vec3 p = vec3(n.x * ca + n.z * sa, n.y, -n.x * sa + n.z * ca);
    float f = fbm3(p * 2.2 + vec3(0.0, t * 0.15, v_q.y)), g = fbm3(p * 5.0 + vec3(t * 0.3, -t * 0.2, 0.0) + f * 1.5), bands = 0.5 + 0.5 * sin((p.y + f * 0.9) * 9.0 + t * 1.3 * v_q.z);
    float lit = clamp(dot(n, vec3(-0.5, -0.62, 0.6)) * 1.1, 0.0, 1.0), fres = pow(1.0 - n.z, 2.0);
    vec3 deep = col * vec3(0.16, 0.26, 0.48), sh = mix(col, vec3(0.55, 0.98, 1.0), 0.55);
    vec3 c = mix(deep, col, smoothstep(-0.25, 0.95, -u.y * 0.55 + lit * 0.75 + (f - 0.5) * 0.8)); c = mix(c, sh, bands * smoothstep(0.35, 0.8, g) * 0.5);
    c += vec3(0.6, 0.95, 1.0) * fres * 0.55;
    a *= mix(0.42, 0.95, fres) * (0.85 + 0.15 * f) * mix(0.7, 1.0, v_q.x) * v_c.a * pk; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 24.5 && v_k < 25.5) { // (v361, water) a stream of water (solid; uv.x along, uv.y across): a translucent tube of
    // flowing water with wavering edges, darker and denser at its sides, clearer down its middle, flow streaks of paler water
    // racing along it, a glossy highlight along its upper side; both ends feathered. v_q.x density, v_q.y seed, v_q.z flow speed
    float al = u.x * 0.5 + 0.5, f = fbm(vec2(al * 4.0 - t * v_q.z * 0.6, u.y * 1.3 + v_q.y + t * 0.4)), ay = abs(u.y + (f - 0.5) * 0.55) / (0.58 + 0.55 * f);   /* (v364: edges billowing and flowing) */
    float dns = pow(1.0 - smoothstep(0.15, 1.0, ay), 1.4) * smoothstep(0.0, 0.24, al) * (1.0 - smoothstep(0.76, 1.0, al)), tube = sqrt(max(0.0, 1.0 - ay * ay));   /* (v364: the body thins softly to nothing at its sides: no edge) */
    float st = fbm(vec2(al * 14.0 - t * v_q.z * 1.4, u.y * 3.0 + v_q.y * 2.0)), streak = smoothstep(0.52, 0.8, st), rim = smoothstep(0.5, 0.95, ay);
    // (v364) finer detail: a refraction web of light and shade running through the body, foam flecks boiling along both edges,
    // a crisper glossy highlight
    float rw = caus(vec2(al * 2.6 - t * v_q.z * 0.12, u.y * 0.9 + v_q.y) * 6.28 + vec2(-250.0), t * 0.7), fl = n2(vec2(al * 34.0 - t * v_q.z * 3.0, u.y * 9.0 + v_q.y * 5.0)), foam = smoothstep(0.62, 0.86, fl) * smoothstep(0.55, 0.92, ay) * (1.0 - smoothstep(0.92, 1.0, ay));
    vec3 c = mix(col * vec3(0.18, 0.28, 0.55), mix(col, vec3(0.3, 0.85, 0.95), 0.35), tube); c = mix(c, mix(col, vec3(0.55, 1.0, 1.0), 0.65), streak * 0.6);
    c = mix(c, c * 0.55, smoothstep(0.35, 0.8, fbm(vec2(al * 9.0 - t * v_q.z, u.y * 4.0 - v_q.y))) * tube * 0.45) + mix(col, vec3(0.8, 1.0, 1.0), 0.6) * min(rw, 1.0) * 0.32 * tube;
    c += vec3(0.85, 1.0, 1.0) * exp(-sq((u.y + 0.36 + (f - 0.5) * 0.35) / 0.13)) * (0.5 + 0.5 * st) * 0.55 + vec3(0.5, 0.9, 1.0) * rim * 0.28 + vec3(0.9, 1.0, 1.0) * smoothstep(0.62, 0.8, st) * rim * 0.5;
    c = mix(c, vec3(0.92, 0.98, 1.0), foam * 0.6);
    float a = min(1.0, dns * max(mix(0.5, 0.75, rim), foam * 0.8) * v_q.x) * v_c.a * pk; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 40.5 && v_k < 41.5) { // (v402, Sunflare) a love heart (solid): a thick glossy candy heart, pillowed and lit from the upper left
    // (a blush centre deepening to rose, a deep-rose shadowed rim, a pearl lip on the lit side, a specular gleam on each lobe), bands
    // of radiance turning inside it, a glint sweeping across, a pearl heart-of-light at level 3. v_q.x: fract its brightening 0..1,
    // floor / 100 its dissolution 0..1 (eaten into motes); v_q.y seed; v_q.z 1..3 its level, -1 its side (thickness), -2 a flat emblem
    vec2 p = hmap(u); float d = hsd(p), a = 1.0 - smoothstep(-0.014, 0.004, d); vec3 c;
    if (v_q.z < -1.5) c = col;
    else if (v_q.z < -0.5) c = mix(vec3(0.82, 0.29, 0.66), vec3(0.5, 0.15, 0.4), smoothstep(-0.7, 0.7, u.x + u.y * 0.4));
    else { float e = 0.006, h = clamp(-d / 0.3, 0.0, 1.0), k1 = (1.0 - h) * (1.0 - h), br = fract(v_q.x);
      vec2 g = vec2(hsd(p + vec2(e, 0.0)) - hsd(p - vec2(e, 0.0)), hsd(p + vec2(0.0, e)) - hsd(p - vec2(0.0, e))) / (2.0 * e);
      vec3 n = normalize(vec3(g * k1 * 1.6, 0.32 + h)), Ld = vec3(-0.5, 0.62, 0.6);
      float df = max(dot(n, Ld), 0.0), sp = pow(max(dot(n, normalize(Ld + vec3(0.0, 0.0, 1.0))), 0.0), 60.0), sp2 = pow(max(dot(n, normalize(vec3(0.55, 0.5, 0.67))), 0.0), 26.0), fr = sq(1.0 - n.z);
      float rc = length(p - vec2(-0.07, 0.64));
      c = mix(vec3(1.0, 0.74, 0.91), vec3(1.0, 0.56, 0.86), smoothstep(0.0, 0.26, rc)); c = mix(c, vec3(1.0, 0.36, 0.8), smoothstep(0.22, 0.58, rc)); c = mix(c, vec3(0.93, 0.27, 0.72), smoothstep(0.52, 0.8, rc));
      c *= 0.66 + 0.48 * df; c = mix(c, vec3(0.5, 0.14, 0.42), fr * 0.6 * (1.0 - df)); c += vec3(1.0, 0.8, 0.94) * fr * df * 0.55;
      vec2 q = p - vec2(-0.02, 0.6); float an = atan(q.y, q.x), rq = length(q);
      float bands = pow(0.5 + 0.5 * sin(an * 7.0 + u_t * 0.35), 3.0) * exp(-rq * 2.0);
      if (v_q.z > 1.5) bands += 0.7 * pow(0.5 + 0.5 * sin(an * 5.0 - u_t * 0.55 + 0.4), 3.0) * exp(-rq * 2.6);
      c += vec3(1.0, 0.42, 0.8) * bands * (0.24 + 0.3 * br) * h;
      float sw = fract(u_t * 0.32) * 2.6 - 1.3; c += vec3(1.0, 0.92, 0.98) * exp(-sq((p.x + (p.y - 0.6) * 0.6 - sw) / 0.08)) * 0.4 * h;
      if (v_q.z > 2.5) c += vec3(1.0, 0.95, 0.98) * exp(-rq * rq * 34.0) * (0.6 + 0.15 * sin(u_t * 3.0));
      c += vec3(1.0) * sp * 0.95 + vec3(1.0, 0.85, 0.95) * sp2 * 0.3 + vec3(1.0, 0.6, 0.86) * br * 0.12 * h; }
    c = mix(c, vec3(0.46, 0.12, 0.38), (1.0 - smoothstep(0.008, 0.03, -d)) * 0.6);
    float dis = floor(v_q.x) / 100.0; if (dis > 0.0) { float nz = fbm(u * 4.5 + v_q.y), th = dis * 1.3; a *= smoothstep(th - 0.2, th - 0.06, nz); c = mix(c, vec3(1.0, 0.94, 0.98), (1.0 - smoothstep(th - 0.06, th + 0.08, nz)) * 0.8); }
    a *= v_c.a; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 44.5 && v_k < 47.5) { // (v404 LT) Light's solids: 45 a feather of light, 46 a glass bubble, 47 a candy star
    vec3 c = vec3(0.0); float a = 0.0;
    if (v_k < 45.5) { // a feather (uv.x -1 its root .. 1 its tip, uv.y across, +y its shaded side): a tapered blade bending by v_q.z, deep pink at the
      // root through candy and blossom to a pearl tip, lit along its upper edge, fine barbs slanting from a pearl shaft; v_q.x a brightening, v_q.y seed
      float al = u.x * 0.5 + 0.5, c0 = v_q.z * (al * al - al) * 1.6, w = 0.1 + 0.9 * pow(sin(3.1416 * clamp(pow(al, 0.72), 0.0, 1.0)), 0.85) * (1.0 - 0.3 * al), y = (u.y - c0) / max(w, 0.02), ay = abs(y);
      a = (1.0 - smoothstep(0.74, 1.0, ay)) * smoothstep(0.0, 0.08, al) * (1.0 - smoothstep(0.9, 1.0, al));
      c = mix(vec3(0.85, 0.29, 0.57), vec3(1.0, 0.41, 0.71), smoothstep(0.04, 0.36, al)); c = mix(c, vec3(1.0, 0.72, 0.84), smoothstep(0.34, 0.72, al)); c = mix(c, vec3(1.0, 0.94, 0.97), smoothstep(0.68, 0.95, al));
      c *= mix(1.15, 0.62, smoothstep(-0.9, 0.9, y)); c = mix(c, vec3(0.55, 0.11, 0.34), smoothstep(0.4, 1.0, y) * 0.45);
      float barb = pow(0.5 + 0.5 * sin((al * 30.0 - ay * 3.5 + v_q.y) * 3.1416), 10.0) * smoothstep(0.1, 0.45, ay) * (1.0 - smoothstep(0.7, 0.98, ay)) * smoothstep(0.1, 0.3, al), sh = exp(-sq(y / 0.08)) * smoothstep(0.04, 0.3, al) * (1.0 - smoothstep(0.82, 1.0, al)), sw = fract(t * 0.45);
      c = mix(c, vec3(1.0, 0.94, 0.97), clamp(barb * 0.22 + sh * 0.7 + v_q.x * 0.45, 0.0, 1.0)) + vec3(1.0, 0.9, 0.96) * exp(-sq((y + 0.76) / 0.1)) * 0.5 * smoothstep(0.15, 0.6, al);
      c = mix(c, vec3(0.45, 0.08, 0.28), exp(-sq((y - 0.84) / 0.1)) * 0.5) + vec3(1.0, 0.92, 0.97) * exp(-sq((al - sw * 1.3 + 0.15) / 0.07)) * 0.4 * (1.0 - 0.5 * ay); }
    else if (v_k < 46.5) { // a glass bubble in v_c filling 0.92 of its quad: a clear middle, a saturated rim, a pearl core of radius v_q.x (solid), shade low
      // right, a reflected light along the lower right rim, a soft highlight and a glint upper left (v_q.z the gloss)
      float rr = r / 0.92; vec3 n = vec3(u / 0.92, sqrt(max(0.0, 1.0 - rr * rr))); float fr = pow(1.0 - n.z, 1.5), df = max(dot(n, normalize(vec3(-0.5, -0.6, 0.65))), 0.0);
      c = mix(min(col * 1.1 + 0.12, vec3(1.0)), col * vec3(0.7, 0.36, 0.55), fr) * (0.78 + 0.32 * df); a = mix(0.42, 0.97, fr) * (1.0 - smoothstep(0.96, 1.0, rr)); c = mix(c, col * vec3(0.5, 0.2, 0.38), smoothstep(0.88, 0.97, rr) * 0.7);
      c += vec3(1.0, 0.72, 0.87) * exp(-sq((rr - 0.84) / 0.08)) * smoothstep(0.0, 0.7, dot(u / max(r, 0.001), vec2(0.7, 0.7))) * 0.55;
      float core = v_q.x > 0.0 ? 1.0 - smoothstep(v_q.x - 0.05, v_q.x, r) : 0.0, hl = exp(-sq((u.x + 0.33) / 0.2) - sq((u.y + 0.38) / 0.11)) * 0.7 + pow(max(dot(n, normalize(vec3(-0.35, -0.45, 1.6))), 0.0), 60.0) * 1.2;
      c = mix(c, vec3(1.0, 0.95, 0.98), core); a = max(a, core); c += vec3(1.0) * hl * v_q.z; a = max(a, min(1.0, hl * v_q.z) * (1.0 - smoothstep(0.96, 1.0, rr))); }
    else { // (Wish Upon a Star) a shallow rounded five-pointed star (a point toward +u.x, its edge at 0.9 of the quad): a height field rising to
      // ridges along its points, lit from the upper left (v_q.y the quad's turn, so the light stays put), pearl at its heart to saturated rose
      // and magenta points, a pearly bevel inside the rim, translucent, every edge feathered; v_q.x a brightening; v_q.z -1 its side band
      vec2 p = u / 0.9; float q = length(p) / wprof(atan(p.y, p.x)), rr = length(p);
      if (v_q.z < -0.5) { c = mix(vec3(0.91, 0.24, 0.67), vec3(0.56, 0.18, 0.45), clamp(0.5 + u.y * 0.5, 0.0, 1.0)); a = 0.85 * (1.0 - smoothstep(0.84, 1.04, q)); }
      else { float e = 0.02, h0 = 1.0 - pow(min(q, 1.0), 1.6), hx = 1.0 - pow(min(length(p + vec2(e, 0.0)) / wprof(atan(p.y, p.x + e)), 1.0), 1.6), hy = 1.0 - pow(min(length(p + vec2(0.0, e)) / wprof(atan(p.y + e, p.x)), 1.0), 1.6);
        float cr = cos(v_q.y), sr = sin(v_q.y); vec2 l2 = vec2(-0.45 * cr - 0.6 * sr, 0.45 * sr - 0.6 * cr); vec3 n = normalize(vec3(-(hx - h0) / e * 0.22, -(hy - h0) / e * 0.22, 1.0)), Ld = normalize(vec3(l2, 0.66));
        float dt = dot(n, Ld), sh = clamp(1.0 + (dt - Ld.z) * 1.1, 0.6, 1.35);
        c = mix(vec3(1.0, 0.96, 0.99), vec3(1.0, 0.83, 0.93), smoothstep(0.22, 0.4, rr)); c = mix(c, vec3(1.0, 0.69, 0.9), smoothstep(0.4, 0.5, rr)); c = mix(c, vec3(1.0, 0.56, 0.86), smoothstep(0.5, 0.68, rr)); c = mix(c, vec3(1.0, 0.36, 0.8), smoothstep(0.68, 0.86, rr)); c = mix(c, vec3(0.91, 0.24, 0.67), smoothstep(0.86, 1.0, rr));
        c = sh <= 1.0 ? c * (0.55 + 0.45 * sh) : c + (1.0 - c) * (sh - 1.0) * 1.2; float bev = exp(-sq((q - 0.9) / 0.035)) * max(0.0, dt - Ld.z) * 2.2; c = mix(c, vec3(1.0), clamp(bev, 0.0, 1.0)); c += vec3(1.0, 0.8, 0.93) * v_q.x * 0.3 * (1.0 - rr);
        a = (1.0 - smoothstep(0.86, 1.05, q)) * (0.55 + 0.38 * pow(1.0 - clamp(rr, 0.0, 1.0), 1.5) + 0.1 * clamp(bev, 0.0, 1.0)); } }
    a *= v_c.a; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 51.5 && v_k < 52.5) { // (v404 LT, Honey Sugar Heart Attack, Luv Me Chain) a heart drawn as a glassy tube (solid): v_q.x the tube's half
    // width (heart units), lit from the upper left (a hot-pink body deepening on its shaded side, a blossom inner light, a pearl core line, a thin
    // hot-pink outer rim), a highlight sliding round it at v_q.y (0..1 from the cleft round the left side); shown from its point up to v_q.z (1.1 all)
    vec2 p = hmap(u); float d = hsd(p), w = max(v_q.x, 0.008), x = clamp(d / w, -1.0, 1.0), up = abs(atan(p.x, 0.55 - p.y)) / 3.1416, e = 0.006;
    vec2 g = vec2(hsd(p + vec2(e, 0.0)) - hsd(p - vec2(e, 0.0)), hsd(p + vec2(0.0, e)) - hsd(p - vec2(0.0, e))) / (2.0 * e); g = normalize(g + 1e-4);
    vec3 n = vec3(g * x, sqrt(max(0.0, 1.0 - x * x))); float df = max(dot(n, normalize(vec3(-0.5, 0.62, 0.65))), 0.0), sp = pow(max(dot(n, normalize(vec3(-0.25, 0.35, 1.0))), 0.0), 28.0);
    float fr = p.x < 0.0 ? up * 0.5 : 1.0 - up * 0.5, dh = abs(fract(fr - v_q.y + 0.5) - 0.5), hl = exp(-sq(dh / 0.06)) * exp(-sq((x + 0.3) / 0.35));
    vec3 c = mix(vec3(0.62, 0.17, 0.42), vec3(1.0, 0.41, 0.71), 0.25 + 0.75 * df); c = mix(c, vec3(1.0, 0.72, 0.84), exp(-sq((x + 0.2) / 0.22)) * 0.45); c = mix(c, vec3(1.0, 0.94, 0.97), exp(-sq((x + 0.22) / 0.08)) * 0.75);
    c += vec3(1.0) * sp * 0.45 + vec3(1.0, 0.95, 0.98) * hl * 0.6; c = mix(c, vec3(1.0, 0.25, 0.64), exp(-sq((x - 0.88) / 0.08)) * 0.8); c = mix(c, vec3(0.5, 0.14, 0.36), exp(-sq((x + 0.95) / 0.07)) * 0.5);
    float a = (1.0 - smoothstep(0.82, 1.0, abs(d / w))) * (1.0 - smoothstep(v_q.z - 0.04, v_q.z, up)) * (0.86 + 0.14 * df) * v_c.a; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else if (v_k > 48.5 && v_k < 49.5) { // (v404 LT, Sweetheart Stamp) a heart seal (solid): v_q.z 1 its stamping face (a bevelled rose-gold rim, a pearly pink
    // face, nested engraved hearts glowing by v_q.x), 2 its back (the rim, a pearly domed plate, a raised rose-gold heart), -1 its side (the
    // thickness band), -2 the side at a face (a rose-gold rim line); v_q.y a sheen's place across it (-1..1)
    vec2 p = hmap(u), c0 = vec2(0.0, 0.52); float d = hsd(p), a = 1.0 - smoothstep(-0.012, 0.004, d); vec3 c;
    if (v_q.z < 0.0) { c = mix(vec3(1.0, 0.83, 0.9), vec3(0.94, 0.55, 0.75), smoothstep(-0.8, 0.0, u.y)); c = mix(c, vec3(0.7, 0.25, 0.5), smoothstep(0.0, 0.85, u.y)); if (v_q.z < -1.5) c = mix(c, vec3(0.91, 0.69, 0.72), exp(-sq(d / 0.035))); }
    else { float e = 0.006, di = hsd((p - c0) / 0.84 + c0) * 0.84, gk = clamp(0.5 + 0.6 * (p.x - (p.y - 0.55)) * 0.7, 0.0, 1.0);
      vec2 g = vec2(hsd(p + vec2(e, 0.0)) - hsd(p - vec2(e, 0.0)), hsd(p + vec2(0.0, e)) - hsd(p - vec2(0.0, e))) / (2.0 * e); float lt = dot(normalize(g + 1e-4), vec2(-0.6, 0.8));
      vec3 gold = mix(vec3(1.0, 0.89, 0.92), vec3(0.91, 0.69, 0.72), smoothstep(0.0, 0.35, gk)); gold = mix(gold, vec3(0.79, 0.54, 0.58), smoothstep(0.3, 0.7, gk)); gold = mix(gold, vec3(0.61, 0.37, 0.43), smoothstep(0.65, 1.0, gk));
      gold *= 0.8 + 0.38 * lt * (d + di > 0.0 ? 1.0 : -0.6); gold += vec3(1.0, 0.95, 0.97) * exp(-sq((d + 0.03) / 0.012)) * 0.5 * max(lt, 0.0);
      vec3 f; if (v_q.z < 1.5) { float rc = length(p - vec2(-0.13, 0.66)) / 0.62; f = mix(vec3(1.0, 0.94, 0.97), vec3(1.0, 0.72, 0.84), smoothstep(0.0, 0.22, rc)); f = mix(f, vec3(1.0, 0.41, 0.71), smoothstep(0.2, 0.55, rc)); f = mix(f, vec3(0.85, 0.29, 0.57), smoothstep(0.5, 0.85, rc)); f = mix(f, vec3(0.56, 0.18, 0.45), smoothstep(0.82, 1.0, rc));
        for (int k = 0; k < 2; k++) { float s = k == 0 ? 0.62 : 0.42, dk = hsd((p - c0 - vec2(0.0, 0.05 - 0.07 * float(k))) / s + c0) * s; f = mix(f, vec3(0.5, 0.14, 0.4), exp(-sq(dk / 0.02)) * 0.75); f = mix(f, vec3(1.0, 0.94, 0.97), exp(-sq((dk + 0.02) / 0.01)) * 0.85); f += vec3(1.0, 0.45, 0.78) * exp(-sq(dk / 0.04)) * v_q.x * 0.35 + vec3(1.0, 0.9, 0.96) * exp(-sq((dk + 0.02) / 0.01)) * v_q.x * 0.3; }
        f = mix(f, vec3(1.0, 0.95, 0.98), 1.0 - smoothstep(-0.006, 0.006, hsd((p - c0 - vec2(0.0, -0.08)) / 0.2 + c0) * 0.2)); }
      else { float rc = length(p - vec2(-0.15, 0.7)) / 0.82; f = mix(vec3(1.0), vec3(1.0, 0.94, 0.97), smoothstep(0.0, 0.15, rc)); f = mix(f, vec3(1.0, 0.72, 0.84), smoothstep(0.12, 0.4, rc)); f = mix(f, vec3(1.0, 0.41, 0.71), smoothstep(0.38, 0.75, rc)); f = mix(f, vec3(0.85, 0.29, 0.57), smoothstep(0.72, 1.0, rc));
        float dk = hsd((p - c0 - vec2(0.0, 0.0)) / 0.4 + c0) * 0.4; f = mix(f, vec3(0.91, 0.69, 0.72), exp(-sq(dk / 0.022))); f = mix(f, vec3(1.0, 0.94, 0.97), exp(-sq((dk + 0.012) / 0.008)) * 0.7); }
      c = mix(f, gold, smoothstep(-0.012, 0.004, di)); c = mix(c, vec3(0.56, 0.18, 0.45), exp(-sq(di / 0.008)) * 0.6);
      c += vec3(1.0, 0.95, 0.98) * (exp(-sq((p.x * 0.85 + (p.y - 0.55) * 0.5 - v_q.y * 0.6) / 0.09)) * 0.3 + exp(-sq((p.x * 0.85 + (p.y - 0.55) * 0.5 - v_q.y * 0.6 - 0.16) / 0.03)) * 0.25); }
    c = mix(c, vec3(0.47, 0.2, 0.29), (1.0 - smoothstep(0.004, 0.02, -d)) * (v_q.z > -1.5 && v_q.z < -0.5 ? 0.0 : 0.85));   /* (the inner copies of the side band carry no contour: no stripes) */
    a *= v_c.a; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
/*<W>*/  else if (v_k > 32.5 && v_k < 33.5) { // (v370, wind) the body of a blade of wind (solid): deep emerald toward its sharp outer edge, its
    // opacity fading toward the inner edge, streaked as the air races along it; v_q.x span + 10 x mode, v_q.y seed, v_q.z thickness
    vec4 B = wbl(u, v_q.x, v_q.z); float d = B.x, rr = r, md = floor(v_q.x / 10.0), along = md < 0.5 ? pow(clamp(1.0 - B.y, 0.0, 1.0), 1.3) : md < 1.5 ? 1.0 - smoothstep(0.7, 1.0, B.y) : 1.0;
    float outer = 1.0 - smoothstep(0.796, 0.806, rr), prof = pow(clamp(1.0 - d, 0.0, 1.0), 1.7) * step(0.0, d + 0.02), st = fbm(vec2(B.w * 3.0 - t * 2.5, d * 4.0 + v_q.y));
    float a = min(1.0, 1.05 * pow(clamp(1.0 - d, 0.0, 1.0), 0.9) * step(0.0, d + 0.02) * along * (0.72 + 0.4 * st)) * outer * B.z * v_c.a; vec3 c = mix(col * 0.55, col, clamp(1.0 - d, 0.0, 1.0) * (0.7 + 0.3 * st));   /* (v371: a firmer body, so a blade reads on a pale floor) */ gl_FragColor = vec4(c * a, a); }
  else if (v_k > 35.5 && v_k < 36.5) { // (v370, wind) shade under wind (solid), so it reads on a pale floor: a soft swirling disc (v_q.x 0)
    // or a funnel's body (v_q.x 1 + its foot's width), streaked; v_q.z its density
    float a = 0.0, sh = 0.0;
    if (v_q.x < 0.5) { float f = fbm(vec2(atan(u.y, u.x) * 2.0 + t * 0.6, r * 3.0 - t * 0.4) + v_q.y); a = (1.0 - smoothstep(0.25 + 0.2 * f, 1.0, r)) * (0.55 + 0.45 * f); sh = f; }
    else { float h = (1.0 - u.y) * 0.5; vec2 fw = wfun(h, v_q.x - 1.0, t); float x = (u.x - fw.x) / fw.y, f = fbm(vec2(asin(clamp(x, -1.0, 1.0)) * 2.0 + h * 5.0 - t * 2.5, h * 4.0) + v_q.y);
      a = (1.0 - smoothstep(0.5, 1.0, abs(x))) * smoothstep(0.0, 0.1, h) * (1.0 - smoothstep(0.72 + 0.15 * f, 0.98, h)) * (0.45 + 0.55 * f); sh = f; }
    a *= v_q.z * v_c.a; vec3 c = mix(col * 0.5, col, sh); gl_FragColor = vec4(c * a, a); }
  else if (v_k > 38.5 && v_k < 39.5) { // (v370, wind) the body of a ribbon of wind (solid; uv.x along, uv.y across): v_q.x 0 both edges
    // bright, 1 the edge at +y; v_q.y seed, v_q.z its flow
    float e = v_q.x > 0.5 ? (u.y + 1.0) * 0.5 : abs(u.y), af = 1.0 - smoothstep(0.65, 1.0, abs(u.x)), st = fbm(vec2(u.x * 2.0 - t * v_q.z, u.y * 3.0 + v_q.y));
    float a = min(1.0, pow(e, 1.1) * (1.0 - smoothstep(0.9, 0.98, e)) * af * (0.65 + 0.5 * st) * 0.95) * v_c.a; vec3 c = mix(col * 0.45, col, e); gl_FragColor = vec4(c * a, a); }
  else if (v_k > 39.5 && v_k < 40.5) { // (v376, Sun Wheel) a blade of the sun (solid): a golden crescent bulging toward +x, its horns at
    // (-0.06, +-0.92); a dark bronze rim so it reads on a pale floor, gold deepening to amber toward its inner edge, a white-hot
    // sharpened outer edge, engraved rays and a gleam running along it. v_q.x the gleam's place along it (-1..1), v_q.y seed, v_q.z heat
    float d1 = 0.92 - r, d2 = length(u - vec2(-0.36, 0.0)) - 0.97, s = min(d1, d2), an = atan(u.y, u.x), w = clamp(d1 / max(d1 + max(d2, 0.0), 0.001), 0.0, 1.0);
    float a = smoothstep(-0.006, 0.012, s), ray = smoothstep(0.6, 0.97, abs(sin(an * 10.0 + v_q.y))) * smoothstep(0.05, 0.09, d1) * smoothstep(0.02, 0.05, d2);
    vec3 deep = col * vec3(0.62, 0.4, 0.14), c = mix(min(col * 1.12 + 0.06, vec3(1.0)), deep * 1.5, smoothstep(0.1, 0.95, w));
    c = mix(c, deep, ray * 0.4) * (0.9 + 0.1 * fbm(vec2(an * 6.0, r * 8.0) + v_q.y));
    float gl = exp(-sq((u.y - v_q.x) / 0.2)) * (1.0 - w * 0.7), edge = 1.0 - smoothstep(0.035, 0.085, d1);
    c = mix(c, vec3(1.0, 0.98, 0.86), clamp(gl * 0.75 + edge * (0.55 + 0.45 * v_q.z), 0.0, 1.0));
    c = mix(c, vec3(0.3, 0.16, 0.03), (1.0 - smoothstep(0.016, 0.034, d1)) * 0.85 + (1.0 - smoothstep(0.02, 0.05, d2)) * 0.95 * step(d2, d1));   /* (the rim: a hair along the sharp edge, firmer along the inner) */
    a *= v_c.a; gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
/*</W>*/  else { vec3 L = vec3(0.0);
    if ((v_k > 75.5 && v_k < 77.5) || (v_k > 78.5 && v_k < 79.5)) { // (v415 EA) Earth's light
      if (v_k < 76.5) { // a crystal's light (as kind 73: eaCSet): its inner glow by its thickness (v_c.r), glints on its edges and twinkles on its facets,
        // v_c.b a band of golden light climbing it (0..1 of its height; 0 none), v_c.g its charge: light flooding up from the root, its fractures white-hot
        eaCSet(u); float cov = clamp(eaSil + 0.5, 0.0, 1.0);
        if (cov > 0.003) { float th = clamp(eaTh / (eaRR * 2.0), 0.0, 1.0), zn = eaMD < 0.5 ? eaQ.z : eaQ.z + 0.5, gl = v_c.r, ch = v_c.g, bd = v_c.b, ab = eaMD < 0.5 ? smoothstep(0.06, 0.14, eaQ.z) : 1.0, fh = h1(floor(eaN1.xy * 23.0 + 50.0) + eaN1.z * 3.7);
          float ed = 1.0 - smoothstep(0.3, 1.8, eaEd), tw = pow(0.5 + 0.5 * sin(u_t * (2.0 + fh * 3.0) + fh * 40.0 + eaSD), 18.0), sp = pow(max(dot(eaN1.xyz, eaHv), 0.0), 10.0);
          L = mix(vec3(0.8, 0.4, 0.06), vec3(1.0, 0.72, 0.3), th) * gl * (0.06 + 0.7 * th * th) * 0.6 * ab + vec3(1.0, 0.91, 0.72) * ed * (0.22 * gl + 0.7 * tw * (0.3 + gl)) * ab + vec3(1.0, 0.96, 0.86) * tw * sp * 0.7;
          if (bd > 0.001) L += vec3(1.0, 0.82, 0.42) * exp(-sq((zn - bd) / 0.11)) * (0.55 + 0.65 * th) * 1.2 * ab;
          if (ch > 0.001) { float cr = abs(n3(eaQ * vec3(14.0, 14.0, 4.0) / max(eaRR * 5.0, 0.3) + eaSD) - 0.5); L += vec3(1.0, 0.78, 0.32) * (1.0 - smoothstep(ch * 1.15 - 0.18, ch * 1.15, zn)) * (0.3 + 0.6 * ch) * (0.45 + 0.55 * th) * ab + vec3(1.0, 0.97, 0.88) * (1.0 - smoothstep(0.012, 0.035, cr)) * smoothstep(0.15, 0.85, ch) * 1.3 * ab; }
          L *= cov; } }
      else if (v_k < 77.5) { // floor fissures in light (v_q.x its form): 0 the six-pointed pattern (eaHex; the quad its radius x 1.18; v_q.y seed, v_q.z the trace 0..1),
        // its tracing heads bright; 1 an impact's cracks (eaWeb: v_q.z rays + 0.99 x their reach). v_c.r the heat (white-hot -> gold -> amber -> a dull red as it
        // cools), v_c.g a pulse; a white-gold core, amber round it, embers flickering along it
        float md = v_q.x, ht = v_c.r; vec2 dd;
        if (md < 0.5) { vec2 hx = eaHex(u * 1.18, v_q.z, v_q.y); dd = vec2(hx.x, 0.5); L = vec3(1.0, 0.86, 0.5) * exp(-hx.y / 0.03) * 0.9 + vec3(0.85, 0.5, 0.1) * exp(-hx.y / 0.09) * 0.4; }
        else dd = eaWeb(u * 1.1, v_q.y, floor(v_q.z + 0.0001), fract(v_q.z) / 0.99);
        float d = dd.x, w = 0.005 + 0.008 * (1.0 - dd.y); vec2 eg = floor(u * 34.0 + v_q.y); float em = step(0.8, h1(eg)) * pow(0.5 + 0.5 * sin(u_t * (5.0 + 6.0 * h1(eg + 3.3)) + h1(eg + 1.7) * 30.0), 3.0);
        vec3 hot = mix(vec3(0.5, 0.1, 0.02), mix(vec3(0.95, 0.52, 0.1), vec3(1.0, 0.95, 0.78), smoothstep(0.55, 1.0, ht)), smoothstep(0.08, 0.5, ht));
        L += hot * exp(-sq(d / w)) * 1.1 + mix(vec3(0.85, 0.45, 0.08), hot, 0.4) * exp(-d / 0.028) * 0.45 * (0.4 + 0.6 * ht) + vec3(0.85, 0.5, 0.1) * exp(-d / 0.1) * 0.12 * ht + vec3(1.0, 0.72, 0.28) * em * exp(-d / 0.014) * (0.3 + 0.7 * ht);
        L *= (1.0 - smoothstep(0.88, 1.0, r)) * (1.0 + v_c.g); }
      else { // 79 shock light (v_q.x its form): 0 a shockwave across the floor (a ring at 0.8 of its quad; v_q.z its width, of the radius; v_q.y seed; v_c its colour):
        // a sharp bright crest, pressure ripples trailing inside it, a faint halo ahead; 1 an impact flash (v_q.y seed, v_q.z its age 0..1): a white-gold core, a
        // burst of sharp rays, a soft halo, a flat streak
        if (v_q.x < 0.5) { float an = atan(u.y, u.x), rr = r / 0.8 + (n2(vec2(an * 5.0, v_q.y)) - 0.5) * 0.025, w = max(v_q.z, 0.02), x = (1.0 - rr) / w;
          float crest = exp(-sq((rr - 1.0) / (w * 0.22))), rip = (0.5 + 0.5 * cos(x * 10.0 - 1.0)) * exp(-max(x, 0.0) * 1.1) * step(0.0, x) * smoothstep(0.0, 0.25, x), ahead = exp(-max(rr - 1.0, 0.0) / 0.03) * step(1.0, rr);
          L = (col * (crest + rip * 0.4 + ahead * 0.25) + vec3(1.0, 0.97, 0.88) * pow(crest, 3.0) * 0.55) * (0.75 + 0.5 * n2(vec2(an * 12.0, v_q.y + u_t * 2.0))) * (1.0 - smoothstep(0.92, 1.0, r)); }
        else { float ag = clamp(v_q.z, 0.0, 1.0), an = atan(u.y, u.x), ry = pow(abs(cos(an * 4.0 + v_q.y)), 30.0) + 0.7 * pow(abs(cos(an * 7.0 - v_q.y * 2.0)), 50.0);
          L = vec3(1.0, 0.98, 0.9) * exp(-r * r * 40.0 / (1.0 + ag * 2.0)) * (1.0 - ag) * 1.4 + col * exp(-r * 3.2) * 0.6 * (1.0 - ag * ag) + mix(col, vec3(1.0, 0.95, 0.8), 0.5) * ry * exp(-r * (2.0 + 3.0 * ag)) * (1.0 - ag) * 0.9
            + mix(col, vec3(1.0), 0.4) * exp(-abs(u.y) * 28.0) * exp(-abs(u.x) * 2.5) * (1.0 - ag) * 0.5;
          L *= 1.0 - smoothstep(0.85, 1.0, r); } } }
    else if (v_k > 54.5 && v_k < 55.5) { // (v404 DK) a cut's light (as kind 54): violet energy brightening toward the sharp edge, a crisp violet-white
      // edge line with a halo outside it, streaks racing along it, a crimson filament inside; v_q.x span, v_q.y tail strength, v_q.z thickness
      vec3 B = dcr(u, v_q.x, v_q.z); float d = B.x, v = clamp(B.y, 0.0, 1.0), sl = atan(u.y, u.x) * r, al = mix(1.0, v_q.y, v) * B.z, st = fbm(vec2(sl * 7.0 + t * 6.0, d * 3.0)), e = clamp(1.0 - d, 0.0, 1.0), inb = step(0.0, d) * (1.0 - smoothstep(0.8, 1.05, d));
      L = (mix(vec3(0.43, 0.16, 0.66), vec3(0.65, 0.36, 1.0), e) * (0.1 + 0.7 * pow(e, 2.2)) * inb + vec3(0.94, 0.88, 1.0) * exp(-sq(d / 0.06)) * 1.1 + vec3(0.65, 0.36, 1.0) * exp(-max(-d, 0.0) * 9.0) * step(d, 0.0) * 0.4
        + vec3(0.8, 0.6, 1.0) * smoothstep(0.55, 0.85, st) * inb * e * 0.6 + vec3(0.82, 0.09, 0.25) * exp(-sq((d - 0.3) / 0.04)) * (0.55 + 0.45 * sin(sl * 18.0 + t * 9.0)) * 0.75) * al; }
    else if (v_k > 80.5 && v_k < 81.5) { // (v415 EB) a rock's light (kind 80's cast, the same values): mode 0 the boulder's veins burning (ramped by the heat), a warm halo
      // round them, its entry's hot side; mode 1 the stone's gold seam glowing with the heat, its gold flecks glinting as it turns
      float md = floor(v_q.z), ht = fract(v_q.z) / 0.9, sd = floor(v_q.y), en = fract(v_q.y) / 0.9; vec3 P, N; vec4 Hc = ebCast(u * 1.12, md, v_q.x, sd, P, N);
      if (Hc.x > 0.5) {
        if (md < 0.5) { vec3 V = ebVein(P, sd, Hc.z, Hc.w); float pu = 0.8 + 0.2 * sin(u_t * 3.0 + n3(P * 3.0) * 9.0), fr = pow(1.0 - max(N.z, 0.0), 2.5);
          L = ramp(0.55 + 0.35 * pu + 0.35 * ht) * V.x * (0.45 + 0.6 * ht) + vec3(0.9, 0.36, 0.05) * V.y * (0.04 + 0.26 * ht) + ramp(0.5 + 0.35 * en) * en * smoothstep(0.2, 0.95, N.y + 0.2) * fr * 0.6; }
        else { float sg = abs(dot(P, normalize(vec3(1.0, 0.35 * sin(sd), 0.3))) - 0.12 * sin(sd * 2.1) + (n3(P * 6.0) - 0.5) * 0.06); vec3 gq = floor(P * 9.0), gh = ebH(gq + sd), gf = P * 9.0 - gq - 0.5 - (gh - 0.5) * 0.5;
          float fl = step(0.86, gh.x) * (1.0 - smoothstep(0.06, 0.16, length(gf))), tw = pow(max(dot(normalize(N + (gh - 0.5) * 1.2), normalize(vec3(-0.5, -0.62, 1.6))), 0.0), 40.0);
          L = vec3(1.0, 0.72, 0.25) * (exp(-sq(sg / 0.032)) * (0.22 + 0.9 * ht) + exp(-sq(sg / 0.07)) * 0.3 * ht) + vec3(1.0, 0.9, 0.6) * fl * tw * 1.5; }
        L *= smoothstep(0.0, 0.03, Hc.y); } }
    else if (v_k > 82.5 && v_k < 83.5) { // (v415 EB) light in the floor (uv a unit disc squashed by its quad; v_q.y seed). Mode 0 (v_q.z) a crater's cracks: nine warped radial
      // cracks branching, a cellular web round the middle, spread out to v_q.z's fraction / 0.9, cooling with v_q.x (1 white-hot .. 0 a dull red). Mode 1 the quicksand's
      // light: amber in the gaps between its plates (v_q.x how open), its Celestial gold veins with light running inward (v_q.z's fraction / 0.9 their strength)
      float md = floor(v_q.z), fq = fract(v_q.z) / 0.9, sd = v_q.y, an = atan(u.y, u.x), ht = v_q.x;
      if (md < 0.5) {
        float wa = an + 0.42 * (fbm(vec2(r * 2.6, sd)) - 0.5) + 0.1 * (n2(vec2(r * 11.0, sd + 3.0)) - 0.5), sc = wa / 6.2831853 * 9.0 + sd, id = floor(sc + 0.5), dd = abs(sc - id) * 6.2831853 / 9.0 * r;
        float ln = 0.5 + 0.5 * h1(vec2(id, sd)), w = (0.008 + 0.022 * max(0.0, 1.0 - r / ln)) * smoothstep(0.0, 0.08, r), reach = ln * fq, cut = 1.0 - smoothstep(-0.12, 0.0, r - reach);
        float cr = exp(-sq(dd / max(w, 0.003))) * cut * smoothstep(0.03, 0.12, r);
        float sc2 = (an + 0.5 * (fbm(vec2(r * 3.3, sd + 7.0)) - 0.5)) / 6.2831853 * 23.0 + sd * 2.0, id2 = floor(sc2 + 0.5), dd2 = abs(sc2 - id2) * 6.2831853 / 23.0 * r, r0 = 0.2 + 0.45 * h1(vec2(id2, sd + 1.0));
        float br = exp(-sq(dd2 / 0.007)) * step(0.45, h1(vec2(id2, sd + 2.0))) * smoothstep(r0, r0 + 0.04, r) * (1.0 - smoothstep(-0.08, 0.06, r - r0 - 0.3 * fq)) * smoothstep(0.3, 0.6, fq);
        vec4 ce = ebCell(u * 7.0 + sd); float wr = 1.0 - smoothstep(-0.1, 0.05, r - 0.42 * fq), web = exp(-sq(ce.x / 0.045)) * wr;
        float k = max(cr, max(br * 0.8, web * 0.85)), hal = (exp(-sq(dd / max(w * 4.0, 0.012))) * cut + exp(-sq(ce.x / 0.14)) * wr) * 0.22;
        L = ramp(clamp(0.38 + 0.7 * ht * (1.1 - 0.6 * r), 0.0, 1.1)) * k + vec3(0.85, 0.32, 0.05) * hal * (0.3 + 0.7 * ht) + ramp(0.5 + 0.5 * ht) * exp(-r * r * 30.0) * 0.5 * ht;
        L *= 1.0 - smoothstep(0.9, 1.0, r); }
      else { vec3 Lq = vec3(0.0);
        if (ht > 0.0) { vec4 ce = ebCell(u * 4.6 + sd); Lq += vec3(1.0, 0.62, 0.16) * (exp(-sq(ce.x / (0.012 + 0.03 * ht))) * 0.9 + exp(-sq(ce.x / 0.06)) * 0.25) * ht; }
        if (fq > 0.0) { float wa = an + 0.5 * (fbm(vec2(r * 2.2, sd + 5.0)) - 0.5), sc = wa / 6.2831853 * 9.0 + sd, id = floor(sc + 0.5), dd = abs(sc - id) * 6.2831853 / 9.0 * r, pl = fract(-r * 0.8 + u_t * 0.35 + id * 0.37);
          Lq += vec3(1.0, 0.75, 0.3) * (exp(-sq(dd / 0.006)) * 0.55 + exp(-sq(dd / 0.022)) * 0.15) * smoothstep(0.1, 0.25, r) * fq * (0.45 + 1.2 * exp(-sq((pl - 0.5) / 0.06))); }
        L = Lq * (1.0 - smoothstep(0.82, 0.97, r)); } }
    else if (v_k > 87.5 && v_k < 88.5) { // (v415 TI, Titan) glowing earth fractures on the floor (a unit disc squashed to it): ember light along the cracks out to the front v_q.x, hottest just behind it; v_q.y seed, v_q.z heat; v_c its colour
      vec3 cr = ttnCr(u, v_q.y, 1.0); float an = atan(u.y, u.x), lt = 1.0 - smoothstep(v_q.x - 0.12, v_q.x, r), band = exp(-sq((r - v_q.x) / 0.07)) * step(r, v_q.x + 0.05), fl = 0.8 + 0.2 * n2(vec2(r * 7.0 - t * 2.0, an * 4.0 + v_q.y));
      float k = (cr.x + 0.55 * cr.y) * lt, temp = v_q.z * (0.3 + 0.62 * k + 0.55 * band * cr.x) * (1.0 - 0.3 * r) * fl;
      L = eramp(temp, col) * min(1.0, k * 1.4 + band * cr.x * 0.8) + col * exp(-sq(cr.z / 0.07)) * lt * 0.1 * v_q.z * (1.0 - r);
      L *= 1.0 - smoothstep(0.9, 1.0, r); }
    else if (v_k > 90.5 && v_k < 91.5) { // (v415 TI, Titan) the amber summoning sigil (a unit disc on the floor, turned by its quad): drawn on from the middle out as v_q.x goes 0..1; v_q.y seed, v_q.z heat; v_c its colour
      float m = ttnSig(u, v_q.y), an = atan(u.y, u.x), rv = smoothstep(r - 0.12, r + 0.02, v_q.x * 1.12), fl = 0.84 + 0.16 * n2(vec2(an * 3.0 + v_q.y, t * 2.3)), core = exp(-m * m), halo = exp(-m * m / 14.0);
      L = (col * 0.4 * halo + mix(col, vec3(1.0, 0.92, 0.72), 0.55) * core * 0.8 + vec3(1.0, 0.97, 0.88) * core * core * 0.5) * v_q.z * fl * rv + col * 0.16 * (1.0 - r) * rv * v_q.z;
      L *= 1.0 - smoothstep(0.95, 1.0, r); }
    else if (v_k > 69.5 && v_k < 70.5) { // (v412 LM) Light Strong's light: v_q.x 0 a lantern's light spilling on the floor (uv a unit disc squashed by its quad; v_q.y
      // its turn, v_q.z its flicker seed): warm at its middle, v_c outward, hexagonal, the soft shadows of its six rods radiating; 1 / 2 a mirror's left / right
      // half breaking up into glints (as kind 69: its frame's wire, rims and bead lit, its face faint)
      if (v_q.x < 0.5) { float an = atan(u.y, u.x) - v_q.y, hx = mod(an, 1.0471976) - 0.5235988, rr = r * mix(1.0, 0.866 / cos(hx), 0.5), fk = 1.0 + 0.07 * sin(u_t * 17.0 + v_q.z * 3.0) + 0.05 * sin(u_t * 29.3 + v_q.z), sh = smoothstep(0.7, 1.0, cos(6.0 * an)) * smoothstep(0.1, 0.5, rr);
        L = mix(vec3(1.0, 0.93, 0.9), col, smoothstep(0.0, 0.55, rr)) * exp(-rr * rr * 2.6) * (1.0 - 0.38 * sh) * fk * (1.0 - smoothstep(0.8, 1.0, r)); }
      else { vec2 p = vec2(u.x * 48.0, u.y * 88.0); float dO = lmAr(p, 42.0, 84.0), dI = lmAr(p, 29.0, 71.0), mk = (1.0 - smoothstep(-0.7, 0.7, dO)) * (v_q.x < 1.5 ? 1.0 - smoothstep(-0.5, 0.5, p.x) : smoothstep(-0.5, 0.5, p.x)), fr = smoothstep(-0.6, 0.6, dI);
        float fw = clamp(dI / max(dI - dO, 0.01), 0.0, 1.0), wire = exp(-sq(lmAr(p, 37.5, 79.5) / 1.3)), rim = exp(-sq(dO / 1.5)) + exp(-sq(dI / 1.2));
        L = (col * fr * (0.3 + 0.4 * exp(-sq((fw - 0.84) / 0.12))) + vec3(1.0, 0.94, 0.97) * (wire * 0.85 + rim * 0.5) * fr + vec3(1.0, 0.85, 0.93) * (1.0 - fr) * 0.22) * mk; } }
    else if (v_k > 58.5 && v_k < 59.5) { // (v404 DK) an eclipse's corona round a dark disc of radius 0.42: a thin silver ring at the limb, streamers of
      // silver-violet light flickering out of it, fine rays at v_q.x >= 1; v_q.y seed, v_q.z its pulse
      float an = atan(u.y, u.x), h = max(r - 0.42, 0.0), st = fbm(vec2(an * 3.0 + v_q.y, h * 4.0 - t * 0.5)), st2 = fbm(vec2(an * 9.0 - v_q.y, h * 9.0 - t * 1.1)), reach = 0.1 + 0.36 * st * st + 0.12 * st2;
      L = vec3(0.93, 0.9, 0.98) * exp(-sq((r - 0.425) / 0.018)) * 1.1 + mix(vec3(0.65, 0.36, 1.0), vec3(0.93, 0.9, 0.98), exp(-h * 8.0)) * exp(-h / max(reach, 0.02)) * smoothstep(0.4, 0.43, r) * (0.55 + 0.45 * st2) * 0.8;
      if (v_q.x > 0.5) L += vec3(0.9, 0.86, 1.0) * pow(0.5 + 0.5 * cos(an * 16.0 + v_q.y * 3.0), 12.0) * exp(-h * 3.5) * smoothstep(0.41, 0.44, r) * 0.55;
      L *= (1.0 + 0.4 * v_q.z) * (1.0 - smoothstep(0.85, 1.0, r)); }
    else if (v_k > 41.5 && v_k < 44.5) { // (v402, Sunflare light)
      if (v_k < 42.5) { // its corona (the heart fills the inner 0.43): curved crescent strips of rose light turning, at v_q.x >= 2 a second
        // ring of thinner magenta-and-lavender strips curling the other way, at 3 fine pearl-and-gold rays; a soft halo where it leaves
        // the heart, all of it flickering like plasma. v_q.y its turn (seconds), v_q.z the tick's pulse
        float an = atan(u.y, u.x), T2 = v_q.y, u1 = clamp((r - 0.42) / 0.46, 0.0, 1.0), a1 = an - 0.42 * pow(u1, 1.3) - T2 * 0.25, c1 = 0.5 + 0.5 * cos(a1 * 12.0);
        float fl = 0.7 + 0.6 * fbm(vec2(an * 4.0 + T2 * 0.4, r * 5.0 - u_t * 0.8)), env = sin(3.1416 * min(1.0, u1 * 1.15 + 0.05)) * (1.0 - 0.45 * u1) * smoothstep(0.36, 0.5, r);
        L = mix(vec3(1.0, 0.36, 0.8), vec3(0.91, 0.24, 0.67), u1) * pow(c1, 5.0) * env * 1.1 * fl + vec3(1.0, 0.83, 0.93) * pow(c1, 40.0) * env * 0.55;
        if (v_q.x > 1.5) { float u2 = clamp((r - 0.44) / 0.52, 0.0, 1.0), a2 = an + 0.32 * pow(u2, 1.3) + T2 * 0.42 + 1.0, id = mod(floor(a2 * 18.0 / 6.2832 + 0.5), 3.0);
          L += mix(vec3(0.91, 0.24, 0.67), vec3(0.84, 0.77, 1.0), step(0.5, id) * step(id, 1.5)) * pow(0.5 + 0.5 * cos(a2 * 18.0), 9.0) * sin(3.1416 * u2) * (1.0 - 0.3 * u2) * 0.65 * fl; }
        if (v_q.x > 2.5) { float a3 = an - T2 * 0.12, hh = h1(vec2(floor(a3 * 40.0 / 6.2832 + 0.5), 3.7)), u3 = clamp((r - 0.4) / (0.3 + 0.26 * hh), 0.0, 1.0);
          L += mix(vec3(1.0, 0.96, 0.99), vec3(1.0, 0.89, 0.63), step(0.83, hh)) * pow(0.5 + 0.5 * cos(a3 * 40.0), 14.0) * (1.0 - u3) * smoothstep(0.36, 0.44, r) * 0.6; }
        L += vec3(1.0, 0.36, 0.8) * exp(-sq((r - 0.44) / 0.14)) * 0.3 + vec3(1.0, 0.5, 0.85) * exp(-r * r * 3.0) * 0.22;
        L *= (1.0 + 0.35 * v_q.z) * edge; }
      else if (v_k < 43.5) { // its shaft (uv.y -1 at the heart .. 1 at the floor): a cone of light 0.36 as wide at its top, blush in its middle,
        // rose at its edges with a brighter rim down each side, strands of light flowing down it. v_q.x the tick's pulse, v_q.z gold strands
        float v = u.y * 0.5 + 0.5, hf = mix(0.36, 1.0, v), xs = u.x / hf, q = abs(xs);
        float vy = (0.25 + 0.75 * smoothstep(0.0, 0.3, v)) * (1.0 - smoothstep(0.72, 1.0, v)), k = exp(-q * q * 2.4) * (1.0 - smoothstep(0.82, 1.0, q)), rim = exp(-sq((q - 0.8) / 0.08)) * 0.35;
        float st = smoothstep(0.42, 0.8, fbm(vec2(xs * 9.0, v * 2.2 - u_t * 0.55))), fine = pow(n2(vec2(xs * 26.0 + 7.0, v * 1.5 - u_t * 0.9)), 4.0);
        vec3 c = mix(vec3(1.0, 0.83, 0.93), vec3(1.0, 0.56, 0.86), min(1.0, q * 2.0)); c = mix(c, vec3(1.0, 0.36, 0.8), clamp(q * 2.0 - 1.0, 0.0, 1.0)); c = mix(c, vec3(1.0, 0.89, 0.63), v_q.z * fine);
        L = c * ((k * 0.55 + rim) * (0.7 + 0.7 * st) + k * fine * 0.6) * vy * (1.0 + 0.2 * v_q.x) * step(q, 1.0); }
      else { // a heart drawn in light: its outline (v_q.x the line's half width), shown from its point round to v_q.y of the way up both
        // sides (1.1: all of it), and v_q.z of a halo glowing out from it
        vec2 p = hmap(u); float d = hsd(p), up = abs(atan(p.x, 0.55 - p.y)) / 3.1416, w = max(v_q.x, 0.01), sh = 1.0 - smoothstep(v_q.y - 0.05, v_q.y, up);
        L = mix(col, vec3(1.0), 0.75 * exp(-sq(d / (w * 0.4)))) * exp(-sq(d / w)) * sh + col * v_q.z * exp(-max(d, 0.0) * 7.0) * (d > 0.0 ? 1.0 : 0.35);
        L *= 1.0 - smoothstep(0.88, 1.0, max(abs(u.x), abs(u.y))); } }
    else if (v_k > 47.5 && v_k < 51.5) { // (v404 LT) Light's light: 48 a heart of light, 50 a star of light, 51 a column of light
      if (v_k < 48.5) { // a heart filled with soft light (pearl at its heart, blush, the quad's colour out to the rim), v_q.y the fill's strength; its rim
        // line (v_q.x its half width); v_q.z 0..3 nested outlines inside it, + 10 a halo outside
        vec2 p = hmap(u); float d = hsd(p), w = max(v_q.x, 0.004), ins = 1.0 - smoothstep(-0.012, 0.01, d), rc = length(p - vec2(-0.02, 0.56)), nn = mod(v_q.z, 10.0);
        L = mix(vec3(1.0, 0.96, 0.99), mix(vec3(1.0, 0.83, 0.93), col, smoothstep(0.12, 0.5, rc)), smoothstep(0.0, 0.25, rc)) * ins * v_q.y * (0.4 + 0.6 * exp(-rc * rc * 5.0) + 0.35 * smoothstep(-0.12, 0.0, d));
        L += mix(col, vec3(1.0), 0.7 * exp(-sq(d / (w * 0.45)))) * exp(-sq(d / w));
        for (int k = 1; k < 4; k++) { float fk = float(k); if (fk > nn + 0.5) break; float s = 1.0 - 0.2 * fk; vec2 c0 = vec2(0.0, 0.5); float dk = hsd((p - c0) / s + c0) * s; L += mix(col, vec3(1.0), 0.6 * exp(-sq(dk / (w * 0.4)))) * exp(-sq(dk / (w * 0.85))) * 0.8; }
        if (v_q.z > 9.5) L += col * exp(-max(d, 0.0) * 13.0) * (1.0 - ins) * 0.4 * (1.0 - smoothstep(0.6, 0.95, r));
        L *= 1.0 - smoothstep(0.86, 1.0, max(abs(u.x), abs(u.y))); }
      else if (v_k < 50.5) { // a five-pointed star of light (a point up, turned by v_q.y): v_q.z 0 a little star (a pearl body, the quad's colour at its edge, a
        // soft glow, v_q.x the glow's strength); v_q.z > 0 the Wish star's outline or wave (its profile wprof, a point toward +u.x, its edge at 0.8 of
        // the quad): a pearl leading edge (v_q.z its width), a rose band inside, a translucent candy body of v_q.x, a halo; drawn round from the
        // point to v_q.y of the way (1 all)
        float ca = cos(v_q.y), sa = sin(v_q.y); vec2 p = vec2(u.x * ca - u.y * sa, -(u.x * sa + u.y * ca));
        if (v_q.z < 0.001) { float d = sd5(p, 0.62, 0.42), ins = 1.0 - smoothstep(-0.02, 0.02, d); L = mix(vec3(1.0, 0.97, 0.99), col, smoothstep(0.05, 0.55, length(p) / 0.62)) * ins + col * exp(-max(d, 0.0) * 9.0) * (1.0 - ins) * v_q.x; }
        else { float q = r / (0.8 * wprof(atan(u.y, u.x))), w = v_q.z, an = mod(atan(u.y, u.x), 6.2832) / 6.2832, sh = v_q.y > 0.999 ? 1.0 : 1.0 - smoothstep(v_q.y - 0.012, v_q.y, an);
          L = (vec3(1.0, 0.97, 0.99) * exp(-sq((q - 0.985) / w)) * 1.2 + col * exp(-sq((q - 0.94) / (w * 2.5))) * 0.65 + mix(col, vec3(1.0, 0.56, 0.86), 0.5) * smoothstep(0.3, 0.92, q) * (1.0 - smoothstep(0.96, 1.02, q)) * 0.3 * v_q.x + col * exp(-max(q - 1.0, 0.0) * 14.0) * step(1.0, q) * 0.2) * sh; }
        L *= 1.0 - smoothstep(0.86, 1.0, max(abs(u.x), abs(u.y))); }
      else { // a column of light (uv.x across, uv.y along: -1 its top .. 1 its foot): a soft halo, a rose body with a brighter limb, a pearl middle,
        // currents winding down it (v_q.x of them, 1..3), fine strands streaming down; v_q.y its length in half widths (so the currents keep
        // their shape on any column), v_q.z its ends' feather (0 none .. 1)
        float x = u.x, ax = abs(x), v = u.y * 0.5 + 0.5, yy = v * max(v_q.y, 1.0), s = t * 1.5, body = exp(-ax * ax * 3.0) * (1.0 - smoothstep(0.7, 1.0, ax)), limb = exp(-sq((ax - 0.56) / 0.08)) * (1.0 - smoothstep(0.66, 0.86, ax)), core = exp(-sq(x / 0.13));
        float cu = smoothstep(0.42, 0.82, fbm(vec2(x * 3.0 + 1.7, yy * 0.9 - s))) * 0.6 + pow(0.5 + 0.5 * sin(yy * 2.2 - s * 3.0 + asin(clamp(x / 0.7, -1.0, 1.0)) * 2.0), 6.0) * body * 0.7;
        if (v_q.x > 1.5) cu += pow(0.5 + 0.5 * sin(yy * 2.2 - s * 3.0 - asin(clamp(x / 0.7, -1.0, 1.0)) * 2.0 + 3.1416), 8.0) * body * 0.5;
        if (v_q.x > 2.5) cu += smoothstep(0.55, 0.9, fbm(vec2(x * 8.0 + 5.0, yy * 1.8 - s * 2.4))) * 0.4;
        float st = pow(n2(vec2(x * 24.0 + 3.0, yy * 0.5 - s * 1.6)), 6.0) * body, fe = v_q.z > 0.0 ? smoothstep(0.0, 0.12 * v_q.z, v) * (1.0 - smoothstep(1.0 - 0.18 * v_q.z, 1.0, v)) : 1.0;
        L = (col * exp(-ax * ax * 1.6) * 0.3 + col * body * (0.5 + 0.4 * cu) + mix(col, vec3(1.0, 0.85, 0.94), 0.5) * limb * 0.45 + vec3(1.0, 0.95, 0.98) * core * (0.75 + 0.25 * cu) + vec3(1.0, 0.88, 0.95) * st * 0.6) * fe * (1.0 - smoothstep(0.88, 1.0, ax)); } }
    else if (v_k > 25.5) { // (v361, water light)
      if (v_k < 26.5) { // caustic light: v_q.z > 0.5 on a sphere of water (the web of light inside it, a specular glint, its rim
        // glowing), else on the floor (a pool of rippling light fading out); v_q.x strength, v_q.y seed
        if (v_q.z > 0.5) { vec3 n = vec3(u, sqrt(max(0.0, 1.0 - r * r))); float cs = caus(n.xy / (0.55 + n.z) * 5.5 + vec2(v_q.y * 3.0 - 250.0), t * 0.5);
          float lit = clamp(dot(n, vec3(-0.5, -0.62, 0.6)) * 1.1, 0.0, 1.0), sd = clamp(dot(n, vec3(-0.45, -0.56, 0.69)), 0.0, 1.0), spec = pow(sd, 160.0) + 0.25 * pow(sd, 24.0), spec2 = pow(clamp(dot(n, vec3(0.42, 0.5, 0.76)), 0.0, 1.0), 60.0);
          L = (mix(col, vec3(1.0), 0.55) * cs * 1.0 * (0.35 + 0.65 * smoothstep(1.0, 0.25, r)) + col * exp(-r * r * 3.0) * 0.22) * (1.0 - smoothstep(0.82, 0.99, r)) + vec3(1.0) * (spec * 1.2 + spec2 * 0.35) * (1.0 - smoothstep(0.88, 0.99, r));
          L += mix(col, vec3(0.8, 1.0, 1.0), 0.45) * exp(-sq((r - 0.93) / 0.07)) * 0.6; L *= v_q.x; }
        else { float fall = exp(-r * r * 2.2) * (1.0 - smoothstep(0.7, 1.0, r)), cs = caus(u * vec2(7.5, 7.5) + vec2(v_q.y * 3.0 - 250.0), t * 0.45);
          L = (mix(col, vec3(1.0), 0.4) * cs * 1.1 + col * 0.12) * fall * v_q.x; } }
      else if (v_k < 27.5) { // foam and spray: a churning white cloud breaking into droplets as it spreads (v_q.z 0..1)
        vec2 w = u + 0.3 * vec2(fbm(u * 2.0 + v_q.y) - 0.5, fbm(u * 2.0 + v_q.y + 4.0) - 0.5); float rr = length(w), an = atan(w.y, w.x), f = fbm(w * 3.2 + vec2(v_q.y, -t * 0.7)), g = fbm(vec2(an * 4.0 + v_q.y, rr * 5.0 - t * 1.5));
        float dns = exp(-rr * rr * (2.2 + 1.5 * v_q.z)) * smoothstep(0.32 + 0.25 * v_q.z, 0.78, f) * (1.0 - 0.6 * v_q.z * exp(-rr * rr * 6.0));
        vec2 cg = vec2(an * 7.0 + v_q.y, rr * 9.0 - t * 2.5 - v_q.z * 4.0), ci = floor(cg), cf = fract(cg) - 0.5 - (vec2(h1(ci + 3.1), h1(ci + 7.7)) - 0.5) * 0.5, df = cf * vec2(1.0, 1.6) / max(0.25, rr * 1.2);
        float drops = step(0.72, h1(ci)) * (1.0 - smoothstep(0.06, 0.16, length(cf * vec2(rr * 4.0 + 0.6, 1.0)))) * smoothstep(0.15, 0.4, rr) * (1.0 - smoothstep(0.7, 0.95, rr));
        vec2 bc = w * 6.0 + vec2(v_q.y * 3.0, t * 0.8), bi = floor(bc), bf = fract(bc) - 0.5 - (vec2(h1(bi + 2.2), h1(bi + 6.6)) - 0.5) * 0.4; float br = 0.12 + 0.18 * h1(bi + 4.4), bd = length(bf), bub = step(0.6, h1(bi + 8.8)) * (exp(-sq((bd - br) / 0.035)) * 0.8 + exp(-dot(bf + br * 0.45, bf + br * 0.45) * 900.0)) * exp(-rr * rr * 2.5);
        float cell = 1.0 - smoothstep(0.0, 0.5, abs(fbm(w * 7.0 + v_q.y * 2.0) - 0.5) * 3.0);
        L = (mix(col, vec3(1.0), 0.6) * dns * (0.6 + 0.35 * cell) + vec3(0.92, 1.0, 1.0) * drops * (0.6 + 0.6 * g) + vec3(0.85, 1.0, 1.0) * bub * 0.7) * v_q.x * (1.0 - smoothstep(0.75, 1.0, r)); }
      else if (v_k < 28.5) { // a ripple spreading on the water or the floor (quad 1.3 times its radius): a bright wavering crest,
        // smaller wavelets behind it, glints where the crest catches the light; v_q.x strength, v_q.z thickness
        float rr = r * 1.3, th = max(0.03, v_q.z), d = rr - 1.0, nn = fbm(vec2(atan(u.y, u.x) * 2.5 + v_q.y, rr * 3.0 - t * 0.6)), crest = exp(-sq((d + (nn - 0.5) * 0.05) / (th * 0.6))) * 0.8, tr = 0.0;
        for (int k = 1; k < 4; k++) { float fk = float(k); tr += exp(-sq((d + fk * th * 1.25 + (nn - 0.5) * 0.06) / (th * 0.45))) * (0.45 / fk); }
        L = (mix(col, vec3(1.0), 0.45) * (crest + tr) + col * step(rr, 1.0) * exp(-sq(d / (th * 4.0))) * 0.15 + vec3(1.0) * smoothstep(0.68, 0.88, nn) * crest * 0.8) * v_q.x * (1.0 - smoothstep(1.12, 1.28, rr)); }
/*<W>*/      else if (v_k > 32.5) { // (v370, wind light)
        if (v_k < 34.5) { // a blade of wind's light: a sharp luminous line along its outer edge, a soft halo outside it, the light fading
          // inward, bright streaks racing along it, glints; as kind 33
          vec4 B = wbl(u, v_q.x, v_q.z); float d = B.x, rr = r, md = floor(v_q.x / 10.0), along = md < 0.5 ? pow(clamp(1.0 - B.y, 0.0, 1.0), 1.1) : md < 1.5 ? 1.0 - smoothstep(0.75, 1.0, B.y) : 1.0;
          float inb = step(0.0, d + 0.01) * step(d, 1.0), prof = clamp(1.0 - d, 0.0, 1.0), edgeL = exp(-sq((rr - 0.794) / 0.0085)) * step(rr, 0.81) * smoothstep(-0.2, 0.15, 1.0 - d), halo = exp(-max(rr - 0.8, 0.0) * 45.0) * step(0.8, rr) * 0.3;
          float s1 = smoothstep(0.55, 0.85, fbm(vec2(B.w * 4.0 - t * 3.5, d * 7.0 + v_q.y))) * prof * inb, s2 = fbm(vec2(B.w * 1.5 - t * 1.2, d * 2.0 - v_q.y));
          vec2 gc = vec2(B.w * 9.0 - t * 2.0, d * 2.5), gi = floor(gc), gf = fract(gc) - 0.5; float gl = step(0.78, h1(gi + v_q.y)) * exp(-dot(gf, gf) * 70.0) * prof * inb;
          L = (mix(col, vec3(1.0), 0.4) * pow(prof, 1.5) * inb * (0.5 + 0.5 * s2) + vec3(0.9, 1.0, 0.96) * edgeL * 1.15 + mix(col, vec3(1.0), 0.65) * s1 * 0.55 + col * halo + vec3(1.0) * gl * 0.9) * along * B.z; }
        else if (v_k < 35.5) { // a sphere of turbulent air (quad 1.15 times its radius): translucent at its heart, ribbons of wind crossing
          // round it on three turning axes (the far side's fainter), a bright pressure front at its limb, wisps; v_q.x its core's light,
          // v_q.y seed, v_q.z spin
          vec2 w = u * 1.15; float rr = length(w), z = sqrt(max(0.0, 1.0 - rr * rr)), ins = 1.0 - smoothstep(0.975, 1.0, rr), tt = t * v_q.z, bands = 0.0, stk = 0.0; vec3 pf = vec3(w, z), pb = vec3(w, -z);
          for (int k = 0; k < 3; k++) { float fk = float(k), th = 1.15 + fk * 0.42, ph = tt * (0.8 + fk * 0.35) * (k == 1 ? -1.0 : 1.0) + fk * 2.1 + v_q.y * 3.0;
            vec3 ax = normalize(vec3(cos(ph) * sin(th), sin(ph) * sin(th) * 0.8, cos(th))), e1 = normalize(cross(ax, vec3(0.31, 0.0, 0.95))), e2 = cross(ax, e1);
            for (int s = 0; s < 2; s++) { vec3 p = s == 0 ? pf : pb; float wt = s == 0 ? 1.0 : 0.38, dd = dot(p, ax), psi = atan(dot(p, e2), dot(p, e1)), seg = smoothstep(-0.35, 0.6, sin(psi + tt * 3.0 * (1.0 + fk * 0.3) + fk * 2.0)), bw = 0.1 + 0.035 * fk;
              float b = exp(-sq(dd / bw)) * seg, eb = exp(-sq((dd - bw * 0.85) / (bw * 0.22))) * seg; bands += (b * 0.45 + eb * 0.85) * wt; stk += smoothstep(0.58, 0.88, fbm(vec2(psi * 3.0 - tt * 5.0, dd * 12.0 + fk * 3.0))) * b * wt; } }
          float tb = fbm3(vec3(w * 2.6, tt * 0.6 + v_q.y)), wisp = smoothstep(0.55, 0.78, tb) * 0.35 * ins * (0.4 + 0.6 * (1.0 - z)), front = exp(-sq((rr - 0.985) / 0.022)) + exp(-sq((rr - 0.93) / 0.07)) * 0.28, halo = exp(-max(rr - 1.0, 0.0) * 22.0) * step(1.0, rr) * 0.3;
          float fres = pow(1.0 - z, 2.2) * ins, core = v_q.x * (exp(-rr * rr * 24.0) * 1.2 + exp(-rr * rr * 5.0) * 0.3);
          L = (col * fres * 0.42 + mix(col, vec3(1.0), 0.45) * bands * ins * 1.25 + mix(col, vec3(1.0), 0.55) * stk * ins * 0.7 + mix(col, vec3(1.0), 0.3) * wisp + mix(col, vec3(1.0), 0.62) * front * 0.95 + col * halo + vec3(1.0, 1.0, 0.98) * core) * (1.0 - smoothstep(1.07, 1.15, rr)); }
        else if (v_k < 37.5) { // a funnel of wind (uv.y 1 its foot .. -1 its top; v_q.x its foot's width, v_q.y seed, v_q.z spin): three layers
          // of ribbons wound round it at different speeds, gaps between them, the far side fainter, sharp bright crests, white pressure
          // streaks, its silhouette denser, specks of debris carried round, its top fraying away
          float h = (1.0 - u.y) * 0.5; vec2 fw = wfun(h, v_q.x, t); float x = (u.x - fw.x) / fw.y, ax = abs(x), cx = clamp(x, -0.999, 0.999), th = asin(cx), z = sqrt(1.0 - cx * cx), tt = t * v_q.z;
          float env = smoothstep(0.0, 0.07, h) * (1.0 - smoothstep(0.78, 1.0, h + (fbm(vec2(u.x * 3.0, t * 0.7 + v_q.y)) - 0.5) * 0.3)) * (1.0 - smoothstep(0.9, 1.04, ax)), acc = 0.0, wh = 0.0;
          for (int k = 0; k < 3; k++) { float fk = float(k), n = 2.0 + fk, sp = (2.2 + fk * 1.3) * (1.0 + 0.6 * (1.0 - h)), tw = 1.5 + fk * 0.55;
            for (int s = 0; s < 2; s++) { float phh = s == 0 ? th : 3.14159 - th, wt = s == 0 ? (0.45 + 0.55 * z) : 0.32 * (0.5 + 0.5 * z), p = phh * n + h * tw * 6.2832 - tt * sp + fk * 1.7 + v_q.y, sn = sin(p);
              float band = smoothstep(0.25, 0.85, sn), edge = exp(-sq((sn - 0.93) / 0.055)), st = smoothstep(0.5, 0.85, fbm(vec2(p * 1.3, h * 10.0 - tt * 1.5 + fk * 4.0)));
              acc += (band * 0.32 + edge * 0.6) * wt * (1.0 - fk * 0.18); wh += st * band * wt; } }
          float limb = exp(-sq((1.0 - ax) / 0.12)) * 0.4; vec2 dc = vec2(th * 3.0 + tt * 1.5, h * 16.0 - tt * 1.2), di = floor(dc), df = fract(dc) - 0.5; float sp2 = step(0.86, h1(di + v_q.y)) * exp(-dot(df, df) * 80.0) * z;
          L = (mix(col, vec3(0.55, 0.95, 0.95), 0.35 * h) * acc + vec3(0.92, 1.0, 0.97) * wh * 0.65 + mix(col, vec3(1.0), 0.5) * limb + vec3(1.0, 0.95, 0.8) * sp2 * 0.8) * env; }
        else { // a ribbon of wind's light (uv.x along, uv.y across; as kind 39): a sharp luminous edge line, the light fading inward,
          // bright streaks racing along it
          float e = v_q.x > 0.5 ? (u.y + 1.0) * 0.5 : abs(u.y), af = 1.0 - smoothstep(0.65, 1.0, abs(u.x)), st = fbm(vec2(u.x * 2.0 - t * v_q.z, u.y * 3.0 + v_q.y)), cut = 1.0 - smoothstep(0.93, 1.0, e);
          L = (mix(col, vec3(1.0), 0.35) * pow(e, 2.0) * cut * 0.45 + vec3(0.92, 1.0, 0.97) * exp(-sq((e - 0.9) / 0.05)) * 0.95 + mix(col, vec3(1.0), 0.6) * smoothstep(0.55, 0.85, st) * cut * e * 0.7) * af; } }
/*</W>*/      else if (v_k > 31.5 && v_k < 32.5) { // (v368) a ring of flowing water-light (an annulus at uv radius 0.8 in a tilted ellipse
        // quad), smooth-edged, its streaks and glints racing round it with its spin; v_q.x = side (0 the far half, 1 the near, 2
        // all) + thickness (fraction), v_q.z spin
        float side = floor(v_q.x), th = max(0.02, fract(v_q.x)), d = (r - 0.8) / th, prof = exp(-d * d * 2.2), an = atan(u.y, u.x), sp = an + t * v_q.z;
        float half2 = side > 1.5 ? 1.0 : side > 0.5 ? smoothstep(-0.12, 0.12, u.y) : 1.0 - smoothstep(-0.12, 0.12, u.y);
        float fl = fbm(vec2(sp * 2.0 + v_q.y, d * 0.6 + 3.0)), fl2 = fbm(vec2(sp * 5.0 - v_q.y, d * 1.2)), cs = 0.5 + 0.5 * sin(sp * 6.0 + fl * 4.0);
        vec2 gc = vec2(sp * 6.0 / 3.14159, d * 0.5), gi = floor(gc), gf = fract(gc) - 0.5; float gl = step(0.7, h1(gi + v_q.y)) * exp(-dot(gf, gf) * 60.0) * (0.5 + 0.5 * sin(t * 7.0 + h1(gi) * 30.0));
        L = (mix(col, vec3(0.75, 1.0, 1.0), 0.25 + 0.35 * cs * fl) * prof * (0.55 + 0.6 * fl2) + vec3(1.0) * exp(-d * d * 9.0) * 0.35 * (0.6 + 0.4 * cs) + vec3(1.0) * gl * prof * 1.2) * half2 * (1.0 - smoothstep(0.92, 1.0, r)); }
      else if (v_k > 29.5 && v_k < 30.5) { // (v364) a cloud of bubbles rising (v_q.z its rise speed): each a thin bright ring with
        // a pearly sheen and a specular dot, wobbling up, fading at the cloud's edge
        float ev = (1.0 - smoothstep(0.55, 1.0, r)), Lb = 0.0; vec3 cb = vec3(0.0);
        for (int k = 0; k < 2; k++) { float fk = float(k), sc2 = 5.0 + fk * 3.0; vec2 bc = u * sc2 + vec2(v_q.y * 7.0 + fk * 3.3 + sin(t * 2.0 + u.y * 4.0 + fk) * 0.15, t * v_q.z * (1.0 + fk * 0.5)), bi = floor(bc), bf = fract(bc) - 0.5 - (vec2(h1(bi + 1.7 + fk), h1(bi + 3.9 + fk)) - 0.5) * 0.45;
          float rad = 0.1 + 0.2 * h1(bi + 7.3 + fk), d = length(bf), on = step(0.55, h1(bi + 5.1 + fk)), ring = exp(-sq((d - rad) / (0.05 + rad * 0.2))) * 0.8, dot2 = exp(-dot(bf + vec2(rad * 0.4, rad * 0.45), bf + vec2(rad * 0.4, rad * 0.45)) * 1400.0), fillb = (1.0 - smoothstep(rad * 0.7, rad, d)) * 0.08;
          float hue = h1(bi + 9.7 + fk); cb += on * (mix(col, vec3(1.0, 0.85, 0.98), 0.25 * hue) * (ring * 0.75 + fillb) + vec3(1.0) * dot2 * 0.9); }
        L = cb * ev * v_q.x; }
      else if (v_k > 30.5 && v_k < 31.5) { // (v364) shafts of light falling through water (uv.y along, -1 top .. 1 bottom): soft
        // rays swaying slowly, brightest at the top, fading out below and at the sides
        float y01 = u.y * 0.5 + 0.5, rays = 0.0; for (int k = 0; k < 4; k++) { float fk = float(k); rays += pow(0.5 + 0.5 * sin(u.x * (6.0 + fk * 4.3) + y01 * (0.8 + fk * 0.5) + t * (0.35 + fk * 0.17) + v_q.y * (1.0 + fk)), 6.0) * (0.6 - fk * 0.1); }
        float env = (1.0 - smoothstep(0.55, 1.0, abs(u.x))) * smoothstep(0.0, 0.18, y01) * (1.0 - smoothstep(0.35, 1.0, y01)) * (0.55 + 0.45 * fbm(vec2(u.x * 3.0 + t * 0.2, y01 * 2.0 + v_q.y)));
        L = mix(col, vec3(0.85, 1.0, 1.0), 0.35) * rays * env * v_q.x; }
      else { // the light on a stream of water (uv.x along): caustic glimmer, a glossy highlight with racing glints, a soft inner glow
        float al = u.x * 0.5 + 0.5, ay = abs(u.y), cs = caus(vec2(al * 3.2 - t * 0.2 * v_q.z, u.y * 0.8) * 6.28 + vec2(v_q.y * 3.0 - 250.0), t * 0.6);
        float env = (1.0 - smoothstep(0.2, 1.0, ay)) * smoothstep(0.0, 0.24, al) * (1.0 - smoothstep(0.76, 1.0, al)), sp = smoothstep(0.72, 0.95, n2(vec2(al * 30.0 - t * v_q.z * 2.0, u.y * 6.0 + v_q.y)));
        vec2 gc = vec2(al * 10.0 - t * v_q.z * 0.9, u.y * 2.5 + v_q.y), gi = floor(gc), gf = fract(gc) - 0.5 - (vec2(h1(gi + 1.3), h1(gi + 5.9)) - 0.5) * 0.6; float tw = 0.5 + 0.5 * sin(t * 9.0 + h1(gi) * 40.0), gl = step(0.78, h1(gi + 9.1)) * tw * (exp(-dot(gf, gf) * 260.0) + 0.5 * exp(-gf.x * gf.x * 900.0) * exp(-gf.y * gf.y * 60.0) + 0.5 * exp(-gf.y * gf.y * 900.0) * exp(-gf.x * gf.x * 60.0));
        L = (mix(col, vec3(0.7, 1.0, 1.0), 0.45) * cs * 0.4 + mix(col, vec3(1.0), 0.6) * exp(-sq((u.y + 0.35) / 0.14)) * (0.25 + 0.75 * sp) * 0.5 + col * exp(-u.y * u.y * 3.0) * 0.12 + mix(col, vec3(0.7, 1.0, 1.0), 0.5) * exp(-sq((ay - 0.6) / 0.2)) * 0.22 + vec3(1.0) * gl * 0.9) * env * v_q.x; } }
    else if (v_k > 22.5) { // (v356) a vortex of energy in the quad's colour (as kind 14: log-spiral arms round a bright eye; v_q.z its turn)
      float rr = r, an = atan(u.y, u.x), sw = an + v_q.z * t + 2.4 * log(rr + 0.08), arms = 0.5 + 0.5 * cos(3.0 * sw);
      vec2 sp = vec2(cos(sw), sin(sw)) * (0.5 + rr * 2.6); float f = fbm(sp * 1.5 + vec2(v_q.y, -t * 0.6) + rr * 2.0), g = fbm(sp * 4.2 + vec2(t * 0.9, v_q.y * 1.7));
      float dns = (pow(arms, 1.5) * (0.5 + 0.75 * f) + 0.22 * f) * (1.0 - smoothstep(0.5, 1.0, rr)), temp = v_q.x * (1.12 - rr * 0.95) * (0.5 + 0.65 * f) + 0.3 * exp(-rr * rr * 30.0);
      L = eramp(temp, col) * dns * (0.55 + 0.55 * g) + eramp(min(1.05, v_q.x * 1.05), col) * exp(-rr * rr * 45.0) * 0.6; }
    else if (v_k > 21.5) { // (v354) a tongue of energy in the quad's colour (as a flame tongue: base at uv.y = 1, soft rounded root)
      float h0 = (1.0 - u.y) * 0.5, h = h0 * 1.14 - 0.12, hp = max(h, 0.0), wob = (fbm(vec2(h * 3.0 - t * 2.5, v_q.y)) - 0.5) * 0.5 * hp, x = (u.x - wob) / max(0.05, (1.0 - pow(hp, 1.6)) * (0.5 + 0.5 * sin(min(1.0, hp * 3.0 + 0.25) * 1.57)));
      float f = fbm(vec2(u.x * 2.0, h * 3.0 - t * 3.4) + v_q.y), root = smoothstep(-0.11, 0.1, h - 0.22 * x * x + (f - 0.5) * 0.09), dns = (1.0 - smoothstep(0.55, 1.0, abs(x))) * root * (1.0 - smoothstep(0.75 + 0.2 * f, 1.0, h));
      float temp = v_q.x * (1.1 - hp * 0.9 - abs(x) * 0.35 - 0.3 * (1.0 - smoothstep(-0.04, 0.12, h))) + (f - 0.5) * 0.45; L = eramp(temp, col) * dns * (0.6 + 0.6 * f) * (1.0 - smoothstep(0.8, 1.0, abs(u.x))) * (1.0 - smoothstep(0.86, 1.0, u.y)); }
    else if (v_k > 20.5) { // (v354) a rolling wave of energy on the floor in the quad's colour (as kind 18)
      float rr = r * 1.3, d = rr - 1.0, th = max(v_q.z, 0.03); vec2 dr = u / max(r, 0.001);
      float f = fbm3(vec3(dr * 3.4, rr * 3.2 - t * 2.8) + v_q.y), f2 = fbm3(vec3(dr * 8.0, rr * 7.5 - t * 4.6) + v_q.y * 1.7), sg = fbm3(vec3(dr * 2.3, t * 1.1) + v_q.y * 3.1);
      float lead = exp(-sq(d / (th * 0.22))), reach = th * (0.18 + 1.1 * f * f), body = smoothstep(-th * (1.0 + 0.9 * f), -th * 0.1, d) * (1.0 - smoothstep(0.0, reach, d));
      float brk = smoothstep(0.28, 0.68, sg), dns = body * (0.3 + 0.7 * brk) * (0.45 + 0.8 * f2), temp = v_q.x * (0.5 + 0.55 * lead * (0.6 + 0.4 * brk) + 0.4 * (f2 - 0.5) - 0.25 * clamp(-d / th, 0.0, 1.0));
      L = eramp(temp, col) * dns + eramp(v_q.x * 0.8, col) * lead * brk * 0.32 * (0.6 + 0.6 * f2) + col * exp(-sq(d / (th * 2.6))) * step(d, 0.0) * 0.14 * f; L *= 1.0 - smoothstep(1.18, 1.3, rr); }
    else if (v_k > 19.5) { // (v354) a beam of energy in the quad's colour (as a fire beam: uv.x along, uv.y across; v_q.z its scroll)
      float al = u.x * 0.5 + 0.5, fe = fth(v_k), ee = fte(al, fe), f = fbm(vec2(al * 6.0 - t * v_q.z, u.y * 2.2 + v_q.y)), f2 = fbm(vec2(al * 13.0 - t * v_q.z * 1.6, u.y * 4.0 - 3.0)), ay = abs(u.y) / (0.62 + 0.4 * f) / (1.0 - 0.6 * ee);   /* (v388 E: a far end feathers out) */
      float dns = (1.0 - smoothstep(0.5, 1.0, ay)) * smoothstep(0.0, 0.22, al) * (fe > 0.0 ? ftk(ee) : 1.0 - smoothstep(0.78, 1.0, al)), temp = (v_q.x * (1.2 - ay * 1.05) + (f2 - 0.5) * 0.5) * (1.0 - 0.35 * ee); L = eramp(temp, col) * dns * (0.55 + 0.6 * f) * (1.0 - smoothstep(0.85, 1.0, abs(u.y))); }
    else if (v_k > 18.5) { // (v354) an orb of energy in the quad's colour: a turbulent, swirling ball, hottest in its heart (v_q.z swirl)
      float sw = v_q.z * t; vec2 rw = mat2(cos(sw), -sin(sw), sin(sw), cos(sw)) * u; vec2 w = rw + 0.24 * vec2(fbm(rw * 2.0 + vec2(t * 0.7, -t * 1.6) + v_q.y) - 0.5, fbm(rw * 2.0 + vec2(5.2, -t * 1.9) + v_q.y) - 0.5); float rr = length(w), f = fbm(w * 3.2 + vec2(v_q.y, -t * 2.2)), dns = 1.0 - smoothstep(0.42 + 0.36 * f, 0.98, rr);
      float temp = v_q.x * (1.15 - rr * 0.95) + (f - 0.5) * 0.55; L = eramp(temp, col) * dns * (0.5 + 0.6 * f) + col * exp(-r * r * 3.0) * 0.18 * edge; }
    else if (v_k > 17.5) { // (v349, Hearthburst, Cinder Wave) a rolling wave of fire energy on the floor (quad 1.3 times its radius, squashed
      // to the floor): a ragged band of turbulent flame streaming outward, hottest at its leading edge, broken into flickering
      // surges along its length, a faint warm wake inside; through 3D noise on the direction, so no seam (v_q.x heat, v_q.y seed,
      // v_q.z the band's depth behind the front, in radii)
      float rr = r * 1.3, d = rr - 1.0, th = max(v_q.z, 0.03); vec2 dr = u / max(r, 0.001);
      float f = fbm3(vec3(dr * 3.4, rr * 3.2 - t * 2.8) + v_q.y), f2 = fbm3(vec3(dr * 8.0, rr * 7.5 - t * 4.6) + v_q.y * 1.7), sg = fbm3(vec3(dr * 2.3, t * 1.1) + v_q.y * 3.1);
      float lead = exp(-sq(d / (th * 0.22))), reach = th * (0.18 + 1.1 * f * f), body = smoothstep(-th * (1.0 + 0.9 * f), -th * 0.1, d) * (1.0 - smoothstep(0.0, reach, d));
      float brk = smoothstep(0.28, 0.68, sg), dns = body * (0.3 + 0.7 * brk) * (0.45 + 0.8 * f2);
      float temp = v_q.x * (0.5 + 0.55 * lead * (0.6 + 0.4 * brk) + 0.4 * (f2 - 0.5) - 0.25 * clamp(-d / th, 0.0, 1.0));
      L = ramp(temp) * dns + ramp(v_q.x * 0.8) * lead * brk * 0.32 * (0.6 + 0.6 * f2) + col * exp(-sq(d / (th * 2.6))) * step(d, 0.0) * 0.14 * f;
      L *= 1.0 - smoothstep(1.18, 1.3, rr); }
    else if (v_k > 16.5) { // (v346, lightning) a ball of lightning (quad 1.35 times its radius): a sphere of electric plasma turning, filaments of
      // light writhing over it (3D ridged noise), a white-hot heart, a thin bright rim and a halo; v_c its colour, v_q.x strength, v_q.y seed
      float rr = r * 1.35, ins = 1.0 - smoothstep(0.93, 1.0, rr); vec3 n = vec3(u * 1.35, sqrt(max(0.0, 1.0 - rr * rr))); float an = t * 0.9 + v_q.y, ca = cos(an), sa = sin(an); vec3 p = vec3(n.x * ca + n.z * sa, n.y, -n.x * sa + n.z * ca);
      float rg = 1.0 - abs(fbm3(p * 3.2 + vec3(0.0, t * 1.4, t * 0.6)) * 2.0 - 1.0), rg2 = 1.0 - abs(fbm3(p * 6.5 - vec3(t * 1.1, 0.0, 0.0)) * 2.0 - 1.0), fil = pow(rg, 9.0) + 0.5 * pow(rg2, 12.0);
      L = (col * (0.28 + 0.4 * n.z) + vec3(0.78, 0.92, 1.0) * fil * 1.3 + vec3(1.0) * exp(-rr * rr * 3.2) * 0.85) * ins * v_q.x + vec3(0.85, 0.95, 1.0) * exp(-sq((rr - 0.97) / 0.035)) * 0.6 * v_q.x + col * exp(-max(rr - 1.0, 0.0) * 7.0) * (1.0 - ins) * 0.35 * v_q.x;
      L *= 1.0 - smoothstep(1.25, 1.35, rr); }
    else if (v_k > 13.5) { // (v343, Armageddon) a vortex of fire: turbulent flame wound into log-spiral arms round a hot eye (v_q.x heat,
      // v_q.y seed, v_q.z turns: the way and speed it spins); no seam round it, fading out to its rim
      float rr = r, an = atan(u.y, u.x), sw = an + v_q.z * t + 2.4 * log(rr + 0.08), arms = 0.5 + 0.5 * cos(3.0 * sw);
      vec2 sp = vec2(cos(sw), sin(sw)) * (0.5 + rr * 2.6); float f = fbm(sp * 1.5 + vec2(v_q.y, -t * 0.6) + rr * 2.0), g = fbm(sp * 4.2 + vec2(t * 0.9, v_q.y * 1.7));
      float dns = (pow(arms, 1.5) * (0.5 + 0.75 * f) + 0.22 * f) * (1.0 - smoothstep(0.5, 1.0, rr)), temp = v_q.x * (1.12 - rr * 0.95) * (0.5 + 0.65 * f) + 0.3 * exp(-rr * rr * 30.0);
      L = ramp(temp) * dns * (0.55 + 0.55 * g) + ramp(min(1.05, v_q.x * 1.05)) * exp(-rr * rr * 45.0) * 0.6; }
    else if (v_k > 12.5) { // (v342) the corona of a great sphere of fire (quad 1.7 times its radius): flames licking out all round its limb,
      // rising and flickering through 3D noise (no seam round it), hotter at their roots, longer as it grows unstable (v_q.z)
      float rr = r * 1.7, h = rr - 1.0; vec2 dr = u / max(r, 0.001); float fl = fbm3(vec3(dr * 2.6, rr * 2.1 - t * 1.7) + v_q.y), fl2 = fbm3(vec3(dr * 6.5, rr * 4.8 - t * 3.1) + v_q.y * 2.0);
      float reach = 0.08 + 0.5 * fl * fl * fl * 2.2 + 0.2 * v_q.z, dns = smoothstep(-0.05, 0.015, h) * (1.0 - smoothstep(0.0, reach, h)) * (0.45 + 0.75 * fl2);
      float temp = v_q.x * (1.05 - clamp(h / max(reach, 0.04), 0.0, 1.0) * 0.75) * (0.7 + 0.45 * fl2);
      L = ramp(temp) * dns + ramp(v_q.x * 0.75) * exp(-h * h * 900.0) * 0.55 + col * exp(-h * 5.0) * smoothstep(-0.02, 0.02, h) * 0.12;   /* (the flames; a thin hot rim on the limb; a faint haze) */
      L *= 1.0 - smoothstep(1.45, 1.7, rr); }
    else if (v_k < 0.5) L = col * exp(-r * r * 4.2) * edge * 0.6;                                                              // a glow
    else if (v_k < 1.5) { float d = max((v_q.x - r) / v_q.z, 0.0); L = mix(col, vec3(1.0), 0.6 * exp(-d * 12.0)) * (1.0 - smoothstep(v_q.x - 0.012, v_q.x + 0.01, r)) * (0.4 * exp(-d * 2.4) + 0.7 * exp(-d * 12.0)); }   // a ring
    else if (v_k < 2.5) { float fe = fth(v_k), ee = fte(u.x * 0.5 + 0.5, fe), wy = u.y / (1.0 - 0.6 * ee); L = col * exp(-wy * wy * 5.0) * (fe > 0.0 ? (1.0 - smoothstep(0.6, 1.0, -u.x)) * ftk(ee) : 1.0 - smoothstep(0.6, 1.0, abs(u.x))) * (v_q.z > 0.5 ? mix(v_q.x, v_q.y, u.x * 0.5 + 0.5) : 1.0); }   // (v392 Z: v_q.z 1, its strength runs from v_q.x at its start to v_q.y at its end: a chain fades in smoothly, no cut) a beam (v388 E: its far end feathers out when it ends aline)
    else if (v_k < 3.5) { // a ball of fire
      vec2 w = u + 0.22 * vec2(fbm(u * 2.0 + vec2(t * 0.7, -t * 1.6)) - 0.5, fbm(u * 2.0 + vec2(5.2, -t * 1.9)) - 0.5); float rr = length(w), f = fbm(w * 3.0 + vec2(0.0, -t * 2.2)), dns = 1.0 - smoothstep(0.45 + 0.35 * f, 0.98, rr);
      float temp = v_q.x * (1.15 - rr * 0.95) + (f - 0.5) * 0.55; L = ramp(min(temp, 0.74 + 0.4 * smoothstep(0.9, 1.2, v_q.x))) * dns * (0.5 + 0.55 * f); }   /* (white only in a very hot ball's heart) */
    else if (v_k < 4.5) { // a flame tongue: base at uv.y = 1, tip at -1
      // (v349) the root is soft and rounded, not cut: the flame starts a little above the quad's foot and fades into it through
      // noise, its sides lifting first, so no straight edge shows at its base
      float h0 = (1.0 - u.y) * 0.5, h = h0 * 1.14 - 0.12, hp = max(h, 0.0), wob = (fbm(vec2(h * 3.0 - t * 2.5, v_q.y)) - 0.5) * 0.5 * hp, x = (u.x - wob) / max(0.05, (1.0 - pow(hp, 1.6)) * (0.5 + 0.5 * sin(min(1.0, hp * 3.0 + 0.25) * 1.57)));
      float f = fbm(vec2(u.x * 2.0, h * 3.0 - t * 3.4) + v_q.y), root = smoothstep(-0.11, 0.1, h - 0.22 * x * x + (f - 0.5) * 0.09), dns = (1.0 - smoothstep(0.55, 1.0, abs(x))) * root * (1.0 - smoothstep(0.75 + 0.2 * f, 1.0, h));
      float temp = v_q.x * (1.1 - hp * 0.9 - abs(x) * 0.35 - 0.3 * (1.0 - smoothstep(-0.04, 0.12, h))) + (f - 0.5) * 0.45;   /* (cooler, dimmer at the very root) */ L = ramp(temp) * dns * (0.6 + 0.6 * f); }
    else if (v_k < 5.5) { // burning ground: patchy glow and bright cracks (seen from the camera: squashed by the quad)
      float f = fbm(u * 3.0 + v_q.y), cr = 1.0 - smoothstep(0.0, 0.06, abs(fbm(u * 4.0 + v_q.y * 2.0) - 0.5)), rad = exp(-r * r * 2.6) * edge;
      float temp = v_q.x * (0.55 * rad + 0.35 * f * rad + 0.8 * cr * smoothstep(1.0, 0.2, r)); L = ramp(temp) * (0.5 + 0.5 * f) * rad + ramp(v_q.x * 0.9) * cr * smoothstep(1.0, 0.25, r) * 0.7 * v_q.z; }
    else if (v_k < 6.5) { // a fire beam: uv.x along (-1 mouth .. 1 end), uv.y across
      float al = u.x * 0.5 + 0.5, fe = fth(v_k), ee = fte(al, fe), f = fbm(vec2(al * 6.0 - t * v_q.z, u.y * 2.2 + v_q.y)), f2 = fbm(vec2(al * 13.0 - t * v_q.z * 1.6, u.y * 4.0 - 3.0)), ay = abs(u.y) / (0.62 + 0.4 * f) / (1.0 - 0.6 * ee);   /* (v388 E: a far end feathers out) */
      float dns = (1.0 - smoothstep(0.5, 1.0, ay)) * smoothstep(0.0, 0.05, al) * (fe > 0.0 ? ftk(ee) : 1.0 - smoothstep(0.92, 1.0, al)), temp = (v_q.x * (1.2 - ay * 1.05) + (f2 - 0.5) * 0.5) * (1.0 - 0.35 * ee); L = ramp(temp) * dns * (0.55 + 0.6 * f); }
    else if (v_k < 7.5) { vec2 a = abs(u); L = col * (exp(-a.x * 2.5) * exp(-a.y * 30.0) + exp(-a.y * 2.5) * exp(-a.x * 30.0)) * edge; }   // a sparkle
    else { float n = fbm(vec2(atan(u.y, u.x) * 3.0, r * 6.0 - t * 2.0)); L = col * (exp(-sq((r - 0.82) / 0.07)) + 0.6 * exp(-sq((r - 0.68) / 0.05))) * (0.4 + 0.8 * n) * edge; }   // heat shimmer
    L *= pk;
    L = min(L * v_c.a, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); } }`;
  function prog(vs, fs, attrs) { const sh = (ty, src) => { const q = gl.createShader(ty); gl.shaderSource(q, src); gl.compileShader(q); if (!gl.getShaderParameter(q, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(q)); return q; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    const U = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const q = gl.getActiveUniform(p, i); U[q.name] = gl.getUniformLocation(p, q.name); } return { p, U }; }
  function build() { if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 4; cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; why = 'context lost'; lostAt = performance.now(); }); cv.addEventListener('webglcontextrestored', () => { ok = null; PR = null; PRW = null; }); }
    const o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }; gl = gl || cv.getContext('webgl2', o) || cv.getContext('webgl', o); if (!gl) { why = 'no WebGL'; return false; }
    try { const di = gl.getExtension('WEBGL_debug_renderer_info'); info = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { info = '?'; } soft = /swiftshader|llvmpipe|software|softpipe/i.test(info);
    PR = prog(VS, FSM(), ['a_p', 'a_uv', 'a_k', 'a_c', 'a_q']); bq = gl.createBuffer();
    try { PRW = prog(VS, FS, ['a_p', 'a_uv', 'a_k', 'a_c', 'a_q']); whyW = ''; } catch (e) { PRW = null; whyW = String(e && e.message || e).slice(0, 300); try { console.warn('Nidhogg GFX (wind): ' + whyW); } catch (e2) {} }
    return true; }
  /* (v375) a lost context (a phone may drop one when many pages or pictures want the GPU) is made again a moment later on a
     fresh canvas, rather than leaving every effect in 2D for the rest of the session; a failed frame only after three in a row */
  let lostAt = 0, fails = 0;
  function usable() { let f = null; try { f = typeof window !== 'undefined' ? window.__NG_GL : null; } catch (e) {} if (f === 0) return false;
    if (ok === false && why === 'context lost' && performance.now() - lostAt > 1500) { cv = null; gl = null; PR = null; PRW = null; ok = null; why = ''; }
    if (ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Nidhogg GFX: ' + why); } catch (e2) {} } } return !!ok && (!soft || f === 1); }
  const LOWQ = () => typeof st !== 'undefined' && st && !!st.lowFx;
  /* the batch: light quads and smoke quads, 12 floats a vertex */
  const RGB = new Map(), rgbOf = h => { let v = RGB.get(h); if (!v) { const q = hexRGB(h || '#FF7A2E'); v = [q[0] / 255, q[1] / 255, q[2] / 255]; RGB.set(h, v); } return v; };
  const QV = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]];
  const Q = { lit: new Float32Array(12 * 6 * 600), nl: 0, smk: new Float32Array(12 * 6 * 200), ns: 0, wlit: new Float32Array(12 * 6 * 200), nwl: 0, wsmk: new Float32Array(12 * 6 * 100), nws: 0, get windOK() { return !!PRW; }, a: 1, b: 0, c0: 0, d: 1, e: 0, f: 0, k: 1, t: 0, W: 0, Hh: 0, pet: [0, 0, 0], gpu: true,
    X(x, y) { return this.a * x + this.c0 * y + this.e; }, Y(x, y) { return this.b * x + this.d * y + this.f; },
    /* one quad: centre (screen px), half-axes (ux, uy), (vx, vy) in screen px */
    quad(kind, x, y, ux, uy, vx, vy, col, al, q0, q1, q2) { if (!(al > 0.004)) return; const solid = (kind >= 9 && kind <= 12) || kind === 16 || kind === 24 || kind === 25 || kind === 33 || kind === 36 || kind === 39 || kind === 40 || kind === 41 /* v402 */ || (kind >= 45 && kind <= 47) || kind === 49 || kind === 52 /* v404 LT */ || (kind >= 53 && kind <= 58 && kind !== 55) /* v404 DK */ || (kind >= 60 && kind <= 63) /* v409 DK2 */ || kind === 68 || kind === 69 /* v412 LM */ || kind === 71 /* v391 U4 */ || kind === 80 || kind === 82 || (kind >= 84 && kind <= 87) /* v415 EB */ || (kind >= 73 && kind <= 75) || kind === 78 /* v415 EA */ || kind === 89 || kind === 90 /* v415 TI */, wd = kind >= 33 && kind <= 40;
      const ka = wd ? (solid ? 'wsmk' : 'wlit') : (solid ? 'smk' : 'lit'), kn = wd ? (solid ? 'nws' : 'nwl') : (solid ? 'ns' : 'nl'); let A = this[ka]; const n = this[kn];
      if ((n + 6) * 12 > A.length) { const q = new Float32Array(A.length * 2); q.set(A); A = q; this[ka] = q; }
      const cx = this.X(x, y), cy = this.Y(x, y), a = this.a, b = this.b, c = this.c0, d = this.d, Ux = a * ux + c * uy, Uy = b * ux + d * uy, Vx = a * vx + c * vy, Vy = b * vx + d * vy, C = rgbOf(col); let o = n * 12;
      for (let j = 0; j < 6; j++) { const su = QV[j][0], sv = QV[j][1]; A[o++] = cx + Ux * su + Vx * sv; A[o++] = cy + Uy * su + Vy * sv; A[o++] = su; A[o++] = sv; A[o++] = kind; A[o++] = C[0]; A[o++] = C[1]; A[o++] = C[2]; A[o++] = al > 1 ? 1 : al; A[o++] = q0 || 0; A[o++] = q1 || 0; A[o++] = q2 || 0; }
      this[kn] += 6; },
    rq(kind, x, y, w, h, rot, col, al, q0, q1, q2) { const c = Math.cos(rot || 0), s = Math.sin(rot || 0); this.quad(kind, x, y, c * w, s * w, -s * h, c * h, col, al, q0, q1, q2); },
    /* (v412 SA) a satin ribbon as ONE continuous triangle strip (no links: no seams, steps or beads): n stations along it, each its centre
       (X, Y) and unit direction across (NX, NY) in the 2D path's coordinates, half width HW (px), twist TH (radians: its normal cos TH toward
       the camera + sin TH toward +across; cos > 0 shows its upper face) and alpha AL. kind 64 its body (laid over, satin shaded per pixel),
       65 a narrow light along its edges (added). o: pal (0 Eternal Light, 1 rose, 2 pearl, 3 Heartache), edge (its pale edges 0..1), trim
       (pal 0 a pearl centre stripe, else rose-gold lines), unit (px per unit of arc length, for its soft folds), gw (65: the light's reach,
       px), a (an alpha multiplier). FL (optional) a flash per station; D (optional) a depth per station: its stretches are then laid far to near (a helix crossing in
       front of itself). Each vertex carries its arc length, its px across, the twist, the half width and the ribbon's direction, all
       continuous along the strip, so the shading is one smooth function of the ribbon; its sides reach 1.2 px past the edge for the AA */
    satin(kind, n, X, Y, NX, NY, HW, TH, AL, o, FL, D) { if (n < 2) return; o = o || {}; const lit = kind === 65, ka = lit ? 'lit' : 'smk', kn = lit ? 'nl' : 'ns', k = this.k || 1, gw = Math.max(1, (o.gw || 4) * k), m = 1.2, un = 1 / ((o.unit || 40) * k), pal = (o.pal || 0) + Math.min(0.9, Math.max(0, o.trim || 0)), eg = lit ? gw : (o.edge == null ? 1 : o.edge);
      const W2 = v => v - Math.round(v / 6.283185307) * 6.283185307; let S = this._sv; if (!S || S.length < n * 8) S = this._sv = new Float32Array(n * 16);
      const a = this.a, b = this.b, c = this.c0, d = this.d; let ar = 0, pa = 0, pt = 0;
      for (let i = 0; i < n; i++) { const p = i * 8, x = this.X(X[i], Y[i]), y = this.Y(X[i], Y[i]); let nx = a * NX[i] + c * NY[i], ny = b * NX[i] + d * NY[i]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
        if (i) ar += Math.hypot(x - S[p - 8], y - S[p - 7]) * un;
        let al = Math.atan2(-nx, ny), th = TH[i]; if (i) { al = pa + W2(al - pa); th = pt + W2(th - pt); } pa = al; pt = th;
        S[p] = x; S[p + 1] = y; S[p + 2] = nx; S[p + 3] = ny; S[p + 4] = Math.max(0, HW[i]) * k; S[p + 5] = ar; S[p + 6] = al; S[p + 7] = th; }
      let A = this[ka]; const nv = this[kn], need = (nv + (n - 1) * 6) * 12; if (need > A.length) { let L = A.length; while (L < need) L *= 2; const q = new Float32Array(L); q.set(A); A = q; this[ka] = q; }
      let order = null; if (D) { order = []; for (let i = 0; i < n - 1; i++) order.push(i); order.sort((p, q) => (D[p] + D[p + 1]) - (D[q] + D[q + 1])); }
      let o2 = nv * 12; const ak = o.a == null ? 1 : o.a;
      const put = (i, sd) => { const p = i * 8, h = S[p + 4] + m; A[o2++] = S[p] + S[p + 2] * h * sd; A[o2++] = S[p + 1] + S[p + 3] * h * sd; A[o2++] = S[p + 5]; A[o2++] = h * sd; A[o2++] = kind; A[o2++] = FL ? FL[i] : 0; A[o2++] = eg; A[o2++] = pal; A[o2++] = Math.min(1, AL[i] * ak); A[o2++] = S[p + 7]; A[o2++] = S[p + 4]; A[o2++] = S[p + 6]; };
      for (let j = 0; j < n - 1; j++) { const i = order ? order[j] : j; if (AL[i] < 0.004 && AL[i + 1] < 0.004) continue; put(i, 1); put(i, -1); put(i + 1, 1); put(i + 1, 1); put(i, -1); put(i + 1, -1); }
      this[kn] = o2 / 12; },
    /* (v412 SA) a soft contact shadow on the floor (solid, kind 66): an ellipse of half axes rx, ry, darkest at its middle */
    sshadow(x, y, rx, ry, a, col) { if (!(a > 0.004) || !(rx > 0.5)) return; let A = this.smk; const n = this.ns; if ((n + 6) * 12 > A.length) { const q = new Float32Array(A.length * 2); q.set(A); A = q; this.smk = q; }
      const C = rgbOf(col || '#1C0714'), cx = this.X(x, y), cy = this.Y(x, y), ux = this.a * rx, uy = this.b * rx, vx = this.c0 * ry, vy = this.d * ry; let o = n * 12;
      for (let j = 0; j < 6; j++) { const su = QV[j][0], sv = QV[j][1]; A[o++] = cx + ux * su + vx * sv; A[o++] = cy + uy * su + vy * sv; A[o++] = su; A[o++] = sv; A[o++] = 66; A[o++] = C[0]; A[o++] = C[1]; A[o++] = C[2]; A[o++] = Math.min(1, a); A[o++] = 0; A[o++] = 0; A[o++] = 0; } this.ns += 6; },
    glow(x, y, r, col, a, sy) { if (r > 0.5) this.quad(0, x, y, r, 0, 0, r * (sy || 1), col, a); },
    ring(x, y, r, col, a, w, sy) { if (r > 0.5) this.quad(1, x, y, r * 1.04, 0, 0, r * 1.04 * (sy || 1), col, a, 0.96, 0, Math.max(0.02, (w || r * 0.1) / r * 0.6)); },
    beam(x0, y0, x1, y1, w, col, a) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; this.quad(2, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, col, a); },
    /* (v392 Z) a beam whose strength runs smoothly from a0 at (x0, y0) to a1 at (x1, y1) (times a): links of a chain given the
       same ramp at their shared ends fade in or out along it with no step, so a wide column's foot can feather out */
    rbeam(x0, y0, x1, y1, w, col, a, a0, a1) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5 || !(a * Math.max(a0, a1) > 0.004)) return; this.quad(2, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, col, a, a0, a1, 1); },
    fire(x, y, r, heat, a, seed, sy) { if (r > 0.5) { this.quad(10, x, y, r, 0, 0, r * (sy || 1), '#FFFFFF', a * 0.6, heat, seed || 0); this.quad(3, x, y, r, 0, 0, r * (sy || 1), '#FFFFFF', a * 0.8, heat, seed || 0); } },   /* (its body laid over, its light added) */
    billow(x, y, r, heat, a, seed, sy) { if (r > 0.5) { this.quad(10, x, y, r, 0, 0, r * (sy || 1), '#FFFFFF', a, heat, seed || 0); this.quad(3, x, y, r * 0.9, 0, 0, r * 0.9 * (sy || 1), '#FFFFFF', a * 0.3, heat * 0.9, seed || 0); } },   /* (a rolling volume of flame: mostly body, a little light; stacked by the dozen it stays orange) */
    tongue(x, y, w, h, rot, heat, a, seed) { if (h > 0.5) { const c = Math.cos(rot || 0), s = Math.sin(rot || 0); this.quad(4, x + s * h, y - c * h, c * w, s * w, -s * h, c * h, '#FFFFFF', a, heat, seed || 0); } },   /* (base at (x, y), rot 0 up) */
    ground(x, y, r, heat, a, seed, sy, cracks) { if (r > 0.5) this.quad(5, x, y, r, 0, 0, r * (sy || 0.55), '#FFFFFF', a, heat, seed || 0, cracks == null ? 1 : cracks); },
    firebeam(x0, y0, x1, y1, w, heat, a, seed, scroll) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; this.quad(6, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, '#FFFFFF', a, heat, seed || 0, scroll || 3); },
    firebody(x0, y0, x1, y1, w, heat, a, seed, scroll) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; this.quad(11, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, '#FFFFFF', a, heat, seed || 0, scroll || 3); },   /* (a fire beam's body: laid over, so it reads on any floor) */
    star(x, y, s, a, col) { this.quad(7, x, y, s, 0, 0, s, col || '#FFF6D8', a); },
    wave(x, y, r, heat, a, seed, sy, th) { if (r > 1 && a > 0.01) this.quad(18, x, y, r * 1.3, 0, 0, r * 1.3 * (sy || 1), '#FF5A1E', a, heat, seed || 0, th == null ? 0.18 : th); },   /* (v349) a rolling wave of fire energy, radius r at its front */
    /* (v354) energy in any colour, as the fire kinds: an orb, a beam, a floor wave, a tongue (heat 0..1.1, col its hue) */
    eorb(x, y, r, col, heat, a, seed, swirl) { if (r > 0.5) this.quad(19, x, y, r, 0, 0, r, col, a, heat, seed || 0, swirl || 0); },
    ebeam(x0, y0, x1, y1, w, col, heat, a, seed, scroll) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; this.quad(20, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, col, a, heat, seed || 0, scroll || 3); },
    ewave(x, y, r, col, heat, a, seed, sy, th) { if (r > 1 && a > 0.01) this.quad(21, x, y, r * 1.3, 0, 0, r * 1.3 * (sy || 1), col, a, heat, seed || 0, th == null ? 0.18 : th); },
    evortex(x, y, r, col, heat, a, seed, spin, sy) { if (r > 0.5) this.quad(23, x, y, r, 0, 0, r * (sy || 1), col, a, heat, seed || 0, spin || 1); },
    etongue(x, y, w, h, rot, col, heat, a, seed) { if (h > 0.5) { const c = Math.cos(rot || 0), s = Math.sin(rot || 0); this.quad(22, x + s * h, y - c * h, c * w, s * w, -s * h, c * h, col, a, heat, seed || 0); } },
    /* (v361) water: a sphere of water (body laid over, caustics, glints and rim light added), a stream (body + its light), caustic
       light on the floor, foam and spray, a spreading ripple */
    wsphere(x, y, r, col, a, seed, turn, dens, lite) { if (r > 0.5) { this.quad(24, x, y, r, 0, 0, r, col, a, dens == null ? 0.8 : dens, seed || 0, turn == null ? 1 : turn); this.quad(26, x, y, r, 0, 0, r, col, a, lite == null ? 0.9 : lite, seed || 0, 1); } },
    wstream(x0, y0, x1, y1, w, col, a, seed, flow, dens, lite) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; const vx = -dy / L * w, vy = dx / L * w; this.quad(25, x0 + dx, y0 + dy, dx, dy, vx, vy, col, a, dens == null ? 0.85 : dens, seed || 0, flow == null ? 3 : flow); this.quad(29, x0 + dx, y0 + dy, dx, dy, vx, vy, col, a, lite == null ? 0.7 : lite, seed || 0, flow == null ? 3 : flow); },
    caustic(x, y, r, col, a, seed, sy) { if (r > 0.5) this.quad(26, x, y, r, 0, 0, r * (sy || 1), col, a, 1, seed || 0, 0); },
    spray(x, y, r, col, a, seed, spread, sy) { if (r > 0.5) this.quad(27, x, y, r, 0, 0, r * (sy || 1), col || '#CFF6FF', a, 1, seed || 0, spread || 0); },
    wring(x, y, rx, ry, rot, col, a, side, th, seed, spin) { if (rx > 1 && a > 0.01) { const c = Math.cos(rot || 0), sn = Math.sin(rot || 0), k = 1 / 0.8; this.quad(32, x, y, c * rx * k, sn * rx * k, -sn * ry * k, c * ry * k, col, a, (side == null ? 2 : side) + Math.min(0.49, Math.max(0.02, th || 0.06)), seed || 0, spin || 1); } },
    /* (v370) wind: a blade of wind (an arc of radius |U| along U and V, its head toward U: mode 0 a trail, 1 a crescent, 2 a ring; th
       its thickness, a fraction of the radius; body laid over, light added), a sphere of turbulent air, shade under wind (a disc, or
       a funnel's body), a funnel of wind (foot at (x, y), top half-width rw, height h), a ribbon of wind (edge 0 both, 1 one) */
    wblade(x, y, ux, uy, vx, vy, col, lite, a, span, mode, th, seed, dens) { const k = 1.25, q = Math.min(6.28, Math.max(0.05, span)) + 10 * (mode || 0); if (dens !== 0) this.quad(33, x, y, ux * k, uy * k, vx * k, vy * k, col, a * (dens == null ? 1 : dens), q, seed || 0, th || 0.3); this.quad(34, x, y, ux * k, uy * k, vx * k, vy * k, lite || col, a, q, seed || 0, th || 0.3); },
    gust(x, y, r, col, a, core, seed, spin) { if (r > 0.5) this.quad(35, x, y, r * 1.15, 0, 0, r * 1.15, col, a, core || 0, seed || 0, spin == null ? 1 : spin); },
    wshade(x, y, rx, ry, col, a, seed, dens) { if (rx > 0.5) this.quad(36, x, y, rx, 0, 0, ry || rx, col, a, 0, seed || 0, dens == null ? 0.5 : dens); },
    funnel(x, y, rw, h, col, a, base, seed, spin, dens) { if (rw > 0.5 && h > 0.5) { const b = base == null ? 0.2 : base; if (dens !== 0) this.quad(36, x, y - h / 2, rw * 1.08, 0, 0, h / 2, col, a, 1 + b, seed || 0, dens == null ? 0.45 : dens); this.quad(37, x, y - h / 2, rw * 1.08, 0, 0, h / 2, col, a, b, seed || 0, spin == null ? 1 : spin); } },
    wrib(x0, y0, x1, y1, w, col, lite, a, edge, seed, flow, dens) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; const vx = -dy / L * w, vy = dx / L * w; if (dens !== 0) this.quad(39, x0 + dx, y0 + dy, dx, dy, vx, vy, col, a * (dens == null ? 1 : dens), edge || 0, seed || 0, flow == null ? 3 : flow); this.quad(38, x0 + dx, y0 + dy, dx, dy, vx, vy, lite || col, a, edge || 0, seed || 0, flow == null ? 3 : flow); },
    bubbles(x, y, rx, ry, col, a, seed, rise) { if (rx > 0.5) this.quad(30, x, y, rx, 0, 0, ry || rx, col || '#9FE8FF', a, 1, seed || 0, rise == null ? 1 : rise); },
    shafts(x0, y0, x1, y1, w, col, a, seed) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; this.quad(31, x0 + dx, y0 + dy, -dy / L * w, dx / L * w, dx, dy, col || '#8FE3F0', a, 1, seed || 0, 0); },   /* (uv.y runs from (x0, y0) to (x1, y1)) */
    ripple(x, y, r, col, a, seed, sy, th) { if (r > 1 && a > 0.01) this.quad(28, x, y, r * 1.3, 0, 0, r * 1.3 * (sy || 1), col, a, 1, seed || 0, th == null ? 0.12 : th); },
    shimmer(x, y, r, a, sy, col) { if (r > 0.5) this.quad(8, x, y, r, 0, 0, r * (sy || 1), col || '#FFA640', a); },
    smoke(x, y, r, a, seed, col, lit) { if (r > 0.5) this.quad(9, x, y, r, 0, 0, r, col || '#3A2E2A', a, lit || 0, seed || 0); },
    /* a comet trail of fire through screen points (head first), each stretch a fire-beam quad, tapering */
    trail(P, n, w, heat, a, seed) { for (let i = 0; i < n - 1; i++) { const k = i / (n - 1), x0 = P[i][0], y0 = P[i][1], x1 = P[i + 1][0], y1 = P[i + 1][1], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ex = dx / L * w * 0.4, ey = dy / L * w * 0.4;
      this.firebeam(x0 - ex, y0 - ey, x1 + ex, y1 + ey, w * (1 - 0.75 * k), heat * (1 - 0.6 * k), a * (1 - k * k), (seed || 0) + i * 0.37, 4); } } };
  /* begin a pass on the game canvas c (its transform is the camera); pet: [screen x, y, radius] to keep clear, or null */
  function begin(c, pet) { const B = c.getTransform(), cv0 = c.canvas, L = LOWQ(), k0 = Math.min(L ? 0.42 : 0.7, 1500 / Math.max(cv0.width, cv0.height));   /* (v364: a finer GPU layer: 1500 px on the long side, was 1200) */ Q.W = Math.max(8, Math.round(cv0.width * k0)); Q.Hh = Math.max(8, Math.round(cv0.height * k0)); const kx = Q.W / cv0.width;
    Q.a = B.a * kx; Q.b = B.b * kx; Q.c0 = B.c * kx; Q.d = B.d * kx; Q.e = B.e * kx; Q.f = B.f * kx; Q.k = (Math.sqrt(Math.abs(B.a * B.d - B.b * B.c)) || 1) * kx; Q.nl = Q.ns = Q.nwl = Q.nws = 0; Q.t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000 % 1000;
    if (pet) { Q.pet[0] = Q.X(pet[0], pet[1]); Q.pet[1] = Q.Y(pet[0], pet[1]); Q.pet[2] = pet[2] * Q.k; } else Q.pet[2] = 0; return Q; }
  /* (v388 E: every beam's far end feathers out) beams (kinds 2, 6, 11, 20) are laid as chains of overlapping stretches
     whose ends fade over only their last tenth or fifth (so the links sum to one where they overlap); the last stretch of a
     chain, or a lone stretch, therefore stopped in a short, blunt cut (the ult's column of light, eye beams, fire columns).
     Before drawing, each beam quad with no stretch of its own kind carrying on from its far end is marked in the fraction of
     its kind (kind + 0.05..0.45): the shader then thins and fades it to nothing over a stretch of about 1.7 of its widths
     (at least a fifth of it, at most seven tenths), whatever its length, zoom or the screen. Inner links are untouched */
  let FE = new Float32Array(10 * 1024);
  function featherEnds(A, nv) { const nq = nv / 6; let m = 0;
    for (let q = 0; q < nq; q++) { const o = q * 72, k = A[o + 4]; if (k !== 2 && k !== 6 && k !== 11 && k !== 20) continue;
      if ((m + 1) * 10 > FE.length) { const z = new Float32Array(FE.length * 2); z.set(FE); FE = z; }
      const x0 = A[o], y0 = A[o + 1], x1 = A[o + 12], y1 = A[o + 13], x5 = A[o + 60], y5 = A[o + 61], ux = (x1 - x0) / 2, uy = (y1 - y0) / 2, hl = Math.hypot(ux, uy) || 1e-6, cx = (x0 + x5) / 2, cy = (y0 + y5) / 2, p = m * 10;
      FE[p] = o; FE[p + 1] = k; FE[p + 2] = cx - ux; FE[p + 3] = cy - uy; FE[p + 4] = cx + ux; FE[p + 5] = cy + uy; FE[p + 6] = ux / hl; FE[p + 7] = uy / hl; FE[p + 8] = hl; FE[p + 9] = Math.hypot(x5 - x1, y5 - y1) / 2; m++; }
    for (let i = 0; i < m; i++) { const p = i * 10, k = FE[p + 1], ex = FE[p + 4], ey = FE[p + 5], dx = FE[p + 6], dy = FE[p + 7], hl = FE[p + 8], hw = FE[p + 9], tol = Math.max(hl * 0.95, hw * 1.2); let linked = false;
      for (let j = Math.max(0, i - 48), j1 = Math.min(m, i + 49); j < j1 && !linked; j++) { if (j === i) continue; const r = j * 10; if (FE[r + 1] !== k || FE[r + 8] < hl * 0.3 || FE[r + 8] > hl * 3.3) continue;
        const qx = ex - FE[r + 2], qy = ey - FE[r + 3]; if (qx * qx + qy * qy > tol * tol || dx * FE[r + 6] + dy * FE[r + 7] < 0.2 || qx * dx + qy * dy < -0.35 * hl) continue; linked = true; }
      if (linked) continue;
      const fe = Math.max(0.2, Math.min(0.7, 1.7 * hw / (2 * hl))), kk = k + 0.05 + (fe - 0.2) / 1.5, o = FE[p];
      for (let v = 0; v < 6; v++) A[o + v * 12 + 4] = kk; } }
  function flush(c) { if (!Q.nl && !Q.ns && !Q.nwl && !Q.nws) return; if (!usable()) return; try { const W = Q.W, Hh = Q.Hh; featherEnds(Q.lit, Q.nl); featherEnds(Q.smk, Q.ns);   /* (v388 E) */ if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }   /* (v326: one layer at a time, the whole canvas copied each time: no source rectangles at all, so no browser can crop or misplace a half) */
      gl.viewport(0, 0, W, Hh); gl.clearColor(0, 0, 0, 0); gl.enable(gl.BLEND); gl.useProgram(PR.p); gl.uniform2f(PR.U.u_res, W, Hh); gl.uniform1f(PR.U.u_t, Q.t); gl.uniform3f(PR.U.u_pet, Q.pet[0], Q.pet[1], Q.pet[2]); gl.bindBuffer(gl.ARRAY_BUFFER, bq);
      const attr = (i, n, off) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, 48, off * 4); }; let draws = 0;
      const use = P => { gl.useProgram(P.p); gl.uniform2f(P.U.u_res, W, Hh); gl.uniform1f(P.U.u_t, Q.t); gl.uniform3f(P.U.u_pet, Q.pet[0], Q.pet[1], Q.pet[2]); };
      const pass0 = (A, n) => { gl.bufferData(gl.ARRAY_BUFFER, A.subarray(0, n * 12), gl.DYNAMIC_DRAW); attr(0, 2, 0); attr(1, 2, 2); attr(2, 1, 4); attr(3, 4, 5); attr(4, 3, 9); gl.drawArrays(gl.TRIANGLES, 0, n); draws++; };
      const pass = (A, n, AW, nw) => { if (n) { use(PR); pass0(A, n); } if (nw && PRW) { use(PRW); pass0(AW, nw); } };   /* (v375: the main program's quads, then Wind's with its own) */
      const cv0 = c.canvas; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      if (Q.ns || Q.nws) { gl.clear(gl.COLOR_BUFFER_BIT); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); pass(Q.smk, Q.ns, Q.wsmk, Q.nws); c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, 0, cv0.width, cv0.height); }   // the left half: smoke, solid
      if (Q.nl || Q.nwl) { gl.clear(gl.COLOR_BUFFER_BIT); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR); pass(Q.lit, Q.nl, Q.wlit, Q.nwl); c.globalCompositeOperation = 'lighter'; c.drawImage(cv, 0, 0, cv0.width, cv0.height); }    // the right half: light, screened (stacked fire saturates softly, never clips to a white slab)
      stats.draws = draws; stats.quads = Q.nl / 6; stats.smoke = Q.ns / 6; stats.W = W; stats.H = Hh; stats.frames++; stats.maxDraws = Math.max(stats.maxDraws, draws); stats.maxQuads = Math.max(stats.maxQuads, Q.nl / 6); stats.maxSmoke = Math.max(stats.maxSmoke, Q.ns / 6);
      c.restore();
      fails = 0;
    } catch (e) { why = String(e && e.message || e); if (++fails >= 3 || (gl && gl.isContextLost && gl.isContextLost())) { ok = false; if (gl && gl.isContextLost && gl.isContextLost()) { why = 'context lost'; lostAt = performance.now(); } } } }
  /* (tests) pixels that break rgb <= a, right after a flush */
  function check() { if (!gl) return null; const W = cv.width, Hh = cv.height, px = new Uint8Array(W * Hh * 4); gl.readPixels(0, 0, W, Hh, gl.RGBA, gl.UNSIGNED_BYTE, px); let bad = 0, lit = 0; for (let i = 0; i < px.length; i += 4) { const a = px[i + 3]; if (a) lit++; if (px[i] > a + 1 || px[i + 1] > a + 1 || px[i + 2] > a + 1) bad++; } return { bad, lit }; }
  NM.FGFX = { usable, begin, flush, check, stats, windOK: () => !!PRW, info: () => ({ ok, soft, renderer: info, why, wind: !!PRW, whyW }) };
})();
