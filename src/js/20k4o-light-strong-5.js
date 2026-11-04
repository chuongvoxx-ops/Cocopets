/* ---------- Light (pink) Strongs, reworked: Ribbon Rendezvous (was Cathedral Chime), Sugar Rush (was Starpoint Volley) ----------
   Ribbon Rendezvous: two thin satin ribbons leave the pet for each chosen monster on separate curving paths, fluttering
   and twisting (a shaded pink upper face, a darker underside, pale reflective edges), sweep round it in opposite
   directions and meet at its front in one oversized bow: two rounded loops, a bright thick heart for the knot and two
   curling tails. The loops tighten (one direct Light hit and a short root: a held stun, a boss only slowed, by the kit's
   bind rule), the tails sway through the hold, then the knot flashes, the ribbons unravel into little hearts and a small
   burst goes off round that monster. 1 bow / 2 at Adept (a staggered flourish) / 3 at Celestial (pearl edging, rose-gold
   trim, star charms on the tails, the bursts in a quick sparkling sequence). Root 0.75 / 1.0 / 1.25 s (interpolated).
   Never two bows on one monster; with no monster in reach one bow ties itself at the aim and bursts there.
   Sugar Rush: tiny hearts spiral round the pet and a bright pink contour wraps it; then the real pet dashes through the
   monsters inside a pink comet (glow stamps along its actual path, wider with speed, tapering behind; two long pearly
   satin ribbons trailing; a small luminous heart at the leading point; afterimages of the pet), every contact a brief
   diagonal pink slice and a spray of hearts and stars. 1 pass / 2 at Adept (a returning diagonal) / 3 at Celestial (a
   zigzag through the group), joined at the real endpoints by visible curved turns. Each finished pass sheds a fan of
   hearts; at the final stop the ribbons curl round the pet and open into a soft heart outline. The pet is moved through
   the game's own `me.push` (moveEnt: walls stop it), each route is checked against walls before it starts and turned or
   shortened when blocked; it grants no invulnerability and lets go of the pet at once if anything else takes over
   (a dodge, a knock-back, death) and at its end.
   2D canvas: "3D" ribbons are twisted strips shaded per segment by their (computed) normal against the light, the knot
   is the shared thick spinning heart (LU1.thickHeart); no shaders, no meshes. */
(() => {
  const S = ELEM_IMPL.light.strong, TAU = Math.PI * 2;
  delete S.chime; delete S.starpoint;
  let H;
  const MAIN = '#FF69B4', BLOS = '#FFB7D5', DEEP = '#D94B91', PEARL = '#FFF0F7', LAV = '#D8B4FF', RG = '#E8AFB8', SHADE = '#8A2A5E';
  const cl = u => Math.max(0, Math.min(1, u)), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const mixS = (h1, h2, k) => { const a = hexRGB(h1), b = hexRGB(h2); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`; };
  const ramp = stops => { const out = []; for (let i = 0; i < 20; i++) { const s = i / 19; let j = 0; while (j < stops.length - 2 && s > stops[j + 1][0]) j++; const [s0, c0] = stops[j], [s1, c1] = stops[j + 1]; out.push(mixS(c0, c1, cl((s - s0) / (s1 - s0)))); } return out; };
  const TOP = ramp([[0, DEEP], [0.45, MAIN], [0.78, BLOS], [1, PEARL]]), UNDER = ramp([[0, '#6E1D4B'], [0.5, SHADE], [1, '#E070AE']]), PTOP = ramp([[0, '#E58BBE'], [0.5, BLOS], [1, '#FFFFFF']]);

  /* ---- a satin strip: samples {x, y, w (half width px), tw (twist), a}; each segment shaded by its 3D normal ---- */
  function strip(c, P, o) {
    const n = P.length; if (n < 2) return; o = o || {}; const K = globalThis.LU1, Lp = [], Rp = [], up = [], sh = [];
    for (let i = 0; i < n; i++) { const p = P[i], q0 = P[Math.max(0, i - 1)], q1 = P[Math.min(n - 1, i + 1)]; let tx = q1.x - q0.x, ty = q1.y - q0.y; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
      const nx = -ty, ny = tx, ct = Math.cos(p.tw), st = Math.sin(p.tw), hw = Math.max(0, p.w) * (0.16 + 0.84 * Math.abs(ct));
      Lp.push([p.x + nx * hw, p.y + ny * hw]); Rp.push([p.x - nx * hw, p.y - ny * hw]); up.push(ct >= 0);
      const dot = st * (nx * -0.5 + ny * -0.62) + ct * 0.6, seen = ct >= 0 ? dot : -dot, hl = o.hl != null ? Math.exp(-Math.pow(i / (n - 1) - o.hl, 2) / 0.006) * 0.35 : 0;
      sh.push(cl(0.3 + 0.75 * seen + hl)); }
    const A = o.a == null ? 1 : o.a;
    if (o.glow) for (let i = 0; i < n; i += 3) K.glowC(c, P[i].x, P[i].y, P[i].w * 3.2 + 2, o.glowCol || MAIN, o.glow * A * P[i].a);
    c.save(); c.lineJoin = 'round'; c.lineWidth = 0.9;
    for (let i = 0; i < n - 1; i++) { const a = Math.min(P[i].a, P[i + 1].a) * A; if (a < 0.02 || P[i].w + P[i + 1].w < 0.4) continue;
      const R = up[i] ? (o.pearl ? PTOP : TOP) : UNDER, col = R[Math.round(sh[i] * 19)]; c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.strokeStyle = col;
      c.beginPath(); c.moveTo(Lp[i][0], Lp[i][1]); c.lineTo(Lp[i + 1][0], Lp[i + 1][1]); c.lineTo(Rp[i + 1][0], Rp[i + 1][1]); c.lineTo(Rp[i][0], Rp[i][1]); c.closePath(); c.fill(); c.stroke(); }
    // pale reflective edges (Celestial: brighter pearl and a rose-gold inner trim)
    c.lineCap = 'butt';
    for (let i = 0; i < n - 1; i++) { const a = Math.min(P[i].a, P[i + 1].a) * A * (up[i] ? 0.8 : 0.35) * (o.edge || 1); if (a < 0.03) continue; const w = Math.max(0.8, P[i].w * 0.22);
      c.globalAlpha = Math.min(1, a); c.strokeStyle = PEARL; c.lineWidth = w; c.beginPath(); c.moveTo(Lp[i][0], Lp[i][1]); c.lineTo(Lp[i + 1][0], Lp[i + 1][1]); c.stroke();
      c.globalAlpha = Math.min(1, a * 0.55); c.beginPath(); c.moveTo(Rp[i][0], Rp[i][1]); c.lineTo(Rp[i + 1][0], Rp[i + 1][1]); c.stroke();
      if (o.trim && up[i]) { c.globalAlpha = Math.min(1, a * 0.7 * o.trim); c.strokeStyle = RG; c.lineWidth = Math.max(0.6, w * 0.6); c.beginPath(); c.moveTo(lerp(Lp[i][0], P[i].x, 0.45), lerp(Lp[i][1], P[i].y, 0.45)); c.lineTo(lerp(Lp[i + 1][0], P[i + 1].x, 0.45), lerp(Lp[i + 1][1], P[i + 1].y, 0.45)); c.stroke(); } }
    c.restore();
  }
  /* draw only the runs of samples marked behind (back = true) or in front */
  function runs(c, P, back, o) { let cur = []; for (let i = 0; i < P.length; i++) { if (!!P[i].back === back) { if (!cur.length && i > 0) cur.push(P[i - 1]); cur.push(P[i]); } else if (cur.length) { cur.push(P[i]); strip(c, cur, o); cur = []; } } if (cur.length > 1) strip(c, cur, o); }
  /* world point for a screen point near a monster/pet standing at (wx, wy) (for the heart particles) */
  const toW = (wx, wy, X, Y, T) => { const dy = H.sy(wy) - Y; return dy >= 0 ? [wx + (X - H.sx(wx)) / T, wy, dy / T] : [wx + (X - H.sx(wx)) / T, wy - dy / T, 0]; };
  const floorBlit = (c, img, x, y, w, a) => globalThis.LU1.blitC(c, img, x, y, w, w * H.GY, a, true);

  /* ================= 9. Ribbon Rendezvous ================= */
  S.ribbonrendezvous = (C, h) => {
    H = h; const K = globalThis.LU1; K.setH(H); const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, NB = tier;
    const DK = C.base * C.K * (1 + 0.08 * (ev - 1)), HIT = DK * 1.0, BURST = DK * 1.5 * [1, 0.8, 0.7][tier - 1], RB = 1.25 + 0.05 * (ev - 1);
    const ROOT = 0.75 + (ev - 1) / 12, STG = tier === 3 ? 0.16 : 0.2, TL0 = 0.26, TR = 0.4, TW = 0.26, TB = 0.2, SB = 0.6;
    const rich = (ev - 1) / 6, wk = 1 + 0.12 * rich, B = K.bits();
    // targets: the living monsters in reach nearest the aim, one bow each (fewer monsters, fewer bows)
    const RANGE = 8.5, cand = H.living().filter(m => Math.hypot(m.x - me.x, m.y - me.y) < RANGE + m.r);
    let tg = H.sortNear(C.tx, C.ty, cand).slice(0, NB); if (!tg.length) tg = [{ x: C.tx, y: C.ty, r: 0.42, fake: true }];
    const bows = tg.map((m, i) => { const tl = TL0 + i * STG, th = tl + TR + TW + TB; return { i, m, x: m.x, y: m.y, rr: Math.max(0.28, Math.min(0.85, m.r || 0.4)), tl, th, tb: th + ROOT, hit: false, burst: false, sd: i * 2.3 + 1 }; });
    const END = Math.max(...bows.map(b => b.tb)) + 0.75;
    H.X.sfx.hum && H.X.sfx.hum(); me.sq = Math.max(me.sq || 0, 0.6);
    const pops = [];
    function geo(b, T) { const X = H.sx(b.x), Yg = H.sy(b.y), r = b.rr * T, cx = X, cy = Yg + r * 0.12; return { X, Yg, r, cx, cy, rx: r * 1.12 + T * 0.05, ry: r * 0.42 + T * 0.02, foot: Yg + r * 0.82 }; }
    /* the two streams of a bow at time t, as strip samples (back = behind the monster) */
    function streams(b, t, T) {
      const G = geo(b, T), p = cl((t - b.tl) / (TR + TW)); if (t < b.tl) return [];
      const tight = b.hit ? Math.max(0, Math.sin(cl((t - b.th + 0.05) / 0.25) * Math.PI)) : 0, rx = G.rx * (1 - 0.1 * tight), ry = G.ry * (1 - 0.1 * tight);
      const sx0 = H.sx(me.x), sy0 = H.sy(me.y) - T * 0.32, out = [];
      for (const sg of [1, -1]) {
        const th0 = sg > 0 ? Math.PI : 0, ex = G.cx + rx * Math.cos(th0), ey = G.cy + ry * Math.sin(th0), mx = (sx0 + ex) / 2, my = (sy0 + ey) / 2, dx = ex - sx0, dy = ey - sy0, dl = Math.hypot(dx, dy) || 1;
        let px = -dy / dl, py = dx / dl; if (px * -sg < 0) { px = -px; py = -py; }   // ribbon A bends out on the left, B on the right
        const cxp = mx + px * dl * 0.42, cyp = my + py * dl * 0.42 - T * 0.9;
        const sh = 1 - Math.pow(1 - p, 1.6), stl = p < 1 ? Math.min(sh - 0.06, Math.max(sh - 0.5, SB * sm((p - 0.35) / 0.65))) : SB, settled = p >= 1, N = 30, P = [];
        for (let j = 0; j <= N; j++) { const s = lerp(Math.max(0, stl), sh, j / N); let x, y, tw, back = false;
          if (s < SB) { const u = s / SB, a1 = 1 - u; x = a1 * a1 * sx0 + 2 * a1 * u * cxp + u * u * ex; y = a1 * a1 * sy0 + 2 * a1 * u * cyp + u * u * ey;
            const fl = T * 0.07 * Math.sin(u * Math.PI) * Math.sin(s * 30 - t * 20 + sg); x += px * fl; y += py * fl; tw = s * 10 - t * 6 + sg; }
          else { const v = (s - SB) / (1 - SB), th = th0 + sg * v * 1.5 * Math.PI; x = G.cx + rx * Math.cos(th); y = G.cy + ry * Math.sin(th); back = Math.sin(th) < -0.04; tw = 0.25 + 0.2 * Math.sin(th * 2 + t * 2); }
          const head = cl((sh - s) / 0.1), tail = settled ? cl((s - stl) / 0.04 + 0.4) : cl((s - stl) / 0.12);
          P.push({ x, y, w: T * 0.085 * wk * Math.min(head, tail) * (s < SB ? 0.85 : 1), tw, a: 1, back }); }
        out.push(P); }
      return out;
    }
    /* the bow: loops and tails round the knot (screen), size Sz, growth g, tightness k */
    function bowParts(b, Kx, Ky, Sz, g, k, t) {
      const L = [];
      for (const s of [1, -1]) { const ph = s > 0 ? -0.26 : Math.PI + 0.26, cp = Math.cos(ph), sp = Math.sin(ph), Ll = Sz * 0.52 * g * (1 - 0.12 * k), Wl = Sz * 0.31 * g * (1 - 0.3 * k) * (1 + 0.05 * Math.sin(t * 3 + b.sd + s)), P = [];
        for (let j = 0; j <= 22; j++) { const th = j / 22 * TAU, lx = Ll * (1 - Math.cos(th)) / 2, ly = -s * Wl / 2 * Math.sin(th);
          P.push({ x: Kx + lx * cp - ly * sp, y: Ky + lx * sp + ly * cp, w: Sz * 0.12 * wk * g * (0.5 + 0.5 * Math.min(1, Math.sin(th / 2) * 2.2)), tw: lerp(0.2, Math.PI - 1.05, sm((th - 0.82 * Math.PI) / (0.36 * Math.PI))), a: 1 }); }
        L.push({ kind: 'loop', s, P }); }
      for (const s of [1, -1]) { const P = []; let x = Kx + s * Sz * 0.04, y = Ky + Sz * 0.05, ang = Math.PI / 2 - s * 0.62; const Lt = Sz * 0.64 * g, st = Lt / 12;
        for (let j = 0; j <= 12; j++) { const u = j / 12; P.push({ x, y, w: Sz * 0.115 * wk * g * (1 - 0.45 * u), tw: 0.35 + s * 1.4 * u + Math.sin(t * 2.4 + u * 3 + s) * 0.5, a: u > 0.82 ? 1 - (u - 0.82) / 0.18 * 0.85 : 1 });
          ang = Math.PI / 2 - s * 0.62 - s * 0.55 * u + Math.sin(t * 3.1 + u * 2.6 + b.sd + s) * 0.3 * u; x += Math.cos(ang) * st; y += Math.sin(ang) * st; }
        L.push({ kind: 'tail', s, P }); }
      return L;
    }
    function release(b) { // the knot flashes, the ribbons unravel into hearts, a small burst round the monster
      b.burst = true; const T = H.X.Tz(), G = geo(b, T);
      H.hitArea(b.x, b.y, RB, BURST, C.dmgO({ kb: 2 }));
      if (b.parts) for (const pt of b.parts) for (let j = 0; j < pt.P.length; j += 3) { const q = pt.P[j], w = toW(b.x, b.y, q.x, q.y, T), bb = Math.random() * TAU; B.add(w[0], w[1], w[2], { vx: Math.cos(bb) * (0.8 + Math.random()), vy: Math.sin(bb) * 0.5, vz: 1 + Math.random() * 1.6, g: 1.6, drag: 2.2, life: 0.5 + Math.random() * 0.45, s: 0.06 + Math.random() * 0.05, kind: j % 2 ? 'h' : 's', col: [MAIN, BLOS, PEARL, tier === 3 ? LAV : DEEP][j % 4], rot: 0.5 }); }
      const kz = (G.Yg - (G.cy + G.ry)) / T, nb = H.n(3);
      for (let q = 0; q < nb; q++) { const bb = -Math.PI / 2 + (q - 1) * 0.9 + (Math.random() - 0.5) * 0.4; B.add(b.x, b.y, Math.max(0, kz) + 0.1, { vx: Math.cos(bb) * 2.2, vy: Math.sin(bb) * 0.6, vz: 2.4 + Math.random(), g: 2.2, drag: 2.4, life: 0.85 + q * 0.12, s: 0.18 + Math.random() * 0.05, kind: 'h', col: q % 2 ? BLOS : MAIN, rot: 0.6 }); }
      const ng = H.n(10 + 3 * tier); for (let q = 0; q < ng; q++) { const bb = Math.random() * TAU, v = 2 + Math.random() * 3; B.add(b.x, b.y, 0.35, { vx: Math.cos(bb) * v, vy: Math.sin(bb) * v * 0.55, vz: 1 + Math.random() * 2, g: 3, drag: 2.6, life: 0.35 + Math.random() * 0.35, s: 0.05 + Math.random() * 0.04, kind: 's', col: q % 3 ? PEARL : BLOS }); }
      H.burst(b.x, b.y - 0.35, 'spark', 6 + tier * 2, { v: 5, up: 1.5, g: 8, life: 0.3, size: 1.6, color: [PEARL, BLOS, MAIN] });
      pops.push({ x: b.x, y: b.y, t: 0, big: true, r: RB }); H.X.light(b.x, b.y, RB * 1.4, 0.3); H.X.shake(2.5, 0.08); H.X.sfx.sparkle && H.X.sfx.sparkle(); H.X.sfx.chirp && H.X.sfx.chirp();
    }
    H.add({ life: END, x: me.x, y: me.y,
      update(dt, f) { const t = f.t; B.step(dt); for (let k = pops.length - 1; k >= 0; k--) { pops[k].t += dt; if (pops[k].t > 0.7) pops.splice(k, 1); }
        // gathering: tiny hearts spiral into the pet's chest before the ribbons leave
        if (t < TL0 + (NB - 1) * STG && Math.random() < dt * 22 * H.Q()) { const bb = Math.random() * TAU; B.add(me.x + Math.cos(bb) * 0.8, me.y + Math.sin(bb) * 0.35, 0.3 + Math.random() * 0.4, { vx: -Math.cos(bb) * 2.2, vy: -Math.sin(bb) * 1, vz: 0.4, drag: 1.5, life: 0.35, s: 0.05 + Math.random() * 0.03, kind: Math.random() < 0.6 ? 'h' : 's', col: Math.random() < 0.5 ? BLOS : MAIN }); }
        for (const b of bows) { const m = b.m;
          if (!m.fake && !m.dead && !b.burst) { b.x = m.x; b.y = m.y; }   // the bow follows its monster (never drags it)
          if (t >= b.tl && !b.launched) { b.launched = true; H.X.sfx.whoosh(); me.sq = Math.max(me.sq || 0, 0.7); }
          if (t >= b.th && !b.hit) { b.hit = true; if (!m.fake && !m.dead) { H.X.hitMon(m, HIT, C.dmgO({ kb: 0 })); if (m.boss) H.bind(m, ROOT); else m.stun = Math.max(m.stun || 0, ROOT); }
            pops.push({ x: b.x, y: b.y, t: 0, big: false, r: 0.8 }); H.X.light(b.x, b.y, 1.4, 0.2); H.X.sfx.chirp && H.X.sfx.chirp(); H.X.hitstop && H.X.hitstop(0.02);
            const nb = H.n(6); for (let q = 0; q < nb; q++) { const bb = Math.random() * TAU; B.add(b.x, b.y, 0.25, { vx: Math.cos(bb) * 2.4, vy: Math.sin(bb), vz: 1 + Math.random(), g: 3, drag: 2.5, life: 0.4, s: 0.05, kind: 's', col: PEARL }); } }
          if (t >= b.tb && !b.burst) release(b); } },
      drawUnder(c, f, X0, Y0, T) { const t = f.t;
        for (const b of bows) { if (t < b.tl) continue; const ua = b.burst ? 1 - cl((t - b.tb) / 0.42) : 1; if (ua <= 0) continue;
          for (const P of streams(b, t, T)) runs(c, P, true, { a: ua * 0.92, edge: 0.7, trim: tier === 3 ? 0.6 : 0 });   // the far side of the wrap, behind the monster
          if (b.hit) { const G = geo(b, T), u = cl((t - b.th) / 0.5); floorBlit(c, K.lineSpr(), G.X, G.foot, T * (0.9 + 0.9 * u) * b.rr * 2.2, (1 - u) * 0.7 * ua); K.blitC(c, glowSprite(MAIN), G.X, G.foot, T * 1.8 * b.rr * 2, T * 1.8 * b.rr * 2 * H.GY, 0.22 * ua, true); } }
        for (const p of pops) { if (!p.big) continue; const u = p.t / 0.7, X = H.sx(p.x), Y = H.sy(p.y) + T * 0.3; floorBlit(c, K.lineSpr(), X, Y, T * p.r * 2.6 * H.ease.out(cl(u * 1.4)), (1 - u) * 0.9); K.blitC(c, glowSprite(MAIN), X, Y, T * p.r * 3, T * p.r * 3 * H.GY, 0.4 * (1 - u), true); } },
      draw(c, f, X0, Y0, T) { const t = f.t, ga = cl(t / 0.15) * cl((TL0 + (NB - 1) * STG + 0.3 - t) / 0.3);
        if (ga > 0.01) { const px = H.sx(me.x), py = H.sy(me.y) - T * 0.32; K.glowC(c, px, py, T * (0.5 + 0.3 * Math.sin(t * 18)), MAIN, 0.35 * ga); K.glowC(c, px, py, T * 0.22, PEARL, 0.6 * ga); }
        for (const b of bows) { if (t < b.tl) continue; const G = geo(b, T), ua = b.burst ? 1 - cl((t - b.tb) / 0.42) : 1; if (ua <= 0) continue;
          const o = { a: ua, edge: tier === 3 ? 1.35 : 1, trim: tier === 3 ? 1 : 0, hl: (t * 0.7 + b.sd) % 1.4 - 0.2, glow: 0.08 + 0.06 * rich };
          for (const P of streams(b, t, T)) runs(c, P, false, o);
          // the bow forms where the ribbons meet (front of the monster)
          const gT = t - (b.th - TB); if (gT <= 0) continue;
          const g = Math.max(0, H.ease.back(cl(gT / TB))) * (1 - 0.35 * (1 - ua)), k = b.hit ? Math.max(0, Math.sin(cl((t - b.th + 0.05) / 0.25) * Math.PI)) : 0, Sz = b.rr * T * 1.9 * (1 + 0.04 * (ev - 1));
          const Kx = G.cx, Ky = G.cy + G.ry * 0.95 * (1 - 0.1 * k), parts = bowParts(b, Kx, Ky, Sz, g * (b.burst ? 1 + 0.25 * (1 - ua) : 1), k, t); b.parts = parts;
          for (const pt of parts) if (pt.kind === 'tail') strip(c, pt.P, Object.assign({}, o, { hl: null }));
          for (const pt of parts) if (pt.kind === 'loop') strip(c, pt.P, o);
          // Celestial: little star charms swinging at the tail ends
          if (tier === 3) for (const pt of parts) if (pt.kind === 'tail') { const q = pt.P[pt.P.length - 1]; K.blitC(c, K.starSpr(pt.s > 0 ? PEARL : BLOS), q.x, q.y + Sz * 0.05, Sz * 0.3, Sz * 0.3, 0.95 * ua * g, true); K.glowC(c, q.x, q.y + Sz * 0.05, Sz * 0.16, RG, 0.4 * ua * g); }
          // the knot: the thick pink heart, flaring at the hit and at the release
          const fl = b.burst ? Math.max(0, 1 - (t - b.tb) / 0.25) : 0, lit = Math.max(k * 0.7, fl);
          K.thickHeart(c, Kx, Ky - Sz * 0.03, Sz * 0.34 * Math.min(1, g * 1.1) * (1 + 0.25 * fl), 0.35 * Math.sin(t * 2.2 + b.sd), 0.08 * Math.sin(t * 1.7 + b.sd), Math.min(1, ua * 1.4), lit, (t * 0.5 + b.sd) % 1);
          if (lit > 0.02) { K.glowC(c, Kx, Ky, Sz * (0.5 + 0.6 * fl), PEARL, 0.6 * lit); K.glowC(c, Kx, Ky, Sz * 1.1, MAIN, 0.35 * lit); }
          if (fl > 0) K.blitC(c, K.lineSpr(), Kx, Ky, Sz * (0.5 + 1.6 * (1 - fl)), Sz * (0.5 + 1.6 * (1 - fl)), fl, true); }
        for (const p of pops) { const u = p.t / (p.big ? 0.7 : 0.4); if (u >= 1) continue; const X = H.sx(p.x), Y = H.sy(p.y) - T * 0.3; K.glowC(c, X, Y, T * (p.big ? 1.1 : 0.6) * (0.6 + 0.6 * u), MAIN, 0.5 * (1 - u)); K.glowC(c, X, Y, T * 0.35, PEARL, 0.8 * (1 - u) * (1 - u)); }
        B.draw(c, T); } });
  };

  /* ================= 10. Sugar Rush ================= */
  S.sugarrush = (C, h) => {
    H = h; const K = globalThis.LU1; K.setH(H); const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, NP = tier, rich = (ev - 1) / 6;
    const DK = C.base * C.K * (1 + 0.08 * (ev - 1)), DPASS = DK * [2.5, 1.4, 1.0][tier - 1], TF = 0.34, TT = 0.13, TS = 0.14, TRL = 0.3 + 0.05 * tier, RIB = 0.42 + 0.1 * tier + 0.05 * rich;
    const B = K.bits(), hist = [], slices = [];
    H.X.sfx.hum && H.X.sfx.hum(); me.sq = Math.max(me.sq || 0, 0.7);
    // the group it rushes through: the monsters nearest the aim, followed as they move
    const RANGE = 7.5, group0 = H.sortNear(C.tx, C.ty, H.living().filter(m => Math.hypot(m.x - me.x, m.y - me.y) < RANGE + m.r)).slice(0, 4);
    const reach = (x, y, a, max) => { let L = 0; while (L < max && !H.X.blocked(x + Math.cos(a) * (L + 0.2), y + Math.sin(a) * (L + 0.2), 0.42, 0)) L += 0.2; return L; };
    let push = null, prevAng = C.a;
    const hold = (vx, vy) => { push = me.push = { vx, vy, t: 0.12, sugar: true }; };
    const letGo = () => { if (push && me.push === push) me.push = null; push = null; me.vx = 0; me.vy = 0; };
    function aimFor(k) { const zig = k === 0 ? 0 : k % 2 ? 1 : -1;
      // the monster to cut through: the first pass the one nearest the aim, later ones the nearest not struck by the pass before (never one right on top of the pet)
      let L = group0.filter(m => !m.dead); if (!L.length) L = H.sortNear(me.x, me.y).filter(m => Math.hypot(m.x - me.x, m.y - me.y) < RANGE).slice(0, 3);
      const last = st.pass ? st.pass.hits : null, pick = (k === 0 ? L : H.sortNear(me.x, me.y, L)).filter(m => Math.hypot(m.x - me.x, m.y - me.y) > 0.9), m = pick.find(q => !last || !last.has(q)) || pick[0];
      if (!m) return { ang: k ? prevAng + Math.PI + zig * 0.85 : C.a, len: k ? 3.4 : 4.2 };
      const d = Math.hypot(m.x - me.x, m.y - me.y); return { ang: Math.atan2(m.y - me.y, m.x - me.x) + zig * 0.22, len: Math.max(2.4, Math.min(5.2, d + 1.5)) }; }
    function validate(ang, len) { let best = null; for (const da of [0, 0.45, -0.45, 0.9, -0.9]) { const r = reach(me.x, me.y, ang + da, len + 0.3) - 0.15; if (r >= Math.min(len, 2)) return { ang: ang + da, len: Math.min(len, r) }; if (!best || r > best.len) best = { ang: ang + da, len: r }; } return best; }
    const st = { ph: 'form', k: 0, pass: null, next: null, t0: 0, ghostT: 0, done: false };
    function startPass(t) { const want = st.next || aimFor(st.k), v = validate(want.ang, want.len); st.next = null;
      if (!v || v.len < 0.8) { st.ph = 'settle'; st.t0 = t; st.sdir = prevAng; return; }
      st.pass = { x0: me.x, y0: me.y, ang: v.ang, len: v.len, dur: 0.14 + v.len / 20, hits: new Set(), k: st.k }; st.ph = 'pass'; st.t0 = t; prevAng = v.ang; H.X.sfx.whoosh(); }
    const ePos = u => 0.3 * u + 0.7 * (1 - (1 - u) * (1 - u));
    function finishPass(t) { const p = st.pass; // a small fan of trailing hearts where the pass ends
      const nb = H.n(5 + tier); for (let q = 0; q < nb; q++) { const bb = p.ang + Math.PI + (q / (nb - 1) - 0.5) * 1.3; B.add(me.x, me.y, 0.35 + Math.random() * 0.2, { vx: Math.cos(bb) * 2.4, vy: Math.sin(bb) * 1.2, vz: 0.8 + Math.random() * 0.8, g: 0.8, drag: 2, life: 0.6 + Math.random() * 0.3, s: 0.08 + (q === (nb >> 1) ? 0.06 : 0), kind: q % 3 === 2 ? 's' : 'h', col: [MAIN, BLOS, PEARL][q % 3], rot: 0.5 }); }
      st.k++; if (st.k >= NP) { st.ph = 'settle'; st.t0 = t; st.sdir = p.ang; return; }
      st.next = aimFor(st.k); st.ph = 'turn'; st.t0 = t; st.a0 = p.ang; }
    function stop(t) { letGo(); st.ph = 'end'; st.t0 = t; F.life = 0.75; H.X.sfx.chirp && H.X.sfx.chirp(); }
    let px0 = me.x, py0 = me.y;
    const F = H.add({ life: 8, x: me.x, y: me.y,
      update(dt, f) { const t = f.t; B.step(dt); for (let i = slices.length - 1; i >= 0; i--) if (t - slices[i].t0 > 0.3) slices.splice(i, 1);
        f.x = me.x; f.y = me.y;
        if (st.ph !== 'end') {
          // interrupted (a dodge, another dash, a knock-back, death, a cut-scene): let go at once
          if (me.dead || me.dodge || me.dash || me.leap || (push && me.push !== push) || H.g.cineT > 0 || H.g.won) { stop(t); return; }
          const mv = Math.hypot(me.x - px0, me.y - py0), v = mv / Math.max(1e-4, dt);
          if (mv > 0.001 || !hist.length) hist.push({ x: me.x, y: me.y, t, v }); else hist[hist.length - 1].t = t;
          // the swept hit along the real path this frame: each monster at most once per pass
          if (st.pass && (st.ph === 'pass' || st.ph === 'turn') && mv > 0.001) { const P = st.pass, ax = px0, ay = py0, bx = me.x - ax, by = me.y - ay, L2 = bx * bx + by * by;
            for (const m of H.living()) { if (P.hits.has(m)) continue; const u = cl(((m.x - ax) * bx + (m.y - ay) * by) / L2), d = Math.hypot(m.x - ax - bx * u, m.y - ay - by * u); if (d > m.r + 0.55) continue;
              P.hits.add(m); H.X.hitMon(m, DPASS, C.dmgO({ kb: 1.2 })); slices.push({ x: m.x, y: m.y, t0: t, ang: P.ang, s: slices.length % 2 ? 1 : -1, big: m.boss || m.r > 0.6 });
              const ns = H.n(7 + 2 * tier); for (let q = 0; q < ns; q++) { const bb = P.ang + (Math.random() - 0.5) * 2.2, sp = 2 + Math.random() * 3.5; B.add(m.x, m.y, 0.4 + Math.random() * 0.3, { vx: Math.cos(bb) * sp, vy: Math.sin(bb) * sp * 0.6, vz: 1.2 + Math.random() * 2, g: 4, drag: 2.6, life: 0.35 + Math.random() * 0.35, s: q < 2 ? 0.15 : 0.06 + Math.random() * 0.04, kind: q % 3 ? 's' : 'h', col: [PEARL, BLOS, MAIN][q % 3], rot: 0.6 }); }
              H.X.light(m.x, m.y, 1.3, 0.18); H.X.shake(2, 0.06); if (P.hits.size < 3) H.X.sfx.sparkle && H.X.sfx.sparkle(); } }
        }
        px0 = me.x; py0 = me.y;
        while (hist.length && t - hist[0].t > Math.max(TRL, RIB) + 0.05) hist.shift();
        if (st.ph === 'form') { hold(0, 0); if (Math.random() < dt * 26 * H.Q()) { const bb = Math.random() * TAU; B.add(me.x + Math.cos(bb) * 0.9, me.y + Math.sin(bb) * 0.4, 0.25 + Math.random() * 0.5, { vx: -Math.sin(bb) * 2.6 - Math.cos(bb) * 1.2, vy: Math.cos(bb) * 1.2 - Math.sin(bb) * 0.5, vz: 0.3, drag: 1.6, life: 0.4, s: 0.05 + Math.random() * 0.03, kind: Math.random() < 0.65 ? 'h' : 's', col: Math.random() < 0.5 ? BLOS : MAIN }); }
          if (t >= TF) startPass(t); }
        if (st.ph === 'pass') { const P = st.pass, u = cl((t - st.t0) / P.dur), e = ePos(u), tx = P.x0 + Math.cos(P.ang) * P.len * e, ty = P.y0 + Math.sin(P.ang) * P.len * e;
          let vx = (tx - me.x) / Math.max(dt, 1e-3), vy = (ty - me.y) / Math.max(dt, 1e-3); const vm = Math.hypot(vx, vy); if (vm > 30) { vx *= 30 / vm; vy *= 30 / vm; }
          hold(vx, vy); me.vx = vx; me.vy = vy; if (Math.abs(vx) > 0.5) me.face = vx > 0 ? 1 : -1;
          // a wall the route check missed (a monster's barrier, a closing door): cut the pass short
          if (u > 0.2 && Math.hypot(tx - me.x, ty - me.y) > 0.7) { finishPass(t); return; }
          st.ghostT -= dt; if (st.ghostT <= 0) { st.ghostT = 0.05; H.P({ kind: 'afterP', x: me.x, y: me.y, vx: 0, vy: 0, life: 0.22, max: 0.22, size: 1, color: MAIN, face: me.face, rot: me.tilt || 0 }); H.P({ kind: 'ghost', x: me.x, y: me.y - 0.1, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 1, color: MAIN }); }
          if (u >= 1) finishPass(t); }
        else if (st.ph === 'turn') { const u = cl((t - st.t0) / TT), a = st.a0 + H.wrap(st.next.ang - st.a0) * sm(u), sp = 4.2; hold(Math.cos(a) * sp, Math.sin(a) * sp); me.vx = Math.cos(a) * sp; me.vy = Math.sin(a) * sp;
          if (u >= 1) startPass(t); }
        else if (st.ph === 'settle') { const u = cl((t - st.t0) / TS), sp = 4.2 * (1 - u); hold(Math.cos(st.sdir) * sp, Math.sin(st.sdir) * sp); me.vx = Math.cos(st.sdir) * sp; me.vy = 0;
          if (u >= 1) stop(t); } },
      onEnd() { letGo(); },
      drawUnder(c, f, X0, Y0, T) { const t = f.t, px = H.sx(me.x), py = H.sy(me.y), ea = st.ph === 'end' ? 1 - cl((t - st.t0) / 0.5) : 1, fa = cl(t / TF);
        // pink light on the floor under the pet, and the bright core of the comet behind it
        K.blitC(c, glowSprite(MAIN), px, py + T * 0.2, T * 2.4, T * 2.4 * H.GY, 0.4 * fa * ea, true);
        // the comet's tail: soft stamps along the real path, wider with speed, thinning and fading behind
        if (hist.length > 1) { for (let i = hist.length - 1; i > 0; i--) { const q0 = hist[i - 1], q1 = hist[i], ag = t - q1.t; if (ag > TRL) break; const x0 = H.sx(q0.x), y0 = H.sy(q0.y) - T * 0.3, x1 = H.sx(q1.x), y1 = H.sy(q1.y) - T * 0.3, dl = Math.hypot(x1 - x0, y1 - y0), ns = Math.max(1, Math.ceil(dl / (T * 0.12)));
            for (let j = 0; j < ns; j++) { const u = j / ns, x = lerp(x1, x0, u), y = lerp(y1, y0, u), agu = ag + (q1.t - q0.t) * u, k = 1 - agu / TRL; if (k <= 0) continue; const r = T * (0.2 + Math.min(0.32, 0.016 * q1.v)) * Math.pow(k, 0.6) * (1 + 0.1 * tier);
              K.glowC(c, x, y, r * 1.6, MAIN, 0.22 * k); K.glowC(c, x, y, r * 0.5, PEARL, 0.3 * k * k); } } }
        // two long pearly ribbons trailing behind the pet
        if (hist.length > 2) for (const sd of [1, -1]) { const P = []; for (let i = hist.length - 1; i >= 0; i--) { const q = hist[i], ag = t - q.t; if (ag > RIB) break; const q0 = hist[Math.max(0, i - 1)], q1 = hist[Math.min(hist.length - 1, i + 1)]; let dx = q1.x - q0.x, dy = q1.y - q0.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
            const u = ag / RIB, off = T * (0.14 + 0.1 * Math.sin(ag * 16 + sd * 1.3) + 0.12 * u) * sd; P.push({ x: H.sx(q.x) - dy * off, y: H.sy(q.y) - T * (0.32 + 0.06 * Math.sin(ag * 11 + sd)) + dx * off * 0.6, w: T * 0.055 * (1 + 0.3 * rich) * (1 - 0.6 * u) * cl(ag / 0.03 + 0.2), tw: ag * 18 + sd, a: (1 - u) * ea }); }
          if (P.length > 2) strip(c, P, { pearl: true, edge: 0.9, trim: tier === 3 ? 0.8 : 0 }); }
        // the finale ribbons' far side (behind the pet)
        if (st.ph === 'end') { const fr = finale(t, T); for (const P of fr) runs(c, P, true, { a: 0.9, pearl: true }); } },
      draw(c, f, X0, Y0, T) { const t = f.t, px = H.sx(me.x), py = H.sy(me.y) - T * 0.32, moving = st.ph === 'pass' || st.ph === 'turn';
        // formation: the contour draws itself round the pet, then holds through the rush (thin, so the pet stays visible)
        const fa = cl(t / TF), ea = st.ph === 'end' ? 1 - cl((t - st.t0) / 0.35) : 1;
        if (ea > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const rx = T * 0.5, ry = T * 0.62, a0 = -Math.PI / 2 + t * 4, span = TAU * Math.min(1, fa * 1.05);
          for (const [col, lw, al] of [[MAIN, T * 0.16, 0.16], [MAIN, T * 0.07, 0.4], [BLOS, Math.max(1, T * 0.025), 0.75]]) { c.globalAlpha = al * ea * (moving ? 1 : 0.8); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.ellipse(px, py, rx, ry, 0, a0, a0 + span); c.stroke(); }
          c.restore(); K.glowC(c, px, py, T * 0.85, MAIN, 0.16 * fa * ea); }
        // the small luminous heart at the leading point
        if (moving || st.ph === 'settle') { const a = st.ph === 'turn' ? st.a0 + H.wrap(st.next.ang - st.a0) * sm((t - st.t0) / TT) : st.ph === 'settle' ? st.sdir : st.pass.ang, hx = px + Math.cos(a) * T * 0.62, hy = py + Math.sin(a) * T * 0.4, la = st.ph === 'settle' ? 1 - cl((t - st.t0) / TS) : 1;
          K.glowC(c, hx, hy, T * 0.5, MAIN, 0.5 * la); K.thickHeart(c, hx, hy, T * (0.3 + 0.05 * tier), t * 7, Math.cos(a) * 0.3, 0.95 * la, 0.3, (t * 1.2) % 1); K.glowC(c, hx, hy, T * 0.16, PEARL, 0.7 * la); }
        // the cutting slices: a brief diagonal crescent across each monster struck
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt';
        for (const s of slices) { const age = t - s.t0, gro = cl(age / 0.07), fd = 1 - cl((age - 0.08) / 0.2); if (fd <= 0) continue; const X = H.sx(s.x), Y = H.sy(s.y) - T * 0.35, L = T * (s.big ? 1.0 : 0.7), d = s.ang + s.s * 0.9 + Math.PI / 2, ux = Math.cos(d), uy = Math.sin(d), bx = -uy * L * 0.28, by = ux * L * 0.28, N = 10;
          const pts = []; for (let j = 0; j <= N; j++) { const u = j / N, v = u * 2 - 1, bend = 1 - v * v; pts.push([X + ux * L * v + bx * bend, Y + uy * L * v * 0.7 + by * bend]); }
          const j0 = Math.floor(N * Math.max(0, gro - 0.6) * (age > 0.08 ? 1 + (age - 0.08) * 2 : 1)), j1 = Math.round(N * gro);
          for (const [col, wk, al] of [[MAIN, 3, 0.25], [MAIN, 1.2, 0.7], [PEARL, 0.45, 0.95]]) { c.strokeStyle = col; for (let j = Math.min(j0, N - 1); j < j1; j++) { const u = (j + 0.5) / N; c.globalAlpha = al * fd; c.lineWidth = Math.max(0.8, T * 0.11 * wk * Math.sin(u * Math.PI)); c.beginPath(); c.moveTo(pts[j][0], pts[j][1]); c.lineTo(pts[j + 1][0], pts[j + 1][1]); c.stroke(); } }
          K.glowC(c, X, Y, T * 0.7, MAIN, 0.45 * fd); K.glowC(c, X, Y, T * 0.25, PEARL, 0.7 * fd * (1 - gro * 0.5)); }
        c.restore();
        // the final stop: the ribbons curl round the pet and open into a soft heart outline
        if (st.ph === 'end') { for (const P of finale(t, T)) runs(c, P, false, { a: 1, pearl: true, edge: 1.1, trim: tier === 3 ? 1 : 0 });
          const u = cl((t - st.t0 - 0.2) / 0.5); if (u > 0) { const sz = T * (0.9 + 1.5 * H.ease.out(u)); K.blitC(c, K.lineSpr(), px, py - T * 0.05, sz, sz, (1 - u) * 0.9, true); K.glowC(c, px, py, T * 0.9, BLOS, 0.25 * (1 - u)); } }
        B.draw(c, T); } });
    /* the finale: two ribbons spiralling in round the pet's body, unwinding as the heart outline opens */
    function finale(t, T) { const u = cl((t - st.t0) / 0.55), px = H.sx(me.x), py = H.sy(me.y) - T * 0.3, out = []; if (u >= 1) return out;
      for (const sd of [0, 1]) { const P = [], a0 = sd * Math.PI + u * 5, span = Math.PI * (1.3 - 0.6 * u), rx = T * (0.75 - 0.2 * u), ry = rx * 0.42, N = 22;
        for (let j = 0; j <= N; j++) { const v = j / N, th = a0 + span * v, rr = 1 + 0.25 * (1 - v); P.push({ x: px + Math.cos(th) * rx * rr, y: py + Math.sin(th) * ry * rr - T * 0.25 * v, w: T * 0.06 * Math.sin(v * Math.PI) * (1 - u * 0.5), tw: th * 1.5, a: 1 - u, back: Math.sin(th) < 0 }); }
        out.push(P); }
      return out; }
  };
})();
