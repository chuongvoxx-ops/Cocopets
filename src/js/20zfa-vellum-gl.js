/* ---------- (v474 LB) VELLUM THE INKBOUND in three dimensions (Rift 07, the Library's second boss: the Spilled-Ink Chamber) ----------
   The 2D Vellum of 20zf-rift-fiend-library-2.js rebuilt as a sculpted, textured and lit GPU model on LIB3 (20zea), the same cuttlefish
   from its 2D drawing, posed every frame on the fight's own skeleton (its pose(): the mantle's height, heading, pitch, roll and scale
   as it hovers, rears and drops; the four short tentacles curling; the two long arms along the fight's own curves, swinging in the
   swipe and coiled round a lectern in the tether; the fin rippling; the eyes tracking and blinking; the slit cracking open when it is
   blinded), so it hangs exactly where its hit areas are and its fight is untouched. Materials GLM 950..957 (LB-LIB-MAT, 20k5uz).
   THE MANTLE (950, 951): a broad pen nib of black lacquer (a deep clear coat, violet flake), domed over its middle, the 2D's gold
   trim inlaid all round its sides and point, the shoulders' gold scrollwork and spirals, the slit running back from a gold-ringed
   breather hole to the point; blinded, the slit parts along its length on a gold-white heart. Under it a cream belly (soft, light
   under the skin), ink drips hanging from its south edge.
   THE FIN (952): a thin burgundy membrane all round the sides and the point, rippling in a slow wave; rays, chromatophores, light
   through it, an iridescent edge.
   THE HEAD: a cream chin under a black lacquer cap, a gold collar where it meets the mantle, three gold eyes in dark sockets with
   gold brows (954: a W-shaped pupil, wet; a round one when blinded).
   THE TENTACLES AND ARMS (953): mottled burgundy skin with chromatophores and a wet sheen, each a tube swept along the fight's own
   points; pale suckers on their undersides (cups of 953.4); the arms clubbed.
   LIGHT: one pass in the Chamber's light (candle gold, a burgundy dusk rim, the boards' warm bounce); soft shadows and occlusion from
   two spheres. On the painter: the eyes' glow, the heart's light through the slit.
   LEVELS: full on High; Balanced, Performance and Fewer effects take the lighter level. GPU buffers freed with the stage. */
const VELLUM_GL = (() => {
  const L3 = LIB3, Y = YUG3, A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv } = K, lowFx = K.lowFx, nowMs = K.nowMs;
  const M_ENA = 950, M_CRM = 951, M_FIN = 952, M_SKIN = 953, M_EYE = 954, M_GOLD = 955, M_INK = 957;
  const GOLD = '#CFAD62', GOLD_HI = '#F2DC9A', BURG_HI = '#C0507E', WHITE = '#FFFFFF';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.vellum ? FIEND_DEFS.vellum.RIG : null; } catch (e) { return null; } };
  const G = A.model('Vellum', () => ({}));
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const INFO = { lod: 0, calls: 0, tris: 0, W: 0, H: 0, ms: 0, poseMs: 0 };
  // the levels: the mantle (round, out), the fin (along, across), a tentacle and an arm (along, round), a sucker's and the eye's rings
  const CFG = [{ q: 1, ma: 160, mr: 26, fa: 96, fr: 5, tu: 22, tr: 10, au: 44, ar: 12, su: 12, es: 24 }, { q: 0.6, ma: 80, mr: 12, fa: 48, fr: 3, tu: 12, tr: 7, au: 24, ar: 8, su: 8, es: 14 }];
  const SETS = [null, null];
  // a point round the mantle's outline (a 0..1 round, from the nose), linear between the 2D's contour points
  const ctr = (R0, a) => { const C = R0.CONTOUR, n = C.length, f = (((a % 1) + 1) % 1) * n, i = Math.floor(f) % n, e = f - Math.floor(f), p = C[i], q = C[(i + 1) % n]; return [lerp(p[0], q[0], e), lerp(p[1], q[1], e)]; };
  function set(L) { if (SETS[L] && G.MESH && G.MESH['mant' + L]) return SETS[L]; const t0 = nowMs(), C = CFG[L], R0 = RIG(), out = {}, CEN = R0.CEN, TOP = R0.TOP, BEL = R0.BELLY;
    /* the mantle (still, in the body's frame: u forward, v left, h up): its lacquered top (vA.y the radius 0..1, vA.z round), its belly */
    { const B = GLM.builder(1), at = (u, r) => { const c = ctr(R0, u), x = CEN[0] + (c[0] - CEN[0]) * r, y = c[1] * r; return [x, y, TOP + R0.surfH(x, y) + 0.07 * (1 - r * r) - 0.04 * Math.pow(r, 8)]; };
      B.surf((u, v) => at(u, Math.pow(v, 0.8)), C.ma, C.mr, () => M_ENA, { e: (u, v) => Math.pow(v, 0.8), a: u => u, flip: true });
      B.surf((u, v) => { const c = ctr(R0, u); if (v < 0.4) { const k = v / 0.4, r = lerp(1.0, 0.84, k), sw = Math.sin(k * Math.PI) * 0.06; return [CEN[0] + (c[0] - CEN[0]) * (r + sw), c[1] * (r + sw), lerp(TOP - 0.02, BEL, Math.pow(k, 0.85))]; } const k = (v - 0.4) / 0.6, r = 0.84 * (1 - k); return [CEN[0] + (c[0] - CEN[0]) * r, c[1] * r, BEL - 0.06 * Math.sin(k * Math.PI / 2)]; }, C.ma, Math.round(C.mr * 0.8), () => M_CRM, { e: (u, v) => v, a: u => u });
      out['mant' + L] = B.done(); }
    /* the head: the cream chin, the black cap, the gold collar, three dark sockets with gold brows (in the body's frame) */
    { const B = GLM.builder(C.q); B.ell([1.98, 0, -0.14], [1.02, 1.48, 0.56], M_CRM + 0.2, { seg: 40, rings: 22 }); B.ell([1.86, 0, 0.06], [0.96, 1.42, 0.46], M_ENA + 0.4, { seg: 40, rings: 20, th1: Math.PI * 0.62, cap: false });
      const col = []; for (let j = 0; j <= 16; j++) { const v = lerp(-1.2, 1.2, j / 16); col.push([1.36 + 0.26 * (v / 1.15) ** 2, v, 0.3 - 0.13 * (v / 1.15) ** 2]); } for (let j = 0; j < 16; j++) B.tube(col[j], col[j + 1], 0.06, 0.06, M_GOLD, { seg: 10, cap0: j === 0 ? 'round' : false, cap1: 'round' });
      for (const v of [-0.76, 0, 0.76]) { const c = [2.26, v, 0.4 - Math.abs(v) * 0.1], d = vnrm([0.75, v * 0.35, 0.65]), R = Y.along(d, [0, 0, 1]); B.push(R.y, R.z, R.x, c); B.tor([0, 0, -0.06], 0.36, 0.07, M_ENA + 0.4, { seg: 24, rseg: 6 }); B.tor([0, 0, -0.03], 0.42, 0.04, M_GOLD, { seg: 20, rseg: 5, ph0: Math.PI * 0.12, ph1: Math.PI * 0.88 }); B.pop(); }
      out['head' + L] = B.done(); }
    out['fin' + L] = Y.mkGrid(C.fa, C.fr, (i, j) => [j / C.fr, i / C.fa], M_FIN);
    for (let k = 0; k < 4; k++) out['ten' + k + L] = Y.mkGrid(C.tu, C.tr, (i, j) => [j / C.tr, i / C.tu + k * 2], M_SKIN);
    for (let k = 0; k < 2; k++) out['arm' + k + L] = Y.mkGrid(C.au, C.ar, (i, j) => [j / C.ar, i / C.au + k * 2 + 8], M_SKIN);
    // the suckers: shallow cups (z their axis, local xy the cup's face); the eyes; the ink drips (teardrops hanging along -z)
    { const B = GLM.builder(1); B.lathe([[0.0, 0.0], [-0.02, 0.55], [0.12, 1.0], [0.3, 0.86], [0.2, 0.4], [0.16, 0.0]], M_SKIN + 0.4, { seg: C.su, edge: j => j / 5 }); const M = B.done(); for (let i = 0; i < M.nv; i++) { const x = M.pos[i * 3], y = M.pos[i * 3 + 1], z = M.pos[i * 3 + 2]; M.pos[i * 3] = y; M.pos[i * 3 + 1] = z; M.pos[i * 3 + 2] = x; const nx = M.nrm[i * 3], ny = M.nrm[i * 3 + 1], nz = M.nrm[i * 3 + 2]; M.nrm[i * 3] = ny; M.nrm[i * 3 + 1] = nz; M.nrm[i * 3 + 2] = nx; } out['suck' + L] = Y.copies(M, 34); }
    { const B = GLM.builder(1); B.sph([0, 0, 0], 1, M_EYE, C.es); out['eye' + L] = Y.copies(L3.eyeAtt(B.done()), 3); }
    { const B = GLM.builder(C.q); B.lathe([[0.0, 0.0], [-0.3, 0.35], [-0.7, 0.55], [-0.92, 0.42], [-1.0, 0.0]], M_INK, { seg: 10 }); const M = B.done(); for (let i = 0; i < M.nv; i++) { const x = M.pos[i * 3], z = M.pos[i * 3 + 2]; M.pos[i * 3] = z; M.pos[i * 3 + 2] = x; const nx = M.nrm[i * 3], nz = M.nrm[i * 3 + 2]; M.nrm[i * 3] = nz; M.nrm[i * 3 + 2] = nx; } out['drip' + L] = Y.copies(M, 8); }
    { const B = GLM.builder(1); B.sph([0, 0, 0], 1, M_INK, Math.round(8 * C.q + 4)); out['glob' + L] = Y.copies(B.done(), 32); }
    out['jet' + L] = Y.mkGrid(C.tu, C.tr, (i, j) => [j / C.tr, i / C.tu], M_INK);
    Object.assign(G.MESH, out); SETS[L] = { C, ms: nowMs() - t0 }; return SETS[L]; }

  /* ---------- posing ---------- */
  function suckers(SU, nk, pts, rad, u0, u1, n, S) { const m = pts.length - 1;
    for (let i = 0; i < n; i++) { const u = lerp(u0, u1, (i + 0.5) / n), f = u * m, q = Math.min(m - 1, Math.floor(f)), e = f - q, p = vadd(pts[q], vmul(vsub(pts[q + 1], pts[q]), e)), d = vnrm(vsub(pts[q + 1], pts[q]));
      let dn = vsub([0, 0.35, -1], vmul(d, vdot([0, 0.35, -1], d))); dn = vlen(dn) > 1e-3 ? vnrm(dn) : [0, 0, -1]; const r = rad(u), sc = r * 0.62 * (1 - u * 0.3);
      K.place(SU, nk + i, Y.along(d, vmul(dn, -1)), vadd(p, vmul(dn, r * 0.88)), [sc, sc, sc * 0.9]); } return nk + n; }
  function pose(FX, m, M, o) { const R0 = RIG(), L = L3.lod(), S = set(L), C = S.C, ME = G.MESH, ox = m.x, oy = m.y, rel = p => [p[0] - ox, p[1] - oy, p[2]], p = R0.pose(FX, m, M), W = p.W, Sc = p.S, bt = p.bt, op = p.op, halo = [], items = [];
    const fl2 = o.flash ? 1 : 0, dead = o.dead || 0, Rb = A.frameOf(W, Sc), o0 = rel(W(0, 0, 0)), sc = [Sc, Sc, Sc], mn = M.menace || 0, stun = m.stunT > 0;
    // ---- the mantle, the head
    items.push({ mesh: ME['mant' + L], R: Rb, o: o0, sc, spill: op, glow2: fl2, fx: dead, wear: 0.35 }, { mesh: ME['head' + L], R: Rb, o: o0, sc, glow2: fl2, fx: dead, wear: 0.62 });
    if (op > 0.02) { halo.push([0, rel(W(-0.8, 0, R0.TOP + R0.HUMP * 0.7)), 3 * op, GOLD_HI, 0.5 * op], [0, rel(W(-0.8, 0, R0.TOP + R0.HUMP)), 1.4 * op, WHITE, 0.35 * op]); }
    // ---- the fin: rippling round the sides and the point
    { const Mf = ME['fin' + L], PP = Mf.pos, nu = Mf.nu, nv = Mf.nvv, FI = R0.FIN_IDX, CT = R0.CONTOUR, NR = R0.NRM, nF = FI.length - 1;
      for (let i = 0; i <= nu; i++) { const f = i / nu * nF, a = Math.min(nF - 1, Math.floor(f)), e = f - a, i0 = FI[a], i1 = FI[a + 1], u = lerp(CT[i0][0], CT[i1][0], e), v = lerp(CT[i0][1], CT[i1][1], e), nx = lerp(NR[i0][0], NR[i1][0], e), ny = lerp(NR[i0][1], NR[i1][1], e), ph = bt * 2.3 - f * 0.42, w = (0.5 + 0.08 * Math.sin(bt * 1.7 - f * 0.3)) * (1 - op * 0.3), ends = Math.min(1, i / nu * 12, (nu - i) / nu * 12);
        for (let j = 0; j <= nv; j++) { const s = j / nv, h = R0.TOP - 0.1 + (0.17 * Math.sin(ph) + 0.06 * Math.sin(ph * 1.7 + s * 3)) * s * s, ww = -0.08 + (w + 0.08) * s * (0.3 + 0.7 * ends), q = rel(W(u + nx * ww, v + ny * ww, h - 0.06 * s * (1 - ends))), o3 = (j * (nu + 1) + i) * 3; PP[o3] = q[0]; PP[o3 + 1] = q[1]; PP[o3 + 2] = q[2]; } }
      Y.gridNormals(Mf, false); items.push({ mesh: Mf, glow2: fl2, fx: dead, wear: 0.5 }); }
    // ---- the eyes: gold, tracking the pet, blinking; wandering when blinded
    { const LS = ME['eye' + L], me = FX.me || { x: m.x, y: m.y + 5 }; [-0.76, 0, 0.76].forEach((v, k) => { const w = W(2.26, v, 0.4 - Math.abs(v) * 0.1), q = rel(w), dx = me.x - w[0], dy = me.y - w[1], dl = Math.hypot(dx, dy) || 1;
        const lk = stun ? [Math.cos(bt * 5 + k * 2) * 0.6, Math.sin(bt * 5 + k * 2) * 0.6] : [dx / dl * Math.min(1, dl / 3), dy / dl * Math.min(1, dl / 3)], gz = vnrm(vadd(vadd(vmul(Rb.x, 0.55), [0, 0.45, 0.7]), [lk[0] * 0.35, lk[1] * 0.25, 0])), bl = Math.max((M.blink && M.blink[k]) || 0, 1 - (M.wake == null ? 1 : M.wake)), r = 0.33 * Sc;
        K.place(LS, k, Y.along(gz, [0, 0, 1]), q, [r, r, r * Math.max(0.08, 1 - bl)]); halo.push([0, q, 0.9 * Sc, GOLD_HI, (0.3 + mn * 0.25) * (1 - bl)]); }); K.commit(LS);
      items.push({ mesh: LS, glow: 0.7 + mn * 0.6, spill: stun ? 1 : 0, glow2: fl2, fx: dead, outline: false }); }
    // ---- the tentacles and the arms, their suckers
    const SU = ME['suck' + L]; let ns = 0;
    for (let k = 0; k < 4; k++) { const pts = R0.tentPts(m, M, p, k).map(rel), Mt = ME['ten' + k + L], rad = u => (0.22 - 0.15 * u) * Sc; Y.sweep(Mt, pts, u => rad(u) * (1 + 0.06 * Math.sin(u * 40))); items.push({ mesh: Mt, glow2: fl2, fx: dead, wear: 0.1 + k * 0.2 }); ns = suckers(SU, ns, pts, rad, 0.3, 0.85, 4, Sc); }
    R0.ARM_S.forEach((s, k) => { const pts = R0.armPts(FX, m, M, p, s).map(rel), n = pts.length, N = 14, tk = M.st && M.st.on && M.st.side === s ? 1.3 : 1, Ma = ME['arm' + k + L], rad = u => R0.armW(Math.min(1, u * (n - 1) / N), Sc) * tk * 0.5;
      Y.sweep(Ma, pts, u => rad(u) * (1 + 0.05 * Math.sin(u * 50))); items.push({ mesh: Ma, glow2: fl2, fx: dead, wear: 0.3 + k * 0.4, glow: tk > 1 ? 0.6 + 0.4 * Math.sin(bt * 9) : 0 }); ns = suckers(SU, ns, pts.slice(0, N + 1), u => R0.armW(u, Sc) * tk * 0.5, 0.5, 0.95, 9, Sc); });
    for (; ns < 34; ns++) K.hide(SU, ns); K.commit(SU); items.push({ mesh: SU, glow2: fl2, fx: dead, wear: 0.8, outline: false });
    // ---- the ink hanging in drips from the belly's south edge
    { const DR = ME['drip' + L], CT = R0.CONTOUR, NR = R0.NRM; let nd = 0; for (let i = 2; i < CT.length && nd < 8; i += 5) { const n = NR[i], ny = Math.sin(p.th) * n[0] + Math.cos(p.th) * n[1]; if (ny <= 0.3) continue; const [u, v] = CT[i], q = rel(W(R0.CEN[0] + (u - R0.CEN[0]) * 0.84, v * 0.84, R0.BELLY)), Lk = (0.16 + 0.2 * (Math.sin(bt * 1.3 + nd * 2.1) + 1) / 2) * Sc, w = 0.1 * Sc;
        K.place(DR, nd++, I3(), q, [w, w, Lk]); } for (; nd < 8; nd++) K.hide(DR, nd); K.commit(DR); items.push({ mesh: DR, glow2: fl2, fx: dead, wear: 0.2, outline: false }); }
    // ---- the ink in flight: the globs (and their trails), the jet's stream from under its head
    { const GB = ME['glob' + L]; let ng = 0; for (const Gq of (M.globs || [])) { const u = cl(Gq.t / Gq.fly), hh = Gq.small ? 2.5 : 3.6, r0 = Gq.small ? 0.28 : 0.42;
        for (let j = 0; j <= 3 && ng < 32; j++) { const u2 = Math.max(0, u - j * 0.05), x = lerp(Gq.x0, Gq.x, u2), y = lerp(Gq.y0, Gq.y, u2), z = lerp(Gq.z0, 0.2, u2) + Math.sin(Math.PI * u2) * hh, r = r0 * (1 - j * 0.2) * (j ? 1 : 0.85 + 0.15 * Math.sin(bt * 20 + Gq.seed)); K.place(GB, ng++, Y.rotZ(bt * 3 + Gq.seed), rel([x, y, z]), [r, r * 0.9, r * (j ? 0.9 : 1.05)]); } }
      for (let i = ng; i < 32; i++) K.hide(GB, i); K.commit(GB); if (ng) items.push({ mesh: GB, glow2: 0, wear: 0.6, outline: false }); }
    const J = M.jet; if (J) { const u = cl(J.t / J.dur), fade = J.t > J.dur ? 1 - (J.t - J.dur) / 0.4 : 1; if (fade > 0.02) { const s0 = rel(W(2.3, 0, -0.55)), e0 = rel([J.x + Math.cos(J.a) * J.len, J.y + Math.sin(J.a) * J.len, 0.2]), reach = Math.min(1, u * 3), e1 = vadd(s0, vmul(vsub(e0, s0), reach)), pts = [];
        for (let i = 0; i <= 8; i++) { const f = i / 8, q = vadd(s0, vmul(vsub(e1, s0), f)); q[2] += Math.sin(f * Math.PI) * 0.3 + Math.sin(bt * 30 + f * 9) * 0.05; pts.push(q); } const w = J.w * 0.75 * 0.5 * (0.8 + 0.2 * Math.sin(bt * 40)) * Math.sqrt(fade);
        Y.sweep(ME['jet' + L], pts, f => w * (0.7 + 0.3 * f) * (1 + 0.12 * Math.sin(f * 30 - bt * 40))); items.push({ mesh: ME['jet' + L], wear: 0.2, outline: false }); halo.push([1, s0, e1, J.w * 0.4, '#8A5BD0', 0.55 * fade]); } }
    const occ = [rel(W(-0.5, 0, 0)).concat([1.7 * Sc]), rel(W(1.9, 0, -0.05)).concat([0.95 * Sc])];
    // ---- the tether: the exposed arm lit gold along its middle
    const St = M.st; if (St && St.on && St.reach >= 1 && !stun) { const pts = R0.armPts(FX, m, M, p, St.side), a = Math.round(pts.length * 0.48), b = Math.round(pts.length * 0.76), pul = 0.6 + 0.4 * Math.sin(bt * 9); for (let i = a; i <= b; i += 2) halo.push([0, rel(pts[i]), 0.75, GOLD_HI, (0.25 + 0.2 * pul + (M.armHit || 0) * 0.4)]); }
    INFO.lod = L; return { items, halo, occ, p }; }

  /* ---------- drawing ---------- */
  function draw(c, FX, m, X, Y0, T, t) { if (!gpu()) return false; const M = FX.mem; if (!M) return false; let R;
    try { const t0 = nowMs(); R = pose(FX, m, M, { flash: m.flash > 0, dead: 0 }); INFO.poseMs = +(INFO.poseMs * 0.9 + (nowMs() - t0) * 0.1).toFixed(2); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Vellum: pose', e); return false; }
    const F = A.fg(), p = R.p, k = 1 / (1 + p.z * 0.1);
    if (FX.K && FX.K.shade) FX.K.shade(c, X, Y0, T * 3.3 * k * p.S, T * 1.75 * k * p.S, 0.5, '#1A0E18');
    let ok = false; try { ok = L3.draw(c, X, Y0, T, R.items, { light: 'ink', t: M.bt || t, flash: m.flash > 0 ? 1 : 0, occ: R.occ }, G, INFO); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Vellum: draw', e); }
    if (!ok) return false;
    if (F) { const Q = F.begin(c, null); try { Y.halos(Q, R.halo, X, Y0, T, 1); } finally { F.flush(c); } } return true; }
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); }
  /* ---------- its light on the boards: the warnings (ink rings closing in for the globs and the brood, gold lanes for the real
     redaction bands, a fan for the swipe, a lane for the jet); the 2D overlay keeps the patches, the lies, the stamps, the flood and
     the labels (M.lbGL) ---------- */
  const ROSEL = '#F2A0D2', INKV = '#C9A0FF';
  function overlay(c, FX, t, T) { const M = FX.mem; if (!M || !M.lect) return false; const F = A.fg();
    if (!F || !G.on()) { M.lbGL = false; Y.marked(c, FX, t, T, null); return false; }
    M.lbGL = true; const Q = F.begin(c, null);
    try { for (const s of FX.S.tele) if (s.aur) L3.tell(Q, FX, s, T, s.redact ? GOLD_HI : s.geo === 'circle' ? INKV : ROSEL, 1); } finally { F.flush(c); }
    return false; }
  /* ---------- in the air: the swipe's sweep of light round its arc ---------- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M.lbGL) return false; const F = A.fg(); if (!F) return false; const Q = F.begin(c, null);
    try { const Lw = M.sw; if (Lw) { const u = cl(Lw.t / Lw.dur), fade = Lw.t > Lw.dur ? 1 - (Lw.t - Lw.dur) / 0.5 : 1; if (fade > 0) { const a0 = Lw.a0 - Lw.dir * Lw.s, a1 = a0 + 2 * Lw.dir * Lw.s * u, mid = (a0 + a1) / 2, half = Math.abs(a1 - a0) / 2, X = FX.sx(Lw.x), Yy = FX.sy(Lw.y) - 0.4 * T;
          for (const [rr, bw, col, al] of [[Lw.len * 0.86, 0.1, BURG_HI, 0.9], [Lw.len * 0.86, 0.03, WHITE, 0.7], [Lw.len * 0.6, 0.07, INKV, 0.5]]) { const R = rr * T * 1.06; Q.quad(603, X, Yy, R, 0, 0, R, col, 1, (rr * T / R) + 10 * Math.round(bw * 100 * (rr / Lw.len)), mid + Math.PI, Math.max(0.01, Math.PI - half) + 10 * Math.round(al * fade * 10)); } } } } finally { F.flush(c); }
    return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { if (G.on() && RIG()) set(L3.lod()); }]; }
  const info = () => L3.info(G, SETS, INFO);
  return { G, gpu, draw, overlay, drawFx, init, preload, info, get kit() { return A; }, get y3() { return Y; } };
})();
