/* ---------- (v417 GH) a small kit shared by two of Earth's Strongs on the GPU: God's Hand (20k2nh) and Fault Line (20k2ni) ----------
   - the tuning tables (globalThis.EARTH_STRONG_TUNE[key]: timings, radii, damage, counts; edit them live to tune),
   - the tier of a cast (0 Base, levels 1-3; 1 Adept, levels 4-6; 2 Celestial, level 7),
   - whether the GPU picture can be drawn: the shared painter (FGFX, 20k6h: kinds 96..98 are this kit's, plus Earth's shared 82, 84, 85, 88..90)
     and the mesh renderer (GLM, 20k5uz: materials 160..166 are this kit's). Real-GPU WebGL only; a software rasteriser takes the 2D picture
     unless window.__NG_GL = 1 (the tests); window.__GH_GL = 0 turns the meshes off, 1 forces them,
   - posed rigid parts (a 3 x 3 matrix as its three columns) and one call that renders a list of mesh items with the game's projection (screen
     y = y 0.55 - z 0.835, the floor at z 0, nothing below it) at the screen's resolution and lays the image on the game canvas, a soft hole
     where the pet stands behind them.
   The moves own their state in their fx (20k1 DunElem): nothing here outlives a cast but the meshes and the GL context. */
const GH_KIT = (() => {
  const TAU = Math.PI * 2, SE = 0.55, CE = Math.sqrt(1 - SE * SE);
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const nrm = a => { const k = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / k, a[1] / k, a[2] / k]; };
  /* a small seeded random (each cast its own, so a frame drawn twice looks the same) */
  const rng = s => { s = (Math.abs(Math.floor(s)) % 2147483646) + 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
  /* the tuning: one table per move, made by the move's file; kept on globalThis so it can be edited live */
  const TUNE = (() => { try { const g = typeof globalThis !== 'undefined' ? globalThis : self; return (g.EARTH_STRONG_TUNE = g.EARTH_STRONG_TUNE || {}); } catch (e) { return {}; } })();
  const evoOf = C => Math.max(1, Math.min(7, Math.round((C && C.evo) || 1)));
  const tierOf = C => { const e = evoOf(C); return e >= 7 ? 2 : e >= 4 ? 1 : 0; };
  /* a monster a stagger or a jolt may move or hold fully: not a boss (bosses keep the game's own rule: a quarter of the stun, never displaced),
     not a fixed object (m.still), not a fiend's part */
  const susceptible = m => !!m && !m.boss && !m.still && !m.fobj;

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('GH GL: ' + String(e && e.message || e)); } catch (e2) { /* */ } };
  function glmOK() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__GH_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__GH_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  const fg = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  /* the painter when the whole GPU picture can be drawn (painter and meshes); null: the 2D picture */
  const gfx = () => { const F = fg(); return F && glmOK() ? F : null; };

  /* ================= posed parts: 3 x 3 matrices as [x column, y column, z column] (9 numbers, column-major) ================= */
  const M3 = {
    id: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    mul(A, B) { const o = new Array(9); for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) o[c * 3 + r] = A[r] * B[c * 3] + A[3 + r] * B[c * 3 + 1] + A[6 + r] * B[c * 3 + 2]; return o; },
    ap: (A, v) => [A[0] * v[0] + A[3] * v[1] + A[6] * v[2], A[1] * v[0] + A[4] * v[1] + A[7] * v[2], A[2] * v[0] + A[5] * v[1] + A[8] * v[2]],
    rx: a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, s, 0, -s, c]; },
    ry: a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; },
    rz: a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, -s, c, 0, 0, 0, 1]; },
    /* a turn by angle a about the unit axis k */
    axis(k, a) { const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = k; return [t * x * x + c, t * x * y + s * z, t * x * z - s * y, t * x * y - s * z, t * y * y + c, t * y * z + s * x, t * x * z + s * y, t * y * z - s * x, t * z * z + c]; },
    sc: (A, sx, sy, sz) => [A[0] * sx, A[1] * sx, A[2] * sx, A[3] * (sy == null ? sx : sy), A[4] * (sy == null ? sx : sy), A[5] * (sy == null ? sx : sy), A[6] * (sz == null ? sx : sz), A[7] * (sz == null ? sx : sz), A[8] * (sz == null ? sx : sz)],
  };
  /* one mesh from several built separately: each part keeps its own stretch of the indices (first, cnt), so it can be drawn on its own with its own pose */
  function merge(list) {
    let nv = 0, ni = 0; for (const m of list) { nv += m.nv; ni += m.idx.length; }
    const pos = new Float32Array(nv * 3), nrmA = new Float32Array(nv * 3), att = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), ranges = [];
    let ov = 0, oi = 0;
    for (const m of list) { pos.set(m.pos, ov * 3); nrmA.set(m.nrm, ov * 3); att.set(m.att, ov * 3); for (let i = 0; i < m.idx.length; i++) idx[oi + i] = m.idx[i] + ov;
      // the part's centre and its reach (for its screen box)
      let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; for (let i = 0; i < m.nv; i++) { const x = m.pos[i * 3], y = m.pos[i * 3 + 1], z = m.pos[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]; let rr = 0; for (let i = 0; i < m.nv; i++) rr = Math.max(rr, Math.hypot(m.pos[i * 3] - c[0], m.pos[i * 3 + 1] - c[1], m.pos[i * 3 + 2] - c[2]));
      ranges.push({ first: oi, cnt: m.idx.length, c, r: rr, lo: [x0, y0, z0], hi: [x1, y1, z1] }); ov += m.nv; oi += m.idx.length; }
    return { mesh: { pos, nrm: nrmA, att, idx, nv, ntri: ni / 3, gl: null }, ranges };
  }

  /* ================= rendering ================= */
  // the light: a warm key from the upper left and a little in front, a soft sky window, a cool-violet rim from the back right (the game's art)
  const LK = nrm([-0.55, 0.42, 0.75]), SBW = nrm([-0.5, -0.72, 0.55]), LR = nrm([0.62, -0.62, 0.48]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const OUTC = [0.045, 0.028, 0.02], RIM = [1.0, 0.72, 0.46], AMB = [1.04, 0.98, 0.9], GLCAP = 1600, STATS = { ms: 0, n: 0, W: 0, H: 0, items: 0, calls: 0 };
  let SCR = null;
  /* item: { mesh, R (9: part -> world, scaled), T (world, x tiles; y tiles / 0.55; z height), alpha, glow, glow2, spill, kind, wear, first, cnt, outline }
     o: { X0, Y0 (the screen point of world 0, 0, 0), k (px a world unit), bb [x0, y0, x1, y1] (screen px: what to render), alpha, pet [x, y, r] (a soft hole) }.
     Returns false when it cannot draw (the caller then draws its 2D picture). */
  const POOL = [], ITEMS = [];
  function render(c, list, o) {
    if (!glmOK()) return false;
    try {
      const m = c.getTransform(), vx0 = -m.e / (m.a || 1), vy0 = -m.f / (m.d || 1), vx1 = vx0 + c.canvas.width / (m.a || 1), vy1 = vy0 + c.canvas.height / (m.d || 1);
      ITEMS.length = 0;
      for (let i = 0; i < list.length; i++) { const q = list[i]; if (!(q.alpha > 0.004)) continue; const g = POOL[i] || (POOL[i] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) });
        g.mesh = q.mesh; for (let j = 0; j < 3; j++) { g.R0[j] = q.R[j]; g.R1[j] = q.R[3 + j]; g.R2[j] = q.R[6 + j]; g.T[j] = q.T[j]; }
        g.alpha = q.alpha; g.glow = q.glow || 0; g.glow2 = q.glow2 || 0; g.spill = q.spill || 0; g.kind = q.kind || 0; g.wear = q.wear || 0; g.fx = 0; g.first = q.first || 0; g.cnt = q.cnt || 0; g.outline = q.outline !== false; g.depth = q.T[1] * CE + q.T[2] * SE; ITEMS.push(g); }
      if (!ITEMS.length) return true;
      let bx0 = Math.max(Math.floor(o.bb[0]) - 2, Math.floor(vx0)), by0 = Math.max(Math.floor(o.bb[1]) - 2, Math.floor(vy0)), bx1 = Math.min(Math.ceil(o.bb[2]) + 2, Math.ceil(vx1)), by1 = Math.min(Math.ceil(o.bb[3]) + 2, Math.ceil(vy1));
      if (!(bx1 > bx0 + 1 && by1 > by0 + 1)) return true;
      // (opaque ones first, nearer first: the depth test spares the hidden ones' shading; see-through ones last)
      ITEMS.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || q.depth - p.depth);
      const soft = GLM.soft && !flag('__GH_GLHQ'), dev = Math.max(0.25, Math.hypot(m.a, m.b)) * (soft ? 0.5 : 1);
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
      const bw = bx1 - bx0, bh = by1 - by0, k = o.k, X0 = o.X0, Y0 = o.Y0;
      const S = { px: PXW, py: PYW, pd: PDW, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: PDW, lk: LK, ls: SBW, lr: LR, up: UPW, low: lowFx(), t: nowMs() / 1000 % 1000,
        outline: Math.max(0.7, 0.62 * (W / bw)), outlineCol: OUTC, outlineBias: 0.004, clip: o.clip === false ? null : [0, 0.00005], rim: RIM, amb: AMB };
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
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.W = W; STATS.H = H; STATS.items = ITEMS.length; try { STATS.calls = GLM.stats.calls; } catch (e) { /* */ }
      return true;
    } catch (e) { fail(e); return false; }
  }
  /* a mesh onto the GPU with one tiny render (no hitch on the first frame it shows) */
  function upload(mesh) { if (!mesh || !glmOK()) return; try { GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 },
    [{ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 0, first: 0, cnt: 3 }]); } catch (e) { fail(e); } }
  /* the world point (x tiles, y tiles / 0.55, z) of a floor point (tile x, y) and a height, relative to the screen anchor (X0, Y0) */
  const toW = (X, Y, X0, Y0, k, z) => [(X - X0) / k, (Y - Y0) / (SE * k), z || 0];
  /* (the meshes are built in idle time after load: plain arrays, no GPU) */
  const idle = fn => { try { const go = () => { try { fn(); } catch (e) { /* (built on first use instead) */ } }; if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 4000 }); else if (typeof setTimeout === 'function') setTimeout(go, 1300); } catch (e) { /* */ } };
  return { TAU, SE, CE, cl, lerp, sm, nrm, rng, TUNE, evoOf, tierOf, susceptible, glmOK, fg, gfx, M3, merge, render, upload, toW, idle, STATS, lowFx, nowMs, get off() { return NOGL; } };
})();
if (typeof self !== 'undefined') self.GH_KIT = GH_KIT;
