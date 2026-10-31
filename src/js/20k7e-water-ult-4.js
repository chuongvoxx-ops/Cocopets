/* ---------- Water, reworked: Neptune's Trident, Jellyfish Aurora ----------
   Neptune's Trident (the second strongest water Ultimate, ~18 x base): the sky over the aim ripples like the surface of
   an ocean and a giant trident (a long tapered shaft, a curved crosspiece, three barbed prongs; translucent deep blue,
   brilliant aqua edges, white currents flowing inside) slowly emerges through it point first, water streaming down to
   its tips and dripping as luminous droplets, while an aqua impact mark brightens on the ground. It hangs, then
   plunges with water ribbons streaming behind it, its points glowing white inside a thin cone of mist. The centre prong
   pierces first, then the outer two; the ground fractures out from the three points (temporary decals: dark fissures
   with glowing blue cores and a few displaced fragments), blue light blazes through the cracks, then water erupts: a
   thick advancing ring, towering curved splash sheets, foam, glitter and jets bursting from the cracks in an outward
   sequence. The trident stays embedded with water running down it, then the water drains into the fissures, the
   tridents dissolve from their tips upward into aqua light and the last droplets fall through the mist; the decals fade
   out completely. Hatchling: the giant alone. Adept: four small tridents follow in two pairs. Celestial: ten small
   ones emerge from their own sky ripples while the giant falls and strike in five quick pairs moving outward, each
   with its own cracks, glow and burst, their fractures joined to the centre in one broken pattern of luminous water.
   One damage event per trident; the giant's is the biggest single hit.
   Jellyfish Aurora: luminous jellyfish (domed bells that contract to swim, glowing rims, inner light, an aurora
   shimmer, trailing ribbon tentacles that lag behind them) drift down and float round the arena on wandering paths,
   going after monsters and stinging them (tentacle lashes, little electric-aqua sparks, a brief slow), bobbing,
   turning and bumping apart; bubbles and glowing motes rise from them. 1 big + 1 small at Hatchling, 2 + 2 at Adept,
   3 big + 4 small at Celestial; ~8 s, then they rise and fade. ~14 x base in total. */
(() => {
  const U = ELEM_IMPL.water.ult, TAU = Math.PI * 2;
  let H, K;
  const W = { white: '#FFFFFF', foam: '#F2FBFF', pale: '#CFF6FF', aqua: '#6FF2FF', turq: '#3FD6E0', water: '#2E9BE6', sapph: '#1A4FB0', deep: '#0E2F7A', abyss: '#081E52' };
  const cl = u => Math.max(0, Math.min(1, u));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  function petHole(c, T) { const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
  const glow = (c, x, y, r, col, a) => K.glow(c, x, y, r, col, a);
  /* a thin ripple ring and a water ring with foam (floor or sky plane; squashed when drawn) */
  const rippleSpr = () => fxSprite('wu4rip', 64, 64, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(63,214,224,0)'], [0.62, 'rgba(63,214,224,0.08)'], [0.8, 'rgba(111,242,255,0.6)'], [0.88, 'rgba(255,255,255,0.95)'], [0.94, 'rgba(111,242,255,0.4)'], [1, 'rgba(111,242,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const ringSpr = () => fxSprite('wu4ring', 256, 256, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(63,214,224,0)'], [0.55, 'rgba(46,155,230,0.06)'], [0.72, 'rgba(46,155,230,0.3)'], [0.84, 'rgba(63,214,224,0.6)'], [0.91, 'rgba(111,242,255,0.9)'], [0.95, 'rgba(255,255,255,1)'], [0.98, 'rgba(160,240,255,0.4)'], [1, 'rgba(160,240,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 9; i++) { const b = R1(i * 3.1) * TAU; for (let k = 0; k < 7; k++) { const q = b + (k / 6 - 0.5) * 0.3, rr = c0 * (0.92 + 0.05 * R1(i * 9 + k)); g.fillStyle = `rgba(255,255,255,${0.45 + 0.4 * R1(k + i * 2)})`; g.beginPath(); g.arc(c0 + Math.cos(q) * rr, c0 + Math.sin(q) * rr, 2.5 + 5 * R1(i * 5 + k * 2), 0, TAU); g.fill(); } } });
  /* a jet of water standing on the floor (bottom = floor): turquoise body, a white core, a rounded foaming head */
  const jetSpr = () => fxSprite('wu4jet', 32, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); [[0, 'rgba(46,155,230,0)'], [0.25, 'rgba(46,155,230,0.55)'], [0.45, 'rgba(160,248,255,0.85)'], [0.5, 'rgba(255,255,255,0.95)'], [0.55, 'rgba(160,248,255,0.85)'], [0.75, 'rgba(46,155,230,0.55)'], [1, 'rgba(46,155,230,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.beginPath(); g.moveTo(w * 0.2, h); g.quadraticCurveTo(w * 0.1, h * 0.3, w * 0.5, h * 0.06); g.quadraticCurveTo(w * 0.9, h * 0.3, w * 0.8, h); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w * (0.3 + 0.4 * R1(i)), h * (0.06 + 0.12 * R1(i * 3)), 2 + 3 * R1(i * 7), 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,1)'); gv.addColorStop(0.8, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  /* a thin cone of mist (apex at the bottom middle), additive */
  const coneSpr = () => fxSprite('wu4cone', 64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(207,246,255,0)'); gr.addColorStop(0.5, 'rgba(207,246,255,0.5)'); gr.addColorStop(1, 'rgba(207,246,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(0, 0); g.lineTo(w, 0); g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.6, 'rgba(0,0,0,0.8)'); gv.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });

  /* ---- the trident: a cached picture pointing down (tips at the bottom), 6 frames of its inner currents ---- */
  const TW = 96, TH = 400, NCU = 6, TIPS = [[48, 396], [16, 372], [80, 372]];
  function triPath() { const p = new Path2D();
    // the shaft, tapering toward its butt, with a rounded cap
    p.moveTo(42, 8); p.lineTo(54, 8); p.lineTo(59, 256); p.lineTo(37, 256); p.closePath(); p.arc(48, 9, 8.5, 0, TAU);
    // a band round the shaft near the butt
    p.rect(40, 28, 16, 8); p.rect(39, 228, 18, 8);
    // the curved crosspiece
    const yu = x => 250 + 0.024 * (x - 48) * (x - 48); p.moveTo(9, yu(9)); for (let x = 9; x <= 87; x += 6) p.lineTo(x, yu(x)); p.lineTo(87, yu(87) + 18); for (let x = 87; x >= 9; x -= 6) p.lineTo(x, yu(x) + 18); p.closePath();
    // three barbed prongs
    const prong = (bx, by, tx, ty, hw) => { const L = ty - by, nx = (tx - bx) / L; const at = (u, k) => [bx + (tx - bx) * u + k, by + L * u]; const pts = [at(0, -hw), at(0.62, -hw * 0.7), at(0.66, -hw * 1.75), at(1, 0), at(0.66, hw * 1.75), at(0.62, hw * 0.7), at(0, hw)]; p.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) p.lineTo(q[0], q[1]); p.closePath(); return nx; };
    prong(48, 252, 48, 396, 8.5); prong(13, yu(13) + 8, 16, 372, 7); prong(83, yu(83) + 8, 80, 372, 7);
    return p; }
  const triFr = fi => fxSprite('wu4tri|' + fi, TW, TH, (g, w, h) => { const P = triPath();
    g.save(); g.strokeStyle = 'rgba(111,242,255,0.28)'; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke(P); g.restore();
    const gr = g.createLinearGradient(0, 0, w, 0); [[0, 'rgba(120,225,250,0.9)'], [0.3, 'rgba(46,155,230,0.88)'], [0.62, 'rgba(26,79,176,0.9)'], [1, 'rgba(14,47,122,0.92)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fill(P); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(63,214,224,0.16)'; g.fill(P); g.restore();
    // white currents flowing down inside (clipped to the body)
    g.save(); g.clip(P); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    const route = (k, y) => { if (y < 256) return 48 + Math.sin(y * 0.07 + k) * 2.2; const pr = k % 3, u = (y - 256) / 140; return pr === 0 ? 48 : pr === 1 ? 13 + 3 * u + Math.sin(y * 0.1 + k) : 83 - 3 * u + Math.sin(y * 0.1 + k); };
    for (let k = 0; k < 14; k++) { const y0 = ((k / 14 + R1(k * 3.3) * 0.05 + fi / NCU) % 1) * 420 - 20, len = 26 + 20 * R1(k); g.globalAlpha = 0.75; g.strokeStyle = k % 2 ? 'rgba(255,255,255,0.85)' : 'rgba(160,248,255,0.85)'; g.lineWidth = k % 3 ? 1.2 : 2; g.beginPath(); for (let j = 0; j <= 6; j++) { const y = y0 + len * j / 6; if (j) g.lineTo(route(k, y), y); else g.moveTo(route(k, y), y); } g.stroke(); }
    g.globalAlpha = 0.5; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(45.5, 14); g.lineTo(44, 250); g.stroke(); g.restore();
    // brilliant aqua edges
    g.strokeStyle = 'rgba(111,242,255,0.95)'; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke(P); });
  /* draw a trident whose centre tip is at (x, y), L px long, leaning ang; cutTop: the part above that screen y is hidden
     (emerging through the sky); cutBot: the part below it is hidden (in the ground); dis 0..1 dissolved from the tips up */
  function drawTri(c, x, y, L, ang, a, fi, cutTop, cutBot, dis) { if (!(a > 0.01) || L < 4) return; const s = L / TH;
    c.save(); if (cutTop != null || cutBot != null || dis > 0) { let y0 = cutTop == null ? -1e5 : cutTop, y1 = cutBot == null ? 1e5 : cutBot; if (dis > 0) y1 = Math.min(y1, y - L * dis); c.beginPath(); c.rect(-1e5, y0, 2e5, Math.max(0, y1 - y0)); c.clip(); }
    c.translate(x, y); if (ang) c.rotate(ang); c.globalAlpha = Math.min(1, a); c.drawImage(triFr(fi), -48 * s, -396 * s, TW * s, TH * s); c.restore(); }
  const tipAt = (x, y, L, ang, k) => { const s = L / TH, dx = (TIPS[k][0] - 48) * s, dy = (TIPS[k][1] - 396) * s, ca = Math.cos(ang), sa = Math.sin(ang); return [x + dx * ca - dy * sa, y + dx * sa + dy * ca]; };

  /* ---- the fractures: branching cracks from the contact points, pictured once per trident (a dark decal and its glow) ---- */
  function genCracks(pts, scale, n, seed, link) { const L = [];
    const grow = (x, y, b, len, w, depth, sd) => { const P = [[x, y]]; let cx = x, cy = y; const seg = 5; for (let k = 1; k <= seg; k++) { b += (R1(sd * 7 + k) - 0.5) * 0.8; cx += Math.cos(b) * len / seg; cy += Math.sin(b) * len / seg; P.push([cx, cy]); if (depth < 2 && k >= 2 && R1(sd * 3 + k * 5) < 0.45) grow(cx, cy, b + (R1(sd + k) < 0.5 ? 0.7 : -0.7), len * 0.5, w * 0.6, depth + 1, sd * 1.7 + k); } L.push({ P, w }); };
    pts.forEach((p, i) => { const m = i === 0 ? n : Math.max(2, n - 3); for (let j = 0; j < m; j++) grow(p[0], p[1], j / m * TAU + R1(seed + i * 3 + j) * 0.6, scale * (i === 0 ? 1 : 0.6) * (0.7 + 0.5 * R1(seed * 2 + j + i)), (i === 0 ? 1 : 0.7) * scale * 0.06, 0, seed + i * 11 + j * 3); });
    if (link) L.push({ P: [[pts[0][0], pts[0][1]], [pts[0][0] + (link[0] - pts[0][0]) * 0.35 + (R1(seed) - 0.5) * 0.3, pts[0][1] + (link[1] - pts[0][1]) * 0.35], [pts[0][0] + (link[0] - pts[0][0]) * 0.7 + (R1(seed + 1) - 0.5) * 0.3, pts[0][1] + (link[1] - pts[0][1]) * 0.7], [link[0], link[1]]], w: scale * 0.04 });
    return L; }
  /* paints the cracks (world units round (ox, oy)) at T0 px per tile, floor-squashed: dark fissures and a few displaced
     fragments in one picture, glowing blue cores in another */
  function crackImgs(L, ox, oy, T0, frags, seed) { const SPX = 1.25; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const l of L) for (const p of l.P) { const X = (p[0] - ox) * T0, Y = (p[1] - oy) * T0 * H.GY; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); } x0 -= 24; y0 -= 24; x1 += 24; y1 += 24;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * SPX); cv.height = Math.ceil((y1 - y0) * SPX); const g = cv.getContext('2d'); g.scale(SPX, SPX); g.translate(-x0, -y0); g.lineCap = 'round'; g.lineJoin = 'round'; cv._x0 = x0; cv._y0 = y0; cv._w = x1 - x0; cv._h = y1 - y0; return [cv, g]; };
    const path = (g, l) => { g.beginPath(); l.P.forEach((p, i) => { const X = (p[0] - ox) * T0, Y = (p[1] - oy) * T0 * H.GY; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); };
    const [dk, gd] = mk(), [lt, gl] = mk();
    // displaced fragments near the centre: raised slabs with a lit edge and a dark gap below
    for (let i = 0; i < frags; i++) { const b = R1(seed + i * 5) * TAU, r = T0 * (0.25 + 0.5 * R1(seed + i)), cx = Math.cos(b) * r, cy = Math.sin(b) * r * H.GY, sz = T0 * (0.18 + 0.14 * R1(seed * 3 + i)), pts = []; for (let k = 0; k < 5; k++) { const q = k / 5 * TAU + R1(i * 7 + k) * 0.8, rr = sz * (0.6 + 0.5 * R1(i + k * 3)); pts.push([cx + Math.cos(q) * rr, cy + Math.sin(q) * rr * H.GY]); }
      gd.fillStyle = 'rgba(4,12,34,0.6)'; gd.beginPath(); pts.forEach((p, k) => k ? gd.lineTo(p[0], p[1] + 3) : gd.moveTo(p[0], p[1] + 3)); gd.closePath(); gd.fill();
      gd.fillStyle = 'rgba(70,82,110,0.55)'; gd.beginPath(); pts.forEach((p, k) => k ? gd.lineTo(p[0], p[1] - 2) : gd.moveTo(p[0], p[1] - 2)); gd.closePath(); gd.fill(); gd.strokeStyle = 'rgba(160,240,255,0.55)'; gd.lineWidth = 1.2; gd.stroke(); }
    for (const l of L) { path(gd, l); gd.strokeStyle = 'rgba(4,12,34,0.7)'; gd.lineWidth = Math.max(1.5, l.w * T0 * 1.6); gd.stroke(); }
    for (const l of L) { path(gl, l); gl.strokeStyle = 'rgba(46,155,230,0.45)'; gl.lineWidth = Math.max(3, l.w * T0 * 2.6); gl.stroke(); gl.strokeStyle = 'rgba(111,242,255,0.9)'; gl.lineWidth = Math.max(1.2, l.w * T0 * 0.8); gl.stroke(); gl.strokeStyle = 'rgba(255,255,255,0.85)'; gl.lineWidth = Math.max(0.6, l.w * T0 * 0.3); gl.stroke(); }
    return [dk, lt]; }

  /* ================= Neptune's Trident ================= */
  U.neptunetrident = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), lvl = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, NSM = K.lv(C, [0, 4, 10]), T0 = H.X.Tz();
    let x = C.tx, y = C.ty; { const d = Math.hypot(x - me.x, y - me.y); if (d < 2.4) { const a = d > 0.05 ? Math.atan2(y - me.y, x - me.x) : C.a; x = me.x + Math.cos(a) * 2.4; y = me.y + Math.sin(a) * 2.4; } }
    const TOT = C.base * 18 * C.K * K.evoK(C), gShare = NSM ? (NSM >= 10 ? 0.35 : 0.5) : 1, RG = (2.4 + 0.1 * (ev - 1)) * Math.sqrt(C.K), LG = 6.4, ZS = 8.6;
    const IMP = 2.3, FADE = NSM >= 10 ? 4.6 : NSM ? 4.0 : 3.6, END = FADE + 1.9;
    H.X.banner("NEPTUNE'S TRIDENT", '', C.col, 1.8); H.X.sfx.hum();
    /* the giant and the small ones: pairs on opposite sides, each pair further out, striking after the main impact */
    const tris = [{ x, y, L: LG, Z: ZS, ang: 0, big: true, t0: 0.35, imp: IMP, dmg: TOT * gShare, R: RG, sd: 7 }];
    /* the small ones go for the monsters round the giant's strike first (nearest first, so the pairs still move outward) */
    const foes = H.living().filter(m => { const d = Math.hypot(m.x - x, m.y - y); return d > RG * 0.5 && d < RG * 2.6; }).sort((p, q) => Math.hypot(p.x - x, p.y - y) - Math.hypot(q.x - x, q.y - y));
    for (let i = 0; i < NSM; i++) { const p = i >> 1, b = R1(ev * 3.1) * TAU + p * 1.13 + (i & 1) * Math.PI, r = RG * (0.85 + 0.42 * p) + 0.4 * R1(i); let sx = x + Math.cos(b) * r, sy = y + Math.sin(b) * r * 0.85; const mt = foes[i]; if (mt) { sx = mt.x + (R1(i * 9) - 0.5) * 0.3; sy = mt.y + (R1(i * 4) - 0.5) * 0.3; } const dp = Math.hypot(sx - me.x, sy - me.y); if (dp < 1.6) { sx = me.x + (sx - me.x) / Math.max(0.05, dp) * 1.6; sy = me.y + (sy - me.y) / Math.max(0.05, dp) * 1.6; }
      tris.push({ x: sx, y: sy, L: 2.8, Z: ZS - 0.6 + 0.8 * R1(i * 5), ang: (R1(i * 7.7) - 0.5) * 0.5, big: false, t0: IMP - 0.5 + 0.06 * i, imp: IMP + 0.55 + p * 0.22 + (i & 1) * 0.06, dmg: TOT * (1 - gShare) / Math.max(1, NSM), R: 1.25 * Math.sqrt(C.K), sd: 31 + i * 13 }); }
    for (const t of tris) { const hang = t.big ? 1.4 : t.t0 + 0.45, pre = t.imp - (t.big ? 0.4 : 0.22); Object.assign(t, { hang, pre, hit: false, cr: null, jets: [], dis0: FADE + (t.big ? 0.5 : 0.1 * R1(t.sd)) }); }
    /* where a trident's centre tip is (height above the floor in tiles) */
    const tipZ = (t, tt) => { const zH = t.Z - t.L * 0.92, zE = -t.L * (t.big ? 0.07 : 0.1); if (tt < t.t0) return t.Z; if (tt < t.hang) return t.Z - (t.Z - zH) * H.ease.out(cl((tt - t.t0) / (t.hang - t.t0))); if (tt < t.pre) return zH + Math.sin((tt - t.hang) * 4) * 0.08; if (tt < t.imp) return zH - (zH - 0) * H.ease.in(cl((tt - t.pre) / (t.imp - t.pre))); return zE * H.ease.out(cl((tt - t.imp) / 0.12)); };
    const warm = [() => rippleSpr(), () => ringSpr(), () => jetSpr(), () => coneSpr()]; for (let i = 0; i < NCU; i++) warm.push(() => triFr(i));
    const impact = t => { t.hit = true; const big = t.big;
      H.hitArea(t.x, t.y, t.R, t.dmg, C.dmgO({ chill: true }));
      H.X.shake(big ? 12 : 4, big ? 0.5 : 0.18); H.X.sfx.crash(); if (big) H.X.sfx.whoosh(); H.X.light(t.x, t.y, t.R * (big ? 2.2 : 1.6), big ? 0.7 : 0.4); H.X.ring(t.x, t.y, 0.3, t.R * 1.6, big ? 0.7 : 0.4, W.aqua, big ? 0.35 : 0.2);
      // the cracks: from the three contact points (the centre's largest); small ones also reach toward the centre
      const s = t.L / 5.2, pts = [[t.x, t.y], [t.x - 0.42 * s * 1.3, t.y - 0.05], [t.x + 0.42 * s * 1.3, t.y - 0.05]];
      const L = genCracks(pts, big ? RG * 1.25 : 1.5, big ? 7 : 4, t.sd, big ? null : [t.x + (x - t.x) * 0.85, t.y + (y - t.y) * 0.85]); t.cr = crackImgs(L, t.x, t.y, T0, big ? 6 : 2, t.sd);
      // jets from the ends of the cracks, in an outward sequence
      const ends = L.map(l => l.P[l.P.length - 1]).sort((p, q) => Math.hypot(p[0] - t.x, p[1] - t.y) - Math.hypot(q[0] - t.x, q[1] - t.y)).slice(0, big ? 12 : 4);
      ends.forEach((p, i) => t.jets.push({ x: p[0], y: p[1], t0: t.imp + 0.32 + i * (big ? 0.06 : 0.07), h: (big ? 1.4 : 0.9) * (0.7 + 0.6 * R1(t.sd + i)) }));
      // the eruption: foam, droplets and glitter
      H.X.after(0.28, () => { const k = big ? 1 : 0.4; H.burst(t.x, t.y - 0.3, 'bubble', Math.round(40 * k), { v: 8 * (0.6 + 0.4 * k), up: 7, g: 10, life: 0.9, size: 2.8, color: [W.pale, W.aqua, W.white] }); H.burst(t.x, t.y - 0.3, 'spark', Math.round(70 * k), { v: 10 * (0.6 + 0.4 * k), up: 8, g: 9, life: 0.8, size: 2, color: [W.white, W.foam, W.aqua, W.pale] }); H.burst(t.x, t.y - 1, 'spark', Math.round(30 * k), { v: 4, up: 3, g: 1.5, life: 1.6, size: 2.4, color: [W.white, W.aqua] }); H.X.sfx.crash(); }); };
    H.add({ life: END, x, y, wi: 0,
      update(dt, f) {
        for (let q = 0; q < 2 && f.wi < warm.length; q++) warm[f.wi++]();
        for (const t of tris) {
          if (!t.hit && f.t >= t.imp) impact(t);
          // water streaming to the tips and dripping as luminous droplets while it emerges and hangs
          if (f.t > t.t0 + 0.2 && f.t < t.imp && Math.random() < (t.big ? 10 : 2.5) * dt * H.Q() * 3) { const z = tipZ(t, f.t), k = Math.floor(Math.random() * 3), off = (TIPS[k][0] - 48) / TH * t.L, dz = (396 - TIPS[k][1]) / TH * t.L; H.P({ kind: 'bubble', x: t.x + off, y: t.y - z - dz, vx: (Math.random() - 0.5) * 0.3, vy: 0.5, g: 9, life: 0.6, max: 0.6, size: 1.4 + Math.random() * 1.2, color: Math.random() < 0.5 ? W.pale : W.aqua }); }
          // the mist cone round the descent
          if (f.t > t.pre && f.t < t.imp && t.big && Math.random() < 30 * dt * H.Q()) { const z = tipZ(t, f.t) + Math.random() * 2.5; H.P({ kind: 'smoke', x: t.x + (Math.random() - 0.5) * (0.3 + 0.3 * (z - tipZ(t, f.t))), y: t.y - z, vx: (Math.random() - 0.5), vy: -1.5, life: 0.6, max: 0.6, size: 0.5, color: 'rgba(200,235,250,' }); }
          // jets burst
          for (const j of t.jets) if (!j.done && f.t >= j.t0) { j.done = true; H.burst(j.x, j.y - 0.2, 'spark', t.big ? 6 : 4, { v: 2, up: 9, g: 10, life: 0.6, size: 1.8, color: [W.white, W.aqua, W.pale] }); }
          // embedded: water running down the shaft into the cracks; at the end, aqua light rising off the dissolving body
          if (t.hit && f.t < t.dis0 + 1 && Math.random() < (t.big ? 8 : 2) * dt * H.Q()) { const z = Math.random() * t.L * 0.8; H.P({ kind: 'spark', x: t.x + (Math.random() - 0.5) * 0.1, y: t.y - z, vx: (Math.random() - 0.5) * 0.4, vy: 2.5, g: 2, life: 0.5, max: 0.5, size: 1.5, color: Math.random() < 0.5 ? W.white : W.aqua }); }
          if (f.t > t.dis0 && f.t < t.dis0 + 1 && Math.random() < (t.big ? 16 : 4) * dt * H.Q()) { const z = t.L * 0.9 * cl(f.t - t.dis0); H.P({ kind: 'ember', x: t.x + (Math.random() - 0.5) * 0.4, y: t.y - z, vx: (Math.random() - 0.5) * 0.5, vy: -1.2 - Math.random(), g: 0, drag: 0.5, life: 0.9, max: 0.9, size: 2, color: Math.random() < 0.5 ? W.aqua : W.pale }); } }
        // the last droplets falling through the mist
        if (f.t > FADE + 0.6 && f.t < END - 0.4 && Math.random() < 14 * dt * H.Q()) { const b = Math.random() * TAU, r = Math.random() * RG * 1.5; H.P({ kind: 'bubble', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r * 0.8 - 2 - Math.random() * 2, vx: 0, vy: 1, g: 6, life: 0.7, max: 0.7, size: 1.4, color: W.pale }); if (Math.random() < 0.4) H.P({ kind: 'smoke', x: x + Math.cos(b) * r, y: y + Math.sin(b) * r * 0.8 - 0.3, vx: (Math.random() - 0.5) * 0.4, vy: -0.2, life: 1.5, max: 1.5, size: 0.7, color: 'rgba(170,220,245,' }); }
      },
      drawUnder(c, f, X, Y, T) {
        const tt = f.t, GY = H.GY, kz = T / T0, rp = rippleSpr(), rs = ringSpr(), endK = 1 - cl((tt - FADE - 0.3) / 1.4);
        for (const t of tris) { const SX = H.sx(t.x), SY = H.sy(t.y);
          // the aqua impact mark brightening below the trident before it strikes
          if (tt > t.t0 && tt < t.imp + 0.2) { const k = cl((tt - t.t0) / (t.imp - t.t0)), r = t.R * T * (0.45 + 0.25 * k) * (1 + 0.05 * Math.sin(tt * 9)); c.save(); c.globalCompositeOperation = 'lighter'; K.floorLight(c, SX, SY, r * 1.6, 0.25 + 0.45 * k, W.turq); c.globalAlpha = 0.4 + 0.5 * k; c.drawImage(rp, SX - r, SY - r * GY, r * 2, r * 2 * GY); c.globalAlpha = 0.3 * k; c.drawImage(rs, SX - r * 0.6, SY - r * 0.6 * GY, r * 1.2, r * 1.2 * GY); c.restore(); }
          if (!t.cr) continue; const age = tt - t.imp, grow = 0.3 + 0.7 * H.ease.out(cl(age / 0.22)), [dk, lt] = t.cr, ek = cl(endK * 1.15);
          // the fractures: dark fissures (fade out completely), blue light blazing through, then glowing water in them
          if (ek > 0.01) { c.save(); c.translate(SX, SY); c.scale(kz * grow, kz * grow); c.globalAlpha = 0.85 * ek; c.drawImage(dk, dk._x0, dk._y0, dk._w, dk._h); c.globalCompositeOperation = 'lighter'; const flash = cl(1 - Math.abs(age - 0.2) / 0.18), drain = tt > FADE ? 0.3 * Math.sin(cl((tt - FADE) / 0.6) * Math.PI) : 0; c.globalAlpha = Math.min(1, (0.55 + 0.45 * flash + drain + 0.1 * Math.sin(tt * 5 + t.sd)) * ek); c.drawImage(lt, lt._x0, lt._y0, lt._w, lt._h); if (flash > 0.02) { c.globalAlpha = flash * 0.8; c.drawImage(lt, lt._x0, lt._y0, lt._w, lt._h); } c.restore(); }
          // the explosion's floor: a thick advancing water ring and a second one behind it, glistening light
          const ek2 = (age - 0.25) / (t.big ? 1.1 : 0.7); if (ek2 > 0 && ek2 < 1) { const RR = t.R * T * (t.big ? 1.9 : 1.6) * H.ease.out(ek2); c.save(); c.globalAlpha = 0.95 * Math.pow(1 - ek2, 1.1); c.drawImage(rs, SX - RR, SY - RR * GY, RR * 2, RR * 2 * GY); const r2 = RR * 0.7; c.globalAlpha = 0.6 * (1 - ek2); c.drawImage(rs, SX - r2, SY - r2 * GY, r2 * 2, r2 * 2 * GY); c.globalCompositeOperation = 'lighter'; K.floorLight(c, SX, SY, RR * 1.1, 0.5 * (1 - ek2), W.aqua); c.restore(); }
          // the lingering pool of light round the embedded trident
          if (age > 0.3 && endK > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; K.floorLight(c, SX, SY, t.R * T * (t.big ? 1.3 : 0.9), 0.3 * endK, W.water); c.globalAlpha = 0.35 * endK; const r = t.R * T * (0.6 + 0.3 * ((tt * 0.8) % 1)); c.drawImage(rp, SX - r, SY - r * GY, r * 2, r * 2 * GY); c.restore(); } }
      },
      draw(c, f, X, Y, T) {
        const tt = f.t, GY = H.GY, PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, fi = Math.floor(tt * 14) % NCU, rp = rippleSpr(), jet = jetSpr(), gw = glowSprite(W.white);
        const list = tris.slice().sort((p, q) => p.y - q.y);
        for (const t of list) { if (tt < t.t0 - 0.5) continue; const SX = H.sx(t.x), SY = H.sy(t.y), RY = SY - t.Z * T, L = t.L * T, z = tipZ(t, tt), TY = SY - z * T, TX = SX - Math.sin(t.ang) * z * T * 0.3;
          // the ripple in the sky the trident comes through
          const sk = cl((tt - (t.t0 - 0.5)) / 0.5) * (1 - cl((tt - t.pre - 0.3) / 0.6)); if (sk > 0.01) { const R = (t.big ? 3.2 : 1.2) * T; c.save(); c.globalCompositeOperation = 'lighter'; glow(c, SX, RY, R * 1.3, W.sapph, 0.5 * sk); for (let q = 0; q < 3; q++) { const u = ((tt * 0.6 + q / 3) % 1), r = R * (0.35 + 0.75 * u); c.globalAlpha = sk * (1 - u) * 0.9; c.drawImage(rp, SX - r, RY - r * 0.3, r * 2, r * 0.6); } c.restore(); }
          if (tt < t.t0) continue;
          const dis = cl((tt - t.dis0) / 0.9); if (dis >= 1) continue;
          const over = Math.abs(PX - SX) < L * 0.16 + T * 0.7 && PY < SY + T * 0.3 && PY > TY - L - T; c.save(); if (over) petHole(c, T);
          // the mist cone and the ribbons streaming behind it as it plunges
          if (tt > t.pre && tt < t.imp + 0.15) { const k = cl((tt - t.pre) / (t.imp - t.pre)), fo = 1 - cl((tt - t.imp) / 0.15); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * k * fo; const cw = L * 0.42, chh = L * 1.1; c.drawImage(coneSpr(), TX - cw / 2, TY - chh, cw, chh);
            c.lineCap = 'round'; for (let q = 0; q < 4; q++) { const ox = (q - 1.5) * L * 0.06, top = TY - L * (0.95 + 0.9 * k), pts = []; for (let j = 0; j <= 8; j++) { const u = j / 8, yy = TY - L * 0.62 + (top - (TY - L * 0.62)) * u; pts.push([TX + ox + Math.sin(u * 7 - tt * 18 + q) * L * 0.025 * u, yy]); } c.globalAlpha = 0.5 * k * fo; c.strokeStyle = rgbaS(W.turq, 0.6); c.lineWidth = L * 0.02; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.strokeStyle = rgbaS(W.white, 0.8); c.lineWidth = 1.2; c.stroke(); } c.restore(); }
          // the trident (hidden above the sky ripple while it emerges, below the floor once embedded)
          const cutTop = tt < t.hang + 0.3 ? RY : null, cutBot = t.hit ? SY + T * 0.08 : null;
          drawTri(c, TX, TY, L, t.ang, 1, (fi + (t.sd & 3)) % NCU, cutTop, cutBot, dis);
          // its points: glowing, almost white as it plunges
          const pk = tt < t.pre ? 0.4 : tt < t.imp ? 0.4 + 0.6 * cl((tt - t.pre) / (t.imp - t.pre)) : Math.max(0, 1 - (tt - t.imp) / 0.3); if (pk > 0.02 && dis <= 0) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const p = tipAt(TX, TY, L, t.ang, k); if (cutTop != null && p[1] < cutTop) continue; const r = L * (k ? 0.05 : 0.07) * (1 + pk); c.globalAlpha = pk; c.drawImage(gw, p[0] - r, p[1] - r, r * 2, r * 2); glow(c, p[0], p[1], r * 2.2, W.aqua, 0.5 * pk); } c.restore(); }
          // the eruption: towering curved splash sheets round the impact
          const age = tt - t.imp - 0.25, sd = t.big ? 1.2 : 0.8; if (t.hit && age > 0 && age < sd) { const u = age / sd, n = t.big ? 14 : 7, RR = t.R * T * (0.5 + 1.0 * H.ease.out(u)), hh = (t.big ? 3.4 : 1.6) * T * Math.sin(Math.min(1, u * 1.4) * Math.PI) * (1 - 0.3 * u); c.save(); c.lineCap = 'round';
            for (let q = 0; q < n; q++) { const b = q / n * TAU + t.sd, cb = Math.cos(b), sb = Math.sin(b), bx = SX + cb * RR * 0.7, by = SY + sb * RR * 0.7 * GY, ex = SX + cb * RR * 1.35, ey = SY + sb * RR * 1.35 * GY - hh * (0.35 + 0.2 * R1(q + t.sd)), mx = SX + cb * RR, my = SY + sb * RR * GY - hh * (1 + 0.25 * R1(q * 3 + t.sd)), al = (1 - u) * (sb > 0 ? 0.9 : 0.6);
              c.globalAlpha = al; c.strokeStyle = rgbaS(W.turq, 0.38); c.lineWidth = T * (t.big ? 0.5 : 0.3) * (1 - 0.5 * u); c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(mx, my, ex, ey); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(W.aqua, 0.55); c.lineWidth = T * 0.1; c.stroke(); c.strokeStyle = rgbaS(W.white, 0.85); c.lineWidth = 1.5; c.stroke(); c.globalCompositeOperation = 'source-over'; } c.restore(); }
          // the jets bursting from the cracks
          for (const j of t.jets) { const u = (tt - j.t0) / 0.55; if (u <= 0 || u >= 1) continue; const JX = H.sx(j.x), JY = H.sy(j.y), hh = j.h * T * Math.sin(u * Math.PI), jw = T * 0.32 * (1 - 0.4 * u); if (hh < 2) continue; c.save(); c.globalAlpha = 0.9 * (1 - u * 0.5); c.drawImage(jet, JX - jw / 2, JY - hh, jw, hh); c.restore(); }
          c.restore(); }
      } });
  };

  /* ================= Jellyfish Aurora ================= */
  /* a jellyfish bell at one step of its pulse (8 frames: relaxed to contracted and back), 2 tints: a translucent dome,
     brighter at its crown, an inner glowing core, a scalloped glowing rim and skirt, an aurora band across it */
  const NJF = 8;
  const bellFr = (v, fi) => fxSprite('wu4bell|' + v + '|' + fi, 128, 120, (g, w, h) => {
    const c = 0.5 - 0.5 * Math.cos(fi / NJF * TAU), cx = w / 2, by = h * 0.66, rx = w * 0.42 * (1 - 0.16 * c), ry = h * 0.5 * (1 + 0.12 * c), pinch = 0.12 * c;
    const A = v ? ['rgba(190,170,255,', 'rgba(140,120,240,', '#E0D4FF'] : ['rgba(160,248,255,', 'rgba(63,214,224,', '#CFF6FF'];
    const dome = () => { g.beginPath(); g.moveTo(cx - rx, by); g.bezierCurveTo(cx - rx * 1.02, by - ry * 1.05, cx + rx * 1.02, by - ry * 1.05, cx + rx, by); const n = 8; for (let i = 0; i <= n; i++) { const u = i / n, xx = cx + rx - 2 * rx * u, yy = by + (i % 2 ? 5 : 1) * (1 + c) - Math.sin(u * Math.PI) * h * pinch; g.lineTo(xx + Math.sin(u * Math.PI * 2) * rx * pinch * 0.5, yy); } g.closePath(); };
    const gr = g.createRadialGradient(cx - rx * 0.2, by - ry * 0.75, 2, cx, by - ry * 0.3, rx * 1.2); gr.addColorStop(0, A[0] + '0.75)'); gr.addColorStop(0.4, A[1] + '0.42)'); gr.addColorStop(0.85, 'rgba(26,79,176,0.3)'); gr.addColorStop(1, 'rgba(26,79,176,0.2)');
    dome(); g.fillStyle = gr; g.fill();
    g.save(); dome(); g.clip(); g.globalCompositeOperation = 'lighter';
    // the aurora band sweeping across the bell
    for (const [col, off] of [['rgba(255,150,220,0.22)', 0], ['rgba(140,255,200,0.2)', 0.33], ['rgba(170,150,255,0.22)', 0.66]]) { const yy = by - ry * (0.25 + 0.6 * ((fi / NJF + off) % 1)); g.strokeStyle = col; g.lineWidth = 7; g.beginPath(); g.moveTo(cx - rx, yy + 6); g.quadraticCurveTo(cx, yy - 10, cx + rx, yy + 6); g.stroke(); }
    // the inner light: a four-lobed glowing core
    g.globalAlpha = 0.85; for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + 0.4, ox = Math.cos(b) * rx * 0.2, oy = Math.sin(b) * ry * 0.1; g.drawImage(glowSprite(v ? '#C8B8FF' : W.aqua), cx + ox - rx * 0.28, by - ry * 0.45 + oy - rx * 0.2, rx * 0.56, rx * 0.4); }
    g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(cx - rx * 0.32, by - ry * 0.68, rx * 0.16, ry * 0.08, -0.5, 0, TAU); g.fill(); g.restore();
    dome(); g.lineJoin = 'round'; g.strokeStyle = A[0] + '0.9)'; g.lineWidth = 2.2; g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.9; g.stroke(); });
  U.jellyfish = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), lvl = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, NBg = K.lv(C, [1, 2, 3]), NSm = K.lv(C, [1, 2, 4]), D = 8.2, cx0 = C.tx, cy0 = C.ty, RX = (4.6 + 0.2 * (ev - 1)) * C.K;
    const TOT = C.base * 14 * C.K * K.evoK(C), EXP = 9, unit = TOT / (EXP * (1.6 * NBg + NSm));
    H.X.banner('JELLYFISH AURORA', '', C.col, 1.6); H.X.sfx.hum();
    const J = []; for (let i = 0; i < NBg + NSm; i++) { const big = i < NBg, b = i / (NBg + NSm) * TAU + 0.6, r = 1 + 1.2 * R1(i * 3.3);
      J.push({ i, big, v: big ? 0 : 1, sc: big ? 1 : 0.6, x: cx0 + Math.cos(b) * r, y: cy0 + Math.sin(b) * r * 0.8, z: 1.7 + 0.4 * R1(i), vx: 0, vy: 0, ph: R1(i * 7.1), rate: big ? 0.75 : 1.05, tgt: null, re: 0, cd: 0.9 + 0.3 * i * 0.2, n: 0, lash: -9, lm: null, hist: [], ht: 0, t0: 0.1 + i * 0.15, dmg: unit * (big ? 1.6 : 1), wx: cx0, wy: cy0 }); }
    H.add({ life: D + 1.2, x: cx0, y: cy0,
      update(dt, f) {
        const live = H.living();
        for (const j of J) { if (f.t < j.t0) continue; const age = f.t - j.t0, pp = (age * j.rate + j.ph) % 1, thrust = pp < 0.3 ? Math.sin(pp / 0.3 * Math.PI) : 0;
          // choose a monster near it (spread out between the jellyfish), or wander
          if (!j.tgt || j.tgt.dead || f.t > j.re) { j.re = f.t + 1.6 + R1(j.i + f.t) * 1.2; const taken = new Set(J.filter(q => q !== j && q.tgt).map(q => q.tgt)), cand = live.filter(m => Math.hypot(m.x - cx0, m.y - cy0) < RX * 1.4 + m.r); const pool = cand.filter(m => !taken.has(m)).length ? cand.filter(m => !taken.has(m)) : cand; j.tgt = pool.length ? pool.sort((p, q) => Math.hypot(p.x - j.x, p.y - j.y) - Math.hypot(q.x - j.x, q.y - j.y))[0] : null; if (!j.tgt) { const b = Math.random() * TAU, r = Math.random() * RX * 0.8; j.wx = cx0 + Math.cos(b) * r; j.wy = cy0 + Math.sin(b) * r; } }
          const gx = j.tgt ? j.tgt.x + Math.cos(f.t * 0.7 + j.i) * 0.5 : j.wx, gy = j.tgt ? j.tgt.y + Math.sin(f.t * 0.9 + j.i) * 0.4 : j.wy;
          let ax = gx - j.x, ay = gy - j.y; const d = Math.hypot(ax, ay) || 1; ax /= d; ay /= d; const V = (j.big ? 1.6 : 2.1) * (0.35 + 1.3 * thrust) * Math.min(1, d / 0.8);
          let dx = ax * V + Math.sin(f.t * 0.8 + j.i * 2) * 0.35, dy = ay * V + Math.cos(f.t * 0.6 + j.i) * 0.3;
          for (const o of J) { if (o === j) continue; const ex = j.x - o.x, ey = j.y - o.y, d2 = Math.hypot(ex, ey) || 0.01, rr = 0.9 * (j.sc + o.sc); if (d2 < rr) { dx += ex / d2 * (rr - d2) * 4; dy += ey / d2 * (rr - d2) * 4; } }
          const px = j.x - me.x, py = (j.y - j.z) - (me.y - 0.5), dp = Math.hypot(px, py) || 0.01, ar = 1.3 + 0.5 * j.sc; if (dp < ar) { dx += px / dp * (ar - dp) * 5; dy += py / dp * (ar - dp) * 5; }
          const ox = j.x - cx0, oy = j.y - cy0, dc = Math.hypot(ox, oy); if (dc > RX) { dx -= ox / dc * (dc - RX) * 2; dy -= oy / dc * (dc - RX) * 2; }
          const kk = Math.min(1, dt * 2.5); j.vx += (dx - j.vx) * kk; j.vy += (dy - j.vy) * kk; j.x += j.vx * dt; j.y += j.vy * dt;
          if (f.t - j.ht > 0.05) { j.ht = f.t; j.hist.unshift([j.x, j.y, j.z]); if (j.hist.length > 12) j.hist.pop(); }
          // sting: a lash of the tentacles and an electric pulse on the monsters under it
          if (age > 0.9 && f.t < D && f.t >= j.cd && j.n < EXP + 1) { const near = live.filter(m => Math.hypot(m.x - j.x, m.y - j.y) < (j.big ? 1.2 : 0.85) + m.r); if (near.length) { j.cd = f.t + (j.big ? 0.85 : 0.7) + R1(j.n + j.i) * 0.2; j.n++; j.lash = f.t; j.lm = near[0];
              for (const m of j.big ? near : [near[0]]) { H.X.hitMon(m, j.dmg / (j.big ? Math.sqrt(near.length) : 1), C.dmgO({ chill: true })); H.slow(m, 0.8); if (Math.random() < H.Q()) H.burst(m.x, m.y - 0.4, 'spark', 5, { v: 4, up: 2, g: 2, life: 0.35, size: 1.8, color: [W.white, W.aqua, '#C8B8FF'] }); } H.X.sfx.zap ? H.X.sfx.zap() : 0; } }
          // bubbles and glowing motes rising from it
          if (Math.random() < (j.big ? 5 : 3) * dt * H.Q()) { const b = Math.random() * TAU; H.P({ kind: Math.random() < 0.5 ? 'bubble' : 'ember', x: j.x + Math.cos(b) * 0.4 * j.sc, y: j.y - j.z + Math.sin(b) * 0.2, vx: (Math.random() - 0.5) * 0.4, vy: -0.8 - Math.random() * 0.6, g: 0, drag: 0.4, life: 1, max: 1, size: 1.4 + Math.random() * 1.6, color: Math.random() < 0.5 ? W.pale : j.v ? '#C8B8FF' : W.aqua }); } }
      },
      drawUnder(c, f, X, Y, T) { const tt = f.t; for (const j of J) { const a = cl((tt - j.t0) / 0.8) * (1 - cl((tt - D) / 1)); if (a <= 0.01) continue; const SX = H.sx(j.x), SY = H.sy(j.y), lk = cl(1 - (tt - j.lash) / 0.4); K.floorLight(c, SX, SY, T * 1.4 * j.sc * (1 + 0.4 * lk), (0.3 + 0.3 * lk) * a, j.v ? '#B8A8FF' : W.turq); } },
      draw(c, f, X, Y, T) {
        const tt = f.t, PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, order = J.slice().sort((p, q) => p.y - q.y);
        for (const j of order) { if (tt < j.t0) continue; const age = tt - j.t0, a = cl(age / 0.8) * (1 - cl((tt - D) / 1)); if (a <= 0.01) continue;
          const rise = H.ease.in(cl((tt - D) / 1)) * 4 - (1 - H.ease.out(cl(age / 0.9))) * -4, bob = Math.sin(tt * 1.7 + j.i) * 0.12, z = j.z + bob + rise, SX = H.sx(j.x), SY = H.sy(j.y) - z * T;
          const pp = (age * j.rate + j.ph) % 1, fi = Math.floor(pp * NJF) % NJF, S = T * 2.1 * j.sc, tilt = Math.max(-0.35, Math.min(0.35, j.vx * 0.12)), lk = cl(1 - (tt - j.lash) / 0.35);
          const near = Math.abs(SX - PX) < S && PY > SY - S && PY < SY + S * 1.6; c.save(); if (near) petHole(c, T);
          // tentacles: hanging from the skirt, trailing behind its movement (each point follows an older position), swaying; they lash at a stung monster
          const NT = j.big ? 6 : 4, hist = j.hist; c.lineCap = 'round'; c.lineJoin = 'round';
          const MX = j.lm && !j.lm.dead ? H.sx(j.lm.x) : SX, MY = j.lm && !j.lm.dead ? H.sy(j.lm.y) - T * 0.4 : SY;
          for (let k = 0; k < NT; k++) { const ribbon = k < NT - 2, off = (k / (NT - 1) - 0.5) * S * 0.62, pts = []; const N = 8, segL = S * (ribbon ? 0.16 : 0.22);
            for (let i = 0; i <= N; i++) { const hp = hist[Math.min(hist.length - 1, Math.floor(i * 1.4))] || [j.x, j.y, j.z], lagX = (H.sx(hp[0]) - H.sx(j.x)), lagY = (H.sy(hp[1]) - H.sy(j.y)), u = i / N, sw = Math.sin(tt * 3 + i * 0.7 + k * 1.3) * S * 0.05 * u;
              let px2 = SX + off * (1 - 0.3 * u) + lagX * u + sw, py2 = SY + S * 0.06 + i * segL + lagY * u * 0.5; if (lk > 0) { px2 += (MX - px2) * lk * u * u * 0.7; py2 += (MY - py2) * lk * u * u * 0.5; } pts.push([px2, py2]); }
            c.globalAlpha = a * (ribbon ? 0.55 : 0.4); c.strokeStyle = j.v ? 'rgba(150,130,240,0.7)' : 'rgba(63,214,224,0.7)'; c.lineWidth = Math.max(1, S * (ribbon ? 0.07 : 0.025)); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
            c.globalAlpha = a * 0.8; c.strokeStyle = 'rgba(230,250,255,0.8)'; c.lineWidth = 0.9; c.stroke();
            // little electric sparks along a lashing tentacle
            if (lk > 0.2 && k % 2 === 0) { const p = pts[N]; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = lk; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p[0], p[1]); for (let q = 1; q <= 3; q++) c.lineTo(p[0] + (MX - p[0]) * q / 3 + (R1(q + tt * 37) - 0.5) * T * 0.3, p[1] + (MY - p[1]) * q / 3 + (R1(q * 3 + tt * 41) - 0.5) * T * 0.3); c.stroke(); glow(c, p[0], p[1], T * 0.35, W.aqua, lk * 0.7); c.restore(); } }
          // the bell, its glow and an aurora shimmer
          c.globalAlpha = 1; glow(c, SX, SY - S * 0.18, S * 0.9, j.v ? '#B8A8FF' : W.aqua, (0.35 + 0.25 * lk + 0.1 * Math.sin(tt * 4 + j.i)) * a);
          c.save(); c.translate(SX, SY); c.rotate(tilt); c.globalAlpha = a; c.drawImage(bellFr(j.v, fi), -S / 2, -S * 0.66 * 120 / 128, S, S * 120 / 128); c.restore();
          glow(c, SX + Math.sin(tt * 1.3 + j.i) * S * 0.2, SY - S * 0.3, S * 0.4, (Math.floor(tt * 0.7 + j.i) & 1) ? '#FFB0E8' : '#9CFFD6', 0.18 * a);
          c.restore(); }
      } });
  };
})();
