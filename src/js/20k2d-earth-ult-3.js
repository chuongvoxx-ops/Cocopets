/* ---------- Earth, reworked: Geode Arsenal ----------
   Rough stone geodes rise round the pet at staggered heights (3; 5 in a broad arc behind and beside it at Adept; 7 in
   two tiers at Celestial; levels between: 3, 3, 4, 5, 5, 6, 7), charcoal crusts lit by amber hairline cracks, dust
   trickling from them. Each splits into four thick shell sections that open on hinges low on its side, revealing a
   dazzling bed of honey-gold crystal points. A long faceted spear grows from each exposed core toward a monster; the
   geode leans back and its shell tightens round the spear's base, then the spear launches with a burst of golden
   mineral dust and a short recoil. Three volleys (the empty core regrows the next spear between them); the third's
   spears are thicker, with a brighter inner seam, and hit harder. Celestial: pale golden filaments join the cores
   before each volley. Then the shells close, the light inside fades and the geodes sink into small showers of dust.
   Each spear flies its own continuous path (steering a little after its monster) and strikes once: one Earth hit on
   the monster it reaches, a compact burst of golden shards and a spray of dark stone chips (decorative only). Each
   volley aims at the monsters in range at that moment (round-robin from the nearest); with none, the spears strike
   the floor ahead. Damage (DK = base x K x evoK): each spear d = TOT / (G x 3.6), volley three 1.6 d (stun 0.35,
   kb 4), so one monster taking every spear gets TOT = 14 / 16 / 20 x DK (Hatchling / Adept / Celestial).
   The models: each geode is a real 3D shell (a noisy sphere cut into four thick hinged sections over a fixed cup,
   inner faces crystal-lined, fracture walls between, a crystal bed of hexagonal points), lit per face with continuous
   shade, stone and crystal surface textures, ink and the amber cracks, rendered once per size and per opening step
   (10 steps) into cached sprites; the spears are faceted hexagonal crystals painted in 3D each frame (a handful of
   faces each). Light-only floor marks; near the pet the geodes dim smoothly; no per-frame gradients, no shadowBlur. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.celestialgeode;
  const TAU = Math.PI * 2, SE = Math.sin(0.62), CE = Math.cos(0.62);
  const AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', CORE = '#FFF4D6';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const axisR = (u, a) => { const [x, y, z] = nrm(u), c = Math.cos(a), s = Math.sin(a), C = 1 - c; return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; };
  const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
  // world (x right, y toward the camera on the floor, z up) to screen space (x right, y down, z toward the viewer)
  const w2s = p => [p[0], p[1] * SE - p[2] * CE, p[1] * CE + p[2] * SE];
  let H;
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorSpr(c, img, X, Y, r, a, add) { if (r < 1 || !(a > 0.01)) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  function floorGlow(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  function scr(c) { const m = c.getTransform(); return { k: m.a || 1 }; }
  const HT = (() => { const a = new Float32Array(4096); for (let i = 0; i < 4096; i++) a[i] = R1(i * 1.618 + 0.5); return a; })();
  const h3 = (i, j, k) => HT[((i * 73856093) ^ (j * 19349663) ^ (k * 83492791)) & 4095];
  function vn3(x, y, z) { const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = x - i, fy = y - j, fz = z - k, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const a = h3(i, j, k), b = h3(i + 1, j, k), c = h3(i, j + 1, k), d = h3(i + 1, j + 1, k), e = h3(i, j, k + 1), f = h3(i + 1, j, k + 1), g = h3(i, j + 1, k + 1), hh = h3(i + 1, j + 1, k + 1);
    const x1 = a + (b - a) * u, x2 = c + (d - c) * u, x3 = e + (f - e) * u, x4 = g + (hh - g) * u, y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v; return y1 + (y2 - y1) * w; }

  /* ---- cached soft sprites ---- */
  const radial = (key, S, stops) => fxSprite(key, S, S, g => { const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, S, S); });
  const bandSpr = () => radial('egaband', 256, [[0, 'rgba(217,138,30,0)'], [0.55, 'rgba(217,138,30,0)'], [0.78, 'rgba(217,138,30,0.22)'], [0.9, 'rgba(242,183,58,0.6)'], [0.955, 'rgba(255,233,184,0.7)'], [1, 'rgba(255,233,184,0)']]);
  const puffSpr = () => radial('egapuff', 96, [[0, 'rgba(168,136,98,0.42)'], [0.5, 'rgba(128,100,72,0.22)'], [1, 'rgba(92,65,38,0)']]);
  const gpuffSpr = () => radial('egagpuff', 96, [[0, 'rgba(255,214,120,0.5)'], [0.45, 'rgba(242,170,58,0.24)'], [1, 'rgba(217,138,30,0)']]);
  const shadowSpr = () => radial('egashad', 64, [[0, 'rgba(10,6,3,0.5)'], [0.55, 'rgba(10,6,3,0.22)'], [1, 'rgba(10,6,3,0)']]);
  const shardSpr = v => fxSprite('egash' + v, 32, 32, g => { const w = 4 + v * 1.5, L = 13; g.translate(16, 16); g.rotate(v * 0.7);
    const gr = g.createLinearGradient(-w, -L, w, L); gr.addColorStop(0, '#FFF4D6'); gr.addColorStop(0.4, '#FFCF5C'); gr.addColorStop(0.75, '#D98A1E'); gr.addColorStop(1, '#7A5218');
    g.beginPath(); g.moveTo(0, -L); g.lineTo(w, -2); g.lineTo(w * 0.6, L * 0.7); g.lineTo(0, L); g.lineTo(-w, 1); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(92,52,12,0.9)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -L + 2); g.lineTo(-w * 0.6, 0); g.stroke(); });
  const chipSpr = v => fxSprite('egachip' + v, 24, 24, g => { const pts = []; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + R1(v * 5 + i) * 0.8, r = 6 + R1(v + i * 2) * 5; pts.push([12 + Math.cos(a) * r, 12 + Math.sin(a) * r]); }
    const gr = g.createLinearGradient(4, 4, 20, 20); gr.addColorStop(0, '#7A6650'); gr.addColorStop(0.45, '#3A3028'); gr.addColorStop(1, '#1A140E'); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = '#110B06'; g.lineWidth = 1; g.stroke(); });
  const starSpr = () => fxSprite('egastar', 48, 48, g => { g.translate(24, 24); g.globalCompositeOperation = 'lighter'; for (const [w, a] of [[0.9, 0.9], [2.4, 0.3]]) { g.strokeStyle = `rgba(255,244,214,${a})`; g.lineWidth = w; g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.moveTo(0, -22); g.lineTo(0, 22); g.stroke(); } const gr = g.createRadialGradient(0, 0, 0, 0, 0, 10); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(1, 'rgba(255,207,92,0)'); g.fillStyle = gr; g.fillRect(-10, -10, 20, 20); });

  /* ================= the geode model ================= */
  const LS = nrm([-0.5, -0.66, 0.56]), HV = nrm([LS[0], LS[1], LS[2] + 1]);
  // materials: [ramp], texture, texture alpha; 0 crust, 1 crystal lining, 2 fracture wall, 3 crystal point
  const MATS = [
    { r: [[14, 10, 7], [30, 23, 17], [52, 41, 30], [92, 74, 54], [150, 126, 96]], tex: 'stone', ta: 0.75, amb: 0.06, jit: 0.22 },
    { r: [[96, 52, 10], [176, 98, 18], [226, 148, 34], [250, 196, 72], [255, 232, 160]], tex: 'crystal', ta: 0.3, amb: 0.4, emit: 1, jit: 0.3 },
    { r: [[34, 26, 18], [62, 48, 34], [98, 78, 56], [138, 112, 82], [170, 142, 106]], tex: 'stone', ta: 0.45, amb: 0.2 },
    { r: [[120, 66, 12], [210, 132, 26], [246, 186, 56], [255, 214, 110], [255, 240, 200]], tex: 'crystal', ta: 0.25, amb: 0.35, spec: 1 } ];
  const OPEN = 1.0, LH = -50 * Math.PI / 180, NB = 10;
  function makeModel(seed) {
    const rO = (la, lo) => { const p = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)]; return 1 + 0.22 * (vn3(p[0] * 2.2 + seed, p[1] * 2.2, p[2] * 2.2) - 0.5) + 0.1 * (vn3(p[0] * 6 + seed, p[1] * 6, p[2] * 6) - 0.5); };
    const P = (la, lo, r) => [r * Math.cos(la) * Math.cos(lo), r * Math.cos(la) * Math.sin(lo), r * Math.sin(la)];
    const mk = () => ({ v: [], f: [], m: [] });
    const face = (M, idx, hint, mat) => { const a = M.v[idx[0]], b = M.v[idx[1]], c = M.v[idx[2]]; let n = cross(sub(b, a), sub(c, a)); if (Math.hypot(...n) < 1e-9 && idx.length > 3) n = cross(sub(c, a), sub(M.v[idx[3]], a)); if (dot(n, hint) < 0) idx = idx.slice().reverse(); M.f.push(idx); M.m.push(mat); };
    const cen = (M, idx) => { const s = [0, 0, 0]; for (const i of idx) { s[0] += M.v[i][0]; s[1] += M.v[i][1]; s[2] += M.v[i][2]; } return s.map(x => x / idx.length); };
    const LATS = [LH, -0.42, 0.06, 0.6, 1.08], RI = 0.76, GAP = 0.045, secs = [];
    for (let k = 0; k < 4; k++) { const lc = Math.PI / 4 + k * Math.PI / 2, lons = []; for (let j = 0; j <= 4; j++) lons.push(lc - Math.PI / 4 + GAP + (Math.PI / 2 - 2 * GAP) * j / 4);
      const M = mk(), O = [], I = []; for (let i = 0; i < LATS.length; i++) { O.push([]); I.push([]); for (let j = 0; j <= 4; j++) { O[i].push(M.v.length); M.v.push(P(LATS[i], lons[j], rO(LATS[i], lons[j]))); I[i].push(M.v.length); M.v.push(P(LATS[i], lons[j], RI + 0.03 * (R1(seed + i * 7 + j + k * 31) - 0.5))); } }
      const pO = M.v.length; M.v.push([0, 0, rO(Math.PI / 2, 0)]); const pI = M.v.length; M.v.push([0, 0, RI]); const NL = LATS.length - 1;
      for (let i = 0; i < NL; i++) for (let j = 0; j < 4; j++) { const q = [O[i][j], O[i][j + 1], O[i + 1][j + 1], O[i + 1][j]]; face(M, q, cen(M, q), 0); const qi = [I[i][j], I[i][j + 1], I[i + 1][j + 1], I[i + 1][j]]; face(M, qi, cen(M, qi).map(x => -x), 1); }
      for (let j = 0; j < 4; j++) { const q = [O[NL][j], O[NL][j + 1], pO]; face(M, q, cen(M, q), 0); const qi = [I[NL][j], I[NL][j + 1], pI]; face(M, qi, cen(M, qi).map(x => -x), 1); }
      for (const [j, sg] of [[0, -1], [4, 1]]) { const lo = lons[j], hint = [-Math.sin(lo) * sg, Math.cos(lo) * sg, 0]; for (let i = 0; i < NL; i++) face(M, [O[i][j], O[i + 1][j], I[i + 1][j], I[i][j]], hint, 2); face(M, [O[NL][j], pO, pI, I[NL][j]], hint, 2); }
      for (let j = 0; j < 4; j++) { const lo = (lons[j] + lons[j + 1]) / 2; face(M, [O[0][j], O[0][j + 1], I[0][j + 1], I[0][j]], [Math.sin(LH) * Math.cos(lo), Math.sin(LH) * Math.sin(lo), -Math.cos(LH)], 2); }
      // the hinge: low on the section's side, along its longitude; the sign that swings its top outward
      const hp = P(LH, lc, 1), ax = [-Math.sin(lc), Math.cos(lc), 0], top = P(0.9, lc, 1), rot = s => { const R = axisR(ax, s * 0.5); const q = mv(R, sub(top, hp)); return Math.hypot(q[0] + hp[0], q[1] + hp[1]); };
      // the cracks on its crust: short random walks in (lat, lon), lit amber
      const cracks = []; for (let c2 = 0; c2 < 2; c2++) { let la = lerp(-0.3, 0.9, R1(seed + k * 9 + c2 * 3)), lo = lerp(lons[0] + 0.1, lons[4] - 0.1, R1(seed + k * 5 + c2 * 7)); const pts = []; for (let s = 0; s < 7; s++) { pts.push(P(la, lo, rO(la, lo) * 1.004)); la += (R1(seed + s * 3.1 + k + c2 * 11) - 0.45) * 0.24; lo += (R1(seed + s * 5.7 + k * 2 + c2) - 0.5) * 0.26; lo = Math.max(lons[0] + 0.03, Math.min(lons[4] - 0.03, lo)); la = Math.min(1.35, Math.max(LH + 0.05, la)); } cracks.push(pts); }
      secs.push({ M, hp, ax, sg: rot(1) > rot(-1) ? 1 : -1, cracks, seam: O.map(r => r[0]) }); }
    // the fixed cup under the hinges
    const cup = mk(); { const N = 16, lats = [LH, -1.1], rin = []; const Ro = [], Ri = []; for (let i = 0; i < 2; i++) { Ro.push([]); Ri.push([]); for (let j = 0; j < N; j++) { const lo = j / N * TAU; Ro[i].push(cup.v.length); cup.v.push(P(lats[i], lo, rO(lats[i], lo) * 0.99)); Ri[i].push(cup.v.length); cup.v.push(P(lats[i], lo, RI)); } }
      const bO = cup.v.length; cup.v.push([0, 0, -0.98]); const bI = cup.v.length; cup.v.push([0, 0, -RI]);
      for (let j = 0; j < N; j++) { const j2 = (j + 1) % N, q = [Ro[0][j], Ro[0][j2], Ro[1][j2], Ro[1][j]]; face(cup, q, cen(cup, q), 0); face(cup, [Ro[1][j], Ro[1][j2], bO], cen(cup, [Ro[1][j], Ro[1][j2], bO]), 0);
        const qi = [Ri[0][j], Ri[0][j2], Ri[1][j2], Ri[1][j]]; face(cup, qi, cen(cup, qi).map(x => -x), 1); face(cup, [Ri[1][j], Ri[1][j2], bI], [0, 0, 1], 1);
        face(cup, [Ro[0][j], Ro[0][j2], Ri[0][j2], Ri[0][j]], [0, 0, 1], 2); } }
    // the crystal bed: hexagonal points from a core low in the cup
    const bed = mk(), C0 = [0, 0, -0.22], tips = []; for (let i = 0; i < 17; i++) { let d; if (i === 0) d = [0, 0, 1]; else { const a = i * 2.39996 + seed, z = 0.3 + 0.65 * R1(seed + i * 3.3); d = [Math.cos(a) * Math.sqrt(1 - z * z), Math.sin(a) * Math.sqrt(1 - z * z), z]; }
      d = nrm(d); let L = (i === 0 ? 0.7 : 0.36 + 0.34 * R1(seed + i * 1.7)); const b0 = [C0[0] + d[0] * 0.1, C0[1] + d[1] * 0.1, C0[2] + d[2] * 0.1]; while (Math.hypot(b0[0] + d[0] * L, b0[1] + d[1] * L, b0[2] + d[2] * L) > 0.73) L *= 0.93;
      const w = 0.07 + 0.05 * R1(seed + i * 2.9), u = nrm(cross(d, Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), v = cross(d, u), base = bed.v.length;
      for (const [x, r] of [[0, w], [0.72, w * 0.92]]) for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + R1(seed + i) * 1.0; bed.v.push([b0[0] + d[0] * L * x + (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * r, b0[1] + d[1] * L * x + (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * r, b0[2] + d[2] * L * x + (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * r]); }
      const tp = bed.v.length; bed.v.push([b0[0] + d[0] * L, b0[1] + d[1] * L, b0[2] + d[2] * L]); tips.push(tp); const cc = [b0[0] + d[0] * L * 0.5, b0[1] + d[1] * L * 0.5, b0[2] + d[2] * L * 0.5];
      for (let j = 0; j < 6; j++) { const j2 = (j + 1) % 6, q = [base + j, base + j2, base + 6 + j2, base + 6 + j]; face(bed, q, sub(cen(bed, q), cc), 3); const t3 = [base + 6 + j, base + 6 + j2, tp]; face(bed, t3, sub(cen(bed, t3), cc), 3); } }
    return { secs, cup, bed, tips, C0 };
  }
  function edgesOf(M) { const E = new Map(); M.f.forEach((F, fi) => F.forEach((a, k) => { const b = F[(k + 1) % F.length], lo = Math.min(a, b), hi = Math.max(a, b), key = lo * 4096 + hi, e = E.get(key); if (e) e[3] = fi; else E.set(key, [lo, hi, fi, -1]); })); return [...E.values()]; }
  const ramp = (r, u) => { const b = cl(u) * 4, i = Math.min(3, Math.floor(b)), f = b - i, A = r[i], B = r[i + 1]; return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f]; };
  /* paint a list of parts { M, X (world-space transform fn), E } into g at scale s round (cx, cy) in screen space, faces sorted far to near */
  function paintParts(g, parts, s, cx, cy, o) {
    const all = [];
    for (const pt of parts) { const M = pt.M, W = M.v.map(p => pt.X ? pt.X(p) : p), S = W.map(p => { const q = w2s(p); return [cx + q[0] * s, cy + q[1] * s, q[2]]; }); pt.S = S; pt.W = W; pt.vis = new Array(M.f.length); if (!M.EF) { M.EF = new Map(); M.f.forEach((F, fi) => F.forEach((k, j) => { const k2 = F[(j + 1) % F.length], key = Math.min(k, k2) * 4096 + Math.max(k, k2), e = M.EF.get(key); if (e) e[1] = fi; else M.EF.set(key, [fi, -1]); })); } pt.EF = M.EF;
      M.f.forEach((F, i) => { const a = S[F[0]], b = S[F[1]], c = S[F[2]]; let n = cross([b[0] - a[0], b[1] - a[1], (b[2] - a[2]) * s], [c[0] - a[0], c[1] - a[1], (c[2] - a[2]) * s]); if (Math.hypot(...n) < 1e-9 && F.length > 3) { const d = S[F[3]]; n = cross([c[0] - a[0], c[1] - a[1], (c[2] - a[2]) * s], [d[0] - a[0], d[1] - a[1], (d[2] - a[2]) * s]); } n = nrm(n);
        const vis = n[2] > 0.005; pt.vis[i] = vis; if (!vis) return; let z = 0, wz = 0; for (const k of F) { z += S[k][2]; wz += W[k][2]; } all.push({ pt, F, fi: i, n, z: z / F.length, wz: wz / F.length, mat: M.m[i] }); }); }
    all.sort((a, b) => a.z - b.z);
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (const q of all) { const S = q.pt.S, F = q.F, n = q.n, mt = MATS[q.mat], ndl = Math.max(0, dot(n, LS)), path = () => { g.beginPath(); F.forEach((k, j) => j ? g.lineTo(S[k][0], S[k][1]) : g.moveTo(S[k][0], S[k][1])); g.closePath(); };
      // ambient occlusion: deep inside the shell is darker
      const ao = q.mat === 1 || q.mat === 2 ? 0.55 + 0.45 * cl((q.wz + 0.6) / 1.5) : 1;
      let col = ramp(mt.r, mt.amb + (1 - mt.amb) * (0.3 * sstep(0.05, 0.2, ndl) + 0.3 * sstep(0.35, 0.5, ndl) + 0.4 * ndl));
      if (mt.emit) col = [lerp(col[0], 255, 0.3 * o.glow), lerp(col[1], 196, 0.3 * o.glow), lerp(col[2], 90, 0.3 * o.glow)];
      const jt = mt.jit ? 1 + mt.jit * (R1(q.fi * 7.13 + q.pt.M.f.length) - 0.5) : 1; path(); g.fillStyle = `rgb(${Math.min(255, col[0] * ao * jt) | 0},${Math.min(255, col[1] * ao * jt) | 0},${Math.min(255, col[2] * ao * jt) | 0})`; g.fill();
      // the surface texture laid in the face's own frame (an affine fit)
      if (mt.tex) { const A = S[F[0]], P3 = F.map(k => [S[k][0], S[k][1], S[k][2] * s]), ex = nrm(sub(P3[1], P3[0])), ey = cross(n, ex), uv = p => { const d = sub(p, P3[0]); return [dot(d, ex), dot(d, ey)]; }, ub = uv(P3[1]), uc = uv(P3[2]), det = ub[0] * uc[1] - uc[0] * ub[1];
        if (Math.abs(det) > 1e-6) { const db = [P3[1][0] - A[0], P3[1][1] - A[1]], dc = [P3[2][0] - A[0], P3[2][1] - A[1]], i00 = uc[1] / det, i01 = -uc[0] / det, i10 = -ub[1] / det, i11 = ub[0] / det, J00 = db[0] * i00 + dc[0] * i10, J01 = db[0] * i01 + dc[0] * i11, J10 = db[1] * i00 + dc[1] * i10, J11 = db[1] * i01 + dc[1] * i11;
          const tl = GeoKit.tile(mt.tex), k = s * 0.9 / 256, ox = R1(F[0] * 0.37) * 256 * k, oy = R1(F[1] * 0.61) * 256 * k; if (tl.p.setTransform) { tl.p.setTransform(new DOMMatrix([J00 * k, J10 * k, J01 * k, J11 * k, A[0] + J00 * ox + J01 * oy, A[1] + J10 * ox + J11 * oy])); g.globalAlpha = mt.ta; g.fillStyle = tl.p; path(); g.fill(); g.globalAlpha = 1; } } }
      if (mt.spec) { const sp = Math.pow(Math.max(0, dot(n, HV)), 18); if (sp > 0.03) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = sp * 0.85; g.fillStyle = CORE; path(); g.fill(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } }
      if (mt.emit && o.glow > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.22 * o.glow * (0.5 + 0.5 * cl((q.wz + 0.7) / 1.4)); g.fillStyle = HONEY; path(); g.fill(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      // its edges, drawn with it (so nearer faces cover them): ink where the neighbour is turned away, fine lines elsewhere
      const EF = q.pt.EF, sil = new Path2D(), cre = new Path2D(); F.forEach((k, j) => { const k2 = F[(j + 1) % F.length], other = EF.get(Math.min(k, k2) * 4096 + Math.max(k, k2)), nb = other ? (other[0] === q.fi ? other[1] : other[0]) : -1, P2 = nb < 0 || !q.pt.vis[nb] ? sil : cre; P2.moveTo(S[k][0], S[k][1]); P2.lineTo(S[k2][0], S[k2][1]); });
      if (q.mat === 3) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,233,184,0.5)'; g.lineWidth = Math.max(0.6, s * 0.012); g.stroke(cre); g.globalCompositeOperation = 'source-over'; } else { g.strokeStyle = q.mat === 1 ? 'rgba(90,50,10,0.18)' : 'rgba(12,8,4,0.3)'; g.lineWidth = Math.max(0.6, s * 0.011); g.stroke(cre); }
      g.strokeStyle = 'rgba(14,9,5,0.92)'; g.lineWidth = Math.max(1, s * (q.pt.thin ? 0.016 : 0.028)); g.stroke(sil); }
  }
  /* the geode at opening o (0 closed .. 1 open), rendered into a sprite: rpx device px per unit radius */
  function renderGeode(Mo, rpx, o) {
    const W = Math.ceil(rpx * 4.8), Hh = Math.ceil(rpx * 4.6), cx = W / 2, cy = Hh * 0.6, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d'), th = o * OPEN;
    const parts = [{ M: Mo.cup }];
    const Xs = Mo.secs.map(sc => { const R = axisR(sc.ax, sc.sg * th); return p => { const q = mv(R, sub(p, sc.hp)); return [q[0] + sc.hp[0], q[1] + sc.hp[1], q[2] + sc.hp[2]]; }; });
    if (o > 0.04) parts.push({ M: Mo.bed, thin: true });
    Mo.secs.forEach((sc, i) => parts.push({ M: sc.M, X: Xs[i] }));
    paintParts(g, parts, rpx, cx, cy, { glow: o });
    // the amber hairline cracks on the crust, and the light leaking from the seams while it is shut
    g.lineCap = 'round'; g.lineJoin = 'round';
    const toS = p => { const q = w2s(p); return [cx + q[0] * rpx, cy + q[1] * rpx, q[2]]; };
    Mo.secs.forEach((sc, i) => { const X = Xs[i]; for (const cr of sc.cracks) { const P = cr.map(p => { const w = X(p), n = nrm(sub(X([p[0] * 1.1, p[1] * 1.1, p[2] * 1.1]), w)), s2 = toS(w); return [s2[0], s2[1], w2s(n)[2]]; });
        for (const [col, lw, op] of [['rgba(10,6,3,0.8)', 0.05, 'source-over'], ['rgba(217,138,30,0.35)', 0.07, 'lighter'], ['rgba(255,190,80,0.95)', 0.022, 'lighter']]) { g.globalCompositeOperation = op; g.strokeStyle = col; g.lineWidth = Math.max(0.7, rpx * lw); g.beginPath(); let pen = false; for (const p of P) { if (p[2] > 0.08) { pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); pen = true; } else pen = false; } g.stroke(); } }
      if (o < 0.3) { const P = sc.seam.map(k => toS(X(sc.M.v[k]))), a = 1 - o / 0.3; g.globalCompositeOperation = 'lighter'; for (const [col, lw] of [[`rgba(217,138,30,${0.4 * a})`, 0.08], [`rgba(255,207,92,${0.9 * a})`, 0.025]]) { g.strokeStyle = col; g.lineWidth = Math.max(0.7, rpx * lw); g.beginPath(); let pen = false; P.forEach((p, j) => { const n = w2s(nrm(sc.M.v[sc.seam[j]])); if (n[2] > 0.05) { pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); pen = true; } else pen = false; }); g.stroke(); } } });
    g.globalCompositeOperation = 'source-over';
    const tips = o > 0.2 ? Mo.tips.map(k => { const s2 = toS(Mo.bed.v[k]); return [s2[0], s2[1]]; }) : [], core = toS(Mo.C0);
    return { cv, W, H: Hh, cx, cy, tips, core: [core[0], core[1]] };
  }
  const GEO = {};
  function geodeSet(rpx, v) { const key = rpx + ':' + v; if (GEO[key]) return GEO[key]; const S = { b: new Array(NB).fill(null), Mo: makeModel(3 + v * 17), n: 0 }; const order = [0, NB - 1, 5, 7, 3, 8, 6, 4, 2, 1];
    S.step = ms => { const t0 = performance.now(); while (S.n < NB && (S.n === 0 || performance.now() - t0 < ms)) { const b = order[S.n++]; S.b[b] = renderGeode(S.Mo, rpx, b / (NB - 1)); } };
    S.get = o => { const b = Math.round(cl(o) * (NB - 1)); if (S.b[b]) return S.b[b]; for (let d = 1; d < NB; d++) { if (S.b[b - d]) return S.b[b - d]; if (S.b[b + d]) return S.b[b + d]; } return null; };
    GEO[key] = S; return S; }

  /* ================= the spear: a faceted hexagonal crystal painted in 3D ================= */
  const SPM = (() => { const v = [[0, 0, 0]], f = []; for (const [x, r] of [[0.1, 1], [0.8, 0.9]]) for (let j = 0; j < 6; j++) { const a = j / 6 * TAU; v.push([x, Math.cos(a) * r, Math.sin(a) * r]); } v.push([1, 0, 0]);
    for (let j = 0; j < 6; j++) { const j2 = (j + 1) % 6; f.push([0, 1 + j2, 1 + j]); f.push([1 + j, 1 + j2, 7 + j2, 7 + j]); f.push([7 + j, 7 + j2, 13]); } return { v, f }; })();
  const SPE = (() => { const E = new Map(); SPM.f.forEach((F, fi) => F.forEach((a, k) => { const b = F[(k + 1) % F.length], lo = Math.min(a, b), hi = Math.max(a, b), key = lo * 64 + hi, e = E.get(key); if (e) e[3] = fi; else E.set(key, [lo, hi, fi, -1]); })); return [...E.values()]; })();
  const SPR = [[62, 32, 6], [150, 84, 14], [222, 146, 36], [250, 196, 84], [255, 236, 176]];
  // base at world b, direction d (unit), length L, half width w (tiles), roll; drawn in CSS px
  function paintSpear(c, b, d, L, w, roll, T, al, seamK) {
    const y0 = nrm(cross([0, 0, 1], d)), yv = Math.hypot(...cross([0, 0, 1], d)) < 1e-3 ? [0, 1, 0] : y0, zv = cross(d, yv), cr = Math.cos(roll), sr = Math.sin(roll);
    const S = SPM.v.map(p => { const yy = p[1] * cr - p[2] * sr, zz = p[1] * sr + p[2] * cr, wp = [b[0] + d[0] * p[0] * L + (yv[0] * yy + zv[0] * zz) * w, b[1] + d[1] * p[0] * L + (yv[1] * yy + zv[1] * zz) * w, b[2] + d[2] * p[0] * L + (yv[2] * yy + zv[2] * zz) * w], q = w2s([wp[0], wp[1], wp[2]]); return [H.sx(wp[0]), H.sy(wp[1]) - wp[2] * CE * T, q[2]]; });
    // screen-space normals: from the world positions turned to screen space (orthographic: exact)
    const W3 = SPM.v.map(p => { const yy = p[1] * cr - p[2] * sr, zz = p[1] * sr + p[2] * cr; return w2s([d[0] * p[0] * L + (yv[0] * yy + zv[0] * zz) * w, d[1] * p[0] * L + (yv[1] * yy + zv[1] * zz) * w, d[2] * p[0] * L + (yv[2] * yy + zv[2] * zz) * w]); });
    const vis = [], list = [];
    SPM.f.forEach((F, i) => { const n = nrm(cross(sub(W3[F[1]], W3[F[0]]), sub(W3[F[2]], W3[F[0]]))); vis[i] = n[2] > 0.003; if (vis[i]) { let z = 0; for (const k of F) z += W3[k][2]; list.push([i, n, z]); } });
    list.sort((a, b2) => a[2] - b2[2]);
    c.save(); c.globalAlpha = al; c.lineJoin = 'round';
    for (const [i, n] of list) { const F = SPM.f[i], ndl = Math.max(0, dot(n, LS)), col = ramp(SPR, 0.12 + 0.88 * (0.35 * sstep(0.1, 0.3, ndl) + 0.65 * ndl)); c.beginPath(); F.forEach((k, j) => j ? c.lineTo(S[k][0], S[k][1]) : c.moveTo(S[k][0], S[k][1])); c.closePath(); c.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`; c.fill();
      const sp = Math.pow(Math.max(0, dot(n, HV)), 14); if (sp > 0.04) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * sp; c.fillStyle = CORE; c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = al; } }
    // the inner seam: light along the core (brighter, wider on the third volley)
    const p0 = S[0], p1 = S[13], ax = [lerp(p0[0], p1[0], 0.12), lerp(p0[1], p1[1], 0.12)], bx = [lerp(p0[0], p1[0], 0.9), lerp(p0[1], p1[1], 0.9)], px = w * T;
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const [col, k, a] of [[AMBER, 0.9, 0.35], [HONEY, 0.42, 0.7], [CORE, 0.16, 0.9]]) { c.strokeStyle = col; c.globalAlpha = al * a * (0.55 + 0.45 * seamK); c.lineWidth = Math.max(0.7, px * k * (0.8 + 0.4 * seamK)); c.beginPath(); c.moveTo(ax[0], ax[1]); c.lineTo(bx[0], bx[1]); c.stroke(); }
    const cre = new Path2D(), sil = new Path2D(); for (const [a, b2, f1, f2] of SPE) { const v1 = vis[f1], v2 = f2 >= 0 && vis[f2]; if (!v1 && !v2) continue; const P2 = v1 !== v2 ? sil : cre; P2.moveTo(S[a][0], S[a][1]); P2.lineTo(S[b2][0], S[b2][1]); }
    c.strokeStyle = PALE; c.globalAlpha = al * 0.55; c.lineWidth = 0.8; c.stroke(cre);
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#2E1A06'; c.globalAlpha = al * 0.9; c.lineWidth = 1.1; c.stroke(sil);
    c.restore();
  }

  /* ================= E7 Geode Arsenal ================= */
  // formations: (forward, side, height, size) in tiles, forward along the aim (negative = behind the pet)
  const deg = Math.PI / 180;
  const arc = (r, phis, zs, sz) => phis.map((p, i) => [-r * Math.cos(p * deg), r * Math.sin(p * deg), zs[i], sz || 1]);
  const FORM = { 3: [[-0.75, -1.3, 1.3, 1], [-0.75, 1.3, 1.3, 1], [-1.5, 0, 1.85, 1]],
    4: [[-0.5, -1.45, 1.25, 1], [-0.5, 1.45, 1.25, 1], [-1.35, -0.7, 1.75, 1], [-1.35, 0.7, 1.75, 1]],
    5: arc(1.6, [-100, -50, 0, 50, 100], [1.2, 1.55, 1.9, 1.55, 1.2]),
    6: arc(1.65, [-105, -63, -21, 21, 63, 105], [1.2, 1.5, 1.85, 1.85, 1.5, 1.2]),
    7: arc(1.8, [-110, -50, 50, 110], [1.15, 1.25, 1.25, 1.15]).concat(arc(1.1, [-58, 0, 58], [2.2, 2.35, 2.2], 0.86)) };
  U.geodearsenal = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const G = [3, 3, 4, 5, 5, 6, 7][ev - 1], TOT = (ev <= 4 ? lerp(14, 16, (ev - 1) / 3) : lerp(16, 20, (ev - 4) / 3)) * DK, D1 = TOT / (G * 3.6);
    const a = C.a, dx = Math.cos(a), dy = Math.sin(a), RG = 0.5 * Math.sqrt(K), RNG = 9 * K, SPV = 21;
    const GS = [1.15, 2.2, 3.25], GD = [0.45, 0.45, 0.62], FIRE = GS.map((g, v) => g + GD[v] + 0.14), CLOSE = FIRE[2] + G * 0.045 + 0.35, SETTLE = CLOSE + 0.45, LIFE = SETTLE + 0.95;
    const geos = FORM[G].map((p, i) => ({ i, f: p[0], s: p[1], z: p[2], sz: p[3] * RG, v: i % 2, x: me.x, y: me.y, st: i * 0.07, rec: 0, rdir: [0, 0], spear: null, tgt: null, fired: [false, false, false], dust: 0 }));
    // the pet-relative place of each geode (the formation keeps facing the cast's aim and follows the pet)
    const home = g => [me.x + g.f * dx - g.s * dy, me.y + g.f * dy + g.s * dx];
    for (const g of geos) { const p = home(g); g.x = p[0]; g.y = p[1]; }
    const flying = [], puffs = [], chips = [], shards = [], grains = [], rings = [], twinkle = [];
    let died = false, endT = 1e9;
    H.X.banner('GEODE ARSENAL', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.6;
    const zOf = (g, t) => { const u = sstep(0.05 + g.st, 0.7 + g.st, t), d = sstep(SETTLE + g.st * 0.3, SETTLE + 0.45 + g.st * 0.3, t); return lerp(0, g.z, H.ease.out(u)) * (1 - d) + 0.18 * d + 0.06 * Math.sin(t * 2.2 + g.i * 1.3) * u * (1 - d); };
    const openOf = (g, t) => { let o = sstep(0.78 + g.st * 0.5, 1.12 + g.st * 0.5, t); for (let v = 0; v < 3; v++) { const F = FIRE[v] + g.i * 0.045, k = sstep(F - 0.2, F - 0.03, t) * (1 - sstep(F + 0.06, F + 0.38, t)); o *= 1 - 0.3 * k; } return o * (1 - sstep(CLOSE + g.st * 0.3, CLOSE + 0.35 + g.st * 0.3, t)); };
    const coreW = (g, t) => [g.x, g.y + 0.02, zOf(g, t) - 0.12 * g.sz];
    const targetsNow = () => H.sortNear(me.x, me.y, H.near(me.x, me.y, RNG));
    const aimAt = (g, t, m) => { const c0 = coreW(g, t), tx = m ? m.x : me.x + dx * 6, ty = m ? m.y : me.y + dy * 6, tz = m ? 0.45 : 0; return nrm([tx - c0[0], ty - c0[1], tz - c0[2]]); };
    function launch(g, v, t) {
      g.fired[v] = true; const live = targetsNow(); let m = g.tgt && !g.tgt.dead && live.includes(g.tgt) ? g.tgt : (live.length ? live[g.i % live.length] : null);
      const c0 = coreW(g, t), d = aimAt(g, t, m), L = (v === 2 ? 2.15 : 1.9) * Math.sqrt(K), w = (v === 2 ? 0.2 : 0.14) * Math.sqrt(K);
      flying.push({ x: c0[0] + d[0] * L, y: c0[1] + d[1] * L, z: c0[2] + d[2] * L, d, L, w, m, v, t: 0, roll: g.i, tr: [] , dmg: D1 * (v === 2 ? 1.6 : 1) });
      g.spear = null; g.rec = t; g.rdir = [d[0], d[1] * SE - d[2] * CE];
      for (let k = 0; k < H.n(7); k++) { const b = Math.random() * TAU, sp = 0.6 + Math.random() * 1.4; puffs.push({ x: c0[0] - d[0] * 0.1, y: c0[1] - d[1] * 0.1, z: c0[2] + 0.05, vx: -d[0] * sp + Math.cos(b) * 0.6, vy: -d[1] * sp + Math.sin(b) * 0.6, vz: 0.4 + Math.random() * 0.6, t: 0, life: 0.55 + Math.random() * 0.3, s: 0.22 + Math.random() * 0.18, gold: 1 }); }
      for (let k = 0; k < H.n(6); k++) { const b = Math.random() * TAU; shards.push({ x: c0[0], y: c0[1], z: c0[2] + 0.1, vx: -d[0] * 2 + Math.cos(b) * 1.8, vy: -d[1] * 2 + Math.sin(b) * 1.8, vz: 1.5 + Math.random() * 2, t: 0, life: 0.45 + Math.random() * 0.3, v: k % 3, rot: Math.random() * TAU, vr: 14, s: 0.08 }); }
      if (g.i === 0) { H.X.sfx.whoosh(); H.X.shake(v === 2 ? 2.4 : 1.2, 0.08); }
    }
    function impact(s, m) {
      if (m) { H.X.hitMon(m, s.dmg, C.dmgO(s.v === 2 ? { kb: 4, stun: 0.35 } : { kb: 1.5 })); }
      const x = s.x, y = s.y, z = Math.max(0.05, s.z), big = s.v === 2 ? 1.35 : 1;
      for (let k = 0; k < H.n(Math.round(9 * big)); k++) { const b = Math.random() * TAU, v = 2 + Math.random() * 4; shards.push({ x, y, z, vx: Math.cos(b) * v - s.d[0] * 1.5, vy: Math.sin(b) * v - s.d[1] * 1.5, vz: 1.5 + Math.random() * 3.5, t: 0, life: 0.5 + Math.random() * 0.35, v: k % 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 20, s: 0.1 * big }); }
      for (let k = 0; k < H.n(Math.round(7 * big)); k++) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 3; chips.push({ x, y, z, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: 2 + Math.random() * 3, t: 0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, s: 0.07 + Math.random() * 0.06, v: k % 4 }); }
      for (let k = 0; k < H.n(4); k++) { const b = Math.random() * TAU; puffs.push({ x: x + Math.cos(b) * 0.2, y: y + Math.sin(b) * 0.2, z: 0.1, vx: Math.cos(b) * 0.9, vy: Math.sin(b) * 0.9, vz: 0.3, t: 0, life: 0.7, s: 0.3 * big }); }
      rings.push({ x, y, t: 0, life: 0.45, r0: 0.2, r1: 1.0 * big, a: 0.8 }); twinkle.push({ x, y, z: z + 0.1, t: 0, life: 0.18, s: 0.5 * big });
      H.X.light(x, y, 1.6 * big, 0.2); H.X.shake(s.v === 2 ? 2.6 : 1.1, 0.08); if (Math.random() < 0.5 || s.v === 2) H.X.sfx.crack();
    }
    const f = H.add({ life: LIFE + 1, x: me.x, y: me.y, key: 'geodearsenal', TB: FIRE[2],
      update(dt, f) {
        const t = f.t;
        if (me.dead && !died) { died = true; endT = t; f.life = Math.min(f.life, 0.7); }
        for (const g of geos) { const p = home(g), k = Math.min(1, dt * 5); g.x += (p[0] - g.x) * k; g.y += (p[1] - g.y) * k;
          if (died) continue;
          // the emergence from the floor
          if (!g.up && t >= 0.05 + g.st) { g.up = true; rings.push({ x: g.x, y: g.y, t: 0, life: 0.6, r0: 0.2, r1: 1.0, a: 0.35 }); for (let k2 = 0; k2 < H.n(5); k2++) { const b = Math.random() * TAU; puffs.push({ x: g.x + Math.cos(b) * 0.3, y: g.y + Math.sin(b) * 0.3, z: 0.05, vx: Math.cos(b) * 1.1, vy: Math.sin(b) * 1.1, vz: 0.5, t: 0, life: 0.8, s: 0.35 }); } for (let k2 = 0; k2 < H.n(5); k2++) { const b = Math.random() * TAU; chips.push({ x: g.x, y: g.y, z: 0.05, vx: Math.cos(b) * 1.5, vy: Math.sin(b) * 1.5, vz: 3 + Math.random() * 2, t: 0, rot: 0, vr: 10, s: 0.06 + Math.random() * 0.05, v: k2 % 4 }); } if (g.i === 0) H.X.sfx.thud(); }
          // the volleys: choose a monster as the spear starts to grow; fire it when grown
          for (let v = 0; v < 3; v++) { const F = FIRE[v] + g.i * 0.045; if (t >= GS[v] && !g.fired[v] && !g.spear) { const live = targetsNow(); g.tgt = live.length ? live[g.i % live.length] : null; g.spear = { v, t0: GS[v] }; } if (!g.fired[v] && t >= F) launch(g, v, t); }
          // dust trickling from the crust
          g.dust += dt * 7 * H.Q() * (t < SETTLE ? 1 : 3); while (g.dust >= 1) { g.dust--; const zz = zOf(g, t); if (zz < 0.2) continue; const b = Math.random() * TAU; grains.push({ x: g.x + Math.cos(b) * g.sz * 0.6, y: g.y + Math.sin(b) * g.sz * 0.4, z: zz - g.sz * 0.7, vz: -0.3, t: 0, life: 0.9 + Math.random() * 0.4 }); } }
        // settling: the shower of dust as they sink
        if (!died) for (const g of geos) if (!g.down && t >= SETTLE + 0.4 + g.st * 0.3) { g.down = true; for (let k2 = 0; k2 < H.n(7); k2++) { const b = Math.random() * TAU; puffs.push({ x: g.x + Math.cos(b) * 0.3, y: g.y + Math.sin(b) * 0.25, z: 0.2, vx: Math.cos(b) * 1.2, vy: Math.sin(b) * 1.0, vz: 0.4, t: 0, life: 0.9 + Math.random() * 0.4, s: 0.38 + Math.random() * 0.2 }); } if (g.i === 0) H.X.sfx.thud(); }
        // the spears in flight: a continuous path that steers a little after its monster; one hit each
        for (let i = flying.length - 1; i >= 0; i--) { const s = flying[i]; s.t += dt; s.roll += dt * 5;
          if (s.m && !s.m.dead) { const want = nrm([s.m.x - s.x, s.m.y - s.y, 0.45 - s.z]), k = Math.min(1, dt * 7); s.d = nrm([lerp(s.d[0], want[0], k), lerp(s.d[1], want[1], k), lerp(s.d[2], want[2], k)]); }
          const step = SPV * dt, n = Math.max(1, Math.ceil(step / 0.25)); let done = false;
          for (let j = 0; j < n && !done; j++) { s.x += s.d[0] * step / n; s.y += s.d[1] * step / n; s.z += s.d[2] * step / n;
            if (s.m && !s.m.dead && Math.hypot(s.m.x - s.x, s.m.y - s.y) < s.m.r + 0.25 && s.z < 1.3) { impact(s, s.m); done = true; }
            else if (s.z <= 0.04 || s.t > 1.2 || (s.z < 0.7 && H.X.blocked(s.x, s.y, 0.1, 1))) { impact(s, null); done = true; } }
          s.tr.push([s.x, s.y, s.z]); if (s.tr.length > 7) s.tr.shift();
          if (done) flying.splice(i, 1); }
        for (const L2 of [puffs, chips, shards, grains, rings, twinkle]) for (let i = L2.length - 1; i >= 0; i--) { const p = L2[i]; p.t += dt;
          if (L2 === chips) { if (p.rest != null) { p.rest -= dt; if (p.rest <= 0) L2.splice(i, 1); continue; } p.vz -= 15 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z <= 0 && p.vz < 0) { if (!p.b) { p.b = 1; p.z = 0; p.vz *= -0.3; p.vx *= 0.5; p.vy *= 0.5; } else { p.z = 0; p.rest = 0.3; } } continue; }
          if (p.t >= p.life) { L2.splice(i, 1); continue; }
          if (L2 === puffs) { const dr = Math.exp(-2 * dt); p.vx *= dr; p.vy *= dr; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
          else if (L2 === shards) { p.vz -= 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.5; p.vy *= 0.5; } }
          else if (L2 === grains) { p.vz -= 5 * dt; p.z += p.vz * dt; if (p.z < 0) { p.t = p.life; } } }
        if (died && flying.length === 0 && t > endT + 0.6) f.life = Math.min(f.life, 0.05);
        if (!died && t > LIFE && flying.length === 0 && !chips.length) f.life = Math.min(f.life, 0.05);
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, fo = died ? cl(1 - (t - endT) / 0.6) : 1; if (fo <= 0) return; const sx = H.sx, sy = H.sy;
        for (const g of geos) { const z = zOf(g, t), up = sstep(0.05 + g.st, 0.3 + g.st, t), gone = 1 - sstep(SETTLE + 0.45 + g.st * 0.3, SETTLE + 0.75 + g.st * 0.3, t); if (up * gone <= 0.01) continue; const r = g.sz * T * (1.1 - 0.15 * Math.min(1, z / 2)), o = openOf(g, t);
          c.globalAlpha = 0.5 * up * gone * fo / (1 + z * 0.4); c.drawImage(shadowSpr(), sx(g.x) - r, sy(g.y) - r * 0.5, r * 2, r); c.globalAlpha = 1;
          floorGlow(c, sx(g.x), sy(g.y), g.sz * T * 2.2, 0.32 * o * gone * fo, AMBER); }
        for (const rg of rings) { const u = rg.t / rg.life; floorSpr(c, bandSpr(), sx(rg.x), sy(rg.y), (rg.r0 + (rg.r1 - rg.r0) * H.ease.out(u)) * T, rg.a * (1 - u) * fo, true); }
        for (const p of chips) { const k = 0.3 / (1 + p.z * 1.5) * (p.rest != null ? p.rest / 0.3 : 1) * fo, r = p.s * T; c.globalAlpha = k; c.drawImage(shadowSpr(), sx(p.x) - r, sy(p.y) - r * 0.5, r * 2, r); } c.globalAlpha = 1;
      },
      draw(c, f, X, Y, T) {
        const t = f.t, fo = died ? cl(1 - (t - endT) / 0.6) : 1; if (fo <= 0) return; const sx = H.sx, sy = H.sy, k = scr(c).k;
        const rdev = Math.max(12, Math.min(90, Math.round(RG * T * k / 2) * 2)), sets = [0, 1].map(v => geodeSet(rdev, v));
        for (const S of sets) if (S.n < NB) S.step(2);
        const pX = sx(me.x), pY = sy(me.y) - T * 0.45;
        // the geodes, far to near; each with its growing spear
        const order = geos.slice().sort((p, q) => (p.y - q.y) || (q.z - p.z));
        const coreS = new Map();
        for (const g of order) { const z = zOf(g, t), up = sstep(0.05 + g.st, 0.3 + g.st, t), gone = 1 - sstep(SETTLE + 0.45 + g.st * 0.3, SETTLE + 0.75 + g.st * 0.3, t), al = up * gone * fo; if (al <= 0.01) continue;
          const o = openOf(g, t), spr = sets[g.v].get(o); if (!spr) continue; const q = g.sz * T / rdev;
          // the lean (back from its aim, as the shell tightens) and the recoil after it fires
          let tk = 0, F = 0; for (let v = 0; v < 3; v++) { F = FIRE[v] + g.i * 0.045; tk = Math.max(tk, sstep(F - 0.2, F - 0.03, t) * (1 - sstep(F + 0.02, F + 0.3, t))); }
          const sp = g.spear, dAim = sp ? aimAt(g, t, g.tgt && !g.tgt.dead ? g.tgt : null) : null, ds = dAim ? [dAim[0], dAim[1] * SE - dAim[2] * CE] : [0, 0];
          const rc = g.rec ? Math.max(0, 1 - (t - g.rec) / 0.28) : 0, rk = rc * rc * 0.2 * T, GX = sx(g.x) - g.rdir[0] * rk, GY = sy(g.y) - z * CE * T - g.rdir[1] * rk, lean = -Math.sign(ds[0] || 1) * 0.16 * tk;
          const pd = 0.4 + 0.6 * sstep(0.1 * T, 1.0 * T, Math.hypot(GX - pX, GY - pY) - g.sz * T * 0.6), A = al * pd;
          c.save(); c.translate(GX, GY + g.sz * T * 0.8); c.rotate(lean); c.translate(0, -g.sz * T * 0.8); c.globalAlpha = A; c.drawImage(spr.cv, -spr.cx * q, -spr.cy * q, spr.W * q, spr.H * q);
          // the light of the crystal bed, a few twinkling points
          const cx = spr.core[0] - spr.cx, cy = spr.core[1] - spr.cy; glow(c, cx * q, cy * q, g.sz * T * (1.0 + 0.5 * tk), HONEY, A * 0.45 * o); glow(c, cx * q, cy * q, g.sz * T * 0.45, CORE, A * 0.5 * o);
          if (spr.tips.length && o > 0.3) for (let j = 0; j < 2; j++) { const tp = spr.tips[Math.floor((t * 3 + g.i * 5 + j * 7)) % spr.tips.length], tw = Math.pow(Math.max(0, Math.sin(t * 9 + g.i * 2 + j * 3)), 6); if (tw > 0.05) { const s2 = g.sz * T * 0.35 * tw; c.globalCompositeOperation = 'lighter'; c.globalAlpha = A * tw; c.drawImage(starSpr(), (tp[0] - spr.cx) * q - s2, (tp[1] - spr.cy) * q - s2, s2 * 2, s2 * 2); c.globalCompositeOperation = 'source-over'; } }
          c.restore();
          coreS.set(g, [GX + cx * q, GY + cy * q, A]);
          // the spear growing out of the core toward its monster
          if (sp && !died) { const gu = H.ease.out(cl((t - sp.t0) / GD[sp.v])), L = (sp.v === 2 ? 2.15 : 1.9) * Math.sqrt(K), w = (sp.v === 2 ? 0.2 : 0.14) * Math.sqrt(K); if (gu > 0.02) { const c0 = coreW(g, t); c0[0] -= g.rdir[0] * rk / T; paintSpear(c, c0, dAim, L * gu, w * Math.min(1, 0.4 + gu), t * 0.8 + g.i, T, A * Math.min(1, gu * 3), sp.v === 2 ? 1 : 0.3); glow(c, GX + cx * q, GY + cy * q, g.sz * T * 0.7 * gu, CORE, A * 0.35); } } }
        // Celestial: pale golden filaments joining the cores before each volley
        if (CEL && !died) for (let v = 0; v < 3; v++) { const k2 = sstep(FIRE[v] - 0.5, FIRE[v] - 0.3, t) * (1 - sstep(FIRE[v] - 0.05, FIRE[v] + 0.1, t)); if (k2 < 0.02) continue;
          const links = [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [4, 1], [6, 2], [5, 1], [5, 2]];
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          for (const [i0, i1] of links) { const A0 = coreS.get(geos[i0]), A1 = coreS.get(geos[i1]); if (!A0 || !A1) continue; const fl = 0.6 + 0.4 * Math.sin(t * 40 + i0 * 3 + i1), mx = (A0[0] + A1[0]) / 2, my = (A0[1] + A1[1]) / 2 + T * 0.18 * Math.sin(t * 5 + i0);
            for (const [col, w, aa] of [[GOLD, 0.09, 0.22], [PALE, 0.035, 0.6], [CORE, 0.014, 0.8]]) { c.strokeStyle = col; c.globalAlpha = k2 * aa * fl * Math.min(A0[2], A1[2]); c.lineWidth = Math.max(0.7, T * w); c.beginPath(); c.moveTo(A0[0], A0[1]); c.quadraticCurveTo(mx, my, A1[0], A1[1]); c.stroke(); }
            glow(c, mx, my, T * 0.25, PALE, 0.3 * k2 * fl); }
          c.restore(); }
        // the spears in flight, with a short soft streak behind
        for (const s of flying) { for (let j = 0; j < s.tr.length - 1; j++) { const p = s.tr[j], u = (j + 1) / s.tr.length; glow(c, sx(p[0]), sy(p[1]) - p[2] * CE * T, T * s.w * 3.2 * u, HONEY, 0.32 * u * fo); }
          const b = [s.x - s.d[0] * s.L, s.y - s.d[1] * s.L, s.z - s.d[2] * s.L]; paintSpear(c, b, s.d, s.L, s.w, s.roll, T, fo, s.v === 2 ? 1 : 0.3); glow(c, sx(s.x), sy(s.y) - s.z * CE * T, T * s.w * 3, CORE, 0.45 * fo); }
        // debris, dust, shards, flashes
        for (const p of grains) { const u = p.t / p.life; c.globalAlpha = 0.7 * (1 - u) * fo; c.fillStyle = '#5C4A38'; c.fillRect(sx(p.x) - 0.9, sy(p.y) - p.z * CE * T, 1.8, 1.8); }
        for (const p of chips) { const r = p.s * T, a2 = (p.rest != null ? p.rest / 0.3 : 1) * fo; c.save(); c.translate(sx(p.x), sy(p.y) - p.z * CE * T - r * 0.4); c.rotate(p.rot); c.globalAlpha = a2; c.drawImage(chipSpr(p.v), -r, -r, r * 2, r * 2); c.restore(); }
        for (const p of shards) { const u = p.t / p.life, s = (p.s || 0.1) * T; glow(c, sx(p.x), sy(p.y) - p.z * CE * T, s * 1.6, HONEY, 0.3 * (1 - u) * fo); c.save(); c.translate(sx(p.x), sy(p.y) - p.z * CE * T); c.rotate(p.rot); c.globalAlpha = (1 - sstep(0.6, 1, u)) * fo; c.drawImage(shardSpr(p.v), -s, -s, s * 2, s * 2); c.restore(); }
        for (const p of puffs) { const u = p.t / p.life, r = p.s * (0.6 + 0.9 * u) * T; c.globalAlpha = 0.85 * Math.sin(Math.PI * Math.min(1, u * 1.3 + 0.08)) * (1 - u) * fo; if (p.gold) c.globalCompositeOperation = 'lighter'; c.drawImage(p.gold ? gpuffSpr() : puffSpr(), sx(p.x) - r, sy(p.y) - p.z * CE * T - r * 0.8, r * 2, r * 1.6); c.globalCompositeOperation = 'source-over'; }
        for (const p of twinkle) { const u = p.t / p.life, s = p.s * T * (1 + u); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - u) * fo; c.drawImage(starSpr(), sx(p.x) - s, sy(p.y) - p.z * CE * T - s, s * 2, s * 2); c.restore(); glow(c, sx(p.x), sy(p.y) - p.z * CE * T, s, HONEY, 0.6 * (1 - u) * fo); }
        c.globalAlpha = 1;
        // (the focus for the test harness)
        f.zx = sx(me.x); f.zy = sy(me.y) - T;
      } });
    return f;
  };
  // (a debug door for the harness: the geode's sprites at any opening)
  U.geodearsenal.dbg = { renderGeode, makeModel, paintSpear: (...a) => paintSpear(...a), setH: h => { H = h; } };
})();
