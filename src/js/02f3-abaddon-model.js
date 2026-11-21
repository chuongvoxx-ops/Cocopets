/* ---------- (v418 AB) Abaddon, The Eternal Moonlight: the Cancer Anima as a real 3D model on GLM ----------
   An ancient biomechanical lunar god (the user's concept, 2026-11-19): a narrow floating porcelain-and-obsidian torso,
   a smooth pointed faceless mask with a thin sapphire eye slit, twelve orbital halo rings turning on their own axes,
   folding ivory crescent carapace wings, two telescoping mechanical arms ending in giant crescent claws, a transparent
   chest reactor (the Lunar Heart: a small moon inside swirling water under a glass shell), hanging segmented tendrils and
   a long lower spine-blade with a light channel. Gilded trims, kintsugi veins, engraved runes and sapphire channels are
   done in its materials (GLM ids 190-209, 20k5uz).
   Everything is procedural geometry built once (in idle-time slices after load, or on first need) into GLM meshes:
   crescent plates are thick curved shells with rounded bevelled rims, each side a separate mesh drawn mirrored for the
   left. It is posed every frame from a pose P (see idlePose; 20g2-abaddon-moves.js drives it in a fight): unfolding
   (open: 0 the sealed lunar shell .. 1 the full god), wing spread / fold, arms that swing, raise and telescope, claws that
   open, a heart that glows, darkens (the black moon) or leaves the chest, rings that speed up or align into one glyph,
   tendrils that sway with inertia (a spring each, kept on the instance), banking and stagger.
   The three forms are the same being: Sealed Moonshell (k 1: the shell nearly closed, 4 rings, 4 tendrils, small claws),
   Crescent Warden (k 2: half unfolded, 8 rings, 6 tendrils, two wing layers) and the Eternal Moonlight (k 3: everything).
   draw(c, o) renders it at its screen size on the GPU (device pixels, an ink outline) and lays the image on the canvas;
   it returns the screen points the effects need. AnimaArt.draw routes 'cancer' here (drawAnima) when usable(), else to
   the cel-shaded 2D model of the same design (02f2 MODELS.cancer).
   Real-GPU WebGL only: a software rasteriser draws the 2D model unless window.__AB_GL = 1 or __NG_GL = 1 (the tests);
   window.__AB_GL = 0 turns it off. Memory: ~45k vertices (~2 MB of buffers) for every part. */
const ABADDON_GL = (() => {
  const TAU = Math.PI * 2, EL = 0.62, SE = Math.sin(EL), CE = Math.cos(EL);
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  /* 3x3 turns, row major */
  const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1], MX = [-1, 0, 0, 0, 1, 0, 0, 0, 1];
  const mm = (A, B) => { const R = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; };
  const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  function axisR(u, a) { const [x, y, z] = norm(u), c = Math.cos(a), s = Math.sin(a), C = 1 - c; return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; }
  const WS = 0.1;   // GLM world units a model unit
  /* the materials (20k5uz, ids 190..209): fractions pick a variant (< 0.5) */
  const MT = { IV: 190, PT: 191, TI: 192, GD: 193, CH: 194, EDGE: 195, EYE: 196, MOON: 197, WATER: 198, GLASS: 199, HRING: 200, HLIGHT: 201, SHELL: 202, SEA: 203 };
  /* ---- curves ---- */
  const bz = (P, u) => { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };
  const bzd = (P, u) => { const v = 1 - u, a = -3 * v * v, b = 3 * v * v - 6 * u * v, c = 6 * u * v - 3 * u * u, d = 3 * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };

  /* ================= the meshes ================= */
  /* a crescent plate: a thick curved shell along a cubic centreline o.c (4 points), half width o.w(u) across (S, in the plate:
     S = T x nrm), cupped by o.cup, thickness o.th(u, v) (v -1 .. 1 across), rounded bevelled rims. The top face's rim band carries
     edge 1 (the material's gilded trim); o.edgeMat makes the strip v > o.vE a separate material (a claw's luminous cutting
     edge: its aux runs 0 at the edge .. 1 inward). o.under: the underside's material (default the top's + 0.2) */
  function plate(B, o) {
    if (o.mat == null) o.mat = MT.IV;
    const P = o.c, nu = o.nu || 18, nv = o.nv || 6, cup = o.cup || 0, N0 = norm(o.nrm || [0, 1, 0]), u0 = o.u0 || 0, u1 = o.u1 == null ? 1 : o.u1, shf = o.shift || 0, lft = o.lift || 0;   // (v418 AB round 3: u0..u1 a stretch of the curve - one armour plate of several; shift moves it across, lift lays it over the last)
    const cf = o.cf || (u => bz(P, u)), cd = o.cf ? (u => sub(o.cf(Math.min(1, u + 0.002)), o.cf(Math.max(0, u - 0.002)))) : (u => bzd(P, Math.min(0.995, Math.max(0.005, u))));   // (o.cf: the centreline as a function of u, e.g. a circular arc)
    const FR = []; for (let i = 0; i <= nu; i++) { const u = u0 + (u1 - u0) * i / nu, C = cf(u), T = norm(cd(u)); let S = cross(T, N0); if (len(S) < 1e-4) S = cross(T, [0, 0, 1]); S = norm(S); FR.push({ C, T, S, N: cross(S, T), u }); }
    const F = u => FR[Math.max(0, Math.min(nu, Math.round(u * nu)))], U = u => u0 + (u1 - u0) * u;
    const wid = u => Math.max(0.004, o.w(U(u))), thk = (u, v) => Math.max(0.01, o.th ? o.th(U(u), v) : 0.12);
    const mid = (u, v) => { const f = F(u), w = wid(u); return add(add(f.C, mul(f.S, w * (v + shf))), mul(f.N, cup * w * (v * v - 0.35) + lft + (o.bow ? o.bow(U(u), v) : 0))); };
    const vE = o.edgeMat != null ? (o.vE == null ? 0.55 : o.vE) : 1, t0 = o.trim0 == null ? 0.8 : o.trim0;
    const trim = v => sstep(t0, 0.985, Math.abs(v)) * (o.noTrim ? 0 : 1);
    const face = (sg, v0, v1, m, ev, av, nvv) => B.surf((u, s) => { const v = lerp(v0, v1, s), f = F(u); return add(mid(u, v), mul(f.N, sg * thk(u, v) * 0.5)); }, nu, nvv, () => m, { flip: sg > 0, e: (u, s) => ev(lerp(v0, v1, s)), a: av ? (u, s) => av(u, lerp(v0, v1, s)) : undefined });
    face(1, -1, vE, o.mat, trim, o.aux || null, nv); face(-1, -1, vE, o.under == null ? o.mat + 0.2 : o.under, trim, o.aux || null, nv);
    if (vE < 1) { const ac = (u, v) => cl((1 - v) / (1 - vE)); face(1, vE, 1, o.edgeMat, () => 0, ac, 3); face(-1, vE, 1, o.edgeMat, () => 0, ac, 3); }
    const rim = (vs, m, flip, av) => B.surf((u, s) => { const f = F(u), th = thk(u, vs), a = Math.PI * s; return add(add(mid(u, vs), mul(f.N, Math.cos(a) * th * 0.5)), mul(f.S, vs * Math.sin(a) * th * 0.42)); }, nu, 4, () => m, { flip, e: () => 1, a: av });
    rim(-1, o.rimMat == null ? o.mat : o.rimMat, false);
    rim(1, vE < 1 ? o.edgeMat : o.rimMat == null ? o.mat : o.rimMat, true, vE < 1 ? () => 0 : undefined);
    if (o.caps) for (const ue of [0, 1]) if (wid(ue) > 0.03) B.surf((v01, s2) => { const v = v01 * 2 - 1, f = F(ue); return add(mid(ue, v), mul(f.N, (s2 - 0.5) * thk(ue, v))); }, 6, 1, () => o.rimMat == null ? o.mat : o.rimMat, { flip: ue === 1, e: () => 1 });   // (a plate's cut end: its seam, gilded)
    return FR;
  }
  /* a strip of light on a surface: along a polyline pts (each with its normal), w wide; aux runs along it (0..1), for the
     material's travelling pulses */
  function strip(B, pts, nrm, w, mat, lift) {
    const n = pts.length, lf = lift == null ? 0.02 : lift;
    B.surf((u, v) => { const i = Math.round(u * (n - 1)), p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], T = norm(sub(b, a)), N = nrm(i), S = norm(cross(T, N)), tp = Math.min(1, Math.min(i, n - 1 - i) * 0.5 + 0.35);
      return add(add(p, mul(N, lf)), mul(S, (v - 0.5) * w * tp)); }, n - 1, 1, () => mat, { flip: true, e: () => 0, a: u => u });
  }
  // meshes merged into one
  function merge(list) {
    let nv = 0, ni = 0; for (const m of list) { nv += m.nv; ni += m.idx.length; }
    const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), att = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let v0 = 0, i0 = 0; for (const m of list) { pos.set(m.pos, v0 * 3); nrm.set(m.nrm, v0 * 3); att.set(m.att, v0 * 3); for (let i = 0; i < m.idx.length; i++) idx[i0 + i] = m.idx[i] + v0; v0 += m.nv; i0 += m.idx.length; }
    return { pos, nrm, att, idx, nv, ntri: ni / 3, gl: null };
  }
  const lathe = (B, prof, m, seg, sy, sx) => { B.push([0, 0, 1], [sx || 1, 0, 0], [0, sy || 1, 0], [0, 0, 0]); B.lathe(prof, m, { seg: seg || 24, edge: j => (prof[j][3] || 0) }); B.pop(); };

  /* the parts. Model units: x right, y toward the viewer, z up; the floor at z 0 (it floats: its lowest points near 0.5) */
  const HEART = [0, 0.8, 5.62], HEAD = [0, 0.18, 8.5], HALO = [0, -0.4, 11.3], HEARTS = 1.3, SHO = [1.05, -0.12, 7.32], PELV = [0, 0, 4.25], SHELLC = [0, 0.05, 6.1];
  const ELB = 1.35, FORE0 = 1.0, FORE1 = 2.3, UPX = [0, 0.5025, 0.8925];   // (v420 AP: UPX the upper arm's joints)   // the upper arm's length; the forearm telescoping from FORE0 to FORE1
  const RINGS = [   // ordered: concentric crowns behind / above the head sharing one gentle tilt, small collars along the spire, a nimbus behind.
    // R, tube, style (0 gold runes, 1 segmented, 2 double rail, 3 light, 4 toothed, 5 platinum with spikes), centre offset from HALO, tilt (x, y), spin, precession
    { R: 1.3, r: 0.075, s: 0, c: [0, -0.15, 0.0], tx: 0.08, ty: 0, sp: 0.3, pr: 0.02 },        // the crown
    { R: 1.75, r: 0.065, s: 4, c: [0, -0.15, -0.08], tx: 0.08, ty: 0, sp: -0.16, pr: 0.02 },
    { R: 0.36, r: 0.05, s: 2, c: [0, 0.05, 0.7], tx: 0.12, ty: 0, sp: 1.1, pr: 0.03 },         // collars on the spire
    { R: 1.05, r: 0.05, s: 1, c: [0, -0.1, 0.55], tx: 0.08, ty: 0, sp: -0.2, pr: 0.02 },        // a segmented crown above the first
    { R: 1.52, r: 0.03, s: 3, c: [0, -0.15, -0.04], tx: 0.08, ty: 0, sp: -0.5, pr: 0.02 },
    { R: 2.2, r: 0.06, s: 5, c: [0, -0.15, -0.16], tx: 0.08, ty: 0, sp: 0.11, pr: 0.02 },
    { R: 0.3, r: 0.045, s: 0, c: [0, 0.05, 1.25], tx: 0.12, ty: 0, sp: -1.3, pr: 0.03 },
    { R: 0.42, r: 0.045, s: 0, c: [0, 0.05, 0.15], tx: 0.12, ty: 0, sp: 0.8, pr: 0.03 },
    { R: 2.65, r: 0.055, s: 1, c: [0, -0.15, -0.24], tx: 0.08, ty: 0, sp: -0.08, pr: 0.02 },
    { R: 1.98, r: 0.025, s: 3, c: [0, -0.15, -0.12], tx: 0.08, ty: 0, sp: 0.4, pr: 0.02 },
    { R: 0.25, r: 0.04, s: 2, c: [0, 0.05, 1.75], tx: 0.12, ty: 0, sp: 1.6, pr: 0.03 },
    { R: 0.72, r: 0.04, s: 5, c: [0, -0.05, 1.0], tx: 0.08, ty: 0, sp: 0.35, pr: 0.02 },       // and a small one higher on the spire
  ];
  const NRING = [0, 4, 8, 12], NTEN = [0, 4, 6, 8], NWING = [0, 0, 1, 2], NSHO = [0, 1, 2, 3], NPET = 10;
  const TEN = [   // (v418 AB round 3: splayed out round the spire and hooked back in, like hanging claws)
    { a: 1.15, L: 4.4, lean: 0.42, curl: 0.95 }, { a: 1.99, L: 4.4, lean: 0.42, curl: 0.95 }, { a: 0.5, L: 3.9, lean: 0.62, curl: 1.0 }, { a: 2.64, L: 3.9, lean: 0.62, curl: 1.0 },
    { a: -0.1, L: 3.5, lean: 0.75, curl: 1.05 }, { a: 3.24, L: 3.5, lean: 0.75, curl: 1.05 }, { a: -0.7, L: 3.0, lean: 0.7, curl: 0.9 }, { a: 3.84, L: 3.0, lean: 0.7, curl: 0.9 },
  ];
  const NSEG = 4;
  // the claw's centreline, from its point up to the hook above the wrist (so the side S = T x y is the inner, concave edge)
  // v418 AB round 3b: each outer blade a SICKLE - one arc of a circle round the body (CW its centre and CR its radius in the claw's own frame,
  // whose origin is the wrist at rest), from its needle point under the body (CA0) round the outside to a hook curling in over the head
  // (CA1); its inner edge is the arc itself, the blade growing outward from it: widest at the shoulder, tapering smoothly to both points
  // (each side's arc has its own centre, out on its side, so the two nearly close a circle with a gap above the head and one at the spire;
  // both ends curl a little inward: the hook over the head, the needle under the body)
  const CW = [-2.68, 0.15, -0.87], CR = 4.7, CRZ = 1.25, CA0 = -1.47, CA1 = 1.55, CLSH = -1;   // (an arc a little taller than wide: the pair reads as a circle seen from the fight's camera)
  const clawArc = u => { const a = CA0 + (CA1 - CA0) * u, r = CR * (1 - 0.12 * sstep(0.85, 1, u) - 0.08 * sstep(0.15, 0, u)); return [CW[0] + Math.cos(a) * r, CW[1], CW[2] + Math.sin(a) * r * CRZ]; };
  const clawW = u => (u < 0.74 ? 1.08 * Math.pow(u / 0.74, 1.45) : 1.08 * Math.pow((1 - u) / 0.26, 0.85)) + 0.008;   // (half the blade's width: widest at the shoulder, a smooth taper to the needle, a sharp hook)
  const CLAWC = [clawArc(0), clawArc(0.33), clawArc(0.66), clawArc(1)];
  let D = null;
  function* gen() {
    const q = lowFx() ? 0.7 : 1, M = {};
    const mk = f => { const B = GLM.builder(q); f(B); return B.done(); };
    /* the torso: a dark machine core (ribbed titanium lathe), the porcelain sternum shield and three ribs a side wrapping it,
       sapphire channels, a gilded collar, the pelvis ring, the hips' plates, the long lower spine-blade with its light */
    M.body = mk(B => {
      lathe(B, [[4.05, 0.0, MT.TI], [4.1, 0.42, MT.TI], [4.45, 0.5, MT.TI], [4.6, 0.4, MT.TI], [4.75, 0.52, MT.TI], [5.2, 0.55, MT.TI], [5.6, 0.62, MT.TI], [6.1, 0.72, MT.TI], [6.55, 0.8, MT.TI], [6.9, 0.84, MT.TI], [7.25, 0.8, MT.TI], [7.6, 0.66, MT.TI], [7.9, 0.48, MT.TI], [8.05, 0.0, MT.TI]], MT.TI, 26, 0.62, 0.8);
      // segmented belly bands (the machine skeleton showing between the plates)
      for (let i = 0; i < 4; i++) { const z = 4.55 + i * 0.32; B.push([1, 0, 0], [0, 0.72, 0], [0, 0, 1], [0, 0, z]); B.tor([0, 0, 0], 0.5 + i * 0.03, 0.05, MT.TI + 0.1, { seg: 26, rseg: 5 }); B.pop(); }
      B.push([1, 0, 0], [0, 0.72, 0], [0, 0, 1], [0, 0, 7.72]); B.tor([0, 0, 0], 0.62, 0.075, MT.GD, { seg: 28, rseg: 6 }); B.pop();
      B.push([1, 0, 0], [0, 0.8, 0], [0, 0, 1], PELV); B.tor([0, 0, 0], 0.7, 0.1, MT.GD, { seg: 30, rseg: 6 }); B.tor([0, 0, -0.18], 0.58, 0.07, MT.TI, { seg: 26, rseg: 5 }); B.pop();
      // the sternum shield: a pointed porcelain plate down the chest, from the collar to just above the heart
      plate(B, { c: [[0, 0.58, 8.0], [0, 0.78, 7.55], [0, 0.82, 7.0], [0, 0.76, 6.62]], nrm: [0, 1, 0.15], w: u => 0.62 * Math.pow(1 - u, 0.75) * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 2))) + 0.02, cup: -0.22, th: () => 0.12, nu: 12, nv: 6 });
      strip(B, [[0, 0.86, 7.85], [0, 0.94, 7.5], [0, 0.97, 7.15], [0, 0.93, 6.8]], () => [0, 1, 0.1], 0.07, MT.CH, 0.02);
      // ribs: crescents from the back round each side, three a side, the lowest the shortest
      for (const sd of [1, -1]) for (let i = 0; i < 3; i++) { const z = 7.05 - i * 0.48, r0 = 0.78 - i * 0.08, w0 = 0.2 - i * 0.025;
        plate(B, { c: [[sd * 0.25, -0.62, z + 0.12], [sd * (r0 + 0.35), -0.45, z + 0.05], [sd * (r0 + 0.38), 0.3, z - 0.18], [sd * 0.32, 0.72 - i * 0.05, z - 0.42]], nrm: [0, 0, 1], w: u => w0 * Math.sin(Math.PI * (0.08 + u * 0.88)), cup: 0.25, th: () => 0.09, nu: 12, nv: 3, under: MT.IV + 0.2 }); }
      // the hips: two crescents curving down over the pelvis ring
      for (const sd of [1, -1]) plate(B, { c: [[sd * 0.25, 0.42, 4.95], [sd * 0.85, 0.38, 4.85], [sd * 1.0, 0.25, 4.35], [sd * 0.62, 0.32, 3.75]], nrm: [0, 1, 0], w: u => 0.26 * Math.sin(Math.PI * (0.06 + u * 0.9)), cup: 0.2, th: () => 0.1, nu: 12, nv: 4 });
      // the lower spine-blade: a long flat porcelain blade, its light channel down both faces
      plate(B, { c: [[0, 0, 4.3], [0, 0.02, 3.0], [0, 0.04, 1.2], [0, 0.05, -0.6]], nrm: [0, 1, 0], w: u => 0.5 * Math.pow(1 - u, 0.8) + 0.012, cup: 0, th: (u, v) => 0.24 * (1 - u * 0.7) * (1 - v * v * 0.55), nu: 16, nv: 6, trim0: 0.7 });
      for (const sg of [1, -1]) { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([0, sg * (0.11 * (1 - u * 0.7) + 0.005) + 0.02 * u, 4.15 - u * 4.6]); } strip(B, pts, () => [0, sg, 0], 0.15, MT.CH + 0.2, 0.01); }
      B.crystal([0, 0.06, 0.8], [0, 0.12, -3.0], 0.24, MT.CH + 0.2, { n: 5, thin: 0.7, belly: 0.12, base: 0.6 });   // (v418 AB round 2: the spire of light hanging below it)
      strip(B, [[0, 0.5, 4.25], [0, 0.56, 4.5], [0, 0.6, 4.75]], () => [0, 1, 0], 0.09, MT.CH + 0.2, 0.02); strip(B, [[0, 0.52, 7.9], [0, 0.45, 8.2], [0, 0.38, 8.5]], () => [0, 1, 0.2], 0.08, MT.CH + 0.2, 0.02);
      // a collar of small gilded spikes round the base of the neck
      for (let i = 0; i < 9; i++) { const a = -0.3 + i / 8 * (Math.PI + 0.6), x = Math.cos(a) * 0.62, y = Math.sin(a) * 0.48; B.spike([x, y, 7.82], [x * 1.45, y * 1.4, 8.18], 0.06, MT.GD + 0.1, { seg: 5 }); }
    }); yield;
    /* the back: a turning mechanism disc (concentric toothed rings and spokes) on the shoulder blades */
    M.gear = mk(B => {
      B.push([1, 0, 0], [0, 0, -1], [0, 1, 0], [0, 0, 0]);   // local z out of the back (-y)
      B.tor([0, 0, 0], 0.95, 0.06, MT.GD, { seg: 40, rseg: 5, teeth: 20, tooth: 0.07 }); B.tor([0, 0, 0.02], 0.68, 0.05, MT.TI, { seg: 32, rseg: 5 }); B.tor([0, 0, 0.04], 0.38, 0.06, MT.GD, { seg: 24, rseg: 5 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; B.tube([Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0.03], [Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0.0], 0.035, 0.025, MT.PT, { seg: 5 }); }
      B.ell([0, 0, 0.05], [0.2, 0.2, 0.12], MT.CH, { seg: 12, rings: 6 });
      B.pop();
    }); yield;
    /* the neck: stacked titanium and gold discs with two struts */
    M.neck = mk(B => {
      lathe(B, [[7.9, 0, MT.TI], [7.92, 0.34, MT.TI], [8.04, 0.34, MT.TI], [8.06, 0.27, MT.TI], [8.1, 0.27, MT.GD], [8.12, 0.36, MT.GD], [8.2, 0.36, MT.GD], [8.22, 0.25, MT.TI], [8.3, 0.25, MT.TI], [8.32, 0.31, MT.TI], [8.42, 0.31, MT.TI], [8.45, 0.2, MT.GD], [8.5, 0.2, MT.GD], [8.52, 0, MT.GD]], MT.TI, 18, 0.9);
      for (const sd of [1, -1]) B.tube([sd * 0.3, -0.12, 7.85], [sd * 0.22, -0.18, 8.55], 0.045, 0.035, MT.PT, { seg: 6 });
    }); yield;
    /* the mask: a smooth pointed porcelain face with a raised centre ridge (the eye slit along it), swept cheek plates, a dark
       skull behind, a crest of three spikes and two swept horns. Built about the head's pivot (0, 0, 0) = HEAD */
    M.head = mk(B => {
      const hw = u => 0.48 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.74 + 0.01)), 1.15) + 0.07 * sstep(0.7, 1, u), zz = u => -1.25 + u * 2.4;
      const fy = (u, v) => 0.18 + 0.52 * Math.sqrt(Math.max(0, 1 - v * v)) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, u * 1.1))) + 0.06 * Math.exp(-v * v / 0.02) * sstep(0.05, 0.4, u) * (1 - sstep(0.85, 1, u)) + 0.75 * Math.pow(Math.max(0, 1 - u * 1.6), 2.2) * Math.exp(-v * v / 0.3);   // (v418 AB round 2: a beak jutting forward at its point)
      B.surf((u, s) => { const v = s * 2 - 1; return [v * hw(u), fy(u, v) - 0.1 * u * u, zz(u) - 0.18 * v * v * (1 - u)]; }, 18, 12, () => MT.IV + 0.1, { flip: false, e: (u, s) => sstep(0.86, 1, Math.abs(s * 2 - 1)) * 0.7 + sstep(0.92, 1, u) * 0.6 });
      B.ell([0, -0.12, 0.25], [0.48, 0.5, 0.75], MT.TI, { seg: 18, rings: 10 });
      // the eye slit: a thin vertical light down the ridge
      { const pts = []; for (let i = 0; i <= 8; i++) { const u = 0.38 + i / 8 * 0.36; pts.push([0, fy(u, 0) - 0.1 * u * u + 0.012, zz(u)]); } strip(B, pts, () => [0, 1, 0.05], 0.05, MT.EYE, 0.012); }
      // cheek plates sweeping back from the mask's sides
      for (const sd of [1, -1]) plate(B, { c: [[sd * 0.4, 0.42, 0.35], [sd * 0.72, 0.3, 0.5], [sd * 0.86, 0.0, 0.62], [sd * 0.72, -0.4, 0.95]], nrm: [sd * 0.7, 0.5, 0.4], w: u => 0.17 * Math.sin(Math.PI * (0.05 + u * 0.9)), cup: 0.2, th: () => 0.06, nu: 10, nv: 3 });
      for (const sd of [1, -1]) plate(B, { c: [[sd * 0.36, 0.3, -0.25], [sd * 0.6, 0.15, -0.15], [sd * 0.7, -0.08, 0.05], [sd * 0.58, -0.3, 0.3]], nrm: [sd * 0.8, 0.5, 0.1], w: u => 0.12 * Math.sin(Math.PI * (0.05 + u * 0.9)), cup: 0.2, th: () => 0.05, nu: 8, nv: 3 });
      // the crest: a tall centre spike and two smaller, then the swept horns
      B.crystal([0, 0.05, 1.0], [0, -0.75, 2.3], 0.13, MT.IV + 0.35, { n: 5, thin: 0.55, belly: 0.25 });   // (the crest swept back)
      for (const sd of [1, -1]) { B.crystal([sd * 0.3, -0.02, 0.85], [sd * 0.75, -1.35, 1.95], 0.1, MT.IV + 0.35, { n: 4, thin: 0.5, belly: 0.25 }); B.crystal([sd * 0.42, -0.12, 0.45], [sd * 1.15, -1.45, 1.05], 0.09, MT.IV + 0.35, { n: 4, thin: 0.5, belly: 0.25 }); B.crystal([sd * 0.46, -0.2, 0.05], [sd * 1.05, -1.2, 0.2], 0.07, MT.IV + 0.35, { n: 4, thin: 0.5, belly: 0.25 }); }
      for (const sd of [1, -1]) { B.crystal([sd * 0.18, 0.02, 0.95], [sd * 0.32, -0.08, 1.55], 0.08, MT.IV, { n: 5, thin: 0.6, belly: 0.3 });
        plate(B, { c: [[sd * 0.3, 0.05, 0.85], [sd * 0.75, -0.05, 1.1], [sd * 1.0, -0.2, 1.55], [sd * 0.92, -0.35, 2.1]], nrm: [0, 1, 0], w: u => 0.13 * Math.pow(Math.sin(Math.PI * (0.04 + u * 0.92)), 0.7), cup: 0.15, th: () => 0.06, nu: 12, nv: 3 }); }
    }); yield;
    /* the Lunar Heart: the moon, the water round it, the glass shell, its gilded frame and mount, two orbit filaments */
    M.moon = mk(B => { B.ell([0, 0, 0], [0.5, 0.5, 0.5], MT.MOON, { seg: 30, rings: 18 }); });
    M.water = mk(B => { B.ell([0, 0, 0], [0.82, 0.82, 0.82], MT.WATER, { seg: 30, rings: 18 }); });
    M.glass = mk(B => { B.ell([0, 0, 0], [0.96, 0.96, 0.96], MT.GLASS, { seg: 32, rings: 20 }); });
    M.frame = mk(B => {
      B.torY([0, 0, 0], 1.02, 0.075, MT.GD, { seg: 44, rseg: 6 }); B.torY([0, -0.06, 0], 1.12, 0.035, MT.PT, { seg: 44, rseg: 5 });
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.26; B.spike([Math.cos(a) * 1.08, 0, Math.sin(a) * 1.08], [Math.cos(a) * 1.42, -0.05, Math.sin(a) * 1.42], 0.07, MT.GD, { seg: 5 }); }
      B.tube([0, -0.1, 1.05], [0, -0.5, 1.35], 0.09, 0.06, MT.TI, { seg: 8 }); B.tube([0, -0.1, -1.05], [0, -0.45, -1.4], 0.09, 0.06, MT.TI, { seg: 8 });
    }); yield;
    M.fil = mk(B => { B.tor([0, 0, 0], 1.25, 0.018, MT.PT, { seg: 48, rseg: 4 }); B.sph([1.25, 0, 0], 0.06, MT.CH, 8); });
    /* the halo rings, each its own mesh in its own plane (local z its axis) */
    M.rings = RINGS.map((R0, i) => mk(B => {
      const s = R0.s;
      if (s === 0) { B.tor([0, 0, 0], R0.R, R0.r, MT.HRING, { seg: 64, rseg: 5 }); for (let j = 0; j < 4; j++) { const a = j / 4 * TAU; B.sph([Math.cos(a) * R0.R, Math.sin(a) * R0.R, 0], R0.r * 1.7, MT.CH, 6); } }
      else if (s === 1) { const n = 6, gap = 0.16; for (let j = 0; j < n; j++) { const a0 = j / n * TAU + gap, a1 = (j + 1) / n * TAU - gap; B.tor([0, 0, 0], R0.R, R0.r, MT.HRING + 0.2, { seg: 14, rseg: 5, ph0: a0, ph1: a1 }); } }
      else if (s === 2) { B.tor([0, 0, R0.r * 1.4], R0.R, R0.r * 0.7, MT.HRING, { seg: 64, rseg: 4 }); B.tor([0, 0, -R0.r * 1.4], R0.R, R0.r * 0.7, MT.HRING + 0.2, { seg: 64, rseg: 4 }); for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; B.tube([Math.cos(a) * R0.R, Math.sin(a) * R0.R, -R0.r * 1.5], [Math.cos(a) * R0.R, Math.sin(a) * R0.R, R0.r * 1.5], R0.r * 0.35, R0.r * 0.35, MT.GD, { seg: 4, cap0: false, cap1: false }); } }
      else if (s === 3) B.tor([0, 0, 0], R0.R, R0.r, MT.HLIGHT, { seg: 72, rseg: 4 });
      else if (s === 4) { B.tor([0, 0, 0], R0.R, R0.r, MT.HRING, { seg: 72, rseg: 5, teeth: 36, tooth: R0.r * 1.2 }); B.tor([0, 0, 0], R0.R - R0.r * 2.2, R0.r * 0.45, MT.HLIGHT, { seg: 64, rseg: 4 }); }
      else { B.tor([0, 0, 0], R0.R, R0.r, MT.HRING + 0.2, { seg: 64, rseg: 5 }); for (let j = 0; j < 4; j++) { const a = j / 4 * TAU; B.crystal([Math.cos(a) * R0.R, Math.sin(a) * R0.R, 0], [Math.cos(a) * (R0.R + 0.22), Math.sin(a) * (R0.R + 0.22), 0], 0.04, MT.GD, { n: 4, thin: 0.5 }); } }
    })); yield;
    // the spear of light through the halo
    M.spear = mk(B => { B.crystal([0, 0, -1.6], [0, 0, 2.6], 0.07, MT.CH + 0.2, { n: 4, thin: 1, belly: 0.55, base: 0.1 }); B.crystal([0, 0, -1.6], [0, 0, -2.1], 0.07, MT.CH + 0.2, { n: 4, thin: 1, belly: 0.1 }); });
    /* the shoulder carapace: three overlapping crescent shells a side, rising from the shoulder to horn-like tips (right side;
       the left is drawn mirrored). Each about the shoulder pivot SHO */
    M.sho = [0, 1, 2].map(i => mk(B => {
      const s = 1 - i * 0.16, z0 = 0.15 + i * 0.12, ox = -i * 0.06;
      plate(B, { c: [[ox - 0.15, 0.12 - i * 0.18, z0 - 0.1], [1.1 * s, 0.1 - i * 0.2, z0 + 0.25 * s], [2.35 * s, -0.08 - i * 0.2, z0 + 1.35 * s], [2.95 * s, -0.3 - i * 0.18, z0 + 3.3 * s]], nrm: [-0.35, 1, -0.1], w: u => (0.72 - i * 0.1) * Math.pow(Math.sin(Math.PI * (0.03 + u * 0.95)), 0.9) * (1 - 0.55 * u), cup: 0.3, th: (u) => 0.17 * (1 - u * 0.65), nu: 22, nv: 6, trim0: 0.72 });
      if (i === 0) { B.ell([0.1, 0.0, 0.0], [0.42, 0.4, 0.36], MT.TI, { seg: 14, rings: 8 }); B.torX([0.25, 0, 0], 0.36, 0.05, MT.GD, { seg: 22, rseg: 5 }); }
    })); yield;
    /* the arms: a chain of interlocked titanium segments with gilded collars (upper arm, about the shoulder joint along +x), and the
       forearm's three nested telescoping sleeves; the claw's mount */
    // (v420 AP: the upper arm in three groups of three segments, each about its own joint (UPX), so the chain flexes in a wave)
    M.upper = [0, 1, 2].map(g => mk(B => { const ox = UPX[g];
      for (let i = g * 3; i < g * 3 + 3; i++) { const x0 = 0.12 + i * 0.13 - ox, r = 0.27 - i * 0.008 + (i % 2) * 0.035; B.tube([x0, 0, 0], [x0 + 0.115, 0, 0], r, r * 0.94, MT.TI + (i % 2 ? 0.1 : 0), { seg: 16, cap0: 'flat', cap1: 'flat', edge: 0.4 }); if (i % 2) B.torX([x0 + 0.06, 0, 0], r * 1.0, 0.03, i % 4 === 1 ? MT.GD : MT.PT, { seg: 18, rseg: 4 }); }
      const x1 = (g === 2 ? ELB - 0.1 : UPX[g + 1]) - ox; for (const sz of [1, -1]) B.tube([0.05, 0.0, sz * (0.3 - g * 0.02)], [x1 - 0.03, 0.0, sz * (0.28 - g * 0.02)], 0.055, 0.045, MT.PT, { seg: 6 });   // the pistons
      if (g === 0) B.sph([0, 0, 0], 0.34, MT.TI, 14); else { B.sph([0, 0, 0], 0.235, MT.TI, 12); B.torX([0, 0, 0], 0.25, 0.028, MT.GD, { seg: 16, rseg: 4 }); }
      if (g === 2) { B.sph([ELB - ox, 0, 0], 0.29, MT.GD, 12); B.torZ([ELB - ox, 0, 0], 0.31, 0.04, MT.PT, { seg: 18, rseg: 4 }); }
    }));
    M.sleeve = [0, 1, 2].map(i => mk(B => { const r = 0.25 - i * 0.035, L = 1.0; B.tube([0, 0, 0], [L, 0, 0], r, r * 0.92, MT.TI + (i === 1 ? 0.1 : 0), { seg: 14, cap0: 'flat', cap1: 'flat', edge: 0.4 }); B.torX([L - 0.04, 0, 0], r * 0.98, 0.032, MT.GD, { seg: 16, rseg: 4 }); B.torX([0.06, 0, 0], r * 0.95, 0.022, MT.PT, { seg: 16, rseg: 4 });
      for (let j = 0; j < 3; j++) { const a = j / 3 * TAU + i; B.tube([0.15, Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85], [L - 0.15, Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85], 0.022, 0.022, MT.CH + 0.1, { seg: 4, cap0: false, cap1: false }); } for (let j = 1; j < 4; j++) B.torX([j * 0.25, 0, 0], r * 1.01, 0.022, MT.PT, { seg: 16, rseg: 3 }); }));
    M.wrist = mk(B => { B.sph([0, 0, 0], 0.32, MT.TI, 14); B.torY([0, 0, 0], 0.37, 0.07, MT.GD, { seg: 24, rseg: 5 }); B.torX([0, 0, 0], 0.34, 0.045, MT.PT, { seg: 20, rseg: 4 }); B.ell([0, 0.26, 0], [0.11, 0.07, 0.11], MT.CH, { seg: 8, rings: 5 }); }); yield;
    /* the claw: a giant crescent blade about the wrist (x outward, z up): a hook above, the blade bulging outward and sweeping
       down and in to its point; a thick porcelain spine (outer edge, gilded) and a luminous sapphire cutting edge inside */
    M.claw = mk(B => {
      // three overlapping armour plates along the arc (each upper one laid over the one below, its cut end a gilded seam)
      [[0, 0.47, 18], [0.43, 0.76, 16], [0.72, 1, 14]].forEach(([u0, u1, n], i) => plate(B, { cf: clawArc, u0, u1, shift: CLSH, lift: 0.06 * i, caps: true, nrm: [0, 1, 0], w: u => clawW(u) * (1 + 0.04 * i), cup: 0.06, mat: MT.IV + 0.35, under: MT.IV + 0.35,
        th: (u, v) => (0.1 + 0.5 * Math.pow(Math.min(1, u / 0.78), 1.1)) * (0.35 + 0.65 * cl((1 - v) / 1.4)), nu: n, nv: 8, edgeMat: MT.EDGE, vE: 0.7, trim0: 0.68 }));
      // big jagged thorns along its outer back, curved and raked toward the needle, the biggest near the shoulder
      for (const [u, L] of [[0.42, 0.8], [0.53, 1.15], [0.62, 1.55], [0.7, 1.9], [0.78, 2.0], [0.87, 1.4]]) { const C = clawArc(u), T = norm(sub(clawArc(u + 0.002), clawArc(u - 0.002))), S = norm(cross(T, [0, 1, 0])), p = add(C, mul(S, clawW(u) * (CLSH - 1) * 0.95)), d = norm(add(mul(S, -1), mul(T, -0.85)));
        B.crystal(p, add(p, mul(d, L)), 0.16 + 0.13 * L, MT.IV + 0.35, { n: 4, thin: 0.42, belly: 0.16, base: 0.95, bend: 0.28, up: [0, 1, 0] }); }
      // the strut from the wrist to the blade's inner edge, banded in gold
      { const q = clawArc(0.55); B.tube([0, 0, 0], q, 0.24, 0.17, MT.TI, { seg: 12 }); for (let k2 = 1; k2 < 4; k2++) { const m2 = lerp3([0, 0, 0], q, k2 / 4.2); B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], m2); B.tor([0, 0, 0], 0.2, 0.04, MT.GD, { seg: 16, rseg: 4 }); B.pop(); } }
      // a gilded vein along the spine, and the mount's collar
      B.ell([0, 0, 0], [0.32, 0.26, 0.42], MT.TI, { seg: 14, rings: 8 }); B.torY([0, 0, 0], 0.38, 0.06, MT.GD, { seg: 24, rseg: 5 });
      B.spike([0.15, 0.05, 0.3], [0.7, 0.0, 0.95], 0.1, MT.GD, { seg: 5 });
    }); yield;
    // a smaller blade for the second claw finger (k 3) and for Crescent Reavers' orbiting blades
    M.blade = mk(B => { plate(B, { c: [[-1.1, 0, 0.0], [-0.3, 0, 0.9], [0.9, 0, 0.75], [1.4, 0, -0.35]], nrm: [0, 0, 1], w: u => 0.42 * Math.pow(Math.sin(Math.PI * (0.02 + u * 0.96)), 0.7), cup: 0.0, th: (u, v) => 0.14 * (0.3 + 0.7 * cl((1 - v) / 1.4)), nu: 20, nv: 5, edgeMat: MT.EDGE, vE: 0.35, trim0: 0.7 }); }); yield;
    /* the cape of crescents: wing layers hung from the back of each shoulder, convex outward, their points down */
    const WINGC = [[[1.0, 0.1, -4.4], [2.4, 0.0, -3.0], [1.95, -0.05, 1.4], [0.2, -0.1, 3.1]], [[0.95, 0.2, -2.9], [1.7, 0.05, -2.0], [1.35, 0.0, 0.4], [0.1, 0.0, 1.15]]], WINGW = [11.5, 6.6];   // (v418 AB round 3: flared crescents, their points outward and apart)
    M.wing = [0, 1].map(i => mk(B => { const C = WINGC[i], ww = u => WINGW[i] * Math.pow(u, 4) * Math.pow(Math.max(0, 1 - u), 1.1) + 0.01;
      plate(B, { c: C, nrm: [-0.15, 1, 0.05], w: ww, shift: -0.3, cup: 0.12, mat: MT.IV + 0.35, under: MT.IV + 0.35, th: (u, v) => (0.07 + 0.3 * Math.pow(u, 1.2)) * (0.35 + 0.65 * cl((1 - v) / 1.4)), nu: 28, nv: 6, edgeMat: MT.EDGE, vE: 0.78, trim0: 0.68 });
      for (const [u, L] of (i ? [[0.62, 0.45], [0.8, 0.6]] : [[0.55, 0.5], [0.7, 0.75], [0.84, 0.9]])) { const c0 = bz(C, u), T = norm(bzd(C, u)), S = norm(cross(T, norm([-0.15, 1, 0.05]))), p = add(c0, mul(S, ww(u) * -1.3 * 0.9)), d = norm(add(mul(S, -1), mul(T, -0.85)));
        B.crystal(p, add(p, mul(d, L)), 0.1 + 0.12 * L, MT.IV + 0.35, { n: 4, thin: 0.42, belly: 0.16, base: 0.95, bend: 0.25, up: [0, 1, 0] }); }
      B.ell([0, 0, 0], [0.22, 0.2, 0.26], MT.TI, { seg: 10, rings: 6 }); B.torY([0, 0, 0], 0.25, 0.04, MT.GD, { seg: 18, rseg: 4 });
    })); yield;
    /* a tendril segment (about its upper joint, hanging along -z, length 1): a dark core, a porcelain sheath on its outer side,
       a gilded ring at the joint; scaled per segment */
    M.seg = mk(B => {
      B.tube([0, 0, 0.05], [0, 0, -1.05], 0.085, 0.07, MT.TI, { seg: 10, cap0: 'round', cap1: 'round' });
      plate(B, { c: [[0, 0.06, 0.28], [0.0, 0.2, -0.15], [0.0, 0.22, -0.8], [0, 0.1, -1.32]], nrm: [0, 1, 0], w: u => 0.25 * Math.pow(Math.sin(Math.PI * (0.1 + u * 0.82)), 0.45), cup: 0.5, th: () => 0.07, nu: 10, nv: 4, trim0: 0.74 });
    });
    M.tip = mk(B => { B.crystal([0, 0.05, 0.2], [0, 0.5, -1.7], 0.22, MT.IV + 0.35, { n: 5, thin: 0.5, belly: 0.25, bend: 0.35 }); B.crystal([0, 0.42, -1.3], [0, 0.62, -2.05], 0.1, MT.GD, { n: 4, thin: 0.55, belly: 0.2, bend: 0.2 }); });   // (a gilded point) yield;
    /* a petal of the lunar shell: a lune of a sphere (radius 1) between two meridians, porcelain outside with gilded rims, a dark
       inside lit along its seams; ten of them close into the sphere */
    M.petal = mk(B => {
      const half = TAU / NPET / 2 - 0.035, th0 = 0.16 * Math.PI, th1 = 0.86 * Math.PI, sp = (u, s, r) => { const th = lerp(th0, th1, u), ph = (s * 2 - 1) * half * Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.88)) ** 0.25; return [Math.sin(th) * Math.sin(ph) * r, Math.sin(th) * Math.cos(ph) * r, Math.cos(th) * r]; };
      const ev = (u, s) => Math.max(sstep(0.82, 0.98, Math.abs(s * 2 - 1)), sstep(0.06, 0.0, u) + sstep(0.94, 1.0, u));
      B.surf((u, s) => sp(u, s, 1.0), 16, 6, () => MT.IV, { flip: true, e: ev });
      B.surf((u, s) => sp(u, s, 0.93), 16, 6, () => MT.SHELL, { e: ev });
      for (const s0 of [0, 1]) B.surf((u, s) => sp(u, s0, lerp(1.0, 0.93, s)), 16, 1, () => MT.GD + 0.1, { flip: s0 === 1, e: () => 1 });
      // a raised gilded rib down its middle, and a sapphire seam
      { const pts = []; for (let i = 0; i <= 12; i++) pts.push(sp(0.05 + i / 12 * 0.9, 0.5, 1.012)); strip(B, pts, i => norm(pts[i]), 0.045, MT.CH, 0.004); }
    }); yield;
    M.cap = mk(B => { B.ell([0, 0, 0], [1, 1, 1], MT.IV, { th1: 0.17 * Math.PI, seg: 30, rings: 3 }); B.torZ([0, 0, Math.cos(0.16 * Math.PI)], Math.sin(0.16 * Math.PI), 0.03, MT.GD, { seg: 30, rseg: 4 }); B.ell([0, 0, 0], [1, 1, 1], MT.IV, { th0: 0.85 * Math.PI, seg: 30, rings: 3 }); });
    /* the Ninth Tide's sea (see-through water, 203): a ribbon of water winding up a unit cylinder (2.5 turns; aux along it,
       edge 1 at its foaming rims), the inverted ocean's canopy (a dome opening downward) and the crushed sphere */
    M.helix = mk(B => B.surf((u, v) => { const th = u * 2.5 * TAU, rr = 1 + 0.05 * Math.sin(u * 23), w = 0.07 + 0.05 * Math.sin(u * Math.PI); return [Math.cos(th) * rr, Math.sin(th) * rr, u + (v - 0.5) * w * 2]; }, 90, 3, () => MT.SEA, { e: (u, v) => Math.abs(v - 0.5) * 2, a: u => u }));
    M.canopy = mk(B => B.surf((u, v) => { const th = u * 0.48 * Math.PI, ph = v * TAU, w = 1 + 0.04 * Math.sin(ph * 7 + u * 9); return [Math.sin(th) * Math.cos(ph) * w, Math.sin(th) * Math.sin(ph) * w, Math.cos(th) * 0.55]; }, 10, 48, () => MT.SEA, { e: u => sstep(0.75, 1, u), a: (u, v) => v }));
    M.orb = mk(B => B.surf((u, v) => { const th = u * Math.PI, ph = v * TAU; return [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; }, 18, 36, () => MT.SEA, { e: () => 0.2, a: (u, v) => v * 2 + u }));
    const bsph = m => { let cx = 0, cy = 0, cz = 0; const n = m.nv; for (let i = 0; i < n; i++) { cx += m.pos[i * 3]; cy += m.pos[i * 3 + 1]; cz += m.pos[i * 3 + 2]; } cx /= n; cy /= n; cz /= n; let r = 0; for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(m.pos[i * 3] - cx, m.pos[i * 3 + 1] - cy, m.pos[i * 3 + 2] - cz)); m.bs = [cx, cy, cz, r]; };
    for (const k in M) { const v = M[k]; if (Array.isArray(v)) v.forEach(bsph); else bsph(v); }   // (each mesh's bounding sphere: the image's box holds every part however it is posed, so nothing is ever cropped)
    D.M = M; D.nv = Object.values(M).reduce((s, m) => s + (Array.isArray(m) ? m.reduce((a, b) => a + b.nv, 0) : m.nv), 0); D.ready = true; D.msBuilt = nowMs();
  }
  function data() { return D || (D = { ready: false, up: false, it: null, ms: 0 }); }
  /* build a slice (ms) of the meshes */
  function step(ms) { const d = data(); if (d.ready) return true; if (typeof GLM === 'undefined') return false; d.it = d.it || gen(); const t0 = nowMs(), until = t0 + ms; while (!d.ready && nowMs() < until) d.it.next(); d.ms += nowMs() - t0; return d.ready; }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Abaddon GL: ' + String(e && e.message || e)); } catch (e2) {} };
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__AB_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__AB_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  /* idle-time preparation: the meshes in small slices, then one tiny render uploads them and compiles the shader */
  let IDLE = 0;
  function warm() {
    if (!usable()) return false; const d = data(); if (d.up || IDLE) return true; IDLE = 1;
    const go = () => { const run = ms => { try { if (!step(ms)) return go(); if (!d.up) upload(); } catch (e) { fail(e); } IDLE = 0; };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => run(dl.didTimeout ? 3 : Math.max(1, Math.min(8, dl.timeRemaining() - 1))), { timeout: 200 }); else setTimeout(() => run(3), 30); };
    go(); return true;
  }
  function eachMesh(f) { const M = D.M; for (const k in M) { const v = M[k]; if (Array.isArray(v)) v.forEach(f); else f(v); } }
  function upload() { const d = data(); if (d.up || !d.ready || !GLM.ok()) return; const items = [];
    eachMesh(mesh => items.push({ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 1 }));
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); d.up = true; }
  /* ready now: build what is left at once (a menu portrait wants it this frame) */
  function ensure() { if (!usable()) return false; const d = data(); if (!d.ready) { try { step(1e9); } catch (e) { fail(e); return false; } } return d.ready; }

  /* ================= the pose ================= */
  /* the resting pose of a form at time t: unfolded by its form, breathing, its rings turning, its claws flexing */
  function idlePose(k, t, o) {
    o = o || {}; const br = Math.sin(t * 1.3);
    return { k, t, open: [0, 0.16, 0.62, 1][k], spread: 0, fold: 0, bob: 0.12 * Math.sin(t * 1.05) + 0.04 * Math.sin(t * 2.3), breath: br, bank: 0, pitch: 0, yaw: 0,
      arm: [{ swing: 0.06 * Math.sin(t * 0.9), raise: 0.04 * Math.sin(t * 1.1 + 1), ext: 0.2 + 0.06 * Math.sin(t * 0.7), claw: 0.05 * Math.sin(t * 1.4) }, { swing: 0.06 * Math.sin(t * 0.9 + 2), raise: 0.04 * Math.sin(t * 1.1 + 2.5), ext: 0.2 + 0.06 * Math.sin(t * 0.7 + 1), claw: 0.05 * Math.sin(t * 1.4 + 1.3) }],
      heart: 0.75 + 0.15 * Math.sin(t * 2.2), dark: 0, heartOut: 0, heartPos: null, ringK: 1, align: 0, alignAt: null, eye: 0.85 + 0.15 * Math.sin(t * 3.1), look: [0, 0], stagger: 0, hide: null, glow: 0 };
  }
  /* (v420 AP) its life: the layered secondary motion laid over any pose every frame (the menus, the fight, The Ninth Tide, the
     boss), so it never holds still: each arm's three segment groups and three forearm sleeves flexing in a wave running down the
     chain, the claws reaching, opening and closing and their finger blades pinching, all on their own incommensurate rhythms;
     the crescent blades and shoulder plates breathing and swaying; the tendrils curling with lag; a slow hover bob and drift
     with banking into the drift; the mask looking about; and every few seconds a flourish (a claw stretch on one side or the
     other, a flare of every blade, a turn of the halo with a lift of the head), each with its anticipation and its settle.
     P.live (0..1, default 1) scales all of it: a power's pose turns it down so the strike reads. Pure: also drives the cel model */
  const FLP = 4.6;   // (a flourish every FLP s: claw stretch R, blade flare, claw stretch L, halo turn)
  function life(P) {
    const t = (P && P.t) || 0, lv = P && P.live != null ? cl(P.live) : 1, s1 = Math.sin;
    const n = Math.floor((t + 2.1) / FLP), ft = t + 2.1 - n * FLP, typ = ((n % 4) + 4) % 4;
    // a flourish's shape: a small counter-move first (anticipation), the gesture, then a damped settle (follow-through)
    const pre = ft < 0.4 ? s1(Math.PI * ft / 0.4) : 0, main = sstep(0.3, 0.8, ft) * (1 - sstep(1.15, 1.85, ft)), set = ft > 1.5 && ft < 3 ? Math.exp(-(ft - 1.5) * 3.2) * s1((ft - 1.5) * 8) : 0;
    const L = { arm: [], sleeve: [[], []], up: [[], []], wing: [0, 0], flare: 0, sho: 0, bob: 0, dx: 0, bank: 0, pitch: 0, look: [0, 0], tenSway: 1, tenCurl: 0, ringPh: 0, heart: 0, edge: 0, typ, fl: main };
    for (let i = 0; i < 2; i++) { const f = i ? 2.3 : 0, st = (typ === 0 && i === 0) || (typ === 2 && i === 1) ? 1 : 0, fx = typ === 1 ? 1 : 0;
      L.arm.push({
        swing: (0.15 * s1(t * 0.73 + f) + 0.06 * s1(t * 1.71 + f * 1.3)) * lv + st * (0.15 * pre - 0.3 * main + 0.1 * set) - fx * 0.12 * main,
        raise: (0.14 * s1(t * 0.61 + f + 0.7) + 0.05 * s1(t * 1.37 + f)) * lv + st * (-0.1 * pre + 0.24 * main - 0.08 * set) + fx * 0.12 * main,
        ext: (0.26 * (0.5 + 0.5 * s1(t * 0.53 + f * 0.8)) + 0.06 * s1(t * 1.9 + f)) * lv + st * (-0.1 * pre + 0.45 * main + 0.08 * set),
        claw: (0.2 * s1(t * 0.97 + f + 1.1) + 0.06 * s1(t * 2.3 + f)) * lv + st * (-0.1 * pre + 0.22 * main - 0.08 * set) - fx * 0.15 * main,
        bend: (0.14 * s1(t * 0.81 + f + 0.4)) * lv + st * (0.2 * pre - 0.3 * main),
        pinch: (0.3 * s1(t * 1.13 + f * 1.7) + 0.1 * s1(t * 2.9 + f)) * lv + st * (-0.25 * pre + 0.6 * main - 0.2 * set) + fx * 0.3 * main });
      for (let j = 0; j < 3; j++) { L.up[i].push((0.075 * s1(t * 1.05 - j * 0.75 + f) + 0.03 * s1(t * 2.2 - j * 1.1 + f)) * lv + st * 0.06 * (main - pre) * (j + 1) / 3);
        L.sleeve[i].push((0.09 * s1(t * 1.21 - j * 0.65 + f + 1) + 0.03 * s1(t * 2.6 - j * 0.9)) * lv - st * 0.08 * main); } }
    L.wing = [(0.1 * s1(t * 0.83) + 0.04 * s1(t * 1.9 + 1)) * lv, (0.1 * s1(t * 0.79 + 2.2) + 0.04 * s1(t * 1.7 + 3)) * lv]; L.flare = (typ === 1 ? 0.42 * main - 0.1 * pre + 0.12 * set : 0.06 * main) * lv;
    L.sho = (0.06 * s1(t * 0.71 + 0.5)) * lv + (typ === 1 ? 0.25 * main + 0.08 * set : 0) * lv;
    L.edge = (typ === 1 ? 0.9 * main : st0(typ) * 0.5 * main) * lv;
    L.bob = (0.42 * s1(t * 0.92) + 0.1 * s1(t * 2.05 + 0.6)) * lv; L.dx = 0.34 * s1(t * 0.47) * lv; L.bank = (0.06 * Math.cos(t * 0.47) + 0.02 * s1(t * 1.3)) * lv; L.pitch = (0.03 * s1(t * 0.66 + 1) - (typ === 3 ? 0.05 * main : 0)) * lv;
    L.look = [(0.16 * s1(t * 0.37) + 0.06 * s1(t * 1.1) + (typ === 0 ? 0.2 : typ === 2 ? -0.2 : 0) * main) * lv, (0.1 * s1(t * 0.53 + 2) + (typ === 3 ? 0.35 * main : 0)) * lv];
    L.tenSway = 1 + 0.9 * lv; L.tenCurl = 0.1 * lv; L.ringPh = 1.6 * (Math.floor(Math.max(0, n) / 4) + (typ === 3 ? sstep(0.3, 1.8, ft) : 0));   // (summed over the flourishes so far: it never jumps back) L.heart = (typ === 3 ? 0.35 * main : 0.1 * main) * lv;
    return L;
  }
  const st0 = typ => (typ === 0 || typ === 2 ? 1 : 0);
  /* tendril springs kept on the instance: each tendril swings with inertia from the body's acceleration */
  function springs(inst, n, ax, ay, dt) {
    let S = inst.abTS; if (!S || S.length !== n * 4) S = inst.abTS = new Float32Array(n * 4);
    dt = Math.min(0.05, Math.max(0, dt || 0));
    for (let i = 0; i < n; i++) { const o = i * 4, kx = 26 + i * 1.7, dmp = 3.4;
      S[o + 1] += (-ax * 0.035 - S[o] * kx - S[o + 1] * dmp) * dt; S[o] += S[o + 1] * dt; S[o + 3] += (-ay * 0.03 - S[o + 2] * kx - S[o + 3] * dmp) * dt; S[o + 2] += S[o + 3] * dt;
      S[o] = Math.max(-0.6, Math.min(0.6, S[o])); S[o + 2] = Math.max(-0.6, Math.min(0.6, S[o + 2])); }
    return S;
  }

  /* ================= drawing ================= */
  const LW = norm([-0.5, 0.42, 0.78]), SBW = norm([-0.25, -0.3, 0.92]), RIMW = norm([0.6, -0.68, 0.4]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const RIMC = [0.6, 0.78, 1.45], AMBC = [1.42, 1.36, 1.26], OUTC = [0.018, 0.026, 0.07], GLCAP = 1600;
  const POOL = [], ITEMS = [], TRANS = []; let NP = 0;
  const item = () => { const g = POOL[NP] || (POOL[NP] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NP++; return g; };
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0 };
  /* the quality profile: High (the default), Medium (chosen by itself when its frames run long: the image drops toward 0.6 of the
     screen's resolution and comes back as they shorten: dynamic resolution) and Low (the game's lowFx: lighter meshes, fewer rings
     and tendrils, no outline, no carved runes; and the effects halve their particles) */
  const RES = { k: 1 }; const profile = () => (lowFx() ? 'low' : RES.k < 0.95 ? 'medium' : 'high');
  /* o: X, Y (the floor point under it, on screen), K (px a model unit), P (a pose; idlePose by default), k (form), alpha,
     ink (outline; default on), inst (an object to keep its springs on), dt. Returns screen points ({ heart, eye, head, halo,
     clawL, clawR (each { base, tip, edge: [[x, y] ...] }), wingTips, tenTips, bb, unit, heartR }) or null when it cannot draw */
  function draw(c, o) {
    const d = data(); if (!d.ready || NOGL) return null;
    try {
      const P = o.P || idlePose(o.k || 3, o.t || 0), k = P.k || o.k || 3, t = P.t || 0, s = o.scale || 1, sw = WS * s, K = o.K, kk = K / WS, X0 = o.X, Y0 = o.Y, M = D.M;
      const LF = life(P);   // (v420 AP: its life, laid over the pose)
      const yawR = rz((P.yaw || 0)), Rroot = mm([1, 0, 0, 0, 1, 0, 0, 0, 1.18], mm(yawR, mm(axisR([0, 1, 0], (P.bank || 0) + LF.bank), rx((P.pitch || 0) + LF.pitch))));   // (stood 18% taller: the camera looks down on it)
      const lift = (P.bob || 0) + (P.lift || 0) + LF.bob, ROOTO = [0, 0, 4.6], drx = LF.dx;   // (it banks and leans about its middle; v420 AP: it bobs and drifts as it hovers)
      const W3 = p => { const q = add(mv(Rroot, sub(p, ROOTO)), ROOTO); return [(q[0] + drx) * sw, q[1] * sw, (q[2] + lift) * sw]; };
      const SX = w => X0 + w[0] * kk, SY = w => Y0 + (w[1] * SE - w[2] * CE) * kk;
      const scr = p => { const w = W3(p); return [SX(w), SY(w)]; };
      ITEMS.length = 0; TRANS.length = 0; NP = 0; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      const box = (p, r) => { const w = W3(p), x = SX(w), y = SY(w), rr = r * K * s; if (x - rr < bx0) bx0 = x - rr; if (x + rr > bx1) bx1 = x + rr; if (y - rr < by0) by0 = y - rr; if (y + rr > by1) by1 = y + rr; };
      const glow = P.glow || 0, low = lowFx() || o.low;
      /* put a mesh: R (its turn in model space), T (its origin in model space), sc (its scale), glow, mirror (the left side) */
      const put = (mesh, R, T, sc, gl, mir, op) => { const g = item(); const Rm = mm(Rroot, mir ? mm(MX, R) : R), To = mir ? [-T[0], T[1], T[2]] : T, Tw = W3(To), z = sw * (sc || 1);
        for (let i = 0; i < 3; i++) { g.R0[i] = Rm[i * 3] * z; g.R1[i] = Rm[i * 3 + 1] * z; g.R2[i] = Rm[i * 3 + 2] * z; g.T[i] = Tw[i]; }
        g.mesh = mesh; g.alpha = op && op.alpha != null ? op.alpha : 1; g.glow = gl || 0; g.glow2 = op && op.glow2 || 0; g.spill = op && op.spill || 0; g.kind = op && op.kind || 0; g.wear = op && op.wear != null ? op.wear : 1; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = !(op && op.noInk);
        (g.alpha < 0.995 ? TRANS : ITEMS).push(g);
        if (mesh.bs) { const bs = mesh.bs, Rs = mir ? mm(MX, R) : R, c3 = add(To, mv(Rs, mul(bs, sc || 1))), sk = Math.max(Math.hypot(Rs[0], Rs[3], Rs[6]), Math.hypot(Rs[1], Rs[4], Rs[7]), Math.hypot(Rs[2], Rs[5], Rs[8])); box(c3, bs[3] * (sc || 1) * sk * 1.04 + 0.05); }
        return g; };
      const mirP = (p, mir) => (mir ? [-p[0], p[1], p[2]] : p);
      const open = cl(P.open == null ? 1 : P.open), unf = sstep(0.0, 1.0, open), br = (P.breath || 0) * 0.018, hide = P.hide || {};
      const kS = [0, 0.82, 0.92, 1][k];   // (the lesser forms' limbs are smaller)
      /* the body */
      put(M.body, [1 + br, 0, 0, 0, 1 + br, 0, 0, 0, 1], [0, 0, 0], 1, glow); box([0, 0, 5.2], 3.3);
      if (k >= 2) put(M.gear, axisR([0, 1, 0], t * 0.3 * (P.ringK || 1)), [0, -0.72, 6.75], 0.75 + 0.25 * (k - 2), glow, false);   // (the back's mechanism turns slowly)
      put(M.neck, I3, [0, 0, 0], 1, glow);
      /* the head: it looks about and nods; the stagger throws it back */
      const look = [((P.look && P.look[0]) || 0) + LF.look[0], ((P.look && P.look[1]) || 0) + LF.look[1]], Rh = mm(rz(look[0] * 0.5), rx(-(look[1] || 0) * 0.3 - (P.stagger || 0) * 0.35));
      put(M.head, Rh, HEAD, 1.42, glow, false, { glow2: P.eye == null ? 1 : P.eye });
      const eyeP = add(HEAD, mv(Rh, [0, 1.05, 0.25])), headTop = add(HEAD, mv(Rh, [0, 0, 2.7]));
      /* the Lunar Heart */
      const hp = P.heartPos ? lerp3(HEART, P.heartPos, sstep(0, 1, P.heartOut || 0)) : HEART, hs = HEARTS * (1 + (P.heartGrow || 0)), hsp = t * 0.35;
      put(M.moon, rz(hsp), hp, hs * 1.12, (P.heart || 0) + LF.heart + 0.3, false, { glow2: P.dark || 0, kind: 1, noInk: true });
      put(M.water, mm(rz(-t * 0.6), rx(0.3)), hp, hs, P.heart || 0, false, { alpha: 0.99, glow2: P.dark || 0, noInk: true });
      put(M.glass, I3, hp, hs, P.heart || 0, false, { alpha: 0.99, glow2: P.dark || 0, noInk: true });
      if (!(P.heartOut > 0.5)) put(M.frame, I3, HEART, HEARTS, glow);
      for (let i = 0; i < (k >= 3 ? 2 : 1); i++) put(M.fil, mm(axisR([Math.sin(i * 2.1), Math.cos(i * 2.1), 0.4], 1.1 + i * 0.7), rz(t * (1.6 - i * 0.5) * (P.ringK || 1))), hp, hs * (1 + i * 0.12), 0.5 + (P.heart || 0) * 0.5, false, { noInk: true });
      box(hp, 1.5 * hs);
      /* the halo: each ring on its own axis, turning at its own speed, its axis precessing; align gathers them into one
         concentric glyph facing the viewer about alignAt */
      const nr = Math.min(RINGS.length, (NRING[k] || 4) - (low && k === 3 ? 2 : 0)), al = sstep(0, 1, P.align || 0), rk = P.ringK || 1, hc0 = add(HALO, [0, 0, 0]), hc1 = P.alignAt || hp;
      for (let i = 0; i < nr; i++) { const R0 = RINGS[i], ph = t * R0.sp * rk * (1 + al * 2.5) + i * 1.7 + ((P.ringPh || 0) + LF.ringPh * (0.4 + (i % 3) * 0.3)) * (i % 2 ? 1 : -1), pr = Math.sin(t * 0.5 + i) * R0.pr * 6;
        const tx = lerp(R0.tx + pr * 0.2, Math.PI / 2, al), ty = lerp(R0.ty + pr * 0.1, 0, al), Rt = mm(mm(ry(ty), rx(tx)), rz(ph));
        const cen = lerp3(add(hc0, R0.c), hc1, al), sc = lerp(1, 0.45 + i * 0.16, al);
        put(M.rings[i], Rt, cen, sc, glow + (P.ringGlow || 0), false, { alpha: R0.s === 3 ? 0.99 : 1, noInk: true, kind: i });
        if (i === 0 || i === 4 || i === 9) box(cen, R0.R * sc + 0.2); }
      if (k >= 2 && !hide.spear) put(M.spear, Rh, add(HALO, [0, -0.05, 0.1]), k === 3 ? 1 : 0.8, glow + 0.4, false, { noInk: true });
      /* the shoulder carapace: rises and settles with the breath, closes over the body when folded */
      const fold = cl(P.fold || 0), spread = P.spread || 0;
      for (const mir of [false, true]) {
        const ns = NSHO[k] || 1;
        for (let i = ns - 1; i >= 0; i--) { const a = 0.06 * Math.sin(t * 0.8 + i + (mir ? 1.3 : 0)) + LF.sho * (1 + i * 0.3) * unf - fold * (0.5 + i * 0.15) + spread * 0.25 * (1 + i * 0.2) - (1 - unf) * 0.5, R = mm(axisR([0, 1, 0.15], -a), rz(-fold * 0.3 + i * 0.08));
          put(M.sho[i], R, add(SHO, [0, -i * 0.05, br * 6]), kS * (1 - 0.55 * sstep(0.3, 1, 1 - open)), glow, mir); }
        box(mirP([2.2, 0, 9.8], mir), 1.2);
      }
      /* the wings: hung from the back of each shoulder; spread lifts them out toward a ring, fold wraps them round the body */
      const nw = NWING[k] || 0;
      for (const mir of [false, true]) for (let i = nw - 1; i >= 0; i--) {
        const sp = spread * (i ? 0.4 : 0.9) + LF.flare * (i ? 0.8 : 1), fl = fold, wv = 0.05 * Math.sin(t * 1.1 + i * 0.8 + (mir ? 2 : 0)) + LF.wing[mir ? 1 : 0] * (i ? 1.4 : 1);
        const R = mm(rz(-fl * 0.6 + sp * 0.15), axisR([0, 1, 0], (wv - (i ? 0.1 : 0.32) - sp * 0.7 + fl * 0.5) * unf + (1 - unf) * 0.8));   // (the inner crescents fanned out, apart from the outer)
        put(M.wing[i], R, i ? [0.62, 0.12, 4.55] : [0.95, -0.42, 7.0], kS * (0.25 + 0.75 * unf), glow, mir);
      }
      /* the arms and claws: swing (forward about z), raise (about the arm's forward axis), telescoping forearm, claw opening */
      const out = { eyes: [], clawL: null, clawR: null, wingTips: [], tenTips: [] };
      for (const mir of [false, true]) {
        const A0 = (P.arm && P.arm[mir ? 1 : 0]) || {}, sideK = (1 - unf) * 0.55 + fold * 0.7;
        if (hide.arms) continue;
        // (v420 AP: its life on the arm, damped while it is folded into its shell)
        const sd = mir ? 1 : 0, la = LF.arm[sd], lk = unf * (1 - fold * 0.8), A = { swing: (A0.swing || 0) + la.swing * lk, raise: (A0.raise || 0) + la.raise * lk, ext: cl((A0.ext == null ? 0.2 : A0.ext) + la.ext * lk), claw: (A0.claw || 0) + la.claw * lk, bend: (A0.bend || 0) + la.bend * lk, edge: (A0.edge || 0) + LF.edge * 0.4, clawS: A0.clawS, clawHide: A0.clawHide, pinch: (A0.pinch || 0) + la.pinch * lk };
        const Ra = rz((A.swing || 0) + sideK * 0.25), Rr = mm(Ra, axisR([0, 1, 0], -(A.raise || 0) - LF.up[sd][0] * lk + 0.3 + sideK * 0.95));   // (the arms angle down and out to the claws)
        const so = add(SHO, [0, 0, br * 6]); let Ru = Rr, pu = so;
        for (let g2 = 0; g2 < 3; g2++) { if (g2) { pu = add(pu, mv(Ru, [(UPX[g2] - UPX[g2 - 1]) * kS, 0, 0])); const fx = LF.up[sd][g2] * lk; Ru = mm(Ru, mm(axisR([0, 1, 0], fx), rz(fx * 0.55))); } put(M.upper[g2], Ru, pu, kS, glow, mir); }
        const elb = add(pu, mv(Ru, [(ELB - UPX[2]) * kS, 0, 0])), Rf = mm(Ru, axisR([0, 1, 0], 0.22 - (A.bend || 0))), fl = (FORE0 + (FORE1 - FORE0) * cl(A.ext == null ? 0.2 : A.ext)) * kS;
        // the three sleeves: each slides out over the last (v420 AP: each turned a little on the last: the forearm curls and flexes)
        let Rs = Rf, ps = elb; const sl = LF.sleeve[sd];
        for (let j = 0; j < 3; j++) { if (j) ps = add(ps, mv(Rs, [fl / 3 * 0.96, 0, 0])); const fx = sl[j] * lk; Rs = mm(Rs, mm(axisR([0, 1, 0], fx), rz(fx * 0.6))); const Ls = (fl / 3 + 0.12) / kS; put(M.sleeve[j], mm(Rs, [Ls, 0, 0, 0, 1, 0, 0, 0, 1]), ps, kS, glow, mir); }
        const wr = add(ps, mv(Rs, [fl * (1 - 0.64) + 0.05, 0, 0])); put(M.wrist, Rs, wr, kS, glow, mir);
        const Rc = mm(Rs, axisR([0, 1, 0], -0.5 + (A.claw || 0) + fold * 0.6 + (1 - unf) * 0.35)), csz = kS * (A.clawS || 1);
        if (!(A.clawHide)) { put(M.claw, Rc, wr, csz, glow + (A.edge || 0), mir, { glow2: A.edge || 0 });
          if (k >= 3) { const Rb0 = mm(Rc, mm(rx(Math.PI / 2), rz(-1.1))), Rb = mm(Rc, mm(rx(Math.PI / 2), rz(-1.1 + (A.pinch || 0)))), piv = [-1.1 * csz * 0.55, 0, 0];   // (the finger blade opens and closes about its root: a pincer)
            put(M.blade, Rb, add(add(wr, mv(Rc, [0.35, 0.12, -0.6])), sub(mv(Rb0, piv), mv(Rb, piv))), csz * 0.55, glow, mir); } }
        const tipM = add(wr, mv(Rc, mul(CLAWC[0], csz))), hookM = add(wr, mv(Rc, mul(CLAWC[3], csz)));
        const edge = []; for (let j = 0; j <= 8; j++) { const u = 0.04 + j / 8 * 0.9; edge.push(scr(mirP(add(wr, mv(Rc, mul(clawArc(u), csz))), mir))); }
        const cw = { base: scr(mirP(wr, mir)), tip: scr(mirP(tipM, mir)), hook: scr(mirP(hookM, mir)), edge, elbow: scr(mirP(elb, mir)) };
        if (mir) out.clawL = cw; else out.clawR = cw;
        box(mirP(add(wr, mv(Rc, mul([0.8, 0.1, -2.0], csz))), mir), 4.3 * csz);
      }
      /* the tendrils: chains hanging from the pelvis ring, each joint swinging with its spring and the idle sway */
      const ntn = (NTEN[k] || 4) - (low ? 2 : 0), dt = o.dt == null ? 0 : o.dt, S2 = o.inst && o.inst.abTS && o.inst.abTS.length >= ntn * 4 ? o.inst.abTS : null, segN = low ? 4 : NSEG;
      for (let i = 0; i < ntn; i++) { const T0 = TEN[i], dir = [Math.cos(T0.a), Math.sin(T0.a), 0], Ls = T0.L * 1.3 * (k === 1 ? 0.7 : k === 2 ? 0.85 : 1) / segN, side = norm(cross([0, 0, 1], dir));
        let p = add(PELV, mul(dir, 0.72)); p[2] -= 0.05; let R = I3;
        const sx = S2 ? S2[i * 4] : 0, sy = S2 ? S2[i * 4 + 2] : 0;
        for (let j = 0; j < segN; j++) { const u = j / (segN - 1), sway = 0.07 * LF.tenSway * Math.sin(t * 1.3 - j * 0.55 + i * 1.7) + (P.tenK || 0) * 0.1 * Math.sin(t * 7 + j + i),
            bend = (j === 0 ? T0.lean : 0) + LF.tenCurl * Math.sin(t * 1.07 - j * 0.8 + i * 1.3) * (0.5 + u) + (u < 0.5 ? 0.05 : -T0.curl * 0.32) * (1 - fold * 0.5) + fold * 0.12 + (P.tenUp || 0) * (j === 0 ? -1.2 : 0.1);
          R = mm(R, mm(axisR(side, -bend), axisR(dir, sway + sx * (0.3 + u * 0.4)))); R = mm(R, axisR([1, 0, 0], sy * 0.25 * (j === 0 ? 1 : 0.3)));
          const sc = Ls * (1 - u * 0.35), Rseg = mm(R, rz(T0.a - Math.PI / 2));
          put(j === segN - 1 ? M.tip : M.seg, Rseg, p, j === segN - 1 ? sc * 1.1 : sc, glow, false);
          p = add(p, mv(R, [0, 0, -sc * (j === segN - 1 ? 1.25 : 1)])); }
        out.tenTips.push(scr(p)); box(p, 0.6);
      }
      /* the lunar shell: ten petals; open 0 closes them into a sphere round the body, opening slides them back round
         behind it and shrinks them away */
      const shellK = 1 - open;
      if (shellK > 0.004 && !hide.shell) {
        const Rsh = (k === 1 ? 2.5 : 3.15) * (P.shellS || 1), cen = add(SHELLC, [0, 0, k === 1 ? -0.85 : 0]);
        for (let j = 0; j < NPET; j++) { const lag = cl(shellK * 1.25 - (j % 5) * 0.05), e = sstep(0, 1, lag), ph = j / NPET * TAU, back = Math.PI + (j - NPET / 2 + 0.5) * 0.14, phi = lerp(back, ph, e);
          const R = mm(rz(phi + (P.shellSpin || 0)), rx((1 - e) * 0.35)), sc = Rsh * (0.55 + 0.45 * e);
          put(M.petal, R, cen, sc, glow + (P.seam || 0), false, { glow2: P.seam || 0 }); }
        if (shellK > 0.7 && k > 1) { put(M.cap, rz(t * 0.1), cen, Rsh, glow, false); }
        box(cen, Rsh + 0.2);
      }
      if (!(bx1 > bx0) || !ITEMS.length) return null;
      for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__AB_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : RES.k) * (typeof GQ !== 'undefined' ? GQ.animaK() : 1);   /* (v439 SP: the visual quality's factor in a fight, 3/4 under Fewer effects) */
      bx0 = Math.floor(bx0) - 3; by0 = Math.floor(by0) - 3; bx1 = Math.ceil(bx1) + 3; by1 = Math.ceil(by1) + 3;
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      const bw = bx1 - bx0, bh = by1 - by0;
      const S = { px: PXW, py: PYW, pd: PDW, cl: [2 * kk / bw, 2 * (X0 - bx0) / bw - 1, -2 * kk / bh, 1 - 2 * (Y0 - by0) / bh], v: PDW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low, rim: o.rim || RIMC, amb: o.amb || AMBC, t: nowMs() / 1000 % 1000,
        outline: o.ink === false || low ? 0 : Math.max(0.6, 0.7 * (W / bw)), outlineCol: OUTC, outlineBias: 0.0025, clip: null };
      const t0 = nowMs(), cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return null;
      const alp = o.alpha == null ? 1 : o.alpha; if (alp > 0.004) { c.save(); c.globalAlpha = Math.min(1, alp); c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; if (!GLM.soft && STATS.n > 20) RES.k = STATS.ms > 7 ? Math.max(0.6, RES.k - 0.02) : STATS.ms < 3.5 ? Math.min(1, RES.k + 0.01) : RES.k; STATS.items = ITEMS.length; STATS.W = W; STATS.H = H;
      out.bb = [bx0, by0, bx1, by1]; out.unit = K * s; out.heart = scr(hp); out.heartR = 0.96 * hs * K * s; out.eye = scr(eyeP); out.head = scr(HEAD); out.halo = scr(HALO); out.top = scr(headTop); out.pelvis = scr(PELV); out.spineTip = scr([0, 0.05, -0.6]); out.gear = scr([0, -0.75, 6.75]);
      out.shell = scr(add(SHELLC, [0, 0, k === 1 ? -0.85 : 0])); out.shellR = (k === 1 ? 2.5 : 3.15) * K * s;
      return out;
    } catch (e) { fail(e); return null; }
  }
  /* AnimaArt's route: an Anima at (x, y) (its feet), size px tall, at time t (menus, stills, the summon button, the fight).
     o.abP (a pose from the fight) or the form's idle; o.flip / o.fk turn it a little toward its heading. True when drawn */
  function drawAnima(c, k, x, y, size, t, o) {
    o = o || {}; if (!ensure()) return false;
    const ip = o.inst && o.inst.abP, P = o.abP || ip || idlePose(k, t), fk = o.fk != null ? o.fk : o.flip ? -1 : 1; if (!o.abP && !ip) P.yaw = fk * -0.12;
    const K = size / (k === 1 ? 8.6 : k === 2 ? 10.4 : 11.6);   // (px a model unit: each form fills about `size`)
    const r = draw(c, { X: x, Y: y, K, P, k: P.k || k, alpha: o.alpha == null ? 1 : o.alpha, inst: o.inst });
    if (o.out) o.out.r = r; if (o.inst && ip) o.inst.abOut = { r };
    if (r && !ip && !o.abP && o.light !== false && size >= 60) heartLight(c, r, P, o.alpha == null ? 1 : o.alpha);   // (v420 AP: the Heart's glow in the menus too; in a fight 20g2's bodyLight lays it)
    return !!r;
  }
  /* (v420 AP) the Lunar Heart's light on the shared GPU painter (FGFX kind 132: core, limb, water-light, feathered bloom, pulse),
     for a still or a menu portrait; nothing when the painter is not there */
  function heartLight(c, r, P, al) {
    try { const N = typeof self !== 'undefined' && self.NIDHOGG_MOVES, F = N && N.FGFX; if (!F || !F.usable()) return false;
      const hb = Math.min(3, P.heart || 0.8), ch = cl((hb - 0.95) / 1.6), t = P.t || 0, pl = 0.5 + 0.5 * Math.sin(t * 2.2), hR = Math.min(r.heartR, r.unit * 1.7), Rq = hR * 3.4, dk = cl(P.dark || 0);
      F.flush(c); const Q = F.begin(c, null); Q.glow(r.heart[0], r.heart[1], hR * 4.2, '#6FA2FF', (0.16 + 0.14 * ch + 0.05 * pl) * al * (1 - dk * 0.6)); Q.quad(132, r.heart[0], r.heart[1], Rq, 0, 0, Rq, '#6FA2FF', al * (1 - dk * 0.85), hR / Rq * 0.92, pl, 0.72 + 0.3 * ch);
      F.flush(c); F.begin(c, null); return true; } catch (e) { return false; }
  }
  /* parts drawn on their own in screen space (one GLM pass): the Crescent Reavers' blades ({ x, y, rot, tilt, s px, a, b }) and the
     Ninth Tide's sea ({ m: 'helix' | 'canopy' | 'orb', X, Y (its foot / centre), r px, h px, ph, a }). World units are px / 100;
     y runs down the screen, z toward the viewer */
  const SV = [0, 0, 1], SUP = [0, -1, 0], SLK = norm([-0.45, -0.62, 0.65]), SLS = norm([-0.2, -0.85, 0.5]), SLR = norm([0.65, 0.45, -0.2]), PX2 = [1, 0, 0], PY2 = [0, 1, 0], PD2 = [0, 0, 1];
  function screenPass(c, list, put, pad) {
    const d = data(); if (!d.ready || NOGL || !list.length) return false;
    try { ITEMS.length = 0; TRANS.length = 0; NP = 0; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const box = (x, y, r) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
      const add2 = (mesh, cols, T, al, gl, g2, kind) => { const g = item(); for (let i = 0; i < 3; i++) { g.R0[i] = cols[0][i] * 0.01; g.R1[i] = cols[1][i] * 0.01; g.R2[i] = cols[2][i] * 0.01; g.T[i] = T[i] * 0.01; }
        g.mesh = mesh; g.alpha = al; g.glow = gl || 0; g.glow2 = g2 || 0; g.spill = 0; g.kind = kind || 0; g.wear = 1; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = true; (al < 0.995 ? TRANS : ITEMS).push(g); };
      for (const e of list) put(e, add2, box);
      if (!(x1 > x0) || !(ITEMS.length + TRANS.length)) return false; for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__AB_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (pad || 1) * (typeof GQ !== 'undefined' ? GQ.partsK() : 1);   /* (v439 SP) */
      x0 = Math.floor(x0) - 2; y0 = Math.floor(y0) - 2; x1 = Math.ceil(x1) + 2; y1 = Math.ceil(y1) + 2; const bw = x1 - x0, bh = y1 - y0;
      let W = Math.ceil(bw * dev), H = Math.ceil(bh * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      const S = { px: PX2, py: PY2, pd: PD2, cl: [200 / bw, -2 * x0 / bw - 1, -200 / bh, 1 + 2 * y0 / bh], v: SV, lk: SLK, ls: SLS, lr: SLR, up: SUP, low: lowFx(), rim: RIMC, amb: AMBC, t: nowMs() / 1000 % 1000, outline: Math.max(0.5, 0.6 * (W / bw)), outlineCol: OUTC, outlineBias: 0.002 };
      const cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return false; c.save(); c.drawImage(cvs, 0, 0, W, H, x0, y0, bw, bh); c.restore(); return true;
    } catch (e) { fail(e); return false; }
  }
  function drawParts(c, blades) { const M = D && D.M; if (!M) return false;
    return screenPass(c, blades, (e, put, box) => { const cr = Math.cos(e.rot), sr = Math.sin(e.rot), ct = Math.cos(e.tilt || 0) * 0.8 + 0.2, s = e.s;
      // the blade (its plate in its own x-y) faces the viewer, turned in the screen by rot, leaning by tilt
      put(M.blade, [[cr * s, sr * s, 0], [-sr * s * ct, cr * s * ct, s * 0.6], [0, -s * 0.5, s * ct]], [e.x, e.y, 30], 0.99 * e.a > 0.98 ? 1 : Math.max(0.01, e.a), 0.6, 1.2); box(e.x, e.y, s * 1.6); }); }
  function drawSea(c, list, t) { const M = D && D.M; if (!M) return false;
    return screenPass(c, list, (e, put, box) => {
      if (e.m === 'helix') { const r = e.r, h = Math.max(1, e.h), cp = Math.cos(e.ph), sp = Math.sin(e.ph); put(M.helix, [[r * cp, r * sp * 0.55, -r * sp * 0.3], [-r * sp, r * cp * 0.55, r * cp * 0.3], [0, -h, 0]], [e.X, e.Y, 0], e.a, 0.5, 0, e.i || 0); box(e.X, e.Y - h / 2, Math.max(r, h / 2) + 4); }
      else if (e.m === 'canopy') { const r = e.r; put(M.canopy, [[r, 0, 0], [0, r * 0.5, r * 0.4], [0, r * 0.55, 0]], [e.X, e.Y, -40], e.a, 0.6, 0, 3); box(e.X, e.Y, r + 4); }
      else { const r = e.r; put(M.orb, [[r, 0, 0], [0, 0, r], [0, -r, 0]], [e.X, e.Y, 60], e.a, 1.2, 0, 5); box(e.X, e.Y, r + 4); } }); }
  if (typeof window !== 'undefined') setTimeout(() => { try { warm(); } catch (e) {} }, 1200);   // (prepared at load, in idle time)
  return { usable, warm, ensure, step, draw, drawAnima, idlePose, life /* v420 AP */, heartLight /* v420 AP */, springs, drawParts, drawSea, profile, RES, ready: () => !!(D && D.ready), get up() { return !!(D && D.up); }, STATS, RINGS, MT, WS, get nv() { return D ? D.nv : 0; }, get off() { return NOGL; } };
})();
if (typeof self !== 'undefined') self.ABADDON_GL = ABADDON_GL;
