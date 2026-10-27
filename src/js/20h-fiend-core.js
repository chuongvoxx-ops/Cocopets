/* ---------- Super Fiends: every tenth floor is a single vast arena and one of ten colossal horrors ----------
   They are painted in a different hand from the rest of the game: no ink outlines, but light and shadow, wet and dry
   textures, rim light from strange skies and a little of the uncanny in every one. Each fight is built from the same
   parts: telegraphed attacks drawn on the ground, hazards that linger, objects the pet can strike to turn a mechanic
   around, weak points that open and close, and a signature attack with a way out for those who read it. A fiend has
   one health bar for every five floors plus two, the whole fight worth twenty floor bosses, and fights in two phases
   up to floor 50, four from floor 60 and three (its three acts) in the high tower. Hitting it shakes healing orbs loose. */
const FIENDS = [
  { id: 'nuckelavee', name: 'Hāhālua', title: 'The Moonlit Tide', color: '#4A9AD8', glow: '#BFF4FF', accent: '#8FFFE0', biome: 'swamp', r: 3.2 },
  { id: 'jorogumo', name: 'Jorōgumo', title: 'The Moonweb Devourer', color: '#E8E0CC', glow: '#FFD36B', accent: '#FFE9A8', biome: 'forest', r: 2.4 },
  { id: 'beelzebub', name: 'Beelzebub', title: 'The Carrion Crown', color: '#1E1A16', glow: '#E0C84A', accent: '#C8F05A', biome: 'hell', r: 2.4 },
  { id: 'aion', name: 'Aion', title: 'The Unremembered', color: '#2A1A4A', glow: '#FFE9A8', accent: '#C8A8FF', biome: 'heaven', r: 2.6, els: ['light', 'dark'], phases: 3, cuts: [1, 0.7, 0.35] },
  { id: 'astaroth', name: 'Astaroth', title: 'The Devourer of Tomorrow', color: '#2A3A5A', glow: '#9FD8FF', accent: '#E0F4FF', biome: 'keep', r: 2.1 },
  { id: 'babylon', name: 'Babylon', title: 'The Drifting Cataclysm', color: '#2A2420', glow: '#FF6A1E', accent: '#FFB347', biome: 'volcano', r: 3.2 },
  { id: 'abaddon', name: 'Abaddon', title: 'The Final Division', color: '#16121C', glow: '#FF2A3A', accent: '#FFC2C6', biome: 'hell', r: 2.4, els: ['dark', 'fire'], phases: 3, cuts: [1, 0.7, 0.35] },
  { id: 'azathoth', name: 'Azathoth', title: 'The Heart Outside Creation', color: '#1A1030', glow: '#FF4FD8', accent: '#8FE8FF', biome: 'heaven', r: 3.4 },
  /* the high tower, floors 90 to 120: fought in three acts on arenas that fight back */
  { id: 'choronzon', name: 'Choronzon', title: 'The Sovereign of Thorns', color: '#2A1446', glow: '#B07CFF', accent: '#F2EAFF', biome: 'keep', r: 2.2, els: ['dark', 'earth'], phases: 3, cuts: [1, 0.7, 0.35] },
  { id: 'pale', name: 'The Pale Intellect', title: 'Superfiend of the Unspoken Dream', color: '#C9B4E6', glow: '#B98CFF', accent: '#F4EEFF', biome: 'heaven', r: 2.4, els: ['dark', 'light'], phases: 3, cuts: [1, 0.7, 0.35], extraBars: 10, dmgK: 1.15 },
  { id: 'akkorokamui', name: 'Akkorokamui', title: 'Sovereign of the Dune Sea', color: '#F28A2E', glow: '#FFD36B', accent: '#FFE9A8', biome: 'sandstorm', r: 3.2, els: ['earth', 'wind', 'fire'] },
  // (the last of them is fought for longer and hits harder: fifteen more bars than its floor gives, each as large, and a
  // quarter more to every blow)
  { id: 'bahamut', name: 'Bahamut', title: 'The Infinite', color: '#5FB4F0', glow: '#FFE9A8', accent: '#7FFFF0', biome: 'rift', r: 2.9, els: ['wind', 'water', 'light'], phases: 4, cuts: [1, 0.75, 0.5, 0.25], extraBars: 15, dmgK: 1.25 },
];
const FIEND_DEFS = {};
/* which Super Fiend holds a floor: every tenth, in order, then round again with more bars */
function fiendFor(n) {
  if (!n || n % 10) return null;
  const i = (n / 10 - 1) % FIENDS.length;
  // the high fiends (floor 90 and up) fight in three acts; past floor 50 the difficulty climbs more gently, since levels stop at 200
  // (baseBars: the bars its floor gives, which set each bar's size and the reward; a fiend may have extra bars on top)
  // (harder with height: floors 10 to 49, 10 more bars rising to 25 and blows 30% harder; from floor 50, 30 more bars
  // rising to 50 at the top of the Tower, blows 50% harder rising to 100%; on top of any a fiend has of its own)
  const lo = n < 50 ? Math.min(1, (n - 10) / 30) : -1, hk = n >= 50 ? Math.min(1, (n - 50) / Math.max(10, TOWER_TOP - 50)) : -1;
  const more = hk >= 0 ? Math.round(30 + 20 * hk) : Math.round(10 + 15 * lo), hit = hk >= 0 ? 1.5 + 0.5 * hk : 1.3;
  return Object.assign({}, FIENDS[i], { bars: n / 5 + 2 + (FIENDS[i].extraBars || 0) + more, baseBars: n / 5 + 2, hardBars: more, hardK: hit, dmgK: (FIENDS[i].dmgK || 1) * hit, phases: FIENDS[i].phases || (n >= 90 ? 3 : n >= 60 ? 4 : 2), cycle: Math.floor((n / 10 - 1) / FIENDS.length), rec: Math.min(DLV_MAX, n <= 50 ? 2 * n : Math.round(100 + (n - 50) / (TOWER_TOP - 50) * (DLV_MAX - 100))), lvK: 1 + (n / 10 - 1) * 0.06 });   // twice the floor to 50, then easing to the level cap at the top of the tower at the top
}
/* the arena: a vast open disc (each fiend may carve pillars or ruins into it); the fiend paints the rest */
function genFiendArena(F, R) {
  const FD = F.fiend, D = FIEND_DEFS[FD.id] || {}, MW = 56, MH = 56, N = MW * MH, cx = 28, cy = 28, RA = D.arenaR || 15;
  const bi = Math.max(0, BIOME_ORDER.indexOf(FD.biome));
  const G = new Uint8Array(N).fill(T_SOLID), BI = new Uint8Array(N).fill(bi), RM = new Int16Array(N).fill(-1);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < RA) { G[y * MW + x] = T_FLOOR; RM[y * MW + x] = 0; }
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < MW && y < MH) G[y * MW + x] = t; };
  if (D.carve) D.carve(set, { x: cx, y: cy, R: RA }, R);
  const start = D.start ? D.start({ x: cx, y: cy, R: RA }) : { x: cx + 0.5, y: cy + RA - 3.2 }, stones = [];
  [[-RA * 0.55, RA * 0.35], [RA * 0.55, RA * 0.35]].forEach(([dx, dy]) => stones.push({ x: cx + dx, y: cy + dy, room: 0, kind: POWER_KEYS[Math.floor(R() * POWER_KEYS.length)] }));
  return { MW, MH, G, BI, RM, props: new Map(), rooms: [{ x: cx - RA, y: cy - RA, w: RA * 2, h: RA * 2, arena: true, biome: FD.biome, tiles: Math.round(Math.PI * RA * RA) }], start, bossAt: { x: cx, y: cy - 2.5 }, arena: 0,
    lights: [], decals: [], pots: [], packs: [], hazards: [], shrines: [], nests: [], gremlin: null, traps: [], stones, sec: FD.biome, ter: FD.biome, fiend: true, FC: { x: cx, y: cy, R: RA } };
}

const DunFiend = (() => {
  const TAU = Math.PI * 2;
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const mixC = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const sh = (h, k) => shadeC(h, k);
  const lerpA = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * t; };
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };

  /* quality ladder shared by the whole fiend painter: 2 = everything, 1 = no texture overlays, lighter detail,
     0 = flat volumes on a small layer. The engine steps it with the frame rate; tests may pin it */
  const Q = { q: 2, avg: 16, last: 0, slowT: 0, fastT: 0, pin: null, flash: 0, ev: 1, busyT: 0, wait: 7000, upAt: -1e9 };
  const qq = () => Q.pin != null ? Q.pin : Q.q;
  // a picture kept and repainted every n frames is repainted every stretch(n) on a device that keeps missing frames (half
  // as often again: its own motion steps a little slower, while it still glides every frame)
  const stretch = n => Q.ev > 1 ? Math.max(n, Math.floor(n * Q.ev + 0.25)) : n;
  /* ---------- the painter's kit: textures, lit volumes, limbs, tubes, eyes ---------- */
  const tiles = {};
  function tex(kind) {
    if (tiles[kind]) return tiles[kind];
    const S = 160, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
    const R = mulberry32(kind.split('').reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 11));
    const wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.save(); g.translate(ox, oy); f(); g.restore(); } };
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'muscle') {   // striated fibres with pale sinew
      for (let i = 0; i < 260; i++) { const x = R() * S, y = R() * S, L = 10 + R() * 26, a = (R() - 0.5) * 0.5, bow = (R() - 0.5) * 6, dark = R() < 0.55;
        wrap(() => { g.strokeStyle = dark ? `rgba(40,0,8,${0.3 + R() * 0.3})` : `rgba(255,190,190,${0.18 + R() * 0.25})`; g.lineWidth = 0.6 + R() * 1.4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2 + bow, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }); }
      for (let i = 0; i < 14; i++) { const x = R() * S, y = R() * S, L = 20 + R() * 40; wrap(() => { g.strokeStyle = 'rgba(255,240,225,.45)'; g.lineWidth = 1.2 + R() * 1.5; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + L * 0.3, y - 4, x + L * 0.6, y + 5, x + L, y + (R() - 0.5) * 8); g.stroke(); }); }
    } else if (kind === 'scale') {   // overlapping scales, each with a glint
      const cw = 14, chh = 10;
      for (let row = -1; row * chh < S + chh; row++) for (let col = -1; col * cw < S + cw; col++) { const x = col * cw + (((row % 2) + 2) % 2) * cw / 2 + (R() - 0.5) * 1.5, y = row * chh;
        const gr = g.createLinearGradient(x, y - chh * 0.4, x, y + chh); gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.42)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(x, y + chh * 0.25, cw * 0.55, chh * 0.85, 0, 0, Math.PI); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y + chh * 0.25, cw * 0.55, chh * 0.85, 0, 0.15, Math.PI - 0.15); g.stroke(); }
    } else if (kind === 'chitin') {   // lacquered plates: soft mottling, micro scratches, a few seams
      for (let i = 0; i < 40; i++) { const x = R() * S, y = R() * S, r = 8 + R() * 22, lt = R() < 0.4; wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, lt ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }); }
      for (let i = 0; i < 160; i++) { const x = R() * S, y = R() * S, L = 2 + R() * 6, a = R() * TAU; g.strokeStyle = R() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.3)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
      for (let i = 0; i < 5; i++) { let x = R() * S, y = R() * S; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (R() - 0.3) * 30; y += (R() - 0.5) * 18; g.lineTo(x, y); } g.stroke(); }
    } else if (kind === 'fur') {   // coarse strands
      for (let i = 0; i < 1500; i++) { const x = R() * S, y = R() * S, L = 4 + R() * 9, a = 1.3 + (R() - 0.5) * 0.7, lt = R() < 0.35; wrap(() => { g.strokeStyle = lt ? `rgba(255,240,220,${0.12 + R() * 0.2})` : `rgba(0,0,0,${0.25 + R() * 0.3})`; g.lineWidth = 0.6 + R() * 0.8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.4) * L * 0.5, y + Math.sin(a + 0.4) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }); }
    } else if (kind === 'stone') {   // obsidian and basalt: mottling, pits, cracks
      for (let i = 0; i < 70; i++) { const x = R() * S, y = R() * S, r = 4 + R() * 20, lt = R() < 0.4; wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, lt ? 'rgba(255,255,255,.13)' : 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }); }
      for (let i = 0; i < 500; i++) { g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.18)'; g.fillRect(R() * S, R() * S, 1 + R(), 1 + R()); }
      for (let i = 0; i < 9; i++) { let x = R() * S, y = R() * S; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 0.8 + R(); g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (R() - 0.5) * 28; y += (R() - 0.5) * 28; g.lineTo(x, y); } g.stroke(); }
    } else if (kind === 'skin') {   // wet hide: pores, veins, soft blotches
      for (let i = 0; i < 60; i++) { const x = R() * S, y = R() * S, r = 6 + R() * 18; wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, R() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }); }
      for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(R() * S, R() * S, 0.4 + R() * 0.7, 0, TAU); g.fill(); }
      for (let i = 0; i < 10; i++) { let x = R() * S, y = R() * S; g.strokeStyle = 'rgba(80,0,40,.3)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (R() - 0.5) * 20; y += (R() - 0.5) * 20; g.lineTo(x, y); } g.stroke(); }
    } else if (kind === 'ink') {   // swirling ink and oil sheen
      for (let i = 0; i < 70; i++) { const x = R() * S, y = R() * S, r = 6 + R() * 22, a0 = R() * TAU; wrap(() => { g.strokeStyle = R() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.4)'; g.lineWidth = 1 + R() * 2; g.beginPath(); for (let j = 0; j <= 24; j++) { const a = a0 + j / 24 * 4, rr = r * (1 - j / 34); j ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); }); }
    } else if (kind === 'nebula') {   // cosmic dust and stars
      for (let i = 0; i < 40; i++) { const x = R() * S, y = R() * S, r = 10 + R() * 30, col = ['255,80,200', '120,200,255', '255,200,120', '160,120,255'][i % 4]; wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},.22)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }); }
      for (let i = 0; i < 160; i++) { const x = R() * S, y = R() * S, r = 0.4 + R() * R() * 1.6; g.fillStyle = `rgba(255,255,255,${0.4 + R() * 0.6})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    } else if (kind === 'silk') {   // fine crossing threads
      for (let i = 0; i < 220; i++) { const x = R() * S, y = R() * S, L = 20 + R() * 60, a = R() * TAU; wrap(() => { g.strokeStyle = `rgba(255,255,255,${0.08 + R() * 0.2})`; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }); }
    } else if (kind === 'feather') {
      for (let i = 0; i < 600; i++) { const x = R() * S, y = R() * S, L = 6 + R() * 10; g.strokeStyle = R() < 0.4 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.3)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + L * 0.3); g.stroke(); }
    } else if (kind === 'hide') {   // thick hide: wrinkles that follow one another, pores between, a dry sheen on the ridges
      for (let i = 0; i < 26; i++) { let x = R() * S, y = R() * S; const a = (R() - 0.5) * 1.2, n = 6 + R() * 8; for (let k = 0; k < 3; k++) { wrap(() => { g.strokeStyle = k === 1 ? 'rgba(255,240,230,.14)' : `rgba(0,0,0,${0.3 + R() * 0.25})`; g.lineWidth = k === 1 ? 0.8 : 1.4 + R(); g.beginPath(); let xx = x, yy = y + k * 1.2; g.moveTo(xx, yy); for (let j = 0; j < n; j++) { xx += Math.cos(a) * 9 + (R() - 0.5) * 4; yy += Math.sin(a) * 9 + (R() - 0.5) * 4; g.lineTo(xx, yy); } g.stroke(); }); } }
      for (let i = 0; i < 1400; i++) { g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(R() * S, R() * S, 0.5 + R() * 0.9, 0, TAU); g.fill(); }
      for (let i = 0; i < 40; i++) { const x = R() * S, y = R() * S, r = 5 + R() * 14; wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, R() < 0.5 ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }); }
    } else if (kind === 'plates') {   // armour: hexagonal scales, each with its own bevel, a bright facet and a dark seam
      const rw = 13, ch = 11.3; for (let row = -1; row * ch < S + ch; row++) for (let col = -1; col * rw < S + rw; col++) { const x = col * rw + (((row % 2) + 2) % 2) * rw / 2, y = row * ch, r = 7.2; const path = () => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; i ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
        const gr = g.createLinearGradient(x - r, y - r, x + r * 0.6, y + r); gr.addColorStop(0, 'rgba(255,255,255,.34)'); gr.addColorStop(0.45, 'rgba(255,255,255,.02)'); gr.addColorStop(1, 'rgba(0,0,0,.5)'); path(); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.3; g.stroke(); g.fillStyle = `rgba(255,255,255,${0.1 + R() * 0.25})`; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.35, r * 0.28, r * 0.14, -0.7, 0, TAU); g.fill(); if (R() < 0.12) { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - r * 0.4, y + r * 0.3); g.lineTo(x + r * 0.1, y - r * 0.1); g.lineTo(x + r * 0.5, y + r * 0.2); g.stroke(); } }
    } else if (kind === 'pelt') {   // dense fur: three layers of strands, the top ones catching light
      for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 700; i++) { const x = R() * S, y = R() * S, L = 5 + R() * 11, a = 1.25 + (R() - 0.5) * 0.9 + layer * 0.1; wrap(() => { g.strokeStyle = layer === 2 ? `rgba(255,245,230,${0.1 + R() * 0.22})` : `rgba(0,0,0,${0.18 + R() * 0.3})`; g.lineWidth = 0.5 + R() * (layer === 2 ? 0.6 : 1.1); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.5) * L * 0.5, y + Math.sin(a + 0.5) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }); }
    } else if (kind === 'crystal') {   // mineral: long facets with inner light
      for (let i = 0; i < 36; i++) { const x = R() * S, y = R() * S, a = R() * TAU, L = 20 + R() * 40, w = 4 + R() * 10; wrap(() => { g.save(); g.translate(x, y); g.rotate(a); const gr = g.createLinearGradient(0, -w, 0, w); gr.addColorStop(0, 'rgba(255,255,255,.3)'); gr.addColorStop(0.5, 'rgba(255,255,255,.04)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-L / 2, 0); g.lineTo(-L / 3, -w); g.lineTo(L / 2, -w * 0.6); g.lineTo(L / 2.2, w); g.lineTo(-L / 3, w * 0.8); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.7; g.stroke(); g.restore(); }); }
    }
    const p = g.createPattern(cv, 'repeat'); tiles[kind] = { p, cv }; return tiles[kind];
  }
  function patt(c, kind, scale, rot) { const t = tex(kind); if (t.p.setTransform) { const m = new DOMMatrix(); m.rotateSelf(0, 0, (rot || 0) * 180 / Math.PI); m.scaleSelf(scale || 1, scale || 1); t.p.setTransform(m); } return t.p; }
  /* a lit volume: key light from the upper left, a coloured rim from behind, occlusion at the edges, texture and gloss */
  function body(c, path, x, y, r, o) {
    o = o || {}; const base = o.col || '#777777', lx = o.lx == null ? -0.45 : o.lx, ly = o.ly == null ? -0.55 : o.ly;
    path(); const gr = c.createRadialGradient(x + r * lx * 0.9, y + r * ly * 0.9, r * 0.05, x + r * lx * 0.2, y + r * ly * 0.2, r * 1.25);
    gr.addColorStop(0, o.hi || sh(base, 0.45)); gr.addColorStop(0.35, base); gr.addColorStop(0.8, o.dk || sh(base, -0.55)); gr.addColorStop(1, o.dk2 || sh(base, -0.8));
    c.fillStyle = gr; c.fill();
    const q = qq();
    if (q >= 1 || o.inner) {
      c.save(); path(); c.clip();
      if (o.tex && q >= 2) { c.globalCompositeOperation = o.texOp || 'overlay'; c.globalAlpha = o.texA == null ? 0.7 : o.texA; c.fillStyle = patt(c, o.tex, o.texS || 1, o.texR || 0); c.fillRect(x - r * 2, y - r * 2, r * 4, r * 4); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      if (o.inner) o.inner();
      if (q >= 1) {
        // occlusion hugging the silhouette
        path(); c.lineWidth = r * (o.ao == null ? 0.35 : o.ao); c.strokeStyle = rgba(o.aoCol || '#05030A', o.aoA == null ? 0.45 : o.aoA); c.stroke();
        // a rim of strange light on the far side
        if (o.rim) { c.globalCompositeOperation = 'lighter'; c.save(); c.translate(-r * lx * 0.12, -r * ly * 0.12); path(); c.restore(); c.lineWidth = r * (o.rimW || 0.12); c.strokeStyle = rgba(o.rim, o.rimA == null ? 0.55 : o.rimA); c.stroke(); c.globalCompositeOperation = 'source-over'; }
      }
      c.restore();
    }
    if (o.spec !== 0 && q >= 1) { c.save(); c.globalCompositeOperation = 'lighter'; const s = r * (o.specR || 0.32); c.translate(x + r * lx * 0.55, y + r * ly * 0.6); c.rotate(-0.6); c.scale(1, 0.45); const sg = c.createRadialGradient(0, 0, 0, 0, 0, s); sg.addColorStop(0, `rgba(255,255,255,${o.spec == null ? 0.35 : o.spec})`); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); c.restore(); }
    if (o.edge) { path(); c.lineWidth = o.edgeW || 1; c.strokeStyle = rgba(o.edge, o.edgeA == null ? 0.5 : o.edgeA); c.stroke(); }
  }
  const ellP = (c, x, y, rx, ry, rot) => () => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); };
  function blobP(c, pts) { return () => { const n = pts.length, P = i => pts[((i % n) + n) % n]; c.beginPath(); c.moveTo(P(0)[0], P(0)[1]); for (let i = 0; i < n; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); } c.closePath(); }; }
  /* a tapered tube along points (tails, necks, tendrils, serpents), shaded like a cylinder */
  function tubePts(pts, wf) {
    const N = pts.length - 1, L = [], Rr = [];
    for (let i = 0; i <= N; i++) { const p = pts[i], q = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, w = wf(i / N) / 2; L.push([p[0] - dy / d * w, p[1] + dx / d * w]); Rr.push([p[0] + dy / d * w, p[1] - dx / d * w]); }
    return { L, R: Rr };
  }
  function tube(c, pts, wf, o) {
    o = o || {}; const { L, R: Rr } = tubePts(pts, wf), path = () => { c.beginPath(); L.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); for (let i = Rr.length - 1; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]); c.closePath(); };
    path(); c.fillStyle = o.col || '#777'; c.fill();
    c.save(); path(); c.clip();
    if (o.tex && qq() >= 2) { c.globalCompositeOperation = o.texOp || 'overlay'; c.globalAlpha = o.texA == null ? 0.7 : o.texA; c.fillStyle = patt(c, o.tex, o.texS || 1, o.texR || 0); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), m = Math.max(...pts.map((p, i) => wf(i / (pts.length - 1)))); c.fillRect(Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) - Math.min(...xs) + m * 2, Math.max(...ys) - Math.min(...ys) + m * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    // cylinder shading: a dark band along the lower edge, a light one along the upper. Each band is one ribbon from just
    // outside the edge to k of the way in to the centre line (inside the clip): one fill, rather than a stroke a segment
    const band = (side, col, a, k) => { c.fillStyle = rgba(col, a); c.beginPath(); const n = pts.length;
      for (let i = 0; i < n; i++) { const s = side[i], p = pts[i], dx = p[0] - s[0], dy = p[1] - s[1]; i ? c.lineTo(s[0] - dx * 0.2, s[1] - dy * 0.2) : c.moveTo(s[0] - dx * 0.2, s[1] - dy * 0.2); }
      for (let i = n - 1; i >= 0; i--) { const s = side[i], p = pts[i]; c.lineTo(s[0] + (p[0] - s[0]) * k, s[1] + (p[1] - s[1]) * k); }
      c.closePath(); c.fill(); };
    const lowerIsL = (L[0][1] + L[L.length - 1][1]) > (Rr[0][1] + Rr[Rr.length - 1][1]);
    band(lowerIsL ? L : Rr, o.dk || '#05030A', o.dkA == null ? 0.55 : o.dkA, 0.7);
    c.globalCompositeOperation = 'lighter'; band(lowerIsL ? Rr : L, o.hi || '#FFFFFF', o.hiA == null ? 0.18 : o.hiA, 0.35);
    if (o.rim) band(lowerIsL ? L : Rr, o.rim, o.rimA == null ? 0.35 : o.rimA, 0.16);
    c.globalCompositeOperation = 'source-over';
    if (o.inner) o.inner(L, Rr);
    c.restore();
    return { L, R: Rr };
  }
  /* a limb segment between two joints */
  function seg(c, x0, y0, x1, y1, w0, w1, o) { return tube(c, [[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2], [x1, y1]], u => w0 + (w1 - w0) * u, o); }
  /* two-bone IK: where the knee goes between a hip and a foot, bending to `side` */
  function ik(hx, hy, fx, fy, l1, l2, side) {
    const dx = fx - hx, dy = fy - hy, d = Math.min(l1 + l2 - 0.001, Math.max(Math.abs(l1 - l2) + 0.001, Math.hypot(dx, dy))), a = Math.atan2(dy, dx);
    const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), b = Math.acos(clamp(cosA, -1, 1)) * (side || 1);
    return [hx + Math.cos(a - b) * l1, hy + Math.sin(a - b) * l1];
  }
  /* a wet, deep eye */
  function eyeR(c, x, y, r, iris, o) {
    o = o || {}; c.save();
    const g0 = c.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.05, x, y, r); g0.addColorStop(0, o.white || '#F2EADF'); g0.addColorStop(0.7, sh(o.white || '#E6DDCC', -0.25)); g0.addColorStop(1, '#3A2A2A');
    c.fillStyle = o.noWhite ? '#05030A' : g0; c.beginPath(); c.ellipse(x, y, r, r * (o.ry || 0.8), o.rot || 0, 0, TAU); c.fill();
    const ir = r * (o.irisK || 0.72), gi = c.createRadialGradient(x, y, ir * 0.1, x, y, ir); gi.addColorStop(0, sh(iris, 0.6)); gi.addColorStop(0.5, iris); gi.addColorStop(1, sh(iris, -0.6));
    c.fillStyle = gi; c.beginPath(); c.ellipse(x, y, ir, ir * (o.ry || 0.8) * 1.05, o.rot || 0, 0, TAU); c.fill();
    c.fillStyle = '#05030A'; c.beginPath(); o.slit ? c.ellipse(x, y, ir * 0.16, ir * 0.85, o.rot || 0, 0, TAU) : c.arc(x, y, ir * 0.42, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(x, y, 0, x, y, r * 2.2); gl.addColorStop(0, rgba(iris, 0.5)); gl.addColorStop(1, rgba(iris, 0)); c.fillStyle = gl; c.beginPath(); c.arc(x, y, r * 2.2, 0, TAU); c.fill();
    c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.3, r * 0.2, r * 0.13, -0.6, 0, TAU); c.fill();
    c.restore();
  }
  function glow(c, x, y, r, col, a) { if (!(r > 0) || !(a > 0)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  // a soft shadow (or any soft round shade): a picture made at its size, not a gradient worked out over every pixel
  function shade(c, x, y, rx, ry, a, col) { if (!(rx > 0) || !(ry > 0) || !(a > 0)) return; const ga = c.globalAlpha; c.globalAlpha = ga * Math.min(1, a); blitSized(c, shadeSprite(col || '#05030A'), x - rx, y - ry, rx * 2, ry * 2); c.globalAlpha = ga; }
  function teeth(c, pts, len, col, inward) { c.fillStyle = col || '#EFE6D2'; pts.forEach(([x, y, a, s]) => { const l = len * (s || 1); c.beginPath(); c.moveTo(x - Math.cos(a + Math.PI / 2) * l * 0.25, y - Math.sin(a + Math.PI / 2) * l * 0.25); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.lineTo(x + Math.cos(a + Math.PI / 2) * l * 0.25, y + Math.sin(a + Math.PI / 2) * l * 0.25); c.closePath(); c.fill(); }); }
  /* a stage for the creature: it is painted on its own layer, then lit as one solid thing: a key light catching the
     upper edges, a coloured rim from behind, occlusion pooling toward the ground, and an optional colour grade */
  const layers = {};
  /* quality: 2 paints the full light pass (its rim and key bands worked at half resolution), 1 keeps only the
     occlusion on a lighter layer, 0 paints straight onto the screen. The engine steps it down if frames run slow */
  function stage(c, key, X, Y, w, h, oy, paint, L) {
    L = L || {}; const q = qq();
    // a creature kept as a picture between frames (the fight's clock in L.t) is painted by stageKept
    if (!Q.live && L.t != null && (L.every > 1 || L.steps > 1)) { stageKept(c, key, X, Y, w, h, oy, paint, L, q); return; }
    // otherwise the layer is painted every frame at most at 1.5× (the light bands at a third of that): the eye reads the
    // lighting, not the pixels
    const dpr = Math.min(q >= 2 ? 1.5 : q >= 1 ? 1 : 0.75, (typeof arc !== 'undefined' && arc.dpr) || window.devicePixelRatio || 1), W = Math.ceil(w * dpr), Hh = Math.ceil(h * dpr);
    let ly = layers[key]; if (!ly) ly = layers[key] = { a: document.createElement('canvas'), b: document.createElement('canvas') };
    if (ly.a.width < W) ly.a.width = W; if (ly.a.height < Hh) ly.a.height = Hh;
    const a = ly.a.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; a.clearRect(0, 0, W, Hh);
    a.setTransform(dpr, 0, 0, dpr, w / 2 * dpr, (h - oy) * dpr); a.lineJoin = 'round'; a.lineCap = 'round';
    paint(a);
    stageLight(ly, ly.a, W, Hh, w, dpr, q, L, true);
    c.drawImage(ly.a, 0, 0, W, Hh, X - w / 2, Y - h + oy, w, h);
  }
  /* a creature kept as a picture: painted at the screen's own sharpness into a canvas off screen over a few frames, in
     L.steps steps (the painter is told which: paint(a, step), in order, back to front) and then lit, and only then put on
     show; on every frame the last finished picture is laid down whole, pixel for pixel, where the creature has moved to,
     with any hit flash added over it. With every = steps + 1 each frame paints one step, so the work is even */
  function stageKept(c, key, X, Y, w, h, oy, paint, L, q) {
    if (L.t !== LT) { LT = L.t; LF++; }
    const dpr = devK(c), W = Math.ceil(w * dpr), Hh = Math.ceil(h * dpr), steps = Math.max(1, L.steps || 1), every = stretch(Math.max(steps + (steps > 1 ? 1 : 0), L.every || 1));
    let ly = layers['kept-' + key]; if (!ly) ly = layers['kept-' + key] = { a: document.createElement('canvas'), f: document.createElement('canvas'), b: document.createElement('canvas'), step: null, F0: -1e9 };
    const sig = `${W}x${Hh}|${q}|${L.sig == null ? '' : L.sig}`, stale = ly.sig !== sig || !ly.shown || LF < ly.F0 || LF - ly.F0 > every * 3;
    const begin = () => { const A = ly.a; if (A.width < W || A.height < Hh || A.width > W * 1.3 + 16 || A.height > Hh * 1.3 + 16) { A.width = W + 4; A.height = Hh + 4; } const a = A.getContext('2d'); a.setTransform(1, 0, 0, 1, 0, 0); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; a.clearRect(0, 0, A.width, A.height); ly.W = W; ly.H = Hh; ly.w = w; ly.F0 = LF; ly.sig = sig; };
    const paintStep = i => { const a = ly.a.getContext('2d'); a.setTransform(dpr, 0, 0, dpr, ly.w / 2 * dpr, (h - oy) * dpr); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; a.lineJoin = 'round'; a.lineCap = 'round'; const fl0 = Q.flash; Q.flash = 0; try { paint(a, steps > 1 ? i : undefined); } finally { Q.flash = fl0; } if (steps > 1) settle(ly.a); };
    const finish = () => { stageLight(ly, ly.a, ly.W, ly.H, ly.w, dpr, q, L, false); const f = ly.f; ly.f = ly.a; ly.a = f; ly.shown = { k: dpr }; ly.step = null; };
    if (stale) { begin(); for (let i = 0; i < steps; i++) paintStep(i); finish(); }
    else if (ly.step != null) { if (ly.step < steps) { paintStep(ly.step); ly.step++; if (steps === 1) finish(); } else finish(); }
    else if (LF - ly.F0 >= every && (LF + (L.slot || 0)) % every === 0) { begin(); paintStep(0); ly.step = 1; if (steps === 1) finish(); }
    stageBlit(c, { a: ly.f }, X - w / 2, Y - h + oy, ly.shown.k);
  }
  // the light over a creature's layer: occlusion toward the ground, a key light along its upper edges, a rim behind
  // (the occlusion is the same for a layer of a size, so it is kept as a picture and laid over the creature in one copy;
  // the two bands are worked at a third of the size and stretched back up together, in one pass over the layer)
  function shadePic(ly, W, Hh, L) {
    const key = `${W}x${Hh}|${L.ao}|${L.side}|${L.grade}|${L.gradeA}`; if (ly.sp && ly.spKey === key) return ly.sp;
    const cv = ly.sp || (ly.sp = document.createElement('canvas')); cv.width = W; cv.height = Hh; const a = cv.getContext('2d');
    const ao = a.createLinearGradient(0, Hh * 0.45, 0, Hh); ao.addColorStop(0, 'rgba(4,2,8,0)'); ao.addColorStop(1, `rgba(4,2,8,${L.ao == null ? 0.45 : L.ao})`); a.fillStyle = ao; a.fillRect(0, 0, W, Hh);
    const side = a.createLinearGradient(W * 0.2, Hh * 0.1, W, Hh * 0.9); side.addColorStop(0, 'rgba(4,2,8,0)'); side.addColorStop(1, `rgba(4,2,8,${L.side == null ? 0.25 : L.side})`); a.fillStyle = side; a.fillRect(0, 0, W, Hh);
    if (L.grade) { a.globalAlpha = L.gradeA || 0.18; a.fillStyle = L.grade; a.fillRect(0, 0, W, Hh); a.globalAlpha = 1; }
    ly.spKey = key; return cv;
  }
  function stageLight(ly, A, W, Hh, w, dpr, q, L, flash) {
    const a = A.getContext('2d'), hw = Math.ceil(W / 3), hh = Math.ceil(Hh / 3);
    if (ly.b.width < hw) ly.b.width = hw; if (ly.b.height < hh) ly.b.height = hh;
    const b = ly.b.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0);
    a.globalCompositeOperation = 'source-atop';
    // a hit flash: the whole creature blinks white (cheaper than a canvas filter over every part)
    if (flash && Q.flash > 0) { a.fillStyle = `rgba(255,236,220,${0.3 * Q.flash})`; a.fillRect(0, 0, W, Hh); }
    // occlusion toward the ground and away from the key light
    if (q >= 1) a.drawImage(shadePic(ly, W, Hh, L), 0, 0);
    if (q >= 2) {
      // the key light catching the upper edges and a coloured rim from behind: the silhouette minus itself, shifted
      const off = Math.max(1.5, (L.off || 0.012) * w * dpr) / 2, both = ly.bb || (ly.bb = document.createElement('canvas'));
      if (both.width < hw || both.height < hh) { both.width = Math.max(both.width, hw); both.height = Math.max(both.height, hh); }
      const bc = both.getContext('2d'); bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalAlpha = 1; bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, hw, hh); bc.globalCompositeOperation = 'lighter';
      const band = (dx, dy, col, alpha) => { b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, hw, hh); b.drawImage(A, 0, 0, W, Hh, 0, 0, hw, hh); b.globalCompositeOperation = 'destination-out'; b.drawImage(A, 0, 0, W, Hh, dx, dy, hw, hh); b.globalCompositeOperation = 'source-atop'; b.fillStyle = col; b.fillRect(0, 0, hw, hh); bc.globalAlpha = Math.min(1, alpha); bc.drawImage(ly.b, 0, 0, hw, hh, 0, 0, hw, hh); };
      // two bands only: the key carries any specular asked for, the rim any subsurface warmth
      band(off, off * 1.2, L.key || 'rgba(235,245,255,1)', (L.keyA == null ? 0.38 : L.keyA) + (L.spec ? (L.specA == null ? 0.5 : L.specA) * 0.35 : 0));
      band(-off * 1.3, -off * 0.9, L.sss ? mixC(L.rim || '#7FFFE0', L.sss, 0.35) : (L.rim || '#7FFFE0'), (L.rimA == null ? 0.55 : L.rimA) + (L.sss ? (L.sssA == null ? 0.3 : L.sssA) * 0.3 : 0));
      a.globalCompositeOperation = 'lighter'; a.globalAlpha = 1; a.drawImage(both, 0, 0, hw, hh, 0, 0, W, Hh);
    }
    a.globalCompositeOperation = 'source-over';
  }
  /* a canvas records what is drawn on it and only paints it when something first reads it; a picture painted in steps
     is read (copied into a speck) after each step, so each frame does its own share of the painting */
  let speck = null;
  // (one pixel of it, copied 1:1: a whole picture shrunk to a speck costs as much again as painting a step, and the speck
  // is reset at once so it holds no copy of the picture the next step must preserve)
  function settle(cv) { if (!speck) { speck = document.createElement('canvas'); speck.width = speck.height = 1; } const g = speck.getContext('2d'); g.drawImage(cv, 0, 0, 1, 1, 0, 0, 1, 1); speck.width = 1; }
  // a kept creature laid down whole and unfiltered, with its hit flash added over it
  function stageBlit(c, ly, x, y, k) {
    blit1(c, ly.a, x, y, k);
    if (Q.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.22 * Math.min(1, Q.flash * 2); blit1(c, ly.a, x, y, k); c.restore(); }
  }
  /* frame pacing: a slow device gets a lighter light pass, a quick one gets it back */
  function pace() {
    const now = performance.now(), dt = Q.last ? Math.min(200, now - Q.last) : 16; Q.last = now; Q.avg += (dt - Q.avg) * 0.08;
    // missing frames, it gives up its light passes first; only once they are all gone, still missing frames for a second
    // and a half, does it repaint its pictures less often (for the rest of the fight), as that makes its own movement
    // step more coarsely, which the eye notices more than a plainer light
    if (Q.ev === 1 && Q.pin == null) { if (Q.avg > 19.5 && Q.q === 0) { Q.busyT += dt; if (Q.busyT > 1500) Q.ev = 1.5; } else Q.busyT = 0; }
    // (a step back up that has to be taken back within seconds doubles the wait before the next try, so a phone on the edge
    // doesn't stutter for a second every eight)
    if (Q.avg > 25) { Q.slowT += dt; Q.fastT = 0; if (Q.slowT > 900 && Q.q > 0) { if (now - Q.upAt < 5000) Q.wait = Math.min(60000, Q.wait * 2); Q.q--; Q.slowT = 0; Q.avg = 20; } }
    else if (Q.avg < 17.5) { Q.fastT += dt; Q.slowT = 0; if (Q.fastT > Q.wait && Q.q < 2) { Q.q++; Q.fastT = 0; Q.upAt = now; } }
    else { Q.slowT = 0; Q.fastT = 0; }
  }
  /* the outline of an ellipsoid (half-axes a along its facing th, b across it, cz up) as the game's camera sees it: a
     point (x, y, z) is drawn at (x, y - z). Returns the screen ellipse's half-axes and rotation */
  function ell3(a, b, cz, th) {
    const co = Math.cos(th), si = Math.sin(th), sxx = a * a * co * co + b * b * si * si, sxy = (a * a - b * b) * co * si, syy = a * a * si * si + b * b * co * co + cz * cz;
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    return [Math.sqrt(tr / 2 + disc), Math.sqrt(Math.max(1e-6, tr / 2 - disc)), 0.5 * Math.atan2(2 * sxy, sxx - syy)];
  }
  /* a point on the upper surface of that ellipsoid, (u along the facing, v across, both -1..1) */
  function surf3(P3, gx, gy, gz, a, b, cz, th, u, v, lift) { const co = Math.cos(th), si = Math.sin(th), w = Math.sqrt(Math.max(0, 1 - u * u - v * v)); return P3(gx + co * u * a - si * v * b, gy + si * u * a + co * v * b, gz + w * cz + (lift || 0)); }
  /* fur, mane or feathers along an edge: tapered locks leaning back along the line, two layers (short and long) */
  function tufts(c, s, pts, len, lean, n, seed, o) {
    o = o || {}; const cols = o.cols || ['#17151D', '#0C0B10', '#221F2A'], sheen = o.sheen || 'rgba(140,140,180,.16)', a0 = o.a0 || 0, wk = o.w || 1;
    const qk = qq() >= 2 ? 1 : qq() >= 1 ? 0.6 : 0.35;
    const layer = (len, lean, n, seed) => { n = Math.max(2, Math.round(n * qk)); const R = mulberry32(seed); c.save();
      for (let i = 0; i < n; i++) { const u = (i + R() * 0.6) / n, k = Math.min(0.999, u) * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(k)), e = k - j, p0 = pts[j], p1 = pts[j + 1], x = p0[0] + (p1[0] - p0[0]) * e, y = p0[1] + (p1[1] - p0[1]) * e, tx = p1[0] - p0[0], ty = p1[1] - p0[1], tl = Math.hypot(tx, ty) || 1, nx = ty / tl, ny = -tx / tl, L = s * len * (0.45 + R() * 0.7), ln = lean + (R() - 0.5) * 0.5, lx = -tx / tl * ln, ly = -ty / tl * ln;
        const ex = x + (nx + lx) * L, ey = y + (ny + ly) * L + a0 * L, w = s * (0.045 + R() * 0.045) * wk, bx = tx / tl * w, by = ty / tl * w, cx = x + (nx + lx * 0.4) * L * 0.55, cy = y + (ny + ly * 0.4) * L * 0.55;
        c.fillStyle = cols[Math.floor(R() * cols.length)]; c.beginPath(); c.moveTo(x - bx - nx * s * 0.06, y - by - ny * s * 0.06); c.quadraticCurveTo(cx - bx * 0.5, cy - by * 0.5, ex, ey); c.quadraticCurveTo(cx + bx * 0.5, cy + by * 0.5, x + bx - nx * s * 0.06, y + by - ny * s * 0.06); c.closePath(); c.fill();
        if (R() < 0.3) { c.strokeStyle = sheen; c.lineWidth = Math.max(0.6, s * 0.014); c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo((cx + ex) / 2 + nx * s * 0.03, (cy + ey) / 2 + ny * s * 0.03, ex, ey); c.stroke(); } }
      c.restore(); };
    layer(len * 0.55, lean + 0.5, Math.round(n * 1.3), seed + 101); layer(len, lean, n, seed);
  }
  /* the outline of the upper half of an ellipsoid (a dome: a shell, a carapace) seen by the camera: the convex hull of
     its surface and its rim. Returns a path function and the hull's points */
  function dome(c, P3, gx, gy, gz, a, b, cz, th) {
    const pts = [];
    for (let i = 0; i < 24; i++) { const ph = i / 24 * TAU; for (const r of [1, 0.75, 0.45]) { const u = Math.cos(ph) * r, v = Math.sin(ph) * r; pts.push(surf3(P3, gx, gy, gz, a, b, cz, th, u, v)); } }
    pts.push(surf3(P3, gx, gy, gz, a, b, cz, th, 0, 0));
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    const hull = lo.slice(0, -1).concat(hi.slice(0, -1));
    return { pts: hull, path: () => { c.beginPath(); hull.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); } };
  }
  /* ---------- pictures laid down pixel for pixel ----------
     A picture copied to the screen at its own size is the cheapest thing a canvas does, as long as nothing has to be
     filtered: stretched, or set between pixels, the same copy costs several times as much. A picture made at the screen's
     sharpness is therefore copied whole and unfiltered (between pixels it simply lands on the nearest one) */
  function devK(c) { const tr = c.getTransform ? c.getTransform() : null; return tr ? Math.hypot(tr.a, tr.b) : ((typeof arc !== 'undefined' && arc.dpr) || 1); }
  // what of the drawing space the canvas shows, grown by a margin, as [x0, y0, x1, y1]
  function viewBox(c, pad) {
    const cv = c.canvas, m = c.getTransform ? c.getTransform() : null;
    if (!m || !cv || Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6 || !m.a || !m.d) return [-pad, -pad, ((typeof arc !== 'undefined' && arc.W) || 400) + pad, ((typeof arc !== 'undefined' && arc.H) || 800) + pad];
    const xa = -m.e / m.a, xb = (cv.width - m.e) / m.a, ya = -m.f / m.d, yb = (cv.height - m.f) / m.d;
    return [Math.min(xa, xb) - pad, Math.min(ya, yb) - pad, Math.max(xa, xb) + pad, Math.max(ya, yb) + pad];
  }
  // a picture made at k of its pixels per canvas unit, its top left at (x, y) (only its first sw x sh pixels, if given). On
  // a sharp screen (1.5 pixels to the unit or more) it lands on whole pixels, which is a plain copy; set between pixels the
  // same copy costs as much as a stretched one. On a plain screen it keeps its place between them, so a slow glide stays smooth
  function blit1(c, cv, x, y, k, sw, sh) {
    const m = c.getTransform ? c.getTransform() : null, dk = m ? Math.hypot(m.a, m.b) : devK(c), exact = Math.abs(dk - k) <= k * 0.003, sm = c.imageSmoothingEnabled, w = sw || cv.width, h = sh || cv.height;
    if (exact) { c.imageSmoothingEnabled = false; if (m && dk >= 1.5 && !m.b && !m.c && m.a > 0 && m.d > 0) { x = (Math.round(m.a * x + m.e) - m.e) / m.a; y = (Math.round(m.d * y + m.f) - m.f) / m.d; } }
    c.drawImage(cv, 0, 0, w, h, x, y, w / k, h / k);
    if (exact) c.imageSmoothingEnabled = sm;
  }
  /* ---------- parts of a fiend kept as pictures ----------
     A fiend is hundreds of shapes a frame, and most of them move slowly. A part painted through layer() goes into a picture
     of its own, at the screen's sharpness, and is repainted only every few frames; in between, that picture is laid down
     where the part's anchor has moved to, so the part still glides at the full frame rate while its own motion (a wing's
     beat, a ring's turn) steps at a half or a third of it. Repaints are staggered by slot so the work spreads evenly over
     the frames, and anything that changes the picture outright (a zoom, a new pose: its signature) repaints it at once.
     o: { t (the fight's clock), box [x0, y0, x1, y1] where the part lies now (or a function giving it, called only when
     the picture is repainted: working out where every feather lies costs a frame something even when nothing is painted),
     ax, ay (its anchor now), every (frames between repaints), slot, sig, res (a fraction of the screen's sharpness, for
     soft light), op, alpha } */
  const LAYERS = new Map(); let LF = 0, LT = null;
  function layer(c, key, o, paint) {
    if (Q.live) { if (o.steps > 1) for (let i = 0; i < o.steps; i++) paint(c, i); else paint(c); return; }
    if (o.t !== LT) { LT = o.t; LF++; }
    if (o.steps > 1) { layerSteps(c, key, o, paint); return; }
    const k = devK(c) * (o.res || 1), every = stretch(Math.max(1, o.every || 2));
    let L = LAYERS.get(key); if (!L) { L = { cv: document.createElement('canvas'), F: -1e9, w: 0 }; LAYERS.set(key, L); }
    const stale = L.sig !== o.sig || Math.abs((L.k || 0) - k) > 1e-6 || !L.w || LF < L.F || LF - L.F > every * 2;
    if (stale || (LF - L.F >= every && (LF + (o.slot || 0)) % every === 0)) {
      const b = typeof o.box === 'function' ? o.box() : o.box, x0 = Math.floor(b[0]), y0 = Math.floor(b[1]), w = Math.ceil((Math.ceil(b[2]) - x0) * k), h = Math.ceil((Math.ceil(b[3]) - y0) * k);
      if (!(w > 0 && h > 0) || w > 4096 || h > 4096) { paint(c); return; }
      const cv = L.cv; if (cv.width < w || cv.height < h || cv.width > w * 1.3 + 32 || cv.height > h * 1.3 + 32) { cv.width = Math.ceil(w * 1.1) + 8; cv.height = Math.ceil(h * 1.1) + 8; }
      const g = L.g || (L.g = cv.getContext('2d'));
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cv.width, cv.height);
      g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); g.lineJoin = 'round'; g.lineCap = 'round';
      const fl = Q.flash; Q.flash = 0; try { paint(g); } finally { Q.flash = fl; }
      if (Q.log) Q.log.push(key + (stale ? '!' : ''));
      Object.assign(L, { F: LF, sig: o.sig, k, w, h, x0, y0, ax: o.ax || 0, ay: o.ay || 0, n: (L.n || 0) + 1, why: stale ? 'stale' : 'due' });
    }
    const x = L.x0 + ((o.ax || 0) - L.ax), y = L.y0 + ((o.ay || 0) - L.ay);
    c.save(); if (o.op) c.globalCompositeOperation = o.op; if (o.alpha != null) c.globalAlpha *= o.alpha;
    // (only the part of its canvas the picture fills: the canvas is kept a little larger, to be reused as it grows)
    blit1(c, L.cv, x, y, L.k, L.w, L.h);
    // a hit flash: the picture again, added over itself
    if (Q.flash > 0 && !o.noFlash) { c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.22; blit1(c, L.cv, x, y, L.k, L.w, L.h); }
    c.restore();
  }
  // the fight's clock, for a picture kept between frames; nothing is kept for art and previews (no fight is running)
  const fightT = (FX, t) => (FX && FX.S && FX.S.started ? t : null);
  /* a kept part painted in o.steps steps over as many frames (the painter is told which: paint(g, step), back to front)
     into a canvas off screen, which goes on show when the last step is done; each frame does one step's share. Each step
     is painted where the repaint began, so the steps line up however the part has moved meanwhile */
  function layerSteps(c, key, o, paint) {
    const k = devK(c) * (o.res || 1), steps = o.steps, every = stretch(Math.max(steps, o.every || steps)), ax = o.ax || 0, ay = o.ay || 0;
    let L = LAYERS.get(key); if (!L) { L = { cv: document.createElement('canvas'), back: document.createElement('canvas'), F: -1e9, w: 0, step: null }; LAYERS.set(key, L); }
    const stale = L.sig !== o.sig || Math.abs((L.k || 0) - k) > 1e-6 || !L.w || LF < L.F || LF - L.F > every * 3;
    const begin = () => { const b = typeof o.box === 'function' ? o.box() : o.box, x0 = Math.floor(b[0]), y0 = Math.floor(b[1]), w = Math.ceil((Math.ceil(b[2]) - x0) * k), h = Math.ceil((Math.ceil(b[3]) - y0) * k);
      if (!(w > 0 && h > 0) || w > 4096 || h > 4096) return false;
      const cv = L.back; if (cv.width < w || cv.height < h || cv.width > w * 1.3 + 32 || cv.height > h * 1.3 + 32) { cv.width = Math.ceil(w * 1.1) + 8; cv.height = Math.ceil(h * 1.1) + 8; }
      const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cv.width, cv.height);
      L.b = { F: LF, sig: o.sig, k, w, h, x0, y0, ax, ay }; L.step = 0; return true; };
    const doStep = () => { const B = L.b, g = L.back.getContext('2d'); g.setTransform(k, 0, 0, k, (B.ax - ax - B.x0) * k, (B.ay - ay - B.y0) * k); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.lineJoin = 'round'; g.lineCap = 'round';
      const fl = Q.flash; Q.flash = 0; try { paint(g, L.step); } finally { Q.flash = fl; } if (Q.log) Q.log.push(key + ':' + L.step); L.step++;
      if (L.step >= steps) { const f = L.cv; L.cv = L.back; L.back = f; Object.assign(L, L.b); L.step = null; } else settle(L.back); };
    if (stale) { if (!begin()) { paint(c); return; } while (L.step != null) doStep(); }
    else if (L.step != null) doStep();
    else if (LF - L.F >= every && (LF + (o.slot || 0)) % every === 0 && begin()) doStep();
    const x = L.x0 + (ax - L.ax), y = L.y0 + (ay - L.ay);
    c.save(); if (o.op) c.globalCompositeOperation = o.op; if (o.alpha != null) c.globalAlpha *= o.alpha;
    blit1(c, L.cv, x, y, L.k, L.w, L.h);
    if (Q.flash > 0 && !o.noFlash) { c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.22; blit1(c, L.cv, x, y, L.k, L.w, L.h); }
    c.restore();
  }
  // a new fight lets the last one's pictures go
  function dropLayers() { LAYERS.forEach(L => { L.cv.width = L.cv.height = 0; if (L.back) L.back.width = L.back.height = 0; }); LAYERS.clear(); Q.ev = 1; Q.busyT = 0; }
  const KIT = { TAU, rgba, mixC, sh, tex, patt, body, ellP, blobP, tube, tubePts, seg, ik, eyeR, glow, shade, teeth, angTo, lerpA, stage, ell3, surf3, tufts, Q, qq, pace, dome, devK, blit1, viewBox, layer, dropLayers, fightT, LAYERS, stretch };

  /* ---------- the engine ---------- */
  function create(H) {
    const F = H.F, M = H.M, me = H.me, g = H.g, FD = F.fiend, D = FIEND_DEFS[FD.id], C = M.FC;
    dropLayers();
    // the whole fight is worth twenty floor bosses of its floor (the curve eases above floor 100, where levels run out), split across its bars
    const hpMulF = F.n <= 100 ? F.hpMul : floorDef(100).hpMul * (1 + (F.n - 100) / 100 * 1.2), totalHP = 20 * BOSS_HP_MEAN * hpMulF * (1 + 0.3 * F.loop + 0.5 * FD.cycle), bars = FD.bars, barHP = totalHP / (FD.baseBars || bars), phases = FD.phases;
    const S = { D, FD, C, m: null, t: 0, phase: 1, lv: 1, fast: 1 + 0.12 * FD.cycle, props: D.props ? D.props(C) : [], phases, bars, barHP, tele: [], hz: [], objs: [], weak: {}, healAcc: 0, healCd: 0, started: false, roarT: 0, enterT: 0, contactCd: 0, mem: {}, arenaCv: null, arenaK: 0, k: 1, barShow: 1 };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const dist = (x, y) => Math.hypot(me.x - x, me.y - y);
    const inArena = (x, y, pad) => Math.hypot(x - C.x, y - C.y) < C.R - (pad || 0);
    const clampArena = (p, pad) => { const dx = p.x - C.x, dy = p.y - C.y, d = Math.hypot(dx, dy), R = C.R - (pad || 1); if (d > R) { p.x = C.x + dx / d * R; p.y = C.y + dy / d * R; } return p; };
    /* telegraphs: a shape on the ground that fills, then strikes whatever is inside */
    function inShape(s, x, y, rr) {
      rr = rr || 0;
      if (s.shape === 'fn') return s.test(x, y, rr);
      if (s.shape === 'circle') return Math.hypot(x - s.x, y - s.y) < s.r + rr;
      if (s.shape === 'ring') { const d = Math.hypot(x - s.x, y - s.y); if (d < s.r0 - rr || d > s.r1 + rr) return false; if (s.gaps) { const a = Math.atan2(y - s.y, x - s.x); if (s.gaps.some(([g0, w]) => Math.abs(angTo(g0, a)) < w)) return false; } return true; }
      if (s.shape === 'line') { const rx = x - s.x, ry = y - s.y, al = rx * Math.cos(s.a) + ry * Math.sin(s.a), of = Math.abs(-rx * Math.sin(s.a) + ry * Math.cos(s.a)); return al > -rr && al < s.len + rr && of < s.w / 2 + rr; }
      if (s.shape === 'cone') { const d = Math.hypot(x - s.x, y - s.y); if (d > s.len + rr) return false; return Math.abs(angTo(s.a, Math.atan2(y - s.y, x - s.x))) < s.spread + rr / Math.max(0.6, d); }
      return false;
    }
    function tele(o) { const s = Object.assign({ age: 0, t: 1, col: FD.glow, dmg: S.m ? S.m.dmg : 20 }, o); S.tele.push(s); return s; }
    function hz(o) { const z = Object.assign({ age: 0, life: 4, tick: 0.3, tk: 0, col: FD.glow, kind: 'pool', shape: 'circle' }, o); S.hz.push(z); return z; }
    /* things on the field the pet can strike: sluices, anchors, vents, pools... and weak points that pass damage to the fiend */
    function obj(o) {
      const m = H.spawnMon('fobj', o.x, o.y, Object.assign({ fobj: true, aggro: true, still: true, mv: 1, r: o.r || 0.6, hp: o.hp || 1, kind: o.kind || 'stone', z: 0, t: 0, invuln: false }, o));
      m.maxhp = m.hp; S.objs.push(m);
      if (o.front) { const i = H.mons.indexOf(m); if (i > 0) { H.mons.splice(i, 1); H.mons.unshift(m); } }
      return m;
    }
    function weak(key, x, y, r, k, on) {
      let w = S.weak[key];
      if (!on) { if (w && !w.dead) { w.dead = true; } S.weak[key] = null; return null; }
      if (!w || w.dead) { w = obj({ kind: 'weak', x, y, r, hp: 1e12, forward: k, front: true, key }); S.weak[key] = w; }
      w.x = x; w.y = y; w.r = r; w.forward = k; return w;
    }
    /* hit proxies that follow the painted body, so a tap anywhere on the colossus lands */
    function parts(list) {
      if (S.m && S.m.under) return;   // a hidden fiend's body can't be struck; only the weak points and anchors it chooses to show
      const P = S.partsMap || (S.partsMap = {});
      list.forEach(p => { let o = P[p.key]; if (!o || o.dead) { o = obj({ kind: 'part', x: S.m.x + p.dx, y: S.m.y + p.dy, r: p.r, hp: 1e12, forward: 1, front: true }); P[p.key] = o; } o.x = S.m.x + p.dx; o.y = S.m.y + p.dy; o.r = p.r; o.hp = 1e12; });
    }
    function minion(type, x, y, o) { const p = H.walkPoint(x, y, { r: 0.4, mv: 0, x, y }); const m = H.spawnMon(type, p.x, p.y, Object.assign({ aggro: true, fminion: true }, o || {})); g.total++; return m; }
    function bullet(x, y, a, v, o) { H.eshot(x, y, a, v, Object.assign({ dmg: S.m.dmg * 0.55, color: FD.glow, core: '#FFFFFF', r: 0.22 }, o || {})); }
    function hurt(d, o) { return H.hurtPet(d, S.m, o); }
    function push(dx, dy) { H.moveEnt(me, dx, dy, 0); }
    function teleportPet(x, y) { const p = H.walkPoint(x, y, me); H.sparks(me.x, me.y, FD.glow, 14, 5); me.x = p.x; me.y = p.y; H.ring(me.x, me.y, 0.2, 1.6, 0.4, FD.glow, 0.25); }
    function roar(s, sub) { H.banner(s, sub || '', FD.glow, 1.6, true); H.shake(12, 0.5); H.flash(0.25, FD.glow); H.sfx.hum(); }
    /* movement helpers: walk toward a point (and keep a gait going for the painter), circle the pet, fans and bursts of shots */
    function moveTo(m, tx, ty, spd, dt, o) {
      const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d < 0.05) { S.mem.spdK = (S.mem.spdK || 0) * Math.pow(0.02, dt); return d; }
      const v = Math.min(spd, d * 4), x0 = m.x, y0 = m.y; H.moveEnt(m, dx / d * v * dt, dy / d * v * dt, 1);
      const sp = Math.hypot(m.x - x0, m.y - y0) / Math.max(dt, 1e-4); S.mem.spdK = (S.mem.spdK || 0) + (Math.min(1, sp / ((o && o.full) || 7)) - (S.mem.spdK || 0)) * Math.min(1, dt * 6); S.mem.gait = (S.mem.gait || 0) + dt * (1.4 + sp * ((o && o.stepK) || 0.9));
      if (Math.abs(dx) > 0.2 && !(o && o.noFace)) m.face = dx >= 0 ? 1 : -1; return d;
    }
    function circlePet(m, dt, R, spd, o) { S.mem.cA = (S.mem.cA == null ? Math.atan2(m.y - me.y, m.x - me.x) : S.mem.cA) + dt * (spd / Math.max(2, R)) * (S.mem.cDir || 1); const p = clampArena({ x: me.x + Math.cos(S.mem.cA) * R, y: me.y + Math.sin(S.mem.cA) * R }, m.r + 0.4); return moveTo(m, p.x, p.y, spd, dt, o); }
    function fan(x, y, a, n, arc, v, o) { for (let i = 0; i < n; i++) { const aa = a + (n > 1 ? (i / (n - 1) - 0.5) * arc : 0); bullet(x, y, aa, v, o); } }
    function burst(x, y, n, v, o, a0) { for (let i = 0; i < n; i++) bullet(x, y, (a0 || 0) + i / n * TAU, v, o); }
    function noParts() { const P = S.partsMap; if (P) for (const k in P) if (P[k]) { P[k].dead = true; P[k] = null; } }
    /* out of reach: climbing overhead, diving, phased into the future */
    function untarget(on) { if (!S.m) return; S.m.under = !!on; if (on) { noParts(); for (const k in S.weak) weak(k, 0, 0, 0, 0, false); } }
    /* a slam: a circle on the ground that fills and strikes, with a boom where it lands */
    function slam(x, y, r, t, dmg, o) { return tele(Object.assign({ shape: 'circle', x, y, r, t, dmg, fn: s => { H.boom(s.x, s.y, s.r * 0.8, (o && o.col) || FD.glow, '#FFFFFF', { n: 16, shake: 8, smoke: 5 }); if (o && o.after) o.after(s); } }, o || {})); }
    const FX = { S, C, me, g, H, K: KIT, F, FD, rnd, noParts, untarget, slam, lv: () => S.lv, dist, inArena, clampArena, tele, hz, obj, weak, parts, minion, bullet, hurt, push, teleportPet, roar, inShape, moveTo, circlePet, fan, burst,
      angPet: (x, y) => Math.atan2(me.y - y, me.x - x), sx: H.sx, sy: H.sy, Tz: H.Tz, mem: S.mem };
    /* ---- the fight ---- */
    function start() {
      if (S.started) return; S.started = true;
      const hp = barHP * bars, m = { type: 'boss', fiend: FD.id, boss: FD.id, bk: { id: FD.id, name: FD.name, spd: 2, ai: 'fiend' }, mini: false, bname: FD.name, x: M.bossAt.x, y: M.bossAt.y, r: FD.r, hp, maxhp: hp, spd: 2,
        dmg: 15 * F.dmgMul * 1.25 * 1.1 * (1 + 0.2 * F.loop) * (FD.lvK || 1) * (FD.dmgK || 1), xp: 200 + 30 * F.n, color: FD.color, glow: FD.glow, aggro: true, act: 'enter', actT: 0, phase: 1, cd: 2.2, z: 0, t: 0, flash: 0, burn: 0, burnD: 0, venom: 0, venomT: 0, chill: 0, freeze: 0, stun: 0, kbx: 0, kby: 0, atkCd: 0, mv: 1, hitSq: 0, face: 1, still: true, ax: 0, ay: 1, vx: 0, vy: 0, a: Math.PI / 2 };
      S.m = m; FX.m = m; H.mons.push(m); g.boss = m; g.bossIntro = 3.4; g.bossShow = null; S.enterT = 0;
      H.banner('SUPER FIEND', `${FD.name} · ${FD.title}`, FD.glow, 3, true, true); H.flash(0.4, FD.glow); H.shake(14, 0.8); H.sfx.hum();
      if (D.init) D.init(FX);
    }
    // phase thresholds: two phases split at half health; four at three quarters, half and a quarter
    const phaseAt = p => FD.cuts ? FD.cuts[p - 1] : 1 - (p - 1) / phases;   // a fiend may name its own thresholds
    /* the fiend's design has three acts and an enraged fourth. A two-phase fight opens with the first act and turns
       straight to the final one (bringing the second act's tricks along); a four-phase fight plays all of them */
    const lvOf = p => phases === 2 ? (p === 1 ? 1 : 3) : p;   // three-phase fights (the high fiends) play their three acts in order
    function updBoss(m, dt) {
      S.t += dt; m.t += dt; S.contactCd -= dt;
      if (m.act === 'enter') {
        S.enterT += dt; m.z = Math.max(0, 1 - S.enterT / 2.4);
        if (g.bossIntro <= 0) { m.act = D.firstAct || 'circle'; m.actT = 0; m.z = 0; H.shake(16, 0.6); H.boom(m.x, m.y, 3.5, FD.glow, '#FFFFFF', { n: 40, shake: 16, smoke: 12 }); }
        return;
      }
      // a new phase: the fiend recoils, the arena turns, and its hunting changes
      const f = m.hp / m.maxhp;
      if (S.phase < phases && f <= phaseAt(S.phase + 1)) {
        S.phase++; m.phase = S.phase; S.lv = lvOf(S.phase); S.roarT = 2.2; S.tele.length = 0; H.eshots.length = 0;
        roar(`PHASE ${['I', 'II', 'III', 'IV'][S.phase - 1]}`, `${FD.name} · ${phaseName()}`);
        H.ring(m.x, m.y, 0.5, 9, 1, FD.glow, 0.4); H.boom(m.x, m.y, 3, FD.glow, '#FFFFFF', { n: 30, shake: 14, smoke: 8 });
        for (let i = 0; i < 4; i++) H.drop(i % 2 ? 'mp' : 'hp', m.x + rnd(-2, 2), m.y + rnd(-1, 2));
        if (D.phase) D.phase(FX, S.phase, S.lv);
      }
      if (S.roarT > 0) { S.roarT -= dt; return; }
      if (g.stopT > 0 || g.cineT > 0) return;
      const slow = (m.chill > 0 ? 0.8 : 1) * (g.warpT > 0 ? 0.4 : 1) * (m.curseT > 0 ? 0.85 : 1);
      if (m.stunT > 0) { m.stunT -= dt; if (D.stunned) D.stunned(FX, m, dt); return; }
      D.ai(FX, m, dt * slow);
      // touching the colossus hurts
      if (!m.noTouch && S.contactCd <= 0 && Math.hypot(me.x - m.x, me.y - m.y) < m.r * (m.touchK || 0.8) + me.r) { if (hurt(m.dmg * 0.7)) { S.contactCd = 0.9; const a = Math.atan2(me.y - m.y, me.x - m.x); me.push = { vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, t: 0.22 }; } }
    }
    const phaseName = () => (D.phaseNames && D.phaseNames[Math.min(D.phaseNames.length, S.lv) - 1]) || '';
    function update(dt) {
      if (!S.started) return;
      S.healCd -= dt;
      // telegraphs
      // telegraphs; overlapping strikes that land together count once (a short grace after any marked blow)
      for (let i = S.tele.length - 1; i >= 0; i--) { const s = S.tele[i]; s.age += dt; if (s.tick) s.tick(dt, s); if (!s.done && s.age >= s.t) { s.done = true; if (s.dmg && inShape(s, me.x, me.y, me.r) && S.t - (S.lastTeleHit || -9) > 0.45) { if (hurt(s.dmg, s.hurtO)) S.lastTeleHit = S.t; } if (s.fn) s.fn(s); if (!s.linger) S.tele.splice(i, 1); } else if (s.done && s.age >= s.t + (s.linger || 0)) S.tele.splice(i, 1); }
      // hazards
      for (let i = S.hz.length - 1; i >= 0; i--) { const z = S.hz[i]; z.age += dt; if (z.update) z.update(dt, z); if (z.dps && z.age > (z.arm || 0)) { z.tk -= dt; if (z.tk <= 0) { z.tk = z.tick; if (inShape(z, me.x, me.y, me.r * 0.5) && !(z.safe && z.safe())) hurt(z.dps * z.tick, { dot: true }); } } if (z.slow && inShape(z, me.x, me.y, 0)) me.chill = Math.max(me.chill, 0.2); if (z.age >= z.life) S.hz.splice(i, 1); }
      for (let i = S.objs.length - 1; i >= 0; i--) if (S.objs[i].dead) S.objs.splice(i, 1);
      if (D.update) D.update(FX, dt);
    }
    function updObj(o, dt) { o.t += dt; if (o.life != null) { o.life -= dt; if (o.life <= 0) { o.dead = true; if (o.onExpire) o.onExpire(o); } } if (o.tick) o.tick(o, dt); }
    /* damage into the fiend: armour, exposure and weak points */
    function dmgIn(m, dmg, o) {
      // (the sun's own judgement, Leo's, burns through any armour: its three bars are three bars)
      if (o && o.pierce) return dmg;
      if (o && o.viaWeak) { if (D.onWeakHit) D.onWeakHit(FX, o.weakKey, dmg); if (Math.random() < 0.25) H.text(m.x, m.y - m.r - 1.2, 'WEAK POINT!', FD.accent || '#FFFFFF', 13); return dmg * (S.roarT > 0 ? 0.3 : 1); }
      const k = D.dmgK ? D.dmgK(FX, m, o) : 1; S.k = k;
      if (k < 0.5 && Math.random() < 0.15) H.text(m.x, m.y - m.r - 1, 'Armoured!', '#CFC6E0', 12);
      return dmg * k * (S.roarT > 0 ? 0.3 : 1);
    }
    function onHit(m, dmg) {
      // its wounds spill healing light for the pet to catch
      S.healAcc += dmg;
      if (S.healAcc > barHP * 0.045 && S.healCd <= 0) { S.healAcc = 0; S.healCd = 1.1; const a = Math.atan2(me.y - m.y, me.x - m.x), x = m.x + Math.cos(a) * (m.r + 0.6), y = m.y + Math.sin(a) * (m.r + 0.6); H.drop('hp', x, y); if (Math.random() < 0.45) H.drop('mp', x, y); H.sparks(x, y, '#8FE0A6', 8, 4); }
    }
    function objHit(o, dmg) { if (o.onHit) o.onHit(o, dmg); }
    function objDied(o) { o.dead = true; if (o.onKill) o.onKill(o); }

    /* ---- the arena: a painted ground, a backdrop of the fiend's world and its living layers ----
       Both pictures are laid down as plain copies, pixel for pixel. The ground is painted at the screen's own sharpness for
       the zoom the fight holds, and again once a new zoom has held for a moment (while the camera glides between zooms the
       last one is stretched). The sky is a backdrop: painted small and soft once for each state of the fight (its stage, a
       dawn, a change of world) and then held still, so it costs one copy a frame */
    function arenaPaint(P) {
      const R = C.R + 1.5, size = Math.ceil(R * 2 * P), cv = document.createElement('canvas'); cv.width = cv.height = size;
      const c = cv.getContext('2d'); c.translate(size / 2, size / 2); c.scale(P, P);   // world units, centred on the arena
      D.paintGround(c, { R: C.R, rnd: mulberry32(FD.id.length * 977 + 13), K: KIT, FX, lv: S.lv });
      if (S.arenaCv) S.arenaCv.width = 0;
      S.arenaCv = cv; S.arenaP = P; S.arenaKey = D.groundKey ? D.groundKey(FX) : '';
    }
    const SKY_T = 12.5;   // the moment the backdrop is painted at
    function drawArena(c, W, H2, cam, T, t) {
      const k = devK(c);
      if (D.sky) {
        const cw = Math.round(W * k), ch = Math.round(H2 * k), q = qq() >= 2 ? 1 : 0, key = `${cw}x${ch}|${q}|${S.lv}|${D.skyKey ? D.skyKey(FX) : ''}`;
        if (S.skyKey !== key) {
          const ks = q ? 0.4 : 0.28, sw = Math.ceil(W * ks), shh = Math.ceil(H2 * ks); let sc = S.skyCv; if (!sc) sc = S.skyCv = document.createElement('canvas');
          if (sc.width !== sw || sc.height !== shh) { sc.width = sw; sc.height = shh; }
          const c2 = sc.getContext('2d'); c2.setTransform(ks, 0, 0, ks, 0, 0); c2.globalAlpha = 1; c2.globalCompositeOperation = 'source-over'; c2.fillStyle = '#05030A'; c2.fillRect(0, 0, W, H2);
          D.sky(c2, W, H2, SKY_T, { x: C.x, y: C.y }, T, FX); c2.setTransform(1, 0, 0, 1, 0, 0);
          let sf = S.skyFull; if (!sf) sf = S.skyFull = document.createElement('canvas'); if (sf.width !== cw || sf.height !== ch) { sf.width = cw; sf.height = ch; }
          const g2 = sf.getContext('2d'); g2.setTransform(1, 0, 0, 1, 0, 0); g2.drawImage(sc, 0, 0, sw, shh, 0, 0, cw, ch);
          S.skyKey = key;
        }
        // (where the arena's platform is a solid disc, D.floorDisc, it hides the sky: only the rows of the screen it does not
        // span from side to side are copied, which in the fight is most often a strip at the top and one at the bottom)
        const sk = S.skyFull, m0 = c.getTransform(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
        let rows = null;
        if (D.floorDisc && !m0.b && !m0.c && m0.a > 0) {
          const Xc = m0.a * FX.sx(C.x) + m0.e, Yc = m0.d * FX.sy(C.y) + m0.f, Rd = (C.R - 0.15) * T * m0.a, mx = Math.max(Xc, sk.width - Xc);
          if (Rd > mx + 2) { const hy = Math.sqrt(Rd * Rd - mx * mx) - 2; rows = [[0, Math.min(sk.height, Math.ceil(Yc - hy))], [Math.max(0, Math.floor(Yc + hy)), sk.height]]; }
        }
        if (!rows) c.drawImage(sk, 0, 0); else rows.forEach(([y0, y1]) => { if (y1 > y0) c.drawImage(sk, 0, y0, sk.width, y1 - y0, 0, y0, sk.width, y1 - y0); });
        c.restore();
      } else { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#05030A'; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); }
      // the ground at the zoom the fight holds: a new one that has held for a moment is painted afresh; a ground that
      // changes with the fight (its stage's light, say: D.groundKey) is painted afresh when it does
      const want = Math.min(T * k, 64);
      if (!S.arenaCv || (D.groundKey && S.arenaKey !== D.groundKey(FX))) arenaPaint(S.arenaCv ? S.arenaP : want);
      if (Math.abs(want - (S.holdP || 0)) > want * 0.003) { S.holdP = want; S.holdT = t; }
      else if (Math.abs(S.arenaP - want) > want * 0.003 && (t - S.holdT > 0.6 || t < S.holdT)) arenaPaint(want);
      const R = C.R + 1.5;
      blit1(c, S.arenaCv, FX.sx(C.x - R), FX.sy(C.y - R), S.arenaP / T);
      if (D.overlay) { c.save(); D.overlay(c, FX, t, T); c.restore(); }
    }
    /* ground layer: hazards and telegraphs, under everything that stands */
    function drawGround(c) {
      const T = FX.Tz(), t = g.t;
      for (const z of S.hz) { if (z.draw) { c.save(); z.draw(c, z, FX, T, t); c.restore(); } else drawHz(c, z, T, t); }
      for (const s of S.tele) if (!s.done || s.linger) drawTele(c, s, T, t);
    }
    function shapePath(c, s, T, grow) {
      const X = FX.sx(s.x), Y = FX.sy(s.y); c.beginPath();
      if (s.shape === 'circle') c.arc(X, Y, Math.max(0.1, s.r * T * grow), 0, TAU);
      else if (s.shape === 'ring') { const r0 = s.r0 * T, r1 = s.r0 * T + (s.r1 - s.r0) * T * grow; if (s.gaps) { const segs = []; let a0 = 0; const gs = s.gaps.map(([a, w]) => [a - w, a + w]).sort((p, q) => p[0] - q[0]); if (!gs.length) segs.push([0, TAU]); else { for (let i = 0; i < gs.length; i++) { const nx = gs[(i + 1) % gs.length][0] + (i === gs.length - 1 ? TAU : 0); segs.push([gs[i][1], nx]); } } segs.forEach(([b0, b1]) => { c.moveTo(X + Math.cos(b0) * r1, Y + Math.sin(b0) * r1); c.arc(X, Y, r1, b0, b1); c.arc(X, Y, r0, b1, b0, true); c.closePath(); }); a0; } else { c.arc(X, Y, r1, 0, TAU); c.moveTo(X + r0, Y); c.arc(X, Y, r0, 0, TAU, true); } }
      else if (s.shape === 'line') { c.save(); c.translate(X, Y); c.rotate(s.a); c.rect(0, -s.w / 2 * T, s.len * T * grow, s.w * T); c.restore(); }
      else if (s.shape === 'cone') { c.moveTo(X, Y); c.arc(X, Y, s.len * T * grow, s.a - s.spread, s.a + s.spread); c.closePath(); }
    }
    function drawTele(c, s, T, t) {
      const u = clamp(s.age / s.t, 0, 1), col = s.col || FD.glow, X = FX.sx(s.x), Y = FX.sy(s.y);
      c.save();
      // the whole area darkens with a sickly sheen, the strike fills it from the source outward
      shapePath(c, s, T, 1); c.fillStyle = rgba('#0A0410', 0.13); c.fill('evenodd');
      c.globalCompositeOperation = 'lighter';
      shapePath(c, s, T, s.shape === 'ring' ? 1 : u); c.fillStyle = rgba(col, 0.04 + u * 0.1); c.fill('evenodd');
      shapePath(c, s, T, 1); c.lineWidth = 1.5 + u * 1.5; c.strokeStyle = rgba(col, 0.45 + 0.4 * Math.sin(t * 18) * u + u * 0.3); c.stroke();
      if (s.shape === 'ring' && s.gaps) s.gaps.forEach(([a, w]) => { const r = (s.r0 + s.r1) / 2 * T; c.globalAlpha = 0.8; blitSized(c, glowSprite('#8FFFE0'), X + Math.cos(a) * r - T, Y + Math.sin(a) * r - T, T * 2, T * 2); });
      if (s.label) { c.globalCompositeOperation = 'source-over'; c.font = `900 ${Math.round(T * 0.7)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; const lx = s.shape === 'line' ? X + Math.cos(s.a) * s.len * T * 0.5 : X, ly = s.shape === 'line' ? Y + Math.sin(s.a) * s.len * T * 0.5 : Y; c.strokeText(s.label, lx, ly); c.fillStyle = '#FFFFFF'; c.fillText(s.label, lx, ly); }
      c.restore();
    }
    function drawHz(c, z, T, t) {
      const X = FX.sx(z.x), Y = FX.sy(z.y), fade = Math.min(1, z.age / 0.4, (z.life - z.age) / 0.6), col = z.col;
      c.save(); c.globalAlpha = fade;
      if (z.shape === 'circle') {
        const r = z.r * T, gr = c.createRadialGradient(X, Y, r * 0.1, X, Y, r); gr.addColorStop(0, rgba(col, 0.5)); gr.addColorStop(0.75, rgba(sh(col, -0.4), 0.4)); gr.addColorStop(1, rgba(col, 0)); c.fillStyle = gr; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
        c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const a = t * (0.6 + i * 0.3) + i * 2, rr = r * (0.3 + 0.2 * i); c.globalAlpha = fade * 0.25; blitSized(c, glowSprite(col), X + Math.cos(a) * rr - r * 0.4, Y + Math.sin(a) * rr - r * 0.4, r * 0.8, r * 0.8); }
      } else {
        // (its edge feathered: a faint fill, and the outline a soft glow straddling the edge rather than a hard line)
        shapePath(c, z, T, 1); c.fillStyle = rgba(col, 0.22); c.fill('evenodd'); c.lineJoin = 'round';
        [[0.7, 0.05], [0.42, 0.08], [0.2, 0.12], [0.07, 0.24]].forEach(([w, a]) => { c.lineWidth = Math.max(1, w * T); c.strokeStyle = rgba(col, a); c.stroke(); });
      }
      c.restore();
    }
    function drawFx(c) { if (D.drawFx) { c.save(); D.drawFx(c, FX, FX.Tz(), g.t); c.restore(); } }
    /* a fiend that keeps its picture (D.keep: { every, steps, pad }) is painted into one of its own every few frames (or
       continually, a step a frame: D.draw is then told the step), over the whole of the view, and laid down where it
       has moved to in between */
    function drawBoss(c, m, X, Y) {
      const T = FX.Tz(); pace();
      c.save();
      if (m.act === 'enter') { c.globalAlpha = clamp(S.enterT / 1.6, 0, 1); }
      KIT.Q.flash = m.flash > 0 ? 1 : 0;
      const Yb = Y - (m.z || 0) * T * 4, K = D.keep;
      if (K && !Q.live) layer(c, 'fiend-' + FD.id, { t: g.t, box: viewBox(c, T * (K.pad || 1.5)), ax: X, ay: Yb, every: K.every || 2, steps: K.steps, slot: K.slot || 0, sig: `${Math.round(T * 8)}|${qq()}|${S.lv}|${K.sig ? K.sig(FX, m) : ''}` }, (g2, step) => D.draw(g2, FX, m, X, Yb, T, g.t, step));
      else D.draw(c, FX, m, X, Yb, T, g.t);
      KIT.Q.flash = 0; c.restore();
    }
    /* standing scenery the fiend's arena brings (pillars, ruins), drawn in depth order with everything else. Scenery that
       is kept (D.propKeep: { every, box(p) in world units about its foot, sig(FX, p) }) is a picture of each piece,
       repainted a few times a second in turn; what moves on it quickly the fiend paints live in drawPropLive */
    function drawProp(c, p) {
      if (!D.drawProp) return;
      const X = FX.sx(p.x), Y = FX.sy(p.y), T = FX.Tz(), PK = D.propKeep;
      if (PK && !Q.live && (!PK.only || PK.only(p))) {
        const i = p._pi != null ? p._pi : (p._pi = S.props.indexOf(p)), b = PK.box(p), ev = PK.every || 6;
        layer(c, `prop-${FD.id}-${i}`, { t: g.t, box: [X + b[0] * T, Y + b[1] * T, X + b[2] * T, Y + b[3] * T], ax: X, ay: Y, every: ev, slot: i % ev, sig: `${Math.round(T * 8)}|${PK.sig ? PK.sig(FX, p) : ''}`, noFlash: true }, g2 => { g2.save(); D.drawProp(g2, FX, p, X, Y, T, g.t); g2.restore(); });
        if (D.drawPropLive) { c.save(); D.drawPropLive(c, FX, p, X, Y, T, g.t); c.restore(); }
        return;
      }
      c.save(); D.drawProp(c, FX, p, X, Y, T, g.t); c.restore();
      if (D.drawPropLive) { c.save(); D.drawPropLive(c, FX, p, X, Y, T, g.t); c.restore(); }
    }
    function drawObj(c, o, X, Y) {
      const T = FX.Tz();
      if (o.kind === 'part') return;
      if (o.kind === 'weak') { const r = o.r * T, p = 0.6 + 0.4 * Math.sin(g.t * 8); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.3 * p; blitSized(c, shockSprite(FD.accent || '#FFFFFF'), X - r * 1.3, Y - r * 1.3, r * 2.6, r * 2.6); c.globalAlpha = 0.35 * p; blitSized(c, glowSprite('#FFFFFF'), X - r * 0.6, Y - r * 0.6, r * 1.2, r * 1.2); c.restore(); return; }
      c.save(); if (o.flash > 0) c.filter = 'brightness(1.8)';
      if (D.drawObj) D.drawObj(c, FX, o, X, Y, T, g.t);
      c.restore();
      if (o.maxhp > 1 && o.hp < o.maxhp && !o.invuln) { const w = Math.max(22, o.r * T * 1.4); c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(X - w / 2, Y - o.r * T - 14, w, 4); c.fillStyle = FD.accent || FD.glow; c.fillRect(X - w / 2, Y - o.r * T - 14, w * clamp(o.hp / o.maxhp, 0, 1), 4); }
    }
    /* the health bars: one stacked bar per five floors, a counter, and pips for the phases */
    function drawHud(c, W) {
      const m = S.m; if (!m || m.dead || g.bossIntro > 2.4) return;
      const left = Math.max(0, m.hp), n = Math.max(0, Math.ceil(left / barHP - 1e-9)), cur = n ? (left - (n - 1) * barHP) / barHP : 0;
      S.barShow += ((n - 1 + cur) - S.barShow) * 0.06; if (Math.abs(S.barShow - (n - 1 + cur)) > 1.2) S.barShow = n - 1 + cur;
      // a slim strip under the pet HUD: name and phase pips on one 10px line, a 6px stacked bar beneath, the bar count at its end
      const bw = Math.min(140, W * 0.36), x0 = W - 12 - bw, by = 10 + Math.min(88, W * 0.24) + 14, cols = ['#FF3B4E', '#FF7A2E', '#FFD447', '#8FE0A6', '#5FD4FF', '#B983F5', '#FF6FD8', '#FFFFFF'];
      c.save(); c.globalAlpha = 0.92;
      // (its name, cut to fit once for the width it has, and its count are pictures kept between frames)
      if (S.hudNmW !== bw) { c.font = `900 8.5px ${arcFont}`; let nm = FD.name.toUpperCase(); while (nm.length > 4 && c.measureText(nm).width > bw - 34 - phases * 8) nm = nm.slice(0, -2) + '…'; S.hudNm = nm; S.hudNmW = bw; }
      GFX.labelS(c, S.hudNm, x0, by, 8.5, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'left');
      for (let i = 0; i < phases; i++) { const px = x0 + bw - 26 - (phases - 1 - i) * 8, on = i < S.phase; c.fillStyle = on ? FD.glow : 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(px, by - 3.5); c.lineTo(px + 3, by); c.lineTo(px, by + 3.5); c.lineTo(px - 3, by); c.closePath(); c.fill(); }
      const bh = 5, yb = by + 7, ci = Math.max(0, n - 1), under = n > 1 ? cols[(ci - 1) % cols.length] : null, colNow = cols[ci % cols.length];
      c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, x0 - 1, yb - 1, bw + 2, bh + 2, 4); c.fill();
      if (under) { c.fillStyle = rgba(under, 0.6); GFX.rr(c, x0, yb, bw, bh, 3); c.fill(); }
      const showCur = clamp(S.barShow - ci, 0, 1);
      if (showCur > cur) { c.fillStyle = 'rgba(255,255,255,.7)'; GFX.rr(c, x0, yb, Math.max(6, bw * showCur), bh, 3); c.fill(); }
      if (cur > 0) { const gr = c.createLinearGradient(x0, 0, x0 + bw, 0); gr.addColorStop(0, sh(colNow, -0.25)); gr.addColorStop(1, colNow); c.fillStyle = gr; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh * 0.4, 2); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 1; i < 5; i++) c.fillRect(x0 + bw * i / 5, yb + 1, 1, bh - 2);
      GFX.labelS(c, `×${n}`, x0 + bw, by, 9, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'right');
      c.restore();
    }
    const goal = () => { const m = S.m; if (!m) return `${FD.name} awakens...`; const n = Math.max(0, Math.ceil(Math.max(0, m.hp) / barHP - 1e-9)); return `${FD.name} · ${n} bar${n === 1 ? '' : 's'} · phase ${S.phase}/${phases}`; };
    // a fiend may stage its own ending: what the game shows after it falls, and when the win is called
    const ending = m => D.ending ? D.ending(FX, m) : null;
    // where the camera should look, if the fiend has a view of its own: { x, y, k (how far toward it), zoom }
    const camFocus = () => (D.camFocus && S.m ? D.camFocus(FX, S.m) : null);
    // a fiend may refuse a killing blow until its last mechanic is answered (it keeps the health it sets)
    const holdOn = m => !!(D.holdOn && D.holdOn(FX, m));
    return { S, FX, start, update, updBoss, updObj, dmgIn, onHit, objHit, objDied, drawArena, drawGround, drawFx, drawBoss, drawObj, drawProp, drawHud, goal, barHP, ending, camFocus, holdOn };
  }
  return { create, KIT };
})();
