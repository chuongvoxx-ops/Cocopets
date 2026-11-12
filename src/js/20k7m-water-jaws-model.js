/* ---------- Water's 11th Ultimate, Jaws: the model (the lead's base and transformation blockout; M's cel materials in GLM) ----------
   One mechanical assembly, two connected configurations, drawn live with GLM like Fenrir (20k8m):
     xf 0  JAWS      a flying shark: head and hinged jaw, the mouth cannon packed inside, flank armour closed over the
                     reactor, pectoral fins swept, a tall dorsal fin, a segmented swimming tail, the cockpit raised
     xf 1  LEVIATHAN a siege submarine: the same head as the prow with the jaws open round the deployed cannon, the flank
                     plates slid outward on their rails to show the reactor, the fins spread as stabilisers, the dorsal
                     fin raked as the command spine, the tail folded under the stern with its lobes turned to control
                     surfaces, the cockpit lowered
   Every part exists in both forms; only their placements change (rig). The frame: x forward, y left, z up; the origin
   is the hull's middle at the pet's flight point. draw()'s heading turns the whole model (a vehicle).
   Mesh conventions for the cel materials (ids 30..35): the second attribute is 1 at a panel line or a plate's edge.
   Pose channels: blankPose(). The pet is the core's (X.drawPetAt at anchor('seat')), upright, never yawed. */
const JAWS_MODEL = (() => {
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;
  const VIS = 0.92;   // (the hull, nose to tail root, is about the Sports Car's length: 3.5 units x 0.92 = 3.2 tiles)
  const hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => hyp3(a[0], a[1], a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: the nose down)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  const MIR = M3([1, 0, 0], [0, -1, 0], [0, 0, 1]);   // (the left side's parts are the right side's meshes, mirrored)
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([1, 0, 0], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }

  /* ================= materials (GLM's ids: M's cel set for Jaws) ================= */
  const M_BLUE = 30, M_CHR = 31, M_STEEL = 32, M_CYAN = 33, M_TOOTH = 34, M_GLASS = 35;

  /* ================= the hull's shape: a fuselage of elliptical sections ================= */
  const XN = 2.0, XT = -1.5;   // the nose and the tail's root
  const fs = t => { t = cl(t); return t < 0.58 ? Math.pow(Math.sin(Math.PI / 2 * t / 0.58), 0.7) : Math.pow(Math.max(0, Math.cos(Math.PI / 2 * (t - 0.58) / 0.42)), 0.36); };   // (a broad wedge of a head: full width held well forward, a blunt snout)
  const fry = t => 0.15 + 0.5 * fs(t), frz = t => (0.13 + 0.43 * fs(t)) * (1 - 0.3 * sstep(0.78, 1, t)), fzc = t => 0.04 * Math.sin(Math.PI * t) - 0.06 * sstep(0.8, 1, t);
  const fx = t => lerp(XT, XN, t);
  const fus = (t, ph, k) => { k = k || 1; return [fx(t), fry(t) * Math.cos(ph) * k, fzc(t) + frz(t) * Math.sin(ph) * k]; };
  const T_HEAD = 0.72, T_FL0 = 0.1, T_JAW = 0.745;   // where the head begins; the flanks' rear end; the jaw's hinge
  const JAW_H = [fx(T_JAW), 0, fzc(T_JAW) - 0.1];   // the jaw's hinge line (along y)
  const SEAT0 = [fx(0.62), 0, fzc(0.62) + frz(0.62) - 0.02];   // the cockpit's floor, raised
  const DORS0 = [fx(0.4), 0, fzc(0.4) + frz(0.4) - 0.06], PEC0 = [fx(0.56), 0.5, -0.2];
  const NTAIL = 4, LTAIL = 0.36, TAIL_FOLD = [58, 112, 160, 178];   // the tail's links; each link's angle below straight-back when folded (degrees)
  const CAN_L = 0.95, CAN0 = fx(0.74);   // the mouth cannon: its length; its breech when packed
  const FLANK_OUT = 0.44, SEAT_DROP = 0.2, CAN_OUT = 0.6;

  /* ================= meshes ================= */
  let MESH = null, MESH_MS = 0;
  function buildMeshes() {
    const q = lowFx() ? 0.7 : 1, n = v => Math.max(4, Math.round(v * q)), M = {};
    const seam = (t, list) => { for (const s of list) if (Math.abs(t - s) < 0.012) return 1; return 0; };
    { const B = GLM.builder(q);   // the head: the upper shell, the nose, the upper teeth, the eyes, the dark mouth roof
      const a0 = -14 * DEG, a1 = 194 * DEG;
      B.surf((u, v) => fus(lerp(T_HEAD, 1, v), lerp(a0, a1, u)), n(26), n(16), (u, v) => (Math.abs(u - 0.5) < 0.3 ? M_BLUE : M_CHR), { e: (u, v) => Math.max(seam(lerp(T_HEAD, 1, v), [0.8, 0.9]), Math.abs(Math.abs(u - 0.5) - 0.3) < 0.02 ? 1 : 0, u < 0.03 || u > 0.97 ? 1 : 0) });
      B.ell([XN - 0.02, 0, fzc(1)], [0.2, fry(1) * 1.02, frz(1) * 1.05], M_CHR, { seg: n(14), rings: n(8) });
      B.surf((u, v) => fus(lerp(T_HEAD, 0.99, v), lerp(a0, a1, u), 0.86), n(14), n(8), () => M_STEEL, { flip: true });
      for (const sd of [1, -1]) { for (let i = 0; i < 8; i++) { const t = lerp(0.775, 0.975, i / 7), p = fus(t, sd > 0 ? a0 : a1, 0.97); B.spike(p, [p[0] + 0.02, p[1] * 0.96, p[2] - 0.13 - 0.03 * Math.sin(i * 2.1)], 0.042, M_TOOTH); }
        const e = fus(0.855, sd > 0 ? 30 * DEG : 150 * DEG, 1.005); B.ell(e, [0.11, 0.035, 0.045], M_CYAN, { seg: n(10), rings: 5 }); }
      for (let i = 0; i < 4; i++) { const y = lerp(-0.2, 0.2, i / 3), p = [XN - 0.06, y, fzc(1) - frz(1) * 0.55]; B.spike(p, [p[0] + 0.02, p[1], p[2] - 0.12], 0.04, M_TOOTH); }
      M.head = B.done(); }
    { const B = GLM.builder(q);   // the lower jaw, about its hinge: the chrome shell, the lower teeth, the dark tongue
      const a0 = 200 * DEG, a1 = 340 * DEG, rel = p => vsub(p, JAW_H);
      B.surf((u, v) => rel(fus(lerp(T_JAW, 0.965, v), lerp(a0, a1, u), 0.93)), n(20), n(12), () => M_CHR, { e: (u, v) => Math.max(u < 0.04 || u > 0.96 ? 1 : 0, seam(v, [0.5])) });
      B.surf((u, v) => rel(fus(lerp(T_JAW, 0.95, v), lerp(a0, a1, u), 0.8)), n(12), n(6), () => M_STEEL, { flip: true });
      B.ell(rel([fx(0.96), 0, fzc(0.96) - frz(0.96) * 0.7]), [0.12, fry(0.96) * 0.8, 0.1], M_CHR, { seg: n(12), rings: 6 });
      for (const sd of [1, -1]) for (let i = 0; i < 7; i++) { const t = lerp(0.79, 0.955, i / 6), p = rel(fus(t, sd > 0 ? a1 : a0, 0.9)); B.spike(p, [p[0], p[1] * 0.97, p[2] + 0.12 + 0.03 * Math.sin(i * 1.7)], 0.04, M_TOOTH); }
      for (let i = 0; i < 3; i++) { const y = lerp(-0.14, 0.14, i / 2), p = rel([fx(0.97), y, fzc(0.97) - frz(0.97) * 0.45]); B.spike(p, [p[0], p[1], p[2] + 0.11], 0.038, M_TOOTH); }
      B.tube([0, -0.5, 0], [0, 0.5, 0], 0.07, 0.07, M_STEEL, { cap0: 'round', cap1: 'round' }); B.sph([0, 0.5, 0], 0.1, M_CHR, 8); B.sph([0, -0.5, 0], 0.1, M_CHR, 8);   // (the hinge pin and its bosses)
      M.jaw = B.done(); }
    { const B = GLM.builder(q);   // the mouth cannon, from its breech along +x
      B.tube([0, 0, 0], [CAN_L, 0, 0], 0.2, 0.19, M_STEEL, { cap0: 'flat', cap1: false }); B.torX([CAN_L, 0, 0], 0.2, 0.045, M_CHR, {}); B.torX([CAN_L * 0.62, 0, 0], 0.21, 0.03, M_CHR, {}); B.torX([CAN_L * 0.3, 0, 0], 0.215, 0.03, M_CHR, {});
      B.ell([CAN_L - 0.05, 0, 0], [0.03, 0.16, 0.16], M_CYAN, { seg: n(14), rings: 5 }); B.tube([-0.25, 0.16, 0], [0.2, 0.16, 0], 0.035, 0.035, M_CHR, {}); B.tube([-0.25, -0.16, 0], [0.2, -0.16, 0], 0.035, 0.035, M_CHR, {});   // (the muzzle's lens; the mount's two slide rods)
      M.cannon = B.done(); }
    { const B = GLM.builder(q);   // the core: the spine tube, the reactor and its rings, the flank rails, the belly, the top spine plate, the rear propulsion
      B.tube([XT + 0.1, 0, 0], [fx(T_HEAD) + 0.05, 0, 0], 0.27, 0.3, M_STEEL, { cap0: 'round', cap1: 'flat' });
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [-0.05, 0, 0]); B.ell([0, 0, 0], [0.62, 0.36, 0.36], M_CYAN, { seg: n(20), rings: n(10) }); B.pop();
      for (const x of [-0.62, -0.28, 0.06, 0.4]) B.torX([x, 0, 0], 0.385, 0.04, M_CHR, {});
            B.surf((u, v) => fus(lerp(T_FL0, T_HEAD + 0.01, v), lerp(216, 324, u) * DEG), n(14), n(18), () => M_CHR, { e: (u, v) => Math.max(seam(v, [0.25, 0.5, 0.75]), u < 0.04 || u > 0.96 ? 1 : 0) });
      B.surf((u, v) => fus(lerp(T_FL0, 0.5, v), lerp(60, 120, u) * DEG), n(10), n(12), () => M_BLUE, { e: (u, v) => Math.max(seam(v, [0.5]), u < 0.05 || u > 0.95 ? 1 : 0) });
      B.torX([XT + 0.02, 0, 0], 0.24, 0.07, M_CHR, {}); B.ell([XT - 0.02, 0, 0], [0.05, 0.19, 0.19], M_CYAN, { seg: n(12), rings: 5 });
      M.core = B.done(); }
    { const B = GLM.builder(q);   // the right flank plate: a thick curved shell with a chrome lower border and three gill vents
      const a0 = -34 * DEG, a1 = 60 * DEG, t0 = T_FL0, t1 = T_HEAD;
      B.surf((u, v) => fus(lerp(t0, t1, v), lerp(a0, a1, u), 1.02), n(18), n(22), (u, v) => (u < 0.16 ? M_CHR : M_BLUE), { e: (u, v) => Math.max(seam(v, [0.22, 0.48, 0.72]), u < 0.035 || u > 0.965 || v < 0.03 || v > 0.97 ? 1 : 0, Math.abs(u - 0.16) < 0.015 ? 1 : 0) });
      B.surf((u, v) => fus(lerp(t0, t1, v), lerp(a0, a1, u), 0.94), n(10), n(12), () => M_STEEL, { flip: true });
      for (let i = 0; i < 3; i++) { const t = 0.63 + i * 0.03, p0 = fus(t, 2 * DEG, 1.035), p1 = fus(t - 0.035, 34 * DEG, 1.035); B.tube(p0, p1, 0.03, 0.03, M_CYAN, { cap0: 'round', cap1: 'round' }); }
      M.flank = B.done(); }
    { const B = GLM.builder(q);   // the flank rails: four pairs of captive rods across the hull, unit half-length (the rig stretches them along y as the plates slide out)
      for (const x of [-0.95, -0.45, 0.25, 0.72]) for (const z of [0.16, -0.16]) { B.tube([x, -1, z], [x, 1, z], 0.04, 0.04, M_STEEL, { cap0: 'round', cap1: 'round' }); B.sph([x, 1, z], 0.06, M_CHR, 6); B.sph([x, -1, z], 0.06, M_CHR, 6); }
      M.rails = B.done(); }
    { const B = GLM.builder(q);   // the cockpit: a rim, a seat, a windscreen (its floor at the origin)
      B.tor([0, 0, 0.02], 0.3, 0.05, M_CHR, {}); B.box([-0.08, 0, 0.0], [0.2, 0.2, 0.04], 0.02, M_STEEL); B.box([-0.26, 0, 0.16], [0.05, 0.19, 0.16], 0.03, M_STEEL);
      B.ell([0.24, 0, 0.1], [0.09, 0.24, 0.14], M_GLASS, { seg: n(12), rings: 6 }); B.box([0.12, 0, 0.05], [0.06, 0.12, 0.03], 0.012, M_CYAN);
      M.cockpit = B.done(); }
    const plate = (B, out, th, mat) => { B.prism(out, -th, th, mat, { b: th * 0.6 }); };
    { const B = GLM.builder(q);   // the dorsal fin, from its root: a swept blade in the x-z plane
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); plate(B, [[0.5, 0], [-0.3, 1.0], [-0.62, 0.96], [-0.42, 0.38], [-0.52, 0]], 0.04, M_BLUE); plate(B, [[0.5, 0], [0.36, 0.17], [-0.48, 0.17], [-0.52, 0]], 0.052, M_CHR); B.pop();
      M.dorsal = B.done(); }
    { const B = GLM.builder(q);   // the right pectoral fin, from its root joint: a broad swept blade in the x-y plane
      plate(B, [[0.38, 0], [-0.5, 1.3], [-0.86, 1.26], [-0.5, 0.36], [-0.56, 0]], 0.035, M_BLUE); plate(B, [[0.38, 0], [0.2, 0.26], [-0.52, 0.26], [-0.56, 0]], 0.048, M_CHR);
      B.sph([0, 0, 0], 0.15, M_CHR, 10); B.torY([0, -0.02, 0], 0.11, 0.035, M_CYAN, {});
      M.pec = B.done(); }
    for (let j = 0; j < NTAIL; j++) { const B = GLM.builder(q), r0 = lerp(0.25, 0.1, j / NTAIL), r1 = lerp(0.25, 0.1, (j + 1) / NTAIL);   // a tail link, along +x from its joint
      B.tube([0, 0, 0], [LTAIL, 0, 0], r0, r1, M_BLUE, { cap0: 'round', cap1: 'round' }); B.torX([0.02, 0, 0], r0 * 1.02, 0.03, M_CHR, {}); B.tube([0.05, 0, r0 * 0.9], [LTAIL - 0.05, 0, r1 * 0.9], 0.025, 0.025, M_CYAN, { cap0: 'round', cap1: 'round' });
      M['tail' + j] = B.done(); }
    { const B = GLM.builder(q);   // the tail fin: a hub and two lobes (x-z plane), the upper one the longer
      B.sph([0, 0, 0], 0.13, M_CHR, 10); B.torY([0, 0, 0], 0.1, 0.03, M_CYAN, {});
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); plate(B, [[0.05, 0], [0.5, 0.95], [0.72, 0.9], [0.32, 0.12]], 0.03, M_BLUE); plate(B, [[0.05, 0], [0.36, -0.62], [0.54, -0.56], [0.24, -0.08]], 0.03, M_BLUE); B.pop();
      M.tailfin = B.done(); }
    return M;
  }
  const PARTS = { head: { c: [1.55, 0, 0], R: 0.85, col: '#2B4FC9' }, jaw: { c: [0.42, 0, -0.2], R: 0.7, col: '#C9D1DC' }, cannon: { c: [0.45, 0, 0], R: 0.62, col: '#3A4250' }, core: { c: [-0.2, 0, 0], R: 1.75, col: '#2B303B' }, flank: { c: [-0.1, 0.4, 0], R: 1.45, col: '#2B4FC9' },
    cockpit: { c: [0, 0, 0.1], R: 0.45, col: '#8FA0B8' }, rails: { c: [-0.1, 0, 0], R: 1.4, col: '#2B303B' }, dorsal: { c: [-0.1, 0, 0.5], R: 0.85, col: '#2B4FC9' }, pec: { c: [-0.2, 0.65, 0], R: 0.95, col: '#2B4FC9' }, tailfin: { c: [0.35, 0, 0.15], R: 0.95, col: '#2B4FC9' } };
  for (let j = 0; j < NTAIL; j++) PARTS['tail' + j] = { c: [LTAIL / 2, 0, 0], R: 0.36, col: '#2B4FC9' };

  /* ================= the rig ================= */
  function rig(P) {
    const xf = cl(P.xf || 0), list = [], A = {};
    const sFin = sstep(0, 0.4, xf), sFl = sstep(0.12, 0.6, xf), sCan = sstep(0.3, 0.78, xf), sSeat = sstep(0.35, 0.8, xf), sTail = sstep(0.4, 1, xf);
    const Bm = mm(rotY(P.pitch || 0), rotX(P.bank || 0)), at = p => mv(Bm, p), put = (part, o, R, s, al) => list.push({ part, o: at(o), R: mm(Bm, R), s: s || 1, al: al == null ? 1 : al });
    const sw = P.swim || 0, sk = (P.swimK == null ? 0.5 : P.swimK) * (1 - sTail), bodyYaw = 0.05 * sk * Math.sin(sw + 1.2);
    const Rb = rotZ(bodyYaw);
    put('core', [0, 0, 0], Rb);
    { const hl = fry(0.5) * 0.82 + FLANK_OUT * sFl, Rr = mm(Bm, Rb); list.push({ part: 'rails', o: at([0, 0, 0]), R: M3(Rr.x, vmul(Rr.y, hl), Rr.z), s: 1, al: 1 }); }   // (the rails reach exactly to the plates)
    // the flank plates, on their rails
    { const out = FLANK_OUT * sFl + 0.02 * (P.breath || 0); put('flank', mv(Rb, [0, out, -0.04 * sFl]), Rb); put('flank', mv(Rb, [0, -out, -0.04 * sFl]), mm(Rb, MIR)); }
    // the head, the jaw and the cannon
    { const jawA = Math.max(cl(P.jaw || 0), 0.8 * sCan) * 40 * DEG, rec = (P.recoil || 0) * 0.16, cx = CAN0 + CAN_OUT * sCan + 0.25 * cl(P.cannon || 0) - rec;
      put('cannon', mv(Rb, [cx, 0, fzc(0.8) - 0.05]), Rb); put('head', [0, 0, 0], Rb); put('jaw', mv(Rb, JAW_H), mm(Rb, rotY(jawA)));
      A.mouth = at(mv(Rb, [cx + CAN_L, 0, fzc(0.8) - 0.05])); A.breech = at(mv(Rb, [cx, 0, fzc(0.8) - 0.05])); A.forward = at(mv(Rb, [1, 0, 0])); A.head = at(mv(Rb, [fx(0.86), 0, fzc(0.86) + frz(0.86)])); A.snout = at(mv(Rb, [XN, 0, fzc(1)])); }
    // the cockpit and the pet's seat
    { const o = [SEAT0[0], 0, SEAT0[2] - SEAT_DROP * sSeat]; put('cockpit', mv(Rb, o), Rb); A.seat = at(mv(Rb, [o[0] - 0.06, 0, o[2] + 0.1])); }
    // the dorsal fin: raked back as the command spine
    { const o = [DORS0[0] - 0.12 * sSeat, 0, DORS0[2] - 0.05 * sSeat], R = mm(Rb, rotY(-(12 * sFl) * DEG)); put('dorsal', mv(Rb, o), mm(R, rotX(0.06 * sk * Math.sin(sw + 0.6)))); A.dorsalTip = at(mv(Rb, vadd(o, mv(R, [-0.45, 0, 0.98])))); }
    // the pectoral fins: swept and drooped for swimming, spread level as stabilisers
    for (const sd of [1, -1]) { const flap = 0.1 * (1 - sFin) * Math.sin(sw * 0.5 + (sd > 0 ? 0 : 0.5)) + (P.fin || 0) * 0.3, R0 = mm(rotX((lerp(-24, 0, sFin)) * DEG + flap), rotZ(lerp(34, 8, sFin) * DEG)), R = sd > 0 ? R0 : mm(MIR, mm(R0, MIR)), s = lerp(1, 1.18, sFin);
      const o = [PEC0[0] - 0.1 * sFin, sd * (PEC0[1] + FLANK_OUT * sFl * 0.9), PEC0[2]]; list.push({ part: 'pec', o: at(mv(Rb, o)), R: mm(Bm, mm(Rb, sd > 0 ? R : mm(R, MIR))), s, al: 1 });
      A[sd > 0 ? 'finL' : 'finR'] = at(mv(Rb, vadd(o, mv(R, [-0.68 * s, sd * 1.28 * s, 0])))); A[sd > 0 ? 'gillL' : 'gillR'] = at(mv(Rb, vadd(fus(0.64, 18 * DEG, 1.06), [0, 0, 0]).map((v, i) => (i === 1 ? sd * (v + FLANK_OUT * sFl) : v)))); }
    // the tail: a swimming chain, or folded down and forward under the stern, its fin turned to control surfaces
    { let p = mv(Rb, [XT, 0, 0]), F = null, dir = [-1, 0, 0];
      for (let j = 0; j < NTAIL; j++) { const th = TAIL_FOLD[j] * DEG * sTail, ps = sk * 0.36 * Math.sin(sw - (j + 1) * 0.95) * (j + 1) / NTAIL + (P.tail || 0) * 0.5 * (j + 1) / NTAIL;
        dir = mv(Rb, [-Math.cos(th) * Math.cos(ps), Math.sin(ps), -Math.sin(th) * Math.cos(ps)]); F = frameXZ(dir, th > 1.2 ? [-1, 0, 0] : [0, 0, 1]); put('tail' + j, p, F); p = vadd(p, vmul(dir, LTAIL * 0.92)); }
      put('tailfin', p, mm(F, rotX(sTail * Math.PI / 2))); A.tailTip = at(vadd(p, vmul(dir, 0.5))); A.jet = at(mv(Rb, [XT - 0.1, 0, 0])); }
    A.center = at([0.1, 0, 0]); A.reactor = at([-0.05, 0, 0]); A.belly = at([0.1, 0, -0.5]); A.up = at([0, 0, 1]);
    return { list, A };
  }

  /* ================= the view and the draws (as Fenrir's) ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0], EYW = vcross(CW, EXW);
  const LW = vnrm([-0.5, 0.3, 0.82]), SBW = vnrm([-0.2, -0.38, 0.9]), RIMW = vnrm([0.55, -0.72, 0.42]), UPW = [0, 0, 1];
  function camAt(el, az) { const e = el * DEG, a = az * DEG, C = [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)], EX = vnrm(vcross([0, 0, 1], C).map(v => -v)); const ex = vlen(EX) > 1e-4 ? EX : [1, 0, 0]; return { C, EX: ex, EY: vcross(C, ex) }; }
  function mkView(x, y, z, a, o) {
    const T = o.T, sc = (o.scale || 1) * VIS, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T, K = o.cam ? camAt(o.cam[0], o.cam[1]) : null;
    const toS = K ? p => { const w = mv(Rh, p); return [X0 + vdot(w, K.EX) * k, Y0 + vdot(w, K.EY) * k]; } : p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; };
    const toW = p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; };
    return { T, sc, k, Rh, toS, toW, depth: p => vdot(mv(Rh, p), K ? K.C : CW), x, y, z, a, K };
  }
  let LAST = null, NOGL = false, GLMS = 0, GLN = 0; const GLI = [], GLJ = [];
  const glOn = () => { if (NOGL || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__JAWS_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Jaws: meshes', e); return false; } } return true; };
  const GLCAP = 1600, RIMC = [0.35, 0.8, 1.3], AMBC = [0.85, 0.95, 1.15];
  function glPass(c, V, P, o, list, al0) {
    const k = V.k, K = V.K, PX = K ? K.EX : EXW, PY = K ? K.EY : [0, GY, -ZK], PD = K ? K.C : CW, X0 = V.toS([0, 0, 0]);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const Pt = PARTS[it.part], rr = Pt.R * it.s * 1.05 * k, w = mv(V.Rh, vadd(it.o, mv(it.R, vmul(Pt.c, it.s)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__JAWS_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.4 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
    const bw = bx1 - bx0, bh = by1 - by0, tl = w => { const a = vdot(w, EXW), b = vdot(w, EYW), cc = vdot(w, CW); return K ? vadd(vadd(vmul(K.EX, a), vmul(K.EY, b)), vmul(K.C, cc)) : w; };
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: tl(LW), ls: tl(SBW), lr: tl(RIMW), up: tl(UPW), low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: nowMs() / 1000, outline: Math.max(1, 1.4 * (W / bw) * (o.outlineK || 1)) };
    const glowK = cl(0.35 + 0.65 * (P.glow == null ? 0.5 : P.glow)), mouth = cl(P.charge || 0);
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh) continue; const Rw = mm(V.Rh, it.R), s2 = it.s, T = mv(V.Rh, it.o), al = al0 * it.al;
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = T[i]; }
      g.alpha = al; g.glow = it.part === 'cannon' || it.part === 'head' ? Math.max(glowK, mouth) : glowK; g.kind = 0; g.wear = 0.6; g.fx = 0; g.glow2 = 0; g.spill = glowK; g.d = vdot(T, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++;
  }
  /* the 2D picture (no usable GPU): each part as a shaded lozenge along its own x, far to near */
  function drawFallback(c, V, R, al0) {
    const L = R.list.map(it => ({ it, d: V.depth(vadd(it.o, mv(it.R, PARTS[it.part].c))) })).sort((a, b) => a.d - b.d); c.save(); c.lineCap = 'round';
    for (const { it } of L) { const Pt = PARTS[it.part], a = V.toS(vadd(it.o, mv(it.R, vadd(Pt.c, [-Pt.R * 0.8, 0, 0])))), b = V.toS(vadd(it.o, mv(it.R, vadd(Pt.c, [Pt.R * 0.8, 0, 0]))));
      c.globalAlpha = al0 * it.al; c.strokeStyle = Pt.col; c.lineWidth = Math.max(2, Pt.R * 0.55 * V.k * (it.part === 'core' ? 0.5 : it.part === 'flank' || it.part === 'head' ? 0.75 : 0.3)); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    c.restore();
  }
  function draw(c, x, y, z, a, P, o) {
    o = o || {}; const V = mkView(x, y, z, a, o), R = rig(P); LAST = { V, R };
    const al0 = cl(P.alpha == null ? 1 : P.alpha); if (al0 < 0.01) return;
    if (glOn()) { try { glPass(c, V, P, o, R.list, al0); return; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Jaws: GL draw', e); } }
    drawFallback(c, V, R, al0);
  }
  function drawShadow(c, x, y, z, a, P, o) {
    o = o || {}; const T = o.T, k = T * (o.scale || 1) * VIS, al = cl(P.alpha == null ? 1 : P.alpha) * 0.32 / (1 + Math.max(0, z) * 0.2); if (al < 0.01) return;
    const X0 = o.sx(x), Y0 = o.sy(y); c.save(); c.globalAlpha = al; c.translate(X0, Y0); c.rotate(Math.atan2(Math.sin(a) * GY, Math.cos(a))); c.scale(1, 0.4);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 2.3 * k); g.addColorStop(0, 'rgba(6,12,28,0.9)'); g.addColorStop(0.6, 'rgba(6,12,28,0.4)'); g.addColorStop(1, 'rgba(6,12,28,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 2.3 * k, 0, TAU); c.fill(); c.restore();
  }
  function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; return LAST.V.toW(p); }
  function anchorDir(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; const w = mv(LAST.V.Rh, p); return { x: w[0], y: w[1] * GY, z: w[2] }; }
  function anchorAt(name, x, y, z, a, P, o) { const R = rig(P), p = R.A[name]; if (!p) return null; const sc = ((o && o.scale) || 1) * VIS, w = mv(rotZ(a), p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; }
  function blankPose() { return { xf: 0, alpha: 1, swim: 0, swimK: 0.5, jaw: 0, cannon: 0, recoil: 0, bank: 0, pitch: 0, fin: 0, tail: 0, glow: 0.5, charge: 0, breath: 0 }; }
  function create() { const P = blankPose(); return { pose: P, draw: (c, x, y, z, a, P2, o) => draw(c, x, y, z, a, P2 || P, o), drawShadow: (c, x, y, z, a, P2, o) => drawShadow(c, x, y, z, a, P2 || P, o) }; }
  const SIZE = { len: (XN - XT) * VIS, lenTail: (XN - XT + NTAIL * LTAIL + 0.6) * VIS, wid: 1.3 * VIS, widLev: (1.3 + 2 * FLANK_OUT) * VIS, span: 3.1 * VIS, r: 1.7 * VIS };
  return { create, warm: () => { glOn(); return true; }, warmIdle: () => { glOn(); }, warmPlan: () => ({ pending: 0, total: 0 }), ready: () => true, draw, drawShadow, anchor, anchorDir, anchorAt, rigOf: P => rig(P || blankPose()), blankPose, SIZE, PARTS,
    get gl() { return glOn(); }, get stats() { return { ms: GLMS, n: GLN, meshMs: MESH_MS }; } };
})();
