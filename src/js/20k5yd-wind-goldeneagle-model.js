/* ---------- (v451 GE, reworked v455 GE2) GOLDEN EAGLE: the eagle itself (Wind's six-star summon Ultimate; the move is 20k5ye) ----------
   An original eagle, built for the user's brief: a proud head (a heavy brow over the eyes, golden hackles lifted at the nape), a
   hooked ivory beak on a gold cere, bright emerald eyes, a deep, powerful chest, feathered legs ending in strong talons, and
   exceptionally broad wings. Its plumage runs from pale gold at the chest to deep bronze along the wing roots; the longest flight
   feathers carry luminous champagne edges; jade and mint air currents stream between the feather layers.
   The model (tiles; z up from the floor; x east, y south; drawn with the game's camera: the floor squashed by GY 0.55, heights by
   ZK = sqrt(1 - GY^2); or (studio) a level side view): a bird frame (x forward, y its left, z up) posed by yaw, pitch and roll.
   - the body: one lofted torso and neck (a deep keel of a chest, tapering to the tail), its scapulars and tail coverts on it;
   - the head (its own part, turned on the neck, stabilised: it can track a point in the world while the body moves): a lofted
     skull, brow ridges, the nape's hackles, the cere and the hooked upper mandible; the lower mandible hinged; two eyes;
   - the legs: feathered thighs and tarsi swung at the hip (tucked back in flight, thrown forward to brake), and each foot four
     toes of their own (spread and curled by the grip: talons open, clenched);
   - the tail: ten rectrices (one feather mesh, instanced), fanned, pitched, yawed (to steer) and twisted;
   - each wing a rig of three bones (shoulder -> elbow -> wrist -> the hand's tip): on the humerus its marginal coverts and the
     tertials; on the forearm three covert rows; the eleven secondaries their own group, hinged along the forearm (the trailing
     edge lifts under the stroke's load and settles after it); on the hand the primary coverts and the alula; ten primaries,
     each in two pieces hinged at mid-length, in three groups (inner, middle, outer) that flex (bend up under the downstroke's
     load, down on the upstroke), fan, curl and pronate (twist about their own shafts, opening slots) on their own controls, so
     the outer feathers follow the hand a fraction later; thin air-current sheets between the layers. The right wing is the left
     one mirrored (its own pose: banking can differ).
   The feathers have thickness: every flight feather, rectrix and covert is a closed lens (an upper and an under surface, thickest
   along the shaft) with its own underside material (510: a duller, barred underside), so the layers overlap with visible depth,
   cast shaped shadows on each other (analytic occluders for the body, head and wing roots, and contact shading where a row lies
   over the next) and catch controlled highlights along their edges.
   Rig: rig(P) poses it (the move's choreography: 20k5ye) and returns the parts and anchors (eyes, beak, chest, wing tips, the
   trailing edges, the shadow's points). Wing poses are named in WP and blended (wmix: every control).
   Drawing: GLM when usable (one pass; materials 500..504 and 510, the GE-MAT block in 20k5uz), sized to its on-screen box, cut to
   the canvas, held under the visual quality's pixel budget, its GL canvas kept. Without WebGL (or on a software rasteriser unless
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
  const M3 = (x, y, z) => ({ x, y, z }), ID = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mtv = (M, v) => [vdot(M.x, v), vdot(M.y, v), vdot(M.z, v)];   // (the inverse of a rotation applied: world -> its frame)
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  const colsK = (R, k) => M3(vmul(R.x, k), vmul(R.y, k), vmul(R.z, k));
  const REF = v => [v[0], -v[1], v[2]], refM = R => M3(REF(R.x), REF(R.y), REF(R.z));   // (the right side: the left mirrored across the bird's midplane)
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

  /* ---- the cameras (the game's floor squash; the studio's level side view, looking north) and the light ---- */
  const GY = 0.55, ZK = Math.sqrt(1 - GY * GY), UPW = [0, 0, 1];
  const CAM = { game: { px: [1, 0, 0], py: [0, GY, -ZK], pd: [0, ZK, GY] }, side: { px: [1, 0, 0], py: [0, 0, -1], pd: [0, 1, 0] } };
  const PX = CAM.game.px, PY = CAM.game.py, PD = CAM.game.pd;
  const LW = vnrm([-0.5, 0.45, 0.74]), SBW = vnrm([-0.3, 0.25, 0.92]), RIMW = vnrm([0.6, -0.62, 0.42]);
  const RIMC = [0.62, 1.32, 1.0], AMBC = [1.04, 1.0, 0.93], OUTC = [0.075, 0.045, 0.02], GLCAP = 1700;   // (a jade-mint rim: the wind's light on its edges)
  /* ---- the materials (20k5uz GE-MAT; variants below .5: GLM rounds the id). 510: a feather's underside (its variants as 500's) ---- */
  const M_PRI = 500, M_SEC = 500.1, M_TER = 500.2, M_REC = 500.3, M_COV = 500.4, M_BODY = 501, M_HEAD = 501.1, M_HACK = 501.2, M_TROU = 501.3, M_BROW = 501.4;
  const M_BEAK = 502, M_CERE = 502.1, M_CLAW = 502.2, M_GAPE = 502.3, M_EYE = 503, M_AIR = 504;
  const UNDER = m => 510 + Math.round((m - Math.floor(m)) * 10) / 10;   // (a feather material's underside)
  /* ---- the skeleton (bird units: the move scales it) ---- */
  const DIM = { Lh: 0.8, Lf: 1.0, Lp: 0.7, S: [0.16, 0.33, 0.2], N: [0.98, 0, 0.3], hip: [-0.04, 0.19, -0.3], TB: [-0.9, 0, 0.04], ank: [0.15, 0, -0.62] };
  const NPR = 10, NRE = 10, HG = 0.5;   // (HG: where each primary's hinge sits along it)
  // the primaries, inner (P1) to outer (P10): length, the outer vane's width, the inner's, the emargination (0: none) of each vane
  const PRI = [[1.12, 0.05, 0.12, 0, 0], [1.2, 0.05, 0.12, 0, 0], [1.28, 0.05, 0.125, 0, 0], [1.36, 0.048, 0.125, 0, 0.72], [1.46, 0.046, 0.12, 0.66, 0.66],
    [1.55, 0.044, 0.118, 0.6, 0.62], [1.6, 0.042, 0.115, 0.56, 0.58], [1.6, 0.04, 0.11, 0.52, 0.55], [1.52, 0.038, 0.1, 0.5, 0.52], [1.32, 0.034, 0.085, 0.46, 0.5]];
  const PBOW = 0.015;
  const primRoot = i => [0.06 + 0.86 * (i / (NPR - 1)) * DIM.Lp, 0.06, 0.012 * (i / (NPR - 1))];   // (outer ones a little higher: crisp fingers on top)
  const primHinge = i => [HG * PRI[i][0], 0, PBOW * PRI[i][0] * Math.sin(Math.PI * HG)];
  // their fan: the angle back from the hand's line, spread (fan 1) and folded (fan 0)
  const betaS = i => lerp(1.34, 0.05, Math.pow(i / (NPR - 1), 0.85)), betaF = i => 0.1 + 0.025 * (NPR - 1 - i);

  /* ================= meshes ================= */
  const DQ = () => (lowFx() ? 0.65 : 1), qn = n => Math.max(3, Math.round(n * DQ()));
  function bsph(m) { let cx = 0, cy = 0, cz = 0; const n = m.nv; for (let i = 0; i < n; i++) { cx += m.pos[i * 3]; cy += m.pos[i * 3 + 1]; cz += m.pos[i * 3 + 2]; } cx /= n; cy /= n; cz /= n; let r = 0; for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(m.pos[i * 3] - cx, m.pos[i * 3 + 1] - cy, m.pos[i * 3 + 2] - cz)); m.bs = [cx, cy, cz, r]; return m; }
  /* a feather in the builder's current frame: its root at o.root, pointing at angle o.th in the x-y plane (0: +x), o.len long;
     the outer vane o.wo wide (toward the leading side), the inner o.wi; o.e0, o.e1 the emargination of each vane (where the vane
     narrows: a distinct finger); o.tip the rounding; o.cam its camber, o.droop the drop along it (shingled), o.lift its tilt about
     its own axis; o.th the thickness at the shaft (a closed lens: its upper surface o.m, its under surface the material's
     underside, thinning to the vanes' edges and the tip); o.u0..o.u1 the stretch of it built (a hinged piece); vA.y the place along
     it (0 the quill .. 1 the tip), vA.z the card's index + its place across (0 the leading edge .. 1 the trailing; the rachis at
     wo / (wo + wi)) */
  function card(B, o) {
    const len = o.len, wo = o.wo, wi = o.wi, th = o.th || 0, dx = Math.cos(o.thA || 0), dy = Math.sin(o.thA || 0), px = -dy, py = dx, r = o.root || [0, 0, 0], ci = o.ci || 0;
    const e0 = o.e0 || 0, e1 = o.e1 || 0, tip = o.tip == null ? 0.78 : o.tip, cam = o.cam == null ? 0.18 : o.cam, dr = o.droop || 0, lift = o.lift || 0, bow = o.bow == null ? 0.02 : o.bow, cl0 = Math.cos(lift), sl0 = Math.sin(lift);
    const u0 = o.u0 || 0, u1 = o.u1 == null ? 1 : o.u1;
    const shape = u => { let s = Math.sqrt(sstep(0, 0.1, u)) * 0.85 + 0.15; if (u > tip) { const q = (u - tip) / (1 - tip); s *= Math.sqrt(Math.max(0, 1 - q * q)); } return s; };
    const wOut = u => wo * shape(u) * (e0 ? lerp(1, 0.42, sstep(e0 - 0.05, e0 + 0.05, u)) : 1), wIn = u => wi * shape(u) * (e1 ? lerp(1, 0.5, sstep(e1 - 0.06, e1 + 0.05, u)) : 1);
    const wm = Math.max(wo, wi);
    const at = (uu, v, sd) => { const u = lerp(u0, u1, uu), wa = wOut(u), wb = wIn(u), a = lerp(-wa, wb, v), fx = u * len, z0 = -cam * a * a / Math.max(1e-3, wm) * 0.5 + dr * fx + bow * len * Math.sin(Math.PI * u);
      const ed = a < 0 ? wa : wb, q = ed > 1e-6 ? a / ed : 0, dz = sd * th * 0.5 * Math.sqrt(Math.max(0, 1 - q * q)) * (1 - 0.55 * u) * (0.35 + 0.65 * Math.sqrt(Math.max(0, 1 - q * q)));   // (a lens: thickest along the shaft)
      const ya = a * cl0 - dz * sl0, za = z0 * cl0 + a * sl0 + dz * cl0; return [r[0] + dx * fx + px * ya, r[1] + dy * fx + py * ya, r[2] + za]; };
    const nu = qn(o.nu || 8), nv = o.nv || 3, at2 = { e: uu => lerp(u0, u1, uu), a: (uu, v) => ci + Math.min(0.999, v) };
    B.surf((uu, v) => at(uu, v, 1), nu, nv, () => o.m, at2);
    if (th > 0) B.surf((uu, v) => at(uu, v, -1), nu, nv, () => UNDER(o.m), Object.assign({ flip: true }, at2));
  }
  /* a soft roll of plumage along x (a bone's leading edge): x0..x1, radius r(u), flattened by fz, offset (y, z); vA.y along, vA.z round */
  function roll(B, x0, x1, r, m, o) { o = o || {}; const yo = o.y || 0, zo = o.z || 0, fz = o.fz || 0.7, ci = o.ci || 0;
    B.surf((u, v) => { const a = v * TAU, rr = r(u) * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.35); return [lerp(x0, x1, u), yo + Math.cos(a) * rr, zo + Math.sin(a) * rr * fz]; }, qn(o.nu || 8), qn(o.nv || 10), () => m, { e: u => 0.3 + 0.3 * u, a: () => ci + 0.78 }); }
  /* a soft puff of plumage over a joint (the same shading as a covert's middle: no seams) */
  function puff(B, c, rx, ry, rz, m) { B.surf((u, v) => { const th = u * Math.PI, ph = v * TAU; return [c[0] + rx * Math.sin(th) * Math.cos(ph), c[1] + ry * Math.sin(th) * Math.sin(ph), c[2] + rz * Math.cos(th)]; }, qn(6), qn(10), () => m, { e: () => 0.45, a: () => 70.78 }); }
  /* the body: a lofted torso and neck (x from the tail's root to the head's joint); vA.y along it (0 the tail .. 1 the neck), vA.z
     round it (0 the back's top .. 0.5 the belly .. 1); scapulars and tail coverts on it. The chest deep and full (the flight muscles
     over the keel), the waist narrowing behind it */
  const BP = [[-0.96, 0.12, 0.07, 0.06, 0.0], [-0.72, 0.25, 0.15, 0.17, 0.0], [-0.4, 0.37, 0.24, 0.34, 0.0], [-0.04, 0.47, 0.3, 0.48, 0.0], [0.28, 0.5, 0.33, 0.52, 0.02], [0.54, 0.42, 0.32, 0.4, 0.07], [0.78, 0.27, 0.28, 0.2, 0.16], [1.02, 0.19, 0.24, 0.12, 0.3]];
  const bp = x => { let i = 0; while (i < BP.length - 2 && BP[i + 1][0] < x) i++; const a = BP[i], b = BP[i + 1], u = sstep(a[0], b[0], x) * 0.5 + cl((x - a[0]) / (b[0] - a[0])) * 0.5; return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u), lerp(a[4], b[4], u)]; };
  function bodyMesh() {
    const B = GLM.builder(DQ()), X0 = BP[0][0], X1 = BP[BP.length - 1][0];
    B.surf((u, v) => { const x = lerp(X0, X1, u), [w, ht, hb, zc] = bp(x), a = v * TAU, ca = Math.cos(a), sa = Math.sin(a), keel = ca < 0 ? 1 - 0.1 * Math.pow(Math.abs(sa), 3) * sstep(-0.2, 0.3, x) : 1; return [x, w * sa * keel, zc + (ca >= 0 ? ht : hb) * ca]; }, qn(22), qn(26), () => M_BODY, { e: u => u, a: (u, v) => Math.min(0.999, v) });
    B.ell([X0 + 0.01, 0, 0], [0.06, 0.12, 0.07], M_BODY, { seg: qn(10), rings: 4 });
    // the scapulars: bronze feathers over each shoulder, bridging the wing's root to the back (two overlapping rows)
    for (const sg of [1, -1]) for (let i = 0; i < 6; i++) { const x = 0.34 - i * 0.13, y = sg * (0.2 + 0.05 * Math.sin(i * 1.3)), z = 0.3 - 0.01 * i;
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [x, y, z]); card(B, { root: [0, 0, 0], thA: Math.PI + sg * (0.55 - 0.04 * i), len: 0.34 + 0.03 * i, wo: 0.07, wi: 0.09, cam: 0.12, droop: -0.18, m: M_COV, ci: 20 + i + (sg > 0 ? 0 : 8), tip: 0.6, nu: 6, nv: 2, th: 0.03 }); B.pop(); }
    // the upper tail coverts (over the rectrices' roots) and the under tail coverts
    for (let i = 0; i < 7; i++) { const y = (i - 3) * 0.06; card(B, { root: [-0.7, y, 0.12], thA: Math.PI + (i - 3) * 0.12, len: 0.48, wo: 0.07, wi: 0.08, cam: 0.1, droop: -0.12, m: M_COV, ci: 40 + i, tip: 0.6, nu: 6, nv: 2, th: 0.03 });
      card(B, { root: [-0.68, y, -0.12], thA: Math.PI + (i - 3) * 0.1, len: 0.4, wo: 0.07, wi: 0.08, cam: -0.1, droop: 0.04, m: M_BODY, ci: 0, tip: 0.6, nu: 5, nv: 2 }); }
    // the neck's ruff: hackles lying back over the joint (golden)
    for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.6;
      B.push([1, 0, 0], [0, Math.cos(a), Math.sin(a)], [0, -Math.sin(a), Math.cos(a)], [0.9, 0, 0.3]); card(B, { root: [0, 0, 0.23], thA: Math.PI, len: 0.36, wo: 0.05, wi: 0.05, cam: 0.05, droop: -0.1, m: M_HACK, ci: i, tip: 0.45, nu: 5, nv: 2 }); B.pop(); }
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
      B.push([1, 0, 0], [0, ca, sa], [0, -sa, ca], [-0.06, 0, 0.06]); card(B, { root: [0.04, 0, 0.19], thA: Math.PI, len: 0.3 + 0.04 * (1 - Math.abs(i - 3) / 3), wo: 0.04, wi: 0.04, cam: 0.04, droop: 0.12, lift: 0, m: M_HACK, ci: 10 + i, tip: 0.35, nu: 5, nv: 2 }); B.pop(); }
    return bsph(B.done());
  }
  /* the lower mandible: hinged at the head frame's [0.33, 0, 0.0] */
  function jawMesh() { const B = GLM.builder(DQ());
    B.surf((u, v) => { const x = u * 0.24, w = 0.072 * (1 - 0.75 * u), a = v * TAU, ca = Math.cos(a), sa = Math.sin(a), zc = -0.012 - 0.05 * u * u; return [x, w * sa, zc + (ca >= 0 ? 0.012 : 0.03) * ca]; }, qn(8), qn(10), () => M_BEAK, { e: u => 0.3 + 0.4 * u, a: () => 0.5 });
    B.surf((u, v) => [u * 0.22, (v - 0.5) * 0.12 * (1 - 0.7 * u), -0.004], 4, 2, () => M_GAPE, {});
    return bsph(B.done()); }
  function eyeMesh() { const B = GLM.builder(DQ()); B.sph([0, 0, 0], 0.066, M_EYE, qn(16)); return bsph(B.done()); }
  /* a leg (the left; its frame at the hip, x forward, z up): the feathered thigh and tarsus down to the ankle (DIM.ank) */
  function legMesh() {
    const B = GLM.builder(DQ()), K = [0.06, 0, -0.34], A = DIM.ank;
    B.surf((u, v) => { const a = v * TAU, r = lerp(0.16, 0.1, u) * (1 + 0.08 * Math.sin(a * 5 + u * 3)); return [lerp(0, K[0], u) + Math.cos(a) * r * 0.9, Math.sin(a) * r, lerp(0.02, K[2], u)]; }, qn(6), qn(14), () => M_TROU, { e: u => u * 0.5, a: (u, v) => Math.min(0.999, v) });
    B.surf((u, v) => { const a = v * TAU, r = lerp(0.085, 0.05, u); return [lerp(K[0], A[0], u) + Math.cos(a) * r, Math.sin(a) * r, lerp(K[2], A[2], u)]; }, qn(5), qn(12), () => M_TROU, { e: u => 0.5 + u * 0.5, a: (u, v) => Math.min(0.999, v) });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; B.push([Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1], [K[0], 0, K[2] + 0.04]); card(B, { root: [0.08, 0, 0], thA: 0, len: 0.16, wo: 0.04, wi: 0.04, cam: 0.05, droop: -1.4, m: M_TROU, ci: 0, tip: 0.5, nu: 4, nv: 2 }); B.pop(); }   // (the trousers' fringe)
    B.ell([A[0], 0, A[2]], [0.05, 0.048, 0.04], M_CERE, { seg: qn(8), rings: 4 });   // (the ankle's scaled knuckle, under the toes' roots)
    return bsph(B.done());
  }
  /* a toe (its frame at its root on the ankle, x along it): two scaled phalanges and a curved dark talon */
  function toeMesh() { const B = GLM.builder(DQ()), L1 = 0.14, L2 = 0.11, p1 = [L1, 0, -0.025], p2 = [L1 + L2, 0, -0.06];
    B.tube([0, 0, 0], p1, 0.04, 0.034, M_CERE, { seg: qn(8), cap0: 'round', cap1: 'round' }); B.tube(p1, p2, 0.034, 0.028, M_CERE, { seg: qn(8), cap1: 'round' });
    let q = p2, dir = [1, 0, -0.2]; for (let k = 0; k < 3; k++) { const dn = vnrm([dir[0], dir[1], dir[2] - 0.75 * (k + 1)]), q2 = vadd(q, vmul(dn, 0.205 * (0.45 - 0.08 * k))); B.tube(q, q2, 0.027 * (1 - 0.3 * k), 0.027 * (0.7 - 0.3 * k) + 0.002, M_CLAW, { seg: qn(7), cap0: 'round' }); q = q2; dir = dn; }
    return bsph(B.done()); }
  /* the wing's bone groups (the left wing; each in its bone's frame: x along the bone from its joint, y back toward the trailing
     edge, z up). The humerus: its leading roll, two rows of marginal coverts, the tertials */
  function wHMesh() { const B = GLM.builder(DQ()), L = DIM.Lh;
    roll(B, -0.05, L + 0.05, u => 0.13 - 0.02 * u + 0.03 * Math.sin(Math.PI * u), M_COV, { y: -0.02, z: 0.01, fz: 0.62, ci: 60, nu: 7 });
    puff(B, [L, 0.02, 0.0], 0.12, 0.13, 0.075, M_COV);   // (the elbow's plumage, so the joint never opens)
    for (let i = 0; i < 9; i++) { const x = (i + 0.2) / 8.6 * L; card(B, { root: [x, -0.13, 0.115], thA: 1.62, len: 0.24, wo: 0.07, wi: 0.07, cam: 0.2, droop: -0.2, m: M_COV, ci: 50 + i, tip: 0.5, nu: 4, nv: 2 }); }   // (the marginal coverts over the leading edge's roll)
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const x = (i + 0.5 * r) / 6 * L; card(B, { root: [x, 0.02 + r * 0.1, 0.07 - r * 0.02], thA: 1.75 - 0.12 * r, len: 0.24 + 0.07 * r, wo: 0.07, wi: 0.07, cam: 0.12, droop: -0.12, m: M_COV, ci: r * 10 + i, tip: 0.55, nu: 5, nv: 2, th: 0.024 }); }
    for (let i = 0; i < 6; i++) { const x = (i + 0.3) / 6 * L; card(B, { root: [x, 0.2, 0.03], thA: 1.68, len: 0.4, wo: 0.08, wi: 0.09, cam: 0.12, droop: -0.1, m: M_COV, ci: 30 + i, tip: 0.6, nu: 5, nv: 2, th: 0.026 }); }
    for (let i = 0; i < 6; i++) { const x = 0.08 + i * 0.15; card(B, { root: [x, 0.24, -0.005 + 0.004 * i], thA: 1.78 - 0.05 * i, len: 0.9 + 0.04 * i, wo: 0.1, wi: 0.15, cam: 0.16, droop: -0.03, m: M_TER, ci: i, tip: 0.72, nu: 8, nv: 3, th: 0.034 }); }   // (the tertials: the last one reaching past the elbow, so the trailing edge never opens there)
    return bsph(B.done()); }
  /* the forearm: its roll, the lesser, median and greater coverts (each card its own: overlapping rows) */
  function wFMesh() { const B = GLM.builder(DQ()), L = DIM.Lf;
    roll(B, -0.05, L + 0.04, u => 0.11 - 0.035 * u, M_COV, { y: -0.03, z: 0.02, fz: 0.6, ci: 61, nu: 7 });
    puff(B, [L, 0.0, 0.01], 0.09, 0.1, 0.06, M_COV);   // (the wrist's plumage)
    for (let i = 0; i < 10; i++) { const x = (i + 0.2) / 9.6 * L; card(B, { root: [x, -0.12, 0.1], thA: 1.6, len: 0.21, wo: 0.06, wi: 0.06, cam: 0.2, droop: -0.2, m: M_COV, ci: 50 + i, tip: 0.5, nu: 4, nv: 2 }); }
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const x = (i + 0.5 * r + 0.2) / 8 * L; card(B, { root: [x, 0.0 + r * 0.08, 0.075 - r * 0.015], thA: 1.62, len: 0.2 + 0.06 * r, wo: 0.06, wi: 0.06, cam: 0.12, droop: -0.12, m: M_COV, ci: r * 10 + i, tip: 0.55, nu: 5, nv: 2, th: 0.022 }); }
    for (let i = 0; i < 9; i++) { const x = (i + 0.4) / 9 * L; card(B, { root: [x, 0.16, 0.05], thA: 1.6, len: 0.3, wo: 0.065, wi: 0.075, cam: 0.12, droop: -0.1, m: M_COV, ci: 20 + i, tip: 0.6, nu: 5, nv: 2, th: 0.024 }); }
    for (let i = 0; i < 11; i++) { const x = (i + 0.35) / 11 * L; card(B, { root: [x, 0.28, 0.028], thA: 1.6, len: 0.46, wo: 0.075, wi: 0.085, cam: 0.14, droop: -0.07, m: M_COV, ci: 30 + i, tip: 0.65, nu: 6, nv: 2, th: 0.028 }); }   // (the greater coverts, over the secondaries' roots)
    return bsph(B.done()); }
  /* the secondaries (their own group: hinged along the forearm at y 0.3, so the trailing edge flexes under the stroke's load) */
  function wSMesh() { const B = GLM.builder(DQ()), L = DIM.Lf;
    for (let i = 0; i < 11; i++) { const x = -0.07 + i / 10 * (L - 0.02); card(B, { root: [x, 0, -0.004 * i], thA: 1.64 - 0.012 * i, len: 1.04 + 0.08 * Math.sin(i / 10 * Math.PI) - 0.04 * (i / 10), wo: 0.07, wi: 0.11, cam: 0.16, droop: -0.02, m: M_SEC, ci: i, tip: 0.86, nu: 8, nv: 3, th: 0.034 }); }
    return bsph(B.done()); }
  /* the hand: its roll, the primary coverts, the alula */
  function wPMesh() { const B = GLM.builder(DQ()), L = DIM.Lp;
    roll(B, -0.04, L + 0.02, u => 0.075 - 0.04 * u, M_COV, { y: -0.01, z: 0.02, fz: 0.6, ci: 62, nu: 6 });
    for (let i = 0; i < 6; i++) { const x = (i + 0.3) / 6 * L * 0.9; card(B, { root: [x, 0.0, 0.06], thA: 1.2 - 0.12 * i, len: 0.18, wo: 0.05, wi: 0.05, cam: 0.12, droop: -0.12, m: M_COV, ci: i, tip: 0.55, nu: 4, nv: 2 }); }
    for (let i = 0; i < 10; i++) { const x = 0.04 + i / 9 * L * 0.92; card(B, { root: [x, 0.06, 0.035 - 0.002 * i], thA: lerp(1.15, 0.3, i / 9), len: 0.42 - 0.08 * (i / 9), wo: 0.055, wi: 0.075, cam: 0.14, droop: -0.07, m: M_COV, ci: 20 + i, tip: 0.65, nu: 6, nv: 2, th: 0.026 }); }
    for (let i = 0; i < 3; i++) card(B, { root: [0.02, -0.04, 0.07 + 0.006 * i], thA: -0.35 + 0.2 * i, len: 0.32 - 0.05 * i, wo: 0.03, wi: 0.06, cam: 0.1, droop: -0.05, m: M_SEC, ci: 30 + i, tip: 0.7, nu: 5, nv: 2, th: 0.024 });   // (the alula)
    return bsph(B.done()); }
  /* a primary's two pieces (each in the quill's frame: x along it): the base to the hinge, the hinge to the tip */
  function primMesh(i, part) { const B = GLM.builder(DQ()), p = PRI[i]; card(B, { root: [0, 0, 0], thA: 0, len: p[0], wo: p[1], wi: p[2], e0: p[3], e1: p[4], cam: 0.2, droop: 0, bow: PBOW, m: M_PRI, ci: i, tip: 0.84, nu: 7, nv: 4, th: 0.038, u0: part ? HG : 0, u1: part ? 1 : HG }); return bsph(B.done()); }
  function rectMesh() { const B = GLM.builder(DQ()); card(B, { root: [0, 0, 0], thA: 0, len: 1.02, wo: 0.095, wi: 0.115, cam: 0.16, droop: 0, bow: 0.01, m: M_REC, ci: 0, tip: 0.82, nu: 10, nv: 3, th: 0.036 }); return bsph(B.done()); }
  /* the air currents between the layers (see-through, emissive: GE-MAT 504): vA.y downstream, vA.z across */
  function airMesh(x0, x1, y0, y1, z, wav) { const B = GLM.builder(DQ());
    B.surf((u, v) => [lerp(x0, x1, v), lerp(y0, y1, u), z + wav * Math.sin(u * 5 + v * 3)], qn(8), qn(10), () => M_AIR, { e: u => u, a: (u, v) => Math.min(0.999, v) });
    return bsph(B.done()); }
  /* the build, a generator so the idle time can do it a piece at a time */
  let SH = null, BUILDING = null;
  function* gen() {
    const M = {}; M.body = bodyMesh(); yield; M.head = headMesh(); M.jaw = jawMesh(); M.eye = eyeMesh(); yield; M.leg = legMesh(); M.toe = toeMesh(); M.rect = rectMesh(); yield;
    M.wH = wHMesh(); yield; M.wF = wFMesh(); yield; M.wS = wSMesh(); M.wP = wPMesh(); yield; for (let i = 0; i < NPR; i++) { M['p' + i] = primMesh(i, 0); M['d' + i] = primMesh(i, 1); if (i % 3 === 2) yield; }
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
  const triCount = () => { let n = 0; if (SH) for (const k in SH) n += SH[k].ntri; return n; };

  /* ================= the rig ================= */
  /* named wing poses. The controls: elev (the shoulder's lift: + up), sweep (+ back), twist (+ the leading edge down), elbow and
     wrist (their flexion: 0 straight), bend (the hand's dihedral: + the tip up), fan (the primaries' spread: 0 folded .. 1 spread,
     past 1 splayed), curl (the primaries' tips lifting at their roots), flexI / flexM / flexO (each primary group's bend at its
     hinge: + up, the load of a downstroke), pron (the primaries' pronation about their shafts: + the leading vanes down, slots
     opening), trail (the secondaries' trailing edge about the forearm: + up) */
  const WK = ['elev', 'sweep', 'twist', 'elbow', 'wrist', 'bend', 'fan', 'curl', 'flexI', 'flexM', 'flexO', 'pron', 'trail'];
  const W0 = { flexI: 0, flexM: 0, flexO: 0, pron: 0, trail: 0 };
  const WP = {
    rest: Object.assign({}, W0, { elev: 0.05, sweep: 0.05, twist: 0, elbow: 0.25, wrist: 0.2, bend: 0.05, fan: 1, curl: 0.1 }),
    glide: Object.assign({}, W0, { elev: 0.14, sweep: 0.38, twist: 0.04, elbow: 0.62, wrist: 0.6, bend: 0.16, fan: 0.62, curl: 0.14, flexO: 0.12, flexM: 0.06 }),
    flare: Object.assign({}, W0, { elev: 0.58, sweep: -0.28, twist: -0.62, elbow: 0.22, wrist: 0.12, bend: 0.22, fan: 1.14, curl: 0.3, flexI: 0.1, flexM: 0.22, flexO: 0.34, pron: 0.35, trail: 0.22 }),
    fold: Object.assign({}, W0, { elev: 0.1, sweep: 1.35, twist: 0.1, elbow: 2.55, wrist: 2.75, bend: 0, fan: 0, curl: 0 }),
    top: Object.assign({}, W0, { elev: 1.04, sweep: 0.02, twist: -0.3, elbow: 0.3, wrist: 0.22, bend: -0.12, fan: 0.98, curl: -0.04, flexO: -0.1, pron: -0.25 }),
    bottom: Object.assign({}, W0, { elev: -0.8, sweep: -0.1, twist: 0.26, elbow: 0.16, wrist: 0.06, bend: 0.22, fan: 0.95, curl: 0.2 }),
    past: Object.assign({}, W0, { elev: -0.96, sweep: -0.04, twist: 0.2, elbow: 0.36, wrist: 0.3, bend: 0.2, fan: 0.82, curl: 0.12 }),
    mid: Object.assign({}, W0, { elev: 0.15, sweep: 0.34, twist: -0.5, elbow: 1.25, wrist: 1.45, bend: 0.1, fan: 0.4, curl: 0, pron: -0.35 }),
    widest: Object.assign({}, W0, { elev: 0.5, sweep: -0.1, twist: -0.02, elbow: 0.0, wrist: -0.06, bend: 0.1, fan: 1.18, curl: 0.04 }),
    raise: Object.assign({}, W0, { elev: 1.25, sweep: 0.06, twist: -0.36, elbow: 0.42, wrist: 0.3, bend: -0.16, fan: 0.9, curl: -0.06, flexO: -0.08, pron: -0.3 }),
  };
  function wmix(a, b, u, out) { out = out || {}; for (const k of WK) out[k] = lerp(a[k] || 0, b[k] || 0, u); return out; }
  /* the left wing's joints in the bird frame */
  function wingFrames(w) {
    const B0 = M3([0, 1, 0], [-1, 0, 0], [0, 0, 1]), RH = mm(rotZ(w.sweep), mm(rotX(w.elev), mm(B0, rotX(w.twist)))), RF = mm(RH, rotZ(-w.elbow)), RP = mm(RF, mm(rotZ(w.wrist), rotY(-w.bend)));
    const S = DIM.S, E = vadd(S, mv(RH, [DIM.Lh, 0, 0])), Wr = vadd(E, mv(RF, [DIM.Lf, 0, 0]));
    return { RH, RF, RP, S, E, Wr };
  }
  const primBeta = (i, fan) => Math.max(-0.08, lerp(betaF(i), betaS(i), fan) + (fan > 1 ? (fan - 1) * 0.35 * (0.5 - i / (NPR - 1)) : 0));
  const grp = (w, i) => { const f = i / (NPR - 1); return f < 0.5 ? lerp(w.flexI || 0, w.flexM || 0, f * 2) : lerp(w.flexM || 0, w.flexO || 0, f * 2 - 1); };
  /* the dissolve's order (P.spillO): the trailing feathers go first, the head last */
  const ORD = { rect: 0, d: 0.02, p: 0.12, airT: 0, airP: 0.05, airF: 0.1, wS: 0.2, wP: 0.22, toe: 0.3, leg: 0.36, wF: 0.34, wH: 0.45, jaw: 0.6, body: 0.52, head: 0.66, eye: 0.7 };
  /* P: { x, y, z (the body's centre, tiles, from the drawing origin), yaw, pitch (+ the nose up), roll (+ the left wing up), sc,
     wing (a pose), wingR (the right's, else the same), tail { fan, pitch (+ up), yaw (+ toward its left), roll }, head { yaw, pitch,
     roll } (added to the look), look (a world point the head tracks, inside its reach), leg (the legs' swing: + forward, - tucked
     back), grip (0 the toes spread, talons open .. 1 clenched), jaw 0..1, glow (the air currents), glow2 (a pulse of light), spill
     (the dissolve 0..1), spillO (the dissolve ordered: trailing feathers first), t, k (tier), fade(p) -> 0..1 }.
     Returns { inst, A (anchors, world), sh (the shadow's points: { p, r }), occ (occluder spheres, world), d2 (the painted eagle's
     outline points) } */
  function rig(P) {
    const out = { inst: [], A: {}, sh: [], occ: [], d2: { wings: [] } }, sc = P.sc || 1, low = lowFx(), k = P.k | 0;
    const Bw = mm(rotZ(P.yaw || 0), mm(rotY(-(P.pitch || 0)), rotX(P.roll || 0))), O = [P.x || 0, P.y || 0, P.z || 0];
    const W = p => vadd(O, mv(Bw, vmul(p, sc))), WR = R => colsK(mm(Bw, R), sc);
    const base = { glow: P.glow == null ? 1 : P.glow, glow2: P.glow2 || 0, spill: P.spill || 0, kind: k };
    const fade = p => (P.fade ? P.fade(p) : 1), S0 = P.spill || 0;
    const spillOf = part => { if (!P.spillO || !(S0 > 0)) return S0; const o = ORD[part] != null ? ORD[part] : ORD[part[0]] != null ? ORD[part[0]] : 0.3; return cl(S0 * 1.7 - o); };
    const I = (part, Rb, ob, ex) => { const o = W(ob), it = Object.assign({ part, R: WR(Rb), o, al: 1, wear: 0.5, outline: true }, base, ex); it.spill = spillOf(part); it.al = Math.min(it.al, fade(o)); out.inst.push(it); return it; };
    const occ = (p, r) => { out.occ.push(W(p), r * sc); };
    /* the body, the head (tracking P.look: the head held steady on its mark while the body moves), the jaw, the eyes */
    I('body', ID, [0, 0, 0], { wear: 0.13 });
    const hd = P.head || {}, N = DIM.N; let hy = hd.yaw || 0, hp = hd.pitch || 0;
    if (P.look) { const d = mtv(Bw, vsub(P.look, W(N))), hz = Math.hypot(d[0], d[1]); hy += Math.max(-1.3, Math.min(1.3, Math.atan2(d[1], d[0]))); hp += Math.max(-1.4, Math.min(0.7, Math.atan2(d[2], Math.max(1e-4, hz)))); }
    const hr = (hd.roll || 0) - 0.75 * (P.roll || 0) * Math.cos(hy), Rh = mm(rotZ(hy), mm(rotY(-hp), rotX(hr))), HQ = q => vadd(N, mv(Rh, q));
    I('head', Rh, N, { wear: 0.29 });
    I('jaw', mm(Rh, rotY(0.55 * cl(P.jaw || 0))), HQ([0.33, 0, 0.0]), { wear: 0.41 });
    for (const sg of [1, -1]) I('eye', mm(Rh, rotZ(sg * 0.95)), HQ([0.245, sg * 0.13, 0.065]), { outline: false, wear: 0.5 + sg * 0.1 });
    out.A.eyes = [W(HQ([0.27, 0.15, 0.065])), W(HQ([0.27, -0.15, 0.065]))]; out.A.beak = W(HQ([0.6, 0, -0.14])); out.A.head = W(HQ([0.12, 0, 0.08])); out.A.chest = W([0.42, 0, -0.15]); out.A.mouth = W(HQ([0.45, 0, -0.03]));
    out.A.belly = W([0.0, 0, -0.45]); out.A.Rh = Rh;
    occ([0.26, 0, -0.04], 0.44); occ([-0.32, 0, -0.02], 0.34); occ(HQ([0.1, 0, 0.06]), 0.2); occ([0.7, 0, 0.12], 0.2);
    /* the legs (the right mirrored), swung by P.leg; each foot's four toes spread and curled by the grip */
    const Rl = rotY(-(P.leg || 0)), gp = cl(P.grip == null ? 0.5 : P.grip), TOES = [[-0.42, 1], [0, 1.08], [0.42, 1], [Math.PI, 0.85]];
    out.A.talons = [];
    for (const sg of [1, -1]) { const MR = sg > 0 ? (R => R) : refM, MP = sg > 0 ? (p => p) : REF, ank = vadd([DIM.hip[0], DIM.hip[1], DIM.hip[2]], mv(Rl, DIM.ank));
      I('leg', MR(Rl), MP([DIM.hip[0], DIM.hip[1], DIM.hip[2]]), { wear: 0.61 });
      for (let j = 0; j < 4; j++) { const [a0, s] = TOES[j], hal = j === 3, ang = hal ? a0 : a0 * lerp(1.25, 0.55, gp), cu = lerp(-0.25, 1.15, gp) * (hal ? 0.9 : 1), Rt = mm(Rl, mm(rotZ(ang), mm(rotY(cu), M3([s, 0, 0], [0, s, 0], [0, 0, s]))));
        I('toe', MR(Rt), MP(ank), { wear: 0.62 + 0.01 * j, outline: false }); }
      out.A.talons.push(W(MP(vadd(ank, mv(Rl, [0.12, 0, -0.1]))))); }
    /* the tail: ten rectrices fanned about its root, pitched, yawed to steer, twisted */
    const tl = P.tail || {}, tf = tl.fan == null ? 0.7 : tl.fan, RT = mm(rotZ(tl.yaw || 0), mm(rotX(tl.roll || 0), rotY(tl.pitch || 0))), TB = DIM.TB;
    for (let i = 0; i < NRE; i++) { const f = (i - (NRE - 1) / 2) / ((NRE - 1) / 2), ph = f * tf * 0.62, root = vadd(TB, mv(RT, [0, f * 0.11, 0.016 * Math.abs(f)]));
      I('rect', mm(RT, mm(rotZ(Math.PI - ph), rotX(-0.04 * f))), root, { outline: false, wear: hash(i * 3.1 + 1), al: 1 }); }
    if (!low) I('airT', mm(RT, rotZ(Math.PI / 2)), TB, { al: 0.99, outline: false, wear: 0.83 });
    { const tipC = W(vadd(TB, mv(RT, [-1.0, 0, 0]))); out.A.tail = tipC; out.d2.tail = [W(vadd(TB, mv(RT, mv(rotZ(-tf * 0.62), [-1.02, 0, 0])))), tipC, W(vadd(TB, mv(RT, mv(rotZ(tf * 0.62), [-1.02, 0, 0]))))]; }
    /* the wings: each its bone groups, its secondaries on their hinge, its ten primaries in two pieces each, its air sheets */
    out.A.tips = []; out.A.trail = []; out.A.under = [];
    for (const sg of [1, -1]) {
      const w = sg > 0 ? (P.wing || WP.rest) : (P.wingR || P.wing || WP.rest), F = wingFrames(w), MR = sg > 0 ? (R => R) : refM, MP = sg > 0 ? (p => p) : REF;
      I('wH', MR(F.RH), MP(F.S), { wear: 0.71 }); I('wF', MR(F.RF), MP(F.E), { wear: 0.73 }); I('wP', MR(F.RP), MP(F.Wr), { wear: 0.75 });
      const RS = mm(F.RF, rotX(w.trail || 0)), oS = vadd(F.E, mv(F.RF, [0, 0.3, 0])); I('wS', MR(RS), MP(oS), { wear: 0.735 });
      const tips = [];
      for (let i = 0; i < NPR; i++) { const rt = primRoot(i), b = primBeta(i, w.fan), cu = (w.curl || 0) * (0.25 + 0.75 * i / (NPR - 1)) + 0.04, pr = (w.pron || 0) * (0.25 + 0.75 * i / (NPR - 1));
        const Rp = mm(F.RP, mm(rotZ(b), mm(rotY(-cu), rotX(0.06 * (i - 5) * (w.fan > 0.6 ? 1 : 0.3) + pr)))), o = vadd(F.Wr, mv(F.RP, rt)), fx = grp(w, i) * (0.7 + 0.3 * i / (NPR - 1));
        const hg = primHinge(i), Rd = mm(Rp, rotY(-fx)), od = vadd(o, vsub(mv(Rp, hg), mv(Rd, hg)));
        I('p' + i, MR(Rp), MP(o), { outline: false, wear: hash(i * 5.7 + (sg > 0 ? 2 : 9)) }); I('d' + i, MR(Rd), MP(od), { outline: false, wear: hash(i * 5.7 + (sg > 0 ? 2 : 9)) });
        tips.push(MP(vadd(od, mv(Rd, [PRI[i][0], 0, 0])))); }
      if (!low) { I('airF', MR(F.RF), MP(F.E), { al: 0.99, outline: false, wear: sg > 0 ? 0.11 : 0.37 }); I('airP', MR(F.RP), MP(F.Wr), { al: 0.99, outline: false, wear: sg > 0 ? 0.19 : 0.47 }); }
      // anchors: the tip (the longest primary's), the trailing edge (the secondaries' tips, then the primaries'), the space under the wing, the shadow's points
      const sec = [0, 0.5, 1].map(f => MP(vadd(oS, mv(RS, [f * DIM.Lf, 1.03, -0.02]))));
      out.A.tips.push(W(tips[7])); out.A.trail.push(sec.concat([tips[1], tips[4], tips[7]]).map(W));
      const S = MP(F.S), E = MP(F.E), Wr = MP(F.Wr), hT = MP(vadd(F.Wr, mv(F.RP, [DIM.Lp, 0, 0])));
      out.A.under.push([W(vlerp(S, E, 0.6)), W(vlerp(E, Wr, 0.6)), W(vlerp(Wr, tips[4], 0.6))]);
      occ(MP(vadd(vlerp(F.S, F.E, 0.35), mv(F.RH, [0, 0.12, -0.12]))), 0.2);
      out.sh.push({ p: W(vlerp(S, E, 0.5)), r: 0.62 * sc }, { p: W(E), r: 0.68 * sc }, { p: W(vlerp(E, Wr, 0.5)), r: 0.66 * sc }, { p: W(Wr), r: 0.6 * sc }, { p: W(tips[4]), r: 0.38 * sc }, { p: W(vlerp(Wr, tips[7], 0.5)), r: 0.5 * sc });
      out.d2.wings.push({ S: W(S), E: W(E), Wr: W(Wr), hT: W(hT), sec: sec.map(W), prim: tips.map(W), roots: Array.from({ length: NPR }, (_, i) => W(MP(vadd(F.Wr, mv(F.RP, primRoot(i)))))), sg });
    }
    out.sh.push({ p: W([0.2, 0, 0]), r: 0.55 * sc }, { p: W([-0.45, 0, 0]), r: 0.45 * sc }, { p: W([-1.3, 0, 0]), r: 0.36 * sc });
    out.d2.body = [W([-0.9, 0, 0]), W([0.0, 0, 0]), W([0.6, 0, 0.05]), W(N)]; out.A.O = O; out.A.Bw = Bw; out.A.sc = sc;
    return out;
  }

  /* ================= drawing ================= */
  /* V: { X0, Y0 (the drawing origin on screen), k (px a tile), cam (optional: CAM.side) }: a model point to the screen */
  const toS = (V, p) => (V.cam ? [V.X0 + vdot(p, V.cam.px) * V.k, V.Y0 + vdot(p, V.cam.py) * V.k] : [V.X0 + p[0] * V.k, V.Y0 + (p[1] * GY - p[2] * ZK) * V.k]);
  function visBox(c) { const m = c.getTransform ? c.getTransform() : null, cv = c.canvas; if (!m || !cv || !cv.width) return null; const det = m.a * m.d - m.b * m.c; if (Math.abs(det) < 1e-9) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [X, Y] of [[0, 0], [cv.width, 0], [0, cv.height], [cv.width, cv.height]]) { const dx = X - m.e, dy = Y - m.f, ux = (m.d * dx - m.c * dy) / det, uy = (-m.b * dx + m.a * dy) / det; x0 = Math.min(x0, ux); y0 = Math.min(y0, uy); x1 = Math.max(x1, ux); y1 = Math.max(y1, uy); }
    return [Math.floor(x0) - 2, Math.floor(y0) - 2, Math.ceil(x1) + 2, Math.ceil(y1) + 2]; }
  const PXB = [0.55e6, 0.38e6, 0.27e6, 0.27e6];   // (the pass's GL pixel budget in a fight by the visual quality: High, Balanced, Performance, its floor)
  const budget = () => { try { if (typeof GQ === 'undefined' || typeof arc === 'undefined' || !arc.game || arc.mode !== 'dungeon') return 1e12; return PXB[Math.max(0, Math.min(3, GQ.level() | 0))]; } catch (e) { return 1e12; } };
  const POOL = [], ITEMS = [], TRANS = [], OCC = new Float32Array(48); let NPOOL = 0;
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0, tris: 0 };
  /* the eagle on the GPU: one pass. Returns false when it cannot (the painted eagle then) */
  function drawGL(c, V, R, o) {
    o = o || {}; if (!ensure() || NOGL) return false;
    try {
      const k = V.k, X0 = V.X0, Y0 = V.Y0, cam = V.cam || CAM.game, CX = cam.px, CY = cam.py, CD = cam.pd; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; ITEMS.length = 0; TRANS.length = 0; NPOOL = 0;
      for (const it of R.inst) { const mesh = SH[it.part]; if (!mesh) continue; const al = it.al == null ? 1 : it.al; if (!(al > 0.004) || it.spill >= 0.999) continue;
        const Rw = it.R, bc = mesh.bs, ck = Math.max(vlen(Rw.x), vlen(Rw.y), vlen(Rw.z)), w = vadd(it.o, mv(Rw, [bc[0], bc[1], bc[2]])), rr = bc[3] * ck * 1.05 * k, sx = X0 + vdot(w, CX) * k, sy = Y0 + vdot(w, CY) * k;
        if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr;
        const g = POOL[NPOOL] || (POOL[NPOOL] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NPOOL++;
        g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i]; g.R1[i] = Rw.y[i]; g.R2[i] = Rw.z[i]; g.T[i] = it.o[i]; }
        g.alpha = al; g.glow = it.glow; g.glow2 = it.glow2; g.spill = it.spill; g.kind = it.kind; g.wear = it.wear; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = it.outline !== false && !(it.spill > 0.001); g.d = vdot(it.o, CD);
        (al < 0.995 ? TRANS : ITEMS).push(g); }
      if (!(bx1 > bx0) || !(ITEMS.length + TRANS.length)) return true;
      TRANS.sort((p, q) => p.d - q.d); for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__GE_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (lowFx() ? 0.8 : 1) * (typeof GQ !== 'undefined' && GQ.animaK ? GQ.animaK() : 1);
      bx0 = Math.floor(bx0) - 3; by0 = Math.floor(by0) - 3; bx1 = Math.ceil(bx1) + 3; by1 = Math.ceil(by1) + 3;
      const vb = visBox(c); if (vb) { bx0 = Math.max(bx0, vb[0]); by0 = Math.max(by0, vb[1]); bx1 = Math.min(bx1, vb[2]); by1 = Math.min(by1, vb[3]); if (!(bx1 > bx0 + 1 && by1 > by0 + 1)) return true; }   // (only what is on the canvas)
      const bw = bx1 - bx0, bh = by1 - by0; let W = Math.ceil(bw * dev), H = Math.ceil(bh * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      const bud = budget(); if (W * H > bud) { const q = Math.sqrt(bud / (W * H)); W = Math.max(2, Math.ceil(W * q)); H = Math.max(2, Math.ceil(H * q)); }
      // the shaped shadows: the body's, the head's and the wing roots' occluder spheres (Fewer effects: none)
      let nocc = 0; if (!lowFx() && R.occ) { for (let i = 0; i + 1 < R.occ.length && nocc < 12; i += 2) { const p = R.occ[i]; OCC[nocc * 4] = p[0]; OCC[nocc * 4 + 1] = p[1]; OCC[nocc * 4 + 2] = p[2]; OCC[nocc * 4 + 3] = R.occ[i + 1]; nocc++; } }
      const S = { px: CX, py: CY, pd: CD, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: CD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: lowFx(), rim: RIMC, amb: AMBC, t: (o.t || 0) % 600,
        outline: Math.max(0.8, 1.0 * (W / bw)), outlineCol: OUTC, outlineBias: 0.004, keep: 1, occ: nocc ? OCC : null, nocc };
      const t0 = nowMs(), cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return false;
      c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.items = ITEMS.length; STATS.W = W; STATS.H = H; STATS.tris = GLM.stats ? GLM.stats.tris : 0;
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
  /* a studio portrait (tests, the contact sheets): the rig P drawn at screen (x, y) with T px a tile; o.d2: the painted eagle;
     o.side: the level side view */
  function studio(c, x, y, P, o) { o = o || {}; const R = rig(P), V = { X0: x, Y0: y, k: o.T || 30, cam: o.side ? CAM.side : null };
    if (o.d2 || !drawGL(c, V, R, { t: P.t })) { draw2D(c, V, R, { spill: P.spill }); return { R, gl: false }; } return { R, gl: true }; }
  return { usable, warm, ensure, step, release, gpuCount, triCount, rig, wmix, WP, WK, drawGL, draw2D, toS, studio, DIM, GY, ZK, CAM, STATS, get off() { return NOGL; }, set noGL(v) { NOGL = !!v; }, get ready() { return !!SH; } };
})();
if (typeof self !== 'undefined') self.GOLDEAGLE_GL = GOLDEAGLE_GL;
