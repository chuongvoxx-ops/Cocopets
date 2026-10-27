/* ---------- Rift 04: The Sepulchre of Borrowed Hours ----------
   A royal burial complex repeating the same few seconds forever. Three lands, one per section, each its own look:
   I   The Clockless Halls: blue-black tomb stone, silver and old gold, box tombs, a suspended hourglass, a stone that
       keeps falling and rising; dark, lit by gold.
   II  The Hall in Two Ages: a sunlit gallery of ivory marble and silver above an open sky, half of it in the Past.
   III The Borrowed Stairs: violet stairs hanging in a starless void, square corners where hounds look out.
   Monsters: second-eaters (silver hourglasses that slow a marked patch), corner pups (angular black hounds that
   lunge along a shown line), mourning discs (gold rings with an eye that strike where you were a moment ago).
   Stages: I  The Clockless Hall (dungeon) · The Memory Loom (dungeon: leave an echo behind) · The Borrowed Beast
              (puzzle) · Threnn the Second Eater
           II The Hall in Two Ages (dungeon: Past and Present) · The Three Lying Guardians (puzzle) · Vaul the
              Mourning Reflection
           III The Corner Kennels (dungeon) · Borrowed Pursuit (dungeon: outrun your own echo) · Khyros the Hound
              Beyond the Angles, then the sealing. */
const SEP = { INK: '#2B2433', STONE: '#202836', STONE_HI: '#36425A', SILVER: '#A9B5C5', SILVER_HI: '#E4EAF2', GOLD: '#B2965D', GOLD_HI: '#E8CF8E', VIOLET: '#8E6BD0', VIOLET_HI: '#C9B0FF' };
(() => {
  const TAU = Math.PI * 2, { INK, STONE, SILVER, SILVER_HI, GOLD, GOLD_HI, VIOLET, VIOLET_HI } = SEP;
  /* ---- the three lands ---- */
  BIOMES.sepulchre = { name: 'The Clockless Halls', rift: true, tile: 'keep', out: false, dark: 0.34, bg: '#0B0E16', gap: 'abyss', ambient: 'goldmotes', accent: GOLD_HI, light: '#F2E2B0',
    floor: ['#2C3446', '#283041', '#30394C'], grout: '#171C27', hi: '#3E4A62', top: STONE, face: '#161B26', faceD: '#0E121A', cliff: '#161B26', deco: GOLD, path: ['#343E54', '#30394E'],
    props: ['boxtomb', 'hourglass', 'boxtomb', 'fallstone', 'silverurn'], hazard: 'holy', grade: 'rgba(120,140,200,.08)', fog: '#0B0E16', darkRGB: '6,8,16' };
  BIOMES.twoages = { name: 'The Hall in Two Ages', rift: true, tile: 'heaven', out: true, dark: 0, bg: '#BFD0E6', gap: 'sky', ambient: 'sparkles', accent: '#E8C77A', light: '#FFFFFF',
    floor: ['#E9E3D5', '#E1DACA', '#EFEADF'], grout: '#BDB29A', hi: '#FFFFFF', top: SILVER, face: '#7D8798', faceD: '#5E6777', cliff: '#7D8798', deco: GOLD, path: ['#D9CFB8', '#D2C8B0'],
    props: ['silverpillar', 'sunclock', 'silverpillar', 'marblebench'], hazard: 'holy', grade: 'rgba(255,230,170,.08)', fog: '#DCE6F2', darkRGB: '0,0,0' };
  BIOMES.borrowed = { name: 'The Borrowed Stairs', rift: true, glassBridge: true, tile: 'heaven', out: true, dark: 0.22, bg: '#07040C', gap: 'void', ambient: 'wisps', accent: VIOLET_HI, light: '#E2D4FF',
    floor: ['#2D2349', '#2A2044', '#32284F'], grout: '#4A3A7C', hi: '#4E4088', top: '#1C1634', face: '#130F24', faceD: '#0B0816', cliff: '#130F24', deco: VIOLET, path: ['#3A2E5E', '#362A58'],
    props: ['voidobelisk', 'stairstub', 'voidobelisk', 'cornerglow'], hazard: 'holy', grade: 'rgba(140,100,220,.1)', fog: '#07040C', darkRGB: '10,4,20' };
  BIOME_ORDER.push('sepulchre', 'twoages', 'borrowed');
  DARK_COL.sepulchre = '6,8,16'; DARK_COL.twoages = '0,0,0'; DARK_COL.borrowed = '10,4,20';

  /* ---- props ---- */
  const { PROPS } = DunWorld, { LN, shade, stroke, spec, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(0,0,0,${a || 0.28})`; c.beginPath(); c.ellipse(0, 0, T * w, T * w * 0.32, 0, 0, TAU); c.fill(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const box = (c, x, y, w, h, top, side, lw) => { c.beginPath(); c.rect(x, y, w, h); c.fillStyle = side; c.fill(); stroke(c, lw); c.beginPath(); c.rect(x, y - h * 0.22, w, h * 0.22); c.fillStyle = top; c.fill(); stroke(c, lw); };
  Object.assign(PROPS, {
    /* a box tomb: a long rectangular sarcophagus of blue-black stone banded in old gold */
    boxtomb(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.75, 0.35); box(c, -T * 0.7, -T * 0.62, T * 1.4, T * 0.62, '#3A4560', '#232B3B', lw); c.fillStyle = GOLD; c.fillRect(-T * 0.7, -T * 0.42, T * 1.4, T * 0.07); c.fillRect(-T * 0.06, -T * 0.62, T * 0.12, T * 0.62); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw * 0.6; c.strokeRect(-T * 0.7, -T * 0.42, T * 1.4, T * 0.07); if (v % 2) { c.fillStyle = 'rgba(169,181,197,.5)'; c.fillRect(-T * 0.45, -T * 0.74, T * 0.3, T * 0.06); } },
    /* a tall hourglass hung from chains: gold frame, one luminous sphere in place of sand */
    hourglass(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.4, 0.25); const y0 = -T * 2.2, h = T * 1.5;
      c.strokeStyle = '#6E6A60'; c.lineWidth = lw * 0.7; [-0.3, 0.3].forEach(x => { c.beginPath(); c.moveTo(x * T, -T * 2.5); c.lineTo(x * T, y0); c.stroke(); });
      c.fillStyle = GOLD; c.fillRect(-T * 0.42, y0, T * 0.84, T * 0.1); c.fillRect(-T * 0.42, y0 + h, T * 0.84, T * 0.1); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.strokeRect(-T * 0.42, y0, T * 0.84, T * 0.1); c.strokeRect(-T * 0.42, y0 + h, T * 0.84, T * 0.1);
      c.beginPath(); c.moveTo(-T * 0.32, y0 + T * 0.1); c.quadraticCurveTo(-T * 0.3, y0 + h * 0.45, -T * 0.05, y0 + h * 0.5); c.quadraticCurveTo(-T * 0.3, y0 + h * 0.55, -T * 0.32, y0 + h); c.lineTo(T * 0.32, y0 + h); c.quadraticCurveTo(T * 0.3, y0 + h * 0.55, T * 0.05, y0 + h * 0.5); c.quadraticCurveTo(T * 0.3, y0 + h * 0.45, T * 0.32, y0 + T * 0.1); c.closePath(); c.fillStyle = 'rgba(200,215,235,.28)'; c.fill(); stroke(c, lw * 0.8);
      glowIn(c, 0, y0 + h * 0.3, T * 0.5, '#E8CF8E', 0.8); c.fillStyle = '#FFF4D0'; c.beginPath(); c.arc(0, y0 + h * 0.3, T * 0.13, 0, TAU); c.fill();
      [-0.36, 0.36].forEach(x => { c.fillStyle = GOLD; c.fillRect(x * T - T * 0.03, y0 + T * 0.1, T * 0.06, h - T * 0.1); }); },
    /* the falling stone's frame: two square posts and a lintel (the stone itself is drawn moving, over it) */
    fallstone(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.6, 0.3); [-0.5, 0.5].forEach(x => box(c, x * T - T * 0.1, -T * 1.8, T * 0.2, T * 1.8, '#3A4560', '#262E40', lw)); box(c, -T * 0.62, -T * 2.0, T * 1.24, T * 0.22, '#3A4560', '#262E40', lw);
      c.fillStyle = 'rgba(178,150,93,.5)'; c.beginPath(); c.ellipse(0, -T * 0.05, T * 0.32, T * 0.1, 0, 0, TAU); c.fill(); },
    /* a silver funeral urn on a square plinth */
    silverurn(c, T) { const lw = lw0(T); shadowEll(c, T, 0.38, 0.3); box(c, -T * 0.3, -T * 0.3, T * 0.6, T * 0.3, '#3A4560', '#262E40', lw); c.beginPath(); c.moveTo(-T * 0.14, -T * 0.32); c.quadraticCurveTo(-T * 0.36, -T * 0.7, -T * 0.14, -T * 1.0); c.lineTo(T * 0.14, -T * 1.0); c.quadraticCurveTo(T * 0.36, -T * 0.7, T * 0.14, -T * 0.32); c.closePath(); c.fillStyle = shade(c, SILVER, T * 0.4, -T * 0.05, -T * 0.7, 0.4); c.fill(); stroke(c, lw); c.fillStyle = GOLD; c.fillRect(-T * 0.18, -T * 1.06, T * 0.36, T * 0.08); spec(c, -T * 0.12, -T * 0.78, T * 0.05, T * 0.12, 0.5); },
    /* a slender silver pillar with a gold capital */
    silverpillar(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.45, 0.25); const h = T * (1.7 + (v % 2) * 0.2); box(c, -T * 0.4, -T * 0.25, T * 0.8, T * 0.25, '#F2EEE4', '#C9C0AE', lw);
      const g = c.createLinearGradient(-T * 0.26, 0, T * 0.26, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.4, SILVER_HI); g.addColorStop(1, '#8792A4'); c.fillStyle = g; c.beginPath(); c.rect(-T * 0.26, -h, T * 0.52, h - T * 0.25); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(80,90,110,.3)'; c.lineWidth = lw * 0.6; [-0.12, 0, 0.12].forEach(x => { c.beginPath(); c.moveTo(x * T, -h + T * 0.1); c.lineTo(x * T, -T * 0.3); c.stroke(); }); box(c, -T * 0.4, -h - T * 0.05, T * 0.8, T * 0.2, GOLD_HI, GOLD, lw); },
    /* a sundial-clock on a square base: a gold face with three marks and no hands */
    sunclock(c, T) { const lw = lw0(T); shadowEll(c, T, 0.5, 0.25); box(c, -T * 0.45, -T * 0.55, T * 0.9, T * 0.55, '#F2EEE4', '#C9C0AE', lw); c.beginPath(); c.ellipse(0, -T * 0.68, T * 0.42, T * 0.16, 0, 0, TAU); c.fillStyle = GOLD_HI; c.fill(); stroke(c, lw); c.strokeStyle = INK; c.lineWidth = lw; [0, 2.1, 4.2].forEach(a => { c.beginPath(); c.moveTo(Math.cos(a) * T * 0.2, -T * 0.68 + Math.sin(a) * T * 0.07); c.lineTo(Math.cos(a) * T * 0.34, -T * 0.68 + Math.sin(a) * T * 0.12); c.stroke(); }); },
    marblebench(c, T) { const lw = lw0(T); shadowEll(c, T, 0.6, 0.25); box(c, -T * 0.6, -T * 0.4, T * 1.2, T * 0.22, '#FFFFFF', '#D8D0BE', lw); [-0.45, 0.45].forEach(x => box(c, x * T - T * 0.1, -T * 0.2, T * 0.2, T * 0.2, '#EDE7DA', '#C9C0AE', lw)); },
    /* a black obelisk hanging in the void, a violet seam down its face */
    voidobelisk(c, T, v) { const lw = lw0(T); glowIn(c, 0, -T * 0.9, T * 0.9, VIOLET, 0.35); const h = T * (1.8 + (v % 2) * 0.3); c.beginPath(); c.moveTo(-T * 0.3, 0); c.lineTo(-T * 0.22, -h); c.lineTo(0, -h - T * 0.3); c.lineTo(T * 0.22, -h); c.lineTo(T * 0.3, 0); c.closePath(); c.fillStyle = shade(c, '#2A2240', T * 0.5, -T * 0.1, -h * 0.5, 0.35); c.fill(); stroke(c, lw); c.strokeStyle = VIOLET_HI; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(0, -h + T * 0.1); c.lineTo(T * 0.02, -h * 0.55); c.lineTo(-T * 0.03, -T * 0.2); c.stroke(); },
    /* a stub of stair, the same three steps the whole place repeats */
    stairstub(c, T) { const lw = lw0(T); shadowEll(c, T, 0.6, 0.3); for (let i = 0; i < 3; i++) box(c, -T * 0.6 + i * T * 0.12, -T * (0.25 + i * 0.25), T * (1.2 - i * 0.24), T * 0.25, '#4A3C78', '#2A2048', lw); },
    /* a square corner of wall, its inside lit violet: where the hounds look out */
    cornerglow(c, T) { const lw = lw0(T); glowIn(c, 0, -T * 0.7, T * 0.8, VIOLET, 0.5); box(c, -T * 0.5, -T * 1.4, T * 0.22, T * 1.4, '#2A2240', '#1A1430', lw); box(c, -T * 0.5, -T * 1.4, T * 1.0, T * 0.22, '#2A2240', '#1A1430', lw); c.fillStyle = 'rgba(201,176,255,.35)'; c.fillRect(-T * 0.28, -T * 1.18, T * 0.7, T * 1.1); },
  });

  /* ---- the brood ---- */
  Object.assign(MON, {
    seceater: { name: 'Second-eater', from: 999, hp: 170, spd: 1.3, r: 0.4, dmg: 12, xp: 12, coin: 0.7, color: SILVER, bio: ['sepulchre', 'twoages', 'borrowed'], fly: true, tip: 'Marks a small patch under you: a stopped clock face. Stand in it when it closes and you are slowed. Step out of the circle.', kit: [] },
    cornerpup: { name: 'Corner pup', from: 999, hp: 150, spd: 1.9, r: 0.42, dmg: 15, xp: 11, coin: 0.7, color: '#1C1826', bio: ['sepulchre', 'twoages', 'borrowed'], tip: 'Crouches, a violet line shows its lunge, then it flies along it. Step off the line.', kit: [] },
    mourndisc: { name: 'Mourning disc', from: 999, hp: 130, spd: 1.2, r: 0.42, dmg: 14, xp: 12, coin: 0.8, color: GOLD, bio: ['sepulchre', 'twoages', 'borrowed'], fly: true, tip: 'Remembers where you stood a moment ago: a ghost of you appears there and the ground under it bursts. Keep moving. Hit it as it mourns to interrupt.', kit: [] },
  });
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  Object.assign(MP, {
    /* a floating silver hourglass: a dark sphere at its waist, four short hooked fins */
    seceater(c, r, ph, o) {
      const lw = lwOf(r), bob = Math.sin(ph * TAU) * r * 0.12, sp = ph * TAU;
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, r * 1.15, r * 0.7, r * 0.22, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, bob - r * 0.2);
      // fins
      [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2 + Math.PI / 4 + Math.sin(sp) * 0.1, x = Math.cos(a) * r * 0.55, y = Math.sin(a) * r * 0.35; c.beginPath(); c.moveTo(x * 0.6, y * 0.6); c.quadraticCurveTo(x * 1.6, y * 1.4 - r * 0.2, x * 1.5, y * 1.6); c.quadraticCurveTo(x * 1.2, y * 1.1, x * 0.6, y * 0.6 + r * 0.06); c.closePath(); c.fillStyle = '#8792A4'; c.fill(); stroke(c, lw * 0.7); });
      // the glass: two cones meeting at a dark sphere
      c.beginPath(); c.moveTo(-r * 0.6, -r * 0.85); c.lineTo(r * 0.6, -r * 0.85); c.lineTo(r * 0.12, -r * 0.1); c.lineTo(r * 0.12, r * 0.1); c.lineTo(r * 0.6, r * 0.85); c.lineTo(-r * 0.6, r * 0.85); c.lineTo(-r * 0.12, r * 0.1); c.lineTo(-r * 0.12, -r * 0.1); c.closePath();
      c.fillStyle = shade(c, o.color, r, -r * 0.2, -r * 0.4, 0.45); c.fill(); stroke(c, lw);
      c.fillStyle = GOLD; [-0.9, 0.85].forEach(y => { c.fillRect(-r * 0.68, y * r - r * 0.05, r * 1.36, r * 0.12); });
      c.beginPath(); c.arc(0, 0, r * 0.34, 0, TAU); c.fillStyle = '#0E0B18'; c.fill(); stroke(c, lw * 0.8);
      glowIn(c, 0, 0, r * 0.4, o.mode === 'block' ? VIOLET_HI : VIOLET, o.mode === 'block' ? 0.9 : 0.45); spec(c, -r * 0.35, -r * 0.55, r * 0.1, r * 0.2, 0.5);
      c.restore();
    },
    /* a lean black hound of wedges: triangular head, a vertical violet slit for a mouth, a straight spike of a tail */
    cornerpup(c, r, ph, o) {
      const lw = lwOf(r), run = Math.sin(ph * TAU), crouch = o.mode === 'block' ? 1 : 0, lunge = o.mode === 'lunge' ? 1 : 0;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, r * 0.95, r * 0.95, r * 0.25, 0, 0, TAU); c.fill();
      const by = crouch * r * 0.2;
      // legs: thin angled sticks
      [[-0.55, 1], [-0.25, -1], [0.3, 1], [0.6, -1]].forEach(([x, s]) => { const sw = lunge ? s * 0.25 : run * s * 0.22; limb(c, x * r, by + r * 0.05, x * r + sw * r - r * 0.12, r * 0.45 + by * 0.5, lw * 0.9, '#2A2436'); limb(c, x * r + sw * r - r * 0.12, r * 0.45 + by * 0.5, x * r + sw * r * 1.4, r * 0.9, lw * 0.9, '#2A2436'); });
      // the tail: a straight spike
      c.beginPath(); c.moveTo(-r * 0.75, by - r * 0.15); c.lineTo(-r * 1.5, by - r * (0.55 - crouch * 0.3)); c.lineTo(-r * 0.7, by + r * 0.0); c.closePath(); c.fillStyle = '#2A2436'; c.fill(); stroke(c, lw * 0.8);
      // the torso: a long wedge
      c.beginPath(); c.moveTo(-r * 0.85, by - r * 0.25); c.lineTo(r * 0.55, by - r * 0.4); c.lineTo(r * 0.7, by + r * 0.05); c.lineTo(-r * 0.7, by + r * 0.15); c.closePath(); c.fillStyle = shade(c, o.color, r, -r * 0.1, by - r * 0.3, 0.3); c.fill(); stroke(c, lw);
      c.strokeStyle = VIOLET; c.lineWidth = lw * 0.6; [-0.4, -0.1, 0.2].forEach(x => { c.beginPath(); c.moveTo(x * r, by - r * 0.25); c.lineTo(x * r + r * 0.06, by + r * 0.02); c.stroke(); });
      // the head: a triangle pointing forward, a vertical slit of a mouth
      const hx = r * 0.6, hy = by - r * (0.45 - crouch * 0.15);
      c.beginPath(); c.moveTo(hx - r * 0.1, hy - r * 0.35); c.lineTo(hx + r * 0.75, hy + r * 0.05); c.lineTo(hx - r * 0.05, hy + r * 0.3); c.closePath(); c.fillStyle = shade(c, o.color, r * 0.6, hx, hy - r * 0.1, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(hx, hy - r * 0.35); c.lineTo(hx + r * 0.1, hy - r * 0.7); c.lineTo(hx + r * 0.22, hy - r * 0.22); c.closePath(); c.fillStyle = '#2A2436'; c.fill(); stroke(c, lw * 0.7);
      c.fillStyle = VIOLET_HI; c.fillRect(hx + r * 0.32, hy - r * 0.12, r * 0.07, r * 0.3); glowIn(c, hx + r * 0.36, hy, r * 0.25, VIOLET, 0.6 + crouch * 0.4);
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(hx + r * 0.15, hy - r * 0.08, r * 0.06, 0, TAU); c.fill();
    },
    /* an upright cracked gold ring with a small eye hanging at its centre */
    mourndisc(c, r, ph, o) {
      const lw = lwOf(r), bob = Math.sin(ph * TAU) * r * 0.1, mourn = o.mode === 'block' ? 1 : 0;
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, r * 1.2, r * 0.6, r * 0.2, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, bob - r * 0.25);
      if (mourn) glowIn(c, 0, 0, r * 1.3, VIOLET, 0.5);
      c.lineWidth = r * 0.32 + 2.4; c.strokeStyle = LN; c.beginPath(); c.arc(0, 0, r * 0.78, 0, TAU); c.stroke(); c.lineWidth = r * 0.32; c.strokeStyle = shade(c, o.color, r, -r * 0.3, -r * 0.4, 0.5); c.stroke();
      c.strokeStyle = GOLD_HI; c.lineWidth = r * 0.07; c.beginPath(); c.arc(0, 0, r * 0.84, -2.6, -1.4); c.stroke();
      c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(r * 0.55, -r * 0.5); c.lineTo(r * 0.72, -r * 0.62); c.lineTo(r * 0.8, -r * 0.5); c.moveTo(-r * 0.7, r * 0.35); c.lineTo(-r * 0.92, r * 0.4); c.stroke();
      c.strokeStyle = 'rgba(178,150,93,.7)'; c.lineWidth = lw * 0.5; c.beginPath(); c.moveTo(0, -r * 0.62); c.lineTo(0, -r * 0.22); c.stroke();
      c.beginPath(); c.ellipse(0, 0, r * 0.24, r * 0.2, 0, 0, TAU); c.fillStyle = '#F4F0FF'; c.fill(); stroke(c, lw * 0.8); c.fillStyle = mourn ? VIOLET : '#2A2436'; c.beginPath(); c.arc(0, r * 0.02, r * 0.11, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-r * 0.04, -r * 0.03, r * 0.035, 0, TAU); c.fill();
      if (mourn) { c.fillStyle = VIOLET_HI; c.beginPath(); c.ellipse(r * 0.04, r * 0.3, r * 0.04, r * 0.08, 0, 0, TAU); c.fill(); }
      c.restore();
    },
  });
  Object.assign(EXT, { seceater: 2.1, cornerpup: 2.2, mourndisc: 2.0 });
  Object.assign(NF, { seceater: 6, cornerpup: 6, mourndisc: 6 });
  const { mon, keepRange } = DunAI;
  Object.assign(mon, {
    seceater(m, A, X) {
      // drifts at range; marks a patch under the pet (a stopped clock face) that closes into a slowing zone
      keepRange(m, A, X, 3, 6);
      if (m.stallT > 0) { m.stallT -= A.dt; m.mode = 'block'; if (m.stallT <= 0) { m.mode = null; const p = m.stallAt; X.zone({ kind: 'stall', x: p.x, y: p.y, r: 1.5, life: 3.5, max: 3.5, own: 'enemy' }); X.ring(p.x, p.y, 0.2, 1.5, 0.3, SILVER_HI, 0.3); X.sfx.hum && X.sfx.hum(); } return; }
      if (m.cd <= 0 && A.d < 8 && A.los()) { m.cd = 4.5 + Math.random() * 1.5; m.stallT = 0.9; m.stallAt = { x: X.me.x, y: X.me.y }; X.warn({ x: m.stallAt.x, y: m.stallAt.y, r: 1.5, life: 0.9, max: 0.9, src: m, color: SILVER_HI }); }
      else if (m.atkCd <= 0 && A.d < 7 && A.los()) { m.atkCd = 2.2; X.eshot(m.x, m.y - 0.3, A.a, 5.5, { dmg: m.dmg * 0.7, color: SILVER_HI, core: '#FFFFFF', r: 0.14 }); }
    },
    cornerpup(m, A, X) {
      // stalks in; crouches with a violet line to show its lunge; then flies along it
      if (m.lungeT > 0) { m.lungeT -= A.dt; m.mode = 'lunge'; const v = 13; X.moveEnt(m, Math.cos(m.pla) * v * A.dt, Math.sin(m.pla) * v * A.dt); if (!m.lhit && Math.hypot(X.me.x - m.x, X.me.y - m.y) < m.r + X.me.r + 0.2) { m.lhit = true; X.hurtPet(m.dmg * 1.4, m); } if (m.lungeT <= 0) { m.mode = null; m.cd = 2.2 + Math.random(); } return; }
      if (m.crouch > 0) { m.crouch -= A.dt; m.mode = 'block'; m.face = Math.cos(m.pla) >= 0 ? 1 : -1; if (m.crouch <= 0) { m.lungeT = 0.42; m.lhit = false; X.sfx.whoosh(); } return; }
      if (A.d > 2.2 || m.cd > 0) { if (A.d > 1.2) X.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt); m.face = A.dx >= 0 ? 1 : -1; }
      if (m.cd <= 0 && A.d < 6 && A.los()) { m.crouch = 0.55; m.pla = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 5.6, w: 0.9, life: 0.55, max: 0.55, src: m, color: VIOLET_HI }); }
    },
    mourndisc(m, A, X) {
      // remembers where the pet stood 1.2 s ago: a ghost there, the ground bursts under it
      m.trail = m.trail || []; m.trail.push({ x: X.me.x, y: X.me.y, t: X.g.t }); while (m.trail.length && X.g.t - m.trail[0].t > 1.3) m.trail.shift();
      keepRange(m, A, X, 3.5, 6.5);
      if (m.mourn > 0) { m.mourn -= A.dt; m.mode = 'block'; if (m.flash > 0.05 && m.mournHit !== m.flash) { m.mourn = 0; m.mode = null; m.cd = 3; X.text(m.x, m.y - m.r - 0.6, 'Interrupted!', '#FFFFFF', 12); return; } if (m.mourn <= 0) m.mode = null; return; }
      if (m.cd <= 0 && A.d < 8.5 && m.trail.length) { const p = m.trail[0]; m.cd = 4 + Math.random() * 1.5; m.mourn = 1.1; m.mournHit = m.flash; const dmg = m.dmg * 1.5;
        X.zone({ kind: 'ghost', x: p.x, y: p.y, life: 1.1, max: 1.1, own: 'none', face: X.me.face });
        X.warn({ x: p.x, y: p.y, r: 1.4, life: 1.1, max: 1.1, src: m, color: VIOLET_HI, fn: () => { if (Math.hypot(X.me.x - p.x, X.me.y - p.y) < 1.4 + X.me.r && !X.me.dodge) X.hurtPet(dmg, m); X.ring(p.x, p.y, 0.2, 1.5, 0.35, VIOLET_HI, 0.35); X.sparks(p.x, p.y, VIOLET_HI, 10, 4); } }); }
    },
  });


  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; };
  Object.assign(DunAI.boss, {
    /* Tock: stops a ring of clock faces round you (slowing patches), then a ticking strike where you were */
    hourpet(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.8 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['stop', 'tick', 'tick', 'stop'] : ['stop', 'tick']); }
      const T = m.actT;
      switch (m.act) {
        case 'stop': { if (m.step === 0) { m.step = 1; X.say(m, 'Stop.'); const cx = X.me.x, cy = X.me.y; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + T * 0.7, px = cx + Math.cos(a) * 2.4, py = cy + Math.sin(a) * 2.4; X.warn({ x: px, y: py, r: 1.3, life: 0.9, max: 0.9, src: m, color: SILVER_HI, fn: () => X.zone({ kind: 'stall', x: px, y: py, r: 1.3, life: 3.2, max: 3.2, own: 'enemy' }) }); } }
          if (T > 1.2) done(m, 1.6); break; }
        case 'tick': { if (m.step < 3 && T > m.step * 0.55) { m.step++; const px = X.me.x, py = X.me.y; X.zone({ kind: 'ghost', x: px, y: py, life: 0.9, max: 0.9, own: 'none', face: X.me.face }); X.warn({ x: px, y: py, r: 1.5, life: 0.9, max: 0.9, src: m, color: GOLD_HI, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.5 + X.me.r) X.hurtPet(m.dmg * 1.1, m); X.sparks(px, py, GOLD_HI, 8, 4); } }); if (m.step === 1) X.say(m, 'Tick.'); }
          if (T > 2.2) done(m, 1.6); break; }
        default: done(m, 1);
      }
    },
    /* Howl: calls two corner pups out of the corners, and a long lunge along a violet lane */
    kennelpet(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.2)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['lunge', 'call', 'lunge'] : ['lunge', 'lunge', 'call']); }
      const T = m.actT;
      switch (m.act) {
        case 'lunge': { if (m.step === 0) { m.step = 1; m.ca = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(m.ca) >= 0 ? 1 : -1; X.warn({ shape: 'line', x: m.x, y: m.y, a: m.ca, len: 8, w: 1.8, life: 0.8, max: 0.8, src: m, color: VIOLET_HI }); X.say(m, 'Grr.'); }
          if (T > 0.8 && T < 1.35) { X.moveEnt(m, Math.cos(m.ca) * 14 * A.dt, Math.sin(m.ca) * 14 * A.dt); if (A.d < m.r + X.me.r + 0.3 && !m.chit) { m.chit = true; X.hurtPet(m.dmg * 1.6, m); X.push(m.ca, 2); } }
          if (T > 1.7) { m.chit = false; done(m, 1.6); } break; }
        case 'call': { if (m.step === 0) { m.step = 1; X.say(m, 'Out!'); for (let i = 0; i < 2; i++) { const q = X.freeSpot(m.x + (i ? 2 : -2), m.y + 1, 0.4); if (q) { X.ring(q.x, q.y, 0.2, 1.2, 0.4, VIOLET_HI, 0.3); const p = X.spawnMon('cornerpup', q.x, q.y, { aggro: true, pack: 580 }); X.g.total++; } } }
          if (T > 1.2) done(m, 2.2); break; }
        default: done(m, 1);
      }
    },
  });


  /* ---- dungeon one's hourglasses: shatter one and it counts down, then a blast that stops time inside it ---- */
  const HG_R = 4.5;
  function hourglassExtra(X, self, H) {
    const me = X.me, g = X.g, S = { petT: 0, petAt: null, n: 0 };
    const list = (X.props || []).filter(p => p.kind === 'hourglass' && !p.broken);
    list.forEach(p => { const G = { p, st: 'idle' }; const tx = Math.floor(p.x), ty = Math.floor(p.y);
      G.obj = H.obj({ x: p.x, y: p.y + 0.75, kind: 'hourglassuse', r: 0.8, h: 0.6, label: () => (G.st === 'idle' ? 'Shatter the hourglass: it stops time around it' : ''), use() { if (G.st !== 'idle') return; G.st = 'count'; S.n++;
          X.banner('THE HOURGLASS CRACKS', 'Three seconds: get out of the circle!', GOLD_HI, 1.8, true); X.sfx.crack ? X.sfx.crack() : X.sfx.crash();
          X.warn({ x: p.x, y: p.y, r: HG_R, life: 3, max: 3, color: GOLD_HI, fn: () => {
            G.st = 'done'; p.broken = true; X.setTile(tx, ty, T_FLOOR); X.retile();
            X.boom(p.x, p.y - 0.5, HG_R * 0.8, GOLD_HI, '#FFFFFF', { n: 40, shake: 12 }); X.flash(0.4, '#FFF4D0'); X.sfx.fanfare();
            X.zone({ kind: 'timefield', x: p.x, y: p.y, r: HG_R, life: 20, max: 20, own: 'none' });
            let n = 0; for (const m of X.mons) if (!m.dead && Math.hypot(m.x - p.x, m.y - p.y) < HG_R + m.r) { if (!m.boss || m.lesser) { m.freeze = Math.max(m.freeze || 0, m.lesser ? 8 : 20); n++; } X.hitMon(m, m.maxhp * (m.lesser ? 0.06 : 0.3), { flat: true }); }
            if (n) X.text(p.x, p.y - 1.6, `${n} frozen in time`, GOLD_HI, 14);
            if (!me.dead && Math.hypot(me.x - p.x, me.y - p.y) < HG_R + me.r && !me.dodge) { X.hurtPet(X.ST().hp * 0.12, null); S.petT = 20; S.petAt = { x: me.x, y: me.y }; X.banner('FROZEN IN TIME', 'Twenty seconds: next time, dodge out of the circle', GOLD_HI, 2.4, true); }
          } }); } }); });
    return {
      update(dt) { if (S.petT > 0) { S.petT -= dt; me.x = S.petAt.x; me.y = S.petAt.y; me.vx = me.vy = 0; me.inv = Math.max(me.inv || 0, 0.2); me.dodge = null; } },
      drawOver(c) { if (S.petT > 0) { const T = X.Tz(); c.save(); c.globalAlpha = 0.35; c.fillStyle = '#E8CF8E'; c.beginPath(); c.arc(X.sx(me.x), X.sy(me.y) - T * 0.4, T * 0.9, 0, TAU); c.fill(); c.restore(); c.save(); c.font = `800 ${Math.round(T * 0.4)}px ${arcFont}`; c.textAlign = 'center'; c.fillStyle = '#FFF4D0'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3; const s = `Frozen ${Math.ceil(S.petT)}s`; c.strokeText(s, X.sx(me.x), X.sy(me.y) - T * 1.6); c.fillText(s, X.sx(me.x), X.sy(me.y) - T * 1.6); c.restore(); } },
      S };
  }
  /* ---- section three's ice: giant crystals sprouting from the floor. Break one and the cold stops the monsters near
     it, but bites the pet: for twenty seconds no healing item heals it ---- */
  Object.assign(MON, { icecrystal: { name: 'Giant ice crystal', from: 999, hp: 1100, spd: 0, r: 0.84, dmg: 0, xp: 6, coin: 0, color: '#BFEFFF', bio: ['borrowed'], still: true, tip: 'Break it: the monsters near it freeze, but frostbite stops your healing items working for 20 seconds.', kit: [],
    onDeath(m, X) { let n = 0; for (const q of X.mons) if (!q.dead && q !== m && Math.hypot(q.x - m.x, q.y - m.y) < 9) { q.freeze = Math.max(q.freeze || 0, q.boss ? 3 : 7); n++; }
      X.boom(m.x, m.y, 4, '#BFEFFF', '#FFFFFF', { n: 36, shake: 10 }); X.ring(m.x, m.y, 0.4, 9, 0.6, '#BFEFFF', 0.35); X.g.frostbite = 20; X.text(m.x, m.y - 2.4, `${n} frozen`, '#BFEFFF', 15); if (X.sfx.crash) X.sfx.crash(); } } });
  Object.assign(MP, {
    /* a giant ice crystal: a cluster of tall pale-blue prisms three times the size of the cave crystals, frost at the foot */
    icecrystal(c, r, ph, o) { const lw = lwOf(r) * 1.2, T = r;
      // the floor it burst through: cracks running out, a ring of heaved slabs and rubble
      c.fillStyle = 'rgba(10,8,24,.45)'; c.beginPath(); c.ellipse(0, r * 0.72, r * 1.55, r * 0.48, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(20,14,40,.8)'; c.lineWidth = lw * 0.8; c.lineCap = 'round';
      [[-1.55, 0.55], [-1.1, 1.05], [1.5, 0.5], [1.05, 1.0], [0.1, 1.15], [-0.4, 1.12]].forEach(([x, y], k) => { c.beginPath(); c.moveTo(x * 0.35 * T, r * 0.75); c.lineTo(x * 0.7 * T + (k % 2 ? 4 : -4), r * (0.72 + (y - 0.7) * 0.5)); c.lineTo(x * T, r * (0.55 + y * 0.3)); c.stroke(); });
      glowIn(c, 0, -r * 1.0, r * 1.6, '#BFEFFF', 0.4);
      // the shards: faceted prisms, a lit face and a shadowed one, a bright ridge and a cut tip
      const shard = (x, h, a, w) => { c.save(); c.translate(x * T, r * 0.72); c.rotate(a);
        const W = w * T, Hh = h * T, sh = Hh * 0.8;
        c.beginPath(); c.moveTo(-W, 0); c.lineTo(-W * 0.9, -sh); c.lineTo(0, -Hh); c.lineTo(0, 0); c.closePath(); const g1 = c.createLinearGradient(-W, 0, 0, -Hh); g1.addColorStop(0, '#D8F6FF'); g1.addColorStop(1, '#FFFFFF'); c.fillStyle = g1; c.fill();
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -Hh); c.lineTo(W * 0.9, -sh); c.lineTo(W, 0); c.closePath(); const g2 = c.createLinearGradient(0, -Hh, W, 0); g2.addColorStop(0, '#7CC8EE'); g2.addColorStop(1, '#2F6FA8'); c.fillStyle = g2; c.fill();
        c.beginPath(); c.moveTo(-W, 0); c.lineTo(-W * 0.9, -sh); c.lineTo(0, -Hh); c.lineTo(W * 0.9, -sh); c.lineTo(W, 0); stroke(c, lw);
        c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(0, -Hh * 0.98); c.lineTo(0, -Hh * 0.2); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(-W * 0.6, -sh * 0.15); c.lineTo(-W * 0.55, -sh * 0.8); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(-W * 0.9, -sh); c.lineTo(0, -Hh); c.lineTo(-W * 0.3, -sh * 0.98); c.closePath(); c.fill();
        c.restore(); };
      [[-1.05, 1.15, -0.62, 0.22], [1.08, 1.3, 0.6, 0.24], [-0.6, 2.0, -0.28, 0.33], [0.55, 2.3, 0.22, 0.36], [0, 3.0, 0.02, 0.44], [1.35, 0.7, 0.95, 0.15], [-1.4, 0.65, -1.0, 0.14]].forEach(([x, h, a, w]) => shard(x, h, a, w));
      // the roots: broken slabs of floor tipped up round its foot, rubble between them
      [[-1.25, 0.62, -0.5, 0.42], [1.2, 0.66, 0.45, 0.45], [-0.55, 0.92, -0.15, 0.4], [0.5, 0.95, 0.2, 0.42], [0, 1.02, 0, 0.32]].forEach(([x, y, a, w], k) => { c.save(); c.translate(x * T, y * r); c.rotate(a); c.beginPath(); c.moveTo(-w * T, r * 0.1); c.lineTo(-w * T * 0.8, -r * 0.22); c.lineTo(w * T * 0.3, -r * 0.3); c.lineTo(w * T, -r * 0.08); c.lineTo(w * T * 0.85, r * 0.12); c.closePath(); c.fillStyle = k % 2 ? '#3A2E5E' : '#2D2349'; c.fill(); stroke(c, lw * 0.9); c.fillStyle = 'rgba(200,180,255,.25)'; c.beginPath(); c.moveTo(-w * T * 0.8, -r * 0.22); c.lineTo(w * T * 0.3, -r * 0.3); c.lineTo(w * T * 0.1, -r * 0.18); c.lineTo(-w * T * 0.7, -r * 0.12); c.closePath(); c.fill(); c.restore(); });
      c.fillStyle = '#1C1634'; [[-0.9, 0.98, 0.07], [0.85, 1.02, 0.06], [-0.2, 1.12, 0.05], [0.3, 1.1, 0.07], [1.5, 0.82, 0.05], [-1.55, 0.8, 0.06]].forEach(([x, y, s2]) => { c.beginPath(); c.moveTo(x * T - s2 * T, y * r); c.lineTo(x * T, y * r - s2 * T * 1.2); c.lineTo(x * T + s2 * T, y * r); c.closePath(); c.fill(); });
      c.fillStyle = 'rgba(220,245,255,.8)'; [[-0.75, 0.86], [0.7, 0.9], [0.15, 0.96]].forEach(([x, y]) => { c.beginPath(); c.arc(x * T, y * r, T * 0.05, 0, TAU); c.fill(); });
      if (o.mode === 'hit') glowIn(c, 0, -r, r * 1.5, '#FFFFFF', 0.6); } });
  Object.assign(EXT, { icecrystal: 3.0 }); Object.assign(NF, { icecrystal: 1 }); Object.assign(mon, { icecrystal() {} });
  function iceExtra(X, self, H) {
    const M = X.M, me = X.me, g = X.g; const rooms = M.rooms.slice(1).sort(() => Math.random() - 0.5).slice(0, 6);
    for (const rm of rooms) { const q = X.freeSpot(rm.x + rm.w * (0.3 + Math.random() * 0.4), rm.y + rm.h * (0.3 + Math.random() * 0.4), 1.1); if (!q) continue; const m = X.spawnMon('icecrystal', q.x, q.y, { pack: 790, rift: true }); m.optional = true; m.aggro = false; }
    return {
      drawGround(c) { if (!(g.frostbite > 0)) return; const T = X.Tz(); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.15 * Math.sin(g.t * 5); blitSized(c, glowSprite('#BFEFFF'), X.sx(me.x) - T, X.sy(me.y) - T * 1.4, T * 2, T * 2); c.restore(); },
      drawOver(c) { if (!(g.frostbite > 0)) return; const W = X.W(), x = W / 2, y = 128; c.save(); c.fillStyle = 'rgba(20,40,60,.8)'; c.strokeStyle = '#BFEFFF'; c.lineWidth = 1.5; GFX.rr(c, x - 130, y - 14, 260, 26, 12); c.fill(); c.stroke(); c.font = `800 12px ${arcFont}`; c.textAlign = 'center'; c.fillStyle = '#E8F8FF'; c.fillText(`FROSTBITE ${Math.ceil(g.frostbite)}s · healing items do nothing`, x, y + 4); c.restore(); } };
  }

  /* ---- the stages (the dungeons with their own challenges and the puzzles are filled in by SEP_STAGES) ---- */
  const SEALING = { fall: 'THE FALLING STONE LANDS', sub: 'The gold echoes bow their heads and vanish', sigil: 'THE MEMORY SIGIL', name: 'The Sepulchre of Borrowed Hours', color: VIOLET_HI };
  const ST = (typeof SEP_STAGES !== 'undefined' && SEP_STAGES) || {};
  const placeholder = (name, goal) => ({ name, goal, how: goal, layout: ['##########', '#........#', '#...E....#', '#........#', '#...S....#', '##########'], legend: { E: {} }, make(X, self, H) { const e = X.M.marks.E[0]; self.done = true; H.setExit(e.x, e.y, 'The way on'); return {}; } });
  defRift({
    ease: 0.6,
    id: 'sepulchre', n: 4, name: 'The Sepulchre of Borrowed Hours', lvl: 40, sigil: 'Memory', biome: 'sepulchre', aff: ['dark', 'light'], region: 'the temporal ruins',
    blurb: 'A royal tomb repeating the same few seconds forever. Leave an echo behind, turn the age of a hall, outrun yourself.', gate: { anima: 'gemini', name: 'The Twin Reflection' },
    mons: ['seceater', 'cornerpup', 'mourndisc'], sealing: SEALING,
    stages: riftSections([
      { biome: 'sepulchre', pattern: ['fight', 'trial', 'puzzle', 'boss'], mods: ['random'], fights: ['The Clockless Hall'], minis: ['hourpet'], extra: hourglassExtra, trials: [ST.COURT || placeholder('The Hour Court', 'Dodge and gather')], puzzles: [ST.BEAST || placeholder('The Borrowed Beast', 'Wake the stone guardian')], boss: 'threnn', bossName: 'Threnn the Second Eater', bossRoom: 'The Tomb Court' },
      { biome: 'twoages', pattern: ['trial', 'puzzle', 'boss'], trials: [ST.AGES || placeholder('The Hall in Two Ages', 'Carry the bridge across time')], puzzles: [ST.SIEGE || placeholder('The Three Statues', 'Break the statues')], boss: 'vaul', bossName: 'Vaul the Mourning Reflection', bossRoom: 'The Raised Gallery' },
      { biome: 'borrowed', pattern: ['fight', 'puzzle', 'puzzle', 'boss'], mods: ['curse'], fights: ['The Corner Kennels'], minis: ['kennelpet'], extra: iceExtra, puzzles: [ST.REMEMBER || placeholder('The Room That Remembers', 'Change the Past'), ST.ROLL || placeholder('The Rolling Hour', 'Roll through them')], boss: 'khyros', bossName: 'Khyros the Hound Beyond the Angles', bossRoom: 'The Final Sanctuary' },
    ]),
  });
  BOSSES.push(
    { id: 'hourpet', rift: true, name: 'Tock', title: 'A Rift-touched Cocopet', hp: 34000, dmg: 26, r: 1.3, spd: 1.8, color: '#3A4560', glow: GOLD_HI, biome: 'sepulchre', el: 'dark' },
    { id: 'kennelpet', rift: true, name: 'Howl', title: 'A Rift-touched Cocopet', hp: 46000, dmg: 30, r: 1.5, spd: 1.6, color: '#1C1626', glow: VIOLET_HI, biome: 'borrowed', el: 'dark' });
})();
