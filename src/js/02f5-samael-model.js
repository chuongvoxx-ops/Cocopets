/* ---------- (v435 SM) Samael, the First Cataclysm: the Aries Anima (Zodiac Anima No. 01) as a real 3D model on GLM ----------
   A colossal ram-dragon powered by a dying star, modelled after the user's second concept sheet (kept out of the repo): a long,
   heavy, forward-weighted body under overlapping black dragon scales with gold-bronze edges and molten red flesh glowing in every seam.
   - the horns: two huge spiral ram horns (each spiral bigger than the head), each one smooth tapering tube built as segments
     (they still part, twist, turn forward or spread for the powers): the outer half flush black scales drawn by the material
     (rows by u, round the tube by v: a bronze-gold highlight on each free edge, a shadow under it, molten light only in the seam),
     the inner half continuous lava with a faint cell pattern; a smaller curl low on each cheek.
   - the head: a long closed dragon wedge of flush black scales, gold-edged plates layered down the snout, heavy brows over red
     eyes, a tall brow spike, three long crest blades swept back a side, the jaw closed at rest with only the fang tips showing.
   - the Heart of Ruin, low in the chest between the forelegs: a blazing star inside concentric gear rings facing out of the chest
     (3 / 4 / 4 by form); its cage, clamp arms and chest plates only appear when it opens (Furnace Overdrive, the Wrath).
   - the body: a long barrel (XS) with a deep chest, broad shoulders, a narrow waist and heavy haunches, carried high (LZ) on long
     legs, the forelegs bigger and taller than the hind legs; dragon claws; a scaled neck; a dorsal ridge of spines; a long, thick,
     scaled tail curling at its end; crimson flame ribbons streaming back and down from the shoulders, flanks and tail tip (more
     and longer from L4, a long burning tail in the meteor).
   Forms (k 1 base, 2 level 4, 3 level 7): The First Cataclysm, The Fiery Herald (bigger horns, more and longer flame) and The
   Starforged Ram (three golden orbit rings round its body, the white-hot heart). No halo or scythes. Materials: GLM ids 400..416
   (20k5uz SM-MAT).
   Everything is procedural geometry built once in idle-time slices into GLM meshes (sides mirrored), posed every frame from a pose P
   (idlePose; 20g4-samael-moves.js drives it). As Belial (02f4): motion(inst, P) keeps planted feet, the body's inertia, the head's
   lead and the tail's chain on the instance (stepped by draw() itself when o.inst is given; r.steps the feet landed this frame);
   the gait blends a heavy diagonal walk into a rotary gallop (P.gal) for the charges, with the gallop's rocking; life(P) lays its
   living motion over any pose (breathing, the head lowering, horn segments adjusting, the joints settling, the tail lagging).
   draw(c, o) renders it at its screen size and lays the image on the canvas, returning the screen points the effects need;
   drawParts(c, list) draws effect meshes (molten rocks, rock spires, armour shards, crescent blades, celestial rings) in screen
   space. Pure: no game state is read or written (the boss fight reuses every piece). release() frees the GPU buffers.
   Real-GPU WebGL only, like Belial (window.__SM_GL = 1 / __NG_GL = 1 force it on a software rasteriser for the tests; __SM_GL = 0
   turns it off): without it AnimaArt draws the existing art of the Aries Anima (no new 2D fallback). */
const SAMAEL_GL = (() => {
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
  const scl3 = k => [k, 0, 0, 0, k, 0, 0, 0, k];
  function axisR(u, a) { const [x, y, z] = norm(u), c = Math.cos(a), s = Math.sin(a), C = 1 - c; return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; }
  function frameZ(d, xh) { const z = norm(d); let x = sub(xh || [1, 0, 0], mul(z, dot(z, xh || [1, 0, 0]))); if (len(x) < 1e-4) x = sub([0, 1, 0], mul(z, z[1])); x = norm(x); const y = cross(z, x); return [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]; }
  const colsR = (x, y, z) => [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const WS = 0.1;
  /* the materials (20k5uz SM-MAT, ids 400..416; a fraction picks a variant < 0.5) */
  const MT = { OB: 400, TI: 401, GD: 402, CR: 403, PL: 404, EYE: 405, STAR: 406, COR: 407, RING: 408, LRING: 409, SHELL: 410, BLADE: 411, ROCK: 412, HORN: 413, MET: 414, EMB: 415, CRES: 416 };
  const bz = (P, u) => { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };
  const bzd = (P, u) => { const v = 1 - u, a = -3 * v * v, b = 3 * v * v - 6 * u * v, c = 6 * u * v - 3 * u * u, d = 3 * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };

  /* ================= the mesh helpers (as Belial's) ================= */
  /* an armour plate: a thick curved shell along a centreline (4 cubic points o.c), half width o.w(u), cupped by o.cup, thickness o.th;
     edge 1 on its rims (the material's gold trim) */
  function plate(B, o) {
    const P = o.c, nu = o.nu || 12, nv = o.nv || 4, cup = o.cup || 0, N0 = norm(o.nrm || [0, 0, 1]), lft = o.lift || 0, m = o.mat == null ? MT.OB : o.mat;
    const FR = []; for (let i = 0; i <= nu; i++) { const u = i / nu, C = bz(P, u), T = norm(bzd(P, Math.min(0.995, Math.max(0.005, u)))); let S = cross(T, N0); if (len(S) < 1e-4) S = cross(T, [0, 0, 1]); S = norm(S); FR.push({ C, T, S, N: cross(S, T) }); }
    const F = u => FR[Math.max(0, Math.min(nu, Math.round(u * nu)))];
    const wid = u => Math.max(0.004, o.w(u)), thk = u => o.th || 0.12;
    const mid = (u, v) => { const f = F(u), w = wid(u); return add(add(f.C, mul(f.S, w * v)), mul(f.N, cup * w * (v * v - 0.35) + lft)); };
    const t0 = o.trim0 == null ? 0.8 : o.trim0, trim = v => sstep(t0, 0.985, Math.abs(v));
    const face = (sg, mt) => B.surf((u, s) => { const v = s * 2 - 1, f = F(u); return add(mid(u, v), mul(f.N, sg * thk(u) * 0.5)); }, nu, nv, () => mt, { flip: sg > 0, e: (u, s) => Math.max(trim(s * 2 - 1), o.endTrim ? sstep(0.9, 1, Math.abs(u * 2 - 1)) : 0) });
    face(1, m); face(-1, o.under == null ? MT.OB + 0.2 : o.under);
    const rim = (vs, flip) => B.surf((u, s) => { const f = F(u), th = thk(u), a = Math.PI * s; return add(add(mid(u, vs), mul(f.N, Math.cos(a) * th * 0.5)), mul(f.S, vs * Math.sin(a) * th * 0.42)); }, nu, 3, () => o.rimMat == null ? m : o.rimMat, { flip, e: () => 1 });
    rim(-1, false); rim(1, true);
    for (const ue of [0, 1]) if (wid(ue) > 0.03) B.surf((v01, s2) => { const v = v01 * 2 - 1, f = F(ue); return add(mid(ue, v), mul(f.N, (s2 - 0.5) * thk(ue))); }, 5, 1, () => o.rimMat == null ? m : o.rimMat, { flip: ue === 1, e: () => 1 });
  }
  /* (concept2) a dragon scale in its frame (x along it, pointing at +x; y across; z out): rounded, ending in a point, bevelled (the bevel gilded) */
  function dscale(B, L, W, mat, th = 1) { B.prism([[-0.15 * L, 0], [0.05 * L, 0.42 * W], [0.35 * L, 0.52 * W], [0.7 * L, 0.36 * W], [L, 0], [0.7 * L, -0.36 * W], [0.35 * L, -0.52 * W], [0.05 * L, -0.42 * W]], -0.03 * th, 0.05 * th, mat, { b: 0.012 * th, backM: MT.OB + 0.2 }); }
  /* a ring of scales round a limb (built along -z): n round, from z0 down, rows rows, each pointing down the limb */
  function scaleRing(B, r, z0, rows, n, L, W) { for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) { const a = (i + (j % 2) * 0.5) / n * TAU, c = Math.cos(a), sn = Math.sin(a), rr = r(j), p = [c * rr, sn * rr, z0 - j * L * 0.62], X1 = norm([c * 0.18, sn * 0.18, -1]), Y1 = [-sn, c, 0], Z1 = cross(X1, Y1); B.push(X1, Y1, Z1, p); dscale(B, L, W, MT.OB + (((i + j) % 3) ? 0.3 : 0)); B.pop(); } }
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
  const latheD = (B, prof, m, seg, c) => { B.push([0, 0, -1], [0, 1, 0], [1, 0, 0], c || [0, 0, 0]); B.lathe(prof, m, { seg: seg || 18, edge: j => (prof[j][3] || 0) }); B.pop(); };
  const latheX = (B, prof, m, seg, c) => { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], c || [0, 0, 0]); B.lathe(prof, m, { seg: seg || 18, edge: j => (prof[j][3] || 0) }); B.pop(); };
  // the Aries sign (two horns curling down from a stem) in a frame at o: up its up, nrm out of it; s its size
  function glyph(B, o, up, nrm, s, mat) { const x = norm(cross(up, nrm)); B.push(x, norm(up), norm(nrm), o); B.tor([-0.26 * s, 0.12 * s, 0], 0.26 * s, 0.06 * s, mat, { seg: 14, rseg: 4, ph0: -0.2, ph1: Math.PI }); B.tor([0.26 * s, 0.12 * s, 0], 0.26 * s, 0.06 * s, mat, { seg: 14, rseg: 4, ph0: 0, ph1: Math.PI + 0.2 }); B.tube([0, 0.12 * s, 0], [0, -0.55 * s, 0], 0.06 * s, 0.05 * s, mat, { seg: 5 }); B.pop(); }

  /* ================= the anatomy ================= */
  /* the barrel: cross-sections along x (x, half width, half height, centre height): the shoulders far the biggest, a tucked waist,
     lean haunches, the chest deep and thrust forward round the Heart of Ruin */
  const TB = [[-3.7, 1.4, 1.35, 7.7], [-3.0, 2.05, 1.95, 7.65], [-1.8, 1.15, 1.05, 7.7], [-0.5, 1.5, 1.4, 7.7], [0.9, 2.6, 2.5, 7.85], [2.2, 3.05, 2.8, 7.95], [3.3, 2.55, 2.5, 7.75], [4.1, 1.6, 1.7, 7.5]];   // (v435 SM: the forehand heavier and higher than the hindquarters)   // (concept2: a heavy, muscular ram-dragon: massive chest and shoulders, powerful haunches)   // (lean and predatory: a deep narrow chest, a tucked waist, long legs under it)
  function tb(x) { if (x <= TB[0][0]) return TB[0].slice(1); for (let i = 1; i < TB.length; i++) if (x <= TB[i][0]) { const a = TB[i - 1], b = TB[i], u = sstep(a[0], b[0], x); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } return TB[TB.length - 1].slice(1); }
  const SPX = 2.6, se = (c, p) => Math.sign(c) * Math.pow(Math.abs(c), 2 / p);
  const bodyPt = (x, ph, o) => { const [w, h, zc] = tb(x); return [x, (w + (o || 0)) * se(Math.cos(ph), SPX), zc + (h + (o || 0)) * se(Math.sin(ph), SPX)]; };
  const bodyN = (x, ph) => { const a = bodyPt(x, ph), b = bodyPt(x, ph + 0.02), c = bodyPt(x + 0.02, ph); return norm(cross(sub(c, a), sub(b, a))); };
  const BODYC = [0.2, 0, 7.5];
  const CORE = [4.1, 0, 6.95], CORER = 0.62;   // (v435 SM concept2: low in the chest, between the forelegs)   // (high on the breast between the shoulders)                 // the Heart of Ruin
  const NECK0 = [3.3, 0, 10.7], HEADP = [6.1, 0, 13.7], HS = 1.5;   // (held ahead of the chest, snout down)   // (carried high on a near-upright neck, as the concept)   // (the head carried high and forward, as the concept: at the withers' height)   // the neck's root, the head's pivot at rest, the head's scale
  const TAIL0 = [-3.75, 0, 8.1];
  /* the legs: hip, side, front, the walk's phase offset, the gallop's, thickness, hoof scale, foot y, upper / lower / cannon lengths, the
     cannon's rest lean (+ the joint ahead of the hoof), the knee's bend (-1 the elbow back, +1 the stifle forward) */
  const LEGS = [
    { x: 2.5, hy: 2.35, z: 7.2, s: 1, f: 1, off: 0.75, goff: 0.5, w: 2.15, hs: 2.0, fy: 2.65, L1: 4.0, L2: 3.8, LC: 1.85, ca: 0.05, kd: -1 },
    { x: 2.5, hy: 2.35, z: 7.2, s: -1, f: 1, off: 0.25, goff: 0.6, w: 2.15, hs: 2.0, fy: 2.65, L1: 4.0, L2: 3.8, LC: 1.85, ca: 0.05, kd: -1 },
    { x: -2.7, hy: 1.6, z: 6.95, s: 1, f: 0, off: 0.0, goff: 0.0, w: 1.5, hs: 1.45, fy: 1.85, L1: 3.65, L2: 3.25, LC: 2.05, ca: -0.24, kd: 1 },
    { x: -2.7, hy: 1.6, z: 6.95, s: -1, f: 0, off: 0.5, goff: 0.1, w: 1.5, hs: 1.45, fy: 1.85, L1: 3.65, L2: 3.25, LC: 2.05, ca: -0.24, kd: 1 }];
  const XS = 1.46, LZ = 1.7;   // (v435 SM: the body carried LZ higher on longer legs)   // (v435 SM concept2: a long, powerful barrel, the stance long and predatory)
  const HOOFH = 0.5, STRIDE = 3.7, SW0 = 0.25, SW1 = 0.56;  // the hoof's height, the stride, the swing's share walking and galloping   (v444 SL: a clear four-beat walk: footfalls a quarter-cycle apart, one hoof up at a time)
  const LMESH = 2.2;                                         // the leg meshes' built length
  /* ---- the Celestial Horns: a spiral about an axis out from the head (a little forward), in head-local space (x forward, y out, z up):
     from the mount at the crown up, back, down behind the ear and forward past the cheek; u 0..1 the Celestial form's whole curl ---- */
  const HA = norm([0.6, 1, -0.05])   /* (the curl's axis pointing out from the head: each horn sweeps out wider than the shoulders as it curls) */, HE1 = norm(sub([1, 0, 0], mul(HA, HA[0]))), HE2 = norm(cross(HE1, HA));   // (the curl's axis: out to the side and a little down, so the spiral flares outward and drops beside the face)
  const HPH0 = 0.75, HSW = 7.2, HR0 = 0.6, HM = [-0.75, 0.5, 1.85];   // (the root on top of the skull, the curl centred below it beside the ear: back, down, forward to the cheek)   // (a ram's curl: from the crown up and back, down behind the ear and forward past the cheek)
  const HC = sub(HM, mul(add(mul(HE1, Math.cos(HPH0)), mul(HE2, Math.sin(HPH0))), HR0));
  const hRad = u => HR0 * Math.exp(-1.05 * u), hAdv = u => 0.75 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 0.25 * u;   // (an upright coil beside the head that bows out from the crown and comes back in at the cheek: a tall C from the front)   // (a logarithmic spiral, tightening as it goes)
  const hornP = u => { const ph = HPH0 + HSW * u; return add(add(HC, mul(HA, hAdv(u))), mul(add(mul(HE1, Math.cos(ph)), mul(HE2, Math.sin(ph))), hRad(u))); };
  const hornR = u => 0.27 * Math.pow(1 - 0.85 * u, 1.05) + 0.02;   // (concept2: thick, the inner turn nesting against the outer)   // (thick at the root, tapering to a point)
  function hornF(u) { const P = hornP(u), T = norm(sub(hornP(Math.min(1.02, u + 0.004)), hornP(Math.max(-0.02, u - 0.004)))), ax = add(HC, mul(HA, hAdv(u))); let N = sub(P, ax); N = norm(sub(N, mul(T, dot(N, T)))); return { P, T, N, Bn: cross(T, N) }; }
  const hsec = ph => 1 + 0.13 * Math.cos(3 * ph) + 0.06 * Math.cos(ph);   // (a rounded-triangular section, its lobe outward: a ram's horn)
  const hornQ = (u, ph, k) => { const f = hornF(u), r = hornR(u) * k * hsec(ph) * (1 + 0.012 * Math.sin(u * 150)); return add(f.P, add(mul(f.N, Math.cos(ph) * r), mul(f.Bn, Math.sin(ph) * r * 0.88))); };   // (ridged: a ram's horn's rings)
  const NHS = 12, NHF = [0, 12, 12, 12];                     // segments built, used by form
  const HSEG = []; for (let i = 0; i < NHS; i++) { const u0 = i / NHS, u1 = (i + 1) / NHS, um = (u0 + u1) / 2, f = hornF(um); HSEG.push({ u0, u1, um, c: f.P, t: f.T, n: f.N, b: f.Bn }); }
  const CRR = [-0.12, 0.52, 0.6];   // (v444 SL) the crest blades' root (head-local, +y side): their pivot
  const HK = [0, 3.9, 4.25, 4.5];   // (v435 SM concept2: each spiral bigger than the head)   // (concept2: each main spiral larger than the head; bigger at L4)   // (huge: the curl about as wide as the head is long)                          // the horns' size by form
  /* the reactor's containment rings: radius (over the star's), axis, speed, mesh */
  const CRINGS = [{ R: 1.45, ax: [1, 0, 0], sp: 0.6, m: 0 }, { R: 1.78, ax: [1, 0.02, 0], sp: -0.42, m: 2 }, { R: 2.1, ax: [1, 0, 0.02], sp: 0.3, m: 1 }, { R: 2.45, ax: [1, -0.02, 0], sp: -0.22, m: 0 }];   // (concept2: concentric gear rings round the star, facing out of the chest)
  const NCR = [0, 3, 4, 4];
  /* the dorsal blades: x along the spine, size, sweep; side pairs from L4 */
  const DBL = [{ x: 2.75, s: 1.1 }, { x: 1.9, s: 1.25 }, { x: 1.0, s: 1.1 }, { x: 0.1, s: 0.95 }, { x: -0.8, s: 0.85 }, { x: -1.7, s: 0.75 }, { x: -2.6, s: 0.65 }, { x: -3.3, s: 0.55 }, { x: 3.35, s: 0.8 }];   // (a ridge of spines along the back)   // (a tall dorsal ridge of blades)
  const NDB = [0, 7, 8, 9], DSIDE = [{ x: 2.2, s: 0.95 }, { x: 1.2, s: 0.9 }, { x: 0.25, s: 0.75 }], NDS = [0, 0, 0, 0];
  /* the floating shoulder shards (+y side): offset from the shoulder, size, phase */
  const FPART = [{ o: [0.7, 2.25, 1.9], s: 0.8, p: 0 }, { o: [-0.35, 2.45, 1.25], s: 0.66, p: 1.7 }, { o: [1.55, 2.1, 1.15], s: 0.58, p: 3.1 }, { o: [0.2, 2.6, 2.6], s: 0.52, p: 4.4 }];
  /* the halo of crescents behind the shoulders (the concept's gold arcs and scythe blades): scythes rising off the withers, sweeping back
     (angle back from vertical, splay out, size), and thin gold arcs round the upper body (tilt, turn, radius) */
  const SCY = [{ a: 0.3, o: 0.35, s: 1.35 }, { a: 0.7, o: 0.6, s: 1.5 }, { a: 1.05, o: 0.9, s: 1.25 }, { a: 0.0, o: 0.75, s: 1.05 }, { a: 1.4, o: 1.15, s: 1.0 }], NSC = [0, 0, 0, 0];
  const ARCS = [{ tx: 1.3, tz: 0.4, R: 3.0, z: 10.0 }, { tx: 0.7, tz: -0.9, R: 3.5, z: 10.6 }, { tx: 1.6, tz: 1.6, R: 2.6, z: 11.2 }], NARC = [0, 0, 0, 0];
  const NFP = [0, 0, 0, 0];
  const SHOULD = [1.85, 1.95, 9.3];                         // the shoulder's armour pivot (+y)
  const HEIGHT = [0, 18.5, 19.3, 20.1];                      // each form's height (model units) for its size

  let D = null;
  function* gen() {
    const q = lowFx() ? 0.7 : 1, M = {}, Q = n => Math.max(3, Math.round(n * q));
    const mk = f => { const B = GLM.builder(q); f(B); return B.done(); };
    /* ---- the barrel: patches of obsidian over a body of plasma that shows through the flanks (between titanium ribs) and under the
       shoulder armour; end caps; the reactor's housing (a toothed gold ring, a titanium collar, a dark recess); crimson channels running
       out from it over the chest and along the flanks; titanium belly plates; the spine's knuckles ---- */
    M.torso = mk(B => {
      const patch = (x0, x1, p0, p1, mat, o) => B.surf((u, v) => bodyPt(lerp(x0, x1, u), lerp(p0, p1, v), o || 0), Q(Math.max(3, Math.round((x1 - x0) * 4))), Q(Math.max(3, Math.round((p1 - p0) * 5))), () => mat, { flip: true, e: () => 0 });
      const PI = Math.PI;
      // (the concept: glossy black blade-armour floating over a body of molten plasma, its light pouring through every gap)
      patch(-3.7, 4.1, 0, TAU, MT.PL, -0.08);
      B.ell([TB[0][0], 0, TB[0][3]], [0.42, TB[0][1] - 0.08, TB[0][2] - 0.08], MT.PL, { seg: 18, rings: 8 }); B.ell([TB[7][0] - 0.02, 0, TB[7][3]], [0.4, TB[7][1], TB[7][2]], MT.OB, { seg: 22, rings: 9 });
      /* the armour: rows of jagged blade-scales over the plasma, pointing back, their tails lifted (shingled, so the light shows between
         them), each bevelled (its rim gilded by the material); none over the flanks' rib windows */
      const scale = (x, ph, L, W, lift, mat) => { const p = bodyPt(x, ph, 0.04), n = bodyN(x, ph), xb = norm(sub(bodyPt(x - 0.1, ph, 0.04), p)), yb = norm(cross(n, xb)), X1 = norm(add(xb, mul(n, lift))), Z1 = cross(X1, yb);
        B.push(X1, yb, Z1, p); dscale(B, L, W, mat); B.pop(); };   // (concept2: overlapping dragon scales, rounded and pointed, gold-edged)
      let row = 0; for (let x = 3.3; x >= -3.5; x -= 0.42, row++) { const st = 0.36, o = row % 2 ? st / 2 : 0;
        for (let ph = -0.95 + o; ph <= PI + 0.95; ph += st) { const chest = x > 2.9 && (ph < 0.2 || ph > PI - 0.2); if (chest) continue;
          const hh = hash(x * 7.1 + ph * 3.3); scale(x, ph, (1.1 + 0.15 * hh) / XS * 0.95, 1.15 + 0.12 * hh, 0.12 + 0.06 * hash(ph * 5.1 + x), MT.OB + (hh > 0.5 ? 0.3 : 0)); } }
      // blades flaring out and down off the chest's sides and up off the shoulders' fronts (the concept's jagged front)
      // the exposed skeleton: titanium ribs over the plasma (five a side, curving round the flank)
      if (false) for (const s of [1, -1]) for (let j = 0; j < 5; j++) { const x = -2.05 + j * 0.5, pts = []; for (let i = 0; i <= 8; i++) { const ph = lerp(0.62, -0.7, i / 8); pts.push(bodyPt(x + 0.05 * Math.sin(i / 8 * Math.PI), s > 0 ? ph : PI - ph, -0.02)); } sweep(B, pts, u => 0.085 * (1 - 0.35 * Math.abs(u * 2 - 1)), MT.TI + 0.3, Q(7), 0.35); }
      // the reactor's housing
      const CX = CORE[0] - 0.12, CZ = CORE[2], CF = CORER / 0.74;
      B.ell([CX - 0.35, 0, CZ], [0.42, 1.05 * CF, 1.05 * CF], MT.OB + 0.2, { seg: 26, rings: 9 });
      B.torX([CX, 0, CZ], 1.22 * CF, 0.12 * CF, MT.GD, { seg: 56, rseg: 6, teeth: 28, tooth: 0.07 }); B.torX([CX - 0.06, 0, CZ], 1.36 * CF, 0.07 * CF, MT.TI, { seg: 48, rseg: 5 }); B.torX([CX + 0.06, 0, CZ], 1.06 * CF, 0.05 * CF, MT.CR, { seg: 44, rseg: 4 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.39, c = Math.cos(a), s = Math.sin(a); B.push([1, 0, 0], [0, c, s], [0, -s, c], [CX, 0, CZ]); B.box([-0.02, 1.32 * CF, 0], [0.12, 0.13, 0.08], 0.03, MT.TI); B.box([0.08, 1.32 * CF, 0], [0.04, 0.06, 0.05], 0.015, MT.GD); B.pop(); }
      // crimson channels from the housing over the chest and the shoulders, and along each flank
      for (const s of [1, -1]) {
        if (false) for (const [ph0, ph1, x1] of [[0.25, 0.55, 2.3], [-0.35, -0.75, 2.6], [0.85, 1.2, 1.6]]) { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10, x = lerp(3.65, x1, u), ph = lerp(ph0, ph1, u); pts.push(bodyPt(x, s > 0 ? ph : PI - ph, 0.01)); } strip(B, pts, i => bodyN(lerp(3.65, x1, i / 10), s > 0 ? lerp(ph0, ph1, i / 10) : PI - lerp(ph0, ph1, i / 10)), 0.075, MT.CR, 0.012); }
        const pts = []; for (let i = 0; i <= 14; i++) { const x = lerp(0.6, -3.3, i / 14); pts.push(bodyPt(x, s > 0 ? 0.62 : PI - 0.62, 0.01)); } strip(B, pts, i => bodyN(lerp(0.6, -3.3, i / 14), s > 0 ? 0.62 : PI - 0.62), 0.06, MT.CR, 0.012); }
      // belly plates (titanium), the spine's knuckles
      if (false) for (let x = -2.9; x <= 2.9; x += 0.58) { const p = bodyPt(x, -PI / 2, 0.02); B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], p); B.box([0, 0, 0], [0.24, tb(x)[0] * 0.55, 0.07], 0.035, MT.TI); B.pop(); }
      if (false) for (let x = -3.4; x <= 3.0; x += 0.42) { const p = bodyPt(x, PI / 2, 0.03); B.box(p, [0.13, 0.17, 0.1], 0.04, MT.TI + 0.3); }
      // vents on the shoulders' rear (slots lit from inside)
      if (false) for (const s of [1, -1]) for (let j = 0; j < 4; j++) { const x = 0.4 - j * 0.0, ph = 1.0 + j * 0.13, p = bodyPt(x, s > 0 ? ph : PI - ph, 0.02), n = bodyN(x, s > 0 ? ph : PI - ph); B.push([1, 0, 0], norm(cross(n, [1, 0, 0])), n, p); B.box([0, 0, 0], [0.32, 0.035, 0.03], 0.012, MT.CR + 0.3); B.box([0, 0.07, 0.01], [0.34, 0.025, 0.04], 0.01, MT.TI); B.pop(); }
    }); yield;
    /* ---- the shoulder armour (+y side; mirrored): three layered angular plates over the shoulder, gold rims, an engraved boss, crimson seams ---- */
    const shoulder = (B, n) => {
      for (let i = n - 1; i >= 0; i--) { const dz = -i * 0.36, dy = i * 0.24, k = 1 + i * 0.12;
        plate(B, { c: [[-1.35 * k, dy - 0.1, dz - 0.5], [-0.55 * k, dy + 0.25, dz + 0.32], [0.62 * k, dy + 0.25, dz + 0.32], [1.42 * k, dy - 0.05, dz - 0.62]], nrm: [0.1, 0.65, 1], w: u => 0.5 * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * u)), 0.12) * (1 + 0.25 * u), cup: -0.22, th: 0.14, nu: Q(12), nv: 3, mat: MT.OB + (i % 2 ? 0.0 : 0.3), trim0: 0.78, endTrim: true });
        B.crystal([1.3 * k, dy - 0.05, dz - 0.55], [1.95 * k, dy - 0.1, dz - 0.95], 0.13, MT.BLADE, { n: 4, thin: 0.35, up: [0, 1, 0] });
        }
      glyph(B, [0.1, 0.42, 0.52], [1, 0, 0.3], [0, 0.7, 0.7], 0.42, MT.GD);
    };
    M.shoulder = [null, mk(B => shoulder(B, 2)), mk(B => shoulder(B, 3)), mk(B => shoulder(B, 3))];
    M.spad = mk(B => { plate(B, { c: [[-0.9, 0, 0.0], [-0.3, 0.18, 0.35], [0.4, 0.18, 0.35], [1.0, 0, -0.1]], nrm: [0, 0.6, 1], w: u => 0.42 * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * u)), 0.12), cup: -0.25, th: 0.12, nu: Q(10), nv: 3, mat: MT.TI, trim0: 0.75, endTrim: true }); });   // (L4+: a titanium plate under the shoulder armour)
    M.haunch = mk(B => { for (let i = 1; i >= 0; i--) plate(B, { c: [[-1.1, i * 0.2 - 0.1, -i * 0.38 - 0.3], [-0.4, i * 0.2 + 0.18, -i * 0.38 + 0.28], [0.45, i * 0.2 + 0.18, -i * 0.38 + 0.28], [1.1, i * 0.2 - 0.1, -i * 0.38 - 0.35]], nrm: [0, 0.6, 1], w: u => 0.42 * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * u)), 0.12), cup: -0.22, th: 0.13, nu: Q(10), nv: 3, mat: MT.OB + i * 0.3, trim0: 0.8, endTrim: true });
      B.crystal([-1.0, -0.1, -0.35], [-1.7, -0.2, -0.15], 0.11, MT.BLADE, { n: 4, thin: 0.35, up: [0, 1, 0] });  });   // (the haunch armour)
    yield;
    /* ---- the legs (built along -z, LMESH long; drawn stretched per leg): the armoured upper leg, the titanium lower leg with its actuator
       housings, the cannon, the cloven hoof, the pistons ---- */
    M.thigh = mk(B => {
      B.sph([0, 0, 0], 0.62, MT.OB, 16); 
      latheD(B, [[0.2, 0.6, MT.OB], [0.6, 0.66, MT.OB], [0.62, 0.7, MT.OB + 0.3, 0], [0.72, 0.7, MT.OB + 0.3, 0], [0.74, 0.56, MT.OB + 0.3], [1.6, 0.46, MT.OB + 0.3], [1.62, 0.54, MT.OB, 0], [1.74, 0.54, MT.OB, 0], [1.76, 0.44, MT.OB], [2.2, 0.42, MT.OB]], MT.OB, Q(18));
      plate(B, { c: [[0.6, 0, 0.05], [0.84, 0, -0.75], [0.74, 0, -1.4], [0.55, 0, -2.0]], nrm: [1, 0, 0], w: u => 0.58 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.15), cup: -0.6, th: 0.13, nu: Q(10), nv: 4, mat: MT.OB + 0.3, trim0: 0.76, endTrim: true });
      plate(B, { c: [[0.05, 0.62, -0.1], [0.1, 0.8, -0.85], [0.0, 0.74, -1.45], [-0.08, 0.58, -1.95]], nrm: [0, 1, 0], w: u => 0.5 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.15), cup: -0.5, th: 0.12, nu: Q(10), nv: 3, mat: MT.OB, trim0: 0.76, endTrim: true });
      scaleRing(B, j => 0.62 - j * 0.035, -0.25, 4, 9, 0.5, 0.42);   // (scaled like a dragon's limb)
      
    });
    M.shin = mk(B => {
      B.sph([0, 0, 0], 0.46, MT.OB + 0.3, 14); 
      B.surf((u, v) => { const z = -0.25 - u * 1.8, ph = v * TAU, r0 = lerp(0.36, 0.3, u), fl = 1 - 0.09 * (0.5 + 0.5 * Math.cos(ph * 10)); return [Math.cos(ph) * r0 * fl, Math.sin(ph) * r0 * fl, z]; }, Q(6), Q(40), () => MT.OB + 0.3, { e: () => 0.25 });
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4, c = Math.cos(a), s2 = Math.sin(a); B.push([c, s2, 0], [-s2, c, 0], [0, 0, 1], [0, 0, 0]); B.box([0.33, 0, -1.05], [0.07, 0.11, 0.72], 0.03, MT.OB + 0.3); B.pop(); }
      scaleRing(B, j => 0.42 - j * 0.02, -0.3, 3, 8, 0.48, 0.36); B.crystal([0.35, 0, 0.05], [0.7, 0, 0.42], 0.11, MT.BLADE, { n: 4, thin: 0.35, up: [0, 1, 0] });   // (the elbow's blade flaring back and out)   // (spiked greaves)
      latheD(B, [[1.95, 0.38, MT.OB], [2.05, 0.42, MT.OB + 0.3, 0], [2.2, 0.36, MT.OB]], MT.OB, Q(18));
      plate(B, { c: [[0.42, 0, 0.1], [0.56, 0, -0.55], [0.5, 0, -1.25], [0.38, 0, -1.85]], nrm: [1, 0, 0], w: u => 0.4 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.15), cup: -0.55, th: 0.12, nu: Q(8), nv: 3, mat: MT.OB, trim0: 0.76, endTrim: true });
      for (const sy of [1, -1]) B.box([-0.3, sy * 0.3, -1.0], [0.08, 0.06, 0.55], 0.025, MT.CR + 0.3);   // (the actuators' lit housings)
    });
    M.cannon = mk(B => {
      latheD(B, [[0, 0.32, MT.OB], [0.12, 0.34, MT.OB + 0.3, 0], [0.22, 0.28, MT.OB + 0.3], [1.9, 0.24, MT.OB + 0.3], [2.0, 0.32, MT.OB + 0.3, 0], [2.2, 0.3, MT.OB]], MT.OB, Q(16));
      plate(B, { c: [[0.33, 0, -0.1], [0.42, 0, -0.7], [0.38, 0, -1.35], [0.3, 0, -1.95]], nrm: [1, 0, 0], w: u => 0.3 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.15), cup: -0.6, th: 0.1, nu: Q(8), nv: 3, mat: MT.OB + 0.3, trim0: 0.75, endTrim: true });
      B.crystal([0.3, 0, -0.35], [0.7, 0, 0.6], 0.14, MT.BLADE, { n: 4, thin: 0.3, up: [0, 1, 0] }); scaleRing(B, () => 0.32, -0.2, 3, 7, 0.44, 0.32); B.crystal([0.36, 0, -1.2], [0.58, 0, -0.55], 0.1, MT.BLADE, { n: 4, thin: 0.3, up: [0, 1, 0] });   // (blade greaves)
    });
    M.hoof = mk(B => {   // cloven: two heavy toes of stepped obsidian plates on a gold-banded fetlock, a titanium dew-claw behind
      latheD(B, [[-0.25, 0.3, MT.OB], [-0.05, 0.36, MT.OB + 0.3, 0], [0.05, 0.36, MT.OB + 0.3, 0], [0.1, 0.4, MT.OB]], MT.OB, Q(16));
      for (const sy of [1, -1]) { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.08, sy * 0.23, -0.1]);
        latheD(B, [[0, 0.24, MT.OB], [0.08, 0.3, MT.OB], [0.1, 0.32, MT.OB + 0.3, 0], [0.16, 0.32, MT.OB + 0.3, 0], [0.18, 0.36, MT.OB], [0.44, 0.4, MT.OB, 0.5], [0.46, 0.0, MT.OB]], MT.OB, Q(14));
        B.crystal([0.2, 0, -0.38], [0.62, 0, -0.42], 0.17, MT.OB + 0.3, { n: 5, thin: 0.55, belly: 0.2, up: [0, 0, 1] }); B.pop(); }
      
      for (const yy of [-0.34, 0, 0.34]) B.crystal([0.25, yy, -0.35], [1.05, yy * 1.45, -0.64], 0.17, MT.BLADE, { n: 4, thin: 0.55, bend: 0.22, up: [0, 0, 1] }); B.crystal([-0.3, 0, -0.35], [-0.75, 0, -0.62], 0.12, MT.BLADE, { n: 4, thin: 0.55, up: [0, 0, 1] });   // (a dragon's clawed foot)
    });
    M.pS = mk(B => { B.tube([0, 0, 0], [1, 0, 0], 0.1, 0.09, MT.TI, { seg: 10, cap0: 'flat', cap1: 'flat' }); B.torX([0.95, 0, 0], 0.11, 0.025, MT.GD, { seg: 12, rseg: 4 }); B.torX([0.4, 0, 0], 0.105, 0.02, MT.CR, { seg: 12, rseg: 4 }); });
    M.pR = mk(B => { B.tube([0, 0, 0], [1, 0, 0], 0.05, 0.05, MT.GD, { seg: 8, cap0: 'flat', cap1: 'round' }); B.sph([0, 0, 0], 0.08, MT.TI, 8); }); yield;
    /* ---- a neck vertebra (along x): a titanium drum, an obsidian top plate with a short blade, cables and a piston under it ---- */
    M.vert = mk(B => { latheX(B, [[-0.55, 0.5, MT.PL], [-0.4, 0.6, MT.PL], [0.3, 0.58, MT.PL], [0.55, 0.48, MT.PL]], MT.PL, Q(16)); B.push([0, 0, 1], [0, 1, 0], [-1, 0, 0], [-0.5, 0, 0]); scaleRing(B, () => 0.6, 0, 3, 9, 0.5, 0.48); B.pop();   // (v435 SM concept2: a scaled neck, no machinery)
      plate(B, { c: [[-0.42, 0, 0.55], [-0.12, 0, 0.84], [0.16, 0, 0.84], [0.42, 0, 0.55]], nrm: [0, 0, 1], w: u => 0.62 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.15), cup: -0.45, th: 0.12, nu: Q(8), nv: 3, mat: MT.OB, trim0: 0.76, endTrim: true });
      B.crystal([0.05, 0, 0.84], [-0.4, 0, 1.3], 0.12, MT.BLADE, { n: 4, thin: 0.4, up: [0, 1, 0] });
      }); yield;
    /* ---- the head (about its pivot; x forward): a long angular ram skull, its brow convex (a ram's), an obsidian faceplate with a gold
       ridge and engraving, deep crimson eyes under angled brows, three blade crown ornaments a side, layered titanium cheek plates, the
       Aries sign on the brow, the horns' toothed mounts ---- */
    const SKT = [[-0.7, 0.58, 0.64, 0.2], [0.25, 0.68, 0.7, 0.25], [1.2, 0.46, 0.52, 0.06], [2.3, 0.24, 0.34, -0.16], [3.3, 0.1, 0.18, -0.45]];   // (a long narrow wedge ending in a hooked beak)   // (long, angular, tapering to a pointed snout)
    const sk = x => { if (x <= SKT[0][0]) return SKT[0].slice(1); for (let i = 1; i < SKT.length; i++) if (x <= SKT[i][0]) { const a = SKT[i - 1], b = SKT[i], u = (x - a[0]) / (b[0] - a[0]); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } return SKT[SKT.length - 1].slice(1); };
    const fpP = u => { const x = lerp(0.0, 3.25, u), [, h, zc] = sk(x); return [x, 0, zc + h + 0.05 + 0.12 * Math.sin(Math.PI * Math.min(1, u * 1.3))]; }, fpW = u => lerp(0.6, 0.08, Math.pow(u, 0.9));
    const fp = (u, v) => { const P = fpP(u); return [P[0] - 0.05 * v * v, v * fpW(u), P[2] - 0.32 * v * v * (1 - 0.3 * u)]; };
    M.head = mk(B => {
      B.surf((u, v) => { const x = lerp(-0.7, 3.3, u), [w, h, zc] = sk(x), ph = v * TAU; return [x, w * se(Math.cos(ph), 2.5), zc + h * se(Math.sin(ph), 2.5)]; }, Q(16), Q(30), () => MT.HORN, { flip: true, e: (u, v) => (v * 6) % 1, a: u => u * 0.6 });   // (v435 SM: a solid skull of flush black scales, as the horns' outer face)
      B.ell([-0.7, 0, 0.2], [0.28, 0.62, 0.7], MT.OB, { seg: 16, rings: 8 }); B.ell([3.3, 0, -0.45], [0.1, 0.1, 0.18], MT.OB, { seg: 12, rings: 6 }); B.crystal([3.2, 0, -0.38], [3.42, 0, -0.62], 0.12, MT.OB + 0.3, { n: 4, thin: 0.6, up: [0, 1, 0] });   // (a short hook at the snout)
      B.surf((u, s) => fp(u, s * 2 - 1), Q(12), 6, () => MT.OB + 0.3, { e: (u, s) => sstep(0.9, 1, Math.abs(s * 2 - 1)) * 0.9 });
      { const pts = []; for (let i = 0; i <= 10; i++) pts.push(add(fp(0.04 + i * 0.09, 0), [0, 0, 0.03])); strip(B, pts, () => norm([0.3, 0, 1]), 0.035, MT.GD + 0.2, 0.012); }
      const hug = (x, z, s, o) => { const [w, h, zc] = sk(x), tt = Math.min(0.95, Math.abs((z - zc) / h)); return [x, s * (w * Math.pow(1 - Math.pow(tt, 1.25), 0.8) + (o || 0.03)), z]; };   // (v435 SM: a point on the skull's side)
      glyph(B, add(fp(0.12, 0), [0.0, 0, 0.07]), norm([1, 0, 0.35]), norm([-0.35, 0, 1]), 0.3, MT.GD); B.crystal(add(fp(0.05, 0), [0, 0, 0.05]), add(fp(0.05, 0), [-0.55, 0, 1.25]), 0.15, MT.GD + 0.2, { n: 4, thin: 0.35, up: [0, 1, 0] });   // (the tall brow spike)
      for (let j = 0; j < 4; j++) { const p0 = fp(0.08 + j * 0.12, 0); B.crystal(add(p0, [0, 0, 0.02]), add(p0, [-0.85, 0, 0.5 - j * 0.08]), 0.08, MT.OB + 0.3, { n: 4, thin: 0.3, up: [0, 1, 0] }); }   // (the gold crest along its brow)
      for (const s of [1, -1]) {
        B.ell([1.0, s * 0.5, 0.44], [0.42, 0.2, 0.17], MT.OB, { seg: 14, rings: 7 });   // (v435 SM: a heavy brow over the eye) B.crystal([1.45, s * 0.42, 0.55], [0.15, s * 0.78, 0.95], 0.13, MT.OB + 0.3, { n: 4, thin: 0.4, up: [0, 0, 1] });   // (a sharp brow ridge)
        strip(B, [[0.82, s * 0.54, 0.36], [1.06, s * 0.58, 0.31], [1.32, s * 0.52, 0.18]], () => norm([0.3, s * 0.95, 0.12]), 0.12, MT.EYE, 0.012);
        // (concept2) the dragon's head: gold-edged plates layered down the snout, crest blades swept far back off the skull
        for (let j = 0; j < 1; j++) plate(B, { c: [hug(1.4 + j * 0.45, 0.25 - j * 0.25, s), hug(1.95 + j * 0.4, 0.12 - j * 0.25, s), hug(2.5 + j * 0.3, -0.05 - j * 0.22, s), hug(3.0 + j * 0.15, -0.25 - j * 0.15, s)], nrm: [0.25, s * 0.75, 1], w: u => 0.15 * (1 - 0.45 * u) + 0.03, cup: 0, th: 0.09, nu: Q(8), nv: 2, mat: MT.OB, trim0: 0.7, endTrim: true });
        // (v444 SL: the three long crest blades are their own mesh, M.crest, so they can flick)
        plate(B, { c: [[0.45, s * 0.42, 0.98], [0.85, s * 0.7, 0.72], [1.2, s * 0.84, 0.5], [1.5, s * 0.82, 0.3]], nrm: [0.4, s * 0.6, 1], w: () => 0.17, cup: 0, th: 0.2, nu: Q(8), nv: 2, mat: MT.OB, trim0: 0.72 });
        plate(B, { c: [hug(0.5, 0.0, s), hug(1.0, -0.15, s), hug(1.55, -0.3, s), hug(2.0, -0.4, s)], nrm: [0, s, -0.1], w: u => 0.27 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.2), cup: 0, th: 0.11, nu: Q(8), nv: 2, mat: MT.OB, trim0: 0.78, endTrim: true });
        plate(B, { c: [hug(0.25, -0.22, s), hug(0.7, -0.36, s), hug(1.15, -0.45, s), hug(1.5, -0.5, s)], nrm: [0, s, -0.35], w: u => 0.2 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.2), cup: 0, th: 0.1, nu: Q(8), nv: 2, mat: MT.OB + 0.3, trim0: 0.78, endTrim: true });
        plate(B, { c: [hug(0.15, 0.6, s), hug(-0.2, 0.62, s), hug(-0.5, 0.55, s), hug(-0.75, 0.4, s)], nrm: [0, s, 0.4], w: u => 0.2 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.2), cup: 0, th: 0.1, nu: Q(8), nv: 2, mat: MT.OB + 0.3, trim0: 0.78, endTrim: true });
        // the crown ornaments: three blades swept back from the brow
        for (let j = 0; j < 3; j++) B.crystal([0.55 - j * 0.32, s * (0.5 + j * 0.1), 0.95 - j * 0.06], [0.05 - j * 0.38, s * (0.66 + j * 0.12), 1.55 - j * 0.12], 0.1 - j * 0.015, MT.BLADE, { n: 4, thin: 0.35, up: [0, s, 0] });
        B.ell([HM[0], s * HM[1], HM[2]], [0.34, 0.26, 0.34], MT.OB + 0.3, { seg: 14, rings: 7 });
      }
      B.box([3.0, 0, -0.42], [0.18, 0.12, 0.14], 0.05, MT.OB + 0.3);
      for (const s of [1, -1]) { B.box([3.3, s * 0.08, -0.36], [0.03, 0.04, 0.04], 0.012, MT.CR + 0.3);
        for (let j = 0; j < 7; j += 2) { const x = 0.9 + j * 0.33, [w, h, zc] = sk(x), yy = s * w * 0.78, zb = zc - h * 0.82; B.crystal([x, yy, zb + 0.08], [x + 0.06, yy * 0.95, zb - 0.17 + j * 0.01], 0.055 + (j === 1 ? 0.03 : 0), MT.GD + 0.2, { n: 4 }); }   // (the upper fangs)
        B.crystal([0.7, s * 0.66, -0.15], [-0.65, s * 1.2, -0.42], 0.12, MT.BLADE, { n: 4, thin: 0.35, up: [0, 0, 1] }); B.crystal([0.2, s * 0.62, 0.5], [-0.9, s * 1.0, 0.75], 0.1, MT.BLADE, { n: 4, thin: 0.35, up: [0, 0, 1] }); }   // (cheek and brow spikes swept back)
      // under the head: bared mechanism (cables, a piston)
    });
    /* (v444 SL) the crest: the three long blades swept back off the skull (+y side; mirrored), built about their root (CRR, head-local) so
       they turn there: flicking, laid back for a roar or a charge, raised in a flare */
    M.crest = mk(B => { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], mul(CRR, -1)); for (let j = 0; j < 3; j++) B.crystal([0.2 - j * 0.32, 0.42 + j * 0.1, 0.72 - j * 0.12], [-2.7 - j * 0.4, 0.7 + j * 0.25, 1.35 - j * 0.3], 0.17 - j * 0.03, MT.BLADE, { n: 4, thin: 0.3, belly: 0.2, up: [0, 1, 0.3] }); B.pop(); });
    // a jaw plate (+y half; mirrored): hinged at its back, it swings down and out to bare the chamber
    M.jaw = mk(B => { plate(B, { c: [[0.0, 0.3, 0.0], [1.0, 0.26, -0.14], [2.0, 0.16, -0.2], [2.95, 0.04, -0.12]], nrm: [0, 0.4, -1], w: u => 0.34 * (1 - 0.5 * u) + 0.03, cup: 0.15, th: 0.22, nu: Q(10), nv: 3, mat: MT.OB, trim0: 0.74 });
       B.crystal([0.3, 0.45, -0.05], [-0.4, 0.6, -0.35], 0.09, MT.BLADE, { n: 4, thin: 0.35, up: [0, 0, 1] });
      for (let j = 0; j < 7; j += 2) { const u = 0.18 + j * 0.11, x = u * 2.95, yy = lerp(0.3, 0.06, u); B.crystal([x, yy * 0.92, -0.02], [x - 0.04, yy * 0.88, 0.16 - j * 0.01], 0.05 + (j === 0 ? 0.025 : 0), MT.GD + 0.2, { n: 4 }); } });   // (the lower jaw half: fangs up; it drops and parts to bare the chamber)
    M.maw = mk(B => { B.sph([0, 0, 0], 0.3, MT.PL, 14); B.torX([0, 0, 0], 0.38, 0.035, MT.GD, { seg: 20, rseg: 4, teeth: 8, tooth: 0.035 }); B.torZ([0, 0, 0], 0.34, 0.03, MT.RING, { seg: 18, rseg: 4 }); }); yield;
    /* ---- the Celestial Horns: each segment's two half-shells (outer with its ridge fin, inner), the plasma core, a joint ring, the tip ---- */
    M.hout = []; M.hin = [];
    for (let i = 0; i < NHS; i++) {
      const S = HSEG[i], u0 = Math.max(0, S.u0 - 0.006), u1 = Math.min(1, S.u1 + 0.01), sc = w => 0.995, nv = Q(10), nu = Q(10);
      const half = (rgs, isOut) => mk(B => { for (const [pa, pb] of rgs) {
        B.surf((w, v) => hornQ(lerp(u0, u1, w), lerp(pa, pb, v), 1.0), nu, Q(isOut ? 14 : 10), () => MT.HORN + (isOut ? 0 : 0.3), { e: (w, v) => isOut ? 0.02 + 0.96 * v : sstep(0.85, 1, Math.abs(v * 2 - 1)), a: w => lerp(u0, u1, w) });
        B.surf((w, v) => hornQ(lerp(u0, u1, w), lerp(pa, pb, v), 0.72), Q(4), nv, () => MT.OB + 0.2, { flip: true, e: () => 0 });
        for (const [ue, k0] of [[u0, sc(0)], [u1, sc(1)]]) B.surf((s2, v) => hornQ(ue, lerp(pa, pb, v), lerp(k0, k0 * 0.72, s2)), 1, nv, () => MT.OB + 0.2, { flip: ue === u1, e: () => 0 });
        for (const pe of [pa, pb]) B.surf((w, s2) => hornQ(lerp(u0, u1, w), pe, lerp(sc(w), sc(w) * 0.72, s2)), nu, 1, () => MT.GD, { flip: pe === pb, e: () => 1 });   // (the split's gilded lips)
        if (false) for (let j = 0; j < (pb - pa > 1.5 ? 4 : 2); j++) { const ph = pa + (j + 0.5 + (i % 2) * 0.5) / (pb - pa > 1.5 ? 4 : 2) * (pb - pa), f = hornF(S.um), r = hornR(S.um), nn = norm(add(mul(f.N, Math.cos(ph)), mul(f.Bn, Math.sin(ph) * 0.88))), X1 = norm(add(f.T, mul(nn, 0.04))), Y1 = norm(cross(nn, X1)); if (ph > pb - 0.2) continue;   // (concept2: the shell of overlapping black scales, pointing to the tip)
          B.push(X1, Y1, cross(X1, Y1), hornQ(S.um - 0.02, ph, 0.99)); dscale(B, r * 1.5, r * 1.15, MT.HORN, Math.min(1, r * 1.1)); B.pop(); }
      } });
      M.hout.push(half([[-1.95, 1.95]], true)); M.hin.push(half([[1.95, TAU - 1.95]], false)); if (i % 2) yield;   // (v435 SM concept2: one smooth tube, its outer half scaled (the material draws the scales), its inner half lava)
    }
    /* (concept2) the cheek curl (+y side; mirrored): a smaller spiral low on the cheek, its outward face molten, in head-local space */
    M.hcurl = mk(B => { const A = 1.75 * Math.PI, C0 = [0.05, 0.92, -0.05], rr = a => 0.46 * Math.exp(-0.2 * a), tr = a => 0.15 * (1 - 0.6 * a / A) + 0.02, q = a => add(C0, [-Math.sin(a) * rr(a), 0.08 * a / A, Math.cos(a) * rr(a)]);
      const Pq = (u, ph) => { const a = u * A, c = q(a), N = norm(sub(c, [C0[0], c[1], C0[2]])), r = tr(a) * (1 + 0.05 * Math.sin(u * 60)); return add(c, add(mul(N, Math.cos(ph) * r), [0, Math.sin(ph) * r, 0])); };
      B.surf((u, v) => Pq(u, lerp(Math.PI / 2 + 1.15, Math.PI * 2.5 - 1.15, v)), Q(26), Q(8), () => MT.HORN, { a: u => u * 0.5, e: (u, v) => 0.02 + 0.96 * v });
      B.surf((u, v) => Pq(u, lerp(Math.PI / 2 - 1.15, Math.PI / 2 + 1.15, v)), Q(26), Q(5), () => MT.HORN + 0.3, { a: u => u * 0.5, e: (u, v) => sstep(0.8, 1, Math.abs(v * 2 - 1)) });
      B.crystal(q(A), add(q(A), [0.15, 0.04, 0.12]), tr(A), MT.HORN, { n: 5 }); });
    /* (concept2) a flame ribbon (in its frame: streaming back along -x and up; u along it, v across): three variants */
    M.rib = [0, 1, 2].map(vi => mk(B => { const ph = vi * 2.1, Lr = 3.4 - vi * 0.35, c = u => [-u * Lr * 1.6, 0.35 * Math.sin(u * 4.0 + ph) * u, -u * 1.4 + u * u * 0.5 + 0.35 * Math.sin(u * 5.5 + ph) * u], w = u => 0.62 * Math.pow(1 - u, 0.5) * Math.min(1, u * 6) + 0.04;   // (v435 SM: long thin silk streamers trailing back and down)
      B.surf((u, v) => { const tw = u * 2.4 + ph * 0.5, o = w(u) * (v - 0.5); return add(c(u), [0, Math.sin(tw) * o, Math.cos(tw) * o]); }, Q(20), 3, () => MT.CRES + 0.3, { e: (u, v) => v, a: u => u, flip: false }); }));
    M.hcore = mk(B => B.surf((u, v) => hornQ(u, v * TAU, 0.6), Q(54), Q(9), () => MT.PL + 0.3, { a: u => u, e: () => 0 }));
    M.hring = null; false && mk(B => { B.tor([0, 0, 0], 1, 0.045, MT.RING + 0.3, { seg: 36, rseg: 4 }); B.tor([0, 0, 0.05], 1.0, 0.022, MT.GD, { seg: 36, rseg: 3, teeth: 18, tooth: 0.025 }); });   // (a thin turning band flush on the horn)
    M.htip = mk(B => { B.crystal([-0.1, 0, 0], [1.0, 0, 0], 0.5, MT.GD + 0.2, { n: 6, belly: 0.18, base: 1, jit: 0 }); B.crystal([0.2, 0, 0], [0.8, 0, 0], 0.56, MT.BLADE, { n: 3, thin: 0.25, belly: 0.1, base: 1, up: [0, 0, 1] }); }); yield;
    /* ---- the Heart of Ruin: the star, its corona, the lattice cage (two halves), the containment rings, the clamp arms, the chest plates, motes ---- */
    M.star = mk(B => B.ell([0, 0, 0], [CORER, CORER, CORER], MT.STAR, { seg: 30, rings: 18 }));
    M.cor = mk(B => B.ell([0, 0, 0], [CORER * 1.28, CORER * 1.28, CORER * 1.28], MT.COR, { seg: 26, rings: 14 }));
    M.cage = mk(B => B.ell([0, 0, 0], [CORER * 1.5, CORER * 1.5, CORER * 1.5], MT.SHELL, { seg: 22, rings: 12, ph0: -Math.PI / 2, ph1: Math.PI / 2 }));   // (a half: +x side; turned for the other)
    M.cring = [mk(B => { B.tor([0, 0, 0], 1, 0.05, MT.RING, { seg: 60, rseg: 5, teeth: 30, tooth: 0.035 }); B.tor([0, 0, 0], 0.9, 0.018, MT.GD, { seg: 56, rseg: 3 }); }),
      mk(B => { B.tube([0, 0, -0.07], [0, 0, 0.07], 1, 1, MT.RING + 0.3, { seg: 60, cap0: false, cap1: false }); B.tor([0, 0, 0.075], 1, 0.022, MT.GD, { seg: 60, rseg: 3 }); B.tor([0, 0, -0.075], 1, 0.022, MT.TI, { seg: 60, rseg: 3 }); }),
      mk(B => { B.tor([0, 0, 0.05], 1, 0.028, MT.GD, { seg: 60, rseg: 4 }); B.tor([0, 0, -0.05], 1, 0.028, MT.TI, { seg: 60, rseg: 4 }); for (let j = 0; j < 10; j++) { const a = j / 10 * TAU; B.crystal([Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0], [Math.cos(a) * 1.22, Math.sin(a) * 1.22, 0], 0.05, MT.GD, { n: 4, thin: 0.5 }); } })];
    M.clamp = mk(B => { B.box([0.5, 0, 0], [0.5, 0.11, 0.12], 0.04, MT.TI); B.tube([0.15, 0, 0.16], [0.85, 0, 0.12], 0.06, 0.05, MT.CR + 0.3, { seg: 6 }); B.crystal([0.95, 0, 0], [1.3, 0, -0.2], 0.12, MT.GD, { n: 4, thin: 0.6, up: [0, 1, 0] }); B.sph([0, 0, 0], 0.14, MT.GD, 8); });
    M.cplate = mk(B => { B.prism([[-0.34, 0], [0.34, 0], [0.48, 0.72], [0, 0.95], [-0.48, 0.72]], -0.07, 0.07, MT.OB, { b: 0.035, backM: MT.OB + 0.2 }); B.box([0, 0.35, 0.075], [0.04, 0.3, 0.012], 0.006, MT.CR); B.box([0, 0.0, 0.07], [0.3, 0.03, 0.02], 0.01, MT.GD); });
    M.emb = mk(B => B.sph([0, 0, 0], 1, MT.EMB, 8));
    M.crown = mk(B => { B.tor([0, 0, 0], 1, 0.06, MT.GD, { seg: 40, rseg: 4 }); for (let j = 0; j < 7; j++) { const a = (j - 3) * 0.35; B.crystal([Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0], [Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0.7 - Math.abs(j - 3) * 0.15], 0.07, MT.GD, { n: 4 }); } }); yield;
    /* ---- the dorsal blade (in x-z: swept back from its root, a molten cutting edge), the floating shoulder shard ---- */
    M.dblade = mk(B => { B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism([[0.35, 0], [-0.35, 0], [-0.9, 1.25], [-0.55, 1.05], [-0.15, 0.55]], -0.07, 0.07, MT.BLADE, { b: 0.03, sideM: MT.BLADE + 0.3 }); B.pop(); B.box([0, 0, 0.02], [0.4, 0.13, 0.08], 0.03, MT.TI); });
    M.fpart = null; false && mk(B => { B.prism([[-0.55, -0.25], [0.6, -0.32], [0.75, 0.15], [0.1, 0.42], [-0.65, 0.2]], -0.12, 0.12, MT.OB + 0.3, { b: 0.05, sideM: MT.GD }); B.box([0, 0, 0.125], [0.42, 0.035, 0.012], 0.006, MT.CR); B.crystal([0.65, 0.05, 0], [1.1, 0.3, 0], 0.1, MT.BLADE, { n: 4, thin: 0.4 }); }); yield;
    /* ---- the halo of crescents: a gold scythe (in x-z: rising from its root and sweeping back, its outer edge the sharp one), a thin gold arc
       with spurs (a ring of ruin), a chain swagged across the chest (+y half; mirrored) ---- */
    M.scythe = null; false && mk(B => { const R0 = 2.4, C0 = [-R0, 0, 0], A1 = 1.3, P = (u, v, sg) => { const th = u * A1, w = 0.06 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.55) + 0.025, rr = R0 + w * (v - 0.25), tk = 0.045 * (1 - v) * Math.sin(Math.PI * Math.min(1, u * 1.05)) + 0.004; return [C0[0] + Math.cos(th) * rr, sg * tk, Math.sin(th) * rr]; };
      for (const sg of [1, -1]) B.surf((u, v) => P(u, v, sg), Q(22), 4, () => MT.GD + 0.2, { flip: sg < 0, e: (u, v) => sstep(0.6, 1, v), a: u => u });
      B.sph([0, 0, 0], 0.11, MT.TI, 8); for (let j = 1; j < 7; j++) { const th = j / 7 * A1, r1 = R0 + 0.07, L = j % 2 ? 0.22 : 0.12; B.crystal([C0[0] + Math.cos(th) * r1, 0, Math.sin(th) * r1], [C0[0] + Math.cos(th + 0.05) * (r1 + L), 0, Math.sin(th + 0.05) * (r1 + L)], 0.035, MT.GD, { n: 4, thin: 0.5 }); } });
    M.halo = null; false && mk(B => { B.tor([0, 0, 0], 1, 0.03, MT.GD + 0.2, { seg: 72, rseg: 4 }); B.tor([0, 0, 0], 0.93, 0.012, MT.LRING, { seg: 72, rseg: 3 }); for (let j = 0; j < 18; j++) { const a = j / 18 * TAU, L = j % 3 === 0 ? 0.42 : 0.2; B.crystal([Math.cos(a), Math.sin(a), 0], [Math.cos(a) * (1 + L), Math.sin(a) * (1 + L), 0], 0.04, MT.GD, { n: 4, thin: 0.5 }); } });   // (the spiked gold halo over its head)
    M.arc = null; false && mk(B => { B.tor([0, 0, 0], 1, 0.011, MT.GD, { seg: 84, rseg: 4, ph0: 0, ph1: 4.6 }); B.tor([0, 0, 0], 0.985, 0.006, MT.LRING, { seg: 84, rseg: 3, ph0: 0.2, ph1: 4.4 });
      for (let j = 0; j < 9; j++) { const a = 0.25 + j * 0.5, L = j % 3 === 0 ? 0.13 : 0.06; B.crystal([Math.cos(a), Math.sin(a), 0], [Math.cos(a) * (1 + L), Math.sin(a) * (1 + L), 0], 0.018, MT.GD, { n: 4, thin: 0.5 }); }
      B.crystal([Math.cos(4.6), Math.sin(4.6), 0], [Math.cos(4.75) * 1.02, Math.sin(4.75) * 1.02, 0], 0.03, MT.GD, { n: 4 }); });
    M.chain = null; false && mk(B => { const a = [2.75, 1.42, 8.6], b = [3.85, 0.7, 8.2], n = Q(12); for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, p = add(lerp3(a, b, u), [0, 0, -0.75 * Math.sin(Math.PI * u)]), d = norm(sub(add(lerp3(a, b, u + 0.02), [0, 0, -0.75 * Math.sin(Math.PI * (u + 0.02))]), p));
      const x = d, y = i % 2 ? norm(cross(d, [0, 0, 1])) : [0, 0, 1], z = cross(x, y); B.push(mul(x, 1.6), y, z, p); B.tor([0, 0, 0], 0.07, 0.022, MT.GD, { seg: 10, rseg: 4 }); B.pop(); } }); yield;
    /* ---- the tail: a segment (along -x), its blade ---- */
    M.tseg = mk(B => { B.push([0, 0, -1], [0, 1, 0], [1, 0, 0], [0.02, 0, 0]); scaleRing(B, () => 0.34, 0, 2, 8, 0.42, 0.36); B.pop(); latheX(B, [[0.05, 0.3, MT.PL], [0, 0.34, MT.OB, 0], [-0.07, 0.34, MT.OB, 0], [-0.09, 0.32, MT.OB + 0.3], [-0.5, 0.27, MT.OB + 0.3], [-0.52, 0.27, MT.PL], [-0.66, 0.2, MT.PL]], MT.PL, Q(12));   // (black plates, molten between them)
      plate(B, { c: [[0.05, 0, 0.36], [-0.15, 0, 0.48], [-0.4, 0, 0.45], [-0.58, 0, 0.32]], nrm: [0, 0, 1], w: u => 0.34 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.4), cup: -0.4, th: 0.09, nu: Q(6), nv: 3, mat: MT.OB });
      B.crystal([-0.2, 0, 0.44], [-0.6, 0, 0.78], 0.08, MT.BLADE, { n: 4, thin: 0.4, up: [0, 1, 0] }); });
    M.ttip = mk(B => { B.crystal([0, 0, 0], [-1.5, 0, -0.25], 0.32, MT.BLADE, { n: 4, thin: 0.3, belly: 0.25, up: [0, 0, 1] }); B.torX([0, 0, 0], 0.3, 0.06, MT.GD, { seg: 16, rseg: 4 }); }); yield;
    /* ---- the effect meshes: the meteor's plasma shell, a celestial ring, a molten rock, a rock spire, an armour shard, a crescent blade ---- */
    M.shellM = mk(B => B.ell([0, 0, 0], [1, 1, 1], MT.MET, { seg: 28, rings: 16 }));
    M.lring = mk(B => { B.tor([0, 0, 0], 1, 0.02, MT.LRING, { seg: 96, rseg: 4 }); B.tor([0, 0, 0], 1.06, 0.012, MT.GD, { seg: 96, rseg: 3 }); for (let j = 0; j < 12; j++) { const a = j / 12 * TAU, L = j % 3 === 0 ? 0.2 : 0.1; B.crystal([Math.cos(a) * 1.03, Math.sin(a) * 1.03, 0], [Math.cos(a) * (1.03 + L), Math.sin(a) * (1.03 + L), 0], 0.025, MT.GD, { n: 4, thin: 0.5 }); } });
    M.rock = mk(B => { const h3 = (x, y, z) => 0.2 * Math.sin(x * 3.3 + y * 1.9) * Math.cos(z * 2.6 + x) + 0.12 * Math.sin(y * 5.1 + z * 3.9);
      B.surf((u, v) => { const th = u * Math.PI, ph = v * TAU, d = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], r = 1 + h3(d[0], d[1], d[2]); return [d[0] * r * 1.1, d[1] * r * 0.92, d[2] * r * 0.85]; }, 7, 9, () => MT.ROCK, { flip: true, e: (u, v) => 0.6 * Math.abs(Math.sin(v * 9 + u * 4)) }); });
    M.spire = mk(B => { B.crystal([0, 0, -0.2], [0.1, 0, 2.2], 0.55, MT.ROCK, { n: 5, belly: 0.25, base: 0.9, seed: 2 }); B.crystal([0.35, 0.2, -0.2], [0.8, 0.45, 1.3], 0.35, MT.ROCK + 0.3, { n: 5, belly: 0.3, seed: 5 }); B.crystal([-0.3, -0.25, -0.2], [-0.75, -0.4, 1.05], 0.3, MT.ROCK, { n: 4, belly: 0.3, seed: 9 }); B.crystal([0.1, -0.4, -0.2], [0.2, -0.85, 0.8], 0.25, MT.ROCK + 0.3, { n: 4, seed: 4 }); });
    M.frag = mk(B => { B.crystal([0, 0, -0.45], [0, 0, 0.5], 0.36, MT.OB + 0.3, { n: 4, belly: 0.4, base: 0.6, seed: 3 }); });
    // a crescent blade: a lens-sectioned arc (u along it, its outer edge the sharp one), thickest at its middle; edge 1 at the cutting edge, aux the place along it
    M.cres = mk(B => { const A0 = -1.25, A1 = 1.25; B.surf((u, v) => { const a = lerp(A0, A1, u), tp = Math.pow(Math.sin(Math.PI * u), 0.7), w = 0.42 * tp + 0.02, rr = 1 - w * (1 - v), th = 0.07 * tp * Math.sin(Math.PI * v); return [Math.cos(a) * rr, Math.sin(a) * rr, th]; }, Q(30), 6, () => MT.CRES, { e: (u, v) => v, a: u => u });
      B.surf((u, v) => { const a = lerp(A0, A1, u), tp = Math.pow(Math.sin(Math.PI * u), 0.7), w = 0.42 * tp + 0.02, rr = 1 - w * (1 - v), th = 0.07 * tp * Math.sin(Math.PI * v); return [Math.cos(a) * rr, Math.sin(a) * rr, -th]; }, Q(30), 6, () => MT.CRES, { flip: true, e: (u, v) => v, a: u => u }); });
    const bsph = m => { let cx = 0, cy = 0, cz = 0; const n = m.nv; for (let i = 0; i < n; i++) { cx += m.pos[i * 3]; cy += m.pos[i * 3 + 1]; cz += m.pos[i * 3 + 2]; } cx /= n; cy /= n; cz /= n; let r = 0; for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(m.pos[i * 3] - cx, m.pos[i * 3 + 1] - cy, m.pos[i * 3 + 2] - cz)); m.bs = [cx, cy, cz, r]; };
    eachOf(M, bsph);
    D.M = M; let nv = 0; eachOf(M, m => { nv += m.nv; }); D.nv = nv; D.ready = true; D.msBuilt = nowMs();
  }
  function eachOf(M, f) { for (const k in M) { const v = M[k]; if (Array.isArray(v)) v.forEach(m => { if (m) f(m); }); else if (v) f(v); } }
  function data() { return D || (D = { ready: false, up: false, it: null, ms: 0 }); }
  function step(ms) { const d = data(); if (d.ready) return true; if (typeof GLM === 'undefined') return false; d.it = d.it || gen(); const t0 = nowMs(), until = t0 + ms; while (!d.ready && nowMs() < until) d.it.next(); d.ms += nowMs() - t0; return d.ready; }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Samael GL: ' + String(e && e.message || e)); } catch (e2) {} };
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__SM_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__SM_GL') === 1 || flag('__NG_GL') === 1)) return false;
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
    eachOf(D.M, mesh => items.push({ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 1 }));
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); d.up = true; }
  function ensure() { if (!usable()) return false; const d = data(); if (!d.ready) { try { step(1e9); } catch (e) { fail(e); return false; } } return d.ready; }
  function release() { if (!D || !D.M) return 0; let n = 0; eachOf(D.M, m => { if (m.gl) { n++; if (typeof GLM !== 'undefined' && GLM.free) GLM.free(m); else m.gl = null; } }); D.up = false; return n; }
  const gpuCount = () => { let n = 0; if (D && D.M) eachOf(D.M, m => { if (m.gl) n++; }); return n; };

  /* ================= the pose ================= */
  /* the resting pose of a form at time t (o: overrides). Keys: the body (yaw, bank, pitch, lift, dx, crouch, rear, spread, shift, stagger),
     the gait (ph, mv, gal the gallop 0..1, gaitK, feet), the head (head + lowers it, look, jaw), the horns (horn: segments open and twist;
     hornSpin: the rings' speed; hornFwd: the horns turned forward; hornHeat: energy driven to the tips; crown: spread into a crown;
     drill: segments turned forward into a drill), the reactor (core: its light; coreOpen: Furnace Overdrive's unfolding; heat 0..1
     crimson to white-hot), vent (the Cataclysm's armour lifting off the plasma), dorsal (the blades fanning), air (the legs tucked:
     airborne), meteor (armour folded, horns locked forward: a projectile), shell (its plasma shell), celest (the L7 rings thrown wide),
     glow, live (life's amount), mech, tail, eye, dis (dissolve), asm (assembly) */
  function idlePose(k, t, o) {
    return Object.assign({ k: k || 3, t: t || 0, yaw: 0, bank: 0, pitch: 0, lift: 0, dx: 0, crouch: 0, rear: 0, head: 0, look: 0, jaw: 0, horn: 0, hornSpin: 1, hornFwd: 0, hornHeat: 0, crown: 0, drill: 0,
      core: 0.9, coreOpen: 0, heat: 0, vent: 0, dorsal: 0, air: 0, meteor: 0, shell: 0, celest: 0, glow: 0, live: 1, ph: 0, mv: 0, gal: 0, feet: null, tail: 0, stagger: 0, dis: 0, asm: 1, eye: 1, spread: 0, shift: 0, mech: 0, gaitK: 1,
      squash: 0, crest: 0 }, o || {});   // (v444 SL: squash the body's compression on a landing; crest the crest blades laid back (-) or raised (+))
  }
  const hold = (t, per, sd, ease) => { const u = t / per + sd, n = Math.floor(u), f = u - n, a = hash(n * 1.37 + sd * 7.1) * 2 - 1, b = hash((n + 1) * 1.37 + sd * 7.1) * 2 - 1; return lerp(a, b, sstep(0, ease || 0.4, f)); };
  /* its life over any pose: mechanical breathing, the shoulder plates shifting, the horn segments turning on their own, the head lowering
     now and then (a flourish every 4.6 s: a low head-dip with a snort of embers, a shrug of the shoulders, a turn of the horns, a lash of
     the tail; each with its anticipation and settle), the joints adjusting under its weight, the tail's delayed sway. P.live scales it */
  /* (v444 SL) livelier: five flourishes (the fifth a head toss with a growl and the crest laid back), breathing that swells the chest and
     flanks (quicker and harder in the Cataclysm), the head scanning the field in held glances (cocked as it looks, the neck following),
     snorts on their own clock (embers puffed from the nostrils: LF.puff, the snort's age, drawn by the moves' body light), the crest blades
     flicking (each flick a damped quiver), the tail swishing on its own clock with a slow curl, the weight shifting fore and aft as well as
     side to side; the Cataclysm (P.heat) shaking it: a tremor, plates flaring, more snorts and flicks */
  const FLP = 4.6, SN = (t, per, sd) => { const n = Math.floor(t / per + sd), f = t - (n - sd) * per; return { n, f }; };
  function life(P) {
    const t = (P && P.t) || 0, lv = P && P.live != null ? cl(P.live) : 1, s1 = Math.sin, hx = cl((P && P.heat) || 0);
    const n = Math.floor((t + 0.9) / FLP), ft = t + 0.9 - n * FLP, typ = ((n % 5) + 5) % 5;
    const pre = ft < 0.4 ? s1(Math.PI * ft / 0.4) : 0, main = sstep(0.3, 0.9, ft) * (1 - sstep(1.5, 2.4, ft)), set = ft > 2.2 && ft < 3.6 ? Math.exp(-(ft - 2.2) * 2.8) * s1((ft - 2.2) * 7) : 0;
    // the snorts: every ~3.7 s (some skipped), every ~1.6 s in the Cataclysm; the flicks of the crest: every ~2.3 s, ~1.1 s in the Cataclysm
    const sa = SN(t, 3.7, 0.37), sb = SN(t, 1.6, 0.11), hot = hx > 0.5, sc0 = hot ? sb : sa, snOn = hot || hash(sc0.n * 3.13 + 0.7) > 0.3, puff = snOn && sc0.f < 1.2 ? sc0.f : -1, sne = puff >= 0 ? sstep(0, 0.07, puff) * (1 - sstep(0.12, 0.42, puff)) : 0;
    const ca = SN(t, hot ? 1.1 : 2.3, 0.53), cdl = hash(ca.n * 5.31 + 1.9) * (hot ? 0.5 : 1.3), cfu = ca.f - cdl, flick = cfu > 0 && hash(ca.n * 2.17) > (hot ? 0 : 0.25) ? Math.exp(-cfu * 7) * s1(cfu * 27) * (hot ? 0.55 : 0.32) : 0;
    const tw = SN(t, 5.3, 0.71), tsw = tw.f > 0.2 ? Math.exp(-(tw.f - 0.2) * 2.6) * s1((tw.f - 0.2) * 5.2) * (hash(tw.n * 1.7) > 0.5 ? 1 : -1) : 0;
    const toss = typ === 4 ? main : 0, shake = hx * (0.55 * s1(t * 37) + 0.45 * s1(t * 53 + 1.3));
    const brth = (1 - hx) * s1(t * 1.1) + hx * s1(t * 2.9);
    return { typ, fl: main, snort: (typ === 0 ? sstep(0.8, 1.0, ft) * (1 - sstep(1.2, 1.6, ft)) : 0) + sne * 0.8, puff, puffK: hot ? 1.5 : 1,
      breath: brth * lv * (1 + 0.6 * hx), bob: (0.035 * brth + 0.012 * s1(t * 2.7)) * lv,
      head: (0.05 * s1(t * 0.41) + (typ === 0 ? 0.38 * main - 0.08 * pre + 0.06 * set : 0) + 0.07 * sne - (typ === 4 ? 0.42 * main - 0.1 * pre - 0.08 * set : 0)) * lv, look: (0.1 * s1(t * 0.27) + (typ === 2 ? 0.22 * main : 0) + 0.12 * toss * s1(ft * 9) * (1 - sstep(1.3, 2.0, ft))) * lv + 0.012 * shake,
      shoulder: (0.035 * s1(t * 0.7) + (typ === 1 ? 0.2 * main - 0.05 * pre + 0.06 * set : 0) + 0.02 * brth) * lv,
      horn: (typ === 2 ? 0.16 * main : 0.03 * (0.5 + 0.5 * s1(t * 0.6))) * lv, hornTurn: (0.05 * s1(t * 0.33) + (typ === 2 ? 0.07 * main : 0)) * lv,
      core: (0.14 * s1(t * 2.1) + 0.07 * s1(t * 4.7) + 0.05 * s1(t * 7.3)) * lv, tail: (0.2 * s1(t * 0.8) + (typ === 3 ? 0.55 * main - 0.15 * pre + 0.12 * set : 0) + 0.42 * tsw) * lv, tailY: (0.1 * s1(t * 1.2) + 0.12 * s1(t * 0.37 + 1)) * lv,
      curl: (0.5 + 0.5 * s1(t * 0.37 + 0.4)) * lv,
      piston: 0.04 * s1(t * 1.5) * lv, fpart: t, jaw: ((typ === 0 ? 0.12 * main : 0) + 0.06 * sne + 0.3 * toss) * lv,
      shift: 0.5 * hold(t, 6.1, 0.31, 0.45) * lv, shiftX: 0.22 * hold(t, 7.3, 0.77, 0.5) * lv, neckL: 0.2 * hold(t, 2.9, 1.13, 0.22) * lv, neckH: 0.05 * hold(t, 4.3, 2.37, 0.4) * lv, armour: 0.5 + 0.5 * s1(t * 1.1 - 0.6),
      crest: (flick + 0.05 * s1(t * 1.1 - 1) - 0.55 * toss) * lv, shake, flare: hx * (0.5 + 0.5 * s1(t * 17)) };
  }
  /* the gait: the walk (diagonal couplets) blended into a rotary gallop by gal: offsets and the swing's share move between the two */
  const legOff = (L, gal) => lerp(L.off, L.goff, cl(gal || 0)), swingOf = gal => lerp(SW0, SW1, cl(gal || 0));
  const swF = w => sstep(0.04, 0.82, w);
  const swL = w => (w < 0.38 ? Math.sin(Math.PI / 2 * w / 0.38) : Math.pow(Math.cos(Math.PI / 2 * (w - 0.38) / 0.62), 1.35));
  const swP = w => Math.sin(Math.PI * cl(w / 0.7)) * (w < 0.7 ? 1 : 0);   // (the curl of the lower leg in the swing)
  function gait(ph, mv, gk, gal) {
    const out = [], mvp = Math.max(0.3, mv) * sstep(0, 0.3, mv), kk = gk || 1, SW = swingOf(gal);
    for (const L of LEGS) { let q = ph / TAU + legOff(L, gal); q -= Math.floor(q); const sw = q >= 1 - SW, w = sw ? (q - (1 - SW)) / SW : 0, Dd = STRIDE * kk * mvp * (1 - SW);
      const dx = sw ? -Dd / 2 + Dd * swF(w) : Dd / 2 - Dd * (q / (1 - SW)), lift = sw ? swL(w) * (0.6 + 0.3 * L.f) * Math.min(1, mv * 1.6) * (1 + 0.35 * (kk - 1)) : 0;
      const load = !sw && q < 0.16 ? Math.sin(Math.PI * q / 0.16) * mv : 0;
      out.push({ dx, lift, load, sw, w, pitch: sw ? swP(w) * Math.min(1, mv * 1.6) : 0 }); }
    return out;
  }
  function footfalls(ph0, ph1, gal) { const out = []; if (!(ph1 > ph0)) return out; for (let i = 0; i < 4; i++) { const L = LEGS[i], o = legOff(L, gal), a = ph0 / TAU + o, b = ph1 / TAU + o; if (Math.floor(b) > Math.floor(a)) out.push({ i, f: !!L.f }); } return out; }
  function springs(inst, ax, ay, dt) {
    let S = inst.smS; if (!S) S = inst.smS = new Float32Array(16);
    dt = Math.min(0.05, Math.max(0, dt || 0));
    for (let i = 0; i < 4; i++) { const o = i * 4, kx = 14 + i * 4, dmp = 2.6; S[o + 1] += (-ax * 0.03 - S[o] * kx - S[o + 1] * dmp) * dt; S[o] += S[o + 1] * dt; S[o + 3] += (-ay * 0.03 - S[o + 2] * kx - S[o + 3] * dmp) * dt; S[o + 2] += S[o + 3] * dt; S[o] = Math.max(-0.6, Math.min(0.6, S[o])); S[o + 2] = Math.max(-0.6, Math.min(0.6, S[o + 2])); }
    return S;
  }
  /* ---- the motion an instance keeps (inst.smM; as Belial's): planted feet that keep their place on the floor while the body travels and
     turns over them, swings to a landing half a stance ahead, settle steps at a standstill (one or a diagonal pair at a time), all four
     feet held tucked while airborne (P.air) and set down together on landing (four steps flagged land: the effects' four-hoof strike);
     the body's inertia (a vertical spring kicked by each landing, a fore-aft spring from the walk's acceleration: the lurch of a stop,
     a lateral one from the turn), the turn's rate, the tail's lagging chain. M.steps: the feet landed this frame { i, f, idle, land } ---- */
  const ISD = 0.36;
  const homeOf = (i, P) => { const L = LEGS[i]; return [L.x * XS, L.s * (L.fy + (P.spread || 0) * (L.f ? 1 : 0.85))]; };
  const angDf = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  function newM(P) { const yaw = P.yaw || 0, c = Math.cos(yaw), s = Math.sin(yaw), F = [];
    for (let i = 0; i < 4; i++) { const h = homeOf(i, P); F.push({ gx: c * h[0] - s * h[1], gy: s * h[0] + c * h[1], sw: 0, w0: 0, p: 0, dir: 1, s0x: h[0], s0y: h[1], tx: h[0], ty: h[1], bx: h[0], by: h[1], lift: 0, l0: 0, pitch: 0, ld: 0, cyc: Math.floor((P.ph || 0) / TAU + legOff(LEGS[i], P.gal)), H: 0 }); }
    return { t: P.t || 0, yaw, ph: P.ph || 0, mv: cl(P.mv || 0), h: 0, yr: 0, acc: 0, sx: 0, vx: 0, sy: 0, vy: 0, sz: 0, vz: 0, air: 0, F, tail: new Float32Array(13), tailP: new Float32Array(13), steps: [], n: 0, mA: 0 }; }
  function motion(inst, P) {
    if (!inst || !P) return null; const t = P.t || 0; let M = inst.smM; const dt = M ? t - M.t : 0;
    if (!M || dt < -1e-3 || dt > 0.6) { M = inst.smM = newM(P); return M; }
    M.h = 0; if (dt < 1e-5) return M;
    M.steps.length = 0; const h = Math.min(dt, 0.05); M.h = h; M.t = t;
    const yaw = P.yaw || 0, ph = P.ph || 0, mv = cl(P.mv || 0), gk = P.gaitK || 1, gal = cl(P.gal || 0), SW = swingOf(gal), c = Math.cos(yaw), s = Math.sin(yaw), dph = ph - M.ph, walking = Math.abs(dph) / TAU / dt > 0.3, dir = dph >= 0 ? 1 : -1;
    M.yr += (angDf(yaw, M.yaw) / dt - M.yr) * Math.min(1, h * 7); M.acc += ((mv - M.mv) / dt - M.acc) * Math.min(1, h * 9); M.yaw = yaw; M.ph = ph; M.mv = mv;
    const mvp = Math.max(0.3, mv), tr = dph / TAU * STRIDE * gk * mvp, mx = c * tr, my = s * tr, Dd = STRIDE * gk * mvp * (1 - SW), toB = (x, y) => [c * x + s * y, -s * x + c * y];
    const rear = cl(P.rear || 0), fe = P.feet, air = cl(P.air || 0), wasAir = M.air; M.air = air;
    if (air > 0.3) { for (let i = 0; i < 4; i++) { const f = M.F[i], hm = homeOf(i, P); f.gx = c * hm[0] - s * hm[1]; f.gy = s * hm[0] + c * hm[1]; f.bx = hm[0]; f.by = hm[1]; f.sw = 0; f.lift = 0; f.pitch = 0; f.cyc = Math.floor(ph / TAU + legOff(LEGS[i], gal)); } }
    else if (wasAir > 0.3) { for (let i = 0; i < 4; i++) { const f = M.F[i]; f.ld = 1; M.steps.push({ i, f: !!LEGS[i].f, idle: false, land: true }); M.n++; } M.vz -= 1.6; }
    else {
      let nIdle = 0, idleP = 1; for (const f of M.F) if (f.sw === 2) { nIdle++; idleP = Math.min(idleP, f.p); }
      for (let i = 0; i < 4; i++) {
        const L = LEGS[i], f = M.F[i], hm = homeOf(i, P); let q = ph / TAU + legOff(L, gal); const cyc = Math.floor(q); q -= cyc; const inW = q >= 1 - SW, w = inW ? (q - (1 - SW)) / SW : 0, Hs = (0.6 + 0.3 * L.f) * Math.min(1, mv * 1.6 + 0.25) * (1 + 0.35 * (gk - 1));
        f.ld = Math.max(0, f.ld - h / 0.25);
        const land = (x, y, idle) => { const gx = c * x - s * y, gy = s * x + c * y; f.gx = gx; f.gy = gy; f.sw = 0; f.lift = 0; f.pitch = 0; f.ld = 1; f.cyc = cyc; f.bx = x; f.by = y;
          const kick = (L.f ? 0.58 : 0.4) * (idle ? 0.5 : 0.55 + 0.45 * mv) * (1 + 0.3 * (gk - 1)); M.vz -= kick; M.steps.push({ i, f: !!L.f, idle: !!idle }); M.n++; };
        if (f.sw === 0) { f.gx -= mx; f.gy -= my; const b = toB(f.gx, f.gy); f.bx = b[0]; f.by = b[1];
          if (walking && inW) { f.sw = 1; f.dir = dir; f.w0 = dir > 0 ? w : 1 - w; f.s0x = f.bx; f.s0y = f.by; }
          else if (walking && dir > 0 && cyc !== f.cyc && !inW) land(hm[0] + Dd / 2, hm[1], false);
          else if (!walking) f.cyc = cyc; }
        if (f.sw === 1) {
          if (!walking) { f.sw = 2; f.p = 0; f.dur = 0.28; f.l0 = f.lift; f.s0x = f.bx; f.s0y = f.by; nIdle++; idleP = 0; }
          else if (!inW) land(hm[0] + f.dir * Dd / 2, hm[1], false);
          else { const pr = cl(((f.dir > 0 ? w : 1 - w) - f.w0) / Math.max(0.05, 1 - f.w0)); f.tx = hm[0] + f.dir * Dd / 2; f.ty = hm[1]; f.bx = lerp(f.s0x, f.tx, swF(pr)); f.by = lerp(f.s0y, f.ty, swF(pr)); f.lift = swL(pr) * Hs; f.pitch = swP(pr) * f.dir; f.H = Hs; }
        }
        if (f.sw === 2) { f.p = Math.min(1, f.p + h / (f.dur || ISD)); const pr = f.p, Hi = 0.32 + 0.14 * L.f; f.bx = lerp(f.s0x, hm[0], swF(pr)); f.by = lerp(f.s0y, hm[1], swF(pr)); f.lift = Math.max(swL(pr) * Hi, f.l0 * (1 - sstep(0, 0.6, pr))); f.pitch = swP(pr) * 0.6;
          if (pr >= 1) land(hm[0], hm[1], true); }
      }
      if (!walking) {
        let best = -1, be = 0; for (let i = 0; i < 4; i++) { const f = M.F[i], L = LEGS[i]; if (f.sw !== 0) continue; const hm = homeOf(i, P), e = Math.hypot(f.bx - hm[0], f.by - hm[1]);
          if (e > 4) { f.gx = c * hm[0] - s * hm[1]; f.gy = s * hm[0] + c * hm[1]; f.bx = hm[0]; f.by = hm[1]; continue; }
          if ((L.f && rear > 0.05) || (fe && fe[i] && (Math.abs(fe[i][0]) + Math.abs(fe[i][2])) > 0.01)) continue;
          const mate = M.F[3 - i]; if (nIdle >= 2 || (nIdle === 1 && !(mate.sw === 2 || idleP > 0.55))) continue;
          if (e > 0.24 + (nIdle ? 0.1 : 0) && e > be) { be = e; best = i; } }
        if (best >= 0) { const f = M.F[best]; f.sw = 2; f.p = 0; f.dur = ISD * (be > 0.9 ? 1 : 0.85); f.l0 = 0; f.s0x = f.bx; f.s0y = f.by; }
      }
    }
    const spr = (x, v, k, z, F) => v + (-k * x - 2 * z * Math.sqrt(k) * v + F) * h;
    M.vz = spr(M.sz, M.vz, 120, 0.45, 0); M.sz += M.vz * h;
    M.vx = spr(M.sx, M.vx, 30, 0.34, -M.acc * 1.2); M.sx += M.vx * h;
    M.vy = spr(M.sy, M.vy, 26, 0.42, mv * M.yr * 0.8); M.sy += M.vy * h;
    M.sz = Math.max(-0.5, Math.min(0.3, M.sz)); M.sx = Math.max(-0.7, Math.min(0.7, M.sx)); M.sy = Math.max(-0.6, Math.min(0.6, M.sy));
    return M;
  }
  /* two-bone IK in the leg's plane: hip H, joint J; the knee bends toward kd (+1 forward, -1 back) */
  function ik(H, A, L1, L2, kd) { let d = sub(A, H); const dl = Math.min(L1 + L2 - 0.002, Math.max(0.4, len(d))); d = mul(norm(d), dl); const a = Math.acos(cl((L1 * L1 + dl * dl - L2 * L2) / (2 * L1 * dl))), dn = norm(d), side = norm(cross(dn, [0, 1, 0])), K = add(H, add(mul(dn, Math.cos(a) * L1), mul(side, kd * Math.sin(a) * L1)));
    return { K, A: add(H, d) }; }
  const segR = (from, to) => { const d = norm(sub(to, from)), a = Math.atan2(-d[0], -d[2]), R0 = ry(a); const tilt = Math.atan2(d[1], Math.hypot(d[0], d[2])); return mm(rx(tilt), R0); };

  /* ================= drawing ================= */
  const LW = norm([-0.45, 0.42, 0.8]), SBW = norm([-0.3, -0.2, 0.92]), RIMW = norm([0.65, -0.62, 0.42]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const RIMC = [1.45, 0.62, 0.42], AMBC = [1.15, 1.04, 1.02], OUTC = [0.03, 0.012, 0.01], GLCAP = 1600;   // (a crimson rim light: its own, not Belial's amber)
  const POOL = [], ITEMS = [], TRANS = []; let NP = 0;
  /* (v444 SL) the canvas's visible rectangle in its current user space (2 px of margin), and a pass's GL pixel budget in a fight by the
     visual quality (0 the model, 1 its effect meshes; none outside a fight: menus keep their full resolution) */
  function visBox(c) { const m = c.getTransform ? c.getTransform() : null, cv = c.canvas; if (!m || !cv || !cv.width) return null; const det = m.a * m.d - m.b * m.c; if (Math.abs(det) < 1e-9) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [X, Y] of [[0, 0], [cv.width, 0], [0, cv.height], [cv.width, cv.height]]) { const dx = X - m.e, dy = Y - m.f, ux = (m.d * dx - m.c * dy) / det, uy = (-m.b * dx + m.a * dy) / det; x0 = Math.min(x0, ux); y0 = Math.min(y0, uy); x1 = Math.max(x1, ux); y1 = Math.max(y1, uy); }
    return [Math.floor(x0) - 2, Math.floor(y0) - 2, Math.ceil(x1) + 2, Math.ceil(y1) + 2]; }
  const PXB = [[0.5e6, 0.35e6, 0.25e6, 0.25e6], [0.42e6, 0.3e6, 0.2e6, 0.2e6]];
  const budget = j => { try { if (typeof GQ === 'undefined' || typeof arc === 'undefined' || !arc.game || arc.mode !== 'dungeon') return 1e12; return PXB[j][Math.max(0, Math.min(3, GQ.level() | 0))]; } catch (e) { return 1e12; } };
  const BX = [0, 0, 0], TIPF = [], SLO = () => flag('__SL_OFF') === 1; let HP45 = null;   // (v444 SL: scratch, the horn tip's frame by segment count, window.__SL_OFF = 1: v443's drawing)
  const LGS = [{}, {}, {}, {}], ZM = { sx: 0, sy: 0, sz: 0, yr: 0, h: 0, F: null, steps: null, mA: 0 };
  const item = () => { const g = POOL[NP] || (POOL[NP] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NP++; return g; };
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0 };
  const RES = { k: 1 }; const profile = () => (lowFx() ? 'low' : RES.k < 0.95 ? 'medium' : 'high');
  /* o: X, Y (the floor point under its middle, on screen), K (px a model unit), P (a pose), k (form), alpha, inst (springs, motion), low.
     Returns its screen points or null */
  function draw(c, o) {
    const d = data(); if (!d.ready || NOGL) return null;
    try {
      const slo = SLO(), P = o.P || idlePose(o.k || 3, o.t || 0), k = P.k || o.k || 3, t = P.t || 0, sw = WS * (o.scale || 1), K = o.K, kk = K / WS, X0 = o.X, Y0 = o.Y, M = D.M, low = lowFx() || o.low;
      const LF = life(P), lv = P.live == null ? 1 : cl(P.live), heat = cl(P.heat || 0), vent = cl(P.vent || 0), met = cl(P.meteor || 0), air = Math.max(cl(P.air || 0), met);
      const Rroot = mm([1, 0, 0, 0, 1, 0, 0, 0, 1.06], rz(P.yaw || 0));
      const W3 = p => { const q = mv(Rroot, p); return [q[0] * sw, q[1] * sw, q[2] * sw]; };
      const SX = w => X0 + w[0] * kk, SY = w => Y0 + (w[1] * SE - w[2] * CE) * kk, scr = p => { const w = W3(p); return [SX(w), SY(w)]; };
      ITEMS.length = 0; TRANS.length = 0; NP = 0; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      const box = (p, r) => { const w = W3(p), x = SX(w), y = SY(w), rr = r * K * (o.scale || 1); if (x - rr < bx0) bx0 = x - rr; if (x + rr > bx1) bx1 = x + rr; if (y - rr < by0) by0 = y - rr; if (y + rr > by1) by1 = y + rr; };
      const glow = (P.glow || 0) + (k === 3 ? 0.2 : k === 2 ? 0.1 : 0) + heat * 0.35, dis = cl(P.dis || 0), asm = P.asm == null ? 1 : cl(P.asm);
      /* put a mesh: R its turn (model space), T its origin, sc its scale, ord its place in the assembly (0 first: the reactor .. 1 last: the horns) */
      const put = (mesh, R, T, sc, gl, op, ord) => {
        if (!mesh) return null; sc = sc || 1; let ga = 0;
        if (asm < 0.999) { const a0 = (ord || 0) * 0.74, a = sstep(a0, a0 + 0.26, asm); if (a < 0.02) return null; const dir = sub(T, CORE), ax = norm([hash(T[0] * 3.1 + T[2]) - 0.5, hash(T[1] * 5.7 + 1) - 0.5, 0.7]);
          T = add(T, add(mul(dir, (1 - a) * 1.3), [0, 0, (1 - a) * 1.2])); R = mm(axisR(ax, (1 - a) * 3.4), R); sc *= 0.45 + 0.55 * a; ga = (1 - a) * 2.4; }   // (each part converging on the reactor, turning into place out of light)
        const g = item(), z = sw * sc;
        if (slo) { const Rm = mm(Rroot, R), Tw = W3(T); for (let i = 0; i < 3; i++) { g.R0[i] = Rm[i * 3] * z; g.R1[i] = Rm[i * 3 + 1] * z; g.R2[i] = Rm[i * 3 + 2] * z; g.T[i] = Tw[i]; } }
        else for (let i = 0; i < 3; i++) { const a0 = Rroot[i * 3], a1 = Rroot[i * 3 + 1], a2 = Rroot[i * 3 + 2];   // (v444 SL: the same sums in the same order, no arrays made)
          g.R0[i] = (a0 * R[0] + a1 * R[3] + a2 * R[6]) * z; g.R1[i] = (a0 * R[1] + a1 * R[4] + a2 * R[7]) * z; g.R2[i] = (a0 * R[2] + a1 * R[5] + a2 * R[8]) * z; g.T[i] = (a0 * T[0] + a1 * T[1] + a2 * T[2]) * sw; }
        g.mesh = mesh; g.alpha = op && op.alpha != null ? op.alpha : 1; g.glow = (gl || 0) + ga; g.glow2 = (op && op.glow2) || 0; g.spill = op && op.spill != null ? op.spill : dis > 0 ? Math.min(1, dis * (op && op.disK != null ? op.disK : 1)) : 0; g.kind = (op && op.kind) || 0; g.wear = 1; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = !(op && op.noInk) && !(g.spill > 0.001);
        (g.alpha < 0.995 ? TRANS : ITEMS).push(g);
        if (mesh.bs) { const bs = mesh.bs, sk = Math.max(Math.hypot(R[0], R[3], R[6]), Math.hypot(R[1], R[4], R[7]), Math.hypot(R[2], R[5], R[8])); if (slo) box(add(T, mv(R, mul(bs, sc))), bs[3] * sc * sk * 1.03 + 0.05);
          else { const b0 = bs[0] * sc, b1 = bs[1] * sc, b2 = bs[2] * sc; BX[0] = T[0] + (R[0] * b0 + R[1] * b1 + R[2] * b2); BX[1] = T[1] + (R[3] * b0 + R[4] * b1 + R[5] * b2); BX[2] = T[2] + (R[6] * b0 + R[7] * b1 + R[8] * b2); box(BX, bs[3] * sc * sk * 1.03 + 0.05); } }
        return g; };
      /* the gait and the body's frame */
      const gal = cl(P.gal || 0), G = gait(P.ph || 0, cl(P.mv || 0), P.gaitK || 1, gal), feet = P.feet, MS = o.inst ? motion(o.inst, P) : null, dyn = MS || ZM, mvv = cl(P.mv || 0);
      for (let i = 0; i < 4; i++) { const q = LGS[i], L = LEGS[i]; if (MS) { const f = MS.F[i]; q.bx = f.bx; q.by = f.by; q.lift = f.lift; q.pitch = f.pitch; q.load = f.ld * (L.f ? 1 : 0.8) * Math.max(0.35, mvv); }
        else { const g2 = G[i], hm = homeOf(i, P); q.bx = hm[0] + g2.dx; q.by = hm[1]; q.lift = g2.lift; q.pitch = g2.pitch; q.load = g2.load; }
        if (air > 0) { const hm = homeOf(i, P), tx = L.f ? hm[0] - 0.7 : hm[0] + 0.9, tz = (L.f ? 2.4 : 2.0) + met * 0.6; q.bx = lerp(q.bx, tx, air); q.by = lerp(q.by, hm[1] * (1 - 0.25 * met), air); q.lift = lerp(q.lift, tz, air); q.pitch = lerp(q.pitch, 1, air); q.load *= 1 - air; } }
      let dip = 0, push = 0, wr = 0, wy = 0, wp = 0; for (let i = 0; i < 4; i++) { const L = LEGS[i], q = LGS[i], lf = cl(q.lift / 0.6) * (1 - air); if (L.f) dip += q.load * 0.14; else push += q.load * 0.06; wr -= lf * L.s * 0.022; wy -= lf * L.s * 0.07; wp += lf * (L.f ? 0.016 : -0.012); }
      const rear = cl(P.rear || 0), crouch = P.crouch || 0, sh = (P.shift || 0) + LF.shift * (1 - mvv) * (1 - rear);
      const gph = P.ph || 0, rock = gal * mvv * (1 - air);   // (the gallop's rocking: the forehand rising as the hinds drive, the body bounding)
      /* (v444 SL) it leans into its turns (the inside shoulder dropping, by the turn's rate and its speed), the spine flexes with the gallop's
         stride (the barrel gathering and stretching), its weight shifts fore and aft at rest, a landing squashes the body (P.squash), the
         Cataclysm shakes it */
      const squash = cl(P.squash || 0), lean = Math.max(-0.14, Math.min(0.14, -dyn.yr * mvv * 0.1)), shX = LF.shiftX * (1 - mvv) * (1 - rear), XSd = XS * (1 + 0.035 * rock * Math.sin(gph + 2.2));
      const pitch = (P.pitch || 0) + dip * 0.11 - push * 0.4 + crouch * 0.06 - rear * 0.42 + (P.stagger || 0) * 0.08 + wp + dyn.sx * 0.07 + rock * 0.06 * Math.sin(gph + 0.6) + met * 0.12 + shX * 0.03 + squash * 0.04, bank = (P.bank || 0) + wr - dyn.sy * 0.06 - sh * 0.035 + lean + 0.006 * LF.shake;
      const lift = (P.lift || 0) + LF.bob - (MS ? dip * 0.35 : dip) + dyn.sz * 1.9 - crouch * 0.55 + rear * 0.55 + rock * 0.32 * (0.5 + 0.5 * Math.sin(gph * 2 + 1.2)) + air * 0.6 + 0.55 + LZ - squash * 0.4;   // (+0.55: the body carried high on long legs)
      const Mb = mm(rx(bank), ry(pitch)), tbo = [(P.dx || 0) + rear * -0.35 + dyn.sx * 0.85 + shX * 0.35, wy + dyn.sy * 0.55 + sh * 0.3, lift];
      const BP = p => add(add(mv(Mb, sub([BODYC[0] + (p[0] - BODYC[0]) * XSd, p[1], p[2]], BODYC)), BODYC), tbo), BR = R => mm(Mb, R);
      const br = LF.breath * 0.014, bry = LF.breath * 0.026 + squash * 0.05, brz = br - squash * 0.07, trem = (heat * 0.012 + cl(P.mech || 0) * 0.006) * Math.sin(t * 61) + 0.018 * LF.shake;   // (the armour's vibration as the reactor nears critical)   (v444 SL: the chest and flanks swelling with each breath)
      const out = { hornTips: [], hornRings: [], hornSegs: [], eyes: [], feet: [], vents: [], jets: [], fparts: [], dorsal: [] };
      /* the torso */
      const mtw = 1 - 0.18 * met;   // (the meteor: armour folded tight)
      put(M.torso, BR([XSd, 0, 0, 0, (1 + bry) * mtw, 0, 0, 0, 1 + brz]), BP([trem, 0, 0]), 1, glow + heat * 0.6, null, 0.4);   // (v444 SL: XSd, bry, brz)
      /* ---- the Heart of Ruin ---- */
      const cp = BP(CORE), co = cl(P.coreOpen || 0), cg = Math.max(0, (P.core == null ? 0.9 : P.core) + LF.core * (1 + heat)), ck = 1 + co * 0.35 + (P.coreBig || 0), rr0 = CORER / 0.74;
      const sMA = MS ? (MS.mA = (MS.mA || 0) + MS.h * (0.3 + 2.4 * cl(P.mech || 0) + 1.5 * co + 2 * heat)) : t * 0.5;
      put(M.star, BR(mm(rz(t * 0.35 + sMA * 0.2), rx(t * 0.13))), cp, ck, cg, { glow2: heat, noInk: true, disK: 0.6, kind: 0 }, 0);
      put(M.cor, BR(rz(-t * 0.5)), cp, ck * (1 + 0.04 * Math.sin(t * 9) * (0.3 + heat)), cg, { alpha: 0.99, noInk: true, glow2: heat, disK: 0.6 }, 0);
      // the lattice cage: two halves that swing open sideways (Furnace Overdrive)
      if (co > 0.05) for (const s of [1, -1]) { const op = co * 1.15; put(M.cage, BR(mm(rz(s > 0 ? -op : Math.PI + op), I3)), add(cp, mv(Mb, [0.05, s * op * 0.35, 0])), ck * 1.0, glow + cg * 0.25, { alpha: 0.98, noInk: true, disK: 0.7 }, 0.02); }
      const ncr = Math.min(CRINGS.length, NCR[k] + (co > 0.3 ? 1 : 0) - (low && k === 3 ? 1 : 0));
      for (let i = 0; i < ncr; i++) { const C = CRINGS[i], ax = norm(add(C.ax, [0, 0.04 * Math.sin(t * 0.4 + i) + co * 0.4 * Math.sin(i * 2.1), 0.04 * Math.cos(t * 0.5 + i) + co * 0.4 * Math.cos(i * 2.1)])), spin = sMA * C.sp * 1.4 + t * C.sp * 0.6 + i * 1.3, Rt = mm(frameZ(ax), rz(spin)), rad = C.R * CORER * (1 + co * (0.45 + i * 0.18) + heat * 0.1);
        put(M.cring[C.m], BR(Rt), cp, rad, glow + cg * 0.35, { kind: i, glow2: cg * 0.5 + heat, noInk: true, disK: 0.75 }, 0.05); }
      if (co > 0.05) for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.785, ca = Math.cos(a), sa = Math.sin(a), op = co * 0.9, rad = 1.08 * rr0 + op * 0.5;   // the clamp arms: they grip the reactor, and swing out as it unfolds
        const Rc = mm(colsR([0, ca, sa], [0, -sa, ca], [1, 0, 0]), ry(-0.3 - op * 0.7)); put(M.clamp, BR(Rc), add(cp, mv(Mb, [-0.25 - op * 0.2, ca * rad, sa * rad])), 0.85 * rr0, glow, null, 0.06); }
      if (co > 0.05) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.52, ca = Math.cos(a), sa = Math.sin(a), op = sstep(i * 0.06, 0.55 + i * 0.07, co), ov = 0.18 * Math.sin(Math.PI * cl((op - 0.6) / 0.4)) * (op > 0.6 ? 1 : 0), rad = 1.18 * rr0;   // the chest plates: hinged at the housing's rim, they open like petals (in turn, with an overshoot)
        const Rp = mm(colsR([0, -sa, ca], [0, ca, sa], [1, 0, 0]), rx(-(0.15 + op * 1.25 + ov))); put(M.cplate, BR(Rp), add(cp, mv(Mb, [-0.05 + op * 0.06, ca * rad, sa * rad])), 0.95 * rr0, glow + op * 0.5, null, 0.32); }
      { const nm = low ? 4 : [0, 6, 8, 10][k]; for (let j = 0; j < nm; j++) { const a = t * (1.2 + j * 0.13) * (1 + co + heat) + j * 2.39, R0 = CORER * (1.9 + 0.2 * (j % 3)) * (1 + co * 0.6), tl = 0.6 + 0.5 * Math.sin(j * 1.7), ca = Math.cos(a), sa = Math.sin(a);   // incandescent motes on orbits
        const off = [0.35 + 0.4 * sa * Math.sin(tl), ca * R0, sa * R0 * Math.cos(tl)]; put(M.emb, I3, add(cp, mv(Mb, off)), 0.05 + 0.025 * (j % 3), 1 + cg, { noInk: true, disK: 0.6 }, 0.03); } }
      box(cp, 2.3 * rr0 + co);
      /* ---- the shoulders: the armour (it lifts off the plasma in the Cataclysm State), L4's under-plate, the floating shards; the haunches ---- */
      const shA = LF.shoulder + (P.mech || 0) * 0.04;
      for (const s of [1, -1]) { const Mi = s > 0 ? I3 : MY, qf = LGS[s > 0 ? 0 : 1], qh = LGS[s > 0 ? 2 : 3], df = qf.bx - LEGS[0].x * XS, dh = qh.bx - LEGS[2].x * XS, ar = 0.02 * LF.armour * lv;
        const vt = vent + 0.15 * cl(P.mech || 0) * Math.sin(t * 13 + s) + 0.2 * heat * (0.5 + 0.5 * Math.sin(t * 19 + s * 2.1)) * (0.6 + 0.4 * LF.flare);   // (Cataclysm: the plates lift off and out, trembling)   (v444 SL: flaring in bursts)
        const sp = BP([SHOULD[0] - df * 0.05, s * (SHOULD[1] + vt * 0.55), SHOULD[2] + vt * 0.45 + shA * 0.3 + qf.lift * 0.08 + ar]);
        put(M.shoulder[k], BR(mm(ry(-df * 0.05 + vt * 0.12), mm(Mi, rx(-shA * 0.5 - qf.lift * 0.05 - vt * 0.35)))), sp, 1.05 * mtw, glow + vt * 0.6, null, 0.5);
        if (k >= 2) put(M.spad, BR(mm(Mi, rx(-0.25 - vt * 0.2))), BP([SHOULD[0] - 0.9, s * (SHOULD[1] + 0.2 + vt * 0.3), SHOULD[2] - 0.75 + vt * 0.2]), 1.1, glow, null, 0.5);
        out.vents.push(scr(BP([1.6, s * 1.5, 8.6]))); out.jets.push({ p: scr(BP([1.2, s * 1.6, 9.3])), q: scr(BP([0.4, s * 2.2, 11.6])) });
        put(M.haunch, BR(mm(ry(-dh * 0.05), mm(Mi, rx(-qh.lift * 0.05 - vent * 0.2)))), BP([-2.6 - dh * 0.035, s * (1.2 + vent * 0.25), 8.25 + qh.lift * 0.08 + ar * 0.7 + vent * 0.2]), 0.95, glow, null, 0.45);
        const nfp = NFP[k] - (low && k === 3 ? 1 : 0);
        for (let j = 0; j < nfp; j++) { const F = FPART[j], ft = LF.fpart * (0.8 + j * 0.15) + F.p, sp2 = 1 + vent * 0.45 + cl(P.crown || 0) * 0.5, off = [F.o[0] * sp2 + 0.12 * Math.sin(ft), s * F.o[1] * sp2, F.o[2] * sp2 + 0.16 * Math.sin(ft * 1.3) + vent * 0.4];
          const pp = BP(add([SHOULD[0] - 1.6, 0, SHOULD[2] - 1.9], off)); put(M.fpart, BR(mm(Mi, mm(rz(0.25 * Math.sin(ft * 0.7) - 0.3), rx(0.4 + 0.2 * Math.sin(ft))))), pp, F.s * (1 - 0.6 * met), glow + 0.3 + vent * 0.6, { disK: 1.2 }, 0.55); out.fparts.push(scr(pp)); }
      }
      /* ---- the halo of crescents: gold scythes rising off the withers and sweeping back (they fan wider with P.dorsal and the crown), the chains,
         thin gold arcs (rings of ruin) turning round the upper body ---- */
      { const fanD = cl(P.dorsal || 0) * 0.45 + cl(P.crown || 0) * 0.5 + vent * 0.2, nsc = NSC[k] - (low && k === 3 ? 1 : 0);
        for (const s of [1, -1]) { const Mi = s > 0 ? I3 : MY;
          for (let j = 0; j < nsc; j++) { const Sc = SCY[j], x = 1.9 - j * 0.42, root = bodyPt(x, s > 0 ? Math.PI / 2 - 0.42 : Math.PI / 2 + 0.42, -0.05), sway = 0.035 * Math.sin(t * 0.9 + j * 1.3) * lv;
            put(M.scythe, BR(mm(Mi, mm(rx(-(Sc.o + fanD * (0.6 + 0.2 * j))), ry(-Sc.a + 0.35 - met * 1.1 + sway - fanD * 0.25)))), BP(root), Sc.s * (1 + 0.1 * (k - 1)) * (1 - 0.3 * met), glow + 0.25 + fanD, { disK: 1.25 }, 0.62); }
        }
        const nar = NARC[k] - (low ? 1 : 0);
        for (let j = 0; j < nar; j++) { const A = ARCS[j], spin = t * (0.18 + 0.07 * j) * (j % 2 ? -1 : 1) + j * 2.1 + cl(P.crown || 0) * 1.5, Ra = A.R * (1 + 0.25 * cl(P.crown || 0) + 0.1 * vent);
          put(M.arc, BR(mm(rx(A.tx), mm(ry(A.tz * 0.3), rz(spin)))), BP([-0.2, 0, A.z]), Ra, glow + 0.5 + fanD, { noInk: true, disK: 1.3 }, 0.97); } }
      /* ---- the dorsal blades: a row along the spine (fanning back and rising with P.dorsal), side blades from L4 ---- */
      const dsl = cl(P.dorsal || 0), nd = NDB[k];
      for (let i = 0; i < nd; i++) { const Bd = DBL[i], x = Bd.x, top = bodyPt(x, Math.PI / 2, 0), wob = 0.03 * Math.sin(t * 1.3 + i) * lv, rise = dsl * (0.25 + 0.08 * i), fold = met * 0.9;
        put(M.dblade, BR(ry(-0.15 + rise * 0.6 - wob + fold)), BP(add(top, [0, 0, -0.1 + dsl * 0.25])), Bd.s * (1 + dsl * 0.25), glow + dsl * 0.8 + heat * 0.4, null, 0.58); if (i < 4) out.dorsal.push(scr(BP(add(top, [-0.5 * Bd.s, 0, 1.1 * Bd.s])))); }
      for (let i = 0; i < NDS[k]; i++) { const Bd = DSIDE[i]; for (const s of [1, -1]) { const top = bodyPt(Bd.x, s > 0 ? 1.15 : Math.PI - 1.15, -0.05), fan = 0.35 + dsl * 0.7;
        put(M.dblade, BR(mm(rx(s * fan), ry(-0.2 + dsl * 0.3 + met * 0.8))), BP(top), Bd.s * (1 + dsl * 0.2), glow + dsl * 0.6, null, 0.6); } }
      /* ---- (concept2) the flame ribbons streaming back from the shoulders and flanks, swaying, more and longer from L4 ---- */
      if (!low || k > 1) { const RIB = [{ x: 2.4, a: 0.9, v: 0 }, { x: 0.6, a: 1.2, v: 1 }, { x: -2.4, a: 1.0, v: 2 }, { x: 1.6, a: 1.35, v: 2 }, { x: -1.0, a: 0.75, v: 0 }], nr = k > 1 ? 5 : 3, rl = [1, 1.6, 2.0, 1.85][k] * (1 + 0.25 * heat) * (1 + 1.3 * met);   // (the meteor: its flames streaming behind it as a long burning tail)
        for (let j = 0; j < nr; j++) { const Rb = RIB[j]; for (const s of [1, -1]) { const Mi = s > 0 ? I3 : MY, rp = 0.07 * Math.sin(t * 4.3 + j * 1.9 + s * 0.7) * (1 + mvv + heat), sw = Math.sin(t * (1.6 + 0.3 * j) + j * 1.7 + s) * 0.14 + rp, sw2 = Math.sin(t * 1.1 + j * 2.3 - s) * 0.1 + rp * 0.6, root = bodyPt(Rb.x, Math.PI / 2 - Rb.a, -0.05);   // (v444 SL: rp, a quicker ripple, wilder at speed and in the Cataclysm)
          put(M.rib[Rb.v], BR(mm(Mi, mm(rz(-0.3 - sw2 - 0.15 * mvv), ry(-0.05 + sw * 0.6 + 0.1 * mvv)))), BP([root[0], s * root[1], root[2]]), rl * (0.9 + 0.1 * Math.sin(t * 2.3 + j) + 0.05 * Math.sin(t * 5.1 + j * 2.7 + s)), glow + 0.6 + heat, { alpha: 0.99, noInk: true, disK: 1.3 }, 0.6); } } }
      /* ---- the neck and head: low and forward; the head dips (P.head +), looks about, leads into turns, steadies its gaze ---- */
      const lead = Math.max(-0.35, Math.min(0.35, dyn.yr * 0.3)), hd = (P.head || 0) + LF.head + LF.neckH * (1 - mvv) - wp * 1.2 - dyn.sx * 0.12 + rock * 0.08 * Math.sin(gph), look = (P.look || 0) + LF.look + LF.neckL * (1 - mvv) + lead - bank * 0.8, stg = P.stagger || 0;
      const tilt = LF.neckL * 0.7 * (1 - mvv) + 0.25 * lean;   // (v444 SL: the head cocked as it glances about, and into a turn)
      const HP = add(HEADP, [0.3 * hd + 0.4 * met, -wy * 0.6 - sh * 0.15, -0.75 * hd + 0.1 * stg - dyn.sz * 1.1 + met * 0.5 + 0.06 * LF.breath]), Rh = mm(rz(look * 0.6), mm(rx(-bank * 0.7 + tilt), ry(0.14 + 0.45 * hd - 0.25 * stg - 0.15 * met))), hpW = BP(HP), RhW = BR(Rh), RhS = mm(Rh, scl3(HS));
      for (let i = 0; i < 5; i++) { const u = (i + 0.5) / 5, a = NECK0, b = add(HP, mv(RhS, [-0.55, 0, 0.1])), m3 = lerp3(a, b, u); m3[2] += 0.18 * Math.sin(Math.PI * u) * (1 - hd * 0.5);
        const dirN = norm(sub(b, a)), Rv = mm(rz(look * 0.6 * u), ry(-Math.atan2(dirN[2], dirN[0]))); put(M.vert, BR(Rv), BP(m3), 2.0 - u * 0.45, glow, null, 0.72); }
      put(M.head, RhW, hpW, HS, glow, { glow2: (P.eye == null ? 1 : P.eye) + heat * 0.5 }, 0.8);
      { const cr = Math.max(-1.2, Math.min(1, LF.crest + (P.crest || 0) - 0.35 * met));   // (v444 SL) the crest blades turned at their root: flicks, laid back, raised
        for (const s of [1, -1]) put(M.crest, BR(mm(Rh, mm(s > 0 ? I3 : MY, mm(ry(0.5 * cr), rz(-0.22 * cr))))), BP(add(HP, mv(RhS, [CRR[0], s * CRR[1], CRR[2]]))), HS, glow, null, 0.8); }
      const jaw = cl((P.jaw || 0) + LF.jaw + LF.snort * 0.15 + 0.04 * (1 - met));   // (the jaw closed at rest)
      for (const s of [1, -1]) { const Mi = s > 0 ? I3 : MY; put(M.jaw, BR(mm(Rh, mm(Mi, mm(rx(-jaw * 0.18), ry(jaw * 0.68))))), BP(add(HP, mv(RhS, [-0.1, s * jaw * 0.05, -0.42]))), HS, glow, null, 0.8); }
      if (jaw > 0.04) put(M.maw, BR(mm(Rh, rx(t * 2.4))), BP(add(HP, mv(RhS, [1.3, 0, -0.5]))), (0.75 + jaw * 0.45) * HS, 0.8 + jaw * 2.2 + glow + heat, { noInk: true }, 0.8);
      box(hpW, 3.2 * HS);
      out.eyes = [1, -1].map(s => scr(BP(add(HP, mv(RhS, [1.08, s * 0.6, 0.3])))));
      out.mouth = scr(BP(add(HP, mv(RhS, [2.4, 0, -0.55])))); out.head = scr(hpW); out.nose = scr(BP(add(HP, mv(RhS, [3.3, 0, -0.3]))));
      /* ---- the Celestial Horns ---- */
      const hn = cl((P.horn || 0) + LF.horn + heat * 0.3), hk = HK[k] * (1 + 0.08 * cl(P.crown || 0)), nseg = NHF[k], uEnd = nseg / NHS, crw = cl(P.crown || 0), dr = Math.max(cl(P.drill || 0), met * 0.85), hfw = Math.max(cl(P.hornFwd || 0), dr);
      const hSpin = (P.hornSpin || 1) + hn * 2 + heat * 1.5; if (MS) MS.hA = (MS.hA || 0) + MS.h * hSpin; const hA = MS ? MS.hA : t * hSpin;
      for (const s of [1, -1]) {
        const Mi = s > 0 ? I3 : MY, mount = add(HP, mv(RhS, [HM[0], s * HM[1], HM[2]]));
        // the horn's own turn about its mount: forward for a charge, a drill or the meteor (its curl swinging ahead of the face), lifted and spread for the crown
        const Rhn = mm(Rh, mm(Mi, mm(rz(0.06 - hfw * 0.55 + crw * 0.25), mm(rx(-0.1 + crw * 0.45 - dr * 0.25), ry(-0.15 + LF.hornTurn + hfw * 1.05 - crw * 0.5)))));
        const H3 = p => BP(add(mount, mv(Rhn, mul(sub(p, HM), hk)))), HR3 = R => BR(mm(Rhn, R));
        put(M.hcore, HR3(I3), H3([0, 0, 0]), hk, 0.8 + hn * 1.8 + (P.hornHeat || 0) * 1.5 + glow + heat, { noInk: true, kind: 1, glow2: (P.hornHeat || 0) + heat }, 0.94);
        for (let i = 0; i < nseg; i++) { const S = HSEG[i], ui = i / Math.max(1, nseg - 1);
          // each segment: its own small turn (life), the shells parting (horn: out along its normal, twisting apart), a crown's spread
          // (thrown out from the spiral's axis, turned to face out), the drill's (turned to lie along the horn's forward line)
          const tw = (0.045 * lv + 0.08 * cl(P.mech || 0) + 0.05 * heat) * Math.sin(t * (0.4 + 0.08 * i) * (1 + 2 * cl(P.mech || 0)) + i * 1.9 + s) + hn * 0.35 * Math.sin(hA * 1.3 + i * 0.9);
          const opn = 0.06 + hn * (0.55 + 0.25 * Math.sin(i * 1.7)) + crw * 0.9, sep = hornR(S.um) * (0.45 * opn + 0.6 * crw * (0.5 + ui));
          const crOff = crw > 0 ? mul(norm(sub(S.c, add(HC, mul(HA, hAdv(S.um))))), crw * (0.35 + 0.5 * ui)) : [0, 0, 0], drOff = dr > 0 ? mul(S.t, dr * 0.18 * i) : [0, 0, 0];
          for (const half of [0, 1]) { const sg = half ? -1 : 1, Rs = mm(axisR(S.t, tw + sg * opn * 0.55), I3), piv = S.c, T = add(add(add(sub(piv, mv(Rs, piv)), mul(S.n, sg * sep)), crOff), drOff);
            put((half ? M.hin : M.hout)[i], HR3(Rs), H3(T), hk, glow + hn * 0.9 + crw * 0.8 + heat * 0.5 + (P.hornHeat || 0) * ui, { disK: 1.15 }, 0.9 + 0.08 * ui); }
          if (i % 2 === 0 && i < nseg - 1) { const f = slo ? hornF(S.u1) : S.f1 || (S.f1 = hornF(S.u1)); if (slo) { const Rr = mm(frameZ(f.T), rz(hA * (1.4 + 0.3 * i) * (i % 4 ? -1 : 1) + i)); void Rr; } const ro = add(add(f.P, crOff), drOff);   // (v444 SL: the joint's frame fixed, made once; the ring's turn no longer worked out: nothing draws it)
            out.hornRings.push(scr(H3(ro))); }   // (concept2: no bands on the horn: the joints' places still given)
          if (i % 3 === 1) out.hornSegs.push(scr(H3(add(S.c, crOff))));
        }
        { const f = slo ? hornF(uEnd) : TIPF[nseg] || (TIPF[nseg] = hornF(uEnd)), crOff = crw > 0 ? mul(norm(sub(f.P, add(HC, mul(HA, hAdv(uEnd))))), crw * 0.85) : [0, 0, 0], tp = add(add(f.P, crOff), mul(f.T, dr * 0.18 * nseg)), Rt = colsR(f.T, f.N, f.Bn);
          put(M.htip, HR3(Rt), H3(add(tp, mul(f.T, -0.08))), hornR(uEnd) * 1.55 * hk / 0.5 * 0.5, glow + hn + (P.hornHeat || 0) * 2 + heat, { glow2: (P.hornHeat || 0) + heat, disK: 1.2 }, 0.99); out.hornTips.push(scr(H3(add(tp, mul(f.T, hornR(uEnd) * 1.3))))); }
        box(H3(slo ? hornP(0.45) : HP45 || (HP45 = hornP(0.45))), 2.2 * hk);
      }
      /* the crown (L7: a gold coronet over the brow) */
      if (false) { const hr = [0, 0.95, 1.0, 1.05][k] * (1 + 0.3 * cl(P.crown || 0)); put(M.halo, BR(mm(ry(Math.PI / 2 - 0.12), rz(t * 0.25))), BP(add(HP, [-1.1 - 0.4 * met, 0, 1.35 + 0.3 * cl(P.crown || 0)])), hr * (1 - 0.5 * met), glow + 0.5, { noInk: true, disK: 1.3 }, 0.9); }   // (the spiked halo over its head, turning)
      for (const s of [1, -1]) put(M.hcurl, BR(mm(Rh, s > 0 ? I3 : MY)), hpW, HS * (k > 1 ? 1.12 : 1), glow + 0.3 + hn * 0.6 + heat * 0.5, { disK: 1.15 }, 0.82);   // (concept2: the smaller curls low on the cheeks)
      if (k === 3) put(M.crown, BR(mm(Rh, mm(ry(-0.25), rz(Math.PI)))), BP(add(HP, mv(RhS, [0.15, 0, 1.15]))), 0.62 * HS, glow + 0.4, null, 0.85);
      /* ---- the tail: a chain lagging behind the body (its spring and the motion's chain), its blade ---- */
      const Sp = o.inst && o.inst.smS ? o.inst.smS : null, tsw = (P.tail || 0) + LF.tail + (Sp ? Sp[0] : 0), tup = LF.tailY + (Sp ? Sp[2] : 0) + met * 0.8;
      { const n = 13;
        if (MS && MS.h > 0) { const d0 = tsw - Math.max(-0.5, Math.min(0.5, dyn.yr * 0.45)) + dyn.sy * 0.7, d1 = tup - dyn.sz * 1.8 + dyn.sx * 0.35; for (let i = 0; i < n; i++) { const r2 = Math.min(1, MS.h * (11 - i * 0.75)); MS.tail[i] += ((i ? MS.tail[i - 1] : d0) - MS.tail[i]) * r2; MS.tailP[i] += ((i ? MS.tailP[i - 1] : d1) - MS.tailP[i]) * r2; } }
        const tA = i => (MS ? MS.tail[i] : tsw), tP = i => (MS ? MS.tailP[i] : tup);
        // (long and curling, as the concept: out and down from the rump, then curling back up at its end)
        let p = TAIL0, R = mm(rz(tA(0) * 0.25), ry(-0.35 - tP(0) * 0.35));
        for (let i = 0; i < n; i++) { const sc = 2.7 * (1 - i * 0.062); put(M.tseg, BR(R), BP(p), sc, glow + heat * 0.3, null, 0.36); p = add(p, mv(R, [-0.33 * sc, 0, 0])); const j = Math.min(n - 1, i + 1), cu = i < 5 ? -0.06 : (0.03 + 0.03 * (LF.curl - 0.5)) * (i - 5) /* (v444 SL: the end's curl tightening and opening slowly) */; R = mm(R, mm(rz(tA(j) * 0.2 + 0.08 * Math.sin(t * 1.1 - i * 0.6) * lv), ry(cu - tP(j) * 0.08))); }
        put(M.ttip, BR(R), BP(p), 1.6, glow + 0.2, null, 0.38); out.tailTip = scr(BP(p)); box(BP(p), 1.8);
        if (!low || k > 1) for (const j of [0, 1]) put(M.rib[j ? 2 : 1], BR(mm(R, mm(rx((j ? -1 : 1) * 0.6 + 0.2 * Math.sin(t * 1.7 + j)), ry(0.15 * Math.sin(t * 1.3 + j * 2))))), BP(p), [0.9, 1.15, 1.45, 1.35][k] * (1 + 1.3 * met), glow + 0.6 + heat, { alpha: 0.99, noInk: true, disK: 1.3 }, 0.6); }   // (concept2: flames streaming off the tail's end)
      /* ---- the legs: hips on the body, hooves planted (the motion), the cannon's lean (curled in the swing), the knee by IK; the actuators ---- */
      for (let i = 0; i < 4; i++) {
        const L = LEGS[i], s = L.s, Mi = s > 0 ? I3 : MY, H = BP([L.x, s * L.hy, L.z]), g2 = LGS[i], fo = feet && feet[i] ? feet[i] : null, hh = HOOFH * L.hs;
        let fx = g2.bx + (fo ? fo[0] : 0), fz = g2.lift + (fo ? fo[2] : 0); if (L.f && rear > 0) { fx += rear * 1.2; fz = Math.max(fz, rear * 2.6); }
        const footY = g2.by + s * (fo ? fo[1] : 0), Fh = [fx, footY, hh + fz];
        const flex = cl(g2.pitch), ca = L.ca + (L.f ? 1.25 : -0.55) * flex + (P.crouch || 0) * (L.f ? 0.06 : -0.12), J = add(Fh, [Math.sin(ca) * L.LC, 0, Math.cos(ca) * L.LC]);
        const IK = ik(H, J, L.L1, L.L2, L.kd), Rt = segR(H, IK.K), Rs = segR(IK.K, IK.A), Rc = segR(IK.A, Fh);
        const W1 = [L.w, 0, 0, 0, L.w, 0, 0, 0, L.L1 / LMESH], W2 = [L.w, 0, 0, 0, L.w, 0, 0, 0, L.L2 / LMESH], W3c = [L.w, 0, 0, 0, L.w, 0, 0, 0, len(sub(Fh, IK.A)) / LMESH];
        put(M.thigh, mm(mm(Rt, W1), Mi), H, 1, glow, null, 0.15); put(M.shin, mm(mm(Rs, W2), Mi), IK.K, 1, glow, null, 0.13); put(M.cannon, mm(mm(Rc, W3c), Mi), IK.A, 1, glow, null, 0.11);
        const airH = sstep(0.0, 0.2, fz), hoofR = airH > 0.001 ? mm(ry(-(L.f ? 0.9 : 0.4) * flex * airH), Mi) : Mi; put(M.hoof, hoofR, Fh, L.hs, glow, null, 0.1);
        // the actuator: from the upper leg's back to the lower leg's: a piston that compresses as the joint folds
        const a1 = add(H, mv(mm(Rt, W1), [-0.5 * -L.kd, s * 0.4, -0.45])), a2 = add(IK.K, mv(mm(Rs, W2), [-0.35 * -L.kd, s * 0.36, -1.05])), dv = sub(a2, a1), dl = len(dv), dn = norm(dv), Rp = frameZ(dn), Rx = [Rp[2], Rp[0], Rp[1], Rp[5], Rp[3], Rp[4], Rp[8], Rp[6], Rp[7]], pw = L.w * 0.8;
        if (false) put(M.pS, mm(Rx, [dl * 0.56 / pw, 0, 0, 0, 1, 0, 0, 0, 1]), a1, pw, glow, null, 0.14); if (false) put(M.pR, mm(Rx, [dl * 0.62 / pw, 0, 0, 0, 1, 0, 0, 0, 1]), add(a2, mul(dn, -dl * 0.62)), pw, glow, null, 0.14);
        out.feet.push(scr([fx, footY, 0])); box(H, 1.2 * L.w); box(Fh, 1.0 * L.hs); box(IK.K, 0.8);
      }
      /* ---- L7: two great celestial rings floating round it (thrown wide by P.celest), and the meteor's plasma shell ---- */
      if (k === 3 && !low) { const ce = cl(P.celest || 0); for (let j = 0; j < 3; j++) { const Rg = mm(rx(1.3 - 0.22 * j + 0.06 * Math.sin(t * 0.4 + j)), mm(ry(0.35 * (j - 1)), rz(t * (0.22 + j * 0.08) * (j % 2 ? -1 : 1)))), cc = BP([0.6, 0, 7.9 + 0.3 * j + ce * 0.8]);   // (L7, the Starforged Ram: golden rings orbiting round its body)
        put(M.lring, BR(Rg), cc, (3.4 + j * 0.45) * (1 + ce * 0.3), glow + 0.6 + ce, { alpha: 0.99, noInk: true, kind: j, disK: 1.3 }, 0.97); box(cc, 7 + ce * 2); } }
      const shl = cl(P.shell || 0); if (shl > 0.01) { const sc = BP([1.6, 0, 8.4]); put(M.shellM, BR(mm(ry(0.12), [6.4, 0, 0, 0, 3.0, 0, 0, 0, 3.3])), sc, 1, 1 + heat, { alpha: 0.99 * shl, noInk: true, glow2: shl }, 1); box(sc, 6); }
      if (!(bx1 > bx0) || !ITEMS.length) return null;
      for (const g2 of TRANS) ITEMS.push(g2);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__SM_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : RES.k) * (typeof GQ !== 'undefined' ? GQ.animaK() : 1);   /* (v439 SP: the visual quality's factor in a fight, 3/4 under Fewer effects) */
      bx0 = Math.floor(bx0) - 3; by0 = Math.floor(by0) - 3; bx1 = Math.ceil(bx1) + 3; by1 = Math.ceil(by1) + 3;
      /* (v444 SL) the pass covers only the part of its box on the canvas (a boss's tail or a crescent's flight beyond the screen's edge is
         never drawn), at most PXB[the visual quality] GL pixels in a fight (the pass's resolution adapted to its box), and keeps its GL
         canvas while the box wanders (no reallocation each frame) */
      let rx0 = bx0, ry0 = by0, rx1 = bx1, ry1 = by1, vis = true; if (!slo) { const vb = visBox(c); if (vb) { rx0 = Math.max(rx0, vb[0]); ry0 = Math.max(ry0, vb[1]); rx1 = Math.min(rx1, vb[2]); ry1 = Math.min(ry1, vb[3]); vis = rx1 > rx0 + 1 && ry1 > ry0 + 1; } }
      let W = Math.ceil((rx1 - rx0) * dev), H = Math.ceil((ry1 - ry0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      if (!slo) { const bud = budget(0); if (W * H > bud) { const q = Math.sqrt(bud / (W * H)); W = Math.max(2, Math.ceil(W * q)); H = Math.max(2, Math.ceil(H * q)); } }
      const bw = rx1 - rx0, bh = ry1 - ry0;
      const S = { px: PXW, py: PYW, pd: PDW, cl: [2 * kk / bw, 2 * (X0 - rx0) / bw - 1, -2 * kk / bh, 1 - 2 * (Y0 - ry0) / bh], v: PDW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low, rim: o.rim || RIMC, amb: o.amb || AMBC, t: nowMs() / 1000 % 1000,
        outline: o.ink === false || low ? 0 : Math.max(0.6, 0.7 * (W / bw)), outlineCol: OUTC, outlineBias: 0.0025, clip: null, keep: !slo };
      const t0 = nowMs(), cvs = vis ? GLM.render(W, H, S, ITEMS) : null; if (!cvs && vis) return null;
      const alp = o.alpha == null ? 1 : o.alpha; if (cvs && alp > 0.004) { c.save(); c.globalAlpha = Math.min(1, alp); c.drawImage(cvs, 0, 0, W, H, rx0, ry0, bw, bh); c.restore(); }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; if (!GLM.soft && STATS.n > 20) RES.k = STATS.ms > 7 ? Math.max(0.6, RES.k - 0.02) : STATS.ms < 3.5 ? Math.min(1, RES.k + 0.01) : RES.k; STATS.items = ITEMS.length; STATS.W = W; STATS.H = H;
      out.bb = [bx0, by0, bx1, by1]; out.unit = K * (o.scale || 1); out.core = scr(cp); out.coreR = CORER * ck * out.unit; out.back = scr(BP([0.6, 0, 9.8])); out.top = scr(BP([1.2, 0, 13]));
      out.chest = scr(BP([CORE[0], 0, CORE[2] - 1.4])); out.ground = [X0, Y0]; out.coreVis = cl((Math.sin(P.yaw || 0) * CE + 0.5) / 0.7 + 0.15); out.steps = MS ? MS.steps : null; out.lifts = LGS.map(q2 => q2.lift);
      out.flankWin = [1, -1].map(s => scr(BP(bodyPt(-1.1, s > 0 ? 0 : Math.PI, 0))));
      return out;
    } catch (e) { fail(e); return null; }
  }
  /* AnimaArt's route: the Anima at (x, y) (its feet), size px tall, at time t; o.smP (a pose from the fight) or the form's idle */
  function drawAnima(c, k, x, y, size, t, o) {
    o = o || {}; if (!ensure()) return false;
    const ip = o.inst && o.inst.smP, P = o.smP || ip || idlePose(k, t), fk = o.fk != null ? o.fk : o.flip ? -1 : 1; if (!o.smP && !ip) P.yaw = fk < 0 ? Math.PI - 0.62 : 0.62;
    const K = size / HEIGHT[k];
    const r = draw(c, { X: x, Y: y, K, P, k: P.k || k, alpha: o.alpha == null ? 1 : o.alpha, inst: o.inst });
    if (o.out) o.out.r = r; if (o.inst && ip) o.inst.smOut = { r };
    if (r && !ip && !o.smP && o.light !== false && size >= 60) coreLight(c, r, P, o.alpha == null ? 1 : o.alpha);
    return !!r || (P.asm != null && P.asm < 0.999 && !NOGL);   // (nothing assembled yet is still this model: never the old art in its place)
  }
  /* the Heart of Ruin's light on the shared GPU painter (FGFX 299), for stills and menus */
  function coreLight(c, r, P, al) {
    try { const N = typeof self !== 'undefined' && self.NIDHOGG_MOVES, F = N && N.FGFX; if (!F || !F.usable()) return false;
      const R = Math.max(r.coreR * 3.4, 6);
      F.flush(c); const Q = F.begin(c, null); Q.quad(299, r.core[0], r.core[1], R, 0, 0, R, '#FF5A2A', al * (r.coreVis == null ? 1 : r.coreVis), r.coreR / R, cl(P.heat || 0), 1.15 + 0.25 * cl((P.core || 0.9) - 0.6));
      for (const e of r.eyes) Q.glow(e[0], e[1], r.unit * 0.55, '#FF2A1E', 0.5 * al);
      F.flush(c); F.begin(c, null); return true; } catch (e) { return false; }
  }
  /* effect meshes in screen space (one GLM pass): list of { m: 'rock' | 'spire' | 'frag' | 'cres' | 'lring', X, Y (screen px: a spire's
     foot, else its centre), s (px a model unit), yaw, tilt, lean, a (alpha), gl, g2, dis, kind, z (depth: larger nearer; default Y),
     h (a spire's rise 0..1) } */
  const SV = [0, 0, 1], SUP = [0, -1, 0], SLK = norm([-0.45, -0.7, 0.55]), SLS = norm([-0.2, -0.85, 0.5]), SLR = norm([0.65, 0.45, -0.2]), PX2 = [1, 0, 0], PY2 = [0, 1, 0], PD2 = [0, 0, 1];
  const CAM = [1, 0, 0, 0, SE, -CE, 0, CE, SE];
  function drawParts(c, list, o) {
    const d = data(); if (!d.ready || NOGL || !list || !list.length) return false; o = o || {};
    try { ITEMS.length = 0; TRANS.length = 0; NP = 0; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const M = D.M;
      const box = (x, y, r) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
      const put = (mesh, R, T, al, gl, g2, dis, kind) => { const g = item(); for (let i = 0; i < 3; i++) { g.R0[i] = R[i * 3] * 0.01; g.R1[i] = R[i * 3 + 1] * 0.01; g.R2[i] = R[i * 3 + 2] * 0.01; g.T[i] = T[i] * 0.01; }
        g.mesh = mesh; g.alpha = al; g.glow = gl || 0; g.glow2 = g2 || 0; g.spill = dis || 0; g.kind = kind || 0; g.wear = 1; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = !(dis > 0.001) && mesh !== M.cres && mesh !== M.lring; (al < 0.995 ? TRANS : ITEMS).push(g); };
      for (const e of list) {
        const s = e.s, al = e.a == null ? 1 : e.a; if (!(al > 0.01) || !(s > 0.05)) continue;
        const Rb = mm(CAM, mm(rx(e.tilt || 0), mm(ry(e.lean || 0), rz(e.yaw || 0)))), zz = e.z == null ? e.Y : e.z;
        const R = sc => Rb.map(v => v * s * sc);
        if (e.m === 'spire') { const h = cl(e.h == null ? 1 : e.h), sink = (1 - h) * 2.4, v = mv(Rb, [0, 0, -sink]); put(M.spire, R(1), [e.X + v[0] * s, e.Y + v[1] * s, zz + v[2] * s], al, e.gl, e.g2, e.dis); box(e.X, e.Y - s * 1.2, s * 2.4); continue; }
        const mesh = M[e.m === 'cres' ? 'cres' : e.m === 'lring' ? 'lring' : e.m === 'frag' ? 'frag' : 'rock']; if (!mesh) continue;
        put(mesh, R(1), [e.X, e.Y, zz], e.m === 'cres' || e.m === 'lring' ? Math.min(0.99, al) : al, e.gl, e.g2, e.dis, e.kind || 0); box(e.X, e.Y, s * (mesh.bs ? mesh.bs[3] + len(mesh.bs) : 2) * 1.05);
      }
      if (!(x1 > x0) || !(ITEMS.length + TRANS.length)) return false; for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__SM_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (o.res || (lowFx() ? 0.6 : 0.85)) * (typeof GQ !== 'undefined' ? GQ.partsK() : 1);   /* (v439 SP) */
      x0 = Math.floor(x0) - 2; y0 = Math.floor(y0) - 2; x1 = Math.ceil(x1) + 2; y1 = Math.ceil(y1) + 2;
      const slo = SLO(); if (!slo) { const vb = visBox(c); if (vb) { x0 = Math.max(x0, vb[0]); y0 = Math.max(y0, vb[1]); x1 = Math.min(x1, vb[2]); y1 = Math.min(y1, vb[3]); if (!(x1 > x0 + 1 && y1 > y0 + 1)) return true; } }   // (v444 SL: as the model's pass: only what is on the canvas, a budget, the GL canvas kept)
      const bw = x1 - x0, bh = y1 - y0;
      let W = Math.ceil(bw * dev), H = Math.ceil(bh * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      if (!slo) { const bud = budget(1); if (W * H > bud) { const q = Math.sqrt(bud / (W * H)); W = Math.max(2, Math.ceil(W * q)); H = Math.max(2, Math.ceil(H * q)); } }
      const S = { px: PX2, py: PY2, pd: PD2, cl: [200 / bw, -2 * x0 / bw - 1, -200 / bh, 1 + 2 * y0 / bh], v: SV, lk: SLK, ls: SLS, lr: SLR, up: SUP, low: lowFx(), rim: RIMC, amb: AMBC, t: nowMs() / 1000 % 1000, outline: lowFx() ? 0 : Math.max(0.5, 0.6 * (W / bw)), outlineCol: OUTC, outlineBias: 0.002, keep: !slo };
      const cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return false; c.save(); c.globalAlpha = o.alpha == null ? 1 : o.alpha; c.drawImage(cvs, 0, 0, W, H, x0, y0, bw, bh); c.restore(); return true;
    } catch (e) { fail(e); return false; }
  }
  if (typeof window !== 'undefined') setTimeout(() => { try { warm(); } catch (e) {} }, 1700);   // (prepared at load, in idle time)
  return { usable, warm, ensure, step, release, gpuCount, draw, drawAnima, drawParts, coreLight, idlePose, life, gait, footfalls, springs, motion, profile, RES, STATS, MT, WS, HEIGHT, STRIDE, LEGS, XS, CORE, BODYC, NHF, HK,
    swingOf, legOff, ready: () => !!(D && D.ready), get up() { return !!(D && D.up); }, get nv() { return D ? D.nv : 0; }, get off() { return NOGL; } };
})();
if (typeof self !== 'undefined') self.SAMAEL_GL = SAMAEL_GL;
