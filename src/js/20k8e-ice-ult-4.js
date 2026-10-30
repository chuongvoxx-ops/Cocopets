/* ---------- Ice, reworked: Ultimates 6. Frozen Singularity, 7. Frozen Vortex ----------
   Frozen Singularity: a brilliant blue core hangs over the aim between great rotating rings of ice (real 3D rings: their
   far halves pass behind the core, their near halves in front, crystals studding them). Loose shards spiral in and build a
   faceted crystalline sphere (a geodesic solid shaded per facet, translucent, the core's light showing through); the
   rings tighten, the sphere fractures from within, and it detonates into a broad floor wave crested with crystals.
   Level 1: 2 rings, a small core. Level 4: 3 tilted rings, a larger core in translucent layers. Level 7: 5 intersecting
   rings round a huge faceted sphere; they align into one plane at full brightness, then expand and dissolve into diamond
   dust as the sphere bursts and a sweeping double shockwave runs out.
   Frozen Vortex (replaces Snowman, deleted here): a tall funnel of curved, faceted ice blades (cached crescent sprites)
   spiralling up round its axis in 3D, far blades behind and dimmer, frost-wind streaks, snow and glitter wheeling round
   it, a mist skirt, a frost ring and floor light at its foot. It forms at the aim and meanders slowly within ~1.2 tiles of
   where it formed, leaning toward the nearest monster and pulling the monsters in, slicing all inside it (ticks, brief freeze; bosses a chill), leaving a glittering frosted track. At the end it
   spins up, flings its blades outward in a ring and dissolves into snow. Level 1: one vortex, ~4 s. 2 at stage 4, 3 at
   5-6. Level 7: four, clustered round the aim ~1.5 tiles apart, bigger, more blades, ~7 s, all flinging together. */
(() => {
  const U = ELEM_IMPL.ice.ult;
  const TAU = Math.PI * 2, P = IK.P;
  let H, K;
  const cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u;
  const rnd = k => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const ppx = c => { const m = c.getTransform(); return Math.max(0.5, Math.hypot(m.a, m.b)); };
  const SY = 0.55, CZ = 0.835;   // the view: world depth squashes by SY on screen, height by CZ
  /* how much a tall thing at screen (X0, Y0) may show: it thins to a ghost where it would stand in front of the pet */
  function petGuard(X0, Y0, T, rad) { const mx = H.sx(H.me.x), my = H.sy(H.me.y) - T * 0.45, d = Math.hypot(X0 - mx, (Y0 - my) * 1.15) - (rad || 0); return Math.max(0.25, cl((d - T * 0.5) / (T * 0.8))); }
  const petH = T => { const me = H.me, g = H.g, SZ = Math.max(0.6, ((me.r || 0.3) - 0.2) / 0.1); return T * 1.02 * SZ * (g.pw && g.pw.giant ? 1.35 : 1) * (g.petK || 1); };
  function lit(f, key, x, y, r, dt, a) { const L = f._lt || (f._lt = {}); L[key] = (L[key] || 0) - dt; if (L[key] <= 0) { H.X.light(x, y, r, a || 0.26); L[key] = 0.1; } }

  /* ================= shared: a geodesic solid (an icosahedron, optionally subdivided once) ================= */
  const GEO = {};
  function geodesic(freq) { if (GEO[freq]) return GEO[freq]; const t = (1 + Math.sqrt(5)) / 2;
    let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm);
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    if (freq > 1) { const mid = {}, mp = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mid[k] != null) return mid[k]; const p = nrm([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2]); V.push(p); return (mid[k] = V.length - 1); };
      const F2 = []; for (const [a, b, c] of F) { const ab = mp(a, b), bc = mp(b, c), ca = mp(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = F2; }
    // a little irregularity, so it reads as cut crystal rather than a ball
    V = V.map((p, i) => { const k = 1 + (rnd(i * 7.3 + freq) - 0.5) * 0.14; return [p[0] * k, p[1] * k, p[2] * k]; });
    return (GEO[freq] = { V, F }); }
  function nrm(p) { const l = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / l, p[1] / l, p[2] / l]; }
  const RAMP = [P.abyss, P.deep, P.blue, P.ice, P.pale, P.frost];
  const LV = nrm([-0.55, 0.55, 0.65]);   // the light: from the upper left, a little in front (x right, y toward the viewer, z up)
  /* a faceted crystal sphere at screen (cx, cy), radius r px, turned by yaw / pitch; a: alpha; o: { shell (edges and a
     faint skin only), edge, frac (0..1 fractures from within), hot (0..1 inner brightness), seed } */
  const _q = [];
  function gem(c, cx, cy, r, yaw, pitch, a, o) { if (r < 2 || !(a > 0.01)) return; o = o || {}; const G = geodesic(o.freq || 2), cy1 = Math.cos(yaw), sy1 = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const Pq = _q; Pq.length = 0; for (const v of G.V) { const x1 = v[0] * cy1 - v[1] * sy1, y1 = v[0] * sy1 + v[1] * cy1, y2 = y1 * cp - v[2] * sp, z2 = y1 * sp + v[2] * cp; Pq.push([cx + x1 * r, cy - z2 * r * 0.96 + y2 * r * 0.04, x1, y2, z2]); }
    const front = [[], [], [], [], [], []], back = [];
    for (const f of G.F) { const A = Pq[f[0]], B = Pq[f[1]], Cc = Pq[f[2]], nx = A[2] + B[2] + Cc[2], ny = A[3] + B[3] + Cc[3], nz = A[4] + B[4] + Cc[4], l = Math.hypot(nx, ny, nz) || 1;
      if (ny / l < -0.02) { back.push(f); continue; } const b = cl((nx * LV[0] + ny * LV[1] + nz * LV[2]) / l * 0.5 + 0.5); front[Math.min(5, Math.floor(b * b * 6.2))].push(f); }
    const tri = f => { const A = Pq[f[0]], B = Pq[f[1]], Cc = Pq[f[2]]; c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(Cc[0], Cc[1]); c.closePath(); };
    c.save(); c.lineJoin = 'round';
    // the far facets seen through the near ones: faint additive light, cyan seams
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = (o.shell ? 0.1 : 0.22) * a; c.fillStyle = P.blue; c.beginPath(); back.forEach(tri); c.fill();
    c.globalAlpha = (o.shell ? 0.25 : 0.35) * a; c.strokeStyle = P.cyan; c.lineWidth = Math.max(0.6, r * 0.012); c.stroke();
    // the core's light inside
    if (!o.shell) { const hot = o.hot == null ? 0.5 : o.hot; K.glow(c, cx, cy, r * (0.85 + 0.3 * hot), P.cyan, (0.3 + 0.25 * hot) * a); K.glow(c, cx, cy, r * (0.25 + 0.25 * hot), P.white, (0.25 + 0.35 * hot) * a); }
    // the near facets: translucent, shaded by the light
    c.globalCompositeOperation = 'source-over'; for (let i = 0; i < 6; i++) { if (!front[i].length) continue; c.globalAlpha = (o.shell ? 0.08 + i * 0.03 : 0.42 + i * 0.07) * a; c.fillStyle = RAMP[i]; c.beginPath(); front[i].forEach(tri); c.fill(); }
    // brilliant edges, the brightest facets flashing white / lavender
    c.globalCompositeOperation = 'lighter'; c.beginPath(); for (let i = 0; i < 6; i++) front[i].forEach(tri); c.globalAlpha = (o.shell ? 0.5 : 0.75) * a; c.strokeStyle = o.edge || P.cyan; c.lineWidth = Math.max(0.8, r * (o.shell ? 0.016 : 0.022)); c.stroke();
    c.globalAlpha = 0.35 * a; c.strokeStyle = P.white; c.lineWidth = Math.max(0.5, r * 0.008); c.stroke();
    if (!o.shell && front[5].length) { c.globalAlpha = 0.5 * a; c.fillStyle = P.white; c.beginPath(); front[5].slice(0, 3).forEach(tri); c.fill(); }
    if (front[4].length) { const f = front[4][(Math.floor((o.t || 0) * 3) % front[4].length)], A = Pq[f[0]]; K.glow(c, A[0], A[1], r * 0.28, P.lav, 0.55 * a); }
    // fractures racing out from the middle
    if (o.frac > 0) { const s = o.seed || 0; c.lineCap = 'round'; for (let pass = 0; pass < 2; pass++) { c.beginPath(); for (let i = 0; i < 9; i++) { let b = s + i / 9 * TAU + rnd(i + s) * 0.4, x = cx, y = cy; const L = r * 1.02 * Math.min(1, o.frac * (0.7 + 0.5 * rnd(i * 3 + s))); c.moveTo(x, y);
          for (let k = 1; k <= 4; k++) { b += (rnd(i * 11 + k + s) - 0.5) * 0.9; x += Math.cos(b) * L / 4; y += Math.sin(b) * L / 4; c.lineTo(x, y); if (k === 2) { const bb = b + (rnd(i + k) < 0.5 ? 0.9 : -0.9); c.lineTo(x + Math.cos(bb) * L * 0.25, y + Math.sin(bb) * L * 0.25); c.moveTo(x, y); } } }
        c.globalAlpha = (pass ? 0.95 : 0.5) * a * cl(o.frac * 2); c.strokeStyle = pass ? P.white : P.cyan; c.lineWidth = pass ? Math.max(1, r * 0.025) : Math.max(2, r * 0.07); c.stroke(); } }
    c.restore(); }

  /* ================= 6. Frozen Singularity ================= */
  /* a ring in 3D round (wx, wy) at height z (tiles), radius r (tiles), tilted alpha from flat, turned phi round the
     vertical; points carry their depth (toward the viewer), so near and far halves are drawn either side of the core */
  function ringPts(X, Y, T, r, al, ph, z, n) { const ux = Math.cos(ph), uy = Math.sin(ph), vx = -Math.cos(al) * Math.sin(ph), vy = Math.cos(al) * Math.cos(ph), vz = -Math.sin(al), out = [];
    for (let i = 0; i <= n; i++) { const th = i / n * TAU, cs = Math.cos(th), sn = Math.sin(th), x = (ux * cs + vx * sn) * r, y = (uy * cs + vy * sn) * r, zz = (vz * sn) * r;
      out.push([X + x * T, Y - z * T + (y * SY - zz * CZ) * T, y * CZ + zz * SY, th]); } return out; }
  function ringHalf(c, pts, front, w, a, hot) { if (!(a > 0.01)) return; c.save(); c.lineCap = 'butt'; c.lineJoin = 'round'; c.beginPath(); let on = false; const n = pts.length - 1, fr = i => (pts[(i + n) % n][2] + pts[(i + 1 + n) % n][2]) > 0;
    // the near half reaches one segment past its ends (it is drawn over the far half), so the band never shows a seam
    for (let i = 0; i < n; i++) { const inc = front ? (fr(i) || fr(i - 1) || fr(i + 1)) : !fr(i); if (inc) { const p = pts[i], q = pts[i + 1]; if (!on) c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); on = true; } else on = false; }
    const k = front ? 1 : 0.6; c.globalAlpha = 0.55 * a * k; c.strokeStyle = P.deep; c.lineWidth = w * 1.35; c.stroke();
    c.globalAlpha = 0.75 * a * k; c.strokeStyle = P.blue; c.lineWidth = w; c.stroke(); c.save(); c.translate(0, -w * 0.18); c.globalAlpha = 0.7 * a * k; c.strokeStyle = P.ice; c.lineWidth = w * 0.62; c.stroke(); c.restore();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.35 + 0.4 * hot) * a * k; c.strokeStyle = P.cyan; c.lineWidth = w * 0.62; c.stroke();
    c.globalAlpha = (0.55 + 0.4 * hot) * a * k; c.strokeStyle = P.frost; c.lineWidth = Math.max(1, w * 0.22); c.stroke(); c.restore(); }

  U.frozensingularity = (C, h) => { H = h; K = IK.bind(H); const me = H.me, ev = K.evo(C), L4 = ev >= 4, L7 = ev >= 7, u7 = (ev - 1) / 6;
    const x = C.tx, y = C.ty, NR = K.lv(C, [2, 3, 5]), RR = lerp(1.45, 2.4, u7) * C.K, Z = lerp(1.75, 2.5, u7), CR = lerp(0.58, 1.1, u7) * C.K, WR = lerp(3.3, 5.6, u7) * C.K,
      G0 = 0.35, GEND = lerp(1.9, 2.5, u7), DET = GEND + 0.6, WAVE = L7 ? 0.95 : 0.75, LIFE = DET + 1.75, NS = K.lv(C, [14, 22, 36]), D = C.base * 14 * C.K * K.evoK(C);
    H.warn(x, y, WR, DET, C.col); H.X.banner('FROZEN SINGULARITY', '', C.col, 1.4); H.X.sfx.hum();
    // the rings: each its own tilt and precession, the level 7 set aligning into one plane before the burst
    const rings = []; for (let i = 0; i < NR; i++) rings.push({ al: NR === 2 ? 1.15 + i * 0.25 : lerp(0.55, 1.4, i / (NR - 1)), ph: i / NR * Math.PI + 0.3, sp: (i % 2 ? -1 : 1) * (0.7 + i * 0.18), r: RR * (1 - i * (NR > 3 ? 0.06 : 0.1)), w: 0.19 + 0.04 * u7, nc: L7 ? 7 : L4 ? 6 : 5 });
    const shards = []; for (let i = 0; i < NS; i++) shards.push({ b: rnd(i * 3.1) * TAU, r0: RR * (1.25 + rnd(i * 5.7) * 0.9), z0: Z + (rnd(i * 2.3) - 0.5) * 2.2, t0: G0 + (i / NS) * (GEND - G0 - 0.45) + rnd(i) * 0.15, dur: 0.55 + rnd(i * 9.1) * 0.25, w: 0.12 + rnd(i * 4.4) * 0.1, s: i, spin: (rnd(i * 6.6) < 0.5 ? 1 : -1) * (2.2 + rnd(i) * 1.2) });
    const debris = [], crestN = K.lv(C, [26, 34, 46]);
    const f = H.add({ life: LIFE, x, y, hit: new Set(), done: false,
      update(dt, f) { const t = f.t;
        if (t < DET) { lit(f, 'c', x, y, RR * 1.6, dt, 0.18 + 0.2 * cl(t / DET)); K.aura(x, y - Z, CR * 1.2, dt, 10 + 10 * u7, 0);
          // the singularity drags the monsters round it inward and slows them
          if (t > G0) for (const m of H.near(x, y, RR * 1.3)) { H.pull(m, x, y, dt * (0.6 + 1.2 * cl((t - GEND + 0.6) / 0.6))); H.slow(m, 0.4); }
          if (Math.random() < dt * 14 * H.Q()) { const b = Math.random() * TAU, rr = RR * (1.2 + Math.random() * 0.6); H.P({ kind: 'spark', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * SY - Z * 0.6, vx: -Math.cos(b) * rr * 1.6, vy: -Math.sin(b) * rr * 1.0, life: 0.5, max: 0.5, size: 1.6, color: Math.random() < 0.5 ? P.white : P.cyan }); } }
        if (t >= DET && !f.done) { f.done = true; detonate(); }
        if (f.done) { const u = cl((t - DET) / WAVE), rw = lerp(0.4, WR, H.ease.out(u)); if (u < 1) {
            for (const m of H.living()) { if (f.hit.has(m)) continue; const d = Math.hypot(m.x - x, m.y - y); if (d - m.r < rw) { f.hit.add(m); H.X.hitMon(m, 0.6 * D, C.dmgO({ kb: 3, freeze: lerp(1.4, 2.4, u7) })); K.shatterAt(m.x, m.y - 0.4, 0.7); } }
            const k = H.n(L7 ? 5 : 3); for (let i = 0; i < k; i++) { const b = Math.random() * TAU; K.glitter(x + Math.cos(b) * rw, y + Math.sin(b) * rw, 1, 3, { up: 3.5 }); }
            lit(f, 'w', x, y, rw * 1.2, dt, 0.3 * (1 - u)); } }
        for (const d of debris) { d.t += dt; d.vz -= 9 * dt; d.z = Math.max(0, d.z + d.vz * dt); d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt; if (d.z <= 0 && !d.land) { d.land = true; d.vx *= 0.2; d.vy *= 0.2; K.glitter(d.x, d.y, 3, 2.5); } } },
      drawUnder(c, f, X, Y, T, tt) { const t = f.t, A = Math.min(1, f.life / 0.9);
        // gathering: the floor frosts and a ring of light marks the reach
        const g = cl((t - 0.1) / (DET - 0.1)); K.floorLight(c, X, Y, RR * T * (1.2 + 0.4 * g), (0.25 + 0.35 * g) * A, P.ice); K.frostVeins(c, X, Y, RR * T * 1.25, H.ease.out(g), 0.6 * A, 3, L7 ? 11 : L4 ? 9 : 7);
        if (!f.done) { K.iceRing(c, X, Y, RR * T * (1.05 - 0.25 * cl((t - GEND) / 0.6)), 0.5 * g, null, tt, T * 0.06); return; }
        const u = cl((t - DET) / WAVE), rw = lerp(0.4, WR, H.ease.out(u)) * T;
        K.frozenPool(c, X, Y, rw * 0.98, (0.75 - 0.25 * u) * A, tt); K.frostVeins(c, X, Y, rw, 1, 0.8 * A, 7, L7 ? 16 : 11);
        K.floorLight(c, X, Y, rw * 1.1, 0.5 * (1 - u * 0.6) * A, P.cyan);
        if (u < 1) { K.iceRing(c, X, Y, rw, 0.95 * (1 - u * 0.5), null, tt, T * (0.12 + 0.06 * u7)); if (L7) K.iceRing(c, X, Y, rw * 0.72, 0.6 * (1 - u), null, tt + 1, T * 0.08); } },
      draw(c, f, X, Y, T, tt) { const t = f.t, cy = Y - Z * T, G = petGuard(X, cy, T, CR * T), appear = H.ease.out(cl(t / 0.5));
        if (!f.done || t < DET + 0.6) drawCore(c, f, X, Y, cy, T, tt, G, appear);
        if (f.done) drawWave(c, f, X, Y, T, tt); } });
    function ringState(R0, i, t) { // the ring's pose at time t: precessing, tightening, (level 7) aligning, then expanding at the burst
      const al0 = R0.al + 0.25 * Math.sin(t * 0.9 + i), ph0 = R0.ph + t * R0.sp, aU = L7 ? H.ease.io(cl((t - (GEND - 0.35)) / 0.75)) : 0;
      const al = lerp(al0, 1.22, aU), ph = lerp(ph0, 0.25 + i * 0.0, aU) + (L7 ? (1 - aU) * 0 : 0);
      const tight = H.ease.in(cl((t - GEND) / 0.6)), exp = cl((t - DET) / 0.6);
      return { al, ph, r: R0.r * (1 - 0.32 * tight) * (1 + 1.8 * H.ease.out(exp)) * H.ease.back(cl(t / 0.6)), a: 1 - exp, hot: tight, spin: t * (1.4 + i * 0.3) * (i % 2 ? -1 : 1) }; }
    function drawCore(c, f, X, Y, cy, T, tt, G, appear) { const t = f.t, arrived = shards.filter(s => t > s.t0 + s.dur).length / NS, tight = cl((t - GEND) / 0.6), burst = cl((t - DET) / 0.35);
      const pre = f.done ? 0 : 1, cr = CR * T * (0.25 + 0.75 * H.ease.out(arrived)) * (1 - 0.12 * tight) * appear, yaw = t * 0.9, pitch = 0.5 + Math.sin(t * 0.7) * 0.25;
      // the halo and the light on the floor below
      K.glow(c, X, cy, (CR * 2.6 + RR * 0.5) * T * appear, P.blue, (0.3 + 0.3 * tight) * G * (1 - burst));
      K.glow(c, X, cy, CR * T * (1.2 + 2.6 * tight) * (1 + burst * 2), P.cyan, (0.35 + 0.5 * tight) * (1 - burst) * G);
      const poses = rings.map((R0, i) => ringState(R0, i, t)), pts = poses.map(p => ringPts(X, Y, T, p.r, p.al, p.ph, Z, 44));
      // far halves of the rings, and their far studs
      poses.forEach((p, i) => { ringHalf(c, pts[i], false, rings[i].w * T * (1 - 0.5 * burst), p.a * G * appear, p.hot); studs(c, X, Y, T, p, rings[i], false, G * appear, tt); });
      // the inflowing shards, behind and in front by depth (drawn here, inside the rings)
      for (const s of shards) { const u = (t - s.t0) / s.dur; if (u < 0 || u > 1) continue; const e = H.ease.in(u), r = s.r0 * (1 - e), b = s.b + s.spin * e, z = lerp(s.z0, Z, e), sx = X + Math.cos(b) * r * T, sy = Y - z * T + Math.sin(b) * r * SY * T,
          ang = Math.atan2(cy - sy, X - sx), a = G * Math.min(1, u * 5) * (1 - 0.3 * e); K.shard(c, sx + Math.cos(ang) * s.w * T, sy + Math.sin(ang) * s.w * T, s.w * T, s.w * T * 2.6 * (1 - 0.4 * e), ang + Math.PI, s.s, a, tt);
          K.glow(c, sx, sy, s.w * T * 2.2, P.cyan, 0.3 * a); }
      // the sphere: an inner faceted core, translucent outer layers (level 4+), fracturing at the end
      if (pre || burst < 1) { const a = G * (1 - burst), sc = 1 + burst * 0.5, frac = cl((t - GEND - 0.1) / 0.5), hot = 0.3 + 0.7 * Math.max(tight, L7 ? cl((t - GEND + 0.35) / 0.7) : 0);
        gem(c, X, cy, cr * sc, yaw, pitch, a, { frac, hot, seed: 2, t: tt, freq: 2 });
        if (L4) gem(c, X, cy, cr * 1.28 * sc, -yaw * 0.7, pitch + 0.6, a * 0.85 * cl(arrived * 2), { shell: true, freq: 1, t: tt });
        if (L7) gem(c, X, cy, cr * 1.55 * sc, yaw * 0.5 + 1, -pitch, a * 0.6 * cl(arrived * 2 - 0.6), { shell: true, freq: 1, edge: P.pale, t: tt });
        K.glow(c, X, cy, cr * (0.3 + 0.6 * hot), P.white, (0.1 + 0.35 * hot * hot) * a); }
      // near halves and studs
      poses.forEach((p, i) => { ringHalf(c, pts[i], true, rings[i].w * T * (1 - 0.5 * burst), p.a * G * appear, p.hot); studs(c, X, Y, T, p, rings[i], true, G * appear, tt); });
      // the flash of the detonation
      if (burst > 0 && burst < 1) { K.glow(c, X, cy, CR * T * (2 + 3 * burst), P.white, 0.6 * (1 - burst)); K.glow(c, X, cy, CR * T * (3.5 + 5 * burst), P.cyan, 0.45 * (1 - burst)); } }
    function studs(c, X, Y, T, p, R0, front, A, tt) { if (!(p.a > 0.02)) return; const ux = Math.cos(p.ph), uy = Math.sin(p.ph), vx = -Math.cos(p.al) * Math.sin(p.ph), vy = Math.cos(p.al) * Math.cos(p.ph), vz = -Math.sin(p.al), cy = Y - Z * T;
      for (let j = 0; j < R0.nc; j++) { const th = j / R0.nc * TAU + p.spin, cs = Math.cos(th), sn = Math.sin(th), wx = (ux * cs + vx * sn) * p.r, wy = (uy * cs + vy * sn) * p.r, wz = vz * sn * p.r, d = wy * CZ + wz * SY; if ((d > 0) !== front) continue;
        const sx = X + wx * T, sy = cy + (wy * SY - wz * CZ) * T, ang = Math.atan2(sy - cy, sx - X), k = 1 + d / Math.max(0.5, p.r) * 0.18, w = T * 0.16 * k * (0.9 + 0.2 * (j % 2));
        K.shard(c, sx - Math.cos(ang) * w * 0.4, sy - Math.sin(ang) * w * 0.4, w, w * (2.3 + 0.6 * (j % 3)), ang, j + R0.nc, A * p.a * (front ? 1 : 0.7), tt); K.glow(c, sx, sy, w * 1.6, P.cyan, 0.35 * A * p.a); } }
    function drawWave(c, f, X, Y, T, tt) { const t = f.t, u = cl((t - DET) / WAVE), A = Math.min(1, f.life / 0.9);
      // the crest of crystals riding the wavefront, rising and breaking as it goes (level 7: a second, inner crest)
      const crests = L7 ? [[0, 1], [0.16, 0.7]] : [[0, 1]], items = [];
      for (const [lag, sk] of crests) { const uu = cl((t - DET - lag) / WAVE); if (uu <= 0 || uu >= 1) continue; const rw = lerp(0.4, WR, H.ease.out(uu)) * T * (lag ? 0.92 : 1), hk = Math.sin(Math.min(1, uu * 4) * Math.PI * 0.5) * (1 - uu * 0.75) * sk;
        for (let i = 0; i < crestN; i++) { const b = i / crestN * TAU + rnd(i) * 0.12 + lag * 3, sx = X + Math.cos(b) * rw, sy = Y + Math.sin(b) * rw * H.GY, hh = T * (0.75 + 0.6 * rnd(i * 3.3)) * (1 + 0.5 * u7) * hk; if (hh < 2) continue;
          items.push([sy, sx, b, hh, i]); } }
      items.sort((p, q) => p[0] - q[0]);
      for (const [sy, sx, b, hh, i] of items) { const pg = petGuard(sx, sy - hh * 0.5, T, 0), a = A * pg * pg * (1 - u * 0.3); K.floorLight(c, sx, sy, hh * 0.7, 0.4 * a, P.cyan); K.shard(c, sx, sy, hh * 0.42, hh, -Math.PI / 2 + Math.cos(b) * 0.55, i, a, tt); }
      // flying fragments of the sphere
      for (const d of debris) { const sx = H.sx(d.x), sy = H.sy(d.y) - d.z * T, a = cl(1 - (d.t - 0.9) / 0.5) * A; if (a <= 0) continue; K.shard(c, sx, sy, d.w * T, d.w * T * 2.4, d.rot, d.s, a, tt); if (d.z > 0.1) K.glow(c, sx, sy, d.w * T * 2, P.cyan, 0.3 * a); } }
    function detonate() { const cyW = y - Z * 0.55;
      H.hitArea(x, y, RR * 1.15 + 0.4, 0.4 * D, C.dmgO({ kb: 2, freeze: lerp(1.2, 2, u7) }));
      H.X.flash(L7 ? 0.25 : 0.18, P.frost); H.X.shake(L7 ? 14 : 9, 0.3); H.X.hitstop(0.06); H.X.light(x, y, WR * 1.4, 0.55); H.X.sfx.crash();
      H.X.ring(x, y, 0.4, WR, WAVE, P.pale, 0.5); if (L7) H.X.ring(x, y, 0.3, WR * 0.75, WAVE * 1.1, P.cyan, 0.4);
      K.glitter(x, cyW, H.n(L7 ? 40 : 22), 9, { up: 4 }); K.fragments(x, cyW, H.n(L7 ? 24 : 12), 8); K.snow(x, cyW, H.n(L7 ? 26 : 14), { v: 4 });
      const nd = K.lv(C, [9, 13, 20]); for (let i = 0; i < nd; i++) { const b = i / nd * TAU + rnd(i) * 0.3, v = 3 + rnd(i * 2) * 3; debris.push({ x, y, z: Z, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 2 + rnd(i * 5) * 3, rot: b, vr: (rnd(i) - 0.5) * 12, w: CR * (0.25 + 0.2 * rnd(i * 7)), s: i, t: 0 }); }
      // level 7: the expanding rings dissolve into diamond dust
      if (L7) for (let i = 0; i < NR; i++) for (let j = 0; j < H.n(14); j++) { const b = j / 14 * TAU, r = RR * 1.2; H.P({ kind: 'spark', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r * SY - Z * 0.8 + (i - 2) * 0.15, vx: Math.cos(b) * 6, vy: Math.sin(b) * 3.5 - 1, g: 2, drag: 1.5, life: 0.9, max: 0.9, size: 1.8, color: j % 3 ? P.white : P.lav }); } }
  };

  /* ================= 7. Frozen Vortex ================= */
  /* a curved ice blade (a sickle / crescent), cached per size bucket and variant: pointing along +x, its belly curving
     up (-y). A lit face and a shaded face meet on a white ridge; a cyan rim with a faint baked glow; glowing fractures */
  const bladeCache = new Map();
  function bladeSprite(L, v) { const bl = Math.max(8, Math.round(L / 6) * 6), key = bl + '|' + v; let cv = bladeCache.get(key); if (cv) return cv;
    const W = bl * (0.44 + 0.06 * v), pad = Math.ceil(bl * 0.12) + 2; cv = document.createElement('canvas'); cv.width = bl + pad * 2; cv.height = Math.ceil(W * 1.25) + pad * 2; const c = cv.getContext('2d'); c.translate(pad, cv.height - pad - W * 0.15);
    const n = 14, outer = [], mid = [], inner = [];
    for (let i = 0; i <= n; i++) { const u = i / n, s = Math.sin(Math.PI * Math.pow(u, 0.85)), x = bl * u; outer.push([x, -W * s * (1 - 0.25 * u)]); mid.push([x, -W * 0.68 * s * (1 - 0.2 * u)]); inner.push([x, -W * 0.36 * s]); }
    const path = (A, B) => { c.beginPath(); A.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); for (let i = B.length - 1; i >= 0; i--) c.lineTo(B[i][0], B[i][1]); c.closePath(); };
    // the baked halo along the cutting edge
    c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); outer.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = 'rgba(95,232,255,0.16)'; c.lineWidth = Math.max(3, W * 0.5); c.stroke(); c.strokeStyle = 'rgba(95,232,255,0.22)'; c.lineWidth = Math.max(2, W * 0.25); c.stroke();
    // lit face (outer band) and shaded face (inner band)
    let g = c.createLinearGradient(0, -W, bl, 0); g.addColorStop(0, 'rgba(232,251,255,0.95)'); g.addColorStop(0.5, 'rgba(191,239,255,0.8)'); g.addColorStop(1, 'rgba(127,200,240,0.7)'); path(outer, mid); c.fillStyle = g; c.fill();
    g = c.createLinearGradient(0, -W * 0.7, bl * 0.6, 0); g.addColorStop(0, 'rgba(59,142,224,0.75)'); g.addColorStop(0.6, 'rgba(30,79,160,0.78)'); g.addColorStop(1, 'rgba(18,46,102,0.85)'); path(mid, inner); c.fillStyle = g; c.fill();
    // fractures inside, glowing
    c.save(); path(outer, inner); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(95,232,255,0.8)'; c.lineWidth = Math.max(0.8, W * 0.06);
    for (let i = 0; i < 3; i++) { const u = 0.25 + i * 0.22 + rnd(v * 7 + i) * 0.06, x = bl * u, s = Math.sin(Math.PI * u); c.beginPath(); c.moveTo(x - bl * 0.04, -W * 0.3 * s); c.lineTo(x + bl * 0.03, -W * 0.62 * s); c.lineTo(x - bl * 0.01, -W * 0.85 * s); c.stroke(); } c.restore();
    // the white ridge, the cyan rim and a thin deep edge underneath
    c.beginPath(); mid.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = Math.max(1, W * 0.07); c.stroke();
    c.beginPath(); outer.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = 'rgba(95,232,255,0.95)'; c.lineWidth = Math.max(1, W * 0.07); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = Math.max(0.6, W * 0.025); c.stroke();
    c.beginPath(); inner.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = 'rgba(18,46,102,0.6)'; c.lineWidth = Math.max(0.6, W * 0.04); c.stroke();
    cv._ax = pad + bl * 0.5; cv._ay = cv.height - pad - W * 0.15 - W * 0.5; cv._bl = bl; if (bladeCache.size > 90) bladeCache.clear(); bladeCache.set(key, cv); return cv; }
  /* a blade centred at screen (x, y), L px long, along screen angle ang; squash (0..1) its foreshortening; flip mirrors its curve */
  function blade(c, x, y, L, ang, v, a, squash, flip) { if (L < 4 || !(a > 0.01)) return; const cv = bladeSprite(L, v), k = L / cv._bl; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.rotate(ang); c.scale(k, k * (squash == null ? 1 : squash) * (flip ? -1 : 1)); c.drawImage(cv, -cv._ax, -cv._ay); c.restore(); }

  delete U.snowman;
  U.frozenvortex = (C, h) => { H = h; K = IK.bind(H); const me = H.me, ev = K.evo(C), L4 = ev >= 4, L7 = ev >= 7, u7 = (ev - 1) / 6, X = H.X;
    const NV = ev >= 7 ? 4 : ev >= 5 ? 3 : ev >= 4 ? 2 : 1, DUR = lerp(4, 7, u7), HT = lerp(3.0, 3.8, u7), R0 = lerp(0.34, 0.45, u7), R1 = lerp(1.25, 1.6, u7) * Math.min(1.2, C.K),
      NB = Math.round(lerp(18, 28, u7) * (NV > 2 ? 0.72 : 1)), SPD = 1.1, GROW = 0.6, SPIN = DUR - 0.85, FLING = DUR - 0.35,
      TOT = C.base * 14 * C.K * K.evoK(C) * (L7 ? 1.3 : 1), SH = 1 + (NV - 1) * 0.5, TICK = 0.25, PER = TOT * 0.8 / (DUR * 0.8) / SH, FL = TOT * 0.2 / SH;
    // they form at the aim (pushed clear of the pet), fanned close round it at higher stages, and stay on a short leash
    let ax = C.tx, ay = C.ty; { const d = Math.hypot(ax - me.x, ay - me.y), need = R1 + 1.2 + (NV > 1 ? 1 : 0); if (d < need) { const a = d > 0.1 ? Math.atan2(ay - me.y, ax - me.x) : C.a; ax = me.x + Math.cos(a) * need; ay = me.y + Math.sin(a) * need; } }
    const LEASH = 1.2, ca = C.a, off = { 1: [[0, 0]], 2: [[0, -0.85], [0, 0.85]], 3: [[0.55, 0], [-0.45, -0.85], [-0.45, 0.85]], 4: [[0.85, 0], [0, -0.95], [0, 0.95], [-0.85, 0]] }[NV];
    H.X.banner('FROZEN VORTEX', '', C.col, 1.3); H.X.sfx.whoosh(); me.sq = 0.8;
    const vs = off.map((o, i) => { const a = ca + i * 1.7; let x = ax + Math.cos(ca) * o[0] - Math.sin(ca) * o[1], y = ay + Math.sin(ca) * o[0] + Math.cos(ca) * o[1]; if (X.blocked(x, y, 0.4, 1)) { x = ax; y = ay; if (X.blocked(x, y, 0.4, 1)) { x = me.x + Math.cos(ca) * 0.9; y = me.y + Math.sin(ca) * 0.9; } }
      H.warn(x, y, R0 + 0.7, GROW, C.col);
      return { i, x, y, a, hx: x, hy: y, tick: TICK * (i / NV), lx: x, ly: y, track: [], flash: 0, hit: 0, seed: i * 17,
        bl: Array.from({ length: NB }, (_, j) => ({ h0: (j / NB + rnd(j + i * 31) * 0.08) % 1, th0: rnd(j * 3.7 + i) * TAU, v: j % 3, sz: 0.85 + rnd(j * 5.1 + i) * 0.4 })) }; });
    const f = H.add({ life: DUR + 1.7, ang: 0, x: vs[0].x, y: vs[0].y,
      update(dt, f) { f.x = vs[0].x; f.y = vs[0].y; const t = f.t, spinK = t < SPIN ? 1 : 1 + 2.2 * cl((t - SPIN) / 0.5); f.ang += dt * 5.5 * spinK;
        for (const v of vs) { v.flash = Math.max(0, v.flash - dt * 4);
          if (t < FLING) {
            if (t > GROW * 0.6) { // a slow orbiting meander round where it formed, leaning toward the nearest monster within the leash
              const tg = H.sortNear(v.hx, v.hy, H.near(v.hx, v.hy, LEASH + 1.4))[0], ob = t * 0.8 * (v.i % 2 ? -1 : 1) + v.i * 1.6;
              let gx = v.hx + Math.cos(ob) * 0.55, gy = v.hy + Math.sin(ob) * 0.45; if (tg) { gx = gx * 0.4 + tg.x * 0.6; gy = gy * 0.4 + tg.y * 0.6; }
              { const dx = gx - v.hx, dy = gy - v.hy, d = Math.hypot(dx, dy); if (d > LEASH) { gx = v.hx + dx / d * LEASH; gy = v.hy + dy / d * LEASH; } }
              { const dx = gx - me.x, dy = gy - me.y, d = Math.hypot(dx, dy); if (d < R1 + 1 && d > 0.01) { gx = me.x + dx / d * (R1 + 1); gy = me.y + dy / d * (R1 + 1); } }
              const dx = gx - v.x, dy = gy - v.y, d = Math.hypot(dx, dy), sp = Math.min(d, SPD * dt * (t < SPIN ? 1 : 0.3));
              if (d > 0.01) { const nx = v.x + dx / d * sp, ny = v.y + dy / d * sp; v.a = Math.atan2(dy, dx); if (!X.blocked(nx, ny, 0.4, 1)) { v.x = nx; v.y = ny; } } }
            if (Math.hypot(v.x - v.lx, v.y - v.ly) > 0.2) { v.track.push({ x: v.x, y: v.y, t }); v.lx = v.x; v.ly = v.y; }
            // the blades slice everything inside the lower funnel; the cold drags the monsters round into it
            if (t > GROW) { v.tick -= dt; for (const m of H.near(v.x, v.y, R1 * 1.9)) { H.pull(m, v.x, v.y, dt * (Math.hypot(m.x - v.x, m.y - v.y) < R1 * 0.6 ? 0.4 : 1.5)); H.slow(m, 0.5); }
              if (v.tick <= 0) { v.tick += TICK; const k = H.hitArea(v.x, v.y, R1 * 0.85, PER * TICK, C.dmgO({ kb: 0.3, freeze: 0.3 })); if (k) { v.flash = 1; v.hit++; for (const m of H.near(v.x, v.y, R1 * 0.85)) K.glitter(m.x, m.y - 0.4, 4, 4); if (v.hit % 3 === 1) H.X.sfx.crack ? H.X.sfx.crack() : H.X.sfx.hum(); } } }
            lit(f, 'v' + v.i, v.x, v.y, R1 * 2.2, dt, 0.26);
            // snow and frost wind swirling round the column
            const k = dt * 26 * H.Q() * (L7 ? 0.8 : 1); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0);
            while (m-- > 0) { const b = Math.random() * TAU, z = Math.random() * HT, r = lerp(R0, R1, z / HT) * (0.9 + Math.random() * 0.3); H.P({ kind: Math.random() < 0.65 ? 'ember' : 'spark', x: v.x + Math.cos(b) * r, y: v.y + Math.sin(b) * r * SY - z * CZ, vx: -Math.sin(b) * r * 5, vy: Math.cos(b) * r * 2.5 - 0.6, drag: 1.2, g: 0, life: 0.45, max: 0.45, size: 1.4 + Math.random() * 1.6, color: Math.random() < 0.5 ? P.white : Math.random() < 0.5 ? P.pale : P.cyan }); }
          } else if (!v.flung) { v.flung = t; // the finish: the blades fly outward in a ring and it dissolves into snow
            H.hitArea(v.x, v.y, R1 + 1.4, FL, C.dmgO({ kb: 2.5, freeze: lerp(1.0, 1.8, u7) }));
            K.glitter(v.x, v.y - HT * 0.5, H.n(L7 ? 18 : 24), 7, { up: 3 }); K.fragments(v.x, v.y - 0.5, H.n(10), 7); K.snow(v.x, v.y - HT * 0.6, H.n(L7 ? 16 : 22), { v: 3.5 });
            H.X.ring(v.x, v.y, 0.3, R1 + 1.6, 0.5, P.pale, 0.5); H.X.light(v.x, v.y, R1 * 3, 0.45);
            if (v.i === 0) { H.X.sfx.crash(); H.X.shake(L7 ? 12 : 7, 0.25); H.X.flash(L7 ? 0.18 : 0.1, P.frost); if (L7) H.X.hitstop(0.05); } } }
        for (const v of vs) { let k = 0; while (k < v.track.length && t - v.track[k].t > 1.7) k++; if (k) v.track.splice(0, k); } },
      drawUnder(c, f, X0, Y0, T, tt) { const t = f.t, A = Math.min(1, f.life / 0.8);
        for (const v of vs) { const vx = H.sx(v.x), vy = H.sy(v.y), g = H.ease.out(cl(t / GROW)), end = v.flung ? cl((t - v.flung) / 0.6) : 0, a = A * g * (1 - end);
          // the frosted, glittering track
          const tr = v.track; if (tr.length > 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; const w = R1 * 1.1 * T;
            for (let bk = 0; bk < 4; bk++) { const ka = 1 - (bk + 0.5) / 4; c.beginPath(); let on = false; for (let i = 1; i < tr.length; i++) { const q = tr[i], kb = Math.min(3, Math.floor((t - q.t) / 1.7 * 4)); if (kb !== bk) { on = false; continue; } if (!on) c.moveTo(H.sx(tr[i - 1].x), H.sy(tr[i - 1].y)); c.lineTo(H.sx(q.x), H.sy(q.y)); on = true; }
              c.globalAlpha = 0.14 * ka * A; c.strokeStyle = P.cyan; c.lineWidth = w; c.stroke(); c.globalAlpha = 0.3 * ka * A; c.strokeStyle = P.frost; c.lineWidth = w * 0.18; c.stroke(); }
            c.restore(); for (let i = 0; i < tr.length; i += 2) { const q = tr[i], ka = 1 - (t - q.t) / 1.7; K.glow(c, H.sx(q.x) + (rnd(i + v.seed) - 0.5) * w, H.sy(q.y) + (rnd(i * 3 + v.seed) - 0.5) * w * 0.45, T * 0.1, i % 3 ? P.white : P.lav, 0.8 * ka * A * (0.5 + 0.5 * Math.sin(tt * 9 + i))); } }
          if (!(a > 0.01)) continue;
          // floor light, a ring of frost at its foot, a cold mist skirt
          K.floorLight(c, vx, vy, R1 * T * 1.7, 0.5 * a, P.cyan); K.frozenPool(c, vx, vy, R1 * T * 0.95, 0.55 * a, tt); K.iceRing(c, vx, vy, R1 * T * (0.95 + 0.05 * Math.sin(tt * 4)), 0.75 * a, null, tt * 3, T * 0.07);
          K.frostVeins(c, vx, vy, R1 * T * 1.15, 1, 0.5 * a, v.seed + Math.floor(tt * 2), 8); K.mist(c, vx, vy, R1 * T * 1.1, 0.8 * a, tt); } },
      draw(c, f, X0, Y0, T, tt) { const order = vs.slice().sort((p, q) => p.y - q.y); for (const v of order) drawVortex(c, f, v, T, tt); } });
    const _bk = [], _fr = [];
    function drawVortex(c, f, v, T, tt) { const t = f.t, X = H.sx(v.x), Y = H.sy(v.y), g = H.ease.back(cl(t / GROW)), end = v.flung ? cl((t - v.flung) / 0.7) : 0, G = petGuard(X, Y - HT * T * 0.4, T, R1 * T * 0.6), A = G * cl(t / 0.25) * Math.min(1, f.life / 0.5), hot = 0.5 + 0.5 * v.flash + (t > SPIN ? 0.6 * cl((t - SPIN) / 0.5) : 0);
      if (!(A > 0.01)) return; const rz = z => lerp(R0, R1, Math.pow(z / HT, 0.8)) * T * g, bk = _bk, fr = _fr; bk.length = 0; fr.length = 0;
      // place the blades: spiralling up the funnel, faster low down; when flung they fly straight out and fade
      for (let j = 0; j < v.bl.length; j++) { const b = v.bl[j], hf = (b.h0 + t * 0.32) % 1, z = hf * HT * g, th = b.th0 + f.ang * (1.25 - 0.45 * hf) * (v.i % 2 ? -1 : 1), out = end > 0 ? 1 + end * 3.2 : 1, r = rz(z) * out, cs = Math.cos(th), sn = Math.sin(th);
        const sx = X + cs * r, sy = Y + sn * r * SY - z * CZ * T - (end > 0 ? end * end * T * 0.6 : 0), dir = v.i % 2 ? -1 : 1, ang = Math.atan2(cs * SY * dir, -sn * dir) - 0.42 * dir, L = T * (0.75 + 0.55 * hf) * b.sz * (1 + 0.3 * u7) * g,
          a = A * Math.sin(Math.min(1, hf * 1.15) * Math.PI * 0.5 + 0.0) * (hf > 0.88 ? (1 - hf) / 0.12 : 1) * (1 - end), it = [sn, sx, sy, L, ang, b.v, a, 0.62 + 0.38 * Math.abs(sn), sn < 0]; (sn < 0 ? bk : fr).push(it); }
      bk.sort((p, q) => p[0] - q[0]); fr.sort((p, q) => p[0] - q[0]);
      // the far blades, dimmer, behind the column
      for (const q of bk) blade(c, q[1], q[2], q[3] * 0.9, q[4], q[5], q[6] * 0.6, q[7], q[8]);
      if (end < 1) { // the column of frozen air: a glow up the axis, frost-wind streaks wheeling round it
        const ka = A * (1 - end); for (let i = 0; i < 4; i++) { const z = (i + 0.5) / 4 * HT * g; K.glow(c, X, Y - z * CZ * T, rz(z) * 1.3, i % 2 ? P.blue : P.cyan, (0.18 + 0.12 * hot) * ka); }
        K.glow(c, X, Y - HT * 0.15 * T, R0 * T * 2.2 * g, P.white, 0.3 * ka * hot);
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (let pass = 0; pass < 2; pass++) { c.beginPath(); for (let i = 0; i < (L7 ? 7 : 6); i++) { const z = (i + 0.3) / (L7 ? 7 : 6) * HT * g, r = rz(z) * 0.82, cy = Y - z * CZ * T, a0 = f.ang * (1.6 - 0.1 * i) * (v.i % 2 ? -1 : 1) + i * 1.9; c.moveTo(X + Math.cos(a0) * r, cy + Math.sin(a0) * r * SY); c.ellipse(X, cy, r, r * SY, 0, a0, a0 + 1.7 + 0.2 * (i % 3)); }
          c.globalAlpha = (pass ? 0.75 : 0.3) * ka; c.strokeStyle = pass ? P.frost : P.cyan; c.lineWidth = pass ? Math.max(1, T * 0.025) : Math.max(2, T * 0.08); c.stroke(); }
        c.restore(); }
      // the near blades, in front, flashing when they cut
      for (const q of fr) { blade(c, q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8]); if (hot > 0.75 || q[0] > 0.8) K.glow(c, q[1], q[2], q[3] * 0.5, hot > 0.9 ? P.white : P.cyan, 0.22 * q[6] * hot); }
      // a lavender glint racing round the top of the funnel
      const ga = f.ang * 1.1 + v.i, gz = HT * g * 0.85; K.glow(c, X + Math.cos(ga) * rz(gz), Y + Math.sin(ga) * rz(gz) * SY - gz * CZ * T, T * 0.3, P.lav, 0.5 * A * (1 - end)); }
  };
})();
