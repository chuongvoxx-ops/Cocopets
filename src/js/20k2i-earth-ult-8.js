/* ---------- Earth, reworked: Obsidian Drill ----------
   Enormous rotating drills of black stone and glowing golden crystal erupt from beneath the monsters and grind the area.
   Mark (0.8 s): concentric broken amber lines round the target, dust rising, light seeping up through the floor while
   the drill assembles below. Eruption: the pointed tip thrusts up, then the thick spiralling body; one eruption hit
   (kb). Drilling (4 s at level 1, 5 at Adept, 6 at Celestial; levels between interpolate): the helix turns at a speed
   its flights stay legible at, chips kick sideways from the ground contact, fine dust rises between the moving stone
   sections, thin gold highlights travel along the leading edges; its base sits in a collar of broken floor over a dark
   contact shadow and a small amber grinding ring; contact ticks every 0.25 s on the game clock (frame-rate independent),
   each drill on its own hit area. Adept: two smaller drills erupt to either side a little later (levels 5 and 6 too);
   Celestial: seven ring the main one, erupting in a ripple round it, the ring turned so a gap faces the pet and each
   kept clear of it; at Celestial their golden seams pulse toward the centre (light runs along the floor to it); the main drill stays the
   biggest visual and damage focus. Finale: the rotation tightens, loose fragments are drawn inward, all
   drills plunge together, then one shared radial ground rupture round the formation (one hit per enemy), light racing
   through the cracks and fading beneath settling rubble, a low dust veil, gold specks.
   Damage (DK = base x K x evoK), a monster on the main drill the whole time: eruption 2.6 + contact ticks + rupture 3.4
   = 14 / 17 at Adept / 20 at Celestial x DK (levels between interpolate). A smaller drill: eruption 1.3 and ticks worth
   45 % of the main drill's on its own smaller area (4.9 / 6.25 / 7.6 x DK), plus the shared rupture for anyone near it.
   The drill is a real constructed model: a faceted core and two helical flights of interlocking stone wedges (each a
   beveled leading edge, a rough dark body, a narrow seam of golden crystal along its rim, gold crystal joints between
   wedges), lit per facet in cel bands with an obsidian gloss, an amber bounce from the floor and an ink edge; rendered
   once per size into 24 rotation phases (the model repeats every half turn) with a separate blurred glow of its gold,
   built a few milliseconds per frame during the mark. No per-frame gradients, no shadowBlur; floor marks are light
   only; every edge feathered. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.divide;
  const TAU = Math.PI * 2;
  const AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', CORE = '#FFF4D6', EARTH = '#7A5218';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d, k: a }; }
  let H;

  /* ---- the camera: the game's floor squash (0.55) as the sine of the view's elevation ---- */
  const SE = 0.55, CE = Math.sqrt(1 - SE * SE), V = [0, CE, SE];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm = a => { const k = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / k, a[1] / k, a[2] / k]; };
  const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const LD = nrm([-0.55, 0.42, 0.75]), HV = nrm([LD[0] + V[0], LD[1] + V[1], LD[2] + V[2]]);

  /* ---- the model (units: the flights' outer radius is 1; z up, y toward the viewer) ---- */
  const PITCH = 1.7, HT = 4.3, ZB = 2.3, Z0 = -0.5, NPH = 24;
  const rcAt = z => 0.54 * (z <= ZB ? 1 : Math.max(0, 1 - (z - ZB) / (HT + 0.12 - ZB)));
  const roAt = z => z <= ZB ? 1 : z >= HT ? 0 : rcAt(z) + 0.46 * Math.pow(1 - (z - ZB) / (HT - ZB), 1.15);
  let MODEL = null;
  function model() {
    if (MODEL) return MODEL;
    const faces = [];
    const face = (p, kind, ref, seed, x) => { const n0 = cross3(sub3(p[1], p[0]), sub3(p[p.length - 1], p[0])); if (Math.hypot(n0[0], n0[1], n0[2]) < 1e-5) return; let n = nrm(n0);
      const cen = [0, 0, 0]; for (const q of p) { cen[0] += q[0] / p.length; cen[1] += q[1] / p.length; cen[2] += q[2] / p.length; }
      if (dot3(n, sub3(cen, ref)) < 0) n = [-n[0], -n[1], -n[2]]; faces.push(Object.assign({ p, n, kind, seed, cen }, x || {})); };
    const P = (r, an, z) => [r * Math.cos(an), r * Math.sin(an), z];
    // the flights: two starts of wedges along the helix, gold joints between them
    const WS = 1.05, GS = 0.13, SEG = 3, ZT = HT - 0.32, thMax = (ZT - Z0) / PITCH * TAU;
    const sect = (a, s, j, lead, trail) => { const z = Z0 + PITCH * a / TAU, A = a + s * Math.PI, rc = rcAt(z), ro = roAt(z), sc = cl((ro - rc) / 0.46), ri = rc * 0.96;
      const thi = 0.46 * (0.45 + 0.55 * sc), tho = 0.2 * (0.5 + 0.5 * sc), dr = 0.1 * sc, Ao = A - (lead ? 0.24 * (0.4 + 0.6 * sc) : 0) + (trail ? 0.03 : 0);
      const B = P(ro, Ao, z - dr + tho / 2), Cc = P(ro, Ao, z - dr - tho / 2);
      return { A: P(ri, A, z + thi / 2), D: P(ri, A, z - thi / 2), B, C: Cc, B2: lerp3(B, Cc, 0.3), C2: lerp3(B, Cc, 0.72), z, rc, ro, thi, sc }; };
    for (let s = 0; s < 2; s++) { let k = 0;
      for (let th = 0; th + WS <= thMax; th += WS + GS, k++) {
        const seed = 11 + k * 7.31, rg = []; for (let j = 0; j <= SEG; j++) rg.push(sect(th + WS * j / SEG, s, j, j === SEG, j === 0));
        const m = rg[SEG >> 1], ref = [(m.A[0] + m.B[0]) / 2, (m.A[1] + m.B[1]) / 2, (m.A[2] + m.D[2]) / 2];
        for (let j = 0; j < SEG; j++) { const q = rg[j], r = rg[j + 1], sd = seed + j * 1.7;
          face([q.A, r.A, r.B, q.B], 'top', ref, sd, { io: [0, 1, 2, 3] });
          face([q.B, r.B, r.B2, q.B2], 'rim', ref, sd + 0.3); face([q.B2, r.B2, r.C2, q.C2], 'seam', ref, sd + 0.5); face([q.C2, r.C2, r.C, q.C], 'rim', ref, sd + 0.7);
          face([q.C, r.C, r.D, q.D], 'bot', ref, sd + 0.9); }
        const q0 = rg[0], qs = rg[SEG]; face([q0.A, q0.B, q0.C, q0.D], 'cap', ref, seed + 9); face([qs.A, qs.B, qs.C, qs.D], 'bevel', ref, seed + 13);
        // the gold crystal joint in the gap before the next wedge
        if (th + WS + GS + WS <= thMax) { const g0 = th + WS - 0.02, g1 = th + WS + GS + 0.02, j0 = sect(g0, s, 0, false, false), j1 = sect(g1, s, 0, false, false);
          const pt = (q, a, f, dz) => P(q.rc + (q.ro - q.rc) * f, a + s * Math.PI, q.z + dz);
          const a0 = pt(j0, g0, 0, 0.2 * j0.thi), a1 = pt(j1, g1, 0, 0.2 * j1.thi), b0 = pt(j0, g0, 0.62, 0.12 * j0.thi), b1 = pt(j1, g1, 0.62, 0.12 * j1.thi), c0 = pt(j0, g0, 0.62, -0.12 * j0.thi), c1 = pt(j1, g1, 0.62, -0.12 * j1.thi);
          const rf = [(a0[0] + c1[0]) / 2 * 0.9, (a0[1] + c1[1]) / 2 * 0.9, (a0[2] + c1[2]) / 2];
          face([a0, a1, b1, b0], 'gap', rf, seed + 21); face([b0, b1, c1, c0], 'gap', rf, seed + 23); }
      } }
    // the core: a faceted cylinder tapering to the point
    const NS = 14, ZS = []; for (let z = Z0 - 0.1; z < HT - 0.5; z += 0.36) ZS.push(z);
    const RP = ZS.map((z, ri) => { const out = []; for (let j = 0; j < NS; j++) { const r = rcAt(z) * (0.92 + 0.12 * R1((j % 7) * 3.7 + ri * 1.3)), an = (j + (ri % 2) * 0.5) / NS * TAU; out.push(P(r, an, z)); } return out; });
    for (let ri = 0; ri < RP.length - 1; ri++) for (let j = 0; j < NS; j++) face([RP[ri][j], RP[ri][(j + 1) % NS], RP[ri + 1][(j + 1) % NS], RP[ri + 1][j]], 'core', [0, 0, (ZS[ri] + ZS[ri + 1]) / 2], 31 + (j % 7) * 2.3 + ri * 5.1);
    const AP = [0, 0, HT + 0.12], L = RP[RP.length - 1]; for (let j = 0; j < NS; j++) face([L[j], L[(j + 1) % NS], AP], 'core', [0, 0, ZS[ZS.length - 1]], 77 + (j % 7) * 1.9);
    MODEL = { faces }; return MODEL;
  }

  /* ---- shading ---- */
  const RAMP = [[6, 5, 5], [16, 12, 11], [28, 22, 19], [44, 36, 30], [70, 58, 47], [112, 96, 76]];
  function stoneRGB(b) { b = cl(b) * 5; const i = Math.min(4, Math.floor(b)), f = b - i, A = RAMP[i], B = RAMP[i + 1]; return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f]; }
  const KMUL = { top: 1, rim: 0.9, cap: 0.82, bevel: 1.15, bot: 0.5, core: 0.6 };
  const rgb = (r, g, b) => `rgb(${Math.min(255, r | 0)},${Math.min(255, g | 0)},${Math.min(255, b | 0)})`;
  function shade(kind, n, seed) {
    const ndl = Math.max(0, dot3(n, LD)), ndv = Math.max(0, dot3(n, V)), nh = Math.max(0, dot3(n, HV)), fr = Math.pow(1 - ndv, 2.2);
    if (kind === 'seam' || kind === 'gap') { const k = 0.3 + 0.7 * ndl, sp = Math.pow(nh, 18); return { col: rgb(lerp(150, 255, k) + 60 * sp, lerp(88, 196, k) + 60 * sp, lerp(16, 70, k) + 120 * sp), sp, em: 0.55 + 0.45 * ndv }; }
    const band = 0.3 * sstep(0.04, 0.16, ndl) + 0.35 * sstep(0.3, 0.42, ndl) + 0.35 * sstep(0.6, 0.72, ndl);
    let b = (0.1 + 0.5 * band + 0.22 * ndl) * KMUL[kind] * (0.9 + 0.2 * R1(seed * 1.31));
    let [r, g, bb] = stoneRGB(b);
    const sp = Math.pow(nh, 30) * (kind === 'core' || kind === 'bot' ? 0.3 : 1), sheen = Math.pow(nh, 6) * 0.12;
    r += 150 * sp * 0.45 + 120 * sheen; g += 140 * sp * 0.45 + 100 * sheen; bb += 130 * sp * 0.45 + 90 * sheen;
    const bounce = fr * cl(0.6 - n[2]) * 0.28; r += 217 * bounce; g += 118 * bounce; bb += 28 * bounce;   // the amber bounce from the floor
    const cold = fr * cl(-n[0] * 0.6 + n[2] * 0.5) * 0.08; r += 120 * cold; g += 120 * cold; bb += 130 * cold;
    return { col: rgb(r, g, bb), sp, em: 0 };
  }
  // a point on a face by (u, v) in its own frame (a quad bilinearly, a triangle folded)
  function onFace(P2, u, v) { if (P2.length === 3) { if (u + v > 1) { u = 1 - u; v = 1 - v; } return [P2[0][0] + (P2[1][0] - P2[0][0]) * u + (P2[2][0] - P2[0][0]) * v, P2[0][1] + (P2[1][1] - P2[0][1]) * u + (P2[2][1] - P2[0][1]) * v]; }
    const a = [lerp(P2[0][0], P2[1][0], u), lerp(P2[0][1], P2[1][1], u)], b = [lerp(P2[3][0], P2[2][0], u), lerp(P2[3][1], P2[2][1], u)]; return [lerp(a[0], b[0], v), lerp(a[1], b[1], v)]; }

  /* render one rotation phase at s px per unit: the shaded body (with an ink edge) and a blurred glow of its gold */
  function renderPhase(phi, s, S) {
    const M = model(), W = S.W, Hh = S.H, ox = W / 2, oy = S.oy, co = Math.cos(phi), si = Math.sin(phi);
    const rot = p => [p[0] * co - p[1] * si, p[0] * si + p[1] * co, p[2]], pr = p => [ox + p[0] * s, oy + (p[1] * SE - p[2] * CE) * s];
    const list = [];
    for (const f of M.faces) { const n = rot(f.n); if (n[1] * CE + n[2] * SE <= 0.004) continue; const c = rot(f.cen); list.push({ f, n, dep: c[1] * CE + c[2] * SE - (f.kind === 'core' ? 0.12 : 0) }); }
    list.sort((a, b) => a.dep - b.dep);
    const cv = mk(W, Hh), g = cv.getContext('2d'), ev = mk(W, Hh), e = ev.getContext('2d');
    g.lineJoin = 'round'; e.lineJoin = 'round'; g.lineCap = 'round'; e.lineCap = 'round';
    const lw = Math.max(0.6, s * 0.013), path = (c, P2) => { c.beginPath(); c.moveTo(P2[0][0], P2[0][1]); for (let i = 1; i < P2.length; i++) c.lineTo(P2[i][0], P2[i][1]); c.closePath(); };
    for (const it of list) { const f = it.f, P2 = f.p.map(p => pr(rot(p))), sh = shade(f.kind, it.n, f.seed), stone = !sh.em;
      path(g, P2); g.fillStyle = sh.col; g.fill();
      if (stone) { let ar = 0; for (let i = 0; i < P2.length; i++) { const a = P2[i], b = P2[(i + 1) % P2.length]; ar += a[0] * b[1] - b[0] * a[1]; } ar = Math.abs(ar) / 2;
        if (ar > s * s * 0.004) {
          if (f.kind === 'top') { const a = [(P2[0][0] + P2[1][0]) / 2, (P2[0][1] + P2[1][1]) / 2], b = [(P2[2][0] + P2[3][0]) / 2, (P2[2][1] + P2[3][1]) / 2], gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); gr.addColorStop(0, 'rgba(0,0,0,0.42)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(255,214,150,0.06)'); g.fillStyle = gr; g.fill(); }
          const nsp = Math.min(4, 1 + Math.floor(ar / (s * s * 0.012)));
          for (let k = 0; k < nsp; k++) { const q = onFace(P2, 0.15 + 0.7 * R1(f.seed + k * 1.7), 0.15 + 0.7 * R1(f.seed + k * 2.9 + 0.3)), r = Math.min(s * (0.01 + 0.022 * R1(f.seed + k * 4.1)), Math.sqrt(ar) * 0.12); g.fillStyle = k % 3 ? 'rgba(0,0,0,0.32)' : 'rgba(255,214,160,0.13)'; g.beginPath(); g.ellipse(q[0], q[1], r, r * 0.65, R1(f.seed + k) * 3, 0, TAU); g.fill(); }
          if (R1(f.seed * 3.3) < 0.5) { const q0 = onFace(P2, R1(f.seed + 5.5), R1(f.seed + 6.6)), q1 = onFace(P2, R1(f.seed + 7.7), R1(f.seed + 8.8)); g.strokeStyle = 'rgba(255,226,180,0.1)'; g.lineWidth = Math.max(0.5, s * 0.008); g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.stroke(); }
          } }
      g.strokeStyle = stone ? 'rgba(8,5,4,0.6)' : 'rgba(90,50,8,0.55)'; g.lineWidth = lw; path(g, P2); g.stroke();
      // the emissive pass: gold where the crystal shows, black where stone hides it
      path(e, P2); e.fillStyle = stone ? '#000' : rgb(255 * sh.em, 165 * sh.em, 36 * sh.em); e.fill();
      if (f.kind === 'top') { const sp = Math.pow(Math.max(0, dot3(it.n, HV)), 8), al = 0.16 + 0.7 * sp; g.strokeStyle = `rgba(255,226,170,${al.toFixed(3)})`; g.lineWidth = Math.max(0.7, s * 0.018); g.beginPath(); g.moveTo(P2[3][0], P2[3][1]); g.lineTo(P2[2][0], P2[2][1]); g.stroke(); if (sp > 0.25) { e.strokeStyle = `rgba(255,190,70,${(sp * 0.8).toFixed(3)})`; e.lineWidth = Math.max(1, s * 0.03); e.beginPath(); e.moveTo(P2[3][0], P2[3][1]); e.lineTo(P2[2][0], P2[2][1]); e.stroke(); } }
      if (f.kind === 'bevel') { const ndl = Math.max(0, dot3(it.n, LD)), al = 0.45 + 0.55 * ndl; g.strokeStyle = `rgba(255,207,92,${al.toFixed(3)})`; g.lineWidth = Math.max(0.8, s * 0.024); g.beginPath(); g.moveTo(P2[0][0], P2[0][1]); g.lineTo(P2[1][0], P2[1][1]); g.stroke(); e.strokeStyle = `rgba(255,180,60,${(0.4 + 0.6 * ndl).toFixed(3)})`; e.lineWidth = Math.max(1.2, s * 0.04); e.stroke(); }
    }
    // the ink edge: the silhouette, dark, a little outside, soft
    const ink = mk(W, Hh), ig = ink.getContext('2d'); ig.drawImage(cv, 0, 0); ig.globalCompositeOperation = 'source-in'; ig.fillStyle = '#0A0604'; ig.fillRect(0, 0, W, Hh);
    const out = mk(W, Hh), og = out.getContext('2d'), d = Math.max(1, s * 0.022);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; og.globalAlpha = 0.32; og.drawImage(ink, Math.cos(a) * d, Math.sin(a) * d); }
    og.globalAlpha = 1; og.drawImage(cv, 0, 0);
    // the glow: the emissive pass blurred by scaling down twice
    const gw = Math.ceil(W / 4), gh = Math.ceil(Hh / 4), q4 = mk(gw, gh), q8 = mk(Math.ceil(W / 8), Math.ceil(Hh / 8)), G = mk(gw, gh);
    q4.getContext('2d').drawImage(ev, 0, 0, gw, gh); q8.getContext('2d').drawImage(q4, 0, 0, q8.width, q8.height);
    const gg = G.getContext('2d'); gg.globalAlpha = 0.75; gg.drawImage(q4, 0, 0); gg.globalCompositeOperation = 'lighter'; gg.globalAlpha = 0.9; gg.drawImage(q8, 0, 0, gw, gh);
    return { body: out, glow: G };
  }
  const DC = new Map();
  function drillSet(s) {
    let S = DC.get(s); if (S) return S;
    if (DC.size > 5) DC.delete(DC.keys().next().value);
    const oy = Math.ceil((HT + 0.12 + 0.3) * CE * s), Hh = Math.ceil(oy + (SE + 0.62 * CE + 0.3) * s);
    S = { s, W: Math.ceil(2.6 * s), H: Hh, oy, ph: new Array(NPH), n: 0, ready: false };
    S.step = ms => { const t0 = performance.now(); while (S.n < NPH && performance.now() - t0 < ms) { const i = (S.n * 7) % NPH; S.ph[i] = renderPhase(i / NPH * Math.PI, s, S); S.n++; } if (S.n >= NPH) S.ready = true; };
    DC.set(s, S); return S;
  }
  // the nearest built phase to i
  const phaseOf = (S, i) => { for (let d = 0; d < NPH; d++) { const a = S.ph[(i + d) % NPH]; if (a) return a; const b = S.ph[(i - d + NPH) % NPH]; if (b) return b; } return null; };

  /* ---- the broken floor round a drill's base (back half and front half), chips, dust: cached sprites ---- */
  const CC = new Map();
  function collarSet(s) {
    let S = CC.get(s); if (S) return S; if (CC.size > 6) CC.delete(CC.keys().next().value);
    const W = Math.ceil(3.2 * s), Hh = Math.ceil(1.9 * s), cx = W / 2, cy = Hh * 0.52, rx = 1.08 * s, ry = rx * SE;
    const back = mk(W, Hh), front = mk(W, Hh), list = [];
    for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + (R1(i * 3.1) - 0.5) * 0.25, rr = 1 + 0.18 * R1(i * 5.7), w = s * (0.16 + 0.14 * R1(i * 2.3)); list.push({ a, x: cx + Math.cos(a) * rx * rr, y: cy + Math.sin(a) * ry * rr, w, h: w * (0.45 + 0.25 * R1(i * 7.1)), lean: Math.cos(a) * 0.25, seed: i * 9.7 + 1 }); }
    list.sort((p, q) => p.y - q.y);
    for (const k of list) { const g = (Math.sin(k.a) > 0 ? front : back).getContext('2d'); chunk(g, k.x, k.y, k.w, k.h, k.lean, k.seed, Math.sin(k.a) > 0.2 && R1(k.seed) < 0.35); }
    S = { W, H: Hh, cx, cy, back, front, s }; CC.set(s, S); return S;
  }
  // a broken slab of floor: an irregular lit top, a dark front face, an ink edge, now and then a gold crack in it
  function chunk(g, x, y, w, h, lean, seed, vein) {
    const n = 6, top = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + R1(seed + i) * 0.5, r = 0.75 + 0.35 * R1(seed + i * 2.1); top.push([x + Math.cos(a) * w * 0.5 * r, y - h * 0.55 + Math.sin(a) * w * 0.28 * r]); }
    const dep = h * 0.75; g.save(); g.lineJoin = 'round';
    g.beginPath(); top.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = n - 1; i >= 0; i--) { const p = top[i]; if (p[1] > y - h * 0.6) g.lineTo(p[0] + lean * w * 0.2, p[1] + dep); } g.closePath();
    g.fillStyle = '#1E1610'; g.fill(); g.strokeStyle = 'rgba(8,5,4,0.7)'; g.lineWidth = Math.max(0.7, w * 0.05); g.stroke();
    g.beginPath(); top.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    const gr = g.createLinearGradient(x - w * 0.5, y - h, x + w * 0.4, y - h * 0.2); gr.addColorStop(0, '#6E5A47'); gr.addColorStop(0.5, '#4A3C30'); gr.addColorStop(1, '#2E241C'); g.fillStyle = gr; g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,222,170,0.28)'; g.lineWidth = Math.max(0.6, w * 0.04); g.beginPath(); g.moveTo(top[3][0], top[3][1]); g.lineTo(top[4][0], top[4][1]); g.lineTo(top[5][0], top[5][1]); g.stroke();
    if (vein) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(242,183,58,0.75)'; g.lineWidth = Math.max(0.8, w * 0.05); g.beginPath(); g.moveTo(top[0][0], top[0][1]); g.lineTo(x + (R1(seed * 2) - 0.5) * w * 0.3, y - h * 0.5); g.lineTo(top[3][0], top[3][1] + dep * 0.5); g.stroke(); }
    g.restore();
  }
  const chipSpr = i => fxSprite('odchip' + i, 40, 40, g => { const pts = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R1(i * 9 + k) * 0.7, r = 11 + 7 * R1(i * 5 + k * 2); pts.push([20 + Math.cos(a) * r, 20 + Math.sin(a) * r * 0.8]); }
    g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); const gr = g.createLinearGradient(6, 6, 34, 34); gr.addColorStop(0, i % 3 === 2 ? '#8A7258' : '#5E4C3C'); gr.addColorStop(0.45, i % 2 ? '#2E241C' : '#3A3028'); gr.addColorStop(1, '#120C08'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(8,5,4,0.85)'; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.moveTo(pts[3][0], pts[3][1]); g.lineTo(pts[4][0], pts[4][1]); g.lineTo(pts[5][0], pts[5][1]); g.strokeStyle = i % 4 === 1 ? 'rgba(242,183,58,0.9)' : 'rgba(255,226,180,0.45)'; g.lineWidth = 2; g.stroke(); });
  const dustSpr = () => fxSprite('oddust', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(150,124,96,0.55)'); gr.addColorStop(0.45, 'rgba(120,98,74,0.28)'); gr.addColorStop(1, 'rgba(90,72,54,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  const shadowSpr = () => fxSprite('odshadow', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(6,4,3,0.75)'); gr.addColorStop(0.45, 'rgba(10,7,5,0.5)'); gr.addColorStop(0.8, 'rgba(10,7,5,0.14)'); gr.addColorStop(1, 'rgba(10,7,5,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  // a band of amber light round a circle, feathered both sides
  const bandSpr = () => fxSprite('odband', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); [[0, 'rgba(217,138,30,0)'], [0.62, 'rgba(217,138,30,0)'], [0.8, 'rgba(217,138,30,0.3)'], [0.9, 'rgba(242,183,58,0.75)'], [0.95, 'rgba(255,233,184,0.8)'], [1, 'rgba(255,233,184,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // stamped soft light along a path: no hard ends (paint time only)
  function stampPath(g, pts, w, col, a, taper) { let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; } if (L < 1) return;
    const img = glowSprite(col), step = Math.max(1, w * 0.3); let i = 0, acc = 0;
    for (let d = 0; d <= L; d += step) { while (i < seg.length - 1 && acc + seg[i] < d) { acc += seg[i]; i++; } const e = seg[i] ? (d - acc) / seg[i] : 0, x = lerp(pts[i][0], pts[i + 1][0], e), y = lerp(pts[i][1], pts[i + 1][1], e), u = d / L, env = taper ? Math.min(1, u / 0.08) * Math.pow(1 - u, 0.8) : Math.min(1, u / 0.18, (1 - u) / 0.18), ww = w * (taper ? 0.4 + 0.6 * (1 - u) : 1);
      g.globalAlpha = Math.min(1, a * env); g.drawImage(img, x - ww, y - ww, ww * 2, ww * 2); } g.globalAlpha = 1; }
  // the mark: three concentric rings of broken amber lines (light only)
  const markSpr = () => fxSprite('odmark', 320, 320, g => { g.globalCompositeOperation = 'lighter';
    [[0.42, 5, 0.3], [0.66, 7, 1.1], [0.9, 9, 2.3]].forEach(([rr, n, o], ri) => { for (let i = 0; i < n; i++) { const a0 = o + i / n * TAU + R1(ri * 13 + i) * 0.2, a1 = a0 + TAU / n * (0.5 + 0.25 * R1(ri * 7 + i * 3)), pts = []; for (let k = 0; k <= 24; k++) { const b = lerp(a0, a1, k / 24); pts.push([160 + Math.cos(b) * rr * 150, 160 + Math.sin(b) * rr * 150]); }
      stampPath(g, pts, 14, AMBER, 0.38); stampPath(g, pts, 6, GOLD, 0.6); stampPath(g, pts, 2.6, PALE, 0.75); } }); });
  // light in short cracks round a drill's base (light only)
  const baseCrackSpr = () => fxSprite('odbcr', 320, 320, g => { g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 11; i++) { let a = i / 11 * TAU + R1(i * 3.3) * 0.4, r = 52, x = 160 + Math.cos(a) * r, y = 160 + Math.sin(a) * r; const pts = [[x, y]]; const L = 40 + 70 * R1(i * 5.1); for (let k = 0; k < 6; k++) { a += (R1(i * 11 + k) - 0.5) * 0.8; r = L / 6; x += Math.cos(a) * r; y += Math.sin(a) * r; pts.push([x, y]); }
      stampPath(g, pts, 9, AMBER, 0.35, true); stampPath(g, pts, 3.5, GOLD, 0.7, true); stampPath(g, pts, 1.5, CORE, 0.6, true); } });

  /* ================= E9 Obsidian Drill ================= */
  U.obsidiandrill = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const DUR = 4 + (ev - 1) / 3, WARN = 0.8, PER = 0.25, NSM = CEL ? 7 : ADE ? 2 : 0;
    const TOT = (14 + (ev - 1)) * DK, ERU = 2.6 * DK, RUP = 3.4 * DK, TICKS = TOT - ERU - RUP;
    const TF = WARN + DUR, TP = TF + 0.5, TR = TP + 0.22, LIFE = TR + 1.9;
    const seed = Math.floor(Math.random() * 1000);
    const a = C.a != null ? C.a : Math.atan2(C.ty - me.y, C.tx - me.x), fx = Math.cos(a), fy = Math.sin(a), px = -fy, py = fx;
    const p0 = H.X.walkPoint(C.tx, C.ty, { r: 0.5, mv: 0 }), cx = p0.x, cy = p0.y;
    const U0 = 0.82 * (1 + 0.04 * (ev - 1)) * K, US = U0 * 0.56;   // the flights' radius in tiles, main and small
    const drills = [{ x: cx, y: cy, u0: U0, main: true, em: WARN, i: 0 }];
    // the smaller drills: Adept, one to either side; Celestial, a ring of seven round the main one; the ring turned so that
    // a gap, not a drill, faces the pet; each kept clear of the pet; they erupt in a ripple round the ring
    const DS = (CEL ? 2.2 : 1.85) * K, back = Math.atan2(me.y - cy, me.x - cx);
    for (let i = 0; i < NSM; i++) { let b = back + (i + 0.5) / NSM * TAU, q = null;
      for (const db of [0, 0.35, -0.35, 0.7, -0.7]) { const bb = b + db, w = H.X.walkPoint(cx + Math.cos(bb) * DS, cy + Math.sin(bb) * DS, { r: 0.35, mv: 0 }); if (Math.hypot(w.x - me.x, w.y - me.y) > 1.5) { q = w; break; } }
      if (!q) continue; drills.push({ x: q.x, y: q.y, u0: US, main: false, em: WARN + 0.18 + 0.075 * i, i: drills.length }); }
    const SR = Math.min(1, 3 / Math.max(1, NSM));   // (particle rates of the smaller drills, thinned as they multiply)
    let RR = 2.3 * K; for (const d of drills) RR = Math.max(RR, Math.hypot(d.x - cx, d.y - cy) + 1.35 * K);
    for (const d of drills) { const sc = d.main ? 1 : 0.45; d.hr = d.u0 + 0.55 * (d.main ? 1 : 0.7); d.er = d.hr + 0.25; d.erupt = d.main ? ERU : 1.3 * DK; d.t0 = d.em + 0.35; d.NT = Math.max(1, Math.ceil((TF - d.t0) / PER)); d.tick = TICKS * sc / d.NT; d.nt = 0;
      d.rise = 0; d.rot = R1(seed + d.i) * TAU; d.w = 0; d.sq = 1; d.erupted = false; d.chipAcc = 0; d.dustAcc = 0; d.dir = d.main ? 1 : (d.i % 2 ? -1 : 1); d.cr = R1(seed + d.i * 3) * TAU; }
    const chips = [], dust = [], specks = [], cracks = [];
    let dead = false, ruptured = false, plunged = false;
    H.X.banner('OBSIDIAN DRILL', '', C.col, 1.4); H.X.sfx.hum();
    // the rupture's cracks: from the formation outward, branching once
    { const NC = 12 + 2 * NSM; for (let i = 0; i < NC; i++) { let b = i / NC * TAU + (R1(seed + i * 1.3) - 0.5) * 0.35, r = U0 * 0.9; const pts = [[cx + Math.cos(b) * r, cy + Math.sin(b) * r]], L = RR * (0.75 + 0.3 * R1(seed + i * 2.7)), n = 9;
      for (let k = 0; k < n; k++) { b += (R1(seed + i * 7 + k) - 0.5) * 0.3; r += (L - U0 * 0.9) / n; pts.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r]); }
      cracks.push({ pts, w: 1 - 0.3 * R1(seed + i * 5), d0: 0 });
      if (R1(seed + i * 9) < 0.6) { const k0 = 3 + Math.floor(R1(seed + i * 4) * 3), q = pts[k0]; let bb = b + (R1(seed + i) < 0.5 ? 0.6 : -0.6), x = q[0], y = q[1]; const br = [[x, y]]; for (let k = 0; k < 4; k++) { bb += (R1(seed + i * 3 + k) - 0.5) * 0.6; x += Math.cos(bb) * RR * 0.09; y += Math.sin(bb) * RR * 0.09; br.push([x, y]); } cracks.push({ pts: br, w: 0.55, d0: k0 / n }); } } }
    const dimAt = (X, Ytop, Ybot, w, PX, PY) => (PX > X - w && PX < X + w && PY > Ytop && PY < Ybot + 6) ? 0.38 + 0.62 * sstep(w * 0.35, w, Math.abs(PX - X)) : 1;
    function erupt(d) {
      H.hitArea(d.x, d.y, d.er, d.erupt, C.dmgO({ stun: 0.25 }));
      H.X.shake(d.main ? 9 + ev : 4, 0.2); H.X.light(d.x, d.y, d.er * 1.6, 0.4); (d.main ? H.X.sfx.crash : H.X.sfx.thud)(); if (d.main) H.X.hitstop(0.04);
      const n = H.n(d.main ? 18 : 9); for (let i = 0; i < n; i++) { const b = Math.random() * TAU, v = (2 + Math.random() * 3) * (d.main ? 1 : 0.7); chips.push({ x: d.x + Math.cos(b) * d.u0 * 0.8, y: d.y + Math.sin(b) * d.u0 * 0.5, z: 0.2 + Math.random() * 0.6, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: 3 + Math.random() * 4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, s: (0.1 + Math.random() * 0.12) * (d.main ? 1 : 0.7), k: Math.floor(Math.random() * 4), t: 0, life: 1.1 + Math.random() * 0.5 }); }
      for (let i = 0; i < H.n(d.main ? 10 : 5); i++) { const b = Math.random() * TAU; dust.push({ x: d.x + Math.cos(b) * d.u0, y: d.y + Math.sin(b) * d.u0 * 0.6, z: 0.1, vx: Math.cos(b) * (1 + Math.random() * 1.5), vy: Math.sin(b) * 0.8, vz: 0.4 + Math.random() * 0.8, t: 0, life: 1 + Math.random() * 0.6, s: (0.5 + Math.random() * 0.4) * (d.main ? 1 : 0.7) }); }
    }
    function rupture() {
      H.hitArea(cx, cy, RR, RUP, C.dmgO({ kb: 4, stun: 0.45 }));
      H.X.flash(0.14, PALE); H.X.hitstop(0.07); H.X.sfx.crash(); H.X.shake(14 + 2 * ev, 0.45); H.X.light(cx, cy, RR * 1.2, 0.5);
      for (let i = 0; i < H.n(26 + 4 * ev); i++) { const b = Math.random() * TAU, r = Math.random() * RR * 0.8, v = 1.5 + Math.random() * 3.5; chips.push({ x: cx + Math.cos(b) * r, y: cy + Math.sin(b) * r * 0.9, z: 0.05, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 3.5 + Math.random() * 3.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, s: 0.12 + Math.random() * 0.18, k: Math.floor(Math.random() * 4), t: 0, life: 1.5 + Math.random() * 0.4, settle: true }); }
      for (let i = 0; i < H.n(16 + 2 * ev); i++) { const b = i / (16 + 2 * ev) * TAU + Math.random() * 0.3, r = RR * (0.35 + 0.45 * Math.random()); dust.push({ x: cx + Math.cos(b) * r, y: cy + Math.sin(b) * r, z: 0.05, vx: Math.cos(b) * (0.8 + Math.random()), vy: Math.sin(b) * 0.6, vz: 0.15 + Math.random() * 0.25, t: -Math.random() * 0.15, life: 1.4 + Math.random() * 0.6, s: 0.8 + Math.random() * 0.5, veil: true }); }
      for (let i = 0; i < H.n(24 + 3 * ev); i++) { const b = Math.random() * TAU, r = Math.random() * RR; specks.push({ x: cx + Math.cos(b) * r, y: cy + Math.sin(b) * r, z: 0.2 + Math.random() * 1.2, vz: 0.3 + Math.random() * 0.6, vx: Math.cos(b) * 0.4, vy: Math.sin(b) * 0.2, t: -Math.random() * 0.3, life: 0.9 + Math.random() * 0.8, s: 0.05 + Math.random() * 0.06 }); }
    }
    const F = H.add({ life: LIFE, x: cx, y: cy, EQ: 1,
      update(dt, f) {
        const t = f.t;
        if (me.dead && !dead && t < TR) { dead = true; f.life = Math.min(f.life, 0.9); }
        for (const d of drills) {
          // rise: the tip thrusts up, the body follows with a heavy overshoot; the finale sinks it a little, then the plunge
          const e = t - d.em; let r = 0;
          if (e > 0) r = e < 0.42 ? (() => { const u = e / 0.42, s2 = 1.4; const v = u - 1; return v * v * ((s2 + 1) * v + s2) + 1; })() : 1;
          if (t > TF) r *= 1 - 0.07 * sm((t - TF) / 0.5);
          if (t > TP) { const u = cl((t - TP) / 0.22); r *= 1 - u * u; }
          if (dead) r *= Math.max(0, 1 - (t - (f.deadT || (f.deadT = t))) / 0.35);
          d.rise = r; if (t > TP + 0.22 && !plunged) { plunged = true; }
          const w0 = d.main ? 2.6 : 3.3, wv = e < 0.5 ? lerp(6.5, w0, sm(e / 0.5)) : w0, w = t > TF ? lerp(wv, 8.5, sm((t - TF) / 0.45)) : wv; d.w = w * d.dir; d.rot += d.w * dt;
          d.sq = t > TF && t < TP + 0.22 ? 1 - 0.06 * sm((t - TF) / 0.4) : 1;
          if (!dead) {
            if (!d.erupted && e >= 0.06) { d.erupted = true; erupt(d); }
            while (d.nt < d.NT && t >= d.t0 + d.nt * PER) { H.hitArea(d.x, d.y, d.hr, d.tick, C.dmgO({})); d.nt++;
              // the grind draws the monsters at its edge back against the flights (bosses and fixed ones stay)
              for (const m of H.near(d.x, d.y, d.hr + 0.9)) { const dd = Math.hypot(m.x - d.x, m.y - d.y); if (dd > d.u0 + 0.25) H.pull(m, d.x, d.y, Math.min(0.14, dd - d.u0 - 0.25)); } }
          }
          // chips kicked sideways at the ground contact, dust rising between the moving sections, fragments drawn in at the finale
          if (r > 0.6 && t < TP && !dead) {
            d.chipAcc += dt * (d.main ? 16 : 8 * SR) * H.Q(); while (d.chipAcc >= 1) { d.chipAcc--; const b = Math.random() * TAU, tg = b + Math.PI / 2 * d.dir, v = 2 + Math.random() * 2.5, R0 = d.u0 * 1.02;
              chips.push({ x: d.x + Math.cos(b) * R0, y: d.y + Math.sin(b) * R0 * 0.9, z: 0.08, vx: Math.cos(tg) * v + Math.cos(b) * 0.8, vy: (Math.sin(tg) * v + Math.sin(b) * 0.8) * 0.6, vz: 1.5 + Math.random() * 2.2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16, s: (0.05 + Math.random() * 0.07) * (d.main ? 1 : 0.75), k: Math.floor(Math.random() * 4), t: 0, life: 0.6 + Math.random() * 0.3 }); }
            d.dustAcc += dt * (d.main ? 7 : 3.5 * SR) * H.Q(); while (d.dustAcc >= 1) { d.dustAcc--; const b = Math.random() * TAU, zz = Math.random() * HT * 0.8 * d.u0 * CE;
              dust.push({ x: d.x + Math.cos(b) * d.u0 * 0.95, y: d.y + Math.sin(b) * d.u0 * 0.5, z: zz, vx: Math.cos(b) * 0.5, vy: 0, vz: 0.35 + Math.random() * 0.4, t: 0, life: 0.9 + Math.random() * 0.5, s: (0.22 + Math.random() * 0.2) * (d.main ? 1 : 0.7), fine: true }); }
          }
          if (t > TF && t < TP + 0.1 && !dead && Math.random() < dt * (d.main ? 26 : 12 * SR) * H.Q()) { const b = Math.random() * TAU, rr = d.u0 * (1.9 + Math.random() * 1.2);
            chips.push({ x: d.x + Math.cos(b) * rr, y: d.y + Math.sin(b) * rr * 0.8, z: 0.05, vx: 0, vy: 0, vz: 0.6 + Math.random(), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 8, s: 0.06 + Math.random() * 0.08, k: Math.floor(Math.random() * 4), t: 0, life: 0.5, pull: d }); }
        }
        if (!dead && !ruptured && t >= TR) { ruptured = true; rupture(); }
        for (let i = chips.length - 1; i >= 0; i--) { const p = chips[i]; p.t += dt; if (p.t < 0) continue;
          if (p.pull) { const dx = p.pull.x - p.x, dy = p.pull.y - p.y, dd = Math.hypot(dx, dy) || 1, v = 2 + p.t * 9; p.x += dx / dd * v * dt; p.y += dy / dd * v * dt; p.z = Math.max(0.03, p.z + p.vz * dt); p.vz -= 6 * dt; p.rot += p.vr * dt; if (dd < p.pull.u0 * 0.9 || p.t > p.life) chips.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 13 * dt; p.rot += p.vr * dt;
          if (p.z < 0.02) { p.z = 0.02; if (p.vz < -1.2) { p.vz = -p.vz * 0.28; p.vx *= 0.5; p.vy *= 0.5; p.vr *= 0.5; } else { p.vz = 0; p.vx *= Math.exp(-dt * 8); p.vy *= Math.exp(-dt * 8); p.vr *= Math.exp(-dt * 8); } }
          if (p.t >= p.life) chips.splice(i, 1); }
        for (let i = dust.length - 1; i >= 0; i--) { const p = dust[i]; p.t += dt; if (p.t < 0) continue; const k = Math.exp(-1.6 * dt); p.vx *= k; p.vy *= k; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.t >= p.life) dust.splice(i, 1); }
        for (let i = specks.length - 1; i >= 0; i--) { const p = specks[i]; p.t += dt; if (p.t < 0) continue; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz *= Math.exp(-dt); if (p.t >= p.life) specks.splice(i, 1); }
        // the mark's rising dust
        if (t < WARN + 0.2 && Math.random() < dt * 14 * H.Q()) for (const d of drills) { if (t > d.em) continue; const b = Math.random() * TAU, r = d.u0 * (0.6 + Math.random() * 1.6); dust.push({ x: d.x + Math.cos(b) * r, y: d.y + Math.sin(b) * r * 0.9, z: 0.05, vx: 0, vy: 0, vz: 0.5 + Math.random() * 0.5, t: 0, life: 0.8 + Math.random() * 0.4, s: (0.25 + Math.random() * 0.2) * (d.main ? 1 : 0.7), fine: true }); }
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t, end = cl(f.life / 0.6);
        for (const d of drills) { const X = H.sx(d.x), Y = H.sy(d.y), u = d.u0 * T, e = t - d.em;
          // the mark: broken amber rings drawing in, light seeping up through the floor while the drill assembles
          if (e < 0.35) { const q = cl(t / Math.max(0.1, d.em)), a = sm(t / 0.25) * (1 - sm(e / 0.35)), rr = u * (2.2 - 0.6 * sm(q)), rot = t * 0.6 * (d.i % 2 ? -1 : 1);
            c.save(); c.globalCompositeOperation = 'lighter'; c.translate(X, Y); c.scale(1, SE); c.rotate(rot); c.globalAlpha = a * (d.main ? 0.9 : 0.75); c.drawImage(markSpr(), -rr, -rr, rr * 2, rr * 2); c.restore();
            c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.6 * q; c.drawImage(baseCrackSpr(), X - u * 1.3 * q, Y - u * 1.3 * q * SE, u * 2.6 * q, u * 2.6 * q * SE); c.restore();
            H.glow(c, X, Y, u * (0.9 + 0.8 * q), AMBER, a * 0.35 * q); }
          if (e > 0 && d.rise > 0.02) { const r = Math.min(1, d.rise), on = r * end;
            // the dark contact shadow, the light in the cracks round it, the small grinding ring
            c.save(); c.globalAlpha = 0.85 * on; c.drawImage(shadowSpr(), X - u * 1.5, Y - u * 1.5 * SE, u * 3, u * 3 * SE); c.restore();
            c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = on * (0.45 + 0.2 * Math.sin(t * 9 + d.i)); c.translate(X, Y); c.scale(1, SE); c.rotate(d.cr); c.drawImage(baseCrackSpr(), -u * 1.45, -u * 1.45, u * 2.9, u * 2.9); c.restore();
            const gr = u * 1.22; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = on * (0.55 + 0.15 * Math.sin(t * 13 + d.i)); c.drawImage(bandSpr(), X - gr, Y - gr * SE, gr * 2, gr * 2 * SE); c.restore();
            const gs = glowSprite(HONEY); c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0, nk = d.main ? 6 : 3; k < nk; k++) { const b = d.rot * 1.0 + k / nk * TAU, sx2 = X + Math.cos(b) * gr * 0.93, sy2 = Y + Math.sin(b) * gr * 0.93 * SE, ss = u * 0.14; c.globalAlpha = on * 0.7 * (0.5 + 0.5 * Math.sin(b * 3)); c.drawImage(gs, sx2 - ss, sy2 - ss, ss * 2, ss * 2); } c.restore();
            // Celestial: the small drills' gold pulsing toward the centre along the floor
            if (CEL && !d.main && t < TP) { const M = drills[0], MX = H.sx(M.x), MY = H.sy(M.y); c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const q = ((t * 0.9 + k / 3 + d.i * 0.13) % 1), qx = lerp(X, MX, 0.15 + 0.7 * q), qy = lerp(Y, MY, 0.15 + 0.7 * q), ss = u * (0.55 - 0.2 * q); c.globalAlpha = on * 0.55 * Math.sin(q * Math.PI); c.drawImage(glowSprite(GOLD), qx - ss, qy - ss * SE * 1.4, ss * 2, ss * 2 * SE * 1.4); } c.restore(); } }
        }
        // the rupture: light racing out through the cracks, a ring of light, all fading under the rubble
        if (ruptured) { const p = t - TR, fadeA = 1 - sm((p - 0.5) / 1.1);
          if (fadeA > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
            for (const cr of cracks) { const P = cr.pts, n = P.length - 1, front = cl((p / 0.32 - cr.d0) / (1 - cr.d0 + 0.001)) * n; if (front <= 0) continue;
              for (let k = 0; k < Math.min(n, Math.ceil(front)); k++) { const u = k / n, e2 = Math.min(1, front - k), x0 = H.sx(P[k][0]), y0 = H.sy(P[k][1]), x1 = H.sx(lerp(P[k][0], P[k + 1][0], e2)), y1 = H.sy(lerp(P[k][1], P[k + 1][1], e2)), w = T * 0.14 * cr.w * (1 - 0.75 * u), hot = Math.max(0, 1 - (front - k) / 3);
                c.globalAlpha = fadeA * 0.22 * (1 - u * 0.6); c.strokeStyle = AMBER; c.lineWidth = w * 2.6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
                c.globalAlpha = fadeA * (0.4 + 0.4 * hot) * (1 - u * 0.55); c.strokeStyle = hot > 0.5 ? PALE : GOLD; c.lineWidth = Math.max(0.8, w * 0.55); c.stroke(); }
              if (front < n) { const k = Math.floor(front), e2 = front - k, hx = H.sx(lerp(P[k][0], P[k + 1][0], e2)), hy = H.sy(lerp(P[k][1], P[k + 1][1], e2)), ss = T * 0.3; c.globalAlpha = fadeA * 0.6; c.drawImage(glowSprite(HONEY), hx - ss, hy - ss, ss * 2, ss * 2); } }
            c.restore(); }
          const q = cl(p / 0.6); if (q < 1) { const rr = RR * T * (0.25 + 0.85 * H.ease.out(q)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - q) * sstep(0, 0.1, q) * 0.85; c.drawImage(bandSpr(), H.sx(cx) - rr, H.sy(cy) - rr * SE, rr * 2, rr * 2 * SE); c.restore(); }
          H.glow(c, H.sx(cx), H.sy(cy), RR * T * 0.9, AMBER, 0.28 * Math.max(0, 1 - p / 0.6)); }
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t, SC = scr(c), end = cl(f.life / 0.5), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45;
        const order = drills.slice().sort((p, q) => p.y - q.y);
        // (the drill's phases build a few milliseconds a frame from the cast on; a missing one borrows the nearest built)
        let budget = 5; for (const d of drills) { const S = drillSet(Math.max(16, Math.round(d.u0 * T * SC.k / 6) * 6)); if (!S.ready && budget > 0) { const t0 = performance.now(); S.step(budget); budget -= performance.now() - t0; } }
        for (const d of order) { if (d.rise <= 0.005) continue;
          const X = H.sx(d.x), Y = H.sy(d.y), u = d.u0 * T, want = Math.max(16, Math.round(u * SC.k / 6) * 6), S = drillSet(want); if (!S.n) S.step(0.1);
          const phs = ((d.rot % Math.PI) + Math.PI) % Math.PI, ph = phaseOf(S, Math.floor(phs / Math.PI * NPH) % NPH); if (!ph) continue;
          const k = u / S.s, dz = (1 - Math.min(1, d.rise)) * (HT + 0.7), lift = Math.max(0, d.rise - 1) * (HT + 0.7);
          const zf = dz, rf = zf >= HT ? 0 : roAt(zf) * 1.03, Ytop = Y - (HT + 0.2 - dz + lift) * CE * u, dim = dimAt(X, Ytop, Y, u * 1.3, PX, PY) * end;
          const col = collarSet(Math.max(12, Math.round(u * SC.k / 6) * 6)), ck = u / col.s, ca = sm(d.rise * 1.6) * end;
          if (ca > 0.01) { c.save(); c.globalAlpha = ca * dim; c.drawImage(col.back, X - col.cx * ck, Y - col.cy * ck - (1 - ca) * u * 0.3, col.W * ck, col.H * ck); c.restore(); }
          c.save(); c.beginPath(); c.rect(X - u * 2.5, Ytop - u * 2, u * 5, Y - Ytop + u * 2); c.ellipse(X, Y, Math.max(0.1, rf * u), Math.max(0.1, rf * u * SE), 0, 0, TAU); c.clip();
          const bw = S.W * k * d.sq, bx = X - bw / 2, by = Y - S.oy * k + (dz - lift) * CE * u;
          c.globalAlpha = dim; c.drawImage(ph.body, bx, by, bw, S.H * k);
          const pulse = CEL && !d.main ? 0.5 + 0.5 * Math.sin(t * 5 - d.i * 0.6) : 0.5 + 0.5 * Math.sin(t * 3.2), ga = (0.55 + 0.35 * pulse + (t > TF ? 0.35 * sm((t - TF) / 0.4) : 0)) * dim;
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, ga); c.drawImage(ph.glow, bx, by, bw, S.H * k);
          // the travelling gold highlight along a leading edge as it turns (front side only)
          for (let s2 = 0; s2 < 2; s2++) { const zz = ((t * 0.9 + s2 * 0.5 + d.i * 0.2) % 1) * (ZB + 1.2), an = d.rot + zz / PITCH * TAU + s2 * Math.PI, sn = Math.sin(an); if (sn < 0.15 || zz - dz < 0.1) continue; const ro = roAt(zz), hx = X + Math.cos(an) * ro * u * d.sq, hy = Y + (Math.sin(an) * ro * SE - (zz - dz + lift) * CE) * u, ss = u * 0.35; c.globalAlpha = dim * 0.8 * sn; c.drawImage(glowSprite(PALE), hx - ss, hy - ss, ss * 2, ss * 2); }
          c.restore();
          if (ca > 0.01) { c.save(); c.globalAlpha = ca * dim; c.drawImage(col.front, X - col.cx * ck, Y - col.cy * ck - (1 - ca) * u * 0.3, col.W * ck, col.H * ck); c.restore(); }
          // the tip breaking through: a burst of light at the floor
          const e = t - d.em; if (e > 0 && e < 0.4) H.glow(c, X, Y - u * 0.3, u * (1.4 + 1.6 * e), PALE, (1 - e / 0.4) * 0.7);
        }
        // dust (a fine veil between the sections, the low veil after the rupture), chips and rubble, gold specks
        const ds = dustSpr(); c.save();
        for (const p of dust) { if (p.t < 0) continue; const q = p.t / p.life, X = H.sx(p.x), Y = H.sy(p.y) - p.z * T, r = T * p.s * (0.6 + 0.9 * q), a = Math.sin(Math.min(1, q * 2.5) * Math.PI / 2) * (1 - q) * (p.veil ? 0.8 : p.fine ? 0.5 : 0.7);
          c.globalAlpha = a * (Math.hypot(X - PX, Y - PY) < T * 0.9 ? 0.5 : 1); c.drawImage(ds, X - r, Y - r * (p.veil ? 0.6 : 1), r * 2, r * 2 * (p.veil ? 0.6 : 1)); }
        c.restore();
        c.save(); for (const p of chips) { if (p.t < 0) continue; const X = H.sx(p.x), Y = H.sy(p.y) - p.z * T, sz = p.s * T, a = (p.settle ? 1 - sm((p.t - p.life * 0.6) / (p.life * 0.4)) : 1 - sm((p.t - p.life * 0.7) / (p.life * 0.3))) * (p.pull ? sm(p.t / 0.1) : 1);
          if (a < 0.02 || sz < 0.5) continue; c.save(); c.translate(X, Y); c.rotate(p.rot); c.globalAlpha = a; c.drawImage(chipSpr(p.k), -sz, -sz * 0.8, sz * 2, sz * 1.6); c.restore(); }
        c.restore();
        if (specks.length) { c.save(); c.globalCompositeOperation = 'lighter'; const gs = glowSprite(HONEY); for (const p of specks) { if (p.t < 0) continue; const q = p.t / p.life, X = H.sx(p.x), Y = H.sy(p.y) - p.z * T, s = T * p.s * (1 + 2 * (1 - q)); c.globalAlpha = Math.sin(q * Math.PI) * 0.9; c.drawImage(gs, X - s, Y - s, s * 2, s * 2); } c.restore(); }
        // the rupture in the air: a hot flash low over the formation
        if (ruptured) { const p = t - TR; if (p < 0.35) { H.glow(c, H.sx(cx), H.sy(cy) - T * 0.3, RR * T * 0.55, PALE, 0.3 * (1 - p / 0.35)); H.glow(c, H.sx(cx), H.sy(cy) - T * 0.2, RR * T * 1.0, AMBER, 0.28 * (1 - p / 0.35)); } }
      } });
    void F; void EARTH; void px; void py; void fx; void fy;
  };
  U.obsidiandrill.preview = (s, phi) => { const S = drillSet(s); return renderPhase(phi, s, S); };   // (for the model preview in tests)
})();
