/* ---------- Rift 08: The Hollow Moon ----------
   The moon over the lunar islands is hollow, and something in it has begun to pull. Its weight drags at the tides and
   at the sleeping minds below. Three lands, going down:
   I   The Mare of Ash: the grey surface, craters and ash dunes, ancient lunar obelisks, geodes split open; Gaia hangs
       blue and green in the black sky.
   II  The Hollow Shafts: down through the crust: caverns of pale moonstone, boulders that float where the pull is weak,
       silver gravity rings turning in the dark.
   III The Moon Castle: at the moon's hollow heart, a palace of white marble under the black sun: onion domes,
       minarets, domed pavilions, cypress gardens and long reflecting pools (art in 20zi2).
   Monsters: mooncalves (pale eyeless toads: they leap onto a shown circle and shake the ground; heavy), crater wisps
   (lantern jellies: a shown ring, then they PULL you in and flare), dust wraiths (they burrow, race under the ground,
   then erupt under a shown circle), and in the Inner Tide tidelings (crab-fish that lob bubbles of tide that slow) and
   eclipse moths (they dive along a shown line).
   Every fight has gravity geodes: break one and it implodes, dragging every monster near it into its heart and crushing
   them. Lure them in first.
   Stages: I  The Ash Fields (fight) · The Weighing (trial) · Tsukimochi, the Moon Rabbit
           II The Tide Run (trial) · The Moonstone Deep (fight) · the Selenarch, the Weighing Engine
           III The Black Sun Siege (trial) · The Marble Gardens (fight) · The Hall of Domes (fight) · Ylth-Mora, the Hollow Heart */
const MOON = { INK: '#1E2030', REG: '#B9BCC6', REG_D: '#8C909E', REG_HI: '#E4E6EC', SILVER: '#D9DEE8', MOONSTONE: '#A9C8F0', MOON_HI: '#E2EEFF', INDIGO: '#2E2A5A', TIDE: '#1E3A48', TIDE_HI: '#7FD8E0', PEARL: '#F4EEF6', GOLD: '#E8C46A', GOLD_HI: '#FFF0B8', BLACKSUN: '#0A0A12', ROSE: '#E890B8' };
(() => {
  const TAU = Math.PI * 2, { INK, REG, REG_D, REG_HI, SILVER, MOONSTONE, MOON_HI, INDIGO, TIDE, TIDE_HI, PEARL, GOLD, GOLD_HI, ROSE } = MOON;
  const { PROPS } = DunWorld, { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const rnd = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, rx, ry, a || 0, 0, TAU); };
  const ink = (c, lw) => { c.strokeStyle = LN; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(10,12,24,${a || 0.3})`; ell(c, 0, T * 0.03, T * w, T * w * 0.32); c.fill(); };
  // a boulder outline: a lumpy closed shape
  function lump(c, x, y, rx, ry, R, n) { c.beginPath(); for (let i = 0; i <= (n || 10); i++) { const a = i / (n || 10) * TAU, k = 0.85 + R() * 0.25; const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); }
  function crater(c, x, y, r, lw) { ell(c, x, y, r, r * 0.45); c.fillStyle = 'rgba(40,44,60,.28)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.ellipse(x, y, r, r * 0.45, 0, Math.PI * 0.1, Math.PI * 0.9); c.stroke(); }

  /* ---- the voids ---- */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.lunarvoid = { base: '#05060C',
    paint(c, S, R) { c.fillStyle = '#05060C'; c.fillRect(0, 0, S, S); for (let i = 0; i < 46; i++) { c.fillStyle = `rgba(230,235,255,${0.25 + R() * 0.7})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.1 ? 1.5 : R() < 0.4 ? 0.9 : 0.55, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, P, W, H, t, wx, wy, bigGlow } = o; pat(pattern('lunarvoid', k), 0.25, 0, 0);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12; bigGlow(c, P, '#5A6AA8', W * 0.1 - (wx * 0.03) % W, H * 0.1, W * 1.1); c.restore();
      // Gaia, far off: blue seas, green and gold land, a white cloud band, a soft atmosphere
      const gx = W * 0.26 - ((wx * 0.015) % (W * 2)), gy = H * 0.17 - ((wy * 0.01) % H), gr = Math.min(W, H) * 0.13;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite('#7FB8FF'), gx - gr * 1.8, gy - gr * 1.8, gr * 3.6, gr * 3.6); c.restore();
      const g = c.createRadialGradient(gx - gr * 0.35, gy - gr * 0.35, gr * 0.1, gx, gy, gr); g.addColorStop(0, '#9FD2FF'); g.addColorStop(0.6, '#3A7AC8'); g.addColorStop(1, '#16305A'); c.fillStyle = g; c.beginPath(); c.arc(gx, gy, gr, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(gx, gy, gr, 0, TAU); c.clip(); c.fillStyle = '#5FA86A'; for (const [x, y, r] of [[-0.3, -0.2, 0.32], [0.2, 0.15, 0.28], [0.45, -0.35, 0.18], [-0.1, 0.5, 0.2]]) { c.beginPath(); c.ellipse(gx + x * gr, gy + y * gr, r * gr, r * gr * 0.7, x * 2, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(gx + (i - 1) * gr * 0.5, gy - gr * 0.05 + i * gr * 0.3, gr * 0.5, gr * 0.06, 0.2, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(0,0,20,.45)'; c.beginPath(); c.arc(gx + gr * 0.45, gy + gr * 0.35, gr * 1.05, 0, TAU); c.fill(); c.restore();
      c.strokeStyle = 'rgba(160,210,255,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(gx, gy, gr, 0, TAU); c.stroke();
      // ash drifting in the low gravity
      for (let i = 0; i < 10; i++) { const px = ((i * 151 + t * (4 + i % 3) - wx * 0.3) % (W + 40) + W + 40) % (W + 40) - 20, py = ((i * 97 - t * 3 - wy * 0.3) % (H + 40) + H + 40) % (H + 40) - 20; c.fillStyle = 'rgba(220,225,240,.35)'; c.beginPath(); c.arc(px, py, 1.6, 0, TAU); c.fill(); } },
  };
  GAP_EXT.hollowdeep = { base: '#0C0A1E',
    paint(c, S, R) { c.fillStyle = '#0C0A1E'; c.fillRect(0, 0, S, S); for (let i = 0; i < 12; i++) { const x = R() * S, y = R() * S, w = 14 + R() * 26; c.strokeStyle = `rgba(120,150,230,${0.08 + R() * 0.12})`; c.lineWidth = 1.5 + R() * 2; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.bezierCurveTo(x + ox - w * 0.3, y + oy - 9, x + ox + w * 0.3, y + oy + 9, x + ox + w, y + oy); c.stroke(); } }
      for (let i = 0; i < 24; i++) { c.fillStyle = `rgba(170,200,255,${0.25 + R() * 0.55})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.15 ? 1.4 : 0.7, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, P, W, H, t, wx, wy, bigGlow } = o; pat(pattern('hollowdeep', k), 0.45, t * 1.5, -t * 2);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18; bigGlow(c, P, '#5A7AD8', W * 0.3 - (wx * 0.04) % W, H * 0.6, W * 1.0); c.restore();
      // far floating boulders, silhouettes against the glow, drifting upward slowly
      for (let i = 0; i < 6; i++) { const sz = 18 + (i % 3) * 14, px = ((i * 173 - wx * 0.12) % (W + 120) + W + 120) % (W + 120) - 60, py = ((i * 131 - t * (3 + i % 2) - wy * 0.12) % (H + 120) + H + 120) % (H + 120) - 60;
        c.fillStyle = 'rgba(30,28,60,.85)'; const R = rnd(i * 7 + 3); lump(c, px, py, sz, sz * 0.7, R, 9); c.fill(); c.strokeStyle = 'rgba(169,200,240,.35)'; c.lineWidth = 1.5; c.stroke(); } },
  };
  GAP_EXT.innertide = { base: '#0E1E28',
    paint(c, S, R) { c.fillStyle = '#0E1E28'; c.fillRect(0, 0, S, S); for (let i = 0; i < 24; i++) { const x = R() * S, y = R() * S, w = 8 + R() * 18; c.strokeStyle = `rgba(127,216,224,${0.08 + R() * 0.18})`; c.lineWidth = 1.5; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.quadraticCurveTo(x + ox, y + oy - 3, x + ox + w, y + oy); c.stroke(); } }
      for (let i = 0; i < 10; i++) { c.fillStyle = `rgba(244,238,246,${0.3 + R() * 0.4})`; c.beginPath(); c.arc(R() * S, R() * S, 0.8, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, P, W, H, t, wx, wy, bigGlow } = o; pat(pattern('innertide', k), 1, W / 2 + t * 5, H / 2 + Math.sin(t * 0.6) * 6);
      // the black sun's reflection: a dark disc ringed with a pale corona, shivering on the swell
      const sx = W * 0.62 - ((wx * 0.03) % (W * 2)), sy = H * 0.22 - ((wy * 0.02) % H), sr = Math.min(W, H) * 0.1;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.05 * Math.sin(t); blitSized(c, glowSprite(GOLD_HI), sx - sr * 2.5, sy - sr * 1.2, sr * 5, sr * 2.4); c.restore();
      c.fillStyle = '#05060A'; c.beginPath(); c.ellipse(sx, sy, sr, sr * 0.45, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,240,184,.6)'; c.lineWidth = 2; c.stroke(); },
  };

  /* ---- the floors: decals of craters, ash, moonstone chips, pearl sand ---- */
  window.DECAL_EXT = window.DECAL_EXT || {};
  Object.assign(DECAL_EXT, {
    crater(c, d, s, lw) { crater(c, 0, 0, s * (1.2 + d.v * 0.4), lw); },
    ashdrift(c, d, s) { c.rotate(d.rot * 0.2); c.fillStyle = 'rgba(90,94,110,.22)'; ell(c, 0, 0, s * 2.2, s * 0.6); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; ell(c, -s * 0.4, -s * 0.15, s * 1.2, s * 0.25); c.fill(); },
    moonchip(c, d, s) { c.rotate(d.rot); c.fillStyle = 'rgba(169,200,240,.75)'; c.beginPath(); c.moveTo(0, -s * 0.8); c.lineTo(s * 0.4, 0); c.lineTo(0, s * 0.5); c.lineTo(-s * 0.4, 0); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(-s * 0.08, -s * 0.5, s * 0.12, s * 0.4); },
    pearlsand(c, d, s) { for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? 'rgba(244,238,246,.7)' : 'rgba(232,196,106,.5)'; c.beginPath(); c.arc(Math.cos(i * 1.7 + d.rot) * s * 1.2, Math.sin(i * 1.7 + d.rot) * s * 0.6, s * 0.16, 0, TAU); c.fill(); } },
    tidepool(c, d, s) { c.fillStyle = 'rgba(30,58,72,.45)'; ell(c, 0, 0, s * 1.8, s * 0.8, d.rot * 0.2); c.fill(); c.strokeStyle = 'rgba(127,216,224,.45)'; c.lineWidth = 1; ell(c, 0, 0, s * 1.4, s * 0.55, d.rot * 0.2); c.stroke(); },
  });

  /* ---- the bridges: slabs of basalt held up by the weak pull, runes glowing in their faces ---- */
  function slabBridge(c, x, y, X, Y, T, isGap, tt, lw, B) {
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y);
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === T_BRIDGE; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    const A = horiz ? x : y, col = B.bridgeCol || '#4A4E62', rune = B.deco || MOONSTONE;
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    // one slab per tile, with a thin gap of void between; lit top face, a darker lip; a rune on every other one
    const bob = (hh(A, 1, 2) - 0.5) * T * 0.06;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(T * 0.06, T * 0.18 + bob + T * 0.08, T * 0.88, T * 0.72);
    const g = c.createLinearGradient(0, 0, 0, T); g.addColorStop(0, shadeC(col, 0.25)); g.addColorStop(1, shadeC(col, -0.2)); c.fillStyle = g; c.beginPath(); GFX.rr(c, T * 0.05, T * 0.1 + bob, T * 0.9, T * 0.8, T * 0.12); c.fill(); c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(T * 0.12, T * 0.14 + bob, T * 0.76, Math.max(1, T * 0.05));
    c.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 2; k++) { ell(c, T * (0.25 + hh(x, y, k) * 0.5), T * (0.35 + hh(y, x, k) * 0.35) + bob, T * 0.1, T * 0.05); c.fill(); }
    if (A % 2 === 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rune; c.globalAlpha = 0.7; c.lineWidth = Math.max(1.2, T * 0.04); c.beginPath(); c.arc(T * 0.5, T * 0.5 + bob, T * 0.18, 0.4, TAU - 0.4); c.moveTo(T * 0.5, T * 0.3 + bob); c.lineTo(T * 0.5, T * 0.7 + bob); c.stroke(); c.restore(); }
    c.restore();
  }
  function slabEdge(c, x, y, X, Y, T, lw, B) { c.fillStyle = shadeC(B.bridgeCol || '#4A4E62', -0.45); c.fillRect(X + T * 0.08, Y, T * 0.84, T * 0.14); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(X + T * 0.12, Y + T * 0.14, T * 0.76, T * 0.1); }

  /* ---- props ---- */
  window.PROP_EXT = window.PROP_EXT || {};
  Object.assign(PROP_EXT, { moonrock: [2.6, 2.4], obelisk: [2.2, 4.4], geodecleft: [2.6, 2.4], moonspire: [2.0, 4.0], moonstone: [2.6, 3.2], floatrock: [2.8, 3.8], gravring: [3.0, 3.8], pearlcoral: [2.8, 3.2], shellspire: [2.4, 4.2], blacklotus: [2.4, 2.2], moonidol: [2.2, 3.6] });
  Object.assign(PROPS, {
    /* a grey moon boulder, pitted with little craters */
    moonrock(c, T, v) { const lw = lw0(T), R = rnd(5 + v * 31); shadowEll(c, T, 0.85);
      lump(c, 0, -T * 0.45, T * 0.78, T * 0.5, R, 11); c.fillStyle = shade(c, REG, T * 0.8, -T * 0.25, -T * 0.7, 0.45); c.fill(); ink(c, lw);
      for (let i = 0; i < 4; i++) crater(c, (R() - 0.5) * T * 0.9, -T * (0.3 + R() * 0.4), T * (0.08 + R() * 0.1), lw);
      c.fillStyle = 'rgba(255,255,255,.3)'; ell(c, -T * 0.3, -T * 0.72, T * 0.22, T * 0.08, -0.3); c.fill(); },
    /* an ancient lunar obelisk of dark basalt, glyphs glowing pale blue, a crescent at its tip */
    obelisk(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.6);
      c.beginPath(); c.moveTo(-T * 0.38, 0); c.lineTo(-T * 0.26, -T * 3.0); c.lineTo(0, -T * 3.4); c.lineTo(T * 0.26, -T * 3.0); c.lineTo(T * 0.38, 0); c.closePath();
      const g = c.createLinearGradient(-T * 0.4, 0, T * 0.4, 0); g.addColorStop(0, '#6A6E84'); g.addColorStop(0.5, '#4A4E62'); g.addColorStop(1, '#2A2E3E'); c.fillStyle = g; c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(0, -T * 3.3); c.lineTo(0, -T * 0.1); c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = MOONSTONE; c.lineWidth = Math.max(1.2, lw * 0.7); for (let i = 0; i < 5; i++) { const y = -T * (0.5 + i * 0.5); c.beginPath(); if (i % 2) { c.arc(-T * 0.12, y, T * 0.08, 0, TAU); } else { c.moveTo(-T * 0.2, y); c.lineTo(-T * 0.04, y - T * 0.12); c.lineTo(-T * 0.04, y + T * 0.1); } c.stroke(); } c.restore();
      glowIn(c, 0, -T * 3.55, T * 0.6, MOON_HI, 0.6); c.strokeStyle = MOON_HI; c.lineWidth = lw * 1.4; c.beginPath(); c.arc(0, -T * 3.55, T * 0.2, 0.6, TAU - 0.6); c.stroke(); },
    /* a geode split open: a grey shell, violet and blue crystals inside */
    geodecleft(c, T, v) { const lw = lw0(T), R = rnd(9 + v * 13); shadowEll(c, T, 0.8);
      lump(c, 0, -T * 0.42, T * 0.75, T * 0.45, R, 10); c.fillStyle = shade(c, REG_D, T * 0.8, -T * 0.25, -T * 0.6, 0.45); c.fill(); ink(c, lw);
      ell(c, T * 0.05, -T * 0.5, T * 0.48, T * 0.28); c.fillStyle = '#2E2A5A'; c.fill(); ink(c, lw * 0.8);
      for (let i = 0; i < 7; i++) { const a = -Math.PI + (i + 0.5) / 7 * Math.PI, x = T * 0.05 + Math.cos(a) * T * 0.3, y = -T * 0.5 + Math.sin(a) * T * 0.15 + T * 0.08, h = T * (0.25 + R() * 0.15), col = i % 2 ? '#B9A6FF' : MOONSTONE;
        c.beginPath(); c.moveTo(x - T * 0.06, y); c.lineTo(x, y - h); c.lineTo(x + T * 0.06, y); c.closePath(); c.fillStyle = col; c.fill(); ink(c, lw * 0.5); }
      glowIn(c, T * 0.05, -T * 0.55, T * 0.6, '#B9A6FF', 0.45); },
    /* a thin needle of moon stone, leaning, a little crescent of light caught at its top */
    moonspire(c, T, v) { const lw = lw0(T), lean = (v % 2 ? 1 : -1) * T * 0.2; shadowEll(c, T, 0.5);
      c.beginPath(); c.moveTo(-T * 0.3, 0); c.quadraticCurveTo(-T * 0.15 + lean * 0.5, -T * 1.6, lean, -T * 3.2); c.quadraticCurveTo(T * 0.12 + lean * 0.5, -T * 1.6, T * 0.3, 0); c.closePath(); c.fillStyle = shade(c, REG, T * 0.6, -T * 0.15, -T * 1.6, 0.45); c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = lw * 0.7; c.beginPath(); for (let i = 1; i < 5; i++) { const y = -T * i * 0.6; c.moveTo(-T * 0.2 + lean * i / 5, y); c.lineTo(T * 0.15 + lean * i / 5, y - T * 0.06); } c.stroke();
      glowIn(c, lean, -T * 3.2, T * 0.5, MOON_HI, 0.5); },
    /* a cluster of pale moonstone crystals, lit from within */
    moonstone(c, T, v) { const lw = lw0(T), R = rnd(17 + v * 7); shadowEll(c, T, 0.75); glowIn(c, 0, -T * 1.0, T * 1.4, MOONSTONE, 0.5);
      for (const [x, h, w, a] of [[-0.45, 1.3, 0.22, -0.25], [0.45, 1.1, 0.2, 0.3], [0, 2.1, 0.3, 0.02], [-0.2, 1.6, 0.22, -0.1], [0.25, 1.5, 0.2, 0.15]]) { c.save(); c.translate(x * T, 0); c.rotate(a);
        c.beginPath(); c.moveTo(-w * T, 0); c.lineTo(-w * T * 0.8, -h * T * 0.8); c.lineTo(0, -h * T); c.lineTo(w * T * 0.8, -h * T * 0.8); c.lineTo(w * T, 0); c.closePath(); const g = c.createLinearGradient(-w * T, 0, w * T, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, MOON_HI); g.addColorStop(1, MOONSTONE); c.fillStyle = g; c.fill(); ink(c, lw * 0.8);
        c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-w * T * 0.4, -T * 0.1); c.lineTo(-w * T * 0.2, -h * T * 0.8); c.stroke(); c.restore(); } },
    /* a boulder floating where the pull is weak: its shadow on the floor far below it, dust falling from it */
    floatrock(c, T, v) { const lw = lw0(T), R = rnd(21 + v * 11), lift = T * (1.4 + (v % 2) * 0.3); c.fillStyle = 'rgba(10,12,24,.28)'; ell(c, 0, T * 0.03, T * 0.7, T * 0.2); c.fill();
      c.strokeStyle = 'rgba(169,200,240,.35)'; c.setLineDash([3, 6]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -T * 0.1); c.lineTo(0, -lift + T * 0.4); c.stroke(); c.setLineDash([]);
      lump(c, 0, -lift - T * 0.35, T * 0.85, T * 0.55, R, 11); c.fillStyle = shade(c, '#7A7E92', T * 0.8, -T * 0.25, -lift - T * 0.6, 0.45); c.fill(); ink(c, lw);
      c.beginPath(); c.moveTo(-T * 0.6, -lift - T * 0.1); c.lineTo(-T * 0.2, -lift + T * 0.35); c.lineTo(T * 0.3, -lift + T * 0.3); c.lineTo(T * 0.65, -lift - T * 0.1); c.closePath(); c.fillStyle = '#4A4E62'; c.fill(); ink(c, lw * 0.8);
      for (let i = 0; i < 3; i++) crater(c, (R() - 0.5) * T * 0.8, -lift - T * (0.3 + R() * 0.3), T * 0.09, lw);
      c.fillStyle = 'rgba(255,255,255,.25)'; ell(c, -T * 0.3, -lift - T * 0.7, T * 0.2, T * 0.07, -0.3); c.fill(); glowIn(c, 0, -lift + T * 0.4, T * 0.5, MOONSTONE, 0.3); },
    /* a silver gravity ring standing on edge, slowly turning (two rings at angles), a mote held at its heart */
    gravring(c, T, v) { const lw = lw0(T), H = T * 1.9; shadowEll(c, T, 0.8);
      c.strokeStyle = LN; c.lineWidth = T * 0.12 + lw * 2; c.beginPath(); c.moveTo(-T * 0.5, 0); c.lineTo(0, -T * 0.5); c.lineTo(T * 0.5, 0); c.moveTo(0, -T * 0.5); c.lineTo(0, -H + T * 0.85); c.stroke(); c.strokeStyle = SILVER; c.lineWidth = T * 0.12; c.stroke();
      for (const [rx, ry, rot] of [[1.0, 0.3, 0.4 + v * 0.3], [0.85, 0.85, 0]]) { c.save(); c.translate(0, -H); c.rotate(rot); c.lineWidth = T * 0.13 + lw * 2; c.strokeStyle = LN; ell(c, 0, 0, rx * T, ry * T); c.stroke(); c.lineWidth = T * 0.13; c.strokeStyle = SILVER; c.stroke(); c.lineWidth = T * 0.04; c.strokeStyle = '#FFFFFF'; c.stroke(); c.restore(); }
      glowIn(c, 0, -H, T * 0.8, MOON_HI, 0.7); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, -H, T * 0.12, 0, TAU); c.fill(); },
    /* a branching coral of pearl, pink at the tips */
    pearlcoral(c, T, v) { const lw = lw0(T), R = rnd(31 + v * 17); shadowEll(c, T, 0.75);
      const br = (x, y, a, L, d) => { const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = T * 0.06 * (d + 1.5) + lw * 1.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = PEARL; c.lineWidth = T * 0.06 * (d + 1.5); c.stroke(); if (d > 0) { br(x2, y2, a - 0.45 - R() * 0.2, L * 0.72, d - 1); br(x2, y2, a + 0.45 + R() * 0.2, L * 0.72, d - 1); } else { c.fillStyle = ROSE; c.beginPath(); c.arc(x2, y2, T * 0.08, 0, TAU); c.fill(); } };
      br(-T * 0.2, 0, -Math.PI / 2 - 0.3, T * 0.8, 2); br(T * 0.2, 0, -Math.PI / 2 + 0.25, T * 0.9, 2); glowIn(c, 0, -T * 1.4, T * 1.0, '#FFD6EA', 0.3); },
    /* a tall spiral shell standing on its point's end, pearl inside */
    shellspire(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.6);
      for (let i = 0; i < 6; i++) { const y = -T * (0.3 + i * 0.55), w = T * (0.62 - i * 0.09), h = T * 0.6; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(-w * 1.05, y - h * 0.7, 0, y - h); c.quadraticCurveTo(w * 1.05, y - h * 0.7, w, y); c.quadraticCurveTo(0, y + h * 0.25, -w, y); c.closePath(); c.fillStyle = shade(c, i % 2 ? '#EDE2D6' : '#F7EFE6', w, -w * 0.3, y - h * 0.6, 0.35); c.fill(); ink(c, lw * 0.9); c.strokeStyle = 'rgba(232,144,184,.5)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-w * 0.6, y - h * 0.15); c.quadraticCurveTo(0, y - h * 0.5, w * 0.6, y - h * 0.2); c.stroke(); }
      glowIn(c, 0, -T * 3.5, T * 0.4, PEARL, 0.5); },
    /* a dark lotus on the tide-sand, its heart burning pale gold */
    blacklotus(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.7);
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 7; i++) { const a = -Math.PI + (i + 0.5) / 7 * Math.PI + ring * 0.2, L = T * (0.75 - ring * 0.25); c.save(); c.translate(0, -T * 0.25); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.4, -L * 0.6, 0, -L); c.quadraticCurveTo(-L * 0.4, -L * 0.6, 0, 0); c.closePath(); c.fillStyle = ring ? '#3A3450' : '#24203A'; c.fill(); ink(c, lw * 0.7); c.strokeStyle = 'rgba(232,196,106,.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -L * 0.1); c.lineTo(0, -L * 0.8); c.stroke(); c.restore(); }
      glowIn(c, 0, -T * 0.5, T * 0.9, GOLD_HI, 0.75); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(0, -T * 0.45, T * 0.13, 0, TAU); c.fill(); },
    /* a cairn idol of the moon's drowned cult: stacked pale stones, a carved crescent mouth, a pearl at the top */
    moonidol(c, T, v) { const lw = lw0(T), R = rnd(41 + v * 5); shadowEll(c, T, 0.6);
      let y = 0; for (const [w, h] of [[0.55, 0.5], [0.45, 0.6], [0.5, 0.55], [0.36, 0.5]]) { lump(c, (R() - 0.5) * T * 0.1, y - h * T / 2, w * T, h * T / 2, R, 9); c.fillStyle = shade(c, '#C9C4CC', w * T, -w * T * 0.3, y - h * T * 0.7, 0.45); c.fill(); ink(c, lw); y -= h * T * 0.92; }
      c.strokeStyle = LN; c.lineWidth = lw * 1.3; c.beginPath(); c.arc(0, -T * 1.3, T * 0.2, 0.3, Math.PI - 0.3); c.stroke();
      glowIn(c, 0, y - T * 0.15, T * 0.5, PEARL, 0.7); c.fillStyle = PEARL; c.beginPath(); c.arc(0, y - T * 0.15, T * 0.14, 0, TAU); c.fill(); ink(c, lw * 0.7); },
  });

  /* ---- the lands ---- */
  const land = o => Object.assign({ rift: true, tile: 'caves', out: true, ambient: 'motes', hazard: 'laser', bridgeFn: slabBridge, bridgeEdge: slabEdge, propN: [5, 3] }, o);
  BIOMES.mare = land({ name: 'The Mare of Ash', dark: 0.18, bg: '#05060C', gap: 'lunarvoid', accent: MOON_HI, light: '#FFFFFF', bridgeCol: '#5A5E72', deco: MOONSTONE,
    floor: ['#B9BCC6', '#B2B5C0', '#C1C4CD'], grout: '#8C909E', hi: '#E4E6EC', top: '#9A9EAC', face: '#7A7E8E', faceD: '#5A5E6E', cliff: '#6A6E7E', grade: 'rgba(180,200,255,.05)',
    props: ['moonrock', 'obelisk', 'moonrock', 'geodecleft', 'moonspire', 'moonrock', 'obelisk', 'moonspire'], fog: '#05060C', darkRGB: '5,6,12' });
  BIOMES.shafts = land({ name: 'The Hollow Shafts', dark: 0.3, bg: '#0C0A1E', gap: 'hollowdeep', accent: MOONSTONE, light: MOON_HI, bridgeCol: '#3E3A66', deco: '#B9A6FF',
    floor: ['#5A5880', '#55537A', '#605E88'], grout: '#3A385E', hi: '#8A88B8', top: '#4A4870', face: '#3A3860', faceD: '#24223E', cliff: '#2E2C50', grade: 'rgba(120,150,230,.07)',
    props: ['moonstone', 'floatrock', 'gravring', 'moonstone', 'floatrock', 'moonspire', 'moonstone', 'geodecleft'], fog: '#0C0A1E', darkRGB: '12,10,30' });
  BIOMES.innertide = land({ name: 'The Inner Tide', dark: 0.28, bg: '#0E1E28', gap: 'innertide', accent: TIDE_HI, light: PEARL, bridgeCol: '#3E5A66', deco: GOLD_HI,
    floor: ['#C8C0B4', '#C1B9AC', '#CFC8BC'], grout: '#8E8676', hi: '#EDE6DA', top: '#9E9686', face: '#7E7666', faceD: '#5E5648', cliff: '#4E5A60', grade: 'rgba(127,216,224,.06)',
    props: ['pearlcoral', 'shellspire', 'blacklotus', 'moonidol', 'pearlcoral', 'shellspire', 'blacklotus'], fog: '#0E1E28', darkRGB: '14,30,40' });
  BIOME_ORDER.push('mare', 'shafts', 'innertide');
  DARK_COL.mare = '5,6,12'; DARK_COL.shafts = '12,10,30'; DARK_COL.innertide = '14,30,40';
  if (typeof DECALS !== 'undefined') { DECALS.mare = [['crater', 0.08], ['ashdrift', 0.07], ['pebbles', 0.05]]; DECALS.shafts = [['moonchip', 0.08], ['pebbles', 0.05], ['crack', 0.03]]; DECALS.innertide = [['pearlsand', 0.08], ['tidepool', 0.05], ['shard', 0.03]]; }
  // a ring of rocks and stones round each room's rim
  const RIMS = { mare: ['moonrock', 'obelisk', 'moonrock', 'moonspire'], shafts: ['moonstone', 'floatrock', 'moonstone', 'gravring'], innertide: ['minaret', 'cypress', 'jali', 'moonlantern', 'cypress', 'chhatri'] };
  function dressRim({ rm, i, G, RM, props, R, MW, walk, okFeature, first, id }) {
    const L = RIMS[rm.biome]; if (!L) return; const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 20) return; const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && [1, -1, MW, -MW].some(d => !walk(k + d) && !props.has(k + d)); });
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]]; for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } } return seen.size >= open.length; };
    let want = Math.round(rim.length * (first ? 0.15 : 0.25)), tries = 0;
    while (want > 0 && rim.length && tries++ < 150) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1); if ([1, -1, MW, -MW].filter(d => props.has(k + d)).length > 1) continue; const was = G[k]; G[k] = T_SOLID; if (!connected()) { G[k] = was; continue; } props.set(k, L[Math.floor(R() * L.length)]); want--; }
  }
  BIOMES.mare.dress = BIOMES.shafts.dress = BIOMES.innertide.dress = dressRim;

  /* ---- the brood ---- */
  Object.assign(MON, {
    mooncalf: { name: 'Mooncalf', from: 999, hp: 320, spd: 1.3, r: 0.55, dmg: 20, xp: 18, coin: 1.0, color: '#D6D2DA', bio: ['mare', 'shafts', 'innertide'], tip: 'A pale eyeless toad of the moon, heavy as stone. It crouches, then leaps onto a shown circle and shakes the ground where it lands.', kit: [] },
    craterwisp: { name: 'Crater wisp', from: 999, hp: 230, spd: 1.2, r: 0.45, dmg: 15, xp: 16, coin: 0.9, color: MOONSTONE, bio: ['mare', 'shafts', 'innertide'], fly: true, tip: 'A lantern jelly of moonlight. A ring spreads round it, then it PULLS you in and flares: get out of the ring before it does.', kit: [] },
    dustwraith: { name: 'Dust wraith', from: 999, hp: 270, spd: 2.0, r: 0.45, dmg: 18, xp: 17, coin: 0.9, color: '#9A9EAC', bio: ['mare', 'shafts', 'innertide'], tip: 'A wraith of moon dust. It sinks into the ground, races under it (a trail of dust), and erupts under a shown circle.', kit: [] },
    tideling: { name: 'Tideling', from: 999, hp: 260, spd: 1.6, r: 0.45, dmg: 15, xp: 16, coin: 0.9, color: '#5A8A96', bio: ['innertide'], tip: 'A crab-fish of the inner sea. It lobs a bubble of tide onto a shown circle: the water left there slows you.', kit: [] },
    eclipsemoth: { name: 'Eclipse moth', from: 999, hp: 220, spd: 1.8, r: 0.42, dmg: 16, xp: 16, coin: 0.9, color: '#2A2640', bio: ['innertide'], fly: true, tip: 'A moth of the black sun. It folds its wings and dives along a shown line.', kit: [] },
  });
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  Object.assign(MP, {
    /* a squat pale toad, no eyes, a wide seam of a mouth and a cluster of short pink feelers on its snout; it crouches to
       leap and hangs in the air (o.z) */
    mooncalf(c, r, ph, o) { const lw = lwOf(r), crouch = o.mode === 'block' ? 1 : 0, air = o.mode === 'dash' ? 1 : 0, br = Math.sin(ph * TAU) * 0.04;
      c.fillStyle = 'rgba(10,12,24,.28)'; ell(c, 0, r * 0.75, r * (0.95 - air * 0.3), r * 0.26); c.fill();
      c.save(); c.translate(0, -air * r * 0.9);
      for (const sd of [-1, 1]) { limb(c, sd * r * 0.5, r * 0.3, sd * r * (0.95 + crouch * 0.15), r * (0.7 - air * 0.3), lw * 1.6, '#BDB8C2'); limb(c, sd * r * 0.25, r * 0.4, sd * r * 0.35, r * 0.75, lw * 1.3, '#BDB8C2'); }
      c.beginPath(); c.ellipse(0, r * (0.15 + crouch * 0.1), r * (0.9 + crouch * 0.1), r * (0.62 - crouch * 0.12 + br), 0, 0, TAU); c.fillStyle = shade(c, o.color, r, -r * 0.25, -r * 0.2, 0.4); c.fill(); stroke(c, lw);
      c.fillStyle = 'rgba(140,130,150,.35)'; for (const [x, y, s] of [[-0.4, -0.1, 0.12], [0.3, 0.0, 0.1], [0.05, -0.3, 0.09], [-0.15, 0.25, 0.08], [0.5, 0.3, 0.07]]) { c.beginPath(); c.arc(x * r, y * r, s * r, 0, TAU); c.fill(); }
      c.strokeStyle = LN; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(r * 0.15, r * 0.2); c.quadraticCurveTo(r * 0.55, r * 0.35, r * 0.85, r * 0.12); c.stroke();
      for (let i = 0; i < 5; i++) { const a = -0.6 + i * 0.3, x0 = r * 0.82, y0 = -r * 0.05; limb(c, x0, y0, x0 + Math.cos(a) * r * 0.35, y0 + Math.sin(a) * r * 0.35 + Math.sin(ph * TAU * 2 + i) * r * 0.05, lw * 0.9, ROSE); }
      c.restore(); },
    /* a jelly of moonlight: a glowing bell, a ring of light inside, trailing ribbons; the bell swells as it pulls */
    craterwisp(c, r, ph, o) { const lw = lwOf(r), pull = o.mode === 'block' ? 1 : 0, bob = Math.sin(ph * TAU) * r * 0.15, k = 1 + pull * 0.2;
      c.fillStyle = 'rgba(10,12,24,.18)'; ell(c, 0, r * 1.2, r * 0.6, r * 0.16); c.fill();
      c.save(); c.translate(0, -r * 0.5 + bob); glowIn(c, 0, 0, r * (1.8 + pull), MOONSTONE, 0.55 + pull * 0.3);
      for (let i = 0; i < 4; i++) { const x0 = (i - 1.5) * r * 0.3; c.strokeStyle = 'rgba(226,238,255,.7)'; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(x0, r * 0.3); c.quadraticCurveTo(x0 + Math.sin(ph * TAU + i) * r * 0.3, r * 0.9, x0, r * 1.4); c.stroke(); }
      c.beginPath(); c.moveTo(-r * 0.8 * k, r * 0.3); c.quadraticCurveTo(-r * 0.85 * k, -r * 0.8 * k, 0, -r * 0.85 * k); c.quadraticCurveTo(r * 0.85 * k, -r * 0.8 * k, r * 0.8 * k, r * 0.3); c.quadraticCurveTo(0, r * 0.1, -r * 0.8 * k, r * 0.3); c.closePath();
      c.globalAlpha = 0.85; c.fillStyle = shade(c, MOON_HI, r, -r * 0.2, -r * 0.4, 0.35); c.fill(); c.globalAlpha = 1; stroke(c, lw);
      c.strokeStyle = pull ? '#FFFFFF' : MOONSTONE; c.lineWidth = lw * 1.2; ell(c, 0, -r * 0.2, r * 0.4 * k, r * 0.2 * k); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, -r * 0.2, r * 0.1, 0, TAU); c.fill();
      c.restore(); },
    /* a hunched wraith of grey dust, its lower half trailing into the ground, two pale pin-lights for eyes; burrowed it is
       only a mound of moving dust */
    dustwraith(c, r, ph, o) { const lw = lwOf(r), sw = Math.sin(ph * TAU) * 0.1;
      if (o.mode === 'dash') { c.fillStyle = 'rgba(120,124,140,.55)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc((i - 2) * r * 0.25, r * 0.6 - Math.abs(Math.sin(ph * TAU * 3 + i)) * r * 0.2, r * 0.25, 0, TAU); c.fill(); } return; }
      c.fillStyle = 'rgba(10,12,24,.25)'; ell(c, 0, r * 0.8, r * 0.75, r * 0.22); c.fill();
      c.beginPath(); c.moveTo(-r * 0.6, r * 0.75); c.quadraticCurveTo(-r * 0.8, -r * 0.2, -r * 0.3 + sw * r, -r * 0.85); c.quadraticCurveTo(r * 0.1, -r * 1.1, r * 0.5, -r * 0.6); c.quadraticCurveTo(r * 0.8, r * 0.1, r * 0.6, r * 0.75);
      for (let i = 4; i >= 0; i--) c.lineTo(-r * 0.6 + r * 1.2 * i / 4, r * (0.6 + (i % 2) * 0.2)); c.closePath(); c.fillStyle = shade(c, o.color, r, -r * 0.2, -r * 0.4, 0.35); c.fill(); stroke(c, lw);
      for (const sd of [-1, 1]) limb(c, sd * r * 0.45, -r * 0.2, sd * r * 0.85, r * 0.15 + sw * r * sd, lw * 1.2, '#8C909E');
      glowIn(c, r * 0.1, -r * 0.5, r * 0.5, MOON_HI, 0.5); c.fillStyle = '#FFFFFF'; for (const x of [-0.05, 0.25]) { c.beginPath(); c.arc(x * r, -r * 0.5, r * 0.07, 0, TAU); c.fill(); } },
    /* a teal crab-fish: a rounded shell, two claws, a fish tail and fin, bubble-eyes on stalks */
    tideling(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU * 2), spit = o.mode === 'block' ? 1 : 0;
      c.fillStyle = 'rgba(10,12,24,.25)'; ell(c, 0, r * 0.75, r * 0.85, r * 0.24); c.fill();
      for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) limb(c, sd * r * 0.3, r * 0.3, sd * r * (0.7 + i * 0.1), r * 0.7 + run * r * 0.05 * (i % 2 ? 1 : -1), lw, '#3E6A76');
      c.beginPath(); c.moveTo(-r * 0.7, r * 0.1); c.lineTo(-r * 1.15, -r * 0.25); c.lineTo(-r * 1.1, r * 0.4); c.closePath(); c.fillStyle = TIDE_HI; c.fill(); stroke(c, lw * 0.8);
      ell(c, 0, r * 0.15, r * 0.75, r * 0.5); c.fillStyle = shade(c, o.color, r, -r * 0.25, -r * 0.1, 0.4); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = lw * 0.7; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, r * 0.15, r * (0.2 + i * 0.15), Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      for (const sd of [-1, 1]) { limb(c, r * 0.5, r * 0.1 * sd, r * 0.95, -r * 0.1 + sd * r * 0.3, lw * 1.3, '#3E6A76'); c.beginPath(); c.arc(r * 1.0, -r * 0.1 + sd * r * 0.3, r * 0.16, 0, TAU); c.fillStyle = '#7AAAB4'; c.fill(); stroke(c, lw * 0.8); }
      for (const x of [-0.15, 0.2]) { limb(c, x * r, -r * 0.25, x * r, -r * 0.6, lw * 0.8, '#3E6A76'); c.beginPath(); c.arc(x * r, -r * 0.65, r * 0.12, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill(); stroke(c, lw * 0.6); c.fillStyle = INK; c.beginPath(); c.arc(x * r + r * 0.03, -r * 0.65, r * 0.05, 0, TAU); c.fill(); }
      if (spit) { c.fillStyle = 'rgba(127,216,224,.7)'; c.beginPath(); c.arc(r * 0.6, -r * 0.1, r * 0.2, 0, TAU); c.fill(); } },
    /* a dark moth with wide wings bearing a pale ring like an eclipse; folded tight in the dive */
    eclipsemoth(c, r, ph, o) { const lw = lwOf(r), dive = o.mode === 'dash' || o.mode === 'block' ? 1 : 0, fl = Math.sin(ph * TAU * 2.5) * 0.3, bob = Math.sin(ph * TAU) * r * 0.1;
      c.fillStyle = 'rgba(10,12,24,.2)'; ell(c, 0, r * 1.1, r * 0.6, r * 0.18); c.fill();
      c.save(); c.translate(0, -r * 0.4 + bob);
      for (const sd of [-1, 1]) { c.save(); c.scale(sd, 1); c.rotate(dive ? 0.8 : fl); const W = r * (dive ? 0.8 : 1.4);
        c.beginPath(); c.moveTo(r * 0.1, -r * 0.1); c.quadraticCurveTo(W * 0.7, -W * 0.9, W, -W * 0.2); c.quadraticCurveTo(W * 0.9, W * 0.5, r * 0.1, r * 0.3); c.closePath(); c.fillStyle = shade(c, o.color, W, W * 0.5, -W * 0.3, 0.35); c.fill(); stroke(c, lw * 0.9);
        c.strokeStyle = 'rgba(255,240,184,.8)'; c.lineWidth = lw; c.beginPath(); c.arc(W * 0.55, -W * 0.15, W * 0.2, 0, TAU); c.stroke(); c.fillStyle = '#05060A'; c.beginPath(); c.arc(W * 0.55, -W * 0.15, W * 0.13, 0, TAU); c.fill(); c.restore(); }
      ell(c, 0, 0, r * 0.2, r * 0.55); c.fillStyle = '#3A3450'; c.fill(); stroke(c, lw);
      for (const sd of [-1, 1]) { c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(0, -r * 0.5); c.quadraticCurveTo(sd * r * 0.3, -r * 0.9, sd * r * 0.45, -r * 0.95); c.stroke(); }
      c.fillStyle = GOLD_HI; for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * r * 0.08, -r * 0.4, r * 0.05, 0, TAU); c.fill(); } c.restore(); },
  });
  Object.assign(EXT, { mooncalf: 3.0, craterwisp: 3.4, dustwraith: 2.6, tideling: 3.0, eclipsemoth: 3.4 }); Object.assign(NF, { mooncalf: 6, craterwisp: 6, dustwraith: 6, tideling: 6, eclipsemoth: 6 });
  const { mon, keepRange } = DunAI;
  // (a mooncalf's landing: the ground shakes; the Weighing's scales listen for it via MOON.onLand)
  MOON.onLand = null;
  Object.assign(mon, {
    mooncalf(m, A, X) {
      if (m.leapT > 0) { m.leapT -= A.dt; m.mode = 'dash'; const u = 1 - m.leapT / m.leapMax; m.x = m.lx0 + (m.lx1 - m.lx0) * u; m.y = m.ly0 + (m.ly1 - m.ly0) * u; m.z = Math.sin(u * Math.PI) * 1.6;
        if (m.leapT <= 0) { m.mode = null; m.z = 0; const p = X.walkPoint ? X.walkPoint(m.lx1, m.ly1, m) : { x: m.lx1, y: m.ly1 }; m.x = p.x; m.y = p.y; X.ring(m.x, m.y, 0.3, 2.0, 0.35, '#D6D2DA', 0.4); X.shake(4, 0.2);
          if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 1.5 + X.me.r * 0.5 && !X.me.dodge) X.hurtPet(m.dmg * 1.3, m);
          if (MOON.onLand) MOON.onLand(m, m.x, m.y); m.cd = 2.4 + Math.random() * 1.4; } return; }
      if (m.crouchT > 0) { m.crouchT -= A.dt; m.mode = 'block'; if (m.crouchT <= 0) { m.leapT = m.leapMax = 0.6; m.lx0 = m.x; m.ly0 = m.y; } return; }
      m.mode = null; if (A.d > 3) A.steer(A.sp); m.face = A.dx >= 0 ? 1 : -1;
      if (m.cd <= 0 && A.d < 7.5) { m.crouchT = 0.8; m.lx1 = X.me.x; m.ly1 = X.me.y; X.warn({ x: m.lx1, y: m.ly1, r: 1.5, life: 1.4, max: 1.4, src: m, color: '#D6D2DA' }); }
    },
    craterwisp(m, A, X) {
      if (m.pullT > 0) { m.pullT -= A.dt; m.mode = 'block'; const d = Math.hypot(X.me.x - m.x, X.me.y - m.y); if (d < 3.4 && d > 0.6 && !X.me.dodge) X.moveEnt(X.me, (m.x - X.me.x) / d * 2.6 * A.dt, (m.y - X.me.y) / d * 2.6 * A.dt);
        if (m.pullT <= 0) { m.mode = null; X.ring(m.x, m.y, 0.3, 2.2, 0.35, MOON_HI, 0.5); if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 2.0 + X.me.r * 0.5 && !X.me.dodge) X.hurtPet(m.dmg * 1.4, m); m.cd = 3.2 + Math.random() * 1.6; } return; }
      m.mode = null; keepRange(m, A, X, 2.5, 5);
      if (m.cd <= 0 && A.d < 4.5) { m.pullT = 1.2; X.warn({ x: m.x, y: m.y, r: 3.4, life: 1.2, max: 1.2, src: m, color: MOONSTONE }); }
    },
    dustwraith(m, A, X) {
      if (m.burrowT > 0) { m.burrowT -= A.dt; m.mode = 'dash'; m.untargetable = true; if (A.d > 1) X.moveEnt(m, A.ux * 4.2 * A.dt, A.uy * 4.2 * A.dt); if (Math.random() < 0.4) X.part({ kind: 'spark', x: m.x, y: m.y, vx: (Math.random() - 0.5) * 2, vy: -1.5, life: 0.5, max: 0.5, size: 3, color: '#B9BCC6' });
        if (m.burrowT <= 0) { m.mode = null; m.untargetable = false; const px = X.me.x, py = X.me.y; X.warn({ x: px, y: py, r: 1.3, life: 0.75, max: 0.75, src: m, color: '#B9BCC6', fn: () => { const p = X.freeSpot(px, py, m.r) || { x: m.x, y: m.y }; m.x = p.x; m.y = p.y; X.boom(px, py, 1.2, '#B9BCC6', '#FFFFFF', { n: 14, shake: 4 }); if (Math.hypot(X.me.x - px, X.me.y - py) < 1.3 + X.me.r * 0.5 && !X.me.dodge) X.hurtPet(m.dmg * 1.3, m); } }); m.cd = 3 + Math.random() * 1.5; } return; }
      m.mode = null; keepRange(m, A, X, 2.5, 5.5);
      if (m.cd <= 0 && A.d < 9) m.burrowT = 1.3;
    },
    tideling(m, A, X) {
      if (m.spitT > 0) { m.spitT -= A.dt; m.mode = 'block'; if (m.spitT <= 0) m.mode = null; return; }
      m.mode = null; keepRange(m, A, X, 3, 6);
      if (m.cd <= 0 && A.d < 8) { m.cd = 2.8 + Math.random() * 1.2; m.spitT = 0.5; const px = X.me.x + (X.me.vx || 0) * 0.4, py = X.me.y + (X.me.vy || 0) * 0.4; X.warn({ x: px, y: py, r: 1.3, life: 1.0, max: 1.0, src: m, color: TIDE_HI, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.3 + X.me.r * 0.5) X.hurtPet(m.dmg, m); X.zone({ kind: 'stall', x: px, y: py, r: 1.4, life: 3.5, max: 3.5, own: 'enemy' }); X.ring(px, py, 0.2, 1.4, 0.3, TIDE_HI, 0.4); } }); }
    },
    eclipsemoth(m, A, X) {
      if (m.dashT > 0) { m.dashT -= A.dt; m.mode = 'dash'; X.moveEnt(m, Math.cos(m.da) * 12 * A.dt, Math.sin(m.da) * 12 * A.dt); if (!m.dhit && A.d < m.r + X.me.r + 0.3) { m.dhit = true; X.hurtPet(m.dmg * 1.3, m); } if (m.dashT <= 0) { m.mode = null; m.cd = 2.6 + Math.random(); } return; }
      if (m.aimT > 0) { m.aimT -= A.dt; m.mode = 'block'; if (m.aimT <= 0) { m.dashT = 0.45; m.dhit = false; } return; }
      m.mode = null; keepRange(m, A, X, 3, 6);
      if (m.cd <= 0 && A.d < 6.5 && A.los()) { m.aimT = 0.6; m.da = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 6.5, w: 0.8, life: 0.6, max: 0.6, src: m, color: GOLD_HI }); }
    },
  });

  /* ---- gravity geodes: break one and it implodes, dragging the monsters near it into its heart and crushing them ---- */
  Object.assign(MON, { gravgeode: { name: 'Gravity geode', from: 999, hp: 150, spd: 0, r: 0.55, dmg: 0, xp: 2, coin: 0.2, color: '#B9A6FF', bio: ['mare', 'shafts', 'innertide'], still: true, tip: 'A geode heavy with the moon\'s pull. Break it and it implodes: every monster near it is dragged into its heart and crushed. Lure them in first; stand clear yourself.', kit: [], onDeath(m, X) { implode(m, X); } } });
  const PULL_R = 5;
  function implode(m, X) { const x = m.x, y = m.y, caught = X.mons.filter(q => !q.dead && q !== m && !q.boss && !q.fobj && q.type !== 'gravgeode' && Math.hypot(q.x - x, q.y - y) < PULL_R);
    X.ring(x, y, PULL_R, 0.3, 0.55, '#B9A6FF', 0.6); if (X.sfx.crash) X.sfx.crash();
    for (const q of caught) { q.freeze = Math.max(q.freeze || 0, 0.8); const sx = q.x, sy = q.y; for (let i = 1; i <= 6; i++) X.after(i * 0.08, () => { if (q.dead) return; q.x = sx + (x - sx) * i / 7; q.y = sy + (y - sy) * i / 7; }); }
    X.after(0.6, () => { X.boom(x, y, 1.8, '#B9A6FF', '#FFFFFF', { n: 26, shake: 9 }); let n = 0; for (const q of caught) if (!q.dead) { n++; X.hitMon(q, q.maxhp * 0.85, { flat: true }); } X.text(x, y - 1.6, n >= 2 ? `CRUSHED ×${n}!` : 'IMPLODE!', '#E2D8FF', n >= 2 ? 17 : 13);
      if (Math.hypot(X.me.x - x, X.me.y - y) < 1.8 && !X.me.dodge) { X.hurtPet(X.ST().hp * 0.12, null); X.text(X.me.x, X.me.y - 1.4, 'Too close!', '#E2D8FF', 13); } }); }
  MP.gravgeode = (c, r, ph, o) => { const lw = lwOf(r), k = 0.5 + 0.5 * Math.sin(ph * TAU * 1.5);
    c.save(); c.strokeStyle = 'rgba(185,166,255,.7)'; c.lineWidth = 2; c.setLineDash([5, 5]); ell(c, 0, r * 0.75, r * 1.6, r * 0.5); c.stroke(); c.restore();
    c.fillStyle = 'rgba(10,12,24,.3)'; ell(c, 0, r * 0.75, r * 0.9, r * 0.25); c.fill();
    const R = rnd(7); lump(c, 0, r * 0.05, r * 0.95, r * 0.75, R, 10); c.fillStyle = shade(c, '#6A6880', r, -r * 0.3, -r * 0.3, 0.45); c.fill(); stroke(c, lw);
    glowIn(c, 0, -r * 0.1, r * (1.1 + k * 0.5), '#B9A6FF', 0.5 + k * 0.3);
    for (let i = 0; i < 5; i++) { const a = -Math.PI + (i + 0.5) / 5 * Math.PI, x = Math.cos(a) * r * 0.45, y = Math.sin(a) * r * 0.25; c.beginPath(); c.moveTo(x - r * 0.1, y + r * 0.1); c.lineTo(x, y - r * 0.5); c.lineTo(x + r * 0.1, y + r * 0.1); c.closePath(); c.fillStyle = i % 2 ? '#E2D8FF' : '#B9A6FF'; c.fill(); stroke(c, lw * 0.6); }
    // little stones circling it, caught in its pull
    for (let i = 0; i < 3; i++) { const a = ph * TAU * 0.5 + i * 2.1; c.fillStyle = '#8C909E'; c.beginPath(); c.arc(Math.cos(a) * r * 1.2, -r * 0.2 + Math.sin(a) * r * 0.4, r * 0.1, 0, TAU); c.fill(); } };
  Object.assign(EXT, { gravgeode: 3.6 }); Object.assign(NF, { gravgeode: 1 }); mon.gravgeode = () => {};
  function geodesExtra(X, self, H) { const M = X.M, list = [];
    for (const rm of M.rooms.slice(1)) { const n = 1 + (Math.random() < 0.5 ? 1 : 0); for (let k = 0; k < n; k++) { const q = X.freeSpot(rm.x + rm.w * (0.25 + Math.random() * 0.5), rm.y + rm.h * (0.25 + Math.random() * 0.5), 0.8); if (!q) continue; const m = X.spawnMon('gravgeode', q.x, q.y, { pack: 882, rift: true }); m.aggro = false; m.optional = true; list.push(m); } }
    X.after(4.5, () => X.banner('GRAVITY GEODES', 'Break one near a pack: it drags them into its heart and crushes them', '#E2D8FF', 3, true));
    return { list, drawGround(c) { const T = X.Tz(), t = X.g.t; for (const m of list) { if (m.dead || Math.hypot(X.me.x - m.x, X.me.y - m.y) > 8) continue; c.save(); c.strokeStyle = 'rgba(185,166,255,.35)'; c.lineWidth = 2; c.setLineDash([6, 8]); c.lineDashOffset = t * 12; c.beginPath(); c.ellipse(X.sx(m.x), X.sy(m.y), PULL_R * T, PULL_R * T * 0.55, 0, 0, TAU); c.stroke(); c.restore(); } } }; }

  /* ---- the mini bosses: Rift-touched Cocopets ---- */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; };
  BOSSES.push(
    { id: 'craterpet', rift: true, name: 'Crater', title: 'A Rift-touched Cocopet', hp: 80000, dmg: 46, r: 1.4, spd: 1.8, color: REG, glow: MOON_HI, biome: 'mare', el: 'earth' },
    { id: 'gravpet', rift: true, name: 'Gravity', title: 'A Rift-touched Cocopet', hp: 86000, dmg: 46, r: 1.45, spd: 1.7, color: INDIGO, glow: MOONSTONE, biome: 'shafts', el: 'cosmic' },
    { id: 'tidepet', rift: true, name: 'Undertow', title: 'A Rift-touched Cocopet', hp: 94000, dmg: 50, r: 1.5, spd: 1.7, color: TIDE, glow: TIDE_HI, biome: 'innertide', el: 'water' });
  Object.assign(DunAI.boss, {
    /* Crater: it leaps high and comes down on a shown circle, three times in a row */
    craterpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['slam', 'rocks', 'slam'] : ['slam', 'rocks']); }
      const T = m.actT; switch (m.act) {
        case 'slam': { if (m.step < 3 && T > m.step * 0.9) { m.step++; const px = X.me.x, py = X.me.y; if (m.step === 1) X.say(m, 'Feel the weight.'); X.warn({ x: px, y: py, r: 2.2, life: 0.85, max: 0.85, src: m, color: REG_HI, fn: () => { const p = X.freeSpot(px, py, m.r) || { x: m.x, y: m.y }; m.x = p.x; m.y = p.y; X.boom(px, py, 2, REG_HI, '#FFFFFF', { n: 16, shake: 6 }); if (Math.hypot(X.me.x - px, X.me.y - py) < 2.2 + X.me.r) X.hurtPet(m.dmg * 1.3, m); } }); }
          if (T > 3.0) done(m, 1.5); break; }
        case 'rocks': { if (m.step < 5 && T > m.step * 0.25) { m.step++; const px = X.me.x + (Math.random() - 0.5) * 5, py = X.me.y + (Math.random() - 0.5) * 5; X.warn({ x: px, y: py, r: 1.3, life: 1.0, max: 1.0, src: m, color: REG, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.3 + X.me.r) X.hurtPet(m.dmg, m); X.boom(px, py, 1.2, REG, '#FFFFFF', { n: 10, shake: 3 }); } }); }
          if (T > 2.0) done(m, 1.4); break; }
        default: done(m, 1); } },
    /* Gravity: a well that drags you in, then rings of force out of it */
    gravpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['well', 'rings', 'well'] : ['well', 'rings']); }
      const T = m.actT; switch (m.act) {
        case 'well': { if (m.step === 0) { m.step = 1; m.wx = X.me.x; m.wy = X.me.y; X.say(m, 'Come closer.'); X.warn({ x: m.wx, y: m.wy, r: 1.8, life: 1.8, max: 1.8, src: m, color: MOONSTONE, fn: () => { X.boom(m.wx, m.wy, 1.8, MOONSTONE, '#FFFFFF', { n: 18, shake: 5 }); if (Math.hypot(X.me.x - m.wx, X.me.y - m.wy) < 1.8 + X.me.r) X.hurtPet(m.dmg * 1.5, m); } }); }
          if (T < 1.8) { const d = Math.hypot(X.me.x - m.wx, X.me.y - m.wy); if (d > 0.3 && d < 6 && !X.me.dodge) X.moveEnt(X.me, (m.wx - X.me.x) / d * 2.2 * A.dt, (m.wy - X.me.y) / d * 2.2 * A.dt); }
          if (T > 2.2) done(m, 1.5); break; }
        case 'rings': { if (m.step < 3 && T > m.step * 0.6) { m.step++; const n = 12, off = m.step * 0.26; for (let i = 0; i < n; i++) X.eshot(m.x, m.y - 0.5, off + i / n * TAU, 5, { dmg: m.dmg * 0.8, color: MOON_HI, core: '#FFFFFF', r: 0.18, style: 'orb', src: m }); }
          if (T > 2.2) done(m, 1.5); break; }
        default: done(m, 1); } },
    /* Undertow: a wave rolling along a shown band, then a whirlpool round it */
    tidepet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['wave', 'pool', 'wave'] : ['wave', 'pool']); }
      const T = m.actT; switch (m.act) {
        case 'wave': { if (m.step === 0) { m.step = 1; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.say(m, 'Drown.'); X.warn({ shape: 'line', x: m.x, y: m.y, a, len: 12, w: 2.4, life: 1.0, max: 1.0, src: m, color: TIDE_HI, fn: () => { if (X.inLine(m.x, m.y, a, 12, 2.4)) { X.hurtPet(m.dmg * 1.3, m); X.push(a, 2.2); } } }); }
          if (T > 1.5) done(m, 1.5); break; }
        case 'pool': { if (m.step === 0) { m.step = 1; X.warn({ x: m.x, y: m.y, r: 4, life: 1.2, max: 1.2, src: m, color: TIDE, fn: () => { X.zone({ kind: 'stall', x: m.x, y: m.y, r: 4, life: 4, max: 4, own: 'enemy' }); if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 4 + X.me.r) X.hurtPet(m.dmg * 1.1, m); X.ring(m.x, m.y, 0.3, 4, 0.4, TIDE_HI, 0.4); } }); }
          if (T > 1.8) done(m, 1.6); break; }
        default: done(m, 1); } },
  });

  /* ---- the rift ---- */
  const SEALING = { fall: 'THE HOLLOW HEART IS STILL', sub: 'The pull lets go; the tides fall quiet across the lunar islands', sigil: 'THE WEIGHT SIGIL', name: 'The Hollow Moon', color: MOON_HI };
  const ST = (typeof MOON_STAGES !== 'undefined' && MOON_STAGES) || {};
  const placeholder = (name, goal) => ({ name, goal, how: goal, layout: ['##########', '#........#', '#...E....#', '#........#', '#...S....#', '##########'], legend: { E: {} }, make(X, self, H) { const e = X.M.marks.E[0]; self.done = true; H.setExit(e.x, e.y, 'The way on'); return {}; } });
  defRift({
    ease: 0.55, monEase: 0.5,
    id: 'moon', n: 8, name: 'The Hollow Moon', lvl: 80, sigil: 'Weight', biome: 'mare', aff: ['cosmic', 'water'], region: 'the lunar islands',
    blurb: 'The moon over the islands is hollow, and something in it has begun to pull. Weigh down its scales, outrun its tide, and hold the light against the black sun.', gate: { anima: 'pisces', name: 'The Silverline Basin' },
    mons: ['mooncalf', 'craterwisp', 'dustwraith'], sealing: SEALING,
    stages: riftSections([
      { biome: 'mare', pattern: ['fight', 'trial', 'boss'], mods: ['random'], fights: ['The Ash Fields'], minis: ['craterpet'], miniHp: 0.6, extra: geodesExtra, trials: [ST.WEIGHING || placeholder('The Weighing', 'Weigh down the three scales')], boss: 'tsukimochi', bossName: 'Tsukimochi, the Moon Rabbit', bossRoom: 'The Great Crater' },
      { biome: 'shafts', pattern: ['trial', 'fight', 'boss'], mods: ['random'], fights: ['The Moonstone Deep'], minis: ['gravpet'], miniHp: 0.6, extra: geodesExtra, trials: [ST.TIDERUN || placeholder('The Tide Run', 'Outrun the tide')], boss: 'selenarch', bossName: 'The Selenarch, the Weighing Engine', bossRoom: 'The Balance Hall' },
      { biome: 'innertide', pattern: ['trial', 'fight', 'fight', 'boss'], mods: ['curse', 'random'], fights: ['The Marble Gardens', 'The Hall of Domes'], minis: ['tidepet'], miniHp: 0.6, mobs: ['tideling', 'marblesentry', 'eclipsemoth', 'umbral', 'marblesentry', 'craterwisp'], extra: geodesExtra, trials: [ST.SIEGE || placeholder('The Black Sun Siege', 'Hold the light')], boss: 'ylthmora', bossName: 'Ylth-Mora, the Hollow Heart', bossRoom: 'The Heart of the Moon' },
    ]),
  });
  // (low gravity: a few motes of ash drifting up over every stage of the rift)
  RIFT_BY_ID.moon.everyStage = (X) => { const motes = []; return {
    update(dt) { if (motes.length < 14 && Math.random() < 0.3) motes.push({ x: Math.random(), y: 1.05, v: 0.02 + Math.random() * 0.04, s: 1 + Math.random() * 1.5, ph: Math.random() * 6 }); for (const q of motes) q.y -= q.v * dt; for (let i = motes.length - 1; i >= 0; i--) if (motes[i].y < -0.05) motes.splice(i, 1); },
    drawOver(c) { const W = X.W(), Hh = X.H ? X.H() : 900, t = X.g.t; c.save(); for (const q of motes) { c.globalAlpha = 0.25 + 0.2 * Math.sin(t * 2 + q.ph); c.fillStyle = X.F.biome === 'innertide' ? '#F4EEF6' : '#E4E6EC'; c.beginPath(); c.arc(q.x * W + Math.sin(t * 0.6 + q.ph) * 14, q.y * Hh, q.s, 0, TAU); c.fill(); } c.restore(); } }; };
  MOON.dressRim = dressRim; MOON.geodesExtra = geodesExtra; MOON.implode = implode; MOON.lump = lump; MOON.crater = crater;
})();
