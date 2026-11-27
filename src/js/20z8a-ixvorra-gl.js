/* ---------- (v472 YB) IX-VORRA THE LIVING CONDUCTOR in three dimensions (Rift 06, the Yuggoth Engine's second boss: the Capacitor Hall) ----------
   The 2D Ix-Vorra of 20z8-rift-fiend-yuggoth-2.js rebuilt as a sculpted, textured and lit GPU model, the same creature from its 2D
   drawing, posed every frame on the fight's own skeleton (its pose(), frames() and segments(): the ring's ten segments on its two
   turning, tilting frames, split into two rings and parted when it is overloaded; the core's slow roll carrying its eyes; the
   cables' chains as the fight swings and drags them), so it hangs exactly where its hit areas are and its fight is untouched.
   THE RING (860): ten heavy curved blocks of dark segmented metal, each swept along its own arc with chamfered edges (rewritten
   every frame: the arcs lengthen as the ring splits), its flat faces lit by how they are turned, plate lines across them, rivets, a
   glowing channel of current down the middle of each face (violet, the second ring's teal), worn bright edges, an oily sheen; an
   electrode glowing at each end where the current jumps; an amber running light chasing round the outer rim.
   THE CORE (861): a ball of boiling violet plasma (its surface boiling, rewritten every frame), cells of brighter plasma drifting
   through it, filaments of current curling, a hot fresnel rim; forty-four glassy eyes set in it (862: a wet white, an iris in
   its own colour, slit or round, a black pupil, a hard highlight; each with two lids of violet flesh, 863, that blink out of time
   with one another and close while it wakes), darting where the fight looks, carried round by its roll.
   THE CABLES (864): six copper cables hung from under the core, each one swept tube along the fight's own swinging chain,
   tapering, banded, tarnished green in the folds, a pulse of violet current running down each, an amber lamp at its tip.
   LIGHT: one pass in the Capacitor Hall's light (a steel-white key, dark steel above, the teal coolant's light below and a teal rim);
   the core shades what is behind it. On the painter: the core's violet glow and the light it throws on the deck, the electrodes',
   the running lights', the pulses' and the lamps' glows. Its moves' light: arcs jumping the gaps and down into the core (604), the
   arc web's warning (601) and its live beams, the split ring's spokes, the coolant's flow and its surge (607), the lash's sweep (603),
   the drain's torrent, the nova's gathering and its ring, the marked warnings (600, 602).
   LEVELS: full on High; Balanced, Performance and Fewer effects take the lighter level. GPU buffers freed with the stage. */
const IXVORRA_GL = (() => {
  const Y = YUG3, A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv } = K, lowFx = K.lowFx, nowMs = K.nowMs;
  const M_RING = 860, M_CORE = 861, M_EYE = 862, M_LID = 863, M_CU = 864, M_LAMP = 865;
  const VIOLET = '#9A5CFF', VIOLET_HI = '#E8B8FF', TEAL = '#3FD8C8', TEAL_HI = '#B8FFF2', AMBER = '#FFB23F', WHITE = '#FFFFFF', COPPER_HI = '#FFC58A';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.ixvorra ? FIEND_DEFS.ixvorra.RIG : null; } catch (e) { return null; } };
  const G = A.model('Ixvorra', () => ({}));
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const INFO = { lod: 0, calls: 0, tris: 0, W: 0, H: 0, ms: 0, poseMs: 0 };
  // the levels: a segment's steps along its arc, the core's grid, an eye's and a lid's, a cable's steps and round
  const CFG = [{ na: 18, cu: 56, cv: 36, es: 10, cn: 30, cr: 10, q: 1 }, { na: 10, cu: 32, cv: 20, es: 7, cn: 18, cr: 7, q: 0.6 }];
  // the section of a segment: a chamfered block, two points to an edge (x radial, y along the ring's normal; e its edge's index + share / 8)
  const SEC = (() => { const out = [], c = 0.28, P = [[1, 1 - c], [1 - c, 1], [-(1 - c), 1], [-1, 1 - c], [-1, -(1 - c)], [-(1 - c), -1], [1 - c, -1], [1, -(1 - c)]];
    for (let k = 0; k < 8; k++) { const a = P[k], b = P[(k + 1) % 8]; for (const f of [0.06, 0.94]) out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f), (k + f) / 8]); } return out; })();
  const NS = SEC.length, SQ = 0.74;   // (the core squashed in depth and height so it reads round in the fight's camera, as the 2D's)
  const SETS = [null, null];
  function set(L) { if (SETS[L] && G.MESH && G.MESH['ring' + L]) return SETS[L]; const t0 = nowMs(), C = CFG[L], R0 = RIG(), out = {}, per = C.na + 3;
    // the ring: ten segments in one grid (i along: per segment a closing ring, its arc, a closing ring; j round its section)
    out['ring' + L] = Y.mkGrid(per * R0.NSEG - 1, NS, (i, j) => { const li = i % per; return [SEC[j % NS][2], cl((li - 1) / C.na) + 2 * Math.floor(i / per)]; }, M_RING);
    out['core' + L] = Y.mkGrid(C.cu, C.cv, (i, j) => [i / C.cu, j / C.cv], M_CORE);
    { const B = GLM.builder(C.q); B.ell([0, 0, 0], [1, 1, 1], M_EYE, { seg: C.es + 4, rings: C.es }); out['eye' + L] = Y.copies(B.done(), R0.EYES.length); }
    { const B = GLM.builder(C.q); B.ell([0, 0, 0], [1.1, 1.1, 1.1], M_LID, { seg: C.es + 2, rings: Math.max(4, C.es >> 1), th0: 0, th1: Math.PI / 2 + 0.06 }); B.tor([0, 0, Math.cos(Math.PI / 2 + 0.06) * 1.1], Math.sin(Math.PI / 2 + 0.06) * 1.1, 0.07, M_LID + 0.2, { seg: C.es + 2, rseg: 4 }); out['lid' + L] = Y.copies(B.done(), R0.EYES.length * 2); }
    for (let k = 0; k < R0.NC; k++) out['cab' + k + L] = Y.mkGrid(C.cn, C.cr, (i, j) => [j / C.cr, i / C.cn + k * 2], M_CU);
    // the lamps: 0..19 the violet ring's electrodes, 20..39 the teal ring's, 40..49 the running lights, 50..55 the cables' tips
    { const B = GLM.builder(C.q); B.sph([0, 0, 0], 1, M_LAMP, 10); out['lamp' + L] = Y.copies(B.done(), 56); }
    Object.assign(G.MESH, out); SETS[L] = { C, per, ms: nowMs() - t0 }; return SETS[L]; }

  /* ---------- posing ---------- */
  const rpt = (c, F, ph, r, h) => [c[0] + r * (Math.cos(ph) * F.e1[0] + Math.sin(ph) * F.e2[0]) + h * F.n[0], c[1] + r * (Math.cos(ph) * F.e1[1] + Math.sin(ph) * F.e2[1]) + h * F.n[1], c[2] + r * (Math.cos(ph) * F.e1[2] + Math.sin(ph) * F.e2[2]) + h * F.n[2]];
  const hr = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function pose(FX, m, M, o) { const R0 = RIG(), L = Y.lod(), S = set(L), C = S.C, ME = G.MESH, ox = m.x, oy = m.y, rel = p => [p[0] - ox, p[1] - oy, p[2]], p = R0.pose(FX, m, M), segs = R0.segments(M, p), bt = p.bt, op = p.op, mn = M.menace || 0, wk = M.wake == null ? 1 : M.wake, halo = [], items = [];
    const fl2 = o.flash ? 1 : 0, w = R0.BW * p.S / 2, h = R0.BH * p.S, LP = ME['lamp' + L];
    // ---- the ring's segments
    { const Mr = ME['ring' + L], PP = Mr.pos, per = S.per, n1 = Mr.nu + 1;
      segs.forEach((s, k) => { const F = s.F, base = k * per;
        for (let li = 0; li < per; li++) { const f = cl((li - 1) / C.na), ph = lerp(s.a0, s.a1, f), cph = Math.cos(ph), sph = Math.sin(ph), rd = [cph * F.e1[0] + sph * F.e2[0], cph * F.e1[1] + sph * F.e2[1], cph * F.e1[2] + sph * F.e2[2]], ctr = rel(rpt(s.c, F, ph, s.r, 0)), sq = li === 0 || li === per - 1 ? 0 : 1;
          for (let j = 0; j <= NS; j++) { const q = SEC[j % NS], x = q[0] * w * sq * (1 + 0.04 * (q[0] > 0 ? 1 : 0)), y = q[1] * h * sq, o3 = (j * n1 + base + li) * 3; PP[o3] = ctr[0] + rd[0] * x + F.n[0] * y; PP[o3 + 1] = ctr[1] + rd[1] * x + F.n[1] * y; PP[o3 + 2] = ctr[2] + rd[2] * x + F.n[2] * y; } }
        // its electrodes, and the amber running light on its rim
        const ring = s.ring, k0 = ring ? 20 : 0; for (const [ee, ph] of [[0, s.a0 + 0.02], [1, s.a1 - 0.02]]) { const q = rel(rpt(s.c, F, ph, s.r, 0)); K.place(LP, k0 + k * 2 + ee, I3(), q, [0.11 * p.S, 0.11 * p.S, 0.11 * p.S]); K.hide(LP, (ring ? 0 : 20) + k * 2 + ee); halo.push([0, q, 0.32, ring ? TEAL : VIOLET, 0.45 + 0.25 * mn]); }
        const mph = (s.a0 + s.a1) / 2, rl = rel(rpt(s.c, F, mph, s.r + w * 1.02, 0)), on = ((bt * 1.7 + s.k * 0.37) % 2) < 0.5; if (on) { K.place(LP, 40 + k, I3(), rl, [0.06, 0.06, 0.06]); halo.push([0, rl, 0.38, AMBER, 0.75]); } else K.hide(LP, 40 + k); });
      for (let i = segs.length; i < 10; i++) { K.hide(LP, i * 2); K.hide(LP, i * 2 + 1); K.hide(LP, 20 + i * 2); K.hide(LP, 21 + i * 2); K.hide(LP, 40 + i); }
      Y.gridNormals(Mr, true); items.push({ mesh: Mr, glow: 0.7, spill: mn, kind: op, glow2: fl2, wear: M.split || 0 }); }
    // ---- the core: boiling plasma, its eyes
    const core = rel(p.core), RCs = R0.RC * p.S * (1 + op * 0.14 + (M.roar || 0) * 0.04), cr = M.coreRot || 0, cz = Math.cos(cr), sz = Math.sin(cr);
    { const Mc = ME['core' + L], PP = Mc.pos, nu = C.cu, nv = C.cv;
      for (let j = 0; j <= nv; j++) { const th = 0.001 + j / nv * (Math.PI - 0.002), st = Math.sin(th), ct = Math.cos(th);
        for (let i = 0; i <= nu; i++) { const ph = i / nu * TAU + cr, d0 = st * Math.cos(ph), d1 = st * Math.sin(ph), k = 1 + 0.035 * Math.sin(3 * ph + bt * 2.7 + ct * 4) + 0.025 * Math.sin(5 * th - bt * 3.9 + ph * 2) + 0.015 * Math.sin(9 * ph + 7 * th + bt * 6.1) + op * 0.03 * Math.sin(7 * ph + bt * 11), o3 = (j * (nu + 1) + i) * 3;
          PP[o3] = core[0] + d0 * RCs * k; PP[o3 + 1] = core[1] + d1 * RCs * k * SQ; PP[o3 + 2] = core[2] + ct * RCs * k * SQ; } }
      Y.gridNormals(Mc, false); items.push({ mesh: Mc, glow: 0.7 + mn * 0.3 + op * 0.5, spill: op, kind: mn, glow2: fl2, wear: 0.5, outline: false }); }
    { const ME2 = ME['eye' + L], LD = ME['lid' + L], ER = R0.EYES, me = FX.me;
      ER.forEach((e, i) => { const st = M.eyes ? M.eyes[i] : null, d0 = e.d, d = [d0[0] * cz - d0[1] * sz, d0[0] * sz + d0[1] * cz, d0[2]], g = vadd(core, [d[0] * RCs * 0.92, d[1] * RCs * 0.92 * SQ, d[2] * RCs * 0.92 * SQ]), er = e.r * p.S * (1 + op * 0.25), opn = st ? st.open : 1, bl = Math.max(st ? st.blink : 0, 1 - opn);
        const Rf = Y.along(vnrm(vadd(d, vmul(Y.PD, 0.9))), [0, 0, 1]), lk = st ? st.lk : [0, 0], gz = vnrm(vadd(Rf.x, vadd(vmul(Rf.y, -lk[0] * 0.35), vmul(Rf.z, -lk[1] * 0.3)))), Rg = Y.along(gz, Rf.z);
        K.place(ME2, i, Rg, g, [er, er, er]);
        const up = -0.85 + bl * (Math.PI / 2 + 0.85), dn = 1.0 - bl * (Math.PI / 2 + 1.0), rotY = th => { const c = Math.cos(th), s = Math.sin(th); return M3(vadd(vmul(Rf.x, c), vmul(Rf.z, -s)), Rf.y, vadd(vmul(Rf.x, s), vmul(Rf.z, c))); };
        const Ru = rotY(up), Rd0 = rotY(dn), Rd = M3(Rd0.x, vmul(Rd0.y, -1), vmul(Rd0.z, -1)); K.place(LD, i * 2, Ru, g, [er, er, er]); K.place(LD, i * 2 + 1, Rd, g, [er, er, er]); });
      K.commit(ME2); K.commit(LD); items.push({ mesh: ME2, glow: 0.5 + mn * 0.4, spill: op, kind: M.stunT || 0, glow2: fl2, wear: 0.2 }, { mesh: LD, glow2: fl2, wear: 0.6, glow: mn }); }
    // ---- the cables: copper, swept along the fight's chains
    if (M.cab) M.cab.forEach((cb, k) => { const Mc = ME['cab' + k + L]; if (!Mc) return; const pts = cb.P.map(rel); Y.sweep(Mc, pts, u => (0.15 - 0.085 * u) * p.S * (1 + 0.12 * Math.exp(-((((u * 9) % 2) - 1) ** 2) / 0.02)));
      items.push({ mesh: Mc, glow: 0.8 + mn * 0.4, spill: (bt * 0.9 + k * 0.23) % 1, glow2: fl2, wear: 0.1 + k * 0.15 });
      const tp = pts[pts.length - 1]; K.place(LP, 50 + k, I3(), tp, [0.07 * p.S, 0.07 * p.S, 0.07 * p.S]); halo.push([0, tp, 0.5, AMBER, 0.55 + 0.3 * Math.sin(bt * 9 + k)]);
      const u = (bt * 0.9 + k * 0.23) % 1, f = u * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(f)), pu = vadd(pts[j], vmul(vsub(pts[j + 1], pts[j]), f - j)); halo.push([0, pu, 0.5, VIOLET_HI, 0.75]); });
    K.commit(LP); items.push({ mesh: LP, glow: 1, kind: mn, glow2: fl2, outline: false });
    // ---- the glows: round the core, its light on the deck
    halo.push([0, core, RCs * 2.8, VIOLET, (0.35 + mn * 0.2 + op * 0.3) * wk], [0, [core[0], core[1], 0.05], 3.4, VIOLET, (0.28 + mn * 0.15) / (1 + p.z * 0.1)]);
    INFO.lod = L; return { items, halo, occ: [core.concat([RCs * 0.95])], p, segs }; }

  /* ---------- drawing ---------- */
  function drawBoss(c, FX, m, X, Y0, T, t) { if (!gpu()) return false; const M = FX.mem; if (!M) return false; let R;
    try { const t0 = nowMs(); R = pose(FX, m, M, { flash: m.flash > 0 }); INFO.poseMs = +(INFO.poseMs * 0.9 + (nowMs() - t0) * 0.1).toFixed(2); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Ixvorra: pose', e); return false; }
    const F = A.fg(), k = 1 / (1 + R.p.z * 0.12);
    if (FX.K && FX.K.shade) FX.K.shade(c, X, Y0, T * 3.1 * k, T * 1.5 * k, 0.45, '#04080C');
    let ok = false; try { ok = Y.pass(c, X, Y0, T, R.items, { light: 'hall', t: M.bt || t, flash: m.flash > 0 ? 1 : 0, occ: R.occ }, G, INFO); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Ixvorra: draw', e); }
    if (!ok) return false;
    if (F) { const Q = F.begin(c, null); try { Y.halos(Q, R.halo, X, Y0, T, 1); } finally { F.flush(c); } } return true; }

  /* ---------- its light ---------- */
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); }
  /* the deck's light: the coolant flowing, going live; the overcharging pylon's ring; the warnings (the 2D overlay keeps the labels: M.ybGL) */
  function overlay(c, FX, t, T) { const M = FX.mem, C = FX.C, R0 = RIG(); if (!M || !C || !R0) return false; const F = A.fg();
    if (!F || !G.on()) { M.ybGL = false; Y.marked(c, FX, t, T, null); return false; }
    M.ybGL = true; const Q = F.begin(c, null), S = M.sg, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), fr = Math.floor(t * 24);
    try {
      const Lh = Math.sqrt(R0.ARENA * R0.ARENA - R0.CH * R0.CH) - 0.2, lines = []; for (const s of [-1, 1]) lines.push({ h: true, o: s * R0.CH }, { h: false, o: s * R0.CH });
      let k = 0.7, md = 0; if (S) { const warn = S.t < S.warn, u = cl(S.t / S.warn); if (warn) { k = 0.8 + 0.5 * u * (0.55 + 0.45 * Math.sin(t * (10 + u * 16))); md = u > 0.05 ? 1 : 0; } else { k = 1.3 * cl((S.warn + S.live - S.t) / 0.4) + 0.4; md = 1; } }
      lines.forEach((q, i) => { const cx = q.h ? X0 : X0 + q.o * T, cy = q.h ? Y0 + q.o * T : Y0, ux = q.h ? Lh * T : 0, uy = q.h ? 0 : Lh * T, vx = q.h ? 0 : R0.CW / 2 * T * 1.15, vy = q.h ? R0.CW / 2 * T * 1.15 : 0; Q.quad(607, cx, cy, ux, uy, vx, vy, md ? TEAL_HI : TEAL, k, md, Lh * 2 / R0.CW);
        if (S && md) { const live = S.t >= S.warn, n = live ? 2 : Math.round(1 + cl(S.t / S.warn) * 3); for (let j = 0; j < n; j++) { const v = (hr(fr + i * 3.7 + j) * 2 - 1) * Lh, L2 = live ? Lh * 2 : 2.5, a0 = live ? -Lh : v, a1 = live ? Lh : v + (hr(j + fr) - 0.5) * L2, p0 = q.h ? [X0 + a0 * T, Y0 + q.o * T] : [X0 + q.o * T, Y0 + a0 * T], p1 = q.h ? [X0 + a1 * T, Y0 + q.o * T] : [X0 + q.o * T, Y0 + a1 * T];
            Y.bolt(Q, p0[0], p0[1], p1[0], p1[1], T * (live ? 0.16 : 0.08), live ? WHITE : TEAL_HI, live ? 0.9 : 0.6, fr * 3 + i * 13 + j); } } });
      const O = M.ov; if (O) { const pp = R0.pylonAt(C, O.i), X = FX.sx(pp[0]), Yy = FX.sy(pp[1]); Q.glow(X, Yy, T * 2.4, VIOLET, 0.4 + 0.25 * Math.sin(t * 7), 0.67); Q.ring(X, Yy, T * 1.9, VIOLET_HI, 0.75 + 0.2 * Math.sin(t * 9), T * 0.12, 0.66); }
      for (const s of FX.S.tele) if (s.aur) Y.tell(Q, FX, s, T, t, 1);
    } finally { F.flush(c); }
    return false; }
  /* the light in the air: the currents, the web, the spokes, the drain, the lash, the nova (the meter, arrows and labels stay 2D) */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m, C = FX.C, R0 = RIG(); if (!m || !M.ybGL || !R0 || !M.eyes) return false; const F = A.fg(); if (!F) return false;
    const Q = F.begin(c, null), fr = Math.floor(t * 22), S3 = q => [FX.sx(q[0]), FX.sy(q[1]) - q[2] * T];
    try {
      if (!m.dead) { const p = R0.pose(FX, m, M), segs = R0.segments(M, p), op = p.op, mn = M.menace || 0, wk = M.wake == null ? 1 : M.wake, q = S3(p.core);
        for (let r = 0; r < 2; r++) { const ring = segs.filter(s => (M.split > 0.001 ? s.ring === r : r === 0)); for (let j = 0; j < ring.length; j++) { const a = ring[j], b = ring[(j + 1) % ring.length]; if (hr(fr * 3.1 + a.k * 11 + r) >= (0.55 + mn * 0.4) * (1 - op * 0.75) * wk) continue;
            const P0 = S3(rpt(a.c, a.F, a.a1 - 0.02, a.r, 0)), P1 = S3(rpt(b.c, b.F, b.a0 + 0.02, b.r, 0)); if (Math.hypot(P0[0] - P1[0], P0[1] - P1[1]) > T * 3.2) continue; Y.bolt(Q, P0[0], P0[1], P1[0], P1[1], T * 0.09, a.ring ? TEAL_HI : VIOLET_HI, 0.95, fr + a.k * 5 + r * 50); } }
        const nv = FX.S.tele.find(s => s.nova && !s.done); if (nv) { const u = cl(nv.age / nv.t), pu = 0.6 + 0.4 * Math.sin(t * (8 + u * 30)); Q.glow(q[0], q[1], T * (2.2 + u * 3), VIOLET_HI, (0.35 + u * 0.5) * pu); Q.glow(q[0], q[1], T * 1.4, WHITE, 0.5 * u * pu);
          for (let i = 0; i < 3 + Math.round(u * 6); i++) { const a = hr(fr * 1.9 + i * 5) * TAU, Ln = T * (2.5 + hr(fr + i * 3) * 3.5 * (0.5 + u)); Y.bolt(Q, q[0], q[1], q[0] + Math.cos(a) * Ln, q[1] + Math.sin(a) * Ln * 0.8, T * 0.1, VIOLET_HI, 0.6 + u * 0.4, fr * 3 + i * 11); } }
        const n = Math.round((1 + mn * 2) * wk); for (let i = 0; i < n; i++) { const s = segs[Math.floor(hr(fr + i * 17) * segs.length)]; if (hr(fr * 1.7 + i) < 0.4 + op * 0.3) continue; const P0 = S3(rpt(s.c, s.F, (s.a0 + s.a1) / 2, s.r - R0.BW * 0.4, 0)); Y.bolt(Q, P0[0], P0[1], q[0] + (P0[0] - q[0]) * 0.3, q[1] + (P0[1] - q[1]) * 0.3, T * 0.09, VIOLET_HI, 0.75, fr * 2 + i * 31); } }
      // the arc web: its warning as lanes of light, then live beams of current
      const W = M.web; if (W) { W.beams.forEach((b, j) => { const A0 = R0.webEnd(FX, W, b.a), B0 = R0.webEnd(FX, W, b.b), za = b.a === 'N' ? 0.3 : R0.CON_Z, zb = b.b === 'N' ? 0.3 : R0.CON_Z, ax = FX.sx(A0[0]), ay = FX.sy(A0[1]) - za * T, bx = FX.sx(B0[0]), by = FX.sy(B0[1]) - zb * T;
          if (!W.live) { const u = cl(W.t / W.warn), dx = bx - ax, dy = by - ay, Ln = Math.hypot(dx, dy) || 1; Q.quad(601, (ax + bx) / 2, (ay + by) / 2, dx / 2, dy / 2, -dy / Ln * R0.BEAM * T * 0.6, dx / Ln * R0.BEAM * T * 0.6, VIOLET_HI, 1, u * 0.999, j * 7 + 1, Ln / (R0.BEAM * T * 1.2)); }
          else { const fl = 0.8 + 0.2 * Math.sin(t * 37 + j); Q.ebeam(ax, ay, bx, by, R0.BEAM * T * 0.55, VIOLET, 0.8, 0.85 * fl, j * 3.1, 2); Y.bolt(Q, ax, ay, bx, by, T * 0.12, VIOLET_HI, 1, fr + j * 41); Y.bolt(Q, ax, ay, bx, by, T * 0.07, WHITE, 0.6, fr * 3 + j * 17 + 9); Q.glow(ax, ay, T * 0.9, VIOLET_HI, 0.8); Q.glow(bx, by, T * 0.9, VIOLET_HI, 0.8); } });
        if (W.live && W.beams.some(b => b.a === 'N' || b.b === 'N')) { const N = R0.webEnd(FX, W, 'N'), p = R0.pose(FX, m, M), a = S3(p.core); Y.bolt(Q, a[0], a[1], FX.sx(N[0]), FX.sy(N[1]) - 0.3 * T, T * 0.12, VIOLET_HI, 0.9, fr * 5 + 3); } }
      // the split ring's spokes: their warning as lanes, then beams sweeping the hall
      const Sp = M.sp; if (Sp) { const pre = Sp.t - Sp.move; if (pre >= 0) { const live = pre >= Sp.warn, hx = FX.sx(m.x), hy = FX.sy(m.y) - 0.4 * T, Ln = R0.ARENA * 2.2;
          R0.spokeAngles(Sp).forEach((a, j) => { const ring = j >> 1, col = ring ? TEAL : VIOLET, hi = ring ? TEAL_HI : VIOLET_HI, ex = FX.sx(m.x + Math.cos(a) * Ln), ey = FX.sy(m.y + Math.sin(a) * Ln) - 0.4 * T, dx = ex - hx, dy = ey - hy, LL = Math.hypot(dx, dy) || 1;
            if (!live) Q.quad(601, (hx + ex) / 2, (hy + ey) / 2, dx / 2, dy / 2, -dy / LL * R0.SPOKE * T * 0.6, dx / LL * R0.SPOKE * T * 0.6, hi, 1, cl(pre / Sp.warn) * 0.999, j * 5 + 2, LL / (R0.SPOKE * T * 1.2));
            else { const fl = 0.85 + 0.15 * Math.sin(t * 41 + j); Q.ebeam(hx, hy, ex, ey, R0.SPOKE * T * 0.6, col, 0.9, fl, j * 2.3, 3); Y.bolt(Q, hx, hy, FX.sx(m.x + Math.cos(a) * 16), FX.sy(m.y + Math.sin(a) * 16) - 0.4 * T, T * 0.12, hi, 0.9, fr + j * 23); } });
          if (live) { Q.glow(hx, hy, T * 1.6, VIOLET_HI, 0.8); const p = R0.pose(FX, m, M), a = S3(p.core); Y.bolt(Q, a[0], a[1], hx, hy, T * 0.12, WHITE, 0.8, fr * 7); } } }
      // the drain: a torrent of current from the overcharging pylon's cap into the core, beads of charge running up it
      const O = M.ov; if (O && O.t > 0 && !m.dead) { const pp = R0.pylonAt(C, O.i), cx = FX.sx(pp[0]), cy = FX.sy(pp[1]) - R0.CAP_Z * T, p = R0.pose(FX, m, M), a = S3(p.core), f = O.fill || 0;
        Y.bolt(Q, cx, cy, a[0], a[1], T * 0.14, VIOLET_HI, 0.85 + f * 0.15, fr); Y.bolt(Q, cx, cy, a[0], a[1], T * 0.08, WHITE, 0.5 + f * 0.4, fr * 3 + 7); Q.glow(cx, cy, T * (1 + f), VIOLET_HI, 0.6 + 0.3 * f);
        for (let i = 0; i < 6; i++) { const u = (t * 1.4 + i / 6) % 1, x = lerp(cx, a[0], u), y = lerp(cy, a[1], u) - Math.sin(u * Math.PI) * T * 0.6; Q.glow(x, y, T * 0.3, WHITE, 0.9); } }
      // the nova going out
      if (M.nova) { const u = M.nova.t / 1.2, X = FX.sx(M.nova.x), Yy = FX.sy(M.nova.y), Rr = M.nova.r * T * (0.3 + u * 0.8); Q.ring(X, Yy, Rr, VIOLET_HI, (1 - u) * 0.7, T * (0.6 - u * 0.4)); Q.glow(X, Yy, M.nova.r * T, VIOLET_HI, (1 - u) * 0.4); }
      // the lash: a sweep of copper light round its arc
      const Lh = M.lash; if (Lh) { const u = cl(Lh.t / Lh.dur), fade = Lh.t > Lh.dur ? 1 - (Lh.t - Lh.dur) / 0.5 : 1; if (fade > 0) { const a0 = Lh.a0 - Lh.dir * Lh.s, a1 = a0 + 2 * Lh.dir * Lh.s * u, mid = (a0 + a1) / 2, half = Math.abs(a1 - a0) / 2, X = FX.sx(Lh.x), Yy = FX.sy(Lh.y) - 0.3 * T;
          for (const [rr, bw, col, al] of [[Lh.len * 0.85, 0.09, COPPER_HI, 0.8], [Lh.len * 0.55, 0.08, AMBER, 0.55]]) { const R = rr * T * 1.06; Q.quad(603, X, Yy, R, 0, 0, R, col, 1, (rr * T / R) + 10 * Math.round(bw * 100 * (rr / Lh.len)), mid + Math.PI, Math.max(0.01, Math.PI - half) + 10 * Math.round(al * fade * 10)); } } }
    } finally { F.flush(c); }
    return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { if (G.on() && RIG()) set(Y.lod()); }]; }
  function info() { const tr = L => { if (!SETS[L] || !G.MESH) return null; let n = 0; for (const k in G.MESH) if (k.endsWith(String(L)) && G.MESH[k]) n += G.MESH[k].ntri; return n; }; return Object.assign({}, INFO, { trisFull: tr(0), trisLod: tr(1), buildMs: [SETS[0] && Math.round(SETS[0].ms), SETS[1] && Math.round(SETS[1].ms)] }); }
  return { G, gpu, drawBoss, overlay, drawFx, init, preload, info, get kit() { return A; }, get y3() { return Y; } };
})();
