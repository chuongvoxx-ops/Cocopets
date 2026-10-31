/* ---------- Light (pink), reworked: Sunflare ----------
   Sunflare: a massive pink love heart forms in the air above the aim and hovers there for exactly seven active seconds.
   It is a thick rounded heart (a deep-rose side band under a candy-pink front, a pearly blush centre, bright edge accents,
   soft lobe highlights) with slowly turning bands of radiance across its face and a sweeping glint; behind it a corona of
   curved strips turns (one layer at Hatchling, two at Adept turning against each other, three at Celestial with fine
   rays, a pearl centre and a few faint gold strands), narrow bright arcs peel out of the corona and fade. A broad cone of
   pink-and-blush light reaches the floor and lights a huge circle there; light flows down through the beam while little
   hearts (turning about their upright axis, never vanishing edge-on) and five-pointed stars rise slowly round it in loose
   spirals. Every 0.5 s from 0.25 s after it goes active every monster in the circle takes Light damage (14 ticks, about
   15 x base over the cast); the corona and the floor light give a small pulse at each tick. At the end the corona folds
   inward and the heart dissolves into fine pink (and at Celestial faint gold) light; the dissolution deals nothing.
   Everything heavy is a cached sprite (heart, corona layers, shaft cone, floor ring, bands, little hearts and stars). */
(() => {
  const U = ELEM_IMPL.light.ult, TAU = Math.PI * 2;
  const ROSE = '#FF5CCB', CANDY = '#FF8FDB', MAG = '#E83EAC', BLUSH = '#FFD4EE', PEARL = '#FFF4FC', DEEP = '#8F2D73', LAV = '#D5C4FF', GOLD = '#FFE3A0';
  let H;
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  /* a heart outline: the classic rounded heart, 32 units wide, its lobes' top at y -12, its point at +17 (origin = the dip's x) */
  function heartPath(g, cx, cy, s) { g.beginPath(); for (let i = 0; i <= 72; i++) { const t = i / 72 * TAU, x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); if (i) g.lineTo(cx + x * s, cy + y * s); else g.moveTo(cx + x * s, cy + y * s); } g.closePath(); }
  /* the pet's body on the screen, cut out of whatever is drawn after it */
  function petHole(c, T) { const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }

  /* ---- the heart model: a deep side band (its thickness, seen a little from below), the candy-pink front with a pearly
     blush centre, shading toward the lower right, a bright rose rim, pearl edge accents up the lit side, soft lobe
     highlights and a fine contour. W px wide; ._s the heart's scale, (._cx, ._cy) the heart's bounding-box centre */
  function paintHeart(g, W, Hc, small) {
    const s = W * 0.84 / 32, cx = W / 2, oy = Hc / 2 - 2.5 * s - W * 0.012, th = W * 0.04;
    // the side band (thickness): the heart pushed down and a touch right, deep rose to magenta, then its lit lip
    g.save(); g.translate(th * 0.25, th); heartPath(g, cx, oy, s); let gr = g.createLinearGradient(0, oy - 12 * s, 0, oy + 17 * s); gr.addColorStop(0, MAG); gr.addColorStop(0.6, '#B8378F'); gr.addColorStop(1, DEEP); g.fillStyle = gr; g.fill(); g.restore();
    for (let k = 1; k < 4; k++) { g.save(); g.translate(th * 0.25 * k / 4, th * k / 4); heartPath(g, cx, oy, s); g.fillStyle = rgbaS(k < 3 ? '#C2449C' : MAG, 1); g.fill(); g.restore(); }
    // the front face
    heartPath(g, cx, oy, s); gr = g.createRadialGradient(cx - 3 * s, oy + 0.5 * s, s * 0.5, cx, oy + 2 * s, 19 * s);
    gr.addColorStop(0, BLUSH); gr.addColorStop(0.18, '#FFB0E6'); gr.addColorStop(0.45, CANDY); gr.addColorStop(0.78, ROSE); gr.addColorStop(1, MAG); g.fillStyle = gr; g.fill();
    g.save(); heartPath(g, cx, oy, s); g.clip();
    // shade toward the lower right (away from the light), a warm inner glow
    gr = g.createLinearGradient(cx - 14 * s, oy - 10 * s, cx + 12 * s, oy + 16 * s); gr.addColorStop(0, 'rgba(255,244,252,0.28)'); gr.addColorStop(0.45, 'rgba(255,143,219,0)'); gr.addColorStop(1, 'rgba(143,45,115,0.42)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hc);
    g.globalCompositeOperation = 'lighter'; gr = g.createRadialGradient(cx - 1 * s, oy + 3 * s, 0, cx - 1 * s, oy + 3 * s, 10 * s); gr.addColorStop(0, 'rgba(255,244,252,0.55)'); gr.addColorStop(0.5, 'rgba(255,212,238,0.2)'); gr.addColorStop(1, 'rgba(255,212,238,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hc);
    // the bevel: a bright rose band inside the edge, pearl along the upper-left lobe
    g.globalCompositeOperation = 'source-over'; heartPath(g, cx, oy, s); g.strokeStyle = rgbaS(ROSE, 0.9); g.lineWidth = s * 2.2; g.stroke(); g.strokeStyle = rgbaS(MAG, 0.55); g.lineWidth = s * 0.9; g.stroke();
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,244,252,0.85)'; g.lineWidth = s * 0.75; g.beginPath(); for (let i = 0; i <= 24; i++) { const t = -1.75 - i / 24 * 1.25, x = 16 * Math.pow(Math.sin(t), 3) * 0.9, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.9 + 0.4; if (i) g.lineTo(cx + x * s, oy + y * s); else g.moveTo(cx + x * s, oy + y * s); } g.stroke();
    // soft highlights on both lobes (the left, toward the light, brighter)
    for (const [hx, hy, r, a] of [[-8, -7.2, 4.6, 0.75], [7.5, -7.5, 3.4, 0.35]]) { gr = g.createRadialGradient(cx + hx * s, oy + hy * s, 0, cx + hx * s, oy + hy * s, r * s); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, `rgba(255,244,252,${a * 0.4})`); gr.addColorStop(1, 'rgba(255,244,252,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx + hx * s, oy + hy * s, r * s * 1.2, r * s * 0.8, -0.5, 0, TAU); g.fill(); }
    if (!small) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(cx - 9.5 * s, oy - 8 * s, 1.6 * s, 0.9 * s, -0.6, 0, TAU); g.fill(); }
    g.restore();
    // the contour (keeps the silhouette readable at gameplay distance)
    heartPath(g, cx, oy, s); g.strokeStyle = rgbaS(DEEP, small ? 0.75 : 0.6); g.lineWidth = Math.max(1, s * (small ? 0.7 : 0.35)); g.stroke();
    return { s, cx, cy: oy + 2.5 * s }; }
  const heartSpr = () => fxSprite('lu2heart', 320, 300, (g, W, Hc) => { const m = paintHeart(g, W, Hc, false); g.canvas._m = m; });
  const miniHeart = () => fxSprite('lu2mh', 48, 46, (g, W, Hc) => { paintHeart(g, W, Hc, true); });
  /* a little heart's edge (seen side-on as it turns): a rounded rose capsule */
  const miniEdge = () => fxSprite('lu2me', 12, 46, (g, W, Hc) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, MAG); gr.addColorStop(0.45, CANDY); gr.addColorStop(1, DEEP); g.fillStyle = gr; g.beginPath(); g.moveTo(W / 2, Hc * 0.95); g.quadraticCurveTo(W, Hc * 0.45, W * 0.8, Hc * 0.12); g.quadraticCurveTo(W / 2, 0, W * 0.2, Hc * 0.12); g.quadraticCurveTo(0, Hc * 0.45, W / 2, Hc * 0.95); g.fill(); g.strokeStyle = rgbaS(DEEP, 0.7); g.lineWidth = 1; g.stroke(); });
  /* a five-pointed star: candy body, blush lit half, pearl centre, a soft glow round it */
  const starSpr = (col) => fxSprite('lu2star|' + col, 48, 48, (g, W) => {
    const c0 = W / 2; let gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, rgbaS(col, 0.5)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, W);
    const pts = []; for (let i = 0; i < 10; i++) { const b = -Math.PI / 2 + i / 10 * TAU, r = i % 2 ? W * 0.13 : W * 0.33; pts.push([c0 + Math.cos(b) * r, c0 + Math.sin(b) * r]); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); gr = g.createLinearGradient(c0 - W * 0.3, c0 - W * 0.3, c0 + W * 0.3, c0 + W * 0.3); gr.addColorStop(0, PEARL); gr.addColorStop(0.45, col); gr.addColorStop(1, col === GOLD ? '#C99A3A' : MAG); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.55); g.lineWidth = 0.8; g.stroke();
    gr = g.createRadialGradient(c0, c0, 0, c0, c0, W * 0.14); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,244,252,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W); });
  /* bands of radiance across the heart's face: soft wedges from its centre (turned and clipped to the heart when drawn) */
  const bandSpr = () => fxSprite('lu2band', 256, 256, (g, W) => { const c0 = W / 2; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; for (const [w, al] of [[0.34, 0.08], [0.22, 0.1], [0.11, 0.14]]) { const gr = g.createRadialGradient(c0, c0, W * 0.03, c0, c0, c0); gr.addColorStop(0, `rgba(255,143,219,${al * 1.4})`); gr.addColorStop(0.55, `rgba(255,92,203,${al})`); gr.addColorStop(1, 'rgba(255,92,203,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(c0, c0); g.arc(c0, c0, c0, a - w / 2, a + w / 2); g.closePath(); g.fill(); } } });
  /* the corona: layer 1 curved crescent strips (rose to blush), layer 2 longer thinner strips curling the other way
     (magenta, a lavender one in three), layer 3 fine rays with glints at their tips (pearl, faint gold in one of six) */
  function coronaSpr(L) { return fxSprite('lu2cor' + L, 400, 400, (g, W) => {
    const R = W / 2; g.translate(R, R); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    if (L < 3) {
      const N = L === 1 ? 12 : 18, r0 = R * (L === 1 ? 0.46 : 0.5), r1 = R * (L === 1 ? 0.9 : 0.98), curl = L === 1 ? 0.42 : -0.32, wm = R * (L === 1 ? 0.062 : 0.04);
      for (let i = 0; i < N; i++) { const a = i / N * TAU, rr1 = r1 * (0.86 + 0.14 * R1(i * 3.3 + L)), cen = u => { const r = r0 + (rr1 - r0) * u, b = a + curl * Math.pow(u, 1.3); return [Math.cos(b) * r, Math.sin(b) * r, b]; };
        const A = [], B = []; for (let j = 0; j <= 16; j++) { const u = j / 16, p = cen(u), w = wm * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15 + 0.05)), 0.8) * (1 - 0.3 * u), nb = p[2] + Math.PI / 2 + curl * 0.6; A.push([p[0] + Math.cos(nb) * w, p[1] + Math.sin(nb) * w]); B.push([p[0] - Math.cos(nb) * w, p[1] - Math.sin(nb) * w]); }
        const col = L === 2 && i % 3 === 1 ? LAV : L === 1 ? ROSE : MAG, gr = g.createRadialGradient(0, 0, r0 * 0.9, 0, 0, rr1);
        gr.addColorStop(0, rgbaS(col, 1)); gr.addColorStop(0.5, rgbaS(L === 1 ? MAG : col, 0.75)); gr.addColorStop(1, rgbaS(ROSE, 0));
        g.beginPath(); A.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (let k = B.length - 1; k >= 0; k--) g.lineTo(B[k][0], B[k][1]); g.closePath(); g.fillStyle = gr; g.fill();
        // a pearly thread down the strip's middle
        g.beginPath(); for (let j = 0; j <= 10; j++) { const p = cen(j / 10 * 0.75); if (j) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.strokeStyle = rgbaS(CANDY, 0.5); g.lineWidth = wm * 0.3; g.stroke();
        g.beginPath(); A.slice(0, 13).forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.strokeStyle = rgbaS(BLUSH, 0.35); g.lineWidth = 1.4; g.stroke(); }
      const gr = g.createRadialGradient(0, 0, r0 * 0.7, 0, 0, r0 * 1.25); gr.addColorStop(0, rgbaS(ROSE, 0)); gr.addColorStop(0.5, rgbaS(ROSE, L === 1 ? 0.4 : 0.22)); gr.addColorStop(1, rgbaS(ROSE, 0)); g.fillStyle = gr; g.fillRect(-R, -R, W, W);
    } else {
      for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + R1(i) * 0.05, r0 = R * 0.48, r1 = R * (0.72 + 0.27 * R1(i * 5.7)), gold = i % 6 === 3, col = gold ? GOLD : i % 2 ? BLUSH : PEARL, ca = Math.cos(a), sa = Math.sin(a);
        const gr = g.createLinearGradient(ca * r0, sa * r0, ca * r1, sa * r1); gr.addColorStop(0, rgbaS(col, gold ? 0.35 : 0.75)); gr.addColorStop(1, rgbaS(col, 0)); g.strokeStyle = gr; g.lineWidth = gold ? 1.2 : 1.4 + 1.6 * R1(i * 2.1); g.beginPath(); g.moveTo(ca * r0, sa * r0); g.lineTo(ca * r1, sa * r1); g.stroke();
        if (i % 4 === 0) { const x = ca * r1 * 0.92, y = sa * r1 * 0.92, k = 5 + 3 * R1(i); g.fillStyle = rgbaS(PEARL, 0.8); g.beginPath(); g.moveTo(x - k, y); g.lineTo(x, y - k * 0.22); g.lineTo(x + k, y); g.lineTo(x, y + k * 0.22); g.closePath(); g.moveTo(x, y - k); g.lineTo(x + k * 0.22, y); g.lineTo(x, y + k); g.lineTo(x - k * 0.22, y); g.closePath(); g.fill(); } }
    } }); }
  /* the shaft: a cone of light, narrow at the top (TOPK of its base), gaussian across, pearl-blush in the middle, rose at its
     edges, faint where it leaves the heart, brighter toward the floor */
  const TOPK = 0.36;
  const shaftSpr = () => fxSprite('lu2shaft', 128, 256, (g, W, Hh) => {
    const im = g.createImageData(W, Hh), d = im.data, A = hexRGB(BLUSH), B = hexRGB(CANDY), Cc = hexRGB(ROSE);
    for (let y = 0; y < Hh; y++) { const u = y / (Hh - 1), half = W / 2 * lerp(TOPK, 1, u), vy = (0.25 + 0.75 * sstep(0, 0.3, u)) * (0.9 - 0.15 * sstep(0.7, 1, u));
      for (let x = 0; x < W; x++) { const q = Math.abs(x + 0.5 - W / 2) / half; if (q >= 1) continue; const k = Math.exp(-q * q * 2.4) * (1 - sstep(0.82, 1, q)), e = Math.min(1, q * 1.3), c1 = e < 0.5 ? [lerp(A[0], B[0], e * 2), lerp(A[1], B[1], e * 2), lerp(A[2], B[2], e * 2)] : [lerp(B[0], Cc[0], e * 2 - 1), lerp(B[1], Cc[1], e * 2 - 1), lerp(B[2], Cc[2], e * 2 - 1)], i = (y * W + x) * 4;
        // a brighter rim down each edge reads as the cone's curved side
        const rim = Math.exp(-Math.pow((q - 0.8) / 0.08, 2)) * 0.35; d[i] = c1[0]; d[i + 1] = c1[1]; d[i + 2] = c1[2]; d[i + 3] = Math.round(255 * cl((k * 0.85 + rim) * vy)); } }
    g.putImageData(im, 0, 0); });
  /* a falling strand of light (vertical): pearl core, pink edges, faded at both ends */
  const streakSpr = (col) => fxSprite('lu2streak|' + col, 12, 96, (g, W, Hh) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, rgbaS(col, 0)); gr.addColorStop(0.35, rgbaS(col, 0.5)); gr.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.65, rgbaS(col, 0.5)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, Hh); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.5, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gv; g.fillRect(0, 0, W, Hh); });
  /* the lit circle on the floor (drawn squashed): a pool of blush light, a rose band at the rim with a pearl leading edge,
     an inner dotted ring of tiny hearts */
  const floorSpr = () => fxSprite('lu2floor', 320, 320, (g, W) => {
    const c0 = W / 2; let gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(255,212,238,0.3)'], [0.3, 'rgba(255,143,219,0.26)'], [0.6, 'rgba(255,92,203,0.2)'], [0.82, 'rgba(255,92,203,0.32)'], [0.9, 'rgba(255,92,203,0.75)'], [0.935, 'rgba(255,244,252,0.95)'], [0.96, 'rgba(255,92,203,0.45)'], [1, 'rgba(255,92,203,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, W, W);
    g.translate(c0, c0); for (let i = 0; i < 16; i++) { const b = i / 16 * TAU, r = c0 * 0.74; g.save(); g.translate(Math.cos(b) * r, Math.sin(b) * r); g.rotate(b + Math.PI / 2); heartPath(g, 0, -1.5, 0.32); g.fillStyle = 'rgba(255,212,238,0.75)'; g.fill(); g.restore(); }
    g.strokeStyle = 'rgba(255,212,238,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, c0 * 0.66, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, c0 * 0.82, 0, TAU); g.stroke(); });
  /* a ring of light on the floor (the tick pulse) */
  const ringSpr = () => fxSprite('lu2ring', 192, 192, (g, W) => { const c0 = W / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); [[0, 'rgba(255,92,203,0)'], [0.75, 'rgba(255,92,203,0)'], [0.88, 'rgba(255,143,219,0.6)'], [0.94, 'rgba(255,244,252,0.95)'], [1, 'rgba(255,212,238,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, W, W); });
  const gl = (c, col, x, y, r, a, sq) => { if (!(a > 0.005) || r < 1) return; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r * (sq || 1), r * 2, r * 2 * (sq || 1)); };

  /* ================= 4. Sunflare ================= */
  U.sunflare = (C, h) => {
    H = h;
    const x = C.tx, y = C.ty, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), L = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    const R = (3.6 + 0.3 * (ev - 1)) * C.K, HW = 2.5 + 0.12 * (ev - 1), Z = 3.9 + 0.15 * (ev - 1);
    const A0 = 0.75, ACT = 7, A1 = A0 + ACT, FADE = 1.1, TICK = 0.5, T0 = A0 + 0.25, NT = Math.floor((ACT - 0.25 - 1e-6) / TICK) + 1;
    const dmg = C.base * 15 * C.K * (1 + 0.08 * (ev - 1)) / NT;
    H.X.banner('SUNFLARE', '', ROSE, 1.6); if (H.X.sfx.hum) H.X.sfx.hum();
    /* the floaters round the shaft: little hearts and stars rising in loose spirals; at Adept and up a wider spread of heights */
    const NFL = ev >= 7 ? 22 : ev >= 4 ? 16 : 11, fl = [];
    for (let i = 0; i < NFL; i++) fl.push({ heart: i % 5 !== 2 && i % 5 !== 4, a: R1(i * 3.1 + 1) * TAU, w: (0.25 + 0.2 * R1(i * 7.7)) * (i % 2 ? 1 : -1), rr: 0.55 + 0.5 * R1(i * 1.9), h0: R1(i * 4.3), vh: 0.09 + 0.06 * R1(i * 2.2), hr: ev >= 4 ? 0.95 : 0.65, sz: 0.2 + 0.14 * R1(i * 9.1), sp: 1.2 + 1.4 * R1(i * 6.6), col: ev >= 7 && i % 7 === 3 ? GOLD : i % 3 === 1 ? BLUSH : CANDY });
    const NST = ev >= 7 ? 26 : ev >= 4 ? 18 : 12, NARC = ev >= 7 ? 7 : ev >= 4 ? 5 : 3;
    const warm = [heartSpr, bandSpr, () => coronaSpr(1), shaftSpr, floorSpr, ringSpr, miniHeart, miniEdge, () => starSpr(BLUSH), () => starSpr(CANDY), () => starSpr(GOLD), () => streakSpr(BLUSH), () => streakSpr(GOLD)]; if (L >= 2) warm.push(() => coronaSpr(2)); if (L >= 3) warm.push(() => coronaSpr(3));
    H.add({ life: A1 + FADE + 0.05, x, y, wi: 0, nt: 0, pulse: 0,
      update(dt, f) {
        for (let q = 0; q < 3 && f.wi < warm.length; q++) warm[f.wi++]();
        f.pulse = Math.max(0, f.pulse - dt * 2.6);
        // the ticks: every monster in the circle; a little light rises from each one hit
        while (f.nt < NT && f.t >= T0 + f.nt * TICK) { f.nt++; f.pulse = 1; const hit = H.near(x, y, R); H.hitArea(x, y, R, dmg, C.dmgO()); for (const m of hit) { H.P({ kind: 'glow', x: m.x, y: m.y - 0.3, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 0.9 + (m.r || 0.4), color: ROSE, alpha: 0.45 }); for (let k = 0; k < H.n(2); k++) H.P({ kind: 'star', x: m.x + (Math.random() - 0.5) * 0.6, y: m.y - 0.2, vx: (Math.random() - 0.5) * 0.6, vy: -1.2 - Math.random(), life: 0.7, max: 0.7, size: 2.2 + Math.random() * 1.5, color: k % 2 ? BLUSH : ROSE }); } }
        const hy = y - Z;
        // formation: motes drawn in toward the heart's place
        if (f.t < A0) { for (let k = 0; k < 2; k++) if (Math.random() < 0.9 * H.Q()) { const b = Math.random() * TAU, r = 1.6 + Math.random() * 1.4; H.P({ kind: 'spark', x: x + Math.cos(b) * r, y: hy + Math.sin(b) * r * 0.8, vx: -Math.cos(b) * r * 2.2, vy: -Math.sin(b) * r * 1.8, life: 0.4, max: 0.4, size: 2, color: k ? BLUSH : ROSE, drag: 1 }); } }
        // active: fine dust drifting up out of the lit floor
        else if (f.t < A1) { if (Math.random() < dt * 14 * H.Q()) { const b = Math.random() * TAU, r = Math.sqrt(Math.random()) * R * 0.9; H.P({ kind: 'spark', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r * 0.9, vx: (Math.random() - 0.5) * 0.3, vy: -0.8 - Math.random() * 0.8, life: 1.1, max: 1.1, size: 1.6, color: Math.random() < 0.5 ? BLUSH : PEARL }); } }
        // the dissolution: fine pink (faint gold at Celestial) light out of the heart
        else { const k = (f.t - A1) / FADE; if (k < 0.85) for (let q = 0; q < H.n(4); q++) { const b = Math.random() * TAU, r = Math.random() * HW * 0.45; H.P({ kind: Math.random() < 0.3 ? 'star' : 'spark', x: x + Math.cos(b) * r, y: hy + Math.sin(b) * r * 0.8, vx: Math.cos(b) * (0.6 + Math.random()), vy: Math.sin(b) * 0.6 - 0.4 - Math.random() * 0.8, life: 0.9, max: 0.9, size: 1.5 + Math.random() * 1.6, color: ev >= 7 && q % 4 === 3 ? GOLD : q % 2 ? BLUSH : ROSE, drag: 1.2 }); } }
      },
      drawUnder(c, f, X, Y, T) {
        const on = f.t < A0 ? 0 : f.t < A0 + 0.35 ? (f.t - A0) / 0.35 : f.t < A1 ? 1 : 1 - (f.t - A1) / (FADE * 0.8), a = cl(on); if (!(a > 0.01)) return;
        const rp = R * T, pu = f.pulse;
        c.save(); c.globalCompositeOperation = 'lighter';
        gl(c, ROSE, X, Y, rp * 1.25, 0.22 * a, H.GY);
        c.translate(X, Y); c.scale(1, H.GY); c.rotate(f.t * 0.12); c.globalAlpha = a * (0.62 + 0.18 * pu); const fs = floorSpr(); c.drawImage(fs, -rp, -rp, rp * 2, rp * 2);
        // the pulse: a ring of light running out from the centre at each tick
        if (pu > 0.02) { const rr = rp * (0.25 + 0.75 * (1 - pu)); c.globalAlpha = a * pu * 0.5; c.drawImage(ringSpr(), -rr, -rr, rr * 2, rr * 2); }
        c.restore(); },
      draw(c, f, X, Y, T, t) {
        const ft = f.t, s0 = scr(c), hw = HW * T, form = cl(ft / A0), out = ft > A1 ? cl((ft - A1) / FADE) : 0, pu = f.pulse;
        const hs = heartSpr(), m = hs._m; if (!m) return;
        // where the heart hangs: Z tiles over the aim, kept on the screen
        const HX = X, HY = Math.max(Y - Z * T, s0.y0 + s0.h * 0.16 + hw * 0.5);
        const grow = form < 1 ? H.ease.back(sstep(0.15, 1, form)) : 1, scale = grow * (1 - 0.18 * H.ease.in(out)), ha = Math.min(1, form * 1.6) * (1 - sstep(0.25, 1, out));
        const bright = sstep(0.75, 1, form) * (1 - out);   // the brightening into the active state
        /* ---- the shaft and what flows in it (cut away round the pet) ---- */
        const sh = ft < A0 ? 0 : ft < A0 + 0.3 ? H.ease.out((ft - A0) / 0.3) : 1, sa = (ft < A1 ? 1 : 1 - sstep(0, 0.7, out)) * (ft < A0 ? 0 : 1);
        const top = HY + hw * 0.1, bot0 = Y + R * T * H.GY * 0.35, bot = lerp(top, bot0, sh);
        const botN = ft > A1 ? lerp(bot, top + (bot0 - top) * 0.15, H.ease.in(sstep(0, 0.8, out))) : bot, len = botN - top, bw = R * T * 2 * 0.98;
        const fls = fl.map(q => { const hh = (q.h0 + ft * q.vh) % 1, ang = q.a + ft * q.w, hgt = (0.25 + hh * (Z - 0.6) * q.hr) * T, u = cl((Y - hgt - top) / Math.max(1, bot0 - top)), half = lerp(TOPK, 1, u) * bw / 2; return { q, hh, ang, px: HX + Math.cos(ang) * half * q.rr, py: Y - hgt + Math.sin(ang) * half * q.rr * H.GY * 0.5, front: Math.sin(ang) > 0 }; });
        const drawFl = front => { for (const o of fls) { if (o.front !== front) continue; const q = o.q, al = sa * sstep(0, 0.12, o.hh) * (1 - sstep(0.8, 1, o.hh)) * (front ? 1 : 0.6); if (!(al > 0.02)) continue; const sz = q.sz * T * (front ? 1 : 0.85);
          c.globalAlpha = al; if (q.heart) { const sp = Math.cos(ft * q.sp + q.a), sx = Math.abs(sp); c.globalCompositeOperation = 'lighter'; gl(c, ROSE, o.px, o.py, sz * 1.5, al * 0.35); c.globalAlpha = al; c.globalCompositeOperation = 'source-over';
            if (sx < 0.35) c.drawImage(miniEdge(), o.px - sz * 0.13, o.py - sz * 0.48, sz * 0.26, sz * 0.96); if (sx > 0.12) c.drawImage(miniHeart(), o.px - sz * 0.52 * sx, o.py - sz * 0.5, sz * 1.04 * sx, sz); }
          else { c.globalCompositeOperation = 'lighter'; const k = sz * 1.3 * (0.85 + 0.15 * Math.sin(ft * 5 + q.a * 3)); c.save(); c.translate(o.px, o.py); c.rotate(ft * 0.8 * (q.w > 0 ? 1 : -1)); c.drawImage(starSpr(q.col === GOLD ? GOLD : q.col), -k / 2, -k / 2, k, k); c.restore(); } } c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; };
        c.save(); petHole(c, T);
        drawFl(false);
        if (len > 2 && sa > 0.01) {
          c.globalCompositeOperation = 'lighter';
          // the cone (it spans the whole fall from the heart to the floor; while it grows or retracts it is clipped)
          c.save(); c.beginPath(); c.rect(HX - bw, top - 2, bw * 2, len + 4); c.clip();
          c.globalAlpha = sa * (0.58 + 0.12 * pu); c.drawImage(shaftSpr(), HX - bw / 2, top, bw, bot0 - top);
          c.globalAlpha = sa * 0.18; c.drawImage(shaftSpr(), HX - bw * 0.27, top, bw * 0.54, bot0 - top);
          // light flowing down: strands sliding toward the floor faster than the floaters rise; fine strands at Celestial
          const NS = H.n(NST); for (let i = 0; i < NS; i++) { const sx = (R1(i * 5.3 + 2) * 2 - 1) * 0.85, sp = 0.7 + 0.5 * R1(i * 2.9), u = (R1(i * 1.7) + ft * sp * 0.45) % 1, yy = top + u * (bot0 - top); if (yy > botN) continue; const half = lerp(TOPK, 1, u) * bw / 2, gold = ev >= 7 && i % 5 === 2, sl = T * (1.3 + 0.9 * R1(i * 8.1)), sw = T * (ev >= 7 && i % 2 ? 0.1 : 0.18);
            c.globalAlpha = sa * (gold ? 0.3 : 0.55) * Math.sin(Math.PI * u); c.drawImage(streakSpr(gold ? GOLD : BLUSH), HX + sx * half - sw / 2, yy - sl / 2, sw, sl); }
          c.restore();
          // where the beam meets the floor: a soft flat splash
          c.globalAlpha = 1; gl(c, CANDY, HX, botN, bw * 0.4, sa * (0.18 + 0.12 * pu) * sh, H.GY); gl(c, PEARL, HX, botN, bw * 0.12, sa * 0.12 * sh, H.GY);
          c.globalCompositeOperation = 'source-over';
          }
        c.restore();
        /* ---- the heart, its halo and corona ---- */
        if (ha > 0.01) {
          c.save(); c.globalCompositeOperation = 'lighter';
          // the halo: rose outside, blush within, a breath with the ticks
          gl(c, ROSE, HX, HY, hw * 1.6 * scale, ha * (0.34 + 0.16 * bright + 0.12 * pu)); gl(c, MAG, HX, HY, hw * 1.05 * scale, ha * 0.22);
          // the corona: layers turning at different speeds; at the end they fold in toward the heart
          const fold = 1 - 0.75 * H.ease.in(out), cs = scale * fold * (0.55 + 0.45 * H.ease.out(sstep(0.3, 1, form))) * (1 + 0.04 * pu), ca = ha * sstep(0.3, 1, form) * (1 - sstep(0.1, 0.8, out));
          const lay = [[1, 0.25, 0.95, 0.95]]; if (L >= 2) lay.push([2, -0.42, 1.08, 0.6]); if (L >= 3) lay.push([3, 0.12, 1.22, 0.75]);
          for (const [li, sp, rk, al] of lay) { const rr = hw * rk * cs; if (rr < 2) continue; c.save(); c.translate(HX, HY); c.rotate(ft * sp + out * 2.5 * (sp > 0 ? 1 : -1) + li); c.globalAlpha = Math.min(1, ca * al * (1 + 0.3 * pu)); c.drawImage(coronaSpr(li), -rr, -rr, rr * 2, rr * 2); c.restore(); }
          // narrow bright arcs peeling out of the corona and fading
          if (ca > 0.05) { c.lineCap = 'round'; for (let i = 0; i < NARC; i++) { const per = 1.5 + 0.4 * R1(i), ph = (ft / per + i / NARC) % 1, cyc = Math.floor(ft / per + i / NARC), a0 = R1(cyc * 7.3 + i * 13.1) * TAU, dir = R1(cyc * 3.1 + i) < 0.5 ? 1 : -1, rc = hw * 0.5 * cs;
            const u1 = Math.min(1, ph * 1.7), u0 = Math.max(0, ph * 1.7 - 0.55); if (u1 <= u0) continue; c.globalAlpha = ca * (1 - sstep(0.55, 1, ph));
            for (const [col, lw] of [[ROSE, 3.2], [PEARL, 1.1]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (let j = 0; j <= 10; j++) { const u = lerp(u0, u1, j / 10), r = rc * (1 + 0.75 * u), b = a0 + dir * 0.7 * u; if (j) c.lineTo(HX + Math.cos(b) * r, HY + Math.sin(b) * r); else c.moveTo(HX + Math.cos(b) * r, HY + Math.sin(b) * r); } c.stroke(); } } }
          c.restore();
          // the heart itself (gently bobbing)
          const k = hw * scale / (32 * m.s), bob = Math.sin(t * 1.6) * T * 0.06, cyS = HY + bob;
          if (k > 0.01) {
            c.save(); c.globalAlpha = ha; c.drawImage(hs, HX - m.cx * k, cyS - m.cy * k, hs.width * k, hs.height * k);
            // its own light: the heart again, added over itself (soft internal luminosity; brighter as it goes active and at each tick)
            // its moving surface: bands of radiance turning slowly (a second set turning back at Adept), a glint sweeping across
            const s = m.s * k, oy = cyS - 2.5 * s; c.save(); heartPath(c, HX, oy, s); c.clip(); c.globalCompositeOperation = 'lighter';
            const br = hw * scale * 0.85; gl(c, ROSE, HX - 1 * s, oy + 3 * s, 15 * s, ha * (0.16 + 0.14 * bright + 0.12 * pu)); gl(c, CANDY, HX - 2 * s, oy + 1 * s, 9 * s, ha * 0.22); c.globalAlpha = ha * (0.35 + 0.15 * bright + 0.2 * pu); c.save(); c.translate(HX - 1 * s, oy + 3 * s); c.rotate(ft * 0.35); c.drawImage(bandSpr(), -br, -br, br * 2, br * 2); c.restore();
            if (L >= 2) { c.globalAlpha = ha * 0.3; c.save(); c.translate(HX - 1 * s, oy + 3 * s); c.rotate(-ft * 0.55 + 0.4); c.drawImage(bandSpr(), -br * 0.8, -br * 0.8, br * 1.6, br * 1.6); c.restore(); }
            const sw = ((ft * 0.32) % 1) * 1.6 - 0.3; gl(c, BLUSH, HX + (sw - 0.5) * 30 * s, oy + (0.5 - sw) * 16 * s, 7 * s, ha * 0.4, 0.55);
            // the pearl centre at Celestial; a brightening as it goes active
            if (L >= 3) { gl(c, BLUSH, HX - 1 * s, oy + 3 * s, 6 * s, ha * (0.45 + 0.15 * Math.sin(t * 3))); gl(c, '#FFFFFF', HX - 1 * s, oy + 3 * s, 2.4 * s, ha * 0.7); }
            gl(c, BLUSH, HX, oy + 2 * s, 14 * s, ha * (0.5 * sstep(0.7, 0.9, form) * (1 - sstep(0.9, 1.2, ft / A0)) + 0.12 * pu));
            c.restore(); c.restore();
            // the forming heart: a ribbon of rose light traces its outline before it fills
            if (form < 1) { const u = sstep(0, 0.75, form); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = 1 - sstep(0.7, 1, form); const sF = m.s * hw / (32 * m.s), oF = HY - 2.5 * sF;
              for (const [col, lw] of [[ROSE, 4], [PEARL, 1.4]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); const N = Math.max(2, Math.round(72 * u)); for (const sg of [1, -1]) { c.moveTo(HX, oF + 17 * sF); for (let i = 0; i <= N; i++) { const q = Math.PI - sg * (i / 72) * Math.PI, xx = 16 * Math.pow(Math.sin(q), 3), yy = -(13 * Math.cos(q) - 5 * Math.cos(2 * q) - 2 * Math.cos(3 * q) - Math.cos(4 * q)); c.lineTo(HX + xx * sF, oF + yy * sF); } } c.stroke(); } c.restore(); } }
        }
        /* ---- floaters in front of the shaft ---- */
        c.save(); petHole(c, T); drawFl(true); c.restore();
      } });
  };
})();
