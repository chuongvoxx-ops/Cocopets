/* ---------- (v417 GH) God's Hand: an Earth Strong, six-star only (key 'godshand'; it replaced Geode Burst, whose old key 'geode' reads as it) ----------
   The user's spec (2026-11-19): one enormous stone fist summoned above the aimed spot and smashed down. Loose fragments rise and assemble into a
   clenched fist (broad knuckles, a curled thumb, overlapping sandstone plates, dark seams between the fingers); amber runes light its underside; a
   ground shadow grows before it accelerates down. The impact is one huge circular Earth hit that briefly staggers susceptible monsters and sends a
   low ring of cracked stone and dust outward; the fist stays embedded a beat, then crumbles. The dust ring and the falling fragments belong to that
   one impact and never hit. Base: one fist; Adept (level 4): ~20% bigger fist and radius; Celestial (level 7): ~40% bigger, deeper sculpted cracks,
   a stronger impact. The aim is the game's own (the nearest monster in reach, else ahead); after the short summoning gesture the pet moves freely.
   Gameplay (frame-rate independent: every beat is read from the cast's own clock, so a long frame only runs them in order):
   - the cooldown starts at the cast's commit (20b useStrong), the pet held in place only for the gesture (TUNE.gesture),
   - ONE damage event at TUNE.impact: every living monster within the radius (+ its own) is hit once, recorded in the cast's hit set (f.hits);
     susceptible ones (GH_KIT.susceptible) are knocked back a little and staggered; bosses take the damage and the game's own reduced stagger
     (a quarter of it, in hitMon), never pushed; dust, fragments and the ring are only pictures,
   - the cast is dropped at once (nothing more lands, the picture fades) if the pet goes down or the encounter ends; every piece of it lives in
     its fx entry (no timers), so a floor torn down or left takes it all with it.
   The picture on the GPU: the fist a real 3D mesh on GLM (built once at load: 27 parts, each one stretch of a merged mesh, posed on its own while
   it flies in or falls away, the whole as one draw while it is held), sandstone and terracotta plates over a charcoal basalt core, a bronze cuff
   with a champagne crystal, runes cut into the striking face (materials 160..164); on the painter (FGFX) its growing shadow, the runes' light, the
   crater, the fissures and their amber light, the ring of cracked stone (kind 96), the rolling dust ring, plumes of dust, chips and glints.
   Without WebGL: the same parts as shaded stone blocks in 2D, a soft shadow and the game's rings and dust. */
(() => {
  const K = GH_KIT, { TAU, SE, CE, cl, lerp, sm, M3 } = K;
  const TUNE = K.TUNE.godshand = Object.assign({
    range: 8.5,                // the farthest aim (tiles from the pet)
    gesture: 0.34,             // the summoning gesture: arms up, the pet held in place (s)
    rise0: 0.1, riseSpread: 0.5, riseDur: 0.42,   // the fragments: the first lifts at, the rest within, each flight (s)
    hover: 1.02, fall: 1.34, impact: 1.6, crumble: 2.15, crumbleDur: 0.95, life: 3.9,   // the beats (s from the cast)
    height: 2.7,               // the fist's middle over the floor while it is held (tiles; + 0.2 a tier)
    size: [2.7, 3.24, 3.78],   // tiles a model unit (the fist is ~0.95 wide): Base, Adept +20%, Celestial +40%
    radius: [2.4, 2.88, 3.36], // the impact's radius (tiles): Base, Adept +20%, Celestial +40%
    dmg: 6.5,                  // x the cast's base damage (C.base: the pet's attack, stars and stage) x C.K (the game's Earth level scale)
    tierDmg: [1, 1, 1],        // (an extra factor a tier, for tuning; the progression is the game's own)
    stun: 0.6, kb: 2.4,        // the stagger (s) and the knockback for susceptible monsters (bosses: a quarter of the stun, the game's rule; no push)
    embed: 0.34,               // how deep the knuckles sink (tiles)
    yaw: -0.3,                 // the fist's turn (its palm side, the curled fingers and the thumb, toward the camera; a little of the thumb's side)
  }, K.TUNE.godshand || {});
  const AMBER = '#FFA63A', GOLD = '#FFD27A', PALE = '#FFF1D2', DUST = '#9C8466', DUSTL = '#B8A07E', STONE = '#B89A72';

  /* ================= the fist (model units: ~0.95 wide, knuckles at z 0, +y the palm side, the forearm's broken end at z ~1.6) ================= */
  const MT = { SAND: 160, TERRA: 160.3, CORE: 161, RUNE: 162, BRONZE: 163, CRYS: 164 };
  const PV = [0, 0.05, 0.5];   // (its pivot)
  let FIST = null;
  function buildFist() {
    if (FIST) return FIST; if (typeof GLM === 'undefined') return null;
    const t0 = K.nowMs(), R = K.rng(4177), list = [], meta = [];
    const P = (rank, fn) => { const B = GLM.builder(1); fn(B); list.push(B.done()); meta.push({ rank }); };
    const FX = [-0.36, -0.12, 0.12, 0.36], FLn = [1.0, 1.08, 1.02, 0.9], FZ = [0.03, 0, 0.012, 0.05];
    // a plate: a thick bevelled slab (w x h, th thick) in the frame (ax across, ay up it, an out of it) at o
    const plate = (B, o, ax, ay, an, w, h, th, m) => { B.push(ax, ay, an, o); B.box([0, 0, 0], [w / 2, h / 2, th / 2], Math.min(0.03, th * 0.45), m); B.pop(); };
    const tilt = 0.2, AY = [0, Math.sin(tilt), Math.cos(tilt)], AN = [0, -Math.cos(tilt), Math.sin(tilt)];   // (the back's shingles: each upper one's lower edge over the next)
    const FRONT = [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], sub = (a, b) => [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = d => Math.hypot(d[0], d[1], d[2]);
    // the dark core between the plates: it shows in every seam
    P(0, B => B.box([0, 0.03, 0.4], [0.42, 0.2, 0.32], 0.05, MT.CORE));
    // the fingers' first bones: the broad knuckles at the back, the striking face under them (runes cut in it)
    for (let i = 0; i < 4; i++) P(1, B => { const x = FX[i], L = FLn[i], z = FZ[i]; B.box([x, 0.06 * L, 0.125 + z], [0.104, 0.2 * L, 0.115], 0.062, MT.SAND);
      B.ell([x, -0.12, 0.18 + z], [0.122, 0.118, 0.138], MT.SAND, { seg: 16, rings: 10 }); B.box([x, 0.07 * L, 0.014 + z], [0.09, 0.17 * L, 0.018], 0.012, MT.RUNE); });
    // their middle bones curled up the palm side
    for (let i = 0; i < 4; i++) P(2, B => { const x = FX[i], L = FLn[i], z = FZ[i]; B.box([x, 0.27, 0.3 + z], [0.1, 0.096, 0.16 * L], 0.064, i % 2 ? MT.TERRA : MT.SAND); B.ell([x, 0.265, 0.115 + z], [0.112, 0.112, 0.105], i % 2 ? MT.TERRA : MT.SAND, { seg: 14, rings: 8 }); });   // (with the second knuckles' knobs along the bottom
    // the palm's heel above the curled fingers, plated; the thumb's mound
    P(2, B => { B.box([0.03, 0.11, 0.6], [0.42, 0.135, 0.15], 0.066, MT.SAND); plate(B, [0.2, 0.248, 0.6], ...FRONT, 0.38, 0.25, 0.045, MT.TERRA); plate(B, [-0.12, 0.252, 0.66], ...FRONT, 0.3, 0.2, 0.04, MT.SAND); });
    P(2, B => { B.ell([-0.42, 0.16, 0.5], [0.135, 0.185, 0.2], MT.SAND, { seg: 16, rings: 10 }); plate(B, [-0.535, 0.12, 0.52], [0, -1, 0], [0, 0, 1], [-1, 0, 0], 0.3, 0.3, 0.045, MT.TERRA);
      B.crystal([-0.55, 0.0, 0.62], [-0.68, -0.05, 0.72], 0.03, MT.CRYS, { n: 6, seed: 3 }); });
    // the thumb: two bones curled across the fingers
    { const a = [-0.48, 0.33, 0.52], b = [-0.18, 0.455, 0.43], d = sub(a, b), L = len(d); P(3, B => { B.along(a, d); B.box([L / 2, 0, 0], [L / 2 + 0.04, 0.1, 0.095], 0.085, MT.SAND); B.pop(); }); }
    { const a = [-0.18, 0.455, 0.43], b = [0.07, 0.435, 0.35], d = sub(a, b), L = len(d); P(3, B => { B.along(a, d); B.box([L / 2, 0, 0], [L / 2 + 0.02, 0.09, 0.086], 0.075, MT.TERRA); B.ell([L, 0, -0.005], [0.088, 0.09, 0.082], MT.TERRA, { seg: 12, rings: 7 }); B.pop(); }); }
    // the back of the hand: overlapping plates in rows, champagne crystals growing between two of them
    [[[-0.21, 0.21], 0.28, 0.44], [[-0.29, 0, 0.29], 0.45, 0.31], [[-0.2, 0.2], 0.62, 0.42]].forEach(([xs, z, w], row) => xs.forEach((x, j) => P(3, B => {
      plate(B, [x, -0.238 - 0.008 * row, z], [1, 0, 0], AY, AN, w * 0.98, 0.25, 0.055, (row + j) % 3 === 1 ? MT.TERRA : MT.SAND);
      if (row === 1 && j === 2) { B.crystal([0.36, -0.26, 0.53], [0.48, -0.39, 0.63], 0.04, MT.CRYS, { n: 6, seed: 2 }); B.crystal([0.4, -0.25, 0.5], [0.55, -0.31, 0.53], 0.026, MT.CRYS, { n: 5, seed: 7 }); }
      if (row === 0 && j === 0) B.crystal([-0.06, -0.26, 0.37], [-0.09, -0.39, 0.45], 0.03, MT.CRYS, { n: 5, seed: 5 }); })));
    // the little finger's side: two plates
    P(3, B => { plate(B, [0.482, 0.0, 0.32], [0, 1, 0], [0, 0, 1], [1, 0, 0], 0.4, 0.26, 0.05, MT.TERRA); plate(B, [0.488, 0.03, 0.55], [0, 1, 0], [0, 0, 1], [1, 0, 0], 0.36, 0.24, 0.05, MT.SAND); });
    // the wrist, its bronze cuff with a champagne crystal set in front, a stub of forearm (plated in front), its broken end in floating chunks
    P(4, B => B.box([0, -0.01, 0.86], [0.355, 0.195, 0.15], 0.06, MT.SAND));
    P(5, B => { B.box([0, -0.01, 0.875], [0.385, 0.215, 0.05], 0.025, MT.BRONZE); for (const x of [-0.27, 0.27]) B.sph([x, 0.21, 0.875], 0.024, MT.BRONZE, 8); B.ell([0, 0.212, 0.875], [0.06, 0.034, 0.046], MT.CRYS, { seg: 10, rings: 6 }); });
    for (let j = 0; j < 3; j++) P(6, B => { const ax = K.nrm([R() - 0.5, R() - 0.5, R() - 0.5]), Mr = M3.axis(ax, 0.4 + R() * 0.8); B.push([Mr[0], Mr[1], Mr[2]], [Mr[3], Mr[4], Mr[5]], [Mr[6], Mr[7], Mr[8]], [-0.2 + 0.2 * j + (R() - 0.5) * 0.06, -0.02 + (R() - 0.5) * 0.1, 1.14 + 0.05 * R() + (j === 1 ? 0.07 : 0)]);
      B.box([0, 0, 0], [0.11 + 0.03 * R(), 0.1, 0.07 + 0.02 * R()], 0.035, j === 1 ? MT.TERRA : MT.SAND); B.pop(); });
    const G = K.merge(list); G.ranges.forEach((r, i) => Object.assign(r, meta[i], { seed: i * 1.37 + 0.5 }));
    let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const r of G.ranges) for (let j = 0; j < 3; j++) { lo[j] = Math.min(lo[j], r.lo[j]); hi[j] = Math.max(hi[j], r.hi[j]); }
    FIST = { mesh: G.mesh, parts: G.ranges, lo, hi, ms: K.nowMs() - t0 }; return FIST;
  }
  K.idle(buildFist);

  /* ================= the move ================= */
  const S = ELEM_IMPL.earth.strong;
  S.godshand = (C, H) => {
    const me = H.me, X = H.X, tier = K.tierOf(C), F0 = buildFist(), seed = (S.godshand.dbg && S.godshand.dbg.seed) || Math.floor(Math.random() * 9e4) + 7;
    // the aim: the game's own target (else 3 tiles ahead), no farther than the reach, on walkable floor
    let tx = C.tx, ty = C.ty; { const dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy); if (d > TUNE.range) { tx = me.x + dx / d * TUNE.range; ty = me.y + dy / d * TUNE.range; } const w = H.walk(tx, ty); if (w && isFinite(w.x)) { tx = w.x; ty = w.y; } }
    const Sz = TUNE.size[tier], RAD = TUNE.radius[tier], zHold = TUNE.height + 0.2 * tier, RN = K.rng(seed);
    // the pet's summoning gesture: arms up, held in place for it (a dodge still cancels it), facing the aim
    me.castT = me.castM = TUNE.gesture + 0.3; me.castUlt = true; me.sq = 0.75; if (Math.abs(tx - me.x) > 0.2) me.face = tx > me.x ? 1 : -1;
    if (!me.push && !me.dash && !me.leap && !me.dodge) me.push = { vx: 0, vy: 0, t: TUNE.gesture };
    X.sfx.hum && X.sfx.hum();
    // each part's flight in (from the floor round the aim) and its fall away (in the crumble)
    const parts = (F0 ? F0.parts : []).map((p, i) => { const a = RN() * TAU, rr = 0.9 + RN() * 1.4;
      return { p, ts: p.rank === 0 ? TUNE.rise0 + TUNE.riseSpread * 0.62 : TUNE.rise0 + p.rank / 6 * TUNE.riseSpread * 0.8 + RN() * 0.12, s0: [Math.cos(a) * rr, Math.sin(a) * rr / SE, -0.3], ax: K.nrm([RN() - 0.5, RN() - 0.5, RN() - 0.5]), ang: 2 + RN() * 2.5, bul: 0.4 + RN() * 0.5,
        tc: p.rank === 0 ? TUNE.crumble + 0.12 : TUNE.crumble + cl(1 - p.c[2] / 1.65) * 0.34 + RN() * 0.1, ax2: K.nrm([RN() - 0.5, RN() - 0.5, RN() - 0.5]), wr: 2 + RN() * 3, vo: 0.5 + RN() * 0.9, vz: 0.4 + RN() * 1.1, lifted: false, snapped: false, fell: false }; });
    const asmEnd = parts.reduce((m, q) => Math.max(m, q.ts + TUNE.riseDur), 0), crmStart = parts.reduce((m, q) => Math.min(m, q.tc), 9);
    const yaw = TUNE.yaw;
    // the fist's pose at t: rotation (with its scale) and the world point of its pivot (x tiles, y tiles / 0.55, z up; 0, 0, 0 the aimed floor point)
    const pitchAt = t => t < TUNE.hover ? 0.3 : t < TUNE.fall ? lerp(0.3, 0.78, sm((t - TUNE.hover) / (TUNE.fall - TUNE.hover))) : t < TUNE.impact ? lerp(0.78, 0.12, sm((t - TUNE.fall) / (TUNE.impact - TUNE.fall) * 1.3)) : 0.12;   // (the wind-up tips its knuckles and their runes toward the camera)
    const rotAt = t => M3.sc(M3.mul(M3.rz(yaw), M3.mul(M3.rx(pitchAt(t)), M3.ry(t < TUNE.impact ? 0.06 * Math.sin(t * 2.2) : 0.02))), Sz);
    const lowZ = Rm => { if (!F0) return 0; let mz = 1e9; for (let a = 0; a < 8; a++) { const c = [a & 1 ? F0.hi[0] : F0.lo[0], a & 2 ? F0.hi[1] : F0.lo[1], a & 4 ? F0.hi[2] : F0.lo[2]], w = M3.ap(Rm, [c[0] - PV[0], c[1] - PV[1], c[2] - PV[2]]); mz = Math.min(mz, w[2]); } return mz; };
    const zEmb = -TUNE.embed - lowZ(rotAt(TUNE.impact + 0.01));   // (the pivot's height when the knuckles are sunk TUNE.embed into the floor)
    const zAt = t => { const hz = zHold;
      if (t < TUNE.hover) return hz + 0.05 * Math.sin(t * 3.1);
      if (t < TUNE.fall) return hz + 0.05 * Math.sin(t * 3.1) + 0.45 * sm((t - TUNE.hover) / (TUNE.fall - TUNE.hover));   // (the wind-up: it draws back up)
      if (t < TUNE.impact) { const u = (t - TUNE.fall) / (TUNE.impact - TUNE.fall), z1 = hz + 0.05 * Math.sin(TUNE.fall * 3.1) + 0.45; return lerp(z1, zEmb, Math.pow(u, 2.3)); }
      const p = t - TUNE.impact; return zEmb - 0.08 * Math.exp(-p * 9) * Math.sin(p * 30); };
    // the light: the seams' amber (uGlow) and the runes (uGlow2), the dust settled on it, the crumble
    const glowAt = t => t < TUNE.hover ? 0.3 : t < TUNE.impact ? lerp(0.45, 1.0, sm((t - TUNE.hover) / (TUNE.impact - TUNE.hover))) : t < TUNE.crumble ? 0.35 + 1.25 * Math.exp(-(t - TUNE.impact) * 4) : 0.35 * (1 - sm((t - TUNE.crumble) / TUNE.crumbleDur));
    const runeAt = t => t < TUNE.hover ? 0.12 * sm(t / 0.6) : t < TUNE.impact ? Math.min(1.4, 1.4 * sm((t - TUNE.hover) / 0.16)) * (0.88 + 0.12 * Math.sin(t * 31)) : 2.0 * Math.exp(-(t - TUNE.impact) * 6);
    const dustAt = t => t < TUNE.impact ? 0 : 0.85 * sm((t - TUNE.impact) / 0.4);
    const wearAt = t => (t < TUNE.crumble ? 0 : sm((t - TUNE.crumble) / TUNE.crumbleDur));

    const f = H.add({ key: 'godshand', life: TUNE.life, x: tx, y: ty, entY: ty + 0.05, R: RAD, tier, hits: new Set(), hitDone: false, dead: false, deadT: 0, dust: [], chips: [], specks: [], seed,
      update(dt, f) { const t = f.t;
        // defeat or the encounter's end: drop the cast (nothing more lands), let the picture fade out
        if (!f.dead && (me.dead || (H.g && (H.g.over || H.g.exitIn)))) { f.dead = true; f.deadT = t; f.life = Math.min(f.life, 0.35); }
        // the fragments lift off the floor (dust), snap into place (a glint), fall away in the crumble (chips, dust)
        for (const q of parts) { const pc = partCentre(q, t);
          if (!q.lifted && t >= q.ts) { q.lifted = true; if (!f.dead) { const wx = q.s0[0], wy = q.s0[1] * SE; puff(f, tx + wx, ty + wy, 0.05, 0.35, 0.5); if (RN() < 0.6) chip(f, tx + wx, ty + wy, 0.1, (RN() - 0.5) * 1.5, (RN() - 0.5) * 1.5, 2 + RN() * 2, 0.07); } }
          if (!q.snapped && t >= q.ts + TUNE.riseDur) { q.snapped = true; if (!f.dead && pc) f.specks.push({ x: tx + pc[0], y: ty + pc[1] * SE, z: pc[2], t: 0, life: 0.28, s: 0.22 + 0.1 * RN() }); }
          if (!q.fell && t >= q.tc) { q.fell = true; if (!f.dead && pc && pc[2] > -0.2) { for (let k = 0; k < 2; k++) chip(f, tx + pc[0], ty + pc[1] * SE, Math.max(0.1, pc[2]), (RN() - 0.5) * 2.5, (RN() - 0.5) * 2.5, 1 + RN() * 1.5, 0.09); if (RN() < 0.5) puff(f, tx + pc[0], ty + pc[1] * SE, Math.max(0, pc[2] - 0.2), 0.4, 0.9); } } }
        if (!f.sndA && t >= asmEnd) { f.sndA = true; if (!f.dead) X.sfx.thud && X.sfx.thud(); }
        if (!f.sndF && t >= TUNE.fall) { f.sndF = true; if (!f.dead) X.sfx.whoosh && X.sfx.whoosh(); }
        if (!f.sndC && t >= crmStart) { f.sndC = true; if (!f.dead) X.sfx.crack ? X.sfx.crack() : X.sfx.thud && X.sfx.thud(); }
        // THE damage event: once, at the impact
        if (!f.hitDone && t >= TUNE.impact) { f.hitDone = true; if (!f.dead) impact(f); }
        // the falling fist's wind: a few streaks of dust peeling off it (cosmetic)
        if (!f.dead && t > TUNE.fall && t < TUNE.impact && RN() < dt * 24 * H.Q()) { const z = zAt(t) - 0.4 * Sz; f.dust.push({ x: tx + (RN() - 0.5) * Sz * 0.9, y: ty + (RN() - 0.5) * 0.4, z: z + RN() * Sz, vx: 0, vy: 0, vz: 2.5, t: 0, life: 0.35, s: 0.25 + RN() * 0.2, sd: RN() * 9 + 1, streak: true }); }
        // its own light on the floor round it (the room's darkness is drawn over the move), stronger as it comes down and at the blow
        if (!f.dead && t > TUNE.rise0 && t < TUNE.crumble + 0.3 && (f.lt = (f.lt || 0) - dt) <= 0) { f.lt = 0.1; X.light(tx, ty, (RAD + 1.2) * (t < TUNE.impact ? 0.7 + 0.3 * sm((t - TUNE.hover) / 0.5) : 1), 0.16); }
        // the cosmetic particles (their own simple physics, by dt)
        for (let i = f.dust.length - 1; i >= 0; i--) { const p = f.dust[i]; p.t += dt; const k2 = Math.exp(-1.8 * dt); p.vx *= k2; p.vy *= k2; p.vz *= k2; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); if (p.t >= p.life) f.dust.splice(i, 1); }
        for (let i = f.chips.length - 1; i >= 0; i--) { const p = f.chips[i]; p.t += dt; p.vz -= 11 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z < 0) { p.z = 0; if (p.vz < -2) { p.vz *= -0.3; p.vx *= 0.5; p.vy *= 0.5; } else { p.vz = 0; p.vx *= 0.8; p.vy *= 0.8; } } if (p.t >= p.life) f.chips.splice(i, 1); }
        for (let i = f.specks.length - 1; i >= 0; i--) { const p = f.specks[i]; p.t += dt; if (p.t >= p.life) f.specks.splice(i, 1); } },
      onEnd(f) { f.dust.length = 0; f.chips.length = 0; f.specks.length = 0; f.hits.clear(); },
      drawUnder(c, f, X0, Y0, T) { const FG = K.gfx(); if (FG) gpuUnder(c, f, FG, T); else under2D(c, f, T); },
      drawEnt(c, f) { const T = X.Tz(), FG = K.gfx(); if (FG && gpuFist(c, f, FG, T)) return; fist2D(c, f, T); } });

    /* the damage: every living monster in the radius once (its own radius counts), recorded; susceptible ones knocked back a little and staggered,
       bosses only the game's own reduced stagger (hitMon gives a boss a quarter of a stun) and no push */
    function impact(f) {
      const dmg = C.base * TUNE.dmg * (TUNE.tierDmg[tier] || 1) * C.K;
      for (const m of H.living()) { if (f.hits.has(m) || Math.hypot(m.x - tx, m.y - ty) >= RAD + m.r) continue; f.hits.add(m); const sus = K.susceptible(m); X.hitMon(m, dmg, C.dmgO({ kb: sus ? TUNE.kb : 0, stun: TUNE.stun })); }
      X.shake(Math.min(18, 10 + 3 * tier), 0.32); X.hitstop(0.05 + 0.015 * tier); X.flash(0.1 + 0.05 * tier, tier === 2 ? '#FFE8B8' : '#FFD08A'); X.light(tx, ty, RAD * 1.7, 0.35);
      X.sfx.crash && X.sfx.crash(); X.sfx.thud && X.sfx.thud();
      // the dust and stone thrown out by the same blow (pictures only)
      const nd = H.n(10 + 4 * tier), nc = H.n(16 + 8 * tier);
      for (let i = 0; i < nd; i++) { const a = i / nd * TAU + RN() * 0.4, r0 = Sz * 0.35 + RN() * 0.3, v = 1.2 + RN() * 1.6; f.dust.push({ x: tx + Math.cos(a) * r0, y: ty + Math.sin(a) * r0 * 0.75, z: 0.05, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: 0.6 + RN() * 1.1, t: 0, life: 1.0 + RN() * 0.7, s: 0.45 + RN() * 0.35 + 0.1 * tier, sd: RN() * 9 + 1, warm: 0.4 }); }
      for (let i = 0; i < nc; i++) { const a = RN() * TAU, v = 2 + RN() * 4.5; chip(f, tx + Math.cos(a) * Sz * 0.3, ty + Math.sin(a) * Sz * 0.22, 0.2 + RN() * 0.5, Math.cos(a) * v, Math.sin(a) * v * 0.7, 3 + RN() * 4.5, 0.08 + RN() * 0.08 + 0.02 * tier); }
      for (let i = 0; i < H.n(8 + 4 * tier); i++) { const a = RN() * TAU, r0 = RN() * RAD * 0.8; f.specks.push({ x: tx + Math.cos(a) * r0, y: ty + Math.sin(a) * r0 * 0.7, z: 0.1 + RN() * 0.6, t: -RN() * 0.3, life: 0.4 + RN() * 0.3, s: 0.16 + RN() * 0.12 }); }
    }
    function puff(f, x, y, z, s, life) { if (RN() > H.Q() + 0.15) return; f.dust.push({ x, y, z, vx: (RN() - 0.5) * 0.6, vy: (RN() - 0.5) * 0.4, vz: 0.4 + RN() * 0.4, t: 0, life: life || 0.6, s: s || 0.35, sd: RN() * 9 + 1 }); }
    function chip(f, x, y, z, vx, vy, vz, s) { if (f.chips.length > 70) return; f.chips.push({ x, y, z, vx, vy, vz, rot: RN() * TAU, vr: (RN() - 0.5) * 14, t: 0, life: 0.9 + RN() * 0.6, s, md: RN() < 0.85 ? 5 : 0, sd: Math.floor(RN() * 40) + 1 }); }

    /* a part's pose at t: [R (9), T (3)] in the world, or null when it is not to be drawn (still in the floor, or fallen through it) */
    const RF = { t: -1, R: null, Tf: null };
    function fistAt(t) { if (RF.t !== t) { RF.t = t; RF.R = rotAt(t); RF.Tf = [0, 0, zAt(t)]; } return RF; }
    function partPose(q, t) { const fp = fistAt(t), c0 = q.p.c, cw = M3.ap(fp.R, [c0[0] - PV[0], c0[1] - PV[1], c0[2] - PV[2]]); let pos = [cw[0] + fp.Tf[0], cw[1] + fp.Tf[1], cw[2] + fp.Tf[2]], Rp = null, sp = 1;
      if (t < q.ts) return null;
      if (t < q.ts + TUNE.riseDur && q.p.rank === 0) { const u = (t - q.ts) / TUNE.riseDur; Rp = M3.id(); sp = 0.25 + 0.75 * sm(u); }   // (the dark core: it swells in place, hidden as the plates gather round it)
      else if (t < q.ts + TUNE.riseDur) { const u = (t - q.ts) / TUNE.riseDur, e = 1 - Math.pow(1 - u, 3), b = Math.sin(u * Math.PI) * q.bul, ox = q.s0[0], oy = q.s0[1], ol = Math.hypot(ox, oy) || 1;
        pos = [lerp(q.s0[0], pos[0], e) + ox / ol * b, lerp(q.s0[1], pos[1], e) + oy / ol * b, lerp(q.s0[2], pos[2], e) + b * 0.6]; Rp = M3.axis(q.ax, q.ang * (1 - e)); sp = 0.55 + 0.45 * e; }
      else if (t >= q.tc && q.p.rank === 0) { const u = t - q.tc; Rp = M3.id(); sp = 1 - 0.6 * sm(u / 0.45); pos = [pos[0], pos[1], pos[2] - 1.6 * u * u * 4]; if (sp < 0.45) return null; }   // (the core: it sinks and shrinks away as the plates fall)
      else if (t >= q.tc) { const u = t - q.tc, dl = Math.hypot(cw[0], cw[1]) || 1; pos = [pos[0] + cw[0] / dl * q.vo * u, pos[1] + cw[1] / dl * q.vo * u / SE * 0.7, pos[2] + q.vz * u - 4.5 * u * u]; Rp = M3.axis(q.ax2, q.wr * u); sp = 1 - 0.3 * cl(u / TUNE.crumbleDur);
        if (pos[2] < -q.p.r * Sz * sp * 0.9) return null; }
      const Rm = Rp ? M3.mul(fp.R, M3.sc(Rp, sp)) : fp.R, Rc = M3.ap(Rm, c0); return { R: Rm, T: [pos[0] - Rc[0], pos[1] - Rc[1], pos[2] - Rc[2]], c: pos, sc: sp }; }
    function partCentre(q, t) { const P2 = partPose(q, t); return P2 ? P2.c : null; }
    const whole = t => t >= asmEnd && t < crmStart;   // (all of it in place: one draw)

    /* ---- the GPU picture: the floor (FGFX) ---- */
    function gpuUnder(c, f, FG, T) {
      const t = f.t, Xs = X.sx(tx), Ys = X.sy(ty), R = RAD * T, A = f.dead ? cl(1 - (t - f.deadT) / 0.3) : 1, end = cl(f.life / 0.8), sd = (seed % 97) + 0.5, Q = FG.begin(c, null);
      // the shadow: it gathers with the fist and grows darker and wider as it comes down
      if (t < TUNE.impact + 0.06) { const fp = fistAt(t), zb = Math.max(0, fp.Tf[2] - 0.5 * Sz), close = cl(1 - zb / (zHold + 0.8)), ga = sm((t - TUNE.rise0) / 0.7);
        const rx = Sz * T * 0.7 * (0.55 + 0.6 * close); Q.sshadow(Xs, Ys, rx * 1.25, rx * 1.25 * SE, Math.min(1, (0.55 + 0.45 * close) * ga) * A, '#0B0705'); Q.sshadow(Xs, Ys, rx * 0.7, rx * 0.7 * SE, (0.35 + 0.6 * close * close) * ga * A, '#050302');   // (kind 66 falls off fast: drawn wide)
        const rg = runeAt(t); if (rg > 0.05) Q.glow(Xs, Ys, R * (0.55 + 0.35 * close), AMBER, Math.min(0.5, 0.2 * rg * (0.3 + close)) * A, SE); }
      if (t >= TUNE.impact && f.hitDone) { const p = t - TUNE.impact, heat = Math.exp(-p * 1.6), fd = A * end, kk = 1 + 0.25 * tier;
        Q.quad(82, Xs, Ys, R * 0.5, 0, 0, R * 0.5 * SE, '#FFFFFF', 0.95 * fd, 0.22 * heat, sd);
        Q.quad(89, Xs, Ys, R * 1.08, 0, 0, R * 1.08 * SE, '#000000', 0.92 * fd, cl(p / 0.3) * 1.02, sd, 0.12 + 0.06 * tier);
        Q.quad(88, Xs, Ys, R * 1.08, 0, 0, R * 1.08 * SE, AMBER, fd * (0.55 + 0.45 * heat), cl(p / 0.3) * 1.02, sd, (0.5 + 0.8 * heat) * kk);
        // the low ring of cracked stone thrown out, heaving up as it passes, settling back
        const fr = 0.18 + 0.74 * H.ease.out(cl(p / 0.5)), hv = sm(p / 0.07) * (1 - sm((p - 0.3) / 1.1)); Q.quad(96, Xs, Ys, R * 1.18, 0, 0, R * 1.18 * SE, STONE, fd * (1 - sm((p - 1.4) / 0.8)), fr, sd, hv);
        // the dust ring rolling out, and (Celestial) a second one behind it
        for (let k = 0; k <= (tier === 2 ? 1 : 0); k++) { const dq = cl((p - 0.1 * k) / (1.05 + 0.2 * k)); if (dq > 0 && dq < 1) { const rr = R * (0.38 + (1.2 - 0.25 * k) * H.ease.out(dq)); Q.quad(90, Xs, Ys, rr * 1.3, 0, 0, rr * 1.3 * SE, k ? DUSTL : DUST, (1 - dq) * 0.92 * A, 0.32 + 0.06 * tier, sd + 1 + k, dq); } }
        // the shock across the floor and the flash of the blow
        if (p < 0.5) { const q = p / 0.5, rs = R * (0.3 + 0.95 * H.ease.out(q)); Q.quad(79, Xs, Ys, rs / 0.8, 0, 0, rs / 0.8 * SE, AMBER, (1 - q) * (0.75 + 0.2 * tier) * A, 0, sd, 0.15); if (tier === 2) Q.quad(79, Xs, Ys, rs * 0.8 / 0.8, 0, 0, rs * 0.8 / 0.8 * SE, PALE, (1 - q) * 0.5 * A, 0, sd + 3, 0.1); }
        if (p < 0.35) Q.glow(Xs, Ys, R * 1.1, AMBER, 0.55 * (1 - p / 0.35) * A, SE); }
      FG.flush(c); }

    /* ---- the GPU picture: the fist (GLM) and what is over it (FGFX) ---- */
    function gpuFist(c, f, FG, T) {
      const t = f.t, F1 = buildFist(), Xs = X.sx(tx), Ys = X.sy(ty), A = f.dead ? cl(1 - (t - f.deadT) / 0.3) : 1, PX = X.sx(me.x), PY = X.sy(me.y) - T * 0.45;
      if (!F1) return false;
      if (!f.up) { f.up = true; K.upload(F1.mesh); }
      const items = [], gl = glowAt(t), g2 = runeAt(t), sp = dustAt(t), wr = wearAt(t);
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; const box = (w, r) => { const sx = Xs + T * w[0], sy = Ys + T * (SE * w[1] - CE * w[2]); bx0 = Math.min(bx0, sx - r); bx1 = Math.max(bx1, sx + r); by0 = Math.min(by0, sy - r); by1 = Math.max(by1, sy + r); };
      if (whole(t)) { const fp = fistAt(t), Rc = M3.ap(fp.R, PV); items.push({ mesh: F1.mesh, R: fp.R, T: [fp.Tf[0] - Rc[0], fp.Tf[1] - Rc[1], fp.Tf[2] - Rc[2]], alpha: A, glow: gl, glow2: g2, spill: sp, kind: tier, wear: wr, first: 0, cnt: 0 });
        for (const q of parts) { const cw = M3.ap(fp.R, [q.p.c[0] - PV[0], q.p.c[1] - PV[1], q.p.c[2] - PV[2]]); box([cw[0] + fp.Tf[0], cw[1] + fp.Tf[1], cw[2] + fp.Tf[2]], q.p.r * Sz * T * 1.08); } }
      else for (const q of parts) { const P2 = partPose(q, t); if (!P2) continue; const snap = t - q.ts - TUNE.riseDur, flash = snap > -0.05 && snap < 0.2 ? Math.exp(-sq(snap / 0.07)) * 0.9 : 0;
        items.push({ mesh: F1.mesh, R: P2.R, T: P2.T, alpha: A, glow: gl + flash, glow2: g2, spill: sp, kind: tier, wear: Math.max(wr, t >= q.tc ? cl((t - q.tc) / 0.6) : 0), first: q.p.first, cnt: q.p.cnt }); box(P2.c, q.p.r * Sz * P2.sc * T * 1.08); }
      if (items.length) { const pet = me.y < ty + 0.2 && !me.dead ? [PX, PY, T * 0.85] : null; if (!K.render(c, items, { X0: Xs, Y0: Ys, k: T, bb: [bx0, by0, bx1, by1], alpha: 1, pet })) return false; }
      // over it: the runes' light under it, glints as parts lock on, dust and chips, the flash of the blow
      const Q = FG.begin(c, [PX, PY, T * 0.6]);
      if (t < TUNE.impact + 0.1 && g2 > 0.1) { const fp = fistAt(t), zb = fp.Tf[2] - 0.45 * Sz, y0 = Ys - CE * T * Math.max(0, zb); Q.glow(Xs, y0, Sz * T * 0.62, AMBER, Math.min(0.7, 0.45 * g2) * A, 0.42); Q.glow(Xs, y0, Sz * T * 0.32, GOLD, Math.min(0.6, 0.32 * g2) * A, 0.35); }
      for (const p of f.specks) { if (p.t < 0) continue; const u = p.t / p.life, x = X.sx(p.x), y = X.sy(p.y) - CE * T * p.z, s = T * p.s * (1.4 - 0.6 * u); Q.glow(x, y, s * 1.5, GOLD, Math.sin(u * Math.PI) * 0.7 * A); Q.star(x, y, s * 1.3, Math.sin(u * Math.PI) * A, PALE); }
      for (const p of f.dust) { const u = p.t / p.life, r = T * p.s * (0.6 + 0.9 * u), a = Math.sin(Math.min(1, u * 2.5) * Math.PI / 2) * (1 - u) * (p.streak ? 0.35 : 0.72) * A, x = X.sx(p.x), y = X.sy(p.y) - CE * T * p.z; if (a < 0.01) continue;
        if (p.streak) Q.quad(84, x, y, r * 0.45, 0, 0, r * 1.6, DUSTL, a, u, p.sd, 0); else Q.quad(84, x, y, r, 0, 0, r * 0.82, DUST, a, u, p.sd, 0.9 * (p.warm || 0) * Math.max(0, 1 - u * 2)); }
      for (const p of f.chips) { const a = (1 - sm((p.t - p.life * 0.7) / (p.life * 0.3))) * A, sz = p.s * T * 1.6; if (a < 0.02 || sz < 0.6) continue; const x = X.sx(p.x), y = X.sy(p.y) - CE * T * p.z;
        Q.rq(85, x, y, sz, sz * 0.8, p.rot, '#FFFFFF', a, p.rot, p.sd, p.md + 0.9 * 0.15); }
      if (f.hitDone && !f.dead) { const p = t - TUNE.impact; if (p < 0.3) { const k = 1 - p / 0.3; Q.glow(Xs, Ys - T * 0.3, RAD * T * 0.7, PALE, 0.5 * k * k); Q.glow(Xs, Ys - T * 0.2, RAD * T * 1.2, AMBER, 0.4 * k); } }
      FG.flush(c); return true; }

    /* ---- the 2D picture (no WebGL): the same parts as shaded stone blocks, a soft shadow, the game's rings and dust ---- */
    const COLS = { 160: ['#C9A97C', '#E3CBA2', '#7E6446'], 160.3: ['#B0623A', '#D08A60', '#6A3420'], 161: ['#3A322C', '#544A42', '#1E1915'], 162: ['#C29A6A', '#E6C08A', '#7A5A36'], 163: ['#9A6A34', '#E0B070', '#5A3A18'], 164: ['#E8D7B0', '#FFF4DA', '#A89060'] };
    function fist2D(c, f, T) { const t = f.t, Xs = X.sx(tx), Ys = X.sy(ty), A = f.dead ? cl(1 - (t - f.deadT) / 0.3) : 1, F1 = FIST; if (!F1) return;
      // each part as its box seen from the camera: its faces turned toward the viewer, lit from the upper left, far parts first
      const L = []; for (const q of parts) { const P2 = partPose(q, t); if (!P2) continue; const lo = q.p.lo, hi = q.p.hi, S2 = [];
        for (let a = 0; a < 8; a++) { const w = M3.ap(P2.R, [a & 1 ? hi[0] : lo[0], a & 2 ? hi[1] : lo[1], a & 4 ? hi[2] : lo[2]]); S2.push([Xs + T * (w[0] + P2.T[0]), Ys + T * (SE * (w[1] + P2.T[1]) - CE * (w[2] + P2.T[2]))]); }
        L.push({ S2, R: P2.R, d: P2.c[1] * CE + P2.c[2] * SE, m: firstMat(q.p) }); }
      L.sort((p, q) => p.d - q.d); c.save(); c.globalAlpha = A; c.lineJoin = 'round';
      for (const b of L) { const cc = COLS[b.m] || COLS[160];
        for (let k = 0; k < 6; k++) { const ax = k >> 1, sg = k & 1 ? 1 : -1, nl = Math.hypot(b.R[ax * 3], b.R[ax * 3 + 1], b.R[ax * 3 + 2]) || 1, n = [sg * b.R[ax * 3] / nl, sg * b.R[ax * 3 + 1] / nl, sg * b.R[ax * 3 + 2] / nl];
          if (n[1] * CE + n[2] * SE <= 0.02) continue; const dif = Math.max(0, -0.55 * n[0] + 0.42 * n[1] + 0.75 * n[2]) / 1.03;
          H.poly(c, FACES[k].map(a => b.S2[a])); c.fillStyle = H.mix(cc[2], cc[1], 0.15 + 0.85 * dif); c.fill(); c.strokeStyle = H.line(); c.lineWidth = 1.2; c.stroke(); } }
      c.restore();
      const g2 = runeAt(t); if (g2 > 0.1 && t < TUNE.impact + 0.3) { const zb = fistAt(t).Tf[2] - 0.45 * Sz; H.glow(c, Xs, Ys - CE * T * Math.max(0, zb), Sz * T * 0.5, AMBER, Math.min(0.6, 0.35 * g2) * A); } }
    const FACES = [[0, 2, 6, 4], [1, 3, 7, 5], [0, 1, 5, 4], [2, 3, 7, 6], [0, 1, 3, 2], [4, 5, 7, 6]];   // (a box's faces by corner: -x, +x, -y, +y, -z, +z)
    const firstMat = p => { const a = FIST.mesh.att, i = FIST.mesh.idx[p.first]; return Math.round(a[i * 3] * 10) / 10; };
    function under2D(c, f, T) { const t = f.t, Xs = X.sx(tx), Ys = X.sy(ty), A = f.dead ? cl(1 - (t - f.deadT) / 0.3) : 1;
      if (t < TUNE.impact) { const zb = Math.max(0, fistAt(t).Tf[2] - 0.5 * Sz), close = cl(1 - zb / (zHold + 0.8)); H.softShadow(c, Xs, Ys, Sz * T * 0.55 * (0.5 + 0.6 * close), (0.15 + 0.5 * close * close) * sm((t - TUNE.rise0) / 0.7) * A); }
      else { const p = t - TUNE.impact, k = A * cl(f.life / 0.8); H.softShadow(c, Xs, Ys, RAD * T * 0.6, 0.35 * k); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * k * Math.exp(-p * 1.5); c.strokeStyle = AMBER; c.lineWidth = 2.5; c.lineCap = 'round';
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + seed, L2 = RAD * T * (0.6 + 0.35 * Math.sin(i * 2.7 + seed)); c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs + Math.cos(a) * L2 * 0.5, Ys + Math.sin(a + 0.2) * L2 * 0.5 * SE); c.lineTo(Xs + Math.cos(a + 0.12) * L2, Ys + Math.sin(a + 0.1) * L2 * SE); c.stroke(); } c.restore();
        if (!f.ring2d && f.hitDone && !f.dead) { f.ring2d = true; X.ring(tx, ty, 0.4, RAD * 1.15, 0.5, STONE, 0.5); X.ring(tx, ty, 0.3, RAD, 0.35, AMBER, 0.4); for (let i = 0; i < H.n(16); i++) { const a = i / 16 * TAU; H.P({ kind: 'smoke', x: tx + Math.cos(a) * RAD * 0.5, y: ty + Math.sin(a) * RAD * 0.35, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 1.2 - 0.3, life: 0.9, max: 0.9, size: 0.6, color: 'rgba(130,104,78,' }); } } } }
    const sq = v => v * v;
    return f;
  };
  /* (tests and tuning) the model, the timings */
  S.godshand.dbg = { get fist() { return buildFist(); }, TUNE, PV, seed: 0 };   // (seed: the tests fix the cast's randomness; 0 a new one each cast)
})();
