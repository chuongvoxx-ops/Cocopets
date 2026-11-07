/* ---------- Dark Strong, new: Night Bloom ----------
   The pet plants a luminous black seed beneath the targeted group; thorned crystal stems spiral up out of a dark ripple
   and carry a midnight crystal lotus; its petals unfold in staggered layers round a pulsing crimson core, then curl in,
   the core contracts, and the flower bursts into petal shards and a low smoky shockwave. Replaces Velvet Undertow (row
   in 20k1: key 'nightbloom', cost 26, cd 3.2, glyph 'flower').
   Flowers (C.evo; held until their breakpoints): 1 central at levels 1-3; the central + 2 satellites at 4-6 (on opposite
   sides of the centre, across the aim); the central + 4 at 7 (on the diagonals). 1 / 3 / 5 flowers in all.
   Target: locked at the cast: the aimed / selected monster (else the point 3 tiles ahead), drawn halfway toward the
   middle of the monsters within 1.8 tiles of it, kept within TUNE.range of the pet, pulled back along the line until the
   pet can see it and onto walkable ground (H.walk).
   Satellites: each placed at TUNE.satDist from the centre at its angle; if that spot is not walkable ground (H.X.blocked
   with walkers' rules, so walls, gaps, water and the map's edge all refuse it) or a wall lies between it and the centre
   (sampled every 0.15 tile), the angle is swung (+-0.35, +-0.7 rad) and the distance shortened (x0.8, x0.62), then any other
   angle round the centre (30-degree steps) is tried; a satellite with no valid spot at all is dropped (only in a cramped corridor; open floor always gives 1 / 3 / 5).
   Hits: each flower is ONE H.hitArea call at its own detonation (every monster at most once per call, i.e. once per
   flower; overlapping areas from different flowers may each hit). Seed, ripple, stems, petals, shards, smoke, embers
   and the aftermath deal nothing. No knockback, no stun.
   Damage (DK = base x K x (1 + 0.1 (evo - 1))): central TUNE.centreK = 2.4 DK in TUNE.centreR = 1.7 tiles; each
   satellite TUNE.satK = 1.0 DK in TUNE.satR = 1.1 tiles. A monster in the centre takes 2.4 / 3.12 / 3.84 x base x K at
   levels 1 / 4 / 7; one also standing in a satellite's area takes +1.0 / 1.3 / 1.6 more per satellite.
   Timeline: seed lands 0.26 s, stems 0.26-0.72, petals unfold (3 layers, staggered) 0.6-1.1, the core pulses, the petals
   curl in and the core contracts 1.22-1.45, central burst 1.45 s. Satellites: indicators appear at 0.55 s (their areas
   and positions shown ~1 s before they fire); after the burst a seed arcs out of it to each in turn (0.13 s apart), lands
   in 0.2 s, grows and bursts 0.5 s later: last burst ~2.17 (L4) / ~2.43 s (L7); aftermath gone ~1.4 s after the last.
   The seed is released at the cast frame (the cast is committed then); nothing is pending on the pet afterwards, so a
   swap or the pet's death lets the planted flowers finish (like a released projectile). The floor's end discards them.
   Pictures: petals are repeated tapered sprites (inner face: deep purple, translucent violet edge, crimson veins
   brightening toward the base, core-lit; outer face: darker plum with a sheen band; an additive crimson under-light
   sprite) baked per pixel with value-noise texture once, lazily (one sprite a frame, ~1-2 ms each; a cheap path fallback
   meanwhile); each petal is two segments (base and tip) drawn by an affine of its 3D frame, so it cups, foreshortens and
   curls; faces chosen by the normal toward the viewer, depth-sorted around the core. Stems are faceted crystal ribbons
   with two-facet thorns. Shards are the same petal sprite tumbling. Smoke puff sprite for the shockwave. All floor marks
   are light (violet rings, a soft glow, translucent violet-grey smoke that fades). Petals and stems dim near the pet.
   Pool / caps: particle counts go through H.n (Fewer effects), and with 3+ Night Blooms alive at once shards and embers
   are halved. Reduced motion: no camera shake. */
(() => {
  const S = ELEM_IMPL.dark.strong; delete S.undertow;
  const TAU = Math.PI * 2, GY = 0.55;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKY = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const CRIM = '#D0183F', RUBY = '#FF2D55', ROSE = '#FF8FA3';
  const TUNE = { range: 7.5, centreR: 1.7, satR: 1.1, centreK: 2.4, satK: 1.0, evoK: 0.1, satDist: 2.05, groupR: 1.8,
    centreDet: 1.45, satStag: 0.13, satSeed: 0.2, satGrow: 0.5, centreScale: 1, satScale: 0.66 };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const easeBack = u => { const s = 1.6; u -= 1; return u * u * ((s + 1) * u + s) + 1; };
  const NT = new Float32Array(4096); for (let i = 0; i < 4096; i++) NT[i] = R1(i * 0.731 + 0.17);
  const hash2 = (x, y) => NT[(x & 63) | ((y & 63) << 6)];
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const fbm = (x, y) => vnoise(x, y) * 0.5 + vnoise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.3 + vnoise(x * 4.1 + 9.1, y * 4.1 + 7.7) * 0.2;
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  let ACTIVE = 0;

  /* ================= baked sprites ================= */
  const SW = 112, SHh = 48, SPR = {};
  const hw = u => { if (u >= 1) return 0; const k = Math.sin(Math.PI * Math.pow(u, 0.72)); return (0.22 * (1 - u) + 0.78 * k) * (1 - Math.pow(u, 7)); };
  // kind: 'in' (the inner face, core-lit), 'out' (the outer face / underside), 'glow' (additive crimson under-light)
  // baked in row slices: job.row advances until done (a time budget per frame)
  function bakePetal(kind, J) {
    if (!J.cv) { J.cv = mk(SW, SHh); J.c = J.cv.getContext('2d'); J.id = J.c.createImageData(SW, SHh); J.row = 0; }
    const D = J.id.data, H2 = SHh / 2, py0 = J.row, py1 = Math.min(SHh, J.row + J.step);
    for (let py = py0; py < py1; py++) for (let px = 0; px < SW; px++) {
      const u = (px + 0.5) / SW, v = (py + 0.5 - H2) / H2, w = hw(u); if (w <= 0.01) continue; const e = Math.abs(v) / w; if (e >= 1) continue;
      const aa = cl((1 - e) * w * H2 / 1.1), i = (py * SW + px) * 4;
      if (kind === 'glow') { const k = Math.exp(-u * 2.6) * (1 - e * e) * 0.95 + 0.12 * (1 - u); D[i] = 255; D[i + 1] = 45; D[i + 2] = 85; D[i + 3] = Math.round(255 * cl(k) * aa); continue; }
      const n = fbm(u * 7, v * 2.2), st = vnoise(u * 3.2 + 4, v * 15), cup = 0.72 + 0.28 * (kind === 'in' ? (0.4 - v * 0.6) : (0.55 - v * 0.5)) - 0.18 * e * e;
      let r, g, b;
      if (kind === 'in') { r = lerp(34, 78, n * 0.7 + st * 0.3); g = lerp(12, 36, n * 0.6); b = lerp(74, 150, n * 0.7 + st * 0.3); }
      else { r = lerp(20, 52, n); g = lerp(9, 30, n); b = lerp(40, 88, n * 0.8 + st * 0.2); }
      r *= cup; g *= cup; b *= cup;
      // translucent violet edge and a crisp pale rim
      const ed = sm((e - 0.62) / 0.36); r = lerp(r, 165, ed * 0.75); g = lerp(g, 92, ed * 0.75); b = lerp(b, 255, ed * 0.75);
      const rim = Math.exp(-Math.pow((e - 0.93) / 0.045, 2)) * (0.55 + 0.45 * (1 - u)); r = lerp(r, 208, rim * 0.8); g = lerp(g, 174, rim * 0.8); b = lerp(b, 255, rim * 0.8);
      // crimson veins: a midrib and side veins fanning from the base, brightening toward the centre
      let vein = Math.exp(-Math.pow(v / 0.05, 2)) * (u < 0.92 ? 1 : 0);
      for (const k of [0.32, 0.6]) for (const sg of [-1, 1]) { const vv = sg * k * w * Math.sqrt(cl(u * 1.4)) * (0.85 + 0.15 * Math.sin(u * 9 + k * 7)); vein = Math.max(vein, 0.75 * Math.exp(-Math.pow((v - vv) / 0.04, 2)) * (u > 0.06 && u < 0.85 ? 1 : 0)); }
      const vb = vein * (kind === 'in' ? 0.75 : 0.35) * (0.2 + 0.8 * Math.pow(1 - u, 1.5));
      r = lerp(r, 255, cl(vb)); g = lerp(g, 45 + 60 * vb * (1 - u), cl(vb)); b = lerp(b, 85, cl(vb));
      if (kind === 'in') { const cg = Math.exp(-u * 4.5) * (1 - e * 0.5) * 0.32; r = lerp(r, 255, cg); g = lerp(g, 60, cg); b = lerp(b, 110, cg); }
      else { const sh = Math.exp(-Math.pow((v + 0.38) / 0.16, 2)) * sm((u - 0.15) / 0.2) * (1 - sm((u - 0.7) / 0.25)); r = lerp(r, 214, sh * 0.42); g = lerp(g, 190, sh * 0.42); b = lerp(b, 255, sh * 0.42); }
      const al = (kind === 'in' ? 0.9 : 0.95) * (1 - 0.28 * u * u) * (1 - 0.4 * ed) + 0.25 * rim;
      D[i] = Math.round(cl(r / 255) * 255); D[i + 1] = Math.round(cl(g / 255) * 255); D[i + 2] = Math.round(cl(b / 255) * 255); D[i + 3] = Math.round(255 * cl(al) * aa);
    }
    J.row = py1; if (J.row < SHh) return null; J.c.putImageData(J.id, 0, 0); return J.cv;
  }
  function bakeSmoke(J) {
    const N = 64; if (!J.cv) { J.cv = mk(N, N); J.c = J.cv.getContext('2d'); J.id = J.c.createImageData(N, N); J.row = 0; } const D = J.id.data, y0 = J.row, y1 = Math.min(N, J.row + J.step * 2);
    for (let y = y0; y < y1; y++) for (let x = 0; x < N; x++) { const dx = (x + 0.5) / N * 2 - 1, dy = (y + 0.5) / N * 2 - 1, d = Math.hypot(dx, dy); if (d >= 1) continue; const n = fbm(x / 9 + 3, y / 9 + 7), k = Math.pow(1 - d, 1.4) * (0.45 + 0.75 * n), i = (y * N + x) * 4; D[i] = Math.round(lerp(70, 150, n * n)); D[i + 1] = Math.round(lerp(48, 110, n * n)); D[i + 2] = Math.round(lerp(92, 200, n)); D[i + 3] = Math.round(255 * cl(k * 0.75)); }
    J.row = y1; if (J.row < N) return null; J.c.putImageData(J.id, 0, 0); return J.cv;
  }
  const BAKE = [['in', J => bakePetal('in', J)], ['out', J => bakePetal('out', J)], ['glow', J => bakePetal('glow', J)], ['smoke', bakeSmoke]];
  const BT = {}, JOB = {};
  // bake for up to `ms` this frame (2 rows at a time); true while anything is left
  function bakeOne(ms) { const t0 = performance.now(), lim = ms == null ? 1.0 : ms;
    for (const [k, fn] of BAKE) { if (SPR[k]) continue; const J = JOB[k] || (JOB[k] = { step: 2, ms: 0 });
      while (!SPR[k]) { const a = performance.now(), r = fn(J); J.ms += performance.now() - a; if (r) { SPR[k] = r; BT[k] = +J.ms.toFixed(2); } if (performance.now() - t0 > lim) return true; } }
    return BAKE.some(([k]) => !SPR[k]); }

  /* ================= geometry ================= */
  // world flower frame: x right, d toward the viewer (world +y), z up; screen = (sx + x T, sy + (d GY - z) T)
  const LAYERS = [{ n: 8, L: 0.95, W: 0.6, rb: 0.1, th: 0.2, cup: 0.42, ph: 0, st: 0 }, { n: 8, L: 0.8, W: 0.54, rb: 0.07, th: 0.62, cup: 0.42, ph: Math.PI / 8, st: 0.07 }, { n: 6, L: 0.56, W: 0.42, rb: 0.05, th: 0.88, cup: 0.3, ph: 0.3, st: 0.14 }];
  const BUD1 = 1.38, BUD2 = 1.5, CURL1 = 1.25, CURL2 = 2.3;
  // a petal segment as an affine of the sprite (source columns s0..s0+sw) from the 3D origin o (tiles) along unit axis A
  function seg(c, spr, SX, SY, T, o, A, Wv, len, wid, s0, sw, alpha) {
    const ax = A[0] * T * len, ay = (A[1] * GY - A[2]) * T * len, wx = Wv[0] * T * wid, wy = Wv[1] * GY * T * wid;
    c.save(); c.globalAlpha = alpha; c.transform(ax / (SW / 2), ay / (SW / 2), wx / SHh, wy / SHh, SX + o[0] * T, SY + (o[1] * GY - o[2]) * T);
    c.drawImage(spr, s0, 0, sw, SHh, 0, -SHh / 2, sw, SHh); c.restore();
  }
  function fallbackPetal(c, SX, SY, T, o, A, Wv, len, wid, inner, alpha) {
    const P = (u, v) => [SX + (o[0] + A[0] * len * u + Wv[0] * wid * v) * T, SY + ((o[1] + A[1] * len * u + Wv[1] * wid * v) * GY - (o[2] + A[2] * len * u)) * T];
    c.save(); c.globalAlpha = alpha; c.beginPath(); const a = P(0, 0); c.moveTo(a[0], a[1]); for (let i = 1; i <= 8; i++) { const u = i / 8, p = P(u, hw(u) * 0.5); c.lineTo(p[0], p[1]); } for (let i = 8; i >= 0; i--) { const u = i / 8, p = P(u, -hw(u) * 0.5); c.lineTo(p[0], p[1]); }
    c.fillStyle = inner ? 'rgba(92,40,128,0.88)' : 'rgba(34,16,60,0.92)'; c.fill(); c.strokeStyle = 'rgba(165,92,255,0.7)'; c.lineWidth = 1; c.stroke(); c.restore();
  }
  // the petals of one flower at (SX, SY) (its centre, already raised), state st = { k: [unfold per layer], curl, tw, s }
  function drawFlower(c, SX, SY, T, st, alpha, t) {
    const items = [], s = st.s;
    LAYERS.forEach((Ly, j) => { const k = st.k[j]; if (k <= 0) return; const kk = Math.max(0, k), L = Ly.L * s * lerp(0.32, 1, Math.min(1, kk)) * (1 - 0.12 * st.curl), Wd = Ly.W * s * lerp(0.55, 1, Math.min(1, kk));
      let t1 = lerp(BUD1, Ly.th, kk), t2 = lerp(BUD2, Ly.th + Ly.cup, kk); t1 = lerp(t1, Math.max(t1, CURL1 - j * 0.05), st.curl); t2 = lerp(t2, CURL2 + j * 0.1, st.curl);
      for (let i = 0; i < Ly.n; i++) { const ph = Ly.ph + i * TAU / Ly.n + st.tw + Math.sin(t * 1.3 + i) * 0.02, cp = Math.cos(ph), sp = Math.sin(ph), Wv = [-sp, cp, 0];
        const A1 = [Math.cos(t1) * cp, Math.cos(t1) * sp, Math.sin(t1)], A2 = [Math.cos(t2) * cp, Math.cos(t2) * sp, Math.sin(t2)], o = [cp * Ly.rb * s, sp * Ly.rb * s, 0];
        const o2 = [o[0] + A1[0] * L * 0.5, o[1] + A1[1] * L * 0.5, o[2] + A1[2] * L * 0.5], dep = o2[1] + A2[1] * L * 0.25 - (o2[2]) * 0.05;
        items.push({ dep, o, o2, A1, A2, Wv, L, Wd, ph, t1, t2, j }); } });
    items.push({ dep: 0.001, core: true });
    items.sort((a, b) => a.dep - b.dep);
    const sIn = SPR.in, sOut = SPR.out, sGl = SPR.glow, VD = [0, 1, GY];
    for (const it of items) {
      if (it.core) { drawCore(c, SX, SY, T, st, alpha, t); continue; }
      for (let q = 0; q < 2; q++) { const A = q ? it.A2 : it.A1, th = q ? it.t2 : it.t1, N = [-Math.sin(th) * Math.cos(it.ph), -Math.sin(th) * Math.sin(it.ph), Math.cos(th)], inner = N[1] * VD[1] + N[2] * VD[2] > 0, o = q ? it.o2 : it.o;
        if (sIn && sOut) { seg(c, inner ? sIn : sOut, SX, SY, T, o, A, it.Wv, it.L, it.Wd, q ? SW / 2 - 0.5 : 0, q ? SW / 2 + 0.5 : SW / 2 + 1, alpha);
          if (sGl && q === 0) { c.save(); c.globalCompositeOperation = 'lighter'; seg(c, sGl, SX, SY, T, o, A, it.Wv, it.L, it.Wd, 0, SW / 2 + 1, alpha * st.glow * (inner ? 0.42 : 0.16)); c.restore(); } }
        else if (q === 0) fallbackPetal(c, SX, SY, T, it.o, it.A1, it.Wv, it.L, it.Wd, inner, alpha); }
    }
    // the core's light through the translucent petals (stronger as they close over it), and its hot point
    const pulse = 0.75 + 0.25 * Math.sin(t * 13), y = SY - T * s * 0.2, k = Math.min(1, st.k[2] + 0.2);
    c.save(); c.globalCompositeOperation = 'lighter'; H.glow(c, SX, y, T * s * (0.6 + 0.25 * st.curl), RUBY, alpha * k * (0.45 + 0.4 * st.curl) * pulse * Math.min(1, st.glow + 0.3)); H.glow(c, SX, y, T * s * 0.22 * (1 - 0.4 * st.curl), '#FFD0DC', alpha * k * 0.7 * pulse); c.restore();
  }
  // the pulsing crimson core: a glossy sphere with a hot centre, its light spilling on the petals
  function drawCore(c, SX, SY, T, st, alpha, t) {
    const pulse = 1 + 0.13 * Math.sin(t * 13) * (1 - st.curl), r = Math.max(1, T * st.s * 0.17 * pulse * (1 - 0.55 * st.curl) * Math.min(1, st.k[0] * 1.5 + 0.3)), y = SY - T * st.s * 0.2, br = 0.6 + 0.4 * st.curl;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * (0.35 + 0.35 * st.glow); H.glow(c, SX, y, r * (3.2 + st.curl), RUBY, 0.55 * br); H.glow(c, SX, y, r * 1.8, CRIM, 0.5); c.restore();
    c.save(); c.globalAlpha = alpha; const g = c.createRadialGradient(SX - r * 0.3, y - r * 0.35, r * 0.05, SX, y, r); g.addColorStop(0, '#FFE3EA'); g.addColorStop(0.25, ROSE); g.addColorStop(0.55, RUBY); g.addColorStop(0.85, CRIM); g.addColorStop(1, '#4A0820'); c.fillStyle = g; c.beginPath(); c.arc(SX, y, r, 0, TAU); c.fill();
    c.strokeStyle = H.rgba(ACC, 0.5); c.lineWidth = 1; c.beginPath(); c.arc(SX, y, r, Math.PI * 0.95, Math.PI * 1.6); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(SX - r * 0.35, y - r * 0.4, Math.max(0.6, r * 0.16), 0, TAU); c.fill(); c.restore();
  }
  // thorned crystal stems spiralling up to the flower; g = growth 0..1, fade for the shatter
  function drawStems(c, F, SX, SY, T, g, alpha, t) {
    if (g <= 0) return; const s = F.s, h = F.h, N = F.central ? 3 : 2;
    for (let k = 0; k < N; k++) { const a0 = F.rot + k * TAU / N, dirS = k % 2 ? -1 : 1, pts = [], P3 = [];
      const M = 14; for (let i = 0; i <= M; i++) { const u = i / M * g, ang = a0 + dirS * u * Math.PI * 1.35, rad = s * (0.3 * (1 - u) + 0.05) + s * 0.05 * Math.sin(u * Math.PI), sway = Math.sin(t * 2 + k) * 0.03 * u * s, x = Math.cos(ang) * rad + sway, d = Math.sin(ang) * rad, z = u * h;
        P3.push([x, d, z, ang, u]); pts.push([SX + x * T, SY + (d * GY - z) * T]); }
      const wB = T * s * 0.085, wT = T * s * 0.03; c.save(); c.globalAlpha = alpha; c.lineCap = 'round'; c.lineJoin = 'round';
      for (let i = 1; i < pts.length; i++) { const u = i / (pts.length - 1), w = lerp(wB, wT, u * g); c.strokeStyle = H.rgba(EDGE, 0.55); c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
      for (let i = 1; i < pts.length; i++) { const u = i / (pts.length - 1), w = lerp(wB, wT, u * g); c.strokeStyle = i % 2 ? '#24103D' : '#170A29'; c.lineWidth = w; c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
      c.strokeStyle = H.rgba(ACC, 0.55); c.lineWidth = Math.max(0.6, wB * 0.22); c.beginPath(); for (let i = 0; i < pts.length; i++) { const u = i / (pts.length - 1), w = lerp(wB, wT, u * g); i ? c.lineTo(pts[i][0] - w * 0.28, pts[i][1]) : c.moveTo(pts[i][0] - w * 0.28, pts[i][1]); } c.stroke();
      // crimson sap glowing up the stem as it feeds the core
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(RUBY, 0.35 * F.glow); c.lineWidth = Math.max(0.5, wB * 0.15); c.setLineDash([T * 0.08, T * 0.14]); c.lineDashOffset = -t * T * 1.2; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.setLineDash([]); c.globalCompositeOperation = 'source-over';
      // faceted thorns
      for (let j = 0; j < 4; j++) { const u = 0.18 + j * 0.19 + k * 0.03; if (u > g - 0.04) break; const fi = u / g * M, i0 = Math.min(M - 1, Math.floor(fi)), p = P3[i0], ang = p[3] + (j % 2 ? 0.9 : -0.9), dir = [Math.cos(ang) * 0.8, Math.sin(ang) * 0.8, 0.55], L = s * 0.17 * (1 - u * 0.4) * sm((g - u) / 0.12);
        const bx = SX + p[0] * T, by = SY + (p[1] * GY - p[2]) * T, tx = bx + dir[0] * L * T, ty = by + (dir[1] * GY - dir[2]) * L * T, nx = -(ty - by), ny = tx - bx, nl = Math.hypot(nx, ny) || 1, bw = lerp(wB, wT, u) * 0.75, ox = nx / nl * bw, oy = ny / nl * bw;
        c.fillStyle = '#7B3FC4'; c.beginPath(); c.moveTo(bx + ox, by + oy); c.lineTo(tx, ty); c.lineTo(bx, by); c.closePath(); c.fill();
        c.fillStyle = '#1A0B2C'; c.beginPath(); c.moveTo(bx - ox, by - oy); c.lineTo(tx, ty); c.lineTo(bx, by); c.closePath(); c.fill();
        c.strokeStyle = H.rgba(ACC, 0.7); c.lineWidth = 0.8; c.beginPath(); c.moveTo(bx + ox, by + oy); c.lineTo(tx, ty); c.lineTo(bx - ox, by - oy); c.stroke(); }
      c.restore(); }
  }

  /* ================= the move ================= */
  let H = null;
  S.nightbloom = (C, h) => {
    H = h; const me = H.me, X = H.X, evo = evoOf(C), sfx = X.sfx || {}, note = (...a) => sfx.note && sfx.note(...a), chime = (...a) => sfx.chime && sfx.chime(...a), hiss = (...a) => sfx.hiss && sfx.hiss(...a);
    const DK = C.base * C.K * (1 + TUNE.evoK * (evo - 1)), nSat = evo >= 7 ? 4 : evo >= 4 ? 2 : 0;
    const solidish = (x, y) => X.blocked(x, y, 0.05, 1), walkable = (x, y) => !X.blocked(x, y, 0.32, 0);
    const clear = (x0, y0, x1, y1) => { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.15)); for (let i = 1; i <= n; i++) { const u = i / n; if (solidish(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u)) return false; } return true; };
    // the locked target point
    let tx = C.tx, ty = C.ty; const tm = C.A && C.A.t && !C.A.t.dead ? C.A.t : null;
    if (tm) { let sx = tm.x * 2, sy = tm.y * 2, w = 2; for (const m of H.living()) if (m !== tm && Math.hypot(m.x - tm.x, m.y - tm.y) < TUNE.groupR) { sx += m.x; sy += m.y; w++; } tx = lerp(tm.x, sx / w, 0.5); ty = lerp(tm.y, sy / w, 0.5); }
    { const d = Math.hypot(tx - me.x, ty - me.y); if (d > TUNE.range) { tx = me.x + (tx - me.x) / d * TUNE.range; ty = me.y + (ty - me.y) / d * TUNE.range; } }
    { const d = Math.hypot(tx - me.x, ty - me.y), n = Math.ceil(d / 0.15); for (let i = 1; i <= n; i++) { const u = i / n, x = me.x + (tx - me.x) * u, y = me.y + (ty - me.y) * u; if (solidish(x, y)) { const v = Math.max(0, (i - 2) / n); tx = me.x + (tx - me.x) * v; ty = me.y + (ty - me.y) * v; break; } } }
    if (!walkable(tx, ty)) { const p = H.walk(tx, ty); if (p) { tx = p.x; ty = p.y; } }
    const aim = C.a != null ? C.a : Math.atan2(ty - me.y, tx - me.x);
    const flowers = [{ central: true, x: tx, y: ty, R: TUNE.centreR, dmg: TUNE.centreK * DK, s: TUNE.centreScale, t0: 0, land: 0.26, det: TUNE.centreDet, show: 0, rot: R1(tx * 3.1 + ty) * TAU }];
    // satellites: opposite sides across the aim (2) or on the diagonals (4), on valid ground with no wall between
    const angs = nSat === 2 ? [aim + Math.PI / 2, aim - Math.PI / 2] : nSat === 4 ? [aim + Math.PI / 4, aim - Math.PI / 4, aim + Math.PI * 3 / 4, aim - Math.PI * 3 / 4] : [];
    let si = 0; for (const a0 of angs) { let got = null;
      for (const dm of [1, 0.8, 0.62]) { for (const da of [0, 0.35, -0.35, 0.7, -0.7]) { const a = a0 + da, x = tx + Math.cos(a) * TUNE.satDist * dm, y = ty + Math.sin(a) * TUNE.satDist * dm; if (!walkable(x, y) || !clear(tx, ty, x, y)) continue; if (flowers.some(f => !f.central && Math.hypot(f.x - x, f.y - y) < 1.1)) continue; got = { x, y }; break; } if (got) break; }
      if (!got) for (let q = 1; q < 12 && !got; q++) for (const dm of [1, 0.8, 0.62]) { const a = a0 + (q % 2 ? 1 : -1) * Math.ceil(q / 2) * Math.PI / 6, x = tx + Math.cos(a) * TUNE.satDist * dm, y = ty + Math.sin(a) * TUNE.satDist * dm; if (!walkable(x, y) || !clear(tx, ty, x, y) || flowers.some(f => !f.central && Math.hypot(f.x - x, f.y - y) < 1.1)) continue; got = { x, y }; break; }   // (anywhere else round the centre)
      if (!got) continue; const t0 = TUNE.centreDet + 0.04 + si * TUNE.satStag; si++;
      flowers.push({ central: false, x: got.x, y: got.y, R: TUNE.satR, dmg: TUNE.satK * DK, s: TUNE.satScale, t0, land: t0 + TUNE.satSeed, det: t0 + TUNE.satSeed + TUNE.satGrow, show: 0.55, rot: R1(got.x * 7.3 + got.y * 1.7) * TAU }); }
    for (const F of flowers) { F.h = F.s * 0.95; F.done = false; F.shards = []; F.drift = []; F.glow = 0; F.hits = 0; F.cue = 0; }
    const lastDet = flowers.reduce((m, F) => Math.max(m, F.det), 0), crowd = ACTIVE >= 2 ? 0.5 : 1; ACTIVE++;
    me.sq = 0.75; note(660, 0.18, 'triangle', 0.08, 990);
    const fxo = H.add({ key: 'nightbloom', x: tx, y: ty, life: lastDet + 1.45, flowers, nSat: flowers.length - 1, DK,
      onEnd() { ACTIVE = Math.max(0, ACTIVE - 1); },
      update(dt, f) {
        bakeOne(); const t = f.t;
        for (const F of flowers) {
          const lt = t - F.land;
          if (F.cue === 0 && t >= F.land) { F.cue = 1; if (F.central) { note(220, 0.16, 'sine', 0.22, 140); hiss(0.18, 0.06, 500); } else note(330, 0.12, 'sine', 0.12, 220); for (let i = 0; i < H.n(5); i++) { const a = Math.random() * TAU; H.P({ kind: 'spark', x: F.x, y: F.y, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.0, life: 0.35, max: 0.35, size: 1.4, color: i % 2 ? EDGE : ACC }); } }
          if (F.cue === 1 && lt > (F.central ? 0.35 : 0.12)) { F.cue = 2; if (F.central) { chime(1175, 0.35); note(1568, 0.3, 'triangle', 0.05, 2093, 0.08); chime(1397, 0.25); } else chime(1760, 0.22); }
          if (F.cue === 2 && t > F.det - (F.central ? 0.23 : 0.12)) { F.cue = 3; note(F.central ? 260 : 360, 0.22, 'sine', 0.12, F.central ? 720 : 900); }
          if (!F.done && t >= F.det) { F.done = true; F.hits = H.hitArea(F.x, F.y, F.R, F.dmg, C.dmgO({})) || 0; burst(F, crowd); }
          F.glow = t < F.land ? 0 : t < F.det ? cl(lt / 0.6) : 0;
          for (const p of F.shards) { p.t += dt; p.vz -= 7 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); if (p.z === 0) { p.vx *= 0.8; p.vy *= 0.8; p.vz = Math.abs(p.vz) * 0.25; } p.rot += p.vr * dt; p.spin += p.vs * dt; }
          for (const p of F.drift) { p.t += dt; p.z = Math.max(0, p.z - 0.55 * dt); p.x += (p.vx + Math.sin(p.t * 3 + p.ph) * 0.35) * dt; p.y += p.vy * dt; p.rot = p.r0 + Math.sin(p.t * 2.4 + p.ph) * 0.7; }
        }
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t;
        for (const F of flowers) { const SX = H.sx(F.x), SY = H.sy(F.y), rx = F.R * T, ry = rx * GY;
          // the ground indicator: a light violet area with a sweep showing the growth delay
          if (t >= F.show && t < F.det + 0.08) { const a = cl((t - F.show) / 0.25) * (t > F.det ? 1 - (t - F.det) / 0.08 : 1), pr = cl((t - Math.max(F.show, F.t0)) / (F.det - Math.max(F.show, F.t0))), near = cl((t - (F.det - 0.3)) / 0.3), act = t >= F.t0 ? 1 : 0.6;
            c.save(); const g = c.createRadialGradient(SX, SY, rx * 0.2, SX, SY, rx); g.addColorStop(0, H.rgba(EDGE, 0.02)); g.addColorStop(0.75, H.rgba(EDGE, 0.07 * a * act)); g.addColorStop(1, H.rgba(near > 0 ? RUBY : EDGE, (0.14 + 0.1 * near) * a)); c.fillStyle = g; c.beginPath(); c.ellipse(SX, SY, rx, ry, 0, 0, TAU); c.fill();
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(EDGE, 0.16 * a); c.lineWidth = 4; c.stroke(); c.globalCompositeOperation = 'source-over';
            c.strokeStyle = H.rgba(near > 0.5 && Math.sin(t * 40) > 0 ? ROSE : EDGE, (0.5 + 0.3 * near) * a * act); c.lineWidth = 1.4; c.setLineDash(F.central ? [] : [T * 0.12, T * 0.07]); c.lineDashOffset = -t * T * 0.4; c.stroke(); c.setLineDash([]);
            if (pr > 0 && t >= F.t0) { c.strokeStyle = H.rgba(ACC, 0.85 * a); c.lineWidth = 2.4; c.beginPath(); c.ellipse(SX, SY, rx * 0.86, ry * 0.86, 0, -Math.PI / 2, -Math.PI / 2 + pr * TAU); c.stroke(); }
            // petal glyphs round the rim
            const ng = F.central ? 8 : 5; c.fillStyle = H.rgba(ACC, 0.45 * a * act); for (let i = 0; i < ng; i++) { const an = i / ng * TAU + t * 0.6 + F.rot, px = SX + Math.cos(an) * rx * 0.93, py = SY + Math.sin(an) * ry * 0.93, gs = T * 0.09 * (F.central ? 1 : 0.8); c.save(); c.translate(px, py); c.scale(1, GY); c.rotate(an); c.beginPath(); c.moveTo(-gs, 0); c.quadraticCurveTo(0, -gs * 0.55, gs, 0); c.quadraticCurveTo(0, gs * 0.55, -gs, 0); c.fill(); c.restore(); }
            c.restore(); }
          // the seed's small dark ripple
          if (t >= F.land && t < F.land + 0.55) { const u = (t - F.land) / 0.55; c.save(); for (let i = 0; i < 2; i++) { const v = cl(u * 1.3 - i * 0.3); if (v <= 0) continue; const r = T * F.s * (0.15 + 0.75 * v); c.strokeStyle = H.rgba(BODY, 0.45 * (1 - v)); c.lineWidth = 3; c.beginPath(); c.ellipse(SX, SY, r * 0.9, r * 0.9 * GY, 0, 0, TAU); c.stroke(); c.strokeStyle = H.rgba(EDGE, 0.7 * (1 - v)); c.lineWidth = 1.2; c.beginPath(); c.ellipse(SX, SY, r, r * GY, 0, 0, TAU); c.stroke(); } c.restore(); }
          // under-glow of the growing flower (light only)
          if (t >= F.land && t < F.det + 0.9) { const k = t < F.det ? cl((t - F.land) / 0.4) * (0.5 + 0.5 * F.glow) : 1 - (t - F.det) / 0.9; H.glow(c, SX, SY, T * F.s * 1.1, CRIM, 0.14 * k); H.glow(c, SX, SY, T * F.s * 1.4, EDGE, 0.12 * k); }
          // the low smoky shockwave
          if (F.done && t < F.det + 0.85 && SPR.smoke) { const u = (t - F.det) / 0.85, e = 1 - Math.pow(1 - u, 2.2), np = F.central ? 16 : 10, rr = F.R * (0.2 + 0.95 * e);
            c.save(); for (let i = 0; i < np; i++) { const an = i / np * TAU + R1(i + F.rot) * 0.3, rj = rr * (0.9 + 0.2 * R1(i * 3.3 + F.rot)), px = SX + Math.cos(an) * rj * T, py = SY + Math.sin(an) * rj * T * GY - T * 0.08 * e, ps = T * F.s * (0.35 + 0.45 * e) * (0.8 + 0.4 * R1(i * 1.7)); c.globalAlpha = 0.55 * Math.pow(1 - u, 1.4); c.drawImage(SPR.smoke, px - ps, py - ps * 0.7, ps * 2, ps * 1.4); }
            c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1; c.strokeStyle = H.rgba(EDGE, 0.6 * (1 - u)); c.lineWidth = 2; c.beginPath(); c.ellipse(SX, SY, rr * T, rr * T * GY, 0, 0, TAU); c.stroke(); c.strokeStyle = H.rgba(RUBY, 0.4 * Math.max(0, 1 - u * 2)); c.lineWidth = 1.2; c.beginPath(); c.ellipse(SX, SY, rr * T * 0.8, rr * T * 0.8 * GY, 0, 0, TAU); c.stroke(); c.restore(); }
        }
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t, mx = H.sx(me.x), my = H.sy(me.y);
        for (const F of flowers) { const SX = H.sx(F.x), SY = H.sy(F.y), cov = Math.hypot(F.x - me.x, (F.y - me.y) * 1.2) < 1.15 * F.s + 0.4 && my > SY - T * 0.3 ? 0.55 : 1; void mx;
          // the seed: falling (central, from above) or arcing out of the central burst (satellites)
          if (t < F.land + 0.05 && t >= F.t0) { let x, y, z; const u = cl((t - F.t0) / (F.land - F.t0));
            if (F.central) { x = F.x; y = F.y; z = 2.6 * (1 - u * u); } else { const c0 = flowers[0]; x = lerp(c0.x, F.x, u); y = lerp(c0.y, F.y, u); z = lerp(c0.h * 0.6, 0, u) + Math.sin(u * Math.PI) * 1.1; }
            const px = H.sx(x), py = H.sy(y) - z * T, r = T * 0.11 * (F.central ? 1 : 0.8); H.softShadow(c, H.sx(x), H.sy(y), r * 1.5, 0.25 * u);
            H.glow(c, px, py, r * 3, EDGE, 0.5); c.save(); const g = c.createRadialGradient(px - r * 0.35, py - r * 0.4, r * 0.05, px, py, r); g.addColorStop(0, '#8E6BC0'); g.addColorStop(0.35, PLUM); g.addColorStop(1, VOID); c.fillStyle = g; c.beginPath(); c.ellipse(px, py, r * 0.8, r, 0, 0, TAU); c.fill(); c.strokeStyle = H.rgba(EDGE, 0.85); c.lineWidth = 1.2; c.stroke(); c.restore(); H.glow(c, px, py + r * 0.2, r * 0.9, RUBY, 0.6);
            if (u > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(ACC, 0.35); c.lineWidth = r * 0.6; c.beginPath(); c.moveTo(px, py); const back = F.central ? [px, py - T * 0.6] : [lerp(px, H.sx(flowers[0].x), 0.15), py - T * 0.25]; c.lineTo(back[0], back[1]); c.stroke(); c.restore(); }
          }
          if (t >= F.land && t < F.det + 0.3) { const lt = t - F.land, G = F.det - F.land, u = lt / G;
            const gS = sm(u / (F.central ? 0.43 : 0.42)), shatter = t > F.det ? (t - F.det) / 0.3 : 0, al = cov * (1 - shatter);
            const hR = F.h * gS, CX = SX, CY = SY - hR * T;
            drawStems(c, F, SX, SY, T, gS, al, t);
            if (!F.done) { const u0 = F.central ? 0.27 : 0.18, ud = F.central ? 0.33 : 0.45, k = LAYERS.map(Ly => { const v = (u - u0 - Ly.st * (F.central ? 1 : 0.7)) / ud; return v <= 0 ? (u > u0 - 0.1 ? 0.0001 : 0) : v >= 1 ? 1 : easeBack(v); }), cu = sm((u - 0.84) / 0.16), bud = cl((u - (u0 - 0.12)) / 0.1);
              if (bud > 0) { const st = { k: k.map(x => Math.max(x, 0.0001)), curl: cu, tw: F.rot + lt * 0.25, s: F.s * (0.4 + 0.6 * bud), glow: F.glow * (1 + cu) };
                H.glow(c, CX, CY, T * F.s * 1.2, EDGE, 0.12 * al); drawFlower(c, CX, CY, T, st, al, t); } }
          }
          // petal shards, embers, and the soft fading petals of the aftermath
          if (F.shards.length || F.drift.length) { const so = SPR.out, si = SPR.in;
            for (const p of F.shards) { const k = 1 - p.t / p.life; if (k <= 0) continue; const px = H.sx(p.x), py = H.sy(p.y) - p.z * T, L = p.L * T, Wd = L * 0.45 * Math.abs(Math.cos(p.spin)) + 0.6;
              c.save(); c.translate(px, py); c.rotate(p.rot); c.globalAlpha = Math.min(1, k * 1.6) * cov; if (so) { c.scale(L / SW, Wd / SHh); c.drawImage(Math.cos(p.spin) > 0 && si ? si : so, -SW * 0.5, -SHh / 2); } else { c.fillStyle = PLUM; c.fillRect(-L / 2, -Wd / 2, L, Wd); } c.restore();
              if (p.t < 0.25) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - p.t / 0.25) * 0.8; c.strokeStyle = p.hot ? ROSE : ACC; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px, py); c.lineTo(px - p.vx * T * 0.04, py - (p.vy * GY - p.vz) * T * 0.04); c.stroke(); c.restore(); } }
            for (const p of F.drift) { const k = 1 - p.t / p.life; if (k <= 0) continue; const px = H.sx(p.x), py = H.sy(p.y) - p.z * T, L = p.L * T;
              c.save(); c.translate(px, py); c.rotate(p.rot); c.globalAlpha = Math.min(1, k * 2) * 0.75 * cov; if (si) { c.scale(L / SW, L * 0.42 * (0.6 + 0.4 * Math.abs(Math.sin(p.t * 2 + p.ph))) / SHh); c.drawImage(si, -SW * 0.5, -SHh / 2); } c.restore(); }
          }
          // the burst's flash
          if (F.done && t < F.det + 0.35) { const u = (t - F.det) / 0.35, CY = SY - F.h * T; c.save(); c.globalCompositeOperation = 'lighter'; H.glow(c, SX, CY, T * F.s * (0.8 + 1.6 * u), RUBY, 0.9 * (1 - u)); H.glow(c, SX, CY, T * F.s * (0.4 + 0.8 * u), '#FFD6E0', 0.8 * (1 - u) * (1 - u)); c.strokeStyle = H.rgba(ACC, 0.7 * (1 - u)); c.lineWidth = 2 * (1 - u) + 0.5; c.beginPath(); c.ellipse(SX, CY + (SY - CY) * u, T * F.s * (0.3 + 1.4 * u), T * F.s * (0.3 + 1.4 * u) * lerp(0.8, GY, u), 0, 0, TAU); c.stroke(); c.restore(); }
        }
      } });
    // the detonation of flower F: one hit (above), then shards, smoke (drawn), embers, a flash, light, sound
    function burst(F, crowd) {
      const cen = F.central, n = Math.max(3, Math.round(H.n(cen ? 18 : 10) * crowd));
      for (let i = 0; i < n; i++) { const a = i / n * TAU + Math.random() * 0.3, v = (cen ? 3.4 : 2.6) * (0.6 + Math.random() * 0.6); F.shards.push({ t: 0, life: 0.7 + Math.random() * 0.35, x: F.x + Math.cos(a) * 0.15, y: F.y + Math.sin(a) * 0.15, z: F.h, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 1.2 + Math.random() * 2.2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, spin: Math.random() * TAU, vs: 6 + Math.random() * 10, L: F.s * (0.22 + Math.random() * 0.16), hot: i % 3 === 0 }); }
      const nd = Math.max(1, Math.round((cen ? 5 : 2) * crowd * H.Q())); for (let i = 0; i < nd; i++) { const a = Math.random() * TAU; F.drift.push({ t: 0, life: 1.25 + Math.random() * 0.3, x: F.x + Math.cos(a) * 0.4, y: F.y + Math.sin(a) * 0.3, z: F.h + 0.2 + Math.random() * 0.3, vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.3, ph: Math.random() * TAU, r0: Math.random() * TAU, rot: 0, L: F.s * (0.32 + Math.random() * 0.1) }); }
      const ne = Math.max(2, Math.round(H.n(cen ? 12 : 6) * crowd)); for (let i = 0; i < ne; i++) { const a = Math.random() * TAU, r = Math.random() * F.R * 0.7; H.P({ kind: 'ember', x: F.x + Math.cos(a) * r, y: F.y + Math.sin(a) * r * 0.7 - F.h * 0.5, vx: (Math.random() - 0.5) * 0.8, vy: -0.5 - Math.random() * 1.1, g: -0.2, life: 0.9 + Math.random() * 0.7, max: 1.4, size: 2 + Math.random() * 2.5, color: i % 3 ? RUBY : EDGE }); }
      H.burst(F.x, F.y - F.h * 0.4, 'shard', Math.round((cen ? 6 : 3) * crowd), { v: 3, up: 1.5, g: 8, life: 0.45, size: 3, color: [EDGE, ACC, PLUM] });
      H.X.light(F.x, F.y, F.R * 1.6, 0.3);
      if (!RM()) H.X.shake(cen ? 5 : 3, cen ? 0.16 : 0.1);
      note(cen ? 55 : 82, cen ? 0.6 : 0.35, 'sine', cen ? 0.6 : 0.4, cen ? 30 : 50); note(cen ? 110 : 165, 0.3, 'triangle', 0.15, 60); sfx.crash && sfx.crash(); hiss(cen ? 0.45 : 0.25, cen ? 0.18 : 0.1, 420);
    }
    return fxo;
  };
  S.nightbloom.TUNE = TUNE;
  S.nightbloom.BT = BT;
  S.nightbloom.warm = () => { while (bakeOne(1e9)) { /* (bake every sprite) */ } };
})();
