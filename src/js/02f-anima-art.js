/* ---------- Anima art: cute celestial creatures, painted like solid, lit things ----------
   Every painter draws the creature's body in a box about 120 wide and 110 tall, centred on x = 0 with the feet on
   y = +40, for stage k = 1, 2, 3. The body is painted into an offscreen layer that gets a lighting pass: a rim of key
   light along the top-left edge, a shadow and a celestial back-light along the far edge, ambient occlusion toward the
   ground and a fine grain. Anything that shines (flames, glowing eyes, halos, sparks) is queued with L.back (behind the
   body) or L.fx (in front) so it glows instead of being lit. Around it all, an aura that grows with every Ascension. */
const AnimaArt = (() => {
  const TAU = Math.PI * 2, INK = '#1E1428';
  const sh = (h, k) => shadeC(h, k);
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const mix = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const inkOf = col => mix(sh(col, -0.66), INK, 0.4);
  const luma = col => { const [r, g, b] = hexRGB(col); return (0.3 * r + 0.59 * g + 0.11 * b) / 255; };
  let MIR = 1, FA = 1, BLINK = 0;   // FA: the fade applied to auras and glows while an Anima appears or leaves   // -1 while a mirrored half is drawn, so the key light stays on the left
  const both = (c, f) => { f(1); c.save(); c.scale(-1, 1); MIR = -MIR; f(-1); MIR = -MIR; c.restore(); };

  /* ---- surface textures: tiles turned into patterns that scale with the creature ---- */
  const tiles = {};
  function tex(kind) {
    if (tiles[kind]) return tiles[kind];
    const S = kind === 'scale' || kind === 'feather' ? 96 : 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d'), R = mulberry32(kind.split('').reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7));
    const at = (x, y, f) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.save(); g.translate(x + ox, y + oy); f(); g.restore(); } };
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'fur' || kind === 'fine') {
      const n = kind === 'fur' ? 760 : 1200, l0 = kind === 'fur' ? 5 : 2.6, l1 = kind === 'fur' ? 8 : 3.6;
      for (let i = 0; i < n; i++) { const x = R() * S, y = R() * S, L = l0 + R() * l1, a = 1.35 + (R() - 0.5) * 0.9, lt = R() < 0.5, w = 0.7 + R() * 0.7, bend = (R() - 0.5) * 0.9;
        at(x, y, () => { g.strokeStyle = lt ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.36)'; g.lineWidth = w; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a + bend) * L * 0.5, Math.sin(a + bend) * L * 0.5, Math.cos(a) * L, Math.sin(a) * L); g.stroke(); }); }
    } else if (kind === 'wool') {
      for (let i = 0; i < 110; i++) { const x = R() * S, y = R() * S, r = 3 + R() * 4.5, rot = R() * TAU;
        at(x, y, () => { g.rotate(rot); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, r, 0.2, 2.7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, -0.7, r * 0.78, 3.5, 5.7); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 0.9; g.beginPath(); g.arc(0.4, 0.3, r * 0.42, 0, 4.4); g.stroke(); }); }
    } else if (kind === 'scale' || kind === 'feather') {
      const cw = kind === 'scale' ? 12 : 16, chh = kind === 'scale' ? 8 : 12;
      for (let row = -1; row * chh < S + chh; row++) for (let col = -1; col * cw < S + cw; col++) { const x = col * cw + (((row % 2) + 2) % 2) * cw / 2, y = row * chh;
        g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.3; g.beginPath(); g.ellipse(x, y, cw / 2, chh * 0.78, 0, 0.12, Math.PI - 0.12); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y - 1.3, cw * 0.4, chh * 0.6, 0, 0.4, Math.PI - 0.4); g.stroke();
        if (kind === 'feather') { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y - chh * 0.2); g.lineTo(x, y + chh * 0.66); g.stroke(); } }
    } else if (kind === 'chitin' || kind === 'hide') {
      for (let i = 0; i < 46; i++) { const x = R() * S, y = R() * S, r = 5 + R() * 14, lt = R() < 0.45, a = 0.12 + R() * 0.12;
        at(x, y, () => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, lt ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.4})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); }); }
      const n = kind === 'hide' ? 1300 : 500;
      for (let i = 0; i < n; i++) { const x = R() * S, y = R() * S, r = 0.4 + R() * 0.7, lt = R() < 0.3; g.fillStyle = lt ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
      if (kind === 'chitin') for (let i = 0; i < 9; i++) { let x = R() * S, y = R() * S; const pts = [[x, y]]; for (let j = 0; j < 4; j++) { x += (R() - 0.5) * 22; y += (R() - 0.5) * 22; pts.push([x, y]); } at(0, 0, () => { g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 0.8; g.beginPath(); pts.forEach(([px, py], j) => j ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.translate(0.7, 0.7); g.beginPath(); pts.forEach(([px, py], j) => j ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); }); }
    } else if (kind === 'stars') {
      for (let i = 0; i < 70; i++) { const x = R() * S, y = R() * S, r = 0.5 + R() * 1.1, a = 0.35 + R() * 0.6; at(x, y, () => { g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); if (r > 1.3) { g.fillRect(-r * 2.6, -0.3, r * 5.2, 0.6); g.fillRect(-0.3, -r * 2.6, 0.6, r * 5.2); } }); }
      for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(R() * S, R() * S, 1.2, 1.2); }
    } else if (kind === 'water') {
      for (let i = 0; i < 18; i++) { const x = R() * S, y = R() * S, r = 6 + R() * 12, rot = R() * TAU; at(x, y, () => { g.rotate(rot); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1 + R() * 0.8; g.beginPath(); for (let j = 0; j <= 14; j++) { const a = j / 14 * TAU, rr = r * (0.7 + 0.3 * Math.sin(a * 3 + i)); j ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.6) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.6); } g.stroke(); }); }
    }
    const p = g.createPattern(cv, 'repeat'); if (p.setTransform) p.setTransform(new DOMMatrix([0.42, 0, 0, 0.42, 0, 0]));
    tiles[kind] = p; return p;
  }

  /* ---- light and form ---- */
  // a sphere-like gradient: a hot spot from the upper left, the colour, a core shadow, and a little bounce light at the edge
  function lit(c, x, y, r, col, o) {
    o = o || {}; const lx = (o.lx == null ? -0.4 : o.lx) * MIR, ly = o.ly == null ? -0.5 : o.ly;
    const g = c.createRadialGradient(x + r * lx, y + r * ly, r * 0.02, x + r * lx * 0.25, y + r * ly * 0.25, r * 1.15);
    g.addColorStop(0, o.hi || sh(col, 0.55)); g.addColorStop(0.22, o.hi2 || sh(col, 0.2)); g.addColorStop(0.56, col); g.addColorStop(0.86, o.dk || sh(col, -0.45)); g.addColorStop(1, o.bounce || sh(o.dk || col, -0.2));
    return g;
  }
  function spec(c, x, y, r, a) {
    if (!(a > 0) || !(r > 0)) return; c.save(); c.translate(x, y); c.rotate(-0.55 * MIR); c.scale(1, 0.55);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.35, `rgba(255,255,255,${a * 0.45})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore();
  }
  // fill a shape with volume, a surface texture, a highlight and a tinted outline
  function form(c, path, x, y, r, col, o) {
    o = o || {};
    path(); c.fillStyle = o.fill || (o.flat ? col : lit(c, x, y, r, col, o)); c.fill();
    if (o.tex || o.soft) {
      c.save(); path(); c.clip();
      if (o.tex) { c.globalAlpha = (o.texA == null ? 0.4 : o.texA) * 0.62 * (1 - 0.5 * luma(col)); c.fillStyle = tex(o.tex); c.fillRect(x - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2); c.globalAlpha = 1; }
      if (o.soft) o.soft();
      c.restore();
    }
    if (o.spec !== false) spec(c, x + r * (o.spx == null ? -0.34 : o.spx) * MIR, y + r * (o.spy == null ? -0.46 : o.spy), r * (o.spR || 0.34), o.specA == null ? 0.42 : o.specA);
    if (o.lw !== 0) { path(); c.lineWidth = o.lw || 1.4; c.strokeStyle = o.line || inkOf(col); c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  }
  const ell = (c, x, y, rx, ry, rot) => () => { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };
  function orb(c, x, y, rx, ry, col, o) { o = o || {}; form(c, ell(c, x, y, rx, ry, o.rot), x, y, Math.max(rx, ry), col, o); }
  // a closed smooth curve through points
  function blob(c, pts) { return () => { const n = pts.length, P = i => pts[((i % n) + n) % n]; c.beginPath(); c.moveTo(P(0)[0], P(0)[1]); for (let i = 0; i < n; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); } c.closePath(); }; }
  // a fluffy silhouette: an ellipse whose edge breaks into pointed tufts (prof(angle) scales the tufts)
  function furPath(c, cx, cy, rx, ry, o) {
    o = o || {}; const n = o.n || 20, Ln = o.len == null ? 5 : o.len, seed = o.seed || 7, lean = o.lean == null ? 0.5 : o.lean, prof = o.prof, a0 = o.a0 || 0;
    return () => {
      const R = mulberry32(seed), da = TAU / n, P = (a, d) => [cx + Math.cos(a) * (rx + d), cy + Math.sin(a) * (ry + d)];
      if (!o.sub) c.beginPath(); const s0 = P(a0, 0); c.moveTo(s0[0], s0[1]);
      for (let i = 0; i < n; i++) {
        const a = a0 + i * da, an = (((a + da * 0.5) % TAU) + TAU) % TAU, l = Ln * (0.55 + R() * 0.9) * (prof ? prof(an) : 1), am = a + da * (0.5 + lean * 0.5);
        const tip = P(am, l), c1 = P(a + da * 0.12, l * (o.spiky ? 0.5 : 0.95)), b1 = P(a + da, 0), c2 = P(a + da * 0.98, l * (o.spiky ? 0.22 : 0.7));
        c.quadraticCurveTo(c1[0], c1[1], tip[0], tip[1]); c.quadraticCurveTo(c2[0], c2[1], b1[0], b1[1]);
      }
      c.closePath();
    };
  }
  // a cloud or wool silhouette: round bumps all the way round
  function cloud(c, cx, cy, rx, ry, n, bump, seed) {
    return () => { const R = mulberry32(seed || 3), da = TAU / n; c.beginPath(); c.moveTo(cx + rx, cy);
      for (let i = 0; i < n; i++) { const a = i * da, b = (bump || 0.28) * (0.75 + R() * 0.5), am = a + da / 2; c.quadraticCurveTo(cx + Math.cos(am) * rx * (1 + b * 1.6), cy + Math.sin(am) * ry * (1 + b * 1.6), cx + Math.cos(a + da) * rx, cy + Math.sin(a + da) * ry); }
      c.closePath(); };
  }
  // a ribbon of varying width along points (tails, necks, hair)
  function ribbon(c, pts, w0, w1, prof) {
    return () => { const N = pts.length - 1, Lp = [], Rp = []; for (let i = 0; i <= N; i++) { const p = pts[i], q = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, u = i / N, w = (prof ? prof(u) : w0 + (w1 - w0) * u) / 2; Lp.push([p[0] - dy / d * w, p[1] + dx / d * w]); Rp.push([p[0] + dy / d * w, p[1] - dx / d * w]); }
      c.beginPath(); Lp.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); for (let i = N; i >= 0; i--) c.lineTo(Rp[i][0], Rp[i][1]); c.closePath(); };
  }
  const bez = (p0, p1, p2, p3, N) => { const out = []; for (let i = 0; i <= N; i++) { const u = i / N, a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, d = 3 * (1 - u) * u * u, e = u ** 3; out.push([a * p0[0] + b * p1[0] + d * p2[0] + e * p3[0], a * p0[1] + b * p1[1] + d * p2[1] + e * p3[1]]); } return out; };
  // a soft volume that melts into the surface (shadow, sheen, muscle)
  function soft(c, x, y, rx, ry, rot, col, a) {
    if (!(rx > 0)) return; c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.55, rgba(col, a * 0.55)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
  }
  // a limb: a round-ended tapered cylinder, lit on the side that faces the upper left
  function limb(c, x0, y0, x1, y1, w0, w1, col, o) {
    o = o || {}; const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, th = Math.atan2(ny, nx);
    const path = () => { c.beginPath(); c.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); c.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); c.arc(x1, y1, w1 / 2, th, th + Math.PI, true); c.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); c.arc(x0, y0, w0 / 2, th + Math.PI, th, true); c.closePath(); };
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, ww = Math.max(w0, w1) / 2, g = c.createLinearGradient(mx + nx * ww, my + ny * ww, mx - nx * ww, my - ny * ww);
    const lightN = (nx * -0.6 * MIR + ny * -0.8) > 0, A = sh(col, 0.34), D = sh(col, -0.46);
    if (lightN) { g.addColorStop(0, A); g.addColorStop(0.42, col); g.addColorStop(1, D); } else { g.addColorStop(0, D); g.addColorStop(0.58, col); g.addColorStop(1, A); }
    path(); c.fillStyle = g; c.fill();
    if (o.tex) { c.save(); path(); c.clip(); c.globalAlpha = (o.texA == null ? 0.35 : o.texA) * 0.62 * (1 - 0.5 * luma(col)); c.fillStyle = tex(o.tex); c.fillRect(Math.min(x0, x1) - ww * 2, Math.min(y0, y1) - ww * 2, Math.abs(dx) + ww * 4, Math.abs(dy) + ww * 4); c.restore(); }
    if (o.lw !== 0) { path(); c.lineWidth = o.lw || 1; c.strokeStyle = o.line || mix(inkOf(col), col, 0.3); c.stroke(); }
  }
  // metal: bright and dark bands like polished gold
  function metalG(c, x0, y0, x1, y1, col) { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, sh(col, 0.6)); g.addColorStop(0.16, sh(col, 0.18)); g.addColorStop(0.4, sh(col, -0.42)); g.addColorStop(0.52, col); g.addColorStop(0.66, sh(col, 0.55)); g.addColorStop(0.72, '#FFFFFF'); g.addColorStop(0.8, sh(col, 0.15)); g.addColorStop(1, sh(col, -0.5)); return g; }
  function plate(c, path, x, y, r, col, o) {
    o = o || {}; path(); c.fillStyle = metalG(c, x - r * MIR, y - r, x + r * 0.6 * MIR, y + r, col); c.fill();
    if (o.fili) { c.save(); path(); c.clip(); c.strokeStyle = rgba(sh(col, -0.6), 0.75); c.lineWidth = 0.8; c.lineCap = 'round'; o.fili(); c.restore(); }
    spec(c, x - r * 0.3 * MIR, y - r * 0.4, r * 0.45, 0.6);
    path(); c.lineWidth = o.lw || 1.1; c.strokeStyle = sh(col, -0.68); c.lineJoin = 'round'; c.stroke();
  }
  function gem(c, x, y, r, col) {
    const p = () => { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.78, y - r * 0.18); c.lineTo(x + r * 0.45, y + r * 0.85); c.lineTo(x - r * 0.45, y + r * 0.85); c.lineTo(x - r * 0.78, y - r * 0.18); c.closePath(); };
    form(c, p, x, y, r, col, { lw: 0.9, specA: 0.75, spR: 0.5, line: sh(col, -0.65), hi: '#FFFFFF' });
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x - r * 0.78, y - r * 0.18); c.lineTo(x, y + r * 0.1); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(x, y + r * 0.1); c.lineTo(x + r * 0.45, y + r * 0.85); c.lineTo(x - r * 0.45, y + r * 0.85); c.closePath(); c.fill();
  }
  function coin(c, x, y, r) { orb(c, x, y, r, r, '#FFD447', { fill: metalG(c, x - r, y - r, x + r, y + r, '#F2B935'), lw: 0.9, line: '#8A5A12', specA: 0.6 }); c.strokeStyle = 'rgba(120,70,10,.6)'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, r * 0.6, 0, TAU); c.stroke(); }
  // a big glossy eye with a real iris: striations, light passing through its lower half, a lid shadow and two catchlights
  function eye(c, x, y, r, iris, o) {
    if (BLINK > 0.02) {
      const b = BLINK; if (b > 0.78) { c.save(); c.strokeStyle = (o && o.line) || INK; c.lineCap = 'round'; c.lineWidth = Math.max(1, r * 0.3); c.beginPath(); c.moveTo(x - r * 0.95, y + r * 0.05); c.quadraticCurveTo(x, y + r * 0.55, x + r * 0.95, y + r * 0.05); c.stroke(); c.restore(); return; }
      c.save(); c.translate(x, y + r * 0.3 * b); c.scale(1, 1 - b * 0.9); c.translate(-x, -y); const keep = BLINK; BLINK = 0; try { eye(c, x, y, r, iris, o); } finally { BLINK = keep; } c.restore(); return;
    }
    o = o || {}; const ry = r * (o.tall || 1.12), lid = o.lid || 0, sd = o.side || 1;
    if (!o.cute) soft(c, x, y + ry * 0.1, r * 1.3, ry * 1.22, 0, '#000000', 0.1);
    const shape = () => { c.beginPath(); c.ellipse(x, y, r, ry, 0, 0, TAU); };
    shape(); const sg = c.createLinearGradient(x, y - ry, x, y + ry); sg.addColorStop(0, '#CFCADC'); sg.addColorStop(0.45, '#FFFFFF'); sg.addColorStop(1, '#E6E2F0'); c.fillStyle = sg; c.fill();
    c.save(); shape(); c.clip();
    const ir = r * (o.irisK || 0.9), ix = x + (o.lx || 0) * r * 0.18, iy = y + ry * 0.1;
    const g = c.createRadialGradient(ix, iy + ir * 0.3, ir * 0.05, ix, iy, ir * 1.05); g.addColorStop(0, sh(iris, 0.62)); g.addColorStop(0.42, sh(iris, 0.18)); g.addColorStop(0.76, iris); g.addColorStop(1, sh(iris, o.cute ? -0.22 : -0.62));
    c.fillStyle = g; c.beginPath(); c.ellipse(ix, iy, ir, ir * 1.1, 0, 0, TAU); c.fill();
    c.strokeStyle = rgba(sh(iris, -0.55), 0.4); c.lineWidth = Math.max(0.3, ir * 0.045); c.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; c.moveTo(ix + Math.cos(a) * ir * 0.44, iy + Math.sin(a) * ir * 0.48); c.lineTo(ix + Math.cos(a) * ir * 0.94, iy + Math.sin(a) * ir * 1.02); } c.stroke();
    c.globalCompositeOperation = 'lighter'; const lg = c.createRadialGradient(ix, iy + ir * 0.62, 0, ix, iy + ir * 0.62, ir * 0.8); lg.addColorStop(0, rgba(sh(iris, 0.45), 0.75)); lg.addColorStop(1, rgba(iris, 0)); c.fillStyle = lg; c.beginPath(); c.arc(ix, iy + ir * 0.62, ir * 0.8, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#110818'; c.beginPath(); c.ellipse(ix, iy + ir * 0.04, ir * (o.slit ? 0.17 : o.cute ? 0.52 : 0.47), ir * (o.slit ? 0.9 : o.cute ? 0.6 : 0.56), 0, 0, TAU); c.fill();
    const ls = c.createLinearGradient(x, y - ry, x, y - ry * 0.05); ls.addColorStop(0, 'rgba(20,8,30,.6)'); ls.addColorStop(1, 'rgba(20,8,30,0)'); c.fillStyle = ls; c.fillRect(x - r, y - ry, r * 2, ry);
    if (lid > 0) { c.fillStyle = o.skin || '#3A3040'; c.beginPath(); c.moveTo(x - r * 1.2 * sd, y - ry * (1 - lid * 1.1)); c.lineTo(x + r * 1.2 * sd, y - ry * (1 - lid * 2.6)); c.lineTo(x + r * 1.2 * sd, y - ry * 1.3); c.lineTo(x - r * 1.2 * sd, y - ry * 1.3); c.closePath(); c.fill(); }
    c.restore();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(ix - ir * 0.36 * MIR, iy - ir * 0.42, ir * 0.3, ir * 0.23, -0.5 * MIR, 0, TAU); c.fill();
    c.globalAlpha = 0.85; c.beginPath(); c.arc(ix + ir * 0.36 * MIR, iy + ir * 0.36, ir * 0.12, 0, TAU); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = o.line || INK; c.lineCap = 'round';
    if (lid > 0) { c.lineWidth = Math.max(1, r * 0.24); c.beginPath(); c.moveTo(x - r * 1.02 * sd, y - ry * (1 - lid * 1.1) * 0.96); c.lineTo(x + r * 1.0 * sd, y - ry * (1 - lid * 2.6) * 0.96); c.stroke(); c.globalAlpha = 0.45; c.lineWidth = Math.max(0.5, r * 0.08); c.beginPath(); c.ellipse(x, y, r, ry, 0, 0.25, Math.PI - 0.25); c.stroke(); c.globalAlpha = 1; }
    else if (o.cute) { c.lineWidth = Math.max(0.8, r * 0.16); c.beginPath(); c.ellipse(x, y, r, ry, 0, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); }
    else { c.lineWidth = Math.max(1, r * 0.22); c.beginPath(); c.ellipse(x, y, r, ry, 0, Math.PI * 1.06, Math.PI * 1.94); c.stroke(); c.globalAlpha = 0.45; c.lineWidth = Math.max(0.5, r * 0.08); c.beginPath(); c.ellipse(x, y, r, ry, 0, 0.25, Math.PI - 0.25); c.stroke(); c.globalAlpha = 1; }
    if (o.flick) { c.lineWidth = Math.max(1, r * 0.2); c.beginPath(); c.moveTo(x - sd * r * 0.92, y - ry * 0.32); c.quadraticCurveTo(x - sd * r * 1.28, y - ry * 0.5, x - sd * r * 1.42, y - ry * 0.82); c.stroke(); }
  }
  function nose(c, x, y, w, col) { const p = () => { c.beginPath(); c.moveTo(x - w, y - w * 0.45); c.quadraticCurveTo(x, y - w * 0.8, x + w, y - w * 0.45); c.quadraticCurveTo(x + w * 0.45, y + w * 0.6, x, y + w * 0.62); c.quadraticCurveTo(x - w * 0.45, y + w * 0.6, x - w, y - w * 0.45); c.closePath(); }; form(c, p, x, y, w, col || '#3A2A3A', { lw: 0.8, specA: 0.65, spR: 0.55, spy: -0.3 }); }
  function mouth(c, x, y, w, kind) {
    c.strokeStyle = INK; c.lineWidth = Math.max(0.9, w * 0.32); c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x, y - w * 0.45); c.lineTo(x, y); c.moveTo(x - w, y + w * 0.05); c.quadraticCurveTo(x - w * 0.5, y + w * 0.6, x, y); c.quadraticCurveTo(x + w * 0.5, y + w * 0.6, x + w, y + w * 0.05); c.stroke();
    if (kind === 'fang') { [-1, 1].forEach(s => { c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x + s * w * 0.35, y + w * 0.2); c.lineTo(x + s * w * 0.5, y + w * 0.85); c.lineTo(x + s * w * 0.68, y + w * 0.22); c.closePath(); c.fill(); c.lineWidth = 0.7; c.stroke(); }); }
  }
  const blush = (c, x, y, r, col) => soft(c, x, y, r, r * 0.68, 0, col || '#FF6F92', 0.38);
  // a horn swept along an arc: shaded across its width (or polished like metal), with growth rings and glowing veins
  function horn(c, x, y, len, ang, turn, w, col, o) {
    o = o || {}; const N = 18, Lp = [], Rp = [], C = []; let px = x, py = y, a = ang;
    for (let i = 0; i <= N; i++) { const u = i / N, ww = w * Math.pow(1 - u, o.pow || 0.8) + (o.tipW || 0.6), nx = -Math.sin(a), ny = Math.cos(a); Lp.push([px + nx * ww / 2, py + ny * ww / 2]); Rp.push([px - nx * ww / 2, py - ny * ww / 2]); C.push([px, py, a, ww]); if (i < N) { px += Math.cos(a) * len / N; py += Math.sin(a) * len / N; a += turn / N; } }
    const path = () => { c.beginPath(); Lp.forEach(([qx, qy], i) => i ? c.lineTo(qx, qy) : c.moveTo(qx, qy)); for (let i = N; i >= 0; i--) c.lineTo(Rp[i][0], Rp[i][1]); c.closePath(); };
    const m = Math.floor(N * 0.3), g = o.metal ? metalG(c, Lp[m][0], Lp[m][1], Rp[m][0], Rp[m][1], col) : c.createLinearGradient(Lp[m][0], Lp[m][1], Rp[m][0], Rp[m][1]);
    if (!o.metal) { g.addColorStop(0, sh(col, -0.5)); g.addColorStop(0.38, col); g.addColorStop(0.68, sh(col, 0.4)); g.addColorStop(1, sh(col, -0.25)); }
    path(); c.fillStyle = g; c.fill();
    c.save(); path(); c.clip();
    const base = c.createRadialGradient(x, y, 0, x, y, w * 1.4); base.addColorStop(0, 'rgba(10,4,20,.45)'); base.addColorStop(1, 'rgba(10,4,20,0)'); c.fillStyle = base; c.fillRect(x - w * 2, y - w * 2, w * 4, w * 4);
    if (o.rings) for (let i = 1; i < N - 1; i += (o.ringStep || 2)) { const [cx2, cy2, aa, ww] = C[i], nx = -Math.sin(aa), ny = Math.cos(aa), bx = Math.cos(aa) * ww * 0.28, by2 = Math.sin(aa) * ww * 0.28; c.strokeStyle = rgba(sh(col, -0.65), 0.55); c.lineWidth = Math.max(0.5, ww * 0.1); c.beginPath(); c.moveTo(cx2 + nx * ww * 0.6, cy2 + ny * ww * 0.6); c.quadraticCurveTo(cx2 + bx, cy2 + by2, cx2 - nx * ww * 0.6, cy2 - ny * ww * 0.6); c.stroke(); c.strokeStyle = rgba(sh(col, 0.55), 0.3); c.beginPath(); c.moveTo(cx2 + nx * ww * 0.6 + bx * 0.5, cy2 + ny * ww * 0.6 + by2 * 0.5); c.quadraticCurveTo(cx2 + bx * 1.5, cy2 + by2 * 1.5, cx2 - nx * ww * 0.6 + bx * 0.5, cy2 - ny * ww * 0.6 + by2 * 0.5); c.stroke(); }
    const vein = [];
    if (o.veins) { C.forEach(([cx2, cy2, aa, ww], i) => { const off = Math.sin(i * 0.55 + 0.5) * ww * 0.2; vein.push([cx2 - Math.sin(aa) * off, cy2 + Math.cos(aa) * off]); }); c.strokeStyle = o.veins; c.lineWidth = Math.max(0.8, w * 0.1); c.beginPath(); vein.forEach(([vx, vy], i) => i ? c.lineTo(vx, vy) : c.moveTo(vx, vy)); c.stroke(); }
    c.restore();
    path(); c.lineWidth = o.lw || 1.2; c.strokeStyle = o.line || inkOf(col); c.lineJoin = 'round'; c.stroke();
    const tip = [px, py]; tip.vein = vein; tip.pts = C; return tip;
  }
  // a feathered wing: long primaries from the hand, secondaries along the arm, two rows of coverts on top, a soft leading edge.
  // Sweeps toward -x; pal = [root, middle, tip]; o.irid = colours shifting from inner to outer feathers.
  function wing(c, x, y, S, pal, o) {
    o = o || {}; const sp = o.spread == null ? 0.7 : o.spread, n = o.n || 8, R = mulberry32(o.seed || 9);
    c.save(); c.translate(x, y); c.rotate((o.rot == null ? sp * 0.35 - 0.1 : o.rot) + (o.flap || 0));
    const wx = -S * 0.52, wy = -S * 0.14, angIn = Math.PI * 0.5 + 0.45, angOut = Math.PI + 0.25 + sp * 0.5;
    const colsAt = (u, row) => { if (o.irid) { const I = o.irid, f = u * (I.length - 1), i = Math.min(I.length - 2, Math.floor(f)), tcol = mix(I[i], I[i + 1], f - i); return [row ? pal[0] : mix(pal[0], tcol, 0.25), mix(pal[1], tcol, 0.45), tcol]; } return [pal[0], pal[1], pal[2]]; };
    const feather = (bx, by, ang, L, W, cols) => {
      c.save(); c.translate(bx, by); c.rotate(ang);
      const p = () => { c.beginPath(); c.moveTo(0, -W * 0.45); c.bezierCurveTo(L * 0.35, -W * 0.72, L * 0.8, -W * 0.56, L, -W * 0.06); c.bezierCurveTo(L * 1.04, W * 0.26, L * 0.86, W * 0.56, L * 0.6, W * 0.56); c.bezierCurveTo(L * 0.35, W * 0.62, L * 0.1, W * 0.52, 0, W * 0.45); c.closePath(); };
      c.save(); c.translate(W * 0.16, W * 0.26); p(); c.fillStyle = 'rgba(20,8,40,.2)'; c.fill(); c.restore();
      const g = c.createLinearGradient(0, 0, L, 0); g.addColorStop(0, cols[0]); g.addColorStop(0.55, cols[1]); g.addColorStop(1, cols[2]); p(); c.fillStyle = g; c.fill();
      const g2 = c.createLinearGradient(0, -W * 0.6, 0, W * 0.6); g2.addColorStop(0, 'rgba(255,255,255,.3)'); g2.addColorStop(0.45, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(20,8,40,.24)'); p(); c.fillStyle = g2; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(0.45, W * 0.06); c.beginPath(); c.moveTo(L * 0.04, 0); c.quadraticCurveTo(L * 0.5, -W * 0.12, L * 0.92, -W * 0.05); c.stroke();
      if (L > 10) { c.strokeStyle = 'rgba(20,8,40,.14)'; c.lineWidth = 0.45; c.beginPath(); for (let j = 1; j < 6; j++) { const u = j / 6; c.moveTo(L * u, -W * 0.05); c.lineTo(L * (u + 0.08), W * 0.44); } c.stroke(); }
      p(); c.lineWidth = o.lw || 0.85; c.strokeStyle = o.line || inkOf(cols[1]); c.stroke();
      c.restore();
    };
    limb(c, 0, 0, wx * 0.96, wy * 0.96, S * 0.13, S * 0.08, pal[0], { lw: o.lw || 0.85 });
    const rows = o.rows || 3;
    for (let row = 0; row < rows; row++) {
      const m = Math.max(3, n - row * 2), Lk = [1, 0.62, 0.36][row], Wk = [0.25, 0.24, 0.22][row];
      for (let i = 0; i < m; i++) {
        const u = m > 1 ? 1 - i / (m - 1) : 1, ang = angIn + (angOut - angIn) * Math.pow(u, 0.9) + (R() - 0.5) * 0.05;
        const f = 0.06 + 0.94 * u, bx = wx * f + Math.cos(ang - Math.PI / 2) * row * S * 0.03, by = wy * f + Math.sin(ang - Math.PI / 2) * row * S * 0.03;
        const L = S * Lk * (0.48 + 0.52 * Math.pow(u, 0.75)) * (0.94 + R() * 0.12), W = S * Wk * (0.85 + 0.25 * u);
        feather(bx, by, ang, L, W, colsAt(u, row));
      }
    }
    c.restore();
    return [x, y];
  }
  // hair locks: curved blades fanned round an ellipse, each shaded root to tip, with a highlight strand (manes, ruffs)
  function locks(c, cx, cy, rx, ry, a0, a1, n, len, w, col, dark, o) {
    o = o || {}; const R = mulberry32(o.seed || 3), list = [];
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, a = a0 + (a1 - a0) * u, j = R(); list.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, a + (o.lean || 0) * (o.sym === false ? 1 : Math.cos(a) >= 0 ? 1 : -1) + (R() - 0.5) * 0.28, len * (0.75 + j * 0.5) * (o.prof ? o.prof(u, a) : 1), w * (0.85 + R() * 0.4), ((R() - 0.5) * 0.7 + (o.bend == null ? 0.18 : o.bend)) * (Math.cos(a) >= 0 ? 1 : -1)]); }
    (o.order ? o.order(list) : list.sort((p, q) => p[1] - q[1])).forEach(([x, y, a, l, ww, b]) => {
      c.save(); c.translate(x, y); c.rotate(a);
      const p = () => { c.beginPath(); c.moveTo(-ww * 0.2, -ww / 2); c.bezierCurveTo(l * 0.35, -ww * 0.62 - b * l * 0.3, l * 0.8, -ww * 0.3 - b * l * 0.8, l, -b * l); c.bezierCurveTo(l * 1.02, -b * l + ww * 0.28, l * 0.6, ww * 0.5 - b * l * 0.45, -ww * 0.2, ww / 2); c.closePath(); };
      const g = c.createLinearGradient(0, 0, l, -b * l); g.addColorStop(0, dark); g.addColorStop(0.5, col); g.addColorStop(1, o.tip || sh(col, 0.3));
      p(); c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.32)'; c.lineWidth = Math.max(0.5, ww * 0.12); c.beginPath(); c.moveTo(ww * 0.2, -ww * 0.12); c.quadraticCurveTo(l * 0.5, -ww * 0.22 - b * l * 0.35, l * 0.82, -b * l * 0.82); c.stroke();
      if (o.lw !== 0) { p(); c.lineWidth = o.lw || 0.8; c.strokeStyle = o.line || inkOf(col); c.stroke(); }
      c.restore();
    });
  }
  // a fluffy mass made of several furry blobs, outlined only on the outside (tails, wool, ruffs)
  function fluffy(c, segs, x, y, r, col, o) {
    o = o || {}; const path = () => { c.beginPath(); segs.forEach(([sx, sy, rx, ry, len, seed]) => furPath(c, sx, sy, rx, ry, { n: Math.max(7, Math.round((rx + ry) * 0.55)), len, seed, lean: o.lean, sub: true })()); };
    if (o.lw !== 0) { path(); c.lineWidth = (o.lw || 1.2) * 2; c.strokeStyle = o.line || inkOf(col); c.lineJoin = 'round'; c.stroke(); }
    form(c, path, x, y, r, col, Object.assign({}, o, { lw: 0 }));
  }
  // a tongue of flame (for L.back / L.fx, drawn additively)
  function flame(c, px, py, ang, w, h, lean, c0, c1, c2) {
    c.save(); c.translate(px, py); c.rotate(ang);
    const sway = -lean * 0.6, path = k => { c.beginPath(); c.moveTo(-w * k, h * 0.3); c.bezierCurveTo(-w * 1.3 * k, -h * 0.1, sway - w * 0.5 * k, -h * 0.45, lean - w * 0.15 * k, -h * 0.72); c.quadraticCurveTo(lean + sway * 0.3, -h * 0.9, lean, -h); c.quadraticCurveTo(lean + w * 0.3 * k, -h * 0.78, sway + w * 0.5 * k, -h * 0.4); c.bezierCurveTo(w * 1.2 * k, -h * 0.15, w * 1.05 * k, h * 0.1, w * k, h * 0.3); c.closePath(); };
    const g = c.createLinearGradient(0, h * 0.3, lean * 0.5, -h); g.addColorStop(0, c0); g.addColorStop(0.5, c1); g.addColorStop(1, c2);
    c.globalAlpha = 0.3; path(1.8); c.fillStyle = g; c.fill(); c.globalAlpha = 0.95; path(1); c.fill(); c.globalAlpha = 1;
    c.restore();
  }
  const FIRE = ['rgba(200,30,60,.9)', '#FF7A3D', 'rgba(255,236,150,0)'], GOLDFIRE = ['rgba(230,120,30,.9)', '#FFC24D', 'rgba(255,250,220,0)'];
  function glow(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = FA * (a == null ? 0.6 : a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function star4(c, x, y, r, col, a) { if (!(a > 0)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = FA * (a); c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x, y - r * 2.2); c.quadraticCurveTo(x, y, x + r * 2.2, y); c.quadraticCurveTo(x, y, x, y + r * 2.2); c.quadraticCurveTo(x, y, x - r * 2.2, y); c.quadraticCurveTo(x, y, x, y - r * 2.2); c.fill(); blitSized(c, glowSprite(col), x - r * 3, y - r * 3, r * 6, r * 6); c.restore(); }
  function ringLight(c, x, y, rx, ry, col, a, rot) { c.save(); c.globalCompositeOperation = 'lighter'; [[9, 0.16], [4.5, 0.42], [1.8, 0.95]].forEach(([w, al], i) => { c.globalAlpha = FA * (al * (a == null ? 1 : a)); c.strokeStyle = i === 2 ? '#FFFFFF' : col; c.lineWidth = w; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.stroke(); }); c.restore(); }
  function bolt(c, x0, y0, x1, y1, seed, col, jag) { const R = mulberry32(seed), pts = [[x0, y0]]; for (let i = 1; i < 7; i++) { const u = i / 7; pts.push([x0 + (x1 - x0) * u + (R() - 0.5) * (jag || 9), y0 + (y1 - y0) * u + (R() - 0.5) * (jag || 9)]); } pts.push([x1, y1]); c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round'; [[6, 0.22, col], [2.6, 0.8, col], [1.1, 1, '#FFFFFF']].forEach(([w, a, cc]) => { c.globalAlpha = FA * (a); c.strokeStyle = cc; c.lineWidth = w; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }); c.restore(); }
  function rose(c, x, y, r, col) {
    col = col || '#FF8FB8';
    orb(c, x, y, r, r * 0.92, col, { hi: mix(col, '#FFFFFF', 0.6), dk: sh(col, -0.35), lw: 0.9, specA: 0.25 });
    c.strokeStyle = rgba(sh(col, -0.45), 0.85); c.lineWidth = Math.max(0.6, r * 0.13); c.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const rr = r * (0.82 - i * 0.2), a0 = i * 1.7; c.beginPath(); c.arc(x + Math.cos(a0) * r * 0.06, y + Math.sin(a0) * r * 0.06, rr, a0, a0 + 3.6); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = Math.max(0.5, r * 0.09); c.beginPath(); c.arc(x - r * 0.1, y - r * 0.1, r * 0.62, 3.6, 4.9); c.stroke();
  }
  function leaf(c, x, y, s, ang, col) { c.save(); c.translate(x, y); c.rotate(ang); form(c, () => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.5, -s * 0.38, s, 0); c.quadraticCurveTo(s * 0.5, s * 0.38, 0, 0); c.closePath(); }, s * 0.5, 0, s * 0.5, col || '#5FA86A', { lw: 0.7, specA: 0.3 }); c.restore(); }

  /* ---- the aura: grows with every Ascension ---- */
  function auraBack(g, id, k, t) {
    const A = ANIMAS[id], col = A.glow, c2 = A.color, heaven = A.realm === 'heaven', cy = -12, R = [50, 66, 88][k - 1];
    if (k === 3 && !heaven) { g.save(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + t * 0.3, rr = 60 + 9 * Math.sin(t * 0.9 + i * 1.3), s = 26 + 7 * Math.sin(t * 1.3 + i); g.globalAlpha = FA * (0.5); blitSized(g, puffSprite('rgba(10,3,22,'), Math.cos(a) * rr - s, cy + Math.sin(a) * rr * 0.72 - s, s * 2, s * 2); } g.restore(); }
    g.save(); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = FA * ([0.3, 0.42, 0.55][k - 1] * (0.9 + 0.1 * Math.sin(t * 2))); blitSized(g, glowSprite(col), -R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
    g.globalAlpha = FA * ([0.16, 0.24, 0.34][k - 1]); blitSized(g, glowSprite(c2), -R * 0.95, cy - R * 0.95, R * 1.9, R * 1.9);
    if (k >= 2) { const n = k === 3 ? 18 : 10, Ln = k === 3 ? 92 : 64; for (let i = 0; i < n; i++) { const a = i / n * TAU + t * (i % 2 ? 0.1 : -0.07), w = (k === 3 ? 9 : 7) * (0.6 + 0.4 * Math.sin(t * 1.1 + i * 2.3)); g.save(); g.translate(0, cy); g.rotate(a); g.globalAlpha = FA * ((k === 3 ? 0.13 : 0.08) * (0.55 + 0.45 * Math.sin(t * 0.8 + i * 1.7))); blitSized(g, beamSprite(i % 3 ? col : c2), R * 0.18, -w / 2, Ln * (0.7 + 0.3 * Math.sin(i * 2.7)), w); g.restore(); } }
    if (k === 3 && heaven) { g.save(); g.translate(0, 44); g.rotate(-Math.PI / 2); g.globalAlpha = FA * (0.11 + 0.04 * Math.sin(t * 2)); blitSized(g, beamSprite(col), -10, -30, 210, 60); g.globalAlpha = FA * (0.12); blitSized(g, beamSprite('#FFFFFF'), 0, -6, 190, 12); g.restore(); }
    if (k === 3 && !heaven) for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + t * 0.3, rr = 60 + 9 * Math.sin(t * 0.9 + i * 1.3); g.globalAlpha = FA * (0.4); blitSized(g, glowSprite(c2), Math.cos(a) * rr - 12, cy + Math.sin(a) * rr * 0.72 - 12, 24, 24); }
    runeRing(g, id, A, k, t);
    motes(g, A, k, t, false);
    g.restore();
  }
  function runeRing(g, id, A, k, t) {
    const rx = [36, 52, 66][k - 1], ry = rx * 0.27;
    g.save(); g.translate(0, 41);
    g.globalAlpha = FA * ([0.22, 0.32, 0.45][k - 1]); blitSized(g, glowSprite(A.glow), -rx * 1.25, -ry * 1.6, rx * 2.5, ry * 3.2);
    g.scale(1, ry / rx); g.strokeStyle = A.color;
    g.globalAlpha = FA * ([0.28, 0.55, 0.8][k - 1]); g.lineWidth = 2.2; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.stroke();
    if (k >= 2) { g.lineWidth = 1.3; g.beginPath(); g.arc(0, 0, rx * 0.8, 0, TAU); g.stroke();
      g.save(); g.rotate(t * 0.4); g.setLineDash([5, 7]); g.lineWidth = 3.4; g.beginPath(); g.arc(0, 0, rx * 0.9, 0, TAU); g.stroke(); g.setLineDash([]); g.restore();
      g.save(); g.rotate(-t * 0.25); g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r2 = i % 3 ? 0.86 : 0.97; g.moveTo(Math.cos(a) * rx * 0.81, Math.sin(a) * rx * 0.81); g.lineTo(Math.cos(a) * rx * r2, Math.sin(a) * rx * r2); } g.stroke(); g.restore(); }
    if (k === 3) { g.save(); g.rotate(t * 0.15); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; sigil(g, id, Math.cos(a) * rx * 0.62, Math.sin(a) * rx * 0.62, 14, A.glow, 0.85, 2); } g.restore(); }
    g.restore();
  }
  function motes(g, A, k, t, front) {
    const n = [4, 7, 12][k - 1], R = [38, 52, 64][k - 1];
    for (let i = 0; i < n; i++) { const a = t * (0.6 + (i % 3) * 0.15) + i / n * TAU, z = Math.sin(a); if (front !== z > 0) continue; const x = Math.cos(a) * R, y = -12 + z * R * 0.3 + Math.sin(t * 1.7 + i) * 6 - (i % 4) * 9, s = (1.8 + (i % 3) * 0.8) * (front ? 1.2 : 0.85); g.globalAlpha = FA * (front ? 0.9 : 0.5); blitSized(g, glowSprite(i % 2 ? A.glow : A.color), x - s * 3, y - s * 3, s * 6, s * 6); g.globalAlpha = FA * (front ? 1 : 0.55); blitSized(g, glowSprite('#FFFFFF'), x - s, y - s, s * 2, s * 2); }
  }
  function auraFront(g, id, k, t) {
    const A = ANIMAS[id]; g.save(); g.globalCompositeOperation = 'lighter';
    motes(g, A, k, t, true);
    if (k >= 2) { const n = k === 3 ? 10 : 5; for (let i = 0; i < n; i++) { const ph = (t * 0.33 + i / n) % 1, x = Math.sin(i * 7.31) * 46 + Math.sin(t * 2 + i) * 4, y = 40 - ph * 115; star4(g, x, y, 1.2 + (i % 3) * 0.5, A.glow, Math.sin(ph * Math.PI) * 0.85); } }
    g.restore();
  }

  /* ---- the painters ---- */
  const hoof = (c, x, y, w, col, band) => { orb(c, x, y, w, w * 0.5, col || '#17121C', { specA: 0.5, lw: 1 }); if (band) plate(c, ell(c, x, y - w * 0.55, w * 0.95, w * 0.3), x, y - w * 0.55, w, band, { lw: 0.8 }); };
  const P = {
    // Samael: a black lamb with ember horns whose wool burns white-hot as it ascends
    aries(c, k, t, L) {
      const wool = ['#3B3543', '#8B8391', '#F8F2EC'][k - 1], woolDk = ['#1B1721', '#48414E', '#E9B596'][k - 1], face = ['#2B2531', '#342C3A', '#2A2029'][k - 1];
      const bw = [29, 32, 35][k - 1], bh = [21, 22, 23][k - 1], by = [12, 10, 7][k - 1], s = [1, 1.07, 1.16][k - 1], hr = [17, 18, 19][k - 1], hy = by - bh - hr * 0.3;
      if (k >= 2) L.back(g => { g.globalCompositeOperation = 'lighter'; const n = k === 3 ? 13 : 7, spread = k === 3 ? 3 : 2; for (let i = 0; i < n; i++) { const u = i / (n - 1), a = -Math.PI / 2 + (u - 0.5) * spread, R0 = k === 3 ? bw * 0.86 : bw * 0.66; flame(g, Math.cos(a) * R0, by - 2 + Math.sin(a) * bh * 0.86, a + Math.PI / 2, 4 + k * 1.6, (k === 3 ? 32 : 18) * (0.75 + 0.25 * Math.sin(t * 7 + i * 1.9)) * (1 - Math.abs(u - 0.5) * 0.55), Math.sin(t * 4 + i) * 3, ...FIRE); }
        if (k === 3) for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i / 8 - 0.5) * 2.4; flame(g, Math.cos(a) * hr * 1.05, hy + Math.sin(a) * hr * 0.95, a + Math.PI / 2, 4.5, 20 * (0.8 + 0.2 * Math.sin(t * 8 + i * 2.3)), Math.sin(t * 5 + i) * 2, ...FIRE); } });
      [-1, 1].forEach(sx => { limb(c, sx * bw * 0.52, by + bh * 0.3, sx * bw * 0.58, 37, 8.5 * s, 7 * s, sh(face, -0.12), { tex: 'fine', texA: 0.3 }); hoof(c, sx * bw * 0.58, 38.4, 5.2 * s); });
      [-1, 1].forEach(sx => { limb(c, sx * 9.5, by + bh * 0.4, sx * 10, 37.5, 9 * s, 7.6 * s, face, { tex: 'fine', texA: 0.35 }); hoof(c, sx * 10, 38.8, 5.8 * s); if (k >= 2) L.fx(g => { g.globalCompositeOperation = 'lighter'; flame(g, sx * 10, 39.5, 0, 2.6 + k * 0.6, 6 + k * 2.5 + 1.5 * Math.sin(t * 9 + sx), Math.sin(t * 5 + sx) * 2, 'rgba(200,30,60,.5)', '#FF7A3D', 'rgba(255,236,150,0)'); }); });
      form(c, cloud(c, 0, by, bw, bh, 13, 0.3, 3), 0, by, bw, wool, { tex: 'wool', texA: 0.62, dk: woolDk, specA: 0.2, lw: 1.3, soft: () => { soft(c, 0, by + bh * 0.85, bw, bh * 0.45, 0, k === 3 ? '#FF6A2A' : '#0A0412', k === 3 ? 0.3 : 0.28); soft(c, -bw * 0.3 * MIR, by - bh * 0.4, bw * 0.5, bh * 0.35, 0, '#FFFFFF', k === 1 ? 0.1 : 0.18); } });
      if (k >= 2) L.fx(g => { g.globalCompositeOperation = 'lighter'; const R = mulberry32(21); for (let i = 0; i < (k === 3 ? 9 : 6); i++) { const x = (R() - 0.5) * bw * 1.5, y = by + (R() - 0.3) * bh * 1.1, r = 3 + R() * 3, a0 = R() * 6, pul = 0.55 + 0.45 * Math.sin(t * 3 + i * 1.7); g.globalAlpha = FA * ((k === 3 ? 0.55 : 0.8) * pul); g.strokeStyle = k === 3 ? '#FFB066' : '#FF5A3C'; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, r, a0, a0 + 2.6); g.stroke(); g.globalAlpha = FA * (0.35 * pul); blitSized(g, glowSprite('#FF6A3A'), x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8); } });
      both(c, () => { c.save(); c.translate(-hr * 0.95, hy + 3); c.rotate(0.55); form(c, ell(c, -4, 0, 9, 4.2), -4, 0, 9, face, { tex: 'fine', texA: 0.35, specA: 0.2, lw: 1.1 }); form(c, ell(c, -4.5, 0.4, 5.6, 2), -4.5, 0.4, 5.6, '#C25A74', { lw: 0, spec: false }); c.restore(); });
      const hl = [11, 40, 56][k - 1], hw = [6.5, 11, 14][k - 1], hc = ['#FF8A4D', '#7E2436', '#2B1F2C'][k - 1], vc = ['', '#FF5A3C', '#FF8A3D'][k - 1];
      both(c, sd => { const tip = k === 1 ? horn(c, -hr * 0.55, hy - hr * 0.7, hl, -2.0, 0.6, hw, hc, { lw: 1.1 }) : horn(c, -hr * 0.5, hy - hr * 0.72, hl, -2.7, -3.9, hw, hc, { rings: true, ringStep: 1, veins: vc, lw: 1.2, pow: 1.1 });
        if (k === 1) L.fx(g => glow(g, tip[0] * sd, tip[1], 9, '#FF8A4D', 0.85));
        else L.fx(g => { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = vc; g.lineCap = 'round'; const pul = 0.6 + 0.4 * Math.sin(t * 3 + sd); [[3.2, 0.12], [1.1, 0.5]].forEach(([w, a]) => { g.globalAlpha = FA * (a * pul); g.lineWidth = w; g.beginPath(); tip.vein.forEach(([vx, vy], i) => i ? g.lineTo(vx * sd, vy) : g.moveTo(vx * sd, vy)); g.stroke(); }); g.restore(); }); });
      form(c, ell(c, 0, hy, hr, hr * 0.92), 0, hy, hr, face, { tex: 'fine', texA: 0.4, specA: 0.38 });
      form(c, cloud(c, 0, hy - hr * 0.8, hr * 0.64, hr * 0.34, 7, 0.4, 5), 0, hy - hr * 0.84, hr * 0.6, wool, { tex: 'wool', texA: 0.55, dk: woolDk, lw: 1.1, specA: 0.2 });
      const er = [5.9, 5.6, 5.3][k - 1], ec = k === 3 ? '#FF3B2E' : '#FF6A3A';
      [-1, 1].forEach(sx => eye(c, sx * hr * 0.42, hy + 1.5, er, ec, { lid: [0, 0.14, 0.3][k - 1], skin: face, side: -sx }));
      if (k >= 2) L.fx(g => [-1, 1].forEach(sx => glow(g, sx * hr * 0.42, hy + 1.5, er * 2.4, ec, 0.3 + 0.1 * k)));
      form(c, ell(c, 0, hy + hr * 0.58, hr * 0.44, hr * 0.3), 0, hy + hr * 0.58, hr * 0.44, sh(face, 0.2), { tex: 'fine', texA: 0.3, specA: 0.3, lw: 1 });
      nose(c, 0, hy + hr * 0.48, 2.5, '#120C16'); mouth(c, 0, hy + hr * 0.67, 2.3, k === 3 ? 'fang' : '');
      [-1, 1].forEach(sx => blush(c, sx * hr * 0.66, hy + hr * 0.38, 4.6, '#FF5A6A'));
      if (k === 3) { gem(c, 0, hy - hr * 0.42, 3.6, '#FF3B4E'); L.fx(g => glow(g, 0, hy - hr * 0.42, 14, '#FF3B4E', 0.85)); }
      if (k >= 2) L.fx(g => { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4 + k * 3; i++) { const ph = (t * 0.5 + i * 0.137) % 1, x = Math.sin(i * 12.9) * bw * 0.9 + Math.sin(t * 2 + i) * 3, y = by + bh * 0.4 - ph * 75; g.globalAlpha = FA * (Math.sin(ph * Math.PI) * 0.9); blitSized(g, glowSprite(i % 2 ? '#FFB066' : '#FF5A3C'), x - 4, y - 4, 8, 8); } });
    },
    // Belial: a glossy black calf whose gold horns become a crown of ages, armoured in gold as it grows
    taurus(c, k, t, L) {
      const hide = '#24222D', hideHi = '#6A6C92', gold = '#F2C65A', mz = '#4C4756';
      const bw = [31, 35, 39][k - 1], bh = [22, 23, 25][k - 1], by = [13, 11, 9][k - 1], s = [1, 1.1, 1.22][k - 1], hr = [18, 19.5, 20.5][k - 1], hy = by - bh * 0.92, sway = Math.sin(t * 2.2) * 3;
      const tp = bez([bw * 0.8, by - 6], [bw * 1.25, by - 4], [bw * 1.32, by + 12 + sway], [bw * 1.16, by + 22 + sway], 12);
      form(c, ribbon(c, tp, 3.6, 2.2), bw * 1.1, by + 8, 14, hide, { spec: false, lw: 1 });
      const te = tp[tp.length - 1]; form(c, furPath(c, te[0], te[1] + 3, 3.4, 4.6, { n: 8, len: 3.5, seed: 4 }), te[0], te[1] + 3, 5, '#14121A', { spec: false, lw: 0.9 });
      if (k === 3) plate(c, () => { c.beginPath(); c.ellipse(te[0], te[1] - 3, 5.2, 5.2, 0, 0, TAU); c.moveTo(te[0] + 3, te[1] - 3); c.ellipse(te[0], te[1] - 3, 3, 3, 0, 0, TAU, true); }, te[0], te[1] - 3, 5.2, gold, { lw: 0.9 });
      [-1, 1].forEach(sx => { limb(c, sx * bw * 0.58, by + 4, sx * bw * 0.62, 37, 11.5 * s, 9 * s, sh(hide, -0.1), { tex: 'hide', texA: 0.3 }); hoof(c, sx * bw * 0.62, 38.6, 6.4 * s, '#121016', k >= 2 ? gold : null); });
      [-1, 1].forEach(sx => { limb(c, sx * 11, by + 6, sx * 11.5, 37.5, 12.5 * s, 9.6 * s, hide, { tex: 'hide', texA: 0.3 }); hoof(c, sx * 11.5, 39, 7 * s, '#121016', k >= 2 ? gold : null); });
      form(c, ell(c, 0, by, bw, bh), 0, by, bw, hide, { tex: 'hide', texA: 0.32, hi: hideHi, specA: 0.5, spR: 0.42, soft: () => { soft(c, -bw * 0.15 * MIR, by - bh * 0.62, bw * 0.62, bh * 0.2, -0.15 * MIR, '#A8B0E8', 0.22); soft(c, 0, by + bh * 0.8, bw, bh * 0.4, 0, '#000000', 0.35); } });
      if (k >= 2) form(c, ell(c, 0, by - bh * 0.5, bw * 0.62, bh * 0.58), 0, by - bh * 0.5, bw * 0.62, hide, { tex: 'hide', texA: 0.3, hi: hideHi, specA: 0.45, lw: 1.2 });
      if (k === 3) { plate(c, blob(c, [[0, by - 10], [13, by - 6], [16, by + 4], [8, by + 14], [0, by + 18], [-8, by + 14], [-16, by + 4], [-13, by - 6]]), 0, by + 3, 16, gold, { fili: () => { c.beginPath(); c.moveTo(0, by - 6); c.bezierCurveTo(8, by - 2, 8, by + 8, 0, by + 12); c.bezierCurveTo(-8, by + 8, -8, by - 2, 0, by - 6); c.moveTo(-11, by + 1); c.quadraticCurveTo(-6, by + 9, 0, by + 15); c.moveTo(11, by + 1); c.quadraticCurveTo(6, by + 9, 0, by + 15); c.stroke(); } }); gem(c, 0, by + 3, 4.4, '#B983F5'); L.fx(g => glow(g, 0, by + 3, 13, '#B983F5', 0.6)); }
      both(c, () => { c.save(); c.translate(-hr * 1.08, hy - hr * 0.12); c.rotate(-0.35); form(c, ell(c, -4, 0, 9.5, 4.3), -4, 0, 9.5, hide, { tex: 'hide', texA: 0.3, specA: 0.3, hi: hideHi }); form(c, ell(c, -4.6, 0.3, 5.8, 2.2), -4.6, 0.3, 5.8, '#B05A70', { lw: 0, spec: false }); c.restore(); });
      const hl = [9, 22, 40][k - 1], hw = [6.4, 8.4, 11.5][k - 1];
      both(c, () => horn(c, -hr * 0.62, hy - hr * 0.6, hl, k === 1 ? -1.95 : k === 2 ? -2.75 : -2.95, k === 1 ? 0.35 : k === 2 ? 1.4 : 1.9, hw, gold, { metal: true, rings: k > 1, ringStep: 3, lw: 1.1 }));
      form(c, ell(c, 0, hy, hr, hr * 0.86), 0, hy, hr, hide, { tex: 'hide', texA: 0.32, hi: hideHi, specA: 0.48 });
      form(c, furPath(c, 0, hy - hr * 0.72, hr * 0.42, hr * 0.2, { n: 9, len: 3.6, seed: 8, prof: a => (a > Math.PI ? 1.2 : 0.3) }), 0, hy - hr * 0.72, hr * 0.42, '#16141C', { spec: false, lw: 0.9 });
      if (k >= 2) { const cr = k === 3 ? 11 : 7; plate(c, blob(c, [[0, hy - hr * 0.95 - cr * 0.4], [cr * 0.55, hy - hr * 0.6], [cr * (k === 3 ? 1.3 : 0.5), hy - hr * 0.75], [cr * 0.4, hy - hr * 0.25], [0, hy - hr * 0.1], [-cr * 0.4, hy - hr * 0.25], [-cr * (k === 3 ? 1.3 : 0.5), hy - hr * 0.75], [-cr * 0.55, hy - hr * 0.6]]), 0, hy - hr * 0.55, cr, gold, { lw: 1 }); gem(c, 0, hy - hr * 0.5, k === 3 ? 3.4 : 2.6, '#B983F5'); L.fx(g => glow(g, 0, hy - hr * 0.5, 10, '#D9B8FF', 0.55)); }
      [-1, 1].forEach(sx => eye(c, sx * hr * 0.44, hy - 1, 4.8, '#FFB347', { lid: [0, 0.16, 0.24][k - 1], skin: hide, side: -sx }));
      if (k === 3) L.fx(g => [-1, 1].forEach(sx => glow(g, sx * hr * 0.44, hy - 1, 11, '#FFB347', 0.45)));
      form(c, ell(c, 0, hy + hr * 0.52, hr * 0.68, hr * 0.42), 0, hy + hr * 0.52, hr * 0.68, mz, { tex: 'hide', texA: 0.35, specA: 0.35, lw: 1.1 });
      [-1, 1].forEach(sx => orb(c, sx * hr * 0.28, hy + hr * 0.5, 2.3, 1.7, '#0E0C12', { spec: false, lw: 0 }));
      mouth(c, 0, hy + hr * 0.72, 2.4);
      if (k >= 2) { c.lineWidth = 2.4; c.strokeStyle = metalG(c, -4, 0, 4, 0, gold); c.beginPath(); c.arc(0, hy + hr * 0.62, 4.2, 0.25, Math.PI - 0.25); c.stroke(); }
      [-1, 1].forEach(sx => blush(c, sx * hr * 0.7, hy + hr * 0.3, 4, '#FF8AA8'));
      if (k === 3) L.fx(g => { for (let i = 0; i < 4; i++) { const ph = (t * 0.6 + i * 0.25) % 1; [-1, 1].forEach(sx => { const x = sx * (hr * 0.28 + ph * 8), y = hy + hr * 0.62 + ph * 5, s2 = 3 + ph * 9; g.globalAlpha = FA * (0.28 * (1 - ph)); blitSized(g, puffSprite('rgba(240,240,255,'), x - s2, y - s2, s2 * 2, s2 * 2); }); } });
    },
    // Raziel: the twin celestial dragons of the sun and the moon are a cel-shaded model of their own (see Anima3D); the
    // painted layer, when it is asked for, draws that model in its place (feet at y 40, 110 units tall)
    gemini(c, k, t) { if (typeof Anima3D !== 'undefined' && Anima3D.has('gemini')) Anima3D.draw(c, 'gemini', k, 0, 40, 110, t, { fk: 1 }); },
    // Abaddon: a glossy crimson crab under a pale moon, with lantern-cyan eyes
    cancer(c, k, t, L) {
      const shell = '#6C2139', hi = '#D0607E', cy = '#5DF2FF', by = 12, wave = Math.sin(t * 3) * 0.1, csz = [11, 14, 17][k - 1];
      if (k === 3) L.back(g => { const R = 40; glow(g, 0, -28, R * 1.9, '#BFEFFF', 0.25); g.save(); const gr = g.createRadialGradient(-10, -40, 4, 0, -28, R); gr.addColorStop(0, '#F4F8FF'); gr.addColorStop(0.65, '#C9D6EE'); gr.addColorStop(1, '#8EA0C8'); g.fillStyle = gr; g.globalAlpha = FA * (0.85); g.beginPath(); g.arc(0, -28, R, 0, TAU); g.fill(); g.globalAlpha = FA * (0.35); [[-14, -40, 7], [12, -20, 9], [16, -44, 4], [-4, -14, 5], [-22, -22, 4]].forEach(([x, y, r]) => { g.fillStyle = '#7A8AB0'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.25, r * 0.6, 0, TAU); g.fill(); }); g.restore(); });
      for (let i = 2; i >= 0; i--) both(c, () => { const y0 = by + 4 + i * 5, kx = -40 - i * 2, ky = by - 4 + i * 5, tx = -46 + i * 3, ty = 38; limb(c, -22, y0, kx, ky, 6, 4.8, sh(shell, -0.12), { tex: 'chitin', texA: 0.35 }); limb(c, kx, ky, tx, ty, 4.8, 1.6, sh(shell, -0.05), { tex: 'chitin', texA: 0.35 }); orb(c, kx, ky, 3, 3, sh(shell, -0.1), { lw: 0.9, specA: 0.5 }); });
      both(c, s => {
        limb(c, -18, by - 4, -30, by - 10, 7.5, 6.5, shell, { tex: 'chitin', texA: 0.35 }); limb(c, -30, by - 10, -38, by - 18, 6.5, 6, shell, { tex: 'chitin', texA: 0.35 });
        const x = -42, y = by - 24 + Math.sin(t * 3 + s) * 1.4, z = csz; c.save(); c.translate(x, y); c.rotate(-0.45 + wave * s);
        form(c, blob(c, [[-z * 0.8, z * 0.45], [-z * 0.7, -z * 0.35], [-z * 0.1, -z * 0.8], [z * 0.75, -z * 0.95], [z * 1.15, -z * 0.55], [z * 0.35, -z * 0.18], [z * 1.05, z * 0.05], [z * 0.75, z * 0.45], [0, z * 0.82]]), 0, 0, z, shell, { tex: 'chitin', texA: 0.4, hi, specA: 0.55, lw: 1.2 });
        c.fillStyle = '#F2E6EA'; for (let j = 0; j < 3; j++) { const px = z * (0.42 + j * 0.2), py = -z * (0.32 - j * 0.04); c.beginPath(); c.moveTo(px - z * 0.07, py); c.lineTo(px, py + z * 0.16); c.lineTo(px + z * 0.07, py); c.closePath(); c.fill(); }
        spec(c, -z * 0.15, -z * 0.4, z * 0.4, 0.5); c.restore();
      });
      const shellP = blob(c, [[-34, by + 2], [-31, by - 9], [-16, by - 16], [16, by - 16], [31, by - 9], [34, by + 2], [24, by + 14], [-24, by + 14]]);
      form(c, shellP, 0, by - 2, 34, shell, { tex: 'chitin', texA: 0.42, hi, specA: 0.55, spR: 0.3, lw: 1.3, soft: () => { soft(c, 0, by + 12, 26, 7, 0, '#F2B0C0', 0.4); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-20 * MIR, by - 12); c.quadraticCurveTo(-6 * MIR, by - 15, 6 * MIR, by - 13); c.stroke(); } });
      if (k >= 2) { const pts = [-30, -22, -13, 13, 22, 30]; pts.forEach((x, i) => { const y = by - (Math.abs(x) > 25 ? 8 : Math.abs(x) > 16 ? 13 : 15.5); form(c, () => { c.beginPath(); c.moveTo(x - 3, y + 1); c.lineTo(x + Math.sign(x) * 2, y - 6 - (k === 3 ? 3 : 0)); c.lineTo(x + 3, y + 1); c.closePath(); }, x, y - 2, 4, sh(shell, 0.1), { lw: 0.9, specA: 0.4 }); }); L.fx(g => { const R = mulberry32(8); for (let i = 0; i < (k === 3 ? 10 : 6); i++) { const x = (R() - 0.5) * 46, y = by - 8 + R() * 16, p = 0.6 + 0.4 * Math.sin(t * 2.4 + i); glow(g, x, y, 5.5, cy, 0.75 * p); glow(g, x, y, 1.6, '#FFFFFF', 0.9 * p); } }); }
      if (k === 3) { [-13, 0, 13].forEach((x, i) => form(c, () => { c.beginPath(); c.moveTo(x - 4, by - 14); c.lineTo(x, by - 26 - (i === 1 ? 7 : 0)); c.lineTo(x + 4, by - 14); c.closePath(); }, x, by - 18, 6, '#E4EAFF', { lw: 1, specA: 0.5, hi: '#FFFFFF' })); L.fx(g => { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = cy; g.lineWidth = 1.4; [-20, -6, 10, 22].forEach((x, i) => { const ph = (t * 0.6 + i * 0.27) % 1; g.globalAlpha = FA * (0.8 * (1 - ph)); g.beginPath(); g.moveTo(x, by + 14); g.lineTo(x, by + 14 + ph * 16); g.stroke(); glow(g, x, by + 14 + ph * 16, 3, cy, 0.8 * (1 - ph)); }); g.restore(); const s2 = Math.floor(t * 8); bolt(g, -36, by - 26, -50, by - 44, s2, cy, 7); bolt(g, 36, by - 26, 50, by - 44, s2 + 5, cy, 7); }); }
      both(c, () => { limb(c, -8, by - 13, -12, by - 26, 3.8, 3.2, sh(shell, 0.05), { tex: 'chitin', texA: 0.3 }); });
      [-1, 1].forEach(sx => eye(c, sx * 12.5, by - 30, 6.2, '#2FC9DD', { tall: 1.04, side: -sx, lid: k === 3 ? 0.18 : 0, skin: shell }));
      L.fx(g => [-1, 1].forEach(sx => glow(g, sx * 12.5, by - 30, 15, cy, 0.4 + k * 0.08)));
      mouth(c, 0, by + 2, 3.4); [-1, 1].forEach(sx => blush(c, sx * 13, by, 4.2));
    },
    // Michael: a sun sprite. A round, cat-faced cub of dawn light whose mane is a living corona of sun petals, riding a little
    // cloud; it grows into a solar paladin with wings of dawn, a shield of light, gold armour and a blazing sun disc behind it
    leo(c, k, t, L) {
      const fur = '#FFC979', furDk = '#E8863C', belly = '#FFF0D2', petA = '#FF9F2E', petB = '#FFD24A', petTip = '#FFF2C2', gold = '#F2C65A';
      const by = [20, 17, 14][k - 1], br = [16, 18, 20][k - 1], hr = [15.5, 16.5, 17.5][k - 1], hy = by - [22, 24, 26][k - 1], bob = Math.sin(t * 2.2) * 1.2, spin = t * 0.25;
      // a blazing sun disc behind the final form
      if (k === 3) L.back(g => { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(0, hy - 4); glow(g, 0, 0, 70, '#FFC24D', 0.5); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + spin * 0.6, L2 = (i % 2 ? 30 : 44) + 3 * Math.sin(t * 3 + i); g.save(); g.rotate(a); g.globalAlpha = FA * (i % 2 ? 0.35 : 0.55); blitSized(g, beamSprite('#FFD36B'), 22, -3.5, L2, 7); g.restore(); } ringLight(g, 0, 0, 33, 33, '#FFD36B', 0.7); g.restore(); });
      L.back(g => glow(g, 0, hy, hr * (2.4 + k * 0.3), '#FFE9A8', 0.35 + k * 0.08));
      // wings of dawn
      if (k >= 2) both(c, () => wing(c, -br * 0.55, by - br * 0.55, k === 3 ? 46 : 27, ['#FFFFFF', '#FFF0D6', '#FFC98A'], { n: k === 3 ? 8 : 6, rows: 3, spread: 0.85, flap: Math.sin(t * 3.4) * 0.07, seed: 12 }));
      if (k === 3) L.fx(g => both(g, () => { for (let i = 0; i < 4; i++) glow(g, -br * 0.55 - 46 * (0.62 + i * 0.1), by - br * 0.55 - 46 * (0.5 - i * 0.16), 8, '#FFE9A8', 0.35); }));
      // the tail: a soft tuft that becomes a comet
      const tw = Math.sin(t * 2.4) * 3, tp = bez([br * 0.7, by + br * 0.5], [br * 1.45, by + br * 0.6], [br * 1.6, by - 6 + tw], [br * 1.3, by - 15 + tw], 12), te = tp[tp.length - 1];
      form(c, ribbon(c, tp, 4.2, 2.6), br * 1.2, by, 14, fur, { dk: furDk, spec: false, lw: 1 });
      if (k === 1) { form(c, () => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, r = i % 2 ? 2.4 : 5.6; c.lineTo(te[0] + Math.cos(a) * r, te[1] - 2 + Math.sin(a) * r); } c.closePath(); }, te[0], te[1] - 2, 5.6, petB, { hi: '#FFFFFF', specA: 0.5, lw: 0.9, line: '#B8862A' }); L.fx(g => glow(g, te[0], te[1] - 2, 10, '#FFE37A', 0.7)); }
      else L.fx(g => { g.globalCompositeOperation = 'lighter'; flame(g, te[0], te[1] - 1, 0.25, 4.2, 14 + 3 * Math.sin(t * 8), Math.sin(t * 5) * 2, ...GOLDFIRE); glow(g, te[0], te[1] - 4, 9, '#FFE37A', 0.7); });
      // the corona: petals of sunlight round the head, outer and inner rings
      const petals = (n, r0, len, w, col, tip, off, seed) => { for (let i = 0; i < n; i++) { const a = (i + off) / n * TAU + (k >= 2 ? Math.sin(t * 1.5 + i) * 0.04 : 0), l = len * (0.9 + 0.2 * Math.sin(i * 2.7 + seed)); c.save(); c.translate(Math.cos(a) * r0, hy + Math.sin(a) * r0 * 0.96); c.rotate(a + Math.PI / 2); form(c, blob(c, [[-w * 0.5, 2], [-w * 0.55, -l * 0.45], [0, -l], [w * 0.55, -l * 0.45], [w * 0.5, 2]]), 0, -l * 0.45, l * 0.6, col, { hi: tip, dk: sh(col, -0.25), specA: 0.35, lw: 0.9, line: '#B8742A', soft: () => { const g = c.createLinearGradient(0, 0, 0, -l); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, rgba(tip, 0.85)); c.fillStyle = g; c.fillRect(-w, -l - 2, w * 2, l + 4); } }); c.restore(); } };
      const pn = [10, 14, 18][k - 1], pl = [11, 15, 19][k - 1];
      petals(pn, hr * 0.98, pl, [9, 9.5, 10][k - 1], petA, petTip, 0, 1);
      petals(pn, hr * 0.92, pl * 0.66, [7, 7.5, 8][k - 1], petB, '#FFFFFF', 0.5, 2);
      if (k >= 2) L.fx(g => { for (let i = 0; i < pn; i++) { const a = i / pn * TAU, r = hr * 0.98 + pl * 0.95; glow(g, Math.cos(a) * r, hy + Math.sin(a) * r * 0.96, 4 + k, '#FFE9A8', 0.35 + 0.25 * Math.sin(t * 3 + i * 1.3)); } });
      // body, sitting on a cloud
      form(c, ell(c, 0, by + bob * 0.3, br, br * 0.9), 0, by, br, fur, { tex: 'fine', texA: 0.25, dk: furDk, specA: 0.35, soft: () => { soft(c, 0, by + br * 0.25, br * 0.6, br * 0.55, 0, belly, 0.9); soft(c, 0, by + br * 0.85, br, br * 0.3, 0, '#8A4A20', 0.25); } });
      if (k === 3) { // paladin armour: pauldrons and a chest plate with a sun emblem
        both(c, () => plate(c, blob(c, [[-br * 0.45, by - br * 0.75], [-br * 1.02, by - br * 0.55], [-br * 1.05, by - br * 0.15], [-br * 0.55, by - br * 0.3]]), -br * 0.75, by - br * 0.45, 9, gold, { lw: 0.9 }));
        plate(c, blob(c, [[-10, by - br * 0.62], [10, by - br * 0.62], [9, by + 2], [0, by + 9], [-9, by + 2]]), 0, by - 3, 11, gold, { lw: 1, fili: () => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.moveTo(Math.cos(a) * 3, by - 3 + Math.sin(a) * 3); c.lineTo(Math.cos(a) * 6.5, by - 3 + Math.sin(a) * 6.5); } c.stroke(); } });
        gem(c, 0, by - 3.5, 3, '#FF9F43'); L.fx(g => glow(g, 0, by - 3.5, 10, '#FFC24D', 0.7));
      }
      const cw = [26, 32, 38][k - 1];
      form(c, cloud(c, 0, 34.5, cw, 6.5, 11, 0.38, 6), 0, 34.5, cw, '#FFF6F2', { dk: '#F6CDBF', hi: '#FFFFFF', specA: 0.4, lw: 1, line: '#D49A8E', soft: () => { soft(c, 0, 30, cw * 0.75, 4.5, 0, '#FFE3A8', 0.75); soft(c, 0, 39, cw * 0.8, 3, 0, '#FFB8C8', 0.35); } });
      L.fx(g => glow(g, 0, 33, cw * 1.1, '#FFE3A8', 0.3));
      [-1, 1].forEach(sx => { form(c, ell(c, sx * 7, 31.5, 5, 3.6), sx * 7, 31.5, 5, fur, { dk: furDk, specA: 0.35, lw: 1 }); c.strokeStyle = rgba(inkOf(fur), 0.8); c.lineWidth = 0.8; [-1.6, 0.4, 2.4].forEach(o => { c.beginPath(); c.moveTo(sx * 7 + o, 31.8); c.lineTo(sx * 7 + o, 34.2); c.stroke(); }); });
      // a shield of light (and at last a lance)
      if (k === 3) { limb(c, -br * 1.05, 34, -br * 0.9, -34, 2.6, 2, '#F2C65A', { lw: 0.8, line: '#8A5A12' }); form(c, blob(c, [[-br * 0.9, -46], [-br * 0.9 + 3.5, -36], [-br * 0.9, -32], [-br * 0.9 - 3.5, -36]]), -br * 0.9, -38, 6, '#FFF3C2', { hi: '#FFFFFF', specA: 0.7, lw: 0.8, line: '#B8862A' }); L.fx(g => { glow(g, -br * 0.9, -38, 14, '#FFE37A', 0.8); star4(g, -br * 0.9, -44, 2, '#FFFFFF', 0.6 + 0.4 * Math.sin(t * 4)); }); }
      if (k >= 2) { const sx = br * 0.95, sy = by + 3, sr = k === 3 ? 12 : 9.5; plate(c, ell(c, sx, sy, sr, sr * 1.1), sx, sy, sr, gold, { lw: 1 }); form(c, ell(c, sx, sy, sr * 0.76, sr * 0.84), sx, sy, sr * 0.8, '#FFF8E0', { hi: '#FFFFFF', dk: '#F2C66A', specA: 0.6, lw: 0.8, line: '#B8862A', soft: () => { c.fillStyle = '#FFC24D'; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? sr * 0.22 : sr * 0.5; c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } c.closePath(); c.fill(); orb(c, sx, sy, sr * 0.2, sr * 0.2, '#FFF3C2', { lw: 0, specA: 0.7 }); } }); L.fx(g => { glow(g, sx, sy, sr * 1.6, '#FFE37A', 0.35 + 0.15 * Math.sin(t * 2.6)); }); }
      // the head: big, round and sunny
      both(c, sd => { form(c, blob(c, [[-hr * 0.42, hy - hr * 0.72], [-hr * 0.78, hy - hr * 1.22], [-hr * 0.98, hy - hr * 0.52]]), -hr * 0.74, hy - hr * 0.8, 7, fur, { dk: furDk, specA: 0.3, lw: 1 }); form(c, blob(c, [[-hr * 0.55, hy - hr * 0.72], [-hr * 0.76, hy - hr * 1.05], [-hr * 0.88, hy - hr * 0.6]]), -hr * 0.74, hy - hr * 0.8, 4, '#FFB3A8', { lw: 0, spec: false }); L.fx(g => { glow(g, -hr * 0.78 * sd, hy - hr * 1.24, 5, '#FFE37A', 0.8); glow(g, -hr * 0.78 * sd, hy - hr * 1.24, 1.6, '#FFFFFF', 0.9); }); });
      form(c, ell(c, 0, hy, hr, hr * 0.92), 0, hy, hr, fur, { tex: 'fine', texA: 0.22, dk: furDk, specA: 0.42, soft: () => { soft(c, 0, hy + hr * 0.45, hr * 0.7, hr * 0.38, 0, belly, 0.85); soft(c, 0, hy - hr * 0.6, hr * 0.5, hr * 0.2, 0, '#FFFFFF', 0.3); } });
      // the sun mark on the brow: a dot, a little sun, a jewel
      if (k === 1) { orb(c, 0, hy - hr * 0.6, 1.6, 1.6, petB, { lw: 0.6, line: '#B8862A', specA: 0.7 }); L.fx(g => glow(g, 0, hy - hr * 0.6, 5, '#FFE37A', 0.7)); }
      else { c.fillStyle = metalG(c, -4, 0, 4, 0, gold); c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 1.6 : 3.6; c.lineTo(Math.cos(a) * r, hy - hr * 0.6 + Math.sin(a) * r); } c.closePath(); c.fill(); c.lineWidth = 0.6; c.strokeStyle = '#8A5A12'; c.stroke(); if (k === 3) gem(c, 0, hy - hr * 0.62, 1.8, '#FF9F43'); L.fx(g => glow(g, 0, hy - hr * 0.6, 8, '#FFE37A', 0.6)); }
      [-1, 1].forEach(sx => eye(c, sx * hr * 0.39, hy - hr * 0.02, hr * 0.3, '#E8902A', { side: -sx, cute: true, irisK: 1.05, tall: 1.12, line: '#5A2E10' }));
      L.fx(g => [-1, 1].forEach(sx => star4(g, sx * hr * 0.39 - hr * 0.08, hy - hr * 0.13, 0.9, '#FFFFFF', 0.85)));
      form(c, blob(c, [[-2.2, hy + hr * 0.3], [2.2, hy + hr * 0.3], [0, hy + hr * 0.44]]), 0, hy + hr * 0.35, 2.4, '#FF8FA0', { specA: 0.6, lw: 0.7, line: '#A8505A' });
      mouth(c, 0, hy + hr * 0.5, 2);
      [-1, 1].forEach(sx => blush(c, sx * hr * 0.62, hy + hr * 0.3, 3.8, '#FF8A90'));
      // a crown of light on the final form
      if (k === 3) L.fx(g => { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.32, r0 = hr * 1.02; g.save(); g.translate(Math.cos(a) * r0, hy + Math.sin(a) * r0); g.rotate(a + Math.PI / 2); g.globalAlpha = FA * 0.9; g.fillStyle = '#FFF3C2'; g.beginPath(); g.moveTo(-2, 0); g.lineTo(0, -(i === 2 ? 9 : 6)); g.lineTo(2, 0); g.closePath(); g.fill(); g.restore(); } g.restore(); glow(g, 0, hy - hr * 1.15, 14, '#FFE37A', 0.6); });
    },
    // Gabriel: a smooth, porcelain bird of the dawn. A round rosebud chick grows into a tall seraph bird whose arched wings
    // pour down in long streamers, with pearl scales on the chest and wings, flowing tail fins and glowing rose-gold marks
    virgo(c, k, t, L) {
      const pearl = '#F8F3FC', pdk = '#BBA6DC', roseC = '#FFB3D9', roseDk = '#C96A9E', gold = '#F2C65A', mark = k === 1 ? '#D98AB4' : '#E07AAE', sway = Math.sin(t * 2) * 0.05;
      const glaze = (x, y, r) => () => { soft(c, x - r * 0.3 * MIR, y - r * 0.35, r * 0.55, r * 0.22, -0.5 * MIR, '#FFFFFF', 0.5); soft(c, x + r * 0.35 * MIR, y + r * 0.2, r * 0.6, r * 0.3, 0.4, '#FFC2E2', 0.22); soft(c, x - r * 0.1, y + r * 0.55, r * 0.7, r * 0.25, 0, '#A8E6FF', 0.18); };
      const dotEye = (x, y, r) => { form(c, ell(c, x, y, r * 0.86, r), x, y, r, '#2A1E34', { hi: '#6A5A84', dk: '#08040E', spec: false, lw: 0 }); soft(c, x, y + r * 0.55, r * 0.6, r * 0.26, 0, '#C9A8FF', 0.55); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(x - r * 0.28 * MIR, y - r * 0.36, r * 0.32, r * 0.37, -0.3 * MIR, 0, TAU); c.fill(); c.globalAlpha = 0.9; c.beginPath(); c.arc(x + r * 0.3 * MIR, y + r * 0.36, r * 0.14, 0, TAU); c.fill(); c.globalAlpha = 1; };
      const beak = (x, y, w) => { form(c, ell(c, x, y + w * 0.82, w * 0.7, w * 0.58), x, y + w * 0.82, w * 0.7, '#8A2E52', { spec: false, lw: 0.7, line: '#5A1A34' }); orb(c, x, y + w * 1.08, w * 0.4, w * 0.22, '#FF8FB0', { spec: false, lw: 0 });
        form(c, blob(c, [[x - w * 1.0, y - w * 0.05], [x + w * 1.0, y - w * 0.05], [x + w * 0.6, y + w * 0.4], [x, y + w * 0.56], [x - w * 0.6, y + w * 0.4]]), x, y + w * 0.18, w, '#FFB86A', { specA: 0.6, lw: 0.8, line: '#B8642A' });
        form(c, blob(c, [[x - w * 0.66, y + w * 1.2], [x + w * 0.66, y + w * 1.2], [x, y + w * 1.62]]), x, y + w * 1.32, w * 0.6, '#F2A050', { spec: false, lw: 0.7, line: '#B8642A' }); };
      const pearlScales = (a) => { c.globalAlpha = a; c.fillStyle = tex('scale'); c.fillRect(-60, -80, 120, 130); c.globalAlpha = 1; };
      if (k === 1) {
        both(c, sd => { c.save(); c.translate(-15, 12); c.rotate(-0.5 + sway); form(c, blob(c, [[0, -6], [-9, -2], [-13, 10], [-6, 14], [2, 6]]), -5, 4, 10, pearl, { dk: pdk, specA: 0.5, lw: 1, soft: glaze(-5, 4, 10) }); c.restore(); });
        [-1, 1].forEach(sx => { form(c, blob(c, [[sx * 4, 34], [sx * 9, 34], [sx * 12, 39], [sx * 1, 39]]), sx * 7, 37, 6, '#FFB07A', { specA: 0.4, lw: 0.9 }); });
        [-10, 0, 10].forEach((x, i) => { c.save(); c.translate(x * 0.6, 28); c.rotate(x * 0.04 + sway); form(c, blob(c, [[-3.5, 0], [3.5, 0], [1, 9 + (i === 1 ? 3 : 0)], [-1, 9 + (i === 1 ? 3 : 0)]]), 0, 4, 6, roseC, { dk: roseDk, specA: 0.4, lw: 0.9 }); c.restore(); });
        form(c, ell(c, 0, 16, 17, 19), 0, 16, 19, pearl, { dk: pdk, specA: 0.55, spR: 0.4, soft: () => { glaze(0, 16, 19)(); c.save(); c.beginPath(); c.ellipse(0, 18, 9, 10, 0, 0, TAU); c.clip(); pearlScales(0.28); c.restore(); } });
        form(c, ell(c, 0, -9, 13.5, 12.5), 0, -9, 13.5, pearl, { dk: pdk, specA: 0.55, spR: 0.4, soft: glaze(0, -9, 13.5) });
        leaf(c, -3, -21, 6, -2.5, '#6BAF7A'); leaf(c, 2, -21.5, 5.5, -0.7, '#6BAF7A'); rose(c, 0, -23, 4.2, '#FFB3CF');
        [-1, 1].forEach(sx => dotEye(sx * 5.8, -10.5, 4));
        beak(0, -6.5, 3.4);
        [-1, 1].forEach(sx => blush(c, sx * 9, -5, 3.6));
        return;
      }
      const s = k === 3 ? 1 : 0.84, ty = k === 3 ? 0 : 4;
      c.save(); c.translate(0, 40); c.scale(s, s); c.translate(0, -40 + ty / s);
      // wings: an arch from the shoulder, smooth hanging sheets beneath it, and a long streamer down to the ground
      const arm = bez([-8, -32], [-20, -68], [-54, -62], [-51, -30], 12).concat(k === 3 ? bez([-51, -30], [-50, -16], [-46, -8], [-54, 2], 8).slice(1) : bez([-51, -30], [-49, -4], [-30, 12], [-44, 28], 12).slice(1));
      const aw = u => u < 0.45 ? 10 + Math.sin(u / 0.45 * Math.PI) * 6 : Math.max(1.2, 10 * Math.pow(1 - (u - 0.45) / 0.55, 1.2));
      // the final form unfolds a second pair of wings beneath the first, sweeping out and down
      if (k === 3) { const arm2 = bez([-8, -2], [-22, -13], [-40, -9], [-42, 7], 10).concat(bez([-42, 7], [-43, 17], [-35, 25], [-41, 35], 8).slice(1));
        const aw2 = u => u < 0.5 ? 6 + Math.sin(u / 0.5 * Math.PI) * 3 : Math.max(1, 6 * Math.pow(1 - (u - 0.5) / 0.5, 1.2));
        both(c, sd => { c.save(); c.rotate(-sway * 0.5);
          [[0.24, 13], [0.36, 16]].forEach(([u, len], i) => { const q = arm2[Math.floor(u * (arm2.length - 1))], a = Math.PI / 2 + 0.22 - i * 0.18; c.save(); c.translate(q[0], q[1] + 3); c.rotate(a - Math.PI / 2); form(c, blob(c, [[-5, -2], [5, -2], [4.2, len * 0.5], [1, len], [-4, len * 0.55]]), 0, len * 0.45, len * 0.5, mix(pearl, '#D9B8FF', 0.32 + i * 0.12), { dk: mix(pdk, '#7A62D0', 0.3), specA: 0.42, lw: 0.9, soft: () => { const g = c.createLinearGradient(0, 0, 0, len); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, rgba('#A8E6FF', 0.65)); c.fillStyle = g; c.fillRect(-8, 0, 16, len + 2); } }); c.restore(); });
          form(c, ribbon(c, arm2, 0, 0, aw2), -30, 6, 26, mix(pearl, '#E8DCFF', 0.4), { dk: pdk, specA: 0.45, spR: 0.25, soft: () => { const g = c.createLinearGradient(-10, -20, -60, 40); g.addColorStop(0, 'rgba(217,184,255,0)'); g.addColorStop(0.5, rgba('#D9B8FF', 0.55)); g.addColorStop(1, rgba('#A8E6FF', 0.85)); c.fillStyle = g; c.fillRect(-56, -20, 54, 60); c.save(); c.beginPath(); c.ellipse(-26, -9, 9, 4.6, -0.15, 0, TAU); c.clip(); pearlScales(0.32); c.restore(); c.strokeStyle = mark; c.lineWidth = 1.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(-15, -8); c.quadraticCurveTo(-28, -14, -38, -6); c.moveTo(-42, 8); c.quadraticCurveTo(-41, 16, -39, 22); c.stroke(); soft(c, -28, -11, 9, 2.6, -0.1, '#FFFFFF', 0.4); } });
          const tip2 = arm2[arm2.length - 1];
          L.fx(g => { glow(g, tip2[0] * sd, tip2[1], 7, '#D9B8FF', 0.55); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#E8D8FF'; g.lineCap = 'round'; const p2 = 0.6 + 0.4 * Math.sin(t * 2.4 + 1 + sd); [[3, 0.12], [1.1, 0.55]].forEach(([w, a]) => { g.globalAlpha = FA * (a * p2); g.lineWidth = w; g.beginPath(); g.moveTo(-15 * sd, -8); g.quadraticCurveTo(-28 * sd, -14, -38 * sd, -6); g.stroke(); }); g.restore(); });
          c.restore(); });
      }
      both(c, sd => {
        c.save(); c.rotate(sway * 0.6);
        (k === 3 ? [[0.18, 20], [0.3, 25], [0.42, 22]] : [[0.16, 28], [0.26, 36], [0.36, 34]]).forEach(([u, len], i) => { const q = arm[Math.floor(u * (arm.length - 1))], a = Math.PI / 2 + 0.3 - i * 0.16; c.save(); c.translate(q[0], q[1] + 4); c.rotate(a - Math.PI / 2); form(c, blob(c, [[-8, -2], [8, -2], [7, len * 0.5], [1.5, len], [-6, len * 0.55]]), 0, len * 0.45, len * 0.5, mix(pearl, roseC, 0.25 + i * 0.12), { dk: mix(pdk, roseDk, 0.3), specA: 0.45, lw: 0.9, soft: () => { const g = c.createLinearGradient(0, 0, 0, len); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, rgba(k === 3 ? '#A8E6FF' : '#D9B8FF', 0.6)); c.fillStyle = g; c.fillRect(-8, 0, 16, len + 2); } }); c.restore(); });
        form(c, ribbon(c, arm, 0, 0, aw), -34, -18, 34, pearl, { dk: pdk, specA: 0.5, spR: 0.25, soft: () => { const g = c.createLinearGradient(0, -20, 0, 40); g.addColorStop(0, 'rgba(255,194,226,0)'); g.addColorStop(0.55, rgba(roseC, 0.55)); g.addColorStop(1, rgba(k === 3 ? '#A8E6FF' : '#D9B8FF', 0.85)); c.fillStyle = g; c.fillRect(-60, -20, 60, 64); c.save(); c.beginPath(); c.ellipse(-26, -52, 18, 10, -0.3, 0, TAU); c.clip(); pearlScales(0.35); c.restore(); c.strokeStyle = mark; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-16, -52); c.quadraticCurveTo(-30, -63, -44, -52); c.moveTo(-22, -47); c.quadraticCurveTo(-34, -55, -42, -46); c.moveTo(-50, -32); c.quadraticCurveTo(-45, -14, -46, 4); c.stroke(); soft(c, -32, -60, 14, 4, -0.2, '#FFFFFF', 0.45); } });
        const tip = arm[arm.length - 1];
        if (k === 3) L.fx(g => { glow(g, tip[0] * sd, tip[1], 10, '#A8E6FF', 0.6); for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; star4(g, (tip[0] + Math.sin(i * 4) * 3) * sd, tip[1] - 30 + ph * 28, 1, '#FFFFFF', Math.sin(ph * Math.PI) * 0.8); } });
        if (k === 3) L.fx(g => { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#FFD6F0'; g.lineCap = 'round'; const p = 0.6 + 0.4 * Math.sin(t * 2.4 + sd); [[3, 0.14], [1.2, 0.6]].forEach(([w, a]) => { g.globalAlpha = FA * (a * p); g.lineWidth = w; g.beginPath(); g.moveTo(-16 * sd * s, Y(-52)); g.quadraticCurveTo(-30 * sd * s, Y(-63), -44 * sd * s, Y(-52)); g.stroke(); }); g.restore(); });
        c.restore();
      });
      // tail fins flowing beneath the body
      [[-17, 20, -0.65], [17, 20, 0.65], [-10, 28, -0.32], [10, 28, 0.32], [0, 34, 0]].forEach(([x, len, a], i) => { c.save(); c.translate(x * 0.5, 9); c.rotate(a + Math.sin(t * 2.4 + i) * 0.05); form(c, blob(c, [[-6, 0], [6, 0], [5, len * 0.5], [len * 0.14, len], [0, len * 0.9], [-5, len * 0.5]]), 0, len * 0.45, len * 0.55, roseC, { dk: roseDk, hi: '#FFFFFF', specA: 0.45, lw: 0.9, soft: () => { const g = c.createLinearGradient(0, 0, 0, len); g.addColorStop(0, rgba(pearl, 0.9)); g.addColorStop(0.45, rgba(pearl, 0)); g.addColorStop(1, rgba(gold, 0.75)); c.fillStyle = g; c.fillRect(-6, 0, 12, len + 2); c.strokeStyle = rgba(mark, 0.8); c.lineWidth = 1; c.beginPath(); c.moveTo(0, 3); c.quadraticCurveTo(2, len * 0.45, 0, len * 0.8); c.stroke(); } }); c.restore(); });
      if (k === 3) L.fx(g => { glow(g, 0, 40, 12, gold, 0.5); });
      // the body: smooth porcelain with a pearl-scaled breast
      const torso = blob(c, [[0, -42], [9, -33], [12, -14], [8, 5], [0, 15], [-8, 5], [-12, -14], [-9, -33]]);
      form(c, torso, 0, -14, 24, pearl, { dk: pdk, specA: 0.6, spR: 0.3, soft: () => { glaze(0, -14, 24)(); c.save(); c.beginPath(); c.ellipse(0, -16, 8, 13, 0, 0, TAU); c.clip(); pearlScales(0.42); c.restore(); c.strokeStyle = mark; c.lineWidth = 1.3; c.lineCap = 'round'; [-1, 1].forEach(sx => { c.beginPath(); c.moveTo(sx * 3, -34); c.quadraticCurveTo(sx * 10, -24, sx * 6, -10); c.stroke(); }); } });
      gem(c, 0, -28, k === 3 ? 3.4 : 2.6, '#FF8FC0'); L.fx(g => glow(g, 0, Y(-28), 9, '#FF8FC0', 0.6));
      // the crest: three smooth plumes swept back above the head
      [[-0.6, 15], [0, 19], [0.6, 15]].forEach(([a, len], i) => { c.save(); c.translate(0, -65); c.rotate(a * 0.6 + Math.sin(t * 2 + i) * 0.04); form(c, blob(c, [[-3, 2], [3, 2], [2.5, -len * 0.5], [len * 0.15, -len], [-2.5, -len * 0.5]]), 0, -len * 0.45, len * 0.5, i === 1 ? gold : roseC, { dk: i === 1 ? '#B9861A' : roseDk, hi: '#FFFFFF', specA: 0.5, lw: 0.9 }); c.restore(); });
      form(c, ribbon(c, bez([0, -38], [0, -42], [0, -46], [0, -50], 6), 10.5, 9.5), 0, -44, 9, pearl, { dk: pdk, specA: 0.4, lw: 1 });
      form(c, ell(c, 0, -57, 12, 11), 0, -57, 12, pearl, { dk: pdk, specA: 0.6, spR: 0.4, soft: () => { glaze(0, -57, 12)(); soft(c, 0, -50, 8, 3.5, 0, '#FFFFFF', 0.4); } });
      if (k === 3) { [[-5.5, -67, 2.6, '#FF8FB8'], [0, -69.5, 3, '#FFC2DC'], [5.5, -67, 2.6, '#FF9EC6']].forEach(([x, y, r, col]) => rose(c, x, y, r, col)); }
      [-1, 1].forEach(sx => dotEye(sx * 5.6, -58.5, 3.5));
      beak(0, -55.5, 3);
      [-1, 1].forEach(sx => blush(c, sx * 8.4, -53.5, 3.2));
      c.restore();
      const Y = (v) => 40 + (v - 40 + ty / s) * s;
      if (k === 3) L.fx(g => { glow(g, 0, Y(-58), 14, '#FFF0FA', 0.5); ringLight(g, 0, Y(-80), 12, 3.6, '#FFD6F0', 0.95); });
      L.fx(g => { for (let i = 0; i < 4 + k * 2; i++) { const ph = (t * 0.22 + i / (4 + k * 2)) % 1, x = -46 + i * (92 / (3 + k * 2)) + Math.sin(t + i) * 5, y = -60 + ph * 96; g.save(); g.globalAlpha = FA * (Math.sin(ph * Math.PI) * 0.9); g.translate(x, y); g.rotate(t * 2 + i); g.fillStyle = i % 2 ? '#FFB3D9' : '#FFE0EE'; g.beginPath(); g.ellipse(0, 0, 3.2, 1.7, 0, 0, TAU); g.fill(); g.restore(); } });
    },
    // Uriel: a fluffy celestial owl of the balance. One wing of starry night and one of golden day, a sun-gold eye and a
    // moon-silver eye, and the scales of judgement floating overhead with the sun in one pan and the moon in the other.
    // A round owlet grows into a great seer whose third eye opens on its brow
    libra(c, k, t, L) {
      const cream = '#FFF4DE', fawn = '#E2B074', fawnDk = '#9A6634', disc = '#FFF9EE', gold = '#F2C65A', sun = '#FFB020', moon = '#8FCBFF', sapph = '#3A7AFF';
      const S = [1, 1.13, 1.28][k - 1], by = 40 - 24 * S, br = 21 * S, hr = 17 * S, hy = by - 17 * S, flap = Math.sin(t * 2.6) * 0.06;
      if (k === 3) L.back(g => { glow(g, 0, hy, 52, '#FFE9A8', 0.45); ringLight(g, 0, hy - 2, 30, 30, '#FFD36B', 0.85); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 0.2; star4(g, Math.cos(a) * 30, hy - 2 + Math.sin(a) * 30, 1, '#FFFFFF', 0.5 + 0.5 * Math.sin(t * 3 + i)); } });
      // wings: night on the left, day on the right
      const WS = [17, 31, 52][k - 1], sp = [0.2, 0.68, 0.95][k - 1], night = ['#1C2256', '#2C3A84', '#5266C8'], day = ['#FFF4DC', '#F6D592', '#E9A84A'];
      wing(c, -br * 0.62, by - br * 0.25, WS, night, { n: 7, rows: 3, spread: sp, flap, seed: 3, line: '#0E1236' });
      c.save(); c.scale(-1, 1); MIR = -MIR; wing(c, -br * 0.62, by - br * 0.25, WS, day, { n: 7, rows: 3, spread: sp, flap, seed: 5 }); MIR = -MIR; c.restore();
      L.fx(g => { const R = mulberry32(11), cx = -br * 0.62 - WS * 0.45, cy = by - br * 0.25 - WS * (0.1 + sp * 0.25); for (let i = 0; i < 4 + k * 4; i++) star4(g, cx + (R() - 0.5) * WS * 0.8, cy + (R() - 0.3) * WS * 0.6, 0.7 + R() * 0.6, '#BFD8FF', 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i * 1.7))); if (k >= 2) glow(g, br * 0.62 + WS * 0.45, by - br * 0.25 - WS * 0.25, WS * 0.5, '#FFE9A8', 0.25); });
      // the body: one soft fluffy mass, a pale speckled chest, gentle barring
      fluffy(c, [[0, by, br, br * 0.95, 3.4 * S, 1], [0, hy, hr * 1.04, hr * 0.92, 3 * S, 2]], 0, (by + hy) / 2, br * 1.25, fawn, { tex: 'fur', texA: 0.5, dk: fawnDk, hi: '#FFF0D6', specA: 0.22, lw: 1.1, line: '#6A4220', lean: 0.7, soft: () => {
        soft(c, 0, by + br * 0.18, br * 0.62, br * 0.72, 0, cream, 0.95);
        c.strokeStyle = rgba(fawnDk, 0.5); c.lineWidth = 1 * S; c.lineCap = 'round'; const R = mulberry32(5); for (let row = 0; row < 4; row++) for (let j = -2; j <= 2; j++) { const x = j * 5.2 * S + (row % 2) * 2.6 * S + (R() - 0.5) * S, y = by - br * 0.1 + row * 5 * S; if (Math.abs(x) > br * 0.5 - row * S) continue; c.beginPath(); c.moveTo(x - 1.6 * S, y - 1 * S); c.quadraticCurveTo(x, y + 0.8 * S, x + 1.6 * S, y - 1 * S); c.stroke(); }
        soft(c, 0, by + br * 0.9, br, br * 0.3, 0, '#3A1E08', 0.3); soft(c, -br * 0.45 * MIR, hy - hr * 0.6, hr * 0.5, hr * 0.2, -0.4 * MIR, '#FFFFFF', 0.3); } });
      // little feet
      [-1, 1].forEach(sx => { [-1.6, 0, 1.6].forEach((o, i) => form(c, ell(c, sx * 6.5 * S + o * S, by + br * 0.86 + 1.6 * S - (i === 1 ? 0.6 : 0), 1.4 * S, 2.4 * S), sx * 6.5 * S + o * S, by + br * 0.86 + 1.6 * S, 2.4 * S, '#F2A85A', { specA: 0.4, lw: 0.7, line: '#8A4A1A' })); });
      // ear tufts
      both(c, () => { [[0, 9], [0.32, 7]].forEach(([da, len]) => { c.save(); c.translate(-hr * 0.58, hy - hr * 0.68); c.rotate(-0.55 - da); form(c, blob(c, [[-2.6 * S, 1], [2.6 * S, 1], [1, -len * S * 0.6], [-0.4, -len * S * (k === 3 ? 1.25 : 1)], [-1.8 * S, -len * S * 0.5]]), 0, -len * S * 0.4, len * S * 0.5, da ? fawn : fawnDk, { hi: '#FFE6BE', specA: 0.2, lw: 0.9, line: '#6A4220' }); c.restore(); }); });
      // the facial disc, radiating fine feathers
      const dsk = blob(c, [[0, hy - hr * 0.4], [hr * 0.46, hy - hr * 0.64], [hr * 0.9, hy - hr * 0.2], [hr * 0.82, hy + hr * 0.42], [0, hy + hr * 0.72], [-hr * 0.82, hy + hr * 0.42], [-hr * 0.9, hy - hr * 0.2], [-hr * 0.46, hy - hr * 0.64]]);
      form(c, dsk, 0, hy, hr * 0.9, disc, { dk: '#EAD2B0', hi: '#FFFFFF', specA: 0.3, lw: 1, line: k === 3 ? '#B8862A' : '#B88A5A', soft: () => { c.strokeStyle = 'rgba(160,110,60,.28)'; c.lineWidth = 0.6; [-1, 1].forEach(sx => { const ex = sx * hr * 0.4, ey = hy; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; c.beginPath(); c.moveTo(ex + Math.cos(a) * hr * 0.36, ey + Math.sin(a) * hr * 0.36); c.lineTo(ex + Math.cos(a) * hr * 0.62, ey + Math.sin(a) * hr * 0.62); c.stroke(); } soft(c, ex, ey, hr * 0.4, hr * 0.4, 0, '#C08A50', 0.3); }); } });
      if (k === 3) { c.save(); dsk(); c.lineWidth = 1.6; c.strokeStyle = metalG(c, -hr, 0, hr, 0, gold); c.stroke(); c.restore(); }
      // eyes of the sun and the moon
      eye(c, -hr * 0.4, hy, hr * 0.31, sun, { side: 1, cute: true, irisK: 1.04, tall: 1.06, line: '#4A2A10' });
      eye(c, hr * 0.4, hy, hr * 0.31, moon, { side: -1, cute: true, irisK: 1.04, tall: 1.06, line: '#1A2A50' });
      if (k >= 2) L.fx(g => { glow(g, -hr * 0.4, hy, hr * 0.55, sun, 0.25 + k * 0.08); glow(g, hr * 0.4, hy, hr * 0.55, moon, 0.25 + k * 0.08); });
      form(c, blob(c, [[-2.4 * S, hy + hr * 0.16], [2.4 * S, hy + hr * 0.16], [1.2 * S, hy + hr * 0.38], [0, hy + hr * 0.5], [-1.2 * S, hy + hr * 0.38]]), 0, hy + hr * 0.3, 3 * S, '#E8C27A', { hi: '#FFF0C8', specA: 0.6, lw: 0.8, line: '#6A4A1A' });
      [-1, 1].forEach(sx => blush(c, sx * hr * 0.6, hy + hr * 0.38, 3.4 * S, '#FF9AA8'));
      // the third eye opens on the brow
      if (k >= 2) { eye(c, 0, hy - hr * 0.5, 2.1 * S, sapph, { tall: 1.55, cute: true, irisK: 1.05, line: '#1A2A60' }); L.fx(g => { glow(g, 0, hy - hr * 0.5, 9 * S, '#7FB0FF', 0.7); star4(g, 0, hy - hr * 0.5 - 4.5 * S, 0.9, '#FFFFFF', 0.6 + 0.4 * Math.sin(t * 3)); }); }
      // the scales: a pendant on the owlet, then floating over the head with the sun and the moon in the pans
      const pan = (x, y, r, orbCol) => { c.strokeStyle = metalG(c, x - r, y, x + r, y, gold); c.lineWidth = 0.8; c.setLineDash([1.4, 1.1]); c.beginPath(); c.moveTo(x, y - r * 1.5); c.lineTo(x - r * 0.9, y); c.moveTo(x, y - r * 1.5); c.lineTo(x + r * 0.9, y); c.stroke(); c.setLineDash([]); plate(c, () => { c.beginPath(); c.moveTo(x - r, y); c.quadraticCurveTo(x, y + r * 0.9, x + r, y); c.closePath(); }, x, y + r * 0.2, r, gold, { lw: 0.8 }); orb(c, x, y - r * 0.32, r * 0.42, r * 0.42, orbCol, { hi: '#FFFFFF', specA: 0.8, lw: 0.6, line: sh(orbCol, -0.5) }); L.fx(g => glow(g, x, y - r * 0.32, r * 1.5, orbCol, 0.75)); };
      if (k === 1) { c.strokeStyle = gold; c.lineWidth = 0.8; c.beginPath(); c.arc(0, hy + hr * 0.45, 9, 0.25, Math.PI - 0.25); c.stroke(); const py = by + 2; plate(c, () => { c.beginPath(); c.rect(-6.5, py - 4.6, 13, 1.4); }, 0, py - 4, 6.5, gold, { lw: 0.6 }); orb(c, 0, py - 6, 1.6, 1.6, sapph, { lw: 0.6, specA: 0.8 }); pan(-6, py + 1.5, 3, sun); pan(6, py + 1.5, 3, moon); }
      else { const tilt = Math.sin(t * 1.4) * (k === 3 ? 3 : 2.2), X = k === 3 ? 30 : 22, Y = hy - hr * 1.32 - (k === 3 ? 10 : 6), pr = k === 3 ? 7 : 5.2;
        plate(c, () => { c.beginPath(); c.moveTo(-X, Y - tilt - 1); c.lineTo(X, Y + tilt - 1); c.lineTo(X, Y + tilt + 1.4); c.lineTo(-X, Y - tilt + 1.4); c.closePath(); }, 0, Y, X, gold, { lw: 0.7 });
        plate(c, blob(c, [[0, Y - 7 * S], [3.2 * S, Y - 2], [0, Y + 2.5 * S], [-3.2 * S, Y - 2]]), 0, Y - 2, 5, gold, { lw: 0.8 }); gem(c, 0, Y - 2.4, 2 * S, sapph); L.fx(g => glow(g, 0, Y - 2.4, 8 * S, '#7FB0FF', 0.6));
        pan(-X, Y - tilt + pr * 1.6, pr, sun); pan(X, Y + tilt + pr * 1.6, pr, moon); }
      // drifting feathers of light
      if (k >= 2) L.fx(g => { for (let i = 0; i < 2 + k * 2; i++) { const ph = (t * 0.2 + i / (2 + k * 2)) % 1, x = -44 + i * (88 / (1 + k * 2)) + Math.sin(t + i) * 4, y = -54 + ph * 92; g.save(); g.globalAlpha = FA * (Math.sin(ph * Math.PI) * 0.85); g.translate(x, y); g.rotate(Math.sin(t * 1.5 + i) * 0.8); g.fillStyle = i % 2 ? '#FFE9A8' : '#C9D8FF'; g.beginPath(); g.ellipse(0, 0, 4, 1.5, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.stroke(); g.restore(); } });
    },
    // Asmodeus: a round obsidian scorpion veined with embers, trailing red smoke, with a burning stinger
    scorpio(c, k, t, L) {
      const ob = '#1E1820', obHi = '#6A5A72', red = '#FF3B4E', by = 16, sway = Math.sin(t * 2.6) * 3;
      if (k >= 2) L.back(g => { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < (k === 3 ? 12 : 7); i++) { const ph = (t * 0.4 + i * 0.19) % 1, x = Math.sin(i * 9.7) * 34, y = by + 6 - ph * 60; g.globalAlpha = FA * (Math.sin(ph * Math.PI) * 0.5); const s2 = 10 + ph * 16; blitSized(g, puffSprite('rgba(200,20,40,'), x - s2, y - s2, s2 * 2, s2 * 2); } });
      const tp = bez([10, by - 2], [46, by - 12], [40, by - 62 + sway], [4, by - 64 + sway], 10);
      tp.forEach(([x, y], i) => { const r = (9.5 - i * 0.55) * (1 + k * 0.06); orb(c, x, y, r, r * 0.9, ob, { tex: 'chitin', texA: 0.4, hi: obHi, specA: 0.5, lw: 1.1 }); });
      L.fx(g => { g.save(); g.globalCompositeOperation = 'lighter'; tp.forEach(([x, y], i) => { const r = (9.5 - i * 0.55) * (1 + k * 0.06), p = 0.6 + 0.4 * Math.sin(t * 3 - i * 0.6); g.globalAlpha = FA * ((k === 1 ? 0.45 : 0.75) * p); g.strokeStyle = red; g.lineWidth = 1.3; g.beginPath(); g.arc(x, y, r * 0.86, 0.4, 2.5); g.stroke(); if (k >= 2) { g.globalAlpha = FA * (0.25 * p); blitSized(g, glowSprite(red), x - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2); } }); g.restore(); });
      const [sx0, sy0] = tp[tp.length - 1]; horn(c, sx0 - 2, sy0 + 2, 14 + k * 3, 2.3, -1.4, 7, '#B8202E', { lw: 1 }); L.fx(g => { glow(g, sx0 - 7, sy0 + 10, 14 + k * 2, red, 0.85); glow(g, sx0 - 7, sy0 + 11, 4, '#FFFFFF', 0.8); });
      if (k === 3) L.fx(g => { g.globalCompositeOperation = 'lighter'; for (let i = 2; i < tp.length; i += 2) flame(g, tp[i][0] + 4, tp[i][1] - 5, 0.6, 3, 11 + 2 * Math.sin(t * 8 + i), 0, 'rgba(120,10,20,.85)', '#FF3B4E', 'rgba(255,190,170,0)'); });
      for (let i = 3; i >= 0; i--) both(c, () => { const y0 = by + 6 + i * 3.5, kx = -30 - i * 1.5, ky = by - 2 + i * 3, tx = -38 - i * 2.4, ty = 38; limb(c, -18, y0, kx, ky, 4.4, 3.6, sh(ob, 0.08), { tex: 'chitin', texA: 0.3 }); limb(c, kx, ky, tx, ty, 3.6, 1.2, sh(ob, 0.12), { tex: 'chitin', texA: 0.3 }); });
      both(c, s => { limb(c, -14, by + 4, -26, by + 8, 6.5, 5.6, ob, { tex: 'chitin', texA: 0.35 }); limb(c, -26, by + 8, -34, by - 1, 5.6, 5, ob, { tex: 'chitin', texA: 0.35 }); const z = [10, 12.5, 15][k - 1]; c.save(); c.translate(-40, by - 6); c.rotate(-0.75 + Math.sin(t * 3 + s) * 0.08);
        const cl = blob(c, [[-z * 0.6, z * 0.5], [-z * 0.45, -z * 0.55], [z * 0.4, -z * 0.95], [z * 1.15, -z * 0.6], [z * 0.25, -z * 0.12], [z * 1.0, z * 0.32], [0, z * 0.85]]); form(c, cl, 0, 0, z, ob, { tex: 'chitin', texA: 0.4, hi: obHi, specA: 0.55, lw: 1.1 });
        c.strokeStyle = red; c.lineWidth = 1.2; c.beginPath(); c.moveTo(z * 0.25, -z * 0.12); c.lineTo(z * 1.05, -z * 0.56); c.moveTo(z * 0.25, -z * 0.12); c.lineTo(z * 0.95, z * 0.3); c.stroke(); c.restore();
        L.fx(g => { const ca = Math.cos(-0.75), sa = Math.sin(-0.75), X = (-40 + (z * 0.65) * ca - (-z * 0.1) * sa) * s, Y = by - 6 + (z * 0.65) * sa + (-z * 0.1) * ca; glow(g, X, Y, z * 1.1, red, 0.55 + 0.1 * k); }); });
      form(c, ell(c, 0, by + 2, 26, 17), 0, by + 2, 26, ob, { tex: 'chitin', texA: 0.42, hi: obHi, specA: 0.55, spR: 0.3, soft: () => { c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.4; [9, 17, 24].forEach(y => { c.beginPath(); c.moveTo(-26, by + y - 7); c.quadraticCurveTo(0, by + y - 2, 26, by + y - 7); c.stroke(); }); } });
      const cracks = [[[-15, by + 2], [-8, by + 9], [-12, by + 16]], [[13, by], [7, by + 8], [14, by + 15]], [[-4, by + 12], [2, by + 17]]];
      c.strokeStyle = '#B8202E'; c.lineWidth = 1.2; cracks.forEach(pts => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); });
      if (k >= 2) L.fx(g => { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = red; g.lineCap = 'round'; const p = 0.6 + 0.4 * Math.sin(t * 2.6); [[4, 0.25], [1.4, 0.9]].forEach(([w, a]) => { g.globalAlpha = FA * (a * p); g.lineWidth = w; cracks.forEach(pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }); }); g.restore(); });
      orb(c, 0, by - 6, 19, 13, sh(ob, 0.06), { tex: 'chitin', texA: 0.4, hi: obHi, specA: 0.55 });
      if (k === 3) { both(c, sd => { const tip = horn(c, -9, by - 15, 13, -2.05, 0.75, 5, '#2E2434', { veins: '#FF3B4E', lw: 1 }); L.fx(g => glow(g, tip[0] * sd, tip[1], 6, red, 0.8)); }); [-12, -4, 4, 12].forEach(x => form(c, () => { c.beginPath(); c.moveTo(x - 2.4, by - 16); c.lineTo(x, by - 22); c.lineTo(x + 2.4, by - 16); c.closePath(); }, x, by - 18, 3, '#3A2E42', { lw: 0.8, specA: 0.5 })); }
      [-1, 1].forEach(sx => eye(c, sx * 7.2, by - 6, 5.4, red, { lid: [0.06, 0.2, 0.32][k - 1], skin: ob, side: -sx }));
      L.fx(g => [-1, 1].forEach(sx => glow(g, sx * 7.2, by - 6, 12, red, 0.45 + k * 0.1)));
      mouth(c, 0, by + 2, 2.8, k === 3 ? 'fang' : ''); [-1, 1].forEach(sx => blush(c, sx * 12.5, by, 3.6, '#FF5A6E'));
    },
    // Raphael: a star-dappled celestial horse. A wobbly foal with a comet-flame mane, a star on its brow and a crescent
    // charm grows into a comet courser in a starry saddle cloth with a quiver of shooting stars and a moon-bow floating over
    // its back, then a magnificent prancing steed in a constellation caparison and crescent diadem whose great moon-bow looses
    // volleys of light into the sky. It is painted facing left and mirrored, so it faces right like the others
    sagittarius(c, k, t, L0) {
      const flipFn = fn => g => { g.save(); g.scale(-1, 1); MIR = -MIR; try { fn(g); } finally { MIR = -MIR; g.restore(); } };
      const L = { back: fn => L0.back(flipFn(fn)), fx: fn => L0.fx(flipFn(fn)) };
      c.save(); c.scale(-1, 1); MIR = -MIR;
      try {
      const coat = '#E2DAFF', coatDk = '#8E7CDA', pale = '#FBF8FF', sock = '#2A2070', gold = '#F2C65A', citr = '#FFB020', ink = '#41307E';
      const maneF = ['#4636B4', '#7458E8', '#E0CCFF'], maneM = ['#36289A', '#5E44D4', '#BCA4FF'], maneB = ['#261A74', '#4632AE', '#9478EE'];
      const Q = [
        { bx: -2, by: 10, rx: 14.5, ry: 9.5, hx: -13, hy: -15, hr: 12.5, lw: 4.6, mn: 5, mL: 15, mW: 8.5, tn: 3, tl: 19, tw: 9, cu: 1.9 },
        { bx: -2, by: 6, rx: 20, ry: 12, hx: -25, hy: -24, hr: 11, lw: 4.7, mn: 7, mL: 29, mW: 9.5, tn: 5, tl: 37, tw: 11, cu: 0.85 },
        { bx: -2, by: 1, rx: 23, ry: 13.2, hx: -30, hy: -34, hr: 11.4, lw: 5, mn: 9, mL: 40, mW: 10.5, tn: 6, tl: 50, tw: 12.5, cu: 0.8 }][k - 1];
      const { bx, by, rx, ry, hx, hy, hr, lw } = Q, GY = 40, hoofH = 3 + k * 0.45, legLen = GY - by - ry, fetY = GY - hoofH, br = Math.sin(t * 2) * 0.35;
      // ---- little geometry helpers: closed outlines that all wind the same way, so overlapping parts fill as one ----
      const orient = pts => { let a = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }); return a < 0 ? pts.slice().reverse() : pts; };
      const smooth = pts => { const n = pts.length, P = i => pts[((i % n) + n) % n]; c.moveTo(P(0)[0], P(0)[1]); for (let i = 0; i < n; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); } c.closePath(); };
      const poly = pts => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
      const starP = (x, y, r) => { c.moveTo(x, y - r * 2); c.quadraticCurveTo(x, y, x + r * 2, y); c.quadraticCurveTo(x, y, x, y + r * 2); c.quadraticCurveTo(x, y, x - r * 2, y); c.quadraticCurveTo(x, y, x, y - r * 2); c.closePath(); };
      // a leg: a smooth centre line through the joints with an outline at the given widths
      const legPts = (J, W) => { const C = [], Wd = [], N = 7;
        for (let s = 0; s < J.length - 1; s++) { const p0 = J[Math.max(0, s - 1)], p1 = J[s], p2 = J[s + 1], p3 = J[Math.min(J.length - 1, s + 2)];
          for (let i = 0; i < N; i++) { const u = i / N, u2 = u * u, u3 = u2 * u; C.push([0, 1].map(d => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3))); Wd.push(W[s] + (W[s + 1] - W[s]) * (u * u * (3 - 2 * u))); } }
        C.push(J[J.length - 1]); Wd.push(W[W.length - 1]);
        const Lp = [], Rp = []; C.forEach((p, i) => { const q = C[Math.min(C.length - 1, i + 1)], o = C[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, w = Wd[i] / 2; Lp.push([p[0] - dy / d * w, p[1] + dx / d * w]); Rp.push([p[0] + dy / d * w, p[1] - dx / d * w]); });
        return orient(Lp.concat(Rp.reverse())); };
      // a lock of comet-light hair: flows from its root, curling, gold at the root and violet at the tip
      const strand = (x0, y0, ang, len, w, curl, ph, cols, o) => {
        o = o || {}; const pts = [], N = 10; let x = x0, y = y0, a = ang;
        for (let i = 0; i <= N; i++) { pts.push([x, y]); const u = i / N; a += curl / N + Math.sin(t * 2.4 + ph - u * 3) * 0.035 * (o.wave || 1) + Math.sin(u * 5.2 + ph * 1.7) * 0.07 * (o.s == null ? 1 : o.s); x += Math.cos(a) * len / N; y += Math.sin(a) * len / N; }
        const tip = pts[N], path = ribbon(c, pts, 0, 0, u => w * Math.pow(1 - u, 0.85) * (0.3 + 0.7 * Math.sin(Math.min(1, u * 3.4) * Math.PI / 2)));
        const g = c.createLinearGradient(x0, y0, tip[0], tip[1]); g.addColorStop(0, cols[0]); g.addColorStop(0.45, cols[1]); g.addColorStop(1, cols[2]);
        form(c, path, (x0 + tip[0]) / 2, (y0 + tip[1]) / 2, len * 0.5, cols[1], { fill: g, specA: 0.18, lw: o.lw == null ? 0.8 : o.lw, line: o.line || '#1C1250', soft: () => {
          c.globalAlpha = 0.8; c.fillStyle = tex('stars'); c.fillRect(Math.min(x0, tip[0]) - w, Math.min(y0, tip[1]) - w, Math.abs(tip[0] - x0) + w * 2, Math.abs(tip[1] - y0) + w * 2); c.globalAlpha = 1;
          c.strokeStyle = 'rgba(214,196,255,.55)'; c.lineWidth = Math.max(0.45, w * 0.13); c.lineCap = 'round'; c.beginPath();
          for (let i = 1; i < 8; i++) { const p = pts[i], q = pts[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1, off = w * 0.14 * (1 - i / 10); i > 1 ? c.lineTo(p[0] + dy / d * off, p[1] - dx / d * off) : c.moveTo(p[0] + dy / d * off, p[1] - dx / d * off); }
          c.stroke(); } });
        return tip;
      };
      const hoof = (x, y, a, w, dark) => { c.save(); c.translate(x, y); c.rotate(a); const h = hoofH;
        const p = () => { c.beginPath(); c.moveTo(-w * 0.44, -0.5); c.lineTo(w * 0.44, -0.5); c.quadraticCurveTo(w * 0.58, h * 0.6, w * 0.54, h); c.lineTo(-w * 0.74, h); c.quadraticCurveTo(-w * 0.64, h * 0.4, -w * 0.44, -0.5); c.closePath(); };
        plate(c, p, 0, h / 2, w * 0.6, dark ? sh(gold, -0.22) : gold, { lw: 0.8 }); c.restore(); };
      // ---- the pose ----
      const LW = [2.3, 1.45, 1.0, 1.0, 0.8].map(v => v * lw), HW = [3.0, 2.15, 1.0, 1.0, 0.8].map(v => v * lw);
      const front = (x, d) => ({ J: [[x, by + ry * 0.1], [x - 0.4, by + ry * 0.85], [x - 0.5 + d, by + ry + legLen * 0.42], [x + d * 1.4, fetY - 2.4], [x + d * 1.6 + 0.6, fetY]], W: LW, h: [x + d * 1.6 + 0.6, fetY, 0] });
      const prance = x => { const kx = x - rx * 0.5, ky = by + ry + legLen * 0.1 + Math.sin(t * 2.2) * 0.8, fx = kx + 2.6, fy = ky + legLen * 0.4; return { J: [[x, by + ry * 0.1], [x - 2, by + ry * 0.8], [kx, ky], [fx, fy - 2.2], [fx + 1.4, fy]], W: LW, h: [fx + 1.4, fy, 0.5] }; };
      const hind = (x, d) => ({ J: [[x, by - ry * 0.1], [x - 1.5, by + ry * 0.68], [x + rx * 0.2 + d, by + ry + legLen * 0.45], [x + rx * 0.08 + d * 1.4, fetY - 2.4], [x + rx * 0.07 + d * 1.6, fetY]], W: HW, h: [x + rx * 0.07 + d * 1.6, fetY, 0] });
      const legs = { ff: front(bx - rx * 0.34, k === 1 ? 1.4 : 0.5), hf: hind(bx + rx * 0.4, -0.8), fn: k === 3 ? prance(bx - rx * 0.6) : front(bx - rx * 0.6, k === 1 ? -1.6 : -0.6), hn: hind(bx + rx * 0.62, 0.6) };
      const sockOn = lg => { const a = lg.J[2], b = lg.J[3], g = c.createLinearGradient(a[0], a[1], b[0], b[1]);
        g.addColorStop(0, rgba(sock, 0)); g.addColorStop(0.5, rgba(sock, 0)); g.addColorStop(0.95, rgba(sock, 0.82)); g.addColorStop(1, rgba(sock, 0.88)); c.fillStyle = g; c.fillRect(-90, -70, 180, 120);
        c.save(); c.beginPath(); c.rect(-90, Math.min(a[1], b[1]) + (b[1] - a[1]) * 0.6, 180, 80); c.clip(); c.globalAlpha = 0.85; c.fillStyle = tex('stars'); c.fillRect(-90, -70, 180, 120); c.restore(); };
      const farLeg = lg => { const pts = legPts(lg.J, lg.W), col = sh(coat, -0.2); form(c, () => { c.beginPath(); poly(pts); }, lg.J[1][0], lg.J[2][1], legLen * 0.9, col, { tex: 'fine', texA: 0.25, dk: sh(coatDk, -0.2), specA: 0.15, lw: 1, line: ink, soft: () => sockOn(lg) }); hoof(lg.h[0], lg.h[1], lg.h[2], lg.W[4] * 1.2, true); };
      // ---- the crest of the neck (the mane grows along it), the cloth on the back ----
      const P0 = [hx + hr * 0.42, hy - hr * 0.62], P2 = [bx - rx * 0.4, by - ry * 0.9], P1 = [(P0[0] + P2[0]) / 2 + rx * 0.14, (P0[1] + P2[1]) / 2 - ry * 0.2];
      const crest = u => [0, 1].map(d => (1 - u) ** 2 * P0[d] + 2 * (1 - u) * u * P1[d] + u * u * P2[d]);
      const x0 = bx - rx * 0.5, x1 = bx + rx * (k === 3 ? 0.8 : 0.52), yt = by - ry * 0.95, yb = by + ry * (k === 3 ? 0.78 : 0.32);
      const tips = [];
      // ---- the moon-bow floats over the back from the second stage, an arrow of light nocked ----
      const R = k === 3 ? 21 : 14, BX = bx + rx * (k === 3 ? 1.25 : 1.15), BY = by - ry - (k === 3 ? 38 : 27) + Math.sin(t * 1.6) * 1.5, A = -2.0 + Math.sin(t * 0.9) * 0.04, th = A - Math.PI;
      const tipA = [R + R * Math.cos(Math.PI * 0.6), R * Math.sin(Math.PI * 0.6)], pull = R * (0.62 + 0.06 * Math.sin(t * 2.4)), nx = tipA[0] + pull, nock = [BX + nx * Math.cos(th), BY + nx * Math.sin(th)];
      if (k >= 2) L.back(g => {
        g.save(); g.translate(BX, BY); g.rotate(th);
        glow(g, R * 0.6, 0, R * 1.6, '#E8E0FF', 0.32); glow(g, R * 0.2, 0, R * 0.9, '#FFE9A8', 0.22);
        const p = () => { g.beginPath(); g.arc(R, 0, R, Math.PI * 0.6, Math.PI * 1.4); g.arc(R * 1.24, 0, R * 0.93, Math.PI * 1.33, Math.PI * 0.67, true); g.closePath(); };
        const gr = g.createLinearGradient(0, -R, R * 0.5, R); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.45, '#FFF2C8'); gr.addColorStop(1, '#E6C26A');
        g.globalAlpha = FA; p(); g.fillStyle = gr; g.fill(); g.lineWidth = 0.8; g.strokeStyle = 'rgba(150,110,40,.85)'; g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 0.6; g.beginPath(); g.arc(R, 0, R * 0.95, Math.PI * 0.75, Math.PI * 1.15); g.stroke();
        g.strokeStyle = 'rgba(255,248,226,.95)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(tipA[0], tipA[1]); g.lineTo(nx, 0); g.lineTo(tipA[0], -tipA[1]); g.stroke();
        (k === 3 ? [-0.2, 0, 0.2] : [0]).forEach(da => { g.save(); g.translate(nx, 0); g.rotate(da); const Ln = nx + R * 0.35;
          g.globalCompositeOperation = 'lighter'; g.globalAlpha = FA * 0.55; blitSized(g, beamSprite('#FFE9A8'), -Ln, -2.2, Ln, 4.4); g.globalAlpha = FA * 0.45; blitSized(g, beamSprite('#FFFFFF'), -Ln, -0.7, Ln, 1.4);
          g.globalCompositeOperation = 'source-over'; g.globalAlpha = FA; g.fillStyle = '#FFF6D8'; g.beginPath(); g.moveTo(-Ln - 4, 0); g.lineTo(-Ln + 1, -2.2); g.lineTo(-Ln, 0); g.lineTo(-Ln + 1, 2.2); g.closePath(); g.fill();
          g.fillStyle = 'rgba(220,200,255,.9)'; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(-1, 0); g.lineTo(3, s * 2.4); g.lineTo(1.5, 0); g.closePath(); g.fill(); });
          star4(g, -Ln - 2, 0, 1.3, '#FFFFFF', 0.75 + 0.25 * Math.sin(t * 6)); g.restore(); });
        [tipA, [tipA[0], -tipA[1]]].forEach(p => star4(g, p[0], p[1], 1, '#FFFFFF', 0.8));
        g.restore();
        // the comet mane shines from behind
        const cm = crest(0.45); glow(g, cm[0] + 5, cm[1] - Q.mL * 0.3, Q.mL * 1.1, '#D9C6FF', 0.3);
      });
      else L.back(g => { const cm = crest(0.45); glow(g, cm[0] + 4, cm[1] - Q.mL * 0.3, Q.mL * 1.2, '#D9C6FF', 0.32); });
      // ---- the tail: a sweeping comet ----
      const T0 = [bx + rx * 0.9, by - ry * 0.55];
      for (let j = Q.tn - 1; j >= 0; j--) tips.push(strand(T0[0] - 1, T0[1] + j * 0.9, -0.95 + j * 0.15, Q.tl * (0.8 + 0.24 * Math.sin(j * 2.3 + 1)), Q.tw * (1 - j * 0.05), 2.1 + j * 0.08, j * 1.1 + 2, j % 2 ? maneB : maneM, { wave: 1.6 }));
      // ---- the far legs, then the mane that streams up behind the neck ----
      farLeg(legs.hf); farLeg(legs.ff);
      for (let i = Q.mn - 1; i >= 0; i--) { const u = 0.02 + 0.94 * i / (Q.mn - 1), p = crest(u); tips.push(strand(p[0] + 1, p[1] + 1.5, -1.1 + u * 0.45, Q.mL * (0.78 + 0.4 * Math.sin(Math.PI * (0.15 + 0.7 * u))), Q.mW * (0.95 + 0.15 * Math.sin(i * 1.9)), Q.cu - u * 0.2, i * 0.9, i % 2 ? maneB : maneM, { wave: 1.6 }));
        if (i < Q.mn - 1 && i % 2 === 0) tips.push(strand(p[0] + 2, p[1] + 1, -0.95 + u * 0.45, Q.mL * (0.95 + 0.3 * Math.sin(i * 2.7)), Q.mW * 0.5, Q.cu + 0.15, i * 1.7 + 3, maneF, { wave: 2, lw: 0.6, s: 1.4 })); }
      // ---- the body, neck and near legs as one coat ----
      const bodyPts = orient([P0, [P1[0] - rx * 0.02, P1[1] + ry * 0.12], P2, [bx + rx * 0.12, by - ry * 0.85 + br * 0.3], [bx + rx * 0.72, by - ry * 0.98], [bx + rx * 1.02, by - ry * 0.3], [bx + rx * 0.9, by + ry * 0.55], [bx + rx * 0.45, by + ry * 0.95],
        [bx - rx * 0.05, by + ry * 1.02], [bx - rx * 0.6, by + ry * 0.85], [bx - rx * 0.98, by + ry * 0.15], [bx - rx * 1.02, by - ry * 0.6], [hx + hr * 0.02, hy + hr * 0.72]]);
      const nF = legPts(legs.fn.J, legs.fn.W), nH = legPts(legs.hn.J, legs.hn.W), coatP = () => { c.beginPath(); smooth(bodyPts); poly(nF); poly(nH); };
      coatP(); c.lineWidth = 2.2; c.strokeStyle = ink; c.lineJoin = 'round'; c.stroke();
      form(c, coatP, bx - rx * 0.25, by - ry * 0.4, rx * 1.3, coat, { tex: 'fine', texA: 0.3, dk: coatDk, hi: '#FFFFFF', specA: 0.3, lw: 0, soft: () => {
        soft(c, bx - rx * 0.62, by - ry * 0.35, rx * 0.32, ry * 0.55, 0.3, '#FFFFFF', 0.4); soft(c, bx + rx * 0.55, by - ry * 0.5, rx * 0.38, ry * 0.4, 0, '#FFFFFF', 0.32);
        soft(c, bx, by + ry * 0.95, rx * 0.85, ry * 0.32, 0, '#2A1E6A', 0.22); soft(c, (P0[0] + P2[0]) / 2 + 3, (P0[1] + P2[1]) / 2, rx * 0.25, ry * 0.7, 0.6, '#FFFFFF', 0.3);
        // a blanket of stars over the rump
        const Rn = mulberry32(21); for (let i = 0; i < 30; i++) { const a = Rn() * TAU, d = Math.sqrt(Rn()), x = bx + rx * 0.55 + Math.cos(a) * rx * 0.5 * d, y = by - ry * 0.12 + Math.sin(a) * ry * 0.62 * d, r = (0.3 + Rn() * 0.6) * (1.1 - d * 0.5);
          c.globalAlpha = 0.95 - d * 0.55; c.fillStyle = Rn() < 0.25 ? '#FFE9A8' : '#FFFFFF'; c.beginPath(); r > 0.62 ? starP(x, y, r) : c.arc(x, y, r * 0.8, 0, TAU); c.fill(); }
        c.globalAlpha = 1;
        // shoulder and thigh lines
        c.strokeStyle = rgba(ink, 0.32); c.lineWidth = 0.8; c.lineCap = 'round'; c.beginPath();
        c.moveTo(bx - rx * 0.42, by - ry * 0.7); c.quadraticCurveTo(bx - rx * 0.28, by + ry * 0.05, bx - rx * 0.44, by + ry * 0.6);
        c.moveTo(bx + rx * 0.3, by + ry * 0.92); c.quadraticCurveTo(bx + rx * 0.32, by - ry * 0.05, bx + rx * 0.62, by - ry * 0.45); c.stroke();
        [legs.fn, legs.hn].forEach(lg => { c.save(); c.beginPath(); poly(legPts(lg.J, lg.W)); c.clip(); sockOn(lg); c.restore(); });
      } });
      hoof(legs.fn.h[0], legs.fn.h[1], legs.fn.h[2], legs.fn.W[4] * 1.2); hoof(legs.hn.h[0], legs.hn.h[1], legs.hn.h[2], legs.hn.W[4] * 1.2);
      // ---- a starry saddle cloth (stage 2) or a caparison stitched with the Archer's stars (stage 3) ----
      if (k >= 2) {
        const clP = blob(c, [[x0, yt - 0.6], [bx + rx * 0.12, yt + 0.8], [x1, yt - 0.9], [x1 + 1.6, (yt + yb) / 2], [x1 - 2, yb], [(x0 + x1) / 2, yb + 2.5], [x0 + 1, yb - 1], [x0 - 1.6, (yt + yb) / 2]]);
        form(c, clP, (x0 + x1) / 2, (yt + yb) / 2, (x1 - x0) * 0.6, '#2E267A', { hi: '#5E50C4', dk: '#140E40', specA: 0.3, lw: 0, soft: () => { c.globalAlpha = 0.85; c.fillStyle = tex('stars'); c.fillRect(x0 - 4, yt - 4, x1 - x0 + 8, yb - yt + 10); c.globalAlpha = 1; soft(c, (x0 + x1) / 2, yb, (x1 - x0) * 0.5, 4, 0, '#B9A0FF', 0.3); } });
        c.save(); clP(); c.clip(); clP(); c.lineWidth = k === 3 ? 3.4 : 2.6; c.strokeStyle = metalG(c, x0, yt, x1, yb, gold); c.stroke(); c.restore();
        clP(); c.lineWidth = 0.9; c.strokeStyle = '#120A30'; c.stroke();
        if (k === 2) { const sx = (x0 + x1) / 2 - 1, sy = (yt + yb) / 2 + 1; c.fillStyle = metalG(c, sx - 3, sy - 3, sx + 3, sy + 3, gold); c.beginPath(); starP(sx, sy, 1.9); c.fill(); L.fx(g => { glow(g, sx, sy, 8, '#FFE37A', 0.45); star4(g, sx, sy, 0.7, '#FFFFFF', 0.5 + 0.4 * Math.sin(t * 3)); }); }
        else { const C = CONSTELLATION.sagittarius, w = (x1 - x0) * 0.62, h = (yb - yt) * 0.6, ox = x0 + (x1 - x0) * 0.12, oy = yt + (yb - yt) * 0.2;
          for (let i = 0; i < 7; i++) { const x = x0 + 3 + i * (x1 - x0 - 6) / 6; c.fillStyle = metalG(c, x - 1, yb - 2, x + 1, yb + 3, gold); c.beginPath(); c.moveTo(x - 1, yb - 1.5 + Math.abs(i - 3) * 0.15); c.lineTo(x + 1, yb - 1.5 + Math.abs(i - 3) * 0.15); c.lineTo(x, yb + 2.4 - Math.abs(i - 3) * 0.3); c.closePath(); c.fill(); }
          L.fx(g => { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#E8E0FF'; g.lineWidth = 0.6; g.globalAlpha = FA * 0.55; g.beginPath(); C.e.forEach(([a, b]) => { g.moveTo(ox + C.p[a][0] * w, oy + C.p[a][1] * h); g.lineTo(ox + C.p[b][0] * w, oy + C.p[b][1] * h); }); g.stroke(); g.restore();
            C.p.forEach(([u, v], i) => star4(g, ox + u * w, oy + v * h, 0.6, i % 3 ? '#E8E0FF' : '#FFE37A', 0.6 + 0.35 * Math.sin(t * 2.5 + i))); }); }
      }
      // ---- a breast strap and a crescent medallion (stage 3); a ribbon collar with a crescent charm (stage 1) ----
      if (k === 3) { const a = [bx - rx * 0.42, by - ry * 0.92], b = [bx - rx * 0.98, by - ry * 0.12];
        c.lineCap = 'round'; c.strokeStyle = '#7A5A1A'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(bx - rx * 0.6, by - ry * 0.15, b[0], b[1]); c.stroke();
        c.strokeStyle = metalG(c, a[0], a[1], b[0], b[1], gold); c.lineWidth = 2.2; c.stroke();
        plate(c, () => { c.beginPath(); c.arc(b[0], b[1] + 1, 4.4, Math.PI * 0.2, Math.PI * 1.8); c.arc(b[0] + 1.8, b[1] + 1, 3.6, Math.PI * 1.72, Math.PI * 0.28, true); c.closePath(); }, b[0], b[1] + 1, 4.4, gold, { lw: 0.7 });
        gem(c, b[0] - 0.6, b[1] + 1, 2.1, citr); L.fx(g => glow(g, b[0] - 0.6, b[1] + 1, 9, '#FFD36B', 0.6)); }
      if (k === 1) { const a0 = [hx + hr * 0.2, hy + hr * 0.9], a1 = [hx + hr * 0.95, hy + hr * 0.15];
        c.lineCap = 'round'; c.strokeStyle = '#2A2070'; c.lineWidth = 3; c.beginPath(); c.moveTo(a0[0], a0[1]); c.quadraticCurveTo(hx + hr * 0.8, hy + hr * 0.9, a1[0], a1[1]); c.stroke();
        c.strokeStyle = 'rgba(255,233,168,.8)'; c.lineWidth = 0.6; c.stroke();
        const cx = a0[0] + 1, cy = a0[1] + 4; plate(c, () => { c.beginPath(); c.arc(cx, cy, 3, Math.PI * 0.35, Math.PI * 1.65); c.arc(cx + 1.3, cy, 2.4, Math.PI * 1.6, Math.PI * 0.4, true); c.closePath(); }, cx, cy, 3, gold, { lw: 0.6 });
        L.fx(g => { glow(g, cx, cy, 7, '#FFE9A8', 0.6); star4(g, cx - 1.6, cy - 1.8, 0.6, '#FFFFFF', 0.5 + 0.5 * Math.sin(t * 3)); }); }
      // ---- the front of the mane falls over the neck from a thick crest of starry hair ----
      const cp = []; for (let i = 0; i <= 12; i++) { const p = crest(i / 12); cp.push([p[0] + 0.6, p[1] + 1]); }
      form(c, ribbon(c, cp, 0, 0, u => Q.mW * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, 0.1 + u * 0.95)))), cp[6][0], cp[6][1], Q.mL * 0.5, '#4632AE', { hi: '#7A5CEA', dk: '#20165E', specA: 0.2, lw: 0.8, line: '#1C1250', soft: () => { c.globalAlpha = 0.8; c.fillStyle = tex('stars'); c.fillRect(-80, -100, 160, 160); c.globalAlpha = 1; } });
      const nf = Math.ceil(Q.mn / 2);
      for (let i = nf - 1; i >= 0; i--) { const u = 0.06 + 0.8 * i / Math.max(1, nf - 1), p = crest(u); tips.push(strand(p[0] - 0.5, p[1] + 2.5, -0.85 + u * 0.5, Q.mL * (0.55 + 0.2 * Math.sin(Math.PI * u)), Q.mW * 0.9, Q.cu + 0.25, i * 1.4 + 0.5, maneF, { wave: 1.4 })); }
      // ---- the head, in profile: a long, gentle face with one big dark eye ----
      const tw = Math.sin(t * 1.3) * 0.05, ML = [0.8, 0.95, 1][k - 1], hp = (fx, fy) => [hx + hr * (fx < -0.75 ? -0.75 + (fx + 0.75) * ML : fx), hy + hr * fy];
      const ear = (x, y, a, len, w, far) => { c.save(); c.translate(x, y); c.rotate(a);
        const p = s => () => { c.beginPath(); c.moveTo(0, -w * 0.5 * s); c.quadraticCurveTo(len * 0.5, -w * 0.8 * s, len * (0.62 + 0.38 * s), 0); c.quadraticCurveTo(len * 0.5, w * 0.8 * s, 0, w * 0.5 * s); c.closePath(); };
        form(c, p(1), len * 0.45, 0, len * 0.55, far ? sh(coat, -0.15) : coat, { dk: coatDk, specA: 0.25, lw: 1, line: ink });
        form(c, p(0.58), len * 0.4, 0, len * 0.45, '#2A1F6A', { hi: '#6A58C8', dk: '#120A3A', specA: 0.15, lw: 0, soft: () => { c.globalAlpha = 0.9; c.fillStyle = tex('stars'); c.fillRect(-2, -w, len + 4, w * 2); c.globalAlpha = 1; } });
        c.restore(); };
      ear(...hp(0.0, -0.74), -1.8 - tw, hr * 0.92, hr * 0.42, true);
      ear(...hp(0.28, -0.68), -1.45 + tw, hr * 1.02, hr * 0.46, false);
      const headPts = [hp(0.62, -0.58), hp(0.22, -0.9), hp(-0.3, -0.9), hp(-0.78, -0.62), hp(-1.3, -0.16), hp(-1.72, 0.3), hp(-1.88, 0.6), hp(-1.76, 0.86), hp(-1.42, 0.98), hp(-0.9, 0.9), hp(-0.2, 0.98), hp(0.5, 0.62), hp(0.74, -0.04)];
      const headP = () => { c.beginPath(); smooth(orient(headPts)); };
      headP(); c.lineWidth = 2.2; c.strokeStyle = ink; c.lineJoin = 'round'; c.stroke();
      const nose = hp(-1.58, 0.56), jowl = hp(0.08, 0.5);
      form(c, headP, hx - hr * 0.5, hy, hr * 1.5, coat, { tex: 'fine', texA: 0.22, dk: coatDk, hi: '#FFFFFF', specA: 0.32, lw: 0, soft: () => {
        soft(c, nose[0], nose[1], hr * 0.55 * ML, hr * 0.45, 0.4, pale, 0.95);                       // a soft pale muzzle
        soft(c, jowl[0], jowl[1] + hr * 0.15, hr * 0.62, hr * 0.42, 0, coatDk, 0.3);                  // the round cheek in shade
        soft(c, ...hp(-0.55, -0.62), hr * 0.75, hr * 0.22, 0.45, '#FFFFFF', 0.45);                    // light along the brow and nose
        c.strokeStyle = rgba(ink, 0.32); c.lineWidth = 0.8; c.lineCap = 'round'; c.beginPath(); c.arc(jowl[0], jowl[1] - hr * 0.08, hr * 0.5, 0.2, 2.2); c.stroke(); } });
      // nostril, a small smile, a blush
      { const [nx2, ny2] = hp(-1.62, 0.42); c.strokeStyle = rgba('#3A2470', 0.8); c.lineWidth = 1; c.lineCap = 'round'; c.beginPath(); c.moveTo(nx2 + hr * 0.12, ny2 - hr * 0.08); c.quadraticCurveTo(nx2 - hr * 0.08, ny2 - hr * 0.06, nx2 + hr * 0.02, ny2 + hr * 0.1); c.stroke(); }
      { const a = hp(-1.74, 0.8), b = hp(-1.32, 0.76); c.strokeStyle = ink; c.lineWidth = 0.9; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, a[1] + hr * 0.1, b[0], b[1] - hr * 0.06); c.stroke(); }
      blush(c, ...hp(-0.5, 0.36), hr * 0.26, '#FF9AC8');
      // the eye: big, dark and gentle, with lashes
      const er = hr * (k === 1 ? 0.35 : 0.31), [ex, ey] = hp(-0.4, -0.16);
      eye(c, ex, ey, er, '#4A2C86', { cute: true, irisK: 0.98, tall: 1.3, line: ink, side: -1, flick: true, lx: -0.4 });
      c.strokeStyle = ink; c.lineWidth = Math.max(0.8, er * 0.18); c.lineCap = 'round'; c.beginPath(); c.moveTo(ex + er * 0.9, ey - er * 0.95); c.quadraticCurveTo(ex + er * 1.25, ey - er * 1.25, ex + er * 1.5, ey - er * 1.2); c.stroke();
      L.fx(g => star4(g, ex - er * 0.25, ey - er * 0.45, 0.55 + k * 0.08, '#FFFFFF', 0.7 + 0.3 * Math.sin(t * 3)));
      // a forelock of starry hair falling forward over the brow
      [[-2.5, -0.9, 1, 0.12], [-2.2, -1.1, 0.85, 0.02], [-2.75, -0.6, 0.7, 0.2]].forEach(([a, cu, s, dx], i) => strand(...hp(dx, -0.82), a, hr * (k === 1 ? 0.8 : 0.75) * s, hr * 0.32 * s, cu, i * 1.3, i === 1 ? maneM : maneF, { lw: 0.7, wave: 0.6 }));
      // a star on the brow, then a gold browband with a crescent and a citrine
      const [bzx, bzy] = hp(-0.9, -0.42);
      if (k < 3) { c.fillStyle = '#FFFFFF'; c.beginPath(); starP(bzx, bzy, hr * 0.085); c.fill(); L.fx(g => { glow(g, bzx, bzy, hr * 0.45, '#FFE9A8', 0.55); star4(g, bzx, bzy, 0.7, '#FFFFFF', 0.6 + 0.4 * Math.sin(t * 3)); }); }
      else { const a = hp(0.3, -0.78), b = hp(-0.86, -0.56), m = hp(-0.3, -0.5);
        c.lineCap = 'round'; c.strokeStyle = '#7A5A1A'; c.lineWidth = 2.8; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1], b[0], b[1]); c.stroke(); c.strokeStyle = metalG(c, a[0], a[1], b[0], b[1], gold); c.lineWidth = 1.9; c.stroke();
        const cx = b[0] - hr * 0.05, cy = b[1] - hr * 0.12; plate(c, () => { c.beginPath(); c.arc(cx, cy, hr * 0.34, Math.PI * 0.02, Math.PI * 0.98); c.arc(cx, cy - hr * 0.14, hr * 0.28, Math.PI * 0.92, Math.PI * 0.08, true); c.closePath(); }, cx, cy, hr * 0.34, gold, { lw: 0.7 });
        gem(c, cx, cy + hr * 0.12, hr * 0.16, citr); L.fx(g => { glow(g, cx, cy + hr * 0.1, 10, '#FFD36B', 0.7); star4(g, cx, cy - hr * 0.32, 0.9, '#FFFFFF', 0.6 + 0.4 * Math.sin(t * 3)); }); }
      // ---- light: stardust streaming off the mane and tail, sparks at the hooves, volleys from the moon-bow ----
      L.fx(g => { tips.forEach((p, i) => { if (i % 2) return; star4(g, p[0], p[1], 0.5 + k * 0.1, '#FFFFFF', 0.35 + 0.5 * Math.abs(Math.sin(t * 2.2 + i * 1.3)));
        const ph = (t * 0.6 + i * 0.37) % 1; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = FA * (1 - ph) * 0.8; g.fillStyle = i % 4 ? '#E8E0FF' : '#FFE9A8'; g.beginPath(); g.arc(p[0] + ph * 9, p[1] - ph * 5, 0.7 * (1 - ph) + 0.3, 0, TAU); g.fill(); g.restore(); }); });
      if (k >= 2) L.fx(g => { [legs.fn, legs.hn, legs.ff, legs.hf].forEach((lg, i) => { const [x, y] = lg.h; glow(g, x, y + hoofH, 6, '#FFE9A8', 0.3); star4(g, x + (i % 2 ? 2 : -2), y + hoofH * 0.4, 0.6, '#FFFFFF', 0.35 + 0.5 * Math.abs(Math.sin(t * 2.6 + i * 1.7))); });
        const n = k === 3 ? 3 : 2; for (let i = 0; i < n; i++) { const ph = (t * 0.55 + i / n) % 1, a = A + (i - (n - 1) / 2) * 0.16, d = 10 + ph * 80, x = nock[0] + Math.cos(a) * d, y = nock[1] + Math.sin(a) * d;
          g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = FA * Math.sin(ph * Math.PI) * 0.85; g.translate(x, y); g.rotate(a); blitSized(g, beamSprite('#FFE9A8'), -26, -2.5, 26, 5); g.restore(); star4(g, x, y, 1.1, '#FFFFFF', Math.sin(ph * Math.PI)); } });
      } finally { MIR = -MIR; c.restore(); }
    },
    // Mammon: a sea-goat kid with coin spots and a fish tail, whose ridged horns crackle with gold lightning
    capricorn(c, k, t, L) {
      const fur = '#3E6474', furDk = '#1E3640', belly = '#8CB4C2', tail = '#2E7A8C', fin = '#5FD4FF', zap = '#FFE37A', sway = Math.sin(t * 2.4) * 4;
      const bw = [22, 24, 26][k - 1], bh = [17, 18, 19][k - 1], by = [14, 12, 10][k - 1], hr = [15, 15.5, 16.5][k - 1], hy = by - bh - hr * 0.45;
      const tp = bez([bw * 0.4, by + 10], [bw * 1.6, by + 26], [bw * 2.3, by + 4 + sway], [bw * 1.95, by - 18 + sway], 16), te = tp[tp.length - 1];
      form(c, blob(c, [[te[0], te[1] + 3], [te[0] - 15, te[1] - 12], [te[0] - 3, te[1] - 6], [te[0] + 4, te[1] - 21], [te[0] + 8, te[1] - 2]]), te[0], te[1] - 8, 10, fin, { hi: '#E8FBFF', specA: 0.5, lw: 1, soft: () => { c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 0.7; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(te[0], te[1]); c.lineTo(te[0] - 12 + i * 5, te[1] - 12 - (i === 3 ? 6 : 0)); c.stroke(); } } });
      form(c, ribbon(c, tp, 0, 0, u => 21 - u * 14), bw * 1.6, by + 6, 24, tail, { tex: 'scale', texA: 0.55, dk: '#164A58', specA: 0.4, lw: 1.1 });
      [0.35, 0.6].forEach(u => { const q = tp[Math.floor(u * (tp.length - 1))]; form(c, blob(c, [[q[0] - 3, q[1] - 6], [q[0] + 3, q[1] - 17], [q[0] + 7, q[1] - 5]]), q[0] + 2, q[1] - 9, 6, fin, { hi: '#E8FBFF', specA: 0.4, lw: 0.9 }); });
      [-1, 1].forEach(sx => { limb(c, sx * 9, by + 4, sx * 9.5, 37, 7.5, 6.2, fur, { tex: 'fur', texA: 0.32 }); hoof(c, sx * 9.5, 38.6, 5.2, '#14222A', k === 3 ? '#FFD447' : null); });
      form(c, ell(c, 0, by, bw, bh), 0, by, bw, fur, { tex: 'fur', texA: 0.4, dk: furDk, specA: 0.3, soft: () => soft(c, 0, by + bh * 0.55, bw * 0.62, bh * 0.45, 0, belly, 0.6) });
      [[-11, by - 5], [9, by - 8], [3, by + 6], [14, by + 4], [-6, by + 9]].forEach(([x, y], i) => { if (i < 1 + k) coin(c, x, y, 2.8); });
      if (k >= 2) { c.strokeStyle = metalG(c, -12, 0, 12, 0, '#FFD447'); c.lineWidth = 1.8; c.beginPath(); c.arc(0, by - bh * 0.95, 12, 0.35, Math.PI - 0.35); c.stroke(); coin(c, 0, by - bh * 0.95 + 12, k === 3 ? 4.6 : 3.6); }
      both(c, () => { c.save(); c.translate(-hr * 1.02, hy - 1); c.rotate(0.28); form(c, ell(c, -3.5, 0, 8.4, 3.6), -3.5, 0, 8.4, fur, { tex: 'fine', texA: 0.3, dk: furDk, specA: 0.25, lw: 1 }); form(c, ell(c, -4, 0.3, 5, 1.6), -4, 0.3, 5, '#E08AA0', { lw: 0, spec: false }); c.restore(); });
      const hl = [13, 24, 34][k - 1];
      both(c, sd => { const tip = horn(c, -hr * 0.5, hy - hr * 0.7, hl * 1.15, -2.05, -1.75, [7, 9, 11][k - 1], '#E6D6A8', { rings: true, ringStep: 1, lw: 1.1 }); if (k >= 2) L.fx(g => glow(g, tip[0] * sd, tip[1], 7, zap, 0.8)); });
      form(c, ell(c, 0, hy, hr, hr * 0.88), 0, hy, hr, fur, { tex: 'fur', texA: 0.35, dk: furDk, specA: 0.35 });
      form(c, furPath(c, 0, hy + hr * 0.95, 3.6, 4.6, { n: 8, len: 5, seed: 3, prof: a => (Math.sin(a) > 0.3 ? 1.4 : 0.2) }), 0, hy + hr * 1.0, 4.4, '#D9E6EE', { tex: 'fine', texA: 0.3, specA: 0.2, lw: 0.9 });
      if (k >= 2) L.fx(g => { const s2 = Math.floor(t * 10), y0 = hy - hr * 0.7 - hl * 0.55; if ((s2 % 4) < 3) { bolt(g, -hr * 0.55, y0 + 2, -hr * 0.55 - hl * 0.4, y0 + hl * 0.32, s2, zap, 4); bolt(g, hr * 0.55, y0 + 2, hr * 0.55 + hl * 0.4, y0 + hl * 0.32, s2 + 7, zap, 4); } if (k === 3 && (s2 % 3) !== 1) bolt(g, -hr * 0.7, y0 - 4, hr * 0.7, y0 - 4, s2 + 3, zap, 5); });
      if (k === 3) [-8, -4, 0, 4, 8].forEach((x, i) => coin(c, x, hy - hr * 0.86 - (i === 2 ? 3 : i % 2 ? 1.5 : 0), 2.6));
      [-1, 1].forEach(sx => eye(c, sx * hr * 0.4, hy - 1, 4.6, '#FFC24D', { slit: true, side: -sx, lid: [0, 0.12, 0.18][k - 1], skin: fur }));
      if (k >= 2) L.fx(g => [-1, 1].forEach(sx => glow(g, sx * hr * 0.4, hy - 1, 10, zap, 0.45)));
      form(c, ell(c, 0, hy + hr * 0.55, hr * 0.46, hr * 0.32), 0, hy + hr * 0.55, hr * 0.46, sh(fur, 0.28), { tex: 'fine', texA: 0.3, specA: 0.3, lw: 1 });
      nose(c, 0, hy + hr * 0.46, 2.2, '#16242C'); mouth(c, 0, hy + hr * 0.68, 2.1);
      [-1, 1].forEach(sx => blush(c, sx * hr * 0.68, hy + hr * 0.32, 3.6));
    },
    // Zadkiel: a sea serpent of the celestial river. A round-eyed hatchling coiled on the water grows into a great winged
    // serpent: sapphire scales and pale belly plates, translucent fin-wings on bony rays, a frilled head and flowing whiskers,
    // with ribbons of water spiralling round it
    aquarius(c, k, t, L) {
      const sc = '#2F64C4', scHi = '#7FB8FF', belly = '#DDEFFF', finA = 'rgba(160,236,255,.88)', finB = 'rgba(70,140,235,.7)', finC = 'rgba(150,120,255,.75)', ray = '#BFE6FF', sw = Math.sin(t * 2) * 2.5;
      const L0 = (-0.6), L1 = (-0.8);
      // geometry along the body: normals and half-widths, so fins, scales and shading all follow the curve
      const geom = (pts, wf) => { const N = pts.length - 1, nrm = [], W = []; for (let i = 0; i <= N; i++) { const p = pts[Math.max(0, i - 1)], q = pts[Math.min(N, i + 1)], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1; nrm.push([-dy / d, dx / d]); W.push(wf(i / N) / 2); } const off = (i, f) => [pts[i][0] + nrm[i][0] * W[i] * f, pts[i][1] + nrm[i][1] * W[i] * f]; const band = (f0, f1, i0, i1, fv) => { c.beginPath(); for (let i = i0; i <= i1; i++) { const [x, y] = off(i, typeof f0 === 'function' ? f0(i) : f0); i === i0 ? c.moveTo(x, y) : c.lineTo(x, y); } for (let i = i1; i >= i0; i--) { const [x, y] = off(i, typeof f1 === 'function' ? f1(i) : f1); c.lineTo(x, y); } c.closePath(); }; return { N, nrm, W, off, band }; };
      // a fin along the back: spines with webbing scalloped between them
      const dorsal = (G, side, i0, i1, step, hf) => { const tips = []; for (let i = i0; i <= i1; i += step) { const base = G.off(i, side * 0.85), n = G.nrm[i], h = hf((i - i0) / Math.max(1, i1 - i0)), lean = 0.45; const tx = base[0] + n[0] * side * h - (G.off(Math.min(G.N, i + 1), 0)[0] - G.off(i, 0)[0]) * lean * h * 0.4, ty = base[1] + n[1] * side * h - (G.off(Math.min(G.N, i + 1), 0)[1] - G.off(i, 0)[1]) * lean * h * 0.4; tips.push([base, [tx, ty]]); }
        if (tips.length < 2) return; c.beginPath(); c.moveTo(tips[0][0][0], tips[0][0][1]); tips.forEach(([b, tp], j) => { if (!j) { c.lineTo(tp[0], tp[1]); return; } const pb = tips[j - 1][1]; c.quadraticCurveTo((pb[0] + tp[0]) / 2 * 0.6 + b[0] * 0.4, (pb[1] + tp[1]) / 2 * 0.6 + b[1] * 0.4, tp[0], tp[1]); }); for (let j = tips.length - 1; j >= 0; j--) c.lineTo(tips[j][0][0], tips[j][0][1]); c.closePath();
        const g = c.createLinearGradient(tips[0][0][0], tips[0][0][1], tips[tips.length - 1][1][0], tips[tips.length - 1][1][1]); g.addColorStop(0, finB); g.addColorStop(0.5, finA); g.addColorStop(1, finC); c.fillStyle = g; c.fill(); c.lineWidth = 0.8; c.strokeStyle = 'rgba(20,50,130,.7)'; c.stroke();
        tips.forEach(([b, tp]) => limb(c, b[0], b[1], tp[0], tp[1], 1.6, 0.5, ray, { lw: 0.5, line: '#2A5AA8' })); };
      // the body: scales shaded like a cylinder, a pale band of belly plates, a highlight ridge toward the light
      const body = (pts, wf, bs) => { const G = geom(pts, wf), N = G.N, full = () => G.band(-1, 1, 0, N);
        full(); c.fillStyle = sc; c.fill();
        c.save(); full(); c.clip();
        G.band(bs * 0.2, bs * 1.02, 0, N); c.fillStyle = lit(c, 0, 0, 60, belly, { hi: '#FFFFFF' }); c.fill();
        c.globalAlpha = 0.55; c.fillStyle = tex('scale'); c.fillRect(-120, -140, 240, 200); c.globalAlpha = 1;
        c.strokeStyle = 'rgba(60,90,150,.55)'; c.lineWidth = 0.8; for (let i = 1; i < N; i++) { const a = G.off(i, bs * 0.22), b = G.off(i, bs * 1.02), d = [pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]]; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2 + d[0] * 0.5, (a[1] + b[1]) / 2 + d[1] * 0.5, b[0], b[1]); c.stroke(); }
        for (let j = 0; j < 4; j++) { const f = 1 - 0.16 * (j + 1); c.fillStyle = 'rgba(8,14,50,.13)'; G.band(f, 1.03, 0, N); c.fill(); G.band(-1.03, -f, 0, N); c.fill(); }
        const hc = i => 0.42 * (G.nrm[i][0] * L0 * MIR + G.nrm[i][1] * L1);
        c.fillStyle = 'rgba(200,235,255,.22)'; G.band(i => hc(i) - 0.16, i => hc(i) + 0.16, 0, N); c.fill(); c.fillStyle = 'rgba(255,255,255,.28)'; G.band(i => hc(i) - 0.05, i => hc(i) + 0.05, 0, N); c.fill();
        c.restore();
        full(); c.lineWidth = 1.2; c.strokeStyle = '#142E70'; c.lineJoin = 'round'; c.stroke();
        return G; };
      // a fin-wing: bony rays fanned from the shoulder, translucent webbing scalloped between their tips
      const finWing = (x, y, S, a0, a1, n) => { const tips = []; for (let i = 0; i < n; i++) { const u = i / (n - 1), a = a0 + (a1 - a0) * u, Lr = S * (0.55 + 0.45 * Math.sin(Math.min(1, u * 1.3) * Math.PI * 0.62 + 0.4)); tips.push([x + Math.cos(a) * Lr, y + Math.sin(a) * Lr]); }
        const path = () => { c.beginPath(); c.moveTo(x, y); tips.forEach(([tx, ty], i) => { if (!i) { c.lineTo(tx, ty); return; } const [px, py] = tips[i - 1], mx = (px + tx) / 2, my = (py + ty) / 2; c.quadraticCurveTo(x + (mx - x) * 0.8, y + (my - y) * 0.8, tx, ty); }); c.closePath(); };
        const g = c.createRadialGradient(x, y, S * 0.05, x, y, S); g.addColorStop(0, finB); g.addColorStop(0.55, finA); g.addColorStop(1, finC); path(); c.fillStyle = g; c.fill();
        c.save(); path(); c.clip(); c.globalAlpha = 0.45; c.fillStyle = tex('water'); c.fillRect(x - S, y - S, S * 2, S * 2); c.globalAlpha = 1; soft(c, x + (tips[1][0] - x) * 0.5, y + (tips[1][1] - y) * 0.5, S * 0.35, S * 0.15, 0, '#FFFFFF', 0.4); c.restore();
        path(); c.lineWidth = 0.9; c.strokeStyle = 'rgba(20,50,130,.75)'; c.stroke();
        tips.forEach(([tx, ty]) => limb(c, x, y, tx, ty, 2.6, 0.7, ray, { lw: 0.6, line: '#2A5AA8' }));
        return tips; };
      // a cute round head turned toward you: big glossy eyes, a soft muzzle and smile, fin frills and a little crest
      const head = (hx, hy, hs, wob) => { c.save(); c.translate(hx, hy); c.scale(hs, hs); c.rotate(wob);
        const fin = (x0, y0, a0, a1, n, len) => { const tips = []; for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0.5, a = a0 + (a1 - a0) * u, Lr = len * (0.7 + 0.3 * Math.sin(u * Math.PI)); tips.push([x0 + Math.cos(a) * Lr, y0 + Math.sin(a) * Lr]); }
          const p = () => { c.beginPath(); c.moveTo(x0, y0); tips.forEach(([tx, ty], i) => { if (!i) { c.lineTo(tx, ty); return; } const [px, py] = tips[i - 1]; c.quadraticCurveTo(x0 + ((px + tx) / 2 - x0) * 0.82, y0 + ((py + ty) / 2 - y0) * 0.82, tx, ty); }); c.closePath(); };
          const g = c.createRadialGradient(x0, y0, 1, x0, y0, len); g.addColorStop(0, finB); g.addColorStop(0.55, finA); g.addColorStop(1, finC); p(); c.fillStyle = g; c.fill(); c.lineWidth = 0.7; c.strokeStyle = 'rgba(20,50,130,.7)'; c.stroke();
          tips.forEach(([tx, ty]) => limb(c, x0, y0, tx, ty, 1.4, 0.45, ray, { lw: 0.4, line: '#2A5AA8' })); };
        // fin frills fanned out from behind each cheek, and a crest on top
        fin(-9, -1, Math.PI + 0.75, Math.PI - 0.35, 4, k === 3 ? 15 : 12); fin(9, -1, -0.75, 0.35, 4, k === 3 ? 15 : 12);
        fin(0, -9, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55, 3, k === 1 ? 7 : 10);
        if (k >= 2) [-1, 1].forEach(sx => horn(c, sx * 5.5, -9.5, k === 3 ? 9 : 6, -Math.PI / 2 + sx * 0.75, sx * 0.55, 3, '#D6ECFF', { lw: 0.7, line: '#2A4A88' }));
        const skull = blob(c, [[0, -12], [9.5, -9.5], [13, -1], [10.5, 7.5], [0, 10.5], [-10.5, 7.5], [-13, -1], [-9.5, -9.5]]);
        form(c, skull, 0, -1, 13, sc, { hi: scHi, dk: '#163A86', specA: 0.5, spR: 0.32, line: '#142E70', lw: 1.1, soft: () => { c.globalAlpha = 0.28; c.fillStyle = tex('scale'); c.fillRect(-14, -14, 28, 12); c.globalAlpha = 1; c.fillStyle = lit(c, 0, 5, 12, belly, { hi: '#FFFFFF' }); c.beginPath(); c.ellipse(0, 6, 10.5, 6.8, 0, 0, TAU); c.fill(); soft(c, -4 * MIR, -8, 6, 2.6, -0.3 * MIR, '#FFFFFF', 0.4); } });
        orb(c, 0, 4.2, 4, 2.6, mix(belly, '#FFFFFF', 0.5), { lw: 0, specA: 0.6, dk: '#D0E0F4' });
        [-1, 1].forEach(sx => eye(c, sx * 5.3, -2.2, 4.8, '#3A8AF0', { side: -sx, tall: 1.14, irisK: 1.08, line: '#0E1E50', cute: true }));
        c.strokeStyle = '#142E70'; c.lineWidth = 0.9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-2.4, 7); c.quadraticCurveTo(-1.2, 8.3, 0, 7.2); c.quadraticCurveTo(1.2, 8.3, 2.4, 7); c.stroke();
        [-1, 1].forEach(sx => blush(c, sx * 9, 3.5, 3.4, '#FF8AC0'));
        c.restore();
        L.fx(g => [-1, 1].forEach(sx => glow(g, hx + sx * 5.6 * hs, hy - 2.6 * hs, 6 * hs, '#7FF0FF', 0.25 + k * 0.08)));
      };
      L.back(g => { glow(g, 0, 10, 60, '#5FD4FF', 0.25); });
      if (k === 1) {
        finWing(4, 12, 11, -2.4, -1.4, 4); finWing(14, 14, 9, -2.0, -1.0, 4);
        const pts = bez([34, 30 + sw * 0.3], [40, 46], [-22, 46], [-20, 26], 18).concat(bez([-20, 26], [-18, 10], [4, 10], [0, -2], 10).slice(1));
        const G = geom(pts, u => u < 0.7 ? 3 + 17 * Math.pow(u / 0.7, 0.55) : 20 - 4 * (u - 0.7) / 0.3);
        dorsal(G, -1, 4, G.N - 6, 2, u => 4 + 2 * Math.sin(u * Math.PI));
        body(pts, u => u < 0.7 ? 3 + 17 * Math.pow(u / 0.7, 0.55) : 20 - 4 * (u - 0.7) / 0.3, 1);
        head(-1, -10, 1.15, Math.sin(t * 1.6) * 0.05);
        c.save(); c.globalAlpha = 0.9; orb(c, 14, -26, 5.5, 5.5, '#BFEFFF', { lw: 0.9, line: '#2A5AA8', specA: 0.85, hi: '#FFFFFF' }); c.restore();
        return;
      }
      // the coil: tail on the water, a rising body, an S-curved neck lifting the head
      const pts = k === 3
        ? bez([60, 30 + sw], [46, 48], [-36, 50], [-40, 28], 16).concat(bez([-40, 28], [-44, 6], [12, 10], [14, -14], 12).slice(1)).concat(bez([14, -14], [16, -34], [-12, -34], [-8, -54], 12).slice(1))
        : bez([50, 30 + sw], [40, 46], [-30, 46], [-32, 28], 14).concat(bez([-32, 28], [-36, 10], [10, 10], [10, -8], 10).slice(1)).concat(bez([10, -8], [11, -20], [-8, -22], [-6, -34], 8).slice(1));
      const wf = u => u < 0.5 ? 2.5 + (k === 3 ? 16 : 13) * Math.pow(u / 0.5, 0.6) : (k === 3 ? 18.5 : 15.5) - (k === 3 ? 7 : 5.5) * (u - 0.5) / 0.5;
      const G0 = geom(pts, wf), sh0 = G0.off(Math.floor(G0.N * 0.62), 0);
      const S = k === 3 ? 62 : 38, flap = Math.sin(t * 2.6) * 0.08;
      finWing(sh0[0] + 5, sh0[1] - 3, S * 0.9, -1.55 + flap, -0.2 + flap, k === 3 ? 8 : 6);
      dorsal(G0, -1, 3, G0.N - 8, 2, u => (k === 3 ? 7 : 5) * (0.5 + 0.5 * Math.sin(u * Math.PI)));
      body(pts, wf, 1);
      finWing(sh0[0] - 5, sh0[1] + 1, S, -3.05 - flap, -1.7 - flap, k === 3 ? 8 : 6);
      const end = pts[pts.length - 1];
      head(end[0], end[1] - (k === 3 ? 9 : 7), k === 3 ? 1.38 : 1.2, Math.sin(t * 1.6) * 0.05);
      // ribbons of water spiralling round the serpent, with droplets and bubbles
      L.fx(g => { g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
        const rib = (a0, rx, ry, cy, span, col) => { const P = []; for (let i = 0; i <= 24; i++) { const a = a0 + i / 24 * span; P.push([Math.cos(a) * rx, cy + Math.sin(a) * ry - i * (k === 3 ? 1.6 : 1.1)]); } [[7, 0.1, col], [3, 0.28, col], [1, 0.45, '#FFFFFF']].forEach(([w, a, cc]) => { g.globalAlpha = FA * a; g.strokeStyle = cc; g.lineWidth = w; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }); return P; };
        const P1 = rib(t * 0.9, k === 3 ? 58 : 44, 14, 34, 4.4, '#5FD4FF'), P2 = k === 3 ? rib(t * 0.9 + Math.PI, 50, 12, 16, 3.6, '#8FB8FF') : null;
        [P1, P2].forEach(P => { if (!P) return; for (let i = 0; i < 4; i++) { const q = P[(i * 6 + Math.floor(t * 8)) % P.length]; g.globalAlpha = FA * 0.8; blitSized(g, glowSprite('#DDF6FF'), q[0] - 3, q[1] - 3, 6, 6); } });
        for (let i = 0; i < 4 + k * 2; i++) { const ph = (t * 0.4 + i / (4 + k * 2)) % 1, x = -40 + i * (80 / (3 + k * 2)) + Math.sin(t + i) * 4, y = 36 - ph * 86; g.globalAlpha = FA * (0.8 * (1 - ph)); g.strokeStyle = '#DDF6FF'; g.lineWidth = 0.9; g.beginPath(); g.arc(x, y, 1.6 + (i % 3) * 0.8, 0, TAU); g.stroke(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x - 0.6, y - 0.6, 0.6, 0, TAU); g.fill(); }
        g.restore(); });
    },
    // Leviathan: twin koi of light and shadow, circling in a yin-yang; at last broken chains orbit them
    pisces(c, k, t, L) {
      const A = t * 1.3, R = 15 + k * 4, fl = [13, 18, 25][k - 1], ks = [1.25, 1.32, 1.42][k - 1];
      if (k >= 2) L.back(g => { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(0, 4); [[R + 18, '#EAF2FF'], [R + 18, '#6A5AB0']].forEach(([rr, col], i) => { const a0 = A * 0.8 + i * Math.PI; g.globalAlpha = FA * (0.5); g.strokeStyle = col; g.lineCap = 'round'; for (let j = 0; j < 3; j++) { g.lineWidth = [10, 5, 2][j]; g.globalAlpha = FA * ([0.12, 0.3, 0.8][j]); g.beginPath(); g.ellipse(0, 0, rr, rr * 0.78, 0, a0, a0 + 2.4); g.stroke(); } }); glow(g, 0, 0, R + 34, '#7A62D0', 0.45); g.restore(); });
      if (k === 3) L.fx(g => { for (let i = 0; i < 7; i++) { const a = -A * 0.55 + i / 7 * TAU, x = Math.cos(a) * (R + 32), y = 4 + Math.sin(a) * (R + 32) * 0.78; g.save(); g.translate(x, y); g.rotate(a + i); g.lineWidth = 2.6; g.strokeStyle = '#D9CEF0'; g.beginPath(); g.ellipse(0, 0, 4.8, 2.8, 0, 0.55, TAU - 0.55); g.stroke(); g.lineWidth = 0.9; g.strokeStyle = '#5A4A8A'; g.stroke(); g.restore(); if (i % 2) star4(g, x + 5, y, 1, '#EAF2FF', 0.6 + 0.4 * Math.sin(t * 4 + i)); } });
      const koi = (a, light) => {
        const x = Math.cos(a) * R, y = 4 + Math.sin(a) * R * 0.72, dir = a + Math.PI / 2, col = light ? '#F7F8FE' : '#2E2462', spots = light ? ['#FF7A5A', '#FF9FB8'] : ['#B9A6FF', '#6A5AB0'], finC = light ? '#FFFFFF' : '#6A5AB0';
        c.save(); c.translate(x, y); c.rotate(dir); c.scale(ks, ks);
        const sw = Math.sin(t * 6 + (light ? 0 : 2)) * 0.25;
        c.save(); c.translate(-13, 0); c.rotate(sw); [-1, 1].forEach(s => { form(c, blob(c, [[0, 0], [-fl * 0.6, s * fl * 0.5], [-fl * 1.2, s * fl * 0.32], [-fl * 0.95, s * fl * 0.05], [-fl * 0.5, s * 2]]), -fl * 0.55, s * 5, fl * 0.6, finC, { lw: 0.8, dk: light ? '#C9D0E6' : '#2A1E5C', hi: '#FFFFFF', specA: 0.3, soft: () => { c.strokeStyle = light ? 'rgba(150,160,200,.5)' : 'rgba(200,180,255,.4)'; c.lineWidth = 0.5; for (let j = 0; j < 5; j++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-fl * (0.7 + j * 0.1), s * fl * (0.1 + j * 0.09)); c.stroke(); } } }); }); c.restore();
        [-1, 1].forEach(s => form(c, blob(c, [[3, s * 5], [-5, s * (12 + k * 2)], [-10, s * 6.5]]), -3, s * 9, 6, finC, { lw: 0.7, dk: light ? '#C9D0E6' : '#2A1E5C', hi: '#FFFFFF', specA: 0.25 }));
        form(c, ell(c, 0, 0, 15, 9.5), 0, 0, 15, col, { tex: 'scale', texA: 0.4, dk: light ? '#BFC6DE' : '#140E30', hi: light ? '#FFFFFF' : '#7A6AC0', specA: 0.5, soft: () => { [[-4, -4, 4.2, 0], [4, 3, 3.2, 1], [-8, 3, 2.6, 0], [6, -4, 2.4, 1]].forEach(([sx2, sy2, r, j]) => soft(c, sx2, sy2, r * 1.3, r, 0, spots[j], 0.85)); } });
        c.save(); c.rotate(-dir); eye(c, Math.cos(dir) * 9 - Math.sin(dir) * 3, Math.sin(dir) * 9 + Math.cos(dir) * 3, 3.4, light ? '#7A4FD0' : '#FFD36B', { side: 1 }); c.restore();
        c.strokeStyle = light ? '#C9D0E6' : '#B9A6FF'; c.lineWidth = 1.1; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(14, s * 2); c.quadraticCurveTo(20, s * 6, 18 + Math.sin(t * 4) * 2, s * 10); c.stroke(); });
        c.restore();
        if (!light || k >= 2) L.fx(g => glow(g, x, y, 20, light ? '#EAF2FF' : '#B9A6FF', 0.3));
        if (k === 3) L.fx(g => glow(g, x + Math.cos(dir) * 12, y + Math.sin(dir) * 12, 7, light ? '#FFFFFF' : '#FFD36B', 0.35));
      };
      const a1 = A, a2 = A + Math.PI;
      if (Math.sin(a1) < Math.sin(a2)) { koi(a1, true); koi(a2, false); } else { koi(a2, false); koi(a1, true); }
      if (k >= 2) L.fx(g => { for (let i = 0; i < 6; i++) { const a = A * 1.4 + i; star4(g, Math.cos(a) * (R + 12), 4 + Math.sin(a) * (R + 12) * 0.7, 1, '#EAF2FF', 0.6); } });
    },
  };

  /* ---- compositing ---- */
  const BOX = { x0: -98, x1: 98, y0: -116, y1: 54 };
  let cvA, cvB, cvC, grainP = null;
  const layerCv = (cv, w, h) => { if (!cv) cv = document.createElement('canvas'); if (cv.width < w) cv.width = w; if (cv.height < h) cv.height = h; return cv; };
  function grain(ctx) { if (grainP) return grainP; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), im = g.createImageData(64, 64), R = mulberry32(99); for (let i = 0; i < im.data.length; i += 4) { const v = R() < 0.5 ? 0 : 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 40 + R() * 150; } g.putImageData(im, 0, 0); grainP = ctx.createPattern(cv, 'repeat'); return grainP; }
  // the lighting pass over the painted silhouette
  function lightPass(W, H, s, A, k) {
    const a = cvA.getContext('2d'), b = cvB.getContext('2d'), d = cvC.getContext('2d'), off = Math.max(1, 1.15 * s);
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H); b.drawImage(cvA, 0, 0, W, H, 0, 0, W, H);
    b.globalCompositeOperation = 'destination-out'; b.drawImage(cvA, 0, 0, W, H, off * 1.1, off * 1.4, W, H);
    b.globalCompositeOperation = 'source-in'; b.fillStyle = mix(A.glow, '#FFFFFF', 0.55); b.fillRect(0, 0, W, H);
    d.setTransform(1, 0, 0, 1, 0, 0); d.globalAlpha = 1; d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H); d.drawImage(cvA, 0, 0, W, H, 0, 0, W, H);
    d.globalCompositeOperation = 'destination-out'; d.drawImage(cvA, 0, 0, W, H, -off * 1.7, -off * 1.4, W, H);
    d.globalCompositeOperation = 'source-in'; d.fillStyle = '#140A22'; d.fillRect(0, 0, W, H);
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-atop';
    const feet = H * (40 - BOX.y0) / (BOX.y1 - BOX.y0), ao = a.createLinearGradient(0, feet - H * 0.3, 0, feet + H * 0.05); ao.addColorStop(0, 'rgba(18,8,36,0)'); ao.addColorStop(1, 'rgba(18,8,36,.4)'); a.fillStyle = ao; a.fillRect(0, 0, W, H);
    const side = a.createLinearGradient(W * 0.3, H * 0.2, W, H * 0.7); side.addColorStop(0, 'rgba(18,8,36,0)'); side.addColorStop(1, 'rgba(18,8,36,.2)'); a.fillStyle = side; a.fillRect(0, 0, W, H);
    const key = a.createLinearGradient(0, 0, W * 0.55, H * 0.6); key.addColorStop(0, 'rgba(255,246,230,.14)'); key.addColorStop(1, 'rgba(255,246,230,0)'); a.fillStyle = key; a.fillRect(0, 0, W, H);
    a.globalAlpha = 0.07; a.fillStyle = grain(a); a.fillRect(0, 0, W, H); a.globalAlpha = 1;
    a.globalCompositeOperation = 'source-over'; a.globalAlpha = 0.5; a.drawImage(cvC, 0, 0, W, H, 0, 0, W, H);
    d.fillStyle = A.glow; d.fillRect(0, 0, W, H);
    a.globalCompositeOperation = 'lighter'; a.globalAlpha = 0.2 + k * 0.08; a.drawImage(cvC, 0, 0, W, H, 0, 0, W, H);
    a.globalAlpha = 0.42; a.drawImage(cvB, 0, 0, W, H, 0, 0, W, H);
    a.globalAlpha = 1; a.globalCompositeOperation = 'source-over';
  }
  /* ---- life: how each Anima moves and strikes. A pose (o.mv speed 0..1, o.ph stride phase, o.atk 0..1 strike progress)
     bends the painted model: the body bobs and leans, the legs step in alternation (the lower band of the model is cut in
     two and each half lifts and swings), swimmers undulate, flyers bank, and strikes wind up, lunge and recover ---- */
  const LOCO = { aries: 'trot', taurus: 'stomp', gemini: 'float', cancer: 'scuttle', leo: 'float', virgo: 'fly', libra: 'hop', scorpio: 'scuttle', sagittarius: 'gallop', capricorn: 'swim', aquarius: 'swim', pisces: 'swim', ophiuchus: 'fly' };
  const STRIKE = { aries: 'lunge', taurus: 'lunge', gemini: 'cast', cancer: 'lunge', leo: 'lunge', virgo: 'cast', libra: 'cast', scorpio: 'lunge', sagittarius: 'shoot', capricorn: 'cast', aquarius: 'cast', pisces: 'lunge', ophiuchus: 'cast' };
  const GAIT = { trot: { bob: 2.6, lift: 4.5, stride: 2.6, lean: 0.05 }, stomp: { bob: 1.6, lift: 3.4, stride: 2, lean: 0.03, thud: 1 }, gallop: { bob: 3.2, lift: 5, stride: 3.4, lean: 0.04, rock: 0.05 }, scuttle: { bob: 0.6, lift: 2.4, stride: 1.6, lean: 0.02, jitter: 0.9 } };
  const ease = u => u * u * (3 - 2 * u);
  const IDLE_SEED = { aries: 0.3, taurus: 2.1, gemini: 1.2, cancer: 3.3, leo: 0.9, virgo: 2.7, libra: 1.6, scorpio: 3.9, sagittarius: 0.5, capricorn: 2.4, aquarius: 1.9, pisces: 3.1, ophiuchus: 1.4 };
  function poseOf(id, k, t, o) {
    const mv = clamp(o.mv || 0, 0, 1), ph = o.ph || 0, loco = LOCO[id], G = GAIT[loco], P = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, legs: null, wave: 0, wph: 0, glow: 0, bend: 0 };
    // breathing, always, with the head swaying a touch on its own rhythm
    const br = Math.sin(t * 2.3); P.sy += br * 0.024; P.sx -= br * 0.013; P.bend += Math.sin(t * 1.3 + 0.7) * 1.6 + Math.sin(t * 3.1) * 0.6;
    // idle fidgets: every few seconds a standing Anima hops, wiggles, looks about or has a stretch
    const seed = IDLE_SEED[id] || 0, cyc = 4.6, n = Math.floor((t + seed) / cyc), iu = ((t + seed) % cyc) / 0.95, still = (1 - mv) * (o.atk == null ? 1 : 0);
    if (iu < 1 && still > 0.05) {
      const w = Math.sin(iu * Math.PI) * still;
      switch ((n + seed | 0) % 4) {
        case 0: { const hop = Math.max(0, Math.sin(iu * Math.PI * 2)) * (iu < 0.5 ? 1 : 0.45); P.dy -= hop * 7 * still; const land = Math.pow(Math.max(0, 1 - Math.abs(iu - 0.5) * 6), 2) + Math.pow(Math.max(0, 1 - Math.abs(iu - 1) * 6), 2); P.sy -= land * 0.07 * still; P.sx += land * 0.06 * still; break; }
        case 1: P.rot += Math.sin(iu * Math.PI * 5) * 0.08 * w; P.dx += Math.sin(iu * Math.PI * 5) * 1.5 * w; break;
        case 2: P.bend += Math.sin(iu * Math.PI * 2) * 7 * w; P.rot -= Math.sin(iu * Math.PI * 2) * 0.03 * w; break;
        default: P.sy += 0.07 * w; P.sx -= 0.045 * w; P.bend -= 2.5 * w; P.rot -= 0.04 * w;
      }
    }
    if (G && !o.rig3d) {
      const b = Math.abs(Math.sin(ph)); P.dy -= b * G.bob * mv; P.rot += G.lean * mv + (G.rock ? Math.sin(ph * 2) * G.rock * mv : 0);
      if (G.thud) { const land = Math.pow(1 - b, 6); P.sy -= land * 0.04 * mv; P.sx += land * 0.03 * mv; }
      if (G.jitter) P.dx += Math.sin(ph * 3.1) * G.jitter * mv;
      const f = loco === 'scuttle' ? 2 : 1;
      P.legs = { lift: [0, 1].map(i => Math.max(0, Math.sin(ph * f + i * Math.PI)) * G.lift * mv), stride: [0, 1].map(i => -Math.cos(ph * f + i * Math.PI) * G.stride * mv), bob: b * G.bob * mv };
    } else if (G) {
    } else if (loco === 'hop') {
      const hop = Math.max(0, Math.sin(ph)), land = Math.pow(1 - Math.abs(Math.sin(ph)), 5);
      P.dy -= hop * 8 * mv; P.sy += (hop * 0.06 - land * 0.07) * mv; P.sx += (land * 0.06 - hop * 0.03) * mv; P.rot += 0.05 * mv * Math.sin(ph);
    } else if (loco === 'fly') {
      P.dy += Math.sin(t * 1.6) * 4 - mv * 2.5; P.dx += Math.sin(t * 0.8) * 2; P.rot += 0.14 * mv + Math.sin(t * 1.6 + 1) * 0.05; P.sy += Math.sin(t * 3.2) * 0.02;
    } else if (loco === 'float') {
      P.dy += Math.sin(t * 1.4) * 3.4; P.dx += Math.sin(t * 0.7 + 1) * 1.6; P.rot += 0.08 * mv + Math.sin(t * 1.4 + 0.6) * 0.045 * (0.5 + mv); P.sx += Math.sin(t * 2.8) * 0.018;
    } else if (loco === 'swim') {
      P.wave = 2.2 + 3 * mv; P.wph = ph; P.dy += Math.sin(t * 1.3) * 2.8; P.rot += 0.06 * mv + Math.sin(t * 1.1) * 0.035;
    }
    // airborne Animas bank as they travel; everyone squashes as they land, and the top of the body follows through
    if (!G && loco !== 'hop' && o.vx) P.rot += clamp(o.vx * 0.025, -0.12, 0.12) * (o.flip ? -1 : 1);
    if (o.sq > 0) { const q = Math.sin(o.sq * Math.PI) * o.sq; P.sy -= q * 0.16; P.sx += q * 0.13; }
    if (o.fall > 0) { P.sy += o.fall * 0.06; P.sx -= o.fall * 0.04; P.rot += Math.sin(t * 3) * 0.04 * o.fall; }
    if (o.lag) P.bend += o.lag * (o.flip ? -1 : 1);
    // a strike: wind up, lunge (or rise and flare, or recoil from the bowstring), recover
    if (o.atk != null && o.atk >= 0 && o.atk <= 1 && o.rig3d) { const u = o.atk; P.glow = (u < 0.3 ? 0 : u < 0.5 ? (u - 0.3) / 0.2 : 1 - (u - 0.5) / 0.5) * (o.atkBig ? 1.6 : 1); }
    else if (o.atk != null && o.atk >= 0 && o.atk <= 1) {
      const u = o.atk, big = o.atkBig ? 1.6 : 1, st = STRIKE[id];
      const wind = u < 0.3 ? ease(u / 0.3) : u < 0.42 ? 1 - ease((u - 0.3) / 0.12) : 0, hitp = u < 0.3 ? 0 : u < 0.5 ? ease((u - 0.3) / 0.2) : 1 - ease((u - 0.5) / 0.5);
      if (st === 'lunge') { P.dx += (-4 * wind + 9 * hitp) * big; P.sx *= 1 + (0.05 * wind + 0.07 * hitp) * big; P.sy *= 1 - (0.06 * wind + 0.03 * hitp) * big; P.rot += (-0.08 * wind + 0.1 * hitp) * big; }
      else if (st === 'shoot') { P.dx += (-1.5 * wind - 5 * hitp) * big; P.rot += (-0.06 * wind - 0.05 * hitp) * big; P.sy *= 1 + 0.03 * wind; }
      else { P.dy -= (3 * wind + 6 * hitp) * big; P.sx *= 1 + 0.06 * hitp * big; P.sy *= 1 + 0.08 * hitp * big; P.rot += (-0.07 * wind + 0.04 * hitp) * big; }
      P.glow = hitp * big;
    }
    return P;
  }
  // put the painted layer on the canvas, bent by the pose
  function blit(c, x, y, u, dpr, W, H, fl, P) {
    const X0 = x + BOX.x0 * u, Y0 = y + (BOX.y0 - 40) * u, sy = v => (v - BOX.y0) * u * dpr;
    if (P.wave) {   // swimmers: rows slide on a travelling wave
      const N = 14, rh = H / N;
      for (let i = 0; i < N; i++) { const yU = BOX.y0 + (i + 0.5) / N * (BOX.y1 - BOX.y0), off = Math.sin(P.wph - yU * 0.075) * P.wave * u * fl; c.drawImage(cvA, 0, i * rh, W, rh + 1, X0 + off, Y0 + i * rh / dpr, W / dpr, (rh + 1) / dpr); }
      return;
    }
    if (!P.legs) { c.drawImage(cvA, 0, 0, W, H, X0, Y0, W / dpr, H / dpr); return; }
    // walkers: the body above the knees rides the bob; below, each half of the model steps on its own
    const yb = 22, top = sy(yb), mid = W / 2, ov = 3 * u * dpr, L = P.legs, N = 5;
    c.drawImage(cvA, 0, 0, W, top, X0, Y0, W / dpr, top / dpr);
    [0, 1].forEach(i => {
      const sx0 = i ? mid - ov : 0, sw = i ? W - mid + ov : mid + ov, lift = L.lift[fl > 0 ? i : 1 - i], stride = L.stride[fl > 0 ? i : 1 - i];
      for (let j = 0; j < N; j++) {
        const a0 = j / N, a1 = (j + 1) / N, s0 = top + (H - top) * a0, s1 = top + (H - top) * a1, ya = yb + (BOX.y1 - yb) * a0, yc = yb + (BOX.y1 - yb) * a1;
        const w0 = clamp((ya - yb) / (40 - yb), 0, 1), w1 = clamp((yc - yb) / (40 - yb), 0, 1), d0 = (lift - L.bob) * w0, d1 = (lift - L.bob) * w1, offx = stride * Math.pow((w0 + w1) / 2, 1.4) * u * fl;
        c.drawImage(cvA, sx0, s0, sw, s1 - s0 + 0.5, X0 + sx0 / dpr + offx, Y0 + s0 / dpr - d0 * u, sw / dpr, (s1 - s0) / dpr + (d0 - d1) * u + 0.5);
      }
    });
  }
  /* ---- Ophiuchus, the thirteenth: Bahamut at peace. It is painted by its own fight's painter (the gyroscope of golden
     rings, the little fish, the feathered wings, the tentacles of light) drawn small; its early forms have fewer rings,
     tentacles and smaller wings. In menus a pose is a pure function of time; in the Tower each summoned one keeps its own
     state (o.inst) so its rings can wind up and align for its Final Judgement, and it is painted onto its own small canvas
     thirty times a second and that picture put on the screen in between ---- */
  // its model units per `size`, and how far its picture reaches from the gyroscope's centre in each form (half its
  // width, above, below: measured over a wingbeat and a turn), so its cached picture never clips a wing
  const OPH = { shared: {}, scale: [0, 6.8, 8.6, 11.4], box: [null, [8.6, 5.2, 4.4], [11.2, 7.0, 5.3], [13.9, 12.0, 5.9]] };
  function ophMini() { try { return FIEND_DEFS.bahamut.mini; } catch (e) { return null; } }
  function drawOph(c, k, x, y, size, t, o) {
    // it is a true model: it never mirrors or flattens to turn round, it turns in three dimensions toward where it faces
    const D = ophMini(), u = size / 110, fl = 1, alpha = o.alpha == null ? 1 : o.alpha, A = ANIMAS.ophiuchus, fk = o.fk != null ? o.fk : o.flip ? -1 : null, yaw = fk == null ? 0 : -clamp(fk, -1, 1) * 0.42;
    const PZ = poseOf('ophiuchus', k, t, Object.assign({}, o, { rig3d: true }));
    const space = () => { c.translate(x, y); c.scale(u * fl, u); c.translate(0, -40); c.globalAlpha = alpha; };
    FA = alpha * (o.auraA == null ? 1 : o.auraA); c.save(); space(); if (o.aura !== false) auraBack(c, 'ophiuchus', k, t); c.restore(); FA = alpha;
    if (D) {
      const T = size / OPH.scale[k], cx = x + PZ.dx * u * fl, cy = y + PZ.dy * u - size * 0.5, q = o.q != null ? o.q : size > 150 ? 1 : 0;
      if (o.bloom) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * 0.35; const gs = size * 0.8; blitSized(c, glowSprite(A.glow), cx - gs, cy - gs, gs * 2, gs * 2); c.restore(); }
      const inst = o.inst, S = inst ? (inst._oph && inst._oph.k === k ? inst._oph : (inst._oph = { k, M: D.make({ k }), t, cv: null, rt: -9 })) : (OPH.shared[k] || (OPH.shared[k] = { M: D.make({ k }) }));
      const M = S.M; M.lite = T < 9; M.yaw = yaw;
      if (inst) { const dt = clamp(t - S.t, 0, 0.1); S.t = t; M.charge = o.charge || 0; M.align = o.align || 0; M.alignAx = o.alignAx; D.step(M, dt); }
      else D.pose(M, t, o);
      if (inst) {
        const dpr = Math.min(2, o.dpr || (typeof arc !== 'undefined' && arc.dpr) || window.devicePixelRatio || 1), BX = OPH.box[k], bw = Math.ceil(T * BX[0] * 2), bh = Math.ceil(T * (BX[1] + BX[2])), ox = bw / 2, oy = T * BX[1], W = Math.ceil(bw * dpr), H = Math.ceil(bh * dpr);
        if (!S.cv) S.cv = document.createElement('canvas');
        const fresh = S.cv.width !== W || S.cv.height !== H;
        if (fresh || t - S.rt >= 1 / 30 || t < S.rt) {
          if (fresh) { S.cv.width = W; S.cv.height = H; }
          const g = S.cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.setTransform(dpr, 0, 0, dpr, 0, 0);
          D.draw(g, M, ox, oy, T, { q }); S.rt = t;
        }
        c.save(); c.globalAlpha = alpha; c.drawImage(S.cv, cx - ox, cy - oy, bw, bh); c.restore();
      } else { c.save(); D.draw(c, M, cx, cy, T, { q }); c.restore(); }
    }
    c.save(); space(); FA = alpha * (o.auraA == null ? 1 : o.auraA); if (o.aura !== false) auraFront(c, 'ophiuchus', k, t); c.restore(); FA = 1;
  }
  /* draw an Anima with its feet at (x, y), `size` px tall, facing left when flip */
  function draw(c, id, k, x, y, size, t, o) {
    o = o || {}; if (!(size > 2)) return;
    k = clamp(k | 0, 1, 3); t = t || 0;
    if (id === 'ophiuchus') return drawOph(c, k, x, y, size, t, o);
    if (typeof Anima3D !== 'undefined' && Anima3D.has(id) && !o.legacy) return draw3d(c, id, k, x, y, size, t, o);
    const p = P[id]; if (!p) return;
    const u = size / 110, fl = o.flip ? -1 : 1, A = ANIMAS[id], L = { b: [], f: [], back(fn) { this.b.push(fn); }, fx(fn) { this.f.push(fn); } };
    const dpr = o.dpr || Math.min(1.5, (typeof arc !== 'undefined' && arc.dpr) || window.devicePixelRatio || 1);
    const W = Math.ceil((BOX.x1 - BOX.x0) * u * dpr), H = Math.ceil((BOX.y1 - BOX.y0) * u * dpr);
    cvA = layerCv(cvA, W, H); cvB = layerCv(cvB, W, H); cvC = layerCv(cvC, W, H);
    const a = cvA.getContext('2d'); a.setTransform(1, 0, 0, 1, 0, 0); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; a.clearRect(0, 0, W, H);
    a.setTransform(u * dpr * fl, 0, 0, u * dpr, -BOX.x0 * u * dpr, -BOX.y0 * u * dpr); a.lineJoin = 'round'; a.lineCap = 'round';
    MIR = fl; BLINK = clamp(o.blink > 0 ? Math.sin(o.blink * Math.PI) * 1.15 : 0, 0, 1); try { p(a, k, t, L); } finally { MIR = 1; BLINK = 0; }
    lightPass(W, H, u * dpr, A, k);
    const alpha = o.alpha == null ? 1 : o.alpha; FA = alpha; const space = () => { c.translate(x, y); c.scale(u * fl, u); c.translate(0, -40); c.globalAlpha = alpha; };
    const PZ = poseOf(id, k, t, o), kL = clamp(PZ.bend / (40 - BOX.y0), -0.12, 0.12), bend = () => { c.translate(0, 40); c.translate(PZ.dx, PZ.dy); c.rotate(PZ.rot); c.scale(PZ.sx, PZ.sy); if (kL) c.transform(1, 0, -kL, 1, 0, 0); c.translate(0, -40); };
    c.save(); space(); FA = alpha * (o.auraA == null ? 1 : o.auraA); if (o.aura !== false) auraBack(c, id, k, t); FA = alpha; bend(); L.b.forEach(f => { c.save(); f(c); c.restore(); }); c.restore();
    c.save(); c.globalAlpha = alpha; if (o.bloom) { c.shadowColor = rgba(A.glow, 0.75); c.shadowBlur = o.bloom; }
    c.translate(x + PZ.dx * u * fl, y + PZ.dy * u); c.rotate(PZ.rot * fl); c.scale(PZ.sx, PZ.sy); if (kL) c.transform(1, 0, -kL * fl, 1, 0, 0); c.translate(-x, -y);
    blit(c, x, y, u, dpr, W, H, fl, PZ);   // the legs undo the bob, so planted feet stay on the ground
    if (PZ.glow > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * PZ.glow * 0.5; const gs = size * 0.7; blitSized(c, glowSprite(A.glow), x + 22 * u * fl - gs, y - size * 0.45 - gs, gs * 2, gs * 2); }
    c.restore();
    c.save(); space(); bend(); MIR = fl; L.f.forEach(f => { c.save(); f(c); c.restore(); }); MIR = 1; c.restore();
    c.save(); space(); FA = alpha * (o.auraA == null ? 1 : o.auraA); if (o.aura !== false) auraFront(c, id, k, t); c.restore(); FA = 1;
  }
  /* the cel-shaded 3D models: the same aura, the same pose (breathing, fidgets, follow-through, squash), real limbs */
  function draw3d(c, id, k, x, y, size, t, o) {
    const u = size / 110, fl = o.flip ? -1 : 1, alpha = o.alpha == null ? 1 : o.alpha, A = ANIMAS[id];
    const PZ = poseOf(id, k, t, Object.assign({}, o, { rig3d: true })), kL = clamp(PZ.bend / (40 - BOX.y0), -0.12, 0.12);
    const space = () => { c.translate(x, y); c.scale(u * fl, u); c.translate(0, -40); c.globalAlpha = alpha; };
    FA = alpha * (o.auraA == null ? 1 : o.auraA); c.save(); space(); if (o.aura !== false) auraBack(c, id, k, t); c.restore(); FA = alpha;
    c.save();
    c.translate(x + PZ.dx * u * fl, y + PZ.dy * u); c.rotate(PZ.rot * fl); c.scale(PZ.sx, PZ.sy); if (kL) c.transform(1, 0, -kL * fl, 1, 0, 0); c.translate(-x, -y);
    if (o.bloom) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * 0.35; const gs = size * 0.75; blitSized(c, glowSprite(A.glow), x - gs, y - size * 0.42 - gs, gs * 2, gs * 2); c.restore(); }
    Anima3D.draw(c, id, k, x, y, size, t, Object.assign({}, o, { blink: o.blink > 0 ? clamp(Math.sin(o.blink * Math.PI) * 1.15, 0, 1) : 0 }));
    if (PZ.glow > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * PZ.glow * 0.45; const gs = size * 0.7; blitSized(c, glowSprite(A.glow), x + 22 * u * fl - gs, y - size * 0.45 - gs, gs * 2, gs * 2); }
    c.restore();
    c.save(); space(); FA = alpha * (o.auraA == null ? 1 : o.auraA); if (o.aura !== false) auraFront(c, id, k, t); c.restore(); FA = 1;
  }
  /* the zodiac glyph */
  const gp = {};
  function sigil(c, id, x, y, size, col, a, w) { if (!gp[id]) gp[id] = new Path2D(ZODIAC_GLYPH[id]); const kk = size / 24; c.save(); c.translate(x - size / 2, y - size / 2); c.scale(kk, kk); c.globalAlpha = a == null ? 1 : a; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col || '#FFFFFF'; c.lineWidth = (w || 2.2); c.stroke(gp[id]); c.restore(); }
  const sigilSVG = (id, col) => `<svg class="sigil" viewBox="0 0 24 24" aria-hidden="true"><path d="${ZODIAC_GLYPH[id]}" fill="none" stroke="${col || 'currentColor'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  /* a still picture of the model, cached (a canvas, and a data URL for menus) */
  const stills = new Map(), pics = new Map();
  function still(id, k, px, o) {
    o = o || {}; const key = id + k + '|' + px + (o.aura === false ? 'n' : ''); let cv = stills.get(key); if (cv) return cv;
    const dpr = 2, w = Math.round(px * 1.3), h = Math.round(px * 1.3); cv = document.createElement('canvas'); cv.width = w * dpr; cv.height = h * dpr;
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const fy = h * 0.86; c.fillStyle = 'rgba(20,10,40,.22)'; c.beginPath(); c.ellipse(w / 2, fy, px * 0.34, px * 0.065, 0, 0, TAU); c.fill();
    draw(c, id, k, w / 2, fy, px * 0.78, 0.7, { dpr, bloom: o.bloom == null ? px * 0.06 : o.bloom, aura: o.aura, yaw: 0.42 });
    stills.set(key, cv); return cv;
  }
  function picture(id, k, px) { const key = id + k + '|' + px; let u = pics.get(key); if (u) return u; u = still(id, k, px).toDataURL(); pics.set(key, u); return u; }
  return { draw, sigil, sigilSVG, still, picture, P, LOCO, STRIKE, T: { TAU, sh, rgba, mix, inkOf, lit, spec, form, orb, ell, blob, furPath, cloud, ribbon, bez, soft, limb, metalG, plate, gem, coin, eye, flame, glow, star4, ringLight, bolt, rose, leaf, tex, grain, FIRE, GOLDFIRE } };
})();
