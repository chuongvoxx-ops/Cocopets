/* ---------- (v436 AS) Asmodeus, The Fester: the Scorpio Anima (Zodiac Anima No. 08) as a real 3D model on GLM ----------
   A tall ceremonial biomechanical god on six arachnid blade legs, modelled after the user's concept sheet (kept out of the repo):
   - the body: a slender humanoid upper body of obsidian armour engraved in antique gold (a narrow waist, a gold-ribbed chest, layered
     pauldrons, a high collar) rising from an armoured hub; a long scarlet robe hangs from the waist to the floor in separate drapes (each
     swings on its own hinge with the body's inertia and the walk), a front tabard with a gold border and the Scorpio sign.
   - the six legs: from the hub, each a gold ball joint, an armoured femur (gold bands, a dorsal plate with spurs, an exposed actuator, a
     ruby conduit) up to a high gold disc knee, then a long curved blade tibia (gold-rimmed obsidian, a ruby conduit groove) down to a
     narrow gold point. Planted feet (motion()), a tripod gait with per-leg phase offsets (never all six together), two-bone IK with the
     knees high, the body low when it accelerates, tall at rest.
   - the arms: slender, gold-banded, ruby on the bracers, long gold claws.
   - the head: an elongated ivory porcelain mask (no mouth; four narrow crimson eyes, faint crimson channels under the glaze) in a black
     and gold hood; two lower plates (the jaw) that part to bare a crystalline emitter; a tall black-and-gold crown of spires; ruby drops
     on gold chains swinging from it; a broken gold halo behind (L4: rune rings; L7: rotating halos).
   - the Venom Crucible on the chest: a mechanical heart of ruby crystal, swirling venom round it, a faceted ruby shell over both (layered,
     see-through), a gold cage, seven runed rings turning round it (one for each stinger, its channel running up over the shoulder to that
     tail's root), motes. It opens for The Seventh Sin: the cage parts, the heart rises and blooms into a flower of seven petals.
   - the Sevenfold Crown: seven segmented stingers from a dorsal mount, one central and three a side in a fan. Each tail is a chain of
     13 / 15 / 17 segments (by form: longer at L4 and L7) built as one shared vertebra mesh posed per segment (obsidian drum, gold joint
     ring, a dorsal plate with a spur, side cavities lit from inside, a venom channel along its inner side; L4 adds side flanges), ending in
     a gold collar and a long curved ruby crystal blade. Each tail is solved every frame (tailChain): its rest curve (rising, fanning out,
     curling forward and drooping at the end) with a travelling serpentine sway, blended toward any of its targets (a strike's arc to a
     point, the defensive cage round the torso, the converged ring over the head, the cathedral arch, the entrance's coil), its segments
     telescoping and parting (P.sep), then filtered per segment in world space on the instance (the tip lags most: inertia on turns and
     lunges). Venom runs along each channel toward the blade (the front in item.wear).
   Forms (k 1 base, 2 level 4, 3 level 7): The Veiled Predator, The Crimson Sovereign (longer tails, flanged segments, ruby plates, rune
   rings behind the head), The Seventh Sin (the vast crown: 17-segment tails, floating armour shards, rotating halos, the brightest
   heart). Materials: GLM ids 440..453 (20k5uz AS-MAT); every part can be drawn as its own spectral crystal replica (o.shell: the decoys
   of Eclipse Molt) and dissolves into black-crimson crystal grains (P.dis: the legs first, the reactor last).
   Everything is procedural geometry built once in idle-time slices into GLM meshes, posed every frame from a pose P (idlePose; the
   moves module 20g5 drives it). draw(c, o) renders it at its screen size and lays the image on the canvas, returning the screen points
   the effects need; drawParts(c, list) draws effect meshes (ruby spikes, shards, wires, runed rings, the great crystal) in screen space.
   Pure: no game state is read or written. release() frees the GPU buffers; gpuCount() counts them.
   Real-GPU WebGL only (window.__AS_GL = 1 / __NG_GL = 1 force it on a software rasteriser for the tests; __AS_GL = 0 turns it off):
   without it AnimaArt draws the existing art of the Scorpio Anima (no new 2D fallback). */
const ASMODEUS_GL = (() => {
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
  function frameZ(d, xh) { const z = norm(d); let x = sub(xh || [1, 0, 0], mul(z, dot(z, xh || [1, 0, 0]))); if (len(x) < 1e-4) x = sub([0, 1, 0], mul(z, z[1])); x = norm(x); const y = cross(z, x); return [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]; }
  const colsR = (x, y, z) => [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const WS = 0.1;
  /* the materials (20k5uz AS-MAT, ids 440..453; a fraction picks a variant) */
  const MT = { OB: 440, TI: 441, GD: 442, CH: 443, IV: 444, EYE: 445, RB: 446, FL: 447, RING: 448, CL: 449, LT: 450, SH: 451, EMB: 453 };
  const bz = (P, u) => { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };
  const bzd = (P, u) => { const v = 1 - u, a = -3 * v * v, b = 3 * v * v - 6 * u * v, c = 6 * u * v - 3 * u * u, d = 3 * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };
  const qb = (A, C, B, u) => { const v = 1 - u; return [v * v * A[0] + 2 * v * u * C[0] + u * u * B[0], v * v * A[1] + 2 * v * u * C[1] + u * u * B[1], v * v * A[2] + 2 * v * u * C[2] + u * u * B[2]]; };

  /* ================= the mesh helpers (as Samael's and Belial's) ================= */
  /* an armour plate: a thick curved shell along a centreline (4 cubic points o.c), half width o.w(u), cupped by o.cup, thickness o.th;
     edge 1 on its rims (the material's gold trim) */
  function plate(B, o) {
    const P = o.c, nu = o.nu || 12, nv = o.nv || 4, cup = o.cup || 0, N0 = norm(o.nrm || [0, 0, 1]), lft = o.lift || 0, m = o.mat == null ? MT.OB : o.mat;
    const FR = []; for (let i = 0; i <= nu; i++) { const u = i / nu, C = bz(P, u), T = norm(bzd(P, Math.min(0.995, Math.max(0.005, u)))); let S = cross(T, N0); if (len(S) < 1e-4) S = cross(T, [0, 0, 1]); S = norm(S); FR.push({ C, T, S, N: cross(S, T) }); }
    const F = u => FR[Math.max(0, Math.min(nu, Math.round(u * nu)))];
    const wid = u => Math.max(0.004, o.w(u)), thk = () => o.th || 0.12;
    const mid = (u, v) => { const f = F(u), w = wid(u); return add(add(f.C, mul(f.S, w * v)), mul(f.N, cup * w * (v * v - 0.35) + lft)); };
    const t0 = o.trim0 == null ? 0.8 : o.trim0, trim = v => sstep(t0, 0.985, Math.abs(v));
    const face = (sg, mt) => B.surf((u, s) => { const v = s * 2 - 1, f = F(u); return add(mid(u, v), mul(f.N, sg * thk(u) * 0.5)); }, nu, nv, () => mt, { flip: sg > 0, e: (u, s) => Math.max(trim(s * 2 - 1), o.endTrim ? sstep(0.9, 1, Math.abs(u * 2 - 1)) : 0) });
    face(1, m); face(-1, o.under == null ? MT.OB + 0.2 : o.under);
    const rim = (vs, flip) => B.surf((u, s) => { const f = F(u), th = thk(u), a = Math.PI * s; return add(add(mid(u, vs), mul(f.N, Math.cos(a) * th * 0.5)), mul(f.S, vs * Math.sin(a) * th * 0.42)); }, nu, 3, () => o.rimMat == null ? m : o.rimMat, { flip, e: () => 1 });
    rim(-1, false); rim(1, true);
    for (const ue of [0, 1]) if (wid(ue) > 0.03) B.surf((v01, s2) => { const v = v01 * 2 - 1, f = F(ue); return add(mid(ue, v), mul(f.N, (s2 - 0.5) * thk(ue))); }, 5, 1, () => o.rimMat == null ? m : o.rimMat, { flip: ue === 1, e: () => 1 });
  }
  /* a strip on a surface along a polyline (normals nrm(i)), w wide; aux 0..1 along it, edge 0..1 across */
  function strip(B, pts, nrm, w, mat, lift) {
    const n = pts.length, lf = lift == null ? 0.02 : lift;
    B.surf((u, v) => { const i = Math.round(u * (n - 1)), p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], T = norm(sub(b, a)), N = nrm(i), S = norm(cross(T, N)), tp = Math.min(1, Math.min(i, n - 1 - i) * 0.6 + 0.4);
      return add(add(p, mul(N, lf)), mul(S, (v - 0.5) * w * tp)); }, n - 1, 1, () => mat, { flip: true, e: (u, v) => v, a: u => u });
  }
  /* a tube swept along a polyline (radius r(u)), aux along it */
  function sweep(B, pts, r, mat, seg, edge) {
    const n = pts.length; B.surf((u, v) => { const i = Math.round(u * (n - 1)), p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], T = norm(sub(b, a)); let X = cross(T, [0, 0, 1]); if (len(X) < 1e-3) X = cross(T, [1, 0, 0]); X = norm(X); const Y = cross(T, X), ph = v * TAU, rr = r(u);
      return add(p, add(mul(X, Math.cos(ph) * rr), mul(Y, Math.sin(ph) * rr))); }, n - 1, seg || 8, () => mat, { flip: true, e: () => edge || 0.2, a: u => u });
  }
  const latheZ = (B, prof, m, seg, c) => { B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], c || [0, 0, 0]); B.lathe(prof, m, { seg: seg || 18, edge: j => (prof[j][3] || 0) }); B.pop(); };
  const latheX = (B, prof, m, seg, c) => { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], c || [0, 0, 0]); B.lathe(prof, m, { seg: seg || 18, edge: j => (prof[j][3] || 0) }); B.pop(); };
  // the Scorpio sign (three stems joined by arches, the last one curving off into an arrow) in a frame at o: up its up, nrm out of it; s its size
  function glyph(B, o, up, nrm, s, mat) { const x = norm(cross(up, nrm)); B.push(x, norm(up), norm(nrm), o); const r = 0.05 * s;
    for (const xx of [-0.5, 0, 0.5]) B.tube([xx * s, 0.32 * s, 0], [xx * s, -0.42 * s, 0], r, r, mat, { seg: 5 });
    B.tor([-0.25 * s, 0.32 * s, 0], 0.25 * s, r, mat, { seg: 10, rseg: 4, ph0: 0, ph1: Math.PI }); B.tor([0.25 * s, 0.32 * s, 0], 0.25 * s, r, mat, { seg: 10, rseg: 4, ph0: 0, ph1: Math.PI });
    B.tor([0.78 * s, -0.42 * s, 0], 0.28 * s, r, mat, { seg: 8, rseg: 4, ph0: Math.PI, ph1: Math.PI * 1.5 }); B.crystal([0.72 * s, -0.7 * s, 0], [1.02 * s, -0.62 * s, 0], 0.11 * s, mat, { n: 4, thin: 0.4, up: [0, 0, 1] }); B.pop(); }
  // a faceted gem: an icosahedron split once (80 flat facets), each vertex a little off the sphere (facet edges carry edge 1)
  function gem(B, r, mat, sub2, jit) {
    const t = (1 + Math.sqrt(5)) / 2; let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < (sub2 || 0); s++) { const cache = {}, midp = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] == null) { cache[k] = V.length; V.push(norm(mul(add(V[a], V[b]), 0.5))); } return cache[k]; }, F2 = [];
      for (const [a, b, c] of F) { const ab = midp(a, b), bc = midp(b, c), ca = midp(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = F2; }
    const P = V.map((v, i) => mul(v, r * (1 + (jit || 0) * (hash(i * 3.7 + 1.3) - 0.5))));
    for (const f of F) B.facet(f.map(i => P[i]), mat);
  }

  /* ================= the anatomy (model units; x forward, y its left, z up; the floor at z 0) ================= */
  const HUB = [0, 0, 8.25], HUBR = 1.0;
  /* the legs: hip angle round the hub (+y side; mirrored by s), the foot's angle and its distance from the middle, the walk's phase offset
     (two tripods, each leg a little late on the one before: never all together), the run's, the front-ness (f), the femur and tibia */
  const LEGS = [
    { a: 0.55, fa: 0.6, R: 9.4, off: 0.0, roff: 0.0, s: 1, f: 1, L1: 7.2, L2: 13.4 },
    { a: 0.55, fa: 0.6, R: 9.4, off: 0.5, roff: 0.5, s: -1, f: 1, L1: 7.2, L2: 13.4 },
    { a: 1.6, fa: 1.62, R: 10.0, off: 0.56, roff: 0.53, s: 1, f: 0.5, L1: 7.2, L2: 13.2 },
    { a: 1.6, fa: 1.62, R: 10.0, off: 0.06, roff: 0.03, s: -1, f: 0.5, L1: 7.2, L2: 13.2 },
    { a: 2.6, fa: 2.5, R: 9.5, off: 0.11, roff: 0.06, s: 1, f: 0, L1: 7.2, L2: 13.2 },
    { a: 2.6, fa: 2.5, R: 9.5, off: 0.61, roff: 0.56, s: -1, f: 0, L1: 7.2, L2: 13.2 }];
  const TRIPOD = [0, 1, 1, 0, 0, 1];
  const HIPR = 1.28, STRIDE = 4.4, SW0 = 0.36, SW1 = 0.46, FOOTH = 0.0, LIFTH = 1.15;
  const SHOULDER = [-0.05, 1.32, 13.0], LA1 = 2.55, LA2 = 2.45;
  const NECK0 = [-0.02, 0, 14.0], HEADP = [0.12, 0, 15.05], HS = 1.42, US = 1.24;
  const CORE = [1.12, 0, 12.15], CR = 0.92;
  const ROOT = [-0.82, 0, 13.0];
  const WAIST = 10.05;
  /* the torso's sections: z, centre x, half depth, half width */
  const TT = [[9.6, 0.0, 0.5, 0.62], [10.25, 0.02, 0.46, 0.54], [10.95, 0.08, 0.56, 0.76], [11.75, 0.12, 0.68, 1.0], [12.55, 0.08, 0.7, 1.14], [13.15, 0.0, 0.62, 1.18], [13.65, -0.05, 0.48, 0.86], [14.05, -0.05, 0.3, 0.38]];
  function tt(z) { if (z <= TT[0][0]) return TT[0].slice(1); for (let i = 1; i < TT.length; i++) if (z <= TT[i][0]) { const a = TT[i - 1], b = TT[i], u = sstep(a[0], b[0], z); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } return TT[TT.length - 1].slice(1); }
  const se = (c, p) => Math.sign(c) * Math.pow(Math.abs(c), 2 / p);
  const torsoPt = (z, ph, o) => { const [cx, hx, hy] = tt(z), k = o || 0; return [cx + (hx + k) * se(Math.cos(ph), 2.4), (hy + k) * se(Math.sin(ph), 2.4), z]; };
  const torsoN = (z, ph) => { const a = torsoPt(z, ph), b = torsoPt(z, ph + 0.02), c = torsoPt(z + 0.02, ph); return norm(cross(sub(b, a), sub(c, a))); };
  /* the robe's drapes: angle round the waist, hinge radius, width, length, flare, fold seed */
  const DRAPES = [{ a: 0.82, r: 0.66, w: 1.25, L: 9.45, fl: 0.17, sd: 1 }, { a: -0.82, r: 0.66, w: 1.25, L: 9.45, fl: 0.17, sd: 2 }, { a: 1.62, r: 0.72, w: 1.35, L: 9.5, fl: 0.2, sd: 3 }, { a: -1.62, r: 0.72, w: 1.35, L: 9.5, fl: 0.2, sd: 4 },
    { a: 2.42, r: 0.7, w: 1.35, L: 9.55, fl: 0.22, sd: 5 }, { a: -2.42, r: 0.7, w: 1.35, L: 9.55, fl: 0.22, sd: 6 }, { a: Math.PI, r: 0.62, w: 1.25, L: 9.9, fl: 0.27, sd: 7 }];
  /* the Sevenfold Crown: each tail's fan angle (from upright, + toward +y), its segments, lengths and radii by form */
  const FAN = [-1.08, -0.72, -0.36, 0, 0.36, 0.72, 1.08];
  const NSEG = [0, 10, 11, 12], SL0 = [0, 1.12, 1.16, 1.2], SR0 = [0, 0.56, 0.58, 0.6], BLL = [0, 4.3, 4.9, 5.5];
  const UNF_ORDER = [6, 4, 2, 0, 1, 3, 5];   // (the entrance: the central tail first, then the pairs outward)
  /* each form's height (model units, the crown's top) for its size */
  const HEIGHT = [0, 22.0, 22.6, 23.2];

  let D = null;
  function* gen() {
    const q = lowFx() ? 0.7 : 1, M = {}, Q = n => Math.max(3, Math.round(n * q));
    const mk = f => { const B = GLM.builder(q); f(B); return B.done(); };
    /* ---- the hub: the arachnid body under the robe (an armoured ring, its hip sockets) ---- */
    M.hub = mk(B => {
      latheZ(B, [[-1.2, 0.0, MT.OB], [-1.1, 0.42, MT.OB], [-0.7, 0.86, MT.OB + 0.3], [-0.35, 1.02, MT.OB + 0.3], [-0.3, 1.08, MT.GD, 1], [-0.12, 1.1, MT.GD, 1], [-0.08, 1.0, MT.OB], [0.45, 0.82, MT.OB + 0.3], [0.9, 0.62, MT.OB]], MT.OB, Q(22));
      B.crystal([0, 0, -1.1], [0, 0, -2.0], 0.22, MT.GD, { n: 5 });
    }); yield;
    /* ---- a leg: the coxa (gold ball and collar, along +z), the femur (true length along +z), the knee disc (its axle along y), the tibia
       blade (true length along +z, bowing toward +x, its point at the far end) ---- */
    M.coxa = mk(B => { B.sph([0, 0, 0], 0.42, MT.GD, 16); latheZ(B, [[0.2, 0.36, MT.OB], [0.35, 0.44, MT.OB, 0.6], [0.5, 0.42, MT.GD, 1], [0.62, 0.34, MT.OB]], MT.OB, Q(14)); });
    M.femur = LEGS.slice(0, 1).map(L => mk(B => {
      const L1 = L.L1; B.push([1.3, 0, 0], [0, 1.3, 0], [0, 0, 1], [0, 0, 0]);
      latheZ(B, [[0.2, 0.34, MT.OB], [0.5, 0.4, MT.OB, 0.4], [0.62, 0.42, MT.GD, 1], [0.78, 0.42, MT.GD, 1], [0.86, 0.36, MT.OB + 0.3], [L1 * 0.48, 0.33, MT.OB + 0.3], [L1 * 0.5, 0.36, MT.GD, 1], [L1 * 0.53, 0.36, MT.GD, 1], [L1 * 0.55, 0.31, MT.OB + 0.3], [L1 * 0.92, 0.28, MT.OB + 0.3], [L1 * 0.95, 0.31, MT.GD, 1], [L1, 0.24, MT.OB]], MT.OB, Q(16));
      plate(B, { c: [[0.36, 0, 0.5], [0.62, 0, L1 * 0.32], [0.55, 0, L1 * 0.66], [0.38, 0, L1 * 0.95]], nrm: [1, 0, 0], w: u => 0.4 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.2), cup: -0.55, th: 0.12, nu: Q(12), nv: 4, mat: MT.OB + 0.3, trim0: 0.72, endTrim: true });
      for (let j = 0; j < 3; j++) B.crystal([0.62, 0, L1 * (0.28 + j * 0.24)], [1.15 - j * 0.1, 0, L1 * (0.2 + j * 0.24)], 0.08, MT.GD, { n: 4, thin: 0.4, up: [0, 1, 0] });
      B.tube([-0.3, 0, 0.9], [-0.27, 0, L1 * 0.85], 0.1, 0.09, MT.TI, { seg: 8, cap0: 'flat', cap1: 'flat' }); B.tube([-0.33, 0, L1 * 0.3], [-0.31, 0, L1 * 0.62], 0.13, 0.13, MT.TI + 0.3, { seg: 8, cap0: 'flat', cap1: 'flat' });
      for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 8; i++) { const z = lerp(0.9, L1 * 0.9, i / 8); pts.push([0.04, s * 0.335 * (1 - 0.15 * i / 8), z]); } strip(B, pts, () => [0, s, 0], 0.09, MT.CH, 0.01); }
      B.pop(); }))[0]; yield;
    M.knee = mk(B => { B.torY([0, 0, 0], 0.5, 0.13, MT.GD, { seg: Q(28), rseg: 6, teeth: 14, tooth: 0.03 });
      for (const s of [1, -1]) { B.push([0, 0, 1], [1, 0, 0], [0, s, 0], [0, 0, 0]); B.lathe([[0.0, 0.48, MT.GD], [0.12, 0.42, MT.GD], [0.2, 0.26, MT.OB], [0.24, 0.1, MT.RB], [0.25, 0.0, MT.RB]], MT.GD, { seg: Q(20), edge: j => (j < 2 ? 1 : 0) }); B.pop(); }
      B.sph([0, 0, 0], 0.42, MT.OB, 14); }); yield;
    M.tibia = mk(B => {   // a curved blade: lens section (width along x, thickness along y), a sharp gold-rimmed edge, a ruby conduit in a groove
      const L2 = 1, c = u => [0.085 * Math.sin(Math.PI * u) - 0.02 * u, 0, u * L2], wd = u => (0.07 * Math.pow(1 - u, 0.7) + 0.012) * (1 + 0.5 * sstep(0, 0.1, u) * (1 - sstep(0.1, 0.3, u))), th = u => 0.032 * Math.pow(1 - u, 0.6) + 0.004;
      for (const sg of [1, -1]) B.surf((u, v) => { const s = v * 2 - 1, C = c(u); return [C[0] + s * wd(u), sg * th(u) * (1 - s * s * 0.85), C[2]]; }, Q(22), Q(6), (u, v) => (Math.abs(v * 2 - 1) > 0.86 ? MT.GD : MT.OB + 0.3), { flip: sg < 0, e: (u, v) => sstep(0.72, 0.98, Math.abs(v * 2 - 1)), a: u => u });
      { const pts = []; for (let i = 0; i <= 14; i++) { const u = 0.08 + i / 14 * 0.72, C = c(u); pts.push([C[0] + wd(u) * 0.25, th(u) * 0.9, C[2]]); } strip(B, pts, () => [0, 1, 0], 0.016, MT.CH, 0.004); }
      { const pts = []; for (let i = 0; i <= 14; i++) { const u = 0.08 + i / 14 * 0.72, C = c(u); pts.push([C[0] + wd(u) * 0.25, -th(u) * 0.9, C[2]]); } strip(B, pts, () => [0, -1, 0], 0.016, MT.CH, 0.004); }
      B.crystal([0.04, 0, 0.12], [0.14, 0, 0.02], 0.02, MT.GD, { n: 4, thin: 0.4, up: [0, 1, 0] });
      B.crystal([-0.015, 0, 0.93], [-0.02, 0, 1.0], 0.012, MT.GD, { n: 4, thin: 0.6 });
    }); yield;
    /* ---- the robe: the inner skirt (folds round), a drape (hinge along y at the top, hanging down -z, flaring out +x), the tabard ---- */
    M.skirt = mk(B => B.surf((u, v) => { const z = lerp(WAIST - 0.15, 0.35, u), ph = v * TAU, r = (0.62 + 0.18 * u + 1.0 * Math.pow(u, 1.6)) * (1 + 0.07 * Math.sin(ph * 11 + u * 2) * u), fwd = 1 - 0.25 * Math.max(0, Math.cos(ph)) * u; return [Math.cos(ph) * r * fwd, Math.sin(ph) * r, z]; }, Q(18), Q(44), () => MT.CL + 0.3, { flip: true, e: u => sstep(0.94, 1, u) * 0.7 }));
    M.drape = [0, 1].map(vi => mk(B => {
      const fold = (u, v) => 0.06 * Math.sin(v * Math.PI * (3 + vi) + u * 1.5 + vi) * (0.3 + u) + 0.03 * Math.sin(v * 17 + vi * 2) * u;
      for (const sg of [1, -1]) B.surf((u, v) => { const y = (v - 0.5) * (1 + 0.25 * u), z = -u, x = fold(u, v) + 0.012 * sg; return [x, y, z]; }, Q(18), Q(12), () => (sg > 0 ? MT.CL : MT.CL + 0.3), { flip: sg < 0, e: (u, v) => Math.max(sstep(0.86, 0.97, Math.abs(v * 2 - 1)), sstep(0.955, 0.99, u)), a: u => u });
    }));
    M.tabard = mk(B => {
      for (const sg of [1, -1]) B.surf((u, v) => { const y = (v - 0.5) * (0.82 + 0.12 * u), z = -u * 9.3, x = 0.04 * Math.sin(v * Math.PI * 2 + u * 2) * u + 0.015 * sg; return [x, y, z]; }, Q(20), Q(8), () => (sg > 0 ? MT.CL : MT.CL + 0.3), { flip: sg < 0, e: (u, v) => Math.max(sstep(0.8, 0.94, Math.abs(v * 2 - 1)), sstep(0.97, 0.995, u)), a: u => u });
      glyph(B, [0.06, 0, -4.2], [0, 0, 1], [1, 0, 0], 0.55, MT.GD);
      B.crystal([0.06, 0, -8.9], [0.08, 0, -9.7], 0.2, MT.GD, { n: 4, thin: 0.35, up: [1, 0, 0] });
      B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0.04, 0, -1.2]); B.tor([0, 0, 0], 0.26, 0.05, MT.GD, { seg: 18, rseg: 4 }); B.pop(); B.crystal([0.03, 0, -1.2], [0.2, 0, -1.2], 0.16, MT.RB, { n: 6, belly: 0.45, base: 1 });
    }); yield;
    /* ---- the torso: obsidian engraved in gold, a gold belt, ribbed gold framing round the Crucible, the Crucible's socket, the collar ---- */
    M.torso = mk(B => {
      B.surf((u, v) => torsoPt(lerp(TT[0][0], TT[TT.length - 1][0], u), v * TAU), Q(18), Q(36), (u, v) => MT.OB + 0.3, { flip: true, e: () => 0 });
      // the belt (gold, a band with a lower lip), the collar's base
      for (const [z0, z1, k, m] of [[10.05, 10.4, 0.05, MT.GD], [10.45, 10.55, 0.04, MT.OB], [13.85, 14.05, 0.05, MT.GD]]) B.surf((u, v) => { const z = lerp(z0, z1, u); return torsoPt(z, v * TAU, k * (1 + 0.6 * Math.sin(Math.PI * u))); }, 3, Q(36), () => m, { flip: true, e: u => (u < 0.2 || u > 0.8 ? 1 : 0.3) });
      // gold ribs sweeping from the shoulders down round the Crucible (the concept's gilded heart cage)
      for (const s of [1, -1]) for (let j = 0; j < 3; j++) { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, z = lerp(13.4 - j * 0.25, 10.8 + j * 0.35, u), ph = s * lerp(0.95 - j * 0.12, 0.28 + j * 0.12, Math.sin(Math.PI / 2 * u)); pts.push(torsoPt(z, ph, 0.02)); } sweep(B, pts, u => 0.05 * (1 - 0.4 * u) + 0.012, MT.GD, Q(6), 0.6); }
      // the venom channels: seven runs from the Crucible over the chest and shoulders toward the back (to the tails' mount)
      for (let j = 0; j < 7; j++) { const i = j - 3, pts = []; for (let n = 0; n <= 14; n++) { const u = n / 14, ph = lerp(i * 0.12, Math.sign(i || 1) * (Math.PI / 2 + 0.8 + 0.12 * Math.abs(i)) * (i ? 1 : 0) + (i ? 0 : Math.PI), u * u), z = lerp(12.9, 13.6 - Math.abs(i) * 0.08, Math.sin(Math.PI / 2 * u)); if (!i && u > 0.4) continue; pts.push(torsoPt(z, ph, 0.01)); }
        if (pts.length > 3) strip(B, pts, n2 => norm(sub(pts[n2], [0, 0, pts[n2][2]])), 0.06, MT.CH, 0.012); }
      // the Crucible's socket: a dark recess, a toothed gold ring
      { const cx = CORE[0] - 0.22; B.ell([cx, 0, CORE[2]], [0.3, CR * 1.18, CR * 1.18], MT.OB + 0.2, { seg: Q(24), rings: 8 }); B.torX([cx + 0.12, 0, CORE[2]], CR * 1.22, 0.07, MT.GD, { seg: 44, rseg: 5, teeth: 22, tooth: 0.04 }); B.torX([cx + 0.04, 0, CORE[2]], CR * 1.36, 0.035, MT.OB, { seg: 40, rseg: 4 }); }
      // the abdomen's scales (layered plates down the front of the waist), gold filigree studs
      for (let j = 0; j < 4; j++) { const z = 11.05 - j * 0.3, p = torsoPt(z, 0, 0.03); plate(B, { c: [add(p, [0, -0.42 + j * 0.04, 0.12]), add(p, [0.06, -0.15, 0.02]), add(p, [0.06, 0.15, 0.02]), add(p, [0, 0.42 - j * 0.04, 0.12])], nrm: [1, 0, 0.2], w: () => 0.1, cup: 0, th: 0.05, nu: Q(8), nv: 2, mat: MT.OB, trim0: 0.6 }); }
      // the collar: a high black collar, gold-rimmed, its points rising behind the head
      latheZ(B, [[13.9, 0.46, MT.OB], [14.2, 0.52, MT.OB, 0.3], [14.55, 0.6, MT.OB], [14.62, 0.64, MT.GD, 1], [14.68, 0.56, MT.GD, 1]], MT.OB, Q(22), [-0.05, 0, 0]);
      for (let j = -2; j <= 2; j++) { const a = Math.PI + j * 0.42; B.crystal([Math.cos(a) * 0.55 - 0.05, Math.sin(a) * 0.55, 14.5], [Math.cos(a) * 0.95 - 0.05, Math.sin(a) * 0.95, 15.6 - Math.abs(j) * 0.22], 0.1, MT.GD, { n: 4, thin: 0.4, up: [0, 0, 1] }); }
    }); yield;
    /* ---- the pauldrons (+y side; mirrored): three layered curved plates, gold rims, spurs; the dorsal mount of the tails ---- */
    const pauld = (B, n) => { for (let i = n - 1; i >= 0; i--) { const dz = -i * 0.3, dy = i * 0.16, k = 1 + i * 0.12;
        plate(B, { c: [[-0.85 * k, dy - 0.15, dz + 0.0], [-0.35 * k, dy + 0.12, dz + 0.42], [0.42 * k, dy + 0.12, dz + 0.42], [0.92 * k, dy - 0.1, dz - 0.02]], nrm: [0, 0.75, 1], w: u => 0.42 * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * u)), 0.15) * (1 + 0.2 * u), cup: -0.3, th: 0.1, nu: Q(12), nv: 3, mat: MT.OB + (i % 2 ? 0.0 : 0.3), trim0: 0.74, endTrim: true });
        B.crystal([0.0, dy + 0.12, dz + 0.45], [-0.25, dy + 0.45, dz + 1.15 - i * 0.15], 0.09, MT.GD, { n: 4, thin: 0.35, up: [0, 1, 0] }); }
      glyph(B, [0.05, 0.3, 0.42], [1, 0, 0.1], [0, 0.6, 0.8], 0.26, MT.GD); };
    M.pauld = [null, mk(B => pauld(B, 2)), mk(B => pauld(B, 3)), mk(B => pauld(B, 3))];
    M.mount = mk(B => {   // the dorsal mount: a radial obsidian plate, gold-rimmed, seven gold sockets in a fan
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]); B.ell([0, 0, 0], [0.42, 1.2, 0.95], MT.OB + 0.3, { seg: Q(24), rings: 10, th0: 0, th1: Math.PI }); B.pop();
      for (let j = 0; j < 7; j++) { const i = j - 3, p = [-0.32 - 0.06 * Math.abs(i), i * 0.26, -0.12 * Math.abs(i) + 0.15]; B.sph(p, 0.24, MT.GD, 12); B.push([-1, 0, 0], [0, 1, 0], [0, 0, -1], p); B.tor([0, 0, 0], 0.28, 0.05, MT.GD, { seg: 14, rseg: 4 }); B.pop(); }
      B.torX([-0.1, 0, 0.1], 1.05, 0.06, MT.GD, { seg: 36, rseg: 4, ph0: -0.4, ph1: Math.PI + 0.4 });
    }); yield;
    /* ---- the arms (+y; along +z, true lengths): the upper arm, the forearm with its bracer and ruby, the hand and its long gold claws ---- */
    M.uarm = mk(B => { B.sph([0, 0, 0], 0.32, MT.GD, 12); latheZ(B, [[0.15, 0.24, MT.OB], [0.4, 0.27, MT.OB + 0.3, 0.3], [LA1 * 0.55, 0.22, MT.OB + 0.3], [LA1 * 0.58, 0.25, MT.GD, 1], [LA1 * 0.62, 0.24, MT.GD, 1], [LA1 * 0.66, 0.21, MT.OB], [LA1, 0.19, MT.OB]], MT.OB, Q(14));
      plate(B, { c: [[0.25, 0, 0.3], [0.38, 0, LA1 * 0.35], [0.33, 0, LA1 * 0.6], [0.22, 0, LA1 * 0.8]], nrm: [1, 0, 0], w: () => 0.2, cup: -0.5, th: 0.07, nu: Q(8), nv: 2, mat: MT.OB + 0.3, trim0: 0.7, endTrim: true }); });
    M.farm = mk(B => { B.sph([0, 0, 0], 0.22, MT.GD, 10); latheZ(B, [[0.1, 0.19, MT.OB], [LA2 * 0.25, 0.2, MT.OB], [LA2 * 0.3, 0.25, MT.GD, 1], [LA2 * 0.75, 0.22, MT.GD + 0.2], [LA2 * 0.8, 0.24, MT.GD, 1], [LA2 * 0.86, 0.17, MT.OB], [LA2, 0.15, MT.OB]], MT.OB, Q(14));
      B.crystal([0.2, 0, LA2 * 0.52], [0.36, 0, LA2 * 0.52], 0.1, MT.RB, { n: 6, belly: 0.45, base: 1 }); B.crystal([-0.18, 0, LA2 * 0.4], [-0.62, 0, LA2 * 0.12], 0.07, MT.GD, { n: 4, thin: 0.4, up: [0, 1, 0] }); });
    M.hand = mk(B => {   // the palm along +z from the wrist, its back toward +x; four claws and a thumb, long and curved
      B.box([0, 0, 0.28], [0.1, 0.18, 0.26], 0.06, MT.OB); B.box([0.07, 0, 0.3], [0.04, 0.16, 0.2], 0.03, MT.GD);
      for (let j = 0; j < 4; j++) { const y = (j - 1.5) * 0.11, b0 = [0, y, 0.52], b1 = [-0.12, y * 2.2, 1.0 - Math.abs(j - 1.5) * 0.05], b2 = [-0.55, y * 3.6, 1.85 - Math.abs(j - 1.5) * 0.12];
        B.tube(b0, b1, 0.045, 0.04, MT.OB, { seg: 6 }); B.sph(b1, 0.05, MT.GD, 6); B.crystal(b1, b2, 0.05, MT.GD, { n: 4, thin: 0.6, bend: 0.12, up: [0, 1, 0] }); }
      B.tube([0, 0.16, 0.2], [-0.15, 0.3, 0.45], 0.045, 0.04, MT.OB, { seg: 6 }); B.crystal([-0.15, 0.3, 0.45], [-0.42, 0.38, 0.7], 0.04, MT.GD, { n: 4, thin: 0.6 }); });
    yield;
    /* ---- the neck (along +z, unit length), the head: the ivory mask (upper), the jaw plates (+y half), the hood, the crown, the emitter ---- */
    M.neck = mk(B => { latheZ(B, [[0, 0.3, MT.OB], [0.2, 0.32, MT.GD, 1], [0.28, 0.28, MT.OB], [0.5, 0.26, MT.TI + 0.3], [0.62, 0.28, MT.GD, 1], [0.7, 0.25, MT.OB], [1.0, 0.24, MT.OB]], MT.OB, Q(14)); for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 8; i++) pts.push([0.24, s * 0.12, i / 8]); strip(B, pts, () => [1, 0, 0], 0.05, MT.CH, 0.01); } });
    // the face: an elongated narrow oval, convex, a fine ridge down its middle, no mouth (the lower plates are the jaw)
    const FW = z => 0.4 * Math.pow(cl(1 - Math.pow((z - 0.62) / 0.98, 2)), 0.55) + 0.001 * (0.78 + 0.22 * sstep(0.0, 0.9, z)), FX0 = z => 0.36 + 0.06 * Math.sin(Math.PI * cl((z + 0.2) / 1.6)) - 0.1 * sstep(1.25, 1.6, z);
    const face = (z, v, o) => { const w = FW(z), y = v * w; return [FX0(z) - 0.2 * v * v * (0.6 + 0.4 * w / 0.4) + 0.025 * Math.max(0, 1 - Math.abs(v) * 7) * sstep(0.35, 0.9, z) * (1 - sstep(1.1, 1.3, z)) + (o || 0), y, z]; };
    M.mask = mk(B => {
      B.surf((u, s) => face(lerp(0.32, 1.6, u), s * 2 - 1), Q(20), Q(14), () => MT.IV + 0.1, { e: (u, s) => sstep(0.86, 1, Math.abs(s * 2 - 1)) * 0.7, flip: true });
      for (const sv of [1, -1]) B.surf((u, s) => add(face(lerp(0.32, 1.6, u), sv), [-0.22 * s, 0, 0]), Q(20), 2, () => MT.GD, { e: () => 1, flip: sv > 0 });
      for (const s of [1, -1]) for (let j = 0; j < 2; j++) { const z0 = 0.88 + j * 0.17, pts = []; for (let i = 0; i <= 6; i++) { const v = s * lerp(0.2, 0.74, i / 6), z = z0 + 0.1 * (i / 6) - 0.02 * j; pts.push(face(z, v, 0.006)); } strip(B, pts, i => norm([1, -s * 0.5 * i / 6, 0.1]), 0.045 - j * 0.008, MT.EYE, 0.004); }
      for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 8; i++) { const v = s * lerp(0.3, 0.86, i / 8), z = 0.68 - 0.18 * i / 8; pts.push(face(z, v, 0.008)); } strip(B, pts, () => [1, 0, 0], 0.03, MT.GD, 0.004); }   // (the cheekbones' gold lines)
    });
    M.jaw = mk(B => {   // the lower plate (+y half): from the chin up under the cheek; hinged at its back (it swings down and out)
      B.surf((u, s) => face(lerp(-0.3, 0.42, u), lerp(0.02, 1.0, s)), Q(10), Q(8), () => MT.IV + 0.1, { flip: true, e: (u, s) => Math.max(sstep(0.88, 1, s), sstep(0.9, 1, u) * 0.6) });
      B.surf((u, s) => add(face(lerp(-0.3, 0.42, u), 1.0), [-0.24 * s, 0.0, 0]), Q(10), 2, () => MT.OB, { flip: true, e: () => 0.6 });
      for (let j = 0; j < 3; j++) B.crystal(add(face(0.05 + j * 0.1, 0.9), [-0.05, 0.02, -0.25]), add(face(0.05 + j * 0.1, 0.9), [-0.1, 0.25, -0.6 - j * 0.08]), 0.04, MT.GD, { n: 4, thin: 0.5 });   // (the jaw's dangling gold spurs)
    });
    M.hood = mk(B => {   // the head behind the mask: a black elongated helm, gold edges, angular cheek structures
      B.ell([-0.32, 0, 0.95], [0.5, 0.42, 0.9], MT.OB + 0.3, { seg: Q(22), rings: Q(12) }); B.ell([0.0, 0, 1.4], [0.36, 0.36, 0.4], MT.OB, { seg: Q(18), rings: Q(8) });
      for (const s of [1, -1]) { plate(B, { c: [[0.36, s * 0.42, 0.3], [0.18, s * 0.56, 0.75], [-0.1, s * 0.6, 1.2], [-0.35, s * 0.5, 1.6]], nrm: [0.3, s, 0.1], w: u => 0.12 + 0.06 * Math.sin(Math.PI * u), cup: 0.1, th: 0.07, nu: Q(10), nv: 2, mat: MT.OB, trim0: 0.6, endTrim: true });
        B.crystal([0.3, s * 0.48, 0.55], [-0.45, s * 0.8, 0.25], 0.07, MT.OB + 0.3, { n: 4, thin: 0.35, up: [0, 0, 1] }); }
    });
    M.emit = mk(B => { for (let j = 0; j < 5; j++) { const a = j / 5 * TAU; B.crystal([0, 0, 0], [0.32, Math.cos(a) * 0.18, Math.sin(a) * 0.18], 0.08, MT.RB + 0.6, { n: 5 }); } B.crystal([0, 0, 0], [0.42, 0, 0], 0.12, MT.RB + 0.6, { n: 6 }); B.torX([0.02, 0, 0], 0.2, 0.03, MT.GD, { seg: 16, rseg: 4 }); });
    // the crown (in head space): a gold circlet round the brow, tall black-and-gold spires in a fan (the central tallest), swept wings, rubies; more by form
    const crown = (B, k) => {
      B.push([0, 0, 1], [0, 1, 0], [-1, 0, 0], [-0.08, 0, 1.45]); B.tor([0, 0, 0], 0.52, 0.06, MT.GD, { seg: Q(26), rseg: 4 }); B.pop();
      const n = [0, 5, 5, 7][k];
      for (let j = 0; j < n; j++) { const f = (j - (n - 1) / 2) / ((n - 1) / 2), ang = f * 1.05, ht = (2.9 - 1.3 * f * f) * (0.92 + 0.06 * k), base = [-0.1 + Math.cos(ang) * 0.3 * 0.6, Math.sin(ang) * 0.42, 1.5], tip = add(base, [-0.55 - 0.3 * f * f, Math.sin(ang) * 1.1, ht]);
        B.crystal(base, tip, 0.12 + 0.04 * (1 - Math.abs(f)), MT.GD, { n: 4, thin: 0.4, bend: -0.08, up: [Math.cos(ang), Math.sin(ang), 0] }); B.crystal(add(base, [-0.06, 0, 0]), lerp3(base, tip, 0.7), 0.07, MT.OB + 0.3, { n: 4, thin: 0.5, up: [Math.cos(ang), Math.sin(ang), 0] });
        if (j % 2 === 0) B.crystal(lerp3(base, tip, 0.55), add(lerp3(base, tip, 0.55), [0.05, Math.sin(ang) * 0.06, 0.06]), 0.07, MT.RB, { n: 6, belly: 0.5, base: 1 }); }
      for (const s of [1, -1]) { B.crystal([-0.1, s * 0.5, 1.35], [-1.2, s * 1.05, 2.15], 0.13, MT.GD, { n: 4, thin: 0.3, belly: 0.25, up: [0, s, 0.3] }); B.crystal([-0.2, s * 0.5, 1.2], [-1.0, s * 0.95, 1.5], 0.09, MT.OB + 0.3, { n: 4, thin: 0.3, up: [0, s, 0.3] });
        if (k >= 2) B.crystal([-0.3, s * 0.45, 1.65], [-1.25, s * 0.7, 2.75], 0.1, MT.GD, { n: 4, thin: 0.3, up: [0, s, 0.2] }); }
      B.crystal([0.22, 0, 1.4], [0.42, 0, 1.75], 0.11, MT.RB, { n: 6, belly: 0.5, base: 1 });   // (the brow's ruby)
    };
    M.crown = [null, mk(B => crown(B, 1)), mk(B => crown(B, 2)), mk(B => crown(B, 3))];
    M.orn = mk(B => { for (let i = 0; i < 6; i++) { B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, -i * 0.12 - 0.06]); B.tor([0, 0, 0], 0.045, 0.014, MT.GD, { seg: 8, rseg: 3 }); B.pop(); }
      B.crystal([0, 0, -0.72], [0, 0, -1.05], 0.075, MT.RB, { n: 6, belly: 0.4, base: 0.5 }); B.crystal([0, 0, -0.72], [0, 0, -0.66], 0.06, MT.GD, { n: 6 }); });
    // the broken halo (in the y-z plane, facing +x): a gold ring with a gap at its foot, spurs outward, a fine inner line
    M.halo = mk(B => { B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]); B.tor([0, 0, 0], 1, 0.035, MT.GD, { seg: 72, rseg: 4, ph0: -Math.PI / 2 + 0.42, ph1: Math.PI * 1.5 - 0.42 }); B.tor([0, 0, 0], 0.9, 0.012, MT.GD + 0.2, { seg: 64, rseg: 3, ph0: -Math.PI / 2 + 0.6, ph1: Math.PI * 1.5 - 0.6 });
      for (let j = 0; j < 15; j++) { const a = -Math.PI / 2 + 0.55 + j / 14 * (TAU - 1.1), L2 = j % 2 ? 0.14 : 0.3; B.crystal([Math.cos(a), Math.sin(a), 0], [Math.cos(a) * (1 + L2), Math.sin(a) * (1 + L2), 0], 0.035, MT.GD, { n: 4, thin: 0.5 }); }
      for (const a of [-Math.PI / 2 + 0.42, Math.PI * 1.5 - 0.42]) B.crystal([Math.cos(a), Math.sin(a), 0], [Math.cos(a - 0.2) * 1.0, Math.sin(a - 0.2) * 1.0 - 0.15, 0], 0.05, MT.RB, { n: 5 }); B.pop(); });
    M.rring = mk(B => { B.tor([0, 0, 0], 1, 0.02, MT.RING + 0.3, { seg: 72, rseg: 4 }); B.tor([0, 0, 0], 1.04, 0.01, MT.GD, { seg: 72, rseg: 3 }); });
    yield;
    /* ---- the Venom Crucible: the heart (a cluster of ruby crystal), the venom round it (see-through), the faceted shell (see-through), the
       gold cage (two halves: +y; turned for the other), a runed ring, a mote, a petal of the Forbidden Bloom ---- */
    M.heart = mk(B => { B.crystal([0, 0, -0.62], [0, 0, 0.0], 0.42, MT.RB + 0.6, { n: 7, belly: 0.75, base: 0.1, seed: 2 }); B.crystal([0, 0, 0.7], [0, 0, 0.0], 0.42, MT.RB + 0.6, { n: 7, belly: 0.72, base: 0.1, seed: 2, rot: 0.45 });
      for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + 0.3, d = [Math.cos(a), Math.sin(a), 0.35 * Math.sin(a * 2)]; B.crystal(mul(d, 0.12), mul(d, 0.62), 0.11, MT.RB + 0.6, { n: 5, seed: j }); }
      for (const s of [1, -1]) { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, s * 0.16]); B.tor([0, 0, 0], 0.4, 0.025, MT.GD, { seg: 24, rseg: 4 }); B.pop(); } });
    M.fluid = mk(B => B.ell([0, 0, 0], [1, 1, 1], MT.FL, { seg: Q(28), rings: Q(16) }));
    M.shell = mk(B => gem(B, 1, MT.RB + 0.3, 1, 0.08));
    M.cage = mk(B => {   // the +y half: meridian bands and a spine, finials, claw clasps
      for (let j = 0; j < 3; j++) { const a = (j + 1) / 4 * Math.PI; B.push([Math.cos(a), Math.sin(a), 0], [0, 0, 1], [Math.sin(a), -Math.cos(a), 0], [0, 0, 0]); B.tor([0, 0, 0], 1.04, 0.035, MT.GD, { seg: Q(24), rseg: 4, ph0: -Math.PI / 2 + 0.12, ph1: Math.PI / 2 - 0.12 }); B.pop(); }
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]); B.tor([0, 0, 0], 1.05, 0.045, MT.GD, { seg: Q(28), rseg: 4, ph0: 0.05, ph1: Math.PI - 0.05 }); B.pop();
      for (const s of [1, -1]) { B.crystal([0, 0.2, s * 1.0], [0, 0.25, s * 1.42], 0.1, MT.GD, { n: 4 }); B.sph([0, 0.12, s * 1.02], 0.09, MT.GD, 8); }
      for (const z of [0.55, -0.55]) B.crystal([0.2, 0.85, z], [0.55, 1.1, z * 1.15], 0.07, MT.GD, { n: 4, thin: 0.5 }); });
    M.cring = mk(B => { B.tor([0, 0, 0], 1, 0.026, MT.RING + 0.3, { seg: 56, rseg: 4 }); B.tor([0, 0, 0], 1.03, 0.009, MT.GD, { seg: 56, rseg: 3 }); });
    M.mote = mk(B => B.crystal([0, 0, -1], [0, 0, 1], 0.45, MT.RB + 0.6, { n: 5, belly: 0.5, base: 0.2 }));
    M.petal = mk(B => {   // a petal (along +z, its face toward +x): ruby crystal in a black-metal frame, gold-rimmed
      const w = u => 0.42 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.7) + 0.02, c = u => [0.35 * u * u, 0, u * 2.2], th = u => 0.06 * (1 - u) + 0.01;
      for (const sg of [1, -1]) B.surf((u, v) => { const s = v * 2 - 1, C = c(u); return [C[0] + sg * th(u) * (1 - s * s), s * w(u), C[2]]; }, Q(16), Q(8), () => MT.RB, { flip: sg < 0, e: (u, v) => sstep(0.7, 1, Math.abs(v * 2 - 1)), a: u => 1 - u });
      for (const sg of [1, -1]) { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, C = c(u); pts.push([C[0] - 0.02, sg * w(u) * 1.02, C[2]]); } sweep(B, pts, u => 0.05 * (1 - 0.7 * u) + 0.01, MT.OB + 0.3, Q(6), 0.5); }
      { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(add(c(u), [-0.05, 0, 0])); } sweep(B, pts, u => 0.04 * (1 - 0.6 * u) + 0.01, MT.GD, Q(6), 0.8); }
    });
    M.rcrys = mk(B => { B.crystal([0, 0, -1.3], [0, 0, 0.0], 1.0, MT.RB + 0.6, { n: 8, belly: 0.8, base: 0.1 }); B.crystal([0, 0, 1.5], [0, 0, 0.0], 1.0, MT.RB + 0.6, { n: 8, belly: 0.78, base: 0.1, rot: 0.4 });
      for (let j = 0; j < 7; j++) { const a = j / 7 * TAU, d = [Math.cos(a), Math.sin(a), 0.2 * Math.sin(a * 3)]; B.crystal(mul(d, 0.4), mul(d, 1.35), 0.24, MT.RB, { n: 5, seed: j }); } });
    yield;
    /* ---- a tail vertebra (unit radius, unit length along +z; its convex back toward -x): an obsidian drum, a gold joint ring, a dorsal plate
       with a spur, side cavities lit from within, the venom channel along its inner side (+x); L4: side flanges ---- */
    const vert = (B, k) => {
      latheZ(B, [[-0.12, 0.9, MT.OB], [-0.02, 0.98, MT.OB + 0.3, 0.4], [0.5, 1.0, MT.OB + 0.3], [0.8, 0.96, MT.OB + 0.3], [0.84, 1.06, MT.GD, 1], [0.95, 1.08, MT.GD, 1], [1.0, 0.98, MT.OB], [1.12, 0.92, MT.OB]], MT.OB, Q(20));
      plate(B, { c: [[-0.98, 0, 0.02], [-1.16, 0, 0.32], [-1.14, 0, 0.66], [-0.98, 0, 0.92]], nrm: [-1, 0, 0], w: u => 0.72 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.25), cup: -0.6, th: 0.12, nu: Q(8), nv: 3, mat: MT.OB + 0.3, trim0: 0.74, endTrim: true });
      if (k >= 2) B.crystal([-1.12, 0, 0.5], [-1.5, 0, 0.82], 0.13, k >= 3 ? MT.RB : MT.GD, { n: 4, thin: 0.45, up: [0, 1, 0] });
      for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 6; i++) { const z = 0.05 + i / 6 * 0.74; pts.push([0.0, s * 1.005, z]); } strip(B, pts, () => [0, s, 0], 0.12, MT.CH, 0.01); }   // (the crimson seams down its flanks)
      { const pts = []; for (let i = 0; i <= 6; i++) pts.push([0.99, 0, 0.05 + i / 6 * 0.74]); strip(B, pts, () => [1, 0, 0], 0.3, MT.CH, 0.015); }
      if (k >= 2) for (const s of [1, -1]) plate(B, { c: [[-0.5, s * 0.86, 0.12], [-0.42, s * 1.1, 0.4], [-0.46, s * 1.08, 0.66], [-0.6, s * 0.86, 0.86]], nrm: [-0.4, s, 0], w: () => 0.22, cup: 0.2, th: 0.07, nu: Q(6), nv: 2, mat: MT.OB, trim0: 0.65, endTrim: true });
    };
    M.tseg = [null, mk(B => vert(B, 1)), mk(B => vert(B, 2)), mk(B => vert(B, 3))];
    // the blade: a long curved ruby crystal talon (unit length along +z, curving toward +x), lens-sectioned, sharp-edged; its gold collar
    M.blade = mk(B => {
      const A1 = 1.55, Rb = 1 / A1, c = u => [Rb * (1 - Math.cos(A1 * u)), 0, Rb * Math.sin(A1 * u)], tn = u => norm([Math.sin(A1 * u), 0, Math.cos(A1 * u)]), nr = u => { const t = tn(u); return [t[2], 0, -t[0]]; };
      const w = u => (0.19 * Math.pow(1 - u, 0.8) + 0.004) * (0.6 + 0.4 * sstep(0, 0.22, u)) * (1 + 0.25 * Math.sin(Math.PI * u)), th = u => 0.11 * Math.pow(1 - u, 0.65) + 0.004, off = u => 0.07 * (1 - u);
      for (const sg of [1, -1]) B.surf((u, v) => { const s = v * 2 - 1, C = c(u), Nn = nr(u), ww = w(u); return add(add(C, mul(Nn, s * ww - off(u))), [0, sg * th(u) * (1 - Math.abs(s) * 0.94), 0]); }, Q(24), 4, () => MT.RB + 0.1, { flip: sg < 0, e: (u, v) => sstep(0.55, 1, Math.abs(v * 2 - 1)), a: u => 1 - u });
      { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10 * 0.25; pts.push(add(c(u), mul(nr(u), w(u) * 0.95 - off(u)))); } sweep(B, pts, u => 0.025 * (1 - u) + 0.006, MT.GD, Q(5), 0.8); }
    });
    M.bcol = mk(B => { latheZ(B, [[-0.12, 0.62, MT.OB], [-0.04, 0.82, MT.GD, 1], [0.05, 0.86, MT.GD, 1], [0.12, 0.6, MT.GD + 0.2], [0.2, 0.42, MT.GD]], MT.GD, Q(16));
      for (const s of [1, -1]) B.crystal([0, s * 0.7, 0.05], [-0.25, s * 1.35, 0.6], 0.14, MT.GD, { n: 4, thin: 0.4, up: [1, 0, 0] }); });
    yield;
    /* ---- effect and form meshes: the cocoon, a floating armour shard (L7), a crystal spike, a shard, a wire, a great runed ring ---- */
    M.cocoon = mk(B => { B.surf((u, v) => { const th = u * Math.PI, ph = v * TAU, r = 1 + 0.06 * Math.sin(ph * 7 + u * 9) + 0.05 * Math.sin(u * 23 + ph * 3); return [Math.sin(th) * Math.cos(ph) * r, Math.sin(th) * Math.sin(ph) * r, -Math.cos(th) * r * 1.0]; }, Q(16), Q(28), () => MT.SH, { flip: true, e: (u, v) => 0.5 + 0.5 * Math.sin(v * 70 + u * 30) });
      for (let j = 0; j < 9; j++) { const a = j / 9 * TAU, z = -0.3 + 0.5 * hash(j); B.crystal([Math.cos(a) * 0.85, Math.sin(a) * 0.85, z], [Math.cos(a) * 1.25, Math.sin(a) * 1.25, z + 0.5], 0.16, MT.SH, { n: 4, seed: j }); } });
    M.shard = mk(B => { B.prism([[-0.5, -0.2], [0.55, -0.3], [0.7, 0.15], [0.1, 0.4], [-0.6, 0.18]], -0.1, 0.1, MT.OB + 0.3, { b: 0.04, sideM: MT.GD }); B.crystal([0.6, 0.0, 0], [1.1, 0.25, 0], 0.09, MT.RB, { n: 4, thin: 0.4 }); });
    M.spike = mk(B => { B.crystal([0, 0, -0.3], [0.05, 0, 2.3], 0.42, MT.RB, { n: 5, belly: 0.25, base: 0.9, seed: 2 }); B.crystal([0.3, 0.18, -0.3], [0.7, 0.4, 1.3], 0.26, MT.RB, { n: 5, belly: 0.3, seed: 5 }); B.crystal([-0.28, -0.22, -0.3], [-0.65, -0.35, 1.05], 0.22, MT.RB, { n: 4, belly: 0.3, seed: 9 }); });
    M.frag = mk(B => { B.crystal([0, 0, -0.45], [0, 0, 0.6], 0.32, MT.RB, { n: 4, belly: 0.4, base: 0.6, seed: 3 }); });
    M.wire = mk(B => { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]); B.lathe([[0, 0.0, MT.RB], [0.02, 1, MT.RB], [0.98, 1, MT.RB], [1, 0.0, MT.RB]], MT.RB, { seg: 4, edge: () => 1 }); B.pop(); });
    M.bring = mk(B => { B.tor([0, 0, 0], 1, 0.022, MT.RING + 0.3, { seg: 96, rseg: 4 }); B.tor([0, 0, 0], 1.05, 0.012, MT.GD, { seg: 96, rseg: 3 }); B.tor([0, 0, 0], 0.93, 0.008, MT.GD, { seg: 96, rseg: 3 });
      for (let j = 0; j < 14; j++) { const a = j / 14 * TAU, L2 = j % 2 ? 0.08 : 0.17; B.crystal([Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0], [Math.cos(a) * (1.05 + L2), Math.sin(a) * (1.05 + L2), 0], 0.022, j % 2 ? MT.GD : MT.RB, { n: 4, thin: 0.5 }); } });
    const bsph = m => { let cx = 0, cy = 0, cz = 0; const n = m.nv; for (let i = 0; i < n; i++) { cx += m.pos[i * 3]; cy += m.pos[i * 3 + 1]; cz += m.pos[i * 3 + 2]; } cx /= n; cy /= n; cz /= n; let r = 0; for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(m.pos[i * 3] - cx, m.pos[i * 3 + 1] - cy, m.pos[i * 3 + 2] - cz)); m.bs = [cx, cy, cz, r]; };
    eachOf(M, bsph);
    D.M = M; let nv = 0; eachOf(M, m => { nv += m.nv; }); D.nv = nv; D.ready = true; D.msBuilt = nowMs();
  }
  function eachOf(M, f) { for (const k in M) { const v = M[k]; if (Array.isArray(v)) v.forEach(m => { if (m) f(m); }); else if (v) f(v); } }
  function data() { return D || (D = { ready: false, up: false, it: null, ms: 0 }); }
  function step(ms) { const d = data(); if (d.ready) return true; if (typeof GLM === 'undefined') return false; d.it = d.it || gen(); const t0 = nowMs(), until = t0 + ms; while (!d.ready && nowMs() < until) d.it.next(); d.ms += nowMs() - t0; return d.ready; }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Asmodeus GL: ' + String(e && e.message || e)); } catch (e2) {} };
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__AS_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__AS_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  let IDLE = 0;
  function warm() {
    if (!usable()) return false; const d = data(); if (d.up || IDLE) return true; IDLE = 1;
    const go = () => { const run = ms => { try { if (!step(ms)) return go(); if (!d.up) upload(); } catch (e) { fail(e); } IDLE = 0; };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => run(dl.didTimeout ? 3 : Math.max(1, Math.min(8, dl.timeRemaining() - 1))), { timeout: 200 }); else setTimeout(() => run(3), 30); };
    go(); return true;
  }
  /* (shader prewarming: one tiny pass with every mesh uploads the buffers and compiles the program's branches before the summon) */
  function upload() { const d = data(); if (d.up || !d.ready || !GLM.ok()) return; const items = [];
    eachOf(D.M, mesh => items.push({ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 99 }));
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); d.up = true; }
  function ensure() { if (!usable()) return false; const d = data(); if (!d.ready) { try { step(1e9); } catch (e) { fail(e); return false; } } return d.ready; }
  function release() { if (!D || !D.M) return 0; let n = 0; eachOf(D.M, m => { if (m.gl) { n++; if (typeof GLM !== 'undefined' && GLM.free) GLM.free(m); else m.gl = null; } }); D.up = false; return n; }
  const gpuCount = () => { let n = 0; if (D && D.M) eachOf(D.M, m => { if (m.gl) n++; }); return n; };

  /* ================= the pose ================= */
  /* the resting pose of a form at time t (o: overrides). Keys: the body (yaw, bank, pitch, lift, dx, crouch: low and predatory, rear: tall
     and ritual, lean, twist, spread, stagger), the gait (ph, mv, run 0..1, gaitK, feet: per-leg [dx, dy, dz] overrides), the head (head +
     lowers it, look, tilt, jaw: the lower plates parting, eye), the arms (arm: raised, reach: forward, claw), the tails (crown: spread into
     the ritual crown, cage: folded round the torso, raise: lifted, conv: converged over the head, cath: the cathedral, sep: segments
     parting, seq: lit one by one 0..7, threat: turned toward aimYaw, tele: telescoping, lash: the sway, unf: unfolding 0..7, flow: venom
     running, strikes: [{ i 0..6, A [x, y, z] model space, e 0..1 }]), the Crucible (core: its light, spin, open: the cage parting,
     heartUp: the heart rising, bloom: the flower, rupt: the great crystal over the head 0..1.3), crack (the armour's crimson cracks), glow,
     live (life's amount), dis (dissolve), asm (assembly), coc (the cocoon 0..2), shell (drawn as a crystal replica) */
  function idlePose(k, t, o) {
    return Object.assign({ k: k || 3, t: t || 0, yaw: 0, bank: 0, pitch: 0, lift: 0, dx: 0, crouch: 0, rear: 0, lean: 0, twist: 0, spread: 0, stagger: 0, ph: 0, mv: 0, run: 0, gaitK: 1, feet: null,
      head: 0, look: 0, tilt: 0, jaw: 0, eye: 1, arm: 0, reach: 0, claw: 0, crown: 0, cage: 0, raise: 0, conv: 0, cath: 0, sep: 0, seq: 0, threat: 0, aimYaw: 0, tele: 0, lash: 1, unf: 7, flow: 0.5, strikes: null,
      core: 0.9, spin: 1, open: 0, heartUp: 0, bloom: 0, rupt: 0, crack: 0, glow: 0, live: 1, dis: 0, asm: 1, coc: 0, shell: 0 }, o || {});
  }
  const hold = (t, per, sd, ease) => { const u = t / per + sd, n = Math.floor(u), f = u - n, a = hash(n * 1.37 + sd * 7.1) * 2 - 1, b = hash((n + 1) * 1.37 + sd * 7.1) * 2 - 1; return lerp(a, b, sstep(0, ease || 0.4, f)); };
  /* its life over any pose: the torso's slow rise and fall, the head's small precise turns (held, then a quick re-aim: a predator's), the
     tails' independent targeting (each holds its own aim a while), the Crucible's turning and pulse, the ornaments, the arms' slow shift */
  function life(P) {
    const t = (P && P.t) || 0, lv = P && P.live != null ? cl(P.live) : 1, s1 = Math.sin;
    const tails = []; for (let j = 0; j < 7; j++) tails.push({ yaw: 0.22 * hold(t, 2.6 + j * 0.37, j * 0.71, 0.3) * lv, pitch: 0.12 * hold(t, 3.1 + j * 0.29, j * 1.37 + 3, 0.35) * lv, curl: 0.06 * s1(t * (0.5 + j * 0.07) + j * 2.1) * lv });
    return { breath: s1(t * 0.9) * lv, bob: (0.07 * s1(t * 0.9) + 0.02 * s1(t * 2.3)) * lv, head: (0.04 * s1(t * 0.37) + 0.08 * hold(t, 2.9, 0.4, 0.18)) * lv, look: (0.2 * hold(t, 2.3, 1.7, 0.16) + 0.04 * s1(t * 0.6)) * lv,
      tilt: 0.06 * hold(t, 3.7, 2.9, 0.3) * lv, arm: 0.06 * s1(t * 0.55) * lv, core: (0.12 * s1(t * 2.1) + 0.06 * s1(t * 4.9)) * lv, tails, sway: lv, shift: 0.35 * hold(t, 5.3, 0.31, 0.45) * lv };
  }
  /* ---- the gait: two tripods, each leg a little late on the one before; the run tightens the swing ---- */
  const legOff = (L, run) => lerp(L.off, L.roff, cl(run || 0)), swingOf = run => lerp(SW0, SW1, cl(run || 0));
  const swF = w => sstep(0.04, 0.86, w);
  const swL = w => (w < 0.4 ? Math.sin(Math.PI / 2 * w / 0.4) : Math.pow(Math.cos(Math.PI / 2 * (w - 0.4) / 0.6), 1.4));
  function footfalls(ph0, ph1, run) { const out = []; if (!(ph1 > ph0)) return out; for (let i = 0; i < 6; i++) { const o = legOff(LEGS[i], run), a = ph0 / TAU + o, b = ph1 / TAU + o; if (Math.floor(b) > Math.floor(a)) out.push({ i, f: LEGS[i].f }); } return out; }
  const homeOf = (i, P) => { const L = LEGS[i], k = 1 + (P.spread || 0) * 0.14 - (P.crouch || 0) * 0.05, a = L.s * L.fa; return [Math.cos(a) * L.R * k, Math.sin(a) * L.R * k]; };
  const angDf = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  /* ---- the motion an instance keeps (inst.asM): planted feet that hold their place on the floor while the body travels and turns over
     them, swings to a landing half a stance ahead (each leg on its tripod's beat), settle steps at a standstill (one at a time, or a
     tripod's two together); the body's inertia (a vertical spring kicked by each landing, a fore-aft one from the walk's acceleration, a
     lateral one from the turn), the turn's rate, the tails' filtered directions. M.steps: the feet landed this frame { i, f, idle } ---- */
  const ISD = 0.3;
  function newM(P) { const yaw = P.yaw || 0, c = Math.cos(yaw), s = Math.sin(yaw), F = [];
    for (let i = 0; i < 6; i++) { const h = homeOf(i, P); F.push({ gx: c * h[0] - s * h[1], gy: s * h[0] + c * h[1], sw: 0, w0: 0, p: 0, dir: 1, s0x: h[0], s0y: h[1], tx: h[0], ty: h[1], bx: h[0], by: h[1], lift: 0, l0: 0, ld: 0, cyc: Math.floor((P.ph || 0) / TAU + legOff(LEGS[i], P.run)) }); }
    return { t: P.t || 0, yaw, ph: P.ph || 0, mv: cl(P.mv || 0), h: 0, yr: 0, acc: 0, sx: 0, vx: 0, sy: 0, vy: 0, sz: 0, vz: 0, F, tl: null, steps: [], n: 0, cA: 0, hA: 0, dr: new Float32Array(16) }; }
  function motion(inst, P) {
    if (!inst || !P) return null; const t = P.t || 0; let M = inst.asM; const dt = M ? t - M.t : 0;
    if (!M || dt < -1e-3 || dt > 0.6) { M = inst.asM = newM(P); return M; }
    M.h = 0; if (dt < 1e-5) return M;
    M.steps.length = 0; const h = Math.min(dt, 0.05); M.h = h; M.t = t;
    const yaw = P.yaw || 0, ph = P.ph || 0, mv = cl(P.mv || 0), gk = P.gaitK || 1, run = cl(P.run || 0), SW = swingOf(run), c = Math.cos(yaw), s = Math.sin(yaw), dph = ph - M.ph, walking = Math.abs(dph) / TAU / dt > 0.25, dir = dph >= 0 ? 1 : -1;
    M.yr += (angDf(yaw, M.yaw) / dt - M.yr) * Math.min(1, h * 7); M.acc += ((mv - M.mv) / dt - M.acc) * Math.min(1, h * 9); M.yaw = yaw; M.ph = ph; M.mv = mv;
    const mA = P.mvA == null ? yaw : P.mvA, mvp = Math.max(0.3, mv), tr = dph / TAU * STRIDE * gk * mvp, mx = Math.cos(mA) * tr, my = Math.sin(mA) * tr, Dd = STRIDE * gk * mvp * (1 - SW), toB = (x, y) => [c * x + s * y, -s * x + c * y], fe = P.feet, dbx = Math.cos(mA - yaw), dby = Math.sin(mA - yaw);
    let nIdle = 0, idleP = 1, idleT = -1; for (let i = 0; i < 6; i++) if (M.F[i].sw === 2) { nIdle++; idleP = Math.min(idleP, M.F[i].p); idleT = TRIPOD[i]; }
    for (let i = 0; i < 6; i++) {
      const L = LEGS[i], f = M.F[i], hm = homeOf(i, P); let q = ph / TAU + legOff(L, run); const cyc = Math.floor(q); q -= cyc; const inW = q >= 1 - SW, w = inW ? (q - (1 - SW)) / SW : 0, Hs = LIFTH * (0.75 + 0.3 * L.f) * Math.min(1, mv * 1.6 + 0.3) * (1 + 0.3 * (gk - 1));
      f.ld = Math.max(0, f.ld - h / 0.25);
      const land = (x, y, idle) => { f.gx = c * x - s * y; f.gy = s * x + c * y; f.sw = 0; f.lift = 0; f.ld = 1; f.cyc = cyc; f.bx = x; f.by = y; M.vz -= (0.22 + 0.1 * L.f) * (idle ? 0.4 : 0.5 + 0.5 * mv); M.steps.push({ i, f: L.f, idle: !!idle }); M.n++; };
      if (f.sw === 0) { f.gx -= mx; f.gy -= my; const b = toB(f.gx, f.gy); f.bx = b[0]; f.by = b[1];
        if (walking && inW) { f.sw = 1; f.dir = dir; f.w0 = dir > 0 ? w : 1 - w; f.s0x = f.bx; f.s0y = f.by; }
        else if (walking && dir > 0 && cyc !== f.cyc && !inW) land(hm[0] + dbx * Dd / 2, hm[1] + dby * Dd / 2, false);
        else if (!walking) f.cyc = cyc; }
      if (f.sw === 1) {
        if (!walking) { f.sw = 2; f.p = 0; f.dur = 0.26; f.l0 = f.lift; f.s0x = f.bx; f.s0y = f.by; nIdle++; idleP = 0; idleT = TRIPOD[i]; }
        else if (!inW) land(hm[0] + f.dir * dbx * Dd / 2, hm[1] + f.dir * dby * Dd / 2, false);
        else { const pr = cl(((f.dir > 0 ? w : 1 - w) - f.w0) / Math.max(0.05, 1 - f.w0)); f.tx = hm[0] + f.dir * dbx * Dd / 2; f.ty = hm[1] + f.dir * dby * Dd / 2; f.bx = lerp(f.s0x, f.tx, swF(pr)); f.by = lerp(f.s0y, f.ty, swF(pr)); f.lift = swL(pr) * Hs; }
      }
      if (f.sw === 2) { f.p = Math.min(1, f.p + h / (f.dur || ISD)); const pr = f.p, Hi = 0.55 + 0.2 * L.f; f.bx = lerp(f.s0x, hm[0], swF(pr)); f.by = lerp(f.s0y, hm[1], swF(pr)); f.lift = Math.max(swL(pr) * Hi, f.l0 * (1 - sstep(0, 0.6, pr)));
        if (pr >= 1) land(hm[0], hm[1], true); }
    }
    if (!walking) {   // settle steps: the foot farthest from home, one at a time (or two of one tripod together)
      let best = -1, be = 0; for (let i = 0; i < 6; i++) { const f = M.F[i]; if (f.sw !== 0) continue; const hm = homeOf(i, P), e = Math.hypot(f.bx - hm[0], f.by - hm[1]);
        if (e > 5) { f.gx = c * hm[0] - s * hm[1]; f.gy = s * hm[0] + c * hm[1]; f.bx = hm[0]; f.by = hm[1]; continue; }
        if (fe && fe[i]) continue; if (nIdle >= 2 || (nIdle === 1 && !(idleT === TRIPOD[i] && idleP > 0.3))) continue;
        if (e > 0.3 + (nIdle ? 0.15 : 0) && e > be) { be = e; best = i; } }
      if (best >= 0) { const f = M.F[best]; f.sw = 2; f.p = 0; f.dur = ISD * (be > 1.2 ? 1.1 : 0.9); f.l0 = 0; f.s0x = f.bx; f.s0y = f.by; }
    }
    const spr = (x, v, k, z, F) => v + (-k * x - 2 * z * Math.sqrt(k) * v + F) * h;
    M.vz = spr(M.sz, M.vz, 90, 0.5, 0); M.sz += M.vz * h;
    M.vx = spr(M.sx, M.vx, 22, 0.32, -M.acc * 1.4); M.sx += M.vx * h;
    M.vy = spr(M.sy, M.vy, 18, 0.38, mv * M.yr * 0.9); M.sy += M.vy * h;
    M.sz = Math.max(-0.4, Math.min(0.25, M.sz)); M.sx = Math.max(-0.8, Math.min(0.8, M.sx)); M.sy = Math.max(-0.7, Math.min(0.7, M.sy));
    // the drapes' and ornaments' own swing (damped pendulums driven by the body's sway)
    for (let j = 0; j < 8; j++) { const k2 = 10 + j * 1.3; M.dr[j * 2 + 1] = spr(M.dr[j * 2], M.dr[j * 2 + 1], k2, 0.22, M.acc * 0.8 * (j % 2 ? 1 : -0.6) + M.yr * mv * 0.6 * (j % 3 - 1)); M.dr[j * 2] += M.dr[j * 2 + 1] * h; M.dr[j * 2] = Math.max(-0.6, Math.min(0.6, M.dr[j * 2])); }
    return M;
  }
  /* two-bone IK with a pole: hip H, target A, lengths; the joint bends toward the pole */
  function ik(H, A, L1, L2, pole) { let d = sub(A, H); const dl = Math.min(L1 + L2 - 0.002, Math.max(Math.abs(L1 - L2) + 0.05, len(d))); d = mul(norm(d), dl); const dn = norm(d), a = Math.acos(cl((L1 * L1 + dl * dl - L2 * L2) / (2 * L1 * dl)));
    let pp = sub(pole, mul(dn, dot(pole, dn))); if (len(pp) < 1e-4) pp = cross(dn, [0, 1, 0]); pp = norm(pp); const K = add(H, add(mul(dn, Math.cos(a) * L1), mul(pp, Math.sin(a) * L1))); return { K, A: add(H, d), pp }; }
  /* a segment's frame from `from` to `to` (its +z), x toward `xh` */
  const segF = (from, to, xh) => frameZ(sub(to, from), xh);

  /* ================= the tails: each solved as a chain (model space, the body's frame) ================= */
  const TCH = []; for (let j = 0; j < 7; j++) TCH.push({ p: [], d: [], x: [], L: [], r: [], n: 0, tip: null, tipD: null, tipX: null });
  function tailChain(j, P, k, LF, low, tilt, flowK) {
    const i = j - 3, ai = Math.abs(i), sg = Math.sign(i), C = TCH[j], n = Math.max(6, NSEG[k] - (low ? 3 : 0)), t = P.t || 0, lt = LF.tails[j];
    const big = i === 0 ? 1.12 : 1, sl = SL0[k] * (i === 0 ? 1.05 : 1) * (NSEG[k] / n), r0 = SR0[k] * big;
    const crw = cl(P.crown || 0), cage = cl(P.cage || 0), rai = cl(P.raise || 0), conv = cl(P.conv || 0), cath = cl(P.cath || 0);
    const un = cl((P.unf == null ? 7 : P.unf) - UNF_ORDER[j]);
    const root = [ROOT[0] - 0.06 * ai, i * 0.26, ROOT[2] - 0.12 * ai + 0.15];
    const fan = FAN[j] * (1 + 0.16 * crw - 0.35 * cage + 0.05 * (P.spread || 0)) * (0.35 + 0.65 * sstep(0, 0.6, un)) + (lt.yaw * 0.5 + (P.threat || 0) * 0.3 * Math.sin((P.aimYaw || 0)) * (ai < 3 ? 1 : 0.5)) * 0.4;
    const back = 0.22 - 0.2 * rai - 0.1 * crw + lt.pitch * 0.4 + 0.3 * cage, R0 = mm(rz((P.threat || 0) * (P.aimYaw || 0) * 0.35 * (1 - ai / 5)), mm(rx(-fan), ry(-back)));
    const curlE = (0.36 - 0.16 * crw - 0.15 * rai + lt.curl) * (0.75 + 0.25 * (1 - ai / 4)), droop = 0.07 * ai / 3 * (1 - 0.6 * crw), sway = 0.07 * LF.sway * (P.lash == null ? 1 : P.lash), tw = t * (0.85 + 0.06 * j);
    let R = R0; C.n = n; let p = root, tl = 0;
    const coil = 1 - un;   // (the entrance: coiled tight, unfolding)
    const cF = ai ? 0.62 : 0.95, cO = ai ? 0.7 : 0;
    for (let s = 0; s < n; s++) { const u = s / (n - 1), ce = curlE * sstep(0.4, 1, u) * 1.3, bnd = -0.03 + ce * cF + coil * 0.42, dr = -sg * (droop * sstep(0.2, 1, u) + ce * cO + 0.035 * Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - 0.6 * crw)) + sway * Math.sin(tw - s * 0.5 + j * 1.7) * (0.3 + u);
      R = mm(R, mm(ry(bnd + 0.03 * Math.sin(tw * 0.8 - s * 0.4 + j) * LF.sway), rx(dr)));
      C.d[s] = [R[2], R[5], R[8]]; C.x[s] = [R[0], R[3], R[6]]; C.L[s] = sl * (1 - 0.02 * s) * (0.5 + 0.5 * un); C.r[s] = r0 * (1 - 0.028 * s) * (0.7 + 0.3 * un); tl += C.L[s]; }
    // the targets the rest curve is blended toward, in turn (each a curve sampled at the segments' places): the cathedral arch, the converged
    // ring over the head, the cage round the torso, a strike's arc
    const out = norm([0, sg * 1, 0.15]), blendCurve = (A0, Cc, B0, wgt) => { if (wgt < 0.003) return 0; let L2 = 0, prev = A0; for (let s = 0; s < n; s++) { const u1 = (s + 1) / n, p1 = qb(A0, Cc, B0, u1), d = sub(p1, prev); L2 += len(d); const dd = norm(d); C.d[s] = norm(lerp3(C.d[s], dd, wgt)); prev = p1; } return L2; };
    let tele = 1 + 0.12 * crw + (P.tele || 0) * 0.4;
    if (cath > 0.003) { const ap = [0.6 + 1.4 * Math.cos(j / 7 * TAU + t * 0.3) * 0.5, 1.4 * Math.sin(j / 7 * TAU + t * 0.3), 27.5 + 0.6 * Math.sin(j * 1.3)], cc = add(root, add(mul(out, 7.5 * (0.4 + ai / 3)), [i === 0 ? -2.5 : -1, 0, 9.5])), L2 = blendCurve(root, cc, ap, cath); tele = lerp(tele, Math.max(1, Math.min(1.75, L2 / tl)), cath); }
    if (conv > 0.003) { const a = j / 7 * TAU + Math.PI / 2, ctr = [0.35, 0, 22.2], tp = add(ctr, [Math.cos(a) * 2.6 * 0.55, Math.sin(a) * 2.6, Math.sin(a * 2) * 0.3]), cc = add(root, add(mul(out, 3.5 * (0.3 + ai / 3)), [-1.2, 0, 6.5])), L2 = blendCurve(root, cc, tp, conv); tele = lerp(tele, Math.max(0.85, Math.min(1.4, L2 / tl)), conv); }
    if (cage > 0.003) { const ep = [2.4 + 0.25 * (3 - ai), i * 0.62, 7.6 + ai * 0.45], cc = add(root, add(mul(out, 3.8), [0.6, 0, 3.4])), L2 = blendCurve(root, cc, ep, cage); tele = lerp(tele, Math.max(0.8, Math.min(1.3, L2 / tl)), cage); }
    let se = null; if (P.strikes) for (const S of P.strikes) if (S && S.i === j && S.e > 0.003) se = S;
    if (se) { const A = se.A, d0 = len(sub(A, root)), cc = add(lerp3(root, A, 0.3), [-0.6, 0, 3 + 0.25 * d0]), L2 = blendCurve(root, cc, A, cl(se.e)); tele = lerp(tele, Math.max(0.8, Math.min(1.6, L2 / tl)), cl(se.e)); }
    // telescoping and parting, then the positions; the side vectors kept square to the run (parallel transport)
    const sep = cl(P.sep || 0); let xv = C.x[0];
    for (let s = 0; s < n; s++) { const d = C.d[s]; xv = norm(sub(xv, mul(d, dot(xv, d)))); C.x[s] = xv; C.p[s] = p; p = add(p, mul(d, C.L[s] * tele * (1 + sep * 0.55))); C.L[s] *= tele; }
    C.tip = p; C.tipD = C.d[n - 1]; C.tipX = C.x[n - 1]; C.root = root; C.tele = tele;
    return C;
  }
  /* (the chain filtered on the instance: each segment's direction chases its target in world space - turned by the yaw - the tip slower, a
     strike faster; the positions rebuilt from the filtered directions so the chain stays whole) */
  function tailFilter(MS, j, C, P, yaw) {
    if (!MS || !(MS.h > 0)) return; let T = MS.tl; if (!T) T = MS.tl = [];
    const n = C.n, c = Math.cos(yaw), s = Math.sin(yaw), fast = P.strikes && P.strikes.some(S => S && S.i === j && S.e > 0.05) ? 1 : 0;
    let A = T[j]; if (!A || A.length !== n * 3) { A = T[j] = new Float32Array(n * 3); for (let q = 0; q < n; q++) { const d = C.d[q]; A[q * 3] = c * d[0] - s * d[1]; A[q * 3 + 1] = s * d[0] + c * d[1]; A[q * 3 + 2] = d[2]; } return; }
    let p = C.root;
    for (let q = 0; q < n; q++) { const u = q / (n - 1), d = C.d[q], wx = c * d[0] - s * d[1], wy = s * d[0] + c * d[1], wz = d[2], k = 1 - Math.exp(-MS.h * (fast ? 34 - 10 * u : 15 - 8.5 * u + 6 * (P.cath || 0)));
      let ax = A[q * 3] + (wx - A[q * 3]) * k, ay = A[q * 3 + 1] + (wy - A[q * 3 + 1]) * k, az = A[q * 3 + 2] + (wz - A[q * 3 + 2]) * k; const l = Math.hypot(ax, ay, az) || 1; ax /= l; ay /= l; az /= l; A[q * 3] = ax; A[q * 3 + 1] = ay; A[q * 3 + 2] = az;
      const nd = [c * ax + s * ay, -s * ax + c * ay, az]; C.d[q] = nd; C.p[q] = p; p = add(p, mul(nd, C.L[q] * (1 + cl(P.sep || 0) * 0.55))); }
    let xv = C.x[0]; for (let q = 0; q < n; q++) { const d = C.d[q]; xv = norm(sub(xv, mul(d, dot(xv, d)))); C.x[q] = xv; }
    C.tip = p; C.tipD = C.d[n - 1]; C.tipX = C.x[n - 1];
  }

  /* ================= drawing ================= */
  const LW = norm([-0.45, 0.42, 0.8]), SBW = norm([-0.3, -0.2, 0.92]), RIMW = norm([0.65, -0.62, 0.42]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const RIMC = [1.35, 0.42, 0.62], AMBC = [1.1, 1.02, 1.08], OUTC = [0.03, 0.01, 0.02], GLCAP = 1600;   // (a crimson-violet rim light of its own)
  const POOL = [], ITEMS = [], TRANS = []; let NP = 0;
  const LGS = [{}, {}, {}, {}, {}, {}], ZM = { sx: 0, sy: 0, sz: 0, yr: 0, h: 0, F: null, steps: null, dr: new Float32Array(16) };
  const item = () => { const g = POOL[NP] || (POOL[NP] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NP++; return g; };
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0 };
  const RES = { k: 1 }; const profile = () => (lowFx() ? 'low' : RES.k < 0.95 ? 'medium' : 'high');
  /* o: X, Y (the floor point under its middle, on screen), K (px a model unit), P (a pose), k (form), alpha, inst (the motion), low, shell
     (drawn as its spectral crystal replica). Returns its screen points or null */
  function draw(c, o) {
    const d = data(); if (!d.ready || NOGL) return null;
    try {
      const P = o.P || idlePose(o.k || 3, o.t || 0), k = P.k || o.k || 3, t = P.t || 0, sw = WS * (o.scale || 1), K = o.K, kk = K / WS, X0 = o.X, Y0 = o.Y, M = D.M, low = lowFx() || o.low;
      const LF = life(P), lv = P.live == null ? 1 : cl(P.live), shellM = Math.max(cl(P.shell || 0), o.shell ? 1 : 0);
      const Rroot = mm([1, 0, 0, 0, 1, 0, 0, 0, 1.04], rz(P.yaw || 0));
      const W3 = p => { const q = mv(Rroot, p); return [q[0] * sw, q[1] * sw, q[2] * sw]; };
      const SX = w => X0 + w[0] * kk, SY = w => Y0 + (w[1] * SE - w[2] * CE) * kk, scr = p => { const w = W3(p); return [SX(w), SY(w)]; };
      ITEMS.length = 0; TRANS.length = 0; NP = 0; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      const box = (p, r) => { const w = W3(p), x = SX(w), y = SY(w), rr = r * K * (o.scale || 1); if (x - rr < bx0) bx0 = x - rr; if (x + rr > bx1) bx1 = x + rr; if (y - rr < by0) by0 = y - rr; if (y + rr > by1) by1 = y + rr; };
      const glow = (P.glow || 0) + (k === 3 ? 0.15 : k === 2 ? 0.07 : 0), dis = cl(P.dis || 0), asm = P.asm == null ? 1 : cl(P.asm), crack = cl(P.crack || 0);
      /* put a mesh: R its turn (model space, may carry a scale), T its origin, sc its scale; ord its place in the assembly (0 first .. 1 last);
         op: alpha, glow2, kind, wear (the venom front), d0 (when its dissolve starts, 0 the legs .. 0.65 the Crucible), noInk */
      const HID = o.hide ? new Set([].concat(...o.hide.map(nm => [].concat(M[nm])))) : null;   // (o.hide: mesh names left out, for close inspection)
      const put = (mesh, R, T, sc, gl, op, ord) => {
        if (!mesh || (HID && HID.has(mesh))) return null; sc = sc || 1; let ga = 0;
        if (asm < 0.999 && ord >= 0) { const a0 = (ord || 0) * 0.72, a = sstep(a0, a0 + 0.28, asm); if (a < 0.02) return null; const dir = sub(T, HUB), ax = norm([hash(T[0] * 3.1 + T[2]) - 0.5, hash(T[1] * 5.7 + 1) - 0.5, 0.7]);
          T = add(T, add(mul(dir, (1 - a) * 0.35), [0, 0, -(1 - a) * 2.2])); R = mm(axisR(ax, (1 - a) * 1.6), R); sc *= 0.55 + 0.45 * a; ga = (1 - a) * 2.2; }   // (each part rising out of the cocoon's darkness into place)
        const g = item(), Rm = mm(Rroot, R), Tw = W3(T), z = sw * sc;
        for (let i = 0; i < 3; i++) { g.R0[i] = Rm[i * 3] * z; g.R1[i] = Rm[i * 3 + 1] * z; g.R2[i] = Rm[i * 3 + 2] * z; g.T[i] = Tw[i]; }
        const d0 = op && op.d0 != null ? op.d0 : 0.3, dd = dis > 0 ? cl((dis - d0) / 0.4) : 0;
        g.mesh = mesh; g.alpha = op && op.alpha != null ? op.alpha : 1; g.glow = (gl || 0) + ga; g.glow2 = (op && op.glow2) || 0; g.spill = dd; g.kind = (op && op.kind) || 0; g.wear = op && op.wear != null ? op.wear : 99; g.fx = shellM > 0.5 ? 1 + crack : crack > 0 ? crack * 0.5 : 0; g.first = 0; g.cnt = 0;
        if (shellM > 0.5) g.alpha = Math.min(g.alpha, 0.99);
        g.outline = !(op && op.noInk) && !(g.spill > 0.001) && shellM < 0.5;
        (g.alpha < 0.995 ? TRANS : ITEMS).push(g);
        if (mesh.bs) { const bs = mesh.bs, c3 = add(T, mv(R, mul(bs, sc))), sk = Math.max(Math.hypot(R[0], R[3], R[6]), Math.hypot(R[1], R[4], R[7]), Math.hypot(R[2], R[5], R[8])); box(c3, bs[3] * sc * sk * 1.03 + 0.05); }
        return g; };
      /* the body's frame: the legs' planted feet, the body carried low (crouch) or tall (rear), its inertia */
      const run = cl(P.run || 0), MS = o.inst ? motion(o.inst, P) : null, dyn = MS || ZM, mvv = cl(P.mv || 0);
      for (let i = 0; i < 6; i++) { const q = LGS[i], hm = homeOf(i, P); if (MS) { const f = MS.F[i]; q.bx = f.bx; q.by = f.by; q.lift = f.lift; q.load = f.ld; }
        else { const L = LEGS[i], SW = swingOf(run); let qq = (P.ph || 0) / TAU + legOff(L, run); qq -= Math.floor(qq); const inW = qq >= 1 - SW, w = inW ? (qq - (1 - SW)) / SW : 0, Dd = STRIDE * Math.max(0.3, mvv) * (1 - SW) * (mvv > 0.02 ? 1 : 0);
          const sl = inW ? -Dd / 2 + Dd * swF(w) : Dd / 2 - Dd * (qq / (1 - SW)), mA = P.mvA == null ? 0 : P.mvA - (P.yaw || 0); q.bx = hm[0] + Math.cos(mA) * sl; q.by = hm[1] + Math.sin(mA) * sl; q.lift = inW ? swL(w) * LIFTH * Math.min(1, mvv * 1.6) : 0; q.load = 0; } }
      let wr = 0, wp = 0; for (let i = 0; i < 6; i++) { const L = LEGS[i], lf = cl(LGS[i].lift / 1.0); wr -= lf * L.s * 0.012; wp += lf * (L.f - 0.5) * 0.012; }
      const crouch = (P.crouch || 0), rear = cl(P.rear || 0), sh = (P.shift || 0) + LF.shift * (1 - mvv);
      const pitch = (P.pitch || 0) + crouch * 0.05 + wp + dyn.sx * 0.05 + (P.stagger || 0) * 0.06, bank = (P.bank || 0) + wr - dyn.sy * 0.05 - sh * 0.02;
      const lift = (P.lift || 0) + LF.bob + dyn.sz * 1.2 - crouch * 1.35 + rear * 0.75 - mvv * 0.35 * (1 - rear);
      const Mb = mm(rx(bank), ry(pitch)), tbo = [(P.dx || 0) + dyn.sx * 0.5, sh * 0.18 + dyn.sy * 0.4, lift];
      const BP = p => add(add(mv(Mb, sub(p, HUB)), HUB), tbo), BR = R => mm(Mb, R);
      // the upper body's own lean and twist over the hub (predatory forward lean low, upright in ritual)
      const lean = (P.lean || 0) + crouch * 0.12 + mvv * 0.08 * (1 - rear) + dyn.sx * 0.04 - rear * 0.05, twist = (P.twist || 0) + LF.breath * 0.01, Mu = mm(rz(twist), ry(lean)), UP0 = [0, 0, WAIST - 0.2];
      const MuS = mm(Mu, scl3(US)), UP = p => BP(add(mv(MuS, sub(p, UP0)), UP0)), UR = R => BR(mm(MuS, R));
      const out = { eyes: [], feet: [], hands: [], tailTips: [], tailMid: [], tailRoots: [], tailSegs: [], knees: [] };
      /* ---- the hub, the robe ---- */
      put(M.hub, BR(I3), BP(HUB), 1, glow, { d0: 0.08 }, 0.12);
      const br = LF.breath * 0.01;
      put(M.skirt, UR(I3), UP([0, 0, 0]), 1, glow, { d0: 0.2 }, 0.3);
      for (let j = 0; j < DRAPES.length; j++) { const Dp = DRAPES[j], a = Dp.a, ca = Math.cos(a), sa = Math.sin(a), swn = (MS ? MS.dr[(j % 8) * 2] : 0) + 0.04 * Math.sin(t * 1.3 + Dp.sd * 1.7) * lv + mvv * (0.1 + 0.12 * Math.max(0, -ca)) * (1 + 0.3 * Math.sin(t * 5 + j));
        const flare = Dp.fl + swn * 0.35 + crouch * 0.05 + 0.12 * cl(P.crown || 0) * 0, Rd = mm(rz(a), mm(ry(-flare), scl3(1, Dp.w, Dp.L)));
        put(M.drape[j % 2], UR(Rd), UP([ca * Dp.r, sa * Dp.r, WAIST - 0.05]), 1, glow, { d0: 0.18, wear: 99 }, 0.3); }
      { const swn = (MS ? MS.dr[14] : 0) + 0.03 * Math.sin(t * 1.1) * lv + mvv * 0.06, Rt = ry(-(0.035 + swn * 0.3 + crouch * 0.04)); put(M.tabard, UR(Rt), UP([0.62, 0, WAIST - 0.05]), 1, glow, { d0: 0.2 }, 0.32); }
      /* ---- the torso, the pauldrons, the dorsal mount ---- */
      put(M.torso, UR(scl3(1 + br, 1 + br, 1)), UP([0, 0, 0]), 1, glow + crack * 0.4, { d0: 0.3 }, 0.45);
      for (const s of [1, -1]) { const Mi = s > 0 ? I3 : MY, sa = LF.arm * 0.4 + cl(P.arm || 0) * 0.15; put(M.pauld[k], UR(mm(Mi, rx(-0.32 - sa * 0.3))), UP([-0.05, s * 1.12, 13.55]), 1, glow, { d0: 0.32 }, 0.5); }
      put(M.mount, UR(I3), UP([ROOT[0] + 0.25, 0, ROOT[2] + 0.1]), 1, glow, { d0: 0.36 }, 0.52);
      /* ---- the Venom Crucible ---- */
      const cpBase = UP(CORE), hu = cl(P.heartUp || 0), bl = cl(P.bloom || 0), opn = Math.max(cl(P.open || 0), hu), cg = Math.max(0, (P.core == null ? 0.9 : P.core) + LF.core), flowK = cl(P.flow == null ? 0.5 : P.flow);
      const cA = MS ? (MS.cA = (MS.cA || 0) + MS.h * (0.4 + 1.6 * (P.spin || 1) * (0.5 + cg * 0.4))) : t * 0.6;
      const heartP = add(cpBase, mul(sub(UP([1.2, 0, 23.5]), cpBase), sstep(0, 1, hu))), hk = 1 + bl * 1.6 + hu * 0.35;
      put(M.heart, UR(mm(rz(cA * 0.7), rx(0.3 * Math.sin(cA * 0.4)))), heartP, CR * 0.86 * hk, glow + cg * 0.9, { glow2: cg, noInk: true, d0: 0.65 }, 0.55);
      put(M.fluid, UR(rz(-cA * 0.5)), heartP, CR * 0.96 * hk * (1 + 0.03 * Math.sin(t * 5)), glow + cg, { alpha: 0.97, noInk: true, glow2: cg, d0: 0.66 }, 0.55);
      if (bl < 0.6) put(M.shell, UR(rz(cA * 0.15)), heartP, CR * 1.04 * hk * (1 + 0.6 * bl), glow + cg * 0.4, { alpha: 0.96 * (1 - sstep(0.2, 0.6, bl)), noInk: true, glow2: cg * 0.5, d0: 0.66 }, 0.56);
      for (const s of [1, -1]) { const op = opn * 1.2; put(M.cage, UR(mm(rx(s > 0 ? -op * 0.8 : Math.PI + op * 0.8), rz(s > 0 ? 0 : 0))), add(cpBase, mv(Mu, [0.02 + op * 0.15, s * op * 0.5, 0])), CR * 1.05, glow, { d0: 0.6 }, 0.04); }
      const ncr = low ? 4 : 7;
      for (let i = 0; i < ncr; i++) { const ax = norm([1, 0.5 * Math.sin(i * 2.3 + cA * 0.07), 0.5 * Math.cos(i * 1.7 + cA * 0.05)]), spin = cA * (0.8 + 0.25 * i) * (i % 2 ? -1 : 1) + i * 1.1, rad = CR * (1.22 + i * 0.07) * (1 + opn * 0.5 + bl * 1.4), Rt = mm(frameZ(ax), rz(spin)), lit = cl((P.seq || 0) - i);
        put(M.cring, UR(Rt), heartP, rad, glow + cg * 0.3 + lit, { kind: i, glow2: cg * 0.5 + lit * 1.5 + flowK * 0.4, noInk: true, d0: 0.62 }, 0.05); }
      { const nm = low ? 3 : [0, 5, 7, 9][k]; for (let j = 0; j < nm; j++) { const a = t * (0.9 + j * 0.17) * (1 + cg * 0.3) + j * 2.39, R0 = CR * (1.7 + 0.25 * (j % 3)) * (1 + opn * 0.4 + bl), tl = 0.5 + 0.6 * Math.sin(j * 1.7), ca = Math.cos(a), sa = Math.sin(a);
        put(M.mote, UR(rz(a * 2)), add(heartP, mv(Mu, [0.25 + 0.5 * sa * Math.sin(tl), ca * R0, sa * R0 * Math.cos(tl)])), 0.07 + 0.03 * (j % 3), glow + 0.6 + cg * 0.5, { noInk: true, glow2: cg, d0: 0.6 }, 0.03); } }
      if (bl > 0.01) { const Rf = frameZ(mv(Rroot === null ? I3 : rz(-(P.yaw || 0)), [0.15, 0.75, 0.65]), [0, 0, 1]); for (let j = 0; j < 7; j++) { const a = j / 7 * TAU + cA * 0.25, op = sstep(j * 0.05, 0.6 + j * 0.05, bl), Rp = mm(Rf, mm(rz(a), ry(0.2 + op * 1.2)));   // the Forbidden Bloom: seven petals unfolding round the risen heart, its face turned to the viewer
        put(M.petal, Rp, heartP, (0.6 + 1.1 * op) * (1 + 0.15 * (k - 1)), glow + 0.6 + cg * 0.4, { glow2: cg, d0: 0.64 }, 0.05); } }
      box(heartP, CR * 3 * hk + bl * 4);
      out.core = scr(heartP); out.coreR = CR * hk * K * (o.scale || 1); out.coreVis = cl(Math.sin(P.yaw || 0) * 1.2 + 0.45);
      /* ---- the arms: IK from the shoulder to a hand target (rest: out and forward at chest height; raised; reaching) ---- */
      for (const s of [1, -1]) { const Mi = s > 0 ? I3 : MY, ar = cl(P.arm || 0) + LF.arm, re = cl(P.reach || 0), Sh = UP([SHOULDER[0], s * SHOULDER[1], SHOULDER[2]]);
        const tgt = add(lerp3(lerp3([1.0, s * 3.05, 12.6 + 0.35 * s], [0.6, s * 2.8, 16.2], ar), [3.3, s * 1.2, 12.6], re), [0, 0, LF.breath * 0.05]), A = UP(tgt);
        const IK = ik(Sh, A, LA1, LA2, mv(Mu, [-0.4, s * 0.8, -0.7])), Fu = segF(Sh, IK.K, mv(Mu, [0.3, s * 0.4, 1])), Ff = segF(IK.K, IK.A, mv(Mu, [0.6, s * 0.2, 0.6]));
        put(M.uarm, mm(Fu, Mi), Sh, 1.15, glow, { d0: 0.34 }, 0.55); put(M.farm, mm(Ff, Mi), IK.K, 1.15, glow, { d0: 0.34 }, 0.56);
        const Fh = mm(Ff, mm(rz(s * (0.6 - 0.4 * re)), rx(s * 0.25 + s * 0.35 * (1 - re)))); put(M.hand, mm(Fh, Mi), IK.A, 1.35, glow, { d0: 0.34 }, 0.57); out.hands.push(scr(add(IK.A, mv(Fh, [-0.2, 0, 0.9])))); }
      /* ---- the neck and head ---- */
      const hd = (P.head || 0) + LF.head - crouch * 0.1, look = (P.look || 0) + LF.look + Math.max(-0.3, Math.min(0.3, dyn.yr * 0.25)), hTilt = (P.tilt || 0) + LF.tilt - bank * 0.6;
      const HPm = add(HEADP, [0.25 * hd + 0.12 * crouch, 0, -0.35 * hd]), Rh = mm(rz(look * 0.7), mm(rx(hTilt), ry(0.06 + 0.5 * hd))), hpW = UP(HPm), RhW = UR(Rh), Hm = p => UP(add(HPm, mv(Rh, mul(p, HS))));
      { const a = UP(NECK0), b = hpW, dn = sub(b, a); put(M.neck, colsR(...(() => { const F = frameZ(dn, mv(UR(I3), [1, 0, 0])); return [[F[0], F[3], F[6]], [F[1], F[4], F[7]], mul([F[2], F[5], F[8]], len(dn))]; })()), a, 1, glow, { d0: 0.4 }, 0.6); }
      put(M.hood, RhW, hpW, HS, glow, { d0: 0.42 }, 0.66);
      put(M.mask, RhW, hpW, HS, glow, { glow2: (P.eye == null ? 1 : P.eye), d0: 0.44 }, 0.68);
      const jaw = cl(P.jaw || 0);
      for (const s of [1, -1]) { const Mi = s > 0 ? I3 : MY, piv = [0.0, s * 0.3, 0.46], Rj = mm(rx(-s * jaw * 0.3), ry(jaw * 0.5)), org = sub(piv, mv(Rj, piv)); put(M.jaw, UR(mm(Rh, mm(Rj, Mi))), Hm(add(org, [0, s * jaw * 0.08, 0])), HS, glow, { d0: 0.44 }, 0.68); }   // (each plate turning down and out about its hinge under the cheek)
      if (jaw > 0.04) put(M.emit, UR(mm(Rh, rx(t * 2))), Hm([0.12, 0, 0.22]), HS * (0.6 + 0.5 * jaw), glow + 0.8 + jaw * 2, { noInk: true, glow2: 1 + jaw, d0: 0.45 }, 0.68);
      put(M.crown[k], RhW, hpW, HS, glow, { d0: 0.46 }, 0.72);
      for (const s of [1, -1]) for (let j = 0; j < 3; j++) { const pv = [-0.1 - j * 0.28, s * (0.52 + j * 0.06), 1.38 - j * 0.12], sw2 = (MS ? MS.dr[(j + (s > 0 ? 0 : 3)) * 2] : 0) * 1.4 + 0.06 * Math.sin(t * 1.9 + j + s) * lv, Ro = mm(rx(-s * (0.12 + sw2 * 0.5) + hTilt * -0.8), ry(sw2 * 0.6 - 0.5 * hd));
        put(M.orn, UR(Ro), Hm(pv), 1.25 + 0.2 * (j === 1 ? 1 : 0), glow + 0.3, { d0: 0.46 }, 0.72); }
      // the broken halo behind the head (turning slowly), L4 the rune rings, L7 the rotating halos
      { const hc = UP(add(HEADP, [-0.75, 0, 1.6 + 0.1 * hd])), Rha = mm(rz(look * 0.4), ry(-0.12)); put(M.halo, UR(mm(Rha, rx(t * 0.06 + 0.2))), hc, 1.55 + 0.1 * k, glow + 0.3, { d0: 0.5 }, 0.8);
        if (k >= 2 && !(low && k === 2)) for (let j = 0; j < (k === 3 ? 3 : 2); j++) { const Rr = mm(Rha, mm(ry(Math.PI / 2), mm(rx(0.5 * Math.sin(t * 0.3 + j * 2) + j * 0.9), rz(t * (0.5 + 0.3 * j) * (j % 2 ? -1 : 1))))); put(M.rring, UR(Rr), hc, 2.0 + 0.32 * j, glow + 0.5, { noInk: true, kind: j, glow2: 0.6 + cg * 0.3, d0: 0.5 }, 0.82); }
        if (k === 3 && !low) for (let j = 0; j < 4; j++) { const a = t * 0.35 + j * TAU / 4, fp = UP(add([-1.1, 0, 14.6], [0.35 * Math.sin(a * 1.3), Math.cos(a) * 2.6, Math.sin(a) * 1.4 + 0.2 * Math.sin(t + j)])); put(M.shard, UR(mm(rz(a + 1.2), rx(0.4 + 0.3 * Math.sin(t * 0.7 + j)))), fp, 0.62, glow + 0.4, { d0: 0.5 }, 0.84); }
        box(hc, 3); }
      out.eyes = [[0.42, 0.22, 0.98], [0.42, -0.22, 0.98], [0.38, 0.3, 1.14], [0.38, -0.3, 1.14]].map(p => scr(Hm(p)));
      out.head = scr(hpW); out.mouth = scr(Hm([0.4, 0, 0.25])); out.crownTop = scr(Hm([-0.4, 0, 3.4])); box(hpW, 3.4);
      /* ---- the Sevenfold Crown ---- */
      const venom = P.vflow || null;   // (per tail: the venom's front along it, in segments; absent: full)
      for (let j = 0; j < 7; j++) {
        const C = tailChain(j, P, k, LF, low, 0, flowK); tailFilter(MS, j, C, P, P.yaw || 0);
        const n = C.n, lit = cl((P.seq || 0) - j), se = P.strikes ? P.strikes.find(S => S && S.i === j) : null, sE = se ? cl(se.e) : 0, cath = cl(P.cath || 0), un = cl((P.unf == null ? 7 : P.unf) - UNF_ORDER[j]);
        const fr = venom ? venom[j] : 99, tg = glow + lit * 0.8 + sE * 0.8 + cath * 0.6, chG = flowK + lit * 1.2 + sE * 1.4 + cath, ordT = -1;
        if (un < 0.02 && asm < 0.999) continue;
        for (let s = 0; s < n; s++) { const dd = C.d[s], xv = C.x[s], yv = cross(dd, xv), rr = C.r[s], Rs = colsR(mul(xv, rr), mul(yv, rr), mul(dd, C.L[s] * 1.02));
          put(M.tseg[k], UR(Rs), UP(C.p[s]), 1, tg, { kind: s, glow2: chG, wear: fr, d0: 0.5 + 0.004 * s }, ordT);
          if (s % 3 === 1) out.tailSegs.push(scr(UP(C.p[s]))); }
        const roll = (j - 3 ? Math.sign(j - 3) * Math.PI / 2 : 0) * (1 - 0.7 * Math.max(sE, cl(P.conv || 0), cl(P.cage || 0))), tipR = mm(colsR(C.tipX, cross(C.tipD, C.tipX), C.tipD), rz(roll)), bl2 = BLL[k] * (j === 3 ? 1.12 : 1) * (0.55 + 0.45 * un);
        put(M.bcol, UR(mm(tipR, scl3(C.r[n - 1] * 1.05))), UP(C.tip), 1, tg, { d0: 0.52 }, ordT);
        put(M.blade, UR(mm(tipR, mm(ry(0.12 + 0.15 * sE), scl3(bl2 * 0.9, bl2, bl2)))), UP(add(C.tip, mul(C.tipD, 0.05))), 1, tg + 0.2 + sE * 0.6, { glow2: lit + sE * 1.5 + cath + (P.bladeHeat || 0), d0: 0.55 }, ordT + 0.01);
        const A1 = 1.55, Rb = 1 / A1, tipLocal = [Rb * (1 - Math.cos(A1)), 0, Rb * Math.sin(A1)], tipW = add(C.tip, mv(mm(tipR, ry(0.12 + 0.15 * sE)), mul(tipLocal, bl2)));
        out.tailTips.push(scr(UP(tipW))); out.tailMid.push(scr(UP(C.p[Math.floor(n * 0.55)]))); out.tailRoots.push(scr(UP(C.root))); box(UP(C.tip), bl2 * 1.1); box(UP(C.p[Math.floor(n / 2)]), 1.2);
        (out.tip3 = out.tip3 || []).push(UP(tipW));
      }
      // the great crystal of Scarlet Rupture, over the head at the stingers' ring
      const rp = cl(P.rupt || 0) * 1.3; if (rp > 0.01) { const cc = UP([0.35, 0, 22.2]), sc = 0.4 + 1.6 * Math.min(1, rp); put(M.rcrys, UR(mm(rz(t * 1.6), rx(0.3))), cc, sc, glow + 1 + rp, { glow2: 1 + rp, noInk: true, d0: 0.7 }, 0.9); out.rupt = scr(cc); out.ruptR = sc * 1.5 * K; box(cc, sc * 2); }
      /* ---- the legs: hips on the hub, feet planted (the motion), IK with the knees high; the swing curls the blade ---- */
      const feet = P.feet;
      for (let i = 0; i < 6; i++) {
        const L = LEGS[i], s = L.s, ha = s * L.a, H = BP([Math.cos(ha) * HIPR, Math.sin(ha) * HIPR, HUB[2] - 0.1]), g2 = LGS[i], fo = feet && feet[i] ? feet[i] : null;
        const fx = g2.bx + (fo ? fo[0] : 0), fy = g2.by + (fo ? fo[1] : 0), fz = FOOTH + g2.lift + (fo ? fo[2] : 0), Fp = [fx, fy, fz];
        const rh = norm([Fp[0] - H[0], Fp[1] - H[1], 0]), pole = add([0, 0, 1], mul(rh, 0.35));
        const IK = ik(H, Fp, L.L1, L.L2, pole), nP = norm(cross([0, 0, 1], rh));
        const dF = norm(sub(IK.K, H)), dT = norm(sub(IK.A, IK.K)), xF = norm(cross(dF, nP)), xT = norm(cross(dT, nP));
        const Rc = segF(BP([Math.cos(ha) * 0.75, Math.sin(ha) * 0.75, HUB[2] - 0.1]), H, [0, 0, 1]);
        put(M.coxa, Rc, BP([Math.cos(ha) * 0.8, Math.sin(ha) * 0.8, HUB[2] - 0.1]), 1.3, glow, { d0: 0.0 }, 0.1);
        put(M.femur, colsR(xF, cross(dF, xF), dF), H, 1, glow, { d0: 0.02 }, 0.12);
        put(M.knee, colsR(dF, nP, cross(dF, nP)), IK.K, 1.35, glow, { d0: 0.04 }, 0.14);
        put(M.tibia, colsR(mul(xT, L.L2 * 1.0), mul(cross(dT, xT), L.L2 * 0.85), mul(dT, L.L2)), IK.K, 1, glow, { d0: 0.0 }, 0.1);
        out.feet.push(scr([fx, fy, 0])); out.knees.push(scr(IK.K)); box(H, 1); box(IK.K, 1.2); box(Fp, 0.8); box(lerp3(IK.K, Fp, 0.5), 1.2);
      }
      /* ---- the cocoon (the entrance: rising, cracking, gone when it shatters) ---- */
      const coc = P.coc || 0; if (coc > 0.01 && coc < 2) { const rise = sstep(0, 1, coc), crk = sstep(1, 1.9, coc), sc = 1 + 0.05 * crk * Math.sin(t * 40), cz = 6.4 * rise; put(M.cocoon, mm(rz(t * 0.2), scl3(3.3 * sc, 3.3 * sc, 6.6 * sc * (0.35 + 0.65 * rise))), [0, 0, cz], 1, 0.4 + crk * 2, { glow2: crk * 2, alpha: 0.99, noInk: true, kind: 1, d0: 0 }, -1); box([0, 0, cz], 7.5); out.cocoon = scr([0, 0, cz]); }
      if (!(bx1 > bx0) || !(ITEMS.length + TRANS.length)) return null;
      // (opaque items grouped by mesh: fewer buffer binds; the see-through ones after them, farthest first)
      ITEMS.sort((a, b) => (a.mesh.nv - b.mesh.nv)); TRANS.sort((a, b) => (a.T[0] * PDW[0] + a.T[1] * PDW[1] + a.T[2] * PDW[2]) - (b.T[0] * PDW[0] + b.T[1] * PDW[1] + b.T[2] * PDW[2])); for (const g2 of TRANS) ITEMS.push(g2);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__AS_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : RES.k);
      bx0 = Math.floor(bx0) - 3; by0 = Math.floor(by0) - 3; bx1 = Math.ceil(bx1) + 3; by1 = Math.ceil(by1) + 3;
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      const bw = bx1 - bx0, bh = by1 - by0;
      const S = { px: PXW, py: PYW, pd: PDW, cl: [2 * kk / bw, 2 * (X0 - bx0) / bw - 1, -2 * kk / bh, 1 - 2 * (Y0 - by0) / bh], v: PDW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low, rim: o.rim || RIMC, amb: o.amb || AMBC, t: nowMs() / 1000 % 1000, keep: true,
        outline: o.ink === false || low || shellM > 0.5 ? 0 : Math.max(0.6, 0.7 * (W / bw)), outlineCol: OUTC, outlineBias: 0.0025, clip: null };
      const t0 = nowMs(), cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return null;
      const alp = o.alpha == null ? 1 : o.alpha; if (alp > 0.004) { c.save(); c.globalAlpha = Math.min(1, alp); c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; if (!GLM.soft && STATS.n > 20) RES.k = STATS.ms > 7 ? Math.max(0.6, RES.k - 0.02) : STATS.ms < 3.5 ? Math.min(1, RES.k + 0.01) : RES.k; STATS.items = ITEMS.length; STATS.W = W; STATS.H = H;
      out.bb = [bx0, by0, bx1, by1]; out.unit = K * (o.scale || 1); out.back = scr(UP([ROOT[0], 0, ROOT[2]])); out.top = scr(UP([0, 0, 21])); out.chest = scr(UP([CORE[0], 0, CORE[2] - 1.4])); out.ground = [X0, Y0]; out.steps = MS ? MS.steps : null; out.lifts = LGS.map(q2 => q2.lift);
      out.waist = scr(UP([0.3, 0, WAIST])); out.hub = scr(BP(HUB));
      return out;
    } catch (e) { fail(e); return null; }
  }
  /* AnimaArt's route: the Anima at (x, y) (its feet), size px tall, at time t; o.asP (a pose from the fight) or the form's idle */
  function drawAnima(c, k, x, y, size, t, o) {
    o = o || {}; if (!ensure()) return false;
    const ip = o.inst && o.inst.asP, P = o.asP || ip || idlePose(k, t), fk = o.fk != null ? o.fk : o.flip ? -1 : 1; if (!o.asP && !ip) P.yaw = fk < 0 ? Math.PI - 0.5 : 0.5;
    const K = size / HEIGHT[k];
    const r = draw(c, { X: x, Y: y, K, P, k: P.k || k, alpha: o.alpha == null ? 1 : o.alpha, inst: o.inst });
    if (o.out) o.out.r = r; if (o.inst && ip) o.inst.asOut = { r };
    if (r && !ip && !o.asP && o.light !== false && size >= 60) coreLight(c, r, P, o.alpha == null ? 1 : o.alpha);
    return !!r || (P.asm != null && P.asm < 0.999 && !NOGL);   // (nothing assembled yet is still this model: never the old art in its place)
  }
  /* the Crucible's light on the shared GPU painter (FGFX 325), for stills and menus */
  function coreLight(c, r, P, al) {
    try { const N = typeof self !== 'undefined' && self.NIDHOGG_MOVES, F = N && N.FGFX; if (!F || !F.usable()) return false;
      const R = Math.max(r.coreR * 3.6, 6);
      F.flush(c); const Q = F.begin(c, null); Q.quad(325, r.core[0], r.core[1], R, 0, 0, R, '#FF2A4A', al * (0.45 + 0.55 * (r.coreVis == null ? 1 : r.coreVis)), r.coreR / R, cl(P.bloom || 0), 1.0 + 0.3 * cl((P.core || 0.9) - 0.6));
      for (const e of r.eyes) Q.glow(e[0], e[1], r.unit * 0.3, '#FF1E3C', 0.45 * al);
      F.flush(c); F.begin(c, null); return true; } catch (e) { return false; }
  }
  /* effect meshes in screen space (one GLM pass): list of { m: 'spike' | 'frag' | 'bring' | 'wire' | 'rcrys' | 'shard' | 'petal', X, Y (screen
     px: a spike's foot, else its centre), s (px a model unit), yaw, tilt, lean, a (alpha), gl, g2, dis, kind, z (depth: larger nearer;
     default Y), h (a spike's rise 0..1); a wire: X, Y to X2, Y2 (and z2), s its thickness in px } */
  const SV = [0, 0, 1], SUP = [0, -1, 0], SLK = norm([-0.45, -0.7, 0.55]), SLS = norm([-0.2, -0.85, 0.5]), SLR = norm([0.65, 0.45, -0.2]), PX2 = [1, 0, 0], PY2 = [0, 1, 0], PD2 = [0, 0, 1];
  const CAM = [1, 0, 0, 0, SE, -CE, 0, CE, SE];
  function drawParts(c, list, o) {
    const d = data(); if (!d.ready || NOGL || !list || !list.length) return false; o = o || {};
    try { ITEMS.length = 0; TRANS.length = 0; NP = 0; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const M = D.M;
      const box = (x, y, r) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
      const put = (mesh, R, T, al, gl, g2, dis, kind, ink) => { const g = item(); for (let i = 0; i < 3; i++) { g.R0[i] = R[i * 3] * 0.01; g.R1[i] = R[i * 3 + 1] * 0.01; g.R2[i] = R[i * 3 + 2] * 0.01; g.T[i] = T[i] * 0.01; }
        g.mesh = mesh; g.alpha = al; g.glow = gl || 0; g.glow2 = g2 || 0; g.spill = dis || 0; g.kind = kind || 0; g.wear = 99; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = !(dis > 0.001) && ink !== false; (al < 0.995 ? TRANS : ITEMS).push(g); };
      for (const e of list) {
        const s = e.s, al = e.a == null ? 1 : e.a; if (!(al > 0.01) || !(s > 0.05)) continue;
        if (e.m === 'wire') { const zz = e.z == null ? Math.max(e.Y, e.Y2) : e.z, dx = e.X2 - e.X, dy = e.Y2 - e.Y, L = Math.hypot(dx, dy); if (L < 1) continue; const ux = dx / L, uy = dy / L, R = [dx, -uy * s, 0, dy, ux * s, 0, 0, 0, s]; put(M.wire, R, [e.X, e.Y, zz], Math.min(0.99, al), e.gl, e.g2, e.dis, e.kind, false); box((e.X + e.X2) / 2, (e.Y + e.Y2) / 2, L / 2 + s * 2); continue; }
        const Rb = mm(CAM, mm(rz(e.yaw || 0), mm(rx(e.tilt || 0), ry(e.lean || 0)))), zz = e.z == null ? e.Y : e.z;
        const R = sc => Rb.map(v => v * s * sc);
        if (e.m === 'spike') { const h = cl(e.h == null ? 1 : e.h), sink = (1 - h) * 2.6, v = mv(Rb, [0, 0, -sink]); put(M.spike, R(1), [e.X + v[0] * s, e.Y + v[1] * s, zz + v[2] * s], al, e.gl, e.g2, e.dis); box(e.X, e.Y - s * 1.2, s * 2.6); continue; }
        const mesh = M[e.m === 'bring' ? 'bring' : e.m === 'rcrys' ? 'rcrys' : e.m === 'shard' ? 'shard' : e.m === 'petal' ? 'petal' : 'frag']; if (!mesh) continue;
        put(mesh, R(1), [e.X, e.Y, zz], e.m === 'bring' ? Math.min(0.99, al) : al, e.gl, e.g2, e.dis, e.kind || 0, e.m !== 'bring'); box(e.X, e.Y, s * (mesh.bs ? mesh.bs[3] + len(mesh.bs) : 2) * 1.05);
      }
      if (!(x1 > x0) || !(ITEMS.length + TRANS.length)) return false; for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__AS_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (o.res || (lowFx() ? 0.6 : 0.85));
      x0 = Math.floor(x0) - 2; y0 = Math.floor(y0) - 2; x1 = Math.ceil(x1) + 2; y1 = Math.ceil(y1) + 2; const bw = x1 - x0, bh = y1 - y0;
      let W = Math.ceil(bw * dev), H = Math.ceil(bh * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      const S = { px: PX2, py: PY2, pd: PD2, cl: [200 / bw, -2 * x0 / bw - 1, -200 / bh, 1 + 2 * y0 / bh], v: SV, lk: SLK, ls: SLS, lr: SLR, up: SUP, low: lowFx(), rim: RIMC, amb: AMBC, t: nowMs() / 1000 % 1000, outline: lowFx() ? 0 : Math.max(0.5, 0.6 * (W / bw)), outlineCol: OUTC, outlineBias: 0.002 };
      const cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return false; c.save(); c.globalAlpha = o.alpha == null ? 1 : o.alpha; c.drawImage(cvs, 0, 0, W, H, x0, y0, bw, bh); c.restore(); return true;
    } catch (e) { fail(e); return false; }
  }
  if (typeof window !== 'undefined') setTimeout(() => { try { warm(); } catch (e) {} }, 1900);   // (prepared at load, in idle time)
  /* a point of the model's space (the floor at z 0) in the tails' own (the upper body is drawn US larger about the waist): for aiming a strike */
  const toTail = p => [p[0] / US, p[1] / US, WAIST - 0.2 + (p[2] - WAIST + 0.2) / US];
  return { toTail, US, usable, warm, ensure, step, release, gpuCount, draw, drawAnima, drawParts, coreLight, idlePose, life, footfalls, motion, tailChain, profile, RES, STATS, MT, WS, HEIGHT, STRIDE, LEGS, HUB, CORE, ROOT, NSEG, BLL, FAN, TRIPOD,
    swingOf, legOff, homeOf, ready: () => !!(D && D.ready), get up() { return !!(D && D.up); }, get nv() { return D ? D.nv : 0; }, get off() { return NOGL; } };
})();
if (typeof self !== 'undefined') self.ASMODEUS_GL = ASMODEUS_GL;
