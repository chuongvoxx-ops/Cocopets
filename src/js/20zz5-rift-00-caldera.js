/* ---------- Rift 0: The Blackfire Caldera (the core) ----------
   The introductory rift, level 1, inside an active volcano. Its outer tunnels are natural basalt caverns, its middle
   chambers an ancient runic forge, its deepest chamber a colossal caldera round Ifrit's throne. Fractured basalt,
   cooled lava crust with glowing seams, soot, weathered metal, black glass and drifting embers; compact readable floors
   against enormous distant lavafalls. Dark fire crystals (glossy black and deep violet outside, smouldering red-orange
   fractures and slowly circulating light inside) grow from the walls and send pulses toward the volcano's heart. Ancient
   frost crystals stand in protected stone wells (white-blue facets, frost patterns, the snowflake emblem, a chime): the
   cold machinery any pet can wake.
   Lands:  ashen (The Ashen Hollows: basalt caverns, cooled crust, soot, ash) · foundry (The Runebound Foundry: riveted iron
           plates, rune-cut basalt, grates over lava) · heartward (The Heartward Descent: black glass and basalt ledges,
           crystal veins) · calderapit (the three boss arenas' land)
   Stages: 0 The Ashen Hollows (trial: combat + the Frozen Causeway) · 1 Fire Flan
           2 The Runebound Foundry (trial: combat, the bomb-return lesson, the Three Rune Rings) · 3 Bomb King
           4 The Heartward Descent (trial: traversal and combat) · 5 Ifrit, Heart of the Volcano (seals the rift)
   (the trials are CAL_STAGES, 20zz4, which loads before this file: every CAL use there is inside make(); the three boss
   files 20zz6/7/8 load after it and fill CAL.bossMake[fiendId] with their arenas)

   ======================= THE SHARED API (CAL.*) — the stages (20zz4) and the bosses (20zz6/7/8) code against it =======================
   Palette (hex): CAL.BASALT #2B2627 (BASALT_HI, BASALT_D), CAL.ASH #8C837E (ASH_HI, ASH_D), CAL.SOOT #161214,
     CAL.LAVA #FF6A1F (LAVA_HI #FFC24A, LAVA_D #B8300E), CAL.EMBER #FF8A3D, CAL.GLASS #120E16 (obsidian),
     CAL.CRYSTAL #17101F (CRYSTAL_HI #4A2C6E violet, FRACTURE #FF5A2A, FRACTURE_HI #FFB070),
     CAL.FROST #CFEFFF (FROST_HI #FFFFFF, FROST_D #86BCE8, FROST_DEEP #3E78B8), CAL.IRON #3A383D (IRON_HI, IRON_D),
     CAL.RUST #6E3A22, CAL.RUNE #FFB347 (the foundry's rune light), CAL.WARN #FF4D6D (hostile shapes keep the game's red),
     CAL.SAFE #8FE0A6 (a safe side, a ready bomb), CAL.INK '#2B2433' (outline).
   Settings: CAL.lowFx() -> !!st.lowFx (decoration only: embers, crystal pulses, heat shimmer; never hazards, timers,
     weak points or cues).
   GPU: CAL.gpu(c) -> { F, Q } or null (Nidhogg's painter, NIDHOGG_MOVES.FGFX: Q.glow/fire/tongue/ground/eorb/ebeam/smoke...
     in screen px; null with no WebGL, a software rasteriser, window.__CAL_GL = 0); CAL.gpuEnd(c, G) flushes it. Every
     effect below has a 2D fallback.

   Art (canvas, screen px; T a tile in px)
     CAL.glow(c, x, y, r, col, a)                     a soft additive glow (unoutlined)
     CAL.snowflake(c, x, y, s, col, lw)               the frost emblem: six arms, two pairs of branches, a hexagon heart
     CAL.emblem(c, x, y, s, k)                        the emblem cut in a dark round plaque with a white-blue rim (k: lit 0..1)
     CAL.frostCrystal(c, x, y, h, o)                  a cluster of white-blue faceted prisms with frost patterns; o.k glow,
                                                      o.integ 0..1 (cracks as it falls), o.broken (stumps and shards), o.v
     CAL.frostWellArt(c, Xs, Ys, T, o)                a protected stone well (dressed basalt ring, rime, the emblem plaque on
                                                      its front) holding a frost crystal; Ys is the well's centre on the
                                                      floor. o: { k (activation glow), charge (0..1, a ring when o.showCharge),
                                                      integ, broken, awake (the Hellfire cue: a beating ring), label, scale }
     CAL.coldField(c, X, x, y, r, k, o)               a marked cooling zone on the floor (world centre, radius in tiles): a
                                                      white-blue disc, a frost ring with snowflake ticks, k strength (0..1);
                                                      o.label, o.refuge (Ifrit's refuge: a stronger dome edge)
     CAL.crystalArt(c, x, y, s, o)                    a black fire crystal cluster s tall: glossy black/violet facets,
                                                      smouldering red-orange fractures, the inner light at o.ph (0..1);
                                                      o.k glow/pulse, o.dim (inert: no fire), o.broken, o.v (variant), o.tether
     CAL.glyph(c, x, y, s, kind, col, lw)             the rune glyphs 'eye' | 'chain' | 'crown' (distinct by shape)
     CAL.rune(c, x, y, s, i, col, lw)                 one of eight angular forge runes (i), for engravings
     CAL.lavaPoolArt(c, X, pool)                      a walkable lava pool (as the lava rule registers them)
     CAL.label(c, s, x, y, size, col)                 outlined text
     CAL.basalt(c, pts, lw, o)                        a faceted basalt block from a polygon (lit, mid, shade; o.seam glows)
   Arena painters for the boss files (fiend defs: paintGround(c, A2) is in world tiles, sky(c, W, H, t, cam, T) in px):
     CAL.paintSky(c, W, H, T, o)                      the caldera's far walls: smoke, distant lavafalls, eruption light
                                                      (o.calm: after Ifrit; o.heart: a throne-ward glow)
     CAL.paintPlatform(c, R, rnd, o)                  a circular basalt platform of radius R tiles round (0, 0): hex fractures,
                                                      cooled crust with seams, a crumbled rim over glowing lava; o.seams 0..1
     CAL.ringProps(C, o) -> [{ kind, x, y, v, s }]    props round an arena (basalt columns, black crystals, lavafalls) for
                                                      a fiend def's props(C) / drawProp (DunWorld.PROPS[kind](c, T * s, v))

   The running context (one per running game, shared by make() and everyStage, as CHO.ctx):
     CAL.ctx(X) -> { X, t, lava, vents, flights, larvae, safe, ledge, stat }   (tests: X.rift.self.amb.CAL / .C)
     stat: { lavaTouches, falls, returns, bombHits, vents }

   The lava rule (every stage; boss arenas too)
     Gaps (lava below the ledges) only ever block walking. Lava you can touch is registered:
     CAL.lavaPool(X, { x, y, r }) -> pool               a round pool (world centre, radius in tiles), drawn molten on the floor
     CAL.lavaTiles(X, tiles) -> pool                    walkable tiles [{ tx, ty }] drawn as a molten flow
     CAL.unlava(X, pool); CAL.inLava(X, x, y)
     Touching it: modest damage (7% of the pet's health), a hiss and "Too hot!", and the pet is slid back to its last
     safe ground (tracked every 0.15 s, never within 0.7 of lava); a 1 s grace before it can burn again. Never a kill
     on its own: the burn stops at 1 HP. A dodge roll passes over without burning.
     CAL.lavaTouch(X, o)   the rule itself (o.dmgK); CAL.lavaContact(X, safe, o) the same with a caller's safe spot;
     CAL.safeSpot(X) -> { x, y }
   Falls (the Descent): CAL.setLedge(X, x, y) records the last broad cooling ledge; CAL.fall(X, o) returns the pet there
     with a modest penalty (6%, never a kill), a soft fade ring and "You slipped back to the ledge".
   Vents (S may use them, or copy): CAL.vent(X, { x, y, r, period, warn, erupt, dmg, phase, demo, on }) -> vent
     idle -> glow and hiss for `warn` s (a ring that fills, a hiss) -> erupts for `erupt` s (a column of fire; the pet
     inside r takes dmg once and is pushed out) -> idle. vent.on = false parks it; demo: harmless (a label "SAFE TO WATCH").
   Bombs (the foundry lesson and Bomb King use exactly this)
     A bomb larva (MON 'bomblarva') hovers to a spot near the pet, lands (a marker first), and its fuse runs: the first
     part is SAFE (a green ring, a return arrow and "HIT IT!": any attack that touches it returns it), the rest flashes
     red (DODGE: a shrinking ring and damage circle; hits no longer return it); then it bursts (pet inside: its damage).
     CAL.dropBomb(X, x, y, o) -> larva                  a larva that drops straight onto (x, y): o.fuse (6), o.safe (3),
                                                       o.dmg, o.tut (a gentle teaching bomb: x0.35 damage, safe 4.5 of 7),
                                                       o.target (fixed return target), o.cap (max live grounded: skip if over)
     CAL.returnBomb(X, from, o) -> flight              fly a returned bomb from { x, y } to o.target or CAL.bombTarget(X, from)
                                                       (the boss first, else the nearest monster that is not a larva within
                                                       10 tiles, else 5 tiles ahead) with aim assist (it homes), and burst
                                                       there. It never hurts the pet. On arrival: o.onHit(target, f), else
                                                       CAL.onBombHit(X, target, f) when a boss file sets it (return true to
                                                       take it over), else 8x the pet's attack to the target and half that
                                                       round it.
     CAL.bombTarget(X, from); CAL.larvae(X) -> grounded live larvae; CAL.larvaState(m) -> 'hover'|'land'|'safe'|'red'|null
   The recovery station before each boss: CAL.recoveryStation(X, H, x, y, o) -> obj (a basalt cairn with a frost spring:
     stand by it to recover all health and MP, once; o.label)
   The black crystals' pulses: CAL.heartDir(X) -> [ux, uy] (toward the stage's exit or the arena's centre)

   Monsters (MON, painters, AI): cinderslug, basaltcrawler, emberwisp, furnaceimp, runicsentinel, bomblarva,
   ashenknight, crystalwisp (see the brood section for each one's rule and tuning).
   The boss stages: make: (X, self, H) => CAL.bossMake[S.boss](X, self, H) — the boss files own their arenas.
   SEALING: THE EMBER SIGIL. The seal reward: ACC_SPECIAL.ember (a bracelet: the Ember Charm); 21b must map caldera → 'ember'. */
const CAL = { BASALT: '#2B2627', BASALT_HI: '#4E4547', BASALT_D: '#151112', ASH: '#8C837E', ASH_HI: '#BDB4AC', ASH_D: '#58504C', SOOT: '#161214',
  LAVA: '#FF6A1F', LAVA_HI: '#FFC24A', LAVA_D: '#B8300E', EMBER: '#FF8A3D', GLASS: '#120E16', CRYSTAL: '#17101F', CRYSTAL_HI: '#4A2C6E', FRACTURE: '#FF5A2A', FRACTURE_HI: '#FFB070',
  FROST: '#CFEFFF', FROST_HI: '#FFFFFF', FROST_D: '#86BCE8', FROST_DEEP: '#3E78B8', IRON: '#3A383D', IRON_HI: '#6E6A70', IRON_D: '#1C1A1E', RUST: '#6E3A22', RUNE: '#FFB347',
  WARN: '#FF4D6D', SAFE: '#8FE0A6', INK: '#2B2433' };
CAL.bossMake = CAL.bossMake || {};
(() => {
  const TAU = Math.PI * 2, { BASALT, BASALT_HI, BASALT_D, ASH, ASH_HI, ASH_D, SOOT, LAVA, LAVA_HI, LAVA_D, EMBER, GLASS, CRYSTAL, CRYSTAL_HI, FRACTURE, FRACTURE_HI, FROST, FROST_HI, FROST_D, FROST_DEEP, IRON, IRON_HI, IRON_D, RUST, RUNE, WARN, SAFE } = CAL;
  const { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt, { PROPS } = DunWorld;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const rnd = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const ink = (c, lw, a) => { c.strokeStyle = a == null ? LN : `rgba(43,36,51,${a})`; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const glow = (c, x, y, r, col, a) => { if (!(a > 0.004) || !(r > 0)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(Math.max(10, size))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
  const snd = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(8,4,4,${a || 0.36})`; ell(c, 0, T * 0.03, T * w, T * w * 0.32); c.fill(); };
  /* the GPU painter (Nidhogg's, shared by the dungeon's own pass): null where it cannot run */
  function gpu(c, deco) { try { if (window.__CAL_GL === 0 || (deco && lowFx())) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (!F || !F.usable()) return null; return { F, Q: F.begin(c, null) }; } catch (e) { return null; } }
  function gpuEnd(c, G) { if (G) try { G.F.flush(c); } catch (e) {} }
  Object.assign(CAL, { lowFx, glow, label, gpu, gpuEnd, rgba });

  /* ======================= art helpers ======================= */
  /* the frost emblem: six arms from a hexagon heart, each with two pairs of branches and a diamond tip */
  function snowflake(c, x, y, s, col, lw) { const r = s / 2; c.save(); c.translate(x, y); c.strokeStyle = col || FROST_HI; c.fillStyle = col || FROST_HI; c.lineWidth = lw || Math.max(1.2, s * 0.07); c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); c.moveTo(ca * r * 0.26, sa * r * 0.26); c.lineTo(ca * r * 0.84, sa * r * 0.84);
      for (const [u, L] of [[0.46, 0.3], [0.68, 0.2]]) { const bx = ca * r * u, by = sa * r * u; for (const sd of [-1, 1]) { const b = a + sd * 0.95; c.moveTo(bx, by); c.lineTo(bx + Math.cos(b) * r * L, by + Math.sin(b) * r * L); } } }
    c.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), tx = ca * r * 0.92, ty = sa * r * 0.92, w = r * 0.07; c.beginPath(); c.moveTo(tx + ca * r * 0.1, ty + sa * r * 0.1); c.lineTo(tx - sa * w, ty + ca * w); c.lineTo(tx - ca * r * 0.08, ty - sa * r * 0.08); c.lineTo(tx + sa * w, ty - ca * w); c.closePath(); c.fill(); }
    c.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * TAU - Math.PI / 2 + Math.PI / 6, px = Math.cos(a) * r * 0.24, py = Math.sin(a) * r * 0.24; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
    c.restore(); }
  /* the emblem cut into a round dark plaque with a white-blue rim; k lights it (0..1) */
  function emblem(c, x, y, s, k) { k = k || 0; const r = s / 2; c.save();
    c.beginPath(); c.arc(x, y, r, 0, TAU); const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, '#3A4250'); g.addColorStop(1, '#141820'); c.fillStyle = g; c.fill(); ink(c, Math.max(1.2, s * 0.06));
    c.beginPath(); c.arc(x, y, r * 0.86, 0, TAU); c.strokeStyle = rgba(FROST_D, 0.65 + 0.35 * k); c.lineWidth = Math.max(1, s * 0.05); c.stroke();
    snowflake(c, x + s * 0.02, y + s * 0.025, s * 0.72, 'rgba(0,0,0,.55)', Math.max(1, s * 0.06));
    snowflake(c, x, y, s * 0.72, k > 0.05 ? '#F4FBFF' : '#BFD8EE', Math.max(1, s * 0.05));
    if (k > 0.02) glow(c, x, y, r * 1.8, FROST, 0.45 * k);
    c.restore(); }
  /* one faceted shard standing on (x, y): w wide at its foot, h tall, its tip leaning by lean (fraction of h). Three
     upright faces (left lit, front, right in shade) and a three-faced cap. cols = [left, front, right, capL, capF, capR] */
  function shardGeo(x, y, w, h, lean) { const tx = x + lean * h, ty = y - h, cut = 0.68, bx = [x - w / 2, x - w * 0.14, x + w * 0.2, x + w / 2], by = [y + w * 0.08, y + w * 0.16, y + w * 0.14, y + w * 0.04];
    const ux = bx.map((v, i) => lerp(v, tx, cut * 0.62) + (i === 0 || i === 3 ? 0 : 0)), uy = by.map(v => lerp(v, ty, cut));
    return { tx, ty, bx, by, ux, uy, outline: [[bx[0], by[0]], [ux[0], uy[0]], [tx, ty], [ux[3], uy[3]], [bx[3], by[3]], [bx[2], by[2]], [bx[1], by[1]]] }; }
  function shard(c, x, y, w, h, lean, cols, lw) { const G = shardGeo(x, y, w, h, lean), { tx, ty, bx, by, ux, uy } = G;
    for (let i = 0; i < 3; i++) { poly(c, [[bx[i], by[i]], [bx[i + 1], by[i + 1]], [ux[i + 1], uy[i + 1]], [ux[i], uy[i]]]); c.closePath(); c.fillStyle = cols[i]; c.fill(); }
    for (let i = 0; i < 3; i++) { poly(c, [[ux[i], uy[i]], [ux[i + 1], uy[i + 1]], [tx, ty]]); c.closePath(); c.fillStyle = cols[3 + i]; c.fill(); }
    // the facet edges, thin, then the outline
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = Math.max(0.6, lw * 0.45); c.beginPath(); for (let i = 1; i < 3; i++) { c.moveTo(bx[i], by[i]); c.lineTo(ux[i], uy[i]); c.lineTo(tx, ty); } c.moveTo(ux[0], uy[0]); c.lineTo(ux[3], uy[3]); c.stroke();
    poly(c, G.outline); c.closePath(); ink(c, lw);
    return G; }
  /* the frost crystals: a tall prism and its lesser ones, white-blue, rimed with frost; integ < 1 cracks them; broken: stumps */
  const FROST_COLS = ['#F4FBFF', '#BFE3FA', '#7FB4E0', '#FFFFFF', '#DDF2FF', '#A8D2F2'];
  function frostCrystal(c, x, y, h, o) { o = o || {}; const lw = o.lw || Math.max(1.2, h * 0.035), k = o.k || 0, integ = o.integ == null ? 1 : o.integ, v = o.v || 0;
    const set = o.broken ? [[-0.2, 0.22, 0.2, -0.1], [0.12, 0.16, 0.18, 0.15], [0.02, 0.3, 0.26, 0.02]] : [[-0.27, 0.56, 0.2, -0.2], [0.26, 0.48, 0.18, 0.22], [0, 1, 0.3, 0.03 * (v % 2 ? 1 : -1)], [-0.12, 0.34, 0.14, -0.08], [0.14, 0.3, 0.13, 0.12]];
    c.save();
    if (k > 0.02 && !o.broken) glow(c, x, y - h * 0.5, h * 0.95, FROST, 0.45 * k);
    for (const [dx, sh, sw, ln] of set) { const G = shard(c, x + dx * h, y, sw * h, sh * h, ln, FROST_COLS, lw);
      // frost patterns: fine dendrites on the lit and front faces
      c.save(); poly(c, G.outline); c.closePath(); c.clip(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(0.6, lw * 0.4);
      const R = rnd(Math.round(dx * 100) + 7 + v); for (let i = 0; i < 3; i++) { const px = lerp(G.bx[0], G.bx[2], R()), py = lerp(G.by[0], G.uy[1], 0.2 + R() * 0.6), L = sw * h * (0.25 + R() * 0.2); c.beginPath(); c.moveTo(px, py); c.lineTo(px + L * 0.6, py - L); c.moveTo(px + L * 0.25, py - L * 0.4); c.lineTo(px + L * 0.55, py - L * 0.25); c.moveTo(px + L * 0.4, py - L * 0.65); c.lineTo(px + L * 0.1, py - L * 0.85); c.stroke(); }
      // a highlight streak and, with k, light from within
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(0.8, lw * 0.6); c.beginPath(); c.moveTo(lerp(G.bx[0], G.bx[1], 0.5), G.by[0] - sh * h * 0.08); c.lineTo(lerp(G.ux[0], G.ux[1], 0.5), G.uy[0] + sh * h * 0.04); c.stroke();
      if (k > 0.02) { const g = c.createLinearGradient(0, y, 0, y - sh * h); g.addColorStop(0, rgba('#FFFFFF', 0.1 * k)); g.addColorStop(0.6, rgba('#E8F8FF', 0.45 * k)); g.addColorStop(1, rgba('#FFFFFF', 0.7 * k)); c.fillStyle = g; c.fillRect(x - h, y - h * 1.1, h * 2, h * 1.2); }
      // cracks as its integrity falls
      if (integ < 0.999 && !o.broken) { const n = integ < 0.35 ? 3 : integ < 0.7 ? 2 : 1, R2 = rnd(31 + Math.round(dx * 50)); c.strokeStyle = 'rgba(30,60,100,.75)'; c.lineWidth = Math.max(0.8, lw * 0.55); for (let i = 0; i < n; i++) { let px = lerp(G.bx[0], G.bx[3], 0.3 + R2() * 0.4), py = G.by[1] - sh * h * (0.15 + R2() * 0.5); c.beginPath(); c.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (R2() - 0.5) * sw * h * 0.5; py -= sh * h * 0.09; c.lineTo(px, py); } c.stroke(); } }
      c.restore(); }
    if (o.broken) { c.fillStyle = 'rgba(220,240,255,.85)'; const R = rnd(55); for (let i = 0; i < 7; i++) { const px = x + (R() - 0.5) * h * 0.9, py = y + (R() - 0.3) * h * 0.18, s = h * (0.03 + R() * 0.04); poly(c, [[px - s, py], [px, py - s * 1.6], [px + s, py], [px, py + s * 0.5]]); c.closePath(); c.fill(); ink(c, lw * 0.5); } }
    c.restore(); }
  /* the protected stone well: a round kerb of dressed basalt blocks (lit tops, shaded fronts), rime on its lip, frost
     engraved in the stones, the emblem plaque on its front face; the frost crystal rises from its throat */
  function frostWellArt(c, Xs, Ys, T, o) { o = o || {}; const s = o.scale || 1, R = T * 1.05 * s, ry = R * 0.5, wall = T * 0.56 * s, lw = lw0(T), k = clamp(o.k || 0, 0, 1);
    c.save();
    c.fillStyle = 'rgba(6,4,6,.38)'; ell(c, Xs + T * 0.08, Ys + wall * 0.55, R * 1.2, ry * 1.2); c.fill();
    // the back half of the kerb (behind the crystal)
    const blocks = 12, blk = (i, front) => { const a0 = i / blocks * TAU, a1 = (i + 1) / blocks * TAU - 0.04; if ((Math.sin((a0 + a1) / 2) > 0) !== front) return;
      const p = a => [Xs + Math.cos(a) * R, Ys + Math.sin(a) * ry], q = a => [Xs + Math.cos(a) * R * 0.74, Ys + Math.sin(a) * ry * 0.74];
      const A0 = p(a0), A1 = p(a1), B0 = q(a0), B1 = q(a1);
      // its top face
      poly(c, [B0, A0, A1, B1]); c.closePath(); c.fillStyle = i % 3 === 0 ? '#5A5254' : i % 3 === 1 ? '#524A4C' : '#5E5658'; c.fill(); ink(c, lw * 0.7);
      // its front face (only the half facing us shows one)
      if (front) { poly(c, [A0, A1, [A1[0], A1[1] + wall], [A0[0], A0[1] + wall]]); c.closePath(); const g = c.createLinearGradient(0, A0[1], 0, A0[1] + wall); g.addColorStop(0, '#433B3D'); g.addColorStop(1, '#1E191A'); c.fillStyle = g; c.fill(); ink(c, lw * 0.7);
        c.strokeStyle = 'rgba(207,239,255,.28)'; c.lineWidth = Math.max(0.7, lw * 0.4); const mx = (A0[0] + A1[0]) / 2, my = (A0[1] + A1[1]) / 2 + wall * 0.5; c.beginPath(); c.moveTo(mx - T * 0.1, my); c.lineTo(mx + T * 0.1, my); c.moveTo(mx, my - wall * 0.25); c.lineTo(mx, my + wall * 0.25); c.stroke(); }
      // rime on the lip
      c.strokeStyle = 'rgba(235,248,255,.75)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(A0[0], A0[1]); c.lineTo(A1[0], A1[1]); c.stroke(); };
    for (let i = 0; i < blocks; i++) blk(i, false);
    // the throat: dark, frost-blue light pooled in it
    ell(c, Xs, Ys, R * 0.74, ry * 0.74); const tg = c.createRadialGradient(Xs, Ys + ry * 0.2, R * 0.05, Xs, Ys, R * 0.74); tg.addColorStop(0, rgba('#BFE3FA', 0.35 + 0.5 * k)); tg.addColorStop(0.6, '#1C2A3C'); tg.addColorStop(1, '#0A0E16'); c.fillStyle = tg; c.fill(); ink(c, lw * 0.7);
    // frost patterns across the throat's ice
    c.strokeStyle = rgba('#E8F6FF', 0.35 + 0.35 * k); c.lineWidth = Math.max(0.7, lw * 0.4); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; c.beginPath(); c.moveTo(Xs + Math.cos(a) * R * 0.2, Ys + Math.sin(a) * ry * 0.2); c.lineTo(Xs + Math.cos(a) * R * 0.66, Ys + Math.sin(a) * ry * 0.66); c.stroke(); }
    // the crystal
    frostCrystal(c, Xs, Ys + ry * 0.15, T * 1.75 * s, { k, integ: o.integ, broken: o.broken, v: o.v, lw });
    // the front half of the kerb
    for (let i = 0; i < blocks; i++) blk(i, true);
    // the emblem plaque on its front face
    emblem(c, Xs, Ys + ry + wall * 0.45, T * 0.5 * s, k);
    // the charge ring (when shown): white-blue filling round the kerb; the Hellfire cue: a beating ring
    if (o.showCharge && o.charge != null) { const f = clamp(o.charge, 0, 1); c.lineCap = 'round'; c.strokeStyle = 'rgba(10,14,22,.65)'; c.lineWidth = Math.max(4, T * 0.14); ell(c, Xs, Ys, R * 1.18, ry * 1.18); c.stroke(); if (f > 0) { c.strokeStyle = f >= 1 ? '#FFFFFF' : FROST; c.lineWidth = Math.max(2.5, T * 0.09); c.beginPath(); c.ellipse(Xs, Ys, R * 1.18, ry * 1.18, 0, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke(); } }
    if (o.awake) { const u = o.awake; c.strokeStyle = rgba(FROST_HI, 0.5 + 0.5 * u); c.lineWidth = Math.max(2, T * 0.08); ell(c, Xs, Ys, R * (1.3 + 0.2 * u), ry * (1.3 + 0.2 * u)); c.stroke(); glow(c, Xs, Ys - T * 0.8, T * 2.2, FROST, 0.35 + 0.3 * u); }
    if (o.label) label(c, o.label, Xs, Ys - T * 2.25 * s, Math.max(11, T * 0.3), FROST_HI);
    c.restore(); }
  /* a marked cooling zone on the floor (world centre, radius in tiles), k its strength */
  function coldField(c, X, x, y, r, k, o) { o = o || {}; const T = X.Tz(), Xs = X.sx(x), Ys = X.sy(y), R = r * T, t = X.g.t; k = clamp(k, 0, 1);
    c.save();
    const g = c.createRadialGradient(Xs, Ys, R * 0.1, Xs, Ys, R); g.addColorStop(0, rgba('#DDF3FF', 0.1 + 0.18 * k)); g.addColorStop(0.75, rgba('#BFE3FA', 0.12 + 0.22 * k)); g.addColorStop(1, rgba('#FFFFFF', 0.2 + 0.35 * k)); c.fillStyle = g; c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.fill();
    // a dark under-layer so the ring reads on bright lava light, then the frost ring with snowflake ticks
    c.strokeStyle = 'rgba(8,14,26,.55)'; c.lineWidth = Math.max(3, T * 0.13); c.stroke();
    c.setLineDash([T * 0.42, T * 0.18]); c.lineDashOffset = -t * T * 0.25; c.strokeStyle = rgba(FROST_HI, 0.55 + 0.4 * k); c.lineWidth = Math.max(2, T * 0.07); c.stroke(); c.setLineDash([]);
    if (o.refuge) { c.strokeStyle = rgba(FROST_HI, 0.85); c.lineWidth = Math.max(2.5, T * 0.1); c.beginPath(); c.arc(Xs, Ys, R * 0.93, 0, TAU); c.stroke(); }
    const n = Math.max(4, Math.round(r * 2.2)); for (let i = 0; i < n; i++) { const a = i / n * TAU + t * 0.05; snowflake(c, Xs + Math.cos(a) * R * 0.86, Ys + Math.sin(a) * R * 0.86, T * 0.36, rgba(FROST_HI, 0.5 + 0.45 * k), Math.max(1, T * 0.03)); }
    if (k > 0.05 && !lowFx()) for (let i = 0; i < 5; i++) { const a = t * 0.4 + i * 1.3, rr = R * (0.2 + ((t * 0.12 + i * 0.21) % 0.7)); glow(c, Xs + Math.cos(a) * rr, Ys + Math.sin(a) * rr * 0.6, T * 0.25, '#FFFFFF', 0.35 * k); }
    if (o.label) label(c, o.label, Xs, Ys - R - T * 0.25, Math.max(11, T * 0.3), FROST_HI);
    c.restore(); }
  /* the black fire crystals: a cluster of glossy black and deep violet shards, smouldering red-orange fractures inside,
     a slowly circulating light (o.ph 0..1 round the cluster); o.k a pulse; o.dim inert; o.broken stumps */
  const CRY_COLS = ['#3E2A58', '#17101F', '#08060C', '#5A3E7E', '#2A1C3A', '#120C18'];
  const CRY_DIM = ['#3A3638', '#1E1B1D', '#0E0C0D', '#4A4547', '#2A2628', '#151314'];
  const CRY_SETS = [[[0, 1, 0.3, 0.04], [-0.3, 0.6, 0.22, -0.3], [0.3, 0.72, 0.22, 0.24], [-0.12, 0.34, 0.16, -0.14], [0.17, 0.28, 0.14, 0.1]],
    [[-0.08, 1, 0.28, -0.06], [0.28, 0.8, 0.24, 0.18], [-0.34, 0.46, 0.2, -0.36], [0.08, 0.4, 0.16, 0.05]],
    [[0.05, 0.86, 0.3, 0.12], [-0.25, 1, 0.24, -0.12], [0.36, 0.5, 0.2, 0.34], [-0.4, 0.38, 0.16, -0.4], [0.12, 0.26, 0.14, -0.05]],
    [[0, 0.95, 0.34, 0], [-0.32, 0.55, 0.2, -0.22], [0.33, 0.58, 0.2, 0.22]]];
  function crystalArt(c, x, y, s, o) { o = o || {}; const lw = o.lw || Math.max(1.2, s * 0.03), k = clamp(o.k == null ? 0.35 : o.k, 0, 1.5), dim = !!o.dim, ph = o.ph || 0, set = CRY_SETS[(o.v || 0) % CRY_SETS.length];
    c.save();
    if (!dim) glow(c, x, y - s * 0.4, s * 0.9, FRACTURE, 0.14 + 0.3 * k);
    const list = set.slice().sort((a, b) => (a[1] < b[1] ? 1 : -1));   // (tall ones behind)
    list.forEach(([dx, sh, sw, ln], j) => { const H = o.broken ? sh * 0.3 : sh;
      const G = shard(c, x + dx * s, y, sw * s, H * s, ln, dim ? CRY_DIM : CRY_COLS, lw);
      c.save(); poly(c, G.outline); c.closePath(); c.clip();
      // a glossy specular streak down the front face and a violet sheen on the lit face
      c.strokeStyle = dim ? 'rgba(255,255,255,.18)' : 'rgba(230,210,255,.55)'; c.lineWidth = Math.max(0.8, lw * 0.7); c.beginPath(); c.moveTo(lerp(G.bx[1], G.bx[2], 0.25), G.by[1] - H * s * 0.06); c.lineTo(lerp(G.ux[1], G.ux[2], 0.25), G.uy[1] + H * s * 0.03); c.stroke();
      if (!dim) { const sg = c.createLinearGradient(G.bx[0], 0, G.bx[1], 0); sg.addColorStop(0, 'rgba(150,110,220,.35)'); sg.addColorStop(1, 'rgba(150,110,220,0)'); c.fillStyle = sg; c.fillRect(G.bx[0], G.ty, G.bx[1] - G.bx[0], H * s * 1.2); }
      // the fractures: a jagged vein up the shard, branching, smouldering (a soft underlay, a hot core)
      const R = rnd(91 + j * 13 + (o.v || 0) * 7), fx0 = lerp(G.bx[0], G.bx[3], 0.35 + R() * 0.3), pts = [[fx0, G.by[1]]]; let px = fx0, py = G.by[1];
      const n = 6; for (let i = 0; i < n; i++) { py -= H * s * 0.75 / n; px += (R() - 0.5) * sw * s * 0.45; px = clamp(px, G.bx[0] + sw * s * 0.12, G.bx[3] - sw * s * 0.12); pts.push([px, py]); }
      const vein = (w, col, a) => { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w; poly(c, pts); c.stroke(); for (let b = 2; b < n; b += 2) { const p = pts[b], sd = b % 4 ? 1 : -1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + sd * sw * s * 0.3, p[1] - H * s * 0.08); c.stroke(); } c.globalAlpha = 1; };
      if (!dim) { c.globalCompositeOperation = 'lighter'; vein(Math.max(3, lw * 3.2), FRACTURE, 0.22 + 0.25 * k); vein(Math.max(1.4, lw * 1.2), '#E8401A', 0.8); vein(Math.max(0.7, lw * 0.45), FRACTURE_HI, 0.25 + 0.4 * Math.min(1, k)); c.globalCompositeOperation = 'source-over'; }
      else vein(Math.max(0.8, lw * 0.6), 'rgba(20,16,18,.8)', 1);
      // the slowly circulating light: a warm spot that rides up and round the cluster
      if (!dim) { const u = ((ph + j * 0.27) % 1), ly = lerp(G.by[1], G.ty, 0.15 + 0.7 * (0.5 - 0.5 * Math.cos(u * TAU))), lx = lerp(G.bx[0], G.bx[3], 0.5 + 0.3 * Math.sin(u * TAU)); const lg = c.createRadialGradient(lx, ly, 0, lx, ly, sw * s * 1.1); lg.addColorStop(0, rgba(FRACTURE_HI, 0.35 + 0.3 * k)); lg.addColorStop(0.5, rgba(FRACTURE, 0.12 + 0.12 * k)); lg.addColorStop(1, 'rgba(255,90,42,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = lg; c.fillRect(lx - sw * s * 1.2, ly - sw * s * 1.2, sw * s * 2.4, sw * s * 2.4); c.globalCompositeOperation = 'source-over'; }
      c.restore();
      if (o.broken) { c.fillStyle = dim ? '#2A2628' : '#1C1426'; const R3 = rnd(17 + j); for (let i = 0; i < 3; i++) { const qx = x + dx * s + (R3() - 0.5) * s * 0.4, qy = y + R3() * s * 0.06; poly(c, [[qx - s * 0.04, qy], [qx + s * 0.01, qy - s * 0.07], [qx + s * 0.05, qy]]); c.closePath(); c.fill(); ink(c, lw * 0.5); } } });
    // the basalt it grows from
    c.fillStyle = BASALT_D; poly(c, [[x - s * 0.5, y + s * 0.04], [x - s * 0.36, y - s * 0.04], [x + s * 0.1, y - s * 0.02], [x + s * 0.44, y - s * 0.05], [x + s * 0.54, y + s * 0.05], [x + s * 0.2, y + s * 0.1], [x - s * 0.3, y + s * 0.1]]); c.closePath(); c.fill(); ink(c, lw * 0.8);
    c.restore(); }
  /* the rune glyphs of the Three Rune Rings: distinct by shape (an almond eye with its pupil, two linked chain links, a
     three-pointed crown on a band) */
  function glyph(c, x, y, s, kind, col, lw) { const r = s / 2; c.save(); c.strokeStyle = col || RUNE; c.fillStyle = col || RUNE; c.lineWidth = lw || Math.max(1.4, s * 0.09); c.lineCap = 'round'; c.lineJoin = 'round';
    if (kind === 'eye' || kind === 0) { c.beginPath(); c.moveTo(x - r * 0.95, y); c.quadraticCurveTo(x, y - r * 0.95, x + r * 0.95, y); c.quadraticCurveTo(x, y + r * 0.95, x - r * 0.95, y); c.closePath(); c.stroke(); c.beginPath(); c.arc(x, y, r * 0.28, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x, y - r * 0.82); c.lineTo(x, y - r * 0.6); c.moveTo(x, y + r * 0.6); c.lineTo(x, y + r * 0.82); c.stroke(); }
    else if (kind === 'chain' || kind === 1) { for (const sd of [-1, 1]) { c.save(); c.translate(x + sd * r * 0.32, y + sd * r * 0.12); c.rotate(-0.55); c.beginPath(); c.ellipse(0, 0, r * 0.52, r * 0.27, 0, 0, TAU); c.stroke(); c.restore(); } }
    else { c.beginPath(); c.moveTo(x - r * 0.8, y + r * 0.55); c.lineTo(x - r * 0.8, y - r * 0.35); c.lineTo(x - r * 0.4, y + r * 0.05); c.lineTo(x, y - r * 0.75); c.lineTo(x + r * 0.4, y + r * 0.05); c.lineTo(x + r * 0.8, y - r * 0.35); c.lineTo(x + r * 0.8, y + r * 0.55); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(x - r * 0.8, y + r * 0.3); c.lineTo(x + r * 0.8, y + r * 0.3); c.stroke(); for (const px of [-0.8, 0, 0.8]) { c.beginPath(); c.arc(x + px * r, y + (px ? -r * 0.42 : -r * 0.84), r * 0.1, 0, TAU); c.fill(); } }
    c.restore(); }
  /* eight angular forge runes (strokes in a unit box) for engravings */
  const RUNES = [[[0, -1, 0, 1], [-0.6, -0.4, 0.6, 0.2]], [[-0.6, -1, -0.6, 1], [-0.6, -0.2, 0.6, -1], [-0.6, -0.2, 0.6, 1]], [[-0.6, 1, 0, -1], [0, -1, 0.6, 1], [-0.35, 0.2, 0.35, 0.2]], [[0, -1, 0, 1], [0, -1, 0.6, -0.5], [0, -0.1, 0.6, -0.5]],
    [[-0.6, -1, 0.6, 1], [0.6, -1, -0.6, 1]], [[-0.6, 1, -0.6, -1], [-0.6, -1, 0.6, 0], [0.6, 0, -0.6, 1]], [[0, -1, 0, 1], [-0.6, -1, 0, -0.4], [0.6, -1, 0, -0.4]], [[-0.6, -1, 0.6, -1], [0, -1, 0, 1], [-0.6, 1, 0.6, 1]]];
  function rune(c, x, y, s, i, col, lw) { const r = s / 2, L = RUNES[((i % 8) + 8) % 8]; c.save(); c.strokeStyle = col || RUNE; c.lineWidth = lw || Math.max(1, s * 0.12); c.lineCap = 'round'; c.beginPath(); for (const [a, b, d, e] of L) { c.moveTo(x + a * r * 0.7, y + b * r); c.lineTo(x + d * r * 0.7, y + e * r); } c.stroke(); c.restore(); }
  /* a faceted basalt block from a polygon (screen px): lit from the top left, shaded below; o.seam: a glowing seam */
  function basalt(c, pts, lw, o) { o = o || {}; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    poly(c, pts); c.closePath(); const g = c.createLinearGradient(x0, y0, x1 * 0.4 + x0 * 0.6, y1); g.addColorStop(0, o.hi || '#5A5153'); g.addColorStop(0.45, o.mid || BASALT_HI); g.addColorStop(1, o.lo || BASALT_D); c.fillStyle = g; c.fill(); ink(c, lw);
    if (o.seam) { c.save(); poly(c, pts); c.closePath(); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(LAVA, 0.7 * o.seam); c.lineWidth = Math.max(1, lw * 0.8); c.beginPath(); c.moveTo(lerp(x0, x1, 0.2), y1); c.lineTo(lerp(x0, x1, 0.45), lerp(y0, y1, 0.55)); c.lineTo(lerp(x0, x1, 0.4), y0); c.stroke(); c.restore(); }
    c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = Math.max(0.7, lw * 0.5); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < Math.min(3, pts.length); i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
  Object.assign(CAL, { snowflake, emblem, shard, frostCrystal, frostWellArt, coldField, crystalArt, glyph, rune, basalt, GLYPHS: ['eye', 'chain', 'crown'] });

  /* ======================= the running context: lava, vents, bombs, ledges ======================= */
  const CTX = new WeakMap(); let CUR = null;
  function ctx(X) { const key = X.g || X; let C = CTX.get(key); if (!C) { C = { X, t: 0, lava: [], vents: [], flights: [], larvae: [], safe: [], safeT: 0, ledge: null, burnT: 0, embers: [], pulses: [], stat: { lavaTouches: 0, falls: 0, returns: 0, bombHits: 0, vents: 0 } }; CTX.set(key, C); } if (X.Tz) C.X = X; CUR = C; return C; }
  /* ---- the lava rule ---- */
  function lavaPool(X, o) { const C = ctx(X), p = Object.assign({ kind: 'pool', r: 1.2, seed: Math.floor(Math.random() * 1e6) }, o); C.lava.push(p); return p; }
  function lavaTiles(X, tiles) { const C = ctx(X), set = new Set(), MW = X.M.MW; for (const t of tiles) set.add(t.ty * MW + t.tx); const p = { kind: 'tiles', tiles: tiles.slice(), set, MW }; C.lava.push(p); return p; }
  function unlava(X, p) { const C = ctx(X), i = C.lava.indexOf(p); if (i >= 0) C.lava.splice(i, 1); }
  function inPool(p, x, y, pad) { if (p.off) return false; if (p.kind === 'pool') return Math.hypot(x - p.x, y - p.y) < p.r + (pad || 0); const tx = Math.floor(x), ty = Math.floor(y); if (!pad) return p.set.has(ty * p.MW + tx); for (const [dx, dy] of [[0, 0], [pad, 0], [-pad, 0], [0, pad], [0, -pad]]) if (p.set.has(Math.floor(y + dy) * p.MW + Math.floor(x + dx))) return true; return false; }
  function inLava(X, x, y, pad) { for (const p of ctx(X).lava) if (inPool(p, x, y, pad)) return p; return null; }
  function safeSpot(X) { const C = ctx(X), me = X.me; for (let i = C.safe.length - 1; i >= 0; i--) { const s = C.safe[i]; if (!inLava(X, s.x, s.y, 0.7)) return s; } return X.M.start ? { x: X.M.start.x, y: X.M.start.y } : { x: me.x, y: me.y }; }
  function lavaTouch(X, o) { o = o || {}; const C = ctx(X), me = X.me; if (me.dead || C.burnT > 0) return false; C.burnT = 1.0; C.stat.lavaTouches++;
    const hp = X.ST().hp, d = Math.max(1, Math.min(hp * 0.07 * (o.dmgK || 1), me.hp - 1));
    if (d >= 1 && me.hp > 1) X.hurtPet(d, null, { lava: true });
    const s = safeSpot(X), dx = s.x - me.x, dy = s.y - me.y, dd = Math.hypot(dx, dy);
    X.text(me.x, me.y - 1.2, 'Too hot!', LAVA_HI, 15); snd(X, 'hiss', 0.35, 0.22, 900);
    for (let i = 0; i < 10; i++) X.part({ kind: 'ember', x: me.x + (Math.random() - 0.5) * 0.6, y: me.y - 0.1, vx: (Math.random() - 0.5) * 1.5, vy: -2.5 - Math.random() * 2.5, life: 0.6, max: 0.6, size: 4 + Math.random() * 3, color: Math.random() < 0.5 ? LAVA : LAVA_HI });
    if (dd > 3.2 || dd < 0.05) { me.x = s.x; me.y = s.y; me.vx = me.vy = 0; X.ring(me.x, me.y, 0.2, 1.1, 0.3, '#FFFFFF', 0.2); }
    else me.push = { vx: dx / 0.22, vy: dy / 0.22, t: 0.22 };
    return true; }
  // (the same rule with a safe spot of the caller's own: it is put first in the trail of safe ground)
  function lavaContact(X, safe, o) { const C = ctx(X); if (safe && isFinite(safe.x)) { C.safe.push({ x: safe.x, y: safe.y }); if (C.safe.length > 14) C.safe.shift(); } return lavaTouch(X, o); }
  function setLedge(X, x, y) { ctx(X).ledge = { x, y }; }
  function fall(X, o) { o = o || {}; const C = ctx(X), me = X.me; if (me.dead) return; C.stat.falls++; const L = C.ledge || safeSpot(X), hp = X.ST().hp, d = Math.max(1, Math.min(hp * (o.k || 0.06), me.hp - 1));
    if (me.hp > 1) X.hurtPet(d, null, { fall: true }); me.x = L.x; me.y = L.y; me.vx = me.vy = 0; me.push = null; if (X.unstick) X.unstick(me);
    X.ring(L.x, L.y, 0.2, 1.4, 0.4, FROST, 0.25); X.text(L.x, L.y - 1.3, o.text || 'You slipped back to the ledge', ASH_HI, 14); snd(X, 'whoosh'); }
  /* ---- vents: glow and hiss, then a column of fire ---- */
  function vent(X, o) { const C = ctx(X), v = Object.assign({ r: 1.1, period: 4.5, warn: 1.6, erupt: 0.9, dmg: 0, phase: 0, demo: false, on: true, st: 'idle', t: 0, hitDone: false, n: 0 }, o); v.t = v.phase; if (!v.dmg) v.dmg = Math.round(X.ST().hp * 0.12); C.vents.push(v); return v; }
  function ventTick(C, v, dt) { const X = C.X, me = X.me; if (!v.on && v.st === 'idle') return; v.t += dt;
    if (v.st === 'idle' && v.t >= v.period - v.warn) { v.st = 'warn'; v.t = 0; snd(X, 'hiss', v.warn * 0.9, 0.12, 700); }
    else if (v.st === 'warn' && v.t >= v.warn) { v.st = 'erupt'; v.t = 0; v.hitDone = false; v.n++; C.stat.vents++; snd(X, 'crash'); X.shake && X.shake(3, 0.2);
      for (let i = 0; i < 16; i++) X.part({ kind: 'ember', x: v.x + (Math.random() - 0.5) * v.r, y: v.y - 0.2, vx: (Math.random() - 0.5) * 2.5, vy: -5 - Math.random() * 5, g: 4, life: 0.8, max: 0.8, size: 5 + Math.random() * 5, color: Math.random() < 0.5 ? LAVA : LAVA_HI }); }
    else if (v.st === 'erupt') { if (!v.hitDone && !v.demo && !me.dead && !me.dodge && Math.hypot(me.x - v.x, me.y - v.y) < v.r + me.r * 0.6) { v.hitDone = true; X.hurtPet(v.dmg, null); const a = Math.atan2(me.y - v.y, me.x - v.x); X.push(a, v.r + 0.9); }
      if (v.t >= v.erupt) { v.st = 'idle'; v.t = 0; } } }
  /* ---- bombs ---- */
  function bombTarget(X, from) { let best = null, bd = 1e9; for (const m of X.mons) { if (m.dead || m.type === 'bomblarva' || m.fobj && !m.calBombable) continue; if (m.fiend || m.boss && !m.lesser) { const d = Math.hypot(m.x - from.x, m.y - from.y) - 100; if (d < bd) { bd = d; best = m; } continue; } const d = Math.hypot(m.x - from.x, m.y - from.y); if (d < 10 && d < bd) { bd = d; best = m; } } return best; }
  function returnBomb(X, from, o) { o = o || {}; const C = ctx(X), me = X.me, tg = o.target || bombTarget(X, from); let tx, ty;
    if (tg) { tx = tg.x; ty = tg.y; } else { const a = Math.atan2(from.y - me.y, from.x - me.x) || 0; const p = X.walkPoint ? X.walkPoint(from.x + Math.cos(a) * 5, from.y + Math.sin(a) * 5, null) : null; tx = p ? p.x : from.x + Math.cos(a) * 5; ty = p ? p.y : from.y + Math.sin(a) * 5; }
    const d = Math.hypot(tx - from.x, ty - from.y), f = { x0: from.x, y0: from.y, x: from.x, y: from.y, z: 0, tx, ty, target: tg, t: 0, dur: clamp(d / 10, 0.35, 0.95), o, done: false, trail: [], dmgK: o.dmgK || 1 };
    C.flights.push(f); C.stat.returns++; snd(X, 'whoosh'); X.text(from.x, from.y - 1.1, 'Returned!', SAFE, 15); X.ring(from.x, from.y, 0.2, 1.2, 0.25, SAFE, 0.2); return f; }
  function flightTick(C, f, dt) { const X = C.X; f.t += dt; const u = clamp(f.t / f.dur, 0, 1);
    if (f.target && !f.target.dead) { f.tx += (f.target.x - f.tx) * Math.min(1, dt * 10); f.ty += (f.target.y - f.ty) * Math.min(1, dt * 10); }   // (aim assist: it homes on its target)
    const e = u * u * (3 - 2 * u); f.x = lerp(f.x0, f.tx, e); f.y = lerp(f.y0, f.ty, e); f.z = Math.sin(u * Math.PI) * Math.min(2.4, 0.6 + Math.hypot(f.tx - f.x0, f.ty - f.y0) * 0.18) + (f.target && f.target.fiend ? u * 1.2 : 0);
    f.trail.unshift([f.x, f.y - f.z]); if (f.trail.length > 10) f.trail.length = 10;
    if (u >= 1 && !f.done) { f.done = true; burst(C, f); } }
  function burst(C, f) { const X = C.X, tg = f.target, atk = X.ST().atk; X.boom(f.x, f.y - (tg && tg.fiend ? 1.2 : 0), 1.7, LAVA, LAVA_HI, { n: 22, shake: 7, smoke: 4 }); snd(X, 'crash');
    for (let i = 0; i < 14; i++) X.part({ kind: 'ember', x: f.x + (Math.random() - 0.5), y: f.y - 0.4, vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 4, g: 6, life: 0.7, max: 0.7, size: 5 + Math.random() * 4, color: Math.random() < 0.5 ? LAVA : LAVA_HI });
    let handled = false; C.stat.bombHits += tg && !tg.dead ? 1 : 0;
    if (f.o.onHit) handled = f.o.onHit(tg, f) !== false; else if (tg && CAL.onBombHit) handled = !!CAL.onBombHit(X, tg, f);
    if (!handled) { const D = atk * 8 * f.dmgK; if (tg && !tg.dead) X.hitMon(tg, D, { el: 'fire', src: 'bomb', noAggro: false });
      for (const m of X.mons) if (m !== tg && !m.dead && m.type !== 'bomblarva' && Math.hypot(m.x - f.x, m.y - f.y) < 1.7 + m.r) X.hitMon(m, D * 0.5, { el: 'fire', src: 'bomb' }); } }
  function larvae(X) { return X.mons.filter(m => m.type === 'bomblarva' && !m.dead && m.cal && (m.cal.st === 'safe' || m.cal.st === 'red')); }
  function larvaState(m) { return m && m.cal ? m.cal.st : null; }
  function dropBomb(X, x, y, o) { o = o || {}; if (o.cap != null && larvae(X).length >= o.cap) return null; const p = X.walkPoint ? X.walkPoint(x, y, null) : { x, y }; const m = X.spawnMon('bomblarva', p.x, p.y, { rift: true, aggro: true, pack: 1290 });
    m.aggro = true; if (X.g && X.g.total != null) X.g.total++; larvaSetup(m, o); m.cal.st = 'land'; m.cal.tx = p.x; m.cal.ty = p.y; m.cal.landT = 0; m.z = 4; m.cal.z0 = 4; m.cal.drop = true; X.warn({ x: p.x, y: p.y, r: 0.9, life: 0.7, max: 0.7, color: '#FFE37A' }); return m; }
  /* ---- the recovery station: a basalt cairn holding a frost spring; stand by it to recover, once ---- */
  function recoveryStation(X, H, x, y, o) { o = o || {}; const S = { used: false };
    S.obj = H.obj({ x, y, kind: 'calspring', r: 0.9, h: 2.2, label: () => S.used ? '' : (o.label || 'Recover: stand still beside it'),
      use() { if (S.used) return; S.used = true; const me = X.me, ST = X.ST(); X.heal(ST.hp); me.hp = ST.hp; if (X.gainMP) X.gainMP(999); X.text(x, y - 1.8, 'Recovered', '#8FE0A6', 16); X.ring(x, y, 0.3, 2.2, 0.5, FROST, 0.3); snd(X, 'chime', 988, 0.6); X.after && X.after(0.12, () => snd(X, 'chime', 1319, 0.45)); },
      draw(c, Xs, Ys, T) { springArt(c, Xs, Ys, T, S.used ? 0.25 : 0.7 + 0.3 * Math.sin(X.g.t * 2.2)); } });
    return S; }
  function springArt(c, Xs, Ys, T, k) { const lw = lw0(T); c.save(); c.fillStyle = 'rgba(6,4,6,.35)'; ell(c, Xs, Ys + T * 0.12, T * 0.85, T * 0.3); c.fill();
    basalt(c, [[Xs - T * 0.7, Ys + T * 0.1], [Xs - T * 0.62, Ys - T * 0.3], [Xs - T * 0.2, Ys - T * 0.42], [Xs + T * 0.3, Ys - T * 0.38], [Xs + T * 0.68, Ys - T * 0.22], [Xs + T * 0.72, Ys + T * 0.12], [Xs, Ys + T * 0.24]], lw);
    ell(c, Xs, Ys - T * 0.3, T * 0.42, T * 0.13); c.fillStyle = rgba('#BFE3FA', 0.55 + 0.35 * k); c.fill(); ink(c, lw * 0.7);
    frostCrystal(c, Xs, Ys - T * 0.3, T * 0.9, { k, lw: lw * 0.8, v: 1 });
    emblem(c, Xs, Ys - T * 0.02, T * 0.32, k);
    if (k > 0.3) glow(c, Xs, Ys - T * 0.7, T * 1.3, FROST, 0.3 * k);
    c.restore(); }
  /* which way the volcano's heart lies from here (the crystals' pulses run that way) */
  function heartDir(X) { const C = ctx(X), M = X.M; let hx, hy; const ex = X.rift && X.rift.exit; if (M.FC) { hx = M.FC.x; hy = M.FC.y; } else if (ex) { hx = ex.x; hy = ex.y; } else { hx = M.MW / 2; hy = 0; } const me = X.me, dx = hx - me.x, dy = hy - me.y, d = Math.hypot(dx, dy) || 1; C.heart = { x: hx, y: hy }; return [dx / d, dy / d]; }
  Object.assign(CAL, { ctx, lavaPool, lavaTiles, unlava, inLava, lavaTouch, lavaContact, safeSpot, setLedge, fall, vent, bombTarget, returnBomb, larvae, larvaState, dropBomb, recoveryStation, springArt, heartDir, onBombHit: CAL.onBombHit || null });

  /* ======================= the lands ======================= */
  /* the lava below the ledges: molten channels between drifting plates of cooled crust (worked out pixel by pixel once,
     wrapping), with a second layer of bright currents sliding over it the other way; the whole surface breathes heat */
  window.GAP_EXT = window.GAP_EXT || {};
  // (worked out on a canvas of its own and laid down through the pattern's scale: getImageData/putImageData ignore it)
  // mode 'crust': near-black plates of cooled crust drifting on molten seams (white-hot in the seam, red at its lip), a few
  // cells still molten; mode 'flow': soft warm currents only (alpha), for the second layer sliding over it
  function crustTile(c0, S, R, cells, mode) { const pts = []; for (let i = 0; i < cells; i++) pts.push([R() * S, R() * S, R()]);
    const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), img = c.createImageData(S, S), d = img.data;
    const wob = (x, y) => (Math.sin(x * 0.21 + y * 0.13) + Math.sin(x * 0.07 - y * 0.29 + 1.3)) * 0.9;   // (the seams wander a little)
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let d1 = 1e9, d2 = 1e9, w1 = 0; const qx = x + wob(x, y), qy = y + wob(y + 7, x);
      for (const [px, py, pw] of pts) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const dd = (qx - px - ox) ** 2 + (qy - py - oy) ** 2; if (dd < d1) { d2 = d1; d1 = dd; w1 = pw; } else if (dd < d2) d2 = dd; }
      const e = Math.sqrt(d2) - Math.sqrt(d1), k = (y * S + x) * 4, n = (Math.sin(x * 0.9 + y * 0.31) + Math.sin(x * 0.27 - y * 0.83) + Math.sin(x * 1.7 - y * 1.3) * 0.5) * 0.4;
      if (mode === 'flow') { const f = Math.max(0, 1 - e / 6); d[k] = 255; d[k + 1] = 110 + 50 * f; d[k + 2] = 36 + 20 * f; d[k + 3] = Math.round(150 * f * f * (0.3 + 0.7 * w1)); continue; }
      const ice = mode === 'ice', riv = mode === 'river', mol = ice ? 0.96 : riv ? 0.68 : 0.88, sw = riv ? 1.8 : 1.3, lp = riv ? 4.2 : ice ? 2.8 : 3.4;
      if (w1 > mol) { const f = Math.min(1, e / 16), g2 = 0.5 + 0.5 * Math.sin(x * 0.4 + y * 0.25 + n); d[k] = 255; d[k + 1] = 110 + 70 * g2 * (1 - f) - f * 40; d[k + 2] = 30 + 30 * g2 * (1 - f); d[k + 3] = 255; continue; }   // (a cell still molten)
      if (e < sw) { const f = e / sw; d[k] = 255; d[k + 1] = 228 - f * 90; d[k + 2] = 140 - f * 100; }   // the white-hot seam
      else if (e < lp) { const f = (e - sw) / (lp - sw); if (ice) { d[k] = 255 - f * 120; d[k + 1] = 132 + f * 50; d[k + 2] = 38 + f * 150; } else { d[k] = 255 - f * 170; d[k + 1] = 132 - f * 112; d[k + 2] = 38 - f * 28; } }   // its lip (red, or cooling to ice)
      else { const f = Math.min(1, (e - lp) / 7), sp = (n > 0.55 ? 10 : 0); if (ice) { d[k] = 175 - f * 70 + n * 10 + sp; d[k + 1] = 198 - f * 60 + n * 8 + sp; d[k + 2] = 218 - f * 45 + n * 6 + sp; } else { const dk = riv ? 0.8 : 1; d[k] = (58 - f * 30 + n * 6 + sp) * dk; d[k + 1] = (26 - f * 14 + n * 3 + sp * 0.4) * dk; d[k + 2] = (20 - f * 10 + n * 3) * dk; } }   // the cooled crust (ice-sealed in the forge)
      d[k + 3] = 255; }
    c.putImageData(img, 0, 0); c0.save(); c0.imageSmoothingEnabled = true; c0.drawImage(cv, 0, 0, S, S); c0.restore(); }
  GAP_EXT.calderalava = { base: '#FF6A1F',
    paint(c, S, R) { crustTile(c, S, R, 34, 'crust');
      for (let i = 0; i < 18; i++) { const x = R() * S, y = R() * S; c.fillStyle = `rgba(255,${200 + Math.floor(R() * 55)},140,${0.25 + R() * 0.4})`; c.beginPath(); c.arc(x, y, 0.6 + R() * 0.8, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, W, H, t, P, bigGlow } = o; const far = FAR.here && !FAR.off; pat(pattern(far ? 'calderalavafar' : 'calderalava', k), far ? FAR.par : 0.94, W / 2 + t * 2.4, H / 2 + t * 1.2);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = lowFx() ? 0.2 : 0.22 + 0.1 * Math.sin(t * 1.3); pat(pattern(far ? 'calderaflowfar' : 'calderaflow', k), far ? FAR.par + 0.03 : 0.97, W / 2 - t * 5, H / 2 + t * 3);
      if (!lowFx()) { c.globalAlpha = 0.1 + 0.05 * Math.sin(t * 0.7); bigGlow(c, P, '#FF7A2A', W * 0.15 - (o.wx * 0.04) % (W * 0.5), H * 0.2, W * 0.7); } c.restore(); farHaze(c, o, 'rgba(46,14,8,.16)'); } };
  GAP_EXT.calderaflow = { base: '#000000', paint(c, S, R) { crustTile(c, S, R, 9, 'flow'); }, back(c, o) { o.grad('#200805', '#0A0302'); } };
  /* (v388, the user: blur the lava below the ledges so it reads as far away.) The Ashen Hollows' lava (the user: there only) gets a '<kind>far' twin:
     the same tile, softened once when it is made (a box blur run three times, wrapping at the edges so the pattern still
     tiles), so it costs nothing per frame and works on every browser (no ctx.filter, which iPhone Safari lacks). The
     backdrop draws the far twin a little slower than the camera (parallax) under a faint haze; the ledges, their lit
     cliff faces and the walkable lava pools on the floor stay sharp, which is what sells the depth. */
  const FAR = { r: 2, passes: 3, par: 0.8, here: false };   // (the user: only in the Ashen Hollows; here is set per stage by everyStage)
  function wrapBlur(cv, S, r, passes) { const c = cv.getContext('2d'), img = c.getImageData(0, 0, S, S), a = img.data, b = new Float32Array(a.length), n = 2 * r + 1;
    const run = (src, dst, horiz) => { for (let j = 0; j < S; j++) for (let ch = 0; ch < 4; ch++) { let s = 0; const at = i => { i = ((i % S) + S) % S; return (horiz ? j * S + i : i * S + j) * 4 + ch; };
      for (let i = -r; i <= r; i++) s += src[at(i)]; for (let i = 0; i < S; i++) { dst[at(i)] = s / n; s += src[at(i + r + 1)] - src[at(i - r)]; } } };
    const f = Float32Array.from(a); for (let p = 0; p < passes; p++) { run(f, b, true); run(b, f, false); }
    for (let i = 0; i < a.length; i++) a[i] = f[i]; c.putImageData(img, 0, 0); }
  function farGap(kind) { const src = GAP_EXT[kind]; GAP_EXT[kind + 'far'] = { base: src.base, back: src.back,
    paint(c, S, R) { const cv = document.createElement('canvas'); cv.width = cv.height = S; src.paint(cv.getContext('2d'), S, R); wrapBlur(cv, S, FAR.r, FAR.passes); c.save(); c.imageSmoothingEnabled = true; c.drawImage(cv, 0, 0, S, S); c.restore(); } }; }
  const farHaze = (c, o, col) => { if (FAR.off || !FAR.here) return; c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = col; c.fillRect(0, 0, o.W, o.H); c.restore(); };
  farGap('calderalava'); farGap('calderaflow'); CAL.FAR = FAR;
  /* (v388) the caldera's props break into their own element's residue (they were all 'Rubble' / gold before) */
  if (typeof PROP_EL !== 'undefined') Object.assign(PROP_EL, { lavafall: 'fire', forge: 'fire', vessel: 'fire', furnaceidol: 'fire', idol: 'fire', ashmound: 'fire', basaltcol: 'gold', anvil: 'gold', chains: 'gold', metalring: 'gold',
    blackcrystal: 'shadow', bigcrystal: 'shadow', glassspire: 'shadow', slabhang: 'shadow', magmaglass: 'fire',
    frostwell: 'frost', frostcluster: 'frost', icechains: 'frost', icefall: 'frost', rimevessel: 'frost', crystalforest: 'prism', geode: 'prism' });   // (tests: CAL.FAR.off shows the old sharp lava)
  /* ---- the floors ---- */
  const edgeGlow = (c, X, Y, T, gN, gS, gW, gE, a) => { if (!(gN || gS || gW || gE)) return; c.save(); c.globalCompositeOperation = 'lighter';
    const side = (x0, y0, x1, y1, w, h) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(255,110,40,${a})`); g.addColorStop(0.5, `rgba(255,80,30,${a * 0.3})`); g.addColorStop(1, 'rgba(255,80,30,0)'); c.fillStyle = g; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h); };
    if (gN) side(X, Y, X, Y + T * 0.55, T, T * 0.55); if (gS) side(X, Y + T, X, Y + T * 0.45, T, T * 0.55); if (gW) side(X, Y, X + T * 0.5, Y, T * 0.5, T); if (gE) side(X + T, Y, X + T * 0.5, Y, T * 0.5, T); c.restore(); };
  // a seam of glowing lava along a crack (a soft orange underlay, a hot core)
  const seam = (c, pts, w, a, mn) => { mn = mn == null ? 0.5 : mn; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; poly(c, pts); c.strokeStyle = `rgba(20,6,4,${0.7 * a})`; c.lineWidth = w * 2.4; c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,90,30,${0.45 * a})`; c.lineWidth = w * 2; c.stroke(); c.strokeStyle = `rgba(255,150,60,${0.9 * a})`; c.lineWidth = w; c.stroke(); c.strokeStyle = `rgba(255,230,160,${0.8 * a})`; c.lineWidth = Math.max(mn, w * 0.4); c.stroke(); c.restore(); };
  const crack = (R, X, Y, T, n) => { const pts = []; let px = X + T * R(), py = Y; const vert = R() < 0.5; if (!vert) { px = X; py = Y + T * R(); } for (let i = 0; i <= n; i++) { pts.push([px, py]); if (vert) { py += T / n; px += (R() - 0.5) * T * 0.35; } else { px += T / n; py += (R() - 0.5) * T * 0.35; } } return pts; };
  /* the column joints: basalt cooled into columns, seen from above, is a mosaic of irregular hexagons. One lattice runs
     across the whole world (its corners jittered by where they are), so every tile draws its share and the joints meet
     across tiles. HS the columns' radius in tiles */
  const HS = 0.6, HW = HS * Math.sqrt(3);
  const hexJit = (vx, vy, s) => { const kx = Math.round(vx * 40), ky = Math.round(vy * 40); return [(hh(kx, ky, 3 + s) - 0.5) * HS * 0.34, (hh(kx, ky, 9 + s) - 0.5) * HS * 0.34]; };
  function hexCellsAt(x, y) { const out = [], r0 = Math.floor((y - 1) / (1.5 * HS)), r1 = Math.ceil((y + 2) / (1.5 * HS)); for (let r = r0; r <= r1; r++) { const off = r & 1 ? HW / 2 : 0, c0 = Math.floor((x - 1 - off) / HW), c1 = Math.ceil((x + 2 - off) / HW); for (let q = c0; q <= c1; q++) { const cx = q * HW + off, cy = r * 1.5 * HS; if (cx < x - HW || cx > x + 1 + HW || cy < y - HS * 1.2 || cy > y + 1 + HS * 1.2) continue;
    const V = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, vx = cx + Math.cos(a) * HS, vy = cy + Math.sin(a) * HS, j = hexJit(vx, vy, 0); V.push([vx + j[0], vy + j[1]]); } out.push({ cx, cy, q, r, h: hh(q, r, 41), h2: hh(q, r, 57), V }); } } return out; }
  /* paint a tile's share of the lattice. o.tone(cell) -> fill or null; o.inner(c, cell, P, T) extra paint in the cell;
     o.seam: share of joints that glow; o.joint: joint colour */
  function hexFloor(c, X, Y, T, x, y, o) { const cells = hexCellsAt(x, y), P = (vx, vy) => [X + (vx - x) * T, Y + (vy - y) * T];
    for (const cl of cells) { const pts = cl.V.map(v => P(v[0], v[1])); cl.pts = pts; const f = o.tone(cl); if (f) { poly(c, pts); c.closePath(); c.fillStyle = f; c.fill(); } if (o.inner) o.inner(c, cl, pts, T); }
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = o.joint || 'rgba(6,4,5,.62)'; c.lineWidth = Math.max(1, T * 0.045); c.beginPath(); for (const cl of cells) { const p = cl.pts; for (let k = 0; k < 6; k++) { const a = p[k], b = p[(k + 1) % 6]; c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } } c.stroke();
    // the lit lip of each column top (its upper-left edges)
    c.strokeStyle = o.lip || 'rgba(255,240,230,.09)'; c.lineWidth = Math.max(0.7, T * 0.018); c.beginPath(); for (const cl of cells) { const p = cl.pts; for (const k of [3, 4]) { const a = p[k], b = p[(k + 1) % 6], mx = (cl.pts[0][0] + cl.pts[3][0]) / 2, my = (cl.pts[1][1] + cl.pts[4][1]) / 2, ux = (mx - (a[0] + b[0]) / 2), uy = (my - (a[1] + b[1]) / 2), L = Math.hypot(ux, uy) || 1, d = T * 0.035; c.moveTo(a[0] + ux / L * d, a[1] + uy / L * d); c.lineTo(b[0] + ux / L * d, b[1] + uy / L * d); } } c.stroke();
    // a few joints still glowing: cooled crust with seams of lava in it
    if (o.seam) { const segs = []; for (const cl of cells) for (let k = 0; k < 6; k++) { const A = cl.V[k], B = cl.V[(k + 1) % 6], key = hh(Math.round((A[0] + B[0]) * 20), Math.round((A[1] + B[1]) * 20), 77); if (key < o.seam) segs.push([P(A[0], A[1]), P(B[0], B[1])]); }
      if (segs.length) for (const [a, b] of segs) seam(c, [a, b], Math.max(0.8, T * 0.028), o.seamA || 0.85); } }
  const hexTone = (cl, dark, lite) => cl.h < 0.33 ? `rgba(0,0,0,${dark * (0.5 + cl.h2)})` : cl.h > 0.7 ? `rgba(255,240,230,${lite * (0.5 + cl.h2)})` : null;
  // a soft, large-scale value noise (for regions that span many tiles)
  const vnoise = (x, y, s) => { const gx = Math.floor(x), gy = Math.floor(y), fx = x - gx, fy = y - gy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = hh(gx, gy, s), b = hh(gx + 1, gy, s), c2 = hh(gx, gy + 1, s), d = hh(gx + 1, gy + 1, s); return lerp(lerp(a, b, u), lerp(c2, d, u), v); };
  // (the engine lights every tile top-left to bottom-right; on a continuous mosaic that shows as squares: lay the inverse over it)
  function unTile(c, X, Y, T, h2) { const g = c.createLinearGradient(X, Y, X + T, Y + T); g.addColorStop(0, 'rgba(0,0,0,.085)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(255,255,255,${(0.07 + h2 * 0.05).toFixed(3)})`); c.fillStyle = g; c.fillRect(X, Y, T, T); }
  function grain(c, X, Y, T, R, n, a) { for (let i = 0; i < n; i++) { c.fillStyle = i % 3 ? `rgba(0,0,0,${a})` : `rgba(200,190,180,${a * 0.6})`; const s = Math.max(1, T * (0.012 + R() * 0.018)); c.fillRect(X + R() * T, Y + R() * T, s, s); } }
  function ashFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) { const R = rnd(x * 7919 + y * 104729 + 61), soot = vnoise(x / 4.5, y / 4.5, 11), ash = vnoise(x / 3.5 + 9, y / 3.5, 23);
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); unTile(c, X, Y, T, h2);
    grain(c, X, Y, T, R, 8, 0.14);
    hexFloor(c, X, Y, T, x, y, { tone: cl => hexTone(cl, 0.16, 0.06), seam: 0.035 + 0.05 * (1 - ash),
      inner(c2, cl, p, T2) { if (cl.h2 > 0.92) { const cx = (p[0][0] + p[3][0]) / 2, cy = (p[1][1] + p[4][1]) / 2; c2.fillStyle = '#0C0A10'; poly(c2, [[cx - T2 * 0.12, cy + T2 * 0.05], [cx - T2 * 0.02, cy - T2 * 0.1], [cx + T2 * 0.12, cy - T2 * 0.02], [cx + T2 * 0.05, cy + T2 * 0.09]]); c2.closePath(); c2.fill(); c2.fillStyle = 'rgba(200,180,255,.45)'; c2.fillRect(cx - T2 * 0.04, cy - T2 * 0.06, T2 * 0.07, Math.max(1, T2 * 0.02)); } } });
    // soot drifts and ash, in broad soft regions
    if (soot > 0.58) { c.fillStyle = `rgba(6,4,4,${(soot - 0.58) * 1.1})`; c.fillRect(X, Y, T, T); }
    if (ash > 0.62) { c.fillStyle = `rgba(175,165,155,${(ash - 0.62) * 0.8})`; c.fillRect(X, Y, T, T); if (h > 0.6) { c.fillStyle = 'rgba(225,215,205,.16)'; ell(c, X + T * (0.3 + h2 * 0.4), Y + T * (0.4 + h * 0.3), T * 0.3, T * 0.08, h - 0.5); c.fill(); } }
    edgeGlow(c, X, Y, T, gN, gS, gW, gE, 0.3);
    c.restore(); }
  const rivet = (c, x, y, r) => { c.fillStyle = '#16141A'; c.beginPath(); c.arc(x + r * 0.2, y + r * 0.25, r, 0, TAU); c.fill(); c.fillStyle = '#5E5A62'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU); c.fill(); };
  function foundryFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) { const R = rnd(x * 6151 + y * 92821 + 67), kind = Math.floor(hh(x, y, 79) * 12), basaltK = vnoise(x / 5, y / 5, 31), heat = vnoise(x / 3, y / 3, 37);
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    grain(c, X, Y, T, R, 6, 0.16);
    if (basaltK > 0.64) { /* old rune-cut basalt showing through the floor: the forge is older than the rift */ unTile(c, X, Y, T, h2); c.fillStyle = 'rgba(48,40,40,.55)'; c.fillRect(X, Y, T, T); hexFloor(c, X, Y, T, x, y, { tone: cl => hexTone(cl, 0.14, 0.05), seam: 0.03 });
      if (kind < 3) { rune(c, X + T * 0.5 + 1, Y + T * 0.5 + 1, T * 0.46, Math.floor(R() * 8), 'rgba(0,0,0,.55)', Math.max(1, T * 0.05)); rune(c, X + T * 0.5, Y + T * 0.5, T * 0.46, Math.floor(hh(x, y, 5) * 8), 'rgba(255,179,71,.3)', Math.max(0.8, T * 0.03)); } }
    else if (kind <= 1) { /* a grate over the lava: dark slots, molten light below */ c.fillStyle = '#121014'; c.fillRect(X + T * 0.1, Y + T * 0.1, T * 0.8, T * 0.8); for (let i = 0; i < 4; i++) { const xx = X + T * (0.16 + i * 0.18); const g = c.createLinearGradient(0, Y + T * 0.14, 0, Y + T * 0.86); g.addColorStop(0, 'rgba(255,90,30,.25)'); g.addColorStop(0.6, 'rgba(255,140,50,.7)'); g.addColorStop(1, 'rgba(255,90,30,.35)'); c.fillStyle = g; c.fillRect(xx + T * 0.02, Y + T * 0.14, T * 0.1, T * 0.72); }
      c.strokeStyle = '#4A464E'; c.lineWidth = Math.max(1, T * 0.04); c.strokeRect(X + T * 0.1, Y + T * 0.1, T * 0.8, T * 0.8); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X + T * 0.1, Y + T * 0.1, T * 0.8, Math.max(1, T * 0.02)); }
    else { /* a riveted iron plate, worn and heat-stained */ const g = c.createLinearGradient(X, Y, X + T, Y + T); g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(1, 'rgba(0,0,0,.16)'); c.fillStyle = g; c.fillRect(X, Y, T, T);
      if (heat > 0.6) { const g2 = c.createRadialGradient(X + T * 0.5, Y + T * 0.5, 0, X + T * 0.5, Y + T * 0.5, T * 0.8); g2.addColorStop(0, `rgba(120,70,150,${(heat - 0.6) * 0.7})`); g2.addColorStop(0.6, `rgba(60,90,150,${(heat - 0.6) * 0.4})`); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(X, Y, T, T); }   // (temper colours)
      if (kind === 4) { c.fillStyle = 'rgba(110,58,34,.3)'; ell(c, X + T * (0.3 + R() * 0.4), Y + T * 0.6, T * 0.3, T * 0.12, 0.4); c.fill(); }
      if (kind === 6) { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(X + T * 0.2, Y + T * 0.15); c.lineTo(X + T * 0.4, Y + T * 0.45); c.lineTo(X + T * 0.35, Y + T * 0.8); c.stroke(); }
      if (kind === 7 && heat < 0.5) { rune(c, X + T * 0.5, Y + T * 0.5, T * 0.4, x + y, 'rgba(0,0,0,.35)', Math.max(1, T * 0.04)); }
      for (const [u, v] of [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]]) rivet(c, X + T * u, Y + T * v, Math.max(0.8, T * 0.035));
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(X, Y + T - Math.max(1, T * 0.04), T, Math.max(1, T * 0.04)); c.fillRect(X + T - Math.max(1, T * 0.04), Y, Math.max(1, T * 0.04), T); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(X, Y, T, Math.max(1, T * 0.025)); c.fillRect(X, Y, Math.max(1, T * 0.025), T); }
    const soot = vnoise(x / 4, y / 4, 43); if (soot > 0.6) { c.fillStyle = `rgba(6,4,4,${(soot - 0.6) * 1.0})`; c.fillRect(X, Y, T, T); }
    edgeGlow(c, X, Y, T, gN, gS, gW, gE, 0.32);
    c.restore(); }
  function heartFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) { const R = rnd(x * 5003 + y * 90001 + 73);
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); unTile(c, X, Y, T, h2);
    grain(c, X, Y, T, R, 6, 0.14);
    // black glass pools over basalt columns, in broad regions; violet-red crystal veins along some joints
    hexFloor(c, X, Y, T, x, y, { seam: 0.03, joint: 'rgba(4,2,6,.7)',
      tone: cl => { const g = vnoise(cl.cx / 4.2, cl.cy / 4.2, 61); cl.glass = g > 0.56; return cl.glass ? '#0E0B13' : hexTone(cl, 0.18, 0.05); },
      inner(c2, cl, p, T2) { if (!cl.glass) return; const cx = (p[0][0] + p[3][0]) / 2, cy = (p[1][1] + p[4][1]) / 2; c2.save(); poly(c2, p); c2.closePath(); c2.clip(); const g = c2.createLinearGradient(cx - T2 * 0.6, cy + T2 * 0.6, cx + T2 * 0.6, cy - T2 * 0.6); const u = 0.35 + 0.3 * vnoise(cl.cx / 6, cl.cy / 6, 63); g.addColorStop(Math.max(0, u - 0.25), 'rgba(170,140,230,0)'); g.addColorStop(u, 'rgba(190,165,245,.13)'); g.addColorStop(Math.min(1, u + 0.04), 'rgba(255,255,255,.06)'); g.addColorStop(Math.min(1, u + 0.2), 'rgba(170,140,230,0)'); c2.fillStyle = g; c2.fillRect(cx - T2, cy - T2, T2 * 2, T2 * 2);
        const rg = c2.createRadialGradient(cx, cy + T2 * 0.2, 0, cx, cy, T2 * 0.7); rg.addColorStop(0, 'rgba(255,90,42,.08)'); rg.addColorStop(1, 'rgba(255,90,42,0)'); c2.fillStyle = rg; c2.fillRect(cx - T2, cy - T2, T2 * 2, T2 * 2); c2.restore(); } });
    // a crystal vein running toward the heart: violet light on the joints, a red-orange fracture in it
    const vein = vnoise(x / 2.5 + 3, y / 2.5, 67); if (vein > 0.72) { const cells = hexCellsAt(x, y); for (const cl of cells) { if (hh(cl.q, cl.r, 71) > 0.5) continue; const V = cl.V, k = Math.floor(cl.h * 6), A = V[k], B = V[(k + 1) % 6], a = [X + (A[0] - x) * T, Y + (A[1] - y) * T], b = [X + (B[0] - x) * T, Y + (B[1] - y) * T]; c.save(); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(140,60,200,.35)'; c.lineWidth = Math.max(2, T * 0.07); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = 'rgba(255,90,42,.85)'; c.lineWidth = Math.max(0.8, T * 0.022); c.stroke(); c.restore(); } }
    const ash = vnoise(x / 3.5, y / 3.5, 71); if (ash > 0.66) { c.fillStyle = `rgba(160,150,140,${(ash - 0.66) * 0.7})`; c.fillRect(X, Y, T, T); }
    edgeGlow(c, X, Y, T, gN, gS, gW, gE, 0.34);
    c.restore(); }
  function pitFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) { ashFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE); }
  /* ---- the walls (where the ground is rock, not a ledge over lava): basalt columns, rib-banded ironwork, black glass ---- */
  function columnWall(c, X, Y, T, H, h, x, lw, B) { const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, shadeC(B.face, -0.25)); g.addColorStop(0.4, B.face); g.addColorStop(1, B.faceD); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    // the column facets: three upright strips (lit, mid, shade), staggered joints
    const w = T / 3; for (let i = 0; i < 3; i++) { const xx = X + i * w, k = [0.08, 0, -0.1][i]; c.fillStyle = k > 0 ? `rgba(255,240,230,${k})` : `rgba(0,0,0,${-k})`; c.fillRect(xx, Y, w, H); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(xx + w - 1, Y, 1, H); const jy = Y + H * (0.3 + hh(x, i, 9) * 0.5); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(xx, jy, w, Math.max(1, T * 0.03)); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(xx, jy + Math.max(1, T * 0.03), w, 1); }
    if (B.wallGlow && hh(x, 3, 17) < 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; const gx = X + T * (0.2 + hh(x, 4, 11) * 0.6), g2 = c.createLinearGradient(0, Y + H, 0, Y + H * 0.3); g2.addColorStop(0, 'rgba(255,100,40,.5)'); g2.addColorStop(1, 'rgba(255,100,40,0)'); c.fillStyle = g2; c.fillRect(gx - 1, Y + H * 0.3, Math.max(1.5, T * 0.03), H * 0.7); c.restore(); } }
  function ironWall(c, X, Y, T, H, h, x, lw, B) { columnWall(c, X, Y, T, H, h, x, lw, B); c.fillStyle = '#2A282E'; c.fillRect(X, Y + H * 0.18, T + 0.5, H * 0.16); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(X, Y + H * 0.18, T + 0.5, 1); for (let i = 0; i < 3; i++) rivet(c, X + T * (0.18 + i * 0.32), Y + H * 0.26, Math.max(0.8, T * 0.03));
    if (x % 3 === 0) { rune(c, X + T * 0.5, Y + H * 0.66, T * 0.34, x, 'rgba(255,179,71,.35)', Math.max(0.8, T * 0.03)); } }
  /* ---- bridges: basalt slabs on stone beams (lava light between them); iron grate walkways in the foundry ---- */
  function slabBridge(c, x, y, X, Y, T, isGap, tt, lw, B) { const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y), horiz = gNS && !gWE ? true : gWE && !gNS ? false : true;
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, T * 0.2, T, T * 0.8);
    const R = rnd(x * 31 + y * 17); for (let i = 0; i < 2; i++) { const x0 = T * (0.02 + i * 0.5), w = T * 0.46, j = (R() - 0.5) * T * 0.04; basalt(c, [[x0, T * 0.12 + j], [x0 + w, T * 0.1 - j], [x0 + w - T * 0.01, T * 0.88], [x0 + T * 0.01, T * 0.9]], lw * 0.8, { hi: '#5C5355', mid: '#433B3D', lo: '#221C1E' }); }
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(T * 0.46, 0, T * 0.56, 0); g.addColorStop(0, 'rgba(255,100,40,0)'); g.addColorStop(0.5, 'rgba(255,120,50,.55)'); g.addColorStop(1, 'rgba(255,100,40,0)'); c.fillStyle = g; c.fillRect(T * 0.46, T * 0.12, T * 0.1, T * 0.76); c.restore();
    for (const yy of [0.06, 0.86]) { c.fillStyle = '#2E2729'; c.fillRect(0, T * yy, T, T * 0.08); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(0, T * yy, T, Math.max(1, T * 0.02)); }
    c.restore(); }
  function grateBridge(c, x, y, X, Y, T, isGap, tt, lw, B) { const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y), horiz = gNS && !gWE ? true : gWE && !gNS ? false : true;
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    c.fillStyle = '#100E12'; c.fillRect(0, T * 0.1, T, T * 0.8);
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(255,110,40,.45)'; c.fillRect(T * (0.04 + i * 0.165), T * 0.18, T * 0.08, T * 0.64); } c.restore();
    c.strokeStyle = '#4E4A52'; c.lineWidth = Math.max(1, T * 0.05); for (let i = 0; i <= 6; i++) { c.beginPath(); c.moveTo(T * i / 6, T * 0.12); c.lineTo(T * i / 6, T * 0.88); c.stroke(); }
    for (const yy of [0.08, 0.84]) { c.fillStyle = '#3C3A40'; c.fillRect(0, T * yy, T, T * 0.09); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, T * yy, T, Math.max(1, T * 0.02)); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(0, T * yy, T, T * 0.09); }
    if (((horiz ? x : y) % 2) === 0) for (const yy of [0.125, 0.885]) rivet(c, T * 0.5, T * yy, Math.max(0.8, T * 0.03));
    c.restore(); }
  function bridgeUnder(c, x, y, X, Y, T, lw) { c.fillStyle = '#1A1416'; c.fillRect(X + T * 0.04, Y, T * 0.92, T * 0.12); c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, Y + T * 0.12, 0, Y + T * 0.4); g.addColorStop(0, 'rgba(255,120,50,.35)'); g.addColorStop(1, 'rgba(255,120,50,0)'); c.fillStyle = g; c.fillRect(X, Y + T * 0.12, T, T * 0.28); c.restore(); }
  /* the cliff faces over the lava, lit from below */
  function cliffGlow(c, x, y, X, Y, T, lw, B, isGap) { const H = T * 0.62; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, Y + H * 1.05, 0, Y); g.addColorStop(0, 'rgba(255,120,40,.55)'); g.addColorStop(0.5, 'rgba(255,80,30,.18)'); g.addColorStop(1, 'rgba(255,80,30,0)'); c.fillStyle = g; c.fillRect(X, Y, T, H * 1.05);
    if (hh(x, y, 5) < 0.35) { c.strokeStyle = 'rgba(255,170,80,.55)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); const px = X + T * (0.2 + hh(x, y, 7) * 0.6); c.moveTo(px, Y + H * 0.2); c.lineTo(px + T * 0.05, Y + H * 0.55); c.lineTo(px - T * 0.03, Y + H * 0.95); c.stroke(); } c.restore(); }
  /* ---- decals ---- */
  window.DECAL_EXT = window.DECAL_EXT || {};
  Object.assign(DECAL_EXT, {
    calsoot(c, d, s) { const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 2.4); g.addColorStop(0, 'rgba(6,4,4,.45)'); g.addColorStop(1, 'rgba(6,4,4,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, s * 2.4, s * 1.4, d.rot, 0, TAU); c.fill(); },
    calash(c, d, s) { c.rotate(d.rot); c.fillStyle = 'rgba(190,180,170,.2)'; c.beginPath(); c.ellipse(0, 0, s * 1.8, s * 0.6, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(230,220,210,.18)'; c.beginPath(); c.ellipse(-s * 0.3, -s * 0.1, s * 0.9, s * 0.22, 0, 0, TAU); c.fill(); },
    calcoal(c, d, s) { for (let i = 0; i < 4; i++) { const x = Math.cos(i * 1.9 + d.v * 6) * s * 0.9, y = Math.sin(i * 1.9 + d.v * 6) * s * 0.45; c.fillStyle = '#1A1012'; c.beginPath(); c.arc(x, y, s * 0.22, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,120,50,.75)'; c.beginPath(); c.arc(x - s * 0.04, y - s * 0.04, s * 0.09, 0, TAU); c.fill(); } },
    calglass(c, d, s) { c.rotate(d.rot); c.fillStyle = '#0C0A10'; c.beginPath(); c.moveTo(-s, s * 0.2); c.lineTo(-s * 0.2, -s * 0.6); c.lineTo(s * 0.9, -s * 0.2); c.lineTo(s * 0.4, s * 0.5); c.closePath(); c.fill(); c.fillStyle = 'rgba(200,180,255,.45)'; c.fillRect(-s * 0.3, -s * 0.35, s * 0.6, Math.max(1, s * 0.12)); },
    calslag(c, d, s) { c.rotate(d.rot); c.fillStyle = 'rgba(30,26,30,.7)'; c.beginPath(); c.ellipse(0, 0, s * 1.2, s * 0.5, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(160,150,170,.3)'; c.beginPath(); c.ellipse(-s * 0.3, -s * 0.15, s * 0.4, s * 0.12, 0, 0, TAU); c.fill(); },
    calvein(c, d, s) { c.rotate(d.rot); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,90,42,.4)'; c.lineWidth = Math.max(1, s * 0.12); c.beginPath(); c.moveTo(-s * 1.6, 0); c.lineTo(-s * 0.5, s * 0.25); c.lineTo(s * 0.4, -s * 0.15); c.lineTo(s * 1.6, s * 0.1); c.stroke(); c.restore(); },
  });
  /* ---- props ---- */
  /* the live lights over the props (in tiles from the prop's feet): GLOWS[kind](v) -> [[dx, dy, r, kind]] — 'cry' a black
     crystal's circulating fire, 'lava' a lavafall, 'forge' a furnace mouth, 'frost' a frost crystal, 'coal' smoulder */
  const GLOWS = {};
  const fadeUp = (c, x0, x1, y0, y1, col) => { c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, y1, 0, y0); g.addColorStop(0, 'rgba(10,4,4,0)'); g.addColorStop(0.6, `rgba(${col || '10,4,4'},.65)`); g.addColorStop(1, `rgba(${col || '10,4,4'},1)`); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore(); };
  function blackcrystal(c, T, v) { shadowEll(c, T, 0.85); crystalArt(c, 0, 0, T * (2.3 + (v % 3) * 0.25), { v, ph: v * 0.27, k: 0.4, lw: lw0(T) }); }
  GLOWS.blackcrystal = v => [[0, -(2.3 + (v % 3) * 0.25) * 0.5, (2.3 + (v % 3) * 0.25) * 0.42, 'cry']];
  function bigcrystal(c, T, v) { shadowEll(c, T, 1.5); crystalArt(c, -T * 0.6, T * 0.05, T * 2.6, { v: v + 1, ph: 0.4, k: 0.35, lw: lw0(T) }); crystalArt(c, T * 0.35, 0, T * 4.4, { v, ph: v * 0.31, k: 0.45, lw: lw0(T) * 1.1 }); crystalArt(c, T * 1.2, T * 0.1, T * 1.8, { v: v + 2, ph: 0.7, k: 0.3, lw: lw0(T) }); }
  GLOWS.bigcrystal = v => [[0.35, -2.2, 1.8, 'cry'], [-0.6, -1.3, 1.1, 'cry']];
  /* basalt columns: a stand of hexagonal columns, their tops lit hexagons, their sides in three facets, an ember crack at the foot */
  const COLSETS = [[[-0.55, 3.4, 0.5], [0.15, 4.6, 0.56], [0.8, 2.6, 0.46]], [[-0.3, 5.2, 0.6], [0.55, 3.2, 0.5]], [[-0.8, 2.2, 0.44], [-0.1, 3.6, 0.52], [0.6, 4.2, 0.54], [1.15, 1.6, 0.4]], [[0, 3.8, 0.64]]];
  function hexCol(c, x, y, hgt, r, lw, R) { const ry = r * 0.5, top = y - hgt, a0 = -Math.PI;
    const P = k => [x + Math.cos(a0 + k * TAU / 6) * r, top + Math.sin(a0 + k * TAU / 6) * ry];
    // the three faces we see: (left) lit, (front) mid, (right) shade
    const faces = [[3, 4, '#5A5153'], [4, 5, '#3E3638'], [5, 0, '#241E20']].map(([i, j, col]) => { const A = P(i), B = P(j); return [[A[0], A[1]], [B[0], B[1]], [B[0], B[1] + hgt], [A[0], A[1] + hgt], col]; });
    // (the hexagon's lower half, k = 3..6, faces the viewer: 3 left, 4 front-left, 5 front-right, 0 right)
    const fl = [[[P(3), P(4)], '#5A5153'], [[P(4), P(5)], '#3B3335'], [[P(5), P(0)], '#221C1E']];
    for (const [[A, B], col] of fl) { poly(c, [A, B, [B[0], B[1] + hgt], [A[0], A[1] + hgt]]); c.closePath(); const g = c.createLinearGradient(0, top, 0, y); g.addColorStop(0, shadeC(col, 0.12)); g.addColorStop(0.7, col); g.addColorStop(1, shadeC(col, -0.4)); c.fillStyle = g; c.fill(); ink(c, lw * 0.8); }
    // joints across the column, staggered
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = Math.max(1, lw * 0.6); for (let k = 1; k < hgt / (r * 1.6); k++) { const jy = top + k * r * 1.6 + (R() - 0.5) * r * 0.5; if (jy > y - r * 0.3) break; c.beginPath(); c.moveTo(P(3)[0], jy + ry * 0.0); c.lineTo(P(4)[0], jy + ry * 0.86); c.lineTo(P(5)[0], jy + ry * 0.86); c.lineTo(P(0)[0], jy); c.stroke(); }
    // the top: a lit hexagon, ash on it
    poly(c, [0, 1, 2, 3, 4, 5].map(P)); c.closePath(); c.fillStyle = '#6E6466'; c.fill(); ink(c, lw * 0.8); c.fillStyle = 'rgba(200,190,180,.35)'; ell(c, x - r * 0.15, top - ry * 0.1, r * 0.5, ry * 0.4); c.fill(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = Math.max(0.8, lw * 0.5); poly(c, [P(0), P(1), P(2), P(3)]); c.stroke(); }
  function basaltcol(c, T, v) { const lw = lw0(T), R = rnd(19 + v * 7), set = COLSETS[v % 4]; shadowEll(c, T, 1.1, 0.4);
    for (const [dx, hgt, r] of set.slice().sort((a, b) => (a[0] < b[0] ? -1 : 1))) hexCol(c, dx * T, T * 0.05 * (hgt > 3.5 ? -1 : 1), hgt * T, r * T, lw, R);
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,110,40,.6)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(-T * 0.9, T * 0.08); c.lineTo(-T * 0.3, T * 0.14); c.lineTo(T * 0.2, T * 0.06); c.lineTo(T * 0.9, T * 0.12); c.stroke(); c.restore();
    fadeUp(c, -T * 2, T * 2, -T * 5.6, -T * 3.4); }
  GLOWS.basaltcol = v => [[0, 0.08, 0.9, 'coal']];
  function frostwell(c, T, v) { frostWellArt(c, 0, -T * 0.55, T * 0.9, { k: 0.15, v }); }
  GLOWS.frostwell = v => [[0, -1.6, 1.0, 'frost']];
  /* a lavafall: a notched basalt face, and the molten stream pouring from it into a crusted pool */
  function lavafall(c, T, v) { const lw = lw0(T), d = v % 2 ? -1 : 1, H = T * (6 + (v % 3) * 0.6), R = rnd(7 + v);
    c.fillStyle = 'rgba(8,4,4,.42)'; ell(c, 0, T * 0.12, T * 2.2, T * 0.6); c.fill();
    // two craggy shoulders of basalt, the stream between them; each a stack of faceted blocks rising into the dark
    const shoulder = sd => { const x0 = sd * T * 0.55, pts = [[x0, 0]]; let y = 0; for (let i = 0; i < 8; i++) { y -= H * (0.1 + R() * 0.04); pts.push([x0 + sd * T * (0.2 + R() * 0.9 + (i % 2) * 0.35), y]); } pts.push([x0 + sd * T * 0.1, -H * 1.02]); pts.push([sd * T * 0.42, -H * 0.96]); pts.push([sd * T * 0.38, -H * 0.5]); pts.push([sd * T * 0.5, -T * 0.2]);
      basalt(c, pts, lw, { hi: sd < 0 ? '#3E3638' : '#2E2729', mid: '#211C1D', lo: '#0C090A' });
      // its facets and ledges, lit from the stream
      for (let i = 1; i < 6; i++) { const yy = -H * i / 6.2, xa = sd * T * 0.45, xb = sd * T * (1.1 + R() * 0.4); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(xa, yy); c.lineTo(xb, yy - T * 0.12); c.stroke(); c.strokeStyle = 'rgba(255,140,60,.28)'; c.lineWidth = Math.max(0.8, lw * 0.5); c.beginPath(); c.moveTo(xa, yy - 1.5); c.lineTo(lerp(xa, xb, 0.5), yy - T * 0.06 - 1.5); c.stroke(); }
      c.save(); poly(c, pts); c.closePath(); c.clip(); c.globalCompositeOperation = 'lighter'; const lg = c.createLinearGradient(sd * T * 0.4, 0, sd * T * 1.4, 0); lg.addColorStop(0, 'rgba(255,100,36,.3)'); lg.addColorStop(0.5, 'rgba(255,100,36,.06)'); lg.addColorStop(1, 'rgba(255,100,36,0)'); c.fillStyle = lg; c.fillRect(Math.min(sd * T * 0.4, sd * T * 1.4), -H * 1.05, T, H * 1.05); c.restore(); };
    shoulder(-1); shoulder(1);
    // the stream: a ribbon narrow at the lip, widening as it falls, a white-hot core, crust flecks riding it
    const sx = d * T * 0.04, w0 = T * 0.28, w1 = T * 0.5; c.beginPath(); c.moveTo(sx - w0, -H * 0.97); c.bezierCurveTo(sx - w0 * 1.1, -H * 0.55, sx - w1, -H * 0.3, sx - w1 * 1.08, -T * 0.25); c.lineTo(sx + w1 * 1.08, -T * 0.25); c.bezierCurveTo(sx + w1, -H * 0.3, sx + w0 * 1.1, -H * 0.55, sx + w0, -H * 0.97); c.closePath();
    const g = c.createLinearGradient(sx - w1, 0, sx + w1, 0); g.addColorStop(0, '#9A2408'); g.addColorStop(0.22, '#FF5A1E'); g.addColorStop(0.48, '#FFD27A'); g.addColorStop(0.62, '#FFB040'); g.addColorStop(0.85, '#FF6A1F'); g.addColorStop(1, '#8A2006'); c.fillStyle = g; c.fill(); ink(c, lw * 0.8);
    c.save(); c.clip(); c.strokeStyle = 'rgba(255,250,220,.75)'; c.lineWidth = Math.max(1, T * 0.05); for (const off of [-0.08, 0.1]) { c.beginPath(); c.moveTo(sx + off * T, -H * 0.95); c.bezierCurveTo(sx + off * T * 1.3, -H * 0.55, sx + off * T * 1.8, -H * 0.25, sx + off * T * 2, -T * 0.3); c.stroke(); }
      c.fillStyle = 'rgba(70,22,10,.7)'; for (let i = 0; i < 12; i++) { const u = R(), yy = lerp(-H * 0.9, -T * 0.4, u), ww = lerp(w0, w1, u); ell(c, sx + (R() - 0.5) * ww * 1.5, yy, T * 0.07, T * 0.035, 0.2); c.fill(); } c.restore();
    // the lip it pours over, and the pool at its foot with crust drifting on it, steam rising
    ell(c, sx, -H * 0.97, w0 * 1.6, T * 0.16); c.fillStyle = '#16100F'; c.fill(); ink(c, lw * 0.7); ell(c, sx, -H * 0.975, w0 * 1.05, T * 0.08); c.fillStyle = '#FFC24A'; c.fill();
    ell(c, sx, -T * 0.18, T * 1.25, T * 0.4); const pg = c.createRadialGradient(sx, -T * 0.24, T * 0.1, sx, -T * 0.18, T * 1.25); pg.addColorStop(0, '#FFE6A0'); pg.addColorStop(0.35, '#FF8A30'); pg.addColorStop(0.8, '#B8300E'); pg.addColorStop(1, '#3A1206'); c.fillStyle = pg; c.fill(); ink(c, lw * 0.8);
    c.fillStyle = 'rgba(36,14,8,.8)'; for (let i = 0; i < 6; i++) { const a = R() * TAU, rr = T * (0.65 + R() * 0.45); ell(c, sx + Math.cos(a) * rr, -T * 0.18 + Math.sin(a) * rr * 0.28, T * 0.17, T * 0.05, a); c.fill(); }
    c.fillStyle = 'rgba(190,180,170,.12)'; for (let i = 0; i < 4; i++) { ell(c, sx + (R() - 0.5) * T, -T * (0.6 + i * 0.35), T * (0.35 + i * 0.12), T * (0.18 + i * 0.05)); c.fill(); }
    fadeUp(c, -T * 2.4, T * 2.4, -H - T * 0.3, -H * 0.66, '14,6,4'); }
  GLOWS.lavafall = v => { const H = 6 + (v % 3) * 0.6, sx = (v % 2 ? -1 : 1) * 0.04; return [[sx, -0.25, 1.5, 'lava'], [sx, -H * 0.45, 0.9, 'lava']]; };
  /* black glass spires (obsidian) */
  function glassspire(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.7); const cols = ['#2A2236', '#0E0B12', '#060408', '#3A3048', '#1C1624', '#0A080C'];
    shard(c, -T * 0.32, 0, T * 0.5, T * 1.4, -0.2, cols, lw); shard(c, T * 0.12, T * 0.05, T * 0.7, T * (2.2 + v * 0.2), 0.06, cols, lw); shard(c, T * 0.5, 0, T * 0.4, T * 1.0, 0.25, cols, lw);
    c.strokeStyle = 'rgba(230,220,255,.6)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(T * 0.0, -T * 0.2); c.lineTo(T * 0.1, -T * 1.5); c.stroke(); }
  /* an ash mound, smouldering */
  function ashmound(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.95, 0.3); c.beginPath(); c.moveTo(-T * 1.0, 0); c.quadraticCurveTo(-T * 0.7, -T * 0.55, -T * 0.1, -T * 0.7); c.quadraticCurveTo(T * 0.6, -T * 0.6, T * 1.0, 0); c.closePath(); const g = c.createLinearGradient(0, -T * 0.7, 0, 0); g.addColorStop(0, '#9A918C'); g.addColorStop(0.6, '#6E6662'); g.addColorStop(1, '#3E3836'); c.fillStyle = g; c.fill(); ink(c, lw);
    c.fillStyle = 'rgba(230,222,214,.35)'; ell(c, -T * 0.25, -T * 0.52, T * 0.32, T * 0.08, -0.2); c.fill();
    const R = rnd(3 + v); for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * T * 1.2, y = -T * (0.1 + R() * 0.35); c.fillStyle = '#1A1012'; c.beginPath(); c.arc(x, y, T * 0.07, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,120,50,.85)'; c.beginPath(); c.arc(x, y, T * 0.035, 0, TAU); c.fill(); } }
  GLOWS.ashmound = v => [[0, -0.3, 0.8, 'coal']];
  /* the forge machinery: an ancient runic press: a stepped basalt plinth, an iron frame with rune plates, a great toothed
     wheel, a furnace mouth glowing in its belly, a chain from the beam */
  function forge(c, T, v) { const lw = lw0(T), R = rnd(23 + v); c.fillStyle = 'rgba(8,4,4,.42)'; ell(c, 0, T * 0.1, T * 2.4, T * 0.7); c.fill();
    basalt(c, [[-T * 2.1, 0], [-T * 2.0, -T * 0.6], [T * 2.0, -T * 0.6], [T * 2.1, 0]], lw); basalt(c, [[-T * 1.7, -T * 0.6], [-T * 1.6, -T * 1.05], [T * 1.6, -T * 1.05], [T * 1.7, -T * 0.6]], lw, { hi: '#615759', mid: '#4A4244', lo: '#2A2325' });
    // the furnace body
    c.beginPath(); c.moveTo(-T * 1.2, -T * 1.05); c.lineTo(-T * 1.1, -T * 3.0); c.quadraticCurveTo(0, -T * 3.5, T * 1.1, -T * 3.0); c.lineTo(T * 1.2, -T * 1.05); c.closePath(); const g = c.createLinearGradient(-T * 1.2, 0, T * 1.2, 0); g.addColorStop(0, '#4E4A52'); g.addColorStop(0.35, '#3A383D'); g.addColorStop(1, '#16141A'); c.fillStyle = g; c.fill(); ink(c, lw);
    for (const yy of [-1.5, -2.3]) { c.fillStyle = '#2A282E'; c.fillRect(-T * 1.18, yy * T, T * 2.36, T * 0.16); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(-T * 1.18, yy * T, T * 2.36, T * 0.16); for (let i = -2; i <= 2; i++) rivet(c, i * T * 0.48, (yy + 0.08) * T, Math.max(0.8, T * 0.035)); }
    // heat discolouring near the mouth
    const hg = c.createRadialGradient(0, -T * 1.6, T * 0.2, 0, -T * 1.6, T * 1.2); hg.addColorStop(0, 'rgba(110,60,150,.35)'); hg.addColorStop(0.5, 'rgba(60,80,140,.18)'); hg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = hg; c.fillRect(-T * 1.2, -T * 2.8, T * 2.4, T * 1.8);
    // the furnace mouth
    c.beginPath(); c.moveTo(-T * 0.55, -T * 1.08); c.lineTo(-T * 0.55, -T * 1.7); c.quadraticCurveTo(0, -T * 2.05, T * 0.55, -T * 1.7); c.lineTo(T * 0.55, -T * 1.08); c.closePath(); const mg = c.createLinearGradient(0, -T * 1.9, 0, -T * 1.08); mg.addColorStop(0, '#FF7A2A'); mg.addColorStop(0.6, '#FFC24A'); mg.addColorStop(1, '#FFF0B0'); c.fillStyle = mg; c.fill(); ink(c, lw);
    c.strokeStyle = '#1E1C20'; c.lineWidth = Math.max(1.5, T * 0.06); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * T * 0.2, -T * 1.1); c.lineTo(i * T * 0.2, -T * 1.85 + Math.abs(i) * T * 0.08); c.stroke(); }
    // rune plates on its flank
    for (let i = 0; i < 2; i++) { const px = (i ? 1 : -1) * T * 0.85, py = -T * 2.65; c.fillStyle = '#26242A'; c.fillRect(px - T * 0.2, py - T * 0.22, T * 0.4, T * 0.44); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(px - T * 0.2, py - T * 0.22, T * 0.4, T * 0.44); rune(c, px, py, T * 0.32, v + i * 3, rgba(RUNE, 0.65), Math.max(1, T * 0.04)); }
    // the great wheel beside it
    const wx = T * 1.75, wy = -T * 2.2, wr = T * 1.05; c.save(); c.translate(wx, wy); c.rotate(v * 0.4); c.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, a2 = a + TAU / 28; c.lineTo(Math.cos(a) * wr, Math.sin(a) * wr); c.lineTo(Math.cos(a2) * wr * 0.84, Math.sin(a2) * wr * 0.84); } c.closePath(); c.fillStyle = shade(c, '#4A464E', wr, 0, 0, 0.35); c.fill(); ink(c, lw);
    c.beginPath(); c.arc(0, 0, wr * 0.62, 0, TAU); c.fillStyle = '#1C1A1E'; c.fill(); ink(c, lw * 0.8); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.strokeStyle = '#3C3A40'; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.moveTo(Math.cos(a) * wr * 0.15, Math.sin(a) * wr * 0.15); c.lineTo(Math.cos(a) * wr * 0.62, Math.sin(a) * wr * 0.62); c.stroke(); }
    c.beginPath(); c.arc(0, 0, wr * 0.18, 0, TAU); c.fillStyle = '#5E5A62'; c.fill(); ink(c, lw * 0.8); c.restore();
    // a broken chain hanging from above
    c.strokeStyle = '#2A282E'; c.lineWidth = Math.max(1.4, T * 0.06); for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(-T * 1.6, -T * 5.2 + i * T * 0.3, T * 0.08, T * 0.16, 0, 0, TAU); c.stroke(); }
    fadeUp(c, -T * 2.6, T * 3, -T * 5.6, -T * 3.6, '14,6,4');
    void R; }
  GLOWS.forge = v => [[0, -1.45, 1.4, 'forge']];
  /* an engraved pressure vessel: a riveted iron tank with a domed top, rune bands, a gauge and a valve wheel; one seam glows */
  function vessel(c, T, v) { const lw = lw0(T), w = T * 0.85, H = T * 2.9; shadowEll(c, T, 1.0, 0.4);
    basalt(c, [[-w * 1.2, 0], [-w * 1.1, -T * 0.35], [w * 1.1, -T * 0.35], [w * 1.2, 0]], lw);
    c.beginPath(); c.moveTo(-w, -T * 0.35); c.lineTo(-w, -H + w * 0.4); c.quadraticCurveTo(-w, -H - w * 0.55, 0, -H - w * 0.55); c.quadraticCurveTo(w, -H - w * 0.55, w, -H + w * 0.4); c.lineTo(w, -T * 0.35); c.closePath();
    const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#3A383D'); g.addColorStop(0.28, '#6A666E'); g.addColorStop(0.55, '#46434A'); g.addColorStop(1, '#141216'); c.fillStyle = g; c.fill(); ink(c, lw);
    // heat discolouring round the lower seam: blue-violet temper colours on the iron
    const hg = c.createLinearGradient(0, -T * 0.4, 0, -T * 1.3); hg.addColorStop(0, 'rgba(90,60,140,.35)'); hg.addColorStop(0.5, 'rgba(60,90,150,.2)'); hg.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = hg; c.fillRect(-w, -T * 1.3, w * 2, T * 0.95); c.restore();
    for (const yy of [0.75, 1.65, 2.45]) { const Y = -yy * T; c.fillStyle = '#2C2A30'; c.fillRect(-w - 1, Y - T * 0.09, w * 2 + 2, T * 0.18); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(-w - 1, Y - T * 0.09, w * 2 + 2, T * 0.18); for (let i = -3; i <= 3; i++) rivet(c, i * w * 0.3, Y, Math.max(0.7, T * 0.03)); }
    for (let i = 0; i < 3; i++) rune(c, -w * 0.45 + i * w * 0.45, -T * 2.05, T * 0.34, v * 3 + i, rgba(RUNE, 0.55), Math.max(1, T * 0.035));
    // a glowing seam low on it
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,120,50,.75)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(-w * 0.9, -T * 1.12); c.lineTo(-w * 0.2, -T * 1.18); c.lineTo(w * 0.5, -T * 1.1); c.stroke(); c.restore();
    // the gauge and the valve wheel
    c.beginPath(); c.arc(w * 0.45, -T * 1.25 + 0, T * 0.22, 0, TAU); c.fillStyle = '#E8DCC8'; c.fill(); ink(c, lw * 0.7); c.strokeStyle = '#B8300E'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.moveTo(w * 0.45, -T * 1.25); c.lineTo(w * 0.45 + T * 0.14, -T * 1.36); c.stroke();
    c.strokeStyle = '#6E3A22'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.arc(-w * 0.95, -T * 2.95, T * 0.26, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-w * 0.95 - T * 0.26, -T * 2.95); c.lineTo(-w * 0.95 + T * 0.26, -T * 2.95); c.moveTo(-w * 0.95, -T * 3.21); c.lineTo(-w * 0.95, -T * 2.69); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = Math.max(1, w * 0.06); c.beginPath(); c.moveTo(-w * 0.5, -T * 0.5); c.lineTo(-w * 0.5, -H + w * 0.2); c.stroke(); }
  GLOWS.vessel = v => [[-0.1, -1.15, 0.7, 'coal']];
  /* broken chains hanging out of the dark above, a shackle at their ends */
  function chains(c, T, v) { const lw = lw0(T), set = v % 2 ? [[-0.4, 3.0], [0.35, 4.2]] : [[0, 3.6], [0.55, 2.4], [-0.5, 4.6]];
    for (const [dx, len] of set) { const n = Math.floor(len / 0.3); for (let i = 0; i < n; i++) { const y = -T * 6 + i * T * 0.3, sx = dx * T + Math.sin(i * 0.4 + v) * T * 0.04; c.beginPath(); if (i % 2) c.ellipse(sx, y, T * 0.05, T * 0.17, 0, 0, TAU); else c.ellipse(sx, y, T * 0.1, T * 0.17, 0, 0, TAU); c.strokeStyle = LN; c.lineWidth = Math.max(2, T * 0.09) + lw; c.stroke(); c.strokeStyle = i % 2 ? '#3C3A40' : '#5A565E'; c.lineWidth = Math.max(1.5, T * 0.07); c.stroke(); }
      const ey = -T * 6 + n * T * 0.3; c.beginPath(); c.arc(dx * T, ey + T * 0.1, T * 0.16, 0, Math.PI); c.strokeStyle = '#2A282E'; c.lineWidth = Math.max(2, T * 0.08); c.stroke(); }
    fadeUp(c, -T * 1.4, T * 1.4, -T * 6.2, -T * 4.0, '14,6,4'); }
  /* a suspended metal ring: a great rune-cut iron ring hung on two chains */
  function metalring(c, T, v) { const lw = lw0(T), cy = -T * 3.2, R = T * 1.7; c.fillStyle = 'rgba(8,4,4,.3)'; ell(c, 0, T * 0.1, T * 1.6, T * 0.45); c.fill();
    for (const sd of [-1, 1]) { for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(sd * R * 0.62, -T * 6 + i * T * 0.3, T * 0.06, T * 0.15, 0, 0, TAU); c.strokeStyle = '#3C3A40'; c.lineWidth = Math.max(1.5, T * 0.06); c.stroke(); } }
    c.save(); c.translate(0, cy); c.scale(1, 0.9 + (v % 2) * 0.1);
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.arc(0, 0, R * 0.74, 0, TAU, true); const g = c.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#6E6A72'); g.addColorStop(0.4, '#46434A'); g.addColorStop(1, '#141216'); c.fillStyle = g; c.fill('evenodd'); c.beginPath(); c.arc(0, 0, R, 0, TAU); ink(c, lw); c.beginPath(); c.arc(0, 0, R * 0.74, 0, TAU); ink(c, lw);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; rune(c, Math.cos(a) * R * 0.87, Math.sin(a) * R * 0.87, T * 0.26, i + v, rgba(RUNE, 0.5), Math.max(1, T * 0.03)); }
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.arc(0, 0, R * 0.96, Math.PI * 1.05, Math.PI * 1.6); c.stroke(); c.restore();
    fadeUp(c, -T * 2.4, T * 2.4, -T * 6.2, -T * 4.6, '14,6,4'); }
  function anvil(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.8, 0.4); basalt(c, [[-T * 0.6, 0], [-T * 0.5, -T * 0.5], [T * 0.5, -T * 0.5], [T * 0.6, 0]], lw);
    c.beginPath(); c.moveTo(-T * 0.9, -T * 0.95); c.quadraticCurveTo(-T * 0.6, -T * 1.0, -T * 0.4, -T * 1.05); c.lineTo(T * 0.7, -T * 1.05); c.lineTo(T * 0.7, -T * 0.8); c.lineTo(T * 0.3, -T * 0.75); c.lineTo(T * 0.25, -T * 0.5); c.lineTo(-T * 0.25, -T * 0.5); c.lineTo(-T * 0.3, -T * 0.75); c.quadraticCurveTo(-T * 0.6, -T * 0.8, -T * 0.9, -T * 0.95); c.closePath(); const g = c.createLinearGradient(0, -T * 1.05, 0, -T * 0.5); g.addColorStop(0, '#6A666E'); g.addColorStop(1, '#1E1C20'); c.fillStyle = g; c.fill(); ink(c, lw); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-T * 0.3, -T * 1.04, T * 0.9, Math.max(1, T * 0.03)); }
  /* a suspended obsidian slab, hung on chains from the dark: it floats over the floor (its shadow far below it) */
  function slabhang(c, T, v) { const lw = lw0(T); c.fillStyle = 'rgba(8,4,8,.32)'; ell(c, 0, T * 0.1, T * 1.4, T * 0.4); c.fill(); const cy = -T * (3.6 + (v % 2) * 0.4), sw = T * 1.25, sh = T * 1.7;
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(sd * sw * 0.6, cy - sh - T * 2.6 + i * T * 0.32, T * 0.05, T * 0.15, 0, 0, TAU); c.strokeStyle = '#2A282E'; c.lineWidth = Math.max(1.4, T * 0.05); c.stroke(); }
    const cols = ['#2E2638', '#100C16', '#06040A', '#3E3450', '#1E1828', '#0C0A10'];
    poly(c, [[-sw, cy - sh * 0.1], [-sw * 0.7, cy - sh], [sw * 0.75, cy - sh * 0.95], [sw, cy - sh * 0.05], [sw * 0.6, cy + sh * 0.25], [-sw * 0.55, cy + sh * 0.2]]); c.closePath(); const g = c.createLinearGradient(-sw, cy - sh, sw, cy); g.addColorStop(0, cols[3]); g.addColorStop(0.5, cols[1]); g.addColorStop(1, cols[2]); c.fillStyle = g; c.fill(); ink(c, lw);
    c.strokeStyle = 'rgba(220,200,255,.45)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(-sw * 0.6, cy - sh * 0.85); c.lineTo(sw * 0.2, cy - sh * 0.2); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,90,42,.6)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.moveTo(sw * 0.3, cy - sh * 0.9); c.lineTo(sw * 0.1, cy - sh * 0.5); c.lineTo(sw * 0.35, cy - sh * 0.1); c.stroke(); c.restore();
    fadeUp(c, -T * 2, T * 2, cy - sh - T * 3, cy - sh - T * 0.6, '10,4,8'); }
  GLOWS.slabhang = v => [[0.15, -(3.6 + (v % 2) * 0.4) - 0.8, 0.6, 'cry']];
  window.PROP_EXT = window.PROP_EXT || {};
  Object.assign(PROP_EXT, { blackcrystal: [3.0, 3.6], bigcrystal: [5.2, 5.6], basaltcol: [3.4, 6.0], frostwell: [3.0, 3.6], lavafall: [4.8, 8.0], glassspire: [2.2, 3.0], ashmound: [2.6, 1.4], forge: [6.4, 6.0], vessel: [2.6, 4.0], chains: [2.6, 6.4], metalring: [4.6, 6.4], anvil: [2.2, 1.6], slabhang: [3.4, 7.2] });
  Object.assign(PROPS, { blackcrystal, bigcrystal, basaltcol, frostwell, lavafall, glassspire, ashmound, forge, vessel, chains, metalring, anvil, slabhang });

  /* ---- the lands themselves ---- */
  const land = o => Object.assign({ rift: true, tile: 'volcano', out: true, ambient: 'embers', hazard: 'geyser', gap: 'calderalava', bridgeFn: slabBridge, bridgeEdge: bridgeUnder, wallFn: columnWall, cliffTint: cliffGlow, wallGlow: true, propN: [2, 2], fog: '#140605', darkRGB: '20,6,4' }, o);
  BIOMES.ashen = land({ name: 'The Ashen Hollows', dark: 0.16, bg: '#1A0705', accent: LAVA_HI, light: EMBER, bridgeCol: BASALT_HI, deco: LAVA,
    floor: ['#3D3637', '#3F3839', '#3C3536'], grout: '#1E1A1B', hi: '#625859', top: '#2F292A', face: '#2C2627', faceD: '#141011', cliff: '#2C2425', grade: 'rgba(255,100,40,.05)',
    props: ['blackcrystal', 'basaltcol', 'ashmound', 'glassspire', 'blackcrystal'], floorFn: ashFloor });
  BIOMES.foundry = land({ name: 'The Runebound Foundry', dark: 0.2, bg: '#160604', accent: RUNE, light: '#FFB066', bridgeCol: IRON_HI, deco: RUNE, bridgeFn: grateBridge, wallFn: ironWall,
    floor: ['#3A373C', '#403C42', '#36333A'], grout: '#1A181C', hi: '#5E5A62', top: '#2A272C', face: '#2A272C', faceD: '#121014', cliff: '#2A2628', grade: 'rgba(255,150,70,.05)',
    props: ['vessel', 'anvil', 'chains', 'forge', 'vessel'], floorFn: foundryFloor });
  BIOMES.heartward = land({ name: 'The Heartward Descent', dark: 0.24, bg: '#120406', accent: FRACTURE_HI, light: FRACTURE, bridgeCol: BASALT_HI, deco: FRACTURE,
    floor: ['#2B2529', '#2C262A', '#2A2428'], grout: '#120E12', hi: '#4A4048', top: '#221C21', face: '#211B20', faceD: '#0E0A0D', cliff: '#211A1E', grade: 'rgba(160,60,140,.05)',
    props: ['bigcrystal', 'basaltcol', 'glassspire', 'slabhang', 'blackcrystal'], floorFn: heartFloor, fog: '#120406', darkRGB: '18,4,6' });
  BIOMES.calderapit = land({ name: 'The Caldera', dark: 0.12, bg: '#1A0604', accent: LAVA_HI, light: EMBER, bridgeCol: BASALT_HI, deco: LAVA,
    floor: ['#3B3335', '#3C3436', '#3A3234'], grout: '#1A1617', hi: '#5E5456', top: '#2A2425', face: '#2A2425', faceD: '#120E0F', cliff: '#2A2223', grade: 'rgba(255,100,40,.06)',
    props: ['blackcrystal', 'basaltcol', 'lavafall'], floorFn: pitFloor });
  BIOME_ORDER.push('ashen', 'foundry', 'heartward', 'calderapit');
  DARK_COL.ashen = '20,6,4'; DARK_COL.foundry = '20,6,4'; DARK_COL.heartward = '18,4,6'; DARK_COL.calderapit = '20,6,4';
  ROOM_SHAPES.ashen = ['oval', 'rect', 'oval']; ROOM_SHAPES.foundry = ['rect', 'rect', 'oval']; ROOM_SHAPES.heartward = ['oval', 'islands', 'oval']; ROOM_SHAPES.calderapit = ['oval'];
  BOSS_ARENA.ashen = BOSS_ARENA.foundry = BOSS_ARENA.heartward = BOSS_ARENA.calderapit = 'oval';
  if (typeof DECALS !== 'undefined') { DECALS.ashen = [['calsoot', 0.06], ['calash', 0.05], ['calcoal', 0.025], ['calglass', 0.02]]; DECALS.foundry = [['calsoot', 0.06], ['calslag', 0.04], ['calcoal', 0.02]]; DECALS.heartward = [['calvein', 0.04], ['calglass', 0.04], ['calash', 0.03], ['calsoot', 0.04]]; DECALS.calderapit = [['calsoot', 0.05], ['calcoal', 0.03]]; }
  Object.assign(CAL, { GLOWS, crustTile, slabBridge, grateBridge, columnWall, ironWall, ashFloor, foundryFloor, heartFloor, hexCol, seam, hexFloor, hexCellsAt, vnoise });

  /* ======================= the brood ======================= */
  /* Level-1 tuning (base stats; a floor-1 rift stage scales health x2.52 and blows x1.3). Every attack is shown first and
     followed by a recovery the pet can punish; contact alone does the usual small bump. */
  const BIO = ['ashen', 'foundry', 'heartward', 'calderapit', 'rimeforge', 'glassheart'];
  Object.assign(MON, {
    cinderslug: { name: 'Cinder slug', from: 999, hp: 30, spd: 0.85, r: 0.46, dmg: 7, xp: 6, coin: 0.5, color: '#3A2E2C', bio: BIO, kit: [], tip: 'A slow slug under plates of cooled crust, molten underneath. It rears and its mouth glows before one short fire spit (a cone in front of it): step aside, then hit it while it cools.' },
    basaltcrawler: { name: 'Basalt crawler', from: 999, hp: 46, spd: 1.15, r: 0.5, dmg: 8, xp: 8, coin: 0.6, color: '#3E3638', bio: BIO, kit: [], tip: 'Heavy basalt plates guard its front; its rear glows, molten and soft. Blows to the plates do little. It turns slowly: dodge its ram and strike the glowing back.' },
    emberwisp: { name: 'Ember wisp', from: 999, hp: 20, spd: 1.7, r: 0.38, dmg: 8, xp: 6, coin: 0.5, color: '#FF8A3D', fly: true, bio: BIO, kit: [], tip: 'A coal in a shell of flame. It swells and shows a line, then throws one slow fireball, and burns low for a long while after: that is the time to catch it.' },
    furnaceimp: { name: 'Furnace imp', from: 999, hp: 26, spd: 1.9, r: 0.42, dmg: 7, xp: 7, coin: 0.6, color: '#2E2A2C', bio: BIO, kit: [], tip: 'A soot-black imp with a furnace in its belly. It winds back and lobs a slow ember at the shown circle, then hops away for a moment.' },
    runicsentinel: { name: 'Runic sentinel', from: 999, hp: 56, spd: 0.95, r: 0.56, dmg: 10, xp: 10, coin: 0.8, color: '#3A383D', bio: BIO, kit: [], tip: 'An old forge guardian behind a rune-cut iron shield: hits from the front barely scratch it. After its shield bash it lowers the shield and its chest rune glows: hit it then, from anywhere.' },
    bomblarva: { name: 'Bomb larva', from: 999, hp: 14, spd: 2.0, r: 0.36, dmg: 9, xp: 5, coin: 0.4, color: '#4A464E', fly: true, bio: BIO, kit: [], tip: 'A little levitating iron bomb. It lands and its fuse runs: while its ring is GREEN, hit it with any attack and it flies back at your enemies. When it flashes RED, get out of its circle.' },
    ashenknight: { name: 'Ashen knight', from: 999, hp: 56, spd: 1.25, r: 0.54, dmg: 10, xp: 10, coin: 0.8, color: '#4A4244', bio: BIO, kit: [], tip: 'Charred iron and basalt round an ember. It raises its blade, cuts twice (each cut shown), then leans on its sword to recover: strike then.' },
    crystalwisp: { name: 'Crystal wisp', from: 999, hp: 26, spd: 1.4, r: 0.42, dmg: 10, xp: 8, coin: 0.6, color: '#2A1C3A', fly: true, bio: BIO, kit: [], tip: 'A floating shard of black fire crystal. It marks a straight line, then fires one beam down it: leave the line, and hit it while its light is spent.' },
  });
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  const addGlow = (c, x, y, r, col, a) => { if (a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const rim = (c, w, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,120,50,${a == null ? 0.55 : a})`; c.lineWidth = w; c.stroke(); c.restore(); };
  const lavaG = (c, x0, y0, x1, y1, k) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#FFF0B0'); g.addColorStop(0.35, k > 0.5 ? '#FFC24A' : '#FF9A3A'); g.addColorStop(0.75, '#FF5A1E'); g.addColorStop(1, '#9A2408'); return g; };
  Object.assign(MP, {
    /* the cinder slug: a long low body roofed with plates of cooled crust; between them molten seams; a glowing foot;
       two short stalks with ember tips. 'w1'..'w3' rear the head and light the mouth; 'spit' the mouth wide and bright;
       'rest' cooling (seams dim) */
    cinderslug(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', wind = md[0] === 'w' ? +md[1] / 3 : md === 'spit' ? 1 : 0, rest = md === 'rest', cr = Math.sin(ph * TAU), lift = wind * r * 0.32, hot = rest ? 0.45 : 1;
      c.fillStyle = 'rgba(8,4,4,.34)'; ell(c, 0, r * 0.62, r * 1.2, r * 0.25); c.fill();
      const back = u => [lerp(-1.15 * r, 0.82 * r, u) + cr * r * 0.03 * Math.sin(u * 5), r * 0.46 - Math.sin(Math.min(1, u * 1.1) * Math.PI * 0.92) * r * 0.78 * (1 - 0.15 * u) - lift * u * u];
      // the molten body under everything (only its seams and foot will show)
      c.beginPath(); for (let i = 0; i <= 20; i++) { const p = back(i / 20); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.quadraticCurveTo(r * 1.08, r * 0.1 - lift * 0.7, r * 0.96, r * 0.5); c.lineTo(-r * 0.9, r * 0.58); c.closePath();
      c.fillStyle = lavaG(c, 0, -r * 0.6, 0, r * 0.6, hot); c.fill(); stroke(c, lw);
      // the foot: a molten ribbon with a slow wave of brightness running along it
      c.save(); c.beginPath(); c.moveTo(-r * 0.95, r * 0.5); c.quadraticCurveTo(0, r * 0.66, r * 0.92, r * 0.48); c.lineTo(r * 0.9, r * 0.36); c.quadraticCurveTo(0, r * 0.5, -r * 0.92, r * 0.38); c.closePath(); c.fillStyle = rest ? '#C8501A' : '#FF8A30'; c.fill();
      for (let i = 0; i < 3; i++) { const u = ((ph + i / 3) % 1), x = lerp(-r * 0.9, r * 0.85, u); addGlow(c, x, r * 0.47, r * 0.24, LAVA_HI, 0.5 * hot); } c.restore();
      // the crust plates along the back (leaving glowing seams between them)
      for (let i = 0; i < 5; i++) { const u0 = 0.03 + i * 0.185, u1 = u0 + 0.2, a = back(u0), b = back(u1), m1 = back((u0 + u1) / 2), dep = r * (0.36 + 0.04 * Math.sin(i * 1.7)), R2 = rnd(11 + i * 5);
        // a rubbly slab of crust: a rounded top, a lumpy lower edge
        c.beginPath(); c.moveTo(a[0] + r * 0.03, a[1] + r * 0.06); c.quadraticCurveTo(m1[0] - r * 0.02, m1[1] - r * 0.12, b[0] - r * 0.02, b[1] + r * 0.05);
        c.quadraticCurveTo(b[0] + r * 0.02, b[1] + dep * 0.6, b[0] - r * 0.06, b[1] + dep); for (let k = 3; k >= 1; k--) { const u = k / 4; c.lineTo(lerp(a[0] + r * 0.04, b[0] - r * 0.06, u) + (R2() - 0.5) * r * 0.04, lerp(a[1] + dep, b[1] + dep, u) + (R2() - 0.3) * r * 0.06); } c.lineTo(a[0] + r * 0.04, a[1] + dep * 1.02); c.quadraticCurveTo(a[0] - r * 0.02, a[1] + dep * 0.5, a[0] + r * 0.03, a[1] + r * 0.06); c.closePath();
        const g = c.createLinearGradient(m1[0] - r * 0.1, m1[1] - r * 0.12, m1[0] + r * 0.1, m1[1] + dep); g.addColorStop(0, '#74685F'); g.addColorStop(0.35, '#4A3E3A'); g.addColorStop(1, '#1C1514'); c.fillStyle = g; c.fill(); stroke(c, lw * 0.85);
        c.save(); c.clip(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = Math.max(0.8, lw * 0.5); for (let k = 0; k < 3; k++) { const yy = m1[1] + dep * (0.25 + k * 0.22); c.beginPath(); c.moveTo(a[0], yy); c.quadraticCurveTo(m1[0], yy - r * 0.05, b[0], yy + r * 0.02); c.stroke(); } c.fillStyle = 'rgba(200,190,180,.18)'; ell(c, m1[0] - r * 0.04, m1[1] + r * 0.02, r * 0.1, r * 0.04, -0.3); c.fill(); c.restore();
        c.strokeStyle = 'rgba(255,240,230,.28)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(a[0] + r * 0.05, a[1] + r * 0.04); c.quadraticCurveTo(m1[0] - r * 0.02, m1[1] - r * 0.09, b[0] - r * 0.05, b[1] + r * 0.03); c.stroke();
        c.beginPath(); c.moveTo(b[0] - r * 0.06, b[1] + dep); c.lineTo(a[0] + r * 0.04, a[1] + dep * 1.02); rim(c, lw * 0.7, 0.5 * hot); }
      // the head plate and its mouth
      const hx = r * 0.86, hy = r * 0.06 - lift * 0.8; c.beginPath(); c.moveTo(r * 0.58, -r * 0.35 - lift * 0.6); c.quadraticCurveTo(r * 1.02, -r * 0.3 - lift, r * 1.08, hy); c.quadraticCurveTo(r * 1.0, r * 0.3 - lift * 0.4, r * 0.62, r * 0.28); c.closePath(); c.fillStyle = shade(c, '#5A4E4C', r * 0.5, r * 0.7, -r * 0.2, 0.35); c.fill(); stroke(c, lw);
      const mo = md === 'spit' ? 1 : wind; c.beginPath(); c.moveTo(r * 0.72, hy + r * 0.04); c.quadraticCurveTo(r * 0.98, hy + r * 0.02 + mo * r * 0.1, r * 1.1, hy - r * 0.02); c.quadraticCurveTo(r * 0.98, hy + r * 0.14 + mo * r * 0.2, r * 0.74, hy + r * 0.1); c.closePath(); c.fillStyle = mo > 0.05 ? '#FFD27A' : '#2A1410'; c.fill(); stroke(c, lw * 0.7);
      if (mo > 0.05) addGlow(c, r * 1.0, hy + r * 0.05, r * (0.4 + 0.5 * mo), LAVA_HI, 0.35 + 0.55 * mo);
      // the eye stalks with ember tips
      for (const [dx, k] of [[0.62, 0.9], [0.78, 1]]) { const bx = r * dx, by = -r * 0.32 - lift * 0.7, tx = bx + r * 0.12 * k + cr * r * 0.03, ty = by - r * 0.36 * k; limb(c, bx, by, tx, ty, Math.max(1.5, r * 0.09), '#4A3E3C'); c.beginPath(); c.arc(tx, ty, r * 0.085, 0, TAU); c.fillStyle = '#FFB050'; c.fill(); stroke(c, lw * 0.6); addGlow(c, tx, ty, r * 0.25, LAVA_HI, 0.55 * hot); } },
    /* the basalt crawler: a low wide body; heavy overlapping basalt plates over its head and front, a molten abdomen
       behind them, six stony legs. 'wind' digs in and lowers the plates; 'ram' lunges; 'reel' the plates lift, glowing */
    basaltcrawler(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', run = Math.sin(ph * TAU * 2), wind = md === 'wind', ram = md === 'ram', reel = md === 'reel', fx = ram ? r * 0.18 : 0, dip = wind ? r * 0.08 : 0, lift = reel ? r * 0.16 : 0;
      c.fillStyle = 'rgba(8,4,4,.36)'; ell(c, 0, r * 0.6, r * 1.25, r * 0.26); c.fill();
      const leg = (x, sd, k, dark) => { const sw = run * k * r * 0.1, kx = x + r * 0.16 + sw, ky = r * 0.18 - (dark ? r * 0.04 : 0), fxx = x + r * 0.34 + sw * 1.6, fy = r * 0.58 - (dark ? r * 0.06 : 0); limb(c, x, r * 0.15, kx, ky - r * 0.12, Math.max(2, r * 0.13), dark ? '#2A2324' : '#4A4244'); limb(c, kx, ky - r * 0.12, fxx, fy, Math.max(1.6, r * 0.1), dark ? '#201A1B' : '#3A3234'); c.beginPath(); c.moveTo(fxx - r * 0.06, fy - r * 0.02); c.lineTo(fxx + r * 0.08, fy + r * 0.04); c.lineTo(fxx, fy - r * 0.08); c.closePath(); c.fillStyle = '#1A1415'; c.fill(); };
      for (const [x, k] of [[-0.45, 1], [0.05, -1], [0.5, 1]]) leg(x * r + fx, 1, k, true);
      // the molten abdomen (rear): soft, segmented, glowing
      c.save(); c.translate(-r * 0.45 + fx * 0.5, r * 0.08); const ab = reel ? 1 : 0.75 + 0.15 * Math.sin(ph * TAU);
      const abP = () => { c.beginPath(); c.moveTo(r * 0.3, -r * 0.42); c.bezierCurveTo(-r * 0.2, -r * 0.6, -r * 0.72, -r * 0.3, -r * 0.8, r * 0.04); c.bezierCurveTo(-r * 0.72, r * 0.36, -r * 0.2, r * 0.5, r * 0.3, r * 0.4); c.closePath(); };
      abP(); const g = c.createRadialGradient(-r * 0.2, -r * 0.06, r * 0.04, -r * 0.1, 0, r * 0.75); g.addColorStop(0, '#FFF2B8'); g.addColorStop(0.3, '#FFB444'); g.addColorStop(0.7, '#E8501A'); g.addColorStop(1, '#6A1806'); c.fillStyle = g; c.fill(); stroke(c, lw);
      // plates of crust over the molten flesh: the soft heat shows in the seams between them, brightest at the rear
      c.save(); abP(); c.clip();
        const cellsA = [[-0.62, -0.05], [-0.42, -0.3], [-0.38, 0.2], [-0.16, -0.38], [-0.12, 0.0], [-0.14, 0.32], [0.12, -0.3], [0.12, 0.12]];
        cellsA.forEach(([x, y], i) => { const R2 = rnd(31 + i * 17), pts = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3 + R2() * 0.3, rr = r * (0.15 + R2() * 0.05); pts.push([x * r + Math.cos(a) * rr * 1.1, y * r + Math.sin(a) * rr * 0.85]); }
          poly(c, pts); c.closePath(); const pg = c.createLinearGradient(x * r, y * r - r * 0.15, x * r, y * r + r * 0.15); pg.addColorStop(0, i < 3 ? '#5A3A2E' : '#4A3830'); pg.addColorStop(1, '#22140F'); c.fillStyle = pg; c.fill(); c.strokeStyle = 'rgba(255,190,110,.4)'; c.lineWidth = Math.max(0.8, r * 0.022); c.stroke(); });
      c.restore(); addGlow(c, -r * 0.15, 0, r * 0.95, LAVA, 0.35 * ab); c.restore();
      // the plates: back to front, chipped, lit from above
      const plate = (pts, hi) => { poly(c, pts); c.closePath(); let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } const pg = c.createLinearGradient(0, y0, 0, y1); pg.addColorStop(0, hi); pg.addColorStop(0.5, '#3E3638'); pg.addColorStop(1, '#1A1415'); c.fillStyle = pg; c.fill(); stroke(c, lw); c.strokeStyle = 'rgba(220,225,240,.3)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < Math.ceil(pts.length / 2); i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); };
      c.save(); c.translate(fx, dip - lift);
      if (reel) { c.beginPath(); c.moveTo(-r * 0.2, r * 0.18); c.lineTo(r * 0.9, r * 0.2); c.lineTo(r * 0.9, r * 0.32); c.lineTo(-r * 0.2, r * 0.3); c.closePath(); c.fillStyle = '#FF8A30'; c.fill(); addGlow(c, r * 0.35, r * 0.25, r * 0.6, LAVA, 0.5); }
      plate([[-r * 0.32, r * 0.22], [-r * 0.3, -r * 0.3], [-r * 0.05, -r * 0.66], [r * 0.38, -r * 0.74], [r * 0.62, -r * 0.5], [r * 0.6, r * 0.24]], '#6A6264');
      plate([[r * 0.05, r * 0.26], [r * 0.08, -r * 0.36], [r * 0.36, -r * 0.56], [r * 0.7, -r * 0.48], [r * 0.86, -r * 0.18], [r * 0.82, r * 0.28]], '#726A6C');
      plate([[r * 0.48, r * 0.36], [r * 0.5, -r * 0.18], [r * 0.74, -r * 0.34], [r * 1.02, -r * 0.2], [r * 1.12, r * 0.06], [r * 1.04, r * 0.34]], '#7A7274');
      // chips and a seam of glow under the edges
      c.fillStyle = 'rgba(0,0,0,.3)'; for (const [x, y] of [[0.2, -0.4], [0.5, -0.22], [0.8, 0.02], [-0.1, -0.1]]) { c.beginPath(); c.arc(x * r, y * r, r * 0.04, 0, TAU); c.fill(); }
      c.beginPath(); c.moveTo(-r * 0.3, r * 0.24); c.lineTo(r * 1.04, r * 0.36); rim(c, lw * 0.9, 0.55);
      // the mandibles under the front plate
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(r * 0.96, r * 0.3); c.quadraticCurveTo(r * 1.22, r * (0.3 + sd * 0.05), r * 1.2, r * (0.42 + sd * 0.08)); c.lineWidth = Math.max(1.5, r * 0.07); c.strokeStyle = LN; c.stroke(); }
      c.restore();
      for (const [x, k] of [[-0.3, -1], [0.2, 1], [0.66, -1]]) leg(x * r + fx, 1, k, false);
      if (ram) { c.strokeStyle = 'rgba(255,240,220,.5)'; c.lineWidth = lw; for (const y of [-0.3, 0, 0.25]) { c.beginPath(); c.moveTo(-r * 1.4, y * r); c.lineTo(-r * 0.9, y * r); c.stroke(); } } },
    /* the ember wisp: a coal with a bright slit in a shell of flame; 'charge' swells and brightens; 'spent' burns low,
       an ash crust round the coal */
    emberwisp(c, r, ph, o) { const md = o.mode || '', ch = md === 'charge', sp = md === 'spent', k = ch ? 1.3 : sp ? 0.55 : 1, fl = Math.sin(ph * TAU * 2), lw = lwOf(r);
      c.fillStyle = 'rgba(8,4,4,.22)'; ell(c, 0, r * 0.95, r * 0.55, r * 0.14); c.fill();
      const flame = (s, tip, col, a) => { c.globalAlpha = a; c.beginPath(); c.moveTo(0, r * 0.45 * s); c.bezierCurveTo(-r * 0.62 * s, r * 0.35 * s, -r * 0.6 * s, -r * 0.3 * s, -r * 0.1 * s + fl * r * 0.06, -tip); c.bezierCurveTo(r * 0.12 * s, -r * 0.5 * s, r * 0.6 * s, -r * 0.2 * s, r * 0.5 * s, r * 0.2 * s); c.quadraticCurveTo(r * 0.35 * s, r * 0.5 * s, 0, r * 0.45 * s); c.closePath(); c.fillStyle = col; c.fill(); c.globalAlpha = 1; };
      addGlow(c, 0, 0, r * 1.5 * k, LAVA, ch ? 0.7 : sp ? 0.2 : 0.45);
      c.save(); c.translate(0, -r * 0.05);
      flame(k, r * (1.05 + 0.15 * fl) * k, '#E8401A', sp ? 0.55 : 0.85); flame(k * 0.78, r * (0.85 + 0.12 * fl) * k, '#FF8A30', 0.95); flame(k * 0.55, r * (0.6 + 0.1 * fl) * k, '#FFD06A', 1); if (!sp) flame(k * 0.32, r * 0.38 * k, '#FFF6D8', 1);
      // the coal at its heart
      const coal = [[-r * 0.22, r * 0.16], [-r * 0.28, -r * 0.0], [-r * 0.16, -r * 0.14], [-r * 0.02, -r * 0.2], [r * 0.16, -r * 0.13], [r * 0.25, r * 0.02], [r * 0.18, r * 0.2], [r * 0.0, r * 0.26]]; poly(c, coal); c.closePath(); c.fillStyle = sp ? '#5A524F' : '#24160F'; c.fill(); stroke(c, lw * 0.7);
      c.save(); poly(c, coal); c.clip(); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(-r * 0.28, -r * 0.0); c.lineTo(-r * 0.02, -r * 0.2); c.lineTo(r * 0.02, -r * 0.08); c.lineTo(-r * 0.2, r * 0.02); c.closePath(); c.fill();
        c.strokeStyle = sp ? 'rgba(255,120,50,.45)' : '#FFC870'; c.lineWidth = Math.max(0.8, r * 0.035); c.beginPath(); c.moveTo(-r * 0.2, r * 0.1); c.lineTo(-r * 0.05, r * 0.02); c.lineTo(r * 0.02, r * 0.12); c.moveTo(-r * 0.05, r * 0.02); c.lineTo(r * 0.08, -r * 0.1); c.moveTo(r * 0.02, r * 0.12); c.lineTo(r * 0.18, r * 0.06); c.stroke(); c.restore();
      if (sp) { c.fillStyle = 'rgba(170,160,150,.6)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(Math.cos(i * 1.6) * r * 0.2, Math.sin(i * 1.6) * r * 0.16, r * 0.06, 0, TAU); c.fill(); } }
      c.restore();
      // sparks trailing off it
      for (let i = 0; i < 3; i++) { const u = (ph * 2 + i / 3) % 1; c.fillStyle = `rgba(255,${180 + i * 20},90,${(1 - u) * (sp ? 0.4 : 0.85)})`; c.beginPath(); c.arc(Math.sin(i * 2.1 + u * 3) * r * 0.3, r * 0.4 + u * r * 0.6, r * 0.05 * (1 - u) + 0.6, 0, TAU); c.fill(); }
      if (ch) { c.strokeStyle = 'rgba(255,230,160,.8)'; c.lineWidth = Math.max(1, r * 0.05); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + ph * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9 - r * 0.1); c.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15 - r * 0.1); c.stroke(); } } },
    /* the furnace imp: a squat soot-black body with a riveted furnace door for a belly (fire behind its grate), chimney
       nubs for ears, ember slits for eyes (no mouth). 'wind' cocks an ember back; 'throw' flings it; 'hop' tucks and leaps */
    furnaceimp(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', wind = md === 'wind', thr = md === 'throw', hop = md === 'hop', run = Math.sin(ph * TAU * 2), bob = Math.abs(run) * r * 0.05, tilt = hop ? -0.2 : wind ? -0.08 : thr ? 0.12 : 0;
      c.fillStyle = 'rgba(8,4,4,.34)'; ell(c, 0, r * 0.66, r * 0.75, r * 0.2); c.fill();
      // legs
      for (const sd of [-1, 1]) { const lx = sd * r * 0.28, ly = r * 0.25; const fy = hop ? r * 0.38 : r * 0.62, fxx = lx + (hop ? -r * 0.1 : run * sd * r * 0.12); limb(c, lx, ly, fxx, fy, Math.max(2, r * 0.17), '#2A2426'); c.fillStyle = '#16121A'; ell(c, fxx + r * 0.06, fy, r * 0.13, r * 0.07); c.fill(); }
      c.save(); c.translate(0, -bob - (hop ? r * 0.2 : 0)); c.rotate(tilt);
      // the far arm
      limb(c, -r * 0.4, -r * 0.1, -r * 0.66, r * 0.16, Math.max(2.5, r * 0.2), '#4A4042'); c.beginPath(); c.arc(-r * 0.68, r * 0.2, r * 0.13, 0, TAU); c.fillStyle = '#4A4042'; c.fill(); stroke(c, lw * 0.7);
      // body
      c.beginPath(); c.moveTo(-r * 0.55, r * 0.32); c.bezierCurveTo(-r * 0.72, -r * 0.2, -r * 0.5, -r * 0.82, 0, -r * 0.84); c.bezierCurveTo(r * 0.5, -r * 0.82, r * 0.74, -r * 0.2, r * 0.56, r * 0.32); c.quadraticCurveTo(0, r * 0.48, -r * 0.55, r * 0.32); c.closePath(); c.fillStyle = shade(c, '#4E4547', r * 0.8, -r * 0.2, -r * 0.4, 0.45); c.fill(); stroke(c, lw);
      c.save(); c.clip(); for (let i = 0; i < 9; i++) { c.fillStyle = i % 3 ? 'rgba(255,120,50,.55)' : 'rgba(255,220,150,.5)'; c.beginPath(); c.arc(Math.cos(i * 2.3) * r * 0.5, -r * 0.4 + Math.sin(i * 1.7) * r * 0.35, Math.max(0.6, r * 0.025), 0, TAU); c.fill(); } c.restore();
      c.beginPath(); c.moveTo(r * 0.55, r * 0.1); c.quadraticCurveTo(r * 0.5, r * 0.42, 0, r * 0.44); rim(c, lw * 0.9, 0.6);
      // ears: two stubby chimney nubs, smoke from one
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.22, -r * 0.74); c.lineTo(sd * r * 0.3, -r * 1.05); c.lineTo(sd * r * 0.44, -r * 1.02); c.lineTo(sd * r * 0.42, -r * 0.66); c.closePath(); c.fillStyle = '#2E282A'; c.fill(); stroke(c, lw * 0.8); c.fillStyle = '#FF9A3A'; ell(c, sd * r * 0.37, -r * 1.04, r * 0.06, r * 0.025); c.fill(); }
      c.fillStyle = 'rgba(90,80,80,.35)'; for (let i = 0; i < 3; i++) { const u = (ph + i / 3) % 1; c.beginPath(); c.arc(r * 0.4 + u * r * 0.2, -r * 1.1 - u * r * 0.5, r * (0.06 + u * 0.08), 0, TAU); c.fill(); }
      // ember slit eyes (no mouth)
      for (const ex of [0.12, 0.38]) { c.beginPath(); c.moveTo(r * (ex - 0.1), -r * 0.42); c.quadraticCurveTo(r * ex, -r * 0.5, r * (ex + 0.1), -r * 0.44); c.quadraticCurveTo(r * ex, -r * 0.38, r * (ex - 0.1), -r * 0.42); c.fillStyle = '#FFD27A'; c.fill(); addGlow(c, r * ex, -r * 0.44, r * 0.2, LAVA_HI, 0.5); }
      // the furnace door: a riveted iron plate with a grate and the fire behind it
      c.beginPath(); c.moveTo(-r * 0.3, r * 0.28); c.lineTo(-r * 0.32, -r * 0.12); c.quadraticCurveTo(r * 0.05, -r * 0.3, r * 0.4, -r * 0.12); c.lineTo(r * 0.38, r * 0.28); c.closePath(); c.fillStyle = '#4E4A52'; c.fill(); stroke(c, lw * 0.9);
      c.beginPath(); c.moveTo(-r * 0.2, r * 0.2); c.lineTo(-r * 0.2, -r * 0.06); c.quadraticCurveTo(r * 0.05, -r * 0.18, r * 0.3, -r * 0.06); c.lineTo(r * 0.28, r * 0.2); c.closePath(); c.fillStyle = lavaG(c, 0, -r * 0.18, 0, r * 0.2, 1); c.fill();
      c.strokeStyle = '#1E1C20'; c.lineWidth = Math.max(1.2, r * 0.05); for (let i = 0; i < 4; i++) { const xx = -r * 0.12 + i * r * 0.12; c.beginPath(); c.moveTo(xx, -r * 0.12); c.lineTo(xx, r * 0.2); c.stroke(); }
      for (const [x, y] of [[-0.26, 0.22], [0.33, 0.22], [-0.26, -0.06], [0.33, -0.06]]) { c.fillStyle = '#7A767E'; c.beginPath(); c.arc(x * r, y * r, Math.max(0.8, r * 0.03), 0, TAU); c.fill(); }
      addGlow(c, r * 0.05, r * 0.05, r * 0.55, LAVA, wind ? 0.6 : 0.4);
      // the near arm, with its ember
      const ax = wind ? -r * 0.15 : thr ? r * 0.95 : r * 0.62, ay = wind ? -r * 0.85 : thr ? -r * 0.35 : r * 0.12;
      limb(c, r * 0.42, -r * 0.08, ax, ay, Math.max(2.5, r * 0.21), '#6A5E5E'); c.strokeStyle = 'rgba(255,240,230,.3)'; c.lineWidth = Math.max(1, r * 0.05); c.beginPath(); c.moveTo(r * 0.42, -r * 0.12); c.lineTo(ax, ay - r * 0.05); c.stroke(); c.beginPath(); c.arc(ax, ay, r * 0.15, 0, TAU); c.fillStyle = shade(c, '#6A5E5E', r * 0.15, ax, ay, 0.4); c.fill(); stroke(c, lw * 0.7);
      if (wind || md === 'w2') { c.beginPath(); c.arc(ax, ay - r * 0.08, r * 0.17, 0, TAU); c.fillStyle = '#FFC24A'; c.fill(); stroke(c, lw * 0.7); addGlow(c, ax, ay - r * 0.08, r * 0.5, LAVA_HI, 0.8); }
      c.restore(); },
    /* the runic sentinel: a squat guardian of basalt and iron behind a tall rune-cut shield; its chest rune sleeps behind it.
       'wind' raises the shield; 'bash' thrusts it; 'open' swings it aside and the rune blazes */
    runicsentinel(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', open = md === 'open', wind = md === 'wind', bash = md === 'bash', step = Math.sin(ph * TAU * 2) * r * 0.05;
      c.fillStyle = 'rgba(8,4,4,.38)'; ell(c, 0, r * 0.62, r * 1.05, r * 0.24); c.fill();
      // legs
      for (const sd of [-1, 1]) { c.beginPath(); c.rect(sd * r * 0.26 - r * 0.16, r * 0.1 + (sd > 0 ? step : -step), r * 0.32, r * 0.48); c.fillStyle = '#2A2426'; c.fill(); stroke(c, lw); c.fillStyle = '#4A4244'; c.fillRect(sd * r * 0.26 - r * 0.2, r * 0.48 + (sd > 0 ? step : -step), r * 0.4, r * 0.12); }
      // the body: stacked basalt blocks bound in iron
      basalt(c, [[-r * 0.58, r * 0.2], [-r * 0.62, -r * 0.5], [-r * 0.3, -r * 0.78], [r * 0.32, -r * 0.8], [r * 0.6, -r * 0.5], [r * 0.56, r * 0.2]], lw, { hi: '#6A6062', mid: '#4A4244', lo: '#1E1819' });
      c.fillStyle = '#2C2A30'; c.fillRect(-r * 0.6, -r * 0.18, r * 1.18, r * 0.14); c.strokeStyle = LN; c.lineWidth = lw * 0.7; c.strokeRect(-r * 0.6, -r * 0.18, r * 1.18, r * 0.14);
      // the chest rune (bright when open)
      const rk = open ? 1 : 0.15; c.beginPath(); c.arc(r * 0.05, -r * 0.42, r * 0.2, 0, TAU); c.fillStyle = open ? '#2A1A0A' : '#241E20'; c.fill(); stroke(c, lw * 0.8); rune(c, r * 0.05, -r * 0.42, r * 0.28, 5, open ? '#FFE0A0' : 'rgba(255,179,71,.35)', Math.max(1.2, r * 0.06)); if (open) { addGlow(c, r * 0.05, -r * 0.42, r * 0.85, RUNE, 0.85); addGlow(c, r * 0.05, -r * 0.42, r * 0.35, '#FFFFFF', 0.5); }
      // the head: a stone block helm with a glowing slit
      basalt(c, [[-r * 0.24, -r * 0.76], [-r * 0.22, -r * 1.12], [r * 0.26, -r * 1.14], [r * 0.3, -r * 0.78]], lw, { hi: '#726A6C', mid: '#4E4648', lo: '#262022' });
      c.fillStyle = '#FFB347'; c.fillRect(-r * 0.04, -r * 0.98, r * 0.3, Math.max(1.5, r * 0.06)); addGlow(c, r * 0.11, -r * 0.96, r * 0.3, RUNE, 0.5);
      // the shield arm and shield
      c.save(); const sx = open ? -r * 0.55 : bash ? r * 0.98 : r * 0.72, sy = open ? r * 0.05 : wind ? -r * 0.55 : -r * 0.3, rot = open ? -0.9 : wind ? -0.12 : 0; c.translate(sx, sy); c.rotate(rot);
      const SW = r * 0.36, SH = r * 1.28; c.beginPath(); c.moveTo(-SW, -SH * 0.5); c.lineTo(SW, -SH * 0.56); c.lineTo(SW * 1.05, SH * 0.32); c.lineTo(0, SH * 0.55); c.lineTo(-SW * 1.05, SH * 0.36); c.closePath();
      const sg = c.createLinearGradient(-SW, 0, SW, 0); sg.addColorStop(0, '#2E2C32'); sg.addColorStop(0.4, '#5A5660'); sg.addColorStop(1, '#1C1A1E'); c.fillStyle = sg; c.fill(); stroke(c, lw * 1.1);
      c.strokeStyle = '#7A6040'; c.lineWidth = Math.max(1.2, r * 0.05); c.beginPath(); c.moveTo(-SW * 0.82, -SH * 0.42); c.lineTo(SW * 0.84, -SH * 0.47); c.lineTo(SW * 0.88, SH * 0.27); c.lineTo(0, SH * 0.45); c.lineTo(-SW * 0.86, SH * 0.3); c.closePath(); c.stroke();
      for (let i = 0; i < 3; i++) rune(c, 0, -SH * 0.26 + i * SH * 0.24, r * 0.24, i * 2 + 1, open ? 'rgba(255,179,71,.3)' : wind || bash ? '#FFC870' : 'rgba(255,179,71,.6)', Math.max(1, r * 0.05));
      for (const [x, y] of [[-0.8, -0.4], [0.8, -0.45], [-0.85, 0.25], [0.85, 0.22]]) rivet(c, x * SW, y * SH, Math.max(0.8, r * 0.04));
      c.beginPath(); c.moveTo(SW * 1.05, SH * 0.32); c.lineTo(0, SH * 0.55); rim(c, lw, 0.5); c.restore();
      if (bash) { c.strokeStyle = 'rgba(255,230,190,.55)'; c.lineWidth = lw; for (const y of [-0.6, -0.2, 0.2]) { c.beginPath(); c.moveTo(r * 1.3, y * r); c.lineTo(r * 1.55, y * r); c.stroke(); } } },
    /* the bomb larva: a riveted iron capsule with a rune band, a fuse stub, little vanes; in flight its vanes buzz and a
       heat-haze holds it up; grounded, its legs splay and the fuse sparks. 'g0'/'g1' safe, 'red'/'red2' about to burst */
    bomblarva(c, r, ph, o) { const lw = lwOf(r), md = o.mode || 'fly', fly = md === 'fly' || md === 'land', red = md === 'red' || md === 'red2', fl = md === 'red', ground = !fly, W = r * 0.74, H = r * 0.5;
      c.fillStyle = 'rgba(8,4,4,.3)'; ell(c, 0, r * 0.7, r * 0.8, r * 0.18); c.fill();
      // in flight: a heat haze under it and two buzzing vanes; grounded: four short iron legs splayed out
      if (fly) { addGlow(c, 0, r * 0.55, r * 0.6, LAVA, 0.35); for (const sd of [-1, 1]) { const a = Math.sin(ph * TAU * 4) * 0.5; c.save(); c.translate(sd * r * 0.15, -r * 0.42); c.rotate(sd * (0.5 + a) - Math.PI / 2 * 0); c.beginPath(); c.ellipse(sd * r * 0.32, -r * 0.08, r * 0.34, r * 0.1, sd * -0.4, 0, TAU); c.fillStyle = 'rgba(170,160,180,.45)'; c.fill(); c.strokeStyle = 'rgba(43,36,51,.6)'; c.lineWidth = lw * 0.6; c.stroke(); c.restore(); } }
      else for (const [x, k] of [[-0.5, -1], [-0.2, -1], [0.2, 1], [0.5, 1]]) limb(c, x * r, r * 0.25, x * r + k * r * 0.18, r * 0.62, Math.max(1.5, r * 0.09), '#3A3640');
      // the tail: a short cone with three fins
      c.beginPath(); c.moveTo(-W * 0.82, -H * 0.5); c.lineTo(-W * 1.28, -H * 0.18); c.lineTo(-W * 1.28, H * 0.22); c.lineTo(-W * 0.82, H * 0.55); c.closePath(); c.fillStyle = '#2E2C32'; c.fill(); stroke(c, lw * 0.8);
      for (const y of [-0.62, 0.66]) { c.beginPath(); c.moveTo(-W * 0.95, y * H * 0.7); c.lineTo(-W * 1.38, y * H * 1.35); c.lineTo(-W * 1.22, y * H * 0.55); c.closePath(); c.fillStyle = '#46424A'; c.fill(); stroke(c, lw * 0.6); }
      // the body: a riveted iron grub, three plated segments, heat-blued toward the belly
      c.beginPath(); c.ellipse(0, 0, W, H, 0, 0, TAU); const g = c.createRadialGradient(-W * 0.25, -H * 0.45, r * 0.05, 0, 0, W); g.addColorStop(0, '#8E8A94'); g.addColorStop(0.45, '#4E4A54'); g.addColorStop(1, '#18161C'); c.fillStyle = g; c.fill(); stroke(c, lw);
      c.save(); c.beginPath(); c.ellipse(0, 0, W, H, 0, 0, TAU); c.clip();
      for (const x of [-0.42, 0.06]) { c.strokeStyle = 'rgba(12,10,14,.7)'; c.lineWidth = Math.max(1.5, r * 0.06); c.beginPath(); c.ellipse(x * W, 0, W * 0.12, H * 1.05, 0, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = Math.max(0.8, r * 0.025); c.beginPath(); c.ellipse(x * W - r * 0.03, 0, W * 0.12, H * 1.02, 0, Math.PI * 0.6, Math.PI * 1.4); c.stroke(); }
      c.fillStyle = '#26242A'; c.fillRect(-W, -H * 0.12, W * 2, H * 0.3); for (let i = 0; i < 4; i++) rune(c, -W * 0.68 + i * W * 0.42, H * 0.03, r * 0.15, i + 2, red ? '#FFD0C0' : 'rgba(255,179,71,.85)', Math.max(0.8, r * 0.035));
      const hg = c.createLinearGradient(0, H * 0.25, 0, H); hg.addColorStop(0, 'rgba(120,70,150,0)'); hg.addColorStop(1, 'rgba(120,70,150,.4)'); c.fillStyle = hg; c.fillRect(-W, H * 0.2, W * 2, H);
      if (red) { c.fillStyle = fl ? 'rgba(255,60,80,.55)' : 'rgba(255,60,80,.2)'; c.fillRect(-W, -H, W * 2, H * 2); }
      c.restore();
      // the riveted nose cap
      c.beginPath(); c.ellipse(W * 0.78, 0, W * 0.26, H * 0.72, 0, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fillStyle = red ? (fl ? '#C83A44' : '#6A3438') : '#5E5A64'; c.fill(); stroke(c, lw * 0.8); for (const y of [-0.4, 0, 0.4]) rivet(c, W * 0.9, y * H, Math.max(0.7, r * 0.035));
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.ellipse(-W * 0.15, -H * 0.5, W * 0.4, H * 0.18, -0.15, Math.PI * 1.05, Math.PI * 1.9); c.stroke();
      c.beginPath(); c.ellipse(0, H * 0.12, W * 0.96, H * 0.9, 0, 0.2, Math.PI - 0.2); rim(c, lw * 0.8, 0.45);
      // the fuse stub on its back and its spark
      c.fillStyle = '#2A282E'; c.fillRect(-r * 0.08, -H - r * 0.14, r * 0.16, r * 0.18); c.strokeStyle = LN; c.lineWidth = lw * 0.7; c.strokeRect(-r * 0.08, -H - r * 0.14, r * 0.16, r * 0.18);
      c.strokeStyle = '#6E5A46'; c.lineWidth = Math.max(1.5, r * 0.07); c.beginPath(); c.moveTo(0, -H - r * 0.14); c.quadraticCurveTo(r * 0.12, -H - r * 0.3, r * 0.05, -H - r * 0.42); c.stroke();
      const sk = ground ? (red ? 1 : 0.7) : 0.35, fy = -H - r * 0.42; c.fillStyle = red ? '#FFFFFF' : '#FFE6A0'; c.beginPath(); c.arc(r * 0.05, fy, r * 0.07 * (0.8 + sk), 0, TAU); c.fill(); addGlow(c, r * 0.05, fy, r * 0.35 * (0.6 + sk), red ? '#FF6A5A' : LAVA_HI, 0.85);
      if (ground && !red) { c.strokeStyle = md === 'g1' ? 'rgba(143,224,166,.9)' : 'rgba(143,224,166,.5)'; c.lineWidth = Math.max(1.2, r * 0.07); c.beginPath(); c.ellipse(0, 0, W * 1.12, H * 1.25, 0, 0, TAU); c.stroke(); } },
    /* the ashen knight: charred iron and basalt plates round an ember; a ridged helm with a cross-slit of light (no face),
       a ragged ash-grey tabard, a heavy black-iron blade with a hot cracked edge. 'wind' raises it; 's1'/'s2' its two
       cuts; 'rest' leans on the planted blade */
    ashenknight(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', step = Math.sin(ph * TAU * 2), rest = md === 'rest', wind = md === 'wind' || md === 'w2', s1 = md === 's1', s2 = md === 's2', hunch = rest ? r * 0.12 : 0;
      c.fillStyle = 'rgba(8,4,4,.38)'; ell(c, 0, r * 0.66, r * 0.85, r * 0.22); c.fill();
      // legs (greaves)
      for (const sd of [-1, 1]) { const fx = sd * r * 0.2 + (s1 || s2 ? sd * r * 0.12 : step * sd * r * 0.08); limb(c, sd * r * 0.14, -r * 0.05 + hunch, fx, r * 0.6, Math.max(3, r * 0.2), sd < 0 ? '#2A2426' : '#3A3436'); c.fillStyle = '#1A1617'; ell(c, fx + r * 0.06, r * 0.62, r * 0.16, r * 0.07); c.fill(); }
      c.save(); c.translate(0, hunch); if (rest) c.rotate(0.12);
      // the tabard behind
      c.beginPath(); c.moveTo(-r * 0.32, -r * 0.3); c.lineTo(-r * 0.4, r * 0.32); c.lineTo(-r * 0.25, r * 0.22); c.lineTo(-r * 0.1, r * 0.38); c.lineTo(r * 0.06, r * 0.2); c.lineTo(r * 0.2, r * 0.34); c.lineTo(r * 0.3, -r * 0.3); c.closePath(); c.fillStyle = '#6E6662'; c.fill(); stroke(c, lw * 0.8);
      // the far arm (only when the blade is raised)
      // torso: a charred breastplate with basalt plates and an ember behind a seam
      c.beginPath(); c.moveTo(-r * 0.4, -r * 0.2); c.lineTo(-r * 0.44, -r * 0.82); c.quadraticCurveTo(0, -r * 1.02, r * 0.42, -r * 0.84); c.lineTo(r * 0.38, -r * 0.2); c.quadraticCurveTo(0, -r * 0.08, -r * 0.4, -r * 0.2); c.closePath(); c.fillStyle = shade(c, '#5A5052', r * 0.7, -r * 0.1, -r * 0.6, 0.4); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(0, -r * 0.92); c.lineTo(-r * 0.06, -r * 0.62); c.lineTo(r * 0.04, -r * 0.42); c.lineTo(-r * 0.02, -r * 0.2); c.strokeStyle = '#1A0E0A'; c.lineWidth = Math.max(2, r * 0.08); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#FF8A30'; c.lineWidth = Math.max(1, r * 0.04); c.stroke(); c.globalCompositeOperation = 'source-over'; addGlow(c, 0, -r * 0.6, r * 0.4, LAVA, 0.4);
      c.beginPath(); c.moveTo(-r * 0.4, -r * 0.24); c.quadraticCurveTo(0, -r * 0.12, r * 0.38, -r * 0.24); rim(c, lw * 0.8, 0.5);
      // pauldrons: rough basalt
      basalt(c, [[-r * 0.62, -r * 0.62], [-r * 0.58, -r * 0.92], [-r * 0.28, -r * 1.0], [-r * 0.2, -r * 0.7]], lw, { hi: '#6A6062', mid: '#433B3D', lo: '#1E1819' });
      basalt(c, [[r * 0.18, -r * 0.7], [r * 0.24, -r * 1.0], [r * 0.56, -r * 0.94], [r * 0.62, -r * 0.62]], lw, { hi: '#6A6062', mid: '#433B3D', lo: '#1E1819' });
      // the helm: a rounded ridge, a cross-slit of ember light
      c.beginPath(); c.moveTo(-r * 0.2, -r * 0.92); c.quadraticCurveTo(-r * 0.24, -r * 1.42, r * 0.04, -r * 1.46); c.quadraticCurveTo(r * 0.3, -r * 1.42, r * 0.26, -r * 0.92); c.closePath(); c.fillStyle = shade(c, '#5A5254', r * 0.35, -r * 0.05, -r * 1.3, 0.4); c.fill(); stroke(c, lw);
      c.strokeStyle = '#3A3234'; c.lineWidth = Math.max(2, r * 0.07); c.beginPath(); c.moveTo(r * 0.03, -r * 1.46); c.lineTo(r * 0.03, -r * 1.12); c.stroke();
      c.fillStyle = '#FFB050'; c.fillRect(-r * 0.04, -r * 1.2, r * 0.26, Math.max(1.4, r * 0.05)); c.fillRect(r * 0.08, -r * 1.3, Math.max(1.4, r * 0.05), r * 0.24); addGlow(c, r * 0.1, -r * 1.18, r * 0.32, LAVA_HI, rest ? 0.25 : 0.6);
      // the near arm and the blade
      const ang = wind ? -2.3 : s1 ? 0.35 : s2 ? -0.6 : rest ? 1.45 : 0.75, hx = r * 0.32 + Math.cos(ang - 0.5) * r * 0.18, hy = -r * 0.62 + Math.sin(ang - 0.5) * r * 0.25;
      limb(c, r * 0.3, -r * 0.74, hx, hy, Math.max(2.5, r * 0.16), '#3A3436');
      c.save(); c.translate(hx, hy); c.rotate(ang); const BL = r * 1.55, BW = r * 0.16;
      c.beginPath(); c.moveTo(-r * 0.12, -BW * 0.5); c.lineTo(BL * 0.82, -BW * 0.62); c.lineTo(BL, 0); c.lineTo(BL * 0.82, BW * 0.62); c.lineTo(-r * 0.12, BW * 0.5); c.closePath(); const bg = c.createLinearGradient(0, -BW, 0, BW); bg.addColorStop(0, '#5A565E'); bg.addColorStop(0.5, '#26242A'); bg.addColorStop(1, '#0E0C10'); c.fillStyle = bg; c.fill(); stroke(c, lw);
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = s1 || s2 || wind ? 'rgba(255,170,80,.95)' : 'rgba(255,120,50,.6)'; c.lineWidth = Math.max(1, r * 0.04); c.beginPath(); c.moveTo(r * 0.1, BW * 0.5); c.lineTo(BL * 0.5, BW * 0.56); c.lineTo(BL * 0.62, BW * 0.4); c.lineTo(BL * 0.82, BW * 0.6); c.stroke(); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#2A282E'; c.fillRect(-r * 0.14, -BW * 1.4, r * 0.1, BW * 2.8); c.strokeStyle = LN; c.lineWidth = lw * 0.7; c.strokeRect(-r * 0.14, -BW * 1.4, r * 0.1, BW * 2.8); c.restore();
      if (s1 || s2) { c.strokeStyle = 'rgba(255,200,140,.6)'; c.lineWidth = Math.max(2, r * 0.08); c.beginPath(); c.arc(r * 0.3, -r * 0.5, r * 1.45, s1 ? -1.6 : 0.6, s1 ? 0.5 : -1.2, s2); c.stroke(); }
      c.restore(); },
    /* the crystal wisp: a floating double point of black fire crystal, its fractures smouldering, three little shards
       circling it; its forward tip is the emitter. 'aim' blazes the tip and aligns the shards; 'beam' flashes; 'spent' sags */
    crystalwisp(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', aim = md === 'aim', bm = md === 'beam', sp = md === 'spent', bob = Math.sin(ph * TAU) * r * 0.08, tilt = sp ? 0.5 : aim || bm ? 0 : 0.18 * Math.sin(ph * TAU);
      c.fillStyle = 'rgba(8,4,8,.24)'; ell(c, 0, r * 0.95, r * 0.6, r * 0.14); c.fill();
      c.save(); c.translate(0, -r * 0.2 + bob); c.rotate(tilt);
      const orbit = (front) => { for (let i = 0; i < 3; i++) { const a = aim || bm ? i / 3 * TAU : ph * TAU + i / 3 * TAU, z = Math.sin(a); if ((z > 0) !== front) continue; const ox = aim || bm ? -r * 0.2 - i * r * 0.25 : Math.cos(a) * r * 0.95, oy = aim || bm ? (i - 1) * r * 0.42 : z * r * 0.32; c.save(); c.translate(ox, oy); c.rotate(a); poly(c, [[-r * 0.14, 0], [0, -r * 0.08], [r * 0.16, 0], [0, r * 0.08]]); c.closePath(); c.fillStyle = sp ? '#2A2628' : '#2E2040'; c.fill(); stroke(c, lw * 0.6); c.restore(); } };
      orbit(false);
      if (!sp) addGlow(c, 0, 0, r * 1.3, FRACTURE, aim ? 0.55 : 0.3);
      // the body: an elongated octahedron (a double point), four faces
      const L = r * 0.95, W = r * 0.42; const fc = sp ? ['#3A3638', '#1E1B1D', '#2A2628', '#0E0C0D'] : ['#4E3470', '#1A1024', '#2E1E42', '#08060C'];
      const F = [[[-L, 0], [0, -W], [0, 0]], [[0, -W], [L, 0], [0, 0]], [[-L, 0], [0, W], [0, 0]], [[0, W], [L, 0], [0, 0]]];
      F.forEach((f, i) => { poly(c, f); c.closePath(); c.fillStyle = fc[i]; c.fill(); });
      poly(c, [[-L, 0], [0, -W], [L, 0], [0, W]]); c.closePath(); stroke(c, lw);
      c.strokeStyle = 'rgba(230,210,255,.5)'; c.lineWidth = Math.max(0.8, lw * 0.6); c.beginPath(); c.moveTo(-L * 0.7, -W * 0.25); c.lineTo(-L * 0.1, -W * 0.85); c.stroke();
      if (!sp) { c.save(); poly(c, [[-L, 0], [0, -W], [L, 0], [0, W]]); c.closePath(); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = aim || bm ? '#FFC080' : FRACTURE; c.lineWidth = Math.max(1.2, r * 0.07); c.beginPath(); c.moveTo(-L * 0.8, W * 0.1); c.lineTo(-L * 0.3, -W * 0.25); c.lineTo(L * 0.1, W * 0.15); c.lineTo(L * 0.7, -W * 0.05); c.moveTo(-L * 0.3, -W * 0.25); c.lineTo(-L * 0.15, -W * 0.7); c.stroke(); c.restore(); }
      // the emitter tip
      const tk = bm ? 1.4 : aim ? 1 : sp ? 0 : 0.3; if (tk > 0) { addGlow(c, L, 0, r * (0.4 + 0.5 * tk), bm ? '#FFFFFF' : FRACTURE_HI, 0.6 + 0.3 * tk); c.fillStyle = '#FFF0D0'; c.beginPath(); c.arc(L, 0, r * 0.06 * (1 + tk), 0, TAU); c.fill(); }
      orbit(true);
      c.restore(); },
  });
  Object.assign(EXT, { cinderslug: 1.9, basaltcrawler: 1.9, emberwisp: 2.0, furnaceimp: 1.9, runicsentinel: 2.1, bomblarva: 1.9, ashenknight: 2.6, crystalwisp: 2.0 });
  Object.assign(NF, { cinderslug: 6, basaltcrawler: 6, emberwisp: 6, furnaceimp: 6, runicsentinel: 4, bomblarva: 6, ashenknight: 4, crystalwisp: 6 });

  /* ---- their behaviour ---- */
  const { mon, keepRange } = DunAI;
  const faceTo = (m, a) => { m.face = Math.cos(a) >= 0 ? 1 : -1; };
  const turnTo = (m, a, rate, dt) => { const d = angTo(m.hd == null ? a : m.hd, a), s = Math.sign(d) * Math.min(Math.abs(d), rate * dt); m.hd = (m.hd == null ? a : m.hd) + s; return Math.abs(d); };
  const say = (X, m, s, col, cd) => { if ((m.sayT || 0) > (X.g ? X.g.t : 0)) return; m.sayT = (X.g ? X.g.t : 0) + (cd || 3); X.text(m.x, m.y - m.r - 0.8, s, col || '#FFE37A', 13); };
  // which side a blow comes from: the pet's bearing against the monster's heading (front within about 70 degrees)
  const frontal = (m, X, cone) => { const me = X.me, a = Math.atan2(me.y - m.y, me.x - m.x); return Math.abs(angTo(m.hd == null ? (m.face > 0 ? 0 : Math.PI) : m.hd, a)) < (cone || 1.2); };
  Object.assign(mon, {
    /* the slug crawls in; within reach it rears for 1.0 s (a cone is shown), spits once down it, then cools 1.1 s */
    cinderslug(m, A, X) {
      if (m.wT > 0) { m.wT -= A.dt; const u = 1 - m.wT / 1.0; m.mode = 'w' + Math.max(1, Math.min(3, Math.ceil(u * 3))); faceTo(m, m.sa);
        if (m.wT <= 0) { m.mode = 'spit'; m.spits = (m.spits || 0) + 1; m.recT = 1.1; m.spitT = 0.25; const hit = X.inCone(m.x, m.y, m.sa, 3.4, 0.34) && !X.me.dodge; if (hit) X.hurtPet(m.dmg * 1.25, m);
          for (let i = 0; i < 16; i++) { const a = m.sa + (Math.random() - 0.5) * 0.66, v = 4 + Math.random() * 4; X.part({ kind: 'ember', x: m.x + Math.cos(m.sa) * 0.5, y: m.y - 0.1 + Math.sin(m.sa) * 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.45, max: 0.45, size: 5 + Math.random() * 5, color: Math.random() < 0.5 ? LAVA : LAVA_HI }); }
          snd(X, 'hiss', 0.3, 0.2, 1300); } return; }
      if (m.spitT > 0) { m.spitT -= A.dt; return; }
      if (m.recT > 0) { m.recT -= A.dt; m.mode = 'rest'; return; }
      m.mode = null; if (A.d > 2.0) A.steer(A.sp);
      if (m.cd <= 0 && A.d < 3.3 && A.los()) { m.wT = 1.0; m.sa = A.a; m.cd = 2.8 + Math.random() * 1.2; faceTo(m, A.a); X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 3.4, spread: 0.34, life: 1.0, max: 1.0, src: m }); snd(X, 'grumble'); }
    },
    /* the crawler turns slowly (its heading carries its plates); close and facing you it digs in 0.9 s (a lane is shown),
       rams 2.8 tiles, then reels 1.6 s turning slower still: walk round to the glowing back */
    basaltcrawler(m, A, X) { if (m.hd == null) m.hd = A.a; if (!m.guardFn) m.guardFn = crawlerGuard;
      if (m.wT > 0) { m.wT -= A.dt; m.mode = 'wind'; faceTo(m, m.hd); if (m.wT <= 0) { m.ramT = 0.42; m.ramHit = false; snd(X, 'stomp'); } return; }
      if (m.ramT > 0) { m.ramT -= A.dt; m.mode = 'ram'; const v = 6.6 * A.dt; X.moveEnt(m, Math.cos(m.hd) * v, Math.sin(m.hd) * v); faceTo(m, m.hd);
        if (!m.ramHit && Math.hypot(X.me.x - m.x, X.me.y - m.y) < m.r + X.me.r + 0.15 && !X.me.dodge) { m.ramHit = true; X.hurtPet(m.dmg * 1.4, m); X.push(m.hd, 1.4); }
        if (m.ramT <= 0) { m.reelT = 1.6; m.rams = (m.rams || 0) + 1; } m.atkCd = 0.5; return; }
      if (m.reelT > 0) { m.reelT -= A.dt; m.mode = 'reel'; turnTo(m, A.a, 0.55, A.dt); faceTo(m, m.hd); m.atkCd = 0.3; return; }
      m.mode = null;
      if (A.d > 4.5 || !A.los()) { A.steer(A.sp); m.hd = Math.atan2(m.y - (m.py == null ? m.y : m.py), m.x - (m.px == null ? m.x : m.px)) || m.hd; m.px = m.x; m.py = m.y; faceTo(m, m.hd); }
      else { const off = turnTo(m, A.a, 1.5, A.dt); if (A.d > 1.6 && off < 0.9) X.moveEnt(m, Math.cos(m.hd) * A.sp * A.dt, Math.sin(m.hd) * A.sp * A.dt); faceTo(m, m.hd); m.px = m.x; m.py = m.y;
        if (m.cd <= 0 && A.d < 3.0 && off < 0.4) { m.wT = 0.9; m.cd = 3.2 + Math.random(); X.warn({ shape: 'line', x: m.x, y: m.y, a: m.hd, len: 3.2, w: 1.2, life: 0.9 + 0.2, max: 0.9 + 0.2, src: m }); } }
    },
    /* the wisp keeps its distance; it swells 1.1 s (a line is shown), throws one slow fireball, then burns low 3.2 s */
    emberwisp(m, A, X) {
      if (m.wT > 0) { m.wT -= A.dt; m.mode = 'charge'; faceTo(m, A.a); if (m.wT <= 0) { m.mode = 'spent'; m.spentT = 3.2; m.shots = (m.shots || 0) + 1; X.eshot(m.x + Math.cos(m.fa) * 0.4, m.y - 0.3 + Math.sin(m.fa) * 0.3, m.fa, 4.2, { dmg: m.dmg * 1.3, color: LAVA, core: LAVA_HI, r: 0.3, style: 'fire', src: m, life: 3.2 }); snd(X, 'whoosh'); } return; }
      if (m.spentT > 0) { m.spentT -= A.dt; m.mode = 'spent'; if (A.d > 3) A.steer(A.sp * 0.25); m.z = Math.max(0, 0.2 + 0.05 * Math.sin(m.t * 2)); return; }
      m.mode = null; m.z = 0.45 + 0.12 * Math.sin(m.t * 2.3); keepRange(m, A, X, 3.2, 6.2); faceTo(m, A.a);
      if (m.cd <= 0 && A.d < 7.5 && A.los()) { m.wT = 1.1; m.fa = A.a; m.cd = 4.6 + Math.random(); X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: Math.min(9, A.d + 1.5), w: 0.8, life: 1.1, max: 1.1, src: m }); }
    },
    /* the imp closes to throwing range, winds back 0.7 s, lobs a slow ember at a shown circle (1.1 s in the air), then hops away 1.2 s */
    furnaceimp(m, A, X) {
      if (m.wT > 0) { m.wT -= A.dt; m.mode = 'wind'; faceTo(m, A.a); if (m.wT <= 0) { m.mode = 'throw'; m.thrT = 0.25; m.throws = (m.throws || 0) + 1; X.lob(m.x, m.y - 0.3, m.tx, m.ty, { r: 0.95, dur: 1.1, dmg: m.dmg * 1.2, src: m, kind: 'fire', color: LAVA, fire: 0.8 }); snd(X, 'whoosh'); } return; }
      if (m.thrT > 0) { m.thrT -= A.dt; if (m.thrT <= 0) m.retT = 1.2; return; }
      if (m.retT > 0) { m.retT -= A.dt; m.mode = 'hop'; X.moveEnt(m, -A.ux * A.sp * 1.5 * A.dt, -A.uy * A.sp * 1.5 * A.dt); m.z = Math.abs(Math.sin(m.retT * 6)) * 0.25; faceTo(m, A.a); return; }
      m.mode = null; m.z = 0; keepRange(m, A, X, 2.8, 5.0); faceTo(m, A.a);
      if (m.cd <= 0 && A.d < 6.5 && A.los()) { m.wT = 0.7; m.tx = X.me.x; m.ty = X.me.y; m.cd = 3.0 + Math.random(); snd(X, 'giggle'); }
    },
    /* the sentinel turns its shield to you and plods in; close, it raises the shield 1.1 s (a cone is shown), bashes, then
       swings the shield aside 2.6 s: its chest rune glows and blows land from any side */
    runicsentinel(m, A, X) { if (m.hd == null) m.hd = A.a; if (!m.guardFn) m.guardFn = sentinelGuard;
      if (m.wT > 0) { m.wT -= A.dt; m.mode = 'wind'; faceTo(m, m.hd); if (m.wT <= 0) { m.mode = 'bash'; m.bashT = 0.3; m.bashes = (m.bashes || 0) + 1; if (X.inCone(m.x, m.y, m.hd, 2.6, 0.75) && !X.me.dodge) { X.hurtPet(m.dmg * 1.3, m); X.push(m.hd, 1.6); } X.ring(m.x + Math.cos(m.hd) * 1.2, m.y + Math.sin(m.hd) * 1.2, 0.2, 1.3, 0.25, RUNE, 0.2); snd(X, 'thud'); } return; }
      if (m.bashT > 0) { m.bashT -= A.dt; if (m.bashT <= 0) { m.openT = 2.6; m.opens = (m.opens || 0) + 1; X.text(m.x, m.y - m.r - 1.0, 'Rune exposed!', RUNE, 14); snd(X, 'chime', 523, 0.4); } return; }
      if (m.openT > 0) { m.openT -= A.dt; m.mode = 'open'; m.atkCd = 0.3; return; }
      m.mode = null; const off = turnTo(m, A.a, 2.2, A.dt); faceTo(m, m.hd);
      if (A.d > 4.5 || !A.los()) A.steer(A.sp), faceTo(m, m.hd = A.a); else if (A.d > 1.7) X.moveEnt(m, Math.cos(m.hd) * A.sp * A.dt, Math.sin(m.hd) * A.sp * A.dt);
      if (m.cd <= 0 && A.d < 2.4 && off < 0.5) { m.wT = 1.1; m.cd = 2.4 + Math.random() * 0.8; X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.hd, len: 2.6, spread: 0.75, life: 1.1, max: 1.1, src: m }); }
    },
    /* the larva: see the bomb rules above (hover, land, safe, red, burst) */
    bomblarva(m, A, X) { if (!m.cal) larvaSetup(m, {}); larvaTick(m, A, X); },
    /* the knight closes in; it raises its blade 1.0 s (a cone), cuts, raises again 0.6 s (a new cone), cuts back, then
       leans on its sword 1.6 s */
    ashenknight(m, A, X) {
      if (m.combo) { const K = m.combo; K.t += A.dt;
        if (K.step === 0 && K.t >= 1.0) { K.step = 1; m.mode = 's1'; cut(m, X, K.a); }
        else if (K.step === 1 && K.t >= 1.25) { K.step = 2; m.mode = 'w2'; K.a = Math.atan2(X.me.y - m.y, X.me.x - m.x); faceTo(m, K.a); X.warn({ shape: 'cone', x: m.x, y: m.y, a: K.a, len: 2.5, spread: 0.85, life: 0.6, max: 0.6, src: m }); }
        else if (K.step === 2 && K.t >= 1.85) { K.step = 3; m.mode = 's2'; cut(m, X, K.a); }
        else if (K.step === 3 && K.t >= 2.1) { K.step = 4; m.mode = 'rest'; }
        else if (K.step === 4 && K.t >= 3.7) { m.combo = null; m.mode = null; m.cd = 1.8 + Math.random(); }
        if (K.step === 0) m.mode = 'wind'; m.atkCd = 0.3; return; }
      m.mode = null; if (A.d > 1.6) A.steer(A.sp); faceTo(m, A.a);
      if (m.cd <= 0 && A.d < 2.1) { m.combo = { t: 0, step: 0, a: A.a }; m.combos = (m.combos || 0) + 1; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 2.5, spread: 0.85, life: 1.0, max: 1.0, src: m }); snd(X, 'grumble'); }
    },
    /* the crystal wisp keeps its range; it marks one straight line for 1.5 s (locked when it starts), fires its beam down
       it, and hangs spent 2.4 s */
    crystalwisp(m, A, X) {
      if (m.wT > 0) { m.wT -= A.dt; m.mode = 'aim'; faceTo(m, m.ba); if (m.wT <= 0) { m.mode = 'beam'; m.beamT = 0.3; m.beams = (m.beams || 0) + 1; const len = 10; if (X.inLine(m.x, m.y, m.ba, len, 0.75) && !X.me.dodge) X.hurtPet(m.dmg * 1.4, m); X.beamFx(m.x + Math.cos(m.ba) * 0.4, m.y - 0.3, m.ba, len, FRACTURE); snd(X, 'crack'); } return; }
      if (m.beamT > 0) { m.beamT -= A.dt; if (m.beamT <= 0) m.spentT = 2.4; return; }
      if (m.spentT > 0) { m.spentT -= A.dt; m.mode = 'spent'; m.z = 0.2; return; }
      m.mode = null; m.z = 0.55 + 0.1 * Math.sin(m.t * 1.8); keepRange(m, A, X, 4.0, 7.0); faceTo(m, A.a);
      if (m.cd <= 0 && A.d < 9 && A.los()) { m.wT = 1.5; m.ba = A.a; m.cd = 4.2 + Math.random(); X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 10, w: 0.75, life: 1.5, max: 1.5, src: m, color: WARN }); snd(X, 'blip'); }
    },
  });
  function cut(m, X, a) { if (X.inCone(m.x, m.y, a, 2.5, 0.85) && !X.me.dodge) X.hurtPet(m.dmg * 1.15, m); X.moveEnt(m, Math.cos(a) * 0.35, Math.sin(a) * 0.35); if (X.slash) X.slash(m.x + Math.cos(a) * 1.1, m.y + Math.sin(a) * 1.1, a, 1.6, LAVA_HI); snd(X, 'whoosh'); }
  /* the plates and the shield */
  function crawlerGuard(m, o) { const X = CUR && CUR.X; if (!X) return 1; if (m.mode === 'reel') return 1; if (frontal(m, X, 1.15)) { if (!o.dot) say(X, m, 'Plates! Strike its glowing back', '#CFC6E0', 3.5); return 0.22; } return 1; }
  function sentinelGuard(m, o) { const X = CUR && CUR.X; if (!X) return 1; if (m.openT > 0) return 1; if (frontal(m, X, 1.25)) { if (!o.dot) say(X, m, 'Shielded: wait for its rune', '#CFC6E0', 3.5); return 0.21; } return 0.5; }
  /* ---- the bomb larva ---- */
  function larvaSetup(m, o) { const tut = !!o.tut; m.cal = { st: 'hover', t: 0, fuse: o.fuse || (tut ? 7 : 6), safe: o.safe || (tut ? 4.5 : 3), dmg: o.dmg || m.dmg * (tut ? 0.5 : 1.6), r: o.r || 1.6, tut, target: o.target || null, landT: 0, tx: m.x, ty: m.y, tickT: 0 };
    m.fuse = 1; m.guardFn = larvaGuard; m.noKb = true; }
  function larvaTick(m, A, X) { const L = m.cal, me = X.me, C = ctx(X); L.t += A.dt; m.fuse = 1; m.atkCd = 1;
    if (L.st === 'hover') { m.mode = 'fly'; m.z = 0.9 + Math.sin(m.t * 3) * 0.12; if (A.d > 2.6) A.steer(A.sp); faceTo(m, A.a);
      if ((L.t > 1.3 && A.d < 4.2) || L.t > 5) { const a = Math.atan2(m.y - me.y, m.x - me.x) + (Math.random() - 0.5) * 1.0, p = X.walkPoint(me.x + Math.cos(a) * 1.9, me.y + Math.sin(a) * 1.9, null); L.tx = p.x; L.ty = p.y; L.st = 'land'; L.landT = 0; L.z0 = m.z || 0.9; X.warn({ x: p.x, y: p.y, r: 0.8, life: 0.65, max: 0.65, color: '#FFE37A' }); } return; }
    if (L.st === 'land') { m.mode = 'land'; L.landT += A.dt; const u = Math.min(1, L.landT / (L.drop ? 0.7 : 0.6)); m.x += (L.tx - m.x) * Math.min(1, A.dt * 8); m.y += (L.ty - m.y) * Math.min(1, A.dt * 8); m.z = (L.z0 || 0.9) * (1 - u * u);
      if (u >= 1) { m.z = 0; m.x = L.tx; m.y = L.ty; L.st = 'safe'; L.t = 0; m.still = true; m.hp = m.maxhp = 1e6; X.ring(m.x, m.y, 0.2, 1.0, 0.25, '#B8B0A8', 0.15); snd(X, 'thud'); C.larvae.push(m); } return; }
    if (L.st === 'safe') { m.mode = Math.floor(L.t * 4) % 2 ? 'g1' : 'g0'; if (L.t >= L.safe) { L.st = 'red'; L.t = 0; snd(X, 'wrong'); } return; }
    if (L.st === 'red') { const left = L.fuse - L.safe - L.t; m.mode = Math.floor(L.t * (left < 1 ? 12 : 6)) % 2 ? 'red' : 'red2'; L.tickT -= A.dt; if (L.tickT <= 0) { L.tickT = left < 1 ? 0.18 : 0.4; snd(X, 'blip'); }
      if (left <= 0) { L.st = 'boom'; m.dead = true; X.boom(m.x, m.y, L.r, LAVA, LAVA_HI, { n: 20, shake: 6, smoke: 4 }); snd(X, 'crash'); if (!me.dead && !me.dodge && Math.hypot(me.x - m.x, me.y - m.y) < L.r + me.r * 0.5) X.hurtPet(L.dmg, m); } } }
  function larvaGuard(m, o) { const L = m.cal, C = CUR, X = C && C.X; if (!L || !X) return 1; o.noText = true;
    if (L.st === 'safe') { if (m.dead) return 0.5; m.dead = true; L.st = 'returned'; returnBomb(X, { x: m.x, y: m.y }, { target: L.target && !L.target.dead ? L.target : null, dmgK: L.tut ? 0.8 : 1 }); return 0.5; }
    if (L.st === 'red') { say(X, m, 'Too late: get clear!', WARN, 1.2); return 0.5; }
    if (L.st === 'land') return 0.5;
    o.noText = false; return 1; }
  Object.assign(CAL, { larvaSetup, crawlerGuard, sentinelGuard });


  /* ======================= the dungeons' own lands (v387) =======================
     Dungeon 1, The Cinder Galleries: the ashen land as it is.
     Dungeon 2, The Rimebound Forge (rimeforge): the foundry gone cold where the old frost wells leaked: the same iron and
       basalt under rime and hoarfrost, frozen coolant pools, cooled lava sealed under ice with its cracks still glowing
       beneath, frost crystals and wells as scenery, icicles on the chains, cold mist. Fire is still there, but the palette
       leans white-blue against the orange.
     Dungeon 3, The Glass Heart (glassheart): halls of black volcanic glass close to the heart: magma moving inside
       translucent obsidian, geodes split open, a forest of black fire crystals, rivers of brighter lava in their channels. */
  const PULSERS = {};
  const ICE = '#DDF3FF', ICE_D = '#8FC2E2', RIME = 'rgba(235,248,255,';
  /* ---- the rimebound forge ---- */
  GAP_EXT.rimelava = { base: '#E86A2A',
    paint(c, S, R) { crustTile(c, S, R, 30, 'ice'); for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(240,250,255,${0.25 + R() * 0.4})`; c.beginPath(); c.arc(R() * S, R() * S, 0.5 + R() * 0.7, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, W, H, t, P, bigGlow } = o; pat(pattern('rimelava', k), 0.94, W / 2 + t * 1.4, H / 2 + t * 0.7);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = lowFx() ? 0.12 : 0.14 + 0.06 * Math.sin(t * 1.1); pat(pattern('calderaflow', k), 0.97, W / 2 - t * 3, H / 2 + t * 2);
      if (!lowFx()) { c.globalAlpha = 0.08 + 0.03 * Math.sin(t * 0.5); bigGlow(c, P, '#BFE3FA', W * 0.3 - (o.wx * 0.03) % (W * 0.5), H * 0.1, W * 0.8); } c.restore(); } };
  // a light frost lies over everything: rime feathers along the plates' seams, hoarfrost specks, in drifts
  function rimeFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) { foundryFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE);
    const R = rnd(x * 4111 + y * 77213 + 5), frost = vnoise(x / 3.2, y / 3.2, 101);
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    // frozen coolant and ice-sealed lava come in sheets that break along the old column joints (whole cells of the lattice)
    const P = (vx, vy) => [X + (vx - x) * T, Y + (vy - y) * T];
    for (const cl of hexCellsAt(x, y)) { const pl = vnoise(cl.cx / 4.5 + 20, cl.cy / 4.5, 107), sl = vnoise(cl.cx / 3.5, cl.cy / 3.5 + 40, 109); if (pl < 0.71 && sl < 0.73) continue; const p = cl.V.map(v => P(v[0], v[1])), cx = (p[0][0] + p[3][0]) / 2, cy = (p[1][1] + p[4][1]) / 2;
      c.save(); poly(c, p); c.closePath(); c.clip();
      if (pl >= 0.71) { /* frozen coolant: glassy blue-white, cracked, a cold sheen */ const g = c.createLinearGradient(cx - T, cy - T, cx + T, cy + T); g.addColorStop(0, '#E4F5FF'); g.addColorStop(0.5, '#A6D2EE'); g.addColorStop(1, '#78B2DA'); c.fillStyle = g; c.fillRect(cx - T, cy - T, T * 2, T * 2);
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(0.8, T * 0.02); c.beginPath(); c.moveTo(cx - T * 0.3, cy - T * 0.2 + cl.h * T * 0.2); c.lineTo(cx + T * 0.05, cy); c.lineTo(cx + T * 0.32, cy + T * 0.25 - cl.h2 * T * 0.2); c.moveTo(cx + T * 0.05, cy); c.lineTo(cx, cy + T * 0.35); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(cx - T * 0.45, cy + T * 0.2); c.lineTo(cx - T * 0.32, cy + T * 0.2); c.lineTo(cx + T * 0.05, cy - T * 0.45); c.lineTo(cx - T * 0.08, cy - T * 0.45); c.closePath(); c.fill(); }
      else { /* cooled lava sealed under ice: its cracks still glowing beneath a milky crust */ c.fillStyle = '#2A1816'; c.fillRect(cx - T, cy - T, T * 2, T * 2); seam(c, [[cx - T * 0.45, cy - T * 0.1], [cx - T * 0.1, cy + T * 0.05], [cx + T * 0.15, cy - T * 0.15], [cx + T * 0.45, cy + T * 0.05]], Math.max(1, T * 0.035), 1); seam(c, [[cx - T * 0.1, cy + T * 0.05], [cx, cy + T * 0.4]], Math.max(0.8, T * 0.025), 0.8);
        c.fillStyle = 'rgba(200,232,250,.34)'; c.fillRect(cx - T, cy - T, T * 2, T * 2); c.fillStyle = 'rgba(255,255,255,.18)'; ell(c, cx - T * 0.12, cy - T * 0.18, T * 0.28, T * 0.07, -0.4); c.fill(); }
      c.restore(); poly(c, p); c.closePath(); c.strokeStyle = 'rgba(30,50,70,.55)'; c.lineWidth = Math.max(1, T * 0.035); c.stroke(); }
    if (frost > 0.45) { const a = Math.min(1, (frost - 0.45) * 2.2); for (let i = 0; i < 10; i++) { c.fillStyle = `${RIME}${(0.35 + R() * 0.4) * a})`; const s = Math.max(1, T * (0.012 + R() * 0.02)); c.fillRect(X + R() * T, Y + R() * T, s, s); }
      // feathers of rime growing in from the plate's edges
      c.strokeStyle = `${RIME}${0.55 * a})`; c.lineWidth = Math.max(0.7, T * 0.016); c.beginPath(); for (let i = 0; i < 4; i++) { const ex = R() < 0.5, px = ex ? X + (R() < 0.5 ? 0 : T) : X + T * R(), py = ex ? Y + T * R() : Y + (R() < 0.5 ? 0 : T), ix = ex ? (px === X ? 1 : -1) : 0, iy = ex ? 0 : (py === Y ? 1 : -1), L = T * (0.12 + R() * 0.14); c.moveTo(px, py); c.lineTo(px + ix * L + iy * L * 0.2, py + iy * L + ix * L * 0.2); for (const u of [0.4, 0.7]) { const bx = px + ix * L * u, by = py + iy * L * u; c.moveTo(bx, by); c.lineTo(bx + (ix + iy) * L * 0.3 + iy * L * 0.2, by + (iy + ix) * L * 0.3 - ix * L * 0.2); } } c.stroke();
      c.fillStyle = `${RIME}${0.12 * a})`; c.fillRect(X, Y, T, T); }
    c.restore(); }
  // the walls: iron-banded basalt rimed over, icicles hanging from the course above
  function rimeWall(c, X, Y, T, H, h, x, lw, B) { ironWall(c, X, Y, T, H, h, x, lw, B); c.fillStyle = `${RIME}.55)`; c.fillRect(X, Y, T + 0.5, Math.max(1.5, H * 0.08)); const n = 3 + (x % 2); for (let i = 0; i < n; i++) { const px = X + T * (i + 0.3 + hh(x, i, 3) * 0.4) / n, L = H * (0.18 + hh(x, i, 7) * 0.32); c.beginPath(); c.moveTo(px - T * 0.04, Y + H * 0.06); c.lineTo(px + T * 0.04, Y + H * 0.06); c.lineTo(px, Y + H * 0.06 + L); c.closePath(); const g = c.createLinearGradient(0, Y, 0, Y + L); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, 'rgba(160,210,240,.6)'); c.fillStyle = g; c.fill(); } }
  const icicles = (c, x0, x1, y, T, n, R, Lk) => { for (let i = 0; i < n; i++) { const px = lerp(x0, x1, (i + 0.5) / n) + (R() - 0.5) * T * 0.06, L = T * (0.12 + R() * 0.28) * (Lk || 1); c.beginPath(); c.moveTo(px - T * 0.035, y); c.lineTo(px + T * 0.035, y); c.lineTo(px, y + L); c.closePath(); const g = c.createLinearGradient(0, y, 0, y + L); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, 'rgba(150,205,240,.65)'); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(43,36,51,.4)'; c.lineWidth = 0.8; c.stroke(); } };
  const snowCap = (c, pts, lw) => { poly(c, pts); c.fillStyle = '#F2FAFF'; c.fill(); c.strokeStyle = 'rgba(43,36,51,.5)'; c.lineWidth = lw * 0.6; c.stroke(); };
  /* frost crystals on a rimed basalt foot */
  function frostcluster(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.95, 0.3); basalt(c, [[-T * 0.95, T * 0.05], [-T * 0.8, -T * 0.25], [-T * 0.2, -T * 0.32], [T * 0.5, -T * 0.28], [T * 0.95, -T * 0.1], [T * 0.9, T * 0.08]], lw);
    snowCap(c, [[-T * 0.82, -T * 0.22], [-T * 0.2, -T * 0.34], [T * 0.5, -T * 0.3], [T * 0.9, -T * 0.12], [T * 0.6, -T * 0.16], [0, -T * 0.2]], lw);
    frostCrystal(c, -T * 0.1, -T * 0.2, T * (1.9 + (v % 3) * 0.25), { v, k: 0.25, lw }); if (v % 2) frostCrystal(c, T * 0.62, -T * 0.12, T * 0.9, { v: v + 1, k: 0.2, lw }); }
  GLOWS.frostcluster = v => [[-0.1, -1.1, 1.1, 'frost']];
  /* broken chains, iced: rime on the links, icicles hanging off them */
  function icechains(c, T, v) { PROPS.chains(c, T, v); const R = rnd(9 + v), set = v % 2 ? [[-0.4, 3.0], [0.35, 4.2]] : [[0, 3.6], [0.55, 2.4], [-0.5, 4.6]];
    for (const [dx, len] of set) { const ey = -T * 6 + Math.floor(len / 0.3) * T * 0.3; c.fillStyle = `${RIME}.75)`; for (let i = 3; i < Math.floor(len / 0.3); i += 2) { ell(c, dx * T - T * 0.06, -T * 6 + i * T * 0.3 - T * 0.12, T * 0.05, T * 0.06); c.fill(); } icicles(c, dx * T - T * 0.12, dx * T + T * 0.12, ey + T * 0.18, T, 2, R, 1.4); } }
  /* a pressure vessel coated in rime, icicles off its bands */
  function rimevessel(c, T, v) { PROPS.vessel(c, T, v); const R = rnd(13 + v), w = T * 0.85, H = T * 2.9;
    c.beginPath(); c.moveTo(-w, -H + w * 0.3); c.quadraticCurveTo(-w, -H - w * 0.55, 0, -H - w * 0.55); c.quadraticCurveTo(w, -H - w * 0.55, w, -H + w * 0.3); c.quadraticCurveTo(0, -H - w * 0.05, -w, -H + w * 0.3); c.closePath(); c.fillStyle = '#F2FAFF'; c.fill(); c.strokeStyle = 'rgba(43,36,51,.5)'; c.lineWidth = lw0(T) * 0.6; c.stroke();
    c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, 'rgba(230,246,255,.35)'); g.addColorStop(0.5, 'rgba(230,246,255,.05)'); g.addColorStop(1, 'rgba(230,246,255,.25)'); c.fillStyle = g; c.fillRect(-w * 1.2, -H - w, w * 2.4, H + w); c.restore();
    for (const yy of [0.75, 1.65, 2.45]) icicles(c, -w, w, -yy * T + T * 0.09, T, 5, R, 0.8); }
  GLOWS.rimevessel = GLOWS.vessel;
  /* a lavafall caught in ice: the molten stream still glows inside a sheath of milky ice */
  function icefall(c, T, v) { PROPS.lavafall(c, T, v); const H = T * (6 + (v % 3) * 0.6), sx = (v % 2 ? -1 : 1) * T * 0.04, R = rnd(5 + v);
    c.save(); c.beginPath(); c.moveTo(sx - T * 0.45, -H * 0.97); c.bezierCurveTo(sx - T * 0.6, -H * 0.5, sx - T * 0.85, -H * 0.3, sx - T * 0.95, -T * 0.2); c.lineTo(sx + T * 0.95, -T * 0.2); c.bezierCurveTo(sx + T * 0.85, -H * 0.3, sx + T * 0.6, -H * 0.5, sx + T * 0.45, -H * 0.97); c.closePath();
    const g = c.createLinearGradient(sx - T, 0, sx + T, 0); g.addColorStop(0, 'rgba(200,232,250,.8)'); g.addColorStop(0.3, 'rgba(220,243,255,.42)'); g.addColorStop(0.5, 'rgba(235,248,255,.28)'); g.addColorStop(0.7, 'rgba(220,243,255,.42)'); g.addColorStop(1, 'rgba(170,215,240,.8)'); c.fillStyle = g; c.fill(); ink(c, lw0(T) * 0.8);
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(sx - T * 0.38, -H * 0.9); c.bezierCurveTo(sx - T * 0.5, -H * 0.5, sx - T * 0.7, -H * 0.3, sx - T * 0.78, -T * 0.3); c.stroke(); c.restore();
    ell(c, sx, -T * 0.18, T * 1.3, T * 0.42); c.fillStyle = 'rgba(210,238,252,.55)'; c.fill(); icicles(c, sx - T * 1.2, sx + T * 1.2, -H * 0.62, T, 4, R, 1.2); }
  GLOWS.icefall = v => [[(v % 2 ? -1 : 1) * 0.04, -0.3, 1.1, 'lava'], [0, -2.2, 1.2, 'frost']];
  /* ---- the glass heart ---- */
  GAP_EXT.heartlava = { base: '#FF7A2A',
    paint(c, S, R) { crustTile(c, S, R, 22, 'river'); },
    back(c, o) { const { pat, pattern, k, W, H, t, P, bigGlow } = o; pat(pattern('heartlava', k), 0.94, W / 2 + t * 4.5, H / 2 + t * 2.2);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = lowFx() ? 0.25 : 0.3 + 0.12 * Math.sin(t * 1.6); pat(pattern('calderaflow', k), 0.97, W / 2 - t * 8, H / 2 + t * 4);
      if (!lowFx()) { c.globalAlpha = 0.12 + 0.05 * Math.sin(t * 0.8); bigGlow(c, P, '#FF5A2A', W * 0.1 - (o.wx * 0.04) % (W * 0.5), H * 0.15, W * 0.8); } c.restore(); } };
  // black glass everywhere: columns of obsidian, some translucent enough to show the magma moving beneath, crystal veins
  function glassFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) { const R = rnd(x * 3001 + y * 70001 + 79);
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); unTile(c, X, Y, T, h2); grain(c, X, Y, T, R, 5, 0.12);
    hexFloor(c, X, Y, T, x, y, { seam: 0.025, joint: 'rgba(2,1,4,.75)', lip: 'rgba(200,180,255,.1)',
      tone: cl => { cl.mag = vnoise(cl.cx / 3, cl.cy / 3, 121); cl.dim = vnoise(cl.cx / 5, cl.cy / 5, 127); return cl.mag > 0.6 ? '#1A0C0C' : cl.dim > 0.55 ? '#0C0A10' : '#16121A'; },
      inner(c2, cl, p, T2) { const cx = (p[0][0] + p[3][0]) / 2, cy = (p[1][1] + p[4][1]) / 2; c2.save(); poly(c2, p); c2.closePath(); c2.clip();
        if (cl.mag > 0.6) { /* magma beneath the glass: a dull red glow under a dark translucent skin, a bright vein in it */ const a = Math.min(1, (cl.mag - 0.6) * 4); const g = c2.createRadialGradient(cx + T2 * 0.1, cy + T2 * 0.1, 0, cx, cy, T2 * 0.75); g.addColorStop(0, `rgba(255,120,40,${0.55 * a})`); g.addColorStop(0.5, `rgba(200,50,20,${0.35 * a})`); g.addColorStop(1, 'rgba(60,10,8,0)'); c2.fillStyle = g; c2.fillRect(cx - T2, cy - T2, T2 * 2, T2 * 2);
          c2.strokeStyle = `rgba(255,170,90,${0.4 * a})`; c2.lineWidth = Math.max(0.8, T2 * 0.025); c2.beginPath(); c2.moveTo(cx - T2 * 0.3, cy + T2 * 0.1); c2.quadraticCurveTo(cx, cy - T2 * 0.15 + cl.h * T2 * 0.2, cx + T2 * 0.3, cy + T2 * 0.05); c2.stroke(); }
        const u = 0.35 + 0.3 * vnoise(cl.cx / 6, cl.cy / 6, 63), sg = c2.createLinearGradient(cx - T2 * 0.6, cy + T2 * 0.6, cx + T2 * 0.6, cy - T2 * 0.6); sg.addColorStop(Math.max(0, u - 0.2), 'rgba(190,165,245,0)'); sg.addColorStop(u, 'rgba(200,180,250,.16)'); sg.addColorStop(Math.min(1, u + 0.03), 'rgba(255,255,255,.08)'); sg.addColorStop(Math.min(1, u + 0.2), 'rgba(190,165,245,0)'); c2.fillStyle = sg; c2.fillRect(cx - T2, cy - T2, T2 * 2, T2 * 2);
        c2.restore(); } });
    const vein = vnoise(x / 2.2 + 3, y / 2.2, 131); if (vein > 0.7) { const cells = hexCellsAt(x, y); for (const cl of cells) { if (hh(cl.q, cl.r, 71) > 0.6) continue; const V = cl.V, k = Math.floor(cl.h * 6), A = V[k], B = V[(k + 1) % 6], a = [X + (A[0] - x) * T, Y + (A[1] - y) * T], b = [X + (B[0] - x) * T, Y + (B[1] - y) * T]; c.save(); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(140,60,200,.4)'; c.lineWidth = Math.max(2, T * 0.08); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = 'rgba(255,90,42,.9)'; c.lineWidth = Math.max(0.8, T * 0.025); c.stroke(); c.restore(); } }
    edgeGlow(c, X, Y, T, gN, gS, gW, gE, 0.4);
    c.restore(); }
  // the walls: translucent obsidian, magma pockets moving inside it, a violet sheen down its facets
  function glassWall(c, X, Y, T, H, h, x, lw, B) { const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, '#1E1824'); g.addColorStop(0.4, '#120E16'); g.addColorStop(1, '#06040A'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    if (hh(x, 1, 21) < 0.55) { const px = X + T * (0.2 + hh(x, 2, 23) * 0.6), py = Y + H * (0.35 + hh(x, 3, 29) * 0.4), r = T * (0.2 + hh(x, 4, 31) * 0.25); const mg = c.createRadialGradient(px, py, 0, px, py, r); mg.addColorStop(0, 'rgba(255,140,50,.7)'); mg.addColorStop(0.5, 'rgba(210,60,20,.4)'); mg.addColorStop(1, 'rgba(80,10,10,0)'); c.fillStyle = mg; c.fillRect(px - r, py - r, r * 2, r * 2); }
    const w = T / 3; for (let i = 0; i < 3; i++) { c.fillStyle = ['rgba(180,150,240,.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.3)'][i]; c.fillRect(X + i * w, Y, w, H); }
    c.strokeStyle = 'rgba(230,215,255,.28)'; c.lineWidth = Math.max(0.8, T * 0.02); c.beginPath(); c.moveTo(X + T * 0.12, Y + H * 0.1); c.lineTo(X + T * 0.2, Y + H * 0.9); c.stroke(); }
  /* a forest of black fire crystals: several clusters, tall ones at the back */
  function crystalforest(c, T, v) { const lw = lw0(T); shadowEll(c, T, 1.7, 0.4); const R = rnd(41 + v);
    const set = [[-0.9, -0.12, 3.4], [0.6, -0.1, 4.2], [-0.1, -0.05, 2.6], [1.25, 0.05, 1.9], [-1.4, 0.06, 1.6], [0.25, 0.12, 1.5]]; for (const [dx, dy, s] of set) crystalArt(c, dx * T, dy * T, T * s * (0.9 + R() * 0.2), { v: Math.floor(R() * 4), ph: R(), k: 0.35 + R() * 0.2, lw }); }
  GLOWS.crystalforest = v => [[0.6, -2.0, 1.6, 'cry'], [-0.9, -1.6, 1.3, 'cry'], [-0.1, -1.0, 1.0, 'cry']];
  /* a geode split open: a rough basalt shell, a ring of violet crystal teeth inside, a molten heart */
  function geode(c, T, v) { const lw = lw0(T), R = rnd(51 + v), cx = 0, cy = -T * 0.75, rx = T * 1.1, ry = T * 0.85; shadowEll(c, T, 1.2, 0.4);
    const outer = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, k = 1 + (R() - 0.5) * 0.12; outer.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } basalt(c, outer, lw, { hi: '#5E5658', mid: '#3A3234', lo: '#141012' });
    // the cut face, the band of agate rings, the crystal teeth
    ell(c, cx + T * 0.04, cy - T * 0.02, rx * 0.8, ry * 0.76); c.fillStyle = '#2A1E34'; c.fill(); ink(c, lw * 0.8);
    for (let i = 0; i < 3; i++) { ell(c, cx + T * 0.04, cy - T * 0.02, rx * (0.78 - i * 0.07), ry * (0.74 - i * 0.07)); c.strokeStyle = ['#6E4E8E', '#3E2A52', '#8A68B0'][i]; c.lineWidth = Math.max(1, T * 0.04); c.stroke(); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + R() * 0.2, r0 = 0.56, px = cx + Math.cos(a) * rx * r0, py = cy + Math.sin(a) * ry * r0, tx = cx + Math.cos(a) * rx * 0.3, ty = cy + Math.sin(a) * ry * 0.3; poly(c, [[px - Math.sin(a) * T * 0.08, py + Math.cos(a) * T * 0.08], [lerp(px, tx, 0.6 + R() * 0.3), lerp(py, ty, 0.6 + R() * 0.3)], [px + Math.sin(a) * T * 0.08, py - Math.cos(a) * T * 0.08]]); c.closePath(); c.fillStyle = i % 2 ? '#5A3C80' : '#7E5CA8'; c.fill(); c.strokeStyle = 'rgba(20,10,30,.6)'; c.lineWidth = 0.8; c.stroke(); }
    ell(c, cx + T * 0.04, cy, rx * 0.26, ry * 0.24); const mg = c.createRadialGradient(cx, cy - T * 0.05, 0, cx, cy, rx * 0.28); mg.addColorStop(0, '#FFF0B0'); mg.addColorStop(0.5, '#FF8A30'); mg.addColorStop(1, '#8A2008'); c.fillStyle = mg; c.fill(); ink(c, lw * 0.7); }
  GLOWS.geode = v => [[0.04, -0.75, 0.9, 'lava']];
  /* a monolith of translucent obsidian: magma swirling slowly inside the glass */
  function magmaglass(c, T, v) { const lw = lw0(T), H = T * (3.6 + (v % 2) * 0.6), W = T * 0.8; shadowEll(c, T, 0.9, 0.4);
    const pts = [[-W, 0], [-W * 1.05, -H * 0.55], [-W * 0.6, -H], [W * 0.5, -H * 0.94], [W, -H * 0.5], [W * 0.92, 0]]; poly(c, pts); c.closePath(); const g = c.createLinearGradient(-W, 0, W, 0); g.addColorStop(0, '#2A2236'); g.addColorStop(0.45, '#120E18'); g.addColorStop(1, '#06040A'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); for (let i = 0; i < 4; i++) { const py = -H * (0.2 + i * 0.2), px = Math.sin(i * 1.9 + v) * W * 0.35, r = T * (0.35 + (i % 2) * 0.15); const mg = c.createRadialGradient(px, py, 0, px, py, r); mg.addColorStop(0, 'rgba(255,150,60,.65)'); mg.addColorStop(0.5, 'rgba(220,60,20,.35)'); mg.addColorStop(1, 'rgba(90,10,10,0)'); c.fillStyle = mg; c.fillRect(px - r, py - r, r * 2, r * 2); }
      c.strokeStyle = 'rgba(255,160,80,.35)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(-W * 0.4, -H * 0.1); c.bezierCurveTo(W * 0.5, -H * 0.3, -W * 0.5, -H * 0.55, W * 0.3, -H * 0.85); c.stroke();
      c.fillStyle = 'rgba(200,180,250,.14)'; c.beginPath(); c.moveTo(-W * 0.9, -H * 0.5); c.lineTo(-W * 0.55, -H * 0.95); c.lineTo(-W * 0.35, -H * 0.9); c.lineTo(-W * 0.7, -H * 0.4); c.closePath(); c.fill(); c.restore();
    poly(c, pts); c.closePath(); ink(c, lw); c.strokeStyle = 'rgba(230,215,255,.55)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(-W * 0.95, -H * 0.5); c.lineTo(-W * 0.58, -H * 0.97); c.stroke(); }
  GLOWS.magmaglass = v => [[0, -(3.6 + (v % 2) * 0.6) * 0.5, 1.2, 'lava']];
  Object.assign(PROP_EXT, { frostcluster: [2.8, 3.4], icechains: [2.8, 6.6], rimevessel: [2.6, 4.2], icefall: [4.8, 8.0], crystalforest: [5.6, 6.2], geode: [3.0, 2.6], magmaglass: [2.4, 5.0] });
  Object.assign(PROPS, { frostcluster, icechains, rimevessel, icefall, crystalforest, geode, magmaglass });
  // (these two cast the crystals' pulses toward the heart as well)
  BIOMES.rimeforge = land({ name: 'The Rimebound Forge', dark: 0.14, bg: '#101820', accent: ICE, light: '#BFE3FA', bridgeCol: IRON_HI, deco: FROST, bridgeFn: grateBridge, wallFn: rimeWall, gap: 'rimelava', ambient: 'snow',
    floor: ['#3E3E46', '#40404A', '#3C3C44'], grout: '#1C1C22', hi: '#646672', top: '#2E3038', face: '#2C2E36', faceD: '#14161C', cliff: '#2C2C34', grade: 'rgba(150,200,240,.06)', fog: '#101820', darkRGB: '10,16,24',
    props: ['frostcluster', 'frostwell', 'anvil', 'frostcluster'], floorFn: rimeFloor });
  BIOMES.glassheart = land({ name: 'The Glass Heart', dark: 0.22, bg: '#120406', accent: FRACTURE_HI, light: FRACTURE, bridgeCol: BASALT_HI, deco: FRACTURE, wallFn: glassWall, gap: 'heartlava',
    floor: ['#17131B', '#18141C', '#16121A'], grout: '#08060A', hi: '#3A3044', top: '#16121A', face: '#140F18', faceD: '#06040A', cliff: '#1A1420', grade: 'rgba(170,60,140,.06)', fog: '#120406', darkRGB: '18,4,6',
    props: ['geode', 'blackcrystal', 'glassspire', 'geode'], floorFn: glassFloor });
  const RIMS = { ashen: { tall: ['basaltcol', 'lavafall', 'blackcrystal', 'basaltcol', 'bigcrystal'], short: ['ashmound', 'glassspire', 'blackcrystal', 'frostwell'] },
    rimeforge: { tall: ['icefall', 'icechains', 'rimevessel', 'frostcluster', 'icechains'], short: ['frostcluster', 'frostwell', 'anvil', 'frostcluster'] },
    glassheart: { tall: ['crystalforest', 'magmaglass', 'lavafall', 'bigcrystal', 'magmaglass'], short: ['geode', 'glassspire', 'blackcrystal', 'geode'] } };
  function calDress({ rm, i, G, RM, props, R, MW, walk, okFeature, first, id }) {
    const L = RIMS[rm.biome]; if (!L) return; const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 20) return; const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && [1, -1, MW, -MW].some(d => !walk(k + d) && !props.has(k + d)); });
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]]; for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } } return seen.size >= open.length; };
    const northOpen = k => !walk(k - MW) && !walk(k - 2 * MW) && !walk(k - MW - 1) && !walk(k - MW + 1);
    let want = Math.max(2, Math.round(rim.length * (first ? 0.08 : 0.12))), tries = 0; const placed = [];
    while (want > 0 && rim.length && tries++ < 200) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1); const x = k % MW, y = (k / MW) | 0, tall = northOpen(k);
      if (placed.some(([px, py, pt]) => Math.abs(px - x) + Math.abs(py - y) < (tall && pt ? 5 : 3))) continue;
      if (!tall && R() < 0.4) continue;
      const was = G[k]; G[k] = T_SOLID; if (!connected()) { G[k] = was; continue; } const list = tall ? L.tall : L.short; props.set(k, list[Math.floor(R() * list.length)]); placed.push([x, y, tall]); want--; } }
  BIOME_ORDER.push('rimeforge', 'glassheart'); DARK_COL.rimeforge = '10,16,24'; DARK_COL.glassheart = '18,4,6';
  ROOM_SHAPES.rimeforge = ['rect', 'oval', 'rect', 'islands']; ROOM_SHAPES.glassheart = ['cave', 'oval', 'islands', 'oval']; BOSS_ARENA.rimeforge = BOSS_ARENA.glassheart = 'oval';
  if (typeof DECALS !== 'undefined') { DECALS.rimeforge = [['calslag', 0.03], ['calsoot', 0.03], ['calash', 0.03]]; DECALS.glassheart = [['calvein', 0.06], ['calglass', 0.05], ['calcoal', 0.02]]; }
  Object.assign(PULSERS, { crystalforest: 1.6, magmaglass: 0.8 });
  BIOMES.rimeforge.dress = BIOMES.glassheart.dress = BIOMES.ashen.dress = calDress; BIOMES.ashen.props = ['blackcrystal', 'ashmound', 'glassspire', 'blackcrystal'];
  Object.assign(CAL, { rimeFloor, glassFloor, rimeWall, glassWall });

  /* ======================= three more of the brood, for the dungeons =======================
     rimewisp   (the Rimebound Forge) an ember wisp caught in the leaking cold: a white-blue shell of frost-fire round a
                still-red coal. It shows two lines in a narrow V, then throws two frost shards down them (each chills a
                moment), then burns low.
     shardling  (the Glass Heart) a small obsidian crawler with a back of crystal spines. It hunches (a fan of three lines),
                flicks three glass shards along them, then sits still recovering.
     geodeling  (the Glass Heart) a walking geode: shut, its rough shell takes a quarter of any blow. Every few seconds it
                cracks (a ring shown round it) and bursts with a pulse of heat, then lies split open, its molten heart bare. */
  Object.assign(MON, {
    rimewisp: { name: 'Rime wisp', from: 999, hp: 22, spd: 1.6, r: 0.4, dmg: 8, xp: 7, coin: 0.5, color: '#CFEFFF', fly: true, bio: ['rimeforge'], kit: [], tip: 'An ember wisp caught in the forge\'s cold: frost-fire round a red coal. It shows two lines, then throws two frost shards down them (a hit chills you a moment), then burns low.' },
    shardling: { name: 'Shardling', from: 999, hp: 22, spd: 1.9, r: 0.38, dmg: 7, xp: 6, coin: 0.5, color: '#1A1420', bio: ['glassheart'], kit: [], tip: 'A small obsidian crawler with crystal spines. It hunches and shows three lines, then flicks three glass shards along them, and sits a moment to recover.' },
    geodeling: { name: 'Geodeling', from: 999, hp: 40, spd: 0.85, r: 0.5, dmg: 9, xp: 9, coin: 0.7, color: '#3A3234', bio: ['glassheart'], kit: [], tip: 'A walking geode. Shut, its shell turns most blows. It cracks open with a burst of heat round it (a ring is shown first: step out), then lies open a while: hit its molten heart then.' },
  });
  Object.assign(MP, {
    rimewisp(c, r, ph, o) { const md = o.mode || '', ch = md === 'charge', sp = md === 'spent', k = ch ? 1.25 : sp ? 0.55 : 1, fl = Math.sin(ph * TAU * 2), lw = lwOf(r);
      c.fillStyle = 'rgba(8,10,16,.22)'; ell(c, 0, r * 0.95, r * 0.55, r * 0.14); c.fill();
      const flame = (s, tip, col, a) => { c.globalAlpha = a; c.beginPath(); c.moveTo(0, r * 0.45 * s); c.bezierCurveTo(-r * 0.62 * s, r * 0.35 * s, -r * 0.6 * s, -r * 0.3 * s, -r * 0.1 * s + fl * r * 0.05, -tip); c.bezierCurveTo(r * 0.12 * s, -r * 0.5 * s, r * 0.6 * s, -r * 0.2 * s, r * 0.5 * s, r * 0.2 * s); c.quadraticCurveTo(r * 0.35 * s, r * 0.5 * s, 0, r * 0.45 * s); c.closePath(); c.fillStyle = col; c.fill(); c.globalAlpha = 1; };
      addGlow(c, 0, 0, r * 1.5 * k, '#9FD8FF', ch ? 0.7 : sp ? 0.2 : 0.45);
      c.save(); c.translate(0, -r * 0.05); flame(k, r * (1.05 + 0.12 * fl) * k, '#5E9ED8', sp ? 0.55 : 0.85); flame(k * 0.78, r * (0.85 + 0.1 * fl) * k, '#A8DAFA', 0.95); flame(k * 0.55, r * (0.6 + 0.08 * fl) * k, '#E8F7FF', 1);
      // rime crystals on its shell
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(0.8, r * 0.04); for (const [x, y] of [[-0.35, -0.1], [0.32, 0.0], [-0.1, -0.55]]) { c.beginPath(); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; c.moveTo(x * r * k + Math.cos(a) * r * 0.08, y * r * k + Math.sin(a) * r * 0.08); c.lineTo(x * r * k - Math.cos(a) * r * 0.08, y * r * k - Math.sin(a) * r * 0.08); } c.stroke(); }
      // the coal: still red at its heart
      const coal = [[-r * 0.2, r * 0.16], [-r * 0.26, -r * 0.0], [-r * 0.14, -r * 0.13], [r * 0.02, -r * 0.18], [r * 0.16, -r * 0.1], [r * 0.23, r * 0.04], [r * 0.15, r * 0.19], [-r * 0.01, r * 0.24]]; poly(c, coal); c.closePath(); c.fillStyle = sp ? '#4A4A55' : '#2A1A16'; c.fill(); stroke(c, lw * 0.7);
      c.save(); poly(c, coal); c.clip(); c.strokeStyle = sp ? 'rgba(255,120,50,.4)' : '#FF8A3D'; c.lineWidth = Math.max(0.8, r * 0.04); c.beginPath(); c.moveTo(-r * 0.18, r * 0.08); c.lineTo(-r * 0.03, r * 0.02); c.lineTo(r * 0.04, r * 0.12); c.moveTo(-r * 0.03, r * 0.02); c.lineTo(r * 0.1, -r * 0.08); c.stroke(); c.restore(); addGlow(c, 0, r * 0.02, r * 0.3, LAVA, sp ? 0.15 : 0.45);
      c.restore();
      for (let i = 0; i < 3; i++) { const u = (ph * 2 + i / 3) % 1; c.fillStyle = `rgba(230,246,255,${(1 - u) * (sp ? 0.4 : 0.85)})`; c.beginPath(); c.arc(Math.sin(i * 2.1 + u * 3) * r * 0.3, r * 0.4 + u * r * 0.6, r * 0.05 * (1 - u) + 0.6, 0, TAU); c.fill(); }
      if (ch) { c.strokeStyle = 'rgba(230,246,255,.85)'; c.lineWidth = Math.max(1, r * 0.05); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + ph * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9 - r * 0.1); c.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15 - r * 0.1); c.stroke(); } } },
    shardling(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', hunch = md === 'wind', flick = md === 'flick', rest = md === 'rest', run = Math.sin(ph * TAU * 2), up = hunch ? r * 0.12 : 0;
      c.fillStyle = 'rgba(8,4,8,.34)'; ell(c, 0, r * 0.6, r * 1.0, r * 0.22); c.fill();
      for (const [x, k, d] of [[-0.45, 1, 1], [0, -1, 1], [0.42, 1, 1], [-0.3, -1, 0], [0.15, 1, 0], [0.55, -1, 0]]) { const sw = run * k * r * 0.08 * (rest ? 0 : 1), fx = x * r + r * 0.25 + sw; limb(c, x * r, r * 0.15, x * r + r * 0.15 + sw * 0.5, r * 0.05, Math.max(1.5, r * 0.09), d ? '#1A141E' : '#2A2232'); limb(c, x * r + r * 0.15 + sw * 0.5, r * 0.05, fx, r * 0.56, Math.max(1.2, r * 0.07), d ? '#120E16' : '#221C28'); }
      // the body: a low glossy obsidian carapace
      c.save(); c.translate(0, -up); c.beginPath(); c.moveTo(-r * 0.9, r * 0.25); c.bezierCurveTo(-r * 0.9, -r * 0.3, -r * 0.3, -r * 0.48, r * 0.3, -r * 0.42); c.bezierCurveTo(r * 0.8, -r * 0.36, r * 1.0, -r * 0.05, r * 0.92, r * 0.22); c.quadraticCurveTo(0, r * 0.38, -r * 0.9, r * 0.25); c.closePath();
      const g = c.createLinearGradient(0, -r * 0.5, 0, r * 0.3); g.addColorStop(0, '#6A5288'); g.addColorStop(0.45, '#2E2240'); g.addColorStop(1, '#100A16'); c.fillStyle = g; c.fill(); stroke(c, lw); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(190,150,255,.35)'; c.lineWidth = Math.max(1, lw * 0.7); c.stroke(); c.restore();
      c.strokeStyle = 'rgba(220,200,255,.55)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(-r * 0.6, -r * 0.18); c.quadraticCurveTo(-r * 0.1, -r * 0.42, r * 0.4, -r * 0.34); c.stroke();
      // the spines: crystal shards along its back, glowing when it hunches
      const spines = [[-0.6, 0.55, -0.5], [-0.3, 0.75, -0.25], [0.0, 0.85, 0.0], [0.3, 0.7, 0.25], [0.55, 0.45, 0.5]]; for (const [x, s, a] of spines) { if (flick && Math.abs(x) < 0.4) continue; c.save(); c.translate(x * r, -r * 0.32 - Math.abs(x) * -r * 0.05); c.rotate(a + (hunch ? a * 0.4 : 0)); const L = r * s * 0.85 * (hunch ? 1.15 : 1), w = r * 0.15; poly(c, [[-w, 0], [-w * 0.55, -L * 0.75], [0, -L], [0, 0]]); c.closePath(); c.fillStyle = '#6A4E92'; c.fill(); poly(c, [[0, 0], [0, -L], [w * 0.55, -L * 0.72], [w, 0]]); c.closePath(); c.fillStyle = '#22182E'; c.fill(); poly(c, [[-w, 0], [-w * 0.55, -L * 0.75], [0, -L], [w * 0.55, -L * 0.72], [w, 0]]); c.closePath(); stroke(c, lw * 0.7); c.strokeStyle = hunch ? '#FFC080' : 'rgba(255,90,42,.8)'; c.lineWidth = Math.max(0.8, r * 0.035); c.beginPath(); c.moveTo(w * 0.2, -L * 0.08); c.lineTo(-w * 0.15, -L * 0.45); c.lineTo(w * 0.1, -L * 0.75); c.stroke(); c.restore(); }
      if (hunch) addGlow(c, 0, -r * 0.6, r * 0.8, FRACTURE, 0.5);
      // the head: a wedge of glass with two ember pits
      c.beginPath(); c.moveTo(r * 0.7, -r * 0.2); c.lineTo(r * 1.1, r * 0.02); c.lineTo(r * 0.75, r * 0.22); c.closePath(); c.fillStyle = '#241A30'; c.fill(); stroke(c, lw * 0.8); for (const [x, y] of [[0.86, -0.03], [0.94, 0.06]]) { c.fillStyle = rest ? '#8A3A20' : '#FF9A50'; c.beginPath(); c.arc(x * r, y * r, r * 0.035, 0, TAU); c.fill(); }
      c.beginPath(); c.moveTo(-r * 0.85, r * 0.24); c.quadraticCurveTo(0, r * 0.36, r * 0.9, r * 0.2); rim(c, lw * 0.8, 0.45);
      c.restore(); },
    geodeling(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', open = md === 'open', crack = md === 'c1' || md === 'c2' || md === 'c3', ck = crack ? +md[1] / 3 : 0, burst = md === 'burst', step = Math.sin(ph * TAU * 2) * r * 0.06, gap = open ? r * 0.28 : burst ? r * 0.4 : ck * r * 0.06;
      c.fillStyle = 'rgba(8,4,4,.36)'; ell(c, 0, r * 0.66, r * 0.95, r * 0.22); c.fill();
      for (const sd of [-1, 1]) { const fx = sd * r * 0.32 + (open ? 0 : step * sd); limb(c, sd * r * 0.22, r * 0.3, fx, r * 0.62, Math.max(2, r * 0.15), '#2A2426'); c.fillStyle = '#1A1617'; ell(c, fx, r * 0.64, r * 0.12, r * 0.05); c.fill(); }
      // the molten heart (seen through the crack, bare when open)
      const hk = open || burst ? 1 : ck; if (hk > 0) { ell(c, 0, -r * 0.1, r * 0.42, r * 0.4); const mg = c.createRadialGradient(0, -r * 0.15, 0, 0, -r * 0.1, r * 0.42); mg.addColorStop(0, '#FFF2C0'); mg.addColorStop(0.45, '#FF8A30'); mg.addColorStop(1, '#8A2008'); c.fillStyle = mg; c.fill(); addGlow(c, 0, -r * 0.1, r * (0.7 + 0.6 * hk), LAVA, 0.35 + 0.45 * hk);
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, px = Math.cos(a) * r * 0.38, py = -r * 0.1 + Math.sin(a) * r * 0.36; poly(c, [[px, py], [px * 0.6, py * 0.6 - r * 0.04], [px * 0.95 + Math.sin(a) * r * 0.06, py * 0.95 - Math.cos(a) * r * 0.06]]); c.closePath(); c.fillStyle = i % 2 ? '#6E4E9A' : '#9A78C8'; c.fill(); } }
      // the two halves of the shell: rough basalt outside, agate rim at the cut
      for (const sd of [-1, 1]) { c.save(); c.translate(sd * gap, open ? r * 0.06 : 0); c.rotate(open ? sd * 0.35 : burst ? sd * 0.5 : sd * ck * 0.08);
        c.beginPath(); c.moveTo(0, -r * 0.82); for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + sd * i / 8 * Math.PI, k2 = 1 + Math.sin(i * 2.3 + sd) * 0.06; c.lineTo(sd * Math.abs(Math.cos(a)) * r * 0.78 * k2, -r * 0.1 + Math.sin(a) * r * 0.72 * k2); } c.lineTo(0, r * 0.62); for (let i = 0; i < 5; i++) c.lineTo(sd * (i % 2 ? r * 0.06 : 0), r * 0.62 - (i + 1) * r * 0.29); c.closePath();
        const g = c.createLinearGradient(-r * 0.8, -r * 0.8, r * 0.8, r * 0.6); g.addColorStop(0, '#6E6466'); g.addColorStop(0.5, '#463E40'); g.addColorStop(1, '#1C1617'); c.fillStyle = g; c.fill(); stroke(c, lw);
        c.fillStyle = 'rgba(0,0,0,.3)'; for (const [x, y] of [[0.4, -0.4], [0.55, 0.05], [0.3, 0.3]]) { c.beginPath(); c.arc(sd * x * r, y * r, r * 0.06, 0, TAU); c.fill(); } c.fillStyle = 'rgba(200,190,180,.2)'; ell(c, sd * r * 0.35, -r * 0.55, r * 0.18, r * 0.06, sd * 0.4); c.fill();
        c.strokeStyle = '#8A68B0'; c.lineWidth = Math.max(1, r * 0.05); c.beginPath(); c.moveTo(0, -r * 0.82); for (let i = 0; i < 5; i++) c.lineTo(sd * (i % 2 ? r * 0.06 : 0), -r * 0.82 + (i + 1) * r * 0.29); c.stroke();
        c.restore(); }
      if (crack) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,150,60,${0.5 + 0.5 * ck})`; c.lineWidth = Math.max(1, r * 0.06); c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(r * 0.05, -r * 0.4); c.lineTo(-r * 0.04, 0); c.lineTo(r * 0.04, r * 0.5); c.stroke(); c.restore(); }
      if (!open && !burst) { c.beginPath(); c.moveTo(-r * 0.6, r * 0.38); c.lineTo(-r * 0.08, r * 0.6); c.moveTo(r * 0.08, r * 0.6); c.lineTo(r * 0.6, r * 0.38); rim(c, lw * 0.8, 0.4); } },
  });
  Object.assign(EXT, { rimewisp: 2.0, shardling: 1.9, geodeling: 1.9 }); Object.assign(NF, { rimewisp: 6, shardling: 6, geodeling: 4 });
  Object.assign(mon, {
    rimewisp(m, A, X) {
      if (m.wT > 0) { m.wT -= A.dt; m.mode = 'charge'; faceTo(m, m.fa); if (m.wT <= 0) { m.mode = 'spent'; m.spentT = 3.0; m.shots = (m.shots || 0) + 1; for (const da of [-0.2, 0.2]) X.eshot(m.x + Math.cos(m.fa) * 0.4, m.y - 0.3, m.fa + da, 4.6, { dmg: m.dmg, color: '#BFE3FA', core: '#FFFFFF', r: 0.22, style: 'orb', src: m, chill: 1.2, life: 3 }); snd(X, 'chime', 1175, 0.25); } return; }
      if (m.spentT > 0) { m.spentT -= A.dt; m.mode = 'spent'; if (A.d > 3) A.steer(A.sp * 0.25); m.z = 0.2; return; }
      m.mode = null; m.z = 0.45 + 0.12 * Math.sin(m.t * 2.3); keepRange(m, A, X, 3.2, 6.2); faceTo(m, A.a);
      if (m.cd <= 0 && A.d < 7.5 && A.los()) { m.wT = 1.2; m.fa = A.a; m.cd = 4.6 + Math.random(); for (const da of [-0.2, 0.2]) X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a + da, len: Math.min(9, A.d + 1.5), w: 0.6, life: 1.2, max: 1.2, src: m }); }
    },
    shardling(m, A, X) {
      if (m.wT > 0) { m.wT -= A.dt; m.mode = 'wind'; faceTo(m, m.fa); if (m.wT <= 0) { m.mode = 'flick'; m.flickT = 0.25; m.shots = (m.shots || 0) + 1; for (const da of [-0.32, 0, 0.32]) X.eshot(m.x + Math.cos(m.fa) * 0.4, m.y - 0.25, m.fa + da, 5.4, { dmg: m.dmg * 0.8, color: '#B080E8', core: '#FFD0A0', r: 0.16, style: 'orb', src: m, life: 1.3 }); snd(X, 'crack'); } return; }
      if (m.flickT > 0) { m.flickT -= A.dt; if (m.flickT <= 0) m.restT = 1.3; return; }
      if (m.restT > 0) { m.restT -= A.dt; m.mode = 'rest'; return; }
      m.mode = null; keepRange(m, A, X, 2.4, 4.8); faceTo(m, A.a);
      if (m.cd <= 0 && A.d < 6 && A.los()) { m.wT = 0.9; m.fa = A.a; m.cd = 3.8 + Math.random() * 1.2; for (const da of [-0.32, 0, 0.32]) X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a + da, len: 6.5, w: 0.45, life: 0.9, max: 0.9, src: m }); }
    },
    geodeling(m, A, X) { if (!m.guardFn) m.guardFn = geodeGuard;
      if (m.wT > 0) { m.wT -= A.dt; const u = 1 - m.wT / 1.3; m.mode = 'c' + Math.max(1, Math.min(3, Math.ceil(u * 3))); if (m.wT <= 0) { m.mode = 'burst'; m.burstT = 0.3; m.bursts = (m.bursts || 0) + 1; if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 2.2 + X.me.r * 0.5 && !X.me.dodge) X.hurtPet(m.dmg * 1.4, m); X.ring(m.x, m.y, 0.3, 2.2, 0.35, LAVA, 0.4); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; X.part({ kind: 'ember', x: m.x, y: m.y - 0.3, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4 - 1, life: 0.5, max: 0.5, size: 5, color: LAVA }); } snd(X, 'crash'); } return; }
      if (m.burstT > 0) { m.burstT -= A.dt; if (m.burstT <= 0) { m.openT = 2.8; X.text(m.x, m.y - m.r - 1, 'Its heart is bare!', LAVA_HI, 13); } return; }
      if (m.openT > 0) { m.openT -= A.dt; m.mode = 'open'; m.atkCd = 0.3; return; }
      m.mode = null; if (A.d > 1.4) A.steer(A.sp); faceTo(m, A.a);
      if (m.cd <= 0 && A.d < 2.6) { m.wT = 1.3; m.cd = 3.4 + Math.random(); X.warn({ x: m.x, y: m.y, r: 2.2, life: 1.3, max: 1.3, src: m, follow: m }); }
    },
  });
  function geodeGuard(m, o) { const X = CUR && CUR.X; if (m.openT > 0 || m.mode === 'burst') return 1; if (X && !o.dot) say(X, m, 'Its shell turns the blow: wait for it to open', '#CFC6E0', 3.5); return 0.25; }
  CAL.geodeGuard = geodeGuard;

  /* ======================= the dungeons: their packs, the champion at the end ======================= */
  const BROOD = ['cinderslug', 'basaltcrawler', 'emberwisp', 'furnaceimp', 'runicsentinel', 'bomblarva', 'ashenknight', 'crystalwisp', 'rimewisp', 'shardling', 'geodeling'];
  /* a champion of the brood guards each dungeon's far room: a big one of its kind, named, crowned with a ring of light;
     the floor is clear (and the way on open) once it falls with the rest */
  function champion(X, spec) { const M = X.M; let far = M.start, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = Math.hypot(cx - M.start.x, cy - M.start.y); if (d > best) { best = d; far = X.freeSpot(cx, cy, 0.9) || { x: cx, y: cy }; } }
    const m = X.spawnMon(spec.type, far.x, far.y, { rift: true, pack: 1777, room: -1 }); m.calChamp = spec.name; m.hp *= spec.hpK; m.maxhp = m.hp; m.r *= spec.rK || 1.45; m.dmg *= spec.dmgK || 1.2; m.spd *= 0.92; m.xp *= 6; if (X.g && X.g.total != null) X.g.total++;
    return m; }
  function champOver(c, X, m) { const T = X.Tz(), Xs = X.sx(m.x), Ys = X.sy(m.y) - m.r * T - T * 0.9 - (m.z || 0) * T; label(c, m.calChamp, Xs, Ys, Math.max(11, T * 0.3), '#FFE37A');
    const w = Math.max(40, T * 1.8), f = clamp(m.hp / m.maxhp, 0, 1); c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(Xs - w / 2, Ys + T * 0.12, w, 6); c.fillStyle = '#FF9F43'; c.fillRect(Xs - w / 2 + 1, Ys + T * 0.12 + 1, (w - 2) * f, 4); }
  function champGround(c, X, m) { const T = X.Tz(), Xs = X.sx(m.x), Ys = X.sy(m.y), t = X.g.t, R = m.r * T * 1.5; c.save(); c.strokeStyle = 'rgba(255,227,122,.5)'; c.lineWidth = Math.max(2, T * 0.06); c.setLineDash([T * 0.25, T * 0.15]); c.lineDashOffset = -t * T * 0.5; ell(c, Xs, Ys + m.r * T * 0.7, R, R * 0.4); c.stroke(); c.setLineDash([]); c.restore(); glow(c, Xs, Ys + m.r * T * 0.5, R * 1.3, '#FFB347', 0.18); }
  const DUNGEON = {
    ashen: { dmgK: 0.38, calm: true, fight: 'The Cinder Galleries', mobs: ['cinderslug', 'basaltcrawler', 'emberwisp', 'cinderslug', 'furnaceimp', 'emberwisp', 'basaltcrawler', 'cinderslug'], champ: { type: 'basaltcrawler', name: 'Cragback, the Old Crawler', hpK: 4.5, dmgK: 0.9 } },
    rimeforge: { dmgK: 0.65, fight: 'The Rimebound Forge', mobs: ['rimewisp', 'runicsentinel', 'furnaceimp', 'basaltcrawler', 'rimewisp', 'bomblarva', 'furnaceimp', 'emberwisp'], champ: { type: 'runicsentinel', name: 'The Rimeward Sentinel', hpK: 4.2 } },
    glassheart: { dmgK: 0.8, fight: 'The Glass Heart', mobs: ['shardling', 'geodeling', 'crystalwisp', 'ashenknight', 'shardling', 'geodeling', 'crystalwisp', 'shardling'], champ: { type: 'ashenknight', name: 'The Glassblade Knight', hpK: 4.0 } },
  };
  /* each dungeon's extra (riftFight runs it): only the brood on the floor (no strays from the Tower's lists), the champion */
  /* (v388, the user: "double the amount of enemies in each dungeon") a second set of packs on top of the floor's own: about
     fifty more brood in packs of five or six, spread through the rooms (never the first, never within ten tiles of the
     start), each pack a main kind and a second from the dungeon's list, at most one heavy one (sentinel, larva, geodeling)
     to a pack. The floor's live cap (Rf.liveCap) holds the far ones back until the pet comes near, so the field stays as
     full as before, only for twice as long */
  const HEAVY = ['runicsentinel', 'bomblarva', 'geodeling'];
  function morePacks(X, D, want) { const M = X.M, R = Math.random, S0 = M.start, pick = () => D.mobs[Math.floor(R() * D.mobs.length)];
    const rooms = M.rooms.map((r, i) => ({ r, i })).filter(({ r, i }) => i > 0 && Math.hypot(r.x + r.w / 2 - S0.x, r.y + r.h / 2 - S0.y) > 8 && r.w > 3 && r.h > 3); if (!rooms.length) return 0;
    let made = 0, tries = 0, pk = 0;
    while (made < want && tries++ < 300) { const { r, i } = rooms[Math.floor(R() * rooms.length)], c0 = X.freeSpot(r.x + 1 + R() * (r.w - 2), r.y + 1 + R() * (r.h - 2), 0.6); if (!c0 || Math.hypot(c0.x - S0.x, c0.y - S0.y) < 10) continue;
      const n = Math.min(want - made, 5 + (R() < 0.5 ? 1 : 0)), main = pick(); let alt = pick(), heavy = 0; pk++;
      for (let j = 0; j < n; j++) { let t = j % 3 === 2 ? alt : main; if (HEAVY.includes(t) && heavy++) t = D.mobs.find(q => !HEAVY.includes(q)) || t; const a = j / n * TAU, q = X.freeSpot(c0.x + Math.cos(a) * 1.3, c0.y + Math.sin(a) * 1.3, 0.4) || c0;
        X.spawnMon(t, q.x, q.y, { rift: true, pack: 1400 + pk, room: i, flank: a }); if (X.g && X.g.total != null) X.g.total++; made++; } }
    return made; }
  /* (v388, the user: "even if all enemies are killed and the door is open, more enemies can still pour out of a rift")
     once a dungeon is clear and its door open, three small tears open in the air of rooms already cleared: cracks of
     black fire, ember light seeping from their edges. Each brightens for a second (a ring on the floor below it, a hiss),
     then lets out two or three of the brood, every seven seconds or so, no more than eight alive from them at once. They
     never open near the door, never let anything out on top of the pet (a tear waits while the pet stands close), and
     stop when the pet takes the exit. Their kills give the usual experience and drops: stay and farm, or leave */
  const TEAR_CAP = 8;
  function openTears(X, C, D, key) { const M = X.M, me = X.me, ex = X.rift && X.rift.exit, R = Math.random, out = [];
    const cand = M.rooms.map(r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })).filter(p => !ex || Math.hypot(p.x - ex.x, p.y - ex.y) > 8).sort(() => R() - 0.5);
    for (const p of cand) { if (out.length >= 3) break; const q = X.freeSpot(p.x + (R() - 0.5) * 3, p.y + (R() - 0.5) * 3, 0.8); if (!q || Math.hypot(q.x - me.x, q.y - me.y) < 5 || (ex && Math.hypot(q.x - ex.x, q.y - ex.y) < 7) || out.some(o => Math.hypot(o.x - q.x, o.y - q.y) < 6)) continue;
      out.push({ x: q.x, y: q.y, t: 0, open: 0, next: 2 + out.length * 2.3 + R() * 1.5, warn: 0, seed: R() * 50, n: 0, shards: [0, 1, 2, 3].map(i => ({ a: i / 4 * TAU + R(), r: 0.5 + R() * 0.3, s: 0.12 + R() * 0.08, z: R() })) }); }
    C.tears = out; C.tearMons = []; return out; }
  function tearTick(X, C, D, dt) { const me = X.me; C.tearMons = C.tearMons.filter(m => !m.dead); const live = C.tearMons.length;
    for (const tr of C.tears) { tr.t += dt; tr.open = Math.min(1, tr.open + dt * 0.8);
      if (tr.warn > 0) { tr.warn -= dt; if (tr.warn <= 0) { const dPet = Math.hypot(me.x - tr.x, me.y - tr.y), room = TEAR_CAP - C.tearMons.length;
          if (dPet < 2.6 || room <= 0) { tr.next = 1.5; continue; }   // (never onto the pet: it waits while the pet stands close; and the cap)
          const n = Math.min(room, 2 + (Math.random() < 0.5 ? 1 : 0)), away = Math.atan2(tr.y - me.y, tr.x - me.x); tr.n++;
          for (let j = 0; j < n; j++) { const a = away + (j - (n - 1) / 2) * 0.9, q = X.freeSpot(tr.x + Math.cos(a) * 0.9, tr.y + Math.sin(a) * 0.9, 0.4) || { x: tr.x, y: tr.y }; const t = D.mobs[Math.floor(Math.random() * D.mobs.length)], m = X.spawnMon(HEAVY.includes(t) ? D.mobs[0] : t, q.x, q.y, { rift: true, pack: 1900 + tr.n, aggro: true });
            m.aggro = true; m.calTear = true; m.dmg *= D.dmgK || 0.7; m.calEased = true; m.cd = 1.2 + Math.random(); C.tearMons.push(m); C.tearSpawned = (C.tearSpawned || 0) + 1;
            X.ring(q.x, q.y, 0.2, 1.0, 0.3, FRACTURE, 0.25); }
          X.boom(tr.x, tr.y - 0.9, 0.9, FRACTURE, FRACTURE_HI, { n: 10, shake: 2 }); snd(X, 'crack'); tr.flash = 0.5; tr.next = 6.5 + Math.random() * 3; } }
      else if (live < TEAR_CAP) { tr.next -= dt; if (tr.next <= 0) { tr.warn = 1.0; snd(X, 'hiss', 0.8, 0.14, 650); } }
      if (tr.flash) tr.flash = Math.max(0, tr.flash - dt); } }
  /* a tear in the air: a jagged split of black fire hanging over the floor, ember light seeping from its edges, splinters of
     black crystal circling it; brighter (and a warning ring under it) for the second before it lets something out */
  function tearGround(c, X, tr) { const T = X.Tz(), Xs = X.sx(tr.x), Ys = X.sy(tr.y), w = tr.warn > 0 ? 1 - tr.warn : 0; glow(c, Xs, Ys, T * 1.6 * tr.open, LAVA, 0.22 + 0.25 * w);
    c.save(); c.fillStyle = 'rgba(10,4,8,.35)'; ell(c, Xs, Ys + T * 0.05, T * 0.7 * tr.open, T * 0.22 * tr.open); c.fill();
    if (tr.warn > 0) { c.strokeStyle = 'rgba(20,6,6,.6)'; c.lineWidth = Math.max(3, T * 0.12); c.beginPath(); c.arc(Xs, Ys, T * 1.2, 0, TAU); c.stroke(); c.strokeStyle = WARN; c.lineWidth = Math.max(2, T * 0.07); c.beginPath(); c.arc(Xs, Ys, T * 1.2, -Math.PI / 2, -Math.PI / 2 + TAU * w); c.stroke(); }
    c.restore(); }
  const TEAR_PTS = [[0, -1], [0.16, -0.72], [-0.08, -0.5], [0.2, -0.22], [-0.04, 0.04], [0.14, 0.32], [0, 0.6], [0.06, 0.82], [0, 1]];
  function tearOver(c, X, tr, G) { const T = X.Tz(), t = X.g.t, w = tr.warn > 0 ? 1 - tr.warn : 0, k = (0.55 + 0.15 * Math.sin(t * 3 + tr.seed) + 0.9 * w + (tr.flash || 0)) * tr.open, Xs = X.sx(tr.x), Yc = X.sy(tr.y) - T * 1.35, h = T * 1.2 * tr.open, wd = T * (0.3 + 0.14 * w) * tr.open;
    if (h < 2) return;
    const L = TEAR_PTS.map(([u, v], i) => [Xs + (u - 0.11 * Math.sin(v * Math.PI)) * h * 0.9 - wd * Math.sin((v + 1) / 2 * Math.PI), Yc + v * h]), Rr = TEAR_PTS.map(([u, v]) => [Xs + u * h * 0.9 + wd * Math.sin((v + 1) / 2 * Math.PI), Yc + v * h]);
    // the split itself: the dark of the rift between two ragged lips
    c.save(); poly(c, L.concat(Rr.slice().reverse())); c.closePath(); const g = c.createLinearGradient(Xs - wd, 0, Xs + wd, 0); g.addColorStop(0, '#2A0E12'); g.addColorStop(0.5, '#06030A'); g.addColorStop(1, '#2A0E12'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.globalCompositeOperation = 'lighter'; const ig = c.createRadialGradient(Xs, Yc, 0, Xs, Yc, h); ig.addColorStop(0, rgba('#B060FF', 0.25 * k)); ig.addColorStop(1, 'rgba(176,96,255,0)'); c.fillStyle = ig; c.fillRect(Xs - h, Yc - h, h * 2, h * 2); c.restore();
    // its burning lips
    if (G) { for (const S of [L, Rr]) for (let i = 0; i < S.length - 1; i++) G.Q.ebeam(S[i][0], S[i][1], S[i + 1][0], S[i + 1][1], T * (0.07 + 0.05 * w), FRACTURE, 0.85, Math.min(1, 0.55 * k), tr.seed + i, 4); G.Q.glow(Xs, Yc, h * 1.1, LAVA, 0.3 * k); if (!lowFx()) G.Q.fire(Xs, Yc - h * 0.9, T * 0.18 * tr.open, 0.8, 0.5 * k, tr.seed); }
    else { c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; for (const [lw2, col, a] of [[T * 0.16, FRACTURE, 0.35], [T * 0.07, LAVA_HI, 0.7], [T * 0.025, '#FFF2C8', 0.8]]) { c.strokeStyle = rgba(col, Math.min(1, a * k)); c.lineWidth = lw2; for (const S of [L, Rr]) { poly(c, S); c.stroke(); } } c.globalCompositeOperation = 'source-over'; glow(c, Xs, Yc, h * 1.2, LAVA, 0.3 * k); }
    c.restore();
    // splinters of black crystal circling it, and embers seeping out
    for (const sh of tr.shards) { const a = sh.a + t * (0.6 + sh.z * 0.5), x = Xs + Math.cos(a) * h * sh.r * 1.4, y = Yc + Math.sin(a) * h * sh.r * 0.5 + Math.sin(t * 2 + sh.z * 6) * T * 0.08, s = T * sh.s; c.save(); c.translate(x, y); c.rotate(a * 2); poly(c, [[-s * 0.5, 0], [0, -s], [s * 0.5, 0], [0, s * 0.6]]); c.closePath(); c.fillStyle = '#1E1428'; c.fill(); c.strokeStyle = rgba(FRACTURE, 0.7); c.lineWidth = 1; c.stroke(); c.restore(); }
    if (!lowFx() && Math.random() < 0.25) X.part({ kind: 'ember', x: tr.x + (Math.random() - 0.5) * 0.4, y: tr.y - 1.2 + (Math.random() - 0.5) * 1.4, vx: (Math.random() - 0.5) * 1.2, vy: -1 - Math.random() * 1.5, life: 0.7, max: 0.7, size: 3 + Math.random() * 3, color: Math.random() < 0.5 ? LAVA : FRACTURE }); }
  CAL.tearOver = tearOver;
  const dungeonExtra = key => (X, self, H) => { const D = DUNGEON[key], C = ctx(X); X.F.types = (X.F.types || []).filter(t => BROOD.includes(t)); if (!X.F.types.length) X.F.types = D.mobs.slice();
    C.extraPacks = morePacks(X, D, D.more == null ? 52 : D.more);
    // (the dungeons' brood hit softer: about fifty of them stand between a starter and the puzzle. QA v386: by dungeon, 0.38 / 0.65 /
    //  0.8 (was 0.7 for all), so the first dungeon, met at level 1, is the gentlest and the rift ramps up; the champion with them)
    const DK = D.dmgK || 0.7, easeAll = () => { for (const m of X.mons.concat(X.g.reserve || [])) if (!m.calEased && !m.boss) { m.calEased = true; m.dmg *= DK; } };
    // (QA v386: the first dungeon's first rooms hold no ranged brood: its wisps and imps near the start become cinder slugs: crawlers' rams are what hurt a careless starter most)
    if (D.calm) { const M = X.M; for (const m of X.mons) { if (m.dead || m.boss || (m.pack >= 1400 && m.pack < 1900) || (m.type !== 'emberwisp' && m.type !== 'furnaceimp') || Math.hypot(m.x - M.start.x, m.y - M.start.y) > 18) continue;
      const nt = 'cinderslug', A = MON[m.type], B = MON[nt]; if (!A || !B) continue; const k = (f, d) => (A[f] ? B[f] / A[f] : d);
      m.hp *= k('hp', 1); m.maxhp = m.hp; m.dmg *= k('dmg', 1); m.spd *= k('spd', 1); m.r *= k('r', 1); m.xp *= k('xp', 1); m.color = B.color; m.type = nt; } }
    easeAll();
    const ch = champion(X, D.champ); ch.dmg *= DK / 0.7; ch.calEased = true; C.champ = ch; C.easeAll = easeAll;
    // (QA v386: a flier drifting out over the lava or into a wall, beyond a starter's reach, is drawn back to the floor it left
    //  within about three seconds)
    const onFloor = (x, y) => { const M = X.M, tx = Math.floor(x), ty = Math.floor(y); if (tx < 0 || ty < 0 || tx >= M.MW || ty >= M.MH) return false; const t = M.G[ty * M.MW + tx]; return t !== T_GAP && t !== T_SOLID; };
    const herd = dt => { for (const m of X.mons) { if (m.dead || m.boss || !(MON[m.type] && MON[m.type].fly)) continue; if (onFloor(m.x, m.y)) { m.calOff = 0; m.calLast = m.calLast || {}; m.calLast.x = m.x; m.calLast.y = m.y; continue; }
      m.calOff = (m.calOff || 0) + dt; const L = m.calLast; if (m.calOff < 1.2 || !L) continue; const dx = L.x - m.x, dy = L.y - m.y, d = Math.hypot(dx, dy); if (d < 0.05) continue; const v = Math.min(d, 4.5 * dt); m.x += dx / d * v; m.y += dy / d * v; } };
    // (QA v386: the props that crowd the way on are cleared: a tall crystal, spire or frost well a tile or two behind or in
    //  front of the exit's archway was drawn right over it. The exit is where riftFight (20m) puts it: the farthest room)
    { const M = X.M; let ex = null, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = Math.hypot(cx - M.start.x, cy - M.start.y); if (d > best) { best = d; ex = X.freeSpot(cx, cy, 0.8) || { x: cx, y: cy }; } }
      if (ex) for (const p of X.props || []) if (!p.broken && Math.abs(p.x - ex.x) < 1.8 && p.y - ex.y > -2.6 && p.y - ex.y < 2.8) { p.broken = true; M.G[p.k] = T_FLOOR; } }   // (no retile: the floor's tiles are not cached yet when make runs)
    let eT = 0, bled = false; C.tears = [];
    return { update(dt) { herd(dt); eT -= dt; if (eT <= 0) { eT = 1; easeAll(); }
        // the dungeon is clear and its door open: the rift still bleeds
        if (self.done && !bled && !X.g.won) { bled = true; openTears(X, C, D, key); const mod = self.mod; if (mod && mod.goal) { const g0 = mod.goal; mod.goal = () => self.done ? 'Cleared! The rift still bleeds: leave by the door or keep fighting' : g0(); }
          X.after(2.8, () => { if (!X.g.won) X.banner('THE RIFT STILL BLEEDS', 'Leave by the door, or stay and fight what pours out', FRACTURE_HI, 2.6, true); }); }
        if (bled && !X.g.won) tearTick(X, C, D, dt); },
      drawGround(c) { if (!ch.dead) champGround(c, X, ch); for (const tr of C.tears) tearGround(c, X, tr); },
      drawOver(c) { if (!ch.dead && Math.hypot(ch.x - X.me.x, ch.y - X.me.y) < 12) champOver(c, X, ch); if (C.tears.length && !X.g.won) { const G = gpu(c, false); for (const tr of C.tears) { const Xs = X.sx(tr.x), Ys = X.sy(tr.y); if (Xs > -X.Tz() * 3 && Xs < X.W() + X.Tz() * 3 && Ys > -X.Tz() * 4 && Ys < X.H() + X.Tz() * 3) tearOver(c, X, tr, G); } gpuEnd(c, G); } } }; };
  Object.assign(CAL, { BROOD, champion, DUNGEON });

  /* ======================= the arenas' painters (for the boss files) ======================= */
  /* the caldera's far walls, seen past the platform: smoke, ridge on ridge of basalt lit from below, enormous lavafalls
     pouring down them into a glowing sea, an eruption's light above. Screen px; painted once per state, soft */
  function paintSky(c, W, H, T, o) { o = o || {}; const calm = o.calm || 0, R = rnd(o.seed || 77);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#080203'); g.addColorStop(0.45, calm ? '#160807' : '#2A0B06'); g.addColorStop(0.8, calm ? '#2A0E08' : '#5A1A08'); g.addColorStop(1, calm ? '#3A1408' : '#8A2A0A'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // the eruption's light high up, and smoke rolling through it
    if (!calm) { const eg = c.createRadialGradient(W * 0.55, H * 0.05, 0, W * 0.55, H * 0.05, W * 0.55); eg.addColorStop(0, 'rgba(255,120,40,.35)'); eg.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = eg; c.fillRect(0, 0, W, H * 0.6); }
    for (let i = 0; i < 14; i++) { const x = R() * W, y = R() * H * 0.45, r = W * (0.08 + R() * 0.14); const sg = c.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, `rgba(20,12,12,${0.35 + R() * 0.3})`); sg.addColorStop(1, 'rgba(20,12,12,0)'); c.fillStyle = sg; c.fillRect(x - r, y - r, r * 2, r * 2); }
    // three ridges of the caldera's wall, the nearest darkest, each rim lit from the lava below
    for (let L = 0; L < 3; L++) { const base = H * (0.42 + L * 0.14), amp = H * (0.12 - L * 0.025), pts = []; for (let i = 0; i <= 24; i++) { const x = i / 24 * W; pts.push([x, base - amp * (0.5 + 0.5 * Math.sin(i * 0.9 + L * 2 + R() * 0.8)) - R() * amp * 0.4]); }
      c.beginPath(); c.moveTo(0, H); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(W, H); c.closePath(); const rg = c.createLinearGradient(0, base - amp, 0, H); rg.addColorStop(0, ['#2A1A18', '#1E1211', '#140B0A'][L]); rg.addColorStop(1, '#080404'); c.fillStyle = rg; c.fill();
      c.strokeStyle = `rgba(255,${110 + L * 20},50,${0.25 + L * 0.1})`; c.lineWidth = 1 + L * 0.6; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
      // lavafalls pouring down this ridge
      const nf = L === 0 ? 3 : L === 1 ? 3 : 2; for (let k = 0; k < nf; k++) { const x = W * (0.08 + R() * 0.84), top = pts[Math.round(x / W * 24)][1] + 2, w = (4 + L * 5) * (0.7 + R() * 0.6) * (W / 400), bot = Math.min(H, top + H * (0.2 + L * 0.1));
        const fg = c.createLinearGradient(0, top, 0, bot); fg.addColorStop(0, calm ? 'rgba(200,70,20,.6)' : '#FFD27A'); fg.addColorStop(0.5, calm ? 'rgba(180,50,15,.5)' : '#FF7A2A'); fg.addColorStop(1, 'rgba(255,90,30,0)'); c.fillStyle = fg; c.beginPath(); c.moveTo(x - w * 0.5, top); c.quadraticCurveTo(x - w * 0.6, (top + bot) / 2, x - w, bot); c.lineTo(x + w, bot); c.quadraticCurveTo(x + w * 0.6, (top + bot) / 2, x + w * 0.5, top); c.closePath(); c.fill();
        const gl = c.createRadialGradient(x, top + (bot - top) * 0.5, 0, x, top + (bot - top) * 0.5, w * 6); gl.addColorStop(0, `rgba(255,110,40,${calm ? 0.12 : 0.25})`); gl.addColorStop(1, 'rgba(255,110,40,0)'); c.fillStyle = gl; c.fillRect(x - w * 6, top, w * 12, bot - top);
        const mg = c.createRadialGradient(x, bot - (bot - top) * 0.1, 0, x, bot - (bot - top) * 0.1, w * 4); mg.addColorStop(0, `rgba(120,90,80,${calm ? 0.1 : 0.22})`); mg.addColorStop(1, 'rgba(120,90,80,0)'); c.fillStyle = mg; c.fillRect(x - w * 4, bot - (bot - top) * 0.1 - w * 4, w * 8, w * 8); } }
    // the glowing sea far below
    const sg = c.createLinearGradient(0, H * 0.8, 0, H); sg.addColorStop(0, 'rgba(255,90,30,0)'); sg.addColorStop(1, calm ? 'rgba(200,60,20,.35)' : 'rgba(255,110,40,.6)'); c.fillStyle = sg; c.fillRect(0, H * 0.8, W, H * 0.2);
    // falling embers, specks of light
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,${150 + Math.floor(R() * 90)},${60 + Math.floor(R() * 60)},${(0.2 + R() * 0.6) * (calm ? 0.4 : 1)})`; c.beginPath(); c.arc(R() * W, R() * H, 0.6 + R() * 1.2, 0, TAU); c.fill(); }
    if (o.heart) { const hg = c.createRadialGradient(W / 2, H * 0.32, 0, W / 2, H * 0.32, W * 0.3); hg.addColorStop(0, 'rgba(255,90,42,.3)'); hg.addColorStop(1, 'rgba(255,90,42,0)'); c.fillStyle = hg; c.fillRect(0, 0, W, H); } }
  /* a circular basalt platform of radius R tiles round (0, 0), in world tiles (a fiend def's paintGround): hexagonal
     column tops of fractured basalt, cooled crust with seams (o.seams 0..1), soot and ash, a crumbled rim, its cliff face
     lit by the lava below */
  function paintPlatform(c, R, rnd2, o) { o = o || {}; const Rn = rnd2 || rnd(5), seams = o.seams == null ? 0.7 : o.seams, lw = 0.035;
    // the cliff face below the rim (the platform's side, seen from the south), lit by lava from below
    c.save(); c.beginPath(); c.arc(0, 0.9, R * 1.01, 0, Math.PI); c.arc(0, 0, R * 1.01, Math.PI, 0, true); c.closePath(); const cg = c.createLinearGradient(0, R * 0.3, 0, R + 0.9); cg.addColorStop(0, '#241C1D'); cg.addColorStop(0.7, '#3A2018'); cg.addColorStop(1, '#C24A14'); c.fillStyle = cg; c.fill(); c.restore();
    // the rim outline: jagged
    const N = Math.round(R * 7), rim = []; for (let i = 0; i < N; i++) { const a = i / N * TAU; rim.push([Math.cos(a) * R * (0.985 + Rn() * 0.03), Math.sin(a) * R * (0.985 + Rn() * 0.03)]); }
    c.save(); poly(c, rim); c.closePath(); const fg = c.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R); fg.addColorStop(0, '#463E40'); fg.addColorStop(0.7, '#3A3234'); fg.addColorStop(1, '#2A2324'); c.fillStyle = fg; c.fill(); c.clip();
    // the column tops: the same jittered lattice the trials' floors are made of (one tile = one unit here)
    const rows = Math.ceil(R / (1.5 * HS)) + 1, cols = Math.ceil(R / HW) + 1, cells = [];
    for (let r = -rows; r <= rows; r++) { const off = r & 1 ? HW / 2 : 0; for (let q = -cols; q <= cols; q++) { const cx = q * HW + off, cy = r * 1.5 * HS; if (Math.hypot(cx, cy) > R + HS) continue; const V = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, vx = cx + Math.cos(a) * HS, vy = cy + Math.sin(a) * HS, j = hexJit(vx, vy, 0); V.push([vx + j[0], vy + j[1]]); } cells.push({ cx, cy, q, r, h: hh(q, r, 41), h2: hh(q, r, 57), V }); } }
    for (const cl of cells) { const t = hexTone(cl, 0.16, 0.06); if (t) { poly(c, cl.V); c.closePath(); c.fillStyle = t; c.fill(); } const ash = vnoise(cl.cx / 3.5 + 9, cl.cy / 3.5, 23), soot = vnoise(cl.cx / 4.5, cl.cy / 4.5, 11); if (ash > 0.62 || soot > 0.6) { poly(c, cl.V); c.closePath(); c.fillStyle = ash > 0.62 ? `rgba(175,165,155,${(ash - 0.62) * 0.7})` : `rgba(6,4,4,${(soot - 0.6) * 1.0})`; c.fill(); } }
    c.lineJoin = 'round'; c.strokeStyle = 'rgba(6,4,5,.65)'; c.lineWidth = 0.045; c.beginPath(); for (const cl of cells) for (let k = 0; k < 6; k++) { const a = cl.V[k], b = cl.V[(k + 1) % 6]; c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    c.strokeStyle = 'rgba(255,240,230,.09)'; c.lineWidth = 0.018; c.beginPath(); for (const cl of cells) for (const k of [3, 4]) { const a = cl.V[k], b = cl.V[(k + 1) % 6], ux = cl.cx - (a[0] + b[0]) / 2, uy = cl.cy - (a[1] + b[1]) / 2, L = Math.hypot(ux, uy) || 1; c.moveTo(a[0] + ux / L * 0.035, a[1] + uy / L * 0.035); c.lineTo(b[0] + ux / L * 0.035, b[1] + uy / L * 0.035); } c.stroke();
    if (seams > 0) for (const cl of cells) for (let k = 0; k < 6; k++) { const A = cl.V[k], B = cl.V[(k + 1) % 6], key = hh(Math.round((A[0] + B[0]) * 20), Math.round((A[1] + B[1]) * 20), 77); if (key < 0.05 * seams) seam(c, [A, B], 0.028, 0.85, 0.008); }
    // seams of cooled lava crust running across it
    if (seams > 0) for (let i = 0; i < Math.round(R * 0.25); i++) { let a = Rn() * TAU, r0 = R * (0.25 + Rn() * 0.6), x = Math.cos(a) * r0, y = Math.sin(a) * r0; const pts = [[x, y]]; for (let k = 0; k < 6; k++) { a += (Rn() - 0.5) * 1.2; x += Math.cos(a) * 0.9; y += Math.sin(a) * 0.9; pts.push([x, y]); } seam(c, pts, 0.03, seams * 0.8, 0.008); }
    c.restore();
    // the rim: a band of broken blocks, lit on top, lava light licking the edge
    c.save(); poly(c, rim); c.closePath(); c.strokeStyle = '#1A1415'; c.lineWidth = 0.5; c.stroke(); c.strokeStyle = '#5A5153'; c.lineWidth = 0.18; c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,110,40,.35)'; c.lineWidth = 0.35; c.beginPath(); c.arc(0, 0.1, R * 1.0, 0.1, Math.PI - 0.1); c.stroke(); c.restore(); }
  /* props round an arena's edge: basalt columns, black crystals and lavafalls at the back, small pieces in front */
  function ringProps(C, o) { o = o || {}; const out = [], R = rnd(o.seed || 4242), n = o.n || 22, back = o.back || ['basaltcol', 'lavafall', 'blackcrystal', 'basaltcol', 'bigcrystal', 'lavafall', 'basaltcol', 'blackcrystal'], front = o.front || ['ashmound', 'glassspire', 'blackcrystal', 'ashmound'];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + (R() - 0.5) * 0.1, isBack = Math.sin(a) < 0.15, kind = isBack ? back[i % back.length] : front[i % front.length], s = isBack ? 0.85 + R() * 0.3 : 0.6 + R() * 0.15;
      out.push({ kind, i, v: Math.floor(R() * 12), s, x: C.x + Math.cos(a) * (C.R + (isBack ? 1.8 : 1.0)), y: C.y + Math.sin(a) * (C.R + (isBack ? 1.4 : 0.6)) }); }
    return out; }
  Object.assign(CAL, { paintSky, paintPlatform, ringProps });

  /* ======================= the rift ======================= */
  const SEALING = { fall: 'THE HEART OF THE VOLCANO GOES DARK', sub: 'Ifrit settles into a dark, inert statue; the lava slows and the black crystals lose their glow', sigil: 'THE EMBER SIGIL', name: 'The Blackfire Caldera', color: '#FF8A3D',
    onFall() { const C = CUR; if (C) C.calmTo = 1; } };
  CAL.calm = X => { const C = X ? ctx(X) : CUR; return C ? C.calm || 0 : 0; };
  CAL.setCalm = (X, k) => { const C = ctx(X); C.calmTo = k; };
  const ST = (typeof CAL_STAGES !== 'undefined' && CAL_STAGES) || {};
  /* placeholder trials (until 20zz4's CAL_STAGES is in): a ledge, a lava channel with a bridge, packs of the section's
     brood, a frost well and black crystals, the recovery station and the way on once the floor is clear */
  const PH = {
    ashen: { packs: { a: { mons: ['cinderslug', 'cinderslug'] }, b: { mons: ['basaltcrawler'] }, c: { mons: ['emberwisp', 'cinderslug'] } }, deco: ['k', 'k', 'w', 'q'], lava: true },
    foundry: { packs: { a: { mons: ['furnaceimp', 'furnaceimp'] }, b: { mons: ['runicsentinel'] }, c: { mons: ['bomblarva', 'furnaceimp'] } }, deco: ['v', 'f', 'h', 'k'], lava: true },
    heartward: { packs: { a: { mons: ['ashenknight'] }, b: { mons: ['crystalwisp', 'cinderslug'] }, c: { mons: ['ashenknight', 'crystalwisp'] } }, deco: ['g', 'k', 'q', 'l'], lava: true, vents: true },
  };
  const PH_LEGEND = { k: { prop: 'blackcrystal' }, g: { prop: 'bigcrystal' }, q: { prop: 'basaltcol' }, w: { prop: 'frostwell' }, l: { prop: 'lavafall' }, v: { prop: 'vessel' }, f: { prop: 'forge' }, h: { prop: 'chains' }, s: { prop: 'glassspire' }, m: { prop: 'ashmound' }, n: { prop: 'anvil' }, o: { prop: 'slabhang' }, r: { prop: 'metalring' } };
  function placeholder(biome, name, goal) { const D = PH[biome], Wd = 25, Hh = 40, g = Array.from({ length: Hh }, () => Array(Wd).fill('~'));
    const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && g[y][x] != null) g[y][x] = ch || '.'; };
    const blob = (cx, cy, rx, ry) => { for (let y = 0; y < Hh; y++) for (let x = 0; x < Wd; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1) g[y][x] = '.'; };
    blob(12.5, 34.5, 6.5, 4.6); blob(12.5, 23.5, 9.5, 5.4); blob(12.5, 9.5, 9.0, 6.4); rect(11, 28, 13, 31); rect(11, 16, 13, 18, '='); rect(10, 2, 14, 4);
    g[36][12] = 'S'; g[3][12] = 'E'; g[6][15] = 'R'; g[22][7] = 'a'; g[22][18] = 'b'; g[9][8] = 'c'; g[11][17] = 'P'; g[25][12] = 'V';
    // props round the ledges (on rock: the gap's rim)
    const spots = [[4, 22], [21, 23], [5, 9], [20, 8], [6, 33], [19, 35], [3, 14], [21, 14]]; spots.forEach(([x, y], i) => { g[y][x] = '#'; g[y][x] = D.deco[i % D.deco.length]; });
    const layout = g.map(r => r.join(''));
    const legend = Object.assign({}, PH_LEGEND, D.packs, { E: {}, R: {}, P: {}, V: {} });
    return { name, goal, how: goal, layout, legend, make(X, self, H) { const mk = X.M.marks, E = mk.E[0];
      H.spawnPacks(); recoveryStation(X, H, mk.R[0].x, mk.R[0].y);
      if (D.lava && mk.P) lavaPool(X, { x: mk.P[0].x, y: mk.P[0].y, r: 1.3 });
      if (mk.V) { const v = mk.V[0]; if (D.vents) vent(X, { x: v.x, y: v.y, r: 1.0, period: 4.2, warn: 1.6, erupt: 0.9 }); else lavaPool(X, { x: v.x - 3, y: v.y, r: 0.9 }); }
      return { update() { if (!self.done && H.monstersLeft() === 0) { self.done = true; H.setExit(E.x, E.y, 'The way on'); X.banner('THE WAY IS CLEAR', 'Rest at the frost spring, then go on', '#8FE0A6', 2.4, true); } }, goal: () => self.done ? 'The way on is open' : `${H.monstersLeft()} left · ${goal}` }; } }; }
  const Rf = defRift({
    ease: 1, monCount: 0.6, liveCap: 34,   // (ease 1: no change in strength, but it holds the dungeons' elites to the Tower's own share, none at level 1; about fifty to a dungeon, thirty-four on the field at once)
    typeShare: Object.assign(Object.fromEntries(Object.keys(MON).filter(t => !['cinderslug', 'basaltcrawler', 'emberwisp', 'furnaceimp', 'runicsentinel', 'bomblarva', 'ashenknight', 'crystalwisp', 'rimewisp', 'shardling', 'geodeling'].includes(t)).map(t => [t, 0])), { bomblarva: 0.1, runicsentinel: 0.14, geodeling: 0.22, basaltcrawler: 0.22, furnaceimp: 0.3, shardling: 0.32, emberwisp: 0.35, cinderslug: 0.4, rimewisp: 0.35, crystalwisp: 0.3, ashenknight: 0.25 }),   // (only the brood: no Tower strays in the dungeons)
    id: 'caldera', n: 0, name: 'The Blackfire Caldera', lvl: 1, sigil: 'Ember', biome: 'ashen', aff: ['fire', 'earth'], region: 'the volcano', gate: null,
    blurb: 'An active volcano, its caverns, its ancient runic forge and its burning caldera. Route the cold, return the bombs, take shelter from the fire, and quiet the living heart of the mountain.',
    mons: ['cinderslug', 'basaltcrawler', 'emberwisp', 'furnaceimp', 'runicsentinel', 'bomblarva', 'ashenknight', 'crystalwisp'], sealing: SEALING,
    stages: riftSections([
      { biome: 'ashen', pattern: ['fight', 'trial', 'boss'], mods: [], fights: [DUNGEON.ashen.fight], mobs: DUNGEON.ashen.mobs, extra: dungeonExtra('ashen'), trials: [ST.HOLLOWS || placeholder('ashen', 'The Ashen Hollows', 'Cross the hollows')], boss: 'calflan', bossName: 'Fire Flan', bossRoom: 'Fire Flan' },
      { biome: 'foundry', pattern: ['fight', 'trial', 'boss'], mods: [], fights: [DUNGEON.rimeforge.fight], mobs: DUNGEON.rimeforge.mobs, extra: dungeonExtra('rimeforge'), trials: [ST.FOUNDRY || placeholder('foundry', 'The Runebound Foundry', 'Cross the foundry')], boss: 'calbomb', bossName: 'Bomb King', bossRoom: 'Bomb King' },
      { biome: 'heartward', pattern: ['fight', 'trial', 'boss'], mods: [], fights: [DUNGEON.glassheart.fight], mobs: DUNGEON.glassheart.mobs, extra: dungeonExtra('glassheart'), trials: [ST.DESCENT || placeholder('heartward', 'The Heartward Descent', 'Descend to the crucible')], boss: 'califrit', bossName: 'Ifrit, Heart of the Volcano', bossRoom: 'Ifrit, Heart of the Volcano' },
    ]),
  });
  // (the dungeons' lands: the ashen as it is, the rimebound forge, the glass heart)
  { const FB = ['ashen', 'rimeforge', 'glassheart']; let fi = 0; for (const S of Rf.stages) if (S.kind === 'fight') S.biome = FB[fi++] || S.biome; }
  for (const S of Rf.stages) if (S.kind === 'boss') { S.biome = 'calderapit'; S.make = (X, self, H) => (CAL.bossMake[S.boss] && CAL.bossMake[S.boss](X, self, H)) || {}; }
  /* the seal's reward: a beginner fire-themed bracelet (21b maps caldera → 'ember'; its look: CAL.emberAccSVG / CAL.emberAccDraw) */
  if (typeof ACC_SPECIAL !== 'undefined') ACC_SPECIAL.ember = { t: 'bracelet', name: 'Ember Charm', what: 'A sliver of black fire crystal, cooled and harmless, bound in rune-cut iron on a soot-dark band: the Ember Sigil of the Blackfire Caldera. It stays faintly warm.' };
  CAL.emberAccSVG = n => { const id = `acem${n}`; return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#4E3470"/><stop offset=".5" stop-color="#17101F"/><stop offset="1" stop-color="#08060C"/></linearGradient></defs>`
    + `<ellipse cx="32" cy="36" rx="25" ry="15" fill="none" stroke="#2B2433" stroke-width="9"/><ellipse cx="32" cy="36" rx="25" ry="15" fill="none" stroke="#2A2426" stroke-width="5.6"/><ellipse cx="32" cy="36" rx="25" ry="15" fill="none" stroke="#6E6A70" stroke-width="1.4" stroke-dasharray="4 6"/>`
    + `<rect x="22" y="42" width="20" height="11" rx="2.5" fill="#3A383D" stroke="#2B2433" stroke-width="2.4"/><path d="M27 45v5M32 44.5l-2.5 3 2.5 3 2.5-3z M37 45v5" fill="none" stroke="#FFB347" stroke-width="1.3" stroke-linecap="round"/>`
    + `<path d="M32 18L38 30L35 44H29L26 30Z" fill="url(#${id})" stroke="#2B2433" stroke-width="2.4" stroke-linejoin="round"/><path d="M31 22L33 29L30.5 34L33 40" fill="none" stroke="#FF5A2A" stroke-width="2.2" stroke-linecap="round"/><path d="M31 22L33 29L30.5 34L33 40" fill="none" stroke="#FFB070" stroke-width="0.9" stroke-linecap="round"/><path d="M28.5 29L31 21" stroke="#E6D2FF" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`; };
  CAL.emberAccDraw = (c, x, y, s) => { c.save(); c.strokeStyle = '#2B2433'; c.lineWidth = s * 0.44; c.beginPath(); c.ellipse(x, y, s * 0.72, s * 0.46, 0, 0, TAU); c.stroke(); c.strokeStyle = '#2A2426'; c.lineWidth = s * 0.28; c.stroke(); crystalArt(c, x, y + s * 0.42, s * 0.9, { v: 3, k: 0.6, lw: Math.max(1, s * 0.06) }); c.restore(); };

  /* ======================= every stage: lava, vents, bombs, embers, crystal pulses ======================= */
  Object.assign(PULSERS, { blackcrystal: 1, bigcrystal: 1.4, slabhang: 0.6 });
  Rf.everyStage = (X, self, H) => { const C = ctx(X); C.X = X; CUR = C; FAR.here = !!(self.S && self.S.name === 'The Ashen Hollows'); C.calm = C.calm || 0; C.calmTo = C.calmTo || 0; C.flowT = C.flowT || 0;
    const fiend = !!X.F.fiend, T0 = () => X.Tz();
    // the props' live lights, and the crystals that pulse toward the heart
    const glows = [], pulsers = []; for (const p of X.props || []) { if (p.broken) continue; /* (QA: the props cleared from the exit) */ const f = GLOWS[p.kind]; if (f) for (const [dx, dy, r, kind] of f(p.v | 0)) glows.push({ p, dx, dy, r, kind, ph: hh(p.k || 0, 1, 3) }); if (PULSERS[p.kind]) pulsers.push({ p, k: PULSERS[p.kind], t: 1 + hh(p.k || 0, 2, 5) * 4 }); }
    for (const q of glows) q.pul = pulsers.find(z => z.p === q.p) || null;
    // the ground beside the lava gaps: a live flicker of lava light along their edges (every other tile)
    const edges = []; if (!fiend) { const { MW, MH, G } = X.M; for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) { const t = G[y * MW + x]; if (t === T_GAP || t === T_SOLID) continue; for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (G[(y + dy) * MW + x + dx] === T_GAP && ((x + y) & 1)) { edges.push([x + 0.5 + dx * 0.5, y + 0.5 + dy * 0.5, hh(x, y, 13) * 6]); break; } } }
    return { CAL, C, H, glows, pulsers, edges,
      update(dt) { CUR = C; C.X = X; C.t += dt; C.calm += (C.calmTo - C.calm) * Math.min(1, dt * 0.6); C.flowT += dt * (1 - 0.75 * C.calm); C.burnT = Math.max(0, C.burnT - dt); const me = X.me;
        // the lava rule: last safe ground, then contact
        C.safeT -= dt; if (C.safeT <= 0 && !me.dead && !me.dodge) { C.safeT = 0.15; if (!inLava(X, me.x, me.y, 0.7)) { const l = C.safe[C.safe.length - 1]; if (!l || Math.hypot(l.x - me.x, l.y - me.y) > 0.2) { C.safe.push({ x: me.x, y: me.y }); if (C.safe.length > 14) C.safe.shift(); } } }
        if (!me.dead && !me.dodge && C.lava.length && inLava(X, me.x, me.y, 0.05)) lavaTouch(X);
        for (const v of C.vents) ventTick(C, v, dt);
        for (const f of C.flights) flightTick(C, f, dt); for (let i = C.flights.length - 1; i >= 0; i--) if (C.flights[i].done) C.flights.splice(i, 1);
        for (let i = C.larvae.length - 1; i >= 0; i--) if (C.larvae[i].dead) C.larvae.splice(i, 1);
        // embers drifting up through the air (decoration: fewer under "Fewer effects", fewer still once the heart is quiet)
        const want = Math.round((lowFx() ? 10 : 34) * (1 - 0.7 * C.calm)), cam = me, W = X.W() / T0(), Hh = X.H() / T0();
        // (P, perf: pooled; a spent ember's object is reused for the next, and the list is compacted in place)
        if (C.embers.length < want && Math.random() < dt * 12) { const e = (C.emPool || (C.emPool = [])).pop() || {}; e.frost = X.F.biome === 'rimeforge' && Math.random() < 0.65; e.x = cam.x + (Math.random() - 0.5) * W * 1.1; e.y = cam.y + Hh * (0.1 + Math.random() * 0.5); e.vx = (Math.random() - 0.5) * 0.4; e.vy = -(0.5 + Math.random() * 0.9); e.t = 0; e.life = 3 + Math.random() * 3; e.s = 0.6 + Math.random() * 0.9; e.ph = Math.random() * 6; C.embers.push(e); }
        { let n = 0; for (const e of C.embers) { e.t += dt; e.x += (e.vx + Math.sin(e.t * 1.7 + e.ph) * 0.25) * dt; e.y += e.vy * dt; if (e.t > e.life) { if (C.emPool && C.emPool.length < 48) C.emPool.push(e); } else C.embers[n++] = e; } C.embers.length = n; }
        // the crystals' pulses toward the heart
        if (!lowFx() && C.calm < 0.5) { const [hx, hy] = heartDir(X); for (const q of pulsers) { q.t -= dt; if (q.t > 0) continue; q.t = 3 + Math.random() * 4; const p = q.p; if (Math.abs(p.x - me.x) > 14 || Math.abs(p.y - me.y) > 16) continue; C.pulses.push({ x: p.x, y: p.y - 0.2, ux: hx, uy: hy, t: 0, life: 1.8, len: 2.5 + q.k * 1.5, k: q.k, src: q }); q.flash = 1; } }
        for (const q of pulsers) if (q.flash) q.flash = Math.max(0, q.flash - dt * 1.4);
        for (const u of C.pulses) u.t += dt; for (let i = C.pulses.length - 1; i >= 0; i--) if (C.pulses[i].t > C.pulses[i].life) C.pulses.splice(i, 1); },
      drawGround(c) { const T = T0(), t = X.g.t, W = X.W(), Hh = X.H(), on = (x, y, m) => { const Xs = X.sx(x), Ys = X.sy(y); return Xs > -m && Xs < W + m && Ys > -m && Ys < Hh + m; };
        // lava light flickering along the gaps' edges
        if (!lowFx() && edges.length) { c.save(); c.globalCompositeOperation = 'lighter'; const spr = glowSprite('#FF6A1F'); for (const [x, y, ph] of edges) { if (!on(x, y, T)) continue; const k = 0.18 + 0.1 * Math.sin(t * 1.6 + ph) * (1 - 0.6 * C.calm); c.globalAlpha = k; c.drawImage(spr, X.sx(x) - T * 0.7, X.sy(y) - T * 0.45, T * 1.4, T * 0.9); } c.restore(); }
        for (const p of C.lava) lavaPoolArt(c, X, p);
        for (const v of C.vents) ventArt(c, X, v);
        // the crystals' pulses running along the floor toward the heart
        if (C.pulses.length) { c.save(); c.globalCompositeOperation = 'lighter'; for (const u of C.pulses) { const f = u.t / u.life, d = f * u.len, a = Math.sin(f * Math.PI); const hx = u.x + u.ux * d, hy = u.y + u.uy * d; c.strokeStyle = rgba(FRACTURE, 0.5 * a); c.lineWidth = Math.max(1.5, T * 0.06); c.lineCap = 'round'; c.beginPath(); c.moveTo(X.sx(u.x + u.ux * Math.max(0, d - 1.2)), X.sy(u.y + u.uy * Math.max(0, d - 1.2))); c.lineTo(X.sx(hx), X.sy(hy)); c.stroke(); c.globalAlpha = a; blitSized(c, glowSprite(FRACTURE_HI), X.sx(hx) - T * 0.35, X.sy(hy) - T * 0.35, T * 0.7, T * 0.7); c.globalAlpha = 1; } c.restore(); }
        // the bombs on the floor: their damage circle and fuse, the safe ring, the aim guide to their target
        for (const m of X.mons) if (m.type === 'bomblarva' && !m.dead && m.cal) larvaGround(c, X, m); },
      drawOver(c) { const T = T0(), t = X.g.t, W = X.W(), Hh = X.H(), dim = C.calm, G = gpu(c, true);
        // the props' live light: crystals' fire circling inside them, the lavafalls and forge mouths breathing
        for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y) + q.dy * T; if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 3 || Ys > Hh + T * 3) continue;
          if (q.kind === 'cry') { const pl = q.pul ? q.pul.flash || 0 : 0, k = (0.3 + 0.15 * Math.sin(t * 0.9 + q.ph * 6) + 0.6 * pl) * (1 - 0.85 * dim), a = t * 0.5 + q.ph * TAU; const lx = Xs + Math.cos(a) * q.r * T * 0.25, ly = Ys + Math.sin(a * 1.3) * q.r * T * 0.45;
            if (G) { G.Q.glow(lx, ly, q.r * T * 0.7, FRACTURE, k * 0.8); G.Q.eorb(lx, ly, q.r * T * 0.2, FRACTURE, 0.8, k * 0.7, q.ph * 9, 1); } else { glow(c, lx, ly, q.r * T * 0.75, FRACTURE, k); glow(c, lx, ly, q.r * T * 0.25, FRACTURE_HI, k * 0.8); } }
          else if (q.kind === 'lava') { const k = (0.35 + 0.12 * Math.sin(t * 2.1 + q.ph * 6)) * (1 - 0.5 * dim); if (G) { G.Q.glow(Xs, Ys, q.r * T * 1.4, LAVA, k); if (!lowFx()) G.Q.fire(Xs, Ys - T * 0.1, q.r * T * 0.45, 0.8, k * 0.8, q.ph * 7); } else glow(c, Xs, Ys, q.r * T * 1.4, LAVA, k); }
          else if (q.kind === 'forge') { const k = 0.45 + 0.15 * Math.sin(t * 3.1 + q.ph * 6); if (G) { G.Q.glow(Xs, Ys, q.r * T, LAVA, k); G.Q.fire(Xs, Ys + T * 0.1, q.r * T * 0.35, 0.9, k, q.ph * 5); } else glow(c, Xs, Ys, q.r * T, LAVA, k); }
          else if (q.kind === 'frost') glow(c, Xs, Ys, q.r * T * 1.3, FROST, 0.18 + 0.06 * Math.sin(t * 1.5 + q.ph * 6));
          else if (q.kind === 'coal') glow(c, Xs, Ys, q.r * T, LAVA, (0.16 + 0.08 * Math.sin(t * 2.6 + q.ph * 9)) * (1 - 0.6 * dim)); }
        // the returned bombs in flight: the iron capsule on a trail of fire
        for (const f of C.flights) { const Xs = X.sx(f.x), Ys = X.sy(f.y - f.z); if (G) { for (let i = 0; i < f.trail.length - 1; i++) { const a = f.trail[i], b = f.trail[i + 1], k = 1 - i / f.trail.length; G.Q.firebeam(X.sx(a[0]), X.sy(a[1]), X.sx(b[0]), X.sy(b[1]), T * 0.22 * k, 0.9, 0.8 * k, i * 0.7, 5); } } else { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < f.trail.length - 1; i++) { const a = f.trail[i], b = f.trail[i + 1], k = 1 - i / f.trail.length; c.strokeStyle = rgba(i < 2 ? LAVA_HI : LAVA, 0.8 * k); c.lineWidth = T * 0.28 * k; c.beginPath(); c.moveTo(X.sx(a[0]), X.sy(a[1])); c.lineTo(X.sx(b[0]), X.sy(b[1])); c.stroke(); } c.restore(); }
          const s = DunArt.monSprite('bomblarva', 0.36 * T, (f.t * 3) % 1, '#4A464E', 'red2', false); c.save(); c.translate(Xs, Ys); c.rotate(f.t * 9); c.drawImage(s.cv, -s.half, -s.half, s.half * 2, s.half * 2); c.restore(); glow(c, Xs, Ys, T * 0.6, LAVA_HI, 0.5); }
        // embers drifting up
        if (C.embers.length) { if (G) for (const e of C.embers) { const a = Math.sin(e.t / e.life * Math.PI); G.Q.glow(X.sx(e.x), X.sy(e.y), T * 0.09 * e.s, e.frost ? '#9FD8FF' : LAVA, a * 0.9); G.Q.glow(X.sx(e.x), X.sy(e.y), T * 0.03 * e.s, e.frost ? '#FFFFFF' : LAVA_HI, a); }
          else { c.save(); c.globalCompositeOperation = 'lighter'; for (const e of C.embers) { const a = Math.sin(e.t / e.life * Math.PI); c.globalAlpha = a * 0.85; c.fillStyle = e.frost ? (e.s > 1.1 ? '#FFFFFF' : '#BFE3FA') : e.s > 1.1 ? LAVA_HI : LAVA; const Xs = X.sx(e.x), Ys = X.sy(e.y); if (Xs < -5 || Xs > W + 5 || Ys < -5 || Ys > Hh + 5) continue; c.beginPath(); c.arc(Xs, Ys, Math.max(0.8, T * 0.035 * e.s), 0, TAU); c.fill(); } c.restore(); } }
        gpuEnd(c, G);
        // the bombs' words: HIT IT! while they are safe, GET CLEAR! when they flash, the seconds left
        for (const m of X.mons) if (m.type === 'bomblarva' && !m.dead && m.cal) larvaOver(c, X, m);
        for (const v of C.vents) if (v.demo && v.on) label(c, 'SAFE TO WATCH', X.sx(v.x), X.sy(v.y) - T * 1.5, Math.max(11, T * 0.28), ASH_HI); } }; };
  /* a lava pool on the floor: a crusted rim, the molten surface (the gap's own lava pinned to the world), its glow */
  function lavaPoolArt(c, X, p) { const T = X.Tz(), C = ctx(X), W = X.W(), Hh = X.H(); if (p.off) return; const pat = DunWorld.pattern('calderalava', 1), sc = T * 2.6 / 128, fl = C.flowT || C.t;
    try { pat.setTransform(new DOMMatrix([sc, 0, 0, sc, X.sx(0) + fl * T * 0.25, X.sy(0) + fl * T * 0.12])); } catch (e) {}
    c.save();
    if (p.kind === 'pool') { const Xs = X.sx(p.x), Ys = X.sy(p.y), R = p.r * T; if (Xs < -R * 2 || Xs > W + R * 2 || Ys < -R * 2 || Ys > Hh + R * 2) { c.restore(); return; }
      const Rr = rnd(p.seed || 3), N = 16, rim = []; for (let i = 0; i < N; i++) { const a = i / N * TAU; rim.push([Xs + Math.cos(a) * R * (1.05 + Rr() * 0.12), Ys + Math.sin(a) * R * (1.05 + Rr() * 0.12)]); }
      poly(c, rim); c.closePath(); c.fillStyle = '#1A0E0C'; c.fill(); ink(c, Math.max(1.2, T * 0.04), 0.8);
      ell(c, Xs, Ys, R, R); c.fillStyle = '#FF6A1F'; c.fill(); c.fillStyle = pat; c.fill();
      const g = c.createRadialGradient(Xs, Ys, R * 0.2, Xs, Ys, R); g.addColorStop(0, 'rgba(255,230,150,.25)'); g.addColorStop(0.8, 'rgba(255,90,30,0)'); g.addColorStop(1, 'rgba(60,14,6,.55)'); c.fillStyle = g; c.fill();
      glow(c, Xs, Ys, R * 2.1, LAVA, 0.32 + 0.08 * Math.sin(C.t * 2 + (p.seed || 0)));
      // its hazard ring (never colour alone: a dashed warning edge)
      c.setLineDash([T * 0.2, T * 0.14]); c.strokeStyle = 'rgba(255,77,109,.55)'; c.lineWidth = Math.max(1.5, T * 0.05); ell(c, Xs, Ys, R * 1.18, R * 1.18); c.stroke(); c.setLineDash([]); }
    else { c.beginPath(); for (const t of p.tiles) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); if (Xs < -T * 2 || Xs > W + T || Ys < -T * 2 || Ys > Hh + T) continue; c.rect(Xs, Ys, T + 0.5, T + 0.5); } c.fillStyle = '#FF6A1F'; c.fill(); c.fillStyle = pat; c.fill();
      c.save(); c.clip(); c.globalCompositeOperation = 'lighter'; for (const t of p.tiles) { const Xs = X.sx(t.tx + 0.5), Ys = X.sy(t.ty + 0.5); if (Xs < -T * 2 || Xs > W + T * 2 || Ys < -T * 2 || Ys > Hh + T * 2) continue; c.globalAlpha = 0.25; c.drawImage(glowSprite(LAVA_HI), Xs - T * 0.8, Ys - T * 0.8, T * 1.6, T * 1.6); } c.restore();
      c.strokeStyle = '#1A0E0C'; c.lineWidth = Math.max(2, T * 0.08); for (const t of p.tiles) { const MW = p.MW, x = t.tx, y = t.ty, has = (dx, dy) => p.set.has((y + dy) * MW + x + dx), Xs = X.sx(x), Ys = X.sy(y); if (Xs < -T * 2 || Xs > W + T || Ys < -T * 2 || Ys > Hh + T) continue; c.beginPath(); if (!has(0, -1)) { c.moveTo(Xs, Ys); c.lineTo(Xs + T, Ys); } if (!has(0, 1)) { c.moveTo(Xs, Ys + T); c.lineTo(Xs + T, Ys + T); } if (!has(-1, 0)) { c.moveTo(Xs, Ys); c.lineTo(Xs, Ys + T); } if (!has(1, 0)) { c.moveTo(Xs + T, Ys); c.lineTo(Xs + T, Ys + T); } c.stroke(); } }
    c.restore(); }
  CAL.lavaPoolArt = lavaPoolArt;
  /* a vent: a crusted mouth in the floor; it glows and hisses (a ring fills toward the eruption), then a column of fire */
  function ventArt(c, X, v) { const T = X.Tz(), Xs = X.sx(v.x), Ys = X.sy(v.y), R = v.r * T, t = X.g.t; c.save();
    ell(c, Xs, Ys, R * 0.75, R * 0.42); c.fillStyle = '#120A0A'; c.fill(); ink(c, Math.max(1.2, T * 0.04), 0.9); c.strokeStyle = '#4A4042'; c.lineWidth = Math.max(2, T * 0.1); ell(c, Xs, Ys, R * 0.82, R * 0.48); c.stroke();
    const st2 = v.st, u = st2 === 'warn' ? v.t / v.warn : 0;
    ell(c, Xs, Ys, R * 0.55, R * 0.28); c.fillStyle = st2 === 'erupt' ? '#FFE6A0' : st2 === 'warn' ? rgba(LAVA, 0.4 + 0.6 * u) : 'rgba(255,90,30,.35)'; c.fill();
    if (st2 === 'warn') { c.fillStyle = rgba(WARN, 0.12 + 0.2 * u); c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.fill(); c.strokeStyle = 'rgba(20,6,6,.6)'; c.lineWidth = Math.max(3, T * 0.12); c.stroke(); c.strokeStyle = WARN; c.lineWidth = Math.max(2, T * 0.07); c.beginPath(); c.arc(Xs, Ys, R, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); glow(c, Xs, Ys, R * 1.4, LAVA, 0.3 + 0.4 * u);
      c.strokeStyle = 'rgba(200,190,180,.5)'; c.lineWidth = Math.max(1, T * 0.03); for (let i = 0; i < 3; i++) { const w = Math.sin(t * 14 + i * 2) * R * 0.1; c.beginPath(); c.moveTo(Xs + (i - 1) * R * 0.3, Ys - R * 0.1); c.quadraticCurveTo(Xs + (i - 1) * R * 0.3 + w, Ys - R * 0.6, Xs + (i - 1) * R * 0.35 - w, Ys - R * (0.9 + u * 0.4)); c.stroke(); } }
    if (st2 === 'erupt') { const k = 1 - v.t / v.erupt, G = gpu(c, false); if (G) { for (let i = 0; i < 3; i++) G.Q.tongue(Xs + (i - 1) * R * 0.25, Ys, R * 0.45, T * (2.2 + i % 2) * (0.6 + 0.4 * k), (i - 1) * 0.12, 1.0, 0.9 * k + 0.1, i * 3.1 + v.n); G.Q.glow(Xs, Ys - T, R * 2.2, LAVA, 0.6 * k); gpuEnd(c, G); }
      else { const g = c.createLinearGradient(0, Ys, 0, Ys - T * 2.8); g.addColorStop(0, 'rgba(255,240,180,.95)'); g.addColorStop(0.4, 'rgba(255,140,50,.8)'); g.addColorStop(1, 'rgba(255,80,30,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(Xs - R * 0.6, Ys); c.quadraticCurveTo(Xs - R * 0.9, Ys - T * 1.4, Xs - R * 0.2 + Math.sin(t * 20) * R * 0.1, Ys - T * 2.8 * (0.6 + 0.4 * k)); c.quadraticCurveTo(Xs + R * 0.9, Ys - T * 1.4, Xs + R * 0.6, Ys); c.closePath(); c.fill(); glow(c, Xs, Ys - T, R * 2.2, LAVA, 0.6 * k); } }
    c.restore(); }
  CAL.ventArt = ventArt;
  /* a grounded bomb's floor cues: the damage circle with its fuse running round it, the green safe ring, the aim guide */
  function larvaGround(c, X, m) { const L = m.cal, T = X.Tz(), Xs = X.sx(m.x), Ys = X.sy(m.y), t = X.g.t; if (L.st !== 'safe' && L.st !== 'red' && L.st !== 'land') return;
    c.save(); const R = L.r * T;
    if (L.st === 'land') { c.setLineDash([T * 0.2, T * 0.15]); c.strokeStyle = 'rgba(255,227,122,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(X.sx(L.tx), X.sy(L.ty), T * 0.8, 0, TAU); c.stroke(); c.setLineDash([]); c.restore(); return; }
    const fuseLeft = L.st === 'safe' ? (L.fuse - L.t) / L.fuse : (L.fuse - L.safe - L.t) / L.fuse;
    if (L.st === 'red') { const left = Math.max(0, L.fuse - L.safe - L.t), u = 1 - left / (L.fuse - L.safe); c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.fillStyle = rgba(WARN, 0.12 + 0.2 * u + 0.08 * Math.sin(t * 20)); c.fill(); c.strokeStyle = 'rgba(20,6,8,.7)'; c.lineWidth = Math.max(4, T * 0.14); c.stroke(); c.strokeStyle = WARN; c.lineWidth = Math.max(2.5, T * 0.08); c.stroke();
      c.strokeStyle = rgba('#FFFFFF', 0.7); c.lineWidth = 2; c.beginPath(); c.arc(Xs, Ys, R * (1 + (1 - u) * 0.6), 0, TAU); c.stroke(); }
    else { c.setLineDash([T * 0.18, T * 0.16]); c.strokeStyle = 'rgba(255,77,109,.45)'; c.lineWidth = Math.max(1.5, T * 0.04); c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.stroke(); c.setLineDash([]);
      // the safe ring round the bomb, beating
      const k = 0.6 + 0.4 * Math.sin(t * 8); c.strokeStyle = 'rgba(10,30,16,.6)'; c.lineWidth = Math.max(4, T * 0.13); c.beginPath(); c.arc(Xs, Ys, T * 0.72, 0, TAU); c.stroke(); c.strokeStyle = rgba(SAFE, 0.6 + 0.4 * k); c.lineWidth = Math.max(2.5, T * 0.08); c.stroke(); glow(c, Xs, Ys, T * 1.0, SAFE, 0.25 * k);
      // the aim guide: a dashed arc to whatever it will fly at, an arrowhead at the end
      const tg = L.target && !L.target.dead ? L.target : bombTarget(ctx(X).X || X, m); if (tg) { const x1 = X.sx(tg.x), y1 = X.sy(tg.y) - (tg.fiend ? T * 1.2 : T * 0.4), mx = (Xs + x1) / 2, my = Math.min(Ys, y1) - T * 1.6; c.setLineDash([T * 0.22, T * 0.16]); c.lineDashOffset = -t * T * 1.2; c.strokeStyle = 'rgba(10,30,16,.5)'; c.lineWidth = Math.max(3, T * 0.09); c.beginPath(); c.moveTo(Xs, Ys - T * 0.4); c.quadraticCurveTo(mx, my, x1, y1); c.stroke(); c.strokeStyle = rgba(SAFE, 0.85); c.lineWidth = Math.max(1.6, T * 0.05); c.stroke(); c.setLineDash([]);
        const a = Math.atan2(y1 - my, x1 - mx); c.fillStyle = SAFE; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - 0.45) * T * 0.35, y1 - Math.sin(a - 0.45) * T * 0.35); c.lineTo(x1 - Math.cos(a + 0.45) * T * 0.35, y1 - Math.sin(a + 0.45) * T * 0.35); c.closePath(); c.fill(); } }
    // the fuse: an arc round the damage circle running down to nothing
    c.strokeStyle = 'rgba(20,10,10,.6)'; c.lineWidth = Math.max(4, T * 0.12); c.beginPath(); c.arc(Xs, Ys, R + T * 0.18, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(fuseLeft, 0, 1)); c.stroke(); c.strokeStyle = L.st === 'red' ? WARN : '#FFE37A'; c.lineWidth = Math.max(2.5, T * 0.07); c.stroke();
    c.restore(); }
  function larvaOver(c, X, m) { const L = m.cal, T = X.Tz(), Xs = X.sx(m.x), Ys = X.sy(m.y) - T * 1.15, t = X.g.t; if (L.st !== 'safe' && L.st !== 'red') return;
    if (L.st === 'safe') { const left = L.safe - L.t; label(c, 'HIT IT!', Xs, Ys - T * 0.1, Math.max(12, T * 0.34), SAFE);
      // a return arrow over it (a curved arrow, so it is not colour alone)
      c.save(); c.strokeStyle = 'rgba(10,30,16,.8)'; c.lineWidth = Math.max(4, T * 0.12); c.lineCap = 'round'; const ay = Ys - T * 0.75 + Math.sin(t * 6) * T * 0.06; c.beginPath(); c.arc(Xs, ay + T * 0.2, T * 0.22, Math.PI * 1.1, Math.PI * 1.95); c.stroke(); c.strokeStyle = SAFE; c.lineWidth = Math.max(2, T * 0.06); c.stroke(); const ex = Xs + Math.cos(Math.PI * 1.95) * T * 0.22, ey = ay + T * 0.2 + Math.sin(Math.PI * 1.95) * T * 0.22; c.fillStyle = SAFE; c.beginPath(); c.moveTo(ex + T * 0.12, ey + T * 0.02); c.lineTo(ex - T * 0.06, ey - T * 0.1); c.lineTo(ex - T * 0.02, ey + T * 0.12); c.closePath(); c.fill(); c.restore();
      if (left < 1.5) label(c, left.toFixed(1), Xs + T * 0.62, Ys + T * 0.2, Math.max(10, T * 0.26), '#FFE37A'); }
    else { const left = Math.max(0, L.fuse - L.safe - L.t); label(c, 'GET CLEAR!', Xs, Ys - T * 0.1, Math.max(12, T * 0.34), WARN); label(c, left.toFixed(1), Xs, Ys + T * 0.32, Math.max(11, T * 0.3), '#FFFFFF'); } }
  /* the lava gap's flow slows once the heart is quiet: the backdrop reads the running context's flow time */
  { const B = GAP_EXT.calderalava, back0 = B.back; B.back = (c, o) => back0(c, CUR && CUR.flowT != null ? Object.assign({}, o, { t: CUR.flowT }) : o); }
  Object.assign(CAL, { SEALING, placeholder, Rf, PROP_LEGEND: PH_LEGEND });

  /* ======================= (P) the loading screen's warm-up for every stage of the rift =======================
     Rf.preload(P) is called by the dungeon's loading pass (20b preloadMore; P = { F, M, c, T, k, Tz, mons, reserve, S, gl,
     monPx }) and returns small jobs the loading screen runs a few ms a frame before Start, so nothing below is made mid-play:
       - the brood's pictures in every pose they take (CAL.MODES: wind-ups, strikes, rests, a bomb's safe/red flashes), at
         the sizes this stage draws them (its monsters, those held back, the champion, the boss's minions, a returned bomb);
       - the lava pools' pattern and the soft-glow sprites the props, embers and cues blit;
       - the GPU painter (FGFX) used once on the real canvas with the kinds this rift paints;
       - on a boss stage: GLM's program compiled and drawn once with every Rift 0 material (80..96), the stage's own boss
         drawn once off-screen (meshes built, uploaded, shaded: the first frame of the fight has nothing left to make), and
         the other two bosses' meshes built (CALFLAN / CALBOMB / CAL_IFRIT MODEL.glOn / warm). Without WebGL or on a
         software rasteriser the GL steps are skipped and each boss's draw takes its own 2D fallback.
     window.__CAL_WARM = 0 turns all of it off (tests compare). Budget: at most MON_CAP monster pictures, so the game's
     monster cache (500, then emptied) keeps room for what the floor itself makes. */
  CAL.MODES = { cinderslug: ['', 'w1', 'w2', 'w3', 'spit', 'rest'], basaltcrawler: ['', 'wind', 'ram', 'reel'], emberwisp: ['', 'charge', 'spent'], furnaceimp: ['', 'wind', 'throw', 'hop'],
    runicsentinel: ['', 'wind', 'bash', 'open'], bomblarva: ['', 'fly', 'land', 'g0', 'g1', 'red', 'red2'], ashenknight: ['', 'wind', 's1', 'w2', 's2', 'rest'], crystalwisp: ['', 'aim', 'beam', 'spent'],
    rimewisp: ['', 'charge', 'spent'], shardling: ['', 'wind', 'flick', 'rest'], geodeling: ['', 'c1', 'c2', 'c3', 'burst', 'open'], cinderling: ['', 'chip'] };
  const MON_CAP = 220, MINIONS = { calflan: ['cinderling'], calbomb: ['bomblarva'], califrit: [] };
  const warmGLM = () => { if (typeof GLM === 'undefined' || !GLM.ok()) return false;
    const B = GLM.builder(1); for (let i = 0; i <= 16; i++) B.sph([(i % 6 - 2.5) * 0.45, Math.floor(i / 6) * 0.45 - 0.45, 0], 0.18, 80 + i, 6); const mesh = B.done(), f3 = (a, b, c2) => new Float32Array([a, b, c2]);
    const it = (alpha, kind) => ({ mesh, R0: f3(1, 0, 0), R1: f3(0, 1, 0), R2: f3(0, 0, 1), T: f3(0, 0, 0), alpha, glow: 0.8, glow2: 0.3, spill: 0.3, kind, wear: 1, fx: 0 });
    const S = { px: [1, 0, 0], py: [0, 0.72, -0.695], pd: [0, 0.6945, 0.7195], cl: [0.3, 0, -0.3, 0], v: [0, 0.6945, 0.7195], lk: [-0.5, 0.3, 0.82], ls: [-0.2, -0.38, 0.9], lr: [0.55, -0.72, 0.42], up: [0, 0, 1], low: lowFx(), t: 0 };
    GLM.render(32, 32, S, [it(1, 1), it(0.5, 3)]); return true; };
  /* each boss drawn once off-screen at the arena's centre (so the anchors it leaves behind are where the fight will put it) */
  const BOSS_WARM = {
    calflan: (c2, x, y, o) => { if (typeof CALFLAN === 'undefined') return; CALFLAN.MODEL.draw(c2, x, y, 0, 0, { eyeK: 1, heat: 1, phase: 1 }, o); },
    calbomb: (c2, x, y, o) => { if (typeof CALBOMB === 'undefined') return; const D = FIEND_DEFS.calbomb || {}; CALBOMB.MODEL.draw(c2, x, y, (D.Z && D.Z.ZH) || 3.3, 0, CALBOMB.MODEL.blankPose(), Object.assign({ scale: D.SCALE || 2.3 }, o)); },
    califrit: (c2, x, y, o) => { if (typeof CAL_IFRIT === 'undefined') return; const MD = CAL_IFRIT.MODEL; MD.draw(c2, x, y, MD.headOf ? MD.headOf(Math.PI / 2) : 0, MD.blankPose(), Object.assign({ shadow: false }, o)); } };
  const BOSS_MESH = { calflan: () => typeof CALFLAN !== 'undefined' && CALFLAN.MODEL.glOn && CALFLAN.MODEL.glOn(), calbomb: () => typeof CALBOMB !== 'undefined' && CALBOMB.MODEL.warm && CALBOMB.MODEL.warm(),
    califrit: () => typeof CAL_IFRIT !== 'undefined' && CAL_IFRIT.MODEL.warm && CAL_IFRIT.MODEL.warm() };
  CAL.warmStats = { jobs: 0, mons: 0, ms: 0, boss: null, glm: false };
  Rf.preload = P => { if (typeof window !== 'undefined' && window.__CAL_WARM === 0) return [];
    const jobs = [], WS = CAL.warmStats = { jobs: 0, mons: 0, ms: 0, boss: null, gl: false, glm: false }, F = P.F, S = P.S || {}, boss = F.fiend ? F.fiend.id : null;
    const job = f => jobs.push(() => { const t0 = performance.now(); try { f(); } catch (e) {} WS.ms += performance.now() - t0; WS.jobs++; });
    // the brood: which types this stage can show, at which sizes
    const want = new Map(), add = (t, rpx, color) => { if (!t || !MON[t] || !(rpx > 0)) return; const k = t + '|' + Math.round(rpx) + '|' + (color || MON[t].color); if (!want.has(k)) want.set(k, [t, rpx, color || MON[t].color]); };
    for (const m of (P.mons || []).concat(P.reserve || [])) if (!m.dead && !m.boss && !m.fiend && CAL.MODES[m.type]) add(m.type, m.r * P.T * P.k, m.color);
    const types = new Set(); for (const t of F.types || []) types.add(t);
    for (const ch in S.legend || {}) { const L = S.legend[ch]; if (!L || !L.mons) continue; for (let pi = 0; pi < 4; pi++) { let ts = null; try { ts = typeof L.mons === 'function' ? L.mons(pi) : L.mons; } catch (e) {} for (const t of ts || []) types.add(t); if (typeof L.mons !== 'function') break; } }
    if (boss) for (const t of MINIONS[boss] || []) types.add(t);
    // (a trial raises its brood in waves later: the stage module's rooms list them; the foundry's lesson drops bombs)
    { const mod = P.rift && P.rift.self && P.rift.self.mod; for (const R of (mod && Array.isArray(mod.rooms) && mod.rooms) || []) for (const w of (R && R.waves) || []) for (const t of w || []) if (typeof t === 'string') types.add(t); if (S.biome === 'foundry') types.add('bomblarva'); }
    for (const t of types) if (CAL.MODES[t]) add(t, P.monPx(t));
    let budget = MON_CAP;
    for (const [t, rpx, color] of want.values()) { const nf = (DunArt.NF && DunArt.NF[t]) || 4, modes = CAL.MODES[t] || ['']; for (const md of modes) { if (budget < nf) break; budget -= nf; WS.mons += nf; job(() => { for (let f = 0; f < nf; f++) DunArt.monSprite(t, rpx, (f + 0.5) / nf, color, md, false); }); }
      if (budget >= nf) { budget -= nf; WS.mons += nf; job(() => { for (let f = 0; f < nf; f++) DunArt.monSprite(t, rpx, (f + 0.5) / nf, color, '', true); }); } }
    // a returned bomb in flight (drawn at the zoomed tile size, always in its red flash)
    if (types.has('bomblarva')) job(() => { for (let f = 0; f < 6; f++) DunArt.monSprite('bomblarva', 0.36 * P.Tz(), (f + 0.5) / 6, '#4A464E', 'red2', false); });
    // (the brood's pictures an earlier stage made at sizes or of kinds this one never draws are let go first, so a run
    // through the rift holds one stage's worth of them, not all nine stages')
    { const keep = new Set([...want.values()].map(([t, rpx]) => t + '|' + Math.max(4, Math.round(rpx)))); keep.add('bomblarva|' + Math.max(4, Math.round(0.36 * P.Tz())));
      for (const m of (P.mons || []).concat(P.reserve || [])) keep.add(m.type + '|' + Math.max(4, Math.round(m.r * P.T * P.k)));
      const MC = DunArt.monCache; if (MC) for (const key of [...MC.keys()]) { const i = key.indexOf('|'), t = key.slice(0, i); if (!CAL.MODES[t]) continue; const j = key.indexOf('|', i + 1); if (!keep.has(key.slice(0, j))) MC.delete(key); } }
    // patterns and soft lights
    job(() => { DunWorld.pattern('calderalava', 1); const k = P.k >= 1.5 ? P.k : 1; for (const kd of ['calderalavafar', 'calderaflowfar']) DunWorld.pattern(kd, k); for (const col of [LAVA, LAVA_HI, FRACTURE, FRACTURE_HI, FROST, SAFE, WARN, EMBER, '#FF6A1F', '#9FD8FF', '#FFB347', '#FF5A14', '#FF9A2E', '#05030A']) if (typeof glowSprite === 'function') glowSprite(col); });
    // the GPU painter once on the real canvas, with the kinds this rift paints (nothing visible: alpha ~0, behind the screen)
    job(() => { const G = gpu(P.c, false); if (!G) return; const Q = G.Q, W = 64; Q.glow(W, W, 20, LAVA, 0.002); if (Q.eorb) Q.eorb(W, W, 10, FRACTURE, 0.8, 0.002, 1, 1); if (Q.fire) Q.fire(W, W, 10, 0.8, 0.002, 1); if (Q.tongue) Q.tongue(W, W, 8, 30, 0, 1, 0.002, 1); if (Q.firebeam) Q.firebeam(W, W, W + 20, W, 6, 0.9, 0.002, 1, 5); gpuEnd(P.c, G); });
    // the bosses (the GPU parts only where GLM is real; the 2D fallback is drawn instead and warms its own pictures)
    if (boss && BOSS_WARM[boss]) { WS.boss = boss;
      job(() => { WS.gl = !!P.gl; if (WS.gl) WS.glm = warmGLM(); });   // (P.gl read here, in a job: it wakes GLM)
      job(() => { const T = P.Tz(), m0 = P.c && P.c.getTransform ? P.c.getTransform() : null, dev = m0 ? Math.max(1, Math.hypot(m0.a, m0.b)) : 1, W = Math.ceil(T * 10), H = Math.ceil(T * 10), cv = document.createElement('canvas'); cv.width = Math.ceil(W * dev); cv.height = Math.ceil(H * dev);
        const c2 = cv.getContext('2d'); c2.setTransform(dev, 0, 0, dev, 0, 0); const FC = P.M && P.M.FC, x = FC ? FC.x : 0, y = FC ? FC.y : 0;
        BOSS_WARM[boss](c2, x, y, { T, sx: v => (v - x) * T + W / 2, sy: v => (v - y) * T + H * 0.75, t: 0 }); cv.width = cv.height = 1; });
      for (const id of Object.keys(BOSS_MESH)) if (id !== boss) job(() => { if (WS.gl) BOSS_MESH[id](); }); }
    return jobs; };
})();
