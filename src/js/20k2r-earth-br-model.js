/* ---------- (v417 BR) Ball Crusher's boulder and Rapid Fire's shards: real 3D meshes on GLM ----------
   Built once at load (idle time, plain arrays), uploaded on the first cast (or when a floor starts with either move in the kit):
   - the boulder: an irregular stone sphere (an icosphere pushed out to a tumbled polyhedron of soft-bevelled facets, lumps,
     a slight squash), three broad cracks cut into it as real grooves (two of them seams lit by a warm amber light inside),
     clusters of champagne crystals, bronze nuggets and charcoal basalt chunks embedded in its surface; its layered
     orange-brown strata (sandstone beige, terracotta, dark orange, a charcoal parting here and there) are made per pixel in
     its own frame, so they turn with it as it rolls. Two levels of detail (2562 / 642 vertices of stone).
   - a shard: compacted basalt and sandstone, the convex hull of a jittered spindle of points (an uneven silhouette, chipped
     facets with bright fresh edges, a sharp tip, a broken back), a small amber mineral core breaking through one side.
     Three variants.
   Drawn by GLM (materials 170..174 in 20k5uz, "v417 BR"), every item of a call in one render at the screen's full
   resolution with the game's projection (screen y = y 0.55 - z 0.835, one world unit a tile), a thin ink outline,
   nothing below the floor; the image is laid on the game canvas once. Real-GPU WebGL only (a software rasteriser:
   window.__NG_GL = 1, as the tests set); window.__BR_GL = 0 turns it off. */
const EARTH_BR_GPU = (() => {
  const TAU = Math.PI * 2, SE = 0.55, CE = Math.sqrt(1 - SE * SE);
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  const nrm = a => { const k = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / k, a[1] / k, a[2] / k]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  // 3D value noise (load time only)
  const h3 = (x, y, z) => R1(x * 127.1 + y * 311.7 + z * 74.7);
  function vn3(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const L = (a, b, k) => a + (b - a) * k, c = (i, j, k) => h3(xi + i, yi + j, zi + k);
    return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w); }
  const MT = { STONE: 170, SEAM: 170.25, CRYS: 171, BRONZE: 171.2, BASALT: 172, SHARD: 173, CORE: 174 };   // (a material's fraction stays under 0.5: GLM rounds the id)

  /* ================= the boulder (model units: radius about 1, z up) ================= */
  const SEED = 7.3;
  // its facets: an even spread of planes (a Fibonacci sphere, jittered), each a little in from the sphere
  const PL = []; { const K = 20; for (let i = 0; i < K; i++) { const y = 1 - (i + 0.5) / K * 2, rr = Math.sqrt(1 - y * y), ph = i * 2.39996 + (R1(i + SEED) - 0.5) * 0.5; PL.push({ n: nrm([Math.cos(ph) * rr, Math.sin(ph) * rr, y + (R1(i * 3.1) - 0.5) * 0.25]), d: 0.9 + 0.075 * R1(i * 7.7 + SEED) }); } }
  // its cracks: [plane normal, the arc's middle, how far round it runs (cos), width, glowing]
  const CR = [[nrm([0.3, 0.9, 0.25]), null, -0.15, 0.055, 1], [nrm([0.85, -0.2, 0.45]), null, 0.15, 0.045, 0], [nrm([-0.35, 0.3, 0.88]), null, 0.35, 0.04, 1]];
  for (let j = 0; j < CR.length; j++) { const c = CR[j][0], t = nrm(cross(c, Math.abs(c[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), b = cross(c, t), an = j * 2.1 + 0.7; CR[j][1] = nrm([t[0] * Math.cos(an) + b[0] * Math.sin(an), t[1] * Math.cos(an) + b[1] * Math.sin(an), t[2] * Math.cos(an) + b[2] * Math.sin(an)]); }
  function shapeAt(p) {   // p a unit direction: [radius, crack 0..1, glowing seam 0/1]
    let s = 0; const KS = 28; for (const q of PL) { const c = dot(p, q.n); if (c > 0.12) s += Math.exp(-KS * q.d / c); } s += Math.exp(-KS * 1.04);
    let r = -Math.log(s) / KS;   // (a smooth minimum: soft bevels where facets meet, the corners rounded off by the sphere)
    r *= 1 + 0.06 * (vn3(p[0] * 2.1 + 3, p[1] * 2.1, p[2] * 2.1) - 0.5) + 0.025 * (vn3(p[0] * 5.3, p[1] * 5.3 + 7, p[2] * 5.3) - 0.5);
    let crk = 0, glow = 0;
    for (const [c, a, ext, w, gl] of CR) { const al = dot(p, a), m = sm(ext - 0.25, ext + 0.1, al); if (m <= 0) continue;
      const dd = dot(p, c) + 0.035 * Math.sin(p[0] * 11 + p[1] * 7 + ext * 5) + 0.014 * Math.sin(p[1] * 23 - p[2] * 19), ww = w * (0.45 + 0.55 * m), g = Math.exp(-(dd / ww) * (dd / ww)) * m;
      if (g > crk) { crk = g; glow = gl && g > 0.12 ? 1 : 0; } }
    r *= 1 - 0.085 * crk;
    return [r, crk, glow];
  }
  function icosphere(sub) {
    const t = (1 + Math.sqrt(5)) / 2; let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm);
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < sub; s++) { const mid = new Map(), F2 = []; const M = (a, b) => { const k = a < b ? a * 100000 + b : b * 100000 + a; let i = mid.get(k); if (i == null) { const A = V[a], B = V[b]; i = V.length; V.push(nrm([A[0] + B[0], A[1] + B[1], A[2] + B[2]])); mid.set(k, i); } return i; };
      for (const [a, b, c] of F) { const ab = M(a, b), bc = M(b, c), ca = M(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = F2; }
    return { V, F };
  }
  function buildBoulder(sub) {
    const { V, F } = icosphere(sub), n = V.length, P = [], R = new Float32Array(n), CK = new Float32Array(n), GL = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const p = V[i], [r, ck, g] = shapeAt(p); R[i] = r; CK[i] = ck; GL[i] = g; P.push([p[0] * r * 1.02, p[1] * r * 0.97, p[2] * r]); }   // (a slight squash: irregular)
    const N = V.map(() => [0, 0, 0]), nb = V.map(() => []);
    for (const [a, b, c] of F) { const e1 = [P[b][0] - P[a][0], P[b][1] - P[a][1], P[b][2] - P[a][2]], e2 = [P[c][0] - P[a][0], P[c][1] - P[a][1], P[c][2] - P[a][2]], fn = cross(e1, e2);
      for (const v of [a, b, c]) { N[v][0] += fn[0]; N[v][1] += fn[1]; N[v][2] += fn[2]; } nb[a].push(b, c); nb[b].push(a, c); nb[c].push(a, b); }
    const pos = [], nr = [], att = [], idx = [];
    for (let i = 0; i < n; i++) { const q = nrm(N[i]); let ra = 0; for (const j of nb[i]) ra += R[j]; ra /= nb[i].length || 1;
      const ao = Math.max(0.3, Math.min(1, 1 - 0.55 * CK[i] - 5 * Math.max(0, ra - R[i])));
      pos.push(P[i][0], P[i][1], P[i][2]); nr.push(q[0], q[1], q[2]); att.push(GL[i] ? MT.SEAM : MT.STONE, CK[i], ao); }
    for (const [a, b, c] of F) idx.push(a, b, c);
    // the embedded minerals, on a builder, merged in
    const B = GLM.builder(sub >= 4 ? 1 : 0.6); let k = 0;
    const site = (i, avoid) => { for (let tr = 0; tr < 30; tr++) { const z = R1(i * 13.1 + tr * 3.3 + SEED) * 2 - 1, ph = R1(i * 7.9 + tr * 1.7) * TAU, rr = Math.sqrt(1 - z * z), p = [Math.cos(ph) * rr, Math.sin(ph) * rr, z], s = shapeAt(p); if (s[1] < avoid) return [p, s[0]]; } return null; };
    for (let i = 0; i < 6; i++) { const S = site(i + 1, 0.05); if (!S) continue; const [p, r] = S, t = nrm(cross(p, Math.abs(p[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), b = cross(p, t), nc = 2 + (i % 2);
      for (let j = 0; j < nc; j++) { const an = j * 2.3 + i, off = j ? 0.07 : 0, q = [p[0] + (t[0] * Math.cos(an) + b[0] * Math.sin(an)) * off, p[1] + (t[1] * Math.cos(an) + b[1] * Math.sin(an)) * off, p[2] + (t[2] * Math.cos(an) + b[2] * Math.sin(an)) * off], L = 1.04 + 0.06 * R1(k * 5.1) - j * 0.02, ti = 0.05 * (j ? 1 : 0);
        B.crystal([q[0] * r * 0.8, q[1] * r * 0.8, q[2] * r * 0.8], [q[0] * r * L + t[0] * ti, q[1] * r * L + t[1] * ti, q[2] * r * L + t[2] * ti], (0.075 - j * 0.015) * (0.85 + 0.3 * R1(k * 2.7)), MT.CRYS, { n: 5 + (k % 2), seed: k * 1.7 + 0.3, jit: 0.25, belly: 0.5, base: 0.85 }); k++; } }
    for (let i = 0; i < 4; i++) { const S = site(i + 20, 0.05); if (!S) continue; const [p, r] = S; B.along([p[0] * r * 0.985, p[1] * r * 0.985, p[2] * r * 0.985], p); B.ell([0, 0, 0], [0.035, 0.07 + 0.02 * R1(i), 0.06], MT.BRONZE, { seg: 10, rings: 6 }); B.pop(); }
    for (let i = 0; i < 4; i++) { const S = site(i + 40, 0.15); if (!S) continue; const [p, r] = S; B.along([p[0] * r * 0.975, p[1] * r * 0.975, p[2] * r * 0.975], p); B.ell([0, 0, 0], [0.045, 0.17 + 0.05 * R1(i * 3), 0.12 + 0.04 * R1(i * 5)], MT.BASALT, { seg: 12, rings: 6 }); B.pop(); }
    const M2 = B.done(), base = pos.length / 3;
    for (let i = 0; i < M2.pos.length; i++) { pos.push(M2.pos[i]); nr.push(M2.nrm[i]); att.push(M2.att[i]); }
    for (let i = 0; i < M2.idx.length; i++) idx.push(M2.idx[i] + base);
    const nv = pos.length / 3;
    return { pos: new Float32Array(pos), nrm: new Float32Array(nr), att: new Float32Array(att), idx: nv > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), nv, ntri: idx.length / 3, gl: null };
  }

  /* ================= a shard (model units: x along it, -0.5 its broken back .. 0.55 its tip) ================= */
  function hull(pts) { const F = [], n = pts.length, E = 1e-7;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) { const A = pts[i], nn = cross([pts[j][0] - A[0], pts[j][1] - A[1], pts[j][2] - A[2]], [pts[k][0] - A[0], pts[k][1] - A[1], pts[k][2] - A[2]]); if (Math.hypot(nn[0], nn[1], nn[2]) < 1e-9) continue;
      let pos = 0, neg = 0; for (let m = 0; m < n; m++) { if (m === i || m === j || m === k) continue; const s = dot(nn, [pts[m][0] - A[0], pts[m][1] - A[1], pts[m][2] - A[2]]); if (s > E) pos++; else if (s < -E) neg++; if (pos && neg) break; }
      if (pos && neg) continue; F.push(neg ? [i, j, k] : [i, k, j]); }   // (all the others behind it: a face, wound outward)
    return F; }
  function buildShard(v) { const sd = v * 17.3 + 2.1, P = [], J = (k, a) => (R1(sd + k * 1.913) - 0.5) * 2 * a;
    P.push([0.55, J(1, 0.02), J(2, 0.015)], [0.47, 0.035 + J(3, 0.01), J(4, 0.02)], [0.46, -0.03 + J(5, 0.01), J(6, 0.02)]);   // (a sharp tip, a little chipped)
    for (let r = 0; r < 3; r++) { const x = [-0.3, -0.04, 0.2][r], rr = [0.22, 0.25, 0.16][r], nk = [6, 7, 5][r];
      for (let i = 0; i < nk; i++) { const a = i / nk * TAU + r * 0.6 + J(10 + r * 9 + i, 0.25), q = rr * (0.72 + 0.4 * R1(sd + r * 3.1 + i * 7.7)); P.push([x + J(40 + r * 9 + i, 0.06), Math.cos(a) * q, Math.sin(a) * q * 0.8]); } }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4 + J(60 + i, 0.3), q = 0.11 * (0.7 + 0.5 * R1(sd + i * 4.4)); P.push([-0.5 + J(70 + i, 0.05), Math.cos(a) * q, Math.sin(a) * q * 0.8]); }   // (a broken, slanted back)
    const B = GLM.builder(1), ins = [0.0, 0, 0];
    for (const [a, b, c] of hull(P)) { const tri = [P[a], P[b], P[c]], nn = cross([tri[1][0] - tri[0][0], tri[1][1] - tri[0][1], tri[1][2] - tri[0][2]], [tri[2][0] - tri[0][0], tri[2][1] - tri[0][1], tri[2][2] - tri[0][2]]), cc = [(tri[0][0] + tri[1][0] + tri[2][0]) / 3 - ins[0], (tri[0][1] + tri[1][1] + tri[2][1]) / 3, (tri[0][2] + tri[1][2] + tri[2][2]) / 3];
      B.facet(dot(nn, cc) < 0 ? tri.slice().reverse() : tri, MT.SHARD); }
    // the small amber core, breaking through one side
    const sgn = v % 2 ? 1 : -1; B.crystal([-0.08, 0, 0], [0.02, 0.1 * sgn, 0.2], 0.085, MT.CORE, { n: 5, seed: v + 0.5, jit: 0.2, belly: 0.5, base: 0.7 });
    B.crystal([0.0, 0, 0], [-0.05, -0.2 * sgn, -0.05], 0.07, MT.CORE, { n: 5, seed: v + 1.5, jit: 0.2, belly: 0.5, base: 0.7 });
    return B.done(); }

  let BOULDER = null, BOULDER_LO = null, SHARDS = null, BUILT = false, UP = false;
  const STATS = { ms: 0, n: 0, W: 0, H: 0, items: 0, buildMs: 0, nv: null };
  function ensure() { if (BUILT) return true; if (typeof GLM === 'undefined') return false; const t0 = nowMs(); BOULDER = buildBoulder(4); BOULDER_LO = buildBoulder(3); SHARDS = [0, 1, 2].map(buildShard); BUILT = true; STATS.buildMs = nowMs() - t0; STATS.nv = [BOULDER.nv, BOULDER_LO.nv, SHARDS[0].nv]; return true; }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Earth BR GL: ' + String(e && e.message || e)); } catch (e2) {} };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__BR_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__BR_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  function upload() { if (UP || !ensure() || !GLM.ok()) return; const it = mesh => ({ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 1 });
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, [BOULDER, BOULDER_LO].concat(SHARDS).map(it)); UP = true; }
  function warm() { try { if (!ensure()) return false; if (usable()) upload(); return true; } catch (e) { fail(e); return false; } }
  try { const go = () => { try { ensure(); } catch (e) { /* (built on first use instead) */ } }; if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 5000 }); else if (typeof setTimeout === 'function') setTimeout(go, 1500); } catch (e) { /* */ }

  /* ================= orientation helpers (3x3, column-major: the model's axes in the world) ================= */
  // turn M by angle about the unit axis (ax, ay, az), in the world
  function rotate(M, ax, ay, az, an) { const c = Math.cos(an), s = Math.sin(an), t = 1 - c;
    const r = [t * ax * ax + c, t * ax * ay + s * az, t * ax * az - s * ay, t * ax * ay - s * az, t * ay * ay + c, t * ay * az + s * ax, t * ax * az + s * ay, t * ay * az - s * ax, t * az * az + c];   // (column-major)
    const o = M.slice(); for (let col = 0; col < 3; col++) for (let row = 0; row < 3; row++) M[col * 3 + row] = r[row] * o[col * 3] + r[3 + row] * o[col * 3 + 1] + r[6 + row] * o[col * 3 + 2];
    // (kept orthonormal)
    const X = nrm([M[0], M[1], M[2]]), Z0 = [M[6], M[7], M[8]], Y = nrm(cross(Z0, X)), Z = cross(X, Y); M[0] = X[0]; M[1] = X[1]; M[2] = X[2]; M[3] = Y[0]; M[4] = Y[1]; M[5] = Y[2]; M[6] = Z[0]; M[7] = Z[1]; M[8] = Z[2]; return M; }
  // a frame with x along (dx, dy, dz), turned by roll about it
  function aim(dx, dy, dz, roll, out) { const x = nrm([dx, dy, dz]), up = Math.abs(x[2]) < 0.95 ? [0, 0, 1] : [1, 0, 0], y0 = nrm(cross(up, x)), z0 = cross(x, y0), c = Math.cos(roll), s = Math.sin(roll);
    const y = [y0[0] * c + z0[0] * s, y0[1] * c + z0[1] * s, y0[2] * c + z0[2] * s], z = cross(x, y); const M = out || new Array(9); M[0] = x[0]; M[1] = x[1]; M[2] = x[2]; M[3] = y[0]; M[4] = y[1]; M[5] = y[2]; M[6] = z[0]; M[7] = z[1]; M[8] = z[2]; return M; }

  /* ================= drawing ================= */
  const LK = nrm([-0.55, 0.42, 0.75]), SBW = nrm([-0.5, -0.72, 0.55]), LR = nrm([0.62, -0.62, 0.48]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const OUTC = [0.045, 0.025, 0.018], GLCAP = 1600, POOL = [], ITEMS = [];
  let SCR = null;
  /* draw items: list [{ mesh: 'boulder' | 'chunk' (a small lump of it) | 'shard', v (a shard's variant), X, Y (its floor point on the screen), z (its centre's
     height, world units), M (orientation, column-major 3x3), s (world units a model unit), glow (the amber light 0..1.5),
     alpha, kind (1: a shard in the boulder's own stone, for its crumbling chunks) }], o { k (px a world unit), pet [x, y, r] (a
     soft hole where the pet stands behind them), alpha }. Returns false when it cannot draw (the caller draws its 2D picture) */
  function draw(c, list, o) {
    if (!usable() || !ensure()) return false;
    try {
      if (!UP) upload();
      const m = c.getTransform(), vx0 = -m.e / (m.a || 1), vy0 = -m.f / (m.d || 1), vx1 = vx0 + c.canvas.width / (m.a || 1), vy1 = vy0 + c.canvas.height / (m.d || 1), k = o.k || 32, low = lowFx();
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9, X0 = 0, Y0 = 0, nn = 0; ITEMS.length = 0;
      for (const q of list) if (q.alpha == null || q.alpha > 0.004) { X0 += q.X; Y0 += q.Y; nn++; } if (!nn) return true; X0 /= nn; Y0 /= nn;
      for (let i = 0; i < list.length; i++) { const q = list[i]; if (q.alpha != null && q.alpha <= 0.004) continue;
        const rad = (q.mesh === 'shard' ? 0.6 : 1.16) * q.s * k, cy = q.Y - q.z * CE * k; bx0 = Math.min(bx0, q.X - rad); bx1 = Math.max(bx1, q.X + rad); by0 = Math.min(by0, cy - rad); by1 = Math.max(by1, cy + rad);
        const g = POOL[ITEMS.length] || (POOL[ITEMS.length] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }), M = q.M || I3, s = q.s;
        g.mesh = q.mesh === 'boulder' ? (low || rad * (m.a || 1) < 70 ? BOULDER_LO : BOULDER) : q.mesh === 'chunk' ? BOULDER_LO : SHARDS[(q.v | 0) % 3];
        for (let j = 0; j < 3; j++) { g.R0[j] = M[j] * s; g.R1[j] = M[3 + j] * s; g.R2[j] = M[6 + j] * s; }
        g.T[0] = (q.X - X0) / k; g.T[1] = (q.Y - Y0) / (SE * k); g.T[2] = q.z; g.alpha = q.alpha == null ? 1 : Math.min(1, q.alpha); g.glow = q.glow || 0; g.glow2 = 0; g.spill = 0; g.kind = q.kind || 0; g.wear = s; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = g.alpha > 0.6; ITEMS.push(g); }
      if (!ITEMS.length) return true;
      bx0 = Math.max(Math.floor(bx0) - 3, Math.floor(vx0)); by0 = Math.max(Math.floor(by0) - 3, Math.floor(vy0)); bx1 = Math.min(Math.ceil(bx1) + 3, Math.ceil(vx1)); by1 = Math.min(Math.ceil(by1) + 3, Math.ceil(vy1));
      if (!(bx1 > bx0 + 1 && by1 > by0 + 1)) return true;
      // (opaque ones first, front to back; the fading ones after, back to front)
      ITEMS.sort((p, q) => { const op = p.alpha > 0.995, oq = q.alpha > 0.995; return op !== oq ? (op ? -1 : 1) : op ? q.T[1] - p.T[1] : p.T[1] - q.T[1]; });
      const soft = GLM.soft && !flag('__BR_GLHQ'), dev = Math.max(0.25, Math.hypot(m.a, m.b)) * (soft ? 0.5 : 1);
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
      const bw = bx1 - bx0, bh = by1 - by0;
      const S = { px: PXW, py: PYW, pd: PDW, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: PDW, lk: LK, ls: SBW, lr: LR, up: UPW, low, t: nowMs() / 1000 % 1000,
        outline: Math.max(0.7, 0.6 * (W / bw)), outlineCol: OUTC, outlineBias: 0.004, clip: [0, 0.00005] };
      const t0 = nowMs(), cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return false;
      const al = o.alpha == null ? 1 : o.alpha, pet = o.pet;
      if (al > 0.004) {
        if (pet && pet[2] > 0 && pet[0] > bx0 - pet[2] && pet[0] < bx1 + pet[2] && pet[1] > by0 - pet[2] && pet[1] < by1 + pet[2] && typeof document !== 'undefined') {
          if (!SCR) SCR = document.createElement('canvas'); if (SCR.width !== W || SCR.height !== H) { SCR.width = W; SCR.height = H; } const g2 = SCR.getContext('2d');
          g2.globalCompositeOperation = 'copy'; g2.globalAlpha = 1; g2.drawImage(cvs, 0, 0, W, H, 0, 0, W, H); g2.globalCompositeOperation = 'destination-out';
          const px = (pet[0] - bx0) * W / bw, py = (pet[1] - by0) * H / bh, pr = pet[2] * W / bw, gr = g2.createRadialGradient(px, py, 0, px, py, pr); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g2.fillStyle = gr; g2.fillRect(px - pr, py - pr, pr * 2, pr * 2); g2.globalCompositeOperation = 'source-over';
          c.save(); c.globalAlpha = Math.min(1, al); c.drawImage(SCR, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
        else { c.save(); c.globalAlpha = Math.min(1, al); c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); } }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.W = W; STATS.H = H; STATS.items = ITEMS.length;
      return true;
    } catch (e) { fail(e); return false; }
  }
  return { usable, warm, ensure, draw, rotate, aim, STATS, SE, CE, I3, get meshes() { return { BOULDER, BOULDER_LO, SHARDS }; }, get off() { return NOGL; } };
})();
if (typeof self !== 'undefined') self.EARTH_BR_GPU = EARTH_BR_GPU;
