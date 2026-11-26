/* ---------- (v451 TM, remade v454 TM2, lengthened v454 TM3) Tiamat, the six-star Thunder summon: a serpentine lightning dragon as a real 3D model on GLM ----------
   The user's concept (v454): a long, sinuous eel-dragon of the storm. A deep violet-blue scaled body with a pale, plated belly and
   magenta veins of light running down its flanks; a huge sail of a fin along its back (dark violet, ribbed, rows of glowing dots,
   fringed with white spikes); translucent ice-blue fan fins edged in violet with dotted glowing lines along their rays (a pair of
   great fin-wings at the shoulders, a pair at the middle, a pair low on the tail, an icy crest down the tail); a long S-curving tail
   ending in a large forked fish's tail fin; a fierce head with ear-fins, swept-back crest spines, glowing eyes and an open jaw of
   fangs round a glowing magenta mouth (its whisker tendrils of electricity are drawn by the move, 20k9m); small clawed fore and
   hind limbs; a row of dorsal spikes.
   - The rig: a spine of NR + 1 ring frames (s 0 the head's joint .. 1 the tail fin's root), integrated each pose from curvature
     channels out from the chest: the neck's lift and turn, the body's arch, the tail's curl, and two travelling waves (vertical and
     sideways) running from the head down the tail, so it swims through the air like an eel (one path: the head leads, the body and
     the tail follow its bends). The head (pitched on the neck) and its hinged jaw; for each side a fore limb and a hind limb (three
     bones each, placed by directions). Every vertex of both meshes rides one bone's frame (skinned rigidly), so the fins attached
     to the rings bend with the body; the fins and spikes also flutter (a sideways sway in their bone's frame, its weight growing
     toward their free edge, its phase running down the body: the sail ripples, the tail fin sweeps).
   - Two meshes, one GLM pass: the body (scales, spikes, head, limbs; with a thin indigo outline) and the membranes (the sail and
     every fin; see-through, drawn after it). Positions and normals rewritten in place each pose (GLM.touchGeo); attributes once.
   - Materials GLM 505..509 (20k5uz TM-MAT): 505 the scaled body (vA.y q: 1 the head .. 0 the tail; vA.z round it: 0 the spine,
     0.5 the belly), 506 a spike, ray, claw or crest spine (its fraction 0.4 x q; vA.y along it, root 0 .. tip 1), 507 an icy fin
     membrane and 509 the dark sail (fraction 0.4 x q; vA.y root 0 .. free edge 1; vA.z across it in rays: a ray at each whole
     number), 508 an eye (508.2 the mouth's glow, 508.4 a fang). The uniforms: uSpill the formation's front (under 1.45 still
     forming: the chest first, then the head, the fins, the tail), uKind the charge's front (the veins and dots brightening from the
     tail, q 0, to the jaws, q 1), uFx the break-up into arcs, uGlow its brightness, uGlow2 a white flash. S.clip cuts it at the floor.
   - (v457 TM4) A path mode (P.path, P.lc): the spine laid along a flight path instead of integrated from the curvature channels, so
     it can fly a sweeping course, climb in a corkscrew (the path's roll turning the body round) and plunge, the body following the
     head's path (pathRings).
   - The view: the game's floor top-down (a tile a square): screen x = x, screen y = y - 0.9 z (tiles), as Moby Dick's.
   TIAMAT_GL: usable(), warm(), ready(), step(), release() (frees the GPU buffers; returns how many), gpuCount(), pose(P) (poses the
   meshes and returns the anchors in tiles from the origin), draw(c, o) (the GPU picture), draw2D(c, o) (the painted picture from
   the same pose when WebGL is missing), scr, DIMS, STATS. Real-GPU WebGL only (window.__TM_GL = 1 or __NG_GL = 1 force it on a
   software rasteriser for the tests; __TM_GL = 0 turns it off). */
const TIAMAT_GL = (() => {
  const TAU = Math.PI * 2;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const nmix = (a, b, u) => vnrm(vlerp(a, b, u));
  /* a frame: its columns x (forward), y (left), z (up); turns about its own axes */
  const FR = (x, y, z) => ({ x, y, z });
  function frameX(d, up) { const x = vnrm(d); let y = vcross(up || [0, 0, 1], x); if (vlen(y) < 1e-5) y = vcross([1, 0, 0], x); if (vlen(y) < 1e-5) y = [0, 1, 0]; y = vnrm(y); return FR(x, y, vcross(x, y)); }
  const pitchF = (F, a) => { const c = Math.cos(a), s = Math.sin(a); return FR(vadd(vmul(F.x, c), vmul(F.z, s)), F.y, vsub(vmul(F.z, c), vmul(F.x, s))); };   // (+a: the nose up)
  const yawF = (F, a) => { const c = Math.cos(a), s = Math.sin(a); return FR(vadd(vmul(F.x, c), vmul(F.y, s)), vsub(vmul(F.y, c), vmul(F.x, s)), F.z); };     // (+a: toward its left)
  const rollF = (F, a) => { const c = Math.cos(a), s = Math.sin(a); return FR(F.x, vadd(vmul(F.y, c), vmul(F.z, s)), vsub(vmul(F.z, c), vmul(F.y, s))); };    // (+a: its left side up)
  const toW = (F, v) => [F.x[0] * v[0] + F.y[0] * v[1] + F.z[0] * v[2], F.x[1] * v[0] + F.y[1] * v[1] + F.z[1] * v[2], F.x[2] * v[0] + F.y[2] * v[1] + F.z[2] * v[2]];

  /* ================= the measures (tiles) ================= */
  const LS = 10.5, NR = 80, NV = 16, S0 = 0.2;   // the spine's length (head joint .. tail fin root), its rings, a ring's vertices, the chest (the pose's root)
  // the sections: s, half width, height above the spine, depth below it, the superellipse's exponent (a serpent: a deep chest, a long tapering tail)
  const PROF = [[0.0, 0.14, 0.14, 0.14, 2.2], [0.05, 0.15, 0.15, 0.16, 2.2], [0.1, 0.19, 0.19, 0.22, 2.3], [0.17, 0.22, 0.21, 0.27, 2.3], [0.25, 0.22, 0.21, 0.26, 2.3], [0.34, 0.2, 0.19, 0.22, 2.2],
    [0.45, 0.16, 0.15, 0.17, 2.1], [0.58, 0.12, 0.115, 0.12, 2.0], [0.72, 0.09, 0.085, 0.09, 2.0], [0.86, 0.06, 0.06, 0.06, 2.0], [1.0, 0.04, 0.04, 0.04, 2.0]];   // (v454 TM3: a long, slim serpent)
  function prof(s) { s = cl(s); let i = 0; while (i < PROF.length - 2 && PROF[i + 1][0] < s) i++; const a = PROF[i], b = PROF[i + 1], u = sstep(0, 1, (s - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u), lerp(a[4], b[4], u)]; }
  function secPt(P, ph) { const c = Math.cos(ph), sn = Math.sin(ph), e = 2 / P[3]; return [P[0] * Math.sign(sn) * Math.pow(Math.abs(sn), e), (c >= 0 ? P[1] : P[2]) * Math.sign(c) * Math.pow(Math.abs(c), e)]; }
  const ringAt = s => Math.round(s * NR);
  const S_FORE = 0.13, S_HIND = 0.33, S_PEC = 0.09, S_MID = 0.3, S_TF = 0.56, SAIL0 = 0.05, SAIL1 = 0.52, CREST0 = 0.56, CREST1 = 0.92, VEN0 = 0.48, VEN1 = 0.9, HK = 1.15;   // (HK: the head's scale)
  const FL = { up: 0.34, lo: 0.32, hand: 0.15 }, BL = { up: 0.38, lo: 0.34, foot: 0.18 };
  const HEAD = NR + 1, JAW = NR + 2, LB0 = NR + 3, NBONE = LB0 + 12;
  const bone = (k, j) => LB0 + k * 6 + j;   // (k 0 its left, 1 its right; j 0..2 the fore limb, 3..5 the hind limb)
  const sailH = s => 1.85 * sstep(SAIL0, 0.12, s) * (1 - 0.85 * sstep(0.24, SAIL1, s));   // the sail's height along the back
  const crestH = s => 0.5 * sstep(CREST0, 0.62, s) * (1 - 0.6 * sstep(0.8, CREST1, s)), venH = s => 0.42 * sstep(VEN0, 0.56, s) * (1 - 0.7 * sstep(0.78, VEN1, s));
  const DIMS = { LS, NR, S0, S_FORE, S_HIND, S_PEC, S_MID, S_TF, SAIL0, SAIL1, HK, prof, sailH };   // (v457 TM4: HK for the move's snout reach)
  const MAT = { BODY: 505, SPIKE: 506, FIN: 507, EYE: 508, MOUTH: 508.2, TOOTH: 508.4, SAIL: 509 };
  const qf = (m, q) => m + 0.4 * cl(q);   // (a spike's or a membrane's place along the body, carried in its material's fraction)
  const GRP = { NONE: 0, SAIL: 1, FIN: 2 };

  /* ================= the meshes (built once) ================= */
  let D = null;
  const coll = () => ({ P: [], N: [], A: [], B: [], F: [], H: [], G: [], I: [] });
  function addV(C, p, n, a, bn, f, ph, g) { C.P.push(p[0], p[1], p[2]); const l = vlen(n) || 1; C.N.push(n[0] / l, n[1] / l, n[2] / l); C.A.push(a[0], a[1], a[2]); C.B.push(bn); C.F.push(f || 0); C.H.push(ph || 0); C.G.push(g || 0); return C.P.length / 3 - 1; }
  function putM(C, M, bn, att, flex) { const base = C.P.length / 3;
    for (let i = 0; i < M.nv; i++) { const p = [M.pos[i * 3], M.pos[i * 3 + 1], M.pos[i * 3 + 2]], n = [M.nrm[i * 3], M.nrm[i * 3 + 1], M.nrm[i * 3 + 2]], a = att(p, M.att[i * 3], n), f = flex ? flex(p) : null; addV(C, p, n, a, bn, f ? f[0] : 0, f ? f[1] : 0, f ? f[2] : 0); }
    for (let i = 0; i < M.idx.length; i++) C.I.push(base + M.idx[i]); }
  /* a grid of (nu + 1) x (nv + 1) points, its normals from the grid, indexed */
  function gridM(C, nu, nv, at, attr, bn, flex) { const base = C.P.length / 3, G = [];
    for (let j = 0; j <= nu; j++) for (let i = 0; i <= nv; i++) G.push(at(j / nu, i / nv));
    const g = (j, i) => G[Math.max(0, Math.min(nu, j)) * (nv + 1) + Math.max(0, Math.min(nv, i))];
    for (let j = 0; j <= nu; j++) for (let i = 0; i <= nv; i++) { let n = vcross(vsub(g(j + 1, i), g(j - 1, i)), vsub(g(j, i + 1), g(j, i - 1))); if (vlen(n) < 1e-9) n = [0, 1, 0]; const f = flex(j / nu, i / nv);
      addV(C, g(j, i), n, attr(j / nu, i / nv), typeof bn === 'function' ? bn(j / nu, i / nv) : bn, f[0], f[1], f[2]); }
    for (let j = 0; j < nu; j++) for (let i = 0; i < nv; i++) { const a = base + j * (nv + 1) + i; C.I.push(a, a + 1, a + nv + 2, a, a + nv + 2, a + nv + 1); } }
  /* a fan fin in a bone's frame: rays from a root line (r0 .. r1) out along directions from lead to trail, lengths len(v), the free edge
     scalloped between the rays (each ray reaching past the membrane beside it), a little cupped */
  function fanFin(C, bn, r0, r1, lead, trail, len, nRay, mat, q, ph, cup) {   // (v454 TM3: flowing strands: rays of uneven length and angle, deep ragged notches between them, each curving back into a wisp)
    const nu = 8, nv = (nRay - 1) * 4;
    const hh = (i, k) => { const x = Math.sin(i * 12.9898 + nRay * 4.1 + mat * 0.37 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
    const hr = i => 0.5 + 0.5 * hh(i, 0), hj = i => hh(i, 1) - 0.5;   // (each ray its own length; its own angle)
    gridM(C, nu, nv, (u, v) => { const r = v * (nRay - 1), i0 = Math.floor(Math.min(r, nRay - 1.0001)), fr = r - i0, rl = lerp(hr(i0), hr(i0 + 1), fr), um = (1 - 0.62 * Math.pow(Math.sin(Math.PI * fr), 0.55)) * rl,
        vj = cl(v + 0.45 / (nRay - 1) * lerp(hj(i0), hj(i0 + 1), fr)), root = vlerp(r0, r1, v), d = nmix(lead, trail, vj), L = len(v) * um * u, cp = (cup || 0) * Math.sin(Math.PI * v) * u * u, sw = 0.34 * len(v) * um * u * u, cu = 0.12 * len(v) * um * u * u * Math.sin(i0 * 2.1 + 1.3);
      return [root[0] + d[0] * L - sw, root[1] + d[1] * L + cp + cu, root[2] + d[2] * L]; },
    (u, v) => [qf(mat, q), u, v * (nRay - 1)], bn, (u, v) => [u, ph + v * 0.4, GRP.FIN]); }
  function build() {
    const A = coll(), M = coll();   // (A the body, M the membranes)
    /* the body: NR + 1 rings round the spine; normals from the straight rest body's grid */
    { const base = A.P.length / 3, G = [], cols = NV + 1;
      for (let i = 0; i <= NR; i++) { const s = i / NR, P = prof(s); for (let j = 0; j <= NV; j++) { const q = secPt(P, j / NV * TAU); G.push([-s * LS, q[0], q[1]]); } }
      const g = (i, j) => G[Math.max(0, Math.min(NR, i)) * cols + ((j % NV) + NV) % NV];
      for (let i = 0; i <= NR; i++) for (let j = 0; j <= NV; j++) { const p = G[i * cols + j], a = g(i + 1, j), b = g(i - 1, j), c2 = g(i, j + 1), d2 = g(i, j - 1); let n = vcross(vsub(a, b), vsub(c2, d2)); const out = [0, p[1], p[2]]; if (vdot(n, out) < 0) n = vmul(n, -1); n = vnrm(vlen(n) > 1e-9 ? n : out);
        addV(A, [0, p[1], p[2]], n, [MAT.BODY, 1 - i / NR, j / NV], i, 0, 0, 0); }
      for (let i = 0; i < NR; i++) for (let j = 0; j < NV; j++) { const a = base + i * cols + j; A.I.push(a, a + 1, a + cols + 1, a, a + cols + 1, a + cols); }
      // (the tail's end closed: a small cap)
      const c0 = addV(A, [-0.02, 0, 0], [-1, 0, 0], [MAT.BODY, 0, 0.25], NR); for (let j = 0; j < NV; j++) A.I.push(c0, base + NR * cols + j + 1, base + NR * cols + j); }
    /* the sail along the back (dark, ribbed, dotted) and the icy crest down the tail: one membrane column on each ring, its rays every
       third ring standing as white spikes past its jagged edge */
    const hc = (i, k) => { const x = Math.sin(i * 91.7 + k * 17.3) * 43758.5453; return x - Math.floor(x); };
    const sheet = (s0, s1, H, mat, rayEvery, sg) => { const i0 = ringAt(s0), i1 = ringAt(s1), nu = 6, base = M.P.length / 3, cols = i1 - i0 + 1, up = sg > 0;   // (v454 TM3: a ragged, feathered edge; spines of uneven length where it rises highest)
      const fac = i => { const a = hc(i, 1); return a > 0.68 ? 1.22 + 0.35 * hc(i, 2) : 0.8 + 0.16 * hc(i, 3); };
      for (let i = i0; i <= i1; i++) { const s = i / NR, P = prof(s), h = H(s), ri = (i - i0) / rayEvery, hh = h * fac(i) + 0.02, z0 = (up ? P[1] : P[2]) * 0.82;
        for (let j = 0; j <= nu; j++) { const u = j / nu, z = sg * (z0 + hh * u * (1 - 0.12 * u)), x = -0.85 * hh * Math.pow(u, 1.25); addV(M, [x, 0, z], [0, 1, 0], [qf(mat, 1 - s), u, ri], i, u, s, up ? GRP.SAIL : GRP.FIN); } }
      for (let c = 0; c < cols - 1; c++) for (let j = 0; j < nu; j++) { const a = base + c * (nu + 1) + j, b = a + nu + 1; M.I.push(a, a + 1, b + 1, a, b + 1, b); }
      if (up) for (let i = i0; i <= i1; i++) { if (hc(i, 1) <= 0.68) continue; const s = i / NR, P = prof(s), h = H(s) * fac(i) * 1.12 + 0.05, B = GLM.builder(1); if (h < 0.1) continue;
        B.tube([0.01, 0, P[1] * 0.8], [-0.85 * h * 1.05, 0, P[1] * 0.82 + h * 0.92], 0.02 + 0.012 * h, 0.003, MAT.SPIKE, { seg: 5, cap0: 'flat', cap1: false });
        putM(A, B.done(), i, p => [qf(MAT.SPIKE, 1 - s), cl((p[2] - P[1] * 0.8) / Math.max(0.05, h)), 0], p => [cl((p[2] - P[1] * 0.82) / Math.max(0.05, h)), s, GRP.SAIL]); } };
    sheet(SAIL0, SAIL1, sailH, MAT.SAIL, 3, 1);
    sheet(CREST0, CREST1, crestH, MAT.FIN, 2, 1);
    sheet(VEN0, VEN1, venH, MAT.FIN, 2, -1);   // (frills along the belly side of the tail)
    /* the dorsal spikes: on the neck (before the sail) and the tail's tip */
    for (const [s0, s1, hk] of [[0.01, 0.05, 0.28], [0.94, 0.985, 0.14]]) for (let i = ringAt(s0); i <= ringAt(s1); i++) { const s = i / NR, P = prof(s), h = hk * (1 - 0.3 * (i - ringAt(s0)) / Math.max(1, ringAt(s1) - ringAt(s0))), B = GLM.builder(1);
      B.tube([0.02, 0, P[1] * 0.8], [-h * 0.6, 0, P[1] + h], Math.max(0.02, P[0] * 0.22), 0.004, MAT.SPIKE, { seg: 5, cap0: 'flat', cap1: false });
      putM(A, B.done(), i, p => [qf(MAT.SPIKE, 1 - s), cl((p[2] - P[1] * 0.8) / (h + 0.2 * P[1])), 0]); }
    /* the fins: a pair of great fin-wings at the shoulders, a pair at the middle, a pair low on the tail; the forked tail fin */
    for (const sg of [1, -1]) {
      { const i = ringAt(S_PEC), P = prof(i / NR); fanFin(M, i, [0.06, sg * P[0] * 0.7, P[1] * 0.45], [-0.5, sg * P[0] * 0.8, P[1] * 0.25], [-0.35, sg * 0.5, 0.8], [-1, sg * 0.3, 0.15], v => 2.0 - 0.6 * v, 9, MAT.FIN, 1 - S_PEC, S_PEC + (sg > 0 ? 0 : 0.5), sg * 0.1); }
      { const i = ringAt(S_MID), P = prof(i / NR); fanFin(M, i, [0.02, sg * P[0] * 0.8, -P[2] * 0.35], [-0.42, sg * P[0] * 0.72, -P[2] * 0.55], [-0.55, sg * 0.7, -0.55], [-1, sg * 0.25, -0.15], v => 1.7 - 0.45 * v, 8, MAT.FIN, 1 - S_MID, S_MID + (sg > 0 ? 0 : 0.5), sg * 0.06); }
      { const i = ringAt(S_TF), P = prof(i / NR); fanFin(M, i, [0.08, sg * P[0] * 0.8, -P[2] * 0.3], [-0.5, sg * P[0] * 0.6, -P[2] * 0.5], [-0.5, sg * 0.65, -0.6], [-1, sg * 0.2, -0.1], v => 2.2 - 0.7 * v, 9, MAT.FIN, 1 - S_TF, S_TF + (sg > 0 ? 0 : 0.5), sg * 0.06); } }
    fanFin(M, NR, [0.05, 0, 0.05], [0.05, 0, -0.05], [-0.6, 0, 0.8], [-0.6, 0, -0.8], v => 0.9 + 1.5 * Math.pow(Math.abs(2 * v - 1), 0.75), 15, MAT.FIN, 0.02, 1.0, 0);   // (the forked tail fin, upright)
    for (const v of [0, 1]) { const d = nmix([-0.6, 0, 0.8], [-0.6, 0, -0.8], v), L = 2.15, B = GLM.builder(1); B.tube([0.04, 0, 0], vmul(d, L), 0.04, 0.006, MAT.SPIKE, { seg: 5, cap0: 'flat', cap1: false }); putM(A, B.done(), NR, p => [qf(MAT.SPIKE, 0), cl(vlen(p) / L), 0], p => [cl(vlen(p) / L), 1.0, GRP.FIN]); }   // (the lobes' leading rays)
    /* the head: x forward from the neck's joint, y left, z up. A fierce wedge of a skull (broad cheeks, a heavy brow, a snout tapering
       to a point), crest spines swept back from the crown, cheek spikes, glowing eyes, nostrils, fangs, the mouth's glow; ear-fins */
    const HP = [[-0.16, 0.19, 0.19, 0.17], [0.04, 0.24, 0.23, 0.19], [0.28, 0.22, 0.2, 0.15], [0.55, 0.16, 0.13, 0.1], [0.82, 0.1, 0.08, 0.065], [1.05, 0.045, 0.045, 0.035], [1.15, 0.012, 0.015, 0.012]];   // (v454 TM3: a longer, pointed snout)
    const hp = x => { let i = 0; while (i < HP.length - 2 && HP[i + 1][0] < x) i++; const a = HP[i], b = HP[i + 1], u = cl((x - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; };
    const aroundOf = n => Math.acos(Math.max(-1, Math.min(1, n[2] / (vlen(n) || 1)))) / Math.PI * 0.5;   // (0 the top .. 0.5 underneath)
    { const B = GLM.builder(1); B.push([HK, 0, 0], [0, HK, 0], [0, 0, HK], [0, 0, 0]);
      B.surf((u, v) => { const x = lerp(-0.16, 1.15, u), w = hp(x), ph = v * TAU, c = Math.cos(ph), sn = Math.sin(ph), e = 2 / 3.4; return [x, w[0] * Math.sign(sn) * Math.pow(Math.abs(sn), e), (c >= 0 ? w[1] : w[2]) * Math.sign(c) * Math.pow(Math.abs(c), e) + (c > 0 ? 0.035 * Math.exp(-(((x - 0.45) / 0.25) ** 2)) * Math.pow(c, 6) : 0)]; }, 18, 20, () => MAT.BODY, {});
      B.ell([-0.16, 0, 0.0], [0.1, 0.19, 0.17], MAT.BODY, { seg: 14, rings: 6, th0: 0, th1: Math.PI });
      for (const sg of [1, -1]) {
        B.ell([0.4, sg * 0.15, 0.17], [0.2, 0.065, 0.05], MAT.BODY, { seg: 10, rings: 5 });   // (a heavy brow)
        B.ell([0.5, sg * 0.175, 0.13], [0.075, 0.026, 0.03], MAT.EYE, { seg: 8, rings: 5 });   // (a glowing eye)
        B.ell([1.02, sg * 0.04, 0.04], [0.03, 0.014, 0.014], MAT.MOUTH, { seg: 6, rings: 4 });
        for (let i = 0; i < 6; i++) { const x = 0.34 + i * 0.12, w = hp(x), big = i === 5; B.crystal([x, sg * w[0] * 0.78, -w[2] * 0.85], [x + 0.02, sg * w[0] * 0.72, -w[2] * 0.85 - (big ? 0.16 : 0.07)], big ? 0.03 : 0.018, MAT.TOOTH, { n: 3, base: 0.9, cap: false }); }
        B.spike([0.12, sg * 0.23, 0.0], [-0.22, sg * 0.36, -0.08], 0.05, MAT.SPIKE, { seg: 5 }); B.spike([0.3, sg * 0.2, -0.06], [0.05, sg * 0.3, -0.18], 0.035, MAT.SPIKE, { seg: 5 });   // (cheek spikes)
        for (let i = 0; i < 4; i++) { const x0 = 0.42 - i * 0.14, r = [x0, sg * (0.07 + 0.03 * i), 0.2 - 0.01 * i], L = 0.7 + 0.12 * i - (i === 3 ? 0.25 : 0), d = vnrm([-0.85, sg * (0.18 + 0.05 * i), 0.55 - 0.08 * i]); B.tube(r, vadd(r, vmul(d, L)), 0.045 - 0.006 * i, 0.004, MAT.SPIKE, { seg: 6, cap0: 'round', cap1: false }); } }   // (crest spines swept back)
      B.surf((u, v) => { const x = lerp(0.12, 1.05, u), w = hp(x); return [x, (v - 0.5) * 2 * w[0] * 0.78, -w[2] * 0.93]; }, 8, 3, () => MAT.MOUTH, {}); B.pop();
      putM(A, B.done(), HEAD, (p, m, n) => [m === MAT.SPIKE ? qf(MAT.SPIKE, 1) : m, m === MAT.SPIKE ? cl((vlen(vsub(p, [0.3 * HK, 0, 0.1 * HK])) - 0.15 * HK) / (0.7 * HK)) : 1, m === MAT.BODY ? aroundOf(n) : cl((p[0] / HK + 0.7) / 1.7)], p => [0, 0, 0]); }
    for (const sg of [1, -1]) { fanFin(M, HEAD, [0.14 * HK, sg * 0.24 * HK, 0.08 * HK], [-0.18 * HK, sg * 0.22 * HK, 0.02 * HK], [-0.05, sg * 0.72, 0.72], [-1, sg * 0.5, -0.05], v => 1.55 - 0.4 * v, 6, MAT.FIN, 1, sg > 0 ? 0.02 : 0.52, sg * 0.1);   // (the ear-fins: large frills)
      fanFin(M, HEAD, [0.5 * HK, sg * 0.07 * HK, 0.2 * HK], [-0.12 * HK, sg * 0.1 * HK, 0.18 * HK], [-0.45, sg * 0.25, 1.0], [-1, sg * 0.2, 0.25], v => 1.25 - 0.4 * v, 6, MAT.FIN, 1, sg > 0 ? 0.12 : 0.62, sg * 0.06); }   // (long crest fins swept back over the neck)
    /* the jaw: its hinge at the origin (the head's [0.12, 0, -0.12]); forward to 0.95, its top the mouth's glow, fangs, chin spikes */
    { const B = GLM.builder(1), JL = 1.05; B.push([HK, 0, 0], [0, HK, 0], [0, 0, HK], [0, 0, 0]); const jw = x => 0.2 * (1 - 0.6 * x / JL) + 0.03, jd = x => 0.11 - 0.06 * x / JL;
      B.surf((u, v) => { const x = JL * u, th = v * TAU, c = Math.cos(th), sn = Math.sin(th), e = 2 / 2.8, k = u > 0.95 ? Math.sqrt(Math.max(0.02, 1 - ((u - 0.95) / 0.05) ** 2)) : 1; return [x, jw(x) * k * Math.sign(sn) * Math.pow(Math.abs(sn), e), (c > 0 ? 0.012 * k * c : -jd(x) * k * Math.pow(-c, e))]; }, 12, 14, (u, v) => (Math.cos(v * TAU) > 0.5 ? MAT.MOUTH : MAT.BODY), {});
      for (const sg of [1, -1]) { for (let i = 0; i < 5; i++) { const x = 0.26 + i * 0.13, big = i === 4; B.crystal([x, sg * jw(x) * 0.78, 0.01], [x - 0.01, sg * jw(x) * 0.74, big ? 0.15 : 0.07], big ? 0.028 : 0.017, MAT.TOOTH, { n: 3, base: 0.9, cap: false }); }
        B.spike([0.3, sg * jw(0.3) * 0.8, -jd(0.3) * 0.8], [0.08, sg * jw(0.3) * 1.1, -jd(0.3) - 0.14], 0.03, MAT.SPIKE, { seg: 5 }); }
      B.pop(); putM(A, B.done(), JAW, (p, m, n) => [m === MAT.SPIKE ? qf(MAT.SPIKE, 1) : (m || MAT.BODY), m === MAT.SPIKE ? 0.6 : 1, m === MAT.BODY ? aroundOf(n) : cl((p[0] / HK + 0.1) / 1.0)]); }
    /* the limbs: small, muscled (lathes in the body's scales), clawed */
    const claws = (B, L, n, r, len, spread, down) => { for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * spread, m = [L + len * 0.55 * Math.cos(a), Math.sin(a) * (r * 1.2 + len * 0.5), -len * 0.16];
      B.spike([L * 0.85, Math.sin(a) * r * 1.2, 0], m, r * 0.6, MAT.SPIKE, { seg: 5 }); B.spike(m, [L + len * Math.cos(a), Math.sin(a) * (r * 1.2 + len * 0.8), -len * down], r * 0.4, MAT.SPIKE, { seg: 5 }); } };
    const latM = (prof2, extra) => { const B = GLM.builder(1); B.lathe(prof2, MAT.BODY, { seg: 9 }); if (extra) extra(B); return B.done(); };
    const limbA = q => (p, m, n) => (m === MAT.SPIKE ? [qf(MAT.SPIKE, q), 0.7, 0] : [MAT.BODY, q, aroundOf(n)]);
    for (let k = 0; k < 2; k++) { const qF = 1 - S_FORE, qH = 1 - S_HIND;
      putM(A, latM([[-0.05, 0], [-0.04, 0.05], [0.02, 0.09], [0.12, 0.11], [0.24, 0.09], [0.32, 0.06], [0.35, 0.035], [0.36, 0]]), bone(k, 0), limbA(qF));
      putM(A, latM([[-0.04, 0], [-0.03, 0.05], [0.04, 0.07], [0.14, 0.065], [0.26, 0.045], [0.32, 0.035], [0.33, 0]]), bone(k, 1), limbA(qF));
      putM(A, (() => { const B = GLM.builder(1); B.ell([0.06, 0, 0], [0.09, 0.065, 0.04], MAT.BODY, { seg: 9, rings: 5 }); claws(B, 0.13, 3, 0.05, 0.24, 0.42, 0.55); return B.done(); })(), bone(k, 2), limbA(qF));
      putM(A, latM([[-0.07, 0], [-0.06, 0.07], [0.0, 0.14], [0.1, 0.16], [0.22, 0.13], [0.32, 0.09], [0.38, 0.05], [0.39, 0]]), bone(k, 3), limbA(qH));
      putM(A, latM([[-0.04, 0], [-0.03, 0.06], [0.04, 0.08], [0.14, 0.07], [0.28, 0.045], [0.34, 0.035], [0.35, 0]]), bone(k, 4), limbA(qH));
      putM(A, (() => { const B = GLM.builder(1); B.ell([0.07, 0, 0], [0.11, 0.07, 0.045], MAT.BODY, { seg: 9, rings: 5 }); claws(B, 0.15, 3, 0.055, 0.24, 0.38, 0.5); return B.done(); })(), bone(k, 5), limbA(qH)); }
    const mk = C => { const nv = C.P.length / 3; return { M: { pos: new Float32Array(nv * 3), nrm: new Float32Array(nv * 3), att: new Float32Array(C.A), idx: nv > 65535 ? new Uint32Array(C.I) : new Uint16Array(C.I), nv, ntri: C.I.length / 3, gl: null },
      RP: new Float32Array(C.P), RN: new Float32Array(C.N), BN: new Uint16Array(C.B), FW: new Float32Array(C.F), PH: new Float32Array(C.H), GR: new Uint8Array(C.G), W: new Float32Array(nv * 3), nv }; };
    const HT = new Float32Array(NBONE); for (let i = 0; i <= NR; i++) HT[i] = prof(i / NR)[1] * 0.82;
    D = { a: mk(A), m: mk(M), HT, BR: new Float32Array(NBONE * 9), BP: new Float32Array(NBONE * 3), ready: true, up: false, msBuilt: 0 };
    D.M = D.a.M; D.M2 = D.m.M; D.nv = D.a.nv; D.nm = D.m.nv;
    return D;
  }
  function data() { if (!D) { const t0 = nowMs(); build(); D.msBuilt = nowMs() - t0; } return D; }

  /* ================= the pose =================
     P: { x, y, z (the chest, tiles from the drawing's origin; z up), yaw (heading in the floor's plane, 0 = +x), pitch (+ the nose up),
     roll (+ its left side up), neck (the neck's lift, rad, + up), neckT (its turn, + left), head (the head's own pitch), headT, jaw
     (open, rad), arch (the body's), tail (the tail's curl, + up), tailT (its sway, + left), wave, waveL, waveF (the swimming waves: up and
     down, side to side, their phase: they run from the head down the tail), t (seconds: the fins' flutter), flut (its strength), sail
     (the sail raised 1 .. laid back 0.4), reach (the fore limbs: 0 tucked .. 1 thrust forward), hind (the hind limbs: 0 trailing .. 1
     reaching down), k (its size) }. Returns the anchors */
  const SETB = (d, i, F, p) => { const o = i * 9; d.BR[o] = F.x[0]; d.BR[o + 1] = F.x[1]; d.BR[o + 2] = F.x[2]; d.BR[o + 3] = F.y[0]; d.BR[o + 4] = F.y[1]; d.BR[o + 5] = F.y[2]; d.BR[o + 6] = F.z[0]; d.BR[o + 7] = F.z[1]; d.BR[o + 8] = F.z[2]; d.BP[i * 3] = p[0]; d.BP[i * 3 + 1] = p[1]; d.BP[i * 3 + 2] = p[2]; };
  function curv(P, s) {   // the bend's rate (rad per unit of s) at s: [pitch, turn]
    const nk = (1 - sstep(0.05, 0.13, s)) / 0.1, bk = sstep(0.12, 0.2, s) * (1 - sstep(0.26, 0.34, s)) / 0.15, tk = sstep(0.35, 0.45, s) / 0.6, gw = 0.3 + 0.9 * sstep(0.08, 0.8, s), ph = TAU * (1.6 * s - (P.waveF || 0));
    return [(P.neck || 0) * nk + (P.arch || 0) * bk + (P.tail || 0) * tk + (P.wave || 0) * Math.sin(ph) * gw * 7, (P.neckT || 0) * nk + (P.tailT || 0) * tk + (P.waveL || 0) * Math.sin(ph + 1.3) * gw * 7];
  }
  const RF = [], RPt = [];
  /* (v457 TM4) the path mode: the spine laid along a flight path. P.path.at(l) gives { p the point (tiles from the origin), x the unit
     tangent toward the head, y the side (left) vector carried along the path, r an extra roll about the tangent } at arc length l
     (tiles, growing toward the head); P.lc the chest's l. Ring s rides the path at lc + (S0 - s) LS k, so the head leads and the
     body and the tail trace the same path (one creature); the swim waves (P.und: [up and down, side to side] in tiles, growing
     toward the tail, running down the body with P.waveF) are laid over it, and each ring's frame comes from its neighbours.
     The points are kept unscaled about the chest (the pose scales every bone by k after) */
  const PW3 = [], PY3 = [];
  function pathRings(P, p0) {
    const K = P.k || 1, L = LS * K, lc = P.lc || 0, U = P.und || [0, 0], wf = P.waveF || 0;
    for (let i = 0; i <= NR; i++) { const s = i / NR, Q = P.path.at(lc + (S0 - s) * L), x = Q.x; let y = Q.y;
      if (Q.r) { const z0 = vcross(x, y), c = Math.cos(Q.r), sn = Math.sin(Q.r); y = vadd(vmul(y, c), vmul(z0, sn)); }
      const z = vcross(x, y), gw = 0.3 + 0.9 * sstep(0.08, 0.8, s), ph = TAU * (1.6 * s - wf), a = U[0] * gw * Math.sin(ph), b = U[1] * gw * Math.sin(ph + 1.3);
      PW3[i] = [Q.p[0] + z[0] * a + y[0] * b, Q.p[1] + z[1] * a + y[1] * b, Q.p[2] + z[2] * a + y[2] * b]; PY3[i] = y; }
    const c0 = PW3[ringAt(S0)]; p0[0] = c0[0]; p0[1] = c0[1]; p0[2] = c0[2];
    for (let i = 0; i <= NR; i++) { const x = vnrm(vsub(PW3[Math.max(0, i - 1)], PW3[Math.min(NR, i + 1)])), yy = PY3[i], y = vnrm(vsub(yy, vmul(x, vdot(x, yy)))), q = PW3[i];
      RF[i] = FR(x, y, vcross(x, y)); RPt[i] = [p0[0] + (q[0] - p0[0]) / K, p0[1] + (q[1] - p0[1]) / K, p0[2] + (q[2] - p0[2]) / K]; }
  }
  function pose(P) {
    const d = data(), ds = 1 / NR, st = LS * ds, i0 = ringAt(S0);
    let F0 = FR([1, 0, 0], [0, 1, 0], [0, 0, 1]); F0 = yawF(F0, P.yaw || 0); F0 = pitchF(F0, P.pitch || 0); F0 = rollF(F0, P.roll || 0);
    const p0 = [P.x || 0, P.y || 0, P.z || 0]; RF[i0] = F0; RPt[i0] = p0;
    if (P.path) pathRings(P, p0);   // (v457 TM4: laid along its flight path)
    else { let F = F0, p = p0; for (let i = i0; i < NR; i++) { const k = curv(P, (i + 0.5) * ds), Fh = yawF(pitchF(F, -k[0] * ds * 0.5), -k[1] * ds * 0.5); p = vsub(p, vmul(Fh.x, st)); F = yawF(pitchF(F, -k[0] * ds), -k[1] * ds); RF[i + 1] = F; RPt[i + 1] = p; }
      F = F0; p = p0; for (let i = i0; i > 0; i--) { const k = curv(P, (i - 0.5) * ds), Fh = yawF(pitchF(F, k[0] * ds * 0.5), k[1] * ds * 0.5); p = vadd(p, vmul(Fh.x, st)); F = yawF(pitchF(F, k[0] * ds), k[1] * ds); RF[i - 1] = F; RPt[i - 1] = p; } }
    for (let i = 0; i <= NR; i++) SETB(d, i, RF[i], RPt[i]);
    const Fh = yawF(pitchF(RF[0], P.head || 0), P.headT || 0), ph = vadd(RPt[0], vmul(RF[0].x, 0.04)); SETB(d, HEAD, Fh, ph);
    const Fj = pitchF(Fh, -(P.jaw || 0)), pj = vadd(ph, toW(Fh, [0.12 * HK, 0, -0.12 * HK])); SETB(d, JAW, Fj, pj);
    const ifo = ringAt(S_FORE), ih = ringAt(S_HIND), Ff = RF[ifo], Fhp = RF[ih], rc = cl(P.reach || 0), hd = cl(P.hind || 0);
    const A = { fore: [], hindC: [] };
    for (let k = 0; k < 2; k++) { const sg = k ? -1 : 1, Pf = prof(S_FORE), Ph = prof(S_HIND);
      const fs = vadd(RPt[ifo], toW(Ff, [0.04, sg * Pf[0] * 0.72, -Pf[2] * 0.55])), upF = toW(Ff, [0, 0, 1]);
      const d1 = toW(Ff, nmix([0.25, sg * 0.45, -1], [0.85, sg * 0.3, -0.45], rc)), d2 = toW(Ff, nmix([0.9, sg * 0.1, -0.2], [1, sg * 0.06, -0.05], rc)), d3 = toW(Ff, nmix([0.5, 0, -0.85], [1, 0, 0.1], rc));
      const fe = vadd(fs, vmul(d1, FL.up)), fw = vadd(fe, vmul(d2, FL.lo)); SETB(d, bone(k, 0), frameX(d1, upF), fs); SETB(d, bone(k, 1), frameX(d2, upF), fe); SETB(d, bone(k, 2), frameX(d3, upF), fw); A.fore.push(vadd(fw, vmul(d3, FL.hand + 0.2)));
      const hs = vadd(RPt[ih], toW(Fhp, [0, sg * Ph[0] * 0.8, -Ph[2] * 0.4])), upH = toW(Fhp, [0, 0, 1]);
      const e1 = toW(Fhp, nmix([-0.3, sg * 0.4, -0.85], [0.5, sg * 0.35, -0.8], hd)), e2 = toW(Fhp, nmix([-0.95, sg * 0.05, -0.3], [0.1, sg * 0.04, -1], hd)), e3 = toW(Fhp, nmix([-0.8, 0, -0.5], [0.8, 0, -0.4], hd));
      const he = vadd(hs, vmul(e1, BL.up)), hw = vadd(he, vmul(e2, BL.lo)); SETB(d, bone(k, 3), frameX(e1, upH), hs); SETB(d, bone(k, 4), frameX(e2, upH), he); SETB(d, bone(k, 5), frameX(e3, upH), hw); A.hindC.push(vadd(hw, vmul(e3, BL.foot + 0.2))); }
    // the size (P.k): every bone's place scaled about the chest
    const K = P.k || 1;
    if (K !== 1) { const sc = q => [p0[0] + K * (q[0] - p0[0]), p0[1] + K * (q[1] - p0[1]), p0[2] + K * (q[2] - p0[2])];
      for (let i = 0; i < NBONE; i++) { const q = sc([d.BP[i * 3], d.BP[i * 3 + 1], d.BP[i * 3 + 2]]); d.BP[i * 3] = q[0]; d.BP[i * 3 + 1] = q[1]; d.BP[i * 3 + 2] = q[2]; }
      for (const L of [A.fore, A.hindC]) for (let i = 0; i < L.length; i++) L[i] = sc(L[i]); }
    const t = P.t || 0, fl = P.flut == null ? 1 : P.flut, sk = P.sail == null ? 1 : P.sail;
    skin(d, d.a, K, t, fl, sk); skin(d, d.m, K, t, fl, sk);
    return anchors(d, A, P);
  }
  /* every vertex of a mesh from its bone: the sail laid back by P.sail; the fins' sway (sideways in its bone's frame, by its weight, its
     phase running down the body) */
  function skin(d, m, K, t, fl, sk) {
    const RP = m.RP, RN = m.RN, BN = m.BN, FW = m.FW, PH = m.PH, GR = m.GR, W = m.W, NW = m.M.nrm, BR = d.BR, BP = d.BP, HT = d.HT;
    for (let v = 0, n = m.nv; v < n; v++) { const o = v * 3, b = BN[v], q = b * 9, P3 = b * 3; let x = RP[o], y = RP[o + 1], z = RP[o + 2]; const g = GR[v];
      if (g) { const w = FW[v]; if (g === 1 && sk !== 1) { const z0 = HT[b]; z = z0 + (z - z0) * sk; x = x * (2 - sk); }
        if (w > 0 && fl > 0) y += w * fl * (g === 1 ? 0.13 : 0.26) * Math.sin(t * (g === 1 ? 4.2 : 5.5) - PH[v] * (g === 1 ? 14 : 6) - (g === 1 ? 0 : w * 2.8)); }   // (v454 TM3: a ripple running out along each strand)
      x *= K; y *= K; z *= K; const a = RN[o], bb = RN[o + 1], c = RN[o + 2];
      W[o] = BP[P3] + BR[q] * x + BR[q + 3] * y + BR[q + 6] * z; W[o + 1] = BP[P3 + 1] + BR[q + 1] * x + BR[q + 4] * y + BR[q + 7] * z; W[o + 2] = BP[P3 + 2] + BR[q + 2] * x + BR[q + 5] * y + BR[q + 8] * z;
      NW[o] = BR[q] * a + BR[q + 3] * bb + BR[q + 6] * c; NW[o + 1] = BR[q + 1] * a + BR[q + 4] * bb + BR[q + 7] * c; NW[o + 2] = BR[q + 2] * a + BR[q + 5] * bb + BR[q + 8] * c; } }
  let ANC = null;
  function anchors(d, A, P) {
    const BP = d.BP, BR = d.BR, K = P.k || 1, bp = i => [BP[i * 3], BP[i * 3 + 1], BP[i * 3 + 2]], bf = i => { const o = i * 9; return FR([BR[o], BR[o + 1], BR[o + 2]], [BR[o + 3], BR[o + 4], BR[o + 5]], [BR[o + 6], BR[o + 7], BR[o + 8]]); };
    const Wq = (i, q) => vadd(bp(i), vmul(toW(bf(i), q), K * (i === HEAD || i === JAW ? HK : 1)));
    const out = { spine: [], fore: A.fore, hindC: A.hindC, K, P };
    for (let i = 0; i <= NR; i += 2) { const s = i / NR, Pq = prof(s), F = bf(i); out.spine.push({ s, p: bp(i), r: Math.max(Pq[0], (Pq[1] + Pq[2]) / 2) * K, up: F.z, side: F.y, fwd: F.x }); }
    const Fh = bf(HEAD); out.Fh = Fh;
    out.head = Wq(HEAD, [0.4, 0, 0.08]); out.snout = Wq(HEAD, [1.15, 0, 0.0]); out.eyes = [Wq(HEAD, [0.52, 0.18, 0.13]), Wq(HEAD, [0.52, -0.18, 0.13])];
    out.horns = [Wq(HEAD, [-0.65, 0.35, 1.3]), Wq(HEAD, [-0.65, -0.35, 1.3])]; out.hornB = [Wq(HEAD, [0.3, 0.1, 0.2]), Wq(HEAD, [0.3, -0.1, 0.2])];
    out.whisk = [Wq(HEAD, [0.98, 0.07, -0.02]), Wq(HEAD, [0.98, -0.07, -0.02])];
    out.mouth = Wq(JAW, [0.5, 0, 0.02]); out.jawTip = Wq(JAW, [1.05, 0, -0.02]); out.throat = Wq(HEAD, [0.35, 0, -0.1]);
    out.chest = Wq(ringAt(0.27), [0, 0, -0.1]); out.tail = Wq(NR, [-0.04, 0, 0]);
    out.tailTips = [Wq(NR, vmul(vnrm([-0.6, 0, 0.8]), 2.15)), Wq(NR, vmul(vnrm([-0.6, 0, -0.8]), 2.15))];
    // the sail's crest (its spikes' tips) and the fin-wings' tips, for the arcs and the break-up
    out.sail = []; for (let i = ringAt(SAIL0) + 3; i <= ringAt(SAIL1); i += 6) { const s = i / NR, h = sailH(s) * (P.sail == null ? 1 : P.sail); if (h < 0.1) continue; out.sail.push(Wq(i, [-0.85 * h, 0, prof(s)[1] * 0.82 + h * 0.88])); }
    { const i = ringAt(S_PEC), Pq = prof(i / NR); out.pec = [1, -1].map(sg => Wq(i, vadd([0.06, sg * Pq[0] * 0.7, Pq[1] * 0.45], vmul(vnrm([-0.35, sg * 0.5, 0.8]), 1.8)))); }
    { const i = ringAt(S_TF), Pq = prof(i / NR); out.tfin = [1, -1].map(sg => Wq(i, vadd([0.08, sg * Pq[0] * 0.8, -Pq[2] * 0.3], vmul(vnrm([-0.5, sg * 0.65, -0.6]), 1.9)))); }
    out.flank = [Wq(ringAt(S_HIND), [0, prof(S_HIND)[0] * 0.9, 0]), Wq(ringAt(S_HIND), [0, -prof(S_HIND)[0] * 0.9, 0])];
    ANC = out; return out;
  }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Tiamat GL: ' + String(e && e.message || e)); } catch (e2) {} };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__TM_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__TM_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  /* idle-time preparation: the meshes (a few ms) and one tiny pass that uploads them and compiles the materials' branch */
  let IDLE = 0;
  function warm() {
    if (IDLE) return true; if (D && D.up) return true; IDLE = 1;
    const run = () => { IDLE = 0; try { const d = data(); if (usable() && !d.up) { pose({}); prewarm(); } } catch (e) { fail(e); } };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 400 }); else setTimeout(run, 60);
    return true;
  }
  const IT = { R0: new Float32Array([1, 0, 0]), R1: new Float32Array([0, 1, 0]), R2: new Float32Array([0, 0, 1]), T: new Float32Array(3) }, IT2 = { R0: IT.R0, R1: IT.R1, R2: IT.R2, T: IT.T };
  const items = [IT, IT2];
  function prewarm() { const d = data(); if (d.up || !GLM.ok()) return; IT.mesh = d.M; IT2.mesh = d.M2; IT.alpha = 1; IT2.alpha = 0.99; IT.glow = IT2.glow = 1;
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); d.up = true; }
  function step() { data(); return true; }
  function release() { let n = 0; if (!D) return 0; for (const M of [D.M, D.M2]) { if (M && M.gl) { n++; if (typeof GLM !== 'undefined' && GLM.free) GLM.free(M); else M.gl = null; } } D.up = false; return n; }
  const gpuCount = () => (D ? (D.M.gl ? 1 : 0) + (D.M2.gl ? 1 : 0) : 0);

  /* ================= drawing =================
     o: { X0, Y0 (the origin's screen point), k (px a tile), alpha, glow, glow2 (the flash), form (the formation's front: >= 1.45 whole),
     charge (the charge's front, q), dis (the break-up 0..1), t (seconds), clip (true: cut at the floor), res (a resolution factor) } */
  const CZ = 0.9, GS = 0.25, VV = vnrm([0, CZ, 1]), LK = vnrm([-0.5, 0.25, 0.83]), LS2 = vnrm([-0.2, 0.25, 0.95]), LR = vnrm([0.55, -0.7, 0.45]);
  const RIMC = [0.55, 0.7, 1.5], AMBC = [1, 1, 1], OUTC = [0.05, 0.025, 0.14], GLCAP = 1700;
  const PXB = [0.55e6, 0.38e6, 0.27e6, 0.27e6];
  const budget = () => { try { if (typeof GQ === 'undefined' || typeof arc === 'undefined' || !arc.game || arc.mode !== 'dungeon') return 1e12; return PXB[Math.max(0, Math.min(3, GQ.level() | 0))]; } catch (e) { return 1e12; } };
  function visBox(c) { const m = c.getTransform ? c.getTransform() : null, cv = c.canvas; if (!m || !cv || !cv.width) return null; const det = m.a * m.d - m.b * m.c; if (Math.abs(det) < 1e-9) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [X, Y] of [[0, 0], [cv.width, 0], [0, cv.height], [cv.width, cv.height]]) { const dx = X - m.e, dy = Y - m.f, ux = (m.d * dx - m.c * dy) / det, uy = (-m.b * dx + m.a * dy) / det; x0 = Math.min(x0, ux); y0 = Math.min(y0, uy); x1 = Math.max(x1, ux); y1 = Math.max(y1, uy); }
    return [Math.floor(x0) - 2, Math.floor(y0) - 2, Math.ceil(x1) + 2, Math.ceil(y1) + 2]; }
  const STATS = { ms: 0, n: 0, W: 0, H: 0, px: 0, tris: 0 };
  const RES = { k: 1 };
  function box(o) { const d = D, k = o.k; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const m of [d.a, d.m]) { const W = m.W; for (let v = 0; v < m.nv; v += 2) { const z = o.clip ? Math.max(0, W[v * 3 + 2]) : W[v * 3 + 2], X = o.X0 + W[v * 3] * k, Y = o.Y0 + (W[v * 3 + 1] - z * CZ) * k; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; } }
    return [x0, y0, x1, y1]; }
  function draw(c, o) {
    const d = data(); if (!usable()) return false;
    try {
      for (const m of [d.a, d.m]) { const pos = m.M.pos, W = m.W, n3 = m.nv * 3; for (let i = 0; i < n3; i++) pos[i] = W[i] * GS; if (m.M.gl) GLM.touchGeo(m.M); }
      let [bx0, by0, bx1, by1] = box(o); const mg = o.k * 0.35; bx0 = Math.floor(bx0 - mg); by0 = Math.floor(by0 - mg); bx1 = Math.ceil(bx1 + mg); by1 = Math.ceil(by1 + mg);
      let rx0 = bx0, ry0 = by0, rx1 = bx1, ry1 = by1; const vb = visBox(c); if (vb) { rx0 = Math.max(rx0, vb[0]); ry0 = Math.max(ry0, vb[1]); rx1 = Math.min(rx1, vb[2]); ry1 = Math.min(ry1, vb[3]); if (!(rx1 > rx0 + 1 && ry1 > ry0 + 1)) return true; }
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__TM_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : RES.k) * (o.res || 1) * (lowFx() ? 0.85 : 1) * (typeof GQ !== 'undefined' && GQ.animaK ? GQ.animaK() : 1);
      let Wp = Math.ceil((rx1 - rx0) * dev), Hp = Math.ceil((ry1 - ry0) * dev); const scl = Math.min(1, GLCAP / Math.max(Wp, Hp)); Wp = Math.max(2, Math.ceil(Wp * scl)); Hp = Math.max(2, Math.ceil(Hp * scl));
      const bud = budget(); if (Wp * Hp > bud) { const q = Math.sqrt(bud / (Wp * Hp)); Wp = Math.max(2, Math.ceil(Wp * q)); Hp = Math.max(2, Math.ceil(Hp * q)); }
      const bw = rx1 - rx0, bh = ry1 - ry0, kk = o.k / GS, low = lowFx();
      const S = { px: [1, 0, 0], py: [0, 1, -CZ], pd: VV, cl: [2 * kk / bw, 2 * (o.X0 - rx0) / bw - 1, -2 * kk / bh, 1 - 2 * (o.Y0 - ry0) / bh], v: VV, lk: LK, ls: LS2, lr: LR, up: [0, 0, 1], low, rim: RIMC, amb: AMBC, t: (o.t || 0) % 600,
        outline: low || (o.dis || 0) > 0.02 || (o.form != null && o.form < 1.4) ? 0 : Math.max(0.6, 0.8 * (Wp / bw)), outlineCol: OUTC, outlineBias: 0.003, clip: o.clip ? [0, 0.02] : null, keep: true };
      const fm = o.form == null ? 2 : o.form;
      for (const it of items) { it.glow = o.glow == null ? 1 : o.glow; it.glow2 = o.glow2 || 0; it.spill = fm; it.kind = o.charge || 0; it.fx = o.dis || 0; it.wear = 1; it.first = 0; it.cnt = 0; }
      IT.mesh = d.M; IT.alpha = 1; IT.outline = true; IT2.mesh = d.M2; IT2.alpha = 0.99; IT2.outline = false;
      const t0 = nowMs(), cvs = GLM.render(Wp, Hp, S, items); if (!cvs) return false;
      const al = o.alpha == null ? 1 : o.alpha; if (al > 0.004) { c.save(); c.globalAlpha = Math.min(1, al); c.drawImage(cvs, 0, 0, Wp, Hp, rx0, ry0, bw, bh); c.restore(); }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.W = Wp; STATS.H = Hp; STATS.px = Wp * Hp; STATS.tris = d.M.ntri + d.M2.ntri;
      if (!GLM.soft && STATS.n > 20) RES.k = STATS.ms > 6 ? Math.max(0.65, RES.k - 0.02) : STATS.ms < 3 ? Math.min(1, RES.k + 0.01) : RES.k;
      d.up = true; return true;
    } catch (e) { fail(e); return false; }
  }
  /* ---- the painted picture (no WebGL): from the same pose. The sail and the fins as sheets (dark violet, icy blue) with dotted rows,
     the body a stroke widening with its girth (dark violet-blue over a pale belly line, a magenta vein down it), the head a wedge with
     glowing eyes and a magenta mouth; the formation's front and the break-up thin it ---- */
  const scr = (o, p) => [o.X0 + p[0] * o.k, o.Y0 + (p[1] - (o.clip ? Math.max(0, p[2]) : p[2]) * CZ) * o.k];
  function draw2D(c, o) {
    const A = ANC; if (!A) return true; const k = o.k, fm = o.form == null ? 2 : o.form, al = (o.alpha == null ? 1 : o.alpha) * cl(fm / 1.1) * (1 - cl((o.dis || 0) * 1.15)); if (!(al > 0.01)) return true;
    const S = p => scr(o, p), sp = A.spine, ch = cl(o.charge || 0);
    const line = (pts, w, col, a) => { c.globalAlpha = al * a; c.strokeStyle = col; c.lineWidth = Math.max(0.8, w); c.beginPath(); pts.forEach((q, i) => { const s = S(q); if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); }); c.stroke(); };
    const fill = (pts, col, a) => { c.globalAlpha = al * a; c.fillStyle = col; c.beginPath(); pts.forEach((q, i) => { const s = S(q); if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); }); c.closePath(); c.fill(); };
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    // the sail: from its base along the back to its crest of spikes
    if (A.sail.length > 1) { const i0 = Math.round(SAIL0 * (sp.length - 1)), i1 = Math.round(SAIL1 * (sp.length - 1)), base = sp.slice(i0, i1 + 1).map(q => q.p);
      fill(base.concat(A.sail.slice().reverse()), '#3A2378', 0.72); line(A.sail, k * 0.06, '#E6F0FF', 0.9);
      c.globalCompositeOperation = 'lighter'; for (let j = 0; j < A.sail.length; j++) { const b2 = base[Math.min(base.length - 1, Math.round(j / (A.sail.length - 1) * (base.length - 1)))]; for (let u = 0.2; u < 0.95; u += 0.15) { const q = S(vlerp(b2, A.sail[j], u)); c.globalAlpha = al * 0.8; c.fillStyle = '#FF6BE6'; c.beginPath(); c.arc(q[0], q[1], Math.max(0.8, k * 0.035), 0, TAU); c.fill(); } } c.globalCompositeOperation = 'source-over'; }
    // the fins: icy fans
    const fan = (root, tip, w) => { const r = S(root), t = S(tip), dx = t[0] - r[0], dy = t[1] - r[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * w * k, ny = dx / L * w * k; c.globalAlpha = al * 0.55; c.fillStyle = '#BFD8FF'; c.beginPath(); c.moveTo(r[0], r[1]); c.lineTo(t[0] + nx, t[1] + ny); c.lineTo(t[0] - nx * 0.4, t[1] - ny * 0.4); c.closePath(); c.fill(); c.strokeStyle = '#9A6BFF'; c.lineWidth = Math.max(1, k * 0.03); c.stroke(); };
    const pecR = sp[Math.round(S_PEC * (sp.length - 1))].p, tfR = sp[Math.round(S_TF * (sp.length - 1))].p; fan(pecR, A.pec[0], 0.5); fan(pecR, A.pec[1], 0.5); fan(tfR, A.tfin[0], 0.4); fan(tfR, A.tfin[1], 0.4);
    fan(A.tail, A.tailTips[0], 0.35); fan(A.tail, A.tailTips[1], 0.35);
    // the body: a widening stroke, a pale belly line, a magenta vein
    for (let i = 1; i < sp.length; i++) { const a = sp[i - 1], b = sp[i], r = (a.r + b.r) * 0.5 * k; line([a.p, b.p], r * 2.1, '#2A1F66', 0.95); line([vsub(a.p, vmul(a.up, a.r * 0.45)), vsub(b.p, vmul(b.up, b.r * 0.45))], r * 0.9, '#C9C3EE', 0.85);
      line([a.p, b.p], r * 0.35, ch > 1 - b.s ? '#FFB8F4' : '#E04CD8', 0.75); }
    for (const L of [A.fore, A.hindC]) for (const q of L) line([sp[Math.round((L === A.fore ? S_FORE : S_HIND) * (sp.length - 1))].p, q], k * 0.12, '#3B2D80', 0.9);
    // the head: a wedge from the neck to the snout, the crest, the eyes, the mouth
    const nk = sp[0].p, side = vmul(A.Fh.y, 0.2 * A.K), poly = [vadd(nk, side), vadd(A.head, side), A.snout, vsub(A.head, side), vsub(nk, side)];
    fill(poly, '#33287A', 1); line([A.hornB[0], A.horns[0]], k * 0.06, '#E6F0FF', 0.9); line([A.hornB[1], A.horns[1]], k * 0.06, '#E6F0FF', 0.9);
    if ((o.jaw || 0) > 0.2) line([A.throat, A.jawTip], k * 0.1, '#FF5FD8', 0.9);
    c.globalCompositeOperation = 'lighter'; for (const e of A.eyes) { const q = S(e); c.globalAlpha = al; c.fillStyle = '#F4E8FF'; c.beginPath(); c.ellipse(q[0], q[1], Math.max(1.2, k * 0.07), Math.max(0.8, k * 0.03), 0, 0, TAU); c.fill(); }
    c.restore(); return true;
  }
  const ready = () => !!(D && D.ready);
  return { usable, warm, ready, step, release, gpuCount, pose, draw, draw2D, scr, get anchors() { return ANC; }, DIMS, MAT, STATS, RES, CZ, get nv() { return D ? D.nv + D.nm : 0; }, get ntri() { return D ? D.M.ntri + D.M2.ntri : 0; }, get off() { return NOGL; },
    init() { data(); return D; } };
})();
if (typeof self !== 'undefined') self.TIAMAT_GL = TIAMAT_GL;
