/* ---------- Rift 06: The Yuggoth Engine ----------
   Something vast fell out of the dark and broke open on the plain: a living engine, half alien hull and half fungus,
   still humming. Gunmetal plates torn up like petals, violet current crawling in the seams, teal coolant pooled in its
   vaults, and at its heart pistons of flesh and metal still beating. Three lands:
   I   The Torn Hull: the crash site outside, plates jutting from scorched ground over a crackling void.
   II  The Coolant Vaults: long steel galleries over glowing teal coolant, glass tanks, pipe stacks.
   III The Engine Heart: the core, where the metal turns to something alive: violet-flesh floor, piston stalks.
   Monsters: spark mites (battery beetles: a shown line, then a dash), hull wings (fungal flyers with crab claws: they
   drop spore bombs), coil sentries (tesla drones: they link a beam of current to another monster: don't cross it).
   The Torn Hull is strewn with charge cells: break one and it discharges, chaining lightning through the monsters
   near it and setting off the other cells near it (lure them in, then pop a cell).
   Stages: I  The Torn Hull (dungeon, charge cells) · The Conductor Hunt · Kh'aal the Hull-Eater
           II The Coolant Vaults (dungeon) · The Spinning Coil (action) · Ix-Vorra the Living Conductor
           III The Meltdown Run (action) · The Engine Heart (dungeon, a curse) · Nyar'zhul, Heart of the Engine. */
const YUG = { INK: '#2B2433', HULL: '#2A2F3E', HULL_HI: '#4A5268', VIOLET: '#C452FF', VIOLET_HI: '#E8B8FF', TEAL: '#3FE0C8', TEAL_HI: '#B8FFF2', AMBER: '#FFB23F', FLESH: '#7A3A6E', FUNGUS: '#E88AC0' };
(() => {
  const TAU = Math.PI * 2, { INK, HULL, HULL_HI, VIOLET, VIOLET_HI, TEAL, TEAL_HI, AMBER, FLESH, FUNGUS } = YUG;
  BIOMES.wreckfield = { name: 'The Torn Hull', rift: true, metalBridge: true, tile: 'hull', out: true, dark: 0.3, bg: '#0A0414', gap: 'plasma', ambient: 'embers', accent: VIOLET, light: '#E8B8FF',
    floor: ['#3A3F50', '#353A4A', '#40465A'], grout: '#1E2230', hi: '#5A6278', top: '#4A5268', face: '#2A2F3E', faceD: '#1A1E2A', cliff: '#1A1E2A', deco: VIOLET, path: ['#4A5064', '#454B5E'],
    props: ['metalspike', 'hullshard', 'pylon', 'neonpost', 'metalspike', 'wreckrib', 'pylon', 'metalspike', 'neonpost'], propN: [5, 3], hazard: 'laser', grade: 'rgba(196,82,255,.07)', fog: '#0A0414', darkRGB: '10,4,20' };
  BIOMES.coolant = { name: 'The Coolant Vaults', rift: true, metalBridge: true, tile: 'hull', out: true, dark: 0.36, bg: '#061A1C', gap: 'coolant', ambient: 'steam', accent: TEAL, light: '#B8FFF2',
    floor: ['#3E5566', '#3A5060', '#44596C'], grout: '#1E2A34', hi: '#6A8296', top: '#5A7286', face: '#2A3A48', faceD: '#1A2630', cliff: '#1A2630', deco: TEAL, path: ['#4A6072', '#465C6E'],
    props: ['coolanttank', 'metalspike', 'neonpost', 'pipestack', 'pylon', 'coolanttank', 'metalspike'], propN: [5, 2], hazard: 'steamvent', grade: 'rgba(63,224,200,.07)', fog: '#061A1C', darkRGB: '4,18,20' };
  BIOMES.engineheart = { name: 'The Engine Heart', rift: true, metalBridge: true, tile: 'hull', out: true, dark: 0.34, bg: '#0A0414', gap: 'plasma', ambient: 'motes', accent: '#FF6FB0', light: '#FFD0E8',
    floor: ['#3A2238', '#422640', '#341E33'], grout: '#1E0F1E', hi: '#5E3A5A', top: '#6A3A62', face: '#2E182C', faceD: '#1E0E1C', cliff: '#1E0E1C', deco: AMBER, path: ['#4A2A46', '#452842'],
    props: ['piston', 'metalspike', 'neonpost', 'nervecable', 'pylon', 'metalspike', 'piston'], propN: [5, 2], hazard: 'laser', grade: 'rgba(255,111,176,.07)', fog: '#0A0414', darkRGB: '10,4,14' };
  BIOME_ORDER.push('wreckfield', 'coolant', 'engineheart');
  DARK_COL.wreckfield = '10,4,20'; DARK_COL.coolant = '4,18,20'; DARK_COL.engineheart = '10,4,14';

  /* ---- props ---- */
  const { PROPS } = DunWorld, { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(0,0,0,${a || 0.28})`; c.beginPath(); c.ellipse(0, 0, T * w, T * w * 0.32, 0, 0, TAU); c.fill(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const poly = (c, pts, col, lw) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, lw); };
  window.PROP_EXT = window.PROP_EXT || {}; Object.assign(PROP_EXT, { hullshard: [3.2, 3.6], metalspike: [3.6, 5.2], neonpost: [2.4, 4.2], wreckrib: [3.6, 3.6], pylon: [2.6, 3.8], coolanttank: [2.6, 3.4], piston: [2.6, 3.8], nervecable: [3.4, 3.4] });
  Object.assign(PROPS, {
    /* a cluster of giant steel spikes bursting out of the ground: faceted blades (a lit face and a dark face), a
       neon strip glowing down each, sparks at the tips */
    metalspike(c, T, v) { const lw = lw0(T), neon = [VIOLET, TEAL, '#FF4FB8'][v % 3]; c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(0, T * 0.04, T * 1.2, T * 0.36, 0, 0, TAU); c.fill();
      glowIn(c, 0, -T * 1.6, T * 1.9, neon, 0.28);
      const blades = [[-0.55, 0.32, 2.4, -0.28], [0.5, 0.3, 2.1, 0.3], [0.05, 0.4, 3.9 + (v % 2) * 0.5, 0.04], [-0.95, 0.22, 1.4, -0.55], [0.95, 0.22, 1.5, 0.6], [-0.2, 0.26, 2.9, -0.12]];
      blades.sort((a, b) => a[2] - b[2]);
      for (const [x, w, h, a] of blades) { c.save(); c.translate(x * T, 0); c.rotate(a); const W2 = w * T, H2 = h * T;
        c.beginPath(); c.moveTo(-W2, 0); c.lineTo(-W2 * 0.12, -H2); c.lineTo(0, -H2 * 0.95); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#8A93A8'; c.fill(); stroke(c, lw);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -H2 * 0.95); c.lineTo(-W2 * 0.12, -H2); c.lineTo(W2, 0); c.closePath(); c.fillStyle = '#3A4052'; c.fill(); stroke(c, lw);
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-W2 * 0.9, -H2 * 0.05); c.lineTo(-W2 * 0.16, -H2 * 0.92); c.stroke();
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = neon; c.lineWidth = lw * 1.3; c.beginPath(); c.moveTo(W2 * 0.12, -H2 * 0.12); c.lineTo(W2 * 0.04, -H2 * 0.8); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = lw * 0.45; c.stroke(); c.restore();
        glowIn(c, -W2 * 0.1, -H2, T * 0.45, neon, 0.75); c.restore(); }
      for (let i = 0; i < 4; i++) { const x = (i - 1.5) * T * 0.45; c.fillStyle = '#2A2F3E'; c.beginPath(); c.moveTo(x - T * 0.28, T * 0.05); c.lineTo(x, -T * 0.32); c.lineTo(x + T * 0.3, T * 0.05); c.closePath(); c.fill(); stroke(c, lw * 0.8); } },
    /* a neon post: a steel pole with a tall glowing tube and a crackling cap */
    neonpost(c, T, v) { const lw = lw0(T), neon = [TEAL, VIOLET, '#FF4FB8', AMBER][v % 4], H = T * (2.6 + (v % 2) * 0.5); shadowEll(c, T, 0.45);
      glowIn(c, 0, -H * 0.55, H * 0.75, neon, 0.45); c.fillStyle = '#1E2230'; c.fillRect(-T * 0.18, -H, T * 0.36, H); c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(-T * 0.18, -H, T * 0.36, H);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = neon; GFX.rr(c, -T * 0.08, -H * 0.92, T * 0.16, H * 0.8, T * 0.08); c.fill(); c.fillStyle = '#FFFFFF'; GFX.rr(c, -T * 0.03, -H * 0.9, T * 0.06, H * 0.76, T * 0.03); c.fill(); c.restore();
      c.fillStyle = '#4A5268'; c.beginPath(); c.moveTo(-T * 0.3, -H); c.lineTo(T * 0.3, -H); c.lineTo(T * 0.18, -H - T * 0.2); c.lineTo(-T * 0.18, -H - T * 0.2); c.closePath(); c.fill(); stroke(c, lw);
      c.fillStyle = '#2A2F3E'; c.fillRect(-T * 0.32, -T * 0.25, T * 0.64, T * 0.25); c.strokeRect(-T * 0.32, -T * 0.25, T * 0.64, T * 0.25); },
    /* a torn plate of hull driven into the ground: two faces (lit and shaded), a bevelled rim, rivets, a glowing seam */
    hullshard(c, T, v) { const lw = lw0(T), w = T * (0.7 + (v % 2) * 0.25), h = T * (1.6 + (v % 3) * 0.35), lean = (v % 2 ? 1 : -1) * T * 0.35; shadowEll(c, T, 1.0);
      poly(c, [[-w, 0], [-w * 0.8 + lean, -h * 0.85], [-w * 0.2 + lean, -h], [w * 0.1 + lean * 0.6, -h * 0.55], [0, 0]], '#4A5268', lw);
      poly(c, [[0, 0], [w * 0.1 + lean * 0.6, -h * 0.55], [-w * 0.2 + lean, -h], [w * 0.7 + lean, -h * 0.7], [w, 0]], '#2E3444', lw);
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-w * 0.8 + lean, -h * 0.85); c.lineTo(-w * 0.2 + lean, -h); c.stroke();
      c.fillStyle = 'rgba(0,0,0,.45)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-w * 0.55 + lean * 0.5 + i * w * 0.12, -h * (0.3 + i * 0.12), T * 0.035, 0, TAU); c.fill(); }
      c.strokeStyle = VIOLET; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(w * 0.15, -h * 0.1); c.lineTo(w * 0.1 + lean * 0.5, -h * 0.5); c.lineTo(w * 0.45 + lean, -h * 0.62); c.stroke(); glowIn(c, w * 0.2 + lean * 0.6, -h * 0.45, T * 0.5, VIOLET, 0.5); },
    /* a great curved rib of the vessel arching out of the ground, ridged, dark, with a fungal frill at its root */
    wreckrib(c, T, v) { const lw = lw0(T), sd = v % 2 ? 1 : -1, H = T * (2.4 + (v % 3) * 0.3); shadowEll(c, T, 1.2, 0.25);
      c.beginPath(); c.moveTo(-sd * T * 0.9, 0); c.bezierCurveTo(-sd * T * 1.1, -H * 0.7, sd * T * 0.4, -H * 1.05, sd * T * 1.3, -H * 0.8); c.lineTo(sd * T * 1.25, -H * 0.66); c.bezierCurveTo(sd * T * 0.4, -H * 0.82, -sd * T * 0.6, -H * 0.55, -sd * T * 0.45, 0); c.closePath();
      c.fillStyle = shade(c, '#3A3446', T, 0, -H * 0.6, 0.35); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(232,184,255,.35)'; c.lineWidth = lw * 0.6; for (let i = 1; i < 6; i++) { const u = i / 6, x = -sd * T * 0.8 + sd * T * 2.0 * u, y = -H * (0.45 + Math.sin(u * Math.PI) * 0.45); c.beginPath(); c.moveTo(x - T * 0.08, y + T * 0.12); c.lineTo(x + T * 0.08, y - T * 0.04); c.stroke(); }
      for (let i = 0; i < 5; i++) { const x = -sd * T * 0.7 + i * sd * T * 0.12; c.fillStyle = i % 2 ? FUNGUS : '#B85A90'; c.beginPath(); c.ellipse(x, -T * 0.08, T * 0.16, T * 0.1, 0, 0, TAU); c.fill(); stroke(c, lw * 0.6); } },
    /* a bent pylon: a black mast, three glowing coils, a cap crackling with violet current */
    pylon(c, T, v) { const lw = lw0(T), tilt = (v % 2 ? 0.12 : -0.1); shadowEll(c, T, 0.5); c.save(); c.rotate(tilt);
      c.fillStyle = '#1E2230'; c.fillRect(-T * 0.12, -T * 2.6, T * 0.24, T * 2.6); stroke(c, lw); c.strokeRect(-T * 0.12, -T * 2.6, T * 0.24, T * 2.6);
      for (let i = 0; i < 3; i++) { const y = -T * (0.9 + i * 0.55); c.fillStyle = '#4A5268'; c.beginPath(); c.ellipse(0, y, T * 0.34, T * 0.12, 0, 0, TAU); c.fill(); stroke(c, lw); c.strokeStyle = VIOLET_HI; c.lineWidth = lw * 0.6; c.beginPath(); c.ellipse(0, y - T * 0.02, T * 0.24, T * 0.07, 0, 0, Math.PI); c.stroke(); }
      glowIn(c, 0, -T * 2.75, T * 0.9, VIOLET, 0.75); c.fillStyle = VIOLET_HI; c.beginPath(); c.arc(0, -T * 2.75, T * 0.17, 0, TAU); c.fill(); stroke(c, lw);
      c.strokeStyle = '#FFFFFF'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(0, -T * 2.75); c.lineTo(T * 0.3, -T * 2.95); c.lineTo(T * 0.22, -T * 3.1); c.lineTo(T * 0.48, -T * 3.25); c.moveTo(0, -T * 2.75); c.lineTo(-T * 0.32, -T * 2.9); c.lineTo(-T * 0.26, -T * 3.08); c.stroke(); c.restore(); },
    /* alien fungus: a cluster of soft pink stalks with glowing, gilled caps */
    fungusstalk(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.55, 0.22); const n = 3 + (v % 2);
      for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * T * 0.3, h = T * (0.7 + ((i * 7 + v) % 4) * 0.25), cw = T * (0.22 + (i % 2) * 0.08);
        c.strokeStyle = LN; c.lineWidth = lw * 3; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + T * 0.1, -h * 0.5, x, -h); c.stroke(); c.strokeStyle = '#E8C0D8'; c.lineWidth = lw * 1.6; c.stroke();
        glowIn(c, x, -h, cw * 2.2, i % 2 ? TEAL : FUNGUS, 0.5); c.beginPath(); c.ellipse(x, -h, cw, cw * 0.55, 0, Math.PI, TAU); c.closePath(); c.fillStyle = i % 2 ? '#7FE8D8' : FUNGUS; c.fill(); stroke(c, lw);
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = lw * 0.5; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x, -h); c.lineTo(x + k * cw * 0.35, -h - cw * 0.3); c.stroke(); } } },
    /* a tall glass tank of glowing teal coolant on a steel base, bubbles rising */
    coolanttank(c, T, v) { const lw = lw0(T), w = T * 0.55, h = T * (1.9 + (v % 2) * 0.4); shadowEll(c, T, 0.7);
      c.fillStyle = '#2A3A48'; c.fillRect(-w * 1.15, -T * 0.35, w * 2.3, T * 0.35); stroke(c, lw); c.strokeRect(-w * 1.15, -T * 0.35, w * 2.3, T * 0.35);
      const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, 'rgba(63,224,200,.55)'); g.addColorStop(0.4, 'rgba(184,255,242,.75)'); g.addColorStop(1, 'rgba(30,140,130,.7)'); c.fillStyle = g; c.fillRect(-w, -T * 0.35 - h, w * 2, h);
      glowIn(c, 0, -T * 0.35 - h * 0.5, h * 0.7, TEAL, 0.5); c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-w * 0.5 + ((i * 37 + v * 13) % 10) / 10 * w, -T * 0.5 - (i / 6) * h, T * (0.04 + (i % 2) * 0.03), 0, TAU); c.fill(); }
      c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(-w, -T * 0.35 - h, w * 2, h); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-w * 0.75, -T * 0.4 - h * 0.95, w * 0.18, h * 0.85);
      c.fillStyle = '#4A5E70'; c.fillRect(-w * 1.15, -T * 0.35 - h - T * 0.25, w * 2.3, T * 0.25); stroke(c, lw); c.strokeRect(-w * 1.15, -T * 0.35 - h - T * 0.25, w * 2.3, T * 0.25); },
    /* a stack of three thick pipes with bolted collars and a dripping teal valve */
    pipestack(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.9, 0.25);
      for (let i = 0; i < 3; i++) { const y = -T * (0.28 + i * 0.42), x0 = -T * 0.95 + (i % 2) * T * 0.12; c.fillStyle = shade(c, '#5A7286', T * 0.3, 0, y - T * 0.1, 0.3); GFX.rr(c, x0, y - T * 0.2, T * 1.8, T * 0.38, T * 0.18); c.fill(); stroke(c, lw); c.fillStyle = '#2A3A48'; [0.25, 1.4].forEach(u => { c.fillRect(x0 + T * u, y - T * 0.24, T * 0.16, T * 0.46); c.strokeRect(x0 + T * u, y - T * 0.24, T * 0.16, T * 0.46); }); }
      c.fillStyle = TEAL; c.beginPath(); c.ellipse(T * 0.7, T * 0.05, T * 0.25, T * 0.08, 0, 0, TAU); c.fill(); glowIn(c, T * 0.7, T * 0.02, T * 0.4, TEAL, 0.5); },
    /* a wheel valve on a short standpipe */
    valve(c, T) { const lw = lw0(T); shadowEll(c, T, 0.4); c.fillStyle = '#4A5E70'; c.fillRect(-T * 0.12, -T * 0.9, T * 0.24, T * 0.9); stroke(c, lw); c.strokeRect(-T * 0.12, -T * 0.9, T * 0.24, T * 0.9);
      c.strokeStyle = LN; c.lineWidth = lw * 2.6; c.beginPath(); c.arc(0, -T * 1.05, T * 0.36, 0, TAU); c.stroke(); c.strokeStyle = '#C94A4A'; c.lineWidth = lw * 1.4; c.stroke(); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; c.beginPath(); c.moveTo(0, -T * 1.05); c.lineTo(Math.cos(a) * T * 0.34, -T * 1.05 + Math.sin(a) * T * 0.34); c.stroke(); } },
    /* a piston of flesh and metal: a ribbed fleshy sleeve round a steel rod, a glowing amber joint */
    piston(c, T, v) { const lw = lw0(T), up = (v % 3) * 0.15; shadowEll(c, T, 0.6);
      c.fillStyle = '#5A6278'; c.fillRect(-T * 0.13, -T * (2.7 + up), T * 0.26, T * (1.4 + up)); stroke(c, lw); c.strokeRect(-T * 0.13, -T * (2.7 + up), T * 0.26, T * (1.4 + up));
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-T * 0.08, -T * (2.65 + up), T * 0.05, T * (1.3 + up));
      for (let i = 0; i < 5; i++) { const y = -T * (0.25 + i * 0.22); c.fillStyle = i % 2 ? '#8A4478' : FLESH; GFX.rr(c, -T * 0.42, y - T * 0.13, T * 0.84, T * 0.24, T * 0.1); c.fill(); stroke(c, lw * 0.8); }
      glowIn(c, 0, -T * 1.35, T * 0.6, AMBER, 0.6); c.fillStyle = AMBER; c.beginPath(); c.arc(0, -T * 1.35, T * 0.16, 0, TAU); c.fill(); stroke(c, lw);
      c.fillStyle = '#3A3F50'; GFX.rr(c, -T * 0.3, -T * (2.95 + up), T * 0.6, T * 0.3, T * 0.06); c.fill(); stroke(c, lw); },
    /* a thick nerve cable looping out of the floor and back in, glowing pulses along it */
    nervecable(c, T, v) { const lw = lw0(T), sd = v % 2 ? 1 : -1; shadowEll(c, T, 1.1, 0.22);
      c.strokeStyle = LN; c.lineWidth = T * 0.36; c.lineCap = 'round'; c.beginPath(); c.moveTo(-sd * T * 1.1, 0); c.bezierCurveTo(-sd * T * 1.0, -T * 1.8, sd * T * 0.9, -T * 1.9, sd * T * 1.0, 0); c.stroke(); c.strokeStyle = FLESH; c.lineWidth = T * 0.26; c.stroke();
      c.strokeStyle = 'rgba(255,208,232,.5)'; c.lineWidth = T * 0.06; c.stroke();
      for (let i = 1; i < 5; i++) { const u = i / 5, x = -sd * T * 1.1 * (1 - u) * (1 - u) * (1 - u) + 3 * (1 - u) * (1 - u) * u * -sd * T + 3 * (1 - u) * u * u * sd * T * 0.9 + u * u * u * sd * T, y = 3 * (1 - u) * (1 - u) * u * -T * 1.8 + 3 * (1 - u) * u * u * -T * 1.9; glowIn(c, x, y, T * 0.3, AMBER, 0.6); } },
  });

  /* ---- the brood ---- */
  Object.assign(MON, {
    sparkmite: { name: 'Spark mite', from: 999, hp: 240, spd: 2.1, r: 0.38, dmg: 16, xp: 14, coin: 0.8, color: '#4A5268', bio: ['wreckfield', 'coolant', 'engineheart'], tip: 'A battery beetle. It shows a line, charges, and dashes along it in a streak of current: step off the line.', kit: [] },
    hullwing: { name: 'Hull wing', from: 999, hp: 260, spd: 1.6, r: 0.48, dmg: 14, xp: 16, coin: 0.9, color: FUNGUS, bio: ['wreckfield', 'coolant', 'engineheart'], fly: true, tip: 'A fungal flyer with crab claws. It drops spore bombs on shown circles: they leave a poison cloud.', kit: [] },
    coilsentry: { name: 'Coil sentry', from: 999, hp: 300, spd: 0.9, r: 0.45, dmg: 12, xp: 18, coin: 1, color: '#5A6278', bio: ['wreckfield', 'coolant', 'engineheart'], fly: true, tip: 'A tesla drone. It links a beam of current to another monster for a few seconds (a dashed line first): don\'t cross the beam. Kill it to cut the link.', kit: [] },
  });
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  Object.assign(MP, {
    /* a battery beetle: a ribbed gunmetal shell with a glowing violet cell set in its back, two antenna prongs */
    sparkmite(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU), charge = o.mode === 'block' ? 1 : 0, dash = o.mode === 'dash' ? 1 : 0;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, r * 0.8, r * 0.95, r * 0.28, 0, 0, TAU); c.fill();
      for (let i = 0; i < 3; i++) { const x = -r * 0.45 + i * r * 0.45; limb(c, x, r * 0.25, x - r * 0.25 + run * r * 0.12 * (i % 2 ? 1 : -1), r * 0.78, lw * 0.9, '#1E2230'); }
      c.beginPath(); c.ellipse(0, 0, r * 0.88, r * 0.55, 0, 0, TAU); c.fillStyle = shade(c, o.color, r, -r * 0.2, -r * 0.3, 0.4); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw * 0.8; for (const x of [-0.45, 0.45]) { c.beginPath(); c.moveTo(x * r, -r * 0.45); c.lineTo(x * r, r * 0.45); c.stroke(); }
      const k = charge || dash ? 1 : 0.5 + 0.3 * Math.sin(ph * TAU * 3); glowIn(c, 0, -r * 0.1, r * (0.7 + k * 0.5), VIOLET, 0.5 + k * 0.4); c.fillStyle = k > 0.9 ? '#FFFFFF' : VIOLET_HI; GFX.rr(c, -r * 0.3, -r * 0.32, r * 0.6, r * 0.42, r * 0.1); c.fill(); stroke(c, lw * 0.8);
      for (const sd of [-1, 1]) { c.strokeStyle = LN; c.lineWidth = lw * 1.4; c.beginPath(); c.moveTo(r * 0.6, -r * 0.2 + sd * r * 0.12); c.lineTo(r * 1.0, -r * 0.45 + sd * r * 0.3); c.stroke(); c.fillStyle = VIOLET_HI; c.beginPath(); c.arc(r * 1.0, -r * 0.45 + sd * r * 0.3, r * 0.08, 0, TAU); c.fill(); }
      if (charge) { c.strokeStyle = '#FFFFFF'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(r * 1.0, -r * 0.75); c.lineTo(r * 1.25, -r * 0.5); c.lineTo(r * 1.1, -r * 0.35); c.lineTo(r * 1.35, -r * 0.1); c.stroke(); } },
    /* a fungal flyer: a lumpy pink body, a glowing ridged brain-lobe for a head, two crab claws, membrane wings */
    hullwing(c, r, ph, o) { const lw = lwOf(r), fl = Math.sin(ph * TAU * 2), bob = Math.sin(ph * TAU) * r * 0.12;
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, r * 1.2, r * 0.8, r * 0.22, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, bob - r * 0.45);
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.2, -r * 0.2); c.quadraticCurveTo(sd * r * 1.2, -r * (0.9 + fl * 0.35), sd * r * 1.55, -r * (0.2 + fl * 0.4)); c.quadraticCurveTo(sd * r * 1.05, r * 0.05, sd * r * 0.25, r * 0.15); c.closePath(); c.fillStyle = 'rgba(180,90,150,.6)'; c.fill(); stroke(c, lw * 0.8); c.strokeStyle = 'rgba(255,200,230,.6)'; c.lineWidth = lw * 0.5; c.beginPath(); c.moveTo(sd * r * 0.3, -r * 0.1); c.lineTo(sd * r * 1.4, -r * (0.25 + fl * 0.4)); c.moveTo(sd * r * 0.3, 0); c.lineTo(sd * r * 1.1, r * 0.02); c.stroke(); }
      // claws
      for (const sd of [-1, 1]) { limb(c, sd * r * 0.25, r * 0.3, sd * r * 0.45, r * 0.75, lw * 1.1, '#B85A90'); c.beginPath(); c.moveTo(sd * r * 0.45, r * 0.7); c.quadraticCurveTo(sd * r * 0.75, r * 0.75, sd * r * 0.6, r * 1.0); c.lineTo(sd * r * 0.48, r * 0.85); c.lineTo(sd * r * 0.35, r * 1.0); c.quadraticCurveTo(sd * r * 0.3, r * 0.75, sd * r * 0.45, r * 0.7); c.fillStyle = '#D06AA4'; c.fill(); stroke(c, lw * 0.7); }
      c.beginPath(); c.ellipse(0, r * 0.15, r * 0.42, r * 0.5, 0, 0, TAU); c.fillStyle = shade(c, o.color, r * 0.5, -r * 0.1, 0, 0.4); c.fill(); stroke(c, lw);
      // the brain-lobe head, its colour shifting
      const hue = ['#7FE8D8', '#C452FF', '#FFB23F'][Math.floor(ph * 3) % 3]; glowIn(c, 0, -r * 0.45, r * 0.65, hue, 0.55);
      c.beginPath(); c.ellipse(0, -r * 0.45, r * 0.42, r * 0.34, 0, 0, TAU); c.fillStyle = '#F2B8D8'; c.fill(); stroke(c, lw); c.strokeStyle = 'rgba(120,40,90,.55)'; c.lineWidth = lw * 0.6; for (const x of [-0.18, 0, 0.18]) { c.beginPath(); c.moveTo(x * r, -r * 0.75); c.quadraticCurveTo(x * r + r * 0.08, -r * 0.45, x * r, -r * 0.18); c.stroke(); }
      c.restore(); },
    /* a tesla drone: a dark disc body, a coil tower with a crackling ball, three little thruster legs */
    coilsentry(c, r, ph, o) { const lw = lwOf(r), bob = Math.sin(ph * TAU) * r * 0.12, on = o.mode === 'block' ? 1 : 0;
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, r * 1.2, r * 0.7, r * 0.2, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, bob - r * 0.5);
      for (const x of [-0.5, 0, 0.5]) { limb(c, x * r, r * 0.15, x * r * 1.3, r * 0.55, lw * 0.9, '#2A2F3E'); glowIn(c, x * r * 1.3, r * 0.62, r * 0.25, TEAL, 0.6); }
      c.beginPath(); c.ellipse(0, r * 0.1, r * 0.85, r * 0.32, 0, 0, TAU); c.fillStyle = shade(c, o.color, r, 0, 0, 0.35); c.fill(); stroke(c, lw);
      c.fillStyle = TEAL; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-r * 0.6 + i * r * 0.3, r * 0.12, r * 0.05, 0, TAU); c.fill(); }
      c.fillStyle = '#1E2230'; c.fillRect(-r * 0.14, -r * 0.75, r * 0.28, r * 0.8); stroke(c, lw); c.strokeRect(-r * 0.14, -r * 0.75, r * 0.28, r * 0.8);
      for (let i = 0; i < 3; i++) { c.strokeStyle = VIOLET_HI; c.lineWidth = lw * 0.7; c.beginPath(); c.ellipse(0, -r * (0.15 + i * 0.22), r * 0.24, r * 0.07, 0, 0, TAU); c.stroke(); }
      glowIn(c, 0, -r * 0.92, r * (0.6 + on * 0.5), VIOLET, 0.6 + on * 0.35); c.fillStyle = on ? '#FFFFFF' : VIOLET_HI; c.beginPath(); c.arc(0, -r * 0.92, r * 0.2, 0, TAU); c.fill(); stroke(c, lw * 0.8);
      c.restore(); },
  });
  Object.assign(EXT, { sparkmite: 2.2, hullwing: 2.6, coilsentry: 2.4 }); Object.assign(NF, { sparkmite: 6, hullwing: 6, coilsentry: 6 });
  const { mon, keepRange } = DunAI;
  // a coil sentry's beam: from the sentry to its partner, drawn as a zone each frame; it hurts the pet that crosses it
  const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); return Math.hypot(px - ax - dx * u, py - ay - dy * u); };
  Object.assign(mon, {
    sparkmite(m, A, X) {
      if (m.dashT > 0) { m.dashT -= A.dt; m.mode = 'dash'; X.moveEnt(m, Math.cos(m.da) * 11 * A.dt, Math.sin(m.da) * 11 * A.dt); if (Math.random() < 0.6) X.part({ kind: 'spark', x: m.x, y: m.y - 0.2, vx: (Math.random() - 0.5) * 2, vy: -1, life: 0.35, max: 0.35, size: 2, color: VIOLET_HI }); if (!m.dhit && A.d < m.r + X.me.r + 0.2) { m.dhit = true; X.hurtPet(m.dmg * 1.3, m); X.push(m.da, 1.5); } if (m.dashT <= 0) { m.mode = null; m.cd = 2.4 + Math.random() * 1.2; } return; }
      if (m.chargeT > 0) { m.chargeT -= A.dt; m.mode = 'block'; if (m.chargeT <= 0) { m.dashT = 0.55; m.dhit = false; } return; }
      m.mode = null; keepRange(m, A, X, 2.8, 5.5);
      if (m.cd <= 0 && A.d < 6.5 && A.los()) { m.chargeT = 0.65; m.da = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 6.5, w: 0.8, life: 0.65, max: 0.65, src: m, color: VIOLET_HI }); }
    },
    hullwing(m, A, X) {
      keepRange(m, A, X, 3, 6);
      if (m.cd <= 0 && A.d < 7.5) { m.cd = 3.4 + Math.random() * 1.5; const px = X.me.x + (X.me.vx || 0) * 0.4, py = X.me.y + (X.me.vy || 0) * 0.4; X.warn({ x: px, y: py, r: 1.3, life: 1.0, max: 1.0, src: m, color: FUNGUS, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.3 + X.me.r * 0.5) X.hurtPet(m.dmg, m); X.zone({ kind: 'poison', x: px, y: py, r: 1.4, life: 3, max: 3, dps: m.dmg * 0.5, tick: 0.3, own: 'enemy' }); X.sparks(px, py, FUNGUS, 10, 4); } }); }
    },
    coilsentry(m, A, X) {
      keepRange(m, A, X, 4, 7);
      const L = m.link; if (L) { L.t -= A.dt; const q = L.to; if (q.dead || L.t <= 0) { m.link = null; m.mode = null; m.cd = 3 + Math.random() * 2; return; }
        m.mode = L.t < L.max - 0.8 ? 'block' : null;
        if (L.t < L.max - 0.8) { if (Math.random() < 0.5) X.part({ kind: 'spark', x: m.x + (q.x - m.x) * Math.random(), y: m.y - 0.5 + (q.y - m.y) * Math.random(), vx: 0, vy: -0.5, life: 0.25, max: 0.25, size: 2, color: '#FFFFFF' }); if (!X.me.dodge && segD(X.me.x, X.me.y, m.x, m.y - 0.5, q.x, q.y - 0.3) < 0.45 + X.me.r * 0.5 && !(m.lhit > 0)) { m.lhit = 0.6; X.hurtPet(m.dmg * 1.4, m); X.text(X.me.x, X.me.y - 1.3, 'ZAP!', VIOLET_HI, 13); } if (m.lhit > 0) m.lhit -= A.dt; } return; }
      if (m.cd <= 0) { const q = X.mons.filter(o => !o.dead && o !== m && !o.boss && !o.still && Math.hypot(o.x - m.x, o.y - m.y) < 7).sort((a, b) => segD(X.me.x, X.me.y, m.x, m.y, a.x, a.y) - segD(X.me.x, X.me.y, m.x, m.y, b.x, b.y))[0];
        if (q) { m.link = { to: q, t: 4.0, max: 4.0 }; X.warn({ shape: 'line', x: m.x, y: m.y, a: Math.atan2(q.y - m.y, q.x - m.x), len: Math.hypot(q.x - m.x, q.y - m.y), w: 0.6, life: 0.8, max: 0.8, src: m, color: VIOLET_HI }); } else m.cd = 1; }
      else if (m.atkCd <= 0 && A.d < 6 && A.los()) { m.atkCd = 2.4; X.eshot(m.x, m.y - 0.5, A.a, 7, { dmg: m.dmg, color: VIOLET_HI, core: '#FFFFFF', r: 0.14 }); }
    },
  });

  /* ---- the Torn Hull's charge cells: break one and it discharges, chaining through monsters and other cells ---- */
  Object.assign(MON, { chargecell: { name: 'Charge cell', from: 999, hp: 160, spd: 0, r: 0.5, dmg: 0, xp: 2, coin: 0.2, color: VIOLET, bio: ['wreckfield'], still: true, tip: 'A live cell from the wreck. Break it and it discharges: lightning chains through every monster near it and sets off the cells near it. Lure them in first; stand clear yourself.', kit: [],
    onDeath(m, X) { discharge(m, X); } } });
  function bolt(X, ax, ay, bx, by) { const n = 7; let px = ax, py = ay; for (let i = 1; i <= n; i++) { const u = i / n, x = ax + (bx - ax) * u + (i < n ? (Math.random() - 0.5) * 0.6 : 0), y = ay + (by - ay) * u + (i < n ? (Math.random() - 0.5) * 0.6 : 0); X.part({ kind: 'spark', x: (px + x) / 2, y: (py + y) / 2, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 3, color: i % 2 ? '#FFFFFF' : VIOLET_HI }); px = x; py = y; } }
  function discharge(m, X) { X.boom(m.x, m.y - 0.4, 2.2, VIOLET, '#FFFFFF', { n: 26, shake: 7 }); X.ring(m.x, m.y, 0.3, 4.5, 0.4, VIOLET_HI, 0.4); if (X.sfx.crash) X.sfx.crash();
    if (!X.me.dead && Math.hypot(X.me.x - m.x, X.me.y - m.y) < 2 && !X.me.dodge) { X.hurtPet(X.ST().hp * 0.12, null); X.text(X.me.x, X.me.y - 1.4, 'Too close!', VIOLET_HI, 13); }
    let n = 0; for (const q of X.mons) { if (q.dead || q === m || q.boss || q.fobj) continue; const d = Math.hypot(q.x - m.x, q.y - m.y);
      if (q.type === 'chargecell') { if (d < 6.5 && !q.chained) { q.chained = true; bolt(X, m.x, m.y - 0.5, q.x, q.y - 0.5); X.after(0.22, () => { if (!q.dead) X.killMon(q); }); } continue; }
      if (d < 4.5) { n++; bolt(X, m.x, m.y - 0.5, q.x, q.y - 0.4); X.hitMon(q, q.maxhp * 0.7, { flat: true }); q.freeze = Math.max(q.freeze || 0, 1.2); } }
    if (n >= 3) X.text(m.x, m.y - 1.6, `Chain ×${n}!`, VIOLET_HI, 15); }
  MP.chargecell = (c, r, ph, o) => { const lw = lwOf(r), k = 0.5 + 0.5 * Math.sin(ph * TAU * 2);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, r * 0.7, r * 0.75, r * 0.24, 0, 0, TAU); c.fill();
    c.fillStyle = '#2A2F3E'; GFX.rr(c, -r * 0.6, -r * 1.3, r * 1.2, r * 1.9, r * 0.2); c.fill(); stroke(c, lw);
    // amber and black warning stripes round its foot
    c.save(); c.beginPath(); c.rect(-r * 0.6, r * 0.25, r * 1.2, r * 0.3); c.clip(); for (let i = -3; i < 4; i++) { c.fillStyle = i % 2 ? '#1A1A1A' : AMBER; c.beginPath(); c.moveTo(i * r * 0.3, r * 0.25); c.lineTo(i * r * 0.3 + r * 0.15, r * 0.25); c.lineTo(i * r * 0.3 - r * 0.15, r * 0.55); c.lineTo(i * r * 0.3 - r * 0.3, r * 0.55); c.closePath(); c.fill(); } c.restore();
    // the glass window and the crackling core
    c.fillStyle = 'rgba(20,6,40,.8)'; GFX.rr(c, -r * 0.38, -r * 1.05, r * 0.76, r * 1.15, r * 0.1); c.fill(); glowIn(c, 0, -r * 0.5, r * (1.1 + k * 0.4), VIOLET, 0.55 + k * 0.3);
    c.strokeStyle = '#FFFFFF'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-r * 0.2, -r * 0.95); c.lineTo(r * 0.05, -r * 0.65); c.lineTo(-r * 0.1, -r * 0.45); c.lineTo(r * 0.18, -r * 0.1); c.stroke();
    c.fillStyle = '#4A5268'; c.fillRect(-r * 0.25, -r * 1.48, r * 0.5, r * 0.2); stroke(c, lw * 0.8); c.strokeRect(-r * 0.25, -r * 1.48, r * 0.5, r * 0.2); };
  Object.assign(EXT, { chargecell: 2.4 }); Object.assign(NF, { chargecell: 1 }); mon.chargecell = () => {};
  function cellsExtra(X, self, H) { const M = X.M, list = [];
    for (const rm of M.rooms.slice(1)) { const n = 1 + (Math.random() < 0.6 ? 1 : 0); for (let k = 0; k < n; k++) { const q = X.freeSpot(rm.x + rm.w * (0.25 + Math.random() * 0.5), rm.y + rm.h * (0.25 + Math.random() * 0.5), 0.8); if (!q) continue; const m = X.spawnMon('chargecell', q.x, q.y, { pack: 880, rift: true }); m.aggro = false; m.optional = true; list.push(m); } }
    X.after(4.5, () => X.banner('CHARGE CELLS', 'Break a cell near a pack: lightning chains through them and sets off the cells nearby', VIOLET_HI, 3, true));
    return { list }; }

  /* ---- the mini bosses: Rift-touched Cocopets with the engine's tricks ---- */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; };
  BOSSES.push(
    { id: 'arcpet', rift: true, name: 'Arc', title: 'A Rift-touched Cocopet', hp: 62000, dmg: 38, r: 1.35, spd: 1.9, color: '#4A5268', glow: VIOLET_HI, biome: 'wreckfield', el: 'spark' },
    { id: 'coolpet', rift: true, name: 'Coolant', title: 'A Rift-touched Cocopet', hp: 68000, dmg: 38, r: 1.35, spd: 1.8, color: '#3E5566', glow: TEAL_HI, biome: 'coolant', el: 'water' },
    { id: 'corepet', rift: true, name: 'Overload', title: 'A Rift-touched Cocopet', hp: 76000, dmg: 42, r: 1.5, spd: 1.7, color: FLESH, glow: AMBER, biome: 'engineheart', el: 'fire' });
  Object.assign(DunAI.boss, {
    /* Arc: a fork of lightning strikes three lines at once, then it blinks behind you */
    arcpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['fork', 'blink', 'fork'] : ['fork', 'blink']); }
      const T = m.actT; switch (m.act) {
        case 'fork': { if (m.step === 0) { m.step = 1; X.say(m, 'Zzzt.'); const a0 = Math.atan2(X.me.y - m.y, X.me.x - m.x); for (const da of [-0.45, 0, 0.45]) { const a = a0 + da; X.warn({ shape: 'line', x: m.x, y: m.y, a, len: 10, w: 1.0, life: 0.85, max: 0.85, src: m, color: VIOLET_HI, fn: () => { if (X.inLine(m.x, m.y, a, 10, 1.0)) X.hurtPet(m.dmg * 1.2, m); } }); } }
          if (T > 1.3) done(m, 1.5); break; }
        case 'blink': { if (m.step === 0) { m.step = 1; X.say(m, 'Behind you.'); const a = Math.atan2(X.me.vy || 0.01, X.me.vx || 0.01), p = X.freeSpot(X.me.x - Math.cos(a) * 2.4, X.me.y - Math.sin(a) * 2.4, m.r) || { x: m.x, y: m.y }; X.sparks(m.x, m.y, VIOLET_HI, 14, 6); m.x = p.x; m.y = p.y; X.sparks(m.x, m.y, VIOLET_HI, 14, 6); X.warn({ x: m.x, y: m.y, r: 2.4, life: 0.75, max: 0.75, src: m, color: VIOLET_HI, fn: () => { if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 2.4 + X.me.r) X.hurtPet(m.dmg * 1.4, m); X.ring(m.x, m.y, 0.3, 2.6, 0.3, VIOLET_HI, 0.3); } }); }
          if (T > 1.2) done(m, 1.6); break; }
        default: done(m, 1); } },
    /* Coolant: a spray cone that chills, and a slick puddle that slows */
    coolpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['spray', 'slick', 'spray'] : ['spray', 'slick']); }
      const T = m.actT; switch (m.act) {
        case 'spray': { if (m.step === 0) { m.step = 1; m.sa = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.say(m, 'Cool off.'); X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.sa, len: 5, spread: 0.7, life: 0.7, max: 0.7, src: m, color: TEAL_HI, fn: () => { if (X.inCone(m.x, m.y, m.sa, 5, 0.7)) { X.hurtPet(m.dmg * 1.2, m); X.chillPet && X.chillPet(2); } } }); }
          if (T > 1.1) done(m, 1.4); break; }
        case 'slick': { if (m.step === 0) { m.step = 1; const px = X.me.x, py = X.me.y; X.warn({ x: px, y: py, r: 2.2, life: 0.8, max: 0.8, src: m, color: TEAL, fn: () => { X.zone({ kind: 'stall', x: px, y: py, r: 2.2, life: 4, max: 4, own: 'enemy' }); if (Math.hypot(X.me.x - px, X.me.y - py) < 2.2) X.hurtPet(m.dmg, m); } }); }
          if (T > 1.2) done(m, 1.5); break; }
        default: done(m, 1); } },
    /* Overload: three bombs that tick, then a ring of fire round it */
    corepet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['bombs', 'ring', 'bombs'] : ['bombs', 'ring']); }
      const T = m.actT; switch (m.act) {
        case 'bombs': { if (m.step < 3 && T > m.step * 0.35) { m.step++; const px = X.me.x + (Math.random() - 0.5) * 3.5, py = X.me.y + (Math.random() - 0.5) * 3.5; X.warn({ x: px, y: py, r: 1.5, life: 1.2, max: 1.2, src: m, color: AMBER, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.5 + X.me.r) X.hurtPet(m.dmg * 1.1, m); X.boom(px, py, 1.4, AMBER, '#FFFFFF', { n: 14, shake: 4 }); } }); if (m.step === 1) X.say(m, 'Tick tock.'); }
          if (T > 2.0) done(m, 1.5); break; }
        case 'ring': { if (m.step === 0) { m.step = 1; X.say(m, 'Overload!'); X.warn({ x: m.x, y: m.y, r: 3.6, life: 1.1, max: 1.1, src: m, color: AMBER, fn: () => { if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 3.6 + X.me.r) X.hurtPet(m.dmg * 1.5, m); X.ring(m.x, m.y, 0.3, 3.8, 0.4, AMBER, 0.35); } }); }
          if (T > 1.5) done(m, 1.7); break; }
        default: done(m, 1); } },
  });

  /* ---- the rift ---- */
  const SEALING = { fall: 'THE ENGINE FALLS SILENT', sub: 'The violet current gutters out of the seams; the hull cools and settles', sigil: 'THE CHARGE SIGIL', name: 'The Yuggoth Engine', color: VIOLET_HI };
  const ST = (typeof YUG_STAGES !== 'undefined' && YUG_STAGES) || {};
  const placeholder = (name, goal) => ({ name, goal, how: goal, layout: ['##########', '#........#', '#...E....#', '#........#', '#...S....#', '##########'], legend: { E: {} }, make(X, self, H) { const e = X.M.marks.E[0]; self.done = true; H.setExit(e.x, e.y, 'The way on'); return {}; } });
  defRift({
    ease: 0.55,
    id: 'yuggoth', n: 6, name: 'The Yuggoth Engine', lvl: 60, sigil: 'Charge', biome: 'wreckfield', aff: ['spark', 'dark'], region: 'the crash site',
    blurb: 'A living engine fell out of the dark and broke open on the plain, still humming. Hunt live monsters to power its circuits, outrun its spinning coil, and escape the meltdown.', gate: { anima: 'aquarius', name: 'The Raincatcher Array' },
    mons: ['sparkmite', 'hullwing', 'coilsentry'], sealing: SEALING,
    stages: riftSections([
      { biome: 'wreckfield', pattern: ['fight', 'trial', 'boss'], mods: ['random'], fights: ['The Torn Hull'], minis: ['arcpet'], extra: cellsExtra, trials: [ST.CONDUCTOR || placeholder('The Conductor Hunt', 'Power the three circuits')], boss: 'khaal', bossName: 'Kh\'aal the Hull-Eater', bossRoom: 'The Breach' },
      { biome: 'coolant', pattern: ['fight', 'trial', 'boss'], mods: ['random'], fights: ['The Coolant Vaults'], minis: ['coolpet'], trials: [ST.COIL || placeholder('The Spinning Coil', 'Gather the sparks')], boss: 'ixvorra', bossName: 'Ix-Vorra the Living Conductor', bossRoom: 'The Capacitor Hall' },
      { biome: 'engineheart', pattern: ['trial', 'fight', 'boss'], mods: ['curse'], fights: ['The Engine Heart'], minis: ['corepet'], trials: [ST.MELTDOWN || placeholder('The Meltdown Run', 'Outrun the meltdown')], boss: 'nyarzhul', bossName: 'Nyar\'zhul, Heart of the Engine', bossRoom: 'The Core Chamber' },
    ]),
  });
  /* over every stage of the rift: the coil sentries' beams of current, drawn as crackling lines between the two */
  const ARCS = { list: [], t: 0 };
  const CONDUCT = { metalspike: 3.4, pylon: 3.1, neonpost: 2.8, hullshard: 1.6 };
  function ambientArcs(X, dt) { const A = ARCS; A.t -= dt; A.list = A.list.filter(a => (a.life -= dt) > 0);
    const W = X.W(), Hh = X.H ? X.H() : 900, T = X.Tz(), on = p => { const xs = X.sx(p.x), ys = X.sy(p.y); return xs > -T * 2 && xs < W + T * 2 && ys > -T * 2 && ys < Hh + T * 4; };
    if (A.t <= 0) { A.t = 0.12 + Math.random() * 0.25; const tall = (X.props || []).filter(p => CONDUCT[p.kind] && on(p));
      const r = Math.random();
      if (tall.length >= 2 && r < 0.55) { const a = tall[Math.floor(Math.random() * tall.length)], near = tall.filter(b => b !== a && Math.hypot(b.x - a.x, b.y - a.y) < 7); if (near.length) { const b = near[Math.floor(Math.random() * near.length)]; A.list.push({ ax: a.x, ay: a.y, ah: CONDUCT[a.kind], bx: b.x, by: b.y, bh: CONDUCT[b.kind], life: 0.22, max: 0.22, seed: Math.random() * 99 }); } }
      else if (tall.length && r < 0.85) { const a = tall[Math.floor(Math.random() * tall.length)], ang = Math.random() * TAU, d = 1.5 + Math.random() * 2.5; A.list.push({ ax: a.x, ay: a.y, ah: CONDUCT[a.kind], bx: a.x + Math.cos(ang) * d, by: a.y + Math.sin(ang) * d * 0.7, bh: 0, life: 0.18, max: 0.18, seed: Math.random() * 99, ground: true }); }
      else { const x = X.me.x + (Math.random() - 0.5) * 14, y = X.me.y + (Math.random() - 0.5) * 18; A.list.push({ ax: x + (Math.random() - 0.5) * 2, ay: y, ah: 9, bx: x, by: y, bh: 0, life: 0.2, max: 0.2, seed: Math.random() * 99, ground: true, sky: true }); }
      if (Math.random() < 0.6) { const x = X.me.x + (Math.random() - 0.5) * 12, y = X.me.y + (Math.random() - 0.5) * 16; for (let i = 0; i < 4; i++) X.part({ kind: 'spark', x, y: y - 0.2, vx: (Math.random() - 0.5) * 5, vy: -2 - Math.random() * 3, g: 9, life: 0.45, max: 0.45, size: 2, color: Math.random() < 0.5 ? '#FFFFFF' : VIOLET_HI }); } } }
  function drawArcs(c, X) { const T = X.Tz(), t = X.g.t; for (const a of ARCS.list) { const k = a.life / a.max, ax = X.sx(a.ax), ay = X.sy(a.ay) - a.ah * T, bx = X.sx(a.bx), by = X.sy(a.by) - a.bh * T, n = Math.max(5, Math.round(Math.hypot(bx - ax, by - ay) / (T * 0.5))), nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny) || 1;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [w, col, al] of [[T * 0.36, '#8A2BD8', 0.35], [T * 0.13, VIOLET_HI, 0.85], [T * 0.045, '#FFFFFF', 1]]) { c.globalAlpha = al * k; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(ax, ay); for (let i = 1; i <= n; i++) { const u = i / n, j = i < n ? (Math.sin(a.seed * 7 + i * 2.9 + t * 60) * 0.5 + (((a.seed * 13 + i * 7.3) % 1) - 0.5)) * T * 0.5 : 0; c.lineTo(ax + (bx - ax) * u + nx / L * j, ay + (by - ay) * u + ny / L * j); } c.stroke(); }
      c.globalAlpha = 0.6 * k; blitSized(c, glowSprite(VIOLET), bx - T * 0.9, by - T * 0.9, T * 1.8, T * 1.8); if (a.ground) { c.globalAlpha = 0.5 * k; blitSized(c, glowSprite('#FFFFFF'), bx - T * 0.5, by - T * 0.5, T, T); }
      c.restore(); } }
  RIFT_BY_ID.yuggoth.everyStage = (X) => ({ update(dt) { ambientArcs(X, dt); }, drawOver(c) { drawArcs(c, X); }, drawGround(c) { const T = X.Tz(), t = X.g.t; for (const m of X.mons) { const L = m.link; if (m.dead || !L || L.to.dead) continue; const live = L.t < L.max - 0.8, ax = X.sx(m.x), ay = X.sy(m.y - 0.5) - T * 0.5, bx = X.sx(L.to.x), by = X.sy(L.to.y - 0.3) - T * 0.3;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      if (!live) { c.globalAlpha = 0.6; c.strokeStyle = VIOLET_HI; c.lineWidth = 2; c.setLineDash([8, 6]); c.lineDashOffset = -t * 30; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); }
      else for (const [w, col, a] of [[T * 0.32, VIOLET, 0.35], [T * 0.12, VIOLET_HI, 0.8], [T * 0.04, '#FFFFFF', 1]]) { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(ax, ay); const n = 8; for (let i = 1; i <= n; i++) { const u = i / n, j = i < n ? (Math.sin(t * 40 + i * 2.3 + m.x) * T * 0.18) : 0, nx = -(by - ay), ny = bx - ax, L2 = Math.hypot(nx, ny) || 1; c.lineTo(ax + (bx - ax) * u + nx / L2 * j, ay + (by - ay) * u + ny / L2 * j); } c.stroke(); }
      c.restore(); } } });
  YUG.cellsExtra = cellsExtra; YUG.discharge = discharge; YUG.bolt = bolt;
})();
