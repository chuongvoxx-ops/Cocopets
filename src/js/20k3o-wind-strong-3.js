/* ---------- (v370) Wind Strongs, new (3 of 3): Claws of Garuda, Swallow Dance ----------
   See 20k3m for the shared rules. Both are combos run by a small controller in their update (no hit is scheduled ahead):
   Claws of Garuda follows Demon Blade's (20k5p: a target taken at each wind-up, limited tracking between strikes, the
   swing's direction locked while it cuts, one hit per monster per authored strike) with Wind's own damage and no health
   cost; Swallow Dance moves the pet itself, through the game's own collision (moveEnt), to a landing made safe. */
(() => {
  const S = ELEM_IMPL.wind.strong, TAU = Math.PI * 2, U = WDK.U, { cl, lerp, sm, eo, R1, tierOf, valid, segD, turn } = U;
  const petOf = H => (H.X.pet ? H.X.pet() : H.X.ST());
  const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));

  /* ---- a claw of Garuda (2D, translucent emerald energy): wrist plates fanned like feathers, a sculpted palm, three
     forward talons and a rear one, sharply hooked; ang the way its talons point, s its size (px), open 0..1 spreads them,
     mir mirrors it (the other hand) */
  function claw(H, c, x, y, ang, s, a, open, mir) { if (!(s > 2) || !(a > 0.01)) return; const P = WDK.P; c.save(); c.translate(x, y); c.rotate(ang); if (mir) c.scale(1, -1); c.globalAlpha = Math.min(1, a); c.lineJoin = 'round'; c.lineCap = 'round';
    const edge = (w, al) => { c.strokeStyle = H.rgba('#DFFFF0', al); c.lineWidth = Math.max(0.7, s * w); c.stroke(); };
    // wrist plates (behind the palm), feather-like
    for (let i = 0; i < 6; i++) { const b = Math.PI + (i / 5 - 0.5) * 1.5, L = s * (0.55 + 0.18 * Math.sin(i / 5 * Math.PI)), w2 = s * 0.11; c.save(); c.rotate(b); c.beginPath(); c.moveTo(s * 0.12, -w2 * 0.6); c.quadraticCurveTo(L * 0.6, -w2 * 1.2, L, 0); c.quadraticCurveTo(L * 0.6, w2 * 1.2, s * 0.12, w2 * 0.6); c.closePath();
      const g2 = c.createLinearGradient(0, 0, L, 0); g2.addColorStop(0, H.rgba('#0B6B4C', 0.75)); g2.addColorStop(1, H.rgba('#4FE0A8', 0.5)); c.fillStyle = g2; c.fill(); edge(0.022, 0.75); c.restore(); }
    // the palm: a sculpted pad, darker in its depth, bright along its upper edge
    c.beginPath(); c.moveTo(-s * 0.18, -s * 0.2); c.quadraticCurveTo(s * 0.1, -s * 0.34, s * 0.34, -s * 0.2); c.quadraticCurveTo(s * 0.44, 0, s * 0.34, s * 0.2); c.quadraticCurveTo(s * 0.1, s * 0.32, -s * 0.18, s * 0.2); c.quadraticCurveTo(-s * 0.3, 0, -s * 0.18, -s * 0.2); c.closePath();
    const gp = c.createLinearGradient(0, -s * 0.3, 0, s * 0.3); gp.addColorStop(0, H.rgba('#7DF2C4', 0.85)); gp.addColorStop(0.45, H.rgba('#16A672', 0.8)); gp.addColorStop(1, H.rgba('#06402E', 0.85)); c.fillStyle = gp; c.fill(); edge(0.03, 0.85);
    c.strokeStyle = H.rgba('#06402E', 0.6); c.lineWidth = Math.max(0.6, s * 0.018); c.beginPath(); c.moveTo(-s * 0.05, -s * 0.12); c.quadraticCurveTo(s * 0.12, 0, -s * 0.05, s * 0.12); c.stroke();
    // the talons: a knuckled finger then a hooked crescent talon
    const fingers = [[-0.42, 1.0], [0, 1.12], [0.42, 1.0], [Math.PI - 0.5, 0.62]];
    for (let i = 0; i < 4; i++) { const rear = i === 3, sp = rear ? fingers[i][0] : fingers[i][0] * (0.55 + 0.75 * open), L = s * fingers[i][1] * (rear ? 0.7 : 0.62); c.save(); c.translate(Math.cos(sp) * s * 0.28, Math.sin(sp) * s * 0.22); c.rotate(sp);
      c.beginPath(); c.moveTo(0, -s * 0.07); c.lineTo(L * 0.55, -s * 0.06); c.lineTo(L * 0.55, s * 0.06); c.lineTo(0, s * 0.08); c.closePath(); const gf = c.createLinearGradient(0, -s * 0.08, 0, s * 0.08); gf.addColorStop(0, H.rgba('#6FEAB9', 0.85)); gf.addColorStop(1, H.rgba('#0B6B4C', 0.85)); c.fillStyle = gf; c.fill(); edge(0.018, 0.6);
      c.fillStyle = H.rgba('#BFFFE3', 0.8); c.beginPath(); c.arc(L * 0.55, 0, s * 0.065, 0, TAU); c.fill();
      // the talon: a sharp hook curling down (+y)
      const tl = s * (rear ? 0.42 : 0.55), cur = 0.55 + 0.3 * (1 - open); c.translate(L * 0.55, 0); c.beginPath(); c.moveTo(0, -s * 0.06); c.quadraticCurveTo(tl * 0.75, -s * 0.1, tl, tl * cur * 0.55); c.quadraticCurveTo(tl * 0.55, s * 0.02, 0, s * 0.06); c.closePath();
      const gt = c.createLinearGradient(0, -s * 0.06, tl, tl * 0.4); gt.addColorStop(0, H.rgba('#0E8A5E', 0.9)); gt.addColorStop(1, H.rgba('#D8FFF0', 0.95)); c.fillStyle = gt; c.fill(); c.strokeStyle = H.rgba('#05362A', 0.7); c.lineWidth = Math.max(0.6, s * 0.014); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.beginPath(); c.moveTo(tl * 0.1, -s * 0.06); c.quadraticCurveTo(tl * 0.75, -s * 0.1, tl, tl * cur * 0.55); edge(0.025, 0.9); c.globalCompositeOperation = 'source-over'; c.restore(); }
    c.restore(); }

  /* ================= W-S09 Claws of Garuda =================
     Two enormous raptor claws of translucent emerald energy (a sculpted palm, sharply hooked talons, plates like feathers
     round the wrists) materialise beside and a little ahead of the pet, tied to it by visible currents of wind, and it tears
     through the monsters with them in a combo. Each strike leaves three parallel talon streaks of wind; the finisher is
     always last and is the only hit of its own (its shockwave belongs to it).
       Base (3)       left horizontal sweep, right cut back across, both claws crossing in a heavy X
       Adept (4)      left rake, right returning rake, rising claw with a short step, both claws slamming down together
       Celestial (6)  left rake, right rake, rising left claw, descending right claw, a broad turning sweep with both, and a
                      double-claw finisher that tears a huge emerald X through the target area
       damage         TOT = 2.4 / 3.5 / 4.6 x base x K over the combo, split by weight 1 a strike and 1.6 / 1.7 / 1.9 the
                      finisher: Base 0.67, 0.67, 1.07; Adept 0.72 x3, 1.22; Celestial 0.66 x5, 1.26 (x base x K)
       hits           one hitMon per monster per strike, when its cut begins: a rake 2.7 tiles in a 145 degree arc ahead, a
                      rising / descending strike 2.9 tiles in a 70 degree arc, the turning sweep 2.8 tiles all round, the X and
                      the slam 1.6 tiles round a point 1.5 ahead, the great X 2.6 tiles round a point 2 ahead
     Targeting (7 tiles): the aimed monster first, then the nearest at each wind-up; the pet turns to it at up to 6 rad / s
     between strikes (locked while it cuts) and steps up to 0.45 tiles toward it when it is out of reach (moveEnt: walls
     hold). A dead target hands over to the next; with none in range it swings on at the facing. A dodge during a strike's
     follow-through ends the combo there (its later strikes are simply not made). Cost 28, cooldown 6 s; no health cost. */
  const GSW = {
    rakeL: { W: 0.16, C: 0.1, FT: 0.14, hands: ['L'], L: [-1.7, 1.2, 1.25, 0.85, 0.8], sh: 'rake' },
    rakeR: { W: 0.14, C: 0.1, FT: 0.14, hands: ['R'], R: [1.7, -1.2, 1.25, 0.85, 0.8], sh: 'rake' },
    rise: { W: 0.18, C: 0.1, FT: 0.18, hands: ['L'], L: [-0.25, 0.15, 1.15, 0.05, 2.3], sh: 'vert', step: 0.4 },
    descR: { W: 0.16, C: 0.1, FT: 0.16, hands: ['R'], R: [0.2, -0.1, 1.25, 2.4, 0.0], sh: 'vert' },
    turn: { W: 0.2, C: 0.26, FT: 0.2, hands: ['L', 'R'], L: [-2.3, -2.3 + TAU, 1.55, 0.6, 0.6], R: [-2.3 + Math.PI, -2.3 + Math.PI + TAU, 1.55, 0.6, 0.6], sh: 'all' },
    xfin: { W: 0.3, C: 0.12, FT: 0.36, hands: ['L', 'R'], L: [-0.95, 0.75, 1.35, 2.1, 0.1], R: [0.95, -0.75, 1.35, 2.1, 0.1], sh: 'x', fin: 1 },
    slam: { W: 0.32, C: 0.1, FT: 0.36, hands: ['L', 'R'], L: [-0.55, -0.35, 1.0, 2.5, 0.0], R: [0.55, 0.35, 1.0, 2.5, 0.0], sh: 'slam', fin: 1 },
    xbig: { W: 0.4, C: 0.14, FT: 0.5, hands: ['L', 'R'], L: [-1.0, 0.85, 1.7, 2.6, 0.1], R: [1.0, -0.85, 1.7, 2.6, 0.1], sh: 'xbig', fin: 1 } };
  const GCOMBO = [['rakeL', 'rakeR', 'xfin'], ['rakeL', 'rakeR', 'rise', 'slam'], ['rakeL', 'rakeR', 'rise', 'descR', 'turn', 'xbig']];
  const GUARD = { L: [-1.05, 1.0, 0.95], R: [1.05, 1.0, 0.95] };   // (angle off the facing, reach, height: tiles)
  S.garuda = (C, h) => { const H = h, me = H.me, g = H.g, tier = tierOf(C), ORDER = GCOMBO[tier], NS = ORDER.length, TOT = [2.4, 3.5, 4.6][tier], WF = [1.6, 1.7, 1.9][tier], WS = (NS - 1) + WF, PER = TOT * C.base * C.K / WS, SUM = 0.5, ENDD = 0.45, RANGE = 7;
    const P0 = petOf(H), dbg = { swings: [], hits: 0, cancelled: false, retargets: 0 };
    let ph = 'summon', k = -1, tK = 0, fa = isFinite(C.tx) ? Math.atan2(C.ty - me.y, C.tx - me.x) : (me.face || 1) > 0 ? 0 : Math.PI, cur = null, endT = 0;
    const hand = { L: { a: GUARD.L[0], r: GUARD.L[1], z: GUARD.L[2], open: 0.3, tr: [] }, R: { a: GUARD.R[0], r: GUARD.R[1], z: GUARD.R[2], open: 0.3, tr: [] } }, marks = [], fx = [];
    H.X.banner && H.X.banner('CLAWS OF GARUDA', '', C.col, 1.0); H.X.sfx.hum && H.X.sfx.hum(); me.sq = 0.7;
    function acquire(first) { const L = H.living().filter(m => valid(m) && Math.hypot(m.x - me.x, m.y - me.y) < RANGE + (m.r || 0.4)); if (!L.length) return null; let best = null, bs = 1e9; for (const m of L) { let sc = Math.hypot(m.x - me.x, m.y - me.y); if (first && isFinite(C.tx)) sc = 0.35 * sc + Math.hypot(m.x - C.tx, m.y - C.ty); if (sc < bs) { bs = sc; best = m; } } return best; }
    function prepare(i) { const kind = ORDER[i], D = GSW[kind], tg = acquire(i === 0); const sw = { i, kind, D, tg, hit: new Set(), n: 0, done: false, struck: false, fin: !!D.fin, dmg: PER * (D.fin ? WF : 1), stepped: 0 }; dbg.swings.push({ kind, n: 0 }); return sw; }
    const clawPos = (hd, o) => [me.x + Math.cos(fa + o.a) * o.r, me.y + Math.sin(fa + o.a) * o.r, o.z];   // (world: x, y, height)
    function strike(sw, t) { sw.struck = true; const D = sw.D, mons = H.living(), F0 = [Math.cos(fa), Math.sin(fa)]; let cx = me.x, cy = me.y, R = 0, half = 0;
      if (D.sh === 'rake') { R = 2.7; half = 1.27; } else if (D.sh === 'vert') { R = 2.9; half = 0.62; } else if (D.sh === 'all') { R = 2.8; half = 4; }
      else if (D.sh === 'x' || D.sh === 'slam') { cx = me.x + F0[0] * 1.5; cy = me.y + F0[1] * 1.5; R = 1.6; } else if (D.sh === 'xbig') { const tg = valid(sw.tg) && Math.hypot(sw.tg.x - me.x, sw.tg.y - me.y) < 3.2 ? sw.tg : null; cx = tg ? tg.x : me.x + F0[0] * 2; cy = tg ? tg.y : me.y + F0[1] * 2; R = 2.6; }
      for (const m of mons) { if (!valid(m) || sw.hit.has(m)) continue; const mr = m.r || 0.4, dx = m.x - cx, dy = m.y - cy, d = Math.hypot(dx, dy); if (d > R + mr) continue;
        if (half && half < 4) { const da = Math.abs(wrapA(Math.atan2(dy, dx) - fa)), tol = d > 0.1 ? Math.asin(Math.min(1, mr / d)) : 1; if (da > half + tol) continue; }
        sw.hit.add(m); sw.n++; dbg.hits++; H.X.hitMon(m, sw.dmg, C.dmgO({ kb: sw.fin ? 5 : 2, stun: sw.fin ? 0.3 : 0.1 })); H.X.sparks && H.X.sparks(m.x, m.y - 0.4, '#BFFFE0', sw.fin ? 9 : 5, 5); for (let j = 0; j < H.n(sw.fin ? 6 : 3); j++) U.leafP(H, m.x, m.y - 0.4, (Math.random() - 0.5) * 6, -2 - Math.random() * 2, 0.6); }
      dbg.swings[sw.i].n = sw.n; if (sw.n) { H.X.hitstop && H.X.hitstop(sw.fin ? 0.07 : 0.03); H.X.shake(sw.fin ? 7 : 2.5, sw.fin ? 0.2 : 0.08); }
      H.X.sfx.whoosh && H.X.sfx.whoosh(); if (sw.fin) { H.X.sfx.thud && H.X.sfx.thud(); H.X.sfx.crash && D.sh === 'xbig' && H.X.sfx.crash(); fx.push({ kind: D.sh, x: cx, y: cy, t0: t, a: fa, R }); H.X.light && H.X.light(cx, cy, R * 1.3, 0.25); } }
    function poseAt(sw, hd, tau) { const D = sw.D, key = D[hd]; if (!key) return null; const [a0, a1, r, z0, z1] = key; const W = D.W, Cc = D.C;
      if (tau < W) { const u = sm(tau / W), back = 0.35 * Math.sign(a1 - a0 || 1); return { a: lerp(hand[hd].a0 != null ? hand[hd].a0 : a0, a0 - back, u), r: lerp(hand[hd].r0 != null ? hand[hd].r0 : r, r * 0.92, u), z: lerp(hand[hd].z0 != null ? hand[hd].z0 : z0, z0 + (z1 > z0 ? -0.15 : 0.25), u), open: lerp(0.3, 0.15, u) }; }
      const back = 0.35 * Math.sign(a1 - a0 || 1); if (tau < W + Cc) { const u = (tau - W) / Cc, e = 1 - Math.pow(1 - u, 2.4); return { a: lerp(a0 - back, a1, e), r: r * (0.92 + 0.12 * Math.sin(e * Math.PI)), z: lerp(z0 + (z1 > z0 ? -0.15 : 0.25), z1, e), open: 1 }; }
      const u = sm((tau - W - Cc) / D.FT); return { a: a1 + 0.12 * Math.sign(a1 - a0 || 1) * u, r, z: z1, open: lerp(1, 0.5, u) }; }
    const F = H.add({ key: 'garuda', life: 30, x: me.x, y: me.y, dbg, NS, ORDER,
      update(dt, f) { const t = f.t; f.x = me.x; f.y = me.y;
        if (ph !== 'end' && ph !== 'gone' && (me.dead || petOf(H) !== P0)) { ph = 'end'; endT = t; dbg.cancelled = true; }
        if (ph === 'gone') { if (t - endT > ENDD + 0.6) f.life = 0; return; }
        if (ph === 'end') { me.hopLean = 0; if (t - endT > ENDD) { ph = 'gone'; } return; }
        const tau = t - tK;
        if (ph === 'summon') { if (!cur) { cur = prepare(0); if (cur.tg) fa = Math.atan2(cur.tg.y - me.y, cur.tg.x - me.x); }
          for (const hd of ['L', 'R']) { const q = hand[hd]; q.a = GUARD[hd][0]; q.r = GUARD[hd][1] * (0.6 + 0.4 * eo(tau / SUM)); q.z = GUARD[hd][2]; }
          if (tau >= SUM) { ph = 'swing'; k = 0; tK = t; for (const hd of ['L', 'R']) { hand[hd].a0 = hand[hd].a; hand[hd].r0 = hand[hd].r; hand[hd].z0 = hand[hd].z; } } }
        else if (ph === 'swing') { const sw = cur, D = sw.D;
          // tracking (wind-up only), and a short step toward a target out of reach
          if (tau < D.W) { if (!valid(sw.tg)) { const m = acquire(false); if (m) { sw.tg = m; dbg.retargets++; } } if (valid(sw.tg)) { fa = turn(fa, Math.atan2(sw.tg.y - me.y, sw.tg.x - me.x), 6 * dt); const d = Math.hypot(sw.tg.x - me.x, sw.tg.y - me.y) - (sw.tg.r || 0.4); const lim = (D.step || 0) + 0.45; if (d > 1.7 && sw.stepped < lim) { const st = Math.min(lim - sw.stepped, dt * lim / D.W, d - 1.7); H.X.moveEnt(me, Math.cos(fa) * st, Math.sin(fa) * st, 0); sw.stepped += st; } } }
          if (Math.cos(fa) !== 0) me.face = Math.cos(fa) < 0 ? -1 : 1;
          for (const hd of ['L', 'R']) { const q = hand[hd], p = poseAt(sw, hd, tau); if (p) { q.a = p.a; q.r = p.r; q.z = p.z; q.open = p.open; } else { const gk = GUARD[hd]; q.a = lerp(q.a, gk[0], Math.min(1, dt * 8)); q.r = lerp(q.r, gk[1], Math.min(1, dt * 8)); q.z = lerp(q.z, gk[2], Math.min(1, dt * 8)); q.open = lerp(q.open, 0.3, Math.min(1, dt * 6)); }
            const w = clawPos(hd, q); if (p && tau >= D.W) { q.tr.unshift([w[0], w[1], w[2], t]); if (q.tr.length > 14) q.tr.pop(); } }
          me.hopLean = (tau >= D.W && tau < D.W + D.C ? 0.18 : 0.06) * (me.face || 1) * (sw.fin ? 1.4 : 1); me.sq = tau < D.W ? 0.25 : 0;
          if (!sw.struck && tau >= D.W) strike(sw, t);
          if (tau > D.W + D.C && me.dodge) { ph = 'end'; endT = t; dbg.cancelled = true; return; }
          if (tau >= D.W + D.C + D.FT) { for (const hd of ['L', 'R']) { hand[hd].a0 = hand[hd].a; hand[hd].r0 = hand[hd].r; hand[hd].z0 = hand[hd].z; hand[hd].tr.length = 0; }
            k++; if (k >= NS) { ph = 'end'; endT = t; return; } cur = prepare(k); tK = t; } }
        for (const hd of ['L', 'R']) { const q = hand[hd]; while (q.tr.length && t - q.tr[q.tr.length - 1][3] > 0.22) q.tr.pop(); }
        while (fx.length && t - fx[0].t0 > 0.9) fx.shift(); },
      onEnd() { me.hopLean = 0; },
      drawUnder(c, f, X0, Y0, T) { const G = WDK.bind(H), t = f.t, P = G.P; G.layer(c, () => { for (const e of fx) { const u = (t - e.t0) / 0.9, X = H.sx(e.x), Y = H.sy(e.y); G.ring(c, X, Y, T * e.R * eo(u / 0.5), 1 - sm(u), { th: 0.12, col: P.deep, lite: P.mintW, seed: 2 }); G.ripple(c, X, Y, T * e.R * (0.5 + 0.7 * eo(u)), 0.6 * (1 - u), { th: 0.06 }); if (e.kind === 'slam' || e.kind === 'xbig') G.swirl(c, X, Y, T * e.R * 0.8, 0.6 * (1 - u), { spin: 3 }); } }); },
      draw(c, f, X0, Y0, T) { const G = WDK.bind(H), t = f.t, P = G.P, X = H.sx(me.x), Yf = H.sy(me.y), a = ph === 'summon' ? eo((t - tK) / SUM) : ph === 'end' || ph === 'gone' ? 1 - cl((t - endT) / ENDD) : 1;
        const scr = w => [H.sx(w[0]), H.sy(w[1]) - w[2] * T];
        const order = ['L', 'R'].map(hd => { const w = clawPos(hd, hand[hd]); return [hd, w]; }).sort((p, q) => p[1][1] - q[1][1]);
        G.layer(c, () => {
          // the talon streaks: three parallel ribbons of wind behind each claw that cuts, bright at their outer edges
          for (const hd of ['L', 'R']) { const q = hand[hd]; if (q.tr.length < 2) continue; const pts = q.tr.map(scr), fin = cur && cur.fin, wd = T * (fin ? 0.2 : 0.14);
            const nx = (j) => { const p0 = pts[Math.max(0, j - 1)], p1 = pts[Math.min(pts.length - 1, j + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 1; return [-dy / d, dx / d]; };
            for (let s = -1; s <= 1; s++) { const off = s * T * (fin ? 0.3 : 0.22), P2 = pts.map((p, j) => { const n = nx(j); return [p[0] + n[0] * off, p[1] + n[1] * off]; }); G.rib(c, P2, wd, 0.95, { edge: 1, taper: 0.8, fade: 1, seed: s + 2, flow: 8, dens: 0.8 }); }
            G.rib(c, pts, T * (fin ? 0.7 : 0.5), 0.45, { edge: 0, taper: 0.7, fade: 1, seed: 5, flow: 6, dens: 0.3 }); }
          // the wind tying the claws to the pet; the claws' glow
          for (const [hd, w] of order) { const p = scr(w), sx0 = X + (hd === 'L' ? -1 : 1) * T * 0.15, sy0 = Yf - T * 0.55, mx = (sx0 + p[0]) / 2, my = (sy0 + p[1]) / 2 - T * 0.25;
            G.rib(c, [[p[0], p[1], T * 0.1], [mx + Math.sin(t * 7) * T * 0.08, my, T * 0.07], [sx0, sy0, T * 0.04]], T * 0.08, 0.6 * a, { edge: 0, taper: 0.5, seed: hd === 'L' ? 1 : 2, flow: -6, dens: 0.4 });
            G.glow(c, p[0], p[1], T * 1.0, P.jade, 0.35 * a); }
          // the finishers: the X / the slam / the great emerald X, torn through the target area
          for (const e of fx) { const u = (t - e.t0) / 0.9, X2 = H.sx(e.x), Y2 = H.sy(e.y) - T * (e.kind === 'slam' ? 0.3 : 0.9), big = e.kind === 'xbig' ? 1.6 : 1, fa2 = cl(1 - u);
            if (e.kind === 'x' || e.kind === 'xbig') for (const s of [-1, 1]) { const ang = Math.PI / 2 + s * 0.78, L2 = T * e.R * 1.15 * big * eo(u / 0.18);
              G.arc(c, X2 - Math.cos(ang) * L2 * 0.15, Y2 + Math.sin(ang) * L2 * 0.1, L2 * 1.6, ang, fa2, { k: 0.18, beta: s * 0.78 + Math.PI / 2, mode: 1, span: 1.3, th: 0.5, col: '#0A7A52', lite: P.mintW, seed: s + 4, dens: 1.1 });
              for (let j = -1; j <= 1; j++) G.arc(c, X2 + j * T * 0.18 * big, Y2 + j * T * 0.1, L2 * 1.6, ang, 0.8 * fa2, { k: 0.16, beta: s * 0.78 + Math.PI / 2, mode: 1, span: 1.2, th: 0.07, seed: j + s * 3 }); }
            if (u < 0.35) { G.gust(c, X2, Y2, T * e.R * 0.8 * eo(u / 0.35) * big, 1 - u / 0.35, { core: 1 - u / 0.2, spin: 4, seed: 9, shade: 0.3 }); G.star(c, X2, Y2, T * 1.6 * big, 1 - u / 0.35); } } });
        // the claws (2D), the farther first
        for (const [hd, w] of order) { const q = hand[hd], p = scr(w), da = hd === 'L' ? -1 : 1, mot = q.tr.length > 1 ? Math.atan2(q.tr[0][1] - q.tr[1][1], q.tr[0][0] - q.tr[1][0]) : fa + da * 0.4, ang = Math.atan2(Math.sin(mot) * 0.9 - 0.2, Math.cos(mot));
          claw(H, c, p[0], p[1], ang, T * 1.4 * (0.7 + 0.3 * a), a * 0.92, q.open, hd === 'L' ? (Math.cos(fa) < 0) : (Math.cos(fa) >= 0)); } } });
    return F; };

  /* ================= W-S10 Swallow Dance =================
     Two elegant wings of emerald wind unfold behind the pet and it darts between the monsters in quick curved lunges,
     slashing through them with the wings; each dash leaves the brief silhouette of a flying swallow in pale green light.
     Against a group it goes monster to monster (those it has not cut yet first); against one (a boss) it circles it,
     striking the same target from new sides. The last dash ends with both wings sweeping forward together, releasing a
     crossing slash of compressed wind that flies on, and the pet lands safely.
       strikes    3 / 4 / 6, the finisher included (Celestial: a larger finisher)
       damage     TOT = 2.4 / 3.4 / 4.4 x base x K, by weight 1 a dash and 1.6 / 1.6 / 1.9 the finisher; a dash cuts every
                  monster its path passes within 0.7 tiles of its edge (one hitMon each a dash); the crossing slash is the
                  finisher's own hit (it does not add one): the finisher's dash and its slash share one set, so a monster
                  is struck once by the finisher
       range      7 tiles; each lunge ends at a point made safe (walkPoint) and moves the pet through the game's collision
     The pet's stick is held while it dances (no input fights the lunges) and it is briefly untouchable as it lands. Cost 26,
     cooldown 4 s. */
  S.swallow = (C, h) => { const H = h, me = H.me, tier = tierOf(C), NS = [3, 4, 6][tier], TOT = [2.4, 3.4, 4.4][tier], WF = [1.6, 1.6, 1.9][tier], WS = (NS - 1) + WF, PER = TOT * C.base * C.K / WS, OPEN = 0.3, DASH = 0.17, GAP = 0.07, FINS = 0.36, BIG = tier === 2 ? 1.4 : 1, RANGE = 7;
    const P0 = petOf(H), dbg = { dashes: [], hits: 0, landed: false }, struck = new Set(), birds = [], slashes = [];
    let ph = 'open', k = -1, tK = 0, d = null, side = 1, circA = null, hold = null, fin = null;
    me.sq = 0.7; H.X.sfx.whoosh && H.X.sfx.whoosh();
    function nextTarget() { const L = H.living().filter(m => valid(m) && Math.hypot(m.x - me.x, m.y - me.y) < RANGE + (m.r || 0.4)); if (!L.length) return null; const fresh = L.filter(m => !struck.has(m)), pool = fresh.length ? fresh : L; let best = null, bs = 1e9; for (const m of pool) { let sc = Math.hypot(m.x - me.x, m.y - me.y); if (k === 0 && isFinite(C.tx)) sc = 0.35 * sc + Math.hypot(m.x - C.tx, m.y - C.ty); if (sc < bs) { bs = sc; best = m; } } return [best, !fresh.length]; }
    function begin(t) { const isFin = k === NS - 1, q = nextTarget(); let ex, ey, tg = null;
      if (q) { tg = q[0]; const again = q[1], mr = tg.r || 0.4; if (again) { circA = circA == null ? Math.atan2(me.y - tg.y, me.x - tg.x) + Math.PI : circA + 2.1 * side; ex = tg.x + Math.cos(circA) * (mr + 1.4); ey = tg.y + Math.sin(circA) * (mr + 1.4); }   /* (one target: circling it, a new side each time) */
        else { const a = Math.atan2(tg.y - me.y, tg.x - me.x); ex = tg.x + Math.cos(a) * (mr + 0.9); ey = tg.y + Math.sin(a) * (mr + 0.9); } }
      else { const a = isFinite(C.tx) ? Math.atan2(C.ty - me.y, C.tx - me.x) + (k % 2 ? 0.6 : -0.6) : (me.face || 1) > 0 ? 0 : Math.PI; ex = me.x + Math.cos(a) * 2.6; ey = me.y + Math.sin(a) * 2.6; }
      const w = H.walk(ex, ey); if (w && isFinite(w.x)) { ex = w.x; ey = w.y; }
      const L = Math.hypot(ex - me.x, ey - me.y), mxp = (me.x + ex) / 2, myp = (me.y + ey) / 2, px = L > 0.01 ? -(ey - me.y) / L : 0, py = L > 0.01 ? (ex - me.x) / L : 0; side = -side;
      d = { k, x0: me.x, y0: me.y, cx: mxp + px * side * L * 0.32, cy: myp + py * side * L * 0.32, x1: ex, y1: ey, t0: t, dur: DASH + Math.min(0.08, L * 0.012), hit: isFin && fin ? fin.hit : new Set(), tg, fin: isFin, path: [], a: Math.atan2(ey - me.y, ex - me.x) };
      if (isFin) fin = { hit: d.hit, sent: false }; dbg.dashes.push({ k, n: 0 }); if (Math.cos(d.a) !== 0) me.face = Math.cos(d.a) < 0 ? -1 : 1; H.X.sfx.whoosh && H.X.sfx.whoosh(); }
    const cut = (m, w) => { if (d.hit.has(m)) return; d.hit.add(m); struck.add(m); dbg.hits++; dbg.dashes[d.k].n++; H.X.hitMon(m, PER * w, C.dmgO({ kb: 2, stun: 0.12 })); slashes.push({ x: m.x, y: m.y, z: 0.4 + (m.r || 0.4) * 0.6, t0: F.t, a: d.a, big: d.fin ? BIG : 1 }); H.X.sparks && H.X.sparks(m.x, m.y - 0.4, '#C8FFE6', 5, 5); };
    function land(t) { const q = H.walk(me.x, me.y); if (q && Math.hypot(q.x - me.x, q.y - me.y) < 1.6) { me.x = q.x; me.y = q.y; } me.inv = Math.max(me.inv || 0, 0.35); me.sq = 0.8; if (me.push === hold) me.push = null; hold = null; dbg.landed = true; }
    const F = H.add({ key: 'swallow', life: 30, x: me.x, y: me.y, dbg, birds, slashes,
      update(dt, f) { const t = f.t; f.x = me.x; f.y = me.y;
        if (ph !== 'done' && ph !== 'gone' && (me.dead || petOf(H) !== P0)) { if (me.push === hold) me.push = null; hold = null; ph = 'gone'; tK = t; }
        if (ph === 'open' || ph === 'dash' || ph === 'gap') { me.inv = Math.max(me.inv || 0, 0.06 + dt); hold = me.push = { vx: 0, vy: 0, t: 0.12 }; }
        if (ph === 'open') { if (t >= OPEN) { k = 0; ph = 'dash'; begin(t); } }
        else if (ph === 'dash') { const u = cl((t - d.t0) / d.dur), e = 1 - Math.pow(1 - u, 2), q = 1 - e, px = q * q * d.x0 + 2 * q * e * d.cx + e * e * d.x1, py = q * q * d.y0 + 2 * q * e * d.cy + e * e * d.y1, bx = me.x, by = me.y;
          H.X.moveEnt(me, px - me.x, py - me.y, 0); d.path.push([me.x, me.y]);
          for (const m of H.living()) { if (!valid(m) || d.hit.has(m)) continue; if (segD(m.x, m.y, bx, by, me.x, me.y)[0] < (m.r || 0.4) + 0.7) cut(m, d.fin ? WF : 1); }
          if (u > 0.45 && !d.bird) { d.bird = true; birds.push({ x: me.x, y: me.y, a: Math.atan2(me.y - by, me.x - bx) || d.a, t0: t, s: d.fin ? 1.3 : 1 }); }
          if (Math.random() < 0.8 * H.Q()) U.wisp(H, me.x, me.y - 0.4, -Math.cos(d.a) * 3, -Math.sin(d.a) * 3, 0.3);
          if (u >= 1) { if (d.fin) { ph = 'fin'; tK = t; fin.x = me.x; fin.y = me.y; fin.a = d.a; fin.t0 = t; H.X.sfx.whoosh && H.X.sfx.whoosh(); H.X.shake(5 * BIG, 0.14); } else { ph = 'gap'; tK = t; } } }
        else if (ph === 'gap') { if (t - tK >= GAP) { k++; ph = 'dash'; begin(t); } }
        else if (ph === 'fin') { const u = cl((t - tK) / FINS), L = 3.4 * BIG, W = 0.75 * BIG, x0 = fin.x, y0 = fin.y, ca = Math.cos(fin.a), sa = Math.sin(fin.a), reach = L * eo(u);
          for (const m of H.living()) { if (!valid(m) || fin.hit.has(m)) continue; const rx = m.x - x0, ry = m.y - y0, al = rx * ca + ry * sa, of = Math.abs(-rx * sa + ry * ca); if (al > -0.3 && al < reach + (m.r || 0.4) && of < W + (m.r || 0.4)) cut(m, WF); }
          if (u >= 1) { land(t); ph = 'done'; tK = t; } }
        else if (ph === 'done' || ph === 'gone') { if (t - tK > 0.7) f.life = 0; } },
      onEnd() { if (me.push === hold) me.push = null; },
      draw(c, f, X0, Y0, T) { const G = WDK.bind(H), t = f.t, P = G.P, X = H.sx(me.x), Yf = H.sy(me.y), Yc = Yf - T * 0.6, wa = ph === 'open' ? eo(t / OPEN) : ph === 'done' || ph === 'gone' ? 1 - cl((t - tK) / 0.4) : 1, face = me.face || 1;
        G.layer(c, () => {
          // the wings: three long blades of wind a side, fanned behind the pet; swept back in a dash, forward at the finish
          const sweep = ph === 'dash' ? 0.5 : ph === 'fin' ? -0.9 * Math.sin(cl((t - tK) / FINS) * Math.PI) : 0;
          if (wa > 0.01) for (const s of [-1, 1]) for (let j = 0; j < 3; j++) { const base = -Math.PI / 2 + s * (0.55 + j * 0.42) + s * sweep * 0.6 - face * 0.25, L = T * (1.5 - j * 0.2) * eo(wa);
            G.arc(c, X - face * T * 0.2 + Math.cos(base) * L * 0.45, Yc + Math.sin(base) * L * 0.45, L * 0.9, base + s * 0.4, wa * (0.95 - j * 0.15), { k: 0.35, beta: base - Math.PI / 2, mode: 1, span: 2.2, th: 0.32, col: '#0B7A55', lite: P.mintW, seed: s * 3 + j, dens: 0.9 }); }
          if (wa > 0.01) G.glow(c, X - face * T * 0.2, Yc - T * 0.3, T * 1.4, P.jade, 0.25 * wa);
          // the dash's path: a ribbon of wind
          if (d && d.path.length > 1 && (ph === 'dash' || t - d.t0 < d.dur + 0.3)) { const fade = ph === 'dash' ? 1 : cl(1 - (t - d.t0 - d.dur) / 0.3), pts = d.path.slice().reverse().map(q => [H.sx(q[0]), H.sy(q[1]) - 0.5 * T]); G.rib(c, pts, T * 0.35, 0.8 * fade, { edge: 0, taper: 0.8, seed: d.k, flow: 8 }); }
          for (const b of birds) { const u = (t - b.t0) / 0.55; if (u > 1) continue; G.glow(c, H.sx(b.x), H.sy(b.y) - T * 0.6, T * 1.0 * b.s, P.mint, 0.35 * (1 - u)); }
          for (const q of slashes) { const u = (t - q.t0) / 0.32; if (u > 1) continue; const sx = H.sx(q.x), sy = H.sy(q.y) - q.z * T; G.arc(c, sx, sy, T * 0.95 * q.big, q.a + Math.PI / 2, 1 - u, { k: 0.3, beta: q.a, mode: 1, span: 2.4 * eo(u / 0.4), th: 0.3, col: '#0A7A52', lite: P.mintW, seed: q.t0 * 10 }); }
          // the crossing slash: two crescents crossing, flying on
          if (ph === 'fin' || (ph === 'done' && fin && t - tK < 0.3)) { const u = ph === 'fin' ? cl((t - tK) / FINS) : 1, fd = ph === 'done' ? 1 - (t - tK) / 0.3 : 1, dist = 3.4 * BIG * eo(u), sx = H.sx(fin.x + Math.cos(fin.a) * dist), sy = H.sy(fin.y + Math.sin(fin.a) * dist) - 0.6 * T, sa = Math.atan2(Math.sin(fin.a), Math.cos(fin.a));
            for (const s of [-1, 1]) G.arc(c, sx, sy, T * 1.25 * BIG, sa, fd, { k: 0.38, beta: sa + s * 0.7, mode: 1, span: 2.5, th: 0.4, col: '#0A7A52', lite: P.mintW, seed: s + 7, dens: 1.1 });
            G.glow(c, sx, sy, T * 1.3 * BIG, P.mint, 0.4 * fd); } });
        // the swallows: brief silhouettes of pale green light where the pet darted
        for (const b of birds) { const u = (t - b.t0) / 0.55; if (u > 1) continue; G.swallow(c, H.sx(b.x) + Math.cos(b.a) * u * T * 0.8, H.sy(b.y) - T * 0.6 + Math.sin(b.a) * u * T * 0.5 - u * T * 0.3, Math.atan2(Math.sin(b.a), Math.cos(b.a)), T * 1.5 * b.s, 1 - u, Math.cos(u * 14)); } } });
    return F; };
})();
