/* ---------- v423 GB · Rift 02, THE GARDEN OF UNBORN STARS · the garden bosses on the GPU (Ambrel, Calyx Astrum) ----------
   GB_KIT: what the garden's second and third bosses share on the GPU, after the Drowned Belfry's Kharrox (20t3): the game
   camera's view (orthographic, about 46 degrees above the floor), one GLM pass of posed rigid parts drawn into the box round
   them and laid down as one image, a soft floor shadow, small props rendered once into kept pictures, the shared FGFX
   painter for every effect, and letting go when a stage closes (BEL.onRelease: every new stage).
   AMBREL_GL: Ambrel the Void Moth (20x-rift-fiend-garden-2.js) as a 3D creature in GLM (materials 260..266 between the
   GB-AMBREL-MAT markers in 20k5uz): a great eyeball of yellow sclera with dark smoke churning inside it, veins creeping in
   from its back, an orange rayed iris with a slit pupil that dilates and narrows, fleshy violet lids that blink and droop,
   a ring of forty velvet lashes that ripple and flare, two pairs of pearl fairy wings (their membranes deformed every frame:
   a flap that runs out along the span, folded back for a dive, flared for the storm, shivering when grounded) laced with
   veins and dusted with constellations, four rose paper lanterns swinging on beaded chains beneath. Its effects (the Dust
   Veil's lanes and curtains of falling pollen, the Lantern Dive's line and streak, the Moonbeam's sheet of moonlight, the
   Scale Storm's tumbling scales, the motes and the smoke about it, the grounded fall, the roar, the defeat) are drawn on the
   FGFX painter (kinds 176..178). The tells are light only: no filled areas, no outlines, no counts.
   Without WebGL, or on a software rasteriser (window.__GB_GL = 1 forces the GPU there: tests), or without the FGFX painter,
   the existing 2D Ambrel is drawn with the same fight. */
const GB_KIT = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera, as Kharrox's and Ifrit's)
  /* vectors and rotations (a rotation: its three columns) */
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const mT = A => M3([A.x[0], A.y[0], A.z[0]], [A.x[1], A.y[1], A.z[1]], [A.x[2], A.y[2], A.z[2]]);
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  function mslerp(A, B, u) { if (u <= 0) return A; if (u >= 1) return B; const R = mm(B, mT(A)), tr = R.x[0] + R.y[1] + R.z[2], ang = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
    if (ang < 1e-5) return B; let ax = [R.y[2] - R.z[1], R.z[0] - R.x[2], R.x[1] - R.y[0]]; if (vlen(ax) < 1e-5) return u < 0.5 ? A : B; return mm(rotAxis(ax, ang * u), A); }
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  /* the floor angle <-> the model's heading (the model's y is foreshortened by GY on the floor) */
  const headOf = th => Math.atan2(Math.sin(th) / GY, Math.cos(th));
  /* a view: model point (tiles; z up) -> screen; the model at world (x, y) and height z, turned by a */
  const CW = [0, VY, VZ];
  function mkView(x, y, z, a, o) { const T = o.T, sc = o.scale || 1, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T;
    const toS = p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; };
    return { T, sc, k, Rh, toS, x, y, z, a, X0, Y0 }; }
  const hexA = (h, a) => { const n = parseInt(h.slice(1, 7), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };
  const forced = () => typeof window !== 'undefined' && !!window.__GB_GL;
  /* the shared FGFX painter, when it can be used (window.__GB_FX = 0 keeps the 2D effects: tests) */
  const fg = () => { try { if (typeof window !== 'undefined' && window.__GB_FX === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  /* one model's GL state: its meshes built once on first use (lowFx: fewer segments), failures counted (three in 20 s and
     it gives up for the session; the 2D one is drawn) */
  function model(name, build) {
    const G = { name, MESH: null, PB: {}, NOGL: false, fails: 0, last: 0, retry: 0, ms: 0, n: 0, box: null, meshMs: 0,
      fail() { const t = nowMs(); if (t - G.last > 20000) G.fails = 0; G.last = t; G.fails++; if (G.fails >= 3) G.NOGL = true; else G.retry = t + 1500; },
      on() { if (G.NOGL || (G.retry && nowMs() < G.retry) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !forced()) return false;
        if (!G.MESH) { try { const t0 = nowMs(); G.MESH = build(); G.meshMs = nowMs() - t0; } catch (e) { G.NOGL = true; if (typeof console !== 'undefined') console.warn(name + ': meshes', e); return false; } } return true; },
      bounds(part) { let b = G.PB[part]; if (b) return b; const M = G.MESH && G.MESH[part]; if (!M) return [[0, 0, 0], 1.6]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
        for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
        return (G.PB[part] = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0)) / 2]); },
      get tris() { return G.MESH ? Object.values(G.MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0; } };
    return G; }
  /* the lights (world: x east, y south, z up): the moons' cool key from the upper left, a fill, a rose rim from behind */
  const LW = vnrm([-0.5, 0.35, 0.8]), SBW = vnrm([-0.3, -0.35, 0.88]), RIMW = vnrm([0.45, -0.8, 0.42]), UPW = [0, 0, 1];
  const GLCAP = 1500, RIMC = [1.0, 0.62, 0.9], AMBC = [1, 1, 1], OUTC = [0.05, 0.02, 0.08];
  const GLI = [], GLJ = [], OCC = new Float32Array(48);
  /* one GPU pass: parts (each { part, R, o, s, sc ([x, y, z] scales of its axes), al, glow, glow2, spill, kind, fx, wear,
     outline }) drawn into the box round them; o.into(cvs, W, H, bx0, by0, bw, bh) takes the picture instead of the canvas */
  function glPass(c, V, list, al0, o, G) {
    const k = V.k, PX = [1, 0, 0], PY = [0, GY, -ZK], PD = CW, X0 = [V.X0, V.Y0];
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { if (!G.MESH[it.part]) continue; const [bc, brr] = G.bounds(it.part), sm = (it.s || 1) * (it.sc ? Math.max(it.sc[0], it.sc[1], it.sc[2]) : 1), rr = brr * sm * 1.05 * k, R = it.R, sc = it.sc || [1, 1, 1], s = it.s || 1,
        lc = [bc[0] * sc[0] * s, bc[1] * sc[1] * s, bc[2] * sc[2] * s], w = mv(V.Rh, vadd(it.o, mv(R, lc))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__GB_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.0 * (W / bw)), outlineCol: OUTC };
    if (o.occ && o.occ.length) { let n2 = 0; for (const [p, r] of o.occ) { if (n2 >= 12) break; const w = mv(V.Rh, p); OCC[n2 * 4] = w[0]; OCC[n2 * 4 + 1] = w[1]; OCC[n2 * 4 + 2] = w[2]; OCC[n2 * 4 + 3] = r; n2++; } S.occ = OCC; S.nocc = n2; }
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = G.MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const Rw = mm(V.Rh, it.R), s2 = it.s || 1, sc = it.sc || [1, 1, 1], Tt = mv(V.Rh, it.o);
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2 * sc[0]; g.R1[i] = Rw.y[i] * s2 * sc[1]; g.R2[i] = Rw.z[i] * s2 * sc[2]; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.5 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.first = 0; g.cnt = 0; g.d = vdot(Tt, PD) + (it.dz || 0); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    if (o.into) o.into(cvs, W, H, bx0, by0, bw, bh); else { c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); if (o.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= Math.min(1, o.flash) * 0.3; c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); } }
    G.ms = G.ms * 0.9 + (nowMs() - t0) * 0.1; G.n++; G.box = [W, H]; return true;
  }
  /* the soft floor shadow: blobs under the parts (their height softening and spreading them), painted small, laid down once */
  let SHC = null, BLOB = null;
  function shadow(c, V, list, al, G, skip) {
    if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const proj = [];
    for (const it of list) { if (skip && skip(it)) continue; if (!G.MESH[it.part]) continue; const [bc, brr] = G.bounds(it.part), sc = it.sc || [1, 1, 1], s = it.s || 1, p = vadd(it.o, mv(it.R, [bc[0] * sc[0] * s, bc[1] * sc[1] * s, bc[2] * sc[2] * s])), g = V.toS([p[0], p[1], 0]), h = Math.max(0, p[2]), rr = brr * 0.55 * V.k * s * Math.max(sc[0], sc[1]) * (1 + h * 0.1), w = (it.al == null ? 1 : it.al) / (1 + h * 0.3);
      x0 = Math.min(x0, g[0] - rr); x1 = Math.max(x1, g[0] + rr + h * 0.2 * V.k); y0 = Math.min(y0, g[1] - rr); y1 = Math.max(y1, g[1] + rr); proj.push([g[0] + h * 0.12 * V.k, g[1] + h * 0.04 * V.k, rr, w]); }
    if (!proj.length) return;
    const sc = 0.25, W = Math.max(8, Math.ceil((x1 - x0) * sc) + 4), H = Math.max(8, Math.ceil((y1 - y0) * sc) + 4);
    if (W > 1024 || H > 1024) return;
    if (!SHC || SHC.width < W || SHC.height < H) { if (SHC) SHC.width = SHC.height = 1; SHC = document.createElement('canvas'); SHC.width = W; SHC.height = H; }
    const g = SHC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, SHC.width, SHC.height);
    for (const [px, py, rr, w] of proj) { const r2 = rr * sc; g.globalAlpha = Math.min(1, 0.4 * w); g.drawImage(BLOB, (px - x0) * sc + 2 - r2, (py - y0) * sc + 2 - r2 * GY, r2 * 2, r2 * 2 * GY); }
    c.save(); c.globalAlpha = al * 0.55; c.imageSmoothingEnabled = true; c.drawImage(SHC, 0, 0, W, H, x0 - 2 / sc, y0 - 2 / sc, W / sc, H / sc); c.restore();
  }
  /* a deforming mesh: its positions rewritten in place from pos(u, v) (the order GLM's surf builds a grid in), its normals
     from the grid, then handed to the GPU again */
  function regrid(M, nu, nv, pos, flip) { if (!M) return; const P = M.pos, N = M.nrm, G = new Array((nu + 1) * (nv + 1));
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) G[j * (nu + 1) + i] = pos(i / nu, j / nv);
    const at = (i, j) => G[Math.max(0, Math.min(nv, j)) * (nu + 1) + Math.max(0, Math.min(nu, i))];
    let o = 0; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = at(i, j), a = at(i + 1, j), b = at(i - 1, j), c2 = at(i, j + 1), d = at(i, j - 1), du = vsub(a, b), dv = vsub(c2, d);
      let nn = vcross(du, dv); if (flip) nn = vmul(nn, -1); const l = vlen(nn) || 1; P[o] = q[0]; P[o + 1] = q[1]; P[o + 2] = q[2]; N[o] = nn[0] / l; N[o + 1] = nn[1] / l; N[o + 2] = nn[2] / l; o += 3; }
    if (typeof GLM !== 'undefined' && GLM.touchGeo) GLM.touchGeo(M); }
  /* many copies of one small mesh in one (thorns, petals): built once, each copy placed every frame (rotation R with column
     scales sc, origin o) by rewriting its positions and normals, one draw for them all */
  function multi(base, n) { const nv = base.nv, ni = base.idx.length, pos = new Float32Array(nv * 3 * n), nrm = new Float32Array(nv * 3 * n), att = new Float32Array(nv * 3 * n), idx = nv * n > 65535 ? new Uint32Array(ni * n) : new Uint16Array(ni * n);
    for (let k = 0; k < n; k++) { att.set(base.att, k * nv * 3); pos.set(base.pos, k * nv * 3); nrm.set(base.nrm, k * nv * 3); for (let i = 0; i < ni; i++) idx[k * ni + i] = base.idx[i] + k * nv; }
    return { pos, nrm, att, idx, nv: nv * n, ntri: ni * n / 3, gl: null, base, n }; }
  function place(M, k, R, o, sc) { const B = M.base, nv = B.nv, P = M.pos, N = M.nrm, bp = B.pos, bn = B.nrm, off = k * nv * 3, sx = sc ? sc[0] : 1, sy = sc ? sc[1] : 1, sz = sc ? sc[2] : 1;
    for (let i = 0; i < nv * 3; i += 3) { const x = bp[i] * sx, y = bp[i + 1] * sy, z = bp[i + 2] * sz, nx = bn[i] / sx, ny = bn[i + 1] / sy, nz = bn[i + 2] / sz;
      P[off + i] = o[0] + R.x[0] * x + R.y[0] * y + R.z[0] * z; P[off + i + 1] = o[1] + R.x[1] * x + R.y[1] * y + R.z[1] * z; P[off + i + 2] = o[2] + R.x[2] * x + R.y[2] * y + R.z[2] * z;
      const wx = R.x[0] * nx + R.y[0] * ny + R.z[0] * nz, wy = R.x[1] * nx + R.y[1] * ny + R.z[1] * nz, wz = R.x[2] * nx + R.y[2] * ny + R.z[2] * nz, l = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1; N[off + i] = wx / l; N[off + i + 1] = wy / l; N[off + i + 2] = wz / l; } }
  function hide(M, k) { const nv = M.base.nv, off = k * nv * 3; for (let i = 0; i < nv * 3; i++) M.pos[off + i] = 0; }
  const commit = M => { if (typeof GLM !== 'undefined' && GLM.touchGeo) GLM.touchGeo(M); };
  /* small still props rendered once at a zoom into kept pictures (key: what is drawn), laid down after; let go on release */
  const PICS = new Map();
  function pic(c, G, key, T, make) { const m0 = c.getTransform ? c.getTransform() : null, dev = m0 ? Math.max(0.25, Math.hypot(m0.a, m0.b)) : 1, q = Math.round(Math.log(Math.max(1, T * dev)) * 10), Tq = Math.exp(q / 10) / dev, k2 = `${G.name}|${key}|${q}`;
    let P = PICS.get(k2); if (P) return { P, f: T / Tq };
    if (!G.on()) return null; const V0 = mkView(0, 0, 0, 0, { T: Tq, sx: v => v, sy: v => v }); let out = null;
    try { glPass(c, V0, make(), 1, { t: 0, outline: 1, into: (cvs, W, H, bx0, by0, bw, bh) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(cvs, 0, 0); out = { cv, bx0, by0, bw, bh }; } }, G); } catch (e) { G.fail(); }
    if (!out) return null; if (PICS.size > 24) dropPics(); PICS.set(k2, out); return { P: out, f: T / Tq }; }
  function dropPics() { for (const P of PICS.values()) if (P && P.cv) P.cv.width = P.cv.height = 1; PICS.clear(); }
  /* letting go: when any new stage is made (BEL.onRelease, 20n) the garden bosses drop their pointers into the old one and
     their kept pictures; the meshes, the shader and the scratch pools hold nothing of a stage and stay */
  const REL = [];
  function onRelease(f) { REL.push(f); }
  function release() { dropPics(); if (SHC) { SHC.width = SHC.height = 1; SHC = null; } for (const f of REL) try { f(); } catch (e) { /* (nothing to drop) */ } }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no Belfry hook) */ }
  /* a soft FGFX kit: light that falls back to nothing when the painter is not there (the caller then draws its 2D art) */
  return { TAU, cl, lerp, sstep, ease, nowMs, lowFx, GY, ZK, CW, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, vlerp, M3, I3, mv, mm, mT, rotX, rotY, rotZ, rotAxis, mslerp, frameXZ, hash, angTo, headOf,
    mkView, hexA, forced, fg, model, glPass, shadow, regrid, multi, place, hide, commit, pic, dropPics, onRelease, release, get picN() { return PICS.size; } };
})();

const AMBREL_GL = (() => {
  const K = GB_KIT, { TAU, cl, lerp, sstep, ease, GY, ZK, CW, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, mv, mm, rotX, rotY, rotZ, rotAxis, mslerp, frameXZ, hash, headOf } = K;
  /* ================= materials (GLM ids: the GB-AMBREL-MAT block in 20k5uz) ================= */
  const M_EYE = 260, M_LID = 261, M_LASH = 262, M_WING = 263, M_HIND = 263.2, M_PAPER = 264, M_FRAME = 265, M_VEL = 266;
  /* ================= the measures (tiles; z up; x forward, y to its left) ================= */
  const RB = 1.5, VOFF = 0.7;
  // (the wings' outlines, as the 2D Ambrel's: along the body, out from it)
  const FROOT = [0.0, 0.55], HROOT = [-0.7, 0.45];
  const FORE = { pts: [[0.35, 0.3], [1.15, 1.5], [1.2, 2.8], [0.6, 4.1], [-0.35, 4.3], [-1.05, 3.4], [-1.15, 1.8], [-0.5, 0.4]], i0: 1, i1: 6, d: 0.2 };
  const HIND = { pts: [[-0.55, 0.35], [-1.0, 1.3], [-1.6, 2.4], [-2.3, 2.65], [-2.7, 2.2], [-3.7, 2.55], [-2.8, 1.7], [-3.9, 1.15], [-2.6, 0.9], [-2.15, 0.45]], i0: 1, i1: 3, d: 0.18 };
  /* an outline as a smooth closed curve (Catmull-Rom through its points), sampled by arc length: [u, v] at s in 0..1 */
  function curve(W, n, root) { const pts = W.pts, N = pts.length, cr = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t), dense = [];
    for (let i = 0; i < N; i++) for (let k = 0; k < 12; k++) { const t = k / 12, P0 = pts[(i + N - 1) % N], P1 = pts[i], P2 = pts[(i + 1) % N], P3 = pts[(i + 2) % N]; let x = cr(P0[0], P1[0], P2[0], P3[0], t), y = cr(P0[1], P1[1], P2[1], P3[1], t);
      if (i >= W.i0 && i < W.i1) { const dx = root[0] - x, dy = root[1] - y, L = Math.hypot(dx, dy) || 1, dd = W.d * Math.pow(Math.sin(Math.PI * t), 2); x += dx / L * dd; y += dy / L * dd; }   // (a scallop: a smooth dent between each pair of points)
      dense.push([x, y]); }
    dense.push(dense[0]); const L = [0]; for (let i = 1; i < dense.length; i++) L.push(L[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    const tot = L[L.length - 1], out = []; let j = 0; for (let i = 0; i <= n; i++) { const s = i / n * tot; while (j < L.length - 2 && L[j + 1] < s) j++; const e = (s - L[j]) / ((L[j + 1] - L[j]) || 1); out.push([lerp(dense[j][0], dense[j + 1][0], e), lerp(dense[j][1], dense[j + 1][1], e)]); }
    return out; }
  const WNU = 60, WNV = 9;
  let FCUR = null, HCUR = null;
  /* the wings' state this frame (shared by both sides: the model mirrors one into the other) */
  const WP = { fl: 0, lift: 0, fold: 0, flare: 0, bt: 0, trem: 0, hind: 0, crump: 0 };
  /* a point of a wing's membrane: s round its outline, k out from its root (its fan); flapped by a hinge along the body whose
     angle runs out along the span a little behind (the outer wing lags and whips), folded back for a dive, flared */
  function wingPos(isH, s, k) { const C = isH ? HCUR : FCUR, root = isH ? HROOT : FROOT, i = Math.min(WNU, Math.round(s * WNU)), e = C[i];
    const u0 = (e[0] - root[0]) * k, v0 = (e[1] - root[1]) * k, span = Math.max(0, root[1] + v0) / 4.4, ph = isH ? 0.28 : 0;
    const fl = WP.trem > 0 ? WP.trem * Math.sin(WP.bt * 31 + s * 9 + (isH ? 1.3 : 0)) * 0.12 : Math.sin(WP.fl - ph - span * 0.75);
    const amp = WP.trem > 0 ? 1 : 0.62 * (1 - WP.fold * 0.45) * (1 - WP.crump * 0.4), ang = fl * amp * (0.32 + 0.68 * span) + (0.1 + WP.lift * 0.35 + WP.flare * 0.22) * (0.4 + 0.6 * span) - WP.crump * 0.7 * span;
    const vv = v0 * (1 - WP.fold * 0.42 * span) * (1 + WP.flare * 0.15) * (1 - WP.crump * 0.25), uu = u0 - WP.fold * (isH ? 0.6 : 1.1) * span * span * 2.2 + Math.sin(WP.bt * 3 + s * 6) * 0.025 * span;
    const camber = -0.16 * Math.sin(Math.PI * k) * (0.6 + 0.4 * span), rip = Math.sin(WP.bt * 5.3 + s * 14 + (isH ? 2 : 0)) * 0.035 * k * k;
    return [uu, vv * Math.cos(ang) - (camber + rip) * Math.sin(ang), vv * Math.sin(ang) + (camber + rip) * Math.cos(ang)]; }
  /* ================= meshes (built once) ================= */
  const AMB = K.model('Ambrel', buildMeshes);
  function buildMeshes() {
    const DQ = K.lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(3, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    FCUR = curve(FORE, WNU, FROOT); HCUR = curve(HIND, WNU, HROOT);
    // the eyeball (unit radius; its frame's x the gaze)
    { const B = nb(); B.ell([0, 0, 0], [1, 1, 1], M_EYE, { seg: q(56), rings: q(40) }); fin('eye', B); }
    // the lids: a cap of flesh over the top (or bottom) of the ball, its rim rolled into a wet lip; rotated about the frame's y to close
    for (const [nm, sg] of [['lidU', 1], ['lidL', -1]]) { const B = nb(), Rr = sg > 0 ? 1.045 : 1.04, TH = Math.PI / 2;
      B.surf((u, v) => { const ph = u * TAU, lip = sstep(0.78, 1, v), th = v * TH + lip * 0.07, r = Rr + 0.035 * Math.sin(Math.PI * Math.min(1, v * 1.05)) - lip * 0.05 + 0.012 * Math.sin(ph * 9) * (1 - lip); return [Math.sin(th) * Math.cos(ph) * r, Math.sin(th) * Math.sin(ph) * r, sg * Math.cos(th) * r]; }, q(48), q(12), () => M_LID, { e: (u, v) => sstep(0.55, 1, v) });
      fin(nm, B); }
    // a lash: a tapering curved hair along x (0..1), curling toward +z; vA.z its place along it
    { const B = nb(); B.surf((u, v) => { const a = v * TAU, w = 0.13 * Math.pow(1 - u, 0.75) + 0.006, h = 0.045 * Math.pow(1 - u, 0.6) + 0.004, z = 0.2 * u * u; return [u, Math.cos(a) * w, Math.sin(a) * h + z]; }, q(10), q(8), () => M_LASH, { e: () => 0, a: u => u }); fin('lash', B); }
    // the wings: fans from the root to the outline (vA.y the place round it, vA.z out from the root), rewritten each frame
    for (const [nm, isH] of [['wingF', false], ['wingH', true]]) { const B = nb(); B.surf((u, v) => wingPos(isH, u, v), WNU, WNV, () => isH ? M_HIND : M_WING, { e: u => u, a: (u, v) => v }); fin(nm, B); }
    // the wing roots: velvet knuckles where the membranes leave the ball
    { const B = nb(); B.ell([0, 0, 0], [0.42, 0.3, 0.3], M_VEL, { seg: q(16), rings: q(10) }); fin('root', B); }
    // a rose paper lantern along x (down): a lacquered cap, ribbed paper, a bottom cap and a tassel
    { const B = nb(); B.lathe([[0, 0.05, M_FRAME], [0.02, 0.1, M_FRAME], [0.05, 0.12, M_FRAME], [0.05, 0.12, M_PAPER], [0.1, 0.19, M_PAPER], [0.18, 0.235, M_PAPER], [0.28, 0.25, M_PAPER], [0.38, 0.235, M_PAPER], [0.46, 0.19, M_PAPER], [0.51, 0.12, M_PAPER], [0.51, 0.12, M_FRAME], [0.545, 0.115, M_FRAME], [0.56, 0.06, M_FRAME], [0.6, 0.03, M_FRAME]], M_PAPER, { seg: q(24), edge: j => (j < 3 || j > 9 ? 0.6 : 0) });
      B.tube([0.6, 0, 0], [0.82, 0, 0], 0.045, 0.012, M_FRAME, { seg: q(8) }); fin('lantern', B); }
    // a beaded chain along x (0..1)
    { const B = nb(); B.tube([0, 0, 0], [1, 0, 0], 0.022, 0.022, M_FRAME, { seg: q(6) }); for (let j = 1; j <= 3; j++) B.sph([j / 4, 0, 0], 0.045, M_FRAME, q(8)); fin('chain', B); }
    // the lure lantern's seed-pod cap (the floor lanterns float on a seed: a jade pod and a string)
    { const B = nb(); B.ell([0, 0, 0], [0.2, 0.2, 0.09], M_VEL, { seg: q(14), rings: q(6) }); B.tube([0, 0, 0], [0, 0, -0.32], 0.012, 0.012, M_FRAME, { seg: 5 }); fin('pod', B); }
    return out; }
  /* ================= the pose and the rig =================
     P (from the fight's memory): z (the eye's height above the floor, as the 2D frame's), hd (the floor heading), pitch,
     roll, rb (the ball's radius), sq (a squash: [across, across, up]), look (the pet, world), wph (the wing phase), beat,
     fold, flare, ground, menace, roar, lid (0 open .. 1 shut), dil (the pupil: 0.07 a slit .. 1.3 wide), churn, lit (its
     lanterns lit), lanA (their swing), dead (0..1), bt, alpha, fade (the wings dissolving) */
  function rig(P) {
    const inst = [], A = {}, dead = cl(P.dead || 0), bt = P.bt || 0, g = cl(P.ground || 0), roar = P.roar || 0, menace = P.menace || 0, fade = cl(P.fade || 0);
    const I = (name, part, R, o, ex) => { const it = { name, part, R, o, s: 1, al: 1, glow: 0, glow2: 0, spill: 0, kind: 0, fx: dead * 0.85, wear: 0.5 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const hd = headOf(P.hd == null ? Math.PI / 2 : P.hd), zc = (P.z == null ? 2.5 : P.z) / ZK, E = [0, 0, zc];
    const yaw = Math.PI / 2 + 0.55 * Math.sin(K.angTo(Math.PI / 2, P.hd == null ? Math.PI / 2 : P.hd)) + (P.spin || 0);   // (its eye faces the camera, so its body does: the wings spread to its sides on the screen, the heading a turn of it)
    const Rb = mm(rotZ(yaw), mm(rotX(P.roll || 0), rotY(-(P.pitch || 0)))), toB = p => vadd(E, mv(Rb, p));
    const rb = P.rb || RB, sq = P.sq || [1, 1, 1];
    /* the head: the eye faces the camera, turned a little toward the pet; the iris looks at the pet (rolling when grounded) */
    const toPet = vnrm(P.look ? [P.look[0], P.look[1] / GY, -zc * 0.85] : [0, 1, -0.6]);
    let f = vnrm(vadd(vmul(CW, 1.0), vmul(toPet, 0.42 * (1 - dead)))); f = vnrm(vadd(f, [Math.sin(bt * 0.37) * 0.06 * (1 - g), 0, 0.15 * g - 0.25 * dead]));
    const Rh = frameXZ(f, [0, 0, 1]);
    let gz = vnrm(vadd(toPet, vmul(CW, 0.9)));
    { const c0 = vdot(gz, f), lim = Math.cos(0.42); if (c0 < lim) { const side = vnrm(vsub(gz, vmul(f, c0))); gz = vnrm(vadd(vmul(f, lim), vmul(side, Math.sin(0.42)))); } }
    if (g > 0.02 || dead > 0.02) { const k2 = Math.max(g, dead * 0.6), rl = mv(Rh, [1, Math.cos(bt * 5) * 0.6, Math.sin(bt * 5) * 0.45 + dead * 0.5]); gz = vnrm(vlerp3(gz, vnrm(rl), k2)); }
    const Rc = frameXZ(CW, [0, 0, 1]), Rg = frameXZ(gz, [0, 0, 1]), Rl = mslerp(Rc, Rg, 0.2);   // (Rc: the camera's frame, the lids and the lashes set in it so the lids close over the eye as seen)
    const sqM = M3([sq[0], 0, 0], [0, sq[1], 0], [0, 0, sq[2]]), eyeR = mm(sqM, Rg);
    I('eye', 'eye', eyeR, E, { s: rb, glow: menace * (1 - dead) + roar * 0.6, glow2: P.dil == null ? 0.8 : P.dil, spill: P.churn || 1, wear: 0.37 });
    // the lids: each a cap turned so its rim crosses the eye at the 2D lid's height (the upper's edge 1 - 1.06 lid of the radius
    // from the middle, the lower's 1 - 0.95 lid below it)
    const lid = cl(P.lid || 0), gU = Math.asin(Math.max(-1, Math.min(1, 1 - 1.06 * lid))) * 0.97 + 0.03, gL = Math.asin(Math.max(-1, Math.min(1, 1 - 0.95 * lid))) * 0.97 + 0.03;
    I('lidU', 'lidU', mm(sqM, mm(Rl, rotY(-gU))), E, { s: rb, wear: 0.21 });
    I('lidL', 'lidL', mm(sqM, mm(Rl, rotY(gL))), E, { s: rb, wear: 0.62 });
    A.eye = E; A.gaze = gz; A.rb = rb;
    /* the lashes: a ring round the ball's rim as the camera sees it, longest over the top, rippling, flared in a roar */
    const NL = K.lowFx() ? 24 : 40, flareK = Math.max(roar, menace * 0.6, (P.flare || 0) * 0.4), lagx = P.lag ? P.lag[0] : 0, lagy = P.lag ? P.lag[1] : 0;
    for (let i = 0; i < NL; i++) { const a = i / NL * TAU + 0.07, ca = Math.cos(a), sa = Math.sin(a), top = Math.max(0, sa), sway = Math.sin(bt * 3.2 + i * 0.85) * 0.09 + (lagx * ca + lagy * sa) * 0.3 * (1 - g) + Math.sin(bt * 11 + i) * 0.04 * g;
      const L = rb * (0.34 + 0.42 * top + 0.05 * Math.sin(i * 2.9)) * (1 + flareK * 0.45) * (1 - g * 0.2 * (1 - top)) * (1 - dead * 0.3), root = mv(Rc, [-0.02 * rb, ca * rb * 0.985 * sq[1], sa * rb * 0.985 * sq[2]]);
      const aa = a + sway * 1.6 + (top * 0.12 * (ca > 0 ? 1 : -1)), dl = mv(Rc, [0.1 + flareK * 0.22, Math.cos(aa), Math.sin(aa) - (g * 0.35 + dead * 0.5) * (1 - top)]);
      I('l' + i, 'lash', frameXZ(dl, CW), vadd(E, root), { sc: [L, 1, 1], wear: (i * 0.137) % 1, glow2: flareK }); }
    /* the wings: four membranes from the ball's sides, one shape a frame (flapped, folded, flared) mirrored into the other side */
    const wa = (1 - fade) * (1 - dead * 0.2);
    for (const sd of [1, -1]) { const Rs = M3([1, 0, 0], [0, sd, 0], [0, 0, 1]);
      for (const [nm, root, al] of [['wingF', FROOT, 0.93], ['wingH', HROOT, 0.9]]) { const o = toB([root[0], sd * (root[1] + VOFF), 0.12]);
        I(nm + sd, nm, mm(Rb, Rs), o, { al: al * wa, outline: false, glow: Math.max(P.flare || 0, roar) * (1 - dead), glow2: P.beat || 0, spill: g, wear: sd > 0 ? 0.3 : 0.7, dz: -0.3 }); }
      I('root' + sd, 'root', Rb, toB([-0.3, sd * rb * 0.86, 0.12]), { wear: 0.4 }); }
    /* the lanterns: hung on beaded chains beneath the ball, swinging with every change of course */
    const lit = P.lit == null ? 4 : P.lit, cf = Math.cos(hd), sf = Math.sin(hd);
    for (let k = 0; k < 4; k++) { const la = k * Math.PI / 2 + Math.PI / 4, on = k < lit, th = (P.lanA || 0) * (1 + k * 0.15) + Math.sin(bt * 2 + k) * 0.05 + dead * Math.sin(bt * 3 + k) * 0.2;
      const root = toB([Math.cos(la) * 0.55, Math.sin(la) * 0.55, -rb * 0.84]), L = (1.0 + k * 0.08) / ZK, tip = [root[0] + Math.sin(th) * L * cf, root[1] + Math.sin(th) * L * sf, root[2] - Math.cos(th) * L], d = vsub(tip, root);
      I('ch' + k, 'chain', frameXZ(d, [1, 0, 0]), root, { s: L, wear: 0.2 + k * 0.1 });
      const fk = on ? (0.75 + 0.15 * Math.sin(bt * 21 + k * 2) + 0.1 * Math.sin(bt * 6.3 + 1 + k)) * (1 - dead) : 0;
      I('lt' + k, 'lantern', mm(frameXZ(d, [1, 0, 0]), rotX(Math.sin(bt * 0.8 + k) * 0.6)), tip, { s: 1.3, glow: fk, wear: 0.15 + k * 0.2 });
      A['lan' + k] = vadd(tip, vmul(vnrm(d), 0.3)); A['lanOn' + k] = on; }
    return { inst, A, E, Rb, Rh, zc }; }
  function vlerp3(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
  /* the wings' membrane this frame (both deformed meshes rewritten when the pose has moved) */
  let WKEY = '';
  function wingsNow(P) { const g = cl(P.ground || 0); WP.fl = P.wph || 0; WP.lift = g > 0.5 ? -0.25 : 0; WP.fold = (P.fold || 0) * (1 - g); WP.flare = Math.max(P.flare || 0, P.roar || 0); WP.bt = P.bt || 0; WP.trem = g > 0.5 ? 1 : 0; WP.crump = cl(P.dead || 0);
    const key = `${WP.fl.toFixed(3)}|${WP.fold.toFixed(3)}|${WP.flare.toFixed(3)}|${WP.bt.toFixed(2)}|${WP.trem}|${WP.crump.toFixed(2)}`; if (key === WKEY) return; WKEY = key;
    K.regrid(AMB.MESH.wingF, WNU, WNV, (u, v) => wingPos(false, u, v)); K.regrid(AMB.MESH.wingH, WNU, WNV, (u, v) => wingPos(true, u, v)); }
  /* draw(c, m, P, o): the moth at world (m.x, m.y) with pose P; o = { T, sx, sy, t, flash }. Returns the rig, or null (no GPU:
     the caller paints the 2D Ambrel) */
  let LAST = null;
  function draw(c, m, P, o) { if (!AMB.on()) return null; const al0 = P.alpha == null ? 1 : P.alpha; if (!(al0 > 0.01)) return null;
    try { wingsNow(P); } catch (e) { AMB.fail(); return null; }
    const R = rig(P), V = K.mkView(m.x, m.y, 0, 0, o); LAST = { R, V };
    K.shadow(c, V, R.inst, al0 * (0.5 + 0.5 * cl(1 - (P.z || 2.5) / 6)) * (1 - cl(P.dead || 0) * 0.3), AMB, it => it.part === 'lash' || it.part === 'chain' || it.part === 'lidU' || it.part === 'lidL');
    let ok = false; try { ok = K.glPass(c, V, R.inst, al0, { t: o.t, flash: o.flash, occ: K.lowFx() ? null : [[R.E, (P.rb || RB) * 0.98]] }, AMB); } catch (e) { AMB.fail(); if (typeof console !== 'undefined') console.warn('Ambrel: draw', e); ok = false; }
    return ok ? R : null; }
  /* a model point -> screen */
  const toScreen = (R, V, p) => V.toS(p);
  /* the floor lure lantern (a lantern on a floating seed-pod) as a kept picture: lit or snuffed, whole or cracked */
  function lurePic(c, T, lit, cracked) { return K.pic(c, AMB, `lure${lit ? 1 : 0}${cracked ? 1 : 0}`, T, () => [
    { part: 'pod', R: K.I3(), o: [0, 0, 1.97], s: 1.3, wear: 0.4, kind: 1 },
    { part: 'lantern', R: frameXZ([0, 0, -1], [1, 0, 0]), o: [0, 0, 1.86], s: 1.45, glow: lit ? 0.85 : 0.0, wear: cracked ? 0.95 : 0.05, fx: cracked ? 0.15 : 0 }]); }
  /* ================= the fight on the GPU: its pose from the fight's memory, its effects on the FGFX painter ================= */
  const GOLD = '#FFD36B', CREAM = '#F2D8A1', ROSE_HI = '#D98FB5', MOON = '#F4EEFF', MOTE_A = '#C86BFF', MOTE_B = '#FF86E8', SMOKE = '#140820', PLUMD = '#2A1036';
  const MOTES = [0, 1, 2, 3, 4, 5, 6].map(j => ({ ph: j * 0.9, w: 0.8 + (j % 4) * 0.12, tilt: 0.3 + (j % 3) * 0.22, rot: j * 0.47, ra: 1.5 + (j % 2) * 0.3, col: j % 2 ? MOTE_A : MOTE_B }));
  const on = () => AMB.on() && !!K.fg();
  /* the pose from the fight's memory (the 2D Ambrel's own numbers: mothFrame and drawMoth) */
  function poseOf(FX, m, M, t) { const bt = M.bt || t, g = M.ground || 0, hs = m.hitSq || 0, roar = M.roar || 0, menace = M.menace || 0, E = M.gbEnd, alt0 = M.alt == null ? 2.4 : M.alt;
    const bob = Math.sin(bt * 1.7) * 0.12 * (1 - g), hover = Math.sin((M.wph || 0) * 0.5) * 0.04 * (1 - g), me = FX.me || { x: m.x, y: m.y + 5 };
    const P = { bt, hd: M.hd == null ? Math.PI / 2 : M.hd, z: alt0 + bob + hover + hs * 0.15 + 0.1 - g * 0.1, ground: g, roar, menace, fold: M.fold || 0, flare: Math.max(M.flare || 0, roar), beat: M.beat || 0, wph: M.wph == null ? t * 5 : M.wph,
      pitch: -(M.fold || 0) * 0.5 * (1 - g) + (M.recoil || 0) * 0.3 + hs * 0.1 + g * 0.15 + roar * 0.2, roll: Math.max(-0.45, Math.min(0.45, (M.turn || 0) * 0.28)) * (1 - g) + g * Math.sin(bt * 2.2) * 0.06,
      rb: RB * (1 + Math.sin(bt * 1.7) * 0.025 + roar * 0.06) * (1 + roar * 0.08 + hs * 0.05), sq: [1 + hs * 0.12 + g * 0.06, 1 + hs * 0.12 + g * 0.06, 1 - hs * 0.16 - g * 0.08],
      look: [me.x - m.x, me.y - m.y], lid: cl(Math.max(M.blink || 0, hs * 0.6, g * 0.42, 0.1 + menace * 0.14 - roar * 0.2)), dil: Math.max(0.07, Math.min(1.3, 1 - menace * 0.72 - roar * 0.95 + g * 0.35 + 0.08 * Math.sin(bt * 2.3))),
      churn: 1 + menace * 1.6 + roar * 2.5, lit: M.lit == null ? 4 : M.lit, lanA: M.lanA || 0, lag: [-(M.vx || 0) * 0.05, -(M.vy || 0) * 0.05], dead: 0, fade: 0, alpha: 1 };
    if (E) { const u = E.t; P.dead = cl(u / 1.6); P.roar = Math.max(0, 1 - u * 1.5) * 0.8; P.menace = 0; P.dil = 1.3; P.churn = 3 * Math.max(0, 1 - u / 2);
      const fall = ease(cl((u - 0.45) / 1.15)); P.z = lerp(E.z0, 0.55, fall) + Math.sin(Math.min(1, u * 1.3) * Math.PI) * 0.4 * (1 - fall); P.ground = fall; P.spin = u * 0.9 * (1 - fall * 0.5);
      P.roll = Math.sin(u * 5) * 0.3 * (1 - fall) + fall * 0.22; P.pitch = fall * 0.35; P.lid = cl((u - 1.2) / 1.0); P.lit = Math.max(0, Math.min(P.lit, 4 - Math.floor(u / 0.18)));
      P.fold = 0; P.flare = Math.max(0, 1 - u * 2); P.fade = cl((u - 1.9) / 0.9); P.alpha = 1 - cl((u - 2.55) / 0.7); P.wph = (M.wph || 0) + u * 3; P.sq = [1 + fall * 0.08, 1 + fall * 0.08, 1 - fall * 0.1]; }
    return P; }
  /* the boss itself: the model (null: the caller draws its 2D picture) */
  function paint(c, FX, m, X, Y, T, t, corpse) { const M = FX.mem; if (!M || (m.dead && !corpse)) return !!m.dead;
    const P = poseOf(FX, m, M, t), o = { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T, t: P.bt, flash: m.flash > 0 ? 1 : 0 };
    return !!draw(c, m, P, o); }
  /* ---- the effects ---- */
  const eyeAt = (FX, m, M, T) => { const L = LAST; if (L) { const p = L.V.toS(L.R.E); return [p[0], p[1], L.V.k * (L.R.A.rb || RB)]; } return [FX.sx(m.x), FX.sy(m.y) - ((M.alt == null ? 2.4 : M.alt) + 0.1) * T, T * RB]; };
  const lanAt = k => { const L = LAST; if (!L || !L.R.A['lan' + k]) return null; return L.V.toS(L.R.A['lan' + k]); };
  /* a lane across the arena: its stretch inside the floor's circle (the 2D lane ran the whole diameter) */
  function chord(C, x0, y0, a, len) { const ca = Math.cos(a), sa = Math.sin(a), fx = x0 - C.x, fy = y0 - C.y, b = fx * ca + fy * sa, cc = fx * fx + fy * fy - (C.R + 0.4) * (C.R + 0.4), D = b * b - cc; if (D <= 0) return null;
    const s0 = Math.max(0, -b - Math.sqrt(D)), s1 = Math.min(len, -b + Math.sqrt(D)); return s1 > s0 ? [x0 + ca * s0, y0 + sa * s0, x0 + ca * s1, y0 + sa * s1] : null; }
  function vee(Q, x, y, a, s, col, al, w) { if (!(al > 0.004)) return; const ca = Math.cos(a), sa = Math.sin(a); for (const sg of [-1, 1]) { const bx = x - ca * s - sa * sg * s * 0.95, by = y - sa * s + ca * sg * s * 0.95; Q.rbeam(bx, by, x, y, w * 2.6, col, al * 0.3, 0.2, 1); Q.rbeam(bx, by, x, y, w, col, al, 0.3, 1); } Q.glow(x, y, w * 2.2, col, al * 0.4); }
  /* the motes on their tilted orbits (screen space, in ball radii), the back ones (far side) or the front ones */
  function motes(Q, FX, M, e, front, t) { const bt = M.bt || t, g = M.ground || 0, P = FX.S.lv || 1, E = M.gbEnd, spd = (1 + (P >= 2 ? 0.7 : 0) + (M.menace || 0) * 0.5 + (M.roar || 0)) * (1 - g * 0.6), scat = E ? cl(E.t / 1.2) : 0, fadeE = E ? 1 - cl((E.t - 0.8) / 1.0) : 1, R0 = e[2];
    if (!(fadeE > 0.01)) return;
    for (const o of MOTES) { const ph = bt * o.w * spd + o.ph, dep = Math.sin(ph); if ((dep >= 0) !== front) continue; const ra = R0 * o.ra * (1 + g * 0.9 + scat * 2.5) + Math.sin(bt * 7 + o.ph) * R0 * 0.15 * g, at = q => { const x0 = Math.cos(q), y0 = Math.sin(q) * o.tilt; return [e[0] + (Math.cos(o.rot) * x0 - Math.sin(o.rot) * y0) * ra, e[1] + (Math.sin(o.rot) * x0 + Math.cos(o.rot) * y0) * ra * 0.9]; };
      const p = at(ph), rr = FX.Tz() * (0.1 + 0.04 * dep);
      for (let k = 1; k <= (K.lowFx() ? 3 : 6); k++) { const q0 = at(ph - (k - 1) * 0.13), q1 = at(ph - k * 0.13); Q.rbeam(q0[0], q0[1], q1[0], q1[1], rr * 1.4 * (1 - k / 8), o.col, 0.55 * (1 - k / 7) * fadeE, 1, 0.7); }
      Q.glow(p[0], p[1], rr * 5, o.col, 0.6 * fadeE); Q.glow(p[0], p[1], rr * 1.2, '#FFFFFF', 0.9 * fadeE); Q.star(p[0], p[1], rr * 2.2, 0.8 * fadeE, o.col); } }
  /* the smoke churning about the ball (solid, laid over): half behind it, half in front */
  function smoke(Q, M, e, front, t) { const bt = M.bt || t, roar = M.roar || 0, menace = M.menace || 0, g = M.ground || 0, E = M.gbEnd, churn = 1 + menace * 1.6 + roar * 2.5, R0 = e[2], fadeE = E ? 1 - cl(E.t / 2.4) : 1, n = K.lowFx() ? 4 : 8;
    for (let i = front ? 1 : 0; i < n; i += 2) { const th = bt * (0.22 + 0.07 * (i % 3)) * churn + i * 0.7, dist = R0 * (0.85 + 0.3 * Math.sin(bt * 0.6 * churn + i * 1.7) + roar * 0.7 + g * 0.25 + (E ? E.t * 0.6 : 0)), sz = R0 * (0.62 + 0.18 * Math.sin(bt * 0.9 + i * 2.1)) * (1 + roar * 0.8);
      Q.smoke(e[0] + Math.cos(th) * dist * 1.1, e[1] + Math.sin(th) * dist * 0.85, sz, (front ? 0.32 : 0.62) * (1 + roar * 0.4) * fadeE, i * 1.7, i % 3 ? SMOKE : PLUMD, 0.15); } }
  /* the floor's pass (the arena's overlay: under everything standing): the tells, the lanes, the beam's stripe, the pools of
     lantern light, the dark and the far motes behind the ball */
  function ground(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m || !on()) return false; const F = K.fg(), Q = F.begin(c, null), C = FX.C, lf = K.lowFx(), e = eyeAt(FX, m, M, T), fast = FX.S.fast || 1;
    try {
      // the lure lanterns' light on the moss, and its own lanterns' rose pool under it
      for (const o of FX.S.objs) if (o.kind === 'lantern' && !o.dead) { const X = FX.sx(o.x), Y = FX.sy(o.y), fl = 0.8 + 0.12 * Math.sin(t * 21 + o.idx) + 0.08 * Math.sin(t * 6.3 + o.idx); Q.glow(X, Y + T * 0.1, T * 2.4, ROSE_HI, 0.2 * fl, 0.5); Q.glow(X, Y + T * 0.05, T * 0.9, '#FFE0EE', 0.18 * fl, 0.5); }
      if (!m.dead || M.gbEnd) { const lit = M.gbEnd ? Math.max(0, 4 - Math.floor(M.gbEnd.t / 0.18)) : (M.lit == null ? 4 : M.lit); if (lit > 0) Q.glow(FX.sx(m.x), FX.sy(m.y), T * (2.2 + lit * 0.5), ROSE_HI, 0.06 + lit * 0.035, 0.5); }
      // the tells and the lanes
      for (const s of FX.S.tele) { if (!s.gb || (s.done && !s.linger)) continue; const u = cl(s.age / s.t), pul = 0.5 + 0.5 * Math.sin(t * (6 + 10 * u));
        if (s.gb === 'veil' && !s.done) { const ch = chord(C, s.x, s.y, s.a, s.len); if (!ch) continue; const x0 = FX.sx(ch[0]), y0 = FX.sy(ch[1]), x1 = FX.sx(ch[2]), y1 = FX.sy(ch[3]), nx = -Math.sin(s.a) * s.w / 2 * T, ny = Math.cos(s.a) * s.w / 2 * T, hl = Math.hypot(ch[2] - ch[0], ch[3] - ch[1]) / 2;
          Q.rbeam(x0, y0, x1, y1, s.w * T * 0.5, GOLD, 0.05 + 0.1 * u, 0.6, 0.6);
          for (const sg of [-1, 1]) { Q.rbeam(x0 + nx * sg, y0 + ny * sg, x1 + nx * sg, y1 + ny * sg, T * 0.45, GOLD, (0.14 + 0.26 * u) * (0.75 + 0.25 * pul), 0.7, 0.7); Q.rbeam(x0 + nx * sg, y0 + ny * sg, x1 + nx * sg, y1 + ny * sg, T * 0.12, '#FFE9B0', 0.12 + 0.26 * u, 0.8, 0.8); }
          const f = (t * 0.55 + s.x * 0.1) % 1, rx = lerp(x0, x1, f), ry = lerp(y0, y1, f); Q.glow(rx, ry, T * 1.1, GOLD, 0.25 * u * Math.sin(Math.PI * f));
          Q.quad(176, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, nx, ny, GOLD, 0.25 + 0.45 * u, hl, s.x * 0.37 + s.y, s.a); }
        else if (s.gb === 'dive' && !s.done) { const x0 = FX.sx(s.x), y0 = FX.sy(s.y), x1 = FX.sx(s.x + Math.cos(s.a) * s.len), y1 = FX.sy(s.y + Math.sin(s.a) * s.len), nx = -Math.sin(s.a) * s.w / 2 * T, ny = Math.cos(s.a) * s.w / 2 * T;
          Q.rbeam(x0, y0, x1, y1, s.w * T * 0.5, ROSE_HI, 0.08 + 0.14 * u, 0.4, 0.8);
          for (const sg of [-1, 1]) { Q.rbeam(x0 + nx * sg * 0.8, y0 + ny * sg * 0.8, x1 + nx * sg * 0.8, y1 + ny * sg * 0.8, T * 0.4, ROSE_HI, 0.1 + 0.2 * u, 0.3, 1); Q.rbeam(x0 + nx * sg * 0.8, y0 + ny * sg * 0.8, x1 + nx * sg * 0.8, y1 + ny * sg * 0.8, T * 0.1, '#FFE9F4', 0.1 + 0.22 * u, 0.3, 1); }
          for (let i = 0; i < (lf ? 3 : 5); i++) { const f = (i / 5 + t * 0.6) % 1; vee(Q, lerp(x0, x1, f), lerp(y0, y1, f), s.a, T * 0.34, '#FFE9F4', (0.4 + 0.45 * u) * Math.sin(Math.PI * f), T * 0.09); }
          Q.glow(x1, y1, T * 1.4, ROSE_HI, 0.2 + 0.25 * u * pul); }
        else if (s.gb === 'beam') { const x0 = FX.sx(s.x), y0 = FX.sy(s.y), x1 = FX.sx(s.x + Math.cos(s.a) * s.len), y1 = FX.sy(s.y + Math.sin(s.a) * s.len), w = s.w * T;
          if (!s.done) { Q.rbeam(x0, y0, x1, y1, w * 0.35, MOON, 0.08 + 0.2 * u, 0.4, 1); Q.rbeam(x0, y0, x1, y1, T * 0.12, '#FFFFFF', 0.12 + 0.3 * u * pul, 0.5, 1);
            for (let i = 0; i < (lf ? 3 : 6); i++) { const f = (i / 6 + t * 0.4) % 1; Q.glow(lerp(x0, x1, f), lerp(y0, y1, f) - Math.sin(f * 9 + t * 3) * T * 0.15, T * 0.16, MOON, 0.5 * u * Math.sin(Math.PI * f)); } }
          else { const fl = 0.75 + 0.15 * Math.sin(t * 21) + 0.1 * Math.sin(t * 6.3 + 1); Q.rbeam(x0, y0, x1, y1, w * 1.1, MOON, 0.22 * fl, 0.6, 1); Q.rbeam(x0, y0, x1, y1, w * 0.5, MOON, 0.42 * fl, 0.8, 1); Q.rbeam(x0, y0, x1, y1, w * 0.16, '#FFFFFF', 0.7 * fl, 0.9, 1);
            if (!lf) for (let i = 0; i < 4; i++) { const f = 0.2 + i * 0.22; Q.caustic(lerp(x0, x1, f), lerp(y0, y1, f), w * 0.9, MOON, 0.18 * fl, i + s.a, 0.6); }
            Q.glow(x1, y1, T * 1.6, MOON, 0.45 * fl, 0.6); Q.ripple(x1, y1, T * (0.8 + ((t * 1.5) % 1) * 1.2), '#FFFFFF', 0.35 * (1 - (t * 1.5) % 1), s.a, 0.55, 0.12); } } }
      for (const z of FX.S.hz) { if (z.kind !== 'dust') continue; const ch = chord(C, z.x, z.y, z.a, z.len); if (!ch) continue; const fade = Math.min(1, z.age / 0.3, (z.life - z.age) / 0.5); if (!(fade > 0.01)) continue;
        const x0 = FX.sx(ch[0]), y0 = FX.sy(ch[1]), x1 = FX.sx(ch[2]), y1 = FX.sy(ch[3]), nx = -Math.sin(z.a) * z.w / 2 * T, ny = Math.cos(z.a) * z.w / 2 * T, hl = Math.hypot(ch[2] - ch[0], ch[3] - ch[1]) / 2;
        Q.rbeam(x0, y0, x1, y1, z.w * T * 0.55, GOLD, 0.22 * fade, 0.7, 0.7); Q.quad(176, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, nx, ny, GOLD, 0.95 * fade, hl, z.x * 0.37 + z.y, z.a);
        for (const sg of [-1, 1]) Q.rbeam(x0 + nx * sg * 0.85, y0 + ny * sg * 0.85, x1 + nx * sg * 0.85, y1 + ny * sg * 0.85, T * 0.16, '#FFF0C8', 0.3 * fade, 0.6, 0.6); }
      // the ball's dark and its far side: the halo, the smoke behind, the far motes
      if (!m.dead || M.gbEnd) { const E = M.gbEnd, fe = E ? 1 - cl(E.t / 2.6) : 1; Q.glow(e[0], e[1], e[2] * 2.6, MOTE_A, (0.18 + (M.menace || 0) * 0.12 + (M.roar || 0) * 0.35) * fe); smoke(Q, M, e, false, t); motes(Q, FX, M, e, false, t); }
    } finally { F.flush(c); }
    return true; }
  /* the upper pass (the fight's drawFx, over everything): the near motes and smoke, its lanterns' light, the Moonbeam's sheet
     and ray, the dive's streak, the storm's bursts, the grounded fall, the roar, the defeat's dissolve, the lures' light */
  function upper(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m || !on()) return false; const F = K.fg(), Q = F.begin(c, null), lf = K.lowFx(), e = eyeAt(FX, m, M, T), bt = M.bt || t, E = M.gbEnd, alive = !m.dead || E;
    try {
      for (const o of FX.S.objs) if (o.kind === 'lantern' && !o.dead) { const X = FX.sx(o.x), Y = FX.sy(o.y) - T * 1.25 + Math.sin(t * 2.3 + o.idx * 1.3) * T * 0.1, fl = 0.8 + 0.12 * Math.sin(t * 21 + o.idx) + 0.08 * Math.sin(t * 6.3 + o.idx); Q.glow(X, Y, T * 1.5, ROSE_HI, 0.32 * fl); Q.glow(X, Y, T * 0.5, '#FFF0F6', 0.4 * fl); }
      if (alive) {
        // its own lanterns: rose light round each lit one
        for (let k = 0; k < 4; k++) { const p = lanAt(k), lit = LAST && LAST.R.A['lanOn' + k]; if (!p || !lit) continue; const fk = (0.75 + 0.15 * Math.sin(t * 21 + k * 2) + 0.1 * Math.sin(t * 6.3 + 1 + k)) * (E ? 1 - cl(E.t / 0.8) : 1); Q.glow(p[0], p[1], T * 0.95, ROSE_HI, 0.5 * fk); Q.glow(p[0], p[1], T * 0.28, '#FFF0F6', 0.55 * fk); }
        // the Moonbeam: a sheet of moonlight from its belly to the floor stripe, a bright ray down its edge, a splash
        for (const s of FX.S.tele) { if (s.gb !== 'beam') continue; const x0 = FX.sx(s.x), y0 = FX.sy(s.y), x1 = FX.sx(s.x + Math.cos(s.a) * s.len), y1 = FX.sy(s.y + Math.sin(s.a) * s.len), ax = e[0], ay = e[1] + e[2] * 0.75;
          if (!s.done) { const u = cl(s.age / s.t); Q.glow(ax, ay, T * (0.5 + 1.0 * u), MOON, 0.25 + 0.45 * u); Q.glow(ax, ay, T * 0.25, '#FFFFFF', 0.4 * u); continue; }
          const fl = 0.75 + 0.15 * Math.sin(t * 21) + 0.1 * Math.sin(t * 6.3 + 1);
          Q.quad(177, (x1 + ax) / 2, (y1 + ay) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (ax - x0) / 2, (ay - y0) / 2, MOON, 0.55 * fl, 0, s.a * 3.1, lf ? 0.4 : 1);
          Q.rbeam(ax, ay, x1, y1, s.w * T * 0.45, MOON, 0.35 * fl, 1, 0.8); Q.rbeam(ax, ay, x1, y1, s.w * T * 0.12, '#FFFFFF', 0.6 * fl, 1, 0.9); Q.rbeam(ax, ay, x0, y0, s.w * T * 0.3, MOON, 0.18 * fl, 1, 0.5);
          Q.glow(ax, ay, T * 1.1, MOON, 0.5 * fl); Q.star(x1, y1 - T * 0.2, T * 0.9, 0.8 * fl, '#FFFFFF'); }
        // the dive: a streak of rose light behind the ball as it swoops, the lanterns' light drawn out after it
        const tr = M.gbTrail || (M.gbTrail = []); if (m.act === 'dive' && M.dv && m.actT >= M.dv.wait && !m.dead) { tr.unshift([m.x, m.y, M.alt || 0.7]); if (tr.length > 12) tr.pop(); } else if (tr.length) tr.pop();
        for (let i = 0; i + 1 < tr.length; i++) { const a = tr[i], b = tr[i + 1], k2 = 1 - i / tr.length, ax = FX.sx(a[0]), ay = FX.sy(a[1]) - (a[2] + 0.1) * T, bx = FX.sx(b[0]), by = FX.sy(b[1]) - (b[2] + 0.1) * T;
          Q.rbeam(ax, ay, bx, by, T * 2.2 * k2, ROSE_HI, 0.22 * k2, 1, 0.8); Q.rbeam(ax, ay, bx, by, T * 0.5 * k2, '#FFF0F6', 0.45 * k2, 1, 0.8); }
        // the storm: each ring of scales leaves with a burst of rose light and a wave
        const sr = M.gbRings || (M.gbRings = []); if (m.act === 'storm' && M.stN != null && M.gbStN !== M.stN) { if (M.gbStN != null && M.stN < M.gbStN) sr.push({ t0: bt, x: m.x, y: m.y, z: M.alt || 2.4 }); M.gbStN = M.stN; } if (m.act !== 'storm') M.gbStN = null;
        for (let i = sr.length - 1; i >= 0; i--) { const R2 = sr[i], u = (bt - R2.t0) / 0.7; if (u > 1 || u < 0) { sr.splice(i, 1); continue; } const X = FX.sx(R2.x), Y = FX.sy(R2.y) - (R2.z + 0.1) * T;
          Q.ewave(X, Y, T * (1.2 + u * 5), ROSE_HI, 0.8, 0.5 * (1 - u), i * 1.3, 0.75, 0.12); Q.glow(X, Y, T * 2.2 * (1 - u * 0.5), '#FFE9F4', 0.4 * (1 - u)); }
        if ((M.flare || 0) > 0.05 && m.act === 'storm') Q.glow(e[0], e[1], e[2] * 2.2, ROSE_HI, 0.18 * M.flare);
        // the near smoke and motes; a roar's flare; the grounded eye's gold
        smoke(Q, M, e, true, t); motes(Q, FX, M, e, true, t);
        const roar = M.roar || 0; if (roar > 0.02) { Q.glow(e[0], e[1], T * 4, MOTE_A, 0.35 * roar); Q.ewave(e[0], e[1], T * (1.5 + (1 - roar) * 4), MOTE_A, 0.7, 0.45 * roar, 2.2, 1, 0.14); }
        const g = M.ground || 0; if (g > 0.3 && !E) { Q.glow(e[0], e[1], T * 1.8, GOLD, 0.35 * g * (0.8 + 0.2 * Math.sin(t * 6))); for (let i = 0; i < 3; i++) { const a = bt * 3 + i * TAU / 3; Q.star(e[0] + Math.cos(a) * T * 1.6, e[1] - T * 1.6 + Math.sin(a) * T * 0.35, T * 0.35, 0.9, '#FFFFFF'); } }
        if ((M.menace || 0) > 0.1 && !E) Q.glow(e[0], e[1], e[2] * 0.9, '#FFB040', 0.15 * M.menace);
        // the fall: the eye's light goes out in a flare, the wings break into glitter, the dark thins away
        if (E) { const u = E.t, w0 = LAST ? LAST.V : null; Q.glow(e[0], e[1], T * 3.5, MOTE_A, 0.5 * Math.max(0, 1 - u * 1.4)); if (u < 0.8) Q.ewave(e[0], e[1], T * (1 + u * 7), '#FFE9F4', 0.7, 0.5 * (1 - u / 0.8), 4.4, 1, 0.1);
          const fu = cl((u - 1.7) / 1.3); if (fu > 0 && fu < 1 && w0) { const n = lf ? 18 : 40; for (let i = 0; i < n; i++) { const h = hash(i * 3.7 + 1), sd = i % 2 ? 1 : -1, sp = 1.4 + h * 3.4, a2 = (h - 0.5) * 2.6, rise = fu * (1.2 + hash(i + 9) * 2.2);
            const p = w0.toS([Math.cos(a2) * sp * 0.6, sd * (1 + sp), (E.zEnd || 0.8) + rise]); Q.star(p[0], p[1], T * (0.18 + 0.2 * h), (1 - fu) * (0.6 + 0.4 * Math.sin(u * 12 + i)), i % 3 ? CREAM : '#E8C8FF'); } } }
      }
    } finally { F.flush(c); }
    return true; }
  /* a lure lantern on the floor (a lantern on a floating seed-pod), from its kept picture */
  function lure(c, FX, o, X, Y, T, t) { if (!on()) return false; const cracked = 1 - o.hp / o.maxhp > 0.3, r = lurePic(c, T, true, cracked); if (!r) return false;
    const P = r.P, f = r.f, sw = Math.sin(t * 1.8 + o.idx) * 0.1, bob = Math.sin(t * 2.3 + o.idx * 1.3) * T * 0.1;
    c.save(); c.fillStyle = 'rgba(10,6,4,.3)'; c.beginPath(); c.ellipse(X, Y + T * 0.1, T * 0.45, T * 0.18, 0, 0, TAU); c.fill();
    c.translate(X, Y - T * 0.25 + bob); c.rotate(sw); c.drawImage(P.cv, 0, 0, P.cv.width, P.cv.height, P.bx0 * f, P.by0 * f - T * 0.0, P.bw * f, P.bh * f); c.restore(); return true; }
  /* a scale of the Scale Storm (an enemy shot painting itself on the dungeon's GPU pass): a pearl scale tumbling as it flies */
  function scalePaint(Q, X, Y, r, T, b) { const a = Math.atan2(b.vy, b.vx), s = T * 0.42, ca = Math.cos(a), sa = Math.sin(a), sd = (b.x * 7.3 + b.y * 3.1) % 6.28;
    Q.glow(X, Y, s * 2.4, ROSE_HI, 0.35); Q.quad(178, X, Y, ca * s, sa * s, -sa * s * 0.8, ca * s * 0.8, '#FFE9F4', 1, (b.t || 0) * 9 + sd, sd, 0); Q.glow(X, Y, s * 0.4, '#FFFFFF', 0.5); return true; }
  /* the fight's end on the GPU: it falls where it was, the corpse kept on the floor (a prop) while it dissolves */
  function fall(FX, m) { const M = FX.mem; if (!M || M.gbEnd || !on()) return false; M.gbEnd = { t: 0, z0: (M.alt == null ? 2.4 : M.alt) + 0.1, hd: M.hd == null ? Math.PI / 2 : M.hd, zEnd: 0.8 }; M.gbCorpse = { kind: 'gbcorpse', x: m.x, y: m.y + 0.05 }; FX.S.props.push(M.gbCorpse); return true; }
  function fallTick(FX, m, dt) { const M = FX.mem, E = M && M.gbEnd; if (!E) return; E.t += dt; if (E.t > 3.4 && M.gbCorpse) { const i = FX.S.props.indexOf(M.gbCorpse); if (i >= 0) FX.S.props.splice(i, 1); M.gbCorpse = null; } }
  /* (tests) a studio turnaround: the model alone at four headings and in its key poses */
  function studio() { const base = { z: 2.5, wph: 1.2, bt: 2, look: [0, 5], lid: 0.1, dil: 0.9, churn: 1, lit: 4, T: 24 }, mk = (name, o) => Object.assign({ name }, base, o);
    return [mk('facing south', { hd: Math.PI / 2 }), mk('heading east', { hd: 0, wph: 2.6 }), mk('heading north', { hd: -Math.PI / 2, wph: 0.2 }), mk('heading west', { hd: Math.PI, wph: 4.1 }),
      mk('banking, hard beat', { hd: 0.8, roll: 0.4, beat: 1, wph: 3.4, look: [4, 3] }), mk('flared for the storm', { hd: Math.PI / 2, flare: 1, menace: 1, dil: 0.12, lid: 0.24, churn: 2.6 }), mk('folded for the dive', { hd: Math.PI / 2 + 0.4, fold: 1, pitch: -0.5, menace: 0.6, dil: 0.3 }),
      mk('a blink', { hd: Math.PI / 2, lid: 1 }), mk('roaring', { hd: Math.PI / 2, roar: 1, flare: 1, dil: 0.07, lid: 0, rb: RB * 1.14 }), mk('struck', { hd: Math.PI / 2, sq: [1.12, 1.12, 0.84], lid: 0.6, pitch: 0.1 }), mk('grounded, the eye bared', { hd: Math.PI / 2, z: 0.25, ground: 1, lid: 0.42, dil: 1.2, lit: 0, look: [3, 2] }),
      mk('falling (defeat)', { hd: 2.2, z: 1.2, ground: 0.5, dead: 0.8, lid: 0.3, dil: 1.3, lit: 1, roll: 0.25 })]; }
  function studioDraw(c, ps, o) { return !!draw(c, { x: 0, y: 0 }, ps, o); }
  return { draw, rig, lurePic, toScreen, get last() { return LAST; }, G: AMB, RB, VOFF, release() { LAST = null; }, on, poseOf, paint, ground, upper, lure, scalePaint, fall, fallTick, studio, studioDraw,
    __dbg: { get gl() { return AMB.on(); }, set noGL(v) { AMB.NOGL = !!v; }, get MESH() { return AMB.MESH; }, get stats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +AMB.ms.toFixed(2), frames: AMB.n, box: AMB.box, meshMs: +AMB.meshMs.toFixed(1), meshTris: AMB.tris, pics: K.picN }); } } };
})();
GB_KIT.onRelease(() => AMBREL_GL.release());
