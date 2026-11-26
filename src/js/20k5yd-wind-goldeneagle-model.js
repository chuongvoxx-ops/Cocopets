/* ---------- (v451 GE) GOLDEN EAGLE: the eagle itself (Wind's six-star summon Ultimate; the move is 20k5ye) ----------
   An original eagle, built for the user's brief: a proud head (a heavy brow over the eyes, golden hackles lifted at the nape), a
   hooked ivory beak on a gold cere, bright emerald eyes, a deep muscular chest, feathered legs ending in strong open talons, and
   exceptionally broad wings. Its plumage runs from pale gold at the chest to deep bronze along the wing roots; the longest flight
   feathers carry luminous champagne edges; jade and mint air currents stream between the feather layers.
   The model (tiles; z up from the floor; x east, y south; drawn with the game's camera: the floor squashed by GY 0.55, heights by
   ZK = sqrt(1 - GY^2), as Snake Flame's): a bird frame (x forward, y its left, z up) posed by yaw, pitch and roll, at a scale.
   - the body: one lofted torso and neck (deep chest, tapering to the tail), its scapulars and tail coverts as feather cards on it;
   - the head (its own part, turned on the neck): a lofted skull, brow ridges, the nape's hackles, the cere and the hooked upper
     mandible; the lower mandible hinged; two eyes (their own part: an emerald iris, a round pupil);
   - the legs: feathered thighs and tarsi, four scaled toes a foot, curved dark talons (one mesh, mirrored);
   - the tail: ten rectrices (one feather mesh, instanced, fanned);
   - each wing a rig of three bones (shoulder -> elbow -> wrist -> the hand's tip) with its feather groups: on the humerus the
     marginal coverts and the tertials; on the forearm three rows of coverts over eleven secondaries; on the hand the primary
     coverts and the alula (one mesh a bone, rigid with it, so the groups overlap as the joints fold); ten primaries instanced
     on the hand, each turned on its own root, so they fan, fold and separate at the tips (the outer six emarginated: distinct
     fingers), their tips curling up under the air's load; thin air-current sheets between the layers (see-through). The right
     wing is the left one mirrored (its own pose: banking can differ).
   Rig: rig(P) poses it (the move's choreography: 20k5ye) and returns the parts and anchors (eyes, beak, chest, wing tips, the
   trailing edges, the shadow's points). Wing poses are named in WP (rest, glide, fold, top, bottom, mid, widest) and blended.
   Drawing: GLM when usable (one pass; materials 500..504, the GE-MAT block in 20k5uz), sized to its on-screen box, cut to the
   canvas, held under the visual quality's pixel budget, its GL canvas kept. Without WebGL (or on a software rasteriser unless
   window.__GE_GL = 1; __GE_GL = 0 forces it off) a painted eagle from the same rig (simpler; never broken).
   Meshes are built in idle-time slices (warm), uploaded once, reused by every cast on a stage; release() frees the GPU buffers
   (the stage's end: a hook in 20b), and they upload again on the next draw. */
const GOLDEAGLE_GL = (() => {
  const TAU = Math.PI * 2;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  /* ---- vectors, rotations (a rotation: its three columns x, y, z) ---- */
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const M3 = (x, y, z) => ({ x, y, z }), ID = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  const colsK = (R, k) => M3(vmul(R.x, k), vmul(R.y, k), vmul(R.z, k));
  const REF = v => [v[0], -v[1], v[2]], refM = R => M3(REF(R.x), REF(R.y), REF(R.z));   // (the right side: the left mirrored across the bird's midplane)
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  /* ---- the camera (the game's floor squash) and the light ---- */
  const GY = 0.55, ZK = Math.sqrt(1 - GY * GY), PX = [1, 0, 0], PY = [0, GY, -ZK], PD = [0, ZK, GY], UPW = [0, 0, 1];
  const LW = vnrm([-0.5, 0.45, 0.74]), SBW = vnrm([-0.3, 0.25, 0.92]), RIMW = vnrm([0.6, -0.62, 0.42]);
  const RIMC = [0.62, 1.32, 1.0], AMBC = [1.04, 1.0, 0.93], OUTC = [0.075, 0.045, 0.02], GLCAP = 1700;   // (a jade-mint rim: the wind's light on its edges)
  /* ---- the materials (20k5uz GE-MAT; variants below .5: GLM rounds the id) ---- */
  const M_PRI = 500, M_SEC = 500.1, M_TER = 500.2, M_REC = 500.3, M_COV = 500.4, M_BODY = 501, M_HEAD = 501.1, M_HACK = 501.2, M_TROU = 501.3, M_BROW = 501.4;
  const M_BEAK = 502, M_CERE = 502.1, M_CLAW = 502.2, M_GAPE = 502.3, M_EYE = 503, M_AIR = 504;
  /* ---- the skeleton (bird units: the move scales it) ---- */
  const DIM = { Lh: 0.8, Lf: 1.0, Lp: 0.7, S: [0.16, 0.33, 0.2], N: [0.98, 0, 0.3], hip: [-0.04, 0.19, -0.3], TB: [-0.9, 0, 0.04] };
  const NPR = 10, NRE = 10;
  // the primaries, inner (P1) to outer (P10): length, the outer vane's width, the inner's, the emargination (0: none) of each vane
  const PRI = [[1.12, 0.05, 0.12, 0, 0], [1.2, 0.05, 0.12, 0, 0], [1.28, 0.05, 0.125, 0, 0], [1.36, 0.048, 0.125, 0, 0.72], [1.46, 0.046, 0.12, 0.66, 0.66],
    [1.55, 0.044, 0.118, 0.6, 0.62], [1.6, 0.042, 0.115, 0.56, 0.58], [1.6, 0.04, 0.11, 0.52, 0.55], [1.52, 0.038, 0.1, 0.5, 0.52], [1.32, 0.034, 0.085, 0.46, 0.5]];
  const primRoot = i => [0.06 + 0.86 * (i / (NPR - 1)) * DIM.Lp, 0.06, 0.012 * (i / (NPR - 1))];   // (outer ones a little higher: crisp fingers on top)
  // their fan: the angle back from the hand's line, spread (fan 1) and folded (fan 0)
  const betaS = i => lerp(1.34, 0.05, Math.pow(i / (NPR - 1), 0.85)), betaF = i => 0.1 + 0.025 * (NPR - 1 - i);

  /* ================= meshes ================= */
  const DQ = () => (lowFx() ? 0.65 : 1), qn = n => Math.max(3, Math.round(n * DQ()));
  function bsph(m) { let cx = 0, cy = 0, cz = 0; const n = m.nv; for (let i = 0; i < n; i++) { cx += m.pos[i * 3]; cy += m.pos[i * 3 + 1]; cz += m.pos[i * 3 + 2]; } cx /= n; cy /= n; cz /= n; let r = 0; for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(m.pos[i * 3] - cx, m.pos[i * 3 + 1] - cy, m.pos[i * 3 + 2] - cz)); m.bs = [cx, cy, cz, r]; return m; }
  /* a feather card in the builder's current frame: its root at o.root, pointing at angle o.th in the x-y plane (0: +x), o.len long;
     the outer vane o.wo wide (toward the leading side), the inner o.wi; o.e0, o.e1 the emargination of each vane (where the vane
     narrows: a distinct finger); o.tip the rounding; o.cam its camber, o.droop the drop along it (shingled), o.lift its tilt about
     its own axis; vA.y the place along it (0 the quill .. 1 the tip), vA.z the card's index + its place across (0 the leading
     edge .. 1 the trailing; the rachis at wo / (wo + wi)) */
  function card(B, o) {
    const len = o.len, wo = o.wo, wi = o.wi, th = o.th || 0, dx = Math.cos(th), dy = Math.sin(th), px = -dy, py = dx, r = o.root || [0, 0, 0], ci = o.ci || 0;
    const e0 = o.e0 || 0, e1 = o.e1 || 0, tip = o.tip == null ? 0.78 : o.tip, cam = o.cam == null ? 0.18 : o.cam, dr = o.droop || 0, lift = o.lift || 0, bow = o.bow == null ? 0.02 : o.bow, cl0 = Math.cos(lift), sl0 = Math.sin(lift);
    const shape = u => { let s = Math.sqrt(sstep(0, 0.1, u)) * 0.85 + 0.15; if (u > tip) { const q = (u - tip) / (1 - tip); s *= Math.sqrt(Math.max(0, 1 - q * q)); } return s; };
    const wOut = u => wo * shape(u) * (e0 ? lerp(1, 0.42, sstep(e0 - 0.05, e0 + 0.05, u)) : 1), wIn = u => wi * shape(u) * (e1 ? lerp(1, 0.5, sstep(e1 - 0.06, e1 + 0.05, u)) : 1);
    const wm = Math.max(wo, wi);
    B.surf((u, v) => { const a = lerp(-wOut(u), wIn(u), v), fx = u * len, z0 = -cam * a * a / Math.max(1e-3, wm) * 0.5 + dr * fx + bow * len * Math.sin(Math.PI * u), ya = a * cl0, za = z0 * cl0 + a * sl0;
      return [r[0] + dx * fx + px * ya, r[1] + dy * fx + py * ya, r[2] + za]; }, qn(o.nu || 8), o.nv || 3, () => o.m, { e: u => u, a: (u, v) => ci + Math.min(0.999, v) });
  }
  /* a soft roll of plumage along x (a bone's leading edge): x0..x1, radius r(u), flattened by fz, offset (y, z); vA.y along, vA.z round */
  function roll(B, x0, x1, r, m, o) { o = o || {}; const yo = o.y || 0, zo = o.z || 0, fz = o.fz || 0.7, ci = o.ci || 0;
    B.surf((u, v) => { const a = v * TAU, rr = r(u) * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.35); return [lerp(x0, x1, u), yo + Math.cos(a) * rr, zo + Math.sin(a) * rr * fz]; }, qn(o.nu || 8), qn(o.nv || 10), () => m, { e: u => 0.3 + 0.3 * u, a: () => ci + 0.78 }); }
  /* a soft puff of plumage over a joint (the same shading as a covert's middle: no seams) */
  function puff(B, c, rx, ry, rz, m) { B.surf((u, v) => { const th = u * Math.PI, ph = v * TAU; return [c[0] + rx * Math.sin(th) * Math.cos(ph), c[1] + ry * Math.sin(th) * Math.sin(ph), c[2] + rz * Math.cos(th)]; }, qn(6), qn(10), () => m, { e: () => 0.45, a: () => 70.78 }); }
  /* the body: a lofted torso and neck (x from the tail's root to the head's joint); vA.y along it (0 the tail .. 1 the neck), vA.z
     round it (0 the back's top .. 0.5 the belly .. 1); scapulars and tail coverts on it */
  const BP = [[-0.96, 0.12, 0.07, 0.06, 0.0], [-0.72, 0.26, 0.15, 0.17, 0.0], [-0.38, 0.39, 0.24, 0.35, 0.0], [-0.02, 0.46, 0.3, 0.45, 0.0], [0.3, 0.47, 0.32, 0.45, 0.02], [0.56, 0.4, 0.31, 0.34, 0.07], [0.78, 0.27, 0.28, 0.18, 0.16], [1.02, 0.19, 0.24, 0.12, 0.3]];
  const bp = x => { let i = 0; while (i < BP.length - 2 && BP[i + 1][0] < x) i++; const a = BP[i], b = BP[i + 1], u = sstep(a[0], b[0], x) * 0.5 + cl((x - a[0]) / (b[0] - a[0])) * 0.5; return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u), lerp(a[4], b[4], u)]; };
  function bodyMesh() {
    const B = GLM.builder(DQ()), X0 = BP[0][0], X1 = BP[BP.length - 1][0];
    B.surf((u, v) => { const x = lerp(X0, X1, u), [w, ht, hb, zc] = bp(x), a = v * TAU, ca = Math.cos(a), sa = Math.sin(a); return [x, w * sa, zc + (ca >= 0 ? ht : hb) * ca]; }, qn(22), qn(26), () => M_BODY, { e: u => u, a: (u, v) => Math.min(0.999, v) });
    B.ell([X0 + 0.01, 0, 0], [0.06, 0.12, 0.07], M_BODY, { seg: qn(10), rings: 4 });
    // the scapulars: bronze cards over each shoulder, bridging the wing's root to the back
    for (const sg of [1, -1]) for (let i = 0; i < 6; i++) { const x = 0.34 - i * 0.13, y = sg * (0.2 + 0.05 * Math.sin(i * 1.3)), z = 0.3 - 0.01 * i;
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [x, y, z]); card(B, { root: [0, 0, 0], th: Math.PI + sg * (0.55 - 0.04 * i), len: 0.34 + 0.03 * i, wo: 0.07, wi: 0.09, cam: 0.12, droop: -0.18, m: M_COV, ci: 20 + i + (sg > 0 ? 0 : 8), tip: 0.6, nu: 6, nv: 2 }); B.pop(); }
    // the upper tail coverts (over the rectrices' roots) and the under tail coverts
    for (let i = 0; i < 7; i++) { const y = (i - 3) * 0.06; card(B, { root: [-0.7, y, 0.12], th: Math.PI + (i - 3) * 0.12, len: 0.48, wo: 0.07, wi: 0.08, cam: 0.1, droop: -0.12, m: M_COV, ci: 40 + i, tip: 0.6, nu: 6, nv: 2 });
      card(B, { root: [-0.68, y, -0.12], th: Math.PI + (i - 3) * 0.1, len: 0.4, wo: 0.07, wi: 0.08, cam: -0.1, droop: 0.04, m: M_BODY, ci: 0, tip: 0.6, nu: 5, nv: 2 }); }
    // the neck's ruff: hackles lying back over the joint (golden)
    for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.6;
      B.push([1, 0, 0], [0, Math.cos(a), Math.sin(a)], [0, -Math.sin(a), Math.cos(a)], [0.9, 0, 0.3]); card(B, { root: [0, 0, 0.23], th: Math.PI, len: 0.36, wo: 0.05, wi: 0.05, cam: 0.05, droop: -0.1, m: M_HACK, ci: i, tip: 0.45, nu: 5, nv: 2 }); B.pop(); }
    return bsph(B.done());
  }
  /* the head (its frame at the neck's joint: x forward, z up); the hooked upper mandible on a gold cere */
  const HDP = [[-0.17, 0.16, 0.19, 0.16, 0.06], [-0.04, 0.21, 0.25, 0.2, 0.06], [0.1, 0.22, 0.25, 0.18, 0.06], [0.24, 0.19, 0.2, 0.13, 0.05], [0.34, 0.13, 0.14, 0.09, 0.04], [0.4, 0.09, 0.1, 0.06, 0.035]];
  const hdp = x => { let i = 0; while (i < HDP.length - 2 && HDP[i + 1][0] < x) i++; const a = HDP[i], b = HDP[i + 1], u = cl((x - a[0]) / (b[0] - a[0])), s = u * u * (3 - 2 * u) * 0.5 + u * 0.5; return [lerp(a[1], b[1], s), lerp(a[2], b[2], s), lerp(a[3], b[3], s), lerp(a[4], b[4], s)]; };
  // the beak's culmen: its centreline from the cere to the hook's point (x, z), and its half width
  const BKC = [[0.36, 0.06], [0.45, 0.055], [0.52, 0.03], [0.575, -0.01], [0.605, -0.06], [0.612, -0.11], [0.596, -0.152]], BKW = [0.088, 0.075, 0.062, 0.048, 0.033, 0.018, 0.004];
  function beakAt(s) { const f = s * (BKC.length - 1), i = Math.min(BKC.length - 2, Math.floor(f)), u = f - i, a = BKC[i], b = BKC[i + 1]; return { x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), w: lerp(BKW[i], BKW[i + 1], u), tx: b[0] - a[0], tz: b[1] - a[1] }; }
  function headMesh() {
    const B = GLM.builder(DQ()), X0 = HDP[0][0], X1 = HDP[HDP.length - 1][0];
    B.surf((u, v) => { const x = lerp(X0, X1, u), [w, ht, hb, zc] = hdp(x), a = v * TAU, ca = Math.cos(a), sa = Math.sin(a), fl = 1 - 0.12 * Math.pow(Math.abs(sa), 6) * sstep(0.05, 0.3, x);   // (the face a little flat at the cheeks)
      return [x, w * sa * fl, zc + (ca >= 0 ? ht : hb) * ca]; }, qn(16), qn(22), () => M_HEAD, { e: u => u, a: (u, v) => Math.min(0.999, v) });
    B.ell([X0 + 0.01, 0, 0.06], [0.08, 0.16, 0.18], M_HEAD, { seg: qn(14), rings: 6, th0: 0, th1: Math.PI });
    // the upper mandible: lofted along the culmen, a rounded top, a flatter cutting edge below
    B.surf((u, v) => { const b = beakAt(u), tl = Math.hypot(b.tx, b.tz) || 1, nx = -b.tz / tl, nz = b.tx / tl, a = v * TAU, ca = Math.cos(a), sa = Math.sin(a), r = (ca >= 0 ? 0.95 : 0.4) * b.w * ca; return [b.x + nx * r - 0.012, b.w * sa, b.z + nz * r]; }, qn(14), qn(12), () => M_BEAK, { e: u => u, a: (u, v) => Math.min(0.999, v) });
    // the cere (a gold band round the beak's root), the nostrils
    B.surf((u, v) => { const a = v * TAU, x = lerp(0.325, 0.385, u), w = 0.1 - 0.02 * u; return [x, w * Math.sin(a), 0.045 + w * 0.75 * Math.cos(a)]; }, 3, qn(14), () => M_CERE, { e: u => u, a: () => 0.5 });
    for (const sg of [1, -1]) B.ell([0.39, sg * 0.05, 0.075], [0.018, 0.008, 0.011], M_GAPE, { seg: 6, rings: 3 });
    // the brow ridges: a heavy shelf over each eye, raked forward (the proud, fierce look)
    for (const sg of [1, -1]) { B.push(vnrm([1, -sg * 0.18, -0.16]), vnrm([sg * 0.18, 1, 0]), [0, 0, 1], [0.255, sg * 0.125, 0.14]); B.box([0, 0, 0], [0.1, 0.045, 0.028], 0.022, M_BROW); B.pop(); }
    // the nape's hackles: lanceolate golden feathers lifted at the back of the crown
    for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.2, ca = Math.cos(a), sa = Math.sin(a);
      B.push([1, 0, 0], [0, ca, sa], [0, -sa, ca], [-0.06, 0, 0.06]); card(B, { root: [0.04, 0, 0.19], th: Math.PI, len: 0.3 + 0.04 * (1 - Math.abs(i - 3) / 3), wo: 0.04, wi: 0.04, cam: 0.04, droop: 0.12, lift: 0, m: M_HACK, ci: 10 + i, tip: 0.35, nu: 5, nv: 2 }); B.pop(); }
    return bsph(B.done());
  }
  /* the lower mandible: hinged at the head frame's [0.33, 0, 0.0] */
  function jawMesh() { const B = GLM.builder(DQ());
    B.surf((u, v) => { const x = u * 0.24, w = 0.072 * (1 - 0.75 * u), a = v * TAU, ca = Math.cos(a), sa = Math.sin(a), zc = -0.012 - 0.05 * u * u; return [x, w * sa, zc + (ca >= 0 ? 0.012 : 0.03) * ca]; }, qn(8), qn(10), () => M_BEAK, { e: u => 0.3 + 0.4 * u, a: () => 0.5 });
    B.surf((u, v) => [u * 0.22, (v - 0.5) * 0.12 * (1 - 0.7 * u), -0.004], 4, 2, () => M_GAPE, {});
    return bsph(B.done()); }
  function eyeMesh() { const B = GLM.builder(DQ()); B.sph([0, 0, 0], 0.066, M_EYE, qn(16)); return bsph(B.done()); }
  /* a leg (the left; its frame at the hip, x forward, z up): feathered thigh and tarsus, four scaled toes, curved dark talons */
  function legMesh() {
    const B = GLM.builder(DQ()), K = [0.06, 0, -0.34], A = [0.15, 0, -0.66];
    B.surf((u, v) => { const a = v * TAU, r = lerp(0.16, 0.1, u) * (1 + 0.08 * Math.sin(a * 5 + u * 3)); return [lerp(0, K[0], u) + Math.cos(a) * r * 0.9, Math.sin(a) * r, lerp(0.02, K[2], u)]; }, qn(6), qn(14), () => M_TROU, { e: u => u * 0.5, a: (u, v) => Math.min(0.999, v) });
    B.surf((u, v) => { const a = v * TAU, r = lerp(0.085, 0.055, u); return [lerp(K[0], A[0], u) + Math.cos(a) * r, Math.sin(a) * r, lerp(K[2], A[2], u)]; }, qn(5), qn(12), () => M_TROU, { e: u => 0.5 + u * 0.5, a: (u, v) => Math.min(0.999, v) });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; B.push([Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1], [K[0], 0, K[2] + 0.04]); card(B, { root: [0.08, 0, 0], th: 0, len: 0.16, wo: 0.04, wi: 0.04, cam: 0.05, droop: -1.4, m: M_TROU, ci: 0, tip: 0.5, nu: 4, nv: 2 }); B.pop(); }   // (the trousers' fringe)
    // the toes: three forward, spread; the hallux back; each two joints and a talon curling down
    const toe = (ang, L1, L2, rT, tk) => { const d = [Math.cos(ang), Math.sin(ang)], p0 = A, p1 = [A[0] + d[0] * L1, A[1] + d[1] * L1, A[2] - 0.03], p2 = [p1[0] + d[0] * L2, p1[1] + d[1] * L2, p1[2] - 0.035];
      B.tube(p0, p1, 0.04, 0.034, M_CERE, { seg: qn(8), cap0: 'round', cap1: 'round' }); B.tube(p1, p2, 0.034, 0.028, M_CERE, { seg: qn(8), cap1: 'round' });
      let q = p2, dir = [d[0], d[1], -0.2]; for (let k = 0; k < 3; k++) { const dn = vnrm([dir[0], dir[1], dir[2] - 0.75 * (k + 1)]), q2 = vadd(q, vmul(dn, tk * (0.45 - 0.08 * k))); B.tube(q, q2, rT * (1 - 0.3 * k), rT * (0.7 - 0.3 * k) + 0.002, M_CLAW, { seg: qn(7), cap0: 'round' }); q = q2; dir = dn; } };
    toe(-0.42, 0.13, 0.1, 0.026, 0.2); toe(0.0, 0.15, 0.12, 0.028, 0.21); toe(0.42, 0.13, 0.1, 0.026, 0.2); toe(Math.PI, 0.1, 0.07, 0.032, 0.25);
    return bsph(B.done());
  }
  /* the wing's bone groups (the left wing; each in its bone's frame: x along the bone from its joint, y back toward the trailing
     edge, z up). The humerus: its leading roll, two rows of marginal coverts, the tertials */
  function wHMesh() { const B = GLM.builder(DQ()), L = DIM.Lh;
    roll(B, -0.05, L + 0.05, u => 0.13 - 0.02 * u + 0.03 * Math.sin(Math.PI * u), M_COV, { y: -0.02, z: 0.01, fz: 0.62, ci: 60, nu: 7 });
    puff(B, [L, 0.02, 0.0], 0.12, 0.13, 0.075, M_COV);   // (the elbow's plumage, so the joint never opens)
    for (let i = 0; i < 9; i++) { const x = (i + 0.2) / 8.6 * L; card(B, { root: [x, -0.13, 0.115], th: 1.62, len: 0.24, wo: 0.07, wi: 0.07, cam: 0.2, droop: -0.2, m: M_COV, ci: 50 + i, tip: 0.5, nu: 4, nv: 2 }); }   // (the marginal coverts over the leading edge's roll)
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const x = (i + 0.5 * r) / 6 * L; card(B, { root: [x, 0.02 + r * 0.1, 0.07 - r * 0.02], th: 1.75 - 0.12 * r, len: 0.24 + 0.07 * r, wo: 0.07, wi: 0.07, cam: 0.12, droop: -0.12, m: M_COV, ci: r * 10 + i, tip: 0.55, nu: 5, nv: 2 }); }
    for (let i = 0; i < 6; i++) { const x = (i + 0.3) / 6 * L; card(B, { root: [x, 0.2, 0.03], th: 1.68, len: 0.4, wo: 0.08, wi: 0.09, cam: 0.12, droop: -0.1, m: M_COV, ci: 30 + i, tip: 0.6, nu: 5, nv: 2 }); }
    for (let i = 0; i < 6; i++) { const x = 0.08 + i * 0.15; card(B, { root: [x, 0.24, -0.005 + 0.004 * i], th: 1.78 - 0.05 * i, len: 0.9 + 0.04 * i, wo: 0.1, wi: 0.15, cam: 0.16, droop: -0.03, m: M_TER, ci: i, tip: 0.72, nu: 8, nv: 3 }); }   // (the tertials: the last one reaching past the elbow, so the trailing edge never opens there)
    return bsph(B.done()); }
  /* the forearm: its roll, the lesser, median and greater coverts over eleven secondaries (each card its own: overlapping rows) */
  function wFMesh() { const B = GLM.builder(DQ()), L = DIM.Lf;
    roll(B, -0.05, L + 0.04, u => 0.11 - 0.035 * u, M_COV, { y: -0.03, z: 0.02, fz: 0.6, ci: 61, nu: 7 });
    puff(B, [L, 0.0, 0.01], 0.09, 0.1, 0.06, M_COV);   // (the wrist's plumage)
    for (let i = 0; i < 10; i++) { const x = (i + 0.2) / 9.6 * L; card(B, { root: [x, -0.12, 0.1], th: 1.6, len: 0.21, wo: 0.06, wi: 0.06, cam: 0.2, droop: -0.2, m: M_COV, ci: 50 + i, tip: 0.5, nu: 4, nv: 2 }); }
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const x = (i + 0.5 * r + 0.2) / 8 * L; card(B, { root: [x, 0.0 + r * 0.08, 0.075 - r * 0.015], th: 1.62, len: 0.2 + 0.06 * r, wo: 0.06, wi: 0.06, cam: 0.12, droop: -0.12, m: M_COV, ci: r * 10 + i, tip: 0.55, nu: 5, nv: 2 }); }
    for (let i = 0; i < 9; i++) { const x = (i + 0.4) / 9 * L; card(B, { root: [x, 0.16, 0.05], th: 1.6, len: 0.3, wo: 0.065, wi: 0.075, cam: 0.12, droop: -0.1, m: M_COV, ci: 20 + i, tip: 0.6, nu: 5, nv: 2 }); }
    for (let i = 0; i < 11; i++) { const x = (i + 0.35) / 11 * L; card(B, { root: [x, 0.28, 0.028], th: 1.6, len: 0.46, wo: 0.075, wi: 0.085, cam: 0.14, droop: -0.07, m: M_COV, ci: 30 + i, tip: 0.65, nu: 6, nv: 2 }); }
    for (let i = 0; i < 11; i++) { const x = -0.07 + i / 10 * (L - 0.02); card(B, { root: [x, 0.3, -0.004 * i], th: 1.64 - 0.012 * i, len: 1.04 + 0.08 * Math.sin(i / 10 * Math.PI) - 0.04 * (i / 10), wo: 0.07, wi: 0.11, cam: 0.16, droop: -0.02, m: M_SEC, ci: i, tip: 0.86, nu: 8, nv: 3 }); }
    return bsph(B.done()); }
  /* the hand: its roll, the primary coverts, the alula */
  function wPMesh() { const B = GLM.builder(DQ()), L = DIM.Lp;
    roll(B, -0.04, L + 0.02, u => 0.075 - 0.04 * u, M_COV, { y: -0.01, z: 0.02, fz: 0.6, ci: 62, nu: 6 });
    for (let i = 0; i < 6; i++) { const x = (i + 0.3) / 6 * L * 0.9; card(B, { root: [x, 0.0, 0.06], th: 1.2 - 0.12 * i, len: 0.18, wo: 0.05, wi: 0.05, cam: 0.12, droop: -0.12, m: M_COV, ci: i, tip: 0.55, nu: 4, nv: 2 }); }
    for (let i = 0; i < 10; i++) { const x = 0.04 + i / 9 * L * 0.92; card(B, { root: [x, 0.06, 0.035 - 0.002 * i], th: lerp(1.15, 0.3, i / 9), len: 0.42 - 0.08 * (i / 9), wo: 0.055, wi: 0.075, cam: 0.14, droop: -0.07, m: M_COV, ci: 20 + i, tip: 0.65, nu: 6, nv: 2 }); }
    for (let i = 0; i < 3; i++) card(B, { root: [0.02, -0.04, 0.07 + 0.006 * i], th: -0.35 + 0.2 * i, len: 0.32 - 0.05 * i, wo: 0.03, wi: 0.06, cam: 0.1, droop: -0.05, m: M_SEC, ci: 30 + i, tip: 0.7, nu: 5, nv: 2 });   // (the alula)
    return bsph(B.done()); }
  /* a primary (its frame at its quill: x along it) */
  function primMesh(i) { const B = GLM.builder(DQ()), p = PRI[i]; card(B, { root: [0, 0, 0], th: 0, len: p[0], wo: p[1], wi: p[2], e0: p[3], e1: p[4], cam: 0.2, droop: 0, bow: 0.015, m: M_PRI, ci: i, tip: 0.84, nu: 12, nv: 4 }); return bsph(B.done()); }
  function rectMesh() { const B = GLM.builder(DQ()); card(B, { root: [0, 0, 0], th: 0, len: 1.02, wo: 0.095, wi: 0.115, cam: 0.16, droop: 0, bow: 0.01, m: M_REC, ci: 0, tip: 0.82, nu: 10, nv: 3 }); return bsph(B.done()); }
  /* the air currents between the layers (see-through, emissive: GE-MAT 504): vA.y downstream, vA.z across */
  function airMesh(x0, x1, y0, y1, z, wav) { const B = GLM.builder(DQ());
    B.surf((u, v) => [lerp(x0, x1, v), lerp(y0, y1, u), z + wav * Math.sin(u * 5 + v * 3)], qn(8), qn(10), () => M_AIR, { e: u => u, a: (u, v) => Math.min(0.999, v) });
    return bsph(B.done()); }
  /* the build, a generator so the idle time can do it a piece at a time */
  let SH = null, BUILDING = null;
  function* gen() {
    const M = {}; M.body = bodyMesh(); yield; M.head = headMesh(); M.jaw = jawMesh(); M.eye = eyeMesh(); yield; M.leg = legMesh(); M.rect = rectMesh(); yield;
    M.wH = wHMesh(); yield; M.wF = wFMesh(); yield; M.wP = wPMesh(); for (let i = 0; i < NPR; i++) { M['p' + i] = primMesh(i); if (i % 4 === 3) yield; }
    M.airF = airMesh(0.05, DIM.Lf - 0.05, 0.36, 1.05, 0.012, 0.01); M.airP = airMesh(0.02, DIM.Lp, 0.12, 0.62, 0.024, 0.008); M.airT = airMesh(-0.2, 0.2, 0.0, 0.85, 0.02, 0.01);
    SH = M; }
  function step(ms) { if (SH) return true; if (typeof GLM === 'undefined') return false; BUILDING = BUILDING || gen(); const until = nowMs() + ms; while (!SH && nowMs() < until) BUILDING.next(); return !!SH; }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0, UP = false;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Golden Eagle GL: ' + String(e && e.message || e)); } catch (e2) {} };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__GE_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && flag('__GE_GL') !== 1) return false;
    return true;
  }
  /* (idle time) the meshes built, then one tiny pass that uploads them and compiles the shader's branches */
  let IDLE = 0;
  function warm() {
    if (!usable()) return false; if ((SH && UP) || IDLE) return true; IDLE = 1;
    const go = () => { const run = ms => { try { if (!step(ms)) return go(); if (!UP) upload(); } catch (e) { fail(e); } IDLE = 0; };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => run(dl.didTimeout ? 3 : Math.max(1, Math.min(8, dl.timeRemaining() - 1))), { timeout: 200 }); else setTimeout(() => run(3), 30); };
    go(); return true;
  }
  function upload() { if (UP || !SH || !GLM.ok()) return; const items = [], z = new Float32Array([0.001, 0, 0]), y = new Float32Array([0, 0.001, 0]), x = new Float32Array([0, 0, 0.001]);
    for (const k in SH) items.push({ mesh: SH[k], R0: z, R1: y, R2: x, T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 1 });
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); UP = true; }
  /* the meshes for a cast, made now if the idle time has not (false: draw the painted eagle) */
  function ensure() { if (!usable()) return false; if (!SH) { try { step(1e9); } catch (e) { fail(e); return false; } } return !!SH; }
  /* free every GPU buffer (the meshes stay: they upload again when next drawn) */
  function release() { let n = 0; if (SH) for (const k in SH) { const m = SH[k]; if (m.gl) { n++; if (typeof GLM !== 'undefined' && GLM.free) GLM.free(m); else m.gl = null; } } UP = false; return n; }
  const gpuCount = () => { let n = 0; if (SH) for (const k in SH) if (SH[k].gl) n++; return n; };

  /* ================= the rig ================= */
  /* named wing poses: elev (the shoulder's lift: + up), sweep (+ back), twist (+ the leading edge down), elbow and wrist (their
     flexion: 0 straight), bend (the hand's dihedral: + the tip up), fan (the primaries' spread: 0 folded .. 1 spread, past 1
     splayed), curl (the primaries' tips lifting under load) */
  const WP = {
    rest: { elev: 0.05, sweep: 0.05, twist: 0, elbow: 0.25, wrist: 0.2, bend: 0.05, fan: 1, curl: 0.1 },
    glide: { elev: 0.12, sweep: 0.42, twist: 0.05, elbow: 0.75, wrist: 0.75, bend: 0.12, fan: 0.55, curl: 0.15 },
    fold: { elev: 0.1, sweep: 1.35, twist: 0.1, elbow: 2.55, wrist: 2.75, bend: 0, fan: 0, curl: 0 },
    top: { elev: 1.02, sweep: 0.1, twist: -0.3, elbow: 0.35, wrist: 0.25, bend: -0.1, fan: 0.92, curl: -0.05 },
    bottom: { elev: -0.78, sweep: -0.05, twist: 0.25, elbow: 0.2, wrist: 0.05, bend: 0.2, fan: 0.95, curl: 0.25 },
    mid: { elev: 0.05, sweep: 0.25, twist: -0.45, elbow: 1.15, wrist: 1.35, bend: 0.15, fan: 0.45, curl: 0 },
    widest: { elev: 0.42, sweep: -0.08, twist: 0.0, elbow: 0.0, wrist: -0.06, bend: 0.12, fan: 1.14, curl: 0.06 },
  };
  const WK = ['elev', 'sweep', 'twist', 'elbow', 'wrist', 'bend', 'fan', 'curl'];
  function wmix(a, b, u, out) { out = out || {}; for (const k of WK) out[k] = lerp(a[k], b[k], u); return out; }
  /* the left wing's joints in the bird frame */
  function wingFrames(w) {
    const B0 = M3([0, 1, 0], [-1, 0, 0], [0, 0, 1]), RH = mm(rotZ(w.sweep), mm(rotX(w.elev), mm(B0, rotX(w.twist)))), RF = mm(RH, rotZ(-w.elbow)), RP = mm(RF, mm(rotZ(w.wrist), rotY(-w.bend)));
    const S = DIM.S, E = vadd(S, mv(RH, [DIM.Lh, 0, 0])), Wr = vadd(E, mv(RF, [DIM.Lf, 0, 0]));
    return { RH, RF, RP, S, E, Wr };
  }
  const primBeta = (i, fan) => Math.max(-0.08, lerp(betaF(i), betaS(i), fan) + (fan > 1 ? (fan - 1) * 0.35 * (0.5 - i / (NPR - 1)) : 0));
  /* P: { x, y, z (the body's centre, tiles, from the drawing origin), yaw, pitch (+ the nose up), roll (+ the left wing up), sc,
     wing (a pose), wingR (the right's, else the same), tail { fan, pitch }, head { yaw, pitch }, leg (the legs' swing forward),
     jaw 0..1, glow (the air currents), glow2 (a pulse of light), spill (the dissolve 0..1), t, k (tier), fade(p) -> 0..1 }.
     Returns { inst, A (anchors, world), sh (the shadow's points: { p, r }), d2 (the painted eagle's outline points) } */
  function rig(P) {
    const out = { inst: [], A: {}, sh: [], d2: { wings: [] } }, sc = P.sc || 1, t = P.t || 0, low = lowFx(), k = P.k | 0;
    const Bw = mm(rotZ(P.yaw || 0), mm(rotY(-(P.pitch || 0)), rotX(P.roll || 0))), O = [P.x || 0, P.y || 0, P.z || 0];
    const W = p => vadd(O, mv(Bw, vmul(p, sc))), WR = R => colsK(mm(Bw, R), sc);
    const base = { glow: P.glow == null ? 1 : P.glow, glow2: P.glow2 || 0, spill: P.spill || 0, kind: k };
    const fade = p => (P.fade ? P.fade(p) : 1);
    const I = (part, Rb, ob, ex) => { const o = W(ob), it = Object.assign({ part, R: WR(Rb), o, al: 1, wear: 0.5, outline: true }, base, ex); it.al = Math.min(it.al, fade(o)); out.inst.push(it); return it; };
    /* the body, the head, the jaw, the eyes */
    I('body', ID, [0, 0, 0], { wear: 0.13 });
    const hd = P.head || {}, Rh = mm(rotZ(hd.yaw || 0), rotY(-(hd.pitch || 0))), N = DIM.N, HQ = q => vadd(N, mv(Rh, q));
    I('head', Rh, N, { wear: 0.29 });
    I('jaw', mm(Rh, rotY(0.55 * cl(P.jaw || 0))), HQ([0.33, 0, 0.0]), { wear: 0.41 });
    for (const sg of [1, -1]) I('eye', mm(Rh, rotZ(sg * 0.95)), HQ([0.245, sg * 0.13, 0.065]), { outline: false, wear: 0.5 + sg * 0.1 });
    out.A.eyes = [W(HQ([0.27, 0.15, 0.065])), W(HQ([0.27, -0.15, 0.065]))]; out.A.beak = W(HQ([0.6, 0, -0.14])); out.A.head = W(HQ([0.12, 0, 0.08])); out.A.chest = W([0.42, 0, -0.15]); out.A.mouth = W(HQ([0.45, 0, -0.03]));
    /* the legs (the right mirrored), swung forward by P.leg */
    const Rl = rotY(-(P.leg || 0)); for (const sg of [1, -1]) { const hip = [DIM.hip[0], sg * DIM.hip[1], DIM.hip[2]]; I('leg', sg > 0 ? Rl : refM(Rl), hip, { wear: 0.61 }); }
    out.A.talons = [W(vadd([DIM.hip[0], DIM.hip[1], DIM.hip[2]], mv(Rl, [0.25, 0, -0.75]))), W(vadd([DIM.hip[0], -DIM.hip[1], DIM.hip[2]], mv(Rl, [0.25, 0, -0.75])))];
    /* the tail: ten rectrices fanned about its root, pitched */
    const tl = P.tail || {}, tf = tl.fan == null ? 0.7 : tl.fan, RT = rotY(tl.pitch || 0), TB = DIM.TB;
    for (let i = 0; i < NRE; i++) { const f = (i - (NRE - 1) / 2) / ((NRE - 1) / 2), ph = f * tf * 0.62, root = vadd(TB, [0, f * 0.11, 0.004 * Math.abs(f) * 4]);
      I('rect', mm(RT, rotZ(Math.PI - ph)), root, { outline: false, wear: hash(i * 3.1 + 1), al: 1 }); }
    if (!low) I('airT', mm(RT, rotZ(Math.PI / 2)), TB, { al: 0.99, outline: false, wear: 0.83 });
    { const tipC = W(vadd(TB, mv(RT, [-1.0, 0, 0]))); out.A.tail = tipC; out.d2.tail = [W(vadd(TB, mv(RT, mv(rotZ(-tf * 0.62), [-1.02, 0, 0])))), tipC, W(vadd(TB, mv(RT, mv(rotZ(tf * 0.62), [-1.02, 0, 0]))))]; }
    /* the wings: each its three bone groups, its ten primaries, its air sheets */
    out.A.tips = []; out.A.trail = [];
    for (const sg of [1, -1]) {
      const w = sg > 0 ? (P.wing || WP.rest) : (P.wingR || P.wing || WP.rest), F = wingFrames(w), MR = sg > 0 ? (R => R) : refM, MP = sg > 0 ? (p => p) : REF;
      I('wH', MR(F.RH), MP(F.S), { wear: 0.71 }); I('wF', MR(F.RF), MP(F.E), { wear: 0.73 }); I('wP', MR(F.RP), MP(F.Wr), { wear: 0.75 });
      const tips = [];
      for (let i = 0; i < NPR; i++) { const rt = primRoot(i), b = primBeta(i, w.fan), cu = (w.curl || 0) * (0.25 + 0.75 * i / (NPR - 1)) + 0.04, Rp = mm(F.RP, mm(rotZ(b), mm(rotY(-cu), rotX(0.06 * (i - 5) * (w.fan > 0.6 ? 1 : 0.3))))), o = vadd(F.Wr, mv(F.RP, rt));
        I('p' + i, MR(Rp), MP(o), { outline: false, wear: hash(i * 5.7 + (sg > 0 ? 2 : 9)) }); tips.push(MP(vadd(o, mv(Rp, [PRI[i][0], 0, 0])))); }
      if (!low) { I('airF', MR(F.RF), MP(F.E), { al: 0.99, outline: false, wear: sg > 0 ? 0.11 : 0.37 }); I('airP', MR(F.RP), MP(F.Wr), { al: 0.99, outline: false, wear: sg > 0 ? 0.19 : 0.47 }); }
      // anchors: the tip (the longest primary's), the trailing edge (the secondaries' tips, then the primaries'), the shadow's points
      const sec = [0, 0.5, 1].map(f => MP(vadd(F.E, mv(F.RF, [f * DIM.Lf, 1.33, -0.02]))));
      out.A.tips.push(W(tips[7])); out.A.trail.push(sec.concat([tips[1], tips[4], tips[7]]).map(W));
      const S = MP(F.S), E = MP(F.E), Wr = MP(F.Wr), hT = MP(vadd(F.Wr, mv(F.RP, [DIM.Lp, 0, 0])));
      out.sh.push({ p: W(vlerp(S, E, 0.5)), r: 0.62 * sc }, { p: W(E), r: 0.68 * sc }, { p: W(vlerp(E, Wr, 0.5)), r: 0.66 * sc }, { p: W(Wr), r: 0.6 * sc }, { p: W(tips[4]), r: 0.38 * sc }, { p: W(vlerp(Wr, tips[7], 0.5)), r: 0.5 * sc });
      out.d2.wings.push({ S: W(S), E: W(E), Wr: W(Wr), hT: W(hT), sec: sec.map(W), prim: tips.map(W), roots: Array.from({ length: NPR }, (_, i) => W(MP(vadd(F.Wr, mv(F.RP, primRoot(i)))))), sg });
    }
    out.sh.push({ p: W([0.2, 0, 0]), r: 0.55 * sc }, { p: W([-0.45, 0, 0]), r: 0.45 * sc }, { p: W([-1.3, 0, 0]), r: 0.36 * sc });
    out.d2.body = [W([-0.9, 0, 0]), W([0.0, 0, 0]), W([0.6, 0, 0.05]), W(N)]; out.A.O = O; out.A.Bw = Bw; out.A.sc = sc;
    return out;
  }
  function vlerp(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }

  /* ================= drawing ================= */
  /* V: { X0, Y0 (the drawing origin on screen), k (px a tile) }: a model point to the screen */
  const toS = (V, p) => [V.X0 + p[0] * V.k, V.Y0 + (p[1] * GY - p[2] * ZK) * V.k];
  function visBox(c) { const m = c.getTransform ? c.getTransform() : null, cv = c.canvas; if (!m || !cv || !cv.width) return null; const det = m.a * m.d - m.b * m.c; if (Math.abs(det) < 1e-9) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [X, Y] of [[0, 0], [cv.width, 0], [0, cv.height], [cv.width, cv.height]]) { const dx = X - m.e, dy = Y - m.f, ux = (m.d * dx - m.c * dy) / det, uy = (-m.b * dx + m.a * dy) / det; x0 = Math.min(x0, ux); y0 = Math.min(y0, uy); x1 = Math.max(x1, ux); y1 = Math.max(y1, uy); }
    return [Math.floor(x0) - 2, Math.floor(y0) - 2, Math.ceil(x1) + 2, Math.ceil(y1) + 2]; }
  const PXB = [0.55e6, 0.38e6, 0.27e6, 0.27e6];   // (the pass's GL pixel budget in a fight by the visual quality: High, Balanced, Performance, its floor)
  const budget = () => { try { if (typeof GQ === 'undefined' || typeof arc === 'undefined' || !arc.game || arc.mode !== 'dungeon') return 1e12; return PXB[Math.max(0, Math.min(3, GQ.level() | 0))]; } catch (e) { return 1e12; } };
  const POOL = [], ITEMS = [], TRANS = []; let NPOOL = 0;
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0 };
  /* the eagle on the GPU: one pass. Returns false when it cannot (the painted eagle then) */
  function drawGL(c, V, R, o) {
    o = o || {}; if (!ensure() || NOGL) return false;
    try {
      const k = V.k, X0 = V.X0, Y0 = V.Y0; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; ITEMS.length = 0; TRANS.length = 0; NPOOL = 0;
      for (const it of R.inst) { const mesh = SH[it.part]; if (!mesh) continue; const al = it.al == null ? 1 : it.al; if (!(al > 0.004)) continue;
        const Rw = it.R, bc = mesh.bs, ck = Math.max(vlen(Rw.x), vlen(Rw.y), vlen(Rw.z)), w = vadd(it.o, mv(Rw, [bc[0], bc[1], bc[2]])), rr = bc[3] * ck * 1.05 * k, sx = X0 + vdot(w, PX) * k, sy = Y0 + vdot(w, PY) * k;
        if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr;
        const g = POOL[NPOOL] || (POOL[NPOOL] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NPOOL++;
        g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i]; g.R1[i] = Rw.y[i]; g.R2[i] = Rw.z[i]; g.T[i] = it.o[i]; }
        g.alpha = al; g.glow = it.glow; g.glow2 = it.glow2; g.spill = it.spill; g.kind = it.kind; g.wear = it.wear; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = it.outline !== false && !(it.spill > 0.001); g.d = vdot(it.o, PD);
        (al < 0.995 ? TRANS : ITEMS).push(g); }
      if (!(bx1 > bx0) || !(ITEMS.length + TRANS.length)) return true;
      TRANS.sort((p, q) => p.d - q.d); for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__GE_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (lowFx() ? 0.8 : 1) * (typeof GQ !== 'undefined' && GQ.animaK ? GQ.animaK() : 1);
      bx0 = Math.floor(bx0) - 3; by0 = Math.floor(by0) - 3; bx1 = Math.ceil(bx1) + 3; by1 = Math.ceil(by1) + 3;
      const vb = visBox(c); if (vb) { bx0 = Math.max(bx0, vb[0]); by0 = Math.max(by0, vb[1]); bx1 = Math.min(bx1, vb[2]); by1 = Math.min(by1, vb[3]); if (!(bx1 > bx0 + 1 && by1 > by0 + 1)) return true; }   // (only what is on the canvas)
      const bw = bx1 - bx0, bh = by1 - by0; let W = Math.ceil(bw * dev), H = Math.ceil(bh * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      const bud = budget(); if (W * H > bud) { const q = Math.sqrt(bud / (W * H)); W = Math.max(2, Math.ceil(W * q)); H = Math.max(2, Math.ceil(H * q)); }
      const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: lowFx(), rim: RIMC, amb: AMBC, t: (o.t || 0) % 600,
        outline: Math.max(0.8, 1.0 * (W / bw)), outlineCol: OUTC, outlineBias: 0.004, keep: 1 };
      const t0 = nowMs(), cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return false;
      c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.items = ITEMS.length; STATS.W = W; STATS.H = H;
      return true;
    } catch (e) { fail(e); return false; }
  }
  /* ---- the painted eagle (no WebGL): the same rig. Far wing, tail and body, head, near wing: feathers as tapered strokes ---- */
  const C2 = { bronzeD: '#4A2A0E', bronze: '#7A4B1A', gold: '#C99A3C', paleG: '#F0D48A', champ: '#FFF0C8', ivory: '#F4ECD8', emer: '#2FE39A', jade: '#5FE8C0' };
  function draw2D(c, V, R, o) {
    o = o || {}; const k = V.k, D = R.d2, al0 = 1 - cl(o.spill || 0), fade = o.fade || (() => 1); if (al0 <= 0.01 || !D.body) return;
    const S = p => toS(V, p), depth = p => vdot(p, PD);
    const wingOrder = D.wings.slice().sort((a, b) => depth(a.E) - depth(b.E));
    const feather = (a, b, w, col, edge) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w; c.beginPath(); c.moveTo(a[0] - nx * 0.4, a[1] - ny * 0.4); c.quadraticCurveTo(a[0] + dx * 0.55 - nx, a[1] + dy * 0.55 - ny, b[0], b[1]); c.quadraticCurveTo(a[0] + dx * 0.55 + nx, a[1] + dy * 0.55 + ny, a[0] + nx * 0.4, a[1] + ny * 0.4); c.closePath(); c.fillStyle = col; c.fill(); if (edge) { c.strokeStyle = edge; c.lineWidth = Math.max(0.8, k * 0.03); c.stroke(); } };
    const wing = Wg => { const s = S(Wg.S), e = S(Wg.E), wr = S(Wg.Wr), sec = Wg.sec.map(S), pr = Wg.prim.map(S), rt = Wg.roots.map(S);
      c.globalAlpha = al0 * fade(Wg.E);
      // the flight feathers first (under), then the covert shield over their roots
      for (let i = 0; i < pr.length; i++) feather(rt[i], pr[i], k * 0.1, i > 5 ? C2.bronze : C2.gold, 'rgba(255,240,200,0.55)');
      const g = c.createLinearGradient(s[0], s[1], sec[2][0], sec[2][1]); g.addColorStop(0, C2.bronzeD); g.addColorStop(1, C2.gold);
      c.fillStyle = g; c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(e[0], e[1]); c.lineTo(wr[0], wr[1]); c.lineTo(rt[0][0], rt[0][1]); for (let i = sec.length - 1; i >= 0; i--) c.lineTo(sec[i][0], sec[i][1]); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(40,20,6,0.7)'; c.lineWidth = Math.max(1, k * 0.04); c.stroke();
      c.fillStyle = C2.bronze; c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(e[0], e[1]); c.lineTo(wr[0], wr[1]); const m1 = [(e[0] + sec[1][0]) / 2, (e[1] + sec[1][1]) / 2], m0 = [(s[0] + sec[0][0]) / 2, (s[1] + sec[0][1]) / 2]; c.lineTo(m1[0], m1[1]); c.lineTo(m0[0], m0[1]); c.closePath(); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(120,240,200,0.35)'; c.lineWidth = Math.max(1, k * 0.05); c.beginPath(); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]); c.lineTo(rt[3][0], rt[3][1]); c.stroke(); c.restore(); };
    c.save();
    wing(wingOrder[0]);
    // the tail, the body, the legs
    c.globalAlpha = al0; const tp = D.tail.map(S), b0 = S(D.body[0]); c.fillStyle = C2.bronze; c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(tp[0][0], tp[0][1]); c.quadraticCurveTo(tp[1][0], tp[1][1], tp[2][0], tp[2][1]); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,240,200,0.5)'; c.lineWidth = Math.max(1, k * 0.03); c.stroke();
    const p0 = S(D.body[0]), p1 = S(D.body[1]), p2 = S(D.body[2]), nk = S(D.body[3]), bl = Math.hypot(p2[0] - p0[0], p2[1] - p0[1]), ang = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]);
    for (const tl of R.A.talons) { const q = S(tl); c.strokeStyle = C2.paleG; c.lineWidth = Math.max(2, k * 0.14); c.lineCap = 'round'; c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(q[0], q[1]); c.stroke(); c.fillStyle = '#1A1410'; for (const s2 of [-1, 0, 1]) { c.beginPath(); c.arc(q[0] + s2 * k * 0.08, q[1] + k * 0.05, Math.max(1, k * 0.035), 0, TAU); c.fill(); } }
    c.save(); c.translate((p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2); c.rotate(ang); const gb = c.createLinearGradient(0, -k * 0.5, 0, k * 0.5); gb.addColorStop(0, C2.bronze); gb.addColorStop(0.55, C2.gold); gb.addColorStop(1, C2.paleG); c.fillStyle = gb; c.beginPath(); c.ellipse(0, 0, Math.max(2, bl * 0.62), k * 0.42 * (P2SC(R)), 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(40,20,6,0.7)'; c.lineWidth = Math.max(1, k * 0.04); c.stroke(); c.restore();
    // the head: a rounded crown, the hooked ivory beak, the emerald eye
    const hq = S(R.A.head), bk = S(R.A.beak), hr = k * 0.2 * P2SC(R); c.fillStyle = C2.paleG; c.beginPath(); c.moveTo(nk[0], nk[1]); c.lineTo(hq[0], hq[1]); c.lineWidth = Math.max(2, k * 0.3 * P2SC(R)); c.strokeStyle = C2.gold; c.stroke(); c.beginPath(); c.arc(hq[0], hq[1], hr, 0, TAU); c.fill();
    c.fillStyle = C2.ivory; c.beginPath(); const ba = Math.atan2(bk[1] - hq[1], bk[0] - hq[0]); c.moveTo(hq[0] + Math.cos(ba - 1.2) * hr * 0.8, hq[1] + Math.sin(ba - 1.2) * hr * 0.8); c.quadraticCurveTo(bk[0] - Math.cos(ba) * hr * 0.2, bk[1] - Math.sin(ba) * hr * 0.6, bk[0], bk[1] + hr * 0.3); c.lineTo(hq[0] + Math.cos(ba + 1.0) * hr * 0.6, hq[1] + Math.sin(ba + 1.0) * hr * 0.6); c.closePath(); c.fill();
    for (const e of R.A.eyes) { const q = S(e); c.fillStyle = C2.emer; c.beginPath(); c.arc(q[0], q[1], Math.max(1.2, k * 0.045 * P2SC(R)), 0, TAU); c.fill(); }
    wing(wingOrder[1]);
    c.restore();
  }
  const P2SC = R => (R.A && R.A.sc) || 1;
  /* a studio portrait (tests, the contact sheets): the rig P drawn at screen (x, y) with T px a tile; o.d2: the painted eagle */
  function studio(c, x, y, P, o) { o = o || {}; const R = rig(P), V = { X0: x, Y0: y, k: o.T || 30 };
    if (o.d2 || !drawGL(c, V, R, { t: P.t })) { draw2D(c, V, R, { spill: P.spill }); return { R, gl: false }; } return { R, gl: true }; }
  return { usable, warm, ensure, step, release, gpuCount, rig, wmix, WP, drawGL, draw2D, toS, studio, DIM, GY, ZK, STATS, get off() { return NOGL; }, set noGL(v) { NOGL = !!v; }, get ready() { return !!SH; } };
})();
if (typeof self !== 'undefined') self.GOLDEAGLE_GL = GOLDEAGLE_GL;
