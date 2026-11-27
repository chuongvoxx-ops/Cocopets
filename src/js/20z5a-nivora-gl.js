/* ---------- (v470 AB, rebuilt v470b AB, v470c AB from the user's concept art, v470d AB upright as the concept) NIVORA THE AURORAWING in three dimensions ----------
   Rift 05's second boss as a sculpted GPU model on AUR3 (20z4a), designed after the user's concept art (an original model of ours). It
   hovers upright, facing us: its head a sphere on top, its armoured body hanging beneath, two tail blades lower, four wings spread to
   the sides in a great X presented to the camera. It bobs and turns a little toward the pet; the fight's own skeleton (its RIG: pose,
   wings, the eye's curve) drives it: its wingbeat flexes and sweeps the wings in the picture's plane, its bank rolls it, its stagger
   drops it with the wings drooping. Its hit areas, moves, timings, tells and damage stay the fight's; the head sits on the fight's eye
   (the weak point) and the rest hangs from it.
   The wings (v470d, after the user's "thinner and not as big": each about 1.3 .. 1.5 times the fight's wing): slim, tapered, pointed
   blades, the upper pair sweeping up and out, the lower pair longer, slimmer and sweeping down and out. Each blade in three bands from
   its root: a dark navy spine along its leading edge, small spikes on it, two ribs out from the root; a fringe of white crystal shards
   (long sharp blades with real bevels, a bright edge and a dark face, a pastel rainbow sheen, sparkle) in overlapping rows pointing out
   along the wing; emerald glass for its outer half and trailing edge (one smooth translucent sheet: its facets and the brighter green
   fracture veins between them are the shader's; it glows from within, its rim bright), a few icicles hanging from its trailing edge.
   The body: a column of layered navy plates pointing down (a raised midrib, edges bevelled to ice, starlike glints), a collar of
   spikes and shards round the neck, a green V glowing on the chest (a smaller one under it). The head: a sphere of black-violet glass
   (stars and the aurora deep inside it, a hard window highlight), one horizontal slit eye glowing green toward us along the fight's own
   opening (its core scans; it narrows, blinks, opens wide when it falls), its bloom and a lens streak. Its glow (FGFX): green halos at
   the glass tips, the eye's flare, ice dust and wind swirling round it (drawFx); feathered, and faded where the pet stands. Where the
   pet stands behind a wing, that wing thins.
   Materials GLM 750..757 (AB2-NIV-MAT in 20k5uz) and 733.6 (a light). Quality: the full meshes on High visual quality; on Balanced /
   Performance (GQ level >= 1) or Fewer effects a lighter set (fewer shards, plates and spikes, coarser grids). Its light on FGFX (kinds
   540..553, AB-FX): its lanes (beads of light for their order, never numbers), the gaze's fan, the frozen rim, the windbreaks as
   curtains of aurora, the crosswind's streaks, the gaze's blade, the swirls. Without the GPU model or the painter the 2D Nivora and its
   effects are drawn as before. */
const NIVORA_GL = (() => {
  const A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vlen, vnrm, vcross, vdot, M3, I3, mv, mm, rotZ, rotY, rotX, hash } = K, lowFx = K.lowFx;
  const M_PLATE = 750, M_CORE = 750.2, M_HEAD = 751, M_SLIT = 752, M_SHARD = 753, M_SPINE = 754, M_GLASS = 755, M_ICICLE = 756, M_BLADE = 757, M_VEE = 750.4, M_LIGHT = 733.6;
  const GREEN = '#78D7B2', GREEN_HI = '#B8F5DA', EMER = '#3CE68A', ICE_HI = '#CFE8F4', EYE = '#DDFBF0', WHITE = '#FFFFFF';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.nivora ? FIEND_DEFS.nivora.RIG : null; } catch (e) { return null; } };
  const G = A.model('Nivora', buildMeshes);
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  /* the level of detail: the full set on High visual quality, the light one on Balanced / Performance or with Fewer effects */
  const hq = () => { if (lowFx()) return false; try { return typeof GQ === 'undefined' || !GQ.level || GQ.level() === 0; } catch (e) { return true; } };
  const RES = { f: { eu: 30, ev: 5, vu: 22, vv: 8 }, l: { eu: 16, ev: 3, vu: 12, vv: 5 } };
  /* the model's own frame (in the fight's units, times its scale): x to its right on the screen, y toward us, z up; the head's centre at 0 */
  const ZM = vnrm([0, -1, 1]), RH = 0.42;   // (its up drawn 1/sqrt 2 along ZM: the fight's picture puts a world point at (x, y - z), so this makes the model's x-z plane the screen's, undistorted: a true front view)
  /* the wings in their own frame (x along the span 0 the root .. 1 the tip, y across: + the leading (upper) edge; span units): slim
     pointed blades. L their length (the fight's wing is 3.25 / 2.95: about 1.32x / 1.5x), root where they leave the body, el their angle
     above the horizontal */
  const WING = { U: { lead: [[0, 0.065], [0.45, 0.068], [0.8, 0.034], [1, 0]], trail: [[0, -0.085], [0.22, -0.13], [0.55, -0.095], [0.82, -0.042], [1, 0]], L: 4.3, root: [0.22, -0.04, -0.62], el: 0.5 },
    D: { lead: [[0, 0.046], [0.5, 0.04], [0.82, 0.019], [1, 0]], trail: [[0, -0.05], [0.25, -0.085], [0.6, -0.058], [0.85, -0.024], [1, 0]], L: 4.45, root: [0.17, -0.08, -0.98], el: -0.52 } };
  const lin = (P, s) => { for (let i = 0; i < P.length - 1; i++) if (s <= P[i + 1][0]) { const u = (s - P[i][0]) / Math.max(1e-6, P[i + 1][0] - P[i][0]); return lerp(P[i][1], P[i + 1][1], u); } return P[P.length - 1][1]; };
  const ss = u => u * u * (3 - 2 * u);
  /* the body's column (round the model's z, from the neck at -0.28 down to its point at -2.62): its radius, eased between these */
  const PROF = [[-0.28, 0.16], [-0.55, 0.3], [-0.95, 0.47], [-1.35, 0.4], [-1.7, 0.27], [-2.0, 0.22], [-2.35, 0.13], [-2.62, 0.03]];
  function rad(z) { for (let i = 0; i < PROF.length - 1; i++) if (z >= PROF[i + 1][0]) { const u = (PROF[i][0] - z) / (PROF[i][0] - PROF[i + 1][0]); return lerp(PROF[i][1], PROF[i + 1][1], ss(cl(u))); } return PROF[PROF.length - 1][1]; }
  function bodyAt(z, ph) { const r = rad(z), dr = (rad(z + 0.02) - rad(z - 0.02)) / 0.04, c = Math.cos(ph), s = Math.sin(ph); return { p: [r * c, r * s * 0.86, z], n: vnrm([c, s / 0.86, -dr]) }; }
  const chestPt = (x, z, o) => [x, 0.86 * Math.sqrt(Math.max(0, rad(z) * rad(z) - x * x)) + (o == null ? 0.07 : o), z];
  function buildSet(q0, sfx) { const light = !!sfx, nb = () => GLM.builder(q0), out = {}, q = n => Math.max(3, Math.round(n * q0)), fin = (k, B) => { out[k + sfx] = B.done(); };
    /* ---- a wing (U the upper pair, D the lower): the glass, then its shards, spines and icicles ---- */
    for (const key of ['U', 'D']) { const Wd = WING[key], up = key === 'U', j = (a, b) => hash(a * 13.7 + b * 5.1 + (up ? 0 : 91)), at = (s, tq) => lerp(lin(Wd.trail, s), lin(Wd.lead, s), tq);
      // (c) the emerald glass: one smooth sheet, a slight camber (its facets, veins and colour are the shader's: vA.y its rim, vA.z across it 0 the trailing edge .. 1 the leading)
      { const B = nb(); B.surf((u, v) => [u, at(u, v), 0.008 * Math.sin(Math.PI * v) * (1 - u)], light ? 14 : 26, light ? 3 : 6, () => M_GLASS + (up ? 0 : 0.1), { e: (u, v) => Math.max(Math.abs(v * 2 - 1), cl((u - 0.94) / 0.06)), a: (u, v) => v }); fin('glass' + key, B); }
      const C = nb();
      // (b) the white crystal shards: rows layered like feathers over the inner part, pointing out along the wing (fanning toward the trailing edge), each a long sharp blade with a ridge toward us
      const rows = light ? [[0.0, 4], [0.09, 4], [0.18, 3], [0.27, 3]] : [[0.0, 6], [0.07, 6], [0.14, 5], [0.21, 5], [0.28, 4], [0.36, 3]];
      rows.forEach(([s0, n], ri) => { for (let i = 0; i < n; i++) { const tq = cl((i + 0.5 + (j(ri, i) - 0.5) * 0.4) / n), s = s0 + 0.02 * j(i, ri), len = (up ? 0.22 : 0.19) * (1 - ri * 0.1) * (0.8 + 0.4 * j(i + 5, ri)), base = [s, at(s, tq), 0.024 + 0.006 * (rows.length - ri)], dir = vnrm([1, lerp(-0.5, 0.1, tq) * (up ? 1 : 0.75), 0.05]);
          C.crystal(base, vadd(base, vmul(dir, len)), len * 0.14, M_SHARD, { n: 4, thin: 0.85, seed: i * 1.9 + ri * 7 + (up ? 0 : 3), belly: 0.24, jit: 0.15, rot: 0, up: [0, 0, 1] }); } });
      // the jagged white edge under the spine, further out
      const ne = light ? 4 : 8; for (let i = 0; i < ne; i++) { const s = lerp(0.28, 0.74, i / (ne - 1)), base = [s, lin(Wd.lead, s) - 0.008, 0.02], len = (up ? 0.07 : 0.06) * (1 - s * 0.5) * (0.8 + 0.4 * j(i, 33));
        C.crystal(base, vadd(base, vmul(vnrm([1, 0.42, 0.03]), len)), len * 0.2, M_SHARD, { n: 4, thin: 0.85, seed: i * 3.1 + 5, belly: 0.3, rot: 0, up: [0, 0, 1] }); }
      // (a) the navy spine along the leading edge, spikes on it; two ribs out from the root through the shards
      const sp = [0, 0.2, 0.45, 0.7, 0.9].map(s => [s, lin(Wd.lead, s) * 0.97, 0.032]), rs = s => lerp(0.012, 0.004, s);
      for (let i = 0; i < sp.length - 1; i++) C.tube(sp[i], sp[i + 1], rs(sp[i][0]), rs(sp[i + 1][0]), M_SPINE, { seg: q(7), cap0: 'round', cap1: false });
      const nk = light ? 3 : 6; for (let i = 0; i < nk; i++) { const s = lerp(0.1, 0.74, i / (nk - 1)), b = [s, lin(Wd.lead, s) * 0.97, 0.032], len = 0.045 * (1 - s * 0.45);
        C.crystal(b, vadd(b, vmul(vnrm([0.75, 0.66, 0.04]), len)), 0.008, M_SPINE, { n: 4, seed: s * 9, thin: 0.6 }); }
      for (const [s1, tq] of (up ? [[0.46, 0.62], [0.4, 0.3], [0.3, 0.02]] : [[0.44, 0.5], [0.3, 0.06]])) { const a = [0.0, at(0, tq) * 0.4, 0.038], b = [s1, at(s1, tq), 0.038], m2 = vadd(vmul(vadd(a, b), 0.5), [0, 0.006, 0]); C.tube(a, m2, 0.012, 0.007, M_SPINE, { seg: q(6), cap0: 'round', cap1: false }); C.tube(m2, b, 0.007, 0.002, M_SPINE, { seg: q(6), cap0: 'round', cap1: false }); }
      // icicles hanging from the trailing edge of the glass
      const ni = light ? 2 : 4; for (let i = 0; i < ni; i++) { const s = lerp(0.45, 0.9, (i + 0.5) / ni), base = [s, lin(Wd.trail, s) + 0.004, -0.002], len = 0.025 + 0.03 * j(i, 77);
        C.crystal(base, vadd(base, vmul(vnrm([0.15, -1, -0.1]), len)), 0.006, M_ICICLE, { n: 4, seed: i * 2.3, belly: 0.15 }); }
      fin('shards' + key, C); }
    /* ---- the body: its dark core, the plates hanging down it, the collar, the V on its chest ---- */
    { const B = nb(); B.surf((u, v) => bodyAt(lerp(-0.28, -2.62, u), v * TAU).p, q(30), q(22), () => M_CORE, {}); fin('core', B); }
    { const B = nb(), petal = (o, xa, ya, za, L, Wp) => { B.push(vmul(xa, L), vmul(ya, Wp), vmul(za, L * 0.5), o);
        B.surf((u, v) => { const vv = v * 2 - 1, w = Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.95)), 0.75) * (1 - 0.35 * u * u); return [u, vv * w * 0.5, 0.16 * (1 - vv * vv) * (0.4 + 0.6 * w) + u * 0.05]; }, q(7), q(5), () => M_PLATE, { flip: false, e: (u, v) => Math.abs(v * 2 - 1), a: (u) => u }); B.pop(); };
      const rings = light ? [[-0.6, 0.42, 5], [-1.0, 0.46, 6], [-1.4, 0.42, 6], [-1.8, 0.36, 5], [-2.2, 0.3, 4]] : [[-0.52, 0.38, 7], [-0.78, 0.42, 8], [-1.03, 0.44, 8], [-1.28, 0.42, 8], [-1.53, 0.4, 7], [-1.78, 0.36, 7], [-2.03, 0.32, 6], [-2.28, 0.28, 5], [-2.5, 0.22, 4]];
      rings.forEach(([z, L, n], ri) => { for (let k = 0; k < n; k++) { const ph = -0.55 + (k + (ri % 2) * 0.5) / n * (Math.PI + 1.1), P = bodyAt(z, ph), nn = P.n, t = vnrm(vsub([0, 0, -1], vmul(nn, -nn[2]))), xa = vnrm(vadd(t, vmul(nn, 0.22))), za = vnrm(vsub(nn, vmul(xa, vdot(nn, xa)))), ya = vcross(za, xa);
          petal(vsub(P.p, vmul(nn, 0.03)), xa, ya, za, L, L * 0.6); } });
      // the collar: spikes and shards round the neck, the sides' sweeping up and out
      const nc = light ? 6 : 11; for (let k = 0; k < nc; k++) { const ph = lerp(-0.5, Math.PI + 0.5, k / (nc - 1)), P = bodyAt(-0.44, ph), c = Math.cos(ph), dir = vnrm([c, Math.sin(ph) * 0.6, 0.15 + 0.4 * Math.abs(c)]), len = 0.5 + 0.34 * Math.abs(c);
        B.crystal(P.p, vadd(P.p, vmul(dir, len)), len * 0.17, k % 3 === 1 ? M_SHARD : M_SPINE, { n: 4, thin: 0.7, seed: k * 2.7, belly: 0.3, up: P.n }); }
      fin('plates', B); }
    { const B = nb(), arm = (x0, z0, x1, z1, r) => { const n = 4; for (let i = 0; i < n; i++) { const a = chestPt(lerp(x0, x1, i / n), lerp(z0, z1, i / n)), b = chestPt(lerp(x0, x1, (i + 1) / n), lerp(z0, z1, (i + 1) / n)); B.tube(a, b, r, r, M_VEE, { seg: q(6), cap0: 'round', cap1: 'round' }); } };
      for (const sg of [-1, 1]) { arm(sg * 0.25, -0.98, 0, -1.42, 0.03); arm(sg * 0.15, -1.6, 0, -1.86, 0.02); } fin('seams', B); }
    /* the head: a sphere of glass (radius 1, scaled; its local x its gaze); written every frame: the eye slit, the two tail blades */
    { const B = nb(); B.sph([0, 0, 0], 1, M_HEAD, q(46)); fin('head', B); }
    const R = RES[light ? 'l' : 'f']; out['eye' + sfx] = A.grid(R.eu, R.ev, M_SLIT, (u, v) => u, (u, v) => v);
    for (let k = 0; k < 2; k++) out['blade' + k + sfx] = A.grid(R.vu, R.vv, M_BLADE, (u, v) => v, (u, v) => u);
    { const B = nb(); B.sph([0, 0, 0], 1, M_LIGHT, q(10)); fin('glowball', B); }
    return out; }
  function buildMeshes() { return Object.assign(buildSet(1, ''), buildSet(0.6, '_l')); }
  /* the whole creature posed from the fight's skeleton: the model's frame (Rm), its head's centre (hc), its wings' frames */
  function rigOf(FX, m, M) { const R0 = RIG(), p = R0.pose(FX, m, M), S = p.S, st = p.st, bt = p.bt, pk = M.passK || 0, unf = M.unfold == null ? 1 : M.unfold, Wg = R0.wings(FX, m, M, p);
    const yaw = 0.3 * Math.cos(p.th), roll = Math.max(-0.35, Math.min(0.35, (M.roll || 0) * 0.6)) + Math.sin(bt * 0.9) * 0.03, pitch = -0.1 * pk + Math.sin(bt * 1.3 + 0.6) * 0.03 + st * 0.55;   // (fallen: it slumps forward, its column swinging up toward us off the stone)
    const Rm = mm(M3([1, 0, 0], A.PD, vmul(ZM, Math.SQRT1_2)), mm(rotZ(yaw), mm(rotY(roll), rotX(pitch)))), fw = mv(Rm, [0, 1, 0]), eW = R0.eyeWorld(FX, m, M), r = RH * S;
    const hc = vsub(eW, vmul(fw, r));   // (the head on the fight's eye: the fight's own altitude (it drops when it falls))
    const toW = v => vadd(hc, vmul(mv(Rm, v), S));
    const wf = Wg.map((w, k) => { const key = w.f ? 'U' : 'D', Wd = WING[key], xs = -w.s, beat = M.beat || 0, om = lerp(2.1, 8.0, beat), amp = lerp(0.3, 1.05, beat) * (1 - st * 0.85) * (1 - pk * 0.5), flap = amp * Math.sin(bt * om + (w.f ? 0 : Math.PI * 0.55) + (w.s > 0 ? 0.25 : 0)) + (M.recoil || 0) * 0.4 * (w.f ? 1 : -1);   // (the fight's own wingbeat (its wings())
      let el = Wd.el + flap * 0.28 + (w.f ? 0.15 : -0.15) * pk - (w.f ? 0.55 : 0.22) * st; el = lerp(w.f ? 1.25 : -1.3, el, unf);
      const tw = flap * 0.22, ce = Math.cos(el), se = Math.sin(el), x = [xs * ce, 0, se], y0 = [-xs * se, 0, ce], z0 = [0, 1, 0], ct = Math.cos(tw), st2 = Math.sin(tw), y = vadd(vmul(y0, ct), vmul(z0, st2)), z = vsub(vmul(z0, ct), vmul(y0, st2));
      const Rw = M3(mv(Rm, x), mv(Rm, y), mv(Rm, z)), root = toW([xs * Wd.root[0], Wd.root[1], Wd.root[2]]), Lw = Wd.L * lerp(0.35, 1, unf) * S;
      return { key, k, root, R: Rw, X: Rw.x, Y: Rw.y, Lw, at: (s, yy) => vadd(root, vadd(vmul(Rw.x, s * Lw), vmul(Rw.y, yy * Lw))) }; });
    return { R0, p, S, Rm, hc, r, toW, wf, fw, unf }; }
  /* the whole aurorawing, posed: its parts (relative to (ox, oy)); returns what its glow is laid at */
  function listOf(FX, m, M, ox, oy, L, o, Rg) { const { R0, p, S, Rm, hc, r, toW, wf, fw } = Rg, rel = q => [q[0] - ox, q[1] - oy, q[2]], gl2 = o.flash ? 1 : 0, al = o.al == null ? 1 : o.al, menace = M.menace || 0, unf = Rg.unf;
    const sf = hq() ? '' : '_l', R = RES[sf ? 'l' : 'f'], MS = k => G.MESH[k + sf], bt = p.bt, glowW = 0.5 + menace * 0.5 + (M.passK || 0) * 0.4 + p.st * 0.3, out = { p, S, wf, tips: [], Rg };
    const ho = rel(hc);
    L.push({ part: 'core' + sf, R: Rm, o: ho, s: S, glow2: gl2, al });
    L.push({ part: 'plates' + sf, R: Rm, o: ho, s: S, glow2: gl2, al, wear: 0.4 });
    L.push({ part: 'seams' + sf, R: Rm, o: ho, s: S, glow: 0.8 + menace * 0.6, al, outline: false });
    // the head of glass (its local x its gaze, toward us), its eye slit laid on it, opening as the fight's eye does
    const eg = 0.55 + menace * 0.4 + p.st * 0.5 + (M.beamK || 0) * 0.5, Rh = M3(fw, mv(Rm, [-1, 0, 0]), mv(Rm, [0, 0, 1]));
    L.push({ part: 'head' + sf, R: Rh, o: ho, s: r, glow: eg, glow2: gl2, al, wear: 0.2 });
    { const E = R0.eyeCurve(M, p), scan = cl(((M.scan || 0) + 1.45) / 2.9), NU = R.eu, NV = R.ev, op = E.open;
      A.regrid(MS('eye'), (i, j) => { const ph = (i / NU * 2 - 1) * 0.95, hh = op * 0.55 * Math.cos(ph * 1.25) + 0.012, th = -0.04 + (j / NV * 2 - 1) * hh, d = [-Math.cos(th) * Math.sin(ph), Math.cos(th) * Math.cos(ph), Math.sin(th)], q = vadd(hc, vmul(mv(Rm, d), r * 1.012));
        return [q[0] - ox, q[1] - oy, q[2]]; }, false);
      L.push({ part: 'eye' + sf, R: I3(), o: [0, 0, 0], glow: eg, spill: scan, al, outline: false }); out.eye = vadd(hc, vmul(fw, r * 1.02)); out.eg = eg; }
    // the tail blades: long dark shards hanging from the column's point, swaying, their points green glass
    for (let k = 0; k < 2; k++) { const ang = (k ? -0.08 : -0.3) + Math.sin(bt * 1.2 + k * 1.7) * 0.07 + (M.roll || 0) * 0.35 - (M.passK || 0) * 0.2, Lt = k ? 1.5 : 1.75, d = [Math.sin(ang), 0.06, -Math.cos(ang)], nv = [Math.cos(ang), 0, Math.sin(ang)], b0 = [k ? 0.03 : -0.03, -0.02, -2.42];
      const ax = u => vadd(b0, vadd(vmul(d, u * Lt), vmul(nv, Math.sin(bt * 1.5 + k - u * 1.5) * 0.06 * u))), wd = u => (u < 0.55 ? lerp(0.04, 0.2, u / 0.55) : lerp(0.2, 0.0, (u - 0.55) / 0.45)) + 0.006, tk = u => 0.035 * (1 - u) + 0.012;
      A.regrid(MS('blade' + k), (i, j) => { const u = i / R.vu, th = j / R.vv * TAU, qq = toW(vadd(ax(u), vadd(vmul(nv, wd(u) * Math.cos(th)), [0, tk(u) * Math.sin(th), 0]))); return [qq[0] - ox, qq[1] - oy, qq[2]]; }, false);
      L.push({ part: 'blade' + k + sf, R: I3(), o: [0, 0, 0], glow: 0.6 + menace * 0.6, glow2: gl2, al }); out.tips.push(toW(ax(0.9))); }
    // the wings: the glass sheet, its shards, spines and icicles in front of it
    wf.forEach((F, k) => { const o2 = rel(F.root), wal = (o.wal ? o.wal[k] : 1) * al * Math.min(1, 0.35 + unf);
      L.push({ part: 'glass' + F.key + sf, R: F.R, o: o2, s: F.Lw, glow: glowW, kind: k, al: 0.99 * wal, glow2: gl2, outline: false });
      L.push({ part: 'shards' + F.key + sf, R: F.R, o: o2, s: F.Lw, glow: glowW * 0.6, al: wal < 0.98 ? 0.99 * wal : al, glow2: gl2, outline: false }); });
    return out; }
  /* where the pet stands behind a wing (on the screen), that wing thins: each wing's share 0.42 .. 1 */
  function thinOf(FX, Rg) { const me = FX.me; if (!me || !FX.S || !FX.S.started) return null; const px = me.x, py = me.y - 0.6;
    return Rg.wf.map(F => { const Wd = WING[F.key], pts = Wd.lead.concat(Wd.trail.slice().reverse()).map(([s, y]) => { const q = F.at(s, y); return [q[0], q[1] - q[2]]; });
      let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside; }
      return inside ? 0.42 : 1; }); }
  /* the boss: its shadow and glow under it, one pass, its flare over it */
  function drawBoss(c, FX, m, X, Y, T, t) { if (!gpu()) return false; const M = FX.mem || {}, L = [], fl = m.flash > 0, lf = lowFx();
    let O; try { const Rg = rigOf(FX, m, M), wal = thinOf(FX, Rg); M.wal = M.wal || [1, 1, 1, 1]; if (wal) for (let i = 0; i < 4; i++) M.wal[i] += (wal[i] - M.wal[i]) * 0.2; O = listOf(FX, m, M, m.x, m.y, L, { flash: fl, wal: wal ? M.wal : null }, Rg); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Nivora: pose', e); return false; }
    const p = O.p, Rg = O.Rg, k = 1 / (1 + p.z * 0.1), sc = q => [X + (q[0] - m.x) * T, Y + (q[1] - m.y) * T - q[2] * T], unf = Rg.unf, menace = M.menace || 0, F = A.fg();
    M.nvC = Rg.toW([0, 0, -1.2]); M.nvS = p.S;   // (where drawFx's swirls turn round it)
    { const P2 = [sc(vadd(Rg.hc, vmul(mv(Rg.Rm, [0, 0, 1]), Rg.r * 1.6)))].concat(O.wf.map(W2 => sc(W2.at(1, 0))), O.tips.map(sc)); M.nvBox = [Math.min(...P2.map(q => q[0])), Math.min(...P2.map(q => q[1])), Math.max(...P2.map(q => q[0])), Math.max(...P2.map(q => q[1])), T]; }   // (its box on the screen: the wing tips, the head, the tail's points)
    // feathered: a glow fades where the pet stands under it
    const me = FX.me, pq = me ? [X + (me.x - m.x) * T, Y + (me.y - m.y) * T - T * 0.6] : null, pf = (q, R) => pq ? cl((Math.hypot(q[0] - pq[0], q[1] - pq[1]) - R * 0.35 - T * 0.6) / (T * 2.2)) : 1;
    // its shadow on the stone, under the column and the wings
    { const g = M.nvC; FX.K.shade(c, X + (g[0] - m.x) * T, Y + (g[1] - m.y) * T, T * 2.2 * k, T * 0.8 * k, 0.38, '#0A1426'); FX.K.shade(c, X + (g[0] - m.x) * T, Y + (g[1] - m.y) * T, T * 5.2 * p.S * k, T * 1.3 * k, 0.13, '#0A1426'); }
    // the green halos round the wings' glass, under the model
    if (F) { const Q = F.begin(c, null); try { O.wf.forEach((W2, i) => { const a = (M.wal ? M.wal[i] : 1) * unf, q1 = sc(W2.at(0.72, -0.03)), R1 = T * W2.Lw * 0.26;
        Q.glow(q1[0], q1[1], R1, EMER, (lf ? 0.14 : 0.2) * a * (0.8 + 0.2 * Math.sin(t * 2 + i)) * (0.8 + menace * 0.3) * pf(q1, R1)); }); } finally { F.flush(c); } }
    const ok = A.passOf(c, X, Y, T, L, { t: M.bt || t, light: 'obs', flash: fl ? 1 : 0 }, G); if (!ok) return false;
    // the flare over it: the eye's light and its lens streak, the glass tips, the tail blades' points
    if (F) { const Q = F.begin(c, null); try { const e = sc(O.eye), eg = O.eg, fe = pf(e, T * 1.4), xr = sc(vadd(O.eye, mv(Rg.Rm, [1, 0, 0]))), dx = xr[0] - e[0], dy = xr[1] - e[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, ext = T * (1.3 + eg * 0.7);
        Q.glow(e[0], e[1], T * 1.0, GREEN, Math.min(0.5, eg * 0.28) * fe); Q.glow(e[0], e[1], T * 0.45, EYE, Math.min(1, eg * 0.6));
        Q.beam(e[0] - ux * ext * 1.6, e[1] - uy * ext * 1.6, e[0] + ux * ext * 1.6, e[1] + uy * ext * 1.6, Math.max(1, T * 0.14), GREEN, Math.min(0.4, 0.14 + eg * 0.12) * fe);
        Q.beam(e[0] - ux * ext, e[1] - uy * ext, e[0] + ux * ext, e[1] + uy * ext, Math.max(1, T * 0.045), GREEN_HI, Math.min(0.95, 0.4 + eg * 0.3) * fe); Q.star(e[0], e[1], T * 0.3, Math.min(1, 0.4 + eg * 0.3) * fe, WHITE);
        O.wf.forEach((W2, i) => { const q = sc(W2.at(0.96, 0)), a = 0.3 * unf * (M.wal ? M.wal[i] : 1); Q.glow(q[0], q[1], T * 0.55, EMER, a * pf(q, T * 0.55)); Q.glow(q[0], q[1], T * 0.18, GREEN_HI, a * 1.4 * pf(q, T * 0.2)); });
        for (const tp of O.tips) { const q = sc(tp); Q.glow(q[0], q[1], T * 0.5, EMER, 0.4 * unf * pf(q, T * 0.5)); } } finally { F.flush(c); } }
    return true; }
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
      if (!m.dead) { const p = R0.pose(FX, m, M), unf = M.unfold == null ? 1 : M.unfold, menace = M.menace || 0;
        // (v470c AB) ice dust and wind swirling round it, as the concept's (fewer with Fewer effects)
        const C0 = M.nvC || [m.x, m.y, p.z * 0.8], me = FX.me, nS = lf ? 1 : 3;   // (v470d AB: round the upright body; faded where the pet stands)
        for (let i = 0; i < nS; i++) { const a = i / nS * TAU + (M.bt || t) * 0.25, rr = 3.4 * p.S, cx = C0[0] + Math.cos(a) * rr, cy = C0[1] + Math.sin(a) * rr * 0.35, z = C0[2] + Math.sin(a * 2 + 1) * 0.8, R = T * (1.8 + 0.4 * i) * p.S, X2 = sx([cx, cy, z]), Y2 = sy([cx, cy, z]), fp = me ? cl((Math.hypot(X2 - FX.sx(me.x), Y2 - FX.sy(me.y) + T * 0.6) - R * 0.4) / (T * 2)) : 1;
          Q.quad(553, X2, Y2, R, 0, 0, R * 0.55, ICE_HI, (0.55 + 0.3 * menace + 0.3 * (M.beat || 0)) * unf * fp, 1, i * 3.7 + 1, 0); }
        const e = R0.eyeWorld(FX, m, M), gl = 0.5 + (M.menace || 0) * 0.4 + p.st * 0.5 + (M.beamK || 0) * 0.5; void gl;   // (v470b AB: the eye's bloom is laid with the model, in drawBoss)
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
