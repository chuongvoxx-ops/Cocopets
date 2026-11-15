/* ---------- (v370) the wind kit: Wind on the GPU ----------
   Wind's Strongs paint their air through Nidhogg's painter (20k6h FGFX), whose wind kinds are drawn from maths and noise
   in the fragment shader: a blade of wind (an arc with a sharp, luminous outer edge and an opacity gradient fading toward
   its inner edge, streaks racing along it: a trail, a crescent or a whole pressure ring; a deep emerald body laid under its
   light so it reads on a pale floor too), a sphere of turbulent air (ribbons of wind crossing round it on three turning
   axes, a bright pressure front at its limb), a funnel of wind (three layers of ribbons wound at different speeds, gaps
   between them, its top fraying), a ribbon of wind along a path, and shade under them. Palette: emerald, jade,
   mint-white, pale turquoise. The solid things the moves carry (swords, feathers, claws, coconuts, leaves, seeds) are
   cel-shaded on the 2D canvas between the GPU layers. Without WebGL (or with a software rasteriser, or window.__WIND_GL
   = 0) every primitive here falls back to a plain 2D picture of itself. */
const WDK = (() => {
  const TAU = Math.PI * 2;
  const P = { white: '#FFFFFF', mintW: '#E9FFF6', mint: '#8FF5D0', turq: '#86ECE6', jade: '#2FC79A', emer: '#14A673', deep: '#0B6B4C', abyss: '#06402E',
    silver: '#E4ECEC', steel: '#9DB0B3', dark: '#2A3B3E', dust: '#E6DAB4', leaf: '#5FBF57', leafD: '#2E7F3A', nut: '#7A4B26', nutD: '#4A2A12', pearl: '#F4FFFB' };
  let H = null, K = null;
  const hx = (c, d) => (typeof c === 'string' && c[0] === '#' && (c.length === 7 || c.length === 4) ? c : d);
  const rgba = (h, a) => H.rgba(h, Math.max(0, Math.min(1, a)));
  function begin(c) { try { if (window.__WIND_GL === 0) return null; } catch (e) {} return K.gpuBegin(c, '__WIND_GL'); }
  const end = c => K.gpuEnd(c), gq = () => (K ? K.gq() : null), xy = (c, x, y) => K.gpuXY(c, x, y);
  /* (v375) Wind's own kinds draw only where their program built (FGFX windOK); else these primitives fall back to 2D */
  const wq = () => { const q = gq(); return q && q.windOK ? q : null; };
  /* paint: fn() queues GPU work and returns; the queue is flushed here so whatever the caller draws next in 2D lies over it */
  function layer(c, fn) { const q = begin(c); try { fn(!!q); } finally { if (q) end(c); } }
  /* ---- blades of wind ----
     an arc round (x, y) of radius R (px), seen as an ellipse whose minor axis is k of its major (k = H.GY: lying on the floor),
     the ellipse turned by beta on the screen; its head at phi (the angle round the ellipse), its tail running back round
     against dir (+1: it sweeps toward larger phi). o: span (rad), mode (0 trail, 1 crescent centred on phi, 2 ring), th
     (thickness: a fraction of R), col (the body), lite (the light), dens (the body's weight; 0 none), seed */
  function arc(c, x, y, R, phi, a, o) { if (!(R > 1) || !(a > 0.01)) return; o = o || {}; const k = o.k == null ? H.GY : o.k, b = o.beta || 0, dir = o.dir || 1, cb = Math.cos(b), sb = Math.sin(b), cp = Math.cos(phi), sp = Math.sin(phi);
    const e1 = [cb, sb], e2 = [-sb * k, cb * k], ux = R * (cp * e1[0] + sp * e2[0]), uy = R * (cp * e1[1] + sp * e2[1]), vx = dir * R * (-sp * e1[0] + cp * e2[0]), vy = dir * R * (-sp * e1[1] + cp * e2[1]);
    const Q = wq(), span = o.span == null ? 2.2 : o.span, mode = o.mode || 0, th = o.th == null ? 0.25 : o.th;
    if (Q) { const p = xy(c, x, y), s = p[3]; Q.wblade(p[0], p[1], ux * s, uy * s, vx * s, vy * s, hx(o.col, P.deep), hx(o.lite, P.mint), Math.min(1, a), span, mode, th, o.seed || 0, o.dens); return; }
    // (2D) the same arc as a stroke: a faint body and a bright outer line
    c.save(); c.translate(x, y); c.rotate(b); c.scale(1, k); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
    const a0 = mode === 1 ? phi - span / 2 : mode === 2 ? 0 : phi - span * dir, a1 = mode === 1 ? phi + span / 2 : mode === 2 ? TAU : phi, lo = Math.min(a0, a1), hi = Math.max(a0, a1);
    c.strokeStyle = rgba(hx(o.col, P.jade), 0.35 * a); c.lineWidth = Math.max(1, R * th); c.beginPath(); c.arc(0, 0, Math.max(0.5, R * (1 - th / 2)), lo, hi); c.stroke();
    c.strokeStyle = rgba(hx(o.lite, P.mintW), 0.85 * a); c.lineWidth = Math.max(1, R * 0.03); c.beginPath(); c.arc(0, 0, R, lo, hi); c.stroke(); c.restore(); }
  /* a sharp pressure ring (on the floor by default) */
  const ring = (c, x, y, R, a, o) => arc(c, x, y, R, 0, a, Object.assign({ mode: 2, span: TAU, th: 0.16 }, o));
  /* ---- a sphere of turbulent air (radius r, px): o.core the light at its heart, o.spin, o.seed, o.shade (the deep tint under it) */
  function gust(c, x, y, r, a, o) { if (!(r > 1) || !(a > 0.01)) return; o = o || {}; const Q = wq();
    if (Q) { const p = xy(c, x, y), R = r * p[3]; if (o.shade) Q.wshade(p[0], p[1], R * 0.75, R * 0.75, P.deep, a * Math.min(0.3, o.shade), o.seed || 0, 0.35);   /* (v372: only a faint tint, never a dark blot over the fight) */ Q.gust(p[0], p[1], R, hx(o.col, P.jade), a, Math.min(0.5, o.core || 0), o.seed || 0, o.spin == null ? 1 : o.spin); Q.glow(p[0], p[1], R * 1.3, hx(o.col, P.jade), 0.14 * a); return; }
    c.save(); c.globalCompositeOperation = 'lighter'; const g2 = c.createRadialGradient(x, y, r * 0.2, x, y, r); g2.addColorStop(0, rgba(P.mintW, 0.25 * a + 0.5 * (o.core || 0) * a)); g2.addColorStop(0.75, rgba(P.jade, 0.15 * a)); g2.addColorStop(0.95, rgba(P.mintW, 0.7 * a)); g2.addColorStop(1, rgba(P.mint, 0));
    c.fillStyle = g2; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore(); }
  /* ---- a funnel of wind: foot at (x, y), top half-width rw, height h (px); o.base its foot's width (a fraction), o.spin, o.seed */
  function funnel(c, x, y, rw, h, a, o) { if (!(rw > 1) || !(a > 0.01)) return; o = o || {}; const Q = wq(), base = o.base == null ? 0.2 : o.base;
    if (Q) { const p = xy(c, x, y), s = p[3]; Q.funnel(p[0], p[1], rw * s, h * s, hx(o.col, P.jade), a, base, o.seed || 0, o.spin == null ? 1 : o.spin, o.dens); return; }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = Math.max(1, rw * 0.05); for (let j = 0; j < 7; j++) { const v = j / 6, w = rw * (base + (0.92 - base) * Math.pow(v, 1.25)); c.strokeStyle = rgba(j % 2 ? P.mint : P.jade, 0.5 * a); c.beginPath(); c.ellipse(x, y - h * v, w, w * 0.3, 0, 0, TAU); c.stroke(); } c.restore(); }
  /* ---- a ribbon of wind through screen points pts ([x, y] or [x, y, w]), half-width w, from its head pts[0]; o: edge (0 both
     edges bright, 1 the left of travel), taper (0..1: how far it thins toward its tail), fade (its light dims toward the tail),
     col, lite, dens, seed, flow */
  function rib(c, pts, w, a, o) { const n = pts.length; if (n < 2 || !(a > 0.01)) return; o = o || {}; const Q = wq(), tp = o.taper == null ? 0.6 : o.taper;
    if (Q) { const PP = pts.map(q => xy(c, q[0], q[1]));
      for (let i = 1; i < n; i++) { const u = i / (n - 1), p0 = PP[i - 1], p1 = PP[i], dx = p1[0] - p0[0], dy = p1[1] - p0[1], ww = (pts[i][2] != null ? pts[i][2] : w) * p1[3] * (1 - tp * u), aa = a * (o.fade ? 1 - 0.85 * u : 1);
        if (ww > 0.3) Q.wrib(p0[0] - dx * 0.35, p0[1] - dy * 0.35, p1[0] + dx * 0.35, p1[1] + dy * 0.35, ww, hx(o.col, P.deep), hx(o.lite, P.mint), aa, o.edge || 0, (o.seed || 0) + i * 0.37, o.flow == null ? 3 : o.flow, o.dens); }
      return; }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; for (let i = 1; i < n; i++) { const u = i / (n - 1); c.strokeStyle = rgba(hx(o.lite, P.mint), (o.fade ? 1 - 0.85 * u : 1) * 0.6 * a); c.lineWidth = Math.max(0.8, w * (1 - tp * u)); c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); } c.restore(); }
  /* ---- light: a glow, a sparkle, a soft shade, a swirl on the floor, a puff of churned air, a ripple of pressure on the floor */
  function glow(c, x, y, r, col, a, sy) { if (!(r > 0.5) || !(a > 0.01)) return; const Q = gq(); if (Q) { const p = xy(c, x, y); Q.glow(p[0], p[1], r * p[3], hx(col, P.jade), Math.min(1, a), sy || 1); return; } c.save(); c.translate(x, y); c.scale(1, sy || 1); H.glow(c, 0, 0, r, hx(col, P.jade), Math.min(1, a)); c.restore(); }
  function star(c, x, y, s, a, col) { if (!(a > 0.01)) return; const Q = gq(); if (Q) { const p = xy(c, x, y); Q.glow(p[0], p[1], s * 0.5 * p[3], col || P.mintW, 0.6 * a); Q.star(p[0], p[1], s * 0.7 * p[3], 0.6 * a, col || '#FFFFFF'); return; } H.glow(c, x, y, s * 0.6, col || P.mintW, 0.6 * a); }
  function shade(c, x, y, rx, ry, a, seed) { const Q = wq(); if (!Q || !(rx > 1) || !(a > 0.01)) return; const p = xy(c, x, y); Q.wshade(p[0], p[1], rx * p[3], (ry || rx) * p[3], P.deep, a, seed || 0, 0.5); }
  function swirl(c, x, y, r, a, o) { if (!(r > 1) || !(a > 0.01)) return; o = o || {}; const Q = gq(), sy = o.sy == null ? H.GY : o.sy;
    if (Q) { const p = xy(c, x, y); Q.wshade(p[0], p[1], r * p[3], r * sy * p[3], P.deep, a * 0.45, o.seed || 0, 0.5); Q.evortex(p[0], p[1], r * p[3], hx(o.col, P.jade), o.heat == null ? 0.62 : o.heat, a, o.seed || 0, o.spin || 1.5, sy); return; }
    c.save(); c.translate(x, y); c.scale(1, sy); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.mint, 0.4 * a); c.lineWidth = Math.max(1, r * 0.05); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, r * (0.4 + i * 0.25), i * 2, i * 2 + 2.6); c.stroke(); } c.restore(); }
  function puff(c, x, y, r, a, o) { const Q = gq(); if (!Q || !(r > 1) || !(a > 0.01)) return; o = o || {}; const p = xy(c, x, y); Q.spray(p[0], p[1], r * p[3], hx(o.col, '#DDF8EC'), a, o.seed || 0, o.spread || 0, o.sy || 1); }
  function ripple(c, x, y, r, a, o) { if (!(r > 1) || !(a > 0.01)) return; o = o || {}; const Q = gq(); if (Q) { const p = xy(c, x, y); Q.ripple(p[0], p[1], r * p[3], hx(o.col, P.mint), a, o.seed || 0, o.sy == null ? H.GY : o.sy, o.th == null ? 0.08 : o.th); return; } c.save(); c.translate(x, y); c.scale(1, o.sy == null ? H.GY : o.sy); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.mint, 0.6 * a); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.restore(); }
  /* a spinning smooth ring of light (the water kit's ring in wind colours; side 0 its far half, 1 its near, 2 all) */
  function wring(c, x, y, rx, ry, rot, a, o) { const Q = gq(); if (!Q || !(rx > 1) || !(a > 0.01)) return false; o = o || {}; const p = xy(c, x, y); Q.wring(p[0], p[1], rx * p[3], ry * p[3], rot || 0, hx(o.col, P.jade), a, o.side == null ? 2 : o.side, o.th || 0.06, o.seed || 0, o.spin || 1); return true; }

  /* ================= the solid things, cel-shaded on the 2D canvas =================
     the light comes from the upper left: a lit face and a shaded face split by a hard line, the game's dark outline, a
     bright rim; Wind's things glow along their edges (an additive mint line) */
  const line = () => (H.line ? H.line() : '#2A2A3A');
  /* a feather pointing +x from (x, y) (its quill at x), len long; roll (-1..1) turns it about its shaft (its vanes narrow as
     it turns edge-on and the shaded side shows); o.a alpha, o.root its root colour, o.tint its vane colour, o.glow */
  function feather(c, x, y, ang, len, a, roll, o) { if (!(len > 2) || !(a > 0.01)) return; o = o || {}; const r0 = roll == null ? 1 : roll, wk = 0.25 + 0.75 * Math.abs(r0), flip = r0 < 0 ? -1 : 1, L = len, W = L * 0.21 * wk;
    c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = Math.min(1, a); c.lineJoin = 'round';
    // the vanes (curving slightly, a little notch two thirds along), lit side up, shaded side down
    const vane = s => { c.beginPath(); c.moveTo(L * 0.08, 0); c.bezierCurveTo(L * 0.25, -s * W * 1.05, L * 0.62, -s * W * 1.1, L * 0.86, -s * W * 0.55); c.lineTo(L * 0.8, -s * W * 0.42); c.bezierCurveTo(L * 0.92, -s * W * 0.32, L * 0.99, -s * W * 0.1, L, 0); c.closePath(); };
    const lit = hx(o.tint, P.pearl), sh = H.mix(hx(o.tint, P.pearl), P.jade, 0.45), root = hx(o.root, P.emer);
    for (const s of [1, -1]) { const top = s * flip > 0; vane(s); const g2 = c.createLinearGradient(0, 0, L, 0); g2.addColorStop(0, root); g2.addColorStop(0.32, top ? H.mix(lit, P.mint, 0.5) : H.mix(sh, P.jade, 0.3)); g2.addColorStop(1, top ? lit : sh); c.fillStyle = g2; c.fill(); }
    c.strokeStyle = rgba(line(), 0.55); c.lineWidth = Math.max(0.8, L * 0.022); vane(1); c.stroke(); vane(-1); c.stroke();
    // barbs: fine diagonal lines on the vanes
    c.strokeStyle = rgba(P.white, 0.4); c.lineWidth = Math.max(0.5, L * 0.008); c.beginPath(); for (let i = 1; i < 9; i++) { const u = 0.12 + i * 0.09; for (const s of [1, -1]) { c.moveTo(L * u, 0); c.lineTo(L * (u + 0.07), -s * W * 0.85 * Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5) * (u > 0.8 ? 0.5 : 1)); } } c.stroke();
    // the shaft, a bright line, the quill
    c.strokeStyle = rgba(P.white, 0.95); c.lineWidth = Math.max(0.8, L * 0.03); c.beginPath(); c.moveTo(-L * 0.05, 0); c.quadraticCurveTo(L * 0.5, -W * 0.08 * flip, L * 0.98, 0); c.stroke();
    c.fillStyle = root; c.beginPath(); c.ellipse(L * 0.02, 0, L * 0.08, Math.max(0.6, L * 0.025), 0, 0, TAU); c.fill();
    // the luminous edge
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.mint, 0.75 * (o.glow == null ? 1 : o.glow)); c.lineWidth = Math.max(0.8, L * 0.025); vane(flip); c.stroke(); c.restore(); }
  /* a sword lying from (x0, y0) (its hilt) to (x1, y1) (its point), w its blade's half-width (px): pale silver, the blade split
     along its ridge into a lit and a shaded bevel, a thin edge of solid thickness under it, luminous green cutting edges, an
     emerald-set guard, a dark wrapped grip; o.a alpha, o.glow its edges' light */
  function sword(c, x0, y0, x1, y1, w, a, o) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (!(L > 4) || !(a > 0.01)) return; o = o || {}; const ang = Math.atan2(dy, dx), G = o.glow == null ? 1 : o.glow, th = o.thick == null ? w * 0.45 : o.thick;
    c.save(); c.translate(x0, y0); c.rotate(ang); c.globalAlpha = Math.min(1, a); c.lineJoin = 'round';
    const gx = L * 0.24, B0 = gx + w * 0.3;   // (the grip and guard take the first quarter)
    const blade = (ox, oy) => { c.beginPath(); c.moveTo(B0 + ox, -w + oy); c.lineTo(L * 0.86 + ox, -w * 0.82 + oy); c.lineTo(L + ox, oy); c.lineTo(L * 0.86 + ox, w * 0.82 + oy); c.lineTo(B0 + ox, w + oy); c.closePath(); };
    // its thickness: the blade again, darker, a little below
    c.fillStyle = P.dark; blade(th * Math.sin(ang), th * Math.cos(ang)); c.fill();
    // the two bevels
    c.beginPath(); c.moveTo(B0, -w); c.lineTo(L * 0.86, -w * 0.82); c.lineTo(L, 0); c.lineTo(B0, 0); c.closePath(); c.fillStyle = P.silver; c.fill();
    c.beginPath(); c.moveTo(B0, w); c.lineTo(L * 0.86, w * 0.82); c.lineTo(L, 0); c.lineTo(B0, 0); c.closePath(); c.fillStyle = P.steel; c.fill();
    // a fuller (a groove) of emerald light down the middle, engraved lines
    c.fillStyle = rgba(P.emer, 0.85); c.beginPath(); c.moveTo(B0 + w * 0.4, -w * 0.16); c.lineTo(L * 0.72, -w * 0.08); c.lineTo(L * 0.72, w * 0.08); c.lineTo(B0 + w * 0.4, w * 0.16); c.closePath(); c.fill();
    c.strokeStyle = rgba(line(), 0.85); c.lineWidth = Math.max(1, w * 0.16); blade(0, 0); c.stroke(); c.strokeStyle = rgba(P.white, 0.7); c.lineWidth = Math.max(0.6, w * 0.08); c.beginPath(); c.moveTo(B0, -w * 0.55); c.lineTo(L * 0.84, -w * 0.48); c.stroke();
    // the guard (a swept crossbar, an emerald gem) and the grip
    c.fillStyle = P.dark; c.fillRect(L * 0.02, -w * 0.38, gx - L * 0.02, w * 0.76);
    c.strokeStyle = rgba(P.emer, 0.9); c.lineWidth = Math.max(0.6, w * 0.14); c.beginPath(); for (let i = 0; i < 4; i++) { const u = L * (0.04 + i * 0.05); c.moveTo(u, -w * 0.36); c.lineTo(u + L * 0.03, w * 0.36); } c.stroke();
    c.beginPath(); c.moveTo(gx - w * 0.1, -w * 2.1); c.quadraticCurveTo(gx + w * 0.9, -w * 1.2, gx + w * 0.3, 0); c.quadraticCurveTo(gx + w * 0.9, w * 1.2, gx - w * 0.1, w * 2.1); c.lineTo(gx - w * 0.5, w * 1.7); c.quadraticCurveTo(gx + w * 0.2, w * 0.8, gx - w * 0.3, 0); c.quadraticCurveTo(gx + w * 0.2, -w * 0.8, gx - w * 0.5, -w * 1.7); c.closePath();
    const g3 = c.createLinearGradient(0, -w * 2, 0, w * 2); g3.addColorStop(0, P.white); g3.addColorStop(0.45, P.silver); g3.addColorStop(1, P.steel); c.fillStyle = g3; c.fill(); c.strokeStyle = rgba(line(), 0.85); c.lineWidth = Math.max(1, w * 0.14); c.stroke();
    c.fillStyle = P.emer; c.beginPath(); c.arc(gx, 0, w * 0.42, 0, TAU); c.fill(); c.fillStyle = rgba(P.mintW, 0.9); c.beginPath(); c.arc(gx - w * 0.12, -w * 0.12, w * 0.15, 0, TAU); c.fill();
    c.fillStyle = P.silver; c.beginPath(); c.arc(L * 0.01, 0, w * 0.42, 0, TAU); c.fill(); c.strokeStyle = rgba(line(), 0.8); c.lineWidth = Math.max(0.8, w * 0.12); c.stroke();
    // the cutting edges, luminous green
    if (G > 0.01) { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const [col, lw, al] of [[P.jade, w * 0.55, 0.45], [P.mint, w * 0.22, 0.9], [P.white, w * 0.08, 0.8]]) { c.strokeStyle = rgba(col, al * G); c.lineWidth = Math.max(0.6, lw); c.beginPath(); c.moveTo(B0 + w * 0.6, -w * 0.98); c.lineTo(L * 0.86, -w * 0.8); c.lineTo(L, 0); c.lineTo(L * 0.86, w * 0.8); c.lineTo(B0 + w * 0.6, w * 0.98); c.stroke(); } }
    c.restore(); }
  /* a coconut of radius r: a fibrous brown husk, lit and shaded in bands, three eyes when its face turns toward us (rot) */
  function coconut(c, x, y, r, rot, a) { if (!(r > 1) || !(a > 0.01)) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y);
    const g2 = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); g2.addColorStop(0, '#B07A45'); g2.addColorStop(0.45, P.nut); g2.addColorStop(1, P.nutD); c.fillStyle = g2; c.beginPath(); c.ellipse(0, 0, r, r * 0.92, rot * 0.3, 0, TAU); c.fill();
    c.save(); c.clip(); c.strokeStyle = 'rgba(40,20,8,0.45)'; c.lineWidth = Math.max(0.6, r * 0.08); c.beginPath(); for (let i = 0; i < 6; i++) { const b = rot + i * 1.05; c.moveTo(Math.cos(b) * r * 1.2, Math.sin(b) * r * 1.2); c.quadraticCurveTo(Math.cos(b + 0.6) * r * 0.3, Math.sin(b + 0.6) * r * 0.3, Math.cos(b + Math.PI) * r * 1.2, Math.sin(b + Math.PI) * r * 1.2); } c.stroke();
    c.strokeStyle = 'rgba(255,220,170,0.35)'; c.lineWidth = Math.max(0.5, r * 0.05); c.beginPath(); c.arc(-r * 0.1, -r * 0.1, r * 0.75, Math.PI * 1.05, Math.PI * 1.55); c.stroke(); c.restore();
    const fx = Math.cos(rot), fy = Math.sin(rot * 0.7); if (fx > 0) { c.fillStyle = 'rgba(30,14,4,' + (0.85 * fx) + ')'; for (let i = 0; i < 3; i++) { const b = i * 2.09 + 0.5; c.beginPath(); c.arc(fx * r * 0.35 + Math.cos(b) * r * 0.2, fy * r * 0.25 + Math.sin(b) * r * 0.2, r * 0.11, 0, TAU); c.fill(); } }
    c.strokeStyle = rgba(line(), 0.8); c.lineWidth = Math.max(0.8, r * 0.1); c.beginPath(); c.ellipse(0, 0, r, r * 0.92, rot * 0.3, 0, TAU); c.stroke(); c.restore(); }
  /* a palm leaf (a frond) from (x, y) along ang, len long, rolled by roll: a midrib and paired leaflets, two greens */
  function palm(c, x, y, ang, len, a, roll) { if (!(len > 2) || !(a > 0.01)) return; const wk = 0.3 + 0.7 * Math.abs(roll == null ? 1 : roll); c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.rotate(ang); c.scale(1, wk); c.lineCap = 'round';
    for (let i = 1; i < 8; i++) { const u = i / 8, lx = len * u, ln = len * 0.42 * Math.sin(u * Math.PI) + len * 0.06; for (const s of [-1, 1]) { c.fillStyle = s < 0 ? P.leaf : P.leafD; c.beginPath(); c.moveTo(lx, 0); c.quadraticCurveTo(lx + ln * 0.5, s * ln * 0.55, lx + ln * 0.75, s * ln * 0.95); c.quadraticCurveTo(lx + ln * 0.3, s * ln * 0.4, lx - len * 0.03, 0); c.closePath(); c.fill(); } }
    c.strokeStyle = '#2B5A22'; c.lineWidth = Math.max(0.8, len * 0.035); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.05, len, 0); c.stroke(); c.restore(); }
  /* a dandelion seed: a tiny glowing emerald core under a parasol of fine white filaments (open 0..1 spreads them) */
  function seed(c, x, y, s, a, open, rot) { if (!(s > 1) || !(a > 0.01)) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.rotate(rot || 0); const sp = 0.35 + 0.65 * (open || 0);
    const fil = () => { c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.9); for (let i = 0; i < 11; i++) { const b = -Math.PI / 2 + (i / 10 - 0.5) * Math.PI * 1.25 * sp; c.moveTo(0, -s * 0.9); c.lineTo(Math.cos(b) * s * 0.95, -s * 0.9 + Math.sin(b) * s * 0.95 * (0.55 + 0.45 * sp)); } };
    c.lineCap = 'round'; c.strokeStyle = 'rgba(6,64,46,0.7)'; c.lineWidth = Math.max(1.4, s * 0.1); fil(); c.stroke();   /* (v371: a dark edge under the white filaments, so they read on a pale floor) */
    c.strokeStyle = 'rgba(240,255,250,0.95)'; c.lineWidth = Math.max(0.6, s * 0.045); fil(); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(P.mintW, 0.6); for (let i = 0; i < 11; i++) { const b = -Math.PI / 2 + (i / 10 - 0.5) * Math.PI * 1.25 * sp; c.beginPath(); c.arc(Math.cos(b) * s * 0.95, -s * 0.9 + Math.sin(b) * s * 0.95 * (0.55 + 0.45 * sp), Math.max(0.5, s * 0.05), 0, TAU); c.fill(); }
    c.globalCompositeOperation = 'source-over'; c.fillStyle = P.emer; c.beginPath(); c.ellipse(0, s * 0.05, s * 0.16, s * 0.24, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(4,48,34,0.85)'; c.lineWidth = Math.max(0.8, s * 0.05); c.stroke(); c.fillStyle = rgba(P.mintW, 0.95); c.beginPath(); c.arc(-s * 0.03, 0, s * 0.06, 0, TAU); c.fill(); c.restore(); }
  /* a swallow in flight (+x), s its wingspan: a forked tail, swept wings beating by flap; drawn in light (additive) */
  function swallow(c, x, y, ang, s, a, flap, col) { if (!(s > 2) || !(a > 0.01)) return; c.save(); c.translate(x, y); c.rotate(ang); c.globalCompositeOperation = 'lighter'; const k = 0.55 + 0.45 * (flap == null ? 1 : flap);
    const shape = () => { c.beginPath(); c.moveTo(s * 0.42, 0); c.quadraticCurveTo(s * 0.3, -s * 0.06, s * 0.12, -s * 0.07); c.quadraticCurveTo(-s * 0.05, -s * 0.5 * k, -s * 0.32, -s * 0.62 * k); c.quadraticCurveTo(-s * 0.08, -s * 0.2 * k, -s * 0.12, -s * 0.05);
      c.lineTo(-s * 0.52, -s * 0.2); c.lineTo(-s * 0.22, 0); c.lineTo(-s * 0.52, s * 0.2); c.lineTo(-s * 0.12, s * 0.05); c.quadraticCurveTo(-s * 0.08, s * 0.2 * k, -s * 0.32, s * 0.62 * k); c.quadraticCurveTo(-s * 0.05, s * 0.5 * k, s * 0.12, s * 0.07); c.quadraticCurveTo(s * 0.3, s * 0.06, s * 0.42, 0); c.closePath(); };
    c.globalCompositeOperation = 'source-over'; shape(); c.fillStyle = rgba('#0A6A4A', 0.55 * a); c.fill(); c.strokeStyle = rgba('#063D2C', 0.6 * a); c.lineWidth = Math.max(1, s * 0.035); c.stroke(); c.globalCompositeOperation = 'lighter';   /* (v371: a deep body under its light, so it reads on a pale floor) */
    shape(); const g2 = c.createLinearGradient(s * 0.4, 0, -s * 0.5, 0); g2.addColorStop(0, rgba(P.mintW, 0.75 * a)); g2.addColorStop(0.5, rgba(col || P.mint, 0.45 * a)); g2.addColorStop(1, rgba(col || P.jade, 0.08 * a)); c.fillStyle = g2; c.fill();
    c.strokeStyle = rgba(P.mintW, 0.8 * a); c.lineWidth = Math.max(0.7, s * 0.02); c.stroke(); c.restore(); }

  const bind = h => { H = h; K = IK.bind(h); return API; };
  const API = { P, TAU, begin, end, gq, xy, layer, arc, ring, gust, funnel, rib, glow, star, shade, swirl, puff, ripple, wring, feather, sword, coconut, palm, seed, swallow };
  return { bind, P, on: () => !!(K && K.gq()), get api() { return API; } };
})();
