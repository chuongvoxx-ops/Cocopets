/* ---------- Lightning, reworked: Supreme Thunder, Edge of Glory ----------
   Supreme Thunder: living lightning spheres (a white-hot heart in a glassy cyan shell, jittering filaments turning round it
   at different angles) orbit the pet for ten seconds on tilted 3D orbits that follow it: the far side of each orbit rises
   behind the pet (drawn behind it, smaller and dimmer), the near side dips low in front of its feet. When monsters come
   close a sphere leans out, stretches a short tether behind itself, darts in, zaps at close range and curves back.
   Level 1: four spheres on one orbit, one lunge at a time in rotation. Level 4: eight on two tilted orbits, staggered pairs,
   spiral wakes. Level 7: twelve on three orbits of four, staggered triples with golden comet tails; at the end all twelve
   align round the pet, zap together and unravel into curling filaments.
   Edge of Glory: two wings of crescent lightning-blade feathers (a razor-bright gold edge, a translucent cyan body, a ragged
   violet fringe) unfold behind the pet from base to tip, sweep round it (the trailing feathers lag the leading edge, so the
   fan opens in layers), each swing leaving a curved sheet of glowing air that splits into strands; then the wings cross in
   front of the pet and release a travelling X-shaped slash. Level 1: one blade a wing, one opening sweep. Level 4: three a
   wing, two alternating sweeps. Level 7: six a wing, three sweeps growing in power, the wings spread to full span, draw
   together into two enormous edges and snap forward into a huge crossed cut wound with gold and violet filaments; the
   wings' outline stays behind the pet and dissolves feather by feather.
   Everything round the pet is behind it or cut away round its body; strikes leave only fading violet light. */
(() => {
  const U = ELEM_IMPL.thunder.ult, TAU = Math.PI * 2;
  let H, K, P;
  const cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u, lerp3 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
  /* world (x, y) at height z (world units) -> screen */
  const pj = (p, T) => [H.sx(p[0]), H.sy(p[1]) - p[2] * T];
  /* the screen ellipse the pet occupies, and a clip that keeps a draw off it */
  function petBox(T) { const me = H.me; return [H.sx(me.x), H.sy(me.y) - T * 0.46, T * 0.6, T * 0.7]; }
  function petHole(c, T) { const [x, y, rx, ry] = petBox(T); c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.clip('evenodd'); }
  /* how much of a front item to show where it would pass over the pet (1 clear of it, down to 0.2 over its middle) */
  function petFade(X, Y, r, T) { const [px, py, rx, ry] = petBox(T), d = Math.hypot((X - px) / (rx + r), (Y - py) / (ry + r)); return d >= 1 ? 1 : 0.2 + 0.8 * d * d; }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
  function strokePts(c, pts, w, col, a) { if (pts.length < 2 || !(a > 0.01)) return; c.globalAlpha = Math.min(1, a); c.strokeStyle = col; c.lineWidth = Math.max(0.5, w); poly(c, pts); c.stroke(); }
  /* the glassy shell of a sphere: a white heart, ice and cyan body, a brighter cyan-violet rim (cached once) */
  const shellSprite = () => fxSprite('tu3-shell', 96, 96, (g, w) => { const r = w / 2, gr = g.createRadialGradient(r * 0.86, r * 0.82, 1, r, r, r);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, 'rgba(244,251,255,0.97)'); gr.addColorStop(0.36, 'rgba(191,242,255,0.72)'); gr.addColorStop(0.62, 'rgba(95,228,255,0.34)');
    gr.addColorStop(0.8, 'rgba(95,228,255,0.5)'); gr.addColorStop(0.9, 'rgba(138,92,255,0.42)'); gr.addColorStop(1, 'rgba(74,43,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });

  /* =====================================================================================================================
     5. SUPREME THUNDER */
  U.supreme = (C, h) => {
    H = h; K = TK.bind(H); P = K.P;
    const me = H.me, ev = K.evo(C), DK = C.base * C.K * K.evoK(C), N = [4, 5, 6, 8, 9, 10, 12][ev - 1], NO = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, CEL = ev >= 7, WAKE = ev >= 4;
    const RZ = (4.0 + 0.15 * ev) * C.K, A0 = 0.55, ALIGN = CEL ? 8.45 : 99, FZ = 8.95, UNR = CEL ? 9.25 : 9.1, LIFE = 10, IV = [0.6, 0.74, 0.8][NO - 1];
    const ZD = DK * [1.0, 0.7, 0.42][NO - 1], FD = DK * 0.32;
    /* orbits: radius, tilt (the near side low, the far side high), turn about the vertical, angular speed */
    const OD = NO === 1 ? [[1.4, 0.36, 0, 1.6]] : NO === 2 ? [[1.45, 0.5, 0.7, 1.4], [1.7, 0.5, -0.7, -1.15]] : [[1.35, 0.28, 0, 1.55], [1.6, 0.66, 0.95, -1.2], [1.9, 0.66, -0.95, 1.0]];
    const orbs = OD.map((o, k) => ({ k, R: o[0], tau: o[1], psi: o[2], w: o[3], z0: 0.2 + o[0] * Math.sin(o[1] + 0.1) }));
    const sph = []; for (let i = 0; i < N; i++) { const k = i % NO, nk = Math.ceil((N - k) / NO), j = Math.floor(i / NO); sph.push({ i, k, j, ph: j / nk * TAU + k * 0.6, x: me.x, y: me.y, z: 0.6, L: null, hist: [], ht: 0, born: 0.15 + i * (0.5 / N), sc: 0, seed: i * 3.7 + 1, front: true }); }
    const zaps = [], marks = [], finals = []; const rot = orbs.map(() => 0);
    const grow = (s, t) => H.ease.back(cl((t - s.born) / 0.55));
    function orbAt(s, t, ph0) { const o = orbs[s.k], ph = (ph0 != null ? ph0 : s.ph) + o.w * t, tau = o.tau + 0.1 * Math.sin(t * 0.7 + o.k * 2.1), psi = o.psi + 0.22 * Math.sin(t * 0.37 + o.k * 1.3), R = o.R * (ph0 != null ? 1 : grow(s, t));
      const lx = R * Math.cos(ph), l0 = R * Math.sin(ph), ly = l0 * Math.cos(tau), lz = -l0 * Math.sin(tau), bob = ph0 != null ? 0 : 0.09 * Math.sin(t * 1.6 + s.ph * 2.3);
      return [me.x + lx * Math.cos(psi) - ly * Math.sin(psi), me.y + lx * Math.sin(psi) + ly * Math.cos(psi), Math.max(0.12, o.z0 + lz + bob)]; }
    function slotAt(s, t) { let p = orbAt(s, t); if (t > ALIGN) { const u = H.ease.io(cl((t - ALIGN) / 0.45)), b = s.i / N * TAU + t * 0.5; p = lerp3(p, [me.x + Math.cos(b) * 1.95, me.y + Math.sin(b) * 1.95, 0.85], u); } return p; }
    const inRange = m => Math.hypot(m.x - me.x, m.y - me.y) < RZ + m.r;
    function pick(s, avoid) { let best = null, bd = 1e9; for (const m of H.living()) { if (!inRange(m)) continue; const d = Math.hypot(m.x - s.x, m.y - s.y) + (avoid.includes(m) ? 3 : 0); if (d < bd) { bd = d; best = m; } } return best; }
    function zapFx(s, x, y, gold, big) { K.sparks(x, y - 0.3, H.n(big ? 12 : 8), 6); K.motes(x, y - 0.3, H.n(5)); if (gold) K.goldSparks(x, y - 0.3, H.n(6), 5); H.X.light(x, y, big ? 2.2 : 1.5, 0.15); H.glowAt(x, y - 0.3, 0.9, 0.22, gold ? P.gold : P.cyan, 0.7); marks.push({ x, y, t0: 0, a: 1 }); }
    function volley(t) { const picked = [];
      for (let k = 0; k < NO; k++) { const list = sph.filter(s => s.k === k); for (let q = 0; q < list.length; q++) { const s = list[(rot[k] + q) % list.length]; if (s.L) continue; const m = pick(s, picked); rot[k] = (rot[k] + q + 1) % list.length; if (!m) break; picked.push(m); s.L = { m, tx: m.x, ty: m.y, t0: t + k * (NO === 3 ? 0.11 : 0.14), hit: false, side: R1s(s.seed + t) < 0.5 ? 1 : -1, gold: CEL }; break; } } }
    const R1s = K.R1;
    H.X.banner('SUPREME THUNDER', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.6;
    H.add({ life: LIFE, clk: 0, fin: false,
      update(dt, f) { const t = f.t;
        if (t < 0.9) K.aura(me.x, me.y, 0.9, dt, 26, 0.45);
        for (const s of sph) { if (t > s.born && !s.bornFx) { s.bornFx = true; const p = orbAt(s, t + 0.3); K.sparks(me.x, me.y - 0.5, H.n(4), 4); K.motes(p[0], p[1] - p[2], H.n(3)); if (s.i % 2 === 0) H.X.sfx.crack(); }
          const slot = slotAt(s, t); let p = slot;
          if (s.L && t >= s.L.t0) { const L = s.L, q = t - L.t0; if (L.m && !L.m.dead) { L.tx = L.m.x; L.ty = L.m.y; } const tg = [L.tx, L.ty, 0.5], dx = tg[0] - slot[0], dy = tg[1] - slot[1], dd = Math.hypot(dx, dy) || 1, lean = [slot[0] + dx / dd * 0.38, slot[1] + dy / dd * 0.38, slot[2] + 0.12];
            if (q < 0.15) p = lerp3(slot, lean, H.ease.out(q / 0.15));
            else if (q < 0.28) p = lerp3(lean, tg, H.ease.in((q - 0.15) / 0.13));
            else if (q < 0.37) p = [tg[0] + (Math.random() - 0.5) * 0.06, tg[1], tg[2] + (Math.random() - 0.5) * 0.06];
            else if (q < 0.82) { const u = H.ease.io((q - 0.37) / 0.45), mx = (tg[0] + slot[0]) / 2, my = (tg[1] + slot[1]) / 2, ctl = [mx - dy / dd * 0.9 * L.side, my + dx / dd * 0.9 * L.side, Math.max(tg[2], slot[2]) + 0.55]; p = [lerp(lerp(tg[0], ctl[0], u), lerp(ctl[0], slot[0], u), u), lerp(lerp(tg[1], ctl[1], u), lerp(ctl[1], slot[1], u), u), lerp(lerp(tg[2], ctl[2], u), lerp(ctl[2], slot[2], u), u)]; }
            else s.L = null;
            if (s.L && !L.hit && q >= 0.28) { L.hit = true; L.zt = t; const m = L.m; if (m && !m.dead) H.X.hitMon(m, ZD, C.dmgO({ stun: m.boss ? 0.12 : 0.3, kb: 1 })); zapFx(s, L.tx, L.ty, L.gold); zaps.push({ s, x: L.tx, y: L.ty, t0: t, gold: L.gold }); if (s.i % 2 === 0 || NO === 1) H.X.sfx.crack(); H.X.shake(2, 0.08); } }
          s.x = p[0]; s.y = p[1]; s.z = p[2]; s.lunge = !!(s.L && t >= s.L.t0); s.front = s.lunge || s.y >= me.y - 0.02;
          s.sc = grow(s, t) * (t > UNR ? 1 - H.ease.in(cl((t - UNR) / 0.68)) : 1);
          s.ht -= dt; if (s.ht <= 0) { s.ht = 0.03; s.hist.push([s.x, s.y, s.z]); if (s.hist.length > (WAKE ? 11 : 7)) s.hist.shift(); }
          if (t < UNR && Math.random() < dt * 4 * H.Q()) K.motes(s.x, s.y - s.z, 1, { v: 0.8 });
          if (s.lunge && s.L && s.L.gold && Math.random() < dt * 30 * H.Q()) H.P({ kind: 'spark', x: s.x, y: s.y - s.z, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, g: 2, life: 0.35, max: 0.35, size: 2, color: Math.random() < 0.6 ? P.gold : P.white }); }
        if (t > A0 && t < (CEL ? ALIGN - 0.2 : UNR - 0.25)) { f.clk -= dt; if (f.clk <= 0) { f.clk += IV; volley(t); } }
        /* Celestial: the twelve aligned round the pet zap together */
        if (CEL && !f.fin && t >= FZ) { f.fin = true; const used = [];
          for (const s of sph) { let m = null, bd = 1e9; for (const q of H.living()) { if (Math.hypot(q.x - me.x, q.y - me.y) > RZ + 1 + q.r) continue; const d = Math.hypot(q.x - s.x, q.y - s.y) + used.filter(u => u === q).length * 1.2; if (d < bd) { bd = d; m = q; } }
            let x, y; if (m) { used.push(m); x = m.x; y = m.y; H.X.hitMon(m, FD, C.dmgO({ stun: m.boss ? 0.15 : 0.5, kb: 2 })); } else { const b = Math.atan2(s.y - me.y, s.x - me.x); x = me.x + Math.cos(b) * 3.2; y = me.y + Math.sin(b) * 3.2; }
            finals.push({ s, x, y }); zapFx(s, x, y, true, true); }
          H.X.flash(0.22, '#DDF4FF'); H.X.shake(8, 0.25); H.X.hitstop(0.06); H.X.light(me.x, me.y, 5, 0.35); H.X.sfx.crash(); f.ft = t; }
        if (t > UNR && !f.unr) { f.unr = true; for (const s of sph) { K.motes(s.x, s.y - s.z, H.n(5), { v: 1.2 }); K.sparks(s.x, s.y - s.z, H.n(3), 3); } H.X.sfx.whoosh(); }
        for (const m of marks) m.t0 += dt;
        for (let i = marks.length - 1; i >= 0; i--) if (marks[i].t0 > 1.1) marks.splice(i, 1);
        for (let i = zaps.length - 1; i >= 0; i--) if (t - zaps[i].t0 > 0.3) zaps.splice(i, 1); },
      /* one sphere: its wake or comet tail, glow, shell, the turning filaments, its heart */
      sphere(c, s, T, t, k) { const [X, Y] = pj([s.x, s.y, s.z], T), dz = cl((s.y - me.y) / 3.4 + 0.5), r = T * (CEL ? 0.26 : 0.3) * (0.7 + 0.42 * dz) * s.sc * (1 + 0.07 * Math.sin(t * 9 + s.seed)); if (r < 0.8) return;
        let a = k * (0.5 + 0.5 * dz); if (s.front) a *= petFade(X, Y, r, T); const gold = s.lunge && s.L && s.L.gold;
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        /* the wake (a spiral strand round a soft core) or, lunging, the tail; gold at Celestial */
        if ((WAKE || s.lunge) && s.hist.length > 2) { const n = s.hist.length, pts = s.hist.map(q => pj(q, T)); pts.push([X, Y]);
          const half = Math.floor(pts.length / 2), A1 = pts.slice(0, half + 1), A2 = pts.slice(half);
          if (gold) { strokePts(c, A1, r * 0.7, P.amber, 0.25 * a); strokePts(c, A2, r * 1.3, P.gold, 0.35 * a); strokePts(c, A2, r * 0.55, P.amber, 0.7 * a); strokePts(c, A2, r * 0.22, P.white, 0.9 * a); strokePts(c, A1, r * 0.25, P.gold, 0.55 * a); }
          else { strokePts(c, A1, r * 0.5, P.violet, 0.16 * a); strokePts(c, A2, r * 0.9, P.violet, 0.22 * a);
            const hel = pts.map((q, i) => { if (i === 0 || i === pts.length - 1) return q; const p0 = pts[i - 1], p1 = pts[i + 1], dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, o = Math.sin(i * 1.25 - t * 15 + s.seed) * r * 0.65 * (i / n); return [q[0] - dy / l * o, q[1] + dx / l * o]; });
            strokePts(c, hel.slice(0, half + 1), r * 0.12, P.blue, 0.45 * a); strokePts(c, hel.slice(half), r * 0.2, P.cyan, 0.8 * a); } }
        c.restore();
        K.glow(c, X, Y, r * 4.2, gold ? P.gold : dz > 0.45 ? P.cyan : P.blue, 0.6 * a); K.glow(c, X, Y, r * 2, P.violet, 0.35 * a);
        c.save(); c.globalAlpha = Math.min(1, a * 1.05); c.drawImage(shellSprite(), X - r * 1.12, Y - r * 1.12, r * 2.24, r * 2.24);
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; const nf = dz < 0.4 ? 2 : 3;
        for (let q = 0; q < nf; q++) { const ro = t * (1.9 + 0.8 * q) * (q % 2 ? -1 : 1) + s.seed + q * 1.1, fl = 0.2 + 0.3 * Math.abs(Math.sin(t * (2.3 + q * 0.7) + s.seed * 1.3)), rr = r * (1.08 + 0.14 * q), st = t * (4 + q * 1.3) + q * 2, cr = Math.cos(ro), sr = Math.sin(ro), pts = [], sd = K.seed(t, s.i * 7 + q, 18);
          for (let i = 0; i <= 10; i++) { const b = st + i / 10 * TAU * 0.74, jj = (K.R1(sd + i * 1.7) - 0.5) * r * 0.16, ex = Math.cos(b) * (rr + jj), ey = Math.sin(b) * (rr + jj) * fl; pts.push([X + ex * cr - ey * sr, Y + ex * sr + ey * cr]); }
          strokePts(c, pts, Math.max(0.8, r * 0.13), q === 2 ? P.violet : gold && q === 0 ? P.gold : P.cyan, 0.85 * a); if (q === 0 || dz > 0.5) strokePts(c, pts, Math.max(0.5, r * 0.05), P.white, 0.9 * a); }
        c.restore();
        K.glow(c, X, Y, r * 0.95, P.white, 0.85 * a);
        if (dz > 0.3 && K.R1(K.seed(t, s.i + 40, 12)) < 0.2) { const b = K.R1(K.seed(t, s.i + 70, 12)) * TAU; K.arc(c, X + Math.cos(b) * r, Y + Math.sin(b) * r, X + Math.cos(b) * r * 2.3, Y + Math.sin(b) * r * 2.3, K.seed(t, s.i, 20), 1, 0.8 * a, { forks: 0, jit: r * 0.4 }); }
        /* the tether stretched behind a leaning or darting sphere, toward its place on the orbit */
        if (s.lunge && s.L && t - s.L.t0 < 0.37) { const sl = pj(slotAt(s, t), T), dx = sl[0] - X, dy = sl[1] - Y, d = Math.hypot(dx, dy); if (d > 4) { const m = Math.min(1, T * 0.9 / d); K.arc(c, X, Y, X + dx * m, Y + dy * m, K.seed(t, s.i + 9, 22), 1.3, 0.85 * a, { forks: 1, jit: T * 0.12, gold }); } }
        /* unravelling: curling filaments spinning out of the shrinking sphere */
        if (t > UNR) { const u = cl((t - UNR) / 0.72); if (u < 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const R0 = T * 0.28 * (0.72 + 0.4 * dz);
          for (let q = 0; q < 3; q++) { const pts = []; for (let i = 0; i <= 9; i++) { const v = i / 9, b = q / 3 * TAU + s.seed + v * (2.4 + u * 2.2) + t * 2.2, rr = R0 * (0.3 + v * (1.2 + u * 4.5)); pts.push([X + Math.cos(b) * rr, Y + Math.sin(b) * rr * 0.75 - v * u * T * 0.7]); }
            strokePts(c, pts, 1.6 * (1 - u * 0.5), q === 1 ? P.violet : P.cyan, (1 - u) * 0.9 * k); strokePts(c, pts, 0.7, P.white, (1 - u) * 0.6 * k); } c.restore(); } } },
      orbitGuide(c, T, t, front, k) { if (t > ALIGN) k *= 1 - cl((t - ALIGN) / 0.3); if (t > UNR - 0.3) k *= 1 - cl((t - UNR + 0.3) / 0.4); const form = cl((t - 0.3) / 0.8); if (!(k * form > 0.02)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (const o of orbs) { const dum = { k: o.k, ph: 0, i: 0 }, segs = []; let cur = null; for (let i = 0; i <= 36; i++) { const p = orbAt(dum, 0, i / 36 * TAU), isF = p[1] >= me.y; if (isF === front) { if (!cur) { cur = []; segs.push(cur); } cur.push(pj(p, T)); } else cur = null; }
          for (const sg of segs) { strokePts(c, sg, 2.4, P.violet, 0.12 * k * form); strokePts(c, sg, 0.9, P.cyan, (front ? 0.3 : 0.2) * k * form); } } c.restore(); },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.6), form = H.ease.out(cl(f.t / 0.7)), mx = H.sx(me.x), my = H.sy(me.y), RO = orbs[orbs.length - 1].R;
        /* the floor: light under the pet and a turning ring of the orbits' reach */
        K.floorLight(c, mx, my, T * (RO + 0.9) * form, 0.38 * k); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * k * form; c.lineWidth = 1.6; c.strokeStyle = P.cyan; c.setLineDash([T * 0.3, T * 0.22]); c.lineDashOffset = -f.t * T * 1.2; H.floorEllipse(c, mx, my, T * (RO + 0.35)); c.stroke();
        c.strokeStyle = P.violet; c.lineWidth = 2.4; c.globalAlpha = 0.35 * k * form; c.lineDashOffset = f.t * T * 0.8; H.floorEllipse(c, mx, my, T * (RO + 0.55)); c.stroke(); c.setLineDash([]); c.restore();
        if (f.t < 0.9) K.glow(c, mx, my - T * 0.5, T * (0.8 + 1.0 * cl(f.t / 0.5)), P.cyan, 0.5 * (1 - cl((f.t - 0.6) / 0.3)));
        for (const s of sph) if (s.sc > 0.05) K.floorLight(c, H.sx(s.x), H.sy(s.y), T * 0.42 * s.sc, 0.22 * k * (s.lunge ? 1.6 : 1), s.lunge && s.L && s.L.gold ? P.gold : P.blue);
        for (const m of marks) { const u = m.t0 / 1.1; K.floorLight(c, H.sx(m.x), H.sy(m.y), T * (0.6 + 0.5 * u), 0.5 * (1 - u), P.violet); K.shockRing(c, H.sx(m.x), H.sy(m.y), T * (0.25 + 0.9 * H.ease.out(cl(u * 3))), 0.7 * (1 - cl(u * 2.2)), t, 0); }
        if (f.ft) { const u = cl((f.t - f.ft) / 0.55); if (u < 1) { K.shockRing(c, mx, my, T * (1 + 3.4 * H.ease.out(u)), 1 - u, t, H.Q() < 1 ? 3 : 6); K.floorLight(c, mx, my, T * 4, 0.5 * (1 - u), P.violet); } }
        f.orbitGuide(c, T, f.t, false, k);
        const back = sph.filter(s => !s.front).sort((p, q) => p.y - q.y); for (const s of back) f.sphere(c, s, T, f.t, k); },
      draw(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.6);
        c.save(); petHole(c, T); f.orbitGuide(c, T, f.t, true, k); c.restore();
        const front = sph.filter(s => s.front).sort((p, q) => p.y - q.y); for (const s of front) f.sphere(c, s, T, f.t, k);
        /* the close-range zaps: crackling arcs from the sphere into the monster */
        for (const z of zaps) { const u = (f.t - z.t0) / 0.3, s = z.s, A = pj([s.x, s.y, s.z], T), B = [H.sx(z.x), H.sy(z.y) - T * 0.45]; for (let i = 0; i < 2; i++) K.arc(c, A[0], A[1], B[0] + (i - 0.5) * T * 0.3, B[1] + (i - 0.5) * T * 0.15, K.seed(f.t, s.i * 3 + i, 24), 2.2 - i, (1 - u) * k, { forks: 2, jit: T * 0.2, gold: z.gold && i === 0 });
          K.glow(c, B[0], B[1], T * (0.9 - 0.4 * u), z.gold ? P.gold : P.ice, 0.75 * (1 - u)); }
        /* Celestial: the coordinated final zaps */
        if (f.ft && f.t - f.ft < 0.35) { const u = (f.t - f.ft) / 0.35; for (const z of finals) { const s = z.s, A = pj([s.x, s.y, s.z], T), B = [H.sx(z.x), H.sy(z.y) - T * 0.4]; K.arc(c, A[0], A[1], B[0], B[1], K.seed(f.t, s.i + 300, 24), 2.6, (1 - u) * k, { forks: 2, jit: T * 0.25, gold: s.i % 2 === 0 }); }
          K.glow(c, H.sx(me.x), H.sy(me.y) - T * 0.8, T * 3.2 * (0.6 + 0.4 * u), P.ice, 0.45 * (1 - u)); } } });
  };

  /* =====================================================================================================================
     6. EDGE OF GLORY */
  /* a crescent lightning blade from screen point A (its root) to B (its tip), w px thick at the belly, bulging to side sg
     (+1 / -1 of the A->B line): a ragged violet fringe on the inner curve, a translucent cyan body with an ice inner light,
     a jagged white vein, a razor-bright gold edge on the outer curve. outline: only the two edge lines (a fading remnant) */
  function blade(c, A, B, w, sg, a, t, seed, outline) { const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy); if (len < 3 || !(a > 0.01)) return;
    const n = 9, bul = len * 0.17, E = [], Bk = [], Fr = [], In = [], V = [], fs = Math.floor(t * 12);
    for (let i = 0; i <= n; i++) { const u = i / n, x = len * u, sn = Math.sin(Math.PI * u), ye = bul * Math.pow(sn, 0.9), W = w * Math.pow(sn, 0.7) * (1.15 - 0.4 * u); E.push([x, ye]); Bk.push([x, ye - W]); In.push([x, ye - W * 0.42]);
      Fr.push([x, ye - W - w * (0.2 + 0.55 * K.R1(seed + i * 1.73 + fs * 0.37)) * sn]); V.push([x, ye - W * 0.55 + (i && i < n ? (K.R1(seed * 3 + i + fs) - 0.5) * W * 0.35 : 0)]); }
    c.save(); c.translate(A[0], A[1]); c.rotate(Math.atan2(dy, dx)); c.scale(1, sg); c.lineCap = 'round'; c.lineJoin = 'round';
    if (outline) { c.globalCompositeOperation = 'lighter'; strokePts(c, E, Math.max(1, w * 0.12), P.gold, 0.85 * a); strokePts(c, Bk, Math.max(0.8, w * 0.07), P.cyan, 0.6 * a); strokePts(c, E, 0.7, P.white, 0.6 * a); c.restore(); return; }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * a; c.fillStyle = P.violet; poly(c, Bk.concat(Fr.slice().reverse())); c.fill();
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.42 * a; c.fillStyle = P.cyan; poly(c, E.concat(Bk.slice().reverse())); c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 * a; c.fillStyle = P.ice; poly(c, E.concat(In.slice().reverse())); c.fill();
    strokePts(c, V, Math.max(0.6, w * 0.06), P.white, 0.55 * a); strokePts(c, Bk, Math.max(0.6, w * 0.05), P.violet, 0.7 * a);
    strokePts(c, E, Math.max(1.4, w * 0.24), P.gold, 0.95 * a); strokePts(c, E, Math.max(0.7, w * 0.08), P.white, a);
    c.restore();
    /* a glint racing along the edge */
    const u = (t * 1.4 + seed * 0.37) % 1, gx = len * u, gy = bul * Math.pow(Math.sin(Math.PI * u), 0.9) * sg, ca = dx / len, sa = dy / len; K.glow(c, A[0] + gx * ca - gy * sa, A[1] + gx * sa + gy * ca, w * 1.4, P.gold, 0.7 * a);
  }

  /* a crescent cut along screen points pts (its cutting edge), w px deep at its belly toward the concave side: a violet
     haze and ragged fringe, a cyan body, an ice-white inner light, a gold edge with a white-hot line. wf(u) shapes the depth */
  function cut(c, pts, w, a, t, seed, wf) { const n = pts.length; if (n < 2 || !(a > 0.01)) return; const N = [];
    for (let i = 0; i < n; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1; let nx = -dy / l, ny = dx / l; if (ny > 0) { nx = -nx; ny = -ny; } N.push([nx, ny]); }
    const off = (k, j) => pts.map((p, i) => { const u = i / (n - 1), d = w * wf(u) * (j == null ? k : k * (0.75 + 0.6 * K.R1(seed + i * 1.7 + Math.floor(t * 12) * 0.31))); return [p[0] - N[i][0] * d, p[1] - N[i][1] * d]; });
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    const fr = off(1.9, 1), bd = off(1), inn = off(0.38), hz = off(2.6);
    c.globalAlpha = 0.12 * a; c.fillStyle = P.blue; poly(c, pts.concat(hz.slice().reverse())); c.fill();
    c.globalAlpha = 0.45 * a; c.fillStyle = P.violet; poly(c, bd.concat(fr.slice().reverse())); c.fill();
    c.globalAlpha = 0.36 * a; c.fillStyle = P.cyan; poly(c, pts.concat(bd.slice().reverse())); c.fill();
    c.globalAlpha = 0.3 * a; c.fillStyle = P.ice; poly(c, pts.concat(inn.slice().reverse())); c.fill();
    strokePts(c, pts, 3, P.gold, 0.55 * a); strokePts(c, pts, 1.4, P.gold, a); strokePts(c, pts, 0.7, P.white, a); c.restore(); }
  U.glory = (C, h) => {
    H = h; K = TK.bind(H); P = K.P;
    const me = H.me, ev = K.evo(C), DK = C.base * C.K * K.evoK(C), NF = [1, 1, 2, 3, 4, 5, 6][ev - 1], NS = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, CEL = ev >= 7;
    const a = C.a, ax = Math.cos(a), ay = Math.sin(a), side0 = ax >= 0 ? 1 : -1;
    const L = (2.2 + 0.08 * ev) * C.K, UNF = CEL ? 1.0 : 0.85, SWS = 0.6, SW0 = UNF + 0.1, CR = SW0 + NS * SWS;
    const SPR = CR, GAT = CR + 0.42, SNAP = CEL ? CR + 0.8 : CR + 0.26, REL = SNAP + 0.2, XT = CEL ? 0.85 : 0.65, XL = (CEL ? 9.5 : 6.4 + 0.25 * ev) * C.K, XS = CEL ? 1.6 : 1.1 + 0.04 * ev;
    const DISS = REL + 0.55, DSTEP = CEL ? 0.12 : 0, LIFE = CEL ? DISS + NF * DSTEP + 0.7 : REL + 1.25;
    const DEL = NF > 1 ? 0.15 / (NF - 1) + 0.025 : 0, FE = NF > 1 ? Math.min(0.32, 1.15 / (NF - 1)) : 0, FB = 0.07, W0 = NF === 1 ? 0.55 : NF <= 3 ? 0.42 : 0.34;
    const sweeps = NS === 1 ? [{ t0: SW0, W: [1, -1], pow: 1, D: 5.0 }] : NS === 2 ? [{ t0: SW0, W: [side0], pow: 1, D: 4.6 }, { t0: SW0 + SWS, W: [-side0], pow: 1.1, D: 4.6 }]
      : [{ t0: SW0, W: [side0], pow: 0.9, D: 2.2 }, { t0: SW0 + SWS, W: [-side0], pow: 1.05, D: 2.6 }, { t0: SW0 + 2 * SWS, W: [1, -1], pow: 1.35, D: 3.4 }];
    const XD = DK * (CEL ? 10.5 : 9.5), B0 = -1.0, B1 = 1.35;
    const REST = { b: -0.35, e: NF === 1 ? 0.72 : 0.66 };
    const anchorNow = () => [me.x, me.y - 0.04, 0.62];
    let XC = null;   /* the centre of the crossing (fixed when the wind-up for the cross begins) */
    /* the leading feather's pose for wing s at time t: azimuth b (mirrored per wing), elevation e, length k, fan spread */
    function pose(s, t) { let b = REST.b, e = REST.e, k = 1, fan = 1, cu = -1, rb = 0, big = 0;
      if (t < UNF) { const u = H.ease.out(cl(t / UNF)); b = lerp(-0.2, REST.b, u); e = lerp(1.45, REST.e, u); fan = 0.3 + 0.7 * u; }
      for (const sw of sweeps) { if (!sw.W.includes(s)) continue; const q = t - sw.t0; if (q < 0 || q > 0.62) continue;
        if (q < 0.17) { const u = H.ease.io(q / 0.17); b = lerp(REST.b, B0, u); e = lerp(REST.e, 1.35, u); fan = lerp(1, 0.55, u); }
        else if (q < 0.41) { const u = H.ease.io((q - 0.17) / 0.24); b = lerp(B0, B1, u); e = lerp(1.35, -0.05, u); k = 1 + 0.12 * sw.pow * Math.sin(u * Math.PI); fan = 0.55; }
        else { const u = H.ease.io((q - 0.41) / 0.21); b = lerp(B1, REST.b, u); e = lerp(-0.05, REST.e, u) + 0.35 * Math.sin(u * Math.PI); fan = lerp(0.55, 1, u); } }
      if (t >= CR && t < SNAP) { if (CEL) { if (t < GAT) { const u = H.ease.io(cl((t - SPR) / (GAT - SPR))); b = lerp(REST.b, -0.08, u); e = lerp(REST.e, 0.62, u); k = 1 + 0.18 * u; fan = 1 + 0.45 * u; }
          else { const u = H.ease.io(cl((t - GAT) / (SNAP - GAT))); b = lerp(-0.08, -0.9, u); e = lerp(0.62, 1.32, u); k = 1.18 + 0.3 * u; fan = 1.45 * (1 - u); big = u; } }
        else { const u = H.ease.io(cl((t - CR) / (SNAP - CR))); b = lerp(REST.b, -0.85, u); e = lerp(REST.e, 1.3, u); fan = lerp(1, 0.45, u); } }
      if (t >= SNAP) { cu = H.ease.in(cl((t - SNAP) / (REL - SNAP))); rb = H.ease.io(cl((t - REL - 0.05) / 0.4)); fan = CEL ? 0 : 0.45; big = CEL ? 1 - rb : 0; if (rb > 0) fan = lerp(fan, 1, rb); }
      return { b, e, k, fan, cu, rb, big }; }
    /* a point on wing s's crescent through the cross (billboard: across the screen and up), 0..1 */
    function cres(s, u, j) { const S = XS * (1 - 0.06 * j), A = [s * S, S * 1.05], B = [-s * S, -S * 0.75], bu = Math.pow(Math.sin(u * Math.PI), 0.9) * 0.1 * 2.69 * S, px = lerp(A[0], B[0], u) - s * 0.669 * bu, pz = lerp(A[1], B[1], u) + 0.743 * bu;
      return [XC[0] + px, XC[1] + 0.05 * j, Math.max(0.1, XC[2] + pz)]; }
    /* the screen points of wing s's arm of the X, from v0 to v1 along it, scaled by S / XS round the centre (wx, wy) */
    function armPts(s, v0, v1, wx, wy, S, T) { const pts = [], q = S / XS; for (let i = 0; i <= 12; i++) { const p = cres(s, lerp(v0, v1, i / 12), 0); pts.push(pj([wx + (p[0] - XC[0]) * q, wy + (p[1] - XC[1]) * q, XC[2] + (p[2] - XC[2]) * q], T)); } return pts; }
    const armW = v => Math.pow(Math.sin(Math.PI * v), 0.75);
    /* root and tip (world, with height) of feather j of wing s */
    function feather(s, j, t, an) { const tj = t - j * DEL, p = pose(s, tj), nf = Math.max(0, p.fan), unf = H.ease.out(cl((t - 0.08 - j * (UNF * 0.55 / Math.max(1, NF))) / (UNF * 0.55)));
      const ej = p.e - j * FE * nf, bj = p.b - j * FB * nf, Lj = L * p.k * (1 - 0.075 * j) * unf, root = [an[0] + s * 0.22, an[1], an[2] + 0.02 * j], beta = s > 0 ? bj : Math.PI - bj;
      let tip = [root[0] + Math.cos(ej) * Math.cos(beta) * Lj, root[1] + Math.cos(ej) * Math.sin(beta) * Lj, root[2] + Math.sin(ej) * Lj];
      if (p.cu >= 0 && XC) tip = p.rb > 0 ? lerp3(cres(s, 1, j), tip, p.rb) : lerp3(tip, cres(s, p.cu, j), Math.min(1, p.cu * 1.6));
      tip[2] = Math.max(0.06, tip[2]); return { root, tip, big: p.big, p }; }
    const sheets = [], xs = [];
    const featherState = {};   /* per feather: its last screen tip, its smoothed edge direction and bulge side */
    H.X.banner('EDGE OF GLORY', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.5;
    H.add({ life: LIFE, swI: 0, geo: [],
      update(dt, f) { const t = f.t, an = anchorNow();
        /* the sweeps: a swing cuts every monster its leading feather passes over */
        for (const sw of sweeps) { const q = t - sw.t0; if (q < 0.17 || sw.done) continue;
          if (!sw.go) { sw.go = true; sw.hit = new Set(); sw.an = an; sw.pb = {}; for (const s of sw.W) { sw.pb[s] = B0; sheets.push({ s, ts: sw.t0 + 0.17, te: sw.t0 + 0.41, an, pow: sw.pow }); } me.face = sw.W.length === 1 ? sw.W[0] : side0; H.X.sfx.whoosh(); H.X.shake(3 * sw.pow, 0.12); }
          for (const s of sw.W) { const p = pose(s, Math.min(t, sw.t0 + 0.41)), reach = L * p.k + 0.6, b0 = sw.pb[s], b1 = p.b;
            for (const m of H.living()) { if (sw.hit.has(m)) continue; const dx = m.x - me.x, dy = m.y - me.y, d = Math.hypot(dx, dy); if (d > reach + m.r) continue; const az = Math.atan2(dy, dx), bm = H.wrap(s > 0 ? az : Math.PI - az);
              if (bm >= b0 - 0.12 && bm <= b1 + 0.08) { sw.hit.add(m); H.X.hitMon(m, DK * sw.D, C.dmgO({ kb: 3, stun: m.boss ? 0.15 : 0.35 })); K.sparks(m.x, m.y - 0.4, H.n(9), 6); K.goldSparks(m.x, m.y - 0.4, H.n(4), 5); K.motes(m.x, m.y - 0.4, H.n(4)); H.X.light(m.x, m.y, 1.6, 0.15); H.glowAt(m.x, m.y - 0.4, 0.8, 0.2, P.gold, 0.6); H.X.sfx.crack(); } }
            sw.pb[s] = b1;
            const ft = feather(s, 0, t, an).tip; K.sparks(ft[0], ft[1] - ft[2], H.n(2), 3, { life: 0.35 }); if (sw.pow > 1.2) K.goldSparks(ft[0], ft[1] - ft[2], 1, 3); }
          if (q > 0.41) sw.done = true; }
        /* the cross */
        if (t >= CR && !XC) { XC = [me.x + ax * 1.6, me.y + ay * 1.6, 0.95]; me.face = side0; H.X.sfx.hum(); if (CEL) H.X.shake(4, 0.3); }
        if (t >= SNAP && !f.snap) { f.snap = true; H.X.sfx.whoosh(); }
        if (CEL && t > SPR && t < SNAP) K.aura(me.x, me.y - 0.04, 1.6, dt, 30, 1.0);
        if (t >= REL && !f.rel) { f.rel = true; xs.push({ x0: XC[0], y0: XC[1], t0: t, hit: new Set(), path: [] }); H.X.flash(CEL ? 0.2 : 0.12, '#FFF4D8'); H.X.shake(CEL ? 12 : 7, 0.25); H.X.hitstop(0.07); H.X.sfx.crash(); H.X.light(XC[0], XC[1], 3, 0.3); K.goldSparks(XC[0], XC[1] - XC[2], H.n(14), 7); K.sparks(XC[0], XC[1] - XC[2], H.n(14), 7); }
        for (const x of xs) { const q = t - x.t0, u = cl(q / XT), d = XL * Math.pow(u, 0.85), cx = x.x0 + ax * d, cy = x.y0 + ay * d, S = XS * (1 + 0.5 * u); x.cx = cx; x.cy = cy; x.S = S; x.u = u;
          if (!x.path.length || Math.hypot(cx - x.path[x.path.length - 1][0], cy - x.path[x.path.length - 1][1]) > 0.35) x.path.push([cx, cy]);
          if (u < 1) { for (const m of H.living()) { if (x.hit.has(m) || Math.hypot(m.x - cx, m.y - cy) > S * 0.95 + m.r) continue; x.hit.add(m); H.X.hitMon(m, XD, C.dmgO({ kb: 5, stun: m.boss ? 0.3 : 0.8 })); K.sparks(m.x, m.y - 0.5, H.n(12), 7); K.goldSparks(m.x, m.y - 0.5, H.n(8), 6); K.motes(m.x, m.y - 0.5, H.n(6)); H.X.light(m.x, m.y, 2, 0.2); H.X.shake(4, 0.1); H.X.sfx.crack(); }
            if (Math.random() < dt * 40 * H.Q()) H.P({ kind: Math.random() < 0.5 ? 'spark' : 'ember', x: cx + (Math.random() - 0.5) * S * 2, y: cy - XC[2] + (Math.random() - 0.5) * S * 1.6, vx: -ax * 3 + (Math.random() - 0.5) * 2, vy: -ay * 3 - 0.5, g: 1, drag: 1, life: 0.5, max: 0.5, size: 2.2, color: [P.gold, P.white, P.violet, P.cyan][Math.floor(Math.random() * 4)] }); } }
        /* the unfold's charge, and the feathers dissolving at the end */
        if (t < UNF + 0.2) for (const s of [1, -1]) { const ft = feather(s, 0, t, an).tip; K.aura(ft[0], ft[1], 0.35, dt, 10, ft[2]); }
        if (t > DISS) for (const s of [1, -1]) for (let j = 0; j < NF; j++) { const id = s + ':' + j, tj = CEL ? DISS + (NF - 1 - j) * DSTEP : DISS; if (t >= tj && !f['d' + id]) { f['d' + id] = true; const g2 = feather(s, j, t, an); for (let i = 1; i <= 4; i++) { const p = lerp3(g2.root, g2.tip, i / 4); K.motes(p[0], p[1] - p[2], H.n(2), { v: 0.8 }); } K.sparks(g2.tip[0], g2.tip[1] - g2.tip[2], H.n(3), 2); } }
        for (let i = sheets.length - 1; i >= 0; i--) if (t - sheets[i].te > 1.1) sheets.splice(i, 1); },
      /* every feather this frame, in screen space, with its layer and bulge side (worked out once, in the under pass) */
      build(T, t) { const an = anchorNow(), out = [];
        for (const s of [1, -1]) for (let j = 0; j < NF; j++) { const g2 = feather(s, j, t, an), R = pj(g2.root, T), Tp = pj(g2.tip, T), id = s + ':' + j, st = featherState[id] || (featherState[id] = { pt: Tp, en: [0, -1], sg: s > 0 ? 1 : -1 });
          const mx = Tp[0] - st.pt[0], my = Tp[1] - st.pt[1], ml = Math.hypot(mx, my), tg = ml > 2 ? [mx / ml, my / ml] : [0, -1]; st.en = [lerp(st.en[0], tg[0], 0.3), lerp(st.en[1], tg[1], 0.3)]; st.pt = Tp;
          const dx = Tp[0] - R[0], dy = Tp[1] - R[1], dl = Math.hypot(dx, dy) || 1, dot = (-dy / dl) * st.en[0] + (dx / dl) * st.en[1]; if (dot > 0.2) st.sg = 1; else if (dot < -0.2) st.sg = -1;
          let al = 1; if (t > DISS) { const tj = CEL ? DISS + (NF - 1 - j) * DSTEP : DISS; al = 1 - cl((t - tj) / (CEL ? 0.35 : 0.6)); }
          const outline = CEL && t > REL + 0.3; if (CEL && t > REL && !outline) al *= 1 - 0.4 * cl((t - REL) / 0.3);
          out.push({ s, j, R, Tp, sg: st.sg, front: g2.tip[1] - g2.root[1] > 0.08, w: T * W0 * (1 - 0.06 * j) * (g2.p.big > 0 ? 1 - 0.35 * g2.p.big : 1), a: al, big: g2.p.big, outline, seed: s * 13 + j * 5.3 }); }
        return out; },
      drawFeathers(c, f, T, t, front) { const k = Math.min(1, f.life / 0.4); for (const q of f.geo) { if (q.front !== front) continue; blade(c, q.R, q.Tp, q.w, q.sg, q.a * k * (q.big > 0 ? 1 - 0.45 * q.big : 1), t, q.seed, q.outline); }
        /* Celestial: the two enormous merged edges, as the wings draw together and snap */
        for (const s of [1, -1]) { const q = f.geo.find(g2 => g2.s === s && g2.j === 0); if (!q || !(q.big > 0.02) || q.front !== front) continue; const dx = q.Tp[0] - q.R[0], dy = q.Tp[1] - q.R[1], B = [q.R[0] + dx * 1.12, q.R[1] + dy * 1.12];
          K.glow(c, (q.R[0] + B[0]) / 2, (q.R[1] + B[1]) / 2, Math.hypot(dx, dy) * 0.7, P.gold, 0.35 * q.big * k); blade(c, q.R, B, T * 0.62, q.sg, q.big * k, t, s * 7, false); } },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5), form = cl(f.t / 0.5); f.geo = f.build(T, f.t); const mx = H.sx(me.x), my = H.sy(me.y);
        /* light behind the pet's back and on the floor round it */
        const fl = (f.t > SPR && f.t < REL ? 1.4 : 1) * (f.t > REL ? 1 - 0.6 * cl((f.t - REL) / 0.6) : 1);
        K.floorLight(c, mx, my, T * L * 1.25 * form, 0.32 * k * fl); K.glow(c, mx, my - T * 1.0, T * L * 0.9 * form, P.blue, 0.28 * k * fl); K.glow(c, mx, my - T * 0.7, T * 1.1, P.gold, 0.18 * k * fl);
        /* the X's track: a fading violet impression along the floor, the crossed cut lit on the floor beneath it */
        for (const x of xs) { const q = f.t - x.t0, fa = 1 - cl((q - XT * 0.6) / 0.7); if (x.path.length > 1) K.scar(c, x.path.map(p => [H.sx(p[0]), H.sy(p[1])]).concat([[H.sx(x.cx), H.sy(x.cy)]]), fa * k);
          if (x.u < 1) { const fx = H.sx(x.cx), fy = H.sy(x.cy), S = x.S * T, xa = 1 - cl((x.u - 0.75) / 0.25); K.floorLight(c, fx, fy, S * 1.7, 0.55 * xa, P.violet); K.floorLight(c, fx, fy, S * 1.0, 0.45 * xa, P.cyan);
            c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const sg of [-1, 1]) { const b = a + sg * 0.78, ex = Math.cos(b) * S * 1.25, ey = Math.sin(b) * S * 1.25 * H.GY, pts = [[fx - ex, fy - ey], [fx + ex, fy + ey]]; strokePts(c, pts, 5, P.violet, 0.4 * xa); strokePts(c, pts, 1.6, sg > 0 ? P.gold : P.ice, 0.85 * xa); } c.restore(); } }
        /* the tip light on the floor during the swings */
        for (const q of f.geo) if (q.j === 0 && !q.outline) { const tipW = feather(q.s, 0, f.t, anchorNow()).tip; if (tipW[2] < 1.2) K.floorLight(c, H.sx(tipW[0]), H.sy(tipW[1]), T * 0.6, 0.3 * k * q.a * (1.2 - tipW[2]), P.gold); }
        f.drawFeathers(c, f, T, f.t, false); },
      sheet(c, sh, T, t, k) { const age = t - sh.te, vis = cl((t - sh.ts) / (sh.te - sh.ts)); if (vis <= 0) return; const n = 12, tipP = [], inP = [], midP = [], lay = [];
        const hang = sh.full ? 1 - cl((age - 0.04) / 0.18) : age < 0.22 ? 1 : 1 - cl((age - 0.22) / 0.6); if (!(hang > 0.01)) return; const sp = sh.full ? 0 : cl((age - 0.15) / 0.5), pw = sh.pow, w1 = Math.min(t, sh.te), w0 = sh.full ? sh.ts : Math.max(sh.ts, w1 - 0.12), fi = sh.full ? 0.84 : 0.58;
        for (let i = 0; i <= n; i++) { const tt = lerp(w0, w1, i / n), g2 = feather(sh.s, 0, tt, sh.an); tipP.push(pj(g2.tip, T)); inP.push(pj(lerp3(g2.root, g2.tip, fi), T)); midP.push(pj(lerp3(g2.root, g2.tip, 0.86), T)); }
        for (let j = 1; j < NF; j++) { const pts = []; for (let i = 0; i <= 8; i++) { const tt = lerp(w0, w1, i / 8), g2 = feather(sh.s, j, tt, sh.an); pts.push(pj(g2.tip, T)); } lay.push(pts); }
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; const fa = k * (1 - sp) * (sh.full ? hang : 1);
        if (sp < 1) { c.globalAlpha = 0.09 * fa * pw; c.fillStyle = P.blue; poly(c, inP.concat(tipP.slice().reverse())); c.fill(); c.globalAlpha = 0.16 * fa * pw; c.fillStyle = P.cyan; poly(c, midP.concat(tipP.slice().reverse())); c.fill();
          strokePts(c, tipP, 4 * pw, P.gold, 0.4 * fa); strokePts(c, tipP, 1.5, P.white, 0.85 * fa); strokePts(c, inP, 1.5, P.violet, 0.35 * fa); }
        for (const pts of lay) { strokePts(c, pts, 2.5, P.blue, 0.25 * k * hang); strokePts(c, pts, 1, P.ice, 0.6 * k * hang); }
        /* separating into fine electrical strands */
        if (sp > 0) { const ns = 4, sd = K.seed(t, sh.s + 5, 14); for (let q = 0; q < ns; q++) { const v = 0.2 + 0.8 * q / (ns - 1), pts = []; for (let i = 0; i <= n; i++) { const A = inP[i], B = tipP[i], j2 = (K.R1(sd + q * 13 + i * 1.9) - 0.5) * T * 0.1 * sp; pts.push([lerp(A[0], B[0], v) + j2, lerp(A[1], B[1], v) + j2 + sp * T * 0.3 * (1 - v) + Math.sin(i * 0.8 + q * 1.7 + t * 6) * T * 0.05 * sp]); }
            c.setLineDash([T * (0.55 - 0.3 * sp), T * 0.35 * sp]); c.lineDashOffset = -t * T * (1 + q * 0.4); strokePts(c, pts, 1.2, q % 2 ? P.cyan : P.violet, 0.75 * k * hang); strokePts(c, pts, 0.6, P.white, 0.55 * k * hang); } c.setLineDash([]); }
        c.restore(); },
      draw(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.5);
        c.save(); petHole(c, T); for (const sh of sheets) f.sheet(c, sh, T, f.t, k); f.drawFeathers(c, f, T, f.t, true); c.restore();
        /* the snap: the two arms of the X drawn by the wing tips across each other */
        if (XC && f.t >= SNAP && f.t < REL + 0.06) { const cu = H.ease.in(cl((f.t - SNAP) / (REL - SNAP))), al = k * (1 - cl((f.t - REL) / 0.06)), S = XS * T;
          for (const s of [1, -1]) { if (cu < 0.02) continue; const pts = armPts(s, Math.max(0, cu - 0.75), cu, XC[0], XC[1], XS, T); cut(c, pts, T * (CEL ? 0.34 : 0.26), al, f.t, s * 9, u => armW(lerp(Math.max(0, cu - 0.75), cu, u)) * (0.4 + 0.6 * u)); } }
        /* the travelling crossed slash: two crescent cuts across each other, a white-hot heart, gold and violet filaments twisting along their edges */
        for (const x of xs) { if (x.u >= 1) continue; const xa = 1 - cl((x.u - 0.7) / 0.3), C0 = pj([x.cx, x.cy, XC[2]], T), S = x.S * T, wv = T * (CEL ? 0.3 : 0.22) * x.S / XS;
          K.glow(c, C0[0], C0[1], S * 2.2, P.blue, 0.3 * xa); K.glow(c, C0[0], C0[1], S * 0.8, P.violet, 0.3 * xa);
          for (const s of [1, -1]) { const pts = armPts(s, 0, 1, x.cx, x.cy, x.S, T); cut(c, pts, wv, xa, t, s * 11 + 2, armW);
            c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const n = pts.length;
            for (let q = 0; q < (CEL ? 3 : 2); q++) { const tw = []; for (let i = 0; i < n; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, u = i / (n - 1), o = Math.sin(u * 11 + t * 24 + q * TAU / (CEL ? 3 : 2)) * wv * (0.55 + 0.25 * q) * armW(u); tw.push([pts[i][0] - dy / l * o, pts[i][1] + dx / l * o]); }
              strokePts(c, tw, CEL ? 1.6 : 1.2, q === 0 ? P.gold : q === 1 ? P.violet : P.amber, 0.9 * xa); } c.restore(); }
          K.glow(c, C0[0], C0[1], S * 0.35, P.white, 0.55 * xa); } } });
  };
})();
