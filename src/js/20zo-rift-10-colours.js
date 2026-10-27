/* ---------- Rift 10: The Sea of Fallen Colours ----------
   Something fell into the stellar sea from between the stars: a colour that is not one of ours. Where it sank, the
   colours of the world began to run out of things and pour down after it; the shore is grey, the sea glows with every
   hue that ever was, and in the deep the fallen colour blooms. Three lands, going down:
   I   The Grey Shore: a beach drained of colour: bleached coral, grey driftwood, glass sand; the last shards of colour lie
       glowing in it, and the sea beyond is a still pale grey.
   II  The Prism Reefs: reefs of glass coral in shallows of liquid light; crystal arches split the light into rainbows.
   III The Deep of the Fallen Colour: the stellar sea's floor, indigo and starlit; iridescent blooms of the impossible
       colour, meteor shards, the colour itself welling up out of the dark.
   Monsters: greylings (husks drained of colour: they pinch, and drain you when they hold on), hue wisps (orbs of loose
   colour that burst into a slowing splash on a shown circle), prism rays (glass mantas: a beam along a shown line that
   splits into two at its end), shardbacks (glass turtles: their shell turns blows from the front; strike their backs),
   chroma wraiths (they blink beside you and slash a shown arc).
   Every fight has prism crystals: break one and it fires beams of colour along six shown lines, through every monster in
   them. Line them up first.
   Stages: I  The Bleached Strand (fight) · The Painted Horde (trial) · Grisaille, the Thief of Hues
           II The Three Lenses (trial) · The Glass Shallows (fight) · Xelvara, the Comet Brood
           III The Colourfall (trial) · The Starlit Floor (fight) · The Blooming Dark (fight) · Chromatica, the Colour Without a Name */
const COL = { INK: '#1C1A26', GREY: '#A8A8B2', GREY_D: '#76767F', GREY_HI: '#E2E2EA', GLASS: '#C8EEF4', GLASS_D: '#7FB8C8', GLASS_HI: '#F2FFFF', DEEP: '#0E1030', DEEP_HI: '#3A3E7A', STAR: '#F4F0FF',
  R: '#FF5C7A', O: '#FF9F43', Y: '#FFE37A', G: '#5FE0A0', B: '#4FB8FF', V: '#B07CFF', HUE: ['#FF5C7A', '#FF9F43', '#FFE37A', '#5FE0A0', '#4FB8FF', '#B07CFF'], UNSEEN: '#E04CFF', UNSEEN2: '#4CFFD8' };
(() => {
  const TAU = Math.PI * 2, { INK, GREY, GREY_D, GREY_HI, GLASS, GLASS_D, GLASS_HI, DEEP, DEEP_HI, STAR, HUE, UNSEEN, UNSEEN2 } = COL;
  const { PROPS } = DunWorld, { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const rnd = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const ink = (c, lw) => { c.strokeStyle = LN; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(14,16,30,${a || 0.28})`; ell(c, 0, T * 0.03, T * w, T * w * 0.32); c.fill(); };
  const hueAt = (u, s, l) => `hsl(${(((u % 1) + 1) % 1) * 360},${s == null ? 90 : s}%,${l == null ? 68 : l}%)`;
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  // a faceted crystal: a body with a lit face and a shaded face, pointed at the top
  function crystal(c, x, y, w, h, col, lw, tilt) { c.save(); c.translate(x, y); c.rotate(tilt || 0);
    c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h * 0.72); c.lineTo(0, -h); c.lineTo(0, 0); c.closePath(); c.fillStyle = shadeC(col, 0.35); c.fill();
    c.beginPath(); c.moveTo(w, 0); c.lineTo(w, -h * 0.72); c.lineTo(0, -h); c.lineTo(0, 0); c.closePath(); c.fillStyle = shadeC(col, -0.12); c.fill();
    c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h * 0.72); c.lineTo(0, -h); c.lineTo(w, -h * 0.72); c.lineTo(w, 0); c.closePath(); ink(c, lw);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(-w * 0.55, -h * 0.1); c.lineTo(-w * 0.55, -h * 0.62); c.stroke(); c.restore(); }


  // a cylinder gradient across x0..x1: lit on the left, shaded on the right
  const cylG = (c, x0, x1, hi, lo) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, shadeC(hi, -0.06)); g.addColorStop(0.25, hi); g.addColorStop(0.62, shadeC(hi, -0.12)); g.addColorStop(1, lo); return g; };
  // a round branch from (x0,y0) to (x1,y1): ink, body, a shadow side and a light side, so it reads as a tube
  function tube(c, x0, y0, x1, y1, w, col, lw, alpha) { const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a), o = Math.sign(nx || 1);
    c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + lw * 1.8; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.globalAlpha = alpha || 1; c.strokeStyle = col; c.lineWidth = w; c.stroke();
    c.strokeStyle = shadeC(col, -0.28); c.lineWidth = w * 0.4; c.beginPath(); c.moveTo(x0 + nx * w * 0.25 * o, y0 + ny * w * 0.25 * o); c.lineTo(x1 + nx * w * 0.25 * o, y1 + ny * w * 0.25 * o); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = w * 0.22; c.beginPath(); c.moveTo(x0 - nx * w * 0.24 * o, y0 - ny * w * 0.24 * o); c.lineTo(x1 - nx * w * 0.24 * o, y1 - ny * w * 0.24 * o); c.stroke(); c.globalAlpha = 1; }
  // a faceted boulder on the ground at (x, y): a lit top face, a mid face, a shaded side, cracks and little pits
  function facetRock(c, x, y, w, h, col, lw, R) { const pts = []; for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI, k = 0.85 + R() * 0.25; pts.push([x + Math.cos(a) * w * k, y - h * 0.12 + Math.sin(a) * h * k]); }
    const ridge = [x - w * 0.15, y - h * 0.62], low = [x + w * 0.35, y - h * 0.22];
    c.beginPath(); c.moveTo(x - w, y); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(x + w, y); c.quadraticCurveTo(x, y + h * 0.22, x - w, y); c.closePath(); c.fillStyle = shadeC(col, -0.3); c.fill();
    c.beginPath(); c.moveTo(pts[1][0], pts[1][1]); for (let i = 2; i <= 5; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineTo(ridge[0] + w * 0.2, ridge[1]); c.lineTo(ridge[0], ridge[1]); c.closePath(); c.fillStyle = shadeC(col, 0.28); c.fill();
    c.beginPath(); c.moveTo(pts[5][0], pts[5][1]); for (let i = 6; i <= 8; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineTo(low[0], low[1]); c.lineTo(ridge[0] + w * 0.2, ridge[1]); c.closePath(); c.fillStyle = shadeC(col, -0.08); c.fill();
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(ridge[0], ridge[1]); c.lineTo(low[0] - w * 0.3, y - h * 0.08); c.closePath(); c.fillStyle = shadeC(col, 0.06); c.fill();
    c.strokeStyle = 'rgba(30,30,40,.35)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(ridge[0], ridge[1]); c.lineTo(low[0] - w * 0.3, y - h * 0.08); c.moveTo(ridge[0] + w * 0.2, ridge[1]); c.lineTo(low[0], low[1]); c.stroke();
    c.beginPath(); c.moveTo(x - w, y); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(x + w, y); c.quadraticCurveTo(x, y + h * 0.22, x - w, y); c.closePath(); ink(c, lw);
    c.fillStyle = 'rgba(30,30,40,.22)'; for (let i = 0; i < 3; i++) { ell(c, x + (R() - 0.4) * w, y - h * (0.2 + R() * 0.35), w * 0.07, h * 0.05); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.4)'; ell(c, x - w * 0.45, y - h * 0.62, w * 0.16, h * 0.06, -0.3); c.fill(); }

  /* ---- the seas ---- */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.greysea = { base: '#8E8E98',
    paint(c, S, R) { c.fillStyle = '#8E8E98'; c.fillRect(0, 0, S, S); for (let i = 0; i < 22; i++) { const x = R() * S, y = R() * S, w = 10 + R() * 18; c.strokeStyle = `rgba(230,230,238,${0.12 + R() * 0.2})`; c.lineWidth = 1.5; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.quadraticCurveTo(x + ox, y + oy - 3, x + ox + w, y + oy); c.stroke(); } }
      // a few last flecks of colour sinking in the grey
      for (let i = 0; i < 6; i++) { c.fillStyle = HUE[Math.floor(R() * 6)]; c.globalAlpha = 0.55; c.beginPath(); c.arc(R() * S, R() * S, 1.4, 0, TAU); c.fill(); } c.globalAlpha = 1; },
    back(c, o) { const { pat, pattern, k, W, H, t } = o; pat(pattern('greysea', k), 1, W / 2 + t * 3, H / 2 + Math.sin(t * 0.5) * 5); },
  };
  GAP_EXT.lightshallow = { base: '#7AD8E8',
    paint(c, S, R) { c.fillStyle = '#8CD6EE'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 6; i++) { const x = R() * S, y = R() * S, r = 14 + R() * 18, col = ['rgba(196,156,255,.35)', 'rgba(255,170,210,.28)', 'rgba(140,255,210,.28)'][i % 3]; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } }
      // caustics: a net of bright wavering lines, each tinted a hue
      for (let i = 0; i < 18; i++) { const x = R() * S, y = R() * S, w = 8 + R() * 16; c.strokeStyle = HUE[i % 6]; c.globalAlpha = 0.3; c.lineWidth = 1.6; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.bezierCurveTo(x + ox - w * 0.3, y + oy - 6, x + ox + w * 0.3, y + oy + 6, x + ox + w, y + oy); c.stroke(); } }
      c.globalAlpha = 1; for (let i = 0; i < 16; i++) { c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(R() * S, R() * S, 0.9, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, W, H, t } = o; pat(pattern('lightshallow', k), 1, W / 2 + t * 6, H / 2 + Math.sin(t * 0.7) * 6); },
  };
  GAP_EXT.huedeep = { base: '#0A0C24',
    paint(c, S, R) { c.fillStyle = '#0A0C24'; c.fillRect(0, 0, S, S); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(244,240,255,${0.25 + R() * 0.6})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.12 ? 1.4 : 0.6, 0, TAU); c.fill(); }
      for (let i = 0; i < 5; i++) { const x = R() * S, y = R() * S, r = 10 + R() * 14; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); g.addColorStop(0, i % 2 ? 'rgba(224,76,255,.22)' : 'rgba(76,255,216,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } } },
    back(c, o) { const { pat, pattern, k, W, H, t } = o; pat(pattern('huedeep', k), 1, W / 2 + t * 2, H / 2 - t * 1.5); },
  };

  /* ---- the floors ---- */
  window.DECAL_EXT = window.DECAL_EXT || {};
  Object.assign(DECAL_EXT, {
    hueshard(c, d, s, lw) { c.rotate(d.rot); const col = HUE[Math.floor(d.v * 6) % 6]; glowIn(c, 0, 0, s * 2.2, col, 0.35); c.fillStyle = col; c.beginPath(); c.moveTo(0, -s * 1.1); c.lineTo(s * 0.5, 0); c.lineTo(0, s * 0.7); c.lineTo(-s * 0.5, 0); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(-s * 0.1, -s * 0.7, s * 0.14, s * 0.5); },
    greyshell(c, d, s) { c.rotate(d.rot); c.fillStyle = 'rgba(232,232,238,.7)'; c.beginPath(); c.moveTo(-s, s * 0.3); c.quadraticCurveTo(0, -s * 1.1, s, s * 0.3); c.closePath(); c.fill(); c.strokeStyle = 'rgba(120,120,130,.5)'; c.lineWidth = 1; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * s * 0.18, s * 0.3); c.lineTo(i * s * 0.08, -s * 0.5); c.stroke(); } },
    glasssand(c, d, s) { for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,.55)' : 'rgba(200,238,244,.6)'; c.beginPath(); c.arc(Math.cos(i * 1.7 + d.rot) * s * 1.3, Math.sin(i * 1.7 + d.rot) * s * 0.6, s * 0.13, 0, TAU); c.fill(); } },
    caustic(c, d, s) { c.rotate(d.rot); c.strokeStyle = HUE[Math.floor(d.v * 6) % 6]; c.globalAlpha = 0.35; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-s * 2, 0); c.bezierCurveTo(-s, -s * 0.6, s, s * 0.6, s * 2, 0); c.stroke(); c.globalAlpha = 1; },
    iridvein(c, d, s) { c.rotate(d.rot); const g = c.createLinearGradient(-s * 2.4, 0, s * 2.4, 0); g.addColorStop(0, 'rgba(224,76,255,0)'); g.addColorStop(0.5, 'rgba(224,76,255,.45)'); g.addColorStop(1, 'rgba(76,255,216,0)'); c.strokeStyle = g; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-s * 2.4, 0); c.bezierCurveTo(-s, -s * 0.8, s * 0.6, s * 0.7, s * 2.4, -s * 0.2); c.stroke(); },
    starsand(c, d, s) { for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(244,240,255,.75)'; c.beginPath(); c.arc(Math.cos(i * 2.1 + d.rot) * s, Math.sin(i * 2.1 + d.rot) * s * 0.5, s * 0.1, 0, TAU); c.fill(); } },
  });

  /* ---- the bridges: panes of glass, a rainbow running along their edges ---- */
  function glassBridge(c, x, y, X, Y, T, isGap, tt, lw, B) {
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y);
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === T_BRIDGE; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    const A = horiz ? x : y, col = B.bridgeCol || GLASS;
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(T * 0.04, T * 0.2, T * 0.92, T * 0.76);
    const g = c.createLinearGradient(0, 0, 0, T); g.addColorStop(0, shadeC(col, 0.3)); g.addColorStop(1, shadeC(col, -0.15)); c.fillStyle = g; c.globalAlpha = 0.92; c.beginPath(); GFX.rr(c, T * 0.03, T * 0.12, T * 0.94, T * 0.76, T * 0.08); c.fill(); c.globalAlpha = 1; c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.stroke();
    c.fillStyle = HUE[((A % 6) + 6) % 6]; c.globalAlpha = 0.7; c.fillRect(T * 0.06, T * 0.14, T * 0.88, Math.max(1.5, T * 0.05)); c.fillStyle = HUE[((A + 3) % 6 + 6) % 6]; c.fillRect(T * 0.06, T * 0.82, T * 0.88, Math.max(1.5, T * 0.04)); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(T * 0.2, T * 0.3); c.lineTo(T * 0.45, T * 0.7); c.stroke();
    c.restore(); }
  function glassEdge(c, x, y, X, Y, T, lw, B) { c.fillStyle = shadeC(B.bridgeCol || GLASS, -0.4); c.fillRect(X + T * 0.05, Y, T * 0.9, T * 0.12); c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(X + T * 0.1, Y + T * 0.12, T * 0.8, T * 0.1); }

  /* ---- props ---- */
  window.PROP_EXT = window.PROP_EXT || {};
  Object.assign(PROP_EXT, { bleachcoral: [2.6, 3.0], driftwood: [2.8, 1.8], greyrock: [2.6, 2.2], prismshard: [2.0, 3.0], greylighthouse: [2.0, 5.2], glasscoral: [2.8, 3.4], crystalarch: [3.2, 3.6], prismspire: [2.0, 4.2], lightkelp: [1.8, 3.6], glassurchin: [2.0, 1.8], huebloom: [2.6, 3.4], meteorshard: [2.8, 3.4], starcoral: [2.6, 3.0], voidpearl: [2.0, 2.4], huecolumn: [2.0, 4.4] });
  Object.assign(PROPS, {
    /* a coral bleached grey: round branches shaded as tubes, lit from the upper left; one tip still holds a drop of colour */
    bleachcoral(c, T, v) { const lw = lw0(T), R = rnd(13 + v * 7); shadowEll(c, T, 0.8); const tips = [];
      const br = (x, y, a, L, d) => { const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; tube(c, x, y, x2, y2, T * 0.075 * (d + 1.5), '#D9D9E0', lw); if (d > 0) { br(x2, y2, a - 0.5 - R() * 0.2, L * 0.7, d - 1); br(x2, y2, a + 0.45 + R() * 0.2, L * 0.7, d - 1); } else tips.push([x2, y2]); };
      ell(c, 0, -T * 0.05, T * 0.42, T * 0.16); c.fillStyle = shade(c, '#B8B8C2', T * 0.4, -T * 0.15, -T * 0.1, 0.4); c.fill(); ink(c, lw);
      br(-T * 0.18, -T * 0.05, -Math.PI / 2 - 0.32, T * 0.85, 2); br(T * 0.2, -T * 0.05, -Math.PI / 2 + 0.3, T * 0.95, 2);
      tips.forEach(([x, y], i) => { const col = i === v % tips.length ? HUE[v % 6] : null; c.beginPath(); c.arc(x, y, T * 0.1, 0, TAU); c.fillStyle = col ? shade(c, col, T * 0.1, -T * 0.04, -T * 0.04, 0.45) : shade(c, '#F2F2F6', T * 0.1, -T * 0.04, -T * 0.04, 0.35); c.fill(); ink(c, lw * 0.7); if (col) glowIn(c, x, y, T * 0.45, col, 0.5); }); },
    /* a log of grey driftwood: a shaded cylinder, its end showing rings, a knot and splits along it */
    driftwood(c, T, v) { const lw = lw0(T), L = T * 1.05, rr = T * 0.28; shadowEll(c, T, 1.05);
      c.save(); c.translate(0, -rr - T * 0.02); c.rotate(-0.12);
      c.beginPath(); c.moveTo(-L, -rr); c.lineTo(L, -rr * 0.9); c.lineTo(L, rr * 0.9); c.lineTo(-L, rr); c.closePath(); const g = c.createLinearGradient(0, -rr, 0, rr); g.addColorStop(0, '#D8D4CA'); g.addColorStop(0.35, '#ACA79C'); g.addColorStop(1, '#6E6A62'); c.fillStyle = g; c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(60,56,50,.45)'; c.lineWidth = Math.max(1, lw * 0.6); for (let i = 0; i < 4; i++) { const y = -rr * 0.6 + i * rr * 0.4; c.beginPath(); c.moveTo(-L * 0.8, y); c.bezierCurveTo(-L * 0.3, y - rr * 0.15, L * 0.2, y + rr * 0.15, L * 0.75, y); c.stroke(); }
      ell(c, L * 0.2, -rr * 0.05, rr * 0.22, rr * 0.16); c.fillStyle = '#7A766C'; c.fill(); ink(c, lw * 0.6);
      ell(c, -L, 0, rr * 0.45, rr); c.fillStyle = shade(c, '#E2DDD0', rr, -rr * 0.15, -rr * 0.3, 0.3); c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(120,112,98,.6)'; c.lineWidth = 1; for (const k of [0.65, 0.35]) { ell(c, -L, 0, rr * 0.45 * k, rr * k); c.stroke(); } c.restore(); },
    /* a grey boulder of the shore: a faceted stone with a lit top, two shaded sides, a glowing shard of colour stuck in it */
    greyrock(c, T, v) { const lw = lw0(T), R = rnd(5 + v * 11), w = T * (0.72 + R() * 0.15), h = T * (0.55 + R() * 0.2); shadowEll(c, T, 0.9);
      facetRock(c, 0, 0, w, h, GREY, lw, R);
      const col = HUE[v % 6]; glowIn(c, w * 0.3, -h * 1.15, T * 0.7, col, 0.55); crystal(c, w * 0.3, -h * 0.78, T * 0.11, T * 0.55, col, lw * 0.8, 0.28); crystal(c, w * 0.48, -h * 0.72, T * 0.07, T * 0.3, col, lw * 0.7, 0.6); },
    /* a great shard of colour fallen on the beach: a cluster of crystals on a little mound of glassy sand, light spilling round it */
    prismshard(c, T, v) { const lw = lw0(T), col = HUE[v % 6]; c.fillStyle = col; c.globalAlpha = 0.25; ell(c, 0, 0, T * 1.0, T * 0.34); c.fill(); c.globalAlpha = 1;
      ell(c, 0, -T * 0.08, T * 0.62, T * 0.22); c.fillStyle = shade(c, '#B8B8C2', T * 0.6, -T * 0.2, -T * 0.1, 0.4); c.fill(); ink(c, lw * 0.8);
      glowIn(c, 0, -T * 1.3, T * 1.5, col, 0.5);
      crystal(c, -T * 0.36, -T * 0.08, T * 0.16, T * 1.0, col, lw, -0.32); crystal(c, T * 0.42, -T * 0.06, T * 0.13, T * 0.75, col, lw, 0.42); crystal(c, T * 0.05, -T * 0.1, T * 0.3, T * 2.2, col, lw, 0.06); crystal(c, -T * 0.12, -T * 0.02, T * 0.1, T * 0.55, shadeC(col, 0.2), lw * 0.8, -0.1); },
    /* a grey lighthouse: a round tapering tower shaded as a cylinder, its bands following the curve, a gallery rail and a lamp gone colourless */
    greylighthouse(c, T, v) { const lw = lw0(T), Hh = T * 4.0, wb = T * 0.52, wt = T * 0.32; shadowEll(c, T, 0.75);
      ell(c, 0, -T * 0.02, wb * 1.25, wb * 0.4); c.fillStyle = shade(c, '#8A8A94', wb, -wb * 0.4, 0, 0.4); c.fill(); ink(c, lw);
      c.beginPath(); c.moveTo(-wb, 0); c.lineTo(-wt, -Hh); c.lineTo(wt, -Hh); c.lineTo(wb, 0); c.ellipse(0, 0, wb, wb * 0.32, 0, 0, Math.PI); c.closePath(); c.fillStyle = cylG(c, -wb, wb, '#F4F4F8', '#8C8C96'); c.fill(); ink(c, lw);
      c.save(); c.beginPath(); c.moveTo(-wb, 0); c.lineTo(-wt, -Hh); c.lineTo(wt, -Hh); c.lineTo(wb, 0); c.ellipse(0, 0, wb, wb * 0.32, 0, 0, Math.PI); c.closePath(); c.clip();
      for (let i = 0; i < 3; i++) { const u0 = 0.18 + i * 0.28, y0 = -Hh * u0, y1 = -Hh * (u0 + 0.11), w0 = wb + (wt - wb) * u0, w1 = wb + (wt - wb) * (u0 + 0.11); c.beginPath(); c.moveTo(-w0, y0); c.ellipse(0, y0, w0, w0 * 0.32, 0, Math.PI, 0, true); c.lineTo(w1, y1); c.ellipse(0, y1, w1, w1 * 0.32, 0, 0, Math.PI); c.closePath(); c.fillStyle = cylG(c, -w0, w0, '#9A9AA4', '#4E4E58'); c.fill(); } c.restore();
      c.fillStyle = 'rgba(30,30,40,.6)'; c.beginPath(); c.ellipse(0, -Hh * 0.55, wt * 0.35, wt * 0.5, 0, 0, TAU); c.fill();
      ell(c, 0, -Hh, wt * 1.45, wt * 0.45); c.fillStyle = '#6A6A74'; c.fill(); ink(c, lw);
      c.fillStyle = 'rgba(230,232,240,.75)'; c.fillRect(-wt * 0.72, -Hh - T * 0.55, wt * 1.44, T * 0.5); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-wt * 0.72, -Hh - T * 0.55, wt * 1.44, T * 0.5); c.strokeStyle = 'rgba(80,80,90,.5)'; c.lineWidth = 1; for (const k of [-0.25, 0.25]) { c.beginPath(); c.moveTo(k * wt, -Hh - T * 0.55); c.lineTo(k * wt, -Hh - T * 0.05); c.stroke(); }
      c.strokeStyle = LN; c.lineWidth = lw * 0.8; ell(c, 0, -Hh - T * 0.02, wt * 1.45, wt * 0.45); c.stroke(); for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * wt * 0.45, -Hh + T * 0.02); c.lineTo(i * wt * 0.45, -Hh - T * 0.18); c.stroke(); }
      c.beginPath(); c.moveTo(-wt * 0.95, -Hh - T * 0.55); c.quadraticCurveTo(0, -Hh - T * 1.05, wt * 0.95, -Hh - T * 0.55); c.closePath(); c.fillStyle = cylG(c, -wt, wt, '#8A8A94', '#4A4A54'); c.fill(); ink(c, lw); },
    /* a coral of glass: tubes of every colour, light through them, a crystal knob at each tip */
    glasscoral(c, T, v) { const lw = lw0(T), R = rnd(31 + v * 17); shadowEll(c, T, 0.8); glowIn(c, 0, -T * 1.3, T * 1.4, HUE[(v + 2) % 6], 0.35); let k = v; const tips = [];
      const br = (x, y, a, L, d) => { const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; tube(c, x, y, x2, y2, T * 0.075 * (d + 1.5), HUE[(k++) % 6], lw, 0.82); if (d > 0) { br(x2, y2, a - 0.45 - R() * 0.2, L * 0.72, d - 1); br(x2, y2, a + 0.45 + R() * 0.2, L * 0.72, d - 1); } else tips.push([x2, y2, HUE[(k + 2) % 6]]); };
      ell(c, 0, -T * 0.05, T * 0.42, T * 0.15); c.fillStyle = shade(c, GLASS, T * 0.4, -T * 0.15, -T * 0.1, 0.35); c.fill(); ink(c, lw);
      br(-T * 0.2, -T * 0.05, -Math.PI / 2 - 0.3, T * 0.85, 2); br(T * 0.2, -T * 0.05, -Math.PI / 2 + 0.25, T * 0.95, 2);
      for (const [x, y, col] of tips) { crystal(c, x, y + T * 0.08, T * 0.07, T * 0.26, col, lw * 0.6, 0); } },
    /* an arch of crystal over the shallows: a thick faceted span with a lit face and a shaded inner side; a rainbow on the sand below */
    crystalarch(c, T, v) { const lw = lw0(T); c.save(); c.globalAlpha = 0.5; for (let i = 0; i < 6; i++) { c.strokeStyle = HUE[i]; c.lineWidth = T * 0.07; c.beginPath(); c.ellipse(0, 0, T * (1.0 - i * 0.07), T * (0.32 - i * 0.02), 0, Math.PI, TAU); c.stroke(); } c.restore();
      const arch = (o, s) => { c.beginPath(); c.moveTo(-T * 1.4 * s + o, 0); c.quadraticCurveTo(-T * 1.4 * s + o, -T * 2.9 * s, o, -T * 2.9 * s); c.quadraticCurveTo(T * 1.4 * s + o, -T * 2.9 * s, T * 1.4 * s + o, 0); };
      // the inner (shaded) thickness first, then the lit face in front
      c.beginPath(); c.moveTo(-T * 0.95, 0); c.quadraticCurveTo(-T * 0.95, -T * 2.35, 0, -T * 2.35); c.quadraticCurveTo(T * 0.95, -T * 2.35, T * 0.95, 0); c.lineTo(T * 1.1, -T * 0.12); c.quadraticCurveTo(T * 1.1, -T * 2.25, T * 0.12, -T * 2.25); c.quadraticCurveTo(-T * 0.8, -T * 2.25, -T * 0.8, -T * 0.12); c.closePath(); c.fillStyle = 'rgba(90,140,170,.8)'; c.fill(); ink(c, lw * 0.8);
      arch(0, 1); c.lineTo(T * 0.95, 0); c.quadraticCurveTo(T * 0.95, -T * 2.35, 0, -T * 2.35); c.quadraticCurveTo(-T * 0.95, -T * 2.35, -T * 0.95, 0); c.closePath();
      const g = c.createLinearGradient(-T * 1.4, -T * 2.9, T * 1.4, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, GLASS); g.addColorStop(1, GLASS_D); c.globalAlpha = 0.93; c.fillStyle = g; c.fill(); c.globalAlpha = 1; ink(c, lw);
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1, lw * 0.8); c.beginPath(); c.moveTo(-T * 1.25, -T * 0.3); c.quadraticCurveTo(-T * 1.25, -T * 2.62, 0, -T * 2.72); c.stroke();
      c.strokeStyle = 'rgba(60,110,140,.5)'; c.lineWidth = 1.5; for (const k of [-0.6, 0.6]) { c.beginPath(); c.moveTo(k * T * 1.1, -T * 1.8); c.lineTo(k * T * 1.2, -T * 1.3); c.stroke(); }
      for (const sd of [-1, 1]) { ell(c, sd * T * 1.17, -T * 0.02, T * 0.28, T * 0.1); c.fillStyle = shade(c, GLASS_D, T * 0.28, -T * 0.08, 0, 0.4); c.fill(); ink(c, lw * 0.7); }
      glowIn(c, 0, -T * 2.7, T * 0.7, '#FFFFFF', 0.5); },
    /* a tall three-sided prism standing on a crystal foot: a lit face, a shaded face, a rainbow streaming from the lit edge */
    prismspire(c, T, v) { const lw = lw0(T), h = T * 3.4, w = T * 0.36; shadowEll(c, T, 0.6);
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { c.strokeStyle = HUE[i]; c.globalAlpha = 0.22; c.lineWidth = T * 0.12; c.beginPath(); c.moveTo(T * 0.15, -T * 2.2); c.quadraticCurveTo(T * 0.9, -T * (2.0 - i * 0.1), T * 1.3, -T * (1.2 - i * 0.12)); c.stroke(); } c.restore();
      c.beginPath(); c.moveTo(-w, -T * 0.1); c.lineTo(-w * 0.75, -h); c.lineTo(w * 0.1, -h - T * 0.35); c.lineTo(w * 0.1, T * 0.1); c.closePath(); c.fillStyle = '#F2FFFF'; c.globalAlpha = 0.92; c.fill(); c.globalAlpha = 1;
      c.beginPath(); c.moveTo(w * 0.1, T * 0.1); c.lineTo(w * 0.1, -h - T * 0.35); c.lineTo(w, -h + T * 0.05); c.lineTo(w * 0.95, -T * 0.12); c.closePath(); c.fillStyle = GLASS_D; c.globalAlpha = 0.92; c.fill(); c.globalAlpha = 1;
      c.beginPath(); c.moveTo(-w, -T * 0.1); c.lineTo(-w * 0.75, -h); c.lineTo(w * 0.1, -h - T * 0.35); c.lineTo(w, -h + T * 0.05); c.lineTo(w * 0.95, -T * 0.12); c.lineTo(w * 0.1, T * 0.1); c.closePath(); ink(c, lw);
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(-w * 0.6, -T * 0.3); c.lineTo(-w * 0.45, -h + T * 0.2); c.stroke();
      for (const sd of [-1, 1]) crystal(c, sd * w * 1.3, T * 0.05, T * 0.1, T * 0.5, GLASS, lw * 0.7, sd * 0.4);
      glowIn(c, 0, -h * 0.65, T * 0.9, '#FFFFFF', 0.35); },
    /* a kelp of light: broad ribboned fronds, each shaded across its width and twisting, a hue running up each */
    lightkelp(c, T, v) { const lw = lw0(T), sw = Math.sin(v * 1.7) * T * 0.2; shadowEll(c, T, 0.45);
      for (let k = 0; k < 3; k++) { const x0 = (k - 1) * T * 0.24, col = HUE[(v + k * 2) % 6], top = -T * (2.6 + k * 0.3), tx = x0 + sw * 1.5;
        c.beginPath(); c.moveTo(x0 - T * 0.09, 0); c.bezierCurveTo(x0 - T * 0.34 + sw, -T * 1.2, x0 + T * 0.3 + sw, -T * 2.0, tx, top); c.bezierCurveTo(x0 + T * 0.38 + sw, -T * 2.0, x0 + T * 0.06 + sw, -T * 1.2, x0 + T * 0.09, 0); c.closePath();
        const g = c.createLinearGradient(x0 - T * 0.3, 0, x0 + T * 0.35, 0); g.addColorStop(0, shadeC(col, 0.4)); g.addColorStop(0.5, col); g.addColorStop(1, shadeC(col, -0.3)); c.globalAlpha = 0.9; c.fillStyle = g; c.fill(); c.globalAlpha = 1; ink(c, lw * 0.8);
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(1, lw * 0.5); c.beginPath(); c.moveTo(x0, -T * 0.1); c.bezierCurveTo(x0 - T * 0.08 + sw, -T * 1.2, x0 + T * 0.12 + sw, -T * 2.0, tx, top + T * 0.15); c.stroke(); glowIn(c, tx, top + T * 0.2, T * 0.35, col, 0.4); } },
    /* a glass urchin: a shaded sphere of glass with clear spines all round it, each catching a hue */
    glassurchin(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.65); const cy = -T * 0.48;
      for (let i = 0; i < 18; i++) { const a = -Math.PI * 1.05 + (i + 0.5) / 18 * Math.PI * 1.1, L = T * (0.78 + (i % 3) * 0.12); c.strokeStyle = LN; c.lineWidth = lw * 1.7; c.beginPath(); c.moveTo(Math.cos(a) * T * 0.3, cy + Math.sin(a) * T * 0.26); c.lineTo(Math.cos(a) * L, cy + Math.sin(a) * L * 0.9); c.stroke(); c.strokeStyle = HUE[i % 6]; c.lineWidth = lw * 0.9; c.stroke(); }
      c.beginPath(); c.arc(0, cy, T * 0.44, 0, TAU); const g = c.createRadialGradient(-T * 0.16, cy - T * 0.16, T * 0.04, 0, cy, T * 0.44); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, GLASS); g.addColorStop(1, GLASS_D); c.fillStyle = g; c.fill(); ink(c, lw);
      c.fillStyle = 'rgba(255,255,255,.85)'; ell(c, -T * 0.15, cy - T * 0.18, T * 0.1, T * 0.06, -0.5); c.fill(); c.strokeStyle = 'rgba(90,140,170,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(0, cy, T * 0.3, 0.2, 1.4); c.stroke(); },
    /* a bloom of the fallen colour: petals that shift between two impossible hues, a heart that will not hold still */
    huebloom(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.7); glowIn(c, 0, -T * 1.2, T * 1.6, UNSEEN, 0.45);
      c.strokeStyle = LN; c.lineWidth = T * 0.1 + lw; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.15, -T * 0.6, 0, -T * 1.1); c.stroke(); c.strokeStyle = '#3A6A6A'; c.lineWidth = T * 0.1; c.stroke();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + v; c.save(); c.translate(0, -T * 1.3); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.3, -T * 0.25, 0, -T * 0.7); c.quadraticCurveTo(-T * 0.3, -T * 0.25, 0, 0); const g = c.createLinearGradient(0, 0, 0, -T * 0.7); g.addColorStop(0, UNSEEN); g.addColorStop(1, UNSEEN2); c.fillStyle = g; c.fill(); ink(c, lw * 0.7); c.restore(); }
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, -T * 1.3, T * 0.15, 0, TAU); c.fill(); },
    /* a black meteor shard half sunk in the floor, veins of the fallen colour in its cracks */
    meteorshard(c, T, v) { const lw = lw0(T), R = rnd(41 + v * 9); shadowEll(c, T, 0.85);
      c.beginPath(); c.moveTo(-T * 0.9, 0); c.lineTo(-T * 0.6, -T * 1.4); c.lineTo(-T * 0.1, -T * 2.5); c.lineTo(T * 0.5, -T * 1.7); c.lineTo(T * 0.85, 0); c.closePath(); c.fillStyle = shade(c, '#2A2840', T, -T * 0.3, -T * 1.6, 0.4); c.fill(); ink(c, lw);
      c.save(); c.clip(); c.lineWidth = Math.max(1.5, lw); for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * T * 1.2; c.strokeStyle = i % 2 ? UNSEEN : UNSEEN2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (R() - 0.5) * T * 0.6, -T * (0.8 + R())); c.lineTo(x + (R() - 0.5) * T * 0.6, -T * (1.6 + R() * 0.8)); c.stroke(); } c.restore();
      glowIn(c, 0, -T * 1.3, T * 1.2, UNSEEN, 0.3); },
    /* a coral that grew from starlight: pale branches tipped with little stars */
    starcoral(c, T, v) { const lw = lw0(T), R = rnd(51 + v * 3); shadowEll(c, T, 0.75);
      const br = (x, y, a, L, d) => { const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = T * 0.06 * (d + 1.4) + lw * 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = DEEP_HI; c.lineWidth = T * 0.06 * (d + 1.4); c.stroke(); if (d > 0) { br(x2, y2, a - 0.5 - R() * 0.2, L * 0.7, d - 1); br(x2, y2, a + 0.5 + R() * 0.2, L * 0.7, d - 1); } else { glowIn(c, x2, y2, T * 0.35, STAR, 0.6); GFX.star(c, x2, y2, T * 0.12, STAR, 0); } };
      br(-T * 0.18, 0, -Math.PI / 2 - 0.3, T * 0.85, 2); br(T * 0.18, 0, -Math.PI / 2 + 0.3, T * 0.9, 2); },
    /* a black pearl the size of a boulder, the fallen colour sliding over its skin */
    voidpearl(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.6);
      ell(c, 0, -T * 0.25, T * 0.6, T * 0.2); c.fillStyle = '#3A3858'; c.fill(); ink(c, lw * 0.8);
      c.beginPath(); c.arc(0, -T * 0.75, T * 0.55, 0, TAU); const g = c.createRadialGradient(-T * 0.2, -T * 0.95, T * 0.05, 0, -T * 0.75, T * 0.55); g.addColorStop(0, '#6A6890'); g.addColorStop(0.5, '#1A1830'); g.addColorStop(1, '#0A0818'); c.fillStyle = g; c.fill(); ink(c, lw);
      c.strokeStyle = UNSEEN; c.globalAlpha = 0.6; c.lineWidth = Math.max(1.5, lw); c.beginPath(); c.arc(0, -T * 0.75, T * 0.4, Math.PI * (0.1 + v * 0.3), Math.PI * (0.7 + v * 0.3)); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = 'rgba(255,255,255,.65)'; ell(c, -T * 0.2, -T * 0.98, T * 0.12, T * 0.07, -0.4); c.fill(); },
    /* a column of the fallen colour welling up out of the floor: soft, rising, never one hue for long */
    huecolumn(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.6, 0.35);
      ell(c, 0, -T * 0.15, T * 0.55, T * 0.2); c.fillStyle = '#1A1830'; c.fill(); ink(c, lw);
      for (let i = 0; i < 7; i++) { const u = i / 6, y = -T * (0.4 + u * 3.2), r = T * (0.55 - u * 0.25); glowIn(c, Math.sin(u * 5 + v) * T * 0.08, y, r, i % 2 ? UNSEEN : UNSEEN2, 0.5 * (1 - u * 0.75)); }
      glowIn(c, 0, -T * 2.0, T * 1.3, UNSEEN2, 0.35); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? UNSEEN : UNSEEN2; c.globalAlpha = 0.8; c.beginPath(); c.arc((i - 1.5) * T * 0.18, -T * (0.8 + i * 0.75), T * 0.07, 0, TAU); c.fill(); } c.globalAlpha = 1; },
  });

  /* ---- the lands ---- */
  const land = o => Object.assign({ rift: true, tile: 'caves', out: true, ambient: 'motes', hazard: 'laser', bridgeFn: glassBridge, bridgeEdge: glassEdge, propN: [5, 3] }, o);
  BIOMES.greyshore = land({ name: 'The Grey Shore', dark: 0.12, bg: '#8E8E98', gap: 'greysea', accent: '#FFFFFF', light: '#FFFFFF', bridgeCol: '#D8E4EA', deco: COL.Y,
    floor: ['#C9C8CC', '#C2C1C6', '#CFCED2'], grout: '#9C9BA2', hi: '#EEEEF2', top: '#A8A7AE', face: '#8A8990', faceD: '#6A6970', cliff: '#7A7980', grade: 'rgba(220,220,230,.05)',
    props: ['bleachcoral', 'driftwood', 'greyrock', 'prismshard', 'bleachcoral', 'greyrock', 'greylighthouse', 'driftwood'], fog: '#8E8E98', darkRGB: '60,60,70' });
  BIOMES.prismreef = land({ name: 'The Prism Reefs', dark: 0.1, bg: '#7AD8E8', gap: 'lightshallow', accent: COL.B, light: GLASS_HI, bridgeCol: GLASS, deco: COL.V,
    floor: ['#E4F4F6', '#DCEEF2', '#EAF8FA'], grout: '#A8CCD6', hi: '#FFFFFF', top: '#B8DCE4', face: '#94BCC8', faceD: '#6E98A6', cliff: '#6A94A2', grade: 'rgba(180,160,255,.06)',
    props: ['glasscoral', 'crystalarch', 'prismspire', 'lightkelp', 'glassurchin', 'glasscoral', 'lightkelp'], fog: '#7AD8E8', darkRGB: '40,80,100' });
  BIOMES.huedeep = land({ name: 'The Deep of the Fallen Colour', dark: 0.3, bg: '#0A0C24', gap: 'huedeep', accent: UNSEEN, light: STAR, bridgeCol: '#4A4A7A', deco: UNSEEN2,
    floor: ['#2E2E58', '#2A2A52', '#33335E'], grout: '#1C1C3A', hi: '#5A5A90', top: '#24244A', face: '#1C1C3C', faceD: '#10102A', cliff: '#14142E', grade: 'rgba(224,76,255,.06)',
    props: ['huebloom', 'meteorshard', 'starcoral', 'voidpearl', 'huecolumn', 'starcoral', 'huebloom'], fog: '#0A0C24', darkRGB: '10,12,36' });
  BIOME_ORDER.push('greyshore', 'prismreef', 'huedeep');
  DARK_COL.greyshore = '60,60,70'; DARK_COL.prismreef = '40,80,100'; DARK_COL.huedeep = '10,12,36';
  if (typeof DECALS !== 'undefined') { DECALS.greyshore = [['greyshell', 0.06], ['hueshard', 0.03], ['pebbles', 0.05]]; DECALS.prismreef = [['glasssand', 0.08], ['caustic', 0.07], ['hueshard', 0.02]]; DECALS.huedeep = [['starsand', 0.08], ['iridvein', 0.06], ['crack', 0.03]]; }
  const RIMS = { greyshore: ['bleachcoral', 'greyrock', 'driftwood', 'bleachcoral'], prismreef: ['glasscoral', 'lightkelp', 'glassurchin', 'glasscoral'], huedeep: ['starcoral', 'meteorshard', 'huebloom', 'starcoral'] };
  function dressRim({ rm, i, G, RM, props, R, MW, walk, okFeature, first, id }) {
    const L = RIMS[rm.biome]; if (!L) return; const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 20) return; const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && [1, -1, MW, -MW].some(d => !walk(k + d) && !props.has(k + d)); });
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]]; for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } } return seen.size >= open.length; };
    let want = Math.round(rim.length * (first ? 0.15 : 0.25)), tries = 0;
    while (want > 0 && rim.length && tries++ < 150) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1); if ([1, -1, MW, -MW].filter(d => props.has(k + d)).length > 1) continue; const was = G[k]; G[k] = T_SOLID; if (!connected()) { G[k] = was; continue; } props.set(k, L[Math.floor(R() * L.length)]); want--; }
  }
  /* ---- the floors of the shore and the reefs: every tile its own texture, its seams faintly coloured, and the island's
     edge banded with colour like the glass bridges ---- */
  const hueI = i => HUE[((i % 6) + 6) % 6], rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  // the seams: a faint line of colour along the top and left of each tile (so each seam is drawn once), a bevel of light
  // just inside it and a shade along the far sides, so the tiles read as set slabs
  function seams(c, X, Y, T, x, y, a) { const w = Math.max(1, T * 0.035);
    c.globalAlpha = a; c.fillStyle = hueAt((x + y) * 0.085, 85, 68); c.fillRect(X, Y, T, w); c.fillStyle = hueAt((x + y) * 0.085 + 0.5, 85, 68); c.fillRect(X, Y, w, T);
    c.globalAlpha = 1; c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(X + w, Y + w, T - w, Math.max(1, T * 0.02)); c.fillRect(X + w, Y + w, Math.max(1, T * 0.02), T - w);
    c.fillStyle = 'rgba(20,20,40,.12)'; c.fillRect(X, Y + T - Math.max(1, T * 0.03), T, Math.max(1, T * 0.03)); c.fillRect(X + T - Math.max(1, T * 0.03), Y, Math.max(1, T * 0.03), T); }
  // the island's rim: two bands of colour along every side that drops into the sea, as on the bridges
  function rimBands(c, X, Y, T, x, y, gN, gS, gW, gE) { const b1 = Math.max(1.5, T * 0.055), b2 = Math.max(1.5, T * 0.04); c.globalAlpha = 0.72;
    if (gN) { c.fillStyle = hueI(x); c.fillRect(X, Y + T * 0.05, T, b1); c.fillStyle = hueI(x + 3); c.fillRect(X, Y + T * 0.05 + b1 * 1.6, T, b2); }
    if (gS) { c.fillStyle = hueI(x + 3); c.fillRect(X, Y + T * 0.95 - b1, T, b1); c.fillStyle = hueI(x); c.fillRect(X, Y + T * 0.95 - b1 * 1.6 - b2, T, b2); }
    if (gW) { c.fillStyle = hueI(y); c.fillRect(X + T * 0.05, Y, b1, T); c.fillStyle = hueI(y + 3); c.fillRect(X + T * 0.05 + b1 * 1.6, Y, b2, T); }
    if (gE) { c.fillStyle = hueI(y + 3); c.fillRect(X + T * 0.95 - b1, Y, b1, T); c.fillStyle = hueI(y); c.fillRect(X + T * 0.95 - b1 * 1.6 - b2, Y, b2, T); }
    c.globalAlpha = 1; }
  const grain = (c, X, Y, T, R, n, dark, lite) => { for (let i = 0; i < n; i++) { c.fillStyle = i % 3 ? dark : lite; const s = Math.max(1, T * (0.015 + R() * 0.02)); c.fillRect(X + R() * T, Y + R() * T, s, s); } };
  const pebble = (c, x, y, r, col, lw) => { ell(c, x, y + r * 0.25, r * 1.05, r * 0.55); c.fillStyle = 'rgba(30,30,40,.22)'; c.fill(); ell(c, x, y, r, r * 0.68); c.fillStyle = shade(c, col, r, x, y, 0.45); c.fill(); c.strokeStyle = rgba(LN, 0.45); c.lineWidth = Math.max(1, lw * 0.5); c.stroke(); };

  function shoreFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) { const R = rnd(x * 7919 + y * 104729 + 3), kind = Math.floor(hh(x, y, 41) * 7);
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    grain(c, X, Y, T, R, 10, 'rgba(70,70,84,.18)', 'rgba(255,255,255,.4)');
    if (kind === 0) { /* wet sand: ripples left by the grey tide, each a light crest over a shaded trough */
      for (let i = 0; i < 4; i++) { const yy = Y + T * (0.18 + i * 0.22), ph = R() * 3; c.lineWidth = Math.max(1, T * 0.035); c.strokeStyle = 'rgba(90,90,104,.22)'; c.beginPath(); for (let k = 0; k <= 8; k++) { const xx = X + T * k / 8; c.lineTo(xx, yy + Math.sin(k * 0.9 + ph) * T * 0.035 + T * 0.02); } c.stroke(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = Math.max(1, T * 0.022); c.beginPath(); for (let k = 0; k <= 8; k++) { const xx = X + T * k / 8; c.lineTo(xx, yy + Math.sin(k * 0.9 + ph) * T * 0.035); } c.stroke(); } }
    else if (kind === 1) { /* a scatter of shaded pebbles, one of them still faintly coloured */
      const n = 4 + Math.floor(R() * 3); for (let i = 0; i < n; i++) pebble(c, X + T * (0.15 + R() * 0.7), Y + T * (0.2 + R() * 0.65), T * (0.05 + R() * 0.06), i === 0 ? shadeC(hueI(x + y), 0.25) : ['#B4B3BA', '#9E9DA6', '#C8C7CE'][i % 3], lw); }
    else if (kind === 2) { /* a flat stone half sunk in the sand: an irregular slab, raised, lit on its upper edge, with a crack of its own */
      const cx = X + T * (0.42 + R() * 0.16), cy = Y + T * (0.42 + R() * 0.16), rx = T * (0.22 + R() * 0.14), ry = T * (0.16 + R() * 0.1), n = 6 + Math.floor(R() * 3), rot = R() * TAU, pts = [];
      for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, k = 0.78 + R() * 0.3; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
      const path = () => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
      c.save(); c.translate(T * 0.025, T * 0.04); path(); c.fillStyle = 'rgba(30,30,44,.2)'; c.fill(); c.restore();
      path(); c.fillStyle = shade(c, ['#D6D5DB', '#C4C3CA', '#DCDBE0'][kind + n & 1 ? 1 : (n % 3)], Math.max(rx, ry), cx, cy, 0.22); c.fill(); c.strokeStyle = 'rgba(80,80,96,.42)'; c.lineWidth = Math.max(1, lw * 0.5); c.stroke();
      if (R() < 0.7) { const p0 = pts[Math.floor(R() * n)]; c.strokeStyle = 'rgba(60,60,74,.45)'; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(cx + (R() - 0.5) * rx * 0.5, cy + (R() - 0.5) * ry * 0.5); c.lineTo(cx + (R() - 0.5) * rx * 1.2, cy + (R() - 0.5) * ry * 1.2); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(cx, cy, rx * 0.8, ry * 0.75, 0, Math.PI * 1.1, Math.PI * 1.65); c.stroke(); }
    else if (kind === 3) { /* bits of bleached shell: little ribbed fans, lit on one side */
      for (let i = 0; i < 3; i++) { const sx = X + T * (0.2 + R() * 0.6), sy = Y + T * (0.25 + R() * 0.55), r = T * (0.07 + R() * 0.05), a = R() * TAU; c.save(); c.translate(sx, sy); c.rotate(a);
        c.beginPath(); c.moveTo(0, r * 0.3); c.arc(0, r * 0.3, r, Math.PI * 1.15, Math.PI * 1.85); c.closePath(); c.fillStyle = shade(c, '#ECEBF0', r, -r * 0.2, -r * 0.4, 0.3); c.fill(); c.strokeStyle = rgba(LN, 0.4); c.lineWidth = Math.max(1, lw * 0.45); c.stroke();
        c.strokeStyle = 'rgba(110,110,124,.45)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { const aa = Math.PI * (1.15 + k * 0.175); c.beginPath(); c.moveTo(0, r * 0.3); c.lineTo(Math.cos(aa) * r * 0.9, r * 0.3 + Math.sin(aa) * r * 0.9); c.stroke(); } c.restore(); } }
    else if (kind === 4) { /* glass sand: the beach fused to a glassy sheen, glinting in colour */
      const g = c.createLinearGradient(X, Y, X + T, Y + T); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.12)'); c.fillStyle = g; c.fillRect(X, Y, T, T);
      for (let i = 0; i < 6; i++) { const gx = X + T * R(), gy = Y + T * R(), s = T * (0.03 + R() * 0.03); c.fillStyle = i % 2 ? '#FFFFFF' : hueI(i + x); c.globalAlpha = 0.8; c.beginPath(); c.moveTo(gx, gy - s * 1.6); c.lineTo(gx + s * 0.5, gy); c.lineTo(gx, gy + s * 1.6); c.lineTo(gx - s * 0.5, gy); c.closePath(); c.fill(); c.globalAlpha = 1; } }
    else if (kind === 5) { /* a shallow pool left by the tide: a sunken grey mirror with a lip of light and a sheen of colour */
      const px = X + T * (0.35 + R() * 0.3), py = Y + T * (0.4 + R() * 0.2), rx = T * 0.3, ry = T * 0.2;
      ell(c, px, py, rx * 1.12, ry * 1.18); c.fillStyle = 'rgba(80,80,96,.3)'; c.fill();
      ell(c, px, py + ry * 0.08, rx, ry); const pg = c.createLinearGradient(px - rx, py - ry, px + rx, py + ry); pg.addColorStop(0, '#8C8C9A'); pg.addColorStop(0.5, '#B4B6C4'); pg.addColorStop(1, '#9A9CAA'); c.fillStyle = pg; c.fill();
      c.globalAlpha = 0.35; c.fillStyle = hueI(x * 2 + y); ell(c, px + rx * 0.2, py + ry * 0.2, rx * 0.5, ry * 0.3, -0.3); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.ellipse(px, py + ry * 0.08, rx, ry, 0, Math.PI * 0.95, Math.PI * 1.7); c.stroke(); }
    else { /* plain packed sand, just a few foot-dimples and a shell-grit streak */
      for (let i = 0; i < 3; i++) { const dx = X + T * (0.2 + R() * 0.6), dy = Y + T * (0.2 + R() * 0.6); ell(c, dx, dy, T * 0.06, T * 0.035); c.fillStyle = 'rgba(70,70,84,.2)'; c.fill(); ell(c, dx - T * 0.01, dy - T * 0.012, T * 0.05, T * 0.02); c.fillStyle = 'rgba(255,255,255,.3)'; c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1, T * 0.02); c.beginPath(); c.moveTo(X + T * 0.1, Y + T * (0.6 + h2 * 0.3)); c.quadraticCurveTo(X + T * 0.5, Y + T * (0.5 + h * 0.2), X + T * 0.9, Y + T * (0.65 + h2 * 0.2)); c.stroke(); }
    seams(c, X, Y, T, x, y, 0.32); rimBands(c, X, Y, T, x, y, gN, gS, gW, gE); c.restore(); }

  function reefFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) { const R = rnd(x * 6151 + y * 92821 + 9), kind = Math.floor(hh(x, y, 43) * 6);
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    grain(c, X, Y, T, R, 8, 'rgba(90,150,170,.18)', 'rgba(255,255,255,.6)');
    if (kind === 0) { /* caustics: the light of the shallows rippling over the glass sand in a net of soft colour */
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = Math.max(1, T * 0.03);
      for (let i = 0; i < 5; i++) { c.strokeStyle = rgba(hueI(i + x + y), 0.3); c.beginPath(); const sx = X + T * R(), sy = Y + T * R(); c.moveTo(sx - T * 0.3, sy); c.bezierCurveTo(sx - T * 0.1, sy - T * 0.2, sx + T * 0.1, sy + T * 0.2, sx + T * 0.3, sy - T * 0.05); c.stroke(); } c.restore(); }
    else if (kind === 1) { /* a shard of glass set in the sand: a tilted, bevelled sliver, a rainbow caught in its edge */
      const cx = X + T * (0.35 + R() * 0.3), cy = Y + T * (0.35 + R() * 0.3), w = T * (0.16 + R() * 0.14), hgt = T * (0.1 + R() * 0.1); c.save(); c.translate(cx, cy); c.rotate((R() - 0.5) * 1.4);
      const sh = () => { c.beginPath(); c.moveTo(-w, -hgt * 0.4); c.lineTo(-w * 0.2, -hgt); c.lineTo(w, -hgt * 0.2); c.lineTo(w * 0.5, hgt); c.lineTo(-w * 0.7, hgt * 0.7); c.closePath(); };
      c.save(); c.translate(T * 0.025, T * 0.035); sh(); c.fillStyle = 'rgba(60,110,130,.2)'; c.fill(); c.restore();
      sh(); const g = c.createLinearGradient(-w, -hgt, w, hgt); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#DDF3F7'); g.addColorStop(1, '#A8D4E0'); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(80,140,160,.5)'; c.lineWidth = Math.max(1, lw * 0.5); c.stroke();
      c.globalAlpha = 0.65; for (let i = 0; i < 3; i++) { c.strokeStyle = hueI(x + y + i * 2); c.lineWidth = Math.max(1, T * 0.02); c.beginPath(); c.moveTo(w * (0.92 - i * 0.07), -hgt * (0.2 - i * 0.05)); c.lineTo(w * (0.45 - i * 0.07), hgt * (0.95 - i * 0.1)); c.stroke(); } c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(-w * 0.75, -hgt * 0.35); c.lineTo(-w * 0.2, -hgt * 0.8); c.stroke(); c.restore(); }
    else if (kind === 2) { /* sand ripples of crushed glass, their crests sparkling */
      for (let i = 0; i < 3; i++) { const yy = Y + T * (0.25 + i * 0.27), ph = R() * 3; c.strokeStyle = 'rgba(100,160,180,.3)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); for (let k = 0; k <= 8; k++) c.lineTo(X + T * k / 8, yy + Math.sin(k + ph) * T * 0.04 + T * 0.025); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1, T * 0.022); c.beginPath(); for (let k = 0; k <= 8; k++) c.lineTo(X + T * k / 8, yy + Math.sin(k + ph) * T * 0.04); c.stroke(); } }
    else if (kind === 3) { /* tiny glass pebbles of every colour, each a shaded bead with a glint */
      for (let i = 0; i < 6; i++) { const r = T * (0.035 + R() * 0.035); pebble(c, X + T * (0.15 + R() * 0.7), Y + T * (0.15 + R() * 0.7), r, shadeC(hueI(i + x + y), 0.35), lw); } }
    else if (kind === 4) { /* a ring of light where a drop fell from the reef above */
      const px = X + T * (0.3 + R() * 0.4), py = Y + T * (0.3 + R() * 0.4); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { c.strokeStyle = rgba(hueI(x + y + i * 2), 0.35 - i * 0.08); c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.ellipse(px, py, T * (0.12 + i * 0.1), T * (0.07 + i * 0.06), 0, 0, TAU); c.stroke(); } c.restore(); }
    else { /* clean glass sand, a gloss across it */
      const g = c.createLinearGradient(X, Y + T, X + T, Y); g.addColorStop(0.3, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.35)'); g.addColorStop(0.7, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    seams(c, X, Y, T, x, y, 0.4); rimBands(c, X, Y, T, x, y, gN, gS, gW, gE); c.restore(); }

  // the cliff below an edge of the island: bands of colour across its top, like the bridges' sides, and a soft wash of
  // the same colour down the face
  function rimCliff(c, x, y, X, Y, T, lw, B, isGap) { const rr = T * 0.38, rl = isGap(x - 1, y) ? rr : 0, rg = isGap(x + 1, y) ? rr : 0, H = T * 0.62, w = T - rl - rg;
    const wash = c.createLinearGradient(0, Y, 0, Y + H * 0.75); wash.addColorStop(0, rgba(hueI(x), 0.3)); wash.addColorStop(1, rgba(hueI(x), 0)); c.fillStyle = wash; c.fillRect(X + rl, Y, w, H * 0.75);
    c.globalAlpha = 0.75; c.fillStyle = hueI(x); c.fillRect(X + rl, Y + H * 0.1, w, Math.max(1.5, T * 0.05)); c.fillStyle = hueI(x + 3); c.fillRect(X + rl, Y + H * 0.1 + T * 0.08, w, Math.max(1.5, T * 0.04)); c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(X + rl, Y, w, Math.max(1, T * 0.025)); }
  Object.assign(BIOMES.greyshore, { floorFn: shoreFloor, cliffTint: rimCliff });
  Object.assign(BIOMES.prismreef, { floorFn: reefFloor, cliffTint: rimCliff });
  BIOMES.greyshore.dress = BIOMES.prismreef.dress = BIOMES.huedeep.dress = dressRim;

  /* ---- the brood ---- */
  Object.assign(MON, {
    greyling: { name: 'Greyling', from: 999, hp: 300, spd: 1.7, r: 0.48, dmg: 20, xp: 18, coin: 1.0, color: '#B4B4BC', bio: ['greyshore', 'prismreef', 'huedeep'], tip: 'A crab-husk drained of all its colour. It scuttles in to pinch; if it catches hold it drains you until you roll free.', kit: [] },
    huewisp: { name: 'Hue wisp', from: 999, hp: 230, spd: 1.3, r: 0.42, dmg: 16, xp: 16, coin: 0.9, color: '#FF9F43', bio: ['greyshore', 'prismreef', 'huedeep'], fly: true, tip: 'An orb of loose colour. It drifts close, swells, and bursts into a splash of paint on a shown circle: the splash slows you.', kit: [] },
    prismray: { name: 'Prism ray', from: 999, hp: 260, spd: 1.5, r: 0.5, dmg: 18, xp: 17, coin: 1.0, color: '#C8EEF4', bio: ['prismreef', 'huedeep'], fly: true, tip: 'A manta of glass. It fires a beam of light along a shown line; at the line\'s end the beam splits in two (also shown).', kit: [] },
    shardback: { name: 'Shardback', from: 999, hp: 420, spd: 1.0, r: 0.62, dmg: 22, xp: 20, coin: 1.1, color: '#7FB8C8', bio: ['prismreef'], tip: 'A turtle with a shell of glass. Blows from the front glance off its shell: get round behind it. It charges along a shown line.', kit: [] },
    chromawraith: { name: 'Chroma wraith', from: 999, hp: 280, spd: 1.8, r: 0.46, dmg: 20, xp: 18, coin: 1.0, color: '#E04CFF', bio: ['huedeep'], tip: 'A wraith of the fallen colour. It blinks to your side, then slashes the shown arc: step out of it.', kit: [] },
  });
  Object.assign(MP, {
    /* a grey crab-husk: a cracked shell, two big pincers, eye-stalks with empty grey eyes */
    greyling(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU * 2), grab = o.mode === 'block' ? 1 : 0;
      c.fillStyle = 'rgba(14,16,30,.25)'; ell(c, 0, r * 0.7, r * 0.85, r * 0.24); c.fill();
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) limb(c, sd * r * 0.4, r * 0.25, sd * r * (0.85 + i * 0.05), r * (0.45 + i * 0.12) + run * sd * r * 0.06 * (i % 2 ? 1 : -1), lw * 0.9, '#8E8E96');
      for (const sd of [-1, 1]) { const cx = sd * r * (0.85 + grab * 0.15), cy = -r * 0.25; limb(c, sd * r * 0.4, -r * 0.05, cx, cy, lw * 1.3, '#9A9AA2'); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + sd * r * 0.4, cy - r * (0.32 - grab * 0.2)); c.lineTo(cx + sd * r * 0.2, cy); c.lineTo(cx + sd * r * 0.4, cy + r * (0.25 - grab * 0.15)); c.closePath(); c.fillStyle = '#C8C8D0'; c.fill(); stroke(c, lw); }
      ell(c, 0, r * 0.05, r * 0.68, r * 0.48); c.fillStyle = shade(c, o.color, r, -r * 0.25, -r * 0.2, 0.4); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(60,60,70,.45)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-r * 0.2, -r * 0.35); c.lineTo(-r * 0.05, r * 0.05); c.lineTo(-r * 0.25, r * 0.3); c.moveTo(r * 0.25, -r * 0.3); c.lineTo(r * 0.1, -r * 0.05); c.stroke();
      for (const x of [-0.18, 0.18]) { limb(c, x * r, -r * 0.3, x * r, -r * 0.62, lw * 0.7, '#8E8E96'); c.beginPath(); c.arc(x * r, -r * 0.66, r * 0.12, 0, TAU); c.fillStyle = '#E2E2EA'; c.fill(); stroke(c, lw * 0.6); c.fillStyle = '#76767F'; c.beginPath(); c.arc(x * r, -r * 0.66, r * 0.05, 0, TAU); c.fill(); } },
    /* an orb of loose colour: a soft ball cycling through the hues, little drips; it swells before it bursts */
    huewisp(c, r, ph, o) { const lw = lwOf(r), sw = o.mode === 'block' ? 1 : 0, bob = Math.sin(ph * TAU) * r * 0.15, k = 1 + sw * 0.35, col = hueAt(ph * 0.5 + (o.seed || 0));
      c.fillStyle = 'rgba(14,16,30,.18)'; ell(c, 0, r * 1.1, r * 0.55, r * 0.15); c.fill();
      c.save(); c.translate(0, -r * 0.55 + bob); glowIn(c, 0, 0, r * (1.7 + sw), col, 0.6);
      c.beginPath(); c.arc(0, 0, r * 0.7 * k, 0, TAU); c.fillStyle = col; c.fill(); stroke(c, lw);
      c.fillStyle = 'rgba(255,255,255,.7)'; ell(c, -r * 0.22 * k, -r * 0.25 * k, r * 0.2 * k, r * 0.12 * k, -0.5); c.fill();
      for (let i = 0; i < 3; i++) { const x = (i - 1) * r * 0.3, L = r * (0.35 + 0.2 * Math.sin(ph * TAU * 2 + i)); c.fillStyle = hueAt(ph * 0.5 + i * 0.15); c.beginPath(); c.ellipse(x, r * 0.62 * k + L * 0.5, r * 0.07, L * 0.5, 0, 0, TAU); c.fill(); }
      c.restore(); },
    /* a manta of clear glass, a rainbow line along its wing edges, two pale eyes; it holds still as it aims */
    prismray(c, r, ph, o) { const lw = lwOf(r), fl = Math.sin(ph * TAU * 1.5) * 0.25, aim = o.mode === 'block' ? 1 : 0, bob = Math.sin(ph * TAU) * r * 0.1;
      c.fillStyle = 'rgba(14,16,30,.18)'; ell(c, 0, r * 1.0, r * 0.9, r * 0.2); c.fill();
      c.save(); c.translate(0, -r * 0.5 + bob);
      c.beginPath(); c.moveTo(0, -r * 0.55); c.quadraticCurveTo(r * 0.8, -r * (0.6 + fl), r * 1.35, -r * (0.05 + fl)); c.quadraticCurveTo(r * 0.7, r * 0.15, r * 0.25, r * 0.45); c.lineTo(0, r * 0.35); c.lineTo(-r * 0.25, r * 0.45); c.quadraticCurveTo(-r * 0.7, r * 0.15, -r * 1.35, -r * (0.05 + fl)); c.quadraticCurveTo(-r * 0.8, -r * (0.6 + fl), 0, -r * 0.55); c.closePath();
      c.globalAlpha = 0.85; c.fillStyle = shade(c, o.color, r, -r * 0.3, -r * 0.4, 0.35); c.fill(); c.globalAlpha = 1; stroke(c, lw);
      for (let i = 0; i < 3; i++) { c.strokeStyle = HUE[(i * 2) % 6]; c.globalAlpha = 0.7; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-r * (1.2 - i * 0.05), -r * (0.08 + fl - i * 0.05)); c.quadraticCurveTo(-r * 0.7, -r * (0.5 + fl - i * 0.05), 0, -r * (0.45 - i * 0.05)); c.quadraticCurveTo(r * 0.7, -r * (0.5 + fl - i * 0.05), r * (1.2 - i * 0.05), -r * (0.08 + fl - i * 0.05)); c.stroke(); } c.globalAlpha = 1;
      c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(0, r * 0.35); c.quadraticCurveTo(r * 0.1, r * 0.9, -r * 0.05, r * 1.3); c.stroke();
      for (const sd of [-1, 1]) { c.fillStyle = aim ? '#FFFFFF' : '#2A4A5A'; c.beginPath(); c.arc(sd * r * 0.18, -r * 0.2, r * 0.07, 0, TAU); c.fill(); }
      if (aim) glowIn(c, 0, -r * 0.1, r * 1.0, '#FFFFFF', 0.5); c.restore(); },
    /* a squat turtle under a shell of glass panels, a rainbow caught in each */
    shardback(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU * 2), ch = o.mode === 'dash' ? 1 : 0;
      c.fillStyle = 'rgba(14,16,30,.25)'; ell(c, 0, r * 0.62, r * 0.95, r * 0.25); c.fill();
      for (const [x, y] of [[-0.6, 0.4], [0.6, 0.4], [-0.5, -0.1], [0.5, -0.1]]) limb(c, x * r * 0.7, y * r, x * r, y * r + r * 0.25 + run * r * 0.05 * Math.sign(x), lw * 1.6, '#5A8A6A');
      limb(c, r * 0.6, -r * 0.05, r * (0.95 + ch * 0.1), -r * 0.12, lw * 2.0, '#5A8A6A'); c.beginPath(); c.arc(r * (1.0 + ch * 0.1), -r * 0.15, r * 0.22, 0, TAU); c.fillStyle = '#6A9A7A'; c.fill(); stroke(c, lw); c.fillStyle = INK; c.beginPath(); c.arc(r * (1.08 + ch * 0.1), -r * 0.2, r * 0.05, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-r * 0.85, r * 0.25); c.quadraticCurveTo(-r * 0.85, -r * 0.75, 0, -r * 0.8); c.quadraticCurveTo(r * 0.85, -r * 0.75, r * 0.85, r * 0.25); c.closePath(); c.globalAlpha = 0.9; c.fillStyle = shade(c, o.color, r, -r * 0.3, -r * 0.5, 0.35); c.fill(); c.globalAlpha = 1; stroke(c, lw);
      c.save(); c.clip(); for (let i = 0; i < 5; i++) { const x = -r * 0.6 + i * r * 0.3; c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(x, r * 0.25); c.lineTo(x + r * 0.15, -r * 0.8); c.stroke(); c.fillStyle = HUE[i % 6]; c.globalAlpha = 0.35; c.fillRect(x, -r * 0.6, r * 0.18, r * 0.5); c.globalAlpha = 1; } c.restore(); },
    /* a tall thin wraith of the fallen colour, shifting between two hues, with a long blade of a hand */
    chromawraith(c, r, ph, o) { const lw = lwOf(r), sl = o.mode === 'dash' ? 1 : 0, up = o.mode === 'block' ? 1 : 0, sw = Math.sin(ph * TAU) * 0.12;
      c.fillStyle = 'rgba(14,16,30,.22)'; ell(c, 0, r * 0.85, r * 0.55, r * 0.16); c.fill(); glowIn(c, 0, -r * 0.3, r * 1.6, ph % 1 < 0.5 ? UNSEEN : UNSEEN2, 0.4);
      c.beginPath(); c.moveTo(-r * 0.45, r * 0.8); c.quadraticCurveTo(-r * 0.6, -r * 0.2, -r * 0.2 + sw * r, -r * 1.0); c.quadraticCurveTo(r * 0.15, -r * 1.25, r * 0.4, -r * 0.8); c.quadraticCurveTo(r * 0.6, r * 0.1, r * 0.45, r * 0.8); for (let i = 4; i >= 0; i--) c.lineTo(-r * 0.45 + r * 0.9 * i / 4, r * (0.6 + (i % 2) * 0.22)); c.closePath();
      const g = c.createLinearGradient(0, -r * 1.2, 0, r * 0.8); g.addColorStop(0, UNSEEN); g.addColorStop(1, UNSEEN2); c.fillStyle = g; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1; stroke(c, lw);
      c.fillStyle = '#FFFFFF'; for (const x of [-0.05, 0.2]) { c.beginPath(); c.ellipse(x * r, -r * 0.7, r * 0.07, r * 0.04, 0.2, 0, TAU); c.fill(); }
      c.save(); c.translate(r * 0.35, -r * 0.35); c.rotate(up ? -1.3 : sl ? 0.9 : -0.3); c.beginPath(); c.moveTo(0, 0); c.lineTo(r * 1.1, -r * 0.12); c.lineTo(r * 0.2, r * 0.14); c.closePath(); c.fillStyle = '#F4F0FF'; c.fill(); stroke(c, lw * 0.8); c.restore(); },
  });
  Object.assign(EXT, { greyling: 3.0, huewisp: 3.0, prismray: 3.4, shardback: 3.2, chromawraith: 3.4 }); Object.assign(NF, { greyling: 6, huewisp: 6, prismray: 6, shardback: 6, chromawraith: 6 });
  const { mon, keepRange } = DunAI;
  Object.assign(mon, {
    greyling(m, A, X) {
      if (m.holdT > 0) { m.holdT -= A.dt; m.mode = 'block'; m.x = X.me.x + m.hx; m.y = X.me.y + m.hy; if (X.me.dodge) { m.holdT = 0; X.text(m.x, m.y - 1, 'Shaken off!', '#FFFFFF', 12); } else { m.drT = (m.drT || 0) - A.dt; if (m.drT <= 0) { m.drT = 0.5; X.hurtPet(m.dmg * 0.45, m); } } if (m.holdT <= 0) { m.mode = null; m.cd = 2.2; m.x -= m.hx * 1.5; m.y -= m.hy * 1.5; } return; }
      m.mode = null; if (A.d > 0.9) A.steer(A.sp); m.face = A.dx >= 0 ? 1 : -1;
      if (m.cd <= 0 && A.d < 1.3 && !X.me.dodge) { m.cd = 3; if (Math.random() < 0.5) { m.holdT = 1.8; const a = Math.atan2(m.y - X.me.y, m.x - X.me.x); m.hx = Math.cos(a) * 0.7; m.hy = Math.sin(a) * 0.7; X.text(X.me.x, X.me.y - 1.4, 'Caught! Roll free', '#E2E2EA', 12); } else X.hurtPet(m.dmg, m); }
    },
    huewisp(m, A, X) {
      if (m.swT > 0) { m.swT -= A.dt; m.mode = 'block'; if (m.swT <= 0) { m.mode = null; m.cd = 3 + Math.random() * 1.5; } return; }
      m.mode = null; keepRange(m, A, X, 2.2, 4.5); if (m.seed == null) m.seed = Math.random();
      if (m.cd <= 0 && A.d < 5.5) { m.swT = 0.8; const px = X.me.x, py = X.me.y, col = HUE[Math.floor(Math.random() * 6)]; X.warn({ x: px, y: py, r: 1.4, life: 1.1, max: 1.1, src: m, color: col, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.4 + X.me.r * 0.5 && !X.me.dodge) X.hurtPet(m.dmg * 1.2, m); X.zone({ kind: 'stall', x: px, y: py, r: 1.5, life: 3.2, max: 3.2, own: 'enemy' }); X.boom(px, py, 1.2, col, '#FFFFFF', { n: 12, shake: 2 }); } }); }
    },
    prismray(m, A, X) {
      if (m.aimT > 0) { m.aimT -= A.dt; m.mode = 'block'; if (m.aimT <= 0) { m.mode = null; m.cd = 3.2 + Math.random() * 1.2; } return; }
      m.mode = null; keepRange(m, A, X, 3.5, 6.5);
      if (m.cd <= 0 && A.d < 7.5 && A.los()) { m.aimT = 1.0; const a = A.a, L = 6, ex = m.x + Math.cos(a) * L, ey = m.y + Math.sin(a) * L; X.warn({ shape: 'line', x: m.x, y: m.y, a, len: L, w: 0.7, life: 1.0, max: 1.0, src: m, color: '#FFFFFF', fn: () => { if (X.inLine(m.x, m.y, a, L, 0.7) && !X.me.dodge) X.hurtPet(m.dmg * 1.2, m); } });
        for (const sd of [-1, 1]) { const b = a + sd * 0.7; X.warn({ shape: 'line', x: ex, y: ey, a: b, len: 4, w: 0.6, life: 1.25, max: 1.25, src: m, color: HUE[sd < 0 ? 0 : 4], fn: () => { if (X.inLine(ex, ey, b, 4, 0.6) && !X.me.dodge) X.hurtPet(m.dmg * 0.9, m); } }); } }
    },
    shardback(m, A, X) {
      if (m.chT > 0) { m.chT -= A.dt; m.mode = 'dash'; X.moveEnt(m, Math.cos(m.ca) * 8 * A.dt, Math.sin(m.ca) * 8 * A.dt); if (!m.chit && A.d < m.r + X.me.r + 0.25 && !X.me.dodge) { m.chit = true; X.hurtPet(m.dmg * 1.3, m); } if (m.chT <= 0) { m.mode = null; m.cd = 3.4 + Math.random(); } return; }
      if (m.wT > 0) { m.wT -= A.dt; m.mode = 'block'; if (m.wT <= 0) { m.chT = 0.55; m.chit = false; } return; }
      if (!m.guardFn) m.guardFn = q => (Math.abs(DunAI.angTo(q.facing || 0, Math.atan2(X.me.y - q.y, X.me.x - q.x))) < 1.15 ? 0.3 : 1);   // (its shell turns blows from the front)
      m.mode = null; if (A.d > 1.2) A.steer(A.sp); m.face = A.dx >= 0 ? 1 : -1; m.facing = A.a;
      if (m.cd <= 0 && A.d < 5 && A.d > 1.6 && A.los()) { m.wT = 0.8; m.ca = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 4.6, w: 1.2, life: 0.8, max: 0.8, src: m, color: GLASS }); }
    },
    chromawraith(m, A, X) {
      if (m.slT > 0) { m.slT -= A.dt; m.mode = 'dash'; if (m.slT <= 0) { m.mode = null; m.cd = 3 + Math.random() * 1.4; } return; }
      if (m.upT > 0) { m.upT -= A.dt; m.mode = 'block'; if (m.upT <= 0) m.slT = 0.3; return; }
      m.mode = null; keepRange(m, A, X, 2.5, 5);
      if (m.cd <= 0 && A.d < 7) { const a0 = Math.random() * TAU, p = X.freeSpot(X.me.x + Math.cos(a0) * 1.6, X.me.y + Math.sin(a0) * 1.6, m.r); if (!p) { m.cd = 1; return; } X.ring(m.x, m.y, 0.2, 1.2, 0.3, UNSEEN, 0.4); m.x = p.x; m.y = p.y; X.ring(m.x, m.y, 0.2, 1.2, 0.3, UNSEEN2, 0.4);
        m.upT = 0.75; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'cone', x: m.x, y: m.y, a, len: 2.6, spread: 0.9, life: 0.75, max: 0.75, src: m, color: UNSEEN, fn: () => { if (X.inCone(m.x, m.y, a, 2.6, 0.9) && !X.me.dodge) X.hurtPet(m.dmg * 1.3, m); } }); }
    },
  });

  /* ---- prism crystals: break one and it fires beams of colour along six shown lines, through every monster in them ---- */
  Object.assign(MON, { prismcrystal: { name: 'Prism crystal', from: 999, hp: 150, spd: 0, r: 0.55, dmg: 0, xp: 2, coin: 0.2, color: '#C8EEF4', bio: ['greyshore', 'prismreef', 'huedeep'], still: true, tip: 'A crystal heavy with fallen colour. Break it and it fires beams of colour along six shown lines, through every monster in them. Line them up first.', kit: [], onDeath(m, X) { prismBurst(m, X); } } });
  const BEAM_L = 9, BEAM_W = 1.1;
  function prismBurst(m, X) { const x = m.x, y = m.y, a0 = m.rot || 0;
    for (let i = 0; i < 6; i++) { const a = a0 + i / 6 * TAU, col = HUE[i]; X.warn({ shape: 'line', x, y, a, len: BEAM_L, w: BEAM_W, life: 0.35, max: 0.35, color: col, own: 'pet', fn: () => {
      let n = 0; for (const q of X.mons) { if (q.dead || q === m || q.boss || q.fobj || q.type === 'prismcrystal') continue; const rx = q.x - x, ry = q.y - y, al = rx * Math.cos(a) + ry * Math.sin(a), of = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a)); if (al > 0 && al < BEAM_L && of < BEAM_W / 2 + q.r) { n++; X.hitMon(q, q.maxhp * 0.8, { flat: true }); } }
      X.ring(x + Math.cos(a) * BEAM_L, y + Math.sin(a) * BEAM_L, 0.2, 1.0, 0.25, col, 0.4); if (n >= 2) X.text(x + Math.cos(a) * 3, y + Math.sin(a) * 3 - 1, `×${n}`, col, 14); } }); }
    X.boom(x, y, 1.4, '#FFFFFF', '#FFFFFF', { n: 22, shake: 6 }); if (X.sfx.crash) X.sfx.crash(); }
  MP.prismcrystal = (c, r, ph, o) => { const lw = lwOf(r), rot = o.rot || 0;
    c.save(); c.globalAlpha = 0.45; for (let i = 0; i < 6; i++) { const a = rot + i / 6 * TAU; c.strokeStyle = HUE[i]; c.lineWidth = 2; c.setLineDash([5, 7]); c.beginPath(); c.moveTo(Math.cos(a) * r * 1.2, r * 0.6 + Math.sin(a) * r * 0.5); c.lineTo(Math.cos(a) * r * 3.4, r * 0.6 + Math.sin(a) * r * 1.5); c.stroke(); } c.restore();
    c.fillStyle = 'rgba(14,16,30,.3)'; ell(c, 0, r * 0.6, r * 0.9, r * 0.25); c.fill(); glowIn(c, 0, -r * 0.5, r * 1.6, hueAt(ph * 0.3), 0.55);
    crystal(c, -r * 0.4, r * 0.5, r * 0.22, r * 1.1, '#E8FFFF', lw, -0.3); crystal(c, r * 0.4, r * 0.5, r * 0.2, r * 1.0, '#E8FFFF', lw, 0.35); crystal(c, 0, r * 0.55, r * 0.32, r * 1.9, '#E8FFFF', lw, 0);
    c.fillStyle = hueAt(ph * 0.3, 95, 70); c.globalAlpha = 0.6; c.beginPath(); c.moveTo(-r * 0.12, r * 0.2); c.lineTo(0, -r * 1.0); c.lineTo(r * 0.12, r * 0.2); c.closePath(); c.fill(); c.globalAlpha = 1; };
  Object.assign(EXT, { prismcrystal: 4.0 }); Object.assign(NF, { prismcrystal: 1 }); mon.prismcrystal = () => {};
  function crystalsExtra(X, self, H) { const M = X.M, list = [];
    for (const rm of M.rooms.slice(1)) { const n = 1 + (Math.random() < 0.5 ? 1 : 0); for (let k = 0; k < n; k++) { const q = X.freeSpot(rm.x + rm.w * (0.25 + Math.random() * 0.5), rm.y + rm.h * (0.25 + Math.random() * 0.5), 0.8); if (!q) continue; const m = X.spawnMon('prismcrystal', q.x, q.y, { pack: 883, rift: true }); m.aggro = false; m.optional = true; m.rot = Math.floor(Math.random() * 2) * (TAU / 12); list.push(m); } }
    X.after(4.5, () => X.banner('PRISM CRYSTALS', 'Break one: it fires beams of colour along six lines, through every monster in them', '#FFFFFF', 3, true));
    return { list }; }

  /* ---- the mini bosses: Rift-touched Cocopets ---- */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; };
  BOSSES.push(
    { id: 'bleachpet', rift: true, name: 'Bleach', title: 'A Rift-touched Cocopet', hp: 90000, dmg: 50, r: 1.4, spd: 1.8, color: '#C8C8D0', glow: '#FFFFFF', biome: 'greyshore', el: 'light' },
    { id: 'refractpet', rift: true, name: 'Refract', title: 'A Rift-touched Cocopet', hp: 96000, dmg: 50, r: 1.45, spd: 1.7, color: GLASS, glow: COL.B, biome: 'prismreef', el: 'light' },
    { id: 'chromapet', rift: true, name: 'Chroma', title: 'A Rift-touched Cocopet', hp: 104000, dmg: 54, r: 1.5, spd: 1.8, color: UNSEEN, glow: UNSEEN2, biome: 'huedeep', el: 'cosmic' });
  Object.assign(DunAI.boss, {
    /* Bleach: it drains the colour round it (a ring that slows), then lunges three times */
    bleachpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['drain', 'lunge', 'lunge'] : ['drain', 'lunge']); }
      const T = m.actT; switch (m.act) {
        case 'drain': { if (m.step === 0) { m.step = 1; X.say(m, 'Give me your colours.'); X.warn({ x: m.x, y: m.y, r: 3.6, life: 1.2, max: 1.2, src: m, color: GREY_HI, fn: () => { if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 3.6 + X.me.r) X.hurtPet(m.dmg * 1.3, m); X.zone({ kind: 'stall', x: m.x, y: m.y, r: 3.6, life: 3.5, max: 3.5, own: 'enemy' }); X.ring(m.x, m.y, 0.3, 3.6, 0.4, GREY_HI, 0.4); } }); }
          if (T > 1.8) done(m, 1.5); break; }
        case 'lunge': { if (m.step < 3 && T > m.step * 0.8) { m.step++; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'line', x: m.x, y: m.y, a, len: 6, w: 1.8, life: 0.6, max: 0.6, src: m, color: GREY_HI, fn: () => { if (X.inLine(m.x, m.y, a, 6, 1.8) && !X.me.dodge) X.hurtPet(m.dmg * 1.2, m); const p = X.walkPoint(m.x + Math.cos(a) * 5, m.y + Math.sin(a) * 5, m); m.x = p.x; m.y = p.y; } }); }
          if (T > 2.8) done(m, 1.4); break; }
        default: done(m, 1); } },
    /* Refract: a beam that bends round it in a sweep, then a ring of glass shards */
    refractpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['beams', 'shards', 'beams'] : ['beams', 'shards']); }
      const T = m.actT; switch (m.act) {
        case 'beams': { if (m.step < 3 && T > m.step * 0.55) { m.step++; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x) + (m.step - 2) * 0.45; X.warn({ shape: 'line', x: m.x, y: m.y, a, len: 10, w: 1.0, life: 0.9, max: 0.9, src: m, color: HUE[m.step * 2 % 6], fn: () => { if (X.inLine(m.x, m.y, a, 10, 1.0) && !X.me.dodge) X.hurtPet(m.dmg * 1.1, m); } }); }
          if (T > 2.4) done(m, 1.5); break; }
        case 'shards': { if (m.step < 2 && T > m.step * 0.7) { m.step++; const n = 14, off = m.step * 0.22; for (let i = 0; i < n; i++) X.eshot(m.x, m.y - 0.5, off + i / n * TAU, 5, { dmg: m.dmg * 0.8, color: HUE[i % 6], core: '#FFFFFF', r: 0.18, style: 'orb', src: m }); }
          if (T > 2.0) done(m, 1.5); break; }
        default: done(m, 1); } },
    /* Chroma: it blinks about you three times, a shown burst each time */
    chromapet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['blink', 'bloom', 'blink'] : ['blink', 'bloom']); }
      const T = m.actT; switch (m.act) {
        case 'blink': { if (m.step < 3 && T > m.step * 0.9) { m.step++; const a0 = Math.random() * TAU, p = X.freeSpot(X.me.x + Math.cos(a0) * 3, X.me.y + Math.sin(a0) * 3, m.r) || { x: m.x, y: m.y }; m.x = p.x; m.y = p.y; X.ring(m.x, m.y, 0.3, 2.4, 0.3, UNSEEN, 0.4); X.warn({ x: m.x, y: m.y, r: 2.4, life: 0.7, max: 0.7, src: m, color: UNSEEN, fn: () => { if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 2.4 + X.me.r && !X.me.dodge) X.hurtPet(m.dmg * 1.2, m); X.boom(m.x, m.y, 2.0, UNSEEN, '#FFFFFF', { n: 14, shake: 4 }); } }); }
          if (T > 3.0) done(m, 1.4); break; }
        case 'bloom': { if (m.step < 5 && T > m.step * 0.25) { m.step++; const px = X.me.x + (Math.random() - 0.5) * 5, py = X.me.y + (Math.random() - 0.5) * 5; X.warn({ x: px, y: py, r: 1.3, life: 1.0, max: 1.0, src: m, color: UNSEEN2, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.3 + X.me.r) X.hurtPet(m.dmg, m); X.boom(px, py, 1.2, UNSEEN2, '#FFFFFF', { n: 10, shake: 3 }); } }); }
          if (T > 2.0) done(m, 1.4); break; }
        default: done(m, 1); } },
  });

  /* ---- the rift ---- */
  const SEALING = { fall: 'THE NAMELESS COLOUR IS STILL', sub: 'The colour drains back out of the lake; its surface turns blue and clear', sigil: 'THE BALANCE SIGIL', name: 'The Sea of Fallen Colours', color: '#FFFFFF' };
  const ST = (typeof COL_STAGES !== 'undefined' && COL_STAGES) || {};
  const placeholder = (name, goal) => ({ name, goal, how: goal, layout: ['##########', '#........#', '#...E....#', '#........#', '#...S....#', '##########'], legend: { E: {} }, make(X, self, H) { const e = X.M.marks.E[0]; self.done = true; H.setExit(e.x, e.y, 'The way on'); return {}; } });
  defRift({
    ease: 0.55, monEase: 0.5,
    id: 'colours', n: 10, name: 'The Sea of Fallen Colours', lvl: 90, sigil: 'Balance', biome: 'greyshore', aff: ['light', 'cosmic'], region: 'the stellar sea',
    blurb: 'Something fell into the stellar sea from between the stars: a colour that is not one of ours, and the world\'s colours are running down into the deep after it. Win them back.', gate: { anima: 'sagittarius', name: "The Archer's Horizon" },
    mons: ['greyling', 'huewisp', 'greyling'], sealing: SEALING,
    stages: riftSections([
      { biome: 'greyshore', pattern: ['fight', 'trial', 'boss'], mods: ['random'], fights: ['The Bleached Strand'], minis: ['bleachpet'], miniHp: 0.6, mobs: ['greyling', 'huewisp', 'greyling'], extra: crystalsExtra, trials: [ST.HORDE || placeholder('The Painted Horde', 'Hold the shore')], boss: 'grisaille', bossName: 'Grisaille, the Thief of Hues', bossRoom: 'The Bleached Cove' },
      { biome: 'prismreef', pattern: ['trial', 'fight', 'boss'], mods: ['random'], fights: ['The Glass Shallows'], minis: ['refractpet'], miniHp: 0.6, mobs: ['prismray', 'shardback', 'huewisp', 'greyling'], extra: crystalsExtra, trials: [ST.LENSES || placeholder('The Three Lenses', 'Light the lenses')], boss: 'xelvara', bossName: 'Xelvara, the Comet Brood', bossRoom: 'The Refracting Lagoon' },
      { biome: 'huedeep', pattern: ['trial', 'fight', 'fight', 'boss'], mods: ['curse', 'random'], fights: ['The Starlit Floor', 'The Blooming Dark'], minis: ['chromapet'], miniHp: 0.6, mobs: ['chromawraith', 'prismray', 'huewisp', 'chromawraith', 'greyling', 'shardback'], extra: crystalsExtra, trials: [ST.COLOURFALL || placeholder('The Colourfall', 'Catch the true colours')], boss: 'chromatica', bossName: 'Chromatica, the Colour Without a Name', bossRoom: 'The Drained Lake' },
    ]),
  });
  // (drifting flecks of colour over every stage: falling slowly, as the colours pour down into the deep)
  RIFT_BY_ID.colours.everyStage = (X) => { const fl = []; return {
    update(dt) { if (fl.length < 12 && Math.random() < 0.25) fl.push({ x: Math.random(), y: -0.05, v: 0.02 + Math.random() * 0.03, s: 1 + Math.random() * 1.6, ph: Math.random() * 6, col: HUE[Math.floor(Math.random() * 6)] }); for (const q of fl) q.y += q.v * dt; for (let i = fl.length - 1; i >= 0; i--) if (fl[i].y > 1.05) fl.splice(i, 1); },
    drawOver(c) { const W = X.W(), Hh = X.H(), t = X.g.t, deep = X.F.biome === 'huedeep'; c.save(); for (const q of fl) { c.globalAlpha = 0.3 + 0.2 * Math.sin(t * 2 + q.ph); c.fillStyle = deep ? (q.ph > 3 ? UNSEEN : UNSEEN2) : q.col; c.beginPath(); c.arc(q.x * W + Math.sin(t * 0.6 + q.ph) * 14, q.y * Hh, q.s, 0, TAU); c.fill(); } c.restore(); } }; };
  Object.assign(COL, { crystalsExtra, prismBurst, crystal, hueAt });
})();
