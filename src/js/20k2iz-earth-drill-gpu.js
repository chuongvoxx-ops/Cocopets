/* ---------- (v416 OD) the Obsidian Drill on the GPU: each drill a real 3D mesh on GLM ----------
   The drill of 20k2i (the same proportions: flights of outer radius 1, a core of 0.54 tapering above 2.3 to a point at 4.42,
   two starts of pitch 1.7) built once at load as GLM meshes, in two levels of detail (the main drill, and the smaller ones):
   a core (a lathed cone, its occlusion where the flights meet it), two helical flights of wedge segments - each a real blade
   swept along the helix with a thick root, a top and an underside that thin to a bevelled edge (an upper bevel, a band of
   gold crystal inlaid along the rim, a lower bevel), a raked leading end, a flat trailing end - with a faceted gold crystal
   joint in each gap between wedges (and, on the main drill, a crystal shard growing out of it), and a sharp faceted tip.
   Drawn by GLM (materials 150, 151: glossy black volcanic glass - a grey-violet lit flank, conchoidal facets that turn with
   it, a cool sky, a bright horizon strip and the floor's warm light in its reflections, a fresnel rim, sharp glints with a
   faint rainbow sheen, bright bevel edges; gold crystal - metallic, its own glints, a warm inner light, a light running
   along the rims), every drill of a cast in one render at the screen's full resolution with the game's own projection
   (screen y = y 0.55 - z 0.835), a thin ink outline, nothing below the floor; the image is laid on the game canvas once.
   Real-GPU WebGL only (a software rasteriser: window.__NG_GL = 1, as the tests set); window.__OD_GL = 0 turns it off.
   Memory: ~11k + ~5k vertices (~0.6 MB of buffers). */
const DRILL_GPU = (() => {
  const TAU = Math.PI * 2, SE = 0.55, CE = Math.sqrt(1 - SE * SE);
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  const nrm = a => { const k = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / k, a[1] / k, a[2] / k]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  /* ================= the model (units: the flights' outer radius is 1; z up the axis) ================= */
  const PITCH = 1.7, HT = 4.3, ZB = 2.3, Z0 = -0.75, ZT = HT - 0.32, ZC = 3.62;
  const rcAt = z => 0.54 * (z <= ZB ? 1 : Math.max(0, 1 - (z - ZB) / (HT + 0.12 - ZB)));
  const roAt = z => z <= ZB ? 1 : z >= HT ? 0 : rcAt(z) + 0.46 * Math.pow(1 - (z - ZB) / (HT - ZB), 1.15);
  const MT = { OBS: 150, CORE: 150.2, TIP: 150.4, GOLD: 151, JOINT: 151.3 };   // (a material's fraction stays under 0.5: GLM rounds the id)
  const P = (r, a, z) => [r * Math.cos(a), r * Math.sin(a), z];
  // the blade's section at helix parameter a (start s): its rows [r, height over the helix line, radial fraction]
  const geo = a => { const z = Z0 + PITCH * a / TAU, rc = rcAt(z), ro = roAt(z), sc = cl((ro - rc) / 0.46); return { z, rc, ro, sc, thi: 0.42 * (0.45 + 0.55 * sc), tho: 0.17 * (0.55 + 0.45 * sc), dr: 0.08 * sc, bev: 0.03 + 0.045 * sc }; };
  const rows = g => { const ri = g.rc * 0.9, rs = g.ro - g.bev, th = g.tho / 2, hr = g.tho * 0.4, mh = lerp(g.thi / 2, th, 0.62) + g.dr * 0.45;
    return [[ri, g.thi / 2, 0], [lerp(ri, rs, 0.5), mh - g.dr, 0.5], [rs, th - g.dr, 0.92], [g.ro, hr - g.dr, 1], [g.ro, -hr - g.dr, 1], [rs, -th - g.dr, 0.92], [lerp(ri, rs, 0.5), -mh - g.dr, 0.5], [ri, -g.thi / 2, 0]]; };
  // occlusion on the core where a flight meets it (both starts pass every half pitch)
  const coreAO = (ph, z) => { const w = ((z - Z0) * TAU / PITCH - ph) / Math.PI, d = Math.abs(w - Math.round(w)) * PITCH / 2, g = geo((z - Z0) / PITCH * TAU); return 0.32 + 0.68 * sm((d - g.thi * 0.5) / 0.32); };
  // a facet facing away from the point `inside`
  function facet(B, pts, inside, m) { let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0; const n = pts.length;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); cx += a[0] / n; cy += a[1] / n; cz += a[2] / n; }
    B.facet(nx * (cx - inside[0]) + ny * (cy - inside[1]) + nz * (cz - inside[2]) < 0 ? pts.slice().reverse() : pts, m); }
  // a strip swept along the helix: pos(u, v), its normals turned toward out(u, v)
  function strip(B, pos, nu, nv, m, e, a, out) { const du = [0, 0, 0], p0 = pos(0.5, 0.5), p1 = pos(0.5 + 0.5 / nu, 0.5), p2 = pos(0.5, Math.min(1, 0.5 + 0.5 / nv)), p3 = pos(0.5, Math.max(0, 0.5 - 0.5 / nv));
    for (let i = 0; i < 3; i++) du[i] = p1[i] - p0[i]; const dv = [p2[0] - p3[0], p2[1] - p3[1], p2[2] - p3[2]], n = cross(du, dv);
    B.surf(pos, nu, nv, m, { e, a, flip: dot(n, out(p0)) < 0 }); }
  function build(q) {
    const B = GLM.builder(1), thMax = (ZT - Z0) / PITCH * TAU, WS = 1.05, GS = 0.1, nu = Math.max(3, Math.round(12 * q));
    for (let s = 0; s < 2; s++) { let k = 0;
      for (let th = 0; th + WS <= thMax; th += WS + GS, k++) {
        const g1 = geo(th + WS), rake = 0.13 * (0.4 + 0.6 * g1.sc), sd = s * 50 + k * 7.31;
        // a point of the wedge: u along it (0 its trailing end), row j of its section; the leading end raked back at the rim
        const pt = (u, j) => { const a = th + u * WS, g = geo(a), R = rows(g)[j], A = a + s * Math.PI - rake * Math.pow(R[2], 1.4) * sm((u - 0.55) / 0.45) + 0.03 * R[2] * (1 - sm(u / 0.25)); return P(R[0], A, g.z + R[1]); };
        const span = (j0, j1) => (u, v) => pt(u, Math.round(lerp(j0, j1, v)));
        const outR = p => { const r = Math.hypot(p[0], p[1]) || 1; return [p[0] / r, p[1] / r, 0]; };
        const lenA = u => (th + u * WS) * 1.0;   // (the gold's length along the helix, for the light running along it)
        strip(B, span(0, 2), nu, 2, () => MT.OBS, (u, v) => (v > 0.99 ? 1 : 0), (u, v) => (v < 0.01 ? 0.45 : 1), () => [0, 0, 1]);                 // the top
        strip(B, span(2, 3), nu, 1, () => MT.GOLD, () => 1, u => lenA(u), p => { const o = outR(p); return [o[0], o[1], 0.8]; });                 // the upper bevel (v417 POL: gold too: a wider band of gold round the rim)
        strip(B, span(3, 4), nu, 1, () => MT.GOLD, () => 1, u => lenA(u), outR);                                                                   // the gold inlaid along the rim
        strip(B, span(4, 5), nu, 1, () => MT.GOLD, () => 1, u => lenA(u), p => { const o = outR(p); return [o[0], o[1], -0.8]; });                // the lower bevel (v417 POL: gold)
        strip(B, span(5, 7), nu, 2, () => MT.OBS, (u, v) => (v < 0.01 ? 1 : 0), (u, v) => (v > 0.99 ? 0.45 : 1), () => [0, 0, -1]);               // the underside
        // its ends: the trailing face, the raked leading face (facets: an edge light round their rims)
        const g0 = geo(th), inT = P(g0.rc * 0.5, th + s * Math.PI + 0.25, g0.z), inL = P(g1.rc * 0.5, th + WS + s * Math.PI - 0.35, g1.z);
        facet(B, [0, 1, 2, 3, 4, 5, 6, 7].map(j => pt(0, j)), inT, MT.OBS); facet(B, [0, 1, 2, 3, 4, 5, 6, 7].map(j => pt(1, j)), inL, MT.OBS);
        // the gold crystal joint in the gap before the next wedge: the blade's own section a little inset, in flat crystal facets, its middle
        // standing a touch proud of the ends
        if (th + WS + GS + WS <= thMax) { const a0 = th + WS - 0.03, a1 = th + WS + GS + 0.03, am = (a0 + a1) / 2;
          const sec = (a, k2) => { const g = geo(a), A = a + s * Math.PI, R = rows(g); return [0, 1, 2, 3, 4, 5, 6, 7].map(j => { const r = j === 3 || j === 4 ? g.ro - g.bev * (1.4 - k2) : R[j][0]; return P(g.rc + (r - g.rc) * (0.9 + 0.08 * k2), A, g.z + (R[j][1] + g.dr) * (0.84 + 0.1 * k2) - g.dr); }); };
          const S0 = sec(a0, 0), S1 = sec(am, 1), S2 = sec(a1, 0), gm = geo(am), ins = P(gm.rc * 0.5, am + s * Math.PI, gm.z);
          for (const [X, Y] of [[S0, S1], [S1, S2]]) for (let j = 0; j < 7; j++) facet(B, [X[j], X[j + 1], Y[j + 1], Y[j]], ins, MT.JOINT); }
      } }
    // the core: a lathed cone, its occlusion where the flights meet it; its top capped
    const cu = Math.max(14, Math.round(30 * q)), cv = Math.max(24, Math.round(58 * q)), zc0 = Z0 - 0.05;
    B.surf((u, v) => { const z = lerp(zc0, ZC, v), r = rcAt(z); return P(r, u * TAU, z); }, cu, cv, () => MT.CORE, () => 0, (u, v) => coreAO(u * TAU, lerp(zc0, ZC, v)));
    // the tip: a seven-sided faceted point, its base set round the core's top
    { const r0 = rcAt(ZC) / Math.cos(Math.PI / 7) * 1.04, AP = [0, 0, HT + 0.14], ring = [], mid = []; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.2; ring.push(P(r0, a, ZC - 0.02)); mid.push(P(r0 * (0.62 + 0.08 * R1(i * 3.3)), a + 0.22, ZC + 0.38 + 0.06 * R1(i * 1.7))); }
      const inside = [0, 0, ZC + 0.2]; for (let i = 0; i < 7; i++) { const j = (i + 1) % 7; facet(B, [ring[i], ring[j], mid[i]], inside, MT.TIP); facet(B, [ring[j], mid[j], mid[i]], inside, MT.TIP); facet(B, [mid[i], mid[j], AP], inside, MT.TIP); }
      facet(B, ring.slice(), [0, 0, ZC + 1], MT.TIP); }
    return B.done();
  }
  let MESH = null, MESH_LO = null, BUILT = false, UP = false;
  function ensure() { if (BUILT) return true; if (typeof GLM === 'undefined') return false; const t0 = nowMs(); MESH = build(1); MESH_LO = build(0.5); BUILT = true; STATS.buildMs = nowMs() - t0; STATS.nv = [MESH.nv, MESH_LO.nv]; STATS.ntri = [MESH.ntri, MESH_LO.ntri]; return true; }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Drill GL: ' + String(e && e.message || e)); } catch (e2) {} };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__OD_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__OD_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  // the meshes onto the GPU with one tiny render (no hitch on the first frame they show)
  function upload() { if (UP || !ensure() || !GLM.ok()) return; const it = mesh => ({ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 1 });
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, [it(MESH), it(MESH_LO)]); UP = true; }
  function warm() { try { if (!ensure()) return false; if (usable()) upload(); return true; } catch (e) { fail(e); return false; } }
  // (the meshes are built at load, in idle time: plain arrays, no GPU)
  try { const go = () => { try { ensure(); } catch (e) { /* (built on first use instead) */ } }; if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 4000 }); else if (typeof setTimeout === 'function') setTimeout(go, 1200); } catch (e) { /* */ }

  /* ================= drawing ================= */
  const LK = nrm([-0.55, 0.42, 0.75]), SBW = nrm([-0.5, -0.72, 0.55]), LR = nrm([0.62, -0.62, 0.48]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const OUTC = [0.03, 0.02, 0.025], GLCAP = 1600, STATS = { ms: 0, n: 0, W: 0, H: 0, items: 0, buildMs: 0, nv: null, ntri: null };
  const POOL = [], ITEMS = [];
  let SCR = null;
  /* draw the drills of a cast: list [{ X, Y (its foot on the screen), u (px a model unit), rot, dz (model units still sunk; < 0 lifted),
     sq (its squash across), glow (the gold's light 0..1), main }], o { k (px a world unit), alpha, pet [x, y, r] (a soft hole there) }.
     Returns false when it cannot draw (the caller then draws its 2D picture) */
  function draw(c, list, o) {
    if (!usable() || !ensure()) return false;
    try {
      if (!UP) upload();
      const m = c.getTransform(), a = m.a || 1, d = m.d || 1, vx0 = -m.e / a, vy0 = -m.f / d, vx1 = vx0 + c.canvas.width / a, vy1 = vy0 + c.canvas.height / d;
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; const k = o.k || 64; ITEMS.length = 0;
      let X0 = 0, Y0 = 0; for (const q of list) { X0 += q.X / list.length; Y0 += q.Y / list.length; }
      for (let i = 0; i < list.length; i++) { const q = list[i]; if (q.dz >= HT + 0.14) continue; const u = q.u, rx = 1.12 * u * (q.sq || 1);
        bx0 = Math.min(bx0, q.X - rx); bx1 = Math.max(bx1, q.X + rx); by0 = Math.min(by0, q.Y - (HT + 0.2 - q.dz) * CE * u - 0.08 * u); by1 = Math.max(by1, q.Y + SE * 1.12 * u);
        const g = POOL[i] || (POOL[i] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }), s = u / k, sq = q.sq || 1, co = Math.cos(q.rot), si = Math.sin(q.rot);
        g.mesh = q.main || u * (m.a || 1) > 150 ? MESH : MESH_LO; g.R0[0] = co * sq * s; g.R0[1] = si * sq * s; g.R0[2] = 0; g.R1[0] = -si * sq * s; g.R1[1] = co * sq * s; g.R1[2] = 0; g.R2[0] = 0; g.R2[1] = 0; g.R2[2] = s;
        g.T[0] = (q.X - X0) / k; g.T[1] = (q.Y - Y0) / (SE * k); g.T[2] = -q.dz * s; g.alpha = 1; g.glow = q.glow || 0; g.glow2 = 0; g.spill = 0; g.kind = 0; g.wear = s; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = true; ITEMS.push(g); }
      if (!ITEMS.length) return true;
      // (only what is on the screen)
      bx0 = Math.max(Math.floor(bx0) - 2, Math.floor(vx0)); by0 = Math.max(Math.floor(by0) - 2, Math.floor(vy0)); bx1 = Math.min(Math.ceil(bx1) + 2, Math.ceil(vx1)); by1 = Math.min(Math.ceil(by1) + 2, Math.ceil(vy1));
      if (!(bx1 > bx0 + 1 && by1 > by0 + 1)) return true;
      // (front to back: the nearer drills first, so the depth test spares the hidden ones' shading)
      ITEMS.sort((p, q) => q.T[1] - p.T[1]);
      const soft = GLM.soft && !flag('__OD_GLHQ'), dev = Math.max(0.25, Math.hypot(m.a, m.b)) * (soft ? 0.5 : 1);
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
      const bw = bx1 - bx0, bh = by1 - by0;
      const S = { px: PXW, py: PYW, pd: PDW, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: PDW, lk: LK, ls: SBW, lr: LR, up: UPW, low: lowFx(), t: nowMs() / 1000 % 1000,
        outline: Math.max(0.7, 0.65 * (W / bw)), outlineCol: OUTC, outlineBias: 0.004, clip: [0, 0.00005] };
      const t0 = nowMs(), cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return false;
      const al = o.alpha == null ? 1 : o.alpha, pet = o.pet;
      if (al > 0.004) {
        // a soft hole where the pet stands behind a drill (as the 2D picture dims it there)
        if (pet && pet[2] > 0 && pet[0] > bx0 - pet[2] && pet[0] < bx1 + pet[2] && pet[1] > by0 - pet[2] && pet[1] < by1 + pet[2] && typeof document !== 'undefined') {
          if (!SCR) SCR = document.createElement('canvas'); if (SCR.width !== W || SCR.height !== H) { SCR.width = W; SCR.height = H; } const g2 = SCR.getContext('2d');
          g2.globalCompositeOperation = 'copy'; g2.globalAlpha = 1; g2.drawImage(cvs, 0, 0, W, H, 0, 0, W, H); g2.globalCompositeOperation = 'destination-out';
          const px = (pet[0] - bx0) * W / bw, py = (pet[1] - by0) * H / bh, pr = pet[2] * W / bw, gr = g2.createRadialGradient(px, py, 0, px, py, pr); gr.addColorStop(0, 'rgba(0,0,0,0.62)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g2.fillStyle = gr; g2.fillRect(px - pr, py - pr, pr * 2, pr * 2); g2.globalCompositeOperation = 'source-over';
          c.save(); c.globalAlpha = Math.min(1, al); c.drawImage(SCR, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
        else { c.save(); c.globalAlpha = Math.min(1, al); c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); } }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.W = W; STATS.H = H; STATS.items = ITEMS.length;
      return true;
    } catch (e) { fail(e); return false; }
  }
  return { usable, warm, ensure, draw, STATS, roAt, rcAt, HT, ZB, PITCH, Z0, get meshes() { return [MESH, MESH_LO]; }, get off() { return NOGL; } };
})();
if (typeof self !== 'undefined') self.DRILL_GPU = DRILL_GPU;
