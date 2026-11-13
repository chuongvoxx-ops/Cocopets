/* ---------- the Sports Car on the GPU (worker M, 2026-11-13): the car as real 3D meshes, drawn by GLM in one pass ----------
   The same design as the core's baked car (20k4p): its shape (the body's own height field: the long bonnet with its dome
   and heart emblem, the rounded cockpit with a gold lip, the fairing behind the seat, pronounced wheel arches, the
   skirts), its palette (candy pink with a pearl flip, pearl, gold) and its parts: the cockpit (a deep plum floor, the
   channel-stitched pearl-pink seat, the heart headrest, the dash, the door trim), the swept windscreen in a gold frame,
   the rear spoiler (a winged airfoil on gold struts between pearl end plates), heart headlights and taillights, the heart
   grille, pearl hearts on the doors, the gold pin-stripe, the glowing sill strip, pearl sills, racing stripes, twin
   exhaust tips, four wheels (tyres, gold rims, star hubs) and the gold steering wheel, turned by `steer`.
   Placed and posed by the core's own car state (x, y, z, a + slide, susp, lean, sq, steer, spinA, droop, glow,
   S.lights, vis, the body alpha); the summon's ghost and the exit's glow are `ghost` and `glowK`; the drift's smear is
   `smear`. The core calls draw() from drawCar (a small hook, see docs/LIGHT-CAR-BRIEF.md); the 2D sprites stay its
   fallback. Materials: GLM ids 58-66 (the car's), 51 (gold), 15 (tyre rubber). One GLM pass of 8 items. */
const CAR_GL = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.695, VZ = 0.719;
  /* the core's shape (20k4p), x forward, y to the car's left, z up (tiles) */
  const HL = 1.62, HWB = 0.78, ZB = 0.17, AXF = 0.98, AXR = -0.98, WY = 0.63, WR = 0.285, WZ = 0.285, TWH = 0.1, ARCH = 0.37;
  const SEAT = { x: -0.34, y: 0, z: 0.45 }, CKX = -0.3, CKL = 0.56, CKW = 0.5, CKR = 0.18, GLX0 = 0.08, GLX1 = 0.27;
  function hwAt(x) { let w = HWB; if (x > 1.0) { const u = (x - 1.0) / 0.62; w -= 0.27 * u * u; } if (x < -1.2) { const u = (-1.2 - x) / 0.42; w -= 0.1 * u * u; }
    for (const ax of [AXF, AXR]) { const d = (x - ax) / 0.52; if (Math.abs(d) < 1) w += 0.04 * (1 - d * d) * (1 - d * d); } return w; }
  function centre(x) { if (x > 1.0) { const u = (x - 1.0) / 0.62; return 0.57 - 0.2 * Math.pow(u, 1.5); } if (x > 0.3) return 0.57 + 0.06 * (1 - (x - 0.3) / 0.7); if (x > -0.9) return 0.63 - 0.01 * (0.3 - x); const u = (-0.9 - x) / 0.72; return 0.62 - 0.11 * u * u; }
  const heartF = (u, v) => { const a = u * u + v * v - 1; return a * a * a - u * u * v * v * v; }, inHeart = (u, v) => heartF(u * 1.05, v * 1.05 + 0.1) < 0;
  function sdRR(px, py, hx, hy, r) { const qx = Math.abs(px) - hx + r, qy = Math.abs(py) - hy + r; return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r; }
  const C_PAINT = 0, C_PEARL = 1, C_GOLD = 2, C_FLOOR = 3, C_SEAT = 4, C_DASH = 5, C_HEAD = 6, C_EMB = 7;
  function bodyAt(x, y) {   // (the core's bodyAt, unchanged)
    const ay = Math.abs(y), w = hwAt(x); if (ay >= w) return null;
    const t = ay / w, xf = HL - 0.3 * t * t * t, xr = -HL + 0.07 * t * t * t * t; if (x >= xf || x <= xr) return null;
    let top = centre(x) * (1 - 0.035 * t * t), mat = C_PAINT;
    if (x > 0.3 && x < 1.3) top += 0.03 * Math.exp(-(y / 0.28) * (y / 0.28)) * Math.sin(Math.PI * (x - 0.3) / 1.0);
    if (x < -0.84 && x > -1.56 && ay < 0.34) { const pr = sstep(-1.56, -0.95, x); top += 0.12 * Math.pow(1 - (y / 0.34) * (y / 0.34), 1.5) * pr; }
    const s = Math.max(0, (t - 0.6) / 0.4); let k = Math.sqrt(Math.max(0, 1 - Math.pow(s, 2.4)));
    const dn = (xf - x) / 0.22, dtl = (x - xr) / 0.09; if (dn < 1) k *= Math.sqrt(Math.max(0, 1 - (1 - dn) * (1 - dn))); if (dtl < 1) k *= Math.sqrt(Math.max(0, 1 - (1 - dtl) * (1 - dtl)));
    let ht = ZB + (top - ZB) * Math.max(k, 0.3), hb = ZB;
    for (const ax of [AXF, AXR]) { const dx = x - ax, d = dx / 0.56;
      if (Math.abs(d) < 1 && t > 0.42) ht += 0.075 * (1 - d * d) * (1 - d * d) * sstep(0.42, 0.78, t) * Math.min(1, k * 3);
      if (Math.abs(dx) < ARCH && ay > WY - TWH - 0.05) { const az = WZ + Math.sqrt(ARCH * ARCH - dx * dx); hb = Math.max(hb, az); ht = Math.max(ht, az + 0.055); } }
    const dk = sdRR(x - CKX, y, CKL, CKW, CKR);
    if (dk < 0) { let z = 0.28; mat = C_FLOOR;
      if (x > -0.72 && x < -0.1 && ay < 0.4) { z = 0.42 + 0.025 * (1 - (y / 0.4) * (y / 0.4)); mat = C_SEAT; }
      if (x <= -0.7) { const u = cl((-0.7 - x) / 0.16); z = Math.max(z, 0.42 + 0.27 * Math.pow(u, 0.6)); mat = C_SEAT;
        if (ay < 0.31 && x < -0.73) { const lob = Math.max(Math.exp(-Math.pow((y - 0.12) / 0.11, 2)), Math.exp(-Math.pow((y + 0.12) / 0.11, 2))), zz = 0.66 + 0.15 * lob - 0.1 * (ay / 0.31) * (ay / 0.31); if (zz > z) { z = zz; mat = C_HEAD; } } }
      if (x > 0.06) { z = Math.max(z, 0.47 + 0.13 * sstep(0.06, 0.2, x)); mat = C_DASH; }
      if (dk > -0.07 && mat === C_FLOOR) { z = Math.max(z, 0.28 + 0.25 * sstep(-0.07, 0, dk)); mat = C_DASH; }
      return [Math.min(ht, z), hb, mat]; }
    if (dk < 0.045) { mat = C_GOLD; ht += 0.012; }
    else if ((x > 0.32 && x < 1.42 && ay > 0.065 && ay < 0.14) || (x < -0.95 && x > -1.5 && ay > 0.05 && ay < 0.11)) mat = C_PEARL;
    if (x > 0.96 && x < 1.26 && inHeart(y / 0.12, (x - 1.1) / 0.12)) { ht += 0.022; mat = inHeart(y / 0.085, (x - 1.105) / 0.085) ? C_EMB : C_GOLD; }
    if (ht <= hb + 0.004) return null;
    return [ht, hb, mat];
  }
  const GMAT = [58, 59, 51, 60, 61, 62, 63, 64];   // (the core's materials -> GLM's ids)

  /* ================= meshes ================= */
  let MESH = null, MESH_MS = 0;
  function buildMeshes() {
    const q = lowFx() ? 0.7 : 1, M = {};
    // ---- the body: a height field over the car's outline (rows along x, columns across its own width at each x), each cell its own material, the outline walls down to the skirt
    { const NXR = Math.round(170 * q), NSC = Math.round(64 * q), wEff = x => hwAt(x) * Math.min(1, Math.cbrt(Math.max(0, (HL - x) / 0.3)), Math.pow(Math.max(0, (x + HL) / 0.07), 0.25)) * 0.997;
      const xs = i => lerp(-HL + 0.004, HL - 0.004, i / NXR), P = [], Z = [], MT = [], HB = [];
      for (let i = 0; i <= NXR; i++) { const x = xs(i), w = wEff(x); for (let j = 0; j <= NSC; j++) { const y = lerp(-w, w, j / NSC), b = bodyAt(x, y * 0.999); P.push([x, y]); Z.push(b ? b[0] : ZB); HB.push(b ? b[1] : ZB); MT.push(b ? b[2] : C_PAINT); } }
      const at = (i, j) => (Math.max(0, Math.min(NXR, i)) * (NSC + 1) + Math.max(0, Math.min(NSC, j)));
      const pos = [], nrm = [], att = [], idx = [];
      const vN = (i, j) => { const a = at(i + 1, j), b = at(i - 1, j), c = at(i, j + 1), d = at(i, j - 1), du = [P[a][0] - P[b][0], P[a][1] - P[b][1], Z[a] - Z[b]], dv = [P[c][0] - P[d][0], P[c][1] - P[d][1], Z[c] - Z[d]]; let n = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]]; if (n[2] < 0) n = n.map(v => -v); const l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / l, n[1] / l, n[2] / l]; };
      const put = (p, n, m, e) => { pos.push(p[0], p[1], p[2]); nrm.push(n[0], n[1], n[2]); att.push(m, e || 0, 1); return pos.length / 3 - 1; };
      for (let i = 0; i < NXR; i++) for (let j = 0; j < NSC; j++) { const cm = bodyAt((xs(i) + xs(i + 1)) / 2, (P[at(i, j)][1] + P[at(i + 1, j + 1)][1]) / 2 * 0.999), m = GMAT[cm ? cm[2] : C_PAINT], q4 = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => put([P[at(a, b)][0], P[at(a, b)][1], Z[at(a, b)]], vN(a, b), m));
        idx.push(q4[0], q4[1], q4[2], q4[0], q4[2], q4[3]); }
      // the walls round the outline: from the top's edge down to the body's underside there (the skirt, the arches)
      for (const j of [0, NSC]) { const sg = j ? 1 : -1; for (let i = 0; i < NXR; i++) { const a = at(i, j), b = at(i + 1, j), ex = P[b][0] - P[a][0], ey = P[b][1] - P[a][1], el = Math.hypot(ex, ey) || 1, n = [ey / el * -sg, -ex / el * -sg, 0];
        const nn = n[1] * sg < 0 ? n.map(v => -v) : n;
        const v0 = put([P[a][0], P[a][1], Z[a]], nn, 58, 0), v1 = put([P[b][0], P[b][1], Z[b]], nn, 58, 0), v2 = put([P[b][0], P[b][1], HB[b]], nn, 58, 0), v3 = put([P[a][0], P[a][1], HB[a]], nn, 58, 0); idx.push(v0, v1, v2, v0, v2, v3); } }
      // the underside (seen at the wheel arches and in a jump): a flat dark plate
      { const n = [0, 0, -1]; for (let i = 0; i < NXR; i++) { const a = at(i, 0), b = at(i + 1, 0), c = at(i + 1, NSC), d = at(i, NSC), v0 = put([P[a][0], P[a][1], ZB], n, 60), v1 = put([P[b][0], P[b][1], ZB], n, 60), v2 = put([P[c][0], P[c][1], ZB], n, 60), v3 = put([P[d][0], P[d][1], ZB], n, 60); idx.push(v0, v2, v1, v0, v3, v2); } }
      // the spoiler, the windscreen's gold frame, the exhaust tips (built with the GLM builder and appended)
      const B = GLM.builder(q);
      for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const u = -1 + i / 5; pts.push([-1.52 + 0.22 * u, 0.9 + 0.06 * Math.sqrt(Math.max(0, 1 - u * u))]); } pts.push([-1.3, 0.7], [-1.74, 0.7]);
        B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism(pts, Math.min(-s * 0.785, -s * 0.715), Math.max(-s * 0.785, -s * 0.715), 59, { b: 0.008 }); B.pop();
        B.box([-1.51, s * 0.34, 0.625], [0.05, 0.04, 0.225], 0.012, 51); }
      { const N = 14, prof = []; for (let i = 0; i <= N; i++) { const u = i / N, x = -1.7 + 0.34 * u, pr = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.7), lip = u < 0.12 ? 0.02 * (1 - u / 0.12) : 0; prof.push([x, 0.85 + 0.065 * pr + lip]); } for (let i = N; i >= 0; i--) { const x = -1.7 + 0.34 * i / N; prof.push([x, 0.83]); }
        B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism(prof, -0.715, 0.715, 58, { b: 0.006 }); B.pop();
        B.box([-1.37, 0, 0.855], [0.012, 0.715, 0.018], 0.006, 51); }
      // the windscreen's gold frame: the top rail and the two side posts
      { const top = []; for (let i = 0; i <= 12; i++) { const y = lerp(-0.58, 0.58, i / 12); top.push([GLX0 + 0.004, y, 0.95 - 0.17 * (y / 0.6) * (y / 0.6) + 0.005]); } for (let i = 0; i < 12; i++) B.tube(top[i], top[i + 1], 0.016, 0.016, 51, { seg: 6, cap0: 'round', cap1: 'round' });
        for (const s of [-1, 1]) B.tube([GLX1, s * 0.585, 0.6], [GLX0 + 0.004, s * 0.585, 0.95 - 0.17 * 0.95 + 0.005], 0.018, 0.016, 51, { seg: 6 }); }
      for (const s of [-1, 1]) { B.tube([-1.5, s * 0.5, 0.25], [-1.66, s * 0.5, 0.25], 0.055, 0.055, 51, { seg: 12, cap0: false, cap1: false }); B.tube([-1.5, s * 0.5, 0.25], [-1.66, s * 0.5, 0.25], 0.035, 0.035, 60, { seg: 10, cap0: 'flat', cap1: false }); }
      const X = B.done(), base = pos.length / 3; for (let i = 0; i < X.nv * 3; i++) { pos.push(X.pos[i]); nrm.push(X.nrm[i]); att.push(X.att[i]); } for (const v of X.idx) idx.push(v + base);
      const nv = pos.length / 3; M.body = { pos: new Float32Array(pos), nrm: new Float32Array(nrm), att: new Float32Array(att), idx: nv > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), nv, ntri: idx.length / 3, gl: null }; }
    // ---- the windscreen's pane (translucent, its own item)
    { const B = GLM.builder(q); B.surf((u, v) => { const y = lerp(-0.57, 0.57, u), ztop = 0.95 - 0.17 * (y / 0.6) * (y / 0.6), z = lerp(0.6, ztop, v), x = GLX1 - (z - 0.6) / 0.34 * (GLX1 - GLX0); return [x, y, z]; }, 12, 4, () => 66); M.glass = B.done(); }
    // ---- a wheel (its axle along y; the outer face toward +y): the tyre, a gold rim, a five-point star hub with a pearl heart
    { const B = GLM.builder(q); B.push([0, 1, 0], [-1, 0, 0], [0, 0, 1], [0, 0, 0]);
      B.lathe([[-TWH, 0.17], [-TWH, 0.25], [-TWH * 0.85, WR - 0.006], [-TWH * 0.6, WR], [TWH * 0.6, WR], [TWH * 0.85, WR - 0.006], [TWH, 0.25], [TWH, 0.17]], 15, { seg: 28 });
      B.lathe([[TWH, 0.17, 51], [TWH + 0.004, 0.16, 51], [TWH - 0.012, 0.13, 51], [TWH - 0.02, 0.05, 51], [-TWH + 0.02, 0.05, 51], [-TWH + 0.012, 0.15, 51], [-TWH, 0.17, 51]], 51, { seg: 28 });
      B.pop();
      { const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + Math.PI / 2, r = i & 1 ? 0.055 : 0.13; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism(pts, -TWH + 0.0, -TWH + 0.035, 51, { b: 0.006 }); B.pop(); }
      B.sph([0, TWH - 0.03, 0], 0.04, 59, 10);
      M.wheel = B.done(); }
    // ---- the steering wheel (its column along its own -z, the rim in its x-y plane): a gold rim, three spokes, a pearl heart boss
    { const B = GLM.builder(q); B.tor([0, 0, 0], 0.13, 0.02, 51, { seg: 26, rseg: 7 }); for (const a of [Math.PI / 2, Math.PI / 2 + 2.1, Math.PI / 2 - 2.1]) B.tube([0, 0, 0], [Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0], 0.012, 0.012, 51, { seg: 6 });
      B.ell([0, 0, 0.004], [0.04, 0.04, 0.018], 64, { seg: 12, rings: 6 }); B.tube([0, 0, 0], [0, 0, -0.16], 0.016, 0.02, 51, { seg: 8 });
      M.steer = B.done(); }
    return M;
  }

  /* ================= the pass ================= */
  const nrm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const LW = nrm3([-0.5, 0.3, 0.82]), SBW = nrm3([-0.2, -0.38, 0.9]), RIMW = nrm3([0.55, -0.72, 0.42]), UPW = [0, 0, 1], CW = [0, VY, VZ], PXW = [1, 0, 0], PYW = [0, GY, -ZK];
  const RIMC = [1.0, 0.8, 1.15], AMBC = [1.1, 1.0, 1.06], OUTC = [0.16, 0.02, 0.1], GLCAP = 1400;
  let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0, LASTN = 0, LASTTRI = 0, LASTCALLS = 0; const GLI = [], GLJ = [];
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  function on() {
    if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__CAR_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Car: meshes', e); return false; } }
    return true;
  }
  /* rotations (the car frame: x forward, y left, z up) */
  const rz = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };
  const rx = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]; };
  const ry = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]; };
  /* the car's local -> world frame for heading ag (radians on the ground), lean (roll), squash */
  function frame(ag, lean, sq) { const sx = 1 + sq * 0.07, sz = 1 - sq * 0.13; return v => rz(rx([v[0] * sx, v[1] * sx, v[2] * sz], lean), ag); }
  /* draw the car of state S (S.car, S.H, S.lights) at tile size T. o: { body (alpha), ghost (the summon's ghost 0..1), glowK (the exit's glow 0..1), smear ([{ a, dx, dy, al }]: drift ghosts), groundA (the core's heading map) }.
     Returns false when nothing was drawn (the caller then draws its 2D picture) */
  function draw(c, S, T, o) {
    o = o || {}; const car = S.car, body = o.body == null ? 1 : o.body, ghost = o.ghost || 0, al0 = Math.max(body, ghost * 0.35); if (!(al0 > 0.004)) return true;
    const gA = o.groundA || (a => a), ab = car.a + (car.slide || 0), ag = gA(ab), lift = (car.z || 0) - (car.susp || 0) * 0.04, F = frame(ag, car.lean || 0, car.sq || 0);
    const X0 = S.H.sx(car.x), Y0 = S.H.sy(car.y), k = T, lt = cl((S.lights || 0)), t = (S.g && S.g.t != null) ? S.g.t : nowMs() / 1000;
    const items = [], push = (mesh, org, A, al, kind, glow2, noOut) => items.push({ mesh, org, A, al, kind, glow2, noOut });
    const col = (Fr) => [Fr([1, 0, 0]), Fr([0, 1, 0]), Fr([0, 0, 1])];
    const addCar = (Fr, dx, dy, al, full) => { const C = col(Fr), o0 = [dx || 0, dy || 0, lift]; push(MESH.body, o0, C, al, 0, lt, !full);
      if (!full) return;
      push(MESH.glass, o0, C, al * 0.999, 0, 0, true);
      // the wheels: the front ones steered; each turning about its axle; the right side's mesh turned to face out
      for (const [wx, wy, st] of [[AXF, WY, car.steer || 0], [AXF, -WY, car.steer || 0], [AXR, WY, 0], [AXR, -WY, 0]]) { const flip = wy < 0 ? Math.PI : 0, spin = (car.spinA || 0) * (wy < 0 ? -1 : 1), W = v => Fr(rz(ry(v, spin), st + flip)), cW = Fr([wx, wy, WZ - (car.droop || 0) * 0.07]);
        push(MESH.wheel, [o0[0] + cW[0], o0[1] + cW[1], o0[2] + cW[2]], col(W), al, 0, 0); }
      // the steering wheel at the dash, its face toward the seat, turned with the front wheels
      { const tilt = 1.1, S2 = v => Fr(rz(ry(rz(v, -(car.steer || 0) * 2.6), -tilt), 0)), cS = Fr([0.02, 0, 0.6]); push(MESH.steer, [o0[0] + cS[0], o0[1] + cS[1], o0[2] + cS[2]], col(v => S2(v)), al, 0, 0); } };
    addCar(F, 0, 0, al0, true);
    if (o.smear) for (const g of o.smear) addCar(frame(gA(g.a), car.lean || 0, 0), g.dx || 0, g.dy || 0, g.al, false);
    // the screen box (the car's corners at its heading, plus the smear's)
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; const sc = (w, ox, oy) => { const x = X0 + (w[0] + ox) * k, y = Y0 + ((w[1] + oy) * GY - (w[2] + lift) * ZK) * k; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; };
    const corners = []; for (const x of [-1.8, 1.7]) for (const y of [-0.9, 0.9]) for (const z of [0, 1.05]) corners.push([x, y, z]);
    for (const p of corners) sc(F(p), 0, 0); if (o.smear) for (const g of o.smear) { const Fg = frame(gA(g.a), 0, 0); for (const p of corners) sc(Fg(p), g.dx || 0, g.dy || 0); }
    bx0 -= 4; by0 -= 4; bx1 += 4; by1 += 4; if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__CAR_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.4 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const Sv = { px: PXW, py: PYW, pd: CW, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: CW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t, outline: Math.max(1, 1.2 * (W / bw)), outlineCol: OUTC };
    let n = 0; const L2 = GLJ; L2.length = 0;
    for (const it of items) { if (!(it.al > 0.004)) continue; const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      for (let i = 0; i < 3; i++) { g.R0[i] = it.A[0][i]; g.R1[i] = it.A[1][i]; g.R2[i] = it.A[2][i]; g.T[i] = it.org[i]; }
      g.mesh = it.mesh; g.alpha = it.mesh === MESH.glass ? Math.min(0.99, it.al) : it.al; g.glow = cl(car.glow || 0); g.glow2 = it.glow2; g.spill = 0; g.kind = it.kind; g.wear = 0.3; g.fx = 0; g.outline = it.noOut || it.mesh === MESH.glass ? false : undefined; g.d = it.org[1] * VY + it.org[2] * VZ; L2.push(g); }
    L2.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t1 = nowMs(), cvs = GLM.render(W, H, Sv, L2); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t1) * 0.1; GLN++; LASTN = L2.length; const st0 = GLM.stats; LASTTRI = st0.tris; LASTCALLS = st0.calls;
    // the summon's ghost and the exit's glow: the picture again, added as light
    const gk = Math.max(ghost > 0 ? (1 - body) * 0.9 * ghost : 0, o.glowK || 0); if (gk > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, gk); c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
    // the pet in the seat (its own sprite, upright): the caller's hook
    if (o.pet) { const s = F([SEAT.x, SEAT.y, SEAT.z]); o.pet(c, X0 + s[0] * k, Y0 + (s[1] * GY - (s[2] + (car.z || 0) - (car.susp || 0) * 0.05) * ZK) * k); }
    return true;
  }
  /* the anchors (world: x, y on the map, z height), from the car's state: headL / headR, tailL / tailR, wheelFL / FR / RL / RR (centres), roof, exhaustL / exhaustR (the tips), seat */
  const ANCH = { headL: [1.4, 0.45, 0.42], headR: [1.4, -0.45, 0.42], tailL: [-1.62, 0.42, 0.37], tailR: [-1.62, -0.42, 0.37], wheelFL: [AXF, WY, WZ], wheelFR: [AXF, -WY, WZ], wheelRL: [AXR, WY, WZ], wheelRR: [AXR, -WY, WZ], roof: [0.02, 0, 0.6], exhaustL: [-1.66, 0.5, 0.25], exhaustR: [-1.66, -0.5, 0.25], seat: [SEAT.x, SEAT.y, SEAT.z] };
  function anchor(car, name, groundA) { const p = ANCH[name]; if (!p) return null; const ag = (groundA || (a => a))(car.a + (car.slide || 0)), w = rz(p, ag), lift = (car.z || 0) - (name === 'seat' ? (car.susp || 0) * 0.05 : (car.susp || 0) * 0.04); return { x: car.x + w[0], y: car.y + w[1] * GY, z: p[2] + lift }; }
  const COUNTS = () => MESH ? { body: MESH.body.ntri, glass: MESH.glass.ntri, wheel: MESH.wheel.ntri, steer: MESH.steer.ntri, total: MESH.body.ntri + MESH.glass.ntri + 4 * MESH.wheel.ntri + MESH.steer.ntri, items: 7 } : null;
  return { on, draw, fail: glFail, anchor, ANCH, COUNTS, get stats() { return { ms: GLMS, n: GLN, items: LASTN, tris: LASTTRI, calls: LASTCALLS, meshMs: MESH_MS }; }, get NOGL() { return NOGL; }, __dbg: { get MESH() { return MESH; }, bodyAt } };
})();
