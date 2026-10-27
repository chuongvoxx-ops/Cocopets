/* ---------- Rift 08, the Hollow Moon: III The Moon Castle ----------
   At the moon's hollow heart stands a palace of white marble: great onion domes on drums, slender minarets with
   balconies, domed pavilions on slim columns, pointed arches deep-set in marble gateways, lattice screens, fountains,
   dark cypresses in the gardens and long still reflecting pools that hold the domes upside down. Pietra-dura inlay
   (flowers of red and green stone, gold lines) runs through the floors and walls. The black sun hangs over it all.
   This restyles the third land (biome id 'innertide', kept so everything that names it still finds it). */
(() => {
  const TAU = Math.PI * 2, { INK, GOLD, GOLD_HI, MOON_HI, MOONSTONE, TIDE_HI } = MOON;
  const { PROPS } = DunWorld, { LN, shade, lwOf, MP, EXT, NF, stroke } = DunArt;
  const MARBLE = '#F2EEE6', MARBLE_D = '#D6CFC2', MARBLE_DD = '#B4AC9C', INLAY_R = '#B8404E', INLAY_G = '#3E7A5A', CYP = '#2E5A44';
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const ink = (c, lw) => { c.strokeStyle = LN; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(30,24,40,${a || 0.28})`; ell(c, 0, T * 0.03, T * w, T * w * 0.32); c.fill(); };
  // a cylinder lit from the upper left: light rim, white body, shaded right side
  const cyl = (c, x0, x1) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#E4DED2'); g.addColorStop(0.22, '#FFFFFF'); g.addColorStop(0.6, MARBLE); g.addColorStop(1, MARBLE_DD); return g; };
  // an onion dome: a bulb swelling wider than its neck, drawn to a point; a lotus collar at its foot and a gold finial
  function onion(c, x, y, w, h, lw, gold) { c.beginPath(); c.moveTo(x - w * 0.62, y); c.bezierCurveTo(x - w * 1.12, y - h * 0.32, x - w * 0.86, y - h * 0.78, x, y - h); c.bezierCurveTo(x + w * 0.86, y - h * 0.78, x + w * 1.12, y - h * 0.32, x + w * 0.62, y); c.closePath(); c.fillStyle = cyl(c, x - w, x + w); c.fill(); ink(c, lw);
    c.strokeStyle = 'rgba(180,172,156,.55)'; c.lineWidth = lw * 0.6; for (const k of [-0.45, 0, 0.45]) { c.beginPath(); c.moveTo(x + k * w * 0.9, y - h * 0.05); c.quadraticCurveTo(x + k * w * 1.15, y - h * 0.5, x, y - h * 0.97); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.7)'; ell(c, x - w * 0.42, y - h * 0.5, w * 0.12, h * 0.2, -0.3); c.fill();
    c.fillStyle = MARBLE_D; c.beginPath(); for (let i = 0; i <= 8; i++) { const u = i / 8, px = x - w * 0.62 + u * w * 1.24; c.lineTo(px, y + (i % 2 ? 0 : -h * 0.06)); } c.lineTo(x + w * 0.62, y + h * 0.05); c.lineTo(x - w * 0.62, y + h * 0.05); c.closePath(); c.fill(); ink(c, lw * 0.6);
    // the finial: a gold spike with a crescent
    const fy = y - h; c.strokeStyle = gold || GOLD; c.lineWidth = Math.max(1.4, lw * 1.1); c.beginPath(); c.moveTo(x, fy); c.lineTo(x, fy - h * 0.35); c.stroke(); c.fillStyle = gold || GOLD; for (const k of [0.08, 0.18]) { c.beginPath(); c.arc(x, fy - h * k, Math.max(1.2, w * 0.07), 0, TAU); c.fill(); }
    c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(1.2, lw * 0.9); c.beginPath(); c.arc(x, fy - h * 0.38, Math.max(2, w * 0.1), Math.PI * 0.15, Math.PI * 0.85, true); c.stroke(); }
  // a Mughal pointed arch (four-centred, with a small ogee tip): path only
  function archPath(c, x, y, w, h) { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w, y - h * 0.55); c.quadraticCurveTo(x - w, y - h * 0.92, x - w * 0.12, y - h * 0.97); c.lineTo(x, y - h); c.lineTo(x + w * 0.12, y - h * 0.97); c.quadraticCurveTo(x + w, y - h * 0.92, x + w, y - h * 0.55); c.lineTo(x + w, y); c.closePath(); }
  // a little pietra-dura flower: red petals, green leaves, a gold eye
  function inlayFlower(c, x, y, s) { c.fillStyle = INLAY_G; for (const sd of [-1, 1]) { ell(c, x + sd * s * 0.6, y + s * 0.35, s * 0.42, s * 0.16, sd * 0.6); c.fill(); } c.fillStyle = INLAY_R; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; ell(c, x + Math.cos(a) * s * 0.32, y + Math.sin(a) * s * 0.32, s * 0.24, s * 0.14, a); c.fill(); } c.fillStyle = GOLD; c.beginPath(); c.arc(x, y, s * 0.13, 0, TAU); c.fill(); }

  /* ---- the reflecting pools: still dark water holding stars and the castle's domes upside down ---- */
  GAP_EXT.moonpool = { base: '#0A1426',
    paint(c, S, R) { c.fillStyle = '#0A1426'; c.fillRect(0, 0, S, S); for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(226,238,255,${0.2 + R() * 0.55})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.15 ? 1.2 : 0.6, 0, TAU); c.fill(); }
      for (let i = 0; i < 12; i++) { const x = R() * S, y = R() * S, w = 10 + R() * 20; c.strokeStyle = `rgba(169,200,240,${0.06 + R() * 0.1})`; c.lineWidth = 1.2; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.lineTo(x + ox + w, y + oy); c.stroke(); } } },
    back(c, o) { const { pat, pattern, k, W, H, t, wx, wy } = o; pat(pattern('moonpool', k), 0.5, t * 0.8, 0);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2; blitSized(c, glowSprite('#7F9FD8'), W * 0.1 - (wx * 0.03) % W, H * 0.4, W * 1.2, H * 0.5); c.restore(); },
  };

  /* ---- the floor: marble with inlay ---- */
  Object.assign(DECAL_EXT, {
    inlaystar(c, d, s, lw) { c.rotate(Math.round(d.rot * 4) / 4 * Math.PI / 4); c.fillStyle = 'rgba(214,207,194,.75)'; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? s * 0.8 : s * 1.6; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.62); } c.closePath(); c.fill(); c.strokeStyle = 'rgba(207,173,98,.75)'; c.lineWidth = Math.max(1, lw * 0.6); c.stroke(); c.fillStyle = 'rgba(184,64,78,.6)'; ell(c, 0, 0, s * 0.35, s * 0.22); c.fill(); },
    inlayflower(c, d, s) { c.save(); c.scale(1, 0.62); inlayFlower(c, 0, 0, s * 1.1); c.restore(); c.strokeStyle = 'rgba(62,122,90,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, s * 0.3); c.quadraticCurveTo(s * 0.3, s * 0.8, s * 0.1, s * 1.1); c.stroke(); },
    marblevein(c, d, s) { c.rotate(d.rot); c.strokeStyle = 'rgba(150,142,128,.28)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-s * 2.4, 0); c.bezierCurveTo(-s, -s * 0.5, s * 0.4, s * 0.6, s * 2.4, -s * 0.2); c.moveTo(-s * 0.4, s * 0.2); c.quadraticCurveTo(0, s * 0.8, s * 0.6, s * 1.0); c.stroke(); },
  });

  /* ---- the walls: white marble faces with a deep pointed niche, an inlay band, a little flower ---- */
  function marbleWall(c, X, Y, T, H, h, x, lw) { const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, '#F6F2EA'); g.addColorStop(1, '#D8D0C2'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    if (H > T * 0.45) { const cx = X + T * 0.5, by = Y + H * 0.9, w = T * 0.3, ah = H * 0.68; archPath(c, cx, by, w, ah); const ng = c.createLinearGradient(0, by - ah, 0, by); ng.addColorStop(0, '#B8AF9E'); ng.addColorStop(1, '#CFC7B8'); c.fillStyle = ng; c.fill(); c.strokeStyle = 'rgba(160,150,132,.9)'; c.lineWidth = Math.max(1, lw * 0.7); c.stroke();
      c.strokeStyle = 'rgba(207,173,98,.7)'; c.lineWidth = Math.max(1, lw * 0.45); archPath(c, cx, by, w + T * 0.06, ah + T * 0.06); c.stroke();
      if (x % 2 === 0) inlayFlower(c, cx, by - ah * 0.42, T * 0.09); }
    c.fillStyle = 'rgba(207,173,98,.75)'; c.fillRect(X, Y + H * 0.05, T + 0.5, Math.max(1, H * 0.025)); c.fillStyle = 'rgba(30,26,40,.5)'; c.fillRect(X, Y + H * 0.085, T + 0.5, Math.max(1, H * 0.012));
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(X + T - 1, Y, 1, H); }

  /* ---- the props ---- */
  Object.assign(PROP_EXT, { minaret: [1.8, 6.6], chhatri: [2.4, 4.0], tajdome: [3.8, 5.0], pishtaq: [2.6, 4.2], cypress: [1.4, 3.8], fountain: [2.4, 2.2], jali: [2.2, 3.0], moonlantern: [1.2, 2.8] });
  Object.assign(PROPS, {
    /* a slender white minaret: an octagonal foot, a tapering shaft with three balconies, a little domed pavilion on top */
    minaret(c, T, v) { const lw = lw0(T), Hm = T * 4.6; shadowEll(c, T, 0.6);
      c.fillStyle = cyl(c, -T * 0.42, T * 0.42); c.fillRect(-T * 0.42, -T * 0.35, T * 0.84, T * 0.35); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-T * 0.42, -T * 0.35, T * 0.84, T * 0.35);
      c.beginPath(); c.moveTo(-T * 0.3, -T * 0.35); c.lineTo(-T * 0.22, -Hm); c.lineTo(T * 0.22, -Hm); c.lineTo(T * 0.3, -T * 0.35); c.closePath(); c.fillStyle = cyl(c, -T * 0.3, T * 0.3); c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(30,26,40,.35)'; c.lineWidth = Math.max(1, lw * 0.5); for (let i = 1; i < 9; i++) { const y = -T * 0.35 - (Hm - T * 0.35) * i / 9; c.beginPath(); c.moveTo(-T * 0.27 + i * 0.008 * T, y); c.lineTo(T * 0.27 - i * 0.008 * T, y); c.stroke(); }
      for (const u of [0.38, 0.68, 0.98]) { const y = -T * 0.35 - (Hm - T * 0.35) * u, w = T * (0.42 - u * 0.1); ell(c, 0, y, w, w * 0.32); c.fillStyle = MARBLE_D; c.fill(); ink(c, lw * 0.8); ell(c, 0, y - T * 0.04, w * 0.92, w * 0.28); c.fillStyle = '#FFFFFF'; c.fill(); ink(c, lw * 0.6);
        c.strokeStyle = 'rgba(30,26,40,.5)'; c.lineWidth = Math.max(1, lw * 0.5); for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * w * 0.35, y + w * 0.12); c.lineTo(k * w * 0.3, y + w * 0.32); c.stroke(); } }
      const ty = -Hm - T * 0.02; for (const sd of [-1, 1]) { c.strokeStyle = LN; c.lineWidth = T * 0.06 + lw; c.beginPath(); c.moveTo(sd * T * 0.18, ty); c.lineTo(sd * T * 0.18, ty - T * 0.38); c.stroke(); c.strokeStyle = MARBLE; c.lineWidth = T * 0.06; c.stroke(); }
      ell(c, 0, ty - T * 0.4, T * 0.3, T * 0.08); c.fillStyle = MARBLE_D; c.fill(); ink(c, lw * 0.7);
      onion(c, 0, ty - T * 0.42, T * 0.3, T * 0.55, lw);
      if (v % 3 === 0) glowIn(c, 0, ty - T * 0.2, T * 0.45, GOLD_HI, 0.45); },
    /* a domed pavilion on four slim columns with cusped arches */
    chhatri(c, T, v) { const lw = lw0(T), base = -T * 0.3, colH = T * 1.25; shadowEll(c, T, 0.95);
      c.fillStyle = cyl(c, -T * 0.95, T * 0.95); c.fillRect(-T * 0.95, base, T * 1.9, T * 0.3); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-T * 0.95, base, T * 1.9, T * 0.3); c.fillStyle = 'rgba(207,173,98,.8)'; c.fillRect(-T * 0.95, base + T * 0.1, T * 1.9, Math.max(1, T * 0.03));
      c.fillStyle = 'rgba(40,34,52,.55)'; c.fillRect(-T * 0.68, base - colH, T * 1.36, colH);
      for (const k of [-0.68, -0.23, 0.23, 0.68]) { c.fillStyle = cyl(c, k * T - T * 0.07, k * T + T * 0.07); c.fillRect(k * T - T * 0.07, base - colH, T * 0.14, colH); c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.strokeRect(k * T - T * 0.07, base - colH, T * 0.14, colH); }
      c.strokeStyle = 'rgba(207,173,98,.75)'; c.lineWidth = Math.max(1, lw * 0.5); for (const k of [-0.455, 0, 0.455]) { archPath(c, k * T, base, T * 0.16, colH * 0.85); c.stroke(); }
      c.fillStyle = cyl(c, -T * 0.85, T * 0.85); c.fillRect(-T * 0.85, base - colH - T * 0.22, T * 1.7, T * 0.22); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-T * 0.85, base - colH - T * 0.22, T * 1.7, T * 0.22);
      c.fillStyle = 'rgba(30,26,40,.45)'; for (let i = 0; i < 9; i++) c.fillRect(-T * 0.8 + i * T * 0.2, base - colH, T * 0.06, T * 0.06);
      c.fillStyle = INLAY_R; for (const k of [-0.5, 0, 0.5]) { c.beginPath(); c.arc(k * T, base - colH - T * 0.11, T * 0.04, 0, TAU); c.fill(); }
      onion(c, 0, base - colH - T * 0.22, T * 0.62, T * 1.15, lw); },
    /* the great dome on its drum, flanked by two small domed kiosks: a little Moon Castle in itself */
    tajdome(c, T, v) { const lw = lw0(T), base = -T * 0.4, drumH = T * 1.1; c.fillStyle = 'rgba(30,24,40,.3)'; ell(c, 0, T * 0.03, T * 1.7, T * 0.5); c.fill();
      c.fillStyle = cyl(c, -T * 1.6, T * 1.6); c.fillRect(-T * 1.6, base, T * 3.2, T * 0.4); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-T * 1.6, base, T * 3.2, T * 0.4);
      // the drum, arched windows round it
      c.fillStyle = cyl(c, -T * 0.95, T * 0.95); c.fillRect(-T * 0.95, base - drumH, T * 1.9, drumH); c.strokeStyle = LN; c.strokeRect(-T * 0.95, base - drumH, T * 1.9, drumH);
      for (const k of [-0.55, 0, 0.55]) { archPath(c, k * T, base - T * 0.12, T * 0.17, drumH * 0.7); c.fillStyle = k ? '#BDB4A3' : '#AFA694'; c.fill(); c.strokeStyle = 'rgba(207,173,98,.8)'; c.lineWidth = Math.max(1, lw * 0.5); c.stroke(); }
      c.fillStyle = 'rgba(207,173,98,.85)'; c.fillRect(-T * 0.95, base - drumH + T * 0.06, T * 1.9, Math.max(1, T * 0.04));
      for (const sd of [-1, 1]) { const kx = sd * T * 1.3, ky = base; for (const k of [-0.2, 0.2]) { c.fillStyle = MARBLE; c.fillRect(kx + k * T - T * 0.04, ky - T * 0.6, T * 0.08, T * 0.6); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(kx + k * T - T * 0.04, ky - T * 0.6, T * 0.08, T * 0.6); } c.fillStyle = MARBLE_D; c.fillRect(kx - T * 0.3, ky - T * 0.72, T * 0.6, T * 0.12); onion(c, kx, ky - T * 0.72, T * 0.26, T * 0.5, lw * 0.8); }
      onion(c, 0, base - drumH, T * 1.15, T * 2.2, lw * 1.2); glowIn(c, -T * 0.4, base - drumH - T * 1.1, T * 1.0, '#FFFFFF', 0.18); },
    /* a marble gateway: a tall frame with a deep pointed arch, calligraphy bands and corner finials */
    pishtaq(c, T, v) { const lw = lw0(T), w = T * 1.15, h = T * 2.9; shadowEll(c, T, 1.0);
      c.fillStyle = cyl(c, -w, w); c.fillRect(-w, -h, w * 2, h); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-w, -h, w * 2, h);
      c.strokeStyle = 'rgba(30,26,40,.6)'; c.lineWidth = Math.max(1, lw * 0.55); c.strokeRect(-w + T * 0.1, -h + T * 0.1, w * 2 - T * 0.2, h - T * 0.1);
      c.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20; c.lineTo(-w + T * 0.18 + u * (w * 2 - T * 0.36), -h + T * 0.2 + Math.sin(u * 30) * T * 0.03); } c.stroke();
      archPath(c, 0, 0, w * 0.62, h * 0.78); const g = c.createLinearGradient(0, -h * 0.78, 0, 0); g.addColorStop(0, '#8A8272'); g.addColorStop(1, '#B9B09E'); c.fillStyle = g; c.fill(); ink(c, lw);
      archPath(c, 0, 0, w * 0.4, h * 0.55); c.fillStyle = 'rgba(40,34,52,.55)'; c.fill(); c.strokeStyle = 'rgba(207,173,98,.8)'; c.lineWidth = Math.max(1, lw * 0.6); c.stroke();
      for (const sd of [-1, 1]) { inlayFlower(c, sd * w * 0.78, -h * 0.82, T * 0.1); c.fillStyle = MARBLE; c.fillRect(sd * w - T * 0.08, -h - T * 0.35, T * 0.16, T * 0.35); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(sd * w - T * 0.08, -h - T * 0.35, T * 0.16, T * 0.35); onion(c, sd * w, -h - T * 0.35, T * 0.13, T * 0.28, lw * 0.6); } },
    /* a dark cypress of the palace gardens in a marble planter */
    cypress(c, T, v) { const lw = lw0(T), hgt = T * (2.8 + (v % 3) * 0.25); shadowEll(c, T, 0.5);
      c.fillStyle = cyl(c, -T * 0.32, T * 0.32); c.fillRect(-T * 0.32, -T * 0.32, T * 0.64, T * 0.32); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-T * 0.32, -T * 0.32, T * 0.64, T * 0.32);
      c.beginPath(); c.moveTo(0, -hgt); c.bezierCurveTo(T * 0.5, -hgt * 0.6, T * 0.5, -T * 0.6, T * 0.12, -T * 0.32); c.lineTo(-T * 0.12, -T * 0.32); c.bezierCurveTo(-T * 0.5, -T * 0.6, -T * 0.5, -hgt * 0.6, 0, -hgt); c.closePath();
      const g = c.createLinearGradient(-T * 0.45, 0, T * 0.45, 0); g.addColorStop(0, '#4E8A66'); g.addColorStop(0.5, CYP); g.addColorStop(1, '#1A3A2C'); c.fillStyle = g; c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(140,200,160,.35)'; c.lineWidth = Math.max(1, lw * 0.6); for (let i = 1; i < 6; i++) { const y = -T * 0.32 - (hgt - T * 0.32) * i / 6, w = T * 0.3 * Math.sin(i / 6 * Math.PI) + T * 0.05; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(-w * 0.3, y - T * 0.12, w * 0.1, y - T * 0.05); c.stroke(); } },
    /* an octagonal marble fountain: a lotus spout, a soft plume of water */
    fountain(c, T, v) { const lw = lw0(T); shadowEll(c, T, 1.0);
      c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU; c.lineTo(Math.cos(a) * T * 0.95, -T * 0.25 + Math.sin(a) * T * 0.36); } c.closePath(); c.fillStyle = MARBLE_D; c.fill(); ink(c, lw);
      ell(c, 0, -T * 0.3, T * 0.78, T * 0.27); const g = c.createLinearGradient(0, -T * 0.55, 0, 0); g.addColorStop(0, '#2E5A78'); g.addColorStop(1, '#5A9ABE'); c.fillStyle = g; c.fill(); ink(c, lw * 0.7);
      c.strokeStyle = 'rgba(226,238,255,.5)'; c.lineWidth = 1; for (const r of [0.3, 0.55]) { ell(c, 0, -T * 0.3, T * r, T * r * 0.34); c.stroke(); }
      c.fillStyle = MARBLE; c.fillRect(-T * 0.08, -T * 0.85, T * 0.16, T * 0.55); c.strokeStyle = LN; c.lineWidth = lw * 0.7; c.strokeRect(-T * 0.08, -T * 0.85, T * 0.16, T * 0.55);
      for (let i = 0; i < 5; i++) { const a = -Math.PI + (i + 0.5) / 5 * Math.PI; c.save(); c.translate(0, -T * 0.85); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.1, -T * 0.12, 0, -T * 0.24); c.quadraticCurveTo(-T * 0.1, -T * 0.12, 0, 0); c.fillStyle = '#F7E8EE'; c.fill(); ink(c, lw * 0.5); c.restore(); }
      glowIn(c, 0, -T * 1.25, T * 0.55, MOON_HI, 0.55); c.strokeStyle = 'rgba(226,238,255,.65)'; c.lineWidth = Math.max(1, lw * 0.6); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, -T * 0.95); c.quadraticCurveTo(sd * T * 0.25, -T * 1.45, sd * T * 0.5, -T * 0.4); c.stroke(); } },
    /* a marble lattice screen under a cusped arch */
    jali(c, T, v) { const lw = lw0(T), w = T * 0.9, h = T * 2.2; shadowEll(c, T, 0.85);
      archPath(c, 0, 0, w, h); c.fillStyle = cyl(c, -w, w); c.fill(); ink(c, lw);
      c.save(); archPath(c, 0, -T * 0.12, w * 0.8, h * 0.88); c.clip(); c.fillStyle = 'rgba(40,34,52,.7)';
      for (let gy = 0; gy < 12; gy++) for (let gx = -5; gx <= 5; gx++) { const x = gx * T * 0.17 + (gy % 2) * T * 0.085, y = -T * 0.2 - gy * T * 0.17; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.lineTo(x + Math.cos(a) * T * 0.055, y + Math.sin(a) * T * 0.055); } c.closePath(); c.fill(); }
      c.restore(); c.strokeStyle = 'rgba(207,173,98,.8)'; c.lineWidth = Math.max(1, lw * 0.6); archPath(c, 0, -T * 0.12, w * 0.8, h * 0.88); c.stroke(); },
    /* a pierced brass lantern on a marble post, warm light through its holes */
    moonlantern(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.4);
      c.fillStyle = cyl(c, -T * 0.12, T * 0.12); c.fillRect(-T * 0.12, -T * 1.4, T * 0.24, T * 1.4); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-T * 0.12, -T * 1.4, T * 0.24, T * 1.4);
      glowIn(c, 0, -T * 1.8, T * 1.0, GOLD, 0.55);
      c.beginPath(); c.moveTo(-T * 0.25, -T * 1.45); c.lineTo(-T * 0.32, -T * 1.85); c.quadraticCurveTo(0, -T * 2.35, T * 0.32, -T * 1.85); c.lineTo(T * 0.25, -T * 1.45); c.closePath(); c.fillStyle = '#B8863A'; c.fill(); ink(c, lw * 0.8);
      c.fillStyle = GOLD_HI; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-T * 0.15 + (i % 3) * T * 0.15, -T * 1.6 - Math.floor(i / 3) * T * 0.18, T * 0.035, 0, TAU); c.fill(); }
      c.strokeStyle = '#B8863A'; c.lineWidth = Math.max(1.2, lw * 0.8); c.beginPath(); c.moveTo(0, -T * 2.15); c.lineTo(0, -T * 2.45); c.stroke(); },
  });

  /* ---- the castle guard: a marble sentry with a crescent glaive; it sweeps a shown arc ---- */
  Object.assign(MON, { marblesentry: { name: 'Marble sentry', from: 999, hp: 380, spd: 1.15, r: 0.6, dmg: 22, xp: 20, coin: 1.1, color: '#EDE8DE', bio: ['innertide'], tip: 'A guard of the Moon Castle carved in white marble. It raises its crescent glaive, then sweeps the shown arc in front of it: step back out of the arc.', kit: [] } });
  MP.marblesentry = (c, r, ph, o) => { const lw = lwOf(r), up = o.mode === 'block' ? 1 : 0, sw = o.mode === 'dash' ? 1 : 0, bob = Math.sin(ph * TAU) * r * 0.04;
    c.fillStyle = 'rgba(30,24,40,.25)'; ell(c, 0, r * 0.95, r * 0.75, r * 0.22); c.fill();
    // a robe of marble widening to its foot
    c.beginPath(); c.moveTo(-r * 0.7, r * 0.9); c.quadraticCurveTo(-r * 0.6, -r * 0.1, -r * 0.42, -r * 0.45 + bob); c.lineTo(r * 0.42, -r * 0.45 + bob); c.quadraticCurveTo(r * 0.6, -r * 0.1, r * 0.7, r * 0.9); c.closePath(); c.fillStyle = shade(c, o.color, r, -r * 0.35, -r * 0.2, 0.4); c.fill(); stroke(c, lw);
    c.strokeStyle = 'rgba(207,173,98,.8)'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-r * 0.6, r * 0.7); c.lineTo(r * 0.6, r * 0.7); c.moveTo(0, -r * 0.4); c.lineTo(0, r * 0.9); c.stroke(); inlayFlower(c, 0, r * 0.15, r * 0.18);
    // the head: a marble face with two moonlit eyes under a helmet that is an onion dome
    ell(c, 0, -r * 0.72 + bob, r * 0.36, r * 0.34); c.fillStyle = shade(c, '#F6F2EA', r * 0.4, -r * 0.12, -r * 0.85, 0.35); c.fill(); stroke(c, lw);
    for (const sd of [-1, 1]) { c.fillStyle = MOONSTONE; c.beginPath(); c.ellipse(sd * r * 0.13, -r * 0.7 + bob, r * 0.07, r * 0.035, 0, 0, TAU); c.fill(); }
    onion(c, 0, -r * 0.92 + bob, r * 0.38, r * 0.6, lw * 0.8);
    // the glaive: a long haft and a crescent blade; raised overhead in the wind-up, low and forward in the sweep
    c.save(); c.translate(r * 0.5, -r * 0.2); c.rotate(up ? -0.9 : sw ? 1.0 : -0.2);
    c.strokeStyle = LN; c.lineWidth = r * 0.12 + lw; c.beginPath(); c.moveTo(0, r * 0.8); c.lineTo(0, -r * 1.5); c.stroke(); c.strokeStyle = '#B8863A'; c.lineWidth = r * 0.12; c.stroke();
    c.beginPath(); c.arc(r * 0.18, -r * 1.55, r * 0.45, Math.PI * 0.6, Math.PI * 1.6); c.arc(r * 0.32, -r * 1.55, r * 0.34, Math.PI * 1.5, Math.PI * 0.7, true); c.closePath(); c.fillStyle = '#E2EEFF'; c.fill(); stroke(c, lw * 0.9);
    if (up || sw) glowIn(c, r * 0.1, -r * 1.55, r * 0.7, MOON_HI, 0.6);
    c.restore(); };
  Object.assign(EXT, { marblesentry: 3.6 }); Object.assign(NF, { marblesentry: 6 });
  DunAI.mon.marblesentry = (m, A, X) => {
    if (m.swT > 0) { m.swT -= A.dt; m.mode = 'dash'; if (m.swT <= 0) { m.mode = null; m.cd = 2.6 + Math.random() * 1.2; } return; }
    if (m.upT > 0) { m.upT -= A.dt; m.mode = 'block'; if (m.upT <= 0) { m.swT = 0.35; } return; }
    m.mode = null; if (A.d > 1.6) A.steer(A.sp); m.face = A.dx >= 0 ? 1 : -1;
    if (m.cd <= 0 && A.d < 2.8) { m.upT = 0.85; const a = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a, len: 2.8, spread: 1.0, life: 0.85, max: 0.85, src: m, color: MOON_HI, fn: () => { if (X.inCone(m.x, m.y, a, 2.8, 1.0) && !X.me.dodge) X.hurtPet(m.dmg * 1.3, m); X.ring(m.x, m.y, 0.3, 2.8, 0.3, MOON_HI, 0.35); } }); } };

  /* ---- the castle grounds: a long reflecting canal down the middle of the bigger courts, cypresses along it ---- */
  function castleDress(o) { const { rm, i, G, RM, props, R, id, MW, walk, okFeature, first } = o; if (MOON.dressRim) MOON.dressRim(o);
    if (first || rm.w < 12 || rm.h < 10 || R() < 0.25) return;
    const horiz = rm.w >= rm.h, L = Math.floor((horiz ? rm.w : rm.h) * 0.5), cx = Math.floor(rm.x + rm.w / 2), cy = Math.floor(rm.y + rm.h / 2), cells = [];
    for (let k = -Math.floor(L / 2); k < Math.ceil(L / 2); k++) for (let w = 0; w < 2; w++) { const x = horiz ? cx + k : cx - 1 + w, y = horiz ? cy - 1 + w : cy + k; cells.push(id(x, y)); }
    if (!cells.every(k => RM[k] === i && G[k] === T_FLOOR && !props.has(k) && okFeature(k % MW, (k / MW) | 0, i))) return;
    const all = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i) all.push(k); }
    cells.forEach(k => { G[k] = T_GAP; });
    const open = all.filter(k => walk(k)); const seen = new Set([open[0]]), q = [open[0]]; for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } }
    if (seen.size < open.length) { cells.forEach(k => { G[k] = T_FLOOR; }); return; }
    // cypresses in a row beside the canal, a fountain at its head
    for (let k = -Math.floor(L / 2); k < Math.ceil(L / 2); k += 3) for (const sd of [-2, 2]) { const x = horiz ? cx + k : cx - 1 + (sd > 0 ? 3 : -2), y = horiz ? cy - 1 + (sd > 0 ? 3 : -2) : cy + k, kk = id(x, y);
      if (RM[kk] === i && G[kk] === T_FLOOR && !props.has(kk) && okFeature(x, y, i) && R() < 0.7) { G[kk] = T_SOLID; let ok = true; { const op = all.filter(z => walk(z)), s2 = new Set([op[0]]), q2 = [op[0]]; for (let h = 0; h < q2.length; h++) for (const d of [1, -1, MW, -MW]) { const z = q2[h] + d; if (!s2.has(z) && RM[z] === i && walk(z)) { s2.add(z); q2.push(z); } } ok = s2.size >= op.length; }
        if (ok) props.set(kk, 'cypress'); else G[kk] = T_FLOOR; } } }

  /* ---- the land itself ---- */
  Object.assign(BIOMES.innertide, { name: 'The Moon Castle', tile: 'keep', out: true, dark: 0.2, bg: '#0A1426', gap: 'moonpool', accent: MOON_HI, light: '#FFFFFF', bridgeCol: '#D6CFC2', deco: GOLD,
    floor: ['#EEEAE2', '#E8E3DA', '#F2EEE7'], grout: '#C9C2B4', hi: '#FFFFFF', top: '#ECE7DE', face: '#E6E0D4', faceD: '#C2BAAA', cliff: '#9C9484', grade: 'rgba(200,215,255,.05)',
    props: ['chhatri', 'cypress', 'fountain', 'minaret', 'jali', 'moonlantern', 'cypress', 'pishtaq', 'chhatri', 'tajdome'], fog: '#0A1426', darkRGB: '10,20,38', wallFn: marbleWall, dress: castleDress });
  DARK_COL.innertide = '10,20,38';
  if (typeof DECALS !== 'undefined') DECALS.innertide = [['inlaystar', 0.05], ['inlayflower', 0.05], ['marblevein', 0.07]];
})();
