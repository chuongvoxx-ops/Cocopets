/* ---------- (v435 SM) Samael, the First Cataclysm, in a fight: Ruin Pressure, four powers and Wrath of the Fallen ----------
   Summoned, Samael (the Aries Anima, 02e; its model 02f5) fights through the Anima cycle (20g-dun-anima.js calls tick / fin / update
   and the draw hooks below). The summon rules (the user's, 2026-11-20): 30 s on the field, counted from when it is combat-ready (the
   entrance - sigil, portal, the assembly round its reactor, the four-hoof strike and the roar - is not counted); no cooldown on any
   power; it fights on its own; at the end of its time its attacks stop and Wrath of the Fallen fires, once, and it leaves only when the
   ultimate's last frame is done. Whenever it is free (one power at a time, each with anticipation, mechanical activation, build-up,
   the action, its impact's reaction and the recovery: the animation lock) its mind weighs the field:
     Hellbreak Charge     a monster far off: it paws the ground, drops its head, the horn rings race and heat runs to the tips, then
                          it gallops through the field (really moving and colliding): monsters in its path struck and thrown aside, a
                          trail of burning ground, then a horn-first impact and a hemispherical shockwave. Level 4: two charges (it
                          turns on another monster), level 7: three, the last ending in a volcanic explosion.
     Horns of Perdition   monsters near it or bunched: it plants its forelegs, the horn segments part and spin into blades, and each
                          swing of its head throws a crescent of plasma that flies through the monsters (3 / 5 / 7 crescents; level 7
                          ends in a cross-shaped detonation on the crowd).
     Furnace Overdrive    an opening to raise the pressure: it braces, the chest armour unfolds round the Heart of Ruin, the rings
                          extend, plasma jets from the shoulders, a burning corona forms round it: 8 / 11 / 14 s of faster attacks,
                          fire on everything near it, more Ruin Pressure from every blow, hotter charge trails. Casting it again
                          refreshes it (no stacking); it never lengthens the summon.
     First Impact         a crowd or a boss: it compresses, the reactor bursts, it leaps high, hangs as its horns turn into a drill
                          in a corona of plasma, then dives: the ground fractures, a shockwave (1 / 2 / 3 of them), molten rock
                          spires burst up, monsters are thrown; level 7 ends in a volcanic explosion.
   Ruin Pressure (its passive, 0..100): built by hits, charges, heavy impacts, shields broken and blows on the pet; at the top the
   Cataclysm State (12 s; never touching the summon's time): the reactor white-hot, horns spread, armour lifting off the plasma, jets
   from the shoulders, +20% damage, +15% speed, more burning. Shown round the summon button (a crimson arc) and by the reactor itself.
   Wrath of the Fallen (six phases, ~12.4 s: the Awakening, the Breaking of the Seal, Ascension, the Fallen Star, Wrath of the Fallen,
   the God Remains): it leaps into the sky, becomes a meteor and falls on the densest crowd: a layered impact (flash, fireball, dome
   shockwaves, crimson rings, molten rock, a pillar of fire, smoke, embers, secondary blasts, a final burst, cooling ground): the
   nearest take the most, the rings add area damage, every monster hit burns and takes more damage for a while (Ruin). If the
   Cataclysm State was burning when the time ran out, its energy enlarges the ultimate. Then it dissolves into embers, its reactor last.
   Every number a design choice is in CFG. Without the GPU painter the powers still act in full, shown with the game's own particles.
   lowFx halves the debris and drops the costliest layers.
   Clean-up: stop() (the stage ends), the end of the summon, the pet's death or an interrupted power release the ward, the zones
   it holds, the camera and every effect, and free its GPU buffers.
   Pure hooks for the boss fight (no game state touched): SAMAEL_MOVES.poseFor(kind, t, o) / easePose(store, tg, dt) / ultPose(t) / UT /
   CFG; create(H) with H.noAuto (the mind never picks: the controller calls cast) and H.stand (it never walks to guard); on an
   instance: cast(a, kind, o) / interrupt(a), fx (the effect records), drawFxList(c, list, ground) (any list of FX records drawn as
   this module draws its own), drawWrath(c, o) (the ultimate's picture at a scene o = { x, y the impact, t, k, seed, cata, sky,
   ground }), bodyLight(c, r, P, alpha, at) (the light over the body), slashOf(o) (a crescent's record), shake-free event helpers
   impactFx(x, y, k, big) and waveFx(x, y, R). */
const SAMAEL_MOVES = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3), ein = u => cl(u) * cl(u);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t)), settle = (t, t0, f, k) => (t > t0 ? Math.exp(-(t - t0) * k) * Math.sin((t - t0) * f) : 0);
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const FSY = 0.55, BIG = 1.1;   // (v435 SM concept2: the long body: drawn a little smaller so it stays on a phone screen)
  /* ---- the numbers (damage multipliers times the Anima's power P = the pet's attack x ANIMA_POWER[form] (x 2 awakened); [a, b, c] by form) ---- */
  const CFG = {
    life: 30,                                                        // its active time (s), whatever its form
    walk: { speed: 2.7, acc: 2.4, turn: 2.6 },
    ruin: { max: 100, hit: 1.1, charge: 5, impact: 4, shield: 12, hurt: 40, cata: 12, dmgK: 1.2, spdK: 1.15, burn: true, after: 25, overK: 1.5 },
    charge: { wind: 0.62, rewind: 0.3, speed: 10.5, minD: 2.4, maxD: 9, w: 1.0, dmg: 0.75, fin: [1.8, 2.1, 2.4], finR: [2.0, 2.2, 2.5], n: [1, 2, 3], volc: 3.2, volcR: 3.8, rec: 0.5, kb: 6, trailGap: 0.85, fire: 0.32 },
    perd: { n: [3, 5, 7], wind: 0.72, gap: 0.4, speed: 9.5, range: 8.5, w: 1.15, dmg: 0.62, cross: 3.0, crossR: 3.0, rec: 0.55 },
    over: { dur: [8, 11, 14], wind: 1.15, tick: 0.5, r: 2.9, dmg: 0.22, rate: 1.25 },
    impact: { cr: 0.45, rise: 0.5, hang: 0.45, dive: 0.28, h: 3.4, waves: [1, 2, 3], R: [3.0, 3.3, 3.6], dmg: [1.6, 1.7, 1.85], wave: 0.9, gap: 0.35, volc: 3.0, volcR: 4.4, rec: 0.75, spires: [4, 6, 8] },
    roar: { dmg: 0.3, r: 2.8 },
    ult: { r: 10, core: 3.2, k1: 7, kc: 3.5, k2: 3, k3: 2, weak: 8, weakBoss: 5, weakK: 1.2, weakKBoss: 1.1 },
  };
  /* the ultimate's timeline (s): the Awakening to p1, the Breaking of the Seal to p2, Ascension to p3, the Fallen Star to hit, Wrath of the
     Fallen to p5 (waves at w2, w3, the final burst at fb), the God Remains to len */
  const UT = { p1: 2.0, p2: 3.8, launch: 4.35, p3: 5.6, dive: 6.5, hit: 8.0, w2: 8.35, w3: 8.75, fb: 9.4, p5: 10.0, roar: 10.9, len: 12.4 };
  const COL = { crim: '#FF3A1E', ember: '#FF6A2A', hot: '#FFB15A', white: '#FFF2DC', gold: '#FFC24D', dust: '#5A4A48', smoke: '#2A1A1C', dark: '#140608' };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const GLS = () => (typeof SAMAEL_GL !== 'undefined' ? SAMAEL_GL : null);

  /* ---- the power poses (pure: shared with a boss): poseFor(kind, t, o) the pose a power holds t s into it (kind 'charge' | 'perd' | 'over'
     | 'impact' | 'roar'; anything else: rest); o: base (an idlePose), wind, charge, first, last, n, gap, k, ph (Impact's phases), stag.
     Every power in the same beats, each its own curve so they overlap and blend: the stance, the weight shift (anticipation), the
     machinery (the horns' segments and rings, the reactor's plates), the build (the core, the heat), the action, the reaction to its own
     impact (recoil), the return (a damped settle) ---- */
  function poseFor(kind, t, o) {
    o = o || {}; const base = o.base || {};
    const tg = { head: 0, look: 0, jaw: 0, horn: 0, hornSpin: 1, hornFwd: 0, hornHeat: 0, crown: 0, drill: 0, core: base.core == null ? 0.9 : base.core, coreOpen: 0, coreBig: 0, heat: 0, vent: 0, dorsal: 0, air: 0, meteor: 0, shell: 0, celest: 0, glow: 0, live: 1, crouch: 0, rear: 0, pitch: 0, lift: 0, tail: 0, stagger: o.stag || 0, eye: 1, feet: null, dx: 0, spread: 0, shift: 0, mech: 0, gal: 0 };
    if (kind === 'charge') { const w = o.wind || CFG.charge.wind, ct = o.charge || 0.6, tI = w + ct, end = o.last ? 1 - sstep(tI + 0.25, tI + 0.75, t) : 1;
      const st = sstep(0, 0.22, t), ws = sstep(0.04, w * 0.7, t) * (1 - sstep(w - 0.12, w, t)), mc = sstep(0.08, w, t), go = sstep(w - 0.08, w + 0.1, t) * (1 - sstep(tI - 0.05, tI + 0.03, t));
      const th = bump(t, tI - 0.06, tI, tI + 0.08, tI + 0.35), rc = bump(t, tI, tI + 0.06, tI + 0.15, tI + 0.5), rv = settle(t, tI + 0.35, 7, 3.5), paw = o.first ? bump(t, 0.05, 0.16, 0.3, 0.46) : 0;
      tg.spread = 0.3 * st * (1 - go); tg.dx = -0.55 * ws + 0.3 * go - 0.65 * rc + 0.12 * rv; tg.crouch = 0.42 * ws + 0.32 * go + 0.25 * th; tg.head = 0.85 * Math.max(ws * 0.85, mc * 0.55, go) - 0.55 * th + 0.18 * rv;
      tg.hornFwd = Math.max(mc * 0.6, go, th * 0.8) * end; tg.hornSpin = 1 + 5 * mc * end + 3 * go; tg.hornHeat = (0.6 * mc + 0.6 * go + th) * end; tg.horn = 0.15 * mc * end; tg.mech = mc * end;
      tg.core += 0.6 * mc + 0.5 * go + 0.8 * th; tg.glow = 0.2 * mc + 0.25 * go + 0.5 * th; tg.gal = go; tg.jaw = 0.5 * th + 0.15 * paw; tg.rear = 0.12 * th + 0.18 * paw; tg.stagger += 0.3 * rc;
      tg.live = 1 - 0.8 * Math.max(ws, go, th); tg.tail = 0.5 * go - 0.3 * ws + 0.4 * rc; tg.pitch = 0.035 * Math.sin(t * 28) * ws * (1 - go);
      if (paw > 0.01) tg.feet = [[-0.7 * Math.sin(Math.PI * paw) - 0.1, 0, 0.55 * paw], null, null, null]; }
    else if (kind === 'perd') { const w = o.wind || CFG.perd.wind, n = o.n || 3, gap = o.gap || CFG.perd.gap, last = w + (n - 1) * gap, end = last + (o.k >= 3 ? 0.9 : 0.5);
      const pl = sstep(0, 0.3, t) * (1 - sstep(end - 0.35, end, t)), opn = sstep(0.12, w, t) * (1 - sstep(end - 0.5, end - 0.1, t)); let lk = 0, nod = 0;
      for (let i = 0; i < n; i++) { const ts = w + i * gap, p = (t - (ts - gap * 0.65)) / (gap * 0.95), dir = i % 2 ? -1 : 1; if (p > 0 && p < 1.2) { lk = dir * (-0.55 * Math.cos(Math.PI * cl(p))) * (p > 1 ? 1 - (p - 1) * 2 : 1); nod = Math.max(nod, bump(p, 0.35, 0.55, 0.65, 0.95)); } }
      const cx = o.k >= 3 ? bump(t, last + 0.15, last + 0.35, last + 0.5, last + 0.85) : 0;
      tg.spread = 0.45 * pl; tg.crouch = 0.35 * pl + 0.2 * nod + 0.3 * cx; tg.dx = -0.18 * pl + 0.1 * nod; tg.feet = pl > 0.02 ? [[0.35 * pl, 0, 0], [0.35 * pl, 0, 0], null, null] : null;
      tg.horn = opn; tg.hornSpin = 1 + 7 * opn; tg.hornHeat = 0.4 * opn + 0.5 * nod; tg.head = 0.22 * pl + 0.3 * nod - 0.5 * cx; tg.look = 0.85 * lk; tg.jaw = 0.25 * nod + 0.8 * cx; tg.core += 0.6 * opn + 0.6 * cx; tg.glow = 0.3 * opn + 0.4 * cx; tg.mech = opn; tg.live = 1 - 0.7 * pl; tg.tail = -0.6 * lk; tg.shift = 0.25 * lk; }
    else if (kind === 'over') { const w = o.wind || CFG.over.wind, br = sstep(0, 0.35, t) * (1 - sstep(w + 0.2, w + 0.7, t)), un = sstep(0.2, w, t), ro = bump(t, w - 0.25, w - 0.05, w + 0.25, w + 0.6), rv = settle(t, w + 0.5, 6, 3);
      tg.crouch = 0.5 * br; tg.spread = 0.5 * br; tg.coreOpen = un * (1 - 0.45 * sstep(w + 0.2, w + 0.8, t)); tg.coreBig = 0.25 * ro; tg.core += 1.5 * un; tg.dorsal = 0.85 * un; tg.vent = 0.5 * un * (1 - sstep(w + 0.3, w + 0.9, t)); tg.mech = br;
      tg.head = 0.25 * br * (1 - ro) - 0.55 * ro + 0.1 * rv; tg.jaw = ro; tg.hornSpin = 1 + 4 * un; tg.horn = 0.3 * ro; tg.glow = 0.5 * un + 0.3 * ro; tg.pitch = 0.02 * Math.sin(t * 40) * br * (1 - un); tg.live = 1 - 0.75 * br; tg.heat = 0.3 * ro; }
    else if (kind === 'impact') { const C = CFG.impact, t1 = o.cr || C.cr, t2 = t1 + (o.rise || C.rise), t3 = t2 + (o.hang || C.hang), t4 = t3 + (o.dive || C.dive);
      const comp = sstep(0.04, t1, t) * (1 - sstep(t1, t1 + 0.08, t)), up = sstep(t1 - 0.02, t1 + 0.14, t) * (1 - sstep(t4 - 0.03, t4 + 0.01, t)), dr = sstep(t1 + 0.1, t3, t) * (1 - sstep(t4, t4 + 0.35, t)), dv = sstep(t3, t4, t) * (1 - sstep(t4, t4 + 0.1, t));
      const land = bump(t, t4 - 0.01, t4 + 0.03, t4 + 0.15, t4 + 0.65), rv = settle(t, t4 + 0.4, 6.5, 3.2);
      tg.crouch = 1.0 * comp + 0.85 * land; tg.spread = 0.4 * comp + 0.55 * land; tg.air = up; tg.drill = dr; tg.hornFwd = dr; tg.hornHeat = dr + 0.5 * land; tg.core += 1.2 * comp + 0.8 * up + 1.2 * land; tg.glow = 0.3 * comp + 0.4 * up + 0.6 * land;
      tg.head = 0.4 * comp - 0.25 * up * (1 - dv) + 0.55 * dv + 0.4 * land + 0.12 * rv; tg.pitch = 0.45 * dv - 0.12 * up * (1 - dv); tg.jaw = 0.55 * land; tg.tail = 0.6 * up - 0.3 * land; tg.mech = Math.max(comp, up); tg.dorsal = 0.5 * up; tg.live = 1 - 0.85 * Math.max(comp, up, land); tg.stagger += 0.15 * land; }
    else if (kind === 'roar') { const r = bump(t, 0.05, 0.35, 0.8, 1.25), an = bump(t, 0, 0.12, 0.18, 0.35); tg.head = 0.25 * an - 0.55 * r + 0.25 * bump(t, 0.5, 0.65, 0.8, 1.2); tg.jaw = r; tg.horn = 0.35 * r; tg.mech = r; tg.hornSpin = 1 + 3 * r; tg.core += r; tg.glow = 0.4 * r; tg.dorsal = 0.6 * r; tg.live = 1 - 0.7 * r;
      tg.crouch = 0.2 * an + 0.15 * bump(t, 0.4, 0.55, 0.7, 1.1); tg.dx = -0.2 * r + 0.1 * an; tg.spread = 0.25 * bump(t, 0, 0.3, 1.0, 1.4); }
    return tg;
  }
  const PZK = ['head', 'look', 'jaw', 'horn', 'hornSpin', 'hornFwd', 'hornHeat', 'crown', 'drill', 'core', 'coreOpen', 'coreBig', 'heat', 'vent', 'dorsal', 'air', 'meteor', 'shell', 'celest', 'glow', 'live', 'crouch', 'rear', 'pitch', 'lift', 'tail', 'stagger', 'eye', 'dx', 'spread', 'shift', 'mech', 'gal'];
  // each key's stiffness (a critically damped spring's angular frequency): the jaw and the stagger quickest, the body's weight slower, the reactor's plates mechanical
  const PZW = { jaw: 26, stagger: 26, head: 15, crouch: 16, rear: 15, dx: 13, pitch: 22, look: 9, spread: 7, shift: 6, hornSpin: 6, core: 11, glow: 11, eye: 12, coreOpen: 7, coreBig: 9, heat: 5, vent: 7, dorsal: 8, air: 16, meteor: 8, shell: 8, celest: 6, mech: 8, tail: 10, horn: 9, hornFwd: 10, hornHeat: 9, crown: 6, drill: 9, gal: 9 };
  const ONE = { live: 1, hornSpin: 1, eye: 1 };
  function easePose(store, tg, dt) {
    let pz = store.pz; if (!pz) pz = store.pz = Object.assign({}, tg); let pv = store.pzv; if (!pv) pv = store.pzv = {};
    dt = Math.max(0, Math.min(0.1, dt || 0));
    for (let j = 0; j < PZK.length; j++) { const q = PZK[j], g = tg[q] == null ? (ONE[q] || 0) : tg[q]; if (pz[q] == null) pz[q] = g; const v = pv[q] || 0;
      const w = PZW[q] || 7.5, e = Math.exp(-w * dt), d = pz[q] - g, jv = (v + w * d) * dt; pz[q] = g + (d + jv) * e; pv[q] = (v - jv * w) * e; }
    pz.feet = tg.feet || null; return pz;
  }
  /* the ultimate's pose at t (pure): o.cata (0..1, the Cataclysm State's energy left: a hotter, bigger awakening) */
  function ultPose(t, o) {
    const U = UT, ck = cl((o && o.cata) || 0), p1 = sstep(0, U.p1, t), p2 = sstep(U.p1, U.p2, t), roar = bump(t, U.p1 + 0.05, U.p1 + 0.3, U.p1 + 0.9, U.p1 + 1.3), brace = bump(t, U.p2 - 0.1, U.p2 + 0.25, U.launch - 0.05, U.launch + 0.1);
    const up = sstep(U.launch - 0.05, U.launch + 0.15, t) * (1 - sstep(U.hit - 0.03, U.hit + 0.02, t)), met = sstep(U.launch + 0.15, U.p3 - 0.2, t) * (1 - sstep(U.hit + 0.1, U.hit + 0.8, t)), shl = sstep(U.p3 - 0.7, U.p3, t) * (1 - sstep(U.hit, U.hit + 0.3, t));
    const land = bump(t, U.hit - 0.01, U.hit + 0.05, U.hit + 0.3, U.hit + 1.0), p6 = sstep(U.p5, U.len, t), keep = 1 - sstep(U.p5, U.p5 + 1.2, t), sealed = p2 * (1 - sstep(U.launch, U.p3 - 0.3, t)), fr = bump(t, U.roar - 0.05, U.roar + 0.25, U.roar + 0.6, U.roar + 1.0);
    const dv = sstep(U.dive, U.hit, t) * (1 - land);
    return {
      head: 0.25 * p1 * (1 - p2) - 0.6 * roar + 0.35 * brace - 0.15 * up + 0.5 * dv + 0.45 * land + 0.55 * sstep(U.p5 + 0.2, U.roar - 0.1, t) * (1 - fr) - 0.4 * fr + 0.3 * p6,
      jaw: 0.25 * bump(t, 0.4, 0.9, 1.4, 1.9) + roar + 0.5 * land + fr, crouch: 0.15 * p1 * (1 - p2) + 0.95 * brace + 0.9 * land + 0.15 * p6, spread: 0.35 * p1 * (1 - up) + 0.5 * brace + 0.5 * land * keep,
      horn: 0.2 * p1 * (1 - p2), hornSpin: 1 + 4 * p1 + 6 * p2 * (1 - up) + 3 * up, crown: sealed, hornFwd: up * (1 - land), drill: met, hornHeat: 0.4 * p1 + 0.6 * up + 0.5 * land * keep,
      core: 0.9 + 2.2 * p1 + 1.2 * p2 + 1.5 * up + 2.5 * land - 3.2 * p6, coreOpen: sealed * 0.9 + 0.5 * land * keep, coreBig: 0.5 * sealed + 0.3 * land * keep, heat: Math.min(1, 0.85 * p1 + 0.3 * ck + p2 + up) * (1 - 0.8 * sstep(U.p5, U.len - 0.6, t)),
      vent: sealed + 0.4 * land * keep, dorsal: sealed + 0.6 * land * keep, celest: sealed + 0.5 * met, air: up, meteor: met, shell: shl, glow: 0.3 * p1 + 0.5 * p2 + 0.5 * up + 0.9 * land - 1.2 * p6,
      mech: Math.max(0, sstep(0.2, U.p1, t) * (1 - up) - 0.6 * p6), pitch: 0.016 * Math.sin(t * 47) * p1 * (1 - up) + 0.5 * dv, live: 0.4 - 0.3 * Math.max(p1, up) + 0.5 * p6, eye: 1 + p1 + 2 * roar + fr,
      dx: -0.3 * brace + 0.3 * land, tail: 0.5 * up - 0.4 * land, rear: 0.15 * roar, stagger: 0, look: 0, feet: null, gal: 0, shift: 0, lift: 0,
      yawOff: 0.6 * Math.sin(Math.PI * p1) * (1 - p2) - 0.4 * Math.sin(Math.PI * p2), dis: sstep(U.len - 1.15, U.len - 0.1, t) };
  }

  function create(H) {
    const X = H.X, me = H.me, g = H.g, T = H.T, ST = H.ST, S = H.S;
    const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
    const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
    const glOn = () => { const G = GLS(); return !!(G && G.usable()); };
    const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
    const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
    const sfx = n => { try { if (X.sfx && X.sfx[n]) X.sfx[n](); } catch (e) {} };
    const FX = [];                  // effects in the world: { kind, t, life, ... }
    let UL = null;                  // Wrath of the Fallen in progress
    let wardOff = null, released = true;
    const kOf = a => Math.max(1, Math.min(3, a.k | 0)), LQ = () => (lowFx() ? 0.5 : 1);
    const list = () => S.list.filter(a => a.id === 'aries');
    /* model units -> tiles */
    const HT = [0, 18.5, 19.3, 20.1];   // (v435 SM: the model's heights, as SAMAEL_GL.HEIGHT)
    const u2t = a => { const aw = a.st === 'awaken' || (UL && UL.a === a), kv = aw ? 3 : kOf(a), G = GLS(); return ANIMA_SIZE[kv] * (aw ? 1.18 : 1) * BIG / ((G && G.HEIGHT) || HT)[kv]; };
    const stride = a => ((GLS() && GLS().STRIDE) || 2.9) * u2t(a);
    function footW(a, i) { const G = GLS(), L = G ? G.LEGS[i] : { x: i < 2 ? 2.5 : -2.7, s: i % 2 ? -1 : 1, fy: 1.4 }, u = u2t(a), y = a.sm.yaw, mx = L.x * ((G && G.XS) || 1), my = L.s * L.fy; return { x: a.x + (mx * Math.cos(y) - my * Math.sin(y)) * u, y: a.y + (mx * Math.sin(y) + my * Math.cos(y)) * u, f: !!L.f }; }
    const frontOf = (a, d) => ({ x: a.x + Math.cos(a.sm.yaw) * d, y: a.y + Math.sin(a.sm.yaw) * d });
    /* ---- its power: the Anima's, times the Cataclysm State's; every blow builds Ruin Pressure (a broken shield more), burns in the Cataclysm ---- */
    const pw = a => H.P(a) * (a.sm && a.sm.cata > 0 ? CFG.ruin.dmgK : 1);
    function hitM(a, m, d, o) { const sh = m.shield > 0; o = Object.assign({ el: 'fire' }, o || {}); if (a.sm && a.sm.cata > 0) o.burn = true; const r = H.hit(m, d, o);
      if (a.sm && !o.dot) { gain(a, CFG.ruin.hit * (o.big ? 2 : 1)); if (sh && !(m.shield > 0)) gain(a, CFG.ruin.shield); } return r; }
    const area = (a, x, y, R, dmg, o) => { let n = 0; for (const m of H.living()) if (Math.hypot(m.x - x, m.y - y) < R + m.r) { hitM(a, m, dmg, o); if (o && o.kbf) knock(m, x, y, o.kbf); n++; } return n; };
    const knock = (m, fx, fy, f) => { if (m.still) return; const d = Math.hypot(m.x - fx, m.y - fy) || 1, k = f * (m.boss ? 0.12 : m.type === 'golem' || m.type === 'knight' ? 0.5 : 1); m.kbx = (m.kbx || 0) + (m.x - fx) / d * k; m.kby = (m.kby || 0) + (m.y - fy) / d * k; };
    function gain(a, v) { const ab = a.sm; if (!ab || ab.cata > 0 || (UL && UL.a === a)) return; ab.ruin = Math.min(CFG.ruin.max, ab.ruin + v * (ab.over > 0 ? CFG.ruin.overK : 1));
      if (ab.ruin >= CFG.ruin.max) { ab.cata = CFG.ruin.cata; ab.cataT = 0; X.text(a.x, a.y - 2.6, 'CATACLYSM', COL.hot, 15, { crit: true, life: 1.2 }); sfx('crash'); X.shake(8, 0.35); X.flash(0.18, '#FF7A3D');
        FX.push({ kind: 'ringw', x: a.x, y: a.y, R: 3.6, t: 0, life: 0.8, seed: Math.random() * 40 }); FX.push({ kind: 'hemi', x: a.x, y: a.y, R: 2.6, t: 0, life: 0.6, seed: 3 }); } }
    /* ---- the pet's hurts raise the pressure too (a ward that only listens) ---- */
    function ensureWard() { if (wardOff || !X.addWard) return; wardOff = X.addWard(d => { if (d > 0) for (const a of list()) if (a.st === 'fight') gain(a, d / Math.max(1, ST().hp) * CFG.ruin.hurt); return d; }, false); }
    /* ---- state ---- */
    function stOf(a) { return a.sm || (a.sm = { act: null, last: null, last2: null, pz: null, yaw: (a.face || 1) > 0 ? 0.45 : Math.PI - 0.45, yawT: null, ph: 0, mv: 0, gal: 0, gk: 1, vx: 0, vy: 0, lvx: 0, lvy: 0, ax: 0, ay: 0, stag: 0, first: false, en: -1, gap: 0, thudT: 0, ruin: 0, cata: 0, cataT: 0, over: 0, overK: 0, overTick: 0, ready: false, sn: 0 }); }
    function crowd(x, y, reach, rr) {
      const tg = H.near(x, y, reach); if (!tg.length) return null; let best = null, bn = -1;
      for (const m of tg) { const nb = tg.filter(q => Math.hypot(q.x - m.x, q.y - m.y) < rr); if (nb.length > bn) { bn = nb.length; best = nb; } }
      return { x: best.reduce((s, m) => s + m.x, 0) / best.length, y: best.reduce((s, m) => s + m.y, 0) / best.length, n: best.length, m: best[0] };
    }
    /* ---- moving: quick and predatory (it turns into its heading fast); the gait's phase from the distance; the gallop for speed ---- */
    function stepTo(a, dt, tx, ty, vmax) {
      const ab = a.sm, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), head = Math.atan2(dy, dx), tk = d > 0.3 ? cl(1 - Math.abs(angD(head, ab.yaw)) / 1.8) : 0, want = d > 0.3 ? Math.min(vmax * (ab.cata > 0 ? CFG.ruin.spdK : 1), d * 1.4) * tk : 0;
      const acc = Math.min(1, dt * CFG.walk.acc); ab.vx += ((d > 0.3 ? dx / d * want : 0) - ab.vx) * acc; ab.vy += ((d > 0.3 ? dy / d * want : 0) - ab.vy) * acc;
      if (d > 0.3) ab.yawT = head;
      moveBy(a, ab.vx * dt, ab.vy * dt);
    }
    function moveBy(a, mx, my) { const ab = a.sm, p = X.walkPoint(a.x + mx, a.y + my, { r: 0.6, mv: 0, x: a.x, y: a.y }), dd = Math.hypot(p.x - a.x, p.y - a.y); a.x = p.x; a.y = p.y;
      const ph0 = ab.ph; ab.ph += dd / Math.max(0.05, stride(a) * (ab.gk || 1) * Math.max(0.3, ab.mv)) * TAU; footfalls(a, ph0, ab.ph); return dd; }
    function footfalls(a, ph0, ph1) { const G = GLS(); if (!G) return; const ab = a.sm, A = ab.act;
      for (const f of G.footfalls(ph0, ph1, ab.gal)) { const p = footW(a, f.i), big = A && A.kind === 'charge' && A.rt > A.wind;
        if (big) { FX.push({ kind: 'crack', x: p.x, y: p.y, R: 0.9, t: 0, life: 1.6, seed: Math.random() * 50, heat: 1.1 }); sparks(p.x, p.y, 3, 1.2); X.shake(2.5, 0.08); }
        if (ab.mv > 0.2) FX.push({ kind: 'foot', x: p.x, y: p.y, R: big ? 1.2 : f.f ? 0.85 : 0.65, t: 0, life: big ? 0.9 : 0.7, seed: Math.random() * 50, f: f.f ? 1 : 0, big: big ? 1 : 0 });
        if (f.f && ab.mv > 0.45) { X.shake(0.8 + ab.mv * 1.2, 0.06); if (ab.thudT <= 0) { sfx('thud'); ab.thudT = 0.45; } } } }
    function idleSteps(a) { const ab = a.sm, M = a.smM; if (!M || M.n === ab.sn) return; ab.sn = M.n; for (const s of M.steps) if (s.idle || s.land) { const p = footW(a, s.i); FX.push({ kind: 'foot', x: p.x, y: p.y, R: s.land ? 1.0 : s.f ? 0.6 : 0.5, t: 0, life: 0.7, seed: Math.random() * 50, f: s.f ? 1 : 0, small: s.land ? 0 : 1, big: s.land ? 1 : 0 }); } }
    function guard(a, dt) {
      if (H.stand) { a.sm.vx *= 1 - Math.min(1, dt * 4); a.sm.vy *= 1 - Math.min(1, dt * 4); return; }
      const ab = a.sm, side = a.side || -1, dp = Math.hypot(me.x - a.x, me.y - a.y);
      if (dp > 14) { const p = X.walkPoint(me.x + side * 2.2, me.y - 1.0, { r: 0.6, mv: 0, x: me.x, y: me.y }); a.x = p.x; a.y = p.y; ab.vx = ab.vy = 0; return; }
      const f = H.near(a.x, a.y, 9)[0]; let tx = me.x + side * 2.4 + (me.vx || 0) * 0.4, ty = me.y - 1.0 + (me.vy || 0) * 0.4;
      if (f) { tx = lerp(tx, f.x, 0.4); ty = lerp(ty, f.y, 0.4); }   // (it presses toward the fight: never idle while monsters are near)
      if (Math.hypot(tx - a.x, ty - a.y) < 0.8) { ab.vx *= 1 - Math.min(1, dt * 3); ab.vy *= 1 - Math.min(1, dt * 3); moveBy(a, ab.vx * dt, ab.vy * dt); if (f) ab.yawT = Math.atan2(f.y - a.y, f.x - a.x); return; }
      stepTo(a, dt, tx, ty, CFG.walk.speed * (dp > 6 ? 1.6 : 1));
    }
    /* ---- the mind: no cooldowns; when it is free it weighs the field and picks the power that fits it (a bias against repeating itself, a
       little chance: never a fixed rotation) ---- */
    function choose(a) {
      const ab = a.sm, k = kOf(a), foes = H.near(a.x, a.y, 11); if (!foes.length) return null;
      const dn = Math.hypot(foes[0].x - a.x, foes[0].y - a.y), boss = foes.find(m => m.boss), opts = [];
      const far = foes.find(m => { const d = Math.hypot(m.x - a.x, m.y - a.y); return d > 3.2 && d < CFG.charge.maxD; }) || (boss && Math.hypot(boss.x - a.x, boss.y - a.y) < CFG.charge.maxD ? boss : null);
      if (far) { const d = Math.hypot(far.x - a.x, far.y - a.y); opts.push({ kind: 'charge', s: (d > 3.2 ? 0.62 + 0.07 * Math.min(5, d - 3) : 0.35) + (far.boss ? 0.15 : 0), o: { m: far } }); }
      const nearN = foes.filter(m => Math.hypot(m.x - a.x, m.y - a.y) < 4.2).length, c = crowd(a.x, a.y, 8.5, 2.6);
      if (nearN >= 2 || (c && c.n >= 3)) opts.push({ kind: 'perd', s: Math.max(nearN >= 2 ? 0.6 + 0.1 * Math.min(5, nearN) : 0, c && c.n >= 3 ? 0.48 + 0.06 * c.n : 0), o: { x: (c || foes[0]).x, y: (c || foes[0]).y } });
      if ((c && c.n >= 3) || boss) { const tgt = boss && (!c || c.n < 4) ? boss : c; opts.push({ kind: 'impact', s: (c && c.n >= 3 ? 0.55 + 0.08 * Math.min(6, c.n) : 0.4) + (boss ? 0.28 : 0), o: { x: tgt.x, y: tgt.y } }); }
      if (!(ab.over > 1.5) && a.life > 4) { const n6 = foes.filter(m => Math.hypot(m.x - a.x, m.y - a.y) < 6).length; opts.push({ kind: 'over', s: 0.42 + 0.07 * Math.min(5, n6) + (ab.ruin > 60 ? 0.12 : 0) + (ab.over > 0 ? -0.2 : 0) }); }
      if (!opts.length) return null;
      for (const q of opts) { if (q.kind === ab.last) q.s *= 0.72; if (q.kind === ab.last && q.kind === ab.last2) q.s *= 0.6; q.s += Math.random() * 0.12; }
      opts.sort((p, q) => q.s - p.s); return opts[0].s > 0.3 ? opts[0] : null;
    }
    /* ---- the powers ---- */
    function start(a, kind, o) {
      const ab = a.sm, k = kOf(a); ab.act = Object.assign({ kind, t: 0, k, hits: 0 }, o || {}); const A = ab.act; ab.last2 = ab.last; ab.last = kind; A.rate = 1;
      if (kind === 'charge') { A.n = CFG.charge.n[k - 1]; A.i = 0; A.hit = new Set(); aimCharge(a, A, A.m, CFG.charge.wind); sfx('hum'); }
      else if (kind === 'perd') { A.n = CFG.perd.n[k - 1]; A.wind = CFG.perd.wind; A.gap = CFG.perd.gap; A.last = A.wind + (A.n - 1) * A.gap; A.end = A.last + (k >= 3 ? 1.0 : 0.6) + CFG.perd.rec * 0.5; A.fired = 0; if (A.x == null) { const f = H.near(a.x, a.y, 9)[0]; A.x = f ? f.x : a.x + Math.cos(ab.yaw) * 3; A.y = f ? f.y : a.y + Math.sin(ab.yaw) * 3; } ab.yawT = Math.atan2(A.y - a.y, A.x - a.x); sfx('hum'); }
      else if (kind === 'over') { A.wind = CFG.over.wind; A.end = A.wind + 0.75; sfx('hum'); }
      else if (kind === 'impact') { const C = CFG.impact; A.n = C.waves[k - 1]; A.t1 = C.cr; A.t2 = A.t1 + C.rise; A.t3 = A.t2 + C.hang; A.t4 = A.t3 + C.dive; A.end = A.t4 + (A.n - 1) * C.gap + C.rec + (k >= 3 ? 0.35 : 0); A.sx = a.x; A.sy = a.y;
        if (A.x == null) { const f = H.near(a.x, a.y, 9)[0]; A.x = f ? f.x : a.x; A.y = f ? f.y : a.y; } const p = X.walkPoint(A.x, A.y, { r: 0.6, mv: 0, x: a.x, y: a.y }); A.x = p.x; A.y = p.y; ab.yawT = Math.atan2(A.y - a.y, A.x - a.x); sfx('hum'); }
      else if (kind === 'roar') { A.end = 1.35; }
    }
    function aimCharge(a, A, m, wind) { const ab = a.sm, d0 = Math.hypot(m.x - a.x, m.y - a.y) || 1, dx = (m.x - a.x) / d0, dy = (m.y - a.y) / d0, dist = Math.max(CFG.charge.minD, Math.min(CFG.charge.maxD, d0 + 0.9));
      Object.assign(A, { m, dx, dy, dist, rt: 0, wind, chargeT: dist / (CFG.charge.speed * (ab.cata > 0 ? CFG.ruin.spdK : 1)), trav: 0, nextT: 0.4, launched: false, struck: false }); A.hit = new Set(); ab.yawT = Math.atan2(dy, dx); }
    function act(a, dt) {
      const ab = a.sm, A = ab.act, rate = ab.over > 0 && A.kind !== 'over' ? CFG.over.rate : 1, dtr = dt * rate, t0 = A.t; A.t += dtr; const t = A.t, k = A.k, P = pw(a), cross = x => t0 < x && t >= x;
      if (A.kind === 'charge') {
        const C = CFG.charge, r0 = A.rt; A.rt += dtr; const rt = A.rt, w = A.wind, tI = w + A.chargeT, rc = x => r0 < x && rt >= x;
        if (rt < w) { ab.mv *= 1 - Math.min(1, dt * 8); ab.vx = ab.vy = 0; ab.gal = 0;
          if (rc(0.1)) { const f = frontOf(a, 0.8); FX.push({ kind: 'crack', x: f.x, y: f.y, R: 1.1, t: 0, life: 1.6, seed: Math.random() * 50, heat: 1 }); FX.push({ kind: 'dust', x: f.x, y: f.y, R: 1.2, t: 0, life: 0.8, seed: 7 }); sparks(f.x, f.y, 6, 1.4); }
          if (Math.random() < dt * 6) X.shake(1.2, 0.05); }
        else if (r0 < tI) { const ease = u => u < 0.15 ? (u / 0.15) * (u / 0.15) * 0.075 : u > 0.92 ? 1 - (1 - u) * (1 - u) / 0.08 * 0.04 : 0.075 + (u - 0.15) / 0.77 * 0.885, u0 = cl((r0 - w) / A.chargeT), u1 = cl((rt - w) / A.chargeT), want = (ease(u1) - ease(u0)) * A.dist;
          if (!A.launched) { A.launched = true; FX.push({ kind: 'trail', a, A, t: 0, life: A.chargeT + 0.4 }); const b = frontOf(a, -1.4); FX.push({ kind: 'dust', x: b.x, y: b.y, R: 1.8, t: 0, life: 0.8, seed: 19 }); FX.push({ kind: 'crack', x: b.x, y: b.y, R: 1.3, t: 0, life: 1.8, seed: Math.random() * 40, heat: 1.2 }); gain(a, CFG.ruin.charge); sfx('whoosh'); }
          ab.mv = 1; ab.gal = 1; ab.gk = 1.7; const dd = moveBy(a, A.dx * want, A.dy * want); A.trav += dd; if (want > 0.02 && dd < want * 0.25 && u1 > 0.2) A.rt = tI;   // (blocked: it strikes where it stands)
          if (A.trav >= A.nextT) { A.nextT = A.trav + C.trailGap; const b = frontOf(a, -0.6), big = ab.over > 0 || ab.cata > 0; X.zones.push({ kind: 'fire', x: b.x, y: b.y, r: big ? 1.05 : 0.8, life: big ? 4 : 2.6, max: big ? 4 : 2.6, dps: ST().atk * C.fire * (big ? 1.6 : 1) * (a.awk || 1), tick: 0, own: 'pet', el: 'fire' }); FX.push({ kind: 'dust', x: b.x, y: b.y, R: 1.1, t: 0, life: 0.7, seed: Math.random() * 50 }); }
          const f = frontOf(a, 1.15);
          for (const m of H.living()) { if (A.hit.has(m) || Math.hypot(m.x - f.x, m.y - f.y) > C.w + m.r) continue; A.hit.add(m); hitM(a, m, P * C.dmg); A.hits++;
            if (!m.boss && !m.still) { const sd = Math.sign(A.dx * (m.y - a.y) - A.dy * (m.x - a.x)) || 1; m.kbx = (m.kbx || 0) + (-A.dy * sd * 4.5 + A.dx * 2.5); m.kby = (m.kby || 0) + (A.dx * sd * 4.5 + A.dy * 2.5); }
            X.shake(5, 0.1); sparks(m.x, m.y, 6, 1.8); FX.push({ kind: 'ringw', x: m.x, y: m.y, R: 1.1, t: 0, life: 0.35, seed: Math.random() * 40 }); g.hitStop = Math.max(g.hitStop || 0, 0.02); } }
        if (rt >= tI) { ab.mv *= 1 - Math.min(1, dt * 9); ab.gal *= 1 - Math.min(1, dt * 6); ab.gk = 1; }
        if (!A.struck && rt >= tI) { A.struck = true; A.i++; chargeImpact(a, A, P, A.i >= A.n); }
        if (A.struck && rt >= tI + 0.22 && A.i < A.n) {   // (the next charge: it wheels on another monster, a shorter wind-up)
          const prev = A.m, nx = H.near(a.x, a.y, C.maxD).filter(m => m !== prev && Math.hypot(m.x - a.x, m.y - a.y) > 1.6)[0] || H.near(a.x, a.y, C.maxD)[0];
          if (nx) aimCharge(a, A, nx, C.rewind); else A.i = A.n; }
        if (A.struck && A.i >= A.n && rt >= tI + C.rec + 0.3) endAct(a);
        return;
      }
      else if (A.kind === 'perd') {
        const C = CFG.perd; ab.mv *= 1 - Math.min(1, dt * 8); ab.vx = ab.vy = 0; if (A.x != null) ab.yawT = Math.atan2(A.y - a.y, A.x - a.x);
        if (cross(0.15)) { FX.push({ kind: 'crack', x: frontOf(a, 0.9).x, y: frontOf(a, 0.9).y, R: 1.0, t: 0, life: 1.4, seed: Math.random() * 40, heat: 0.9 }); X.shake(3, 0.1); }
        for (let i = 0; i < A.n; i++) if (cross(A.wind + i * A.gap)) slash(a, A, i, P);
        if (k >= 3 && cross(A.last + 0.4)) crossBlast(a, A, P);
      }
      else if (A.kind === 'over') {
        ab.mv *= 1 - Math.min(1, dt * 8); ab.vx = ab.vy = 0;
        if (cross(0.1)) FX.push({ kind: 'crack', x: a.x, y: a.y, R: 1.8, t: 0, life: 2.0, seed: Math.random() * 40, heat: 1 });
        if (cross(A.wind - 0.1)) { const dur = CFG.over.dur[k - 1]; ab.over = Math.max(ab.over, dur); ab.overK = k; X.text(a.x, a.y - 2.6, 'FURNACE OVERDRIVE', COL.hot, 14, { crit: true, life: 1.1 }); sfx('crash'); X.shake(7, 0.3); X.flash(0.12, '#FF8A3D');
          if (!FX.some(f => f.kind === 'corona' && f.a === a)) FX.push({ kind: 'corona', a, t: 0, life: 1e9 }); FX.push({ kind: 'ringw', x: a.x, y: a.y, R: 3.4, t: 0, life: 0.7, seed: 5 }); FX.push({ kind: 'hemi', x: a.x, y: a.y, R: 2.2, t: 0, life: 0.55, seed: 9 }); }
      }
      else if (A.kind === 'impact') {
        const C = CFG.impact; ab.mv *= 1 - Math.min(1, dt * 8); ab.vx = ab.vy = 0;
        if (cross(A.t1 - 0.05)) { FX.push({ kind: 'burst', a, t: 0, life: 0.5 }); FX.push({ kind: 'crack', x: a.x, y: a.y, R: 2.0, t: 0, life: 2.0, seed: Math.random() * 40, heat: 1.2 }); FX.push({ kind: 'dust', x: a.x, y: a.y, R: 2.2, t: 0, life: 0.9, seed: 3 }); X.shake(6, 0.2); sfx('whoosh'); }
        if (t > A.t1 && t < A.t4) { const u = sstep(A.t1, A.t4, t), hz = t < A.t2 ? eout((t - A.t1) / (A.t2 - A.t1)) : t < A.t3 ? 1 + 0.05 * Math.sin((t - A.t2) * 9) : 1 - ein((t - A.t3) / (A.t4 - A.t3));
          a.dropZ = C.h * hz * (0.9 + 0.1 * k / 3); a.x = lerp(A.sx, A.x, u); a.y = lerp(A.sy, A.y, u); }
        if (cross(A.t2)) FX.push({ kind: 'hang', a, t: 0, life: A.t3 - A.t2 + C.dive + 0.1 });
        if (cross(A.t4)) { a.dropZ = 0; a.x = A.x; a.y = A.y; }
        for (let i = 0; i < A.n; i++) if (cross(A.t4 + i * C.gap)) impactWave(a, A, i, P);
        if (k >= 3 && cross(A.t4 + (A.n - 1) * C.gap + 0.3)) volcano(a, A.x, A.y, P, CFG.impact.volc, CFG.impact.volcR);
      }
      else if (A.kind === 'roar') {
        if (cross(0.5)) { area(a, a.x, a.y, CFG.roar.r, P * CFG.roar.dmg, { kbf: 3 }); FX.push({ kind: 'ringw', x: a.x, y: a.y, R: 4.2, t: 0, life: 0.8, seed: 2 }); FX.push({ kind: 'hemi', x: a.x, y: a.y, R: 2.4, t: 0, life: 0.6, seed: 4 }); FX.push({ kind: 'dust', x: a.x, y: a.y, R: 3.0, t: 0, life: 1.0, seed: 4 }); X.shake(9, 0.35); sfx('crash'); }
      }
      if (ab.act === A && A.end != null && t >= A.end) endAct(a);
    }
    function endAct(a) { const ab = a.sm; if (!ab || !ab.act) return; ab.gk = 1; ab.gal = 0; if (ab.act.kind === 'impact') a.dropZ = 0; if (ab.act.kind === 'roar') ab.ready = true; ab.act = null; ab.gap = 0.12; }
    /* an interrupted power: no more blows; its pictures fade; airborne it drops to the floor where it is (a controlled transition) */
    function interrupt(a) { const ab = a.sm; if (!ab || !ab.act) return; const A = ab.act; ab.gk = 1; ab.gal = 0; if (A.kind === 'impact' && a.dropZ > 0) { const p = X.walkPoint(a.x, a.y, { r: 0.6, mv: 0, x: a.x, y: a.y }); a.x = p.x; a.y = p.y; a.dropZ = 0; }
      for (const f of FX) if ((f.a === a || f.A === A) && f.kind !== 'corona' && f.life - f.t > 0.4) f.life = f.t + 0.4; if (A.kind === 'roar') ab.ready = true; ab.act = null; }
    function chargeImpact(a, A, P, last) {
      const k = A.k, C = CFG.charge, f = frontOf(a, 1.4), R = C.finR[k - 1];
      for (const m of H.living()) if (Math.hypot(m.x - f.x, m.y - f.y) < R + m.r) { hitM(a, m, P * C.fin[k - 1], { big: true }); knock(m, a.x, a.y, C.kb); }
      gain(a, CFG.ruin.impact); impactFx(f.x, f.y, k, false); X.flash(0.14, '#FFB15A'); X.shake(11, 0.3); sfx('crash'); X.light(f.x, f.y, 4, 0.4); g.hitStop = Math.max(g.hitStop || 0, 0.045);
      if (!gpu()) X.boom(f.x, f.y, R, '#FF5A3C', '#FFE37A', { n: 18, shake: 0, smoke: 3 });
      if (last && k >= 3) X.after(0.18, () => volcano(a, f.x, f.y, P, C.volc, C.volcR));
    }
    /* (pure-ish pictures: the effect records an impact lays down; a boss can call them too) */
    function impactFx(x, y, k, big) {
      FX.push({ kind: 'hemi', x, y, R: big ? 3.4 : 2.4, t: 0, life: big ? 0.75 : 0.55, seed: Math.random() * 40 }); FX.push({ kind: 'ringw', x, y, R: big ? 4.2 : 3.0, t: 0, life: 0.6, seed: Math.random() * 40 });
      FX.push({ kind: 'crack', x, y, R: big ? 2.8 : 2.0, t: 0, life: 2.4, seed: Math.random() * 40, heat: 1.3 }); FX.push({ kind: 'dust', x, y, R: big ? 3 : 2.2, t: 0, life: 1.0, seed: 17 }); FX.push({ kind: 'fball', x, y, R: big ? 1.6 : 1.0, t: 0, life: 0.6, seed: Math.random() * 40 });
      sparks(x, y, Math.round((big ? 14 : 9) * LQ()), 2.2); rocks(x, y, Math.round((big ? 5 : 3) * LQ()), 1.2);
    }
    function waveFx(x, y, R) { FX.push({ kind: 'hemi', x, y, R: R * 0.8, t: 0, life: 0.6, seed: Math.random() * 40 }); FX.push({ kind: 'ringw', x, y, R: R * 1.15, t: 0, life: 0.65, seed: Math.random() * 40 }); }
    function volcano(a, x, y, P, dmg, R) {
      area(a, x, y, R, P * dmg, { kbf: 6, big: true }); gain(a, CFG.ruin.impact);
      FX.push({ kind: 'fball', x, y, R: R * 0.62, t: 0, life: 1.1, seed: Math.random() * 40 }); FX.push({ kind: 'pillar', x, y, R: 0.9, H: 7, t: 0, life: 1.3, seed: Math.random() * 40 }); FX.push({ kind: 'embers', x, y, R: R * 1.1, t: 0, life: 2.2, seed: Math.random() * 40 });
      FX.push({ kind: 'ringw', x, y, R: R * 1.3, t: 0, life: 0.8, seed: 25 }); FX.push({ kind: 'hemi', x, y, R: R * 0.9, t: 0, life: 0.8, seed: 27 }); FX.push({ kind: 'crack', x, y, R: R * 0.9, t: 0, life: 3.0, seed: 29, heat: 1.5 }); FX.push({ kind: 'smoke', x, y, R: R * 0.9, t: 0, life: 2.2, seed: 31 });
      spires(x, y, Math.round(5 * LQ()), R * 0.55); rocks(x, y, Math.round(6 * LQ()), 1.6); sparks(x, y, Math.round(16 * LQ()), 3);
      X.flash(0.25, '#FFD09A'); X.shake(16, 0.45); sfx('crash'); X.light(x, y, 6, 0.7); g.hitStop = Math.max(g.hitStop || 0, 0.06);
      if (!gpu()) X.boom(x, y, R, '#FF5A3C', '#FFE37A', { n: 30, shake: 0, smoke: 6 });
    }
    /* a crescent: thrown from the head along dir, flying through the monsters (each struck once); crossing at an angle (tilt) as the head swings */
    function slashOf(o) { return { kind: 'cres', x: o.x, y: o.y, dx: o.dx, dy: o.dy, sp: o.sp || CFG.perd.speed, range: o.range || CFG.perd.range, w: o.w || CFG.perd.w, dmg: o.dmg || 0, tilt: o.tilt || 0, t: 0, life: (o.range || CFG.perd.range) / (o.sp || CFG.perd.speed) + 0.25, d: 0, hit: new Set(), src: o.src || null, seed: Math.random() * 50 }; }
    function slash(a, A, i, P) {
      const ab = a.sm, base = Math.atan2(A.y - a.y, A.x - a.x), sp = (i % 2 ? -1 : 1) * (0.12 + 0.05 * (i % 3)), an = base + sp, f = frontOf(a, 1.1);
      FX.push(slashOf({ x: f.x, y: f.y, dx: Math.cos(an), dy: Math.sin(an), dmg: P * CFG.perd.dmg, tilt: (i % 2 ? -1 : 1) * 0.55, src: a }));
      X.shake(4, 0.1); sfx('whoosh'); ab.stag = Math.max(ab.stag, 0.15); if (!gpu()) X.ring(f.x, f.y, 0.3, 1.6, 0.3, '#FF5A3C', 0.1);
    }
    function crossBlast(a, A, P) { const C = CFG.perd, c = crowd(A.x, A.y, 5, 2.6) || { x: A.x, y: A.y }; area(a, c.x, c.y, C.crossR, P * C.cross, { kbf: 5, big: true });
      FX.push({ kind: 'xcross', x: c.x, y: c.y, R: C.crossR * 1.2, t: 0, life: 0.9, seed: Math.random() * 40 }); FX.push({ kind: 'hemi', x: c.x, y: c.y, R: C.crossR * 0.9, t: 0, life: 0.6, seed: 5 }); FX.push({ kind: 'fball', x: c.x, y: c.y, R: 1.2, t: 0, life: 0.6, seed: 7 });
      sparks(c.x, c.y, Math.round(12 * LQ()), 2.5); X.flash(0.16, '#FFC08A'); X.shake(12, 0.35); sfx('crash'); g.hitStop = Math.max(g.hitStop || 0, 0.05); }
    function impactWave(a, A, i, P) { const C = CFG.impact, k = A.k, R = C.R[k - 1] * (1 + 0.22 * i), x = A.x, y = A.y;
      if (i === 0) { for (const m of H.living()) { const d = Math.hypot(m.x - x, m.y - y); if (d < R + m.r) { hitM(a, m, P * C.dmg[k - 1] * (d < 1.4 ? 1.3 : 1), { big: true, stun: 0.5 }); knock(m, x, y, 7); m.hitSq = 1; } }
        impactFx(x, y, k, true); spires(x, y, Math.round(C.spires[k - 1] * LQ()), R * 0.75); FX.push({ kind: 'embers', x, y, R: R, t: 0, life: 1.6, seed: Math.random() * 40 }); FX.push({ kind: 'smoke', x, y, R: R * 0.8, t: 0, life: 1.8, seed: 3 });
        X.flash(0.2, '#FFC08A'); X.shake(15, 0.4); sfx('crash'); X.light(x, y, 6, 0.6); g.hitStop = Math.max(g.hitStop || 0, 0.06); gain(a, CFG.ruin.impact); if (!gpu()) X.boom(x, y, R, '#FF5A3C', '#FFE37A', { n: 26, shake: 0, smoke: 5 }); }
      else { area(a, x, y, R, P * C.wave, { kbf: 3 }); waveFx(x, y, R); FX.push({ kind: 'crack', x, y, R: R * 0.9, t: 0, life: 2.0, seed: i * 13, heat: 1.0 }); X.shake(9, 0.25); sfx('thud'); } }
    function sparks(x, y, n, sp) { n = Math.round(n * LQ()); for (let i = 0; i < n; i++) { const an = Math.random() * TAU, v = (1.5 + Math.random() * 3) * sp; FX.push({ kind: 'spark', x, y, z: 0.2, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 2 + Math.random() * 4, t: 0, life: 0.5 + Math.random() * 0.4, seed: Math.random() * 90 }); } }
    function rocks(x, y, n, sp) { for (let i = 0; i < n; i++) { const an = Math.random() * TAU, v = (1 + Math.random() * 2) * sp; FX.push({ kind: 'rock', x, y, z: 0.2, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 4 + Math.random() * 4, t: 0, life: 1.3, s: 0.12 + Math.random() * 0.12, seed: Math.random() * 90 | 0, rot: Math.random() * 6 }); } }
    function spires(x, y, n, R) { for (let i = 0; i < n; i++) { const an = i / n * TAU + Math.random() * 0.4, rr = R * (0.55 + Math.random() * 0.45); FX.push({ kind: 'spire', x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr * 0.8, t: -i * 0.03, life: 1.8, s: 0.32 + Math.random() * 0.18, yaw: Math.random() * 6, lean: (Math.random() - 0.5) * 0.5, seed: Math.random() * 40 }); } }
    /* ---- the pose every frame: the power's (or the ultimate's), the entrance's assembly, the Cataclysm, the Overdrive, the last seconds' instability, eased ---- */
    function poseOf(a, dt) {
      const ab = stOf(a), G = GLS(), inU = UL && UL.a === a, kv = a.st === 'awaken' || inU ? 3 : kOf(a), base = G ? G.idlePose(kv, a.at || 0) : { k: kv, core: 0.9 }, A = ab.act;
      let tg;
      if (inU) tg = ultPose(UL.t, { cata: UL.cata });
      else tg = poseFor(A ? A.kind : null, A ? (A.kind === 'charge' ? A.rt : A.t) : 0, { base, wind: A && A.wind, charge: A && A.chargeT, first: A && A.kind === 'charge' && A.i === 0, last: A && A.kind === 'charge' && A.i >= A.n - 1, n: A && A.n, gap: A && A.gap, k: A && A.k, stag: 0 });
      if (!inU && ab.over > 0) { tg.coreOpen = Math.max(tg.coreOpen || 0, 0.45); tg.core += 0.6; tg.dorsal = Math.max(tg.dorsal || 0, 0.5); tg.hornSpin += 2; tg.glow += 0.15; }
      if (!inU && ab.cata > 0) { const fl = 0.85 + 0.15 * Math.sin((a.at || 0) * 23); tg.heat = Math.max(tg.heat || 0, fl); tg.vent = Math.max(tg.vent || 0, 1); tg.horn = Math.max(tg.horn, 0.35); tg.core += 1.2; tg.glow += 0.35; tg.dorsal = Math.max(tg.dorsal || 0, 0.7); }
      if (a.st === 'enter' || (!ab.ready && !A)) { const e = Math.max(0, ab.en); tg.asm = sstep(0.35, 1.95, e); tg.core = lerp(0.2, 2.6, sstep(0.25, 0.9, e)) * (1 - 0.4 * sstep(2.0, 2.6, e)); tg.horn = 0.5 * sstep(1.6, 2.0, e) * (1 - sstep(2.0, 2.5, e)); tg.glow = 0.8 * (1 - sstep(1.6, 2.5, e)); tg.hornSpin = 1 + 4 * (1 - sstep(1.4, 2.4, e)); tg.crouch = 0.6 * bump(e, 1.9, 2.0, 2.1, 2.5); }
      if (a.st === 'awaken' && !inU) { const u = sstep(0, 0.7, a.aw || 0); tg.core += u * 1.5; tg.heat = Math.max(tg.heat || 0, u * 0.6); tg.hornSpin += u * 3; tg.glow += u * 0.4; tg.crouch = Math.max(tg.crouch || 0, 0.2 * u); }
      if (a.st === 'fight' && a.life < 4 && !inU) { const q = 1 - Math.max(0, a.life) / 4, fl = Math.sin((a.at || 0) * (17 + 20 * q)) * 0.5 + 0.5; tg.core += q * (0.6 + 0.9 * fl); tg.heat = Math.max(tg.heat || 0, q * 0.5 * fl); tg.mech = Math.max(tg.mech || 0, q * 0.6); tg.glow += q * 0.25 * fl; }   // (its last seconds: the reactor going unstable)
      if (ab.stag > 0) { ab.stag = Math.max(0, ab.stag - dt * 2.5); tg.stagger = (tg.stagger || 0) + Math.sin(ab.stag * Math.PI) * 0.4; }
      const pz = easePose(ab, tg, dt);
      if (!inU && ab.yawT != null) { const rate = (A && (A.kind === 'charge' || A.kind === 'perd') ? 4.5 : CFG.walk.turn) * dt, dd = angD(ab.yawT, ab.yaw); ab.yaw += Math.max(-rate, Math.min(rate, dd * Math.min(1, dt * 5) * 6)); }
      if (inU && UL.yaw != null) ab.yaw = UL.yaw;
      const c0 = Math.cos(ab.yaw); a.face = c0 >= 0 ? 1 : -1; a.fk = 1;
      const vx = ab.vx || 0, vy = ab.vy || 0; ab.ax = lerp(ab.ax, (vx - ab.lvx) / Math.max(dt, 1e-3), 0.3); ab.ay = lerp(ab.ay, (vy - ab.lvy) / Math.max(dt, 1e-3), 0.3); ab.lvx = vx; ab.lvy = vy;
      if (G) G.springs(a, ab.ax, ab.ay, dt);
      if (!A && !inU) { ab.mv += ((Math.hypot(vx, vy) / 2.0) - ab.mv) * Math.min(1, dt * 4); ab.gal += ((ab.mv > 0.8 ? 0.6 : 0) - ab.gal) * Math.min(1, dt * 3); } ab.mv = cl(ab.mv);
      a.smP = Object.assign(base, pz, { k: kv, t: a.at || 0, yaw: ab.yaw + (inU ? tg.yawOff || 0 : 0), ph: ab.ph, mv: inU ? 0 : ab.mv, gal: inU ? 0 : ab.gal, feet: pz.feet, asm: tg.asm == null ? 1 : tg.asm, dis: tg.dis || 0, live: pz.live, gaitK: ab.gk || 1 });
    }
    /* ---- the fighter's loop (20g's tick, in its 'fight'). Its time counts only once it is combat-ready (the entrance's roar done) ---- */
    function tick(a, dt) {
      const ab = stOf(a); a.feet = true; ab.thudT -= dt;
      if (!ab.ready) a.life += dt;   // (the entrance is not counted)
      if (!ab.ready && ab.en >= 0 && ab.en < 2.15 && !ab.act) return;   // (still assembling: it acts once its hooves have struck)
      if (me.dead) { interrupt(a); return; }
      if (ab.act) { act(a, dt); return; }
      if (!ab.first) { ab.first = true; return start(a, 'roar'); }
      if (!ab.ready) { ab.ready = true; }
      ab.gap -= dt;
      const ch = !H.noAuto && ab.gap <= 0 && a.life > 0.9 ? choose(a) : null;
      if (ch) return start(a, ch.kind, ch.o);
      guard(a, dt);
    }
    /* ---- Wrath of the Fallen ---- */
    function fin(a) {
      const ab = stOf(a); if (a.smUlt || (UL && UL.a === a)) return; a.smUlt = true;   // (exactly once)
      interrupt(a); a.dropZ = 0;
      const c = crowd(a.x, a.y, 10, 3.2), tx = c ? c.x : lerp(a.x, me.x, 0.35) + Math.cos(ab.yaw) * 2, ty = c ? c.y : lerp(a.y, me.y, 0.35) + Math.sin(ab.yaw) * 1.2, p = X.walkPoint(tx, ty, { r: 0.6, mv: 0, x: a.x, y: a.y });
      const dir = p.x >= a.x ? 1 : -1, cata = ab.cata > 0 ? cl(ab.cata / CFG.ruin.cata) * 0.7 + 0.3 : 0;
      UL = { a, t: 0, x0: a.x, y0: a.y, tx: p.x, ty: p.y, dir, k: kOf(a), seed: Math.random() * 1000, cata, hit: false, w2: false, w3: false, fb: false, yaw: dir > 0 ? 0.35 : Math.PI - 0.35, hx: p.x - dir * 3.2, hy: p.y - 0.6 };
      ab.cata = 0; ab.over = 0; for (const f of FX) if (f.kind === 'corona' && f.a === a) f.life = f.t + 0.4;
      a.judg = true; a.jA = 1; a.hold = true; ab.vx = ab.vy = 0; ab.mv = 0; ab.yawT = null; ab.yaw = UL.yaw;
      g.cineT = Math.max(g.cineT || 0, UT.hit + 0.8); me.inv = Math.max(me.inv, UT.hit + 1.2);
      FX.push({ kind: 'sigil', x: a.x, y: a.y, R: 3.8 + cata, t: 0, life: UT.launch + 0.6, cine: 1, ult: 1 });
      sfx('hum'); X.after(0.6, () => sfx('hum'));
    }
    function stepUL(dt) {
      const J = UL, a = J.a, t0 = J.t; J.t += dt; const t = J.t, cross = x => t0 < x && t >= x, C = CFG.ult, P = pw(a) * (1 + 0.3 * J.cata);
      if (t < UT.hit + 0.8) { g.cineT = Math.max(0.02, UT.hit + 0.8 - t); me.inv = Math.max(me.inv, 0.4); } else if (t0 < UT.hit + 0.8) g.cineT = 0;
      // the camera: drawn in as the world darkens (the creature turning: its orbit), out as it rises (following it up), wide for the fall, a punch at the impact, home at the end
      const zp = t < UT.p1 ? lerp(1, 0.9, sstep(0, UT.p1, t)) : t < UT.launch ? lerp(0.9, 0.86, sstep(UT.p1, UT.launch, t)) : t < UT.dive ? lerp(0.86, 0.7, sstep(UT.launch, UT.p3, t)) : t < UT.hit ? lerp(0.7, 0.76, sstep(UT.dive, UT.hit, t)) : t < UT.p5 ? lerp(0.68, 0.78, eout(cl((t - UT.hit) / 0.5))) : lerp(0.82, 1, sstep(UT.p5, UT.len, t));
      g.zoomP = zp; g.zoomT = t < UT.len - 0.05 ? 0.25 : 0;
      if (t < UT.p1 && Math.random() < dt * 10) X.shake(1 + t * 1.2, 0.08);
      // the Awakening: rock fragments rising round it
      if (t < UT.p2 && Math.random() < dt * (4 + 6 * t / UT.p2) * LQ()) { const an = Math.random() * TAU, rr = 1.5 + Math.random() * 3; FX.push({ kind: 'float', x: a.x + Math.cos(an) * rr, y: a.y + Math.sin(an) * rr * 0.7, z: 0, vz: 0.6 + Math.random() * 1.2, t: 0, life: 2.2, s: 0.08 + Math.random() * 0.1, seed: Math.random() * 90 | 0, rot: Math.random() * 6, cine: 1 }); }
      if (cross(UT.p1 + 0.15)) { FX.push({ kind: 'ringw', x: a.x, y: a.y, R: 7, t: 0, life: 1.0, seed: 3, cine: 1 }); FX.push({ kind: 'hemi', x: a.x, y: a.y, R: 3.6, t: 0, life: 0.8, seed: 5, cine: 1 }); X.flash(0.2, '#FF9A6A'); X.shake(12, 0.5); sfx('crash'); }   // the Breaking of the Seal: the roar's shockwave
      if (cross(UT.p2)) { FX.push({ kind: 'crack', x: a.x, y: a.y, R: 3.0, t: 0, life: 5, seed: 7, heat: 1.4, cine: 1 }); sfx('hum'); }
      if (cross(UT.launch)) { FX.push({ kind: 'burst', a, t: 0, life: 0.6, cine: 1 }); FX.push({ kind: 'ringw', x: a.x, y: a.y, R: 5, t: 0, life: 0.8, seed: 9, cine: 1 }); FX.push({ kind: 'dust', x: a.x, y: a.y, R: 3.4, t: 0, life: 1.2, seed: 11, cine: 1 }); FX.push({ kind: 'ascent', x: a.x, y: a.y, t: 0, life: 2.4, cine: 1 }); spires(a.x, a.y, Math.round(4 * LQ()), 2.2); X.shake(14, 0.5); X.flash(0.18, '#FFB15A'); sfx('whoosh'); }
      // its flight: up off the top of the field; then revealed high above, sigils behind it; then the fall onto the target
      if (t >= UT.launch && t < UT.p3) { const u = (t - UT.launch) / (UT.p3 - UT.launch); a.dropZ = 16 * ein(u) + 1.5 * u; a.jA = 1 - sstep(0.75, 1, u); }
      else if (t >= UT.p3 && t < UT.hit) { const u = sstep(UT.dive, UT.hit, t), uu = ein(cl((t - UT.dive) / (UT.hit - UT.dive))); a.x = lerp(J.hx, J.tx, uu); a.y = lerp(J.hy, J.ty, uu); a.dropZ = lerp(5.2, 0, uu) + (1 - u) * 0.25 * Math.sin(t * 3); a.jA = sstep(UT.p3, UT.p3 + 0.35, t); J.yaw = J.dir > 0 ? 0.25 : Math.PI - 0.25; }
      if (cross(UT.p3)) { FX.push({ kind: 'skysig', a, t: 0, life: UT.hit - UT.p3 + 0.2, cine: 1 }); FX.push({ kind: 'mtrail', a, t: 0, life: UT.hit - UT.p3 + 0.15, cine: 1 }); }
      if (cross(UT.dive)) { FX.push({ kind: 'shock', a, t: 0, life: UT.hit - UT.dive + 0.1, cine: 1 }); sfx('whoosh'); }
      if (t > UT.dive && t < UT.hit && Math.random() < dt * 6) X.shake(2 + 6 * sstep(UT.dive, UT.hit, t), 0.06);
      // Wrath of the Fallen: the impact (the nearest take the most), two rings of shock, the final burst; Burning and Ruin on all it touches
      if (cross(UT.hit)) { J.hit = true; a.x = J.tx; a.y = J.ty; a.dropZ = 0; a.jA = 1; let n = 0;
        for (const m of H.living()) { const d = Math.hypot(m.x - J.tx, m.y - J.ty); if (d > C.r + m.r) continue; const core = d < C.core + m.r, k = C.k1 * (1 - 0.45 * cl(d / C.r)) + (core ? C.kc : 0); hitM(a, m, P * k, { noCrit: true, burn: true, big: true }); knock(m, J.tx, J.ty, core ? 7 : 4.5); m.smRuinT = g.t + (m.boss ? C.weakBoss : C.weak); n++; }
        J.n1 = n; wrathFx(J.tx, J.ty, J.k, J.cata); X.flash(0.45, '#FFF0D8'); X.shake(28, 0.9); sfx('crash'); X.light(J.tx, J.ty, 12, 1.2); g.hitStop = Math.max(g.hitStop || 0, 0.09); }
      const wave = (R0, R1, k) => { for (const m of H.living()) { const d = Math.hypot(m.x - J.tx, m.y - J.ty); if (d < R0 || d > R1 + m.r) continue; hitM(a, m, P * k, { noCrit: true, burn: true }); knock(m, J.tx, J.ty, 3); m.smRuinT = Math.max(m.smRuinT || 0, g.t + (m.boss ? C.weakBoss : C.weak)); } };
      if (cross(UT.w2)) { J.w2 = true; wave(0, C.r * 0.65, C.k2); X.shake(16, 0.5); sfx('thud'); }
      if (cross(UT.w3)) { J.w3 = true; wave(C.r * 0.3, C.r * (1 + 0.15 * J.cata), C.k2 * 0.8); X.shake(14, 0.45); sfx('crash'); }
      if (cross(UT.fb)) { J.fb = true; wave(0, C.r * 1.15, C.k3); X.flash(0.25, '#FFB88A'); X.shake(18, 0.5); sfx('crash'); X.after(0.25, () => sfx('fanfare')); X.after(0.5, () => X.text(me.x, me.y + 0.9, 'WRATH OF THE FALLEN', COL.hot, 15, { crit: true, life: 1.2 })); }
      if (cross(UT.roar)) { FX.push({ kind: 'ringw', x: a.x, y: a.y, R: 3.2, t: 0, life: 0.8, seed: 41, cine: 1 }); sfx('hum'); X.shake(6, 0.3); }
      if (t >= UT.len) endUL(true);
    }
    function wrathFx(x, y, k, cata) { const big = 1 + 0.2 * (k - 1) + 0.35 * cata;
      FX.push({ kind: 'wrath', x, y, t: 0, life: UT.len - UT.hit + 2.6, big, k, seed: Math.random() * 50, cine: 1 });
      spires(x, y, Math.round(10 * LQ()), 4.2 * big); rocks(x, y, Math.round(10 * LQ()), 2.2); sparks(x, y, Math.round(24 * LQ()), 3.5);
      if (!gpu()) { X.boom(x, y, 6, '#FF5A3C', '#FFE37A', { n: 40, shake: 0, smoke: 10 }); for (let i = 0; i < 3; i++) X.after(0.35 * (i + 1), () => X.ring(x, y, 0.5, 5 + i * 2.5, 0.6, '#FF5A3C', 0.35)); } }
    function endUL(done) { if (!UL) return; const a = UL.a; if (g.cineT > 0 && UL.t < UT.hit + 0.8) g.cineT = 0; g.zoomP = 1; g.zoomT = 0; a.judg = false; a.hold = false; a.dropZ = 0; a.jA = 1;
      if (!UL.hit && UL.t >= UT.launch) { a.x = UL.tx; a.y = UL.ty; }
      if (done) { a.st = 'leave'; a.lv = 0.8; a.alpha = 0; a.waved = true; for (let i = 0; i < Math.round(14 * LQ()); i++) X.part({ kind: 'ember', x: a.x + (Math.random() - 0.5) * 2.5, y: a.y - Math.random() * 3, vx: (Math.random() - 0.5), vy: -1.8, life: 1.0, max: 1.0, size: 4, color: i % 2 ? COL.crim : COL.hot }); }
      UL = null; }
    /* ---- the loop (every frame, from 20g's update) ---- */
    function update(dt, dtReal) {
      const L = list();
      for (const a of L) { const ab = stOf(a); a.feet = true;
        if (a.st === 'enter' && a.en >= 0) { if (ab.en < 0) ab.en = 0; ab.en += dtReal; a.dropZ = 0; a.scale = 1; a.alpha = 1;
          if (ab.en > 2.0 && !ab.struck4) { ab.struck4 = true; entranceStrike(a); } }
        else if (ab.en >= 0 && !ab.ready) { ab.en += dtReal; if (ab.en > 2.0 && !ab.struck4) { ab.struck4 = true; entranceStrike(a); } }
        if (a.st === 'awaken') a.hold = true;
        if (a.st !== 'fight' && ab.act) interrupt(a);
        if (a.st === 'fight') ensureWard();
        // the Cataclysm State and Furnace Overdrive run on game time; neither touches the summon's
        if (ab.cata > 0) { ab.cata -= dt; ab.cataT += dt; if (ab.cata <= 0) { ab.cata = 0; ab.ruin = CFG.ruin.after; } }
        if (ab.over > 0) { ab.over -= dt; ab.overTick -= dt; if (ab.overTick <= 0 && a.st === 'fight') { ab.overTick = CFG.over.tick; area(a, a.x, a.y, CFG.over.r, pw(a) * CFG.over.dmg, { dot: true, burn: true, dotC: COL.hot }); }
          if (ab.over <= 0) { ab.over = 0; for (const f of FX) if (f.kind === 'corona' && f.a === a) f.life = f.t + 0.5; } }
        poseOf(a, dtReal); idleSteps(a); released = false; }
      if (UL) { if (!L.includes(UL.a)) endUL(false); else stepUL(dtReal); }
      for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.t += f.cine ? dtReal : dt;
        if (f.kind === 'spark' || f.kind === 'rock') { const tt = Math.max(0, dt); f.x += f.vx * tt; f.y += f.vy * tt; f.vz -= 16 * tt; f.z += f.vz * tt; if (f.z < 0) { f.z = 0; f.vz *= -0.25; f.vx *= 0.5; f.vy *= 0.5; } }
        else if (f.kind === 'float') { f.z += f.vz * dtReal; f.vz *= 1 - Math.min(1, dtReal * 0.3); if (UL && UL.t > UT.launch) f.vz += dtReal * 6; }
        else if (f.kind === 'cres' && f.t > 0) { const ds = f.sp * dt; f.x += f.dx * ds; f.y += f.dy * ds; f.d += ds; const src = f.src;
          if (f.dmg > 0) for (const m of H.living()) { if (f.hit.has(m) || Math.hypot(m.x - f.x, m.y - f.y) > f.w + m.r) continue; f.hit.add(m); if (src) hitM(src, m, f.dmg, { big: false }); else H.hit(m, f.dmg, { el: 'fire' }); if (!m.boss && !m.still) { m.kbx = (m.kbx || 0) + f.dx * 2.5; m.kby = (m.kby || 0) + f.dy * 2.5; } sparks(m.x, m.y, 4, 1.5); FX.push({ kind: 'ringw', x: m.x, y: m.y, R: 0.9, t: 0, life: 0.3, seed: f.seed }); g.hitStop = Math.max(g.hitStop || 0, 0.015); }
          if (f.d >= f.range && f.life - f.t > 0.25) f.life = f.t + 0.25; }
        if (f.t >= f.life) FX.splice(i, 1); }
      if (!L.length && !UL) { if (wardOff) { wardOff(); wardOff = null; } if (!released && !FX.length) { released = true; const G = GLS(); if (G) G.release(); } }
      if (me.dead) for (const a of L) interrupt(a);
    }
    function stop() { for (const a of S.list) if (a.id === 'aries') { interrupt(a); a.hold = false; a.judg = false; a.dropZ = 0; } if (UL) endUL(false); if (wardOff) { wardOff(); wardOff = null; }
      FX.length = 0; if (g.zoomP !== 1) { g.zoomP = 1; g.zoomT = 0; } const G = GLS(); if (G) G.release(); released = true; }
    const outK = m => (m && m.smRuinT > g.t ? (m.boss ? CFG.ult.weakKBoss : CFG.ult.weakK) : 1);
    /* ---- the entrance: the Aries sigil, an infernal portal opening over it, rings and a star coming out of it, the body assembling round the
       reactor (legs, torso, head, the horns last), the four hooves striking down, a ring of fire, the roar (its first act) ---- */
    function descent(a) { const ab = stOf(a); ab.en = 0; ab.ready = false; ab.struck4 = false; a.feet = true; a.dropZ = 0; a.scale = 1; a.life = CFG.life;
      FX.push({ kind: 'sigil', x: a.x, y: a.y, R: 3.4, t: 0, life: 3.2, cine: 1 }); FX.push({ kind: 'portal', a, x: a.x, y: a.y, t: 0, life: 2.3, cine: 1 });
      for (let i = 0; i < 5; i++) X.after(i * 0.2, () => X.shake(2 + i, 0.15)); X.light(a.x, a.y, 4, 1); sfx('hum'); }
    function entranceStrike(a) { FX.push({ kind: 'ringw', x: a.x, y: a.y, R: 4.6, t: 0, life: 0.9, seed: 1 }); FX.push({ kind: 'hemi', x: a.x, y: a.y, R: 2.6, t: 0, life: 0.6, seed: 2 }); FX.push({ kind: 'crack', x: a.x, y: a.y, R: 2.4, t: 0, life: 2.4, seed: 3, heat: 1.2 });
      FX.push({ kind: 'dust', x: a.x, y: a.y, R: 3.2, t: 0, life: 1.1, seed: 2 }); for (let i = 0; i < 4; i++) { const p = footW(a, i); FX.push({ kind: 'foot', x: p.x, y: p.y, R: 1.0, t: 0, life: 0.9, seed: i * 7, f: 1, big: 1 }); }
      sparks(a.x, a.y, 12, 2.5); X.shake(14, 0.5); X.light(a.x, a.y, 5, 0.6); sfx('crash'); g.zoomP = 0.95; g.zoomT = 0.9; }
    function entrance(a) { stOf(a); }   // (the landing the Anima cycle reports comes before the assembly is done: the strike is laid by update when it is)

    /* ================= drawing ================= */
    const sx = x => X.sx(x), sy = y => X.sy(y);
    function pts(a) { const o = a.smOut && a.smOut.r; if (o) return o; const Tz = T(), x = sx(a.x), y = sy(a.y) - (a.dropZ || 0) * Tz, s = Tz * 3.4; return { core: [x + s * 0.25, y - s * 0.45], coreR: s * 0.05, eyes: [[x + s * 0.36, y - s * 0.6]], head: [x + s * 0.36, y - s * 0.6], mouth: [x + s * 0.42, y - s * 0.55], back: [x, y - s * 0.7], top: [x, y - s], hornRings: [], hornTips: [], hornSegs: [], feet: [], vents: [], jets: [], fparts: [], dorsal: [], unit: s / 14, bb: [x - s * 0.6, y - s, x + s * 0.6, y], ground: [x, y], coreVis: 1 }; }
    const hotOf = u => (u < 0.5 ? COL.crim : u < 0.8 ? COL.ember : COL.hot);
    /* one FX record on the ground layer (Q the painter batch open, parts GPU meshes to add) */
    function groundOne(Q, f, Tz, parts) {
      const X0 = f.x != null ? sx(f.x) : 0, Y0 = f.y != null ? sy(f.y) : 0, u = f.t / f.life, R = (f.R || 1) * Tz;
      if (f.kind === 'crack') { const fr = cl(f.t / 0.22) * 1.03, cool = 1 - sstep(0.15, 1, u); Q.quad(89, X0, Y0, R, 0, 0, R * FSY, '#000000', 0.8 * (1 - sstep(0.7, 1, u)), fr, f.seed, 0.22); Q.quad(309, X0, Y0, R, 0, 0, R * FSY, COL.crim, 1 - sstep(0.85, 1, u), fr, f.seed % 7, (f.heat || 1) * cool); }
      else if (f.kind === 'dust') { const r = R * (0.35 + 0.65 * eout(u)); Q.quad(90, X0, Y0, r * 1.3, 0, 0, r * 1.3 * FSY, COL.dust, (1 - u) * 0.8, 0.3, f.seed, u); }
      else if (f.kind === 'foot') { const fade = 1 - sstep(0.45, 1, u), rr = R * (0.45 + 0.6 * eout(u)), sm = f.small ? 0.6 : 1; Q.quad(90, X0, Y0, rr * 1.3, 0, 0, rr * 1.3 * FSY, COL.dust, (1 - u) * (f.big ? 0.9 : 0.6) * sm, 0.32, f.seed, u);
        if (u < 0.45) { const k2 = 1 - u / 0.45; Q.quad(311, X0, Y0, R * 0.7, 0, 0, R * 0.7 * FSY, COL.crim, 0.55 * k2 * sm * (f.big ? 1.3 : 1), 0.45 + 0.4 * u, f.seed, 0.8 * k2); Q.glow(X0, Y0, R * 0.55, COL.ember, 0.2 * k2 * sm, FSY); } void fade; }
      else if (f.kind === 'ringw') { Q.quad(311, X0, Y0, R, 0, 0, R * FSY, COL.crim, 1, eout(u) * 0.95, f.seed, 1.1 * (1 - u * 0.7)); }
      else if (f.kind === 'sigil') { const dr = sstep(0, 1.0, f.t) + (f.ult ? sstep(UT.p1 - 0.5, UT.p1 + 0.3, f.t) * 0.5 : sstep(1.6, 2.2, f.t) * 0.4), fade = 1 - sstep(f.life - 0.7, f.life, f.t); Q.quad(298, X0, Y0, R, 0, 0, R * FSY, COL.crim, fade, dr, f.t * 0.25, 1.1); Q.glow(X0, Y0, R * 1.2, COL.crim, 0.22 * fade, FSY); }
      else if (f.kind === 'smoke') { for (let j = 0; j < 4; j++) { const an = j * 1.57 + f.seed, rr = R * (0.3 + 0.6 * eout(u)), px = X0 + Math.cos(an) * rr, py = Y0 + Math.sin(an) * rr * FSY - u * Tz * 1.2; Q.smoke(px, py, R * (0.35 + 0.35 * u), 0.55 * (1 - u) * sstep(0, 0.15, u), f.seed + j, COL.smoke, 0.35 * (1 - u)); } }
      else if (f.kind === 'spire') { const h = sstep(0, 0.18, f.t) * (1 - sstep(f.life - 0.5, f.life, f.t)); if (h > 0.02) parts.push({ m: 'spire', X: X0, Y: Y0, s: f.s * Tz, h, yaw: f.yaw, lean: f.lean, gl: 1.2 * (1 - u) + 0.3, g2: 0, z: Y0 }); if (f.t < 0.3) Q.glow(X0, Y0, Tz * 0.8, COL.ember, 0.5 * (1 - f.t / 0.3), FSY); }
      else if (f.kind === 'corona') { const a = f.a, r = a.smOut && a.smOut.r, gx = r ? r.ground[0] : sx(a.x), gy = r ? r.ground[1] : sy(a.y), fade = sstep(0, 0.5, f.t) * (1 - sstep(f.life - 0.5, f.life, f.t)), RR = Tz * CFG.over.r;
        Q.quad(305, gx, gy, RR * 1.15, 0, 0, RR * 1.15 * FSY, COL.crim, 0.9 * fade, 0.82, f.seed || 3, 1); Q.glow(gx, gy, RR, COL.ember, 0.12 * fade, FSY); }
      else if (f.kind === 'wrath') wrathGround(Q, f, Tz, parts);
    }
    function drawGround(c) {
      const L = list(); if (!FX.length && !UL && !L.length) return;
      const on = gpu(), Tz = T();
      if (!on) return;   // (no painter: the powers show themselves with the game's own particles)
      const Q = fgOpen(c), parts = [];
      for (const a of L) { const r = a.smOut && a.smOut.r, al = (a.alpha == null ? 1 : a.alpha) * (a.judg ? a.jA : 1); if (!r || !(al > 0.02)) continue; const lz = Math.max(0, 1 - (a.dropZ || 0) / 8), gx = sx(a.x), gy = sy(a.y);
        Q.sshadow(gx, gy, Tz * 1.3 * (0.5 + 0.5 * lz), Tz * 1.3 * 0.42 * (0.5 + 0.5 * lz), 0.42 * al * lz, '#120605'); if (!(a.dropZ > 0.2)) for (const p of r.feet) Q.sshadow(p[0], p[1], Tz * 0.32, Tz * 0.16, 0.5 * al, '#0C0404');
        if (r.coreVis > 0.05 && !(a.dropZ > 0.5)) Q.glow(r.core[0], gy, Tz * 1.2, COL.crim, 0.18 * al * cl((a.smP && a.smP.core || 0.9) - 0.5), FSY);
        if (a.sm && a.sm.over > 0 && !(a.dropZ > 0.5)) { const ov = a.sm.over, R = Tz * CFG.over.r, fi = cl(ov * 2) * al, pu = 0.5 + 0.5 * Math.sin(ov * 9);   // (concept2: Furnace Overdrive's ring of fire round it, burning as long as it lasts)
          Q.quad(311, gx, gy, R, 0, 0, R * FSY, COL.crim, 1, 0.93 + 0.03 * pu, 17, 0.75 * fi); Q.quad(311, gx, gy, R * 0.97, 0, 0, R * 0.97 * FSY, COL.hot, 1, 0.9, 29 + Math.floor(ov * 6), 0.45 * fi * (0.7 + 0.3 * pu)); Q.glow(gx, gy, R * 1.05, COL.crim, 0.14 * fi, FSY); } }   // (the reactor's light spilt on the floor)
      for (const f of FX) groundOne(Q, f, Tz, parts);
      fgClose(c);
      if (parts.length && glOn()) { parts.sort((p, q) => p.z - q.z); c.save(); GLS().drawParts(c, parts); c.restore(); }
    }
    /* the ultimate's ground: the impact's floor layers (pure: from the record's age) */
    function wrathGround(Q, f, Tz, parts) {
      const X0 = sx(f.x), Y0 = sy(f.y), t = f.t, B = f.big || 1, Rr = CFG.ult.r * Tz * B;
      const cool = 1 - sstep(1.2, f.life, t);
      Q.quad(89, X0, Y0, Rr * 0.75, 0, 0, Rr * 0.75 * FSY, '#000000', 0.85 * (1 - sstep(f.life - 0.8, f.life, t)), cl(t / 0.3) * 1.03, f.seed, 0.6);
      Q.quad(309, X0, Y0, Rr * 0.8, 0, 0, Rr * 0.8 * FSY, COL.crim, 1 - sstep(f.life - 0.6, f.life, t), eout(cl(t / 0.5)) * 1.02, (f.seed | 0) % 9, 1.6 * cool + 0.15);   // (12: the ground cooling)
      Q.ground(X0, Y0, Rr * 0.32, 1.1 * cool, 0.9 * (1 - sstep(f.life - 0.6, f.life, t)), f.seed, FSY, 1);
      for (let i = 0; i < 3; i++) { const t0 = [0, UT.w2 - UT.hit, UT.w3 - UT.hit][i], u = (t - t0) / 0.9; if (u > 0 && u < 1) { Q.quad(311, X0, Y0, Rr * (0.7 + 0.25 * i), 0, 0, Rr * (0.7 + 0.25 * i) * FSY, COL.crim, 1, eout(u) * 0.95, f.seed + i, 1.3 * (1 - u * 0.6)); Q.quad(90, X0, Y0, Rr * (0.6 + 0.2 * i) * eout(u) * 1.3, 0, 0, Rr * (0.6 + 0.2 * i) * eout(u) * 1.3 * FSY, COL.dust, 0.7 * (1 - u), 0.3, f.seed + i, u); } }
      { const u = (t - (UT.fb - UT.hit)) / 1.0; if (u > 0 && u < 1) Q.quad(311, X0, Y0, Rr * 1.15, 0, 0, Rr * 1.15 * FSY, COL.hot, 1, eout(u) * 0.97, f.seed + 9, 1.4 * (1 - u * 0.5)); }   // (11: the final burst)
      void parts;
    }
    /* the air layer: the effects above the ground (and the ultimate's sky) */
    function airOne(Q, f, Tz, parts) {
      const u = f.t / f.life;
      if (f.kind === 'spark') { const X1 = sx(f.x), Y1 = sy(f.y) - f.z * Tz, k = 1 - u; Q.glow(X1, Y1, Tz * 0.16 * (0.5 + k), hotOf(k), 0.6 * k); Q.star(X1, Y1, Tz * 0.12 * k, 0.8 * k, COL.white); }
      else if (f.kind === 'rock') { const X1 = sx(f.x), Y1 = sy(f.y) - f.z * Tz, fade = 1 - sstep(0.75, 1, u); parts.push({ m: 'rock', X: X1, Y: Y1, z: sy(f.y), s: f.s * Tz, yaw: f.rot + f.t * 6, tilt: f.t * 4 + f.seed, a: fade, gl: 1.4 * (1 - u) + 0.3, kind: 1 }); Q.glow(X1, Y1, f.s * Tz * 2.5, COL.ember, 0.35 * (1 - u)); }
      else if (f.kind === 'float') { const X1 = sx(f.x), Y1 = sy(f.y) - f.z * Tz, fade = sstep(0, 0.3, f.t) * (1 - sstep(0.8, 1, u)); parts.push({ m: 'rock', X: X1, Y: Y1, z: sy(f.y), s: f.s * Tz, yaw: f.rot + f.t * 1.2, tilt: f.t * 0.8 + f.seed, a: fade, gl: 0.6, kind: 1 }); Q.glow(X1, Y1, f.s * Tz * 2.2, COL.crim, 0.25 * fade); }
      else if (f.kind === 'hemi') { const X0 = sx(f.x), Y0 = sy(f.y), R = f.R * Tz; Q.quad(297, X0, Y0, R * 1.05, 0, 0, R * 1.05, COL.ember, 1, eout(u) * 0.95, f.seed, 1.2 * (1 - u * 0.5)); }
      else if (f.kind === 'fball') { const X0 = sx(f.x), Y0 = sy(f.y), R = f.R * Tz * (0.6 + 0.6 * eout(u)); Q.quad(302, X0, Y0 - R * 0.5, R, 0, 0, R, COL.hot, 1, u, f.seed, 1.2); Q.glow(X0, Y0 - R * 0.4, R * 1.6, COL.ember, 0.35 * (1 - u)); }
      else if (f.kind === 'pillar') { const X0 = sx(f.x), Y0 = sy(f.y), h = (f.H || 6) * Tz * eout(cl(f.t / 0.25)), w = f.R * Tz, fade = 1 - sstep(0.55, 1, u); Q.quad(303, X0, Y0 - h / 2, w * 1.6, 0, 0, h / 2, COL.hot, fade, 0.35, f.seed, 1.4 * fade); }
      else if (f.kind === 'embers') { const X0 = sx(f.x), Y0 = sy(f.y), R = f.R * Tz; Q.quad(301, X0, Y0 - R * 0.6 - u * Tz * 1.5, R * 1.2, 0, 0, R * 1.2, COL.hot, 1, u, f.seed, 0.6 * LQ() + 0.2); }
      else if (f.kind === 'xcross') { const X0 = sx(f.x), Y0 = sy(f.y), R = f.R * Tz; Q.quad(308, X0, Y0 - R * 0.2, R, 0, 0, R * 0.8, COL.hot, 1, u, f.seed, 1.3); }
      else if (f.kind === 'cres') { const X1 = sx(f.x), Y1 = sy(f.y) - Tz * 0.9, fade = sstep(0, 0.06, f.t) * (1 - sstep(f.life - 0.25, f.life, f.t)), ux = f.dx, uy = f.dy * FSY, L = Math.hypot(ux, uy) || 1, s = Tz * 3.0 * (1 + 0.3 * cl(f.t * 2));   // (concept2: colossal crescents)
        Q.quad(296, X1, Y1, ux / L * s, uy / L * s, -uy / L * s * 1.1, ux / L * s * 1.1, COL.crim, 1, cl(u), f.seed, fade * 1.7); Q.glow(X1 + ux / L * s * 0.5, Y1 + uy / L * s * 0.5, s * 0.9, COL.crim, 0.22 * fade);
        Q.quad(304, X1 - ux / L * s * 1.3, Y1 - uy / L * s * 1.3, ux / L * s * 1.3, uy / L * s * 1.3, -uy / L * s * 0.5, ux / L * s * 0.5, COL.crim, 1, 0.8, f.seed, 0.6 * fade);
        if (glOn()) parts.push({ m: 'cres', X: X1 + ux / L * s * 0.15, Y: Y1 + uy / L * s * 0.15, z: sy(f.y) + 0.5, s: s * 0.75, yaw: Math.atan2(f.dy, f.dx), tilt: f.tilt, a: fade * 0.95, gl: 1.8 }); }
      else if (f.kind === 'trail') { const a = f.a, A = f.A, r = a.smOut && a.smOut.r; if (!r || !A || A.dx == null) return; const fade = sstep(0, 0.1, f.t) * (1 - sstep(f.life - 0.3, f.life, f.t)) * cl(a.sm ? a.sm.mv : 1), hx = r.core[0], hy = r.core[1], L = Tz * 3.2, dx = A.dx, dy = A.dy * FSY, n = Math.hypot(dx, dy) || 1;
        Q.quad(304, hx - dx / n * L * 0.55, hy - dy / n * L * 0.55, dx / n * L * 0.75, dy / n * L * 0.75, -dy / n * Tz * 0.9, dx / n * Tz * 0.9, COL.crim, 1, 1, A.dist || 1, 0.9 * fade);
        for (const h of r.hornTips) { Q.glow(h[0], h[1], Tz * 0.5, COL.hot, 0.5 * fade); Q.quad(304, h[0] - dx / n * Tz, h[1] - dy / n * Tz, dx / n * Tz * 1.2, dy / n * Tz * 1.2, -dy / n * Tz * 0.25, dx / n * Tz * 0.25, COL.crim, 1, 1, 3, 0.6 * fade); }
        Q.shimmer(hx - dx / n * L * 0.4, hy - dy / n * L * 0.4, L * 0.6, 0.25 * fade, 0.6, '#FF8A50'); }
      else if (f.kind === 'burst') { const a = f.a, r = a.smOut && a.smOut.r; if (!r) return; const k = 1 - u; Q.quad(299, r.core[0], r.core[1], Tz * 3.2 * (0.6 + 0.6 * u), 0, 0, Tz * 3.2 * (0.6 + 0.6 * u), COL.hot, k, 0.12, 1, 1.5 * k); Q.glow(r.core[0], r.core[1], Tz * 2.5, COL.white, 0.5 * k); }
      else if (f.kind === 'hang') { const a = f.a, r = a.smOut && a.smOut.r; if (!r) return; const fade = sstep(0, 0.12, f.t) * (1 - sstep(f.life - 0.15, f.life, f.t)), cx = (r.bb[0] + r.bb[2]) / 2, cy = (r.bb[1] + r.bb[3]) / 2, R = Math.max(r.bb[2] - r.bb[0], r.bb[3] - r.bb[1]) * 0.62;
        Q.quad(305, cx, cy, R, 0, 0, R, COL.crim, 0.9 * fade, 0.72, 7, 1.1); Q.glow(cx, cy, R * 0.9, COL.crim, 0.22 * fade);
        for (let i = 0; i < 3; i++) { const a1 = f.t * 3 + i * 2.1, a2 = a1 + 2.4; Q.quad(300, cx + (Math.cos(a1) + Math.cos(a2)) * R * 0.35, cy + (Math.sin(a1) + Math.sin(a2)) * R * 0.35, (Math.cos(a2) - Math.cos(a1)) * R * 0.35, (Math.sin(a2) - Math.sin(a1)) * R * 0.35, -(Math.sin(a2) - Math.sin(a1)) * R * 0.12, (Math.cos(a2) - Math.cos(a1)) * R * 0.12, COL.hot, 1, 0.8, i * 7 + f.t, 0.8 * fade); } }
      else if (f.kind === 'portal') { const X0 = sx(f.x), Y0 = sy(f.y) - Tz * 2.6, op = sstep(0, 0.5, f.t) * (1 - sstep(f.life - 0.6, f.life, f.t)), R = Tz * 2.6;
        Q.quad(306, X0, Y0, R, 0, 0, R * 0.7, COL.crim, 1, op, 1.2, 1.1); Q.glow(X0, Y0, R * 0.25 * (0.5 + sstep(0.3, 0.8, f.t)), COL.white, 0.8 * op);   // (a miniature star materialising at its heart)
        for (let i = 0; i < 2; i++) { const e = sstep(0.4 + i * 0.25, 1.4 + i * 0.25, f.t), yy = lerp(Y0, sy(f.y) - Tz * 1.6, e); if (e > 0 && e < 1) Q.ring(X0, yy, R * (0.45 + 0.15 * i) * (1 - 0.4 * e), COL.hot, 0.7 * (1 - e) * op, Tz * 0.06, 0.45); } }   // (mechanical rings coming down out of it)
      else if (f.kind === 'ascent') { const X0 = sx(f.x), Y0 = sy(f.y), fade = 1 - sstep(0.5, 1, u), h = Tz * 16 * eout(cl(f.t / 1.0)); Q.quad(303, X0, Y0 - h / 2, Tz * 1.6, 0, 0, h / 2, COL.hot, fade, 0.3, 11, 1.3 * fade); }   // (the colossal trail of flame behind its rise)
      else if (f.kind === 'skysig' || f.kind === 'mtrail' || f.kind === 'shock') { const a = f.a, r = a.smOut && a.smOut.r; if (!r) return; const cx = (r.bb[0] + r.bb[2]) / 2, cy = (r.bb[1] + r.bb[3]) / 2, R = Math.max(r.bb[2] - r.bb[0], r.bb[3] - r.bb[1]);
        if (f.kind === 'skysig') { const fade = sstep(0, 0.35, f.t) * (1 - sstep(UT.dive - UT.p3 + 0.2, UT.dive - UT.p3 + 0.9, f.t)); for (let i = 0; i < 2; i++) Q.quad(298, cx, cy, R * (0.9 + 0.5 * i), 0, 0, R * (0.9 + 0.5 * i), COL.crim, fade * (0.9 - 0.3 * i), 1.1 + 0.2 * i, f.t * (0.3 - 0.5 * i), 0.9); }   // (the celestial sigils behind it)
        else if (f.kind === 'mtrail') { const dir = UL ? UL.dir : 1, fade = sstep(0, 0.3, f.t), dvx = dir * 0.62, dvy = 0.78; Q.quad(304, cx - dvx * R * 0.9, cy - dvy * R * 0.9, dvx * R * 1.1, dvy * R * 1.1, -dvy * R * 0.38, dvx * R * 0.38, COL.crim, 1, 1, 9, 1.1 * fade); Q.quad(299, cx, cy, R * 0.75, 0, 0, R * 0.75, COL.hot, fade, 0.12, 1, 1.2); }
        else { const fade = sstep(0, 0.2, f.t); Q.quad(307, cx, cy, R * 1.4, 0, 0, R * 1.4, COL.crim, 1, 0.35 + 0.4 * sstep(0, f.life, f.t), 17, 1.1 * fade); Q.shimmer(cx, cy, R * 0.8, 0.35 * fade, 1, '#FF7A40'); } }
      else if (f.kind === 'wrath') wrathAir(Q, f, Tz);
    }
    /* the ultimate's explosion above the floor: flash, the white-hot fireball, dome shockwaves, the pillar of fire, smoke, embers, secondary
       blasts round it, each with its own timing (pure: from the record's age) */
    function wrathAir(Q, f, Tz) {
      const X0 = sx(f.x), Y0 = sy(f.y), t = f.t, B = f.big || 1, Rr = CFG.ult.r * Tz * B, low = lowFx();
      if (t < 0.35) Q.glow(X0, Y0 - Tz, Rr * (0.5 + t * 2), COL.white, 0.9 * (1 - t / 0.35));   // 1 the blinding flash
      { const u = cl(t / 2.2); if (u < 1) Q.quad(302, X0, Y0 - Rr * 0.22 * (0.4 + 0.6 * eout(u)), Rr * 0.38 * (0.5 + 0.6 * eout(u)), 0, 0, Rr * 0.38 * (0.5 + 0.6 * eout(u)), COL.hot, 1, u, f.seed, 1.4); }   // 2 the fireball
      for (let i = 0; i < 3; i++) { const t0 = [0, UT.w2 - UT.hit, UT.w3 - UT.hit][i], u = (t - t0) / 0.8; if (u > 0 && u < 1) Q.quad(297, X0, Y0, Rr * (0.45 + 0.2 * i), 0, 0, Rr * (0.45 + 0.2 * i), COL.ember, 1, eout(u) * 0.95, f.seed + i, 1.3 * (1 - u * 0.5)); }   // 3 dome shockwaves
      { const u = cl(t / 2.4); if (u < 1) { const h = Tz * 14 * eout(cl(t / 0.3)), fade = 1 - sstep(0.45, 1, u); Q.quad(303, X0, Y0 - h / 2, Tz * 2.2 * B, 0, 0, h / 2, COL.hot, fade, 0.4, f.seed, 1.5 * fade); } }   // 7 the pillar of fire
      if (!low || t > 0.3) for (let j = 0; j < (low ? 4 : 7); j++) { const u = (t - 0.2 - j * 0.08) / 2.4; if (u <= 0 || u >= 1) continue; const an = j * 0.9 + f.seed, rr = Rr * (0.15 + 0.45 * eout(u)); Q.smoke(X0 + Math.cos(an) * rr, Y0 + Math.sin(an) * rr * FSY - Tz * (0.5 + 2.5 * u), Rr * (0.12 + 0.12 * u), 0.6 * (1 - u) * sstep(0, 0.1, u), f.seed + j, COL.smoke, 0.5 * (1 - u)); Q.shimmer(X0 + Math.cos(an) * rr, Y0 - Tz * (1 + 2 * u), Rr * 0.15, 0.25 * (1 - u), 0.8, '#FF7A40'); }   // 8 rolling heat-distorted smoke
      { const u = cl(t / 3.2); if (u < 1) Q.quad(301, X0, Y0 - Rr * 0.3 - u * Tz * 2, Rr * 0.7, 0, 0, Rr * 0.7, COL.hot, 1, u, f.seed, low ? 0.4 : 0.85); }   // 9 the embers
      for (let j = 0; j < (low ? 4 : 6); j++) { const t0 = 0.3 + j * 0.13, u = (t - t0) / 0.7; if (u <= 0 || u >= 1) continue; const an = j * 1.05 + f.seed * 0.3, rr = Rr * (0.45 + 0.1 * (j % 2)), px = X0 + Math.cos(an) * rr, py = Y0 + Math.sin(an) * rr * FSY; Q.quad(302, px, py - Tz * 0.8, Tz * 1.3 * (0.6 + 0.5 * eout(u)), 0, 0, Tz * 1.3 * (0.6 + 0.5 * eout(u)), COL.hot, 1, u, f.seed + j, 1.1); }   // 10 secondary explosions
      { const u = (t - (UT.fb - UT.hit)) / 0.6; if (u > 0 && u < 1) Q.glow(X0, Y0 - Tz, Rr * 0.6, COL.hot, 0.5 * (1 - u)); }   // 11 the final burst's light
      if (t > UT.p5 - UT.hit) { const u = cl((t - (UT.p5 - UT.hit)) / 2.4); Q.quad(301, X0, Y0 - Tz * 2.0, Tz * 3.0, 0, 0, Tz * 3.0, COL.ember, 1, 0.3 + 0.6 * u, f.seed + 3, 0.35 * (1 - u)); }   // (6: embers drifting round it)
    }
    function drawFx(c) {
      const Tz = T(), on = gpu(); if (!on) return; if (!UL && !FX.length && !list().length) return;
      const Q = fgOpen(c), parts = [];
      for (const f of FX) airOne(Q, f, Tz, parts);
      fgClose(c);
      if (parts.length && glOn()) { parts.sort((p, q) => p.z - q.z); c.save(); GLS().drawParts(c, parts, { res: 0.9 }); c.restore(); }
    }
    /* any list of FX records drawn as this module draws its own (for a boss): ground ones (ground true) or the air ones */
    function drawFxList(c, L2, ground) { if (!gpu() || !L2 || !L2.length) return; const Tz = T(), Q = fgOpen(c), parts = []; for (const f of L2) (ground ? groundOne : airOne)(Q, f, Tz, parts); fgClose(c); if (parts.length && glOn()) { parts.sort((p, q) => p.z - q.z); GLS().drawParts(c, parts); } }
    /* the ultimate's picture at a scene o (pure): its ground and air layers as if Wrath struck at o.x, o.y o.t s ago */
    function drawWrath(c, o) { if (!gpu()) return; const f = { kind: 'wrath', x: o.x, y: o.y, t: o.t || 0, life: UT.len - UT.hit + 2.6, big: 1 + 0.2 * ((o.k || 3) - 1) + 0.35 * (o.cata || 0), seed: o.seed || 0 }; const Tz = T(), Q = fgOpen(c), parts = []; if (o.ground !== false) wrathGround(Q, f, Tz, parts); if (o.sky !== false) wrathAir(Q, f, Tz); fgClose(c); }
    /* the light over the body (pure: from its screen points r, its pose P): the Heart of Ruin's star-sigil, the eyes, heat and energy at the
       horn tips, filaments between parted horn segments, plasma jets from the shoulders (Cataclysm, Overdrive), embers from the vents, the
       flanks glowing through the ribs, heat haze over the furnace */
    function bodyLight(c, r, P, al, at) {
      if (!r || !gpu()) return; const Q = fgOpen(c), u = r.unit, heat = cl(P.heat || 0), co = cl(P.coreOpen || 0), cv = r.coreVis == null ? 1 : r.coreVis, core = P.core == null ? 0.9 : P.core;
      Q.quad(299, r.core[0], r.core[1], Math.max(6, r.coreR * (3.4 + co * 1.5)), 0, 0, Math.max(6, r.coreR * (3.4 + co * 1.5)), COL.crim, al * (0.55 + 0.45 * cv), 1 / (3.4 + co * 1.5), heat, Math.min(1.8, 0.95 + 0.35 * core) * al);
      if (cv > 0.2) Q.shimmer(r.core[0], r.core[1] - u * 1.2, u * 2.4, 0.18 * al * (0.4 + heat + co), 0.9, '#FF8A50');
      for (const e of r.eyes) Q.glow(e[0], e[1], u * (0.45 + 0.2 * (P.eye || 1)), '#FF2A1E', 0.55 * al);
      for (const p of r.flankWin || []) Q.glow(p[0], p[1], u * 1.4, COL.crim, 0.18 * al * (0.6 + 0.4 * Math.sin((at || 0) * 2.3) + heat));
      const hh = cl(P.hornHeat || 0); if (hh > 0.05) for (const h of r.hornTips) { const fl = 0.6 + 0.4 * Math.sin((at || 0) * 15 + h[0]); Q.glow(h[0], h[1], u * (0.8 + 1.4 * hh), COL.ember, 0.45 * hh * al); Q.star(h[0], h[1], u * (0.8 + 1.2 * hh * fl), 0.5 * hh * al, COL.white); }
      const hn = Math.max(cl(P.horn || 0), cl(P.crown || 0)); if (hn > 0.2) { const sg = r.hornSegs || []; for (let i = 0; i + 1 < sg.length; i++) { if (i === Math.floor(sg.length / 2) - 1) continue; const a0 = sg[i], b0 = sg[i + 1], dx = (b0[0] - a0[0]) / 2, dy = (b0[1] - a0[1]) / 2, L = Math.hypot(dx, dy) || 1; Q.quad(300, a0[0] + dx, a0[1] + dy, dx, dy, -dy / L * u * 0.6, dx / L * u * 0.6, COL.hot, 1, 0.7, i * 5 + (at || 0), 0.6 * hn * al); } }
      const vt = Math.max(cl(P.vent || 0), co * 0.6); if (vt > 0.25) for (const j of r.jets || []) { const dx = (j.q[0] - j.p[0]) / 2, dy = (j.q[1] - j.p[1]) / 2, L = Math.hypot(dx, dy) || 1; Q.quad(310, j.p[0] + dx, j.p[1] + dy, -dy / L * u * 1.5, dx / L * u * 1.5, -dx, -dy, COL.crim, 1, 0.45, (at || 0) * 3, (vt - 0.2) * 1.2 * al); }
      for (const v of r.vents || []) if (Math.random() < 0.5) Q.glow(v[0], v[1] - u * 0.5, u * 0.6, COL.ember, 0.25 * al * (0.4 + heat));
      if (cl(P.dorsal || 0) > 0.2) for (const d of r.dorsal || []) Q.glow(d[0], d[1], u * 1.0, COL.ember, 0.22 * P.dorsal * al);
      fgClose(c);
    }
    function drawBodyFx(c, a) { if (!a.smOut || !a.smOut.r) return; bodyLight(c, a.smOut.r, a.smP || {}, (a.alpha == null ? 1 : a.alpha) * (a.judg ? a.jA : 1), a.at || 0); }
    /* screen-space: the world darkening for the ultimate under a black sun eclipsed in a crimson corona (the Awakening), the sky turned
       crimson for the Fallen Star; a little darkness for the summoning */
    function drawCine(c, W, Hh) {
      let dim = 0, cx = W / 2, cy = Hh * 0.45, r0 = Math.min(W, Hh) * 0.2, red = 0, ecl = 0;
      if (UL) { const t = UL.t, a = UL.a, r = a.smOut && a.smOut.r; dim = 0.5 * sstep(0, 1.2, t) * (1 - sstep(UT.hit, UT.hit + 0.4, t)) + 0.2 * (1 - sstep(UT.p5, UT.len, t)) * sstep(UT.hit, UT.hit + 0.4, t); red = sstep(UT.p2, UT.p3, t) * (1 - sstep(UT.hit, UT.p5, t)); ecl = sstep(0.3, 1.4, t) * (1 - sstep(UT.launch, UT.p3, t)); if (r && !(UL.t > UT.launch && UL.t < UT.hit)) { cx = r.core[0]; cy = r.core[1]; r0 = T() * 4; } }
      for (const a of list()) if (a.sm && a.sm.en >= 0 && !a.sm.ready) dim = Math.max(dim, 0.3 * (1 - sstep(1.8, 2.6, Math.max(0, a.sm.en))));
      if (dim > 0.005) { c.save(); const gr = c.createRadialGradient(cx, cy, r0, cx, cy, Math.max(W, Hh) * 0.75); gr.addColorStop(0, `rgba(14,4,6,${dim * 0.1})`); gr.addColorStop(0.4, `rgba(12,3,5,${dim * 0.7})`); gr.addColorStop(1, `rgba(6,1,2,${Math.min(0.9, dim * 1.2)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
      if (red > 0.005) { c.save(); c.globalCompositeOperation = 'source-over'; const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, `rgba(150,16,20,${0.4 * red})`); gr.addColorStop(0.6, `rgba(90,8,30,${0.18 * red})`); gr.addColorStop(1, 'rgba(40,4,10,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
      if (ecl > 0.01) { const ex = W * 0.5, ey = Hh * 0.17, er = Math.min(W, Hh) * 0.11; c.save(); const gr = c.createRadialGradient(ex, ey, er * 0.92, ex, ey, er * 1.06); gr.addColorStop(0, `rgba(4,0,2,${0.95 * ecl})`); gr.addColorStop(1, 'rgba(4,0,2,0)'); c.fillStyle = gr; c.beginPath(); c.arc(ex, ey, er * 1.06, 0, TAU); c.fill(); c.restore();
        if (gpu()) { const Q = fgOpen(c); Q.quad(299, ex, ey, er * 2.6, 0, 0, er * 2.6, COL.crim, ecl, 0.36, 0, 0.9 * ecl); fgClose(c); c.save(); c.fillStyle = `rgba(4,0,2,${0.96 * ecl})`; c.beginPath(); c.arc(ex, ey, er * 0.93, 0, TAU); c.fill(); c.restore(); } }   // (the black sun: its corona painted, then its dark disc laid back over its heart)
    }
    /* Ruin Pressure on the summon button (the combat UI's own place): a crimson arc filling round it, white-hot in the Cataclysm; the time
       left as a thin gold arc outside it */
    function drawBtn(c, b) {
      const a = list().find(q => q.st === 'fight' || q.st === 'awaken'); if (!a || !a.sm) return; const ab = a.sm, R = b.r + 6, p = ab.cata > 0 ? 1 : ab.ruin / CFG.ruin.max, life = cl(a.life / CFG.life);
      c.save(); c.lineCap = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(40,6,8,.75)'; c.beginPath(); c.arc(b.x, b.y, R, 0, TAU); c.stroke();
      c.strokeStyle = ab.cata > 0 ? (Math.floor(g.t * 8) % 2 ? '#FFF2DC' : '#FFB15A') : '#FF3A1E'; c.beginPath(); c.arc(b.x, b.y, R, -Math.PI / 2, -Math.PI / 2 + TAU * p); c.stroke();
      c.lineWidth = 2; c.strokeStyle = '#FFC24D'; c.beginPath(); c.arc(b.x, b.y, R + 5, -Math.PI / 2, -Math.PI / 2 + TAU * life); c.stroke();
      c.font = '800 7px sans-serif'; c.textAlign = 'center'; c.fillStyle = ab.cata > 0 ? '#FFE0B0' : '#FF8A6A'; c.fillText(ab.cata > 0 ? 'CATACLYSM' : 'RUIN ' + Math.round(ab.ruin), b.x, b.y - R - 9); c.restore();
    }
    // (a power on demand, aimed as the mind would aim it: for showcases, tests and a boss controller)
    function cast(a, kind, o) { stOf(a); a.sm.ready = true; a.sm.first = true; if (a.sm.act) endAct(a); const c = crowd(a.x, a.y, 9, 2.6), m = H.near(a.x, a.y, 10).slice(-1)[0];
      if (kind === 'charge') { const t2 = (o && o.m) || m; if (!t2) return false; start(a, 'charge', { m: t2 }); }
      else if (kind === 'perd' || kind === 'impact') start(a, kind, o || (c ? { x: c.x, y: c.y } : m ? { x: m.x, y: m.y } : null)); else start(a, kind, o); return true; }
    return { tick, fin, cast, choose, update, stop, outK, descent, entrance, interrupt, drawGround, drawFx, drawBodyFx, drawCine, drawBtn, drawFxList, drawWrath, bodyLight, slashOf, impactFx, waveFx, CFG,
      get ul() { return UL; }, get fx() { return FX; }, get wardOn() { return !!wardOff; } };
  }
  return { create, CFG, UT, BIG, poseFor, easePose, ultPose };
})();
if (typeof self !== 'undefined') self.SAMAEL_MOVES = SAMAEL_MOVES;
