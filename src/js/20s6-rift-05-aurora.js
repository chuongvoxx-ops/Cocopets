/* ---------- Rift 05: The Pale Aurora ----------
   A glacier lifted into the night sky, carrying the ruins of an observatory; the aurora overhead is the outline of a
   vast open eye. Cold white, deep navy, muted ice blue, aurora green. Snow lies in broad smooth caps; ice cliffs are
   large bevelled wedges; tall stone arches lean outward like ribs. Three lands:
   I   The Split Iceberg: a snowfield on the glacier's edge, clouds far below, night.
   II  The Observatory Ruins: roofless stone galleries, snow-capped arches, the aurora bright.
   III The Whiteout Summit: the broad top of the glacier in blowing white (floor and monsters always readable).
   Monsters: rime scuttlers (three-legged ice beetles: brace, then an ice spike), veil rays (pale kites with ribbon
   tails and a green eye: they lay a narrow wind corridor along their tails), frost lanterns (a dark core in a floating
   ice cage: their slow aura shields the monsters near them: break them first).
   Stages: I  The Split Iceberg (dungeon, four giant ice crystals to break as well) · The Windbreak Crossing · Thul
           II The Frozen Stair (dungeon) · The Avalanche Galleries · Nivora the Aurorawing
           III Whiteout Ascent · The Last Shelter (dungeon, a curse) · Ahuul the White Horizon, then the sealing. */
const AUR = { INK: '#2B2433', SNOW: '#E4EDF0', NAVY: '#172C4D', ICE: '#86B7D0', ICE_HI: '#CFE8F4', GREEN: '#78D7B2', GREEN_HI: '#B8F5DA', STONE: '#4A5468' };
(() => {
  const TAU = Math.PI * 2, { INK, SNOW, NAVY, ICE, ICE_HI, GREEN, GREEN_HI, STONE } = AUR;
  BIOMES.glacier = { name: 'The Split Iceberg', rift: true, iceBridge: true, tile: 'frost', out: true, dark: 0.12, bg: '#0B1830', gap: 'iceabyss', ambient: 'snow', accent: GREEN, light: '#E8F8FF',
    floor: ['#DCE7EC', '#D3E0E7', '#E6EEF2'], grout: '#AFC4D0', hi: '#FFFFFF', top: '#9CC3D8', face: '#4F7FA0', faceD: '#2E5578', cliff: '#3E6A8E', deco: GREEN, path: ['#C8D8E2', '#C2D3DE'], mud: ['#BFD4E0', '#C8DCE6'], mudSpot: 'rgba(255,255,255,.3)',
    props: ['snowhill', 'snowrock', 'icewedge', 'snowhill', 'icewedge', 'frozenvane', 'snowhill'], propN: [5, 3], hazard: 'icicle', grade: 'rgba(120,170,230,.08)', fog: '#0B1830', darkRGB: '6,14,34' };
  BIOMES.observatory = { name: 'The Observatory Ruins', rift: true, iceBridge: true, tile: 'mountain', out: true, dark: 0.18, bg: '#08142A', gap: 'iceabyss', ambient: 'sparkles', accent: GREEN_HI, light: '#E0FFF2',
    floor: ['#56647C', '#515F76', '#5C6A82'], grout: '#3A4458', hi: '#7A8AA4', top: '#E4EDF0', face: '#3A4458', faceD: '#262E3E', cliff: '#2E3850', deco: GREEN, path: ['#6A7890', '#64728A'],
    props: ['obsarch', 'telescope', 'snowrock', 'obsarch', 'icewedge'], propN: [4, 3], hazard: 'icicle', grade: 'rgba(120,215,178,.08)', fog: '#08142A', darkRGB: '4,12,26' };
  BIOMES.whiteout = { name: 'The Whiteout Summit', rift: true, iceBridge: true, haze: { col: '232,242,250', veil: 0.16, edge: 0.34, tint: 0.07 }, tile: 'frost', out: true, dark: 0.04, bg: '#C8D8E6', gap: 'iceabyss', ambient: 'snow', accent: '#FFB35C', light: '#FFFFFF',
    floor: ['#EEF4F7', '#E7EFF3', '#F4F8FA'], grout: '#C4D4DE', hi: '#FFFFFF', top: '#E4EDF0', face: '#86B7D0', faceD: '#5A8AAA', cliff: '#6A9ABA', deco: '#FFB35C', path: ['#DDE8EE', '#D6E2E9'], mud: ['#D8E4EC', '#E0EAF0'], mudSpot: 'rgba(255,255,255,.3)',
    props: ['snowrock', 'icewedge', 'snowrock', 'stonearch'], propN: [3, 3], hazard: 'icicle', grade: 'rgba(230,240,255,.1)', fog: '#C8D8E6', darkRGB: '20,30,50' };
  BIOME_ORDER.push('glacier', 'observatory', 'whiteout');
  DARK_COL.glacier = '6,14,34'; DARK_COL.observatory = '4,12,26'; DARK_COL.whiteout = '20,30,50';

  /* ---- props ---- */
  const { PROPS } = DunWorld, { LN, shade, stroke, spec, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(0,0,0,${a || 0.25})`; c.beginPath(); c.ellipse(0, 0, T * w, T * w * 0.32, 0, 0, TAU); c.fill(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const snowCap = (c, pts, lw) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = '#F6FAFC'; c.fill(); stroke(c, lw * 0.8); };
  Object.assign(PROPS, {
    /* a dark rock under a broad smooth cap of snow */
    snowrock(c, T, v) { const lw = lw0(T), w = T * (0.55 + (v % 2) * 0.15), h = T * (0.6 + (v % 3) * 0.12); shadowEll(c, T, w / T, 0.28);
      c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w * 0.9, -h * 0.6); c.lineTo(-w * 0.3, -h); c.lineTo(w * 0.5, -h * 0.9); c.lineTo(w, -h * 0.3); c.lineTo(w * 0.85, 0); c.closePath(); c.fillStyle = shade(c, STONE, w, -w * 0.2, -h * 0.5, 0.35); c.fill(); stroke(c, lw);
      snowCap(c, [[-w * 0.95, -h * 0.55], [-w * 0.3, -h * 1.06], [w * 0.5, -h * 0.96], [w * 1.0, -h * 0.32], [w * 0.6, -h * 0.42], [w * 0.1, -h * 0.62], [-w * 0.5, -h * 0.5]], lw); },
    /* a giant smooth hill of snow, soft blue shading, a few glints */
    snowhill(c, T, v) { const lw = lw0(T), w = T * (1.05 + (v % 2) * 0.12), h = T * (1.25 + (v % 3) * 0.22); c.fillStyle = 'rgba(40,70,110,.25)'; c.beginPath(); c.ellipse(0, T * 0.02, w * 1.05, w * 0.3, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-w, 0); c.bezierCurveTo(-w * 0.95, -h * 0.55, -w * 0.45, -h * 1.02, w * 0.05, -h); c.bezierCurveTo(w * 0.55, -h * 0.98, w * 0.98, -h * 0.5, w, 0); c.closePath();
      const g = c.createRadialGradient(-w * 0.3, -h * 0.75, w * 0.1, 0, -h * 0.4, w * 1.2); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.55, '#E6F0F5'); g.addColorStop(1, '#A9C6D8'); c.fillStyle = g; c.fill(); stroke(c, lw);
      c.fillStyle = 'rgba(134,183,208,.35)'; c.beginPath(); c.moveTo(w * 0.15, -h * 0.95); c.bezierCurveTo(w * 0.6, -h * 0.9, w * 0.95, -h * 0.45, w * 0.98, 0); c.lineTo(w * 0.55, 0); c.bezierCurveTo(w * 0.6, -h * 0.45, w * 0.45, -h * 0.75, w * 0.15, -h * 0.95); c.closePath(); c.fill();
      c.fillStyle = '#FFFFFF'; [[-0.45, -0.7], [0.05, -0.88], [-0.15, -0.45]].forEach(([x, y]) => { c.beginPath(); c.arc(x * w, y * h, T * 0.05, 0, TAU); c.fill(); }); },
    /* a large bevelled wedge of ice */
    icewedge(c, T, v) { const lw = lw0(T), w = T * (0.7 + (v % 2) * 0.2), h = T * (1.2 + (v % 3) * 0.25); shadowEll(c, T, w / T, 0.25); glowIn(c, 0, -h * 0.5, w * 1.2, ICE_HI, 0.25);
      c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w * 0.55, -h); c.lineTo(0, -h * 0.85); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#DDF0F8'; c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h * 0.85); c.lineTo(-w * 0.55, -h); c.lineTo(w * 0.35, -h * 0.75); c.lineTo(w, 0); c.closePath(); c.fillStyle = shade(c, ICE, w, w * 0.2, -h * 0.5, 0.3); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-w * 0.55, -h); c.lineTo(-w * 0.75, -h * 0.35); c.stroke(); snowCap(c, [[-w * 0.7, -h * 0.96], [-w * 0.55, -h * 1.04], [w * 0.35, -h * 0.8], [w * 0.1, -h * 0.74]], lw); },
    /* a black stone vane with a triangular metal flag (decoration; the working ones are drawn by the crossing) */
    frozenvane(c, T) { const lw = lw0(T); shadowEll(c, T, 0.3); c.fillStyle = '#1E2638'; c.fillRect(-T * 0.08, -T * 1.7, T * 0.16, T * 1.7); c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(-T * 0.08, -T * 1.7, T * 0.16, T * 1.7); c.fillStyle = '#9AA8B8'; c.beginPath(); c.moveTo(T * 0.08, -T * 1.65); c.lineTo(T * 0.7, -T * 1.45); c.lineTo(T * 0.08, -T * 1.25); c.closePath(); c.fill(); stroke(c, lw); },
    /* a tall observatory arch of grey stone, leaning outward, snow on its crown */
    obsarch(c, T, v) { const lw = lw0(T), lean = (v % 2 ? 1 : -1) * T * 0.15; shadowEll(c, T, 0.7, 0.25);
      [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(sd * T * 0.55, 0); c.lineTo(sd * T * 0.6 + lean, -T * 2.0); c.lineTo(sd * T * 0.35 + lean, -T * 2.0); c.lineTo(sd * T * 0.32, 0); c.closePath(); c.fillStyle = shade(c, '#6A7890', T * 0.4, sd * T * 0.4, -T, 0.3); c.fill(); stroke(c, lw); });
      c.beginPath(); c.moveTo(-T * 0.62 + lean, -T * 2.0); c.quadraticCurveTo(lean, -T * 2.9, T * 0.62 + lean, -T * 2.0); c.lineTo(T * 0.35 + lean, -T * 2.0); c.quadraticCurveTo(lean, -T * 2.5, -T * 0.35 + lean, -T * 2.0); c.closePath(); c.fillStyle = '#6A7890'; c.fill(); stroke(c, lw);
      snowCap(c, [[-T * 0.5 + lean, -T * 2.25], [lean, -T * 2.78], [T * 0.5 + lean, -T * 2.25], [lean, -T * 2.5]], lw); },
    /* the ruin of a telescope: a long brass tube on a stone foot, tilted to the sky */
    telescope(c, T) { const lw = lw0(T); shadowEll(c, T, 0.6, 0.25); c.fillStyle = '#4A5468'; c.fillRect(-T * 0.35, -T * 0.6, T * 0.7, T * 0.6); c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(-T * 0.35, -T * 0.6, T * 0.7, T * 0.6);
      c.save(); c.translate(0, -T * 0.7); c.rotate(-0.8); c.fillStyle = '#B89A5E'; c.beginPath(); c.rect(-T * 0.15, -T * 1.4, T * 0.3, T * 1.6); c.fill(); stroke(c, lw); c.fillStyle = '#8A7040'; c.fillRect(-T * 0.2, -T * 1.45, T * 0.4, T * 0.2); c.strokeRect(-T * 0.2, -T * 1.45, T * 0.4, T * 0.2); c.restore(); snowCap(c, [[-T * 0.38, -T * 0.62], [T * 0.38, -T * 0.62], [T * 0.2, -T * 0.7], [-T * 0.2, -T * 0.72]], lw); },
    /* a low dark stone arch (a niche on the summit) */
    stonearch(c, T) { const lw = lw0(T); shadowEll(c, T, 0.7, 0.25); c.beginPath(); c.moveTo(-T * 0.7, 0); c.lineTo(-T * 0.7, -T * 1.1); c.quadraticCurveTo(0, -T * 1.9, T * 0.7, -T * 1.1); c.lineTo(T * 0.7, 0); c.lineTo(T * 0.42, 0); c.lineTo(T * 0.42, -T * 1.0); c.quadraticCurveTo(0, -T * 1.5, -T * 0.42, -T * 1.0); c.lineTo(-T * 0.42, 0); c.closePath(); c.fillStyle = '#2E3850'; c.fill(); stroke(c, lw); snowCap(c, [[-T * 0.6, -T * 1.25], [0, -T * 1.82], [T * 0.6, -T * 1.25], [0, -T * 1.55]], lw); },
  });

  /* ---- the brood ---- */
  Object.assign(MON, {
    rimescuttler: { name: 'Rime scuttler', from: 999, hp: 190, spd: 1.6, r: 0.42, dmg: 14, xp: 12, coin: 0.7, color: '#F2F7FA', bio: ['glacier', 'observatory', 'whiteout'], tip: 'Braces its front legs (they plant), then fires an ice spike along a shown line.', kit: [] },
    veilray: { name: 'Veil ray', from: 999, hp: 150, spd: 1.5, r: 0.45, dmg: 11, xp: 12, coin: 0.7, color: '#A8D4EC', bio: ['glacier', 'observatory', 'whiteout'], fly: true, tip: 'Lays a narrow wind corridor along its tails: inside it you are pushed. Step out of the lane.', kit: [] },
    frostlantern: { name: 'Frost lantern', from: 999, hp: 140, spd: 1.0, r: 0.36, dmg: 10, xp: 14, coin: 0.9, color: '#86B7D0', bio: ['glacier', 'observatory', 'whiteout'], fly: true, tip: 'Its slow aura shields the monsters near it (they take half damage). Break the lanterns first.', kit: [] },
  });
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  Object.assign(MP, {
    /* a three-legged ice beetle: a faceted white shell over a navy underside */
    rimescuttler(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU), brace = o.mode === 'block' ? 1 : 0;
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, r * 0.85, r * 0.95, r * 0.28, 0, 0, TAU); c.fill();
      // legs: two behind, one long one in front (planted when it braces)
      limb(c, -r * 0.4, r * 0.2, -r * 0.9 - run * r * 0.15, r * 0.85, lw * 1.1, NAVY); limb(c, -r * 0.05, r * 0.25, -r * 0.3 + run * r * 0.15, r * 0.9, lw * 1.1, NAVY);
      limb(c, r * 0.4, r * 0.05, brace ? r * 1.15 : r * 0.85 + run * r * 0.1, brace ? r * 0.88 : r * 0.7, lw * 1.2, NAVY);
      c.beginPath(); c.ellipse(0, r * 0.2, r * 0.8, r * 0.35, 0, 0, TAU); c.fillStyle = NAVY; c.fill(); stroke(c, lw);
      // the faceted shell
      c.beginPath(); c.moveTo(-r * 0.85, r * 0.15); c.lineTo(-r * 0.55, -r * 0.45); c.lineTo(r * 0.1, -r * 0.62); c.lineTo(r * 0.7, -r * 0.3); c.lineTo(r * 0.85, r * 0.1); c.closePath(); c.fillStyle = o.color; c.fill(); stroke(c, lw);
      c.fillStyle = ICE_HI; c.beginPath(); c.moveTo(-r * 0.55, -r * 0.45); c.lineTo(r * 0.1, -r * 0.62); c.lineTo(0, r * 0.05); c.closePath(); c.fill(); c.fillStyle = ICE; c.beginPath(); c.moveTo(r * 0.1, -r * 0.62); c.lineTo(r * 0.7, -r * 0.3); c.lineTo(r * 0.85, r * 0.1); c.lineTo(0, r * 0.05); c.closePath(); c.fill(); stroke(c, lw * 0.6);
      c.fillStyle = GREEN; c.beginPath(); c.arc(r * 0.72, -r * 0.05, r * 0.09, 0, TAU); c.fill(); if (brace) glowIn(c, r * 0.9, -r * 0.05, r * 0.45, ICE_HI, 0.8); },
    /* a pale blue kite: a diamond body (solid, shaded), two trailing ribbon tails, a bright green eye */
    veilray(c, r, ph, o) { const lw = lwOf(r), bob = Math.sin(ph * TAU) * r * 0.12, fl = Math.sin(ph * TAU * 2);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, r * 1.15, r * 0.8, r * 0.22, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, bob - r * 0.3);
      [-1, 1].forEach(sd => { c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.3, sd * r * 0.12); c.bezierCurveTo(-r * 0.9, sd * r * 0.3 + fl * r * 0.2, -r * 1.3, sd * r * 0.1 - fl * r * 0.2, -r * 1.8, sd * r * 0.35); c.stroke(); c.strokeStyle = sd < 0 ? GREEN_HI : ICE_HI; c.lineWidth = lw * 1.1; c.stroke(); });
      c.beginPath(); c.moveTo(r * 0.85, 0); c.lineTo(0, -r * 0.7 - fl * r * 0.08); c.lineTo(-r * 0.45, 0); c.lineTo(0, r * 0.55 + fl * r * 0.05); c.closePath(); c.fillStyle = shade(c, o.color, r, 0, -r * 0.3, 0.45); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(r * 0.85, 0); c.lineTo(-r * 0.45, 0); c.moveTo(0, -r * 0.7); c.lineTo(0, r * 0.55); c.stroke();
      glowIn(c, r * 0.12, -r * 0.05, r * 0.35, GREEN, o.mode === 'block' ? 1 : 0.6); c.fillStyle = GREEN_HI; c.beginPath(); c.arc(r * 0.12, -r * 0.05, r * 0.12, 0, TAU); c.fill(); c.restore(); },
    /* a fist-sized dark core in a floating polygonal ice cage; its aura pulses slowly */
    frostlantern(c, r, ph, o) { const lw = lwOf(r), bob = Math.sin(ph * TAU) * r * 0.15, k = 0.5 + 0.5 * Math.sin(ph * TAU);
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, r * 1.25, r * 0.55, r * 0.18, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, bob - r * 0.5); glowIn(c, 0, 0, r * (1.5 + k * 0.5), ICE_HI, 0.35 + 0.25 * k);
      c.fillStyle = '#0E1626'; c.beginPath(); c.arc(0, 0, r * 0.38, 0, TAU); c.fill(); glowIn(c, 0, 0, r * 0.4, GREEN, 0.5 + 0.4 * k);
      const n = 6, pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + ph * 0.6; pts.push([Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.95]); }
      c.strokeStyle = LN; c.lineWidth = lw * 2; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke(); c.strokeStyle = ICE_HI; c.lineWidth = lw; c.stroke();
      c.strokeStyle = 'rgba(207,232,244,.8)'; c.lineWidth = lw * 0.8; pts.forEach(([x, y], i) => { if (i % 2) return; c.beginPath(); c.moveTo(x, y); c.lineTo(pts[(i + 3) % n][0], pts[(i + 3) % n][1]); c.stroke(); });
      c.restore(); },
  });
  Object.assign(EXT, { rimescuttler: 2.0, veilray: 2.4, frostlantern: 2.2 });
  Object.assign(NF, { rimescuttler: 6, veilray: 6, frostlantern: 6 });
  const { mon, keepRange } = DunAI;
  Object.assign(mon, {
    rimescuttler(m, A, X) {
      if (m.braceT > 0) { m.braceT -= A.dt; m.mode = 'block'; m.face = Math.cos(m.ba) >= 0 ? 1 : -1; if (m.braceT <= 0) { m.mode = null; X.eshot(m.x + Math.cos(m.ba) * 0.5, m.y - 0.2, m.ba, 8, { dmg: m.dmg * 1.2, color: ICE_HI, core: '#FFFFFF', r: 0.16, style: 'arrow', life: 1.1 }); m.cd = 2.2 + Math.random(); X.sfx.twang && X.sfx.twang(); } return; }
      keepRange(m, A, X, 2.5, 5);
      if (m.cd <= 0 && A.d < 7 && A.los()) { m.braceT = 0.6; m.ba = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 8, w: 0.45, life: 0.6, max: 0.6, src: m, color: ICE_HI }); }
    },
    veilray(m, A, X) {
      // hangs at range; lays a narrow wind lane along its tails (away from it, through you): inside the lane you are pushed
      keepRange(m, A, X, 3.5, 6);
      if (m.lane) { m.lane.t -= A.dt; const L = m.lane; if (L.t < L.max - 0.7) { const px = X.me.x - L.x, py = X.me.y - L.y, along = px * Math.cos(L.a) + py * Math.sin(L.a), off = Math.abs(-px * Math.sin(L.a) + py * Math.cos(L.a)); if (along > 0 && along < 9 && off < 0.9 && !X.me.dodge) X.moveEnt(X.me, Math.cos(L.a) * 5.5 * A.dt, Math.sin(L.a) * 5.5 * A.dt); } if (L.t <= 0) m.lane = null; m.mode = 'block'; return; }
      m.mode = null;
      if (m.cd <= 0 && A.d < 8) { m.cd = 5 + Math.random() * 2; m.lane = { x: m.x, y: m.y, a: A.a, t: 3.4, max: 3.4 }; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 9, w: 1.8, life: 0.7, max: 0.7, src: m, color: GREEN_HI }); X.zone({ kind: 'windlane', x: m.x, y: m.y, a: A.a, len: 9, w: 1.8, life: 3.4, max: 3.4, own: 'none' }); }
      else if (m.atkCd <= 0 && A.d < 6 && A.los()) { m.atkCd = 2; X.eshot(m.x, m.y - 0.3, A.a, 6, { dmg: m.dmg * 0.8, color: GREEN_HI, core: '#FFFFFF', r: 0.14 }); }
    },
    frostlantern(m, A, X) {
      // drifts behind its pack; its aura shields the monsters near it
      keepRange(m, A, X, 4, 7);
      m.guardFn = m.guardFn || (() => 1);
      for (const q of X.mons) { if (q.dead || q === m || q.boss) continue; const near = Math.hypot(q.x - m.x, q.y - m.y) < 3.2; if (near) { q.lanternT = 0.3; if (!q._lantG) { q._lantG = true; const old = q.guardFn; q.guardFn = (qq, o) => (qq.lanternT > 0 ? 0.5 : 1) * (old ? old(qq, o) : 1); } } else if (q.lanternT > 0) q.lanternT -= A.dt; }
      if (m.atkCd <= 0 && A.d < 5 && A.los()) { m.atkCd = 2.6; X.eshot(m.x, m.y - 0.4, A.a, 5, { dmg: m.dmg, color: ICE_HI, core: '#FFFFFF', r: 0.15 }); }
    },
  });

  /* ---- the Split Iceberg's four great crystals: they must be broken too ---- */
  Object.assign(MON, { aurcrystal: { name: 'Great ice crystal', from: 999, hp: 1600, spd: 0, r: 0.9, dmg: 0, xp: 10, coin: 0.5, color: ICE_HI, bio: ['glacier'], still: true, tip: 'Four of these hold the way shut: break them all. Each shatters with a burst that freezes the monsters near it.', kit: [],
    onDeath(m, X) { let n = 0; for (const q of X.mons) if (!q.dead && q !== m && !q.boss && Math.hypot(q.x - m.x, q.y - m.y) < 5) { q.freeze = Math.max(q.freeze || 0, 3); n++; } X.boom(m.x, m.y, 3, ICE_HI, '#FFFFFF', { n: 30, shake: 8 }); X.ring(m.x, m.y, 0.4, 5, 0.5, GREEN_HI, 0.35); if (X.sfx.crash) X.sfx.crash(); } } });
  MP.aurcrystal = (c, r, ph, o) => { MP.icecrystal(c, r, ph, o); glowIn(c, 0, -r * 1.4, r * 0.9, GREEN, 0.45 + 0.15 * Math.sin(ph * TAU)); };
  Object.assign(EXT, { aurcrystal: 3.0 }); Object.assign(NF, { aurcrystal: 1 }); mon.aurcrystal = () => {};
  function crystalsExtra(X, self, H) {
    const M = X.M, list = []; const rooms = M.rooms.slice(1).sort(() => Math.random() - 0.5);
    for (const rm of rooms) { if (list.length >= 4) break; const q = X.freeSpot(rm.x + rm.w * 0.5, rm.y + rm.h * 0.5, 1.0); if (!q) continue; const m = X.spawnMon('aurcrystal', q.x, q.y, { pack: 890, rift: true }); m.aggro = false; list.push(m); }
    return { list, left: () => list.filter(m => !m.dead).length,
      drawOver(c) { const n = list.filter(m => !m.dead).length; if (!n || self.done) return; const W = X.W(); c.save(); c.fillStyle = 'rgba(14,26,48,.8)'; c.strokeStyle = ICE_HI; c.lineWidth = 1.5; GFX.rr(c, W / 2 - 92, 120, 184, 24, 11); c.fill(); c.stroke(); c.font = `800 12px ${arcFont}`; c.textAlign = 'center'; c.fillStyle = '#E8F8FF'; c.fillText(`Great ice crystals left: ${n} of ${list.length}`, W / 2, 136); c.restore(); } };
  }

  /* ---- the mini bosses: Rift-touched Cocopets with the cold's tricks ---- */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; };
  BOSSES.push(
    { id: 'rimepet', rift: true, name: 'Rime', title: 'A Rift-touched Cocopet', hp: 52000, dmg: 34, r: 1.35, spd: 1.8, color: '#9CC3D8', glow: ICE_HI, biome: 'glacier', el: 'frost' },
    { id: 'galepet', rift: true, name: 'Gale', title: 'A Rift-touched Cocopet', hp: 58000, dmg: 34, r: 1.3, spd: 2.0, color: '#3A4458', glow: GREEN_HI, biome: 'observatory', el: 'wind' },
    { id: 'whitepet', rift: true, name: 'Whiteout', title: 'A Rift-touched Cocopet', hp: 66000, dmg: 38, r: 1.5, spd: 1.6, color: '#E4EDF0', glow: '#FFB35C', biome: 'whiteout', el: 'frost' });
  Object.assign(DunAI.boss, {
    /* Rime: a ring of ice spikes round you, and a sliding charge on the ice */
    rimepet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 2.6 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['spikes', 'slide', 'slide', 'spikes'] : ['spikes', 'slide']); }
      const T = m.actT; switch (m.act) {
        case 'spikes': { if (m.step === 0) { m.step = 1; X.say(m, 'Freeze.'); const cx = X.me.x, cy = X.me.y; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, px = cx + Math.cos(a) * 2.2, py = cy + Math.sin(a) * 2.2; X.warn({ x: px, y: py, r: 1.0, life: 0.9, max: 0.9, src: m, color: ICE_HI, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.0 + X.me.r) X.hurtPet(m.dmg, m); X.sparks(px, py, ICE_HI, 8, 4); } }); } X.warn({ x: cx, y: cy, r: 1.1, life: 1.3, max: 1.3, src: m, color: ICE_HI, fn: () => { if (Math.hypot(X.me.x - cx, X.me.y - cy) < 1.1 + X.me.r) X.hurtPet(m.dmg * 1.3, m); } }); }
          if (T > 1.6) done(m, 1.6); break; }
        case 'slide': { if (m.step === 0) { m.step = 1; m.ca = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'line', x: m.x, y: m.y, a: m.ca, len: 9, w: 1.8, life: 0.7, max: 0.7, src: m, color: ICE_HI }); X.say(m, 'Wheee.'); }
          if (T > 0.7 && T < 1.3) { X.moveEnt(m, Math.cos(m.ca) * 14 * A.dt, Math.sin(m.ca) * 14 * A.dt); if (A.d < m.r + X.me.r + 0.3 && !m.chit) { m.chit = true; X.hurtPet(m.dmg * 1.5, m); X.push(m.ca, 2); } }
          if (T > 1.6) { m.chit = false; done(m, 1.5); } break; }
        default: done(m, 1); } },
    /* Gale: a crosswind that shoves you toward it, then a slash */
    galepet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.2)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['gust', 'slash', 'gust'] : ['gust', 'slash']); }
      const T = m.actT; switch (m.act) {
        case 'gust': { if (m.step === 0) { m.step = 1; X.say(m, 'Wind.'); m.ga = Math.atan2(m.y - X.me.y, m.x - X.me.x); X.zone({ kind: 'windlane', x: X.me.x - Math.cos(m.ga) * 4, y: X.me.y - Math.sin(m.ga) * 4, a: m.ga, len: 12, w: 4, life: 2.2, max: 2.2, own: 'none' }); }
          if (T > 0.6 && T < 2.2 && !X.me.dodge) X.moveEnt(X.me, Math.cos(m.ga) * 3.5 * A.dt, Math.sin(m.ga) * 3.5 * A.dt);
          if (T > 1.2 && m.step === 1) { m.step = 2; X.warn({ x: m.x, y: m.y, r: 2.6, life: 0.8, max: 0.8, src: m, color: GREEN_HI, fn: () => { if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 2.6 + X.me.r) X.hurtPet(m.dmg * 1.3, m); X.ring(m.x, m.y, 0.3, 2.8, 0.3, GREEN_HI, 0.3); } }); }
          if (T > 2.4) done(m, 1.6); break; }
        case 'slash': { if (m.step === 0) { m.step = 1; m.sa = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.sa, len: 4.5, spread: 0.9, life: 0.6, max: 0.6, src: m, color: GREEN_HI, fn: () => { if (X.inCone(m.x, m.y, m.sa, 4.5, 0.9)) X.hurtPet(m.dmg * 1.3, m); } }); }
          if (T > 1.0) done(m, 1.2); break; }
        default: done(m, 1); } },
    /* Whiteout: snow blinds (rings round it) and a hail of shards */
    whitepet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['hail', 'nova', 'hail'] : ['hail', 'nova']); }
      const T = m.actT; switch (m.act) {
        case 'hail': { if (m.step < 5 && T > m.step * 0.25) { m.step++; const px = X.me.x + (Math.random() - 0.5) * 3, py = X.me.y + (Math.random() - 0.5) * 3; X.warn({ x: px, y: py, r: 1.1, life: 0.9, max: 0.9, src: m, color: '#FFFFFF', fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.1 + X.me.r) X.hurtPet(m.dmg, m); X.sparks(px, py, '#FFFFFF', 8, 4); } }); if (m.step === 1) X.say(m, 'Hail.'); }
          if (T > 2.2) done(m, 1.5); break; }
        case 'nova': { if (m.step === 0) { m.step = 1; X.say(m, 'Cold.'); X.warn({ x: m.x, y: m.y, r: 3.4, life: 1.0, max: 1.0, src: m, color: ICE_HI, fn: () => { if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 3.4 + X.me.r) { X.hurtPet(m.dmg * 1.4, m); X.chillPet && X.chillPet(2); } X.ring(m.x, m.y, 0.3, 3.6, 0.4, ICE_HI, 0.35); } }); }
          if (T > 1.4) done(m, 1.6); break; }
        default: done(m, 1); } },
  });

  /* ---- the rift ---- */
  const SEALING = { fall: 'THE WHITE HORIZON DISSOLVES', sub: 'A slow river of green stars; the glacier settles toward the clouds', sigil: 'THE SHELTER SIGIL', name: 'The Pale Aurora', color: GREEN_HI };
  const ST = (typeof AUR_STAGES !== 'undefined' && AUR_STAGES) || {};
  const placeholder = (name, goal) => ({ name, goal, how: goal, layout: ['##########', '#........#', '#...E....#', '#........#', '#...S....#', '##########'], legend: { E: {} }, make(X, self, H) { const e = X.M.marks.E[0]; self.done = true; H.setExit(e.x, e.y, 'The way on'); return {}; } });
  defRift({
    ease: 0.6,
    id: 'aurora', n: 5, name: 'The Pale Aurora', lvl: 50, sigil: 'Shelter', biome: 'glacier', aff: ['frost', 'wind'], region: 'the polar mountains',
    blurb: 'A glacier lifted into the night sky under an aurora shaped like an open eye. Raise windbreaks, turn an avalanche into a bridge, carry warmth to the summit.', gate: { anima: 'capricorn', name: 'The Crownstep Ascent' },
    mons: ['rimescuttler', 'veilray', 'frostlantern'], sealing: SEALING,
    stages: riftSections([
      { biome: 'glacier', pattern: ['fight', 'trial', 'boss'], mods: ['random'], fights: ['The Split Iceberg'], minis: ['rimepet'], extra: crystalsExtra, trials: [ST.WIND || placeholder('The Windbreak Crossing', 'Raise the windbreaks')], boss: 'thul', bossName: 'Thul the Rime Cocoon', bossRoom: 'The Sheltered Ice Cave' },
      { biome: 'observatory', pattern: ['fight', 'trial', 'boss'], mods: ['random'], fights: ['The Frozen Stair'], minis: ['galepet'], trials: [ST.AVALANCHE || placeholder('The Avalanche Galleries', 'Turn the avalanche into a bridge')], boss: 'nivora', bossName: 'Nivora the Aurorawing', bossRoom: 'The Telescope Platform' },
      { biome: 'whiteout', pattern: ['trial', 'fight', 'boss'], mods: ['curse'], fights: ['The Last Shelter'], minis: ['whitepet'], trials: [ST.EMBER || placeholder('Whiteout Ascent', 'Carry the ember to the summit')], boss: 'ahuul', bossName: 'Ahuul the White Horizon', bossRoom: 'The Broad Summit' },
    ]),
  });
  AUR.crystalsExtra = crystalsExtra;
})();
