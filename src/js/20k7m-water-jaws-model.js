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
  const M_BLUE = 30, M_CHR = 31, M_STEEL = 32, M_CYAN = 33, M_TOOTH = 34, M_GLASS = 35, M_SEAT = 36;

  /* ================= the hull's shape: a fuselage of elliptical sections ================= */
  const XN = 2.0, XT = -1.5;   // the nose and the tail's root
  const fs = t => { t = cl(t); return t < 0.58 ? Math.pow(Math.sin(Math.PI / 2 * t / 0.58), 0.7) : Math.pow(Math.max(0, Math.cos(Math.PI / 2 * (t - 0.58) / 0.42)), 0.36); };   // (a broad wedge of a head: full width held well forward, a blunt snout)
  const mass = t => 1 + 0.16 * sstep(0.02, 0.3, t) * (1 - sstep(0.62, 0.95, t));   // (a deeper, wider mid-hull: heavy-fronted)
  const fry = t => (0.15 + 0.5 * fs(t)) * mass(t), frz = t => (0.13 + 0.43 * fs(t)) * (1 - 0.3 * sstep(0.78, 1, t)) * mass(t), fzc = t => 0.04 * Math.sin(Math.PI * t) - 0.06 * sstep(0.8, 1, t);
  const fx = t => lerp(XT, XN, t);
  const fus = (t, ph, k) => { k = k || 1; return [fx(t), fry(t) * Math.cos(ph) * k, fzc(t) + frz(t) * Math.sin(ph) * k]; };
  // the head's own section: squarer and flatter than the hull's, its top sloping down to the snout (a wedge); it meets the hull's at T_HEAD
  const hsec = (t, ph, k) => { k = k || 1; const w = sstep(0.64, 0.74, t), c = Math.cos(ph), sn = Math.sin(ph), sq = (v, pw) => (v < 0 ? -1 : 1) * Math.pow(Math.abs(v), pw), wedge = 1 - 0.56 * sstep(0.72, 1, t);
    const y = fry(t) * lerp(c, sq(c, 0.7) * 1.07, w), z = frz(t) * (sn > 0 ? lerp(sn, sq(sn, 0.8) * 0.92 * wedge, w) : lerp(sn, sq(sn, 0.85), w)); return [fx(t), y * k, fzc(t) + z * k]; };
  const T_HEAD = 0.64, T_FL0 = 0.1, T_JAW = 0.68;   // (the head is 36% of the hull)   // where the head begins; the flanks' rear end; the jaw's hinge
  const JAW_H = [fx(T_JAW), 0, fzc(T_JAW) - 0.1];   // the jaw's hinge line (along y)
  const SEAT0 = [fx(0.575), 0, fzc(0.575) + frz(0.575) - 0.02];   // the cockpit's floor, raised
  const DORS0 = [fx(0.35), 0, fzc(0.35) + frz(0.35) - 0.06], PEC0 = [fx(0.5), 0.56, -0.22];
  const NTAIL = 4, LTAIL = 0.31, TAIL_FOLD = [0, 0, 0, 0], TAIL_NEST = 0.36;   // the tail's links; each link's angle below straight-back when folded (degrees)
  const CAN_L = 0.95, CAN0 = 0.5;   // the mouth cannon: its length; its breech when packed
  const FLANK_OUT = 0.6, FLANK_TILT = 27 * DEG, SEAT_DROP = 0.2, CAN_OUT = 0.9;

  /* ================= meshes ================= */
  let MESH = null, MESH_MS = 0;
  function buildMeshes() {
    const q = lowFx() ? 0.7 : 1, n = v => Math.max(4, Math.round(v * q)), M = {};
    const seam = (t, list) => { for (const s of list) if (Math.abs(t - s) < 0.012) return 1; return 0; };
    const plate = (B, out, th, mat) => { B.prism(out, -th, th, mat, { b: th * 0.6 }); };
    // a raised armour plate on the hull (t s0..s1, angle b0..b1 degrees): a chrome-edged border bevelled down to the shell below (k0), stepping up to kTop
    const armour = (B, s0, s1, b0, b1, k0, kTop, mat, NU2, NV2) => { NU2 = NU2 || 10; NV2 = NV2 || 12; const kk = (u, v) => k0 + (kTop - k0) * Math.min(1, Math.min(u, 1 - u) * NU2 * 1.0, Math.min(v, 1 - v) * NV2 * 1.0);
      B.surf((u, v) => fus(lerp(s0, s1, v), lerp(b0, b1, u) * DEG, kk(u, v)), NU2, NV2, (u, v) => (u < 1.5 / NU2 || u > 1 - 1.5 / NU2 || v < 1.5 / NV2 || v > 1 - 1.5 / NV2 ? M_CHR : mat), { e: (u, v) => (u < 0.5 / NU2 || u > 1 - 0.5 / NU2 || v < 0.5 / NV2 || v > 1 - 0.5 / NV2 ? 1 : Math.abs(u - 2 / NU2) < 0.3 / NU2 || Math.abs(u - 1 + 2 / NU2) < 0.3 / NU2 || Math.abs(v - 2 / NV2) < 0.3 / NV2 || Math.abs(v - 1 + 2 / NV2) < 0.3 / NV2 ? 0.9 : 0) }); };
    const rivets = (B, pts, r) => { for (const p of pts) B.sph(p, r || 0.022, M_CHR, 5); };
    // a strip joining two edge curves (a plate's visible thickness)
    const rim = (B, f0, f1, nn, mat, flip) => B.surf((u, v) => { const a = f0(u), b = f1(u); return [lerp(a[0], b[0], v), lerp(a[1], b[1], v), lerp(a[2], b[2], v)]; }, nn, 1, () => mat, { e: () => 1, flip: !!flip });
    { const B = GLM.builder(q);   // ---- the head: a broad flat wedge. The blue cap with its silver chevron, the chrome snout, cheeks and brow line,
      //      angular cyan eyes under heavy brows, the dark mouth roof, big triangular upper teeth
      const a0 = -14 * DEG, a1 = 194 * DEG;
      // (the grid follows the colour boundaries, so they are clean lines: the cheeks below u 0.2 and above 0.8, the snout beyond v 0.7)
      const tb = u => 0.875 - 0.26 * Math.abs(u - 0.5), tv = (u, v) => (v < 0.7 ? lerp(T_HEAD, tb(u), v / 0.7) : lerp(tb(u), 1, (v - 0.7) / 0.3)), NU = 40, NV = 30;
      B.surf((u, v) => hsec(tv(u, v), lerp(a0, a1, u)), NU, NV, (u, v) => (v > 0.7 - 1e-6 || Math.abs(u - 0.5) > 0.25 - 1e-6 ? M_CHR : M_BLUE), { e: (u, v) => Math.max(Math.abs(v - 0.7) < 0.02 ? 1 : 0, Math.abs(Math.abs(u - 0.5) - 0.25) < 0.014 ? 1 : 0, Math.abs(v - 0.3) < 0.017 ? 1 : 0, Math.abs(v - 0.85) < 0.017 ? 0.9 : 0, u < 0.02 || u > 0.98 || v < 0.03 ? 1 : 0, Math.abs(u - 0.5) < 0.008 && v < 0.5 ? 0.9 : 0) });
      for (const sd of [1, -1]) B.surf((u, v) => { const a = 0.012 + 0.19 * u, t = 0.842 - a * 0.7 + (v - 0.5) * 0.044 * (1 - 0.5 * u); return hsec(t, lerp(a0, a1, 0.5 + sd * a), 1.014); }, 10, 2, () => M_CHR, { e: (u, v) => (v < 0.1 || v > 0.9 ? 0.7 : 0), flip: sd < 0 });   // (the silver chevron on the cap)
      B.ell([XN - 0.03, 0, fzc(1) + 0.01], [0.17, fry(1) * 1.04, frz(1) * 0.74], M_CHR, { seg: n(16), rings: n(8) });                      // (the blunt snout)
      B.surf((u, v) => hsec(lerp(T_HEAD, 0.99, v), lerp(a0, a1, u), 0.86), n(14), n(8), () => M_STEEL, { flip: true });                 // (the mouth's roof)
      rim(B, u => hsec(lerp(T_HEAD + 0.02, 0.985, u), a0), u => hsec(lerp(T_HEAD + 0.02, 0.985, u), a0, 0.86), n(12), M_CHR); rim(B, u => hsec(lerp(T_HEAD + 0.02, 0.985, u), a1), u => hsec(lerp(T_HEAD + 0.02, 0.985, u), a1, 0.86), n(12), M_CHR, true);   // (the upper lip's thickness)
      for (const sd of [1, -1]) { const ph = sd > 0 ? 47 * DEG : 133 * DEG, e = hsec(0.8, ph, 1.03), nb = vnrm([0.12, sd * Math.cos(50 * DEG), Math.sin(50 * DEG)]);   // (on the upper cheek: they show from the game camera)
        B.along(e, vnrm([1, -sd * 0.12, -0.2]), nb);
        const yy = sd > 0 ? -1 : 1, fl = pts => pts.map(q2 => [q2[0], q2[1] * yy]);                                                       // (the frame's own y points up on one side, down on the other)
        B.box([-0.01, 0, -0.03], [0.19, 0.075, 0.03], 0.012, M_STEEL);                                                                     // (the socket)
        B.prism(fl([[-0.19, -0.09], [0.21, -0.03], [0.17, 0.03], [-0.16, 0.055]]), -0.02, 0.03, M_CYAN, { b: 0.006 });                    // (the eye: an angular slit, narrowing to the nose)
        B.prism(fl([[-0.23, 0.055], [0.22, 0.022], [0.26, 0.045], [0.04, 0.09], [-0.25, 0.105]]), -0.03, 0.04, M_CHR, { b: 0.014 });           // (the heavy brow over it)
        B.prism(fl([[-0.2, -0.13], [0.2, -0.1], [0.22, -0.07], [-0.22, -0.095]]), -0.03, 0.03, M_CHR, { b: 0.01 });                         // (the cheek's ridge under it)
        B.pop();
        for (let i = 0; i < 10; i++) { const t = lerp(T_JAW + 0.03, 0.975, i / 9), p = hsec(t, sd > 0 ? a0 : a1, 0.95), L = 0.27 + 0.06 * Math.sin(i * 2.3 + sd) - 0.07 * (i / 9); B.spike([p[0], p[1], p[2] + 0.02], [p[0] + 0.03, p[1] * 0.94, p[2] - L], 0.074 + 0.014 * Math.sin(i * 1.7), M_TOOTH, { seg: 4 }); }
        rivets(B, [0.67, 0.72, 0.77, 0.82].map(t => hsec(t, sd > 0 ? 6 * DEG : 174 * DEG, 1.01))); }
      for (let i = 0; i < 5; i++) { const y = lerp(-0.24, 0.24, i / 4), p = [XN - 0.1, y, fzc(1) - frz(1) * 0.5]; B.spike([p[0], p[1], p[2] + 0.02], [p[0] + 0.03, p[1], p[2] - 0.2 - 0.03 * (i % 2)], 0.066, M_TOOTH, { seg: 4 }); }
      M.head = B.done(); }
    { const B = GLM.builder(q);   // ---- the lower jaw, about its hinge: a thick chrome shell with a blunt chin, hinge bosses, lower teeth, the dark tongue
      const a0 = 200 * DEG, a1 = 340 * DEG, rel = p => vsub(p, JAW_H), jo = (t, ph) => rel(hsec(t, ph, 0.95)), ji = (t, ph) => rel(hsec(t, ph, 0.8));
      B.surf((u, v) => jo(lerp(T_JAW, 0.965, v), lerp(a0, a1, u)), n(24), n(14), () => M_CHR, { e: (u, v) => Math.max(u < 0.03 || u > 0.97 ? 1 : 0, seam(v, [0.34, 0.68]), Math.abs(u - 0.5) < 0.012 ? 0.9 : 0) });
      B.surf((u, v) => ji(lerp(T_JAW, 0.95, v), lerp(a0, a1, u)), n(12), n(6), () => M_STEEL, { flip: true });
      rim(B, u => jo(lerp(T_JAW, 0.965, u), a0), u => ji(lerp(T_JAW, 0.965, u), a0), n(12), M_CHR, true); rim(B, u => jo(lerp(T_JAW, 0.965, u), a1), u => ji(lerp(T_JAW, 0.965, u), a1), n(12), M_CHR);
      B.ell(rel([fx(0.955), 0, fzc(0.955) - frz(0.955) * 0.62]), [0.15, fry(0.955) * 0.9, 0.15], M_CHR, { seg: n(14), rings: 6 });          // (the chin)
      B.box(rel([fx(0.9), 0, fzc(0.9) - frz(0.9) * 0.97]), [0.2, 0.16, 0.03], 0.015, M_STEEL);                                             // (a keel plate under it)
      for (const sd of [1, -1]) { for (let i = 0; i < 9; i++) { const t = lerp(T_JAW + 0.04, 0.955, i / 8), p = jo(t, sd > 0 ? a1 : a0), L = 0.24 + 0.06 * Math.sin(i * 1.9 + 1 + sd) - 0.06 * (i / 8); B.spike([p[0], p[1] * 0.97, p[2] - 0.02], [p[0] - 0.02, p[1] * 0.93, p[2] + L], 0.07 + 0.014 * Math.sin(i * 2.9), M_TOOTH, { seg: 4 }); }
        B.tube([0, sd * 0.46, 0], [0, sd * 0.64, 0], 0.14, 0.13, M_CHR, { seg: n(14), cap0: 'flat', cap1: 'flat' }); B.tube([0, sd * 0.64, 0], [0, sd * 0.67, 0], 0.07, 0.07, M_CYAN, { seg: 10, cap0: 'flat', cap1: 'flat' }); B.torY([0, sd * 0.645, 0], 0.105, 0.022, M_STEEL, { seg: 14, rseg: 4 });   // (a hinge boss)
        B.sph([0.3, sd * 0.58, -0.16], 0.06, M_CHR, 7); }                                                                                    // (the piston's lower eye)
      for (let i = 0; i < 4; i++) { const y = lerp(-0.18, 0.18, i / 3), p = rel([fx(0.972), y, fzc(0.972) - frz(0.972) * 0.4]); B.spike([p[0], p[1], p[2] - 0.02], [p[0], p[1], p[2] + 0.15], 0.052, M_TOOTH, { seg: 4 }); }
      B.tube([0, -0.42, 0], [0, 0.42, 0], 0.07, 0.07, M_STEEL, { cap0: 'flat', cap1: 'flat' });
      M.jaw = B.done(); }
    { const B = GLM.builder(q);   // ---- the mouth cannon, from its breech along +x: a pressure cannon of stepped rings, a glowing lens deep in its bell
      const C = M_CHR, S = M_STEEL;
      B.lathe([[0, 0.12, S], [0, 0.19, S], [0.24, 0.19, S], [0.24, 0.225, C], [0.31, 0.225, C], [0.31, 0.195, S], [0.5, 0.195, S], [0.5, 0.235, C], [0.58, 0.235, C], [0.58, 0.205, S], [0.72, 0.21, S], [0.72, 0.25, C], [0.8, 0.255, C], [CAN_L, 0.27, C], [CAN_L + 0.02, 0.25, C], [CAN_L - 0.02, 0.215, S], [CAN_L - 0.14, 0.2, S]], S, { seg: n(24) });
      B.ell([CAN_L - 0.05, 0, 0], [0.035, 0.215, 0.215], M_CYAN, { seg: n(16), rings: 5 });   // (the lens, near the lip: it glows in the resting mouth's gap) B.torX([CAN_L - 0.1, 0, 0], 0.15, 0.022, M_CHR, { seg: n(18), rseg: 4 }); B.torX([CAN_L - 0.06, 0, 0], 0.2, 0.018, M_STEEL, { seg: n(18), rseg: 4 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; B.sph([0.76, Math.cos(a) * 0.255, Math.sin(a) * 0.255], 0.022, M_STEEL, 5); B.box([0.4, Math.cos(a) * 0.2, Math.sin(a) * 0.2], [0.07, 0.012, 0.012], 0, M_CYAN); }
      for (const sd of [1, -1]) B.tube([-0.3, sd * 0.17, 0], [0.22, sd * 0.17, 0], 0.035, 0.035, M_CHR, { seg: 8 });                         // (the mount's slide rods)
      M.cannon = B.done(); }
    { const B = GLM.builder(q);   // ---- the core: the spine, the reactor (a cyan cylinder in a chrome and dark-steel cage), the chrome belly, the top spine plate, the fins' sockets, the stern's nozzle
      B.tube([XT + 0.1, 0, 0], [fx(T_HEAD) + 0.05, 0, 0], 0.25, 0.3, M_STEEL, { seg: n(16), cap0: 'round', cap1: 'flat' });
      B.tube([-0.72, 0, 0], [0.5, 0, 0], 0.33, 0.33, M_CYAN, { seg: n(22), cap0: 'flat', cap1: 'flat' });
      for (const x of [-0.74, 0.52]) B.lathe([[x - 0.06, 0.26, M_STEEL], [x - 0.06, 0.4, M_CHR], [x + 0.06, 0.4, M_CHR], [x + 0.06, 0.26, M_STEEL]], M_CHR, { seg: n(22) });   // (the end bulkheads)
      for (const x of [-0.43, -0.11, 0.21]) { B.torX([x, 0, 0], 0.36, 0.035, M_CHR, { seg: n(22), rseg: 5 }); B.torX([x + 0.05, 0, 0], 0.345, 0.014, M_STEEL, { seg: n(22), rseg: 4 }); }
      for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * TAU, c = Math.cos(a) * 0.385, s = Math.sin(a) * 0.385; B.tube([-0.74, c, s], [0.52, c, s], 0.03, 0.03, M_STEEL, { seg: 6 }); for (const x of [-0.6, -0.27, 0.05, 0.37]) B.sph([x, c, s], 0.04, M_CHR, 5); }
      B.surf((u, v) => fus(lerp(T_FL0, T_HEAD + 0.01, v), lerp(216, 324, u) * DEG), n(16), n(20), () => M_CHR, { e: (u, v) => Math.max(seam(v, [0.25, 0.5, 0.75]), u < 0.04 || u > 0.96 ? 1 : 0, Math.abs(u - 0.5) < 0.015 ? 0.9 : 0) });
      B.surf((u, v) => fus(lerp(T_FL0, 0.5, v), lerp(60, 120, u) * DEG), 12, n(14), (u, v) => (Math.abs(u - 0.5) < 1 / 12 + 1e-6 ? M_CHR : M_BLUE), { e: (u, v) => Math.max(seam(v, [0.33, 0.66]), u < 0.05 || u > 0.95 || v < 0.03 || v > 0.97 ? 1 : 0, Math.abs(Math.abs(u - 0.5) - 0.09) < 0.02 ? 1 : 0) });
      rim(B, u => fus(lerp(T_FL0, 0.5, u), 60 * DEG), u => fus(lerp(T_FL0, 0.5, u), 60 * DEG, 0.9), n(8), M_STEEL); rim(B, u => fus(lerp(T_FL0, 0.5, u), 120 * DEG), u => fus(lerp(T_FL0, 0.5, u), 120 * DEG, 0.9), n(8), M_STEEL, true);
      for (const sd of [1, -1]) { B.tube([PEC0[0], sd * 0.3, PEC0[2]], [PEC0[0], sd * 0.46, PEC0[2]], 0.17, 0.15, M_CHR, { seg: n(14), cap0: 'flat', cap1: 'flat' }); B.tube([PEC0[0], 0, 0], [PEC0[0], sd * 0.3, PEC0[2]], 0.09, 0.09, M_STEEL, { seg: 8 });   // (a pectoral's socket on its stub arm)
        rivets(B, [0.15, 0.25, 0.35, 0.45].map(t => fus(t, sd > 0 ? 64 * DEG : 116 * DEG, 1.01))); }
      for (let i = 0; i < 4; i++) for (const sd of [1, -1]) armour(B, 0.115 + i * 0.097, 0.215 + i * 0.097, sd > 0 ? 62 : 97, sd > 0 ? 83 : 118, 1.0, 1.05 + 0.006 * i, M_BLUE, 8, 8);   // (the spine's row of plates, either side of the fin's rail)
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); plate(B, [[fx(0.6), -0.5], [fx(0.6) - 0.1, -0.74], [fx(0.2), -0.7], [fx(0.12), -0.42]], 0.05, M_CHR); B.pop();                       // (the chrome keel)
      B.box([DORS0[0], 0, DORS0[2] - 0.02], [0.5, 0.075, 0.04], 0.02, M_CHR);                                                               // (the dorsal fin's hinge rail)
      B.lathe([[XT + 0.12, 0.26, M_CHR], [XT - 0.02, 0.3, M_CHR], [XT - 0.1, 0.27, M_CHR], [XT - 0.08, 0.2, M_STEEL], [XT + 0.02, 0.17, M_STEEL]], M_CHR, { seg: n(18) }); B.ell([XT + 0.0, 0, 0], [0.04, 0.17, 0.17], M_CYAN, { seg: n(12), rings: 5 });
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.78; B.box([XT - 0.04, Math.cos(a) * 0.14, Math.sin(a) * 0.14], [0.05, 0.012 + 0.07 * Math.abs(Math.cos(a)), 0.012 + 0.07 * Math.abs(Math.sin(a))], 0.004, M_STEEL); }
      M.core = B.done(); }
    { const B = GLM.builder(q);   // ---- the right flank plate: layered curved armour with real thickness: the main shell (a chrome lower border and a silver stripe),
      //      a raised shoulder plate over it, four slanted cyan gill slots in a chrome frame, rivets
      const a0 = -34 * DEG, a1 = 60 * DEG, t0 = T_FL0, t1 = T_HEAD, o = (t, a, k) => fus(t, a, k == null ? 1.02 : k);
            B.surf((u, v) => o(lerp(t0, t1, v), lerp(a0, a1, u)), 24, n(30), (u, v) => (u < 1 / 3 + 1e-6 ? M_CHR : M_BLUE), { e: (u, v) => Math.max(seam(v, [0.25, 0.5, 0.75]), u < 0.03 || u > 0.97 || v < 0.025 || v > 0.975 ? 1 : 0, Math.abs(u - 1 / 3) < 0.014 ? 1 : 0) });
      B.surf((u, v) => fus(lerp(t0, t1, v), lerp(a0, a1, u), 0.92), n(10), n(12), () => M_STEEL, { flip: true });
      rim(B, u => o(lerp(t0, t1, u), a0), u => fus(lerp(t0, t1, u), a0, 0.92), n(16), M_CHR, true); rim(B, u => o(lerp(t0, t1, u), a1), u => fus(lerp(t0, t1, u), a1, 0.92), n(16), M_BLUE);
      rim(B, u => o(t0, lerp(a0, a1, u)), u => fus(t0, lerp(a0, a1, u), 0.92), n(10), M_BLUE); rim(B, u => o(t1, lerp(a0, a1, u)), u => fus(t1, lerp(a0, a1, u), 0.92), n(10), M_BLUE, true);
      // three overlapping armour plates (rear to front, each a step higher than the one behind it), chrome-edged
      armour(B, 0.12, 0.3, 4, 60, 1.02, 1.065, M_BLUE); armour(B, 0.265, 0.455, 4, 60, 1.03, 1.09, M_BLUE); armour(B, 0.42, T_HEAD - 0.02, 16, 60, 1.04, 1.115, M_BLUE);
      for (const [tt, kk2] of [[0.21, 1.075], [0.36, 1.1], [0.52, 1.125]]) B.surf((u, v) => fus(tt + 0.055 * (u - 0.5) + (Math.abs(v - 0.5) - 0.25) * 0.09, lerp(24, 52, v) * DEG + 0, kk2), 2, 8, () => M_CHR, { e: (u, v) => (u < 0.1 || u > 0.9 ? 0.7 : 0) });   // (a silver chevron on each)
      rivets(B, [0.15, 0.27, 0.3, 0.42, 0.45, 0.58].map(t => fus(t, 54 * DEG, 1.1)));
      // the gills: a dark frame with a chrome border, four slanted cyan slots, low on the shoulder
      armour(B, 0.455, 0.615, -16, 12, 1.02, 1.07, M_STEEL, 8, 10);
      for (let i = 0; i < 4; i++) { const t = 0.487 + i * 0.03, pa = fus(t, -11 * DEG, 1.085), pb = fus(t + 0.016, -2 * DEG, 1.085), pc = fus(t, 7 * DEG, 1.085); B.tube(pa, pb, 0.026, 0.026, M_CYAN, { seg: 6, cap0: 'round', cap1: 'round' }); B.tube(pb, pc, 0.026, 0.026, M_CYAN, { seg: 6, cap0: 'round', cap1: 'round' }); }
      rivets(B, [0.14, 0.24, 0.34, 0.44, 0.54].map(t => fus(t, -24 * DEG, 1.03)));
      for (const t of [0.2, 0.52]) { B.box(fus(t, 12 * DEG, 0.8), [0.07, 0.04, 0.08], 0.02, M_STEEL); }                                     // (the rails' sockets behind the plate)
      M.flank = B.done(); }
    { const B = GLM.builder(q);   // ---- the flank rails: four pairs of captive rods across the hull, unit half-length (the rig stretches them along y)
      for (const x of [-0.95, -0.45, 0.25, 0.72]) for (const z of [0.16, -0.16]) { B.tube([x, -1, z], [x, 1, z], 0.04, 0.04, M_STEEL, { cap0: 'round', cap1: 'round' }); B.tube([x, -0.6, z], [x, 0.6, z], 0.055, 0.055, M_CHR, { seg: 8 }); B.sph([x, 1, z], 0.06, M_CHR, 6); B.sph([x, -1, z], 0.06, M_CHR, 6); }
      M.rails = B.done(); }
    { const B = GLM.builder(q);   // ---- a strut: a piston of unit length along +x (the rig stretches it between two eyes): a sleeve, a polished rod
      B.tube([0, 0, 0], [0.55, 0, 0], 0.05, 0.05, M_STEEL, { seg: 8, cap0: 'round', cap1: 'flat' }); B.tube([0.5, 0, 0], [1, 0, 0], 0.028, 0.028, M_CHR, { seg: 6, cap1: 'round' }); B.torX([0.55, 0, 0], 0.05, 0.014, M_CHR, { seg: 8, rseg: 4 });
      M.strut = B.done(); }
    { const B = GLM.builder(q);   // ---- a lock: a chrome latch on a dark slide (it seats on a flank plate's inner edge at the end of the change)
      B.box([0, 0, 0], [0.07, 0.09, 0.045], 0.015, M_STEEL); B.box([0, 0.08, 0], [0.05, 0.035, 0.07], 0.012, M_CHR); B.box([0, 0.118, 0], [0.03, 0.006, 0.03], 0, M_CYAN);
      M.lock = B.done(); }
    // ---- the cockpit (its floor at the origin): a tub with a chrome rim, a padded seat, a framed windscreen, a console with cyan screens
    { const B = GLM.builder(q);
      B.push([0, 0, 1], [0, 1, 0], [-1, 0, 0], [0, 0, 0]);                                                                                  // (the tub: a lathe about the vertical)
      B.lathe([[0.0, 0.0, M_STEEL], [0.0, 0.27, M_STEEL], [0.1, 0.31, M_STEEL], [0.16, 0.33, M_CHR], [0.2, 0.33, M_CHR], [0.2, 0.28, M_CHR], [0.1, 0.26, M_STEEL], [0.03, 0.22, M_STEEL], [0.03, 0.0, M_STEEL]], M_STEEL, { seg: n(20) });
      B.pop();
      B.box([-0.08, 0, 0.07], [0.13, 0.15, 0.035], 0.03, M_SEAT); B.box([-0.22, 0, 0.21], [0.04, 0.15, 0.13], 0.03, M_SEAT); B.box([-0.24, 0, 0.37], [0.035, 0.08, 0.045], 0.02, M_SEAT);   // (the cushion, the back, the headrest)
      for (const sd of [1, -1]) { B.box([-0.08, sd * 0.19, 0.12], [0.12, 0.025, 0.03], 0.012, M_CHR); B.tube([0.2, sd * 0.24, 0.18], [0.3, sd * 0.13, 0.36], 0.02, 0.02, M_CHR, { seg: 6 }); B.tube([0.2, sd * 0.24, 0.18], [0.02, sd * 0.31, 0.2], 0.018, 0.018, M_CHR, { seg: 6 }); }
      B.tube([0.3, -0.13, 0.36], [0.3, 0.13, 0.36], 0.02, 0.02, M_CHR, { seg: 6, cap0: 'round', cap1: 'round' });
      B.facet([[0.21, -0.23, 0.19], [0.21, 0.23, 0.19], [0.295, 0.125, 0.35], [0.295, -0.125, 0.35]], M_GLASS); B.facet([[0.295, -0.125, 0.35], [0.295, 0.125, 0.35], [0.21, 0.23, 0.19], [0.21, -0.23, 0.19]], M_GLASS);
      B.box([0.15, 0, 0.13], [0.05, 0.13, 0.05], 0.015, M_STEEL); for (const y of [-0.07, 0.07]) B.box([0.118, y, 0.165], [0.012, 0.045, 0.022], 0.004, M_CYAN); B.tube([0.1, 0, 0.14], [0.04, 0, 0.2], 0.012, 0.012, M_CHR, { seg: 5 }); B.torY([0.03, 0, 0.21], 0.04, 0.01, M_STEEL, { seg: 10, rseg: 4 });   // (the console, two screens, the yoke)
      M.cockpit = B.done(); }
    { const B = GLM.builder(q);   // ---- the dorsal fin, from its root: a tall swept blade (x-z plane): a silver leading edge and root, a swoosh marking
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]);
      plate(B, [[0.52, 0], [-0.34, 1.3], [-0.72, 1.28], [-0.5, 0.86], [-0.42, 0.42], [-0.56, 0]], 0.04, M_BLUE);
      plate(B, [[0.56, 0], [-0.3, 1.31], [-0.4, 1.31], [0.38, 0.06], [0.34, 0]], 0.052, M_CHR);                                             // (the leading edge)
      plate(B, [[0.56, 0], [0.42, 0.17], [-0.5, 0.17], [-0.58, 0]], 0.056, M_CHR);                                                        // (the root)
      plate(B, [[0.1, 0.4], [-0.3, 1.0], [-0.42, 1.02], [-0.2, 0.62], [-0.32, 0.36]], 0.046, M_CHR);                                        // (the marking)
      for (const x of [-0.4, -0.1, 0.2]) B.sph([x, 0.09, 0], 0.058, M_STEEL, 6);
      B.pop(); M.dorsal = B.done(); }
    { const B = GLM.builder(q);   // ---- the right pectoral fin, from its root joint: a broad swept blade (x-y plane): a silver leading edge, a marking, the joint with its cyan ring
      plate(B, [[0.42, 0], [-0.46, 1.48], [-0.92, 1.44], [-0.62, 0.8], [-0.66, 0]], 0.036, M_BLUE);
      plate(B, [[0.46, 0], [-0.42, 1.5], [-0.54, 1.5], [0.3, 0.06], [0.26, 0]], 0.047, M_CHR);
      plate(B, [[0.46, 0], [0.34, 0.15], [-0.64, 0.15], [-0.7, 0]], 0.05, M_CHR);
      plate(B, [[-0.12, 0.64], [-0.38, 1.05], [-0.47, 1.05], [-0.31, 0.78], [-0.4, 0.62]], 0.042, M_CHR);
      B.tube([0, -0.1, 0], [0, 0.12, 0], 0.16, 0.14, M_CHR, { seg: n(14), cap0: 'flat', cap1: 'round' }); B.torY([0, 0.0, 0], 0.165, 0.03, M_CYAN, { seg: n(16), rseg: 5 }); B.torY([0, 0.07, 0], 0.15, 0.02, M_STEEL, { seg: n(14), rseg: 4 });
      M.pec = B.done(); }
    { const B = GLM.builder(q);   // ---- a pectoral's inner panel (the same frame): it slides out of the trailing edge as the fin becomes a stabiliser
      plate(B, [[-0.5, 0.54], [-0.58, 1.3], [-0.98, 1.2], [-1.0, 0.58]], 0.026, M_BLUE); plate(B, [[-0.92, 0.57], [-0.9, 1.22], [-1.0, 1.2], [-1.02, 0.57]], 0.034, M_CHR);
      for (const y of [0.5, 0.8, 1.1]) B.box([-0.72, y, 0], [0.2, 0.012, 0.034], 0.004, M_STEEL);
      M.pecIn = B.done(); }
    for (let j = 0; j < NTAIL; j++) { const B = GLM.builder(q), r0 = lerp(0.25, 0.1, j / NTAIL), r1 = lerp(0.25, 0.1, (j + 1) / NTAIL);   // ---- a tail link, along +x from its joint: an armoured blue sleeve between chrome collars, a cyan line, a dark joint
      B.sph([0, 0, 0], r0 * 0.92, M_STEEL, n(10));
      B.lathe([[0.04, r0 * 0.8, M_CHR], [0.04, r0 * 1.06, M_CHR], [0.1, r0 * 1.06, M_CHR], [0.1, r0 * 0.97, j % 2 ? M_CHR : M_BLUE], [LTAIL - 0.09, r1 * 1.0, j % 2 ? M_CHR : M_BLUE], [LTAIL - 0.09, r1 * 1.1, M_CHR], [LTAIL - 0.04, r1 * 1.1, M_CHR], [LTAIL - 0.04, r1 * 0.8, M_CHR]], M_BLUE, { seg: n(16) });
      B.tube([0.1, 0, r0 * 0.97], [LTAIL - 0.09, 0, r1 * 1.0], 0.022, 0.022, M_CYAN, { seg: 5, cap0: 'round', cap1: 'round' });
      for (const sd of [1, -1]) B.box([LTAIL * 0.5, sd * (r0 + r1) * 0.5, 0], [0.07, 0.012, 0.05], 0.006, M_CHR);
      if (j === 1) { B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); plate(B, [[0.3, r0 * 0.8], [-0.02, r0 + 0.3], [-0.14, r0 + 0.28], [0.04, r0 * 0.8]], 0.02, M_BLUE); plate(B, [[0.28, -r0 * 0.8], [0.02, -r0 - 0.2], [-0.08, -r0 - 0.18], [0.06, -r0 * 0.8]], 0.02, M_CHR); B.pop(); }   // (the small second dorsal and the anal fin)
      M['tail' + j] = B.done(); }
    { const B = GLM.builder(q);   // ---- the tail fin: a hub with a cyan ring and a large crescent of two lobes (x-z plane), silver leading edges
      B.tube([0, -0.09, 0], [0, 0.09, 0], 0.14, 0.14, M_CHR, { seg: n(14), cap0: 'flat', cap1: 'flat' }); B.torY([0, 0.095, 0], 0.1, 0.025, M_CYAN, { seg: 14, rseg: 4 }); B.torY([0, -0.095, 0], 0.1, 0.025, M_CYAN, { seg: 14, rseg: 4 });
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]);
      plate(B, [[0.0, 0.06], [0.34, 0.72], [0.74, 1.3], [0.84, 1.22], [0.6, 0.62], [0.36, 0.1]], 0.03, M_BLUE); plate(B, [[0.0, -0.06], [0.3, -0.5], [0.56, -0.86], [0.66, -0.8], [0.48, -0.42], [0.34, -0.08]], 0.03, M_BLUE);
      plate(B, [[-0.04, 0.06], [0.3, 0.74], [0.72, 1.32], [0.76, 1.3], [0.4, 0.7], [0.06, 0.06]], 0.04, M_CHR); plate(B, [[-0.04, -0.06], [0.27, -0.52], [0.54, -0.88], [0.58, -0.86], [0.36, -0.5], [0.06, -0.06]], 0.04, M_CHR);
      plate(B, [[0.3, 0.42], [0.54, 0.9], [0.62, 0.88], [0.44, 0.44]], 0.036, M_CHR);
      B.pop(); M.tailfin = B.done(); }
    return M;
  }
  const PARTS = { head: { c: [1.55, 0, 0], R: 0.85, col: '#2B4FC9' }, jaw: { c: [0.42, 0, -0.2], R: 0.7, col: '#C9D1DC' }, cannon: { c: [0.4, 0, 0], R: 0.78, col: '#3A4250' }, core: { c: [-0.2, 0, 0], R: 1.75, col: '#2B303B' }, flank: { c: [-0.1, 0.4, 0], R: 1.45, col: '#2B4FC9' },
    cockpit: { c: [0, 0, 0.1], R: 0.45, col: '#8FA0B8' }, rails: { c: [-0.1, 0, 0], R: 1.4, col: '#2B303B' }, dorsal: { c: [-0.1, 0, 0.65], R: 1.0, col: '#2B4FC9' }, pec: { c: [-0.2, 0.75, 0], R: 1.1, col: '#2B4FC9' }, pecIn: { c: [-0.75, 0.75, 0], R: 0.7, col: '#2B4FC9' }, tailfin: { c: [0.4, 0, 0.2], R: 1.15, col: '#2B4FC9' }, strut: { c: [0.5, 0, 0], R: 0.12, col: '#8FA0B8' }, lock: { c: [0, 0.05, 0], R: 0.16, col: '#C9D1DC' } };
  for (let j = 0; j < NTAIL; j++) PARTS['tail' + j] = { c: [LTAIL / 2, 0, 0], R: 0.36, col: '#2B4FC9' };

  /* ================= the rig ================= */
  function rig(P) {
    const xf = cl(P.xf || 0), list = [], A = {};
    const sFin = sstep(0, 0.4, xf), sFl = sstep(0.12, 0.6, xf), sCan = sstep(0.3, 0.78, xf), sSeat = sstep(0.35, 0.8, xf), sTail = sstep(0.4, 1, xf);
    const Bm = mm(rotY(P.pitch || 0), rotX(P.bank || 0)), at = p => mv(Bm, p), put = (part, o, R, s, al) => list.push({ part, o: at(o), R: mm(Bm, R), s: s || 1, al: al == null ? 1 : al });
    const sw = P.swim || 0, sk = (P.swimK == null ? 0.5 : P.swimK) * (1 - sTail), bodyYaw = 0.085 * sk * Math.sin(sw + 1.2);   // (the body counter-flexes against the tail)
    const Rb = rotZ(bodyYaw);
    put('core', [0, 0, 0], Rb);
    { const hl = fry(0.5) * 0.82 + FLANK_OUT * sFl, Rr = mm(Bm, Rb); list.push({ part: 'rails', o: at([0, 0, 0]), R: M3(Rr.x, vmul(Rr.y, hl), Rr.z), s: 1, al: 1 }); }   // (the rails reach exactly to the plates)
    // the flank plates, on their rails
    { const out = FLANK_OUT * sFl + 0.02 * (P.breath || 0); const tl = FLANK_TILT * sFl, Rl = rotX(tl), Rr2 = rotX(-tl), c0 = [0, 0.7, 0.1], c1 = [0, -0.7, 0.1];   // (slid out and turned flat-topped about their own middles: a broad deck each side, the reactor open between them)
      put('flank', mv(Rb, vadd([0, out, -0.04 * sFl], vsub(c0, mv(Rl, c0)))), mm(Rb, Rl)); put('flank', mv(Rb, vadd([0, -out, -0.04 * sFl], vsub(c1, mv(Rr2, c1)))), mm(Rb, mm(Rr2, MIR)));
      const strut = (a, b, al) => { const d = vsub(b, a), L = vlen(d), F = mm(Bm, frameXZ(d, [0, 0, 1])); list.push({ part: 'strut', o: at(a), R: M3(vmul(F.x, L), F.y, F.z), s: 1, al }); };
      const sLock = sstep(0.84, 1, xf), aF = 1;   // (the arms and the latches are there in both forms: stowed inside the closed plates in the shark)
      for (const sd of [1, -1]) { for (const x of [-0.7, 0.34]) { strut(mv(Rb, [x, sd * 0.3, 0.26]), mv(Rb, [x + 0.22, sd * (fry(0.5) * 0.8 + out), 0.02]), aF); strut(mv(Rb, [x + 0.1, sd * 0.3, -0.24]), mv(Rb, [x - 0.12, sd * (fry(0.5) * 0.8 + out), -0.22]), aF); }   // (the support arms)
        for (const x of [-0.82, -0.2, 0.52]) { const y = fry(0.5) * 0.82 + out - 0.2 + 0.1 * sLock; list.push({ part: 'lock', o: at(mv(Rb, [x, sd * y, 0.3 - 0.05 * sFl])), R: mm(Bm, sd > 0 ? Rb : mm(Rb, MIR)), s: 1, al: aF }); } }   // (the latches: they slide out and seat on the plates' inner edges as the change ends)
      A.lock = sLock; }
    // the head, the jaw and the cannon
    { const jawA = Math.max(cl(P.jaw || 0), 0.8 * sCan, 0.16) * 40 * DEG,   // (at rest the mouth hangs a little open: the teeth and the dark interior show)
      rec = (P.recoil || 0) * 0.16, cx = CAN0 + CAN_OUT * sCan + 0.25 * cl(P.cannon || 0) - rec;
      put('cannon', mv(Rb, [cx, 0, fzc(0.8) - 0.05]), Rb); put('head', [0, 0, 0], Rb); put('jaw', mv(Rb, JAW_H), mm(Rb, rotY(jawA)));
      for (const sd of [1, -1]) { const a = mv(Rb, [fx(T_JAW + 0.012), sd * 0.6, 0.1]), b = mv(Rb, vadd(JAW_H, mv(rotY(jawA), [0.3, sd * 0.58, -0.16]))), d = vsub(b, a), L = vlen(d), F = mm(Bm, frameXZ(d, [1, 0, 0])); list.push({ part: 'strut', o: at(a), R: M3(vmul(F.x, L), F.y, F.z), s: 1, al: 1 }); }   // (the jaw's pistons)
      A.mouth = at(mv(Rb, [cx + CAN_L, 0, fzc(0.8) - 0.05])); A.breech = at(mv(Rb, [cx, 0, fzc(0.8) - 0.05])); A.forward = at(mv(Rb, [1, 0, 0])); A.head = at(mv(Rb, [fx(0.86), 0, fzc(0.86) + frz(0.86)])); A.snout = at(mv(Rb, [XN, 0, fzc(1)])); }
    // the cockpit and the pet's seat
    { const o = [SEAT0[0], 0, SEAT0[2] - SEAT_DROP * sSeat]; put('cockpit', mv(Rb, o), Rb); A.seat = at(mv(Rb, [o[0] - 0.06, 0, o[2] + 0.1])); }
    // the dorsal fin: raked back as the command spine
    { const o = [DORS0[0] - 0.12 * sSeat, 0, DORS0[2] - 0.05 * sSeat], R = mm(Rb, rotY(-(22 * sFl) * DEG)); put('dorsal', mv(Rb, o), mm(R, rotX(0.06 * sk * Math.sin(sw + 0.6)))); A.dorsalTip = at(mv(Rb, vadd(o, mv(R, [-0.5, 0, 1.28])))); }
    // the pectoral fins: swept and drooped for swimming, spread level as stabilisers
    for (const sd of [1, -1]) { const flap = 0.1 * (1 - sFin) * Math.sin(sw * 0.5 + (sd > 0 ? 0 : 0.5)) + (P.fin || 0) * 0.3, R0 = mm(rotX((lerp(-24, 0, sFin)) * DEG + flap), rotZ(lerp(34, 8, sFin) * DEG)), R = sd > 0 ? R0 : mm(MIR, mm(R0, MIR)), s = lerp(1, 1.18, sFin);
      const o = [PEC0[0] - 0.1 * sFin, sd * (PEC0[1] + FLANK_OUT * sFl), PEC0[2] + 0.2 * sFl]; const Rp = mm(Rb, sd > 0 ? R : mm(R, MIR)); { const a2 = mv(Rb, [PEC0[0], sd * 0.44, PEC0[2]]), d2 = vsub(mv(Rb, o), a2), L2 = vlen(d2), F2 = mm(Bm, frameXZ(d2, [0, 0, 1])); list.push({ part: 'strut', o: at(a2), R: M3(vmul(F2.x, L2), vmul(F2.y, 1.8), vmul(F2.z, 1.8)), s: 1, al: 1 }); } list.push({ part: 'pecIn', o: at(mv(Rb, vadd(o, mv(Rp, [0.36 * (1 - sFin) * s, 0, 0])))), R: mm(Bm, Rp), s, al: 1 }); list.push({ part: 'pec', o: at(mv(Rb, o)), R: mm(Bm, Rp), s, al: 1 });   // (the inner panel slides out of the trailing edge)
      A[sd > 0 ? 'finL' : 'finR'] = at(mv(Rb, vadd(o, mv(R, [-0.7 * s, sd * 1.46 * s, 0])))); A[sd > 0 ? 'gillL' : 'gillR'] = at(mv(Rb, vadd(fus(0.535, -2 * DEG, 1.09), [0, 0, 0]).map((v, i) => (i === 1 ? sd * (v + FLANK_OUT * sFl) : v)))); }
    // the tail: a swimming chain, or folded down and forward under the stern, its fin turned to control surfaces
    { let p = mv(Rb, [XT, 0, 0]), F = null, dir = [-1, 0, 0];
      for (let j = 0; j < NTAIL; j++) { const th = TAIL_FOLD[j] * DEG * sTail, ps = sk * 0.52 * Math.sin(sw - (j + 1) * 0.95) * (j + 1) / NTAIL + (P.tail || 0) * 0.5 * (j + 1) / NTAIL;
        dir = mv(Rb, [-Math.cos(th) * Math.cos(ps), Math.sin(ps), -Math.sin(th) * Math.cos(ps)]); F = frameXZ(dir, th > 1.2 ? [-1, 0, 0] : [0, 0, 1]); put('tail' + j, p, F); p = vadd(p, vmul(dir, LTAIL * 0.92 * lerp(1, TAIL_NEST, sTail))); }   // (in Leviathan the links telescope into one another: a short stern)
      put('tailfin', p, mm(F, rotX(sTail * Math.PI / 2)), lerp(1, 0.9, sTail)); A.tailTip = at(vadd(p, vmul(dir, 0.5))); A.jet = at(mv(Rb, [XT - 0.1, 0, 0])); }
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
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: tl(LW), ls: tl(SBW), lr: tl(RIMW), up: tl(UPW), low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: nowMs() / 1000, outline: Math.max(1, 1.4 * (W / bw) * (o.outlineK || 1)), clip: P.waterline != null ? [(P.waterline - V.z) / V.sc, 0.07] : null };   // (waterline: a world height above the floor; nothing of the model below it is drawn)
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
  /* the 2D picture (no usable GPU): each part's silhouette (the convex outline of a few of its own points, as seen), far to
     near, in its colour with a dark-blue line; the eyes, the gills, the reactor and the cannon's lens in cyan */
  const OUTL = (() => { const O = {}, ring = (f, ts, phs) => { const a = []; for (const t of ts) for (const ph of phs) a.push(f(t, ph * DEG)); return a; }, xz = pts => pts.map(q => [q[0], 0, q[1]]), xy = pts => pts.map(q => [q[0], q[1], 0]);
    O.head = ring(hsec, [T_HEAD, 0.72, 0.8, 0.9, 0.97, 1], [-14, 20, 55, 90, 125, 160, 194]).concat([[XN + 0.12, 0, fzc(1)]]);
    O.jaw = ring((t, ph) => vsub(hsec(t, ph, 0.95), JAW_H), [T_JAW, 0.82, 0.965], [200, 235, 270, 305, 340]).concat([vsub([fx(0.99), 0, fzc(0.97) - frz(0.97) * 0.6], JAW_H)]);
    O.core = ring((t, ph) => fus(t, ph, 0.82), [0.1, 0.4, 0.72], [0, 45, 90, 135, 180, 225, 270, 315]).concat([[XT - 0.1, 0, 0.27], [XT - 0.1, 0, -0.27], [XT - 0.1, 0.27, 0], [XT - 0.1, -0.27, 0]]);
    O.flank = ring((t, ph) => fus(t, ph, 1.04), [T_FL0, 0.3, 0.5, T_HEAD], [-34, -10, 13, 37, 60]);
    O.cannon = []; for (const [x, r] of [[0, 0.19], [0.7, 0.21], [CAN_L, 0.27]]) for (let i = 0; i < 8; i++) O.cannon.push([x, Math.cos(i / 8 * TAU) * r, Math.sin(i / 8 * TAU) * r]);
    O.cockpit = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; O.cockpit.push([Math.cos(a) * 0.33, Math.sin(a) * 0.33, 0.2], [Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0]); } O.cockpit.push([0.3, 0.13, 0.36], [0.3, -0.13, 0.36], [-0.24, 0, 0.42]);
    O.dorsal = xz([[0.56, 0], [-0.3, 1.31], [-0.72, 1.28], [-0.58, 0]]); O.pec = xy([[0.46, 0], [-0.42, 1.5], [-0.92, 1.44], [-0.7, 0]]); O.pecIn = xy([[-0.5, 0.3], [-0.58, 1.3], [-0.98, 1.2], [-1.0, 0.34]]);
    O.tailfin = xz([[-0.04, 0.1], [0.72, 1.32], [0.84, 1.22], [0.4, 0], [0.66, -0.8], [0.54, -0.88], [-0.04, -0.1]]);
    for (let j = 0; j < NTAIL; j++) { const r0 = lerp(0.25, 0.1, j / NTAIL) * 1.06, r1 = lerp(0.25, 0.1, (j + 1) / NTAIL) * 1.06; O['tail' + j] = [[0, r0, 0], [0, -r0, 0], [0, 0, r0], [0, 0, -r0], [LTAIL, r1, 0], [LTAIL, -r1, 0], [LTAIL, 0, r1], [LTAIL, 0, -r1]]; }
    return O; })();
  function hull2(P) { P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } lo.pop(); up.pop(); return lo.concat(up); }
  function drawFallback(c, V, R, al0, P) {
    const L = R.list.map(it => ({ it, d: V.depth(vadd(it.o, mv(it.R, PARTS[it.part].c))) })).sort((a, b) => a.d - b.d), k = V.k, g = cl(0.35 + 0.65 * (P && P.glow != null ? P.glow : 0.5)); c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    const W = (it, q) => V.toS(vadd(it.o, mv(it.R, vmul(q, it.s))));
    for (const { it } of L) { const Pt = PARTS[it.part], pts = OUTL[it.part]; c.globalAlpha = al0 * it.al;
      if (it.part === 'strut') { const a = V.toS(it.o), b = V.toS(vadd(it.o, it.R.x)); c.strokeStyle = '#9FB0C6'; c.lineWidth = Math.max(1, 0.06 * k); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); continue; }
      if (!pts) continue; const H = hull2(pts.map(q => W(it, q))); if (H.length < 3) continue;
      c.beginPath(); c.moveTo(H[0][0], H[0][1]); for (let i = 1; i < H.length; i++) c.lineTo(H[i][0], H[i][1]); c.closePath();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const h of H) { if (h[0] < x0) x0 = h[0]; if (h[0] > x1) x1 = h[0]; if (h[1] < y0) y0 = h[1]; if (h[1] > y1) y1 = h[1]; }
      const gr = c.createLinearGradient(0, y0, 0, y1), blue = Pt.col === '#2B4FC9'; gr.addColorStop(0, blue ? '#4D7BEF' : it.part === 'core' ? '#3A4352' : '#E6ECF4'); gr.addColorStop(0.55, Pt.col); gr.addColorStop(1, blue ? '#16307F' : it.part === 'core' ? '#161A24' : '#8794A8');
      c.fillStyle = gr; c.fill(); c.strokeStyle = '#081235'; c.lineWidth = Math.max(1, 0.035 * k); c.stroke();
      c.strokeStyle = 'rgba(88,230,255,' + (0.55 + 0.45 * g) + ')'; c.fillStyle = c.strokeStyle;
      if (it.part === 'head') { for (const sd of [1, -1]) { const a = W(it, hsec(0.75, sd > 0 ? 50 * DEG : 130 * DEG, 1.02)), b = W(it, hsec(0.85, sd > 0 ? 44 * DEG : 136 * DEG, 1.02)); c.lineWidth = Math.max(1.2, 0.07 * k); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        c.fillStyle = '#F4F7FB'; for (const sd of [1, -1]) for (let i = 0; i < 6; i++) { const t = lerp(T_JAW + 0.04, 0.97, i / 5), a = W(it, hsec(t - 0.012, sd > 0 ? -14 * DEG : 194 * DEG, 0.96)), b = W(it, hsec(t + 0.012, sd > 0 ? -14 * DEG : 194 * DEG, 0.96)), q = hsec(t, sd > 0 ? -14 * DEG : 194 * DEG, 0.94), tp = W(it, [q[0], q[1], q[2] - 0.18]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(tp[0], tp[1]); c.closePath(); c.fill(); } }
      else if (it.part === 'flank') { c.lineWidth = Math.max(1, 0.05 * k); for (let i = 0; i < 4; i++) { const t = 0.487 + i * 0.03, a = W(it, fus(t, -11 * DEG, 1.08)), b = W(it, fus(t + 0.016, -2 * DEG, 1.08)), d = W(it, fus(t, 7 * DEG, 1.08)); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.stroke(); } }
      else if (it.part === 'core') { const a = W(it, [-0.7, 0, 0.3]), b = W(it, [0.5, 0, 0.3]); c.lineWidth = Math.max(2, 0.3 * k); c.globalAlpha = al0 * 0.5 * (0.5 + 0.5 * g); c.lineCap = 'butt'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.lineCap = 'round'; }
      else if (it.part === 'cannon') { const a = W(it, [CAN_L, 0, 0]); c.beginPath(); c.arc(a[0], a[1], 0.17 * k, 0, TAU); c.fill(); }
      else if (it.part === 'cockpit') { const a = W(it, [0, 0, 0.12]); c.fillStyle = '#141B2C'; c.beginPath(); c.ellipse(a[0], a[1], 0.26 * k, 0.17 * k, 0, 0, TAU); c.fill(); } }
    c.restore();
  }
  function draw(c, x, y, z, a, P, o) {
    o = o || {}; const V = mkView(x, y, z, a, o), R = rig(P); LAST = { V, R };
    const al0 = cl(P.alpha == null ? 1 : P.alpha); if (al0 < 0.01) return;
    if (glOn()) { try { glPass(c, V, P, o, R.list, al0); return; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Jaws: GL draw', e); } }
    if (P.waterline != null && !V.K) { const yw = o.sy(y) - P.waterline * ZK * V.T; c.save(); c.beginPath(); c.rect(-1e5, -1e5, 2e5, 1e5 + yw); c.clip(); drawFallback(c, V, R, al0, P); c.restore(); return; }   // (the 2D picture: clipped at the waterline's screen height)
    drawFallback(c, V, R, al0, P);
  }
  function drawShadow(c, x, y, z, a, P, o) {
    o = o || {}; const T = o.T, k = T * (o.scale || 1) * VIS, al = cl(P.alpha == null ? 1 : P.alpha) * 0.32 / (1 + Math.max(0, z) * 0.2); if (al < 0.01) return;
    const X0 = o.sx(x), Y0 = o.sy(y); c.save(); c.globalAlpha = al; c.translate(X0, Y0); c.rotate(Math.atan2(Math.sin(a) * GY, Math.cos(a))); c.scale(1, 0.4);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 2.3 * k); g.addColorStop(0, 'rgba(6,12,28,0.9)'); g.addColorStop(0.6, 'rgba(6,12,28,0.4)'); g.addColorStop(1, 'rgba(6,12,28,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 2.3 * k, 0, TAU); c.fill(); c.restore();
  }
  function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; return LAST.V.toW(p); }
  function anchorDir(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; const w = mv(LAST.V.Rh, p); return { x: w[0], y: w[1] * GY, z: w[2] }; }
  function anchorAt(name, x, y, z, a, P, o) { const R = rig(P), p = R.A[name]; if (!p) return null; const sc = ((o && o.scale) || 1) * VIS, w = mv(rotZ(a), p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; }
  function blankPose() { return { xf: 0, alpha: 1, swim: 0, swimK: 0.5, jaw: 0, cannon: 0, recoil: 0, bank: 0, pitch: 0, fin: 0, tail: 0, glow: 0.5, charge: 0, breath: 0, waterline: null }; }
  function create() { const P = blankPose(); return { pose: P, draw: (c, x, y, z, a, P2, o) => draw(c, x, y, z, a, P2 || P, o), drawShadow: (c, x, y, z, a, P2, o) => drawShadow(c, x, y, z, a, P2 || P, o) }; }
  const SIZE = { len: (XN - XT) * VIS, lenTail: (XN - XT + NTAIL * LTAIL + 0.6) * VIS, wid: 1.5 * VIS, widLev: (1.5 + 2 * FLANK_OUT) * VIS, span: 3.6 * VIS, r: 1.7 * VIS };
  return { create, warm: () => { glOn(); return true; }, warmIdle: () => { glOn(); }, warmPlan: () => ({ pending: 0, total: 0 }), ready: () => true, draw, drawShadow, anchor, anchorDir, anchorAt, rigOf: P => rig(P || blankPose()), blankPose, SIZE, PARTS, __dbg: { get MESH() { return MESH; }, OUTL },
    get gl() { return glOn(); }, get stats() { return { ms: GLMS, n: GLN, meshMs: MESH_MS }; } };
})();
