/* ---------- Lightning, reworked: Static Blossom, Arc Boomerang, Sparkstep Echo, Capacitor Crush, Stormthread Volley ----------
   The fire rework's standard brought to five Lightning Strongs (docs/elem-spec/thunder.md, LI-S06..S10): luminous,
   translucent spirit forms built from the lightning kit (TK: white-hot cores, cyan bodies, violet fringes, gold at
   Celestial), a glow and particles round everything, light thrown on the floor, buildup -> release -> fade, and only
   fading violet impressions left behind. Every move gains pieces at Adept (stage 4) and again at Celestial (stage 7),
   where it also gets a golden flourish. Strokes are batched (one path, four layered strokes) so a Celestial cast stays
   cheap on an iPhone. Loads after 20k9-elem-thunder.js and replaces these five keys. */
(() => {
  const S = ELEM_IMPL.thunder.strong, TAU = Math.PI * 2;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u;

  /* ---- shared shapes for these five moves ---- */
  /* many bolts at once: every polyline in one path, stroked as violet haze, blue body, cyan, white core */
  function multiBolt(c, K, list, w, a, gold) {
    if (!list.length || !(a > 0.01)) return; const P = K.P; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); for (const p of list) { c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); }
    c.globalAlpha = Math.min(1, 0.26 * a); c.strokeStyle = P.violet; c.lineWidth = w * 3.4; c.stroke();
    c.globalAlpha = Math.min(1, 0.5 * a); c.strokeStyle = gold ? P.gold : P.blue; c.lineWidth = w * 1.8; c.stroke();
    c.globalAlpha = Math.min(1, 0.75 * a); c.strokeStyle = gold ? P.amber : P.cyan; c.lineWidth = w; c.stroke();
    c.globalAlpha = Math.min(1, 0.9 * a); c.strokeStyle = P.white; c.lineWidth = Math.max(0.6, w * 0.32); c.stroke(); c.restore();
  }
  /* a faint violet impression of many polylines (what a strike leaves on the floor; it only fades) */
  function multiScar(c, K, list, a, w) {
    if (!list.length || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); for (const p of list) { c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); }
    c.globalAlpha = 0.45 * a; c.strokeStyle = K.P.violet; c.lineWidth = (w || 3) * 1.6; c.stroke(); c.globalAlpha = 0.35 * a; c.strokeStyle = K.P.ice; c.lineWidth = Math.max(0.6, (w || 3) * 0.35); c.stroke(); c.restore();
  }
  /* a tapered filled band along pts (thin at the first point, w wide at the last) */
  function taper(c, pts, w, col, a) {
    const n = pts.length; if (n < 2 || !(a > 0.01)) return; const L = [], R = [];
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, ww = w * 0.5 * (0.08 + 0.92 * i / (n - 1)); L.push([p[0] - dy / d * ww, p[1] + dx / d * ww]); R.push([p[0] + dy / d * ww, p[1] - dx / d * ww]); }
    c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]); for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); c.fill();
  }
  /* a plasma streak: violet fringe, cyan body, white core; brightest at its head (the last point) */
  function streak(c, K, pts, w, a, gold) { if (pts.length < 2 || !(a > 0.01)) return; const P = K.P; c.save(); c.globalCompositeOperation = 'lighter'; taper(c, pts, w * 2.4, P.violet, 0.3 * a); taper(c, pts, w * 1.3, gold ? P.gold : P.cyan, 0.65 * a); taper(c, pts, w * 0.45, P.white, a); c.restore(); }
  /* a circle on the floor (world-true, as the hits are): a soft blue band and a thin white edge */
  function floorRing(c, K, H, X, Y, r, a, gold, ry) { if (r < 1 || !(a > 0.01)) return; const P = K.P; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a);
    c.strokeStyle = H.rgba(P.violet, 0.45); c.lineWidth = Math.max(2, r * 0.12); H.floorEllipse(c, X, Y, r * 0.95, (ry || r) * 0.95); c.stroke();
    c.strokeStyle = H.rgba(gold ? P.gold : P.cyan, 0.85); c.lineWidth = Math.max(1.5, r * 0.035); H.floorEllipse(c, X, Y, r, ry || r); c.stroke();
    c.strokeStyle = H.rgba(P.white, 0.7); c.lineWidth = 1; c.stroke(); c.restore(); }
  /* a glowing node: a halo, a hot white point */
  function node(c, K, x, y, r, a, gold) { if (!(a > 0.01)) return; K.glow(c, x, y, r * 4, gold ? K.P.gold : K.P.cyan, 0.55 * a); K.glow(c, x, y, r * 1.6, K.P.white, 0.8 * a); }
  /* how far along angle a from (x, y) the floor stays open, up to max tiles */
  function reach(H, x, y, a, max, r) { let L = 1; while (L < max && !H.X.blocked(x + Math.cos(a) * (L + 0.4), y + Math.sin(a) * (L + 0.4), r || 0.3, 0)) L += 0.25; return L; }
  /* particles that drift in toward (x, y) from radius r (world), arriving in about `life` s */
  function converge(H, K, x, y, r, k, life, z) { for (let i = 0; i < H.n(k); i++) { const b = Math.random() * TAU, rr = r * (0.7 + Math.random() * 0.5), lf = life * (0.7 + Math.random() * 0.4); H.P({ kind: Math.random() < 0.5 ? 'spark' : 'ember', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr - (z || 0), vx: -Math.cos(b) * rr / lf, vy: -Math.sin(b) * rr / lf, g: 0, drag: 0, life: lf, max: lf, size: 1.6 + Math.random() * 1.6, color: [K.P.white, K.P.cyan, K.P.ice, K.P.violet][i % 4] }); } }

  /* ===================== LI-S06 Static Blossom =====================
     A charged seed hovers over the aim and draws motes in; branches sprout from it across the floor, their tips divide
     (twice from Adept) and join into a ring network (two rings from Adept); one white pulse runs out through the network
     and strikes as it passes; the branches go out from the tips inward and leave fading violet lines.
     Level 1: 5 branches, tips divide once, one ring. Level 4: 7 branches, twice, two rings, crawling arcs on the pulse.
     Level 7: 9 branches, a golden outer ring of nodes, and a golden lotus that opens on the floor after the pulse. */
  S.staticblossom = (C, H) => {
    const K = TK.bind(H), P = K.P, e = K.evo(C), x = C.tx, y = C.ty, NB = K.lv(C, [5, 7, 9]), DEPTH = e >= 4 ? 2 : 1, R = K.lv(C, [2.7, 3.1, 3.5]), gold = e >= 7;
    const T_B = 0.3, PULSE = 0.82, PD = 0.26, OUT = PULSE + PD, END = OUT + 0.95, dmg = C.base * 2.5 * C.K * K.evoK(C);
    /* the network in world offsets: level 0 trunks, 1 (and 2) forks, links between neighbouring tips; each piece grows in its window */
    const segs = [], tips = [], mids = [], sd = Math.random() * 100;
    for (let i = 0; i < NB; i++) { const b = i / NB * TAU + (K.R1(sd + i) - 0.5) * 0.3, r1 = R * (DEPTH === 1 ? 0.48 : 0.38) * (0.9 + 0.2 * K.R1(sd + i * 3)), p1 = [Math.cos(b) * r1, Math.sin(b) * r1];
      segs.push({ a: [0, 0], b: p1, lv: 0, g0: T_B, g1: T_B + 0.15 });
      for (const s of [-1, 1]) { const b2 = b + s * (DEPTH === 1 ? 0.3 : 0.34) * (0.85 + 0.3 * K.R1(sd + i * 7 + s)), r2 = DEPTH === 1 ? R * 0.96 : R * 0.7, p2 = [Math.cos(b2) * r2, Math.sin(b2) * r2];
        segs.push({ a: p1, b: p2, lv: 1, g0: T_B + 0.11, g1: T_B + 0.26 });
        if (DEPTH === 1) tips.push({ p: p2, b: b2 }); else { mids.push({ p: p2, b: b2 }); for (const s2 of [-1, 1]) { const b3 = b2 + s2 * 0.17, r3 = R * 0.97, p3 = [Math.cos(b3) * r3, Math.sin(b3) * r3]; segs.push({ a: p2, b: p3, lv: 2, g0: T_B + 0.2, g1: T_B + 0.35 }); tips.push({ p: p3, b: b3 }); } } } }
    const ring = (list, lv, g0) => { list.sort((p, q) => p.b - q.b); for (let i = 0; i < list.length; i++) { const p = list[i], q = list[(i + 1) % list.length]; segs.push({ a: p.p, b: q.p, lv, g0: g0 + (i % 2) * 0.05, g1: g0 + 0.13 + (i % 2) * 0.05, link: 1 }); } };
    ring(tips, 3, T_B + (DEPTH === 1 ? 0.24 : 0.33)); if (DEPTH === 2) ring(mids, 4, T_B + 0.27);
    for (const s of segs) { s.r0 = Math.hypot(s.a[0], s.a[1]); s.r1 = Math.hypot(s.b[0], s.b[1]); s.rm = Math.max(s.r0, s.r1); s.k = segs.indexOf(s); }
    const MAXLV = 4, scars = [];
    H.warn(x, y, R, PULSE, C.col); H.X.sfx.hum();
    H.add({ life: END, x, y, hit: new Set(), fired: 0,
      update(dt, f) {
        if (f.t < PULSE) { K.aura(x, y - 0.35, 0.25 + 0.3 * f.t, dt, 14, 0); if (f.t < T_B + 0.3 && Math.random() < dt * 12) converge(H, K, x, y, 1.6, 2, 0.35, 0.35); }
        if (f.t >= PULSE && !f.fired) { f.fired = 1; H.X.flash(0.07, P.ice); H.X.shake(5, 0.14); H.X.sfx.crack(); H.X.hitstop(0.03); K.sparks(x, y - 0.3, 16, 8); K.motes(x, y - 0.2, 10); H.X.light(x, y, R * 1.3, 0.25); if (gold) K.goldSparks(x, y - 0.3, 14, 7); }
        if (f.t >= PULSE && f.t < OUT + 0.05) { const rp = R * 1.03 * H.ease.out(cl((f.t - PULSE) / PD, 0, 1));
          for (const m of H.near(x, y, R)) { if (f.hit.has(m) || Math.hypot(m.x - x, m.y - y) > rp + m.r) continue; f.hit.add(m); H.X.hitMon(m, dmg, C.dmgO({ kb: 1.5, stun: m.boss ? 0.15 : 0.35 })); K.sparks(m.x, m.y - 0.3, 8, 6); K.motes(m.x, m.y - 0.3, 4); H.X.light(m.x, m.y, 1.4, 0.12); if (gold) K.goldSparks(m.x, m.y - 0.3, 5, 5); }
          if (Math.random() < dt * 30 * H.Q()) { const b = Math.random() * TAU; K.sparks(x + Math.cos(b) * rp, y + Math.sin(b) * rp, 1, 3, { up: 2, life: 0.4 }); } }
        if (gold && f.t > OUT && f.t < OUT + 0.4 && Math.random() < dt * 25 * H.Q()) { const b = Math.random() * TAU, r = Math.random() * R * 0.5; K.goldSparks(x + Math.cos(b) * r, y + Math.sin(b) * r, 1, 3); }
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, hz = t < OUT ? 8 : 4, rp = t >= PULSE ? R * 1.03 * H.ease.out(cl((t - PULSE) / PD, 0, 1)) : -1, S2 = (o) => [X + o[0] * T, Y + o[1] * T];
        const build = cl(t / T_B, 0, 1), fadeAll = cl((END - t) / 0.5, 0, 1);
        // the floor: light pooled under the seed, the network's glow while it lives, and the pulse ring
        K.floorLight(c, X, Y, T * (0.8 + 1.4 * build), 0.5 * build * fadeAll, P.blue);
        if (t > T_B) K.floorLight(c, X, Y, T * R * 1.15, 0.35 * cl((t - T_B) / 0.4, 0, 1) * cl((OUT + 0.4 - t) / 0.5, 0, 1), P.violet);
        if (t < PULSE) { const k = build * (0.6 + 0.4 * Math.sin(t * 22)); floorRing(c, K, H, X, Y, T * (0.35 + 0.15 * build), 0.6 * k, gold); }
        // the branches by level; a level goes dark from the tips inward after the pulse, its violet line lingering
        const byLv = []; for (let l = 0; l <= MAXLV; l++) byLv.push([]);
        const outA = l => { const d0 = OUT + 0.05 + (MAXLV - l) * 0.06; return cl(1 - (t - d0) / 0.22, 0, 1); };
        for (const s of segs) { const g = cl((t - s.g0) / (s.g1 - s.g0), 0, 1); if (g <= 0) continue; const ge = H.ease.out(g), a = S2(s.a), b0 = S2(s.b), b = [lerp(a[0], b0[0], ge), lerp(a[1], b0[1], ge)], Lp = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (Lp < 2) continue; s.pts = K.path(a[0], a[1], b[0], b[1], K.seed(t, s.k, hz) + sd, Math.min(T * 0.14, Lp * (s.link ? 0.07 : 0.12)), Math.max(3, Math.ceil(Lp / 11))); byLv[s.lv].push(s.pts); s.grown = g; }
        const W = [2.6, 1.7, 1.25, 1.15, 1.25];
        for (let l = 0; l <= MAXLV; l++) { const oa = outA(l); if (oa > 0) multiBolt(c, K, byLv[l], W[l] * T / 40, 0.95 * oa, gold && l === 3); else if (t < END) multiScar(c, K, byLv[l], 0.8 * fadeAll * cl((t - OUT) / 0.2, 0, 1), W[l] * T / 40 * 1.4); }
        // nodes where branches divide, and the tips (gold at Celestial), brightening as the pulse arrives
        for (const s of segs) { if (s.link || !(s.grown >= 1) || !s.pts) continue; const p = s.pts[s.pts.length - 1], hot = rp >= 0 ? cl(1 - Math.abs(rp - s.r1 * 1) / 0.6, 0, 1) : 0, oa = outA(s.lv); if (oa <= 0) continue;
          node(c, K, p[0], p[1], T * (s.lv === 0 ? 0.07 : 0.05) * (1 + hot * 1.4), (0.55 + 0.45 * hot) * oa, gold && s.r1 > R * 0.9); }
        // the pulse: a white-hot front running out along every branch, and a floor ring at its radius
        if (rp >= 0 && t < OUT + 0.12) { const hotList = []; for (const s of segs) { if (!s.pts) continue; const lo = Math.min(s.r0, s.r1), hi = Math.max(s.r0, s.r1); if (rp > lo - 0.1 && rp < hi + 0.45) hotList.push(s.pts); }
          const pa = cl((OUT + 0.12 - t) / 0.2, 0, 1); multiBolt(c, K, hotList, T / 16, 1.1 * pa, gold); floorRing(c, K, H, X, Y, rp * T, 0.9 * pa, gold);
          if (e >= 4) for (let i = 0; i < K.lv(C, [0, 4, 6]); i++) { const b0 = i / K.lv(C, [1, 4, 6]) * TAU + t * 3, b1 = b0 + 0.45; K.arc(c, X + Math.cos(b0) * rp * T, Y + Math.sin(b0) * rp * T, X + Math.cos(b1) * rp * T, Y + Math.sin(b1) * rp * T, K.seed(t, i + 40), 1.3, 0.8 * pa, { forks: 0, jit: T * 0.2, gold }); }
          K.floorLight(c, X, Y, rp * T * 1.1, 0.35 * pa, gold ? P.gold : P.cyan); }
        // Celestial: a golden lotus opens on the floor where the seed went in
        if (gold && t > PULSE + 0.05) { const u = cl((t - PULSE - 0.05) / 0.45, 0, 1), la = cl((END - t) / 0.6, 0, 1) * Math.min(1, u * 3), rr = T * R * 0.55 * H.ease.out(u);
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; for (let pass = 0; pass < 2; pass++) { c.beginPath(); const np = 8, rot = t * 0.4 + pass * TAU / 16, R2 = rr * (pass ? 0.62 : 1);
            for (let i = 0; i < np; i++) { const b = rot + i / np * TAU, bw = 0.32, tx2 = X + Math.cos(b) * R2, ty2 = Y + Math.sin(b) * R2; c.moveTo(X, Y); c.quadraticCurveTo(X + Math.cos(b - bw) * R2 * 0.75, Y + Math.sin(b - bw) * R2 * 0.75, tx2, ty2); c.quadraticCurveTo(X + Math.cos(b + bw) * R2 * 0.75, Y + Math.sin(b + bw) * R2 * 0.75, X, Y); }
            c.globalAlpha = 0.16 * la; c.fillStyle = P.gold; c.fill(); c.globalAlpha = 0.35 * la; c.strokeStyle = P.amber; c.lineWidth = 4; c.stroke(); c.globalAlpha = 0.85 * la; c.strokeStyle = pass ? P.white : P.gold; c.lineWidth = 1.4; c.stroke(); }
          c.restore(); K.glow(c, X, Y, rr * 0.6, P.gold, 0.5 * la); }
      },
      draw(c, f, X, Y, T) {
        // the charged seed hovering over the aim: it grows with the buildup, filaments turning round it, then dives into the floor
        const t = f.t; if (t > PULSE + 0.18) return; const build = H.ease.out(cl(t / T_B, 0, 1)), dive = cl((t - PULSE + 0.08) / 0.12, 0, 1), z = T * 0.42 * (1 - dive), r = T * (0.07 + 0.11 * build + 0.04 * Math.min(1, t / PULSE)) * (1 - 0.6 * dive), a = Math.min(1, t / 0.08) * (1 - cl((t - PULSE) / 0.18, 0, 1));
        K.orb(c, X, Y - z, r, t, 1, a, gold); K.glow(c, X, Y - z, r * (4 + 2 * Math.sin(t * 30)), P.cyan, 0.35 * a);
        if (t > 0.1 && t < PULSE) for (let i = 0; i < 3; i++) { const b = t * 5 + i * TAU / 3; K.arc(c, X, Y - z, X + Math.cos(b) * T * 0.55, Y - z * 0.4 + Math.sin(b) * T * 0.3, K.seed(t, i + 60), 1.1, 0.7 * a, { forks: 0, jit: T * 0.12, gold }); }
        if (t >= PULSE - 0.05) K.glow(c, X, Y, T * 1.6 * (1 - cl((t - PULSE) / 0.2, 0, 1)), P.white, 0.8);
      } });
  };

  /* ===================== LI-S07 Arc Boomerang =====================
     A V of plasma, spinning flat over the floor, loops out along the aim and curves back to the pet, striking on both
     passes; at the turn it drops a line of loose sparks along the way it will come back. Its arms are tapered blades of
     plasma (violet fringe, cyan body, white core) with arcs crawling down them, the hub a small orb; each arm tip draws
     a plasma ribbon. Level 1: one V. Level 4: two, looping out on mirrored sides. Level 7: three, the centre one larger
     and gold, and a golden ring breaks round the pet as the last is caught. */
  S.arcboomerang = (C, H) => {
    const K = TK.bind(H), P = K.P, e = K.evo(C), me = H.me, a = C.a, dir = [Math.cos(a), Math.sin(a)], per = [-dir[1], dir[0]], sx0 = me.x, sy0 = me.y, DUR = 1.2, gold = e >= 7;
    const L = Math.max(2.2, reach(H, sx0, sy0, a, 5.2, 0.3) - 0.2), N = K.lv(C, [1, 2, 3]), dk = C.base * C.K * K.evoK(C), Z = 0.6;
    const booms = N === 1 ? [{ s: 1, W: 1.3, L, sz: 1, d0: 0 }] : [{ s: 1, W: 1.7, L: L * 0.92, sz: 0.85, d0: 0 }, { s: -1, W: 1.7, L: L * 0.92, sz: 0.85, d0: 0 }];
    if (N === 3) booms.push({ s: 1, W: 0.2, L: L * 1.05, sz: 1.15, d0: 0.16, gold: 1 });
    const hits = [new Set(), new Set()];
    for (const b of booms) { b.rot = Math.random() * TAU; b.hh = []; b.done = 0; b.turn = 0; b.pos = u => { const al = b.L * Math.sin(u * Math.PI), lat = b.s * b.W * 0.6 * Math.sin(u * TAU), back = u > 0.5 ? H.ease.io((u - 0.5) * 2) : 0; return [sx0 + dir[0] * al + per[0] * lat + (me.x - sx0) * back, sy0 + dir[1] * al + per[1] * lat + (me.y - sy0) * back]; }; }
    H.X.sfx.whoosh(); me.sq = 0.7; K.sparks(me.x + dir[0] * 0.5, me.y + dir[1] * 0.5 - 0.5, 10, 6);
    H.add({ life: DUR + 0.45, x: sx0, y: sy0, caught: 0,
      update(dt, f) {
        for (const b of booms) { const u = cl((f.t - b.d0) / DUR, 0, 1); if (f.t < b.d0) continue; b.u = u;
          if (u >= 1) { if (!b.done) { b.done = 1; K.sparks(me.x, me.y - 0.5, 10, 5); K.motes(me.x, me.y - 0.5, 6); H.X.light(me.x, me.y, 1.6, 0.12); H.X.sfx.crack(); } continue; }
          const p = b.pos(u); b.x = p[0]; b.y = p[1]; b.rot += dt * (3.2 + 1.5 * Math.sin(u * Math.PI)) * (b.s > 0 ? 1 : -1);
          b.hh.push([b.x, b.y]); if (b.hh.length > 12) b.hh.shift();
          // the turn: loose sparks hang along the way back
          if (u > 0.42 && !b.turn) { b.turn = 1; const k = H.n(14); for (let i = 0; i < k; i++) { const uu = 0.52 + 0.42 * i / k, q = b.pos(uu); H.P({ kind: 'spark', x: q[0] + (Math.random() - 0.5) * 0.25, y: q[1] - Z + (Math.random() - 0.5) * 0.2, vx: (Math.random() - 0.5) * 0.6, vy: -0.2 - Math.random() * 0.4, g: 0.3, drag: 1.5, life: 0.75 + i / k * 0.3, max: 1.05, size: 2.2, color: i % 3 === 0 ? (gold ? P.gold : P.white) : i % 3 === 1 ? P.ice : P.cyan }); } H.X.sfx.hum(); }
          const pass = u > 0.5 ? 1 : 0, rr = 0.85 * b.sz;
          for (const m of H.near(b.x, b.y, rr)) { if (hits[pass].has(m)) continue; hits[pass].add(m); H.X.hitMon(m, dk * (pass ? 1.3 : 1.2), C.dmgO({ kb: 2, stun: 0.15 })); K.sparks(m.x, m.y - 0.4, 8, 6); K.motes(m.x, m.y - 0.4, 3); H.X.light(m.x, m.y, 1.3, 0.1); H.X.sfx.crack(); if (b.gold) K.goldSparks(m.x, m.y - 0.4, 5, 5); }
          K.aura(b.x, b.y - Z, 0.45 * b.sz, dt, 16, 0);
        }
        if (gold && !f.caught && booms.every(b => b.done)) { f.caught = 1; H.X.ring(me.x, me.y, 0.3, 1.6, 0.35, P.gold, 0.5); K.goldSparks(me.x, me.y - 0.5, 16, 6); H.X.flash(0.05, P.gold); }
      },
      drawUnder(c, f) { const T = H.X.Tz(); for (const b of booms) { if (b.u == null || b.done) continue; const X = H.sx(b.x), Y = H.sy(b.y); K.floorLight(c, X, Y, T * 1.3 * b.sz, 0.4, b.gold ? P.gold : P.blue); K.floorLight(c, X, Y, T * 0.5 * b.sz, 0.35, P.cyan); } },
      draw(c, f) { const T = H.X.Tz(), t = f.t, z = Z * T;
        const order = booms.filter(b => b.u != null && !b.done).sort((p, q) => p.y - q.y);
        for (const b of order) { const X = H.sx(b.x), Y = H.sy(b.y) - z, u = b.u, a0 = cl(u / 0.07, 0, 1) * cl((1 - u) / 0.07, 0, 1) * cl((Math.hypot(b.x - me.x, b.y - me.y) - 0.25) / 0.6, 0.15, 1), sc = b.sz * (0.45 + 0.55 * Math.min(1, u / 0.1)) * (u > 0.9 ? 0.4 + 0.6 * (1 - u) / 0.1 : 1), g = b.gold || false;
          // the comet tail the hub leaves (wide and soft, a bright thread down its middle)
          if (b.hh.length > 2) { const tp = b.hh.map(p => [H.sx(p[0]), H.sy(p[1]) - z]); streak(c, K, tp.slice(-8), T * 0.3 * sc, 0.3 * a0, g); }
          K.glow(c, X, Y, T * 1.3 * sc, g ? P.gold : P.blue, 0.4 * a0); K.glow(c, X, Y, T * 0.6 * sc, P.violet, 0.3 * a0);
          // the V: two crescent blades of plasma swept back from the hub, turning slowly
          const AR = T * 1.1 * sc, tips = [], spines = [];
          for (let k = 0; k < 2; k++) { const th = b.rot + (k ? 0.68 : -0.68), bend = (k ? -1 : 1) * 0.45, cen = [];
            for (let i = 0; i <= 8; i++) { const v = i / 8, thv = th + bend * v * v, rv = AR * (0.12 + 0.88 * v); cen.push([X + Math.cos(thv) * rv, Y + Math.sin(thv) * rv * 0.82]); }
            spines.push(cen); tips.push(cen[cen.length - 1]);
            const blade = (wk, col, al) => { const Lp = [], Rp = []; for (let i = 0; i <= 8; i++) { const v = i / 8, p = cen[i], q = cen[Math.min(8, i + 1)], o = cen[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, w = T * 0.24 * sc * wk * Math.pow(1 - v, 0.65) + 0.6; Lp.push([p[0] - dy / d * w, p[1] + dx / d * w]); Rp.push([p[0] + dy / d * w * 0.55, p[1] - dx / d * w * 0.55]); }
              c.globalAlpha = al; c.fillStyle = col; c.beginPath(); c.moveTo(X, Y); Lp.forEach(p => c.lineTo(p[0], p[1])); for (let i = Rp.length - 1; i >= 0; i--) c.lineTo(Rp[i][0], Rp[i][1]); c.closePath(); c.fill(); };
            c.save(); c.globalCompositeOperation = 'lighter'; blade(1.8, P.violet, 0.4 * a0); c.globalCompositeOperation = 'source-over'; blade(1.05, g ? '#C98A1E' : P.deep, 0.55 * a0); blade(0.85, g ? P.amber : P.blue, 0.6 * a0); c.globalCompositeOperation = 'lighter'; blade(0.5, g ? P.gold : P.cyan, 0.65 * a0); blade(0.16, P.white, a0);
            c.globalAlpha = 0.5 * a0; for (let i = 2; i <= 8; i += 3) blitSized(c, glowSprite(g ? P.gold : P.cyan), cen[i][0] - T * 0.25 * sc, cen[i][1] - T * 0.25 * sc, T * 0.5 * sc, T * 0.5 * sc); c.restore(); }
          // arcs crawl down the blades and jump between their tips
          const crawl = spines.map((cen, k) => K.path(cen[1][0], cen[1][1], cen[8][0], cen[8][1], K.seed(t, k + (b.s > 0 ? 0 : 7) + (g ? 20 : 0), 16), T * 0.1 * sc, 6));
          if (Math.sin(t * 13 + b.s) > 0.3) crawl.push(K.path(tips[0][0], tips[0][1], tips[1][0], tips[1][1], K.seed(t, 30 + b.s, 20), T * 0.2 * sc, 7));
          multiBolt(c, K, crawl, 1.1, 0.8 * a0, g);
          for (const p of tips) node(c, K, p[0], p[1], T * 0.05 * sc, a0, g);
          K.orb(c, X, Y, T * 0.14 * sc, t, b.s, a0, g);
        }
      } });
  };

  /* ===================== LI-S08 Sparkstep Echo =====================
     The pet dashes two tiles behind a short forward bolt; where it stood, a charged echo of the pet itself (its own
     silhouette, rendered once and turned to blue light with a crackling white outline) stays, charges over a turning
     floor ring with arcs crawling round its outline, then detonates: the echo swells and dissolves, a shock ring and
     ground arcs run out, and violet lines fade on the floor.
     Level 1: one echo. Level 4: two smaller echoes flank it (afterimages to either side) and go off just after it.
     Level 7: gold-edged echoes, six golden bolts strike round the main one, and golden arcs leap from every echo to the pet. */
  function echoSprite(H, K, hpx) {
    const s = 2, W = Math.ceil(hpx * 1.7 * s), Hh = Math.ceil(hpx * 1.6 * s), fy = Hh - Math.ceil(hpx * 0.18 * s), mk = () => { const v = document.createElement('canvas'); v.width = W; v.height = Hh; return v; };
    const body = mk(), g = body.getContext('2d'); let ok = false;
    try { if (typeof drawPetSprite === 'function' && typeof arc !== 'undefined' && arc.sprites) { g.save(); g.translate(W / 2, fy); g.scale(s, s); drawPetSprite(g, 0, 0, hpx); g.restore(); const d = g.getImageData(W >> 1, Hh >> 1, 1, 1).data; ok = true; void d; } } catch (err) { ok = false; }
    if (!ok) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, Hh); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(W / 2, fy - hpx * 0.45 * s, hpx * 0.42 * s, hpx * 0.45 * s, 0, 0, TAU); g.fill(); }
    // the body as blue light: the silhouette tinted, a little brighter at the top
    g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, K.P.cyan); gr.addColorStop(0.55, K.P.blue); gr.addColorStop(1, K.P.violet); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    // hologram scan lines across the body
    g.fillStyle = 'rgba(255,255,255,0.45)'; const st = Math.max(2, Math.round(hpx * 0.05 * s)); for (let yy = 0; yy < Hh; yy += st * 2) g.fillRect(0, yy, W, Math.max(1, st * 0.6));
    // the outline: the silhouette spread in eight directions, its inside cut away
    const out = mk(), o = out.getContext('2d'), wpx = Math.max(2, hpx * 0.045 * s); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU; o.drawImage(body, Math.cos(b) * wpx, Math.sin(b) * wpx); }
    o.globalCompositeOperation = 'source-in'; o.fillStyle = K.P.cyan; o.fillRect(0, 0, W, Hh); o.globalCompositeOperation = 'destination-out'; o.drawImage(body, 0, 0);
    const hot = mk(), hg = hot.getContext('2d'), w2 = Math.max(1, wpx * 0.45); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU; hg.drawImage(body, Math.cos(b) * w2, Math.sin(b) * w2); }
    hg.globalCompositeOperation = 'source-in'; hg.fillStyle = '#FFFFFF'; hg.fillRect(0, 0, W, Hh); hg.globalCompositeOperation = 'destination-out'; hg.drawImage(body, 0, 0);
    return { body, out, hot, w: W / s, h: Hh / s, ox: W / 2 / s, oy: fy / s };
  }
  S.sparkstep = (C, H) => {
    const K = TK.bind(H), P = K.P, e = K.evo(C), me = H.me, a = C.a, dir = [Math.cos(a), Math.sin(a)], sx0 = me.x, sy0 = me.y, DT = 0.16, dist = 2.0, gold = e >= 7, dk = C.base * C.K * K.evoK(C);
    const T = H.X.Tz(), ES = echoSprite(H, K, T * 0.95), R = K.lv(C, [1.9, 2.1, 2.3]), DET = 0.62;
    me.dash = { vx: dir[0] * dist / DT, vy: dir[1] * dist / DT, t: DT, max: DT, hit: new Set(), dmg: dk * 0.4, land: dk * 0.3, el: C.el }; me.inv = Math.max(me.inv || 0, 0.3);
    // the forward strike: a bolt runs ahead of the dash
    const SL = Math.min(3.6, reach(H, sx0, sy0, a, 3.6, 0.25) + 0.3);
    H.hitLine(sx0, sy0, a, SL, 0.9, dk * 0.7, C.dmgO({ kb: 1.5, stun: 0.2 })); H.X.sfx.whoosh(); H.X.sfx.crack(); K.sparks(sx0 + dir[0] * SL, sy0 + dir[1] * SL - 0.4, 10, 6); H.X.light(sx0 + dir[0] * SL * 0.6, sy0 + dir[1] * SL * 0.6, 2, 0.15);
    H.add({ life: 0.32, x: sx0, y: sy0, draw(c, f, X, Y, T2) { const k = Math.min(1, f.t / 0.04) * cl((f.life) / 0.2, 0, 1), ex = H.sx(sx0 + dir[0] * SL), ey = H.sy(sy0 + dir[1] * SL) - T2 * 0.45;
      const pts = K.arc(c, X, Y - T2 * 0.5, ex, ey, K.seed(f.t, 3, 24), 3.2, k, { forks: 3, jit: T2 * 0.3, gold }); K.glow(c, ex, ey, T2 * 0.9, gold ? P.gold : P.cyan, 0.7 * k); node(c, K, ex, ey, T2 * 0.09, k, gold); void pts; } });
    // the echoes: the main one where the pet stood; from Adept two smaller ones along the dash
    const echoes = [{ x: sx0, y: sy0, sc: 1, det: DET, r: R, dmg: dk * 1.3, main: 1 }];
    if (e >= 4) for (const sd2 of [-1, 1]) echoes.push({ x: sx0 - dir[1] * sd2 * 1.3 - dir[0] * 0.4, y: sy0 + dir[0] * sd2 * 1.3 - dir[1] * 0.4, sc: 0.68, det: DET + (sd2 > 0 ? 0.1 : 0.17), r: R * 0.6, dmg: dk * 0.35 });
    for (const E of echoes) { E.scars = null; if (E.main) H.warn(E.x, E.y, E.r, E.det, C.col);
      H.X.after(E.det, () => { H.hitArea(E.x, E.y, E.r, E.dmg, C.dmgO({ kb: E.main ? 3 : 1.5, stun: E.main ? 0.35 : 0.15 })); K.sparks(E.x, E.y - 0.4, E.main ? 22 : 10, E.main ? 9 : 6); K.motes(E.x, E.y - 0.4, E.main ? 12 : 5); H.X.light(E.x, E.y, E.r * 1.6, 0.25);
        if (E.main) { H.X.flash(0.07, P.ice); H.X.shake(6, 0.16); H.X.hitstop(0.035); H.X.sfx.crash(); if (gold) K.goldSparks(E.x, E.y - 0.5, 16, 8); } else { H.X.shake(3, 0.1); H.X.sfx.crack(); } }); }
    if (gold) { // six golden bolts round the main echo as it goes off
      for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + 0.3, px = sx0 + Math.cos(b) * R * 0.78, py = sy0 + Math.sin(b) * R * 0.78; H.X.after(DET + 0.03 + i * 0.025, () => { K.goldSparks(px, py, 5, 5); H.X.light(px, py, 1, 0.1); }); } }
    H.add({ life: DET + 0.22 + 0.9, x: sx0, y: sy0,
      update(dt, f) { for (const E of echoes) { if (f.t < E.det) { K.aura(E.x, E.y - 0.55 * E.sc, 0.35 * E.sc, dt, E.main ? 14 : 6, 0); if (E.main && f.t > 0.12 && Math.random() < dt * 10) converge(H, K, E.x, E.y, 1.3, 2, 0.3, 0.5); } } },
      drawUnder(c, f, X0, Y0, T2) { const t = f.t;
        for (const E of echoes) { const X = H.sx(E.x), Y = H.sy(E.y), ch = cl(t / E.det, 0, 1), dt2 = t - E.det;
          if (dt2 < 0) { K.floorLight(c, X, Y, T2 * (0.7 + 0.6 * ch) * E.sc, 0.35 + 0.3 * ch, P.blue);
            // a turning ring of charge under the echo, ticks round it like a dial filling
            const rr = T2 * 0.7 * E.sc; floorRing(c, K, H, X, Y, rr, 0.5 + 0.4 * ch, false, rr * 0.55);
            c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = P.cyan; c.lineWidth = 2; c.globalAlpha = 0.85; const nt = 12, lit = Math.floor(ch * nt);
            for (let i = 0; i < nt; i++) { const b = i / nt * TAU + t * 1.5; c.globalAlpha = i < lit ? 0.9 : 0.25; c.beginPath(); c.moveTo(X + Math.cos(b) * rr * 1.12, Y + Math.sin(b) * rr * 0.55 * 1.12); c.lineTo(X + Math.cos(b) * rr * 1.3, Y + Math.sin(b) * rr * 0.55 * 1.3); c.stroke(); } c.restore(); continue; }
          // after the detonation: a shock ring runs out, ground arcs, then their violet lines fade
          const u = cl(dt2 / 0.3, 0, 1), ra = 1 - u;
          floorRing(c, K, H, X, Y, T2 * E.r * H.ease.out(u), 0.95 * ra, gold); K.floorLight(c, X, Y, T2 * E.r * 1.2, 0.6 * ra + 0.15, P.violet);
          if (!E.scars) { E.scars = []; const n = E.main ? K.lv(C, [6, 8, 10]) : 4; for (let i = 0; i < n; i++) { const b = i / n * TAU + Math.random() * 0.5, L2 = E.r * T2 * (0.75 + 0.25 * Math.random()); E.scars.push(K.path(X, Y, X + Math.cos(b) * L2, Y + Math.sin(b) * L2, Math.random() * 99 + i, L2 * 0.18, 7)); } }
          const sh = E.scars.map(p => p.map(q => [q[0] - X, q[1] - Y]));
          const live = dt2 < 0.24, pts = sh.map(p => p.map(q => [X + q[0] * (live ? 0.35 + 0.65 * H.ease.out(u * 1.3) : 1), Y + q[1] * (live ? 0.35 + 0.65 * H.ease.out(u * 1.3) : 1)]));
          if (live) multiBolt(c, K, pts.map((p, i) => K.path(p[0][0], p[0][1], p[p.length - 1][0], p[p.length - 1][1], K.seed(t, i + 80), T2 * 0.25, 7)), 2.2 * E.sc, 1, gold); else multiScar(c, K, pts, cl(1 - (dt2 - 0.24) / 0.7, 0, 1), 2.4 * E.sc);
        }
      },
      draw(c, f, X0, Y0, T2) { const t = f.t;
        for (const E of echoes) { const X = H.sx(E.x), Y = H.sy(E.y), dt2 = t - E.det, app = cl(t / 0.12, 0, 1), sc = E.sc * (1 + 0.04 * Math.sin(t * 40) * cl(t / E.det, 0, 1));
          if (dt2 > 0.3) continue;
          const sw = dt2 > 0 ? 1 + 0.7 * H.ease.out(cl(dt2 / 0.25, 0, 1)) : 1, ka = dt2 > 0 ? 1 - cl(dt2 / 0.25, 0, 1) : app, ch = cl(t / E.det, 0, 1), w = ES.w * sc * sw, h = ES.h * sc * sw;
          const x0 = X - ES.ox * sc * sw, y0 = Y - ES.oy * sc * sw;
          c.save(); c.globalCompositeOperation = 'lighter';
          K.glow(c, X, Y - T2 * 0.5 * sc, T2 * (1.1 + 0.5 * ch) * sc * sw, P.blue, 0.3 * ka);
          c.globalAlpha = (0.14 + 0.2 * ch) * ka * (0.8 + 0.2 * Math.sin(t * 50)); c.drawImage(ES.body, x0, y0 - ((t * 40) % 3), w, h);
          const jx = (K.R1(K.seed(t, 7, 30)) - 0.5) * 2; c.globalAlpha = 0.95 * ka; c.drawImage(ES.out, x0 + jx, y0, w, h); c.globalAlpha = (0.55 + 0.4 * ch) * ka; c.drawImage(ES.hot, x0, y0, w, h);
          if (gold) { c.globalAlpha = 0.5 * ka; c.drawImage(ES.out, x0 - jx * 2, y0 - 1.5, w, h); }
          c.restore();
          // arcs crawling round the outline, more of them as it charges
          const na = Math.round(lerp(2, E.main ? 5 : 3, ch)), cy = Y - T2 * 0.5 * sc * sw, rx = T2 * 0.42 * sc * sw, ry = T2 * 0.5 * sc * sw, list = [];
          for (let i = 0; i < na; i++) { const b0 = K.R1(K.seed(t, i + 20, 12)) * TAU, b1 = b0 + 0.6 + K.R1(K.seed(t, i + 30, 12)) * 0.8; list.push(K.path(X + Math.cos(b0) * rx, cy + Math.sin(b0) * ry, X + Math.cos(b1) * rx, cy + Math.sin(b1) * ry, K.seed(t, i + 40, 20), T2 * 0.12, 5)); }
          multiBolt(c, K, list, 1.4, 0.9 * ka, false); K.glow(c, X, cy, T2 * 0.22 * sc, P.white, (0.3 + 0.4 * ch) * ka);
          if (dt2 > 0 && dt2 < 0.12) { const k = 1 - dt2 / 0.12; K.glow(c, X, cy, T2 * 1.6 * E.sc, P.cyan, 0.6 * k); K.glow(c, X, cy, T2 * 0.7 * E.sc, P.white, 0.6 * k); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * k; blitSized(c, glowSprite(P.cyan), X - T2 * 0.3 * E.sc, cy - T2 * 2.4, T2 * 0.6 * E.sc, T2 * 2.6); c.restore(); }
        }
        // Celestial: golden bolts round the main echo, and a golden arc down the chain to the pet
        if (gold) { for (let i = 0; i < 6; i++) { const d0 = t - (DET + 0.03 + i * 0.025); if (d0 < 0 || d0 > 0.22) continue; const b = i / 6 * TAU + 0.3, px = H.sx(sx0 + Math.cos(b) * R * 0.78), py = H.sy(sy0 + Math.sin(b) * R * 0.78); K.skyBolt(c, px, py, T2 * 3.2, K.seed(t, i + 90), 2.2, 1 - d0 / 0.22, { gold: true }); }
          const d1 = t - (DET + 0.25); if (d1 > 0 && d1 < 0.3) { const k = 1 - d1 / 0.3, qx = H.sx(me.x), qy = H.sy(me.y) - T2 * 0.5;
            echoes.forEach((E, i) => K.arc(c, H.sx(E.x), H.sy(E.y) - T2 * 0.45 * E.sc, qx, qy, K.seed(t, i + 70), 2, k, { forks: 1, gold: true, jit: T2 * 0.25 })); } }
      } });
  };

  /* ===================== LI-S09 Capacitor Crush =====================
     Charged plates of translucent blue light stand on either side of the target: a glassy face crossed by circuit
     lines with glowing nodes, a bright frame, a violet edge for thickness, a charge level rising inside. Arcs jump between
     them as they close, each volley a small hit; they clap together in a white discharge and break into dim geometric
     sparks (spinning outlines of triangles, squares and diamonds) over a fading violet print.
     Level 1: two plates, four volleys. Level 4: four plates closing from both axes, five volleys of more arcs.
     Level 7: gold-framed plates, six volleys, and a golden octagram sigil turns on the floor after the clap. */
  function plate(c, K, H, X, Y, nx, ny, hw, hh, z, a, t, charge, gold, T, yaw) {
    if (!(a > 0.01)) return; const P = K.P, cy0 = Math.cos(yaw || 0), sy0 = Math.sin(yaw || 0), tx = (-ny * cy0 - nx * sy0) * hw, ty = (nx * cy0 - ny * sy0) * hw, base = [X, Y - z], th = [-nx * T * 0.1, -ny * T * 0.1];
    const q = (u, v) => [base[0] + tx * u, base[1] + ty * u - hh * v];   // u -1..1 across, v 0..1 up
    const quad = [q(-1, 0), q(1, 0), q(1, 1), q(-1, 1)], back = quad.map(p => [p[0] + th[0], p[1] + th[1]]);
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round';
    K.glow(c, X, Y - z - hh * 0.5, Math.max(hw, hh) * 1.4, gold ? P.gold : P.blue, 0.28 * a);
    // the thickness: a violet back face and edges
    H.poly(c, back); c.globalAlpha = 0.22 * a; c.fillStyle = P.deep; c.fill(); c.globalAlpha = 0.6 * a; c.strokeStyle = P.violet; c.lineWidth = 2; c.stroke();
    c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(quad[i][0], quad[i][1]); c.lineTo(back[i][0], back[i][1]); } c.stroke();
    // the glassy face: a tint, brighter toward the top, the charge level filling from the floor
    H.poly(c, quad); c.globalAlpha = 0.16 * a; c.fillStyle = P.cyan; c.fill();
    const lv = cl(charge, 0, 1); if (lv > 0.02) { H.poly(c, [q(-1, 0), q(1, 0), q(1, lv * 0.92), q(-1, lv * 0.92)]); c.globalAlpha = (0.18 + 0.12 * Math.sin(t * 30)) * a; c.fillStyle = gold ? P.gold : P.blue; c.fill(); }
    H.poly(c, [q(-1, 0.72), q(1, 0.72), q(1, 1), q(-1, 1)]); c.globalAlpha = 0.1 * a; c.fillStyle = gold ? P.gold : P.white; c.fill();
    // circuit lines and their nodes
    c.globalAlpha = 0.55 * a; c.strokeStyle = P.ice; c.lineWidth = 1; c.beginPath();
    for (const v of [0.3, 0.55, 0.8]) { const p0 = q(-0.8, v), p1 = q(0.8, v); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); }
    for (const u of [-0.45, 0.2, 0.6]) { const p0 = q(u, 0.12), p1 = q(u, 0.88); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); } c.stroke();
    for (const [u, v] of [[-0.45, 0.3], [0.2, 0.55], [0.6, 0.8], [-0.45, 0.8], [0.6, 0.3]]) { const p = q(u, v), fl = 0.5 + 0.5 * Math.sin(t * 18 + u * 9 + v * 7); c.globalAlpha = (0.5 + 0.5 * fl) * a; blitSized(c, glowSprite(gold ? P.gold : P.cyan), p[0] - 5, p[1] - 5, 10, 10); c.fillStyle = P.white; c.fillRect(p[0] - 1, p[1] - 1, 2, 2); }
    // the frame: violet haze, cyan, white edge; a bright top edge and corner sparks
    H.poly(c, quad); c.globalAlpha = 0.35 * a; c.strokeStyle = P.violet; c.lineWidth = 5; c.stroke(); c.globalAlpha = 0.9 * a; c.strokeStyle = gold ? P.gold : P.cyan; c.lineWidth = 2; c.stroke(); c.globalAlpha = gold ? 0.6 * a : a; c.strokeStyle = P.white; c.lineWidth = 0.9; c.stroke();
    c.restore(); for (const p of quad) node(c, K, p[0], p[1], 2.2, 0.8 * a, gold);
  }
  S.capacitor = (C, H) => {
    const K = TK.bind(H), P = K.P, e = K.evo(C), x = C.tx, y = C.ty, a = C.a, gold = e >= 7, NP = e >= 4 ? 4 : 2, NV = K.lv(C, [4, 5, 6]), NA = K.lv(C, [2, 3, 4]), dk = C.base * C.K * K.evoK(C);
    const YAW = 0.95, APP = 0.25, CLAP = 1.0, D0 = 1.75, D1 = NP === 4 ? 0.42 : 0.22, END = CLAP + 1.0, VT = []; for (let i = 0; i < NV; i++) VT.push(APP + 0.08 + (CLAP - APP - 0.14) * i / (NV - 1));
    const axes = [[1, 0]]; if (NP === 4) axes.push([0, 1]);   // (left and right of the target, turned to face the viewer; from Adept also behind and in front)
    H.warn(x, y, 1.4, CLAP, C.col); H.X.sfx.hum();
    const gap = t => t < APP ? D0 : t >= CLAP ? D1 : D0 + (D1 - D0) * H.ease.in(cl((t - APP) / (CLAP - APP), 0, 1));
    const geo = [];   // the geometric sparks after the clap: x, y (screen offsets in tiles), z, velocities, spin, sides
    VT.forEach((t0, i) => H.X.after(t0, () => { H.hitArea(x, y, 1.25, dk * 1.4 / NV, C.dmgO({ stun: 0.1 })); K.sparks(x, y - 0.5, 6, 5); H.X.light(x, y, 1.6, 0.12); H.X.sfx.crack(); if (gold && i % 2) K.goldSparks(x, y - 0.5, 4, 4); }));
    H.X.after(CLAP, () => { H.hitArea(x, y, 1.45, dk * 1.4, C.dmgO({ kb: 2, stun: 0.45 })); H.X.flash(0.09, P.ice); H.X.shake(7, 0.16); H.X.hitstop(0.045); H.X.sfx.crash(); H.X.light(x, y, 3, 0.3); K.sparks(x, y - 0.5, 20, 9); K.motes(x, y - 0.5, 10); if (gold) K.goldSparks(x, y - 0.6, 18, 8);
      const n = H.n(K.lv(C, [10, 14, 20])); for (let i = 0; i < n; i++) { const b = Math.random() * TAU, v = 1.8 + Math.random() * 2.6; geo.push({ x: 0, y: 0, z: 0.5 + Math.random() * 0.4, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 2 + Math.random() * 3, r: 0.08 + Math.random() * 0.09, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, sides: 3 + (i % 3), life: 0.6 + Math.random() * 0.4, gold: gold && i % 3 === 0 }); } });
    H.add({ life: END, x, y,
      update(dt, f) { if (f.t < CLAP) for (const ax of axes) for (const s of [-1, 1]) { const g = gap(f.t); K.aura(x + ax[0] * s * g, y + ax[1] * s * g - 0.6, 0.35, dt, 6, 0); }
        for (const p of geo) { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 9 * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; } p.rot += p.vr * dt; p.life -= dt; } },
      drawUnder(c, f, X, Y, T) { const t = f.t, ap = cl(t / APP, 0, 1);
        if (t < CLAP + 0.1) { K.floorLight(c, X, Y, T * (1.2 + 0.6 * cl((t - APP) / (CLAP - APP), 0, 1)), 0.4 * ap, P.blue); for (const ax of axes) for (const s of [-1, 1]) { const g = gap(t); K.floorLight(c, X + ax[0] * s * g * T, Y + ax[1] * s * g * T, T * 0.9, 0.35 * ap, gold ? P.gold : P.cyan); } }
        if (t >= CLAP) { const u = cl((t - CLAP) / 0.35, 0, 1), fa = cl((END - t) / 0.6, 0, 1);
          floorRing(c, K, H, X, Y, T * 1.6 * H.ease.out(u), (1 - u) * 0.95, gold); K.floorLight(c, X, Y, T * 1.8, 0.5 * (1 - u) + 0.2 * fa, P.violet);
          // a square print of light where the plates met (an octagram at Celestial), fading
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; const rr = T * (gold ? 1.25 : 0.9) * (0.7 + 0.3 * H.ease.out(u)), nsq = gold ? 2 : 1, rot0 = (gold ? (t - CLAP) * 0.8 : 0);
          for (let k = 0; k < nsq; k++) { c.beginPath(); for (let i = 0; i < 4; i++) { const b = rot0 + k * Math.PI / 4 + i * Math.PI / 2 + Math.PI / 4, px = X + Math.cos(b) * rr, py = Y + Math.sin(b) * rr * 0.6; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath();
            c.globalAlpha = 0.4 * fa; c.strokeStyle = P.violet; c.lineWidth = 5; c.stroke(); c.globalAlpha = 0.8 * fa; c.strokeStyle = gold ? P.gold : P.ice; c.lineWidth = 1.5; c.stroke(); }
          if (gold) { c.beginPath(); H.floorEllipse(c, X, Y, rr * 1.08, rr * 0.65); c.globalAlpha = 0.6 * fa; c.strokeStyle = P.gold; c.lineWidth = 1.2; c.stroke(); }
          c.restore(); }
      },
      draw(c, f, X, Y, T) { const t = f.t, ap = H.ease.back(cl(t / APP, 0, 1)), hw = T * 0.62, hh = T * 1.0 * Math.max(0.05, ap), z = T * 0.12, g = gap(t), k = t < CLAP ? 1 : 0;
        if (k) { const plates = []; for (const ax of axes) for (const s of [-1, 1]) plates.push({ ax, s, px: X + ax[0] * s * g * T, py: Y + ax[1] * s * g * T });
          // plates near the pet go translucent so it stays in view
          const pX = H.sx(H.me.x), pY = H.sy(H.me.y);
          plates.sort((p, q) => p.py - q.py);
          const charge = cl((t - APP) / (CLAP - APP), 0, 1), back = plates.filter(p => p.py <= Y + 1), front = plates.filter(p => p.py > Y + 1);
          const drawP = p => { const near = Math.hypot(p.px - pX, p.py - pY) < T * 1.0 ? 0.45 : 1; plate(c, K, H, p.px, p.py, -p.ax[0] * p.s, -p.ax[1] * p.s, hw, hh, z, ap > 0 ? Math.min(1, t / 0.08) * near * (p.ax[1] && p.s > 0 ? 0.7 : 1) : 0, t, charge, gold, T, p.ax[0] ? YAW * p.s : 0); };
          back.forEach(drawP);
          // the arcs between facing plates: a thin constant one, and a volley of bright ones at each hit
          const vol = VT.some(t0 => t > t0 - 0.01 && t < t0 + 0.12), list = [], hot = [];
          for (const ax of axes) { const p0 = [X - ax[0] * g * T, Y - ax[1] * g * T], p1 = [X + ax[0] * g * T, Y + ax[1] * g * T];
            for (let i = 0; i < (vol ? NA : 1); i++) { const v = vol ? 0.2 + 0.6 * (NA > 1 ? i / (NA - 1) : 0.5) : 0.5 + 0.25 * Math.sin(t * 9), hgt = z + hh * v; (vol ? hot : list).push(K.path(p0[0], p0[1] - hgt, p1[0], p1[1] - hgt, K.seed(t, i + (ax === axes[0] ? 0 : 9), 24), T * (vol ? 0.28 : 0.15), Math.max(4, Math.ceil(g * T / 9)))); } }
          if (NP === 4 && vol) for (let i = 0; i < 4; i++) { const b0 = i * Math.PI / 2, b1 = b0 + Math.PI / 2, hgt = z + hh * 0.6; hot.push(K.path(X + Math.cos(b0) * g * T, Y + Math.sin(b0) * g * T - hgt, X + Math.cos(b1) * g * T, Y + Math.sin(b1) * g * T - hgt, K.seed(t, i + 30, 24), T * 0.2, 6)); }
          multiBolt(c, K, list, 1.3, 0.75 * Math.min(1, t / APP), gold); multiBolt(c, K, hot, NP === 4 ? 1.9 : 2.5, 0.9, gold);
          if (vol) K.glow(c, X, Y - z - hh * 0.5, T * 1.3, P.cyan, 0.3);
          K.glow(c, X, Y - z - hh * 0.5, T * (0.3 + 0.5 * charge), P.white, 0.25 + 0.25 * charge);
          front.forEach(drawP); }
        else { const u = cl((t - CLAP) / 0.22, 0, 1), cy = Y - z - T * 0.5;
          if (u < 1) { K.glow(c, X, cy, T * (1 + 2 * u), P.white, 0.9 * (1 - u)); K.glow(c, X, cy, T * 2.6 * (0.5 + u), gold ? P.gold : P.cyan, 0.6 * (1 - u)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * (1 - u); blitSized(c, glowSprite(P.ice), X - T * 0.35, cy - T * 2.5, T * 0.7, T * 3.2); c.restore(); }
          // the dim geometric sparks: spinning outlines
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; const bins = [[], []];
          for (const p of geo) { if (p.life <= 0) continue; bins[p.gold ? 1 : 0].push(p); }
          bins.forEach((bin, bi) => { if (!bin.length) return; for (const pass of [0, 1]) { c.beginPath(); for (const p of bin) { const px = X + p.x * T, py = Y + p.y * T - p.z * T, r = p.r * T; for (let i = 0; i <= p.sides; i++) { const b = p.rot + i / p.sides * TAU; i ? c.lineTo(px + Math.cos(b) * r, py + Math.sin(b) * r * 0.8) : c.moveTo(px + Math.cos(b) * r, py + Math.sin(b) * r * 0.8); } }
            const la = Math.min(1, bin.reduce((s2, p) => s2 + p.life, 0) / bin.length * 1.6); c.globalAlpha = (pass ? 0.75 : 0.35) * la; c.strokeStyle = pass ? (bi ? P.gold : P.ice) : P.violet; c.lineWidth = pass ? 1.2 : 3.5; c.stroke(); } });
          for (const p of geo) if (p.life > 0) K.glow(c, X + p.x * T, Y + p.y * T - p.z * T, p.r * T * 2.2, p.gold ? P.gold : P.blue, 0.3 * Math.min(1, p.life * 2));
          c.restore(); }
      } });
  };

  /* ===================== LI-S10 Stormthread Volley =====================
     Faceted needles of light materialise in an arc ahead of the pet, each tied to it by a thin wavering thread along
     which beads of charge run out; they fire one by one (outer pairs first) as plasma streaks, their threads snapping
     into jagged bolts that leave fading violet lines; the last, centre needle leaves a branching star on its target.
     Level 1: four needles, a six-ray star. Level 4: six needles, an eight-ray star with a shock ring.
     Level 7: eight needles, the last a larger golden one, a twelve-ray star with golden rays and a golden star sigil. */
  function needle(c, K, x, y, ang, len, wd, a, gold) {
    if (!(a > 0.01)) return; const P = K.P, ca = Math.cos(ang), sa = Math.sin(ang), pt = (u, v) => [x + ca * u * len - sa * v * wd, y + sa * u * len + ca * v * wd];
    K.glow(c, x + ca * len * 0.2, y + sa * len * 0.2, len * 0.9, gold ? P.gold : P.blue, 0.45 * a);
    c.save(); c.globalAlpha = a; c.lineJoin = 'round';
    const tip = pt(0.62, 0), tail = pt(-0.45, 0), up = pt(0.05, -1), dn = pt(0.05, 1), mid = pt(0.08, 0);
    // two facets: a lit upper one, a deeper lower one, glassy and luminous
    H_poly(c, [tail, up, tip, mid]); c.fillStyle = gold ? 'rgba(255,226,150,0.85)' : 'rgba(170,236,255,0.85)'; c.fill();
    H_poly(c, [tail, mid, tip, dn]); c.fillStyle = gold ? 'rgba(214,150,40,0.85)' : 'rgba(74,92,220,0.85)'; c.fill();
    c.globalCompositeOperation = 'lighter'; H_poly(c, [tail, up, tip, dn]); c.strokeStyle = gold ? P.gold : P.cyan; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = P.white; c.lineWidth = 1; c.beginPath(); c.moveTo(tail[0], tail[1]); c.lineTo(tip[0], tip[1]); c.stroke(); c.restore();
    node(c, K, tip[0], tip[1], Math.max(1.5, wd * 0.5), a, gold);
  }
  function H_poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  S.stormthread = (C, H) => {
    const K = TK.bind(H), P = K.P, e = K.evo(C), me = H.me, a = C.a, dir = [Math.cos(a), Math.sin(a)], per = [-dir[1], dir[0]], gold = e >= 7, N = K.lv(C, [4, 6, 8]), NR = K.lv(C, [6, 8, 12]), dk = C.base * C.K * K.evoK(C);
    const T0 = 0.48, GAP = N > 6 ? 0.075 : 0.09, sp = N > 6 ? 0.42 : N > 4 ? 0.5 : 0.62, nd = [];
    for (let i = 0; i < N; i++) { const o = (i - (N - 1) / 2) * sp; nd.push({ o, f: 1.45 + (1 - Math.cos(o / (sp * N) * 2.4)) * 0.25 - Math.abs(o) * 0.1, z: 1.0 + 0.18 * ((i % 2) ? 1 : -1) * 0.5, app: 0.05 + Math.abs(o) * 0.06, fired: -1, big: 0 }); }
    // the firing order: outer pairs inward, the centre needle last (the big golden one at Celestial)
    const order = nd.slice().sort((p, q) => Math.abs(q.o) - Math.abs(p.o)); const last = order[order.length - 1]; last.big = 1; last.z = 1.15;
    const wpos = n2 => [me.x + dir[0] * n2.f + per[0] * n2.o, me.y + dir[1] * n2.f + per[1] * n2.o];
    H.X.sfx.hum(); me.sq = 0.75;
    const shots = [], star = { t: -1, x: 0, y: 0, rays: null };
    const F = H.add({ life: T0 + N * GAP + 1.2,
      update(dt, f) {
        for (const n2 of nd) if (n2.fired < 0 && f.t > n2.app) { const p = wpos(n2); if (Math.random() < dt * 8 * H.Q()) K.sparks(p[0], p[1] - n2.z, 1, 2, { up: 0.5, life: 0.3 }); }
        for (const s of shots) { if (s.done) continue; s.u = Math.min(1, s.u + dt / s.dur); const px = lerp(s.x0, s.x1, s.u), py = lerp(s.y0, s.y1, s.u); s.hist.push([px, py, lerp(s.z0, 0.35, s.u)]); if (s.hist.length > 7) s.hist.shift();
          if (s.u >= 1) { s.done = 1; s.t1 = f.t; s.hit(); } }
      },
      drawUnder(c, f, X0, Y0, T) { const t = f.t;
        // what the shots leave on the floor: violet lines along their routes
        for (const s of shots) if (s.done && s.scar) multiScar(c, K, [s.scar.map(p => [H.sx(p[0]), H.sy(p[1])])], cl(1 - (t - s.t1) / 0.6, 0, 1), 2);
        if (star.t >= 0) { const d = t - star.t, X = H.sx(star.x), Y = H.sy(star.y), u = cl(d / 0.18, 0, 1), fa = cl(1 - (d - 0.25) / 0.6, 0, 1);
          K.floorLight(c, X, Y, T * 2, 0.6 * fa, gold ? P.gold : P.cyan);
          if (!star.rays) { star.rays = []; for (let i = 0; i < NR; i++) { const b = i / NR * TAU + a, L2 = T * (i % 2 ? 1.05 : 1.55) * (gold && i % 2 === 0 ? 1.15 : 1); star.rays.push({ b, L2, s: Math.random() * 99 }); } }
          const list = [], gl = [], sc = [];
          for (const r of star.rays) { const L2 = r.L2 * H.ease.out(u), x1 = X + Math.cos(r.b) * L2, y1 = Y + Math.sin(r.b) * L2 * 0.8, pts = K.path(X, Y, x1, y1, d < 0.25 ? K.seed(t, r.s, 20) : r.s, L2 * 0.12, 6);
            if (d < 0.28) { (gold && r.L2 > T * 1.6 ? gl : list).push(pts); const p = pts[Math.floor(pts.length / 2)], b2 = r.b + 0.6; list.push(K.path(p[0], p[1], p[0] + Math.cos(b2) * L2 * 0.3, p[1] + Math.sin(b2) * L2 * 0.24, r.s + 5, 4, 3)); } else sc.push(pts); }
          multiBolt(c, K, list, 2.2, 1, false); multiBolt(c, K, gl, 2.6, 1, true); if (sc.length) multiScar(c, K, sc, fa, 2.6);
          if (e >= 4) floorRing(c, K, H, X, Y, T * 1.4 * H.ease.out(cl(d / 0.35, 0, 1)), 0.9 * (1 - cl(d / 0.35, 0, 1)), gold, T * 1.4 * 0.8 * H.ease.out(cl(d / 0.35, 0, 1)));
          if (gold) { c.save(); c.globalCompositeOperation = 'lighter'; const rr = T * 1.2 * H.ease.out(u); c.beginPath(); for (let i = 0; i <= 16; i++) { const b = i / 16 * TAU + a + d * 0.6, r2 = i % 2 ? rr * 0.45 : rr; i ? c.lineTo(X + Math.cos(b) * r2, Y + Math.sin(b) * r2 * 0.8) : c.moveTo(X + Math.cos(b) * r2, Y + Math.sin(b) * r2 * 0.8); }
            c.globalAlpha = 0.14 * fa; c.fillStyle = P.gold; c.fill(); c.globalAlpha = 0.8 * fa; c.strokeStyle = P.gold; c.lineWidth = 1.5; c.stroke(); c.restore(); } }
      },
      draw(c, f, X0, Y0, T) { const t = f.t, pX = H.sx(me.x), pY = H.sy(me.y) - T * 0.55, threads = [], snaps = [];
        for (const n2 of nd) { const ap = cl((t - n2.app) / 0.2, 0, 1); if (ap <= 0) continue; const w = wpos(n2), nx = H.sx(w[0]), ny = H.sy(w[1]) - n2.z * T;
          const sinceF = n2.fired >= 0 ? t - n2.fired : -1; if (sinceF > 0.16) continue;
          // the thread: from the pet's edge to the needle, a gentle wave (it grows out with the needle)
          const dx = nx - pX, dy = ny - pY, d = Math.hypot(dx, dy) || 1, sx2 = pX + dx / d * T * 0.38, sy2 = pY + dy / d * T * 0.38;
          if (sinceF < 0) { const pts = [], m = 10; for (let i = 0; i <= m; i++) { const u = i / m * ap, wv = Math.sin(u * Math.PI) * Math.sin(t * 9 + i * 0.9 + n2.o * 3) * T * 0.06; pts.push([lerp(sx2, nx, u) - dy / d * wv, lerp(sy2, ny, u) + dx / d * wv]); } threads.push(pts);
            // beads of charge running out along it
            if (t > 0.2) { const bu = (((t * 1.8 + n2.o) % 1) + 1) % 1, bp = pts[Math.min(m, Math.round(bu * m))]; node(c, K, bp[0], bp[1], 1.6, 0.8 * ap, gold); } }
          else snaps.push(K.path(sx2, sy2, nx, ny, K.seed(t, n2.o * 7 + 3, 30), T * 0.3, 8));
          // the needle hovering, aimed at the way it will fire; shrinking into its shot as it goes
          const aim = n2.aim != null ? n2.aim : Math.atan2(dir[1], dir[0]), ka = sinceF < 0 ? ap : 1 - sinceF / 0.16, big = n2.big && gold ? 1.35 : n2.big ? 1.15 : 1;
          needle(c, K, nx, ny + Math.sin(t * 6 + n2.o * 4) * 2, aim, T * 0.8 * big * (0.4 + 0.6 * ap), T * 0.13 * big, ka, gold && n2.big);
          K.floorLight(c, H.sx(w[0]), H.sy(w[1]), T * 0.5, 0.25 * ka, gold && n2.big ? P.gold : P.blue); }
        multiBolt(c, K, threads, 0.9, 0.55, false); multiBolt(c, K, snaps, 2.2, 1, gold);
        // the shots in flight and the jagged bolts their routes become
        for (const s of shots) { const big = s.big;
          if (!s.done) { const pts = s.hist.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]); streak(c, K, pts, T * (big ? 0.26 : 0.18), 1, s.gold); const hd = pts[pts.length - 1]; if (hd) { K.glow(c, hd[0], hd[1], T * 0.6, s.gold ? P.gold : P.cyan, 0.7); node(c, K, hd[0], hd[1], 2.5, 1, s.gold); } }
          const ds = s.done ? t - s.t1 : -1; if (s.done && ds < 0.2) { const x0 = H.sx(s.x0), y0 = H.sy(s.y0) - s.z0 * T, x1 = H.sx(s.x1), y1 = H.sy(s.y1) - T * 0.35; K.arc(c, x0, y0, x1, y1, K.seed(t, s.k + 50), big ? 3 : 2, 1 - ds / 0.2, { forks: big ? 3 : 1, gold: s.gold }); K.glow(c, x1, y1, T * (big ? 1.4 : 0.8), s.gold ? P.gold : P.cyan, 0.7 * (1 - ds / 0.2)); }
        }
      } });
    const picks = () => { const c0 = wpos(last), all = H.sortNear(c0[0], c0[1]).filter(m => Math.hypot(m.x - c0[0], m.y - c0[1]) < 6.5), ahead = all.filter(m => (m.x - me.x) * dir[0] + (m.y - me.y) * dir[1] > 0.2); return ahead.length ? ahead : all; };   // (monsters ahead of the pet first)
    order.forEach((n2, i) => H.X.after(T0 + i * GAP, () => { const list = picks(), isLast = n2 === last, m = list.length ? (isLast ? list[0] : list[i % list.length]) : null, p = wpos(n2), tx = m ? m.x : p[0] + dir[0] * 4.5, ty = m ? m.y : p[1] + dir[1] * 4.5;
      n2.fired = F.t; n2.aim = Math.atan2(H.sy(ty) - H.sy(p[1]) + n2.z * H.X.Tz(), H.sx(tx) - H.sx(p[0]));
      const s = { k: i, x0: p[0], y0: p[1], z0: n2.z, x1: tx, y1: ty, u: 0, dur: isLast ? 0.11 : 0.08, hist: [[p[0], p[1], n2.z]], big: isLast, gold: gold && isLast, done: 0 };
      s.scar = K.path(p[0], p[1], tx, ty, Math.random() * 99, 0.18, 8).map(q => q);   // (world units: a jagged line on the floor beneath the route)
      s.hit = () => { const b = Math.atan2(ty - p[1], tx - p[0]), d = Math.hypot(tx - p[0], ty - p[1]);
        H.hitLine(p[0], p[1], b, d + 0.3, 0.7, isLast ? dk * 0.7 : dk * 1.6 / (N - 1), C.dmgO({ kb: isLast ? 3 : 1, stun: isLast ? 0.3 : 0.05 })); K.sparks(tx, ty - 0.35, isLast ? 14 : 6, isLast ? 8 : 5); H.X.light(tx, ty, isLast ? 2.4 : 1.3, 0.14);
        if (isLast) { H.hitArea(tx, ty, 1.4, dk * 0.5, C.dmgO({ stun: 0.2 })); star.t = F.t; star.x = tx; star.y = ty; K.motes(tx, ty - 0.3, 10); H.X.flash(0.06, P.ice); H.X.shake(5, 0.14); H.X.hitstop(0.035); H.X.sfx.crash(); if (gold) K.goldSparks(tx, ty - 0.4, 18, 8); } else H.X.sfx.crack(); };
      shots.push(s); H.X.sfx.whoosh(); }));
  };
})();
