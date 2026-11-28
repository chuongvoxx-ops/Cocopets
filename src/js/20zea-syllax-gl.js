/* ---------- (v474 LB) LIB3: what the Library of Unwritten Lives' three bosses share on the GPU ----------
   On YUG3 (20z7a: one GPU pass a boss a frame into the box round it, in the fight's own camera, posed on the fight's own skeleton; its
   detail levels and halos), AUR3 (20z4a: a model's GL state, its failures, its release with the stage; warnings marked for light) and
   GB_KIT (20x2: vectors, many copies of one mesh). The Library's lights are added to YUG3's by name: circle (the Reading Circle: warm
   lamplight from the lamps over its heart, the ink void's violet behind), ink (the Spilled-Ink Chamber: candle gold, a burgundy dusk
   rim), archive (the Final Archive: a pale gilt key under the black moon, the void's violet rim). Materials GLM 940..979 (LB-LIB-MAT in
   20k5uz), warnings and effects on the FGFX painter (kinds 600..604 of YB-FX in the Library's own colours, and LB-FX 650..669 in 20k6h).
   Detail levels: 0 on High, 1 on Balanced, Performance and Fewer effects (and lowFx); window.__LB_LOD = 0 | 1 forces one. Without
   WebGL (or on a software rasteriser, unless window.__AUR_GL) or without the painter, each boss is drawn by its 2D art. */
const LIB3 = (() => {
  const Y = YUG3, A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, mv } = K, lowFx = K.lowFx;
  Object.assign(Y.LIGHT, {
    circle: { lk: vnrm([-0.42, 0.42, 0.8]), ls: vnrm([0.2, 0.15, 0.97]), lr: vnrm([0.45, -0.82, 0.35]), key: [2.0, 1.74, 1.4], rim: [0.85, 0.55, 1.55] },
    ink: { lk: vnrm([-0.4, 0.5, 0.77]), ls: vnrm([0.25, 0.2, 0.95]), lr: vnrm([-0.4, -0.85, 0.35]), key: [1.95, 1.66, 1.3], rim: [1.25, 0.5, 0.9] },
    archive: { lk: vnrm([-0.35, 0.55, 0.76]), ls: vnrm([0.15, 0.3, 0.94]), lr: vnrm([0.4, -0.85, 0.35]), key: [2.0, 1.85, 1.6], rim: [0.8, 0.6, 1.6] } });
  const lod = () => { const f = Y.win('__LB_LOD'); return f === 0 || f === 1 ? f : Y.lod(); };
  // a unit sphere's own direction in its attributes, its side kept (eyes): e = (y + 1) / 2 (+ 2 on its back half), a = (z + 1) / 2 x 3.8
  function eyeAtt(M) { for (let i = 0; i < M.nv; i++) { const x = M.pos[i * 3], y = M.pos[i * 3 + 1], z = M.pos[i * 3 + 2], l = Math.hypot(x, y, z) || 1; M.att[i * 3 + 1] = (y / l + 1) / 2 + (x < 0 ? 2 : 0); M.att[i * 3 + 2] = (z / l + 1) / 2 * 3.8; } return M; }
  // the place across a box in its vertices' attributes (vertices i0..i1): s along x, t along y (its top and bottom faces); on its
  // sides (pg) s its height instead (a page block's stacked edges)
  function boxST(M, i0, i1, x0, x1, y0, y1, z0, z1, pg) { const P = M.pos, N = M.nrm, A2 = M.att;
    for (let i = i0; i < i1; i++) { const s = cl((P[i * 3] - x0) / (x1 - x0)), t = cl((P[i * 3 + 1] - y0) / (y1 - y0));
      if (pg && Math.abs(N[i * 3 + 2]) < 0.7) { A2[i * 3 + 1] = cl((P[i * 3 + 2] - z0) / (z1 - z0)); A2[i * 3 + 2] = (s + t) * 0.5; } else { A2[i * 3 + 1] = s; A2[i * 3 + 2] = t; } } }
  // a flat ribbon written into a grid (i along, j across 0..nv) along points P (world, n + 1) with a half-width hw(u); its
  // across direction lies flat (sideways of its path), twisted by tw(u); end: a swallowtail cut k deep
  function ribbon(M, P, hw, tw, cut) { const nu = M.nu, nv = M.nvv, n1 = nu + 1, PP = M.pos, m = P.length - 1;
    for (let i = 0; i <= nu; i++) { const u = i / nu, f = u * m, q = Math.min(m - 1, Math.floor(f)), e = f - q, p = vadd(P[q], vmul(vsub(P[q + 1], P[q]), e)), d = vnrm(vsub(P[q + 1], P[q]));
      let s = vnrm(vcross([0, 0, 1], d)); if (!(vlen(s) > 0.5)) s = [1, 0, 0]; const th = tw ? tw(u) : 0, up = vcross(d, s), sd = vadd(vmul(s, Math.cos(th)), vmul(up, Math.sin(th))), w = hw(u);
      for (let j = 0; j <= nv; j++) { const a = j / nv * 2 - 1, tail = i === nu && cut ? (1 - Math.abs(a) * 2) * -cut : 0, o3 = (j * n1 + i) * 3;
        PP[o3] = p[0] + sd[0] * a * w + d[0] * tail; PP[o3 + 1] = p[1] + sd[1] * a * w + d[1] * tail; PP[o3 + 2] = p[2] + sd[2] * a * w + d[2] * tail; } }
    Y.gridNormals(M, false); }
  const rotUH = j => { const c = Math.cos(j), s = Math.sin(j); return M3([c, 0, s], [0, 1, 0], [-s, 0, c]); };   // (a turn in a frame's u-h plane: its front lifted by j)
  const flipZ = R => M3(R.x, vmul(R.y, -1), vmul(R.z, -1));
  // one pass in a named light, the canvas kept round it (alpha: the whole picture faded)
  function draw(c, X0, Y0, T, items, o, G, INFO) { const al = o.alpha == null ? 1 : o.alpha; if (al < 0.004) return true; if (al < 0.999) { c.save(); c.globalAlpha *= al; }
    try { return Y.pass(c, X0, Y0, T, items, o, G, INFO); } finally { if (al < 0.999) c.restore(); } }
  /* a warning's light on the floor in the Library's colours (u 0..1 the tell, 1..2 the strike fading): a circle a ring of glowing ink
     closing in (652; violet 1, gold 0), a line a lane (601, its order told by beads: s.ord), a cone a fan (602) */
  function tell(Q, FX, s, T, col, md) { const u = cl(s.age / s.t) * 0.999 + (s.done ? 1 : 0), sd = s.seed || 1, X = FX.sx(s.x), Y0 = FX.sy(s.y), c2 = col || s.col || '#F2DC9A';
    if (s.geo === 'circle') { const R = s.r * T * 1.12; Q.quad(652, X, Y0, R, 0, 0, R, c2, 1, u, sd, md || 0); }
    else Y.tell(Q, FX, Object.assign({}, s, { col: c2 }), T, 0, 0); }
  function info(G, SETS, INFO) { const tr = L => { if (!SETS[L] || !G.MESH) return null; let n = 0; for (const k in G.MESH) if (k.endsWith(String(L)) && G.MESH[k]) n += G.MESH[k].ntri; return n; }; return Object.assign({}, INFO, { trisFull: tr(0), trisLod: tr(1), buildMs: [SETS[0] && Math.round(SETS[0].ms), SETS[1] && Math.round(SETS[1].ms)] }); }
  return { Y, A, K, lod, eyeAtt, boxST, ribbon, rotUH, flipZ, draw, tell, info };
})();

/* ---------- (v474 LB) SYLLAX THE BOOKWYRM in three dimensions (Rift 07, the Library's first boss: the Reading Circle) ----------
   The 2D Syllax of 20ze-rift-fiend-library-1.js rebuilt as a sculpted, textured and lit GPU model, the same serpent of books from
   its 2D drawing, posed every frame on the fight's own skeleton (its pose(): the head-book at its height, pitch and roll, its cover-
   jaws opening about their hinge; the five volumes along the path it has crawled, each humping, pitching and rolling, their lids
   flying open in the unbinding; the ribbon trailing or swung out in a lash), so it lies exactly where its hit areas are and its fight
   is untouched. Materials GLM 940..947 (LB-LIB-MAT, 20k5uz).
   THE VOLUMES (940, 941, 943): five thick books, each a lower board and its page block, and above the hinge at its back the upper
   page block and the lid; burgundy morocco leather (pebbled grain, a varnish, the corners and edges scuffed pale), the lids tooled
   in gilt as the 2D's (a fillet frame, a dotted band, the lozenge and its stud, corner studs), gilt brass corner guards and a boss;
   the page blocks' edges stacked leaf by leaf, gilt at the boards, a written page inside (script, an illuminated capital); the
   rounded spines with raised gilt bands; the marbled endpaper under each lid.
   THE HEAD: the same book larger, its lid tooled with the 2D's eye sigil, gilt guards at its front corners (its horns), a row of
   page-teeth along each cover's front edge growing as the jaws gape, the gold eye floating between the covers (944: a slit pupil,
   wet, glowing) gazing where the fight looks; light inside its open pages.
   THE CORD (942): the leather thong binding the volumes, wound round, rising to the head as its neck. THE RIBBON (945): crimson
   satin with gold edge stripes, cut in a swallowtail, trailing and swaying or coiled and whipped across in the lash.
   THE COPY (Errata): the same head washed violet, see-through (uKind 1), its dashed hollow outline still the 2D's.
   LIGHT: one pass in the Reading Circle's light (warm lamplight, the void's violet rim, the parchment's bounce); soft shadows and
   occlusion from a sphere a volume. On the painter: the eye's glow, the light in its open pages, the copy's violet.
   LEVELS: full on High; Balanced, Performance and Fewer effects take the lighter level. GPU buffers freed with the stage. */
const SYLLAX_GL = (() => {
  const L3 = LIB3, Y = YUG3, A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv } = K, lowFx = K.lowFx, nowMs = K.nowMs;
  const M_LEA = 940, M_PG = 941, M_CORD = 942, M_GILT = 943, M_EYE = 944, M_RIB = 945;
  const GOLD = '#CFAD62', GOLD_HI = '#F2DC9A', VIOLET = '#8A5BD0', VIOLET_HI = '#CDB4FF', WHITE = '#FFFFFF';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.syllax ? FIEND_DEFS.syllax.RIG : null; } catch (e) { return null; } };
  const G = A.model('Syllax', () => ({}));
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const INFO = { lod: 0, calls: 0, tris: 0, W: 0, H: 0, ms: 0, poseMs: 0 };
  // the levels: a box's bevel steps come from GLM; the cord (along, round), the ribbon (along, across), the spines' round
  const CFG = [{ q: 1, cu: 56, cv: 12, ru: 48, rv: 4, sp: 18 }, { q: 0.6, cu: 28, cv: 7, ru: 26, rv: 2, sp: 10 }];
  const SETS = [null, null];
  /* a book (sizes as the 2D's drawBook: u0..u1 along, half-width w, height H, the hinge at hz, a board ct thick) as two meshes: below
     the hinge (the lower board, its pages, the spine's lower half) in the book's frame; above it (the upper pages, the lid, the spine's
     upper half) about the hinge's line (u0, 0, hz), to be turned there by the jaw; head: the eye sigil and the front guards */
  function book(B0, sz, head, q) { const { u0, u1, w, H, hz, ct } = sz, g = 0.05, cu = (u0 + u1) / 2, lid = head ? M_LEA + 0.2 : M_LEA, out = {};
    { const B = GLM.builder(q); let i0 = B.nv; B.box([cu, 0, ct / 2], [(u1 - u0) / 2 + g, w + g, ct / 2], 0.03, M_LEA); let i1 = B.nv; const st1 = [i0, i1, u0 - g, u1 + g, -w - g, w + g];
      i0 = B.nv; B.box([(u0 + 0.02 + u1 - 0.03) / 2, 0, (ct + hz) / 2], [(u1 - 0.03 - u0 - 0.02) / 2, w - 0.04, (hz - ct) / 2], 0.012, M_PG); i1 = B.nv; const st2 = [i0, i1, u0 + 0.02, u1 - 0.03, -w + 0.04, w - 0.04, ct, hz];
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [u0 - 0.01, 0, hz / 2]); B.tube([0, 0, -w - g], [0, 0, w + g], hz / 2 + 0.005, hz / 2 + 0.005, M_LEA + 0.4, { seg: B0.sp, cap0: 'flat', cap1: 'flat' }); B.pop();
      for (const v of [-0.5, 0.5]) { B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [u0 - 0.01, v * w, hz / 2]); B.tor([0, 0, 0], hz / 2 + 0.01, 0.025, M_GILT, { seg: B0.sp, rseg: 5 }); B.pop(); }
      const M = B.done(); L3.boxST(M, ...st1, 0, 1, false); L3.boxST(M, ...st2, true); out.lo = M; }
    { const B = GLM.builder(q), du = -u0, dz = -hz; let i0 = B.nv; B.box([(u0 + 0.02 + u1 - 0.03) / 2 + du, 0, (hz + H - ct) / 2 + dz], [(u1 - 0.03 - u0 - 0.02) / 2, w - 0.04, (H - ct - hz) / 2], 0.012, M_PG + 0.4); let i1 = B.nv; const st2 = [i0, i1, u0 + 0.02 + du, u1 - 0.03 + du, -w + 0.04, w - 0.04, hz + dz, H - ct + dz];
      i0 = B.nv; B.box([cu + du, 0, H - ct / 2 + dz], [(u1 - u0) / 2 + g, w + g, ct / 2], 0.03, lid); i1 = B.nv; const st1 = [i0, i1, u0 - g + du, u1 + g + du, -w - g, w + g];
      const hh = (H - hz) / 2; B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [-0.01, 0, hh]); B.tube([0, 0, -w - g], [0, 0, w + g], hh + 0.005, hh + 0.005, M_LEA + 0.4, { seg: B0.sp, cap0: 'flat', cap1: 'flat' }); B.pop();
      for (const v of [-0.5, 0.5]) { B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [-0.01, v * w, hh]); B.tor([0, 0, 0], hh + 0.01, 0.025, M_GILT, { seg: B0.sp, rseg: 5 }); B.pop(); }
      // gilt corner guards on the lid (the head: only at its front corners, larger: its horns) and the lid's boss
      const zt = H + dz, x0 = u0 - g + du, x1 = u1 + g + du, y1 = w + g;
      for (const [cx, sx] of [[x1, -1], [x0, 1]]) for (const sy of [-1, 1]) { if (head && sx > 0) continue; const k = head ? 0.42 : 0.28, cy = -sy * y1, pts = [[cx, cy], [cx + sx * k, cy], [cx, cy + sy * k * 1.05]];
        B.prism(pts, zt - 0.01, zt + (head ? 0.05 : 0.03), M_GILT, { b: 0.008 }); }
      if (!head) B.ell([cu + du, 0, zt], [0.1, 0.1, 0.055], M_GILT, { seg: 14, rings: 6, th1: Math.PI / 2 });
      const M = B.done(); L3.boxST(M, ...st2, true); L3.boxST(M, ...st1, 0, 1, false); out.up = M; }
    return out; }
  function set(L) { if (SETS[L] && G.MESH && G.MESH['cord' + L]) return SETS[L]; const t0 = nowMs(), C = CFG[L], R0 = RIG(), out = {};
    R0.SEGS.forEach((S, i) => { const b = book(C, { u0: -S.L / 2, u1: S.L / 2, w: S.W, H: S.H, hz: S.H - 0.2, ct: 0.09 }, false, C.q); out['vlo' + i + L] = b.lo; out['vup' + i + L] = b.up; });
    { const H0 = R0.HEAD, b = book(C, { u0: H0.u0, u1: H0.u1, w: H0.w, H: H0.H, hz: H0.hz, ct: 0.1 }, true, C.q); out['hlo' + L] = b.lo; out['hup' + L] = b.up; }
    // the page-teeth: a row of six along a cover's front edge (x 0 the edge, pointing up z 0..1, leaning back to x -0.12)
    { const B = GLM.builder(C.q); for (let i = 0; i < 6; i++) { const v = -0.8 + (i + 0.5) / 6 * 1.6; B.push([0, 1, 0], [-0.12, 0, 1], [1, 0, 0], [-0.04, v, 0]); B.prism([[-0.12, 0], [0.12, 0], [0, 1]], -0.03, 0.03, M_PG + 0.2, { b: 0.008 }); B.pop(); } out['teeth' + L] = B.done(); }
    { const B = GLM.builder(C.q); B.sph([0, 0, 0], 1, M_EYE, Math.round(22 * C.q + 6)); out['eye' + L] = Y.copies(L3.eyeAtt(B.done()), 2); }
    out['cord' + L] = Y.mkGrid(C.cu, C.cv, (i, j) => [j / C.cv, i / C.cu], M_CORD);
    out['rib' + L] = Y.mkGrid(C.ru, C.rv, (i, j) => [j / C.rv, i / C.ru], M_RIB);
    Object.assign(G.MESH, out); SETS[L] = { C, ms: nowMs() - t0 }; return SETS[L]; }

  /* ---------- posing: everything in the fight's world, relative to the point (ox, oy) ---------- */
  function headItems(ME, L, Hd, rel, o, items, halo, copy) { const R0 = RIG(), H0 = R0.HEAD, W = R0.headFrame(Hd), Rb = A.frameOf(W, 1), j = Hd.jaw || 0, Ru = Y.mm3(Rb, L3.rotUH(j)), hinge = rel(W(H0.u0, 0, H0.hz)), kd = copy ? 1 : 0, fl2 = o.flash ? 1 : 0, dead = o.dead || 0;
    items.push({ mesh: ME['hlo' + L], R: Rb, o: rel(W(0, 0, 0)), kind: kd, glow2: fl2, fx: dead, wear: 0.83 }, { mesh: ME['hup' + L], R: Ru, o: hinge, kind: kd, glow2: fl2, fx: dead, wear: 0.83 });
    const tk = cl((j - 0.1) / 0.55), th = (0.08 + 0.17 * tk) + 0.02; if (j > 0.06) { const fr = rel(W(H0.u1, 0, H0.hz)); items.push({ mesh: ME['teeth' + L], R: Rb, o: fr, sc: [1, 1, th], kind: kd, glow2: fl2, fx: dead, wear: 0.2 }, { mesh: ME['teeth' + L], R: L3.flipZ(Ru), o: vadd(hinge, vmul(Ru.x, H0.u1 - H0.u0)), sc: [1, 1, th], kind: kd, glow2: fl2, fx: dead, wear: 0.6 }); }
    // the gold eye between the covers, gazing where the fight looks
    const e = R0.eyeLocal(Hd), ep = rel(W(e[0] + 0.32, e[1], e[2] + 0.04)), r = (0.17 + 0.07 * Math.min(1, j / 0.5) + (Hd.eyeK || 0) * 0.13) * 1.12,   /* (a little nearer the covers' front than the 2D's, so it reads between them as the 2D's painted one does) */ lk = Hd.look || [0, 0.4], gz = vnrm(vadd(vadd(vmul(Rb.x, 0.35), [lk[0] * 0.8, lk[1] * 0.8 + 0.6, 0.55]), [0, 0, 0])), bl = Hd.blink || 0;
    return { ep, r, gz, Rb, W, bl, tk }; }
  function pose(FX, m, M, o) { const R0 = RIG(), L = L3.lod(), S = set(L), C = S.C, ME = G.MESH, ox = m.x, oy = m.y, rel = p => [p[0] - ox, p[1] - oy, p[2]], P = R0.pose(m, M), halo = [], items = [], occ = [];
    const fl2 = o.flash ? 1 : 0, dead = o.dead || 0, bt = M.bt || 0, H = P.head;
    // ---- the five volumes: each a lower half and an upper half turned about its hinge (the unbinding flies them open)
    P.segs.forEach((sg, i) => { const Sg = R0.SEGS[i], W = RiftFiend.frame(sg, sg.th, { z: sg.z, pitch: sg.pitch, roll: sg.roll }), Rb = A.frameOf(W, 1), op = sg.open || 0, hz = Sg.H - 0.2;
      items.push({ mesh: ME['vlo' + i + L], R: Rb, o: rel(W(0, 0, 0)), glow2: fl2, fx: dead, wear: i * 0.137 + 0.05 }, { mesh: ME['vup' + i + L], R: Y.mm3(Rb, L3.rotUH(op)), o: rel(W(-Sg.L / 2, 0, hz)), glow2: fl2, fx: dead, wear: i * 0.137 + 0.05 });
      occ.push(rel(W(0, 0, Sg.H * 0.5)).concat([Sg.W * 0.85])); if (op > 0.3) halo.push([0, rel(W(0, 0, hz + 0.3)), 1.2, GOLD_HI, 0.25 * op]); });
    // ---- the head
    const hd = headItems(ME, L, H, rel, o, items, halo, false); occ.push(rel(hd.W(0, 0, 0.45)).concat([0.95]));
    { const LS = ME['eye' + L], Rg = Y.along(hd.gz, [0, 0, 1]); K.place(LS, 0, Rg, hd.ep, [hd.r, hd.r, hd.r * (1 - 0.9 * hd.bl)]); K.hide(LS, 1); K.commit(LS); items.push({ mesh: LS, glow: 0.8 + 0.4 * Math.sin(bt * 3) + (H.eyeK || 0) * 0.8, spill: H.eyeK || 0, glow2: fl2, fx: dead, outline: false });
      halo.push([0, hd.ep, hd.r * 3.2, GOLD_HI, 0.45 + 0.2 * Math.sin(bt * 3) + (H.eyeK || 0) * 0.35]);
      if (hd.tk > 0) halo.push([0, rel(hd.W(0.2, 0, R0.HEAD.hz + Math.sin(H.jaw) * 0.5)), 1.1, GOLD, (0.25 + 0.35 * hd.tk)]); }
    // ---- the cord binding the volumes, rising to the head as its neck
    { const pts = [rel(hd.W(R0.HEAD.u0 + 0.1, 0, 0.32))].concat(P.segs.map(s => rel([s.x, s.y, s.z + 0.34])), [rel([P.base[0], P.base[1], 0.24])]), Mc = ME['cord' + L];
      Y.sweep(Mc, pts, u => (0.33 - u * 0.16) * (1 + 0.04 * Math.sin(u * 60))); items.push({ mesh: Mc, glow2: fl2, fx: dead, wear: 0.4 }); }
    // ---- the ribbon bookmark: trailing, swaying; coiled and whipped across in the lash
    { const Mr = ME['rib' + L], pts = P.rib.map(rel); L3.ribbon(Mr, pts, u => 0.17 - u * 0.02, u => Math.sin(bt * 2.2 - u * 5) * 0.35 * u, 0.4); items.push({ mesh: Mr, glow2: fl2, fx: dead, wear: 0.7 }); }
    INFO.lod = L; return { items, halo, occ, P, hd }; }

  /* ---------- drawing: the fight's draw, the copy's ---------- */
  function draw(c, FX, m, X, Y0, T, t) { if (!gpu()) return false; const M = FX.mem; if (!M) return false; let R;
    try { const t0 = nowMs(); R = pose(FX, m, M, { flash: m.flash > 0, dead: 0 }); INFO.poseMs = +(INFO.poseMs * 0.9 + (nowMs() - t0) * 0.1).toFixed(2); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Syllax: pose', e); return false; }
    const F = A.fg(), TN = RiftFiend.TN, P = R.P, S0 = RIG().SEGS;
    // its shadows on the floor, a soft one under each volume and the head (as the 2D's)
    if (TN && TN.groundShadow) { const P3 = TN.cam(X, Y0, T, m); P.segs.forEach((s, i) => { const g = P3(s.x, s.y, 0); TN.groundShadow(c, g[0], g[1] + T * 0.12, T * (S0[i].W + 0.45), T * (S0[i].W * 0.6 + 0.12), s.z * 2, 0.36); });
      const H = P.head, g = P3(H.x + Math.cos(H.hd) * 0.1, H.y + Math.sin(H.hd) * 0.1, 0); TN.groundShadow(c, g[0], g[1] + T * 0.12, T * 1.45, T * 0.8, H.z * 2, 0.4); }
    let ok = false; try { ok = L3.draw(c, X, Y0, T, R.items, { light: 'circle', t: M.bt || t, flash: m.flash > 0 ? 1 : 0, occ: R.occ }, G, INFO); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Syllax: draw', e); }
    if (!ok) return false;
    if (F) { const Q = F.begin(c, null); try { Y.halos(Q, R.halo, X, Y0, T, 1); if ((M.eyeK || 0) > 0.5 && m.stunT > 0) { const e = R.hd.ep; for (let i = 0; i < 3; i++) { const a = (M.bt || t) * 3 + i * TAU / 3; Q.glow(X + (e[0] + Math.cos(a) * 0.9) * T, Y0 + (e[1] - e[2] - 0.9 + Math.sin(a) * 0.25) * T, T * 0.3, WHITE, 0.8); } } } finally { F.flush(c); } }
    return true; }
  // the copy of its head (Errata): the same book washed violet and see-through; its dashed outline stays the 2D's
  function drawCopy(c, FX, o, X, Y0, T, t, Hd, al) { if (!gpu()) return false; const L = L3.lod(); set(L); const items = [], halo = [], rel = p => [p[0] - o.x, p[1] - o.y, p[2]];
    try { const hd = headItems(G.MESH, L, Hd, rel, {}, items, halo, true), LS = G.MESH['eye' + L]; K.place(LS, 1, Y.along(hd.gz, [0, 0, 1]), hd.ep, [hd.r, hd.r, hd.r]); K.commit(LS); items.push({ mesh: LS, kind: 1, glow: 0.7, outline: false }); halo.push([0, hd.ep, hd.r * 3, VIOLET_HI, 0.5]);
      if (!L3.draw(c, X, Y0, T, items, { light: 'circle', t, alpha: al }, G, INFO)) return false; } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Syllax: copy', e); return false; }
    const F = A.fg(); if (F) { const Q = F.begin(c, null); try { Y.halos(Q, halo, X, Y0, T, al); } finally { F.flush(c); } } return true; }
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); }
  /* ---------- its light on the floor: the sentences' safe lanes and written lines (650, 651), its warnings (the bite's fan and the
     lash's in gold light, 602); the 2D overlay keeps the cracks, the ink pools, the errata's shadows and the labels (M.lbGL) ---------- */
  const SAFE = '#9CFFD8', SAFE2 = '#8EC8FF', LINEC = '#F2DC9A', LINE2 = '#CDB4FF', LASHC = '#FFC27A';
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m, C = FX.C; if (!M || !M.trail || !m) return false; const F = A.fg();
    if (!F || !G.on()) { M.lbGL = false; Y.marked(c, FX, t, T, null); return false; }
    M.lbGL = true; const Q = F.begin(c, null), R = C.R;
    try {
      if (M.lines) { const many = M.lines.length > 1; for (const L of M.lines) { if (L.done) continue; const d = L.d, e = L.e, k = L.run ? 1 : cl(L.t / 0.35), at = (s, o) => [FX.sx(C.x + d[0] * s + e[0] * o), FX.sy(C.y + d[1] * s + e[1] * o)];
          // the Missing Word's lane: from the line to the far rim, bright, its order told by beads
          const s0 = L.run ? Math.max(-R, L.s) : -R, len = R + 1 - s0; if (len > 0.5) { const mid = at(s0 + len / 2, L.gapC), ux = d[0] * len / 2 * T, uy = d[1] * len / 2 * T, hw = L.gapW / 2 * T; Q.quad(650, mid[0], mid[1], ux, uy, e[0] * hw, e[1] * hw, L.order === 2 ? SAFE2 : SAFE, 0.95, k * (0.85 + 0.15 * Math.sin(t * 7)), many ? L.order : 0, len / L.gapW); }
          // the line: written at its start (its way told by chevrons), or sweeping the floor under its wedges
          const sL = L.run ? L.s : -R + 0.5 + (L.order === 2 ? 1.0 : 0), hb = 1.5, hc = R + 1, cq = at(sL + 0.55 * hb, 0); if (!L.run || Math.abs(L.s) < R + 0.5)
            Q.quad(651, cq[0], cq[1], e[0] * hc * T, e[1] * hc * T, d[0] * hb * T, d[1] * hb * T, L.order === 2 ? LINE2 : LINEC, L.run ? 1 : k, L.run ? 1 : cl(L.t / Math.max(0.1, L.delay)), L.gapC / hc, (L.gapW / 2) / hc + 10 * L.order); } }
      for (const s of FX.S.tele) if (s.aur) { const s2 = s.col === '#FF5A78' || s.real ? Object.assign({}, s, { col: LINEC }) : s.col === '#FF9A5A' ? Object.assign({}, s, { col: LASHC }) : s; Y.tell(Q, FX, s2, T, t, 0); }
    } finally { F.flush(c); }
    return false; }
  /* ---------- in the air: the running lines' page wedges (a small pass of their own: pages standing in a row, 941.2), the gap's posts ---------- */
  const GW = A.model('SyllaxWedges', () => { const B = GLM.builder(1), w = 0.25, pts = [[-w, 0], [-w * 0.75, 0.45], [-0.1 * w, 1.0], [w * 0.45, 0.78], [w * 0.85, 0.35], [w, 0]]; B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]); B.prism(pts, -0.03, 0.03, M_PG + 0.2, { b: 0.01 }); B.pop(); return { wedge: Y.copies(B.done(), 120) }; });
  const WINFO = { calls: 0, tris: 0, W: 0, H: 0, ms: 0 };
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M || !M.trail || !M.lbGL || !M.lines) return false; const F = A.fg(); if (!F || !GW.on()) return false; const C = FX.C, R = C.R, WM = GW.MESH.wedge; let n = 0;
    const posts = [];
    for (const L of M.lines) { if (!L.run || L.done || Math.abs(L.s) >= R) continue; const hc = Math.sqrt(R * R - L.s * L.s), Rw = Y.along([L.d[0], L.d[1], 0], [0, 0, 1]);
      for (let o = -hc + 0.25; o < hc - 0.2 && n < 120; o += 0.46) { if (Math.abs(o - L.gapC) < L.gapW / 2) continue; const hsh = Math.sin((Math.round(o * 10) + L.order * 31) * 127.1 + 311.7) * 43758.5453, H = (0.95 + 0.35 * (hsh - Math.floor(hsh))) * (0.92 + 0.08 * Math.sin(t * 14 + o * 3));
        K.place(WM, n++, Rw, [L.d[0] * L.s + L.e[0] * o, L.d[1] * L.s + L.e[1] * o, 0], [1, 1, H]); }
      for (const sd of [-1, 1]) { const o = L.gapC + sd * L.gapW / 2; posts.push([C.x + L.d[0] * L.s + L.e[0] * o, C.y + L.d[1] * L.s + L.e[1] * o, L.order]); } }
    if (!n) return false; for (let i = n; i < 120; i++) K.hide(WM, i); K.commit(WM);
    let ok = false; try { ok = Y.pass(c, FX.sx(C.x), FX.sy(C.y), T, [{ mesh: WM, wear: 0.3 }], { light: 'circle', t, occ: null, outline: 1 }, GW, WINFO); } catch (e) { GW.fail(); }
    if (!ok) return false;
    const Q = F.begin(c, null); try { for (const [x, y, ord] of posts) { const X = FX.sx(x), Yy = FX.sy(y), col = ord === 2 ? SAFE2 : SAFE; Q.glow(X, Yy - T * 0.6, T * 0.9, col, 0.7); Q.rbeam(X, Yy, X, Yy - T * 1.3, T * 0.12, col, 0.9, 1, 0.4); } } finally { F.flush(c); }
    return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { if (G.on() && RIG()) set(L3.lod()); }]; }
  const info = () => Object.assign(L3.info(G, SETS, INFO), { wedges: WINFO });
  return { G, gpu, draw, drawCopy, overlay, drawFx, init, preload, info, get kit() { return A; }, get y3() { return Y; } };
})();
