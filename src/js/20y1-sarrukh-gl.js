/* ---------- (v433 DA) SARRUKH THE BLOOM SERPENT in three dimensions (Rift 03 "The Mouth Beneath the Dunes", section 1's boss) ----------
   The 2D serpent of 20y-rift-fiend-dunes-1.js rebuilt as a GPU model at the Drowned Belfry's fidelity (as Kharrox, 20t3, and the Garden's
   Orrubel, 20x1): GLM rigid meshes built once (in the loading screen's jobs, the fiend's preload; else on the first draw), posed every
   frame along the fight's own body (the 2D file's posed points: its trail, its heights out of the sand, its swim wave and its rear), one
   composite drawImage; materials of its own (GLM ids 340..349, the DA-SARRUKH-MAT block in 20k5uz); the light of its moves on the
   shared FGFX painter (kinds 256..263, the DA-FX block in 20k6h). The fight (20y) keeps its acts, timings, shapes and damage; its
   warnings are light in the sand (no outlined circles, no numbers). Without WebGL (or on a software rasteriser, unless window.__SAR_GL)
   the 2D serpent is drawn as before; without the GPU painter its warnings and effects are the old 2D ones.
   The model (tiles; z up from the sand; x east, y south unforeshortened; drawn with the Belfry's orthographic camera, its floor
   squashed by GY): a long body of 38 slices, each a short tube with ball ends (a bend opens no gap), bone-and-ochre scales over a pale
   scuted belly, cyan veins down its back that pulse toward the tail; raked basalt plates along its spine, two pairs of ribbed bone fins,
   a basalt fluke. Where it goes into the sand the sand is cut away (the GPU's clip plane at the sand) and a lip of sand is heaped round
   it. Its head is the bloom: five basalt sepals cupping five bone outer petals (rose on their inner faces, cyan at their rims) over
   five rose-and-amber inner petals round a dark heart and the glowing orb; six steel blades (crescents and kites) float in a ring
   about it, glowing and spinning up as it blooms. Under the sand it is a hump of sand with crescent ridges spilling behind.
   Its fall: it heaves up in full bloom, the orb flares and bursts, the blades drop and stick in the sand, the petals fall, and the
   long body topples and sinks under the sand. */
const SAR3 = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, ease = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const clampV = (v, a, b) => v < a ? a : v > b ? b : v;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the Belfry's camera: orthographic, about 46 degrees above the floor)
  /* ================= vectors and rotations (a rotation: its three columns) ================= */
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z)), mT = A => M3([A.x[0], A.y[0], A.z[0]], [A.x[1], A.y[1], A.z[1]], [A.x[2], A.y[2], A.z[2]]);
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  const colsK = (R, a, b, c) => M3(vmul(R.x, a), vmul(R.y, b), vmul(R.z, c));
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  function mslerp(A, B, u) { if (u <= 0) return A; if (u >= 1) return B; const R = mm(B, mT(A)), tr = R.x[0] + R.y[1] + R.z[2], ang = Math.acos(clampV((tr - 1) / 2, -1, 1));
    if (ang < 1e-5) return B; let ax = [R.y[2] - R.z[1], R.z[0] - R.x[2], R.x[1] - R.y[0]]; if (vlen(ax) < 1e-5) return u < 0.5 ? A : B;
    return mm(rotAxis(ax, ang * u), A); }
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }, hh = (a, b) => hash3(a, b, 0.37);
  const CYAN = '#62BFC9', CYAN_HI = '#C8F6F8', OCHRE = '#CDA15E', OCHRE_HI = '#EBC98A', BONE = '#E7D9B1', AMBER = '#E8A33A', SANDC = '#D9B06A', DUST = '#A8834E';

  /* ================= materials (GLM's ids: the DA-SARRUKH-MAT block) ================= */
  const M_SCALE = 340, M_FIN = 341, M_BASALT = 342, M_SEPAL = 342.1, M_NEEDLE = 342.2, M_FLUKE = 342.3, M_BONE = 343, M_PET = 344, M_IPET = 345, M_HEART = 346, M_ORB = 347, M_STEEL = 348, M_SAND = 349;

  /* ================= the measures (as the 2D serpent's) ================= */
  const N = 20, SEG = 0.72, NSL = 38, SL = SEG * (N - 1) / NSL, ZSQ = 0.92;
  const girth = u => u < 0.2 ? lerp(1.05, 2.6, sstep(0.02, 0.2, u)) : 2.5 * Math.pow(1 - (u - 0.2) / 0.8, 1.25) + 0.1;   // (its full width along it: thick behind the head, tapering hard to the tail)
  const RAD = u => girth(cl(u)) * 0.5;
  // (the body rests on the sand: a stretch out of the sand is lifted by its radius, one at the sand goes in at its middle)
  const liftOf = (z2, u) => RAD(u) * sstep(0, 0.5, z2) * 0.92;
  const PL = 1.95, PW = u => (0.26 + 0.34 * Math.sin(Math.PI * Math.min(1, u * 1.1))) * (1 - 0.7 * sstep(0.6, 1, u)) + 0.035;   // (an outer petal: its length, half width)

  /* ================= meshes (built once) ================= */
  let MESH = null, MESH_MS = 0; const PARTB = {};
  /* a thick blade (petal, sepal, fin lobe): along x (0..Lb), half-width w(u), half-thickness th(u), its sides curled toward -z by
     cup(u), its middle bowed by bow(u). vA.y = its place along it (0 root .. 1 tip), vA.z = across 0..1 on its outer face (+z),
     2 + across on its inner */
  function blade(B, Lb, w, th, cup, bow, m, nu, nv, keel) {
    B.surf((u, v) => { const a = v * TAU, s = Math.cos(a), W = w(u), k = keel && Math.sin(a) > 0 ? keel(u) * Math.pow(Math.max(0, 1 - Math.abs(s) * 2.2), 2) : 0; return [u * Lb, s * W, bow(u) - cup(u) * s * s + Math.sin(a) * th(u) + k]; }, nu, nv, () => m,
      { e: u => u, a: (u, v) => { const a = v * TAU; return (Math.cos(a) + 1) / 2 + (Math.sin(a) < -1e-6 ? 2 : 0); }, flip: true });
    return B; }
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(4, Math.round(n * DQ));
    /* ---- the body slices: each a short tube between u0 (its head-ward end, at x = +SL/2) and u1 (at -SL/2), closed by balls at both
       ends (the next slice's end turns inside them); vA.y = the place along the whole body (0 the neck .. 1 the tail) ---- */
    for (let j = 0; j < NSL; j++) { const B = nb(), u0 = j / NSL, u1 = (j + 1) / NSL, rA = RAD(u0), rB = RAD(u1), prof = [], h = SL / 2;
      for (let i = 0; i <= 3; i++) { const ph = 0.28 + (Math.PI / 2 - 0.28) * i / 3; prof.push([-h - rB * Math.cos(ph), rB * Math.sin(ph), u1, 0]); }
      for (let i = 1; i <= 3; i++) { const f = i / 4; prof.push([-h + SL * f, lerp(rB, rA, f), lerp(u1, u0, f), 1]); }
      for (let i = 0; i <= 3; i++) { const ph = Math.PI / 2 - (Math.PI / 2 - 0.28) * i / 3; prof.push([h + rA * Math.cos(ph), rA * Math.sin(ph), u0, 2]); }
      const NP = prof.length - 1, at = u => prof[Math.max(0, Math.min(NP, Math.round(u * NP)))], NV = q(26);
      const v0 = B.nv; B.surf((u, v) => { const p = at(u), a = v * TAU; return [p[0], Math.cos(a) * p[1], Math.sin(a) * p[1] * ZSQ]; }, NP, NV, () => M_SCALE, { e: u => at(u)[2] });
      const M = B.done();
      // its normals made exactly (the grid's own differences shade each slice's ends as a bead): the balls from their centres, the tube by its slope
      for (let jj = 0; jj <= NV; jj++) for (let i = 0; i <= NP; i++) { const k = (v0 + jj * (NP + 1) + i) * 3, a = jj / NV * TAU, p = prof[i]; let nx;
        if (p[3] === 0) nx = (p[0] + h) / Math.max(1e-4, p[1]); else if (p[3] === 2) nx = (p[0] - h) / Math.max(1e-4, p[1]); else nx = (rA - rB) / SL;
        const n = vnrm([nx, Math.cos(a), Math.sin(a) / ZSQ]); M.nrm[k] = n[0]; M.nrm[k + 1] = n[1]; M.nrm[k + 2] = n[2]; }
      out['sl' + j] = M; }
    /* ---- a dorsal plate: a raked basalt blade standing on the spine (x toward the head, z up; unit height), chamfered ---- */
    { const B = nb(); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism([[0.42, -0.05], [0.12, 0.42], [-0.5, 1.0], [-0.34, 0.45], [-0.42, -0.05]], -0.07, 0.07, M_BASALT, { b: 0.03 }); B.pop(); out.plate = B.done(); }
    // (v433 DA detail) a hooked spine, swept back and curling at its tip, and a low serrated plate: the spine's silhouette varies down its length
    { const B = nb(); const P = u => [-0.55 * u * u - 0.08 * u, 0, u * 1.05 - 0.25 * u * u * u]; let p0 = P(0); for (let i = 1; i <= 6; i++) { const p1 = P(i / 6); B.tube(p0, p1, 0.2 * (1 - (i - 1) / 6) + 0.02, 0.2 * (1 - i / 6) + 0.012, M_BASALT, { seg: q(7), cap0: i === 1 ? 'flat' : false, cap1: i === 6 ? false : 'round', edge: 0.4 }); p0 = p1; }
      B.spike(p0, [p0[0] - 0.18, 0, p0[2] - 0.12], 0.04, M_BASALT); out.plate2 = B.done(); }
    { const B = nb(); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism([[0.5, -0.05], [0.32, 0.38], [0.12, 0.2], [-0.08, 0.55], [-0.28, 0.3], [-0.5, 0.62], [-0.55, -0.05]], -0.05, 0.05, M_BASALT, { b: 0.025 }); B.pop(); out.plate3 = B.done(); }
    /* ---- a fin: a fan of bone membrane on five rays (x toward the head, y out to its side, unit reach), its rim scalloped ---- */
    { const B = nb(); B.surf((u, v) => { const b = lerp(-0.15, 1.15, v), sc = 1 - 0.13 * Math.pow(Math.abs(Math.sin(v * Math.PI * 4)), 1.5) * u, r = Math.pow(u, 0.9) * (0.72 + 0.28 * Math.sin(Math.PI * v)) * sc;
        return [-Math.sin(b) * r * 0.95, Math.cos(b) * r, 0.12 * u * u * Math.sin(Math.PI * v)]; }, q(8), q(16), () => M_FIN, { e: u => u, a: (u, v) => v });
      for (let i = 0; i < 5; i++) { const b = lerp(-0.15, 1.15, (i + 0.5) / 5); B.tube([0, 0, 0], [-Math.sin(b) * 0.9, Math.cos(b) * 0.95, 0.05], 0.035, 0.012, M_BONE, { seg: 5, cap0: false, cap1: 'round' }); }
      out.fin = B.done(); }
    /* ---- the fluke: two basalt lobes swept back from the tail's tip (x away from the body), a ridge down each ---- */
    { const B = nb(); for (const sg of [-1, 1]) { B.along([0, 0, 0], [0.9, sg * 0.75, 0], [0, 0, 1]); blade(B, 1.15, u => 0.28 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + u)), 0.7) + 0.02, u => 0.05 * (1 - u) + 0.01, () => 0.05, u => 0.04 * Math.sin(Math.PI * u), M_FLUKE, q(10), q(10)); B.pop(); }
      B.sph([0, 0, 0], 0.16, M_FLUKE, q(10)); out.fluke = B.done(); }
    /* ---- the bloom: a sepal, an outer petal, an inner petal, the heart, the orb ---- */
    out.sepal = blade(nb(), 1.5, u => 0.36 * Math.pow(Math.max(0, Math.sin(Math.PI * (0.1 + 0.9 * u))), 0.7) * (1 - 0.35 * sstep(0.6, 1, u)) + 0.02, () => 0.05, () => 0.18, u => 0.22 * Math.sin(Math.PI * u) - 0.1 * u * u, M_SEPAL, q(10), q(14), u => 0.09 * (1 - u));   // (v433 DA detail: an armoured sepal, keeled, its tip hooked in)
    out.sepal = out.sepal.done();
    out.petal = blade(nb(), PL, PW, u => 0.055 * (1 - 0.6 * u) + 0.01, u => 0.22 + 0.12 * u, u => 0.32 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (1 - 0.35 * u) + 0.55 * Math.pow(sstep(0.62, 1, u), 2), M_PET, q(16), q(16)).done();   // (v433 DA detail: its tip curls out)
    out.ipetal = blade(nb(), PL * 0.8, u => PW(u) * 0.82, () => 0.045, () => 0.2, u => 0.3 * Math.sin(Math.PI * u) + 0.3 * Math.pow(sstep(0.6, 1, u), 2), M_IPET, q(12), q(12)).done();
    out.cpetal = blade(nb(), PL * 0.55, u => PW(u) * 0.7, () => 0.04, () => 0.24, u => 0.2 * Math.sin(Math.PI * u), M_IPET, q(8), q(10)).done();
    { const B = nb(); B.surf((u, v) => { const ph = u * TAU, th = v * Math.PI, s = Math.sin(th), c = Math.cos(th), rib = 1 + 0.06 * Math.cos(ph * 8) * Math.pow(s, 0.7); return [c * 0.44, Math.cos(ph) * s * 0.55 * rib, Math.sin(ph) * s * 0.55 * rib]; }, q(28), q(16), () => M_HEART, { e: (u, v) => 0.5 + 0.5 * Math.cos(u * TAU * 8), flip: true }); out.heart = B.done(); }
    { const B = nb(); B.sph([0, 0, 0], 0.3, M_ORB, q(22)); out.orb = B.done(); }
    /* ---- (v433 DA detail) the head the bloom grows from: a serpent's skull (x forward, z up; 0 at the bloom's foot): a broad wedge in
       large plates (340.2), heavy brow ridges over sunken sockets, a bone crest down its crown, two horns swept back, cheek spikes, a row
       of bone teeth along its upper jaw; and the lower jaw (its hinge at 0) with its own teeth, the mouth's dark flesh within ---- */
    { const B = nb(), HP = [[-1.3, 0.6, 0.5], [-0.95, 0.8, 0.6], [-0.55, 0.88, 0.6], [-0.2, 0.78, 0.56], [0.12, 0.62, 0.44], [0.38, 0.46, 0.32], [0.56, 0.3, 0.2], [0.66, 0.1, 0.08]];
      const hp = x => { let i = 0; while (i < HP.length - 2 && HP[i + 1][0] < x) i++; const a2 = HP[i], b2 = HP[i + 1], u = cl((x - a2[0]) / (b2[0] - a2[0])); return [lerp(a2[1], b2[1], u), lerp(a2[2], b2[2], u)]; };
      const sp = (c, p2) => Math.sign(c) * Math.pow(Math.abs(c), 2 / p2), xs = u => lerp(-1.3, 0.66, u);
      B.surf((u, v) => { const x = xs(u), [w, ht] = hp(x), th = v * TAU, c = Math.cos(th), s2 = Math.sin(th), brow = s2 > 0 ? 0.07 * Math.exp(-Math.pow((x + 0.25) / 0.22, 2)) * Math.pow(Math.abs(c), 0.4) : 0;
        return [x, w * sp(c, s2 > 0 ? 2.6 : 5), s2 > 0 ? ht * sp(s2, 2.4) + brow : -0.14 * Math.pow(Math.abs(s2), 0.6)]; }, q(22), q(26), () => M_SCALE + 0.2, { flip: true });
      for (const sg of [-1, 1]) { B.ell([-0.27, sg * 0.46, 0.5], [0.4, 0.16, 0.12], M_SCALE + 0.2, { seg: q(12), rings: 6 }); B.ell([-0.12, sg * 0.53, 0.33], [0.15, 0.09, 0.1], M_BASALT, { seg: q(10), rings: 5 });
        const H = [[-0.85, sg * 0.55, 0.42], [-1.3, sg * 0.82, 0.78], [-1.85, sg * 1.0, 0.92], [-2.25, sg * 1.02, 0.72]]; for (let i = 0; i < 3; i++) B.tube(H[i], H[i + 1], 0.2 - i * 0.055, 0.15 - i * 0.055, M_BONE, { seg: q(9), cap0: 'round', cap1: 'round' });
        B.spike([-0.95, sg * 0.82, 0.08], [-1.4, sg * 1.05, -0.02], 0.12, M_BONE, { seg: 6 }); B.spike([-0.6, sg * 0.86, 0.1], [-0.92, sg * 1.12, 0.06], 0.08, M_BONE, { seg: 6 });
        for (let i = 0; i < 5; i++) { const x = 0.48 - i * 0.2, w = hp(x)[0] * 0.86; B.spike([x, sg * w, -0.05], [x + 0.03, sg * w * 0.95, -0.24 - 0.04 * (i % 2)], 0.045, M_BONE, { seg: 5 }); } }
      for (let i = 0; i < 4; i++) { const x = -0.05 - i * 0.36, z = hp(x)[1], h = [0.42, 0.62, 0.55, 0.4][i]; B.spike([x, 0, z - 0.05], [x - 0.32 * h, 0, z + h], 0.13 * h + 0.04, M_BONE, { seg: 6 }); }
      out.skull = B.done(); }
    { const B = nb(), JL = 1.36, wj = x => 0.82 - 0.5 * Math.pow(x / JL, 1.4), dj = x => 0.3 - 0.16 * (x / JL), xs = u => JL * Math.pow(u, 0.9);
      B.surf((u, v) => { const x = xs(u), th = Math.PI + v * Math.PI, c = Math.cos(th), s2 = Math.sin(th), w = wj(x) * (u > 0.92 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((u - 0.92) / 0.08, 2))) : 1);
        return [x, w * Math.sign(c) * Math.pow(Math.abs(c), 0.55), -dj(x) * Math.pow(Math.abs(s2), 0.5)]; }, q(14), q(14), () => M_SCALE + 0.2, { flip: true });
      B.surf((u, v) => { const x = xs(u) * 0.985, w = wj(x) * 0.92 * (u > 0.92 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((u - 0.92) / 0.08, 2))) : 1); return [x, (v - 0.5) * 2 * w, 0.005]; }, q(10), 4, () => M_HEART, { e: (u, v) => 0.3 });
      for (const sg of [-1, 1]) for (let i = 0; i < 5; i++) { const x = 0.35 + i * 0.22, w = wj(x) * 0.88; B.spike([x, sg * w, 0], [x - 0.02, sg * w * 0.95, 0.2 + 0.04 * (i % 2)], 0.045, M_BONE, { seg: 5 }); }
      B.spike([JL * 0.98, 0, -0.05], [JL + 0.25, 0, -0.18], 0.1, M_BONE, { seg: 6 }); out.jaw = B.done(); }
    { const B = nb(); B.sph([0, 0, 0], 0.11, M_ORB, q(12)); out.eye = B.done(); }
    /* ---- the blades: a steel crescent and a kite-shaped shard (x along, y across, a thin lens of steel; vA.y = 1 at the cutting edge) ---- */
    { const B = nb(); B.surf((u, v) => { const x = -1 + 2 * u, k = 1 - x * x, a = v * TAU, c = (Math.cos(a) + 1) / 2, yo = -0.62 * k, yi = -0.16 * k, th = 0.06 * Math.sqrt(Math.max(0, k)) * Math.sin(Math.PI * c);
        return [x, lerp(yi, yo, c), Math.sin(a) < 0 ? -th : th]; }, q(18), q(12), () => M_STEEL, { e: (u, v) => sstep(0.72, 1.0, (Math.cos(v * TAU) + 1) / 2), flip: true }); out.cres = B.done(); }
    { const B = nb(); B.surf((u, v) => { const x = lerp(-0.6, 1.15, u), w = 0.42 * (x < 0 ? (x + 0.6) / 0.6 : (1.15 - x) / 1.15), a = v * TAU, c = Math.cos(a), th = 0.07 * w / 0.42 * Math.abs(Math.sin(a));
        return [x, c * w, (Math.sin(a) < 0 ? -th : th) + 0.0]; }, q(12), q(12), () => M_STEEL, { e: (u, v) => sstep(0.6, 1.0, Math.abs(Math.cos(v * TAU))), flip: true }); out.kite = B.done(); }
    /* ---- sand: a lip heaped round a hole (unit hole radius, x along the body's way), a hump over its wake, a crescent ridge
       behind it (vA.y = 0 at the hole or crest .. 1 at the rim, where it fades into the floor) ---- */
    { const B = nb(); B.surf((u, v) => { const rr = lerp(0.82, 2.3, u), a = v * TAU, h = 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(cl((rr - 0.82) / 1.48), 0.55)), 1.6) * (1 + 0.12 * Math.sin(a * 3 + 1)) - 0.06;
        return [Math.cos(a) * rr, Math.sin(a) * rr, h]; }, q(8), q(28), () => M_SAND, { e: u => u, flip: true }); out.lip = B.done(); }
    { const B = nb(); B.surf((u, v) => { const a = v * TAU, rr = u, x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.72, f = x > 0 ? 1 : 1 - 0.25 * x * x, h = Math.pow(Math.max(0, 1 - rr * rr), 0.75) * f + 0.08 * Math.sin(rr * 9 - a) * (1 - rr) - 0.05;
        return [x * (x > 0 ? 0.9 : 1.15), y, h]; }, q(10), q(26), () => M_SAND + 0.1, { e: u => u, flip: true }); out.hump = B.done(); }
    { const B = nb(); B.surf((u, v) => { const a = lerp(Math.PI / 2 + 0.4, Math.PI * 1.5 - 0.4, u), w = (v - 0.5) * 2, rr = 1 + w * 0.18, h = 0.16 * Math.max(0, 1 - w * w) * Math.sin(Math.PI * u);
        return [Math.cos(a) * rr, Math.sin(a) * rr, h - 0.01]; }, q(14), q(5), () => M_SAND + 0.1, { e: (u, v) => Math.max(Math.abs(v - 0.5) * 2, 1 - Math.sin(Math.PI * u)), flip: true }); out.ridge = B.done(); }
    /* ---- a Resonator Spire: a basalt needle (342.2: its resonance bands, its cracks by uKind), a bone collar and fork, rubble ---- */
    { const B = nb(); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]);
      B.lathe([[-0.02, 0.0], [-0.02, 0.5], [0.3, 0.47], [1.4, 0.39], [2.6, 0.3], [3.6, 0.23], [4.12, 0.19], [4.2, 0.0]], M_NEEDLE, { seg: q(7), edge: j => j === 1 || j === 6 ? 1 : 0 }); B.pop();
      B.tor([0, 0, 4.12], 0.21, 0.07, M_BONE, { seg: q(16), rseg: 6 });
      for (const sg of [-1, 1]) { const P = [[sg * 0.08, 0, 4.12], [sg * 0.3, 0, 4.7], [sg * 0.46, 0.02, 5.25], [sg * 0.5, 0.05, 5.7]]; for (let i = 0; i < 3; i++) B.tube(P[i], P[i + 1], 0.15 - i * 0.035, 0.12 - i * 0.04, M_BONE, { seg: q(8), cap0: 'round', cap1: 'round' }); }
      for (const [x, y, s] of [[-0.75, 0.15, 0.36], [0.7, 0.2, 0.3], [0.15, 0.55, 0.24], [-0.3, -0.45, 0.22]]) B.ell([x, y, s * 0.35], [s, s * 0.85, s * 0.7], M_BASALT, { seg: q(9), rings: 5 });
      out.spire = B.done(); }
    return out; }
  function bounds(name) { let b = PARTB[name]; if (b) return b; const M = MESH && MESH[name]; if (!M) return [[0, 0, 0], 2]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
    for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
    return (PARTB[name] = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0)) / 2]); }

  /* ================= the fight's 2D side (20y): its posed body, the bloom's state, the blades ================= */
  const G2 = () => { try { const D = typeof FIEND_DEFS !== 'undefined' ? FIEND_DEFS.sarrukh : null; return D && D.G2 || null; } catch (e) { return null; } };
  const toM = (p, m) => [p[0] - m.x, (p[1] - m.y) / GY, p[2] / ZK];   // (a 2D world point [x, y, height] -> the model's frame about the boss)
  const dirM = f => vnrm([f[0], f[1] / GY, f[2] / ZK]);
  const headOf = th => Math.atan2(Math.sin(th) / GY, Math.cos(th));
  /* the state the model keeps of its own (M.g3): its effects, the bloom's lag, the fall */
  function st3(FX, m) { const M = FX.mem; let S = M.g3; if (S) return S; S = M.g3 = { fx: [], lag: { p: 0, vp: 0, y: 0, vy: 0 }, ph: null, R: null, Rt: -1, end: null }; return S; }
  function init(FX) { FX.mem.g3 = null; st3(FX, FX.m); }

  /* ================= the rig: the parts of this moment, in the model's frame about (m.x, m.y) ================= */
  function catmull(P, f) { const n = P.length, i = Math.max(0, Math.min(n - 2, Math.floor(f))), u = f - i, p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)], u2 = u * u, u3 = u2 * u;
    return [0, 1, 2].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3)); }
  function rig(FX, m, t) {
    const M = FX.mem, Gd = G2(); if (!Gd || !M) return null; const S = st3(FX, m), E = S.end;
    const out = { inst: [], A: {}, cross: [], shad: [], blades: [], occ: [] };
    const I = (part, R, o, ex) => { const it = { part, R, o, s: 1, al: 1, glow: 0, glow2: 0, spill: 0, kind: 0, fx: 0, wear: 0.5 }; if (ex) Object.assign(it, ex); out.inst.push(it); return it; };
    const bt = M.bt || t, hs = m.hitSq || 0, roar = M.roar || 0, menace = M.menace || 0, lie = M.lie || (M.demo === 'lie' ? 1 : 0), fl = m.flash > 0 && !E ? 1 : 0;
    const dead = E ? sstep(1.3, 3.2, E.t) : 0, live = 1 - dead, vein = (0.3 + menace * 0.35 + lie * 0.3 + roar * 0.3) * live + (E ? 1.4 * (1 - sstep(1.2, 1.6, E.t)) : 0);
    /* ---- the body: the 2D's posed points (its fall: toppling, then sinking), into the model, rested on the sand ---- */
    const Bw = E && E.B0 ? fallBody(E) : Gd.posed(FX, m, t), P = [];
    for (let i = 0; i < N; i++) { const p = Bw[i], u = i / (N - 1), q = toM([p.x, p.y, p.z], m); q[2] += liftOf(p.z, u) - (E && E.B0 ? E.sink * (1.2 + RAD(u) * 1.6) : 0); P.push(q); }
    // the bloom (the 2D's: its frame, how open, how big; null when the head is under the sand and not pushing up)
    const bud = E && E.B0 ? null : Gd.bud(FX, m, Bw, t);
    if (bud && bud.peek) { const f = dirM(bud.F.f), b = toM(bud.F.base, m); for (let i = 0; i < 4; i++) P[i] = vadd(vsub(b, vmul(f, i * 0.5)), [0, 0, -i * i * 0.3]); }
    const hd2 = M.hd == null ? Math.PI / 2 : M.hd, hdir = [Math.cos(headOf(hd2)), Math.sin(headOf(hd2)), 0];
    const frameAt = f => { const a = catmull(P, Math.max(0, f - 0.15)), b = catmull(P, Math.min(N - 1, f + 0.15)); return frameXZ(vsub(a, b), vnrm(vadd([0, 0, 1], vmul(hdir, -0.75)))); };
    const wk = i => 1 + hs * 0.1 + roar * 0.06 + Math.sin(bt * 1.6) * 0.04 * Math.max(0, 1 - i / 6);
    const spill = 0.25 + 0.35 * (M.mode === 'arc' ? 1 : 0) + (E ? 0.5 * E.sink : 0);
    let prev = catmull(P, 0), prevF = 0;
    for (let j = 0; j < NSL; j++) { const fb = (j + 1) * (N - 1) / NSL, pa = prev, pb = catmull(P, fb), u = (j + 0.5) / NSL, r = RAD(u); prev = pb;
      if (Math.max(pa[2], pb[2]) + r * 1.1 < -0.02) { prevF = fb; continue; }   // (wholly under the sand)
      const ch = vsub(pa, pb), len = vlen(ch) || 1e-4, Fr = frameXZ(ch, vnrm(vadd([0, 0, 1], vmul(hdir, -0.75)))), k = wk(fb * 0.5), np = Math.max(1, Math.ceil(len / (SL * 1.35)));
      // (a long stretch, where a rear's column meets the buried trail, is laid as several slices: a slice is never drawn out past 1.35 its length, so its ball ends stay round)
      for (let q = 0; q < np; q++) { const c0 = vlerp(pb, pa, (q + 0.5) / np); if (c0[2] + r * 1.4 < -0.02) continue; I('sl' + j, colsK(Fr, len / np / SL, k, k), c0, { glow: vein, glow2: fl * 0.85, spill, fx: dead, wear: hh(j, 3) }); }
      // where it goes into the sand: a lip of sand heaped round it
      if ((pa[2] > 0) !== (pb[2] > 0)) { const w = pa[2] / (pa[2] - pb[2]), c = vlerp(pa, pb, w), d = vnrm(ch), el = Math.abs(d[2]), hz = Math.hypot(d[0], d[1]), yaw = hz > 1e-3 ? Math.atan2(d[1], d[0]) : 0, rr = r * 1.04;
        out.cross.push([c[0], c[1], rr]); I('lip', colsK(rotZ(yaw), rr * clampV(1 / Math.max(0.42, el), 1, 2.3), rr, rr * 0.9), [c[0], c[1], 0], { al: 0.99, outline: false, glow: 0, wear: hh(j, 7), kind: 0 }); }
      prevF = fb; }
    out.A.head = P[0]; out.A.mid = P[9];
    for (let i = 0; i < N; i += 3) if (P[i][2] > -0.2) out.shad.push([P[i][0], P[i][1], RAD(i / (N - 1)) * 1.25, P[i][2]]);
    for (const i of [1, 5, 10, 15]) if (P[i][2] > -RAD(i / (N - 1))) out.occ.push([P[i], RAD(i / (N - 1)) * 0.9]);
    /* ---- (v433 DA detail) the dorsal armour: a plate at every point down the spine, big raked plates, hooked spines and low serrated
       plates in turn, their sizes varied, riding the wave; their roots hum cyan ---- */
    for (let i = 1; i <= N - 3; i++) { const u = i / (N - 1), r = RAD(u), F = frameAt(i), base = vadd(P[i], vmul(F.z, r * ZSQ * 0.82)); if (base[2] < 0.05) continue;
      const kind = i % 3, var1 = 1 + 0.18 * Math.sin(i * 2.3), g = girth(u), hgt = g * (0.5 + 0.5 * (1 - u)) * [1.0, 0.72, 0.55][kind] * var1 * (1 + roar * 0.15 + Math.sin((M.wph || bt * 3) - i * 0.6) * 0.06) * (1 - 0.6 * dead);
      I(['plate', 'plate2', 'plate3'][kind], colsK(mm(F, rotX(0.04 * Math.sin(i * 1.7))), g * (kind === 1 ? 0.8 : 0.6), g * 0.5, hgt), base, { glow: vein, glow2: fl * 0.85, fx: dead, wear: hh(i, 11) }); }
    /* ---- the fins: four pairs, largest behind the head; they beat with its pace, bank on its turns, flare at a roar, flail lying out ---- */
    for (const [i, L0] of [[2, 2.1], [5, 1.7], [9, 1.3], [13, 0.9]]) { const u = i / (N - 1), r = RAD(u); if (!(P[i][2] > r * 0.6)) continue; const F = frameAt(i), ka = i / 13;
      for (const sg of [-1, 1]) { const bank = clampV((M.turn || 0) * sg * 0.2, -0.3, 0.3), beat = Math.sin(t * (3 + (M.spd || 0) * 0.2) - i * 0.5 + (sg > 0 ? 0 : 0.5)) * 0.35 + lie * Math.sin(t * 9 + i) * 0.3,
          L = L0 * (1 + roar * 0.25 + menace * 0.1 - bank) * (1 - 0.5 * dead), Rf = mm(F, mm(rotX(sg * (0.2 + 0.15 * ka + beat - 0.6 * dead)), rotZ(sg * (0.3 + 0.2 * ka + bank))));
        I('fin', colsK(Rf, L, sg * L, L), vadd(P[i], vadd(vmul(F.y, sg * r * 0.8), vmul(F.z, r * 0.25))), { glow: vein * 0.8, glow2: fl * 0.6, fx: dead, wear: hh(i, sg + 3) }); } }
    /* ---- the fluke, at the tail's tip when it is out ---- */
    { const a = P[N - 1], b = P[N - 3]; if (a[2] > -0.05) { const F = frameXZ(vsub(a, b), [0, 0, 1]), fw = Math.sin((M.wph || bt * 3) * 1.2) * 0.25 * live; I('fluke', mm(F, rotX(fw)), a, { glow: vein * 0.6, glow2: fl * 0.8, fx: dead, wear: 0.4 }); out.A.tail = a; } }
    /* ---- the wake: under the sand, a hump over its head and crescent ridges spilling behind along its trail ---- */
    if (!E && (M.mode === 'under' || !(Bw[0].z > 0)) && M.trail && M.trail.length > 4) { const k = Math.min(1, 0.55 + (M.spd || 0) * 0.05), tr = M.trail;
      for (let i = 1; i <= 4; i++) { const j = Math.min(tr.length - 1, i * 4); if (!tr[j] || !tr[j - 1]) break; const da = Math.atan2(tr[j - 1].y - tr[j].y, tr[j - 1].x - tr[j].x), rr = 1.1 + i * 0.5;
        I('ridge', colsK(rotZ(headOf(da)), rr, rr, 1.3 + 0.5 * k), toM([tr[j].x, tr[j].y, 0], m), { al: Math.min(0.99, (1 - i * 0.2) * k), outline: false, wear: hh(i, 61) }); }
      if (M.mode === 'under') { const g = (M.menace || 0) * 0.5 + (M.peek || 0) * 0.4, rx = 2.1 * (0.8 + k * 0.3);
        I('hump', colsK(rotZ(headOf(hd2)), rx, rx, (1.3 * k + 0.3 * (M.peek || 0)) / ZK * 0.75), [0, 0, 0], { al: 0.99, outline: false, glow: g, wear: 0.3 }); } }
    /* ---- the bloom ---- */
    if (bud) bloom(FX, m, M, S, bud, out, I, t, vein, fl, dead);
    else if (E && E.B0) fallenBloom(FX, m, M, S, E, P, out, I, t);
    return out; }
  /* the bloom on the neck: its frame (the 2D's axis, into the model), the calyx, the petals (peeled by k), the heart and its orb, the blades */
  function bloom(FX, m, M, S, bud, out, I, t, vein, fl, dead) {
    const F = bud.F, k = cl(bud.k), sw = bud.sw, bt = M.bt || t, hs = m.hitSq || 0, tw = M.tw || 0, wind = bud.wind || 0, L = S.lag, lieK = bud.lie || 0;
    let X = dirM(F.f); const base = toM(F.base, m);
    X = vnrm(vadd(X, [L.y * -X[1], L.y * X[0], L.p]));   // (the bloom lags its neck on a spring)
    const Rb = frameXZ(X, [0, 0, 1]), Y = Rb.y, Z = Rb.z, twist = Math.sin(bt * 0.7) * 0.12, gx = { glow2: fl * 0.85, fx: dead };
    /* (v433 DA detail) the head: a serpent's skull on the neck, its jaws parting round the bloom as it opens (and at a roar); its eyes cyan */
    const SK = sw * 0.95, HB = sw * 1.22, hb = vadd(base, vmul(X, 0.6 * SK)), jo = 0.22 + 0.36 * Math.max(k, (M.jaw || 0) * 0.55) + (M.roar || 0) * 0.15 + hs * 0.1;
    if (!bud.peek || bud.F.base[2] > -0.6) { I('skull', colsK(mm(Rb, rotY(-0.08 * jo)), SK, SK, SK), hb, Object.assign({ glow: vein * 0.5, wear: 0.27 }, gx));
      I('jaw', colsK(mm(Rb, rotY(jo)), SK, SK, SK), vadd(hb, vmul(vadd(vmul(X, -0.72), vmul(Z, -0.06)), SK)), Object.assign({ glow: vein * 0.4, wear: 0.33 }, gx));
      for (const sg of [-1, 1]) I('eye', Rb, vadd(hb, vmul(vadd(vmul(X, -0.08), vadd(vmul(Y, sg * 0.5), vmul(Z, 0.34))), SK)), { s: SK * 1.35, glow: (0.5 + 0.6 * (M.menace || 0) + (M.roar || 0)) * (1 - dead), kind: 0, fx: dead, outline: false }); }
    // the bloom stands in the mouth, its foot a little forward of the skull's crown
    const bo = vadd(hb, vmul(X, 0.3 * SK)), at = (ax, rad, a) => vadd(bo, vadd(vmul(X, ax), vadd(vmul(Y, Math.cos(a) * rad), vmul(Z, Math.sin(a) * rad))));
    const radial = a => vadd(vmul(Y, Math.cos(a)), vmul(Z, Math.sin(a))), pf = (a, phi, roll) => { const d = radial(a), px = vadd(vmul(X, Math.cos(phi)), vmul(d, Math.sin(phi))), pz = vadd(vmul(X, -Math.sin(phi)), vmul(d, Math.cos(phi))); let R = M3(px, vcross(pz, px), pz); if (roll) R = mm(R, rotX(roll)); return R; };
    // the calyx: two rings of keeled basalt sepals, an armour wrapped tight round the bud; blooming, they fold right back
    for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + Math.PI / 5 + twist; I('sepal', colsK(pf(a, lerp(-0.1, 1.95, k), 0), HB, HB * 1.12, HB), at(-0.05 * HB, lerp(0.34, 0.42, k) * HB, a), Object.assign({ glow: vein * 0.7, wear: hh(j, 21) }, gx)); }
    for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + twist; I('sepal', colsK(pf(a, lerp(-0.16, 1.55, k), 0), HB * 0.85, HB * 0.95, HB * 0.85), at(0.1 * HB, lerp(0.28, 0.36, k) * HB, a), Object.assign({ glow: vein * 0.7, wear: hh(j, 25) }, gx)); }
    // the petals in three layers (seven outer, seven between, five at the core), each breathing and twitching on its own; tips curled
    const flu = (j, o) => Math.sin(bt * 2.1 + j * 1.3 + o) * 0.05 + tw * 0.14 * Math.sin(j * 2.7 + 1 + o) + hs * 0.15 + wind * Math.sin(bt * 14 + j + o) * 0.03;
    for (let j = 0; j < 7; j++) { const a = j / 7 * TAU + twist; I('petal', colsK(pf(a, lerp(-0.3, 1.38, k) + flu(j, 0), 0.03 * Math.sin(bt + j)), HB, HB, HB * lerp(0.6, 1, k)), at(0.05 * HB, lerp(0.3, 0.5, k) * HB, a), Object.assign({ glow: 0.35 + k * 0.6, kind: k, wear: hh(j, 31) }, gx)); }
    for (let j = 0; j < 7; j++) { const a = (j + 0.5) / 7 * TAU + twist; I('petal', colsK(pf(a, lerp(-0.34, 1.02, k) + flu(j, 1), 0), HB * 0.82, HB * 0.82, HB * 0.82 * lerp(0.6, 1, k)), at(0.12 * HB, lerp(0.24, 0.4, k) * HB, a), Object.assign({ glow: 0.4 + k * 0.6, kind: Math.min(1, k * 1.3), wear: hh(j, 35) }, gx)); }
    for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + Math.PI / 5 + twist; I('ipetal', colsK(pf(a, lerp(-0.3, 0.72, k * 0.85) + flu(j, 2), 0), HB, HB, HB), at(0.2 * HB, 0.3 * HB, a), Object.assign({ glow: 0.35 + k * 0.7, kind: k, wear: hh(j, 41) }, gx));
      I('cpetal', colsK(pf(a + Math.PI / 5, lerp(-0.32, 0.45, k) + flu(j, 3), 0), HB, HB, HB), at(0.28 * HB, 0.22 * HB, a + Math.PI / 5), Object.assign({ glow: 0.4 + k * 0.8, kind: k, wear: hh(j, 45) }, gx)); }
    // the heart, and the orb it bares: it flickers while it lies forced up
    const stun = m.stunT > 0 || M.demo === 'lie', heart = at(0.62 * HB, 0, 0), orbP = at((0.95 + k * 0.12) * HB, 0, 0), ko = cl((k - 0.15) / 0.5);
    I('heart', colsK(Rb, HB * 0.95, HB * 0.85, HB * 0.85), heart, Object.assign({ glow: vein * 0.6 + k * 0.5, wear: 0.4 }, gx));
    I('orb', Rb, orbP, { s: HB * (0.62 + 0.45 * ko), glow: (0.25 + 1.4 * ko) * (1 - dead), kind: stun ? 1 : 0, fx: dead, glow2: 0, outline: false });
    out.A.orb = orbP; out.A.heart = heart; out.A.mouth = at(1.9 * HB * (1 - 0.5 * k), 0, 0); out.A.bud = at(0.85 * HB, 0, 0); out.A.budX = X; out.k = k; out.ko = ko; out.stun = stun;
    out.occ.push([heart, 0.6 * HB]); out.occ.push([vadd(hb, vmul(X, -0.45 * SK)), 0.75 * SK]);
    /* the blades, seated in the petal ring: closed, they stand round the bud like a guard of knives; as it blooms the ring opens
       out past the petals and turns fast, each blade spinning edge-on, glowing; lying forced up they hang wide and slow */
    const Gd = G2(), BL = Gd.blades(M, F, k, sw, lieK, wind, hs, bt), Rr = (0.95 + 1.85 * k + 0.5 * lieK) * HB + hs * 0.35 - wind * 0.3, axl = (0.75 - 0.45 * k) * HB, cR = at(axl, 0, 0);
    for (const b of BL.list) { const a = b.a, d = radial(a), tg = vcross(X, d), tl = 0.95 - 0.75 * k + Math.sin(bt * 1.3 + b.j) * 0.06, bx = vnrm(vadd(vmul(d, Math.cos(tl)), vmul(X, Math.sin(tl)))), cres = b.j % 2 === 0, sz = (cres ? 0.72 : 0.64) * (sw / 1.35);
      let R = M3(bx, tg, vcross(bx, tg)); R = mm(R, rotX(b.rs * (0.15 + BL.spin * 0.9))); if (cres) R = mm(R, rotZ(-Math.PI / 2));
      const p = vadd(cR, vadd(vmul(d, Rr), vmul(X, Math.sin(bt * 1.7 + b.j * 2.1) * 0.12 * (1 - BL.spin * 0.5)))), al = bud.peek ? cl((F.base[2] + 1.2) / 0.8) : 1;
      if (al > 0.02) I(cres ? 'cres' : 'kite', colsK(R, sz, sz, sz), p, { al: al > 0.98 ? 1 : al, glow: BL.glowK * (1 - dead), kind: b.j % 2 ? 1 : 0, glow2: fl * 0.5, fx: dead, wear: hh(b.j, 51) });
      out.blades.push({ p, a, j: b.j, spin: BL.spin, glowK: BL.glowK, al, ring: { c: cR, Y, Z, R: Rr } }); } }
  /* the fall's body: from its points as it stood (E.B0, 2D world), the risen stretch topples forward over its foot in the sand */
  function fallBody(E) { const u = E.fall, B = E.B0, out = [], ic = E.ic, fx = E.fwd[0], fy = E.fwd[1], b = B[ic];
    for (let i = 0; i < B.length; i++) { const p = B[i]; if (i >= ic || !(p.z > 0)) { out.push({ x: p.x, y: p.y, z: p.z }); continue; }
      const dx = p.x - b.x, dy = p.y - b.y, d0 = dx * fx + dy * fy, lat = -dx * fy + dy * fx, rho0 = Math.hypot(d0, p.z), ph0 = Math.atan2(p.z, d0), rhoT = (ic - i) * SEG * 0.92, ue = u * u;
      const rho = lerp(rho0, rhoT, ue), ph = lerp(ph0, 0.02, ue), dd = rho * Math.cos(ph), lt = lat * (1 - ue);
      out.push({ x: b.x + fx * dd - fy * lt, y: b.y + fy * dd + fx * lt, z: Math.max(0.15 * ue, rho * Math.sin(ph)) + (E.bounce || 0) * Math.sin(i * 0.7) * 0.15 }); }
    return out; }
  /* the fallen bloom: the petals off it and down on the sand round its head, the blades dropped point first into the sand, the orb dark */
  function fallenBloom(FX, m, M, S, E, P, out, I, t) { const dead = 1, sh = Math.max(0, E.t - 1.4);
    for (let i = 0; i < (E.pet || []).length; i++) { const q = E.pet[i], u = cl((sh - q.delay) / 0.9), ue = ease(u), up = Math.sin(Math.PI * Math.min(1, u)) * q.up;
      const R = mm(rotAxis(q.ax, Math.sin(Math.PI * u) * 1.6), mslerp(q.R0, q.RT, ue)), o = vlerp(q.o0, q.oT, Math.min(1, u * 1.05)); o[2] = lerp(q.o0[2], q.oT[2], u * u) + up - E.sink * 0.5;
      I(q.part, colsK(R, q.s, q.s, q.s), o, { glow: 0.2 * (1 - u), kind: 1, fx: 0.7 + 0.3 * u, wear: q.w, al: 1 - sstep(3.4, 4.6, E.t - 1.4) * 0.6 }); }
    for (let i = 0; i < (E.bl || []).length; i++) { const q = E.bl[i], tt = Math.max(0, sh - q.delay), z = Math.max(q.zT, q.o0[2] + q.vz * tt - 9 * tt * tt), land = z <= q.zT, u = land ? 1 : cl(tt / q.tl);
      const R = mslerp(q.R0, q.RT, ease(u)), o = [q.o0[0] + q.vx * Math.min(tt, q.tl), q.o0[1] + q.vy * Math.min(tt, q.tl), z - E.sink * 0.8];
      I(q.part, colsK(R, q.s, q.s, q.s), o, { glow: 0.6 * (1 - u), kind: q.kind, fx: 0.5 * u, wear: q.w }); }
    const h = P[0], X = E.X || [1, 0, 0], Rb = frameXZ(X, [0, 0, 1]), wi = sstep(1.5, 3.2, E.t);
    I('heart', colsK(Rb, 1.3 * (1 - 0.35 * wi), 1.25 * (1 - 0.35 * wi), 1.25 * (1 - 0.35 * wi)), vadd(h, vmul(X, 0.7)), { glow: 0, fx: dead, wear: 0.4 });
    I('skull', colsK(Rb, 1.28, 1.28, 1.28), h, { fx: dead, wear: 0.27 }); I('jaw', colsK(mm(Rb, rotY(0.55 + 0.1 * wi)), 1.28, 1.28, 1.28), vadd(h, vmul(X, -0.92)), { fx: dead, wear: 0.33 });
    for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + Math.PI / 5, d = vadd(vmul(Rb.y, Math.cos(a)), vmul(Rb.z, Math.sin(a))), phi = 1.3 + 0.4 * wi, R = M3(vadd(vmul(X, Math.cos(phi)), vmul(d, Math.sin(phi))), [0, 0, 0], vadd(vmul(X, -Math.sin(phi)), vmul(d, Math.cos(phi)))); R.y = vcross(R.z, R.x);
      I('sepal', colsK(R, 1.3, 1.3, 1.3), vadd(h, vmul(d, 0.6)), { fx: dead, wear: hh(j, 21) }); }
    out.A.orb = vadd(h, vmul(X, 1.0)); out.A.heart = out.A.orb; out.A.mouth = out.A.orb; out.k = 0; out.ko = 0; }

  /* ================= drawing ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0], LW = vnrm([0.62, 0.18, 0.76]), SBW = vnrm([-0.35, -0.3, 0.88]), RIMW = vnrm([-0.55, -0.72, 0.42]), UPW = [0, 0, 1];
  const GLCAP = 1700, RIMC = [0.5, 1.05, 1.15], AMBC = [1, 1, 1], OUTC = [0.075, 0.035, 0.045];
  function mkView(x, y, o) { const T = o.T, k = T * (o.scale || 1), X0 = o.sx(x), Y0 = o.sy(y); return { T, k, Rh: I3(), x, y, toS: p => [X0 + p[0] * k, Y0 + (p[1] * GY - p[2] * ZK) * k] }; }
  let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0, GLBOX = null; const GLI = [], GLJ = [], OCC = new Float32Array(48);
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  const win = k => typeof window !== 'undefined' && window[k];
  /* is the model drawn on the GPU here (its meshes made on the first ask) */
  function glOn() { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || win('__SAR_GL') === 0 || !GLM.ok()) return false; if (GLM.soft && !win('__SAR_GL')) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Sarrukh: meshes', e); return false; } } return true; }
  /* the GPU painter for its light (null: the old 2D effects) */
  const fg = () => { try { if (win('__SAR_FX') === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  /* one GPU pass: the parts in list into the box round them; o.clip [level, band]: nothing below the sand */
  function glPass(c, V, list, al0, o) { const k = V.k, X0 = V.toS([0, 0, 0]), PX = EXW, PY = [0, GY, -ZK], PD = CW;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const [bc, brr] = bounds(it.part), s = it.s || 1, R = it.R, ck = Math.max(vlen(R.x), vlen(R.y), vlen(R.z)), rr = brr * s * ck * 1.05 * k, w = vadd(it.o, mv(R, vmul(bc, s))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__SAR_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.1 * (W / bw)), outlineCol: OUTC, keep: 1 /* v434 PO: GLM keeps its canvas while the box wanders (no reallocation a frame) */ };
    if (o.clip) S.clip = o.clip;
    if (o.occ && o.occ.length) { let n2 = 0; for (const [p, r] of o.occ) { if (n2 >= 12) break; OCC[n2 * 4] = p[0]; OCC[n2 * 4 + 1] = p[1]; OCC[n2 * 4 + 2] = p[2]; OCC[n2 * 4 + 3] = r; n2++; } S.occ = OCC; S.nocc = n2; }
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const s2 = it.s || 1, Rw = it.R, Tt = it.o;
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.5 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.d = vdot(Tt, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    if (o.into) o.into(cvs, W, H, bx0, by0, bw, bh); else c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
    GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H]; return true; }
  /* the soft shadow on the sand (without the GPU painter): one cached blob under each raised stretch */
  let BLOB = null;
  function blob() { if (BLOB) return BLOB; BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(40,22,10,1)'); gr.addColorStop(0.5, 'rgba(40,22,10,.6)'); gr.addColorStop(1, 'rgba(40,22,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return BLOB; }
  let LAST = null;
  function rigNow(FX, m) { const M = FX.mem, S = st3(FX, m), key = (M.bt || 0) + (S.end ? S.end.t * 1000 : 0); if (S.R && S.Rt === key && S.Rm === m) return S.R; S.R = rig(FX, m, M.bt || 0); S.Rt = key; S.Rm = m; return S.R; }
  /* the boss: X, Y its screen place (its ground point) */
  function drawBoss(c, FX, m, X, Y, T, t) { if (!glOn()) return false; const R = rigNow(FX, m); if (!R) return false;
    const V = mkView(m.x, m.y, { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T }); LAST = { R, V };
    if (!fg()) { const b = blob(); c.save(); for (const s of R.shad) { const q = V.toS([s[0], s[1], 0]), r = s[2] * V.k * (1 / (1 + Math.max(0, s[3]) * 0.12)); c.globalAlpha = 0.35; c.drawImage(b, q[0] - r, q[1] - r * GY, r * 2, r * 2 * GY); } c.restore(); }
    let ok = false;
    try { ok = glPass(c, V, R.inst, 1, { t: FX.mem.bt || t, clip: [0, 1e-6], occ: lowFx() ? null : R.occ }); } catch (e) { glFail(); if (typeof console !== 'undefined') console.warn('Sarrukh: draw', e); ok = false; }
    return ok; }
  const vis = (FX, m, p) => [m.x + p[0], m.y + p[1] * GY - p[2] * ZK];   // (a model point -> the floor point it shows over)
  /* (the fight's queries on the GPU path) the orb's weak point (where it shows), the body's hit proxies (lifted as the model is) */
  function orbAt(FX, m) { const R = rigNow(FX, m); return R && R.A.orb ? vis(FX, m, R.A.orb) : [m.x, m.y - 2]; }
  function mouthAt(FX, m) { const R = rigNow(FX, m); return R && R.A.mouth ? vis(FX, m, R.A.mouth) : [m.x, m.y - 2]; }

  /* ================= the motion: the bloom's lag, its effects' clocks, the fall ================= */
  function update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M || !(dt > 0)) return; const S = st3(FX, m);
    for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += dt; if (f.t >= f.life) S.fx.splice(i, 1); }
    // the bloom lags its neck: a spring kicked by the head's turn and its rise and fall
    const L = S.lag, hd = M.hd == null ? Math.PI / 2 : M.hd; let dh = S.ph == null ? 0 : hd - S.ph; while (dh > Math.PI) dh -= TAU; while (dh < -Math.PI) dh += TAU; S.ph = hd;
    const z0 = M.zs ? M.zs[0] : 0, dz = S.pz == null ? 0 : (z0 - S.pz) / dt; S.pz = z0;
    L.vy += (-40 * L.y - 6 * L.vy - clampV(dh / dt, -6, 6) * 0.05) * dt; L.y = clampV(L.y + L.vy * dt, -0.3, 0.3);
    L.vp += (-40 * L.p - 6 * L.vp - clampV(dz, -12, 12) * 0.02 + ((m.hitSq || 0) > 0.9 ? 0.5 : 0)) * dt; L.p = clampV(L.p + L.vp * dt, -0.3, 0.3);
    if (S.end) dying(FX, m, M, S, dt); }
  /* ---- the fall ---- */
  function die(FX, m) { const S = st3(FX, m), M = FX.mem; if (S.end) return; S.end = { t: 0, fall: 0, sink: 0, B0: null, burst: false, landed: false };
    M.mode = 'surf'; M.roar = 1; M.menace = 1; M.wasStun = false; S.fx.push({ kind: 'dying', t: 0, life: 1.45, seed: 3 }); FX.H.sfx.hum(); FX.H.shake(lowFx() ? 4 : 8, 0.8); }
  function dying(FX, m, M, S, dt) { const E = S.end; E.t += dt;
    if (!E.B0) { M.mode = 'surf'; M.bloom = Math.min(1, (M.bloom || 0) + dt * 2); M.roar = Math.max(M.roar || 0, 0.8); if (E.t < 1.3 && !lowFx() && Math.random() < dt * 7) FX.H.shake(1.4, 0.1); }
    if (E.t >= 1.4 && !E.B0) { const Gd = G2(), R = rigNow(FX, m); E.B0 = Gd.posed(FX, m, M.bt || 0).map(p => ({ x: p.x, y: p.y, z: p.z })); M.dead3 = true;
      let ic = E.B0.findIndex(p => !(p.z > 0)); if (ic < 1) ic = Math.min(N - 1, 9); E.ic = ic; const hd = M.hd == null ? Math.PI / 2 : M.hd; E.fwd = [Math.cos(hd), Math.sin(hd)]; E.X = vnrm([E.fwd[0], E.fwd[1] / GY, -0.25]);
      // the petals and the blades, as they were, and where they will lie
      E.pet = []; E.bl = []; if (R) for (const it of R.inst) { if (it.part === 'petal' || it.part === 'ipetal' || it.part === 'cpetal') { const s = vlen(it.R.x), R0 = colsK(it.R, 1 / s, 1 / s, 1 / s), out = vnrm([it.o[0] - (R.A.head ? R.A.head[0] : 0), it.o[1] - (R.A.head ? R.A.head[1] : 0), 0]), i = E.pet.length, d = 1.4 + hh(i, 4) * 1.8;
          let RT = M3(out, [0, 0, 0], [0, 0, 1]); RT.y = vcross(RT.z, RT.x); if (hh(i, 9) < 0.35) RT = mm(RT, rotX(Math.PI)); RT = mm(rotZ((hh(i, 2) - 0.5) * 1.2), RT);
          E.pet.push({ part: it.part, s, R0, RT, o0: it.o.slice(), oT: [it.o[0] + out[0] * d, it.o[1] + out[1] * d, 0.08], ax: vnrm([hh(i, 1) - 0.5, hh(i, 3) - 0.5, hh(i, 5) - 0.2]), delay: hh(i, 6) * 0.35, up: 0.8 + hh(i, 7) * 1.2, w: it.wear }); }
        else if (it.part === 'cres' || it.part === 'kite') { const s = vlen(it.R.x), R0 = colsK(it.R, 1 / s, 1 / s, 1 / s), i = E.bl.length, a = hh(i, 13) * TAU, RT = mm(rotZ(a), rotY(it.part === 'kite' ? Math.PI / 2 + 0.25 : Math.PI / 2 - 0.15 + hh(i, 2) * 0.3));
          E.bl.push({ part: it.part, s, R0, RT, o0: it.o.slice(), vx: (hh(i, 3) - 0.5) * 1.5, vy: (hh(i, 4) - 0.5) * 1.5, vz: 1.5 + hh(i, 5), zT: it.part === 'kite' ? 0.15 : -0.1, tl: 0.7 + hh(i, 6) * 0.3, delay: 0.05 + hh(i, 8) * 0.3, kind: it.kind, w: it.wear }); } }
      const o = orbAt(FX, m); burst(FX, o[0], o[1], 3.2, CYAN, { kind: 'orb', shake: lowFx() ? 6 : 14 }); FX.H.flash(0.35, CYAN_HI); FX.H.sfx.crash(); FX.H.sfx.crack(); const g = FX.g; if (g) g.hitStop = Math.max(g.hitStop || 0, lowFx() ? 0.07 : 0.12);
      FX.H.text(m.x, m.y - 4.2, 'The bloom bursts!', CYAN_HI, 16); }
    if (E.B0) { const was = E.fall; E.fall = cl((E.t - 1.45) / 0.75); E.sink = sstep(2.6, 5.4, E.t); E.bounce = E.fall >= 1 ? Math.max(0, 1 - (E.t - 2.2) * 3) * Math.sin((E.t - 2.2) * 18) : 0;
      if (was < 1 && E.fall >= 1 && !E.landed) { E.landed = true; FX.H.sfx.crash(); FX.H.shake(lowFx() ? 6 : 12, 0.4); const fb = fallBody(E); for (let i = 0; i < E.ic; i += 2) { const p = fb[i]; erupt(FX, p.x, p.y, 1.1 + 0.3 * (1 - i / E.ic), { n: 0, shake: 0, small: true }); } }
      if (E.sink > 0.02 && E.sink < 0.95 && Math.random() < dt * (lowFx() ? 3 : 7)) { const fb = fallBody(E), p = fb[Math.floor(Math.random() * N)]; if (FX.H && FX.H.part) for (let k = 0; k < 3; k++) FX.H.part({ kind: 'sand', x: p.x + FX.rnd(-0.6, 0.6), y: p.y, vx: FX.rnd(-1.5, 1.5), vy: -2 - Math.random() * 2, g: 9, life: 0.5, max: 0.5, size: 2, color: OCHRE_HI }); } } }

  /* ================= its light (FGFX): the floor's (the warnings, shadows, under everything standing) and the upper (over everything) ================= */
  const rgbaH = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`; };
  /* without the GPU painter: the engine's own 2D warning (the shape it had before), drawn from the warning's shape (geo) */
  function tele2D(c, FX, s, T, t) { const u = cl(s.age / s.t), col = s.col || CYAN, X = FX.sx(s.x), Y = FX.sy(s.y), geo = s.geo;
    const path = grow => { c.beginPath();
      if (geo === 'circle') c.arc(X, Y, Math.max(0.1, s.r * T * grow), 0, TAU);
      else if (geo === 'line') { c.save(); c.translate(X, Y); c.rotate(s.a); c.rect(0, -s.w / 2 * T, s.len * T * grow, s.w * T); c.restore(); }
      else if (geo === 'ring') { const r0 = s.r0 * T, r1 = s.r0 * T + (s.r1 - s.r0) * T * grow; if (s.gaps && s.gaps.length) { const gs = s.gaps.map(([a, w]) => [a - w, a + w]).sort((p, q) => p[0] - q[0]); for (let i = 0; i < gs.length; i++) { const b0 = gs[i][1], b1 = gs[(i + 1) % gs.length][0] + (i === gs.length - 1 ? TAU : 0); c.moveTo(X + Math.cos(b0) * r1, Y + Math.sin(b0) * r1); c.arc(X, Y, r1, b0, b1); c.arc(X, Y, r0, b1, b0, true); c.closePath(); } } else { c.arc(X, Y, r1, 0, TAU); c.moveTo(X + r0, Y); c.arc(X, Y, r0, 0, TAU, true); } } };
    c.save(); path(1); c.fillStyle = rgbaH('#0A0410', 0.13); c.fill('evenodd'); c.globalCompositeOperation = 'lighter';
    path(geo === 'ring' ? 1 : u); c.fillStyle = rgbaH(col, 0.04 + u * 0.1); c.fill('evenodd');
    path(1); c.lineWidth = 1.5 + u * 1.5; c.strokeStyle = rgbaH(col, 0.45 + 0.4 * Math.sin(t * 18) * u + u * 0.3); c.stroke();
    c.restore(); }
  function overlay(c, FX, t, T) { const M = FX.mem; if (!M) return; const teles = FX.S && FX.S.tele ? FX.S.tele.filter(s => s.sar && (!s.done || s.linger)) : [], F = fg();
    if (!F) { for (const s of teles) if (!s.done) tele2D(c, FX, s, T, t); return; }
    const Q = F.begin(c, null), lf = lowFx(), m = FX.m;
    try { for (const s of teles) tellLight(Q, FX, s, T, t, lf);
      if (m && glOn()) floorOf(Q, FX, m, M, T, t, lf);
      for (const f of st3(FX, m || { x: 0, y: 0 }).fx) floorOne(Q, FX, f, T, t, lf); } finally { F.flush(c); } }
  function tellLight(Q, FX, s, T, t, lf) { const u = cl(s.age / s.t), X = FX.sx(s.x), Y = FX.sy(s.y), sd = s.seed || 1.3, pul = 0.5 + 0.5 * Math.sin(t * (6 + 10 * u));
    if (s.sar === 'wake') { if (s.done) return; const hl = s.len / 2, c = Math.cos(s.a), sn = Math.sin(s.a), cx = X + c * hl * T, cy = Y + sn * hl * T, hw = s.w / 2 * T * 1.15;
      Q.quad(256, cx, cy, c * hl * T, sn * hl * T, -sn * hw, c * hw, s.col || CYAN, 0.85 + 0.15 * pul * u, u * 0.999, sd, hl / (s.w / 2));
      Q.glow(X, Y, T * (1.2 + 0.8 * u), CYAN, 0.12 + 0.25 * u); }
    else if (s.sar === 'breach' || s.sar === 'land') { if (s.done) return; const R = s.r * T * 1.08; Q.quad(257, X, Y, R, 0, 0, R, s.sar === 'land' ? AMBER : OCHRE_HI, 0.9, u * 0.999, sd, 0); Q.glow(X, Y, R * (0.5 + 0.4 * u), AMBER, 0.05 + 0.2 * u * (0.6 + 0.4 * pul)); }
    else if (s.sar === 'spit' || s.sar === 'brood') { if (s.done) return; const R = s.r * T * 1.1; Q.quad(259, X, Y, R, 0, 0, R, BONE, 0.95, u * 0.999, sd, 0); if (s.sar === 'spit') Q.glow(X, Y, R * 0.7, CYAN, 0.08 + 0.18 * u); }
    else if (s.sar === 'quake') { const g = s.gaps && s.gaps.length > 1 ? s.gaps : [[0, 0.4], [Math.PI, 0.4]], R1 = s.r1 * T * 1.04, roll = s.done ? 1 : 0, fade = s.done ? 1 - cl((s.age - s.t) / (s.linger || 2.6)) : 0.55 + 0.45 * u;
      if (R1 < 1) return; const wa = a => Math.atan2(Math.sin(a), Math.cos(a));
      Q.quad(258, X, Y, R1, 0, 0, R1, OCHRE_HI, fade * (roll ? 1 : 0.85), s.r0 / (s.r1 * 1.04), wa(g[0][0]), wa(g[1][0]) + 4 + 10 * roll);
      for (const [ga] of g) { const mr = (s.r0 + s.r1) / 2 * T, ca = Math.cos(ga), sa = Math.sin(ga); Q.glow(X + ca * mr, Y + sa * mr, T * 1.3, CYAN, (0.18 + 0.14 * pul) * fade);
        if (!lf) for (let k = 0; k < 2; k++) { const ph = (k / 2 + t * 0.7) % 1, rr = (s.r0 + ph * (s.r1 - s.r0 + 0.6)) * T; Q.star(X + ca * rr, Y + sa * rr, T * 0.3, 0.7 * Math.sin(Math.PI * ph) * fade, CYAN_HI); } } } }
  /* the model's own floor light: the shadows of its raised stretches, the cyan under its wake while it gathers, the spires' hum */
  function floorOf(Q, FX, m, M, T, t, lf) { const R = rigNow(FX, m); if (!R) return; const V = mkView(m.x, m.y, { T, sx: FX.sx, sy: FX.sy });
    for (const s of R.shad) { const q = V.toS([s[0], s[1], 0]), k = 1 / (1 + Math.max(0, s[3]) * 0.15); Q.sshadow(q[0], q[1] + T * 0.1, s[2] * T * 1.1 * k, s[2] * T * 0.55 * k, 0.32 * k, '#3A2210'); }
    for (const b of R.blades) if (b.al > 0.3 && b.p[2] > 0) { const q = V.toS([b.p[0], b.p[1], 0]); Q.sshadow(q[0], q[1], T * 0.45, T * 0.2, 0.18 / (1 + b.p[2] * 0.2), '#3A2210'); }
    if (M.mode === 'under' && m.act !== 'enter' && !(m.stunT > 0)) { const g = (M.menace || 0) * 0.5 + (M.peek || 0) * 0.4; if (g > 0.02) { Q.glow(FX.sx(m.x), FX.sy(m.y), T * 2.6, CYAN, 0.3 * g * (0.8 + 0.2 * Math.sin(t * 6))); Q.quad(261, FX.sx(m.x), FX.sy(m.y), T * 2.4, 0, 0, T * 2.4 * GY, CYAN, 0.6 * g, 0, 2.1, 1); } }
    const under = M.mode === 'under' && !(m.stunT > 0) && m.act !== 'enter';
    for (const h of M.spires || []) { const o = h.obj; if (!o || o.dead) continue; const X = FX.sx(o.x), Y = FX.sy(o.y), hum = under ? 0.6 + 0.4 * Math.sin(t * 6 + o.idx) : 0.2; Q.glow(X, Y, T * 1.6, CYAN, 0.12 + 0.2 * hum); if (under && !lf) Q.quad(261, X, Y, T * 1.8, 0, 0, T * 1.8 * GY, CYAN, 0.5 * hum, 0, o.idx * 3.1, 1); } }
  function floorOne(Q, FX, f, T, t, lf) { const u = cl(f.t / f.life);
    if (f.kind === 'erupt') { const X = FX.sx(f.x), Y = FX.sy(f.y), R = T * f.r; Q.smoke(X, Y - T * 0.15, R * (0.7 + 0.8 * u), 0.42 * (1 - u) * (f.small ? 0.7 : 1), f.seed, DUST); Q.ripple(X, Y, R * (0.4 + 1.4 * u), OCHRE_HI, 0.3 * (1 - u), f.seed, GY, 0.1); }
    else if (f.kind === 'res') { const X = FX.sx(f.x), Y = FX.sy(f.y), R = T * f.r * (0.4 + 0.9 * Math.sqrt(u)); Q.quad(261, X, Y, R, 0, 0, R * GY, CYAN, 1 - u * 0.4, u, f.seed, 0); } }
  /* the upper light: the bloom's light and the orb's, the blades' glow and trails, the roar, the spires' notes, the bursts, the spit, the fall */
  function upper(Q, FX, m, M, S, T, t, lf, gl) { const R = gl ? rigNow(FX, m) : null, V = mkView(m.x, m.y, { T, sx: FX.sx, sy: FX.sy }), live = !S.end;
    if (R && live && !m.dead) { const k = R.k || 0, ko = R.ko || 0, roar = M.roar || 0;
      if (R.A.orb && ko > 0.02) { const q = V.toS(R.A.orb), fl = R.stun ? 0.6 + 0.4 * Math.abs(Math.sin(t * 13) * Math.sin(t * 5.3 + 1)) : 0.88 + 0.12 * Math.sin(t * 6);
        Q.quad(263, q[0], q[1], T * (1.6 + 1.4 * k), 0, 0, T * (1.6 + 1.4 * k), CYAN, 0.55 * ko * fl, k, (M.bA || 0) * 0.6, R.stun ? 1 : 0); Q.glow(q[0], q[1], T * 0.9, CYAN_HI, 0.45 * ko * fl); }
      if (R.A.bud && (roar > 0.02 || (M.menace || 0) > 0.3)) { const q = V.toS(R.A.bud); Q.glow(q[0], q[1], T * 3.6, CYAN, 0.3 * Math.max(roar, (M.menace || 0) * 0.3)); }
      // the blades: a glow on each and its light trailing along the ring behind it as it spins
      for (const b of R.blades) { if (b.al < 0.05) continue; const q = V.toS(b.p), gc = b.j % 2 ? AMBER : CYAN; if (b.glowK > 0.03) Q.glow(q[0], q[1], T * 1.0, gc, 0.4 * b.glowK * b.al);
        if (b.spin > 0.15) { const n = lf ? 3 : 6, len = 0.25 + b.spin * 0.8, G = b.ring; let p0 = q; for (let i = 1; i <= n; i++) { const a = b.a - len * i / n, w = vadd(G.c, vadd(vmul(G.Y, Math.cos(a) * G.R), vmul(G.Z, Math.sin(a) * G.R))), p1 = V.toS(w); Q.rbeam(p0[0], p0[1], p1[0], p1[1], T * 0.22 * (1 - 0.5 * i / n), gc, 0.55 * b.spin * b.al, 1 - (i - 1) / n, 1 - i / n); p0 = p1; } } }
      // under the sand, pushing on: grains spraying off the front of the wake
      if (M.mode === 'under' && !lf && (M.spd || 0) > 0.6) { const sp = Math.min(1, (M.spd || 0) / 8), hd = M.hd || 0; for (let i = 0; i < 6; i++) { const ph = ((M.bt || t) * 3 + i * 0.37) % 1, a = hd + (i - 2.5) * 0.25, x = FX.sx(m.x) + Math.cos(a) * T * (1.2 + ph * 1.6), y = FX.sy(m.y) - T * (0.9 + ph * 1.2 - ph * ph * 1.4) + Math.sin(a) * T * 0.3; Q.star(x, y, T * 0.16, 0.6 * (1 - ph) * sp, '#FFF4DC'); } } }
    // the spires' notes: rings of light rising off their forks while it is under the sand
    const under = M.mode === 'under' && m && !(m.stunT > 0) && m.act !== 'enter' && live;
    if (under) for (const h of M.spires || []) { const o = h.obj; if (!o || o.dead) continue; const X = FX.sx(o.x), Y = FX.sy(o.y) - T * 3.75; Q.glow(X, Y, T * 1.4, CYAN, 0.3 + 0.15 * Math.sin(t * 6 + o.idx));
      for (let i = 0; i < 3; i++) { const u = (t * 0.9 + i / 3 + o.idx * 0.2) % 1; Q.ring(X, Y - u * T * 1.2, T * (0.35 + u * 1.1), CYAN_HI, 0.55 * (1 - u), T * 0.08, 0.38); } }
    for (const f of S.fx) upperOne(Q, FX, m, f, T, t, lf, R, V); }
  function upperOne(Q, FX, m, f, T, t, lf, R, V) { const u = cl(f.t / f.life);
    if (f.kind === 'erupt') { const X = FX.sx(f.x), Y = FX.sy(f.y) - T * 0.5, Rr = T * f.r * (1.2 + 0.6 * u); Q.quad(262, X, Y, Rr, 0, 0, Rr, f.col || OCHRE_HI, 1, u, f.seed, f.small ? 0.5 : 1); }
    else if (f.kind === 'res') { const X = FX.sx(f.x), Y = FX.sy(f.y) - T * (f.h || 0); Q.glow(X, Y, T * f.r * 0.8, CYAN, 0.4 * (1 - u)); Q.glow(X, Y, T * 0.8, '#FFFFFF', 0.4 * (1 - u) * (1 - u)); }
    else if (f.kind === 'orb') { const X = FX.sx(f.x), Y = FX.sy(f.y), Rr = T * f.r * (1 + u); Q.quad(262, X, Y, Rr, 0, 0, Rr, CYAN, 1, u, f.seed, 1); Q.quad(263, X, Y, Rr * 0.9, 0, 0, Rr * 0.9, CYAN_HI, 0.8 * (1 - u), 1, f.seed + u * 2, 0); Q.glow(X, Y, T * 1.5, '#FFFFFF', 0.6 * (1 - u) * (1 - u)); }
    else if (f.kind === 'spit') { const p = R && R.A.mouth ? V.toS(R.A.mouth) : [FX.sx(f.x), FX.sy(f.y)], L = T * 3.2, c = Math.cos(f.a), s = Math.sin(f.a); Q.quad(260, p[0], p[1], c * L, s * L, -s * L, c * L, OCHRE_HI, 1, f.spread, f.seed, u); }
    else if (f.kind === 'roar' && R && R.A.bud) { const q = V.toS(R.A.bud), Rr = T * (2 + 3 * u); Q.quad(263, q[0], q[1], Rr, 0, 0, Rr, CYAN, 0.7 * (1 - u), 1, f.seed + u, 0); Q.ring(q[0], q[1], T * (1 + 5 * u), CYAN_HI, 0.5 * (1 - u), T * 0.3); }
    else if (f.kind === 'dying' && R && R.A.bud) { const q = V.toS(R.A.bud), g = sstep(0, 1, u), fl = 0.75 + 0.25 * Math.sin(t * 31); Q.glow(q[0], q[1], T * (1.5 + 2.5 * g), CYAN, 0.45 * g); Q.glow(q[0], q[1], T * 0.8, '#FFFFFF', 0.5 * g * fl);
      for (let i = 0; i < (lf ? 4 : 7); i++) { const a = i / 7 * TAU + 0.1 * Math.sin(t * 2 + i), Lr = T * (1.2 + 3 * g) * (0.7 + 0.3 * hh(i, 8)); Q.rbeam(q[0], q[1], q[0] + Math.cos(a) * Lr, q[1] + Math.sin(a) * Lr * 0.8, T * (0.2 + 0.25 * g), CYAN_HI, 0.55 * g * fl, 1, 0); } } }
  /* ---- the field: the spires (a picture kept for each stage of their cracking at the zoom; their hum is light) ---- */
  const SPC = new Map();
  function drawSpire(c, FX, o, X, Y, T, t) { if (!glOn()) return false; const cracked = 1 - o.hp / o.maxhp, ck = Math.min(3, Math.floor(cracked * 4)), sw = Math.sin(t * 1.3 + o.idx) * 0.02;
    const m0 = c.getTransform ? c.getTransform() : null, dev = m0 ? Math.max(0.25, Math.hypot(m0.a, m0.b)) : 1, qz = Math.round(Math.log(Math.max(1, T * dev)) * 14), Tq = Math.exp(qz / 14) / dev, key = qz + '|' + ck + '|' + (o.idx % 3);
    let pic = SPC.get(key);
    if (!pic) { const V0 = mkView(0, 0, { T: Tq, sx: v => v, sy: v => v }); let got = null;
      try { glPass(c, V0, [{ part: 'spire', R: rotZ(0.4 + (o.idx % 3) * 2.1), o: [0, 0, 0], s: 1, glow: 0.45, kind: ck / 3, wear: 0.3 + (o.idx % 3) * 0.2 }], 1, { t: 0, into: (cvs, W, H, bx0, by0, bw, bh) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(cvs, 0, 0); got = { cv, bx0, by0, bw, bh }; } }); } catch (e) { glFail(); }
      if (!got) return false; pic = got; if (SPC.size > 12) { for (const p of SPC.values()) if (p.cv) p.cv.width = p.cv.height = 1; SPC.clear(); } SPC.set(key, pic); }
    const b = blob(), f = T / Tq; c.save(); c.globalAlpha *= 0.45; c.drawImage(b, X - T * 1.2, Y - T * 0.4, T * 2.4, T * 0.8); c.restore();
    c.save(); c.translate(X, Y); c.rotate(sw); c.drawImage(pic.cv, 0, 0, pic.cv.width, pic.cv.height, pic.bx0 * f, pic.by0 * f, pic.bw * f, pic.bh * f); c.restore(); return true; }

  /* ================= the API for the fight (20y) ================= */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m) return false; const S = st3(FX, m), F = fg(); if (!F) return false; const Q = F.begin(c, null);
    try { upper(Q, FX, m, M, S, T, t, lowFx(), glOn()); } finally { F.flush(c); } return true; }
  /* a sand eruption (on the GPU painter in place of the engine's boom): grains thrown out, a shell of dust, the shake */
  function erupt(FX, x, y, r, o) { o = o || {}; const S = st3(FX, FX.m || { x, y }), sd = Math.random() * 40; S.fx.push({ kind: 'erupt', x, y, r, col: o.col, t: 0, life: 0.55 + r * 0.12, seed: sd, small: !!o.small });
    if (o.n) FX.H.sparks(x, y, OCHRE_HI, Math.round(o.n * 0.5), r * 5); if (o.shake !== 0) FX.H.shake(o.shake || r * 3, 0.22); }
  function burst(FX, x, y, r, col, o) { o = o || {}; const S = st3(FX, FX.m || { x, y }); S.fx.push({ kind: o.kind || 'erupt', x, y, r, col, t: 0, life: 0.7 + r * 0.1, seed: Math.random() * 40 }); if (o.shake) FX.H.shake(o.shake, 0.25); }
  function resonance(FX, x, y, r, h) { const S = st3(FX, FX.m || { x, y }), sd = Math.random() * 40; S.fx.push({ kind: 'res', x, y, r, h: h || 0, t: 0, life: 0.9, seed: sd }); }
  function spitFx(FX, x, y, a, spread) { const S = st3(FX, FX.m); S.fx.push({ kind: 'spit', x, y, a, spread: spread || 0.5, t: 0, life: 0.32, seed: Math.random() * 40 }); }
  function roarFx(FX) { const S = st3(FX, FX.m); S.fx.push({ kind: 'roar', t: 0, life: 0.9, seed: Math.random() * 40 }); }
  const fxOn = () => !!fg();
  /* the loading screen's jobs: the meshes, and one frame off-screen (the program and the buffers ready before the fight) */
  function preload(P) { if (!P || !P.gl) return []; return [() => { glOn(); }, () => { if (!glOn()) return; const cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d');
    try { glPass(c, mkView(0, 0, { T: 4, sx: v => 8 + v, sy: v => 8 + v }), Object.keys(MESH).map((k2, i) => ({ part: k2, R: I3(), o: [0, 0, i * 0.01], s: 0.2 })), 1, { t: 0, clip: [0, 1e-6] }); } catch (e) { /* (the 2D serpent) */ } cv.width = cv.height = 1; }]; }
  /* leaving the stage lets go of its pictures and of the last view (the meshes and the GL pools hold no stage objects: kept for the next fight) */
  function release() { LAST = null; for (const p of SPC.values()) if (p && p.cv) p.cv.width = p.cv.height = 1; SPC.clear(); }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no rift hook: nothing to register) */ }
  /* a studio portrait (tests): the model alone at screen (x, y) for a pose's memory (the 2D's art poses: { demo, hd, bloom ... }) */
  function studio(c, x, y, mem, o) { o = o || {}; if (!glOn()) return null; const T = o.T || 30, m = { x: 0, y: 0, hitSq: 0, stunT: mem.demo === 'lie' ? 1 : 0 }, M = Object.assign({ bt: o.t || 2 }, mem), lerpA = (a, b, u) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * u; };
    const FX = { mem: M, m, me: o.me || { x: 0, y: 6 }, K: { lerpA }, S: { lv: 1 } }; if (o.end) { st3(FX, m); }
    const R = rig(FX, m, M.bt); if (!R) return null; const V = mkView(0, 0, { T, sx: v => x + v * T, sy: v => y + v * T }); LAST = { R, V };
    const b = blob(); c.save(); for (const s of R.shad) { const q = V.toS([s[0], s[1], 0]), r = s[2] * V.k / (1 + Math.max(0, s[3]) * 0.12); c.globalAlpha = 0.35; c.drawImage(b, q[0] - r, q[1] - r * GY, r * 2, r * 2 * GY); } c.restore();
    return glPass(c, V, R.inst, 1, { t: M.bt, clip: [0, 1e-6], occ: R.occ }) ? R : null; }
  function studioSpire(c, x, y, ck, o) { o = o || {}; if (!glOn()) return false; const T = o.T || 30, V = mkView(0, 0, { T, sx: v => x + v * T, sy: v => y + v * T }); return glPass(c, V, [{ part: 'spire', R: rotZ(0.4), o: [0, 0, 0], s: 1, glow: o.glow == null ? 0.45 : o.glow, kind: ck / 3, wear: 0.3 }], 1, { t: 0 }); }
  return { on: glOn, fx: fxOn, init, update, drawBoss, drawFx, overlay, drawSpire, orbAt, mouthAt, liftOf, erupt, burst, resonance, spitFx, roarFx, die, preload, release, studio, studioSpire, headOf,
    __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get MESH() { return MESH; }, get last() { return LAST; }, get spires() { return SPC.size; }, rig: (FX, m) => rigNow(FX, m),
      get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a2, q) => a2 + (q ? q.ntri : 0), 0) : 0 }); } } };
})();
