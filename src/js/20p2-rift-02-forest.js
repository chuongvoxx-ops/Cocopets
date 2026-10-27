/* ---------- Rift 2, the Garden of Unborn Stars: a real forest, and bridges of thorned vine ----------
   Trees and plants (all blocking props, cached as sprites):
     eggtree     a broad twisted tree, deep jade crown, cream eggs hanging from it on threads, glowing gold
     weepwillow  a dome of a willow whose strands hang to the ground, beaded with little gold lights
     thornpine   a tall dark conifer of jagged spiked tiers, rose tips on every point
     bulbtree    a swollen bottle-trunked tree whose curling arms end in glowing rose bulbs
     giantfern   a waist-high fan of big saw-edged fronds
     glowcaps    three tall mushrooms with glowing undersides
     starlily    a clump of broad leaves holding three big glowing star lilies
     thornbush   a round spiked bush with rose berries
     mossrock    a mossy boulder with sprigs growing from it
   The floor grows undergrowth between them (grass tufts, star flowers, fern sprigs, roots, moss), and every bridge
   in the rift is a braid of green vines with thorns sticking out over the drop and tendrils hanging under it. */
(() => {
  const TAU = Math.PI * 2, B = BIOMES.garden;
  const { PROPS } = DunWorld, { LN, shade } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const rnd = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, rx, ry, a || 0, 0, TAU); };
  const ink = (c, lw) => { c.strokeStyle = LN; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const shadow = (c, T, rx, ry) => { c.fillStyle = 'rgba(18,6,26,.38)'; ell(c, 0, T * 0.04, T * rx, T * (ry || rx * 0.32)); c.fill(); };
  const glow = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const GOLD = '#FFD36B', CREAM = '#F2D8A1', ROSE = '#E07BA8';

  /* ---- shared pieces ---- */
  // a tapered, curving trunk from the feet up; lit on the left, grooved bark; returns the top
  function trunk(c, T, h, wb, wt, lean, col, lw) {
    const tx = lean * T, H = h * T;
    c.beginPath(); c.moveTo(-wb * T, 0); c.bezierCurveTo(-wb * T * 0.45, -H * 0.3, -wt * T + tx * 0.5, -H * 0.7, -wt * T + tx, -H);
    c.lineTo(wt * T + tx, -H); c.bezierCurveTo(wt * T + tx * 0.5, -H * 0.7, wb * T * 0.45, -H * 0.3, wb * T, 0); c.closePath();
    const g = c.createLinearGradient(-wb * T, 0, wb * T, 0); g.addColorStop(0, shadeC(col, 0.28)); g.addColorStop(0.42, col); g.addColorStop(1, shadeC(col, -0.5));
    c.fillStyle = g; c.fill(); ink(c, lw);
    c.strokeStyle = shadeC(col, -0.45); c.lineWidth = lw * 0.7;
    for (const k of [-0.45, 0.05, 0.5]) { c.beginPath(); c.moveTo(k * wb * T, -T * 0.06); c.quadraticCurveTo(k * wb * T * 0.7 + tx * 0.3, -H * 0.5, k * wt * T + tx, -H * 0.96); c.stroke(); }
    return { x: tx, y: -H };
  }
  // flared roots gripping the ground
  function roots(c, T, col, lw, n) {
    for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1, k = 0.18 + (i >> 1) * 0.16;
      c.beginPath(); c.moveTo(s * T * 0.08, -T * (0.32 - k * 0.3)); c.quadraticCurveTo(s * T * (0.3 + k), -T * 0.2, s * T * (0.42 + k * 1.1), T * 0.04);
      c.lineWidth = T * 0.13 + lw * 2; c.strokeStyle = LN; c.lineCap = 'round'; c.stroke(); c.lineWidth = T * 0.13; c.strokeStyle = shadeC(col, -0.1 - k * 0.3); c.stroke(); }
  }
  // a leafy blob with a scalloped edge
  function scallop(c, x, y, r, n, ph) { c.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, rr = r * (1 + 0.09 * Math.sin(a * n + ph)); i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
  // a crown of leaves: an inked dark mass, a lit layer above it, then highlights and a rim of leaf flecks
  function crown(c, T, blobs, dark, mid, light, lw, R) {
    for (const [x, y, r] of blobs) { scallop(c, x * T, y * T, r * T, 9, x * 5); c.fillStyle = dark; c.fill(); ink(c, lw); }
    for (const [x, y, r] of blobs) { scallop(c, x * T - r * T * 0.08, y * T - r * T * 0.12, r * T * 0.8, 9, x * 5 + 1); c.fillStyle = shade(c, mid, r * T, x * T - r * T * 0.3, y * T - r * T * 0.4, 0.4); c.fill(); }
    for (const [x, y, r] of blobs) { scallop(c, x * T - r * T * 0.3, y * T - r * T * 0.36, r * T * 0.36, 7, y); c.fillStyle = light; c.globalAlpha = 0.55; c.fill(); c.globalAlpha = 1; }
    // leaf flecks round the lower edge, so the crown reads as many leaves
    c.fillStyle = shadeC(dark, -0.25);
    for (const [x, y, r] of blobs) for (let i = 0; i < 5; i++) { const a = 0.3 + R() * 2.5; ell(c, x * T + Math.cos(a) * r * T * 0.7, y * T + Math.sin(a) * r * T * 0.7, T * 0.07, T * 0.035, a); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (const [x, y, r] of blobs) for (let i = 0; i < 3; i++) { const a = -2.4 + R() * 1.4; ell(c, x * T + Math.cos(a) * r * T * 0.55, y * T + Math.sin(a) * r * T * 0.55, T * 0.06, T * 0.03, a + 1.2); c.fill(); }
  }
  // a hanging egg on a thread, glowing
  function egg(c, T, x, y0, y1, lw) {
    c.strokeStyle = 'rgba(242,216,161,.7)'; c.lineWidth = Math.max(1, lw * 0.5); c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
    glow(c, x, y1 + T * 0.1, T * 0.45, GOLD, 0.55);
    ell(c, x, y1 + T * 0.1, T * 0.1, T * 0.13); c.fillStyle = shade(c, CREAM, T * 0.13, x - T * 0.03, y1 + T * 0.05, 0.3); c.fill(); ink(c, lw * 0.7);
    c.fillStyle = 'rgba(255,255,255,.75)'; ell(c, x - T * 0.03, y1 + T * 0.05, T * 0.03, T * 0.04); c.fill();
  }

  /* ---- the trees ---- */
  PROPS.eggtree = (c, T, v) => { const lw = lw0(T), R = rnd(11 + v * 131), lean = (v % 2 ? 1 : -1) * 0.12;
    shadow(c, T, 1.15, 0.36); roots(c, T, '#4A2E44', lw, 4);
    trunk(c, T, 1.75, 0.3, 0.16, lean, '#5A3652', lw);
    // two limbs up into the crown
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(lean * T * 0.7, -T * 1.4); c.quadraticCurveTo(s * T * 0.35, -T * 1.7, s * T * 0.6, -T * 2.0); c.lineWidth = T * 0.12 + lw * 2; c.strokeStyle = LN; c.stroke(); c.lineWidth = T * 0.12; c.strokeStyle = '#4A2E44'; c.stroke(); }
    const blobs = [[0, -2.45, 0.82], [-0.78, -2.05, 0.6], [0.78, -2.1, 0.62], [-0.35, -3.0, 0.58], [0.42, -2.95, 0.56]];
    crown(c, T, blobs, '#173D34', ['#2E7A5C', '#3A7A62', '#2F6F66', '#3D8A5E'][v], '#8FD8A4', lw, R);
    // a rose blush in the crown
    c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(224,123,168,.14)'; ell(c, T * 0.5, -T * 2.0, T * 0.9, T * 0.5); c.fill(); c.restore();
    for (const [x, y] of [[-0.62, -1.55], [0.55, -1.62], [0.05, -1.82], [0.95, -1.78], [-1.0, -1.72]].slice(0, 3 + (v % 3))) egg(c, T, x * T, y * T - T * 0.2, y * T + T * 0.1, lw);
  };
  PROP_EXT.eggtree = [3.6, 4.2];

  PROPS.weepwillow = (c, T, v) => { const lw = lw0(T), R = rnd(23 + v * 71);
    shadow(c, T, 1.25, 0.38); roots(c, T, '#4A3446', lw, 2);
    trunk(c, T, 1.6, 0.24, 0.14, (v % 2 ? 0.1 : -0.08), '#5E4258', lw);
    crown(c, T, [[0, -2.25, 0.8], [-0.62, -1.95, 0.56], [0.62, -1.95, 0.56], [0, -2.85, 0.5]], '#1C4436', '#3F8A5E', '#9BE0A8', lw, R);
    // hanging strands, outlined, then the lit strand on top; gold beads of light along them
    const strands = []; for (let i = -10; i <= 10; i++) { const x = i * 0.12 + (R() - 0.5) * 0.05, top = -2.0 + Math.abs(i) * 0.03, bot = -0.45 - R() * 0.5 - (Math.abs(i) > 7 ? -0.15 : 0); strands.push([x, top, bot, (R() - 0.5) * 0.12]); }
    for (const pass of [0, 1]) for (const [x, top, bot, sw] of strands) { c.beginPath(); c.moveTo(x * T, top * T); c.quadraticCurveTo((x + sw) * T, (top + bot) / 2 * T, (x + sw * 1.6 + x * 0.12) * T, bot * T);
      if (!pass) { c.strokeStyle = LN; c.lineWidth = T * 0.07 + lw; } else { c.strokeStyle = Math.abs(x) < 0.5 ? '#4E9A64' : '#5FB072'; c.lineWidth = T * 0.07; } c.lineCap = 'round'; c.stroke(); }
    for (const [x, top, bot, sw] of strands) if (R() < 0.45) { const u = 0.4 + R() * 0.5, px = (x + sw * u * 1.2 + x * 0.12 * u) * T, py = (top + (bot - top) * u) * T; glow(c, px, py, T * 0.22, GOLD, 0.6); c.fillStyle = '#FFF1B8'; c.beginPath(); c.arc(px, py, T * 0.035, 0, TAU); c.fill(); }
  };
  PROP_EXT.weepwillow = [3.4, 3.8];

  PROPS.thornpine = (c, T, v) => { const lw = lw0(T), R = rnd(37 + v * 53), H = 3.2 + (v % 2) * 0.25;
    shadow(c, T, 0.8, 0.3); trunk(c, T, 0.7, 0.16, 0.12, 0, '#4A2E44', lw);
    // jagged tiers, widest at the bottom; each a fan of spikes
    const tiers = 5;
    for (let t = 0; t < tiers; t++) { const yb = -(0.5 + t * (H - 0.9) / tiers) * T, w = (1.05 - t * 0.17) * T, ht = (H - 0.5) / tiers * 1.55 * T, n = 7 - Math.floor(t / 2);
      c.beginPath(); c.moveTo(-w, yb);
      for (let i = 0; i <= n; i++) { const u = i / n, px = -w + u * w * 2, sag = Math.sin(u * Math.PI) * T * 0.1; c.lineTo(px, yb + sag + T * 0.1); if (i < n) c.lineTo(px + w / n, yb + sag + T * 0.24 + R() * T * 0.06); }
      c.lineTo(w, yb); c.lineTo(T * 0.12, yb - ht * 0.75); c.lineTo(0, yb - ht); c.lineTo(-T * 0.12, yb - ht * 0.75); c.closePath();
      const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#3E8A5E'); g.addColorStop(0.45, '#28604A'); g.addColorStop(1, '#143429'); c.fillStyle = g; c.fill(); ink(c, lw);
      // needle ridges and the rose tips
      c.strokeStyle = 'rgba(160,230,170,.35)'; c.lineWidth = lw * 0.6; c.beginPath(); for (let i = 1; i < n; i++) { const px = -w + i / n * w * 2; c.moveTo(px * 0.3, yb - ht * 0.6); c.lineTo(px, yb + T * 0.12); } c.stroke();
      c.fillStyle = ROSE; for (let i = 0; i < n; i++) { const px = -w + (i + 0.5) / n * w * 2, sag = Math.sin((i + 0.5) / n * Math.PI) * T * 0.1; c.beginPath(); c.arc(px, yb + sag + T * 0.24, T * 0.04, 0, TAU); c.fill(); }
    }
    c.fillStyle = ROSE; c.beginPath(); c.moveTo(0, -H * T - T * 0.3); c.lineTo(T * 0.07, -H * T + T * 0.05); c.lineTo(-T * 0.07, -H * T + T * 0.05); c.closePath(); c.fill(); ink(c, lw * 0.7);
  };
  PROP_EXT.thornpine = [2.6, 4.1];

  PROPS.bulbtree = (c, T, v) => { const lw = lw0(T), R = rnd(41 + v * 29), col = ['#6A3E62', '#5A3A6A', '#6E4458', '#56406A'][v];
    shadow(c, T, 0.9, 0.3); roots(c, T, col, lw, 2);
    // the swollen bottle trunk with spiral bands
    c.beginPath(); c.moveTo(-T * 0.28, 0); c.bezierCurveTo(-T * 0.75, -T * 0.4, -T * 0.6, -T * 1.2, -T * 0.14, -T * 1.6); c.lineTo(T * 0.14, -T * 1.6); c.bezierCurveTo(T * 0.6, -T * 1.2, T * 0.75, -T * 0.4, T * 0.28, 0); c.closePath();
    c.fillStyle = shade(c, col, T * 0.7, -T * 0.25, -T * 0.9, 0.45); c.fill(); ink(c, lw);
    c.save(); c.clip(); c.lineCap = 'round'; for (let i = -3; i <= 3; i++) { const x0 = i * T * 0.16; c.beginPath(); c.moveTo(x0 * 1.3, T * 0.05); c.bezierCurveTo(x0 * 2.4 + T * 0.1, -T * 0.5, x0 * 1.6 - T * 0.12, -T * 1.1, x0 * 0.4, -T * 1.65); c.strokeStyle = 'rgba(30,10,30,.38)'; c.lineWidth = T * 0.05; c.stroke(); c.strokeStyle = 'rgba(255,220,240,.14)'; c.lineWidth = T * 0.02; c.translate(-T * 0.03, 0); c.stroke(); c.translate(T * 0.03, 0); }
    c.fillStyle = 'rgba(62,138,85,.55)'; ell(c, -T * 0.2, -T * 0.25, T * 0.25, T * 0.1, 0.3); c.fill(); ell(c, T * 0.25, -T * 0.9, T * 0.14, T * 0.07, -0.4); c.fill(); c.restore();
    // curling arms ending in glowing bulbs
    const arms = [[-1, 0.85, -2.3], [1, 0.95, -2.2], [-0.2, 0.25, -2.75], [0.45, 0.55, -2.6]];
    for (const [s, dx, ty] of arms) { const ex = s * dx * T, ey = ty * T; c.beginPath(); c.moveTo(0, -T * 1.55); c.bezierCurveTo(s * T * 0.1, -T * 2.1, ex - s * T * 0.4, ey + T * 0.2, ex, ey);
      c.lineWidth = T * 0.09 + lw * 2; c.strokeStyle = LN; c.stroke(); c.lineWidth = T * 0.09; c.strokeStyle = shadeC(col, 0.1); c.stroke();
      glow(c, ex, ey - T * 0.12, T * 0.6, ROSE, 0.6); ell(c, ex, ey - T * 0.14, T * 0.17, T * 0.19); c.fillStyle = shade(c, '#F7A8CF', T * 0.19, ex - T * 0.05, ey - T * 0.22, 0.45); c.fill(); ink(c, lw * 0.8);
      c.fillStyle = 'rgba(255,255,255,.7)'; ell(c, ex - T * 0.05, ey - T * 0.2, T * 0.045, T * 0.06); c.fill(); }
    // a few heart leaves on the arms
    c.fillStyle = '#3E8A5E'; for (let i = 0; i < 5; i++) { const a = R() * TAU, px = (R() - 0.5) * T * 1.2, py = -T * (1.8 + R() * 0.6); ell(c, px, py, T * 0.12, T * 0.07, a); c.fill(); ink(c, lw * 0.6); }
  };
  PROP_EXT.bulbtree = [3.0, 3.6];

  /* ---- the plants ---- */
  function frond(c, T, a, len, col, hi, lw) {
    c.save(); c.rotate(a);
    // the spine curves over at the end; leaflets either side along it
    const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([u * len * T, -Math.sin(u * 2.2) * len * T * 0.22 + u * u * len * T * 0.25]); }
    c.beginPath(); pts.forEach(([x, y], i) => { const w = T * 0.16 * (1 - (i / 10) * 0.85), sw = i % 2 ? 1 : 0.7; i ? c.lineTo(x, y - w * sw) : c.moveTo(x, y); });
    for (let i = 10; i >= 0; i--) { const [x, y] = pts[i], w = T * 0.16 * (1 - (i / 10) * 0.85), sw = i % 2 ? 0.7 : 1; c.lineTo(x, y + w * sw); }
    c.closePath(); c.fillStyle = col; c.fill(); ink(c, lw * 0.8);
    c.strokeStyle = hi; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.restore();
  }
  PROPS.giantfern = (c, T, v) => { const lw = lw0(T), R = rnd(51 + v * 17);
    shadow(c, T, 0.95, 0.3);
    const n = 9; for (let i = 0; i < n; i++) { const u = i / (n - 1), a = -Math.PI + 0.25 + u * (Math.PI - 0.5), back = i % 2 === 0;
      frond(c, T, a, 1.15 + R() * 0.35 - (back ? 0 : 0.2), back ? '#2E7A4E' : '#47A262', back ? 'rgba(160,230,170,.5)' : 'rgba(210,255,200,.6)', lw); }
    // a curled fiddlehead or two
    c.strokeStyle = LN; c.lineWidth = T * 0.07 + lw; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.05, -T * 0.7, T * 0.18, -T * 0.9); c.stroke(); c.strokeStyle = '#86D38A'; c.lineWidth = T * 0.07; c.stroke();
    c.beginPath(); c.arc(T * 0.22, -T * 0.98, T * 0.09, 0, TAU); c.fillStyle = '#86D38A'; c.fill(); ink(c, lw * 0.7);
  };
  PROP_EXT.giantfern = [3.0, 2.3];

  PROPS.glowcaps = (c, T, v) => { const lw = lw0(T), cols = [['#5FC9C0', '#B9FFF4'], ['#9A7BE0', '#E2D4FF'], ['#E07BA8', '#FFD6EA'], ['#6FB0E8', '#D6EEFF']];
    shadow(c, T, 0.8, 0.28);
    for (const [x, h, r, k] of [[-0.42, 1.0, 0.36, v], [0.38, 0.8, 0.3, v + 1], [0, 1.55, 0.48, v + 2]]) { const [cap, gl] = cols[k % 4], X0 = x * T, top = -h * T;
      c.beginPath(); c.moveTo(X0 - T * 0.07, 0); c.quadraticCurveTo(X0 - T * 0.05, top * 0.5, X0 - T * 0.05, top); c.lineTo(X0 + T * 0.05, top); c.quadraticCurveTo(X0 + T * 0.08, top * 0.5, X0 + T * 0.09, 0); c.closePath(); c.fillStyle = '#EDE0C6'; c.fill(); ink(c, lw * 0.8);
      glow(c, X0, top + T * 0.05, r * T * 1.8, gl, 0.45);
      // the glowing gills, then the cap
      ell(c, X0, top + T * 0.02, r * T, r * T * 0.25); c.fillStyle = gl; c.fill(); ink(c, lw * 0.7);
      c.beginPath(); c.moveTo(X0 - r * T, top); c.quadraticCurveTo(X0 - r * T * 0.95, top - r * T * 1.05, X0, top - r * T * 1.05); c.quadraticCurveTo(X0 + r * T * 0.95, top - r * T * 1.05, X0 + r * T, top); c.quadraticCurveTo(X0, top + r * T * 0.18, X0 - r * T, top); c.closePath();
      c.fillStyle = shade(c, cap, r * T, X0 - r * T * 0.3, top - r * T * 0.7, 0.45); c.fill(); ink(c, lw);
      c.fillStyle = 'rgba(255,255,255,.7)'; [[-0.45, -0.5, 0.12], [0.2, -0.75, 0.09], [0.5, -0.35, 0.08]].forEach(([a, b, s]) => { c.beginPath(); c.arc(X0 + a * r * T, top + b * r * T, s * r * T * 1.4, 0, TAU); c.fill(); });
    }
  };
  PROP_EXT.glowcaps = [2.6, 2.6];

  PROPS.starlily = (c, T, v) => { const lw = lw0(T), R = rnd(61 + v * 7), petal = ['#FFF1C8', '#FFD6EA', '#E6DAFF', '#FFF1C8'][v];
    shadow(c, T, 0.8, 0.28);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.36; c.save(); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.3, -T * 0.55, 0, -T * (0.95 + R() * 0.2)); c.quadraticCurveTo(-T * 0.3, -T * 0.55, 0, 0); c.closePath(); c.fillStyle = i % 2 ? '#3E8A55' : '#2C6E45'; c.fill(); ink(c, lw * 0.8); c.restore(); }
    for (const [x, y, s] of [[-0.35, -1.0, 0.95], [0.38, -0.92, 0.85], [0.02, -1.38, 1.05]]) { const X0 = x * T, Y0 = y * T, r = T * 0.3 * s;
      c.strokeStyle = LN; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(X0 * 0.4, -T * 0.2); c.quadraticCurveTo(X0 * 0.8, Y0 * 0.6, X0, Y0); c.stroke(); c.strokeStyle = '#4E9A5A'; c.lineWidth = lw; c.stroke();
      glow(c, X0, Y0, r * 2.4, GOLD, 0.5);
      c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? r * 0.38 : r; c.lineTo(X0 + Math.cos(a) * rr, Y0 + Math.sin(a) * rr * 0.85); } c.closePath();
      c.fillStyle = shade(c, petal, r, X0 - r * 0.3, Y0 - r * 0.3, 0.3); c.fill(); ink(c, lw * 0.8);
      c.fillStyle = GOLD; c.beginPath(); c.arc(X0, Y0, r * 0.22, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(X0 - r * 0.06, Y0 - r * 0.06, r * 0.08, 0, TAU); c.fill(); }
  };
  PROP_EXT.starlily = [2.6, 2.4];

  PROPS.thornbush = (c, T, v) => { const lw = lw0(T), R = rnd(71 + v * 13);
    shadow(c, T, 0.7, 0.26);
    const blobs = [[-0.3, -0.45, 0.38], [0.3, -0.47, 0.38], [0, -0.75, 0.42]];
    // thorns first, poking out behind the leaves
    for (let i = 0; i < 14; i++) { const a = -Math.PI + 0.15 + i / 13 * (Math.PI - 0.3) + (R() - 0.5) * 0.15, bx = Math.cos(a) * T * 0.55, by = -T * 0.55 + Math.sin(a) * T * 0.48, l = T * (0.22 + R() * 0.12), w = T * 0.06;
      c.beginPath(); c.moveTo(bx - Math.sin(a) * w, by + Math.cos(a) * w); c.lineTo(bx + Math.cos(a) * l, by + Math.sin(a) * l); c.lineTo(bx + Math.sin(a) * w, by - Math.cos(a) * w); c.closePath(); c.fillStyle = '#CFE8A0'; c.fill(); ink(c, lw * 0.7); }
    crown(c, T, blobs, '#173D2C', '#2F7A4A', '#8FD8A4', lw, R);
    c.fillStyle = ROSE; for (let i = 0; i < 6; i++) { const px = (R() - 0.5) * T * 0.9, py = -T * (0.4 + R() * 0.55); c.beginPath(); c.arc(px, py, T * 0.055, 0, TAU); c.fill(); ink(c, lw * 0.5); }
  };
  PROP_EXT.thornbush = [2.4, 2.2];

  PROPS.mossrock = (c, T, v) => { const lw = lw0(T), R = rnd(81 + v * 3);
    shadow(c, T, 0.62, 0.24);
    c.beginPath(); c.moveTo(-T * 0.55, 0); c.quadraticCurveTo(-T * 0.62, -T * 0.55, -T * 0.2, -T * 0.72); c.quadraticCurveTo(T * 0.25, -T * 0.85, T * 0.5, -T * 0.45); c.quadraticCurveTo(T * 0.62, -T * 0.15, T * 0.5, 0); c.closePath();
    c.fillStyle = shade(c, '#6E6280', T * 0.7, -T * 0.2, -T * 0.5, 0.45); c.fill(); ink(c, lw);
    c.save(); c.clip(); c.fillStyle = '#3E8A55'; c.beginPath(); c.moveTo(-T * 0.7, -T * 0.4); for (let i = 0; i <= 8; i++) c.quadraticCurveTo(-T * 0.7 + (i + 0.5) * T * 0.18, -T * (0.32 + (i % 2) * 0.12), -T * 0.7 + (i + 1) * T * 0.18, -T * (0.44 - Math.sin(i / 8 * Math.PI) * 0.0)); c.lineTo(T, -T); c.lineTo(-T, -T); c.closePath(); c.fill();
    c.fillStyle = 'rgba(160,230,150,.45)'; ell(c, -T * 0.15, -T * 0.7, T * 0.3, T * 0.1); c.fill(); c.restore();
    for (const [x, a] of [[-0.25, -2.0], [0.15, -1.3], [0.3, -1.7]]) { c.save(); c.translate(x * T, -T * 0.62); frond(c, T, a, 0.45 + R() * 0.15, '#4CA864', 'rgba(210,255,200,.6)', lw * 0.8); c.restore(); }
  };
  PROP_EXT.mossrock = [2.2, 2.0];

  // the garden's lands: a forest, many kinds of tree and plant, much denser than before
  B.props = ['eggtree', 'thornpine', 'weepwillow', 'giantfern', 'eggtree', 'bulbtree', 'glowcaps', 'thornpine', 'starlily', 'thornbush', 'eggtree', 'giantfern', 'mossrock', 'weepwillow', 'glowcaps', 'thornbush'];
  B.propN = [10, 6];
  // a thicket round each room's edge: more trees and plants on tiles at the rim, side by side, as long as every
  // open tile of the room can still reach every other (a local flood after each one)
  const EDGE = ['eggtree', 'thornpine', 'weepwillow', 'bulbtree', 'eggtree', 'thornpine', 'giantfern', 'thornbush', 'starlily', 'glowcaps'];
  B.dress = ({ rm, i, G, RM, props, R, id, MW, walk, okFeature, first }) => {
    const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 20) return;
    const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && [1, -1, MW, -MW].some(d => !walk(k + d) && !props.has(k + d)); });
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]];
      for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } }
      return seen.size >= open.length; };
    let want = Math.round(rim.length * (first ? 0.18 : 0.3)), tries = 0;
    while (want > 0 && rim.length && tries++ < 200) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1);
      // never two in a row along the rim's own line (keeps gaps between trunks)
      if ([1, -1, MW, -MW].filter(d => props.has(k + d)).length > 1) continue;
      const was = G[k]; G[k] = T_SOLID; if (!connected()) { G[k] = was; continue; } props.set(k, EDGE[Math.floor(R() * EDGE.length)]); want--; }
  };

  /* ---- undergrowth on the floor (decals, drawn into the cached ground) ---- */
  window.DECAL_EXT = window.DECAL_EXT || {};
  Object.assign(DECAL_EXT, {
    gtuft(c, d, s, lw) { const tip = d.v === 3 ? ROSE : d.v === 2 ? '#B9F0B0' : '#7FD38A'; c.lineCap = 'round';
      for (const pass of [0, 1]) { c.beginPath(); for (let i = -3; i <= 3; i++) { c.moveTo(i * s * 0.28, s * 0.35); c.quadraticCurveTo(i * s * 0.36, -s * 0.4, i * s * 0.55 + s * 0.15, -s * (1.1 + ((i + 3) % 3) * 0.25)); }
        if (!pass) { c.strokeStyle = 'rgba(20,10,30,.55)'; c.lineWidth = Math.max(2, lw * 1.6); } else { c.strokeStyle = '#3E9A5A'; c.lineWidth = Math.max(1.2, lw * 0.8); } c.stroke(); }
      c.fillStyle = tip; for (let i = -3; i <= 3; i += 2) { c.beginPath(); c.arc(i * s * 0.55 + s * 0.15, -s * (1.1 + ((i + 3) % 3) * 0.25), Math.max(1, s * 0.1), 0, TAU); c.fill(); } },
    gflower(c, d, s, lw) { const col = [CREAM, ROSE, '#B9A6FF', GOLD][d.v];
      glow(c, 0, 0, s * 2.2, col, 0.4); c.fillStyle = col; for (let i = 0; i < 5; i++) { const a = d.rot + i / 5 * TAU; ell(c, Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42, s * 0.36, s * 0.18, a); c.fill(); }
      c.strokeStyle = 'rgba(20,10,30,.45)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, s * 0.8, 0, TAU); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, s * 0.16, 0, TAU); c.fill(); },
    gfern(c, d, s, lw) { for (let k = -1; k <= 1; k++) { const a = -Math.PI / 2 + k * 0.7 + (d.rot - 3) * 0.05; c.save(); c.rotate(a); c.beginPath(); c.moveTo(0, 0); for (let i = 1; i <= 6; i++) { const x = i * s * 0.28, w = s * 0.3 * (1 - i / 7); c.lineTo(x, (i % 2 ? -w : w)); } c.lineTo(s * 1.8, 0); c.closePath();
      c.fillStyle = k ? '#2E7A4E' : '#47A262'; c.fill(); c.strokeStyle = 'rgba(20,10,30,.5)'; c.lineWidth = Math.max(1, lw * 0.6); c.stroke(); c.restore(); } },
    groot(c, d, s, lw) { c.rotate(d.rot); c.lineCap = 'round'; c.beginPath(); c.moveTo(-s * 2.4, s * 0.2); c.bezierCurveTo(-s, -s * 0.8, s * 0.6, s * 0.9, s * 2.4, -s * 0.2); c.moveTo(-s * 0.4, s * 0.1); c.quadraticCurveTo(0, s * 0.8, s * 0.5, s * 1.1);
      c.strokeStyle = 'rgba(20,8,26,.6)'; c.lineWidth = s * 0.55 + 2; c.stroke(); c.strokeStyle = '#5A3A52'; c.lineWidth = s * 0.55; c.stroke(); c.strokeStyle = 'rgba(255,220,240,.18)'; c.lineWidth = Math.max(1, s * 0.15); c.stroke(); },
    gmoss(c, d, s) { c.fillStyle = 'rgba(62,138,85,.55)'; ell(c, 0, 0, s * 2.2, s * 1.0, d.rot * 0.2); c.fill(); c.fillStyle = 'rgba(127,211,138,.45)'; ell(c, -s * 0.4, -s * 0.2, s * 1.2, s * 0.5, d.rot * 0.2); c.fill();
      c.fillStyle = 'rgba(255,211,107,.8)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(Math.cos(i * 1.7 + d.rot) * s * 1.3, Math.sin(i * 1.7 + d.rot) * s * 0.5, Math.max(1, s * 0.09), 0, TAU); c.fill(); } },
  });
  if (typeof DECALS !== 'undefined') DECALS.garden = [['gtuft', 0.2], ['gflower', 0.07], ['gfern', 0.07], ['gmoss', 0.05], ['groot', 0.035], ['leaf', 0.03]];

  /* ---- the vine bridge ---- */
  // a braid of four green vines along the walkway (continuous from tile to tile), heavier vines along each edge,
  // pale binding tendrils across it, leaves, the odd rose bud, and thorns jutting out over the drop
  function vineBridge(c, x, y, X, Y, T, isGap, tt, lw) {
    // which way the walkway runs: along the side without drops, else along the longer run of bridge
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y);
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === T_BRIDGE; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    const W = horiz ? x : y, sideA = horiz ? isGap(x, y - 1) : isGap(x - 1, y), sideB = horiz ? isGap(x, y + 1) : isGap(x + 1, y);
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    // the dark mat of stems underneath
    c.fillStyle = '#12301F'; c.fillRect(0, 0, T + 0.5, T + 0.5);
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 4; k++) { ell(c, T * hh(x, y, 10 + k), T * (0.2 + hh(x, y, 20 + k) * 0.6), T * 0.16, T * 0.05, 0); c.fill(); }
    const N = 10, vine = (f, w, passes) => { const pts = []; for (let i = 0; i <= N; i++) { const u = -0.04 + i / N * 1.08; pts.push([u * T, f(W + u) * T]); }
      for (const [col, ww] of passes) { c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.strokeStyle = col; c.lineWidth = ww(w); c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); } };
    const braid = [0, 1, 2, 3].map(i => s => 0.5 + 0.27 * Math.sin(s * Math.PI + i * Math.PI / 2));
    const VW = T * 0.19;
    // inked first, all together, so the braid reads as one woven mass; then each vine lit in turn, front ones last
    for (const f of braid) vine(f, VW, [[LN, w => w + lw * 2]]);
    const order = [0, 1, 2, 3].sort((a, b) => Math.cos(W * Math.PI + a * Math.PI / 2) - Math.cos(W * Math.PI + b * Math.PI / 2));
    for (const i of order) vine(braid[i], VW, [[LN, w => w + lw * 1.4], ['#2F7A44', w => w], ['#4FA45E', w => w * 0.55], ['rgba(200,255,190,.55)', w => Math.max(1, w * 0.14)]]);
    // the edge vines: thicker, wavy, along both sides
    const edgeA = s => 0.1 + 0.03 * Math.sin(s * 2.3), edgeB = s => 0.9 + 0.03 * Math.sin(s * 2.1 + 1);
    for (const f of [edgeA, edgeB]) vine(f, T * 0.15, [[LN, w => w + lw * 2], ['#245E36', w => w], ['#3E8F50', w => w * 0.5], ['rgba(200,255,190,.45)', w => Math.max(1, w * 0.14)]]);
    // pale tendrils binding the braid to the edges
    if (hh(x, y, 3) < 0.8) { const u = T * (0.2 + hh(x, y, 4) * 0.6); c.strokeStyle = LN; c.lineWidth = Math.max(2, T * 0.05) + lw; c.beginPath(); c.moveTo(u - T * 0.08, T * 0.1); c.bezierCurveTo(u + T * 0.2, T * 0.35, u - T * 0.2, T * 0.65, u + T * 0.08, T * 0.9); c.stroke(); c.strokeStyle = '#9BD88A'; c.lineWidth = Math.max(1.5, T * 0.05); c.stroke(); }
    // leaves and a rose bud
    for (let k = 0; k < 2; k++) if (hh(x, y, 30 + k) < 0.6) { const a = T * hh(x, y, 40 + k), b = T * (0.25 + hh(x, y, 50 + k) * 0.5), r = hh(x, y, 60 + k) * 6; ell(c, a, b, T * 0.11, T * 0.055, r); c.fillStyle = '#5FB86A'; c.fill(); ink(c, lw * 0.6); c.strokeStyle = 'rgba(20,60,30,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(a - Math.cos(r) * T * 0.1, b - Math.sin(r) * T * 0.1); c.lineTo(a + Math.cos(r) * T * 0.1, b + Math.sin(r) * T * 0.1); c.stroke(); }
    if (hh(x, y, 70) < 0.18) { const a = T * (0.2 + hh(x, y, 71) * 0.6), b = T * (0.3 + hh(x, y, 72) * 0.4); c.fillStyle = ROSE; c.beginPath(); c.arc(a, b, T * 0.07, 0, TAU); c.fill(); ink(c, lw * 0.6); c.fillStyle = '#FFD6EA'; c.beginPath(); c.arc(a - T * 0.02, b - T * 0.02, T * 0.025, 0, TAU); c.fill(); }
    // thorns: small ones along the braid, big ones jutting out over the drop
    const thorn = (bx, by, a, l, w) => { c.beginPath(); c.moveTo(bx - Math.sin(a) * w, by + Math.cos(a) * w); c.lineTo(bx + Math.cos(a) * l, by + Math.sin(a) * l); c.lineTo(bx + Math.sin(a) * w, by - Math.cos(a) * w); c.closePath();
      const g = c.createLinearGradient(bx, by, bx + Math.cos(a) * l, by + Math.sin(a) * l); g.addColorStop(0, '#4E8A3A'); g.addColorStop(1, '#E4F5B8'); c.fillStyle = g; c.fill(); ink(c, lw * 0.7); };
    for (let k = 0; k < 3; k++) { const u = (k + 0.3 + hh(x, y, 80 + k) * 0.4) / 3, i = k % 4, b = braid[i](W + u); thorn(u * T, b * T, (hh(x, y, 90 + k) < 0.5 ? -1 : 1) * Math.PI / 2 + (hh(x, y, 95 + k) - 0.5) * 0.8, T * 0.13, T * 0.035); }
    for (const [on, f, dir] of [[sideA, edgeA, -1], [sideB, edgeB, 1]]) if (on) for (let k = 0; k < 3; k++) { const u = (k + 0.2 + hh(x, y, 100 + k + (dir > 0 ? 10 : 0)) * 0.6) / 3; thorn(u * T, f(W + u) * T, dir * Math.PI / 2 + (hh(x, y, 120 + k) - 0.5) * 0.9, T * (0.24 + hh(x, y, 130 + k) * 0.1), T * 0.06); }
    c.restore();
  }
  // under a bridge's south edge: the vines' dark underside, and tendrils hanging down into the void
  function vineEdge(c, x, y, X, Y, T, lw) {
    c.fillStyle = '#0C2216'; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + T, Y); c.lineTo(X + T, Y + T * 0.12); for (let i = 4; i >= 0; i--) c.lineTo(X + T * i / 4, Y + T * (0.14 + hh(x, y, 140 + i) * 0.1)); c.closePath(); c.fill();
    for (let k = 0; k < 2; k++) { const u = X + T * (0.2 + k * 0.5 + hh(x, y, 150 + k) * 0.25), L = T * (0.35 + hh(x, y, 160 + k) * 0.45), sw = (hh(x, y, 170 + k) - 0.5) * T * 0.3;
      c.beginPath(); c.moveTo(u, Y + T * 0.08); c.quadraticCurveTo(u + sw, Y + L * 0.6, u + sw * 0.4, Y + L); c.strokeStyle = LN; c.lineWidth = Math.max(2, T * 0.05) + lw; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#3E8F50'; c.lineWidth = Math.max(1.5, T * 0.05); c.stroke();
      c.beginPath(); c.arc(u + sw * 0.4 + T * 0.04, Y + L, T * 0.045, Math.PI, TAU * 0.9); c.stroke();
      if (hh(x, y, 180 + k) < 0.5) { ell(c, u + sw * 0.5, Y + L * 0.55, T * 0.07, T * 0.035, 1); c.fillStyle = '#5FB86A'; c.fill(); } }
  }
  B.bridgeFn = vineBridge; B.bridgeEdge = vineEdge;
})();
