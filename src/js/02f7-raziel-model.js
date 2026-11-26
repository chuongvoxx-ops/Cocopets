/* ---------- (v464 RZ-M) Raziel, The Twin Revelation: the Gemini Anima (Zodiac Anima No. 03) as a real 3D model on GLM ----------
   A colossal quadrupedal two-headed biomechanical dragon of Fire and Ice, modelled after the user's concept sheet (kept out of the repo).
   Its own left is Lux (fire: ivory ceramic, burnished gold, dark titanium, molten conduits), its right Umbra (ice: silver-white ceramic,
   platinum, dark cobalt, sapphire crystal, cyan conduits); the torso between them carries both (each vertex's side by its place).
   - the torso: a deep armoured barrel (layered ceramic plates, gold / platinum rims, a dorsal ridge of blades, a segmented belly), the
     Gemini Core in its chest: two reactors side by side in an ornate frame (Lux: a turbulent plasma sun with prominences inside
     rotating gold containment rings; Umbra: a snowflake crystal nucleus in a faceted shell inside platinum rings; a crystal between).
   - two necks of articulated vertebrae (each a drum, a gold joint ring, a ventral scute, side plates, a dorsal fin, conduits), solved
     every frame as a spline from the shoulders to each head; two distinct skulls (Lux long, angular, regal, gold horns; Umbra sharper,
     crystalline horns, layered frost cheek plates, long crystal fangs), hinged jaws, throat machinery (a furnace / a cryo turbine).
   - two Mirror Crowns behind the heads: thick bevelled astrolabe rings (solar blades / frost spikes), a runed band, gyroscopic
     meridians, all turning on their own.
   - two colossal wings: a mechanical shoulder, three armoured bones (humerus, forearm, hand) with ornate plates at the joints, and fans of
     thick feather-blades (gold with molten edges / platinum with sapphire crystal panels) in two or three layers, each blade lagging on
     its own spring (secondary motion).
   - four armoured legs (two-bone IK to planted feet, a lateral-sequence walk, weight shifting off each lifted foot), clawed feet; a long
     segmented tail (a world-space filter: the tip lags) ending in a double blade (a fire prong and an ice prong).
   Forms (k 1 base, 2 level 4, 3 level 7): The Twin Revelation, The Mirrored Sovereign (larger wings, more blades, more horns, extra
   core rings), The Divine Equation (multi-layered wings, vast crowns, more armour and circuitry). Materials: GLM ids 600..612
   (20k5uz RZ-MAT; uWear the side: 0 Lux, 1 Umbra, 2 by the vertex's own y; uFx 1 / 2 the spectral plasma / crystal replica).
   Everything is procedural geometry built once in idle-time slices into GLM meshes, posed every frame from the pose state S that the
   moves own (see api: aims, jaws, charges, core and crown states, wings, flight, gait, entrance, dissolve); the model keeps its own springs
   on S._rz. draw(c, x, y, size, S, opts) renders it into the 2D canvas and returns the anchors the effects attach to; solve() gives the
   same anchors without the GPU. Real-GPU WebGL only (window.__RZ_GL = 1 / __NG_GL = 1 force it on a software rasteriser for the tests;
   __RZ_GL = 0 turns it off): without it AnimaArt draws the existing art of the Gemini Anima (no new 2D fallback). */
const RAZIEL_GL = (() => {
  const TAU = Math.PI * 2, EL = 0.62, SE = Math.sin(EL), CE = Math.cos(EL);
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1], MY = [1, 0, 0, 0, -1, 0, 0, 0, 1];
  const mm = (A, B) => { const R = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; };
  const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const scl3 = (a, b, c) => [a, 0, 0, 0, b == null ? a : b, 0, 0, 0, c == null ? a : c];
  function axisR(u, a) { const [x, y, z] = norm(u), c = Math.cos(a), s = Math.sin(a), C = 1 - c; return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; }
  function frameZ(d, xh) { const z = norm(d); let x = sub(xh || [1, 0, 0], mul(z, dot(z, xh || [1, 0, 0]))); if (len(x) < 1e-4) x = sub([0, 1, 0], mul(z, z[1])); if (len(x) < 1e-4) x = [1, 0, 0]; x = norm(x); const y = cross(z, x); return [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]; }
  const colsR = (x, y, z) => [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const WS = 0.1;
  /* the materials (20k5uz RZ-MAT, ids 600..612; a fraction .2 / .3 picks a variant: never .5 or more) */
  const MT = { CER: 600, MET: 601, TI: 602, CH: 603, EYE: 604, PL: 605, CRY: 606, FTH: 607, RUNE: 608, LIT: 609, MOU: 610, FANG: 611, MOTE: 612 };
  const bz = (P, u) => { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };
  const bzd = (P, u) => { const v = 1 - u, a = -3 * v * v, b = 3 * v * v - 6 * u * v, c = 6 * u * v - 3 * u * u, d = 3 * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };

  /* ================= the mesh helpers (as Samael's, Belial's and Asmodeus's) ================= */
  /* an armour plate: a thick curved shell along a centreline (4 cubic points o.c), half width o.w(u), cupped by o.cup, thickness o.th;
     edge 1 on its rims (the material's metal trim) */
  function plate(B, o) {
    const P = o.c, nu = o.nu || 10, nv = o.nv || 3, cup = o.cup || 0, N0 = norm(o.nrm || [0, 0, 1]), lft = o.lift || 0, m = o.mat == null ? MT.CER : o.mat;
    const FR = []; for (let i = 0; i <= nu; i++) { const u = i / nu, C = bz(P, u), T = norm(bzd(P, Math.min(0.995, Math.max(0.005, u)))); let S = cross(T, N0); if (len(S) < 1e-4) S = cross(T, [0, 0, 1]); S = norm(S); FR.push({ C, T, S, N: cross(S, T) }); }
    const F = u => FR[Math.max(0, Math.min(nu, Math.round(u * nu)))];
    const wid = u => Math.max(0.004, o.w(u)), thk = () => o.th || 0.1;
    const mid = (u, v) => { const f = F(u), w = wid(u); return add(add(f.C, mul(f.S, w * v)), mul(f.N, cup * w * (v * v - 0.35) + lft)); };
    const t0 = o.trim0 == null ? 0.78 : o.trim0, trim = v => sstep(t0, 0.985, Math.abs(v));
    const face = (sg, mt) => B.surf((u, s) => { const v = s * 2 - 1, f = F(u); return add(mid(u, v), mul(f.N, sg * thk(u) * 0.5)); }, nu, nv, () => mt, { flip: sg > 0, e: (u, s) => Math.max(trim(s * 2 - 1), o.endTrim ? sstep(0.88, 1, Math.abs(u * 2 - 1)) * (o.endTrim === 2 ? (u > 0.5 ? 1 : 0) : 1) : 0) });
    face(1, m); face(-1, o.under == null ? MT.TI + 0.2 : o.under);
    const rim = (vs, flip) => B.surf((u, s) => { const f = F(u), th = thk(u), a = Math.PI * s; return add(add(mid(u, vs), mul(f.N, Math.cos(a) * th * 0.5)), mul(f.S, vs * Math.sin(a) * th * 0.42)); }, nu, 2, () => (o.rimMat == null ? MT.MET : o.rimMat), { flip, e: () => 1 });
    rim(-1, false); rim(1, true);
    for (const ue of [0, 1]) if (wid(ue) > 0.03) B.surf((v01, s2) => { const v = v01 * 2 - 1, f = F(ue); return add(mid(ue, v), mul(f.N, (s2 - 0.5) * thk(ue))); }, 4, 1, () => (o.rimMat == null ? MT.MET : o.rimMat), { flip: ue === 1, e: () => 1 });
  }
  /* a strip on a surface along a polyline (normals nrm(i)), w wide; aux 0..1 along it, edge 0..1 across */
  function strip(B, pts, nrm, w, mat, lift, a0, a1) {
    const n = pts.length, lf = lift == null ? 0.02 : lift, A0 = a0 == null ? 0 : a0, A1 = a1 == null ? 1 : a1;
    B.surf((u, v) => { const i = Math.round(u * (n - 1)), p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], T = norm(sub(b, a)), N = nrm(i), S = norm(cross(T, N)), tp = Math.min(1, Math.min(i, n - 1 - i) * 0.6 + 0.4);
      return add(add(p, mul(N, lf)), mul(S, (v - 0.5) * w * tp)); }, n - 1, 1, () => mat, { flip: true, e: (u, v) => v, a: u => lerp(A0, A1, u) });
  }
  /* a tube swept along a polyline (radius r(u)), aux along it */
  function sweep(B, pts, r, mat, seg, edge, upH) {
    const n = pts.length; B.surf((u, v) => { const i = Math.round(u * (n - 1)), p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], T = norm(sub(b, a)); let X = cross(T, upH || [0, 0, 1]); if (len(X) < 1e-3) X = cross(T, [1, 0, 0]); X = norm(X); const Y = cross(T, X), ph = v * TAU, rr = r(u);
      return add(p, add(mul(X, Math.cos(ph) * rr), mul(Y, Math.sin(ph) * rr))); }, n - 1, seg || 8, () => mat, { flip: true, e: () => (edge == null ? 0.2 : edge), a: u => u });
  }
  const latheZ = (B, prof, m, seg, c) => { B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], c || [0, 0, 0]); B.lathe(prof, m, { seg: seg || 18, edge: j => (prof[j][3] || 0) }); B.pop(); };
  const latheX = (B, prof, m, seg, c) => { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], c || [0, 0, 0]); B.lathe(prof, m, { seg: seg || 18, edge: j => (prof[j][3] || 0) }); B.pop(); };
  // a faceted gem: an icosahedron split (80 / 320 flat facets), each vertex a little off the sphere (facet edges carry edge 1)
  function gem(B, r, mat, sub2, jit) {
    const t = (1 + Math.sqrt(5)) / 2; let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < (sub2 || 0); s++) { const cache = {}, midp = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] == null) { cache[k] = V.length; V.push(norm(mul(add(V[a], V[b]), 0.5))); } return cache[k]; }, F2 = [];
      for (const [a, b, c] of F) { const ab = midp(a, b), bc = midp(b, c), ca = midp(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = F2; }
    const P = V.map((v, i) => mul(v, r * (1 + (jit || 0) * (hash(i * 3.7 + 1.3) - 0.5))));
    for (const f of F) B.facet(f.map(i => P[i]), mat);
  }
  /* a thick bevelled ring round the frame's z axis: radius R, radial half width w, axial half depth d, bevel b (a rectangle swept round:
     its faces flat, its edges chamfered and carrying edge 1: real thickness), from angle a0 to a1 */
  function bring(B, R, w, d, b, m, seg, a0, a1, mIn) {
    const pr = [[-d, R - w + b, mIn == null ? m : mIn, 0.2], [-d + b, R - w, mIn == null ? m : mIn, 1], [d - b, R - w, mIn == null ? m : mIn, 1], [d, R - w + b, m, 1], [d, R + w - b, m, 0.15], [d - b, R + w, m, 1], [-d + b, R + w, m, 1], [-d, R + w - b, m, 1], [-d, R - w + b, m, 0.15]];
    if (a0 == null) { latheZ(B, pr, m, seg); return; }
    B.surf((u, v) => { const j = Math.min(pr.length - 1, Math.round(v * (pr.length - 1))), a = lerp(a0, a1, u); return [Math.cos(a) * pr[j][1], Math.sin(a) * pr[j][1], pr[j][0]]; }, seg, pr.length - 1, (u, v) => pr[Math.min(pr.length - 1, Math.round(v * (pr.length - 1)))][2], { e: (u, v) => pr[Math.min(pr.length - 1, Math.round(v * (pr.length - 1)))][3] });
  }

  /* ================= the anatomy (model units; x forward, y its left (Lux), z up; the floor at z 0) ================= */
  /* the barrel: sections along x (x, half width, half height, centre height): the deep chest and broad shoulders forward round the Gemini
     Core, a narrower waist, strong haunches */
  const TB = [[-5.0, 0.8, 0.8, 6.55], [-4.3, 1.45, 1.4, 6.45], [-3.2, 1.7, 1.6, 6.35], [-1.9, 1.62, 1.6, 6.35], [-0.6, 1.72, 1.78, 6.45], [0.7, 2.05, 2.05, 6.6], [1.9, 2.3, 2.3, 6.75], [3.0, 2.25, 2.25, 6.75], [3.8, 2.0, 2.0, 6.75], [4.35, 1.3, 1.45, 7.05]];
  function tb(x) { if (x <= TB[0][0]) return TB[0].slice(1); for (let i = 1; i < TB.length; i++) if (x <= TB[i][0]) { const a = TB[i - 1], b = TB[i], u = sstep(a[0], b[0], x); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } return TB[TB.length - 1].slice(1); }
  const se = (c, p) => Math.sign(c) * Math.pow(Math.abs(c), 2 / p);
  const bodyPt = (x, ph, o) => { const [w, h, zc] = tb(x), k = o || 0; return [x, (w + k) * se(Math.cos(ph), 2.5), zc + (h + k) * se(Math.sin(ph), 2.5)]; };
  const bodyN = (x, ph) => { const a = bodyPt(x, ph), b = bodyPt(x, ph + 0.02), c = bodyPt(x + 0.02, ph); return norm(cross(sub(c, a), sub(b, a))); };
  const BODYC = [0, 0, 6.5];
  /* the Gemini Core: the two reactors side by side in the chest (y +/- CY), facing forward */
  const TSC = 1.38, TS = p => [p[0] * TSC, p[1] * TSC, 6.5 + (p[2] - 6.5) * TSC];   // (the torso is built at 1 and drawn TSC larger about its centre: its anchors below scaled with it)
  const CORE0 = [4.3, 1.15, 6.45], CRAD0 = 1.08, CORE = TS(CORE0), CRAD = CRAD0 * TSC;
  /* the necks: roots on the shoulders, the heads' resting pivots (the back of the skull) */
  const NROOT0 = [2.75, 1.3, 8.55], NROOT = TS(NROOT0), HREST = [5.7, 4.6, 18.2], NNS = [0, 13, 14, 15];
  /* the wings: the mount on the back, the bones' lengths by form */
  const WROOT0 = [0.75, 1.7, 8.95], WROOT = TS(WROOT0), WSZ = 1.6, WLEN = [[0, 0, 0], [4.4, 5.8, 5.4], [4.7, 6.2, 5.9], [5.1, 6.7, 6.5]].map(a => a.map(v => v * WSZ));
  const NBL = [0, 14, 17, 20], NCV = [0, 8, 10, 11], NB3 = [0, 6, 8, 10];
  /* the legs: hip (x, y, z), foot home (x, y), the bones' lengths, the knee's bend (-1 the elbow back, +1 the knee forward), the walk's phase */
  const LEGS = [
    { x: 2.55, y: 1.75, z: 6.0, fx: 3.0, fy: 2.75, L1: 3.15, L2: 2.95, kd: -1, off: 0.0, s: 1, f: 1 },
    { x: 2.55, y: -1.75, z: 6.0, fx: 3.0, fy: -2.75, L1: 3.15, L2: 2.95, kd: -1, off: 0.5, s: -1, f: 1 },
    { x: -3.05, y: 1.6, z: 6.05, fx: -3.25, fy: 2.55, L1: 3.3, L2: 3.0, kd: 1, off: 0.75, s: 1, f: 0 },
    { x: -3.05, y: -1.6, z: 6.05, fx: -3.25, fy: -2.55, L1: 3.3, L2: 3.0, kd: 1, off: 0.25, s: -1, f: 0 }];
  for (const L of LEGS) { const h = TS([L.x, L.y, L.z]); L.x = h[0]; L.y = h[1]; L.z = h[2]; L.fx *= TSC; L.fy *= TSC; L.L1 *= 1.08; L.L2 *= 1.08; }
  const AH = 1.05, STRIDE = 4.2, SW0 = 0.27, SW1 = 0.42, LIFTH = 1.05;
  /* the tail: its root, segments by form */
  const TROOT0 = [-4.95, 0, 6.6], TROOT = TS(TROOT0), NTS = [0, 20, 22, 24];
  /* the Mirror Crowns: radius by form */
  const CRR = [0, 2.9, 3.25, 3.6];
  /* each form's height (model units: to the top of the horns at rest) for its size */
  const HEIGHT = [0, 22.0, 22.6, 23.3];
  /* the default heading (a world angle: toward the camera and a little to its left: the concept's three-quarter front view, Lux on the
     viewer's left, Umbra on the right, the core facing the viewer) and how far from facing the camera it ever turns (S.faceFree lifts it) */
  const FACE0 = 1.775, YAWLIM = 1.05, WING0 = 0.75;

  let D = null;
  function* gen(qq, OUT) {
    const q = qq * (lowFx() ? 0.7 : 1), M = {}, Q = n => Math.max(3, Math.round(n * q));
    const mk = f => { const B = GLM.builder(q); f(B); return B.done(); };
    /* a big jagged spike: a metal horn (gold on Lux's side, platinum on Umbra's) with a tip of the element (molten orange / sapphire crystal:
       611.3), a notch partway up (jagged) */
    const spk = (B, a, b, r, o) => { o = o || {}; const th = o.thin == null ? 0.45 : o.thin, up = o.up, m = lerp3(a, b, 0.66), d = sub(b, a);
      B.crystal(a, m, r, o.mat == null ? MT.MET : o.mat, { n: 4, thin: th, belly: 0.25, base: 1, up, bend: o.bend || 0, seed: o.seed || 0 });
      B.crystal(lerp3(a, b, 0.56), b, r * 0.66, MT.FANG + 0.3, { n: 4, thin: th, belly: 0.12, base: 1, up, bend: o.bend || 0, seed: o.seed || 0 });
      if (o.jag !== false && len(d) > 0.6) { const n2 = norm(cross(d, up || [0, 0, 1])); B.crystal(lerp3(a, b, 0.38), add(lerp3(a, b, 0.52), mul(n2, len(d) * 0.16)), r * 0.42, MT.FANG + 0.3, { n: 4, thin: th, belly: 0.2, base: 1, up }); } };
    /* ---- the torso (one mesh, both sides: the shader takes each vertex's side from its own y) ---- */
    M.torso = mk(B => {
      B.surf((u, v) => bodyPt(lerp(TB[0][0], TB[TB.length - 1][0], u), v * TAU), Q(30), Q(40), () => MT.TI + 0.2, { flip: true, e: () => 0 });
      // the layered flank plates: rows round the barrel, each overlapping the one behind it (shingled backward), rimmed in metal
      const rows = [{ ph: 0.95, w: 0.62 }, { ph: 0.42, w: 0.66 }, { ph: -0.12, w: 0.62 }, { ph: -0.62, w: 0.5 }];
      for (const s of [1, -1]) for (let r = 0; r < rows.length; r++) for (let j = 0; j < 7; j++) {
        const x0 = 3.0 - j * 1.17 - (r % 2) * 0.45, x1 = x0 - 1.55; if (x1 < -4.6) continue; const ph = s * (Math.PI / 2 - rows[r].ph) * 1 + (s > 0 ? 0 : 0), phU = s > 0 ? Math.PI / 2 - rows[r].ph : -(Math.PI / 2 - rows[r].ph);
        const p0 = bodyPt(x0, phU, 0.06), p1 = bodyPt(lerp(x0, x1, 0.35), phU, 0.14), p2 = bodyPt(lerp(x0, x1, 0.7), phU, 0.13), p3 = bodyPt(x1, phU, 0.04), nn = bodyN(lerp(x0, x1, 0.5), phU);
        plate(B, { c: [p0, p1, p2, p3], nrm: nn, w: u => rows[r].w * (0.75 + 0.35 * Math.sin(Math.PI * u)) * (u > 0.82 ? 1 - (u - 0.82) * 2.2 : 1), cup: -0.22, th: 0.1, nu: Q(8), nv: 2, mat: MT.CER + (((j + r) % 3) ? 0 : 0.3), trim0: 0.72, endTrim: 2 });
        void ph; }
      // the dorsal ridge: blades along the spine from the withers to the croup, a metal keel under them
      { const pts = []; for (let i = 0; i <= 20; i++) pts.push(bodyPt(lerp(2.6, -4.7, i / 20), Math.PI / 2, 0.02)); sweep(B, pts, u => 0.16 - 0.06 * u, MT.MET, Q(8), 0.6); }
      for (let j = 0; j < 9; j++) for (const sg of [1, -1]) { const x = 2.4 - j * 0.85, p = bodyPt(x, Math.PI / 2 - sg * 0.28, 0.05), h = 3.3 - 0.17 * j; spk(B, add(p, [0.3, 0, -0.1]), add(p, [-1.35, sg * 0.6, h]), 0.32, { thin: 0.35, up: [0, 1, 0], bend: 0.08, seed: j }); }
      for (let j = 0; j < 9; j++) { const x = 2.2 - j * 0.82, p = bodyPt(x, Math.PI / 2, 0.05), h = 0.95 - 0.06 * j; B.crystal(add(p, [0.25, 0, -0.05]), add(p, [-0.55, 0, h]), 0.2, MT.CER + 0.3, { n: 4, thin: 0.32, up: [0, 1, 0], belly: 0.35 }); B.crystal(add(p, [0.3, 0, 0.0]), add(p, [-0.2, 0, h * 0.6]), 0.1, MT.MET, { n: 4, thin: 0.5, up: [0, 1, 0] }); }
      // the belly: segmented plates under the barrel
      for (let j = 0; j < 8; j++) { const x = 3.1 - j * 0.95, p = bodyPt(x, -Math.PI / 2, 0.05); plate(B, { c: [add(p, [0.32, -1.15, 0.45]), add(p, [0.5, -0.45, 0.02]), add(p, [0.5, 0.45, 0.02]), add(p, [0.32, 1.15, 0.45])], nrm: [0.25, 0, -1], w: () => 0.42, cup: 0.12, th: 0.09, nu: Q(8), nv: 2, mat: MT.CER + 0.2, trim0: 0.7 }); }
      // the chest: the Gemini Core's frame: two sockets, rimmed (gold for Lux, platinum for Umbra by their side), a divider, a crystal
      for (const s of [1, -1]) { const c = [CORE0[0] - 0.32, s * CORE0[1], CORE0[2]];
        B.ell(add(c, [-0.1, 0, 0]), [0.5, CRAD0 * 1.12, CRAD0 * 1.12], MT.TI + 0.3, { seg: Q(28), rings: Q(8), th0: 0, th1: Math.PI }); // (the dark well)
        B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], add(c, [0.24, 0, 0])); bring(B, CRAD0 * 1.2, 0.13, 0.14, 0.05, MT.MET, Q(48)); B.tor([0, 0, -0.1], CRAD0 * 1.42, 0.05, MT.MET + 0.2, { seg: Q(48), rseg: 4, teeth: 24, tooth: 0.04 }); B.pop();
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, d = [0, Math.cos(a), Math.sin(a)]; B.box(add(c, add([0.22, 0, 0], mul(d, CRAD0 * 1.33))), [0.09, 0.07, 0.07], 0.03, MT.TI); } }
      // the divider between them: a tall gilded spine with a crystal below and a crescent over the pair
      { const cx = CORE0[0] - 0.05; plate(B, { c: [[cx, 0, CORE0[2] + 1.35], [cx + 0.18, 0, CORE0[2] + 0.5], [cx + 0.2, 0, CORE0[2] - 0.5], [cx + 0.05, 0, CORE0[2] - 1.35]], nrm: [1, 0, 0], w: u => 0.17 + 0.08 * Math.sin(Math.PI * u), cup: -0.2, th: 0.14, nu: Q(10), nv: 2, mat: MT.MET, trim0: 0.6 });
        B.crystal([cx + 0.25, 0, CORE0[2] - 1.0], [cx + 0.35, 0, CORE0[2] - 1.85], 0.24, MT.CRY + 0.2, { n: 4, belly: 0.4, base: 0.4, up: [1, 0, 0] });
        B.crystal([cx + 0.25, 0, CORE0[2] - 1.0], [cx + 0.3, 0, CORE0[2] - 0.55], 0.24, MT.CRY + 0.2, { n: 4, belly: 0.5, base: 0.4, up: [1, 0, 0] });
        const arc = []; for (let i = 0; i <= 24; i++) { const a = lerp(-1.25, 1.25, i / 24); arc.push([cx + 0.1 - 0.35 * Math.abs(Math.sin(a)), Math.sin(a) * 2.25, CORE0[2] + 0.15 + Math.cos(a) * 1.55]); } sweep(B, arc, u => 0.09 + 0.05 * Math.sin(Math.PI * u), MT.MET, Q(7), 0.7);
        const arc2 = []; for (let i = 0; i <= 24; i++) { const a = lerp(-1.1, 1.1, i / 24); arc2.push([cx - 0.05 - 0.3 * Math.abs(Math.sin(a)), Math.sin(a) * 2.15, CORE0[2] - 0.2 - Math.cos(a) * 1.5]); } sweep(B, arc2, u => 0.07 + 0.04 * Math.sin(Math.PI * u), MT.MET, Q(7), 0.7); }
      // the breast plates framing the core (left and right), the shoulder pauldrons over the forelegs
      for (const s of [1, -1]) {
        plate(B, { c: [[3.95, s * 0.35, 8.45], [4.35, s * 1.4, 8.25], [4.25, s * 2.15, 7.4], [3.65, s * 2.4, 6.3]], nrm: [1, s * 0.5, 0.4], w: u => 0.36 + 0.12 * Math.sin(Math.PI * u), cup: -0.3, th: 0.12, nu: Q(10), nv: 2, mat: MT.CER + 0.3, trim0: 0.68, endTrim: true });
        plate(B, { c: [[3.75, s * 0.55, 4.75], [4.05, s * 1.45, 4.85], [3.9, s * 2.1, 5.35], [3.35, s * 2.35, 6.0]], nrm: [1, s * 0.5, -0.4], w: u => 0.3 + 0.1 * Math.sin(Math.PI * u), cup: -0.25, th: 0.11, nu: Q(10), nv: 2, mat: MT.CER, trim0: 0.7, endTrim: true });
        for (let i = 0; i < 3; i++) plate(B, { c: [[3.7 - i * 0.45, s * (1.6 + i * 0.12), 8.7 - i * 0.12], [3.1 - i * 0.45, s * (2.45 + i * 0.1), 8.4 - i * 0.2], [2.2 - i * 0.45, s * (2.6 + i * 0.08), 7.4 - i * 0.2], [1.6 - i * 0.45, s * (2.45 + i * 0.05), 6.6 - i * 0.2]], nrm: [0.2, s, 0.55], w: u => (0.62 - i * 0.08) * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.3), cup: -0.3, th: 0.12, nu: Q(10), nv: 2, mat: MT.CER + (i === 1 ? 0.3 : 0), trim0: 0.72, endTrim: true });
        for (let i = 0; i < 4; i++) spk(B, [4.3 - i * 0.12, s * (0.9 + i * 0.45), 8.3 - i * 0.55], [4.75 - i * 0.05, s * (1.5 + i * 0.6), 9.25 - i * 0.7], 0.12, { up: [1, 0, 0], jag: false });
        for (let i = 0; i < 3; i++) spk(B, [3.2 - i * 0.6, s * 2.55, 8.55 - i * 0.25], [2.4 - i * 0.62, s * 3.6, 10.6 - i * 0.35], 0.2, { up: [0, s, 0] });
        if (0) B.crystal([3.2 - i * 0.6, s * 2.55, 8.55 - i * 0.25], [2.6 - i * 0.62, s * 3.25, 9.55 - i * 0.25], 0.13, MT.MET, { n: 4, thin: 0.4, up: [0, s, 0] });
        // the haunch armour over the hind legs
        for (let i = 0; i < 2; i++) plate(B, { c: [[-1.9 - i * 0.4, s * (1.55 + i * 0.1), 7.6 - i * 0.1], [-2.6 - i * 0.4, s * (2.05 + i * 0.1), 7.7 - i * 0.15], [-3.6 - i * 0.4, s * (2.05 + i * 0.1), 7.2 - i * 0.15], [-4.3 - i * 0.4, s * (1.6 + i * 0.1), 6.6 - i * 0.15]], nrm: [-0.1, s, 0.6], w: u => (0.66 - i * 0.12) * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.35), cup: -0.3, th: 0.12, nu: Q(10), nv: 2, mat: MT.CER + (i ? 0.3 : 0), trim0: 0.72, endTrim: true });
        // conduits: a channel from each reactor round the flank and up the neck root (molten on Lux's side, cyan on Umbra's)
        { const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16, x = lerp(3.7, -3.6, u), ph = s * lerp(0.2, 0.55, Math.sin(Math.PI * u)); pts.push(bodyPt(x, ph, 0.03)); } strip(B, pts, i => bodyN(pts[i][0], s * lerp(0.2, 0.55, Math.sin(Math.PI * i / 16))), 0.12, MT.CH, 0.012); }
        { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([lerp(3.9, NROOT0[0] - 0.1, u), s * lerp(1.6, NROOT0[1] + 0.55, u), lerp(7.2, NROOT0[2] - 0.2, u)]); } strip(B, pts, () => norm([0.6, s * 0.7, 0.3]), 0.1, MT.CH, 0.03); }
        // the neck's socket: a collar ring at the root of each neck; the wing's mount (a mechanical boss on the back)
        B.push([0.25, 0, 0.97], [0, 1, 0], [-0.97, 0, 0.25], [NROOT0[0] - 0.12, s * NROOT0[1], NROOT0[2] - 0.35]); B.lathe([[-0.3, 0.95, MT.TI], [0.0, 1.05, MT.MET, 1], [0.18, 0.98, MT.MET, 1], [0.32, 0.86, MT.TI]], MT.TI, { seg: Q(22), edge: j => (j === 1 || j === 2 ? 1 : 0) }); B.pop();
        B.ell([WROOT0[0], s * (WROOT0[1] - 0.1), WROOT0[2] - 0.55], [1.05, 0.75, 0.6], MT.TI + 0.2, { seg: Q(16), rings: Q(8) });
        B.push([0, 0, 1], [1, 0, 0], [0, s, 0], [WROOT0[0], s * (WROOT0[1] - 0.15), WROOT0[2] - 0.35]); bring(B, 0.78, 0.12, 0.12, 0.04, MT.MET, Q(32)); B.pop();
      }
      // the tail's socket
      B.push([-1, 0, 0], [0, 1, 0], [0, 0, 1], add(TROOT0, [0.25, 0, 0])); B.lathe([[0, 0.95, MT.TI], [0.15, 1.0, MT.MET, 1], [0.32, 0.92, MT.MET, 1], [0.5, 0.82, MT.TI]], MT.TI, { seg: Q(22), edge: j => (j === 1 || j === 2 ? 1 : 0) }); B.pop();
    }); yield;
    /* ---- a neck vertebra (unit length along +z, unit radius; +x its throat side (ventral), -x its back): a dark drum, a gold joint ring,
       the ventral scute (a wide plate wrapping the throat side, overlapping the next), side plates, a dorsal fin, conduits; by form ---- */
    const nvert = (B, k) => {
      latheZ(B, [[-0.1, 0.78, MT.TI], [0.0, 0.86, MT.TI + 0.2, 0.3], [0.62, 0.86, MT.TI + 0.2], [0.7, 0.98, MT.MET, 1], [0.84, 1.0, MT.MET, 1], [0.92, 0.88, MT.TI], [1.12, 0.8, MT.TI]], MT.TI, Q(18));
      // the scale-plates clad round the vertebra (a ring of six, shingled down the neck: each overlaps the next one below it), the widest the
      // ventral scute on the throat side, the dorsal one under the fin
      for (const [a, w, m] of [[0, 1.0, MT.CER], [0.95, 0.72, MT.CER + 0.3], [-0.95, 0.72, MT.CER + 0.3], [1.95, 0.66, MT.CER], [-1.95, 0.66, MT.CER], [Math.PI, 0.62, MT.CER + 0.3]]) {
        const d = [Math.cos(a), Math.sin(a), 0]; plate(B, { c: [add(mul(d, 0.9), [0, 0, -0.08]), add(mul(d, 1.16), [0, 0, 0.32]), add(mul(d, 1.2), [0, 0, 0.74]), add(mul(d, 1.06), [0, 0, 1.16])], nrm: d, w: u => w * Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * u)), 0.3) * (1 - 0.15 * u), cup: -0.7, th: 0.12, nu: Q(7), nv: 3, mat: m, trim0: 0.74, endTrim: 2 }); }
      spk(B, [-1.0, 0, 0.2], [-2.35 - 0.2 * k, 0, 1.25], 0.28, { thin: 0.3, up: [0, 1, 0] }); if (0) B.crystal([-1.0, 0, 0.25], [-1.85 - 0.15 * k, 0, 1.1], 0.24, MT.MET, { n: 4, thin: 0.3, up: [0, 1, 0], belly: 0.3 });
      if (k >= 2) for (const s of [1, -1]) B.crystal([-0.55, s * 0.92, 0.45], [-1.1, s * 1.45, 0.95], 0.1, MT.MET, { n: 4, thin: 0.4, up: [0, s, 0] });
      for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 6; i++) pts.push([1.0, s * 0.56, 0.05 + i / 6 * 0.9]); strip(B, pts, () => norm([0.87, s * 0.49, 0]), 0.16, MT.CH, 0.06); }
      if (k >= 3) for (const s of [1, -1]) B.box([0.0, s * 0.95, 0.5], [0.12, 0.08, 0.2], 0.03, MT.TI + 0.3);
    };
    M.nvert = [null, mk(B => nvert(B, 1)), mk(B => nvert(B, 2)), mk(B => nvert(B, 3))]; yield;
    /* ---- the heads (head frame: x forward along the snout, y its left, z up; the pivot (0, 0, 0) at the back of the skull where the
       neck joins): Lux (side 0) and Umbra (side 1) two different skulls ---- */
    const zb = u => lerp(-0.2, -0.1, u), zt = (u, s) => lerp(0.72, 0.3, Math.pow(u, 0.85)) + (s ? -0.05 * u : 0), sw = (u, s) => lerp(0.66, s ? 0.2 : 0.27, Math.pow(u, 0.8));
    const SNX0 = 0.15, SNX1 = 3.25;   // (the snout's span along x)
    const snoutP = (u, a, s) => { const x = lerp(SNX0, SNX1, u), w = sw(u, s), b = zb(u), h = zt(u, s) - b, ca = Math.cos(a), sa = Math.sin(a); return [x - 0.12 * Math.pow(Math.max(0, sa), 4) * u * u, w * se(ca, 3.2), b + h * se(Math.max(0, sa), 3.2) + 0.06 * Math.exp(-ca * ca * 40) * (1 - u) * sa]; };
    const skull = (B, s, k) => {   // s 0 Lux, 1 Umbra
      // the snout (the upper jaw) and the cranium: ceramic, engraved
      B.surf((u, v) => snoutP(u, v * Math.PI, s), Q(16), Q(14), () => MT.CER + 0.3, { e: (u, v) => sstep(0.9, 1, Math.abs(v * 2 - 1)) * 0.5, flip: false });
      B.ell([SNX1 - 0.06, 0, (zb(1) + zt(1, s)) / 2], [0.16, sw(1, s) * 1.0, (zt(1, s) - zb(1)) * 0.55], MT.CER, { seg: Q(12), rings: Q(6), th0: 0, th1: Math.PI });   // (the nose's cap)
      B.ell([-0.2, 0, 0.3], [0.9, s ? 0.62 : 0.68, 0.58], MT.TI + 0.2, { seg: Q(20), rings: Q(10) });
      B.surf((u, v) => { const x = lerp(SNX0, SNX0 + 0.05, u), w = sw(0, s); return [x, w * (1 - 2 * v) * 0.98, zb(0) + 0.02]; }, 1, 2, () => MT.TI, {});
      // the palate (the mouth's roof, lit by the throat)
      B.surf((u, v) => { const x = lerp(SNX0 - 0.1, SNX1 - 0.1, u), w = sw(u, s) * 0.94; return [x, w * (1 - 2 * v), zb(u) - 0.005]; }, Q(10), 3, () => MOU0(s), { flip: true });
      // the layered facial armour: three plates down the snout, the nasal crest
      for (let j = 0; j < 3; j++) { const u0 = 0.08 + j * 0.27, u1 = u0 + 0.34, a = snoutP(u0, Math.PI / 2, s), b2 = snoutP(u1, Math.PI / 2, s);
        plate(B, { c: [add(a, [0, 0, 0.06]), add(lerp3(a, b2, 0.33), [0, 0, 0.1]), add(lerp3(a, b2, 0.66), [0, 0, 0.1]), add(b2, [0, 0, 0.05])], nrm: [0.15, 0, 1], w: u => sw(lerp(u0, u1, u), s) * (0.95 - 0.1 * j), cup: -0.55, th: 0.07, nu: Q(8), nv: 3, mat: MT.CER + (j === 1 ? 0.3 : 0), trim0: 0.76, endTrim: 2 }); }
      B.crystal(add(snoutP(0.82, Math.PI / 2, s), [0, 0, 0.02]), add(snoutP(0.98, Math.PI / 2, s), [0.12, 0, 0.22]), 0.07, s ? MT.CRY : MT.MET, { n: 4, thin: 0.4, up: [0, 1, 0] });
      for (const sg of [1, -1]) {
        // the brow: a heavy angular ridge over each eye (Lux heavier, Umbra sharper and longer)
        plate(B, { c: [[0.05, sg * 0.42, 0.72], [0.45, sg * 0.5, 0.78], [0.95, sg * 0.46, 0.66], [1.35, sg * 0.36, 0.52]], nrm: [0.1, sg * 0.55, 1], w: u => (s ? 0.12 : 0.16) + 0.05 * Math.sin(Math.PI * u), cup: -0.3, th: 0.1, nu: Q(8), nv: 2, mat: MT.CER, trim0: 0.6, endTrim: true });
        for (let i = 0; i < 3; i++) spk(B, [0.95 - i * 0.32, sg * (0.5 + i * 0.03), 0.66 + i * 0.05], [0.35 - i * 0.55, sg * (1.05 + i * 0.15), 1.55 + i * 0.3], 0.1, { up: [0, sg, 0], jag: i === 1 });
        for (let i = 0; i < 3; i++) spk(B, [0.3 - i * 0.42, sg * 0.62, 0.1 - i * 0.14], [-1.2 - i * 0.55, sg * (1.85 + i * 0.25), 0.1 - i * 0.35], 0.13, { up: [0, 0, 1] });
        B.crystal([0.5, sg * 0.52, 0.78], [-0.35, sg * 0.78, 1.15 + (s ? 0.25 : 0.05)], 0.1, s ? MT.CRY : MT.MET, { n: 4, thin: 0.4, up: [0, sg, 0] });
        // the eye in its socket
        B.ell([0.86, sg * 0.44, 0.46], [0.24, 0.08, 0.1], MT.TI + 0.3, { seg: Q(12), rings: Q(5) });
        B.push(norm([1, sg * 0.25, 0.15]), norm([-sg * 0.25, 1, 0]), [0, 0, 1], [0.9, sg * 0.49, 0.47]); B.ell([0, 0, 0], [0.17, 0.05, 0.065], MT.EYE, { seg: Q(12), rings: Q(5) }); B.pop();
        // the cheek plates: layered, sweeping back from under the eye past the jaw's hinge (Umbra: more, sharper, frosted)
        const ncp = s ? 4 : 3;
        for (let j = 0; j < ncp; j++) { const z0 = 0.25 - j * 0.17, x0 = 1.15 - j * 0.12;
          plate(B, { c: [[x0, sg * (0.47 + j * 0.03), z0], [x0 - 0.5, sg * (0.6 + j * 0.04), z0 + 0.02], [x0 - 1.0, sg * (0.66 + j * 0.05), z0 + 0.06], [x0 - 1.55 - (s ? 0.35 : 0), sg * (0.62 + j * 0.06), z0 + 0.18 + (s ? 0.12 : 0)]], nrm: [0, sg, 0.15], w: u => (0.13 - j * 0.015) * (1 - 0.5 * u * u * (s ? 1.4 : 1)), cup: 0.2, th: 0.06, nu: Q(8), nv: 2, mat: MT.CER + (j % 2 ? 0.3 : 0), trim0: 0.6, endTrim: 2 });
          if (s) B.crystal([x0 - 1.4, sg * (0.62 + j * 0.06), z0 + 0.2], [x0 - 2.05, sg * (0.7 + j * 0.06), z0 + 0.38 + j * 0.06], 0.05, MT.CRY, { n: 4, thin: 0.5 }); }
        // vents: Lux's heat vents on the snout, Umbra's mist vents on the cheek
        for (let j = 0; j < 3; j++) { const u = 0.45 + j * 0.1, p = snoutP(u, sg > 0 ? 0.55 : Math.PI - 0.55, s); B.box(add(p, [0, sg * 0.01, 0]), [0.035, 0.03, 0.025], 0.01, MT.TI + 0.3); }
        // the fangs of the upper jaw (individually defined; the canines long), Umbra's long and crystalline
        for (let j = 0; j < 8; j++) { const u = 0.12 + j * 0.11, p = snoutP(u, sg > 0 ? 0.02 : Math.PI - 0.02, s), can = j === 6 ? 1 : 0, L = (s ? 0.26 : 0.2) + can * (s ? 0.28 : 0.22) + 0.04 * (j % 2);
          B.crystal(add(p, [0, -sg * 0.05, 0.02]), add(p, [0.04, -sg * 0.09, -L * 1.25]), 0.06 + can * 0.03, MT.FANG, { n: 4, belly: 0.25, base: 1 }); }
      }
      B.crystal(add(snoutP(0.99, Math.PI / 2, s), [-0.05, 0, -0.1]), add(snoutP(0.99, Math.PI / 2, s), [0.12, 0, -0.42]), 0.05, MT.FANG, { n: 4, belly: 0.25, base: 1 });
      // the horns: Lux's sweeping gold horns and a crest of blades (more by form); Umbra's crystalline crown of spikes
      for (const sg of [1, -1]) {
        if (!s) {
          B.crystal([-0.25, sg * 0.42, 0.62], [-2.55 - 0.25 * k, sg * (0.95 + 0.1 * k), 1.45 + 0.1 * k], 0.2, MT.MET, { n: 5, thin: 0.6, belly: 0.2, base: 1, bend: 0.12, up: [0, 0, 1] });
          B.crystal([-0.15, sg * 0.36, 0.64], [-1.7, sg * 0.78, 1.15], 0.13, MT.CER, { n: 4, thin: 0.5, belly: 0.2, base: 1, up: [0, 0, 1] });
          for (let i = 0; i < 5 + k; i++) { const f = i / (4 + k), a = [-0.45 - f * 0.55, sg * (0.5 + 0.18 * Math.sin(f * 3)), 0.6 - f * 0.95], L = 1.35 + 0.5 * Math.sin(f * 3.1) + 0.12 * k; B.crystal(a, add(a, [-L * 0.9, sg * L * (0.3 + 0.25 * f), L * (0.42 - 0.75 * f)]), 0.13 - 0.03 * f, i % 3 === 1 ? MT.FTH + 0.2 : i % 2 ? MT.CER : MT.MET, { n: 4, thin: 0.28, belly: 0.25, up: [0, sg, 0.3], bend: 0.1 }); }
          if (k >= 2) { B.crystal([0.15, sg * 0.45, 0.7], [-1.0, sg * 1.25, 1.75 + 0.2 * (k - 2)], 0.1, MT.MET, { n: 4, thin: 0.45, bend: -0.1, up: [0, sg, 0] }); B.push([0, 0, 1], [0, 1, 0], [-1, 0, 0], [-1.2, sg * 0.7, 1.0]); B.tor([0, 0, 0], 0.16, 0.04, MT.MET + 0.2, { seg: 12, rseg: 4 }); B.pop(); }
          if (k >= 3) B.crystal([-0.3, sg * 0.25, 0.75], [-1.6, sg * 0.55, 2.3], 0.08, MT.MET, { n: 4, thin: 0.4, up: [0, sg, 0] });
        } else {
          B.crystal([-0.25, sg * 0.36, 0.6], [-2.35 - 0.2 * k, sg * (0.7 + 0.05 * k), 1.85 + 0.12 * k], 0.17, MT.CRY, { n: 5, thin: 0.75, belly: 0.25, base: 1, up: [0, 0, 1] });
          B.push([0, 0, 1], [0, 1, 0], [-1, 0, 0], [-0.3, sg * 0.36, 0.62]); B.tor([0, 0, 0], 0.17, 0.05, MT.MET, { seg: 12, rseg: 4 }); B.pop();
          for (let i = 0; i < 6 + k; i++) { const f = i / (5 + k), a = [-0.35 - f * 0.6, sg * (0.45 + 0.15 * Math.sin(f * 3)), 0.6 - f * 0.95], L = 1.4 + 0.45 * Math.sin(i * 1.7) + 0.12 * k; B.crystal(a, add(a, [-L * 0.85, sg * L * (0.35 + 0.2 * f), L * (0.5 - 0.8 * f)]), 0.11 - 0.03 * f, i % 2 ? MT.CRY : MT.MET, { n: 4, thin: 0.4, belly: 0.3, up: [0, sg, 0.3], seed: i }); }
          if (k >= 2) B.crystal([0.2, sg * 0.38, 0.72], [-0.6, sg * 0.95, 1.85 + 0.2 * (k - 2)], 0.08, MT.CRY, { n: 4, thin: 0.5, up: [0, sg, 0] });
        }
      }
      // the crest down the middle of the skull
      for (let i = 0; i < (s ? 4 : 3) + (k >= 3 ? 1 : 0); i++) { const a = [0.35 - i * 0.38, 0, 0.78 - i * 0.08]; B.crystal(a, add(a, [-0.75, 0, 0.55 - i * 0.08 + (s ? 0.15 : 0)]), 0.09, s ? (i % 2 ? MT.CRY : MT.MET) : (i % 2 ? MT.CER : MT.MET), { n: 4, thin: 0.3, up: [0, 1, 0] }); }
      // the collar where the neck meets the skull
      B.push([0.45, 0, -0.9], [0, 1, 0], [0.9, 0, 0.45], [-0.25, 0, -0.1]); B.lathe([[-0.25, 0.48, MT.TI], [0.0, 0.56, MT.MET, 1], [0.12, 0.52, MT.MET, 1], [0.3, 0.42, MT.TI]], MT.TI, { seg: Q(16), edge: j => (j === 1 || j === 2 ? 1 : 0) }); B.pop();
    };
    function MOU0(s) { return MT.MOU + (s ? 0.2 : 0); }
    const jaw = (B, s) => {   // the lower jaw (hinged at (0, 0, -0.25)): plates outside, the mouth's floor inside, fangs, a chin spike
      const jw = u => sw(u, s) * 0.92, jb = u => lerp(-0.62, -0.38, u) + 0.05 * Math.sin(Math.PI * u);
      B.surf((u, v) => { const x = lerp(-0.15, SNX1 - 0.12, u), a = v * Math.PI, ca = Math.cos(a), sa = Math.sin(a), w = jw(u), top = zb(u) - 0.03, bot = jb(u); return [x, w * se(ca, 3), top - (top - bot) * se(sa, 3)]; }, Q(14), Q(10), () => MT.CER + 0.2, { flip: true, e: (u, v) => sstep(0.88, 1, Math.abs(v * 2 - 1)) * 0.6 });
      B.surf((u, v) => { const x = lerp(-0.1, SNX1 - 0.2, u), w = jw(u) * 0.9; return [x, w * (1 - 2 * v), zb(u) - 0.1]; }, Q(10), 3, () => MOU0(s), {});
      B.ell([SNX1 - 0.16, 0, (zb(1) - 0.03 + jb(1)) / 2], [0.14, jw(1) * 1.0, (zb(1) - 0.03 - jb(1)) * 0.55], MT.CER + 0.2, { seg: Q(12), rings: Q(6) });   // (the chin's cap)
      for (const sg of [1, -1]) {
        plate(B, { c: [[2.55, sg * 0.2, -0.32], [1.7, sg * 0.36, -0.4], [0.8, sg * 0.5, -0.52], [-0.05, sg * 0.6, -0.45]], nrm: [0, sg, -0.35], w: u => 0.14 + 0.04 * Math.sin(Math.PI * u), cup: 0.25, th: 0.07, nu: Q(10), nv: 2, mat: MT.CER, trim0: 0.65, endTrim: true });
        plate(B, { c: [[1.6, sg * 0.32, -0.55], [1.0, sg * 0.42, -0.66], [0.4, sg * 0.5, -0.7], [-0.15, sg * 0.52, -0.58]], nrm: [0, sg * 0.5, -1], w: () => 0.12, cup: 0.2, th: 0.06, nu: Q(8), nv: 2, mat: MT.CER + 0.3, trim0: 0.6, endTrim: true });
        for (let j = 0; j < 7; j++) { const u = 0.16 + j * 0.115, x = lerp(-0.15, SNX1 - 0.12, u), w = jw(u), z = zb(u) - 0.06, can = j === 5 ? 1 : 0, L = (s ? 0.22 : 0.17) + can * (s ? 0.2 : 0.15);
          B.crystal([x, sg * (w - 0.05), z], [x + 0.03, sg * (w - 0.09), z + L * 1.2], 0.055 + can * 0.025, MT.FANG, { n: 4, belly: 0.25, base: 1 }); }
        for (let i = 0; i < 3; i++) spk(B, [1.2 - i * 0.55, sg * 0.5, -0.6], [0.35 - i * 0.7, sg * (1.15 + 0.15 * i), -1.55 - 0.15 * i], 0.09, { up: [0, 0, 1], jag: i === 1 });
      }
      B.crystal([2.25, 0, jb(0.9)], [1.9, 0, jb(0.9) - 0.4], 0.07, s ? MT.CRY : MT.MET, { n: 4, thin: 0.5, up: [0, 1, 0] });
    };
    M.skull = [[null, mk(B => skull(B, 0, 1)), mk(B => skull(B, 0, 2)), mk(B => skull(B, 0, 3))]]; yield;
    M.skull.push([null, mk(B => skull(B, 1, 1)), mk(B => skull(B, 1, 2)), mk(B => skull(B, 1, 3))]); yield;
    M.jaw = [mk(B => jaw(B, 0)), mk(B => jaw(B, 1))];
    // the throat machinery: Lux's furnace (concentric rings round a white-hot core), Umbra's cryo turbine (crystal vanes round x, spun)
    M.furnace = mk(B => { latheX(B, [[-0.2, 0.0, MT.MOU], [-0.15, 0.2, MT.MOU], [0.0, 0.3, MT.TI + 0.3], [0.05, 0.36, MT.MET, 1], [0.1, 0.3, MT.TI], [0.12, 0.2, MT.MOU], [0.16, 0.0, MT.MOU]], MT.TI, Q(18));
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; B.box([0.06, Math.cos(a) * 0.3, Math.sin(a) * 0.3], [0.05, 0.02, 0.06], 0.01, MT.TI); } });
    M.cryo = mk(B => { B.sph([0, 0, 0], 0.09, MT.MET, 10); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.crystal([0, Math.cos(a) * 0.05, Math.sin(a) * 0.05], [0.04, Math.cos(a + 0.35) * 0.34, Math.sin(a + 0.35) * 0.34], 0.05, MT.CRY + 0.2, { n: 4, thin: 0.35, up: [1, 0, 0] }); }
      B.torX([0, 0, 0], 0.36, 0.025, MT.MET, { seg: Q(24), rseg: 4 }); });
    yield;
    /* ---- the Mirror Crowns (in the ring's frame: z its axis, radius 1): Lux's outer ring with solar blades and white-hot nodes, Umbra's with
       frost spikes (snowflake points) and crystal nodes; a runed band; a gyroscopic meridian; L7's vast outer ring ---- */
    M.crownOut = [mk(B => { bring(B, 1, 0.075, 0.06, 0.025, MT.MET, Q(72)); bring(B, 0.86, 0.025, 0.04, 0.012, MT.TI, Q(64));
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, L = i % 4 === 0 ? 0.62 : i % 2 ? 0.22 : 0.36, d = [Math.cos(a), Math.sin(a), 0], tg = [-Math.sin(a), Math.cos(a), 0];
          B.crystal(mul(d, 1.04), add(mul(d, 1.04 + L), mul(tg, L * 0.18)), i % 4 === 0 ? 0.08 : 0.055, i % 4 === 0 ? MT.MET : MT.FTH + 0.2, { n: 4, thin: 0.35, up: [0, 0, 1], belly: 0.25, bend: 0.08 }); }
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + TAU / 8; B.sph([Math.cos(a), Math.sin(a), 0], 0.085, MT.MOTE, 10); B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [Math.cos(a), Math.sin(a), 0]); B.tor([0, 0, 0], 0.12, 0.025, MT.MET, { seg: 12, rseg: 4 }); B.pop(); } }),
      mk(B => { bring(B, 1, 0.07, 0.06, 0.025, MT.MET, Q(72)); bring(B, 0.86, 0.025, 0.04, 0.012, MT.TI, Q(64));
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, big = i % 3 === 0, L = big ? 0.62 : 0.28, d = [Math.cos(a), Math.sin(a), 0], tg = [-Math.sin(a), Math.cos(a), 0];
          B.crystal(mul(d, 1.03), mul(d, 1.03 + L), big ? 0.07 : 0.05, MT.CRY, { n: 4, thin: 0.5, up: [0, 0, 1], belly: 0.3 });
          if (big) for (const sg of [1, -1]) B.crystal(mul(d, 1.03 + L * 0.5), add(mul(d, 1.03 + L * 0.72), mul(tg, sg * L * 0.3)), 0.03, MT.CRY, { n: 4, thin: 0.5, up: [0, 0, 1] }); }
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + TAU / 8; B.push([Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1], [Math.cos(a), Math.sin(a), 0]); gem(B, 0.1, MT.CRY + 0.2, 0, 0.1); B.pop(); } })];
    M.crownRune = mk(B => { bring(B, 0.74, 0.06, 0.035, 0.015, MT.RUNE, Q(64)); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; B.box([Math.cos(a) * 0.82, Math.sin(a) * 0.82, 0], [0.025, 0.025, 0.03], 0.008, MT.MET); } });
    M.crownMer = mk(B => { B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); bring(B, 0.6, 0.025, 0.03, 0.01, MT.MET, Q(48)); B.pop(); B.tube([0, -0.6, 0], [0, 0.6, 0], 0.012, 0.012, MT.TI, { seg: 6 }); B.sph([0, 0, 0], 0.06, MT.MOTE, 10);
      B.tor([0, 0, 0], 0.42, 0.018, MT.MET + 0.2, { seg: Q(32), rseg: 4, ph0: 0.3, ph1: Math.PI - 0.3 }); });
    M.crownVast = mk(B => { bring(B, 1, 0.03, 0.03, 0.012, MT.MET, Q(96)); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, L = i % 2 ? 0.06 : 0.14; B.crystal([Math.cos(a), Math.sin(a), 0], [Math.cos(a) * (1 + L), Math.sin(a) * (1 + L), 0], 0.02, MT.MET, { n: 4, thin: 0.5 }); } });
    yield;
    /* ---- the Gemini Core's parts: Lux's plasma sun (a sphere the shader boils, a see-through corona, prominence arcs), Umbra's snowflake
       nucleus (six branched crystal arms round a hexagonal heart) in a faceted shell; a containment ring (bevelled, studded), a gyro ring;
       a fragment, an ember, the white bridge ---- */
    M.sun = mk(B => B.ell([0, 0, 0], [1, 1, 1], MT.PL, { seg: 28, rings: 18 }));
    M.corona = mk(B => B.ell([0, 0, 0], [1, 1, 1], MT.PL + 0.3, { seg: 24, rings: 14 }));
    M.prom = mk(B => { for (let i = 0; i < 5; i++) { const ax = norm([hash(i * 3.1) - 0.5, hash(i * 5.7 + 1) - 0.5, hash(i * 7.3 + 2) - 0.5]), F = frameZ(ax), x = [F[0], F[3], F[6]], y = [F[1], F[4], F[7]], pts = [];
      for (let j = 0; j <= 10; j++) { const a = lerp(0, Math.PI, j / 10), h = 0.25 + 0.2 * hash(i); pts.push(add(mul(x, Math.cos(a) * 0.45), add(mul(ax, 0.92 + Math.sin(a) * h), mul(y, 0.1 * Math.sin(a * 2))))); } sweep(B, pts, u => 0.06 * Math.sin(Math.PI * u) + 0.015, MT.PL + 0.2, 5, 0); } });
    M.flake = mk(B => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, d = [0, Math.cos(a), Math.sin(a)], tg = [0, -Math.sin(a), Math.cos(a)];
        B.crystal(mul(d, 0.1), mul(d, 1.0), 0.09, MT.CRY + 0.2, { n: 4, thin: 0.4, up: [1, 0, 0], belly: 0.4 });
        for (const f of [0.38, 0.62]) for (const sg of [1, -1]) B.crystal(mul(d, f), add(mul(d, f + 0.2), mul(tg, sg * 0.3 * (1.2 - f))), 0.045, MT.CRY + 0.2, { n: 4, thin: 0.4, up: [1, 0, 0] }); }
      B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]); B.prism([0, 1, 2, 3, 4, 5].map(i => [Math.cos(i / 6 * TAU) * 0.26, Math.sin(i / 6 * TAU) * 0.26]), -0.08, 0.08, MT.CRY + 0.2, { b: 0.03 }); B.pop(); });
    M.shell = mk(B => gem(B, 1, MT.CRY + 0.3, 1, 0.06));
    M.cring = mk(B => { bring(B, 1, 0.085, 0.09, 0.03, MT.MET, Q(56)); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.box([Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0], [0.07, 0.07, 0.09], 0.02, MT.TI); } B.tor([0, 0, 0], 0.93, 0.012, MT.RUNE + 0.3, { seg: Q(48), rseg: 3 }); });
    M.gring = mk(B => { bring(B, 1, 0.035, 0.04, 0.012, MT.MET + 0.2, Q(48)); for (const a of [0, Math.PI]) B.tube([Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0], [Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0], 0.04, 0.03, MT.TI, { seg: 6 }); });
    M.frag = mk(B => B.crystal([0, 0, -0.5], [0, 0, 0.6], 0.3, MT.CRY, { n: 4, belly: 0.4, base: 0.5, seed: 3 }));
    M.ember = mk(B => gem(B, 1, MT.MOTE, 0, 0.3));
    M.bridge = mk(B => B.tube([0, 0, 0], [0, 0, 1], 1, 1, MT.LIT, { seg: Q(12), cap0: false, cap1: false, rings: 4 }));
    yield;
    /* ---- a leg: the upper bone and the lower bone (true length 1 along +z, their front toward +x), a joint, the foot (in the ankle's frame:
       x forward, z up; the sole at z -AH), the shoulder plate ---- */
    const bone = (B, lower) => {
      latheZ(B, [[0.0, 0.42, MT.TI], [0.08, 0.5, MT.TI + 0.2], [0.5, 0.44, MT.TI + 0.2], [0.56, 0.47, MT.MET, 1], [0.62, 0.47, MT.MET, 1], [0.68, 0.4, MT.TI + 0.2], [0.94, 0.33, MT.TI + 0.2], [1.0, 0.3, MT.TI]], MT.TI, Q(16));
      plate(B, { c: [[0.36, 0, 0.04], [0.6, 0, 0.32], [0.55, 0, 0.66], [0.4, 0, 0.98]], nrm: [1, 0, 0], w: u => 0.42 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.25), cup: -0.6, th: 0.1, nu: Q(8), nv: 3, mat: MT.CER, trim0: 0.72, endTrim: true });
      for (const s of [1, -1]) plate(B, { c: [[0.05, s * 0.4, 0.08], [0.15, s * 0.55, 0.36], [0.1, s * 0.52, 0.64], [0.0, s * 0.4, 0.88]], nrm: [0.2, s, 0], w: () => 0.24, cup: -0.3, th: 0.08, nu: Q(6), nv: 2, mat: MT.CER + 0.3, trim0: 0.7, endTrim: true });
      B.tube([-0.38, 0, 0.12], [-0.34, 0, 0.82], 0.08, 0.07, MT.MET + 0.2, { seg: 8, cap0: 'flat', cap1: 'flat' }); B.tube([-0.4, 0, 0.3], [-0.38, 0, 0.6], 0.12, 0.12, MT.TI, { seg: 8, cap0: 'flat', cap1: 'flat' });
      for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 7; i++) pts.push([-0.08, s * 0.47 * (1 - 0.18 * i / 7), 0.12 + i / 7 * 0.76]); strip(B, pts, () => [0, s, 0], 0.08, MT.CH, 0.012); }
      if (lower) { spk(B, [0.4, 0, 0.12], [1.05, 0, -0.55], 0.16, { up: [0, 1, 0] }); for (const s2 of [1, -1]) spk(B, [-0.1, s2 * 0.4, 0.85], [-0.75, s2 * 0.75, 1.15], 0.08, { up: [0, s2, 0], jag: false }); }
      else for (let i = 0; i < 2; i++) spk(B, [0.5, 0, 0.3 + i * 0.35], [1.35, 0, 0.05 + i * 0.35], 0.12, { up: [0, 1, 0], jag: i === 0 });
    };
    M.bone = [mk(B => bone(B, 0)), mk(B => bone(B, 1))];
    M.joint = mk(B => { B.sph([0, 0, 0], 0.5, MT.TI + 0.2, 14); for (const s of [1, -1]) { B.push([0, 0, 1], [1, 0, 0], [0, s, 0], [0, 0, 0]); B.lathe([[0.0, 0.5, MT.MET], [0.1, 0.46, MT.MET, 1], [0.18, 0.32, MT.TI], [0.22, 0.14, MT.CH], [0.23, 0.0, MT.CH]], MT.MET, { seg: Q(18), edge: j => (j < 2 ? 1 : 0) }); B.pop(); } });
    M.foot = mk(B => {
      B.box([0.15, 0, -AH + 0.32], [0.55, 0.42, 0.28], 0.14, MT.TI + 0.2); latheZ(B, [[-AH + 0.4, 0.34, MT.TI], [-0.3, 0.3, MT.TI + 0.2], [-0.1, 0.36, MT.MET, 1], [0.08, 0.33, MT.TI]], MT.TI, Q(14));
      plate(B, { c: [[-0.15, 0, 0.05], [0.25, 0, -0.25], [0.55, 0, -0.55], [0.72, 0, -0.78]], nrm: [1, 0, 0.6], w: () => 0.36, cup: -0.5, th: 0.08, nu: Q(6), nv: 2, mat: MT.CER, trim0: 0.7, endTrim: true });
      for (let j = 0; j < 4; j++) { const a = (j - 1.5) * 0.36, d = [Math.cos(a), Math.sin(a), 0], b0 = [0.35 + 0.15 * Math.cos(a), Math.sin(a) * 0.32, -AH + 0.35], k1 = add(b0, mul(d, 0.42 + 0.06 * (j % 3 ? 1 : 0))), k2 = add(k1, add(mul(d, 0.34), [0, 0, -0.08]));
        B.tube(b0, k1, 0.13, 0.11, MT.TI + 0.2, { seg: 8 }); B.sph(k1, 0.12, MT.MET, 8); B.tube(k1, k2, 0.1, 0.085, MT.CER, { seg: 8 });
        B.crystal(add(k2, [0, 0, 0.04]), add(k2, add(mul(d, 0.42), [0, 0, -0.3])), 0.085, MT.FANG + 0.2, { n: 5, belly: 0.2, base: 1, bend: -0.25, up: [0, 0, 1] }); }
      spk(B, [-0.3, 0, -AH + 0.55], [-1.05, 0, -AH + 0.3], 0.12, { up: [0, 1, 0], jag: false });
    });
    M.pauld = mk(B => { for (let i = 2; i >= 0; i--) plate(B, { c: [[0.85 - i * 0.1, 0, 0.45 - i * 0.25], [0.45, 0.35 + i * 0.05, 0.75 - i * 0.25], [-0.45, 0.35 + i * 0.05, 0.75 - i * 0.25], [-0.85 + i * 0.1, 0, 0.45 - i * 0.25]], nrm: [0, 1, 0.5], w: u => (0.5 - i * 0.06) * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * u)), 0.25), cup: -0.35, th: 0.1, nu: Q(10), nv: 2, mat: MT.CER + (i === 1 ? 0.3 : 0), trim0: 0.72, endTrim: true });
      for (let i = 0; i < 3; i++) spk(B, [0.45 - i * 0.45, 0.42, 0.8 - i * 0.12], [0.2 - i * 0.62, 1.2 + 0.1 * i, 2.0 - i * 0.3], 0.16, { up: [1, 0, 0] }); });
    yield;
    /* ---- the wings: the shoulder (a mechanical ball, rings, a cowl plate: its +z along the humerus), a bone (true length 1 along +z; its
       leading edge toward +x, armour on top +y... built round), a joint's ornate plate (a gem in a rimmed ceramic shield), a feather-blade
       (unit length along +z, width along x: the leading edge at -x, the trailing at +x; vA.y 0 leading .. 1 trailing, vA.z 0 root .. 1 tip) ---- */
    M.wsh = mk(B => { B.sph([0, 0, 0], 0.72, MT.TI + 0.2, 16); B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0.1]); bring(B, 0.78, 0.1, 0.12, 0.04, MT.MET, Q(32)); B.pop();
      B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]); bring(B, 0.74, 0.08, 0.1, 0.03, MT.MET + 0.2, Q(32)); B.pop();
      plate(B, { c: [[-0.8, -0.2, -0.4], [-0.3, 0.6, 0.1], [0.4, 0.65, 0.5], [0.9, 0.2, 0.9]], nrm: [0, 1, 0.2], w: u => 0.5 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.3), cup: -0.4, th: 0.12, nu: Q(10), nv: 2, mat: MT.CER + 0.3, trim0: 0.7, endTrim: true });
      for (let i = 0; i < 3; i++) B.crystal([-0.3 + i * 0.35, 0.55, 0.0 + i * 0.3], [-0.9 + i * 0.3, 1.25, 0.2 + i * 0.35], 0.1, MT.MET, { n: 4, thin: 0.4, up: [1, 0, 0] }); });
    M.wbone = mk(B => {
      latheZ(B, [[0.0, 0.3, MT.TI], [0.06, 0.36, MT.MET, 1], [0.12, 0.32, MT.TI + 0.2], [0.5, 0.26, MT.TI + 0.2], [0.55, 0.3, MT.MET, 1], [0.6, 0.28, MT.TI + 0.2], [0.94, 0.22, MT.TI + 0.2], [1.0, 0.24, MT.MET, 1]], MT.TI, Q(14));
      plate(B, { c: [[-0.05, 0.26, 0.05], [-0.25, 0.42, 0.35], [-0.2, 0.4, 0.7], [-0.02, 0.26, 0.98]], nrm: [-0.4, 1, 0], w: u => 0.3 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.3), cup: -0.45, th: 0.08, nu: Q(8), nv: 2, mat: MT.CER, trim0: 0.72, endTrim: true });
      plate(B, { c: [[-0.28, 0, 0.08], [-0.42, 0, 0.36], [-0.4, 0, 0.66], [-0.26, 0, 0.94]], nrm: [-1, 0, 0], w: () => 0.2, cup: -0.5, th: 0.07, nu: Q(8), nv: 2, mat: MT.CER + 0.3, trim0: 0.7, endTrim: true });
      B.tube([0.26, -0.12, 0.15], [0.24, -0.1, 0.85], 0.05, 0.045, MT.MET + 0.2, { seg: 6, cap0: 'flat', cap1: 'flat' }); B.tube([0.28, -0.13, 0.3], [0.27, -0.12, 0.55], 0.08, 0.08, MT.TI, { seg: 6, cap0: 'flat', cap1: 'flat' });
      { const pts = []; for (let i = 0; i <= 8; i++) pts.push([0.05, -0.27, 0.1 + i / 8 * 0.8]); strip(B, pts, () => [0.2, -1, 0], 0.07, MT.CH, 0.01); }
      for (let i = 0; i < 3; i++) B.crystal([-0.3, 0.1, 0.2 + i * 0.28], [-0.75, 0.25, 0.1 + i * 0.28], 0.06, MT.MET, { n: 4, thin: 0.4, up: [0, 1, 0] });
    });
    M.wplate = mk(B => {   // a shield over a joint: built facing +y, long along z
      plate(B, { c: [[0, 0, -0.9], [0.1, 0.18, -0.3], [0.1, 0.18, 0.4], [0, 0, 1.0]], nrm: [0, 1, 0], w: u => 0.55 * Math.pow(Math.sin(Math.PI * (0.02 + 0.96 * u)), 0.55), cup: -0.35, th: 0.13, nu: Q(12), nv: 3, mat: MT.CER + 0.3, trim0: 0.75, endTrim: true });
      plate(B, { c: [[0.15, -0.02, -0.65], [0.2, 0.12, -0.2], [0.2, 0.12, 0.3], [0.15, -0.02, 0.75]], nrm: [0, 1, 0], w: u => 0.3 * Math.pow(Math.sin(Math.PI * (0.02 + 0.96 * u)), 0.6), cup: -0.3, th: 0.08, nu: Q(10), nv: 2, mat: MT.MET, trim0: 0.6, endTrim: true, lift: 0.1 });
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0.18, 0.32, 0.05]); B.crystal([0, 0, -0.05], [0, 0, 0.22], 0.22, MT.CRY + 0.2, { n: 4, belly: 0.1, base: 1, rot: 0.785 }); B.pop();
      B.crystal([0, 0.1, 0.9], [0, 0.15, 1.9], 0.14, MT.MET, { n: 4, thin: 0.35, up: [0, 1, 0] }); B.crystal([0, 0.1, -0.8], [0, 0.2, -1.5], 0.1, MT.MET, { n: 4, thin: 0.35, up: [0, 1, 0] });
    });
    const blade = (B, s) => {   // the feather-blade: a metal frame (spine, leading edge, root plate), an element panel behind it, a sharp tip
      const W = u => (0.23 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + u * 0.98)), 0.45) + 0.012) * (1 - 0.3 * u), TH = u => 0.045 * (1 - 0.75 * u) + 0.006, sp = u => -0.06 * Math.sin(Math.PI * u);
      for (const sg of [1, -1]) B.surf((u, v) => { const x = lerp(-0.42, 1, v) * W(u), bulge = 1 - Math.pow(Math.abs(v * 2 - 1), 2) * 0.85; return [x + sp(u), sg * TH(u) * bulge + (s ? 0 : 0.004 * Math.sin(u * 40) * sg), u]; }, Q(16), Q(6), (u, v) => (v < 0.3 || u < 0.1 ? MT.FTH : MT.FTH + 0.2), { flip: sg < 0, e: (u, v) => v, a: u => u });
      { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12 * 0.94; pts.push([-0.42 * W(u) + sp(u), 0, u]); } sweep(B, pts, u => 0.03 * (1 - 0.8 * u) + 0.006, MT.MET, Q(5), 0.8, [0, 1, 0]); }
      { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10 * 0.8; pts.push([0.05 * W(u) + sp(u), 0, u]); } sweep(B, pts, u => 0.022 * (1 - 0.7 * u) + 0.004, MT.MET + 0.2, Q(4), 0.5, [0, 1, 0]); }
      plate(B, { c: [[0, 0, -0.04], [0, 0, 0.05], [0, 0, 0.12], [0, 0, 0.2]], nrm: [0, 1, 0], w: () => 0.14, cup: -0.4, th: 0.11, nu: 4, nv: 2, mat: MT.CER, trim0: 0.6, endTrim: true });
    };
    M.blade = [mk(B => blade(B, 0)), mk(B => blade(B, 1))];
    yield;
    /* ---- a tail vertebra (unit radius, unit length along +z; its back toward -x... the dorsal side +z of the tail is -x here): a drum, a
       metal joint ring, a dorsal shell with a spike, side plates, conduits down both flanks (fire on +y, ice on -y by the shader) ---- */
    const tvert = (B, k) => {
      latheZ(B, [[-0.12, 0.84, MT.TI], [-0.02, 0.92, MT.TI + 0.2, 0.3], [0.55, 0.94, MT.TI + 0.2], [0.8, 0.92, MT.TI + 0.2], [0.84, 1.02, MT.MET, 1], [0.95, 1.04, MT.MET, 1], [1.0, 0.94, MT.TI], [1.12, 0.86, MT.TI]], MT.TI, Q(16));
      plate(B, { c: [[-0.92, 0, 0.0], [-1.16, 0, 0.36], [-1.14, 0, 0.72], [-0.95, 0, 1.08]], nrm: [-1, 0, 0], w: u => 0.88 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.25), cup: -0.62, th: 0.12, nu: Q(7), nv: 3, mat: MT.CER + (k >= 2 ? 0.3 : 0), trim0: 0.74, endTrim: 2 });
      spk(B, [-1.05, 0, 0.25], [-2.3, 0, 1.05], 0.22, { thin: 0.35, up: [0, 1, 0] });
      for (const s of [1, -1]) plate(B, { c: [[-0.3, s * 0.88, 0.05], [-0.1, s * 1.1, 0.4], [-0.12, s * 1.08, 0.75], [-0.3, s * 0.9, 1.05]], nrm: [-0.3, s, 0], w: () => 0.36, cup: -0.3, th: 0.08, nu: Q(6), nv: 2, mat: MT.CER, trim0: 0.7, endTrim: 2 });
      for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 6; i++) pts.push([0.35, s * 0.95, 0.05 + i / 6 * 0.78]); strip(B, pts, () => norm([0.3, s, 0]), 0.2, MT.CH, 0.02); }
      plate(B, { c: [[0.86, 0, 0.0], [1.02, 0, 0.36], [1.02, 0, 0.7], [0.88, 0, 1.0]], nrm: [1, 0, 0], w: () => 0.5, cup: -0.5, th: 0.08, nu: Q(6), nv: 2, mat: MT.CER + 0.2, trim0: 0.7, endTrim: 2 });
      if (k >= 3) for (const s of [1, -1]) B.crystal([-0.7, s * 0.7, 0.5], [-1.2, s * 1.3, 0.85], 0.08, MT.MET, { n: 4, thin: 0.4, up: [0, s, 0] });
    };
    M.tvert = [null, mk(B => tvert(B, 1)), mk(B => tvert(B, 2)), mk(B => tvert(B, 3))];
    M.tblade = mk(B => {   // the double blade (unit: along +z from the last vertebra; +y the fire prong (metal, molten edge), -y the ice prong (crystal))
      latheZ(B, [[-0.1, 0.75, MT.TI], [0.0, 0.92, MT.MET, 1], [0.18, 0.95, MT.MET, 1], [0.4, 0.6, MT.TI + 0.2], [0.55, 0.45, MT.MET]], MT.TI, Q(16));
      for (const s of [1, -1]) { const A1 = 1.15, c = u => [0, s * (0.25 + 1.25 * Math.sin(A1 * u) * 0.6), 0.45 + 3.4 * u - 0.6 * u * u], w = u => 0.38 * Math.pow(1 - u, 0.8) + 0.01, th = u => 0.11 * Math.pow(1 - u, 0.7) + 0.006;
        for (const sg of [1, -1]) B.surf((u, v) => { const q = v * 2 - 1, C = c(u); return [C[0] + sg * th(u) * (1 - q * q * 0.9), C[1] + s * q * w(u) * 0.5, C[2] + q * w(u) * 0.75 * (0.3 + 0.7 * u)]; }, Q(16), 4, () => (s > 0 ? MT.FTH : MT.CRY), { flip: sg < 0, e: (u, v) => sstep(0.5, 1, Math.abs(v * 2 - 1)), a: u => u }); }
    });
    yield;
    /* ---- effect meshes (drawParts): an ice formation (a cluster of rising crystals), a planet of layered crystal ---- */
    M.spire = mk(B => { B.crystal([0, 0, -0.3], [0.05, 0, 2.4], 0.42, MT.CRY, { n: 6, belly: 0.25, base: 0.9, seed: 2 }); B.crystal([0.35, 0.2, -0.3], [0.8, 0.45, 1.5], 0.26, MT.CRY, { n: 5, belly: 0.3, seed: 5 }); B.crystal([-0.3, -0.25, -0.3], [-0.7, -0.4, 1.2], 0.24, MT.CRY, { n: 5, belly: 0.3, seed: 9 }); B.crystal([-0.1, 0.35, -0.3], [-0.2, 0.7, 0.9], 0.16, MT.CRY, { n: 4, seed: 11 }); });
    M.planet = mk(B => { gem(B, 1, MT.CRY + 0.2, 1, 0.12); for (let i = 0; i < 9; i++) { const d = norm([hash(i * 2.3) - 0.5, hash(i * 4.1 + 3) - 0.5, hash(i * 6.7 + 1) - 0.5]); B.crystal(mul(d, 0.7), mul(d, 1.35 + 0.25 * hash(i)), 0.22, MT.CRY, { n: 5, seed: i }); } });
    const bsph = m => { let cx = 0, cy = 0, cz = 0; const n = m.nv; for (let i = 0; i < n; i++) { cx += m.pos[i * 3]; cy += m.pos[i * 3 + 1]; cz += m.pos[i * 3 + 2]; } cx /= n; cy /= n; cz /= n; let r = 0; for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(m.pos[i * 3] - cx, m.pos[i * 3 + 1] - cy, m.pos[i * 3 + 2] - cz)); m.bs = [cx, cy, cz, r]; };
    eachOf(M, bsph);
    OUT.M = M; let nv = 0, nt = 0; eachOf(M, m => { nv += m.nv; nt += m.ntri; }); OUT.nv = nv; OUT.nt = nt; OUT.ready = true; OUT.msBuilt = nowMs();
  }
  function eachOf(M, f) { for (const k in M) { const v = M[k]; if (Array.isArray(v)) v.forEach(m => { if (Array.isArray(m)) m.forEach(m2 => { if (m2) f(m2); }); else if (m) f(m); }); else if (v) f(v); } }
  /* (v464 RZ-M) two mesh sets: D the full one (stills, the collection, close-ups, wide screens) and DL the game's level of detail (half the
     round segments: built for a model drawn under LODPX device pixels tall, with fewer vertebrae and feather-blades, see solve0's lod) */
  let DL = null; const LODPX = 560, OUTL = new Set(['skull', 'jaw', 'bone', 'joint', 'foot', 'pauld', 'wsh', 'wbone', 'wplate', 'crownOut', 'tblade']);   // (the game's level of detail outlines only these: never the feather-blades, the vertebrae of the tail, the small parts)
  function data(lo) { if (lo) return DL || (DL = { ready: false, up: false, it: null, ms: 0, q: 0.42 }); return D || (D = { ready: false, up: false, it: null, ms: 0, q: 1 }); }
  function step(ms, lo) { const d = data(lo); if (d.ready) return true; if (typeof GLM === 'undefined') return false; d.it = d.it || gen(d.q, d); const t0 = nowMs(), until = t0 + ms; while (!d.ready && nowMs() < until) d.it.next(); d.ms += nowMs() - t0; return d.ready; }
  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Raziel GL: ' + String(e && e.message || e)); } catch (e2) {} };
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__RZ_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__RZ_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  let IDLE = 0;
  function warm() {   // (both sets, the game's first: a summon on a phone needs only it)
    if (!usable()) return false; const a = data(true), b = data(false); if ((a.up && b.up) || IDLE) return true; IDLE = 1;
    const go = () => { const run = ms => { try { const lo = !a.up; if (!step(ms, lo)) return go(); upload(lo); if (!(a.up && b.up)) return go(); } catch (e) { fail(e); } IDLE = 0; };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => run(dl.didTimeout ? 3 : Math.max(1, Math.min(8, dl.timeRemaining() - 1))), { timeout: 200 }); else setTimeout(() => run(3), 30); };
    go(); return true;
  }
  /* (shader prewarming: one tiny pass with every mesh uploads the buffers and compiles the program's branches before the summon) */
  function upload(lo) { const d = data(lo); if (d.up || !d.ready || !GLM.ok()) return; const items = [];
    eachOf(d.M, mesh => items.push({ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 0 }));
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); d.up = true; }
  function ensure(lo) { if (!usable()) return false; const d = data(lo); if (!d.ready) { try { step(1e9, lo); } catch (e) { fail(e); return false; } } return d.ready; }
  function release() { let n = 0; for (const d of [D, DL]) { if (!d || !d.M) continue; eachOf(d.M, m => { if (m.gl) { n++; if (typeof GLM !== 'undefined' && GLM.free) GLM.free(m); else m.gl = null; } }); d.up = false; } return n; }
  const gpuCount = () => { let n = 0; for (const d of [D, DL]) if (d && d.M) eachOf(d.M, m => { if (m.gl) n++; }); return n; };

  /* ================= the pose: S (the moves' state) smoothed into the model's own ================= */
  const hold = (t, per, sd, ease) => { const u = t / per + sd, n = Math.floor(u), f = u - n, a = hash(n * 1.37 + sd * 7.1) * 2 - 1, b = hash((n + 1) * 1.37 + sd * 7.1) * 2 - 1; return lerp(a, b, sstep(0, ease || 0.4, f)); };
  const kOf = S => { const e = S && S.evo != null ? S.evo : 1; return e >= 7 ? 3 : e >= 4 ? 2 : 1; };
  function idle(evo, t) { return { t: t || 0, evo: evo || 1, mode: 'dissonance', aimL: null, aimR: null, jawL: 0, jawR: 0, chargeL: 0, chargeR: 0, recoilL: 0, recoilR: 0, coreDetach: 0, coreAlign: 0, coreSpinL: 1, coreSpinR: 1, coreUp: 0,
    crownSpeedL: 1, crownSpeedR: 1, crownAlign: 0, crownExpand: 0, wing: WING0, beat: 0, guard: 0, fly: 0, bank: 0, walk: 0, face: FACE0, raise: 0, meet: 0, roar: 0, stagger: 0, final: 0, enter: 1, dissolve: 0, lowFx: false }; }
  /* the springs: st (S._rz) keeps each value; f1 a first-order follow (rate /s), f2 a second-order one (natural frequency w, damping z) */
  function f1(st, key, v, rate, dt, snap) { if (st[key] == null || snap) st[key] = v; else if (dt > 0) st[key] += (v - st[key]) * (1 - Math.exp(-dt * rate)); return st[key]; }
  function f2(st, key, v, w, z, dt, snap) { const kv = key + '_v'; if (st[key] == null || snap) { st[key] = v; st[kv] = 0; return v; } if (dt > 0) { const h = Math.min(dt, 0.04), nst = Math.ceil(dt / h - 1e-6); for (let i = 0; i < nst; i++) { st[kv] += (w * w * (v - st[key]) - 2 * z * w * st[kv]) * (dt / nst); st[key] += st[kv] * (dt / nst); } } return st[key]; }
  function fa(st, key, v, rate, dt, snap) { if (st[key] == null || snap) st[key] = v; else if (dt > 0) st[key] += angD(v, st[key]) * (1 - Math.exp(-dt * rate)); return st[key]; }
  const num = (v, d) => (v == null || !isFinite(v) ? d : +v);

  /* ================= the solver: every part's place and turn, and the anchors (put(mesh, R, T, sc, op, ord) receives the parts) ================= */
  const LW = norm([-0.45, 0.42, 0.8]), SBW = norm([-0.3, -0.2, 0.92]), RIMW = norm([0.65, -0.62, 0.42]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const RIMC = [1.1, 0.9, 1.05], AMBC = [1.05, 1.02, 1.08], OUTC = [0.035, 0.025, 0.04], GLCAP = 1600;
  const NECKS = [{ p: [], d: [], x: [], r: [], L: [] }, { p: [], d: [], x: [], r: [], L: [] }], TAIL = { p: [], d: [], x: [], r: [], L: [] };
  const BZS = new Float64Array(40);
  function solve0(S, X0, Y0, size, opts, put, spec, lod) {
    opts = opts || {}; const k = kOf(S), K = size / HEIGHT[k], tile = opts.tile || size / 2.6, still = !!opts.still, low = !!(S.lowFx || lowFx() || opts.low);
    const st = S._rz || (S._rz = {}); const t = num(S.t, 0); let dt = st.t == null || still ? 0 : t - st.t; if (!(dt >= 0) || dt > 0.5) { dt = 0; if (st.t != null && !still) S._rz = null; } dt = Math.min(dt, 0.1);
    const snap = still || st.t == null; if (!S._rz) { S._rz = {}; return solve0(S, X0, Y0, size, opts, put, spec, lod); } st.t = t;
    const out = st.out || (st.out = { feet: [{}, {}, {}, {}], steps: [] }); out.steps.length = 0;
    /* ---- the body's heading, travel, gait ---- */
    const face = num(S.face, FACE0); let yawT = Math.atan2(Math.sin(face) / SE, Math.cos(face));
    if (!S.faceFree) yawT = Math.PI / 2 + Math.max(-YAWLIM, Math.min(YAWLIM, angD(yawT, Math.PI / 2)));   // (it turns toward its heading but keeps its chest to the camera: both heads, both wings and the core always read)
    const yaw = fa(st, 'yaw', yawT, 5, dt, snap);
    const yr = st.yaw0 == null || !dt ? 0 : angD(yaw, st.yaw0) / dt; st.yaw0 = yaw; const yrs = f1(st, 'yr', yr, 8, dt, snap);
    const fly = f2(st, 'fly', cl(num(S.fly, 0)), 4.5, 0.85, dt, snap), walkT = cl(num(S.walk, 0)) * (1 - sstep(0.1, 0.5, fly)), walk = f1(st, 'walk', walkT, 4, dt, snap);
    let dist = 0; if (S.x != null && S.y != null) { if (st.px != null && dt > 0) { const dx = (S.x - st.px) * tile / K, dy = (S.y - st.py) * tile / (SE * K); dist = Math.hypot(dx, dy); if (dist > 6) dist = 0; } st.px = S.x; st.py = S.y; }
    else dist = walk * dt * 6.5;
    const run = sstep(0.55, 1, walk), SWv = lerp(SW0, SW1, run);
    const ph0 = st.ph || 0; st.ph = ph0 + dist / STRIDE * TAU * (1 - 0.25 * run);
    const mvA = f1(st, 'mv', cl(dist / Math.max(1e-3, dt) / 6) * (dt > 0 ? 1 : 0) + (dt > 0 ? 0 : walk), 6, dt, snap);
    const lv = 1 - cl(num(S.dissolve, 0)) * 0.8, ent = cl(num(S.enter, 1)), evE = n => sstep(n[0], n[1], ent);
    const fin = cl(num(S.final, 0)), stag = f2(st, 'stag', cl(num(S.stagger, 0)), 9, 0.4, dt, snap), roar = f2(st, 'roar', cl(num(S.roar, 0)), 7, 0.6, dt, snap);
    const raise = f2(st, 'raise', cl(num(S.raise, 0)), 4, 0.8, dt, snap), meet = f2(st, 'meet', cl(num(S.meet, 0)), 3.5, 0.85, dt, snap), conc = f1(st, 'conc', S.mode === 'concord' ? 1 : 0, 2.2, dt, snap);
    /* ---- the feet (phase-driven, planted while in stance: their sweep matches the travel) ---- */
    const Rroot = rz(yaw), lifts = [0, 0, 0, 0], FP = [];
    const tuck = sstep(0.05, 0.6, fly);
    for (let i = 0; i < 4; i++) { const L = LEGS[i]; let q = st.ph / TAU + L.off; q -= Math.floor(q); const inW = q >= 1 - SWv, w = inW ? (q - (1 - SWv)) / SWv : 0, Dd = STRIDE * (1 - SWv) * (mvA > 0.03 ? 1 : 0) * cl(mvA * 3);
      const sl = inW ? -Dd / 2 + Dd * sstep(0.05, 0.9, w) : Dd / 2 - Dd * (q / (1 - SWv)), lift = inW ? Math.sin(Math.PI * w) * LIFTH * cl(mvA * 2.5) * (1 + 0.4 * run) : 0;
      const pq = st.fq || (st.fq = [0, 0, 0, 0]); if (!inW && pq[i] === 1 && dt > 0) out.steps.push(i); pq[i] = inW ? 1 : 0;
      lifts[i] = lift; FP.push([L.fx + sl - tuck * (L.f ? 0.5 : -1.2), L.fy * (1 - 0.15 * tuck), lerp(lift, fly * 8.5 + (L.f ? 2.2 : 1.6) + 0.3 * Math.sin(t * 2.3 + i), tuck)]); }   // (in flight the legs hang under the body, the hind ones trailing)
    // the body's weight shifting off each lifted foot, the walk's bob; the stagger, the roar, flight
    let wr = 0, wp = 0, wy = 0; for (let i = 0; i < 4; i++) { const L = LEGS[i], lf = cl(lifts[i] / LIFTH); wr -= lf * L.s * 0.035; wp += lf * (L.f - 0.5) * 0.04; wy -= lf * L.s * 0.12; }
    const brth = Math.sin(t * 1.15) * lv, bob = (0.05 * brth + (walk > 0.05 ? 0.12 * Math.abs(Math.sin(st.ph * 2)) * walk : 0)) * (1 - fly);
    const flyH = fly * 8.5 + fly * 0.35 * Math.sin(t * 2.3), bank = f2(st, 'bank', num(S.bank, 0) * 0.45 - yrs * 0.05 * (0.3 + fly), 5, 0.7, dt, snap);
    const pitch = wp + stag * 0.06 * Math.sin(t * 13) - roar * 0.08 - fly * 0.06 + run * walk * 0.04 + raise * -0.03, lift = bob + flyH - stag * 0.3 + roar * 0.15 + (1 - evE([0.3, 0.5])) * -1.5 * (1 - evE([0, 0.3]));
    const Mb = mm(rx(bank * (1 + fly) + wr), ry(pitch)), tbo = [0, wy * (1 - fly) + stag * 0.15 * Math.sin(t * 11), lift];
    const BP = p => add(add(mv(Mb, sub(p, BODYC)), BODYC), tbo), BR = R => mm(Mb, R);
    const W3 = p => { const q2 = mv(Rroot, p); return [q2[0] * WS, q2[1] * WS, q2[2] * WS]; };
    const kk = K / WS, SX = w => X0 + w[0] * kk, SY = w => Y0 + (w[1] * SE - w[2] * CE) * kk, scr = p => { const w = W3(p); return [SX(w), SY(w)]; };
    const scrO = (p, o2) => { const s2 = scr(p); o2.x = s2[0]; o2.y = s2[1]; return o2; };
    /* the target of a head: a world point in the model's frame (on the floor) */
    const tgt = a => { if (!a || S.x == null || S.y == null) return null; const dx = (num(a.x, 0) - S.x) * tile / K, dy = (num(a.y, 0) - S.y) * tile / (SE * K), c = Math.cos(-yaw), s = Math.sin(-yaw); return [c * dx - s * dy, s * dx + c * dy, 0]; };
    const dis = cl(num(S.dissolve, 0));
    const spSide = spec === 'L' ? 0 : spec === 'R' ? 1 : -1;
    /* ---- the torso ---- */
    const brS = 1 + 0.012 * brth;
    put('torso', null, BR(scl3(TSC, TSC * brS, TSC * brS)), BP([0, 0, 6.5 * (1 - TSC)]), 1, { side: 2, d0: 0.4, hb: 1 }, [0.15, 0.4]);
    out.body = out.body || {}; scrO(BP([0.5, 0, 6.6]), out.body); out.body.r = 5.2 * K;
    /* ---- the Gemini Core ---- */
    const cDet = f2(st, 'cDet', cl(num(S.coreDetach, 0)), 4, 0.7, dt, snap), cAl = f2(st, 'cAl', cl(Math.max(num(S.coreAlign, 0), conc * 0.35)), 3, 0.85, dt, snap), cUp = f2(st, 'cUp', cl(num(S.coreUp, 0)), 2.2, 0.8, dt, snap);
    const cEnt = 1 - evE([0, 0.28]);   // (the entrance: the cores come down from above, orbiting each other)
    for (let s = 0; s < 2; s++) { if (spSide >= 0 && s !== spSide) continue; const sg = s ? -1 : 1, key = s ? 'coreR' : 'coreL', spinM = num(s ? S.coreSpinR : S.coreSpinL, 1) * (1 + fin * 1.5);
      const sp = (st['cs' + s] || 0) + dt * (0.7 + 0.9 * (spinM - 1)) * (1 + (1 - conc) * (s ? -0.35 : 0.35)); st['cs' + s] = sp;
      let cp = add(CORE, [1.5 * cDet, sg * (CORE[1] * 0 + 0.55 * cDet) , 0.7 * cDet]); cp[1] = sg * CORE[1] + sg * 0.55 * cDet;
      if (spSide >= 0) cp = [CORE[0], 0, CORE[2]];
      let P = BP(cp);
      if (cUp > 0.001) { const oa = t * 1.6 + s * Math.PI, upP = [0.8 + 1.6 * Math.cos(oa) * (1 - 0.3 * cAl), 2.2 * Math.sin(oa) * (1 - 0.3 * cAl), 19.5 + 0.6 * Math.sin(t * 1.3)]; P = lerp3(P, upP, sstep(0, 1, cUp)); }
      if (cEnt > 0.001) { const oa = t * 3.2 + s * Math.PI, rr = 2.2 * cEnt; P = lerp3(P, [0.6 + Math.cos(oa) * rr, Math.sin(oa) * rr, 6.6 + 12 * cEnt * cEnt], sstep(0, 1, cEnt)); }
      const rad = CRAD * (1 + 0.25 * cDet + 0.6 * cUp), glow = 0.6 + 0.4 * Math.sin(t * (s ? 1.7 : 2.6)) * 0.3 + fin * 0.8 + cDet * 0.4 + cUp * 0.6, ax = mv(Mb, [1, 0, -0.12]);
      const Rax = frameZ(ax, [0, 0, 1]);
      const nuc = 1 - sstep(0, 0.6, cl(num(S.coreOut, 0)));   // (S.coreOut: the nuclei leave the chest: the ultimate draws them in flight)
      if (nuc < 0.02) {} else if (s === 0) { put('sun', null, mm(Rax, rz(sp * 0.8)), P, rad * 0.6 * nuc, { side: 0, glow, g2: 0.4 + fin + cAl * 0.5, noInk: 1, d0: 0.8 }, [0, 0.25]);
        put('prom', null, mm(Rax, rz(-sp * 0.5)), P, rad * 0.62 * nuc, { side: 0, glow, g2: 0.5 + fin, noInk: 1, d0: 0.8 }, [0, 0.25]);
        put('corona', null, mm(Rax, rz(sp * 0.3)), P, rad * 0.78 * nuc * (1 + 0.03 * Math.sin(t * 7)), { side: 0, glow, alpha: 0.97, noInk: 1, g2: fin, d0: 0.8 }, [0, 0.25]); }
      else { put('flake', null, mm(Rax, rx(sp * 0.35)), P, rad * 0.62 * nuc, { side: 1, glow, g2: 0.4 + fin + cAl * 0.5, noInk: 1, d0: 0.8 }, [0, 0.25]);
        put('shell', null, mm(Rax, rz(-sp * 0.12)), P, rad * 0.8 * nuc, { side: 1, glow: glow * 0.6, alpha: 0.96, noInk: 1, g2: fin * 0.5, d0: 0.8 }, [0, 0.25]);
        if (!low && !lod && nuc > 0.5) for (let j = 0; j < 5; j++) { const a = t * (0.5 + 0.1 * j) + j * 1.26, rr = rad * (0.95 + 0.1 * (j % 2)); put('frag', null, mm(Rax, mm(rz(a), rx(a * 2))), add(P, mv(Rax, [Math.cos(a) * rr, Math.sin(a) * rr, 0.25 * Math.sin(a * 1.7 + j)])), 0.08, { side: 1, glow: 0.6, noInk: 1, d0: 0.75 }, [0.1, 0.3]); } }
      // the containment rings: gyroscopic (each its own tilted axis), aligned to the core's axis by coreAlign (Concord)
      const nr = (lod ? [0, 2, 2, 3] : [0, 2, 3, 4])[k];
      for (let j = 0; j < nr; j++) { const tl = (1 - cAl) * (0.55 + 0.25 * j) * Math.sin(sp * (0.4 + 0.13 * j) + j * 1.9 + s), ph = sp * (1.1 - 0.2 * j) * (j % 2 ? -1 : 1) * (s ? -1 : 1) * (1 - cAl * 0.6) + cAl * (st['csA'] || 0), Rr = mm(Rax, mm(rx(tl), mm(ry(tl * 0.6 * (j % 2 ? 1 : -1)), rz(ph))));
        put(j % 2 ? 'gring' : 'cring', null, Rr, P, rad * (1.0 + 0.14 * j) * (1 + 0.1 * cDet), { side: s, glow: 0.2 + cAl * 0.6, kind: j, noInk: 0, d0: 0.78 }, [0.05, 0.3]); }
      if (k >= 2 && !low) put('gring', null, mm(Rax, mm(rx(Math.PI / 2), rz(sp * 0.6))), P, rad * 1.62, { side: s, glow: 0.3, d0: 0.78 }, [0.05, 0.3]);
      const co = out[key] || (out[key] = {}); scrO(P, co); co.r = rad * 0.8 * K; co.p3 = P; }
    st.csA = (st.csA || 0) + dt * 0.9;
    if (spSide < 0 && cAl > 0.05) { const a = out.coreL.p3, b = out.coreR.p3, d = sub(b, a), L = len(d), F = frameZ(d, [1, 0, 0]); put('bridge', null, colsR([F[0] * 0.09 * (0.5 + cAl), F[3] * 0.09 * (0.5 + cAl), F[6] * 0.09 * (0.5 + cAl)], [F[1] * 0.09 * (0.5 + cAl), F[4] * 0.09 * (0.5 + cAl), F[7] * 0.09 * (0.5 + cAl)], [F[2] * L, F[5] * L, F[8] * L]), a, 1, { side: 2, kind: 2, glow: cAl * 1.4, alpha: 0.9 * cAl, noInk: 1, d0: 0.8 }, [0.2, 0.3]); }
    /* ---- the legs: hips on the body, two-bone IK to the planted feet; the shoulder plates ---- */
    const legE = evE([0.32, 0.55]);
    if (!(spSide >= 0 && !opts.legs)) for (let i = 0; i < 4; i++) {
      const L = LEGS[i], s = L.s, sd = s > 0 ? 0 : 1, H = BP([L.x, L.y, L.z]), unf = legE, fo = FP[i], F0 = [fo[0], fo[1], fo[2]];
      const Fp = lerp3(add(H, [L.f ? 0.4 : -0.4, s * 0.4, -2.2]), add(F0, [0, 0, AH]), unf), dn = norm(sub(Fp, H)), pole = add(mul([1, 0, 0], L.kd * 1), [0, s * 0.25, 0]);
      const IK = ik(H, Fp, L.L1, L.L2, pole);
      const dU = norm(sub(IK.K, H)), dL = norm(sub(IK.A, IK.K)), side = mv(Mb, [0, 1, 0]), xU = norm(cross(dU, side)), xL = norm(cross(dL, side));   // (the armour faces forward)
      put('bone', 0, colsR(mul(xU, 2.5), mul(cross(dU, xU), 2.4), mul(dU, L.L1 * 1.04)), H, 1, { side: sd, d0: 0.05, hb: 1 }, [0.35, 0.55]);
      put('joint', null, colsR(dU, side, cross(dU, side)), IK.K, 1.55, { side: sd, d0: 0.06 }, [0.35, 0.55]);
      put('bone', 1, colsR(mul(xL, 2.1), mul(cross(dL, xL), 2.0), mul(dL, L.L2 * 1.04)), IK.K, 1, { side: sd, d0: 0.04, hb: 1 }, [0.38, 0.58]);
      const fyaw = Math.atan2(F0[1] * 0.15, 1) * 0 + s * 0.12 * (L.f ? 1 : 0.6), Rf = mm(rz(fyaw), ry(-0.25 * tuck * (L.f ? 1 : -1)));
      put('foot', null, Rf, IK.A, 1.8, { side: sd, d0: 0.02 }, [0.4, 0.6]);
      put('pauld', null, BR(mm(L.f ? I3 : [-1, 0, 0, 0, 1, 0, 0, 0, 1], s > 0 ? I3 : MY)), BP([L.x + (L.f ? 0.1 : -0.1), L.y + s * 0.35, L.z + 1.35]), L.f ? 2.3 : 2.0, { side: sd, d0: 0.3 }, [0.3, 0.5]);
      const fo2 = out.feet[i]; scrO([F0[0], F0[1], 0], fo2); fo2.down = lifts[i] < 0.05 && fly < 0.2; fo2.side = s > 0 ? 'L' : 'R'; fo2.front = !!L.f; }
    /* ---- the tail: its rest curve (back and down to the floor, curling up and aside at its end), a travelling sway, the turn's and the
       stride's swing; filtered in world space (the tip lags most); kept off the floor ---- */
    { const n = lod ? 13 : NTS[k] - (low ? 2 : 0), tLk = NTS[k] / n * (lod ? 1.02 : 1), tE = evE([0.45, 0.65]), sw = 0.09 * (1 + fin) * lv, R = TAIL; let p = BP(TROOT), d = mv(Mb, norm([-1, 0, -0.32])), dd;
      const st2 = st.tail || (st.tail = { A: null }), wy = t * 1.4;
      for (let j = 0; j < n; j++) { const u = j / (n - 1), len0 = tLk * 0.88 * (1 - 0.38 * u) * (0.35 + 0.65 * tE), rad = 0.82 * (1 - 0.68 * u) + 0.06;
        const bend = (0.045 + 0.06 * sstep(0.55, 1, u) + 0.04 * fly) * (u > 0.15 ? 1 : -0.4), yawB = sw * Math.sin(wy - j * 0.42) * (0.3 + u) + 0.18 * sstep(0.7, 1, u) * Math.sin(t * 0.37) + yrs * 0.012 * u * 4, Rb = mm(rz(yawB), ry(-bend));
        d = norm(mv(Rb, d)); if (j === 0) dd = d; R.d[j] = d; R.r[j] = rad; R.L[j] = len0; }
      // the world-space filter: each segment's direction chases its target (turned by the body's yaw), the tip slowest
      const c = Math.cos(yaw), s2 = Math.sin(yaw); let A = st2.A; if (!A || A.length !== n * 3 || snap) { A = st2.A = new Float32Array(n * 3); for (let j = 0; j < n; j++) { const q2 = R.d[j]; A[j * 3] = c * q2[0] - s2 * q2[1]; A[j * 3 + 1] = s2 * q2[0] + c * q2[1]; A[j * 3 + 2] = q2[2]; } }
      else if (dt > 0) for (let j = 0; j < n; j++) { const u = j / (n - 1), q2 = R.d[j], wx = c * q2[0] - s2 * q2[1], wy2 = s2 * q2[0] + c * q2[1], kf = 1 - Math.exp(-dt * (14 - 10 * u)); A[j * 3] += (wx - A[j * 3]) * kf; A[j * 3 + 1] += (wy2 - A[j * 3 + 1]) * kf; A[j * 3 + 2] += (q2[2] - A[j * 3 + 2]) * kf; }
      let x0 = mv(Mb, [0, 0, 1]); void dd;
      for (let j = 0; j < n; j++) { let wx = A[j * 3], wy2 = A[j * 3 + 1], wz = A[j * 3 + 2]; const l = Math.hypot(wx, wy2, wz) || 1; wx /= l; wy2 /= l; wz /= l; let q2 = [c * wx + s2 * wy2, -s2 * wx + c * wy2, wz];
        const nx = add(p, mul(q2, R.L[j])); if (nx[2] < 0.45 + R.r[j] * 0.7) { nx[2] = 0.45 + R.r[j] * 0.7; q2 = norm(sub(nx, p)); }
        R.p[j] = p; R.d[j] = q2; const dt2 = dot(x0, q2); x0 = norm(sub(x0, mul(q2, dt2))); R.x[j] = x0; p = add(p, mul(q2, R.L[j])); }
      R.n = n; R.tip = p;
      if (tE > 0.02) for (let j = 0; j < n; j++) { const q2 = R.d[j], xv = R.x[j], yv = cross(q2, xv), rr = R.r[j];
        put('tvert', k, colsR(mul(xv, -rr), mul(yv, rr), mul(q2, R.L[j] * 1.08)), R.p[j], 1, { side: 2, kind: j / n, d0: 0.15 + 0.004 * j, hb: 1 }, [0.45 + 0.15 * j / n, 0.6]); }
      const q2 = R.d[n - 1], xv = R.x[n - 1], yv = cross(q2, xv), rr = R.r[n - 1] * 1.3;
      if (tE > 0.6) put('tblade', null, colsR(mul(xv, -rr), mul(yv, rr), mul(q2, rr)), p, 1, { side: 2, glow: 0.3 + fin, d0: 0.2 }, [0.6, 0.65]);
      const tipP = add(p, mul(q2, rr * 3.4)); out.tailTip = scrO(tipP, out.tailTip || {}); out.tailBladeL = scrO(add(tipP, mul(yv, rr * 1.2)), out.tailBladeL || {}); out.tailBladeR = scrO(add(tipP, mul(yv, -rr * 1.2)), out.tailBladeR || {}); }
    /* ---- the necks and heads ---- */
    const neckE = evE([0.52, 0.72]), headE = evE([0.62, 0.8]), crownE = evE([0.74, 0.86]);
    for (let s = 0; s < 2; s++) {
      if (spSide >= 0 && s !== spSide) continue; const sg = s ? -1 : 1, Ls = s ? 'R' : 'L', cen = spSide >= 0 ? 0 : 1;
      const aim = tgt(s ? S.aimR : S.aimL), jawT = cl(num(s ? S.jawR : S.jawL, 0)), chg = cl(num(s ? S.chargeR : S.chargeL, 0)), rec = f2(st, 'rec' + s, cl(num(s ? S.recoilR : S.recoilL, 0)), s ? 9 : 11, s ? 0.45 : 0.35, dt, snap);
      // idle look: each head holds a look a while then re-aims (Lux quick and restless, Umbra slow and still), sometimes glancing at the other
      const per = s ? 4.6 : 2.7, sd2 = s ? 3.7 : 1.1, lkY = hold(t, per, sd2, s ? 0.5 : 0.18) * (s ? 0.45 : 0.6), lkP = hold(t, per * 1.3, sd2 + 2, 0.4) * 0.18, gl = sstep(0.75, 0.95, hold(t, 7.3, s ? 5.1 : 2.2, 0.3) * 0.5 + 0.5) * (aim ? 0 : 1);
      // the head's place: rest, raised, drawn together (meet), lowered toward a near target (the charge brings it down and forward), thrown back (recoil)
      const hp0 = [HREST[0], sg * HREST[1] * cen, HREST[2]];
      let hp = add(hp0, [0.25 * Math.sin(t * 0.7 + s * 2), sg * 0.2 * Math.sin(t * 0.5 + s), 0.18 * Math.sin(t * 0.9 + s * 1.3) + 0.15 * brth]);
      hp = add(hp, [-0.8 * raise, sg * 0.4 * raise * cen, 2.6 * raise]); hp = add(hp, [-0.4 * roar, sg * 0.3 * roar * cen, 1.4 * roar]);
      hp = add(hp, [0.6 * meet, -sg * 1.6 * meet * cen, 0.3 * meet]);
      let yawH, pitH;
      if (aim) { const rel = sub(aim, hp), hd = Math.hypot(rel[0], rel[1]), lw = cl(1 - (hd - 6) / 22) * (0.5 + 0.5 * chg); hp = add(hp, [Math.min(2.2, rel[0] * 0.08) * lw + 0.8 * chg, Math.max(-1.8, Math.min(1.8, rel[1] * 0.08)) * lw, -2.8 * lw - 1.0 * chg]);
        const r2 = sub(aim, hp); yawH = Math.atan2(r2[1], r2[0]); pitH = Math.atan2(r2[2], Math.hypot(r2[0], r2[1])); }
      else { yawH = sg * 0.35 * cen + lkY - sg * gl * 1.25 * cen - sg * meet * 1.0 * cen; pitH = -0.18 + lkP + 0.55 * raise + 0.7 * roar; }
      hp = add(hp, [-1.1 * rec, sg * 0.3 * rec, 0.9 * rec]); pitH += 0.55 * rec; pitH += stag * 0.2 * Math.sin(t * 9 + s);
      yawH = Math.max(-1.75, Math.min(1.75, yawH)); pitH = Math.max(-1.15, Math.min(0.95, pitH));
      if (cen) hp[1] = sg * Math.max(1.15, sg * hp[1]);   // (the heads never cross: each keeps its own side)
      // the springs: Lux snappier with a little overshoot, Umbra smoother and slower (two minds)
      const wH = s ? 4.2 : 6.5, zH = s ? 0.9 : 0.62, hpS = [f2(st, 'hx' + s, hp[0], wH, zH, dt, snap), f2(st, 'hy' + s, hp[1], wH, zH, dt, snap), f2(st, 'hz' + s, hp[2], wH, zH, dt, snap)];
      const yS = f2(st, 'hyaw' + s, yawH, wH * 1.2, zH, dt, snap), pS = f2(st, 'hpit' + s, pitH, wH * 1.2, zH, dt, snap), tilt = 0.15 * Math.sin(t * 0.6 + s * 2.5) * lv * (aim ? 0.3 : 1) + sg * 0.12 * gl;
      const jaw = f2(st, 'jaw' + s, Math.max(jawT, roar * 0.95, 0.06 + 0.05 * Math.sin(t * (s ? 0.8 : 1.4) + s) * lv), 14, 0.55, dt, snap);
      const Rh0 = mm(rz(yS), mm(ry(-(pS + jaw * 0.12)), rx(tilt))), hpW = BP(hpS), Rh = BR(Rh0), HS = 1.95 * (0.4 + 0.6 * headE) * (spSide >= 0 ? 1.15 : 1);
      // the neck: a cubic from its root (rising, a little forward and out) into the back of the skull (entering from below and behind)
      const root = BP([NROOT[0] + (cen ? 0 : 0.1), sg * NROOT[1] * cen, NROOT[2]]), T0 = norm(mv(Mb, [0.25, sg * 0.4 * cen, 1])), ent = mv(Rh, norm([0.5, 0, 0.86])), hb = add(hpW, mv(Rh, [-0.22 * HS, 0, -0.12 * HS]));
      const dl = len(sub(hb, root)), P1 = add(root, mul(T0, dl * 0.42)), P2 = sub(hb, mul(ent, dl * 0.45)), CP = [root, P1, P2, hb];
      let acc = 0, prev = root; BZS[0] = 0; for (let i = 1; i <= 32; i++) { const q2 = bz(CP, i / 32); acc += len(sub(q2, prev)); BZS[i] = acc; prev = q2; }
      const n = lod ? 8 : NNS[k] - (low ? 3 : 0), NK = NECKS[s], segL = acc / n * neckE + 1e-3; let xv = mv(Mb, [1, 0, 0]);
      const at = sL => { let i = 1; while (i < 32 && BZS[i] < sL) i++; const u = ((i - 1) + (sL - BZS[i - 1]) / Math.max(1e-6, BZS[i] - BZS[i - 1])) / 32; return bz(CP, Math.min(1, u)); };
      for (let j = 0; j < n; j++) { const a = at(j * segL), b2 = at((j + 1) * segL), dd = norm(sub(b2, a)), dt2 = dot(xv, dd); xv = norm(sub(xv, mul(dd, dt2))); NK.p[j] = a; NK.d[j] = dd; NK.x[j] = xv; NK.L[j] = len(sub(b2, a)); NK.r[j] = (1.3 - 0.62 * Math.pow(j / n, 0.8)) * (1 + 0.06 * (k - 1)); }
      NK.n = n;
      const chF = chg * 1.15;   // (the charge's front: from the core up the neck into the jaw)
      if (neckE > 0.02) for (let j = 0; j < n; j++) { const dd = NK.d[j], xv2 = NK.x[j], yv = cross(dd, xv2), rr = NK.r[j];
        put('nvert', k, colsR(mul(xv2, rr), mul(yv, rr), mul(dd, NK.L[j] * 1.12)), NK.p[j], 1, { side: s, kind: 0.15 + 0.7 * j / n, g2: chF, glow: fin * 0.4, d0: 0.45 + 0.005 * j, hb: 1, sp: spSide >= 0 }, [0.52 + 0.2 * j / n, 0.62 + 0.1 * j / n]); }
      // the head (its skull, the jaw on its hinge, the throat's machinery when it opens)
      const hm = p => add(hpW, mv(Rh, mul(p, HS)));
      if (headE > 0.02) {
        put('skull', [s, k], mm(Rh, I3), hpW, HS, { side: s, g2: chg, glow: fin * 0.3 + (1 - headE) * 2, eye: 1 + chg + fin, d0: 0.5 }, [0.62, 0.8]);
        const hin = [-0.12, 0, -0.25], Rj = ry(jaw * 0.72), org = sub(hin, mv(Rj, hin));
        put('jaw', s, mm(Rh, Rj), hm(org), HS, { side: s, g2: chg, glow: fin * 0.3 + (1 - headE) * 2, d0: 0.5 }, [0.62, 0.8]);
        if (jaw > 0.12) { const Rt = s ? mm(Rh, rx(t * (5 + 14 * chg))) : Rh; put(s ? 'cryo' : 'furnace', null, Rt, hm([0.3, 0, -0.2]), HS * (0.8 + 0.4 * chg), { side: s, g2: chg, glow: 0.6 + 2 * chg, noInk: 1, d0: 0.5 }, [0.65, 0.8]); }
      }
      // the anchors
      const mo = out['mouth' + Ls] || (out['mouth' + Ls] = {}), mP = hm(add([2.85, 0, -0.32], [0, 0, -0.15 * jaw])), fw = mv(Rh, mv(ry(-jaw * 0.3), [1, 0, 0])), m2 = scr(add(mP, mul(fw, 2)));
      scrO(mP, mo); let ddx = m2[0] - mo.x, ddy = m2[1] - mo.y; const dl2 = Math.hypot(ddx, ddy) || 1; mo.dx = ddx / dl2; mo.dy = ddy / dl2; mo.open = jaw; mo.p3 = mP; mo.f3 = fw;
      const gP = [mP[0], mP[1], 0], gs = scr(gP); mo.gx = gs[0]; mo.gy = gs[1];
      if (S.x != null) { const c = Math.cos(yaw), s3 = Math.sin(yaw), wxm = c * mP[0] - s3 * mP[1], wym = s3 * mP[0] + c * mP[1]; mo.wx = S.x + wxm * K / tile; mo.wy = S.y + wym * SE * K / tile; }
      out['throat' + Ls] = scrO(hm([0.4, 0, -0.3]), out['throat' + Ls] || {}); out['head' + Ls] = scrO(hpW, out['head' + Ls] || {});
      out['eyes' + Ls] = [scr(hm([0.95, 0.5, 0.47])), scr(hm([0.95, -0.5, 0.47]))]; out['vent' + Ls] = scrO(hm(s ? [0.2, 0.7, 0.05] : [1.9, 0.3, 0.12]), out['vent' + Ls] || {});
      /* ---- the Mirror Crown behind the head: lagging after it on a spring, turning in its parts; aligned (Concord), expanded (portals) ---- */
      if (spSide < 0) { const cput = num(S.crownOut, 0) < 0.5 ? put : () => null;   // (S.crownOut: the crowns leave the model: the ultimate's portals take over from the anchors, which stay current)
        const cA = f2(st, 'crA', cl(num(S.crownAlign, 0)), 3, 0.9, dt, snap), cX = f2(st, 'crX' + s, cl(num(S.crownExpand, 0)), 2.4, 0.85, dt, snap), spd = num(s ? S.crownSpeedR : S.crownSpeedL, 1) * (1 + 2.2 * fin) * (1 + 0.8 * chg) * (1 + 2.5 * (1 - crownE));
        const ang = (st['cra' + s] || 0) + dt * spd * (s ? -0.32 : 0.38) * (1 + (1 - conc) * (s ? 0.4 : -0.2)); st['cra' + s] = ang; const angC = st.craC = (st.craC || 0) + (s ? 0 : dt * 0.35 * (1 + 2 * fin)), a1 = lerp(ang, (s ? -1 : 1) * angC, cA);
        const camM = mv(rz(-yaw), PDW), cc0 = add(add(BP([HREST[0] - 0.8, sg * (HREST[1] + 1.0), HREST[2] + 2.1]), sub(hpW, BP(hp0))), mul(norm([camM[0], camM[1], 0]), -2.4));
        const cc1 = add(cc0, [0, sg * 3.5 * cX, 9 * cX]), ccS = [f2(st, 'cx' + s, cc1[0], 3.2, 0.55, dt, snap), f2(st, 'cy' + s, cc1[1], 3.2, 0.55, dt, snap), f2(st, 'cz' + s, cc1[2], 3.2, 0.55, dt, snap)];
        const cax = norm(add(mul(norm([camM[0], camM[1], 0]), 0.8), [0.25 + 0.2 * Math.cos(yS) * (1 - cA), sg * 0.3 * (1 - cA) * (1 - cX), 0.35])), R0c = frameZ(cax, [0, 0, 1]), rad = CRR[k] * (1 + 2.6 * cX) * (0.2 + 0.8 * crownE), gl0 = 0.3 + fin + chg * 0.8 + cX;
        cput('crownOut', s, mm(R0c, rz(a1)), ccS, rad, { side: s, glow: gl0, d0: 0.6 }, [0.74, 0.86]);
        cput('crownRune', null, mm(R0c, rz(-a1 * 1.6 + 0.3)), ccS, rad, { side: s, glow: gl0, kind: a1, d0: 0.6 }, [0.74, 0.86]);
        const g3 = (st['crg' + s] || 0) + dt * spd * 0.7; st['crg' + s] = g3;
        cput('crownMer', null, mm(R0c, mm(rz(0.4 + a1 * 0.3), rx(lerp(g3, 0, cA)))), ccS, rad, { side: s, glow: gl0, d0: 0.6 }, [0.76, 0.86]);
        if (k >= 2) cput('crownMer', null, mm(R0c, mm(rz(1.9 - a1 * 0.4), rx(lerp(-g3 * 0.8 + 1.2, Math.PI / 2, cA)))), ccS, rad * 0.88, { side: s, glow: gl0, d0: 0.6 }, [0.76, 0.86]);
        if (k >= 3) cput('crownVast', null, mm(R0c, rz(-a1 * 0.6)), ccS, rad * 1.3, { side: s, glow: gl0 + 0.2, d0: 0.6 }, [0.8, 0.88]);
        const co = out['crown' + Ls] || (out['crown' + Ls] = {}); scrO(ccS, co); co.r = rad * K; const ax2 = mv(R0c, [0, 0, 1]), w2 = W3(ax2); co.ang = Math.atan2(-(w2[1] * SE - w2[2] * CE), w2[0]); co.p3 = ccS; co.nrm = ax2;
      }
    }
    /* ---- the wings ---- */
    const wingT = cl(num(S.wing, WING0)), wingE = evE([0.82, 1]), beatT = cl(Math.max(num(S.beat, 0), fly * 0.75)), guard = f2(st, 'guard', cl(num(S.guard, 0)), 5, 0.75, dt, snap);
    const wsp = f2(st, 'wing', Math.max(wingT * wingE, roar * 0.7, fly * 0.6) * (spSide >= 0 ? 1 : 1), 3.6, 0.72, dt, snap), beat = f1(st, 'beat', beatT, 3, dt, snap);
    /* the wings' fit to the view: when the view (opts.vw, px; draw() takes the canvas's visible width) is narrower than the fully spread
       span would need (about 3.5 x size), the wings are drawn shorter (never below 0.6) so the spread stays within 90% of it: a phone's
       width in a fight at L7. Studio stills and wide screens keep the full size */
    const wfit = opts.vw ? Math.max(0.6, Math.min(1, 0.9 * opts.vw / (3.5 * size))) : 1; out.wfit = wfit;
    const bph = st.bph = (st.bph || 0) + dt * (5.2 + 1.5 * beat) * (beat > 0.01 ? 1 : 0.3); const idleF = 0.04 * Math.sin(t * 0.8) * lv;
    for (let s = 0; s < 2; s++) { const sg = s ? -1 : 1, Ls = s ? 'R' : 'L', sd = spSide >= 0 ? spSide : s, WL = WLEN[k], kb = 1;
      const wsS = cl(wsp + (s ? 0.02 : -0.02) * Math.sin(t * 0.6)), fl = Math.sin(bph + s * 0.15) * beat;
      const dirW = (swp, el) => mv(Mb, [-Math.cos(el) * Math.sin(swp), sg * Math.cos(el) * Math.cos(swp), Math.sin(el)]);
      const ang = (a0, a1, ag) => lerp(lerp(a0, a1, wsS), ag, guard);
      const hSw = ang(1.05, -0.22, -1.1), hEl = ang(0.95, 0.72, 0.5) + 0.5 * fl + idleF, fSw = ang(2.45, -0.22, -2.45), fEl = ang(-0.25, 0.38, 0.05) + 0.32 * Math.sin(bph - 0.6 + s * 0.15) * beat, nSw = ang(1.75, 0.12, -2.95), nEl = ang(-0.25, -0.1, -0.35) + 0.28 * Math.sin(bph - 1.2 + s * 0.15) * beat;
      const W0 = BP([WROOT[0], sg * WROOT[1], WROOT[2]]), dh = dirW(hSw, hEl), E = add(W0, mul(dh, WL[0] * kb * wfit)), df = dirW(fSw, fEl), Wr = add(E, mul(df, WL[1] * kb * wfit)), dn = dirW(nSw, nEl), Tp = add(Wr, mul(dn, WL[2] * kb * wfit));
      const up0 = mv(Mb, [0, 0, 1]), back0 = mv(Mb, [-1, 0, 0]), wN = v => { let u2 = sub(up0, mul(v, dot(up0, v))); if (len(u2) < 0.05) u2 = sub(back0, mul(v, dot(back0, v))); return norm(u2); };
      const sc2 = 0.4 + 0.6 * wingE;
      // a bone's frame: its +z along the bone, +y up (its armour on top), +x its trailing side (sg mirrors the right wing)
      const bF = d2 => { const yn = wN(d2); return [mul(norm(cross(yn, d2)), sg), yn, d2]; };
      { const [bx, by, bzz] = bF(dh); put('wsh', null, colsR(bx, by, bzz), W0, 1.5 * sc2, { side: sd, d0: 0.55 }, [0.8, 0.95]); }
      const bonePut = (a, d2, L2, ord) => { const [bx, by] = bF(d2); put('wbone', null, colsR(mul(bx, 1.75), mul(by, 1.75), mul(d2, L2)), a, 1, { side: sd, d0: 0.55, hb: 1 }, ord); };
      bonePut(W0, dh, WL[0] * wfit, [0.82, 0.95]); bonePut(E, df, WL[1] * wfit, [0.84, 0.97]); bonePut(Wr, dn, WL[2] * 0.85 * wfit, [0.86, 0.99]);
      { const [ax1, ay1] = bF(df), [ax2, ay2] = bF(dn); put('wplate', null, colsR(ax1, ay1, df), add(E, mul(df, 0.45)), 1.65 * sc2, { side: sd, d0: 0.56 }, [0.84, 0.97]); put('wplate', null, colsR(ax2, ay2, dn), add(Wr, mul(dn, 0.4)), 1.4 * sc2, { side: sd, d0: 0.56 }, [0.86, 0.99]); }
      // the feather-blades: fanned along the forearm and hand (inner ones trailing down, outer ones swept out along the hand), coverts over
      // their roots, L7 a third layer; each blade's own spring (it lags the beat and flutters)
      const nb = lod ? [0, 9, 11, 12][k] : NBL[k] - (low ? 3 : 0), ncv = lod ? [0, 5, 6, 7][k] : NCV[k] - (low ? 3 : 0), nb3 = low ? 0 : lod ? [0, 0, 3, 4][k] : NB3[k], bwK = lod ? 1.25 : 1;   // (the game's level of detail: fewer, a little wider)
      const bfS = st['bf' + s] || (st['bf' + s] = new Float32Array(48)), bvS = st['bv' + s] || (st['bv' + s] = new Float32Array(48)), drive = -Math.cos(bph + s * 0.15) * beat * 0.6 + yrs * 0.04 * sg - 0.3 * (fly > 0.2 ? 0 : 0);
      const layer = (cnt, a0, a1, Lf, fan0, fan1, off, lift2, wsc, base) => {
        for (let i = 0; i < cnt; i++) { const u = cnt > 1 ? i / (cnt - 1) : 0, a = lerp(a0, a1, u), onH = a > 0.5, P0 = onH ? lerp3(Wr, Tp, (a - 0.5) * 2) : a < 0 ? lerp3(W0, E, 1 + a * 2) : lerp3(E, Wr, a * 2), bd = onH ? dn : a < 0 ? dh : df;
          let trl = add(mul(up0, -0.93), mul(back0, 0.36)); trl = norm(sub(trl, mul(bd, dot(trl, bd))));   // (the trailing direction in the wing's plane: down and back)
          const nW = mul(norm(cross(bd, trl)), sg);   // (the wing plane's normal, toward its front)
          const fanA = lerp(lerp(1.25 + 0.15 * u, lerp(fan0, fan1, Math.pow(u, 1.15)), wsS), 0.15 + 0.7 * u, guard),   // (folded or guarding: the blades close along the bones)
            bdir = norm(add(mul(trl, Math.cos(fanA)), mul(bd, Math.sin(fanA))));
          const j = base + i; if (dt > 0) { bvS[j] += ((drive * (0.6 + u) - bfS[j]) * (60 + 20 * hash(j)) - bvS[j] * (6 + 3 * u)) * dt; bfS[j] += bvS[j] * dt; } else if (snap) { bfS[j] = 0; bvS[j] = 0; }
          const wide = norm(cross(bdir, nW)), flex = bfS[j] + 0.03 * Math.sin(t * 1.7 + j * 0.9) * lv, Rb = axisR(wide, flex), zA = mv(Rb, bdir), xA = mv(Rb, mul(wide, -1)), yA = mul(cross(zA, xA), 1);
          const Lb = Lf(u) * WSZ * wfit * (0.5 + 0.5 * wingE);
          put('blade', sd, colsR(mul(xA, wsc * bwK * 5.0 * (0.4 + 0.6 * wfit)), mul(yA, wsc * 4.2 * (0.4 + 0.6 * wfit)), mul(zA, Lb)), add(P0, mul(nW, off)), 1, { side: sd, glow: 0.25 + fin * 0.6 + (spSide >= 0 ? 0.5 : 0), g2: fin, kind: u, d0: 0.6 + 0.003 * j, sp: spSide >= 0 }, [0.84 + 0.1 * u, 1]);
          if (base === 0 && i === cnt - 1) { out['wingTip' + Ls] = scrO(add(P0, mul(zA, Lb)), out['wingTip' + Ls] || {}); out['wingTip' + Ls].p3 = add(P0, mul(zA, Lb)); } } };
      layer(nb, -0.36, 1, u => (4.4 + 5.4 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.78 + 0.12)), 0.8) + 1.0 * u) * (1 + 0.08 * (k - 1)), -0.12, 1.3, 0.0, 0, 1 + 0.1 * (k - 1), 0);
      layer(ncv, -0.45, 0.85, u => (2.8 + 1.6 * Math.sin(Math.PI * u)) * (1 + 0.06 * (k - 1)), 0.1, 1.0, 0.18, 0, 0.85, 20);
      if (nb3) layer(nb3, -0.2, 0.95, u => (3.6 + 3.0 * Math.sin(Math.PI * u)) * (1 + 0.1 * (k - 1)), 0.0, 1.15, 0.1, 0, 0.9, 36);
      out['wingRoot' + Ls] = scrO(W0, out['wingRoot' + Ls] || {}); }
    /* ---- idle life: embers rising off Lux's vents and frost motes round Umbra's (cosmetic: skipped under lowFx) ---- */
    if (!low && !lod && spSide < 0 && ent > 0.9 && dis < 0.1 && out.headL && out.headR) for (let i = 0; i < 4; i++) { const u = (t * 0.45 + i / 4) % 1, hl = st.hx0 != null ? BP([st.hx0, st.hy0, st.hz0]) : null, hr = st.hx1 != null ? BP([st.hx1, st.hy1, st.hz1]) : null;
      if (hl) put('ember', null, rz(t + i), add(hl, [0.6 + 0.4 * Math.sin(i * 2.1 + t), 0.4 * Math.cos(i * 1.3 + t * 0.7), 0.8 + u * 3.2]), 0.07 * (1 - u), { side: 0, glow: 1.2, alpha: 0.98, noInk: 1, d0: 0.4 }, [0.9, 1]);
      if (hr) put('frag', null, mm(rz(t * 0.5 + i), rx(t + i)), add(hr, [0.5 + 0.6 * Math.sin(i * 1.7), -0.5 * Math.cos(i * 2.3 + t * 0.4), 0.5 + 1.6 * Math.sin(u * Math.PI)]), 0.07, { side: 1, glow: 0.8, noInk: 1, d0: 0.4 }, [0.9, 1]); }
    out.unit = K; out.yaw = yaw; out.ground = [X0, Y0]; out.k = k; out.fly = fly;
    return out;
  }
  /* two-bone IK with a pole: hip H, target A, lengths; the joint bends toward the pole */
  function ik(H, A, L1, L2, pole) { let d = sub(A, H); const dl = Math.min(L1 + L2 - 0.002, Math.max(Math.abs(L1 - L2) + 0.05, len(d))); d = mul(norm(d), dl); const dn = norm(d), a = Math.acos(cl((L1 * L1 + dl * dl - L2 * L2) / (2 * L1 * dl)));
    let pp = sub(pole, mul(dn, dot(pole, dn))); if (len(pp) < 1e-4) pp = cross(dn, [0, 1, 0]); pp = norm(pp); const K = add(H, add(mul(dn, Math.cos(a) * L1), mul(pp, Math.sin(a) * L1))); return { K, A: add(H, d), pp }; }

  /* ================= drawing ================= */
  const POOL = [], ITEMS = [], TRANS = []; let NP = 0;
  const item = () => { const g = POOL[NP] || (POOL[NP] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NP++; return g; };
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0, calls: 0 };
  const RES = { k: 1 };
  function visBox(c) { const m = c.getTransform ? c.getTransform() : null, cv = c.canvas; if (!m || !cv || !cv.width) return null; const det = m.a * m.d - m.b * m.c; if (Math.abs(det) < 1e-9) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let q = 0; q < 4; q++) { const X = q & 1 ? cv.width : 0, Y = q & 2 ? cv.height : 0, dx = X - m.e, dy = Y - m.f, ux = (m.d * dx - m.c * dy) / det, uy = (-m.b * dx + m.a * dy) / det; x0 = Math.min(x0, ux); y0 = Math.min(y0, uy); x1 = Math.max(x1, ux); y1 = Math.max(y1, uy); }
    return [Math.floor(x0) - 2, Math.floor(y0) - 2, Math.ceil(x1) + 2, Math.ceil(y1) + 2]; }
  const PXB = [[0.6e6, 0.42e6, 0.3e6, 0.3e6], [0.42e6, 0.3e6, 0.2e6, 0.2e6], [0.35e6, 0.25e6, 0.18e6, 0.18e6]];
  const budget = j => { try { if (typeof GQ === 'undefined' || typeof arc === 'undefined' || !arc.game || arc.mode !== 'dungeon') return 1e12; return PXB[j][Math.max(0, Math.min(3, GQ.level() | 0))]; } catch (e) { return 1e12; } };
  const OCC = new Float32Array(48);
  /* render the posed parts; mode 0 the model, 1 a spectral construct ('L' / 'R') */
  function pass(c, S, x, y, size, opts, spec) {
    if (NOGL) return null; opts = opts || {};
    /* the level of detail: by the size drawn in device pixels (the game's in a fight), the spectral constructs always; stills, the collection and close-ups (opts.full) the full set */
    const tf0 = c.getTransform ? c.getTransform() : null, dpx = size * (tf0 ? Math.hypot(tf0.a, tf0.b) : 1), lod = opts.lod != null ? !!opts.lod : spec ? true : !opts.full && dpx < LODPX;
    if (!ensure(lod) && !(data(!lod).ready)) return null; const DS = data(lod).ready ? data(lod) : data(!lod), lodM = DS === DL;
    try {
      const M = DS.M, k = kOf(S), K = size / HEIGHT[k], kk = K / WS, sw = WS, dis = cl(num(S.dissolve, 0)), ent = cl(num(S.enter, 1)), low = !!(S.lowFx || lowFx() || opts.low);
      const fxS = spec === 'L' ? 1.0 : spec === 'R' ? 2.0 : 0, fadeS = cl(num(opts.fade, 0)), emg = opts.emerge == null ? 0 : cl(opts.emerge);
      ITEMS.length = 0; TRANS.length = 0; NP = 0; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; let yawC = 0;
      const HID = opts.hide ? new Set(opts.hide) : null;
      const put = (nm, ix, R, T, sc, op, ordW) => {
        if (HID && HID.has(nm)) return null; let mesh = M[nm]; if (!mesh) return null; if (ix != null) mesh = Array.isArray(ix) ? mesh[ix[0]][ix[1]] : mesh[ix]; if (!mesh) return null;
        sc = sc || 1; let ga = 0, al = op.alpha == null ? 1 : op.alpha;
        if (ent < 0.999 && ordW) { const a = sstep(ordW[0], ordW[1], ent); if (a < 0.02) return null; const dir = sub(T, [0, 0, 7]), ax = norm([hash(T[0] * 3.1 + T[2]) - 0.5, hash(T[1] * 5.7 + 1) - 0.5, 0.7]);
          T = add(T, add(mul(dir, (1 - a) * 0.35), [0, 0, (1 - a) * 1.6])); R = mm(axisR(ax, (1 - a) * 1.4), R); sc *= 0.5 + 0.5 * a; ga = (1 - a) * 2.4; }
        const g = item(), Rm = mm(rz(yawC), R), Tw = mv(rz(yawC), T), z = sw * sc;
        for (let i = 0; i < 3; i++) { g.R0[i] = Rm[i * 3] * z; g.R1[i] = Rm[i * 3 + 1] * z; g.R2[i] = Rm[i * 3 + 2] * z; g.T[i] = Tw[i] * sw; }
        const d0 = op.d0 != null ? op.d0 : 0.4, dd = dis > 0 ? cl((dis - d0 * 0.6) / 0.4) : 0;
        g.mesh = mesh; g.glow = (op.glow || 0) + ga; g.glow2 = op.g2 || 0; g.spill = Math.max(dd, fxS ? fadeS : 0); g.kind = op.kind || 0; g.wear = fxS ? (spec === 'L' ? 0 : 1) : (op.side == null ? 2 : op.side); g.fx = fxS; g.first = 0; g.cnt = 0;
        if (fxS) { al = al * (emg > 0 ? cl(1.2 - emg * (1 - cl((T[2] - 2) / 10)) * 1.2) : 1); if (al < 0.02) return null; }   // (a spectral part drawn as a solid with depth: its shader's own transparency, one layer deep: never a stack of see-through shells)
        g.alpha = al; g.outline = !op.noInk && !(g.spill > 0.001) && !fxS && al > 0.995 && (!lodM || OUTL.has(nm));
        (g.alpha < 0.995 ? TRANS : ITEMS).push(g);
        if (mesh.bs) { const bs = mesh.bs, c3 = add(T, mv(R, mul(bs, sc))), sk = Math.max(Math.hypot(R[0], R[3], R[6]), Math.hypot(R[1], R[4], R[7]), Math.hypot(R[2], R[5], R[8])), w = W3y(c3), rr = (bs[3] * sc * sk * 1.03 + 0.05) * K, X = x + w[0] * K, Y = y + (w[1] * SE - w[2] * CE) * K;
          if (X - rr < bx0) bx0 = X - rr; if (X + rr > bx1) bx1 = X + rr; if (Y - rr < by0) by0 = Y - rr; if (Y + rr > by1) by1 = Y + rr; }
        return g; };
      const W3y = p => mv(rz(yawC), p);
      // the solver's put receives model-space parts; the yaw is applied here (yawC is set from the solver's state before any part)
      const st0 = S._rz; yawC = st0 && st0.yaw != null ? st0.yaw : 0;
      let first = true; const put2 = (nm, ix, R, T, sc, op, ordW) => { if (first) { first = false; yawC = S._rz && S._rz.yaw != null ? S._rz.yaw : yawC; } return put(nm, ix, R, T, sc, op, ordW); };
      const out = solve0(S, x, y, size, opts, put2, spec, lodM); out.lod = lodM;
      if (!(bx1 > bx0) || !(ITEMS.length + TRANS.length)) return out;
      ITEMS.sort((a, b) => a.mesh.nv - b.mesh.nv); TRANS.sort((a, b) => (a.T[0] * PDW[0] + a.T[1] * PDW[1] + a.T[2] * PDW[2]) - (b.T[0] * PDW[0] + b.T[1] * PDW[1] + b.T[2] * PDW[2])); for (const g2 of TRANS) ITEMS.push(g2);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__RZ_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : RES.k) * (typeof GQ !== 'undefined' && GQ.animaK ? GQ.animaK() : 1) * (opts.res || 1);
      bx0 = Math.floor(bx0) - 3; by0 = Math.floor(by0) - 3; bx1 = Math.ceil(bx1) + 3; by1 = Math.ceil(by1) + 3;
      let rx0 = bx0, ry0 = by0, rx1 = bx1, ry1 = by1, vis = true; { const vb = visBox(c); if (vb) { rx0 = Math.max(rx0, vb[0]); ry0 = Math.max(ry0, vb[1]); rx1 = Math.min(rx1, vb[2]); ry1 = Math.min(ry1, vb[3]); vis = rx1 > rx0 + 1 && ry1 > ry0 + 1; } }
      let W = Math.ceil((rx1 - rx0) * dev), H = Math.ceil((ry1 - ry0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      { const bud = budget(fxS ? 2 : 0); if (W * H > bud) { const q = Math.sqrt(bud / (W * H)); W = Math.max(2, Math.ceil(W * q)); H = Math.max(2, Math.ceil(H * q)); } }
      const bw = rx1 - rx0, bh = ry1 - ry0;
      // the occluders: spheres inside the torso, the neck roots and the heads (soft occlusion and key-light shadows between the parts)
      let no = 0; const oc = (p, r) => { if (no >= 12 || !p) return; const w = mv(rz(yawC), p); OCC[no * 4] = w[0] * sw; OCC[no * 4 + 1] = w[1] * sw; OCC[no * 4 + 2] = w[2] * sw; OCC[no * 4 + 3] = r * sw; no++; };
      if (!low && !fxS) { const R = S._rz; const B0 = [R.tbx || 0, 0, 0]; void B0; oc(TS([2.4, 0, 6.8]), 2.0 * TSC); oc(TS([-0.3, 0, 6.5]), 1.6 * TSC); oc(TS([-3.0, 0, 6.4]), 1.45 * TSC);
        if (R.hx0 != null) oc([R.hx0 + 0.8, R.hy0, R.hz0 + 0.1], 0.8); if (R.hx1 != null) oc([R.hx1 + 0.8, R.hy1, R.hz1 + 0.1], 0.8); }
      const Sv = { px: PXW, py: PYW, pd: PDW, cl: [2 * kk / bw, 2 * (x - rx0) / bw - 1, -2 * kk / bh, 1 - 2 * (y - ry0) / bh], v: PDW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low, rim: RIMC, amb: AMBC, t: nowMs() / 1000 % 1000, keep: 2,
        outline: opts.ink === false || low || fxS ? 0 : Math.max(0.6, 0.7 * (W / bw)), outlineCol: OUTC, outlineBias: 0.0025, clip: null, occ: no ? OCC : null, nocc: no };
      const t0 = nowMs(), cvs = vis ? GLM.render(W, H, Sv, ITEMS) : null; if (!cvs && vis) return null;
      const alp = (opts.alpha == null ? 1 : opts.alpha) * (fxS && S.alpha != null ? cl(S.alpha) : 1); if (cvs && alp > 0.004) { c.save(); c.globalAlpha = Math.min(1, alp); c.drawImage(cvs, 0, 0, W, H, rx0, ry0, bw, bh); c.restore(); }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; if (!GLM.soft && STATS.n > 20) RES.k = STATS.ms > 7 ? Math.max(0.6, RES.k - 0.02) : STATS.ms < 3.5 ? Math.min(1, RES.k + 0.01) : RES.k; STATS.items = ITEMS.length; STATS.W = W; STATS.H = H; STATS.calls = GLM.stats ? GLM.stats.calls : 0; STATS.tris = GLM.stats ? Math.round(GLM.stats.tris) : 0;
      out.bb = [bx0, by0, bx1, by1]; if (spec) out.mouth = out['mouth' + spec];
      return out;
    } catch (e) { fail(e); return null; }
  }
  const NOPUT = () => null;
  /* the anchors without the GPU (the same springs: call this or draw, once a frame) */
  function solve(x, y, size, S, opts) { try { return solve0(S, x, y, size, opts || {}, NOPUT, null, !!(opts && opts.lod)); } catch (e) { return null; } }
  function draw(c, x, y, size, S, opts) { if (!S || !usable()) return null; opts = opts || {}; if (opts.vw == null && opts.fit !== false) { const vb = visBox(c); if (vb) opts = Object.assign({}, opts, { vw: vb[2] - vb[0] - 4 }); } const r = pass(c, S, x, y, size, opts, null); if (r && opts && opts.shadow !== false) {} return r; }
  function drawSpectral(c, x, y, size, S, side, opts) { if (!S || !usable()) return null; const S2 = S._sp || (S._sp = {}); for (const k2 in S) if (k2 !== '_rz' && k2 !== '_sp') S2[k2] = S[k2]; return pass(c, S2, x, y, size, opts, side === 'R' ? 'R' : 'L'); }
  const anchors = S => (S && S._rz && S._rz.out) || null;
  /* AnimaArt's route: the Anima at (x, y) (its feet), size px tall, at time t; o.inst.rzS (the moves' pose) or the form's idle */
  const STILLS = {};
  function drawAnima(c, k, x, y, size, t, o) {
    o = o || {}; if (!usable()) return false;
    const ip = o.inst && o.inst.rzS; let S = ip;
    if (!S) { const key = 'k' + k + (o.flip ? 'f' : ''); S = STILLS[key] || (STILLS[key] = idle(k === 3 ? 7 : k === 2 ? 4 : 1, 0)); S.t = t || 0; S.evo = k === 3 ? 7 : k === 2 ? 4 : 1; S.face = FACE0 + (o.flip ? -0.9 : 0) + (o.yaw != null ? Math.max(-0.5, Math.min(0.5, o.yaw - 0.42)) : 0); S.wing = 0.85; }
    const vb = visBox(c), r = pass(c, S, x, y, size, { alpha: o.alpha == null ? 1 : o.alpha, still: !ip && !o.live, tile: o.tile, full: !ip, vw: vb ? vb[2] - vb[0] - 4 : null }, null);
    if (o.inst && ip) o.inst.rzOut = r;
    if (r && !ip && o.light !== false && size >= 60) lights(c, r, S, o.alpha == null ? 1 : o.alpha);
    return !!r;
  }
  /* the cores' and eyes' light on the shared GPU painter (stills, menus; the moves may call it too) */
  function lights(c, r, S, al) {
    try { const N = typeof self !== 'undefined' && self.NIDHOGG_MOVES, F = N && N.FGFX; if (!F || !F.usable() || !r || !r.coreL) return false; al = al == null ? 1 : al;
      F.flush(c); const Q = F.begin(c, null);
      Q.glow(r.coreL.x, r.coreL.y, r.coreL.r * 3.2, '#FF8A2A', 0.42 * al); Q.glow(r.coreL.x, r.coreL.y, r.coreL.r * 1.2, '#FFE2A0', 0.5 * al);
      Q.glow(r.coreR.x, r.coreR.y, r.coreR.r * 3.2, '#3FA8FF', 0.42 * al); Q.glow(r.coreR.x, r.coreR.y, r.coreR.r * 1.2, '#D8F4FF', 0.5 * al);
      if (r.eyesL) for (const e of r.eyesL) Q.glow(e[0], e[1], r.unit * 0.35, '#FFB040', 0.4 * al); if (r.eyesR) for (const e of r.eyesR) Q.glow(e[0], e[1], r.unit * 0.35, '#7FE0FF', 0.4 * al);
      F.flush(c); F.begin(c, null); return true; } catch (e) { return false; }
  }
  /* effect meshes in screen space (one GLM pass): { m: 'shard' | 'spire' | 'ember' | 'sun' | 'planet' | 'ringL' | 'ringR' | 'crownL' | 'crownR', X, Y (screen
     px: a spire's foot, else its centre), s (px a model unit), yaw, tilt, a (alpha), side 'L' | 'R', g (glow), h (a spire's rise / a crown's
     opening 0..1), z (depth: larger nearer; default Y), t (time for the spins) } */
  const SV = [0, 0, 1], SUP = [0, -1, 0], SLK = norm([-0.45, -0.7, 0.55]), SLS = norm([-0.2, -0.85, 0.5]), SLR = norm([0.65, 0.45, -0.2]), PX2 = [1, 0, 0], PY2 = [0, 1, 0], PD2 = [0, 0, 1];
  const CAM = [1, 0, 0, 0, SE, -CE, 0, CE, SE];
  function drawParts(c, list, o) {
    if (NOGL || !list || !list.length || !usable()) return false; o = o || {}; if (!ensure(true) && !data(false).ready) return false; const d = data(true).ready ? data(true) : data(false);
    try { ITEMS.length = 0; TRANS.length = 0; NP = 0; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const M = d.M;
      const box = (x, y, r) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
      const putP = (mesh, R, T, al, gl, g2, side, kind, ink) => { if (!mesh) return; const g = item(); for (let i = 0; i < 3; i++) { g.R0[i] = R[i * 3] * 0.01; g.R1[i] = R[i * 3 + 1] * 0.01; g.R2[i] = R[i * 3 + 2] * 0.01; g.T[i] = T[i] * 0.01; }
        g.mesh = mesh; g.alpha = al; g.glow = gl || 0; g.glow2 = g2 || 0; g.spill = 0; g.kind = kind || 0; g.wear = side; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = ink !== false && al > 0.995; (al < 0.995 ? TRANS : ITEMS).push(g); };
      for (const e of list) {
        const s = e.s, al = e.a == null ? 1 : e.a; if (!(al > 0.01) || !(s > 0.05)) continue; const sd = e.side === 'R' ? 1 : 0, tt = e.t || 0;
        const Rb = mm(CAM, mm(rz(e.yaw || 0), rx(e.tilt || 0))), zz = e.z == null ? e.Y : e.z, R = sc => Rb.map(v => v * s * sc);
        if (e.m === 'spire') { const h = cl(e.h == null ? 1 : e.h), v = mv(Rb, [0, 0, -(1 - h) * 2.6]); putP(M.spire, R(1), [e.X + v[0] * s, e.Y + v[1] * s, zz + v[2] * s], al, e.g, 0, 1, 0); box(e.X, e.Y - s * 1.2, s * 2.8); continue; }
        if (e.m === 'sun') { putP(M.sun, R(1).map((v, i) => v), [e.X, e.Y, zz], al, (e.g || 1), 0.5 + (e.g || 0) * 0.3, 0, 0, false); putP(M.corona, R(1.25), [e.X, e.Y, zz], Math.min(0.97, al), e.g || 1, 0, 0, 0, false); putP(M.prom, mm(Rb, rz(tt * 0.6)).map(v => v * s * 1.02), [e.X, e.Y, zz], al, e.g || 1, 0.5, 0, 0, false);
          for (let j = 0; j < 3; j++) putP(M.cring, mm(Rb, mm(rx(0.6 * Math.sin(tt * 0.5 + j * 2)), rz(tt * (1.2 - 0.3 * j) * (j % 2 ? -1 : 1)))).map(v => v * s * (1.5 + 0.2 * j)), [e.X, e.Y, zz], al, 0.4, 0, 0, j); box(e.X, e.Y, s * 2.2); continue; }
        if (e.m === 'planet') { putP(M.planet, mm(Rb, rz(tt * 0.5)).map(v => v * s), [e.X, e.Y, zz], al, e.g || 0.6, 0.3, 1, 0); putP(M.shell, R(1.45), [e.X, e.Y, zz], Math.min(0.96, al), 0.4, 0, 1, 0, false); for (let j = 0; j < 2; j++) putP(M.cring, mm(Rb, mm(rx(1.1 + j * 0.5), rz(-tt * (0.8 + 0.3 * j)))).map(v => v * s * (1.75 + 0.2 * j)), [e.X, e.Y, zz], al, 0.3, 0, 1, j); box(e.X, e.Y, s * 2.3); continue; }
        if (e.m === 'crownL' || e.m === 'crownR') { const s2 = e.m === 'crownR' ? 1 : 0; putP(M.crownOut[s2], mm(Rb, rz(tt * 0.4 * (s2 ? -1 : 1))).map(v => v * s), [e.X, e.Y, zz], al, e.g || 0.5, 0, s2, 0); putP(M.crownRune, mm(Rb, rz(-tt * 0.7)).map(v => v * s), [e.X, e.Y, zz], al, e.g || 0.5, 0, s2, tt);
          putP(M.crownMer, mm(Rb, rx(tt * 0.9)).map(v => v * s), [e.X, e.Y, zz], al, e.g || 0.5, 0, s2, 0); box(e.X, e.Y, s * 1.8); continue; }
        if (e.m === 'ringL' || e.m === 'ringR') { putP(M.cring, R(1), [e.X, e.Y, zz], al, e.g || 0.3, 0, e.m === 'ringR' ? 1 : 0, 0); box(e.X, e.Y, s * 1.2); continue; }
        const mesh = e.m === 'ember' ? M.ember : M.frag; putP(mesh, R(1), [e.X, e.Y, zz], al, e.g || (e.m === 'ember' ? 1.2 : 0.5), 0, e.m === 'ember' ? 0 : sd, 0, e.m !== 'ember'); box(e.X, e.Y, s * 1.2);
      }
      if (!(x1 > x0) || !(ITEMS.length + TRANS.length)) return false; for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__RZ_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (o.res || (lowFx() ? 0.6 : 0.85)) * (typeof GQ !== 'undefined' && GQ.partsK ? GQ.partsK() : 1);
      x0 = Math.floor(x0) - 2; y0 = Math.floor(y0) - 2; x1 = Math.ceil(x1) + 2; y1 = Math.ceil(y1) + 2;
      { const vb = visBox(c); if (vb) { x0 = Math.max(x0, vb[0]); y0 = Math.max(y0, vb[1]); x1 = Math.min(x1, vb[2]); y1 = Math.min(y1, vb[3]); if (!(x1 > x0 + 1 && y1 > y0 + 1)) return true; } }
      const bw = x1 - x0, bh = y1 - y0;
      let W = Math.ceil(bw * dev), H = Math.ceil(bh * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      { const bud = budget(1); if (W * H > bud) { const q = Math.sqrt(bud / (W * H)); W = Math.max(2, Math.ceil(W * q)); H = Math.max(2, Math.ceil(H * q)); } }
      const Sv = { px: PX2, py: PY2, pd: PD2, cl: [200 / bw, -2 * x0 / bw - 1, -200 / bh, 1 + 2 * y0 / bh], v: SV, lk: SLK, ls: SLS, lr: SLR, up: SUP, low: lowFx(), rim: RIMC, amb: AMBC, t: nowMs() / 1000 % 1000, outline: lowFx() ? 0 : Math.max(0.5, 0.6 * (W / bw)), outlineCol: OUTC, outlineBias: 0.002, keep: 2 };
      const cvs = GLM.render(W, H, Sv, ITEMS); if (!cvs) return false; c.save(); c.globalAlpha = o.alpha == null ? 1 : o.alpha; c.drawImage(cvs, 0, 0, W, H, x0, y0, bw, bh); c.restore(); return true;
    } catch (e) { fail(e); return false; }
  }
  if (typeof window !== 'undefined') setTimeout(() => { try { warm(); } catch (e) {} }, 2100);   // (prepared at load, in idle time)
  return { ok: usable, usable, warm, ensure, step, ready: () => !!(D && D.ready) || !!(DL && DL.ready), LODPX, draw, solve, anchors, drawSpectral, drawParts, drawAnima, lights, free: release, release, gpuCount, idle, idlePose: idle,
    HEIGHT, FACE0, YAWLIM, STRIDE, LEGS, CORE, CRAD, NROOT, HREST, WROOT, MT, WS, STATS, RES, get up() { return !!(D && D.up); }, get nv() { return D ? D.nv : 0; }, get nt() { return D ? D.nt : 0; }, get off() { return NOGL; }, meshes: lo => { const d = lo ? DL : D; return (d && d.M) || null; } };
})();
if (typeof self !== 'undefined') self.RAZIEL_GL = RAZIEL_GL;
