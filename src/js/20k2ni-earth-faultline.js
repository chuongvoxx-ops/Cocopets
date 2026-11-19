/* ---------- (v417 GH) Fault Line: an Earth Strong (key 'faultline'; the user's new move in the row of the old Faultline Fang) ----------
   The user's spec (2026-11-19): the pet stamps the ground; a jagged amber crack races forward, followed by a succession of rising stone wedges, each
   lifting briefly as the pressure wave passes and settling back down, like the ground buckling along a fault. Base: one forward fissure; Adept (level
   4): two in a shallow V; Celestial (level 7): three in a fan. Each fissure runs through every monster in its way; crossing fissures of one cast never
   hit a monster twice: one primary hit per monster per cast, with the game's level scaling. A brief stagger or a small upward jolt for susceptible
   monsters, never thrown out of the arena. The pet is free to move after the stamp. Built from reusable 3D stone segments, temporary crack decals,
   restrained dust jets and warm mineral glints; the ground stays walkable and looks as it was once the segments settle.
   Gameplay (frame-rate independent: each fissure's front is read from the cast's clock, and a frame sweeps the stretch it passed since the last, so
   a long frame hits exactly what a run of short ones would):
   - the cooldown starts at the cast's commit (20b useStrong); the pet is held only for the stamp (TUNE.stamp),
   - each fissure's path is laid at the cast: it wanders a little and stops at a wall; its front races at TUNE.speed; a monster within TUNE.width
     (+ its own radius) of the stretch the front passes is hit once for the whole cast (one hit set, f.hits, shared by the fissures) and jolted up
     (GH_KIT / H.lift: the game's rules: a boss or a fixed monster only a quarter of the stun, never lifted or moved); nothing is pushed,
   - wedges, dust, chips and glints are only pictures; the wedges never block anything,
   - the cast is dropped at once (no more hits, the picture fades) if the pet goes down or the encounter ends; all of it lives in its fx entry.
   The picture on the GPU: the crack as a chain of decals on the painter (kind 97: a dark jagged core, side cracks, broken lips; kind 98: its amber
   light, white-gold behind the racing head, cooling), the wedges real 3D meshes on GLM (three faceted variants built once at load, layered strata
   of champagne sandstone, terracotta, dark orange and a charcoal basalt root, an amber mineral set in each, material 165/166; one render for the
   cast) rising through the floor and sinking back; dust jets (84), chips (85) and glints over them. Without WebGL: a lit seam and stone spikes. */
(() => {
  const K = GH_KIT, { TAU, SE, CE, cl, lerp, sm, M3 } = K;
  const TUNE = K.TUNE.faultline = Object.assign({
    stamp: 0.16,               // the stamp: the crack starts then; the pet held in place until it (s)
    speed: 13,                 // the front's speed (tiles/s)
    len: [7, 7, 7.5],          // each fissure's reach (tiles): Base, Adept, Celestial (it stops at a wall)
    count: [1, 2, 3],          // fissures: one; two in a shallow V; three in a fan
    spread: [0, 0.21, 0.4],    // their angle off the aim (rad): the V's arms at +-0.21; the fan's at -0.4, 0, +0.4
    start: 0.55,               // where the crack starts ahead of the pet (tiles)
    width: 0.72,               // the reach of a fissure's blow either side of its line (tiles, + the monster's radius)
    dmg: 3.4,                  // x the cast's base damage (C.base: the pet's attack, stars and stage) x C.K (the game's Earth level scale)
    tierDmg: [1, 1, 1],        // (an extra factor a tier, for tuning; the progression is the game's own)
    jolt: 0.32, joltH: 0.42,   // the jolt: its hold (s) and height (tiles) on a susceptible monster (H.lift)
    gap: 0.56,                 // wedges along a fissure (tiles apart)
    wedge: [1.0, 1.05, 1.15],  // their size a tier
    lift: 0.12, hold: 0.16, settle: 0.5,   // a wedge's rise, hold and settle as the wave passes (s)
    close: 0.9,                // the crack closing and fading after its wedges settle (s)
  }, K.TUNE.faultline || {});
  const AMBER = '#FFA63A', GOLD = '#FFD27A', PALE = '#FFF1D2', DUST = '#9C8466', DUSTL = '#B8A07E';

  /* ================= the wedges: three faceted variants (tiles: ~0.64 along x, ~0.4 across, its root to -0.45 under the floor, its ridge ~0.85 up) ================= */
  let WEDGE = null;
  function facet(B, pts, inside, m) { let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0; const n = pts.length;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); cx += a[0] / n; cy += a[1] / n; cz += a[2] / n; }
    B.facet(nx * (cx - inside[0]) + ny * (cy - inside[1]) + nz * (cz - inside[2]) < 0 ? pts.slice().reverse() : pts, m); }
  function buildWedges() {
    if (WEDGE) return WEDGE; if (typeof GLM === 'undefined') return null;
    const list = [];
    for (let v = 0; v < 3; v++) { const R = K.rng(911 + v * 37), B = GLM.builder(1), m = 165 + v * 0.1, J = () => (R() - 0.5);
      // a wedge of floor heaved up: a faceted block, its root under the floor, its flanks sloping up to a jagged lip along -y (toward the crack)
      const ring = (z0, rx, ry, slope, jx) => { const o = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.2 * J(), k = 1 + jx * J(); o.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k, z0 - slope * Math.sin(a) + 0.04 * J()]); } return o; };
      const bot = ring(-0.45, 0.28, 0.27, 0, 0.2), mid = ring(0.16, 0.26, 0.25, 0.12, 0.22);
      const top = [[-0.2 + 0.04 * J(), -0.11 + 0.03 * J(), 0.4 + 0.08 * R()], [0.02 * J(), -0.13 + 0.03 * J(), 0.5 + 0.06 * R()], [0.19 + 0.04 * J(), -0.1 + 0.03 * J(), 0.38 + 0.08 * R()]], IN = [0, 0, 0.05], L = 0.3;
      for (let i = 0; i < 9; i++) { const k = (i + 1) % 9; facet(B, [bot[i], bot[k], mid[k]], IN, m); facet(B, [bot[i], mid[k], mid[i]], IN, m); }   // (its flanks, cut in flat facets)
      // (each shoulder facet joins two neighbours of the mid ring to the nearest point of the lip)
      const near = p => { let b = 0, d = 1e9; for (let q = 0; q < 3; q++) { const dd = Math.abs(p[0] - top[q][0]); if (dd < d) { d = dd; b = q; } } return b; };
      for (let i = 0; i < 9; i++) { const k = (i + 1) % 9, a = near(mid[i]), b = near(mid[k]); facet(B, [mid[i], mid[k], top[b]], IN, m); for (let q = b; q !== a; q += a > b ? 1 : -1) facet(B, [mid[i], top[q], top[q + (a > b ? 1 : -1)]], IN, m); }
      // a broken corner chunk on its lip, an amber mineral set in its top face, a sliver of champagne crystal in its side
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [L * (v === 1 ? -0.55 : 0.55), -0.12, 0.43]); B.box([0, 0, 0], [0.09, 0.07, 0.06], 0.03, m); B.pop();
      const a0 = [0.08 * J(), 0.04, 0.3 + 0.04 * R()]; B.crystal(a0, [a0[0] + 0.03, a0[1] + 0.06, a0[2] + 0.09], 0.035, 166, { n: 5, seed: v + 1 });
      const a1 = [0.12 * J(), 0.2, 0.0]; B.crystal(a1, [a1[0] - 0.02, a1[1] + 0.09, a1[2] + 0.05], 0.026, 164, { n: 5, seed: v + 4 });
      list.push(B.done()); }
    const G = K.merge(list); WEDGE = { mesh: G.mesh, parts: G.ranges }; return WEDGE;
  }
  K.idle(buildWedges);

  /* ================= the move ================= */
  const S = ELEM_IMPL.earth.strong;
  S.faultline = (C, H) => {
    const me = H.me, X = H.X, tier = K.tierOf(C), seed = (S.faultline.dbg && S.faultline.dbg.seed) || Math.floor(Math.random() * 9e4) + 3, RN = K.rng(seed), x0 = me.x, y0 = me.y, W0 = buildWedges();
    const n = TUNE.count[tier], spr = TUNE.spread[tier], SPD = TUNE.speed, WS = TUNE.wedge[tier];
    // the stamp: a squash, held in place until the strike (a dodge still cancels it)
    me.castT = me.castM = 0.42; me.castUlt = false; me.sq = 0.55; if (Math.abs(Math.cos(C.a)) > 0.2) me.face = Math.cos(C.a) > 0 ? 1 : -1;
    if (!me.push && !me.dash && !me.leap && !me.dodge) me.push = { vx: 0, vy: 0, t: TUNE.stamp };
    // the fissures' paths, laid now: a gentle wander about each one's heading, stopping at a wall
    const fis = []; for (let i = 0; i < n; i++) { const a0 = C.a + (n === 1 ? 0 : (i / (n - 1) * 2 - 1) * spr), STEP = 0.45, L = TUNE.len[tier];
      let h = a0, x = x0 + Math.cos(a0) * TUNE.start, y = y0 + Math.sin(a0) * TUNE.start; const P = [[x, y]], A = [a0];
      if (X.blocked(x, y, 0.15, 0)) { fis.push({ P, A, s: [0], L: 0, sd: i + 1, wedges: [], fr: 0 }); continue; }
      while ((P.length - 1) * STEP < L) { h = a0 + Math.max(-0.12, Math.min(0.12, h - a0 + (RN() - 0.5) * 0.12)); const nx = x + Math.cos(h) * STEP, ny = y + Math.sin(h) * STEP; if (X.blocked(nx, ny, 0.15, 0)) break; x = nx; y = ny; P.push([x, y]); A.push(h); }
      const s = P.map((p, k) => k * STEP), Lf = s[s.length - 1];
      const wedges = []; for (let d = 0.38, j = 0; d < Lf - 0.12; d += TUNE.gap * (0.92 + 0.16 * RN()), j++) { const k = Math.min(P.length - 2, Math.floor(d / STEP)), u = (d - k * STEP) / STEP, hx = lerp(P[k][0], P[k + 1][0], u), hy = lerp(P[k][1], P[k + 1][1], u), hd = A[k + 1], side = j % 2 ? 1 : -1, off = 0.1 + 0.1 * RN();
        wedges.push({ d, x: hx - Math.sin(hd) * off * side, y: hy + Math.cos(hd) * off * side, hd: hd + (RN() - 0.5) * 0.35 + (side > 0 ? 0 : Math.PI), roll: 0.1 + 0.18 * RN(), pitch: (RN() - 0.5) * 0.25, sc: WS * (0.85 + 0.3 * RN()), v: Math.floor(RN() * 3), t0: TUNE.stamp + d / SPD, risen: false }); }
      fis.push({ P, A, s, L: Lf, sd: (seed % 37) + i * 11 + 1, wedges, fr: 0 }); }
    const wEnd = TUNE.lift + TUNE.hold + TUNE.settle, maxL = fis.reduce((m, q) => Math.max(m, q.L), 0), LIFE = TUNE.stamp + maxL / SPD + wEnd + TUNE.close + 0.15;
    // a wedge's height at t: 0 sunk, 1 risen (a little overshoot as it heaves), back to 0 as it settles
    const heave = (w, t) => { const e = t - w.t0; if (e <= 0) return 0; if (e < TUNE.lift) { const u = e / TUNE.lift, s = 1.6, v = u - 1; return v * v * ((s + 1) * v + s) + 1; } if (e < TUNE.lift + TUNE.hold) return 1; return 1 - sm((e - TUNE.lift - TUNE.hold) / TUNE.settle); };
    // how open the crack is at arc s at time t (it opens as the front passes, closes after the wedges there settle), and its heat
    const openAt = (s, t) => { const ts = TUNE.stamp + s / SPD, e = t - ts; return e <= 0 ? 0 : sm(e / 0.1) * (1 - sm((e - wEnd * 0.8) / TUNE.close)); };
    const heatAt = (s, t) => { const e = t - TUNE.stamp - s / SPD; return e <= 0 ? 0 : 0.22 + 1.15 * Math.exp(-e * 3.2); };

    const f = H.add({ key: 'faultline', life: LIFE, x: x0, y: y0, fis, tier, hits: new Set(), dead: false, deadT: 0, struck: false, dust: [], chips: [], specks: [], seed,
      update(dt, f) { const t = f.t;
        if (!f.dead && (me.dead || (H.g && (H.g.over || H.g.exitIn)))) { f.dead = true; f.deadT = t; f.life = Math.min(f.life, 0.3); }
        if (!f.struck && t >= TUNE.stamp) { f.struck = true; if (!f.dead) { X.shake(4 + tier, 0.16); X.sfx.thud && X.sfx.thud(); for (let k = 0; k < H.n(5); k++) { const a = k / 5 * TAU + RN(); puff(f, me.x + Math.cos(a) * 0.4, me.y + Math.sin(a) * 0.3, 0.05, 0.32, 0.6, Math.cos(a) * 1.2, Math.sin(a) * 0.8); } } }
        // THE damage: each fissure's front sweeps the stretch it passed since the last frame
        for (const q of fis) { const fr = Math.min(q.L, Math.max(0, (t - TUNE.stamp) * SPD)); if (fr > q.fr) { if (!f.dead) sweep(f, q, q.fr, fr); q.fr = fr; }
          for (const w of q.wedges) if (!w.risen && t >= w.t0) { w.risen = true; if (!f.dead) { const hd = w.hd, nx = -Math.sin(hd), ny = Math.cos(hd); for (const sd of [-1, 1]) puff(f, w.x + nx * sd * 0.28 * w.sc, w.y + ny * sd * 0.2 * w.sc, 0.05, 0.24 + 0.08 * RN(), 0.55, nx * sd * 0.9, ny * sd * 0.6, 0.9 + RN() * 0.5);
            if (RN() < 0.7) chip(f, w.x, w.y, 0.3, (RN() - 0.5) * 2.4, (RN() - 0.5) * 2, 2 + RN() * 2.5, 0.06 + 0.03 * RN()); if (RN() < 0.55 * H.Q() + 0.1) f.specks.push({ x: w.x + (RN() - 0.5) * 0.3, y: w.y, z: 0.35 + 0.35 * RN(), t: -0.05 - 0.1 * RN(), life: 0.35 + 0.2 * RN(), s: 0.14 + 0.08 * RN() }); if (RN() < 0.2 && X.sfx.thud) X.sfx.thud(); } } }
        // the crack's own light on the floor at each racing head (the room's darkness is drawn over the move)
        if (!f.dead && t > TUNE.stamp && (f.lt = (f.lt || 0) - dt) <= 0) { f.lt = 0.08; for (const q of fis) { const fr = Math.min(q.L, (t - TUNE.stamp) * SPD); if (fr < q.L || t < TUNE.stamp + q.L / SPD + 0.4) { const h = at(q, Math.min(fr, q.L)); X.light(h[0], h[1], 2.4, 0.22); } } }
        for (let i = f.dust.length - 1; i >= 0; i--) { const p = f.dust[i]; p.t += dt; const k2 = Math.exp(-2.2 * dt); p.vx *= k2; p.vy *= k2; p.vz *= k2; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); if (p.t >= p.life) f.dust.splice(i, 1); }
        for (let i = f.chips.length - 1; i >= 0; i--) { const p = f.chips[i]; p.t += dt; p.vz -= 11 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z < 0) { p.z = 0; p.vz = Math.abs(p.vz) > 2 ? -p.vz * 0.3 : 0; p.vx *= 0.6; p.vy *= 0.6; } if (p.t >= p.life) f.chips.splice(i, 1); }
        for (let i = f.specks.length - 1; i >= 0; i--) { const p = f.specks[i]; p.t += dt; if (p.t >= p.life) f.specks.splice(i, 1); } },
      onEnd(f) { f.dust.length = 0; f.chips.length = 0; f.specks.length = 0; f.hits.clear(); },
      drawUnder(c, f, X0, Y0, T) { const FG = K.gfx(); if (FG && gpu(c, f, FG, T)) return; draw2D(c, f, T); } });

    /* every living monster near the stretch [s0, s1] of a fissure's line: hit once for the whole cast (the shared set), jolted up by the game's rules */
    function sweep(f, q, s0, s1) { if (!(s1 > s0)) return; const dmg = C.base * TUNE.dmg * (TUNE.tierDmg[tier] || 1) * C.K, P = q.P, S2 = q.s;
      for (const m of H.living()) { if (f.hits.has(m)) continue; let best = 1e9;
        for (let k = 0; k < P.length - 1; k++) { const a = S2[k], b = S2[k + 1]; if (b < s0 - 1e-6 || a > s1 + 1e-6) continue; const ua = Math.max(0, (s0 - a) / (b - a)), ub = Math.min(1, (s1 - a) / (b - a)),
            ax = lerp(P[k][0], P[k + 1][0], ua), ay = lerp(P[k][1], P[k + 1][1], ua), bx = lerp(P[k][0], P[k + 1][0], ub), by = lerp(P[k][1], P[k + 1][1], ub), dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy, u = L2 > 1e-9 ? Math.max(0, Math.min(1, ((m.x - ax) * dx + (m.y - ay) * dy) / L2)) : 0;
          best = Math.min(best, Math.hypot(m.x - (ax + dx * u), m.y - (ay + dy * u))); }
        if (best < TUNE.width + m.r) { f.hits.add(m); X.hitMon(m, dmg, C.dmgO({})); if (!m.dead) H.lift(m, TUNE.jolt, TUNE.joltH); } } }
    function puff(f, x, y, z, s, life, vx, vy, vz) { if (f.dust.length > 80) return; f.dust.push({ x, y, z, vx: vx || 0, vy: vy || 0, vz: vz == null ? 0.5 : vz, t: 0, life, s, sd: RN() * 9 + 1 }); }
    function chip(f, x, y, z, vx, vy, vz, s) { if (f.chips.length > 60) return; f.chips.push({ x, y, z, vx, vy, vz, rot: RN() * TAU, vr: (RN() - 0.5) * 14, t: 0, life: 0.8 + RN() * 0.5, s, md: RN() < 0.5 ? 5 : 0, sd: Math.floor(RN() * 40) + 1 }); }
    const fadeOf = f => (f.dead ? cl(1 - (f.t - f.deadT) / 0.25) : 1);
    // the point at arc s on a fissure, and its heading
    const at = (q, s) => { const k = Math.max(0, Math.min(q.P.length - 2, Math.floor(s / 0.45))), u = cl((s - q.s[k]) / 0.45); return q.P.length < 2 ? [q.P[0][0], q.P[0][1]] : [lerp(q.P[k][0], q.P[k + 1][0], u), lerp(q.P[k][1], q.P[k + 1][1], u)]; };

    /* ---- the GPU picture ---- */
    function gpu(c, f, FG, T) {
      const t = f.t, A = fadeOf(f), Xo = X.sx(x0), Yo = X.sy(y0), W1 = buildWedges(), Q = FG.begin(c, null);
      // the crack: a chain of decals behind the front, then their light
      for (let pass = 0; pass < 2; pass++) for (const q of fis) { const fr = Math.min(q.L, Math.max(0, (t - TUNE.stamp) * SPD)); if (fr <= 0.01) continue;
        for (let k = 0; k < q.P.length - 1 && q.s[k] < fr; k++) { const s0 = q.s[k], s1 = Math.min(q.s[k + 1], fr), head = s1 < q.s[k + 1] - 1e-4 || (s1 >= q.L - 1e-4 && fr < q.L), op = openAt((s0 + s1) / 2, t); if (op < 0.01 || s1 - s0 < 0.01) continue;
          const p0 = [X.sx(q.P[k][0]), X.sy(q.P[k][1])], e = [lerp(q.P[k][0], q.P[k + 1][0], (s1 - s0) / 0.45), lerp(q.P[k][1], q.P[k + 1][1], (s1 - s0) / 0.45)], p1 = [X.sx(e[0]), X.sy(e[1])];
          const ux = (p1[0] - p0[0]) / 2, uy = (p1[1] - p0[1]) / 2, ul = Math.hypot(ux, uy) || 1, hw = 0.3 * T, vx = -uy / ul * hw, vy = ux / ul * hw * SE, cx = p0[0] + ux, cy = p0[1] + uy, qx = s0 + 100 * q.sd, qy = (s1 - s0) * (head ? -1 : 1);
          if (pass === 0) Q.quad(97, cx, cy, ux, uy, vx, vy, DUST, A, qx, qy, op);
          else Q.quad(98, cx, cy, ux, uy, vx, vy, AMBER, A * op, qx, qy, heatAt((s0 + s1) / 2, t) * (1 + 0.15 * tier)); }
        if (pass === 1 && fr < q.L && t < TUNE.stamp + q.L / SPD) { const h = at(q, fr), hx = X.sx(h[0]), hy = X.sy(h[1]); Q.glow(hx, hy, T * 0.85, AMBER, 0.55 * A, SE * 1.3); Q.glow(hx, hy, T * 0.35, GOLD, 0.6 * A, SE * 1.3); Q.star(hx, hy - T * 0.05, T * 0.5, 0.75 * A, PALE); } }
      // the stamp's small ring of dust and cracks at the pet's feet
      const ps = t - TUNE.stamp; if (ps > 0 && ps < 0.9) { const q2 = cl(ps / 0.7), r = T * (0.35 + 1.0 * H.ease.out(q2)); Q.quad(90, Xo, Yo, r * 1.3, 0, 0, r * 1.3 * SE, DUST, (1 - q2) * 0.8 * A, 0.3, f.seed % 9 + 1, q2); Q.quad(89, Xo, Yo, T * 0.95, 0, 0, T * 0.95 * SE, '#000000', 0.7 * A * (1 - sm((ps - 0.4) / 0.5)), cl(ps / 0.2), f.seed % 13 + 2, 0.05); }
      FG.flush(c);
      // the wedges: one render for the cast, rising through the floor and sinking back (nothing below the floor is drawn)
      if (W1) { const items = []; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
        for (const q of fis) for (const w of q.wedges) { const hv = heave(w, t); if (hv < 0.02) continue; const Xw = X.sx(w.x), Yw = X.sy(w.y), wp = K.toW(Xw, Yw, Xo, Yo, T, 0), ch = Math.cos(w.hd), sh = Math.sin(w.hd) / SE, st = Math.hypot(ch, sh), yw = Math.atan2(sh, ch);
          const sz = w.sc, Rm = M3.sc(M3.mul(M3.rz(yw), M3.mul(M3.rx(w.roll * (0.6 + 0.4 * hv)), M3.ry(w.pitch))), sz * Math.min(1.7, st), sz, sz * (0.75 + 0.25 * Math.min(1, hv)));
          const dz = (1 - Math.min(1.08, hv)) * 0.62 * sz; items.push({ mesh: W1.mesh, R: Rm, T: [wp[0], wp[1], -dz], alpha: A, glow: 0.35 + 0.9 * heatAt(w.d, t) * (hv > 0.3 ? 1 : 0.5), glow2: 0, spill: 0.4 * (1 - hv), kind: tier, wear: 0, first: W1.parts[w.v].first, cnt: W1.parts[w.v].cnt });
          const r = 0.9 * sz * T * Math.min(1.7, st); bx0 = Math.min(bx0, Xw - r); bx1 = Math.max(bx1, Xw + r); by0 = Math.min(by0, Yw - T * sz * 0.7 - 4); by1 = Math.max(by1, Yw + r * SE + 4); }
        if (items.length && !f.up) { f.up = true; K.upload(W1.mesh); }
        if (items.length && !K.render(c, items, { X0: Xo, Y0: Yo, k: T, bb: [bx0, by0, bx1, by1], alpha: 1 })) return false; }
      // over them: restrained dust jets, chips, warm mineral glints
      const Q2 = FG.begin(c, [X.sx(me.x), X.sy(me.y) - T * 0.45, T * 0.55]);
      for (const p of f.dust) { const u = p.t / p.life, r = T * p.s * (0.6 + 0.9 * u), a = Math.sin(Math.min(1, u * 2.5) * Math.PI / 2) * (1 - u) * 0.6 * A, x = X.sx(p.x), y = X.sy(p.y) - CE * T * p.z; if (a > 0.01) Q2.quad(84, x, y, r, 0, 0, r * 0.85, DUST, a, u, p.sd, 0.9 * 0.25 * Math.max(0, 1 - u * 2)); }
      for (const p of f.chips) { const a = (1 - sm((p.t - p.life * 0.7) / (p.life * 0.3))) * A, sz = p.s * T * 1.6; if (a < 0.02 || sz < 0.6) continue; Q2.rq(85, X.sx(p.x), X.sy(p.y) - CE * T * p.z, sz, sz * 0.8, p.rot, '#FFFFFF', a, p.rot, p.sd, p.md + 0.9 * 0.2); }
      for (const p of f.specks) { if (p.t < 0) continue; const u = p.t / p.life, x = X.sx(p.x), y = X.sy(p.y) - CE * T * p.z, s = T * p.s, k = Math.sin(u * Math.PI); Q2.glow(x, y, s * 1.6, GOLD, 0.55 * k * A); Q2.star(x, y, s * 1.4, 0.95 * k * A, PALE); }
      FG.flush(c); return true; }

    /* ---- the 2D picture (no WebGL): a lit seam along each fissure, stone spikes rising and sinking, dust ---- */
    function draw2D(c, f, T) { const t = f.t, A = fadeOf(f);
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      for (const q of fis) { const fr = Math.min(q.L, Math.max(0, (t - TUNE.stamp) * SPD)); if (fr <= 0.01 || q.P.length < 2) continue;
        for (let k = 0; k < q.P.length - 1 && q.s[k] < fr; k++) { const s1 = Math.min(q.s[k + 1], fr), op = openAt((q.s[k] + s1) / 2, t) * A; if (op < 0.02) continue; const e = at(q, s1), x0 = X.sx(q.P[k][0]), y0 = X.sy(q.P[k][1]), x1 = X.sx(e[0]), y1 = X.sy(e[1]);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.85 * op; c.strokeStyle = '#2A1E16'; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = op * Math.min(1, heatAt((q.s[k] + s1) / 2, t)); c.strokeStyle = AMBER; c.lineWidth = Math.max(1, T * 0.035); c.stroke(); } }
      c.restore();
      const L2 = []; for (const q of fis) for (const w of q.wedges) { const hv = heave(w, t); if (hv > 0.02) L2.push([w, hv]); } L2.sort((a, b) => a[0].y - b[0].y);
      for (const [w, hv] of L2) { const Xw = X.sx(w.x), Yw = X.sy(w.y), hh = T * 0.85 * w.sc * Math.min(1.08, hv); c.save(); c.globalAlpha = A; H.shadow(c, Xw, Yw, T * 0.3 * w.sc, 0.2 * hv); H.spike(c, Xw, Yw, T * 0.5 * w.sc, hh, w.roll * T * 0.4, w.v === 1 ? '#B0623A' : w.v === 2 ? '#8C7A62' : '#C9A97C'); c.restore(); } }
    return f;
  };
  S.faultline.dbg = { get wedges() { return buildWedges(); }, TUNE, seed: 0 };   // (seed: the tests fix the paths' wander; 0 a new one each cast)
})();
