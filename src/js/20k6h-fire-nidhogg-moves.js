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
  let cv = null, gl = null, PR = null, bq = null, ok = null, soft = false, info = '', why = '';
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
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float fbm3(vec3 p){ return 0.5 * n3(p) + 0.27 * n3(p * 2.07 + 3.1) + 0.15 * n3(p * 4.13 + 7.7) + 0.08 * n3(p * 8.3 + 1.3); }
void main(){ vec2 u = v_uv; float r = length(u), m = 0.0, edge = 1.0 - smoothstep(0.85, 1.0, r); vec3 col = v_c.rgb; float t = u_t + v_q.y * 7.3, pk = u_pet.z > 0.0 ? mix(0.12, 1.0, smoothstep(0.4, 1.4, length((v_px - u_pet.xy) * vec2(1.0, 1.1)) / u_pet.z)) : 1.0;   /* (the rider's face stays clear: light, body and smoke) */
  pk *= v_k > 11.5 ? 1.0 : (v_k > 1.5 && v_k < 2.5) || (v_k > 5.5 && v_k < 6.5) || v_k > 10.5 ? 1.0 - smoothstep(0.8, 1.0, abs(u.y)) : (v_k > 3.5 && v_k < 4.5) ? 1.0 - smoothstep(0.8, 1.0, abs(u.x)) : (v_k > 0.5 && v_k < 1.5) || (v_k > 7.5 && v_k < 8.5) ? 1.0 - smoothstep(0.92, 1.0, r) : 1.0 - smoothstep(0.72, 1.0, r);   /* (every picture fades to nothing well inside its own quad: no straight cut where noise or a halo reaches the quad's edge) */
  if (v_k > 11.5 && v_k < 12.5) { // (v342, Apocalypse) a great sphere of fire (solid), seen as a turning globe: domain-warped
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
    float al = u.x * 0.5 + 0.5, f = fbm(vec2(al * 6.0 - t * v_q.z, u.y * 2.2 + v_q.y)), ay = abs(u.y) / (0.62 + 0.4 * f);
    float dns = (1.0 - smoothstep(0.45, 0.95, ay)) * smoothstep(0.0, 0.06, al) * (1.0 - smoothstep(0.9, 1.0, al)), temp = v_q.x * (1.2 - ay * 1.05) + (f - 0.5) * 0.4, a = dns * v_c.a * pk * smoothstep(0.1, 0.45, temp);
    gl_FragColor = vec4(ramp(min(temp, 0.78)) * 0.9 * a, a); }
  else if (v_k > 9.5 && v_k < 10.5) { // the body of fire (the solid pass, under its light): the same turbulent ball, its colour laid over so it reads on a bright floor
    vec2 w = u + 0.22 * vec2(fbm(u * 2.0 + vec2(t * 0.7, -t * 1.6)) - 0.5, fbm(u * 2.0 + vec2(5.2, -t * 1.9)) - 0.5); float rr = length(w), f = fbm(w * 3.0 + vec2(0.0, -t * 2.2)), dns = 1.0 - smoothstep(0.4 + 0.35 * f, 0.95, rr);
    float temp = v_q.x * (1.15 - rr * 0.95) + (f - 0.5) * 0.55, a = dns * v_c.a * pk * smoothstep(0.1, 0.45, temp); gl_FragColor = vec4(ramp(min(temp, 0.8)) * 0.85 * a, a); }
  else if (v_k > 8.5 && v_k < 9.5) { // smoke (the solid pass): billowing density, darker in its heart, lit a little from below
    float f = fbm(u * 2.2 + vec2(v_q.y * 3.1, v_q.y - t * 0.35)), d = clamp((1.0 - r * r) * (0.55 + 0.9 * f) - 0.25, 0.0, 1.0) * edge; float a = d * v_c.a * pk;
    vec3 c = mix(col * 0.6, col, smoothstep(-0.5, 0.6, -u.y + f * 0.5)) + vec3(0.35, 0.12, 0.03) * v_q.x * smoothstep(0.0, 1.0, u.y + 0.3); gl_FragColor = vec4(c * a, a); }
  else { vec3 L = vec3(0.0);
    if (v_k > 12.5) { // (v342) the corona of a great sphere of fire (quad 1.7 times its radius): flames licking out all round its limb,
      // rising and flickering through 3D noise (no seam round it), hotter at their roots, longer as it grows unstable (v_q.z)
      float rr = r * 1.7, h = rr - 1.0; vec2 dr = u / max(r, 0.001); float fl = fbm3(vec3(dr * 2.6, rr * 2.1 - t * 1.7) + v_q.y), fl2 = fbm3(vec3(dr * 6.5, rr * 4.8 - t * 3.1) + v_q.y * 2.0);
      float reach = 0.08 + 0.5 * fl * fl * fl * 2.2 + 0.2 * v_q.z, dns = smoothstep(-0.05, 0.015, h) * (1.0 - smoothstep(0.0, reach, h)) * (0.45 + 0.75 * fl2);
      float temp = v_q.x * (1.05 - clamp(h / max(reach, 0.04), 0.0, 1.0) * 0.75) * (0.7 + 0.45 * fl2);
      L = ramp(temp) * dns + ramp(v_q.x * 0.75) * exp(-h * h * 900.0) * 0.55 + col * exp(-h * 5.0) * smoothstep(-0.02, 0.02, h) * 0.12;   /* (the flames; a thin hot rim on the limb; a faint haze) */
      L *= 1.0 - smoothstep(1.45, 1.7, rr); }
    else if (v_k < 0.5) L = col * exp(-r * r * 4.2) * edge * 0.6;                                                              // a glow
    else if (v_k < 1.5) { float d = max((v_q.x - r) / v_q.z, 0.0); L = mix(col, vec3(1.0), 0.6 * exp(-d * 12.0)) * (1.0 - smoothstep(v_q.x - 0.012, v_q.x + 0.01, r)) * (0.4 * exp(-d * 2.4) + 0.7 * exp(-d * 12.0)); }   // a ring
    else if (v_k < 2.5) L = col * exp(-u.y * u.y * 5.0) * (1.0 - smoothstep(0.6, 1.0, abs(u.x)));                       // a beam
    else if (v_k < 3.5) { // a ball of fire
      vec2 w = u + 0.22 * vec2(fbm(u * 2.0 + vec2(t * 0.7, -t * 1.6)) - 0.5, fbm(u * 2.0 + vec2(5.2, -t * 1.9)) - 0.5); float rr = length(w), f = fbm(w * 3.0 + vec2(0.0, -t * 2.2)), dns = 1.0 - smoothstep(0.45 + 0.35 * f, 0.98, rr);
      float temp = v_q.x * (1.15 - rr * 0.95) + (f - 0.5) * 0.55; L = ramp(min(temp, 0.74 + 0.4 * smoothstep(0.9, 1.2, v_q.x))) * dns * (0.5 + 0.55 * f); }   /* (white only in a very hot ball's heart) */
    else if (v_k < 4.5) { // a flame tongue: base at uv.y = 1, tip at -1
      float h = (1.0 - u.y) * 0.5, wob = (fbm(vec2(h * 3.0 - t * 2.5, v_q.y)) - 0.5) * 0.5 * h, x = (u.x - wob) / max(0.05, (1.0 - pow(h, 1.6)) * (0.55 + 0.45 * sin(min(1.0, h * 3.0) * 1.57)));
      float f = fbm(vec2(u.x * 2.0, h * 3.0 - t * 3.4) + v_q.y), dns = (1.0 - smoothstep(0.55, 1.0, abs(x))) * smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(0.75 + 0.2 * f, 1.0, h));
      float temp = v_q.x * (1.1 - h * 0.9 - abs(x) * 0.35) + (f - 0.5) * 0.45; L = ramp(temp) * dns * (0.6 + 0.6 * f); }
    else if (v_k < 5.5) { // burning ground: patchy glow and bright cracks (seen from the camera: squashed by the quad)
      float f = fbm(u * 3.0 + v_q.y), cr = 1.0 - smoothstep(0.0, 0.06, abs(fbm(u * 4.0 + v_q.y * 2.0) - 0.5)), rad = exp(-r * r * 2.6) * edge;
      float temp = v_q.x * (0.55 * rad + 0.35 * f * rad + 0.8 * cr * smoothstep(1.0, 0.2, r)); L = ramp(temp) * (0.5 + 0.5 * f) * rad + ramp(v_q.x * 0.9) * cr * smoothstep(1.0, 0.25, r) * 0.7 * v_q.z; }
    else if (v_k < 6.5) { // a fire beam: uv.x along (-1 mouth .. 1 end), uv.y across
      float al = u.x * 0.5 + 0.5, f = fbm(vec2(al * 6.0 - t * v_q.z, u.y * 2.2 + v_q.y)), f2 = fbm(vec2(al * 13.0 - t * v_q.z * 1.6, u.y * 4.0 - 3.0)), ay = abs(u.y) / (0.62 + 0.4 * f);
      float dns = (1.0 - smoothstep(0.5, 1.0, ay)) * smoothstep(0.0, 0.05, al) * (1.0 - smoothstep(0.92, 1.0, al)), temp = v_q.x * (1.2 - ay * 1.05) + (f2 - 0.5) * 0.5; L = ramp(temp) * dns * (0.55 + 0.6 * f); }
    else if (v_k < 7.5) { vec2 a = abs(u); L = col * (exp(-a.x * 2.5) * exp(-a.y * 30.0) + exp(-a.y * 2.5) * exp(-a.x * 30.0)) * edge; }   // a sparkle
    else { float n = fbm(vec2(atan(u.y, u.x) * 3.0, r * 6.0 - t * 2.0)); L = col * (exp(-sq((r - 0.82) / 0.07)) + 0.6 * exp(-sq((r - 0.68) / 0.05))) * (0.4 + 0.8 * n) * edge; }   // heat shimmer
    L *= pk;
    L = min(L * v_c.a, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); } }`;
  function prog(vs, fs, attrs) { const sh = (ty, src) => { const q = gl.createShader(ty); gl.shaderSource(q, src); gl.compileShader(q); if (!gl.getShaderParameter(q, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(q)); return q; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    const U = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const q = gl.getActiveUniform(p, i); U[q.name] = gl.getUniformLocation(p, q.name); } return { p, U }; }
  function build() { if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 4; cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; why = 'context lost'; }); cv.addEventListener('webglcontextrestored', () => { ok = null; PR = null; }); }
    const o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }; gl = gl || cv.getContext('webgl2', o) || cv.getContext('webgl', o); if (!gl) { why = 'no WebGL'; return false; }
    try { const di = gl.getExtension('WEBGL_debug_renderer_info'); info = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { info = '?'; } soft = /swiftshader|llvmpipe|software|softpipe/i.test(info);
    PR = prog(VS, FS, ['a_p', 'a_uv', 'a_k', 'a_c', 'a_q']); bq = gl.createBuffer(); return true; }
  function usable() { let f = null; try { f = typeof window !== 'undefined' ? window.__NG_GL : null; } catch (e) {} if (f === 0 || ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Nidhogg GFX: ' + why); } catch (e2) {} } } return !!ok && (!soft || f === 1); }
  const LOWQ = () => typeof st !== 'undefined' && st && !!st.lowFx;
  /* the batch: light quads and smoke quads, 12 floats a vertex */
  const RGB = new Map(), rgbOf = h => { let v = RGB.get(h); if (!v) { const q = hexRGB(h || '#FF7A2E'); v = [q[0] / 255, q[1] / 255, q[2] / 255]; RGB.set(h, v); } return v; };
  const QV = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]];
  const Q = { lit: new Float32Array(12 * 6 * 600), nl: 0, smk: new Float32Array(12 * 6 * 200), ns: 0, a: 1, b: 0, c0: 0, d: 1, e: 0, f: 0, k: 1, t: 0, W: 0, Hh: 0, pet: [0, 0, 0], gpu: true,
    X(x, y) { return this.a * x + this.c0 * y + this.e; }, Y(x, y) { return this.b * x + this.d * y + this.f; },
    /* one quad: centre (screen px), half-axes (ux, uy), (vx, vy) in screen px */
    quad(kind, x, y, ux, uy, vx, vy, col, al, q0, q1, q2) { if (!(al > 0.004)) return; const solid = kind >= 9 && kind <= 12; let A = solid ? this.smk : this.lit; const n = solid ? this.ns : this.nl;
      if ((n + 6) * 12 > A.length) { const q = new Float32Array(A.length * 2); q.set(A); A = q; if (solid) this.smk = q; else this.lit = q; }
      const cx = this.X(x, y), cy = this.Y(x, y), a = this.a, b = this.b, c = this.c0, d = this.d, Ux = a * ux + c * uy, Uy = b * ux + d * uy, Vx = a * vx + c * vy, Vy = b * vx + d * vy, C = rgbOf(col); let o = n * 12;
      for (let j = 0; j < 6; j++) { const su = QV[j][0], sv = QV[j][1]; A[o++] = cx + Ux * su + Vx * sv; A[o++] = cy + Uy * su + Vy * sv; A[o++] = su; A[o++] = sv; A[o++] = kind; A[o++] = C[0]; A[o++] = C[1]; A[o++] = C[2]; A[o++] = al > 1 ? 1 : al; A[o++] = q0 || 0; A[o++] = q1 || 0; A[o++] = q2 || 0; }
      if (solid) this.ns += 6; else this.nl += 6; },
    rq(kind, x, y, w, h, rot, col, al, q0, q1, q2) { const c = Math.cos(rot || 0), s = Math.sin(rot || 0); this.quad(kind, x, y, c * w, s * w, -s * h, c * h, col, al, q0, q1, q2); },
    glow(x, y, r, col, a, sy) { if (r > 0.5) this.quad(0, x, y, r, 0, 0, r * (sy || 1), col, a); },
    ring(x, y, r, col, a, w, sy) { if (r > 0.5) this.quad(1, x, y, r * 1.04, 0, 0, r * 1.04 * (sy || 1), col, a, 0.96, 0, Math.max(0.02, (w || r * 0.1) / r * 0.6)); },
    beam(x0, y0, x1, y1, w, col, a) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; this.quad(2, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, col, a); },
    fire(x, y, r, heat, a, seed, sy) { if (r > 0.5) { this.quad(10, x, y, r, 0, 0, r * (sy || 1), '#FFFFFF', a * 0.6, heat, seed || 0); this.quad(3, x, y, r, 0, 0, r * (sy || 1), '#FFFFFF', a * 0.8, heat, seed || 0); } },   /* (its body laid over, its light added) */
    billow(x, y, r, heat, a, seed, sy) { if (r > 0.5) { this.quad(10, x, y, r, 0, 0, r * (sy || 1), '#FFFFFF', a, heat, seed || 0); this.quad(3, x, y, r * 0.9, 0, 0, r * 0.9 * (sy || 1), '#FFFFFF', a * 0.3, heat * 0.9, seed || 0); } },   /* (a rolling volume of flame: mostly body, a little light; stacked by the dozen it stays orange) */
    tongue(x, y, w, h, rot, heat, a, seed) { if (h > 0.5) { const c = Math.cos(rot || 0), s = Math.sin(rot || 0); this.quad(4, x + s * h, y - c * h, c * w, s * w, -s * h, c * h, '#FFFFFF', a, heat, seed || 0); } },   /* (base at (x, y), rot 0 up) */
    ground(x, y, r, heat, a, seed, sy, cracks) { if (r > 0.5) this.quad(5, x, y, r, 0, 0, r * (sy || 0.55), '#FFFFFF', a, heat, seed || 0, cracks == null ? 1 : cracks); },
    firebeam(x0, y0, x1, y1, w, heat, a, seed, scroll) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; this.quad(6, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, '#FFFFFF', a, heat, seed || 0, scroll || 3); },
    firebody(x0, y0, x1, y1, w, heat, a, seed, scroll) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5) return; this.quad(11, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, '#FFFFFF', a, heat, seed || 0, scroll || 3); },   /* (a fire beam's body: laid over, so it reads on any floor) */
    star(x, y, s, a, col) { this.quad(7, x, y, s, 0, 0, s, col || '#FFF6D8', a); },
    shimmer(x, y, r, a, sy, col) { if (r > 0.5) this.quad(8, x, y, r, 0, 0, r * (sy || 1), col || '#FFA640', a); },
    smoke(x, y, r, a, seed, col, lit) { if (r > 0.5) this.quad(9, x, y, r, 0, 0, r, col || '#3A2E2A', a, lit || 0, seed || 0); },
    /* a comet trail of fire through screen points (head first), each stretch a fire-beam quad, tapering */
    trail(P, n, w, heat, a, seed) { for (let i = 0; i < n - 1; i++) { const k = i / (n - 1), x0 = P[i][0], y0 = P[i][1], x1 = P[i + 1][0], y1 = P[i + 1][1], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ex = dx / L * w * 0.4, ey = dy / L * w * 0.4;
      this.firebeam(x0 - ex, y0 - ey, x1 + ex, y1 + ey, w * (1 - 0.75 * k), heat * (1 - 0.6 * k), a * (1 - k * k), (seed || 0) + i * 0.37, 4); } } };
  /* begin a pass on the game canvas c (its transform is the camera); pet: [screen x, y, radius] to keep clear, or null */
  function begin(c, pet) { const B = c.getTransform(), cv0 = c.canvas, L = LOWQ(), k0 = Math.min(L ? 0.42 : 0.6, 1200 / Math.max(cv0.width, cv0.height)); Q.W = Math.max(8, Math.round(cv0.width * k0)); Q.Hh = Math.max(8, Math.round(cv0.height * k0)); const kx = Q.W / cv0.width;
    Q.a = B.a * kx; Q.b = B.b * kx; Q.c0 = B.c * kx; Q.d = B.d * kx; Q.e = B.e * kx; Q.f = B.f * kx; Q.k = (Math.sqrt(Math.abs(B.a * B.d - B.b * B.c)) || 1) * kx; Q.nl = Q.ns = 0; Q.t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000 % 1000;
    if (pet) { Q.pet[0] = Q.X(pet[0], pet[1]); Q.pet[1] = Q.Y(pet[0], pet[1]); Q.pet[2] = pet[2] * Q.k; } else Q.pet[2] = 0; return Q; }
  function flush(c) { if (!Q.nl && !Q.ns) return; if (!usable()) return; try { const W = Q.W, Hh = Q.Hh; if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }   /* (v326: one layer at a time, the whole canvas copied each time: no source rectangles at all, so no browser can crop or misplace a half) */
      gl.viewport(0, 0, W, Hh); gl.clearColor(0, 0, 0, 0); gl.enable(gl.BLEND); gl.useProgram(PR.p); gl.uniform2f(PR.U.u_res, W, Hh); gl.uniform1f(PR.U.u_t, Q.t); gl.uniform3f(PR.U.u_pet, Q.pet[0], Q.pet[1], Q.pet[2]); gl.bindBuffer(gl.ARRAY_BUFFER, bq);
      const attr = (i, n, off) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, 48, off * 4); }; let draws = 0;
      const pass = (A, n) => { gl.bufferData(gl.ARRAY_BUFFER, A.subarray(0, n * 12), gl.DYNAMIC_DRAW); attr(0, 2, 0); attr(1, 2, 2); attr(2, 1, 4); attr(3, 4, 5); attr(4, 3, 9); gl.drawArrays(gl.TRIANGLES, 0, n); draws++; };
      const cv0 = c.canvas; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      if (Q.ns) { gl.clear(gl.COLOR_BUFFER_BIT); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); pass(Q.smk, Q.ns); c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, 0, cv0.width, cv0.height); }   // the left half: smoke, solid
      if (Q.nl) { gl.clear(gl.COLOR_BUFFER_BIT); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR); pass(Q.lit, Q.nl); c.globalCompositeOperation = 'lighter'; c.drawImage(cv, 0, 0, cv0.width, cv0.height); }    // the right half: light, screened (stacked fire saturates softly, never clips to a white slab)
      stats.draws = draws; stats.quads = Q.nl / 6; stats.smoke = Q.ns / 6; stats.W = W; stats.H = Hh; stats.frames++; stats.maxDraws = Math.max(stats.maxDraws, draws); stats.maxQuads = Math.max(stats.maxQuads, Q.nl / 6); stats.maxSmoke = Math.max(stats.maxSmoke, Q.ns / 6);
      c.restore();
    } catch (e) { ok = false; why = String(e && e.message || e); } }
  /* (tests) pixels that break rgb <= a, right after a flush */
  function check() { if (!gl) return null; const W = cv.width, Hh = cv.height, px = new Uint8Array(W * Hh * 4); gl.readPixels(0, 0, W, Hh, gl.RGBA, gl.UNSIGNED_BYTE, px); let bad = 0, lit = 0; for (let i = 0; i < px.length; i += 4) { const a = px[i + 3]; if (a) lit++; if (px[i] > a + 1 || px[i + 1] > a + 1 || px[i + 2] > a + 1) bad++; } return { bad, lit }; }
  NM.FGFX = { usable, begin, flush, check, stats, info: () => ({ ok, soft, renderer: info, why }) };
})();
