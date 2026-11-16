/* ---------- Dark's Dead Scream: the skull, a 3D model drawn live with GLM (20k5uz; v391 U4) ----------
   An original, menacing skull: a heavy vault, an angry brow (the ridges pulled down toward the glabella), deep conical
   orbits slanted inward, sharp cheekbones on thin zygomatic arches with hollow temples behind them, a pear-shaped nasal
   aperture, a row of worn teeth with long upper canines, a separately hinged mandible (its condyles under the arches),
   and a broken crown of obsidian shards grown out of the bone.
   The bone is modelled as a signed distance field (smooth-unioned ellipsoids, capsules and a rounded box, the orbits and
   the nose carved out) and turned into a mesh by surface nets on a narrow band (a coarse pass finds the shell, only the
   cells near it are sampled finely); each vertex is projected onto the surface, its normal is the field's gradient, its
   occlusion is sampled along that normal, and two more values are measured: how thin the bone is there (it glows a little
   through at thin edges) and how deep in an orbit or the nose it lies (those walls are carved hollows: dark, the orbits
   lit from inside by the soul fire). The teeth, the crown and the burst's bone shards are GLM builder primitives.
   The mesh is built once, a few milliseconds a frame (prepare), and cached for every later cast.
   Frame: x right, y forward (the face looks along +y), z up; units: the vault is about 1.9 wide; (0, 0, 0) lies at the
   brow line, the vault's top at z 1.26, the chin at z -1.35; the mandible turns about the x axis through its condyles.
   Materials (GLM ids 130..134, the shader branch in 20k5uz marked DS-SKULL-MAT): 130 bone (vA.x - 130 = 0.3 x the depth
   in an orbit or the nose, vA.y = thinness, vA.z = occlusion), 131 a broken bone shard, 133 a tooth (133.3 the lower
   row), 134 obsidian. Per draw: glow (the scream's light), glow2 (how far the cracks have spread), spill (dissolved, 0..1),
   wear (the soul fire, 1 burning .. 0 out).
   The game draws it through draw(c, x, y, k, pose) (true when drawn on the GPU; false: the caller draws its 2D picture);
   window.__DS_GL = 1 forces the GPU under a software rasteriser (tests), 0 forces the 2D picture. */
const DEADSCREAM_SKULL = (() => {
  const TAU = Math.PI * 2;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : undefined; } catch (e) { return undefined; } };
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  /* ================= the field ================= */
  function sdE(x, y, z, cx, cy, cz, rx, ry, rz) { const X = (x - cx) / rx, Y = (y - cy) / ry, Z = (z - cz) / rz, k0 = Math.sqrt(X * X + Y * Y + Z * Z), X2 = X / rx, Y2 = Y / ry, Z2 = Z / rz, k1 = Math.sqrt(X2 * X2 + Y2 * Y2 + Z2 * Z2); return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz); }
  // (an ellipsoid turned in the x-z plane by angle a about its centre: c, s its cosine and sine)
  function sdER(x, y, z, cx, cy, cz, rx, ry, rz, c, s) { const dx = x - cx, dz = z - cz; return sdE(dx * c + dz * s, y, -dx * s + dz * c, 0, cy, 0, rx, ry, rz); }
  function sdCap(x, y, z, ax, ay, az, bx, by, bz, r1, r2) { const px = x - ax, py = y - ay, pz = z - az, dx = bx - ax, dy = by - ay, dz = bz - az; let h = (px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz); h = h < 0 ? 0 : h > 1 ? 1 : h; const qx = px - dx * h, qy = py - dy * h, qz = pz - dz * h; return Math.sqrt(qx * qx + qy * qy + qz * qz) - (r1 + (r2 - r1) * h); }
  function sdRB(x, y, z, cx, cy, cz, hx, hy, hz, r) { const qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r, qz = Math.abs(z - cz) - hz + r, mx = qx > 0 ? qx : 0, my = qy > 0 ? qy : 0, mz = qz > 0 ? qz : 0, mq = qx > qy ? (qx > qz ? qx : qz) : (qy > qz ? qy : qz); return Math.sqrt(mx * mx + my * my + mz * mz) + (mq < 0 ? mq : 0) - r; }
  function smin(a, b, k) { const d = a - b, h = k - (d < 0 ? -d : d); if (h <= 0) return a < b ? a : b; const q = h / k; return (a < b ? a : b) - q * q * k * 0.25; }
  function smax(a, b, k) { return -smin(-a, -b, k); }
  // (a cheap lower bound of the distance to a feature: skipped when it cannot touch the blend)
  function far(x, y, z, cx, cy, cz, R, d, k) { const dx = x - cx, dy = y - cy, dz = z - cz, L = d + k + R; return L < 0 || dx * dx + dy * dy + dz * dz > L * L; }
  const C1 = Math.cos(0.2), S1 = Math.sin(0.2), C2 = Math.cos(0.15), S2 = Math.sin(0.15);
  // the carved hollows (also read on their own, to tell an orbit's or the nose's wall from the outer bone)
  const sdOrb = (ax, y, z) => smin(sdER(ax, y, z, 0.35, 0.9, -0.14, 0.255, 0.42, 0.215, C1, S1), sdER(ax, y, z, 0.31, 0.5, -0.15, 0.16, 0.3, 0.14, C2, S2), 0.08);
  const sdNas = (x, y, z) => smin(sdE(x, y, z, 0, 0.88, -0.57, 0.105, 0.34, 0.12), sdE(x, y, z, 0, 0.88, -0.43, 0.05, 0.34, 0.1), 0.04);
  function sdCran(x, y, z) {
    const ax = x < 0 ? -x : x;
    let d = sdE(x, y, z, 0, -0.18, 0.27, 0.91, 1.07, 0.92);                                                                        // the vault
    if (!far(x, y, z, 0, -0.62, 0, 0.72, d, 0.25)) d = smin(d, sdE(x, y, z, 0, -0.62, 0.0, 0.7, 0.55, 0.6), 0.25);                // a full occiput, low at the back
    d = smax(d, ax - 0.89, 0.3);                                                                                                  // flatter temples
    if (!far(ax, y, z, 1.06, 0.12, -0.3, 0.42, -d, 0.16)) d = smax(d, -sdE(ax, y, z, 1.06, 0.12, -0.3, 0.23, 0.42, 0.34), 0.16);  // the temporal hollow behind each cheekbone
    if (!far(ax, y, z, 0.36, 0.7, 0.0, 0.48, d, 0.12)) d = smin(d, sdCap(ax, y, z, 0.06, 0.82, -0.05, 0.66, 0.57, 0.08, 0.118, 0.082), 0.12);   // the brow ridges: an angry V, low at the glabella
    if (!far(x, y, z, 0, 0.84, -0.04, 0.13, d, 0.08)) d = smin(d, sdE(x, y, z, 0, 0.84, -0.04, 0.13, 0.08, 0.1), 0.08);           // the glabella
    if (!far(x, y, z, 0, 0.47, -0.6, 0.54, d, 0.22)) d = smin(d, sdRB(x, y, z, 0, 0.47, -0.6, 0.34, 0.3, 0.27, 0.13), 0.22);       // the face (maxilla)
    if (!far(ax, y, z, 0.53, 0.55, -0.37, 0.21, d, 0.12)) d = smin(d, sdE(ax, y, z, 0.53, 0.55, -0.37, 0.21, 0.17, 0.15), 0.12);  // the cheekbones, sharp
    if (!far(ax, y, z, 0.73, 0.19, -0.36, 0.34, d, 0.07)) d = smin(d, sdCap(ax, y, z, 0.63, 0.4, -0.39, 0.83, -0.02, -0.33, 0.06, 0.045), 0.07);   // the zygomatic arches
    if (!far(x, y, z, 0, 0.44, -0.79, 0.35, d, 0.09)) d = smin(d, sdE(x, y, z, 0, 0.44, -0.79, 0.35, 0.34, 0.085), 0.09);          // the ridge that holds the upper teeth
    if (!far(x, y, z, 0, 0.93, -0.16, 0.14, d, 0.04)) d = smin(d, sdE(x, y, z, 0, 0.93, -0.16, 0.035, 0.05, 0.14), 0.04);         // the nasal bones
    d = smax(d, -z - 0.9, 0.08);                                                                                                  // the base, cut away below
    if (!far(ax, y, z, 0.34, 0.74, -0.14, 0.62, -d, 0.05)) d = smax(d, -sdOrb(ax, y, z), 0.05);                                   // the orbits: deep, conical, slanted
    if (!far(x, y, z, 0, 0.88, -0.5, 0.42, -d, 0.03)) d = smax(d, -sdNas(x, y, z), 0.03);                                         // the nasal aperture: a pear
    return d;
  }
  function sdJaw(x, y, z) {
    const ax = Math.abs(x), bb = sdRB(ax, y, z, 0.38, 0.27, -0.95, 0.42, 0.56, 0.52, 0.0); if (bb > 0.25) return bb;   // (far from it: the bounding box is enough)
    // the body: a heavy plate along the dental arch, its upper edge (the alveolar ridge) and its thick lower border blended
    let d = sdCap(ax, y, z, 0, 0.6, -1.08, 0.32, 0.5, -1.07, 0.095, 0.095);
    d = smin(d, sdCap(ax, y, z, 0.32, 0.5, -1.07, 0.52, 0.22, -1.07, 0.095, 0.09), 0.06);
    let b = sdCap(ax, y, z, 0, 0.6, -1.25, 0.31, 0.47, -1.23, 0.12, 0.115);
    b = smin(b, sdCap(ax, y, z, 0.31, 0.47, -1.23, 0.53, 0.16, -1.2, 0.115, 0.105), 0.06);
    b = smin(b, sdCap(ax, y, z, 0.53, 0.16, -1.2, 0.59, -0.08, -1.17, 0.105, 0.1), 0.06);
    d = smin(d, b, 0.16);
    d = smin(d, sdE(x, y, z, 0, 0.64, -1.27, 0.2, 0.11, 0.12), 0.1);                              // the chin, square and heavy
    d = smin(d, sdCap(ax, y, z, 0.59, -0.04, -1.14, 0.6, -0.08, -0.68, 0.1, 0.075), 0.14);        // the ramus, one broad plate tucked in under the arch
    d = smin(d, sdCap(ax, y, z, 0.58, -0.16, -1.12, 0.6, -0.14, -0.68, 0.085, 0.065), 0.12);
    d = smin(d, sdE(ax, y, z, 0.61, -0.12, -0.6, 0.1, 0.08, 0.065), 0.05);                        // the condyle
    return d;
  }

  /* ================= surface nets on a narrow band =================
     The skull is mirror-symmetric: the grid is laid symmetric about x = 0, only its x >= 0 half is sampled (the other
     mirrored), and only the x >= 0 half's vertices are finished (the others are their mirror images). A coarse pass
     (every 2nd point) finds the shell; blocks far from it take one sign, those near it are sampled exactly. */
  function* nets(F, bx, h, cls) {
    const hx = Math.ceil(Math.max(-bx[0], bx[3]) / h), nx = 2 * hx + 1, x0 = -hx * h, y0 = bx[1], z0 = bx[2], ny = Math.ceil((bx[4] - y0) / h) + 1, nz = Math.ceil((bx[5] - z0) / h) + 1, nxy = nx * ny;
    const V = new Float32Array(nx * ny * nz), S = 2, cx = Math.ceil((hx + 1) / S) + 1, cy = Math.ceil((ny - 1) / S) + 1, cz = Math.ceil((nz - 1) / S) + 1, CV = new Float32Array(cx * cy * cz);
    let work = 0;
    for (let k = 0; k < cz; k++) { for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) CV[(k * cy + j) * cx + i] = F(i * S * h, y0 + j * S * h, z0 + k * S * h); if ((work += cx * cy) > 4000) { work = 0; yield 0; } }
    const thr = S * h * 1.75 * 1.35, near = new Uint8Array((cx - 1) * (cy - 1) * (cz - 1)), done = new Uint8Array(nx * ny * nz);
    // (the x >= 0 half, columns hx .. nx - 1; the far blocks first, filled from a corner, then the near ones sampled exactly)
    for (let pass = 0; pass < 2; pass++) for (let bk = 0; bk < cz - 1; bk++) { for (let bj = 0; bj < cy - 1; bj++) for (let bi = 0; bi < cx - 1; bi++) {
      const bid = (bk * (cy - 1) + bj) * (cx - 1) + bi;
      if (!pass) { let m = 1e9; for (let c = 0; c < 8; c++) { const q = CV[((bk + (c >> 2)) * cy + bj + ((c >> 1) & 1)) * cx + bi + (c & 1)]; m = Math.min(m, q < 0 ? -q : q); } near[bid] = m < thr ? 1 : 0; if (near[bid]) continue; }
      else if (!near[bid]) continue;
      const v0 = CV[(bk * cy + bj) * cx + bi], i1 = Math.min(hx, bi * S + S), j1 = Math.min(ny - 1, bj * S + S), k1 = Math.min(nz - 1, bk * S + S);
      for (let k = bk * S; k <= k1; k++) for (let j = bj * S; j <= j1; j++) for (let i = bi * S; i <= i1; i++) { const o = k * nxy + j * nx + hx + i; if (pass) { if (done[o]) continue; done[o] = 1; work++; } const v = pass ? F(i * h, y0 + j * h, z0 + k * h) : v0; V[o] = v; V[o - 2 * i] = v; }
      if (pass && work > 2500) { work = 0; yield 0; } } }
    // a vertex in every cell the surface crosses: the mean of its edges' crossings
    const CI = new Int32Array(nx * ny * nz).fill(-1), P = [], VC = [], OFF = [0, 1, nx, nx + 1, nxy, nxy + 1, nxy + nx, nxy + nx + 1], CO = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    const ED = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (let k = 0; k < nz - 1; k++) { for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const b = k * nxy + j * nx + i; let ins = 0; for (let c = 0; c < 8; c++) if (V[b + OFF[c]] < 0) ins++; if (!ins || ins === 8) continue;
      let sx = 0, sy = 0, sz = 0, n = 0; for (let q = 0; q < 12; q++) { const e = ED[q], va = V[b + OFF[e[0]]], vb = V[b + OFF[e[1]]]; if ((va < 0) === (vb < 0)) continue; const t = va / (va - vb), A = CO[e[0]], B2 = CO[e[1]]; sx += A[0] + (B2[0] - A[0]) * t; sy += A[1] + (B2[1] - A[1]) * t; sz += A[2] + (B2[2] - A[2]) * t; n++; }
      CI[b] = VC.length; VC.push(b); P.push(x0 + (i + sx / n) * h, y0 + (j + sy / n) * h, z0 + (k + sz / n) * h); }
      if ((work += nx * ny) > 50000) { work = 0; yield 0; } }
    // a quad round every grid edge the surface crosses
    const I = [], quad = (a, b2, c, d) => { if (a < 0 || b2 < 0 || c < 0 || d < 0) return; const d1 = (P[a * 3] - P[c * 3]) ** 2 + (P[a * 3 + 1] - P[c * 3 + 1]) ** 2 + (P[a * 3 + 2] - P[c * 3 + 2]) ** 2, d2 = (P[b2 * 3] - P[d * 3]) ** 2 + (P[b2 * 3 + 1] - P[d * 3 + 1]) ** 2 + (P[b2 * 3 + 2] - P[d * 3 + 2]) ** 2; if (d1 < d2) I.push(a, b2, c, a, c, d); else I.push(a, b2, d, b2, c, d); };
    for (let k = 1; k < nz - 1; k++) { for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const b = k * nxy + j * nx + i, s0 = V[b] < 0;
      if (s0 !== (V[b + 1] < 0)) quad(CI[b - nx - nxy], CI[b - nxy], CI[b], CI[b - nx]);
      if (s0 !== (V[b + nx] < 0)) quad(CI[b - 1 - nxy], CI[b - nxy], CI[b], CI[b - 1]);
      if (s0 !== (V[b + nxy] < 0)) quad(CI[b - 1 - nx], CI[b - nx], CI[b], CI[b - 1]); }
      if ((work += nx * ny) > 50000) { work = 0; yield 0; } }
    // each vertex onto the surface; its normal (the field's gradient), occlusion, thinness and material; the x < 0 half mirrored
    const nv = P.length / 3, pos = new Float32Array(P), nrm = new Float32Array(nv * 3), att = new Float32Array(nv * 3), e = 0.004;
    for (let v = 0; v < nv; v++) { const b = VC[v], ci = b % nx;
      if (ci >= hx) { const m = CI[b - ci + (nx - 2 - ci)]; if (m >= 0 && m < v) { pos[v * 3] = -pos[m * 3]; pos[v * 3 + 1] = pos[m * 3 + 1]; pos[v * 3 + 2] = pos[m * 3 + 2]; nrm[v * 3] = -nrm[m * 3]; nrm[v * 3 + 1] = nrm[m * 3 + 1]; nrm[v * 3 + 2] = nrm[m * 3 + 2]; att[v * 3] = att[m * 3]; att[v * 3 + 1] = att[m * 3 + 1]; att[v * 3 + 2] = att[m * 3 + 2]; continue; } }
      let x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2]; const d = F(x, y, z); let gx = F(x + e, y, z) - d, gy = F(x, y + e, z) - d, gz = F(x, y, z + e) - d; const gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1; gx /= gl; gy /= gl; gz /= gl; x -= gx * d; y -= gy * d; z -= gz * d;
      pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z; nrm[v * 3] = gx; nrm[v * 3 + 1] = gy; nrm[v * 3 + 2] = gz;
      let occ = 0; for (let s = 1, w = 1; s <= 3; s++, w *= 0.6) { const dd = 0.035 * s * s; occ += Math.max(0, dd - F(x + gx * dd, y + gy * dd, z + gz * dd)) * w / dd; }
      const thin = cl(1 + F(x - gx * 0.075, y - gy * 0.075, z - gz * 0.075) / 0.055);
      att[v * 3] = cls(x, y, z); att[v * 3 + 1] = thin; att[v * 3 + 2] = cl(1 - occ * 0.42);
      if ((work += 7) > 1500) { work = 0; yield 0; } }
    return { pos, nrm, att, idx: nv > 65535 ? new Uint32Array(I) : new Uint16Array(I), nv, ntri: I.length / 3, gl: null };
  }
  // an orbit's or the nose's wall: 130 + 0.3 x how deep in it (0 the rim .. 1 the back)
  const clsCran = (x, y, z) => { const ax = Math.abs(x), o = sdOrb(ax, y, z), na = sdNas(x, y, z); let cav = 0;
    if (o < 0.05) cav = Math.max(cav, (1 - sstep(0.0, 0.05, o)) * (0.15 + 0.85 * cl((0.98 - y) / 0.6)));
    if (na < 0.05) cav = Math.max(cav, (1 - sstep(0.0, 0.05, na)) * (0.25 + 0.75 * cl((0.98 - y) / 0.4)));
    return 130 + 0.3 * cav; };

  /* ================= the parts from primitives: teeth, crown, shards ================= */
  // the dental arches: [x, y] at angle a from the front; teeth by angle: [a, kind (0 incisor, 1 canine, 2 premolar, 3 molar), width]
  const ARCH_U = a => [0.315 * Math.sin(a), 0.405 + 0.335 * Math.cos(a)], ARCH_L = a => [0.285 * Math.sin(a), 0.4 + 0.3 * Math.cos(a)];
  const TEETH = [[0.11, 0, 0.068], [0.32, 0, 0.06], [0.53, 1, 0.066], [0.74, 2, 0.07], [0.93, 2, 0.072], [1.13, 3, 0.09]];
  function teeth(B, arch, upper, mat) {
    for (const sg of [-1, 1]) for (const [a0, kind, w] of TEETH) { const a = a0 * sg, p = arch(a), q = arch(a + 0.01 * sg), tx0 = (q[0] - p[0]) * sg, ty0 = (q[1] - p[1]) * sg, tl = Math.hypot(tx0, ty0), tx = tx0 / tl * sg, ty = ty0 / tl * sg, ox = ty * sg, oy = -tx * sg;   // (tangent along the arch; outward normal)
      const jit = 1 + 0.08 * Math.sin(a * 37.1 + (upper ? 0 : 2)), ztop = upper ? -0.8 : -1.07, len = (kind === 1 ? (upper ? 0.24 : 0.17) : kind === 0 ? (upper ? 0.17 : 0.14) : (upper ? 0.14 : 0.12)) * jit, dir = upper ? -1 : 1, zc = ztop + dir * len * 0.5, ww = w * 0.5 * (kind === 3 ? 1 : 0.94);
      if (kind === 1) { const tip = [p[0] - ox * 0.015, p[1] - oy * 0.015, ztop + dir * len], base = [p[0], p[1], ztop - dir * 0.02]; B.tube(base, tip, ww * 1.02, 0.006, mat, { seg: 10, rings: 3, cap0: 'round', cap1: 'round' }); continue; }
      B.push([tx * ww, ty * ww, 0], [ox * 0.034 * (kind >= 2 ? 1.5 : 1), oy * 0.034 * (kind >= 2 ? 1.5 : 1), 0], [0, 0, len * 0.5], [p[0], p[1], zc]);
      if (kind >= 2) B.box([0, 0, 0], [1, 1, 1], 0.42, mat); else B.ell([0, 0, 0], [1, 1, 1], mat, { seg: 12, rings: 8 });
      B.pop(); }
  }
  // a broken crown: obsidian shards grown out of the vault (back ones taller), each from just under the surface
  const CROWN = [[0.0, 0.66, 0.34, 0.07], [0.55, 0.68, 0.46, 0.08], [-0.55, 0.7, 0.44, 0.08], [1.2, 0.6, 0.62, 0.095], [-1.2, 0.58, 0.64, 0.095], [1.95, 0.55, 0.56, 0.085], [-1.95, 0.57, 0.54, 0.085], [2.75, 0.62, 0.4, 0.07], [-2.75, 0.62, 0.42, 0.07]];
  function surfAt(dx, dy, dz) { const c = [0, -0.16, 0.3]; let t = 2.2; for (let i = 0; i < 80; i++) { const d = sdCran(c[0] + dx * t, c[1] + dy * t, c[2] + dz * t); if (d < 0.002) break; t -= Math.max(0.004, d * 0.8); if (t < 0) break; } return [c[0] + dx * t, c[1] + dy * t, c[2] + dz * t]; }
  function crown(B) {
    CROWN.forEach(([az, el, len, r], i) => { const dx = Math.sin(az) * Math.cos(el), dy = Math.cos(az) * Math.cos(el), dz = Math.sin(el), s = surfAt(dx, dy, dz), out = [dx * 0.45, dy * 0.45, 0.9], ol = Math.hypot(out[0], out[1], out[2]);
      const lean = 0.18 * Math.sin(i * 2.3), dir = [out[0] / ol + lean * dy, out[1] / ol - lean * dx, out[2] / ol], dl = Math.hypot(dir[0], dir[1], dir[2]), a = [s[0] - dx * 0.07, s[1] - dy * 0.07, s[2] - dz * 0.07], b = [a[0] + dir[0] / dl * len, a[1] + dir[1] / dl * len, a[2] + dir[2] / dl * len];
      B.crystal(a, b, r, 134, { n: i % 2 ? 4 : 5, seed: i * 1.7 + 0.3, thin: 0.72, jit: 0.3, belly: 0.22, bend: 0.12 * Math.sin(i * 1.9), base: 0.85 });
      if (len > 0.45) { const m = 0.45, c2 = [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m, a[2] + (b[2] - a[2]) * m], sd = [dx * 0.7 + dir[0] * 0.5, dy * 0.7 + dir[1] * 0.5, dir[2] * 0.4 + 0.2]; B.crystal(c2, [c2[0] + sd[0] * len * 0.35, c2[1] + sd[1] * len * 0.35, c2[2] + sd[2] * len * 0.35], r * 0.5, 134, { n: 4, seed: i * 3.1, thin: 0.7, jit: 0.3, belly: 0.25 }); } });
  }
  function shardMesh(i) { const B = GLM.builder(1), L = 0.16 + 0.06 * (i % 3), r = 0.07 + 0.02 * ((i * 7) % 3); B.crystal([-L / 2, 0, 0], [L / 2, 0.02 * (i % 2 ? 1 : -1), 0], r, 131, { n: 3 + (i % 3), seed: i * 2.9 + 1, thin: 0.55 + 0.1 * (i % 2), jit: 0.45, belly: 0.4, base: 0.9 }); return B.done(); }

  /* ================= the build: a few milliseconds a frame ================= */
  let MESH = null, IT = null, BUILD_MS = 0, BUILD_T0 = 0;
  function* build() {
    const h = lowFx() ? 0.036 : 0.029, M = {};
    M.cran = yield* nets(sdCran, [-1.02, -1.3, -0.97, 1.02, 1.04, 1.32], h, clsCran);
    M.jaw = yield* nets(sdJaw, [-0.84, -0.3, -1.44, 0.84, 0.82, -0.44], h, () => 130);
    { const B = GLM.builder(1); teeth(B, ARCH_U, true, 133); M.uteeth = B.done(); } yield 0;
    { const B = GLM.builder(1); teeth(B, ARCH_L, false, 133.3); M.lteeth = B.done(); } yield 0;
    { const B = GLM.builder(1); crown(B); M.crown = B.done(); } yield 0;
    M.shards = [0, 1, 2, 3, 4, 5].map(shardMesh);
    // points on the bone, for the burst (a shard leaves from each)
    const pick = (m, n, jaw) => { const out = []; for (let i = 0; i < n; i++) { const v = Math.floor((i * 7919 + 13) % m.nv); out.push([m.pos[v * 3], m.pos[v * 3 + 1], m.pos[v * 3 + 2], m.nrm[v * 3], m.nrm[v * 3 + 1], m.nrm[v * 3 + 2], jaw]); } return out; };
    M.pts = pick(M.cran, 60, 0).concat(pick(M.jaw, 18, 1));
    return M;
  }
  /* step the build for up to ms milliseconds; true once the model is ready */
  function prepare(ms) {
    if (MESH) return true; if (typeof GLM === 'undefined') return false;
    if (!IT) { IT = build(); BUILD_T0 = nowMs(); BUILD_MS = 0; }
    const t0 = nowMs(); try { for (;;) { const r = IT.next(); if (r.done) { MESH = r.value; IT = null; break; } if (nowMs() - t0 > ms) break; } } catch (e) { IT = null; NOGL = true; if (typeof console !== 'undefined') console.warn('Dead Scream skull: build', e); return false; }
    BUILD_MS += nowMs() - t0; return !!MESH;
  }

  /* ================= the view and the draw ================= */
  const vnrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const EL = 0.27, CW = [0, Math.cos(EL), Math.sin(EL)], EXW = [1, 0, 0], EYW = [0, Math.sin(EL), -Math.cos(EL)];   // (orthographic, a little above the eye line)
  const LK = vnrm([-0.55, 0.62, 0.58]), LS = vnrm([-0.25, 0.35, 0.9]), LR = vnrm([0.62, -0.5, 0.6]), UP = [0, 0, 1], RIM = [0.78, 0.42, 1.4], AMB = [0.95, 0.92, 1.0];
  const HINGE = [0, -0.12, -0.59], JAW_OPEN = 0.52;   // (the mandible's axis, through the condyles; its widest opening in radians)
  // the pose's rotation (columns): roll about y (the head's tilt), then pitch about x (a nod), then yaw about z
  function rot(P) { const r = P.roll || 0, p = P.pitch || 0, w = P.yaw || 0, cr = Math.cos(r), sr = Math.sin(r), cp = Math.cos(p), sp = Math.sin(p), cw = Math.cos(w), sw = Math.sin(w);
    const Ry = [[cr, 0, -sr], [0, 1, 0], [sr, 0, cr]], Rx = [[1, 0, 0], [0, cp, sp], [0, -sp, cp]], Rz = [[cw, sw, 0], [-sw, cw, 0], [0, 0, 1]];
    return mul(Rz, mul(Rx, Ry)); }
  // (matrices as three columns)
  const mv = (M, v) => [M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2], M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2], M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2]];
  const mul = (A, B) => [mv(A, B[0]), mv(A, B[1]), mv(A, B[2])];
  function jawRot(open) { const a = -JAW_OPEN * cl(open), c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, s], [0, -s, c]]; }   // (about x: the chin swings down and back)
  /* the frame of everything for a pose: { Rs, Rj, Tj } (a jaw point p goes to Rj p + Tj) */
  function frame(P) { const Rs = rot(P), Jr = jawRot(P.jaw || 0), Rj = mul(Rs, Jr), hj = mv(Jr, HINGE), Tj = mv(Rs, [HINGE[0] - hj[0], HINGE[1] - hj[1], HINGE[2] - hj[2]]); return { Rs, Rj, Tj }; }
  /* where a point of the skull (jaw: a point of the mandible) is on the screen, drawn at (x, y) with k px a unit */
  function toScreen(p, jaw, x, y, k, P, Fr) { Fr = Fr || frame(P); const w = jaw ? mv(Fr.Rj, p) : mv(Fr.Rs, p); if (jaw) { w[0] += Fr.Tj[0]; w[1] += Fr.Tj[1]; w[2] += Fr.Tj[2]; } return [x + (w[0] * EXW[0] + w[1] * EXW[1] + w[2] * EXW[2]) * k, y + (w[0] * EYW[0] + w[1] * EYW[1] + w[2] * EYW[2]) * k, w[0] * CW[0] + w[1] * CW[1] + w[2] * CW[2]]; }
  let NOGL = false, GLFAIL = 0, GLLAST = 0, GLRETRY = 0, GLMS = 0, GLN = 0;
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  /* can the GPU draw it now (not whether the mesh is built: see prepare) */
  function ok() { const f = flag('__DS_GL'); if (f === 0 || NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && f !== 1) return false; return true; }
  const BOXC = [[-1.02, -1.32, -0.95, 1.02, 1.04, 1.86], [-0.84, -0.3, -1.42, 0.84, 0.84, -0.46]];
  const GI = [], GJ = [];
  const item = (n, mesh, R, T, P, s) => { const g = GI[n] || (GI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); s = s || 1; g.mesh = mesh;
    for (let i = 0; i < 3; i++) { g.R0[i] = R[0][i] * s; g.R1[i] = R[1][i] * s; g.R2[i] = R[2][i] * s; g.T[i] = T ? T[i] : 0; } g.alpha = P.alpha == null ? 1 : P.alpha; g.glow = P.glow || 0; g.glow2 = P.crack || 0; g.spill = P.spill || 0; g.wear = P.fire == null ? 1 : P.fire; g.kind = P.kind || 0; g.fx = 0; return g; };
  function pass(c, x, y, k, items, bb, t) {
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__DS_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (+flag('__DS_GLQ') || 1);   // (__DS_GLQ: a test's render scale)
    const bx0 = bb[0], by0 = bb[1], bw = bb[2] - bb[0], bh = bb[3] - bb[1]; if (!(bw > 1 && bh > 1)) return true;
    let W = Math.ceil(bw * dev), H = Math.ceil(bh * dev); const sc = Math.min(1, 1100 / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
    const S = { px: EXW, py: EYW, pd: CW, cl: [2 * k / bw, 2 * (x - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (y - by0) / bh], v: CW, lk: LK, ls: LS, lr: LR, up: UP, low: lowFx(), rim: RIM, amb: AMB, t: t == null ? nowMs() / 1000 % 1000 : t };
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; return true;
  }
  /* draw the skull at (x, y) (its brow line), k px a unit, in pose P: { yaw, pitch, roll, jaw 0..1, glow, crack, spill,
     fire, alpha, t }. False when the GPU cannot (the caller draws its 2D picture) */
  function draw(c, x, y, k, P) {
    if (!ok() || !MESH) return false;
    try {
      const Fr = frame(P), items = GJ; items.length = 0; let n = 0;
      items.push(item(n++, MESH.cran, Fr.Rs, null, P), item(n++, MESH.uteeth, Fr.Rs, null, P), item(n++, MESH.jaw, Fr.Rj, Fr.Tj, P), item(n++, MESH.lteeth, Fr.Rj, Fr.Tj, P));
      if (P.crown !== false) items.push(item(n++, MESH.crown, Fr.Rs, null, P));
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      BOXC.forEach((b, j) => { for (let q = 0; q < 8; q++) { const s = toScreen([q & 1 ? b[3] : b[0], q & 2 ? b[4] : b[1], q & 4 ? b[5] : b[2]], j === 1, x, y, k, P, Fr); x0 = Math.min(x0, s[0]); x1 = Math.max(x1, s[0]); y0 = Math.min(y0, s[1]); y1 = Math.max(y1, s[1]); } });
      const pad = k * 0.04; return pass(c, x, y, k, items, [x0 - pad, y0 - pad, x1 + pad, y1 + pad], P.t);
    } catch (e) { glFail(); if (typeof console !== 'undefined') console.warn('Dead Scream skull: GL draw', e); return false; }
  }
  /* the burst's shards: list of { m (0..5), R (3 columns), p ([x, y, z] in skull units about the skull's centre), s
     (size), spill, glow }; drawn at (x, y), k px a unit, in one image */
  function drawShards(c, x, y, k, list, t) {
    if (!ok() || !MESH || !list.length) return !!MESH && ok();
    try { const items = GJ; items.length = 0; let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const s of list) { if (s.spill >= 1) continue; const g = item(n++, MESH.shards[s.m % MESH.shards.length], s.R, s.p, { glow: s.glow, crack: 0, spill: s.spill, fire: 0, kind: 1 }, s.s); items.push(g);
        const sx = x + (s.p[0] * EXW[0] + s.p[1] * EXW[1] + s.p[2] * EXW[2]) * k, sy = y + (s.p[0] * EYW[0] + s.p[1] * EYW[1] + s.p[2] * EYW[2]) * k, rr = 0.2 * s.s * k + 2; x0 = Math.min(x0, sx - rr); x1 = Math.max(x1, sx + rr); y0 = Math.min(y0, sy - rr); y1 = Math.max(y1, sy + rr); }
      if (!items.length) return true; return pass(c, x, y, k, items, [x0, y0, x1, y1], t);
    } catch (e) { glFail(); return false; }
  }
  const stats = () => ({ ready: !!MESH, buildMs: Math.round(BUILD_MS), wallMs: MESH ? 0 : Math.round(nowMs() - BUILD_T0), glMs: +GLMS.toFixed(2), draws: GLN, tris: MESH ? ['cran', 'jaw', 'uteeth', 'lteeth', 'crown'].reduce((a, q) => a + MESH[q].ntri, 0) : 0, verts: MESH ? MESH.cran.nv + MESH.jaw.nv : 0, nogl: NOGL });
  return { get MESH() { return MESH; }, prepare, ok, draw, drawShards, toScreen, frame, rot, stats, get pts() { return MESH ? MESH.pts : null; }, get ready() { return !!MESH; }, JAW_OPEN, sdCran, sdJaw };
})();
