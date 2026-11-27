/* ---------- (v470 AB) AHUUL THE WHITE HORIZON in three dimensions (Rift 05, the Pale Aurora's last boss: the Broad Summit) ----------
   The 2D Ahuul of 20z6-rift-fiend-aurora-3.js rebuilt as a GPU model on AUR3 (20z4a) at Rift 03/04's bosses' fidelity, from the 2D
   drawing: the whale's hide one smooth surface written every frame over the fight's own spine (its build(): twenty-one frames from the
   snout to the tail stock, each its width and its upper and lower heights; the surface follows a smooth curve through them, not the
   2D's facets), so it hangs exactly where its head's hit areas are. A broad blunt skull and a deep navy back, mottled, aurora light
   drifting along it, rime glinting; a white belly and throat, the throat pleated (the pleats lit green when it is bared); the mouth's
   long line from the blunt snout back under the bands of lights; in place of eyes two bands of seven small green lights curving
   behind the jaw; five green vents down each flank pulsing in a wave from head to tail (all flaring when it breathes); a low ridge of
   faceted ice plates along its spine; two enormous pectoral fins (pale above, navy at the root, white beneath) tapering into three
   squared tips; the fluke's two lobes beating at the end of the tail stock; six thin pale tendrils hanging from its chin, glowing at
   their tips. Materials GLM 733/735/737/738 (AB-AUR-MAT); its light on FGFX (kinds 540..552, AB-FX): the sweep's threatened half
   frosted with chevrons running the fin's way, the wave of snow it drives, the breath's frost crust advancing from the north rim,
   the lit shelter, the starfall's motes and their rings, the breath's stream. Without the GPU model or the painter the 2D whale and
   its effects are drawn as before. */
const AHUUL_GL = (() => {
  const A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv, mm, rotZ } = K, lowFx = K.lowFx;
  const M_LIGHT = 733.6, M_VENT = 733.8, M_ICE = 735, M_HIDE = 737, M_FIN = 737.2, M_FLUKE = 737.4, M_TEND = 738;
  const GREEN = '#78D7B2', GREEN_HI = '#B8F5DA', ICE_HI = '#CFE8F4', EMBER = '#FFC46B', WHITE = '#FFFFFF';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.ahuul ? FIEND_DEFS.ahuul.RIG : null; } catch (e) { return null; } };
  const G = A.model('Ahuul', buildMeshes);
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const NU = 64, NV = 30, sOf = u => 0.004 + 0.996 * Math.pow(u, 1.25);   // (denser toward the head)
  function buildMeshes() { const R0 = RIG(), DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(4, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    out.body = A.grid(NU, NV, M_HIDE, (u, v) => v, (u, v) => sOf(u));
    /* a fin (x along it 0..1, y across it in its chords, tapering as the 2D's; z its thickness) */
    { const B = nb(), P = R0.FINP.map(([t, q2]) => [t, q2 * (1 - t * 0.12)]); B.prism(P, -0.1, 0.1, M_FIN, { b: 0.02 }); fin('fin', B); }
    /* the fluke: both lobes (x across, y back along the stock) */
    { const B = nb(), F = R0.FLUKE, P = F.concat(F.slice().reverse().map(([x, y]) => [-x, y])); B.prism(P.filter((p, i) => i === 0 || Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) > 1e-4), -0.08, 0.08, M_FLUKE, { b: 0.04 }); fin('fluke', B); }
    /* a ridge plate: a faceted pyramid of ice (x along the spine, y across, z up its height) */
    { const B = nb(), a = [-0.5, 0, 0], b = [0.5, 0, 0], l = [0, 0.5, 0], r = [0, -0.5, 0], ap = [0.05, 0, 1]; B.facet([a, l, ap], M_ICE); B.facet([l, b, ap], M_ICE); B.facet([b, r, ap], M_ICE); B.facet([r, a, ap], M_ICE); out.ridge = K.multi(B.done(), 9); }
    /* a vent: a curved slit (x along it, y across), its light by uGlow */
    { const B = nb(); B.surf((u, v) => [u - 0.5, v - 0.5, 0.12 * (1 - (2 * v - 1) * (2 * v - 1)) * Math.sin(u * Math.PI)], q(8), q(5), () => M_VENT, { e: (u, v) => v, a: (u, v) => u }); out.vents = K.multi(B.done(), 10); }
    { const B = nb(); B.sph([0, 0, 0], 1, M_LIGHT, q(8)); out.lights = K.multi(B.done(), 14); out.tips = K.multi(B.done(), 6); }
    for (let i = 0; i < 6; i++) out['tend' + i] = A.grid(12, 5, M_TEND, (u, v) => v, (u, v) => u);
    return out; }
  /* the spine, smooth: a Catmull-Rom curve through the frames' centres, their sizes eased between */
  function spineAt(G2, s) { const F = G2.frs, n = F.length; let k = 0; while (k < n - 2 && F[k + 1].s < s) k++; const A0 = F[Math.max(0, k - 1)], B0 = F[k], C0 = F[k + 1], D0 = F[Math.min(n - 1, k + 2)], t = cl((s - B0.s) / Math.max(1e-6, C0.s - B0.s)), t2 = t * t, t3 = t2 * t;
    const cr = i => 0.5 * (2 * B0.c[i] + (-A0.c[i] + C0.c[i]) * t + (2 * A0.c[i] - 5 * B0.c[i] + 4 * C0.c[i] - D0.c[i]) * t2 + (-A0.c[i] + 3 * B0.c[i] - 3 * C0.c[i] + D0.c[i]) * t3), e = t * t * (3 - 2 * t);
    return { c: [cr(0), cr(1), cr(2)], v: vnrm(vadd(vmul(B0.v, 1 - t), vmul(C0.v, t))), u: vnrm(vadd(vmul(B0.u, 1 - t), vmul(C0.u, t))), d: vnrm(vadd(vmul(B0.d, 1 - t), vmul(C0.d, t))), w: lerp(B0.w, C0.w, e), hU: lerp(B0.hU, C0.hU, e), hL: lerp(B0.hL, C0.hL, e) }; }
  function surfAt(G2, s, ph, out) { const F = spineAt(G2, s), cs = Math.cos(ph), sn = Math.sin(ph), h = sn > 0 ? F.hU : F.hL, n = vnrm(vadd(vmul(F.v, cs / Math.max(0.2, F.w)), vmul(F.u, sn / Math.max(0.2, h))));
    return { p: vadd(vadd(F.c, vadd(vmul(F.v, cs * F.w), vmul(F.u, sn * h))), vmul(n, out || 0)), n, F }; }
  function listOf(FX, M, ox, oy, L, o) { const R0 = RIG(), G2 = M.G, P = G2.P, bt = M.bt || 0, rel = q2 => [q2[0] - ox, q2[1] - oy, q2[2]], gl2 = o.flash ? 1 : 0, thr = P.throat || 0, lf = lowFx();
    // the hide
    A.regrid(G.MESH.body, (i, j) => { const s = sOf(i / NU), ph = j / NV * TAU, S2 = surfAt(G2, s, ph, 0); return rel(S2.p); }, true);
    L.push({ part: 'body', R: I3(), o: [0, 0, 0], glow: thr * (0.6 + 0.4 * Math.sin(bt * 5)), glow2: gl2, wear: 0.4 });
    // the fins
    for (const sd of [-1, 1]) { const Fn = G2.fins[sd], gw = M.finGlow ? M.finGlow[String(sd)] || 0 : 0; L.push({ part: 'fin', R: M3(Fn.a, Fn.ch, Fn.nf), o: rel(Fn.root), sc: [R0.LF, R0.CF, 1], glow: gw * (0.6 + 0.4 * Math.sin(bt * 12)), glow2: gl2, wear: 0.3 + sd * 0.1 }); }
    // the fluke
    { const Fl = G2.fluke, Fe = G2.frs[G2.frs.length - 1], side = Fe.v, n = Fl.n; let dd = vnrm(vcross(n, side)); if (vdot(dd, Fe.d) < 0) dd = vmul(dd, -1); L.push({ part: 'fluke', R: M3(side, dd, n), o: rel(Fe.c), glow2: gl2, wear: 0.7 }); }
    // the ridge of ice plates down the spine, light running along them
    { const MS = G.MESH.ridge; for (let i = 0; i < 9; i++) { const s0 = 0.25 + i * 0.05, s1 = s0 + 0.038, sm = (s0 + s1) / 2, S2 = surfAt(G2, sm, Math.PI / 2, -0.06), F = S2.F, hgt = 0.55 + 0.25 * Math.sin(i * 1.7) + (i > 2 && i < 6 ? 0.15 : 0);
        K.place(MS, i, M3(F.d, F.v, F.u), rel(S2.p), [(s1 - s0) * R0.L, 0.84, hgt]); } K.commit(MS); L.push({ part: 'ridge', R: I3(), o: [0, 0, 0], glow: 0.15 + 0.25 * Math.max(0, Math.sin(bt * 1.2)), glow2: gl2 }); }
    // the vents: five down each flank, pulsing in a wave (all flaring when it breathes)
    { const MS = G.MESH.vents, vk = M.ventK || 0; let k = 0, gsum = 0; for (const sd of [1, -1]) for (let i = 0; i < 5; i++) { const s = 0.3 + i * 0.065, ph = sd > 0 ? 0.62 : Math.PI - 0.62, S2 = surfAt(G2, s, ph, 0.02), F = S2.F, n = S2.n, tg = vnrm(vcross(n, F.d));
        K.place(MS, k++, M3(F.d, tg, n), rel(S2.p), [0.034 * 2 * R0.L, 0.42, 0.5]); gsum += cl(0.35 + 0.65 * Math.max(0, Math.sin(bt * 1.5 - i * 0.85)) + vk * 0.6 + (P.inhale || 0) * 0.3); }
      K.commit(MS); L.push({ part: 'vents', R: I3(), o: [0, 0, 0], glow: gsum / 10 * 1.4, glow2: gl2, outline: false }); }
    // the bands of lights behind the jaw, in place of eyes
    { const MS = G.MESH.lights, ek = M.eyeK == null ? 1 : M.eyeK; let k = 0; for (const sd of [1, -1]) for (let i = 0; i < 7; i++) { const s = 0.128 + i * 0.005 + i * i * 0.0014, ph0 = 0.36 - i * 0.16, S2 = surfAt(G2, s, sd > 0 ? ph0 : Math.PI - ph0, 0.04); K.place(MS, k++, I3(), rel(S2.p), [0.13, 0.13, 0.13]); }
      K.commit(MS); L.push({ part: 'lights', R: I3(), o: [0, 0, 0], glow: 0.9 * ek, outline: false }); }
    // the tendrils under the chin, drifting
    { const MT = G.MESH.tips; for (let i = 0; i < 6; i++) { const ph = -Math.PI / 2 + (i - 2.5) * 0.3, root = surfAt(G2, 0.055 + Math.abs(i - 2.5) * 0.008, ph, -0.05).p, pts = [root];
        for (let k = 1; k <= 5; k++) { const pr = pts[k - 1], sw = Math.sin(bt * 0.8 + i * 1.3 + k * 0.5) * 0.12 * k, sw2 = Math.cos(bt * 0.6 + i * 0.7 + k * 0.4) * 0.08 * k; pts.push([pr[0] + sw * 0.45 + (i - 2.5) * 0.03, pr[1] + 0.06 + sw2 * 0.6 + (thr ? 0.2 : 0), pr[2] - 0.34 * (1 - thr * 0.4)]); }
        const Pt = A.spline(pts, 12), Fr = A.frames(Pt, [0, 1, 0]); A.tube(G.MESH['tend' + i], Pt, Fr, u => 0.05 - u * 0.032, ox, oy); L.push({ part: 'tend' + i, R: I3(), o: [0, 0, 0], glow: 0.6 + 0.3 * Math.sin(bt * 2 + i), glow2: gl2, outline: false });
        K.place(MT, i, I3(), rel(pts[5]), [0.08, 0.08, 0.08]); }
      K.commit(MT); L.push({ part: 'tips', R: I3(), o: [0, 0, 0], glow: 1.2, outline: false }); } }
  /* the whale: one pass over the summit (faded high overhead so the summit reads through it) */
  function drawWhale(c, FX, m, T, t) { if (!gpu()) return false; const M = FX.mem, P = M.G && M.G.P; if (!P) return false; if (P.alpha < 0.02) return true; const a = cl(P.alpha) * (1 - 0.4 * cl(P.over || 0)), fl = m.flash > 0, L = [];
    const ox = m.x, oy = m.y; try { listOf(FX, M, ox, oy, L, { flash: fl }); } catch (e) { G.fail(); return false; }
    c.save(); c.globalAlpha *= a; const ok = A.passOf(c, FX.sx(ox), FX.sy(oy), T, L, { t: M.bt || t, light: 'summit', flash: fl ? 1 : 0, zs: 3 }, G); c.restore(); return ok; }
  /* previews and the art sheet: the fight-less pose (the 2D demoPaint's), on the GPU */
  function demo(c, FX, m, X, Y, T, t) { if (!gpu()) return false; const R0 = RIG(), M = FX.mem || {}; if (!R0.demoPose(FX, m, M)) return false; const L = [];
    try { listOf(FX, M, m.x, m.y, L, {}); } catch (e) { G.fail(); return false; } return A.passOf(c, X, Y, T, L, { t: M.bt || t, light: 'summit', zs: 3 }, G); }
  /* ---- its light ---- */
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); if (FX.__aurHz) return; FX.__aurHz = 1; const h0 = FX.hz;
    FX.hz = q2 => { const z = h0(q2); if (z && z.kind === 'frost' && z.draw) { const d0 = z.draw; z.draw = (c, z2, F2, T, t) => { if (!frostGL(c, z2, F2, T, t)) d0(c, z2, F2, T, t); }; } return z; }; }
  // the breath's frost over the open summit: a pale crust advancing from the north rim, crystals glinting in it (the warm bubble left clear)
  function frostGL(c, z, FX, T, t) { const F = A.fg(); if (!F) return false; const M = FX.mem, C = FX.C, R0 = RIG(), fade = Math.min(1, z.age / 0.3, Math.max(0, z.life - z.age) / 0.8); if (fade <= 0) return true; const front = -1 + Math.min(1, z.age / 0.7) * 2.2, B = M.bubble, Q = F.begin(c, null);
    try { Q.quad(552, FX.sx(C.x), FX.sy(C.y), R0.RX * T, 0, 0, R0.RY * T, ICE_HI, fade, front, B ? (B.x - C.x) / R0.RX + 5 : 0, B ? Math.round(((B.y - C.y) / R0.RY + 2) * 100) * 1000 + Math.round(Math.min(0.999, B.r / R0.RX) * 1000) : 0); } finally { F.flush(c); } return true; }
  /* the floor's light: the sweep's half, the wave of snow, the lit shelter, the warnings (the starfall's rings among them) */
  function overlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m; if (!M || !M.G) return false; const F = A.fg(), marked = FX.S.tele.filter(s => s.aur);
    if (!F || !G.on() || !RIG()) { M.aurGL = false; if (!marked.length) return false; for (const s of marked) A.tele2D(c, FX, s, T, t); return false; }
    M.aurGL = true; const R0 = RIG(), RX = R0.RX, RY = R0.RY, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), Q = F.begin(c, null);
    try {
      if (M.sw && !(M.sw.k > 0)) { const S2 = M.sw, u = cl((FX.S.t - (S2.t0 || (S2.t0 = FX.S.t))) / S2.W), sd = S2.side; Q.quad(551, X0 + sd * RX * T / 2, Y0, sd * RX * T / 2, 0, 0, RY * T, ICE_HI, 1, u * 0.999, 0, 0); }
      if (M.wave) { const W2 = M.wave, u = cl(W2.t / 0.6), sd = W2.side; Q.quad(551, X0 + sd * RX * T / 2, Y0, sd * RX * T / 2, 0, 0, RY * T, WHITE, 1 - cl((W2.t - 0.6) / 0.3), -1 + u * 2.1, 1, 0); }
      const lit = M.br && (M.br.st === 'inhale' || M.br.st === 'exhale') ? { k: M.br.k, col: EMBER, u: M.br.st === 'inhale' ? cl((FX.S.t - M.br.t0) / M.br.INH) : 1 } : M.rs && m && m.act === 'rise' ? { k: M.rs.k, col: GREEN_HI, u: cl((FX.S.t - M.rs.t0) / 6.6) } : null;
      if (lit) { const N = R0.nookAt(C, lit.k), X = FX.sx(N[0]), Y = FX.sy(N[1]), pu = 0.5 + 0.5 * Math.sin(t * 5); Q.glow(X, Y, T * 2.8, lit.col, 0.3 + 0.2 * pu, 0.7); Q.quad(547, X, Y, T * (R0.NOOK + 0.5) * 1.25, 0, 0, T * (R0.NOOK + 0.5) * 0.9, lit.col, 1, 0.9 + 0.3 * (1 - lit.u), 4.4); }
      { const px = FX.sx(C.x + R0.PED[0]), py = FX.sy(C.y + R0.PED[1]); Q.glow(px, py, T * 1.7, EMBER, M.ember && M.ember.st === 'rest' ? 0.4 + 0.15 * Math.sin(t * 2) : 0.12, 0.56); }
      for (const s of marked) A.tell(Q, FX, s, T, t, { mode: s.mote ? 2 : 0 });
    } finally { F.flush(c); }
    return false; }   // (the 2D overlay still lays the whale's shadow, the horde's count; it leaves what is drawn here: M.aurGL)
  /* the light in the air: the starfall's motes coming down, the breath's stream, the bared throat's mark */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m, C = FX.C; if (!m || !M.G || !M.aurGL) return false; const F = A.fg(); if (!F) return false; const Q = F.begin(c, null);
    try {
      for (const s of FX.S.tele) { if (s.done || !s.mote) continue; const u = cl(s.age / s.t), X = FX.sx(s.x), Y = FX.sy(s.y) - (1 - u * u) * T * 12; Q.beam(X, Y - T * 1.6, X, Y - T * 0.2, T * 0.1, ICE_HI, 0.5); Q.glow(X, Y, T * 0.9, ICE_HI, 0.6); Q.star(X, Y, T * 0.35, 0.95, WHITE); }
      if (M.br && M.br.st === 'exhale' && M.frost) { const sn = M.G.snout, X0 = FX.sx(sn[0]), Y0 = FX.sy(sn[1]) - sn[2] * T, tx = FX.sx(C.x), ty = FX.sy(C.y + 3), Z = M.frost, fade = cl(Z.age / 0.3) * cl((Z.life - Z.age) / 0.8), n = lowFx() ? 10 : 21;
        for (let k = 0; k < n; k++) { const u = (t * 0.8 + k / n) % 1, sp = ((k % 3) - 1) * u * T * 6, x = lerp(X0, tx, u) + sp, y = lerp(Y0, ty, u) + Math.sin(k * 2.1 + t * 3) * T * 0.5, r = T * (0.5 + u * 2.3);
          Q.glow(x, y, r * 1.5, '#96C3E1', 0.35 * (1 - u * 0.7) * fade); Q.glow(x - r * 0.12, y - r * 0.1, r * 0.9, '#ECF6FC', 0.45 * (1 - u * 0.7) * fade); if (k % 4 === 0) Q.star(x + r * 0.3, y - r * 0.2, T * 0.25, 0.8 * (1 - u) * fade, WHITE); } }
      if (m.stunT > 0 && FX.S.weak.throat && !FX.S.weak.throat.dead) { const w = FX.S.weak.throat, X = FX.sx(w.x), Y = FX.sy(w.y), pu = 0.5 + 0.5 * Math.sin(t * 7); Q.ring(X, Y, T * (1.5 + pu * 0.3), GREEN_HI, 0.6 + 0.4 * pu, T * 0.14); Q.glow(X, Y, T * 2.2, GREEN, 0.3); }
      else if (m.act === 'bow' && M.headC) { const h = M.headC, X = FX.sx(h[0]), Y = FX.sy(h[1]) - h[2] * T; Q.quad(547, X, Y, T * 3.4, 0, 0, T * 2.5, GREEN_HI, 0.8, 1, 2.2); }
    } finally { F.flush(c); }
    return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { G.on(); }]; }
  return { G, gpu, drawWhale, demo, overlay, drawFx, init, preload, get kit() { return A; } };
})();
