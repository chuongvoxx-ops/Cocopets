/* ---------- v463 ST: The Sepulchre of Borrowed Hours' traps (Rift 04: its two dungeons, its two trials and two of its mob stages) ----------
   Nine original traps, three to each of the rift's lands, laid through the Clockless Hall and the Corner Kennels (rooms and glass
   bridges), and a few in the Hour Court, the Hall in Two Ages, the Three Statues and the Rolling Hour where they cannot touch the
   rules (kept off every piece, lever, thrower, statue, guard and the way on; in the Statues and the Rolling Hour they never touch
   the monsters, so the mob's numbers and the kills stay as they were). None in the Borrowed Beast or the Room That Remembers
   (puzzles whose pieces are placed by where you stand) and none in the boss arenas. Each TELLS by its own glow and motion only
   (no red area circles, no countdowns):
   Section 1, the Clockless Halls (blue-black tomb stone, silver and old gold, lit by gold):
     pend   PENDULUM BLADES     a gilded crescent blade swinging on a long rod out of the dark over a gold-lipped slot: it swings
                                for ever, the slot's light running ahead of it; cross behind it (or roll)
     clock  STOPPED-CLOCK HANDS a great clock face inlaid in the floor, its hands still: step on it and its hour marks light one
                                by one round the dial as the long hand trembles, then the hand sweeps one full turn (r 1.2)
     stall  TIME-STALL POOLS    a gold-rimmed basin of stopped time, black as a mirror with motes frozen in it: it slows the pet
                                (and the monsters) inside it; no harm
   Section 2, the Hall in Two Ages (ivory marble, silver and gold under an open sky; youth and ruin):
     swap   AGE-SWAP TILES      a square of new marble with a gold hourglass inlay: its sigil brightens and violet light seeps
                                through cracks that are not there yet, then the slab ages at once (it hits what stands on it) and
                                mends again in a ring of gold
     column COLLAPSING RUIN     a broken fluted column: come near and its cracks light gold as dust trickles from it and light
                                runs along the floor where it will fall, then it topples along that lane; time raises it again
     lance  HEAVENLY LANCES     a sun inlaid in the floor: light gathers above it, a thin column from the sky widening as its rays
                                light, then a lance of light strikes it (r 0.95)
   Section 3, the Borrowed Stairs (violet stairs and glass bridges over a starless void):
     glass  CRACKING GLASS      a pane of violet glass in a silver frame: step on it and cracks run out from its middle with a
                                ringing, then it shatters under you (and the borrowed hours put it back)
     vhand  VOID HANDS          a seam in the floor where the void shows: come near and violet light wells up as long dark fingers
                                claw out, then two hands of the void burst up and grab (held a moment)
     rift   BORROWED-HOUR RIFTS a glass sigil with a tear of light hanging over it: the tear opens wider as light winds into it,
                                then the hour snaps back and a ring of violet light rolls out to 2.5 tiles: roll through it
   Damage is the floor's own (as the Garden's and the Dunes' traps): 12 x the floor's dmgMul times each kind's share, held to 4..14%
   of the pet's health, through hurtPet with no source (traps are not foes). Monsters caught take twice it where the stage allows;
   bosses and mini bosses never. A dodge roll passes through every one. Only traps within 13 tiles run (the pendulums swing on,
   cheaply); the first of each kind the pet meets in a session plays once, harmlessly ("Safe to watch"), with a banner naming its tell.
   Density: the Clockless Hall 13, the Corner Kennels 18 + 9 on the glass bridges (2.6 / 2.0 tiles apart), the Hour Court 4, the
   Hall in Two Ages 5, the Three Statues 8, the Rolling Hour 7; placed deterministically from the layout on plain floor.
   Art: every model is painted once per sharpness by the Belfry's software shading pass (BELPROPS.kit, 20n9) in its land's own light
   (gold lamplight in blue-black halls, a white noon in the two-age hall, violet void light on the stairs), with a picture of its own
   light laid over additively, so the tell reads in the picture itself. The live light is the GPU painter's (NIDHOGG_MOVES.FGFX) with
   its existing kinds: the ground light in one pass of its own, the light in the air laid into the dungeon's shared pass (20b's DQ,
   SEP_TRAPS.lay: no GPU copy of its own); nothing is painted per frame. Without WebGL the pictures and their light layers still tell
   (no new 2D effects). st.lowFx drops the calm traps' breathing light and thins the motes. In the dark halls each tell and blow
   opens a hole in the darkness (the engine's own light).
   Memory: the field and the pictures are let go when a stage is made or closed (GAMES.dungeon create / destroy, BEL.onRelease); the
   pictures are warmed on the loading screen (the stages' S.preload) for the kinds that stage uses.
   window.__SEPT = 0 turns all of it off (the floors as before); window.__SEPT_GL = 0 keeps the pictures but not the GPU light.
   API (global SEP_TRAPS): place(X, H, { sec, n, seed, count, br, kinds, teach, puzzle, mon }) -> field; clear(); release(); lay(c, Q);
   KINDS; SPEC; MIX; fields(); dmg(field, kind); stats; draw(c, name, v, Xs, Ys, T, o); sprite(name, v, P); warm(P, sec, kinds) */
var SEP_TRAPS = (() => {
  const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, hyp = Math.hypot, lerp = (a, b, u) => a + (b - a) * u, ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const W_ = () => typeof window !== 'undefined' ? window : {};
  const off = () => W_().__SEPT === 0;
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const BP = () => { const w = W_(); return (w.BELPROPS && w.BELPROPS.kit && w.__BELP !== 0 && !off()) ? w.BELPROPS : null; };
  const fgx = () => { try { if (W_().__SEPT_GL === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const hh = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const R1 = s => { let x = (s >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const wrapA = a => { a %= TAU; return a < 0 ? a + TAU : a; };
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, fields: 0, gpu: 0, laid: 0 };

  /* ======================= the kinds ======================= (times in s, sizes in tiles) */
  const KINDS = {
    pend: { land: 1, name: 'PENDULUM BLADES', tell: 'A blade swings for ever over its gold slot, the slot\'s light running ahead of it: cross just behind it as it passes, or roll', col: '#E8CF8E', hi: '#FFF4D0', dmgK: 0.9, per: [2.6, 3.2], L: 1.3, w: 0.42, lane: 0.55, cd: 0.9, shove: 1.1 },
    clock: { land: 1, name: 'STOPPED-CLOCK HANDS', tell: 'Step on the dial and its hour marks light one by one as the long hand trembles, then the hand sweeps one full turn: step off it, or roll over the hand', col: '#F2D27A', hi: '#FFF6DA', dmgK: 1.0, r: 1.2, RX: 1.3, warn: 1.0, burst: 0.55, rest: 3.2, hw: 0.2, shove: 1.2 },
    stall: { land: 1, name: 'TIME-STALL POOLS', tell: 'A pool of stopped time: everything inside it moves slowly, you and the monsters. Go round it, or roll across', col: '#E8CF8E', hi: '#FFF4D0', dmgK: 0, r: 1.12, slowK: 0.55 },
    swap: { land: 2, name: 'AGE-SWAP TILES', tell: 'The slab\'s hourglass brightens and violet light seeps through cracks that are not there yet, then it ages at once: step off it', col: '#E8C77A', hi: '#FFF6E0', dmgK: 1.0, hs: 0.8, warn: 1.3, burst: 0.5, hitW: 0.32, shove: 1.1, per: [5.0, 6.6] },
    column: { land: 2, name: 'COLLAPSING RUIN', tell: 'Come near the broken column and its cracks light as dust trickles down and light runs along the floor where it will fall: keep off that lane', col: '#FFE6A8', hi: '#FFFFFF', dmgK: 1.1, trig: 1.7, warn: 1.05, burst: 0.6, hitA: 0.2, hitW: 0.24, rest: 4.2, len: 2.3, w: 0.48, shove: 1.3 },
    lance: { land: 2, name: 'HEAVENLY LANCES', tell: 'Light gathers over the sun in the floor, a thin column from the sky widening as its rays light, then a lance strikes it: step off the sun', col: '#FFE08A', hi: '#FFFFFF', dmgK: 1.0, r: 0.95, warn: 1.4, burst: 0.5, hitW: 0.25, shove: 1.0, per: [4.4, 6.0] },
    glass: { land: 3, name: 'CRACKING GLASS', tell: 'Step on the violet pane and cracks run out from its middle, ringing, then it shatters under you: keep moving off it', col: '#C9B0FF', hi: '#F2EAFF', dmgK: 0.9, hs: 0.72, warn: 0.9, burst: 0.4, hitW: 0.25, rest: 3.4, shove: 0.8 },
    vhand: { land: 3, name: 'VOID HANDS', tell: 'Come near the seam and violet light wells up as dark fingers claw out, then two hands of the void burst up and grab: keep clear, or roll past', col: '#A880FF', hi: '#EADCFF', dmgK: 1.0, trig: 1.6, r: 1.05, warn: 0.85, burst: 0.5, hitW: 0.3, rest: 4.5, hold: 0.8, holdK: 0.15 },
    rift: { land: 3, name: 'BORROWED-HOUR RIFTS', tell: 'The tear over the sigil opens wider as light winds into it, then the hour snaps back and a ring of light rolls out along the floor: roll through the ring, or stand beyond it', col: '#9E78F0', hi: '#EEE4FF', dmgK: 0.85, R: 2.5, warn: 1.5, burst: 0.75, band: 0.36, shove: 1.3, per: [4.8, 6.4] },
  };
  /* per section: the dungeon (n in its rooms, br on its glass bridges), the rooms' mix (weights), the bridges' kinds, the spacing;
     the stages with challenges of their own: their few (kinds dealt in order), whether they may touch the monsters, how far each
     of their marks is kept clear */
  const SPEC = { 1: { n: 13, br: 2 }, 2: { n: 14, br: 4 }, 3: { n: 18, br: 9 } };
  const MIX = { 1: { pend: 4, clock: 4, stall: 3 }, 2: { swap: 4, lance: 4, column: 3 }, 3: { glass: 3, vhand: 5, rift: 4 } };
  const BRIDGE = { 1: ['pend'], 2: ['swap'], 3: ['glass', 'vhand', 'glass'] };
  const GAP = { 1: 2.6, 2: 2.3, 3: 2.0 };
  const PUZ = {
    'The Hour Court': { kinds: ['clock', 'pend', 'stall', 'clock'], n: 4, mon: false, keep: { t: 2.4, E: 2.6 } },
    'The Hall in Two Ages': { kinds: ['swap', 'lance', 'swap', 'lance', 'column'], n: 5, mon: true, keep: { L: 2.6, M: 2.6, C: 2.4, p: 1.6, f: 1.8, w: 1.9, b: 1.6, E: 2.4 } },
    'The Three Statues': { kinds: ['swap', 'lance', 'column', 'swap', 'lance', 'column', 'swap', 'lance'], n: 8, mon: false, keep: { 1: 4.2, 2: 4.2, 3: 4.2, E: 2.8 } },
    'The Rolling Hour': { kinds: ['glass', 'vhand', 'rift', 'glass', 'vhand', 'rift', 'glass'], n: 7, mon: false, keep: { E: 2.8 } } };
  const LINE = { pend: 1, column: 1 }, ZONE = { stall: 1 }, SWING = { pend: 1 }, SQ = { swap: 1, glass: 1 }, STAND = { pend: 1, column: 1, vhand: 1 }, FLY = { pend: 1, lance: 1, rift: 1, column: 1 };
  const kindsOf = sec => Object.keys(MIX[sec] || MIX[1]).concat(BRIDGE[sec] || []).filter((k, i, a) => a.indexOf(k) === i);

  /* ======================= the pictures (BELPROPS.kit, in each land's light) ======================= */
  const FR = 0.7;   // (a round thing lying on the floor, as these pictures draw it and its hit area is measured: its depth over its width)
  const LIGHTS = {   // (each land's: a0/a1 ambient low/high, e0/e1 the sky's reflection low/high, k the key, rim, bo the floor's bounce)
    1: { a0: [0.05, 0.06, 0.1], a1: [0.04, 0.05, 0.09], e0: [0.05, 0.06, 0.1], e1: [0.3, 0.3, 0.42], k: [1.24, 1.06, 0.78], rim: [0.42, 0.34, 0.16], bo: [0.05, 0.06, 0.1] },
    2: { a0: [0.22, 0.21, 0.2], a1: [0.12, 0.12, 0.16], e0: [0.2, 0.19, 0.18], e1: [0.7, 0.72, 0.8], k: [1.32, 1.26, 1.12], rim: [0.42, 0.38, 0.3], bo: [0.2, 0.18, 0.14] },
    3: { a0: [0.07, 0.04, 0.12], a1: [0.06, 0.04, 0.14], e0: [0.06, 0.04, 0.12], e1: [0.36, 0.28, 0.58], k: [0.98, 0.9, 1.2], rim: [0.5, 0.32, 0.78], bo: [0.06, 0.03, 0.12] } };
  function lit(K, land, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHTS[land] || LIGHTS[1]); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  const E = (k, r, g, b) => { const M = k.M; M.r = M.g = M.b = 0; M.fr = M.fg = M.fb = 0; M.mt = 0; M.rg = 1; M.cc = 0; M.sh = 0; M.ao = 0; M.er = r; M.eg = g; M.eb = b; };   // (a light layer: emission only)
  const CEL = [0, 0];
  function cells(x, y, sd) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, d2 = 9; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, px = cx + 0.12 + 0.76 * hh(cx * 7 + sd, cy * 13 + 1), py = cy + 0.12 + 0.76 * hh(cx * 11 + 3, cy * 5 + sd), d = hyp(x - px, y - py); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } CEL[0] = d1; CEL[1] = d2; return CEL; }
  // materials (each sets k.M)
  function slateM(k, u, v, sd) { const { M, vn, fbm } = k, g = fbm(u * 2.4 + sd, v * 2.4), p = vn(u * 30 + sd, v * 30), t = 0.8 + 0.35 * g; M.r = 0.15 * t; M.g = 0.18 * t; M.b = 0.25 * t; M.rg = 0.5; M.cc = 0.22; if (p > 0.8) { M.r *= 1.25; M.g *= 1.25; M.b *= 1.3; } if (p < 0.15) M.ao *= 0.85; }
  function goldM(k, u, v, sd, wear) { k.brass(u, v, k.M.ao, sd, wear == null ? 0.5 : wear); }
  function steelM(k, u, v, sd) { const { M, vn } = k, n = vn(u * 9 + sd, v * 9), s = vn(u * 40, v * 3 + sd); M.mt = 0.92; M.r = M.g = M.b = 0.05; M.fr = 0.34 + 0.07 * n; M.fg = 0.38 + 0.07 * n; M.fb = 0.47 + 0.07 * n; M.rg = 0.2 + 0.12 * s; }
  function silverM(k, u, v, sd) { const { M, vn } = k, n = vn(u * 7 + sd, v * 7); M.mt = 0.95; M.r = M.g = M.b = 0.06; M.fr = 0.72 + 0.08 * n; M.fg = 0.74 + 0.08 * n; M.fb = 0.8 + 0.08 * n; M.rg = 0.26 + 0.08 * n; }
  function marbleM(k, u, v, sd, ruin) { const { M, vn, fbm, ss } = k, g = fbm(u * 1.8 + sd, v * 1.8), w = fbm(u * 3.1 + g * 2.2 + sd, v * 3.1 - g * 1.7), vein = ss(0.035, 0.0, Math.abs(w - 0.5)) * 0.6 + ss(0.012, 0, Math.abs(vn(u * 6 + sd, v * 6) - 0.5)) * 0.25, t = 0.92 + 0.1 * g;
    M.r = 0.95 * t - 0.3 * vein; M.g = 0.93 * t - 0.3 * vein; M.b = 0.88 * t - 0.22 * vein; M.rg = 0.28; M.cc = 0.45;
    if (ruin) { const s2 = ss(0.35, 0.75, vn(u * 2.3 + 7, v * 2.3 + sd)), q = clamp(ruin, 0, 1) * (0.55 + 0.25 * s2); M.r = lerp(M.r, 0.55, q); M.g = lerp(M.g, 0.53, q); M.b = lerp(M.b, 0.6, q); M.rg = lerp(M.rg, 0.8, q); M.cc *= 1 - q; } }
  function lapisM(k, u, v, sd) { const { M, vn } = k, n = vn(u * 12 + sd, v * 12), f = vn(u * 40, v * 40 + sd); M.r = 0.09 + 0.04 * n; M.g = 0.15 + 0.05 * n; M.b = 0.5 + 0.12 * n; M.rg = 0.3; M.cc = 0.6; if (f > 0.9) { M.r += 0.35; M.g += 0.28; M.b -= 0.1; M.mt = 0.6; M.fr = 0.9; M.fg = 0.7; M.fb = 0.3; } }
  function vstoneM(k, u, v, sd) { const { M, vn, fbm } = k, g = fbm(u * 2.6 + sd, v * 2.6), p = vn(u * 28, v * 28 + sd), t = 0.8 + 0.35 * g; M.r = 0.18 * t; M.g = 0.14 * t; M.b = 0.31 * t; M.rg = 0.55; M.cc = 0.25; if (p > 0.8) { M.r *= 1.3; M.g *= 1.25; M.b *= 1.3; } }
  function vglassM(k, u, v, sd) { const { M, vn } = k, d = vn(u * 3 + sd, v * 3), s = vn(u * 52 + sd, v * 52); M.r = 0.08 + 0.05 * d; M.g = 0.05 + 0.03 * d; M.b = 0.2 + 0.08 * d; M.rg = 0.05; M.cc = 1; M.sh = 0.55; if (s > 0.93) { const q = (s - 0.93) / 0.07; M.er = 0.7 * q; M.eg = 0.6 * q; M.eb = 1.0 * q; } }
  function obsidM(k, u, v, sd) { const { M, vn } = k, n = vn(u * 6 + sd, v * 6), s = vn(u * 44 + sd, v * 44); M.r = 0.035 + 0.02 * n; M.g = 0.025 + 0.015 * n; M.b = 0.075 + 0.03 * n; M.rg = 0.12; M.cc = 0.9; if (s > 0.94) { M.er = 0.5; M.eg = 0.35; M.eb = 0.9; } }
  /* a thing lying on the floor: box [x0, w0, x1, w1] in the floor's own tiles (x right, w toward us), fr its depth on the picture
     (FR for round things, 1 for square slabs and lanes); hf(x, w) its height (tiles, for the light only), mf(x, w, h) sets k.M and
     returns its alpha (0: no pixel). Its normal is turned a little toward us (as the Dunes' traps, 20r4) */
  function flat(k, S, box, fr, hf, mf) { const P = S.P, e = 0.015; S.lock();
    const xa = Math.max(0, Math.floor(S.ax + box[0] * P)), xb = Math.min(S.w - 1, Math.ceil(S.ax + box[2] * P)), ya = Math.max(0, Math.floor(S.ay + box[1] * fr * P)), yb = Math.min(S.h - 1, Math.ceil(S.ay + box[3] * fr * P));
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - S.ax) / P, w = (py + 0.5 - S.ay) / P / fr; k.M0(); const h = hf(x, w), a = mf(x, w, h); if (!(a > 0.003)) continue;
      const hx = (hf(x + e, w) - hf(x - e, w)) / (2 * e), hw = (hf(x, w + e) - hf(x, w - e)) / (2 * e), nx = -hx, ny = -hw + 0.62, l = hyp(nx, ny, 1); k.shade(nx / l, ny / l, 1 / l); k.put(S, px, py, a); } }
  /* an upright plate facing us (a blade): box in picture tiles (y down); fn(x, y) sets k.M and NB (its bevel: NB[0] right, NB[1] up)
     and returns its alpha */
  const NB = [0, 0];
  function upright(k, S, box, fn) { const P = S.P; S.lock();
    const xa = Math.max(0, Math.floor(S.ax + box[0] * P)), xb = Math.min(S.w - 1, Math.ceil(S.ax + box[2] * P)), ya = Math.max(0, Math.floor(S.ay + box[1] * P)), yb = Math.min(S.h - 1, Math.ceil(S.ay + box[3] * P));
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P; k.M0(); NB[0] = NB[1] = 0; const a = fn(x, y); if (!(a > 0.003)) continue;
      const nx = NB[0], nz = NB[1], ny = Math.sqrt(Math.max(0.04, 1 - nx * nx - nz * nz)), l = hyp(nx, ny, nz); k.shade(nx / l, ny / l, nz / l); k.put(S, px, py, a); } }
  const rimOf = (k, sd, amp) => a => 1 + amp * (k.vn(Math.cos(a) * 1.7 + sd, Math.sin(a) * 1.7) - 0.5) * 2;
  const capsule = (s, t, L, hw) => hyp(Math.max(0, Math.abs(s) - L), t) - hw;   // (signed distance to a capsule along s, half length L, half width hw)
  const aDist = (a, b) => { const d = wrapA(a - b); return d > Math.PI ? TAU - d : d; };

  /* ---- 1. the pendulum: 'slot' its gold-lipped slot in a slab of tomb stone ('h' across the screen, 'v' into it; 'slotg' its
     light); 'blade' the crescent seen face on (feet at its hub), 'bladee' edge on; 'rod' its rod rising into the dark ---- */
  const SLOT_L = 1.42;
  function paintSlot(k, S, o, glowL) { const sd = o === 'v' ? 3.3 : 7.7, along = (x, w) => o === 'v' ? w : x, across = (x, w) => o === 'v' ? x : w;
    const hf = (x, w) => { const s = along(x, w), t = across(x, w), dg = capsule(s, t, SLOT_L, 0.09), dp = capsule(s, t, SLOT_L + 0.04, 0.3); return dg < 0 ? -0.07 * k.ss(0, -0.035, dg) : 0.022 * k.ss(0.07, 0.035, dg) * k.ss(0, 0.02, dg) + 0.008 * k.ss(0.0, -0.05, dp); };
    const b = o === 'v' ? [-0.4, -1.65, 0.4, 1.65] : [-1.65, -0.4, 1.65, 0.4];
    if (!glowL) k.contact(S, 0, 0, o === 'v' ? 0.42 : 1.7, o === 'v' ? 1.7 : 0.42, 0.3);
    flat(k, S, b, 1, hf, (x, w) => { const s = along(x, w), t = across(x, w), dg = capsule(s, t, SLOT_L, 0.09), dp = capsule(s, t, SLOT_L + 0.04, 0.3); if (dp > 0.02) return 0; const al = clamp(-dp * S.P * 1.2 + 0.5, 0, 1);
      const si = Math.round(s / 0.4) * 0.4, stud = Math.abs(si) <= 1.21 ? k.ss(0.035, 0.02, hyp(s - si, Math.abs(t) - 0.22)) : 0, inl = k.ss(0.012, 0.0, Math.abs(dp + 0.06));
      if (glowL) { const g = dg < 0 ? 0.35 + 0.55 * k.ss(0.0, -0.07, dg) : k.ss(0.07, 0.0, dg) * 0.85 + 0.35 * stud + 0.25 * inl; E(k, 1.25 * g, 0.92 * g, 0.42 * g); return g > 0.01 ? al : 0; }
      if (dg < 0) { const M = k.M; M.r = 0.02; M.g = 0.02; M.b = 0.03; M.rg = 0.4; M.ao *= 0.45; M.er = 0.07; M.eg = 0.045; M.eb = 0.012; }
      else if (dg < 0.065 || stud > 0.3 || inl > 0.4) goldM(k, s * 3, t * 3, sd, 0.55);
      else slateM(k, x * 1.2, w * 1.2, sd);
      return al; });
    if (glowL) return; S.unlock(); k.ink(S, [10, 12, 20], 0.3); }
  // the crescent: an outer circle less an inner one, a shank up to its gilded hub
  const CO = [0, -0.2, 0.7], CI = [0, -0.62, 0.86];
  function paintBlade(k, S) { const sd = 4.1;
    upright(k, S, [-0.8, -0.2, 0.8, 0.58], (x, y) => { const M = k.M, dO = CO[2] - hyp(x - CO[0], y - CO[1]), dI = hyp(x - CI[0], y - CI[1]) - CI[2], cres = Math.min(dO, dI), shank = Math.abs(x) < 0.07 && y > -0.02 && y < 0.3 ? 0.07 - Math.abs(x) : -1, hub = 0.1 - hyp(x, y);
      const P = S.P, a = clamp(Math.max(cres, shank, hub) * P + 0.5, 0, 1); if (a < 0.003) return 0;
      if (hub > 0) { goldM(k, x * 6, y * 6, sd, 0.7); const q = 1 - hub / 0.1; NB[0] = x / 0.1 * q * 0.9; NB[1] = -y / 0.1 * q * 0.9; return a; }
      if (shank > 0 && cres < 0) { goldM(k, x * 4, y * 9, sd, 0.4); NB[0] = x / 0.07 * 0.8; return a; }
      if (dO < 0.075) { const q = 1 - dO / 0.075, ux = (x - CO[0]) / (CO[2] - dO), uy = (y - CO[1]) / (CO[2] - dO); steelM(k, x * 2, y * 2, sd); M.rg = 0.12; M.fr += 0.25; M.fg += 0.25; M.fb += 0.25; NB[0] = ux * q * 0.92; NB[1] = -uy * q * 0.92; return a; }   // (the cutting edge, bright)
      if (dI < 0.075) { const q = 1 - dI / 0.075, ux = (x - CI[0]) / (CI[2] + dI), uy = (y - CI[1]) / (CI[2] + dI); goldM(k, x * 5, y * 5, sd, 0.6); NB[0] = -ux * q * 0.6; NB[1] = uy * q * 0.6; return a; }   // (the gilded spine)
      steelM(k, x * 2, y * 2, sd); const fil = k.ss(0.02, 0.0, Math.abs(Math.sin(x * 22 + Math.sin(y * 30) * 0.8) * 0.06)) * k.ss(0.0, 0.04, Math.min(dO - 0.09, dI - 0.06));   // (etched gold filigree in its middle)
      if (fil > 0.2) { const r0 = M.fr; goldM(k, x * 9, y * 9, sd, 0.5); M.fr = lerp(r0, M.fr, fil); } M.ao *= 0.92 + 0.08 * k.vn(x * 20, y * 20); return a; });
    S.unlock(); k.ink(S, [8, 8, 14], 0.45); }
  function paintBladeE(k, S) { const sd = 2.2;
    upright(k, S, [-0.12, -0.2, 0.12, 0.58], (x, y) => { const hub = 0.08 - hyp(x, y * 1.2), hwid = y > 0.02 ? 0.05 * (1 - k.ss(0.28, 0.52, y)) + 0.012 : 0.05, body = Math.min(hwid - Math.abs(x), y + 0.02, 0.52 - y), a = clamp(Math.max(body, hub) * S.P + 0.5, 0, 1); if (a < 0.003) return 0;
      if (hub > 0 && y < 0.04) { goldM(k, x * 6, y * 6, sd, 0.7); NB[0] = x / 0.08 * 0.8; return a; }
      steelM(k, x * 3, y * 3, sd); k.M.rg = 0.14; NB[0] = clamp(x / hwid, -1, 1) * 0.85; if (y > 0.4) { k.M.fr += 0.2; k.M.fg += 0.2; k.M.fb += 0.2; } return a; });
    S.unlock(); k.ink(S, [8, 8, 14], 0.45); }
  const ROD_L = 3.2;
  function paintRod(k, S) { k.tube(S, [[0, -ROD_L - 0.15], [0, -0.04]], 0.034, 0.034, (t, s) => { k.iron(t * 9, s, 1, 3); if ((t * 8) % 1 < 0.08) goldM(k, t * 5, s, 2, 0.6); });
    k.ball(S, 0, -0.07, 0.065, 0.06, (dx, dy) => goldM(k, dx * 3, dy * 3, 5, 0.7));
    S.unlock(); const c = S.c; c.save(); c.globalCompositeOperation = 'destination-out'; const g = c.createLinearGradient(0, -ROD_L - 0.2, 0, -ROD_L * 0.45); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(-0.2, -ROD_L - 0.3, 0.4, ROD_L * 0.6 + 0.3); c.restore(); }

  /* ---- 2. the stopped clock (feet at its middle): a dial of dark tomb stone in a gold ring, twelve raised gold hour marks, a silver
     chapter ring, a guilloche middle and a gold boss; 'dialg' its marks' and ring's light; 'chand' / 'chands' its long and short
     hands (lying along +x from their hub, drawn turned on the floor), 'chandg' the long hand's gilded edge ---- */
  function paintDial(k, S, v, glowL) { const sd = 9 + v * 4, RX = KINDS.clock.RX, rot = v * 0.26;
    const pol = (x, w) => [hyp(x, w) / RX, Math.atan2(w, x)];
    const markAt = (r, a) => { if (r < 0.69 || r > 0.88) return 0; const i = Math.round(wrapA(a + Math.PI / 2 - rot) / (Math.PI / 6)) % 12, am = -Math.PI / 2 + rot + i * Math.PI / 6, hw = i % 3 === 0 ? 0.055 : 0.032, d = aDist(a, am) * r * RX; return k.ss(hw + 0.012, hw - 0.006, d) * k.ss(0.69, 0.72, r) * k.ss(0.88, 0.85, r); };
    const hf = (x, w) => { const [r, a] = pol(x, w); if (r >= 1) return 0; const ring = Math.exp(-Math.pow((r - 0.95) / 0.035, 2)), mk = markAt(r, a), boss = r < 0.085 ? Math.sqrt(1 - Math.pow(r / 0.085, 2)) : 0; return 0.03 * ring + 0.012 * mk + 0.03 * boss - 0.012 * k.ss(0.9, 0.62, r) * k.ss(0.0, 0.2, r) + 0.0015 * Math.sin(r * 70) * k.ss(0.58, 0.3, r); };
    if (!glowL) k.contact(S, 0, 0, RX * 1.04, RX * FR * 1.02, 0.35);
    flat(k, S, [-RX * 1.06, -RX * 1.06, RX * 1.06, RX * 1.06], FR, hf, (x, w) => { const [r, a] = pol(x, w); if (r >= 1.0) return 0; const al = clamp((1 - r) * RX * S.P * 1.5 + 0.3, 0, 1), mk = markAt(r, a), ring = k.ss(0.035, 0.012, Math.abs(r - 0.95)), chap = k.ss(0.014, 0.004, Math.abs(r - 0.62)), mins = r > 0.885 && r < 0.915 ? k.ss(0.018, 0.008, aDist(a, Math.round(a / (TAU / 60)) * (TAU / 60)) * r * RX) : 0;
      if (glowL) { const g = mk * 1.0 + ring * 0.45 + chap * 0.3 + mins * 0.4 + (r < 0.09 ? 0.6 : 0); E(k, 1.3 * g, 0.98 * g, 0.48 * g); return g > 0.01 ? al : 0; }
      if (mk > 0.35 || ring > 0.35 || r < 0.085) goldM(k, x * 3, w * 3, sd, r < 0.085 ? 0.8 : 0.55);
      else if (chap > 0.35 || mins > 0.35) silverM(k, x * 4, w * 4, sd);
      else { slateM(k, x * 1.4, w * 1.4, sd); const M = k.M, face = k.ss(0.9, 0.86, r); M.r *= 1 - 0.35 * face; M.g *= 1 - 0.3 * face; M.b *= 1 - 0.15 * face; M.cc = 0.55 * face + 0.2; M.rg = lerp(0.5, 0.24, face); if (r < 0.58) M.ao *= 0.88 + 0.12 * Math.abs(Math.sin(r * 70 + Math.sin(a * 12) * 0.6)); }
      return al; });
    if (glowL) return; S.unlock(); k.ink(S, [8, 10, 18], 0.35); }
  const HAND_L = 1.12, HAND_S = 0.72;
  function paintHandC(k, S, len, glowL) { const sd = 5 + len * 3, wid = len > 1 ? 0.055 : 0.07;
    const hw = s => { if (s < -0.22 || s > len) return -1; if (s < 0) return Math.max(0, wid * 1.35 - Math.abs(s + 0.13) * 0.6); const sp = Math.abs(s - 0.86 * len) / (0.09 * len); if (sp < 1) return Math.max(wid * (1 - 0.55 * s / len), wid * 1.7 * (1 - sp)); return s > 0.95 * len ? wid * 0.5 * (1 - (s - 0.95 * len) / (0.05 * len)) : wid * (1 - 0.55 * s / len); };
    const hole = (s, t) => hyp(s - 0.86 * len, t * 1.3) < wid * 0.55 || hyp(s + 0.13, t) < wid * 0.55;
    const hf = (s, t) => { const h = hw(s); if (h <= 0 || Math.abs(t) > h || hole(s, t)) return 0; return 0.03 * Math.sqrt(1 - Math.pow(t / h, 2)) + (hyp(s, t) < 0.07 ? 0.02 : 0); };
    flat(k, S, [-0.3, -0.22, len + 0.05, 0.22], 1, hf, (s, t) => { const h = Math.max(hw(s), hyp(s, t) < 0.075 ? 0.075 : -1); if (h <= 0 || hole(s, t) && hyp(s, t) > 0.075) return 0; const at = hyp(s, t) < 0.075 ? 0.075 - hyp(s, t) : h - Math.abs(t); if (at < -0.01) return 0; const al = clamp(at * S.P * 1.4 + 0.5, 0, 1), edge = k.ss(0.018, 0.004, at);
      if (glowL) { const g = edge * 0.9 + (hyp(s, t) < 0.06 ? 0.4 : 0); E(k, 1.3 * g, 1.0 * g, 0.5 * g); return g > 0.01 ? al : 0; }
      if (edge > 0.4 || hyp(s, t) < 0.075) goldM(k, s * 5, t * 5, sd, 0.6); else { steelM(k, s * 3, t * 3, sd); k.M.fr *= 0.6; k.M.fg *= 0.6; k.M.fb *= 0.7; } return al; });
    if (glowL) return; S.unlock(); k.ink(S, [6, 6, 12], 0.4); }

  /* ---- 3. the pool of stopped time (feet at its middle): a gold-inlaid lip of tomb stone round a basin of still black time, frozen
     rings in it and gold motes caught where they hung; 'poolg' the motes' and the lip's light and a stopped dial seen in it ---- */
  function paintPool(k, S, v, glowL) { const sd = 21 + v * 5, RX = 1.2, rho = rimOf(k, sd, 0.04);
    const q = (x, w) => hyp(x, w) / (RX * rho(Math.atan2(w, x)));
    const hf = (x, w) => { const r = q(x, w); if (r >= 1) return 0; return r > 0.84 ? 0.03 * Math.sin((r - 0.84) / 0.16 * Math.PI) : -0.04 + 0.002 * Math.sin(r * 46 + sd) * r; };
    if (!glowL) k.contact(S, 0, 0, RX, RX * FR, 0.3);
    flat(k, S, [-RX * 1.08, -RX * 1.08, RX * 1.08, RX * 1.08], FR, hf, (x, w) => { const r = q(x, w); if (r >= 1) return 0; const al = clamp((1 - r) * RX * S.P * 1.4 + 0.3, 0, 1), inl = k.ss(0.018, 0.006, Math.abs(r - 0.91)), mote = r < 0.82 ? k.ss(0.9, 0.97, k.vn(x * 26 + sd, w * 26)) : 0, a = Math.atan2(w, x), tick = r > 0.52 && r < 0.64 ? k.ss(0.03, 0.01, aDist(a, Math.round(a / (Math.PI / 6)) * (Math.PI / 6)) * r * RX) : 0;
      if (glowL) { const g = mote * 1.2 + inl * 0.55 + tick * 0.22 + 0.1 * k.ss(0.84, 0.7, r) * k.ss(0.3, 0.8, r); E(k, 1.25 * g, 0.95 * g, 0.45 * g); return g > 0.01 ? al : 0; }
      if (r > 0.84) { if (inl > 0.4) goldM(k, x * 4, w * 4, sd, 0.55); else slateM(k, x * 1.5, w * 1.5, sd); }
      else { const M = k.M; M.r = 0.025; M.g = 0.03; M.b = 0.055; M.rg = 0.04; M.cc = 1; M.sh = 0.25; M.er = 0.02 * (1 - r); M.eg = 0.018 * (1 - r); M.eb = 0.03; if (mote > 0.2) { M.er += 0.6 * mote; M.eg += 0.45 * mote; M.eb += 0.15 * mote; } }
      return al; });
    if (glowL) return; S.unlock(); k.ink(S, [8, 10, 18], 0.3); S.unlock(); const R = k.R1(13 + v); for (let i = 0; i < 3; i++) k.glint(S.c, (R() - 0.5) * RX, (R() - 0.6) * RX * FR * 0.7, 0.05 + R() * 0.03, 0.4); }

  /* ---- 4. the age-swap slab (feet at its middle): a square of four new marble tiles in a gold border, a gold hourglass in its
     middle; 'swapr' the same slab in ruin (cracked, chipped, lilac-grey, its gold dull and broken); 'swapg' its gold's light,
     'swaprg' the cracks' (violet) ---- */
  function paintSwap(k, S, v, mode) { const sd = 31 + v * 7, HS = KINDS.swap.hs, ruin = mode === 'r' || mode === 'rg', glowL = mode === 'g' || mode === 'rg';
    const sigil = (x, w) => { const aw = Math.abs(w); if (aw > 0.44) return 9; const half = 0.3 * aw / 0.44 + 0.012; return Math.abs(x) - half; };   // (its two triangles, tip to tip; < 0 inside)
    const crackOf = (x, w) => { const c = cells(x * 2.4 + 5, w * 2.4 + 3, sd), e = c[1] - c[0]; return k.ss(0.05, 0.012, e); };
    const hf = (x, w) => { const d = Math.max(Math.abs(x), Math.abs(w)); if (d > HS) return 0; const bd = k.ss(0.035, 0.0, Math.abs(d - 0.69)), sg = k.ss(0.03, 0.0, Math.abs(sigil(x, w))), gr = k.ss(0.012, 0, Math.min(Math.abs(x), Math.abs(w))); return 0.012 * (bd + sg) - 0.006 * gr - (ruin ? 0.02 * crackOf(x, w) : 0) + 0.01 * k.ss(HS, HS - 0.04, d); };
    if (!glowL) k.contact(S, 0, 0.04, HS * 1.2, HS * 1.2, 0.38);
    flat(k, S, [-HS - 0.05, -HS - 0.05, HS + 0.05, HS + 0.05], 1, hf, (x, w) => { const d = Math.max(Math.abs(x), Math.abs(w)); let lim = HS; if (ruin) lim -= 0.08 * k.ss(0.55, 0.8, k.vn(x * 4 + sd, w * 4)) * k.ss(HS - 0.2, HS, d); if (d > lim + 0.02) return 0;
      const al = clamp((lim - d) * S.P * 1.4 + 0.5, 0, 1), bd = k.ss(0.032, 0.018, Math.abs(d - 0.69)), sgd = sigil(x, w), sg = k.ss(0.03, 0.014, Math.abs(sgd)), cr = ruin ? crackOf(x, w) : 0, lost = ruin ? k.ss(0.5, 0.65, k.vn(x * 5 + 11, w * 5 + sd)) : 0, ros = k.ss(0.08, 0.06, hyp(Math.abs(x) - 0.69, Math.abs(w) - 0.69));
      if (glowL) { if (mode === 'g') { const g = (bd * 0.6 + sg + 0.4 * ros + (sgd < 0 ? 0.18 : 0)) * (1 - lost * 0.7); E(k, 1.2 * g, 0.95 * g, 0.5 * g); return g > 0.01 ? al : 0; } const g = cr * (0.6 + 0.4 * k.ss(0.7, 0.1, d)); E(k, 0.8 * g, 0.62 * g, 1.3 * g); return g > 0.01 ? al : 0; }
      if ((bd > 0.4 || sg > 0.4 || ros > 0.4) && !(lost > 0.5 && ruin)) goldM(k, x * 4, w * 4, sd, ruin ? 0.1 : 0.35);
      else if (sgd < 0 && !(lost > 0.5 && ruin)) { lapisM(k, x * 3, w * 3, sd); if (ruin) { const M = k.M; M.r = lerp(M.r, 0.4, 0.5); M.g = lerp(M.g, 0.4, 0.5); M.b = lerp(M.b, 0.48, 0.5); M.cc = 0.1; M.rg = 0.8; } }   // (lapis inside the gold hourglass; dulled in ruin)
      else { marbleM(k, x * 1.3 + v, w * 1.3, sd, ruin ? 1 : 0); const M = k.M; if (!ruin && Math.min(Math.abs(x), Math.abs(w)) < 0.012) M.ao *= 0.72; if (cr > 0) { M.r *= 1 - 0.75 * cr; M.g *= 1 - 0.75 * cr; M.b *= 1 - 0.65 * cr; M.ao *= 1 - 0.5 * cr; } }
      return al; });
    if (glowL) return; S.unlock(); k.ink(S, ruin ? [40, 34, 50] : [70, 62, 50], 0.22);
    if (ruin) { S.unlock(); const R = k.R1(7 + v), c = S.c; c.save(); for (let i = 0; i < 26; i++) { const x = (R() - 0.5) * HS * 1.9, y = (R() - 0.5) * HS * 1.9, s2 = 0.012 + R() * 0.02; c.fillStyle = R() < 0.5 ? `rgba(70,60,80,${0.3 + R() * 0.3})` : `rgba(235,230,240,${0.25 + R() * 0.3})`; c.fillRect(x, y, s2, s2); } c.restore(); }
    else { S.unlock(); const R = k.R1(3 + v); for (let i = 0; i < 2; i++) k.glint(S.c, (R() - 0.5) * HS, (R() - 0.5) * HS, 0.06, 0.4); } }

  /* ---- 5. the broken column (feet 0, 0): a square plinth, a fluted ivory shaft with a gold collar, broken off ragged at its top,
     cracked through; rubble at its foot; 'colmg' its cracks' light; 'colsh' its contact shadow (laid apart: the column turns) ---- */
  const COL_H = 1.78;
  function paintColumn(k, S, v, glowL) { const sd = 41 + v * 5, M = k.M;
    const crack = (u, h) => { const a = k.ss(0.02, 0.0, Math.abs(u - (0.04 + 0.07 * Math.sin(h * 5.3 + sd) + 0.03 * Math.sin(h * 17)))) * k.ss(0.3, 0.5, h), b = k.ss(0.018, 0.0, Math.abs(u + 0.12 - 0.05 * Math.sin(h * 7 + sd * 2))) * k.ss(1.0, 1.2, h) * k.ss(1.75, 1.6, h); return Math.max(a, b * 0.9); };
    if (!glowL) k.rbox(S, 0, 0, 0.42, 0.4, 0, 0.2, 0.04, (face, u, z) => { marbleM(k, u * 2 + 3, z * 2 + (face === 't' ? 5 : 0), sd, 0.45); if (face === 'f' && Math.abs(z - 0.1) < 0.02) goldM(k, u * 4, z, sd, 0.4); });
    k.rev(S, 0, 0, h =>0.25 - 0.025 * (h - 0.2) / 1.6 + (h < 0.3 ? 0.03 * k.ss(0.3, 0.2, h) : 0), 0.2, COL_H, { top: true, floorAO: 0.3,
      mat: (u, h) => { const cr = crack(u, h); if (glowL) { const g = cr * (0.7 + 0.3 * Math.sin(h * 9 + sd)); return E(k, 1.25 * g, 1.05 * g, 0.65 * g); }
        const fl = Math.abs(Math.sin(u / 0.25 * 8)); marbleM(k, u * 1.5, h * 1.2, sd, 0.25 + 0.35 * k.ss(1.2, 1.75, h)); M.ao *= 0.7 + 0.3 * Math.pow(fl, 0.6);
        if (Math.abs(h - 0.42) < 0.04) goldM(k, u * 3, h * 3, sd, 0.5); if (cr > 0) { M.r *= 1 - 0.7 * cr; M.g *= 1 - 0.7 * cr; M.b *= 1 - 0.6 * cr; M.ao *= 1 - 0.4 * cr; } },
      capMat: (x, z, ao, _a, _b, _c, ey) => { if (glowL) return E(k, 0, 0, 0); marbleM(k, x * 3, (ey || 0) * 3, sd, 0.7); M.ao *= 0.75 + 0.25 * k.vn(x * 14 + sd, (ey || 0) * 14); } });
    if (glowL) return;
    // the ragged break at its top: chips standing up off the cap, and rubble at its foot
    const R = k.R1(19 + v); for (let i = 0; i < 4; i++) { const a = R() * TAU, x = Math.cos(a) * 0.15, y = -COL_H + Math.sin(a) * 0.05; k.ball(S, x, y - 0.03, 0.05 + R() * 0.04, 0.06 + R() * 0.05, (dx, dy) => marbleM(k, dx * 2 + i, dy * 2, sd, 0.6)); }
    for (let i = 0; i < 5; i++) { const a = R() * TAU, d = 0.45 + R() * 0.15, r0 = 0.04 + R() * 0.05; k.ball(S, Math.cos(a) * d, Math.sin(a) * d * 0.34 - r0 * 0.3, r0, r0 * 0.75, (dx, dy) => marbleM(k, dx + i * 3, dy, sd, 0.6)); }
    S.unlock(); k.ink(S, [60, 54, 48], 0.3); S.unlock(); k.glint(S.c, -0.12, -1.1, 0.06, 0.35); }

  /* ---- 6. the sun in the floor (feet at its middle): a white marble roundel in a lapis ring set with gold, a raised gold sun and its
     twelve rays, long and short; 'sung' the sun's light ---- */
  function paintSun(k, S, v, glowL) { const sd = 51 + v * 3, RX = 1.05;
    const pol = (x, w) => [hyp(x, w) / RX, Math.atan2(w, x)];
    const ray = (r, a) => { if (r < 0.2 || r > 0.74) return 0; const i = Math.round(wrapA(a) / (Math.PI / 6)) % 12, long = i % 2 === 0, end = long ? 0.74 : 0.56; if (r > end) return 0; const hwr = 0.07 * (1 - (r - 0.2) / (end - 0.2)) + 0.004, d = aDist(a, i * Math.PI / 6) * r * RX; return k.ss(hwr + 0.01, hwr - 0.004, d); };
    const hf = (x, w) => { const [r, a] = pol(x, w); if (r >= 1) return 0; return 0.022 * (r < 0.21 ? Math.sqrt(1 - Math.pow(r / 0.21, 2)) : 0) + 0.008 * ray(r, a) + 0.012 * Math.exp(-Math.pow((r - 0.97) / 0.03, 2)); };
    if (!glowL) k.contact(S, 0, 0, RX, RX * FR, 0.18);
    flat(k, S, [-RX * 1.06, -RX * 1.06, RX * 1.06, RX * 1.06], FR, hf, (x, w) => { const [r, a] = pol(x, w); if (r >= 1) return 0; const al = clamp((1 - r) * RX * S.P * 1.5 + 0.3, 0, 1), ry = ray(r, a), lap = k.ss(0.8, 0.82, r) * k.ss(0.93, 0.91, r), dots = lap > 0.5 ? k.ss(0.03, 0.015, hyp(aDist(a, Math.round(a / (TAU / 24)) * (TAU / 24)) * r * RX, (r - 0.865) * RX)) : 0;
      if (glowL) { const g = (r < 0.21 ? 1 : 0) + ry * 0.9 + dots * 0.5 + 0.12 * k.ss(0.8, 0.3, r); E(k, 1.25 * g, 1.05 * g, 0.62 * g); return g > 0.01 ? al : 0; }
      if (r < 0.21 || ry > 0.4 || dots > 0.4) goldM(k, x * 4, w * 4, sd, 0.85); else if (lap > 0.5) lapisM(k, x * 3, w * 3, sd); else marbleM(k, x * 1.4, w * 1.4, sd, 0);
      return al; });
    if (glowL) return; S.unlock(); k.ink(S, [80, 70, 54], 0.2); S.unlock(); k.glint(S.c, -0.1, -0.08, 0.07, 0.4); }

  /* ---- 7. the glass pane (feet at its middle): a square of violet glass in a silver frame, the void's stars deep in it; 'paneg' its
     frame's light; 'panec' 0..2 its cracks as they spread (light); 'paneh' the frame with the pane gone and the void showing ---- */
  function paintPane(k, S, mode) { const sd = 61, HP = KINDS.glass.hs, glowL = mode !== 'p' && mode !== 'h', hole = mode === 'h';
    const ext = mode === 'c0' ? 0.3 : mode === 'c1' ? 0.52 : 0.78;
    const crackOf = (x, w) => { const r = hyp(x, w); if (r > ext) return 0; const a = Math.atan2(w, x); let best = 0; for (let i = 0; i < 7; i++) { const ai = i * TAU / 7 + 0.4 + (hh(i, 5) - 0.5) * 0.5 + (k.vn(r * 5 + i * 3, i) - 0.5) * 0.5, d = Math.abs(Math.sin(a - ai)) * r; if (Math.cos(a - ai) < 0) continue; const wd = 0.008 + 0.012 * (1 - r / ext); best = Math.max(best, k.ss(wd, wd * 0.3, d)); }
      for (const rr of [0.16, 0.36, 0.6]) if (rr < ext) { const on = k.vn(Math.atan2(w, x) * 2.2 + rr * 9, rr * 7) > 0.42 ? 1 : 0; best = Math.max(best, on * k.ss(0.01, 0.003, Math.abs(r - rr - 0.02 * Math.sin(Math.atan2(w, x) * 5)))); } return best * k.ss(ext, ext * 0.8, r) + (r < 0.05 ? 1 : 0); };
    const hf = (x, w) => { const d = Math.max(Math.abs(x), Math.abs(w)); return d > HP ? 0 : 0.02 * Math.sin(clamp((d - 0.63) / 0.11, 0, 1) * Math.PI); };
    if (!glowL) k.contact(S, 0, 0, HP * 1.15, HP * 1.15, 0.25);
    flat(k, S, [-HP - 0.06, -HP - 0.06, HP + 0.06, HP + 0.06], 1, hf, (x, w) => { const d = Math.max(Math.abs(x), Math.abs(w)); if (d > HP + 0.02) return 0; const al = clamp((HP - d) * S.P * 1.4 + 0.5, 0, 1), fr = d > 0.63;
      if (glowL) { if (mode === 'g') { const g = k.ss(0.03, 0.0, Math.abs(d - 0.635)) * 0.8 + (d < 0.63 ? 0.06 * (0.5 + 0.5 * Math.sin((x + w) * 6)) : 0); E(k, 0.85 * g, 0.72 * g, 1.3 * g); return g > 0.01 ? al : 0; } if (fr) return 0; const g = crackOf(x, w); E(k, 1.0 * g, 0.9 * g, 1.5 * g); return g > 0.01 ? al : 0; }
      if (fr) { silverM(k, x * 4, w * 4, sd); return al; }
      if (hole) { const shard = d > 0.52 && k.vn(Math.atan2(w, x) * 4 + 3, d * 9) > 0.55 - (d - 0.52) * 3; if (shard) { vglassM(k, x * 2, w * 2, sd); k.M.cc = 1; k.M.er += 0.05; k.M.eb += 0.12; return al; }
        const M = k.M, f = k.fbm(x * 3 + 7, w * 3), st = k.vn(x * 60 + 5, w * 60); M.r = 0.008; M.g = 0.004; M.b = 0.02; M.rg = 1; M.sh = 0; M.er = 0.07 * f; M.eg = 0.02 * f; M.eb = 0.16 * f; if (st > 0.95) { M.er += 0.8; M.eg += 0.7; M.eb += 1.0; } M.ao *= 0.5; return al; }
      vglassM(k, x * 2, w * 2, sd); return al; });
    if (glowL) return; S.unlock(); k.ink(S, [16, 10, 30], 0.35); if (!hole) { S.unlock(); k.glint(S.c, -0.32, -0.3, 0.09, 0.45); k.glint(S.c, 0.25, 0.2, 0.05, 0.3); } }

  /* ---- 8. the void seam (feet at its middle): a patch of violet floor stone split by a jagged seam where the void shows, starry and
     deep, its broken lips lit from inside; 'seamg' the lips' light; 'vhand' a hand of the void clawing up (feet 0, 0; v 0 left,
     1 right): long jointed fingers of black glass, rimmed violet ---- */
  function paintSeam(k, S, v, glowL) { const sd = 71 + v * 4, RX = 1.1, rho = rimOf(k, sd, 0.1);
    const q = (x, w) => hyp(x, w) / (RX * rho(Math.atan2(w, x)));
    const wc = x => 0.1 * Math.sin(x * 2.4 + sd) + 0.045 * Math.sin(x * 7.3 + sd * 2), ho = x => Math.max(0, 0.15 * (1 - Math.pow(x / 0.9, 2)) * (0.7 + 0.3 * k.vn(x * 6 + sd, 1)));
    const hf = (x, w) => { const r = q(x, w); if (r >= 1) return 0; const t = Math.abs(w - wc(x)), o = ho(x); if (t < o) return -0.08; return 0.025 * k.ss(o + 0.12, o, t) + 0.01 * (k.vn(x * 5 + sd, w * 5) - 0.5); };
    if (!glowL) k.contact(S, 0, 0, RX, RX * FR, 0.32);
    flat(k, S, [-RX * 1.1, -RX * 1.1, RX * 1.1, RX * 1.1], FR, hf, (x, w) => { const r = q(x, w); if (r >= 1) return 0; const al = clamp((1 - r) * RX * S.P * 1.3 + 0.2, 0, 1), t = Math.abs(w - wc(x)), o = ho(x), lip = o > 0.01 ? k.ss(o + 0.07, o, t) : 0, inV = t < o;
      if (glowL) { const g = (inV ? 0.45 + 0.4 * (1 - t / o) : 0) + lip * 0.9; E(k, 0.7 * g, 0.42 * g, 1.3 * g); return g > 0.01 ? al : 0; }
      if (inV) { const M = k.M, st = k.vn(x * 55 + sd, w * 55); M.r = 0.008; M.g = 0.004; M.b = 0.02; M.rg = 1; M.sh = 0; M.er = 0.08; M.eg = 0.03; M.eb = 0.18; if (st > 0.94) { M.er += 0.8; M.eg += 0.7; M.eb += 1.0; } return al; }
      vstoneM(k, x * 1.4, w * 1.4, sd); const M = k.M, c = cells(x * 2.6, w * 2.6, sd), cr = k.ss(0.05, 0.012, c[1] - c[0]) * k.ss(1.0, 0.5, r); M.ao *= 1 - 0.5 * cr; if (lip > 0) { M.er += 0.12 * lip; M.eg += 0.05 * lip; M.eb += 0.25 * lip; } return al; });
    if (glowL) return; S.unlock(); k.ink(S, [10, 6, 22], 0.35); }
  function paintVHand(k, S, v) { const sd = 6.3 + v * 1.9, m = v % 2 ? -1 : 1, M = k.M;
    const rimmed = (t, s) => { obsidM(k, t * 4, s * 2, sd); const e = Math.abs(s); if (e > 0.65) { const q = (e - 0.65) / 0.35; M.er += 0.35 * q; M.eg += 0.18 * q; M.eb += 0.7 * q; } };
    k.ball(S, 0, -0.02, 0.22, 0.08, (dx, dy) => { vstoneM(k, dx * 2, dy * 2, sd); M.er = 0.08; M.eb = 0.16; });
    k.tube(S, [[-0.02 * m, 0], [-0.01 * m, -0.36]], 0.06, 0.048, rimmed);
    k.ball(S, 0.01 * m, -0.42, 0.12, 0.1, (dx, dy) => rimmed(dx, dx));
    const F = [[-0.1, -0.48, -0.2, -0.74, -0.14, -0.96], [-0.035, -0.51, -0.06, -0.82, 0.0, -1.04], [0.035, -0.51, 0.08, -0.8, 0.15, -1.0], [0.1, -0.48, 0.2, -0.68, 0.27, -0.84]];
    for (const [ax, ay, bx, by, cx, cy] of F) k.tube(S, [[ax * m, ay], [bx * m, by], [cx * m, cy]], 0.03, 0.006, (t, s) => { rimmed(t, s); if (Math.abs(t - 0.5) < 0.05) M.ao *= 0.6; if (t > 0.85) { M.er += 0.25; M.eb += 0.45; } });
    k.tube(S, [[0.11 * m, -0.38], [0.22 * m, -0.46], [0.3 * m, -0.6]], 0.028, 0.008, rimmed);
    S.unlock(); k.ink(S, [16, 8, 34], 0.5); }

  /* ---- 9. the rift's sigil (feet at its middle): a disc of violet stone, a silver ring and a broken hourglass in silver, three
     beads round it; 'rsigg' its silver's light (the tear itself is light alone, on the GPU) ---- */
  function paintRSig(k, S, v, glowL) { const sd = 81 + v * 3, RX = 1.0;
    const glyph = (x, w) => { const aw = Math.abs(w); if (aw > 0.4) return 9; const half = 0.26 * aw / 0.4 + 0.01, d = Math.abs(Math.abs(x) - half), gap = Math.abs(w - 0.08 + x * 0.3) < 0.04 ? 1 : 0; return gap ? 9 : d; };
    const hf = (x, w) => { const r = hyp(x, w) / RX; if (r >= 1) return 0; return 0.012 * k.ss(0.025, 0.0, glyph(x, w)) + 0.02 * Math.exp(-Math.pow((r - 0.86) / 0.04, 2)) + 0.008 * k.ss(0.95, 1.0, r) * 0; };
    if (!glowL) k.contact(S, 0, 0, RX, RX * FR, 0.25);
    flat(k, S, [-RX * 1.06, -RX * 1.06, RX * 1.06, RX * 1.06], FR, hf, (x, w) => { const r = hyp(x, w) / RX; if (r >= 1) return 0; const al = clamp((1 - r) * RX * S.P * 1.5 + 0.3, 0, 1), gl = k.ss(0.025, 0.01, glyph(x, w)), ring = k.ss(0.04, 0.02, Math.abs(r - 0.86)), a = Math.atan2(w, x), bead = Math.max(...[0, 1, 2].map(i => k.ss(0.07, 0.05, hyp(x - Math.cos(i * TAU / 3 - 0.5) * 0.62 * RX, w - Math.sin(i * TAU / 3 - 0.5) * 0.62 * RX))));
      if (glowL) { const g = gl + ring * 0.6 + bead * 0.7 + 0.1 * k.ss(0.85, 0.2, r); E(k, 0.9 * g, 0.72 * g, 1.4 * g); return g > 0.01 ? al : 0; }
      if (gl > 0.4 || ring > 0.4) silverM(k, x * 4, w * 4, sd); else if (bead > 0.4) { vglassM(k, x * 3, w * 3, sd); k.M.er += 0.2; k.M.eb += 0.4; } else { vstoneM(k, x * 1.5, w * 1.5, sd); const M = k.M; M.r *= 0.85; M.b *= 1.05; M.cc = 0.4; if (r < 0.8) M.ao *= 0.92 + 0.08 * Math.sin(a * 24 + r * 10); }
      return al; });
    if (glowL) return; S.unlock(); k.ink(S, [12, 8, 26], 0.3); }

  const DEFS = {
    slot: { land: 1, box: o => o === 'v' ? [-0.42, -1.68, 0.42, 1.68] : [-1.68, -0.42, 1.68, 0.42], paint: (k, S, o) => paintSlot(k, S, o, false) }, slotg: { land: 1, box: o => o === 'v' ? [-0.42, -1.68, 0.42, 1.68] : [-1.68, -0.42, 1.68, 0.42], paint: (k, S, o) => paintSlot(k, S, o, true) },
    blade: { land: 1, box: () => [-0.82, -0.24, 0.82, 0.6], paint: k_S => null, paintS: paintBlade }, bladee: { land: 1, box: () => [-0.14, -0.24, 0.14, 0.6], paintS: paintBladeE }, rod: { land: 1, box: () => [-0.12, -ROD_L - 0.2, 0.12, 0.05], paintS: paintRod },
    dial: { land: 1, box: () => [-1.45, -1.02, 1.45, 1.02], paint: (k, S, v) => paintDial(k, S, v, false) }, dialg: { land: 1, box: () => [-1.45, -1.02, 1.45, 1.02], paint: (k, S, v) => paintDial(k, S, v, true) },
    chand: { land: 1, box: () => [-0.32, -0.24, HAND_L + 0.08, 0.24], paint: (k, S) => paintHandC(k, S, HAND_L, false) }, chandg: { land: 1, box: () => [-0.32, -0.24, HAND_L + 0.08, 0.24], paint: (k, S) => paintHandC(k, S, HAND_L, true) }, chands: { land: 1, box: () => [-0.32, -0.24, HAND_S + 0.08, 0.24], paint: (k, S) => paintHandC(k, S, HAND_S, false) },
    pool: { land: 1, box: () => [-1.36, -0.96, 1.36, 0.96], paint: (k, S, v) => paintPool(k, S, v, false) }, poolg: { land: 1, box: () => [-1.36, -0.96, 1.36, 0.96], paint: (k, S, v) => paintPool(k, S, v, true) },
    swapn: { land: 2, box: () => [-0.95, -0.95, 0.95, 0.95], paint: (k, S, v) => paintSwap(k, S, v, 'n') }, swapr: { land: 2, box: () => [-0.95, -0.95, 0.95, 0.95], paint: (k, S, v) => paintSwap(k, S, v, 'r') },
    swapg: { land: 2, box: () => [-0.95, -0.95, 0.95, 0.95], paint: (k, S, v) => paintSwap(k, S, v, 'g') }, swaprg: { land: 2, box: () => [-0.95, -0.95, 0.95, 0.95], paint: (k, S, v) => paintSwap(k, S, v, 'rg') },
    colm: { land: 2, box: () => [-0.62, -2.08, 0.62, 0.32], paint: (k, S, v) => paintColumn(k, S, v, false) }, colmg: { land: 2, box: () => [-0.62, -2.08, 0.62, 0.32], paint: (k, S, v) => paintColumn(k, S, v, true) }, colsh: { land: 2, box: () => [-0.66, -0.3, 0.66, 0.3], paint: k_S => null, paintS: (k, S) => k.contact(S, 0, 0.02, 0.6, 0.24, 0.5) },
    sun: { land: 2, box: () => [-1.18, -0.82, 1.18, 0.82], paint: (k, S, v) => paintSun(k, S, v, false) }, sung: { land: 2, box: () => [-1.18, -0.82, 1.18, 0.82], paint: (k, S, v) => paintSun(k, S, v, true) },
    pane: { land: 3, box: () => [-0.86, -0.86, 0.86, 0.86], paint: (k, S) => paintPane(k, S, 'p') }, paneg: { land: 3, box: () => [-0.86, -0.86, 0.86, 0.86], paint: (k, S) => paintPane(k, S, 'g') },
    panec: { land: 3, box: () => [-0.86, -0.86, 0.86, 0.86], paint: (k, S, v) => paintPane(k, S, 'c' + v) }, paneh: { land: 3, box: () => [-0.86, -0.86, 0.86, 0.86], paint: (k, S) => paintPane(k, S, 'h') },
    seam: { land: 3, box: () => [-1.3, -0.92, 1.3, 0.92], paint: (k, S, v) => paintSeam(k, S, v, false) }, seamg: { land: 3, box: () => [-1.3, -0.92, 1.3, 0.92], paint: (k, S, v) => paintSeam(k, S, v, true) },
    vhand: { land: 3, box: () => [-0.46, -1.16, 0.46, 0.16], paint: paintVHand },
    rsig: { land: 3, box: () => [-1.12, -0.8, 1.12, 0.8], paint: (k, S, v) => paintRSig(k, S, v, false) }, rsigg: { land: 3, box: () => [-1.12, -0.8, 1.12, 0.8], paint: (k, S, v) => paintRSig(k, S, v, true) } };
  for (const n in DEFS) if (DEFS[n].paintS) DEFS[n].paint = (k, S) => DEFS[n].paintS(k, S);
  const PICS = { pend: [['slot', 'h'], ['slot', 'v'], ['slotg', 'h'], ['slotg', 'v'], ['blade', 0], ['bladee', 0], ['rod', 0]],
    clock: [['dial', 0], ['dial', 1], ['dialg', 0], ['dialg', 1], ['chand', 0], ['chandg', 0], ['chands', 0]], stall: [['pool', 0], ['poolg', 0]],
    swap: [['swapn', 0], ['swapn', 1], ['swapr', 0], ['swapr', 1], ['swapg', 0], ['swapg', 1], ['swaprg', 0], ['swaprg', 1]], column: [['colm', 0], ['colm', 1], ['colmg', 0], ['colmg', 1], ['colsh', 0]], lance: [['sun', 0], ['sung', 0]],
    glass: [['pane', 0], ['paneg', 0], ['panec', 0], ['panec', 1], ['panec', 2], ['paneh', 0]], vhand: [['seam', 0], ['seam', 1], ['seamg', 0], ['seamg', 1], ['vhand', 0], ['vhand', 1]], rift: [['rsig', 0], ['rsigg', 0]] };
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  function paint(name, v, P) { const B = BP(); if (!B) return null; const K = B.kit, D = DEFS[name], b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, D.land, () => { D.paint(K, S, v); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('SEP_TRAPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = document.createElement('canvas'); cv.width = S.w; cv.height = S.h; cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas given back at once: the plain copy is kept)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  const keyOf = (name, v, P) => name + '|' + v + '|' + P;
  function sprite(name, v, P, force) { if (!DEFS[name] || !BP()) return null; P = Math.max(8, Math.round(P || BASE || 48)); const key = keyOf(name, v, P); let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 10) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P); if (s) CACHE.set(key, s); return s; }
  /* o: sx, sy (scale), rot (turn on the screen), fl (turn on the floor: a flat thing lying in the floor's own foreshortening), add, alpha */
  function draw(c, name, v, Xs, Ys, T, o) { if (!BASE) return false; const s = CACHE.get(keyOf(name, v, BASE)) || sprite(name, v, BASE); if (!s) { STATS.misses++; return false; } o = o || {}; const f = T / s.P, sx = o.sx == null ? 1 : o.sx, sy = o.sy == null ? 1 : o.sy; STATS.draws++;
    c.save(); if (o.add) c.globalCompositeOperation = 'lighter'; if (o.alpha != null) c.globalAlpha *= clamp(o.alpha, 0, 1); c.translate(Xs, Ys); if (o.fl != null) { c.scale(1, FR); c.rotate(o.fl); } if (o.rot) c.rotate(o.rot); if (sx !== 1 || sy !== 1) c.scale(sx, sy); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); return true; }
  function warm(P, sec, kinds) { if (!BP() || !P || !(P.T > 0) || off()) return []; BASE = Math.round(P.T * (P.k || 1)); const jobs = []; for (const kd of kinds || kindsOf(sec || 1)) for (const [n, v] of PICS[kd] || []) jobs.push(() => { sprite(n, v, BASE, true); }); return jobs; }
  function releasePics() { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); BASE = 0; }
  const picBytes = () => { let b = 0; CACHE.forEach(s => { if (s && s.cv) b += s.cv.width * s.cv.height * 4; }); return b; };
  /* ======================= placing ======================= */
  function hashLayout(M) { let h = 2166136261 >>> 0; const G = M.G; for (let i = 0; i < G.length; i++) h = Math.imul(h ^ G[i], 16777619) >>> 0; h = Math.imul(h ^ (M.MW * 131 + M.MH), 16777619) >>> 0; if (M.props) M.props.forEach((v, k) => { h = Math.imul(h ^ k, 16777619) >>> 0; }); return h >>> 0; }
  const dist = (x, y) => Math.sqrt(x * x + y * y), EPS = 1e-6;   // (sqrt, correctly rounded everywhere: Math.hypot may differ in its last bit between V8's tiers)
  const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1e-9; let t = ((px - ax) * dx + (py - ay) * dy) / l; t = clamp(t, 0, 1); return dist(px - ax - dx * t, py - ay - dy * t); };
  function exitOf(X) { const M = X.M; let far = M.bossAt || M.start, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = dist(cx - M.start.x, cy - M.start.y); if (d > best) { best = d; far = { x: cx, y: cy }; } } return far; }
  // (how much room each kind needs kept clear round it, beyond the start's and the way on's own)
  const NEED = { rift: 1.3, clock: 0.3, lance: 0.2, swap: 0.2, vhand: 0.2 };
  function place(X, H, o) { o = o || {}; const M = X.M, MW = M.MW, MH = M.MH, G = M.G, props = M.props, sec = clamp(o.sec || 1, 1, 3), sp = SPEC[sec] || SPEC[1], puz = !!o.puzzle;
    const seed = o.seed != null ? o.seed >>> 0 : (hashLayout(M) ^ Math.imul(sec * 7 + (o.n || 1) + (puz ? 50 : 0), 2654435761)) >>> 0, rnd = R1(seed), gap = o.minGap || (puz ? 2.8 : GAP[sec]), nRoom = o.count != null ? o.count : sp.n, nBr = puz ? 0 : o.br != null ? o.br : sp.br;
    const start = M.start || { x: X.me.x, y: X.me.y }, ex = puz ? null : exitOf(X);
    const isF = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && G[y * MW + x] === T_FLOOR && !(props && props.has(y * MW + x));
    const flo = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && (G[y * MW + x] === T_FLOOR || G[y * MW + x] === T_MUD) && !(props && props.has(y * MW + x));
    // (nothing standing in front of it, down the screen, whose picture would hide the trap and its tell)
    const PX = typeof PROP_EXT !== 'undefined' ? PROP_EXT : {}, hidden = (x, y) => { if (!props) return false; for (let dy = 1; dy <= 3; dy++) for (let dx = -1; dx <= 1; dx++) { const kp = props.get((y + dy) * MW + x + dx); if (kp == null) continue; const Ee = PX[kp] || [2.4, 2.9]; if (Ee[1] >= dy + 1.3 && (dx === 0 ? true : Ee[0] >= 2.6 && dy <= 2)) return true; } return false; };
    const plain = (x, y) => { if (!isF(x, y) || hidden(x, y)) return false; let pr = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; if (flo(x + dx, y + dy)) continue; if (dx && dy && props && props.has((y + dy) * MW + x + dx) && pr < 2) { pr++; continue; } return false; } return true; };
    // what is kept clear: the start, the way on, the packs' spawn points, shrines, stones, pots, nests, the loot gremlin, the floor's
    // own hazards, the Tower's traps (their tracks), the hourglasses one can shatter, the giant ice crystals; a stage's pieces (its marks)
    const keep = [{ x: start.x, y: start.y, r: puz ? 3.4 : 4.5 }].concat(ex ? [{ x: ex.x, y: ex.y, r: 3.6 }] : [], o.avoid || []), segs = [];
    for (const p of M.packs || []) keep.push({ x: p.x, y: p.y, r: 1.3 }); for (const p of M.shrines || []) keep.push({ x: p.x, y: p.y, r: 2.0 }); for (const p of M.stones || []) keep.push({ x: p.x, y: p.y, r: 1.6 }); for (const p of M.pots || []) keep.push({ x: p.x, y: p.y, r: 1.0 });
    for (const p of M.nests || []) keep.push({ x: p.x, y: p.y, r: 2.0 }); if (M.gremlin) keep.push({ x: M.gremlin.x, y: M.gremlin.y, r: 2.0 }); for (const h of M.hazards || []) if (!h.area && h.x != null) keep.push({ x: h.x, y: h.y, r: 1.25 });
    for (const t of M.traps || []) { if (t.x0 != null) segs.push([t.x0, t.y0, t.x1, t.y1, 1.3]); else if (t.x1 != null) segs.push([t.x, t.y, t.x1, t.y1, 1.3]); else if (t.len) segs.push([t.x, t.y, t.x + t.dx * t.len, t.y + t.dy * t.len, 1.3]); else keep.push({ x: t.x, y: t.y, r: 1.6 }); }
    for (const p of X.props || []) if (p && p.kind === 'hourglass' && !p.broken) keep.push({ x: p.x, y: p.y + 0.5, r: 2.2 });
    for (const m of X.mons || []) if (!m.dead && typeof MON !== 'undefined' && MON[m.type] && MON[m.type].still) keep.push({ x: m.x, y: m.y, r: 1.9 });
    if (puz && M.marks) for (const ch in M.marks) for (const p of M.marks[ch]) keep.push({ x: p.x, y: p.y, r: (o.keep && o.keep[ch]) || (ch === 'E' ? 2.4 : 1.8) });
    const out = [];
    const clearPt = (x, y, r0) => keep.every(k => dist(x - k.x, y - k.y) >= k.r + (r0 || 0) - EPS) && segs.every(s => segD(x, y, s[0], s[1], s[2], s[3]) >= s[4] + (r0 || 0) - EPS);
    const clearSeg = (ax, ay, bx, by) => keep.every(k => segD(k.x, k.y, ax, ay, bx, by) >= k.r - EPS) && segs.every(s => segD(ax, ay, s[0], s[1], s[2], s[3]) >= s[4] - EPS && segD(bx, by, s[0], s[1], s[2], s[3]) >= s[4] - EPS);
    const farFromTraps = (ax, ay, bx, by, g) => out.every(q => { const qa = q.x1 != null ? segD(ax, ay, q.x, q.y, q.x1, q.y1) : dist(ax - q.x, ay - q.y), qb = q.x1 != null ? segD(bx, by, q.x, q.y, q.x1, q.y1) : dist(bx - q.x, by - q.y), qm = segD(q.x, q.y, ax, ay, bx, by); return Math.min(qa, qb, qm) >= g - EPS; });
    const gapOf = kd => ZONE[kd] ? gap * 0.85 : kd === 'rift' ? gap + 0.4 : gap;
    // the rooms' share of each kind (largest remainder over the weights), dealt over a seeded shuffle; a stage's own list in its order
    const mix = o.kinds ? o.kinds.reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {}) : (MIX[sec] || MIX[1]), names = Object.keys(mix).filter(k => KINDS[k]), wsum = names.reduce((s, k) => s + mix[k], 0), want = [];
    { const raw = names.map(k => nRoom * mix[k] / wsum), base = raw.map(Math.floor); let left = nRoom - base.reduce((s, v) => s + v, 0); const ord = raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]); for (let j = 0; j < left; j++) base[ord[j % ord.length][1]]++; names.forEach((k, i) => { for (let j = 0; j < base[i]; j++) want.push(k); }); }
    for (let i = want.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const q = want[i]; want[i] = want[j]; want[j] = q; }
    const rooms = M.rooms && M.rooms.length ? M.rooms : [{ x: 0, y: 0, w: MW, h: MH }];
    const lists = rooms.map((r, ri) => { const c = []; for (let y = Math.max(1, r.y - 1); y < Math.min(MH - 1, r.y + r.h + 1); y++) for (let x = Math.max(1, r.x - 1); x < Math.min(MW - 1, r.x + r.w + 1); x++) { if (M.RM && M.RM[y * MW + x] !== ri && rooms.length > 1) continue; if (plain(x, y) && clearPt(x + 0.5, y + 0.5)) c.push([x + 0.5, y + 0.5, rnd()]); } c.sort((a, b) => a[2] - b[2]); return c; });
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // a pendulum: its slot across a plain tile, two tiles of plain floor either way along it; a column: its lane two plain tiles to
    // one side, floor beside them; a round or square trap: its own room (NEED)
    function laneAt(x0, y0, kd) { const tx = Math.floor(x0), ty = Math.floor(y0); const ds = DIRS.slice(); for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)), q = ds[i]; ds[i] = ds[j]; ds[j] = q; }
      if (kd === 'pend') { for (const [dx] of ds.slice(0, 2)) { const hx = Math.abs(dx) ? 1 : 0, hy = 1 - hx, L = SLOT_L + 0.05; if (!isF(tx - hx, ty - hy) || !isF(tx + hx, ty + hy) || !flo(tx - 2 * hx, ty - 2 * hy) || !flo(tx + 2 * hx, ty + 2 * hy)) continue; const A = { x: x0 - hx * L, y: y0 - hy * L }, B = { x: x0 + hx * L, y: y0 + hy * L }; if (!clearSeg(A.x, A.y, B.x, B.y)) continue; return { x: A.x, y: A.y, x1: B.x, y1: B.y, o: hx ? 'h' : 'v' }; } return null; }
      if (kd === 'column') { const L = KINDS.column.len; for (const d of rnd() < 0.5 ? [1, -1] : [-1, 1]) { let okL = true; for (let i = 1; i <= 2; i++) if (!isF(tx + d * i, ty) || !flo(tx + d * i, ty - 1) || !flo(tx + d * i, ty + 1)) okL = false; if (!okL) continue; if (!clearSeg(x0, y0, x0 + d * L, y0)) continue; return { x: x0, y: y0, x1: x0 + d * L, y1: y0, dir: d, o: 'h' }; } return null; }
      if (NEED[kd] && !clearPt(x0, y0, NEED[kd])) return null; return { x: x0, y: y0 }; }
    for (let pass = 0; pass < 80 && want.length; pass++) { let any = false;
      for (const Lr of lists) { if (!want.length) break; const kd = want[0];
        for (let i = 0; i < Lr.length; i++) { const [x, y] = Lr[i]; const g2 = gapOf(kd); if (!farFromTraps(x, y, x, y, g2)) continue; const ln = laneAt(x, y, kd); if (!ln) continue; if (ln.x1 != null && !farFromTraps(ln.x, ln.y, ln.x1, ln.y1, Math.min(2.2, g2))) continue;
          Lr.splice(i, 1); out.push(Object.assign({ kind: kd, bridge: false }, ln)); want.shift(); any = true; break; } }
      if (!any) { if (want.length > 1) want.push(want.shift()); if (pass > 40) break; } }
    // what found no room is made up with the stage's round kinds where they still fit
    const fill = names.filter(k => !LINE[k]); for (let j = 0; want.length && fill.length && j < 400; j++) { const kd = fill[j % fill.length]; let put = false;
      for (const Lr of lists) { for (let i = 0; i < Lr.length; i++) { const [x, y] = Lr[i]; if (!farFromTraps(x, y, x, y, gapOf(kd)) || (NEED[kd] && !clearPt(x, y, NEED[kd]))) continue; Lr.splice(i, 1); out.push({ kind: kd, bridge: false, x, y }); want.shift(); put = true; break; } if (put) break; }
      if (!put && j >= fill.length) break; }
    // the glass bridges: their straight spans (2 wide): a trap laid across the middle of one
    const seen = new Uint8Array(MW * MH), spans = [];
    if (nBr > 0) for (let i = 0; i < MW * MH; i++) { if (seen[i] || G[i] !== T_BRIDGE) continue; const comp = [], qq = [i]; seen[i] = 1; while (qq.length) { const k2 = qq.pop(); comp.push(k2); const x = k2 % MW, y = (k2 / MW) | 0; for (const [dx, dy] of DIRS) { const n2 = (y + dy) * MW + x + dx; if (x + dx < 0 || y + dy < 0 || x + dx >= MW || y + dy >= MH || seen[n2] || G[n2] !== T_BRIDGE) continue; seen[n2] = 1; qq.push(n2); } }
      const cand = []; for (const k2 of comp) { const x = k2 % MW, y = (k2 / MW) | 0;
        if (G[(y + 1) * MW + x] === T_BRIDGE && G[(y - 1) * MW + x] === T_GAP && G[(y + 2) * MW + x] === T_GAP && G[y * MW + x - 1] === T_BRIDGE && G[y * MW + x + 1] === T_BRIDGE) cand.push({ ax: 'h', x: x + 0.5, y: y + 1, k: k2 });
        if (G[y * MW + x + 1] === T_BRIDGE && G[y * MW + x - 1] === T_GAP && G[y * MW + x + 2] === T_GAP && G[(y - 1) * MW + x] === T_BRIDGE && G[(y + 1) * MW + x] === T_BRIDGE) cand.push({ ax: 'v', x: x + 1, y: y + 0.5, k: k2 }); }
      if (cand.length) spans.push(cand); }
    for (let i = spans.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const q = spans[i]; spans[i] = spans[j]; spans[j] = q; }
    const bk = (o.bridgeKinds || BRIDGE[sec] || BRIDGE[1]).filter(k => !LINE[k]); let nb = 0;
    const picks = [], more = []; for (const cand of spans) { cand.sort((a, b) => a.k - b.k); picks.push(cand[Math.floor(cand.length / 2)]); const m = Math.round(cand.length / 5); for (let j = 0; j < m; j++) more.push(cand[Math.min(cand.length - 1, Math.round((j + 0.5) * cand.length / m))]); }
    picks.push(...more);
    if (bk.length) for (const c0 of picks) { if (nb >= nBr) break; const kd = bk[nb % bk.length]; if (!clearPt(c0.x, c0.y) || !farFromTraps(c0.x, c0.y, c0.x, c0.y, sec === 3 ? 2.8 : 3.2)) continue;
      out.push({ kind: kd, bridge: true, x: c0.x, y: c0.y, sc: SQ[kd] ? 1 : 0.88 }); nb++; }
    const F = field(X, H, out, { sec, n: o.n || 1, seed, puzzle: puz, teach: o.teach, mon: o.mon, hash: hashLayout(M) }); F.diag = { cand: lists.reduce((s, l) => s + l.length, 0) + out.filter(q => !q.bridge).length, short: want.slice(), spans: spans.length }; return F; }

  /* ======================= the field ======================= */
  const FIELDS = [], TAUGHT = {};
  const say = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
  const midOf = tp => tp.x1 != null ? [(tp.x + tp.x1) / 2, (tp.y + tp.y1) / 2] : [tp.x, tp.y];
  const HUB_H = 0.62;
  function field(X, H, list, info) { const F = { X, traps: [], stat: { hits: 0, dodged: 0, bursts: 0, demos: 0, monHits: 0, byKind: {} }, taught: {}, live: true, info, LG: [], LL: [], hold: 0, teach: info.teach !== false, seed: info.seed, monHit: info.mon !== false, laidT: -1 };
    list.forEach((p, i) => { const K = KINDS[p.kind], h = hh(i + 3, info.seed | 0), per = K.per ? K.per[0] + (K.per[1] - K.per[0]) * h : 0;
      const tp = Object.assign({ K, period: per, st: 'idle', t: K.per && !SWING[p.kind] ? (i * 0.618 % 1) * per : 0, n: 0, on: false, demo: false, hit: false, hm: null, sd: i * 1.37 + (info.seed % 97), v: (i + (info.seed & 7)) % 2, stuck: 0 }, p); tp.R = (K.r || 0) * (p.sc || 1);
      if (p.kind === 'pend') { tp.ph = hh(i + 5, info.seed | 0) * TAU; tp.s = 0; tp.pcd = 0; tp.hm = new Set(); tp.vs = 1; const [cx, cy] = midOf(tp); tp.cx = cx; tp.cy = cy; tp.ax = tp.o === 'v' ? 0 : 1; tp.ay = tp.o === 'v' ? 1 : 0; }
      if (p.kind === 'clock') { tp.a0 = hh(i + 7, info.seed | 0) * TAU; tp.ha = tp.pa = tp.a0; }
      F.traps.push(tp); });
    F.dmg = kind => dmgOf(F, kind);
    // the standing ones are drawn among the floor's things, sorted by depth
    if (H && H.obj) for (const tp of F.traps) { if (!STAND[tp.kind]) continue; const [cx, cy] = midOf(tp), y = tp.kind === 'pend' ? cy + 0.1 : tp.y + 0.05, x = tp.kind === 'column' ? tp.x : cx;
      tp.obj = H.obj({ x, y, kind: 'septrap', r: 0, label: '', draw(c) { if (F.live) drawStand(F, tp, c); } }); }
    F.tick = dt => tick(F, dt); F.stop = () => stop(F); F.drawGround = c => { if (F.live) drawGround(F, c); }; F.drawOver = c => { if (F.live && F.laidT !== F.X.g.t) { buildOver(F); gpu(c, F.LL); } };
    FIELDS.push(F); STATS.fields++; return F; }
  const MODS = ['sepzone', 'sephold'];
  function stop(F) { F.live = false; try { const g = F.X.g; if (g && g.mvMods) for (const k of MODS) delete g.mvMods[k]; } catch (e) {} for (const tp of F.traps) tp.obj = null; F.LG.length = F.LL.length = 0; }
  function clear() { for (const F of FIELDS) stop(F); FIELDS.length = 0; }
  function release() { clear(); releasePics(); }
  function dmgOf(F, kind) { const K = KINDS[kind], X = F.X, hp = X.ST().hp, base = 12 * ((X.F && X.F.dmgMul) || 1) * (K.dmgK || 0); return K.dmgK ? clamp(base, hp * 0.04, hp * 0.14) : 0; }

  /* ---------------- the cycle ---------------- */
  const groundMon = m => !m.dead && !m.boss && !m.fiend && !m.lesser && !m.fobj && !(typeof MON !== 'undefined' && MON[m.type] && (MON[m.type].fly || MON[m.type].still));
  const anyMon = m => !m.dead && !m.boss && !m.fiend && !m.lesser && !m.fobj && !(typeof MON !== 'undefined' && MON[m.type] && MON[m.type].still);
  const inEll = (tp, x, y, r) => hyp(x - tp.x, (y - tp.y) / FR) < r;
  const inSq = (tp, x, y, r) => Math.abs(x - tp.x) < r && Math.abs(y - tp.y) < r;
  const darkOn = X => { try { return (X.F && X.F.dark > 0) || ((typeof BIOMES !== 'undefined' && BIOMES[X.F.biome] && BIOMES[X.F.biome].dark) > 0); } catch (e) { return false; } };
  const lightUp = (X, tp, r, life) => { if (!tp.on || !X.light || !darkOn(X)) return; const [cx, cy] = midOf(tp); try { X.light(cx, cy, r, life); } catch (e) {} };
  function tick(F, dt) { const X = F.X, me = X.me, g = X.g;
    for (const tp of F.traps) { const [cx, cy] = midOf(tp); tp.on = hyp(me.x - cx, me.y - cy) < 13; }
    if (F.teach) teach(F);
    for (const tp of F.traps) { if (SWING[tp.kind]) swing(F, tp, dt); else step(F, tp, dt); }
    // the pools of stopped time: the engine's walking-speed mods (the pet), the monsters' own slow
    let zk = 1; for (const tp of F.traps) { if (!ZONE[tp.kind]) continue; const inn = !me.dead && !me.dodge && inEll(tp, me.x, me.y, tp.R); tp.stuck = clamp(tp.stuck + (inn ? dt * 4 : -dt * 2), 0, 1);
      if (inn) { zk = Math.min(zk, tp.K.slowK); F.stat.zoneT = (F.stat.zoneT || 0) + dt; }
      if (tp.on && F.monHit) for (const m of X.mons) if (groundMon(m) && inEll(tp, m.x, m.y, tp.R + m.r * 0.3)) { m.sandT = Math.max(m.sandT || 0, 0.25); tp.stuck = Math.max(tp.stuck, 0.5); } }
    if (F.hold > 0) F.hold -= dt;
    g.mvMods = g.mvMods || {}; if (zk < 1) g.mvMods.sepzone = zk; else delete g.mvMods.sepzone; if (F.hold > 0) g.mvMods.sephold = KINDS.vhand.holdK; else delete g.mvMods.sephold; }
  // the first of each kind the pet comes near plays once, harmlessly, with a banner naming its tell
  function teach(F) { const X = F.X, me = X.me; if (X.g.t < (F.info.puzzle ? 7 : 5)) return;
    for (const kd in KINDS) { if (TAUGHT[kd] || F.taught[kd]) continue; const cand = F.traps.filter(tp => tp.kind === kd); if (!cand.length) continue; const free = !!ZONE[kd] || !!SWING[kd];
      const dm = cand.find(tp => tp.demo); if (dm) { if ((dm.st === 'warn' || free) && !dm.said) { dm.said = true; X.banner(KINDS[kd].name, KINDS[kd].tell, KINDS[kd].hi, 3.4, true); const [cx, cy] = midOf(dm); X.text(cx, cy - 1.8, ZONE[kd] ? 'Stopped time!' : 'Safe to watch…', KINDS[kd].hi, 14); }
        if (free ? dm.said && (X.g.t - F.stat.demoAt > 3.8) : (dm.n > dm.n0 && (dm.st === 'idle' || dm.st === 'rest'))) { dm.demo = false; F.taught[kd] = TAUGHT[kd] = true; } continue; }
      if (F.stat.demoAt && X.g.t - F.stat.demoAt < 4.5) continue;   // (one banner at a time)
      let b = null, bd = ZONE[kd] ? 4.5 : 7.5; for (const tp of cand) { const [cx, cy] = midOf(tp), d = hyp(me.x - cx, me.y - cy); if (d < bd && d > (ZONE[kd] ? 0 : 2.8) && tp.st === 'idle') { bd = d; b = tp; } }
      if (b) { b.demo = true; b.n0 = b.n; F.stat.demos++; F.stat.demoAt = X.g.t; if (SWING[kd] || ZONE[kd]) {} else if (KINDS[kd].per) b.t = Math.max(0, b.period - KINDS[kd].warn - KINDS[kd].burst - 0.6); else { b.st = 'warn'; b.t = -0.6; } } } }
  const byOf = (F, kd) => F.stat.byKind[kd] || (F.stat.byKind[kd] = { hits: 0, dodged: 0, lost: 0 });
  // a pendulum swings for ever (cheap: one sine); it strikes what its blade passes through, the pet once a pass
  function swing(F, tp, dt) { const X = F.X, me = X.me, K = tp.K; tp.t += dt; if (tp.pcd > 0) tp.pcd -= dt;
    const ph = TAU * tp.t / tp.period + tp.ph, s = K.L * Math.sin(ph), vs = Math.cos(ph) >= 0 ? 1 : -1; if (vs !== tp.vs) { tp.vs = vs; tp.hm.clear(); } if ((s >= 0) !== (tp.s >= 0) && tp.on && hyp(me.x - tp.cx, me.y - tp.cy) < 5) say(X, 'whoosh'); tp.s = s;
    if (tp.o === 'v' && tp.obj) tp.obj.y = tp.cy + s + 0.05;
    if (!tp.on) return; const bx = tp.cx + tp.ax * s, by = tp.cy + tp.ay * s, at = (x, y, r) => { const dx = x - tp.cx, dy = y - tp.cy, al = dx * tp.ax + dy * tp.ay, ac = Math.abs(dx * tp.ay - dy * tp.ax); return Math.abs(al - s) < K.w + r * 0.5 && ac < K.lane + r * 0.4; };
    if (!tp.demo && !me.dead && tp.pcd <= 0 && at(me.x, me.y, me.r || 0.3)) { tp.pcd = K.cd; const by2 = byOf(F, 'pend');
      if (me.dodge) { F.stat.dodged++; by2.dodged++; }
      else { const hp0 = me.hp, ok = X.hurtPet(dmgOf(F, 'pend'), null); if (ok) { F.stat.hits++; by2.hits++; by2.lost += hp0 - me.hp; const side = (me.x - tp.cx) * tp.ay - (me.y - tp.cy) * tp.ax >= 0 ? 1 : -1, a = Math.atan2(-tp.ax * side, tp.ay * side); if (!tp.bridge) X.push(isFinite(a) ? a : Math.random() * TAU, K.shove); X.sparks && X.sparks(bx, by, K.hi, lowFx() ? 4 : 8, 3); say(X, 'crack'); } else { F.stat.dodged++; by2.dodged++; } } }
    if (tp.demo || !F.monHit) return; for (const m of X.mons) { if (tp.hm.has(m) || !anyMon(m) || !at(m.x, m.y, m.r || 0.4)) continue; tp.hm.add(m); F.stat.monHits++; try { X.hitMon(m, dmgOf(F, 'pend') * 2, { src: 'hazard', noCrit: true }); } catch (e) {} } }
  function idleSpan(tp) { const K = tp.K; return tp.period - K.warn - K.burst; }
  function step(F, tp, dt) { const X = F.X, K = tp.K; if (ZONE[tp.kind]) return; if (!tp.on && (tp.st === 'idle' || tp.st === 'rest' && tp.t >= K.rest)) return; tp.t += dt;
    if (tp.st === 'idle') { if (K.per) { if (tp.t >= idleSpan(tp)) arm(F, tp); } else if (tp.on && trig(F, tp)) arm(F, tp); return; }
    if (tp.st === 'warn') { if (tp.t >= K.warn) { tp.st = 'burst'; tp.t = 0; tp.hit = false; tp.hm = new Set(); tp.n++; F.stat.bursts++; if (tp.kind === 'clock') tp.pa = tp.a0; burstFx(F, tp); } return; }
    if (tp.st === 'burst') { if (tp.kind === 'clock') tp.ha = tp.a0 + TAU * ease(tp.t / K.burst); else if (tp.kind === 'column' && tp.n !== tp.landN && tp.t >= 0.24) { tp.landN = tp.n; if (tp.on) columnLand(F, tp); } strike(F, tp); if (tp.kind === 'clock') tp.pa = tp.ha; if (tp.t >= K.burst) { tp.t = 0; tp.st = K.rest ? 'rest' : 'idle'; tp.hm = null; tp.since = 0; if (tp.kind === 'clock') tp.ha = tp.pa = tp.a0; } return; }
    if (tp.st === 'rest') { if (tp.t >= K.rest) { tp.st = 'idle'; tp.t = 0; } } }
  function arm(F, tp) { const X = F.X, K = tp.K; tp.st = 'warn'; tp.t = 0; if (!tp.on) return; lightUp(X, tp, 2.4, K.warn + K.burst + 0.2);
    if (tp.kind === 'clock') say(X, 'note', 880, K.warn, 'sine', 0.05, 1320); else if (tp.kind === 'swap') say(X, 'note', 330, K.warn, 'sine', 0.06, 165); else if (tp.kind === 'column') say(X, 'hiss', K.warn, 0.05, 600);
    else if (tp.kind === 'lance') say(X, 'note', 523, K.warn, 'sine', 0.06, 1046); else if (tp.kind === 'glass') say(X, 'note', 1760, K.warn, 'sine', 0.05, 2640); else if (tp.kind === 'vhand') say(X, 'hiss', K.warn, 0.05, 900); else if (tp.kind === 'rift') say(X, 'note', 147, K.warn, 'sine', 0.07, 294); }
  // what sets off a clock, a column, a pane or the hands: the pet (dodging or not) or a walking monster near it (where monsters count)
  function trig(F, tp) { const X = F.X, me = X.me, K = tp.K, mons = F.monHit ? X.mons : [];
    if (tp.kind === 'column') { if (!me.dead && (hyp(me.x - tp.x, me.y - tp.y) < K.trig || segD(me.x, me.y, tp.x, tp.y, tp.x1, tp.y1) < 0.95)) return true; for (const m of mons) if (groundMon(m) && segD(m.x, m.y, tp.x, tp.y, tp.x1, tp.y1) < 0.55) return true; return false; }
    if (tp.kind === 'glass') { const r = K.hs * (tp.sc || 1); if (!me.dead && inSq(tp, me.x, me.y, r)) return true; for (const m of mons) if (groundMon(m) && inSq(tp, m.x, m.y, r * 0.8)) return true; return false; }
    const r = tp.kind === 'clock' ? tp.R : K.trig; if (!me.dead && inEll(tp, me.x, me.y, r)) return true; for (const m of mons) if (groundMon(m) && inEll(tp, m.x, m.y, r * 0.8)) return true; return false; }
  const ringFront = (tp, u) => 0.45 + (tp.K.R * (tp.sc || 1) - 0.45) * ease(u);
  // the clock's long hand sweeps from pa to ha this frame: does it pass over (x, y)?
  function swept(tp, x, y, r) { const dx = x - tp.x, dy = (y - tp.y) / FR, rho = hyp(dx, dy); if (rho > HAND_L + r * 0.5 + 0.05) return false; if (rho < 0.22) return true; const phi = Math.atan2(dy, dx), tol = Math.atan((tp.K.hw + r * 0.5) / Math.max(rho, 0.25)), sw = wrapA(tp.ha - tp.pa), d = wrapA(phi - tp.pa + tol); return d <= sw + 2 * tol; }
  function inArea(tp, x, y, r, u) { const K = tp.K, sc = tp.sc || 1;
    if (tp.kind === 'clock') return swept(tp, x, y, r);
    if (tp.kind === 'column') return tp.t >= K.hitA && tp.t <= K.hitA + K.hitW && segD(x, y, tp.x + tp.dir * 0.3, tp.y, tp.x1, tp.y1) < K.w + r * 0.5;
    if (tp.kind === 'rift') { const d = hyp(x - tp.x, (y - tp.y) / FR); return u < 1 && Math.abs(d - ringFront(tp, u)) < K.band + r * 0.5; }
    if (SQ[tp.kind]) return tp.t <= K.hitW && inSq(tp, x, y, K.hs * sc + r * 0.4);
    return tp.t <= K.hitW && inEll(tp, x, y, tp.R + r * 0.6); }
  function strike(F, tp) { const X = F.X, me = X.me, K = tp.K, u = tp.t / K.burst;
    if (!tp.hit && !tp.demo && !me.dead && inArea(tp, me.x, me.y, me.r || 0.3, u)) { tp.hit = true; const by = byOf(F, tp.kind);
      if (me.dodge) { F.stat.dodged++; by.dodged++; }
      else { const hp0 = me.hp, ok = X.hurtPet(dmgOf(F, tp.kind), null); if (ok) { F.stat.hits++; by.hits++; by.lost += hp0 - me.hp;
          let a; if (tp.kind === 'column') a = me.y >= tp.y ? Math.PI / 2 : -Math.PI / 2; else a = Math.atan2(me.y - tp.y, me.x - tp.x);
          if (tp.kind === 'vhand') F.hold = K.hold; else if (!tp.bridge && K.shove) X.push(isFinite(a) ? a : Math.random() * TAU, K.shove); }
        else { F.stat.dodged++; by.dodged++; } } }
    // monsters caught (bosses, mini bosses and the fiend never; none where the stage keeps its monsters' numbers as they are)
    if (tp.demo || !tp.on || !tp.hm || !F.monHit) return; const fly = !!FLY[tp.kind];
    for (const m of X.mons) { if (tp.hm.has(m) || !(fly ? anyMon(m) : groundMon(m))) continue; if (!inArea(tp, m.x, m.y, m.r || 0.4, u)) continue; tp.hm.add(m); F.stat.monHits++; try { X.hitMon(m, dmgOf(F, tp.kind) * 2, { src: 'hazard', noCrit: true }); } catch (e) {} } }
  function burstFx(F, tp) { const X = F.X, K = tp.K, low = lowFx(); if (!tp.on) return; const n = low ? 6 : 12, [cx, cy] = midOf(tp); lightUp(X, tp, 3.0, 0.6);
    if (tp.kind === 'clock') { say(X, 'whoosh'); say(X, 'note', 1320, 0.5, 'sine', 0.06); X.shake && X.shake(1.8, 0.12); }
    else if (tp.kind === 'swap') { for (let i = 0; i < n; i++) X.part({ kind: 'sand', x: tp.x + (Math.random() - 0.5) * 1.4, y: tp.y + (Math.random() - 0.5) * 1.2, vx: (Math.random() - 0.5) * 1.6, vy: -1.5 - Math.random() * 2, g: 5, life: 0.6, max: 0.6, size: 2 + Math.random() * 2, color: Math.random() < 0.6 ? '#B8B0C4' : '#F2EEE4' }); say(X, 'crack'); say(X, 'thud'); X.shake && X.shake(2.2, 0.15); }
    else if (tp.kind === 'column') { say(X, 'crash'); }
    else if (tp.kind === 'lance') { say(X, 'note', 1046, 0.6, 'sine', 0.1); say(X, 'sparkle'); X.shake && X.shake(2.4, 0.16); X.sparks && X.sparks(tp.x, tp.y, K.hi, low ? 5 : 10, 4); }
    else if (tp.kind === 'glass') { say(X, 'crash'); say(X, 'sparkle'); X.shake && X.shake(2.0, 0.14); X.sparks && X.sparks(tp.x, tp.y, K.hi, low ? 6 : 12, 4); }
    else if (tp.kind === 'vhand') { for (let i = 0; i < n; i++) { const a = Math.random() * TAU; X.part({ kind: 'sand', x: tp.x + Math.cos(a) * 0.4, y: tp.y + Math.sin(a) * 0.25, vx: Math.cos(a) * 1.5, vy: -2 - Math.random() * 2, g: 6, life: 0.5, max: 0.5, size: 2 + Math.random() * 2, color: '#3A2A62' }); } say(X, 'crack'); say(X, 'thud'); X.shake && X.shake(2.2, 0.15); }
    else if (tp.kind === 'rift') { say(X, 'note', 294, 0.9, 'sine', 0.14); say(X, 'note', 147, 1.2, 'sine', 0.1); X.shake && X.shake(2.5, 0.2); } }
  // (the column's impact comes part way through its burst: dust and a shake when it lands)
  function columnLand(F, tp) { const X = F.X, n = lowFx() ? 5 : 10; for (let i = 0; i < n; i++) { const s = 0.3 + Math.random() * (tp.K.len - 0.3); X.part({ kind: 'sand', x: tp.x + tp.dir * s, y: tp.y + (Math.random() - 0.5) * 0.4, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random() * 2, g: 6, life: 0.6, max: 0.6, size: 2.5 + Math.random() * 2, color: Math.random() < 0.6 ? '#E9E3D5' : '#C9C0AE' }); } say(X, 'thud'); X.shake && X.shake(3.2, 0.2); }

  /* ---------------- drawing ---------------- */
  const lvl = tp => tp.st === 'warn' ? ease(tp.t / tp.K.warn) : tp.st === 'burst' ? 1 : 0;   // (the build-up: calm 0 .. bright 1)
  const onScr = (X, Xs, Ys, T, m) => Xs > -T * m && Xs < X.W() + T * m && Ys > -T * m && Ys < X.H() + T * (m + 2);
  const mist = (Q, x, y, rx, ry, col, a, sd, drift) => { if (rx > 0.5 && a > 0.005) Q.quad(137, x, y, rx, 0, 0, ry, col, Math.min(1, a), drift || 1, sd || 0, 1); };   // (the painter's drifting bank of mist, kind 137, laid over)
  function gpu(c, L) { if (!L.length) return; const F = fgx(); if (F) { try { const Q = F.begin(c, null); for (const f of L) f(Q); F.flush(c); STATS.gpu++; } catch (e) {} } L.length = 0; }
  const SINK = [];
  // the column's fall: its turn (radians, toward its lane) by its state and time
  function colTurn(tp) { const K = tp.K, t = tp.t; if (tp.st === 'burst') { const f = Math.min(1, t / 0.24); return tp.dir * Math.PI / 2 * f * f * (t > 0.24 ? 1 - 0.04 * Math.sin((t - 0.24) * 30) * Math.max(0, 1 - (t - 0.24) * 4) : 1); }
    if (tp.st === 'rest') { if (t < 2.2) return tp.dir * Math.PI / 2; return tp.dir * Math.PI / 2 * (1 - ease((t - 2.2) / 1.2)); } if (tp.st === 'warn') return tp.dir * 0.05 * ease(t / K.warn) + Math.sin(t * 38) * 0.012 * ease(t / K.warn); return 0; }
  // the glass pane: 0 whole .. 1 gone (shattered, then put back by the borrowed hours)
  function paneGone(tp) { if (tp.st === 'burst') return 1; if (tp.st === 'rest') return tp.t < 1.1 ? 1 : 1 - ease((tp.t - 1.1) / 0.8); return 0; }
  const MK = [];   // (the clock's hour marks on the screen)
  function drawGround(F, c) { const X = F.X, T = X.Tz(), t = X.g.t, lo = lowFx();
    for (const tp of F.traps) { const [cx, cy] = midOf(tp), Xs = X.sx(cx), Ys = X.sy(cy); if (!onScr(X, Xs, Ys, T, 4)) continue;
      const L = lo && tp.st === 'idle' && !(tp.stuck > 0.02) && !SWING[tp.kind] ? (SINK.length = 0, SINK) : F.LG;   /* (st.lowFx: a calm trap's breathing light left out; its picture and its light layer still show) */
      const K = tp.K, k = lvl(tp), calm = 0.5 + 0.5 * Math.sin(t * 1.4 + tp.sd), u = tp.st === 'burst' ? tp.t / K.burst : 0, sc = tp.sc || 1, v = tp.v % 2;
      if (tp.kind === 'pend') { const o = tp.o || 'h'; draw(c, 'slot', o, Xs, Ys, T); draw(c, 'slotg', o, Xs, Ys, T, { add: true, alpha: 0.2 + 0.1 * calm });
        const s = tp.s, ph2 = TAU * (tp.t + 0.3) / tp.period + tp.ph, s2 = K.L * Math.sin(ph2), bX = X.sx(cx + tp.ax * s), bY = X.sy(cy + tp.ay * s), aX = X.sx(cx + tp.ax * s2), aY = X.sy(cy + tp.ay * s2), ax0 = X.sx(tp.x), ay0 = X.sy(tp.y), ax1 = X.sx(tp.x1), ay1 = X.sy(tp.y1);
        F.LG.push(Q => { Q.glow(bX, bY, T * 0.62, K.col, 0.26, FR); Q.star(aX, aY, T * 0.22, 0.5, K.hi); if (!lo) Q.rbeam(ax0, ay0, ax1, ay1, T * 0.14, K.col, 0.05 + 0.03 * calm, 1, 1); }); }
      else if (tp.kind === 'clock') { const gk = tp.st === 'warn' ? 0.3 + 0.6 * k : tp.st === 'burst' ? 1 - u * 0.5 : tp.st === 'rest' ? 0.1 : 0.16 + 0.08 * calm; draw(c, 'dial', v, Xs, Ys, T); draw(c, 'dialg', v, Xs, Ys, T, { add: true, alpha: gk });
        const trem = tp.st === 'warn' ? Math.sin(t * 55) * 0.035 * k : 0, ha = tp.st === 'burst' ? tp.ha : tp.a0 + trem, hs = tp.a0 + 2.2 + (tp.st === 'burst' ? Math.PI / 6 * ease(u) : 0), hy = Ys - T * 0.03;
        draw(c, 'chands', 0, Xs, hy, T, { fl: hs }); draw(c, 'chand', 0, Xs, hy, T, { fl: ha }); const hg = tp.st === 'warn' ? 0.2 + 0.7 * k : tp.st === 'burst' ? 1 - u * 0.4 : 0.12; if (hg > 0.02) draw(c, 'chandg', 0, Xs, hy, T, { fl: ha, add: true, alpha: hg });
        const RX = K.RX, rot = v * 0.26, nlit = tp.st === 'warn' ? Math.floor(k * 12.99) : tp.st === 'burst' ? 12 : 0; MK.length = 0; for (let i = 0; i < nlit; i++) { const am = -Math.PI / 2 + rot + i * Math.PI / 6; MK.push(Xs + Math.cos(am) * 0.79 * RX * T, Ys + Math.sin(am) * 0.79 * RX * FR * T); } const mk = MK.slice();
        L.push(Q => { Q.glow(Xs, Ys, T * RX * (0.6 + 0.45 * k), K.col, 0.05 + 0.03 * calm + 0.3 * k, FR);
          for (let i = 0; i < mk.length; i += 2) Q.star(mk[i], mk[i + 1], T * (0.15 + 0.05 * (i / 2 === mk.length / 2 - 1 ? 1 : 0)), tp.st === 'burst' ? 0.9 * (1 - u) : 0.9, K.hi);
          if (tp.st === 'burst') { Q.glow(Xs, Ys, T * RX * 1.15, '#FFE6A0', 0.42 * (1 - u), FR); for (let j = 0; j < (lo ? 3 : 6); j++) { const aj = ha - j * 0.2, f = 1 - j / 6; Q.rbeam(Xs, hy, Xs + Math.cos(aj) * HAND_L * T, hy + Math.sin(aj) * HAND_L * FR * T, T * 0.14, K.col, 0.5 * f * (1 - u * 0.5), 1, 0.3); } } }); }
      else if (tp.kind === 'stall') { draw(c, 'pool', 0, Xs, Ys, T, { sx: sc, sy: sc }); draw(c, 'poolg', 0, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: 0.4 + 0.15 * calm + 0.35 * tp.stuck });
        L.push(Q => { Q.caustic(Xs, Ys, T * 1.0 * sc, '#E8CF8E', 0.05 + 0.03 * calm + 0.16 * tp.stuck, tp.sd, FR); if (!lo) for (let i = 0; i < 6; i++) { const a = hh(i, 3) * TAU, d = (0.2 + 0.6 * hh(i, 9)) * tp.R; Q.star(Xs + Math.cos(a) * d * T, Ys + Math.sin(a) * d * FR * T, T * 0.07, 0.3 + 0.3 * Math.sin(t * 0.7 + i * 2.1), K.hi); }
          if (tp.stuck > 0.02) { const me = X.me, px = X.sx(me.x), py = X.sy(me.y); Q.ring(px, py - T * 0.3, T * 0.78, '#F2E2B0', 0.35 * tp.stuck, T * 0.06); Q.glow(px, py, T * 0.9, K.col, 0.18 * tp.stuck, FR); Q.ripple(Xs, Ys, T * tp.R * (0.5 + 0.5 * ((t * 0.25) % 1)), K.col, 0.18 * tp.stuck, tp.sd, FR, 0.1); } }); }
      else if (tp.kind === 'swap') { const ruin = tp.st === 'warn' ? 0.12 + 0.4 * k : tp.st === 'burst' ? 1 : tp.n > 0 && tp.t < 1.2 ? 1 - ease(tp.t / 1.2) : 0; draw(c, 'swapn', v, Xs, Ys, T); if (ruin > 0.01) draw(c, 'swapr', v, Xs, Ys, T, { alpha: ruin });
        const gk = tp.st === 'warn' ? 0.3 + 0.6 * k : tp.st === 'burst' ? 0.25 : 0.2 + 0.08 * calm + (tp.n > 0 && tp.t < 1.2 ? 0.6 * (1 - tp.t / 1.2) : 0); draw(c, 'swapg', v, Xs, Ys, T, { add: true, alpha: gk * (1 - 0.6 * ruin) }); const rg = tp.st === 'warn' ? 0.2 + 0.8 * k * (0.85 + 0.15 * Math.sin(t * 24)) : tp.st === 'burst' ? 1 - u : 0; if (rg > 0.02) draw(c, 'swaprg', v, Xs, Ys, T, { add: true, alpha: rg });
        const mend = tp.st === 'idle' && tp.n > 0 && tp.t < 1.2 ? tp.t / 1.2 : -1;
        L.push(Q => { Q.glow(Xs, Ys, T * (0.9 + 0.3 * k), K.col, 0.05 + 0.03 * calm + 0.3 * k, 1); if (k > 0) Q.glow(Xs, Ys, T * 1.15, '#C9B0FF', 0.22 * k, 1); if (tp.st === 'burst') Q.glow(Xs, Ys, T * 1.4, '#FFF0D8', 0.45 * (1 - u), 1); if (mend >= 0) Q.ripple(Xs, Ys, T * (0.4 + 1.1 * mend), '#FFE6A0', 0.45 * (1 - mend), tp.sd, 1, 0.1); }); }
      else if (tp.kind === 'column') { if (tp.st === 'warn' || tp.st === 'burst') { const ax = X.sx(tp.x + tp.dir * 0.3), bx2 = X.sx(tp.x1), yy = X.sy(tp.y); L.push(Q => { if (tp.st === 'warn') { Q.rbeam(ax, yy, bx2, yy, T * (0.28 + 0.12 * k), '#FFF0C8', 0.06 + 0.3 * k, 1, 0.35); Q.star(lerp(ax, bx2, k), yy, T * 0.2, 0.7 * k, K.hi); } else Q.rbeam(ax, yy, bx2, yy, T * 0.5, '#FFF4DA', 0.4 * (1 - u), 1, 0.6); }); } }
      else if (tp.kind === 'lance') { const gk = tp.st === 'warn' ? 0.35 + 0.65 * k : tp.st === 'burst' ? 1 - u * 0.4 : 0.25 + 0.1 * calm; draw(c, 'sun', 0, Xs, Ys, T, { sx: sc, sy: sc }); draw(c, 'sung', 0, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: gk });
        L.push(Q => { Q.glow(Xs, Ys, T * (0.6 + 0.6 * k) * sc, '#FFE8A8', 0.05 + 0.03 * calm + 0.4 * k, FR); if (tp.st === 'burst') { Q.ewave(Xs, Ys, T * (0.5 + 1.0 * u), '#FFD870', 0.4, 0.6 * (1 - u), tp.sd, FR, 0.18); Q.glow(Xs, Ys, T * 1.6, '#FFFFFF', 0.4 * (1 - u), FR); } }); }
      else if (tp.kind === 'glass') { const gone = paneGone(tp); if (gone > 0) draw(c, 'paneh', 0, Xs, Ys, T, { sx: sc, sy: sc }); if (gone < 1) draw(c, 'pane', 0, Xs, Ys, T, { sx: sc, sy: sc, alpha: 1 - gone });
        draw(c, 'paneg', 0, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: (tp.st === 'warn' ? 0.4 + 0.5 * k : 0.22 + 0.1 * calm) * (1 - 0.5 * gone) });
        if (tp.st === 'warn') for (let j = 0; j < 3; j++) { const a = clamp(k * 3.2 - j, 0, 1); if (a > 0.02) draw(c, 'panec', j, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: a * (0.85 + 0.15 * Math.sin(t * 30 + j)) }); }
        L.push(Q => { Q.glow(Xs, Ys, T * 0.9 * sc, '#D8C8FF', 0.04 + 0.03 * calm + 0.35 * k, 1); if (gone > 0) Q.glow(Xs, Ys, T * 0.8 * sc, '#6A3FC0', 0.25 * gone, 1); if (tp.st === 'burst') Q.glow(Xs, Ys, T * 1.3 * sc, '#C9B0FF', 0.5 * (1 - u), 1); }); }
      else if (tp.kind === 'vhand') { const gk = tp.st === 'warn' ? 0.3 + 0.7 * k : tp.st === 'burst' ? 1 - u * 0.5 : tp.st === 'rest' ? 0.35 * (1 - clamp(tp.t / 1.5, 0, 1)) : 0.32 + 0.12 * calm; draw(c, 'seam', v, Xs, Ys, T, { sx: sc, sy: sc }); draw(c, 'seamg', v, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: gk });
        L.push(Q => { Q.glow(Xs, Ys, T * (0.7 + 0.6 * k) * sc, '#B48CFF', 0.06 + 0.03 * calm + 0.35 * k, FR); if (tp.st === 'burst') Q.glow(Xs, Ys, T * 1.4 * sc, K.hi, 0.3 * (1 - u), FR); }); }
      else if (tp.kind === 'rift') { draw(c, 'rsig', 0, Xs, Ys, T, { sx: sc, sy: sc }); draw(c, 'rsigg', 0, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: 0.25 + 0.1 * calm + 0.7 * k });
        L.push(Q => { Q.glow(Xs, Ys, T * (0.8 + 0.6 * k), K.col, 0.06 + 0.03 * calm + 0.3 * k, FR); if (tp.st === 'warn') Q.evortex(Xs, Ys, T * 1.0 * sc, '#9B6BFF', 0.4 + 0.4 * k, 0.12 + 0.4 * k, tp.sd, -(1.5 + 4 * k), FR);
          if (tp.st === 'burst') { const fr = ringFront(tp, u) * T; Q.ewave(Xs, Ys, fr, '#A07CFF', 0.45, 0.95 * (1 - u * 0.6), tp.sd, FR, 0.14); Q.ripple(Xs, Ys, fr * 1.02, '#E2D4FF', 0.7 * (1 - u * 0.7), tp.sd, FR, 0.07); Q.ring(Xs, Ys, fr, '#F2EAFF', 0.55 * (1 - u * 0.8), T * 0.12, FR); Q.glow(Xs, Ys, fr * 1.1, K.col, 0.12 * (1 - u), FR); } }); } }
    gpu(c, F.LG); }
  function drawStand(F, tp, c) { const X = F.X, T = X.Tz(), t = X.g.t, K = tp.K, k = lvl(tp), u = tp.st === 'burst' ? tp.t / K.burst : 0, sc = tp.sc || 1, v = tp.v % 2;
    if (tp.kind === 'pend') { const Xc = X.sx(tp.cx), Yc = X.sy(tp.cy); if (!onScr(X, Xc, Yc, T, 4)) return; const s = tp.s, th = Math.asin(clamp(s / ROD_L, -1, 1)), pivY = Yc - T * (ROD_L + HUB_H);
      if ((tp.o || 'h') === 'h') { c.save(); c.translate(Xc, pivY); c.rotate(-th); draw(c, 'rod', 0, 0, ROD_L * T, T); draw(c, 'blade', 0, 0, ROD_L * T, T); c.restore(); }
      else { const hubY = X.sy(tp.cy + s) - T * (HUB_H + ROD_L * (1 - Math.cos(th))), sy = (hubY - pivY) / (ROD_L * T); draw(c, 'rod', 0, Xc, hubY, T, { sy: clamp(sy, 0.2, 2) }); draw(c, 'bladee', 0, Xc, hubY, T); } return; }
    if (tp.kind === 'column') { const Xs = X.sx(tp.x), Ys = X.sy(tp.y); if (!onScr(X, Xs + tp.dir * T, Ys, T, 4)) return; const rot = colTurn(tp), lie = Math.abs(rot) / (Math.PI / 2);
      draw(c, 'colsh', 0, Xs + tp.dir * T * 0.9 * lie, Ys, T, { sx: 1 + 1.4 * lie, alpha: 0.9 }); draw(c, 'colm', v, Xs, Ys, T, { rot });
      const gl = tp.st === 'warn' ? 0.2 + 0.8 * k : tp.st === 'burst' ? 1 - u * 0.6 : tp.st === 'rest' && tp.t > 2.2 ? 0.8 * (1 - clamp((tp.t - 3.4) / 0.6, 0, 1)) : 0.06; if (gl > 0.02) draw(c, 'colmg', v, Xs, Ys, T, { rot, add: true, alpha: gl * (0.85 + 0.15 * Math.sin(t * (6 + 20 * k))) }); return; }
    if (tp.kind === 'vhand') { const Xs = X.sx(tp.x), Ys = X.sy(tp.y); if (!onScr(X, Xs, Ys, T, 3)) return; let h = 0, cl = 0; if (tp.st === 'warn') { const f = ease(tp.t / K.warn); h = 0.12 + 0.2 * f; cl = 0.2 * f; } else if (tp.st === 'burst') { h = Math.min(1, u / 0.2); cl = 0.2 + 0.8 * Math.min(1, Math.max(0, (u - 0.25) / 0.3)); } else if (tp.st === 'rest' && tp.t < 0.6) { h = 1 - tp.t / 0.6; cl = 1; } if (h < 0.02) return;
      for (const s of [-1, 1]) { const hx = Xs + s * T * 0.42 * sc + (tp.st === 'warn' ? Math.sin(t * 30 + s) * T * 0.02 : 0), hy = Ys + T * 0.04; draw(c, 'vhand', s < 0 ? 0 : 1, hx, hy, T, { sx: 1.3 * sc * (1 - 0.15 * cl), sy: 1.3 * h * sc, rot: s * -0.35 * cl }); } } }
  // the light in the air: laid into the dungeon's shared GPU pass when it runs (lay), else a pass of its own (drawOver)
  function buildOver(F) { const X = F.X, T = X.Tz(), t = X.g.t, L = F.LL, lo = lowFx(); L.length = 0;
    for (const tp of F.traps) { const K = tp.K, k = lvl(tp), Xs = X.sx(tp.x), Ys = X.sy(tp.y), u = tp.st === 'burst' ? tp.t / K.burst : 0, sc = tp.sc || 1; if (ZONE[tp.kind]) continue;
      if (tp.kind === 'pend') { const Xc = X.sx(tp.cx), Yc = X.sy(tp.cy); if (!onScr(X, Xc, Yc, T, 3)) continue; const vel = Math.abs(Math.cos(TAU * tp.t / tp.period + tp.ph)), tipAt = s => { const th = Math.asin(clamp(s / ROD_L, -1, 1)), Lr = (ROD_L + 0.5) * T, pivY = Yc - T * (ROD_L + HUB_H); if ((tp.o || 'h') === 'h') return [Xc + Math.sin(th) * Lr, pivY + Math.cos(th) * Lr]; return [Xc, X.sy(tp.cy + s) - T * (HUB_H - 0.5 + ROD_L * (1 - Math.cos(th)))]; };
        L.push(Q => { const [bx, by] = tipAt(tp.s); Q.star(bx, by, T * 0.16, 0.3 + 0.45 * vel, K.hi); if (!lo && vel > 0.3) { let [px, py] = [bx, by]; for (let j = 1; j <= 4; j++) { const s2 = K.L * Math.sin(TAU * (tp.t - j * 0.035) / tp.period + tp.ph), [qx, qy] = tipAt(s2); Q.rbeam(px, py, qx, qy, T * 0.2, '#FFE8B0', 0.16 * vel * (1 - j / 5), 1, 0.6); px = qx; py = qy; } } }); continue; }
      if (tp.kind === 'clock') { if (tp.st !== 'burst' || !onScr(X, Xs, Ys, T, 3)) continue; L.push(Q => { const tx = Xs + Math.cos(tp.ha) * HAND_L * T, ty = Ys - T * 0.03 + Math.sin(tp.ha) * HAND_L * FR * T; Q.star(tx, ty, T * 0.3 * (1 - u * 0.5), 0.9 * (1 - u * 0.5), K.hi); if (!lo) Q.glow(tx, ty, T * 0.5, K.col, 0.3 * (1 - u)); }); continue; }
      if (tp.kind === 'swap') { if (!onScr(X, Xs, Ys, T, 3)) continue; if (tp.st === 'warn' && !lo) L.push(Q => { for (let i = 0; i < 5; i++) { const ph = (t * (0.6 + 1.4 * k) + i / 5) % 1; Q.star(Xs + (hh(i, 4) - 0.5) * T * 1.4, Ys + (hh(i, 8) - 0.5) * T * 1.2 - T * ph * 0.9, T * 0.06, k * Math.sin(ph * Math.PI), i % 2 ? '#C9B0FF' : K.hi); } });
        else if (tp.st === 'burst') L.push(Q => { const n = lo ? 3 : 6; for (let i = 0; i < n; i++) { const a = i / n * TAU + tp.sd, d = T * (0.3 + 0.7 * u); Q.smoke(Xs + Math.cos(a) * d, Ys - T * 0.15 - T * 0.4 * u + Math.sin(a) * d * 0.5, T * (0.35 + 0.45 * u), 0.38 * (1 - u), tp.sd + i, '#BDB2C8', 0.6); } }); continue; }
      if (tp.kind === 'column') { if (!onScr(X, Xs + tp.dir * T, Ys, T, 4)) continue;
        if (tp.st === 'warn' && !lo) L.push(Q => { for (let i = 0; i < 4; i++) { const ph = (t * (0.9 + 1.5 * k) + i / 4) % 1; Q.star(Xs + (hh(i, 6) - 0.5) * T * 0.4, Ys - T * (COL_H - ph * (COL_H - 0.2)), T * 0.06, k * Math.sin(ph * Math.PI), K.hi); } Q.glow(Xs, Ys - T * COL_H * 0.6, T * 0.7, K.col, 0.2 * k); });
        else if (tp.st === 'burst' && tp.t > 0.22) L.push(Q => { const e = clamp((tp.t - 0.22) / 0.38, 0, 1), n = lo ? 3 : 6; for (let i = 0; i < n; i++) { const s = (i + 0.5) / n; Q.smoke(X.sx(tp.x + tp.dir * (0.3 + s * (K.len - 0.3))), Ys - T * (0.2 + 0.3 * e), T * (0.4 + 0.4 * e), 0.42 * (1 - e), tp.sd + i, '#D8D0C2', 0.6); } });
        else if (tp.st === 'rest' && tp.t > 2.2 && tp.t < 3.6 && !lo) L.push(Q => { const f = clamp((tp.t - 2.2) / 1.2, 0, 1); for (let i = 0; i < 5; i++) { const ph = (t * 1.2 + i / 5) % 1; Q.star(Xs + tp.dir * T * (1 - f) * (0.3 + 1.3 * hh(i, 2)), Ys - T * (0.3 + ph * 1.4), T * 0.07, 0.7 * Math.sin(ph * Math.PI) * (1 - f * 0.5), '#FFE6A0'); } }); continue; }
      if (tp.kind === 'lance') { if (!onScr(X, Xs, Ys, T, 4) || (tp.st !== 'warn' && tp.st !== 'burst')) continue; L.push(Q => { const top = Ys - T * 7.5;
          if (tp.st === 'warn') { const w = T * (0.08 + 0.26 * k); Q.rbeam(Xs, top, Xs, Ys, w * 2.2, '#FFE8B0', 0.08 + 0.18 * k, 0, 1); Q.rbeam(Xs, top, Xs, Ys, w, '#FFFFFF', 0.12 + 0.4 * k, 0, 1); if (!lo) for (let i = 0; i < 6; i++) { const ph = (t * (0.7 + 1.4 * k) + i / 6) % 1, a = i / 6 * TAU + t * 2, d = T * 1.2 * (1 - ph); Q.star(Xs + Math.cos(a) * d, Ys - T * 0.4 + Math.sin(a) * d * FR, T * 0.07, k * Math.sin(ph * Math.PI), K.hi); } }
          else { const f = 1 - u; Q.rbeam(Xs, top, Xs, Ys, T * 1.7, '#FFE08A', 0.35 * f, 0, 1); Q.rbeam(Xs, top, Xs, Ys, T * 0.7, '#FFFFFF', 0.85 * f, 0, 1); Q.star(Xs, Ys - T * 0.3, T * (1.1 - 0.6 * u), f, '#FFFFFF'); Q.glow(Xs, Ys - T * 0.8, T * 1.6, '#FFF2C0', 0.4 * f, 1.4); } }); continue; }
      if (tp.kind === 'glass') { if (!onScr(X, Xs, Ys, T, 3)) continue;
        if (tp.st === 'burst') L.push(Q => { const f = 1 - u, n = lo ? 6 : 12; for (let i = 0; i < n; i++) { const a = hh(i, tp.n) * TAU, sp = 0.4 + hh(i, 3), d = T * (0.2 + 1.3 * sp * Math.sqrt(u)), x2 = Xs + Math.cos(a) * d, y2 = Ys - T * (0.2 + 1.2 * u * sp) + Math.sin(a) * d * 0.5 + T * 2.0 * u * u; Q.star(x2, y2, T * 0.09, 0.9 * f, i % 3 ? K.col : K.hi); if (!lo) Q.rbeam(Xs + Math.cos(a) * d * 0.7, y2 + T * 0.05, x2, y2, T * 0.06, K.hi, 0.5 * f, 0.2, 1); } });
        else if (tp.st === 'rest' && tp.t > 0.8 && tp.t < 1.9 && !lo) L.push(Q => { const f = clamp((tp.t - 0.8) / 1.1, 0, 1); for (let i = 0; i < 8; i++) { const a = hh(i, 7) * TAU, d = T * 1.2 * (1 - f); Q.star(Xs + Math.cos(a) * d, Ys - T * 0.2 + Math.sin(a) * d * 0.5, T * 0.07, 0.8 * Math.sin(f * Math.PI), K.hi); } });
        else if (tp.st === 'warn' && !lo) L.push(Q => { for (let i = 0; i < 3; i++) { const ph = (t * 2.2 + i / 3) % 1; Q.star(Xs + (hh(i, 2) - 0.5) * T * 0.9, Ys + (hh(i, 5) - 0.5) * T * 0.9, T * 0.08, k * Math.sin(ph * Math.PI), K.hi); } }); continue; }
      if (tp.kind === 'vhand') { if (!onScr(X, Xs, Ys, T, 3)) continue; if (tp.st === 'warn') { if (!lo) L.push(Q => { for (let i = 0; i < 4; i++) { const ph = (t * (0.7 + 1.5 * k) + i / 4) % 1; Q.star(Xs + (hh(i, 9) - 0.5) * T * 1.2 * sc, Ys - T * ph * 0.9, T * 0.07, k * Math.sin(ph * Math.PI), i % 2 ? K.col : K.hi); } Q.glow(Xs, Ys - T * 0.2, T * 0.7, K.col, 0.25 * k); }); }
        else if (tp.st === 'burst') L.push(Q => { for (const s of [-1, 1]) Q.glow(Xs + s * T * 0.38 * sc, Ys - T * 0.7, T * 0.55, K.col, 0.4 * (1 - u)); }); continue; }
      if (tp.kind === 'rift') { if (!onScr(X, Xs, Ys, T, 3)) continue; if (lo && tp.st === 'idle') continue; L.push(Q => { const hy = Ys - T * 1.35, open = tp.st === 'warn' ? 0.25 + 0.75 * k : tp.st === 'burst' ? (1 - Math.min(1, u * 5)) : 0.18 + 0.05 * Math.sin(t * 2 + tp.sd), hgt = T * (0.55 + 0.35 * open), wid = T * (0.04 + 0.2 * open);
          Q.glow(Xs, hy, hgt * 1.3, K.col, 0.12 + 0.35 * open, 2.2); Q.rbeam(Xs, hy - hgt, Xs, hy + hgt, wid * 2.2, '#8E6BD0', 0.25 + 0.45 * open, 0, 0); Q.rbeam(Xs, hy - hgt * 0.9, Xs, hy + hgt * 0.9, wid, '#F2EAFF', 0.35 + 0.55 * open, 0.2, 0.2);
          if (tp.st === 'warn' && !lo) for (let i = 0; i < 6; i++) { const ph = (t * (0.8 + 1.6 * k) + i / 6) % 1, a = i / 6 * TAU + t * 3, d = T * 1.1 * (1 - ph); Q.star(Xs + Math.cos(a) * d, hy + Math.sin(a) * d * 0.8, T * 0.06, k * Math.sin(ph * Math.PI), K.hi); }
          if (tp.st === 'burst') Q.star(Xs, hy, T * (1.0 - 0.7 * u), 1 - u, '#FFFFFF'); }); continue; } } }
  function lay(c, Q) { if (!Q) return; for (const F of FIELDS) { if (!F.live) continue; buildOver(F); for (const f of F.LL) { try { f(Q); } catch (e) {} } F.LL.length = 0; F.laidT = F.X.g.t; STATS.laid++; } }

  /* ======================= the rift's stages ======================= */
  function ensureBase(X) { if (!BASE) { try { BASE = Math.round(X.Tz() * Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1)); } catch (e) { BASE = 48; } } }
  function stageTraps(X, self, H, sec, n, puz) { if (off() || !BP()) return null; ensureBase(X);
    clear(); const F = puz ? place(X, H, { sec, n: 1, puzzle: true, count: puz.n, kinds: puz.kinds, mon: puz.mon, keep: puz.keep }) : place(X, H, { sec, n }); self.septraps = F;
    return { update(dt) { if (F.live && !F.freeze) F.tick(Math.min(dt, 0.1)); }, drawGround(c) { F.drawGround(c); }, drawOver(c) { F.drawOver(c); } }; }
  function merge(a, b) { if (!b) return a; const o = Object.assign({}, a);
    o.update = dt => { if (a.update) a.update(dt); b.update(dt); }; o.drawGround = c => { if (a.drawGround) a.drawGround(c); b.drawGround(c); }; o.drawOver = c => { if (a.drawOver) a.drawOver(c); b.drawOver(c); }; return o; }
  // (a stage's own object is kept as it is, its own methods wrapped in place: the stage and its tests hold on to it)
  function graft(a, b) { if (!b || !a) return a; const u0 = a.update, g0 = a.drawGround, o0 = a.drawOver;
    a.update = function (dt) { const r = u0 ? u0.apply(this, arguments) : undefined; b.update(dt); return r; }; a.drawGround = function (c) { if (g0) g0.apply(this, arguments); b.drawGround(c); }; a.drawOver = function (c) { if (o0) o0.apply(this, arguments); b.drawOver(c); }; return a; }
  function hook() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.sepulchre; if (!Rf || Rf.__sept) return; Rf.__sept = 1;
      Rf.stages.forEach((S, i) => { const pz = S.kind === 'puzzle' ? PUZ[S.name] : null; if (S.kind !== 'fight' && !pz) return; const P = typeof riftStagePos === 'function' ? riftStagePos(Rf, i) : { sec: 1, n: 1 }, sec = P.sec, n = P.n;
        if (S.kind === 'fight') { const ex = S.extra; S.extra = function (X, self, H) { const a = ex ? ex.call(this, X, self, H) || {} : {}; let b = null; try { b = stageTraps(X, self, H, sec, n, null); } catch (e) { b = null; if (typeof console !== 'undefined') console.warn('SEP_TRAPS', e); } return merge(a, b); }; }
        else { const mk = S.make; S.make = function (X, self, H) { const a = mk.call(this, X, self, H); let b = null; try { b = stageTraps(X, self, H, sec, n, pz); } catch (e) { b = null; if (typeof console !== 'undefined') console.warn('SEP_TRAPS', e); } return graft(a, b); }; }
        const pre = S.preload, kinds = pz ? pz.kinds.filter((k, j, a2) => a2.indexOf(k) === j) : null; S.preload = function (P2) { let a = []; try { a = pre ? pre.apply(this, arguments) || [] : []; } catch (e) {} return (Array.isArray(a) ? a : []).concat(warm(P2, sec, kinds)); }; S.stSec = sec; S.stN = n; }); } catch (e) {} }
  hook();
  // the dead stage let go: when any stage is made or closed (its field, the slows it set, every picture)
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) {}
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__septRel) { const c0 = GD.create; GD.__septRel = 1; GD.create = function () { release(); const gm = c0.apply(this, arguments); try { if (gm && typeof gm.destroy === 'function') { const d0 = gm.destroy; gm.destroy = function () { release(); return d0.apply(this, arguments); }; } } catch (e) {} return gm; }; } } catch (e) {}
  const API = { place, clear, release, lay, KINDS, SPEC, MIX, BRIDGE, PUZ, kindsOf, TAUGHT, fields: () => FIELDS, dmg: dmgOf, draw, sprite: (n, v, P) => sprite(n, v, P, true), warm, hook, DEFS, PICS, LIGHTS, hashLayout, get base() { return BASE; }, set base(v) { BASE = v | 0; }, get stats() { return Object.assign({ cached: CACHE.size, live: FIELDS.length, bytes: picBytes() }, STATS); } };
  try { self.SEP_TRAPS = API; } catch (e) {}
  return API;

})();
