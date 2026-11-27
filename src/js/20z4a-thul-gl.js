/* ---------- (v470 AB) AUR3: what the Pale Aurora's three bosses share on the GPU ----------
   On GB_KIT (20x2: vectors, rotations, deforming meshes, many copies of one mesh). The Aurora's bosses are drawn by their fights in the
   2D bosses' own camera (a tile T px across; a point's height lifts it straight up the screen, as far as a step south moves it down:
   screen y = y - z), so the models are posed in the fight's own world (x east, y south, z up) and projected the same way: every model
   stands exactly where the 2D drawing stood, its hit areas and its fight unchanged. Its own lights, by name (cave: the Sheltered Ice
   Cave, cold white from the mouth, the aurora's green rim from behind; obs: the Telescope Platform under the open eye; summit: the
   Broad Summit's night), carried to the materials (GLM 730..749, the AB-AUR-MAT block in 20k5uz) as uAmb (the key's colour) and uRim.
   A model's GL state: meshes built once on first use (the loading screen's jobs, else the first draw), failures counted (three in
   20 s and the 2D art is drawn for the session; window.__AUR_GL = 1 forces the GPU on a software rasteriser for tests, 0 keeps it
   off). Warnings are marked for light (the engine paints nothing of them; their picture is light on the ice, drawn by the boss's own
   overlay through the shared FGFX painter, kinds 540..559 (AB-FX in 20k6h); an order number on a mark is kept as data, s.ord, told
   by beads of light, never painted as a number). Letting go: when a new stage is made (BEL.onRelease) the kept pictures are dropped
   and every mesh's GPU buffers freed (their arrays stay: they upload again when next drawn); the shared GLM canvas shrunk. */
const AUR3 = (() => {
  const K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv, mm } = K, nowMs = K.nowMs, lowFx = K.lowFx;
  const win = k => { try { return typeof window !== 'undefined' ? window[k] : undefined; } catch (e) { return undefined; } };
  const MODELS = [];
  function model(name, build) {
    const G = { name, MESH: null, PB: {}, NOGL: false, fails: 0, last: 0, retry: 0, ms: 0, n: 0, box: null, meshMs: 0, calls: 0, tris: 0,
      fail() { const t = nowMs(); if (t - G.last > 20000) G.fails = 0; G.last = t; G.fails++; if (G.fails >= 3) G.NOGL = true; else G.retry = t + 1500; },
      on() { if (G.NOGL || (G.retry && nowMs() < G.retry) || typeof GLM === 'undefined' || win('__AUR_GL') === 0 || !GLM.ok()) return false; if (GLM.soft && !win('__AUR_GL')) return false;
        if (!G.MESH) { try { const t0 = nowMs(); G.MESH = build(); G.meshMs = nowMs() - t0; } catch (e) { G.NOGL = true; if (typeof console !== 'undefined') console.warn(name + ': meshes', e); return false; } } return true; },
      bounds(part) { const M = G.MESH && G.MESH[part]; if (M && M.bb) return M.bb; let b = G.PB[part]; if (b) return b; if (!M) return [[0, 0, 0], 1.6]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
        for (let i = 0; i < p.length; i += 3) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; if (p[i + 2] < z0) z0 = p[i + 2]; if (p[i + 2] > z1) z1 = p[i + 2]; }
        return (G.PB[part] = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0)) / 2]); },
      get tris() { return G.MESH ? Object.values(G.MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0; } };
    MODELS.push(G); return G; }
  /* the 2D bosses' camera: screen x = x, screen y = y - z (a tile T px); the view from the south, 45 degrees up */
  const PX = [1, 0, 0], PY = [0, 1, -1], PD = vnrm([0, 1, 1]), UPW = [0, 0, 1];
  /* the lights (world: x east, y south, z up) */
  const LIGHT = { cave: { lk: vnrm([-0.38, 0.42, 0.82]), ls: vnrm([0.25, 0.2, 0.95]), lr: vnrm([0.35, -0.85, 0.4]), key: [1.95, 2.02, 2.15], rim: [0.45, 1.35, 1.0] },
    obs: { lk: vnrm([-0.35, 0.5, 0.8]), ls: vnrm([0.3, 0.25, 0.92]), lr: vnrm([0.2, -0.9, 0.38]), key: [1.85, 1.95, 2.15], rim: [0.5, 1.45, 1.05] },
    summit: { lk: vnrm([-0.42, 0.3, 0.86]), ls: vnrm([0.3, 0.3, 0.9]), lr: vnrm([0.25, -0.85, 0.45]), key: [1.9, 1.98, 2.12], rim: [0.42, 1.3, 0.98] } };
  const GLCAP = 1600, OUTC = [0.025, 0.045, 0.09], GLI = [], GLJ = [];
  let lastStats = null;
  /* one GPU pass: parts ({ part, R, o, s, sc, al, glow, glow2, spill, kind, fx, wear, outline }; o and the dynamic meshes' points
     relative to the origin (ox, oy) whose screen point is (X0, Y0)) into the box round them; o: { t, light, flash, outline, res, into, zs (the model drawn 1/zs its size and the view zs times nearer: a deeper depth range for a long model) } */
  function pass(c, X0, Y0, k, list, o, G) {
    const LT = LIGHT[o.light] || LIGHT.cave; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const M = G.MESH[it.part]; if (!M) continue; const [bc, brr] = G.bounds(it.part), sc = it.sc || [1, 1, 1], s = it.s || 1, rr = brr * s * Math.max(sc[0], sc[1], sc[2]) * 1.05 * k,
        w = vadd(it.o, mv(it.R, [bc[0] * sc[0] * s, bc[1] * sc[1] * s, bc[2] * sc[2] * s])), sx = X0 + w[0] * k, sy = Y0 + (w[1] - w[2]) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false; bx0 -= 3; by0 -= 3; bx1 += 3; by1 += 3;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__AUR_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || (lowFx() ? 0.8 : 1));   // (lowFx: a smaller picture, laid down the same size)
    // (only the part of the box on the canvas is drawn: a whale reaching off the screen costs the visible part only)
    if (m && !o.into) { const inv = 1 / Math.max(1e-6, Math.hypot(m.a, m.b)), vx0 = -m.e * inv - 8, vy0 = -m.f * inv - 8, vx1 = vx0 + c.canvas.width * inv + 16, vy1 = vy0 + c.canvas.height * inv + 16; bx0 = Math.max(bx0, vx0); by0 = Math.max(by0, vy0); bx1 = Math.min(bx1, vx1); by1 = Math.min(by1, vy1); if (!(bx1 > bx0) || !(by1 > by0)) return true; }
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const zs = o.zs || 1, S = { px: PX, py: PY, pd: PD, cl: [2 * k * zs / bw, 2 * (X0 - bx0) / bw - 1, -2 * k * zs / bh, 1 - 2 * (Y0 - by0) / bh], v: PD, lk: LT.lk, ls: LT.ls, lr: LT.lr, up: UPW, low: lowFx(), rim: LT.rim, amb: LT.key, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.1 * (W / bw)), outlineCol: OUTC, keep: 1 };
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = G.MESH[it.part]; if (!mesh) continue; const al = it.al == null ? 1 : it.al; if (!(al > 0.004)) continue; const R = it.R, s2 = it.s || 1, sc = it.sc || [1, 1, 1];
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; const iz = 1 / zs; for (let i = 0; i < 3; i++) { g.R0[i] = R.x[i] * s2 * sc[0] * iz; g.R1[i] = R.y[i] * s2 * sc[1] * iz; g.R2[i] = R.z[i] * s2 * sc[2] * iz; g.T[i] = it.o[i] * iz; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.5 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.first = 0; g.cnt = 0; g.d = vdot(it.o, PD) + (it.dz || 0); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    if (o.into) o.into(cvs, W, H, bx0, by0, bw, bh); else { c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); if (o.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= Math.min(1, o.flash) * 0.3; c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); } }
    G.ms = G.ms * 0.9 + (nowMs() - t0) * 0.1; G.n++; G.box = [W, H]; try { const st = GLM.stats; G.calls = st.calls; G.drawTris = st.tris; lastStats = { name: G.name, W, H, calls: st.calls, tris: st.tris }; } catch (e) { /* (no stats) */ } return true; }
  function passOf(c, X0, Y0, k, list, o, G) { try { return pass(c, X0, Y0, k, list, o, G); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn(G.name + ': draw', e); return false; } }
  /* still things kept as pictures at a zoom (key: what is drawn), laid down after; dropped on release */
  const PICS = new Map();
  function pic(c, G, key, T, make, light) { const m0 = c.getTransform ? c.getTransform() : null, dev = m0 ? Math.max(0.25, Math.hypot(m0.a, m0.b)) : 1, qz = Math.round(Math.log(Math.max(1, T * dev)) * 10), Tq = Math.exp(qz / 10) / dev, k2 = G.name + '|' + key + '|' + qz;
    const P = PICS.get(k2); if (P) return { P, f: T / Tq }; if (!G.on()) return null; let out = null;
    try { pass(c, 0, 0, Tq, make(), { t: 0, light, into: (cvs, W, H, bx0, by0, bw, bh) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(cvs, 0, 0, W, H, 0, 0, W, H); out = { cv, bx0, by0, bw, bh }; } }, G); } catch (e) { G.fail(); }
    if (!out) return null; if (PICS.size > 24) dropPics(); PICS.set(k2, out); return { P: out, f: T / Tq }; }
  function dropPics() { for (const P of PICS.values()) if (P && P.cv) P.cv.width = P.cv.height = 1; PICS.clear(); }
  function blitPic(c, p, X, Y, a) { const P = p.P, f = p.f; if (a != null && a < 1) { c.save(); c.globalAlpha *= a; } c.drawImage(P.cv, 0, 0, P.cv.width, P.cv.height, X + P.bx0 * f, Y + P.by0 * f, P.bw * f, P.bh * f); if (a != null && a < 1) c.restore(); }
  /* the shared GPU painter (window.__AUR_FX = 0 keeps the 2D effects: tests) */
  const fg = () => { try { if (win('__AUR_FX') === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  /* ---- meshes ---- */
  // a grid of nu x nv cells for a deforming mesh: its attributes (e(u, v), a(u, v)) set once, its points rewritten every frame
  function grid(nu, nv, m, e, a) { const B = GLM.builder(1); B.surf((u, v) => [u, v, 0], nu, nv, () => m, { e, a }); const M = B.done(); M.nu = nu; M.nv = nv; M.bb = [[0, 0, 0], 1]; return M; }
  // rewrite a grid's points from pos(i, j) (i 0..nu, j 0..nv), its normals from the grid (flip: the other way), its bounds
  const GP = [];
  function regrid(M, pos, flip) { if (!M) return; const nu = M.nu, nv = M.nv, P = M.pos, N = M.nrm, n1 = nu + 1; let o = 0, x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = pos(i, j); P[o] = q[0]; P[o + 1] = q[1]; P[o + 2] = q[2]; o += 3; if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; if (q[2] < z0) z0 = q[2]; if (q[2] > z1) z1 = q[2]; }
    const at = (i, j) => (Math.max(0, Math.min(nv, j)) * n1 + Math.max(0, Math.min(nu, i))) * 3;
    o = 0; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const a = at(i + 1, j), b = at(i - 1, j), c2 = at(i, j + 1), d = at(i, j - 1), ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[c2] - P[d], vy = P[c2 + 1] - P[d + 1], vz = P[c2 + 2] - P[d + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (flip) { nx = -nx; ny = -ny; nz = -nz; } const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; N[o] = nx / l; N[o + 1] = ny / l; N[o + 2] = nz / l; o += 3; }
    M.bb = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0)) / 2 + 0.05];
    if (typeof GLM !== 'undefined' && GLM.touchGeo) GLM.touchGeo(M); }
  // a smooth path through control points (Catmull-Rom), n + 1 samples spaced by the points' index; its frames (parallel transport)
  function spline(P, n) { const out = [], m = P.length - 1;
    for (let i = 0; i <= n; i++) { const f = i / n * m, k = Math.min(m - 1, Math.floor(f)), t = f - k, p0 = P[Math.max(0, k - 1)], p1 = P[k], p2 = P[k + 1], p3 = P[Math.min(m, k + 2)], t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map(a => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3))); }
    return out; }
  function frames(Pt, up0) { const n = Pt.length, F = []; let nPrev = null;
    for (let i = 0; i < n; i++) { const a = Pt[Math.max(0, i - 1)], b = Pt[Math.min(n - 1, i + 1)]; let t = vnrm(vsub(b, a)); if (vlen(t) < 1e-6) t = [1, 0, 0];
      let nn; if (!nPrev) { const u = up0 || [0, 0, 1]; nn = vsub(u, vmul(t, vdot(u, t))); if (vlen(nn) < 1e-4) nn = vsub([0, 1, 0], vmul(t, t[1])); nn = vnrm(nn); }
      else { nn = vsub(nPrev, vmul(t, vdot(nPrev, t))); if (vlen(nn) < 1e-5) nn = nPrev; nn = vnrm(nn); }
      F.push({ t, n: nn, b: vcross(t, nn) }); nPrev = nn; } return F; }
  // a swept tube along a path (Pt: points, its frames) with radius rad(u) (u 0..1 along): written into a grid of nu x nv
  function tube(M, Pt, Fr, rad, ox, oy) { const nu = M.nu, nv = M.nv; regrid(M, (i, j) => { const p = Pt[i], f = Fr[i], th = j / nv * TAU, r = rad(i / nu), c = Math.cos(th) * r, s = Math.sin(th) * r;
      return [p[0] - ox + f.n[0] * c + f.b[0] * s, p[1] - oy + f.n[1] * c + f.b[1] * s, p[2] + f.n[2] * c + f.b[2] * s]; }, false); }
  /* a rotation with x along d and z as near the hint as it can be */
  const along = (d, up) => K.frameXZ(d, up || [0, 0, 1]);
  /* a unit tube (x 0..1, radius 1) laid from a to b with radius r: its item fields */
  function seg(a, b, r, ox, oy) { const d = vsub(b, a), L = vlen(d) || 1e-4; return { R: along(d, Math.abs(d[2]) / L > 0.9 ? [1, 0, 0] : [0, 0, 1]), o: [a[0] - ox, a[1] - oy, a[2]], sc: [L, r, r] }; }
  /* a body frame from RiftFiend.frame's W (u forward, v left, h up; its scale S): the rotation and the scale */
  function frameOf(W, S) { const o = W(0, 0, 0), x = vmul(vsub(W(1, 0, 0), o), 1 / S), y = vmul(vsub(W(0, 1, 0), o), 1 / S), z = vmul(vsub(W(0, 0, 1), o), 1 / S); return M3(x, y, z); }
  /* ---- warnings marked for light ---- */
  function mark(FX, o, tele0) { if (!fg() || o.shape === 'fn') return tele0(o); const geo = o.shape; let s = null; if (o.label != null) { o.ord = o.label; delete o.label; }
    const tk = o.tick; if (tk) o.tick = (dt, q) => { tk(dt, q); if (q.label != null) { q.ord = q.label; q.label = null; } };
    s = tele0(Object.assign(o, { geo, shape: 'fn', aur: 1, seed: Math.random() * 40, test: (x, y, rr) => { s.shape = s.geo; const r = FX.inShape(s, x, y, rr); s.shape = 'fn'; return r; } })); return s; }
  function wrapFX(FX) { if (FX.__aur3) return; FX.__aur3 = 1; const t0 = FX.tele; FX.tele = q => mark(FX, q, t0); }
  /* a marked warning drawn as the engine drew it (the painter lost mid-fight) */
  function tele2D(c, FX, s, T, t) { if (typeof SEP3 !== 'undefined' && SEP3.tele2D) SEP3.tele2D(c, FX, s, T, t); }
  /* a warning's light on the ice: 540 a disc (a frost bloom closing in), 541 a lane, 542 a fan, 543 a ring with gaps; u 0..1 the
     tell, 1..2 the strike fading */
  function tell(Q, FX, s, T, t, o) { o = o || {}; const u = cl(s.age / s.t) * 0.999 + (s.done ? 1 : 0), sd = s.seed || 1, X = FX.sx(s.x), Y = FX.sy(s.y), col = s.col || '#CFE8F4';
    if (s.geo === 'line') { const ca = Math.cos(s.a), sa = Math.sin(s.a), hl = s.len / 2 * T, hw = s.w / 2 * T * 1.2; Q.quad(541, FX.sx(s.x + ca * s.len / 2), FX.sy(s.y + sa * s.len / 2), ca * hl, sa * hl, -sa * hw, ca * hw, col, 1, u, (s.ord || 0) * 100 + (sd % 40), s.len / s.w); }
    else if (s.geo === 'cone') { const R = s.len * T * 1.04, ca = Math.cos(s.a), sa = Math.sin(s.a); Q.quad(542, X, Y, ca * R, sa * R, -sa * R, ca * R, col, 1, u, sd, s.spread); }
    else if (s.geo === 'circle') { const R = s.r * T * 1.12; Q.quad(540, X, Y, R, 0, 0, R, col, 1, u, sd, o.mode || 0); }
    else if (s.geo === 'ring') { const R = s.r1 * T * 1.03, g = s.gaps || [], g0 = g[0] || [9, 0], g1 = g[1] || [9, 0]; Q.quad(543, X, Y, R, 0, 0, R, col, 1, u + Math.floor(Math.min(0.99, s.r0 / s.r1) * 100) * 10, na(g0[0]) + Math.round(Math.min(0.99, g0[1]) * 100) * 10, na(g1[0]) + Math.round(Math.min(0.99, g1[1]) * 100) * 10); } }
  const na = a => ((a % TAU) + TAU) % TAU;
  /* letting go */
  const REL = [];
  function release() { dropPics(); for (const G of MODELS) if (G.MESH && typeof GLM !== 'undefined' && GLM.free) for (const k in G.MESH) if (G.MESH[k]) GLM.free(G.MESH[k]); for (const f of REL) try { f(); } catch (e) { /* (nothing to drop) */ }
    try { const cv = typeof GLM !== 'undefined' && GLM.canvas; if (cv && cv.width * cv.height > 4096) { cv.width = 64; cv.height = 64; } } catch (e) { /* (no canvas yet) */ } }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no rift hook) */ }
  function stats() { let buf = 0; for (const G of MODELS) if (G.MESH) for (const k in G.MESH) if (G.MESH[k] && G.MESH[k].gl) buf++; return { models: MODELS.map(G => ({ name: G.name, built: !!G.MESH, tris: G.tris, calls: G.calls, drawTris: G.drawTris, ms: +G.ms.toFixed(2), n: G.n, box: G.box, meshMs: Math.round(G.meshMs), nogl: G.NOGL })), buffers: buf, pics: PICS.size, last: lastStats }; }
  return { K, LIGHT, model, pass, passOf, pic, blitPic, dropPics, fg, grid, regrid, spline, frames, tube, along, seg, frameOf, mark, wrapFX, tele2D, tell, release, stats, onRelease: f => REL.push(f), PD };
})();

/* ---------- (v470 AB) THUL THE RIME COCOON in three dimensions (Rift 05, the Pale Aurora's first boss: the Sheltered Ice Cave) ----------
   The 2D Thul of 20z4-rift-fiend-aurora-1.js rebuilt as a GPU model at Rift 03/04's bosses' fidelity, from the 2D drawing: the same
   creature, its silhouette, colours and marks, posed every frame on the fight's own skeleton (the 2D file's RIG: cocoonGeo, legPts,
   waspPose), so it stands exactly where its hit areas are. Materials GLM 730..739 (AB-AUR-MAT, 20k5uz); the light of its moves on the
   FGFX painter (kinds 540..549, AB-FX in 20k6h). Without WebGL (or on a software rasteriser, unless window.__AUR_GL) or without the
   painter, the 2D Thul, its 2D effects and the 2D overlay are drawn as before.
   PHASE A, the Cocoon: a four-metre oval of chalk-white frosted shell, faint silk wraps round it and five raised seams of navy lacquer
   running pole to pole, turning with its slow twist; a crown of frost where the stalk holds it; cracks running over it before the
   hatch, green light pouring out of them. In its lowest opening one green eye (an iris of layered green, a slit pupil, wet) darts
   about between two navy lids that blink. It hangs by a gnarled stalk from the knot of three black root legs, each one swept
   tube of fibrous bark (frost lodged in its grooves) bowed like a root, swollen at the ankle and knee, a cap of snow on each knee,
   roots splayed on the ice at each foot; they step one at a time. Its frost collar: a band of ice round its base, fifteen crystal
   spikes growing out of it.
   PHASE B, the Wasp: a thorax of navy lacquer under an ice-blue plate with two white marks; a navy head with two great faceted green
   compound eyes, white hooked mandibles that open, long antennae tipped with green light; the abdomen in six bands, white and navy,
   on a narrow waist; a swept tail longer than its body (navy, a plate of pale ice over every other segment, barbs of ice off the
   others) ending in a long needle of ice with its point alight; six thin navy legs hanging; four broad butterfly wings of aurora
   light seen through (the 2D wing's own design: ice-blue at the root to aurora green at the edge, veins, the eye-spot of navy, green,
   ice and white, a navy border with white dots), beating as the fight beats them. The shell's pieces fly apart at the hatch and lie
   on the ice after; the empty legs fold where they stood. */
const THULC_GL = (() => {
  const A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv, mm, rotX, rotY, rotZ, rotAxis } = K, lowFx = K.lowFx;
  const M_SHELL = 730, M_SHARD = 730.2, M_NAVY = 731, M_JOINT = 731.2, M_TAIL = 731.6, M_ROOT = 732, M_ROOTS = 732.2, M_EYE = 733, M_CEYE = 733.2, M_LIGHT = 733.6, M_WING = 734, M_ICE = 735, M_PLATE = 735.2, M_SNOW = 739;
  const GREEN = '#78D7B2', GREEN_HI = '#B8F5DA', ICE_HI = '#CFE8F4', ICE = '#86B7D0', WHITE = '#FFFFFF', WARN_G = '#E8FFF4';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.thul ? FIEND_DEFS.thul.RIG : null; } catch (e) { return null; } };
  const G = A.model('Thul', buildMeshes);
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const NUL = 40, NVL = 10, NUT = 70, NVT = 10;
  function buildMeshes() { const R0 = RIG(), RX = R0.RX, RZ = R0.RZ, DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(4, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    /* the cocoon's shell: an oval about z (+RZ the crown), its five seams raised as ridges from pole to pole */
    { const B = nb(), nu = q(48), nv = q(32), seamA = TAU / 5;
      B.surf((u, v) => { const ph = u * TAU, th = 0.015 + v * (Math.PI - 0.03), st = Math.sin(th), d = Math.abs(((ph % seamA) + seamA) % seamA - seamA / 2) - seamA / 2, bump = 1 + 0.075 * Math.exp(-(d / 0.07) * (d / 0.07)) * Math.pow(st, 0.6);
        return [RX * st * Math.cos(ph) * bump, RX * st * Math.sin(ph) * bump, RZ * Math.cos(th)]; }, nu, nv, () => M_SHELL, { flip: true }); fin('shell', B); }
    /* the eye (x its gaze) and its two lids (navy domes over it, opened by turning about y) */
    { const B = nb(); B.ell([0, 0, 0], [1, 1, 1], M_EYE, { seg: q(22), rings: q(14) }); fin('eye', B); }
    for (const sg of [1, -1]) { const B = nb(); B.ell([0, 0, 0], [1, 1, 1], M_NAVY, { seg: q(22), rings: q(8), th0: sg > 0 ? 0 : Math.PI / 2, th1: sg > 0 ? Math.PI / 2 : Math.PI }); fin(sg > 0 ? 'lidU' : 'lidL', B); }
    { const B = nb(); B.ell([0, 0, 0], [1, 1, 1], M_JOINT, { seg: q(22), rings: q(10) }); fin('socket', B); }
    /* the legs: swept grids (written every frame) */
    for (let i = 0; i < 3; i++) { out['leg' + i] = A.grid(NUL, NVL, M_ROOT, (u, v) => v, (u, v) => u * 6); out['husk' + i] = A.grid(NUL, NVL, M_ROOT, (u, v) => v, (u, v) => u * 6); }
    /* a snow cap (a knee's, the knot's): a low dome */
    { const B = nb(); B.ell([0, 0, 0], [1, 1, 1], M_SNOW, { seg: q(14), rings: q(6), th1: Math.PI / 2, cap: true }); fin('snow', B); }
    /* the roots splayed from a foot (x away from the knot) */
    { const B = nb(); [-0.95, -0.15, 0.7, 1.5].forEach((s, k) => { const L = 0.6 + 0.3 * (k % 3), a = s, mid = [Math.cos(a + 0.3) * L * 0.5, Math.sin(a + 0.3) * L * 0.5, 0.06], e = [Math.cos(a) * L, Math.sin(a) * L, 0.0];
        B.tube([0, 0, 0.08], mid, 0.1, 0.07, M_ROOTS, { seg: q(7), cap0: false, cap1: 'round' }); B.tube(mid, e, 0.07, 0.015, M_ROOTS, { seg: q(7), cap0: 'round', cap1: false }); }); fin('roots', B); }
    /* the knot where the legs meet: gnarled lumps of root */
    { const B = nb(); [[0, 0, 0, 0.42], [0.22, 0.12, 0.08, 0.3], [-0.2, 0.16, -0.04, 0.3], [0.02, -0.24, 0.05, 0.3], [0.05, 0.02, 0.26, 0.26]].forEach(([x, y, z, r], k) => B.ell([x, y, z], [r * 1.1, r, r * 0.85], M_ROOTS, { seg: q(14), rings: q(9) }));
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.02, 0.02, 0.32]); B.ell([0, 0, 0], [0.42, 0.36, 0.16], M_SNOW, { seg: q(14), rings: q(5), th1: Math.PI / 2, cap: true }); B.pop(); fin('knot', B); }
    /* a unit tube (x 0..1, radius 1), root and navy; a ball */
    { const B = nb(); B.tube([0, 0, 0], [1, 0, 0], 1, 0.82, M_ROOTS, { seg: q(10), cap0: 'flat', cap1: 'flat' }); fin('stalk', B); }
    { const B = nb(); B.tube([0, 0, 0], [1, 0, 0], 1, 0.75, M_NAVY, { seg: q(8), cap0: 'flat', cap1: 'flat' }); fin('ntube', B); }
    /* the frost collar: a band of ice and fifteen spikes (one mesh, each placed every frame) */
    { const B = nb(); B.tor([0, 0, 0], 1, 0.14, M_ICE, { seg: q(32), rseg: q(7) }); fin('band', B); }
    { const B = nb(); B.crystal([0, 0, 0], [1, 0, 0], 0.2, M_ICE, { n: 5, seed: 1.7, belly: 0.25, cap: true }); const base = B.done(); out.spike = base; out.spikes = K.multi(base, 15); }
    /* the shell's pieces: a curved plate of shell (a patch of the oval) */
    { const B = nb(); B.surf((u, v) => { const ph = -0.55 + u * 1.1, th = Math.PI / 2 - 0.5 + v * 1.0, st = Math.sin(th); return [RX * st * Math.cos(ph) - RX, RX * st * Math.sin(ph), RZ * 0.55 * Math.cos(th)]; }, q(8), q(6), () => M_SHARD, { flip: true });
      B.surf((u, v) => { const ph = -0.55 + u * 1.1, th = Math.PI / 2 - 0.5 + v * 1.0, st = Math.sin(th); return [(RX - 0.08) * st * Math.cos(ph) - RX, (RX - 0.08) * st * Math.sin(ph), RZ * 0.55 * Math.cos(th)]; }, q(8), q(6), () => M_JOINT, {}); fin('shard', B); }
    /* ---- the wasp ---- */
    { const B = nb(); B.ell([0, 0, 0], [0.72, 0.58, 0.6], M_NAVY, { seg: q(26), rings: q(16) }); B.ell([0.03, 0, 0.36], [0.48, 0.36, 0.14], M_PLATE, { seg: q(20), rings: q(8) });
      for (const s of [-1, 1]) B.ell([-0.3, s * 0.3, 0.3], [0.09, 0.09, 0.05], M_SHARD, { seg: q(10), rings: q(5) }); fin('thorax', B); }
    { const B = nb(); B.ell([0, 0, 0], [0.44, 0.5, 0.44], M_NAVY, { seg: q(24), rings: q(14) });
      for (const s of [-1, 1]) { const pts = [[0.18, s * 0.15, 0.28], [0.58, s * 0.32, 0.73], [1.13, s * 0.55, 0.88], [1.48, s * 0.6, 0.63]]; for (let k = 0; k < 3; k++) B.tube(pts[k], pts[k + 1], 0.035 - k * 0.006, 0.03 - k * 0.006, M_NAVY, { seg: q(6), cap0: 'round', cap1: 'round' }); B.sph(pts[3], 0.055, M_LIGHT, q(8)); } fin('head', B); }
    { const B = nb(); B.ell([0, 0, 0], [1, 1, 1], M_CEYE, { seg: q(22), rings: q(14) }); fin('ceye', B); }
    for (const s of [1, -1]) { const B = nb(), p = [[0, 0, 0], [0.3, s * 0.1, -0.13], [0.44, -s * 0.06, -0.23]]; B.tube(p[0], p[1], 0.07, 0.05, M_SHARD, { seg: q(8), cap0: 'round', cap1: false }); B.tube(p[1], p[2], 0.05, 0.008, M_SHARD, { seg: q(8), cap0: 'round', cap1: false }); fin(s > 0 ? 'mandL' : 'mandR', B); }
    { const B = nb(); B.ell([0, 0, 0], [1, 1, 1], M_SHARD, { seg: q(20), rings: q(12) }); fin('bandW', B); }
    { const B = nb(); B.ell([0, 0, 0], [1, 1, 1], M_NAVY, { seg: q(20), rings: q(12) }); fin('bandN', B); }
    { const B = nb(); B.tube([0, 0, 0], [1, 0, 0], 1, 0.7, M_NAVY, { seg: q(7), cap0: 'flat', cap1: 'flat' }); const base = B.done(); out.wlegs = K.multi(base, 12); }
    out.tail = A.grid(NUT, NVT, M_TAIL, (u, v) => v, (u, v) => u * 14);
    { const B = nb(); B.crystal([0, 0, 0], [1, 0, 0], 0.12, M_ICE, { n: 6, belly: 0.18, seed: 2.3, jit: 0.08 }); fin('needle', B); }
    { const B = nb(); B.sph([0, 0, 0], 1, M_NAVY, q(14)); fin('ball', B); }
    { const B = nb(); B.sph([0, 0, 0], 1, M_LIGHT, q(12)); fin('glowball', B); }
    { const B = nb(); B.crystal([0, 0, 0], [1, 0, 0], 0.32, M_ICE, { n: 4, belly: 0.2, seed: 0.4, thin: 0.5 }); const base = B.done(); out.barbs = K.multi(base, 8); }
    /* the wings: the 2D wing's outline (s along the span, q along the chord) filled as a fan from inside it; vA.y 0 the middle .. 1 the
       rim, vA.z round the rim */
    const wingOf = (OUT, c0) => { const B = nb(), n = OUT.length, tw = 0.04;
      const at = v => { const f = v * n, k = Math.floor(f) % n, t = f - Math.floor(f), a = OUT[k], b = OUT[(k + 1) % n], p0 = OUT[(k - 1 + n) % n], p3 = OUT[(k + 2) % n], t2 = t * t, t3 = t2 * t;
        return [0, 1].map(i => 0.5 * (2 * a[i] + (-p0[i] + b[i]) * t + (2 * p0[i] - 5 * a[i] + 4 * b[i] - p3[i]) * t2 + (-p0[i] + 3 * a[i] - 3 * b[i] + p3[i]) * t3)); };
      B.surf((u, v) => { const e = at(v), r = Math.pow(u, 0.85); return [c0[0] + (e[0] - c0[0]) * r, c0[1] + (e[1] - c0[1]) * r, tw * Math.sin(u * Math.PI) * 0.5]; }, q(10), q(64), () => M_WING, { e: (u, v) => u, a: (u, v) => v });
      return B.done(); };
    out.wingF = wingOf(R0.FW, [1.3, 0.3]); out.wingH = wingOf(R0.HW, [1.1, -0.85]);
    return out; }

  /* ================= posing ================= */
  const st3 = FX => { const M = FX.mem; return M.th3 || (M.th3 = { fx: [] }); };
  /* the cocoon (phase A) */
  function cocoonList(m, M, ox, oy, L, o) { const R0 = RIG(), Gm = R0.cocoonGeo(m, M), RX = R0.RX, RZ = R0.RZ, d = Gm.dir, t = M.bt || 0, al = o.al == null ? 1 : o.al;
    const pul = 1 + (M.pulse || 0) * 0.05 + (M.hitK || 0) * 0.03, sx = pul * (1 - (M.hitK || 0) * 0.04), sz = 1 + (M.pulse || 0) * 0.03;
    // its axis: local z up the oval (toward the stalk), turned about it by its slow twist
    const zA = vnrm(vmul(d, -1)); let x0 = vsub([1, 0, 0], vmul(zA, zA[0])); if (vlen(x0) < 1e-3) x0 = vsub([0, 1, 0], vmul(zA, zA[1])); x0 = vnrm(x0); const y0 = vcross(zA, x0), yw = M.yaw || 0, cy = Math.cos(yw + 0.314), sy = Math.sin(yw + 0.314);
    const R = M3(vadd(vmul(x0, cy), vmul(y0, sy)), vadd(vmul(y0, cy), vmul(x0, -sy)), zA), cen = [Gm.cen[0] - ox, Gm.cen[1] - oy, Gm.cen[2]], gl2 = o.flash ? 1 : 0;
    L.push({ part: 'shell', R, o: cen, sc: [sx, sx, sz], spill: M.crack || 0, glow: M.eye || 0.5, glow2: gl2, wear: 0.3, al });
    // the eye in its lowest opening, facing the camera; its lids open by its openness
    const vw = vsub(A.PD, vmul(zA, vdot(A.PD, zA))), f = vlen(vw) > 1e-3 ? vnrm(vw) : vnrm(vcross(zA, [1, 0, 0])), zc = -0.08, rr = Math.sqrt(1 - zc * zc) * RX * sx * 0.97;
    const ep = vadd(cen, vadd(vmul(zA, zc * RZ * sz), vmul(f, rr))), nrm = vnrm(vadd(vmul(f, 1 / RX), vmul(zA, zc / RZ))), ey = vnrm(vcross(zA, nrm)), ez = vcross(nrm, ey), Re = M3(nrm, ey, ez);
    const tp = M.topple || 0, eo = cl((M.eye == null ? 0.5 : M.eye) * (1 - (M.blink || 0))), ew = RX * 0.62 * (1 + tp * 0.25), eh = 0.3 + 0.12 * tp, lk = M.look || [0, 0];
    L.push({ part: 'socket', R: Re, o: vadd(ep, vmul(nrm, -0.12)), sc: [0.2, ew * 1.04, eh * 1.25], al, glow2: gl2, outline: false });
    const Rg = mm(Re, mm(rotZ(-lk[0] * 0.55), rotY(lk[1] * 0.45)));
    L.push({ part: 'eye', R: Rg, o: vadd(ep, vmul(nrm, -0.1)), sc: [0.32, ew * 0.62, eh * 1.3], glow: 0.4 + (M.menace || 0) * 0.5 + (M.roar || 0) * 0.4 + (m.stunT > 0 ? 0.5 + 0.4 * Math.sin(t * 10) : 0), kind: M.menace || 0, al, glow2: gl2, outline: false });
    const openU = 0.3 + eo * 1.1, openL = 0.25 + eo * 0.6;
    L.push({ part: 'lidU', R: mm(Re, rotY(-openU)), o: vadd(ep, vmul(nrm, -0.06)), sc: [0.4, ew * 0.98, 0.34], al, glow2: gl2 });
    L.push({ part: 'lidL', R: mm(Re, rotY(openL)), o: vadd(ep, vmul(nrm, -0.06)), sc: [0.38, ew * 0.96, 0.3], al, glow2: gl2 });
    // the frost collar: its band and spikes round the base, growing as it builds
    const col = M.collar || 0; if (col > 0.03) { const zb = -0.5 * RZ * sz, bw = RX * 0.95 * sx, bc = vadd(cen, vmul(zA, zb)), Rb = M3(R.x, R.y, zA);
      L.push({ part: 'band', R: Rb, o: bc, sc: [bw * 1.02, bw * 1.02, col], glow: 0.4 + col * 0.6, al, glow2: gl2 });
      const MS = G.MESH.spikes; let k = 0; for (let i = 0; i < 15; i++) { const ps = i / 15 * TAU + yw * 0.5, kk = cl(col * 1.6 - ((i * 7) % 15) / 15 * 0.6); if (kk <= 0.02) { K.hide(MS, i); continue; }
        const Ln = (0.6 + 0.55 * ((i * 7) % 5) / 4) * kk, rad = vadd(vmul(R.x, Math.cos(ps)), vmul(R.y, Math.sin(ps))), dirS = vnrm(vadd(rad, vmul(zA, -0.55))), p0 = vadd(bc, vmul(rad, bw * 0.92));
        K.place(MS, i, A.along(dirS, zA), p0, [Ln, 0.6 + 0.4 * kk, 0.6 + 0.4 * kk]); k++; }
      K.commit(MS); if (k) L.push({ part: 'spikes', R: I3(), o: [0, 0, 0], glow: 0.3 + col * 0.5, al, glow2: gl2 }); }
    // the stalk and the knot
    const ap = [Gm.apex[0] - ox, Gm.apex[1] - oy, Gm.apex[2] + 0.15], tp2 = [Gm.top[0] - ox, Gm.top[1] - oy, Gm.top[2] + 0.1], sg = A.seg(ap, tp2, 0.17, 0, 0); L.push({ part: 'stalk', R: sg.R, o: sg.o, sc: sg.sc, al, glow2: gl2 });
    L.push({ part: 'knot', R: rotZ((M.hd || 0) + 0.4), o: ap, s: 1.05, al, glow2: gl2 });
    // the legs
    for (let i = 0; i < 3; i++) legList(L, 'leg' + i, i, R0.legPts(i, M.feet[i], Gm.apex, M.hd, M), ox, oy, al, gl2, t); }
  // a leg: one swept tube of root from the foot to the knot, bowed, swollen at the ankle and knee; a cap of snow on the knee; roots at the foot
  function legList(L, part, i, pts, ox, oy, al, gl2, t, squash) { const [F, An, Kn, P] = pts, bows = [[0.12, -0.1, 0.08][i], [-0.16, 0.14, -0.1][i], [0.1, 0.12, -0.14][i]];
    const cp = [F]; const segP = (a, b, bow) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d; cp.push([a[0] + (b[0] - a[0]) * 0.33 + nx * bow, a[1] + (b[1] - a[1]) * 0.33 + ny * bow, a[2] + (b[2] - a[2]) * 0.33], [a[0] + (b[0] - a[0]) * 0.7 - nx * bow * 0.5, a[1] + (b[1] - a[1]) * 0.7 - ny * bow * 0.5, a[2] + (b[2] - a[2]) * 0.7], b); };
    segP(F, An, bows[0]); segP(An, Kn, bows[1]); segP(Kn, P, bows[2]);
    const Pt = A.spline(cp, NUL), Fr = A.frames(Pt, [0, 0, 1]), M = G.MESH[part];
    A.tube(M, Pt, Fr, u => { const s = u * 3, w = s < 1 ? lerp(0.1, 0.15, s) : s < 2 ? lerp(0.15, 0.21, s - 1) : lerp(0.21, 0.25, s - 2); return w * (1 + 0.16 * Math.sin(u * 9 + i)) + 0.09 * Math.exp(-Math.pow((s - 1) / 0.13, 2)) + 0.12 * Math.exp(-Math.pow((s - 2) / 0.13, 2)); }, ox, oy);
    L.push({ part, R: I3(), o: [0, 0, 0], al, glow2: gl2, wear: 0.2 + i * 0.3 });
    L.push({ part: 'snow', R: rotZ(i * 1.7), o: [Kn[0] - ox, Kn[1] - oy, Kn[2] + 0.2], sc: [0.36, 0.3, 0.16], al, glow2: gl2 });
    if ((F[2] || 0) < 0.3) L.push({ part: 'roots', R: rotZ(Math.atan2(F[1] - P[1], F[0] - P[0]) + i * 0.4), o: [F[0] - ox, F[1] - oy, Math.max(0, F[2] || 0)], s: 1, al, glow2: gl2 }); }
  /* the wasp (phase B) */
  function waspList(m, M, ox, oy, L, o) { const R0 = RIG(), P = R0.waspPose(m, M), S = P.S, W = P.W, Rb = A.frameOf(W, S), t = M.bt || 0, al = o.al == null ? 1 : o.al, gl2 = o.flash ? 1 : 0, glow = M.glow == null ? 0.6 : M.glow;
    const rel = p => [p[0] - ox, p[1] - oy, p[2]], at = (u, v, h) => rel(W(u, v, h));
    L.push({ part: 'thorax', R: Rb, o: rel(P.thorax), s: S, glow: glow * 0.5, al, glow2: gl2 });
    L.push({ part: 'head', R: Rb, o: rel(P.head), s: S, glow, al, glow2: gl2 });
    for (const s of [-1, 1]) { L.push({ part: 'ceye', R: Rb, o: at(1.86, s * 0.33, 0.36), sc: [0.22 * S, 0.17 * S, 0.27 * S], glow: 0.5 + glow * 0.5, al, glow2: gl2 });
      const jo = (M.jaw || 0) * 0.55; L.push({ part: s > 0 ? 'mandL' : 'mandR', R: mm(Rb, rotZ(s * jo)), o: at(1.98, s * 0.2, 0.05), s: S, al, glow2: gl2 }); }
    // the waist and the abdomen's bands
    for (const [a, b] of [[P.thorax, P.pet0], [P.pet0, P.gs[0]]]) { const sg = A.seg(rel(a), rel(b), 0.12 * S, 0, 0); L.push({ part: 'ntube', R: sg.R, o: sg.o, sc: [sg.sc[0], 0.12 * S, 0.12 * S], al, glow2: gl2 }); }
    const GR = [0.42, 0.6, 0.7, 0.66, 0.52, 0.32];
    P.gs.forEach((g, k) => { const nx = P.gs[Math.min(5, k + 1)], pv = P.gs[Math.max(0, k - 1)], d = vsub(pv, nx); L.push({ part: k % 2 === 0 ? 'bandW' : 'bandN', R: A.along(vlen(d) > 1e-4 ? d : [Math.cos(M.hd || 0), Math.sin(M.hd || 0), 0]), o: rel(g), sc: [0.34 * S, GR[k] * S, GR[k] * 0.9 * S], al, glow2: gl2 }); });
    // the legs, hanging and twitching
    { const MS = G.MESH.wlegs; let k = 0; [[0.95, 0], [0.7, 1], [0.45, 2]].forEach(([u0, kk]) => [-1, 1].forEach(sd => { const sw = Math.sin(t * 3 + kk * 1.3 + sd) * 0.12, hip = at(u0, sd * 0.28, -0.18), knee = at(u0 + 0.25 - kk * 0.15, sd * 0.85, -0.45 + sw), foot = at(u0 + 0.5 - kk * 0.45 + sw, sd * 0.7, -1.25 - kk * 0.12);
        for (const [a, b, r] of [[hip, knee, 0.055], [knee, foot, 0.04]]) { const sg = A.seg(a, b, r * S, 0, 0); K.place(MS, k++, sg.R, sg.o, [sg.sc[0], r * S, r * S]); } })); K.commit(MS); L.push({ part: 'wlegs', R: I3(), o: [0, 0, 0], al, glow2: gl2 }); }
    // the tail: one swept tube, ice plates and dark joints; barbs of ice; the needle and its lit point
    { const Pt = A.spline(P.tl, NUT), Fr = A.frames(Pt, vnrm(vsub(W(0, 0, 1), W(0, 0, 0)))); A.tube(G.MESH.tail, Pt, Fr, u => S * (0.26 - 0.17 * u) * (1 + 0.06 * Math.cos(u * 14 * TAU)), ox, oy);
      L.push({ part: 'tail', R: I3(), o: [0, 0, 0], glow, al, glow2: gl2 });
      const MB = G.MESH.barbs; let kb = 0; for (let j = 1; j < P.tl.length - 1 && kb < 8; j += 2) { const a = P.tl[j], b = P.tl[j + 1], d = vnrm(vsub(b, a)), up = vnrm(vsub([0, 0, 1], vmul(d, d[2]))), mid = vmul(vadd(a, b), 0.5), w = S * (0.26 - 0.17 * j / 14);
        K.place(MB, kb++, A.along(vnrm(vadd(vmul(up, 1), vmul(d, -0.55))), d), rel(vadd(mid, vmul(up, w * 0.8))), [0.4 * S, 0.45 * S, 0.45 * S]); } for (; kb < 8; kb++) K.hide(MB, kb); K.commit(MB); L.push({ part: 'barbs', R: I3(), o: [0, 0, 0], glow: glow * 0.4, al, glow2: gl2 });
      const n = P.tl.length, base = P.tl[n - 1], tip = P.tip, sg = A.seg(rel(base), rel(tip), 1, 0, 0); L.push({ part: 'needle', R: sg.R, o: sg.o, sc: [sg.sc[0], S * 1.6, S * 1.6], glow: 0.5 + glow * 0.5, al, glow2: gl2 });
      L.push({ part: 'ball', R: I3(), o: rel(base), s: 0.25 * S, al, glow2: gl2 }); L.push({ part: 'glowball', R: I3(), o: rel(tip), s: 0.07, glow: 1.2 + glow, al, outline: false }); }
    // the wings: the far pair first in the depth order (the pass sorts what is seen through)
    const sp = M.span == null ? 1 : M.span;
    for (const side of [-1, 1]) for (const hind of [true, false]) { const flap = hind ? (M.flapH == null ? 0.3 : M.flapH) : (M.flapF == null ? 0.4 : M.flapF), cf = Math.cos(flap), sf = Math.sin(flap);
      const h0 = hind ? [0.5, side * 0.26, 0.4] : [0.82, side * 0.3, 0.52], span = [-0.2 - (hind ? 0.15 : 0), side * cf, sf], O = W(h0[0], h0[1], h0[2]), Us = vmul(vsub(W(h0[0] + span[0], h0[1] + span[1], h0[2] + span[2]), O), sp), Uc = vmul(vsub(W(h0[0] + 1, h0[1], h0[2]), O), 0.5 + 0.5 * sp);
      const nz = vnrm(vcross(Us, Uc)); L.push({ part: hind ? 'wingH' : 'wingF', R: M3(Us, Uc, nz), o: rel(O), glow, kind: hind ? 1 : 0, al: 0.99 * al, glow2: gl2, outline: false }); } }
  /* the shell's pieces in flight (drawn with the body) */
  function shardsAir(M, ox, oy, L) { for (const s of M.shards || []) if (!s.land) L.push({ part: 'shard', R: mm(rotZ(s.rot), rotX(s.rot * 0.7)), o: [s.x - ox, s.y - oy, s.z], s: s.s * 1.1, wear: 0.6 }); }
  /* the boss: the cocoon or the wasp, one pass */
  function drawBoss(c, FX, m, X, Y, T, t) { if (!gpu()) return false; const M = FX.mem || {}; if (!M.feet) M.feet = [0, 1, 2].map(i => { const p = RIG().restFoot(m, M, i); return [p[0], p[1], 0]; });
    const L = [], fl = m.flash > 0; if (M.hatched) waspList(m, M, m.x, m.y, L, { flash: fl }); else cocoonList(m, M, m.x, m.y, L, { flash: fl }); shardsAir(M, m.x, m.y, L);
    // its soft shadow on the ice (the fight's own picture of it), then the model
    const R0 = RIG(); if (M.hatched) { const S = R0.waspPose(m, M).S; FX.K.shade(c, X, Y + T * 0.2, T * 3.0 * S / (1 + (M.alt || 2.7) * 0.15), T * 1.25 * S / (1 + (M.alt || 2.7) * 0.15), 0.5, '#060C18'); }
    else { const Gm = R0.cocoonGeo(m, M); FX.K.shade(c, X + (Gm.cen[0] - m.x) * T, Y + (Gm.cen[1] - m.y) * T, T * 2.1 / (1 + Gm.cen[2] * 0.08), T * 0.9 / (1 + Gm.cen[2] * 0.08), 0.42, '#060C18');
      for (const f of M.feet) FX.K.shade(c, X + (f[0] - m.x) * T, Y + (f[1] - m.y) * T, T * 0.55, T * 0.24, 0.4 * (1 - Math.min(1, (f[2] || 0) / 1.5)), '#060C18'); }
    return A.passOf(c, X, Y, T, L, { t: M.bt || t, light: 'cave', flash: fl ? 1 : 0 }, G); }
  /* the empty legs after the hatch, folding where they stood (the husk prop) */
  function drawHusk(c, FX, p, T, t) { if (!gpu()) return false; p.t = (p.t || 0) + 1 / 60; const u = K.ease(cl(p.t / 1.6)), a = cl(1 - (p.t - 7) / 2.5); if (a <= 0) return true;
    const R0 = RIG(), apex = [p.bx, p.by, lerp(p.apex, 0.5, u)], Mh = { topple: 0, scrape: 0 }, L = [];
    for (let i = 0; i < 3; i++) { const f = p.feet[i], fx = lerp(f[0], p.bx + (f[0] - p.bx) * 1.25, u), fy = lerp(f[1], p.by + (f[1] - p.by) * 1.25, u), pts = R0.legPts(i, [fx, fy, 0], apex, p.hd, Mh).map(q => [q[0], q[1], q[2] * (1 - u * 0.85)]); legList(L, 'husk' + i, i, pts, p.bx, p.by, a, 0, t); }
    L.push({ part: 'knot', R: rotZ(p.hd || 0), o: [0, 0, apex[2] * (1 - u * 0.85) + 0.15], s: 1.05, al: a });
    const X = FX.sx(p.bx), Y = FX.sy(p.by); c.save(); if (a < 1) c.globalAlpha *= a; const ok = A.passOf(c, X, Y, T, L.map(it => Object.assign(it, { al: 1 })), { t, light: 'cave' }, G); c.restore(); return ok; }
  /* ================= its light (FGFX 540..549) ================= */
  const lab = (c, X, Y, s, col, T, sz) => { c.save(); c.font = `800 ${Math.round(T * (sz || 0.3))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(4,14,20,.7)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, X, Y); c.fillText(s, X, Y); c.restore(); };
  const gapQ = g => { if (!g) return 9; const a = ((g[0] % TAU) + TAU) % TAU; return a + Math.round(Math.min(0.99, g[1]) * 100) * 10; };
  /* a lee (the four points of the 2D lee) as a light quad: across it uv.x, from the windbreak (-1) to its far end (1) uv.y */
  function leeQ(Q, FX, P, k) { const sx = FX.sx, sy = FX.sy, c0 = [(P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4], ux = ((P[0][0] - P[3][0]) + (P[1][0] - P[2][0])) / 4, uy = ((P[0][1] - P[3][1]) + (P[1][1] - P[2][1])) / 4, vx = ((P[1][0] + P[2][0]) - (P[0][0] + P[3][0])) / 4, vy = ((P[1][1] + P[2][1]) - (P[0][1] + P[3][1])) / 4, T = FX.Tz();
    Q.quad(545, sx(c0[0]), sy(c0[1]), ux * T * 1.15, uy * T * 1.15, vx * T * 1.05, vy * T * 1.05, GREEN_HI, k, 1, 0, 0); return [sx(c0[0]), sy(c0[1])]; }
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); }
  /* the floor's light (the overlay, under everything standing): the shell's pieces lying on the ice, the stinger's cracks, the marked
     pillar, the collar's frost and its ring with the gaps lit green, the hail's patches, the lees, the ice wave, the warnings */
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.wb) return false; const F = A.fg(), marked = FX.S.tele.filter(s => s.aur);
    if (!F || !G.on() || !RIG()) { if (!marked.length) return false; for (const s of marked) A.tele2D(c, FX, s, T, t); return false; }
    const sx = FX.sx, sy = FX.sy, R0 = RIG(), lf = lowFx(), labels = [];
    // the shell's pieces where they fell: kept pictures (one each)
    for (let i = 0; i < M.shards.length; i++) { const s = M.shards[i]; if (!s.land) continue; const a = Math.min(1, (40 - s.t) / 3); if (a <= 0) continue; if (s.pk == null) s.pk = Math.floor(Math.random() * 6);
      const p = A.pic(c, G, 'shard' + s.pk + '|' + Math.round(s.s * 4), T, () => [{ part: 'shard', R: mm(rotZ(s.pk * 1.05), K.rotY(-Math.PI / 2 + 0.18)), o: [0, 0, 0.02], s: s.s * 0.8, wear: 0.6 }], 'cave'); if (p) A.blitPic(c, p, sx(s.x), sy(s.y), a); }
    const Q = F.begin(c, null);
    try {
      // its own light pooled on the ice under it
      if (m && !m.dead) { if (M.hatched) Q.glow(sx(m.x), sy(m.y) + T * 0.2, T * 3.6, GREEN, 0.12 + (M.glow || 0.6) * 0.12, 0.42); else { const Gm = R0.cocoonGeo(m, M); Q.glow(sx(Gm.bot[0]), sy(Gm.bot[1]), T * 2.6, GREEN, 0.12 + (M.eye || 0) * 0.1 + (M.crack || 0) * 0.3, 0.45); } }
      // the stinger's hole: cracks of light radiating in the ice
      if (M.stuckAt) { const k = Math.max(0.3, M.stuck || 0); Q.quad(548, sx(M.stuckAt[0]), sy(M.stuckAt[1]), T * 1.7, 0, 0, T * 1.1, ICE_HI, 1, k, (M.cracks && M.cracks.seed) || 3.7); Q.glow(sx(M.stuckAt[0]), sy(M.stuckAt[1]), T * 1.2, GREEN_HI, 0.3 * k); }
      // the marked pillar: a cold glow of warning round its foot (no red ring)
      for (const w of M.wb) if (w.mark) Q.quad(547, sx(w.x), sy(w.y) + T * 0.2, T * 2.6, 0, 0, T * 1.6, '#E8F6FF', 1, 1, 7.1);
      // the collar building: frost spreading on the ice under it (its ring is the warning, below)
      if (M.cl && !M.cl.let && M.cl.tele && m) { const s2 = M.cl.tele, X = sx(s2.x), Y = sy(s2.y), u = cl(s2.age / s2.t), fr = (1.4 + 1.6 * (M.collar || 0)) * T; Q.quad(540, X, Y, fr, 0, 0, fr * 0.8, '#E4EDF0', 0.9, u, 2.2, 0);
        (s2.gaps || []).forEach(([a, w]) => labels.push([X + Math.cos(a) * (s2.r0 + s2.r1) * T * 0.32, Y + Math.sin(a) * (s2.r0 + s2.r1) * T * 0.32, 'GAP', '#E8FFF4'])); }
      // the hail's patches (or the whole cave for the great hail), filling as it nears: frost blooms with hailstones' glints falling through
      const Hl = M.hail; if (Hl && !Hl.done) { const u = cl(Hl.age / Hl.wait);
        if (Hl.all) { const R = (R0.AR - 0.1) * T; Q.quad(540, sx(FX.C.x), sy(FX.C.y), R, 0, 0, R, '#FFFFFF', 0.7, u, 5.5, 1); }
        else Hl.patches.forEach((o, i) => Q.quad(540, sx(o.x), sy(o.y), o.r * T * 1.08, 0, 0, o.r * T * 1.08, ICE_HI, 1, u, 3 + i * 7, 1)); }
      // the lees: green, from whichever way the wind comes now
      if (M.leeK > 0.02) { const src = M.leeSrc || { a: R0.WIND }, list = Hl && Hl.all ? [Hl.safe] : R0.shelters(M);
        list.forEach(w => { if (!w) return; const P = R0.leePoly(w, src), c0 = leeQ(Q, FX, P, M.leeK); labels.push([c0[0], c0[1], 'SHELTER', '#E8FFF4', M.leeK]); });
        if (Hl && Hl.all && M.ram) { const w = M.ram.w, P = R0.leePoly(Object.assign({}, w, { kind: 'pillar' }), src), cx = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, cy = (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4; labels.push([sx(cx), sy(cy), 'NOT SAFE', '#F2F6FA', M.leeK]); } }
      // the collar's ring going out: a crest of ice spikes, the gaps left open and lit green
      const Wv = M.wave; if (Wv) { const R = Wv.r / 0.9 * T; Q.quad(544, sx(Wv.x), sy(Wv.y), R, 0, 0, R, ICE_HI, 1, gapQ(Wv.gaps[0]), gapQ(Wv.gaps[1])); }
      // the warnings
      for (const s of marked) A.tell(Q, FX, s, T, t);
    } finally { F.flush(c); }
    for (const L of labels) { c.save(); if (L[4] != null) c.globalAlpha *= L[4]; lab(c, L[0], L[1], L[2], L[3], T, 0.34); c.restore(); }
    return true; }
  /* the light in the air: the hail coming down, the gale's frost streaming, its eye's, cracks', wings' and needle's bloom; the labels */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M.wb) return false; const F = A.fg(); if (!F || !G.on() || !RIG()) return false; const sx = FX.sx, sy = FX.sy, R0 = RIG(), lf = lowFx(), bt = M.bt || t;
    const Q = F.begin(c, null);
    try {
      // the hail: stones slanting down with the wind; over a lee they burst on the windbreak's top
      for (const h of M.hailFx) { const u = cl(h.t / h.d), X = sx(h.x), Y = sy(h.y), H0 = 9 * T, ox = -Math.cos(h.a) * 3 * T, oy = -Math.sin(h.a) * 1.2 * T;
        if (u >= 1) { if (h.cut) continue; const k = 1 - (h.t - h.d) / 0.25; Q.ring(X, Y, T * 0.3 * (1.5 - k), '#FFFFFF', 0.6 * k, T * 0.06, 0.4); continue; }
        if (h.cut && u > 1 - h.cut) continue; const px = X + ox * (1 - u), py = Y + oy * (1 - u) - H0 * (1 - u); Q.beam(px - (ox + 0) * 0.14, py - oy * 0.14 - H0 * 0.14, px, py, Math.max(1.2, T * 0.05), ICE_HI, 0.5); Q.glow(px, py, Math.max(2, T * 0.16), '#FFFFFF', 0.8); }
      // the gale: frost blown off the wings in long streaks down the wind
      const Gl = M.gale; if (Gl && Gl.blowing && Gl.age < Gl.end + 0.3) { const k = cl(Math.min((Gl.age - Gl.at) / 0.3, (Gl.end + 0.3 - Gl.age) / 0.5)), len = 18, w = 4.2;
        for (const da of (lf ? [0] : [-0.38, 0, 0.38])) { const a = Gl.ga + da, ca = Math.cos(a), sa = Math.sin(a), cx = Gl.x + ca * (len / 2 + 1), cy = Gl.y + sa * (len / 2 + 1);
          Q.quad(546, sx(cx), sy(cy) - T * 1.4, ca * len / 2 * T, sa * len / 2 * T, -sa * w / 2 * T, ca * w / 2 * T, da ? ICE_HI : GREEN_HI, k * (da ? 0.7 : 1), 1, 3.3 + da * 9, len / w); } }
      // its own light
      if (!m.dead) { if (!M.hatched) { const Gm = R0.cocoonGeo(m, M), ep = Gm.cen, eo = cl((M.eye || 0.5) * (1 - (M.blink || 0))), d = Gm.dir, ez = [ep[0] + d[0] * R0.RZ * 0.64, ep[1] + d[1] * R0.RZ * 0.64 + R0.RX * 0.55, ep[2] + d[2] * R0.RZ * 0.64];
          Q.glow(sx(ez[0]), sy(ez[1]) - ez[2] * T, T * 1.3, GREEN, 0.25 + eo * 0.35 + (m.stunT > 0 ? 0.25 * Math.sin(t * 10) : 0));
          if ((M.crack || 0) > 0.3) Q.glow(sx(ep[0]), sy(ep[1]) - ep[2] * T, T * 3.2, GREEN_HI, Math.min(1, (M.crack - 0.3) * 1.3) * (0.4 + 0.25 * Math.sin(t * 20)));
          if ((M.topple || 0) > 0.6) for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3; Q.star(sx(ep[0]) + Math.cos(a) * T * 1.4, sy(ep[1]) - ep[2] * T - T * 1.6 + Math.sin(a) * T * 0.3, T * 0.3, 0.9, '#FFFFFF'); } }
        else { const P = R0.waspPose(m, M), glow = M.glow == null ? 0.6 : M.glow, sp = p => [sx(p[0]), sy(p[1]) - p[2] * T];
          for (const s of [-1, 1]) { const e = sp(P.W(1.86, s * 0.33, 0.36)); Q.glow(e[0], e[1], T * P.S * 0.6, GREEN, 0.4); const wc = sp(P.W(0.3, s * 1.6, 0.9)); Q.glow(wc[0], wc[1], T * 2.6, GREEN, Math.min(0.6, 0.12 + glow * 0.18) * (0.85 + 0.15 * Math.sin(t * 3 + s))); }
          const tp = sp(P.tip); Q.glow(tp[0], tp[1], T * 0.7, GREEN_HI, 0.4 + glow * 0.25 + 0.12 * Math.sin(t * 9)); Q.star(tp[0], tp[1], T * 0.18, 0.8, '#FFFFFF');
          if ((M.stuck || 0) > 0.05 || (m.stunT > 0 && M.stunKind === 'stuck')) { const r = sp(P.root); Q.glow(r[0], r[1], T * 1.3, GREEN_HI, 0.6 + 0.35 * Math.sin(t * 12)); Q.glow(r[0], r[1], T * 0.5, '#FFFFFF', 0.7); } } }
    } finally { F.flush(c); }
    // the labels: the collar to shatter, the bare weak points
    if (M.collarObj && !M.collarObj.dead) { const o = M.collarObj, f = cl(o.hp / o.maxhp), X = sx(o.x), Y = sy(o.y); c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = Math.max(3, T * 0.12); c.beginPath(); c.arc(X, Y - T * 0.3, T * 0.55, 0, TAU); c.stroke(); c.strokeStyle = ICE_HI; c.lineWidth = Math.max(2, T * 0.08); c.beginPath(); c.arc(X, Y - T * 0.3, T * 0.55, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke(); c.restore(); lab(c, X, Y + T * 1.1, 'FROST COLLAR · shatter it', '#E8F8FF', T); }
    if (m.stunT > 0) { const w = FX.S.weak.eye || FX.S.weak.sting; if (w && !w.dead) lab(c, sx(w.x), sy(w.y) - T * 1.5, M.stunKind === 'stuck' ? 'STING-ROOT · strike it' : 'EYE · strike it', GREEN_HI, T); }
    return true; }
  /* the frost collar to shatter (the fight's object): a ring of cold light round the cocoon's base */
  function drawCollar(c, FX, o, X, Y, T, t) { if (!gpu()) return false; const F = A.fg(), Q = F.begin(c, null); try { Q.quad(547, X, Y, o.r * T * 1.45, 0, 0, o.r * T * 0.62, '#E8F8FF', 0.9, 1, 9.3); } finally { F.flush(c); } return true; }
  /* studio and previews: the fight's own draw with the model forced */
  function preload(P) { if (!P || !P.gl) return []; return [() => { G.on(); }]; }
  function release() { if (G.MESH && typeof GLM !== 'undefined' && GLM.free) for (const k in G.MESH) if (G.MESH[k]) GLM.free(G.MESH[k]); }
  A.onRelease(() => {});
  return { G, gpu, drawBoss, drawHusk, drawCollar, overlay, drawFx, init, preload, release, st3, get kit() { return A; }, get __dbg() { return { glStats: A.stats() }; } };
})();
