/* ---------- Ice, reworked: Ultimates 6. Frozen Singularity, 7. Snowman ----------
   Frozen Singularity: a brilliant blue core hangs over the aim between great rotating rings of ice (real 3D rings: their
   far halves pass behind the core, their near halves in front, crystals studding them). Loose shards spiral in and build a
   faceted crystalline sphere (a geodesic solid shaded per facet, translucent, the core's light showing through); the
   rings tighten, the sphere fractures from within, and it detonates into a broad floor wave crested with crystals.
   Level 1: 2 rings, a small core. Level 4: 3 tilted rings, a larger core in translucent layers. Level 7: 5 intersecting
   rings round a huge faceted sphere; they align into one plane at full brightness, then expand and dissolve into diamond
   dust as the sphere bursts and a sweeping double shockwave runs out.
   Snowman: a giant glowing ice spirit of the casting pet itself (its own picture, built once per size: re-hued to
   translucent ice, frost facets and fractures inside, a cyan / white rim) forms beside the pet, then rolls: it tumbles
   end over end as it travels in passes across the arena, steering toward monsters and bouncing off walls, freezing all it
   touches (bosses only a moment) and leaving a frozen glittering track that fades. At the end it slows, glows and
   shatters into snow. Level 1: mid size, 3 rolls. Level 4: larger, 5 rolls, crystals sprouting along its track.
   Level 7: mini-boss size (3x the pet), 7 rolls, an orbit of shards round it, a frost ring at every bounce. */
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

  /* ================= 7. Snowman ================= */
  /* the pet's own picture as an ice spirit: built once per pet picture and size. Its body re-hued to translucent ice (its
     light and dark kept, so its markings show as brighter and deeper ice), a frost sheen from the upper left, facets and
     glowing fractures inside; a rim of the silhouette spread wide and blue to tight and white */
  const PI = { S: null, hh: 0 };
  function petIce(hpx) {
    const SP = typeof arc !== 'undefined' ? arc.sprites : null, hh = Math.max(24, Math.min(420, Math.round(hpx / 6) * 6));
    if (PI.rim && PI.S === SP && PI.hh === hh) return PI;
    const W = Math.ceil(hh * 2.3), Hh = Math.ceil(hh * 2.3), fx = W / 2, fy = Math.round(Hh / 2 + hh / 2);
    const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; return cv; };
    const body = mk(), bg = body.getContext('2d'); try { drawPetSprite(bg, fx, fy, hh, {}); } catch (e) { bg.fillStyle = '#9FE0F8'; bg.beginPath(); bg.ellipse(fx, fy - hh / 2, hh * 0.42, hh / 2, 0, 0, TAU); bg.fill(); }
    const mask = mk(), mg = mask.getContext('2d'); mg.drawImage(body, 0, 0); mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#FFFFFF'; mg.fillRect(0, 0, W, Hh);
    // an eroded mask (for the inner glow along the edge)
    const tint = mk(), tg = tint.getContext('2d'), rim = mk(), rg = rim.getContext('2d');
    for (const [col, rr, a, n] of [[P.deep, 0.1, 0.18, 12], [P.blue, 0.065, 0.32, 12], [P.cyan, 0.038, 0.6, 12], [P.pale, 0.02, 0.85, 10], [P.white, 0.009, 1, 8]]) {
      tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, Hh); tg.drawImage(mask, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = col; tg.fillRect(0, 0, W, Hh);
      rg.globalAlpha = a; for (let i = 0; i < n; i++) { const b = i / n * TAU; rg.drawImage(tint, Math.cos(b) * rr * hh, Math.sin(b) * rr * hh); } }
    rg.globalAlpha = 1; rg.globalCompositeOperation = 'destination-out'; rg.drawImage(mask, 0, 0);
    // the body: icy hue over the pet's own shading, brightened toward frost
    bg.globalCompositeOperation = 'color'; bg.fillStyle = '#7FD8FF'; bg.fillRect(0, 0, W, Hh);
    bg.globalCompositeOperation = 'screen'; bg.fillStyle = 'rgba(60,120,200,0.55)'; bg.fillRect(0, 0, W, Hh);
    bg.globalCompositeOperation = 'source-atop'; let g = bg.createLinearGradient(fx - hh * 0.55, fy - hh, fx + hh * 0.45, fy); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(191,239,255,0.12)'); g.addColorStop(1, 'rgba(18,46,102,0.45)'); bg.fillStyle = g; bg.fillRect(0, 0, W, Hh);
    // facets: angular planes of lighter and deeper ice cut across the body
    for (let i = 0; i < 9; i++) { const cx = fx + (rnd(i * 3.1) - 0.5) * hh * 0.8, cy = fy - hh * (0.1 + rnd(i * 5.3) * 0.8), s = hh * (0.18 + rnd(i * 2.2) * 0.22), b = rnd(i * 7.7) * TAU;
      bg.beginPath(); for (let k = 0; k < 3; k++) { const bb = b + k * TAU / 3 + (rnd(i + k) - 0.5) * 0.8; bg.lineTo(cx + Math.cos(bb) * s, cy + Math.sin(bb) * s); } bg.closePath(); bg.fillStyle = i % 2 ? 'rgba(232,251,255,0.2)' : 'rgba(30,79,160,0.22)'; bg.fill(); bg.strokeStyle = 'rgba(232,251,255,0.35)'; bg.lineWidth = Math.max(1, hh * 0.006); bg.stroke(); }
    // glowing fractures inside
    bg.globalCompositeOperation = 'source-atop'; bg.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) { bg.beginPath(); for (let i = 0; i < 6; i++) { let x = fx + (rnd(i * 4.1 + 1) - 0.5) * hh * 0.6, y = fy - hh * (0.2 + rnd(i * 6.3) * 0.6), b = rnd(i * 1.7) * TAU; bg.moveTo(x, y); for (let k = 0; k < 4; k++) { b += (rnd(i * 9 + k) - 0.5) * 1.2; x += Math.cos(b) * hh * 0.08; y += Math.sin(b) * hh * 0.08; bg.lineTo(x, y); } }
      bg.strokeStyle = pass ? 'rgba(255,255,255,0.8)' : 'rgba(95,232,255,0.45)'; bg.lineWidth = pass ? Math.max(1, hh * 0.007) : Math.max(2, hh * 0.022); bg.stroke(); }
    bg.globalCompositeOperation = 'destination-in'; bg.drawImage(mask, 0, 0);
    // an inner rim: the edge of the body glowing cyan (mask minus a shrunk mask)
    const inner = mk(), ig = inner.getContext('2d'); ig.drawImage(mask, 0, 0); ig.globalCompositeOperation = 'source-in'; ig.fillStyle = P.cyan; ig.fillRect(0, 0, W, Hh); ig.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 8; i++) { const b = i / 8 * TAU; ig.drawImage(mask, Math.cos(b) * hh * 0.035, Math.sin(b) * hh * 0.035); }
    Object.assign(PI, { S: SP, hh, rim, body, inner, W, H: Hh, fx, fy }); return PI;
  }
  /* the ice spirit with its middle at screen (X, Yc), h px tall, turned by rot; a alpha; sx / sy squash; rimK, flip */
  function spirit(c, X, Yc, h, rot, a, o) { if (!(a > 0.01) || h < 6) return; o = o || {}; const G = petIce(h * ppx(c)), k = h / G.hh, ox = -G.fx * k, oy = -(G.fy - G.hh / 2) * k - h / 2;
    c.save(); c.translate(X, Yc); c.rotate(rot || 0); c.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
    c.globalAlpha = Math.min(1, a * (o.body == null ? 0.78 : o.body)); c.drawImage(G.body, ox, oy, G.W * k, G.H * k);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * 0.28 * (o.glow || 1)); c.drawImage(G.body, ox, oy, G.W * k, G.H * k);
    c.globalAlpha = Math.min(1, a * 0.75); c.drawImage(G.inner, ox, oy, G.W * k, G.H * k);
    c.globalAlpha = Math.min(1, a * (o.rim || 1)); c.drawImage(G.rim, ox, oy, G.W * k, G.H * k); c.restore(); }

  U.snowman = (C, h) => { H = h; K = IK.bind(H); const me = H.me, ev = K.evo(C), L4 = ev >= 4, L7 = ev >= 7, u7 = (ev - 1) / 6, X = H.X;
    const ROLLS = K.evoN(C, 3, 7), SIZE = lerp(2.0, 3.1, u7) * Math.min(1.15, C.K), V = lerp(7, 10, u7), PASS = lerp(5, 5.6, u7), FORM = 0.7, D = C.base * 13 * C.K * K.evoK(C), PER = D * 0.78 / (ROLLS * 0.55)   /* (hits harder: the user asked for massive damage) */, FREEZE = lerp(1.5, 2.3, u7);
    const T0 = H.X.Tz(), hs0 = petH(T0) / T0 * SIZE, RB = hs0 * 0.42;   // the spirit's height and roll radius (tiles)
    // it forms beside the pet, toward the monsters
    const tg0 = H.sortNear(me.x, me.y)[0], a0 = tg0 ? H.angTo(me.x, me.y, tg0.x, tg0.y) : C.a; let sx0 = me.x + Math.cos(a0) * (RB + 1.0), sy0 = me.y + Math.sin(a0) * (RB + 1.0);
    if (X.blocked(sx0, sy0, 0.45, 1)) { sx0 = me.x + Math.cos(a0) * 0.9; sy0 = me.y + Math.sin(a0) * 0.9; if (X.blocked(sx0, sy0, 0.45, 1)) { sx0 = me.x; sy0 = me.y; } }
    H.X.banner('SNOWMAN', '', C.col, 1.3); H.X.sfx.hum(); me.sq = 0.8; H.warn(sx0, sy0, RB + 0.4, FORM, C.col);
    const track = [], bursts = [], sprouts = [], encased = [];
    const S0 = { ph: 'form', x: sx0, y: sy0, vx: Math.cos(a0), vy: Math.sin(a0), rot: 0, roll: 0, passT: 0, passD: 0, tgt: tg0 || null, hit: new Set(), z: 0, vz: 0, sq: 0, endT: 0, lastHit: new Set(), lx: sx0, ly: sy0, face: Math.cos(a0) >= 0 ? 1 : -1 };
    function pick(s) { // the next monster to roll at: one not struck on the last pass, and not too close
      const L = H.living().filter(m => !s.hit.has(m)), far = L.filter(m => Math.hypot(m.x - s.x, m.y - s.y) > 1.6), pool = far.length ? far : L;
      if (!pool.length) return null; return H.sortNear(s.x, s.y, pool)[Math.min(pool.length - 1, s.roll % 2)]; }
    function newPass(s, bounce, nx, ny) { s.roll++; s.passT = 0; s.passD = 0; s.lastHit = s.hit; s.hit = new Set(); if (s.roll >= ROLLS) { s.ph = 'end'; s.endT = 0; return; }
      s.tgt = pick(s); if (s.tgt) { const b = H.angTo(s.x, s.y, s.tgt.x, s.tgt.y); let vx = Math.cos(b), vy = Math.sin(b); if (bounce && nx != null && vx * nx + vy * ny < 0.15) { vx = s.vx; vy = s.vy; } s.vx = vx; s.vy = vy; }
      s.vz = bounce ? 2.6 : 1.6; s.sq = bounce ? 1 : 0.5;
      bursts.push({ x: s.x, y: s.y, t: 0, big: bounce }); K.glitter(s.x, s.y, H.n(10), 5, { up: 3 }); K.fragments(s.x, s.y, H.n(6), 5); K.snow(s.x, s.y - RB, H.n(8), { v: 3 });
      H.X.shake(L7 ? 6 : 4, 0.12); H.X.sfx.crash(); }
    const f = H.add({ life: 30, x: sx0, y: sy0, s: S0,
      update(dt, f) { const s = f.s; f.x = s.x; f.y = s.y;
        for (const b of bursts) b.t += dt; for (let i = bursts.length - 1; i >= 0; i--) if (bursts[i].t > 0.8) bursts.splice(i, 1);
        for (const q of sprouts) q.t += dt; for (let i = sprouts.length - 1; i >= 0; i--) if (sprouts[i].t > 1.6) sprouts.splice(i, 1);
        for (const e of encased) e.t += dt; for (let i = encased.length - 1; i >= 0; i--) if (encased[i].t > encased[i].life) encased.splice(i, 1);
        s.sq = Math.max(0, s.sq - dt * 3); s.vz -= 14 * dt; s.z = Math.max(0, s.z + s.vz * dt); if (s.z <= 0 && s.vz < 0) s.vz = 0;
        lit(f, 'b', s.x, s.y, RB * 2.6, dt, 0.3);
        if (s.ph === 'form') { K.aura(s.x, s.y, RB * 1.4, dt, 30, RB); if (f.t >= FORM) { s.ph = 'roll'; s.roll = -1; newPass(s, false); s.vz = 1.2; } return; }
        if (s.ph === 'roll') { s.passT += dt;
          // steer toward the target while it is ahead
          if (s.tgt && !s.tgt.dead) { const b = H.angTo(s.x, s.y, s.tgt.x, s.tgt.y), cur = Math.atan2(s.vy, s.vx), d = H.wrap(b - cur); if (Math.abs(d) < 1.6) { const nb = cur + Math.max(-2.4 * dt, Math.min(2.4 * dt, d)); s.vx = Math.cos(nb); s.vy = Math.sin(nb); } }
          const step = V * dt, nx = s.x + s.vx * step, ny = s.y + s.vy * step;
          if (X.blocked(nx, ny, 0.45, 1)) { // bounce off the wall: reflect the blocked component(s)
            const bx = X.blocked(nx, s.y, 0.45, 1), by = X.blocked(s.x, ny, 0.45, 1); let wx = 0, wy = 0; if (bx || !by) { s.vx = -s.vx; wx = Math.sign(s.vx); } if (by || !bx) { s.vy = -s.vy; wy = Math.sign(s.vy); }
            newPass(s, true, wx, wy); }
          else { s.x = nx; s.y = ny; s.passD += step; s.rot += step / RB * (s.vx >= 0 ? 1 : -1); if (Math.abs(s.vx) > 0.2) s.face = s.vx > 0 ? 1 : -1; }
          if (s.ph === 'roll' && (s.passD > PASS || s.passT > 1.2)) newPass(s, false);
          // freeze all in its path
          for (const m of H.living()) { if (s.hit.has(m)) continue; if (Math.hypot(m.x - s.x, m.y - s.y) < RB * 1.05 + m.r) { s.hit.add(m); H.X.hitMon(m, PER, C.dmgO({ kb: 1.5, freeze: FREEZE }));
              if (m.boss) m.freeze = Math.max(m.freeze || 0, 0.5); K.shatterAt(m.x, m.y - 0.4, 0.8); if (encased.length < 14) encased.push({ m, t: 0, life: m.boss ? 0.8 : FREEZE, s: encased.length }); H.X.sfx.crack && H.X.sfx.crack(); } }
          // the frozen track, the spray it throws up, the crystals it sprouts
          if (Math.hypot(s.x - s.lx, s.y - s.ly) > 0.22) { track.push({ x: s.x, y: s.y, t: f.t }); s.lx = s.x; s.ly = s.y; if (L4 && track.length % (L7 ? 3 : 4) === 0) sprouts.push({ x: s.x + (rnd(track.length) - 0.5) * RB * 1.2, y: s.y + (rnd(track.length * 3) - 0.5) * RB * 0.8, t: 0, h: lerp(0.5, 1.1, u7) * (0.7 + 0.5 * rnd(track.length * 7)), s: track.length }); }
          K.aura(s.x, s.y, RB, dt, 18 + 14 * u7, RB);
          if (Math.random() < dt * 30 * H.Q()) H.P({ kind: Math.random() < 0.6 ? 'ember' : 'spark', x: s.x - s.vx * RB * 0.6 + (Math.random() - 0.5) * RB, y: s.y - s.vy * RB * 0.4, vx: -s.vx * 3 + (Math.random() - 0.5) * 2, vy: -s.vy * 2 - 2 - Math.random() * 2, g: 5, life: 0.5, max: 0.5, size: 1.6 + Math.random() * 1.6, color: Math.random() < 0.5 ? P.white : P.pale });
          return; }
        if (s.ph === 'end') { s.endT += dt; const u = s.endT; if (u < 0.45) { const k = 1 - u / 0.45, step = V * 0.5 * k * dt, nx = s.x + s.vx * step, ny = s.y + s.vy * step; if (!X.blocked(nx, ny, 0.45, 1)) { s.x = nx; s.y = ny; s.rot += step / RB * (s.vx >= 0 ? 1 : -1); } }
          K.aura(s.x, s.y, RB * 1.2, dt, 30, RB);
          if (u >= 0.75 && !s.shattered) { s.shattered = true; const cy = s.y - RB * 0.8;
            H.hitArea(s.x, s.y, RB + 1.6, D * 0.22, C.dmgO({ kb: 3, freeze: FREEZE }));
            K.glitter(s.x, cy, H.n(L7 ? 40 : 24), 8, { up: 4 }); K.fragments(s.x, cy, H.n(L7 ? 26 : 14), 7); K.snow(s.x, cy, H.n(L7 ? 30 : 18), { v: 4, up: 1.5 });
            H.X.flash(0.15, P.frost); H.X.shake(L7 ? 12 : 8, 0.25); H.X.hitstop(0.05); H.X.light(s.x, s.y, RB * 4, 0.5); H.X.ring(s.x, s.y, 0.3, RB + 1.8, 0.5, P.pale, 0.5); H.X.sfx.crash(); bursts.push({ x: s.x, y: s.y, t: 0, big: true, fin: true }); }
          if (u >= 0.75 + 1.4 && f.life > 0.05) f.life = 0.05; } },
      drawUnder(c, f, X0, Y0, T, tt) { const s = f.s, now = f.t, TL = 1.8;
        // the frozen glittering track: a glassy band of light fading behind it, in a few alpha steps (one path each)
        if (track.length > 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; const w = RB * 1.1 * T;
          for (let bk = 0; bk < 5; bk++) { const a = 1 - (bk + 0.5) / 5; c.beginPath(); let on = false;
            for (let i = 1; i < track.length; i++) { const p = track[i - 1], q = track[i], age = now - q.t, kb = Math.floor(age / TL * 5); if (kb !== bk || Math.hypot(q.x - p.x, q.y - p.y) > 0.6) { on = false; continue; } const ax = H.sx(p.x), ay = H.sy(p.y), bx = H.sx(q.x), by = H.sy(q.y); if (!on) c.moveTo(ax, ay); c.lineTo(bx, by); on = true; }
            c.globalAlpha = 0.16 * a; c.strokeStyle = P.cyan; c.lineWidth = w * 1.25; c.stroke(); c.globalAlpha = 0.24 * a; c.strokeStyle = P.ice; c.lineWidth = w * 0.8; c.stroke(); c.globalAlpha = 0.4 * a; c.strokeStyle = P.frost; c.lineWidth = w * 0.22; c.stroke(); }
          c.restore();
          for (let i = 0; i < track.length; i += 2) { const q = track[i], age = now - q.t; if (age > TL) continue; const a = 1 - age / TL, tw = 0.5 + 0.5 * Math.sin(tt * 9 + i * 1.7); K.glow(c, H.sx(q.x) + (rnd(i) - 0.5) * w, H.sy(q.y) + (rnd(i * 3) - 0.5) * w * 0.4, T * 0.12, i % 3 ? P.white : P.lav, 0.8 * a * tw); }
          if (now - track[track.length - 1].t > TL) track.length = 0; else { let k = 0; while (k < track.length - 2 && now - track[k].t > TL) k++; if (k > 0) track.splice(0, k); } }
        for (const b of bursts) { const u = b.t / 0.8, R = (b.fin ? RB + 1.8 : b.big ? RB * (L7 ? 2.6 : 1.8) : RB * 1.3) * T * H.ease.out(u); K.iceRing(c, H.sx(b.x), H.sy(b.y), R, (1 - u) * (b.big ? 0.9 : 0.5), null, tt, T * 0.08); K.floorLight(c, H.sx(b.x), H.sy(b.y), R * 1.1, 0.4 * (1 - u), P.cyan); if (b.big && (L7 || b.fin)) K.frostVeins(c, H.sx(b.x), H.sy(b.y), R * 1.1, 1, 0.7 * (1 - u), b.x * 3, 9); }
        if (s.ph !== 'end' || s.endT < 0.9) { const A = s.ph === 'form' ? cl(f.t / FORM) : 1; K.floorLight(c, X0, Y0, RB * T * 2.2, 0.55 * A, P.cyan); K.frozenPool(c, X0, Y0, RB * T * (s.ph === 'form' ? 1.3 * A : 1.0), 0.5 * A, tt); } },
      draw(c, f, X0, Y0, T, tt) { const s = f.s, hs = hs0 * T, rb = RB * T;
        // crystals sprouted along the track (level 4+) and the ice round frozen monsters
        const items = [];
        for (const q of sprouts) { const u = q.t / 1.6, gr = H.ease.back(cl(q.t / 0.25)), a = cl((1 - u) * 2.5); items.push([H.sy(q.y), () => { const sx = H.sx(q.x), sy = H.sy(q.y), hh = q.h * T * gr; K.crystal(c, sx, sy, hh * 0.4, hh, q.s, a * petGuard(sx, sy - hh * 0.5, T, 0), tt); }]); }
        for (const e of encased) { const m = e.m; if (m.dead) continue; const u = e.t / e.life, gr = H.ease.out(cl(e.t / 0.2)), a = cl((1 - u) * 4), mr = Math.max(0.35, m.r || 0.4) * T; items.push([H.sy(m.y) + 1, () => { const sx = H.sx(m.x), sy = H.sy(m.y);
            for (let i = 0; i < 5; i++) { const b = -Math.PI / 2 + (i - 2) * 0.45, hh = mr * (1.1 + 0.6 * (i === 2) + 0.2 * rnd(e.s + i)) * gr; K.shard(c, sx + (i - 2) * mr * 0.4, sy + Math.abs(i - 2) * mr * 0.08, hh * 0.45, hh, b, e.s + i, a * 0.85, tt); } K.glow(c, sx, sy - mr * 0.6, mr * 1.4, P.cyan, 0.35 * a); }]); }
        // the spirit itself
        if (!s.shattered || s.endT < 1.3) items.push([Y0 + 0.5, () => drawSpirit(c, f, X0, Y0, T, tt, hs, rb)]);
        items.sort((p, q) => p[0] - q[0]); for (const it of items) it[1](); } });
    function drawSpirit(c, f, X0, Y0, T, tt, hs, rb) { const s = f.s; let a = 1, sc = 1, sy = 1, sxk = 1, glowK = 1, rimK = 1;
      if (s.ph === 'form') { const u = cl(f.t / FORM); a = cl(u * 2.2); sc = H.ease.back(cl(u * 1.15)) * 0.9 + 0.1; rimK = 1 + 1.5 * (1 - u); glowK = 1 + 1.5 * (1 - u); }
      if (s.ph === 'end') { const u = s.endT; glowK = 1 + 2.5 * cl((u - 0.3) / 0.45); if (u > 0.75) { const k = cl((u - 0.75) / 0.5); a = 1 - k; sc = 1 + 0.25 * k; rimK = 1 + k; } }
      const sq = s.sq; sxk = 1 + 0.16 * sq; sy = 1 - 0.14 * sq; const cy = Y0 - (rb * 0.95 + s.z * T) * sy, G = petGuard(X0, cy, T, rb * 0.6);
      // a halo of frozen light, the momentum: arcs of frost wheeling round it with the roll
      K.glow(c, X0, cy, hs * 0.95 * sc, P.blue, 0.32 * a * G * glowK); K.glow(c, X0, cy, hs * 0.55 * sc, P.cyan, 0.22 * a * G * glowK);
      const rolling = s.ph === 'roll' || (s.ph === 'end' && s.endT < 0.5);
      if (rolling) { const dir = s.vx >= 0 ? 1 : -1; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (let i = 0; i < (L7 ? 4 : 3); i++) { const r = rb * (1.12 + i * 0.1), a0 = s.rot * 1.0 + i * TAU / (L7 ? 4 : 3), span = 1.3; c.globalAlpha = 0.5 * a * G; c.strokeStyle = P.cyan; c.lineWidth = Math.max(2, T * 0.09); c.beginPath(); c.arc(X0, cy, r, dir > 0 ? a0 - span : a0, dir > 0 ? a0 : a0 + span); c.stroke(); c.globalAlpha = 0.8 * a * G; c.strokeStyle = P.white; c.lineWidth = Math.max(1, T * 0.03); c.stroke(); }
        c.restore(); }
      // level 7: an orbit of shards round it
      if (L7) for (let i = 0; i < 6; i++) { const b = tt * 2.2 + i / 6 * TAU, ox = Math.cos(b) * rb * 1.45, oy = Math.sin(b) * rb * 0.45, w = T * 0.2; if (Math.sin(b) < 0) K.shard(c, X0 + ox, cy + oy - rb * 0.1, w, w * 2.4, -Math.PI / 2 + Math.cos(b) * 0.4, i, a * G * 0.85, tt); }
      spirit(c, X0, cy, hs * sc, s.rot, a * G, { sx: sxk, sy, flip: s.face < 0, rim: rimK, glow: glowK });
      // glints on its surface and a bright core of frost light
      for (let i = 0; i < 3; i++) { const b = s.rot + i * 2.1, r = rb * 0.55; K.glow(c, X0 + Math.cos(b) * r, cy + Math.sin(b) * r, T * 0.22, i ? P.white : P.lav, 0.55 * a * G * (0.5 + 0.5 * Math.sin(tt * 5 + i))); }
      if (L7) for (let i = 0; i < 6; i++) { const b = tt * 2.2 + i / 6 * TAU, ox = Math.cos(b) * rb * 1.45, oy = Math.sin(b) * rb * 0.45, w = T * 0.2; if (Math.sin(b) >= 0) { K.shard(c, X0 + ox, cy + oy - rb * 0.1, w, w * 2.4, -Math.PI / 2 + Math.cos(b) * 0.4, i, a * G, tt); K.glow(c, X0 + ox, cy + oy, w * 1.5, P.cyan, 0.4 * a * G); } }
      if (s.ph === 'end' && s.endT > 0.3) K.glow(c, X0, cy, hs * 0.5 * glowK * 0.6, P.white, 0.5 * a * cl((s.endT - 0.3) / 0.45)); }
  };
})();
