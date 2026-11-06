/* ---------- Earth, reworked: World Shaking ----------
   One huge golden orb in a tilted, beveled stone-gold ring. Golden fragments spiral in front of the pet and become the
   orb's bands while a narrow streak of light closes into its ring; a short hold, then it accelerates forward along the
   aim, skimming the floor (it stops at a wall), spinning on its own tilted axis while the ring turns more slowly on
   another. Under it a strip of floor fractures lights up and fades, small stones hop in weighted arcs, a faint amber
   pressure ripple spreads sideways (two at Adept); behind it a dark ember trail: charcoal flakes with glowing amber rims
   that tumble, cool and crumble to dust, smoky gold strands and tiny mineral sparks, brightest near the orb. At the end
   of its route it slows, the ring tightens round the core and it releases one radial Earth burst.
   Sizes: orb diameter 1.5 / 1.8 / 2.2 H, route 5 / 6.5 / 8 H (Hatchling / Adept / Celestial, levels between
   interpolate; both scale with K). Celestial: slow floating mineral segments round the ring, a broader fracture wake.
   Damage (DK = base x K x evoK): contact ticks every 0.25 s on monsters the orb overlaps (a monster crossed by the orb
   takes up to 7.5 / 9 / 11 x DK from them: half of that per tick, capped per monster), slowed while ground;
   then the finale burst 6 / 7 / 8 x DK (kb 5, stun 0.45) round the end point. The trail and debris are cosmetic.
   The models: the orb is rendered per pixel once per size into 32 spin frames (a lat-long mineral map of bands,
   seams, veins and pockets turned about a tilted axis; Adept adds a counter-turning inner band layer seen through the
   translucent outer one; cel-softened light, a dark limb, a pale rim, a gloss point, a soft ink edge); the ring is
   ray-marched once per size as a chamfered torus (dark gold sides, grooved faces, catching bevels, a luminous inner
   edge) split into a back and a front half that sandwich the orb; its studs and glints move to show its turn. Every
   floor mark is light only and fades; near the pet the orb dims smoothly. No per-frame gradients, no shadowBlur. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.worldspine;
  const TAU = Math.PI * 2, SE = Math.sin(0.62), CE = Math.cos(0.62);
  const DEEP = '#2A2118', AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', CORE = '#FFF4D6';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  let H;
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorSpr(c, img, X, Y, r, a, add) { if (r < 1 || !(a > 0.01)) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d, k: a }; }

  /* ---- value noise (3D, smooth) ---- */
  const HT = (() => { const a = new Float32Array(4096); for (let i = 0; i < 4096; i++) a[i] = R1(i * 1.618 + 0.5); return a; })();
  const h3 = (i, j, k) => HT[((i * 73856093) ^ (j * 19349663) ^ (k * 83492791)) & 4095];
  function vn3(x, y, z) { const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = x - i, fy = y - j, fz = z - k, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const a = h3(i, j, k), b = h3(i + 1, j, k), c = h3(i, j + 1, k), d = h3(i + 1, j + 1, k), e = h3(i, j, k + 1), f = h3(i + 1, j, k + 1), g = h3(i, j + 1, k + 1), hh = h3(i + 1, j + 1, k + 1);
    const x1 = a + (b - a) * u, x2 = c + (d - c) * u, x3 = e + (f - e) * u, x4 = g + (hh - g) * u, y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v; return y1 + (y2 - y1) * w; }
  function fbm3(x, y, z, o) { let s = 0, a = 0.5, n = 0; for (let k = 0; k < o; k++) { s += a * vn3(x, y, z); n += a; x = x * 2.03 + 1.7; y = y * 2.03 - 0.9; z = z * 2.03 + 0.4; a *= 0.5; } return s / n; }

  /* ---- cached soft sprites (every edge feathered) ---- */
  const radial = (key, S, stops) => fxSprite(key, S, S, g => { const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, S, S); });
  // a light-only floor band (the pressure ripples): feathered both sides
  const bandSpr = () => radial('ewsband', 256, [[0, 'rgba(217,138,30,0)'], [0.58, 'rgba(217,138,30,0)'], [0.79, 'rgba(217,138,30,0.2)'], [0.9, 'rgba(242,183,58,0.55)'], [0.955, 'rgba(255,233,184,0.7)'], [1, 'rgba(255,233,184,0)']]);
  // the finale's wide light band
  const wideSpr = () => radial('ewswide', 256, [[0, 'rgba(217,138,30,0)'], [0.36, 'rgba(217,138,30,0)'], [0.68, 'rgba(217,138,30,0.28)'], [0.84, 'rgba(255,207,92,0.65)'], [0.9, 'rgba(255,244,214,0.6)'], [0.96, 'rgba(255,233,184,0.22)'], [1, 'rgba(255,233,184,0)']]);
  const puffSpr = () => radial('ewspuff', 96, [[0, 'rgba(168,136,98,0.42)'], [0.5, 'rgba(128,100,72,0.22)'], [1, 'rgba(92,65,38,0)']]);
  const hazeSpr = () => radial('ewshaze', 96, [[0, 'rgba(28,20,14,0.5)'], [0.5, 'rgba(42,33,24,0.26)'], [1, 'rgba(58,48,40,0)']]);
  const shadowSpr = () => radial('ewsshad', 64, [[0, 'rgba(10,6,3,0.5)'], [0.55, 'rgba(10,6,3,0.22)'], [1, 'rgba(10,6,3,0)']]);
  // a charcoal flake: hot (amber rim, ember cracks) or cold (dull rim)
  const flakeSpr = (hot, v) => fxSprite('ewsfl' + hot + v, 40, 40, g => {
    const pts = []; const n = 5 + v; for (let i = 0; i < n; i++) { const a = i / n * TAU + R1(v * 7 + i) * 0.7, r = 10 + R1(v * 3 + i * 1.7) * 7; pts.push([20 + Math.cos(a) * r, 20 + Math.sin(a) * r * 0.8]); }
    const path = k => { g.beginPath(); pts.forEach((p, i) => { const x = 20 + (p[0] - 20) * k, y = 20 + (p[1] - 20) * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
    g.lineJoin = 'round';
    if (hot) { path(1); g.strokeStyle = 'rgba(217,138,30,0.28)'; g.lineWidth = 6; g.stroke(); g.strokeStyle = 'rgba(255,207,92,0.95)'; g.lineWidth = 2.6; g.stroke(); }
    path(hot ? 0.9 : 1); g.fillStyle = '#2A2118'; g.fill(); path(hot ? 0.62 : 0.7); g.fillStyle = '#3A3028'; g.fill();
    if (hot) { g.strokeStyle = 'rgba(255,170,60,0.85)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(14, 18); g.lineTo(20, 21); g.lineTo(25, 17); g.moveTo(20, 21); g.lineTo(21, 27); g.stroke(); }
    else { path(1); g.strokeStyle = 'rgba(120,96,70,0.7)'; g.lineWidth = 1.2; g.stroke(); } });
  // a golden crystal fleck
  const shardSpr = v => fxSprite('ewssh' + v, 32, 32, g => { const w = 4 + v * 1.5, L = 13; g.translate(16, 16); g.rotate(v * 0.7);
    const gr = g.createLinearGradient(-w, -L, w, L); gr.addColorStop(0, '#FFF4D6'); gr.addColorStop(0.4, '#FFCF5C'); gr.addColorStop(0.75, '#D98A1E'); gr.addColorStop(1, '#7A5218');
    g.beginPath(); g.moveTo(0, -L); g.lineTo(w, -2); g.lineTo(w * 0.6, L * 0.7); g.lineTo(0, L); g.lineTo(-w, 1); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(92,52,12,0.9)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -L + 2); g.lineTo(-w * 0.6, 0); g.stroke(); });
  // a lit pebble (per pixel: a lumpy height field, light from the upper left, a soft ink edge); gold = a ring chunk
  const rockSpr = (v, gold) => fxSprite('ewsrk' + v + (gold ? 'g' : ''), 48, 48, (g, W) => {
    const im = g.createImageData(W, W), d = im.data, Hf = new Float32Array(W * W), s0 = 7 + v * 13, L = nrm([-0.55, -0.6, 0.58]);
    const RAMP = gold ? [[30, 20, 12], [92, 60, 24], [168, 112, 34], [232, 170, 60], [255, 228, 160]] : [[26, 19, 13], [52, 41, 31], [86, 66, 46], [128, 104, 78], [186, 160, 124]];
    for (let py = 0; py < W; py++) for (let px = 0; px < W; px++) { const x = (px + 0.5 - 24) / 19, y = (py + 0.5 - 25) / 15, an = Math.atan2(y, x), edge = 0.78 + 0.22 * vn3(Math.cos(an) * 1.6 + s0, Math.sin(an) * 1.6, s0), rr = Math.hypot(x, y) / edge;
      Hf[py * W + px] = rr < 1 ? Math.sqrt(1 - rr * rr) * 0.8 + 0.18 * vn3(px * 0.22, py * 0.22, s0 + 3) - (gold ? 0 : 0.08 * Math.abs(Math.sin(px * 0.4 + py * 0.25 + v))) : -1; }
    for (let py = 1; py < W - 1; py++) for (let px = 1; px < W - 1; px++) { const i = py * W + px, z = Hf[i]; if (z < 0) continue;
      const gx = (Math.max(0, Hf[i + 1]) - Math.max(0, Hf[i - 1])) * 4, gy = (Math.max(0, Hf[i + W]) - Math.max(0, Hf[i - W])) * 4, n = nrm([-gx, -gy, 1]), ndl = Math.max(0, dot(n, L));
      const b = cl(0.12 + 0.55 * (0.3 * sstep(0.1, 0.25, ndl) + 0.35 * sstep(0.4, 0.55, ndl) + 0.35 * sstep(0.7, 0.85, ndl)) + 0.3 * ndl) * 4, ri = Math.min(3, Math.floor(b)), rf = b - ri, A = RAMP[ri], B = RAMP[ri + 1];
      let edge = 1; for (const o of [1, -1, W, -W]) if (Hf[i + o] < 0) edge = 0.45;
      const o = i * 4; d[o] = (A[0] + (B[0] - A[0]) * rf) * edge; d[o + 1] = (A[1] + (B[1] - A[1]) * rf) * edge; d[o + 2] = (A[2] + (B[2] - A[2]) * rf) * edge; d[o + 3] = edge < 1 ? 200 : 255;
      if (!gold && R1(i * 0.37 + v) > 0.985) { d[o] = 255; d[o + 1] = 190; d[o + 2] = 80; } }
    g.putImageData(im, 0, 0); });
  // a fallback orb for the first frames on a slow device (the real one is still being built)
  const orbFB = () => fxSprite('ewsorbfb', 128, 128, g => { const gr = g.createRadialGradient(46, 42, 4, 64, 64, 62); gr.addColorStop(0, '#FFF4D6'); gr.addColorStop(0.3, '#FFCF5C'); gr.addColorStop(0.7, '#D98A1E'); gr.addColorStop(0.95, '#7A4210'); gr.addColorStop(1, 'rgba(92,52,12,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });

  /* ================= the orb: a lat-long mineral map turned on a tilted axis, rendered per pixel ================= */
  const TW = 256, TH = 128, NPH = 32;
  // the tone ramp: amber pockets -> gold -> honey -> pale -> the ember core
  const LUT = (() => { const st = [[0, [46, 22, 6]], [0.22, [112, 58, 14]], [0.42, [190, 112, 26]], [0.6, [232, 160, 42]], [0.76, [247, 198, 74]], [0.9, [255, 226, 150]], [1, [255, 244, 214]]], o = new Float32Array(256 * 3);
    for (let i = 0; i < 256; i++) { const u = i / 255; let k = 0; while (k < st.length - 2 && u > st[k + 1][0]) k++; const e = (u - st[k][0]) / (st[k + 1][0] - st[k][0]); for (let j = 0; j < 3; j++) o[i * 3 + j] = lerp(st[k][1][j], st[k + 1][1][j], cl(e)); } return o; })();
  const TEX = {};
  function* buildTex(ade, out) {
    const tone = new Float32Array(TW * TH), seam = new Float32Array(TW * TH), NB = ade ? 3.3 : 2.5, sd = ade ? 11 : 3;
    for (let j = 0; j < TH; j++) { const lat = ((j + 0.5) / TH - 0.5) * Math.PI, cL = Math.cos(lat), sL = Math.sin(lat);
      for (let i = 0; i < TW; i++) { const lon = (i + 0.5) / TW * TAU, x = cL * Math.cos(lon), y = cL * Math.sin(lon), z = sL;
        const w1 = fbm3(x * 1.7 + sd, y * 1.7, z * 1.7, 3), w2 = fbm3(x * 4.6, y * 4.6 + 9, z * 4.6, 2);
        const arg = sL * NB + (w1 - 0.5) * 1.5 + (w2 - 0.5) * 0.35, band = 0.5 + 0.5 * Math.sin(arg * TAU);
        const grain = fbm3(x * 9 + 3, y * 9, z * 9 + 7, 2), pocket = sstep(0.56, 0.72, fbm3(x * 2.6 + 21, y * 2.6, z * 2.6, 3));
        const fr = arg - Math.floor(arg), bd = Math.min(Math.abs(fr - 0.25), Math.abs(fr - 0.75)), sb = Math.exp(-Math.pow(bd / 0.03, 2)) * (0.45 + 0.55 * grain);
        const rn = 1 - Math.abs(2 * fbm3(x * 3.3 + 31, y * 3.3, z * 3.3, 3) - 1), vein = Math.pow(rn, 14);
        const k = j * TW + i; tone[k] = cl(0.26 + 0.58 * band + 0.28 * (grain - 0.5) - 0.42 * pocket + 0.12 * vein); seam[k] = cl(Math.max(sb * 0.75 * (1 - 0.6 * pocket), vein * 0.95)); }
      if (j % 6 === 5) yield 0; }
    out.tone = tone; out.seam = seam; out.ready = true;
  }
  function texFor(ade) { const k = ade ? 1 : 0; if (!TEX[k]) { const T = { ready: false }; T.it = buildTex(ade, T); TEX[k] = T; } return TEX[k]; }
  // bilinear lookups in the map (u wraps, v clamps)
  function samp(A, u, v) { u -= Math.floor(u / TW) * TW; v = v < 0 ? 0 : v > TH - 1.001 ? TH - 1.001 : v; const i = Math.floor(u), j = Math.floor(v), e = u - i, f = v - j, i2 = (i + 1) % TW, a = A[j * TW + i], b = A[j * TW + i2], c = A[(j + 1) * TW + i], d = A[(j + 1) * TW + i2]; return (a + (b - a) * e) * (1 - f) + (c + (d - c) * e) * f; }
  // the spin axes (screen space: x right, y down, z toward the viewer): outer tilted, inner on its own
  const AX = nrm([-0.3, -0.88, 0.37]), AX2 = nrm([0.55, -0.62, 0.56]);
  const basis = A => { const b1 = nrm(cross(A, Math.abs(A[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), b2 = cross(A, b1); return [b1, b2]; };
  const LS = nrm([-0.5, -0.66, 0.56]), HV = nrm([LS[0], LS[1], LS[2] + 1]);
  function* buildOrb(D, ade, S) {
    const T = texFor(ade); while (!T.ready) { T.it.next(); yield 0; }
    const PAD = 3, W = D + PAD * 2, r = D / 2, cx = W / 2, [B1, B2] = basis(AX), [C1, C2] = basis(AX2), RI = 0.66;
    const idx = [], pv = []; // per pixel: v, u0, mul, addR, addG, addB, alpha, ink, kIn, v2, u2
    for (let py = 0; py < W; py++) for (let px = 0; px < W; px++) { const x = (px + 0.5 - cx) / r, y = (py + 0.5 - cx) / r, rr2 = x * x + y * y; if (rr2 > Math.pow(1 + 1 / r, 2)) continue;
      const rr = Math.sqrt(rr2), z = Math.sqrt(Math.max(0, 1 - Math.min(1, rr2))), n = [x / Math.max(1, rr), y / Math.max(1, rr), z];
      const lat = Math.asin(cl(dot(n, AX) * 0.5 + 0.5) * 2 - 1), lon = Math.atan2(dot(n, B2), dot(n, B1));
      const ndl = Math.max(0, dot(n, LS)), ndh = Math.max(0, dot(n, HV));
      const cel = 0.3 * sstep(0.02, 0.16, ndl) + 0.35 * sstep(0.32, 0.46, ndl) + 0.35 * sstep(0.64, 0.78, ndl);
      let mul = 0.42 + 0.56 * (0.55 * cel + 0.45 * ndl); const limb = Math.pow(1 - z, 1.6) * cl(0.2 + x * 0.5 + y * 0.75); mul *= 1 - 0.62 * limb;
      const n4 = ndh * ndh * ndh * ndh, n16 = n4 * n4 * n4 * n4, spec = n16 * n16 * 0.85 + n4 * n4 * 0.1, rim = Math.pow(1 - z, 3) * cl(-(x * 0.7 + y * 0.72)) * 0.6, bounce = Math.pow(1 - z, 2.4) * cl(y * 0.9 + x * 0.2) * 0.4;
      const dpx = (1 - rr) * r, alpha = cl(dpx + 0.5), ink = 0.42 + 0.58 * sstep(0, 3.2, dpx);
      let kIn = 0, v2 = 0, u2 = 0;
      if (rr < RI) { const z2 = Math.sqrt(RI * RI - rr2) / RI, m = [x / RI, y / RI, z2], l2 = Math.asin(Math.max(-1, Math.min(1, dot(m, AX2)))), o2 = Math.atan2(dot(m, C2), dot(m, C1)); kIn = (ade ? 0.62 : 0.3) * sstep(0, 0.25, z2); v2 = (l2 / Math.PI + 0.5) * TH - 0.5; u2 = o2 / TAU * TW; }
      idx.push((py * W + px) * 4); pv.push((lat / Math.PI + 0.5) * TH - 0.5, lon / TAU * TW, mul, 255 * (spec + rim) + 217 * bounce, 250 * spec + 233 * rim + 138 * bounce, 230 * spec + 184 * rim + 30 * bounce, alpha, ink, kIn, v2, u2); }
    yield 0;
    Object.assign(S, { W, PAD, D, frames: new Array(NPH).fill(null) });
    // the frames in a bit-reversed order: a few early ones cover the whole turn coarsely
    const ord = []; for (let i = 0; i < NPH; i++) { let b = 0; for (let k = 0, x = i; k < 5; k++, x >>= 1) b = (b << 1) | (x & 1); ord.push(b); }
    for (const fi of ord) { const ph = fi / NPH, cv = document.createElement('canvas'); cv.width = cv.height = W; const g = cv.getContext('2d'), im = g.createImageData(W, W), d = im.data;
      for (let q = 0, p = 0; q < idx.length; q++, p += 11) { const v = pv[p], u = pv[p + 1] - ph * TW, tn = samp(T.tone, u, v), sn = samp(T.seam, u, v), li = Math.min(255, Math.round(tn * 255)) * 3;
        let cr = LUT[li], cg = LUT[li + 1], cb = LUT[li + 2];
        const kIn = pv[p + 8]; if (kIn > 0) { const u2 = pv[p + 10] + ph * 2 * TW, v2 = pv[p + 9], t2 = samp(T.tone, u2 + 37, v2), s2 = samp(T.seam, u2 + 91, TH - 1 - v2), l2 = Math.min(255, Math.round(cl(t2 * 1.05 + 0.1) * 255)) * 3, tr = kIn * (1 - sstep(0.45, 0.85, tn)) * (1 - sn * 0.6);
          cr = cr * (1 - tr) + (LUT[l2] * 1.08 + 255 * s2 * 0.7) * tr; cg = cg * (1 - tr) + (LUT[l2 + 1] * 1.08 + 236 * s2 * 0.7) * tr; cb = cb * (1 - tr) + (LUT[l2 + 2] * 1.08 + 190 * s2 * 0.7) * tr; }
        const mul = pv[p + 2], ink = pv[p + 7], em = sn * (0.62 + 0.38 * mul);
        const o = idx[q]; d[o] = Math.min(255, (cr * mul + pv[p + 3] + 255 * em) * ink); d[o + 1] = Math.min(255, (cg * mul + pv[p + 4] + 240 * em) * ink); d[o + 2] = Math.min(255, (cb * mul + pv[p + 5] + 196 * em) * ink); d[o + 3] = 255 * pv[p + 6]; }
      g.putImageData(im, 0, 0); S.frames[fi] = cv; S.nf = (S.nf || 0) + 1; yield 0; }
  }

  /* ================= the ring: a chamfered torus ray-marched once per size ================= */
  const RM = 1.46, RA = 0.17, RBh = 0.1, RCH = 0.05, TL = 1.15, ROT = -0.3;   // radii in orb radii; tilt; turn on screen
  const rz = v => [v[0] * Math.cos(ROT) - v[1] * Math.sin(ROT), v[0] * Math.sin(ROT) + v[1] * Math.cos(ROT), v[2]];
  const E1 = rz([1, 0, 0]), E2 = rz([0, Math.cos(TL), Math.sin(TL)]), EN = rz([0, -Math.sin(TL), Math.cos(TL)]);
  // a point of the ring's plane (local u, v, w in orb radii) in screen space
  const ringPt = (u, v, w) => [u * E1[0] + v * E2[0] + w * EN[0], u * E1[1] + v * E2[1] + w * EN[1], u * E1[2] + v * E2[2] + w * EN[2]];
  function rsdf(u, v, w) { const qx = Math.abs(Math.hypot(u, v) - RM), qy = Math.abs(w), ax = qx - RA, ay = qy - RBh, box = Math.hypot(Math.max(ax, 0), Math.max(ay, 0)) + Math.min(Math.max(ax, ay), 0); return Math.max(box, (qx + qy - (RA + RBh - RCH)) * 0.7071); }
  function* buildRing(D, S) {
    const r = D / 2; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let k = 0; k < 64; k++) { const a = k / 64 * TAU; for (const w of [-RBh, RBh]) { const p = ringPt(Math.cos(a) * (RM + RA), Math.sin(a) * (RM + RA), w); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } }
    const PAD = 3, W = Math.ceil((x1 - x0) * r) + PAD * 2, Hh = Math.ceil((y1 - y0) * r) + PAD * 2, ox = PAD - x0 * r, oy = PAD - y0 * r;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; return cv; }, back = mk(), front = mk(), gb = back.getContext('2d'), gf = front.getContext('2d'), ib = gb.createImageData(W, Hh), iF = gf.createImageData(W, Hh);
    const dl = [-E1[2], -E2[2], -EN[2]], RAMP = [[22, 16, 10], [46, 33, 20], [80, 56, 30], [128, 88, 30], [196, 140, 40], [242, 190, 80], [255, 232, 170]];
    for (let py = 0; py < Hh; py++) { for (let px = 0; px < W; px++) { const X = (px + 0.5 - ox) / r, Y = (py + 0.5 - oy) / r, o0 = [X, Y, 4];
        const ol = [dot(o0, E1), dot(o0, E2), dot(o0, EN)], t0 = ol[2] / EN[2], pu = ol[0] + t0 * dl[0], pvv = ol[1] + t0 * dl[1];
        if (Math.abs(Math.hypot(pu, pvv) - RM) > RA + 0.32) continue;
        let t = t0 - 0.45, hit = false, md = 9; for (let s = 0; s < 48; s++) { const u = ol[0] + t * dl[0], v = ol[1] + t * dl[1], w = ol[2] + t * dl[2], dd = rsdf(u, v, w); if (dd < md) md = dd; if (dd < 0.0015) { hit = true; break; } t += Math.max(dd * 0.9, 0.002); if (t > t0 + 0.45) break; }
        const o = (py * W + px) * 4;
        if (!hit) { const cov = 1 - md * r; if (cov > 0) { const D2 = (4 - t0) > 0 ? iF.data : ib.data; D2[o] = 30; D2[o + 1] = 20; D2[o + 2] = 10; D2[o + 3] = 200 * cl(cov); } continue; }
        const u = ol[0] + t * dl[0], v = ol[1] + t * dl[1], w = ol[2] + t * dl[2], e = 0.003;
        const nl = nrm([rsdf(u + e, v, w) - rsdf(u - e, v, w), rsdf(u, v + e, w) - rsdf(u, v - e, w), rsdf(u, v, w + e) - rsdf(u, v, w - e)]), n = ringPt(nl[0], nl[1], nl[2]);
        const rad = Math.hypot(u, v), ru = u / rad, rv = v / rad, nr = nl[0] * ru + nl[1] * rv, nw = nl[2], qx = rad - RM, th = Math.atan2(v, u);
        const ndl = Math.max(0, dot(n, LS)), ndh = Math.max(0, dot(n, HV)), cel = 0.3 * sstep(0.04, 0.18, ndl) + 0.35 * sstep(0.34, 0.48, ndl) + 0.35 * sstep(0.66, 0.8, ndl);
        let tone = 0.14 + 0.48 * cel + 0.2 * ndl + 0.06 * (vn3(th * 40, qx * 70, w * 70) - 0.5) + 0.04 * (vn3(th * 160, qx * 200, 3) - 0.5);
        if (Math.abs(nw) > 0.8) { const gq = Math.exp(-Math.pow((Math.abs(qx) - 0.066) / 0.011, 2)); tone -= 0.2 * gq; tone += 0.08 * Math.exp(-Math.pow((Math.abs(qx) - 0.083) / 0.008, 2)); }
        if (Math.abs(nr) > 0.3 && Math.abs(nr) < 0.92 && Math.abs(nw) > 0.3) tone += 0.12 * cl(ndl * 1.5);   // the bevels catch the light
        if (nr > 0.6) tone -= 0.08;   // the outer face is the darkest gold
        const b = cl(tone) * 6, ri = Math.min(5, Math.floor(b)), rf = b - ri, A = RAMP[ri], B = RAMP[ri + 1];
        let cr = A[0] + (B[0] - A[0]) * rf, cg = A[1] + (B[1] - A[1]) * rf, cb = A[2] + (B[2] - A[2]) * rf;
        const n8 = Math.pow(ndh, 36); cr += 255 * n8 * 0.8; cg += 240 * n8 * 0.8; cb += 200 * n8 * 0.8;
        // the luminous inner edge: the faces turned toward the orb glow honey to ember white
        const em = cl((-nr - 0.25) / 0.6); if (em > 0) { const k2 = em * (0.75 + 0.25 * Math.sin(th * 6)); cr = lerp(cr, 255, k2 * 0.85); cg = lerp(cg, 214 + 30 * em, k2 * 0.85); cb = lerp(cb, 120 + 90 * em * em, k2 * 0.85); }
        const ink = 0.4 + 0.6 * sstep(0.04, 0.32, Math.abs(n[2])), zf = 4 - t, D2 = zf > 0 ? iF.data : ib.data;
        D2[o] = Math.min(255, cr * ink); D2[o + 1] = Math.min(255, cg * ink); D2[o + 2] = Math.min(255, cb * ink); D2[o + 3] = 255; }
      if (py % 8 === 7) yield 0; }
    gb.putImageData(ib, 0, 0); gf.putImageData(iF, 0, 0); Object.assign(S, { back, front, W, H: Hh, ox, oy, r }); S.ready = true;
  }
  const ORBC = {};
  function orbFor(D, ade) { const key = D + ':' + (ade ? 1 : 0); if (ORBC[key]) return ORBC[key];
    const S = { ring: { ready: false } }; const io = buildOrb(D, ade, S), ir = buildRing(D, S.ring);
    // the first four spin frames, then the ring, then the rest
    S.step = ms => { const t0 = performance.now(); while (!S.done && performance.now() - t0 < ms) {
      if (!S.oDone && ((S.nf || 0) < 4 || S.ring.ready)) { if (io.next().done) S.oDone = true; }
      else if (!S.ring.ready) ir.next();
      if (S.oDone && S.ring.ready) S.done = true; } };
    ORBC[key] = S; return S; }

  /* ---- a convex solid painted in screen space (x right, y down, z toward the viewer): the Celestial mineral segments ---- */
  function paintSolid(c, M, Rm, cx, cy, s, alpha) {
    const P = M.v.map(p => { const q = [Rm[0] * p[0] + Rm[1] * p[1] + Rm[2] * p[2], Rm[3] * p[0] + Rm[4] * p[1] + Rm[5] * p[2], Rm[6] * p[0] + Rm[7] * p[1] + Rm[8] * p[2]]; return [cx + q[0] * s, cy + q[1] * s, q[2] * s]; });
    const vis = new Array(M.f.length), RAMP = [[30, 22, 15], [58, 46, 34], [96, 72, 44], [150, 116, 70]];
    c.save(); c.globalAlpha = alpha; c.lineJoin = 'round';
    M.f.forEach((F, i) => { const a = P[F[0]], b = P[F[1]], d = P[F[2]], n = nrm(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [d[0] - a[0], d[1] - a[1], d[2] - a[2]])); vis[i] = n[2] > 0.01; if (!vis[i]) return;
      const ndl = Math.max(0, dot(n, LS)), k = cl(0.1 + 0.9 * ndl) * 3, ri = Math.min(2, Math.floor(k)), rf = k - ri, A = RAMP[ri], B = RAMP[ri + 1];
      c.beginPath(); F.forEach((vi, j) => j ? c.lineTo(P[vi][0], P[vi][1]) : c.moveTo(P[vi][0], P[vi][1])); c.closePath();
      c.fillStyle = `rgb(${A[0] + (B[0] - A[0]) * rf | 0},${A[1] + (B[1] - A[1]) * rf | 0},${A[2] + (B[2] - A[2]) * rf | 0})`; c.fill();
      const sp = Math.pow(Math.max(0, dot(n, HV)), 24); if (sp > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * sp * 0.8; c.fillStyle = PALE; c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = alpha; } });
    const sil = new Path2D(), cre = new Path2D();
    for (const [a, b, f1, f2] of M.e) { const v1 = f1 >= 0 && vis[f1], v2 = f2 >= 0 && vis[f2]; if (!v1 && !v2) continue; const P2 = v1 !== v2 ? sil : cre; P2.moveTo(P[a][0], P[a][1]); P2.lineTo(P[b][0], P[b][1]); }
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = GOLD; c.globalAlpha = alpha * 0.55; c.lineWidth = Math.max(0.8, s * 0.035); c.stroke(cre);
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#140D07'; c.globalAlpha = alpha; c.lineWidth = Math.max(1, s * 0.03); c.stroke(sil);
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = HONEY; c.globalAlpha = alpha * 0.35; c.lineWidth = Math.max(0.6, s * 0.012); c.stroke(sil);
    c.restore();
  }
  const axisR = (u, a) => { const [x, y, z] = nrm(u), c = Math.cos(a), s = Math.sin(a), C = 1 - c; return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; };

  /* ================= E2 World Shaking ================= */
  U.worldshaking = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const li = (a, b, c) => ev <= 4 ? lerp(a, b, (ev - 1) / 3) : lerp(b, c, (ev - 4) / 3);
    const R = li(1.5, 1.8, 2.2) / 2 * K, LF = li(5, 6.5, 8) * K, a = C.a; let hd = a, dx = Math.cos(a), dy = Math.sin(a);
    // the start: in front of the pet (further when aimed toward the camera, so it does not sit over the pet)
    const off = R + 0.45 + 0.85 * Math.max(0, dy); let x0 = me.x + dx * off, y0 = me.y + dy * off;
    for (let k = 0; k < 10 && H.X.blocked(x0, y0, 0.3, 1); k++) { x0 -= dx * off / 10; y0 -= dy * off / 10; }
    // the route is steered: L (5 / 6.5 / 8 H) is the most it travels; it homes on its monster, stops at a wall
    const L = LF, TT = 1.7 + 0.12 * (ev - 1), vC = LF / (TT * 0.8), TURN = 2.8;
    const T_GO = 1.1, TICK = 0.25, LIFE0 = T_GO + TT * 2.5 + 3.5;
    const CT = li(7.5, 9, 11), FB = li(6, 7, 8) * DK, TK = CT * DK / 2, RBU = R + li(1.6, 2.0, 2.4) * K;
    const seed = Math.floor(Math.random() * 1000), oz0 = R + 0.12;
    let ox = x0, oy = y0, os = 0, oz = oz0, spin = 0, ringA = 0, nextTick = T_GO + 0.12, burst = false, died = false, S = null, spawnF = 0, spawnS = 0, spawnH = 0, nextRip = T_GO + 0.2, tickN = 0;
    let arrT = 1e9, burstT = 1e9, tgt = null, grind = 0, grindK = 0, crackS = 0;
    const tightAt = t => arrT > 1e8 ? 0 : sstep(arrT, arrT + 0.42, t);
    const got = new Map(), flakes = [], stones = [], sparks = [], puffs = [], haze = [], ripples = [], shards = [], chunks = [], hist = [];
    // the fracture strip, laid behind the orb as it goes (it follows the curving route): main cracks (two lanes at
    // Celestial) and side branches, each segment lit at its birth time tb and fading
    const segs = [], lanes = (CEL ? [-0.32, 0.32] : [0]).map(m0 => ({ m0, x: x0 - dy * m0 * R, y: y0 + dx * m0 * R }));
    function crackStep(t) {
      for (const ln of lanes) { const lo = ln.m0 * R + (Math.random() - 0.5) * 0.36 * R, nx = ox - dy * lo, ny = oy + dx * lo; segs.push({ x0: ln.x, y0: ln.y, x1: nx, y1: ny, tb: t, w: 0 }); ln.x = nx; ln.y = ny; }
      if (Math.random() < (CEL ? 0.65 : ADE ? 0.5 : 0.4)) { const side = Math.random() < 0.5 ? -1 : 1, ln = lanes[side > 0 ? lanes.length - 1 : 0]; let px = ln.x, py = ln.y, b = hd + side * (Math.PI / 2 - 0.5 + Math.random() * 0.6); const n = CEL ? 5 : 3 + (Math.random() < 0.5 ? 1 : 0);
        for (let k = 0; k < n; k++) { b += (Math.random() - 0.5) * 0.9; const l = R * (CEL ? 0.3 : 0.24) * (0.6 + 0.7 * Math.random()), nx = px + Math.cos(b) * l, ny = py + Math.sin(b) * l; segs.push({ x0: px, y0: py, x1: nx, y1: ny, tb: t + 0.05 + k * 0.04, w: k >= n - 1 ? 2 : 1 }); px = nx; py = ny; } }
      while (segs.length > 400) segs.shift(); }
    // its monster: in front along the aim first (nearest), else the nearest; again when that one dies
    function pick(first) { const left = Math.max(0, L - os) + R + 1.2, list = H.near(ox, oy, left); if (!list.length) return null; let best = null, bs = 1e9;
      for (const m of list) { const ddx = m.x - ox, ddy = m.y - oy, d = Math.hypot(ddx, ddy) || 1, fr = (ddx * dx + ddy * dy) / d, sc = d + (fr > (first ? 0.25 : -0.2) ? 0 : 50); if (sc < bs) { bs = sc; best = m; } } return best; }
    function arrive(t) { if (arrT > 1e8) arrT = t; }
    // the finale's radial cracks
    const rad = []; for (let i = 0, n = CEL ? 14 : ADE ? 11 : 8; i < n; i++) { const b0 = i / n * TAU + R1(seed + i * 9) * 0.4; let b = b0, px = 0, py = 0, d = R * 0.6; px = Math.cos(b) * d; py = Math.sin(b) * d; for (let k = 0; k < 5; k++) { b = b0 + (R1(seed + i * 13 + k) - 0.5) * 0.7; const l = (RBU - R * 0.6) / 5 * (0.7 + 0.6 * R1(seed + i + k * 3)), nx = px + Math.cos(b) * l, ny = py + Math.sin(b) * l; rad.push({ x0: px, y0: py, x1: nx, y1: ny, k, w: k > 3 ? 2 : k > 1 ? 1 : 0 }); px = nx; py = ny; } }
    // the formation: golden fragments that spiral into the orb
    const frags = []; for (let i = 0, n = H.n(CEL ? 34 : ADE ? 28 : 22); i < n; i++) frags.push({ a0: Math.random() * TAU, r0: R * (1.5 + Math.random() * 1.2), z0: (Math.random() - 0.35) * R * 1.8, del: Math.random() * 0.32, dur: 0.42 + Math.random() * 0.18, v: i % 3, rot: Math.random() * TAU, done: false });
    // Celestial: the floating mineral segments round the ring
    const segM = CEL ? Array.from({ length: 7 }, (_, i) => ({ M: GeoKit.bipyramid(5, 0.12, 0.2 + 0.06 * R1(seed + i), 0.14, { jit: 0.6, jitR: 0.35, seed: seed + i * 7 }), th: i / 7 * TAU + R1(seed + i * 4) * 0.4, ax: nrm([R1(seed + i) - 0.5, R1(seed + i * 2) - 0.5, R1(seed + i * 3) - 0.5]), ph: R1(seed + i * 5) * TAU, sc: 1.55 + 0.6 * R1(seed + i * 6), rad: 1.78 + 0.14 * R1(seed + i * 8) })) : [];
    H.X.banner('WORLD SHAKING', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.6;
    function doBurst(f) {
      burst = true; burstT = f.t; f.TBreal = burstT; f.life = 1.8; H.hitArea(ox, oy, RBU, FB, C.dmgO({ kb: 5, stun: 0.45 })); H.X.shake(7, 0.35); H.X.hitstop(0.05); H.X.light(ox, oy, RBU * 1.5, 0.5); H.X.sfx.crash(); H.X.sfx.thud(); H.X.flash(0.18, PALE);
      for (let i = 0, n = H.n(CEL ? 11 : 8); i < n; i++) { const b = Math.random() * TAU, v = 2.5 + Math.random() * 3.5; stones.push({ x: ox + Math.cos(b) * R * 0.6, y: oy + Math.sin(b) * R * 0.6, z: 0.2 + Math.random() * 0.4, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: 3 + Math.random() * 3.5, s: 0.1 + Math.random() * 0.12, v: i % 4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, b: 0, t: 0 }); }
      for (let i = 0, n = H.n(CEL ? 30 : 22); i < n; i++) { const b = Math.random() * TAU, v = 3 + Math.random() * 5; shards.push({ x: ox, y: oy, z: oz, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: 1 + Math.random() * 4, t: 0, life: 0.6 + Math.random() * 0.5, v: i % 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16 }); }
      for (let i = 0; i < 6; i++) { const th = i / 6 * TAU + ringA, p = ringPt(Math.cos(th) * RM, Math.sin(th) * RM, 0), v = 3.5 + Math.random() * 2.5; chunks.push({ x: ox + p[0] * R, y: oy + p[2] * R * 0.6, z: oz - p[1] * R * 0.8, vx: p[0] * v, vy: p[2] * v * 0.8 + (Math.random() - 0.5), vz: 2 + Math.random() * 3, t: 0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, s: 0.16 + Math.random() * 0.08, v: i % 4 }); }
      for (let i = 0, n = H.n(18); i < n; i++) { const b = i / 18 * TAU + Math.random() * 0.3, d = RBU * (0.45 + Math.random() * 0.35); puffs.push({ x: ox + Math.cos(b) * d, y: oy + Math.sin(b) * d, z: 0.15, vx: Math.cos(b) * 1.6, vy: Math.sin(b) * 1.6, vz: 0.35, t: 0, life: 1.1 + Math.random() * 0.5, s: 0.5 + Math.random() * 0.4, g: 1.6 }); }
      for (let i = 0, n = H.n(22); i < n; i++) { const b = Math.random() * TAU, v = 2 + Math.random() * 3.5; flakes.push({ x: ox + Math.cos(b) * R * 0.8, y: oy + Math.sin(b) * R * 0.8, z: oz + (Math.random() - 0.5) * R, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: 1 + Math.random() * 2, t: 0, life: 1 + Math.random() * 0.7, s: 0.09 + Math.random() * 0.08, ph: Math.random() * TAU, vr: 5 + Math.random() * 8, rot: Math.random() * TAU, v: i % 3 }); }
    }
    const f = H.add({ life: LIFE0, x: x0, y: y0, key: 'worldshaking', TB: T_GO + TT + 0.42,
      update(dt, f) {
        const t = f.t, T0 = texFor(ADE); if (!T0.ready) { const s0 = performance.now(); while (!T0.ready && performance.now() - s0 < 2) T0.it.next(); }
        if (me.dead && !died) { died = true; if (!burst) f.life = Math.min(f.life, 0.5); }
        // the orb's route: it turns smoothly after its monster's current place, eases onto it, grinds it; it arrives
        // (and the finale begins) at the end of its range, at a wall, or after grinding its monster for 0.55 s
        if (t >= T_GO && !burst && !died) {
          if (!tgt || tgt.dead || tgt.under || tgt.falling) tgt = t < T_GO + 0.05 && !tgt ? pick(true) : pick(false);
          let dT = 9;
          if (tgt) { dT = Math.hypot(tgt.x - ox, tgt.y - oy); if (dT > 0.05) { const want = Math.atan2(tgt.y - oy, tgt.x - ox), dd = H.wrap(want - hd), mx = TURN * dt * (arrT < 1e8 ? 2 : 1); hd += Math.max(-mx, Math.min(mx, dd)); dx = Math.cos(hd); dy = Math.sin(hd); } }
          let v = arrT > 1e8 ? vC * (0.15 + 0.85 * sstep(T_GO, T_GO + 0.35, t)) * (0.2 + 0.8 * cl((L - os) / (R + 1.0))) : 1.2 * (1 - tightAt(t) * 0.6);
          if (tgt) v = Math.min(v, Math.max(0.6, vC * cl((dT - R * 0.15) / (R + 0.9))));
          if (arrT < 1e8 && !tgt) v = 0;
          const step = Math.min(v * dt, tgt ? Math.max(0, dT - R * 0.1) : 9), nx = ox + dx * step, ny = oy + dy * step;
          if (step > 0) { if (H.X.blocked(nx, ny, Math.min(0.45, R * 0.5), 1)) arrive(t); else { ox = nx; oy = ny; os += step; crackS += step; if (crackS >= 0.22) { crackS = 0; crackStep(t); } } }
          if (arrT > 1e8) { if (os >= L - 0.02) arrive(t); if (tgt && dT < R * 0.6) { grind += dt; if (grind > 0.55) arrive(t); } }
        }
        grindK = Math.max(0, grindK - dt * 2.2);
        oz = oz0 + 0.05 * Math.sin(t * 6.5);
        const tight = tightAt(t);
        spin += dt * (t < T_GO ? 4 : 9 + 10 * tight + 4 * grindK); ringA += dt * (t < T_GO ? 1.4 : 2.4 + 5 * tight + 1.5 * grindK);
        // contact ticks: every 0.25 s on what the orb overlaps (game time, frame-rate independent)
        while (!died && !burst && t >= nextTick && t >= T_GO) { tickN++;
          const hit = H.near(ox, oy, R * 0.92).filter(m => (got.get(m) || 0) < CT * DK - 1e-6); if (hit.length) { for (const m of hit) { const d = Math.min(TK, CT * DK - (got.get(m) || 0)); got.set(m, (got.get(m) || 0) + d); H.X.hitMon(m, d, C.dmgO({ kb: 0.6 })); H.slow(m, 0.4); for (let k = 0; k < H.n(3); k++) { const b = Math.random() * TAU; stones.push({ x: m.x, y: m.y, z: 0.3, vx: Math.cos(b) * 2.2, vy: Math.sin(b) * 2.2, vz: 2.5 + Math.random() * 2, s: 0.07 + Math.random() * 0.06, v: k % 4, rot: 0, vr: 9, b: 0, t: 0 }); } } grindK = 1; H.X.shake(2.6, 0.1); if (tickN % 2) H.X.sfx.crack(); H.X.light(ox, oy, R * 2, 0.15); }
          else H.X.shake(0.7, 0.06);
          nextTick += TICK; }
        if (!burst && !died && t >= arrT + 0.42) doBurst(f);
        // spawning while it travels
        const moving = t >= T_GO && !burst && !died;
        if (moving) {
          spawnF += dt * (CEL ? 60 : ADE ? 52 : 44) * H.Q(); while (spawnF >= 1) { spawnF--; const lo = (Math.random() - 0.5) * R * 1.1, back = R * (0.5 + Math.random() * 0.5), vb = 0.5 + Math.random() * 1.1;
            flakes.push({ x: ox - dx * back - dy * lo, y: oy - dy * back + dx * lo, z: oz + (Math.random() - 0.5) * R * 0.9, vx: -dx * vb - dy * (Math.random() - 0.5) * 1.1, vy: -dy * vb + dx * (Math.random() - 0.5) * 1.1, vz: 0.3 + Math.random() * 0.8, t: 0, life: 0.9 + Math.random() * 0.8, s: 0.09 + Math.random() * 0.11, ph: Math.random() * TAU, vr: 4 + Math.random() * 7, rot: Math.random() * TAU, v: Math.floor(Math.random() * 3) }); }
          spawnS += dt * (CEL ? 36 : ADE ? 28 : 22) * H.Q() * (arrT > 1e8 ? 1 : 0.6) * (1 + grindK); while (spawnS >= 1) { spawnS--; const side = Math.random() < 0.5 ? -1 : 1, lo = side * (R * 0.5 + Math.random() * (R * 0.6 + 0.5)), fw = (Math.random() - 0.3) * R, v = 0.5 + Math.random();
            stones.push({ x: ox + dx * fw - dy * lo, y: oy + dy * fw + dx * lo, z: 0, vx: -dy * side * v + dx * 0.4, vy: dx * side * v + dy * 0.4, vz: 2 + Math.random() * 2, s: 0.06 + Math.random() * 0.08, v: Math.floor(Math.random() * 4), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, b: 0, t: 0 }); }
          spawnH += dt * 16; while (spawnH >= 1) { spawnH--; haze.push({ x: ox - dx * R * 0.6, y: oy - dy * R * 0.6, z: oz + (Math.random() - 0.5) * R * 0.5, t: 0, life: 0.7 + Math.random() * 0.3, s: R * (0.5 + Math.random() * 0.3), vx: -dx * 0.5, vy: -dy * 0.5 }); }
          for (let q = Math.random() < (dt * 40 * H.Q() * (1 + grindK)) % 1 ? 1 : 0, nq = Math.floor(dt * 40 * H.Q() * (1 + grindK)) + q; nq > 0; nq--) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 2.5; sparks.push({ x: ox + Math.cos(b) * R * 0.8, y: oy + Math.sin(b) * R * 0.8, z: oz + (Math.random() - 0.3) * R, vx: Math.cos(b) * v - dx, vy: Math.sin(b) * v - dy, vz: 1 + Math.random() * 2, t: 0, life: 0.3 + Math.random() * 0.35 }); }
          if (t >= nextRip && (arrT > 1e8 || t < arrT + 0.2)) { ripples.push({ x: ox, y: oy, t0: t, k: 1 }); if (ADE) ripples.push({ x: ox, y: oy, t0: t + 0.14, k: 1.35 }); nextRip += 0.3; }
          hist.push([ox, oy, oz, t]); }
        f.ox = ox; f.oy = oy; f.oz = oz;
        while (hist.length && hist[0][3] < t - 0.9) hist.shift();
        // the particles: weighted arcs, tumbling flakes that cool and crumble
        for (let i = stones.length - 1; i >= 0; i--) { const s = stones[i]; s.t += dt; if (s.rest != null) { s.rest -= dt; if (s.rest <= 0) stones.splice(i, 1); continue; } s.vz -= 15 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.rot += s.vr * dt;
          if (s.z <= 0 && s.vz < 0) { if (!s.b) { s.b = 1; s.z = 0; s.vz = -s.vz * 0.32; s.vx *= 0.55; s.vy *= 0.55; s.vr *= 0.5; if (s.s > 0.1) puffs.push({ x: s.x, y: s.y, z: 0.05, vx: 0, vy: 0, vz: 0.2, t: 0, life: 0.5, s: 0.25, g: 1.2 }); } else { s.z = 0; s.rest = 0.25; } } }
        for (let i = flakes.length - 1; i >= 0; i--) { const p = flakes[i]; p.t += dt; if (p.t >= p.life) { if (Math.random() < 0.35) puffs.push({ x: p.x, y: p.y, z: p.z, vx: p.vx * 0.2, vy: p.vy * 0.2, vz: 0.1, t: 0, life: 0.5, s: 0.18, g: 1.4 }); flakes.splice(i, 1); continue; }
          const dr = Math.exp(-1.6 * dt); p.vx *= dr; p.vy *= dr; p.vz = p.vz * dr - 1.3 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0.02, p.z + p.vz * dt); p.ph += p.vr * dt; p.rot += p.vr * 0.3 * dt; }
        for (const L2 of [puffs, haze]) for (let i = L2.length - 1; i >= 0; i--) { const p = L2[i]; p.t += dt; if (p.t >= p.life) { L2.splice(i, 1); continue; } const dr = Math.exp(-(p.g || 2) * dt); p.vx *= dr; p.vy *= dr; p.x += p.vx * dt; p.y += p.vy * dt; p.z += (p.vz || 0) * dt; }
        for (const L2 of [sparks, shards, chunks]) for (let i = L2.length - 1; i >= 0; i--) { const p = L2[i]; p.t += dt; if (p.t >= (p.life || 1.4) || (p.z < 0 && p.vz < 0 && L2 !== shards)) { if (L2 === chunks) puffs.push({ x: p.x, y: p.y, z: 0.05, vx: 0, vy: 0, vz: 0.2, t: 0, life: 0.6, s: 0.3, g: 1.2 }); L2.splice(i, 1); continue; } p.vz -= (L2 === sparks ? 6 : 13) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0 && L2 === shards) { p.z = 0; p.vz *= -0.3; p.vx *= 0.5; p.vy *= 0.5; } if (p.rot != null) p.rot += p.vr * dt; }
        for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t0 > 0.85) ripples.splice(i, 1);
      },
      /* ---- the floor: light only ---- */
      drawUnder(c, f, X, Y, T, gt) {
        const t = f.t;
        const fo = died ? cl(f.life / 0.5) : 1; if (fo <= 0) return;
        const tight = tightAt(t), bt = burst ? t - burstT : -1, sx = H.sx, sy = H.sy;
        // the fracture strip: lit as the orb passes, fading behind it (buckets of brightness, three widths, additive)
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        const NBk = 5, paths = []; for (let k = 0; k < NBk * 3; k++) paths.push(null);
        const fadeT = CEL ? 1.25 : 0.95, endK = burst ? cl(1 - bt / 1.4) : 1;
        for (const sg of segs) { const ag = t - sg.tb; if (ag < 0) continue; let I = ag < 0.1 ? ag / 0.1 : Math.exp(-(ag - 0.1) / fadeT); if (tight > 0 || burst) I = Math.max(I, 0.35 * tight * (1 - sstep(0, 1.4, bt < 0 ? 0 : bt))); I *= endK * fo; if (I < 0.04) continue;
          const k = Math.min(NBk - 1, Math.floor(I * NBk)) * 3 + sg.w; const P = paths[k] || (paths[k] = new Path2D()); P.moveTo(sx(sg.x0), sy(sg.y0)); P.lineTo(sx(sg.x1), sy(sg.y1)); }
        const WD = [[0.2, 0.08, 0.03], [0.13, 0.055, 0.022], [0.08, 0.034, 0.015]];
        for (let k = 0; k < paths.length; k++) { const P = paths[k]; if (!P) continue; const I = (Math.floor(k / 3) + 0.6) / NBk, w = WD[k % 3];
          c.strokeStyle = AMBER; c.globalAlpha = I * 0.3; c.lineWidth = Math.max(1.5, T * w[0]); c.stroke(P);
          c.strokeStyle = GOLD; c.globalAlpha = I * 0.8; c.lineWidth = Math.max(1, T * w[1]); c.stroke(P);
          c.strokeStyle = CORE; c.globalAlpha = I * 0.75; c.lineWidth = Math.max(0.6, T * w[2]); c.stroke(P); }
        // the finale's radial cracks, racing out from the burst
        if (burst && bt < 1.6) { const P3 = [new Path2D(), new Path2D(), new Path2D()], OXs = sx(ox), OYs = sy(oy); let any = false;
          for (const r of rad) { const reach = sstep(0, 0.22, bt) * 5; if (r.k > reach) continue; any = true; P3[r.w].moveTo(OXs + r.x0 * T, OYs + r.y0 * T * H.GY); P3[r.w].lineTo(OXs + r.x1 * T, OYs + r.y1 * T * H.GY); }
          const I = (1 - sstep(0.2, 1.6, bt)) * fo; if (any) for (let w = 0; w < 3; w++) { const ww = WD[w]; c.strokeStyle = AMBER; c.globalAlpha = I * 0.3; c.lineWidth = Math.max(1.5, T * ww[0] * 1.3); c.stroke(P3[w]); c.strokeStyle = HONEY; c.globalAlpha = I * 0.7; c.lineWidth = Math.max(1, T * ww[1] * 1.2); c.stroke(P3[w]); c.strokeStyle = CORE; c.globalAlpha = I * 0.8; c.lineWidth = Math.max(0.6, T * ww[2]); c.stroke(P3[w]); } }
        c.restore();
        // the pressure ripples (a second one at Adept): light bands spreading sideways
        for (const rp of ripples) { const ag = t - rp.t0; if (ag < 0) continue; const u = ag / 0.85, rr = (R * 0.85 + u * (R * 0.7 + 1.5) * rp.k) * T; floorSpr(c, bandSpr(), sx(rp.x), sy(rp.y), rr, 0.34 * Math.pow(1 - u, 1.5) * fo * (rp.k > 1 ? 0.75 : 1), true); }
        // the light pool under the orb, the stones' small shadows
        if (!burst || bt < 0.3) { const k = (burst ? 1 - bt / 0.3 : sstep(0.3, 0.8, t)) * fo; floorGlow(c, sx(ox), sy(oy), R * T * (1.7 + 0.5 * tight), (0.3 + 0.25 * tight) * k, AMBER); floorGlow(c, sx(ox), sy(oy), R * T * 0.9, (0.22 + 0.3 * tight) * k, HONEY); }
        for (const s of stones) { const k = 0.28 / (1 + s.z * 1.5) * (s.rest != null ? s.rest / 0.25 : 1); c.globalAlpha = k * fo; c.drawImage(shadowSpr(), sx(s.x) - s.s * T, sy(s.y) - s.s * T * 0.5, s.s * T * 2, s.s * T); } c.globalAlpha = 1;
        // the burst: two light bands racing out, a glow
        if (burst && bt < 1.2) { const u = sstep(0, 0.55, bt); floorSpr(c, wideSpr(), sx(ox), sy(oy), (R + (RBU - R) * u) * T * 1.05, 0.75 * (1 - sstep(0.15, 0.8, bt)) * fo, true); const u2 = sstep(0.08, 0.8, bt); floorSpr(c, bandSpr(), sx(ox), sy(oy), (R * 0.6 + (RBU * 1.2 - R * 0.6) * u2) * T, 0.6 * (1 - sstep(0.4, 1.15, bt)) * fo, true); floorGlow(c, sx(ox), sy(oy), RBU * T * 1.1, 0.3 * (1 - sstep(0, 0.45, bt)) * fo, AMBER); }
      },
      draw(c, f, X, Y, T, gt) {
        const t = f.t;
        const fo = died ? cl(f.life / 0.5) : 1; if (fo <= 0) return;
        const sx = H.sx, sy = H.sy, k = scr(c).k, tight = tightAt(t), bt = burst ? t - burstT : -1;
        if (!S) { const D = Math.max(32, Math.min(320, Math.round(R * 2 * T * k / 8) * 8)); S = orbFor(D, ADE); }
        if (!S.done) S.step(t < 0.9 ? 3 : 4);
        const rpx = R * T, vib = burst ? 0 : rpx * (0.02 + 0.05 * grindK + 0.04 * tight) * sstep(0.5, 0.9, t), OX = sx(ox) + vib * (Math.sin(t * 57) * 0.7 + Math.sin(t * 89 + 1) * 0.5), OY = sy(oy) - oz * CE * T + vib * (Math.sin(t * 63 + 2) * 0.7 + Math.sin(t * 97) * 0.4);
        const pX = sx(me.x), pY = sy(me.y) - T * 0.45, pd = 0.38 + 0.62 * sstep(0.2 * T, 1.2 * T, Math.hypot(OX - pX, OY - pY) - rpx * 0.55);
        // the dark haze behind the orb (smoky body of the trail)
        for (const p of haze) { const u = p.t / p.life, r = p.s * (0.7 + 0.8 * u) * T; c.globalAlpha = 0.8 * Math.sin(Math.PI * Math.min(1, u * 1.4 + 0.05)) * (1 - u) * fo; c.drawImage(hazeSpr(), sx(p.x) - r, sy(p.y) - p.z * CE * T - r, r * 2, r * 2); }
        c.globalAlpha = 1;
        // the smoky gold strands trailing the orb, brightest near it
        if (hist.length > 2) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          for (let j = 0; j < (CEL ? 4 : 3); j++) { let px = null, py = 0; for (let i = hist.length - 1; i >= 0; i -= 2) { const q = hist[i], ag = t - q[3], u = ag / 0.9, w = Math.sin(ag * 4.5 + j * 2.1 + t * 1.5), lo = w * R * (0.08 + 0.26 * u) + (j - 1) * R * 0.18 * u, zz = q[2] + Math.cos(ag * 3.5 + j * 1.7) * R * (0.06 + 0.16 * u) - R * 0.25 * u, x = sx(q[0] - dy * lo), y = sy(q[1] + dx * lo) - zz * CE * T;
              if (px != null) { const a2 = Math.pow(1 - u, 1.8) * 0.4 * fo; c.globalAlpha = a2 * 0.35; c.strokeStyle = AMBER; c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke(); c.globalAlpha = a2; c.strokeStyle = HONEY; c.lineWidth = Math.max(0.8, T * 0.022); c.stroke(); }
              px = x; py = y; } }
          c.restore(); }
        // the flakes: charcoal, an amber rim that cools; tumbling (squashed by their turn)
        for (const p of flakes) { const u = p.t / p.life, heat = cl(1 - u / 0.55), a = Math.min(1, p.t / 0.08) * (1 - sstep(0.75, 1, u)) * fo, sq = 0.25 + 0.75 * Math.abs(Math.cos(p.ph)), s = p.s * T * (1 - 0.3 * u);
          c.save(); c.translate(sx(p.x), sy(p.y) - p.z * CE * T); c.rotate(p.rot); c.scale(1, sq); c.globalAlpha = a; c.drawImage(flakeSpr(0, p.v), -s, -s, s * 2, s * 2); if (heat > 0.02) { c.globalAlpha = a * heat; c.drawImage(flakeSpr(1, p.v), -s, -s, s * 2, s * 2); } c.restore(); }
        // the stones in the air
        for (const s of stones) { const r = s.s * T, a = (s.rest != null ? s.rest / 0.25 : 1) * fo; c.save(); c.translate(sx(s.x), sy(s.y) - s.z * CE * T - r * 0.4); c.rotate(s.rot); c.globalAlpha = a; c.drawImage(rockSpr(s.v), -r, -r, r * 2, r * 2); c.restore(); }
        // the warm wake right behind the orb (the brightest part of the trail)
        if (t > T_GO && (!burst || bt < 0.2)) { const k2 = (burst ? 1 - bt / 0.2 : sstep(T_GO, T_GO + 0.3, t)) * fo * pd; for (let i = 1; i <= 4; i++) { const d = R * (0.35 + i * 0.32); glow(c, sx(ox - dx * d), sy(oy - dy * d) - oz * CE * T, rpx * (1.05 - i * 0.16), i < 2 ? GOLD : AMBER, 0.24 * k2 * (1 - i * 0.18)); } }
        // the formation: fragments spiralling in
        if (t < 1.0) for (const fr of frags) { const u = cl((t - fr.del) / fr.dur); if (fr.done) continue; if (u >= 1) { fr.done = true; for (let k3 = 0; k3 < 2; k3++) sparks.push({ x: x0, y: y0, z: oz0, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, vz: 1 + Math.random(), t: 0, life: 0.3 }); continue; } if (t < fr.del) continue;
          const e = u * u * (3 - 2 * u), rr = fr.r0 * (1 - e * 0.95), an = fr.a0 + 2.8 * e, zz = oz0 + fr.z0 * (1 - e), x = sx(x0 + Math.cos(an) * rr), y = sy(y0 + Math.sin(an) * rr) - zz * CE * T, s = T * 0.13 * (1 - 0.5 * e), al = Math.min(1, u * 5) * fo;
          const an2 = an - 0.35, rr2 = fr.r0 * (1 - Math.max(0, e - 0.08) * 0.95), x2 = sx(x0 + Math.cos(an2) * rr2), y2 = sy(y0 + Math.sin(an2) * rr2) - (oz0 + fr.z0 * (1 - Math.max(0, e - 0.08))) * CE * T;
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * 0.28; c.strokeStyle = GOLD; c.lineCap = 'round'; c.lineWidth = s * 0.22; c.beginPath(); c.moveTo(x2, y2); c.lineTo(x, y); c.stroke(); c.restore();
          glow(c, x, y, s * 1.6, HONEY, al * 0.4); c.save(); c.translate(x, y); c.rotate(fr.rot + t * 6); c.globalAlpha = al; c.drawImage(shardSpr(fr.v), -s, -s, s * 2, s * 2); c.restore(); }
        // ---- the orb and its ring ----
        const grow = t < 0.3 ? 0 : 0.18 + 0.82 * H.ease.back(cl((t - 0.3) / 0.55)), oA = sstep(0.3, 0.5, t) * (burst ? 1 - sstep(0, 0.22, bt) : 1) * fo * pd, oS = grow * (burst ? 1 + 0.35 * sstep(0, 0.22, bt) : 1);
        const ringIn = sstep(0.72, 0.95, t), rK = (1.12 - 0.12 * ringIn) * (1 - 0.19 * H.ease.in(tight)) * (burst ? 1 + 0.6 * sstep(0, 0.2, bt) : 1), rA = ringIn * (burst ? 1 - sstep(0, 0.16, bt) : 1) * fo * pd, rw = 0.1 * Math.sin(t * 1.9) + 0.03 * Math.sin(t * 7.3) + (burst ? 0 : 0.02 * grindK * Math.sin(t * 71)), ry = 1 + 0.16 * Math.sin(t * 2.6 + 1);
        const RS = S.ring, rr = rpx * rK, cw = Math.cos(rw), sw = Math.sin(rw);
        const studs = [], NST = 8; for (let i = 0; i < NST; i++) { const th = ringA + i / NST * TAU, p = ringPt(Math.cos(th) * RM, Math.sin(th) * RM, RBh * 1.05); studs.push([OX + (p[0] * cw - p[1] * ry * sw) * rr, OY + (p[0] * sw + p[1] * ry * cw) * rr, p[2], i]); }
        const segP = segM.map(sg => { const th = sg.th + t * 0.35, p = ringPt(Math.cos(th) * sg.rad, Math.sin(th) * sg.rad, 0.12 * Math.sin(t * 1.3 + sg.ph)); return { sg, x: OX + (p[0] * cw - p[1] * ry * sw) * rpx, y: OY + (p[0] * sw + p[1] * ry * cw) * rpx, z: p[2] }; });
        const drawSegs = front => { if (!CEL) return; const al = ringIn * (burst ? 1 - sstep(0, 0.3, bt) : 1) * fo * pd; if (al < 0.02) return; for (const q of segP) if ((q.z > 0) === front) paintSolid(c, q.sg.M, axisR(q.sg.ax, t * 0.6 + q.sg.ph), q.x, q.y, rpx * q.sg.sc * (burst ? 1 + bt : 1), al); };
        const drawStuds = front => { if (rA < 0.02) return; for (const s of studs) { if ((s[2] > 0) !== front) continue; const sz = rpx * 0.075 * (0.75 + 0.25 * Math.max(0, s[2])); c.globalAlpha = rA; c.fillStyle = '#1E140B'; c.beginPath(); c.ellipse(s[0], s[1], sz, sz * 0.6, rw + ROT, 0, TAU); c.fill(); glow(c, s[0], s[1], sz * 2.4, s[3] % 2 ? HONEY : GOLD, rA * (0.55 + 0.45 * Math.sin(t * 5 + s[3]))); }
          // a glint travelling round the inner edge
          for (let j = 0; j < 2; j++) { const th = -ringA * 1.7 + j * Math.PI, p = ringPt(Math.cos(th) * (RM - RA), Math.sin(th) * (RM - RA), 0); if ((p[2] > 0) !== front) continue; glow(c, OX + (p[0] * cw - p[1] * ry * sw) * rr, OY + (p[0] * sw + p[1] * ry * cw) * rr, rpx * 0.32, CORE, rA * 0.55); } c.globalAlpha = 1; };
        const drawRing = img => { if (!RS.ready || rA < 0.02) return; const q = rr / RS.r; c.save(); c.translate(OX, OY); c.rotate(rw); c.scale(1, ry); c.globalAlpha = rA; c.drawImage(img, -RS.ox * q, -RS.oy * q, RS.W * q, RS.H * q); c.restore(); };
        // the streak that closes into the ring
        if (t > 0.45 && t < 1.0) { const sp = TAU * sstep(0.45, 0.85, t), a0 = -1.2, al = (1 - sstep(0.85, 1.0, t)) * fo * pd, pts = []; for (let i = 0; i <= 40; i++) { const th = a0 + sp * i / 40, p = ringPt(Math.cos(th) * RM, Math.sin(th) * RM, 0); pts.push([OX + (p[0] * cw - p[1] * ry * sw) * rr, OY + (p[0] * sw + p[1] * ry * cw) * rr]); }
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; for (const [col, w, aa] of [[AMBER, 0.16, 0.3], [HONEY, 0.07, 0.7], [CORE, 0.025, 0.9]]) { c.strokeStyle = col; c.globalAlpha = al * aa; c.lineWidth = Math.max(1, rpx * w); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } c.restore(); glow(c, pts[40][0], pts[40][1], rpx * 0.45, CORE, al * 0.8); }
        drawSegs(false); drawRing(RS.back); drawStuds(false);
        if (oA > 0.01 && oS > 0.01) { const sR = rpx * oS; glow(c, OX, OY, sR * 2.4, AMBER, oA * (0.18 + 0.35 * tight)); glow(c, OX, OY, sR * 1.6, GOLD, oA * (0.12 + 0.3 * tight));
          const ph = ((spin / TAU) % 1 + 1) % 1; let img = null; if (S.frames) { const fi = Math.round(ph * NPH) % NPH; img = S.frames[fi]; if (!img) for (let d = 1; d < NPH && !img; d++) img = S.frames[(fi + d) % NPH] || S.frames[(fi - d + NPH) % NPH]; }
          c.globalAlpha = oA; if (img) { const q = sR / (S.D / 2), w = S.W * q; c.drawImage(img, OX - w / 2, OY - w / 2, w, w); { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = oA * (0.1 + 0.1 * Math.sin(t * 8) + 0.08 * Math.sin(t * 13.7) + 0.45 * tight + 0.2 * grindK + (burst ? 0.6 : 0)); c.drawImage(img, OX - w / 2, OY - w / 2, w, w); c.restore(); } }
          else c.drawImage(orbFB(), OX - sR, OY - sR, sR * 2, sR * 2);
          c.globalAlpha = 1; glow(c, OX - sR * 0.3, OY - sR * 0.35, sR * 0.5, CORE, oA * 0.1); }
        drawRing(RS.front); drawStuds(true); drawSegs(true);
        // the burst bloom
        if (burst && bt < 0.6) { const u = bt / 0.6; glow(c, OX, OY, rpx * (2 + 2 * u), HONEY, 0.7 * (1 - u) * (1 - u) * fo); glow(c, OX, OY, rpx * (1 + 1.2 * u), CORE, 0.8 * (1 - u) * (1 - u) * fo); }
        // sparks, golden shards, the ring's chunks, dust
        for (const p of sparks) { const u = p.t / p.life; glow(c, sx(p.x), sy(p.y) - p.z * CE * T, T * 0.09, HONEY, (1 - u) * 0.9 * fo); }
        for (const p of shards) { const u = p.t / p.life, s = T * 0.13; glow(c, sx(p.x), sy(p.y) - p.z * CE * T, s * 1.8, HONEY, 0.35 * (1 - u) * fo); c.save(); c.translate(sx(p.x), sy(p.y) - p.z * CE * T); c.rotate(p.rot); c.globalAlpha = (1 - sstep(0.6, 1, u)) * fo; c.drawImage(shardSpr(p.v), -s, -s, s * 2, s * 2); c.restore(); }
        for (const p of chunks) { const s = p.s * T; c.save(); c.translate(sx(p.x), sy(p.y) - p.z * CE * T); c.rotate(p.rot); c.globalAlpha = fo; c.drawImage(rockSpr(p.v, true), -s, -s, s * 2, s * 2); c.restore(); }
        for (const p of puffs) { const u = p.t / p.life, r = p.s * (0.6 + 0.9 * u) * T; c.globalAlpha = 0.85 * Math.sin(Math.PI * Math.min(1, u * 1.3 + 0.08)) * (1 - u) * fo; c.drawImage(puffSpr(), sx(p.x) - r, sy(p.y) - p.z * CE * T - r * 0.8, r * 2, r * 1.6); }
        c.globalAlpha = 1;
      } });
    return f;
  };
  function floorGlow(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
})();
