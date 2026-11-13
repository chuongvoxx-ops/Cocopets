/* ---------- Wind's 11th Ultimate, Belladonna: the model (the lead's; M's materials in GLM, 20k5uz) ----------
   One botanical assembly drawn live with GLM, the way Susano O (20k5v) and Fenrir (20k8m) are:
     - the hub behind the pet, and the pet's seat on it (the pet itself is the core's, X.drawPetAt at anchor('seat'));
     - exactly 4 outer green leaves; one enormous pink flower (two rows of sculpted petals: 6 + 5); one small pearl-white
       inner flower (6 + 5);
     - exactly 6 green tentacles (3 a side), rooted behind the leaves, sweeping outward in the flower's plane;
     - exactly 8 thin white tentacles (4 a side), rooted behind the white flower, reaching FORWARD (toward the viewer);
     - one ring above the flower, with exactly 8 long swords fixed to it, points radially outward (one mesh: they can
       never be other than 8, and they turn with the ring).
   The flower stands mostly vertical and faces the game camera at every heading: draw()'s heading argument is ignored;
   steering shows through the pose (bank, lean, yaw, fold) and through the lag of the petals and tentacles.
   The frame: x right, y toward the camera (south), z up; the origin is the pet's hover point.
   Mesh conventions for M's materials (GLM ids 22..29): a petal or a leaf lies along its own +x (root at 0), its width
   along y, its cup toward +z; the second vertex attribute is the place along it (0 root .. 1 tip), the third the place
   across it (0 edge .. 0.5 midrib .. 1 edge). A tentacle segment is a tapered tube along +x.
   Pose channels: see blankPose(). COUNTS is taken from the rig itself, for the tests. */
const BELLADONNA_MODEL = (() => {
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera: orthographic, about 46 degrees above the floor)
  const VIS = 0.65;   // (the whole assembly: v318 was 1; the user asked for it 35% smaller)
  const hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => hyp3(a[0], a[1], a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const M3 = (x, y, z) => ({ x, y, z });
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  /* an orthonormal frame with x along xd and z as near zh as it can be */
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }

  /* ================= materials (GLM's ids; 22..29 are M's botanical set) ================= */
  const M_GOLD = 3, M_GRIP = 13, M_LEAF = 22, M_PINK = 23, M_PEARL = 24, M_TG = 25, M_TW = 26, M_RING = 27, M_MINT = 28, M_BLADE = 29;

  /* ================= proportions (tiles) ================= */
  const TILT = 24 * DEG;                              // the flower's face is this far above level: it stands mostly vertical, leaning back a little
  const HUB = [0, -0.5, 0.55];                        // the hub, behind and a little above the pet's hover point
  const SEAT = [0, -0.12, 0.52];                      // the pet's support, in the flower's frame (right, up-in-plane, toward the viewer)
  const LP1 = 2.75, WP1 = 1.62, LP2 = 2.0, WP2 = 1.25; // the pink flower: the back row's and the front row's petals (length, half width)
  const LW1 = 0.98, WW1 = 0.4, LW2 = 0.66, WW2 = 0.3;   // the white flower's two rows
  const LLF = 4.4, WLF = 1.45;                         // a leaf
  const LEAF_A = [35, 145, 215, 325];                 // the four leaves' places round the hub (degrees from the right, counter-clockwise)
  const NSEG = 8, NG = 10, NSUB = 4;                         // a tentacle's links; each link's path is walked in NSUB steps (the smooth curve the tube is drawn along)
  const LG = 1.29, RG = 0.33;                          // a green link's length; a green tentacle's root radius
  const LWT = 1.09, RWT = 0.105;                      // a white link's length; a white tentacle's root radius (well under half the green's)
  const TG_A = [42, 0, -60], TG_CURL = [1, 1, -1];    // the green tentacles of the right side: where they leave, which way their tips curl
  const TW_A = [34, 10, -18, -48];                    // the white tentacles of the right side
  const G_CURL = [], W_FWD = [], W_DROOP = [];   // per link, degrees: the green tips' curl, the white ones' reach toward the viewer and their droop
  const GLEN = [], TG_S = [-5, -1, 0];              // a green link's length (times LG): long at the root, short at the tip, so the tip winds into a spiral; the early outward swing of each (degrees a link)
  { let sum = 0; for (let j = 0; j < NG; j++) { GLEN.push(1.45 - 1.23 * Math.pow(j / (NG - 1), 0.85)); sum += GLEN[j]; } for (let j = 0; j < NG; j++) GLEN[j] *= NG * 0.94 / sum; }
  for (let j = 0; j < NG; j++) { const k = j / (NG - 1), k0 = Math.max(0, j - 1) / (NG - 1); G_CURL.push((j && j < 5 ? -4 : 0) + 380 * (Math.pow(k, 3.2) - Math.pow(k0, 3.2))); }
  for (let j = 0; j < NSEG; j++) { const k = j / (NSEG - 1); W_FWD.push(40 * (1 - Math.exp(-j / 2.4))); W_DROOP.push(44 * Math.pow(k, 1.6)); }
  const BUD = [90, 87, 92, 94, 1.5, 1.12, 70, 0.65, 0.4], BRA = 0.2;   // (the closed bud: its tilt toward the flower's up, the pink rows' and the white rows' closed angles, the pink rows' scales, the leaves' angle (degrees), how much each sheet's cup flattens, how much it stretches along its length)   // (the closed bud: its tilt, each row's closed angle in degrees and scale; breath's range, rad)
  const SLAM_A = [-4, 34, 72, 184, 146, 108];   // (each green tentacle's default slam direction on the floor, degrees from the model's +x toward the camera: a ring round the front and sides)
  const RING_R = 1.2, RING_T = 0.1, SWORD_L = 1.8, RS = 1 / VIS;   // (RS: the ring and its swords keep their v318 size in tiles while the flower is VIS; the user asked for the bigger ring back)    // the ring (the approved, already-reduced size) and a sword, guard to point
  const RING_UP = 3.05, RING_Z = 2.15;                // the ring's centre: along the flower's up, then straight up (a clear gap over the petals)
  const RING_N = vnrm([0, -0.35, 1]);                 // the ring's axis at rest: nearly upright, tipped so the game camera sees a broad ellipse

  /* ================= meshes ================= */
  let MESH = null, MESH_MS = 0;
  /* a petal or a leaf: a sculpted sheet along +x. k = { L, W, tipPow, root, sweep, back, cup, fold, ruffle, crease, curl, seed } */
  function blade(B, k, mat, nu, nv) {
    const sd = k.seed || 0;
    const sh = (u, v) => { const w = 2 * u - 1, aw = Math.abs(w), s = Math.sin(Math.PI * Math.pow(v, k.tipPow)), wp = k.W * (k.root * (1 - v) + Math.pow(Math.max(0, s), k.wPow || 0.75));
      const x = k.L * v - (k.round == null ? 0.07 : k.round) * k.L * w * w * v, y = w * wp;
      let z = k.L * (k.sweep * v - k.back * v * v * v) + k.cup * k.W * w * w * (1 - 0.6 * v);
      z += k.fold * k.W * aw * Math.max(0, 1 - v / 0.25);                                   // the folded root
      z += k.ruffle * k.L * Math.pow(v, 1.5) * Math.sin(w * 7 + sd) * Math.pow(aw, 1.5) + k.ruffle * 0.5 * k.L * v * Math.sin(v * 9 + sd * 2.3) * w;   // the ruffled edge
      z += k.ruffle * 0.75 * k.L * Math.pow(aw, 3) * v * Math.sin(v * 19 + sd * 1.7 + w * 2) + k.ruffle * 0.12 * k.L * Math.pow(v, 5) * Math.sin(w * 9 + sd * 3.1);   // (the frill along the edge and round the tip)
      z += k.crease * k.W * (aw - 1) * (1 - v * 0.5) + k.curl * k.L * v * v * v;             // a leaf's midrib crease and curled tip
      return [x, y, z]; };
    B.surf(sh, nu, nv, () => mat, { e: (u, v) => v, a: (u, v) => u, flip: true });   // (flip: the sheet's normal is its cupped, viewer-facing side; M's petal materials darken the other)
    if (k.rim) for (const side of [0, 1]) {   // the rolled rim: a soft bead along each edge, so the sheet has a visible thickness
      B.surf((sv, t) => { const v = 0.015 + 0.975 * sv, P0 = sh(side, v), Pa = sh(side, Math.min(1, v + 0.02)), Pb = sh(side, Math.max(0, v - 0.02)), Pi = sh(side ? 0.93 : 0.07, v), T = vnrm(vsub(Pa, Pb));
        let I = vsub(Pi, P0); I = vsub(I, vmul(T, vdot(I, T))); I = vlen(I) > 1e-5 ? vnrm(I) : [0, side ? -1 : 1, 0]; const Nn = vcross(T, I), a = t * TAU, rr = k.rim * Math.min(1, Math.max(0.02, (sv - 0.1) * 7)) * Math.min(1, 0.2 + (1 - sv) * 7);   // (no bead at the folded root: it is hidden, and it showed between the white petals)
        return vadd(vadd(P0, vmul(I, rr * 0.55)), vadd(vmul(I, -Math.cos(a) * rr), vmul(Nn, Math.sin(a) * rr))); }, nv, 6, () => mat, { e: (sv, t) => 0.015 + 0.975 * sv, a: () => (side ? 0.9 : 0.1), flip: !side }); }
  }
  const PETAL = (L, W, seed, o) => Object.assign({ L, W, tipPow: 1.55, wPow: 0.5, round: 0.16, root: 0.16, sweep: 0.1, back: 0.2, cup: 0.1, fold: 0.15, ruffle: 0.16, crease: 0, curl: 0, rim: 0.03 * L / 2.75 + 0.012, seed }, o || {});
  function tubeSeg(B, L, r0, r1, mat, tip) { if (tip) { B.tube([0, 0, 0], [L * 0.55, 0, 0], r0, r0 * 0.6, mat, { cap0: 'round', cap1: false }); B.spike([L * 0.55, 0, 0], [L * 1.05, 0, 0], r0 * 0.6, mat); } else B.tube([0, 0, 0], [L, 0, 0], r0, r1, mat, { cap0: 'round', cap1: 'round' }); }
  const TGU = 10, TGV = 76, TWU = 7, TWV = 50;        // the tubes' sides and rings (green, white)
  const radG = t => RG * (1 - 0.9 * Math.pow(t, 0.95)) * Math.sqrt(Math.min(1, (1 - t) * 14)), radW = t => RWT * (0.45 + 0.55 * Math.min(1, t * 9)) * (1 - 0.86 * Math.pow(t, 1.2)) * Math.sqrt(Math.min(1, (1 - t) * 10));
  /* lay a tube mesh along curves (each a list of points): a Catmull-Rom centre line, a frame carried along it without twist */
  function setTube(mesh, curves, nu, nv, rad, s, zh) {
    const Pp = mesh.pos, Nn = mesh.nrm; let b = 0;
    for (const cv of curves) { const n = cv.length - 1; let N0 = null;
      for (let j = 0; j <= nv; j++) { const x = j / nv * n, i0 = Math.min(n - 1, Math.floor(x)), w = x - i0, w2 = w * w, w3 = w2 * w, p0 = cv[Math.max(0, i0 - 1)], p1 = cv[i0], p2 = cv[i0 + 1], p3 = cv[Math.min(n, i0 + 2)], c = [0, 0, 0], T = [0, 0, 0];
        for (let d = 0; d < 3; d++) { const a1 = -p0[d] + p2[d], a2 = 2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d], a3 = -p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]; c[d] = 0.5 * (2 * p1[d] + a1 * w + a2 * w2 + a3 * w3); T[d] = a1 + 2 * a2 * w + 3 * a3 * w2; }
        const tl = hyp3(T[0], T[1], T[2]) || 1; T[0] /= tl; T[1] /= tl; T[2] /= tl; const base = N0 || zh, dt = base[0] * T[0] + base[1] * T[1] + base[2] * T[2]; let nx = base[0] - T[0] * dt, ny = base[1] - T[1] * dt, nz = base[2] - T[2] * dt; const nl = hyp3(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl; N0 = [nx, ny, nz];
        const bx = T[1] * nz - T[2] * ny, by = T[2] * nx - T[0] * nz, bz = T[0] * ny - T[1] * nx, r = rad(j / nv) * s;
        for (let i = 0; i <= nu; i++) { const a = i / nu * TAU, ca = Math.cos(a), sa = Math.sin(a), dx = ca * nx + sa * bx, dy = ca * ny + sa * by, dz = ca * nz + sa * bz; Pp[b] = c[0] + dx * r; Pp[b + 1] = c[1] + dy * r; Pp[b + 2] = c[2] + dz * r; Nn[b] = dx; Nn[b + 1] = dy; Nn[b + 2] = dz; b += 3; } } }
    GLM.touchGeo(mesh);
  }
  function buildMeshes() {
    const q = lowFx() ? 0.7 : 1, n = v => Math.max(4, Math.round(v * q)), M = {};
    for (let i = 0; i < 3; i++) { const B = GLM.builder(q); blade(B, PETAL(LP1, WP1, 1.3 + i * 2.1), M_PINK, n(26), n(26)); M['pinkA' + i] = B.done(); }
    for (let i = 0; i < 2; i++) { const B = GLM.builder(q); blade(B, PETAL(LP2, WP2, 4.4 + i * 1.7, { sweep: 0.15, back: 0.2, ruffle: 0.16, cup: 0.14, fold: 0.07 }), M_PINK, n(22), n(22)); M['pinkB' + i] = B.done(); }
    { const B = GLM.builder(q); blade(B, PETAL(LW1, WW1, 2.2, { tipPow: 1.6, wPow: 0.42, round: 0.1, root: 0.1, ruffle: 0.018, cup: 0.4, sweep: 0.14, back: 0.1, fold: 0.1 }), M_PEARL, n(12), n(16)); M.whiteA = B.done(); }   // (a rounded spoon, narrow enough that neighbours stand apart)
    { const B = GLM.builder(q); blade(B, PETAL(LW2, WW2, 5.1, { tipPow: 1.6, wPow: 0.42, round: 0.1, root: 0.1, ruffle: 0.015, cup: 0.5, sweep: 0.12, back: 0.05, fold: 0.1 }), M_PEARL, n(10), n(12)); M.whiteB = B.done(); }
    { const B = GLM.builder(q); blade(B, { L: LLF, W: WLF, tipPow: 0.85, wPow: 0.8, round: 0.04, root: 0.08, sweep: 0.05, back: 0.0, cup: 0.14, fold: 0, ruffle: 0.03, crease: 0.14, curl: 0.2, rim: 0.03, seed: 0.7 }, M_LEAF, n(14), n(24));
      B.tube([-0.25, 0, -0.05], [LLF * 0.86, 0, LLF * 0.05 * 0.86 - WLF * 0.14 * 0.57 + 0.16 * LLF * 0.636], 0.075, 0.016, M_LEAF, { cap0: 'round', cap1: 'round' }); M.leaf = B.done(); }   // (with its raised midrib)
    const tap = t => 1 - 0.82 * Math.pow(t, 1.25);
    // the tentacles: one tube mesh for the six green ones and one for the eight white ones, their vertices rewritten each
    // frame along the rig's curves (setTube): smooth, tapered, two draw calls
    { const B = GLM.builder(1); for (let t = 0; t < 6; t++) B.surf((u, v) => [u, v, t], TGU, TGV, () => M_TG, {}); M.tentG = B.done(); }
    { const B = GLM.builder(1); for (let t = 0; t < 8; t++) B.surf((u, v) => [u, v, t], TWU, TWV, () => M_TW, {}); M.tentW = B.done(); }
    { const B = GLM.builder(q);   // the hub: the calyx behind, the pet's cushion, a ring of gold stamens (the flower's frame: x right, y up-in-plane, z toward the viewer)
      B.ell([0, 0, -0.3], [0.8, 0.8, 0.34], M_LEAF, { seg: n(18), rings: n(8) });
      // the calyx: eight pointed sepals cupping the flower's back, a short stem stub
      for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU, ph = 0.5, X = [Math.cos(a) * Math.cos(ph), Math.sin(a) * Math.cos(ph), -Math.sin(ph)], Y = [-Math.sin(a), Math.cos(a), 0];
        B.push(X, Y, vcross(X, Y), [Math.cos(a) * 0.3, Math.sin(a) * 0.3, -0.32]); blade(B, { L: 1.15, W: 0.34, tipPow: 0.9, wPow: 0.8, round: 0.04, root: 0.5, sweep: -0.1, back: -0.3, cup: -0.3, fold: 0, ruffle: 0.02, crease: 0.1, curl: 0, rim: 0.016, seed: i }, M_LEAF, n(6), n(10)); B.pop(); }
      B.tube([0, 0, -0.5], [0, -0.1, -0.86], 0.2, 0.1, M_TG, { seg: n(10), cap0: false, cap1: 'round' });
      // the white flower's floor: a clean pearl bowl behind its petals (nothing darker shows between them)
      B.surf((u, v) => { const a = u * TAU, rr = 0.7 * v; return [Math.cos(a) * rr, Math.sin(a) * rr, 0.27 + 0.08 * v * v]; }, n(28), n(5), () => M_PEARL, { e: (u, v) => 0.08 * v, a: () => 0.5 });   // (a round, shallow, darker ivory dish: it only closes the gaps near the centre and stays behind the petals)
      // the pet's cushion: a soft pearl pad on a rosette of small petals, a ring of gold stamens round it
      B.ell([SEAT[0], SEAT[1] - 0.2, SEAT[2] - 0.1], [0.32, 0.13, 0.27], M_PEARL, { seg: n(14), rings: n(6) });
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, ph = 0.35, X = [Math.cos(a) * Math.cos(ph), Math.sin(a) * Math.cos(ph), Math.sin(ph)], Y = [-Math.sin(a), Math.cos(a), 0];
        B.push(X, Y, vcross(X, Y), [SEAT[0] + Math.cos(a) * 0.14, SEAT[1] - 0.2 + Math.sin(a) * 0.1, SEAT[2] - 0.24]); blade(B, PETAL(0.36, 0.17, i * 1.3, { tipPow: 1.2, wPow: 0.6, ruffle: 0.03, cup: 0.4, sweep: 0.1, back: 0.05, fold: 0.1, rim: 0.008 }), M_PEARL, n(5), n(6)); B.pop(); }
      for (let i = 0; i < 14; i++) { const a = (i + 0.5) / 14 * TAU, rr = 0.52 + 0.05 * (i % 2), c = [Math.cos(a) * rr, Math.sin(a) * rr, 0.42 + 0.05 * (i % 2)]; B.tube([c[0] * 0.72, c[1] * 0.72, 0.2], c, 0.014, 0.01, M_GOLD, { seg: 5, cap0: false, cap1: 'round' }); B.ell(c, [0.034, 0.034, 0.05], M_GOLD, { seg: 6, rings: 4 }); }
      M.hub = B.done(); }
    { const B = GLM.builder(q);   // the ring and its eight swords, one rigid mesh: the ring about its own z, the swords in its plane, points outward
      B.torZ([0, 0, 0], RING_R, RING_T, M_RING, {}); B.torZ([0, 0, 0.012], RING_R - RING_T * 0.15, RING_T * 0.5, M_MINT, {}); B.torZ([0, 0, 0], RING_R + RING_T * 0.75, RING_T * 0.32, M_GOLD, {}); B.torZ([0, 0, 0], RING_R - RING_T * 0.8, RING_T * 0.28, M_GOLD, {});
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, d = [Math.cos(a), Math.sin(a), 0];
        B.along(vmul(d, RING_R), d, [0, 0, 1]);
        // the pommel (a mint gem in a gold claw on the ring), the wrapped grip, the cross-guard with swept quillons and a gem
        B.sph([0, 0, 0], 0.085, M_MINT, 8); B.torX([0.035, 0, 0], 0.07, 0.022, M_GOLD, { seg: 12, rseg: 5 }); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.78; B.tube([-0.05, Math.cos(a) * 0.05, Math.sin(a) * 0.05], [0.05, Math.cos(a) * 0.085, Math.sin(a) * 0.085], 0.014, 0.012, M_GOLD, { seg: 4 }); }
        B.tube([0.06, 0, 0], [0.33, 0, 0], 0.036, 0.03, M_GRIP, { seg: 8, cap0: 'round', cap1: 'flat' }); for (let i = 0; i < 6; i++) B.torX([0.09 + i * 0.042, 0, 0], 0.035 - i * 0.001, 0.008, M_GOLD, { seg: 8, rseg: 4 });
        B.box([0.36, 0, 0], [0.034, 0.1, 0.042], 0.014, M_GOLD); B.sph([0.36, 0, 0.04], 0.03, M_MINT, 6); B.sph([0.36, 0, -0.04], 0.03, M_MINT, 6);
        for (const sg of [-1, 1]) { B.tube([0.36, sg * 0.08, 0], [0.385, sg * 0.17, 0], 0.034, 0.028, M_GOLD, { seg: 6 }); B.tube([0.385, sg * 0.17, 0], [0.44, sg * 0.235, 0], 0.028, 0.018, M_GOLD, { seg: 6 }); B.sph([0.445, sg * 0.24, 0], 0.03, M_GOLD, 6); }
        B.box([0.415, 0, 0], [0.03, 0.06, 0.026], 0.008, M_GOLD);                                    // (the blade's collar)
        B.surf((u, v) => { const w = 2 * u - 1, hw = v < 0.82 ? lerp(0.105, 0.07, v / 0.82) : 0.07 * (1 - (v - 0.82) / 0.18); return [0.39 + v * (SWORD_L - 0.39), w * hw, 0.026 * Math.min(1, (1 - Math.abs(w)) / 0.42) * (v < 0.9 ? 1 : (1 - v) / 0.1)]; }, 8, 14, () => M_BLADE, { e: (u, v) => Math.abs(2 * u - 1) });
        B.surf((u, v) => { const w = 2 * u - 1, hw = v < 0.82 ? lerp(0.105, 0.07, v / 0.82) : 0.07 * (1 - (v - 0.82) / 0.18); return [0.39 + v * (SWORD_L - 0.39), w * hw, -0.026 * Math.min(1, (1 - Math.abs(w)) / 0.42) * (v < 0.9 ? 1 : (1 - v) / 0.1)]; }, 8, 14, () => M_BLADE, { e: (u, v) => Math.abs(2 * u - 1), flip: true });
        B.pop(); }
      M.ring = B.done(); }
    return M;
  }
  /* each part's bounds (its own frame: a centre and a radius), its 2D stand-in's colour and shape */
  const PARTS = {
    pinkA0: { c: [LP1 / 2, 0, 0.2], R: LP1 * 0.62, L: LP1, W: WP1, col: '#F0518E', k: 'petal' }, pinkA1: { c: [LP1 / 2, 0, 0.2], R: LP1 * 0.62, L: LP1, W: WP1, col: '#EE4B89', k: 'petal' }, pinkA2: { c: [LP1 / 2, 0, 0.2], R: LP1 * 0.62, L: LP1, W: WP1, col: '#F25A95', k: 'petal' },
    pinkB0: { c: [LP2 / 2, 0, 0.2], R: LP2 * 0.64, L: LP2, W: WP2, col: '#F772A6', k: 'petal' }, pinkB1: { c: [LP2 / 2, 0, 0.2], R: LP2 * 0.64, L: LP2, W: WP2, col: '#F87BAD', k: 'petal' },
    whiteA: { c: [LW1 / 2, 0, 0.1], R: LW1 * 0.66, L: LW1, W: WW1, col: '#FBF6EC', k: 'petal' }, whiteB: { c: [LW2 / 2, 0, 0.1], R: LW2 * 0.68, L: LW2, W: WW2, col: '#FFFDF6', k: 'petal' },
    leaf: { c: [LLF / 2, 0, 0.1], R: LLF * 0.58, L: LLF, W: WLF, col: '#3FA046', k: 'leaf' }, hub: { c: [0, 0, 0], R: 0.95, col: '#F4EEDD', k: 'hub' }, ring: { c: [0, 0, 0], R: RING_R + SWORD_L + 0.1, col: '#E8F6E4', k: 'ring' } };
  for (let j = 0; j < NG; j++) PARTS['tg' + j] = { c: [LG * GLEN[j] / 2, 0, 0], R: LG * GLEN[j] * 0.75 + 0.1, L: LG * GLEN[j], W: RG * (1 - 0.8 * j / NG), col: '#4CAF50', k: 'tent' };
  for (let j = 0; j < NSEG; j++) { PARTS['tw' + j] = { c: [LWT / 2, 0, 0], R: LWT * 0.66, L: LWT, W: RWT * (1 - 0.8 * j / NSEG), col: '#F7F3EA', k: 'tent' }; }

  const WIDE = th => 1 + 0.17 * Math.cos(th) * Math.cos(th) - 0.07 * Math.sin(th) * Math.sin(th);   // (the lead: the bloom is broader than it is tall, as in the concept)
  /* ================= the rig: a pose -> the placed parts and the anchors ================= */
  function rig(P) {
    const list = [], A = {}, sw = P.sway || 0, ax = Math.max(-1.5, Math.min(1.5, P.accX || 0)), ay = Math.max(-1.5, Math.min(1.5, P.accY || 0));
    // the flower's frame: r right, u up-in-plane, f toward the viewer; then yaw, bank (about f) and lean (about r)
    let r = [1, 0, 0], f = [0, Math.cos(TILT), Math.sin(TILT)], u = vcross(r, f);
    const G = mm(rotZ(P.yaw || 0), mm(rotAxis(f, P.bank || 0), rotAxis(r, P.lean || 0))); r = mv(G, r); u = mv(G, u); f = mv(G, f);
    // spin: the whole flower turns like a pinwheel about its facing axis (leaves, petals, tentacles); the hub with the pet's
    // seat, and the ring, keep the unspun frame (r0, u0), so the pet stays put and upright
    const r0 = r, u0 = u; if (P.spin) { const Sp = rotAxis(f, P.spin); r = mv(Sp, r0); u = mv(Sp, u0); }
    const at0 = (a, b, c) => [HUB[0] + r0[0] * a + u0[0] * b + f[0] * c, HUB[1] + r0[1] * a + u0[1] * b + f[1] * c, HUB[2] + r0[2] * a + u0[2] * b + f[2] * c];
    const hub = HUB, at = (a, b, c) => [hub[0] + r[0] * a + u[0] * b + f[0] * c, hub[1] + r[1] * a + u[1] * b + f[1] * c, hub[2] + r[2] * a + u[2] * b + f[2] * c];
    const bloom = P.bloom == null ? 1 : P.bloom, fold = cl(P.fold || 0), spread = Math.max(0, bloom - 1) / 0.3;
    /* a blade at angle th round the hub, pitched ph toward the viewer, rooted at radius r0 and depth dz */
    // bulb (0..1): the bloom closes into a bud. Each petal and leaf turns to its closed angle (phC), and the whole bud tips its
    // tip up and toward the viewer (about r, BUD_TILT), so it reads as a teardrop from the game camera; the hub and the seat stay.
    // flutter (0..1): each petal shivers on its own phase (a quick pitch and roll of its plane); time from P.t, else the clock.
    const BU = P.__bud || BUD, bulb = cl(P.bulb || 0), bE = bulb * bulb * (3 - 2 * bulb), beta = bE * BU[0] * DEG, tipA = bE * (P.bulbTip || 0), rT = tipA ? vadd(vmul(r, Math.cos(tipA)), vmul(u, -Math.sin(tipA))) : r, uT = tipA ? vadd(vmul(u, Math.cos(tipA)), vmul(r, Math.sin(tipA))) : u, fb = vadd(vmul(f, Math.cos(beta)), vmul(uT, Math.sin(beta))), ub = vsub(vmul(uT, Math.cos(beta)), vmul(f, Math.sin(beta)));   // (bulbTip: the bud's axis leans in the flower's plane, toward its right for +, so A can point it along the dive)
    const flut = Math.max(0, Math.min(2, P.flutter == null ? 0 : P.flutter)), Tm = P.t != null ? P.t : nowMs() / 1000; let pid = 0;
    const atB = (a, b, c) => [HUB[0] + rT[0] * a + ub[0] * b + fb[0] * c, HUB[1] + rT[1] * a + ub[1] * b + fb[1] * c, HUB[2] + rT[2] * a + ub[2] * b + fb[2] * c];
    const put = (part, th, ph, r0, dz, s, al, phC, sC) => { const d = [Math.cos(th), Math.sin(th)], D = vadd(vmul(rT, d[0]), vmul(ub, d[1])), Tn = vadd(vmul(rT, -d[1]), vmul(ub, d[0])), k = pid++;
      if (phC != null) { ph = lerp(ph, phC, bE); s = lerp(s, sC, bE); }
      let roll = 0; if (flut > 0) { const w = 7.3 + 2.9 * Math.sin(k * 12.9898), q = k * 4.17; ph += flut * 0.075 * Math.sin(Tm * w + q) * (1 - 0.7 * bE); roll = flut * 0.06 * Math.sin(Tm * (w * 1.37) + q * 1.9) * (1 - 0.7 * bE); }
      const X = vnrm(vadd(vmul(D, Math.cos(ph)), vmul(fb, Math.sin(ph)))); let Y = vmul(Tn, -1), Z = vcross(X, Y); if (roll) { const c = Math.cos(roll), sn = Math.sin(roll), Y2 = vadd(vmul(Y, c), vmul(Z, sn)); Z = vsub(vmul(Z, c), vmul(Y, sn)); Y = Y2; }
      const o = atB(d[0] * r0, d[1] * r0, dz); let Xs = X; if (phC != null && bE > 0) { Z = vmul(Z, 1 - BU[7] * bE); Xs = vmul(X, 1 + (BU[8] || 0) * bE); }   // (and stretch along their length: a tall bud)   // (in the bud each sheet's cup, ruffle and back-curl flatten, so the petals lie smooth and overlap)
      list.push({ part, o, R: M3(Xs, Y, Z), s, al: al == null ? 1 : al }); return { o, X }; };
    // 1. the four leaves (behind everything)
    { const lv = cl(P.leaves == null ? 1 : P.leaves), br = cl(P.brace || 0);
      for (let i = 0; i < 4; i++) { const up = i < 2 ? 1 : -1, th = (LEAF_A[i] + up * (i % 2 ? -1 : 1) * 0 + br * up * 4) * DEG + 0.025 * Math.sin(sw * 0.8 + i * 1.9);
        const ph = lerp(72, -6, lv) * DEG - br * 12 * DEG - fold * 26 * DEG + 0.03 * Math.sin(sw + i * 1.3) - ay * 0.04 * up;
        const g = put('leaf', th, ph, 0.35, -0.72, 0.35 + 0.65 * lv, cl(lv * 3), BU[6] * DEG, 0.72); A['leaf' + i] = vadd(g.o, vmul(g.X, LLF * (0.35 + 0.65 * lv))); } }   // (in the bud the leaves wrap up round its base)
    // 2. the six green tentacles, rooted behind the leaves
    const TG = [], TW = []; let TGs = 1, TGa = 1, TWs = 1, TWa = 1;
    // A's per-tentacle channels (each optional): own wave phases and amplitudes, the green tips' coil, the white feelers' reach, the attack flick
    const arr = (a, i, d) => (a && a[i] != null && isFinite(a[i]) ? a[i] : d), flk = cl(P.flick || 0);
    { const tg = cl(P.tentG == null ? 1 : P.tentG); let n = 0;
      for (const side of [1, -1]) for (let i = 0; i < 3; i++, n++) { const a0 = (side > 0 ? TG_A[i] : 180 - TG_A[i]) + side * flk * Math.min(0, TG_A[i]) * 0.3,   // (flick: the lower ones fling down and out; the upper ones only unfurl, clear of the ring)
        cs = TG_CURL[i] * side, s = 0.3 + 0.7 * tg, gph = arr(P.tgPh, n, null), gA = gph == null ? 0.11 : 0.2 * Math.max(0, Math.min(TG_A[i] > 20 ? 2 : 3.5, arr(P.tgAmp, n, 1))) * (TG_A[i] > 20 ? 0.4 : 1),   // (the upper pair waves less: it stays clear of the ring)
        gC = cl(arr(P.tgCoil, n, 0)) * (1 - flk); let p = at(Math.cos(a0 * DEG) * 0.9, Math.sin(a0 * DEG) * 0.9, -0.92), al = a0 * DEG;
        A['tgRoot' + n] = p;
        const cv = []; TG.push(cv); const li0 = list.length;
        for (let j = 0; j < NG; j++) { const p0 = p, inc = cs * (G_CURL[j] * (1 - (TG_A[i] > 20 ? 0 : 0.35) * flk) + (j && j < 5 ? TG_S[i] : 0) + (j >= NG - 2 ? 34 * gC : 0)) * DEG * (1 + 1.6 * (1 - tg));   // (tgCoil: the last two links wind tighter; flick: the coil opens)
          for (let m = 0; m < NSUB; m++) { const jj = j + (m + 0.5) / NSUB, k = Math.min(1, jj / (NG - 1));   // (the link's turn spread over its length: a smooth curve)
            al += (inc + gA * k * Math.sin((gph == null ? sw * 1.15 + n * 1.7 : gph) - jj * 0.75) - (ax * side > 0 ? 0.05 : 0.09) * ax * k - 0.06 * ay * k * Math.cos(al)) / NSUB;
            const dz = -0.04 - 0.25 * fold * k - 2.6 * bE * Math.sqrt(k), D = vnrm(vadd(vadd(vmul(r, Math.cos(al)), vmul(u, Math.sin(al))), vmul(f, dz))); cv.push(p); p = vadd(p, vmul(D, LG * GLEN[j] * s / NSUB)); }
          const dl = vsub(p, p0); list.push({ part: 'tg' + j, o: p0, R: frameXZ(dl, f), s, al: cl(tg * 4), len: vlen(dl) }); }
        cv.push(p);
        // slam[n] (0 rest, 1 raised high, 2 slammed flat with its tip on the floor) and slamDir[n] (the floor direction, radians in the model's x-y; else straight out from the hub):
        // the tentacle's curve is blended toward a raised arc (up and well out, clear of the ring) and then a slam arc (over and down, its last third lying on the floor at floorZ)
        const sl = Math.max(0, Math.min(2, arr(P.slam, n, 0)));
        if (sl > 0.001) { const N = cv.length, Ltot = LG * NG * 0.94 * s, R0 = cv[0], dA = arr(P.slamDir, n, null), dA2 = dA != null ? dA : SLAM_A[n] * DEG, dd = [Math.cos(dA2), Math.sin(dA2), 0], UP = [0, 0, 1];
          const fz = (P.floorZ != null ? P.floorZ : -1.2) / VIS, bez = (a, b, c2, d, t) => { const m1 = 1 - t; return [0, 1, 2].map(i => m1 * m1 * m1 * a[i] + 3 * m1 * m1 * t * b[i] + 3 * m1 * t * t * c2[i] + t * t * t * d[i]); };
          const sg = vdot(vsub(R0, HUB), r0) >= 0 ? 1 : -1, ro = vmul(r0, sg), UPr = vnrm(vadd(u0, [0, 0, 0.35])), rB = vnrm(vadd(vmul(ro, 0.85), vmul(dd, 0.15))), rA = [R0, vadd(R0, vadd(vmul(rB, 0.42 * Ltot), vmul(UPr, 0.16 * Ltot))), vadd(R0, vadd(vmul(rB, 0.8 * Ltot), vmul(UPr, 0.85 * Ltot))), vadd(R0, vadd(vmul(rB, 0.58 * Ltot), vmul(UPr, 1.12 * Ltot)))];   // (raised high and out, the tip coiled back over: about to strike)   // (raised: in the flower's own frame, so it stays clear of the ring as the flower banks)   // (raised: up and out, the tip curling over)
          const Rr = Math.max(1.5, Math.min(7, arr(P.slamR, n, 3.5))) / VIS, sp = Math.max(0, Ltot - Rr), lf = Math.min(0.36 * Ltot, 0.5 * Rr), G = [HUB[0] + dd[0] * Rr, HUB[1] + dd[1] * Rr, fz], sA = [R0, vadd(R0, vadd(vadd(vmul(ro, 0.3 * Ltot + 0.1 * Rr), vmul(dd, 0.15 * Rr)), vmul(UPr, 0.42 * Ltot + 0.35 * sp))), [G[0] - dd[0] * lf, G[1] - dd[1] * lf, fz + 0.03], G];   // (slammed, slamR tiles out: the root rears up and over like a whip, higher for a short reach, so the tip still comes down onto the floor and lies flat there)
          const w1 = sstep(0, 1, Math.min(1, sl)), w2 = sstep(0, 1, Math.max(0, sl - 1));
          const swing = (p0, p1, w) => { if (w <= 0) return p0; if (w >= 1) return p1; const a = vsub(p0, R0), b = vsub(p1, R0), la = vlen(a), lb = vlen(b); if (la < 1e-6 || lb < 1e-6) return vadd(vmul(p0, 1 - w), vmul(p1, w)); const na = vmul(a, 1 / la), nb = vmul(b, 1 / lb), om = Math.acos(Math.max(-1, Math.min(1, vdot(na, nb)))); if (om < 1e-4) return vadd(R0, vmul(na, lerp(la, lb, w)));
            const sn = Math.sin(om), d = vadd(vmul(na, Math.sin((1 - w) * om) / sn), vmul(nb, Math.sin(w * om) / sn)); return vadd(R0, vmul(d, lerp(la, lb, w))); };   // (a point swings round the root on an arc: the tentacle whips over, it never folds in through the chord)
          for (let i = 1; i < N; i++) { const tt = i / (N - 1), a = bez(rA[0], rA[1], rA[2], rA[3], tt), b2 = bez(sA[0], sA[1], sA[2], sA[3], tt); cv[i] = swing(swing(cv[i], a, w1), b2, w2); }
          for (let j = 0; j < NG; j++) { const it = list[li0 + j], a = cv[j * NSUB], b2 = cv[(j + 1) * NSUB], dl = vsub(b2, a); it.o = a; it.R = frameXZ(dl, f); it.len = vlen(dl); }
          p = cv[N - 1]; }
        A['tg' + n] = p; }
      TGs = 0.3 + 0.7 * tg; TGa = cl(tg * 4); }
    const BR = off => (P.breath == null ? 0 : BRA * (1 - bE) * Math.sin(P.breath + off));   // (breath: each row opens and closes a few degrees, a quarter cycle after the one inside it)
    // 3. the pink flower: the back row, then the front row
    { const open = cl(bloom);
      for (let i = 0; i < 6; i++) { const th = (90 + i * 60) * DEG, ph = lerp(80, -7, open) * DEG - spread * 6 * DEG - fold * 34 * DEG + 0.045 * Math.sin(sw + i * 1.05) + BR(0) - 0.03 * (ax * Math.cos(th) + ay * Math.sin(th));
        put('pinkA' + (i % 3), th, ph, 0.18, 0, [1, 0.96, 1.02, 0.95, 1.02, 0.97][i] * WIDE(th) * (0.3 + 0.7 * open), null, (BU[1] + 2 * Math.sin(i * 2.1)) * DEG, BU[4]); }
      for (let i = 0; i < 5; i++) { const th = (120 + 36 + i * 72) * DEG, ph = lerp(84, 7, open) * DEG - spread * 9 * DEG - fold * 30 * DEG + 0.05 * Math.sin(sw * 1.1 + i * 1.6 + 0.8) + BR(-Math.PI / 2) - 0.035 * (ax * Math.cos(th) + ay * Math.sin(th));
        put('pinkB' + (i % 2), th, ph, 0.2, 0.06, [1, 0.95, 1.03, 0.97, 1.0][i] * WIDE(th) * (0.3 + 0.7 * open), null, (BU[2] + 2 * Math.sin(i * 1.7)) * DEG, BU[5]); } }
    // 4. the hub and the pet's seat
    list.push({ part: 'hub', o: hub, R: M3(r0, u0, f), s: 1 - 0.55 * bE, al: cl(bloom * 3) });   // (closed, the hub and the pet's cushion draw in under the bud: nothing pale shows at its front)
    A.bulb = bE;
    A.center = hub; A.seat = at0(SEAT[0], SEAT[1], SEAT[2]); A.top = at0(0, LP1, 0.3); A.forward = f; A.up = u0; A.right = r0;
    // 5. the white flower round the pet
    { const wh = cl(P.white == null ? 1 : P.white);
      for (let i = 0; i < 6; i++) { const th = (30 + i * 60) * DEG; put('whiteA', th, lerp(86, 15, wh) * DEG - spread * 8 * DEG + 0.05 * Math.sin(sw * 1.2 + i * 1.3) + BR(Math.PI / 2), 0.3, 0.28, 0.4 + 0.6 * wh, cl(wh * 3), BU[3] * DEG, 0.8); }
      for (let i = 0; i < 5; i++) { const th = (90 + i * 72) * DEG; put('whiteB', th, lerp(88, 36, wh) * DEG - spread * 10 * DEG + 0.05 * Math.sin(sw * 1.3 + i * 1.9) + BR(Math.PI / 2 + 0.6), 0.24, 0.34, 0.4 + 0.6 * wh, cl(wh * 3), (BU[3] + 6) * DEG, 0.8); } }
    // 6. the eight white tentacles, rooted behind the white flower, reaching forward
    { const tw = cl(P.tentW == null ? 1 : P.tentW); let n = 0;
      for (const side of [1, -1]) for (let i = 0; i < 4; i++, n++) { const a0 = (side > 0 ? TW_A[i] : 180 - TW_A[i]) + side * flk * Math.min(0, TW_A[i] - 4) * 0.35, wph = arr(P.twPh, n, null), wA = wph == null ? 0.09 : 0.16 * Math.max(0, Math.min(TW_A[i] > 20 ? 2 : 3.5, arr(P.twAmp, n, 1))) * (TW_A[i] > 20 ? 0.4 : 1), rch = Math.max(-1.2, Math.min(1.2, arr(P.twReach, n, 0))), s = (0.3 + 0.7 * tw) * (TW_A[i] > 20 ? 1 + 0.03 * Math.min(0, rch) : 1 + 0.07 * rch + 0.06 * flk); let p = at(Math.cos(a0 * DEG) * 0.46, Math.sin(a0 * DEG) * 0.46, 0.02), al = a0 * DEG;   // (twReach and flick lengthen the lower feelers; the upper pair, near the ring, only draws back)
        A['twRoot' + n] = p;
        const cv = []; TW.push(cv);
        for (let j = 0; j < NSEG; j++) { const p0 = p, dr = (j ? W_DROOP[j] - W_DROOP[j - 1] : 0) * DEG;
          for (let m = 0; m < NSUB; m++) { const jj = j + (m + 0.5) / NSUB, k = Math.min(1, jj / (NSEG - 1)), w0 = W_FWD[Math.max(0, j - 1)], w1 = W_FWD[j], wf = j ? lerp(w0, w1, (m + 1) / NSUB) : w1 * (m + 1) / NSUB;
            al += ((side > 0 ? -dr : dr) * (1 - 0.4 * flk) + wA * k * Math.sin((wph == null ? sw * 1.3 + n * 2.1 : wph) - jj * 0.8) - 0.07 * ax * k) / NSUB;
            const fw = (wf * tw + 7 * rch * k + 6 * k * Math.sin(wph == null ? sw * 0.9 + n : wph * 0.7 + n)) * DEG - 0.1 * ay * k - fold * 0.5 * k - 1.25 * bE * Math.sqrt(k), D = vnrm(vadd(vmul(vadd(vmul(r, Math.cos(al)), vmul(u, Math.sin(al))), Math.cos(fw)), vmul(f, Math.sin(fw)))); cv.push(p); p = vadd(p, vmul(D, LWT * s * 0.94 / NSUB)); }
          const dl = vsub(p, p0); list.push({ part: 'tw' + j, o: p0, R: frameXZ(dl, f), s, al: cl(tw * 4), len: vlen(dl) }); }
        cv.push(p); A['tw' + n] = p; }
      TWs = 0.3 + 0.7 * tw; TWa = cl(tw * 4); }
    // 7. the ring and its eight swords
    { const rg = cl(P.ring == null ? 1 : P.ring), rc = vadd(at0(0, RING_UP + 2.1 * bE, 0), [0, 0, RING_Z]); let nz = mv(G, RING_N); if (P.ringTilt) nz = mv(rotAxis(f, P.ringTilt), nz);   // (the ring rises over the tall closed bud)
      const Rr = mm(frameXZ(vsub(r0, vmul(nz, vdot(r0, nz))), nz), rotZ(P.ringSpin || 0)); A.ring = rc; A.ringAxis = nz; A.ringR = Rr;
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; A['sword' + k] = vadd(rc, vmul(mv(Rr, [Math.cos(a), Math.sin(a), 0]), (RING_R + SWORD_L) * rg * RS)); A['hilt' + k] = vadd(rc, vmul(mv(Rr, [Math.cos(a), Math.sin(a), 0]), RING_R * rg * RS)); }
      if (rg > 0.01 && !P.ringAway) list.push({ part: 'ring', o: rc, R: Rr, s: rg * RS, al: cl(rg * 2), ring: 1 }); }
    return { list, A, r: r0, u: u0, f, tent: { g: TG, w: TW, gs: TGs, ga: TGa, ws: TWs, wa: TWa } };
  }
  /* the counts, from the rig itself */
  const COUNTS = (() => { const R = rig(blankPose()), n = re => R.list.filter(it => re.test(it.part)).length; return { leaves: n(/^leaf$/), pinkFlowers: 1, whiteFlowers: 1, pinkPetals: n(/^pink/), whitePetals: n(/^white/), greenTentacles: n(/^tg0$/), whiteTentacles: n(/^tw0$/), rings: n(/^ring$/), swords: Object.keys(R.A).filter(k => /^sword\d$/.test(k)).length }; })();

  /* ================= the view and the draws ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0], EYW = vcross(CW, EXW);
  const LW = vnrm([-0.45, 0.42, 0.8]), SBW = vnrm([-0.2, -0.38, 0.9]), RIMW = vnrm([0.55, -0.72, 0.42]), UPW = [0, 0, 1];
  function camAt(el, az) { const e = el * DEG, a = az * DEG, C = [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)], EX = vnrm(vcross([0, 0, 1], C).map(v => -v)); const ex = vlen(EX) > 1e-4 ? EX : [1, 0, 0]; return { C, EX: ex, EY: vcross(C, ex) }; }
  function mkView(x, y, z, o) {
    const T = o.T, sc = (o.scale || 1) * VIS, k = T * sc, X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T, K = o.cam ? camAt(o.cam[0], o.cam[1]) : null;
    const toS = K ? p => [X0 + vdot(p, K.EX) * k, Y0 + vdot(p, K.EY) * k] : p => [X0 + p[0] * k, Y0 + (p[1] * GY - p[2] * ZK) * k];
    const toW = p => ({ x: x + p[0] * sc, y: y + p[1] * GY * sc, z: z + p[2] * sc });
    return { T, sc, k, toS, toW, depth: p => vdot(p, K ? K.C : CW), x, y, z, K };
  }
  let LAST = null, NOGL = false, GLMS = 0, GLN = 0; const GLI = [], GLJ = [];
  // (a software rasteriser takes a large part of a second a frame: the 2D picture is drawn there instead, unless asked
  //  for: window.__BELLA_GL = 1, for tests and studio renders)
  const glOn = () => { if (NOGL || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__BELLA_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Belladonna: meshes', e); return false; } } return true; };
  const GLCAP = 1700, RIMC = [0.75, 1.0, 0.85], AMBC = [1.0, 0.97, 0.96];
  const ID3 = [new Float32Array([1, 0, 0]), new Float32Array([0, 1, 0]), new Float32Array([0, 0, 1]), new Float32Array(3)];
  function glPass(c, V, P, o, list, al0, tent) {
    const k = V.k, K = V.K, PX = K ? K.EX : EXW, PY = K ? K.EY : [0, GY, -ZK], PD = K ? K.C : CW, X0 = V.toS([0, 0, 0]);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const Pt = PARTS[it.part], rr = Pt.R * it.s * 1.05 * k, w = vadd(it.o, mv(it.R, vmul(Pt.c, it.s))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return;
    const m = c.getTransform ? c.getTransform() : null, dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (GLM.soft && !(typeof window !== 'undefined' && window.__BELLA_GLHQ) ? 0.4 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
    const bw = bx1 - bx0, bh = by1 - by0, tl = w => { const a = vdot(w, EXW), b = vdot(w, EYW), cc = vdot(w, CW); return K ? vadd(vadd(vmul(K.EX, a), vmul(K.EY, b)), vmul(K.C, cc)) : w; };
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: tl(LW), ls: tl(SBW), lr: tl(RIMW), up: tl(UPW), low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: o.t != null ? o.t : nowMs() / 1000 };
    const pg = cl((P.glow == null ? 0.35 : P.glow) / 2), rgl = cl((P.ringGlow == null ? 0.6 : P.ringGlow) / 2);
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh) continue; const s2 = it.s, al = al0 * it.al;
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = it.R.x[i] * s2; g.R1[i] = it.R.y[i] * s2; g.R2[i] = it.R.z[i] * s2; g.T[i] = it.o[i]; }
      g.alpha = al; g.glow = it.ring ? rgl : pg; g.kind = 0; g.wear = 0; g.fx = 0; g.glow2 = 0; g.spill = 0; g.d = vdot(it.o, PD); items.push(g); }
    if (tent) for (const [key, cvs2, nu, nv, rad, sc2, a2] of [['tentG', tent.g, TGU, TGV, radG, tent.gs, tent.ga], ['tentW', tent.w, TWU, TWV, radW, tent.ws, tent.wa]]) { const mesh = MESH[key]; if (!mesh || !cvs2.length || al0 * a2 < 0.02) continue;
      setTube(mesh, cvs2, nu, nv, rad, sc2, PD); const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; g.R0.set(ID3[0]); g.R1.set(ID3[1]); g.R2.set(ID3[2]); g.T.set(ID3[3]); g.alpha = al0 * a2; g.glow = pg; g.kind = 0; g.wear = 0; g.fx = 0; g.glow2 = 0; g.spill = 0; g.d = key === 'tentG' ? -9 : 9; items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++;
  }
  /* the 2D picture (no usable GPU): the same rig as flat petals, strokes and an ellipse, in the rig's back-to-front order */
  function drawFallback(c, V, R, P, al0) {
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; let gi = 0, wi = 0;
    for (const it of R.list) { const Pt = PARTS[it.part], al = al0 * it.al; if (al < 0.02) continue; c.globalAlpha = al;
      if (Pt.k === 'petal' || Pt.k === 'leaf') { const a = V.toS(it.o), tip = V.toS(vadd(it.o, vmul(it.R.x, Pt.L * it.s))), mid = vadd(it.o, vmul(it.R.x, Pt.L * it.s * (Pt.k === 'leaf' ? 0.42 : 0.6))), wv = vmul(it.R.y, Pt.W * it.s), l = V.toS(vadd(mid, wv)), rr = V.toS(vsub(mid, wv));
        c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(l[0], l[1], tip[0], tip[1]); c.quadraticCurveTo(rr[0], rr[1], a[0], a[1]); c.closePath();
        const g = c.createLinearGradient(a[0], a[1], tip[0], tip[1]); if (Pt.k === 'leaf') { g.addColorStop(0, '#1F7A3A'); g.addColorStop(1, '#63C15A'); } else if (/^pink/.test(it.part)) { g.addColorStop(0, '#C2185B'); g.addColorStop(0.5, Pt.col); g.addColorStop(1, '#FFC1D9'); } else { g.addColorStop(0, '#F3E7D3'); g.addColorStop(1, '#FFFFFF'); }
        c.fillStyle = g; c.fill(); c.strokeStyle = Pt.k === 'leaf' ? 'rgba(20,90,40,0.55)' : /^pink/.test(it.part) ? 'rgba(255,214,228,0.75)' : 'rgba(214,196,170,0.7)'; c.lineWidth = Math.max(0.8, V.k * 0.022); c.stroke(); if (Pt.k === 'leaf') { c.strokeStyle = 'rgba(232,222,150,0.8)'; c.lineWidth = Math.max(1, V.k * 0.04); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(tip[0], tip[1]); c.stroke(); } }
      else if (Pt.k === 'tent' && R.tent) { const gr = it.part.charAt(1) === 'g'; if (it.part !== 'tg0' && it.part !== 'tw0') continue;   // (each tentacle whole, at its first link's place in the order: a tapered curve)
        const cv = gr ? R.tent.g[gi++] : R.tent.w[wi++]; if (!cv) continue; const rad = gr ? radG : radW, sc = gr ? R.tent.gs : R.tent.ws, n = cv.length - 1; let q = V.toS(cv[0]);
        for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? (gr ? 'rgba(150,226,130,0.55)' : 'rgba(255,255,255,0.8)') : (gr ? '#2E8B3D' : '#EFE9DC'); q = V.toS(cv[0]);
          for (let i = 1; i <= n; i++) { const b = V.toS(cv[i]); c.lineWidth = Math.max(pass ? 0.5 : 1, rad((i - 0.5) / n) * sc * V.k * (pass ? 0.7 : 2)); c.beginPath(); c.moveTo(q[0], q[1] - (pass ? c.lineWidth * 0.5 : 0)); c.lineTo(b[0], b[1] - (pass ? c.lineWidth * 0.5 : 0)); c.stroke(); q = b; } } }
      else if (Pt.k === 'tent') { const a = V.toS(it.o), b = V.toS(vadd(it.o, vmul(it.R.x, it.len != null ? it.len : Pt.L * it.s))); c.strokeStyle = Pt.col; c.lineWidth = Math.max(1, Pt.W * it.s * V.k * 1.9); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      else if (Pt.k === 'hub') { const a = V.toS(vadd(it.o, vmul(it.R.z, 0.4))); c.fillStyle = Pt.col; c.beginPath(); c.arc(a[0], a[1], 0.8 * V.k, 0, TAU); c.fill(); c.strokeStyle = 'rgba(214,196,170,0.8)'; c.lineWidth = Math.max(0.8, V.k * 0.03); c.stroke(); c.fillStyle = '#E8C35A'; for (let i = 0; i < 12; i++) { const an = i / 12 * TAU, q = V.toS(vadd(it.o, vadd(vadd(vmul(it.R.x, Math.cos(an) * 0.52), vmul(it.R.y, Math.sin(an) * 0.52)), vmul(it.R.z, 0.45)))); c.beginPath(); c.arc(q[0], q[1], Math.max(0.8, 0.045 * V.k), 0, TAU); c.fill(); } }
      else if (Pt.k === 'ring') { const rg = it.s; c.strokeStyle = '#DDF5DD'; c.lineWidth = Math.max(1.5, RING_T * 2 * rg * V.k); c.beginPath(); for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, p = V.toS(vadd(it.o, vmul(mv(it.R, [Math.cos(a), Math.sin(a), 0]), RING_R * rg))); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.stroke();
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, d = mv(it.R, [Math.cos(a), Math.sin(a), 0]), p0 = V.toS(vadd(it.o, vmul(d, RING_R * rg))), p1 = V.toS(vadd(it.o, vmul(d, (RING_R + SWORD_L) * rg))), pg = V.toS(vadd(it.o, vmul(d, (RING_R + 0.36) * rg)));
          c.strokeStyle = '#F4FFF6'; c.lineWidth = Math.max(1.2, 0.11 * rg * V.k); c.beginPath(); c.moveTo(pg[0], pg[1]); c.lineTo(p1[0], p1[1]); c.stroke(); c.strokeStyle = '#E2C56A'; c.lineWidth = Math.max(1.2, 0.07 * rg * V.k); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(pg[0], pg[1]); c.stroke(); } } }
    c.restore();
  }
  /* the soft light round what glows (GLM.halos, over the picture): the ring and each blade in mint, the white flower in pearl and pink */
  const HL = [];
  function halos(c, V, R, P, al0) {
    if (typeof GLM === 'undefined' || !GLM.halos) return; const A = R.A, k = V.k, rgl = cl((P.ringGlow == null ? 0.6 : P.ringGlow) / 2), pg = cl((P.glow == null ? 0.35 : P.glow) / 2), rg = cl(P.ring == null ? 1 : P.ring), low = lowFx(); HL.length = 0;
    if (A.ring && A.ringR && rg > 0.05 && (!P.ringAway || !A.seat)) { const q = V.toS(A.ring); HL.push({ x: q[0], y: q[1], r: RING_R * 1.55 * rg * RS * k, a: (0.1 + 0.34 * rgl) * al0, col: 'mint', sy: 0.62 });
      if (!low) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, d = mv(A.ringR, [Math.cos(a), Math.sin(a), 0]), m = V.toS(vadd(A.ring, vmul(d, (RING_R + SWORD_L * 0.55) * rg * RS))); HL.push({ x: m[0], y: m[1], r: 0.62 * rg * RS * k, a: (0.05 + 0.2 * rgl) * al0, col: 'mint' }); } }
    if (A.seat) { const wh = cl(P.white == null ? 1 : P.white) * cl((P.bloom == null ? 1 : P.bloom) * 2) * (1 - (A.bulb || 0)), q = V.toS(A.seat); if (wh > 0.05) { HL.push({ x: q[0], y: q[1], r: 1.15 * k, a: (0.1 + 0.3 * pg) * wh * al0, col: 'pearl' }); if (!low) HL.push({ x: q[0], y: q[1], r: 2.1 * k, a: (0.04 + 0.2 * pg) * wh * al0, col: 'pink' }); } }
    GLM.halos(c, HL);
  }
  function draw(c, x, y, z, a, P, o) {
    o = o || {}; const V = mkView(x, y, z, o), R = rig(P); LAST = { V, R };
    const al0 = cl(P.alpha == null ? 1 : P.alpha); if (al0 < 0.01) return;
    if (glOn()) { try { glPass(c, V, P, o, R.list, al0, R.tent); halos(c, V, R, P, al0); return; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Belladonna: GL draw', e); } }
    drawFallback(c, V, R, P, al0); halos(c, V, R, P, al0 * 0.7);
  }
  /* the ring assembly alone, at a world point (Ring Blade, while it is away): P gives ringSpin, ringGlow, ring; o.axis its axis */
  function drawRing(c, x, y, z, P, o) {
    o = o || {}; const V = mkView(x, y, z, o), nz = o.axis ? vnrm(o.axis) : RING_N, Rr = mm(frameXZ(vsub([1, 0, 0], vmul(nz, nz[0])), nz), rotZ(P.ringSpin || 0)), rg = cl(P.ring == null ? 1 : P.ring);
    const list = [{ part: 'ring', o: [0, 0, 0], R: Rr, s: rg * RS, al: 1, ring: 1 }], al0 = cl(P.alpha == null ? 1 : P.alpha); if (al0 < 0.01) return;
    const RR = { list, A: { ring: [0, 0, 0], ringR: Rr } };
    if (glOn()) { try { glPass(c, V, P, o, list, al0); halos(c, V, RR, P, al0); return; } catch (e) { NOGL = true; } }
    drawFallback(c, V, RR, P, al0); halos(c, V, RR, P, al0 * 0.7);
  }
  function drawShadow(c, x, y, z, a, P, o) {
    o = o || {}; const T = o.T, k = T * (o.scale || 1) * VIS, al = cl(P.alpha == null ? 1 : P.alpha) * 0.3 * cl(P.bloom == null ? 1 : P.bloom + 0.2) / (1 + Math.max(0, z) * 0.22); if (al < 0.01) return;
    const X0 = o.sx(x), Y0 = o.sy(y); c.save(); c.globalAlpha = al; const g = c.createRadialGradient(X0, Y0, 0, X0, Y0, 2.6 * k); g.addColorStop(0, 'rgba(10,20,14,0.85)'); g.addColorStop(0.6, 'rgba(10,20,14,0.4)'); g.addColorStop(1, 'rgba(10,20,14,0)');
    c.translate(X0, Y0); c.scale(1, 0.42); c.translate(-X0, -Y0); c.fillStyle = g; c.beginPath(); c.arc(X0, Y0, 2.6 * k, 0, TAU); c.fill(); c.restore();
  }
  /* anchors: world { x, y, z } (game tiles; y on the game's ground) for the last draw */
  function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p || p.x) return null; return LAST.V.toW(p); }
  function anchorDir(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; return { x: p[0], y: p[1] * GY, z: p[2] }; }
  function anchorAt(name, x, y, z, P, o) { const R = rig(P), p = R.A[name]; if (!p || p.x) return null; const sc = ((o && o.scale) || 1) * VIS; return { x: x + p[0] * sc, y: y + p[1] * GY * sc, z: z + p[2] * sc }; }
  /* the model's own frame, for studio checks and the tests: every placed part and anchor of a pose */
  function rigOf(P) { return rig(P || blankPose()); }
  function blankPose() { return { alpha: 1, bloom: 1, leaves: 1, white: 1, tentG: 1, tentW: 1, ring: 1, ringSpin: 0, ringTilt: 0, ringGlow: 0.6, ringAway: 0, fold: 0, bank: 0, lean: 0, yaw: 0, sway: 0, accX: 0, accY: 0, glow: 0.35, brace: 0, spin: 0, flick: 0, bulb: 0, flutter: 0, floorZ: -1.2 }; }
  function create() { const P = blankPose(); return { pose: P, draw: (c, x, y, z, a, P2, o) => draw(c, x, y, z, a, P2 || P, o), drawShadow: (c, x, y, z, a, P2, o) => drawShadow(c, x, y, z, a, P2 || P, o), drawRing: (c, x, y, z, P2, o) => drawRing(c, x, y, z, P2 || P, o) }; }
  const SIZE = { flower: 2 * LP1 * VIS, leafSpan: 2 * (LLF + 0.35) * VIS, ringR: RING_R * VIS * RS, swordSpan: 2 * (RING_R + SWORD_L) * VIS * RS, hub: 0.6 * VIS, seat: SEAT.slice(), ringH: (RING_UP * Math.cos(TILT) + RING_Z + HUB[2]) * VIS, tentSpan: (() => { const R = rig(blankPose()); let m = 0; for (const cv of R.tent.g.concat(R.tent.w)) for (const p of cv) m = Math.max(m, Math.abs(p[0])); return 2 * m * VIS; })() };   // (tiles; seat stays in the flower's own frame)
  return { create, warm: () => { glOn(); return true; }, warmIdle: () => { glOn(); }, warmPlan: () => ({ pending: 0, total: 0 }), ready: () => true, draw, drawRing, drawShadow, anchor, anchorDir, anchorAt, rigOf, blankPose, COUNTS, SIZE, PARTS,
    get gl() { return glOn(); }, get stats() { return { ms: GLMS, n: GLN, meshMs: MESH_MS }; }, __dbg: { get MESH() { return MESH; } }, TUNE: { TILT, HUB, RING_R, SWORD_L, NSEG } };
})();
