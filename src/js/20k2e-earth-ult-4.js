/* ---------- Earth, reworked: Cataclysm ----------
   One enormous round boulder threaded with glowing ember veins falls from the sky onto the monsters and bounces across
   them, then shatters into ember crystals that explode.
   Impacts (required): 1 at level 1, 2 at Adept (level 4), 3 at Celestial (level 7), the first landing counted as number
   one (levels between hold: 1 1 1 2 2 2 3). The landing spot is marked first: a widening amber circle and small pebbles
   rising off the floor. The rock comes into view high above, accelerates down while its shadow grows and darkens; each
   landing deals its own Earth hit (kb 5, stun 0.35), drives a thick dust ring over the floor, flashes the veins and
   throws a few heavy chips. A non-final landing rebounds in one continuous ballistic arc (apex 3.0 then 2.3 tiles, lower
   than the fall) onto the next monster (the nearest one not yet struck, else any other, else back onto the same area).
   The rock rotates rigidly the whole time. On the final landing its fissures open (0.24 s), the shell separates into
   chunky pieces (cosmetic) and ember crystals (6 7 9 10 11 13 14 by level) scatter in short arcs round the impact (half
   of them aimed at monsters nearby); each lands, glows intensely ~0.6 s and explodes into golden splinters with its own
   small Earth hit (radius 0.9 K). An enemy can take several crystal hits when their real areas overlap.
   Damage (DK = base x K x evoK): each landing 6.5 DK, the final landing 7.5 DK, each crystal 1.6 DK. A monster at the
   final landing typically takes the landing plus about 3 crystals (~12.3 DK at level 1); at Celestial one struck by two
   landings plus its crystals ~20 DK.
   The models are real ray-cast 3D: the boulder is a convex polyhedron (18 large planes, 26 small corner-cutting ones)
   ray-cast per pixel through the game's oblique view (heights 1:1, the floor squashed 0.55), with bevelled facet edges,
   object-space noise bump and texture, soft cel bands, a warm amber bounce rim, recessed ember veins (some facet edges,
   a branching noise network, and the seams between the shell pieces) and a separate emissive layer with a baked halo,
   rendered once per rotation bucket (16) and cached. The shell pieces are cut from the same render along those seams,
   so the shatter opens the very fissures that glowed. The crystals are hexagonal prisms with irregular pyramid tips,
   ray-cast the same way (honey inner planes from the back facets, thickness-driven glow, pale gold edges, specular,
   ink). The kit (EARTHC) is shared with Crystal Coronation (20k2f). Floor marks are light only; every edge feathered. */
const EARTHC = (() => {
  const TAU = Math.PI * 2, GY = 0.55;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  // a permutation lattice (fast, positive coordinates only: everything is offset by 512)
  const PERM = new Uint16Array(1024), V1 = new Float32Array(256), V2 = new Float32Array(256), V3 = new Float32Array(256);
  { const p = []; for (let i = 0; i < 256; i++) p.push(i); for (let i = 255; i > 0; i--) { const j = Math.floor(R1(i * 3.7 + 11) * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; } for (let i = 0; i < 1024; i++) PERM[i] = p[i & 255]; for (let i = 0; i < 256; i++) { V1[i] = R1(i * 1.618 + 0.5); V2[i] = R1(i * 2.71 + 3.1); V3[i] = R1(i * 0.577 + 7.3); } }
  const h3 = (i, j, k) => V1[PERM[PERM[PERM[i & 255] + (j & 255)] + (k & 255)]];
  function vn3(x, y, z) {
    x += 512; y += 512; z += 512; const i = x | 0, j = y | 0, k = z | 0, fx = x - i, fy = y - j, fz = z - k, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
    const I = i & 255, J = j & 255, Kk = k & 255, A = PERM[I] + J, B = PERM[I + 1] + J, AA = PERM[A] + Kk, AB = PERM[A + 1] + Kk, BA = PERM[B] + Kk, BB = PERM[B + 1] + Kk;
    const a = V1[PERM[AA]], b = V1[PERM[BA]], c = V1[PERM[AB]], d = V1[PERM[BB]], e = V1[PERM[AA + 1]], f = V1[PERM[BA + 1]], g = V1[PERM[AB + 1]], h = V1[PERM[BB + 1]];
    const x0 = a + (b - a) * ux, x1 = c + (d - c) * ux, x2 = e + (f - e) * ux, x3 = g + (h - g) * ux, y0 = x0 + (x1 - x0) * uy, y1 = x2 + (x3 - x2) * uy; return y0 + (y1 - y0) * uz; }
  // value noise with its gradient (into G3)
  const G3 = [0, 0, 0];
  function vn3d(x, y, z) {
    x += 512; y += 512; z += 512; const i = x | 0, j = y | 0, k = z | 0, fx = x - i, fy = y - j, fz = z - k, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz), dx = 6 * fx * (1 - fx), dy = 6 * fy * (1 - fy), dz = 6 * fz * (1 - fz);
    const I = i & 255, J = j & 255, Kk = k & 255, A = PERM[I] + J, B = PERM[I + 1] + J, AA = PERM[A] + Kk, AB = PERM[A + 1] + Kk, BA = PERM[B] + Kk, BB = PERM[B + 1] + Kk;
    const a = V1[PERM[AA]], b = V1[PERM[BA]], c = V1[PERM[AB]], d = V1[PERM[BB]], e = V1[PERM[AA + 1]], f = V1[PERM[BA + 1]], g = V1[PERM[AB + 1]], h = V1[PERM[BB + 1]];
    const k1 = b - a, k2 = c - a, k3 = e - a, k4 = a - b - c + d, k5 = a - c - e + g, k6 = a - b - e + f, k7 = -a + b + c - d + e - f - g + h;
    G3[0] = dx * (k1 + k4 * uy + k6 * uz + k7 * uy * uz); G3[1] = dy * (k2 + k5 * uz + k4 * ux + k7 * uz * ux); G3[2] = dz * (k3 + k6 * ux + k5 * uy + k7 * ux * uy);
    return a + k1 * ux + k2 * uy + k3 * uz + k4 * ux * uy + k5 * uy * uz + k6 * uz * ux + k7 * ux * uy * uz; }
  // cellular noise: the gap between the nearest and second nearest feature points (small along the cell walls)
  function vor3(x, y, z) { x += 512; y += 512; z += 512; const i = x | 0, j = y | 0, k = z | 0; let f1 = 9, f2 = 9;
    for (let c = -1; c <= 1; c++) for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const I = i + a, J = j + b, Kk = k + c, hh = PERM[PERM[PERM[I & 255] + (J & 255)] + (Kk & 255)], dx = I + 0.1 + 0.8 * V1[hh] - x, dy = J + 0.1 + 0.8 * V2[hh] - y, dz = Kk + 0.1 + 0.8 * V3[hh] - z, d = dx * dx + dy * dy + dz * dz;
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
    return Math.sqrt(f2) - Math.sqrt(f1); }
  const nrm = v => { const k = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / k, v[1] / k, v[2] / k]; };
  function rotAxis(ax, an) { const [x, y, z] = nrm(ax), c = Math.cos(an), s = Math.sin(an), t = 1 - c; return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c]; }
  const mmul = (A, B) => { const R = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; };
  const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, w); cv.height = Math.max(1, h); return cv; };
  /* the view: world x right, y toward the viewer (down the screen), z up; screen X = x, Y = y * GY - z (the game's
     convention: heights 1:1, the floor squashed). A world step of (0, 1, GY) keeps the screen point, so that is the ray. */
  const LIT = nrm([-0.55, 0.5, 0.78]), VIEW = nrm([0, 0.84, 0.55]), HV = nrm([LIT[0] + VIEW[0], LIT[1] + VIEW[1], LIT[2] + VIEW[2]]), RAYK = Math.hypot(1, GY);
  function prep(pl) { const n = pl.length, F = () => new Float64Array(n), P = { n, NX: F(), NY: F(), NZ: F(), D: F(), A: F(), GX: F(), GZ: F() };
    pl.forEach((p, k) => { P.NX[k] = p.n[0]; P.NY[k] = p.n[1]; P.NZ[k] = p.n[2]; P.D[k] = p.d; const a = p.n[1] + p.n[2] * GY; P.A[k] = a; P.GX[k] = Math.abs(a) > 1e-5 ? -p.n[0] / a : 0; P.GZ[k] = Math.abs(a) > 1e-5 ? p.n[2] / a : 0; }); return P; }
  /* one ray through a convex polyhedron (the intersection of half-spaces n.p <= d): the front face, the next face (for
     the edge distance), the back face, the depth through it, the distance to the silhouette and to the nearest edge (px) */
  const O = { i1: 0, i2: -1, jl: 0, y: 0, th: 0, sil: 0, ed: 0 };
  function cast(P, sx, sy, S) {
    let u1 = 1e9, i1 = -1, u2 = 1e9, i2 = -1, lo = -1e9, jl = -1; const NX = P.NX, NZ = P.NZ, D = P.D, A = P.A;
    for (let k = 0; k < P.n; k++) { const a = A[k], r = D[k] - NX[k] * sx + NZ[k] * sy;
      if (a > 1e-5) { const v = r / a; if (v < u1) { u2 = u1; i2 = i1; u1 = v; i1 = k; } else if (v < u2) { u2 = v; i2 = k; } }
      else if (a < -1e-5) { const v = r / a; if (v > lo) { lo = v; jl = k; } }
      else if (r < 0) return false; }
    if (i1 < 0 || jl < 0) return false;
    const gs = Math.min(6, Math.hypot(P.GX[i1] - P.GX[jl], P.GZ[i1] - P.GZ[jl])) || 1; O.sil = (u1 - lo) / gs * S;
    if (i2 >= 0) { const ge = Math.hypot(P.GX[i2] - P.GX[i1], P.GZ[i2] - P.GZ[i1]) || 1; O.ed = (u2 - u1) / ge * S; } else O.ed = 1e9;
    O.i1 = i1; O.i2 = i2; O.jl = jl; O.y = u1; O.th = (u1 - lo) * RAYK; return true; }
  // a separable box blur (two passes), in place
  function blur(A, W, Hh, r) { const tmp = new Float32Array(W * Hh);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < Hh; y++) { let acc = 0; const o = y * W; for (let x = -r; x < W + r; x++) { if (x + r < W) acc += A[o + Math.min(W - 1, x + r)]; if (x - r - 1 >= 0) acc -= A[o + x - r - 1]; if (x >= 0 && x < W) tmp[o + x] = acc / (2 * r + 1); } }
      for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y < Hh + r; y++) { if (y + r < Hh) acc += tmp[Math.min(Hh - 1, y + r) * W + x]; if (y - r - 1 >= 0) acc -= tmp[(y - r - 1) * W + x]; if (y >= 0 && y < Hh) A[y * W + x] = acc / (2 * r + 1); } } } }
  // emissive -> an additive canvas: amber, honey, ember-core white by intensity, with a soft halo round it
  function glowCanvas(E, W, Hh, r, halo) { const B = E.slice(); blur(B, W, Hh, r); const cv = mk(W, Hh), g = cv.getContext('2d'), im = g.createImageData(W, Hh), d = im.data;
    for (let i = 0, o = 0; i < W * Hh; i++, o += 4) { const e = E[i], a = cl(e + halo * B[i]); if (a < 0.004) continue; const k = cl(e * 1.15);
      d[o] = 217 + 38 * sm(k * 2); d[o + 1] = k < 0.5 ? 138 + 69 * sm(k * 2) : 207 + 37 * sm(k * 2 - 1); d[o + 2] = k < 0.5 ? 30 + 62 * sm(k * 2) : 92 + 122 * sm(k * 2 - 1); d[o + 3] = a * 255; }
    g.putImageData(im, 0, 0); return cv; }

  /* ---- the boulder: a rough convex polyhedron; the shell's seams are a Voronoi on its directions ---- */
  function rockModel(seed, nCh, small) {
    const pl = [], NBIG = small ? 9 : 18, NSM = small ? 4 : 18;
    for (let i = 0; i < NBIG; i++) { const yy = 1 - (i + 0.5) / NBIG * 2, rr = Math.sqrt(1 - yy * yy), th = i * 2.39996 + R1(seed + i) * 0.6;
      pl.push({ n: nrm([Math.cos(th) * rr + (R1(seed + i * 3.1) - 0.5) * 0.3, yy + (R1(seed + i * 4.3) - 0.5) * 0.3, Math.sin(th) * rr + (R1(seed + i * 5.9) - 0.5) * 0.3]), d: (small ? 0.8 : 0.88) + 0.1 * R1(seed + i * 7.7) }); }
    for (let i = 0; i < NSM; i++) { const n = nrm([R1(seed + 100 + i) - 0.5, R1(seed + 200 + i * 1.3) - 0.5, R1(seed + 300 + i * 1.7) - 0.5]); pl.push({ n, d: 0.95 + 0.07 * R1(seed + 400 + i) }); }
    const ch = []; for (let i = 0; i < nCh; i++) { const yy = 1 - (i + 0.5) / nCh * 2, rr = Math.sqrt(1 - yy * yy), th = i * 2.39996 + R1(seed + 50 + i) * 0.8; ch.push(nrm([Math.cos(th) * rr + (R1(seed + 60 + i) - 0.5) * 0.4, yy + (R1(seed + 70 + i) - 0.5) * 0.3, Math.sin(th) * rr + (R1(seed + 80 + i) - 0.5) * 0.4])); }
    return { pl, ch, seed }; }
  const ROCK = [[14, 10, 7], [32, 24, 17], [50, 39, 29], [80, 61, 43], [124, 99, 73]];
  /* render the rock (orientation M) at Spx pixels per rock radius: body, emissive layer, and per pixel its shell piece
     and seam light (for the shatter). A generator: yields every few rows so the build can be spread over frames. */
  function* rockGen(md, M, Spx, res, plain) {
    const ZS = 0.9, pl = md.pl.map(p => { const r = mv(M, p.n), v = [r[0], r[1], r[2] / ZS], k = Math.hypot(v[0], v[1], v[2]); return { n: [v[0] / k, v[1] / k, v[2] / k], d: p.d / k }; });
    const P = prep(pl), W = Math.ceil(2.75 * Spx) + 4, Hh = W, cx = W / 2, cy = Hh / 2, N = W * Hh;
    const cv = mk(W, Hh), g = cv.getContext('2d'), im = g.createImageData(W, Hh), dd = im.data;
    const E = new Float32Array(N), SE = plain ? null : new Uint8Array(N), CH = plain ? null : new Uint8Array(N), nch = md.ch.length, CHD = md.ch;
    const bw = Math.max(1.3, Spx * 0.05), R2 = 1.36 * 1.36, sd = md.seed;
    // (the pixel work lives in a plain function: a generator keeps its locals boxed on the heap)
    const row = py => {
      for (let px = 0; px < W; px++) {
        const sx = (px + 0.5 - cx) / Spx, sy = (py + 0.5 - cy) / Spx; if (sx * sx + sy * sy > R2) continue;
        if (!cast(P, sx, sy, Spx) || O.sil < -0.7) continue;
        const wx = sx, wy = O.y, wz = (wy * GY - sy) / ZS, i = py * W + px, o = i * 4;
        const qx = M[0] * wx + M[3] * wy + M[6] * wz, qy = M[1] * wx + M[4] * wy + M[7] * wz, qz = M[2] * wx + M[5] * wy + M[8] * wz;
        let nx = P.NX[O.i1], ny = P.NY[O.i1], nz = P.NZ[O.i1];
        if (O.ed < bw && O.i2 >= 0) { const w = 0.5 * (1 - sm(O.ed / bw)); nx += (P.NX[O.i2] - nx) * w; ny += (P.NY[O.i2] - ny) * w; nz += (P.NZ[O.i2] - nz) * w; }
        // the bump: an object-space noise gradient carried into the world
        { const f = small(Spx) ? 3 : 5.2; vn3d(qx * f, qy * f, qz * f); const gx = G3[0] * f, gy = G3[1] * f, gz = G3[2] * f;
          nx -= (M[0] * gx + M[1] * gy + M[2] * gz) * 0.03; ny -= (M[3] * gx + M[4] * gy + M[5] * gz) * 0.03; nz -= (M[6] * gx + M[7] * gy + M[8] * gz) * 0.03; }
        { const k = Math.hypot(nx, ny, nz); nx /= k; ny /= k; nz /= k; }
        const t1 = vn3(qx * 3 + 7, qy * 3, qz * 3), t2 = vn3(qx * 11, qy * 11 + 3, qz * 11), t3 = vn3(qx * 27, qy * 27, qz * 27 + 9);
        // the veins: the seams between the shell pieces, a branching noise network, some facet edges; recessed
        let V = 0, VW = 0, SV = 0, ch = 0;
        if (!plain) {
          let d1 = -9, d2 = -9; const ql = Math.hypot(qx, qy, qz) || 1; for (let k = 0; k < nch; k++) { const dt = (qx * CHD[k][0] + qy * CHD[k][1] + qz * CHD[k][2]) / ql; if (dt > d1) { d2 = d1; d1 = dt; ch = k; } else if (dt > d2) d2 = dt; }
          const sg = d1 - d2 + (vn3(qx * 5 + 3, qy * 5, qz * 5) - 0.5) * 0.05 + (t2 - 0.5) * 0.012, seam = (1 - sstep(0.004, 0.017, sg)) * (0.8 + 0.2 * t1), seamW = 1 - sstep(0.015, 0.06, sg);
          // the fine fractures: a cellular network (F2 - F1), partly masked so it branches and thins out
          const dens = sstep(0.5, 0.68, vn3(qx * 1.5 + 20, qy * 1.5, qz * 1.5)) * sstep(0.4, 0.62, vn3(qx * 4.2, qy * 4.2 + 9, qz * 4.2)), wv = (0.02 + 0.035 * t1) * dens, w = dens > 0 ? vn3(qx * 2.1 + 3, qy * 2.1, qz * 2.1 + 1) - 0.5 : 0, fv = dens > 0 ? vor3(qx * 2.7 + w * 0.6, qy * 2.7 - w * 0.5, qz * 2.7 + 5) : 1;
          const nv = (1 - sstep(wv * 0.35, wv, fv)) * dens, nvW = (1 - sstep(wv, wv * 2.6 + 0.02, fv)) * dens;
          const pe = O.i2 >= 0 && R1(Math.min(O.i1, O.i2) * 131 + Math.max(O.i1, O.i2) * 17 + sd * 7) < 0.18 ? 1 : 0, ev = pe * (1 - sstep(0.5, 1.5, O.ed)), evW = pe * (1 - sstep(1.2, 4, O.ed));
          V = Math.max(seam, nv, ev); VW = Math.max(seamW, nvW, evW); SV = seam;
          E[i] = Math.max(seam * 0.85, nv * 0.8, ev * 0.6) * (0.75 + 0.25 * t2) * cl(O.sil / 1.5);
          SE[i] = Math.round(cl(seam + seamW * 0.25) * 255); CH[i] = ch; }
        const ndl = Math.max(0, nx * LIT[0] + ny * LIT[1] + nz * LIT[2]), ndv = Math.max(0, nx * VIEW[0] + ny * VIEW[1] + nz * VIEW[2]), ndh = Math.max(0, nx * HV[0] + ny * HV[1] + nz * HV[2]);
        const bands = 0.3 * sstep(0.04, 0.18, ndl) + 0.35 * sstep(0.34, 0.48, ndl) + 0.35 * sstep(0.66, 0.78, ndl);
        const alb = 0.8 + 0.34 * (t1 - 0.5) + 0.24 * (t2 - 0.5) + 0.16 * (t3 - 0.5) + (t3 > 0.78 ? 0.3 * (t3 - 0.78) / 0.22 : 0);
        const b = cl(((0.56 * bands + 0.44 * ndl) * alb * (1 - 0.62 * VW) + 0.07) * 1.02), bb = b * 4, ri = Math.min(3, Math.floor(bb)), rf = bb - ri, RA = ROCK[ri], RB = ROCK[ri + 1];
        let cr = RA[0] + (RB[0] - RA[0]) * rf, cg = RA[1] + (RB[1] - RA[1]) * rf, cb = RA[2] + (RB[2] - RA[2]) * rf;
        // a warm amber bounce from below (the veins' and the floor's light), a faint cool sky rim above, a matte sheen
        const fr = Math.pow(1 - ndv, 2.4), under = cl(-nz * 1.1 + 0.25), sky = cl(nz * 1.2 - 0.3), spec = Math.pow(ndh, 22) * 0.22 * (0.4 + t2);
        cr += 150 * fr * under * 0.55 + 40 * fr * sky * 0.3 + 230 * spec; cg += 86 * fr * under * 0.55 + 44 * fr * sky * 0.3 + 205 * spec; cb += 20 * fr * under * 0.55 + 52 * fr * sky * 0.3 + 170 * spec;
        // the vein channel itself: deep amber, hotter in the seams (the bright interior shows there)
        if (V > 0.01) { const vr = 150 + 40 * SV, vg = 72 + 30 * SV, vb = 12 + 8 * SV; cr = lerp(cr, vr, V); cg = lerp(cg, vg, V); cb = lerp(cb, vb, V); }
        // a soft ink edge so it reads on a bright floor
        const ink = 0.3 + 0.7 * sstep(0, 2.4, O.sil); cr *= ink; cg *= ink; cb *= ink;
        dd[o] = cr; dd[o + 1] = cg; dd[o + 2] = cb; dd[o + 3] = cl(O.sil + 0.5) * 255; } };
    for (let py = 0; py < Hh; py++) { if (py % 6 === 0) yield 0; row(py); }
    g.putImageData(im, 0, 0);
    Object.assign(res, { body: cv, W, H: Hh, cx, cy, S: Spx, CH, SE, nch });
    if (!plain) { yield 0; res.glow = glowCanvas(E, W, Hh, Math.max(2, Math.round(Spx * 0.06)), 0.9); }
    res.ready = true; }
  const small = S => S < 20;
  /* the shell pieces of one render: canvases cut along the seams, and the seam light alone */
  function rockChunks(res) { if (res.chunks) return res.chunks; const { W, H: Hh, CH, SE, nch } = res, src = res.body.getContext('2d').getImageData(0, 0, W, Hh).data, out = [];
    for (let k = 0; k < nch; k++) { let x0 = W, y0 = Hh, x1 = -1, y1 = -1, sx = 0, sy = 0, n = 0;
      for (let i = 0; i < W * Hh; i++) { if (CH[i] !== k || src[i * 4 + 3] < 8) continue; const x = i % W, y = (i - x) / W; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; sx += x; sy += y; n++; }
      if (n < 12) continue; const w = x1 - x0 + 1, h = y1 - y0 + 1, cv = mk(w, h), g = cv.getContext('2d'), im = g.createImageData(w, h), d = im.data;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x; if (CH[i] !== k) continue; const o = ((y - y0) * w + (x - x0)) * 4, s = i * 4; d[o] = src[s]; d[o + 1] = src[s + 1]; d[o + 2] = src[s + 2]; d[o + 3] = src[s + 3]; }
      g.putImageData(im, 0, 0); const bk = mk(w, h), bg = bk.getContext('2d'); bg.drawImage(cv, 0, 0); bg.globalCompositeOperation = 'source-in'; bg.fillStyle = '#4A240A'; bg.fillRect(0, 0, w, h); const hot = mk(w, h), hg = hot.getContext('2d'); hg.drawImage(cv, 0, 0); hg.globalCompositeOperation = 'source-in'; hg.fillStyle = '#D98A1E'; hg.fillRect(0, 0, w, h);
      out.push({ cv, bk, hot, x0, y0, w, h, mx: sx / n, my: sy / n }); }
    const E = new Float32Array(W * Hh); for (let i = 0; i < W * Hh; i++) E[i] = SE[i] / 255 * (src[i * 4 + 3] / 255);
    res.seam = glowCanvas(E, W, Hh, Math.max(2, Math.round(res.S * 0.08)), 1.2); res.chunks = out; return out; }

  /* ---- a crystal: a hexagonal prism tapering a little, an irregular pyramid tip; z is its axis; o: r (base radius),
     taper, hs (shoulder), ht (tip), rootH (dark stone below this height, 0 for none) ---- */
  function crystalModel(seed, o) {
    const pl = [], sd = o.sides || 6, tox = (R1(seed + 1) - 0.5) * o.r * 0.5, toy = (R1(seed + 2) - 0.5) * o.r * 0.5;
    for (let i = 0; i < sd; i++) { const a = i / sd * TAU + (R1(seed + i * 2.3) - 0.5) * 0.35, ri = o.r * (0.82 + 0.3 * R1(seed + i * 5.1)), rs = ri * o.taper;
      { const n = [Math.cos(a), Math.sin(a), (ri - rs) / o.hs], k = Math.hypot(n[0], n[1], n[2]); pl.push({ n: [n[0] / k, n[1] / k, n[2] / k], d: ri / k }); }
      { const k0 = rs / (o.ht - o.hs) * (0.8 + 0.4 * R1(seed + i * 3.7)), n = [Math.cos(a), Math.sin(a), k0], d = n[0] * tox + n[1] * toy + n[2] * o.ht, k = Math.hypot(n[0], n[1], n[2]); pl.push({ n: [n[0] / k, n[1] / k, n[2] / k], d: d / k }); } }
    pl.push({ n: [0, 0, -1], d: 0.6 }); return { pl, o, seed }; }
  const CRY = [[52, 22, 5], [104, 50, 11], [176, 96, 19], [226, 146, 36], [248, 192, 80], [255, 230, 172]];
  /* render a cluster standing at the world origin, orientation Mw, cut by the floor (z >= 0), at Spx pixels per tile:
     the union of convex parts, each { md (a crystal or rock model), M (its orientation in the cluster), off (its origin),
     mat: 'crystal' | 'stone', sc (rock scale) }. Per pixel the nearest part is shaded (blended with the one behind at its
     edge). Body + emissive (crystals glow from inside, by their thickness). Its anchor (the origin) in px: cx, cy. */
  function* clusterGen(parts, Mw, Spx, res, floorCut) {
    const PP = parts.map(pt => { const Mc = mmul(Mw, pt.M), off = mv(Mw, pt.off || [0, 0, 0]), sc = pt.sc || 1, pl = pt.md.pl.map(p => { const n = mv(Mc, p.n); return { n, d: p.d * sc + n[0] * off[0] + n[1] * off[1] + n[2] * off[2] }; });
      if (floorCut !== false) pl.push({ n: [0, 0, -1], d: 0 }); return { pt, Mc, off, sc, P: prep(pl), o: pt.md.o, seed: pt.md.seed, R: { i1: 0, i2: -1, jl: 0, y: 0, th: 0, sil: 0, ed: 0 } }; });
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const q of PP) { const pts = []; if (q.pt.mat === 'crystal') { const o = q.o; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; for (const [r, z] of [[o.r * 1.25, -0.05], [o.r * o.taper * 1.25, o.hs], [0.05, o.ht + 0.05]]) pts.push([Math.cos(a) * r, Math.sin(a) * r, z]); } } else for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; for (const z of [-1.1, 0, 1.1]) pts.push([Math.cos(a) * 1.35 * q.sc, Math.sin(a) * 1.35 * q.sc, z * q.sc]); }
      q.b = [1e9, 1e9, -1e9, -1e9]; for (const p0 of pts) { const p = mv(q.Mc, p0), X = p[0] + q.off[0], Y = (p[1] + q.off[1]) * GY - (p[2] + q.off[2]); q.b[0] = Math.min(q.b[0], X); q.b[2] = Math.max(q.b[2], X); q.b[1] = Math.min(q.b[1], Y); q.b[3] = Math.max(q.b[3], Y); }
      x0 = Math.min(x0, q.b[0]); x1 = Math.max(x1, q.b[2]); y0 = Math.min(y0, q.b[1]); y1 = Math.max(y1, q.b[3]); }
    const pad = 3, W = Math.ceil((x1 - x0) * Spx) + pad * 2, Hh = Math.ceil((y1 - y0) * Spx) + pad * 2, cx = -x0 * Spx + pad, cy = -y0 * Spx + pad, N = W * Hh;
    const cv = mk(W, Hh), g = cv.getContext('2d'), im = g.createImageData(W, Hh), dd = im.data, E = new Float32Array(N), C0 = [0, 0, 0, 0], C1 = [0, 0, 0, 0];
    const bands = ndl => 0.3 * sstep(0.04, 0.18, ndl) + 0.35 * sstep(0.34, 0.48, ndl) + 0.35 * sstep(0.66, 0.78, ndl);
    // shade part q at the world point (sx, y, z) into out [r, g, b, emissive]
    function shade(q, sx, sy, out) {
      const R = q.R, P = q.P, wx = sx, wy = R.y, wz = wy * GY - sy, M = q.Mc, ox = wx - q.off[0], oy = wy - q.off[1], oz = wz - q.off[2];
      const qx = (M[0] * ox + M[3] * oy + M[6] * oz) / q.sc, qy = (M[1] * ox + M[4] * oy + M[7] * oz) / q.sc, qz = (M[2] * ox + M[5] * oy + M[8] * oz) / q.sc, sd = q.seed;
      let nx = P.NX[R.i1], ny = P.NY[R.i1], nz = P.NZ[R.i1]; const o = q.o, bw = Math.max(1.1, Spx * (o ? o.r * 0.07 : q.sc * 0.1));
      if (R.ed < bw && R.i2 >= 0) { const w = 0.5 * (1 - sm(R.ed / bw)); nx += (P.NX[R.i2] - nx) * w; ny += (P.NY[R.i2] - ny) * w; nz += (P.NZ[R.i2] - nz) * w; const k = Math.hypot(nx, ny, nz); nx /= k; ny /= k; nz /= k; }
      const ndl = Math.max(0, nx * LIT[0] + ny * LIT[1] + nz * LIT[2]), ndv = Math.max(0, nx * VIEW[0] + ny * VIEW[1] + nz * VIEW[2]), ndh = Math.max(0, nx * HV[0] + ny * HV[1] + nz * HV[2]);
      const n1 = vn3(qx * 6 + sd, qy * 6, qz * 6), edge = R.i2 >= 0 ? 1 - sstep(0.45, 1.5, R.ed) : 0;
      const rootH = o && o.rootH || 0, isStone = q.pt.mat !== 'crystal';
      const rk = isStone ? 1 : rootH > 0 ? 1 - sstep(-0.05, 0.05, qz - rootH * (0.8 + 0.5 * n1)) : 0, seamB = !isStone && rootH > 0 ? 1 - sstep(0, rootH * 0.14, Math.abs(qz - rootH * (0.8 + 0.5 * n1))) : 0;
      let cr = 0, cg = 0, cb = 0, em = 0;
      if (rk < 0.999) {
        // the crystal: cel-banded amber to honey by the light, darker facets turned away; the back facets show through
        // as inner planes (each its own tone); streaks along the axis; pale gold bevelled edges; a hard specular
        const th = cl(R.th / (o.r * 2)), lit = bands(ndl) * 0.62 + 0.38 * ndl, k = cl(0.04 + 0.78 * lit + 0.14 * th) * 5, ri = Math.min(4, Math.floor(k)), rf = k - ri, RA = CRY[ri], RB = CRY[ri + 1];
        cr = RA[0] + (RB[0] - RA[0]) * rf; cg = RA[1] + (RB[1] - RA[1]) * rf; cb = RA[2] + (RB[2] - RA[2]) * rf;
        const jb = R.jl, inner = Math.abs(P.NX[jb] * LIT[0] + P.NY[jb] * LIT[1] + P.NZ[jb] * LIT[2]), pan = R1(jb * 7.3 + sd), ip = sstep(0.2, 0.9, inner) * (0.3 + 0.7 * th) * (1 - 0.5 * ndl), st = sstep(0.6, 0.8, vn3(qx * 7 + sd, qy * 7, qz * 1.6));
        cr += (60 + 40 * pan) * ip + 28 * st; cg += (44 + 34 * pan) * ip + 22 * st; cb += 12 * ip + 12 * st;
        const spec = Math.pow(ndh, 46) * 1.1, frs = Math.pow(1 - ndv, 3) * 0.28; cr += 255 * spec + 120 * frs; cg += 246 * spec + 105 * frs; cb += 225 * spec + 70 * frs;
        const ek = edge * (0.4 + 0.6 * cl(ndl * 1.6)); cr = lerp(cr, 255, ek * 0.85); cg = lerp(cg, 233, ek * 0.85); cb = lerp(cb, 184, ek * 0.85);
        em = ((0.15 + 0.85 * Math.pow(th, 1.3)) * 0.8 + edge * 0.35 + st * 0.15) * (1 - rk); }
      if (rk > 0.001) {
        // dark stone: rough, cel-banded, a warm bounce from below, lit edges
        const t2 = vn3(qx * 14, qy * 14, qz * 14 + sd), t3 = vn3(qx * 31 + sd, qy * 31, qz * 31), b = cl((0.56 * bands(ndl) + 0.44 * ndl) * (0.8 + 0.4 * (t2 - 0.5) + 0.25 * (n1 - 0.5) + (t3 > 0.8 ? 0.25 : 0)) + 0.07) * 4, ri = Math.min(3, Math.floor(b)), rf = b - ri, RA = ROCK[ri], RB = ROCK[ri + 1];
        let sr = RA[0] + (RB[0] - RA[0]) * rf, sg = RA[1] + (RB[1] - RA[1]) * rf, sb = RA[2] + (RB[2] - RA[2]) * rf; const fr = Math.pow(1 - ndv, 2.4) * cl(-nz + 0.5); sr += 150 * fr * 0.5; sg += 86 * fr * 0.5; sb += 20 * fr * 0.5;
        const ek = edge * 0.45 * cl(ndl * 2); sr = lerp(sr, 150, ek); sg = lerp(sg, 124, ek); sb = lerp(sb, 94, ek);
        cr = lerp(cr, sr, rk); cg = lerp(cg, sg, rk); cb = lerp(cb, sb, rk); }
      if (seamB > 0.01) { cr = lerp(cr, 255, seamB * 0.7); cg = lerp(cg, 196, seamB * 0.7); cb = lerp(cb, 84, seamB * 0.7); em += seamB * 0.9; }
      const ink = 0.32 + 0.68 * sstep(0, 2.0, R.sil); out[0] = cr * ink; out[1] = cg * ink; out[2] = cb * ink; out[3] = em; }
    const NP = PP.length;
    // (the pixel work lives in a plain function: a generator keeps its locals boxed on the heap)
    const row = py => {
      for (let px = 0; px < W; px++) {
        const sx = (px + 0.5 - cx) / Spx, sy = (py + 0.5 - cy) / Spx; let f = null, s2 = null;
        for (let qi = 0; qi < NP; qi++) { const q = PP[qi], b = q.b; if (sx < b[0] - 0.03 || sx > b[2] + 0.03 || sy < b[1] - 0.03 || sy > b[3] + 0.03) continue; if (!cast(q.P, sx, sy, Spx) || O.sil < -0.7) continue; const R = q.R; R.i1 = O.i1; R.i2 = O.i2; R.jl = O.jl; R.y = O.y; R.th = O.th; R.sil = O.sil; R.ed = O.ed;
          if (!f || R.y > f.R.y) { s2 = f; f = q; } else if (!s2 || R.y > s2.R.y) s2 = q; }
        if (!f) continue;
        const i = py * W + px, o = i * 4, a0 = cl(f.R.sil + 0.5); shade(f, sx, sy, C0);
        let r = C0[0], gg = C0[1], b = C0[2], em = C0[3], al = a0;
        if (a0 < 0.999 && s2) { const s = s2; shade(s, sx, sy, C1); const a1 = cl(s.R.sil + 0.5); r = lerp(C1[0], r, a0); gg = lerp(C1[1], gg, a0); b = lerp(C1[2], b, a0); em = lerp(C1[3], em, a0); al = a0 + a1 * (1 - a0); }
        else if (s2) { // the contact between two parts: a touch of occlusion on the nearer one
          const s = s2, dz = (f.R.y - s.R.y) * Spx; if (dz < 3) { const k = 0.75 + 0.25 * dz / 3; r *= k; gg *= k; b *= k; } }
        dd[o] = r; dd[o + 1] = gg; dd[o + 2] = b; dd[o + 3] = al * 255; E[i] = em * al; } };
    for (let py = 0; py < Hh; py++) { if (py % 8 === 0) yield 0; row(py); }
    g.putImageData(im, 0, 0); yield 0;
    const rr = parts[0].md.o ? parts[0].md.o.r : 0.2;
    Object.assign(res, { body: cv, glow: glowCanvas(E, W, Hh, Math.max(2, Math.round(Spx * rr * 0.35)), 0.8), W, H: Hh, cx, cy, S: Spx }); res.ready = true; }
  const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const crystalGen = (md, M, Spx, res, floorCut) => clusterGen([{ md, M: I3, mat: 'crystal' }], M, Spx, res, floorCut);
  /* run a generator to the end, or for at most ms */
  const runGen = (it, ms) => { const t0 = performance.now(); for (;;) { if (it.next().done) return true; if (ms != null && performance.now() - t0 > ms) return false; } };

  /* ---- small heavy chips (cached): tiny plain rocks ---- */
  const CHIPS = {}; function chips(px) { px = Math.max(10, Math.min(40, Math.round(px / 4) * 4)); if (CHIPS[px]) return CHIPS[px]; const out = [];
    for (let i = 0; i < 6; i++) { const res = {}; runGen(rockGen(rockModel(900 + i * 17, 0, true), rotAxis([R1(i) - 0.5, R1(i + 9) - 0.5, 0.5], i * 1.3), px / 2.3, res, true)); out.push(res); }
    return (CHIPS[px] = out); }
  /* ---- floor and air sprites (all feathered) ---- */
  const spr = (k, w, h, f) => fxSprite('eC' + k, w, h, f);
  const band = (k, stops) => spr(k, 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const amberBand = () => band('amb', [[0, 'rgba(217,138,30,0)'], [0.62, 'rgba(217,138,30,0)'], [0.82, 'rgba(217,138,30,0.3)'], [0.91, 'rgba(242,183,58,0.75)'], [0.955, 'rgba(255,233,184,0.85)'], [1, 'rgba(255,233,184,0)']]);
  const dustBand = () => band('dust', [[0, 'rgba(120,100,78,0)'], [0.45, 'rgba(120,100,78,0)'], [0.68, 'rgba(112,94,74,0.22)'], [0.84, 'rgba(138,116,90,0.5)'], [0.93, 'rgba(168,146,116,0.4)'], [1, 'rgba(168,146,116,0)']]);
  const puff = () => spr('puff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(150,128,102,0.55)'); gr.addColorStop(0.45, 'rgba(128,108,86,0.3)'); gr.addColorStop(1, 'rgba(110,92,72,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  const shade = () => spr('shd', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(12,8,4,0.75)'); gr.addColorStop(0.5, 'rgba(12,8,4,0.45)'); gr.addColorStop(1, 'rgba(12,8,4,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const mote = () => spr('mote', 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,248,226,1)'); gr.addColorStop(0.25, 'rgba(255,214,120,0.8)'); gr.addColorStop(0.6, 'rgba(217,138,30,0.2)'); gr.addColorStop(1, 'rgba(217,138,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  /* a feathered branching crack network round a point, light only (drawn additively), squashed onto the floor */
  const CRK = {}; function cracks(seed, Rpx, n, br) { Rpx = Math.max(24, Math.round(Rpx / 8) * 8); const key = seed + ':' + Rpx + ':' + n + ':' + br; if (CRK[key]) return CRK[key];
    const W = Rpx * 2 + 24, Hh = Math.ceil(Rpx * 2 * GY) + 24, cx = W / 2, cy = Hh / 2, cv = mk(W, Hh), g = cv.getContext('2d'); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round'; let s = seed * 7.1;
    const paths = []; const walk = (x, y, b, steps, len, w) => { const pts = [[x, y, w]]; for (let k = 0; k < steps; k++) { b += (R1(s += 1.3) - 0.5) * 0.9; x += Math.cos(b) * len * (0.7 + 0.6 * R1(s += 0.7)); y += Math.sin(b) * len * (0.7 + 0.6 * R1(s += 0.9)); pts.push([x, y, w * (1 - (k + 1) / (steps + 1))]); } return pts; };
    for (let i = 0; i < n; i++) { const b = i / n * TAU + (R1(s += 2.1) - 0.5) * 0.7, r0 = Rpx * (0.12 + 0.1 * R1(s += 1.7)), L = Rpx * (0.55 + 0.4 * R1(s += 3.3)), st = 7; const p = walk(Math.cos(b) * r0, Math.sin(b) * r0, b, st, (L - r0) / st, 1); paths.push(p);
      for (let j = 0; j < br; j++) { const q = p[2 + Math.floor(R1(s += 4.4) * (p.length - 4))]; paths.push(walk(q[0], q[1], b + (R1(s += 2.2) < 0.5 ? -1 : 1) * (0.5 + 0.5 * R1(s += 1.1)), 4, L * 0.09, q[2] * 0.7)); } }
    for (const [lw, col] of [[7, 'rgba(217,138,30,0.08)'], [3.6, 'rgba(217,138,30,0.22)'], [1.7, 'rgba(242,183,58,0.6)'], [0.8, 'rgba(255,240,200,0.75)']]) { g.strokeStyle = col;
      for (const p of paths) for (let k = 1; k < p.length; k++) { const a = p[k - 1], b = p[k], w = (a[2] + b[2]) / 2; if (w <= 0.02) continue; g.globalAlpha = Math.pow(w, 0.6); g.lineWidth = Math.max(0.4, lw * (0.4 + 0.6 * w)); g.beginPath(); g.moveTo(cx + a[0], cy + a[1] * GY); g.lineTo(cx + b[0], cy + b[1] * GY); g.stroke(); } }
    return (CRK[key] = cv); }
  // the device scale of the current transform, and the visible screen box
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d, k: a }; }
  // a floor sprite (ellipse squashed onto the floor), optionally additive
  function floorSpr(c, img, X, Y, r, a, add) { if (r < 1 || !(a > 0.004)) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, X - r, Y - r * GY, r * 2, r * 2 * GY); c.restore(); }
  function glowAt(c, x, y, r, col, a) { if (r < 1 || !(a > 0.004)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  // an additive layer drawn at intensity a (above 1: drawn again)
  function addLayer(c, img, x, y, w, h, a) { if (!img || !(a > 0.004)) return; c.save(); c.globalCompositeOperation = 'lighter'; while (a > 0.004) { c.globalAlpha = Math.min(1, a); c.drawImage(img, x, y, w, h); a -= 1; } c.restore(); }
  return { TAU, GY, cl, lerp, sm, sstep, R1, vn3, vor3, nrm, rotAxis, mmul, mv, rockModel, rockGen, rockChunks, crystalModel, crystalGen, clusterGen, I3, runGen, chips, amberBand, dustBand, puff, shade, mote, cracks, scr, floorSpr, glowAt, addLayer };
})();

(() => {
  const U = ELEM_IMPL.earth.ult; delete U.footfall;
  const E = EARTHC, TAU = Math.PI * 2, { cl, lerp, sm, sstep, R1 } = E;
  const AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', CORE = '#FFF4D6';
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const NB = 16, STEP = TAU / NB, AXIS = [0.78, 0.32, 0.52];
  // the rock's sprites (per size and level, cached): one render per rotation bucket, built on demand / in slices
  const RSETS = {};
  function rockSet(Spx, ev) { const key = Spx + ':' + ev; if (RSETS[key]) return RSETS[key]; const md = E.rockModel(41 + ev * 13, [7, 7, 8, 9, 9, 10, 11][ev - 1]), M0 = E.rotAxis([0.3, 1, 0.2], 0.7);
    const S = { md, b: [], Spx }; for (let i = 0; i < NB; i++) S.b.push({ ready: false, it: null, res: {} });
    S.build = (i, ms) => { const B = S.b[((i % NB) + NB) % NB]; if (B.ready) return true; if (ms != null && ms <= 0) return false; if (!B.it) B.it = E.rockGen(md, E.mmul(E.rotAxis(AXIS, i * STEP), M0), Spx, B.res); if (E.runGen(B.it, ms)) { B.ready = true; B.it = null; } return B.ready; };
    S.get = i => S.b[((i % NB) + NB) % NB];
    return (RSETS[key] = S); }
  // the ember crystals (cached per size and level): six tilts, a hexagonal prism with an irregular point
  const CSETS = {};
  function crySet(Spx, ev) { const key = Spx + ':' + ev; if (CSETS[key]) return CSETS[key]; const out = { v: [], ready: false, its: [] };
    for (let i = 0; i < 6; i++) { const r = 0.16 + 0.006 * ev, ht = 0.8 + 0.025 * ev, parts = [{ md: E.crystalModel(300 + i * 11 + ev, { r, taper: 0.7, hs: ht * 0.58, ht, sides: 6 }), M: E.rotAxis([0, 0, 1], R1(i) * TAU), mat: 'crystal' }];
      // richer with evolution: a smaller crystal or two growing off its side; a lump of the shell's rock at its foot
      for (let j = 0; j < (ev >= 7 ? 2 : ev >= 4 ? 1 : 0); j++) { const a = (j ? 2.4 : -0.6) + R1(i * 3 + j), h2 = ht * (0.5 + 0.12 * R1(i + j * 7)); parts.push({ md: E.crystalModel(340 + i * 13 + j * 5, { r: r * 0.62, taper: 0.7, hs: h2 * 0.55, ht: h2, sides: 6 }), M: E.mmul(E.rotAxis([0, 0, 1], a), E.rotAxis([0, 1, 0], 0.55)), off: [Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, 0], mat: 'crystal' }); }
      { const a = 3.6 + R1(i * 9); parts.push({ md: E.rockModel(380 + i * 7, 0, true), M: E.rotAxis([R1(i) - 0.5, 0.4, 0.6], i), off: [Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, 0.02], sc: r * 0.8, mat: 'stone' }); }
      const M = E.mmul(E.rotAxis([0, 0, 1], i / 6 * TAU + 0.3), E.rotAxis([0, 1, 0], 0.3 + 0.12 * R1(i + 3))), res = {}; out.v.push(res); out.its.push(E.clusterGen(parts, M, Spx, res)); }
    out.step = ms => { const t0 = performance.now(); while (out.its.length && (ms == null || performance.now() - t0 < ms)) { if (E.runGen(out.its[0], ms == null ? null : Math.max(0.5, ms - (performance.now() - t0)))) out.its.shift(); else break; } out.ready = !out.its.length; return out.ready; };
    return (CSETS[key] = out); }

  U.cataclysm = (C, H) => {
    const me = H.me, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const NI = CEL ? 3 : ADE ? 2 : 1, NC = [6, 7, 9, 10, 11, 13, 14][ev - 1];
    const RT = (3 + 0.15 * (ev - 1)) / 2, ZR = RT * 0.86, RI = (RT + 0.8) * K, RC = 0.9 * K;   // RT: the rock's radius in tiles (3H across at level 1)
    const IMP = 6.5 * DK, FIN = 7.5 * DK, CRD = 1.6 * DK;
    const TA = 0.35, T1 = 1.25, TBN = 0.8, HB = [3.0, 2.3], Z0 = 8.5, TF = T1 + (NI - 1) * TBN, TS = TF + 0.24, LIFE = TS + 2.9;
    // the spin, tuned so the rock comes to rest on a whole rotation bucket at the final landing (its shell pieces are cut from that render)
    let om = 1.6; const nq = Math.max(1, Math.round(om * (TF - TA) / STEP)); om = nq * STEP / (TF - TA); const BF = nq % NB;
    const angAt = t => om * (Math.min(t, TF) - TA);
    const p0 = H.walk(C.tx, C.ty), stops = [{ x: p0.x, y: p0.y }], struck = new Set();
    const from = { x: p0.x + 2.4 * (me.x < p0.x ? -1 : 1) * 0.6, y: p0.y - 1.4 };
    const pebbles = [], chipsL = [], puffs = [], embers = [], splint = [], rings = [], crys = [], shell = [];
    const log = []; let nImp = 0, flash = 0, shattered = false, nBlast = 0, RS = null, CS = null, chipS = null, dead = false;
    H.X.banner(CEL ? 'CATACLYSM' : 'CATACLYSM', '', GOLD, 1.4); H.X.sfx.hum();
    // the mark: pebbles that rise off the floor round the first landing
    for (let i = 0; i < H.n(8 + ev); i++) { const b = R1(i * 3.3 + ev) * TAU, r = RI * (0.25 + 0.7 * R1(i * 1.7 + 5)); pebbles.push({ x: p0.x + Math.cos(b) * r, y: p0.y + Math.sin(b) * r, t0: 0.15 + R1(i * 2.9) * 0.6, h: 0.25 + 0.5 * R1(i * 4.1), s: 0.12 + 0.08 * R1(i * 7.3), v: i % 6, ph: R1(i) * TAU }); }

    // where the rock is at time t: [x, y, z (its centre's height)]
    function rockAt(t) {
      if (t < T1) { const u = cl((t - TA) / (T1 - TA)), e = u * u; return [lerp(from.x, p0.x, e), lerp(from.y, p0.y, e), ZR + (Z0 - ZR) * (1 - Math.pow(u, 2.3))]; }
      const k = Math.min(NI - 1, Math.floor((t - T1) / TBN)), u = cl((t - T1 - k * TBN) / TBN);
      if (k >= NI - 1 || !stops[k + 1]) { const s = stops[Math.min(stops.length - 1, NI - 1)] || stops[stops.length - 1]; return [s.x, s.y, ZR]; }
      const a = stops[k], b = stops[k + 1], hb = HB[k] || 2; return [lerp(a.x, b.x, u), lerp(a.y, b.y, u), ZR + 4 * hb * u * (1 - u)]; }
    function pickNext(k) { const a = stops[k], L = H.living().filter(m => Math.hypot(m.x - a.x, m.y - a.y) < 7.5);
      const far = L.filter(m => Math.hypot(m.x - a.x, m.y - a.y) > 1.4), fresh = far.filter(m => !struck.has(m)), pool = fresh.length ? fresh : far;
      let x, y;
      if (pool.length) { const m = H.sortNear(a.x, a.y, pool)[0], d = Math.hypot(m.x - a.x, m.y - a.y), s = Math.min(1, 6.5 / d); x = a.x + (m.x - a.x) * s; y = a.y + (m.y - a.y) * s; }
      else if (L.length) { const b = R1(k * 7 + ev) * TAU; x = a.x + Math.cos(b) * 0.7; y = a.y + Math.sin(b) * 0.7; }   // only one target left: back onto the same area
      else { const pa = k ? stops[k - 1] : from, d = Math.hypot(a.x - pa.x, a.y - pa.y) || 1; x = a.x + (a.x - pa.x) / d * 2.6; y = a.y + (a.y - pa.y) / d * 2.6; }
      const p = H.walk(x, y); stops[k + 1] = { x: p.x, y: p.y }; }
    function impact(k, t) {
      const s = stops[k], fin = k === NI - 1;
      for (const m of H.near(s.x, s.y, RI)) struck.add(m);
      const n = H.hitArea(s.x, s.y, RI, fin ? FIN : IMP, C.dmgO({ kb: 5, stun: 0.35 })); log.push({ t, kind: 'impact', k, n, x: s.x, y: s.y });
      flash = 1; H.X.shake(fin ? 16 + ev : 11 + ev * 0.6, 0.3); H.X.hitstop(fin ? 0.08 : 0.06); H.X.sfx.crash(); H.X.light(s.x, s.y, RI * 1.4, 0.5); if (fin) H.X.flash(0.12, PALE);
      rings.push({ x: s.x, y: s.y, t0: t, cr: E.cracks(k + 1 + (ev > 3 ? 3 : 0), 64 * RI, 7 + ev, ADE ? 2 : 1), R: RI * (1.05 + 0.04 * ev), fin });
      // the pebbles of the mark are flung; heavy chips thrown outward; dust rolling out along the floor
      if (k === 0) for (const p of pebbles) chipsL.push({ x: p.x, y: p.y, z: p.z || 0.1, vx: (p.x - s.x) * 1.6, vy: (p.y - s.y) * 1.6, vz: 3 + Math.random() * 2, s: p.s, v: p.v, rot: p.ph, vr: (Math.random() - 0.5) * 9, t: 0, life: 1.1 + Math.random() * 0.4 });
      pebbles.length = 0;
      for (let i = 0; i < H.n(5 + (fin ? 3 : 0) + (CEL ? 2 : 0)); i++) { const b = Math.random() * TAU, v = 3 + Math.random() * 3; chipsL.push({ x: s.x + Math.cos(b) * RT * 0.7, y: s.y + Math.sin(b) * RT * 0.5, z: 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 3.5 + Math.random() * 3, s: 0.2 + Math.random() * 0.14 + 0.012 * ev, v: i % 6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, t: 0, life: 1.2 + Math.random() * 0.5 }); }
      for (let i = 0; i < H.n(12 + ev); i++) { const b = i / (12 + ev) * TAU + Math.random() * 0.3, v = 2.6 + Math.random() * 2.4; puffs.push({ x: s.x + Math.cos(b) * RT * 0.8, y: s.y + Math.sin(b) * RT * 0.55, z: 0.15 + Math.random() * 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: 0.25 + Math.random() * 0.35, t: -Math.random() * 0.08, life: 0.9 + Math.random() * 0.6, s: 0.5 + Math.random() * 0.4 + 0.05 * ev }); }
      H.burst(s.x, s.y - 0.3, 'spark', 10 + ev * 2, { v: 7, up: 2, g: 6, life: 0.45, size: 2, color: [GOLD, HONEY, PALE] });
      if (!fin) pickNext(k); }
    function shatter(t) {
      shattered = true; const s = stops[NI - 1], B = RS && RS.get(BF);
      H.X.sfx.crack(); H.X.shake(10 + ev, 0.25); H.X.light(s.x, s.y, RI * 1.6, 0.6); H.X.flash(0.1, HONEY);
      // the shell pieces, cut from the very render the rock rests in, fly apart (cosmetic)
      if (B && B.ready) { const ch = E.rockChunks(B.res), u = RT / B.res.S;   // tiles per sprite px
        for (const q of ch) { const dx = (q.mx - B.res.cx) * u, dz = -(q.my - B.res.cy) * u, d = Math.hypot(dx, dz) || 1, v = 3 + Math.random() * 1.8;
          shell.push({ q, x: s.x + dx, y: s.y + 0.05, z: ZR + dz, vx: dx / d * v, vy: (Math.random() - 0.5) * 1.4 + 0.4, vz: 1.8 + Math.max(0, dz / RT) * 3.2 + Math.random(), rot: 0, vr: (Math.random() - 0.5) * 2.6, t: 0, rest: false, r: Math.max(q.w, q.h) * u * 0.42, u }); } }
      // the ember crystals: short arcs round the landing, half of them toward monsters close by
      const tg = H.sortNear(s.x, s.y, H.near(s.x, s.y, RT + 3.2)).slice(0, Math.floor(NC / 2)), RS1 = 1.9 + 0.13 * ev;
      for (let i = 0; i < NC; i++) { const m = tg[i], b = i * 2.39996 + R1(i + ev) * 0.5, r = lerp(RT * 0.55 + 0.35, RS1 + RT * 0.3, Math.sqrt((i + 0.5) / NC));
        let x = s.x + Math.cos(b) * r, y = s.y + Math.sin(b) * r * 0.8; if (m && Math.hypot(m.x - s.x, m.y - s.y) > 0.8) { x = m.x + (Math.random() - 0.5) * 0.5; y = m.y + (Math.random() - 0.5) * 0.4; }
        const p = H.walk(x, y), ft = 0.36 + 0.18 * R1(i * 3.7), land = t + ft;
        crys.push({ x0: s.x + Math.cos(b) * RT * 0.3, y0: s.y, z0: ZR * 0.8, x1: p.x, y1: p.y, t0: t, ft, ap: 0.9 + 0.8 * R1(i * 5.3) + RT * 0.25, land, boom: land + 0.6 + 0.08 * R1(i * 9.1), v: i % 6, sc: 1.1 + 0.35 * R1(i * 2.2), side: ADE ? (CEL ? 2 : 1) : 0, sv: (i + 3) % 6, x: s.x, y: s.y, z: ZR, done: false, spin: (Math.random() - 0.5) * 8 }); }
      H.burst(s.x, s.y - ZR, 'spark', 22 + 3 * ev, { v: 8, up: 3, g: 6, life: 0.6, size: 2.2, color: [GOLD, HONEY, PALE, CORE] });
      for (let i = 0; i < H.n(10 + ev); i++) { const b = Math.random() * TAU; embers.push({ x: s.x + Math.cos(b) * RT * 0.5, y: s.y, z: ZR + Math.sin(b) * RT * 0.5, vx: Math.cos(b) * (1 + Math.random() * 2), vy: (Math.random() - 0.5), vz: 1 + Math.random() * 2.5, t: 0, life: 0.8 + Math.random() * 0.6, s: 0.12 + Math.random() * 0.1 }); }
      for (let i = 0; i < H.n(8 + ev); i++) { const b = i / (8 + ev) * TAU, v = 1.4 + Math.random() * 1.6; puffs.push({ x: s.x + Math.cos(b) * RT * 0.6, y: s.y + Math.sin(b) * RT * 0.4, z: 0.3 + Math.random() * ZR, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: 0.4 + Math.random() * 0.4, t: 0, life: 1.1 + Math.random() * 0.6, s: 0.55 + Math.random() * 0.45 + 0.05 * ev }); } }
    function blast(c, t) {
      c.done = true; nBlast++; const n = H.hitArea(c.x1, c.y1, RC, CRD, C.dmgO({ kb: 2 })); log.push({ t, kind: 'crystal', n, x: c.x1, y: c.y1 });
      H.X.light(c.x1, c.y1, RC * 2.2, 0.3); H.X.shake(3 + ev * 0.4, 0.1); if (nBlast % 2 === 1) H.X.sfx.crack(); else H.X.sfx.thud();
      rings.push({ x: c.x1, y: c.y1, t0: t, R: RC * 1.25, small: true });
      for (let i = 0; i < H.n(9 + (CEL ? 4 : 0)); i++) { const b = i / 9 * TAU + Math.random() * 0.5, v = 4 + Math.random() * 4; splint.push({ x: c.x1, y: c.y1, z: 0.35, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: 1 + Math.random() * 4, t: 0, life: 0.3 + Math.random() * 0.25 }); }
      H.burst(c.x1, c.y1 - 0.35, 'spark', 8, { v: 6, up: 2, g: 5, life: 0.35, size: 1.6, color: [HONEY, PALE, CORE] }); }

    const F = H.add({ life: LIFE, x: p0.x, y: p0.y, key: 'cataclysm', log, NI, NC,
      update(dt, f) {
        const t = f.t;
        if (me.dead && !dead) { dead = true; f.life = Math.min(f.life, 0.6); }   // the pet down: no more hits, everything fades
        if (!dead) { while (nImp < NI && t >= T1 + nImp * TBN) { impact(nImp, t); nImp++; } if (!shattered && t >= TS) shatter(t); }
        flash *= Math.exp(-dt * 4.5);
        for (const p of pebbles) { const u = sm((t - p.t0) / 0.8); p.z = 0.04 + p.h * u + Math.sin(t * 23 + p.ph) * 0.03 * u; }
        // the falling rock sheds embers from its veins
        if (t > TA && t < TS && Math.random() < dt * 30 * H.Q()) { const r = rockAt(t), b = Math.random() * TAU; embers.push({ x: r[0] + Math.cos(b) * RT * 0.8, y: r[1], z: r[2] + Math.sin(b) * RT * 0.8, vx: (Math.random() - 0.5) * 0.8, vy: 0, vz: t < T1 ? 2.5 : 0.6, t: 0, life: 0.5 + Math.random() * 0.4, s: 0.08 + Math.random() * 0.08 }); }
        for (let i = chipsL.length - 1; i >= 0; i--) { const q = chipsL[i]; q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 16 * dt; q.rot += q.vr * dt; if (q.z < 0.04) { q.z = 0.04; if (q.vz < -1.5) { q.vz = -q.vz * 0.3; q.vx *= 0.5; q.vy *= 0.5; q.vr *= 0.5; } else { q.vz = 0; q.vx *= Math.exp(-dt * 8); q.vy *= Math.exp(-dt * 8); q.vr *= Math.exp(-dt * 8); } } if (q.t >= q.life) chipsL.splice(i, 1); }
        for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.t += dt; if (p.t < 0) continue; const d = Math.exp(-2.2 * dt); p.vx *= d; p.vy *= d; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.t >= p.life) puffs.splice(i, 1); }
        for (let i = embers.length - 1; i >= 0; i--) { const p = embers[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 1.5 * dt; if (p.t >= p.life) embers.splice(i, 1); }
        for (let i = splint.length - 1; i >= 0; i--) { const p = splint[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0.02, p.z + p.vz * dt); p.vz -= 14 * dt; p.vx *= Math.exp(-dt * 2); p.vy *= Math.exp(-dt * 2); if (p.t >= p.life) splint.splice(i, 1); }
        for (const q of shell) { q.t += dt; if (q.rest) continue; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 15 * dt; q.rot += q.vr * dt; if (q.z < q.r) { q.z = q.r; if (q.vz < -2) { q.vz = -q.vz * 0.25; q.vx *= 0.45; q.vy *= 0.45; q.vr *= 0.4; H.X.sfx && q.t < 1 && Math.random() < 0.3 && H.X.sfx.thud(); puffs.push({ x: q.x, y: q.y, z: 0.1, vx: q.vx * 0.3, vy: 0, vz: 0.3, t: 0, life: 0.7, s: 0.35 + q.r * 0.6 }); } else { q.rest = true; q.vz = 0; } } }
        for (const c of crys) { if (c.done) continue; const u = cl((t - c.t0) / c.ft); c.x = lerp(c.x0, c.x1, u); c.y = lerp(c.y0, c.y1, u); c.z = lerp(c.z0, 0, u) + 4 * c.ap * u * (1 - u);
          if (u >= 1 && !c.landed) { c.landed = true; puffs.push({ x: c.x1, y: c.y1, z: 0.05, vx: 0, vy: 0, vz: 0.3, t: 0, life: 0.6, s: 0.45 }); }
          if (!dead && t >= c.boom) blast(c, t); }
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, out = cl(f.life / 0.6);
        // the mark: a widening amber circle round the first landing, light only
        if (t < T1 + 0.3) { const u = sm(t / 0.55), a = sstep(0, 0.15, t) * (1 - sstep(T1, T1 + 0.3, t)), RR = RI * T * (0.35 + 0.65 * u), sx = H.sx(p0.x), sy = H.sy(p0.y);
          E.floorSpr(c, E.amberBand(), sx, sy, RR, a * (0.55 + 0.2 * Math.sin(t * 9)), true); E.floorSpr(c, glowSprite(AMBER), sx, sy, RR * 0.9, a * 0.16 * (0.5 + u), true); }
        // the rock's shadow: it grows and darkens as the rock comes down
        if (t > TA && !shattered) { const r = rockAt(t), hz = cl((r[2] - ZR) / (Z0 - ZR)), sx = H.sx(r[0]), sy = H.sy(r[1]); E.floorSpr(c, E.shade(), sx, sy, RT * T * (1.15 - 0.55 * hz), (0.12 + 0.42 * (1 - hz)) * out); }
        if (shattered) { const s = stops[NI - 1], u = cl((t - TS) / 0.4); E.floorSpr(c, E.shade(), H.sx(s.x), H.sy(s.y), RT * T * (1.15 + 0.4 * u), 0.5 * (1 - u)); }
        // each landing: the amber crater cracks (light only, fading), a pool of light, a light ring racing out
        for (const R of rings) { const p = t - R.t0, sx = H.sx(R.x), sy = H.sy(R.y), RR = R.R * T; if (p < 0) continue;
          if (R.small) { const q = cl(p / 0.45); E.floorSpr(c, glowSprite(HONEY), sx, sy, RR * 1.1, 0.6 * (1 - q) * out, true); if (q < 1) E.floorSpr(c, E.amberBand(), sx, sy, RR * (0.4 + 0.9 * E.sm(q)), (1 - q) * 0.8 * out, true); continue; }
          const fade = (1 - sstep(0.6, 2.0, p)) * out;
          if (R.cr) { const cw = R.cr.width, ch = R.cr.height, k = RR / ((cw - 24) / 2); E.addLayer(c, R.cr, sx - cw / 2 * k, sy - ch / 2 * k, cw * k, ch * k, fade * (0.9 + 0.5 * Math.exp(-p * 4)) * (R.fin ? 1.2 : 1)); }
          E.floorSpr(c, glowSprite(AMBER), sx, sy, RR * 0.9, (0.35 * Math.exp(-p * 2.5) + 0.08 * fade) * out, true);
          const q = cl(p / 0.5); if (q < 1) E.floorSpr(c, E.amberBand(), sx, sy, RR * (0.45 + 0.95 * E.sm(Math.sqrt(q))), (1 - q) * 0.9 * out, true);
          const qd = cl(p / 0.85); if (qd < 1) { const rr = RR * (0.55 + 1.05 * (1 - (1 - qd) * (1 - qd))); E.floorSpr(c, E.dustBand(), sx, sy, rr, (1 - qd) * sstep(0, 0.08, qd) * (R.fin ? 0.95 : 0.8) * out); } }
        // landed crystals light the floor round them
        for (const cr of crys) { if (cr.done || !cr.landed) continue; const g = cl((t - cr.land) / 0.6); E.floorSpr(c, glowSprite(AMBER), H.sx(cr.x1), H.sy(cr.y1), T * (0.55 + 0.4 * g) * cr.sc, (0.25 + 0.4 * g) * out, true); }
      },
      draw(c, f, X, Y, T) {
        const t = f.t, SC = E.scr(c), out = cl(f.life / 0.6), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45;
        const want = Math.max(36, Math.min(120, Math.round(RT * T * SC.k / 12) * 12));
        if (!RS || RS.Spx !== want) RS = rockSet(want, ev);
        const cpx = Math.max(16, Math.min(160, Math.round(T * SC.k / 8) * 8)); if (!CS || CS.px !== cpx) { CS = crySet(cpx, ev); CS.px = cpx; }
        if (!chipS) chipS = E.chips(Math.round(T * SC.k * 0.4));
        // sprite building, spread over frames: the bucket in view now, the ones coming, the resting one and its pieces
        // (only the very first view, and the resting render at the end, are ever built in one go; otherwise a missing
        //  bucket shows the nearest earlier one that is ready, so a slow device sees a slower spin, never a stall)
        { const b = t >= TF ? nq : Math.floor(angAt(Math.max(t, TA)) / STEP); if (!RS.any || t >= TF) { RS.build(b, null); RS.any = true; }
          const budget = t < TA ? 12 : 7, t0 = performance.now(), left = () => budget - (performance.now() - t0);
          for (const j of [b, nq].concat(Array.from({ length: nq + 1 }, (_, i) => b + 1 + i))) { if (left() <= 0) break; if (j <= nq) RS.build(j, left()); }
          if (t > TA && RS.get(BF).ready && !RS.get(BF).res.chunks && (left() > 0 || t > TF)) E.rockChunks(RS.get(BF).res);
          if (!CS.ready && t > TA) CS.step(t > TS - 0.1 ? null : Math.max(1, left())); }
        const items = [];
        // the rock
        if (t > TA && !shattered) { const r = rockAt(t), a = angAt(t), fb = t >= TF ? nq : a / STEP; let b0 = Math.floor(fb), w = fb - b0; while (b0 > 0 && !RS.get(b0).ready) { b0--; w = 0; } const B0 = RS.get(b0), B1 = RS.get(b0 + 1);
          items.push({ y: r[1] + 0.5, f: () => {
            const res = B0.ready ? B0.res : null; if (!res) return; const sc = RT * T / res.S, cx = H.sx(r[0]), cy = H.sy(r[1]) - r[2] * T, pre = t > TF ? sm((t - TF) / (TS - TF)) : 0;
            const jx = pre * T * 0.03 * Math.sin(t * 63), jy = pre * T * 0.02 * Math.sin(t * 51), x = cx - res.cx * sc + jx, y = cy - res.cy * sc + jy, w2 = res.W * sc, h2 = res.H * sc;
            const near = Math.hypot(PX - cx, PY - cy) / (RT * T), dim = r[2] < ZR + 1.5 ? 0.5 + 0.5 * sstep(0.55, 1.15, near) : 1, A = out * dim;
            E.glowAt(c, cx, cy, RT * T * 1.7, AMBER, (0.12 + 0.3 * flash + 0.35 * pre) * A);
            c.save(); c.globalAlpha = A; c.drawImage(res.body, x, y, w2, h2); if (B1.ready && w > 0.03 && t < TF) { c.globalAlpha = A * w; c.drawImage(B1.res.body, x, y, w2, h2); } c.restore();
            const gk = (0.72 + 0.14 * Math.sin(t * 7.3) + 0.9 * flash + 0.5 * pre) * A; E.addLayer(c, res.glow, x, y, w2, h2, gk * (B1.ready && t < TF ? 1 - w * 0.5 : 1)); if (B1.ready && w > 0.03 && t < TF) E.addLayer(c, B1.res.glow, x, y, w2, h2, gk * w * 0.5);
            if (pre > 0 && res.seam) { E.addLayer(c, res.seam, x, y, w2, h2, pre * 2.2 * A); E.glowAt(c, cx, cy, RT * T * (0.6 + 0.6 * pre), HONEY, pre * 0.5 * A); }
          } }); }
        // the shell pieces
        for (const q of shell) { const fo = 1 - sstep(LIFE - 1.4, LIFE - 0.7, t), sink = sstep(LIFE - 1.4, LIFE - 0.5, t); if (fo <= 0.01) continue;
          items.push({ y: q.y, f: () => { const sc = q.u * T, cx = H.sx(q.x), cy = H.sy(q.y) - (q.z - sink * q.r * 0.8) * T, a = fo * out, hot = Math.exp(-q.t * 2.2);
            const Q = q.q, dw = Q.w * sc, dh = Q.h * sc, th = Math.min(dw, dh) * 0.12; c.save(); c.globalAlpha = a; c.translate(cx, cy); c.rotate(q.rot); c.drawImage(Q.bk, -dw / 2, -dh / 2 + th, dw, dh); if (hot > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * hot * 0.5; c.drawImage(Q.hot, -dw / 2, -dh / 2 + th * 0.6, dw, dh); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; } c.drawImage(Q.cv, -dw / 2, -dh / 2, dw, dh); c.restore();
            if (hot > 0.02) E.glowAt(c, cx, cy, q.r * T * 1.4, AMBER, hot * 0.35 * a); } }); }
        // the ember crystals: flying, landed and glowing, then gone in their blast
        const cv = CS.ready ? CS.v : null;
        if (cv) for (const cr of crys) { if (cr.done) continue; items.push({ y: cr.y + 0.2, f: () => {
          const res = cv[cr.v], sx = H.sx(cr.x), sy = H.sy(cr.y) - cr.z * T, g = cr.landed ? cl((t - cr.land) / 0.6) : 0, pulse = 1 + (cr.landed ? 0.05 * g * Math.sin(t * 40) : 0), sc = T / res.S * cr.sc * pulse;
          const dim = 0.45 + 0.55 * sstep(0.3 * T, 0.9 * T, Math.hypot(sx - PX, sy - T * 0.3 - PY)), A = out * dim;
          E.glowAt(c, sx, sy - T * 0.3 * cr.sc, T * (0.5 + 0.5 * g) * cr.sc, AMBER, (0.25 + 0.45 * g) * A);
          const drawOne = (r2, ox, oy, k) => { const s2 = sc * k; c.save(); c.globalAlpha = A; if (!cr.landed) { c.translate(sx, sy - T * 0.3 * cr.sc); c.rotate((t - cr.t0) * cr.spin); c.translate(-sx, -(sy - T * 0.3 * cr.sc)); } c.drawImage(r2.body, sx + ox - r2.cx * s2, sy + oy - r2.cy * s2, r2.W * s2, r2.H * s2); c.restore();
            E.addLayer(c, r2.glow, sx + ox - r2.cx * s2, sy + oy - r2.cy * s2, r2.W * s2, r2.H * s2, (0.3 + 0.95 * g * g + 0.15 * Math.sin(t * 31 + cr.v)) * A); };
          drawOne(res, 0, 0, 1);
          if (g > 0.5) E.glowAt(c, sx, sy - T * 0.3 * cr.sc, T * 0.35 * cr.sc, CORE, (g - 0.5) * 1.2 * A); } }); }
        // the chips and the pebbles of the mark
        const cs = chipS;
        for (const p of pebbles) { if (p.z == null) continue; items.push({ y: p.y, f: () => { const r2 = cs[p.v], s = p.s * T / r2.S, sx = H.sx(p.x), sy = H.sy(p.y) - p.z * T, a = sstep(0, 0.2, t - p.t0) * out; c.save(); c.globalAlpha = a; c.translate(sx, sy); c.rotate(p.ph + Math.sin(t * 17 + p.ph) * 0.15); c.drawImage(r2.body, -r2.cx * s, -r2.cy * s, r2.W * s, r2.H * s); c.restore(); } }); }
        for (const q of chipsL) items.push({ y: q.y, f: () => { const r2 = cs[q.v], s = q.s * T / r2.S, sx = H.sx(q.x), sy = H.sy(q.y) - q.z * T, a = (1 - sstep(q.life - 0.35, q.life, q.t)) * out; c.save(); c.globalAlpha = a; c.translate(sx, sy); c.rotate(q.rot); c.drawImage(r2.body, -r2.cx * s, -r2.cy * s, r2.W * s, r2.H * s); c.restore(); } });
        items.sort((p, q) => p.y - q.y); for (const it of items) it.f();
        // dust (normal), embers and splinters (light)
        { const sp = E.puff(); c.save(); for (const p of puffs) { if (p.t < 0) continue; const q = p.t / p.life, sx = H.sx(p.x), sy = H.sy(p.y) - p.z * T, r = T * p.s * (0.6 + 0.9 * q); c.globalAlpha = Math.sin(Math.min(1, q * 4) * Math.PI / 2) * (1 - q) * 0.75 * out * (0.4 + 0.6 * sstep(0.3 * T, 1.0 * T, Math.hypot(sx - PX, sy - PY))); c.drawImage(sp, sx - r, sy - r * 0.8, r * 2, r * 1.6); } c.restore(); }
        { const mo = E.mote(); c.save(); c.globalCompositeOperation = 'lighter'; for (const p of embers) { const q = p.t / p.life, r = T * p.s * (1 - q * 0.5); c.globalAlpha = (1 - q) * out; c.drawImage(mo, H.sx(p.x) - r, H.sy(p.y) - p.z * T - r, r * 2, r * 2); }
          c.lineCap = 'round'; for (const p of splint) { const q = p.t / p.life, sx = H.sx(p.x), sy = H.sy(p.y) - p.z * T, ex = sx - p.vx * T * 0.035, ey = sy - (p.vy - p.vz) * T * 0.035; c.globalAlpha = (1 - q) * out; c.strokeStyle = 'rgba(242,183,58,0.45)'; c.lineWidth = T * 0.09; c.beginPath(); c.moveTo(ex, ey); c.lineTo(sx, sy); c.stroke(); c.strokeStyle = 'rgba(255,244,214,0.95)'; c.lineWidth = T * 0.035; c.stroke(); } c.restore(); }
      } });
    return F;
  };
})();
