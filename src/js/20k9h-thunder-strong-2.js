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
     (twice in the larger bursts) and join into a ring network; one white pulse runs out through the network and strikes
     as it passes; the branches go out from the tips inward and leave fading violet lines. As the pet evolves the blossom
     bursts again from the same point, each burst wider, with more branches and brighter, overlapping the fading one.
     Stages 1-3: one burst (5 branches, radius 2.7). Stages 4-6: two (6 then 8 branches, the second dividing twice, with
     crawling arcs on its pulse). Stage 7: three (6, 8, 10 branches, radius 2.4 / 3.0 / 3.7), the third golden, with a
     golden lotus opening on the floor. Damage: the stage's total (x1.08 from Adept, x1.15 at Celestial) split 45/55 or
     25/30/45 over the bursts. */
  S.staticblossom = (C, H) => {
    const K = TK.bind(H), e = K.evo(C), tot = C.base * 2.5 * C.K * K.evoK(C) * (e >= 7 ? 1.15 : e >= 4 ? 1.08 : 1);
    const plan = e >= 7 ? [{ R: 2.4, NB: 6, D: 1, k: 0.25, br: 0.8 }, { R: 3.0, NB: 8, D: 2, k: 0.3, br: 0.95, arcs: 4 }, { R: 3.7, NB: 10, D: 2, k: 0.45, br: 1.15, arcs: 7, gold: 1, lotus: 1 }]
      : e >= 4 ? [{ R: 2.6, NB: 6, D: 1, k: 0.45, br: 0.9 }, { R: 3.2, NB: 8, D: 2, k: 0.55, br: 1.05, arcs: 5 }] : [{ R: 2.7, NB: 5, D: 1, k: 1, br: 1 }];
    let d = 0; plan.forEach((o, i) => { o.d = d; o.first = i === 0; o.last = i === plan.length - 1; o.dmg = tot * o.k; const TB = o.first ? 0.3 : 0.12; d += TB + 0.52 + 0.15; blossomBurst(C, H, K, o); });
  };
  /* one burst of the blossom: o = { d (delay), R, NB, D (fork depth), dmg, br (brightness), arcs, gold, lotus, first, last } */
  function blossomBurst(C, H, K, o) {
    const P = K.P, x = C.tx, y = C.ty, NB = o.NB, DEPTH = o.D, R = o.R, gold = !!o.gold, br = o.br, DL = o.d;
    const T_B = o.first ? 0.3 : 0.12, PULSE = T_B + 0.52, PD = 0.26 + 0.03 * R, OUT = PULSE + PD, END = OUT + (o.last ? 0.95 : 0.7), dmg = o.dmg;
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
    if (DL > 0) H.X.after(DL, () => { H.warn(x, y, R, PULSE, C.col); H.X.sfx.hum(); }); else { H.warn(x, y, R, PULSE, C.col); H.X.sfx.hum(); }
    H.add({ life: END + DL, t: -DL, x, y, hit: new Set(), fired: 0,
      update(dt, f) { if (f.t < 0) return;
        if (f.t < PULSE) { K.aura(x, y - 0.35, 0.25 + 0.3 * f.t, dt, 14, 0); if (f.t < T_B + 0.3 && Math.random() < dt * 12) converge(H, K, x, y, 1.6, 2, 0.35, 0.35); }
        if (f.t >= PULSE && !f.fired) { f.fired = 1; H.X.flash(0.05 + 0.03 * br, gold ? P.gold : P.ice); H.X.shake(3 + 3 * br, 0.14); H.X.sfx.crack(); H.X.hitstop(0.03); K.sparks(x, y - 0.3, 16, 8); K.motes(x, y - 0.2, 10); H.X.light(x, y, R * 1.3, 0.25); if (gold) K.goldSparks(x, y - 0.3, 14, 7); }
        if (f.t >= PULSE && f.t < OUT + 0.05) { const rp = R * 1.03 * H.ease.out(cl((f.t - PULSE) / PD, 0, 1));
          for (const m of H.near(x, y, R)) { if (f.hit.has(m) || Math.hypot(m.x - x, m.y - y) > rp + m.r) continue; f.hit.add(m); H.X.hitMon(m, dmg, C.dmgO({ kb: 1.5, stun: m.boss ? 0.15 : 0.35 })); K.sparks(m.x, m.y - 0.3, 8, 6); K.motes(m.x, m.y - 0.3, 4); H.X.light(m.x, m.y, 1.4, 0.12); if (gold) K.goldSparks(m.x, m.y - 0.3, 5, 5); }
          if (Math.random() < dt * 30 * H.Q()) { const b = Math.random() * TAU; K.sparks(x + Math.cos(b) * rp, y + Math.sin(b) * rp, 1, 3, { up: 2, life: 0.4 }); } }
        if (o.lotus && f.t > OUT && f.t < OUT + 0.4 && Math.random() < dt * 25 * H.Q()) { const b = Math.random() * TAU, r = Math.random() * R * 0.5; K.goldSparks(x + Math.cos(b) * r, y + Math.sin(b) * r, 1, 3); }
      },
      drawUnder(c, f, X, Y, T) { if (f.t < 0) return;
        const t = f.t, hz = t < OUT ? 8 : 4, rp = t >= PULSE ? R * 1.03 * H.ease.out(cl((t - PULSE) / PD, 0, 1)) : -1, S2 = (o) => [X + o[0] * T, Y + o[1] * T];
        const build = cl(t / T_B, 0, 1), fadeAll = cl((END - t) / 0.5, 0, 1);
        // the floor: light pooled under the seed, the network's glow while it lives, and the pulse ring
        K.floorLight(c, X, Y, T * (0.8 + 1.4 * build), 0.5 * build * fadeAll * br, P.blue);
        if (t > T_B) K.floorLight(c, X, Y, T * R * 1.15, 0.35 * cl((t - T_B) / 0.4, 0, 1) * cl((OUT + 0.4 - t) / 0.5, 0, 1), P.violet);
        if (t < PULSE) { const k = build * (0.6 + 0.4 * Math.sin(t * 22)); floorRing(c, K, H, X, Y, T * (0.35 + 0.15 * build), 0.6 * k, gold); }
        // the branches by level; a level goes dark from the tips inward after the pulse, its violet line lingering
        const byLv = []; for (let l = 0; l <= MAXLV; l++) byLv.push([]);
        const outA = l => { const d0 = OUT + 0.05 + (MAXLV - l) * 0.06; return cl(1 - (t - d0) / 0.22, 0, 1); };
        for (const s of segs) { const g = cl((t - s.g0) / (s.g1 - s.g0), 0, 1); if (g <= 0) continue; const ge = H.ease.out(g), a = S2(s.a), b0 = S2(s.b), b = [lerp(a[0], b0[0], ge), lerp(a[1], b0[1], ge)], Lp = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (Lp < 2) continue; s.pts = K.path(a[0], a[1], b[0], b[1], K.seed(t, s.k, hz) + sd, Math.min(T * 0.14, Lp * (s.link ? 0.07 : 0.12)), Math.max(3, Math.ceil(Lp / 11))); byLv[s.lv].push(s.pts); s.grown = g; }
        const W = [2.6, 1.7, 1.25, 1.15, 1.25];
        for (let l = 0; l <= MAXLV; l++) { const oa = outA(l); if (oa > 0) multiBolt(c, K, byLv[l], W[l] * T / 40 * (0.85 + 0.2 * br), 0.95 * oa * br, gold && l === 3); else if (t < END) multiScar(c, K, byLv[l], 0.8 * fadeAll * cl((t - OUT) / 0.2, 0, 1), W[l] * T / 40 * 1.4); }
        // nodes where branches divide, and the tips (gold at Celestial), brightening as the pulse arrives
        for (const s of segs) { if (s.link || !(s.grown >= 1) || !s.pts) continue; const p = s.pts[s.pts.length - 1], hot = rp >= 0 ? cl(1 - Math.abs(rp - s.r1 * 1) / 0.6, 0, 1) : 0, oa = outA(s.lv); if (oa <= 0) continue;
          node(c, K, p[0], p[1], T * (s.lv === 0 ? 0.07 : 0.05) * (1 + hot * 1.4), (0.55 + 0.45 * hot) * oa, gold && s.r1 > R * 0.9); }
        // the pulse: a white-hot front running out along every branch, and a floor ring at its radius
        if (rp >= 0 && t < OUT + 0.12) { const hotList = []; for (const s of segs) { if (!s.pts) continue; const lo = Math.min(s.r0, s.r1), hi = Math.max(s.r0, s.r1); if (rp > lo - 0.1 && rp < hi + 0.45) hotList.push(s.pts); }
          const pa = cl((OUT + 0.12 - t) / 0.2, 0, 1); multiBolt(c, K, hotList, T / 16 * (0.85 + 0.2 * br), 1.1 * pa * br, gold); floorRing(c, K, H, X, Y, rp * T, 0.9 * pa, gold);
          if (o.arcs) for (let i = 0; i < o.arcs; i++) { const b0 = i / o.arcs * TAU + t * 3, b1 = b0 + 0.45; K.arc(c, X + Math.cos(b0) * rp * T, Y + Math.sin(b0) * rp * T, X + Math.cos(b1) * rp * T, Y + Math.sin(b1) * rp * T, K.seed(t, i + 40), 1.3, 0.8 * pa, { forks: 0, jit: T * 0.2, gold }); }
          K.floorLight(c, X, Y, rp * T * 1.1, 0.35 * pa, gold ? P.gold : P.cyan); }
        // Celestial: a golden lotus opens on the floor where the seed went in
        if (o.lotus && t > PULSE + 0.05) { const u = cl((t - PULSE - 0.05) / 0.45, 0, 1), la = cl((END - t) / 0.6, 0, 1) * Math.min(1, u * 3), rr = T * R * 0.55 * H.ease.out(u);
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; for (let pass = 0; pass < 2; pass++) { c.beginPath(); const np = 8, rot = t * 0.4 + pass * TAU / 16, R2 = rr * (pass ? 0.62 : 1);
            for (let i = 0; i < np; i++) { const b = rot + i / np * TAU, bw = 0.32, tx2 = X + Math.cos(b) * R2, ty2 = Y + Math.sin(b) * R2; c.moveTo(X, Y); c.quadraticCurveTo(X + Math.cos(b - bw) * R2 * 0.75, Y + Math.sin(b - bw) * R2 * 0.75, tx2, ty2); c.quadraticCurveTo(X + Math.cos(b + bw) * R2 * 0.75, Y + Math.sin(b + bw) * R2 * 0.75, X, Y); }
            c.globalAlpha = 0.16 * la; c.fillStyle = P.gold; c.fill(); c.globalAlpha = 0.35 * la; c.strokeStyle = P.amber; c.lineWidth = 4; c.stroke(); c.globalAlpha = 0.85 * la; c.strokeStyle = pass ? P.white : P.gold; c.lineWidth = 1.4; c.stroke(); }
          c.restore(); K.glow(c, X, Y, rr * 0.6, P.gold, 0.5 * la); }
      },
      draw(c, f, X, Y, T) {
        // the charged seed hovering over the aim (the first burst): it grows with the buildup, filaments turning round it,
        // then dives into the floor; a later burst re-kindles it as a quick flare that drops straight in
        const t = f.t; if (t < 0 || t > PULSE + 0.18) return; const build = H.ease.out(cl(t / T_B, 0, 1)), dive = cl((t - PULSE + 0.08) / 0.12, 0, 1), z = T * 0.42 * (1 - dive), r = T * (0.07 + 0.11 * build + 0.04 * Math.min(1, t / PULSE)) * (1 - 0.6 * dive) * (0.85 + 0.2 * br), a = Math.min(1, t / 0.08) * (1 - cl((t - PULSE) / 0.18, 0, 1));
        K.orb(c, X, Y - z, r, t, 1, a, gold); K.glow(c, X, Y - z, r * (4 + 2 * Math.sin(t * 30)), gold ? P.gold : P.cyan, 0.35 * a * br);
        if (t > 0.1 && t < PULSE) for (let i = 0; i < 3; i++) { const b = t * 5 + i * TAU / 3; K.arc(c, X, Y - z, X + Math.cos(b) * T * 0.55, Y - z * 0.4 + Math.sin(b) * T * 0.3, K.seed(t, i + 60), 1.1, 0.7 * a, { forks: 0, jit: T * 0.12, gold }); }
        if (!o.first && t < 0.15) K.glow(c, X, Y - z, T * 1.4 * (1 - t / 0.15), P.white, 0.6 * br);
        if (t >= PULSE - 0.05) K.glow(c, X, Y, T * (1.2 + 0.4 * br) * (1 - cl((t - PULSE) / 0.2, 0, 1)), gold ? P.gold : P.white, 0.8);
      } });
  }

  /* ===================== LI-S07 Arc Boomerang =====================
     A V of plasma, spinning flat over the floor, loops out along the aim and curves back to the pet, striking on both
     passes; at the turn it drops a line of loose sparks along the way it will come back. Its arms are tapered blades of
     plasma (violet fringe, cyan body, white core) with arcs crawling down them, the hub a small orb; each arm tip draws
     a comet tail. Stages 1-3: one V. Stages 4-6: three (a centre one and two looping out on mirrored sides).
     Stage 7: seven, fanned out over different loop paths and launched one after another from the centre outward, the
     centre one larger and gold; a golden ring breaks round the pet as the last is caught. Each monster is struck once a
     pass whichever boomerang reaches it (x1.05 from Adept, x1.1 at Celestial); the small ones at Celestial draw a lighter
     blade (three layers, one crawling arc, no tail) to keep the frame cheap. */
  S.arcboomerang = (C, H) => {
    const K = TK.bind(H), P = K.P, e = K.evo(C), me = H.me, a = C.a, dir = [Math.cos(a), Math.sin(a)], per = [-dir[1], dir[0]], sx0 = me.x, sy0 = me.y, DUR = 1.2, gold = e >= 7;
    const N = K.lv(C, [1, 3, 7]), dk = C.base * C.K * K.evoK(C) * (e >= 7 ? 1.1 : e >= 4 ? 1.05 : 1), Z = 0.6;
    // the fan: [angle offset, loop side, loop width, size, launch delay]
    const fan = N === 1 ? [[0, 1, 1.3, 1, 0]] : N === 3 ? [[0, 1, 0.25, 1.05, 0], [0.12, 1, 1.7, 0.85, 0.1], [-0.12, -1, 1.7, 0.85, 0.1]]
      : [[0, 1, 0.2, 1.15, 0, 1], [0.32, 1, 1.0, 0.72, 0.08], [-0.32, -1, 1.0, 0.72, 0.08], [0.68, 1, 0.9, 0.68, 0.16], [-0.68, -1, 0.9, 0.68, 0.16], [1.05, 1, 0.8, 0.64, 0.24], [-1.05, -1, 0.8, 0.64, 0.24]];
    const booms = fan.map(([da, s2, W, sz, d0, g]) => { const aa = a + da, L = Math.max(2.2, reach(H, sx0, sy0, aa, 5.2, 0.3) - 0.2) * (g ? 1.05 : 1); return { s: s2, W, L, sz, d0, gold: g && gold ? 1 : 0, lite: N === 7 && !g, dir: [Math.cos(aa), Math.sin(aa)], per: [-Math.sin(aa), Math.cos(aa)] }; });
    const hits = [new Set(), new Set()];
    for (const b of booms) { b.rot = Math.random() * TAU; b.hh = []; b.done = 0; b.turn = 0; b.pos = u => { const al = b.L * Math.sin(u * Math.PI), lat = b.s * b.W * 0.6 * Math.sin(u * TAU), back = u > 0.5 ? H.ease.io((u - 0.5) * 2) : 0; return [sx0 + b.dir[0] * al + b.per[0] * lat + (me.x - sx0) * back, sy0 + b.dir[1] * al + b.per[1] * lat + (me.y - sy0) * back]; }; }
    H.X.sfx.whoosh(); me.sq = 0.7; K.sparks(me.x + dir[0] * 0.5, me.y + dir[1] * 0.5 - 0.5, 10, 6);
    H.add({ life: DUR + 0.45 + booms[booms.length - 1].d0, x: sx0, y: sy0, caught: 0,
      update(dt, f) {
        for (const b of booms) { const u = cl((f.t - b.d0) / DUR, 0, 1); if (f.t < b.d0) continue; b.u = u;
          if (u >= 1) { if (!b.done) { b.done = 1; K.sparks(me.x, me.y - 0.5, b.lite ? 5 : 10, 5); K.motes(me.x, me.y - 0.5, b.lite ? 2 : 6); H.X.light(me.x, me.y, 1.6, 0.12); H.X.sfx.crack(); } continue; }
          const p = b.pos(u); b.x = p[0]; b.y = p[1]; b.rot += dt * (3.2 + 1.5 * Math.sin(u * Math.PI)) * (b.s > 0 ? 1 : -1);
          b.hh.push([b.x, b.y]); if (b.hh.length > 12) b.hh.shift();
          // the turn: loose sparks hang along the way back
          if (u > 0.42 && !b.turn) { b.turn = 1; const k = H.n(b.lite ? 7 : 14); for (let i = 0; i < k; i++) { const uu = 0.52 + 0.42 * i / k, q = b.pos(uu); H.P({ kind: 'spark', x: q[0] + (Math.random() - 0.5) * 0.25, y: q[1] - Z + (Math.random() - 0.5) * 0.2, vx: (Math.random() - 0.5) * 0.6, vy: -0.2 - Math.random() * 0.4, g: 0.3, drag: 1.5, life: 0.75 + i / k * 0.3, max: 1.05, size: 2.2, color: i % 3 === 0 ? (gold ? P.gold : P.white) : i % 3 === 1 ? P.ice : P.cyan }); } H.X.sfx.hum(); }
          const pass = u > 0.5 ? 1 : 0, rr = 0.85 * b.sz;
          for (const m of H.near(b.x, b.y, rr)) { if (hits[pass].has(m)) continue; hits[pass].add(m); H.X.hitMon(m, dk * (pass ? 1.3 : 1.2), C.dmgO({ kb: 2, stun: 0.15 })); K.sparks(m.x, m.y - 0.4, 8, 6); K.motes(m.x, m.y - 0.4, 3); H.X.light(m.x, m.y, 1.3, 0.1); H.X.sfx.crack(); if (b.gold) K.goldSparks(m.x, m.y - 0.4, 5, 5); }
          K.aura(b.x, b.y - Z, 0.45 * b.sz, dt, b.lite ? 6 : 16, 0);
        }
        if (gold && !f.caught && booms.every(b => b.done)) { f.caught = 1; H.X.ring(me.x, me.y, 0.3, 1.6, 0.35, P.gold, 0.5); K.goldSparks(me.x, me.y - 0.5, 16, 6); H.X.flash(0.05, P.gold); }
      },
      drawUnder(c, f) { const T = H.X.Tz(); for (const b of booms) { if (b.u == null || b.done) continue; const X = H.sx(b.x), Y = H.sy(b.y); K.floorLight(c, X, Y, T * 1.3 * b.sz, 0.4, b.gold ? P.gold : P.blue); K.floorLight(c, X, Y, T * 0.5 * b.sz, 0.35, P.cyan); } },
      draw(c, f) { const T = H.X.Tz(), t = f.t, z = Z * T;
        const order = booms.filter(b => b.u != null && !b.done).sort((p, q) => p.y - q.y);
        for (const b of order) { const X = H.sx(b.x), Y = H.sy(b.y) - z, u = b.u, a0 = cl(u / 0.07, 0, 1) * cl((1 - u) / 0.07, 0, 1) * cl((Math.hypot(b.x - me.x, b.y - me.y) - 0.25) / 0.6, 0.15, 1), sc = b.sz * (0.45 + 0.55 * Math.min(1, u / 0.1)) * (u > 0.9 ? 0.4 + 0.6 * (1 - u) / 0.1 : 1), g = b.gold || false;
          // the comet tail the hub leaves (wide and soft, a bright thread down its middle)
          if (b.hh.length > 2 && !b.lite) { const tp = b.hh.map(p => [H.sx(p[0]), H.sy(p[1]) - z]); streak(c, K, tp.slice(-8), T * 0.3 * sc, 0.3 * a0, g); }
          K.glow(c, X, Y, T * 1.3 * sc, g ? P.gold : P.blue, 0.4 * a0); K.glow(c, X, Y, T * 0.6 * sc, P.violet, 0.3 * a0);
          // the V: two crescent blades of plasma swept back from the hub, turning slowly
          const AR = T * 1.1 * sc, tips = [], spines = [];
          for (let k = 0; k < 2; k++) { const th = b.rot + (k ? 0.68 : -0.68), bend = (k ? -1 : 1) * 0.45, cen = [];
            for (let i = 0; i <= 8; i++) { const v = i / 8, thv = th + bend * v * v, rv = AR * (0.12 + 0.88 * v); cen.push([X + Math.cos(thv) * rv, Y + Math.sin(thv) * rv * 0.82]); }
            spines.push(cen); tips.push(cen[cen.length - 1]);
            const blade = (wk, col, al) => { const Lp = [], Rp = []; for (let i = 0; i <= 8; i++) { const v = i / 8, p = cen[i], q = cen[Math.min(8, i + 1)], o = cen[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, w = T * 0.24 * sc * wk * Math.pow(1 - v, 0.65) + 0.6; Lp.push([p[0] - dy / d * w, p[1] + dx / d * w]); Rp.push([p[0] + dy / d * w * 0.55, p[1] - dx / d * w * 0.55]); }
              c.globalAlpha = al; c.fillStyle = col; c.beginPath(); c.moveTo(X, Y); Lp.forEach(p => c.lineTo(p[0], p[1])); for (let i = Rp.length - 1; i >= 0; i--) c.lineTo(Rp[i][0], Rp[i][1]); c.closePath(); c.fill(); };
            if (b.lite) { c.save(); c.globalCompositeOperation = 'source-over'; blade(1.2, P.deep, 0.5 * a0); c.globalCompositeOperation = 'lighter'; blade(0.7, P.cyan, 0.7 * a0); blade(0.18, P.white, a0); c.restore(); continue; }
            c.save(); c.globalCompositeOperation = 'lighter'; blade(1.8, P.violet, 0.4 * a0); c.globalCompositeOperation = 'source-over'; blade(1.05, g ? '#C98A1E' : P.deep, 0.55 * a0); blade(0.85, g ? P.amber : P.blue, 0.6 * a0); c.globalCompositeOperation = 'lighter'; blade(0.5, g ? P.gold : P.cyan, 0.65 * a0); blade(0.16, P.white, a0);
            c.globalAlpha = 0.5 * a0; for (let i = 2; i <= 8; i += 3) blitSized(c, glowSprite(g ? P.gold : P.cyan), cen[i][0] - T * 0.25 * sc, cen[i][1] - T * 0.25 * sc, T * 0.5 * sc, T * 0.5 * sc); c.restore(); }
          // arcs crawl down the blades and jump between their tips
          const crawl = (b.lite ? spines.slice(0, 1) : spines).map((cen, k) => K.path(cen[1][0], cen[1][1], cen[8][0], cen[8][1], K.seed(t, k + (b.s > 0 ? 0 : 7) + (g ? 20 : 0), 16), T * 0.1 * sc, 6));
          if (!b.lite && Math.sin(t * 13 + b.s) > 0.3) crawl.push(K.path(tips[0][0], tips[0][1], tips[1][0], tips[1][1], K.seed(t, 30 + b.s, 20), T * 0.2 * sc, 7));
          multiBolt(c, K, crawl, 1.1, 0.8 * a0, g);
          if (!b.lite) for (const p of tips) node(c, K, p[0], p[1], T * 0.05 * sc, a0, g);
          K.orb(c, X, Y, T * 0.14 * sc, t, b.s, a0, g);
        }
      } });
  };

  /* ===================== LI-S08 Sparkstep Echo =====================
     The pet dashes two tiles behind a short forward bolt; where it stood, a charged echo of the pet itself (its own
     silhouette, rendered once and turned to blue light with a crackling white outline) stays, charges over a turning
     floor ring with arcs crawling round its outline, then detonates: the echo swells and dissolves, a shock ring and
     ground arcs run out, and violet lines fade on the floor.
     Stages 1-3: one 2-tile dash, one echo. Stages 4-6: three short dashes zig-zagging along the aim, three echoes going
     off in sequence, the last larger. Stage 7: seven dashes and seven echoes, the last a giant golden one with eight
     golden bolts round it and golden arcs leaping from every echo to the pet. Damage at 4+ (x1.08, x1.15 at 7) is split
     over the strikes (25%), the dashes (15%) and the echoes (60%, the last one taking 40% of that). */
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
    const gout = mk(), gg = gout.getContext('2d'); gg.drawImage(out, 0, 0); gg.globalCompositeOperation = 'source-in'; gg.fillStyle = K.P.gold; gg.fillRect(0, 0, W, Hh);
    return { body, out, hot, gout, w: W / s, h: Hh / s, ox: W / 2 / s, oy: fy / s };
  }
  S.sparkstep = (C, H) => {
    const K = TK.bind(H), P = K.P, e = K.evo(C), me = H.me, a = C.a, gold = e >= 7, NE = K.lv(C, [1, 3, 7]), F = C.base * C.K * K.evoK(C) * 2.7 * (e >= 7 ? 1.15 : e >= 4 ? 1.08 : 1);
    const T = H.X.Tz(), ES = echoSprite(H, K, T * 0.95), R = K.lv(C, [1.9, 2.0, 1.7]);
    // the chain: NE short dashes zig-zagging along the aim, an echo left at the start of each
    const GAPD = NE === 1 ? 0 : NE === 3 ? 0.2 : 0.16, DT = NE === 1 ? 0.16 : 0.12, DIST = NE === 1 ? 2.0 : NE === 3 ? 1.5 : 1.1, ZIG = NE === 1 ? [0] : NE === 3 ? [0, 0.5, -0.5] : [0, 0.6, -0.6, 0.6, -0.6, 0.6, 0];
    const END_CHAIN = (NE - 1) * GAPD + DT, echoes = [];
    const share = NE === 1 ? { strike: 0.7, dash: 0.4, land: 0.3, echo: 1.3, giant: 1.3 } : { strike: F * 0.25 / NE, dash: F * 0.1 / NE, land: F * 0.05 / NE, echo: F * 0.6 * 0.6 / (NE - 1), giant: F * 0.6 * 0.4 };
    if (NE === 1) for (const k in share) share[k] *= C.base * C.K * K.evoK(C);
    const strikeFx = (x0, y0, ang, SL, big) => { const dx = Math.cos(ang), dy = Math.sin(ang); H.add({ life: 0.3, x: x0, y: y0, draw(c, f, X, Y, T2) { const k = Math.min(1, f.t / 0.04) * cl(f.life / 0.2, 0, 1), ex = H.sx(x0 + dx * SL), ey = H.sy(y0 + dy * SL) - T2 * 0.45;
      K.arc(c, X, Y - T2 * 0.5, ex, ey, K.seed(f.t, 3, 24), big ? 3.2 : 2.4, k, { forks: big ? 3 : 1, jit: T2 * 0.3, gold }); K.glow(c, ex, ey, T2 * (big ? 0.9 : 0.6), gold ? P.gold : P.cyan, 0.7 * k); node(c, K, ex, ey, T2 * 0.08, k, gold); } }); };
    const F2 = H.add({ life: END_CHAIN + 0.25 + NE * 0.11 + 0.15 + 1.3, x: me.x, y: me.y,
      update(dt, f) { for (const E of echoes) { if (f.t < E.det) { K.aura(E.x, E.y - 0.55 * E.sc, 0.35 * E.sc, dt, E.main ? 14 : 5, 0); if (E.main && f.t - E.t0 > 0.12 && Math.random() < dt * 10) converge(H, K, E.x, E.y, 1.3 * E.sc, 2, 0.3, 0.5); } } },
      drawUnder(c, f, X0, Y0, T2) { const t = f.t;
        for (const E of echoes) { const X = H.sx(E.x), Y = H.sy(E.y), ch = cl((t - E.t0) / (E.det - E.t0), 0, 1), dt2 = t - E.det, gE = E.gold;
          if (dt2 < 0) { K.floorLight(c, X, Y, T2 * (0.7 + 0.6 * ch) * E.sc, 0.35 + 0.3 * ch, P.blue);
            // a turning ring of charge under the echo, ticks round it like a dial filling
            const rr = T2 * 0.7 * E.sc; floorRing(c, K, H, X, Y, rr, 0.5 + 0.4 * ch, gE, rr * 0.55);
            if (E.main) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = gE ? P.gold : P.cyan; c.lineWidth = 2; const nt = 12, lit = Math.floor(ch * nt);
              for (let i = 0; i < nt; i++) { const b = i / nt * TAU + t * 1.5; c.globalAlpha = i < lit ? 0.9 : 0.25; c.beginPath(); c.moveTo(X + Math.cos(b) * rr * 1.12, Y + Math.sin(b) * rr * 0.55 * 1.12); c.lineTo(X + Math.cos(b) * rr * 1.3, Y + Math.sin(b) * rr * 0.55 * 1.3); c.stroke(); } c.restore(); }
            continue; }
          // after the detonation: a shock ring runs out, ground arcs, then their violet lines fade
          const u = cl(dt2 / 0.3, 0, 1), ra = 1 - u;
          floorRing(c, K, H, X, Y, T2 * E.r * H.ease.out(u), 0.95 * ra, gE); K.floorLight(c, X, Y, T2 * E.r * 1.2, 0.6 * ra + 0.15, gE ? P.gold : P.violet);
          if (!E.scars) { E.scars = []; const n = E.main ? K.lv(C, [6, 8, 12]) : 4; for (let i = 0; i < n; i++) { const b = i / n * TAU + Math.random() * 0.5, L2 = E.r * T2 * (0.75 + 0.25 * Math.random()); E.scars.push(K.path(0, 0, Math.cos(b) * L2, Math.sin(b) * L2, Math.random() * 99 + i, L2 * 0.18, 7)); } }
          const live = dt2 < 0.24, kk = live ? 0.35 + 0.65 * H.ease.out(u * 1.3) : 1, pts = E.scars.map(p => p.map(q => [X + q[0] * kk, Y + q[1] * kk]));
          if (live) multiBolt(c, K, pts.map((p, i) => K.path(p[0][0], p[0][1], p[p.length - 1][0], p[p.length - 1][1], K.seed(t, i + 80), T2 * 0.25, 7)), 2.2 * Math.min(1.3, E.sc), 1, gE); else multiScar(c, K, pts, cl(1 - (dt2 - 0.24) / 0.7, 0, 1), 2.4 * Math.min(1.3, E.sc));
        }
      },
      draw(c, f, X0, Y0, T2) { const t = f.t;
        for (const E of echoes) { const X = H.sx(E.x), Y = H.sy(E.y), dt2 = t - E.det, app = cl((t - E.t0) / 0.12, 0, 1), ch = cl((t - E.t0) / (E.det - E.t0), 0, 1), sc = E.sc * (1 + 0.04 * Math.sin(t * 40) * ch), gE = E.gold;
          if (dt2 > 0.3) continue;
          const sw = dt2 > 0 ? 1 + 0.7 * H.ease.out(cl(dt2 / 0.25, 0, 1)) : 1, ka = dt2 > 0 ? 1 - cl(dt2 / 0.25, 0, 1) : app, w = ES.w * sc * sw, h = ES.h * sc * sw, x0 = X - ES.ox * sc * sw, y0 = Y - ES.oy * sc * sw;
          c.save(); c.globalCompositeOperation = 'lighter';
          K.glow(c, X, Y - T2 * 0.5 * sc, T2 * (1.1 + 0.5 * ch) * sc * sw, gE ? P.gold : P.blue, 0.3 * ka);
          c.globalAlpha = (0.14 + 0.2 * ch) * ka * (0.8 + 0.2 * Math.sin(t * 50)); c.drawImage(ES.body, x0, y0 - ((t * 40) % 3), w, h);
          const jx = (K.R1(K.seed(t, 7, 30)) - 0.5) * 2; c.globalAlpha = 0.95 * ka; c.drawImage(ES.out, x0 + jx, y0, w, h); c.globalAlpha = (0.55 + 0.4 * ch) * ka; c.drawImage(ES.hot, x0, y0, w, h);
          if (gE) { c.globalAlpha = 0.7 * ka; c.drawImage(ES.gout, x0 - jx * 2, y0 - 1.5, w, h); }
          c.restore();
          // arcs crawling round the outline, more of them as it charges
          const na = Math.round(lerp(1, E.main ? 5 : 2, ch)), cy = Y - T2 * 0.5 * sc * sw, rx = T2 * 0.42 * sc * sw, ry = T2 * 0.5 * sc * sw, list = [];
          for (let i = 0; i < na; i++) { const b0 = K.R1(K.seed(t, i + 20 + E.k * 9, 12)) * TAU, b1 = b0 + 0.6 + K.R1(K.seed(t, i + 30 + E.k * 9, 12)) * 0.8; list.push(K.path(X + Math.cos(b0) * rx, cy + Math.sin(b0) * ry, X + Math.cos(b1) * rx, cy + Math.sin(b1) * ry, K.seed(t, i + 40 + E.k * 9, 20), T2 * 0.12, 5)); }
          multiBolt(c, K, list, 1.4, 0.9 * ka, gE); K.glow(c, X, cy, T2 * 0.22 * sc, P.white, (0.3 + 0.4 * ch) * ka);
          if (dt2 > 0 && dt2 < 0.12) { const k = 1 - dt2 / 0.12; K.glow(c, X, cy, T2 * 1.6 * E.sc, gE ? P.gold : P.cyan, 0.6 * k); K.glow(c, X, cy, T2 * 0.7 * E.sc, P.white, 0.6 * k); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * k; blitSized(c, glowSprite(gE ? P.gold : P.cyan), X - T2 * 0.3 * E.sc, cy - T2 * 2.4 * Math.min(1.4, E.sc), T2 * 0.6 * E.sc, T2 * 2.6 * Math.min(1.4, E.sc)); c.restore(); }
        }
        // Celestial: golden bolts round the giant echo, then golden arcs leap from every echo to the pet
        const G = echoes.find(E => E.gold); if (G) { for (let i = 0; i < 8; i++) { const d0 = t - (G.det + 0.03 + i * 0.025); if (d0 < 0 || d0 > 0.22) continue; const b = i / 8 * TAU + 0.3, px = H.sx(G.x + Math.cos(b) * G.r * 0.78), py = H.sy(G.y + Math.sin(b) * G.r * 0.78); K.skyBolt(c, px, py, T2 * 3.2, K.seed(t, i + 90), 2.2, 1 - d0 / 0.22, { gold: true }); }
          const d1 = t - (G.det + 0.25); if (d1 > 0 && d1 < 0.3) { const k = 1 - d1 / 0.3, qx = H.sx(me.x), qy = H.sy(me.y) - T2 * 0.5;
            multiBolt(c, K, echoes.map((E, i) => K.path(H.sx(E.x), H.sy(E.y) - T2 * 0.45 * Math.min(1.3, E.sc), qx, qy, K.seed(t, i + 70), T2 * 0.25)), 2, k, true); } }
      } });
    // each dash in turn: a bolt runs ahead, the pet dashes, and an echo stays where it stood
    for (let i = 0; i < NE; i++) H.X.after(i * GAPD, () => {
      if (me.dead) return; let ang = a + ZIG[i], L = Math.min(DIST, reach(H, me.x, me.y, ang, DIST + 0.4, 0.25) - 0.4);
      if (L < 0.5 && ZIG[i]) { ang = a - ZIG[i]; L = Math.min(DIST, reach(H, me.x, me.y, ang, DIST + 0.4, 0.25) - 0.4); }
      const last = i === NE - 1, giant = last && NE > 1, x0 = me.x, y0 = me.y, dx = Math.cos(ang), dy = Math.sin(ang);
      if (L >= 0.5) { const DTm = last ? DT : DT * 0.72, D = me.dash = { vx: dx * L / DTm, vy: dy * L / DTm, t: DT, max: DT, hit: new Set(), dmg: share.dash + (last ? 0 : share.land), land: share.land, el: C.el }; me.inv = Math.max(me.inv || 0, DT + 0.15);
        if (!last) H.X.after(DTm, () => { if (me.dash === D) me.dash = null; }); }   // (only the last dash of a chain lands with the game's dash blast)
      const SL = Math.min(L + 1.4, reach(H, x0, y0, ang, L + 1.4, 0.25) + 0.3); H.hitLine(x0, y0, ang, SL, 0.9, share.strike, C.dmgO({ kb: 1.5, stun: 0.15 })); strikeFx(x0, y0, ang, SL, NE === 1 || giant);
      H.X.sfx.whoosh(); H.X.sfx.crack(); K.sparks(x0 + dx * SL, y0 + dy * SL - 0.4, NE > 3 ? 5 : 10, 6); H.X.light(x0 + dx * SL * 0.6, y0 + dy * SL * 0.6, 1.6, 0.12);
      const det = END_CHAIN + 0.25 + i * 0.11 + (giant ? 0.15 : 0), E = { k: i, x: x0, y: y0, t0: F2.t, det, main: NE === 1 || giant, gold: giant && gold, sc: NE === 1 ? 1 : giant ? (gold ? 1.55 : 1.2) : NE === 3 ? 0.8 : 0.7, r: NE === 1 ? R : giant ? (gold ? 2.8 : 2.3) : R * 0.75, dmg: NE === 1 || giant ? share.giant : share.echo, scars: null };
      echoes.push(E); if (E.main) H.warn(E.x, E.y, E.r, det - F2.t, C.col);
      H.X.after(det - F2.t, () => { H.hitArea(E.x, E.y, E.r, E.dmg, C.dmgO({ kb: E.main ? 3 : 1.5, stun: E.main ? 0.35 : 0.12 })); K.sparks(E.x, E.y - 0.4, E.main ? 22 : 8, E.main ? 9 : 6); K.motes(E.x, E.y - 0.4, E.main ? 12 : 4); H.X.light(E.x, E.y, E.r * 1.6, 0.25);
        if (E.main) { H.X.flash(0.07, E.gold ? P.gold : P.ice); H.X.shake(E.gold ? 8 : 6, 0.18); H.X.hitstop(0.035); H.X.sfx.crash(); if (E.gold) { K.goldSparks(E.x, E.y - 0.5, 22, 9); for (let j = 0; j < 8; j++) { const b = j / 8 * TAU + 0.3; K.goldSparks(E.x + Math.cos(b) * E.r * 0.78, E.y + Math.sin(b) * E.r * 0.78, 3, 4); } } } else { H.X.shake(3, 0.08); H.X.sfx.crack(); } });
    });
  };


  /* ===================== LI-S09 Capacitor Crush =====================
     Charged plates of translucent blue light stand on either side of the target: a glassy face crossed by circuit
     lines with glowing nodes, a bright frame, a violet edge for thickness, a charge level rising inside. Arcs jump between
     them as they close, each volley a small hit; they clap together in a white discharge and break into dim geometric
     sparks (spinning outlines of triangles, squares and diamonds) over a fading violet print.
     Stages 1-3: two plates, four volleys, one clap. Stages 4-6: four plates closing from both axes, five volleys of more
     arcs. Stage 7: eight gold-framed plates (the diagonals smaller) that clap THREE times, springing apart between, each
     discharge wider and brighter (radius 1.25 / 1.65 / 2.2), the last a gold blast leaving a turning golden octagram.
     Damage from Adept x1.08, at Celestial x1.15 (volleys 1.0, claps 2.22 split 25/30/45). */
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
    const K = TK.bind(H), P = K.P, e = K.evo(C), x = C.tx, y = C.ty, gold = e >= 7, NP = K.lv(C, [2, 4, 8]), NV = K.lv(C, [4, 5, 8]), NA = K.lv(C, [2, 3, 3]), dk = C.base * C.K * K.evoK(C) * (e >= 7 ? 1.15 : e >= 4 ? 1.08 : 1);
    // the plates round the target (angle on the floor): left/right, then also behind/in front, then the diagonals too
    const ANG = NP === 2 ? [0, Math.PI] : NP === 4 ? [0, Math.PI / 2, Math.PI, Math.PI * 1.5] : [0, 1, 2, 3, 4, 5, 6, 7].map(i => i * Math.PI / 4);
    // the claps: one, or three at Celestial (each discharge bigger); the plates spring apart between them
    const CL = gold ? [0.85, 1.45, 2.1] : [1.0], CLAP = CL[CL.length - 1], CR = gold ? [1.25, 1.65, 2.2] : [1.45], CK = gold ? [0.25, 0.3, 0.45] : [1];
    const YAW = 0.95, APP = 0.25, D0 = NP === 8 ? 2.0 : 1.75, D1 = NP === 2 ? 0.22 : NP === 4 ? 0.42 : 0.55, END = CLAP + 1.1, VT = []; for (let i = 0; i < NV; i++) VT.push(APP + 0.08 + (CLAP - APP - 0.14) * i / (NV - 1));
    H.warn(x, y, CR[CR.length - 1], CLAP, C.col); H.X.sfx.hum();
    const gap = t => { if (t < APP) return D0; let s0 = APP, g0 = D0; for (let i = 0; i < CL.length; i++) { if (t < CL[i]) return g0 + (D1 - g0) * H.ease.in(cl((t - s0) / (CL[i] - s0), 0, 1)); if (i < CL.length - 1 && t < CL[i] + 0.18) return D1 + (D0 * 0.7 - D1) * H.ease.out((t - CL[i]) / 0.18); s0 = CL[i] + 0.18; g0 = D0 * 0.7; } return D1; };
    const geo = [];   // the geometric sparks after the last clap: x, y (screen offsets in tiles), z, velocities, spin, sides
    VT.forEach((t0, i) => H.X.after(t0, () => { if (CL.some(c0 => Math.abs(c0 - t0) < 0.05)) return; H.hitArea(x, y, 1.25, dk * (gold ? 1.0 : 1.4) / NV, C.dmgO({ stun: 0.1 })); K.sparks(x, y - 0.5, 6, 5); H.X.light(x, y, 1.6, 0.12); H.X.sfx.crack(); if (gold && i % 2) K.goldSparks(x, y - 0.5, 4, 4); }));
    CL.forEach((c0, ci) => H.X.after(c0, () => { const last = ci === CL.length - 1, r = CR[ci], bg = (ci + 1) / CL.length;
      H.hitArea(x, y, r, dk * (gold ? 2.22 : 1.4) * CK[ci], C.dmgO({ kb: last ? 2 : 1, stun: last ? 0.45 : 0.2 })); H.X.flash(0.05 + 0.04 * bg, gold && last ? P.gold : P.ice); H.X.shake(4 + 4 * bg, 0.16); H.X.hitstop(0.02 + 0.025 * bg); H.X.sfx.crash(); H.X.light(x, y, r * 2, 0.3); K.sparks(x, y - 0.5, Math.round(10 + 12 * bg), 7 + 3 * bg); K.motes(x, y - 0.5, 6 + 6 * bg); if (gold) K.goldSparks(x, y - 0.6, Math.round(8 + 14 * bg), 6 + 3 * bg);
      if (!last) return; const n = H.n(K.lv(C, [10, 14, 24])); for (let i = 0; i < n; i++) { const b = Math.random() * TAU, v = 1.8 + Math.random() * 2.6 * (gold ? 1.3 : 1); geo.push({ x: 0, y: 0, z: 0.5 + Math.random() * 0.4, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 2 + Math.random() * 3, r: 0.08 + Math.random() * 0.09, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, sides: 3 + (i % 3), life: 0.6 + Math.random() * 0.4, gold: gold && i % 3 === 0 }); } }));
    H.add({ life: END, x, y,
      update(dt, f) { if (f.t < CLAP) { const g = gap(f.t); for (let i = 0; i < ANG.length; i += NP === 8 ? 2 : 1) K.aura(x + Math.cos(ANG[i]) * g, y + Math.sin(ANG[i]) * g - 0.6, 0.35, dt, 6, 0); }
        for (const p of geo) { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 9 * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; } p.rot += p.vr * dt; p.life -= dt; } },
      drawUnder(c, f, X, Y, T) { const t = f.t, ap = cl(t / APP, 0, 1);
        if (t < CLAP + 0.1) { K.floorLight(c, X, Y, T * (1.2 + 0.6 * cl((t - APP) / (CLAP - APP), 0, 1)), 0.4 * ap, P.blue); const g = gap(t); for (let i = 0; i < ANG.length; i += NP === 8 ? 2 : 1) K.floorLight(c, X + Math.cos(ANG[i]) * g * T, Y + Math.sin(ANG[i]) * g * T, T * 0.9, 0.35 * ap, gold ? P.gold : P.cyan); }
        // each clap's shock ring (bigger every time)
        CL.forEach((c0, ci) => { const u = cl((t - c0) / 0.35, 0, 1); if (t >= c0 && u < 1) { floorRing(c, K, H, X, Y, T * CR[ci] * 1.1 * H.ease.out(u), (1 - u) * 0.95, gold && ci === CL.length - 1); K.floorLight(c, X, Y, T * CR[ci] * 1.2, 0.5 * (1 - u), gold && ci === CL.length - 1 ? P.gold : P.violet); } });
        if (t >= CLAP) { const u = cl((t - CLAP) / 0.35, 0, 1), fa = cl((END - t) / 0.6, 0, 1);
          K.floorLight(c, X, Y, T * 1.8, 0.2 * fa, P.violet);
          // a square print of light where the plates met (a turning golden octagram at Celestial), fading
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; const rr = T * (gold ? 1.9 : 0.9) * (0.7 + 0.3 * H.ease.out(u)), nsq = gold ? 2 : 1, rot0 = (gold ? (t - CLAP) * 0.8 : 0);
          for (let k = 0; k < nsq; k++) { c.beginPath(); for (let i = 0; i < 4; i++) { const b = rot0 + k * Math.PI / 4 + i * Math.PI / 2 + Math.PI / 4, px = X + Math.cos(b) * rr, py = Y + Math.sin(b) * rr * 0.6; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath();
            c.globalAlpha = 0.4 * fa; c.strokeStyle = P.violet; c.lineWidth = 5; c.stroke(); c.globalAlpha = 0.8 * fa; c.strokeStyle = gold ? P.gold : P.ice; c.lineWidth = 1.5; c.stroke(); }
          if (gold) { c.beginPath(); H.floorEllipse(c, X, Y, rr * 1.08, rr * 0.65); c.globalAlpha = 0.6 * fa; c.strokeStyle = P.gold; c.lineWidth = 1.2; c.stroke(); c.beginPath(); H.floorEllipse(c, X, Y, rr * 0.5, rr * 0.3); c.stroke(); }
          c.restore(); }
      },
      draw(c, f, X, Y, T) { const t = f.t, ap = H.ease.back(cl(t / APP, 0, 1)), hh0 = T * 1.0 * Math.max(0.05, ap), z = T * 0.12, g = gap(t);
        // the flash of each clap: a white bloom and a column of light, bigger every time
        CL.forEach((c0, ci) => { const u = cl((t - c0) / 0.22, 0, 1), bg = 0.6 + 0.4 * (ci + 1) / CL.length, cy = Y - z - T * 0.5; if (t < c0 || u >= 1) return; K.glow(c, X, cy, T * (1 + 2 * u) * bg, P.white, 0.9 * (1 - u)); K.glow(c, X, cy, T * 2.6 * (0.5 + u) * bg, gold && ci === CL.length - 1 ? P.gold : P.cyan, 0.6 * (1 - u)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * (1 - u); blitSized(c, glowSprite(gold && ci === CL.length - 1 ? P.gold : P.ice), X - T * 0.35 * bg, cy - T * 2.5 * bg, T * 0.7 * bg, T * 3.2 * bg); c.restore(); });
        if (t < CLAP) { const pX = H.sx(H.me.x), pY = H.sy(H.me.y), plates = ANG.map((th, i) => { const diag = NP === 8 && i % 2 === 1, gg = g * (diag ? 1.12 : 1); return { th, diag, nx: -Math.cos(th), ny: -Math.sin(th), px: X + Math.cos(th) * gg * T, py: Y + Math.sin(th) * gg * T }; });
          plates.sort((p, q) => p.py - q.py);
          const charge = cl((t - APP) / (CLAP - APP), 0, 1), back = plates.filter(p => p.py <= Y + 1), front = plates.filter(p => p.py > Y + 1);
          const drawP = p => { const near = Math.hypot(p.px - pX, p.py - pY) < T * 1.0 ? 0.45 : 1; plate(c, K, H, p.px, p.py, p.nx, p.ny, T * (p.diag ? 0.45 : 0.62), hh0 * (p.diag ? 0.8 : 1), z, ap > 0 ? Math.min(1, t / 0.08) * near * (p.ny < -0.5 ? 0.7 : 1) : 0, t, charge, gold, T, -YAW * p.nx * (p.ny > 0.3 ? -1 : 1)); };
          back.forEach(drawP);
          // the arcs between facing plates: a thin constant one, and a volley of bright ones at each hit
          const vol = VT.some(t0 => t > t0 - 0.01 && t < t0 + 0.12), list = [], hot = [], NAX = NP / 2;
          for (let ai = 0; ai < NAX; ai++) { const th = ANG[ai], gg = g * (NP === 8 && ai % 2 ? 1.12 : 1), p0 = [X - Math.cos(th) * gg * T, Y - Math.sin(th) * gg * T], p1 = [X + Math.cos(th) * gg * T, Y + Math.sin(th) * gg * T];
            for (let i = 0; i < (vol ? NA : 1); i++) { if (!vol && NP === 8 && ai % 2) break; const v = vol ? 0.2 + 0.6 * (NA > 1 ? i / (NA - 1) : 0.5) : 0.5 + 0.25 * Math.sin(t * 9), hgt = z + hh0 * v; (vol ? hot : list).push(K.path(p0[0], p0[1] - hgt, p1[0], p1[1] - hgt, K.seed(t, i + ai * 9, 24), T * (vol ? 0.28 : 0.15), Math.max(4, Math.ceil(gg * T / 9)))); } }
          if (NP >= 4 && vol) for (let i = 0; i < 4; i++) { const b0 = i * Math.PI / 2, b1 = b0 + Math.PI / 2, hgt = z + hh0 * 0.6; hot.push(K.path(X + Math.cos(b0) * g * T, Y + Math.sin(b0) * g * T - hgt, X + Math.cos(b1) * g * T, Y + Math.sin(b1) * g * T - hgt, K.seed(t, i + 30, 24), T * 0.2, 6)); }
          multiBolt(c, K, list, 1.3, 0.75 * Math.min(1, t / APP), gold); multiBolt(c, K, hot, NP >= 4 ? 1.7 : 2.5, 0.9, gold);
          if (vol) K.glow(c, X, Y - z - hh0 * 0.5, T * 1.3, P.cyan, 0.3);
          K.glow(c, X, Y - z - hh0 * 0.5, T * (0.3 + 0.5 * charge), P.white, 0.25 + 0.25 * charge);
          front.forEach(drawP); }
        else { // the dim geometric sparks: spinning outlines
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
     Stages 1-3: four needles, a six-ray star. Stages 4-6: eight needles, an eight-ray star with a shock ring.
     Stage 7: sixteen needles in two volleys (a low row of nine, then a high row of six round a huge golden needle that
     fires last), a wide twelve-ray star with golden rays and a golden star sigil. Damage x1.08 from Adept, x1.15 at 7. */
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
    const K = TK.bind(H), P = K.P, e = K.evo(C), me = H.me, a = C.a, dir = [Math.cos(a), Math.sin(a)], per = [-dir[1], dir[0]], gold = e >= 7, N = K.lv(C, [4, 8, 16]), NR = K.lv(C, [6, 8, 12]), dk = C.base * C.K * K.evoK(C) * (e >= 7 ? 1.15 : e >= 4 ? 1.08 : 1);
    const T0 = 0.48, GAP = N > 8 ? 0.06 : N > 4 ? 0.075 : 0.09, nd = [];
    // the needles in rows (two volleys at Celestial: a low row of nine, then a high row of six round a huge golden centre)
    const rows = N === 16 ? [{ n: 9, sp: 0.4, f: 1.45, z: 1.0, app: 0.05, fire: T0 }, { n: 6, sp: 0.5, f: 1.1, z: 1.65, app: T0 + 0.15, fire: T0 + 9 * GAP + 0.3, centre: 1 }] : [{ n: N, sp: N > 4 ? 0.42 : 0.62, f: 1.45, z: 1.0, app: 0.05, fire: T0, mid: 1 }];
    let last = null; const order = [];
    rows.forEach(rw => { const list = [], n = rw.n;
      for (let i = 0; i < n; i++) { let o = (i - (n - 1) / 2) * rw.sp; if (rw.centre) o += o >= 0 ? 0.35 : -0.35; list.push({ o, f: rw.f + (1 - Math.cos(o / (rw.sp * n) * 2.4)) * 0.25 - Math.abs(o) * 0.1, z: rw.z + 0.18 * ((i % 2) ? 1 : -1) * 0.5, app: rw.app + Math.abs(o) * 0.05, fired: -1, big: 0 }); }
      if (rw.centre) { const B = { o: 0, f: rw.f - 0.15, z: rw.z + 0.35, app: rw.app + 0.3, fired: -1, big: 1 }; list.push(B); }
      // the firing order inside a row: outer pairs inward, the centre needle last
      list.sort((p, q) => Math.abs(q.o) - Math.abs(p.o) || p.big - q.big); list.forEach((n2, k) => { n2.ft = rw.fire + k * GAP; nd.push(n2); order.push(n2); }); });
    last = order[order.length - 1]; last.big = 1; if (N !== 16) last.z = 1.15;
    const wpos = n2 => [me.x + dir[0] * n2.f + per[0] * n2.o, me.y + dir[1] * n2.f + per[1] * n2.o];
    H.X.sfx.hum(); me.sq = 0.75;
    const shots = [], star = { t: -1, x: 0, y: 0, rays: null };
    const F = H.add({ life: last.ft + 1.3,
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
          if (!star.rays) { star.rays = []; for (let i = 0; i < NR; i++) { const b = i / NR * TAU + a, L2 = T * (i % 2 ? 1.05 : 1.55) * (gold ? (i % 2 ? 1.25 : 1.5) : 1); star.rays.push({ b, L2, s: Math.random() * 99 }); } }
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
          const aim = n2.aim != null ? n2.aim : Math.atan2(dir[1], dir[0]), ka = sinceF < 0 ? ap : 1 - sinceF / 0.16, big = n2.big && gold ? 2.0 : n2.big ? 1.15 : 1;
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
    order.forEach((n2, i) => H.X.after(n2.ft, () => { const list = picks(), isLast = n2 === last, m = list.length ? (isLast ? list[0] : list[i % list.length]) : null, p = wpos(n2), tx = m ? m.x : p[0] + dir[0] * 4.5, ty = m ? m.y : p[1] + dir[1] * 4.5;
      n2.fired = F.t; n2.aim = Math.atan2(H.sy(ty) - H.sy(p[1]) + n2.z * H.X.Tz(), H.sx(tx) - H.sx(p[0]));
      const s = { k: i, x0: p[0], y0: p[1], z0: n2.z, x1: tx, y1: ty, u: 0, dur: isLast ? 0.11 : 0.08, hist: [[p[0], p[1], n2.z]], big: isLast, gold: gold && isLast, done: 0 };
      s.scar = K.path(p[0], p[1], tx, ty, Math.random() * 99, 0.18, 8).map(q => q);   // (world units: a jagged line on the floor beneath the route)
      s.hit = () => { const b = Math.atan2(ty - p[1], tx - p[0]), d = Math.hypot(tx - p[0], ty - p[1]);
        H.hitLine(p[0], p[1], b, d + 0.3, 0.7, isLast ? dk * 0.7 : dk * 1.6 / (N - 1), C.dmgO({ kb: isLast ? 3 : 1, stun: isLast ? 0.3 : 0.05 })); K.sparks(tx, ty - 0.35, isLast ? 14 : 6, isLast ? 8 : 5); H.X.light(tx, ty, isLast ? 2.4 : 1.3, 0.14);
        if (isLast) { H.hitArea(tx, ty, gold ? 1.9 : 1.4, dk * 0.5, C.dmgO({ stun: 0.2 })); star.t = F.t; star.x = tx; star.y = ty; K.motes(tx, ty - 0.3, 10); H.X.flash(0.06, P.ice); H.X.shake(5, 0.14); H.X.hitstop(0.035); H.X.sfx.crash(); if (gold) K.goldSparks(tx, ty - 0.4, 18, 8); } else H.X.sfx.crack(); };
      shots.push(s); H.X.sfx.whoosh(); }));
  };
})();
