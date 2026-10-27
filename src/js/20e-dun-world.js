/* ---------- Dungeon world art: props (trees, pillars, crystals...), breakables, shrines, decals,
   cached ground chunks with cliffs, bridges and 2.5D walls, and the animated backdrops seen through gaps ---------- */
const DunWorld = (() => {
  const { LN, mk, rgba, shade, vgrad, spec, stroke, th } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));

  /* ---------- props: origin at the feet (tile centre, near its bottom edge), drawn upward ---------- */
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(0,0,0,${a || 0.28})`; c.beginPath(); c.ellipse(0, 0, T * w, T * w * 0.32, 0, 0, 6.283); c.fill(); };
  function column(c, T, o) {
    const lw = lw0(T), w = T * 0.34, h = T * o.h, top = o.top, side = o.side;
    shadowEll(c, T, 0.5);
    c.beginPath(); GFX.rr(c, -T * 0.44, -T * 0.22, T * 0.88, T * 0.26, T * 0.06); c.fillStyle = vgrad(c, -T * 0.22, T * 0.04, top, side); c.fill(); stroke(c, lw);
    const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, shadeC(top, 0.2)); g.addColorStop(0.35, top); g.addColorStop(1, shadeC(side, -0.3));
    c.beginPath(); c.rect(-w, -h, w * 2, h - T * 0.2); c.fillStyle = g; c.fill(); stroke(c, lw);
    if (o.flutes) { c.strokeStyle = rgba(LN, 0.25); c.lineWidth = lw * 0.6; [-0.5, 0, 0.5].forEach(f => { c.beginPath(); c.moveTo(f * w, -h + T * 0.12); c.lineTo(f * w, -T * 0.26); c.stroke(); }); }
    if (o.broken) {
      c.beginPath(); c.moveTo(-w, -h); c.lineTo(-w * 0.4, -h - T * 0.2); c.lineTo(0, -h - T * 0.05); c.lineTo(w * 0.5, -h - T * 0.28); c.lineTo(w, -h - T * 0.06); c.lineTo(w, -h + 1); c.lineTo(-w, -h + 1); c.closePath(); c.fillStyle = top; c.fill(); stroke(c, lw);
      c.fillStyle = side; [[-0.55, 0.05, 0.13], [0.6, 0.0, 0.1]].forEach(([x, y, s]) => { c.beginPath(); c.arc(x * T, y * T, s * T, 0, 6.283); c.fill(); stroke(c, lw * 0.7); });
    } else {
      c.beginPath(); GFX.rr(c, -T * 0.46, -h - T * 0.2, T * 0.92, T * 0.24, T * 0.06); c.fillStyle = vgrad(c, -h - T * 0.2, -h + T * 0.04, o.cap || shadeC(top, 0.15), side); c.fill(); stroke(c, lw);
    }
    spec(c, -w * 0.5, -h * 0.6, w * 0.14, h * 0.25, 0.18);
  }
  function tree(c, T, v, leaf, dark, trunk, o) {
    const lw = lw0(T);
    shadowEll(c, T, 0.62, 0.3);
    c.beginPath(); c.moveTo(-T * 0.16, 0); c.quadraticCurveTo(-T * 0.08, -T * 0.6, -T * 0.12, -T * 1.0); c.lineTo(T * 0.12, -T * 1.0); c.quadraticCurveTo(T * 0.06, -T * 0.6, T * 0.18, 0); c.closePath(); c.fillStyle = vgrad(c, -T, 0, shadeC(trunk, 0.15), shadeC(trunk, -0.25)); c.fill(); stroke(c, lw);
    if (o && o.roots) [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * T * 0.1, -T * 0.25); c.quadraticCurveTo(s * T * 0.4, -T * 0.2, s * T * 0.42, T * 0.02); c.lineWidth = lw * 2.2; c.strokeStyle = LN; c.stroke(); c.lineWidth = lw; c.strokeStyle = trunk; c.stroke(); });
    const blobs = [[0, -1.45, 0.62], [-0.42, -1.12, 0.45], [0.42, -1.15, 0.46], [0.1, -1.88, 0.42]];
    blobs.forEach(([x, y, r]) => { c.beginPath(); c.arc(x * T, y * T, r * T, 0, 6.283); c.fillStyle = dark; c.fill(); stroke(c, lw); });
    blobs.forEach(([x, y, r]) => { c.beginPath(); c.arc(x * T, y * T, r * T - lw * 0.5, 0, 6.283); c.fillStyle = shade(c, leaf, r * T, x * T, y * T, 0.35); c.fill(); });
    c.fillStyle = rgba('#FFFFFF', 0.18); blobs.forEach(([x, y, r]) => { c.beginPath(); c.arc(x * T - r * T * 0.3, y * T - r * T * 0.35, r * T * 0.35, 0, 6.283); c.fill(); });
    if (o && o.moss) { c.strokeStyle = '#7FA35E'; c.lineWidth = lw * 0.9; [-0.4, 0.05, 0.45].forEach((x, i) => { c.beginPath(); c.moveTo(x * T, -T * 0.95); c.quadraticCurveTo(x * T + T * 0.05, -T * (0.7 - i * 0.05), x * T - T * 0.02, -T * (0.55 + (i % 2) * 0.1)); c.stroke(); }); }
    if (o && o.berries) { c.fillStyle = o.berries; [[-0.3, -1.2], [0.25, -1.5], [0.4, -1.05], [-0.05, -1.85]].forEach(([x, y]) => { c.beginPath(); c.arc(x * T, y * T, T * 0.06, 0, 6.283); c.fill(); }); }
  }
  function pine(c, T, v, snow) {
    const lw = lw0(T);
    shadowEll(c, T, 0.5, 0.3);
    c.beginPath(); c.rect(-T * 0.09, -T * 0.45, T * 0.18, T * 0.45); c.fillStyle = '#7A5230'; c.fill(); stroke(c, lw);
    const layers = [[-0.35, 0.62], [-0.85, 0.52], [-1.3, 0.42], [-1.72, 0.3]];
    layers.forEach(([y, w], i) => {
      c.beginPath(); c.moveTo(-w * T, y * T); c.lineTo(0, (y - 0.62) * T); c.lineTo(w * T, y * T); c.quadraticCurveTo(0, (y + 0.1) * T, -w * T, y * T); c.closePath();
      const g = c.createLinearGradient(-w * T, 0, w * T, 0); g.addColorStop(0, '#5FA552'); g.addColorStop(0.5, '#3E8A44'); g.addColorStop(1, '#2C6636'); c.fillStyle = g; c.fill(); stroke(c, lw);
      if (snow) { c.beginPath(); c.moveTo(-w * T * 0.45, (y - 0.32) * T); c.lineTo(0, (y - 0.62) * T); c.lineTo(w * T * 0.45, (y - 0.32) * T); c.quadraticCurveTo(0, (y - 0.22) * T, -w * T * 0.45, (y - 0.32) * T); c.fillStyle = '#F4FAFF'; c.fill(); }
    });
  }
  function crystalCluster(c, T, v) {
    const lw = lw0(T), cols = [['#7FD3F2', '#2F80B7'], ['#B39CFF', '#5B2A9E'], ['#FF9BD2', '#B03E7A']][v % 3];
    shadowEll(c, T, 0.45, 0.25);
    [[-0.28, 0.75, -0.35, 0.15], [0.25, 0.85, 0.3, 0.16], [0, 1.35, 0.05, 0.2], [0.42, 0.5, 0.6, 0.11]].forEach(([x, h, a, w]) => {
      c.save(); c.translate(x * T, 0); c.rotate(a * 0.5);
      c.beginPath(); c.moveTo(-w * T, 0); c.lineTo(-w * T, -h * T * 0.75); c.lineTo(0, -h * T); c.lineTo(w * T, -h * T * 0.75); c.lineTo(w * T, 0); c.closePath();
      const g = c.createLinearGradient(-w * T, 0, w * T, 0); g.addColorStop(0, shadeC(cols[0], 0.45)); g.addColorStop(0.5, cols[0]); g.addColorStop(1, cols[1]); c.fillStyle = g; c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-w * T * 0.3, -T * 0.08); c.lineTo(-w * T * 0.3, -h * T * 0.7); c.stroke();
      c.restore();
    });
  }
  function rockShape(c, T, w, h, col, moss) {
    const lw = lw0(T);
    shadowEll(c, T, w * 0.9, 0.3);
    c.beginPath(); c.moveTo(-w * T, 0); c.quadraticCurveTo(-w * T * 1.05, -h * T * 0.8, -w * T * 0.3, -h * T); c.quadraticCurveTo(w * T * 0.5, -h * T * 1.08, w * T, -h * T * 0.35); c.quadraticCurveTo(w * T * 1.05, 0, w * T * 0.6, T * 0.04); c.closePath();
    c.fillStyle = shade(c, col, Math.max(w, h) * T, 0, -h * T * 0.5, 0.35); c.fill(); stroke(c, lw);
    c.strokeStyle = rgba(LN, 0.3); c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-w * T * 0.2, -h * T * 0.9); c.lineTo(0, -h * T * 0.5); c.lineTo(-w * T * 0.1, -h * T * 0.2); c.stroke();
    if (moss) { c.beginPath(); c.moveTo(-w * T * 0.55, -h * T * 0.8); c.quadraticCurveTo(-w * T * 0.1, -h * T * 1.12, w * T * 0.45, -h * T * 0.88); c.quadraticCurveTo(0, -h * T * 0.75, -w * T * 0.55, -h * T * 0.8); c.fillStyle = moss; c.fill(); }
    spec(c, -w * T * 0.45, -h * T * 0.7, w * T * 0.18, h * T * 0.1, 0.3);
  }
  const PROPS = {
    pillar(c, T, v, B) { column(c, T, { h: 1.55, top: B.top, side: B.face, flutes: true }); },
    brokenpillar(c, T, v, B) { column(c, T, { h: 0.85 + v * 0.1, top: B.top, side: B.face, broken: true, flutes: true }); },
    marble(c, T, v, B) { column(c, T, { h: 1.6, top: '#FFFFFF', side: '#D8DEF0', cap: '#F2C94C', flutes: true }); c.fillStyle = '#F2C94C'; c.beginPath(); c.rect(-T * 0.36, -T * 1.62, T * 0.72, T * 0.06); c.fill(); },
    barrel(c, T) { shadowEll(c, T, 0.4); c.beginPath(); c.ellipse(0, -T * 0.42, T * 0.34, T * 0.44, 0, 0, 6.283); c.fillStyle = shade(c, '#A8743F', T * 0.45, 0, -T * 0.45, 0.3); c.fill(); stroke(c, lw0(T)); c.strokeStyle = '#5E5A6A'; c.lineWidth = T * 0.06; [-0.68, -0.18].forEach(y => { c.beginPath(); c.moveTo(-T * 0.32, y * T); c.quadraticCurveTo(0, y * T + T * 0.06, T * 0.32, y * T); c.stroke(); }); },
    statue(c, T, v, B) {
      const gold = B === BIOMES.heaven, col = gold ? '#F2C94C' : '#8E8AA0';
      shadowEll(c, T, 0.5);
      c.beginPath(); c.rect(-T * 0.4, -T * 0.42, T * 0.8, T * 0.44); c.fillStyle = vgrad(c, -T * 0.42, 0, gold ? '#FFFFFF' : B.top, gold ? '#D8DEF0' : B.face); c.fill(); stroke(c, lw0(T));
      GFX.gloomy(c, 0, -T * 0.9, T * 0.4, { color: col, t: 0, crown: gold });
      if (gold) { c.beginPath(); c.ellipse(0, -T * 1.45, T * 0.22, T * 0.07, 0, 0, 6.283); c.lineWidth = T * 0.05; c.strokeStyle = '#FFE37A'; c.stroke(); }
    },
    candles(c, T) {
      const lw = lw0(T); shadowEll(c, T, 0.3);
      c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -T * 0.8); c.moveTo(-T * 0.3, -T * 0.75); c.quadraticCurveTo(0, -T * 0.5, T * 0.3, -T * 0.75); c.stroke();
      c.strokeStyle = '#C9A24A'; c.lineWidth = lw; c.stroke();
      [-0.3, 0, 0.3].forEach((x, i) => { c.beginPath(); c.rect(x * T - T * 0.05, -T * (0.98 + (i === 1 ? 0.1 : 0)), T * 0.1, T * 0.22); c.fillStyle = '#F4EEE0'; c.fill(); stroke(c, lw * 0.6); });
    },
    mangrove(c, T, v) { tree(c, T, v, '#4E8A45', '#2F5A2E', '#6B5236', { roots: true, moss: true }); },
    reeds(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.35, 0.2); [-0.25, -0.08, 0.1, 0.26].forEach((x, i) => { c.strokeStyle = LN; c.lineWidth = lw * 1.8; c.beginPath(); c.moveTo(x * T, 0); c.quadraticCurveTo(x * T + T * 0.05, -T * 0.5, x * T + (i - 1.5) * T * 0.06, -T * (0.95 + (i % 2) * 0.2)); c.stroke(); c.strokeStyle = '#7FA35E'; c.lineWidth = lw * 0.8; c.stroke(); if (i % 2 === 0) { c.beginPath(); c.ellipse(x * T + (i - 1.5) * T * 0.05, -T * (0.85 + (i % 2) * 0.2), T * 0.06, T * 0.16, 0, 0, 6.283); c.fillStyle = '#8C5A2B'; c.fill(); stroke(c, lw * 0.6); } }); },
    stump(c, T) { const lw = lw0(T); shadowEll(c, T, 0.42); c.beginPath(); c.moveTo(-T * 0.36, 0); c.lineTo(-T * 0.32, -T * 0.42); c.lineTo(T * 0.32, -T * 0.42); c.lineTo(T * 0.36, 0); c.closePath(); c.fillStyle = vgrad(c, -T * 0.42, 0, '#8A6A45', '#5E4630'); c.fill(); stroke(c, lw); c.beginPath(); c.ellipse(0, -T * 0.42, T * 0.32, T * 0.12, 0, 0, 6.283); c.fillStyle = '#D9B98A'; c.fill(); stroke(c, lw); c.strokeStyle = '#A8865C'; c.lineWidth = lw * 0.5; c.beginPath(); c.ellipse(0, -T * 0.42, T * 0.18, T * 0.06, 0, 0, 6.283); c.stroke(); [[0.28, -0.2, '#FF6F59'], [0.38, -0.08, '#FFE37A']].forEach(([x, y, cc]) => { c.beginPath(); c.arc(x * T, y * T, T * 0.08, Math.PI, 0); c.fillStyle = cc; c.fill(); stroke(c, lw * 0.6); }); },
    shroom(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.42); c.beginPath(); c.moveTo(-T * 0.12, 0); c.quadraticCurveTo(-T * 0.16, -T * 0.6, -T * 0.08, -T * 0.85); c.lineTo(T * 0.08, -T * 0.85); c.quadraticCurveTo(T * 0.16, -T * 0.6, T * 0.12, 0); c.closePath(); c.fillStyle = '#E8F4F0'; c.fill(); stroke(c, lw); c.beginPath(); c.moveTo(-T * 0.55, -T * 0.78); c.bezierCurveTo(-T * 0.55, -T * 1.45, T * 0.55, -T * 1.45, T * 0.55, -T * 0.78); c.quadraticCurveTo(0, -T * 0.62, -T * 0.55, -T * 0.78); c.closePath(); c.fillStyle = shade(c, '#5FC9E8', T * 0.6, 0, -T * 1.05, 0.4); c.fill(); stroke(c, lw); c.fillStyle = '#E8FBFF'; [[-0.25, -1.1], [0.15, -1.25], [0.32, -0.95]].forEach(([x, y]) => { c.beginPath(); c.arc(x * T, y * T, T * 0.07, 0, 6.283); c.fill(); }); },
    crystal(c, T, v) { crystalCluster(c, T, v); },
    stalag(c, T) { const lw = lw0(T); shadowEll(c, T, 0.4); c.beginPath(); c.moveTo(-T * 0.36, 0); c.quadraticCurveTo(-T * 0.2, -T * 0.6, -T * 0.04, -T * 1.25); c.quadraticCurveTo(T * 0.15, -T * 0.6, T * 0.38, 0); c.closePath(); c.fillStyle = shade(c, '#6A6F9A', T * 0.6, 0, -T * 0.5, 0.35); c.fill(); stroke(c, lw); c.strokeStyle = rgba(LN, 0.3); c.lineWidth = lw * 0.6; [-0.35, -0.65].forEach(y => { c.beginPath(); c.moveTo(-T * 0.2 * (1 + y), y * T); c.lineTo(T * 0.2 * (1 + y), y * T + T * 0.04); c.stroke(); }); },
    rock(c, T, v) { rockShape(c, T, 0.4, 0.55, '#7A7590', null); },
    pine(c, T, v) { pine(c, T, v, false); },
    boulder(c, T, v) { rockShape(c, T, 0.46, 0.72, '#9A8F80', '#6DAA4C'); },
    bush(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.48); [[-0.22, -0.35, 0.3], [0.22, -0.38, 0.3], [0, -0.58, 0.32]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x * T, y * T, r * T, 0, 6.283); c.fillStyle = shade(c, '#4FA552', r * T, x * T, y * T, 0.35); c.fill(); stroke(c, lw); }); c.fillStyle = '#FF5C8A'; [[-0.25, -0.4], [0.18, -0.6], [0.3, -0.32]].forEach(([x, y]) => { c.beginPath(); c.arc(x * T, y * T, T * 0.055, 0, 6.283); c.fill(); }); },
    iceblock(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.48, 0.2); c.beginPath(); c.moveTo(-T * 0.42, 0); c.lineTo(-T * 0.42, -T * 0.72); c.lineTo(-T * 0.2, -T * 0.92); c.lineTo(T * 0.42, -T * 0.92); c.lineTo(T * 0.42, -T * 0.2); c.lineTo(T * 0.2, 0); c.closePath(); c.globalAlpha = 0.9; c.fillStyle = shade(c, '#BFE6FF', T * 0.6, 0, -T * 0.5, 0.45); c.fill(); c.globalAlpha = 1; stroke(c, lw); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-T * 0.28, -T * 0.15); c.lineTo(-T * 0.28, -T * 0.6); c.lineTo(-T * 0.12, -T * 0.75); c.stroke(); c.strokeStyle = 'rgba(80,130,190,.5)'; c.beginPath(); c.moveTo(T * 0.05, -T * 0.5); c.lineTo(T * 0.2, -T * 0.35); c.lineTo(T * 0.12, -T * 0.2); c.stroke(); },
    icespike(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.4, 0.2); [[-0.2, 0.9, -0.25], [0.15, 1.3, 0.1], [0.35, 0.7, 0.4]].forEach(([x, h, a]) => { c.save(); c.translate(x * T, 0); c.rotate(a * 0.4); c.beginPath(); c.moveTo(-T * 0.13, 0); c.lineTo(0, -h * T); c.lineTo(T * 0.13, 0); c.closePath(); c.fillStyle = vgrad(c, -h * T, 0, '#FFFFFF', '#8FC8F0'); c.fill(); stroke(c, lw); c.restore(); }); },
    snowman(c, T) { const lw = lw0(T); shadowEll(c, T, 0.42); c.beginPath(); c.arc(0, -T * 0.32, T * 0.34, 0, 6.283); c.fillStyle = shade(c, '#FFFFFF', T * 0.34, 0, -T * 0.32, 0.12); c.fill(); stroke(c, lw); c.beginPath(); c.arc(0, -T * 0.86, T * 0.25, 0, 6.283); c.fillStyle = shade(c, '#FFFFFF', T * 0.25, 0, -T * 0.86, 0.12); c.fill(); stroke(c, lw); c.strokeStyle = '#7A5230'; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(-T * 0.3, -T * 0.42); c.lineTo(-T * 0.6, -T * 0.68); c.moveTo(T * 0.3, -T * 0.42); c.lineTo(T * 0.58, -T * 0.55); c.lineTo(T * 0.7, -T * 0.72); c.stroke(); c.fillStyle = '#E0344F'; c.beginPath(); c.rect(-T * 0.22, -T * 0.66, T * 0.44, T * 0.09); c.fill(); c.fillStyle = '#FF9F43'; c.beginPath(); c.moveTo(0, -T * 0.86); c.lineTo(T * 0.25, -T * 0.82); c.lineTo(0, -T * 0.78); c.fill(); DunArt.face(c, -T * 0.02, -T * 0.92, T * 0.3, { lid: '#E8EEF8', noMouth: true, sclera: '#2B2433', pupil: '#2B2433' }); c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-T * 0.08, -T * 0.74); c.quadraticCurveTo(T * 0.02, -T * 0.7, T * 0.1, -T * 0.76); c.stroke(); },
    obsidian(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.42); c.beginPath(); c.moveTo(-T * 0.38, 0); c.lineTo(-T * 0.25, -T * 0.7); c.lineTo(-T * 0.05, -T * 1.35); c.lineTo(T * 0.15, -T * 0.85); c.lineTo(T * 0.3, -T * 1.05); c.lineTo(T * 0.4, 0); c.closePath(); c.fillStyle = shade(c, '#3A2A3A', T * 0.7, 0, -T * 0.6, 0.35); c.fill(); stroke(c, lw); c.strokeStyle = '#FF6F3C'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-T * 0.15, -T * 0.1); c.lineTo(-T * 0.05, -T * 0.5); c.lineTo(-T * 0.12, -T * 0.8); c.moveTo(T * 0.2, -T * 0.15); c.lineTo(T * 0.15, -T * 0.55); c.stroke(); spec(c, -T * 0.18, -T * 0.7, T * 0.04, T * 0.18, 0.4); },
    bones(c, T) { const lw = lw0(T); shadowEll(c, T, 0.45); [[-0.2, -0.12, 0.5], [0.15, -0.08, -0.4]].forEach(([x, y, a]) => { c.save(); c.translate(x * T, y * T); c.rotate(a); c.beginPath(); c.rect(-T * 0.28, -T * 0.05, T * 0.56, T * 0.1); c.fillStyle = '#EDE6D6'; c.fill(); stroke(c, lw * 0.7); [-1, 1].forEach(s => { c.beginPath(); c.arc(s * T * 0.28, -T * 0.05, T * 0.07, 0, 6.283); c.arc(s * T * 0.28, T * 0.05, T * 0.07, 0, 6.283); c.fill(); }); c.restore(); }); c.beginPath(); c.arc(T * 0.05, -T * 0.42, T * 0.26, 0, 6.283); c.fillStyle = shade(c, '#F4EEE0', T * 0.26, T * 0.05, -T * 0.42, 0.2); c.fill(); stroke(c, lw); c.fillStyle = LN; c.beginPath(); c.arc(-T * 0.04, -T * 0.44, T * 0.07, 0, 6.283); c.arc(T * 0.15, -T * 0.44, T * 0.07, 0, 6.283); c.fill(); },
    brazier(c, T) { const lw = lw0(T); shadowEll(c, T, 0.36); c.strokeStyle = LN; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(-T * 0.25, 0); c.lineTo(0, -T * 0.55); c.lineTo(T * 0.25, 0); c.stroke(); c.strokeStyle = '#6B6F8F'; c.lineWidth = lw; c.stroke(); c.beginPath(); c.moveTo(-T * 0.4, -T * 0.72); c.quadraticCurveTo(0, -T * 0.35, T * 0.4, -T * 0.72); c.closePath(); c.fillStyle = shade(c, '#6B6F8F', T * 0.4, 0, -T * 0.6, 0.3); c.fill(); stroke(c, lw); },
    cloudbush(c, T) { const lw = lw0(T); shadowEll(c, T, 0.48, 0.15); [[-0.25, -0.3, 0.28], [0.25, -0.32, 0.28], [0, -0.55, 0.32], [-0.05, -0.25, 0.3]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x * T, y * T, r * T, 0, 6.283); c.fillStyle = shade(c, '#FFFFFF', r * T, x * T, y * T, 0.08); c.fill(); stroke(c, lw * 0.8); }); c.fillStyle = '#F2C94C'; [[-0.22, -0.45], [0.2, -0.6], [0.28, -0.3]].forEach(([x, y]) => GFX.star(c, x * T, y * T, T * 0.07, '#FFE37A', 0)); },
    /* breakables and features */
    pot(c, T, v, B) { const lw = lw0(T), col = B.out ? '#C98A5E' : '#B7836B'; shadowEll(c, T, 0.3); c.beginPath(); c.moveTo(-T * 0.14, -T * 0.52); c.quadraticCurveTo(-T * 0.38, -T * 0.4, -T * 0.28, -T * 0.08); c.quadraticCurveTo(0, T * 0.04, T * 0.28, -T * 0.08); c.quadraticCurveTo(T * 0.38, -T * 0.4, T * 0.14, -T * 0.52); c.closePath(); c.fillStyle = shade(c, col, T * 0.35, 0, -T * 0.3, 0.3); c.fill(); stroke(c, lw); c.beginPath(); c.rect(-T * 0.16, -T * 0.6, T * 0.32, T * 0.1); c.fillStyle = shadeC(col, -0.2); c.fill(); stroke(c, lw * 0.8); c.strokeStyle = rgba(LN, 0.4); c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-T * 0.25, -T * 0.3); c.quadraticCurveTo(0, -T * 0.22, T * 0.25, -T * 0.3); c.stroke(); },
    crate(c, T) { const lw = lw0(T); shadowEll(c, T, 0.36); c.beginPath(); c.rect(-T * 0.3, -T * 0.58, T * 0.6, T * 0.58); c.fillStyle = vgrad(c, -T * 0.58, 0, '#D2A266', '#A8743F'); c.fill(); stroke(c, lw); c.strokeStyle = '#7A5230'; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(-T * 0.3, -T * 0.58); c.lineTo(T * 0.3, 0); c.moveTo(-T * 0.3, -T * 0.29); c.lineTo(T * 0.3, -T * 0.29); c.stroke(); },
    xbarrel(c, T) { const lw = lw0(T); shadowEll(c, T, 0.34); c.beginPath(); c.ellipse(0, -T * 0.36, T * 0.28, T * 0.38, 0, 0, 6.283); c.fillStyle = shade(c, '#D9483B', T * 0.38, 0, -T * 0.4, 0.3); c.fill(); stroke(c, lw); c.strokeStyle = '#3A3450'; c.lineWidth = T * 0.05; [-0.6, -0.14].forEach(y => { c.beginPath(); c.moveTo(-T * 0.27, y * T); c.quadraticCurveTo(0, y * T + T * 0.05, T * 0.27, y * T); c.stroke(); }); c.fillStyle = '#FFE37A'; c.beginPath(); c.moveTo(0, -T * 0.5); c.lineTo(T * 0.1, -T * 0.32); c.lineTo(-T * 0.1, -T * 0.32); c.closePath(); c.fill(); c.fillStyle = LN; c.fillRect(-T * 0.012, -T * 0.45, T * 0.024, T * 0.07); },
    chest(c, T) { const lw = lw0(T); shadowEll(c, T, 0.42); c.beginPath(); GFX.rr(c, -T * 0.36, -T * 0.44, T * 0.72, T * 0.44, T * 0.05); c.fillStyle = vgrad(c, -T * 0.44, 0, '#D9A066', '#A06B3A'); c.fill(); stroke(c, lw); c.beginPath(); c.moveTo(-T * 0.38, -T * 0.42); c.quadraticCurveTo(0, -T * 0.78, T * 0.38, -T * 0.42); c.closePath(); c.fillStyle = vgrad(c, -T * 0.72, -T * 0.42, '#E8B47A', '#A8743F'); c.fill(); stroke(c, lw); c.strokeStyle = '#F2C94C'; c.lineWidth = T * 0.06; c.beginPath(); c.moveTo(-T * 0.22, -T * 0.66); c.lineTo(-T * 0.22, 0); c.moveTo(T * 0.22, -T * 0.66); c.lineTo(T * 0.22, 0); c.stroke(); c.fillStyle = '#FFD447'; c.beginPath(); c.rect(-T * 0.07, -T * 0.5, T * 0.14, T * 0.16); c.fill(); stroke(c, lw * 0.7); },
    shrine(c, T, v, B, col) { const lw = lw0(T); shadowEll(c, T, 0.5); c.beginPath(); c.rect(-T * 0.45, -T * 0.25, T * 0.9, T * 0.25); c.fillStyle = vgrad(c, -T * 0.25, 0, '#B9B2CC', '#7A7590'); c.fill(); stroke(c, lw); c.beginPath(); c.moveTo(-T * 0.28, -T * 0.25); c.lineTo(-T * 0.2, -T * 1.4); c.lineTo(0, -T * 1.62); c.lineTo(T * 0.2, -T * 1.4); c.lineTo(T * 0.28, -T * 0.25); c.closePath(); c.fillStyle = vgrad(c, -T * 1.6, -T * 0.25, '#D8D2E8', '#8E88A6'); c.fill(); stroke(c, lw); c.strokeStyle = col; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(0, -T * 0.4); c.lineTo(0, -T * 0.75); c.moveTo(-T * 0.1, -T * 0.55); c.lineTo(T * 0.1, -T * 0.55); c.stroke(); },
    spent(c, T) { PROPS.shrine(c, T, 0, BIOMES.halls, '#6B6491'); },
  };
  /* ---- props of the eight new lands ---- */
  Object.assign(PROPS, {
    cactus(c, T, v) {
      const lw = lw0(T); shadowEll(c, T, 0.4, 0.25);
      const arm = (x, y, h, s) => { c.beginPath(); GFX.rr(c, x - T * 0.1, y - h, T * 0.2, h, T * 0.1); c.fillStyle = vgrad(c, y - h, y, '#7FC06A', '#4E8A45'); c.fill(); stroke(c, lw); c.beginPath(); GFX.rr(c, s < 0 ? x - T * 0.1 - T * 0.25 : x - T * 0.1, y - T * 0.1, T * 0.35, T * 0.2, T * 0.1); c.fill(); stroke(c, lw); };
      c.beginPath(); GFX.rr(c, -T * 0.17, -T * 1.35, T * 0.34, T * 1.35, T * 0.17); c.fillStyle = vgrad(c, -T * 1.35, 0, '#8FD06A', '#4E8A45'); c.fill(); stroke(c, lw);
      if (v % 2) arm(-T * 0.32, -T * 0.55, T * 0.5, -1); if (v !== 1) arm(T * 0.32, -T * 0.7, T * 0.42, 1);
      c.strokeStyle = 'rgba(30,60,30,.35)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-T * 0.06, -T * 1.2); c.lineTo(-T * 0.06, -T * 0.15); c.moveTo(T * 0.07, -T * 1.1); c.lineTo(T * 0.07, -T * 0.1); c.stroke();
      c.strokeStyle = '#FFF8E0'; c.lineWidth = Math.max(1, lw * 0.5); for (let i = 0; i < 6; i++) { const y = -T * (0.25 + i * 0.18); c.beginPath(); c.moveTo(-T * 0.17, y); c.lineTo(-T * 0.26, y - T * 0.05); c.moveTo(T * 0.17, y + T * 0.08); c.lineTo(T * 0.26, y + T * 0.03); c.stroke(); }
      if (v === 3) { c.fillStyle = '#FF6F9C'; c.beginPath(); c.arc(0, -T * 1.38, T * 0.12, 0, 6.283); c.fill(); stroke(c, lw * 0.6); c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(0, -T * 1.38, T * 0.05, 0, 6.283); c.fill(); }
    },
    dunerock(c, T) { rockShape(c, T, 0.46, 0.5, '#D9B36B', null); c.strokeStyle = 'rgba(120,80,40,.3)'; c.lineWidth = lw0(T) * 0.6; c.beginPath(); c.moveTo(-T * 0.3, -T * 0.25); c.quadraticCurveTo(0, -T * 0.32, T * 0.3, -T * 0.2); c.stroke(); },
    palm(c, T, v) {
      const lw = lw0(T); shadowEll(c, T, 0.55, 0.28);
      c.beginPath(); c.moveTo(-T * 0.12, 0); c.quadraticCurveTo(-T * 0.05, -T * 0.9, T * 0.12, -T * 1.6); c.lineTo(T * 0.26, -T * 1.55); c.quadraticCurveTo(T * 0.12, -T * 0.9, T * 0.14, 0); c.closePath(); c.fillStyle = vgrad(c, -T * 1.6, 0, '#C9A27A', '#8A6A45'); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(80,50,20,.35)'; c.lineWidth = lw * 0.6; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(-T * 0.1 + i * T * 0.02, -T * i * 0.26); c.lineTo(T * 0.12 + i * T * 0.015, -T * i * 0.26 - T * 0.05); c.stroke(); }
      for (let i = 0; i < 6; i++) { const a = -2.9 + i * 0.5 + (v % 2) * 0.2; c.save(); c.translate(T * 0.19, -T * 1.58); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.5, -T * 0.25, T * 0.95, T * 0.05); c.quadraticCurveTo(T * 0.5, T * 0.05, 0, 0); c.closePath(); c.fillStyle = i % 2 ? '#5FA552' : '#3E8A44'; c.fill(); stroke(c, lw * 0.8); c.restore(); }
      c.fillStyle = '#8A5A2B'; [[0.08, -1.5], [0.3, -1.48], [0.2, -1.4]].forEach(([x, y]) => { c.beginPath(); c.arc(x * T, y * T, T * 0.07, 0, 6.283); c.fill(); stroke(c, lw * 0.5); });
    },
    frozentree(c, T, v) { pine(c, T, v, true); c.globalAlpha = 0.45; c.fillStyle = '#BFE6FF'; c.beginPath(); c.ellipse(0, -T * 0.9, T * 0.5, T * 0.95, 0, 0, 6.283); c.fill(); c.globalAlpha = 1; },
    igloo(c, T) {
      const lw = lw0(T); shadowEll(c, T, 0.6, 0.25);
      c.beginPath(); c.moveTo(-T * 0.62, 0); c.arc(0, 0, T * 0.62, Math.PI, 0); c.closePath(); c.fillStyle = shade(c, '#F4FAFF', T * 0.65, 0, -T * 0.3, 0.12); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(140,180,220,.6)'; c.lineWidth = lw * 0.6; for (let r = 0.2; r < 0.62; r += 0.14) { c.beginPath(); c.arc(0, 0, T * r, Math.PI, 0); c.stroke(); } c.beginPath(); c.moveTo(-T * 0.3, -T * 0.52); c.lineTo(-T * 0.25, -T * 0.1); c.moveTo(T * 0.2, -T * 0.58); c.lineTo(T * 0.15, -T * 0.1); c.stroke();
      c.beginPath(); c.moveTo(-T * 0.2, 0); c.arc(0, 0, T * 0.2, Math.PI, 0); c.closePath(); c.fillStyle = '#16325A'; c.fill(); stroke(c, lw * 0.8);
    },
    volcrock(c, T, v) { rockShape(c, T, 0.44, 0.62, '#4A3A3A', null); c.strokeStyle = '#FF6F3C'; c.lineWidth = lw0(T) * 0.8; c.beginPath(); c.moveTo(-T * 0.2, -T * 0.1); c.lineTo(-T * 0.05, -T * 0.4); c.lineTo(T * 0.1, -T * 0.25); c.stroke(); c.fillStyle = 'rgba(255,111,60,.5)'; c.beginPath(); c.arc(T * 0.15, -T * 0.45, T * 0.06, 0, 6.283); c.fill(); },
    ashtree(c, T, v) {
      const lw = lw0(T); shadowEll(c, T, 0.45, 0.3);
      c.strokeStyle = LN; c.lineWidth = lw * 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -T * 0.9); c.moveTo(0, -T * 0.5); c.lineTo(-T * 0.35, -T * 1.0); c.moveTo(0, -T * 0.7); c.lineTo(T * 0.3, -T * 1.2); c.moveTo(0, -T * 0.9); c.lineTo(-T * 0.15, -T * 1.4); c.moveTo(T * 0.3, -T * 1.2); c.lineTo(T * 0.45, -T * 1.5); c.stroke();
      c.strokeStyle = '#2A2020'; c.lineWidth = lw * 1.6; c.stroke();
      c.fillStyle = '#FF9F43'; [[-0.35, -1.0], [0.45, -1.5], [-0.15, -1.4]].forEach(([x, y]) => { c.beginPath(); c.arc(x * T, y * T, T * 0.05, 0, 6.283); c.fill(); });
    },
    peakrock(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.5, 0.3); c.beginPath(); c.moveTo(-T * 0.45, 0); c.lineTo(-T * 0.3, -T * 0.7); c.lineTo(-T * 0.05, -T * 1.4); c.lineTo(T * 0.2, -T * 0.9); c.lineTo(T * 0.4, -T * 1.1); c.lineTo(T * 0.48, 0); c.closePath(); c.fillStyle = shade(c, '#8E9BA8', T * 0.8, 0, -T * 0.6, 0.35); c.fill(); stroke(c, lw); c.beginPath(); c.moveTo(-T * 0.17, -T * 1.07); c.lineTo(-T * 0.05, -T * 1.4); c.lineTo(T * 0.07, -T * 1.16); c.lineTo(T * 0.2, -T * 0.9); c.lineTo(T * 0.3, -T * 1.0); c.lineTo(T * 0.4, -T * 1.1); c.lineTo(T * 0.43, -T * 0.9); c.lineTo(-T * 0.22, -T * 0.88); c.closePath(); c.fillStyle = '#F4FAFF'; c.fill(); stroke(c, lw * 0.7); },
    cairn(c, T) { const lw = lw0(T); shadowEll(c, T, 0.36); [[0.36, 0.14, 0], [0.3, 0.12, 0.26], [0.24, 0.1, 0.48], [0.16, 0.08, 0.66]].forEach(([w, h, y]) => { c.beginPath(); c.ellipse(0, -y * T - h * T, w * T, h * T, 0, 0, 6.283); c.fillStyle = shade(c, '#9A9FA8', w * T, 0, -y * T - h * T, 0.3); c.fill(); stroke(c, lw * 0.8); }); },
    server(c, T, v) {
      const lw = lw0(T); shadowEll(c, T, 0.42);
      c.beginPath(); GFX.rr(c, -T * 0.34, -T * 1.4, T * 0.68, T * 1.4, T * 0.05); c.fillStyle = vgrad(c, -T * 1.4, 0, '#3A4466', '#1C2438'); c.fill(); stroke(c, lw);
      for (let i = 0; i < 5; i++) { const y = -T * (1.28 - i * 0.25); c.fillStyle = '#121828'; c.fillRect(-T * 0.27, y, T * 0.54, T * 0.16); c.fillStyle = (i + v) % 3 === 0 ? '#4DF0FF' : (i + v) % 3 === 1 ? '#8FE0A6' : '#FF5C8A'; c.fillRect(-T * 0.22, y + T * 0.05, T * 0.06, T * 0.06); c.fillRect(-T * 0.12, y + T * 0.05, T * 0.06, T * 0.06); c.fillStyle = 'rgba(77,240,255,.35)'; c.fillRect(T * 0.0, y + T * 0.04, T * 0.22, T * 0.08); }
      spec(c, -T * 0.2, -T * 0.9, T * 0.05, T * 0.4, 0.15);
    },
    neonpillar(c, T, v, B) { column(c, T, { h: 1.55, top: '#2E3A56', side: '#1C2438' }); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(77,240,255,.9)'; c.fillRect(-T * 0.06, -T * 1.3, T * 0.12, T * 1.0); c.fillStyle = 'rgba(77,240,255,.35)'; c.fillRect(-T * 0.14, -T * 1.3, T * 0.28, T * 1.0); c.restore(); },
    console(c, T) { const lw = lw0(T); shadowEll(c, T, 0.46); c.beginPath(); c.moveTo(-T * 0.42, 0); c.lineTo(-T * 0.38, -T * 0.55); c.lineTo(T * 0.38, -T * 0.55); c.lineTo(T * 0.42, 0); c.closePath(); c.fillStyle = vgrad(c, -T * 0.55, 0, '#3A4466', '#1C2438'); c.fill(); stroke(c, lw); c.beginPath(); c.moveTo(-T * 0.36, -T * 0.55); c.lineTo(-T * 0.3, -T * 0.85); c.lineTo(T * 0.3, -T * 0.85); c.lineTo(T * 0.36, -T * 0.55); c.closePath(); c.fillStyle = '#0B1220'; c.fill(); stroke(c, lw * 0.8); c.fillStyle = '#4DF0FF'; c.globalAlpha = 0.85; c.fillRect(-T * 0.24, -T * 0.78, T * 0.2, T * 0.03); c.fillRect(-T * 0.24, -T * 0.72, T * 0.32, T * 0.03); c.fillRect(-T * 0.24, -T * 0.66, T * 0.14, T * 0.03); c.globalAlpha = 1; c.fillStyle = '#FF5C8A'; c.beginPath(); c.arc(T * 0.2, -T * 0.72, T * 0.04, 0, 6.283); c.fill(); c.fillStyle = '#8FE0A6'; [[-0.2, -0.3], [-0.05, -0.3], [0.1, -0.3]].forEach(([x, y]) => { c.beginPath(); c.arc(x * T, y * T, T * 0.04, 0, 6.283); c.fill(); }); },
    drum(c, T) { const lw = lw0(T); shadowEll(c, T, 0.38); c.beginPath(); c.rect(-T * 0.3, -T * 0.78, T * 0.6, T * 0.78); c.fillStyle = vgrad(c, -T * 0.78, 0, '#8FE0A6', '#3E8A44'); c.fill(); stroke(c, lw); c.beginPath(); c.ellipse(0, -T * 0.78, T * 0.3, T * 0.1, 0, 0, 6.283); c.fillStyle = '#B8F2C4'; c.fill(); stroke(c, lw); c.fillStyle = '#FFE37A'; c.beginPath(); c.moveTo(0, -T * 0.62); c.lineTo(T * 0.14, -T * 0.32); c.lineTo(-T * 0.14, -T * 0.32); c.closePath(); c.fill(); stroke(c, lw * 0.6); c.fillStyle = LN; c.beginPath(); c.arc(0, -T * 0.44, T * 0.04, 0, 6.283); c.fill(); },
    gear(c, T, v) { const lw = lw0(T), r = T * 0.5; shadowEll(c, T, 0.5); c.save(); c.translate(0, -r * 1.05); c.rotate(v * 0.3); c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, a2 = a + 0.31; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a2) * r * 0.78, Math.sin(a2) * r * 0.78); } c.closePath(); c.fillStyle = shade(c, '#C9A24A', r, 0, 0, 0.35); c.fill(); stroke(c, lw); c.beginPath(); c.arc(0, 0, r * 0.3, 0, 6.283); c.fillStyle = '#5A4632'; c.fill(); stroke(c, lw * 0.8); c.restore(); c.fillStyle = '#5A4632'; c.fillRect(-T * 0.12, -T * 0.3, T * 0.24, T * 0.3); stroke(c, lw * 0.6); },
    pipe(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.4); c.beginPath(); GFX.rr(c, -T * 0.16, -T * 1.4, T * 0.32, T * 1.4, T * 0.05); c.fillStyle = vgrad(c, 0, 0, '#B8864E', '#B8864E'); const g = c.createLinearGradient(-T * 0.16, 0, T * 0.16, 0); g.addColorStop(0, '#E0B070'); g.addColorStop(0.5, '#B8864E'); g.addColorStop(1, '#6E4A28'); c.fillStyle = g; c.fill(); stroke(c, lw); [[-1.2], [-0.5]].forEach(([y]) => { c.beginPath(); GFX.rr(c, -T * 0.22, y * T, T * 0.44, T * 0.14, T * 0.03); c.fillStyle = '#8A6A4A'; c.fill(); stroke(c, lw * 0.8); c.fillStyle = LN; c.beginPath(); c.arc(-T * 0.14, (y + 0.07) * T, T * 0.025, 0, 6.283); c.arc(T * 0.14, (y + 0.07) * T, T * 0.025, 0, 6.283); c.fill(); }); if (v % 2) { c.beginPath(); c.arc(T * 0.3, -T * 0.9, T * 0.16, 0, 6.283); c.fillStyle = '#F4F7FF'; c.fill(); stroke(c, lw * 0.8); c.strokeStyle = '#E0344F'; c.lineWidth = lw; c.beginPath(); c.moveTo(T * 0.3, -T * 0.9); c.lineTo(T * 0.38, -T * 1.0); c.stroke(); } },
    boiler(c, T) { const lw = lw0(T); shadowEll(c, T, 0.5); c.beginPath(); GFX.rr(c, -T * 0.42, -T * 1.0, T * 0.84, T * 1.0, T * 0.22); c.fillStyle = shade(c, '#B8864E', T * 0.8, 0, -T * 0.5, 0.3); c.fill(); stroke(c, lw); c.strokeStyle = '#6E4A28'; c.lineWidth = lw; c.beginPath(); c.moveTo(-T * 0.42, -T * 0.7); c.lineTo(T * 0.42, -T * 0.7); c.moveTo(-T * 0.42, -T * 0.3); c.lineTo(T * 0.42, -T * 0.3); c.stroke(); c.fillStyle = LN; for (let i = -3; i <= 3; i += 2) { c.beginPath(); c.arc(i * T * 0.1, -T * 0.7, T * 0.025, 0, 6.283); c.arc(i * T * 0.1, -T * 0.3, T * 0.025, 0, 6.283); c.fill(); } c.beginPath(); c.arc(0, -T * 0.5, T * 0.14, 0, 6.283); c.fillStyle = '#F4F7FF'; c.fill(); stroke(c, lw * 0.8); c.strokeStyle = '#E0344F'; c.lineWidth = lw; c.beginPath(); c.moveTo(0, -T * 0.5); c.lineTo(T * 0.08, -T * 0.6); c.stroke(); c.beginPath(); c.rect(-T * 0.1, -T * 1.3, T * 0.2, T * 0.3); c.fillStyle = '#5A4632'; c.fill(); stroke(c, lw * 0.8); },
    lamp(c, T) { const lw = lw0(T); shadowEll(c, T, 0.3); c.strokeStyle = LN; c.lineWidth = lw * 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -T * 1.5); c.stroke(); c.strokeStyle = '#5A4632'; c.lineWidth = lw * 1.2; c.stroke(); c.beginPath(); c.moveTo(-T * 0.22, -T * 1.5); c.lineTo(-T * 0.16, -T * 1.95); c.lineTo(T * 0.16, -T * 1.95); c.lineTo(T * 0.22, -T * 1.5); c.closePath(); c.fillStyle = 'rgba(255,230,160,.85)'; c.fill(); stroke(c, lw); c.fillStyle = '#5A4632'; c.beginPath(); c.moveTo(-T * 0.26, -T * 1.95); c.lineTo(0, -T * 2.15); c.lineTo(T * 0.26, -T * 1.95); c.closePath(); c.fill(); stroke(c, lw * 0.8); c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(0, -T * 1.7, T * 0.07, 0, 6.283); c.fill(); },
    oak(c, T, v) { tree(c, T, v, v % 2 ? '#5FA552' : '#4E9E44', '#2F5A2E', '#7A5230', { berries: v === 3 ? '#FF5C8A' : null }); },
    log(c, T) { const lw = lw0(T); shadowEll(c, T, 0.5, 0.3); c.beginPath(); GFX.rr(c, -T * 0.5, -T * 0.38, T * 1.0, T * 0.38, T * 0.1); c.fillStyle = vgrad(c, -T * 0.38, 0, '#9C7149', '#5E4630'); c.fill(); stroke(c, lw); c.beginPath(); c.ellipse(T * 0.5, -T * 0.19, T * 0.1, T * 0.19, 0, 0, 6.283); c.fillStyle = '#D9B98A'; c.fill(); stroke(c, lw * 0.8); c.strokeStyle = '#A8865C'; c.lineWidth = lw * 0.5; c.beginPath(); c.ellipse(T * 0.5, -T * 0.19, T * 0.05, T * 0.1, 0, 0, 6.283); c.stroke(); c.fillStyle = '#5FA552'; c.beginPath(); c.ellipse(-T * 0.2, -T * 0.4, T * 0.14, T * 0.06, 0, 0, 6.283); c.fill(); c.fillStyle = '#FF6F59'; c.beginPath(); c.arc(T * 0.1, -T * 0.42, T * 0.06, Math.PI, 0); c.fill(); stroke(c, lw * 0.5); },
    fern(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.35, 0.2); for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.55; c.save(); c.rotate(a + 1.57); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.25, -T * 0.6, T * 0.08, -T * 1.1); c.quadraticCurveTo(-T * 0.1, -T * 0.6, 0, 0); c.closePath(); c.fillStyle = i % 2 ? '#5FA552' : '#3E8A44'; c.fill(); stroke(c, lw * 0.7); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.1, -T * 0.6, T * 0.08, -T * 1.0); c.stroke(); c.restore(); } },
    bigflower(c, T, v) { const lw = lw0(T), col = ['#FF9BD2', '#FFE37A', '#B983F5', '#7FD3F2'][v % 4]; shadowEll(c, T, 0.42, 0.25); c.strokeStyle = LN; c.lineWidth = lw * 2.6; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.1, -T * 0.6, 0, -T * 1.2); c.stroke(); c.strokeStyle = '#4E9E44'; c.lineWidth = lw * 1.3; c.stroke(); [[-1, -0.5], [1, -0.75]].forEach(([s, y]) => { c.beginPath(); c.ellipse(s * T * 0.22, y * T, T * 0.22, T * 0.1, s * 0.5, 0, 6.283); c.fillStyle = '#5FA552'; c.fill(); stroke(c, lw * 0.7); }); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; c.beginPath(); c.ellipse(Math.cos(a) * T * 0.32, -T * 1.25 + Math.sin(a) * T * 0.32, T * 0.22, T * 0.13, a, 0, 6.283); c.fillStyle = shade(c, col, T * 0.2, Math.cos(a) * T * 0.32, -T * 1.25 + Math.sin(a) * T * 0.32, 0.25); c.fill(); stroke(c, lw * 0.7); } c.beginPath(); c.arc(0, -T * 1.25, T * 0.18, 0, 6.283); c.fillStyle = '#FFB447'; c.fill(); stroke(c, lw * 0.8); c.fillStyle = 'rgba(0,0,0,.25)'; [[-0.06, -1.3], [0.06, -1.22], [0.02, -1.32]].forEach(([x, y]) => { c.beginPath(); c.arc(x * T, y * T, T * 0.025, 0, 6.283); c.fill(); }); },
    tulips(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.4, 0.2); [[-0.28, 0.7, '#FF6F9C'], [0, 0.95, '#FFE37A'], [0.28, 0.75, '#FF9BD2']].forEach(([x, h, col]) => { c.strokeStyle = LN; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(x * T, 0); c.lineTo(x * T, -h * T); c.stroke(); c.strokeStyle = '#4E9E44'; c.lineWidth = lw * 0.9; c.stroke(); c.beginPath(); c.moveTo(x * T - T * 0.14, -h * T + T * 0.1); c.quadraticCurveTo(x * T - T * 0.16, -h * T - T * 0.3, x * T - T * 0.05, -h * T - T * 0.22); c.lineTo(x * T, -h * T - T * 0.1); c.lineTo(x * T + T * 0.05, -h * T - T * 0.22); c.quadraticCurveTo(x * T + T * 0.16, -h * T - T * 0.3, x * T + T * 0.14, -h * T + T * 0.1); c.closePath(); c.fillStyle = shade(c, col, T * 0.2, x * T, -h * T, 0.3); c.fill(); stroke(c, lw * 0.7); }); },
    lantern(c, T) { const lw = lw0(T); shadowEll(c, T, 0.3); c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -T * 1.3); c.stroke(); c.strokeStyle = '#8A6A4A'; c.lineWidth = lw; c.stroke(); c.beginPath(); GFX.rr(c, -T * 0.2, -T * 1.72, T * 0.4, T * 0.5, T * 0.08); c.fillStyle = 'rgba(255,214,120,.9)'; c.fill(); stroke(c, lw); c.fillStyle = '#B85A88'; c.beginPath(); c.moveTo(-T * 0.26, -T * 1.72); c.lineTo(0, -T * 1.9); c.lineTo(T * 0.26, -T * 1.72); c.closePath(); c.fill(); stroke(c, lw * 0.8); c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(0, -T * 1.47, T * 0.08, 0, 6.283); c.fill(); },
    pinkshroom(c, T, v) { PROPS.shroom(c, T, v); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,120,190,.45)'; c.fillRect(-T, -T * 2, T * 2, T * 2.2); c.globalCompositeOperation = 'source-over'; },
  });
  PROPS.urn = PROPS.pot;
  const propCache = new Map();
  window.PROP_EXT = window.PROP_EXT || {};
  /* a prop as a sprite: {cv, ax, ay} where (ax, ay) is the feet in sprite pixels */
  function propSprite(kind, T, k, v, biome, extra) {
    const key = kind + '|' + T + '|' + k + '|' + (v | 0) + '|' + biome + '|' + (extra || '');
    let s = propCache.get(key);
    if (s) return s;
    const E = PROP_EXT[kind], P = T * k, w = P * (E ? E[0] : 2.4), h = P * (E ? E[1] : 2.9), cv = mk(w, h), c = cv.getContext('2d');
    c.translate(w / 2, h - P * 0.35);
    try { (PROPS[kind] || PROPS.rock)(c, P, v | 0, BIOMES[biome] || BIOMES.halls, extra); } catch (e) { console.error(e); }
    s = { cv, ax: w / 2, ay: h - P * 0.35 };
    if (propCache.size > 300) propCache.clear();
    propCache.set(key, s);
    return s;
  }

  /* ---------- ground chunks ---------- */
  const CH = 8;
  function chunk(M, cx, cy, T, k) {
    const { MW, MH, G, BI, props } = M, P = CH * T * k, cv = mk(P, P), c = cv.getContext('2d');
    c.scale(k, k); c.translate(-cx * CH * T, -cy * CH * T);
    c.beginPath(); c.rect(cx * CH * T, cy * CH * T, CH * T, CH * T); c.clip();
    const tt = (x, y) => x < 0 || y < 0 || x >= MW || y >= MH ? (M.fill === T_GAP ? T_GAP : T_SOLID) : G[y * MW + x];
    const isWall = (x, y) => tt(x, y) === T_SOLID && !props.has(y * MW + x);
    const isGap = (x, y) => tt(x, y) === T_GAP;
    const isGround = (x, y) => !isGap(x, y) && !isWall(x, y);
    const bio = (x, y) => BIOMES[BIOME_ORDER[BI[Math.max(0, Math.min(MH - 1, y)) * MW + Math.max(0, Math.min(MW - 1, x))]]];
    const bname = (x, y) => biomeTile(BIOME_ORDER[BI[Math.max(0, Math.min(MH - 1, y)) * MW + Math.max(0, Math.min(MW - 1, x))]]);
    const x0 = cx * CH - 1, x1 = cx * CH + CH, y0 = cy * CH - 1, y1 = cy * CH + CH + 1;
    const lw = lw0(T);
    // 1. ground
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!isGround(x, y)) continue;
      const t = tt(x, y), B = bio(x, y), bn = bname(x, y), X = x * T, Y = y * T, h = th(x, y, 7), h2 = th(x, y, 13);
      if (t === T_BRIDGE) { if (B && B.bridgeFn) { B.bridgeFn(c, x, y, X, Y, T, isGap, tt, lw, B); continue; } if (B && B.metalBridge) { metalBridge(c, x, y, X, Y, T, isGap, tt, lw, B); continue; } if (B && (B.glassBridge || B.iceBridge)) glassBridge(c, x, y, X, Y, T, isGap, tt, lw, B.iceBridge); else bridge(c, x, y, X, Y, T, bn, isGap, isGround, tt, lw); continue; }
      // the tile outline: round off corners that stick out into a gap (open-air lands)
      const rr = B.out ? T * 0.38 : 0, gN = isGap(x, y - 1), gS = isGap(x, y + 1), gW = isGap(x - 1, y), gE = isGap(x + 1, y);
      c.beginPath();
      const r1 = gN && gW ? rr : 0, r2 = gN && gE ? rr : 0, r3 = gS && gE ? rr : 0, r4 = gS && gW ? rr : 0;
      c.moveTo(X + r1, Y); c.lineTo(X + T - r2, Y); if (r2) c.quadraticCurveTo(X + T, Y, X + T, Y + r2); c.lineTo(X + T, Y + T - r3); if (r3) c.quadraticCurveTo(X + T, Y + T, X + T - r3, Y + T); c.lineTo(X + r4, Y + T); if (r4) c.quadraticCurveTo(X, Y + T, X, Y + T - r4); c.lineTo(X, Y + r1); if (r1) c.quadraticCurveTo(X, Y, X + r1, Y); c.closePath();
      let base = B.floor[Math.floor(h * B.floor.length)];
      if (t === T_MUD) base = (B.mud || BIOMES.swamp.mud)[h < 0.5 ? 0 : 1];
      else if (t === T_ICE) base = (B.ice || BIOMES.frost.ice)[h < 0.5 ? 0 : 1];
      else if ((bn === 'keep' || bn === 'heaven' || bn === 'techno' || bn === 'steampunk') && (x + y) % 2) base = shadeC(base, bn === 'heaven' ? 0.04 : -0.06);
      c.fillStyle = base; c.fill();
      const rounded = r1 || r2 || r3 || r4;
      c.save(); if (rounded) c.clip();
      // geometric light on every tile: a lit top-left, a shaded bottom-right, and a touch of mottling so no two tiles match
      { const tg = c.createLinearGradient(X, Y, X + T, Y + T); tg.addColorStop(0, 'rgba(255,255,255,.09)'); tg.addColorStop(0.5, 'rgba(255,255,255,0)'); tg.addColorStop(1, `rgba(0,0,0,${(0.08 + h2 * 0.06).toFixed(3)})`); c.fillStyle = tg; c.fillRect(X, Y, T, T); }
      if (B.floorFn && t === T_FLOOR) B.floorFn(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE);   /* a land of its own floor */
      else { if (h > 0.72) { c.fillStyle = 'rgba(0,0,0,.05)'; c.beginPath(); c.ellipse(X + T * (0.3 + h2 * 0.4), Y + T * (0.35 + h * 0.3), T * 0.42, T * 0.26, h2 * 3, 0, 6.283); c.fill(); }
      groundDetail(c, bn, B, t, X, Y, T, h, h2, x, y, lw); }
      // shade along walls (ambient occlusion)
      if (isWall(x, y - 1)) { c.fillStyle = vgrad(c, Y, Y + T * 0.45, 'rgba(0,0,0,.42)', 'rgba(0,0,0,0)'); c.fillRect(X, Y, T, T * 0.45); }
      if (isWall(x - 1, y)) { const g = c.createLinearGradient(X, 0, X + T * 0.3, 0); g.addColorStop(0, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(X, Y, T * 0.3, T); }
      if (isWall(x + 1, y)) { const g = c.createLinearGradient(X + T, 0, X + T * 0.7, 0); g.addColorStop(0, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(X + T * 0.7, Y, T * 0.3, T); }
      // a lip along drops
      if (gN) { c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(X, Y, T, T * 0.06); }
      if (gW) { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(X, Y, T * 0.05, T); }
      if (gE) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(X + T * 0.95, Y, T * 0.05, T); }
      c.restore();
      if (B.out && (gN || gS || gW || gE)) { c.lineWidth = lw * 0.9; c.strokeStyle = rgba(LN, 0.55); c.beginPath(); if (gN) { c.moveTo(X + r1, Y); c.lineTo(X + T - r2, Y); } if (gW) { c.moveTo(X, Y + r1); c.lineTo(X, Y + T - r4); } if (gE) { c.moveTo(X + T, Y + r2); c.lineTo(X + T, Y + T - r3); } c.stroke(); }
    }
    // 2. cliff faces below ground that drops into a gap
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!isGround(x, y) || !isGap(x, y + 1)) continue;
      const t = tt(x, y), bn = bname(x, y), B = bio(x, y), X = x * T, Y = (y + 1) * T;
      if (t === T_BRIDGE && B && B.bridgeEdge) { B.bridgeEdge(c, x, y, X, Y, T, lw, B); continue; }
      if (t === T_BRIDGE && B && B.metalBridge) { c.fillStyle = '#14161E'; c.fillRect(X, Y, T, T * 0.16); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X, Y, T, Math.max(1, T * 0.03)); continue; }
      if (t === T_BRIDGE && B && (B.glassBridge || B.iceBridge)) { c.fillStyle = 'rgba(190,225,255,.35)'; c.fillRect(X, Y, T, T * 0.12); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(X, Y, T, Math.max(1, T * 0.03)); continue; }
      if (t === T_BRIDGE) { c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(X, Y, T, T * 0.35); c.fillStyle = '#5E4630'; if ((x % 3) === 1) { c.fillRect(X + T * 0.42, Y - 1, T * 0.16, T * 0.5); } continue; }
      cliff(c, x, y, X, Y, T, bn, B, isGap, isGround, lw); if (B && B.cliffTint) B.cliffTint(c, x, y, X, Y, T, lw, B, isGap);
    }
    // gap dressing: lily pads, lava crust, cloud puffs near the edges
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!isGap(x, y)) continue;
      const bn = bname(x, y), h = th(x, y, 31), X = x * T, Y = y * T;
      const near = isGround(x - 1, y) || isGround(x + 1, y) || isGround(x, y + 1) || isGround(x, y - 1);
      if ((bn === 'swamp' || bn === 'bloom') && near && h < 0.22 && !isGround(x, y - 1)) { c.fillStyle = '#5E9E4A'; c.beginPath(); c.arc(X + T * (0.3 + h), Y + T * 0.55, T * 0.2, 0.4, 6.0); c.lineTo(X + T * (0.3 + h), Y + T * 0.55); c.fill(); c.lineWidth = lw * 0.7; c.strokeStyle = rgba(LN, 0.6); c.stroke(); if (h < 0.08) { c.fillStyle = '#FF9BD2'; c.beginPath(); c.arc(X + T * (0.3 + h), Y + T * 0.48, T * 0.07, 0, 6.283); c.fill(); } }
      if (bn === 'swamp' && near && h > 0.8) { c.strokeStyle = 'rgba(200,255,220,.25)'; c.lineWidth = lw * 0.6; c.beginPath(); c.ellipse(X + T * 0.5, Y + T * 0.5, T * 0.25, T * 0.08, 0, 0, 6.283); c.stroke(); }
    }
    // 3. decals
    for (const d of M.decalsByChunk ? (M.decalsByChunk.get(cx + ',' + cy) || []) : []) decal(c, d, T, lw);
    // 4. walls, top to bottom so lower walls overlap the ones behind them
    const H = T * 0.55;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!isWall(x, y)) continue;
      let near = false; for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (!isWall(x + dx, y + dy)) { near = true; break; }
      const bn = bname(x, y), B = bio(x, y), X = x * T, Y = y * T, front = !isWall(x, y + 1), h = th(x, y, 5);
      if (!near) { c.fillStyle = shadeC(B.top, -0.3 - Math.round(h * 2) * 0.03); c.fillRect(X, Y - H, T + 0.5, T + 0.5); if (h < 0.12) { c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(X + T * 0.2, Y - H + T * 0.3, T * 0.4, T * 0.2); } continue; }
      // roof
      c.fillStyle = B.top; c.fillRect(X, Y - H, T + 0.5, T + 0.5);
      c.fillStyle = 'rgba(255,255,255,.08)'; if (h < 0.4) c.fillRect(X + T * 0.15, Y - H + T * 0.2, T * 0.3, T * 0.12);
      c.fillStyle = rgba('#FFFFFF', 0.22); if (!isWall(x, y - 1)) c.fillRect(X, Y - H, T + 0.5, T * 0.07); if (!isWall(x - 1, y)) c.fillRect(X, Y - H, T * 0.06, T); if (!isWall(x + 1, y)) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(X + T * 0.94, Y - H, T * 0.06, T); }
      if (front) {
        const fy = Y + T - H;
        c.fillStyle = vgrad(c, fy, Y + T, B.face, B.faceD); c.fillRect(X, fy, T + 0.5, H);
        wallFace(c, bn, B, X, fy, T, H, h, x, lw);
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(X, fy, T + 0.5, Math.max(1, T * 0.04));
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X, Y + T - T * 0.08, T + 0.5, T * 0.08);
      }
    }
    return cv;
  }
  function groundDetail(c, bn, B, t, X, Y, T, h, h2, x, y, lw) {
    if (t === T_MUD) { c.fillStyle = B.mudSpot || 'rgba(40,30,15,.35)'; c.beginPath(); c.ellipse(X + T * (0.3 + h * 0.4), Y + T * (0.4 + h2 * 0.3), T * 0.25, T * 0.12, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(X + T * (0.35 + h * 0.4), Y + T * (0.35 + h2 * 0.3), T * 0.1, T * 0.04, -0.3, 0, 6.283); c.fill(); return; }
    if (t === T_ICE) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(X + T * (0.1 + h * 0.3), Y + T * 0.85); c.lineTo(X + T * (0.5 + h * 0.3), Y + T * 0.15); c.stroke(); c.strokeStyle = 'rgba(120,170,220,.4)'; c.lineWidth = lw * 0.6; if (h2 < 0.4) { c.beginPath(); c.moveTo(X + T * 0.6, Y + T * 0.5); c.lineTo(X + T * 0.85, Y + T * 0.65); c.lineTo(X + T * 0.75, Y + T * 0.9); c.stroke(); } return; }
    switch (bn) {
      case 'halls': case 'keep': case 'frost': {
        c.fillStyle = B.hi; c.globalAlpha = 0.35; c.fillRect(X, Y, T, Math.max(1, T * 0.05)); c.fillRect(X, Y, Math.max(1, T * 0.05), T); c.globalAlpha = 1;
        c.fillStyle = B.grout; c.fillRect(X, Y + T - Math.max(1.2, T * 0.05), T, Math.max(1.2, T * 0.05)); c.fillRect(X + T - Math.max(1.2, T * 0.05), Y, Math.max(1.2, T * 0.05), T);
        if (h2 < 0.14) { c.strokeStyle = B.grout; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(X + T * 0.2, Y + T * 0.3); c.lineTo(X + T * 0.45, Y + T * 0.5); c.lineTo(X + T * 0.4, Y + T * 0.75); c.stroke(); }
        if (bn === 'frost' && h2 > 0.8) { c.fillStyle = 'rgba(255,255,255,.38)'; c.beginPath(); c.arc(X + T * (0.3 + h * 0.2), Y + T * 0.62, T * 0.16, 0, 6.283); c.arc(X + T * (0.48 + h * 0.2), Y + T * 0.55, T * 0.2, 0, 6.283); c.arc(X + T * (0.66 + h * 0.15), Y + T * 0.64, T * 0.13, 0, 6.283); c.fill(); }
        if (bn === 'halls' && h2 > 0.86) { c.fillStyle = 'rgba(94,155,90,.45)'; c.beginPath(); c.ellipse(X + T * 0.1, Y + T * 0.9, T * 0.3, T * 0.14, 0, 0, 6.283); c.fill(); }
        break;
      }
      case 'caves': {
        c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(X + T * (0.2 + h * 0.6), Y + T * (0.3 + h2 * 0.4), T * 0.35, T * 0.2, h * 3, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.ellipse(X + T * (0.7 - h * 0.4), Y + T * (0.65 - h2 * 0.3), T * 0.22, T * 0.12, h2 * 3, 0, 6.283); c.fill();
        break;
      }
      case 'swamp': case 'high': {
        c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.ellipse(X + T * (0.2 + h * 0.6), Y + T * (0.3 + h2 * 0.4), T * 0.4, T * 0.22, 0, 0, 6.283); c.fill();
        c.strokeStyle = B.hi; c.lineWidth = Math.max(1, lw * 0.6); c.globalAlpha = 0.7;
        for (let i = 0; i < 3; i++) { const gx = X + T * th(x, y, 40 + i), gy = Y + T * th(x, y, 50 + i); c.beginPath(); c.moveTo(gx - T * 0.05, gy); c.lineTo(gx - T * 0.02, gy - T * 0.1); c.moveTo(gx + T * 0.03, gy); c.lineTo(gx + T * 0.06, gy - T * 0.09); c.stroke(); }
        c.globalAlpha = 1;
        if (bn === 'high' && h2 < 0.08) { c.fillStyle = 'rgba(194,162,112,.6)'; c.beginPath(); c.ellipse(X + T * 0.5, Y + T * 0.5, T * 0.45, T * 0.3, h, 0, 6.283); c.fill(); }
        break;
      }
      case 'hell': {
        c.strokeStyle = B.grout; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(X, Y + T * (0.3 + h * 0.4)); c.lineTo(X + T * 0.5, Y + T * (0.5 + h2 * 0.2)); c.lineTo(X + T, Y + T * (0.3 + h2 * 0.4)); c.moveTo(X + T * 0.5, Y + T * (0.5 + h2 * 0.2)); c.lineTo(X + T * (0.4 + h * 0.2), Y + T); c.stroke();
        if (h < 0.25) { c.strokeStyle = 'rgba(255,111,60,.55)'; c.lineWidth = lw * 0.6; c.stroke(); }
        break;
      }
      case 'heaven': {
        c.fillStyle = B.grout; c.fillRect(X, Y + T - Math.max(1, T * 0.035), T, Math.max(1, T * 0.035)); c.fillRect(X + T - Math.max(1, T * 0.035), Y, Math.max(1, T * 0.035), T);
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(X + T * 0.1, Y + T * 0.9); c.lineTo(X + T * 0.35, Y + T * 0.9); c.lineTo(X + T * 0.9, Y + T * 0.35); c.lineTo(X + T * 0.9, Y + T * 0.1); c.closePath(); c.fill();
        break;
      }
      case 'desert': {
        c.strokeStyle = 'rgba(160,110,50,.22)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(X, Y + T * (0.25 + h * 0.2)); c.quadraticCurveTo(X + T * 0.5, Y + T * (0.1 + h * 0.3), X + T, Y + T * (0.3 + h2 * 0.2)); c.moveTo(X, Y + T * (0.7 + h2 * 0.15)); c.quadraticCurveTo(X + T * 0.5, Y + T * (0.55 + h * 0.25), X + T, Y + T * (0.75 + h * 0.15)); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(X + T * (0.3 + h * 0.4), Y + T * (0.4 + h2 * 0.3), T * 0.3, T * 0.1, 0.3, 0, 6.283); c.fill();
        if (h2 < 0.08) { c.fillStyle = 'rgba(120,80,40,.35)'; c.beginPath(); c.ellipse(X + T * 0.5, Y + T * 0.55, T * 0.12, T * 0.07, 0, 0, 6.283); c.fill(); }
        break;
      }
      case 'icefield': {
        c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.arc(X + T * (0.3 + h * 0.3), Y + T * 0.6, T * 0.2, 0, 6.283); c.arc(X + T * (0.55 + h * 0.2), Y + T * 0.5, T * 0.24, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(120,170,220,.3)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(X + T * (0.1 + h * 0.3), Y + T * 0.9); c.lineTo(X + T * (0.4 + h * 0.3), Y + T * 0.3); c.stroke();
        if (h2 > 0.86) GFX.star(c, X + T * 0.5, Y + T * 0.35, T * 0.1, 'rgba(255,255,255,.8)', 0);
        break;
      }
      case 'volcano': {
        c.strokeStyle = B.grout; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(X, Y + T * (0.3 + h * 0.4)); c.lineTo(X + T * 0.5, Y + T * (0.5 + h2 * 0.2)); c.lineTo(X + T, Y + T * (0.3 + h2 * 0.4)); c.moveTo(X + T * 0.5, Y + T * (0.5 + h2 * 0.2)); c.lineTo(X + T * (0.4 + h * 0.2), Y + T); c.stroke();
        if (h < 0.3) { c.strokeStyle = 'rgba(255,111,60,.6)'; c.lineWidth = lw * 0.7; c.stroke(); }
        if (h2 > 0.9) { c.fillStyle = 'rgba(255,159,67,.45)'; c.beginPath(); c.arc(X + T * 0.5, Y + T * 0.5, T * 0.08, 0, 6.283); c.fill(); }
        break;
      }
      case 'mountain': {
        c.fillStyle = 'rgba(0,0,0,.1)'; c.beginPath(); c.ellipse(X + T * (0.2 + h * 0.6), Y + T * (0.3 + h2 * 0.4), T * 0.35, T * 0.2, h * 3, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(X + T * 0.2, Y + T * (0.2 + h * 0.3)); c.lineTo(X + T * 0.5, Y + T * 0.55); c.lineTo(X + T * 0.85, Y + T * (0.4 + h2 * 0.3)); c.stroke();
        if (h2 > 0.8) { c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(X + T * 0.35, Y + T * 0.65, T * 0.16, 0, 6.283); c.arc(X + T * 0.6, Y + T * 0.6, T * 0.2, 0, 6.283); c.fill(); }
        break;
      }
      case 'techno': {
        c.fillStyle = B.grout; c.fillRect(X, Y + T - Math.max(1.2, T * 0.05), T, Math.max(1.2, T * 0.05)); c.fillRect(X + T - Math.max(1.2, T * 0.05), Y, Math.max(1.2, T * 0.05), T);
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(X + T * 0.08, Y + T * 0.08, T * 0.84, T * 0.1);
        if (h < 0.25) { c.strokeStyle = 'rgba(77,240,255,.45)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(X + T * 0.2, Y + T * 0.3); c.lineTo(X + T * 0.5, Y + T * 0.3); c.lineTo(X + T * 0.5, Y + T * 0.7); c.lineTo(X + T * 0.8, Y + T * 0.7); c.stroke(); c.fillStyle = 'rgba(77,240,255,.8)'; c.beginPath(); c.arc(X + T * 0.8, Y + T * 0.7, T * 0.04, 0, 6.283); c.fill(); }
        break;
      }
      case 'hull': {
        // great plates of dark alien hull: bevelled seams, rivets in pairs, scorch, now and then a live seam glowing
        const sw = Math.max(1.2, T * 0.05); c.fillStyle = B.grout; c.fillRect(X, Y + T - sw, T, sw); if (h > 0.5) c.fillRect(X + T - sw, Y, sw, T);
        c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(X, Y, T, Math.max(1, T * 0.05)); c.fillStyle = 'rgba(0,0,0,.28)'; [[0.12, 0.2], [0.22, 0.2], [0.78, 0.8], [0.88, 0.8]].forEach(([u, v]) => { c.beginPath(); c.arc(X + T * u, Y + T * v, Math.max(1, T * 0.03), 0, 6.283); c.fill(); });
        if (h2 < 0.12) { c.fillStyle = 'rgba(10,6,14,.35)'; c.beginPath(); c.ellipse(X + T * 0.5, Y + T * 0.5, T * 0.4, T * 0.22, h * 3, 0, 6.283); c.fill(); }
        if (h < 0.3) { const col = B.deco || '#C452FF'; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = col + '55'; c.lineWidth = Math.max(3, lw * 2.6); c.beginPath(); c.moveTo(X, Y + T * 0.5); c.lineTo(X + T * 0.35, Y + T * 0.5); c.lineTo(X + T * 0.5, Y + T * 0.35); c.lineTo(X + T, Y + T * 0.35); c.stroke(); c.strokeStyle = col; c.lineWidth = Math.max(1.2, lw * 0.9); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(0.6, lw * 0.3); c.stroke(); c.restore(); }
        if (h2 > 0.9) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = (B.deco || '#C452FF') + '66'; c.beginPath(); c.arc(X + T * 0.5, Y + T * 0.5, T * 0.16, 0, 6.283); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(X + T * 0.5, Y + T * 0.5, T * 0.05, 0, 6.283); c.fill(); c.restore(); }
        break;
      }
      case 'steampunk': {
        c.fillStyle = B.grout; c.fillRect(X, Y + T - Math.max(1.2, T * 0.06), T, Math.max(1.2, T * 0.06)); c.fillRect(X + T - Math.max(1.2, T * 0.06), Y, Math.max(1.2, T * 0.06), T);
        c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(X, Y, T, Math.max(1, T * 0.05));
        c.fillStyle = 'rgba(0,0,0,.35)'; [[0.14, 0.14], [0.86, 0.14], [0.14, 0.86], [0.86, 0.86]].forEach(([u, v]) => { c.beginPath(); c.arc(X + T * u, Y + T * v, Math.max(1, T * 0.035), 0, 6.283); c.fill(); });
        if (h2 < 0.1) { c.fillStyle = 'rgba(20,10,5,.35)'; c.beginPath(); c.ellipse(X + T * 0.5, Y + T * 0.55, T * 0.25, T * 0.12, h, 0, 6.283); c.fill(); }
        break;
      }
      case 'forest': case 'bloom': {
        c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.ellipse(X + T * (0.2 + h * 0.6), Y + T * (0.3 + h2 * 0.4), T * 0.4, T * 0.22, 0, 0, 6.283); c.fill();
        c.strokeStyle = B.hi; c.lineWidth = Math.max(1, lw * 0.6); c.globalAlpha = 0.7;
        for (let i = 0; i < 3; i++) { const gx = X + T * th(x, y, 40 + i), gy = Y + T * th(x, y, 50 + i); c.beginPath(); c.moveTo(gx - T * 0.05, gy); c.lineTo(gx - T * 0.02, gy - T * 0.1); c.moveTo(gx + T * 0.03, gy); c.lineTo(gx + T * 0.06, gy - T * 0.09); c.stroke(); }
        c.globalAlpha = 1;
        if (bn === 'bloom' && h2 < 0.12) { c.fillStyle = ['#FF9BD2', '#FFFFFF', '#FFE37A'][Math.floor(h * 3)]; c.beginPath(); c.ellipse(X + T * 0.5, Y + T * 0.5, T * 0.09, T * 0.05, h * 3, 0, 6.283); c.fill(); }
        break;
      }
    }
  }
  /* a bridge of glass: the void shows through it; panes with bright edges and a shine across them, silver rails */
  /* a steel catwalk: a grating of dark bars over the drop, side rails with hazard stripes, a lit trim */
  function metalBridge(c, x, y, X, Y, T, isGap, tt, lw, B) {
    const horiz = (isGap(x, y - 1) || isGap(x, y + 1)) && !(isGap(x - 1, y) || isGap(x + 1, y)) ? true : !(isGap(x, y - 1) || isGap(x, y + 1)) ? (tt(x - 1, y) === T_BRIDGE || tt(x + 1, y) === T_BRIDGE) : true;
    c.fillStyle = 'rgba(30,34,46,.92)'; c.fillRect(X, Y, T + 0.5, T + 0.5);
    c.strokeStyle = 'rgba(110,120,140,.7)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); for (let i = 1; i < 6; i++) { const u = i / 6; if (horiz) { c.moveTo(X + T * u, Y + T * 0.1); c.lineTo(X + T * u, Y + T * 0.9); } else { c.moveTo(X + T * 0.1, Y + T * u); c.lineTo(X + T * 0.9, Y + T * u); } } c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); if (horiz) { c.moveTo(X, Y + T * 0.5); c.lineTo(X + T, Y + T * 0.5); } else { c.moveTo(X + T * 0.5, Y); c.lineTo(X + T * 0.5, Y + T); } c.stroke();
    const rail = (x0, y0, x1, y1) => { c.strokeStyle = '#1A1A1A'; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#FFB23F'; c.lineWidth = Math.max(1.5, T * 0.07); c.setLineDash([T * 0.14, T * 0.14]); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]); c.strokeStyle = (B && B.deco || '#C452FF') + 'CC'; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(x0, y0 + (horiz ? (y0 < Y + T / 2 ? T * 0.07 : -T * 0.07) : 0)); c.lineTo(x1, y1 + (horiz ? (y0 < Y + T / 2 ? T * 0.07 : -T * 0.07) : 0)); c.stroke(); };
    if (horiz) { if (isGap(x, y - 1)) rail(X, Y + T * 0.05, X + T, Y + T * 0.05); if (isGap(x, y + 1)) rail(X, Y + T * 0.95, X + T, Y + T * 0.95); }
    else { if (isGap(x - 1, y)) rail(X + T * 0.05, Y, X + T * 0.05, Y + T); if (isGap(x + 1, y)) rail(X + T * 0.95, Y, X + T * 0.95, Y + T); }
  }
  function glassBridge(c, x, y, X, Y, T, isGap, tt, lw, ice) {
    const horiz = (isGap(x, y - 1) || isGap(x, y + 1)) && !(isGap(x - 1, y) || isGap(x + 1, y)) ? true : !(isGap(x, y - 1) || isGap(x, y + 1)) ? (tt(x - 1, y) === T_BRIDGE || tt(x + 1, y) === T_BRIDGE) : true;
    c.fillStyle = ice ? 'rgba(190,226,242,.78)' : 'rgba(170,210,255,.22)'; c.fillRect(X, Y, T + 0.5, T + 0.5);
    if (ice) { c.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 3; k++) { const hx = th(x, y, 80 + k), hy = th(x, y, 90 + k); c.beginPath(); c.ellipse(X + hx * T, Y + hy * T, T * 0.22, T * 0.08, hx * 3, 0, 6.283); c.fill(); } c.strokeStyle = 'rgba(80,130,170,.35)'; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(X + T * th(x, y, 70), Y); c.lineTo(X + T * th(x, y, 71), Y + T * 0.5); c.lineTo(X + T * th(x, y, 72), Y + T); c.stroke(); }
    const g = c.createLinearGradient(X, Y, X + T, Y + T); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(0.45, 'rgba(200,230,255,.08)'); g.addColorStop(0.55, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(200,230,255,.05)'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, T + 0.5);
    // the pane seams
    c.strokeStyle = 'rgba(230,245,255,.55)'; c.lineWidth = Math.max(1, T * 0.03);
    if (horiz) { c.beginPath(); c.moveTo(X + 0.5, Y); c.lineTo(X + 0.5, Y + T); c.stroke(); } else { c.beginPath(); c.moveTo(X, Y + 0.5); c.lineTo(X + T, Y + 0.5); c.stroke(); }
    // a streak of shine
    if ((x * 7 + y * 3) % 4 === 0) { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.moveTo(X + T * 0.2, Y + T * 0.75); c.lineTo(X + T * 0.55, Y + T * 0.25); c.stroke(); c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(X + T * 0.38, Y + T * 0.82); c.lineTo(X + T * 0.62, Y + T * 0.48); c.stroke(); }
    // silver rails where it meets the drop
    c.strokeStyle = 'rgba(228,234,242,.9)'; c.lineWidth = Math.max(1.5, T * 0.06);
    if (horiz) { if (isGap(x, y - 1)) { c.beginPath(); c.moveTo(X, Y + T * 0.05); c.lineTo(X + T, Y + T * 0.05); c.stroke(); } if (isGap(x, y + 1)) { c.beginPath(); c.moveTo(X, Y + T * 0.95); c.lineTo(X + T, Y + T * 0.95); c.stroke(); } }
    else { if (isGap(x - 1, y)) { c.beginPath(); c.moveTo(X + T * 0.05, Y); c.lineTo(X + T * 0.05, Y + T); c.stroke(); } if (isGap(x + 1, y)) { c.beginPath(); c.moveTo(X + T * 0.95, Y); c.lineTo(X + T * 0.95, Y + T); c.stroke(); } }
  }
  function bridge(c, x, y, X, Y, T, bn, isGap, isGround, tt, lw) {
    const horiz = (isGap(x, y - 1) || isGap(x, y + 1)) && !(isGap(x - 1, y) || isGap(x + 1, y)) ? true : !(isGap(x, y - 1) || isGap(x, y + 1)) ? (tt(x - 1, y) === T_BRIDGE || tt(x + 1, y) === T_BRIDGE) : true;
    const style = bn === 'hell' || bn === 'volcano' ? ['#3A2A2A', '#2A1A1A', '#FF6F3C'] : bn === 'heaven' ? ['#FFFFFF', '#E3CB92', '#F2C94C'] : bn === 'frost' || bn === 'icefield' ? ['#BFD8EE', '#8DB0D3', '#FFFFFF'] : bn === 'techno' ? ['#3A4466', '#1C2438', '#4DF0FF'] : bn === 'steampunk' ? ['#8A6A4A', '#4A3528', '#C9A24A'] : bn === 'desert' ? ['#C9A26B', '#8A6A45', '#E8C98A'] : ['#B8864E', '#7A5230', '#5E4630'];
    c.fillStyle = style[1]; c.fillRect(X, Y, T + 0.5, T + 0.5);
    const n = 4;
    for (let i = 0; i < n; i++) {
      const hh = th(x, y, 60 + i);
      c.fillStyle = shadeC(style[0], (hh - 0.5) * 0.18);
      if (horiz) c.fillRect(X + i * T / n + 0.7, Y, T / n - 1.4, T + 0.5); else c.fillRect(X, Y + i * T / n + 0.7, T + 0.5, T / n - 1.4);
    }
    c.fillStyle = 'rgba(0,0,0,.25)'; if (horiz) { c.fillRect(X, Y + T * 0.04, T, Math.max(1, T * 0.04)); } else { c.fillRect(X + T * 0.04, Y, Math.max(1, T * 0.04), T); }
    // rails where the bridge meets the drop
    c.strokeStyle = style[2]; c.lineWidth = Math.max(1.5, T * 0.07);
    if (horiz) { if (isGap(x, y - 1)) { c.beginPath(); c.moveTo(X, Y + T * 0.06); c.lineTo(X + T, Y + T * 0.06); c.stroke(); } if (isGap(x, y + 1)) { c.beginPath(); c.moveTo(X, Y + T * 0.94); c.lineTo(X + T, Y + T * 0.94); c.stroke(); } }
    else { if (isGap(x - 1, y)) { c.beginPath(); c.moveTo(X + T * 0.06, Y); c.lineTo(X + T * 0.06, Y + T); c.stroke(); } if (isGap(x + 1, y)) { c.beginPath(); c.moveTo(X + T * 0.94, Y); c.lineTo(X + T * 0.94, Y + T); c.stroke(); } }
    if ((x + y) % 3 === 0) { c.fillStyle = style[2]; [[0.06, 0.06], [0.94, 0.06], [0.06, 0.94], [0.94, 0.94]].forEach(([a, b]) => { const gx = X + a * T, gy = Y + b * T; if ((horiz && (b < 0.5 ? isGap(x, y - 1) : isGap(x, y + 1)) && a < 0.5) || (!horiz && (a < 0.5 ? isGap(x - 1, y) : isGap(x + 1, y)) && b < 0.5)) { c.beginPath(); c.arc(gx, gy, Math.max(1.5, T * 0.07), 0, 6.283); c.fill(); } }); }
  }
  function cliff(c, x, y, X, Y, T, bn, B, isGap, isGround, lw) {
    const H = bn === 'swamp' || bn === 'forest' || bn === 'bloom' ? T * 0.28 : bn === 'heaven' ? T * 0.42 : bn === 'icefield' ? T * 0.4 : T * 0.62;
    const rr = B.out ? T * 0.38 : 0, rl = isGap(x - 1, y) ? rr : 0, rgt = isGap(x + 1, y) ? rr : 0;
    c.beginPath();
    c.moveTo(X + rl, Y);
    c.lineTo(X + T - rgt, Y);
    if (bn === 'heaven') {
      c.lineTo(X + T - rgt, Y + H * 0.5);
      for (let i = 3; i >= 0; i--) { const bx = X + rl + (T - rl - rgt) * (i + 0.5) / 4; c.arc(bx, Y + H * 0.55, (T - rl - rgt) / 8 + 0.5, 0, Math.PI); }
    } else {
      const steps = 4;
      for (let i = steps; i >= 0; i--) { const px = X + rl + (T - rl - rgt) * i / steps; c.lineTo(px, Y + H * (0.75 + th(x * 5 + i, y, 3) * 0.35)); }
    }
    c.closePath();
    const top = bn === 'heaven' ? '#FFFFFF' : B.cliff, bot = bn === 'heaven' ? '#C9D6F5' : bn === 'hell' || bn === 'volcano' ? '#120606' : shadeC(B.cliff, -0.55);
    c.fillStyle = vgrad(c, Y, Y + H, top, bot); c.fill();
    c.lineWidth = lw * 0.8; c.strokeStyle = rgba(LN, 0.6); c.stroke();
    if (bn !== 'heaven' && bn !== 'swamp' && bn !== 'forest' && bn !== 'bloom') { c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(X + rl, Y + H * 0.35); c.lineTo(X + T - rgt, Y + H * 0.4); c.moveTo(X + T * 0.3, Y + H * 0.1); c.lineTo(X + T * 0.35, Y + H * 0.6); c.stroke(); }
    if (bn === 'hell' || bn === 'volcano') { c.strokeStyle = 'rgba(255,111,60,.8)'; c.lineWidth = lw; c.beginPath(); c.moveTo(X + rl, Y + H * 0.85); c.lineTo(X + T - rgt, Y + H * 0.9); c.stroke(); }
    if (bn === 'swamp' || bn === 'forest' || bn === 'bloom') { c.strokeStyle = bn === 'bloom' ? 'rgba(255,230,245,.5)' : 'rgba(220,255,230,.45)'; c.lineWidth = lw; c.beginPath(); c.moveTo(X + rl, Y + H + T * 0.05); c.lineTo(X + T - rgt, Y + H + T * 0.05); c.stroke(); }
    if (bn === 'icefield') { c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(X + rl, Y, T - rl - rgt, Math.max(1, H * 0.25)); }
    if (bn === 'desert') { c.strokeStyle = 'rgba(255,240,200,.35)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(X + rl, Y + H * 0.55); c.quadraticCurveTo(X + T * 0.5, Y + H * 0.45, X + T - rgt, Y + H * 0.6); c.stroke(); }
    if (B.out && bn !== 'heaven') { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(X + rl, Y + H, T - rl - rgt, T * 0.25); }
  }
  function wallFace(c, bn, B, X, Y, T, H, h, x, lw) {
    if (B.wallFn) { B.wallFn(c, X, Y, T, H, h, x, lw, B); return; }
    c.strokeStyle = rgba(B.faceD, 0.9); c.lineWidth = Math.max(1, lw * 0.6);
    if (bn === 'halls' || bn === 'keep') {
      c.beginPath(); c.moveTo(X, Y + H * 0.5); c.lineTo(X + T, Y + H * 0.5); const off = (x % 2) * 0.5; c.moveTo(X + T * (0.25 + off * 0.5), Y); c.lineTo(X + T * (0.25 + off * 0.5), Y + H * 0.5); c.moveTo(X + T * (0.75 - off * 0.5), Y + H * 0.5); c.lineTo(X + T * (0.75 - off * 0.5), Y + H); c.stroke();
      if (bn === 'halls' && h < 0.3) { c.fillStyle = 'rgba(94,155,90,.6)'; c.beginPath(); c.ellipse(X + T * 0.5, Y + 1, T * 0.35, T * 0.08, 0, 0, Math.PI); c.fill(); }
    } else if (bn === 'caves') { c.beginPath(); c.moveTo(X, Y + H * (0.3 + h * 0.2)); c.lineTo(X + T * 0.5, Y + H * (0.45 - h * 0.1)); c.lineTo(X + T, Y + H * 0.35); c.stroke(); if (h < 0.3) { c.fillStyle = rgba('#7FD3F2', 0.6); c.beginPath(); c.moveTo(X + T * 0.4, Y + H); c.lineTo(X + T * 0.5, Y + H * 0.45); c.lineTo(X + T * 0.6, Y + H); c.fill(); } }
    else if (bn === 'frost' || bn === 'icefield') { c.strokeStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(X + T * 0.2, Y + H * 0.2); c.lineTo(X + T * 0.35, Y + H * 0.8); c.stroke(); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); for (let i = 0; i < 3; i++) { const ix = X + T * (0.15 + i * 0.32 + h * 0.1); c.moveTo(ix - T * 0.06, Y); c.lineTo(ix, Y + H * (0.35 + (i % 2) * 0.2)); c.lineTo(ix + T * 0.06, Y); } c.fill(); }
    else if (bn === 'techno') { c.beginPath(); c.moveTo(X, Y + H * 0.5); c.lineTo(X + T, Y + H * 0.5); c.stroke(); if (h < 0.4) { c.fillStyle = 'rgba(77,240,255,.85)'; c.fillRect(X + T * 0.2, Y + H * 0.62, T * 0.6, Math.max(1, H * 0.08)); c.fillStyle = 'rgba(77,240,255,.3)'; c.fillRect(X + T * 0.15, Y + H * 0.55, T * 0.7, H * 0.22); } else { c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X + T * 0.3, Y + H * 0.15, T * 0.4, H * 0.25); } }
    else if (bn === 'steampunk') { c.beginPath(); c.moveTo(X, Y + H * 0.5); c.lineTo(X + T, Y + H * 0.5); c.stroke(); c.fillStyle = 'rgba(0,0,0,.4)'; [[0.15, 0.25], [0.85, 0.25], [0.15, 0.78], [0.85, 0.78]].forEach(([u, v]) => { c.beginPath(); c.arc(X + T * u, Y + H * v, Math.max(1, T * 0.035), 0, 6.283); c.fill(); }); if (h < 0.2) { c.strokeStyle = '#C9A24A'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(X + T * 0.3, Y); c.lineTo(X + T * 0.3, Y + H); c.stroke(); } }
    else if (bn === 'volcano') { c.beginPath(); c.moveTo(X, Y + H * (0.3 + h * 0.2)); c.lineTo(X + T * 0.5, Y + H * (0.45 - h * 0.1)); c.lineTo(X + T, Y + H * 0.35); c.stroke(); if (h < 0.35) { c.strokeStyle = 'rgba(255,111,60,.7)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(X + T * 0.4, Y + H); c.lineTo(X + T * 0.5, Y + H * 0.5); c.lineTo(X + T * 0.6, Y + H * 0.7); c.stroke(); } }
    else if (bn === 'forest' || bn === 'bloom') { c.fillStyle = rgba(bn === 'bloom' ? '#FF9BD2' : '#7FB05E', 0.5); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(X + T * (0.2 + i * 0.3 + h * 0.1), Y + H * (0.3 + (i % 2) * 0.4), T * 0.12, 0, 6.283); c.fill(); } }
    else if (bn === 'desert') { c.beginPath(); c.moveTo(X, Y + H * 0.5); c.lineTo(X + T, Y + H * 0.5); c.moveTo(X + T * 0.5, Y); c.lineTo(X + T * 0.5, Y + H * 0.5); c.stroke(); }
    else { c.beginPath(); c.moveTo(X, Y + H * 0.5); c.lineTo(X + T, Y + H * 0.5); c.stroke(); }
  }
  /* ---------- decals ---------- */
  function decal(c, d, T, lw) {
    const X = d.x * T, Y = d.y * T, s = T * 0.18 * d.s;
    c.save(); c.translate(X, Y);
    if (window.DECAL_EXT && DECAL_EXT[d.kind]) { try { DECAL_EXT[d.kind](c, d, s, lw, T); } catch (e) { console.error(e); } c.restore(); return; }
    switch (d.kind) {
      case 'moss': c.fillStyle = 'rgba(94,155,90,.55)'; c.beginPath(); c.ellipse(0, 0, s * 1.8, s * 0.9, d.rot, 0, 6.283); c.fill(); c.fillStyle = 'rgba(140,196,106,.5)'; c.beginPath(); c.ellipse(-s * 0.3, -s * 0.2, s, s * 0.45, d.rot, 0, 6.283); c.fill(); break;
      case 'crack': c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw * 0.7; c.rotate(d.rot); c.beginPath(); c.moveTo(-s * 1.6, 0); c.lineTo(-s * 0.4, s * 0.3); c.lineTo(s * 0.3, -s * 0.2); c.lineTo(s * 1.5, s * 0.25); c.moveTo(-s * 0.4, s * 0.3); c.lineTo(-s * 0.2, s * 1.1); c.stroke(); break;
      case 'pebbles': c.fillStyle = 'rgba(200,190,230,.35)'; [[-0.8, 0.2, 0.35], [0.4, -0.3, 0.28], [0.9, 0.4, 0.22]].forEach(([a, b, r]) => { c.beginPath(); c.ellipse(a * s, b * s, r * s * 1.4, r * s, 0, 0, 6.283); c.fill(); }); break;
      case 'bones': c.strokeStyle = '#E8E0CC'; c.lineWidth = Math.max(1.5, s * 0.35); c.lineCap = 'round'; c.rotate(d.rot); c.beginPath(); c.moveTo(-s * 1.2, 0); c.lineTo(s * 1.2, 0); c.stroke(); c.fillStyle = '#E8E0CC'; [-1.2, 1.2].forEach(a => { c.beginPath(); c.arc(a * s, -s * 0.25, s * 0.3, 0, 6.283); c.arc(a * s, s * 0.25, s * 0.3, 0, 6.283); c.fill(); }); break;
      case 'grass': c.strokeStyle = d.v % 2 ? '#8CC46A' : '#6FAE4E'; c.lineWidth = Math.max(1.2, lw * 0.8); c.lineCap = 'round'; c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(i * s * 0.35, s * 0.3); c.quadraticCurveTo(i * s * 0.4, -s * 0.4, i * s * 0.6 + s * 0.2, -s * (1 + (i % 2) * 0.4)); } c.stroke(); break;
      case 'flower': { const cols = ['#FF9BD2', '#FFE37A', '#FFFFFF', '#B983F5'][d.v]; c.strokeStyle = '#4E8A45'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(0, s * 0.6); c.lineTo(0, -s * 0.2); c.stroke(); c.fillStyle = cols; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; c.beginPath(); c.arc(Math.cos(a) * s * 0.35, -s * 0.4 + Math.sin(a) * s * 0.35, s * 0.28, 0, 6.283); c.fill(); } c.fillStyle = '#FFB447'; c.beginPath(); c.arc(0, -s * 0.4, s * 0.2, 0, 6.283); c.fill(); break; }
      case 'clover': c.fillStyle = '#4E9E44'; [0, 2.1, 4.2].forEach(a => { c.beginPath(); c.arc(Math.cos(a + d.rot) * s * 0.35, Math.sin(a + d.rot) * s * 0.35, s * 0.35, 0, 6.283); c.fill(); }); break;
      case 'shroomlet': c.fillStyle = '#F2E6D8'; c.fillRect(-s * 0.12, -s * 0.5, s * 0.24, s * 0.6); c.fillStyle = d.v % 2 ? '#C77BD9' : '#FF6F59'; c.beginPath(); c.arc(0, -s * 0.5, s * 0.45, Math.PI, 0); c.fill(); break;
      case 'puddle': c.fillStyle = 'rgba(40,80,70,.45)'; c.beginPath(); c.ellipse(0, 0, s * 2, s * 0.9, d.rot * 0.3, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(-s * 0.5, -s * 0.2, s * 0.6, s * 0.2, 0, 0, 6.283); c.fill(); break;
      case 'shard': c.fillStyle = ['rgba(127,211,242,.7)', 'rgba(179,156,255,.7)', 'rgba(255,155,210,.7)', 'rgba(127,211,242,.7)'][d.v]; c.rotate(d.rot * 0.3); c.beginPath(); c.moveTo(0, -s * 1.1); c.lineTo(s * 0.35, 0); c.lineTo(0, s * 0.3); c.lineTo(-s * 0.35, 0); c.closePath(); c.fill(); break;
      case 'glowmoss': c.fillStyle = 'rgba(127,211,242,.25)'; c.beginPath(); c.ellipse(0, 0, s * 1.8, s * 0.8, d.rot, 0, 6.283); c.fill(); c.fillStyle = 'rgba(200,245,255,.6)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(Math.cos(i * 1.7 + d.rot) * s, Math.sin(i * 1.7 + d.rot) * s * 0.4, s * 0.12, 0, 6.283); c.fill(); } break;
      case 'snow': c.fillStyle = 'rgba(255,255,255,.42)'; c.beginPath(); c.arc(-s * 0.7, 0, s * 0.8, 0, 6.283); c.arc(s * 0.3, -s * 0.2, s, 0, 6.283); c.arc(s * 1.1, s * 0.15, s * 0.6, 0, 6.283); c.fill(); break;
      case 'frostflower': c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI + d.rot; c.moveTo(Math.cos(a) * s, Math.sin(a) * s); c.lineTo(-Math.cos(a) * s, -Math.sin(a) * s); } c.stroke(); break;
      case 'ember': c.fillStyle = 'rgba(255,111,60,.5)'; c.beginPath(); c.ellipse(0, 0, s * 1.2, s * 0.5, d.rot, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,227,122,.6)'; c.beginPath(); c.arc(0, 0, s * 0.25, 0, 6.283); c.fill(); break;
      case 'ash': c.fillStyle = 'rgba(30,20,20,.4)'; c.beginPath(); c.ellipse(0, 0, s * 1.8, s * 0.7, d.rot, 0, 6.283); c.fill(); break;
      case 'goldinlay': c.strokeStyle = 'rgba(242,201,76,.75)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.arc(0, 0, s * 1.1, 0, 6.283); c.stroke(); GFX.star(c, 0, 0, s * 0.7, 'rgba(242,201,76,.8)', 0); break;
      case 'feather': c.rotate(d.rot); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, 0, s * 1.2, s * 0.35, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(160,170,200,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-s * 1.3, 0); c.lineTo(s * 1.1, 0); c.stroke(); break;
      case 'star': GFX.star(c, 0, 0, s * 0.8, 'rgba(255,227,122,.85)', 0); break;
      case 'rune': c.strokeStyle = 'rgba(224,123,240,.45)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.arc(0, 0, s * 1.4, 0, 6.283); c.moveTo(0, -s); c.lineTo(s * 0.8, s * 0.6); c.lineTo(-s * 0.8, s * 0.6); c.closePath(); c.stroke(); break;
      case 'cobweb': c.strokeStyle = 'rgba(230,230,240,.35)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * 3.14 + d.rot; c.moveTo(0, 0); c.lineTo(Math.cos(a) * s * 2, Math.sin(a) * s * 2); } c.arc(0, 0, s, 0, 3.14 + d.rot); c.stroke(); break;
      case 'carpet': c.fillStyle = 'rgba(140,42,79,.85)'; c.fillRect(-T * 1.5, -T * 0.5, T * 3, T + 0.5); c.fillStyle = 'rgba(242,201,76,.7)'; c.fillRect(-T * 1.5, -T * 0.5, T * 0.12, T + 0.5); c.fillRect(T * 1.38, -T * 0.5, T * 0.12, T + 0.5); break;
      case 'ripple': c.strokeStyle = 'rgba(150,100,40,.28)'; c.lineWidth = Math.max(1, lw * 0.7); c.rotate(d.rot * 0.2); c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(-s * 2.2, i * s * 0.7); c.quadraticCurveTo(0, i * s * 0.7 - s * 0.5, s * 2.2, i * s * 0.7); } c.stroke(); break;
      case 'circuit': c.strokeStyle = 'rgba(77,240,255,.5)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(-s * 1.6, 0); c.lineTo(-s * 0.4, 0); c.lineTo(-s * 0.4, s * 0.9); c.lineTo(s * 1.2, s * 0.9); c.moveTo(-s * 0.4, 0); c.lineTo(s * 0.6, -s * 0.9); c.stroke(); c.fillStyle = 'rgba(77,240,255,.85)'; [[-1.6, 0], [1.2, 0.9], [0.6, -0.9]].forEach(([a, b]) => { c.beginPath(); c.arc(a * s, b * s, s * 0.22, 0, 6.283); c.fill(); }); break;
      case 'vent': c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(-s * 1.4, -s * 0.9, s * 2.8, s * 1.8); c.fillStyle = 'rgba(120,140,180,.6)'; for (let i = 0; i < 4; i++) c.fillRect(-s * 1.2, -s * 0.7 + i * s * 0.45, s * 2.4, s * 0.18); break;
      case 'rivets': c.fillStyle = 'rgba(0,0,0,.4)'; [[-1.3, -1], [1.3, -1], [-1.3, 1], [1.3, 1]].forEach(([a, b]) => { c.beginPath(); c.arc(a * s, b * s, s * 0.28, 0, 6.283); c.fill(); }); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.strokeRect(-s * 1.7, -s * 1.4, s * 3.4, s * 2.8); break;
      case 'oil': c.fillStyle = 'rgba(20,10,5,.5)'; c.beginPath(); c.ellipse(0, 0, s * 1.9, s * 0.9, d.rot * 0.3, 0, 6.283); c.fill(); c.fillStyle = 'rgba(180,120,255,.25)'; c.beginPath(); c.ellipse(-s * 0.4, -s * 0.2, s * 0.8, s * 0.3, 0.2, 0, 6.283); c.fill(); break;
      case 'cog': c.fillStyle = 'rgba(201,162,74,.75)'; c.rotate(d.rot); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, a2 = a + 0.39; c.lineTo(Math.cos(a) * s * 1.1, Math.sin(a) * s * 1.1); c.lineTo(Math.cos(a2) * s * 0.8, Math.sin(a2) * s * 0.8); } c.closePath(); c.fill(); c.fillStyle = 'rgba(60,40,20,.7)'; c.beginPath(); c.arc(0, 0, s * 0.3, 0, 6.283); c.fill(); break;
      case 'leaf': c.rotate(d.rot); c.fillStyle = ['#C9A24A', '#D9573B', '#8CC46A', '#E8B425'][d.v]; c.beginPath(); c.ellipse(0, 0, s * 1.2, s * 0.55, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-s * 1.2, 0); c.lineTo(s * 1.2, 0); c.stroke(); break;
      case 'petalpile': { const cols = ['#FF9BD2', '#FFFFFF', '#FFE3F0', '#FFB7DC']; for (let i = 0; i < 5; i++) { c.fillStyle = cols[(i + d.v) % 4]; c.beginPath(); c.ellipse(Math.cos(i * 1.3 + d.rot) * s * 0.9, Math.sin(i * 1.3 + d.rot) * s * 0.5, s * 0.5, s * 0.28, i + d.rot, 0, 6.283); c.fill(); } break; }
    }
    c.restore();
  }

  /* ---------- backdrops (what you see through gaps) ---------- */
  const patCache = {};
  // a backdrop's repeating picture, made with k of the screen's pixels to each of its own: made at the screen's own
  // resolution and laid down pixel for pixel at whole pixels (see pinner), a pattern costs a tenth of what it does
  // enlarged on the way, where the drawing is not done by the graphics chip
  function pattern(kind, k) {
    k = k || 1; const key = kind + '@' + k;
    if (patCache[key]) return patCache[key];
    const S = kind === 'lava' ? 192 : 128, N = Math.max(1, Math.round(S * k)), cv = mk(N, N), c = cv.getContext('2d');
    if (kind === 'lava') { const L = lavaTile(); if (N === S) c.drawImage(L, 0, 0); else { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(L, 0, 0, N, N); } }
    else { c.scale(N / S, N / S); paintTile(c, kind, S); }
    patCache[key] = c.createPattern(cv, 'repeat');
    return patCache[key];
  }
  // the lava's cracks are worked out pixel by pixel, once, and enlarged for a sharper screen
  let lavaC = null;
  function lavaTile() {
    if (lavaC) return lavaC;
    const S = 192, cv = mk(S, S), c = cv.getContext('2d');
    let rs = 99; const R = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
    c.fillStyle = '#FF6A1F'; c.fillRect(0, 0, S, S);
    const pts = []; for (let i = 0; i < 44; i++) pts.push([R() * S, R() * S]);
    const img = c.getImageData(0, 0, S, S), d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let d1 = 1e9, d2 = 1e9;
      for (const [px, py] of pts) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const dd = (x - px - ox) ** 2 + (y - py - oy) ** 2; if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
      const e = Math.sqrt(d2) - Math.sqrt(d1), k = (y * S + x) * 4;
      if (e > 2.4) { const f = Math.min(1, (e - 2.4) / 9); d[k] = 245 - f * 60; d[k + 1] = 110 - f * 50; d[k + 2] = 35 - f * 15; }
      else { const f = e / 2.4; d[k] = 255; d[k + 1] = 240 - f * 120; d[k + 2] = 140 - f * 100; }
    }
    c.putImageData(img, 0, 0);
    lavaC = cv; return cv;
  }
  function paintTile(c, kind, S) {
    let rs = 99; const R = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
    if (window.GAP_EXT && GAP_EXT[kind]) { GAP_EXT[kind].paint(c, S, R); return; }
    if (kind === 'water') {
      c.fillStyle = '#1E4A47'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 26; i++) { const x = R() * S, y = R() * S, w = 8 + R() * 18; c.strokeStyle = `rgba(150,230,210,${0.08 + R() * 0.14})`; c.lineWidth = 1.5; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.quadraticCurveTo(x + ox, y + oy - 3, x + ox + w, y + oy); c.stroke(); } }
    } else if (kind === 'stars') {
      for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${0.25 + R() * 0.7})`; const r = R() < 0.1 ? 1.4 : 0.8; c.beginPath(); c.arc(R() * S, R() * S, r, 0, 6.283); c.fill(); }
      c.fillStyle = 'rgba(224,123,240,.6)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(R() * S, R() * S, 1, 0, 6.283); c.fill(); }
    } else if (kind === 'deep') {
      for (let i = 0; i < 40; i++) { const x = R() * S, y = R() * S; c.fillStyle = ['rgba(127,211,242,.5)', 'rgba(179,156,255,.5)', 'rgba(255,155,210,.4)'][i % 3]; c.beginPath(); c.moveTo(x, y - 3); c.lineTo(x + 1.5, y); c.lineTo(x, y + 3); c.lineTo(x - 1.5, y); c.fill(); }
    } else if (kind === 'ice') {
      for (let i = 0; i < 30; i++) { const x = R() * S, y = R() * S; c.strokeStyle = `rgba(190,230,255,${0.15 + R() * 0.25})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6 - R() * 12, y + 10); c.stroke(); }
    } else if (kind === 'sand') {
      c.fillStyle = '#E2BE78'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 22; i++) { const y = R() * S, w = 20 + R() * 40; c.strokeStyle = `rgba(160,110,50,${0.12 + R() * 0.16})`; c.lineWidth = 1.5; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const x = R() * S; c.beginPath(); c.moveTo(x + ox - w, y + oy); c.quadraticCurveTo(x + ox, y + oy - 5, x + ox + w, y + oy); c.stroke(); } }
      for (let i = 0; i < 12; i++) { c.fillStyle = `rgba(255,255,255,${0.1 + R() * 0.15})`; c.beginPath(); c.ellipse(R() * S, R() * S, 10 + R() * 14, 3 + R() * 3, 0.3, 0, 6.283); c.fill(); }
    } else if (kind === 'icewater') {
      c.fillStyle = '#16324A'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 18; i++) { const x = R() * S, y = R() * S, w = 10 + R() * 20; c.strokeStyle = `rgba(190,230,255,${0.1 + R() * 0.16})`; c.lineWidth = 1.5; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.quadraticCurveTo(x + ox, y + oy - 3, x + ox + w, y + oy); c.stroke(); } }
      for (let i = 0; i < 6; i++) { const x = R() * S, y = R() * S, r = 6 + R() * 9; c.fillStyle = 'rgba(230,243,251,.85)'; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x - r * 0.4, y - r * 0.6); c.lineTo(x + r * 0.5, y - r * 0.5); c.lineTo(x + r, y + r * 0.2); c.lineTo(x + r * 0.2, y + r * 0.6); c.lineTo(x - r * 0.6, y + r * 0.4); c.closePath(); c.fill(); }
    } else if (kind === 'grid') {
      c.fillStyle = '#05070F'; c.fillRect(0, 0, S, S);
      c.strokeStyle = 'rgba(77,240,255,.35)'; c.lineWidth = 1; for (let i = 0; i <= S; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, S); c.moveTo(0, i); c.lineTo(S, i); c.stroke(); }
      for (let i = 0; i < 8; i++) { c.fillStyle = `rgba(77,240,255,${0.3 + R() * 0.5})`; c.beginPath(); c.arc(Math.floor(R() * 4) * 32, Math.floor(R() * 4) * 32, 2, 0, 6.283); c.fill(); }
    } else if (kind === 'coolant') {
      // glowing teal coolant: dark depth, bright drifting veins, a few bubbles
      c.fillStyle = '#0B2A2E'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 22; i++) { const x = R() * S, y = R() * S, w = 10 + R() * 22; c.strokeStyle = `rgba(63,224,200,${0.12 + R() * 0.25})`; c.lineWidth = 1 + R() * 1.5; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.bezierCurveTo(x + ox - w * 0.3, y + oy - 6, x + ox + w * 0.3, y + oy + 6, x + ox + w, y + oy); c.stroke(); } }
      for (let i = 0; i < 10; i++) { c.strokeStyle = 'rgba(190,255,240,.45)'; c.lineWidth = 1; c.beginPath(); c.arc(R() * S, R() * S, 1.5 + R() * 2.5, 0, 6.283); c.stroke(); }
    } else if (kind === 'plasma') {
      // a void lit by crackling violet energy: forked filaments and sparks
      c.fillStyle = '#0A0414'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 9; i++) { let x = R() * S, y = R() * S; c.strokeStyle = `rgba(196,82,255,${0.25 + R() * 0.35})`; c.lineWidth = 1 + R(); c.beginPath(); c.moveTo(x, y); for (let k2 = 0; k2 < 5; k2++) { x += (R() - 0.5) * 22; y += (R() - 0.5) * 22; c.lineTo(x, y); } c.stroke(); }
      for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(255,${180 + Math.floor(R() * 75)},255,${0.3 + R() * 0.6})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.15 ? 1.5 : 0.8, 0, 6.283); c.fill(); }
    } else if (kind === 'river') {
      c.fillStyle = '#245C6A'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 26; i++) { const x = R() * S, y = R() * S, w = 8 + R() * 18; c.strokeStyle = `rgba(190,245,230,${0.08 + R() * 0.16})`; c.lineWidth = 1.5; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.quadraticCurveTo(x + ox, y + oy - 3, x + ox + w, y + oy); c.stroke(); } }
    } else if (kind === 'pond') {
      c.fillStyle = '#4FA0B8'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 24; i++) { const x = R() * S, y = R() * S, w = 8 + R() * 18; c.strokeStyle = `rgba(255,255,255,${0.1 + R() * 0.18})`; c.lineWidth = 1.5; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.quadraticCurveTo(x + ox, y + oy - 3, x + ox + w, y + oy); c.stroke(); } }
      for (let i = 0; i < 5; i++) { const x = R() * S, y = R() * S; c.fillStyle = '#FF9BD2'; c.beginPath(); for (let j = 0; j < 5; j++) { const a = j / 5 * 6.283; c.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3.5, 2, a, 0, 6.283); } c.fill(); c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(x, y, 2, 0, 6.283); c.fill(); }
    }
  }
  // where a picture is laid down pixel for pixel: the screen's scale k, the nearest whole pixel to a place (x, y), and a
  // pattern pinned there with its own pixels on the screen's (a canvas turned or stretched unevenly is left as it is, and so
  // is a screen of coarse pixels, where a whole pixel is a step the eye can see)
  function pinner(c) {
    const M = c.getTransform(), ok = !M.b && !M.c && M.a === M.d && M.a >= 1.5, k = ok ? M.a : 1;
    const at = (v, e0) => ok ? (Math.round(v * k + e0) - e0) / k : v;
    return { k, x: v => at(v, M.e), y: v => at(v, M.f), pin(p, e, f) { if (p.setTransform) p.setTransform(new DOMMatrix([1 / k, 0, 0, 1 / k, at(e, M.e), at(f, M.f)])); } };
  }
  // a vertical gradient as a narrow column at the screen's resolution, repeated across: copied, not worked out afresh for
  // every pixel of the screen (a column a single pixel wide is not copied quickly, one a few dozen wide is)
  const colCache = new Map();
  function colGrad(top, bot, H, k) {
    const h = Math.max(1, Math.round(H * k)), key = top + '|' + bot + '|' + h;
    let p = colCache.get(key); if (p) return p;
    const cv = mk(32, h), x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, 32, h);
    p = x.createPattern(cv, 'repeat'); if (colCache.size >= 8) colCache.delete(colCache.keys().next().value); colCache.set(key, p); return p;
  }
  // a cloud, made at the size it is drawn (sc) at the screen's resolution
  let cloudC = null;
  function cloud(tint, k, sc) {
    k = k || 1; sc = sc || 1; const key = tint + '@' + k + '@' + sc;
    cloudC = cloudC || {};
    if (cloudC[key]) return cloudC[key];
    const cv = mk(220 * sc * k, 110 * sc * k), c = cv.getContext('2d'); c.scale(sc * k, sc * k);
    [[60, 70, 38], [100, 55, 48], [150, 66, 40], [125, 80, 34], [80, 82, 30]].forEach(([x, y, r]) => { const g = c.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, tint); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); });
    cloudC[key] = cv;
    return cv;
  }
  // a glow as big as part of the screen, made once at that size (when it is not too big to keep) and copied
  const glowBig = new Map();
  function bigGlow(c, P, col, x, y, w) {
    const n = Math.round(w * P.k);
    if (n * n > 640000) { blitSized(c, glowSprite(col), x, y, w, w); return; }
    const key = col + '@' + n; let cv = glowBig.get(key);
    if (!cv) { cv = mk(n, n); const g = cv.getContext('2d'); g.imageSmoothingEnabled = true; blitSized(g, glowSprite(col), 0, 0, n, n); if (glowBig.size >= 4) glowBig.delete(glowBig.keys().next().value); glowBig.set(key, cv); }
    c.drawImage(cv, P.x(x), P.y(y), n / P.k, n / P.k);
  }
  /* paint the backdrop for a gap type across the whole screen. ox, oy: camera offset in pixels */
  function backdrop(c, kind, W, H, camX, camY, T, t) {
    const wx = camX * T, wy = camY * T, P = pinner(c), k = P.k;
    const pat = (p, par, sx, sy) => { P.pin(p, -wx * par + (sx || 0), -wy * par + (sy || 0)); c.fillStyle = p; c.fillRect(0, 0, W, H); };
    const grad = (top, bot) => { const p = colGrad(top, bot, H, k); P.pin(p, 0, 0); c.fillStyle = p; c.fillRect(0, 0, W, H); };
    switch (kind) {
      case 'water': {
        pat(pattern('water', k), 1, W / 2 + t * 6, H / 2 + Math.sin(t * 0.7) * 6);
        break;
      }
      case 'lava': {
        pat(pattern('lava', k), 1, W / 2 + t * 3, H / 2 + t * 1.5);
        break;
      }
      case 'sky': case 'heaven': {
        const hv = kind === 'heaven';
        grad(hv ? '#FFC2DD' : '#79C3EE', hv ? '#B9D3FF' : '#DFF4FF');
        if (hv) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12; c.fillStyle = '#FFF3B0'; for (let i = 0; i < 4; i++) { const x = ((i * 0.31 + 0.1) * W - wx * 0.1) % (W * 1.3); c.beginPath(); c.moveTo(x, 0); c.lineTo(x + W * 0.12, 0); c.lineTo(x - W * 0.2, H); c.lineTo(x - W * 0.35, H); c.fill(); } c.restore(); }
        const tint = hv ? '#FFE3F0' : '#E6F3FF', span = 520;
        for (let layer = 0; layer < 2; layer++) {
          const par = layer ? 0.55 : 0.3, sc = layer ? 1 : 0.6, cv = cloud(tint, k, sc), cw = cv.width / k, chh = cv.height / k;
          c.globalAlpha = layer ? 0.9 : 0.6;
          for (let i = -1; i < 4; i++) for (let j = -1; j < 4; j++) {
            const gx = i * span + ((t * (layer ? 9 : 5) - wx * par) % span + span) % span - span * 0.5, gy = j * span * 0.6 + ((-wy * par) % (span * 0.6) + span * 0.6) % (span * 0.6) - span * 0.3;
            const jitter = th(i + 7 * layer, j, 3) * 160;
            if (gx + jitter > W + 50 || gy > H + 50 || gx + jitter < -260 || gy < -150) continue;
            c.drawImage(cv, P.x(gx + jitter), P.y(gy + th(i, j + layer, 9) * 120), cw, chh);
          }
        }
        c.globalAlpha = 1;
        break;
      }
      case 'void': {
        c.fillStyle = '#07040C'; c.fillRect(0, 0, W, H);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; bigGlow(c, P, '#7B2A9E', W * 0.1 - (wx * 0.08) % W, H * 0.2, W * 0.8); c.restore();
        pat(pattern('stars', k), 0.3, 0, 0);
        break;
      }
      case 'abyss': {
        c.fillStyle = '#06070F'; c.fillRect(0, 0, W, H);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; bigGlow(c, P, '#2F4AB7', -W * 0.2 - (wx * 0.1) % W, H * 0.1, W * 1.4); c.restore();
        pat(pattern('deep', k), 0.35, 0, 0);
        break;
      }
      case 'iceabyss': {
        grad('#16325A', '#060C18');
        pat(pattern('ice', k), 0.4, 0, t * 4);
        break;
      }
      case 'sand': { pat(pattern('sand', k), 1, W / 2 + t * 2, H / 2); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.08 + 0.04 * Math.sin(t * 1.3); c.fillStyle = '#FFF0C2'; c.fillRect(0, 0, W, H * 0.4); c.restore(); break; }
      case 'icewater': { pat(pattern('icewater', k), 1, W / 2 + t * 3, H / 2 + Math.sin(t * 0.6) * 4); break; }
      case 'grid': { pat(pattern('grid', k), 1, W / 2, H / 2 + ((t * 14) % 32)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18; bigGlow(c, P, '#1C5A80', W * 0.1 - (wx * 0.05) % W, H * 0.25, W * 0.8); c.restore(); break; }
      case 'river': { pat(pattern('river', k), 1, W / 2 + t * 10, H / 2 + Math.sin(t * 0.7) * 5); break; }
      case 'coolant': { pat(pattern('coolant', k), 1, W / 2 + t * 5, H / 2 + Math.sin(t * 0.5) * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 + 0.05 * Math.sin(t * 1.7); bigGlow(c, P, '#3FE0C8', W * 0.2 - (wx * 0.05) % W, H * 0.3, W * 0.9); c.restore(); break; }
      case 'plasma': { pat(pattern('plasma', k), 0.4, t * 3, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28 + 0.08 * Math.sin(t * 2.3); bigGlow(c, P, '#8A2BD8', W * 0.05 - (wx * 0.06) % W, H * 0.2, W * 1.1); c.restore(); break; }
      case 'pond': { pat(pattern('pond', k), 1, W / 2 + t * 4, H / 2 + Math.sin(t * 0.8) * 5); break; }
      default: if (window.GAP_EXT && GAP_EXT[kind]) GAP_EXT[kind].back(c, { pat, grad, pattern, k, P, W, H, t, wx, wy, bigGlow }); else grad('#0C0918', '#040308');
    }
  }
  /* a single gap tile drawn in another land's style (a lava pool on a sky floor and so on) */
  function gapStyle(c, kind, camX, camY, T, W, H) {
    const wx = camX * T, wy = camY * T, P = pinner(c), k = P.k;
    const p = kind === 'water' ? pattern('water', k) : kind === 'lava' ? pattern('lava', k) : kind === 'void' ? pattern('stars', k) : kind === 'iceabyss' ? pattern('ice', k) : kind === 'sand' ? pattern('sand', k) : kind === 'icewater' ? pattern('icewater', k) : kind === 'grid' ? pattern('grid', k) : kind === 'river' ? pattern('river', k) : kind === 'pond' ? pattern('pond', k) : kind === 'coolant' ? pattern('coolant', k) : kind === 'plasma' ? pattern('plasma', k) : window.GAP_EXT && GAP_EXT[kind] ? pattern(kind, k) : pattern('deep', k);
    P.pin(p, -wx + W / 2, -wy + H / 2);
    return { base: { water: '#1B4442', lava: '#FF6A1F', sky: '#9ED8F5', heaven: '#E8DDF8', void: '#07040C', abyss: '#06070F', iceabyss: '#0E2440', pit: '#05040A', sand: '#E2BE78', icewater: '#16324A', grid: '#05070F', river: '#245C6A', pond: '#4FA0B8', coolant: '#0B2A2E', plasma: '#0A0414' }[kind] || (window.GAP_EXT && GAP_EXT[kind] && GAP_EXT[kind].base) || '#05040A', pat: kind === 'sky' || kind === 'heaven' ? null : p };
  }
  return { PROPS, propSprite, chunk, CH, backdrop, gapStyle, decal, pattern, cloud };
})();
