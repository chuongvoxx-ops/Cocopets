/* ---------- (v470 AB) NIVORA THE AURORAWING in three dimensions (Rift 05, the Pale Aurora's second boss: the Telescope Platform) ----------
   The 2D Nivora of 20z5-rift-fiend-aurora-2.js rebuilt as a GPU model on AUR3 (20z4a) at Rift 03/04's bosses' fidelity, from the 2D
   drawing: posed every frame on the fight's own skeleton (its RIG: pose, wings, the eye's curve), so it flies exactly where its hit
   areas are. A compact body of navy lacquer (a thorax keeled with plates of ice, faint green lines along its flanks; an abdomen ringed
   with pale ice), no beak: its head a smooth dark sphere of glass split by one luminous horizontal eye (a lens of light laid on the
   sphere along the fight's own eye curve, narrowing with menace, blinking, its bright core running along it as it scans); four broad
   wings in an X (each a curved membrane between the fight's five wing points, frozen white at the root to aurora green at the tip,
   veined and cross-veined like an insect's, its leading edge a bright rib of ice, seen through); two long stiff tail vanes of navy
   with a rib of ice and a green point; six thin dark legs tucked under. Materials GLM 731/733/734/735/736 (AB-AUR-MAT); its light on
   FGFX (kinds 540..550, AB-FX): its lanes (beads of light for their order, never numbers), the gaze's fan, the frozen rim, the
   windbreaks as curtains of aurora, the crosswind's streaks, the streams behind its wing tips, the gaze's blade. Without the GPU
   model or the painter the 2D Nivora and its effects are drawn as before. */
const NIVORA_GL = (() => {
  const A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv, mm, rotZ } = K, lowFx = K.lowFx;
  const M_NAVY = 731, M_JOINT = 731.2, M_SLIT = 733.4, M_LIGHT = 733.6, M_WING = 734, M_ICE = 735, M_PLATE = 735.2, M_HEAD = 736;
  const GREEN = '#78D7B2', GREEN_HI = '#B8F5DA', ICE_HI = '#CFE8F4', EYE = '#DDFBF0', WHITE = '#FFFFFF';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.nivora ? FIEND_DEFS.nivora.RIG : null; } catch (e) { return null; } };
  const G = A.model('Nivora', buildMeshes);
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const NWU = 14, NWV = 9, NEU = 14, NEV = 3, NTU = 12, NTV = 4;
  function buildMeshes() { const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(4, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    /* the thorax (body frame: u forward, v left, h up): navy lacquer, a keel of ice plates down its back, green lines along its flanks */
    { const B = nb(); B.ell([0, 0, 0], [0.95, 0.82, 0.68], M_NAVY, { seg: q(28), rings: q(16) });
      for (let k = 0; k < 5; k++) { const u = 0.5 - k * 0.25, z = 0.62 + 0.14 * Math.cos(u * 1.6); B.crystal([u + 0.14, 0, z - 0.08], [u - 0.12, 0, z + 0.22 - Math.abs(u) * 0.1], 0.13, M_ICE, { n: 4, thin: 0.45, seed: k * 1.3, belly: 0.4 }); }
      for (const s of [-1, 1]) B.tube([0.6, s * 0.47, 0.42], [-0.6, s * 0.52, 0.36], 0.028, 0.022, M_LIGHT, { seg: q(6), cap0: 'round', cap1: 'round' }); fin('thorax', B); }
    /* the abdomen: navy, ringed with three bands of pale ice */
    { const B = nb(); B.ell([0, 0, 0], [0.62, 0.54, 0.46], M_NAVY, { seg: q(24), rings: q(14) });
      for (let k = 0; k < 3; k++) { const u = 0.22 - k * 0.22, f = Math.sqrt(Math.max(0.05, 1 - (u / 0.62) * (u / 0.62))); B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [u, 0, 0]); B.tor([0, 0, 0], 0.5 * f, 0.035, M_PLATE, { seg: q(24), rseg: q(5) }); B.pop(); }
      fin('abdomen', B); }
    /* the head: a smooth sphere of dark glass (radius 1, scaled) */
    { const B = nb(); B.sph([0, 0, 0], 1, M_HEAD, q(30)); fin('head', B); }
    /* the eye slit, the wings, the tail vanes: grids written every frame from the fight's own points */
    out.eye = A.grid(NEU, NEV, M_SLIT, (u, v) => u, (u, v) => v);
    for (let k = 0; k < 4; k++) out['wing' + k] = A.grid(NWU, NWV, M_WING, (u, v) => v, (u, v) => u);
    for (let k = 0; k < 2; k++) out['vane' + k] = A.grid(NTU, NTV, M_NAVY, (u, v) => v, (u, v) => u);
    { const B = nb(); B.tube([0, 0, 0], [1, 0, 0], 1, 0.55, M_JOINT, { seg: q(7), cap0: 'flat', cap1: 'flat' }); out.legs = K.multi(B.done(), 12); }
    { const B = nb(); B.tube([0, 0, 0], [1, 0, 0], 1, 1, M_PLATE, { seg: q(5), cap0: 'flat', cap1: 'flat' }); out.ribs = K.multi(B.done(), 2); }
    { const B = nb(); B.sph([0, 0, 0], 1, M_LIGHT, q(10)); fin('glowball', B); }
    return out; }
  const bez = (a, k, b, u) => [0, 1, 2].map(i => (1 - u) * (1 - u) * a[i] + 2 * (1 - u) * u * k[i] + u * u * b[i]);
  const thru = (a, b, c) => [0, 1, 2].map(i => 2 * b[i] - (a[i] + c[i]) / 2);
  /* the whole bird, posed: its parts (relative to (ox, oy)) */
  function listOf(FX, m, M, ox, oy, L, o) { const R0 = RIG(), p = R0.pose(FX, m, M), W = p.W, S = p.S, Rb = A.frameOf(W, S), Wg = R0.wings(FX, m, M, p), rel = q => [q[0] - ox, q[1] - oy, q[2]], gl2 = o.flash ? 1 : 0, al = o.al == null ? 1 : o.al, menace = M.menace || 0, unf = M.unfold == null ? 1 : M.unfold;
    L.push({ part: 'thorax', R: Rb, o: rel(W(0, 0, 0.05)), s: S, glow: 0.4 + menace * 0.6, glow2: gl2, al });
    L.push({ part: 'abdomen', R: Rb, o: rel(W(-0.92, 0, -0.02)), s: S, glow2: gl2, al });
    const h = R0.headWorld(p), r = 0.62 * S; L.push({ part: 'head', R: Rb, o: rel(h), s: r, glow: 0.4 + menace * 0.5, glow2: gl2, al });
    // the eye: a lens of light on the sphere between the fight's own top and bottom curves (pushed out a hair)
    { const E = R0.eyeCurve(M, p), scan = cl(((M.scan || 0) + 1.45) / 2.9), core = cl(0.5 + (scan - 0.5)), push = 1.025;
      A.regrid(G.MESH.eye, (i, j) => { const tp = E.top[i].p, bt = E.bot[i].p, v = j / NEV, q = [lerp(tp[0], bt[0], v) - h[0], lerp(tp[1], bt[1], v) - h[1], lerp(tp[2], bt[2], v) - h[2]], l = vlen(q) || 1; return [h[0] - ox + q[0] / l * r * push, h[1] - oy + q[1] / l * r * push, h[2] + q[2] / l * r * push]; }, false);
      L.push({ part: 'eye', R: I3(), o: [0, 0, 0], glow: 0.5 + menace * 0.4 + p.st * 0.5 + (M.beamK || 0) * 0.5, spill: core, al, outline: false }); }
    // the legs: thin and dark, tucked under, hanging lower when it sinks to rest
    { const MS = G.MESH.legs, dn = (M.breath || 0) * 0.35 + p.st * 0.4; let k = 0;
      for (const s of [-1, 1]) for (let j = 0; j < 3; j++) { const sh = W(0.45 - j * 0.45, s * 0.42, -0.35), ft = W(0.75 - j * 0.65, s * (0.75 + j * 0.1), -0.95 - dn - Math.sin(p.bt * 1.5 + j + s) * 0.05), kn = [(sh[0] + ft[0]) / 2, (sh[1] + ft[1]) / 2, (sh[2] + ft[2]) / 2 + 0.25];
        for (const [a, b, w] of [[sh, kn, 0.06], [kn, ft, 0.035]]) { const sg = A.seg(rel(a), rel(b), w, 0, 0); K.place(MS, k++, sg.R, sg.o, [sg.sc[0], w, w]); } }
      K.commit(MS); L.push({ part: 'legs', R: I3(), o: [0, 0, 0], glow2: gl2, al }); }
    // the tail vanes: long stiff blades, swinging a beat behind its turns; a rib of ice down each, a green point
    { const MR = G.MESH.ribs;
      for (let k = 0; k < 2; k++) { const s = k ? 1 : -1, root = W(-1.42, s * 0.16, 0.02), a = (M.tailHd == null ? p.th : M.tailHd) + Math.PI + s * 0.11 + Math.sin(p.bt * 0.9 + s) * 0.03, Lt = 4.6 * S, d = [Math.cos(a), Math.sin(a)], nv = [-d[1], d[0]], dip = -0.35 - (M.passK || 0) * -0.25 + p.st * -0.5;
        const ax = u => [root[0] + d[0] * u * Lt, root[1] + d[1] * u * Lt, root[2] + dip * u + Math.sin(p.bt * 1.4 + s * 1.3 - u * 1.2) * 0.12 * u], wd = u => (u < 0.72 ? lerp(0.07, 0.34, u / 0.72) : lerp(0.34, 0.0, (u - 0.72) / 0.28)) * S;
        A.regrid(G.MESH['vane' + k], (i, j) => { const u = i / NTU, v = j / NTV, q = ax(u), w = wd(u) * (v * 2 - 1), th = 0.05 * S * Math.sin(v * Math.PI); return [q[0] - ox + nv[0] * w, q[1] - oy + nv[1] * w, q[2] + th]; }, false);
        L.push({ part: 'vane' + k, R: I3(), o: [0, 0, 0], glow2: gl2, al });
        const sg = A.seg(rel(ax(0.05)), rel(ax(0.93)), 0.035 * S, 0, 0); K.place(MR, k, sg.R, [sg.o[0], sg.o[1], sg.o[2] + 0.04 * S], [sg.sc[0], 0.035 * S, 0.035 * S]);
        L.push({ part: 'glowball', R: I3(), o: rel(ax(0.92)), s: 0.1 * S, glow: 0.8 + menace * 0.6, al, outline: false }); }
      K.commit(MR); L.push({ part: 'ribs', R: I3(), o: [0, 0, 0], glow: 0.3, glow2: gl2, al }); }
    // the wings: a curved membrane between the root, the leading edge, the tip, the trailing edge and the root behind
    Wg.forEach((w, k) => { const P = w.pts, k1 = thru(P[0], P[1], P[2]), k2 = thru(P[2], P[3], P[4]), nrm0 = vnrm(vcross(vsub(P[2], P[0]), vsub(P[4], P[0]))), nrm = nrm0[2] < 0 ? vmul(nrm0, -1) : nrm0;
      A.regrid(G.MESH['wing' + k], (i, j) => { const u = i / NWU, v = j / NWV, le = bez(P[0], k1, P[2], u), te = bez(P[4], k2, P[2], u), cam = 0.12 * S * Math.sin(v * Math.PI) * (1 - u * 0.7), q = [lerp(le[0], te[0], v), lerp(le[1], te[1], v), lerp(le[2], te[2], v)];
        return [q[0] - ox + nrm[0] * cam, q[1] - oy + nrm[1] * cam, q[2] + nrm[2] * cam]; }, false);
      L.push({ part: 'wing' + k, R: I3(), o: [0, 0, 0], glow: 0.35 + menace * 0.5 + (M.passK || 0) * 0.4, kind: 2, al: 0.99 * al * Math.min(1, 0.4 + unf), glow2: gl2, outline: false, dz: vdot(rel(w.at), A.PD) }); });
    return p; }
  function drawBoss(c, FX, m, X, Y, T, t) { if (!gpu()) return false; const M = FX.mem || {}, L = [], fl = m.flash > 0;
    let p; try { p = listOf(FX, m, M, m.x, m.y, L, { flash: fl }); } catch (e) { G.fail(); return false; }
    // its shadow on the stone: a soft X, larger and fainter the higher it flies
    const k = 1 / (1 + p.z * 0.1); FX.K.shade(c, X, Y, T * 2.2 * k, T * 1.2 * k, 0.4, '#0A1426');
    for (const w of RIG().wings(FX, m, M, p)) { const qx = (w.pts[2][0] + w.pts[0][0]) / 2, qy = (w.pts[2][1] + w.pts[0][1]) / 2; FX.K.shade(c, X + (qx - m.x) * T, Y + (qy - m.y) * T, T * 1.3 * k, T * 0.7 * k, 0.22, '#0A1426'); }
    return A.passOf(c, X, Y, T, L, { t: M.bt || t, light: 'obs', flash: fl ? 1 : 0 }, G); }
  /* ---- its light ---- */
  const lab = (c, X, Y, s, col, T, sz) => { c.save(); c.font = `900 ${Math.round(T * (sz || 0.4))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, X, Y); c.fillText(s, X, Y); c.restore(); };
  /* its warnings marked for light; the pass's lingering curtain and the frozen rim drawn on the GPU */
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); if (FX.__aurHz) return; FX.__aurHz = 1; const h0 = FX.hz;
    FX.hz = q => { const z = h0(q); if (!z) return z; if (z.kind === 'rim' && z.draw) { const d0 = z.draw; z.draw = (c, z2, F2, T, t) => { if (!rimGL(c, z2, F2, T, t)) d0(c, z2, F2, T, t); }; }
      else if (z.shape === 'line' && !z.draw) z.draw = (c, z2, F2, T, t) => { if (!curtainGL(c, z2, F2, T, t)) { z2.draw = null; } }; return z; }; }
  // the downwind rim freezing: a band of frost along the parapet, icicles of light growing inward as the wind arrives (no hard line)
  function rimGL(c, z, FX, T, t) { const F = A.fg(); if (!F) return false; const W = z.cw, C = FX.C, on = W && W.t > W.warn, fade = Math.min(1, z.age / 0.4, (z.life - z.age) / 0.4); if (fade <= 0) return true;
    const a = W ? W.a : 0, R = (C.R + 0.2) * T, k = on ? Math.min(1, (W.t - W.warn) / 0.5) : Math.min(1, z.age / Math.max(0.5, W ? W.warn : 1)) * 0.5, Q = F.begin(c, null);
    try { Q.quad(550, FX.sx(C.x), FX.sy(C.y), R, 0, 0, R, ICE_HI, fade, (on ? 1 : 0) + k * 0.999 + Math.round((C.R - 2.4) / (C.R + 0.2) * 100) * 10, ((a % TAU) + TAU) % TAU, 1.25); } finally { F.flush(c); }
    const lx = FX.sx(C.x + Math.cos(a) * (C.R - 3.5)), ly = FX.sy(C.y + Math.sin(a) * (C.R - 3.5)); c.save(); c.globalAlpha *= fade; lab(c, lx, ly, 'FROZEN RIM', '#FFFFFF', T, 0.45); c.restore(); return true; }
  // the pass's lingering curtain of light along its lane
  function curtainGL(c, z, FX, T, t) { const F = A.fg(); if (!F) return false; const fade = Math.min(1, z.age / 0.4, (z.life - z.age) / 0.6); if (fade <= 0) return true; const ca = Math.cos(z.a), sa = Math.sin(z.a), cx = FX.sx(z.x + ca * z.len / 2), cy = FX.sy(z.y + sa * z.len / 2), H = 2.4 * T, Q = F.begin(c, null);
    try { Q.quad(541, cx, cy, ca * z.len / 2 * T, sa * z.len / 2 * T, -sa * z.w / 2 * T, ca * z.w / 2 * T, GREEN_HI, fade * 0.8, 1.2, 7.7, z.len / z.w);
      Q.quad(549, cx, cy - H / 2, ca * z.len / 2 * T, sa * z.len / 2 * T, 0, -H / 2, GREEN_HI, 1, fade * 0.9, 3.1, z.len / 2.4); } finally { F.flush(c); } return true; }
  /* the floor's light: the vanes' rings and the windbreaks' sockets (glows, never hard rings), the warnings */
  function overlay(c, FX, t, T) { const M = FX.mem, C = FX.C, S = M && M.sh; if (!M || !C || !M.vch || !M.bar) return false; const F = A.fg(), marked = FX.S.tele.filter(s => s.aur);
    if (!F || !G.on() || !RIG()) { if (!marked.length) return false; for (const s of marked) A.tele2D(c, FX, s, T, t); return false; }
    const R0 = RIG(), labels = [], Q = F.begin(c, null);
    try {
      for (let i = 0; i < 2; i++) { const q = R0.vaneAt(C, i), X = FX.sx(q[0]), Y = FX.sy(q[1]), Ln = S && S.lanes.find(l => l.vane === i), usable = !!(Ln && FX.m && FX.m.act === 'shear' && S.locked !== i && !(M.bar[i] && M.bar[i].up)), locked = !!(S && S.locked === i), ch = cl((M.vch[i] || 0) / R0.TURN), r = R0.VR * T;
        if (usable) { Q.glow(X, Y, r * 1.6, GREEN_HI, 0.3 + 0.15 * Math.sin(t * 5), 0.7); Q.ring(X, Y, r, GREEN_HI, 0.6 + 0.3 * Math.sin(t * 6), T * 0.12, 0.7); }
        else Q.ring(X, Y, r, locked ? ICE_HI : GREEN_HI, locked ? 0.55 : 0.22, T * 0.08, 0.7);
        if (ch > 0.01) labels.push(['arc', X, Y - T * 2.6, ch]);
        if (usable || locked) labels.push(['t', X, Y + r + T * 0.5, locked ? 'FROZEN' : ch > 0.01 ? 'TURNING' : 'TURN · stand here', locked ? ICE_HI : '#FFFFFF']);
        const B = R0.sockAt(C, i), bx = FX.sx(B[0]), by = FX.sy(B[1]); Q.ring(bx, by, T * 0.7, usable ? GREEN_HI : '#B89A5E', usable ? 0.55 + 0.3 * Math.sin(t * 4) : 0.35, T * 0.08, 0.7);
        if (usable && Ln) { const pa = Ln.a + Math.PI / 2, h = (R0.LW / 2 + 0.8); Q.quad(546, bx, by, Math.cos(pa) * h * T, Math.sin(pa) * h * T, -Math.sin(pa) * 0.4 * T, Math.cos(pa) * 0.4 * T, GREEN_HI, 0.8, 1, 2.2, h / 0.4); } }
      for (const s of marked) A.tell(Q, FX, s, T, t);
    } finally { F.flush(c); }
    for (const L of labels) { if (L[0] === 'arc') { c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = Math.max(4, T * 0.2); c.beginPath(); c.arc(L[1], L[2], T * 0.5, 0, TAU); c.stroke(); c.strokeStyle = GREEN_HI; c.lineWidth = Math.max(3, T * 0.14); c.beginPath(); c.arc(L[1], L[2], T * 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * L[3]); c.stroke(); c.restore(); } else lab(c, L[1], L[2], L[3], L[4], T); }
    return true; }
  /* the light in the air: the streams behind its wing tips, the shimmer off the tips, the eye's glow, the gaze's blade; the windbreaks as
     curtains of aurora; the crosswind's streaks */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m) return false; const F = A.fg(); if (!F || !G.on() || !RIG()) return false; const R0 = RIG(), C = FX.C, lf = lowFx(), sx = q => FX.sx(q[0]), sy = q => FX.sy(q[1]) - q[2] * T;
    const Q = F.begin(c, null);
    try {
      if (!m.dead) { const p = R0.pose(FX, m, M), Wg = R0.wings(FX, m, M, p), unf = M.unfold == null ? 1 : M.unfold, H = M.tips;
        if (H && H.length > 2) for (let w = 0; w < 4; w++) for (let j = 1; j < H.length; j++) { const a = H[j - 1].p[w], b = H[j].p[w], u = j / H.length, k = 0.25 + H[j].k * 0.75; if (!a || !b) continue; Q.beam(sx(a), sy(a), sx(b), sy(b), Math.max(1, T * (0.1 + u * 0.22) * k), w % 2 ? GREEN_HI : '#A8F0FF', u * 0.45 * k * unf); }
        Wg.forEach((w, k) => { const tp = w.pts[2], tw = 0.5 + 0.5 * Math.sin(t * 3.1 + k * 1.7), X = sx(tp), Y = sy(tp); Q.glow(X, Y, T * (0.9 + 0.4 * tw), GREEN, (0.25 + 0.2 * tw) * (0.7 + (M.menace || 0) * 0.3) * unf); Q.star(X, Y, T * (0.16 + 0.1 * tw), 0.5 + 0.4 * tw, WHITE);
          if (!lf) { const e = [sx(w.pts[1]), sy(w.pts[1])], len = T * 1.1 * unf; Q.quad(549, (X + e[0]) / 2, (Y + e[1]) / 2 - len / 2, (X - e[0]) / 2, (Y - e[1]) / 2, 0, -len / 2, GREEN_HI, 1, 0.55 * (0.7 + (M.menace || 0) * 0.3) * unf, k * 1.7, Math.max(1, Math.hypot(X - e[0], Y - e[1]) / len)); } });
        const e = R0.eyeWorld(FX, m, M), gl = 0.5 + (M.menace || 0) * 0.4 + p.st * 0.5 + (M.beamK || 0) * 0.5; Q.glow(sx(e), sy(e), T * 2.0, GREEN, Math.min(1, gl * 0.45)); Q.glow(sx(e), sy(e), T * 0.7, EYE, Math.min(1, gl * 0.7));
        if ((M.beamK || 0) > 0.02) { const a = M.beamA, bx = FX.sx(m.x + Math.cos(a) * 13), by = FX.sy(m.y + Math.sin(a) * 13); for (const [wk, al, col] of [[0.9, 0.25, GREEN], [0.4, 0.6, GREEN_HI], [0.12, 0.95, WHITE]]) Q.beam(sx(e), sy(e), bx, by, Math.max(1, T * wk * 0.5), col, al * M.beamK); } }
      // the windbreaks: curtains of aurora standing across their lanes, a bright line at their foot
      if (M.bar) for (const B of M.bar) { if (!B || B.k < 0.02) continue; const ca = Math.cos(B.a), sa = Math.sin(B.a), Hh = 4.2 * B.k * T, a0 = [FX.sx(B.x - ca * B.half), FX.sy(B.y - sa * B.half)], a1 = [FX.sx(B.x + ca * B.half), FX.sy(B.y + sa * B.half)], cx = (a0[0] + a1[0]) / 2, cy = (a0[1] + a1[1]) / 2;
        Q.quad(549, cx, cy - Hh / 2, (a1[0] - a0[0]) / 2, (a1[1] - a0[1]) / 2, 0, -Hh / 2, GREEN_HI, 1, B.k * 1.1, 5.3, B.half * 2 / 4.2); Q.beam(a0[0], a0[1], a1[0], a1[1], Math.max(2, T * 0.12), WHITE, B.k * (0.6 + 0.25 * Math.sin(t * 6))); Q.glow(a0[0], a0[1], T, GREEN_HI, B.k * 0.6); Q.glow(a1[0], a1[1], T, GREEN_HI, B.k * 0.6);
        if (B.broke > 0) Q.glow(cx, cy - T * 1.5, T * 3.5, WHITE, B.broke * 0.8); }
      // the crosswind: snow streaking across the platform, lifted off the stone
      const Wd = M.cw; if (Wd && C) { const on = Wd.t > Wd.warn ? Math.min(1, (Wd.t - Wd.warn) / 0.3, (Wd.warn + Wd.blow - Wd.t) / 0.4) : 0.25 * Math.min(1, Wd.t / 0.5); if (on > 0.02) { const d = [Math.cos(Wd.a), Math.sin(Wd.a)], n = [-d[1], d[0]], RL = R0.RL;
          for (const [o, z] of (lf ? [[-5, 1.2], [5, 0.8]] : [[-9, 1.4], [-4.5, 0.7], [0, 1.8], [4.5, 1.0], [9, 1.5]])) { const h = Math.sqrt(Math.max(1, RL * RL - o * o)), x = C.x + n[0] * o, y = C.y + n[1] * o, w = 4.4; Q.quad(546, FX.sx(x), FX.sy(y) - z * T, d[0] * h * T, d[1] * h * T, -d[1] * w / 2 * T, d[0] * w / 2 * T, WHITE, on * 0.9, 1, o + 11, h * 2 / w); } } }
    } finally { F.flush(c); }
    return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { G.on(); }]; }
  return { G, gpu, drawBoss, overlay, drawFx, init, preload, get kit() { return A; } };
})();
