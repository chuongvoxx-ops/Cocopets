/* ---------- (v423 GO) ORRUBEL THE SEED-MOTHER in three dimensions (Rift 02 "The Garden of Unborn Stars", section 1's boss) ----------
   The 2D bud of 20x-rift-fiend-garden-1.js rebuilt as a GPU model at the Drowned Belfry's fidelity (as Kharrox, 20t3): GLM rigid
   meshes built once (in the loading screen's jobs, the fiend's preload; else on the first draw), posed every frame by a rig with
   secondary motion, one composite drawImage; materials of its own (GLM ids 250..257, the GO-ORRUBEL-MAT block in 20k5uz); the
   light of its attacks on the shared FGFX painter (kinds 168..171, the GO block in 20k6h). The fight (20x) keeps its acts,
   timings, shapes and damage; its warnings are light on the moss (no outlined circles, no numbers). Without WebGL (or on a
   software rasteriser, unless window.__ORB_GL) the 2D bud and its 2D warnings are drawn as before; without the GPU painter the
   effects are the old 2D ones.
   The model (tiles; z up from the floor; x forward, y to its left; drawn with the Belfry's orthographic camera, its footprint
   squashed by GY as Kharrox's): a knotted rootball on five jade roots (two-bone reach and a curling tip each; the feet are
   planted on the moss and step in turn, two at most at once, never two neighbours), a collar of jade sepals, seven cream egg pods
   hanging from the collar on stalks (each a pendulum swung by the body's motion and its footfalls), and the bud: a ribbed plum
   heart with the golden eye in its front (lidded; sunk in the flesh while the bud is shut), a crown of gold stamens on its top,
   five rose inner petals, and six outer petals, each in two hinged halves (closed into a pointed crown, parted at the tip to
   sniff or breathe, peeled right down and out when a Cradle Pod breaks). The bud rides its own spring over the rootball (it lags
   a turn or a start and settles), and the petals flare on a spring when it lands a slam or takes a blow.
   Its fall: it shudders with gold light leaking from its seams, the six outer petals burst off and are thrown down round it, the
   eggs drop from their stalks, the heart withers and sinks into the roots, and the eye closes and goes dark. */
const ORB3 = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, ease = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k);
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the Belfry's camera: orthographic, about 46 degrees above the floor)
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
  /* ================= vectors and rotations (a rotation: its three columns) ================= */
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z)), mT = A => M3([A.x[0], A.y[0], A.z[0]], [A.x[1], A.y[1], A.z[1]], [A.x[2], A.y[2], A.z[2]]);
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: z toward +x)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  const colsK = (R, a, b, c) => M3(vmul(R.x, a), vmul(R.y, b), vmul(R.z, c));
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  function mslerp(A, B, u) { if (u <= 0) return A; if (u >= 1) return B; const R = mm(B, mT(A)), tr = R.x[0] + R.y[1] + R.z[2], ang = Math.acos(clamp((tr - 1) / 2, -1, 1));
    if (ang < 1e-5) return B; let ax = [R.y[2] - R.z[1], R.z[0] - R.x[2], R.x[1] - R.y[0]]; if (vlen(ax) < 1e-5) { ax = [Math.sqrt(Math.max(0, (R.x[0] + 1) / 2)), Math.sqrt(Math.max(0, (R.y[1] + 1) / 2)), Math.sqrt(Math.max(0, (R.z[2] + 1) / 2))]; if (R.x[1] < 0) ax[1] = -ax[1]; if (R.x[2] < 0) ax[2] = -ax[2]; }
    return mm(rotAxis(ax, ang * u), A); }
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  function frameZ(zd) { const z = vnrm(zd), r = Math.abs(z[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], y = vnrm(vcross(z, r)); return M3(vcross(y, z), y, z); }
  /* two-bone reach from S toward T (bones a, b), the middle joint toward `pole` */
  function ik2(S, T, a, b, pole) { const d0 = vsub(T, S), L = vlen(d0) || 1e-6, d = Math.max(Math.abs(a - b) + 1e-3, Math.min(a + b - 1e-4, L)), e = vmul(d0, 1 / L);
    let p = vsub(pole, vmul(e, vdot(pole, e))); if (vlen(p) < 1e-6) p = Math.abs(e[2]) < 0.9 ? vcross(e, [0, 0, 1]) : vcross(e, [1, 0, 0]); p = vnrm(p);
    const ca = (a * a + d * d - b * b) / (2 * a * d), sa = Math.sqrt(Math.max(0, 1 - ca * ca)); return { E: vadd(S, vadd(vmul(e, a * ca), vmul(p, a * sa))), W: vadd(S, vmul(e, d)) }; }
  const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }, hh = (a, b) => hash3(a, b, 0.37);
  const GOLD = '#FFD36B', CREAM = '#F2D8A1', JADE_HI = '#86C9B2', ROSE_HI = '#D98FB5', MINT = '#A8FFE0', PALE = '#FFF4D6';

  /* ================= materials (GLM's ids: the GO-ORRUBEL-MAT block) ================= */
  const M_PET = 250, M_HEART = 251, M_LID = 251.2, M_SOCK = 251.4, M_BARK = 252, M_TIP = 252.2, M_THORN = 252.4, M_COL = 252.6, M_EYE = 253, M_EGG = 254, M_GOLD = 255, M_FIL = 255.2, M_LEAF = 256, M_IPET = 257;

  /* ================= the rig's measures ================= */
  const BZ = 1.5, COL_Z = 0.35;                                         // the rootball's centre above the floor (standing); the collar above it
  const ROOT_A = [-0.5, 0.5, 1.9, -1.9, Math.PI], RING = [3, 0, 1, 2, 4];   // (the roots as the 2D bud's; their order round it)
  const RS = 1.02, RZ = -0.48, FOOT_R = 3.55, LU = 1.95, LL = 1.9, LT = 0.8;
  const NP = 6, PET_A = i => i / NP * TAU + Math.PI / 6, PET_R = 1.42, PET_Z = 0.25, PA_L = 2.15, PB_L = 2.4, PHI0 = 0.3, BEND0 = -1.15;
  const NI = 5, IP_A = i => i / NI * TAU + 0.3, IP_R = 0.72, IP_Z = 2.55, IP_L = 1.35;
  const NE = 7, EGG_A = i => i / NE * TAU + 0.3, EGG_R = 1.5, EGG_Z = 0.42, STALK = 0.82, EGG_H = 0.46;
  const HEART_Z = 1.3, HR = [1.42, 1.42, 1.85], EYE_R = 0.74, EYE_Z = 1.55, SPEAR_LIFE = 1.0;
  /* a blade's frame in the bud: x along it (phi from the vertical, leaning out toward its side d), z its outer face, y = -tangent */
  function petFrame(a, phi, twist) { const d = [Math.cos(a), Math.sin(a), 0], c = Math.cos(phi), s = Math.sin(phi), R = M3([d[0] * s, d[1] * s, c], [Math.sin(a), -Math.cos(a), 0], [d[0] * c, d[1] * c, -s]); return twist ? mm(R, rotX(twist)) : R; }

  /* ================= meshes (built once) ================= */
  let MESH = null, MESH_MS = 0; const PARTB = {};
  /* a thick blade (petal, sepal): along x (0..Lb), half-width w(u), half-thickness th(u), its sides curled toward -z by cup(u),
     its middle bowed by bow(u). vA.y = its place along the whole petal (a0..a1), vA.z = across 0..1 on its outer face, 2 + across
     on its inner */
  function blade(B, Lb, w, th, cup, bow, m, nu, nv, a0, a1) { a0 = a0 || 0; a1 = a1 == null ? 1 : a1;
    B.surf((u, v) => { const a = v * TAU, s = Math.cos(a), W = w(u); return [u * Lb, s * W, bow(u) - cup(u) * s * s + Math.sin(a) * th(u)]; }, nu, nv, () => m,
      { e: u => a0 + (a1 - a0) * u, a: (u, v) => { const a = v * TAU; return (Math.cos(a) + 1) / 2 + (Math.sin(a) < -1e-6 ? 2 : 0); }, flip: true });
    return B; }
  /* a tapered tube along a curve P(u), its radius r(u, around) */
  function tubeC(B, P, r, m, nu, nv, mf) { const fr = u => frameXZ(vsub(P(Math.min(1, u + 0.01)), P(Math.max(0, u - 0.01))), [0, 0, 1]);
    B.surf((u, v) => { const F = fr(u), a = v * TAU, rr = r(u, a); return vadd(P(u), vadd(vmul(F.y, Math.cos(a) * rr), vmul(F.z, Math.sin(a) * rr))); }, nu, nv, mf || (() => m), { e: u => Math.max(sstep(0.1, 0, u), sstep(0.9, 1, u)) * 0.5, flip: true });
    return B; }
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(3, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    /* ---- the petals: an outer petal in two halves, an inner petal, a sepal ---- */
    fin('petA', blade(nb(), PA_L, u => 0.6 + 0.52 * sstep(0, 1, u), () => 0.075, u => 0.34 + 0.1 * u, u => 0.12 * Math.sin(Math.PI * u), M_PET, q(12), q(16), 0, 0.47));
    fin('petB', blade(nb(), PB_L, u => 1.12 * Math.pow(Math.max(0, Math.cos(u * Math.PI / 2)), 0.85) * (1 + 0.12 * Math.sin(Math.PI * u)) + 0.015, u => 0.075 * (1 - 0.6 * u) + 0.01, u => 0.44 * Math.pow(1 - u, 1.2) + 0.03, u => 0.08 * Math.sin(Math.PI * u) + 0.1 * u * u * u, M_PET, q(14), q(16), 0.47, 1));
    fin('ipet', blade(nb(), IP_L, u => 0.5 * Math.pow(Math.max(0, Math.sin(Math.PI * (0.15 + 0.85 * u))), 0.7) + 0.02, () => 0.05, () => 0.2, u => 0.1 * u * u, M_IPET, q(10), q(12)));
    fin('sepal', blade(nb(), 1.25, u => 0.48 * Math.pow(Math.max(0, Math.sin(Math.PI * (0.1 + 0.9 * u))), 0.8) + 0.02, () => 0.05, () => 0.16, u => 0.22 * Math.sin(Math.PI * u), M_LEAF, q(9), q(10)));
    /* ---- the heart: plum flesh in ten ribs, a hollow in its top for the stamens ---- */
    { const B = nb(); B.surf((u, v) => { const ph = u * TAU, th = v * Math.PI, s = Math.sin(th), c = Math.cos(th), rib = 1 + 0.05 * Math.cos(ph * 10) * Math.pow(s, 0.6) + 0.018 * Math.sin(ph * 3 + th * 4), dim = 0.28 * Math.exp(-th * th * 10);
        return [Math.cos(ph) * s * HR[0] * rib, Math.sin(ph) * s * HR[1] * rib, c * HR[2] - dim]; }, q(40), q(22), () => M_HEART, { e: u => 0.5 + 0.5 * Math.cos(u * TAU * 10), flip: true });
      fin('heart', B); }
    /* ---- the stamens: gold-tipped filaments round a tall pistil ---- */
    { const B = nb(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + hh(i, 2) * 0.3, el = 0.5 + hh(i, 3) * 0.6, L = 0.55 + hh(i, 4) * 0.35, tip = [Math.cos(a) * Math.cos(el) * L, Math.sin(a) * Math.cos(el) * L, Math.sin(el) * L + 0.05];
        B.tube([Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0], tip, 0.035, 0.02, M_FIL, { seg: 5, cap0: false }); B.ell(tip, [0.075, 0.075, 0.11], M_GOLD, { seg: q(8), rings: 4 }); }
      B.tube([0, 0, -0.05], [0, 0, 0.95], 0.07, 0.05, M_FIL, { seg: 7, cap0: false }); B.sph([0, 0, 1.0], 0.13, M_GOLD, q(10)); fin('stam', B); }
    /* ---- the eye, its socket of flesh, its lids ---- */
    { const B = nb(); B.sph([0, 0, 0], EYE_R, M_EYE, q(26)); fin('eye', B); }
    { const B = nb(); B.torX([EYE_R * 0.3, 0, 0], EYE_R * 0.98, 0.16, M_SOCK, { seg: q(24), rseg: 8 }); fin('sock', B); }
    { const B = nb(); B.ell([0, 0, 0], [EYE_R * 1.08, EYE_R * 1.08, EYE_R * 1.08], M_LID, { seg: q(16), rings: q(8), th0: 0, th1: 1.62, ph0: -Math.PI / 2, ph1: Math.PI / 2, rim: true }); fin('lidU', B); }
    { const B = nb(); B.ell([0, 0, 0], [EYE_R * 1.06, EYE_R * 1.06, EYE_R * 1.06], M_LID, { seg: q(16), rings: q(6), th0: 1.95, th1: Math.PI, ph0: -Math.PI / 2, ph1: Math.PI / 2, rim: true }); fin('lidL', B); }
    /* ---- the rootball: knotted bark, the roots' sockets, the jade collar with the egg stalks' knobs ---- */
    { const B = nb(); B.ell([0, 0, 0.02], [1.2, 1.2, 0.84], M_BARK, { seg: q(24), rings: q(12) });
      for (let i = 0; i < 16; i++) { const a = hh(i, 1) * TAU, z = -0.55 + hh(i, 2) * 0.95, rr = 1.16 * Math.sqrt(Math.max(0, 1 - (z / 0.84) * (z / 0.84))), k = 0.16 + 0.08 * hh(i, 3); B.ell([Math.cos(a) * rr, Math.sin(a) * rr, z], [k, k, 0.12], M_BARK, { seg: q(8), rings: 4 }); }
      for (const a of ROOT_A) B.sph([Math.cos(a) * RS, Math.sin(a) * RS, RZ], 0.45, M_BARK, q(12));
      B.tor([0, 0, COL_Z], 1.3, 0.17, M_COL, { seg: q(30), rseg: 8 });
      for (let i = 0; i < NE; i++) { const a = EGG_A(i); B.sph([Math.cos(a) * EGG_R, Math.sin(a) * EGG_R, EGG_Z], 0.12, M_COL, 8); }
      fin('base', B); }
    /* ---- a root: the upper limb, the lower with its rootlets, the curling tip ---- */
    const rootSurf = (B, Lr, r0, r1, sd) => B.surf((u, v) => { const a = v * TAU, r = lerp(r0, r1, u) * (1 + 0.09 * Math.sin(a * 3 + u * 5 + sd) + 0.05 * Math.sin(a * 5 - u * 9 + sd * 2) + 0.07 * Math.sin(Math.PI * u)); return [u * Lr, Math.cos(a) * r, Math.sin(a) * r]; }, q(12), q(11), () => M_BARK, { e: u => Math.max(sstep(0.14, 0, u), sstep(0.86, 1, u)), flip: true });
    { const B = nb(); rootSurf(B, LU, 0.4, 0.31, 0.7); B.sph([LU, 0, 0], 0.33, M_BARK, q(10));
      for (let i = 0; i < 4; i++) { const u = 0.2 + i * 0.2, a = hh(i, 7) * TAU; B.ell([u * LU, Math.cos(a) * 0.33, Math.sin(a) * 0.33], [0.13, 0.11, 0.11], M_BARK, { seg: 7, rings: 4 }); } fin('rootU', B); }
    { const B = nb(); rootSurf(B, LL, 0.31, 0.17, 2.1);
      for (let i = 0; i < 7; i++) { const u = 0.35 + i * 0.09, a = -Math.PI / 2 + (hh(i, 9) - 0.5) * 1.6, r = lerp(0.31, 0.17, u), p = [u * LL, Math.cos(a) * r, Math.sin(a) * r]; B.tube(p, [p[0] + 0.12, p[1] + Math.cos(a) * 0.3, p[2] + Math.sin(a) * 0.3 - 0.05], 0.035, 0.008, M_TIP, { seg: 4, cap0: false, cap1: false }); }
      fin('rootL', B); }
    { const B = nb(); tubeC(B, u => [u * LT, 0, 0.35 * u * u * u - 0.02 * u], u => 0.17 * Math.pow(1 - u, 0.8) + 0.012, M_BARK, q(10), q(8), u => u > 0.55 ? M_TIP : M_BARK); fin('rootT', B); }
    /* ---- an egg pod (pointed a little at its top, a jade calyx there) and its stalk (unit length along x) ---- */
    const eggS = (B, m) => B.surf((u, v) => { const ph = u * TAU, th = v * Math.PI, sn = Math.sin(th), c = Math.cos(th), k = 1 - 0.13 * c; return [Math.cos(ph) * sn * 0.36 * k, Math.sin(ph) * sn * 0.36 * k, c * EGG_H]; }, q(16), q(12), () => m, { flip: true });
    const calyx = B => { B.ell([0, 0, EGG_H * 0.94], [0.11, 0.11, 0.06], M_LEAF, { seg: 8, rings: 3 }); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; B.tube([0, 0, EGG_H * 0.95], [Math.cos(a) * 0.17, Math.sin(a) * 0.17, EGG_H * 0.8], 0.04, 0.01, M_LEAF, { seg: 4, cap0: false }); } };
    { const B = nb(); eggS(B, M_EGG); calyx(B); fin('egg', B); }
    { const B = nb(); tubeC(B, u => [u, 0, -0.1 * Math.sin(Math.PI * u)], u => 0.06 - 0.02 * u, M_COL, q(8), q(6)); fin('stalk', B); }
    /* ---- a root spear (along z from its foot: gnarled, thorned, its point dark) and the clods of moss it throws up ---- */
    { const B = nb(); const SP = u => [0.1 * Math.sin(u * 3.1 + 0.4) * u, 0.08 * Math.sin(u * 5 + 1.1) * u, u * 2.7], SR = (u, a) => (0.42 * Math.pow(1 - u, 0.9) + 0.012) * (1 + 0.1 * Math.sin(a * 3 + u * 9));
      tubeC(B, SP, SR, M_BARK, q(14), q(10), u => u > 0.72 ? M_THORN : M_BARK);
      for (let i = 0; i < 9; i++) { const u = 0.15 + i * 0.075, a = hh(i, 13) * TAU, c0 = SP(u), r = SR(u, a) * 0.9, p = [c0[0] + Math.cos(a) * r, c0[1] + Math.sin(a) * r, c0[2]]; B.spike(p, [p[0] + Math.cos(a) * 0.3, p[1] + Math.sin(a) * 0.3, p[2] + 0.22], 0.06, M_THORN, { seg: 5 }); }
      fin('spear', B); }
    { const B = nb(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + hh(i, 17), d = 0.5 + hh(i, 19) * 0.35; B.ell([Math.cos(a) * d, Math.sin(a) * d, 0.04], [0.2 + 0.1 * hh(i, 21), 0.16, 0.12 + 0.06 * hh(i, 23)], M_COL, { seg: 7, rings: 4 }); } fin('clods', B); }
    /* ---- a Cradle Pod: a moss mound, a stem, a great egg on it, two leaves at its foot ---- */
    { const B = nb(); B.ell([0, 0, 0], [0.95, 0.75, 0.24], M_COL, { seg: q(18), rings: q(6), th1: Math.PI / 2 + 0.25 });
      tubeC(B, u => [0.12 * Math.sin(u * 2.4), 0, 0.1 + u * 1.45], u => 0.14 - 0.05 * u, M_BARK, q(10), q(8));
      B.push([1.7, 0, 0], [0, 1.7, 0], [0, 0, 1.7], [0.05, 0, 1.5 + EGG_H * 1.7]); eggS(B, M_EGG); calyx(B); B.pop();
      for (const sd of [-1, 1]) { B.along([0, sd * 0.1, 0.2], [0.35, sd * 0.85, 0.12], [0, 0, 1]); blade(B, 1.2, u => 0.42 * Math.pow(Math.max(0, Math.sin(Math.PI * (0.1 + 0.9 * u))), 0.8) + 0.02, () => 0.04, () => 0.14, u => 0.16 * Math.sin(Math.PI * u), M_LEAF, q(8), q(8)); B.pop(); }
      fin('pod', B); }
    return out; }
  function bounds(name) { let b = PARTB[name]; if (b) return b; const M = MESH && MESH[name]; if (!M) return [[0, 0, 0], 2]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
    for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
    return (PARTB[name] = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0)) / 2]); }

  /* ================= the pose ================= */
  /* P: z (the body's lift), pitch (+ rears back), roll, lagP, lagR (the bud's lag on its spring), sc (breathing), squash (a blow),
     open (peeled 0..1), part (the crown parting), flare (the petals' spring), flut (their flutter), eyeK (the eye out of the flesh),
     look ([yaw, pitch] of the gaze), blink, dizzy, feet ([x, y, lift] x5, the model's frame), curl (the root tips, x5), eggs (each
     { ox, oy } its swing, or { free, x, y, z } fallen), glow (gold light inside the bud), spill (the heart's veins), rootGlow, eggGlow,
     flash (a blow), dead (0..1), shed (seconds since the petals burst off, or -1; from: their frames then), wither, sink */
  function blankPose() { return { z: 0.1, pitch: 0, roll: 0, lagP: 0, lagR: 0, sc: 1, squash: 0, open: 0, part: 0, flare: 0, flut: 0.4, eyeK: 0, look: [0, -0.15], blink: 0, dizzy: 0, feet: null, curl: null, eggs: null, glow: 0.2, spill: 0.15, rootGlow: 0, eggGlow: 0.1, flash: 0, dead: 0, shed: -1, from: null, wither: 0, sink: 0 }; }
  const SHED = Array.from({ length: NP }, (_, i) => ({ a: PET_A(i) + (hash3(i, 1.3, 2.1) - 0.5) * 0.5, d: 2.6 + hash3(i, 4.2, 0.7) * 1.5, up: 0.9 + hash3(i, 2.7, 5.5) * 1.3, flip: hash3(i, 7.1, 3.3) < 0.3, ax: vnrm([hash3(i, 1, 2) - 0.5, hash3(i, 3, 4) - 0.5, hash3(i, 5, 6) - 0.2]), delay: hash3(i, 6.6, 1.9) * 0.22, dur: 0.85 + hash3(i, 9.1, 8.2) * 0.35 }));
  /* a shed petal's flight: from its frames at the burst (F) to lying on the moss round the husk, tumbling, its halves flattening */
  function shedFly(i, F, sh) { const S = SHED[i], u = cl((sh - S.delay) / S.dur); if (u <= 0 || !F) return null; const ue = ease(u);
    let RAr = petFrame(S.a, Math.PI / 2 - 0.06, 0); if (S.flip) RAr = mm(RAr, rotX(Math.PI));
    const oAr = [Math.cos(S.a) * S.d, Math.sin(S.a) * S.d, 0.12], RelR = mm(mT(petFrame(S.a, Math.PI / 2 - 0.06, 0)), petFrame(S.a, Math.PI / 2 + 0.14, 0));
    const RA = mm(rotAxis(S.ax, Math.sin(Math.PI * u) * 1.4), mslerp(F.RA, RAr, ue)), oA = vlerp(F.oA, oAr, Math.min(1, u * 1.05)); oA[2] = lerp(F.oA[2], oAr[2], u * u) + Math.sin(Math.PI * Math.min(1, u)) * S.up;
    const RB = mm(RA, mslerp(mm(mT(F.RA), F.RB), RelR, ue)); return { RA, oA, RB, oB: vadd(oA, vmul(RA.x, PA_L - 0.04)), land: u >= 1 }; }
  function rig(P, t) {
    const inst = [], A = {}, dead = cl(P.dead || 0), live = 1 - dead, fl = P.flash || 0, gl = P.glow || 0;
    const I = (part, R, o, ex) => { const it = { part, R, o, s: 1, al: 1, glow: 0, glow2: fl * 0.85, spill: 0, kind: 0, fx: dead, wear: 0.5 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    /* the rootball */
    const P0 = [0, 0, BZ + (P.z || 0) - 0.95 * (P.sink || 0)], Rb = mm(rotX(P.roll || 0), rotY(-(P.pitch || 0))), toB = p => vadd(P0, mv(Rb, p));
    I('base', Rb, P0, { wear: 0.21, spill: P.rootGlow || 0 }); A.base = P0;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; I('sepal', mm(Rb, petFrame(a, 2.05 + 0.04 * Math.sin(t * 2.1 + i) * live + 0.15 * (P.flare || 0) + 0.3 * dead, 0)), toB([Math.cos(a) * 1.28, Math.sin(a) * 1.28, COL_Z + 0.02]), { wear: 0.6 + i * 0.05 }); }
    /* the bud: over the collar on its own spring, breathing, squashed by a blow, withering */
    const C0 = toB([0, 0, COL_Z]), Ru = mm(Rb, mm(rotX(P.lagR || 0), rotY(-(P.lagP || 0)))), sq = P.squash || 0, wi = P.wither || 0, sxy = (P.sc || 1) * (1 + 0.06 * sq) * (1 - 0.12 * wi), szz = (P.sc || 1) * (1 - 0.12 * sq) * (1 - 0.38 * wi);
    const toU = p => vadd(C0, mv(Ru, [p[0] * sxy, p[1] * sxy, (p[2] - COL_Z) * szz]));
    const open = P.open || 0, part = P.part || 0, flare = P.flare || 0;
    I('heart', colsK(Ru, sxy, sxy, szz), toU([0, 0, HEART_Z]), { glow: gl, spill: P.spill || 0, wear: 0.43 });
    I('stam', colsK(Ru, sxy, sxy, sxy * (0.4 + 0.6 * Math.max(part, open)) * (0.55 + 0.45 * live)), toU([0, 0, HEART_Z + HR[2] - 0.31]), { glow: (gl * 1.2 + 0.25) * (0.3 + 0.7 * live), wear: 0.7 });
    A.heart = toU([0, 0, HEART_Z]); A.mouth = toU([0, 0, HEART_Z + HR[2] + 0.45]);
    for (let i = 0; i < NI; i++) { const a = IP_A(i); I('ipet', mm(Ru, petFrame(a, 0.12 + 1.05 * open + 0.4 * part + 0.25 * flare + 0.03 * Math.sin(t * 2.3 + i) * live + 0.5 * dead, 0)), toU([Math.cos(a) * IP_R, Math.sin(a) * IP_R, IP_Z]), { glow: gl, wear: 0.3 + i * 0.1 }); }
    /* the eye: out of the flesh as the bud opens, its gaze on the pet (rolling when it is dizzy), lidded */
    { const k = cl(P.eyeK || 0), lk = P.look || [0, 0], gz = vnrm([1, Math.tan(clamp(lk[0], -0.8, 0.8)), Math.tan(clamp(lk[1], -0.6, 0.5))]), eo = toU([0.78 + 0.5 * k, 0, EYE_Z]), es = 0.45 + 0.55 * k;
      I('eye', mm(Ru, frameXZ(gz, [0, 0, 1])), eo, { s: es, glow: (0.35 + 0.95 * k) * live, kind: P.dizzy || 0, wear: 0.9 });
      I('sock', Ru, eo, { s: 0.5 + 0.5 * k, wear: 0.52 });
      const bl = cl(Math.max(P.blink || 0, 1 - k * 1.5));
      I('lidU', mm(Ru, rotY(lerp(-1.45, 0.62, bl))), eo, { s: es, wear: 0.55, outline: false }); I('lidL', mm(Ru, rotY(lerp(0.75, -0.18, bl))), eo, { s: es, wear: 0.57, outline: false });
      A.eye = eo; }
    /* the outer petals: two halves each, hinged; thrown off in the fall */
    const sh = P.shed;
    for (let i = 0; i < NP; i++) { const a = PET_A(i), fu = (P.flut || 0) * 0.05 * Math.sin(t * 6.3 + i * 1.7) + 0.02 * Math.sin(t * 1.9 + i * 1.1) * live;
      const phi = PHI0 + 1.38 * open + 0.14 * part + 0.32 * flare + fu, bend = BEND0 + 1.62 * open + 0.62 * part * (1 - open) + 0.28 * flare;
      let RA = mm(Ru, petFrame(a, phi, 0.03 * Math.sin(t * 1.3 + i) * live)), oA = toU([Math.cos(a) * PET_R, Math.sin(a) * PET_R, PET_Z]), RB = mm(Ru, petFrame(a, phi + bend, 0)), oB = vadd(oA, vmul(RA.x, PA_L - 0.04));
      if (sh != null && sh >= 0 && P.from) { const f = shedFly(i, P.from[i], sh); if (f) { RA = f.RA; oA = f.oA; RB = f.RB; oB = f.oB; } }
      I('petA', RA, oA, { glow: gl, wear: 0.1 + i * 0.13, fx: dead * 0.5 }); I('petB', RB, oB, { glow: gl, wear: 0.15 + i * 0.13, fx: dead * 0.5 });
      if (i === 0) A.crown = vadd(oB, vmul(RB.x, PB_L)); A['petA' + i] = { RA, oA, RB, oB }; }
    /* the roots: each from its socket to its planted foot, the knee up and out; the tip curling */
    for (let i = 0; i < 5; i++) { const a = ROOT_A[i], S = toB([Math.cos(a) * RS, Math.sin(a) * RS, RZ]), F = P.feet ? P.feet[i] : null;
      const f = F ? [F[0] + Math.cos(a) * 0.45 * dead, F[1] + Math.sin(a) * 0.45 * dead, F[2] || 0] : [Math.cos(a) * FOOT_R, Math.sin(a) * FOOT_R, 0];
      const J = ik2(S, [f[0], f[1], f[2] + 0.12], LU, LL, [Math.cos(a) * 0.6, Math.sin(a) * 0.6, 1 - 0.75 * dead]), K = J.E, W = J.W, rg = P.rootGlow || 0;
      I('rootU', frameXZ(vsub(K, S), [0, 0, 1]), S, { wear: 0.2 + i * 0.11, spill: rg });
      I('rootL', frameXZ(vsub(W, K), [0, 0, 1]), K, { wear: 0.27 + i * 0.11, spill: rg });
      const dh = vnrm([W[0] - P0[0], W[1] - P0[1], 0]), cu = P.curl ? P.curl[i] : 0.25; I('rootT', frameXZ([dh[0] * Math.cos(cu), dh[1] * Math.cos(cu), Math.sin(cu)], [0, 0, 1]), W, { wear: 0.33 + i * 0.11, spill: rg });
      A['foot' + i] = W; A['knee' + i] = K; }
    /* the egg pods: each hanging from the collar on its stalk, a pendulum; dropped in the fall */
    for (let i = 0; i < NE; i++) { const a = EGG_A(i), an = toB([Math.cos(a) * EGG_R, Math.sin(a) * EGG_R, EGG_Z]), E = P.eggs ? P.eggs[i] : null, eg = (P.eggGlow || 0) * live;
      if (E && E.free) { const ly = cl((0.95 - E.z) / 0.5), up = vnrm([Math.cos(a) * ly, Math.sin(a) * ly, 1 - ly + 0.12]), c = [E.x, E.y, E.z];
        if (E.stalk > 0.04) I('stalk', colsK(frameXZ([0.15 * Math.cos(a), 0.15 * Math.sin(a), -1], [0, 0, 1]), STALK * 0.6 * E.stalk, 1, 1), an, { wear: 0.6 + i * 0.03, al: cl(E.stalk * 2) });
        I('egg', frameZ(up), c, { wear: 0.2 + i * 0.09, glow: eg }); A['egg' + i] = c; continue; }
      const hx = Math.cos(a) * 0.45 + (E ? E.ox : 0), hy = Math.sin(a) * 0.45 + (E ? E.oy : 0), hl = Math.hypot(hx, hy) || 1, hd = Math.min(STALK * 0.95, hl), vz = Math.sqrt(Math.max(0.01, STALK * STALK - hd * hd));
      const top = [an[0] + hx / hl * hd, an[1] + hy / hl * hd, an[2] - vz], d = vsub(top, an), up = vnrm(vmul(d, -1)), c = vsub(top, vmul(up, EGG_H));
      I('stalk', colsK(frameXZ(d, [0, 0, 1]), Math.max(0.05, vlen(d)), 1, 1), an, { wear: 0.6 + i * 0.03 });
      I('egg', frameZ(up), c, { wear: 0.2 + i * 0.09, glow: eg }); A['egg' + i] = c; }
    return { inst, A, P0, Rb, Ru }; }

  /* ================= drawing ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0], LW = vnrm([-0.5, 0.35, 0.8]), SBW = vnrm([-0.3, -0.35, 0.88]), RIMW = vnrm([0.45, -0.8, 0.42]), UPW = [0, 0, 1];
  const GLCAP = 1700, RIMC = [1.15, 0.55, 0.95], AMBC = [1, 1, 1], OUTC = [0.045, 0.014, 0.05];
  function mkView(x, y, z, a, o) { const T = o.T, sc = o.scale || 1, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T;
    return { T, sc, k, Rh, x, y, z, a, toS: p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; } }; }
  /* the floor's angle <-> the model's heading; a floor point in the model's frame */
  const headOf = th => Math.atan2(Math.sin(th) / GY, Math.cos(th));
  function toBody(wx, wy, x, y, a) { const dx = wx - x, dy = (wy - y) / GY, c = Math.cos(a), s = Math.sin(a); return [dx * c + dy * s, -dx * s + dy * c]; }
  function anchorOf(R, name, x, y, a) { const p = R && R.A[name]; if (!p) return null; const w = mv(rotZ(a), p); return { x: x + w[0], y: y + w[1] * GY, z: w[2] }; }
  let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0, GLBOX = null; const GLI = [], GLJ = [], OCC = new Float32Array(48);
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  const win = k => typeof window !== 'undefined' && window[k];
  /* is the model drawn on the GPU here (its meshes made on the first ask) */
  function glOn() { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || win('__ORB_GL') === 0 || !GLM.ok()) return false; if (GLM.soft && !win('__ORB_GL')) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Orrubel: meshes', e); return false; } } return true; }
  /* the GPU painter for its light (null: the old 2D effects) */
  const fg = () => { try { if (win('__ORB_FX') === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  /* one GPU pass: the parts in list ({ part, R, o, s, al, glow, glow2, spill, kind, fx, wear, outline }) into the box round them */
  function glPass(c, V, list, al0, o) { const k = V.k, X0 = V.toS([0, 0, 0]), PX = EXW, PY = [0, GY, -ZK], PD = CW;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const [bc, brr] = bounds(it.part), s = it.s || 1, R = it.R, ck = Math.max(vlen(R.x), vlen(R.y), vlen(R.z)), rr = brr * s * ck * 1.05 * k, w = mv(V.Rh, vadd(it.o, mv(R, vmul(bc, s)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__ORB_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.1 * (W / bw)), outlineCol: OUTC, keep: win('__GP_OFF') === 1 ? 0 : 2 /* v453 GP: GLM keeps its canvas while the box round the moving model wanders, and across its two passes of different sizes in a frame (the body's, then the field's eggs and root spears: keep 2, as v446 AL), so no reallocation of colour + depth a frame; __GP_OFF = 1: as v451a */ };
    if (o.clip) S.clip = o.clip;
    if (o.occ && o.occ.length) { let n2 = 0; for (const [p, r] of o.occ) { if (n2 >= 12) break; const w = mv(V.Rh, p); OCC[n2 * 4] = w[0]; OCC[n2 * 4 + 1] = w[1]; OCC[n2 * 4 + 2] = w[2]; OCC[n2 * 4 + 3] = r; n2++; } S.occ = OCC; S.nocc = n2; }
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const Rw = mm(V.Rh, it.R), s2 = it.s || 1, Tt = mv(V.Rh, it.o);
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.5 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.d = vdot(Tt, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    if (o.into) o.into(cvs, W, H, bx0, by0, bw, bh); else c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
    GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H]; return true; }
  /* the soft shadow on the moss: one cached blob laid under the rootball and under each foot */
  let BLOB = null;
  function blob() { if (BLOB) return BLOB; BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(8,3,12,1)'); gr.addColorStop(0.5, 'rgba(8,3,12,.62)'); gr.addColorStop(1, 'rgba(8,3,12,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return BLOB; }
  function shadow(c, V, R, al) { const b = blob(); c.save(); const p = V.toS([R.A.base[0], R.A.base[1], 0]), r = 2.7 * V.k; c.globalAlpha = 0.5 * al; c.drawImage(b, p[0] - r, p[1] - r * GY, r * 2, r * 2 * GY);
    for (let i = 0; i < 5; i++) { const f = R.A['foot' + i], q = V.toS([f[0], f[1], 0]), rr = (0.85 - Math.min(0.4, Math.max(0, f[2] - 0.1) * 0.6)) * V.k; c.globalAlpha = 0.38 * al; c.drawImage(b, q[0] - rr, q[1] - rr * GY, rr * 2, rr * 2 * GY); }
    c.restore(); }
  /* the model at world (x, y), heading a (the model's angle), pose P; o = { T, sx, sy, t, R (a rig of this pose), shadow }. Returns the rig, or null */
  let LAST = null;
  function drawModel(c, x, y, a, P, o) { const t = o.t || 0, R = o.R || rig(P, t), V = mkView(x, y, 0, a, o); LAST = { R, V };
    if (o.shadow !== false) shadow(c, V, R, 1 - 0.5 * cl(P.dead || 0));
    if (!glOn()) return null; let ok = false;
    try { ok = glPass(c, V, R.inst, 1, { t, occ: lowFx() ? null : [[R.A.heart, 1.35], [R.A.base, 1.0]] }); } catch (e) { glFail(); if (typeof console !== 'undefined') console.warn('Orrubel: draw', e); ok = false; }
    return ok ? R : null; }

  /* ================= the fight's side: its memory (M.g3), the rig of this moment, the secondary motion ================= */
  const spreadOf = M => 1 + 0.1 * (M.roar || 0) + 0.15 * (M.lunge || 0) - 0.12 * (M.dig || 0) - 0.18 * (M.open || 0) - 0.08 * (M.crouch || 0);
  function homeW(m, a, i, spread, lead) { const ra = ROOT_A[i], hx = Math.cos(ra) * FOOT_R * spread, hy = Math.sin(ra) * FOOT_R * spread, c = Math.cos(a), s = Math.sin(a); return { x: m.x + hx * c - hy * s + (lead ? lead.x : 0), y: m.y + (hx * s + hy * c) * GY + (lead ? lead.y : 0) }; }
  function st3(FX, m) { const M = FX.mem; let S = M.g3; if (S) return S; m = m || FX.m || { x: 0, y: 0 };
    S = M.g3 = { P: blankPose(), feet: [], lag: { p: 0, vp: 0, r: 0, vr: 0 }, flare: { x: 0, v: 0 }, eggs: [], fx: [], spears: [], rock: 0, dip: 0, pvx: 0, pvy: 0, phd: null, hs0: 0, slamOn: false, R: null, Rt: -1, end: null, from: null, breath: null };
    const a = headOf(M.hd == null ? Math.PI / 2 : M.hd); for (let i = 0; i < 5; i++) { const h = homeW(m, a, i, 1, null); S.feet.push({ x: h.x, y: h.y, fx: h.x, fy: h.y, lift: 0, st: -1, dur: 0.32 }); }
    for (let i = 0; i < NE; i++) S.eggs.push({ ox: 0, oy: 0, vx: 0, vy: 0, free: false, x: 0, y: 0, z: 0, vz: 0, stalk: 1, hit: false });
    return S; }
  function init(FX) { FX.mem.g3 = null; st3(FX, FX.m); }
  const hdOf = M => headOf(M.hd == null ? Math.PI / 2 : M.hd);
  /* the pose of this moment, from the fight's own state (the 2D bud's: open, rear, crouch, inhale, breath, slam, roar...) and the motion's */
  function poseOf(FX, m) { const M = FX.mem, S = st3(FX, m), P = S.P, me = FX.me || { x: m.x, y: m.y + 5 }, a = hdOf(M), bt = M.bt || 0, open = M.open || 0, hs = m.hitSq || 0, ent = m.act === 'enter', lunge = M.lunge || 0;
    const slam = M.slam > 0 ? GardenFiend.snap(cl((M.slamT || 0) / 0.8)) : 0, roar = M.roar || 0, rear = M.rear || 0, crouch = M.crouch || 0, inhale = M.inhale || 0, breath = M.breath || 0, menace = M.menace || 0, dig = M.dig || 0;
    P.z = 0.1 + Math.sin(bt * 1.3) * 0.04 - crouch * 0.3 - slam * 0.35 + rear * 0.5 + lunge * (ent ? 0.6 : 0.2) - hs * 0.12 + open * Math.sin(bt * 2.2) * 0.05 - S.dip;
    P.pitch = (M.lean || 0) + rear * 0.55 + (ent ? lunge * 0.5 : 0) - slam * 0.12 + (M.recoil || 0) * 0.2 + hs * 0.08 + roar * 0.15 - crouch * 0.1;
    P.roll = (M.roll || 0) + S.rock + open * Math.sin(bt * 2.4) * 0.1; P.lagP = S.lag.p; P.lagR = S.lag.r;
    P.sc = 1 + Math.sin(bt * 1.3) * 0.02 + roar * 0.06 + inhale * 0.04 - crouch * 0.02; P.squash = hs;
    P.open = ease(open); P.part = Math.min(1, (M.sniff || 0) * 0.4 + inhale * 0.35 + breath * 0.5 + roar * 0.4 + lunge * 0.5) * (1 - open); P.flare = S.flare.x; P.flut = 0.4 + breath * 2 + hs + menace * 0.4;
    P.eyeK = cl((open - 0.3) / 0.5); const dz = m.stunT > 0 || open > 0.9;
    if (dz) P.look = [Math.cos(bt * 6) * 0.6, Math.sin(bt * 6) * 0.35 - 0.1]; else { const b = toBody(me.x, me.y, m.x, m.y, a); P.look = [clamp(Math.atan2(b[1], b[0]), -0.8, 0.8), -0.08]; }
    P.blink = Math.max(M.blink || 0, hs * 0.6); P.dizzy = dz ? 1 : 0;
    P.feet = P.feet || [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; P.curl = P.curl || [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) { const f = S.feet[i], b = toBody(f.x, f.y, m.x, m.y, a); P.feet[i][0] = b[0]; P.feet[i][1] = b[1]; P.feet[i][2] = f.lift || 0; P.curl[i] = 0.22 + (f.lift || 0) * 1.6 + open * 0.9 + 0.08 * Math.sin(bt * 2 + i) - dig * 0.15 + roar * 0.2; }
    P.eggs = S.eggs; P.glow = 0.2 + P.part * 0.6 + open * 0.9 + roar * 0.8 + breath * 0.8 + lunge * 0.4; P.spill = 0.12 + menace * 0.55 + (FX.S && FX.S.lv >= 2 ? 0.35 : 0) + roar * 0.6; P.rootGlow = dig * 1.2 + crouch * 0.3; P.eggGlow = 0.1 + (FX.S && FX.S.lv >= 2 ? 0.35 + 0.25 * Math.sin(bt * 3) : 0);
    P.flash = m.flash > 0 ? 1 : 0; P.dead = 0; P.shed = -1; P.from = null; P.wither = 0; P.sink = 0;
    const E = S.end; if (E) { const u = E.t, sp = u < 1.3 ? Math.sin(u * 23) * 0.5 + 0.5 : 0;
      P.dead = sstep(1.3, 4.0, u); P.part = (0.45 + 0.35 * sp) * (1 - sstep(1.2, 1.4, u)); P.open = 0; P.glow = u < 1.3 ? 0.6 + 1.6 * sstep(0, 1.3, u) * (0.7 + 0.3 * sp) : 1.4 * (1 - sstep(1.3, 3.2, u)); P.spill = P.glow;
      P.shed = u >= 1.3 ? u - 1.3 : -1; P.from = S.from; P.wither = sstep(1.6, 3.8, u); P.sink = 0.85 * sstep(1.8, 4.2, u); P.eyeK = sstep(1.35, 1.9, u); P.blink = sstep(2.6, 3.6, u); P.dizzy = 0; P.look = [0, -0.3 - 0.3 * P.blink];
      P.z = 0.1 - 0.15 * sstep(0, 1.3, u) + (u < 1.3 ? Math.sin(u * 31) * 0.05 : 0); P.pitch = 0.1 * Math.sin(u * 17) * (1 - sstep(1.0, 1.4, u)) - 0.12 * P.sink; P.roll = 0.08 * Math.sin(u * 13) * (1 - sstep(1.0, 1.4, u)) + 0.1 * P.sink; P.flut = u < 1.3 ? 2.5 : 0; P.sc = 1 + 0.05 * sp;
      for (let i = 0; i < 5; i++) P.curl[i] = 0.25 + 1.1 * sstep(1.6, 3.6, u); P.flash = 0; P.rootGlow = 0; P.eggGlow = 0; }
    return P; }
  function rigNow(FX, m) { const M = FX.mem, S = st3(FX, m); if (S.R && S.Rt === M.bt) return S.R; S.R = rig(poseOf(FX, m), M.bt || 0); S.Rt = M.bt; return S.R; }
  const anc = (FX, m, n) => anchorOf(rigNow(FX, m), n, m.x, m.y, hdOf(FX.mem)) || { x: m.x, y: m.y, z: 2 };
  const vis = p => ({ x: p.x, y: p.y - p.z * ZK });   // (where a body point shows: the floor point a tap there lands on)
  /* (the fight's queries on the GPU path) the hit proxies, the eye's weak point, the crown the eggs and breath leave from ([x, y, h]: shows at y - h) */
  function parts(FX, m) { const b = vis(anc(FX, m, 'heart')), n = vis(anc(FX, m, 'base')); return [{ key: 'bulb', dx: b.x - m.x, dy: b.y - m.y, r: 2.4 }, { key: 'neck', dx: n.x - m.x, dy: n.y - m.y + 0.3, r: 2.0 }]; }
  function eyeAt(FX, m) { const e = vis(anc(FX, m, 'eye')); return [e.x, e.y]; }
  function crownAt(FX, m) { const p = anc(FX, m, 'mouth'); return [p.x, p.y, p.z * ZK]; }

  /* the motion, each frame: the feet planted and stepping in turn, the bud's lag, the petals' flare, the eggs' swing; the fall */
  function update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M || !(dt > 0)) return; const S = st3(FX, m), a = hdOf(M), lf = lowFx();
    for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += dt; if (f.t >= f.life) S.fx.splice(i, 1); }
    for (let i = S.spears.length - 1; i >= 0; i--) { const s = S.spears[i]; s.t += dt; if (s.t >= SPEAR_LIFE) S.spears.splice(i, 1); }
    if (S.breath) { S.breath.t += dt; if (S.breath.t > 1.3) S.breath = null; }
    // the body's acceleration in its own frame: it drives the bud's lag and the eggs' swing
    const ax = ((M.vx || 0) - S.pvx) / dt, ay = ((M.vy || 0) - S.pvy) / dt, c = Math.cos(a), s = Math.sin(a); S.pvx = M.vx || 0; S.pvy = M.vy || 0;
    const fa = clamp(ax * c + ay / GY * s, -40, 40), sa = clamp(-ax * s + ay / GY * c, -40, 40), turn = S.phd == null ? 0 : clamp(angTo(S.phd, M.hd == null ? 0 : M.hd) / dt, -6, 6); S.phd = M.hd;
    const L = S.lag; L.vp += (-38 * L.p - 5.5 * L.vp - fa * 0.006) * dt; L.p = clamp(L.p + L.vp * dt, -0.25, 0.25); L.vr += (-38 * L.r - 5.5 * L.vr + sa * 0.006 + turn * 0.02) * dt; L.r = clamp(L.r + L.vr * dt, -0.25, 0.25);
    // the petals' flare: kicked by a slam's landing and by a blow
    const Fl = S.flare, hs = m.hitSq || 0; if (M.slam > 0 && !S.slamOn) { S.slamOn = true; Fl.v += 5; } if (!(M.slam > 0)) S.slamOn = false; if (hs > 0.9 && S.hs0 <= 0.9) Fl.v += 2.2; S.hs0 = hs;
    Fl.v += (-60 * Fl.x - 6 * Fl.v) * dt; Fl.x = clamp(Fl.x + Fl.v * dt, -0.6, 1.2);
    S.dip = Math.max(0, S.dip - dt * 0.35);
    if (S.end) { dying(FX, m, S, dt); return; }
    // the eggs: pendulums on their stalks (an idle sway along their hang, the body's starts and turns, the footfalls)
    const bt = M.bt || 0, spd = Math.hypot(M.vx || 0, M.vy || 0), spdK = M.spdK || 0;
    for (let i = 0; i < NE; i++) { const E = S.eggs[i], ea = EGG_A(i), sw = Math.sin(bt * 2.4 + i * 1.3) * 0.12 * (1 + spdK) + Math.sin(M.gait || 0) * 0.1 * spdK, tx = Math.cos(ea) * sw, ty = Math.sin(ea) * sw;
      E.vx += (-22 * (E.ox - tx) - 2.6 * E.vx - fa * 0.025) * dt; E.vy += (-22 * (E.oy - ty) - 2.6 * E.vy - sa * 0.025) * dt; E.ox = clamp(E.ox + E.vx * dt, -0.6, 0.6); E.oy = clamp(E.oy + E.vy * dt, -0.6, 0.6); }
    // the feet: planted on the moss; one lifts when its home has run away from it (two at most at once, never two neighbours)
    const lead = { x: (M.vx || 0) * 0.2, y: (M.vy || 0) * 0.2 }, spread = spreadOf(M); let nStep = 0;
    for (let i = 0; i < 5; i++) { const f = S.feet[i], h = homeW(m, a, i, spread, lead); if (Math.hypot(f.x - h.x, f.y - h.y) > 3.2 || m.act === 'enter') { f.x = f.fx = h.x; f.y = f.fy = h.y; f.st = -1; f.lift = 0; } if (f.st >= 0) nStep++; }
    if (m.act === 'enter' || m.dead) return;
    let rock = 0;
    for (let i = 0; i < 5; i++) { const f = S.feet[i]; if (f.st < 0) continue; f.st += dt; const u = cl(f.st / f.dur), e = ease(u), h = homeW(m, a, i, spread, lead); f.x = f.fx + (h.x - f.fx) * e; f.y = f.fy + (h.y - f.fy) * e; f.lift = Math.sin(Math.PI * u) * (0.3 + Math.min(0.4, spd * 0.08)); rock -= Math.sin(ROOT_A[i]) * f.lift * 0.1;
      if (u >= 1) { f.st = -1; f.lift = 0; nStep--; footfall(FX, m, M, S, i, f, spdK); } }
    S.rock = toward(S.rock, rock, dt, 8);
    if (!(M.open > 0.3) && !(m.stunT > 0)) { const want = []; for (let i = 0; i < 5; i++) { const f = S.feet[i]; if (f.st >= 0) continue; const h = homeW(m, a, i, spread, lead), err = Math.hypot(f.x - h.x, f.y - h.y); if (err > (spd > 0.4 ? 0.28 : 0.55)) want.push([err, i]); }
      want.sort((p, q) => q[0] - p[0]);
      for (const [, i] of want) { if (nStep >= 2) break; const r = RING.indexOf(i), nb1 = S.feet[RING[(r + 1) % 5]], nb2 = S.feet[RING[(r + 4) % 5]]; if (nb1.st >= 0 || nb2.st >= 0) continue; const f = S.feet[i]; f.st = 0; f.fx = f.x; f.fy = f.y; f.dur = clamp(0.36 - spd * 0.02, 0.24, 0.36); nStep++; } } }
  /* a root lands: a thud through the moss (as the 2D bud's: a few jade flecks, a shake, now and then the sound), a puff of moss light */
  function footfall(FX, m, M, S, i, f, spdK) { if (!glOn()) return; if (spdK > 0.3) { for (let k = 0; k < 3; k++) FX.H.part({ kind: 'petal', x: f.x + FX.rnd(-0.3, 0.3), y: f.y, vx: FX.rnd(-1.5, 1.5), vy: -1.5 - Math.random(), g: 6, life: 0.5, max: 0.5, size: 3, rot: Math.random() * 3, color: JADE_HI }); FX.H.shake(1 + spdK * 1.6, 0.07); if (Math.random() < 0.4) FX.H.sfx.thud(); }
    if (!lowFx() && fg()) S.fx.push({ kind: 'dust', x: f.x, y: f.y, t: 0, life: 0.6, seed: Math.random() * 40 }); S.dip = Math.min(0.06, S.dip + 0.025);
    for (const E of S.eggs) { E.vx += (Math.random() - 0.5) * 0.9; E.vy += (Math.random() - 0.5) * 0.9; } }
  /* ---- the fall: it shudders (light leaking out between its petals), the petals burst off and are thrown down round it, the eggs drop,
     the heart withers and sinks, the eye closes and goes dark ---- */
  function die(FX, m) { const S = st3(FX, m); if (S.end) return; S.end = { t: 0, shed: false, landed: {} }; S.fx.push({ kind: 'dying', t: 0, life: 1.4, seed: 3 }); FX.H.sfx.hum(); FX.H.shake(lowFx() ? 4 : 8, 0.8); }
  function dying(FX, m, S, dt) { const E = S.end, M = FX.mem; E.t += dt;
    if (E.t < 1.3 && !lowFx() && Math.random() < dt * 7) FX.H.shake(1.4, 0.1);
    if (E.t >= 1.3 && !E.shed) { E.shed = true; const R = rigNow(FX, m); S.from = []; for (let i = 0; i < NP; i++) { const p = R.A['petA' + i]; S.from.push({ RA: p.RA, oA: p.oA, RB: p.RB }); }
      for (let i = 0; i < NE; i++) { const Eg = S.eggs[i], c = R.A['egg' + i], ea = EGG_A(i); Eg.free = true; Eg.x = c[0]; Eg.y = c[1]; Eg.z = c[2]; Eg.vz = 0.6; Eg.vx = Math.cos(ea) * (0.5 + hh(i, 3) * 0.6); Eg.vy = Math.sin(ea) * (0.5 + hh(i, 3) * 0.6); Eg.stalk = 1; }
      const h = vis(anc(FX, m, 'heart')); burst(FX, h.x, h.y, 3.2, GOLD, { z: 0, motes: 1, n: 0, shake: lowFx() ? 6 : 14 }); FX.H.flash(0.35, GOLD); FX.H.sfx.crash(); FX.H.sfx.crack(); const g = FX.g; if (g) g.hitStop = Math.max(g.hitStop || 0, lowFx() ? 0.07 : 0.12);
      FX.H.text(m.x, m.y - 4.2, 'The petals fall!', CREAM, 16); S.fx.push({ kind: 'seeds', t: 0, life: 4.5, seed: 7 }); }
    if (E.shed) { const sh = E.t - 1.3;
      for (let i = 0; i < NP; i++) { const Sd = SHED[i]; if (!E.landed[i] && sh >= Sd.delay + Sd.dur) { E.landed[i] = 1; FX.H.sfx.thud(); if (!lowFx()) FX.H.shake(2, 0.08); const p = anchorOf({ A: { p: [Math.cos(Sd.a) * Sd.d, Math.sin(Sd.a) * Sd.d, 0] } }, 'p', m.x, m.y, hdOf(M)); if (p) S.fx.push({ kind: 'dust', x: p.x, y: p.y, t: 0, life: 0.8, seed: i * 7, big: 1 }); } }
      for (let i = 0; i < NE; i++) { const Eg = S.eggs[i]; Eg.stalk = Math.max(0, Eg.stalk - dt * 0.8); Eg.vz -= 11 * dt; Eg.z += Eg.vz * dt; Eg.x += Eg.vx * dt; Eg.y += Eg.vy * dt;
        if (Eg.z < 0.36) { Eg.z = 0.36; if (Eg.vz < -1.2 && !Eg.hit) { Eg.hit = true; if (Math.random() < 0.5) FX.H.sfx.pop(); } Eg.vz = Eg.vz < -1.2 ? -Eg.vz * 0.28 : 0; Eg.vx *= 0.5; Eg.vy *= 0.5; } } } }

  /* ================= its light (FGFX): the floor's (the warnings, under everything standing) and the upper (over everything) ================= */
  const rgbaH = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`; };
  function vee(Q, x, y, a, s, col, al) { if (!(al > 0.01)) return; const ca = Math.cos(a), sa = Math.sin(a); for (const sg of [-1, 1]) Q.rbeam(x - ca * s - sa * sg * s * 0.9, y - sa * s + ca * sg * s * 0.9, x, y, s * 0.26, col, al, 0.15, 1); }
  /* without the GPU painter: the engine's own 2D warning (the shape it had before), drawn from the warning's shape (geo) */
  function tele2D(c, FX, s, T, t) { const u = cl(s.age / s.t), col = s.col || GOLD, X = FX.sx(s.x), Y = FX.sy(s.y), geo = s.geo;
    const path = grow => { c.beginPath();
      if (geo === 'circle') c.arc(X, Y, Math.max(0.1, s.r * T * grow), 0, TAU);
      else if (geo === 'cone') { c.moveTo(X, Y); c.arc(X, Y, s.len * T * grow, s.a - s.spread, s.a + s.spread); c.closePath(); }
      else if (geo === 'ring') { const r0 = s.r0 * T, r1 = s.r0 * T + (s.r1 - s.r0) * T * grow; if (s.gaps && s.gaps.length) { const gs = s.gaps.map(([a, w]) => [a - w, a + w]).sort((p, q) => p[0] - q[0]); for (let i = 0; i < gs.length; i++) { const b0 = gs[i][1], b1 = gs[(i + 1) % gs.length][0] + (i === gs.length - 1 ? TAU : 0); c.moveTo(X + Math.cos(b0) * r1, Y + Math.sin(b0) * r1); c.arc(X, Y, r1, b0, b1); c.arc(X, Y, r0, b1, b0, true); c.closePath(); } } else { c.arc(X, Y, r1, 0, TAU); c.moveTo(X + r0, Y); c.arc(X, Y, r0, 0, TAU, true); } } };
    c.save(); path(1); c.fillStyle = rgbaH('#0A0410', 0.13); c.fill('evenodd'); c.globalCompositeOperation = 'lighter';
    path(geo === 'ring' ? 1 : u); c.fillStyle = rgbaH(col, 0.04 + u * 0.1); c.fill('evenodd');
    path(1); c.lineWidth = 1.5 + u * 1.5; c.strokeStyle = rgbaH(col, 0.45 + 0.4 * Math.sin(t * 18) * u + u * 0.3); c.stroke();
    if (geo === 'ring' && s.gaps && typeof glowSprite === 'function') s.gaps.forEach(([a]) => { const r = (s.r0 + s.r1) / 2 * T; c.globalAlpha = 0.8; blitSized(c, glowSprite('#8FFFE0'), X + Math.cos(a) * r - T, Y + Math.sin(a) * r - T, T * 2, T * 2); });
    c.restore(); }
  /* the floor's light: the warnings (a fan of gathering pollen, roots breaking the moss, the landing glow of a seed bomb, the slam's
     ring of petals with its two openings lit mint), the roots' bursts, the slam's crest, the breath on the moss, footfall puffs */
  function overlay(c, FX, t, T) { const M = FX.mem; if (!M) return; const teles = FX.S && FX.S.tele ? FX.S.tele.filter(s => s.orb && !s.done) : [], F = fg();
    if (!F) { for (const s of teles) tele2D(c, FX, s, T, t); return; }
    const S = M.g3; if (!teles.length && !(S && (S.fx.length || S.breath))) return;
    const Q = F.begin(c, null), lf = lowFx();
    try { for (const s of teles) tellLight(Q, FX, s, T, t, lf); if (S) { if (S.breath) breathFloor(Q, FX, S, M, T, t); for (const f of S.fx) floorOne(Q, FX, f, T, t, lf); } } finally { F.flush(c); } }
  function tellLight(Q, FX, s, T, t, lf) { const u = cl(s.age / s.t), X = FX.sx(s.x), Y = FX.sy(s.y), pul = 0.5 + 0.5 * Math.sin(t * (6 + 10 * u)), sd = s.seed || 1.3;
    if (s.orb === 'breath') { const L = s.len * T * 1.04, c = Math.cos(s.a), sn = Math.sin(s.a); Q.quad(168, X, Y, c * L, sn * L, -sn * L, c * L, GOLD, 0.8 + 0.2 * pul * u, s.spread, sd, u * 0.999); Q.glow(X + c * T * 1.6, Y + sn * T * 1.6, T * (1.4 + u), GOLD, 0.1 + 0.2 * u); }
    else if (s.orb === 'spear') { const R = s.r * T * 1.3; Q.quad(169, X, Y, R, 0, 0, R, JADE_HI, 0.9, u * 0.999, sd, 0); Q.glow(X, Y, R * (0.45 + 0.4 * u), JADE_HI, 0.06 + 0.2 * u * (0.6 + 0.4 * pul));
      if (!lf) for (let i = 0; i < 4; i++) { const ph = (t * 0.9 + i / 4 + sd) % 1, aa = i * 1.57 + t * 0.7 + sd, rr = R * (0.85 - 0.7 * ph); Q.star(X + Math.cos(aa) * rr, Y + Math.sin(aa) * rr, T * 0.22, 0.6 * Math.sin(Math.PI * ph) * u, '#DFFFF0'); } }
    else if (s.orb === 'bomb') { const R = s.r * T; Q.glow(X, Y, R * (0.75 + 0.5 * u), CREAM, 0.08 + 0.3 * u * (0.7 + 0.3 * pul)); Q.glow(X, Y, R * 0.32, '#FFF6E0', 0.12 + 0.4 * u * u);
      for (let i = 0; i < (lf ? 1 : 3); i++) { const ph = 1 - ((t * (0.8 + 1.4 * u) + i / 3) % 1); Q.ripple(X, Y, R * (0.25 + 0.9 * ph), CREAM, 0.38 * Math.sin(Math.PI * ph) * (0.35 + 0.65 * u), i * 1.7 + sd, 1, 0.1); } }
    else if (s.orb === 'slam') { const R1 = s.r1 * T * 1.06, g = s.gaps && s.gaps.length > 1 ? s.gaps : [[0, 0.4], [Math.PI, 0.4]];
      Q.quad(170, X, Y, R1, 0, 0, R1, ROSE_HI, 0.5 + 0.5 * u * (0.75 + 0.25 * pul), s.r0 / (s.r1 * 1.06), wrapA(g[0][0]), wrapA(g[1][0]) + 4);
      for (const [ga] of g) { const mr = (s.r0 + s.r1) / 2 * T, ca = Math.cos(ga), sa = Math.sin(ga); Q.glow(X + ca * mr, Y + sa * mr, T * 1.5, MINT, 0.22 + 0.18 * pul);
        for (let k = 0; k < 3; k++) { const ph = (k / 3 + t * 0.6) % 1, rr = (s.r0 + 0.4 + ph * (s.r1 - s.r0)) * T; vee(Q, X + ca * rr, Y + sa * rr, ga, T * 0.32, MINT, 0.75 * Math.sin(Math.PI * ph)); } } } }
  function breathFloor(Q, FX, S, M, T, t) { const B = S.breath, k = Math.max(M.breath || 0, 0), X = FX.sx(B.x), Y = FX.sy(B.y), L = B.len * T * 1.04, c = Math.cos(B.a), sn = Math.sin(B.a); if (!(k > 0.02)) return;
    Q.quad(168, X, Y, c * L, sn * L, -sn * L, c * L, GOLD, 1, B.spread, B.seed, 1 + Math.min(0.999, k)); }
  function floorOne(Q, FX, f, T, t, lf) { const u = cl(f.t / f.life), X = FX.sx(f.x == null ? FX.m.x : f.x), Y = FX.sy(f.y == null ? FX.m.y : f.y);
    if (f.kind === 'spear') { const R = 1.25 * T * 1.3; Q.quad(169, X, Y, R, 0, 0, R, JADE_HI, 1, 1 + u * 0.999, f.seed, 0); Q.smoke(X, Y - T * 0.2, T * (0.7 + 0.9 * u), 0.42 * (1 - u), f.seed, '#3A2449'); }
    else if (f.kind === 'slamw') { const v = cl(u / 0.75), rc = (f.r0 + (f.r1 - f.r0) * ease(v)) * T; if (v < 1) Q.quad(170, X, Y, rc / 0.86, 0, 0, rc / 0.86, ROSE_HI, 1 - v * 0.55, 0.5, f.g1, f.g2 + 14);
      if (!lf) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + f.seed, d = Math.abs(angTo(a, f.g1)) < 0.45 || Math.abs(angTo(a, f.g2)) < 0.45; if (d) continue; Q.smoke(X + Math.cos(a) * rc * 0.92, Y + Math.sin(a) * rc * 0.92, T * (0.6 + 0.6 * u), 0.35 * (1 - u), f.seed + i, '#4A2C58'); }
      Q.glow(X, Y, T * (2.4 + 2 * u), ROSE_HI, 0.35 * (1 - u)); }
    else if (f.kind === 'burst') { Q.glow(X, Y, T * f.r * (1.2 + u), f.col, 0.3 * (1 - u)); if (f.smoke) Q.smoke(X, Y - T * 0.3, T * f.r * (0.6 + 0.7 * u), 0.35 * (1 - u), f.seed, '#3A2449'); }
    else if (f.kind === 'dust') { const b = f.big ? 1.5 : 1; Q.smoke(X, Y - T * 0.1, T * b * (0.45 + 0.6 * u), 0.3 * (1 - u), f.seed, '#4A3A52'); Q.ripple(X, Y, T * b * (0.4 + 1.2 * u), JADE_HI, 0.22 * (1 - u), f.seed, 0.6, 0.1); } }
  /* the upper light: the crown gathering and parting, the breath pouring from it, the eye's light, the eggs' trails, the bursts,
     the spears' eruptions, the roar, the fall (light out of the seams, the petals' burst, seeds rising) */
  function upper(Q, FX, m, M, S, T, t, lf, gl) { const live = !S.end, scr = p => [FX.sx(p.x), FX.sy(p.y) - p.z * ZK * T];
    const crown = () => { if (gl) return scr(anc(FX, m, 'mouth')); const c2 = HOOK.crown2D ? HOOK.crown2D(m, M) : [m.x, m.y, 4.5]; return [FX.sx(c2[0]), FX.sy(c2[1]) - c2[2] * T]; };
    const inhale = M.inhale || 0, breath = M.breath || 0, menace = M.menace || 0, roar = M.roar || 0, open = M.open || 0;
    if (live && !m.dead) { const cr = crown();
      if (inhale > 0.05) { Q.eorb(cr[0], cr[1], T * (0.45 + 0.6 * inhale), GOLD, 0.6 + 0.4 * inhale, 0.55 * inhale, 3.1, 1); if (!lf) for (let i = 0; i < 9; i++) { const ph = (t * 1.1 + i / 9) % 1, aa = i * 0.7 + ph * 2.6, rr = T * 2.8 * (1 - ph); Q.star(cr[0] + Math.cos(aa) * rr, cr[1] + Math.sin(aa) * rr * 0.7, T * 0.22, 0.75 * Math.sin(Math.PI * ph) * inhale, i % 3 ? GOLD : PALE); } }
      if (menace > 0.05 && open < 0.3 && !lf) for (let i = 0; i < 3; i++) { const ph = (t * 0.8 + i * 0.33) % 1; Q.star(cr[0] + Math.sin(i * 2.1 + t) * T * 0.5, cr[1] - ph * T * 1.3, T * 0.2 * menace, (1 - ph) * menace * 0.8, GOLD); }
      if (roar > 0.02 || (M.lunge || 0) > 0.02) { const k = Math.max(roar, m.act === 'enter' ? M.lunge || 0 : 0), h = gl ? scr(anc(FX, m, 'heart')) : [cr[0], cr[1] + T * 2]; Q.glow(h[0], h[1], T * 4.2, GOLD, 0.28 * k); Q.glow(cr[0], cr[1], T * 1.6, PALE, 0.35 * k); }
      if (open > 0.3 && gl) { const k = cl((open - 0.3) / 0.5), e = scr(anc(FX, m, 'eye')); Q.glow(e[0], e[1], T * (1.2 + 0.7 * k), GOLD, 0.42 * k * (0.75 + 0.25 * Math.sin(t * 5))); Q.glow(e[0], e[1], T * 0.45, PALE, 0.35 * k);
        if (open > 0.6) for (let i = 0; i < 3; i++) { const a2 = t * 3 + i * TAU / 3; Q.star(cr[0] + Math.cos(a2) * T * 1.6, cr[1] + T * 0.4 + Math.sin(a2) * T * 0.4, T * 0.3, 0.85, '#FFFFFF'); } }
      // the breath pouring from the crown down into its fan
      if (S.breath && breath > 0.04) { const B = S.breath, ca = Math.cos(B.a), sa = Math.sin(B.a), n = lf ? 5 : 11, ex = FX.sx(B.x + ca * B.len * 0.5), ey = FX.sy(B.y + sa * B.len * 0.5);
        Q.ebeam(cr[0], cr[1], ex, ey, T * (1.2 + 0.8 * breath), GOLD, 0.7, 0.7 * breath, 4.2); Q.rbeam(cr[0], cr[1], ex, ey, T * 0.35, PALE, 0.7 * breath, 1, 0.2); Q.glow(cr[0], cr[1], T * 1.8, GOLD, 0.45 * breath);
        for (let i = 0; i < n; i++) { const f = (t * 1.5 + i / n) % 1, side = (hh(i, 3) - 0.5) * 2 * B.spread * f, wx = B.x + Math.cos(B.a + side) * B.len * (0.1 + 0.85 * f), wy = B.y + Math.sin(B.a + side) * B.len * (0.1 + 0.85 * f), h = (1 - f) * (1 - f);
          const px = lerp(FX.sx(wx), cr[0], h * 0.85), py = lerp(FX.sy(wy), cr[1], h * 0.85), R = T * (0.6 + 1.7 * f); Q.quad(171, px, py, R, 0, 0, R, i % 3 ? GOLD : CREAM, 0.75 * breath * (1 - 0.4 * f), 0.15 + 0.7 * f, i * 1.37, 0.7); } } }
    // the eggs it has lobbed: a fading trail of gold behind each
    for (const Lb of M.lobs || []) { const at = u => { const x = lerp(Lb.x0, Lb.x1, u), y = lerp(Lb.y0, Lb.y1, u), h = 4 * u * (1 - u) * Lb.h; return [FX.sx(x), FX.sy(y) - h * T]; }, u = cl(Lb.t / Lb.dur), n = lf ? 3 : 6;
      for (let i = 0; i < n; i++) { const u0 = Math.max(0, u - (i + 1) * 0.045), u1 = Math.max(0, u - i * 0.045), p0 = at(u0), p1 = at(u1); Q.rbeam(p0[0], p0[1], p1[0], p1[1], T * 0.28, GOLD, 0.5, 1 - (i + 1) / n, 1 - i / n); }
      const p = at(u); Q.glow(p[0], p[1], T * 0.9, CREAM, 0.3); }
    // the spears: light up their length as they burst out, motes off them
    for (const sp of S.spears) { const k = 1 - sstep(0.08, 0.5, sp.t), X = FX.sx(sp.x), Y = FX.sy(sp.y); if (k > 0.01) { Q.rbeam(X, Y, X, Y - T * 2.6 * sp.k * ZK, T * 0.5 * sp.k, JADE_HI, 0.55 * k, 1, 0); Q.glow(X, Y - T * 0.4, T * 1.4 * sp.k, JADE_HI, 0.35 * k); }
      if (!lf && sp.t < 0.4) for (let i = 0; i < 4; i++) { const ph = cl(sp.t / 0.4), a2 = hh(i, sp.seed) * TAU; Q.star(X + Math.cos(a2) * T * (0.4 + 1.2 * ph), Y - T * (0.6 + 1.6 * ph * hh(i, 9)), T * 0.24, 0.8 * (1 - ph), i % 2 ? '#DFFFF0' : JADE_HI); } }
    for (const f of S.fx) upperOne(Q, FX, m, f, T, t, lf, gl, scr); }
  function upperOne(Q, FX, m, f, T, t, lf, gl, scr) { const u = cl(f.t / f.life);
    if (f.kind === 'burst') { const X = FX.sx(f.x), Y = FX.sy(f.y) - (f.z || 0) * T, R = T * f.r * (1.3 + 0.5 * u); Q.quad(171, X, Y, R, 0, 0, R, f.col, 1, u, f.seed, f.motes); Q.glow(X, Y, T * f.r * 0.6, '#FFFFFF', 0.5 * (1 - u) * (1 - u)); }
    else if (f.kind === 'dying' && gl) { const h = scr(anc(FX, m, 'heart')), g = sstep(0, 1, u), fl = 0.75 + 0.25 * Math.sin(t * 31);
      for (let i = 0; i < (lf ? 4 : 6); i++) { const a = PET_A(i) + Math.PI / 6 - Math.PI / 2 + 0.1 * Math.sin(t * 2 + i), L = T * (1.2 + 3.2 * g) * (0.7 + 0.3 * hh(i, 8)); Q.rbeam(h[0], h[1] - T * 0.6, h[0] + Math.cos(a) * L, h[1] - T * 0.6 + Math.sin(a) * L * 0.75, T * (0.22 + 0.3 * g), GOLD, 0.6 * g * fl, 1, 0); }
      Q.glow(h[0], h[1] - T * 0.6, T * (1.6 + 2.4 * g), GOLD, 0.45 * g); Q.glow(h[0], h[1] - T * 0.6, T * 0.7, '#FFFFFF', 0.55 * g * fl); }
    else if (f.kind === 'seeds' && gl) { const h = scr(anc(FX, m, 'heart')), n = lf ? 6 : 14, e = 1 - sstep(0.6, 1, u);
      for (let i = 0; i < n; i++) { const ph = (u * 2.2 + hh(i, 5)) % 1, x = h[0] + (hh(i, 2) - 0.5) * T * 5 + Math.sin(t * 1.3 + i) * T * 0.4, y = h[1] + T * 1.5 - ph * T * 6; Q.star(x, y, T * 0.24, 0.8 * Math.sin(Math.PI * ph) * e, i % 3 ? GOLD : PALE); Q.glow(x, y, T * 0.5, GOLD, 0.12 * Math.sin(Math.PI * ph) * e); } }
    else if (f.kind === 'peel' && gl) { const h = scr(anc(FX, m, 'heart')), R = T * 4 * (0.6 + 0.6 * u); Q.quad(171, h[0], h[1], R, 0, 0, R, GOLD, 1, u, f.seed, 1); } }
  /* ---- the field: the eggs in flight and the root spears, one GPU pass (the spears clipped at the moss: they burst out of it) ---- */
  function spearZ(tt) { const up = tt < 0.11 ? sstep(0, 0.11, tt) * 1.06 : tt < 0.2 ? 1.06 - 0.06 * sstep(0.11, 0.2, tt) : 1, dn = sstep(0.55, 0.95, tt); return -2.75 + 2.75 * up * (1 - dn); }
  function fieldPass(c, FX, T, t) { const M = FX.mem, m = FX.m, S = M.g3, lobs = M.lobs || [], sp = S.spears; if (!lobs.length && !sp.length) return true;
    const b = blob(); c.save(); for (const Lb of lobs) { const u = cl(Lb.t / Lb.dur), x = lerp(Lb.x0, Lb.x1, u), y = lerp(Lb.y0, Lb.y1, u), h = 4 * u * (1 - u) * Lb.h, r = T * 0.5 * (1 - h * 0.08); c.globalAlpha = 0.45 * (0.5 + 0.5 * u); c.drawImage(b, FX.sx(x) - r, FX.sy(y) - r * 0.45, r * 2, r * 0.9); } c.restore();
    const V = mkView(m.x, m.y, 0, 0, { T, sx: FX.sx, sy: FX.sy }), list = [];
    for (const Lb of lobs) { const u = cl(Lb.t / Lb.dur), x = lerp(Lb.x0, Lb.x1, u), y = lerp(Lb.y0, Lb.y1, u), h = 4 * u * (1 - u) * Lb.h; list.push({ part: 'egg', R: mm(rotZ(Lb.t * 3), rotX(Lb.t * 4.1)), o: [x - m.x, (y - m.y) / GY, h / ZK], s: 1.2, glow: 0.35, wear: (Math.abs(Lb.x1 * 7.3) % 1) }); }
    for (const s of sp) { const z = spearZ(s.t), o = [s.x - m.x, (s.y - m.y) / GY]; list.push({ part: 'spear', R: mm(rotZ(s.yaw), rotX(s.tilt)), o: [o[0], o[1], z], s: s.k, spill: 0.8 * (1 - cl(s.t / 0.5)), wear: s.seed % 1 });
      if (s.main) list.push({ part: 'clods', R: rotZ(s.yaw), o: [o[0], o[1], -0.25 * (1 - sstep(0, 0.12, s.t)) - 0.2 * sstep(0.7, 1, s.t)], s: 1, wear: 0.4 }); }
    let ok = false; try { ok = glPass(c, V, list, 1, { t, clip: [0, 1e-6] }); } catch (e) { glFail(); ok = false; } return ok; }

  /* ================= the API for the fight (20x) ================= */
  const HOOK = {};
  function drawBoss(c, FX, m, X, Y, T, t) { if (!glOn()) return false; const M = FX.mem; st3(FX, m); const R = rigNow(FX, m);
    return !!drawModel(c, m.x, m.y, hdOf(M), M.g3.P, { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T, t: M.bt || t, R }); }
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m) return false; const S = st3(FX, m), gl = glOn(); let eggs = false;
    if (gl) { try { eggs = fieldPass(c, FX, T, t); } catch (e) { eggs = false; } }
    const F = fg(); if (!F) return eggs; const Q = F.begin(c, null);
    try { upper(Q, FX, m, M, S, T, t, lowFx(), gl); } finally { F.flush(c); } return eggs; }
  /* a burst (on the GPU painter in place of the engine's boom): spores swelling out, a white heart, a few sparks, the shake */
  function burst(FX, x, y, r, col, o) { o = o || {}; const S = st3(FX, FX.m), sd = Math.random() * 40; S.fx.push({ kind: 'burst', x, y, z: o.z == null ? 0.5 : o.z, r, col, t: 0, life: 0.6 + r * 0.12, seed: sd, motes: o.motes == null ? 0.8 : o.motes, smoke: !!o.smoke });
    if (o.n !== 0) FX.H.sparks(x, y, col, Math.round((o.n || 14) * 0.5), r * 5); FX.H.shake(o.shake || r * 3, 0.22); }
  const onBreath = (FX, s) => { const S = st3(FX, FX.m); S.breath = { x: s.x, y: s.y, a: s.a, len: s.len, spread: s.spread, seed: Math.random() * 40, t: 0 }; };
  function spear(FX, s) { const S = st3(FX, FX.m), k = 0.82 + Math.random() * 0.2, yaw = Math.random() * TAU; S.spears.push({ x: s.x, y: s.y, t: 0, k, yaw, tilt: (Math.random() - 0.5) * 0.12, seed: Math.random() * 40, main: true });
    for (let i = 0; i < 2; i++) { const a = yaw + i * 2.4 + Math.random(), d = 0.55 + Math.random() * 0.25; S.spears.push({ x: s.x + Math.cos(a) * d, y: s.y + Math.sin(a) * d * 0.8, t: -0.04 - i * 0.04, k: k * (0.45 + Math.random() * 0.15), yaw: Math.random() * TAU, tilt: 0.25 * (i ? 1 : -1), seed: Math.random() * 40 }); }
    S.fx.push({ kind: 'spear', x: s.x, y: s.y, t: 0, life: 0.9, seed: Math.random() * 40 }); }
  function slamFx(FX, s) { const S = st3(FX, FX.m), g = s.gaps && s.gaps.length > 1 ? s.gaps : [[0, 0.4], [Math.PI, 0.4]]; S.fx.push({ kind: 'slamw', x: s.x, y: s.y, r0: s.r0, r1: s.r1, g1: wrapA(g[0][0]), g2: wrapA(g[1][0]), t: 0, life: 0.55, seed: Math.random() * 40 }); }
  function peelFx(FX) { const S = st3(FX, FX.m); S.fx.push({ kind: 'peel', t: 0, life: 0.9, seed: Math.random() * 40 }); }
  const fxOn = () => !!fg();
  /* a Cradle Pod on the GPU: its picture kept for each stage of its cracking at the zoom (sways as a picture), its glow as before */
  const PODC = new Map();
  function drawPod(c, FX, o, X, Y, T, t) { if (!glOn()) return false; const cracked = 1 - o.hp / o.maxhp, ck = Math.min(3, Math.floor(cracked * 4)), sw = Math.sin(t * 1.6 + o.idx * 2) * 0.08;
    const m0 = c.getTransform ? c.getTransform() : null, dev = m0 ? Math.max(0.25, Math.hypot(m0.a, m0.b)) : 1, qz = Math.round(Math.log(Math.max(1, T * dev)) * 14), Tq = Math.exp(qz / 14) / dev, key = qz + '|' + ck + '|' + (o.idx % 3);
    let pic = PODC.get(key);
    if (!pic) { const V0 = mkView(0, 0, 0, 0.5 + (o.idx % 3) * 2.1, { T: Tq, sx: v => v, sy: v => v }); let got = null;
      try { glPass(c, V0, [{ part: 'pod', R: I3(), o: [0, 0, 0], s: 1, glow: 0.35 + 0.4 * ck / 3, kind: ck / 3, wear: 0.3 + (o.idx % 3) * 0.2 }], 1, { t: 0, into: (cvs, W, H, bx0, by0, bw, bh) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(cvs, 0, 0); got = { cv, bx0, by0, bw, bh }; } }); } catch (e) { glFail(); }
      if (!got) return false; pic = got; if (PODC.size > 12) { for (const p of PODC.values()) if (p.cv) p.cv.width = p.cv.height = 1; PODC.clear(); } PODC.set(key, pic); }
    if (typeof glowSprite === 'function') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + 0.15 * Math.sin(t * 4 + o.idx); blitSized(c, glowSprite(CREAM), X - T * 1.5, Y - T * 2.6, T * 3, T * 3); c.restore(); }
    const b = blob(), f = T / Tq; c.save(); c.globalAlpha *= 0.45; c.drawImage(b, X - T * 1.1, Y - T * 0.45, T * 2.2, T * 0.9); c.restore();
    c.save(); c.translate(X, Y); c.rotate(sw * 0.5); c.drawImage(pic.cv, 0, 0, pic.cv.width, pic.cv.height, pic.bx0 * f, pic.by0 * f, pic.bw * f, pic.bh * f); c.restore(); return true; }
  /* the loading screen's jobs: the meshes, and one frame off-screen (the program and the buffers ready before the fight) */
  function preload(P) { if (!P || !P.gl) return []; return [() => { glOn(); }, () => { if (!glOn()) return; const cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d'); try { drawModel(c, 0, 0, 0, blankPose(), { T: 4, sx: v => 8 + v, sy: v => 8 + v, t: 0, shadow: false }); } catch (e) { /* (the 2D bud) */ } cv.width = cv.height = 1; }]; }
  /* (v423 GO) leaving the stage lets go of its pictures and of the last view (the meshes and the GL pools hold no stage objects: kept for the next fight) */
  function release() { LAST = null; for (const p of PODC.values()) if (p && p.cv) p.cv.width = p.cv.height = 1; PODC.clear(); }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no rift hook: nothing to register) */ }
  /* a studio portrait (tests): the model alone at screen (x, y), heading a, the pose's fields over the standing one */
  function studio(c, x, y, a, over, o) { const P = Object.assign(blankPose(), over || {}); return drawModel(c, 0, 0, a, P, Object.assign({ T: 40, sx: v => x + v * (o && o.T || 40), sy: v => y + v * (o && o.T || 40), t: (over && over.t) || 2 }, o || {})); }
  return { on: glOn, fx: fxOn, init, update, drawBoss, drawFx, overlay, drawPod, parts, eyeAt, crownAt, burst, onBreath, spear, slamFx, peelFx, die, preload, release, studio, blankPose, HOOK, headOf,
    __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get MESH() { return MESH; }, get last() { return LAST; }, get pods() { return PODC.size; }, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a2, q) => a2 + (q ? q.ntri : 0), 0) : 0 }); } } };
})();
