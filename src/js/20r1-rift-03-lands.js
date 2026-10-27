/* ---------- The Mouth Beneath the Dunes: the two further lands of rift 3, and the night's skeletons ----------
   Section 2, the Rust Flats: an orange, sun-baked, cracked desert; huge layered red rocks, and glowing pink crystals
   pushing up out of the clay. Section 3, the Moonlit Dunes: the same sand at night, everything washed blue, dark, lit by
   green fireflies; the bones of the desert walk here (dune skeletons with scimitars, bone archers with bows). */
(() => {
  const TAU = Math.PI * 2;
  BIOMES.mesa = { name: 'The Rust Flats', rift: true, haze: { col: '230,112,50', veil: 0.14, edge: 0.32, tint: 0.07 }, tile: 'desert', out: true, dark: 0.04, bg: '#3A1408', gap: 'pit', mud: ['#B8642C', '#C06A30'], mudSpot: 'rgba(255,200,150,.2)', ambient: 'sand', accent: '#FF5FC4', light: '#FFD0A0',
    floor: ['#D9823F', '#D07838', '#E08C4A'], grout: '#A8572A', hi: '#F2A866', top: '#7A2E1C', face: '#6A2616', faceD: '#4E1A0E', cliff: '#6A2616', deco: '#FF5FC4', path: ['#C86E32', '#BF672E'],
    props: ['mesarock', 'pinkcrystal', 'mesarock', 'pinkcrystal', 'mesarock', 'bones'], propN: [4, 3], hazard: 'sandspout', grade: 'rgba(255,140,60,.1)', fog: '#4A1A0C', darkRGB: '50,18,8' };
  BIOMES.nightdune = { name: 'The Moonlit Dunes', rift: true, haze: { col: '60,96,190', veil: 0.13, edge: 0.34, tint: 0.12 }, tile: 'desert', out: true, dark: 0.56, bg: '#060A1A', gap: 'pit', mud: ['#2E4470', '#34497A'], mudSpot: 'rgba(160,200,255,.16)', ambient: 'greenflies', accent: '#7CFF6A', light: '#B8FFB0',
    floor: ['#36507F', '#324A78', '#3D588A'], grout: '#263A62', hi: '#5874A8', top: '#1E2740', face: '#161C30', faceD: '#0E1222', cliff: '#161C30', deco: '#7CFF6A', path: ['#35507E', '#314A76'],
    props: ['nightrock', 'bones', 'nightrock', 'deadshrub', 'skullpile'], propN: [3, 3], hazard: 'sandspout', grade: 'rgba(70,110,220,.12)', fog: '#0A1028', darkRGB: '4,8,30' };
  BIOME_ORDER.push('mesa', 'nightdune');
  DARK_COL.mesa = '50,18,8'; DARK_COL.nightdune = '4,8,30';

  /* ---- props ---- */
  const { PROPS } = DunWorld, { LN, shade, stroke, spec } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(0,0,0,${a || 0.28})`; c.beginPath(); c.ellipse(0, 0, T * w, T * w * 0.32, 0, 0, TAU); c.fill(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  Object.assign(PROPS, {
    /* a huge layered red rock: a wide stack of sun-baked strata, darker bands, a flat top */
    mesarock(c, T, v) {
      const lw = lw0(T), w = T * (0.95 + (v % 2) * 0.12), h = T * (1.55 + (v % 3) * 0.22), lean = (v - 1.5) * 0.05 * T;
      shadowEll(c, T, 1.0, 0.32);
      c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w * 0.92, -h * 0.35); c.lineTo(-w * 0.78 + lean, -h * 0.62); c.lineTo(-w * 0.7 + lean, -h * 0.9); c.quadraticCurveTo(-w * 0.55 + lean, -h * 1.02, -w * 0.1 + lean, -h); c.lineTo(w * 0.55 + lean, -h * 0.98); c.quadraticCurveTo(w * 0.78 + lean, -h * 0.9, w * 0.74 + lean, -h * 0.7); c.lineTo(w * 0.86, -h * 0.4); c.lineTo(w, 0); c.closePath();
      const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#E2884A'); g.addColorStop(0.45, '#C4602E'); g.addColorStop(1, '#7E321A'); c.fillStyle = g; c.fill();
      c.save(); c.clip(); [0.22, 0.44, 0.66, 0.84].forEach((k, i) => { c.fillStyle = i % 2 ? 'rgba(90,30,14,.28)' : 'rgba(255,190,130,.16)'; c.beginPath(); c.moveTo(-w * 1.1, -h * k); c.quadraticCurveTo(0, -h * (k + 0.03), w * 1.1, -h * (k - 0.02)); c.lineTo(w * 1.1, -h * (k - 0.09)); c.quadraticCurveTo(0, -h * (k - 0.05), -w * 1.1, -h * (k - 0.07)); c.closePath(); c.fill(); });
      c.fillStyle = 'rgba(255,214,170,.35)'; c.beginPath(); c.ellipse(lean + w * 0.2, -h * 0.98, w * 0.6, T * 0.1, 0, 0, TAU); c.fill(); c.restore();
      c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w * 0.92, -h * 0.35); c.lineTo(-w * 0.78 + lean, -h * 0.62); c.lineTo(-w * 0.7 + lean, -h * 0.9); c.quadraticCurveTo(-w * 0.55 + lean, -h * 1.02, -w * 0.1 + lean, -h); c.lineTo(w * 0.55 + lean, -h * 0.98); c.quadraticCurveTo(w * 0.78 + lean, -h * 0.9, w * 0.74 + lean, -h * 0.7); c.lineTo(w * 0.86, -h * 0.4); c.lineTo(w, 0); stroke(c, lw);
      c.strokeStyle = 'rgba(60,20,8,.45)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(w * 0.2, -h * 0.95); c.lineTo(w * 0.05, -h * 0.6); c.lineTo(w * 0.22, -h * 0.3); c.moveTo(-w * 0.45, -h * 0.5); c.lineTo(-w * 0.3, -h * 0.25); c.stroke();
      // (now and then a pink crystal breaking out of its foot)
      if (v % 2 === 0) { c.save(); c.translate(w * 0.6, -T * 0.05); c.scale(0.55, 0.55); PROPS.pinkcrystal(c, T, 1, null, 'small'); c.restore(); }
    },
    /* glowing pink crystals pushing up out of the clay, a halo round them */
    pinkcrystal(c, T, v, B, small) {
      const lw = lw0(T);
      if (!small) { shadowEll(c, T, 0.5, 0.22); glowIn(c, 0, -T * 0.6, T * 1.05, '#FF5FC4', 0.5); }
      const shards = [[-0.3, 0.8, -0.4, 0.15], [0.28, 0.95, 0.35, 0.16], [0, 1.5, 0.04, 0.21], [0.48, 0.55, 0.7, 0.11], [-0.52, 0.5, -0.75, 0.1]];
      shards.forEach(([x, h, a, w], i) => { if (v % 2 && i === 4) return;
        c.save(); c.translate(x * T, 0); c.rotate(a * 0.5);
        c.beginPath(); c.moveTo(-w * T, 0); c.lineTo(-w * T, -h * T * 0.72); c.lineTo(0, -h * T); c.lineTo(w * T, -h * T * 0.72); c.lineTo(w * T, 0); c.closePath();
        const g = c.createLinearGradient(-w * T, 0, w * T, 0); g.addColorStop(0, '#FFD6F0'); g.addColorStop(0.5, '#FF6FCB'); g.addColorStop(1, '#B0257E'); c.fillStyle = g; c.fill(); stroke(c, lw);
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(-w * T * 0.55, -T * 0.05); c.lineTo(-w * T * 0.55, -h * T * 0.66); c.lineTo(-w * T * 0.1, -h * T * 0.86); c.lineTo(-w * T * 0.1, -T * 0.05); c.closePath(); c.fill();
        c.restore(); });
      glowIn(c, 0, -T * 0.9, T * 0.45, '#FFFFFF', 0.35);
    },
    /* a night rock: a rounded dune stone, cold blue, moonlight along its top */
    nightrock(c, T, v) {
      const lw = lw0(T), w = T * (0.6 + (v % 2) * 0.18), h = T * (0.75 + (v % 3) * 0.2);
      shadowEll(c, T, w / T * 0.95, 0.35);
      c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(-w * 1.05, -h * 0.85, -w * 0.25, -h); c.quadraticCurveTo(w * 0.6, -h * 1.05, w, -h * 0.35); c.quadraticCurveTo(w * 1.05, 0, w * 0.6, T * 0.04); c.closePath();
      c.fillStyle = shade(c, '#4A5C88', Math.max(w, h), -w * 0.2, -h * 0.6, 0.4); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(190,215,255,.55)'; c.lineWidth = lw * 1.1; c.beginPath(); c.moveTo(-w * 0.7, -h * 0.78); c.quadraticCurveTo(-w * 0.2, -h * 1.0, w * 0.45, -h * 0.85); c.stroke();
      c.strokeStyle = 'rgba(10,14,30,.4)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(w * 0.1, -h * 0.8); c.lineTo(w * 0.25, -h * 0.4); c.lineTo(w * 0.1, -h * 0.15); c.stroke();
    },
    /* a dead desert shrub: bare black twigs */
    deadshrub(c, T, v) {
      const lw = lw0(T); shadowEll(c, T, 0.4, 0.25); c.lineCap = 'round';
      const br = (x, y, a, l, d) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.strokeStyle = LN; c.lineWidth = lw * (1.6 + d); c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = '#3A3550'; c.lineWidth = lw * (0.6 + d * 0.6); c.stroke(); if (d > 0) { br(x2, y2, a - 0.5, l * 0.62, d - 1); br(x2, y2, a + 0.45, l * 0.6, d - 1); } };
      br(0, 0, -Math.PI / 2 - 0.3, T * 0.45, 2); br(0, 0, -Math.PI / 2 + 0.35, T * 0.4, 2);
    },
    /* a heap of old bones with a skull on top, its sockets a faint green */
    skullpile(c, T, v) {
      const lw = lw0(T); shadowEll(c, T, 0.5, 0.3);
      [[-0.3, -0.1, 0.5], [0.25, -0.08, -0.4], [0, -0.2, 0.15], [-0.1, -0.03, 1.3]].forEach(([x, y, a]) => { c.save(); c.translate(x * T, y * T); c.rotate(a); c.fillStyle = '#C9CFDD'; c.beginPath(); c.rect(-T * 0.26, -T * 0.04, T * 0.52, T * 0.08); c.fill(); stroke(c, lw * 0.6); [-1, 1].forEach(s => { c.beginPath(); c.arc(s * T * 0.26, -T * 0.035, T * 0.06, 0, TAU); c.arc(s * T * 0.26, T * 0.035, T * 0.06, 0, TAU); c.fill(); }); c.restore(); });
      c.beginPath(); c.moveTo(-T * 0.24, -T * 0.25); c.bezierCurveTo(-T * 0.3, -T * 0.72, T * 0.3, -T * 0.72, T * 0.24, -T * 0.25); c.lineTo(T * 0.15, -T * 0.16); c.lineTo(-T * 0.15, -T * 0.16); c.closePath(); c.fillStyle = shade(c, '#D8DDE8', T * 0.3, 0, -T * 0.45, 0.3); c.fill(); stroke(c, lw);
      c.fillStyle = '#10142A'; c.beginPath(); c.ellipse(-T * 0.1, -T * 0.38, T * 0.065, T * 0.075, 0, 0, TAU); c.ellipse(T * 0.1, -T * 0.38, T * 0.065, T * 0.075, 0, 0, TAU); c.fill();
      glowIn(c, -T * 0.1, -T * 0.38, T * 0.12, '#7CFF6A', 0.6); glowIn(c, T * 0.1, -T * 0.38, T * 0.12, '#7CFF6A', 0.6);
    },
  });

  /* ---- the night's skeletons ---- */
  const BONE = '#E4E0D2', BONED = '#A9A391', EYE = '#7CFF6A', RAG = '#2A3150', INK = '#2B2433';
  Object.assign(MON, {
    skelwar: { name: 'Dune skeleton', from: 999, hp: 230, spd: 1.55, r: 0.46, dmg: 16, xp: 13, coin: 0.8, color: BONE, bio: ['nightdune'], pile: true, tip: 'Raises its scimitar, then a wide cut in front of it: step aside or behind. Knocked down it falls to a pile of bones and gets back up: smash the pile.', kit: [] },
    skelarcher: { name: 'Bone archer', from: 999, hp: 140, spd: 1.45, r: 0.42, dmg: 12, xp: 11, coin: 0.7, color: BONE, bio: ['nightdune'], pile: true, tip: 'Keeps its distance and draws a green-lit arrow (a line shows where): step off the line. It falls to a pile and rises too.', kit: [] },
  });
  const { MP, EXT, NF, lwOf } = DunArt;
  const bone = (c, x0, y0, x1, y1, w) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = BONE; c.lineWidth = w; c.stroke(); };
  const knob = (c, x, y, r) => { c.fillStyle = BONE; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = Math.max(1, r * 0.5); c.stroke(); };
  function eyes(c, x, y, r, k) { [-1, 1].forEach(s => { c.fillStyle = '#0C0F1E'; c.beginPath(); c.ellipse(x + s * r * 0.32, y, r * 0.2, r * 0.24, s * 0.2, 0, TAU); c.fill(); glowIn(c, x + s * r * 0.32, y, r * (0.35 + 0.15 * k), EYE, 0.75 + 0.25 * k); c.fillStyle = '#D8FFD0'; c.beginPath(); c.arc(x + s * r * 0.32, y + r * 0.02, r * 0.07, 0, TAU); c.fill(); }); }
  function skullHead(c, x, y, r, k, jaw) {
    c.beginPath(); c.moveTo(x - r * 0.62, y + r * 0.05); c.bezierCurveTo(x - r * 0.82, y - r * 1.05, x + r * 0.82, y - r * 1.05, x + r * 0.62, y + r * 0.05); c.quadraticCurveTo(x + r * 0.5, y + r * 0.3, x + r * 0.32, y + r * 0.32); c.lineTo(x - r * 0.32, y + r * 0.32); c.quadraticCurveTo(x - r * 0.5, y + r * 0.3, x - r * 0.62, y + r * 0.05); c.closePath();
    c.fillStyle = shade(c, '#F2EEE2', r * 0.8, x - r * 0.1, y - r * 0.4, 0.3); c.fill(); stroke(c, lwOf(r * 2));
    c.beginPath(); c.moveTo(x - r * 0.36, y + r * 0.3 + jaw); c.lineTo(x - r * 0.3, y + r * 0.58 + jaw); c.lineTo(x + r * 0.3, y + r * 0.58 + jaw); c.lineTo(x + r * 0.36, y + r * 0.3 + jaw); c.closePath(); c.fillStyle = '#DAD4C2'; c.fill(); stroke(c, lwOf(r * 2) * 0.8);
    c.fillStyle = '#FFFFFF'; for (let i = 0; i < 4; i++) c.fillRect(x - r * 0.26 + i * r * 0.14, y + r * 0.26 + jaw * 0.4, r * 0.1, r * 0.1);
    c.fillStyle = '#0C0F1E'; c.beginPath(); c.moveTo(x - r * 0.05, y + r * 0.16); c.lineTo(x + r * 0.05, y + r * 0.16); c.lineTo(x, y + r * 0.04); c.closePath(); c.fill();
    eyes(c, x, y - r * 0.12, r, k); spec(c, x - r * 0.35, y - r * 0.55, r * 0.14, r * 0.08, 0.55);
  }
  function pile(c, r) {
    [[-0.6, 0.62, 0.4], [0.5, 0.66, -0.3], [0, 0.78, 0.1], [-0.2, 0.5, 1.2], [0.3, 0.45, 2.1]].forEach(([x, y, a]) => { c.save(); c.translate(x * r, y * r); c.rotate(a); c.beginPath(); c.rect(-r * 0.45, -r * 0.07, r * 0.9, r * 0.14); c.fillStyle = BONE; c.fill(); stroke(c, lwOf(r) * 0.7); [-1, 1].forEach(s => { c.beginPath(); c.arc(s * r * 0.45, -r * 0.06, r * 0.1, 0, TAU); c.arc(s * r * 0.45, r * 0.06, r * 0.1, 0, TAU); c.fill(); }); c.restore(); });
    skullHead(c, 0, r * 0.3, r * 0.5, 0.2, 0);
  }
  /* the body common to both: legs stepping, a pelvis, a spine, a cage of ribs; returns the shoulder points */
  function body(c, r, ph, lean) {
    const lw = lwOf(r), st = Math.sin(ph * TAU) * r * 0.22;
    // legs
    [-1, 1].forEach(s => { const fx = s * r * 0.3 + s * st, kx = s * r * 0.26 + s * st * 0.5; bone(c, s * r * 0.2, r * 0.28, kx, r * 0.62, lw * 1.3); bone(c, kx, r * 0.62, fx, r * 0.95, lw * 1.2); knob(c, kx, r * 0.62, lw * 0.9); c.fillStyle = BONED; c.beginPath(); c.ellipse(fx + s * r * 0.06, r * 0.98, r * 0.14, r * 0.06, 0, 0, TAU); c.fill(); stroke(c, lw * 0.6); });
    // pelvis
    c.beginPath(); c.ellipse(0, r * 0.26, r * 0.32, r * 0.13, 0, 0, TAU); c.fillStyle = BONED; c.fill(); stroke(c, lw * 0.8);
    // spine and ribs
    c.save(); c.rotate(lean);
    bone(c, 0, r * 0.25, 0, -r * 0.55, lw * 1.1);
    for (let i = 0; i < 4; i++) { const y = -r * 0.42 + i * r * 0.15, w = r * (0.46 - i * 0.05); c.strokeStyle = LN; c.lineWidth = lw * 1.7; c.beginPath(); c.ellipse(0, y, w, r * 0.08, 0, Math.PI * 0.05, Math.PI * 0.95); c.stroke(); c.strokeStyle = BONE; c.lineWidth = lw * 0.9; c.stroke(); }
    c.fillStyle = 'rgba(124,255,106,.14)'; c.beginPath(); c.ellipse(0, -r * 0.2, r * 0.3, r * 0.26, 0, 0, TAU); c.fill();
    bone(c, -r * 0.42, -r * 0.56, r * 0.42, -r * 0.56, lw * 1.1);
    c.restore();
    return { lx: -r * 0.44, ly: -r * 0.55, rx: r * 0.44, ry: -r * 0.55 };
  }
  Object.assign(MP, {
    /* a tall dune skeleton: tattered blue rag at the hips, a curved scimitar; raised overhead before it cuts */
    skelwar(c, r, ph, o) {
      if (o.mode === 'pile') { pile(c, r); return; }
      const lw = lwOf(r), raise = o.mode === 'raise' ? 1 : 0, cut = o.mode === 'cut' ? 1 : 0;
      c.fillStyle = RAG; c.beginPath(); c.moveTo(-r * 0.38, r * 0.18); c.lineTo(r * 0.38, r * 0.18); c.lineTo(r * 0.3, r * 0.5); c.lineTo(r * 0.12, r * 0.42); c.lineTo(0, r * 0.56); c.lineTo(-r * 0.14, r * 0.42); c.lineTo(-r * 0.32, r * 0.52); c.closePath(); c.fill(); stroke(c, lw * 0.7);
      const S = body(c, r, ph, raise * -0.08 + cut * 0.1);
      // the off arm hangs; the sword arm lifts over the head, or sweeps down and forward
      bone(c, S.lx, S.ly, S.lx - r * 0.12, -r * 0.05, lw); bone(c, S.lx - r * 0.12, -r * 0.05, S.lx - r * 0.05, r * 0.22, lw * 0.9);
      const hx = raise ? r * 0.25 : cut ? r * 0.95 : r * 0.62, hy = raise ? -r * 1.35 : cut ? r * 0.05 : -r * 0.1;
      bone(c, S.rx, S.ry, (S.rx + hx) / 2 + r * 0.1, (S.ry + hy) / 2, lw); bone(c, (S.rx + hx) / 2 + r * 0.1, (S.ry + hy) / 2, hx, hy, lw * 0.9);
      c.save(); c.translate(hx, hy); c.rotate(raise ? -2.1 : cut ? 0.5 : -0.9);
      c.beginPath(); c.moveTo(0, -r * 0.1); c.quadraticCurveTo(r * 0.75, -r * 0.35, r * 1.25, r * 0.05); c.quadraticCurveTo(r * 0.7, -r * 0.05, 0, r * 0.1); c.closePath(); c.fillStyle = shade(c, '#C9D2E2', r * 0.6, r * 0.5, -r * 0.1, 0.5); c.fill(); stroke(c, lw * 0.8);
      if (raise || cut) glowIn(c, r * 0.7, -r * 0.08, r * 0.45, EYE, 0.35 + 0.3 * raise);
      c.fillStyle = '#6B4A2A'; c.fillRect(-r * 0.22, -r * 0.06, r * 0.22, r * 0.12); c.fillStyle = '#C9A24A'; c.fillRect(-r * 0.02, -r * 0.15, r * 0.05, r * 0.3); c.restore();
      skullHead(c, 0, -r * 0.95, r * 0.42, raise, cut ? r * 0.08 : Math.max(0, Math.sin(ph * TAU * 2)) * r * 0.04);
    },
    /* a bone archer: hooded in a torn rag, a short bow; the string drawn back, an arrow lit green, before it looses */
    skelarcher(c, r, ph, o) {
      if (o.mode === 'pile') { pile(c, r); return; }
      const lw = lwOf(r), draw = o.mode === 'draw' ? 1 : 0;
      const S = body(c, r, ph, 0);
      // the bow held out in front; the string hand back at the cheek when drawing
      const bx = r * 0.85, by = -r * 0.5;
      bone(c, S.lx, S.ly, S.lx + r * 0.1, -r * 0.15, lw); bone(c, S.rx, S.ry, (S.rx + bx) / 2, by + r * 0.05, lw); bone(c, (S.rx + bx) / 2, by + r * 0.05, bx, by, lw * 0.9);
      c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.beginPath(); c.arc(bx - r * 0.25, by, r * 0.62, -1.05, 1.05); c.stroke(); c.strokeStyle = '#7A5634'; c.lineWidth = lw * 1.1; c.stroke();
      const sx0 = bx - r * 0.25 + Math.cos(-1.05) * r * 0.62, sy0 = by + Math.sin(-1.05) * r * 0.62, sy1 = by + Math.sin(1.05) * r * 0.62, pull = draw ? r * 0.55 : 0;
      c.strokeStyle = 'rgba(230,230,210,.9)'; c.lineWidth = Math.max(1, lw * 0.5); c.beginPath(); c.moveTo(sx0, sy0); c.lineTo(sx0 - pull, by); c.lineTo(sx0, sy1); c.stroke();
      if (draw) { c.strokeStyle = LN; c.lineWidth = lw * 1.4; c.beginPath(); c.moveTo(sx0 - pull, by); c.lineTo(bx + r * 0.55, by); c.stroke(); c.strokeStyle = '#D8D2BE'; c.lineWidth = lw * 0.6; c.stroke(); glowIn(c, bx + r * 0.55, by, r * 0.42, EYE, 0.9); c.fillStyle = EYE; c.beginPath(); c.moveTo(bx + r * 0.7, by); c.lineTo(bx + r * 0.5, by - r * 0.09); c.lineTo(bx + r * 0.5, by + r * 0.09); c.closePath(); c.fill(); }
      skullHead(c, -r * 0.02, -r * 0.95, r * 0.4, draw, 0);
      // the hood over the skull
      c.beginPath(); c.moveTo(-r * 0.42, -r * 0.78); c.bezierCurveTo(-r * 0.55, -r * 1.55, r * 0.5, -r * 1.6, r * 0.38, -r * 0.82); c.quadraticCurveTo(r * 0.3, -r * 1.25, 0, -r * 1.28); c.quadraticCurveTo(-r * 0.32, -r * 1.25, -r * 0.42, -r * 0.78); c.closePath(); c.fillStyle = RAG; c.fill(); stroke(c, lw * 0.8);
      c.beginPath(); c.moveTo(-r * 0.42, -r * 0.78); c.lineTo(-r * 0.55, -r * 0.45); c.lineTo(-r * 0.38, -r * 0.55); c.lineTo(-r * 0.3, -r * 0.4); c.lineTo(-r * 0.22, -r * 0.62); c.closePath(); c.fillStyle = RAG; c.fill(); stroke(c, lw * 0.6);
    },
  });
  Object.assign(EXT, { skelwar: 2.6, skelarcher: 2.3 });
  Object.assign(NF, { skelwar: 6, skelarcher: 6 });
  const { mon, keepRange, angTo } = DunAI;
  // a skeleton knocked down lies as a pile of bones for a while (hit it to smash it for good), then rises once
  const piled = (m, A, X) => { if (!m.pile) return false; m.mode = 'pile'; m.pileT -= A.dt; if (m.pileT <= 0) { m.pile = false; m.rose = true; m.mode = null; m.hp = m.maxhp * 0.5; X.text(m.x, m.y - m.r - 0.5, 'It rises!', EYE, 14); X.sparks(m.x, m.y, BONE, 12, 4); X.sfx.twang(); m.cd = 1; } return true; };
  Object.assign(mon, {
    skelwar(m, A, X) {
      if (piled(m, A, X)) return;
      if (m.swing > 0) { m.swing -= A.dt; m.mode = 'raise'; m.face = Math.cos(m.ska) >= 0 ? 1 : -1;
        if (m.swing <= 0) { m.mode = 'cut'; m.cutT = 0.3; const d = Math.hypot(X.me.x - m.x, X.me.y - m.y), a = Math.atan2(X.me.y - m.y, X.me.x - m.x); if (d < 2.3 + X.me.r && Math.abs(angTo(m.ska, a)) < 0.85) X.hurtPet(m.dmg * 1.5, m); X.slash(m.x + Math.cos(m.ska) * 1.1, m.y + Math.sin(m.ska) * 1.1, m.ska, 1.4, EYE); X.sfx.whoosh(); m.cd = 1.8 + Math.random() * 0.8; }
        return; }
      if (m.cutT > 0) { m.cutT -= A.dt; if (m.cutT <= 0) m.mode = null; return; }
      if (A.d > 1.4) { X.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt); m.face = A.dx >= 0 ? 1 : -1; }
      else if (m.cd <= 0) { m.swing = 0.6; m.ska = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 2.4, spread: 0.85, life: 0.6, max: 0.6, src: m, color: EYE }); }
    },
    skelarcher(m, A, X) {
      if (piled(m, A, X)) return;
      if (m.aim > 0) { m.aim -= A.dt; m.mode = 'draw'; m.face = Math.cos(m.ska) >= 0 ? 1 : -1;
        if (m.aim <= 0) { m.mode = null; X.eshot(m.x + Math.cos(m.ska) * 0.5, m.y - 0.3 + Math.sin(m.ska) * 0.5, m.ska, 9, { dmg: m.dmg * 1.2, color: EYE, core: '#E8FFE0', r: 0.15, style: 'arrow', life: 1.3 }); X.sfx.twang(); m.cd = 2.4 + Math.random(); }
        return; }
      keepRange(m, A, X, 4, 6.5);
      if (m.cd <= 0 && A.d < 8 && A.los()) { m.aim = 0.75; m.ska = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 8, w: 0.45, life: 0.75, max: 0.75, src: m, color: EYE }); }
    },
  });
})();
