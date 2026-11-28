/* ---------- (v474 LB) NHALEX, THE UNWRITTEN MIND in three dimensions (Rift 07, the Library's last boss: the Final Archive) ----------
   The 2D Nhalex of 20zg-rift-fiend-library-3.js rebuilt as a sculpted, textured and lit GPU model on LIB3 (20zea), the same mind from its
   2D drawing, posed every frame on the fight's own state (its brain drifting, bobbing, rolling as it thinks and sagging when spent; its
   front lobe parting on the golden core; the eyes following, blinking, closing one by one; the six tendrils along the fight's own
   curves, rearing, stabbing, writing and stuck in the floor; the plume boiling on the last page; the page ring turning; the model of
   Gaia turning and lighting its seven points at the fall), so it floats exactly where its hit areas are and its fight is untouched.
   The brain faces the camera as the 2D's does (its lobes laid in the facing plane, their depth toward the viewer). Materials GLM
   960..968 (LB-LIB-MAT, 20k5uz).
   THE BRAIN (960): five broad ivory lobes, their gyri sculpted in the mesh (narrow folds between broad ridges) and the 2D's burgundy
   grooves cut deep along their own curves; wet, light under the skin, a warm rim; boiling rose on the last page, greying in its fall.
   Spent, its front lobe parts in two (their cut faces 960.4) on the golden core (961: molten gold, fractured light).
   THE EYES (962, 963): three mismatched gold eyes (round, slit, small round) in lids of ivory with burgundy rims, blinking.
   THE INK (964): the plume, a glossy black column tapering from under the brain to a pool on the floor (964.4, rings running out),
   violet streaks flowing down it; six tendrils of the same ink, each with two gold rings and a gold quill nib (965: its slit and
   breather hole, engraved).
   THE PAGE RING (966, 967): four great parchment pages turning behind it, each with its gilt frame, script and its one great black
   symbol (the eye, the spiral, the trident, the key), a folded corner; violet while the unwritten pour; the broken gilt band.
   GAIA (968): the little model of the world in its glassless gilded frame on a stand, a tilted meridian; oceans, lands, ice; its
   seven points lit gold at the fall.
   THE PROJECTIONS: the real ending is the mind itself, small, out of its book; the copies stay the 2D's hollow dashed outlines.
   LIGHT: one pass in the Final Archive's light (a pale gilt key, the void's violet rim, the bright parchment's bounce); soft shadows
   and occlusion from spheres in its lobes. On the painter: its aura behind it, the eyes' gold, the core's light, Gaia's points.
   LEVELS: full on High; Balanced, Performance and Fewer effects take the lighter level. GPU buffers freed with the stage. */
const NHALEX_GL = (() => {
  const L3 = LIB3, Y = YUG3, A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv } = K, lowFx = K.lowFx, nowMs = K.nowMs;
  const M_LOBE = 960, M_CORE = 961, M_EYE = 962, M_LID = 963, M_INK = 964, M_NIB = 965, M_PAGE = 966, M_BAND = 967, M_GAIA = 968;
  const GOLD = '#CFAD62', GOLD_HI = '#F2DC9A', VIOLET_HI = '#CDB4FF', ROSE = '#E2456C', IRIS = '#E9B23C', AURA = '#B89CFF', WHITE = '#FFFFFF';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.nhalex ? FIEND_DEFS.nhalex.RIG : null; } catch (e) { return null; } };
  const G = A.model('Nhalex', () => ({}));
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const INFO = { lod: 0, calls: 0, tris: 0, W: 0, H: 0, ms: 0, poseMs: 0 };
  const CFG = [{ q: 1, lu: 72, lv: 44, pu: 48, pr: 20, tu: 34, tr: 10, pg: 14, es: 22 }, { q: 0.6, lu: 40, lv: 24, pu: 24, pr: 12, tu: 18, tr: 7, pg: 7, es: 14 }];
  const SQ = Math.SQRT1_2, EX = [1, 0, 0], ED = vnrm([0, 1, 1]), EW = vnrm([0, -1, 1]);   // (the facing plane: right, toward the camera, up the screen; a local z of 1 is 1/SQ tiles up the screen, so heights are built (or scaled) x SQ: a ball reads round)
  const LOBE_D = [0, 0, 0.55, 0.55, 1.05];   // (the lobes' depth toward the viewer: the crown behind, the brow in front)
  const SETS = [null, null];
  const hs3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  // the 2D's grooves (quadratic curves in a lobe's own -1..1) as points, for the distance to them
  const qpts = g => { const o = []; for (let i = 0; i <= 12; i++) { const t = i / 12, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; o.push([a * g[0][0] + b * g[1][0] + c * g[2][0], a * g[0][1] + b * g[1][1] + c * g[2][1]]); } return o; };
  const dPoly = (x, y, P) => { let d = 9; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], u = cl(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)); d = Math.min(d, Math.hypot(x - a[0] - dx * u, y - a[1] - dy * u)); } return d; };
  /* a lobe (L: the 2D's u, w, ru, rw, rot) in the brain's local frame (x right, y toward the viewer, z up the screen x SQ): its folds
     sculpted (vA.y how deep in a fold), the 2D's grooves cut along their curves (vA.z); half: -1 / 1 only that half (a cut face to x 0) */
  function lobe(B, L, li, R0, nu, nv, half) { const co = Math.cos(L.rot), si = Math.sin(L.rot), rd = Math.min(L.ru, L.rw) * 0.92, D = LOBE_D[li], GR = (R0.GROOVES[li] || []).map(qpts), q = n => n;
    const at = (u, v) => { const ph = half ? (half < 0 ? Math.PI / 2 + u * Math.PI : -Math.PI / 2 + u * Math.PI) : u * TAU, th = 0.001 + v * (Math.PI - 0.002), sx = Math.sin(th) * Math.cos(ph), sz = Math.sin(th) * Math.sin(ph), sy = Math.cos(th);   // (sy toward the viewer: the pole faces the camera)
      const f = Y.n3(sx * 3.6 + li * 7.1, sy * 3.0 + 2, sz * 3.6) * 0.7 + Y.n3(sx * 8, sy * 8 + li, sz * 8) * 0.3, g = Math.exp(-(((f - 0.5) / 0.06) ** 2)) * (0.4 + 0.6 * Math.max(0, sy));
      let gv = 0; if (sy > -0.1) for (const P of GR) gv = Math.max(gv, Math.exp(-((dPoly(sx, sz, P) / 0.075) ** 2))); gv *= cl((sy + 0.1) * 3);
      const k = 1 + 0.045 * Math.sin(3 * Math.atan2(sz, sx) + L.ph) - 0.09 * g - 0.13 * gv, x = sx * L.ru * k, z = sz * L.rw * k, y = sy * rd * k;
      return { p: [L.u + x * co - z * si, D + y, (L.w + x * si + z * co) * SQ], g, gv }; };
    B.surf((u, v) => at(u, v).p, nu, nv, () => M_LOBE, { e: (u, v) => at(u, v).g, a: (u, v) => at(u, v).gv });
    if (half) B.surf((u, v) => { const th = 0.001 + v * (Math.PI - 0.002), ph = -Math.PI / 2 + u * Math.PI, r = Math.sin(th), sz = r * Math.sin(ph) * 0.97, sy = Math.cos(th) * 0.97, x = 0, z = sz * L.rw, y = sy * rd; void ph; return [L.u + x * co - z * si, D + y, (L.w + x * si + z * co) * SQ]; }, 6, Math.round(nv / 2), () => M_LOBE + 0.4, { e: () => 0.2, a: () => 0 }); }
  function set(L) { if (SETS[L] && G.MESH && G.MESH['brain' + L]) return SETS[L]; const t0 = nowMs(), C = CFG[L], R0 = RIG(), out = {};
    { const B = GLM.builder(1); for (let li = 0; li < 4; li++) lobe(B, R0.LOBES[li], li, R0, C.lu, C.lv, 0); out['brain' + L] = B.done(); }
    for (const [nm, h] of [['browL', -1], ['browR', 1]]) { const B = GLM.builder(1); lobe(B, R0.LOBES[4], 4, R0, Math.round(C.lu / 2), C.lv, h); out[nm + L] = B.done(); }
    { const B = GLM.builder(C.q); B.sph([0, 0, 0], 1, M_CORE, 28); out['core' + L] = B.done(); }
    { const B = GLM.builder(1); B.sph([0, 0, 0], 1, M_EYE, C.es); out['eye' + L] = Y.copies(L3.eyeAtt(B.done()), 6); }
    { const B = GLM.builder(C.q); B.ell([0, 0, 0], [1.12, 1.12, 1.12], M_LID, { seg: 20, rings: 8, th0: 0, th1: Math.PI / 2 + 0.06 }); B.tor([0, 0, Math.cos(Math.PI / 2 + 0.06) * 1.12], Math.sin(Math.PI / 2 + 0.06) * 1.12, 0.1, M_LID + 0.2, { seg: 20, rseg: 5 }); out['lid' + L] = Y.copies(B.done(), 12); }
    out['plume' + L] = Y.mkGrid(C.pu, C.pr, (i, j) => [j / C.pr, i / C.pu], M_INK);
    { const B = GLM.builder(C.q); B.ell([0, 0, 0], [1, 1, 0.05], M_INK + 0.4, { seg: 40, rings: 10, th1: Math.PI / 2, cap: true }); out['pool' + L] = B.done(); }
    for (let k = 0; k < 6; k++) out['tend' + k + L] = Y.mkGrid(C.tu, C.tr, (i, j) => [j / C.tr, i / C.tu], M_INK);
    { const B = GLM.builder(C.q); B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]); B.tor([0, 0, 0], 1, 0.22, M_NIB, { seg: 16, rseg: 6 }); B.pop(); out['ring' + L] = Y.copies(B.done(), 12); }
    { const B = GLM.builder(C.q), Ln = 1.25, Wd = 0.62, pts = []; const pathPt = (t) => { if (t < 0.25) { const u = t / 0.25; return [lerp(-0.1, Ln * 0.62, u), lerp(-Wd * 0.5, -Wd * 0.22, u) - Math.sin(u * Math.PI) * 0.08]; } if (t < 0.5) { const u = (t - 0.25) / 0.25; return [lerp(Ln * 0.62, Ln, u), lerp(-Wd * 0.22, 0, u)]; } if (t < 0.75) { const u = (t - 0.5) / 0.25; return [lerp(Ln, Ln * 0.62, u), lerp(0, Wd * 0.22, u)]; } const u = (t - 0.75) / 0.25; return [lerp(Ln * 0.62, -0.1, u), lerp(Wd * 0.22, Wd * 0.5, u) + Math.sin(u * Math.PI) * 0.08]; };
      for (let i = 0; i < 24; i++) pts.push(pathPt(i / 24)); B.prism(pts, -0.06, 0.06, M_NIB + 0.2, { b: 0.025 }); out['nib' + L] = B.done(); }
    // a page of the ring (x across -1.5..1.5, y its curl toward the viewer, z up 1.95..-1.95 x SQ; vA.y across, vA.z down it)
    { const B = GLM.builder(1); B.surf((u, v) => { const x = (u - 0.5) * 3.0, z = (0.5 - v) * 3.9, cu = 0.12 * (x / 1.5) ** 2 + 0.06 * Math.sin(v * 3.1 + u * 2), fold = u > 0.8 && v > 0.86 && (u - 0.8) / 0.2 + (v - 0.86) / 0.14 >= 1 ? 0.12 : 0; return [x, cu + fold, z * SQ]; }, C.pg * 2, Math.round(C.pg * 2.6), () => M_PAGE, { e: u => u, a: (u, v) => v }); out['page' + L] = B.done(); }
    // the ring's gilt band (unit radius in its own x-z plane, z up the screen; between the pages, every second arc broken)
    { const B = GLM.builder(C.q); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); for (let k = 0; k < 4; k++) { const a0 = k * TAU / 4 + 0.42 / 1, a1 = (k + 1) * TAU / 4 - 0.42, segs = k % 2 ? [[a0, (a0 + a1) / 2 - 0.1], [(a0 + a1) / 2 + 0.13, a1]] : [[a0, a1]];
        for (const [s0, s1] of segs) B.tor([0, 0, 0], 1, 0.035, M_BAND, { seg: 20, rseg: 6, ph0: s0, ph1: s1 }); } B.pop(); out['band' + L] = B.done(); }
    // Gaia: the globe (its own unit sphere), the frame's ring, the stand and its foot, the meridian
    { const B = GLM.builder(C.q); B.sph([0, 0, 0], 1, M_GAIA, 36); out['gaia' + L] = B.done(); }
    { const B = GLM.builder(C.q); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.tor([0, 0, 0], 1.42, 0.085, M_BAND, { seg: 40, rseg: 7 }); B.pop(); B.tube([0, 0, -1.42], [0, 0, -2.1], 0.09, 0.09, M_BAND + 0.2, { seg: 10 }); B.ell([0, 0, -2.15], [0.55, 0.3, 0.1], M_BAND, { seg: 20, rings: 6 }); out['gframe' + L] = B.done(); }
    { const B = GLM.builder(C.q); B.tor([0, 0, 0], 1.18, 0.06, M_BAND, { seg: 36, rseg: 6 }); out['merid' + L] = B.done(); }
    Object.assign(G.MESH, out); SETS[L] = { C, ms: nowMs() - t0 }; return SETS[L]; }

  /* ---------- posing: in the fight's world, relative to the boss's point (ox, oy) ---------- */
  // the facing plane turned by a (counter-clockwise on the screen): its right and its up
  const plane = a => { const c = Math.cos(a), s = Math.sin(a); return M3(vadd(vmul(EX, c), vmul(EW, s)), ED, vadd(vmul(EX, -s), vmul(EW, c))); };
  // the brain's items at B (world), its scale s, its roll, eyes' states; out: items, eye points (for the halos)
  function brainItems(ME, L, M, B, s, o, items, halo, eyeK0, rel) { const R0 = RIG(), P = M.P || { open: 0, boil: 0, dk: 0 }, roll = M.roll || 0, kx = 1 + (M.recoil || 0) * 0.02 + (P.boil || 0) * Math.sin((M.bt || 0) * 9) * 0.015, kw = 1 - (M.recoil || 0) * 0.05;
    const Rb = plane(roll), sc = [s * kx, s, s * kw], c0 = rel(B), op = o.open == null ? (P.open || 0) : o.open, fl2 = o.flash ? 1 : 0, dk = P.dk || 0, fx = dk * 0.6, boil = P.boil || 0, Lb = R0.LOBES[4];
    const toW = (u, d, w) => vadd(c0, mv(Rb, [u * sc[0], d * sc[1], w * SQ * sc[2]]));
    items.push({ mesh: ME['brain' + L], R: Rb, o: c0, sc, spill: boil, glow2: fl2, fx, wear: 0.3 });
    for (const [nm, sd] of [['browL', -1], ['browR', 1]]) items.push({ mesh: ME[nm + L], R: Rb, o: vadd(c0, mv(Rb, [sd * 1.45 * op * sc[0], 0.1 * op, -0.3 * op * SQ * sc[2]])), sc, spill: boil, glow: op, glow2: fl2, fx, wear: 0.55 + sd * 0.1 });
    if (op > 0.02 && !o.small) { const rC = 1.3 * (0.6 + 0.4 * op) * s, cq = toW(Lb.u, LOBE_D[4] - 0.25, Lb.w - 0.05); items.push({ mesh: ME['core' + L], o: cq, sc: [rC, rC * 0.75, rC * 0.9 * SQ], glow: op, glow2: fl2, wear: 0.5 }); halo.push([0, cq, rC * 3.2, GOLD_HI, 0.55 * op], [0, cq, rC * 1.3, WHITE, 0.3 * op * (0.6 + 0.4 * Math.sin((M.bt || 0) * 7))]); }
    // the eyes: on their lobes' fronts, gazing at the pet (look), lidded by their blinks
    const LS = ME['eye' + L], LD = ME['lid' + L], lk = M.look || [0, 0.3], eps = [];
    R0.EYES.forEach((E, i) => { const Lo = R0.LOBES[E[0]], co = Math.cos(Lo.rot), si = Math.sin(Lo.rot), lu = E[1] * Lo.ru, lw = E[2] * Lo.rw, sy = Math.sqrt(Math.max(0, 1 - E[1] * E[1] - E[2] * E[2])), rd = Math.min(Lo.ru, Lo.rw) * 0.92, r = E[3] * s, sq = E[4], ek = eyeK0 + i;
      const p = toW(Lo.u + lu * co - lw * si, LOBE_D[E[0]] + sy * rd * 0.93 - E[3] * 0.25, Lo.w + lu * si + lw * co), gz = vnrm(vadd(vadd(mv(Rb, [0, 1, 0]), mv(Rb, [lk[0] * 0.45, 0, -lk[1] * 0.25])), [0, 0, 0])), rl = E[6], b = (M.eyes && M.eyes[i] ? M.eyes[i].b : 0);
      const Rg = Y.along(gz, vadd(mv(Rb, [-Math.sin(rl), 0, Math.cos(rl)]), [0, 0, 0])); K.place(LS, ek, Rg, p, [r, r, r * sq]); eps.push([p, r, b]);
      const RfL = Y.along(mv(Rb, [0, 1, 0]), mv(Rb, [-Math.sin(rl), 0, Math.cos(rl)])), rot = th => { const c = Math.cos(th), s2 = Math.sin(th); return M3(vadd(vmul(RfL.x, c), vmul(RfL.z, -s2)), RfL.y, vadd(vmul(RfL.x, s2), vmul(RfL.z, c))); };
      const up = -0.95 + b * (Math.PI / 2 + 0.95), dn = 1.1 - b * (Math.PI / 2 + 1.1), Ru = rot(up), Rd0 = rot(dn), Rd = M3(Rd0.x, vmul(Rd0.y, -1), vmul(Rd0.z, -1)); K.place(LD, ek * 2, Ru, p, [r, r, r * sq]); K.place(LD, ek * 2 + 1, Rd, p, [r, r, r * sq]);
      if (!o.small) halo.push([0, p, r * 2.4, IRIS, 0.35 * (1 - b) * (1 - dk)]); });
    return { Rb, sc, toW, eps }; }
  function pose(FX, m, M, o) { const R0 = RIG(), L = L3.lod(), S = set(L), C0 = S.C, ME = G.MESH, ox = m.x, oy = m.y, rel = p => [p[0] - ox, p[1] - oy, p[2]], C = FX.C, P = M.P, bt = M.bt || 0, B = R0.brainAt(FX), halo = [], pre = [], items = [];
    const fl2 = o.flash ? 1 : 0, dk = P.dk || 0, boil = P.boil || 0, fx = dk * 0.6;
    if (o.raised) { tendrilsOnly(); return { items, halo, pre, occ: [] }; }
    // ---- its aura behind it (laid down before the model)
    pre.push([0, rel(B), 6.5, boil > 0.3 ? ROSE : AURA, (0.18 + boil * 0.25) * (1 - dk)]);
    // ---- Gaia in its frame
    { const Gp = rel(R0.gaiaAt(FX)), rot = bt * 0.35, Rg = M3(vadd(vmul(EX, Math.cos(rot)), vmul(ED, -Math.sin(rot))), vadd(vmul(EX, Math.sin(rot)), vmul(ED, Math.cos(rot))), EW), Rgl = Rg;
      items.push({ mesh: ME['gaia' + L], R: Rgl, o: Gp, sc: [1.05, 1.05, 1.05 * SQ], spill: M.lit || 0, glow2: fl2, wear: 0.4 }, { mesh: ME['gframe' + L], R: plane(0), o: Gp, sc: [1.05, 1.05, 1.05 * SQ], glow2: fl2, wear: 0.7 });
      const tilt = -0.35; items.push({ mesh: ME['merid' + L], R: M3(vadd(vmul(EX, Math.cos(tilt)), vmul(EW, Math.sin(tilt))), ED, vadd(vmul(EW, Math.cos(tilt)), vmul(EX, -Math.sin(tilt)))), o: Gp, sc: [1.05, 1.05, 1.05 * SQ], glow2: fl2, wear: 0.2 });   // (the meridian about the screen's up, tilted)
      const lit = M.lit || 0, GP = R0.GAIA_PTS; for (let i = 0; i < lit; i++) { const [lon, lat] = GP[i], d = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)], w = vadd(Gp, mv(Rgl, [d[0] * 1.06, d[1] * 1.06, d[2] * 1.06 * SQ])), cz = vdot(mv(Rgl, d), ED); if (cz > 0) halo.push([0, w, 0.9, GOLD_HI, 0.9 * cz], [0, w, 0.3, WHITE, 0.9 * cz]); } }
    // ---- the page ring: four pages turning, its broken gilt band
    { const Rc = vadd(rel(B), [0, R0.RING_DY, 0.3]), Rr = R0.RING_R, glowK = (M.hd ? 1 : 0) + boil * 0.6; items.push({ mesh: ME['band' + L], R: plane(M.ringA || 0), o: vadd(Rc, [0, 0, 0]), sc: [Rr, Rr, Rr * SQ], glow2: fl2, fx, wear: 0.6 });
      for (let k = 0; k < 4; k++) { const th = (M.ringA || 0) + k * TAU / 4, rot = Math.PI / 2 - th + dk * (k % 2 ? 0.6 : -0.5), flut = 0.86 + 0.14 * Math.cos(bt * 0.9 + k * 1.7), pc = vadd(vadd(Rc, vadd(vmul(EX, Math.cos(th) * Rr), vmul(EW, Math.sin(th) * Rr * SQ))), [0, 0, -dk * dk * (3 + k * 1.5)]);
        items.push({ mesh: ME['page' + L], R: plane(-rot), o: pc, sc: [flut, 1, 1], kind: k, spill: M.hd ? 1 : 0, glow2: fl2, fx, wear: 0.1 + k * 0.23 }); if (glowK > 0) halo.push([0, pc, 3.5, VIOLET_HI, 0.3 * glowK]); } }
    // ---- the plume: from under the brain tapering to the floor, its pool; boiling on the last page
    const fx0 = M.fx == null ? C.x : M.fx, foot = rel([fx0, C.y + R0.FOOT_Y, 0]);
    items.push({ mesh: ME['pool' + L], o: foot, sc: [2.6 + boil * 0.8, (2.6 + boil * 0.8) * 0.42, 1], spill: boil, glow2: fl2, fx, wear: 0.9 });
    if (dk < 0.6) { const top = rel([B[0], B[1] + 0.3, B[2] - R0.BH * 0.7]), pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([lerp(top[0], foot[0], u) + Math.sin(bt * 1.8 - u * 5) * 0.28 * u + boil * Math.sin(bt * 11 + u * 9) * 0.25, lerp(top[1], foot[1], u), lerp(top[2], 0.05, u)]); }
      const Mp = ME['plume' + L]; Y.sweep(Mp, pts, u => ((u < 0.86 ? lerp(3.3, 0.95, Math.pow(u / 0.86, 0.7)) : lerp(0.95, 2.4, (u - 0.86) / 0.14)) * (1 + boil * 0.22 * Math.sin(bt * 9 + u * 7)) * (1 - dk * 0.6)) * 0.5); items.push({ mesh: Mp, spill: boil, glow2: fl2, fx, wear: 0.5 }); }
    // ---- the tendrils: ink, two gold rings each, a gold nib
    tendrilsOnly();
    function tendrilsOnly() { const RG = ME['ring' + L]; let nr = 0; (M.tend || []).forEach((tn, k) => { if (!tn.pts) return; const up = tn.lift >= 0.15 && !m.dead; if (o.raised ? !up : up) return; const pts = tn.pts.map(rel), n = pts.length - 1, w0 = 1.0 * (1 - dk * 0.3), rad = u => w0 * (1 - u * 0.58) * 0.5, Mt = ME['tend' + k + L];
        Y.sweep(Mt, pts, u => rad(u) * (1 + 0.04 * Math.sin(u * 30 + k))); items.push({ mesh: Mt, spill: boil, glow2: fl2, fx, wear: 0.1 + k * 0.15 });
        for (const u of [0.45, 0.62]) { const i = Math.round(u * n), p = pts[i], d = vnrm(vsub(pts[Math.min(n, i + 1)], pts[Math.max(0, i - 1)])), r = rad(u) * 1.05; K.place(RG, nr++, Y.along(d), p, [r * 0.35, r, r]); }
        const d = vnrm(vsub(pts[n], pts[n - 1])), Rn = Y.along(d, Math.abs(d[2]) > 0.85 ? [0, 1, 0] : [0, 0, 1]); items.push({ mesh: ME['nib' + L], R: Rn, o: vsub(pts[n], vmul(d, 0.1)), glow2: fl2, fx, wear: k * 0.17 }); });
      const used = nr; for (; nr < 12; nr++) K.hide(RG, nr); K.commit(RG); if (used) items.push({ mesh: RG, glow2: fl2, fx, wear: 0.3, outline: false }); }
    // ---- the brain, its eyes; the real projection of it out of its book (small), with its own eyes
    const br = brainItems(ME, L, M, rel(B), 1, { flash: o.flash }, items, halo, 0, p => p);
    for (let i = 3; i < 6; i++) { K.hide(ME['eye' + L], i); K.hide(ME['lid' + L], i * 2); K.hide(ME['lid' + L], i * 2 + 1); }
    if (M.end && !m.dead) for (const Lq of M.end.list) if (Lq.on && !Lq.gone && Lq.real && Lq.a > 0.02) { const sm = 0.44 * (Lq.a * Lq.a * (3 - 2 * Lq.a)); if (sm < 0.04) continue; const Pq = R0.projAt(FX, Lq);
      brainItems(ME, L, Object.assign({}, M, { roll: Math.sin(bt * 0.7 + Lq.i) * 0.08, recoil: 0, eyes: null, P: { open: 0, boil: 0, dk: 0 } }), rel(Pq), sm, { flash: false, open: 0, small: true }, items, halo, 3, p => p); }
    K.commit(ME['eye' + L]); K.commit(ME['lid' + L]); items.push({ mesh: ME['eye' + L], glow: 0.8 * (1 - dk), glow2: fl2, fx, outline: false }, { mesh: ME['lid' + L], glow2: fl2, fx, wear: 0.4 });
    const occ = R0.LOBES.map((Lo, li) => br.toW(Lo.u, LOBE_D[li], Lo.w).concat([Math.min(Lo.ru, Lo.rw) * 0.8]));
    INFO.lod = L; return { items, halo, pre, occ }; }

  /* ---------- drawing: in the fight and in the previews (paintAll's place); the copies' outlines and the tethers stay 2D ---------- */
  function paint(c, FX, m, P3, T) { if (!gpu()) return false; const M = FX.mem; if (!M || !M.P) return false; let R;
    try { const t0 = nowMs(); R = pose(FX, m, M, { flash: m.flash > 0 }); INFO.poseMs = +(INFO.poseMs * 0.9 + (nowMs() - t0) * 0.1).toFixed(2); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Nhalex: pose', e); return false; }
    const F = A.fg(), g0 = P3(m.x, m.y, 0), X = g0[0], Y0 = g0[1], al = M.P.alpha == null ? 1 : M.P.alpha;
    if (F) { const Q = F.begin(c, null); try { Y.halos(Q, R.pre, X, Y0, T, al); } finally { F.flush(c); } }
    let ok = false; try { ok = L3.draw(c, X, Y0, T, R.items, { light: 'archive', t: M.bt || 0, flash: m.flash > 0 ? 1 : 0, occ: R.occ, alpha: al }, G, INFO); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Nhalex: draw', e); }
    if (!ok) return false;
    if (F) { const Q = F.begin(c, null); try { Y.halos(Q, R.halo, X, Y0, T, al); } finally { F.flush(c); } } return true; }
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); }
  /* ---------- its light on the archive's floor: the quill's warnings (rings of glowing ink closing in for the stabs, lanes for the
     lines: a numbered line's place in the order told by beads of light, the next one bright, the others dim; the quill's own ink
     stroke written along it), the true shelter's double ring of gold; the 2D overlay keeps the splats, the casts' ink, the projections'
     shadows, the decoy's dashed ring and the labels (M.lbGL) ---------- */
  const INKV = '#C9A0FF', DIM = '#9C88C8', ROSEL = '#F2A0D2';
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.P || !m) return false; const F = A.fg();
    if (!F || !G.on()) { M.lbGL = false; Y.marked(c, FX, t, T, null); return false; }
    M.lbGL = true; const tl = FX.S.tele.filter(s => s.aur && !s.done), nums = tl.filter(s => s.num && s.geo === 'line').sort((a, b) => (a.t - a.age) - (b.t - b.age)), next = nums[0];
    // the quill's ink along its lines (ink on the floor, under their light)
    for (const s of tl) { if (s.geo !== 'line' || s.u0 == null) continue; const wr = s.writeAt != null ? cl((FX.S.t - s.writeAt) / s.writeDur) : s.num ? 0 : 1; if (wr <= 0) continue;
      c.save(); c.translate(FX.sx(s.x), FX.sy(s.y)); c.rotate(s.a); const a0 = s.u0 * T, a1 = lerp(s.u0, s.u1, wr) * T; c.strokeStyle = '#0E0A16'; c.lineCap = 'round'; c.lineWidth = T * 0.34; c.beginPath(); c.moveTo(a0, 0); for (let q = a0; q <= a1; q += T * 0.8) c.lineTo(q, Math.sin(q / T * 0.9) * T * 0.12); c.stroke(); c.restore(); }
    const Q = F.begin(c, null);
    try { for (const s of tl) { if (s.geo === 'circle') L3.tell(Q, FX, s, T, INKV, 1); else if (s.geo === 'line') { const nx = !s.num || s === next; L3.tell(Q, FX, Object.assign({}, s, { ord: s.num || 0 }), T, s.num ? (nx ? GOLD_HI : DIM) : ROSEL); if (s.num && !nx) L3.tell(Q, FX, Object.assign({}, s, { ord: s.num, age: 0 }), T, DIM); } else if (s.geo === 'cone') L3.tell(Q, FX, s, T, ROSEL); }
      if (M.salv) { const R = M.salv.real, X = FX.sx(R.x), Yy = FX.sy(R.y), r = R.r * T, pu = 0.5 + 0.5 * Math.sin(t * 4); Q.glow(X, Yy, r * 1.25, GOLD_HI, 0.3 + 0.15 * pu); Q.ring(X, Yy, r, GOLD_HI, 0.9, T * 0.18); Q.ring(X, Yy, r - T * 0.42, GOLD_HI, 0.85, T * 0.14); } }
    finally { F.flush(c); }
    return false; }
  /* ---------- over the field: the raised tendrils (a pass of their own, over the pet), the bared core's ring ---------- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M.P || !M.lbGL || !gpu()) return false; const F = A.fg(); if (!F) return false;
    if (!m.dead && (M.tend || []).some(tn => tn.lift >= 0.15)) { let R; try { R = pose(FX, m, M, { raised: true, flash: m.flash > 0 }); } catch (e) { G.fail(); return false; }
      if (R.items.length) try { L3.draw(c, FX.sx(m.x), FX.sy(m.y), T, R.items, { light: 'archive', t: M.bt || 0 }, G, INFO); } catch (e) { G.fail(); } }
    const wk = FX.S.weak.core; if (wk && !wk.dead) { const cp = RIG().coreAt(FX), X = FX.sx(cp[0]), Yy = FX.sy(cp[1]) - cp[2] * T, pu = 0.5 + 0.5 * Math.sin(t * 7), Q = F.begin(c, null); try { Q.ring(X, Yy, T * (2.0 + pu * 0.3), GOLD_HI, 0.55 + 0.4 * pu, T * 0.16); } finally { F.flush(c); } }
    return true; }
  // the Last Page's time: a ring of light burning down (653) in place of the 2D's great number
  function lastPage(c, X, Y0, r, left, hot) { const F = A.fg(); if (!F) return false; const Q = F.begin(c, null); try { Q.glow(X, Y0, r * 1.5, ROSE, 0.25 + 0.2 * hot); Q.quad(653, X, Y0, r, 0, 0, r, GOLD_HI, 1, left, hot); } finally { F.flush(c); } return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { if (G.on() && RIG()) set(L3.lod()); }]; }
  const info = () => L3.info(G, SETS, INFO);
  return { G, gpu, paint, overlay, drawFx, lastPage, init, preload, info, get kit() { return A; }, get y3() { return Y; } };
})();
