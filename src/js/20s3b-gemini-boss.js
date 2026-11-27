/* ---------- (v468 GB, reworked v469 GB) The Gemini Gate's boss: THE TRIAL OF TWO HEAVENS, Raziel, The Twin Revelation ----------
   Beyond the Clash of the Twins (the gate and its puzzle, 20s3 / 20s3a), in THE EQUINOX SANCTUM: a round platform of gold and
   platinum plates hung over an empty dark void (the 'equinox' land below: its floor painted once into the engine's ground chunks;
   nothing behind it: v469, the user), eight sectors (radial seams, a constellation of 1..8 stars at each rim), Fire and Ice channels,
   a luminous boundary and rotating machinery round it (FGFX kind 490), four pylons, four anchors, two mirrors and orbiting ring
   fragments (Raziel's own meshes through RAZIEL_GL.drawParts), the Gemini emblem at its heart.
   v469 (the user: "it should be incorporated into the fight as usual ... Raziel should have a health bar like every other bosses"):
   an ORDINARY gate boss. One health bar (Asmodeus's: 36 stacked bars, their count, five phase pips); take it to zero and it falls,
   the defeat cinematic plays and X.winStage completes the gate (21b's gateFinish unlocks the Gemini Anima once). No health gates, no
   scored mechanics, no seals, no wipe. Raziel is the GPU model (RAZIEL_GL, its Lv7 form, TUNE.size tiles tall), both heads aimed and
   charged on their own, converging as the phases run on.
   THE STATE MACHINE (S.mode): 'intro' (the awakening: untouchable) -> 'fight' (its rotation; S.vuln an exposed window inside it) <->
   'trans' (a phase's roar) <-> 'mech' (one of its two great judgements) -> 'dead' (the defeat cinematic) -> 'over'.
   Its blows: Infernal Breath, Cryogenic Breath, Gemini Talon, Mirror Tail Sweep, Twin Fang Protocol (from Phase I); Solar Eruption,
   Absolute Zero, Wing Guillotine, Twin Meteor, Steam Rupture (from Phase II); Phase IV and V combine them (a second head's follow-up,
   larger Thermal Shocks, pulses after the tail and the wing). And, in the rotation every so often (TUNE.big), its two great judgements:
     OPPOSING HEAVENS   three waves: one head charges its element; take the opposite protection in a sanctuary of that element
                        (wave 3: both charge, one cancels: watch which); without it the wave lands as a heavy blow
     MIRROR MEMORY      (from Phase II) four patterns of two lit sectors, then REPEAT or REFLECT them: be in one of each step's sectors
                        as it strikes; a wrong sector is a heavy blow
   It can be struck all through them; answered without a mistake it reels for a short exposed window. Phases (I 100-80, II 80-60, III
   60-40, IV 40-15, V 15-0) raise the pace. Tells are light only (no red, no numbers on the field: the HUD holds the timers); every timer
   is game time (frame-rate independent; held while the engine's time stops or another cinematic plays); every blow a deterministic
   volume (discs, rings swept between frames, cones, lines, sectors) matching what is drawn.
   CONTRACT (the same as SCORPIO_BOSS; scratchpad gemini/hooks.md): begin(X, H, self, A = { cx, cy, r, inside?, door? }), update(dt),
   drawGround(c) / drawOver(c), cam(), goal(), hideHud(), onBossDeath(m), active(), stop(), warm(), attach(X), floor, TUNE, MECH, test.
   window.__GB_NOBOSS = 1: begin() wins after a second (the gate's tests). Clean-up on stop, the defeat and the stage's end: every
   hazard, part and object, the music duck and the pet's statuses; RAZIEL_GL freed (gpuCount 0 after). */
const GEMINI_BOSS = (() => {
  const TAU = Math.PI * 2, PI = Math.PI, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
  const W0 = typeof window !== 'undefined' ? window : {};
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const LQ = () => (lowFx() ? 0.5 : 1);
  const GLR = () => (typeof RAZIEL_GL !== 'undefined' ? RAZIEL_GL : null);
  const FXP = () => (typeof RAZIEL_MOVES !== 'undefined' && RAZIEL_MOVES.FXP) || null;
  const NMv = () => (typeof NIDHOGG_MOVES !== 'undefined' ? NIDHOGG_MOVES : (typeof self !== 'undefined' ? self.NIDHOGG_MOVES : null));
  const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()) && W0.__GB_GL !== 0; } catch (e) { return false; } };
  const glOn = () => { const G = GLR(); try { return !!(G && G.ok()) && W0.__GB_GL !== 0; } catch (e) { return false; } };
  const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
  const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
  const COL = { fire: '#FF7A2E', hot: '#FFD9A0', gold: '#FFC24D', ice: '#7FD8FF', pale: '#DDF6FF', deep: '#2F6FE0', white: '#FFFFFF', steam: '#E4ECF2', plat: '#D9E2EE', goldM: '#E0B050', violet: '#C9B0FF', warn: '#FFE6A8' };
  const SKIN = { gold: '#E8B860', plat: '#C8D8F0', neut: '#E8DCC8' };

  /* ================= the tuning (every number a design choice; measured in tests/_gb-tune.js, see the report) =================
     An ordinary gate boss: health and the unit blow absolute, as the other gates' (Asmodeus 660000 in 36 bars, unit 19). A unit is
     ~9% of a reference eligible pet's health (the Gemini Gate opens after the Sepulchre, level 40: 560 health): ordinary blows
     0.5-1.5 units, heavy telegraphed 2-2.5, through the engine's hurtPet (defence, accessories, guards and dodges all apply).
     The two great judgements come back every big.every s (by phase), the first big.first s into the fight; a wrong answer costs
     hitK units (a heavy blow, nothing else); all right, it reels for big.expose s. VREF: the pet speed their placements are
     validated against (the pet runs 4.3 tiles/s; 3.4 leaves margin) */
  const TUNE = {
    hp: 2640000, bars: 36, dmg: 192,   // (v469b: the user found v469 far too easy: health and damage both x4, from 660000 / 48)
    size: 5.4, bodyR: 1.7, keep: 4.2, roam: 4.0, spd: [1.3, 1.4, 1.45, 1.6, 1.8],
    intro: 7.2, idle: [1.7, 1.5, 1.4, 1.25, 1.1], trans: 3.0,
    phaseAt: [1, 1, 0.8, 0.6, 0.4, 0.15],
    big: { first: 22, every: [40, 38, 34, 30, 27], expose: 3.5 },
    VREF: 3.4, HUB: 1.8,
    heal: 0.04, healCd: 1.4,
    // Opposing Heavens: the windows (s) of the three waves, wave 3's both-charging lead before the false head cancels, the
    // sanctuaries (each element, their radius, how far out), a wrong wave's blow (units)
    m1: { win: [5, 4, 3.5], lead3: 2.2, nSan: 2, sanR: 1.55, r0: 0.4, r1: 0.74, hitK: 2.4, gap: 1.6 },
    // Mirror Memory: the rule's announcement, each shown pattern (lit, gap), the pause before playback, the four windows, a wrong step's blow
    m2: { rule: 2.4, show: 1.25, gapS: 0.22, pause: 1.6, win: [4.5, 4.2, 3.9, 3.6], hitK: 2.0, res: 1.0 },
  };
  const MECH = [null,
    { id: 1, key: 'heavens', name: 'OPPOSING HEAVENS', tip: 'Take the opposite protection in a sanctuary.' },
    { id: 2, key: 'memory', name: 'MIRROR MEMORY', tip: 'Remember the lit sectors, then stand in them.' }];
  const PHN = [null, 'The Awakening of Twins', 'The War of Elements', 'The Fractured Revelation', 'The Collapse of Heaven', 'The Final Revelation'];
  const ROMAN = [null, 'I', 'II', 'III', 'IV', 'V'];
  // the heads' synchrony by phase (their aims converge; by Phase V one mind)
  const SYNC = [0, 0.12, 0.25, 0.45, 0.65, 1.0];
  let S = null;            // the fight in progress
  let VIEW = { X: null };  // the stage the arena belongs to (its far view is drawn before the fight starts)
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (S) stop(); VIEW.X = null; }); } catch (e) { /* (no Belfry hook) */ }

  /* ================= the arena: a circle (radius R) about (cx, cy); eight sectors (0 east, clockwise on the screen: 2 south, 4 west, 6 north) ================= */
  const AR = { cx: 21.5, cy: 15.5, R: 11, inside: null };
  const secA = i => i * PI / 4;
  const polar = (x, y) => { const dx = x - AR.cx, dy = y - AR.cy; return { r: Math.hypot(dx, dy), a: Math.atan2(dy, dx) }; };
  const secOf = (x, y) => { const p = polar(x, y); if (p.r < TUNE.HUB) return -1; return ((Math.round(p.a / (PI / 4)) % 8) + 8) % 8; };
  const at = (a, r) => ({ x: AR.cx + Math.cos(a) * r, y: AR.cy + Math.sin(a) * r });
  const inArena = (x, y, pad) => Math.hypot(x - AR.cx, y - AR.cy) <= AR.R - (pad || 0);
  const clampA = (x, y, pad) => { const dx = x - AR.cx, dy = y - AR.cy, d = Math.hypot(dx, dy), m = AR.R - (pad || 0); return d <= m ? { x, y } : { x: AR.cx + dx / d * m, y: AR.cy + dy / d * m }; };
  const fireSide = i => i >= 3 && i <= 5, iceSide = i => i === 7 || i === 0 || i === 1;
  // the fixed pieces (world tiles), laid from the arena at begin
  const GEO = { pylons: [], anchors: [], mirrors: [], portals: [], ringsOut: [] };
  function layGeo() {
    const R = AR.R;
    GEO.pylons = [{ a: 0, el: 'ice' }, { a: PI / 2, el: 'neut' }, { a: PI, el: 'fire' }, { a: -PI / 2, el: 'neut' }].map(p => Object.assign(at(p.a, R - 1.25), p));
    GEO.anchors = [{ a: 3 * PI / 4, el: 'fire' }, { a: -3 * PI / 4, el: 'fire' }, { a: PI / 4, el: 'ice' }, { a: -PI / 4, el: 'ice' }].map((p, i) => Object.assign(at(p.a, R * 0.7), p, { i, open: 0, glow: 0 }));
    GEO.mirrors = [{ el: 'fire', x: AR.cx - R * 0.47, y: AR.cy + R * 0.11 }, { el: 'ice', x: AR.cx + R * 0.47, y: AR.cy + R * 0.11 }].map((p, i) => Object.assign(p, { i, rot: i * 1.3, arm: 0, lit: 0 }));
    GEO.portals = [{ el: 'fire', a: PI * 0.83 }, { el: 'ice', a: PI * 0.17 }].map(p => Object.assign(at(p.a, R - 1.7), p, { glow: 0 }));
    GEO.ringsOut = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.2; GEO.ringsOut.push({ a, r: R + 1.4 + (i % 3) * 0.5, h: 0.6 + (i % 4) * 0.45, s: 0.8 + (i % 3) * 0.25, spin: (i % 2 ? -1 : 1) * (0.2 + 0.07 * (i % 3)), drift: 0 }); }
  }
  layGeo();

  /* ================= the land: the Equinox Sanctum's floor (painted once per tile into the engine's chunks) ================= */
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const RINGS = [1.8, 2.6, 4.4, 5.9, 6.5, 8.4, 9.6, 10.45];   // the floor's bands (tiles from the centre)
  function floorTile(c, X, Y, T, x, y) {
    c.save(); c.beginPath(); c.rect(X, Y, T + 0.5, T + 0.5); c.clip();
    const cx = X + (AR.cx - x) * T, cy = Y + (AR.cy - y) * T, mx = x + 0.5 - AR.cx, my = y + 0.5 - AR.cy, rm = Math.hypot(mx, my), am = Math.atan2(my, mx), west = cl(0.5 - mx / 6), R = AR.R;
    // the base: dark stone, warmed gold-bronze on the Infernal half and cooled to platinum on the Frozen half
    const base = rm > R + 0.3 ? '#06050C' : `rgb(${Math.round(lerp(30, 40, west))},${Math.round(lerp(34, 28, west))},${Math.round(lerp(48, 30, west))})`;
    c.fillStyle = base; c.fillRect(X, Y, T + 0.5, T + 0.5);
    let d0 = 1e9, d1 = 0; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const d = Math.hypot(x + a - AR.cx, y + b - AR.cy); d0 = Math.min(d0, d); d1 = Math.max(d1, d); } if (x <= AR.cx && x + 1 >= AR.cx && y <= AR.cy && y + 1 >= AR.cy) d0 = 0;
    // the plates: ring bands cut by angle, metal on alternate bands (gold west, platinum east), stone between
    for (let i = 0; i < RINGS.length - 1; i++) { const r0 = RINGS[i], r1 = RINGS[i + 1]; if (r1 < d0 - 0.1 || r0 > d1 + 0.1) continue; const metal = i % 2 === 1, n = Math.max(8, Math.round(TAU * (r0 + r1) / 2 / (metal ? 2.2 : 1.6))), off = hh(i, 3, 7);
      const span = 1.1 / Math.max(0.8, r0) + 0.15, j0 = Math.floor(((am - span) / TAU) * n - off) - 1, j1 = Math.ceil(((am + span) / TAU) * n - off) + 1;
      for (let j = j0; j <= j1; j++) { const a0 = (j + off) / n * TAU, a1 = (j + 1 + off) / n * TAU, jj = ((j % n) + n) % n, gap = 0.05 / (r0 + 0.6), aM = (a0 + a1) / 2, w2 = cl(0.5 - Math.cos(aM) * 0.75);
        c.beginPath(); c.arc(cx, cy, (r1 - 0.04) * T, a0 + gap, a1 - gap); c.arc(cx, cy, (r0 + 0.04) * T, a1 - gap, a0 + gap, true); c.closePath();
        const v = hh(i, jj, 3) * 0.12;
        if (metal) { const gR = lerp(150, 214, w2), gG = lerp(168, 158, w2), gB = lerp(196, 92, w2); c.fillStyle = `rgb(${Math.round(gR * (0.42 + v))},${Math.round(gG * (0.42 + v))},${Math.round(gB * (0.42 + v))})`; }
        else c.fillStyle = `rgb(${Math.round(lerp(36, 44, w2) * (1 + v))},${Math.round(lerp(40, 34, w2) * (1 + v))},${Math.round(lerp(56, 38, w2) * (1 + v))})`;
        c.fill();
        const px = cx + Math.cos(aM) * (r0 + r1) / 2 * T, py = cy + Math.sin(aM) * (r0 + r1) / 2 * T, g = c.createLinearGradient(px - T * 0.8, py - T * 0.8, px + T * 0.8, py + T * 0.8);
        g.addColorStop(0, metal ? 'rgba(255,240,210,.22)' : 'rgba(200,200,230,.08)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = g; c.fill();
        c.strokeStyle = 'rgba(4,3,8,.85)'; c.lineWidth = Math.max(1.2, T * 0.055); c.stroke();
        // engraved celestial lines on the metal bands: a star chart's arcs and ticks
        if (metal) { c.strokeStyle = w2 > 0.5 ? 'rgba(255,220,150,.32)' : 'rgba(210,230,255,.3)'; c.lineWidth = Math.max(0.7, T * 0.025); c.beginPath(); c.arc(cx, cy, ((r0 + r1) / 2) * T, a0 + gap * 3, a1 - gap * 3); c.stroke();
          for (let q = 1; q < 4; q++) { const aa = lerp(a0, a1, q / 4), rr = (r0 + r1) / 2; c.beginPath(); c.moveTo(cx + Math.cos(aa) * (rr - 0.16) * T, cy + Math.sin(aa) * (rr - 0.16) * T); c.lineTo(cx + Math.cos(aa) * (rr + 0.16) * T, cy + Math.sin(aa) * (rr + 0.16) * T); c.stroke(); } } } }
    // the heart: a disc of dark glass inside RINGS[0] with the Gemini emblem engraved
    if (d0 < RINGS[0] + 0.1) { c.fillStyle = '#100E1C'; c.beginPath(); c.arc(cx, cy, RINGS[0] * T, 0, TAU); c.fill(); c.strokeStyle = 'rgba(240,230,200,.5)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.arc(cx, cy, (RINGS[0] - 0.12) * T, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(240,230,210,.45)'; c.lineWidth = Math.max(1.2, T * 0.08); const s = T * 0.7; c.beginPath(); c.moveTo(cx - s * 0.62, cy - s * 0.7); c.quadraticCurveTo(cx, cy - s * 0.42, cx + s * 0.62, cy - s * 0.7); c.moveTo(cx - s * 0.62, cy + s * 0.7); c.quadraticCurveTo(cx, cy + s * 0.42, cx + s * 0.62, cy + s * 0.7); c.moveTo(cx - s * 0.3, cy - s * 0.55); c.lineTo(cx - s * 0.3, cy + s * 0.55); c.moveTo(cx + s * 0.3, cy - s * 0.55); c.lineTo(cx + s * 0.3, cy + s * 0.55); c.stroke(); }
    // the eight sector seams: deep grooves from the heart to the rim, brass inlay
    for (let k = 0; k < 8; k++) { const a = secA(k) + PI / 8, ux = Math.cos(a), uy = Math.sin(a), ox = x + 0.5 - AR.cx, oy = y + 0.5 - AR.cy, along = ox * ux + oy * uy, across = Math.abs(-ox * uy + oy * ux); if (along < RINGS[0] - 0.3 || along > R + 0.2 || across > 1.0) continue;
      c.strokeStyle = 'rgba(3,2,6,.95)'; c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.moveTo(cx + ux * RINGS[0] * T, cy + uy * RINGS[0] * T); c.lineTo(cx + ux * (R - 0.05) * T, cy + uy * (R - 0.05) * T); c.stroke();
      c.strokeStyle = 'rgba(232,200,140,.35)'; c.lineWidth = Math.max(0.8, T * 0.035); c.stroke(); }
    // the channels under the floor: Fire's (west) and Ice's (east) half-ring grooves, dark until the light runs in them
    if (Math.abs(rm - 6.15) < 1.2) { c.strokeStyle = 'rgba(2,1,4,.92)'; c.lineWidth = Math.max(2, T * 0.2); c.beginPath(); c.arc(cx, cy, 6.15 * T, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = Math.max(0.8, T * 0.04); c.beginPath(); c.arc(cx, cy, 6.27 * T, 0, TAU); c.stroke(); }
    // the rim: a raised band of dark metal, its lip catching the light
    if (d1 > R - 0.5 && d0 < R + 0.9) { c.strokeStyle = '#0C0A14'; c.lineWidth = T * 0.5; c.beginPath(); c.arc(cx, cy, (R + 0.05) * T, 0, TAU); c.stroke(); c.strokeStyle = west > 0.5 ? 'rgba(255,214,150,.45)' : 'rgba(205,225,255,.45)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.arc(cx, cy, (R - 0.18) * T, 0, TAU); c.stroke(); }
    // grit
    for (let k = 0; k < 6; k++) { const u = hh(x * 3 + k, y, 60), v = hh(x, y * 3 + k, 61); c.fillStyle = `rgba(0,0,0,${(0.15 + hh(x, y, 62 + k) * 0.25).toFixed(2)})`; c.fillRect(X + u * T, Y + v * T, Math.max(1, T * 0.02), Math.max(1, T * 0.02)); }
    c.restore();
  }
  try {
    const land = (name, o) => Object.assign({ name, rift: true, tile: 'heaven', out: false, dark: 0, bg: '#05040B', gap: 'equinoxsky', ambient: 'motes', accent: COL.gold, light: '#FFF0D8', hazard: 'holy', grade: null, fog: '#05040B', darkRGB: '5,4,11', props: [], deco: COL.gold, mud: ['#2A2632', '#201C28'] }, o);
    BIOMES.equinox = land('The Equinox Sanctum', { floorFn: (c, X, Y, T, h, h2, x, y) => floorTile(c, X, Y, T, x, y), cliffTint: () => {}, floor: ['#26222E', '#26222E', '#26222E'], grout: '#08060C', hi: '#5A5468', top: '#2E2A38', face: '#2E2A38', faceD: '#0C0A12', cliff: '#1A1622', bridgeCol: '#2E2A38' });
    if (!BIOME_ORDER.includes('equinox')) BIOME_ORDER.push('equinox'); if (typeof DARK_COL !== 'undefined') DARK_COL.equinox = '5,4,11';
  } catch (e) { /* (no world engine: tests of the module alone) */ }

  /* ================= the far view: empty. Behind the Equinox Sanctum only the void's plain dark (v469, the user: no clouds, nothing
     that appears or switches); the gate's own backdrop darkens to the same colour north of its door (20s3, world-anchored), so the
     walk in is seamless ================= */
  const VOID = '#05040C';
  try { W0.GAP_EXT = W0.GAP_EXT || {};
    W0.GAP_EXT.equinoxsky = { base: VOID, paint(c, Sz) { c.fillStyle = VOID; c.fillRect(0, 0, Sz, Sz); }, back(c, o) { c.fillStyle = VOID; c.fillRect(0, 0, o.W, o.H); } };
  } catch (e) { /* (no window) */ }

  /* ================= begin: the door has sealed; the fight starts ================= */
  function attach(X) { VIEW.X = X || null; }
  function begin(X, H, self, A) {
    if (S) stop();
    const g = X.g, me = X.me; A = A || {}; VIEW.X = X;
    AR.cx = A.cx != null ? A.cx : me.x; AR.cy = A.cy != null ? A.cy : me.y - 8; AR.R = Math.max(7, Math.min(13, A.r || Math.min(A.rx || 11, A.ry || 11)));
    AR.inside = typeof A.inside === 'function' ? A.inside : null; layGeo();
    if (W0.__GB_NOBOSS === 1) { X.banner('THE TRIAL OF TWO HEAVENS', 'Skipped (test)', COL.gold, 1.5, true); X.after(1.0, () => { try { X.winStage(); } catch (e) {} }); return null; }
    const hp = TUNE.hp, home = { x: AR.cx, y: AR.cy - 0.6 };
    const m = { type: 'boss', boss: 'gbraziel', fiend: 'gbraziel', gbBoss: true, bk: { id: 'gbraziel', name: 'Raziel', title: 'The Twin Revelation', ai: 'gbraziel', spd: 1 }, mini: false, lesser: false, bname: 'Raziel',
      x: home.x, y: home.y, r: TUNE.bodyR, hp, maxhp: hp, spd: 1, dmg: TUNE.dmg, xp: 400, color: '#2A2030', glow: COL.gold, aggro: true, act: 'enter', actT: 0, phase: 1, cd: 9, z: 0, t: 0, flash: 0, burn: 0, burnD: 0, venom: 0, venomT: 0,
      chill: 0, freeze: 0, stun: 0, kbx: 0, kby: 0, atkCd: 0, mv: 2, hitSq: 0, ph: 0, wob: 0, face: 1, step: 0, flank: 0, still: true, landed: true, noTouch: true };
    const G = GLR(), P = G && G.idle ? G.idle(7, 0) : {}; P.evo = 7; P.enter = 0; P.fly = 1; P.wing = 0.25; P.crownOut = 1; P.x = m.x; P.y = m.y;
    S = { X, H, self, g, me, m, A, P, mode: 'intro', t: 0, introT: 0, phase: 1, dmgK: 1, freqK: 1, bigT: TUNE.big.first, bigN: 0,
      mech: null, trans: null, vuln: null, dead: null, acts: [], haz: [], fx: [], idleT: 1.5, pick: 0, cyc: 0, objs: [], parts: [], lastG: null, heldDt: 0,
      B: { x: m.x, y: m.y, vx: 0, vy: 0, at: 0, alpha: 1, fly: 1, flyT: 1, face: 1.98, aimL: { x: m.x, y: m.y + 4 }, aimR: { x: m.x, y: m.y + 4 }, look: 0, obs: 1, A: null },
      prot: null, protT: 0, burn: 0, burnTk: 0, healAcc: 0, healCd: 0, lastM: hp, duck: 0, musT: 0, musN: 0, envK: 1,
      stat: { t0: g.t, dmgIn: 0, hits: {}, big: {}, miss: 0, clean: 0, phaseAt: {}, ordHits: 0, maxHaz: 0 } };
    X.mons.push(m); g.boss = m; g.bossShow = null; g.shownBoss = true; g.bossIntro = TUNE.intro;
    m.ownBar = (c, W) => safeHud(c, W); m.goalFn = () => goalText(); m.guardFn = (mm, o) => guard(mm, o);
    if (H && H.obj) {
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: -1e5, kind: 'gbGround', r: 0, label: '', draw: c => safeDraw(c, drawGroundLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: -1e5 + 1, kind: 'gbPropsN', r: 0, label: '', draw: c => safeDraw(c, cc => drawProps(cc, false)) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 0.25, kind: 'gbBody', r: 0, label: '', draw: c => safeDraw(c, drawBodyLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 1e5 - 1, kind: 'gbPropsS', r: 0, label: '', draw: c => safeDraw(c, cc => drawProps(cc, true)) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 1e5, kind: 'gbSky', r: 0, label: '', draw: c => safeDraw(c, drawSkyLayer) }));
    }
    S.cine = false; sfx('hum'); note(55, 3.0, 'sine', 0.22); note(82.4, 3.0, 'sine', 0.12, null, 0.4);
    try { if (G && glOn()) G.warm(); } catch (e) {}
    clearPet();
    return m;
  }
  const sfx = (k, ...a) => { const s = S && S.X.sfx; if (s && s[k]) try { s[k](...a); } catch (e) { /* no sound */ } };
  const note = (f, d, ty, v, f1, dl) => { try { const s = S && S.X.sfx; if (s && s.note) s.note(f, d, ty, v, f1, dl); } catch (e) { /* no sound */ } };
  // the two minds' voices: Lux low brass and drum, Umbra glass bells; a mechanic's call, its success, its failure, a blow's warning
  const cue = {
    lux: k => { note(98 * (k || 1), 0.55, 'sawtooth', 0.045, 92 * (k || 1)); note(147 * (k || 1), 0.45, 'square', 0.025, null, 0.05); note(55, 0.3, 'sine', 0.16); },
    umbra: k => { note(1318 * (k || 1), 0.6, 'triangle', 0.045); note(1976 * (k || 1), 0.5, 'sine', 0.03, null, 0.06); note(2637 * (k || 1), 0.4, 'sine', 0.015, null, 0.12); },
    cancel: () => { note(880, 0.5, 'triangle', 0.05, 330); note(220, 0.5, 'sine', 0.06, 110); },
    mech: () => { note(392, 0.5, 'triangle', 0.06); note(587, 0.6, 'triangle', 0.05, null, 0.12); note(784, 0.8, 'sine', 0.05, null, 0.24); sfx('hum'); },
    pass: () => { [523, 659, 784, 1047].forEach((f, i) => note(f, 0.5, 'sine', 0.06, null, i * 0.09)); },
    fail: () => { note(466, 0.7, 'sawtooth', 0.04, 233); note(330, 0.9, 'triangle', 0.05, 165, 0.1); sfx('crash'); },
    step: n => { note([523, 659, 784, 988][n % 4], 0.45, 'triangle', 0.06); note([1047, 1318, 1568, 1976][n % 4], 0.35, 'sine', 0.03, null, 0.04); },
    tick: () => note(1568, 0.08, 'square', 0.02),
    align: () => { note(1760, 0.18, 'sine', 0.06); note(2349, 0.25, 'sine', 0.04, null, 0.05); },
  };
  const ST = () => { try { return S.X.ST(); } catch (e) { return null; } };
  const U = () => S.m.dmg * S.dmgK;

  /* ================= the step ================= */
  function update(dt) {
    if (!S) return; const g = S.g; if (S.lastG === g.t) return; S.lastG = g.t;
    dt = Math.min(0.25, Math.max(0, dt || 0)); const m = S.m;
    // held: the engine's time stopped, or another cinematic (a pet's ultimate): the whole encounter waits (its timers in game time)
    const held = g.stopT > 0 || (g.cineT > 0 && !S.cine) || g.hitStop > 0, da = held ? 0 : dt;
    S.heldDt = da; S.t += da; S.B.at += dt;
    if (S.mode !== 'over' && m.dead && S.mode !== 'dead') { if (S.mode === 'intro') { m.dead = false; m.hp = Math.max(1, S.lastM || 1); } else { startDefeat(); } }
    if (S.mode === 'intro') introTick(da);
    else if (S.mode === 'fight') fightTick(da);
    else if (S.mode === 'trans') transTick(da);
    else if (S.mode === 'mech') mechTick(da);
    else if (S.mode === 'dead') deadTick(dt);
    if (!S || S.mode === 'over') return;
    if (S.mode === 'intro' && m.hp < S.lastM) m.hp = S.lastM;   // (nothing lands while it wakes)
    S.lastM = m.hp;
    hazTick(da); fxTick(da); petTick(da); musicTick(da);
    poseTick(dt);
    for (const o of S.objs) { o.x = m.x; o.y = m.y; }
    if (S.cine) g.cineT = Math.max(g.cineT || 0, 0.05);
    S.stat.maxHaz = Math.max(S.stat.maxHaz, S.haz.length);
  }
  // the engine asks every blow on its body: an ordinary boss, struck freely; only the awakening and the fall are untouchable
  function guard(mm, o) { if (!S || mm !== S.m) return 1; return S.mode === 'intro' || S.mode === 'dead' ? 0 : 1; }
  const realK = () => (S ? S.m.hp / S.m.maxhp : 1);

  /* ---- the intro: suspended over the emblem, the crowns descend, Lux wakes in flame, Umbra in a blizzard, the wings unfold, it lands and roars ---- */
  function introTick(da) {
    const t0 = S.introT; S.introT += da; const t = S.introT, X = S.X, cross = x => t0 < x && t >= x, m = S.m;
    if (cross(0.3)) { X.banner('THE TRIAL OF TWO HEAVENS', 'The Equinox Sanctum', COL.gold, 2.4, true, true); }
    if (cross(1.6)) { fx('erupt', { x: m.x - 1.2, y: m.y, R: 3.2, life: 1.6 }); cue.lux(); X.shake(6, 0.4); sfx('whoosh'); }
    if (cross(2.6)) { fx('blizzard', { x: m.x + 1.2, y: m.y, R: 3.2, life: 1.8 }); cue.umbra(); X.shake(5, 0.4); }
    if (cross(4.6)) { sfx('thud'); X.shake(14, 0.6); fx('land', { x: m.x, y: m.y, R: 6.5, life: 1.2 }); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.05); }
    if (cross(5.3)) { X.banner('RAZIEL', 'The Twin Revelation', COL.white, 2.6, true, true); cue.lux(); cue.umbra(); sfx('crash'); X.flash(0.2, '#FFF2D8'); X.shake(10, 0.6); }
    if (t >= TUNE.intro) { S.g.bossIntro = 0; S.m.act = 'fight'; S.mode = 'fight'; S.idleT = 1.2; S.bigT = TUNE.big.first; S.stat.phaseAt[1] = S.t; say('PHASE I', 'Raziel · ' + PHN[1], COL.gold, 2.0); }
  }

  /* ---- ordinary combat: its rotation of blows, and every so often one of its two great judgements (Opposing Heavens, Mirror Memory) ---- */
  function fightTick(da) {
    const m = S.m, me = S.me, X = S.X;
    const took = Math.max(0, S.lastM - m.hp);
    // healing light shaken loose by blows (as the other gates' bosses)
    S.healAcc += took; S.healCd -= da;
    if (S.healAcc > m.maxhp / TUNE.bars * TUNE.heal && S.healCd <= 0) { S.healAcc = 0; S.healCd = TUNE.healCd; const an = Math.random() * 6.283, x =   /* (any side of it: a pet that never moves does not drink them all) */ m.x + Math.cos(an) * (m.r + 0.8), y = m.y + Math.sin(an) * (m.r + 0.8); X.drop('hp', x, y); if (Math.random() < 0.4) X.drop('mp', x, y); }
    if (S.vuln) { const V = S.vuln; V.t += da; m.stunT = Math.max(0.001, V.dur - V.t); if (V.t >= V.dur) endVuln(); }
    const f = realK(), want = f <= TUNE.phaseAt[5] ? 5 : f <= TUNE.phaseAt[4] ? 4 : f <= TUNE.phaseAt[3] ? 3 : f <= TUNE.phaseAt[2] ? 2 : 1;
    if (!S.vuln && want > S.phase) { startTrans(S.phase + 1); return; }
    if (me.dead) { S.idleT = Math.max(S.idleT, 1.2); return; }
    if (S.vuln) { roam(da, 0); return; }
    actsTick(da); S.bigT -= da;
    if (!S.acts.length) { if (S.bigT <= 0 && !S.noBig) { startBig(); return; } S.idleT -= da; if (S.idleT <= 0) { pickAct(); } }
    roam(da, S.acts.some(A => A.plant) ? 0 : 1);
  }
  function startVuln(dur, why) { const m = S.m; if (!(dur > 0)) return; S.vuln = { t: 0, dur, why: why || '' }; m.stunT = dur; m.act = 'stunned'; m.flinch = 1; S.X.text(m.x, m.y - TUNE.size * 0.75, why || 'Exposed!', COL.white, 16, { crit: true, life: 1.2 }); }
  function endVuln() { const m = S.m; S.vuln = null; m.stunT = 0; m.act = 'fight'; S.idleT = Math.max(S.idleT, 1.0); }

  /* ---- phase transitions (a roar; it can still be struck) ---- */
  function startTrans(ph) {
    abortActs(); S.mode = 'trans'; S.trans = { ph, t: 0 }; S.phase = ph; S.m.phase = ph; S.stat.phaseAt[ph] = S.t; const X = S.X;
    X.banner(`PHASE ${ROMAN[ph]}`, `Raziel · ${PHN[ph]}`, ph === 5 ? COL.white : ph % 2 ? COL.gold : COL.ice, 2.4, true, true);
    X.flash(0.25, ph % 2 ? '#FFE8C8' : '#DDF0FF'); X.shake(12, 0.6); sfx('hum');
    if (ph === 2) { cue.lux(1.12); X.after(0.6, () => S && cue.umbra(0.94)); }
    if (ph === 3) { note(220, 1.2, 'sawtooth', 0.04, 233); note(233, 1.2, 'sawtooth', 0.035, 220); }
    if (ph === 4) { cue.lux(0.9); cue.umbra(1.06); }
    if (ph === 5) { cue.lux(1); cue.umbra(1); note(65.4, 3, 'sine', 0.2); }
    for (let i = 0; i < 3; i++) S.X.drop(i % 2 ? 'mp' : 'hp', S.m.x + (Math.random() - 0.5) * 4, S.m.y + 2.5 + Math.random() * 2);
    fx('roarwave', { x: S.m.x, y: S.m.y, R: 9, life: 1.3, ph });
  }
  function transTick(da) { const T = S.trans; T.t += da; if (T.t >= TUNE.trans) { S.trans = null; S.mode = 'fight'; S.idleT = 0.8; S.bigT = Math.max(S.bigT, 6); } }

  /* ---- the two great judgements, woven into the rotation: Opposing Heavens from the start, Mirror Memory alternating with it from
     Phase II; they come back every TUNE.big.every s (by phase). Raziel can be struck all through them. A wrong answer costs a heavy blow
     (nothing else: no score is kept); every answer right and it reels for a short exposed window ---- */
  function startBig() { const id = S.phase < 2 ? 1 : S.lastBig === 2 ? 1 : 2; S.bigN++; S.lastBig = id; startMech(id); }
  function startMech(id) {
    abortActs(); clearPet(true); const X = S.X, M = MECH[id];
    S.mode = 'mech'; S.mech = { id, t: 0, stage: 'prep', st: 0, data: {}, miss: 0 }; S.stat.big[id] = (S.stat.big[id] || 0) + 1;
    X.banner(M.name, M.tip, COL.warn, 2.2, true); cue.mech();
    try { MI[id].start(S.mech); } catch (e) { if (typeof console !== 'undefined') console.error(e); endMech(); }
  }
  function mechTick(da) { const Mx = S.mech; if (!Mx) { S.mode = 'fight'; return; } Mx.t += da; let done = false; try { done = MI[Mx.id].tick(Mx, da); } catch (e) { if (typeof console !== 'undefined') console.error(e); done = true; } if (done && S && S.mech === Mx) endMech(); }
  // a wrong answer: a heavy blow through the engine's own hurt (its defence and guards apply), and nothing more
  function miss(Mx, k, el, why) { Mx.miss++; S.stat.miss = (S.stat.miss || 0) + 1; const me = S.me, inv0 = me.inv; me.inv = 0; const ok = hurt(k, { el: el || 'fire' }); if (!ok) me.inv = inv0; S.X.text(me.x, me.y - 1.8, why || 'Struck', COL.warn, 14, { life: 1.2 }); }
  function endMech() {
    if (!S) return; const Mx = S.mech, ok = Mx && !Mx.miss;
    try { if (Mx && MI[Mx.id].end) MI[Mx.id].end(Mx, ok); } catch (e) { if (typeof console !== 'undefined') console.error(e); }
    S.mech = null; if (S.mode !== 'mech') return; S.mode = 'fight'; S.idleT = 1.4; S.bigT = TUNE.big.every[S.phase - 1] * (0.9 + 0.2 * Math.random());
    if (ok) { S.stat.clean = (S.stat.clean || 0) + 1; cue.pass(); startVuln(TUNE.big.expose, 'Exposed!'); }
  }


  /* ================= the pet: protection, Burning, Frost ================= */
  function clearPet(soft) { if (!S) return; const me = S.me; S.prot = null; S.burn = 0; if (me && me.chill > 0) me.chill = 0; if (!soft) S.protT = 0; }
  function burnPet(t) { if (S.mode === 'mech') return; S.burn = Math.max(S.burn, t); }
  function chillPet(t) { if (S.mode === 'mech') return; const me = S.me; me.chill = Math.max(me.chill || 0, t); }
  function petTick(da) {
    if (!(da > 0)) return; const me = S.me; S.protT = Math.max(0, S.protT - da);
    if (S.burn > 0 && !me.dead) { S.burn -= da; S.burnTk -= da; if (S.burnTk <= 0) { S.burnTk = 0.5; const inv0 = me.inv; hurt(0.12, { dot: true, dotC: COL.fire, el: 'fire' }); me.inv = inv0; if (Math.random() < 0.5) S.X.part({ kind: 'ember', x: me.x + (Math.random() - 0.5) * 0.5, y: me.y - 0.4, vx: 0, vy: -1.2, life: 0.7, max: 0.7, size: 3, color: COL.fire }); } }
  }
  // a blow on the pet (k units); returns whether it landed
  function hurt(k, o) { const me = S.me, before = me.hp; let ok = false; try { ok = S.X.hurtPet(U() * k, S.m, o || {}); } catch (e) { ok = false; } if (ok) { S.stat.dmgIn += Math.max(0, before - me.hp); if (!(o && o.dot)) S.stat.ordHits++; } return ok; }

  /* ================= hazards: the deterministic volumes behind every blow =================
     { kind: 'disc' | 'ring' | 'cone' | 'line' | 'sector' | 'cross' , x, y, ..., tell (s lit before), act (s active), t, el ('fire' | 'ice' | 'steam' | 'white'),
       k (units a hit), tick (0 once, else s between hits while inside), status, crit (a mechanic's id: a hit there is its failure), cosmetic } */
  function haz(o) { const h = Object.assign({ t: 0, tell: 1, act: 0.3, fade: 0.5, el: 'fire', k: 1, tick: 0, hitT: -9, hit: false, seed: Math.random() * 50 }, o); S.haz.push(h); return h; }
  const petIn = (h, x, y) => {
    const me = S.me, pr = me.r * 0.6;
    switch (h.kind) {
      case 'disc': return Math.hypot(x - h.x, y - h.y) < h.r + pr;
      case 'cone': { const dx = x - h.x, dy = y - h.y, d = Math.hypot(dx, dy); if (d > h.len + pr || d < (h.r0 || 0)) return false; return Math.abs(angD(Math.atan2(dy, dx), h.a)) < h.half + pr / Math.max(0.5, d); }
      case 'line': { const ux = Math.cos(h.a), uy = Math.sin(h.a), dx = x - h.x, dy = y - h.y, al = dx * ux + dy * uy; if (al < -(h.back || 0) - pr || al > h.len + pr) return false; return Math.abs(-dx * uy + dy * ux) < h.w / 2 + pr; }
      case 'cross': { for (const a of [h.a, h.b]) { const ux = Math.cos(a), uy = Math.sin(a), dx = x - h.x, dy = y - h.y; if (Math.abs(-dx * uy + dy * ux) < h.w / 2 + pr && Math.hypot(dx, dy) < h.len) return true; } return false; }
      case 'bolt': return h.t > h.tell && segD(x, y, { x: h.px, y: h.py }, { x: h.x, y: h.y }) < h.r + pr;
      case 'sector': { const s = secOf(x, y), p = polar(x, y); if (s < 0) return !!h.hub; return !!(h.mask & (1 << s)) && p.r >= (h.rIn || 0) && p.r <= (h.rOut || 99); }
      default: return false;
    }
  };
  // a ring's front swept between two frames: did it pass over the pet (outside its gap)
  function ringHit(h, r0, r1) { const me = S.me, d = Math.hypot(me.x - h.x, me.y - h.y), w = h.w / 2 + me.r * 0.5; if (!(d + w >= r0 && d - w <= r1)) return false; if (h.gap != null) { const a = Math.atan2(me.y - h.y, me.x - h.x); if (Math.abs(angD(a, h.gap)) < h.gapW) return false; } return true; }
  function hazTick(da) {
    const me = S.me;
    for (let i = S.haz.length - 1; i >= 0; i--) { const h = S.haz[i], t0 = h.t; h.t += da; const t = h.t;
      if (h.upd) try { h.upd(h, da); } catch (e) {}
      const on = t >= h.tell && t <= h.tell + h.act && !h.cosmetic;
      if (h.kind === 'ring' && t > h.tell) { const u0 = cl((t0 - h.tell) / h.act), u1 = cl((t - h.tell) / h.act), r0 = h.r0 + (h.r1 - h.r0) * u0, r1 = h.r0 + (h.r1 - h.r0) * u1; h.R = r1;
        if (!h.hit && !h.cosmetic && !me.dead && u0 < 1 && ringHit(h, r0, r1)) { h.hit = true; landHaz(h); } }
      else if (on && !me.dead && petIn(h, me.x, me.y) && (h.tick > 0 ? t - h.hitT >= h.tick : !h.hit)) { h.hitT = t; h.hit = true; landHaz(h); }
      if (t0 < h.tell && t >= h.tell && h.onFire) try { h.onFire(h); } catch (e) {}
      if (t >= h.tell + h.act + h.fade) { if (h.onEnd) try { h.onEnd(h); } catch (e) {} S.haz.splice(i, 1); } }
  }
  function landHaz(h) {
    const me = S.me; if (me.dodge && !h.noDodge) return;   // (a roll carries the pet through: the engine's own rule)
    const ok = hurt(h.k, { el: h.el === 'ice' ? 'frost' : 'fire' }); if (!ok) return;
    if (h.el === 'fire' || h.status === 'burn') burnPet(2.5); if (h.el === 'ice' || h.status === 'frost') chillPet(h.chill || 1.4);
  }

  /* ================= effects (pictures only, world tiles) ================= */
  function fx(kind, o) { const f = Object.assign({ kind, t: 0, life: 1, seed: Math.random() * 50 }, o); S.fx.push(f); if (S.fx.length > 60) S.fx.shift(); return f; }
  function fxTick(da) { for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += da || 0; if (f.t >= f.life) S.fx.splice(i, 1); } }

  /* ================= movement: it holds the middle, leaning toward the pet, keeping its distance ================= */
  function roam(da, k) {
    if (!(da > 0)) return; const m = S.m, me = S.me, B = S.B;
    let tx = AR.cx, ty = AR.cy - 0.6;
    if (k > 0 && !me.dead) { const vx = me.x - AR.cx, vy = me.y - AR.cy, vd = Math.hypot(vx, vy) || 1, ln = Math.min(TUNE.roam, vd * 0.4); tx = AR.cx + vx / vd * ln; ty = AR.cy - 0.6 + vy / vd * ln;
      const ex = tx - me.x, ey = ty - me.y, e = Math.hypot(ex, ey) || 1; if (e < TUNE.keep) { tx = me.x + ex / e * TUNE.keep; ty = me.y + ey / e * TUNE.keep; } }
    if (S.goTo) { tx = S.goTo.x; ty = S.goTo.y; }
    const p = clampA(tx, ty, 2.2), dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy), sp = TUNE.spd[S.phase - 1] * (k > 0 || S.goTo ? 1 : 0.4), want = d > 0.25 ? Math.min(sp, d * 1.3) : 0, acc = Math.min(1, da * 2.5);
    B.vx += ((d > 0.25 ? dx / d * want : 0) - B.vx) * acc; B.vy += ((d > 0.25 ? dy / d * want : 0) - B.vy) * acc;
    const q = clampA(m.x + B.vx * da, m.y + B.vy * da, 2.0); m.x = q.x; m.y = q.y;
    easeOut();
  }
  // it is passed round, not through (while it stands on the floor)
  function easeOut() { const me = S.me, m = S.m; if (me.dead || me.leap || S.B.fly > 0.35) return; const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy), r0 = m.r; if (d < r0 && d > 1e-4) S.X.moveEnt(me, dx / d * (r0 - d) * 0.6, dy / d * (r0 - d) * 0.6, 0); }

  /* ================= ordinary attacks (phase I: 5; phase II adds 5; III a lighter pressure; IV and V combine them) ================= */
  const CYC = {
    1: ['infernal', 'talon', 'cryo', 'tail', 'fang', 'infernal', 'cryo', 'talon', 'fang', 'tail'],
    2: ['eruption', 'cryo', 'zero', 'guillotine', 'meteor', 'infernal', 'steam', 'talon', 'eruption', 'fang', 'zero', 'tail', 'meteor', 'guillotine'],
    3: ['infernal', 'talon', 'meteor', 'cryo', 'tail', 'zero'],
    4: ['meteor', 'guillotine', 'fang', 'eruption', 'zero', 'tail', 'steam', 'infernal', 'talon', 'cryo', 'guillotine', 'fang'],
    5: ['fang', 'guillotine', 'tail', 'meteor', 'zero', 'eruption', 'fang', 'talon', 'steam', 'guillotine', 'infernal', 'cryo'] };
  function pickAct() {
    const L = CYC[S.phase] || CYC[1]; let k = L[S.pick % L.length]; S.pick++;
    const me = S.me, m = S.m, d = Math.hypot(me.x - m.x, me.y - m.y);
    if ((k === 'tail' || k === 'talon') && d > 7.5) k = 'infernal';   // (a close blow for a pet that crowds it; at range it breathes)
    startAct(k);
    S.idleT = TUNE.idle[S.phase - 1] * S.freqK;
  }
  function abortActs() { for (const A of S.acts) { if (A.hz) for (const h of A.hz) { const i = S.haz.indexOf(h); if (i >= 0 && h.t < h.tell) S.haz.splice(i, 1); } } S.acts.length = 0; S.goTo = null; }
  function actsTick(da) { for (let i = S.acts.length - 1; i >= 0; i--) { const A = S.acts[i], t0 = A.t; A.t += da; let done = false; try { done = A.tick(A, t0, A.t); } catch (e) { done = true; } if (done || A.t > (A.max || 12)) S.acts.splice(i, 1); } }
  const P5 = () => S.phase >= 5, P4 = () => S.phase >= 4;
  // a world point for a head: Lux on its own left (screen left), Umbra on its right; gameplay origins (the visuals start from the real mouths)
  const headW = side => ({ x: S.m.x + (side === 'L' ? -1 : 1) * TUNE.size * 0.22, y: S.m.y + 0.5 });
  function startAct(kind) {
    const m = S.m, me = S.me, X = S.X, A = { kind, t: 0, hz: [], plant: true, side: null };
    const aimAt = (side, x, y) => { const B = S.B; if (side === 'L' || side === 'both') { B.aimL.x = x; B.aimL.y = y; } if (side === 'R' || side === 'both') { B.aimR.x = x; B.aimR.y = y; } };
    const big = P5() ? 1.2 : 1;
    switch (kind) {
      case 'infernal': {   // Lux sweeps a wide cone of fire across the pet's side: lit first, then the stream follows the lit fan
        const o = headW('L'), a = Math.atan2(me.y - o.y, me.x - o.x), dir = Math.random() < 0.5 ? 1 : -1, a0 = a - dir * 0.85, a1 = a + dir * 0.85, len = 8.5 * big;
        A.side = 'L'; cue.lux();
        const h = haz({ kind: 'cone', x: o.x, y: o.y, a: a0, half: 0.32, len, tell: 1.0, act: 1.5, fade: 0.4, el: 'fire', k: 0.55, tick: 0.3, a0, a1, src: 'L', vis: 'breathF',
          upd: (h2) => { if (h2.t > h2.tell) { const u = cl((h2.t - h2.tell) / h2.act); h2.a = lerp(h2.a0, h2.a1, u); } } });
        // the tell: the whole fan the stream will cross, lit while it charges
        haz({ kind: 'cone', x: o.x, y: o.y, a: (a0 + a1) / 2, half: 0.85 + 0.32, len, tell: 1.0, act: 0, fade: 0.2, cosmetic: true, el: 'fire', vis: 'tell' });
        A.hz.push(h); A.tick = (A2, t0, t) => { const u = cl((t - 1.0) / 1.5); const aa = t < 1 ? a0 : lerp(a0, a1, u); aimAt('L', o.x + Math.cos(aa) * len * 0.7, o.y + Math.sin(aa) * len * 0.7); A2.chargeL = sstep(0, 1.0, t) * (1 - sstep(2.5, 2.9, t)); A2.jawL = sstep(0.8, 1.05, t) * (1 - sstep(2.4, 2.8, t)); if (P4() && t0 < 1.2 && t >= 1.2) secondary(A2); return t > 3.0; };
        if (P5()) { S.B.aimR.x = me.x; S.B.aimR.y = me.y; }
        break; }
      case 'cryo': {   // Umbra a concentrated freezing beam on the pet's place (locked a moment before)
        A.side = 'R'; cue.umbra(); const o = headW('R');
        const h = haz({ kind: 'line', x: o.x, y: o.y, a: 0, len: 13, w: 1.15, tell: 1.05, act: 0.85, fade: 0.35, el: 'ice', k: 0.6, tick: 0.25, chill: 1.8, src: 'R', vis: 'breathI',
          upd: h2 => { if (h2.t < h2.tell - 0.3) h2.a = Math.atan2(S.me.y - h2.y, S.me.x - h2.x); } });
        A.hz.push(h); A.tick = (A2, t0, t) => { aimAt('R', h.x + Math.cos(h.a) * 6, h.y + Math.sin(h.a) * 6); A2.chargeR = sstep(0, 1.05, t) * (1 - sstep(1.9, 2.2, t)); A2.jawR = sstep(0.9, 1.1, t) * (1 - sstep(1.8, 2.1, t)); return t > 2.3; };
        break; }
      case 'talon': {   // a claw raised, then slammed before it: two rings, fire then ice
        const a = Math.atan2(me.y - m.y, me.x - m.x), p = clampA(m.x + Math.cos(a) * 2.2, m.y + Math.sin(a) * 2.2, 1), R1 = 7.5 * big; cue.lux(0.8);
        haz({ kind: 'disc', x: p.x, y: p.y, r: 1.6, tell: 1.15, act: 0.15, fade: 0.4, el: 'white', k: 1.3, vis: 'slam' });
        haz({ kind: 'ring', x: p.x, y: p.y, r0: 1.2, r1: R1, w: 0.7, tell: 1.25, act: 1.2, fade: 0.2, el: 'fire', k: 1.0, vis: 'ringF' });
        haz({ kind: 'ring', x: p.x, y: p.y, r0: 1.2, r1: R1, w: 0.7, tell: 1.75, act: 1.2, fade: 0.2, el: 'ice', k: 0.9, chill: 1.2, vis: 'ringI' });
        if (P5()) haz({ kind: 'ring', x: p.x, y: p.y, r0: 1.2, r1: R1 * 1.2, w: 0.7, tell: 2.4, act: 1.3, fade: 0.2, el: 'white', k: 0.8, vis: 'ringW' });
        A.claw = p; A.tick = (A2, t0, t) => { A2.raiseK = sstep(0, 0.9, t) * (1 - sstep(1.1, 1.3, t)); if (t0 < 1.25 && t >= 1.25) { S.X.shake(10, 0.35); sfx('thud'); } return t > 2.2; };
        break; }
      case 'tail': {   // it turns its whole body: the segmented tail sweeps a wide arc round it (the arc and its direction shown first)
        const a = Math.atan2(me.y - m.y, me.x - m.x), dir = Math.random() < 0.5 ? 1 : -1, len = 6.8 * big;
        const h = haz({ kind: 'cone', x: m.x, y: m.y, a: a - dir * 1.2, half: 0.42, len, r0: 0.6, tell: 1.1, act: 0.9, fade: 0.3, el: 'white', k: 1.2, a0: a - dir * 1.2, a1: a + dir * 1.6, vis: 'tail',
          upd: h2 => { h2.x = S.m.x; h2.y = S.m.y; if (h2.t > h2.tell) h2.a = lerp(h2.a0, h2.a1, cl((h2.t - h2.tell) / h2.act)); } });
        haz({ kind: 'cone', x: m.x, y: m.y, a: a + dir * 0.2, half: 1.4 + 0.42, len, tell: 1.1, act: 0, fade: 0.2, cosmetic: true, el: 'white', vis: 'tell', dir });
        A.hz.push(h); A.spin = dir; A.tick = (A2, t0, t) => { A2.spinK = t > 1.0 ? sstep(1.0, 2.0, t) : 0; if (P5() && t0 < 2.0 && t >= 2.0) haz({ kind: 'ring', x: S.m.x, y: S.m.y, r0: 1, r1: 6, w: 0.6, tell: 0, act: 0.9, fade: 0.2, el: dir > 0 ? 'fire' : 'ice', k: 0.7, vis: dir > 0 ? 'ringF' : 'ringI' }); return t > 2.3; };
        break; }
      case 'fang': {   // Twin Fang Protocol: both heads cross their streams on a point by the pet; the crossing bursts in Thermal Shock
        const px = me.x + (Math.random() - 0.5) * 1.2, py = me.y + (Math.random() - 0.5) * 1.2, oL = headW('L'), oR = headW('R'), Rb = 2.4 * big; cue.lux(); cue.umbra();
        A.side = 'both';
        haz({ kind: 'line', x: oL.x, y: oL.y, a: Math.atan2(py - oL.y, px - oL.x), len: Math.hypot(px - oL.x, py - oL.y), w: 0.8, tell: 1.0, act: 0.7, fade: 0.3, el: 'fire', k: 0.5, tick: 0.3, vis: 'breathF', src: 'L' });
        haz({ kind: 'line', x: oR.x, y: oR.y, a: Math.atan2(py - oR.y, px - oR.x), len: Math.hypot(px - oR.x, py - oR.y), w: 0.8, tell: 1.0, act: 0.7, fade: 0.3, el: 'ice', k: 0.5, tick: 0.3, vis: 'breathI', src: 'R' });
        haz({ kind: 'disc', x: px, y: py, r: Rb, tell: 1.6, act: 0.2, fade: 0.8, el: 'steam', k: 2.2, vis: 'shock' });
        A.tick = (A2, t0, t) => { aimAt('both', px, py); A2.chargeL = A2.chargeR = sstep(0, 1.0, t) * (1 - sstep(1.7, 2.0, t)); A2.jawL = A2.jawR = sstep(0.8, 1.0, t) * (1 - sstep(1.7, 2.0, t)); if (t0 < 1.6 && t >= 1.6) { S.X.shake(12, 0.4); sfx('crash'); } return t > 2.4; };
        break; }
      case 'eruption': {   // Solar Eruption: zones of molten floor swell and burst, one under the pet
        const n = P5() ? 5 : 4; A.side = 'L'; cue.lux(1.1); for (let i = 0; i < n; i++) { const p = i === 0 ? { x: me.x, y: me.y } : spotAway(me.x, me.y, 2.5, 6.5); const tl = 1.3 + i * 0.25;
          haz({ kind: 'disc', x: p.x, y: p.y, r: 1.55, tell: tl, act: 0.35, fade: 0.9, el: 'fire', k: 1.3, vis: 'erupt' }); }
        A.tick = (A2, t0, t) => { A2.chargeL = sstep(0, 0.8, t) * (1 - sstep(1.6, 2.0, t)); A2.jawL = bump(t, 0.9, 1.2, 1.6, 2.0); aimAt('L', me.x, me.y); return t > 2.6; }; A.plant = false;
        break; }
      case 'zero': {   // Absolute Zero: two sectors (never the pet's two neighbours both) frost over and then shatter in crystal
        A.side = 'R'; cue.umbra(1.1); const ps = secOf(me.x, me.y), s1 = ps >= 0 ? ps : Math.floor(Math.random() * 8), s2 = (s1 + 3 + Math.floor(Math.random() * 3)) % 8, mask = (1 << s1) | (1 << s2);
        haz({ kind: 'sector', mask, rIn: TUNE.HUB, rOut: AR.R, tell: 2.0, act: 0.35, fade: 1.2, el: 'ice', k: 1.6, chill: 1.6, vis: 'zero' });
        A.tick = (A2, t0, t) => { A2.chargeR = sstep(0, 1.6, t) * (1 - sstep(2.0, 2.3, t)); A2.jawR = bump(t, 1.7, 1.95, 2.1, 2.4); return t > 2.6; }; A.plant = false;
        break; }
      case 'guillotine': {   // Wing Guillotine: one wing sweeps a broad band across its side of the arena
        const sd = me.x < m.x ? -1 : 1, a0 = sd < 0 ? PI + 0.9 : -0.9, a1 = sd < 0 ? PI - 0.9 : 0.9;
        const h = haz({ kind: 'line', x: m.x, y: m.y, a: a0, len: 9.5, w: 1.6, back: 0, tell: 1.15, act: 0.75, fade: 0.3, el: 'white', k: 1.4, a0, a1, vis: 'wing',
          upd: h2 => { h2.x = S.m.x; h2.y = S.m.y; if (h2.t > h2.tell) h2.a = lerp(h2.a0, h2.a1, cl((h2.t - h2.tell) / h2.act)); } });
        haz({ kind: 'cone', x: m.x, y: m.y, a: (a0 + a1) / 2, half: Math.abs(angD(a1, a0)) / 2 + 0.12, len: 9.5, tell: 1.15, act: 0, fade: 0.2, cosmetic: true, el: 'white', vis: 'tell' });
        A.wingSide = sd; A.hz.push(h); A.tick = (A2, t0, t) => { A2.wingK = sstep(0, 1.1, t) * (1 - sstep(1.9, 2.2, t)); if (P5() && t0 < 1.9 && t >= 1.9) haz({ kind: 'ring', x: S.m.x + sd * 2.5, y: S.m.y, r0: 0.8, r1: 6, w: 0.6, tell: 0, act: 0.9, fade: 0.2, el: 'white', k: 0.7, vis: 'ringW' }); return t > 2.3; };
        break; }
      case 'meteor': {   // Twin Meteor: a molten sphere and a crystal sphere arc to two places (one the pet's, one apart)
        A.side = 'both'; cue.lux(1.2); cue.umbra(0.9); const p1 = { x: me.x, y: me.y }, p2 = spotAway(me.x, me.y, 4, 8), o1 = headW('L'), o2 = headW('R'), sw = Math.random() < 0.5;
        const pa = sw ? p2 : p1, pb = sw ? p1 : p2;
        haz({ kind: 'disc', x: pa.x, y: pa.y, r: 2.0, tell: 1.5, act: 0.3, fade: 1.0, el: 'fire', k: 1.6, vis: 'meteorF', ox: o1.x, oy: o1.y });
        haz({ kind: 'disc', x: pb.x, y: pb.y, r: 2.0, tell: 1.75, act: 0.3, fade: 1.0, el: 'ice', k: 1.5, chill: 1.4, vis: 'meteorI', ox: o2.x, oy: o2.y });
        A.tick = (A2, t0, t) => { aimAt('L', pa.x, pa.y); aimAt('R', pb.x, pb.y); A2.chargeL = sstep(0, 0.5, t) * (1 - sstep(0.6, 0.8, t)); A2.chargeR = sstep(0.2, 0.7, t) * (1 - sstep(0.8, 1.0, t)); A2.jawL = bump(t, 0.4, 0.55, 0.7, 0.9); A2.jawR = bump(t, 0.6, 0.75, 0.9, 1.1); return t > 2.8; };
        break; }
      case 'steam': {   // Steam Rupture: where the heavens' halves meet, steam bursts in a line of explosions down the middle
        cue.lux(); cue.umbra(); const n = 3 + (P5() ? 1 : 0), side = me.y < AR.cy ? 1 : -1;
        for (let i = 0; i < n; i++) { const y = AR.cy + (i - (n - 1) / 2) * 3.2 + side * 0.3, x = AR.cx + (Math.random() - 0.5) * 1.2; haz({ kind: 'disc', x, y, r: 2.1, tell: 1.2 + i * 0.3, act: 0.3, fade: 1.2, el: 'steam', k: 1.4, vis: 'steam' }); }
        if (Math.abs(me.x - AR.cx) < 3) haz({ kind: 'disc', x: me.x, y: me.y, r: 1.6, tell: 1.4, act: 0.3, fade: 1.0, el: 'steam', k: 1.2, vis: 'steam' });
        A.tick = (A2, t0, t) => t > 2.8; A.plant = false;
        break; }
      default: A.tick = () => true;
    }
    S.acts.push(A); return A;
  }
  // phase IV and V: a breath's follow-up from the other head (a complementary blow)
  function secondary(A) { const me = S.me; if (A.kind === 'infernal') { const o = headW('R'); haz({ kind: 'line', x: o.x, y: o.y, a: Math.atan2(me.y - o.y, me.x - o.x), len: 12, w: 0.9, tell: 0.9, act: 0.5, fade: 0.3, el: 'ice', k: 0.5, tick: 0.25, chill: 1.0, vis: 'breathI', src: 'R' }); } }
  function spotAway(x, y, d0, d1) { for (let i = 0; i < 30; i++) { const a = Math.random() * TAU, d = d0 + Math.random() * (d1 - d0), p = { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d }; if (inArena(p.x, p.y, 1.2)) return p; } return clampA(x + d0, y, 1.2); }

  /* ================= the mechanics (MI[id]: start(Mx), tick(Mx, da) -> done, end(Mx, ok)) ================= */
  const MI = [null, {}, {}, {}, {}, {}, {}];
  const petD = (x, y) => Math.hypot(S.me.x - x, S.me.y - y);
  // the nearest point of a sector's floor (between the hub and the rim, inside its edges by a margin) to (x, y), and its distance
  function secNear(i, x, y, mg) { mg = mg == null ? 0.5 : mg; let best = 1e9, bp = null; const a0 = secA(i); for (let k = 0; k <= 8; k++) { const a = a0 - PI / 8 + (PI / 4) * (0.12 + 0.76 * k / 8); for (let j = 0; j <= 6; j++) { const r = TUNE.HUB + mg + (AR.R - TUNE.HUB - 2 * mg) * j / 6, p = at(a, r), d = Math.hypot(p.x - x, p.y - y); if (d < best) { best = d; bp = p; } } } return { d: best, p: bp }; }
  // the worst case to reach any of `to` (sectors) from anywhere in any of `from` (or from anywhere on the floor when from is null), the pet choosing well
  function secReach(from, to) { let worst = 0; const pts = []; if (from) for (const i of from) { const a0 = secA(i); for (const fa of [-0.3, 0, 0.3]) for (const r of [TUNE.HUB + 0.8, (TUNE.HUB + AR.R) / 2]) pts.push(at(a0 + fa, r)); } else for (let k = 0; k < 16; k++) pts.push(at(k / 16 * TAU, AR.R - 0.6)); if (from) { let bestFrom = 1e9; for (const p of pts) { let b = 1e9; for (const j of to) b = Math.min(b, secNear(j, p.x, p.y).d); bestFrom = Math.min(bestFrom, b); } return bestFrom; } for (const p of pts) { let b = 1e9; for (const j of to) b = Math.min(b, secNear(j, p.x, p.y).d); worst = Math.max(worst, b); } return worst; }

  /* ---- 1 OPPOSING HEAVENS: three judgement waves; the charging head's element is met by the opposite protection, which only a
     sanctuary of that element gives (any pet, any element: the sanctuaries give it). Wave 3: both heads charge, then one cancels
     (it drops its head, its fire / frost dies in its throat, a falling note, its symbols go dark): the other is the true element ---- */
  function placeSan(Mx, wi) {
    const me = S.me, C = TUNE.m1, win = C.win[wi], R = AR.R, out = [];
    const ok = (L) => { if (wi === 2) return true; const need = Mx.need, near = Math.min(...L.filter(s => s.el === need).map(s => Math.hypot(s.x - me.x, s.y - me.y))); return near >= (wi ? 3.0 : 2.0) && near - C.sanR <= TUNE.VREF * (win - 0.9); };
    for (let tries = 0; tries < 80; tries++) { out.length = 0; const used = {};
      if (wi === 2) { // two adjacent pairs (a Fire and an Ice sector side by side), so either answer is near once the false head shows
        for (let n = 0; n < 2; n++) { let i; do { i = Math.floor(Math.random() * 4) * 2; } while (used[i] || used[(i + 1) % 8] || used[(i + 7) % 8]); used[i] = used[(i + 1) % 8] = 1; const r = R * lerp(C.r0, C.r1, Math.random()); out.push(Object.assign(at(secA(i) + 0.05, r), { el: 'fire', i })); out.push(Object.assign(at(secA((i + 1) % 8) - 0.05, r), { el: 'ice', i: (i + 1) % 8 })); } }
      else for (const el of ['fire', 'ice']) for (let n = 0; n < C.nSan; n++) { let i; do { i = Math.floor(Math.random() * 4) * 2 + (el === 'ice' ? 1 : 0); } while (used[i]); used[i] = 1; out.push(Object.assign(at(secA(i) + (Math.random() - 0.5) * 0.3, R * lerp(C.r0, C.r1, Math.random())), { el, i })); }
      if (ok(out)) break; }
    return out.map(s => Object.assign(s, { r: C.sanR, hl: 0, used: 0 }));
  }
  MI[1] = {
    start(Mx) { const D = Mx.data, first = Math.random() < 0.5 ? 'L' : 'R'; D.heads = [first, first === 'L' ? 'R' : 'L', Math.random() < 0.5 ? 'L' : 'R']; D.wi = -1; D.wt = 0; D.san = []; D.res = []; D.phase = 'prep'; D.pt = 0;
      Mx.wide = 0.58; Mx.focus = { x: AR.cx, y: AR.cy, k: 0.3 }; S.goTo = { x: AR.cx, y: AR.cy - 0.8 }; Mx.goal = 'The arena divides into Fire and Ice'; Mx.pose = { raise: 0.75, fly: 0 }; },
    tick(Mx, da) {
      const D = Mx.data, C = TUNE.m1, me = S.me, X = S.X; roam(da, 0);
      if (D.phase === 'prep') { D.pt += da; if (D.pt >= 2.0) { S.goTo = null; nextWave(Mx); } return false; }
      if (D.phase === 'gap') { D.pt += da; if (D.pt >= C.gap) { if (D.wi >= 2) return true; nextWave(Mx); } return false; }
      // a wave: protection taken in a sanctuary, the false head's cancel (wave 3), the judgement
      const W = D.w, t0 = W.t; W.t += da; const t = W.t, cross = x => t0 < x && t >= x;
      if (W.cancelAt != null && cross(W.cancelAt)) { W.told = true; cue.cancel(); (W.truth === 'L' ? cue.lux : cue.umbra)(1.2); X.text(AR.cx, AR.cy - TUNE.size * 0.9, W.truth === 'L' ? 'Lux is true: FIRE comes' : 'Umbra is true: ICE comes', W.truth === 'L' ? COL.fire : COL.ice, 15, { life: 1.6 }); }
      const told = W.cancelAt == null || W.told; Mx.need = W.truth === 'L' ? 'ice' : 'fire';
      for (const s of D.san) { s.hl = told ? (s.el === Mx.need ? 1 : 0.1) : 0.55; if (!me.dead && Math.hypot(me.x - s.x, me.y - s.y) < s.r + me.r * 0.3) { if (S.prot !== s.el) { S.prot = s.el; S.protT = 0.6; note(s.el === 'fire' ? 392 : 1175, 0.3, 'triangle', 0.05); } } }
      const hdK = h => (W.cancelAt == null ? (W.truth === h ? 1 : 0) : !W.told ? 1 : W.truth === h ? 1 : Math.max(0, 1 - (t - W.cancelAt) * 3));
      Mx.pose.chL = sstep(0, W.end * 0.8, t) * hdK('L'); Mx.pose.chR = sstep(0, W.end * 0.8, t) * hdK('R'); Mx.pose.jwL = 0.15 + 0.6 * Mx.pose.chL; Mx.pose.jwR = 0.15 + 0.6 * Mx.pose.chR;
      Mx.pose.recL = W.told && W.truth !== 'L' ? bump(t, W.cancelAt, W.cancelAt + 0.1, W.cancelAt + 0.3, W.cancelAt + 0.8) : 0; Mx.pose.recR = W.told && W.truth !== 'R' ? bump(t, W.cancelAt, W.cancelAt + 0.1, W.cancelAt + 0.3, W.cancelAt + 0.8) : 0;
      Mx.goal = !told ? 'Both heads charge: watch which one cancels' : (W.truth === 'L' ? 'Lux charges FIRE: take ICE protection' : 'Umbra charges ICE: take FIRE protection');
      if (t >= W.end) { // the judgement
        const okP = S.prot === Mx.need; D.res.push(okP); X.flash(0.25, W.truth === 'L' ? '#FFD0A0' : '#D8F0FF'); X.shake(14, 0.5); sfx('crash'); fx('judge', { x: S.m.x, y: S.m.y, R: AR.R + 1, life: 1.2, el: W.truth === 'L' ? 'fire' : 'ice' });
        if (okP) { fx('ward', { x: me.x, y: me.y, R: 1.6, life: 0.9, el: S.prot }); X.text(me.x, me.y - 1.5, 'Protected', COL.white, 14); }
        else miss(Mx, C.hitK, W.truth === 'L' ? 'fire' : 'frost', S.prot ? 'The wrong protection' : 'No protection');
        S.prot = null; D.san.length = 0; D.phase = 'gap'; D.pt = 0; Mx.pose.chL = Mx.pose.chR = 0; }
      return false;
      function nextWave(M2) { const D2 = M2.data; D2.wi++; const wi = D2.wi, h = D2.heads[wi], lead = wi === 2 ? C.lead3 : 0; D2.w = { t: 0, truth: h, cancelAt: wi === 2 ? lead : null, end: lead + C.win[wi], told: false }; M2.need = h === 'L' ? 'ice' : 'fire'; D2.san = placeSan(M2, wi); D2.phase = 'wave'; S.prot = null;
        if (wi === 2) { cue.lux(); cue.umbra(); } else (h === 'L' ? cue.lux : cue.umbra)(); }
    },
    end(Mx) { Mx.data.san = []; S.prot = null; },
    sectors(Mx, SEC) { const D = Mx.data, fl = D.phase === 'gap' && D.pt < 0.8 ? 1 - D.pt / 0.8 : 0, el = D.w && D.w.truth === 'L' ? 1 : 2; for (let i = 0; i < 8; i++) { SEC[i].cells.push({ st: i % 2 ? 2 : 1, k: 0.42, ri: 0.18, ro: 1, flare: 0 }); if (fl > 0) SEC[i].cells.push({ st: el, k: fl, ri: 0.18, ro: 1, flare: 1 }); } },
    drawGround(Mx, Q) { const T = Tz(), t = S.t; for (const s of Mx.data.san) { const X0 = sx(s.x), Y0 = sy(s.y), R = s.r * T; Q.quad(491, X0, Y0, R, 0, 0, R, '#FFFFFF', 1, (s.el === 'fire' ? 0 : 1) + 0.98 * s.hl, t * (s.el === 'fire' ? 0.6 : -0.6), 0); if (s.hl > 0.6) Q.shafts(X0, Y0 - T * 4, X0, Y0, R * 0.8, s.el === 'fire' ? COL.gold : COL.ice, 0.3 * s.hl, s.i * 7); } },
    draw2d(Mx, c) { const T = Tz(); c.save(); for (const s of Mx.data.san) { c.strokeStyle = s.el === 'fire' ? `rgba(255,190,90,${0.4 + 0.5 * s.hl})` : `rgba(140,220,255,${0.4 + 0.5 * s.hl})`; c.lineWidth = 3 + 2 * s.hl; c.beginPath(); c.arc(sx(s.x), sy(s.y), s.r * T, 0, TAU); c.stroke(); GFX.labelS(c, s.el === 'fire' ? 'FIRE' : 'ICE', sx(s.x), sy(s.y) + 4, 10, 900, '#FFFFFF', 'rgba(0,0,0,.6)', 3, 'center'); } c.restore(); },
    pointers(Mx) { const D = Mx.data, me = S.me; if (D.phase !== 'wave') return null; const told = D.w.cancelAt == null || D.w.told; let b = null, bd = 1e9; for (const s of D.san) if (!told || s.el === Mx.need) { const d = Math.hypot(s.x - me.x, s.y - me.y); if (d < bd) { bd = d; b = s; } } return b ? [{ x: b.x, y: b.y, col: !told ? COL.white : b.el === 'fire' ? COL.gold : COL.ice }] : null; },
    hud(Mx) { const D = Mx.data, W = D.w; if (!W || D.phase !== 'wave') return { say: D.phase === 'prep' ? 'Fire and Ice sectors: sanctuaries will rise' : `Wave ${Math.min(3, D.wi + 2)} of 3 next`, note: `Waves: ${D.res.map(r => (r ? '✓' : '✕')).join(' ') || '—'}` };
      const left = Math.max(0, W.end - W.t), told = W.cancelAt == null || W.told; return { say: Mx.goal, bar: told ? left / (W.cancelAt == null ? W.end : W.end - W.cancelAt) : 1, barCol: W.truth === 'L' && told ? COL.ice : !told ? COL.white : COL.fire, secs: told ? left : null, note: `Wave ${D.wi + 1} of 3 · ${S.prot ? (S.prot === 'fire' ? 'Fire' : 'Ice') + ' protection' : 'no protection'}`, noteCol: S.prot === 'fire' ? COL.fire : S.prot === 'ice' ? COL.ice : COL.pale }; },
  };

  /* ---- 2 MIRROR MEMORY: four patterns of two safe sectors shown in order (gold light, a note each, the step on the HUD); the
     rule announced before the playback (REPEAT: in order; REFLECT: in reverse; only the order, never the sectors); then four
     arena-wide blows, each needing the pet inside one of that step's sectors. The patterns are dealt so every step can be
     reached in its window at VREF from any place in the step before ---- */
  function m2Deal() {
    const C = TUNE.m2; for (let tries = 0; tries < 200; tries++) {
      const pats = []; for (let i = 0; i < 4; i++) { let a, b, key; do { a = Math.floor(Math.random() * 8); b = (a + 2 + Math.floor(Math.random() * 5)) % 8; key = Math.min(a, b) + ',' + Math.max(a, b); } while (pats.some(p => p.key === key) || (i && (pats[i - 1].s.includes(a) || pats[i - 1].s.includes(b)))); pats.push({ s: [a, b], key }); }
      const rule = Math.random() < 0.5 ? 'REPEAT' : 'REFLECT', order = rule === 'REPEAT' ? [0, 1, 2, 3] : [3, 2, 1, 0];
      let ok = secReach(null, pats[order[0]].s) <= TUNE.VREF * (C.win[0] - 0.3); for (let j = 1; j < 4 && ok; j++) ok = secReach(pats[order[j - 1]].s, pats[order[j]].s) <= TUNE.VREF * (C.win[j] - 0.8);
      if (ok) return { pats, rule, order, tries }; }
    return { pats: [{ s: [0, 4] }, { s: [2, 6] }, { s: [1, 5] }, { s: [3, 7] }], rule: 'REPEAT', order: [0, 1, 2, 3], tries: -1 };
  }
  MI[2] = { deal: () => m2Deal(),
    start(Mx) { const D = Mx.data, C = TUNE.m2, Dl = m2Deal(); Object.assign(D, Dl, { step: -1, ex: -1, res: [], phase: 'rule', pt: 0, lastLit: null, showAt: [] });
      D.tShow0 = C.rule; D.tPlay = C.rule + 4 * (C.show + C.gapS) + C.pause; D.ends = []; let tt = D.tPlay; for (let j = 0; j < 4; j++) { tt += C.win[j]; D.ends.push(tt); tt += C.res; } D.tEnd = tt + 0.6;
      Mx.wide = 0.56; Mx.focus = { x: AR.cx, y: AR.cy, k: 0.35 }; S.goTo = { x: AR.cx, y: AR.cy - 1.2 }; Mx.pose = { fly: 1, raise: 0.4, crownO: 1, wing: 1, beat: 0.5 }; Mx.goal = 'Watch the sequence';
      S.X.banner(D.rule, D.rule === 'REPEAT' ? 'Follow the sanctuaries in the order shown' : 'Follow the sanctuaries in REVERSE order', COL.white, 2.2, true); note(D.rule === 'REPEAT' ? 659 : 523, 0.8, 'triangle', 0.06); note(D.rule === 'REPEAT' ? 988 : 392, 0.8, 'triangle', 0.05, null, 0.2); },
    tick(Mx, da) {
      const D = Mx.data, C = TUNE.m2, t = Mx.t, t0 = t - da, cross = x => t0 < x && t >= x, me = S.me, X = S.X; roam(da, 0);
      for (let i = 0; i < 4; i++) { const ts = D.tShow0 + i * (C.show + C.gapS); if (cross(ts)) { D.step = i; cue.step(i); } }
      if (t >= D.tShow0 && t < D.tPlay - C.pause) { const i = Math.floor((t - D.tShow0) / (C.show + C.gapS)), u = (t - D.tShow0) - i * (C.show + C.gapS); D.lit = i < 4 && u < C.show ? D.pats[i].s : null; D.litK = sstep(0, 0.15, u) * (1 - sstep(C.show - 0.15, C.show, u)); } else D.lit = null;
      if (cross(D.tPlay - C.pause)) { X.banner(D.rule === 'REPEAT' ? 'REPEAT · 1 → 4' : 'REFLECT · 4 → 1', 'Stand in one of each step\'s sectors when it strikes', COL.white, 1.6, true); }
      for (let j = 0; j < 4; j++) { const te = D.ends[j], ts = te - C.win[j]; if (cross(ts)) { D.ex = j; Mx.goal = `Step ${j + 1} of 4: to its sanctuary`; cue.tick(); }
        if (cross(te)) { const want = D.pats[D.order[j]].s, s0 = secOf(me.x, me.y), okP = want.includes(s0); D.res.push(okP); D.flash = { j, t: 0, want, ok: okP };
          X.shake(12, 0.45); sfx('crash'); X.flash(0.18, '#FFF4E0'); (j % 2 ? cue.umbra : cue.lux)(1 + j * 0.06);
          if (okP) { fx('ward', { x: me.x, y: me.y, R: 1.6, life: 0.8, el: 'white' }); X.text(me.x, me.y - 1.5, 'Remembered', COL.white, 14); }
          else miss(Mx, C.hitK, 'fire', s0 < 0 ? 'Caught in the centre' : 'The wrong sector'); } }
      if (D.flash) D.flash.t += da;
      Mx.pose.crownE = 0.3 + 0.2 * Math.max(0, D.ex);
      return t >= D.tEnd;
    },
    end(Mx) { S.goTo = null; },
    sectors(Mx, SEC) { const D = Mx.data; for (let i = 0; i < 8; i++) SEC[i].cells.push({ st: 0 + 4, k: 0.08, ri: 0.16, ro: 1, flare: 0 });
      if (D.lit) for (const i of D.lit) SEC[i].cells.push({ st: 4, k: D.litK, ri: 0.16, ro: 1, flare: 0.6 });
      const F = D.flash; if (F && F.t < 1.1) { const k = 1 - F.t / 1.1; for (let i = 0; i < 8; i++) { if (F.want.includes(i)) SEC[i].cells.push({ st: 3, k, ri: 0.16, ro: 1, flare: 0 }); else SEC[i].cells.push({ st: fireSide(i) || i === 2 ? 1 : 2, k, ri: 0.16, ro: 1, flare: 1 }); } } },
    props(Mx, add, u) { const T = Tz(), D = Mx.data, t = S.t, sp = 1 + 0.6 * Math.max(0, D.ex), rep = D.rule === 'REPEAT';
      for (let s = 0; s < 2; s++) { const x = AR.cx + (s ? 3.6 : -3.6), y = AR.cy - 0.5; add({ m: s ? 'crownR' : 'crownL', X: sx(x), Y: sy(y) - T * 5.5, s: u * 1.6, yaw: t * 0.9 * sp * (rep ? 1 : s ? -1 : 1), tilt: 1.15, h: 0.6 + 0.4 * Math.max(0, D.ex) / 3, g: 0.8, t, z: 1e5 }, AR.cy - 10); } },
    drawAir(Mx, Q) { const T = Tz(), D = Mx.data; for (let s = 0; s < 2; s++) { const x = AR.cx + (s ? 3.6 : -3.6), y = AR.cy - 0.5, X0 = sx(x), Y0 = sy(y) - T * 5.5; Q.glow(X0, Y0, T * 2.2, s ? COL.ice : COL.gold, 0.25);
        if (D.lit) for (const i of D.lit) { const p = at(secA(i), AR.R * 0.6); Q.shafts(X0, Y0, sx(p.x), sy(p.y), T * 1.2, s ? COL.ice : COL.gold, 0.22 * D.litK, i * 3 + s); } } },
    draw2d(Mx, c) { const D = Mx.data, T = Tz(); if (D.lit) { c.save(); c.globalCompositeOperation = 'lighter'; for (const i of D.lit) { const a = secA(i); c.fillStyle = `rgba(255,235,180,${(0.35 * D.litK).toFixed(3)})`; c.beginPath(); c.moveTo(sx(AR.cx), sy(AR.cy)); c.arc(sx(AR.cx), sy(AR.cy), AR.R * T, a - PI / 8, a + PI / 8); c.closePath(); c.fill(); } c.restore(); } },
    hud(Mx) { const D = Mx.data, C = TUNE.m2, t = Mx.t; const seq = [0, 1, 2, 3].map(i => i === D.step && D.lit ? `[${i + 1}]` : String(i + 1)).join(' ');
      if (t < D.tPlay) return { say: t < D.tShow0 ? `Rule: ${D.rule}` : `Watch: ${seq}`, note: `${D.rule} · ${D.rule === 'REPEAT' ? 'in order' : 'in reverse'}`, noteCol: COL.white };
      const j = Math.max(0, D.ex), te = D.ends[j], left = Math.max(0, te - t); return { say: `${D.rule}: step ${j + 1} of 4 (shown ${D.order[j] + 1})`, bar: left / C.win[j], barCol: COL.gold, secs: left, note: `Results: ${D.res.map(r => (r ? '✓' : '✕')).join(' ') || '—'}` }; },
  };

  const segD = (x, y, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1, u = cl(((x - a.x) * dx + (y - a.y) * dy) / L2); return Math.hypot(a.x + dx * u - x, a.y + dy * u - y); };

  /* ================= the defeat ================= */
  function onBossDeath(mm) {
    if (!S || mm !== S.m) return false;
    if (S.mode === 'fight' || S.mode === 'mech' || S.mode === 'trans') { startDefeat(); return true; }
    // not allowed to fall yet: it stands again at its gate (the engine's kill caught)
    if (S.mode === 'dead') return true; mm.dead = false; mm.hp = Math.max(1, S.lastM || 1); return true;   // (the awakening: it cannot fall yet)
  }
  function startDefeat() {
    const m = S.m, X = S.X, g = S.g; if (S.mode === 'dead' || S.mode === 'over') return; if (S.mech) { try { MI[S.mech.id].end(S.mech, false); } catch (e) {} S.mech = null; } S.trans = null; abortActs(); S.haz.length = 0; S.vuln = null; m.stunT = 0; clearPet();
    m.dead = false; m.hp = 1; S.mode = 'dead'; S.dead = { t: 0, won: false }; S.cine = true; g.cineT = Math.max(g.cineT || 0, 0.1); m.guardFn = () => 0;
    X.flash(0.5, '#FFFFFF'); X.shake(14, 0.7); g.hitStop = Math.max(g.hitStop || 0, 0.08); S.stat.wonAt = S.t;
  }
  const DEF = { roar: 0.6, fold: 1.6, lower: 2.4, cores: 3.4, eq: 5.2, diss: 5.6, seal: 6.6, text: 8.4, win: 11.0 };
  function deadTick(dt) {
    const D = S.dead, t0 = D.t; D.t += dt; const t = D.t, X = S.X, cross = x => t0 < x && t >= x;
    if (cross(DEF.roar)) { cue.lux(); cue.umbra(); X.shake(10, 0.6); sfx('crash'); }
    if (cross(DEF.cores)) { note(784, 1.0, 'sine', 0.05); note(523, 1.0, 'sine', 0.05, null, 0.1); }
    if (cross(DEF.eq)) { [392, 494, 587, 784].forEach((f, i) => note(f, 1.4, 'sine', 0.05, null, i * 0.12)); X.flash(0.2, '#FFFFFF'); }
    if (cross(DEF.seal)) { sfx('sparkle'); }
    if (cross(DEF.text)) { const done = (() => { try { return typeof gateDone === 'function' && gateDone('sepulchre'); } catch (e) { return false; } })(); D.first = !done; X.banner('GEMINI GATE CONQUERED', 'RAZIEL — THE TWIN REVELATION', COL.white, 3.4, true, true); sfx('fanfare'); }
    if (t > DEF.diss && t < DEF.text && Math.random() < dt * 18 * LQ()) { const B = S.B; X.part({ kind: 'ember', x: B.x + (Math.random() - 0.5) * 4, y: B.y - Math.random() * 4, vx: (Math.random() - 0.5), vy: -1.2 - Math.random(), life: 1.3, max: 1.3, size: 3.2, color: Math.random() < 0.5 ? COL.gold : COL.ice }); }
    if (t >= DEF.win && !D.won) { D.won = true; const X2 = X; finish(); try { X2.winStage(); } catch (e) { /* (the stage already ended) */ } }
  }

  /* ================= clean-up ================= */
  function finish() { if (!S) return; const m = S.m; cleanup(); try { if (m && !m.dead) { m.hp = 0; m.dead = true; } } catch (e) {} S.mode = 'over'; }
  function cleanup() {
    if (!S) return; const g = S.g, m = S.m;
    try { if (S.mech && MI[S.mech.id] && MI[S.mech.id].end) MI[S.mech.id].end(S.mech, false, true); } catch (e) {}
    try { S.acts.length = 0; S.haz.length = 0; S.fx.length = 0; S.mech = null; S.vuln = null; } catch (e) {}
    try { for (const P of S.parts.slice()) dropPart(P); S.parts.length = 0; } catch (e) {}
    try { clearPet(); } catch (e) {}
    try { musicDuck(1, 0); } catch (e) {}
    try { if (S.cine) { S.cine = false; if (g.cineT > 0) g.cineT = 0; } g.zoomP = 1; } catch (e) {}
    try { const R = S.X && S.X.rift, list = R && R.objs; if (list) for (const o of S.objs) { const i = list.indexOf(o); if (i >= 0) list.splice(i, 1); } for (const o of S.objs) o.draw = null; S.objs.length = 0; } catch (e) {}
    try { if (m) { m.ownBar = null; m.goalFn = null; m.guardFn = null; m.stunT = 0; } } catch (e) {}
    try { const G = GLR(); if (G && G.free) G.free(); } catch (e) {}
  }
  function stop() { if (!S) return; const s = S; try { cleanup(); } catch (e) {} try { const g = s.g, m = s.m; if (m && !m.dead) m.dead = true; if (g && g.boss === m) g.boss = null; } catch (e) {} S = null; }
  const active = () => !!(S && S.mode !== 'over');
  function warm() { try { const G = GLR(); if (G && glOn()) G.warm(); } catch (e) {} try { const N = NMv(); if (N && N.FGFX) N.FGFX.usable(); } catch (e) {} }

  /* ================= the passive parts the pet strikes (the engine's fobj: hit like a monster, never moving, drawn here) ================= */
  function part(kind, x, y, r, hp, o) {
    const X = S.X; let m = null; try { m = X.spawnMon('fobj', x, y, Object.assign({ fobj: true, optional: true, aggro: true, still: true, mv: 1, r, hp, maxhp: hp, z: 0, t: 0, invuln: false, xp: 0, gbPart: kind, color: '#2A2030' }, o || {})); } catch (e) { m = null; }
    if (!m) return null; m.x = x; m.y = y; m.hp = m.maxhp = hp; const P = { kind, m, last: hp, took: 0 }; S.parts.push(P); return P;
  }
  function dropPart(P) { if (!P) return; const i = S.parts.indexOf(P); if (i >= 0) S.parts.splice(i, 1); const m = P.m; if (m) { m.dead = true; try { const L = S.X.mons, j = L.indexOf(m); if (j >= 0) L.splice(j, 1); } catch (e) {} } }

  /* ================= music: The Summoning plays (05b, the gate's boss phase); over it the two minds' motifs, and the hush ================= */
  function musicDuck(k, dur) { try { if (typeof music !== 'undefined' && music.duck) music.duck(k, dur); } catch (e) {} try { if (typeof sfx !== 'undefined' && sfx.duck && k < 1) sfx.duck(Math.max(0.05, k), dur); } catch (e) {} }
  function musicTick(da) {
    if (!(da > 0) || S.mode === 'dead' || S.mode === 'intro') return; S.musT -= da; if (S.musT > 0) return; S.musT = 2.0; S.musN++;
    const n = S.musN, ph = S.phase;
    // I: the two themes apart (whichever head acts); II: alternating; III: dissonant seconds; IV: together, faster; V: one chord
    if (ph === 1) { const A = S.acts[0]; if (A && A.side === 'L') note(110, 0.4, 'triangle', 0.035); else if (A && A.side === 'R') note(1760, 0.3, 'sine', 0.02); }
    else if (ph === 2) { if (n % 2) note(98, 0.5, 'sawtooth', 0.025, 92); else note(1568, 0.4, 'triangle', 0.025); }
    else if (ph === 3) { note(233, 0.6, 'triangle', 0.025); note(247, 0.6, 'triangle', 0.02); }
    else if (ph === 4) { S.musT = 1.0; note(110, 0.3, 'sawtooth', 0.025); note(1318, 0.25, 'sine', 0.018, null, 0.5); }
    else { S.musT = 1.5; note(131, 0.8, 'triangle', 0.025); note(196, 0.8, 'triangle', 0.02); note(1568, 0.6, 'sine', 0.015); }
  }

  /* ================= the pose: Raziel's two minds (RAZIEL_GL's pose state S) ================= */
  function poseTick(dt) {
    const P = S.P, B = S.B, m = S.m, me = S.me, G = GLR(), mode = S.mode, ph = S.phase;
    const sy = SYNC[ph] || 0, A = S.acts;
    let chL = 0, chR = 0, jwL = 0.18, jwR = 0.18, raise = 0, roar = 0, wing = 0.78, beat = 0, flyT = 0, stag = 0, meet = 0, coreD = 0, coreO = 0, coreAl = ph >= 5 ? 0.6 : 0, crownE = 0, crownO = 0, fin = ph >= 5 ? 0.6 : 0, spin = 0, wingK = 0, guard = 0, dis = 0, enter = 1, recL = 0, recR = 0;
    for (const a of A) { chL = Math.max(chL, a.chargeL || 0); chR = Math.max(chR, a.chargeR || 0); jwL = Math.max(jwL, a.jawL || 0); jwR = Math.max(jwR, a.jawR || 0); raise = Math.max(raise, a.raiseK || 0); if (a.spinK) spin = a.spinK * (a.spin || 1); if (a.wingK) wingK = a.wingK * (a.wingSide || 1); }
    // the heads' looks: Lux follows the pet; Umbra studies its own point, closing on the pet's as the phases sync
    const tL = A.some(a => a.side === 'L' || a.side === 'both'), tR = A.some(a => a.side === 'R' || a.side === 'both');
    if (!tL) { B.aimL.x += (me.x - B.aimL.x) * Math.min(1, dt * 3); B.aimL.y += (me.y - B.aimL.y) * Math.min(1, dt * 3); }
    if (!tR) { const ox = Math.cos(B.at * 0.7) * 3.5 * (1 - sy), oy = Math.sin(B.at * 0.55) * 2.2 * (1 - sy), tx = me.x + ox, ty = me.y + oy; B.aimR.x += (tx - B.aimR.x) * Math.min(1, dt * 2.2); B.aimR.y += (ty - B.aimR.y) * Math.min(1, dt * 2.2); }
    if (mode === 'intro') { const t = S.introT; enter = sstep(0, 2.4, t); flyT = 1 - sstep(3.6, 4.6, t); wing = lerp(0.25, 1, sstep(3.0, 4.2, t)); chL = bump(t, 1.4, 1.8, 3.0, 4.0); chR = bump(t, 2.4, 2.8, 3.6, 4.4); roar = bump(t, 5.0, 5.3, 6.2, 6.8); raise = bump(t, 1.2, 1.8, 4.4, 5.0) * 0.8; beat = flyT > 0.1 ? 0.5 : 0; crownO = 1 - sstep(2.0, 3.6, t); jwL = Math.max(jwL, chL, roar); jwR = Math.max(jwR, chR, roar); }
    else if (mode === 'trans') { const t = S.trans.t; roar = bump(t, 0.4, 0.8, 2.2, 2.8); wing = 1; raise = 0.6 * bump(t, 0.2, 0.6, 2.6, 3.2); jwL = Math.max(jwL, roar); jwR = Math.max(jwR, ph === 2 ? bump(t, 1.0, 1.4, 2.6, 3.2) : roar); if (ph === 3) { coreD = sstep(1.2, 3.0, t); } if (ph === 4) { flyT = bump(t, 0.6, 1.4, 2.6, 3.4) * 0.6; beat = 0.6; } if (ph === 5) { coreAl = sstep(1, 3, t); fin = 1; crownE = 0.4 * sstep(1.5, 3.4, t); } }
    else if (mode === 'mech' && S.mech) { const q = S.mech.pose || {}; if (q.fly != null) flyT = q.fly; if (q.raise != null) raise = q.raise; if (q.chL != null) chL = q.chL; if (q.chR != null) chR = q.chR; if (q.jwL != null) jwL = q.jwL; if (q.jwR != null) jwR = q.jwR; if (q.wing != null) wing = q.wing; if (q.beat != null) beat = q.beat; if (q.coreD != null) coreD = q.coreD; if (q.coreO != null) coreO = q.coreO; if (q.crownE != null) crownE = q.crownE; if (q.crownO != null) crownO = q.crownO; if (q.roar != null) roar = q.roar; if (q.meet != null) meet = q.meet; if (q.stag != null) stag = q.stag; if (q.coreAl != null) coreAl = q.coreAl; if (q.recL) recL = q.recL; if (q.recR) recR = q.recR;
      if (q.aimL) { B.aimL.x = q.aimL.x; B.aimL.y = q.aimL.y; } if (q.aimR) { B.aimR.x = q.aimR.x; B.aimR.y = q.aimR.y; } }
    else if (mode === 'dead') { const t = S.dead.t; roar = bump(t, DEF.roar - 0.3, DEF.roar, DEF.roar + 0.6, DEF.roar + 1.0); wing = lerp(0.78, 0.08, sstep(DEF.fold, DEF.fold + 2.4, t)); raise = -0.0; meet = sstep(DEF.eq - 0.6, DEF.eq, t); coreD = sstep(DEF.cores - 0.5, DEF.cores + 0.5, t); coreO = sstep(DEF.cores, DEF.cores + 0.6, t); crownO = sstep(DEF.seal - 0.4, DEF.seal, t); dis = sstep(DEF.diss, DEF.text + 0.6, t); stag = 0.2 * bump(t, DEF.fold, DEF.fold + 0.5, DEF.lower, DEF.lower + 1);
      B.aimL.x = me.x - 0.6; B.aimL.y = me.y; B.aimR.x = me.x + 0.6; B.aimR.y = me.y; jwL = jwR = Math.max(0.12, roar); }
    if (S.vuln && mode === 'fight') { const V = S.vuln, e = sstep(0, 0.4, V.t) * (1 - sstep(V.dur - 0.6, V.dur, V.t)); stag = Math.max(stag, 0.55 * e); coreD = Math.max(coreD, 0.45 * e); raise = Math.min(raise, 0.0); wing = lerp(wing, 0.55, e); }
    if (m.flinch > 0) { m.flinch = Math.max(0, m.flinch - dt * 2.5); stag = Math.max(stag, Math.sin(m.flinch * PI) * 0.5); }
    if (ph >= 5 && mode === 'fight') { wing = Math.max(wing, 0.95); }
    // flight: smoothed (the model reads takeoff and landing from how fast it changes)
    B.fly += (flyT - B.fly) * Math.min(1, dt * 1.6);
    // facing: chest to the camera, turned a little to the pet; the tail sweep spins it whole
    const lookA = me.dead ? 1.98 : Math.atan2(me.y - m.y, me.x - m.x);
    let face = 1.98 + Math.max(-0.7, Math.min(0.7, angD(lookA, PI / 2) * 0.5));
    if (spin) face = lookA + spin * spin * 0 + (spin > 0 ? 1 : -1) * TAU * Math.abs(spin);
    B.face += angD(face, B.face) * Math.min(1, dt * (spin ? 12 : 3));
    const sp = Math.hypot(B.vx, B.vy);
    Object.assign(P, { t: B.at, x: m.x, y: m.y, evo: 7, lowFx: lowFx(), mode: ph === 2 || ph === 3 || (ph === 4 && Math.sin(B.at * 0.3) > 0) ? 'dissonance' : 'concord', face: B.face, faceFree: !!spin,
      aimL: B.aimL, aimR: B.aimR, chargeL: chL, chargeR: chR, jawL: jwL, jawR: jwR, raise, roar, meet, wing: wingK ? Math.max(wing, 1) : wing, beat, fly: B.fly, glide: 0, speed: 0, dive: 0, bank: wingK ? -wingK * 0.5 : 0,
      walk: B.fly > 0.2 ? 0 : cl(sp / 2.6), stagger: stag, final: fin, enter, dissolve: dis, coreDetach: coreD, coreOut: coreO, coreAlign: coreAl, coreUp: 0, crownExpand: crownE, crownOut: crownO,
      crownSpeedL: 1 + 0.35 * (ph - 1), crownSpeedR: (1 + 0.35 * (ph - 1)) * (ph >= 5 ? 1 : 1.12), coreSpinL: 1 + 0.25 * (ph - 1), coreSpinR: (1 + 0.25 * (ph - 1)) * 0.9, crownAlign: sy * 0.8, guard, recoilL: recL, recoilR: recR });
    B.x = m.x; B.y = m.y;
  }

  /* ================= the camera: the pet always on screen; the boss framed; wider for arena-wide mechanics ================= */
  function camOf() {
    const me = S.me, m = S.m, X = S.X, g = S.g, mode = S.mode;
    const wide = mode === 'mech' ? (S.mech && S.mech.wide != null ? S.mech.wide : 0.6) : mode === 'intro' || mode === 'trans' || mode === 'dead' ? 0.6 : 0.68;
    let fx0 = lerp(m.x, AR.cx, 0.3), fy0 = lerp(m.y - TUNE.size * 0.35 * (1 - S.B.fly * 0.2), AR.cy, 0.25), k = 0.42;
    if (mode === 'intro' || mode === 'dead') { k = 0.75; }
    if (mode === 'mech' && S.mech && S.mech.focus) { fx0 = S.mech.focus.x; fy0 = S.mech.focus.y; k = S.mech.focus.k != null ? S.mech.focus.k : 0.45; }
    // the pet kept on screen: the pull clamped to what the view at this zoom leaves round it
    const TS = X.Tz() / Math.max(0.05, g.zoom || 1), z = wide, hw = (X.W() / 2 - 46) / (TS * z), hTop = (X.H() / 2 - 150) / (TS * z), hBot = (X.H() / 2 - 190) / (TS * z);
    let ox = (fx0 - me.x) * k, oy = (fy0 - me.y) * k; ox = Math.max(-hw, Math.min(hw, ox)); oy = Math.max(-hBot, Math.min(hTop, oy));
    return { x: me.x + ox / Math.max(0.01, k), y: me.y + oy / Math.max(0.01, k), k, zoom: z };
  }
  const cam = () => (S && S.mode !== 'over' ? camOf() : null);

  /* ================= the goal line and banners ================= */
  function say(t, sub, col, dur) { S.X.banner(t, sub || '', col || COL.gold, dur || 2.0, true); }
  function goalText() {
    if (!S) return ''; if (S.mode === 'dead' || S.mode === 'over') return 'The Twin Revelation falls'; if (S.mode === 'intro') return 'Raziel awakens';
    const Mx = S.mech; if (Mx) return `${MECH[Mx.id].name} · ${Mx.goal || MECH[Mx.id].tip}`;
    const n = Math.max(0, Math.ceil(S.m.hp / (S.m.maxhp / TUNE.bars) - 1e-9)); return `Raziel · ${n} bar${n === 1 ? '' : 's'} · Phase ${ROMAN[S.phase]}${S.vuln ? ' · exposed: strike!' : ''}`;
  }
  const goal = () => (S ? goalText() : '');
  const hideHud = () => false;

  /* ================= drawing ================= */
  function safeDraw(c, f) { if (!S || S.mode === 'over') return; c.save(); try { f(c); } catch (e) { if (!S.drawErr) { S.drawErr = 1; try { console.warn('Gemini boss draw: ' + (e && e.message || e)); } catch (e2) {} } } c.restore(); }
  function safeHud(c, W) { if (!S || S.mode === 'over') return; c.save(); try { drawHud(c, W); } catch (e) { if (!S.hudErr) { S.hudErr = 1; try { console.warn('Gemini boss HUD: ' + (e && e.message || e)); } catch (e2) {} } } c.restore(); }
  const sx = x => S.X.sx(x), sy = y => S.X.sy(y), Tz = () => S.X.Tz();
  const elCol = el => (el === 'fire' ? COL.fire : el === 'ice' ? COL.ice : el === 'steam' ? COL.steam : COL.white);
  /* the sectors' state this frame: [8] { st, k, flare, cells: [{ st, k, ri, ro, flare }] } (rest at env strength) */
  const SEC = []; for (let i = 0; i < 8; i++) SEC.push({ cells: [] });
  function sectorState() {
    const ph = S.phase, t = S.t; for (let i = 0; i < 8; i++) SEC[i].cells.length = 0;
    // the arena's own transformation by phase: the rest's strength, the channels' heat
    S.envK = ph === 1 ? 0.75 : ph === 2 ? 0.85 : ph === 3 ? 0.7 + 0.2 * Math.abs(Math.sin(t * 7.3)) * (Math.sin(t * 1.3) > 0.6 ? 1 : 0.2) : ph === 4 ? 0.9 : 1.0;
    if (ph >= 2 && S.mode !== 'mech') { for (let i = 0; i < 8; i++) { const fireDom = ph === 2 ? Math.cos(secA(i) - t * 0.08) < 0 : fireSide(i), iceDom = ph === 2 ? Math.cos(secA(i) - t * 0.08) > 0.38 : iceSide(i); if (ph === 2 || ph >= 4) { if (fireDom) SEC[i].cells.push({ st: 1, k: ph === 2 ? 0.16 : 0.12, ri: 0.2, ro: 1.0, flare: 0 }); else if (iceDom) SEC[i].cells.push({ st: 2, k: ph === 2 ? 0.16 : 0.12, ri: 0.2, ro: 1.0, flare: 0 }); } } }
    for (const h of S.haz) { if (h.kind !== 'sector' || h.cosmetic === 'hide') continue; const u = cl(h.t / Math.max(0.01, h.tell)), on = h.t >= h.tell && h.t < h.tell + h.act + h.fade, k = on ? 1 - cl((h.t - h.tell - h.act) / h.fade) : 0.3 + 0.6 * u;
      for (let i = 0; i < 8; i++) if (h.mask & (1 << i)) SEC[i].cells.push({ st: h.el === 'ice' ? 2 : h.el === 'fire' ? 1 : 3, k, ri: (h.rIn || 0) / AR.R, ro: Math.min(1, (h.rOut || AR.R) / AR.R), flare: on ? 1 : u * 0.4 }); }
    if (S.mech && MI[S.mech.id].sectors) try { MI[S.mech.id].sectors(S.mech, SEC); } catch (e) {}
  }
  function sectorQuad(Q, Ox, Oy, Rpx, i, st0, k, ri, ro, flare, tint) {
    const a = secA(i), dx = Math.cos(a), dy = Math.sin(a), Lq = Rpx * 1.25, hx = dx * Lq / 2, hy = dy * Lq / 2;
    Q.quad(490, Ox + hx, Oy + hy, hx, hy, -dy * Lq * 0.42, dx * Lq * 0.42, tint, 1, st0 + 0.98 * cl(k), Math.floor(cl(ro) * 10 + 1e-6) + Math.min(0.99, cl(ri)), i + 0.98 * cl(flare));
  }
  function wedgeQuad(Q, x, y, a, half, len, col, al, prog, mode) {   // kind 493: a tell's wedge, (x, y) its point in screen px
    const h2 = Math.min(1.4, half), wq = Math.sin(h2) * 1.06 + 0.04, dx = Math.cos(a), dy = Math.sin(a), hx = dx * len / 2, hy = dy * len / 2;
    Q.quad(493, x + hx, y + hy, hx, hy, -dy * len * wq, dx * len * wq, col, al, h2, prog, mode || 0);
  }
  function drawGroundLayer(c) {
    const T = Tz(), Ox = sx(AR.cx), Oy = sy(AR.cy), Rpx = AR.R * T; S.drawN = (S.drawN || 0) + 1;
    sectorState();
    if (!gpu()) { drawGround2d(c); return; }
    const Q = fgOpen(c), FX = FXP(), t = S.t;
    // the eight sectors: the rest (rim, machinery, channels, constellations, emblem), then the states
    for (let i = 0; i < 8; i++) { const tint = fireSide(i) ? SKIN.gold : iceSide(i) ? SKIN.plat : SKIN.neut; sectorQuad(Q, Ox, Oy, Rpx, i, 0, S.envK, 0, 1, S.phase >= 4 ? 0.6 : 0.15, tint);
      for (const cc of SEC[i].cells) sectorQuad(Q, Ox, Oy, Rpx, i, cc.st, cc.k, cc.ri, cc.ro, cc.flare, tint); }
    // the mechanic's own floor (sanctuaries, anchors' fields, the dials, fragments)
    if (S.mech && MI[S.mech.id].drawGround) MI[S.mech.id].drawGround(S.mech, Q, c);
    // the hazards' tells and their floors
    for (const h of S.haz) drawHazGround(Q, h, T);
    for (const f of S.fx) drawFxGround(Q, f, T, FX);
    // the pet's protection, burning, a seal shattering over it
    const me = S.me; if (!me.dead) { const X0 = sx(me.x), Y0 = sy(me.y); if (S.prot) Q.quad(491, X0, Y0, T * 0.9, 0, 0, T * 0.9, '#FFFFFF', 0.85, (S.prot === 'fire' ? 0 : 1) + 0.98 * (0.5 + 0.5 * Math.sin(t * 6)), t * 0.8, 0); }
    fgClose(c);
  }
  function drawHazGround(Q, h, T) {
    const FX = FXP(), t = h.t, tl = h.tell, u = cl(t / Math.max(0.01, tl)), on = t >= tl && t <= tl + h.act, post = t > tl + h.act ? cl((t - tl - h.act) / Math.max(0.01, h.fade)) : 0, X0 = sx(h.x), Y0 = sy(h.y), col = elCol(h.el);
    switch (h.kind) {
      case 'disc': { const R = h.r * T;
        if (t < tl) { if (h.el === 'fire' && FX) FX.fireField(Q, X0, Y0, R, u, 0.55 + 0.35 * u, h.seed, 1, u); else if (h.el === 'ice' && FX) FX.iceField(Q, X0, Y0, R, u, 0.55 + 0.35 * u, h.seed, 1); else Q.glow(X0, Y0, R, col, 0.18 + 0.25 * u); Q.ring(X0, Y0, R, col, 0.35 + 0.5 * u, T * 0.08); }
        else { const k = 1 - post; if (FX) { if (h.el === 'ice') FX.shock(Q, X0, Y0, R * 1.3, cl((t - tl) / 0.8), k, h.seed); else if (h.el === 'steam') { FX.shock(Q, X0, Y0, R * 1.3, cl((t - tl) / 0.8), k, h.seed); } else FX.fireRing(Q, X0, Y0, R * (0.6 + 0.6 * cl((t - tl) / 0.6)), cl((t - tl) / 0.6), k, h.seed, 1); } Q.glow(X0, Y0, R * 1.2, col, 0.4 * k); }
        break; }
      case 'ring': { if (h.gap != null) { drawGapRing(Q, h, T, X0, Y0, col, u, post); break; } if (t < tl) { Q.glow(X0, Y0, T * 1.2, col, 0.3 * u); break; } const R = (h.R || h.r0) * T, k = 1 - post, front = cl((t - tl) / h.act);
        if (FX && h.el === 'fire') FX.fireRing(Q, X0, Y0, R, 0.92, k * (1 - front * 0.4), h.seed, 1); else if (FX && h.el === 'ice') FX.frostRing(Q, X0, Y0, R, 0.92, k * (1 - front * 0.4), h.seed, 1); else Q.ring(X0, Y0, R, col, 0.8 * k * (1 - front * 0.4), T * h.w * 0.8);
        if (h.gap != null) { const gx = Math.cos(h.gap), gy = Math.sin(h.gap); wedgeQuad(Q, X0, Y0, h.gap, h.gapW, Math.max(T, R + T), COL.white, 0.55 * k, 1, 0); void gx; void gy; }
        break; }
      case 'cone': { const len = h.len * T; if (h.vis === 'tell' || t < tl) { if (t < tl) { wedgeQuad(Q, X0, Y0, h.a, h.half, len, col, 1, u, 0);
            // (a sweep's direction: three sparks running along its arc from where it starts to where it ends)
            if (h.a1 != null) for (let i = 0; i < 3; i++) { const v = ((t * 1.4 + i / 3) % 1), aa = lerp(h.a0, h.a1, v), rr = len * 0.72; Q.star(X0 + Math.cos(aa) * rr, Y0 + Math.sin(aa) * rr, T * 0.32, 0.5 + 0.5 * u, COL.white); } } break; }
        if (on) wedgeQuad(Q, X0, Y0, h.a, h.half, len, col, 0.8, 1, 1); break; }
      case 'line': { const len = h.len * T, x1 = X0 + Math.cos(h.a) * len, y1 = Y0 + Math.sin(h.a) * len; if (t < tl) { Q.beam(X0, Y0, x1, y1, T * h.w * 0.5, col, 0.2 + 0.45 * u); if (h.a1 != null) for (let i = 0; i < 3; i++) { const v = ((t * 1.4 + i / 3) % 1), aa = lerp(h.a0, h.a1, v), rr = len * 0.7; Q.star(X0 + Math.cos(aa) * rr, Y0 + Math.sin(aa) * rr, T * 0.32, 0.5 + 0.5 * u, COL.white); } break; } if (on) Q.beam(X0, Y0, x1, y1, T * h.w * 0.62, col, 0.55); break; }
      case 'bolt': { if (t < tl) { const L = h.len * T; Q.beam(X0, Y0, X0 + Math.cos(h.a) * L, Y0 + Math.sin(h.a) * L, T * 0.12, col, 0.25 + 0.5 * u); } break; }
      case 'cross': { if (t < tl) { for (const a of [h.a, h.b]) { const L = h.len * T; Q.beam(X0 - Math.cos(a) * L, Y0 - Math.sin(a) * L, X0 + Math.cos(a) * L, Y0 + Math.sin(a) * L, T * h.w * 0.35, a === h.a ? COL.fire : COL.ice, 0.2 + 0.4 * u); } } break; }
      default: break;
    }
  }
  function drawGapRing(Q, h, T, X0, Y0, col, u, post) {
    const FX = FXP(), t = h.t, tl = h.tell, Rmax = h.r1 * T;
    // its corridor (the gap's path) lit from the source before and while it runs: stand in it
    wedgeQuad(Q, X0, Y0, h.gap, h.gapW, Math.min(Rmax, AR.R * 2.2 * T), COL.white, t < tl ? 0.4 + 0.6 * u : 0.75 * (1 - post), t < tl ? u : 1, 0);
    Q.glow(X0, Y0, T * (1.2 + u), col, 0.4 * (t < tl ? u : 1 - post));
    if (t < tl) return; const R = (h.R || h.r0) * T, k = 1 - post, N = Math.max(24, Math.min(72, Math.round(R / (T * 0.6))));
    for (let i = 0; i < N; i++) { const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, am = (a0 + a1) / 2; if (Math.abs(angD(am, h.gap)) < h.gapW) continue; const x0 = X0 + Math.cos(a0) * R, y0 = Y0 + Math.sin(a0) * R, x1 = X0 + Math.cos(a1) * R, y1 = Y0 + Math.sin(a1) * R;
      Q.beam(x0, y0, x1, y1, T * h.w * 0.55, col, 0.7 * k); if (FX && i % 2 === 0) (h.el === 'fire' ? FX.trailFire : FX.trailIce)(Q, x0, y0, X0 + Math.cos(a1 + (a1 - a0)) * R, Y0 + Math.sin(a1 + (a1 - a0)) * R, T * h.w * 0.7, 0.8 * k, i * 0.13); }
  }
  function drawFxGround(Q, f, T, FX) {
    const u = cl(f.t / f.life), X0 = sx(f.x), Y0 = sy(f.y), k = 1 - u;
    if (f.kind === 'land' || f.kind === 'roarwave') { if (FX) { FX.fireRing(Q, X0, Y0, f.R * T * eout(u), 0.92, k, f.seed, 1); FX.frostRing(Q, X0, Y0, f.R * T * eout(u) * 0.9, 0.92, k, f.seed + 2, 1); } else Q.ring(X0, Y0, f.R * T * eout(u), COL.white, k, T * 0.3); }
    else if (f.kind === 'shatter') { if (FX) { FX.fireRing(Q, X0, Y0, f.R * T * eout(u), 0.9, k * 1.2, f.seed, 1); FX.frostRing(Q, X0, Y0, f.R * T * eout(u) * 0.85, 0.9, k * 1.2, f.seed + 3, 1); FX.shock(Q, X0, Y0, T * 2.4, u, k, f.seed); } }
    else if (f.kind === 'judge') { const R = f.R * T * eout(u); if (FX && f.el === 'fire') { FX.fireRing(Q, X0, Y0, R, 0.9, k * 1.3, f.seed, 1); FX.fireField(Q, X0, Y0, R, 1, 0.5 * k, f.seed, 1, 1); } else if (FX) { FX.frostRing(Q, X0, Y0, R, 0.9, k * 1.3, f.seed, 1); FX.iceField(Q, X0, Y0, R, 1, 0.5 * k, f.seed, 1); } }
    else if (f.kind === 'ward') { const R = f.R * T * (0.7 + 0.3 * eout(u)); Q.quad(491, X0, Y0, R, 0, 0, R, '#FFFFFF', k, (f.el === 'fire' ? 0 : f.el === 'ice' ? 1 : 2) + 0.98, S.t, 0); Q.ring(X0, Y0, R * 0.8, COL.white, k * 0.8, T * 0.12); }
    else if (f.kind === 'erupt' && FX) FX.fireField(Q, X0, Y0, f.R * T, sstep(0, 0.3, u), k, f.seed, 1, 1);
    else if (f.kind === 'blizzard' && FX) FX.iceField(Q, X0, Y0, f.R * T, sstep(0, 0.3, u), k, f.seed, 1);
  }
  function drawGround2d(c) {
    // without the GPU painter: the same tells as soft strokes (every one readable), the sector states as tinted wedges
    const T = Tz(), Ox = sx(AR.cx), Oy = sy(AR.cy), R = AR.R * T; c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) for (const cc of SEC[i].cells) { const a = secA(i); c.fillStyle = cc.st === 1 ? 'rgba(255,120,40,' + (0.25 * cc.k).toFixed(3) + ')' : cc.st === 2 ? 'rgba(110,200,255,' + (0.25 * cc.k).toFixed(3) + ')' : 'rgba(255,250,240,' + (0.22 * cc.k).toFixed(3) + ')';
      c.beginPath(); c.arc(Ox, Oy, Math.max(1, cc.ro * R), a - PI / 8, a + PI / 8); c.arc(Ox, Oy, Math.max(0.5, cc.ri * R), a + PI / 8, a - PI / 8, true); c.closePath(); c.fill(); }
    c.strokeStyle = 'rgba(255,240,210,.35)'; c.lineWidth = 2; c.beginPath(); c.arc(Ox, Oy, R, 0, TAU); c.stroke();
    for (const h of S.haz) { const u = cl(h.t / Math.max(0.01, h.tell)), X0 = sx(h.x), Y0 = sy(h.y), col = h.el === 'fire' ? '255,140,60' : h.el === 'ice' ? '130,210,255' : '255,250,240', a = h.t < h.tell ? 0.25 + 0.5 * u : 0.7;
      c.strokeStyle = `rgba(${col},${a.toFixed(3)})`; c.fillStyle = `rgba(${col},${(a * 0.25).toFixed(3)})`; c.lineWidth = 2.5;
      if (h.kind === 'disc') { c.beginPath(); c.arc(X0, Y0, h.r * T, 0, TAU); c.fill(); c.stroke(); }
      else if (h.kind === 'ring' && h.t > h.tell) { c.lineWidth = h.w * T * 0.7; c.beginPath(); c.arc(X0, Y0, Math.max(1, (h.R || h.r0) * T), 0, TAU); c.stroke(); }
      else if (h.kind === 'cone') { c.beginPath(); c.moveTo(X0, Y0); c.arc(X0, Y0, h.len * T, h.a - h.half, h.a + h.half); c.closePath(); c.fill(); c.stroke(); }
      else if (h.kind === 'line') { c.lineWidth = h.w * T; c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X0 + Math.cos(h.a) * h.len * T, Y0 + Math.sin(h.a) * h.len * T); c.stroke(); } }
    c.restore();
    if (S.mech && MI[S.mech.id].draw2d) MI[S.mech.id].draw2d(S.mech, c);
  }
  /* the props: Raziel's meshes (one RAZIEL_GL.drawParts pass each half: north ones under the field, south ones over it) */
  const PL = [];
  function drawProps(c, south) {
    const G = GLR(); if (!G || !glOn()) return; const T = Tz(), t = S.t, ph = S.phase, lev = ph >= 5 ? 0.35 + 0.1 * Math.sin(t * 0.8) : 0, list = PL; list.length = 0;
    const add = (e, y) => { if ((y > AR.cy + 2.5) === south) list.push(e); };
    const u = T * 0.6;   // (px a model unit, measured: a ring fragment is ~2.3 units across, so ~1.4 tiles at u; a crown ~2.7, a sun ~4.3)
    for (const p of GEO.pylons) { const X0 = sx(p.x), Y0 = sy(p.y) - T * lev; const sd = p.el === 'ice' ? 'R' : 'L';
      add({ m: p.el === 'ice' ? 'ringR' : 'ringL', X: X0, Y: Y0 - T * 1.5, s: u * 1.2, yaw: t * 0.6, tilt: 1.1, side: sd, g: 0.6, t }, p.y);
      add({ m: p.el === 'fire' ? 'ringL' : 'ringR', X: X0, Y: Y0 - T * 2.4, s: u * 0.95, yaw: -t * 0.8, tilt: 0.9, side: sd, g: 0.6, t }, p.y);
      add({ m: p.el === 'ice' ? 'shard' : p.el === 'fire' ? 'ember' : 'shard', X: X0, Y: Y0 - T * 3.2, s: u * 1.1, yaw: t * 0.5, tilt: 0.2, side: p.el === 'fire' ? 'L' : 'R', g: 1.2, t }, p.y); }
    for (const p of GEO.anchors) { const X0 = sx(p.x), Y0 = sy(p.y) - T * lev * 0.6; add({ m: p.el === 'fire' ? 'crownL' : 'crownR', X: X0, Y: Y0 - T * 0.35, s: u * 1.1, yaw: t * 0.25, tilt: 1.25, h: p.open, g: 0.4 + p.glow, t }, p.y); }
    for (const p of GEO.mirrors) { const X0 = sx(p.x), Y0 = sy(p.y) - T * lev * 0.5; add({ m: 'ringL', X: X0, Y: Y0 - T * 1.6, s: u * 1.5, yaw: p.rot, tilt: 0.05, side: 'L', g: 0.4 + p.lit, t }, p.y); add({ m: 'ringR', X: X0, Y: Y0 - T * 1.6, s: u * 1.25, yaw: -p.rot * 1.3 + 1.2, tilt: 0.25, side: 'R', g: 0.4 + p.lit, t }, p.y); add({ m: 'shard', X: X0, Y: Y0 - T * 1.6, s: u * 0.9, yaw: t * 0.7, tilt: 0.1, side: 'R', g: 1.0 + p.lit, t }, p.y); }
    if (!lowFx()) for (const r of GEO.ringsOut) { const a = r.a + t * 0.02 * (ph >= 4 ? 2.5 : 1), rr = r.r + (ph >= 4 ? 0.8 + 0.6 * Math.sin(t * 0.4 + r.a) : 0), p = at(a, rr), sd = Math.cos(a) < 0 ? 'L' : 'R';
      add({ m: sd === 'L' ? 'ringL' : 'ringR', X: sx(p.x), Y: sy(p.y) - T * (r.h + (ph >= 4 ? 0.8 : 0) + lev), s: u * r.s, yaw: t * r.spin + r.a, tilt: 0.6 + 0.4 * Math.sin(t * 0.3 + r.a) * (ph >= 4 ? 2 : 0.4), side: sd, g: 0.35, t }, p.y); }
    if (S.mech && MI[S.mech.id].props) MI[S.mech.id].props(S.mech, add, u);
    if (!list.length) return; list.sort((p, q) => (p.z == null ? p.Y : p.z) - (q.z == null ? q.Y : q.z)); try { if (G.drawParts(c, list, { res: 0.85 })) S.glN = (S.glN || 0) + 1; } catch (e) {}
  }
  /* the body: RAZIEL_GL (or the Gemini Anima's existing art without a real GPU), faded while the pet stands behind it */
  function drawBodyLayer(c) {
    const B = S.B, m = S.m, me = S.me, T = Tz(), X0 = sx(m.x), Y0 = sy(m.y), size = T * TUNE.size, G = GLR(), P = S.P;
    // (prevent its body hiding the pet: behind it (north of its feet, inside its drawn box) it thins)
    const bb = B.A && B.A.bb, ps = { x: sx(me.x), y: sy(me.y) }, behind = bb && me.y < m.y + 0.3 && ps.x > bb[0] + 10 && ps.x < bb[2] - 10 && ps.y > bb[1] && ps.y < bb[3];
    B.obs += ((behind ? 0.42 : 1) - B.obs) * 0.15; const al = B.obs;
    if (G && glOn()) { const r = G.draw(c, X0, Y0, size, P, { tile: T, alpha: al }); if (r) { S.glN = (S.glN || 0) + 1; B.A = r; if (gpu()) bodyLight(c, r); } else B.A = G.solve ? G.solve(X0, Y0, size, P, { tile: T }) : null; }
    else { if (G && G.solve) B.A = G.solve(X0, Y0, size, P, { tile: T }); c.save(); try { AnimaArt.draw(c, 'gemini', 3, X0, Y0 - B.fly * T * 1.2, size, B.at, { alpha: al * (1 - (P.dissolve || 0)), aura: false }); } catch (e) {} c.restore(); }
  }
  function bodyLight(c, r) {
    const Q = fgOpen(c), FX = FXP(), P = S.P, t = S.t;
    // the reactors and eyes (RAZIEL_GL.lights' own picture), the heads' charge in their mouths, the exposed Gemini Core
    if (r.coreL) { Q.glow(r.coreL.x, r.coreL.y, r.coreL.r * 3.0, '#FF8A2A', 0.38 + 0.2 * (P.final || 0)); Q.glow(r.coreR.x, r.coreR.y, r.coreR.r * 3.0, '#3FA8FF', 0.38 + 0.2 * (P.final || 0)); }
    if (r.eyesL) for (const e of r.eyesL) Q.glow(e[0], e[1], r.unit * 0.5, '#FFB040', 0.6); if (r.eyesR) for (const e of r.eyesR) Q.glow(e[0], e[1], r.unit * 0.5, '#7FE0FF', 0.6);
    if (FX && r.mouthL && P.chargeL > 0.05) FX.charge(Q, r.mouthL.x, r.mouthL.y, r.unit * 2.2, 'L', P.chargeL, 1, 3);
    if (FX && r.mouthR && P.chargeR > 0.05) FX.charge(Q, r.mouthR.x, r.mouthR.y, r.unit * 2.2, 'R', P.chargeR, 1, 5);
    if (S.vuln && r.coreL) { const V = S.vuln, k = sstep(0, 0.4, V.t) * (1 - sstep(V.dur - 0.5, V.dur, V.t)), cx = (r.coreL.x + r.coreR.x) / 2, cy = (r.coreL.y + r.coreR.y) / 2, pul = 0.5 + 0.5 * Math.sin(t * 6);
      Q.glow(cx, cy, r.unit * (3 + 1.5 * pul) * 1, COL.white, (0.25 + 0.2 * pul) * k); Q.star(cx, cy, r.unit * 1.6, 0.7 * k, COL.white); if (FX) FX.bridge(Q, r.coreL.x, r.coreL.y, r.coreR.x, r.coreR.y, r.unit * 0.8, 0.8 * k, 3, 2); }
    fgClose(c);
  }
  /* the sky: breaths, spheres, the mechanic's air (crowns, phantoms, portals), the seal breaking over the pet */
  function drawSkyLayer(c) {
    const T = Tz(), on = gpu(), A = S.B.A;
    if (S.mech && MI[S.mech.id].drawAirGL) try { MI[S.mech.id].drawAirGL(S.mech, c); } catch (e) {}
    if (!on) return;
    const Q = fgOpen(c), FX = FXP(), t = S.t;
    for (const h of S.haz) drawHazAir(Q, h, T, A, FX);
    for (const f of S.fx) drawFxAir(Q, f, T, FX);
    if (S.mech && MI[S.mech.id].drawAir) MI[S.mech.id].drawAir(S.mech, Q, c);
    if (S.burn > 0 && FX) { const me = S.me; FX.embers(Q, sx(me.x), sy(me.y) - T * 0.4, T * 0.7, (t * 0.8) % 1, 0.7, 4, 0.6); }
    if (S.mode === 'dead') drawDefeatAir(Q, T, FX);
    fgClose(c);
  }
  function mouthOf(src, A) { const mo = A && (src === 'L' ? A.mouthL : A.mouthR); return mo ? { x: mo.x, y: mo.y } : null; }
  function drawHazAir(Q, h, T, A, FX) {
    if (!FX) return; const t = h.t, tl = h.tell, on = t >= tl && t <= tl + h.act + 0.1, X0 = sx(h.x), Y0 = sy(h.y);
    if ((h.vis === 'breathF' || h.vis === 'breathI') && on) { const mo = mouthOf(h.src, A) || { x: X0, y: Y0 - T * 3 }, L = h.kind === 'cone' ? h.len : h.len, x1 = sx(h.x + Math.cos(h.a) * L), y1 = sy(h.y + Math.sin(h.a) * L), k = 1 - sstep(tl + h.act - 0.15, tl + h.act + 0.1, t);
      if (h.vis === 'breathF') FX.fireStream(Q, mo.x, mo.y, x1, y1, T * (h.kind === 'cone' ? 1.6 : 0.8), 0.9, k, h.seed, 0.1); else FX.iceStream(Q, mo.x, mo.y, x1, y1, T * 0.75, k, h.seed, 0.05); }
    if ((h.vis === 'meteorF' || h.vis === 'meteorI') && t < tl + 0.05) { const u = cl(t / tl), ox = sx(h.ox), oy = sy(h.oy) - T * 3.5, x = lerp(ox, X0, u), y = lerp(oy, Y0, u) - Math.sin(u * PI) * T * 4; if (h.vis === 'meteorF') FX.sun(Q, x, y, T * 0.7, 1, h.seed, t, 1); else FX.planet(Q, x, y, T * 0.7, 1, h.seed, t, 0); }
    if (h.vis === 'erupt' && t > tl && t < tl + h.act + h.fade) { const u = cl((t - tl) / (h.act + h.fade)); Q.fire(X0, Y0 - T * 1.2 * (1 - u * 0.4), T * h.r * 0.9 * (1 - u * 0.5), 1, 1 - u, h.seed, 1.6); FX.embers(Q, X0, Y0 - T, T * h.r, u, 1 - u, h.seed, 1); }
    if (h.vis === 'steam' && t > tl && t < tl + h.act + h.fade) { const u = cl((t - tl) / (h.act + h.fade)); FX.steam(Q, X0, Y0 - T * 0.8 * u, T * h.r * (0.8 + 0.7 * u), 0.55 * (1 - u), h.seed); }
    if (h.vis === 'shock' && t > tl && t < tl + h.act + h.fade) { const u = cl((t - tl) / 0.9); FX.shock(Q, X0, Y0 - T * 0.6, T * h.r * 1.4, u, 1, h.seed); }
    if (h.vis === 'iceburst' && t > tl && t < tl + h.act + h.fade) { const u = cl((t - tl) / 0.9); FX.shock(Q, X0, Y0 - T * 0.5, T * h.r * 1.4, u, 1, h.seed); FX.snow(Q, X0, Y0 - T, T * h.r * 1.2, u, 1 - u, h.seed, 1.2, 0.3); }
    if (h.vis === 'wingwave' && on) { const L = h.len * T, x1 = X0 + Math.cos(h.a) * L, y1 = Y0 + Math.sin(h.a) * L; Q.beam(X0, Y0, x1, y1, T * h.w * 0.7, COL.white, 0.7); Q.beam(X0, Y0, x1, y1, T * h.w * 0.25, COL.pale, 0.9); }
    if (h.vis === 'slam' && t > tl - 0.05 && t < tl + 0.6) { const u = cl((t - tl) / 0.6); Q.star(X0, Y0, T * (1 + 2 * u), 1 - u, COL.white); }
  }
  function drawFxAir(Q, f, T, FX) {
    if (!FX) return; const u = cl(f.t / f.life), X0 = sx(f.x), Y0 = sy(f.y), k = 1 - u;
    if (f.kind === 'erupt') { Q.fire(X0, Y0 - T * 2, T * 2.2 * (0.6 + u), 1, k, f.seed, 1.4); FX.embers(Q, X0, Y0 - T * 2, T * 3, u, k, f.seed, 1); }
    else if (f.kind === 'blizzard') FX.snow(Q, X0, Y0 - T * 2, T * 3.2, u, k, f.seed, 1, 0.8);
    else if (f.kind === 'frag') { if (f.side === 'L') FX.embers(Q, X0, Y0 - T * 1.7, T * f.R * (0.6 + u), u, k, f.seed, 1.5); else FX.snow(Q, X0, Y0 - T * 1.7, T * f.R * (0.6 + u), u, k, f.seed, 1.5, 0.3); Q.star(X0, Y0 - T * 1.7, T * (0.6 + u), k, COL.white); }
    else if (f.kind === 'coreburst') { FX.shock(Q, X0, Y0 - T * 0.8, T * f.R * 1.4, u, 1, f.seed); Q.glow(X0, Y0 - T, T * f.R * (0.8 + u), f.side === 'L' ? COL.fire : COL.ice, 0.5 * k); }
    else if (f.kind === 'crownbreak') { const A = S.B.A; for (let s2 = 0; s2 < 2; s2++) { const cr = A && (s2 ? A.crownR : A.crownL), x = cr ? cr.x : X0 + (s2 ? 1 : -1) * T * 2, y = (cr ? cr.y : Y0 - T * 6) + u * u * T * 6; FX.shock(Q, x, y, T * 2.2, u, k, f.seed + s2); for (let i = 0; i < 5; i++) Q.star(x + Math.cos(i * 1.3 + s2) * T * 2.5 * u, y + Math.sin(i * 1.3) * T * u + u * u * T * 3, T * 0.4, k, s2 ? COL.ice : COL.gold); } }
    else if (f.kind === 'corehome') { const e = eout(u), x = lerp(X0, sx(f.tx), e), y = lerp(Y0 - T * 1.7, sy(f.ty) - T * 3.2, e) - Math.sin(u * PI) * T * 1.5; Q.glow(x, y, T * (1.4 - 0.6 * u), COL.white, 0.7 * k); Q.star(x, y, T * 0.8, k, COL.white); }
  }

  /* ================= the encounter UI: a boss bar like the other gates' (Asmodeus's stacked bars, their count, the phase pips), the
     pet's Fire / Ice status; while a great judgement runs, a small hint under it (its name, what to do, its timer) ================= */
  const BARCOL = ['#FF8A3A', '#7FD8FF', '#FFC24D', '#A8C8F0', '#FFB070', '#C9B0FF', '#FFE2B0', '#5FB8F0'];
  const hexA = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  function drawHud(c, W) {
    if (S.mode === 'over') return; const m = S.m, t = S.t, bar = m.maxhp / TUNE.bars, left = S.mode === 'dead' ? 0 : Math.max(0, m.hp);
    const n = Math.max(0, Math.ceil(left / bar - 1e-9)), cur = n ? (left - (n - 1) * bar) / bar : 0;
    S.barShow = S.barShow == null ? n - 1 + cur : S.barShow + ((n - 1 + cur) - S.barShow) * 0.06; if (Math.abs(S.barShow - (n - 1 + cur)) > 1.2) S.barShow = n - 1 + cur;
    const bw = Math.min(150, W * 0.38), x0 = W - 12 - bw, by = 10 + Math.min(88, W * 0.24) + 14;
    c.save(); c.globalAlpha = 0.92;
    GFX.labelS(c, 'Raziel, The Twin Revelation', x0 + bw, by - 11, 8, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'right');
    for (let i = 0; i < 5; i++) { const px = x0 + bw - 26 - (4 - i) * 8, onP = i < S.phase; c.fillStyle = onP ? (i % 2 ? COL.ice : COL.gold) : 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(px, by - 3.5); c.lineTo(px + 3, by); c.lineTo(px, by + 3.5); c.lineTo(px - 3, by); c.closePath(); c.fill(); }
    const bh = 5, yb = by + 7, ci = Math.max(0, n - 1), under = n > 1 ? BARCOL[(ci - 1) % BARCOL.length] : null, colNow = BARCOL[ci % BARCOL.length];
    c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, x0 - 1, yb - 1, bw + 2, bh + 2, 4); c.fill();
    if (under) { c.fillStyle = hexA(under, 0.6); GFX.rr(c, x0, yb, bw, bh, 3); c.fill(); }
    const showCur = cl(S.barShow - ci); if (showCur > cur) { c.fillStyle = 'rgba(255,255,255,.7)'; GFX.rr(c, x0, yb, Math.max(6, bw * showCur), bh, 3); c.fill(); }
    if (cur > 0) { c.fillStyle = colNow; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh * 0.4, 2); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 1; i < 5; i++) c.fillRect(x0 + bw * i / 5, yb + 1, 1, bh - 2);
    if (S.vuln) { c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 7); c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.2; GFX.rr(c, x0 - 1.5, yb - 1.5, bw + 3, bh + 3, 4); c.stroke(); c.globalAlpha = 0.92; }
    GFX.labelS(c, `×${n}`, x0 + bw, by, 9, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'right');
    const stx = S.prot ? (S.prot === 'fire' ? 'FIRE PROTECTION' : 'ICE PROTECTION') : S.burn > 0 ? 'BURNING' : S.me.chill > 0 ? 'FROST' : '';
    if (stx) GFX.labelS(c, stx, x0 + bw, yb + bh + 9, 6.5, 800, S.prot === 'fire' || (!S.prot && S.burn > 0) ? COL.fire : COL.ice, 'rgba(0,0,0,.75)', 2.5, 'right');
    // a great judgement's hint: its name, what to do now, its timer
    const Mx = S.mech; if (Mx && S.mode === 'mech') { const h = (MI[Mx.id].hud && MI[Mx.id].hud(Mx)) || {}, pw = Math.min(200, W - 24), px0 = (W - pw) / 2, py0 = by + 26;
      c.fillStyle = 'rgba(8,6,16,.55)'; GFX.rr(c, px0, py0, pw, h.bar != null ? 34 : 26, 8); c.fill();
      GFX.labelS(c, MECH[Mx.id].name, W / 2, py0 + 10, 8, 900, COL.warn, 'rgba(0,0,0,.7)', 3, 'center');
      GFX.labelS(c, h.say || Mx.goal || MECH[Mx.id].tip, W / 2, py0 + 21, 7, 700, '#FFFFFF', 'rgba(0,0,0,.6)', 2.5, 'center');
      if (h.bar != null) { const bw2 = pw - 24; c.fillStyle = 'rgba(0,0,0,.6)'; GFX.rr(c, px0 + 11, py0 + 26, bw2 + 2, 5, 2.5); c.fill(); c.fillStyle = h.barCol || '#FFFFFF'; GFX.rr(c, px0 + 12, py0 + 27, Math.max(3, bw2 * cl(h.bar)), 3, 1.5); c.fill(); }
      if (MI[Mx.id].pointers) { try { const P2 = MI[Mx.id].pointers(Mx); if (P2) for (const q of P2) edgeArrow(c, W, q); } catch (e) {} } }
    if (S.mode === 'dead' && S.dead.t > DEF.text) { const u = sstep(DEF.text, DEF.text + 0.6, S.dead.t); c.globalAlpha = u; GFX.labelS(c, S.dead.first === false ? 'TRIAL COMPLETE' : 'LEGENDARY ANIMA UNLOCKED', W / 2, S.X.H() * 0.36, 13, 900, COL.gold, 'rgba(0,0,0,.75)', 4, 'center'); }
    c.restore();
  }
  // an arrow at the screen's edge toward a target off the screen (a sanctuary, an anchor, a mirror, a fragment)
  function edgeArrow(c, W, q) { const Hh = S.X.H(), X0 = sx(q.x), Y0 = sy(q.y), m0 = 26, top = 150, bot = 170; if (X0 > m0 && X0 < W - m0 && Y0 > top && Y0 < Hh - bot) return;
    const cx = W / 2, cy = (top + Hh - bot) / 2, dx = X0 - cx, dy = Y0 - cy, a = Math.atan2(dy, dx), kx = (W / 2 - m0) / Math.max(1e-6, Math.abs(dx)), ky = ((Hh - bot - top) / 2) / Math.max(1e-6, Math.abs(dy)), k = Math.min(kx, ky), ex = cx + dx * k, ey = cy + dy * k;
    c.save(); c.translate(ex, ey); c.rotate(a); c.globalAlpha = 0.75 + 0.25 * Math.sin(S.t * 6); c.fillStyle = q.col || '#FFFFFF'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(12, 0); c.lineTo(-7, -9); c.lineTo(-3, 0); c.lineTo(-7, 9); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  function drawDefeatAir(Q, T, FX) {
    const D = S.dead, t = D.t, A = S.B.A, B = S.B; if (!A) return;
    // the cores part into two small stars that float to their heads; the crowns fall into two Gemini symbols that circle and merge
    if (t > DEF.cores && FX && A.coreL && A.mouthL) { const u = sstep(DEF.cores, DEF.eq, t), k = 1 - sstep(DEF.text, DEF.text + 1.5, t), cx = (A.coreL.x + A.coreR.x) / 2, cy = (A.coreL.y + A.coreR.y) / 2;
      const lx = lerp(cx, A.mouthL.x, u), ly = lerp(cy, A.mouthL.y, u) - Math.sin(u * PI) * T, rx = lerp(cx, A.mouthR.x, u), ry = lerp(cy, A.mouthR.y, u) - Math.sin(u * PI) * T;
      FX.sun(Q, lx, ly, T * 0.35, k, 3, t, 1); FX.planet(Q, rx, ry, T * 0.35, k, 5, t, 0); if (t > DEF.eq) FX.bridge(Q, lx, ly, rx, ry, T * 0.3, k * sstep(DEF.eq, DEF.eq + 0.5, t), 7, 3); }
    if (t > DEF.seal && FX) { const u = sstep(DEF.seal, DEF.text, t), X0 = sx(B.x), Y0 = sy(B.y) - T * (4.5 + u), R = T * (0.9 + 0.3 * u), orb = T * 1.8 * (1 - u), an = t * (2 + 4 * u);
      if (u < 0.98) { FX.seal(Q, X0 + Math.cos(an) * orb, Y0 + Math.sin(an) * orb * 0.5, R, 'L', 1, t, 1, 1); FX.seal(Q, X0 - Math.cos(an) * orb, Y0 - Math.sin(an) * orb * 0.5, R, 'R', 1, -t, 1, 1); }
      if (u > 0.85) { const v = sstep(0.85, 1, u), k2 = 1 - sstep(DEF.win - 1.2, DEF.win, t); FX.seal(Q, X0, Y0, R * (1.3 + 0.4 * v), 'L', 1 + v, t * 0.5, k2, 1); FX.seal(Q, X0, Y0, R * (1.2 + 0.4 * v), 'R', 1 + v, -t * 0.5, k2, 1); Q.star(X0, Y0, T * (1 + v), k2, COL.white); } }
  }

  /* ---- for the harness ---- */
  const test = {
    get S() { return S; }, AR, GEO, MI, secOf, polar, secNear: (i, x, y, mg) => secNear(i, x, y, mg), secReach: (a, b) => secReach(a, b), realK: () => (S ? realK() : 0),
    skipIntro() { if (S && S.mode === 'intro') { S.introT = TUNE.intro - 0.01; S.g.bossIntro = 0; } },
    setK(k) { if (!S) return; S.m.hp = Math.max(1, S.m.maxhp * k); S.lastM = S.m.hp; },
    noBig(on) { if (S) S.noBig = !!on; },
    // (a great judgement now, out of turn: the harness's)
    start(id) { if (!S) return; if (S.mode === 'trans') { S.trans = null; S.mode = 'fight'; } if (S.mech) endMech(); S.vuln = null; startMech(id); return S.mech; },
    act(kind) { if (!S || S.mode !== 'fight') return null; abortActs(); S.idleT = 99; S.bigT = 99; return startAct(kind); },
    trans(ph) { if (S) startTrans(ph); }, endMech: () => endMech(),
    // (for the bots: is (x, y) inside a blow that lands within `lead` s, or is landing now)
    danger(x, y, lead) { if (!S) return false; lead = lead == null ? 0.6 : lead; for (const h of S.haz) { if (h.t + lead < h.tell || h.t > h.tell + h.act + 0.05) continue; if (h.cosmetic && h.t > h.tell) continue;
        if (h.kind === 'ring') { const u0 = cl((h.t - h.tell) / h.act), u1 = cl((h.t + lead - h.tell) / h.act), r0 = h.r0 + (h.r1 - h.r0) * u0, r1 = h.r0 + (h.r1 - h.r0) * u1, d = Math.hypot(x - h.x, y - h.y); if (d > r0 - h.w - 0.4 && d < r1 + h.w + 0.4) { if (h.gap != null && Math.abs(angD(Math.atan2(y - h.y, x - h.x), h.gap)) < h.gapW) continue; return true; } continue; }
        if (h.kind === 'cone' && h.a1 != null && h.t < h.tell) { const d = Math.hypot(x - h.x, y - h.y), a = Math.atan2(y - h.y, x - h.x), lo = Math.min(h.a0, h.a1) - h.half - 0.15, hi = Math.max(h.a0, h.a1) + h.half + 0.15, mid = (lo + hi) / 2; if (d < h.len + 0.6 && Math.abs(angD(a, mid)) < (hi - lo) / 2) return true; continue; }
        if (h.kind === 'line' && h.a1 != null && h.t < h.tell + h.act) { const d = Math.hypot(x - h.x, y - h.y), a = Math.atan2(y - h.y, x - h.x), lo = Math.min(h.a0, h.a1) - 0.2, hi = Math.max(h.a0, h.a1) + 0.2, mid = (lo + hi) / 2; if (d < h.len + 0.8 && Math.abs(angD(a, mid)) < (hi - lo) / 2) return true; continue; }
        const g0 = Object.assign({}, h); if (h.kind === 'disc') g0.r = h.r + 0.35; if (h.kind === 'line') g0.w = h.w + 0.7; if (petIn(g0, x, y)) return true; } return false; },
  };
  return { begin, update, stop, active, attach, warm, floor: floorTile, drawGround() {}, drawOver() {}, cam, goal, hideHud, onBossDeath, TUNE, MECH, test };
})();
if (typeof window !== 'undefined') window.GEMINI_BOSS = GEMINI_BOSS;
