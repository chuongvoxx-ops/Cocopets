/* ---------- (v472 YB) NYAR'ZHUL, HEART OF THE ENGINE in three dimensions (Rift 06, the Yuggoth Engine's last boss: the Core Chamber) ----------
   The 2D Nyar'zhul of 20z9-rift-fiend-yuggoth-3.js rebuilt as a sculpted, textured and lit GPU model, the same heart from its 2D
   drawing, posed every frame on the fight's own state (its beat, its sag and heat when it stalls, its flinch, its wake, the
   vents opening for the swarm, the lens's aperture and gaze, the three cable-tentacles along the fight's own curves), so it stands
   exactly where the 2D drawing stood and its fight is untouched.
   THE HEART (870): a vast lobed organ of violet flesh (rewritten every frame: its outline is the 2D's, swelling on the beat, sagging
   when it stalls, its lobes wobbling), bulging out of the chamber's north wall: raised veins swelling on the beat, wet, light through
   its flesh, three seams of violet current glowing in it, fungus in its folds (876); four straps of riveted steel round it (two
   across, one down each flank, 871); two louvred vents on its lower flanks (877) whose slats open on amber light when the swarm
   pours; red heat welling up from inside when it overheats. Two atria swelling behind its shoulders a beat ahead.
   THE LENS: a steel bezel bolted round a dome of amber glass (873), an iris of glowing amber fibres (874) behind seven blades of dark
   steel turning and closing round the aperture as the fight sets it, darting where it looks.
   ITS PLUMBING: three great vessels rising into the hull (flesh where they leave it, steel pipe beyond, riveted collars, a red valve
   wheel); four pistons beside it (steel housings with flesh sleeves, chrome rods rising and falling with the beat (872), crossheads,
   amber joint lamps, tendons of flesh to its flanks); five hoses from its foot over the rim to the floor, a pulse of amber light
   running down each; the three cable-tentacles (878: armoured hose, steel collars, a nerve of light running down it on the beat, a
   steel clamp of two jaws round an amber lamp), drawn with it while they rest and over the field when they rear.
   THE WALL (879): the chamber's north wall of torn hull plates on great ribs, violet current in its seams breathing with the beat.
   LIGHT: one pass in the Core Chamber's light (a warm key, the flesh-lit dark above, the floor's light below, a violet rim). On the
   painter: the lens's amber glow, the vents', the seams' violet, the lamps, the pulses. Its moves' light: the heartbeat's rings
   with their gap (603), the piston lanes (601: their order told by beads of light, never a number) and the steel heads dropping on
   them (a second small pass), the charge's bolts to the capacitors (604), the bared lens's ring, the coolant's flood (609).
   LEVELS: full on High; Balanced, Performance and Fewer effects take the lighter level. GPU buffers freed with the stage. */
const NYARZHUL_GL = (() => {
  const Y = YUG3, A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv } = K, lowFx = K.lowFx, nowMs = K.nowMs;
  const M_FLESH = 870, M_STEEL = 871, M_ROD = 872, M_GLASS = 873, M_IRIS = 874, M_LAMP = 875, M_FUNG = 876, M_VENT = 877, M_HOSE = 878, M_WALL = 879;
  const VIOLET = '#9A5CFF', VIOLET_HI = '#E8B8FF', TEAL_HI = '#B8FFF2', AMBER = '#FFB23F', AMBER_HI = '#FFE2A0', FUNGUS = '#E88AC0', WHITE = '#FFFFFF', HEAT = '#FF6A3A';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.nyarzhul ? FIEND_DEFS.nyarzhul.RIG : null; } catch (e) { return null; } };
  const G = A.model('Nyarzhul', () => ({}));
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const INFO = { lod: 0, calls: 0, tris: 0, W: 0, H: 0, ms: 0, poseMs: 0 };
  const CFG = [{ hu: 150, hv: 34, bn: 44, br: 6, tn: 18, tr: 8, cn: 36, cr: 10, wa: 64, q: 1 }, { hu: 56, hv: 18, bn: 26, br: 5, tn: 12, tr: 6, cn: 22, cr: 7, wa: 36, q: 0.6 }];
  const D0 = 4.3, PHM = Math.PI / 2 + 0.3;   // (the heart's bulge toward the camera; how far round the sides its surface runs)
  // the outline in the heart's plane at angle th (as the 2D's heartOutline, its wobble and sag)
  function outl(th, bt, P, R0) { const s = Math.sin(th), co = Math.cos(th); let x = co * R0.HW * (1 + 0.05 * Math.sin(th * 3 + 0.4)), z = s * R0.HH;
    if (s < 0) { z *= 1 + 0.14 * Math.pow(-s, 3); x -= 1.3 * Math.pow(-s, 4); } const dth = ((th - Math.PI / 2 + Math.PI) % TAU + TAU) % TAU - Math.PI; z -= 1.3 * Math.exp(-((dth / 0.26) ** 2)); const wob = 0.16 * Math.sin(th * 5 + bt * 1.3) * (1 - P.dk); x += co * wob; z += s * wob; if (s < 0) z *= 1 - P.sag * 0.12; return [x, z]; }
  // distance from a point in the heart's plane to a polyline
  const segD = (px, pz, P) => { let d = 1e9; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, u = cl(((px - a[0]) * dx + (pz - a[1]) * dz) / L2); d = Math.min(d, Math.hypot(px - a[0] - dx * u, pz - a[1] - dz * u)); } return d; };
  const SETS = [null, null];
  function set(L) { if (SETS[L] && G.MESH && G.MESH['heart' + L]) return SETS[L]; const t0 = nowMs(), C = CFG[L], R0 = RIG(), out = {}, q = n => Math.max(3, Math.round(n * C.q)), P0 = { dk: 0, sag: 0 };
    // the heart: i round its outline, j from its front out round its sides; each vertex's vein height and its place in the heart's plane
    const NU = C.hu, NV = C.hv, VH = new Float32Array((NU + 1) * (NV + 1)), PX = new Float32Array(VH.length), PZ = new Float32Array(VH.length);
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const th = i / NU * TAU, ph = j / NV * PHM, o = j * (NU + 1) + i, ol = outl(th, 0, P0, R0), s = Math.min(1, Math.sin(ph)), px = ol[0] * s, pz = ol[1] * s;
      let d = 1e9; for (const V of R0.VEINS) d = Math.min(d, segD(px, pz, V)); VH[o] = Math.exp(-((d / 0.3) ** 2)) * (ph < Math.PI / 2 ? 1 : 0); PX[o] = px; PZ[o] = pz; }
    out['heart' + L] = Y.mkGrid(NU, NV, (i, j) => { const o = j * (NU + 1) + i; return [cl((PX[o] / R0.HW + 1.15) / 2.3), cl((PZ[o] / R0.HH + 1.2) / 2.4), M_FLESH + VH[o] * 0.04]; }, M_FLESH);   // (v472c YB: the vein's height rides in the material's fraction (it interpolates cleanly; the old packed column index striped the flesh))
    // the atria (still: radii 1, posed), the vessels (still, in the heart's frame: x across, y toward the camera, z up from its centre)
    { const B = GLM.builder(C.q); B.ell([0, 0, 0], [1, 1, 1], M_FLESH + 0.2, { seg: 28, rings: 18 }); out['atr' + L] = B.done(); }
    { const B = GLM.builder(C.q); R0.VESSELS.forEach((V, vi) => { const pts = V.pts.map(([x, z], k) => [x, 1.6 - k * 1.3, z + 1.6 - k * 1.3]), w = V.w / 2;
        for (let k = 0; k < pts.length - 1; k++) B.tube(pts[k], pts[k + 1], w * (k === 0 ? 1.12 : 1 - k * 0.03), w * (k === 0 ? 1.04 : 1 - (k + 1) * 0.03), k === 0 ? M_FLESH + 0.4 : M_STEEL + 0.2, { seg: 22, cap0: k === 0 ? 'round' : false, cap1: 'round' });
        const at = u => { const f = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), e = f - i; return [vadd(pts[i], vmul(vsub(pts[i + 1], pts[i]), e)), vnrm(vsub(pts[i + 1], pts[i]))]; };
        for (const u of [0.26, V.valve, 0.78]) { const [p, d] = at(u), R = Y.along(d); B.push(R.y, R.z, R.x, p); B.tor([0, 0, 0], w * 1.12, 0.16, M_STEEL + 0.4, { seg: 24, rseg: 6 });
          B.pop(); if (u === V.valve) { const up = vnrm(vadd(vsub([0, 0, 1], vmul(d, d[2])), [0, 0.3, 0])), c = vadd(p, vmul(up, w * 1.25)), R2 = Y.along(up); B.push(R2.y, R2.z, R2.x, c); B.tor([0, 0, 0], 0.55, 0.07, M_LAMP + 0.2, { seg: 20, rseg: 5 }); for (let s2 = 0; s2 < 4; s2++) { const a = s2 / 4 * TAU; B.tube([0, 0, 0], [Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0], 0.04, 0.04, M_LAMP + 0.2, { seg: 5 }); } B.pop(); B.tube(p, c, 0.1, 0.1, M_STEEL + 0.4, { seg: 6 }); } } });
      out['vess' + L] = B.done(); }
    // the pistons' housings with their flesh sleeves (in the chamber's frame about its centre C)
    { const B = GLM.builder(C.q); for (const pt of R0.PIST) { const inner = Math.abs(pt.x) < 13, H0 = inner ? 6.4 : 5.4, hw = pt.w / 2;
        B.box([pt.x, -18.2, H0 / 2], [hw, hw * 0.8, H0 / 2], 0.12, M_STEEL + 0.4); for (let k = 0; k < 3; k++) B.ell([pt.x, -18.2, 0.9 + k * 1.05], [hw * 1.22, hw * 1.0, 0.42], M_FLESH + 0.4, { seg: 20, rings: 10 });
        B.box([pt.x, -18.2, H0 + 0.08], [hw * 0.62, hw * 0.55, 0.12], 0.04, M_STEEL + 0.4); } out['pistH' + L] = B.done(); }
    // the wall: torn hull plates on great ribs (x across, z up; y its face at -20.6)
    { const B = GLM.builder(1), NA = C.wa, top = x => { const i = (x + 28) / 56 * (R0.JAG.length - 1), k = Math.min(R0.JAG.length - 2, Math.floor(i)), e = i - k; return 13.5 + 5 * Math.cos(x / 28 * Math.PI / 2) + lerp(R0.JAG[k], R0.JAG[k + 1], e); };
      B.surf((u, v) => { const x = -28 + u * 56, z = -2 + v * (top(x) + 2); return [x, -20.6 - 0.15 * Math.sin(x * 0.9) * Math.sin(z * 0.7), z]; }, NA, q(20), () => M_WALL, { e: u => u, a: (u, v) => v });
      for (let x = -26; x <= 26; x += 4.6) B.tube([x, -20.1, -1.5], [x, -20.1, top(x) - 0.4], 0.62, 0.55, M_WALL + 0.2, { seg: q(12), cap0: false, cap1: 'round' }); out['wall' + L] = B.done(); }
    // the lens: its bezel and bolts, the glass dome, the iris's disc (unit radius, z toward the camera), the blades (copies)
    { const B = GLM.builder(C.q); B.tor([0, 0, 0], 1.06, 0.13, M_STEEL + 0.3, { seg: 56, rseg: 10 }); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; B.ell([Math.cos(a) * 1.06, Math.sin(a) * 1.06, 0.1], [0.07, 0.07, 0.05], M_STEEL + 0.6, { seg: 8, rings: 4 }); }
      B.lathe([[0.94, -0.12], [0.98, 0.0], [0.9, 0.05], [0.86, -0.05]], M_STEEL + 0.3, { seg: 56 }); out['bezel' + L] = B.done(); }
    { const B = GLM.builder(C.q); B.ell([0, 0, -0.05], [0.88, 0.88, 0.2], M_GLASS, { seg: 40, rings: 12, th1: Math.PI / 2, cap: false }); out['glass' + L] = B.done(); }
    { const B = GLM.builder(C.q); B.surf((u, v) => { const a = u * TAU, r = 0.02 + v * 1.18; return [Math.cos(a) * r, Math.sin(a) * r, -0.2 - 0.06 * v]; }, 48, 8, () => M_IRIS, { e: (u, v) => v, a: u => u }); out['iris' + L] = B.done(); }
    // (v472c YB: the aperture's blades are painted in the iris's disc (874): a crisp spiral as the 2D's, turned by its wear)
    // the straps (per frame) and their rivets, the hoses, the tendons, the tentacles, their collars and clamps
    for (let k = 0; k < 4; k++) out['band' + k + L] = Y.mkGrid(C.bn, C.br, (i, j) => [j / C.br, i / C.bn], M_STEEL);
    { const B = GLM.builder(C.q); B.ell([0, 0, 0], [1, 1, 0.55], M_STEEL + 0.6, { seg: 10, rings: 5 }); out['rivet' + L] = Y.copies(B.done(), 64); }
    for (let k = 0; k < 5; k++) out['hose' + k + L] = Y.mkGrid(C.tn, C.tr, (i, j) => [j / C.tr, i / C.tn], M_FLESH + 0.4);
    for (let k = 0; k < 4; k++) out['tend' + k + L] = Y.mkGrid(C.tn, C.tr, (i, j) => [j / C.tr, i / C.tn], M_FLESH + 0.4);
    for (let k = 0; k < 3; k++) out['cab' + k + L] = Y.mkGrid(C.cn, C.cr, (i, j) => [j / C.cr, i / C.cn * 6], M_HOSE);
    { const B = GLM.builder(C.q); B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]); B.tor([0, 0, 0], 1, 0.32, M_STEEL + 0.4, { seg: 18, rseg: 6 }); B.pop(); out['collar' + L] = Y.copies(B.done(), 3 * 6); }
    { const B = GLM.builder(C.q), pts = [[-0.2, 0.18], [0.9, 0.28], [1.55, 0.05], [1.2, 0.02], [0.8, 0.12], [-0.1, 0.05]]; B.prism(pts, -0.14, 0.14, M_STEEL + 0.4, { b: 0.04 }); out['jaw' + L] = Y.copies(B.done(), 6); }
    { const B = GLM.builder(C.q); B.ell([0, 0, 0], [0.62, 0.5, 0.5], M_STEEL + 0.4, { seg: 20, rings: 12 }); out['clamp' + L] = Y.copies(B.done(), 3); }
    // the moving steel: rods (unit cylinders along x), crossheads, the vents' frames and slats
    { const B = GLM.builder(C.q); B.tube([0, 0, 0], [1, 0, 0], 1, 1, M_ROD, { seg: 16, cap0: 'flat', cap1: 'flat' }); out['rod' + L] = Y.copies(B.done(), 4); }
    { const B = GLM.builder(C.q); B.box([0, 0, 0], [0.75, 0.55, 0.52], 0.08, M_STEEL + 0.4); out['xhead' + L] = Y.copies(B.done(), 4); }
    { const B = GLM.builder(C.q); B.box([0, 0, 0], [1.2, 0.18, 0.75], 0.1, M_VENT); B.box([0, 0.12, 0], [1.02, 0.08, 0.62], 0.0, M_VENT + 0.4); out['vent' + L] = Y.copies(B.done(), 2); }
    { const B = GLM.builder(C.q); B.box([0, 0, 0], [1.0, 0.04, 0.09], 0.02, M_VENT + 0.2); out['slat' + L] = Y.copies(B.done(), 8); }
    // the fungus in its folds, the lamps (0..3 the pistons' joints, 4..6 the clamps', 7..11 the hoses' pulses)
    { const B = GLM.builder(C.q); B.lathe([[0.0, 0.62], [0.55, 0.55], [0.95, 0.25], [1.0, 0.12], [0.3, 0.12], [0.18, -0.35], [0.0, -0.35]], M_FUNG, { seg: 14 }); out['fung' + L] = Y.copies(B.done(), R0.SHROOMS.length); }
    { const B = GLM.builder(C.q); B.sph([0, 0, 0], 1, M_LAMP, 12); out['lamp' + L] = Y.copies(B.done(), 12); }
    // the pistons' heads dropping on the lanes (the effect's pass): blocks and rods
    { const B = GLM.builder(C.q); B.box([0, 0, 0], [1, 1, 0.55], 0.1, M_STEEL + 0.8); out['phead' + L] = Y.copies(B.done(), 40); }
    { const B = GLM.builder(C.q); B.tube([0, 0, 0], [0, 0, 1], 0.32, 0.32, M_ROD, { seg: 10, cap0: false, cap1: false }); out['prod' + L] = Y.copies(B.done(), 40); }
    Object.assign(G.MESH, out); SETS[L] = { C, ms: nowMs() - t0 }; return SETS[L]; }

  /* ---------- posing: in the fight's world, relative to the boss's point (ox, oy) ---------- */
  function frameOf(FX, m, M) { const R0 = RIG(), P = M.P, C = FX.C, be = R0.beatEnv(M) * (1 - P.dk), sag = P.sag, rec = P.rec || 0, sx = (1 + be * 0.05 + rec * 0.03) * (1 + sag * 0.09), sz = (1 + be * 0.045 - rec * 0.04) * (1 - sag * 0.2);
    return { R0, P, C, be, sag, sx, sz, Hw: [C.x, C.y + R0.HY + sag * 0.8, R0.HZ - sag * 3.8 + rec * 0.4] }; }
  // a point on the heart's front at (x, z) in its plane (and the normal there), for what sits on it
  function onHeart(F, x, z, bt, lift) { const R0 = F.R0, th = Math.atan2(z, x), ol = outl(th, bt, F.P, R0), rr = Math.hypot(ol[0], ol[1]) || 1, rho = cl(Math.hypot(x, z) / rr, 0, 0.995), cph = Math.sqrt(1 - rho * rho), D = D0 * (1 + F.be * 0.05);
    const p = [F.Hw[0] + x * F.sx, F.Hw[1] + D * cph, F.Hw[2] + z * F.sz + D * cph], n = vnrm([x / (rr * rr) * 2.2, cph / D * 1.2 + 0.05, z / (rr * rr) * 2.2 - (cph / D * 1.2 + 0.05) * 0.0]); return { p: vadd(p, vmul(n, lift || 0)), n, rho }; }
  function pose(FX, m, M, o) { const L = Y.lod(), S = set(L), C0 = S.C, ME = G.MESH, ox = m.x, oy = m.y, rel = p => [p[0] - ox, p[1] - oy, p[2]], F = frameOf(FX, m, M), R0 = F.R0, P = F.P, C = F.C, bt = M.bt || 0, be = F.be, halo = [], items = [];
    const fl2 = o.flash ? 1 : 0, dk = P.dk, wake = P.wake, lit = (1 - dk) * wake, heat = P.heat, Hr = rel(F.Hw), Rh = I3(), scH = [F.sx, 1, F.sz];
    // ---- the wall
    items.push({ mesh: ME['wall' + L], o: rel([C.x, C.y, 0]), glow: (0.25 + be * 0.45) * lit, glow2: fl2, fx: dk, wear: 0.3 });
    // ---- the heart's flesh (rewritten: its outline, the beat, the veins swelling)
    { const Mh = ME['heart' + L], PP = Mh.pos, NU = C0.hu, NV = C0.hv, D = D0 * (1 + be * 0.05), vh = 0.2 * (1 + be * 0.7), at = Mh.att;
      for (let i = 0; i <= NU; i++) { const th = i / NU * TAU, ol = outl(th, bt, P, R0);
        for (let j = 0; j <= NV; j++) { const ph = j / NV * PHM, s = Math.sin(ph), cp = Math.cos(ph), o3 = (j * (NU + 1) + i) * 3, v = cl((at[o3] - M_FLESH) * 25), lob = 1 + 0.06 * Math.sin(th * 2 + 0.5) * s, x = ol[0] * s * lob, z = ol[1] * s * lob, y = D * cp * (1 + 0.08 * Math.sin(th * 3 + 1.1) * s);
          const n = vnrm([x * 0.06, cp * 1.4, z * 0.06]); PP[o3] = Hr[0] + x * F.sx + n[0] * v * vh; PP[o3 + 1] = Hr[1] + y + n[1] * v * vh; PP[o3 + 2] = Hr[2] + z * F.sz + y + n[2] * v * vh; } }
      Y.gridNormals(Mh, false); items.push({ mesh: Mh, glow: (0.3 + be * 0.6) * lit, spill: heat, kind: be, glow2: fl2, fx: dk, wear: 0.42 }); }
    // ---- the atria behind its shoulders, swelling a beat ahead
    for (const [ax, az, rx, rz, sd] of [[-4.9, 6.6, 4.1, 3.3, -1], [5.1, 6.0, 3.6, 2.9, 1]]) { const k = 1 + (M.dub || 0) * 0.06 * (1 - dk); items.push({ mesh: ME['atr' + L], R: Y.rotZ(sd * 0.25), o: vadd(Hr, [ax * F.sx, -1.2, az * F.sz - 1.2]), sc: [rx * k, 2.2 * k, rz * k], glow: (0.2 + be * 0.3) * lit, spill: heat, glow2: fl2, fx: dk, wear: sd > 0 ? 0.7 : 0.2 }); }
    // ---- the vessels (the heart's frame, scaled with it)
    items.push({ mesh: ME['vess' + L], o: vadd(Hr, [0, 0, 0]), sc: scH, glow2: fl2, fx: dk, glow: lit, spill: heat, wear: 0.55 });
    // ---- the straps of steel round it, riveted
    const RV = ME['rivet' + L]; let nr = 0;
    { const curves = [[], [], [], []]; for (let i = 0; i <= 16; i++) { const x = -10 + i * 1.25; curves[0].push([x, 2.9 - 1.5 * (x / 9.2) ** 2]); curves[1].push([x, -5.2 - 1.0 * (x / 9.2) ** 2]); }
      for (const [k, sd] of [[2, -1], [3, 1]]) for (let i = 0; i <= 14; i++) { const z = 8.5 - i * 1.25; curves[k].push([sd * (5.5 + 1.7 * (1 - (z / 8.5) ** 2)), z]); }
      curves.forEach((cv, k) => { const w = [1.0, 0.85, 0.8, 0.8][k], pts = []; for (const [x, z] of cv) { const H = onHeart(F, x, z, bt, 0.3); if (H.rho < 0.985) pts.push(rel(H.p)); } if (pts.length < 3) return;
        const Mb = ME['band' + k + L]; Y.sweep(Mb, pts, () => w * 0.62, 0.36); items.push({ mesh: Mb, glow: (0.25 + be * 0.4) * lit, glow2: fl2, fx: dk, wear: 0.2 + k * 0.2 });
        for (let i = 1; i < pts.length - 1 && nr < 64; i += 2) { const H = pts[i], nn = vnrm(vsub(H, Hr)); K.place(RV, nr++, Y.along(nn), vadd(H, vmul([0, 0.16, 0.05], 1)), [0.16, 0.16, 0.16]); } }); }
    for (; nr < 64; nr++) K.hide(RV, nr); K.commit(RV); items.push({ mesh: RV, glow2: fl2, fx: dk, wear: 0.9, outline: false });
    // ---- the vents: frames and louvred slats opening on amber light
    { const VT = ME['vent' + L], SL = ME['slat' + L], opn = P.open; R0.VENTS.forEach(([vx, vz], k) => { const H = onHeart(F, vx, vz, bt, 0.1), Rv = M3(vnrm([1, 0, 0]), vnrm(vcross(H.n, [1, 0, 0])), H.n), Rv2 = M3([1, 0, 0], H.n, vmul(vnrm(vcross([1, 0, 0], H.n)), 1)), p = rel(H.p);
        K.place(VT, k, Rv2, p, [1, 1, 1]); for (let s = 0; s < 4; s++) { const zz = -0.42 + s * 0.28, Rs = M3(Rv2.x, vadd(vmul(Rv2.y, Math.cos(opn * 1.2)), vmul(Rv2.z, Math.sin(opn * 1.2))), vadd(vmul(Rv2.z, Math.cos(opn * 1.2)), vmul(Rv2.y, -Math.sin(opn * 1.2)))); K.place(SL, k * 4 + s, Rs, vadd(p, vadd(vmul(Rv2.z, zz), vmul(Rv2.y, 0.2))), [1, 1, 1]); }
        { const hk = Math.max(opn, P.heat); if (hk > 0.02) halo.push([0, vadd(p, vmul(H.n, 0.3)), 2.6 * hk, P.heat > opn ? HEAT : AMBER, 0.8 * hk]); } void Rv; }); K.commit(VT); K.commit(SL); items.push({ mesh: VT, glow: Math.max(P.open, P.heat), spill: P.heat, glow2: fl2, fx: dk, wear: 0.4 }, { mesh: SL, glow2: fl2, fx: dk, wear: 0.6 }); }
    // ---- the fungus in its folds
    { const FG = ME['fung' + L]; R0.SHROOMS.forEach(([x, z, s], k) => { const H = onHeart(F, x, z, bt, 0.05); K.place(FG, k, Y.along(vnrm(vcross(H.n, [0, 0, 1])).map(v => v || 0).length ? vnrm(vcross([0, 0, 1], H.n)) : [1, 0, 0], H.n), rel(H.p), [s * 0.6, s * 0.6, s * 0.5]); halo.push([0, rel(H.p), s * 1.6, FUNGUS, 0.3 * lit]); }); K.commit(FG); items.push({ mesh: FG, glow: lit, glow2: fl2, fx: dk, wear: 0.5 }); }
    // ---- the lens: bezel, glass, iris and its blades (facing the camera), darting where it looks
    const Lc = onHeart(F, 0, -1.4, bt, 1.0), Rl = 2.9 * (F.sx + F.sz) / 2, ln = [0, 1, 0], Rlens = M3([1, 0, 0], vnrm(vcross(ln, [1, 0, 0])), ln), lc = rel(Lc.p), look = M.look || [0, 0], ap = M.ap == null ? 0.6 : M.ap;
    items.push({ mesh: ME['bezel' + L], R: Rlens, o: lc, sc: [Rl, Rl, Rl], glow2: fl2, fx: dk, wear: 0.15 });
    const ic = vadd(lc, vadd(vmul(Rlens.x, look[0] * Rl * 0.2), vmul(Rlens.y, -look[1] * Rl * 0.16)));
    { const rot = bt * 0.25 + ap * 1.4; items.push({ mesh: ME['iris' + L], R: Rlens, o: ic, sc: [Rl * 0.74, Rl * 0.74, Rl], glow: (0.4 + be * 0.5 + P.sag * 0.3) * lit, spill: heat, kind: ap, glow2: fl2, fx: dk, wear: ((rot / TAU) % 1 + 1) % 1, outline: false }); }   // (v472c YB: its wear the blades' turn)
    items.push({ mesh: ME['glass' + L], R: Rlens, o: lc, sc: [Rl, Rl, Rl], glow: (0.4 + be * 0.4) * lit, spill: heat, glow2: fl2, fx: dk, al: 0.6, wear: 0.5, outline: false });
    halo.push([0, ic, Rl * 2.0, heat > 0.3 ? HEAT : AMBER, (0.14 + be * 0.2 + P.sag * 0.2 + heat * 0.2) * lit], [0, ic, Rl * 0.25, heat > 0.3 ? HEAT : AMBER, (0.3 + be * 0.3) * lit]);   // (v472b YB: the glow behind the blades, the glass kept dark)
    // ---- the pistons: housings (still), rods and crossheads rising with the beat, joint lamps, tendons to its flanks
    items.push({ mesh: ME['pistH' + L], o: rel([C.x, C.y, 0]), glow2: fl2, fx: dk, wear: 0.33 });
    { const RD = ME['rod' + L], XH = ME['xhead' + L], LP = ME['lamp' + L], ph = M.lastBeat != null ? cl((bt - M.lastBeat) / 1.4) : 0;
      R0.PIST.forEach((pt, i) => { const inner = Math.abs(pt.x) < 13, up = pt.ph ? 1 - Math.exp(-ph * 5) : Math.exp(-ph * 3.2), h = (1.2 + 2.6 * up) * (1 - dk * 0.7) * (0.4 + 0.6 * wake), H0 = inner ? 6.4 : 5.4, base = rel([C.x + pt.x, C.y - 18.2, H0]), hw = pt.w / 2;
        K.place(RD, i, Y.along([0, 0, 1], [1, 0, 0]), base, [h + 0.4, hw * 0.28, hw * 0.28]); const ch = vadd(base, [0, 0, h + 0.55]); K.place(XH, i, I3(), ch, [hw / 1.2 * 1.5, 1, 1]);
        const j = rel([C.x + pt.x, C.y - 18.2 + hw * 0.85, H0 - 0.6]); K.place(LP, i, I3(), j, [0.22, 0.22, 0.22]); halo.push([0, j, 0.9 + be * 0.6, AMBER, (0.5 + be * 0.4) * lit]);
        const sd = Math.sign(pt.x), hq = onHeart(F, sd * (inner ? 8.2 : 8.8), inner ? 2.2 - R0.HZ + R0.HZ : 4.8, bt, -0.3), hp = rel(hq.p), a0 = vadd(ch, [-sd * hw * 0.6, 0.2, 0]), mid = vadd(vmul(vadd(a0, hp), 0.5), [0, 0.6, -1.2]);
        Y.sweep(ME['tend' + i + L], [a0, mid, hp], u => 0.31 - u * 0.1); items.push({ mesh: ME['tend' + i + L], glow: lit, spill: heat, glow2: fl2, fx: dk, wear: 0.15 * i }); });
      K.commit(RD); K.commit(XH); items.push({ mesh: RD, glow2: fl2, fx: dk, wear: 0.5 }, { mesh: XH, glow2: fl2, fx: dk, wear: 0.65 });
      // ---- the hoses from its foot over the rim to the floor, a pulse running down each
      [[-6.4, -5.8, -8.6, -10.6, 0.7], [-2.8, -7.4, -3.4, -11.9, 0.62], [2.8, -7.4, 3.4, -11.9, 0.62], [6.4, -5.8, 8.6, -10.6, 0.7], [-0.8, -7.8, -1.0, -11.6, 0.5]].forEach(([hx, hz, fx, fy, w], k) => {
        const a = rel(onHeart(F, hx, hz, bt, -0.2).p), b = rel([C.x + fx, C.y + fy, 0.15]), mid = [(a[0] + b[0]) / 2 + (fx < 0 ? -1 : 1) * 0.8, (a[1] + b[1]) / 2 + 0.6, Math.max(0.5, Math.min(a[2], b[2]) + 0.4)];
        Y.sweep(ME['hose' + k + L], [a, vadd(vmul(vadd(a, mid), 0.5), [0, 0.3, 0.2]), mid, vadd(vmul(vadd(mid, b), 0.5), [0, 0, 0.1]), b], () => w / 2); items.push({ mesh: ME['hose' + k + L], glow: lit, spill: heat, glow2: fl2, fx: dk, wear: 0.3 + k * 0.1 });
        const u = ((bt - (M.lastBeat || 0)) * 1.4) % 1, pu = u < 0.5 ? vadd(a, vmul(vsub(mid, a), u * 2)) : vadd(mid, vmul(vsub(b, mid), u * 2 - 1)); K.place(LP, 7 + k, I3(), pu, [0.12, 0.12, 0.12]); halo.push([0, pu, 0.6, AMBER, 0.7 * lit]); });
      // ---- the tentacles at rest (the raised ones are drawn over the field: drawFx)
      for (const cb of M.cab || []) if (cb.lift < 0.15 || m.dead) tentacle(items, halo, ME, L, cb, M, rel, F, fl2, dk, lit); else hideTent(ME, L, cb.k);
      K.commit(LP); items.push({ mesh: LP, glow: lit, spill: heat, glow2: fl2, fx: dk, outline: false });
      K.commit(ME['collar' + L]); K.commit(ME['jaw' + L]); K.commit(ME['clamp' + L]); items.push({ mesh: ME['collar' + L], glow2: fl2, fx: dk, wear: 0.8 }, { mesh: ME['jaw' + L], glow2: fl2, fx: dk, wear: 0.1 }, { mesh: ME['clamp' + L], glow2: fl2, fx: dk, wear: 0.45 }); }
    // ---- the seams' violet, the heat
    halo.push([0, vadd(Hr, [0, D0 * 0.6, 0]), R0.HW * 1.15, heat > 0.3 ? HEAT : VIOLET, (0.12 + be * 0.2 + heat * 0.3) * lit]);
    if (heat > 0.02) for (let i = 0; i < 4; i++) { const a = bt * (1.3 + i * 0.4) + i * 1.7; halo.push([0, vadd(Hr, [Math.cos(a) * 3.2, D0 * 0.7, Math.sin(a * 1.3) * 2.6]), 4.2 + 1.2 * Math.sin(bt * 3 + i), i % 2 ? HEAT : '#FFB070', heat * (0.22 + 0.1 * Math.sin(bt * 7 + i * 2))]); }   // (v472b YB: overheated: the heat shimmering off it)
    INFO.lod = L; return { items, halo, occ: [vadd(Hr, [0, -1.8, -0.5]).concat([5.2])] }; }
  function hideTent(ME, L, k) { for (let s = 0; s < 6; s++) K.hide(ME['collar' + L], k * 6 + s); K.hide(ME['jaw' + L], k * 2); K.hide(ME['jaw' + L], k * 2 + 1); K.hide(ME['clamp' + L], k); K.hide(ME['lamp' + L], 4 + k); }
  // a cable-tentacle along the fight's curve: the hose, collars, the clamp's jaws round its lamp
  function tentacle(items, halo, ME, L, cb, M, rel, F, fl2, dk, lit) { if (!cb.pts) return; const k = cb.k, pts = cb.pts.map(rel), w0 = RIG().CABW[k] / 2, n = pts.length - 1, Mc = ME['cab' + k + L];
    Y.sweep(Mc, pts, u => w0 * (1 - u * 0.45)); const ph = cl(((M.bt || 0) - (M.lastBeat || 0)) / 0.9); items.push({ mesh: Mc, glow: lit, spill: ph, kind: F.P.heat, glow2: fl2, fx: dk, wear: 0.2 + k * 0.3 });
    const CO = ME['collar' + L]; for (let s = 0; s < 6; s++) { const i = Math.min(n - 1, 2 + s * 3), d = vsub(pts[i + 1], pts[i - 1]), r = w0 * (1 - i / n * 0.45) * 1.02; K.place(CO, k * 6 + s, Y.along(d), pts[i], [0.25, r, r]); }
    const tp = pts[n], d = vnrm(vsub(tp, pts[n - 2])), Rt = Y.along(d), jw = cb.jaw || 0, S = k === 2 ? 0.8 : 1, JW = ME['jaw' + L];
    for (const sd of [-1, 1]) { const o = sd * (0.25 + jw * 0.7), c = Math.cos(o), s = Math.sin(o), Rj = M3(vadd(vmul(Rt.x, c), vmul(Rt.y, s)), vadd(vmul(Rt.y, c), vmul(Rt.x, -s)), Rt.z); K.place(JW, k * 2 + (sd > 0 ? 1 : 0), sd > 0 ? Rj : M3(Rj.x, vmul(Rj.y, -1), vmul(Rj.z, -1)), tp, [S, S, S]); }
    K.place(ME['clamp' + L], k, Rt, tp, [S, S, S]); const lp = vadd(tp, vmul(d, 0.1 * S)); K.place(ME['lamp' + L], 4 + k, I3(), lp, [0.18 * S, 0.18 * S, 0.18 * S]); halo.push([0, lp, S * (0.9 + jw * 0.5), AMBER, (0.6 + jw * 0.3) * lit]);
    const u2 = Math.round(ph * n); if (u2 > 0 && u2 < n && !(dk > 0.5)) halo.push([0, pts[u2], 0.9, AMBER, 0.8 * (1 - ph) * lit]); }

  /* ---------- drawing: the heart's pass (draw, the previews, the fallen heart under the field) ---------- */
  function paint(c, FX, m, X, Y0, T, t) { if (!gpu()) return false; const M = FX.mem; if (!M || !M.P || !M.cab) return false; let R;
    try { const t0 = nowMs(); R = pose(FX, m, M, { flash: m.flash > 0 }); INFO.poseMs = +(INFO.poseMs * 0.9 + (nowMs() - t0) * 0.1).toFixed(2); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Nyarzhul: pose', e); return false; }
    let ok = false; try { ok = Y.pass(c, X, Y0, T, R.items, { light: 'core', t: M.bt || t, flash: m.flash > 0 ? 1 : 0, occ: R.occ }, G, INFO); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Nyarzhul: draw', e); }
    if (!ok) return false; const F = A.fg(); if (F) { const Q = F.begin(c, null); try { Y.halos(Q, R.halo, X, Y0, T, 1); } finally { F.flush(c); } } return true; }

  /* ---------- its light ---------- */
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); }
  /* the floor's light: the beat's glow and the nerves' pulses, the flood, the piston lanes, the rings, the warnings (the 2D overlay keeps the lanes' shadows, the capacitors' meters and the labels: M.ybGL) */
  function overlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m, R0 = RIG(); if (!M || !M.P || !m || !R0) return false; const F = A.fg();
    if (!F || !G.on()) { M.ybGL = false; Y.marked(c, FX, t, T, null); return false; }
    M.ybGL = true; const P = M.P, be = R0.beatEnv(M) * (1 - P.dk) * P.wake, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), Q = F.begin(c, null);
    try {
      if (be > 0.02) Q.glow(FX.sx(C.x + R0.SRC[0]), FX.sy(C.y + R0.SRC[1]), T * 9, VIOLET, be * 0.35, 0.67);
      if (!(P.dk > 0.6)) { const d0 = (M.bt - (M.lastBeat || 0)) * 9; R0.NERVES.forEach((N, k) => { const Lk = R0.NERVE_L[k].L; for (const off of [0, -6]) { const d = d0 + off; if (d < 0 || d > Lk) continue; const p = R0.alongNerve(k, d), a = (1 - d / (Lk + 4)) * 0.85 * P.wake; Q.glow(FX.sx(C.x + p[0]), FX.sy(C.y + p[1]), T * 0.8, AMBER, a); Q.glow(FX.sx(C.x + p[0]), FX.sy(C.y + p[1]), T * 0.3, AMBER_HI, a); } }); }
      if (M.fl && M.fl.lv > 0.01) { const k = Math.max(0, 1 - M.fl.lv * 1.03); Q.quad(609, X0, Y0, R0.RX * T, 0, 0, R0.RY * T, TEAL_HI, 1, k, M.fl.st === 'full' ? 1 : M.fl.st === 'rise' ? 2 : 0, 0); }
      for (const s of FX.S.tele) { if (s.done || !s.lane) continue; const u = cl(s.age / s.t), Ln = s.lane, hw = R0.laneHalf(Ln.ly), cy = Y0 + Ln.ly * T, ord = parseInt(Ln.lab, 10) || 0;
        Q.quad(601, X0, cy, hw * T, 0, 0, R0.LW / 2 * T, AMBER, 1, u * 0.999, ord * 100 + (Ln.k * 7 % 40), hw * 2 / R0.LW); }
      if (M.rings.length) { const X = FX.sx(C.x + R0.SRC[0]), Yy = FX.sy(C.y + R0.SRC[1]); for (const Rg of M.rings) { const fade = cl((30 - Rg.r) / 4) * cl(Rg.age / 0.15), Rq = (Rg.r + Rg.w) * T * 1.04; if (fade <= 0) continue;
          Q.quad(603, X, Yy, Rq, 0, 0, Rq, VIOLET_HI, 1, (Rg.r * T / Rq) + 10 * Math.round(Math.min(99, Rg.w * 0.5 * T / Rq * 100)), Rg.gap, Rg.gw + 10 * Math.round(fade * 10));
          for (const ea of [Rg.gap + Rg.gw, Rg.gap - Rg.gw]) Q.glow(X + Math.cos(ea) * Rg.r * T, Yy + Math.sin(ea) * Rg.r * T, T * 0.9, TEAL_HI, 0.8 * fade); } }
      for (const s of FX.S.tele) if (s.aur) Y.tell(Q, FX, s, T, t, 1);
    } finally { F.flush(c); }
    return false; }
  /* the light and steel over the field: the raised tentacles and the pistons' heads (one small pass), the charge's bolts, the bared lens's ring, the ports' glow */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m, C = FX.C, R0 = RIG(); if (!m || !M.P || !M.ybGL || !R0) return false; const F = A.fg(); if (!F) return false; const L = Y.lod(); set(L); const ME = G.MESH, ox = m.x, oy = m.y, rel = p => [p[0] - ox, p[1] - oy, p[2]], items = [], halo = [], Fr = frameOf(FX, m, M);
    for (const i of [0, 1, 2, 3, 7, 8, 9, 10, 11]) K.hide(ME['lamp' + L], i);   // (the heart's own lamps are in its pass)
    let any = false; if (!m.dead) for (const cb of M.cab) if (cb.lift >= 0.15) { tentacle(items, halo, ME, L, cb, M, rel, Fr, 0, M.P.dk, (1 - M.P.dk) * M.P.wake); any = true; } else hideTent(ME, L, cb.k);
    // the pistons' heads over their lanes, dropping out of the dark
    const heads = []; for (const s of FX.S.tele) { if (s.done || !s.lane) continue; const u = cl(s.age / s.t); if (u < 0.5) continue; heads.push([s.lane.ly, 8 * (1 - Math.pow((u - 0.5) / 0.5, 2))]); }
    for (const s of M.slams) heads.push([s.ly, s.t < 0.3 ? 0 : 8 * (s.t < 1.1 ? ((s.t - 0.3) / 0.8) ** 2 * (3 - 2 * (s.t - 0.3) / 0.8) : 1)]);
    const PH = ME['phead' + L], PR = ME['prod' + L]; let nh = 0;
    for (const [ly, z] of heads) { const hw = R0.laneHalf(ly), n = Math.max(2, Math.floor(hw * 2 / 3.4)), step = hw * 2 / n; for (let i = 0; i < n && nh < 40; i++) { const x0 = C.x - hw + i * step + 0.25, x1 = x0 + step - 0.5, xm = (x0 + x1) / 2, p = rel([xm, C.y + ly, z + 0.55]);
        K.place(PH, nh, I3(), p, [(x1 - x0) / 2, R0.LW / 2 - 0.15, 1]); K.place(PR, nh, I3(), vadd(p, [0, -0.2, 0.55]), [1, 1, 26 - z]); halo.push([0, vadd(p, [0, 0, 0.6]), 0.9, AMBER, 0.6]); nh++; } }
    for (let i = nh; i < 40; i++) { K.hide(PH, i); K.hide(PR, i); } if (nh) { K.commit(PH); K.commit(PR); items.push({ mesh: PH, glow: 1, wear: 0.4 }, { mesh: PR, wear: 0.6 }); any = true; }
    if (any) { K.commit(ME['collar' + L]); K.commit(ME['jaw' + L]); K.commit(ME['clamp' + L]); K.commit(ME['lamp' + L]); items.push({ mesh: ME['collar' + L], wear: 0.8 }, { mesh: ME['jaw' + L], wear: 0.1 }, { mesh: ME['clamp' + L], wear: 0.45 }, { mesh: ME['lamp' + L], glow: 1, outline: false });
      try { Y.pass(c, FX.sx(ox), FX.sy(oy), T, items, { light: 'core', t: M.bt || t }, G, null); } catch (e) { G.fail(); } }
    const Q = F.begin(c, null);
    try { Y.halos(Q, halo, FX.sx(ox), FX.sy(oy), T, 1);
      if (M.ov) for (let i = 0; i < 4; i++) { const cp = M.caps[i]; if (cp.st !== 'charged') continue; const a = R0.lensAt(FX), b = [C.x + R0.CAPS[i][0], C.y + R0.CAPS[i][1] - 2.7]; Y.bolt(Q, FX.sx(a[0] + (i % 2 ? 4 : -4)), FX.sy(a[1] + 3), FX.sx(b[0]), FX.sy(b[1]), T * 0.16, VIOLET_HI, 0.55 + 0.35 * Math.sin(t * 20 + i), i * 7 + 3); }
      if (m.stunT > 0 && FX.S.weak.lens && !FX.S.weak.lens.dead) { const Lq = R0.lensAt(FX), X = FX.sx(Lq[0]), Yy = FX.sy(Lq[1]), pu = 0.5 + 0.5 * Math.sin(t * 7), col = M.stall ? '#FFB07A' : AMBER_HI; Q.ring(X, Yy, T * (3.6 + pu * 0.4), col, 0.55 + 0.4 * pu, T * 0.16); Q.glow(X, Yy, T * 4, col, 0.25); }
      if (M.sw) for (const p of R0.PORTS) Q.glow(FX.sx(C.x + p[0]), FX.sy(C.y + p[1]), T * 1.4, '#8FFFB0', 0.35 + 0.25 * Math.sin(t * 6));
    } finally { F.flush(c); }
    return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { if (G.on() && RIG()) set(Y.lod()); }]; }
  function info() { const tr = L => { if (!SETS[L] || !G.MESH) return null; let n = 0; for (const k in G.MESH) if (k.endsWith(String(L)) && G.MESH[k] && !/^(phead|prod)/.test(k)) n += G.MESH[k].ntri; return n; }; return Object.assign({}, INFO, { trisFull: tr(0), trisLod: tr(1), buildMs: [SETS[0] && Math.round(SETS[0].ms), SETS[1] && Math.round(SETS[1].ms)] }); }
  return { G, gpu, paint, overlay, drawFx, init, preload, info, get kit() { return A; }, get y3() { return Y; } };
})();
