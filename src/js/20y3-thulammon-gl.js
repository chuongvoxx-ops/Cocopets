/* ---------- (v433 DB) THUL-AMMON THE SAND KRAKEN in three dimensions (Rift 03, the last boss: The Pit Beneath the Jaw) ----------
   The 2D kraken of 20y-rift-fiend-dunes-3.js rebuilt as a GPU model at the Drowned Belfry's fidelity, on DUNE3 (20y2): GLM meshes
   built once and posed every frame, its arms rewritten every frame along the fight's own arm paths, all in one pass cut at the sand
   (what is under it is not drawn: the head rises out of the Pit and sinks into it, the arms erupt from it and go back under); its
   materials GLM 364, 370..375 (DB-DUNE-MAT, 20k5uz), the light of its moves on the FGFX painter (kinds 264..271, DB-FX in 20k6h).
   The fight keeps its acts, timings, shapes and damage; its warnings are light on the sand. Without WebGL (or on a software
   rasteriser, unless window.__DB_GL) the 2D kraken is drawn as before; without the painter its effects are the old 2D ones.
   The model (tiles, z up from the sand, x east, y south, the view turned so the head faces the camera): a great dome of wrinkled
   violet-grey hide half out of the sand, mottled, wet, its foot crusted with sand, bone barnacles over its crown; in its front one
   huge amber eye with a horizontal pupil, set in a socket under a heavy brow, a lid above and below (hooded at rest, narrowing
   before a blow, blinking, flung wide when it sinks), the head turning a little to follow the pet; sand heaped round it. Eight
   arms (two asleep till the second phase), each a tube of hide rewritten along its path every frame, pale beneath with two rows
   of suckers down its underside, a hooked bone tip that splits into a two-pronged grip when it grasps, a ring of sand mounded
   where it breaks the surface; the arms rise out of the sand, sway and curl, rear back glowing amber at the tip before a sweep,
   curl high over a mark and come down with overshoot, lie along their lines, sink back under. The anchors are knots of violet flesh
   pinned by three ivory discs, amber veins pulsing; the ink a glossy black blob; the Sandfall's teeth curved bone fangs. */
const THUL_GL = (() => {
  const D3 = DUNE3, K = GB_KIT, { TAU, cl, lerp, sstep, ease, GY, ZK, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv, mm, rotX, rotY, rotZ, frameXZ, hash, headOf } = K, lowFx = K.lowFx;
  const M_SAND = 364, M_HIDE = 370, M_LID = 370.2, M_EYE = 371, M_ARM = 372, M_ARM_RIM = 372.2, M_ARM_CUP = 372.4, M_BONE = 373, M_INK = 374, M_KNOT = 375;
  const AMBER = '#E8A33A', AMBER_HI = '#FFD27A', VIOLET = '#4A3A5C', VIOLET_HI = '#9C86B4', BONE_HI = '#FBF4E0', OCHRE = '#CDA15E', OCHRE_HI = '#EBC98A', DUST = '#8A6A44', INKC = '#140C1C';
  const NT = 8, DX = 2.5 / GY, DY = 3.9, DZ = 1.8 / ZK, TH_E = 1.18, EYE_C = [2.55, 0, 0.95], EYE_R = 1.6;
  const ANU = 30, ANV = 14, NSK = 18;
  const TH = D3.model('Thul-Ammon', buildMeshes);
  const sq = x => x * x;
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(3, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    const eD = vnrm([Math.sin(TH_E), 0, Math.cos(TH_E)]);
    /* the hide's shape (v433 DB, second pass): deep folds radiating from the crown (wandering, sharper toward the sides), wrinkles across
       them low on the flanks, a deep socket for the eye and a heavy ridged brow over it */
    const domeF = (ph, th) => { const s = Math.sin(th), d = [s * Math.cos(ph), s * Math.sin(ph), Math.cos(th)], dl = Math.acos(Math.max(-1, Math.min(1, vdot(d, eD)))), pa = Math.atan2(Math.sin(ph), Math.cos(ph));
      const rad = Math.pow(0.5 + 0.5 * Math.cos(ph * 11 + 0.7 * Math.sin(th * 3.1 + ph * 2)), 5) * sstep(0.15, 0.6, th), cross = Math.pow(0.5 + 0.5 * Math.sin(th * 15 + 0.4 * Math.sin(ph * 5)), 4) * sstep(0.9, 1.6, th);
      const brow = Math.exp(-sq((th - (TH_E - 0.62)) / 0.13)) * Math.exp(-sq(pa / 0.75)) * (1 + 0.25 * Math.cos(pa * 9)), sock = Math.exp(-sq(dl / 0.5));
      const crease = Math.pow(0.5 + 0.5 * Math.cos(ph * 11 + 0.7 * Math.sin(th * 3.1 + ph * 2) + Math.PI), 9) * sstep(0.12, 0.5, th);
      return 1 + 0.06 * rad - 0.09 * crease + 0.022 * cross + 0.018 * Math.sin(ph * 23 + th * 7) * s - 0.36 * sock + 0.2 * brow; };
    /* ---- the head: the dome (head frame: x its front), clusters of barnacles with open plates ---- */
    { const B = nb();
      B.surf((u, v) => { const ph = u * TAU, th = v * 2.25, s = Math.sin(th), f = domeF(ph, th); return [DX * s * Math.cos(ph) * f, DY * s * Math.sin(ph) * f, DZ * Math.cos(th) * f]; }, q(110), q(44), () => M_HIDE,
        { e: (u, v) => { const ph = u * TAU, th = v * 2.25; return Math.pow(0.5 + 0.5 * Math.cos(ph * 11 + 0.7 * Math.sin(th * 3.1 + ph * 2) + Math.PI), 9) * sstep(0.12, 0.5, th); }, a: (u, v) => v, flip: true });
      // a barnacle: a ring of six plates round its open mouth (its own frame: z out of the hide), the plates parted at the top, dark inside
      const barn = (p, nn, k, sd) => { const x2 = vnrm(vcross(nn, Math.abs(nn[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), y2 = vcross(nn, x2); B.push(vmul(x2, k), vmul(y2, k), vmul(nn, k), p);
        B.surf((u, v) => { const a = v * TAU + sd, h = u, lob = 1 + 0.16 * Math.pow(Math.abs(Math.cos(a * 3)), 2), r = (0.3 - 0.14 * h) * lob, top = h > 0.85 ? 0.12 * (1 - Math.abs(Math.cos(a * 3))) : 0; return [Math.cos(a) * r, Math.sin(a) * r, h * 0.36 - top]; }, q(5), q(18), () => M_BONE, { e: u => u, a: u => u, flip: true });
        B.ell([0, 0, 0.3], [0.14, 0.14, 0.05], M_INK, { seg: q(10), rings: 3 }); B.pop(); };
      const CL = [[0.15, 0.4, 5], [1.3, 0.75, 4], [-1.4, 0.7, 4], [2.6, 1.05, 3], [-2.5, 1.0, 3], [3.4, 0.55, 4]];
      CL.forEach(([ph0, th0, nk], ci) => { for (let i = 0; i < nk; i++) { const ph = ph0 + (hash(ci * 7 + i) - 0.5) * 0.45, th = th0 + (hash(ci * 11 + i * 3) - 0.5) * 0.3, s = Math.sin(th), f = domeF(ph, th), p = [DX * s * Math.cos(ph) * f, DY * s * Math.sin(ph) * f, DZ * Math.cos(th) * f];
        const nn = vnrm([p[0] / (DX * DX), p[1] / (DY * DY), p[2] / (DZ * DZ)]); barn(vsub(p, vmul(nn, 0.04)), nn, 0.7 + 0.6 * hash(ci * 5 + i * 13), hash(i * 2.3) * 3); } });
      fin('dome', B); }
    { const B = nb(); B.sph([0, 0, 0], 1, M_EYE, q(30)); fin('eye', B); }
    /* the lids: heavy, wrinkled shells of hide (upper and lower), their rims rolled thick */
    const lid = (th0, th1, R) => { const B = nb(); B.surf((u, v) => { const th = th0 + (th1 - th0) * v, ph = -Math.PI / 2 + u * Math.PI, fold = 1 + 0.035 * Math.sin(v * 22 + Math.sin(u * 7) * 0.6) + 0.05 * sstep(0.8, 1, th0 < 1 ? v : 1 - v), rr = R * fold; return [Math.sin(th) * Math.cos(ph) * rr, Math.sin(th) * Math.sin(ph) * rr * 1.04, Math.cos(th) * rr]; }, q(18), q(12), () => M_LID, { e: (u, v) => 0.5 + 0.5 * Math.sin(v * 22), a: u => u, flip: true }); return B.done(); };
    out.lidU = lid(0, 1.66, 1.13); out.lidL = lid(1.9, Math.PI, 1.1);
    /* the sand heaped round the head (unit footprint), a crater round an arm's root: a raised lip, the throat dark, sand spilled round it */
    { const B = nb(); B.surf((u, v) => { const ph = u * TAU, s2 = v, rad = 0.86 + 0.5 * s2, h = 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(s2, 0.85)), 1.3) * (1 + 0.25 * Math.sin(ph * 7 + 1.3) + 0.15 * Math.sin(ph * 13)); return [Math.cos(ph) * rad, Math.sin(ph) * rad, h - 0.1]; }, q(56), q(8), () => M_SAND, { e: () => 0, a: (u, v) => v, flip: true }); fin('heap', B); }
    { const B = nb(); B.surf((u, v) => { const ph = u * TAU, s2 = v, rad = 0.3 + 1.35 * s2, h = 0.62 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow(s2, 0.6) * 1.05)), 1.4) * (1 + 0.28 * Math.sin(ph * 5 + 0.7) + 0.14 * Math.sin(ph * 11)) - 0.55 * Math.pow(Math.max(0, 1 - s2 * 2.2), 1.5); return [Math.cos(ph) * rad, Math.sin(ph) * rad, h]; }, q(32), q(9), () => M_SAND, { e: () => 0, a: (u, v) => v * 1.4, flip: true });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + hash(i * 3.3) * 0.6, d = 1.55 + 0.5 * hash(i * 7.1), k = 0.12 + 0.12 * hash(i * 5.7); B.ell([Math.cos(a) * d, Math.sin(a) * d, -0.04], [k * 1.8, k * 1.4, k * 0.45], M_SAND, { seg: 8, rings: 4 }); }
      fin('mound', B); }
    /* the arms: tubes rewritten every frame along their paths (vA.y along, vA.z round: 0.75 underneath) */
    for (let k = 0; k < NT; k++) { const B = nb(); B.surf((u, v) => [u * 6, Math.cos(v * TAU) * 0.4, Math.sin(v * TAU) * 0.4 + 1], ANU, ANV, () => M_ARM, { e: u => u, a: (u, v) => v, flip: true }); fin('arm' + k, B); }
    /* the suckers, two staggered rows down each arm's underside: many copies of one cup (a raised rim, a dark cup), placed every frame */
    { const B = nb(); B.lathe([[0, 0.5, M_ARM_RIM], [0.22, 0.55, M_ARM_RIM], [0.34, 0.46, M_ARM_RIM], [0.3, 0.3, M_ARM_RIM], [0.3, 0.3, M_ARM_CUP], [0.12, 0.2, M_ARM_CUP], [0.06, 0.0, M_ARM_CUP]], M_ARM_RIM, { seg: q(10) }); out.suckers = K.multi(B.done(), NT * NSK); }
    /* an arm's bone tip: a hooked, ridged prong (two make the grip) */
    { const B = nb(); D3.tubeC(B, u => [u * 0.95, 0, 0.12 * u * u], u => (0.21 * Math.pow(1 - u, 0.85) + 0.008) * (1 + 0.14 * Math.pow(0.5 + 0.5 * Math.cos(u * TAU * 5), 4) * (1 - u)), M_BONE, q(16), q(8)); fin('prong', B); }
    /* an anchor: a knot of tentacle pinned to the sand by three bone stakes with discs, its two ends running into the sand */
    { const B = nb(), knot = u => { const t = u * TAU; return [(Math.sin(t) + 2 * Math.sin(2 * t)) * 0.24, (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.24, 0.32 - Math.sin(3 * t) * 0.17]; };
      D3.tubeC(B, knot, u => 0.17 * (1 + 0.08 * Math.sin(u * TAU * 9)), M_ARM, q(70), q(10), { e: () => 0.3, a: (u, v) => v });
      for (const sg of [1, -1]) D3.tubeC(B, u => { const p0 = knot(sg > 0 ? 0.05 : 0.55); return [p0[0] + sg * u * 0.9, p0[1] + u * 0.3 * sg, p0[2] - u * 0.75]; }, u => 0.15 * (1 - 0.4 * u), M_ARM, q(8), q(8), { e: () => 0.4, a: (u, v) => v });
      [[0.0, 0.0], [0.42, -0.3], [-0.42, -0.25]].forEach(([x, y], i) => { B.tube([x, y, -0.4], [x, y, 0.62], 0.05, 0.04, M_BONE, { seg: q(8), cap0: false, cap1: false }); B.tube([x, y, 0.58], [x, y, 0.68], 0.2 - i * 0.02, 0.18 - i * 0.02, M_BONE, { seg: q(14), cap0: 'flat', cap1: 'flat' }); B.ell([x, y, 0.69], [0.06, 0.06, 0.02], M_INK, { seg: 8, rings: 3 }); });
      fin('anchor', B); }
    /* the ink: a glossy wobbling blob; a Sandfall tooth: a curved fang of bone (along z from its root) */
    { const B = nb(); B.surf((u, v) => { const ph = u * TAU, th = v * Math.PI, s = Math.sin(th), l = 1 + 0.12 * Math.sin(ph * 3 + th * 2) + 0.08 * Math.sin(ph * 5 - th * 3); return [Math.cos(ph) * s * 0.55 * l, Math.sin(ph) * s * 0.55 * l, Math.cos(th) * 0.5 * l]; }, q(16), q(10), () => M_INK, { e: () => 0, a: () => 0.5, flip: true }); fin('ink', B); }
    { const B = nb(); D3.tubeC(B, u => [0.22 * u * u, 0, u * 1.75], u => 0.3 * Math.pow(1 - u, 0.9) + 0.012, M_BONE, q(10), q(8), { up: [1, 0, 0], a: u => 1 - u }); fin('shard', B); }
    return out; }

  /* ================= the rig ================= */
  /* the arm's spine: Catmull-Rom through the fight's five points (model coords), frames carried along it (no twist), its radius */
  function cr(a, b, c, d, t) { return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t); }
  function spl(S, f) { const n = S.length, i = Math.max(0, Math.min(n - 2, Math.floor(f))), t = f - i, A = S[Math.max(0, i - 1)], B = S[i], C = S[i + 1], D = S[Math.min(n - 1, i + 2)]; return [cr(A[0], B[0], C[0], D[0], t), cr(A[1], B[1], C[1], D[1], t), cr(A[2], B[2], C[2], D[2], t)]; }
  const ARMC = [], ARMF = [];
  function armSpine(S, out0) { const n = S.length - 1; for (let i = 0; i <= ANU; i++) ARMC[i] = spl(S, i / ANU * n);
    let zp = out0; for (let i = 0; i <= ANU; i++) { const a = ARMC[Math.max(0, i - 1)], b = ARMC[Math.min(ANU, i + 1)], x = vnrm(vsub(b, a)); let z = vsub(zp, vmul(x, vdot(zp, x))); if (vlen(z) < 1e-4) z = Math.abs(x[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]; z = vnrm(z); ARMF[i] = { x, y: vcross(z, x), z }; zp = z; } }
  /* P: hd (the head's heading, model), z0 (the dome's centre over the sand), sw / sq (breath, a blow), gaze (model dir), dil, lidU, lidL, bulge,
     eyeGlow, roar, foot ([x, y] the dome's footprint where it meets the sand), arms ([{ k, pts (model, root first), up, wind, open, kr }]),
     dizzy, flash, dead, alpha */
  function blankPose() { return { hd: Math.PI / 2, z0: 1.1 / ZK, sw: 1, sq: 1, gaze: [0, 1, -0.1], dil: 1, lidU: 0.3, lidL: 0.15, bulge: 1, eyeGlow: 0.3, roar: 0, arms: [], dizzy: 0, flash: 0, dead: 0, alpha: 1, sink: 0 }; }
  function rig(P, t) {
    const inst = [], A = {}, dead = cl(P.dead || 0), fl = P.flash || 0;
    const I = (part, R, o, ex) => { const it = { part, R, o, s: 1, al: 1, glow: 0, glow2: fl * 0.85, spill: 0, kind: 0, fx: dead * 0.8, wear: 0.5 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const Rh = rotZ(P.hd), C0 = [0, 0, P.z0], sw = P.sw || 1, sz = (P.sq || 1) * sw, toH = p => vadd(C0, mv(Rh, [p[0] * sw, p[1] * sw, p[2] * sz]));
    I('dome', Rh, C0, { sc: [sw, sw, sz], glow: (P.roar || 0) * 0.8 + (P.eyeGlow || 0) * 0.2, wear: 0.37 });
    const fk = Math.sqrt(cl(1 - sq(P.z0 / (DZ * sz)))) ; I('heap', I3(), [0, 0, 0], { sc: [Math.max(0.4, fk) * DX * 0.98, Math.max(0.4, fk) * DY * 0.98, 0.8], kind: 2, wear: 0.6 });
    const ec = toH(EYE_C), eb = P.bulge || 1, gz = P.dizzy ? vnrm(vadd(mv(Rh, [1, 0, 0]), [Math.cos(t * 5) * 0.5, Math.sin(t * 5) * 0.4, Math.sin(t * 4.1) * 0.3])) : vnrm(P.gaze || mv(Rh, [1, 0, 0])), Re = frameXZ(gz, [0, 0, 1]);
    I('eye', Re, ec, { s: EYE_R * eb * sw, sc: [0.95, 1.12, 0.86], kind: P.dil, glow: P.eyeGlow || 0, wear: 0.9 });
    const lr = EYE_R * eb * sw; I('lidU', mm(Rh, rotY(lerp(-2.25, 0.55, cl(P.lidU)))), ec, { s: lr, sc: [1, 1.12, 0.9], wear: 0.55, outline: false }); I('lidL', mm(Rh, rotY(lerp(0.75, -0.25, cl(P.lidL)))), ec, { s: lr, sc: [1, 1.12, 0.9], wear: 0.57, outline: false });
    A.head = C0; A.eye = ec; A.crown = toH([0, 0, DZ * 1.05]);
    // the arms
    const used = new Set();
    for (const Ar of P.arms || []) { const k = Ar.k, S = Ar.pts, M = TH.MESH['arm' + k]; if (!M || !S) continue; const root = S[0], toward = vnrm([-root[0], -root[1], 0]);
      armSpine(S, vmul(toward, -1)); const kr = Ar.kr || 1, ph0 = k * 1.7 + t * 1.3, rad = u => (0.74 * Math.pow(1 - u, 1.25) + 0.045 + 0.16 * Math.exp(-sq(u / 0.1))) * kr * (1 + 0.055 * Math.sin(u * 26 - t * 4 + k));
      // (v433 DB, second pass) a twist along its length (its underside's suckers turning into view as it curls), a ripple running down it
      for (let i = 0; i <= ANU; i++) { const u = i / ANU, tw = (0.9 * u + 0.25 * Math.sin(u * 5 + ph0)) * (k % 2 ? 1 : -1), F = ARMF[i], c = Math.cos(tw), s2 = Math.sin(tw); ARMF[i] = { x: F.x, y: vadd(vmul(F.y, c), vmul(F.z, s2)), z: vadd(vmul(F.z, c), vmul(F.y, -s2)) }; }
      K.regrid(M, ANU, ANV, (u, v) => { const i = Math.round(u * ANU), c = ARMC[i], F = ARMF[i], a = v * TAU, r = rad(u), sa = Math.sin(a); return vadd(c, vadd(vmul(F.y, Math.cos(a) * r), vmul(F.z, sa * r * (sa < 0 ? 0.82 : 1)))); }, true); TH.PB['arm' + k] = null;
      I('arm' + k, I3(), [0, 0, 0], { glow: Ar.wind || 0, wear: 0.1 + k * 0.11 });
      // its suckers: two staggered rows down the underside, smaller toward the tip
      const MS = TH.MESH.suckers; for (let j = 0; j < NSK; j++) { const row = j % 2, u = 0.1 + (Math.floor(j / 2) + row * 0.5) * 0.095; if (u > 0.93) { K.hide(MS, k * NSK + j); continue; }
        const fi = u * ANU, i0 = Math.min(ANU - 1, Math.floor(fi)), w = fi - i0, F = ARMF[i0], c0 = vadd(vmul(ARMC[i0], 1 - w), vmul(ARMC[i0 + 1], w)), a = 4.712 + (row ? 0.42 : -0.42), r = rad(u), nn = vnrm(vadd(vmul(F.y, Math.cos(a)), vmul(F.z, Math.sin(a)))), sk2 = r * 0.5;
        K.place(MS, k * NSK + j, frameXZ(nn, F.x), vadd(c0, vmul(nn, r * 0.8)), [sk2, sk2, sk2]); }
      used.add(k);
      const mk = Math.min(1, Ar.up * 1.2); I('mound', rotZ(k * 1.3), [root[0], root[1], 0], { sc: [mk, mk, mk * 0.85], kind: 2, wear: 0.2 + k * 0.09 });
      const tp = ARMC[ANU], Ft = ARMF[ANU], sp = Ar.open ? 0.5 : 0.04, tl = 0.85 * kr;
      for (const sg of [-1, 1]) { const d = vnrm(vadd(Ft.x, vmul(Ft.y, sg * sp))); I('prong', frameXZ(d, Ft.z), vsub(tp, vmul(Ft.x, 0.12)), { s: tl, wear: 0.3 + k * 0.07 + (sg > 0 ? 0.5 : 0) }); }
      A['tip' + k] = tp; }
    if (TH.MESH.suckers) { const MS = TH.MESH.suckers; for (let k = 0; k < NT; k++) if (!used.has(k)) for (let j = 0; j < NSK; j++) K.hide(MS, k * NSK + j); K.commit(MS); TH.PB.suckers = null; if (used.size) I('suckers', I3(), [0, 0, 0], { wear: 0.5, outline: false }); }
    return { inst, A }; }

  /* ================= drawing ================= */
  let LAST = null;
  function drawModel(c, x, y, P, o) { if (!TH.on()) return null; const t = o.t || 0, R = o.R || rig(P, t), V = K.mkView(x, y, 0, 0, o); LAST = { R, V }; const al = P.alpha == null ? 1 : P.alpha;
    let ok = false; try { ok = D3.glPass(c, V, R.inst, al, { t, flash: o.flash, light: 'night', clip: 0, occ: lowFx() ? null : [[R.A.head, Math.min(DX, DY) * 0.75]] }, TH); } catch (e) { TH.fail(); if (typeof console !== 'undefined') console.warn('Thul-Ammon: draw', e); ok = false; }
    return ok ? R : null; }
  const vis = p => ({ x: p.x, y: p.y - p.z * ZK });

  /* ================= the fight's side ================= */
  const HOOK = { armPts: null };
  function st3(FX, m) { const M = FX.mem; let S = M.g3; if (S) return S; S = M.g3 = { P: blankPose(), fx: [], yaw: 0, vyaw: 0, R: null, Rt: -1, hs0: 0 }; return S; }
  function init(FX, hooks) { FX.mem.g3 = null; if (hooks && hooks.armPts) HOOK.armPts = hooks.armPts; st3(FX, FX.m); }
  const domeZ = M => 1.1 * (M.rise == null ? 1 : M.rise) - (M.sink || 0) * 1.0 + Math.sin((M.bt || 0) * 1.3) * 0.05;
  function poseOf(FX, m) { const M = FX.mem, S = st3(FX, m), P = S.P, me = FX.me || { x: m.x, y: m.y + 6 }, bt = M.bt || 0, hs = m.hitSq || 0, roar = M.roar || 0, menace = M.menace || 0, sink = M.sink || 0, br = Math.sin(bt * 1.3);
    P.hd = headOf(Math.PI / 2 + S.yaw); P.z0 = domeZ(M) / ZK - 0.15; P.sw = 1 + br * 0.015 + roar * 0.06 + hs * 0.06; P.sq = 1 - hs * 0.12 - sink * 0.05;
    const ec = vadd([0, 0, P.z0], mv(rotZ(P.hd), EYE_C)); P.gaze = vsub([me.x - m.x, (me.y - m.y) / GY, 0.6], ec); if (P.gaze[1] < 0.5) P.gaze[1] = 0.5; P.gaze = vadd(vmul(vnrm(P.gaze), 0.55), [0, 0.6945, 0.7195]);   // (turned up a little toward the view, so the eye meets it)
    P.dizzy = (m.stunT > 0 || sink > 0.5) ? 1 : 0; P.dil = clamp(1 - menace * 0.55 - roar * 0.7 + sink * 0.5, 0.2, 1.4); P.bulge = 1 + sink * 0.15;
    P.lidU = clamp(0.08 + menace * 0.2 - roar * 0.3 - sink * 0.35 + Math.max(M.blink || 0, hs * 0.6) * 1.2, 0, 1); P.lidL = clamp(0.12 + menace * 0.25 - sink * 0.2 - roar * 0.15 + (M.blink || 0) * 0.4, 0, 1);
    P.eyeGlow = 0.3 + menace * 0.8 + roar * 0.8 + sink * 0.6; P.roar = roar; P.flash = m.flash > 0 ? 1 : 0; P.sink = sink; P.dead = 0;
    P.alpha = 1; const arms = P.arms; arms.length = 0;
    if (M.tents && HOOK.armPts) for (const Tk of M.tents) { if (Tk.up <= 0.02) continue; const pts = HOOK.armPts(Object.assign({}, Tk, { up: 1 }), M, bt), dn = (1 - Tk.up) * 5.2;
      arms.push({ k: Tk.k, up: Tk.up, wind: Tk.wind || 0, open: !!(Tk.reach && Tk.reach.spread && !Tk.reach.done), kr: (1 + hs * 0.05) * Math.min(1, 0.45 + Tk.up), pts: pts.map((p, i) => [p[0] - m.x, (p[1] - m.y) / GY, p[2] / ZK - dn - (i === 0 ? 0.6 : 0)]) }); }
    return P; }
  function rigNow(FX, m) { const M = FX.mem, S = st3(FX, m); if (S.R && S.Rt === M.bt) return S.R; S.R = rig(poseOf(FX, m), M.bt || 0); S.Rt = M.bt; return S.R; }
  const anc = (FX, m, n) => { const R = rigNow(FX, m), p = R && R.A[n]; return p ? { x: m.x + p[0], y: m.y + p[1] * GY, z: p[2] } : { x: m.x, y: m.y, z: 2 }; };
  function eyeAt(FX, m) { const p = vis(anc(FX, m, 'eye')); return [p.x, p.y]; }
  function headAt(FX, m) { const p = anc(FX, m, 'head'); return [p.x, p.y, p.z * ZK]; }
  /* the motion: the head turns (on a spring) to keep the pet before its eye; the bursts age */
  function update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M || !(dt > 0)) return; const S = st3(FX, m), me = FX.me;
    for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += dt; if (f.t >= f.life) S.fx.splice(i, 1); }
    const want = me && !(m.stunT > 0) ? clamp(Math.atan2(me.y - m.y, me.x - m.x) - Math.PI / 2, -0.45, 0.45) * (Math.hypot(me.x - m.x, me.y - m.y) > 2 ? 1 : 0) : 0, wt = me && me.y < m.y ? 0 : want;
    S.vyaw += (-14 * (S.yaw - wt) - 4.5 * S.vyaw) * dt; S.yaw = clamp(S.yaw + S.vyaw * dt, -0.6, 0.6);
    const hs = m.hitSq || 0; if (hs > 0.9 && S.hs0 <= 0.9) S.vyaw += (Math.random() - 0.5) * 2.5; S.hs0 = hs; }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  /* ================= its light (FGFX) ================= */
  const fxOn = () => !!D3.fg();
  /* the floor's light: the warnings (Tentacle Sweep's lanes, the slams' marks, the ink's mark, the grasp's furrows, the Sandfall's
     marks, the grubs' churning), the lash's crest, the impacts, the sand churning round the head when it sinks, the grasp's drag */
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !m) return; const F = D3.fg(), marked = FX.S.tele.filter(s => s.geo);
    if (!F) { for (const s of marked) D3.tele2D(c, FX, s, T, t); return; }
    const S = st3(FX, m), lf = lowFx(), Q = F.begin(c, null);
    try {
      for (const s of marked) tell(Q, FX, s, T, t);
      if ((M.sink || 0) > 0.05) { const R = T * 6.2, X = FX.sx(m.x), Y = FX.sy(m.y + 0.4); Q.quad(267, X, Y, R, 0, 0, R * GY, OCHRE_HI, 0.7 * M.sink, 0.4 + 0.4 * M.sink, 7.7, 1); }
      if (M.grab && FX.me) { const me = FX.me, X0 = FX.sx(me.x), Y0 = FX.sy(me.y), X1 = FX.sx(m.x), Y1 = FX.sy(m.y + 2.2); Q.rbeam(X0, Y0, X1, Y1, T * 0.7, AMBER, 0.25, 1, 0.1); Q.glow(X0, Y0, T * 1.4, AMBER, 0.3); }
      for (const f of S.fx) floorFx(Q, FX, f, T, t, lf);
    } finally { F.flush(c); } }
  function tell(Q, FX, s, T, t) { const X = FX.sx(s.x), Y = FX.sy(s.y), u = cl(s.age / s.t), sd = s.seed || 1;
    if (s.orb === 'sweep') { const ca = Math.cos(s.a), sa = Math.sin(s.a), hl = s.len / 2 * T, hw = s.w / 2 * T * 1.1; Q.quad(268, FX.sx(s.x + ca * s.len / 2), FX.sy(s.y + sa * s.len / 2), ca * hl, sa * hl, -sa * hw, ca * hw, VIOLET_HI, 1, u * 0.999, sd, s.len / s.w); }
    else if (s.orb === 'rise') { const R = s.r * T * 1.18; Q.quad(267, X, Y, R, 0, 0, R, OCHRE_HI, 0.85, u * 0.999, sd, sd > 20 ? 1 : -1); }
    else { const R = s.r * T * 1.12, fm = s.orb === 'grasp' ? 1 : s.orb === 'sandfall' ? 2 : 0, col = s.orb === 'ink' ? VIOLET_HI : s.orb === 'sandfall' ? BONE_HI : AMBER; Q.quad(269, X, Y, R, 0, 0, R, col, 0.9, u * 0.999, sd, fm); } }
  function floorFx(Q, FX, f, T, t, lf) { const u = cl(f.t / f.life), X = FX.sx(f.x), Y = FX.sy(f.y);
    if (f.kind === 'lash') { const ca = Math.cos(f.a), sa = Math.sin(f.a), hl = f.len / 2 * T, hw = f.w / 2 * T * 1.1; Q.quad(268, FX.sx(f.x + ca * f.len / 2), FX.sy(f.y + sa * f.len / 2), ca * hl, sa * hl, -sa * hw, ca * hw, VIOLET_HI, 1, 1 + 0.999 * (1 - u), f.seed, f.len / f.w);
      if (!lf) for (let i = 1; i < 6; i++) { const d = i / 6 * f.len, k = cl((u * 1.3 - i / 6) * 3); if (k <= 0) continue; Q.smoke(FX.sx(f.x + ca * d), FX.sy(f.y + sa * d), T * (0.8 + 0.6 * k), 0.3 * (1 - u), f.seed + i, DUST); } }
    else if (f.kind === 'impact') { const R = f.r * T * 1.12; Q.quad(269, X, Y, R, 0, 0, R, f.col, 1, 1 + 0.999 * u, f.seed, f.fm || 0); if (!lf) Q.smoke(X, Y - T * 0.2, T * f.r * (0.6 + 0.6 * u), 0.32 * (1 - u), f.seed, DUST); }
    else if (f.kind === 'churn') { const R = f.r * T * 1.18; Q.quad(267, X, Y, R, 0, 0, R, f.col, 1, 1 + 0.999 * u, f.seed, 1); if (!lf) Q.smoke(X, Y - T * 0.2, T * f.r * (0.7 + 0.7 * u), 0.3 * (1 - u), f.seed, DUST); }
    else if (f.kind === 'splash') { Q.glow(X, Y, T * f.r * (1 + u), VIOLET_HI, 0.3 * (1 - u)); if (!lf) Q.ripple(X, Y, T * f.r * (0.6 + 1.4 * u), VIOLET_HI, 0.4 * (1 - u), f.seed, GY, 0.1); }
    else if (f.kind === 'burst') { Q.glow(X, Y, T * f.r * (1.1 + u), f.col, 0.28 * (1 - u)); if (!lf) Q.ripple(X, Y, T * f.r * (0.5 + 1.4 * u), f.col, 0.4 * (1 - u), f.seed, GY, 0.1); } }
  /* an ink pool on the sand (the zone's own picture: dark smoke laid in layers, an oily sheen over it); false without the painter */
  function inkDraw(c, FX, z, T, t) { const F = D3.fg(); if (!F) return false; const fade = Math.min(1, z.age / 0.3, (z.life - z.age) / 0.8), X = FX.sx(z.x), Y = FX.sy(z.y), rr = z.r * T, sd = z.seed || (z.seed = Math.random() * 30); if (!(fade > 0.01)) return true;
    const Q = F.begin(c, null);
    try { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + sd + t * 0.08, d = rr * 0.35; Q.quad(9, X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.72, rr * 0.82, 0, 0, rr * 0.6, INKC, 0.55 * fade, 0, sd + i); }
      Q.quad(9, X, Y, rr * 1.05, 0, 0, rr * 0.76, '#0A0610', 0.7 * fade, 0, sd + 9); Q.quad(270, X, Y, rr * 0.95, 0, 0, rr * 0.7, VIOLET_HI, fade, fade, sd, 0); } finally { F.flush(c); } return true; }
  /* the upper light (and the things in the air: the ink in flight, the Sandfall's teeth falling and stuck in the sand, one GPU pass) */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m) return false; const F = D3.fg(); if (!F) return false; const S = st3(FX, m), gl = TH.on(), lf = lowFx();
    if (gl) { try { fieldPass(c, FX, m, M, T, t); } catch (e) { /* (the 2D things in the air) */ } } else return false;
    const scr = p => [FX.sx(p.x), FX.sy(p.y) - p.z * ZK * T], Q = F.begin(c, null);
    try {
      for (const s of FX.S.tele) { if (s.done || !s.shard) continue; const u = cl(s.age / s.t), X = FX.sx(s.x), Y = FX.sy(s.y), h = T * 9; Q.quad(271, X, Y - h / 2, T * 1.0, 0, 0, h / 2, BONE_HI, 0.85, 0.3 + 0.7 * u, s.seed || 1, 0); }
      if (!m.dead) { const menace = M.menace || 0, roar = M.roar || 0, sink = M.sink || 0, e = scr(anc(FX, m, 'eye'));
        const eg = Math.max(menace * 0.45, sink * 0.6, roar * 0.5); if (eg > 0.02) Q.glow(e[0], e[1], T * 2.6, AMBER, eg * (0.75 + 0.25 * Math.sin(t * 9))); Q.glow(e[0], e[1], T * 0.9, AMBER_HI, 0.18 + eg * 0.3); Q.ring(e[0], e[1] + T * 0.05, T * EYE_R * 1.02, AMBER_HI, 0.14 + eg * 0.25, T * 0.12, 0.82);   // (a rim of light round the eye)
        for (const Tk of M.tents || []) { if (!(Tk.wind > 0.3) || Tk.up < 0.5) continue; const p = scr(anc(FX, m, 'tip' + Tk.k)); Q.glow(p[0], p[1], T * 1.4, AMBER, Tk.wind * (0.3 + 0.2 * Math.sin(t * 12 + Tk.k))); }
        if (roar > 0.02) { const h = scr(anc(FX, m, 'head')); Q.glow(h[0], h[1], T * 6, AMBER, 0.22 * roar); }
        if (m.stunT > 0 || sink > 0.5) { const cw = scr(anc(FX, m, 'crown')); for (let i = 0; i < 3; i++) { const a = (M.bt || t) * 3 + i * TAU / 3; Q.star(cw[0] + Math.cos(a) * T * 2.2, cw[1] - T * 0.8 + Math.sin(a) * T * 0.45, T * 0.34, 0.9, '#FFFFFF'); } } }
      for (const L of M.lobs || []) { const u = cl(L.t / L.dur), x = lerp(L.x0, L.x1, u), y = lerp(L.y0, L.y1, u), h = 4 * u * (1 - u) * 4 + (1 - u) * L.z0; Q.glow(FX.sx(x), FX.sy(y) - h * T, T * 1.0, VIOLET_HI, 0.18); }
      for (const f of S.fx) { if (f.kind !== 'burst') continue; const u = cl(f.t / f.life), X = FX.sx(f.x), Y = FX.sy(f.y) - (f.z || 0) * T; Q.glow(X, Y, T * f.r * (0.8 + 0.6 * u), f.col, 0.5 * (1 - u)); Q.glow(X, Y, T * f.r * 0.35, '#FFFFFF', 0.5 * (1 - u) * (1 - u)); Q.ring(X, Y, T * f.r * (0.4 + 1.2 * u), f.col, 0.45 * (1 - u), T * 0.12);
        if (!lf) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + f.seed, d = T * f.r * (0.3 + 1.1 * u); Q.star(X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.8, T * 0.28, 0.75 * (1 - u), i % 2 ? '#FFFFFF' : f.col); } }
    } finally { F.flush(c); } return true; }
  /* the things in the air: the ink lobbed from the head, the teeth falling from the jaw over their marks, the teeth stuck in the sand
     sinking away; one pass, cut at the sand */
  function fieldPass(c, FX, m, M, T, t) { const list = [], lobs = M.lobs || [], shards = M.shards || [];
    for (const L of lobs) { const u = cl(L.t / L.dur), x = lerp(L.x0, L.x1, u), y = lerp(L.y0, L.y1, u), h = 4 * u * (1 - u) * 4 + (1 - u) * L.z0; list.push({ part: 'ink', R: mm(rotZ(L.t * 2), rotX(L.t * 3.1)), o: [x - m.x, (y - m.y) / GY, h / ZK], s: 1 + u * 0.3, sc: [1 + 0.15 * Math.sin(L.t * 9), 1, 1 - 0.15 * Math.sin(L.t * 9)], wear: 0.4 }); }
    for (const s of FX.S.tele) { if (s.done || !s.shard) continue; const u = cl(s.age / s.t), h = (1 - u * u) * 11; list.push({ part: 'shard', R: mm(rotX(Math.PI), rotY(0.3 + u * 0.4)), o: [s.x - m.x, (s.y - m.y) / GY, h / ZK + 1.75], s: 1, wear: (s.seed || 1) % 1 }); }
    for (const S2 of shards) { const k = Math.min(1, (2.4 - S2.t) / 0.6); list.push({ part: 'shard', R: mm(rotZ(S2.a * 3), rotY(S2.a)), o: [S2.x - m.x, (S2.y - m.y) / GY, -0.5 - (1 - k) * 1.6], s: 0.85, wear: (S2.a + 1) % 1 }); }
    if (!list.length) return true;
    const b = c; b.save(); for (const L of lobs) { const u = cl(L.t / L.dur), x = lerp(L.x0, L.x1, u), y = lerp(L.y0, L.y1, u); b.globalAlpha = 0.3 + 0.2 * u; b.fillStyle = 'rgba(10,6,4,1)'; b.beginPath(); b.ellipse(FX.sx(x), FX.sy(y), T * 0.5, T * 0.22, 0, 0, TAU); b.fill(); } b.restore();
    const V = K.mkView(m.x, m.y, 0, 0, { T, sx: FX.sx, sy: FX.sy }); return D3.glPass(c, V, list, 1, { t, light: 'night', clip: 0 }, TH); }

  /* ================= the API for the fight (20y-rift-fiend-dunes-3.js) ================= */
  function drawBoss(c, FX, m, X, Y, T, t) { if (!TH.on()) return false; const M = FX.mem; st3(FX, m); const R = rigNow(FX, m);
    return !!drawModel(c, m.x, m.y, M.g3.P, { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T, t: M.bt || t, R, flash: m.flash > 0 ? 1 : 0 }); }
  function burst(FX, x, y, r, col, o) { o = o || {}; const S = st3(FX, FX.m); S.fx.push({ kind: 'burst', x, y, z: o.z == null ? 0.6 : o.z, r, col, t: 0, life: 0.55 + r * 0.12, seed: Math.random() * 40 });
    if (o.n !== 0) FX.H.sparks(x, y - (o.z == null ? 0.6 : o.z), col, Math.round((o.n || 14) * 0.5), r * 5); FX.H.shake(o.shake || r * 3, 0.22); }
  const push = (FX, f) => { const S = st3(FX, FX.m); f.t = 0; f.seed = Math.random() * 40; S.fx.push(f); };
  const lash = (FX, s) => push(FX, { kind: 'lash', x: s.x, y: s.y, a: s.a, len: s.len, w: s.w, life: 0.6 });
  const impact = (FX, s, col, fm) => push(FX, { kind: 'impact', x: s.x, y: s.y, r: s.r || 1.5, col: col || AMBER, fm: fm || 0, life: 0.6 });
  const churn = (FX, s, r) => push(FX, { kind: 'churn', x: s.x, y: s.y, r: r || s.r || 1.2, col: OCHRE_HI, life: 0.7 });
  const splash = (FX, s) => push(FX, { kind: 'splash', x: s.x, y: s.y, r: 1.6, life: 0.7 });
  /* an anchor: its picture kept for each stage of its cracking, a pulse of amber over it and its label */
  function drawAnchor(c, FX, o, X, Y, T, t) { if (!TH.on()) return false; const ck = Math.min(2, Math.floor((1 - o.hp / o.maxhp) * 3)), v = o.idx % 3;
    const p = D3.pic(c, TH, 'anc' + ck + v, T, () => [{ part: 'anchor', R: rotZ(v * 2.1), o: [0, 0, 0], s: 1.3, glow: 0.6, kind: ck / 2, wear: 0.2 + v * 0.3 }], 'night', 0); if (!p) return false;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + o.idx);
    if (typeof glowSprite === 'function') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 + 0.2 * pulse; blitSized(c, glowSprite(AMBER), X - T * 1.5, Y - T * 1.7, T * 3, T * 3); c.restore(); }
    c.save(); if (o.flash > 0) c.filter = 'brightness(1.6)'; D3.blitPic(c, p, X, Y); c.restore();
    c.save(); c.font = `800 ${Math.round(T * 0.24)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('ANCHOR', X, Y - T * 1.25); c.fillText('ANCHOR', X, Y - T * 1.25); c.restore(); return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { TH.on(); }, () => { if (!TH.on()) return; const cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d'); try { drawModel(c, 0, 0, blankPose(), { T: 4, sx: v => 8 + v, sy: v => 8 + v, t: 0, shadow: false }); } catch (e) { /* (the 2D kraken) */ } cv.width = cv.height = 1; }]; }
  D3.onRelease(() => { LAST = null; HOOK.armPts = null; });
  /* a studio portrait (tests): the head and its arms in a ring (as the fight's own), the pose's fields over the blank one */
  function studio(c, x, y, a, over, o) { const P = Object.assign(blankPose(), over || {}), T0 = (o && o.T) || 30, t = 1.3;
    const C = { x: 0, y: 0 }, sink = P.sink || 0; P.z0 = (1.1 - sink) / ZK - 0.15; P.dil = clamp(1 - (P.menace || 0) * 0.55 + sink * 0.5, 0.2, 1.4); P.bulge = 1 + sink * 0.15; P.lidU = clamp(0.3 + (P.menace || 0) * 0.12 - sink * 0.35, 0, 1); P.lidL = clamp(0.12 + (P.menace || 0) * 0.25 - sink * 0.2, 0, 1); P.eyeGlow = 0.3 + (P.menace || 0) * 0.8 + sink * 0.6; P.gaze = [0.15, 0.95, 0.75];
    if (!sink) for (let k = 0; k < NT; k++) { if (k === 2 || k === 6) continue; const an = k / NT * TAU + 0.2, sx2 = Math.cos(an) * 8.4, sy2 = Math.sin(an) * 8.4, lean = Math.atan2(-sy2, -sx2), cl2 = Math.cos(lean), sl2 = Math.sin(lean), ph = k * 1.3 + t, w = Math.sin(ph) * 0.45, wind = P.demoWind && k % 3 === 0 ? 1 : 0, reach = P.demoReach && k % 2 === 0;
      const at = (u, v, z) => [sx2 + cl2 * u - sl2 * v, sy2 + sl2 * u + cl2 * v, z]; let pts = [at(0, 0, 0), at(0.2 - wind * 0.5, w * 0.2, 1.5 + wind * 0.3), at(0.9 - wind * 1.3, w * 0.6, 3.0 + wind * 0.9), at(2.0 - wind * 1.6, w, 3.9 + wind * 1.3), at(3.2 - wind * 1.4, w * 1.3, 3.3 + wind * 1.6)];
      if (reach) { const rx = Math.cos(an) * 3, ry = Math.sin(an) * 3, mx = (sx2 + rx) / 2, my = (sy2 + ry) / 2; pts[3] = [mx, my, 5]; pts[4] = [rx, ry, 3.2]; pts[2] = [(sx2 + mx) / 2, (sy2 + my) / 2, 3.8]; }
      P.arms.push({ k, up: 1, wind, open: reach, kr: 1, pts: pts.map((p, i) => [p[0], p[1] / GY, p[2] / ZK - (i === 0 ? 0.6 : 0)]) }); }
    return drawModel(c, 0, 0, P, Object.assign({ T: T0, sx: v => x + v * T0, sy: v => y + v * T0, t }, o || {})); }
  function studioAnchor(c, x, y, ck, T0) { if (!TH.on()) return false; const V = K.mkView(0, 0, 0, 0, { T: T0, sx: v => x + v * T0, sy: v => y + v * T0 }); return D3.glPass(c, V, [{ part: 'anchor', R: I3(), o: [0, 0, 0], s: 1, glow: 0.6, kind: ck / 2, wear: 0.3 }], 1, { t: 0, light: 'night', clip: 0 }, TH); }
  return { on: () => TH.on(), fx: fxOn, mark: D3.mark, init, update, drawBoss, drawFx, overlay, inkDraw, drawAnchor, eyeAt, headAt, burst, lash, impact, churn, splash, preload, studio, studioAnchor, blankPose, HOOK,
    __dbg: { get gl() { return TH.on(); }, set noGL(v) { TH.NOGL = !!v; }, get MESH() { return TH.MESH; }, get last() { return LAST; }, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +TH.ms.toFixed(2), frames: TH.n, box: TH.box, meshMs: +TH.meshMs.toFixed(1), meshTris: TH.tris }); } } };
})();
