/* ---------- (v426 BL) Belial, the World Pillar, in a fight: its four powers and Dominion of the World Pillar ----------
   Summoned, Belial (the Taurus Anima, 02e; its model 02f4) fights as a juggernaut through the Anima cycle (20g-dun-anima.js
   calls tick / fin / update and the draw hooks below). It has no cooldowns: whenever it is free (one power at a time, each
   with its wind-up, its action and its recovery: the animation lock) its mind weighs the field and picks among:
     Thronebreaker Rush   far monsters: it lowers its head, the horns' engines spin up, the ground breaks under its front feet,
                          gold rings rise round its shoulders, then it charges (really moving, slower and heavier than Samael):
                          seismic footfalls, monsters in its path struck and shoved aside, a horn thrust at the end (a frontal
                          impact). Level 4 adds a circular seismic shockwave, level 7 stone eruptions either side of its path and
                          a final gravitational explosion.
     Crown of Burdens     a crowd: it raises its head, the horns unfold, rings leave them and hang over the monsters, descending:
                          they are slowed and take gravitational pressure; level 4 draws them together, level 7 slams them down
                          in periodic pulses (Earth damage, a short stun; bosses are never dragged and stun less, by the game).
     Citadel Carapace     the pet under pressure (low health, heavy recent damage, shots or a crowd on it): it plants its legs,
                          the fortress on its back unfolds into a defensive array, a layered barrier covers it and the pet:
                          every blow on the pet is reduced and the share it takes is STORED; at the end the stored energy is
                          released as a retaliatory pressure wave. Level 4 a larger barrier and wave, level 7 the pet also
                          cannot be knocked about and the wave is far stronger.
     Graviton Stampede    monsters clustered on it: it rears and stamps (3 / 5 / 7 stomps), each foot's contact a compression
                          pulse; rocks rise under the monsters and are slammed down; its tail sweeps behind; level 4 adds a
                          second shockwave to every stomp, level 7 ends in a crater-forming impact.
   and, when its time is up, Dominion of the World Pillar (six phases, ~11.6 s: the Silence of Weight, the World Pillars, the
   Weight of Heaven, Divine Compression, Dominion, the Fall of the Citadel): two great Earth blows synchronised with the slam and
   the second pulse, then slowed monsters that take more damage for a while (bosses less, for less time); then it dissolves
   into gold dust and leaves, its GPU buffers released.
   Every number a design choice is in CFG. Without the GPU painter the powers still act in full, shown with the game's own
   particles. lowFx halves the debris and drops the costliest layers.
   Clean-up: stop() (the stage ends), the dismissal, the pet's death or an interrupted power release the ward, the slows it
   holds, the camera and every effect, and free its GPU buffers.
   Pure hooks for a boss fight later (no game state touched): BELIAL_MOVES.poseFor(kind, t, o) / easePose(store, tg, dt) /
   ultPose(t) / UT (the ultimate's timeline); inst.drawDominion(c, o) (the ultimate's whole picture: o = { x, y the centre,
   bx, by Belial's floor point, t, seed, k, groundOnly, skyOnly, alpha }) and inst.bodyLight(c, r, P, alpha, at) (the light over
   the body: the core, eyes, horn rings, filaments).
   v430 BP (the animation and effects polish; everything in the shared pure hooks, so the boss gets it):
   - poseFor: every power in seven beats (stance, weight shift, machinery, build, action, its own impact's recoil, the settle), with the
     new pose keys dx, spread, shift, mech (BELIAL_GL.draw reads them); ultPose adds them too (UT unchanged).
   - easePose(store, tg, dt): a critically damped spring per key (store.pzv), solved exactly: blends without snaps at any frame rate.
   - effects: new FX kinds 'foot' (a footfall: the plinth's ring, a dust skirt, cracks), 'lens' (a gravitational lens, FGFX 202; inward
     for a wind-up), 'quake' (a seismic upheaval, 205), 'bow' (the charge's pressure bow, 203, on the floor and ahead of the horns),
     'burst' (a shaft of force, 198), 'pulse' (a compression pulse from the core down, 204), 'ccharge' (the crown's charge over the
     brow), 'csig' (the carapace's foundation), 'shard' (the barrier's GPU shards); 'cring' arcs from the horns when given src (else as
     before) with gyroscopic rings and pulses driven down; the dome rises in three layers (197, the rune lattice 206, 197) with the
     energy drawn to the core and floating architecture. FX records the boss pushes are unchanged.
   - Dominion: pillars break out with momentum (drums turning into place), the ground heaving at each, the compression's lens and
     pulses, layered slam shockwaves, an eased camera; one painter batch for its sky and the effects; pillar parts pooled. */
const BELIAL_MOVES = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3), ein = u => cl(u) * cl(u);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t)), settle = (t, t0, f, k) => (t > t0 ? Math.exp(-(t - t0) * k) * Math.sin((t - t0) * f) : 0);
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const FSY = 0.55, BIG = 1.3;   // (BIG: it stands this much larger than the other Animas: a colossus)
  /* ---- the numbers (damage multipliers are times the Anima's power P = the pet's attack x ANIMA_POWER[form] (x 2 awakened); [a, b, c] by form) ---- */
  const CFG = {
    walk: { speed: 1.7, acc: 1.3, turn: 1.5 },                       // its heavy walk (tiles / s), how fast it gets there, how fast it turns (rad / s)
    rush: { wind: 0.95, speed: 5.8, minD: 2.6, maxD: 8.5, w: 1.15, dmg: 0.8, step: 0.22, fin: [2.0, 2.4, 2.8], finR: [2.0, 2.3, 2.6], shockR: 3.4, shock: 1.1, side: 0.8, sideR: 1.15, sideGap: 1.4, boom: 3.0, boomR: 3.8, rec: 0.75, kb: 5 },
    crown: { dur: [3.2, 3.6, 4.0], r: [4.2, 4.8, 5.4], tick: 0.5, dmg: 0.32, pull: 1.1, pulse: 1.0, slam: 0.85, stun: 0.35, fin: 0.6, maxT: 6 },
    carapace: { dur: [4.0, 4.5, 5.0], reduce: [0.4, 0.5, 0.55], R: [2.4, 3.0, 3.6], wave: [1.6, 2.2, 3.0], waveR: [3.4, 4.2, 5.2], store: 2.5, cap: [2.0, 2.5, 3.5], hp: 0.6, hurt: 0.12 },
    stamp: { n: [3, 5, 7], gap: 0.55, R: 2.4, dmg: 0.9, rocks: [2, 3, 4], rockD: 0.5, shock: 0.45, shockR: 3.2, crater: 2.6, craterR: 4.0, adv: 1.1, tail: 0.7 },
    roar: { dmg: 0.3, r: 2.6 },
    ult: { k1: 6, k2: 9, kc: 3, r: 10, core: 4, pillars: [6, 8, 10], pr: 5.8, weak: 8, weakBoss: 5, weakK: 1.22, weakKBoss: 1.1, slow: 4, slowBoss: 1.5 },
  };
  /* the ultimate's timeline (s): the Silence of Weight to p1, the World Pillars to p2, the Weight of Heaven to p3, Divine Compression to the
     slam, Dominion to p6 (its second pulse at pulse2), the Fall of the Citadel to len */
  const UT = { p1: 1.8, p2: 4.0, p3: 6.4, slam: 8.1, pulse2: 8.75, p6: 9.6, len: 11.6 };
  const COL = { gold: '#FFC24D', amber: '#FF9A2E', pale: '#FFE9A8', white: '#FFF6E0', dust: '#9A8264', dark: '#1A120A', stone: '#6A5E50' };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const GLB = () => (typeof BELIAL_GL !== 'undefined' ? BELIAL_GL : null);

  /* ---- the power poses (pure: shared with a boss): poseFor(kind, t, o) the pose a power holds t s into it (kind 'rush' | 'crown' |
     'carapace' | 'stamp' | 'roar'; anything else: rest); o: base (an idlePose), dur, wind, charge (the charge's length), n, gap (the
     stomps), k (form), pulse (0..1 a crown pulse), stag (a stagger), tailT (when the tail sweeps). Each with anticipation and settle ---- */
  /* v430 BP: every power is choreographed in the same beats, each its own curve so they overlap and blend: 1 the stance (the feet
     step out: spread), 2 the weight shift (back onto the haunches, or off the leg about to stamp: dx, shift), 3 the machinery
     (the horn segments turning, the stabilisers spinning, the plates chattering: mech), 4 the build (the core, the rings, a
     tremble), 5 the action, 6 the reaction to its own impact (a recoil: dx back, a stagger, a rear), 7 the return to its stance (a
     damped settle). New keys (read by BELIAL_GL.draw, eased by easePose): dx, spread, shift, mech */
  function poseFor(kind, t, o) {
    o = o || {}; const base = o.base || {};
    const tg = { head: 0, look: 0, jaw: 0, horn: 0, ringK: 1, ringOut: 0, core: base.core == null ? 0.85 : base.core, coreOpen: 0, cit: 0, citUp: 0, bast: 0, mono: 0, monoIn: 0, glow: 0, live: 1, crouch: 0, rear: 0, pitch: 0, lift: 0, tail: 0, stagger: o.stag || 0, hornAlign: 0, eye: 1, feet: null, dx: 0, spread: 0, shift: 0, mech: 0 };
    if (kind === 'rush') { const w = o.wind || CFG.rush.wind, ct = o.charge || 1, tI = w + ct, end = 1 - sstep(tI + 0.3, tI + 0.9, t);
      const st = sstep(0, 0.3, t), ws = sstep(0.08, 0.5, t) * (1 - sstep(w - 0.16, w - 0.02, t)), mc = sstep(0.2, 0.6, t), en = sstep(0.4, w, t) * (1 - sstep(w, w + 0.2, t)), lunge = bump(t, w - 0.14, w - 0.02, w + 0.05, w + 0.4);
      const go = sstep(w - 0.1, w + 0.05, t) * (1 - sstep(tI - 0.08, tI + 0.04, t)), th = bump(t, tI - 0.1, tI - 0.01, tI + 0.14, tI + 0.5), rc = bump(t, tI, tI + 0.07, tI + 0.2, tI + 0.62), rv = settle(t, tI + 0.4, 6.5, 3.4);
      tg.spread = 0.42 * st * (1 - 0.55 * go) * end; tg.dx = -0.5 * ws + 0.45 * lunge - 0.6 * rc + 0.12 * rv; tg.crouch = 0.55 * ws + 0.3 * en * (1 - ws) + 0.25 * go + 0.15 * th - 0.1 * rc;
      tg.head = 0.95 * Math.max(ws, en, go, lunge) * (1 - th) + 0.25 * st * (1 - ws) - 1.2 * th + 0.18 * rv; tg.horn = Math.max(mc, go, th) * end; tg.mech = mc * end * (1 - 0.4 * go); tg.ringK = 1 + 4.5 * Math.max(mc * (0.4 + 0.6 * en), go) + 2 * th;
      tg.ringOut = 0.3 * en + 0.6 * th; tg.glow = 0.35 * en + 0.2 * go + 0.5 * th; tg.jaw = 0.4 * th + 0.25 * bump(t, 0.25, 0.4, 0.55, 0.8); tg.rear = 0.3 * th + 0.12 * rc; tg.bast = 0.45 * Math.max(ws, en) * end + 0.3 * rc;
      tg.core += 0.9 * en + 0.5 * go + th; tg.live = 1 - 0.85 * Math.max(ws, en, go, th); tg.pitch = 0.03 * Math.sin(t * 25) * en * (1 - go); tg.tail = 0.4 * go - 0.35 * ws + 0.5 * rc; tg.stagger += 0.35 * rc; }
    else if (kind === 'crown') { const d = o.dur || 3.6, pl = o.pulse || 0, st = sstep(0, 0.3, t) * (1 - sstep(d + 0.1, d + 0.7, t)), an = bump(t, 0, 0.14, 0.2, 0.42), rs = sstep(0.18, 0.75, t) * (1 - sstep(d - 0.12, d + 0.05, t)), mc = sstep(0.12, 0.5, t) * (1 - sstep(d, d + 0.5, t));
      const lv = sstep(0.45, 0.95, t) * (1 - sstep(d, d + 0.4, t)), fin = bump(t, d - 0.1, d + 0.02, d + 0.12, d + 0.5), rv = settle(t, d + 0.3, 6, 3.2);
      tg.spread = 0.28 * st; tg.head = 0.28 * an - 0.75 * rs + 0.25 * pl + 0.55 * fin + 0.12 * rv; tg.crouch = 0.25 * an + 0.25 * pl + 0.35 * fin; tg.dx = -0.18 * rs + 0.3 * fin - 0.06 * pl; tg.jaw = 0.8 * bump(t, 0.3, 0.5, 0.75, 1.2) + 0.15 * rs + 0.3 * pl + 0.3 * fin;
      tg.horn = Math.max(rs, fin, mc * 0.7); tg.mech = mc; tg.ringOut = lv; tg.ringK = 1 + 1.5 * mc + 1.5 * rs + 2 * pl; tg.core += 0.6 * mc + 0.5 * rs + 0.8 * pl + 0.5 * fin; tg.glow = 0.35 * rs + 0.4 * pl + 0.3 * fin; tg.live = 1 - 0.6 * rs;
      tg.look = 0.12 * Math.sin(t * 0.9) * rs; tg.shift = 0.25 * Math.sin(t * 1.1) * rs; tg.bast = 0.3 * rs + 0.2 * pl; }
    else if (kind === 'carapace') { const d = o.dur || 4.5, pl = sstep(0, 0.35, t) * (1 - sstep(d + 0.3, d + 0.9, t)), tr = sstep(0.25, 1.0, t) * (1 - sstep(d, d + 0.7, t)), mc = sstep(0.12, 0.45, t) * (1 - sstep(d + 0.2, d + 0.8, t));
      const ga = bump(t, d - 0.5, d - 0.18, d - 0.06, d + 0.02), rel = bump(t, d - 0.05, d + 0.05, d + 0.25, d + 0.7), rv = settle(t, d + 0.5, 6, 3);
      tg.spread = 0.55 * pl; tg.cit = tr; tg.bast = 0.9 * tr; tg.mono = tr; tg.mech = mc; tg.crouch = 0.42 * pl + 0.25 * ga - 0.15 * rel; tg.dx = -0.3 * ga + 0.4 * rel + 0.1 * rv; tg.core += 1.1 * tr + (o.charge || 0) * 1.2 + 0.6 * ga + 1.5 * rel;
      tg.glow = 0.4 * tr + 0.3 * ga + 0.7 * rel; tg.head = 0.3 * pl + 0.2 * ga - 0.55 * rel + 0.12 * rv; tg.jaw = 0.8 * rel; tg.horn = 0.5 * tr + rel; tg.ringK = 1 + 1.5 * tr + 1.5 * ga + 3 * rel; tg.rear = 0.18 * rel; tg.live = 1 - 0.8 * tr; tg.stagger *= 0.35; }
    else if (kind === 'stamp') { const n = o.n || 3, gap = o.gap || CFG.stamp.gap, t0 = 0.45, last = t0 + (n - 1) * gap, big = (o.k || 1) >= 3, on = sstep(0, 0.3, t) * (1 - sstep(last + 0.3, last + 0.8, t)), fe = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; let up = 0, sh = 0, rc = 0, lk = 0;
      for (let i = 0; i < n; i++) { const ts = t0 + i * gap, u = (t - (ts - 0.8 * gap)) / (0.8 * gap), both = i === n - 1 && big, hk = (both ? 1.45 : 1 + 0.06 * i) * (i % 3 === 2 ? 1.1 : 1);
        if (u > 0 && u < 1) { const lf = u < 0.72 ? sstep(0, 0.72, u) : 1 - ein((u - 0.72) / 0.28), f = [0.5 * lf * (1 + 0.1 * (i % 2)), 0.08 * lf * (i % 3 === 1 ? 1 : 0), 2.0 * lf * hk]; fe[i % 2] = f; if (both) fe[(i + 1) % 2] = f; up = Math.max(up, lf * hk); sh += (both ? 0 : (i % 2 ? 0.55 : -0.55)) * lf; lk += 0.14 * (i % 2 ? -1 : 1) * lf; }
        rc = Math.max(rc, bump(t, ts - 0.01, ts + 0.04, ts + 0.1, ts + 0.38) * (both ? 1.6 : 1)); }
      const cr = bump(t, last - 0.05, last, last + 0.2, last + 0.65) * (big ? 1 : 0.4), tt = o.tailT || -9, rv = settle(t, last + 0.5, 6, 3);
      tg.feet = fe; tg.spread = 0.25 * on; tg.shift = sh; tg.look = lk; tg.dx = -0.25 * on * (1 - rc) + 0.12 * rc + 0.08 * rv; tg.rear = 0.3 * up; tg.mech = on; tg.core += 1.4 * on + 0.5 * rc; tg.ringK = 1 + 2.5 * on + 1.5 * rc; tg.glow = 0.35 * on + 0.4 * cr + 0.2 * rc;
      tg.head = 0.3 * on - 0.25 * up + 0.3 * rc + 0.4 * cr + 0.1 * rv; tg.horn = 0.6 * on; tg.crouch = 0.15 * on + 0.3 * rc + 0.55 * cr; tg.live = 1 - 0.6 * on; tg.stagger += 0.12 * rc;
      tg.tail = 1.3 * bump(t, tt - 0.3, tt, tt + 0.1, tt + 0.6) - 0.4 * bump(t, tt - 0.5, tt - 0.3, tt - 0.25, tt); }
    else if (kind === 'roar') { const r = bump(t, 0.05, 0.35, 0.8, 1.25), an = bump(t, 0, 0.12, 0.18, 0.35); tg.head = 0.2 * an - 0.45 * r + 0.25 * bump(t, 0.5, 0.65, 0.8, 1.2); tg.jaw = r; tg.horn = 0.7 * r; tg.mech = r; tg.ringK = 1 + 3 * r; tg.core += r; tg.glow = 0.4 * r; tg.live = 1 - 0.7 * r;
      tg.crouch = 0.2 * an + 0.2 * bump(t, 0.4, 0.55, 0.7, 1.1); tg.dx = -0.2 * r + 0.1 * an; tg.spread = 0.25 * bump(t, 0, 0.3, 1.0, 1.4); }
    return tg;
  }
  const PZK = ['head', 'look', 'jaw', 'horn', 'ringK', 'ringOut', 'core', 'coreOpen', 'cit', 'citUp', 'bast', 'mono', 'monoIn', 'glow', 'live', 'crouch', 'rear', 'pitch', 'lift', 'tail', 'stagger', 'hornAlign', 'eye', 'dx', 'spread', 'shift', 'mech'];
  // v430 BP: each key's stiffness (a critically damped spring's angular frequency): the body heavy, the head and the crouch quicker, the jaw and the stagger quickest
  const PZW = { jaw: 26, stagger: 26, head: 15, crouch: 15, rear: 15, dx: 13, pitch: 22, look: 7, spread: 6, shift: 6, ringK: 9, core: 11, glow: 11, eye: 12, coreOpen: 8, cit: 8, citUp: 8, mono: 7, monoIn: 8, mech: 8, tail: 10, hornAlign: 9, horn: 9, ringOut: 8 };
  /* easePose(store, tg, dt): eases store.pz toward tg. v430 BP: each key on its own critically damped spring (store.pzv its speed;
     solved exactly, so it is stable at any dt): a pose blends into the next with its speed carried (no snaps, no overshoot) */
  function easePose(store, tg, dt) {
    let pz = store.pz; if (!pz) pz = store.pz = Object.assign({}, tg); let pv = store.pzv; if (!pv) pv = store.pzv = {};
    dt = Math.max(0, Math.min(0.1, dt || 0));
    for (let j = 0; j < PZK.length; j++) { const q = PZK[j], g = tg[q] == null ? (q === 'live' || q === 'ringK' || q === 'eye' ? 1 : 0) : tg[q]; if (pz[q] == null) pz[q] = g; const v = pv[q] || 0;
      const w = PZW[q] || 7.5, e = Math.exp(-w * dt), d = pz[q] - g, jv = (v + w * d) * dt; pz[q] = g + (d + jv) * e; pv[q] = (v - jv * w) * e; }
    pz.feet = tg.feet || null; return pz;
  }
  /* the ultimate's pose at t (pure): planted, horns unfolding, the core opening and compressing, the citadel rising and folding,
     the rear-up and the slam, the slow lowering of the head, the dissolve; yaw an added turn (the slow orbit of the cinematic) */
  function ultPose(t) {
    const U = UT, p1 = sstep(0, U.p1, t), p2 = sstep(U.p1, U.p2, t), p3 = sstep(U.p2, U.p3, t), p4 = sstep(U.p3, U.slam - 0.15, t), slam = t >= U.slam ? 1 : 0, sb = bump(t, U.slam - 0.06, U.slam + 0.02, U.slam + 0.2, U.slam + 0.75), p5 = sstep(U.slam, U.p6, t), p6 = sstep(U.p6, U.len, t);
    const keep = 1 - p6, p2b = bump(t, U.pulse2 - 0.1, U.pulse2, U.pulse2 + 0.2, U.pulse2 + 0.8);
    return {
      head: 0.55 * p2 * (1 - p3) + 0.1 * p3 * (1 - p4) - 0.4 * p4 * (1 - slam) + slam * (0.6 * sb + 0.25 * (1 - sb) * (1 - p6)) + 0.45 * p6,
      rear: sstep(U.p3 + 0.2, U.slam - 0.35, t) * (1 - sstep(U.slam - 0.12, U.slam, t)), crouch: 0.2 * p1 + 0.5 * sb + 0.2 * p5 * keep,
      horn: p1 * keep, hornAlign: p4 * (1 - p5), ringK: Math.max(0.3, (1 + 2 * p1 + 3 * p2 + 4 * p3 + 6 * p4 - 7 * p5) * (1 - 0.85 * p6)), ringOut: (0.4 * p1 + 0.6 * p3 - 0.8 * p4 + 0.6 * slam) * keep,
      core: Math.max(0.3, 0.85 + 1.2 * p1 + p2 + 1.5 * p3 + 1.5 * p4 + 2 * sb + p2b - 4.5 * p6), coreOpen: p3 * (1 - 0.5 * p4) * (1 - 0.5 * p5) * keep,
      cit: 0.6 * p2 * keep, citUp: p3 * (1 - 0.3 * p5) * keep, mono: 0.5 * p3 * (1 - p4), monoIn: p4, monoDis: sstep(U.slam, U.slam + 1.0, t), bast: 0.5 * p2 * keep,
      glow: Math.max(0, 0.3 * p1 + 0.3 * p2 + 0.4 * p3 + 0.6 * p4 + sb + 0.5 * p2b - 1.6 * p6), jaw: 0.5 * bump(t, 0.3, 0.6, 1.0, 1.5) + 0.8 * sb + 0.6 * p2b, eye: 1 + p4 + 2 * sb,
      live: 0.5 - 0.4 * Math.max(p4, sb) + 0.5 * p6, pitch: 0.015 * Math.sin(t * 40) * p1 * (1 - p2), yawOff: 0.55 * Math.sin(Math.PI * p3) * (1 - p4),
      dis: sstep(U.len - 1.6, U.len - 0.15, t), tail: 0.5 * sb, halo: keep, lift: 0, stagger: 0, look: 0, feet: null,
      // v430 BP: it plants wide as the world goes silent, its machinery wakes and races toward the slam, it gathers its weight back
      // before rearing, lurches forward with the slam, rocks with the second pulse, and settles (the pose's own beats; the times unchanged)
      spread: 0.5 * p1 * keep, mech: Math.max(0, sstep(0.3, U.p1, t) * keep - 0.6 * p5), dx: -0.35 * sstep(U.p3, U.slam - 0.4, t) * (1 - sstep(U.slam - 0.15, U.slam, t)) + 0.35 * sb - 0.15 * p2b + 0.1 * settle(t, U.p6, 5, 2.5),
      shift: 0.15 * Math.sin(t * 0.8) * p2 * (1 - p4) };
  }

  function create(H) {
    const X = H.X, me = H.me, g = H.g, T = H.T, ST = H.ST, S = H.S;
    const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
    const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
    const glOn = () => { const G = GLB(); return !!(G && G.usable()); };
    const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
    const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
    const sfx = n => { try { if (X.sfx && X.sfx[n]) X.sfx[n](); } catch (e) {} };
    const FX = [];                  // effects in the world: { kind, t, life, ... }
    let UL = null;                  // Dominion of the World Pillar in progress
    let bar = null, wardOff = null; // the Citadel Carapace's barrier { a, t, dur, R, reduce, store, hit: [age, dir] } and the ward's remover
    let released = true;            // (its GPU buffers freed since it last left)
    let stompT = -9;                // v430 BP: (game time) the last stomp: the floating rocks jolt
    const held = new Set();         // monsters it is slowing (released on clean-up)
    const kOf = a => Math.max(1, Math.min(3, a.k | 0)), pw = a => H.P(a), LQ = () => (lowFx() ? 0.5 : 1);
    const list = () => S.list.filter(a => a.id === 'taurus');
    /* model units -> tiles, for its feet and its front */
    const HT = [0, 12.4, 13.6, 15.0];
    const u2t = a => { const aw = a.st === 'awaken' || (UL && UL.a === a), kv = aw ? 3 : kOf(a), G = GLB(); return ANIMA_SIZE[kv] * (aw ? 1.18 : 1) * BIG / ((G && G.HEIGHT) || HT)[kv]; };
    const stride = a => ((GLB() && GLB().STRIDE) || 2.1) * u2t(a);
    function footW(a, i) { const G = GLB(), L = G ? G.LEGS[i] : { x: i < 2 ? 2.2 : -2.45, s: i % 2 ? -1 : 1, fy: 2.1 }, u = u2t(a), y = a.bl.yaw, mx = L.x, my = L.s * L.fy; return { x: a.x + (mx * Math.cos(y) - my * Math.sin(y)) * u, y: a.y + (mx * Math.sin(y) + my * Math.cos(y)) * u, f: !!L.f }; }
    const frontOf = (a, d) => ({ x: a.x + Math.cos(a.bl.yaw) * d, y: a.y + Math.sin(a.bl.yaw) * d });
    /* ---- the ward: the barrier takes its share of every blow at the pet (stored for the retaliation); every blow is remembered (the mind's threat) ---- */
    function ensureWard() { if (wardOff || !X.addWard) return; wardOff = X.addWard((d, src) => wardFn(d, src), false); }
    function wardFn(d, src) {
      if (!(d > 0)) return d;
      for (const a of list()) if (a.bl) a.bl.hurt += d;
      if (bar && bar.a && Math.hypot(me.x - bar.a.x, me.y - bar.a.y) < bar.R * 1.6 + 0.5) { const s = d * bar.reduce; bar.store += s; d -= s; const dir = src && src.x != null ? Math.atan2(src.y - me.y, src.x - me.x) : Math.random() * TAU; bar.hit = [0.001, dir]; const ab = bar.a.bl; if (ab) { ab.charge = Math.min(1.5, (ab.charge || 0) + 0.3); ab.stag = Math.max(ab.stag, 0.35); } }
      return d;
    }
    /* ---- state ---- */
    function stOf(a) { return a.bl || (a.bl = { act: null, last: null, hurt: 0, charge: 0, pz: null, yaw: (a.face || 1) > 0 ? 0.45 : Math.PI - 0.45, yawT: null, ph: 0, mv: 0, vx: 0, vy: 0, lvx: 0, lvy: 0, ax: 0, ay: 0, stag: 0, first: false, en: -1, gap: 0, thudT: 0 }); }
    function crowd(x, y, reach, rr) {
      const tg = H.near(x, y, reach); if (!tg.length) return null; let best = null, bn = -1;
      for (const m of tg) { const nb = tg.filter(q => Math.hypot(q.x - m.x, q.y - m.y) < rr); if (nb.length > bn) { bn = nb.length; best = nb; } }
      return { x: best.reduce((s, m) => s + m.x, 0) / best.length, y: best.reduce((s, m) => s + m.y, 0) / best.length, n: best.length, m: best[0] };
    }
    const knock = (m, fx, fy, f) => { if (m.still) return; const d = Math.hypot(m.x - fx, m.y - fy) || 1, k = f * (m.boss ? 0.12 : m.type === 'golem' || m.type === 'knight' ? 0.5 : 1); m.kbx = (m.kbx || 0) + (m.x - fx) / d * k; m.kby = (m.kby || 0) + (m.y - fy) / d * k; };
    const area = (x, y, R, dmg, o) => { let n = 0; for (const m of H.living()) if (Math.hypot(m.x - x, m.y - y) < R + m.r) { H.hit(m, dmg, Object.assign({ el: 'earth' }, o || {})); if (o && o.kbf) knock(m, x, y, o.kbf); n++; } return n; };
    /* ---- moving: a heavy, deliberate walk (it turns toward its heading before it gains speed); the gait's phase from the distance ---- */
    function stepTo(a, dt, tx, ty, vmax) {
      const ab = a.bl, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), head = Math.atan2(dy, dx), tk = d > 0.3 ? cl(1 - Math.abs(angD(head, ab.yaw)) / 1.5) : 0, want = d > 0.3 ? Math.min(vmax, d * 1.1) * tk : 0;
      const acc = Math.min(1, dt * CFG.walk.acc); ab.vx += ((d > 0.3 ? dx / d * want : 0) - ab.vx) * acc; ab.vy += ((d > 0.3 ? dy / d * want : 0) - ab.vy) * acc;
      if (d > 0.3) ab.yawT = head;
      moveBy(a, ab.vx * dt, ab.vy * dt);
    }
    function moveBy(a, mx, my) { const ab = a.bl, p = X.walkPoint(a.x + mx, a.y + my, { r: 0.6, mv: 0, x: a.x, y: a.y }), dd = Math.hypot(p.x - a.x, p.y - a.y); a.x = p.x; a.y = p.y;
      const ph0 = ab.ph; ab.ph += dd / Math.max(0.05, stride(a) * (ab.gk || 1) /* v430 BP: the charge's long stride */ * Math.max(0.3, ab.mv)) * TAU; footfalls(a, ph0, ab.ph); return dd; }
    function footfalls(a, ph0, ph1) { const G = GLB(); if (!G) return; const ab = a.bl, A = ab.act;
      for (const f of G.footfalls(ph0, ph1)) { const p = footW(a, f.i), big = A && A.kind === 'rush' && A.t > A.wind;
        if (big) { area(p.x, p.y, 1.0, pw(a) * CFG.rush.step * (ab.gk || 1) /* v430 BP: the charge's longer stride lands fewer, heavier footfalls: the same damage a tile */, { noCrit: true }); FX.push({ kind: 'wave', x: p.x, y: p.y, R: 1.6, t: 0, life: 0.45, seed: Math.random() * 50, a: 0.35 }); FX.push({ kind: 'crack', x: p.x, y: p.y, R: 1.0, t: 0, life: 1.2, seed: Math.random() * 50, heat: 0.45, a: 0.6 }); X.shake(3.5, 0.12); }
        // v430 BP: each footfall its own impact: the plinth pressed into the floor (its ring of light), a skirt of dust rolling out;
        // the forefeet heavier (a larger ring and skirt, a light shake), the hind feet a softer puff
        if (ab.mv > 0.2) FX.push({ kind: 'foot', x: p.x, y: p.y, R: big ? 1.35 : f.f ? 0.95 : 0.7, t: 0, life: big ? 1.1 : 0.85, seed: Math.random() * 50, f: f.f ? 1 : 0, big: big ? 1 : 0 });
        if (f.f && ab.mv > 0.4) { X.shake(1.2 + ab.mv * 1.6, 0.08); if (ab.thudT <= 0) { sfx('thud'); ab.thudT = 0.5; } } } }
    // v430 BP: the steps the model takes at a standstill (settling, turning in place, widening its stance): a small puff each
    function idleSteps(a) { const ab = a.bl, M = a.blM; if (!M || M.n === ab.sn) return; ab.sn = M.n; for (const s of M.steps) if (s.idle) { const p = footW(a, s.i); FX.push({ kind: 'foot', x: p.x, y: p.y, R: s.f ? 0.7 : 0.55, t: 0, life: 0.7, seed: Math.random() * 50, f: s.f ? 1 : 0, small: 1 }); if (s.f) X.shake(0.8, 0.06); } }
    function guard(a, dt) {
      const ab = a.bl, side = a.side || -1, dp = Math.hypot(me.x - a.x, me.y - a.y);
      if (dp > 14) { const p = X.walkPoint(me.x + side * 2.2, me.y - 1.0, { r: 0.6, mv: 0, x: me.x, y: me.y }); a.x = p.x; a.y = p.y; ab.vx = ab.vy = 0; FX.push({ kind: 'dust', x: a.x, y: a.y, R: 2.2, t: 0, life: 0.8, seed: 3 }); return; }
      let tx = me.x + side * 2.4 + (me.vx || 0) * 0.4, ty = me.y - 1.0 + (me.vy || 0) * 0.4; const c = crowd(me.x, me.y, 8, 2.5); if (c) { tx = lerp(tx, c.x, 0.3); ty = lerp(ty, c.y, 0.3); }
      if (Math.hypot(tx - a.x, ty - a.y) < 0.9) { ab.vx *= 1 - Math.min(1, dt * 3); ab.vy *= 1 - Math.min(1, dt * 3); moveBy(a, ab.vx * dt, ab.vy * dt); const f = H.near(a.x, a.y, 9)[0]; if (f) ab.yawT = Math.atan2(f.y - a.y, f.x - a.x); return; }
      stepTo(a, dt, tx, ty, CFG.walk.speed * (dp > 6 ? 1.6 : 1));
    }
    /* ---- the mind: no cooldowns; when it is free it weighs the field and picks the power that fits it best ---- */
    function choose(a) {
      const ab = a.bl, k = kOf(a), foes = H.near(a.x, a.y, 10); if (!foes.length) return null;
      const hp = ST().hp, dn = Math.hypot(foes[0].x - a.x, foes[0].y - a.y), opts = [];
      // far monsters: the charge (at the nearest monster farther than 3 tiles, or the first far one in reach)
      const far = foes.find(m => { const d = Math.hypot(m.x - a.x, m.y - a.y); return d > 3 && d < CFG.rush.maxD; });
      if (far) opts.push({ kind: 'rush', s: (dn > 3.2 ? 0.75 + 0.08 * Math.min(5, dn - 3) : 0.4), o: { m: far } });
      // a crowd: the crown
      const c = crowd(a.x, a.y, 7, 2.4); if (c && c.n >= 2) opts.push({ kind: 'crown', s: c.n >= 3 ? 0.72 + 0.09 * Math.min(6, c.n) : 0.45, o: { x: c.x, y: c.y } });
      // the pet under pressure: the carapace
      const shots = (X.eshots || []).filter(b => Math.hypot(b.x - me.x, b.y - me.y) < 3).length, onPet = H.near(me.x, me.y, 2.5).length, thr = (me.hp < hp * CFG.carapace.hp ? 0.6 : 0) + ab.hurt / hp * 4 + shots * 0.12 + onPet * 0.09;
      if (thr > 0.35 && a.life > 2) opts.push({ kind: 'carapace', s: 0.5 + thr });
      // clustered on it: the stampede
      const nb = foes.filter(m => Math.hypot(m.x - a.x, m.y - a.y) < 3.2).length; if (nb) { const cc = crowd(a.x, a.y, 4, 2.5); opts.push({ kind: 'stamp', s: nb >= 2 ? 0.66 + 0.12 * Math.min(5, nb) : 0.42, o: cc ? { x: cc.x, y: cc.y } : { x: foes[0].x, y: foes[0].y } }); }
      if (!opts.length) return null;
      for (const q of opts) { if (q.kind === ab.last) q.s *= 0.78; q.s += Math.random() * 0.08; }   // (variety: a bias, not a timer)
      opts.sort((p, q) => q.s - p.s); return opts[0].s > 0.35 ? opts[0] : null;
    }
    /* ---- the powers ---- */
    function start(a, kind, o) {
      const ab = a.bl, k = kOf(a); ab.act = Object.assign({ kind, t: 0, k, hits: 0 }, o || {}); const A = ab.act; ab.last = kind;
      if (kind === 'rush') { const m = A.m, d0 = Math.hypot(m.x - a.x, m.y - a.y) || 1, dx = (m.x - a.x) / d0, dy = (m.y - a.y) / d0, dist = Math.max(CFG.rush.minD, Math.min(CFG.rush.maxD, d0 + 1.0));
        Object.assign(A, { dx, dy, dist, sx: a.x, sy: a.y, wind: CFG.rush.wind, chargeT: dist / CFG.rush.speed, hit: new Set(), trav: 0, nextE: CFG.rush.sideGap }); A.end = A.wind + A.chargeT + CFG.rush.rec; ab.yawT = Math.atan2(dy, dx); sfx('hum'); }
      else if (kind === 'crown') { A.dur = CFG.crown.dur[k - 1]; A.R = CFG.crown.r[k - 1]; A.tk = 0.2; A.pk = CFG.crown.pulse; A.pulseT = -9; A.tg = new Set(); A.end = A.dur + 0.45; ab.yawT = Math.atan2(A.y - a.y, A.x - a.x); sfx('hum'); }
      else if (kind === 'carapace') { A.dur = CFG.carapace.dur[k - 1]; A.R = CFG.carapace.R[k - 1]; A.end = A.dur + 0.85; sfx('hum'); }
      else if (kind === 'stamp') { A.n = CFG.stamp.n[k - 1]; A.gap = CFG.stamp.gap; A.end = 0.45 + (A.n - 1) * A.gap + 0.9; A.tailI = Math.floor(A.n / 2); A.tailT = 0.45 + A.tailI * A.gap + A.gap * 0.5; if (A.x == null) { const f = H.near(a.x, a.y, 5)[0]; A.x = f ? f.x : a.x; A.y = f ? f.y : a.y; } sfx('hum'); }
      else if (kind === 'roar') { A.end = 1.35; }
    }
    function act(a, dt) {
      const ab = a.bl, A = ab.act, t0 = A.t; A.t += dt; const t = A.t, k = A.k, P = pw(a), cross = x => t0 < x && t >= x;
      if (A.kind === 'rush') {
        const w = A.wind, tI = w + A.chargeT;
        if (t < w) { ab.mv = 0; ab.vx = ab.vy = 0; if (cross(0.12)) { const f = frontOf(a, 0.7); FX.push({ kind: 'crack', x: f.x, y: f.y, R: 1.6, t: 0, life: 2.2, seed: Math.random() * 50, heat: 1 }); FX.push({ kind: 'srings', a, t: 0, life: tI + 0.4 }); FX.push({ kind: 'dust', x: f.x, y: f.y, R: 1.6, t: 0, life: 0.9, seed: 7 });
            FX.push({ kind: 'lens', a, x: a.x, y: a.y, R: 3.6, t: 0, life: w - 0.08, inward: 1, seed: Math.random() * 40 }); /* v430 BP: its gravity gathering in round it */ }
          if (Math.random() < dt * 8) X.shake(1.5, 0.06); }
        else if (t0 < tI) { const ease = u => u < 0.18 ? (u / 0.18) * (u / 0.18) * 0.09 : u > 0.9 ? 1 - (1 - u) * (1 - u) / 0.1 * 0.05 : 0.09 + (u - 0.18) / 0.72 * 0.86, u0 = cl((t0 - w) / A.chargeT), u1 = cl((t - w) / A.chargeT), want = (ease(u1) - ease(u0)) * A.dist;
          if (cross(w) || (t0 <= w && t > w)) { FX.push({ kind: 'bow', a, A, t: 0, life: A.chargeT + 0.25 }); const b = frontOf(a, -1.6); FX.push({ kind: 'dust', x: b.x, y: b.y, R: 2.0, t: 0, life: 0.9, seed: 19 }); FX.push({ kind: 'quake', x: b.x, y: b.y, R: 1.8, t: 0, life: 0.6, seed: Math.random() * 40, a: 0.7 }); }   // v430 BP: the launch: the pressure bow ahead, the ground kicked out behind
          ab.mv = 1; ab.gk = 2.0; /* v430 BP */ const dd = moveBy(a, A.dx * want, A.dy * want); A.trav += dd; if (want > 0.02 && dd < want * 0.25 && u1 > 0.2) { A.t = tI; }   // (blocked: it strikes where it stands)
          if (A.trav >= (A.nextT || 0.6)) { A.nextT = A.trav + 0.7; const b = frontOf(a, -0.4); FX.push({ kind: 'dust', x: b.x - A.dx * 0.8, y: b.y - A.dy * 0.8, R: 1.3, t: 0, life: 0.8, seed: Math.random() * 50 }); }   // v430 BP: a wake of dust (the fractures are its footfalls')
          const f = frontOf(a, 1.1);
          for (const m of H.living()) { if (A.hit.has(m) || Math.hypot(m.x - f.x, m.y - f.y) > CFG.rush.w + m.r) continue; A.hit.add(m); H.hit(m, P * CFG.rush.dmg, { el: 'earth' }); A.hits++;
            if (!m.boss && !m.still) { const sd = Math.sign(A.dx * (m.y - a.y) - A.dy * (m.x - a.x)) || 1; m.kbx = (m.kbx || 0) + (-A.dy * sd * 4 + A.dx * 2); m.kby = (m.kby || 0) + (A.dx * sd * 4 + A.dy * 2); }
            X.shake(5, 0.12); FX.push({ kind: 'dust', x: m.x, y: m.y, R: 1.0, t: 0, life: 0.6, seed: Math.random() * 30 }); FX.push({ kind: 'lens', x: m.x, y: m.y, R: 1.3, t: 0, life: 0.4, seed: Math.random() * 40 }); FX.push({ kind: 'wave', x: m.x, y: m.y, R: 1.2, t: 0, life: 0.35, seed: Math.random() * 40, a: 0.8 }); g.hitStop = Math.max(g.hitStop || 0, 0.025); }   // v430 BP: each collision a bent ring of force and a beat
          if (k >= 3) while (A.trav >= A.nextE) { A.nextE += CFG.rush.sideGap; for (const sd of [1, -1]) { const ex = a.x - A.dy * sd * 1.6, ey = a.y + A.dx * sd * 1.6; area(ex, ey, CFG.rush.sideR, P * CFG.rush.side, { kbf: 2 }); erupt(ex, ey, 1.2, 3); } X.shake(6, 0.15); sfx('thud'); } }
        if (t >= tI) { ab.mv *= 1 - Math.min(1, dt * 9); ab.gk = 1; }   // v430 BP: it stops dead at the impact (its inertia lurches it on, and it settles)
        if (cross(tI)) impact(a, A, P);
      }
      else if (A.kind === 'crown') {
        if (cross(0.55)) { FX.push({ kind: 'cfield', a, x: A.x, y: A.y, R: A.R, t: 0, life: A.dur - 0.55 + 0.6, A }); sfx('sparkle'); }
        if (cross(0.12)) FX.push({ kind: 'ccharge', a, t: 0, life: 0.75 });   // v430 BP: the horns' engines winding up, a crown of rune rings forming over its brow
        const on = t > 0.6 && t < A.dur;
        if (on) { for (const m of H.living()) { const d = Math.hypot(m.x - A.x, m.y - A.y); if (d > A.R + m.r) continue;
            if (!A.tg.has(m) && A.tg.size < CFG.crown.maxT * 2) { A.tg.add(m); FX.push({ kind: 'cring', m, A, src: a, t: 0, life: A.dur - t + 0.55, seed: Math.random() * 100 }); }
            m.sandT = Math.max(m.sandT || 0, 0.35); held.add(m);
            if (k >= 2 && !m.boss && !m.still && d > 0.6) { const sp = Math.min(d - 0.5, CFG.crown.pull * dt * (0.4 + d / A.R)); X.moveEnt(m, (A.x - m.x) / d * sp, (A.y - m.y) / d * sp); } }
          A.tk -= dt; if (A.tk <= 0) { A.tk = CFG.crown.tick; for (const m of A.tg) if (!m.dead && Math.hypot(m.x - A.x, m.y - A.y) < A.R + m.r + 0.5) H.hit(m, P * CFG.crown.dmg, { el: 'earth', dot: true, dotC: COL.gold }); }
          if (k >= 3) { A.pk -= dt; if (A.pk <= 0) { A.pk = CFG.crown.pulse; A.pulseT = t; for (const m of A.tg) if (!m.dead && Math.hypot(m.x - A.x, m.y - A.y) < A.R + m.r + 0.5) { H.hit(m, P * CFG.crown.slam, { el: 'earth', stun: CFG.crown.stun }); m.hitSq = 1; FX.push({ kind: 'wave', x: m.x, y: m.y, R: 1.3, t: 0, life: 0.45, seed: Math.random() * 40 }); debris(m.x, m.y, 4, 1); }
            X.shake(6, 0.15); sfx('thud'); } } }
        if (cross(A.dur)) { for (const m of A.tg) if (!m.dead && Math.hypot(m.x - A.x, m.y - A.y) < A.R + m.r + 0.5) { H.hit(m, P * CFG.crown.fin, { el: 'earth' }); FX.push({ kind: 'dust', x: m.x, y: m.y, R: 0.9, t: 0, life: 0.6, seed: Math.random() * 30 }); debris(m.x, m.y, 5, 1); }
          FX.push({ kind: 'wave', x: A.x, y: A.y, R: A.R * 1.1, t: 0, life: 0.6, seed: 5 }); FX.push({ kind: 'quake', x: A.x, y: A.y, R: A.R, t: 0, life: 0.8, seed: 7 }); FX.push({ kind: 'lens', x: A.x, y: A.y, R: A.R * 1.15, t: 0, life: 0.55, seed: 9 }); X.shake(8, 0.2); sfx('crash'); }
      }
      else if (A.kind === 'carapace') {
        ab.vx = ab.vy = 0; ab.mv = 0;
        if (cross(0.05)) FX.push({ kind: 'csig', a, x: a.x, y: a.y, t: 0, life: A.dur + 0.6 });   // v430 BP: the fortress's foundation drawn on the floor before the shield rises
        if (cross(0.5)) { bar = { a, t: 0, dur: A.dur - 0.5, R: A.R, reduce: CFG.carapace.reduce[k - 1], store: 0, hit: null, k }; ensureWard(); FX.push({ kind: 'dome', a, t: 0, life: A.dur - 0.5 + 0.7 }); X.text(me.x, me.y - 1.5, 'CITADEL CARAPACE', COL.pale, 14, { crit: true, life: 1 }); sfx('sparkle'); X.shake(5, 0.3); }
        if (cross(A.dur)) retaliate(a, A, P);
      }
      else if (A.kind === 'stamp') {
        const n = A.n, nextS = 0.45 + Math.min(n - 1, Math.floor(Math.max(0, t - 0.45) / A.gap + 1)) * A.gap, d = Math.hypot(A.x - a.x, A.y - a.y);
        if (d > 1.2 && t < 0.45 + (n - 1) * A.gap) { ab.mv = 0.3; const sp = Math.min(CFG.stamp.adv, d) * dt; moveBy(a, (A.x - a.x) / d * sp, (A.y - a.y) / d * sp); ab.yawT = Math.atan2(A.y - a.y, A.x - a.x); } else ab.mv = 0;
        void nextS;
        for (let i = 0; i < n; i++) if (cross(0.45 + i * A.gap)) stomp(a, A, i, P);
        if (cross(A.tailT)) { const bx = a.x - Math.cos(ab.yaw) * 1.7, by = a.y - Math.sin(ab.yaw) * 1.7; area(bx, by, 1.8, P * CFG.stamp.tail, { kbf: 4 }); FX.push({ kind: 'wave', x: bx, y: by, R: 1.9, t: 0, life: 0.45, seed: 9 }); FX.push({ kind: 'dust', x: bx, y: by, R: 1.6, t: 0, life: 0.7, seed: 11 }); sfx('whoosh'); }
      }
      else if (A.kind === 'roar') {
        if (cross(0.5)) { area(a.x, a.y, CFG.roar.r, P * CFG.roar.dmg, { kbf: 3 }); FX.push({ kind: 'wave', x: a.x, y: a.y, R: 4.2, t: 0, life: 0.8, seed: 2 }); FX.push({ kind: 'dust', x: a.x, y: a.y, R: 3.2, t: 0, life: 1.0, seed: 4 }); X.shake(10, 0.4); sfx('crash'); }
      }
      if (ab.act === A && t >= A.end) endAct(a);
    }
    function endAct(a) { const ab = a.bl; if (!ab || !ab.act) return; const A = ab.act; ab.gk = 1; /* v430 BP */ if (A.kind === 'carapace' && bar && bar.a === a) bar = null; if (A.kind === 'crown') releaseHeld(A.tg); ab.act = null; ab.gap = 0.25; }
    /* an interrupted power: no more blows; the carapace releases what it stored at once; held monsters let go; its pictures fade */
    function interrupt(a) { const ab = a.bl; if (!ab || !ab.act) return; const A = ab.act; ab.gk = 1; /* v430 BP */ if (A.kind === 'carapace' && bar && bar.a === a && A.t > 0.6) retaliate(a, A, pw(a)); if (A.kind === 'crown') releaseHeld(A.tg); if (bar && bar.a === a) bar = null;
      for (const f of FX) if ((f.a === a || f.A === A) && f.life - f.t > 0.4) f.life = f.t + 0.4; ab.act = null; }
    function releaseHeld(set) { if (!set) return; for (const m of set) { if (m.sandT > 0.35) continue; held.delete(m); } }
    function impact(a, A, P) {
      const k = A.k, f = frontOf(a, 1.4), R = CFG.rush.finR[k - 1];
      for (const m of H.living()) if (Math.hypot(m.x - f.x, m.y - f.y) < R + m.r) { H.hit(m, P * CFG.rush.fin[k - 1], { el: 'earth' }); knock(m, a.x, a.y, CFG.rush.kb); }
      FX.push({ kind: 'wave', x: f.x, y: f.y, R: 2.8, t: 0, life: 0.6, seed: 3 }); FX.push({ kind: 'well', x: f.x, y: f.y, R: 1.8, t: 0, life: 0.7, h: 1.2 }); FX.push({ kind: 'crack', x: f.x, y: f.y, R: 2.2, t: 0, life: 2.2, seed: 13, heat: 1.2 }); FX.push({ kind: 'dust', x: f.x, y: f.y, R: 2.4, t: 0, life: 1.0, seed: 17 }); erupt(f.x, f.y, 1.6, 5);
      X.flash(0.18, '#FFE9A8'); X.shake(12, 0.35); sfx('crash'); X.light(f.x, f.y, 4, 0.4); g.hitStop = Math.max(g.hitStop || 0, 0.05);
      FX.push({ kind: 'quake', x: f.x, y: f.y, R: 3.2, t: 0, life: 0.85, seed: Math.random() * 40 }); FX.push({ kind: 'lens', x: f.x, y: f.y, R: 3.8, t: 0, life: 0.6, seed: Math.random() * 40 }); FX.push({ kind: 'burst', x: f.x, y: f.y, R: 1.0, t: 0, life: 0.55, seed: Math.random() * 40 });   // v430 BP: the ground heaving, space bent, a shaft of force
      if (k >= 2) X.after(0.12, () => { area(a.x, a.y, CFG.rush.shockR, P * CFG.rush.shock, { kbf: 3 }); FX.push({ kind: 'wave', x: a.x, y: a.y, R: CFG.rush.shockR * 1.15, t: 0, life: 0.7, seed: 21 }); FX.push({ kind: 'dust', x: a.x, y: a.y, R: CFG.rush.shockR, t: 0, life: 1.0, seed: 23 }); FX.push({ kind: 'quake', x: a.x, y: a.y, R: CFG.rush.shockR * 1.1, t: 0, life: 0.8, seed: 27 }) /* v430 BP */; X.shake(9, 0.25); });
      if (k >= 3) X.after(0.32, () => { area(f.x, f.y, CFG.rush.boomR, P * CFG.rush.boom, { kbf: 6 }); FX.push({ kind: 'well', x: f.x, y: f.y, R: CFG.rush.boomR, t: 0, life: 0.9, h: 1.6, big: 1 }); FX.push({ kind: 'field', x: f.x, y: f.y, R: CFG.rush.boomR * 1.1, t: 0, life: 0.8, rev: 1 }); FX.push({ kind: 'wave', x: f.x, y: f.y, R: CFG.rush.boomR * 1.3, t: 0, life: 0.8, seed: 25 }); erupt(f.x, f.y, 2.6, 8); FX.push({ kind: 'lens', x: f.x, y: f.y, R: CFG.rush.boomR * 1.4, t: 0, life: 0.75, seed: 29 }); FX.push({ kind: 'burst', x: f.x, y: f.y, R: 1.6, t: 0, life: 0.7, seed: 31 }) /* v430 BP */; X.flash(0.3, '#FFF0C8'); X.shake(18, 0.5); sfx('crash'); });
    }
    function retaliate(a, A, P) {
      const k = A.k, C = CFG.carapace, R = C.waveR[k - 1], st2 = bar ? bar.store : 0, bonus = Math.min(C.cap[k - 1], st2 / Math.max(1, ST().hp) * C.store), d = P * (C.wave[k - 1] + bonus);
      let n = 0; for (const m of H.living()) if (Math.hypot(m.x - a.x, m.y - a.y) < R + m.r) { H.hit(m, d, { el: 'earth', noCrit: true }); knock(m, a.x, a.y, 6); n++; }
      X.text(me.x, me.y - 1.6, bonus > 0.3 ? `Retaliation ×${(1 + bonus / C.wave[k - 1]).toFixed(1)}` : 'Retaliation', COL.pale, 13, { life: 1.2 });
      FX.push({ kind: 'wave', x: a.x, y: a.y, R: R * 1.15, t: 0, life: 0.8, seed: 31, big: 1 }); FX.push({ kind: 'field', x: a.x, y: a.y, R: R, t: 0, life: 0.7, rev: 1 }); FX.push({ kind: 'dust', x: a.x, y: a.y, R: R, t: 0, life: 1.1, seed: 33 });
      // v430 BP: the barrier breaks outward: its shards flung, the ground heaving, space bent by the release
      FX.push({ kind: 'quake', x: a.x, y: a.y, R: R, t: 0, life: 0.9, seed: 35 }); FX.push({ kind: 'lens', x: a.x, y: a.y, R: R * 1.2, t: 0, life: 0.65, seed: 37 }); shards(a.x, a.y, Math.round(10 * LQ()), (bar ? bar.R : 3) * 0.9);
      X.flash(0.3, '#FFE9A8'); X.shake(14 + k * 2, 0.45); sfx('crash'); X.light(a.x, a.y, 6, 0.6); g.hitStop = Math.max(g.hitStop || 0, 0.05); if (a.bl) a.bl.charge = 0; bar = null; void n;
    }
    function stomp(a, A, i, P) {
      const k = A.k, last = i === A.n - 1, f = footW(a, i % 2), c = frontOf(a, 1.0), R = CFG.stamp.R;
      area(c.x, c.y, R, P * CFG.stamp.dmg, { kbf: 2.5 }); FX.push({ kind: 'wave', x: f.x, y: f.y, R: R * 1.2, t: 0, life: 0.55, seed: i * 7 }); FX.push({ kind: 'crack', x: f.x, y: f.y, R: 1.8, t: 0, life: 1.8, seed: i * 11, heat: 1 }); FX.push({ kind: 'dust', x: f.x, y: f.y, R: 1.8, t: 0, life: 0.9, seed: i * 13 }); debris(f.x, f.y, 6, 1);
      // v430 BP: each stomp its own upheaval (its slabs, its seed, wider with each), a pulse driven down from the core, the floating rocks jolted
      FX.push({ kind: 'quake', x: f.x, y: f.y, R: R * (1.0 + 0.08 * i), t: 0, life: 0.7, seed: i * 19 + 3 }); FX.push({ kind: 'pulse', a, x: c.x, y: c.y, t: 0, life: 0.4, seed: i * 5 }); FX.push({ kind: 'lens', x: c.x, y: c.y, R: R * 1.1, t: 0, life: 0.45, seed: i * 23 }); stompT = g.t;
      const tg = H.near(c.x, c.y, 4.5); for (let j = 0; j < CFG.stamp.rocks[k - 1] * (lowFx() ? 0.5 : 1); j++) { const m = tg[j % Math.max(1, tg.length)], x = m ? m.x + (Math.random() - 0.5) * 0.6 : c.x + (Math.random() - 0.5) * 3, y = m ? m.y + (Math.random() - 0.5) * 0.4 : c.y + (Math.random() - 0.5) * 2; rock(x, y, 0.3 + Math.random() * 0.15, P * CFG.stamp.rockD, 1.1 + Math.random() * 0.4, 0.25 + j * 0.06); }
      if (k >= 2) X.after(0.15, () => { area(c.x, c.y, CFG.stamp.shockR, P * CFG.stamp.shock, {}); FX.push({ kind: 'field', x: c.x, y: c.y, R: CFG.stamp.shockR, t: 0, life: 0.5, rev: 1 }); FX.push({ kind: 'wave', x: c.x, y: c.y, R: CFG.stamp.shockR * 1.15, t: 0, life: 0.6, seed: i * 17 }); });
      X.shake(7 + i * 0.6, 0.18); sfx(i % 2 ? 'thud' : 'crash');
      if (last && k >= 3) { area(c.x, c.y, CFG.stamp.craterR, P * CFG.stamp.crater, { stun: 1.0, kbf: 5 }); FX.push({ kind: 'crater', x: c.x, y: c.y, R: CFG.stamp.craterR * 0.75, t: 0, life: 3.0, seed: 41 }); FX.push({ kind: 'wave', x: c.x, y: c.y, R: CFG.stamp.craterR * 1.3, t: 0, life: 0.8, seed: 43, big: 1 }); FX.push({ kind: 'dust', x: c.x, y: c.y, R: CFG.stamp.craterR, t: 0, life: 1.2, seed: 45 }); erupt(c.x, c.y, 2.4, 8); FX.push({ kind: 'quake', x: c.x, y: c.y, R: CFG.stamp.craterR * 1.15, t: 0, life: 1.0, seed: 47 }); FX.push({ kind: 'burst', x: c.x, y: c.y, R: 2.0, t: 0, life: 0.8, seed: 49 }); FX.push({ kind: 'lens', x: c.x, y: c.y, R: CFG.stamp.craterR * 1.3, t: 0, life: 0.7, seed: 51 }) /* v430 BP */;
        X.flash(0.3, '#FFE9A8'); X.shake(20, 0.5); g.hitStop = Math.max(g.hitStop || 0, 0.06); }
    }
    /* debris (painter rocks flung up and falling), a rock (a GPU boulder: rises, hangs, is slammed down by gravity: dmg on landing), an eruption */
    function debris(x, y, n, sp) { n = Math.round(n * LQ()); for (let i = 0; i < n; i++) { const an = Math.random() * TAU, v = (1 + Math.random() * 2) * sp; FX.push({ kind: 'chip', x, y, z: 0.1, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 3 + Math.random() * 3, t: 0, life: 1.2, s: 0.12 + Math.random() * 0.12, seed: Math.random() * 90 | 0, rot: Math.random() * 6 }); } }
    function rock(x, y, s, dmg, h, delay) { FX.push({ kind: 'rock', x, y, z: -s, h, s, dmg, t: -(delay || 0), life: 1.6, rise: 0.35, hold: 0.25, done: false, seed: Math.random() * 100, yaw: Math.random() * 6, tilt: Math.random() * 2 }); }
    // v430 BP: the barrier's shards: GPU fragments of gilded masonry flung out from its shell, tumbling and falling
    function shards(x, y, n, R) { for (let i = 0; i < n; i++) { const an = i / n * TAU + Math.random() * 0.5, v = 2.5 + Math.random() * 2; FX.push({ kind: 'shard', x: x + Math.cos(an) * R * 0.7, y: y + Math.sin(an) * R * 0.5, z: 0.6 + Math.random() * R * 0.6, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 2 + Math.random() * 3, t: 0, life: 1.3, s: 0.22 + Math.random() * 0.14, seed: Math.random() * 90 | 0, rot: Math.random() * 6 }); } }
    function erupt(x, y, R, n) { FX.push({ kind: 'crack', x, y, R, t: 0, life: 1.6, seed: Math.random() * 60, heat: 1 }); debris(x, y, n, 1.3); if (!lowFx()) rock(x, y, 0.25, 0, 0.6, 0); }
    /* ---- the pose every frame: the power's (or the ultimate's), the entrance's assembly, the final seconds' intensity, eased; its yaw turned heavily ---- */
    function poseOf(a, dt) {
      const ab = stOf(a), G = GLB(), inU = UL && UL.a === a, kv = a.st === 'awaken' || inU ? 3 : kOf(a), base = G ? G.idlePose(kv, a.at || 0) : { k: kv, core: 0.85 }, A = ab.act;
      let tg;
      if (inU) tg = ultPose(UL.t);
      else tg = poseFor(A ? A.kind : null, A ? A.t : 0, { base, dur: A && A.dur, wind: A && A.wind, charge: A && A.chargeT, n: A && A.n, gap: A && A.gap, k: A && A.k, stag: 0, tailT: A && A.tailT, pulse: A && A.kind === 'crown' ? Math.max(0, 1 - Math.abs(A.t - A.pulseT) / 0.35) : 0, charge2: ab.charge });
      if (A && A.kind === 'carapace') tg.core += (ab.charge || 0);
      if (a.st === 'enter') { const e = Math.max(0, ab.en); tg.asm = sstep(0.05, 1.45, e); tg.core = lerp(0, 1.5, sstep(1.0, 1.45, e)); tg.horn = sstep(1.2, 1.6, e) * (1 - sstep(1.8, 2.4, e)); tg.glow = 0.6 * (1 - sstep(1.4, 2.4, e)); tg.ringK = 1 + 3 * (1 - sstep(1.0, 2.0, e)); }
      if (a.st === 'awaken' && !inU) { const u = sstep(0, 0.7, a.aw || 0); tg.horn = Math.max(tg.horn, u * 0.6); tg.core += u; tg.ringK += u * 2; tg.glow += u * 0.4; tg.crouch = Math.max(tg.crouch || 0, 0.2 * u); }
      if (a.st === 'fight' && a.life < 4) { const q = 1 - Math.max(0, a.life) / 4; tg.ringK += q * 2; tg.glow += q * 0.35; tg.core += q * 0.8; tg.horn = Math.max(tg.horn, q * 0.4); }
      if (ab.stag > 0) { ab.stag = Math.max(0, ab.stag - dt * 2.5); tg.stagger = Math.sin(ab.stag * Math.PI) * (A && A.kind === 'carapace' ? 0.2 : 0.6); }
      const pz = easePose(ab, tg, dt);
      // the yaw: turned heavily toward its heading or its target (a power's own turn is quicker)
      if (!inU && ab.yawT != null) { const rate = (A && A.kind === 'rush' ? 2.6 : CFG.walk.turn) * dt, dd = angD(ab.yawT, ab.yaw); ab.yaw += Math.max(-rate, Math.min(rate, dd * Math.min(1, dt * 4) * 6)); }
      const c0 = Math.cos(ab.yaw); a.face = c0 >= 0 ? 1 : -1; a.fk = 1;
      // the springs (tail, banners): from its acceleration
      const vx = ab.vx || 0, vy = ab.vy || 0; ab.ax = lerp(ab.ax, (vx - ab.lvx) / Math.max(dt, 1e-3), 0.3); ab.ay = lerp(ab.ay, (vy - ab.lvy) / Math.max(dt, 1e-3), 0.3); ab.lvx = vx; ab.lvy = vy;
      if (G) G.springs(a, ab.ax, ab.ay, dt);
      if (!A && !inU) ab.mv += ((Math.hypot(vx, vy) / 1.5) - ab.mv) * Math.min(1, dt * 4); ab.mv = cl(ab.mv);
      a.blP = Object.assign(base, pz, { k: kv, t: a.at || 0, yaw: ab.yaw + (inU ? tg.yawOff || 0 : 0), ph: ab.ph, mv: inU ? 0 : ab.mv, feet: pz.feet, asm: tg.asm == null ? 1 : tg.asm, dis: tg.dis || 0, monoDis: tg.monoDis || 0, halo: tg.halo == null ? 1 : tg.halo, live: pz.live, gaitK: ab.gk || 1 /* v430 BP */ });
    }
    /* ---- the guardian's loop (20g's tick, in its 'fight') ---- */
    function tick(a, dt) {
      const ab = stOf(a); a.feet = true; ab.thudT -= dt;
      if (me.dead) { interrupt(a); return; }
      if (ab.act) { act(a, dt); return; }
      if (!ab.first) { ab.first = true; return start(a, 'roar'); }
      ab.gap -= dt;
      const ch = ab.gap <= 0 && a.life > 1.2 ? choose(a) : null;
      if (ch) return start(a, ch.kind, ch.o);
      guard(a, dt);
    }
    /* ---- Dominion of the World Pillar ---- */
    function pillarsOf(o) { const k = Math.max(1, Math.min(3, o.k || 3)), n = CFG.ult.pillars[k - 1], R = (o.pr || CFG.ult.pr), sd = o.seed || 0, out = [];
      for (let i = 0; i < n; i++) { const an = i / n * TAU + 0.3 + Math.sin(sd + i * 2.1) * 0.12, rr = R * (0.9 + 0.12 * Math.sin(sd * 1.7 + i * 3.3)); out.push({ x: o.x + Math.cos(an) * rr, y: o.y + Math.sin(an) * rr * 0.85, an, ts: UT.p1 + 0.3 + (i % n) * (1.4 / n), i }); }
      return out; }
    function fin(a) {
      const ab = stOf(a); interrupt(a);
      const cx = lerp(a.x, me.x, 0.35), cy = lerp(a.y, me.y, 0.35), k = kOf(a), seed = Math.random() * 1000;
      UL = { a, t: 0, x: cx, y: cy, k, seed, pillars: pillarsOf({ x: cx, y: cy, k, seed }), hit1: false, hit2: false, yaw0: ab.yaw, pressed: new Set() };
      a.judg = true; a.jA = 1; a.hold = true; ab.vx = ab.vy = 0; ab.mv = 0;
      g.cineT = Math.max(g.cineT || 0, UT.pulse2 + 0.3); me.inv = Math.max(me.inv, UT.pulse2 + 0.8);
      sfx('hum'); X.after(0.5, () => sfx('sparkle'));
    }
    function stepUL(dt) {
      const J = UL, a = J.a, t0 = J.t; J.t += dt; const t = J.t, cross = x => t0 < x && t >= x, C = CFG.ult, P = pw(a);
      if (t < UT.pulse2 + 0.3) { g.cineT = Math.max(0.02, UT.pulse2 + 0.3 - t); me.inv = Math.max(me.inv, 0.4); } else if (t0 < UT.pulse2 + 0.3) g.cineT = 0;
      // the camera: back as the world trembles, further as the pillars rise and the field gathers, pulled back for the compression, a punch at the slam, home at the end
      // v430 BP: eased throughout (no step at the slam): out as the world goes silent, a slow breathing drift as the pillars rise, in toward the compression, a held push in the silence, the slam's punch out, home
      const zp = t < UT.p1 ? lerp(1, 0.86, sstep(0, UT.p1, t)) : t < UT.p3 ? lerp(0.86, 0.8, sstep(UT.p1, UT.p3, t)) + 0.015 * Math.sin((t - UT.p1) * 1.3) * sstep(UT.p1, UT.p1 + 0.8, t) * (1 - sstep(UT.p3 - 0.8, UT.p3, t)) : t < UT.slam ? lerp(0.8, 0.73, sstep(UT.p3, UT.slam, t)) - 0.02 * bump(t, UT.slam - 0.5, UT.slam - 0.3, UT.slam - 0.02, UT.slam) : t < UT.p6 ? lerp(0.73, 0.84, eout(cl((t - UT.slam) / 0.18))) + 0.04 * sstep(UT.slam + 0.18, UT.p6, t) : lerp(0.88, 1, sstep(UT.p6, UT.len, t));
      g.zoomP = zp; g.zoomT = t < UT.len - 0.05 ? 0.25 : 0;
      if (t < UT.p1 && Math.random() < dt * 10) X.shake(1.5 + t, 0.08);
      for (const p of J.pillars) if (cross(p.ts)) { X.shake(5, 0.2); if (p.i % 2 === 0) sfx('thud'); }
      if (cross(UT.p1)) sfx('whoosh'); if (cross(UT.p2)) sfx('hum');
      // the weight of heaven: monsters pressed down (slowed; the lesser drawn a little toward the centre)
      if (t > UT.p2 && t < UT.slam) for (const m of H.living()) { const d = Math.hypot(m.x - J.x, m.y - J.y); if (d > C.r + m.r) continue; m.sandT = Math.max(m.sandT || 0, 0.3); held.add(m); J.pressed.add(m);
        if (!m.boss && !m.still && d > 1) X.moveEnt(m, (J.x - m.x) / d * 0.5 * dt, (J.y - m.y) / d * 0.5 * dt); if (Math.random() < dt * 3) m.hitSq = 1; }
      if (t > UT.p3 && t < UT.slam - 0.4 && Math.random() < dt * 8) X.shake(2 + (t - UT.p3) * 2, 0.08);
      if (cross(UT.slam)) { J.hit1 = true; let n = 0;
        for (const m of H.living()) { const d = Math.hypot(m.x - J.x, m.y - J.y); if (d > C.r + m.r) continue; const core = d < C.core + m.r; H.hit(m, P * (C.k1 + (core ? C.kc : 0)), { el: 'earth', noCrit: true }); knock(m, J.x, J.y, core ? 6 : 4); n++; }
        X.flash(0.35, '#FFF0C8'); X.shake(26, 0.8); sfx('crash'); X.light(J.x, J.y, 10, 1.0); g.hitStop = Math.max(g.hitStop || 0, 0.08); J.n1 = n; }
      if (cross(UT.pulse2)) { J.hit2 = true; let n = 0;
        for (const m of H.living()) { const d = Math.hypot(m.x - J.x, m.y - J.y); if (d > C.r * 1.15 + m.r) continue; H.hit(m, P * C.k2, { el: 'earth', noCrit: true }); m.belT = g.t + (m.boss ? C.weakBoss : C.weak); m.sandT = Math.max(m.sandT || 0, m.boss ? C.slowBoss : C.slow); n++; }
        X.flash(0.3, '#FFE9A8'); X.shake(22, 0.7); sfx('crash'); X.after(0.15, () => sfx('fanfare')); X.light(J.x, J.y, 12, 1.0); J.n2 = n;
        X.after(0.6, () => X.text(me.x, me.y + 0.9, 'DOMINION', COL.pale, 15, { crit: true, life: 1.2 })); }
      if (t >= UT.len) endUL(true);
    }
    function endUL(done) { if (!UL) return; const a = UL.a; UL.pressed.clear(); if (g.cineT > 0 && UL.t < UT.pulse2 + 0.3) g.cineT = 0; g.zoomP = 1; g.zoomT = 0; a.judg = false; a.hold = false;
      if (done) { a.st = 'leave'; a.lv = 0.8; a.alpha = 0; a.waved = true; for (let i = 0; i < Math.round(14 * LQ()); i++) X.part({ kind: 'star', x: a.x + (Math.random() - 0.5) * 2.5, y: a.y - Math.random() * 3, vx: (Math.random() - 0.5), vy: -1.8, life: 1.0, max: 1.0, size: 3, color: i % 2 ? COL.gold : COL.pale }); }
      UL = null; }
    /* ---- the loop (every frame, from 20g's update) ---- */
    function update(dt, dtReal) {
      const L = list();
      for (const a of L) { const ab = stOf(a); a.feet = true;
        if (a.st === 'enter' && a.en >= 0) { if (ab.en < 0) ab.en = 0; ab.en += dtReal; a.dropZ = 0; a.scale = 1; a.alpha = 1; }
        if (a.st === 'awaken') a.hold = true;
        if (a.st !== 'fight' && ab.act) interrupt(a);
        poseOf(a, dtReal); idleSteps(a); released = false; }
      if (UL) { if (!L.includes(UL.a)) endUL(false); else stepUL(dtReal); }
      if (bar) { bar.t += dt; if (bar.hit) { bar.hit[0] += dt / 0.6; if (bar.hit[0] >= 1) bar.hit = null; } if (bar.k >= 3) me.push = null; if (!L.includes(bar.a)) bar = null; }
      for (const a of L) if (a.bl) a.bl.hurt *= Math.exp(-dt / 2.5);
      for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.t += f.cine ? dtReal : dt;
        if (f.kind === 'chip' || f.kind === 'shard') { const tt = Math.max(0, dt); f.x += f.vx * tt; f.y += f.vy * tt; f.vz -= 14 * tt; f.z += f.vz * tt; if (f.z < 0) { f.z = 0; f.vz *= -0.25; f.vx *= 0.5; f.vy *= 0.5; } }
        else if (f.kind === 'rock' && f.t > f.rise + f.hold && !f.done) { const ft = f.t - f.rise - f.hold, z = f.h * (1 - ein(ft / 0.22)); if (z <= 0) { f.done = true; f.land = f.t; if (f.dmg) area(f.x, f.y, 1.0 + f.s, f.dmg, { stun: 0.3 }); FX.push({ kind: 'dust', x: f.x, y: f.y, R: 1.0, t: 0, life: 0.6, seed: f.seed }); FX.push({ kind: 'crack', x: f.x, y: f.y, R: 0.9, t: 0, life: 1.0, seed: f.seed, heat: 0.8 }); debris(f.x, f.y, 3, 0.8); X.shake(3, 0.08); f.life = f.t + 0.35; } }
        if (f.kind === 'cring' && f.m && f.m.dead) f.life = Math.min(f.life, f.t + 0.3);
        if (f.t >= f.life) FX.splice(i, 1); }
      for (const m of held) if (m.dead || !(m.sandT > 0)) held.delete(m);
      if (!L.length && !UL) { if (wardOff && !bar) { wardOff(); wardOff = null; } if (!released && !FX.length) { released = true; const G = GLB(); if (G) G.release(); } }
      if (me.dead) for (const a of L) interrupt(a);
    }
    function stop() { for (const a of S.list) if (a.id === 'taurus') { interrupt(a); a.hold = false; a.judg = false; } if (UL) endUL(false); bar = null; if (wardOff) { wardOff(); wardOff = null; }
      for (const m of held) { if (m.sandT > 0) m.sandT = 0; } held.clear(); FX.length = 0; if (g.zoomP !== 1) { g.zoomP = 1; g.zoomT = 0; } const G = GLB(); if (G) G.release(); released = true; }
    const outK = m => (m && m.belT > g.t ? (m.boss ? CFG.ult.weakKBoss : CFG.ult.weakK) : 1);
    /* ---- the entrance: the Taurus sigil on the ground, rings overhead, pillars briefly rising, the world shaking; it assembles from its armour (the hooves first, the horns last) ---- */
    function descent(a) { const ab = stOf(a); ab.en = 0; a.feet = true; a.dropZ = 0; a.scale = 1;
      FX.push({ kind: 'sigil', x: a.x, y: a.y, R: 3.4, t: 0, life: 3.4, cine: 1 }); FX.push({ kind: 'arings', a, x: a.x, y: a.y, t: 0, life: 2.6, cine: 1 }); FX.push({ kind: 'epill', x: a.x, y: a.y, t: 0, life: 2.0, cine: 1, seed: Math.random() * 50 });
      for (let i = 0; i < 6; i++) X.after(i * 0.18, () => X.shake(3 + i, 0.15)); X.light(a.x, a.y, 4, 1); sfx('hum'); }
    function entrance(a) { FX.push({ kind: 'wave', x: a.x, y: a.y, R: 4.6, t: 0, life: 0.9, seed: 1, big: 1 }); FX.push({ kind: 'dust', x: a.x, y: a.y, R: 3.4, t: 0, life: 1.2, seed: 2 }); debris(a.x, a.y, 10, 1.4); X.shake(14, 0.6); X.light(a.x, a.y, 5, 0.6); g.zoomP = 0.95; g.zoomT = 0.9; }

    /* ================= drawing ================= */
    const sx = x => X.sx(x), sy = y => X.sy(y);
    function pts(a) { const o = a.blOut && a.blOut.r; if (o) return o; const Tz = T(), x = sx(a.x), y = sy(a.y), s = Tz * 3.1; return { core: [x + s * 0.2, y - s * 0.38], coreR: s * 0.07, eyes: [[x + s * 0.3, y - s * 0.5]], head: [x + s * 0.3, y - s * 0.5], mouth: [x + s * 0.35, y - s * 0.42], back: [x, y - s * 0.7], top: [x, y - s], hornRings: [], hornTips: [], feet: [], monos: [], unit: s / 15, bb: [x - s * 0.6, y - s, x + s * 0.6, y], ground: [x, y], coreVis: 1 }; }
    const ring192 = (Q, X0, Y0, R, sy2, a, sp, str) => Q.quad(192, X0, Y0, R, 0, 0, R * sy2, COL.gold, a, 0.8, sp, str);
    function drawGround(c) {
      const L = list(); if (!FX.length && !UL && !L.length) return;
      const on = gpu(), Tz = T();
      if (!on) { for (const f of FX) if (f.kind === 'wave' || f.kind === 'cfield') { const u = f.t / f.life; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * (1 - u); c.translate(sx(f.x), sy(f.y)); c.scale(1, FSY); c.strokeStyle = COL.gold; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, f.R * Tz * (f.kind === 'wave' ? eout(u) : 1 - (g.t * 0.5 % 1)), 0, TAU); c.stroke(); c.restore(); } return; }
      const Q = fgOpen(c), parts = [];
      // its contact shadows: the body, each foot
      for (const a of L) { const r = a.blOut && a.blOut.r, al = a.alpha == null ? 1 : a.alpha; if (!r || !(al > 0.02)) continue; Q.sshadow(r.ground[0], r.ground[1], Tz * 1.5, Tz * 1.5 * 0.42, 0.42 * al, '#120A05'); for (const p of r.feet) Q.sshadow(p[0], p[1], Tz * 0.42, Tz * 0.2, 0.5 * al, '#0C0804'); }
      for (const f of FX) {
        const X0 = f.x != null ? sx(f.x) : 0, Y0 = f.y != null ? sy(f.y) : 0, u = f.t / f.life, R = (f.R || 1) * Tz;
        if (f.kind === 'crack') { const fr = cl(f.t / 0.25) * 1.03, fade = (1 - sstep(0.6, 1, u)) * (f.a || 1); Q.quad(89, X0, Y0, R, 0, 0, R * FSY, '#000000', 0.85 * fade, fr, f.seed, 0.25); Q.quad(88, X0, Y0, R, 0, 0, R * FSY, COL.amber, 0.7 * fade, fr, f.seed + 3, 0.75 * (f.heat || 1) * (1 - 0.7 * u)); }
        else if (f.kind === 'crater') { const fade = 1 - sstep(0.7, 1, u); Q.quad(89, X0, Y0, R, 0, 0, R * FSY, '#000000', 0.95 * fade, 1.03, f.seed, 0.9); Q.quad(88, X0, Y0, R, 0, 0, R * FSY, COL.amber, fade, 1.03, f.seed + 5, 1.3 * (1 - 0.7 * u)); }
        else if (f.kind === 'dust') { const r = R * (0.35 + 0.65 * eout(u)); Q.quad(90, X0, Y0, r * 1.3, 0, 0, r * 1.3 * FSY, COL.dust, (1 - u) * 0.85, 0.3, f.seed, u); }
        else if (f.kind === 'wave') { const fr = eout(u) * 0.95, al = (f.a || 1) * (1 - u * 0.6); Q.quad(196, X0, Y0, R, 0, 0, R * FSY, COL.gold, al, fr, f.seed, (f.big ? 1.4 : 1) * (1 - u)); }
        else if (f.kind === 'field') { const k2 = f.rev ? 1 - u : u; Q.quad(194, X0, Y0, R * (f.rev ? 0.6 + 0.4 * eout(u) : 1), 0, 0, R * (f.rev ? 0.6 + 0.4 * eout(u) : 1) * FSY, COL.gold, Math.sin(Math.PI * u), k2, 0, 1); }
        else if (f.kind === 'well') { if (!f.h) Q.quad(195, X0, Y0, R, 0, 0, R * FSY, COL.gold, Math.sin(Math.PI * u), 0.35, 2, 1); }
        else if (f.kind === 'sigil') { const dr = sstep(0, 1.1, f.t) + sstep(1.6, 2.2, f.t) * 0.4, fade = 1 - sstep(f.life - 0.7, f.life, f.t); Q.quad(193, X0, Y0, R, 0, 0, R * FSY, COL.gold, fade, dr, f.t * 0.2, 1); Q.glow(X0, Y0, R * 1.2, COL.amber, 0.25 * fade, FSY); }
        else if (f.kind === 'cfield') { const op = eout(f.t / 0.5), fade = 1 - sstep(f.life - 0.6, f.life, f.t), A = f.A, act = sstep(0.35, 0.9, f.t); Q.quad(194, X0, Y0, R, 0, 0, R * FSY, act > 0.5 ? COL.gold : COL.amber, (0.5 + 0.3 * act) * fade * op, 0.2 + 0.8 * act * cl(f.t / (f.life - 0.6)), 0, 0.7 + 0.4 * act); ring192(Q, X0, Y0, R * 1.05, FSY, 0.7 * fade * op, 0.4 + 0.8 * act, 1);
          Q.quad(202, X0, Y0, R * 1.25, 0, 0, R * 1.25 * FSY, COL.gold, (0.35 + 0.35 * act) * fade * op, 0.84 - 0.04 * Math.sin(f.t * 2.2), (f.x * 7) % 40, 0.8);   // v430 BP: the space round it bending; dim amber while it charges, bright once it presses
          if (A && A.k >= 3 && A.pulseT > -1) { const pu = cl((A.t - A.pulseT) / 0.5); if (pu < 1) Q.quad(196, X0, Y0, R, 0, 0, R * FSY, COL.pale, 1 - pu, eout(pu) * 0.9, 3, 1 - pu); } }
        else if (f.kind === 'cring' && f.m && !f.m.dead) { const m = f.m, fade = sstep(0, 0.3, f.t) * (1 - sstep(f.life - 0.4, f.life, f.t)); ring192(Q, sx(m.x), sy(m.y), Tz * (0.9 + 0.15 * Math.sin(f.t * 3)), FSY, 0.8 * fade, 1.2, 1); Q.glow(sx(m.x), sy(m.y), Tz * 1.1, COL.amber, 0.25 * fade, FSY); }
        else if (f.kind === 'dome') { const a = f.a, fade = sstep(0, 0.6, f.t) * (1 - sstep(f.life - 0.6, f.life, f.t)), Rd = (bar && bar.a === a ? bar.R : 3) * Tz; ring192(Q, sx(a.x), sy(a.y), Rd, FSY, 0.8 * fade, 0.6, 1); Q.glow(sx(a.x), sy(a.y), Rd * 1.1, COL.amber, 0.2 * fade, FSY); }
        else if (f.kind === 'epill') { /* (drawn with the parts below) */ }
        /* v430 BP: a footfall (the plinth's ring pressed into the floor, a skirt of dust; a charge's footfalls add their cracks), a gravitational lens
           (space bent round a ring: gathering inward for the charge's wind-up, else thrown out), a seismic upheaval (slabs heaving at the front),
           the carapace's foundation (the sigil drawn on under it, its rays) */
        else if (f.kind === 'foot') { const fade = 1 - sstep(0.45, 1, u), rr = R * (0.45 + 0.6 * eout(u)), sm = f.small ? 0.6 : 1;
          Q.quad(90, X0, Y0, rr * 1.3, 0, 0, rr * 1.3 * FSY, COL.dust, (1 - u) * (f.big ? 0.95 : 0.7) * sm, 0.32, f.seed, u);
          if (u < 0.4) { const k2 = 1 - u / 0.4; Q.quad(192, X0, Y0, R * 0.62, 0, 0, R * 0.62 * FSY, COL.gold, 0.55 * k2 * sm, 0.78, 0, 0.9 * k2); Q.glow(X0, Y0, R * 0.7, COL.amber, 0.25 * k2 * sm, FSY); } }
        else if (f.kind === 'lens') { const a0 = f.a && f.a.x != null ? f.a : null, Xc = a0 ? sx(a0.x) : X0, Yc = a0 ? sy(a0.y) : Y0, k2 = f.inward ? 0.9 - 0.65 * ein(u) : 0.12 + 0.86 * eout(u), al = f.inward ? sstep(0, 0.25, u) * (1 - sstep(0.85, 1, u)) : (1 - u) * (1 - u);
          Q.quad(202, Xc, Yc, R, 0, 0, R * FSY, f.inward ? COL.amber : COL.gold, al * (f.inward ? 0.9 : 1), k2, f.seed, f.inward ? 0.8 + 0.6 * u : 1.2); }
        else if (f.kind === 'quake') { const fr = eout(u) * 0.92, al = (f.a || 1) * (1 - sstep(0.55, 1, u)); Q.quad(205, X0, Y0, R, 0, 0, R * FSY, COL.amber, al, fr, f.seed, 1.15 * (1 - 0.5 * u)); Q.quad(90, X0, Y0, R * fr * 1.15, 0, 0, R * fr * 1.15 * FSY, COL.dust, 0.55 * (1 - u) * (f.a || 1), 0.25, f.seed + 9, u); }
        else if (f.kind === 'bow') { const a0 = f.a, A = f.A, fade = sstep(0, 0.12, f.t) * (1 - sstep(f.life - 0.25, f.life, f.t)), adx = A ? (A.dx != null ? A.dx : A.ux) : null, ady = A ? (A.dy != null ? A.dy : A.uy) : null; if (adx != null) { const sv = (wx, wy) => [sx(a0.x + wx) - sx(a0.x), sy(a0.y + wy) - sy(a0.y)], d = sv(adx * 2.4, ady * 2.4), n = sv(-ady * 2.0, adx * 2.0);
            Q.quad(203, sx(a0.x + adx * 1.3), sy(a0.y + ady * 1.3), d[0], d[1], n[0], n[1], COL.amber, 0.6 * fade, cl(a0.bl ? a0.bl.mv : a0.mv != null ? a0.mv : 1), 5, 0.9); } }   // v430 BP: the pressure wave pushed along the floor ahead of it
        else if (f.kind === 'csig') { const a0 = f.a, Xc = sx(a0.x), Yc = sy(a0.y), dr = sstep(0, 0.6, f.t), fade = 1 - sstep(f.life - 0.6, f.life, f.t), RR = Tz * (bar && bar.a === a0 ? bar.R : 3) * 1.05;
          Q.quad(193, Xc, Yc, RR, 0, 0, RR * FSY, COL.gold, 0.75 * fade, dr * (1 + 0.2 * sstep(0.5, 0.8, f.t)), f.t * 0.12, 0.8 + 0.4 * (1 - sstep(0.5, 1.2, f.t))); Q.glow(Xc, Yc, RR * 1.1, COL.amber, 0.18 * fade, FSY); }
      }
      if (UL) groundU(Q, ulScene({ x: UL.x, y: UL.y, bx: UL.a.x, by: UL.a.y, t: UL.t, seed: UL.seed, k: UL.k, pillars: UL.pillars }), parts, -1);
      for (const f of FX) if (f.kind === 'epill') epillParts(f, parts, -1);
      fgClose(c);
      if (parts.length && glOn()) { c.save(); c.globalCompositeOperation = 'source-over'; GLB().drawParts(c, parts); c.restore(); }
    }
    // the entrance's pillars: four small World Pillars breaking out round it and sinking again
    function epillParts(f, parts, side) { const Tz = T(), h = sstep(0, 0.5, f.t) * (1 - sstep(1.3, 2.0, f.t)); if (h < 0.02) return;
      for (let i = 0; i < 4; i++) { const an = i / 4 * TAU + 0.6, x = f.x + Math.cos(an) * 2.8, y = f.y + Math.sin(an) * 2.2; if ((sy(y) > sy(f.y) ? 1 : -1) !== side) continue; parts.push({ m: 'pillar', X: sx(x), Y: sy(y), s: Tz * 0.32, h, t: f.t, gl: 0.6, g2: 0.6, yaw: an }); } }
    function drawFx(c) {
      const Tz = T(), on = gpu();
      if (!on) { if (UL) drawULsky(c); if (FX.length || bar) drawFx2d(c); return; }
      if (!UL && !FX.length && !bar) return;
      // v430 BP: one painter batch for the ultimate's sky and the effects (was two: a whole layer's composite saved every frame)
      let Q0 = UL ? ulSkyOpen(c) : null; if (!FX.length && !bar) { if (Q0) fgClose(c); return; }
      const Q = Q0 || fgOpen(c), parts = [];
      for (const f of FX) {
        const u = f.t / f.life;
        if (f.kind === 'shard') { const fade = 1 - sstep(0.7, 1, u), X1 = sx(f.x), Y1 = sy(f.y) - f.z * Tz; parts.push({ m: 'frag', X: X1, Y: Y1, z: sy(f.y), s: f.s * Tz, yaw: f.rot + f.t * 5, tilt: f.t * 3 + f.seed, a: fade, gl: 0.5 + 0.5 * (1 - u), g2: 0.8 }); if (f.t < 0.5) Q.glow(X1, Y1, f.s * Tz * 2.2, COL.amber, 0.3 * (1 - f.t / 0.5)); }   // v430 BP
        else if (f.kind === 'bow') { const a0 = f.a, A = f.A, p = pts(a0), fade = sstep(0, 0.12, f.t) * (1 - sstep(f.life - 0.25, f.life, f.t)), adx = A ? (A.dx != null ? A.dx : A.ux) : null, ady = A ? (A.dy != null ? A.dy : A.uy) : null; if (adx != null && p.head) { const sv = (wx, wy) => [sx(a0.x + wx) - sx(a0.x), sy(a0.y + wy) - sy(a0.y)], d = sv(adx, ady), dl = Math.hypot(d[0], d[1]) || 1, ux = d[0] / dl, uy = d[1] / dl, L = Tz * 2.4, Wd = Tz * 2.0, hx = p.head[0] + ux * Tz * 0.9, hy = p.head[1] + uy * Tz * 0.9 + Tz * 0.2;
            Q.quad(203, hx - ux * L * 0.35, hy - uy * L * 0.35, ux * L, uy * L, -uy * Wd, ux * Wd, COL.amber, 0.42 * fade, cl(a0.bl ? a0.bl.mv : a0.mv != null ? a0.mv : 1), 3, 1); Q.glow(hx, hy, Tz * 1.1, COL.pale, 0.25 * fade); } }   // v430 BP: the pressure bow ahead of the horns
        else if (f.kind === 'burst') { const X1 = sx(f.x), Y1 = sy(f.y), k2 = Math.sin(Math.PI * cl(u * 1.25)), hh = Tz * (2.6 + 3.2 * eout(u)); Q.quad(198, X1, Y1 - hh, Tz * f.R, 0, 0, hh, COL.gold, k2 * (1 - u * 0.6), 0.28, f.seed, 3); Q.glow(X1, Y1 - Tz * 0.6, Tz * f.R * 2.2, COL.pale, 0.45 * (1 - u)); }   // v430 BP: a shaft of force from the impact
        else if (f.kind === 'pulse') { const p = pts(f.a), x1 = sx(f.x), y1 = sy(f.y), x0 = p.core ? p.core[0] : x1, y0 = Math.min(p.core ? p.core[1] : y1, y1 - Tz) - Tz * 1.2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, W = Tz * 1.1;
          Q.quad(204, (x0 + x1) / 2, (y0 + y1) / 2, -dy / L * W, dx / L * W, dx / 2, dy / 2, COL.gold, Math.sin(Math.PI * cl(u * 1.1)) * 0.9, 0.34, f.seed, eout(u)); }   // v430 BP: a compression pulse driven from the core down to the stomp
        else if (f.kind === 'ccharge') { const p = pts(f.a), fade = sstep(0, 0.2, f.t) * (1 - sstep(f.life - 0.25, f.life, f.t)), g0 = eout(cl(f.t / 0.6)), U2 = p.unit; if (p.head) { for (let i = 0; i < 2; i++) ring192(Q, p.head[0], p.head[1] - U2 * (2.6 + i * 2.0) * g0, U2 * (3.2 + i * 1.6) * (0.4 + 0.6 * g0), 0.32, 0.85 * fade, (i ? -1 : 1) * (1.5 + 2 * g0), 1);
            for (const h of p.hornTips) { Q.star(h[0], h[1], U2 * 2.4 * g0, 0.55 * fade, COL.pale); Q.glow(h[0], h[1], U2 * 2.2, COL.amber, 0.35 * fade); } Q.quad(199, p.head[0], p.head[1] - U2 * 3, U2 * 6, 0, 0, U2 * 4, COL.gold, 0.7 * fade, f.t / f.life, 7, 0.8); } }   // v430 BP: the crown's charge over its brow
        else if (f.kind === 'chip') { const x = sx(f.x), y = sy(f.y) - f.z * Tz, s = f.s * Tz, fade = 1 - sstep(0.75, 1, u); Q.quad(80, x, y, s, 0, 0, s, COL.stone, fade, f.rot + f.t * 6, f.seed, 1); }
        else if (f.kind === 'rock' && f.t > 0) { const z = f.done ? 0 : f.t < f.rise ? -f.s + (f.h + f.s) * eout(f.t / f.rise) : f.t < f.rise + f.hold ? f.h + 0.05 * Math.sin(f.t * 20) - f.h * 0.3 * bump(g.t - stompT, 0, 0.05, 0.12, 0.45) /* v430 BP: each stomp jolts them down */ : f.h * (1 - ein((f.t - f.rise - f.hold) / 0.22)), fade = f.done ? 1 - cl((f.t - f.land) / 0.35) : 1;
          if (!f.done) { Q.sshadow(sx(f.x), sy(f.y), f.s * Tz * 1.2, f.s * Tz * 0.5, 0.4 * fade, '#0C0804'); Q.glow(sx(f.x), sy(f.y) - z * Tz, f.s * Tz * 2, COL.amber, 0.2 * fade); }
          parts.push({ m: 'rock', X: sx(f.x), Y: sy(f.y) - z * Tz, z: sy(f.y), s: f.s * Tz, yaw: f.yaw + f.t * 2, tilt: f.tilt + f.t, a: fade, gl: 0.3, g2: 0.6, dis: f.done ? cl((f.t - f.land) / 0.35) : 0 }); }
        else if (f.kind === 'srings') { const p = pts(f.a), fade = sstep(0, 0.3, f.t) * (1 - sstep(f.life - 0.3, f.life, f.t)); if (p.bast || p.back) { const b = p.back || p.top; for (let i = 0; i < 2; i++) ring192(Q, b[0], b[1] + p.unit * (2 + i * 1.6), p.unit * (5.5 + i * 1.2), 0.45, 0.9 * fade, (i ? -1 : 1) * 2.4, 1); } }
        else if (f.kind === 'well' && f.h) { const X0 = sx(f.x), Y0 = sy(f.y) - f.h * Tz, R = f.R * Tz, fade = Math.sin(Math.PI * cl(u)); Q.quad(195, X0, Y0, R, 0, 0, R * 0.8, COL.gold, fade, 0.35, 3, f.big ? 1.3 : 1); Q.glow(X0, Y0, R * 0.6, COL.white, 0.35 * fade * (1 - u)); }
        else if (f.kind === 'cring' && f.m && !f.m.dead) {   // v430 BP: the rings leave its horns and arc to the monster; three gyroscopic rings tilting on their own axes, descending one after another; pulses driven down onto it; debris spiralling in
          const m = f.m, A = f.A, fly = f.src && f.src.bl ? 0.5 : 0, fu = fly ? eout(cl(f.t / fly)) : 1, fade = sstep(0, 0.2, f.t) * (1 - sstep(f.life - 0.4, f.life, f.t)), prog = cl((f.t - fly) / Math.max(0.5, f.life - 0.4 - fly)),
            pl = A && A.pulseT > -1 ? Math.max(0, 1 - Math.abs(A.t - A.pulseT) / 0.25) : 0, tk = A && A.tk != null && !(A.k >= 3) ? 1 - cl(A.tk / CFG.crown.tick) : -1, nr = lowFx() ? 1 : 3, mx = sx(m.x), my = sy(m.y), sp = f.src ? pts(f.src) : null;
          for (let j = 0; j < nr; j++) { const dsc = sstep(j * 0.12, 0.85 + j * 0.05, prog), h = (1.9 - j * 0.5) * (1 - 0.72 * dsc) * (1 - 0.45 * pl) + 0.18 + 0.06 * Math.sin(f.t * 2.4 + j);
            let X0 = mx, Y0 = my - h * Tz; if (fu < 1 && sp) { const o0 = sp.hornRings[j % Math.max(1, sp.hornRings.length)] || sp.head; X0 = lerp(o0[0], X0, fu); Y0 = lerp(o0[1], Y0, fu) - Math.sin(Math.PI * fu) * Tz * 2.2; }
            parts.push({ m: 'gring', X: X0, Y: Y0, z: my + 1, s: Tz * (0.55 + 0.2 * j) * (1 - 0.15 * dsc) * (0.5 + 0.5 * fu), yaw: f.t * (j % 2 ? -1.6 : 1.3) * (1 + pl * 2) + f.seed, tilt: (0.22 + 0.1 * j) * Math.sin(f.t * (1.1 + 0.3 * j) + j * 2.1 + f.seed) * (1 - 0.6 * dsc), a: fade, gl: 0.6 + pl + 0.3 * dsc, g2: 1 + pl, kind: j });
            ring192(Q, X0, Y0, Tz * (0.62 + 0.2 * j) * (0.5 + 0.5 * fu), FSY, 0.5 * fade, 1.5 + 2 * pl, 1); }
          const pk = Math.max(pl, tk >= 0 ? Math.max(0, 1 - tk / 0.35) * 0.5 : 0); if (fu >= 1 && pk > 0.02) { const top = my - Tz * 2.3, hh = (my - top) / 2; Q.quad(204, mx, top + hh, Tz * 1.0, 0, 0, hh, COL.gold, pk * fade, 0.38, f.seed, pl > 0 ? 1 - pl : tk / 0.35); }
          if (!lowFx()) for (let j = 0; j < 5; j++) { const sp2 = 1.2 + 0.25 * j, an = f.seed + j * 1.26 + f.t * sp2 * (1 + 2 * pl), d = Tz * (0.95 - 0.35 * prog) * (0.8 + 0.2 * Math.sin(j * 1.7)), hgt = Tz * ((0.55 + 0.45 * Math.sin(f.t * 1.6 + j)) * (1 - 0.6 * prog) * (1 - 0.7 * pl) + 0.1), ss = Tz * (0.08 + 0.03 * (j % 2)); Q.quad(80, mx + Math.cos(an) * d, my + Math.sin(an) * d * FSY - hgt, ss, 0, 0, ss, COL.stone, fade, f.t * 3 + j, (f.seed | 0) + j, 1); } }
        else if (f.kind === 'dome') {   // v430 BP: the shell rises from its foundation; three layers (gilded masonry, the rune lattice, the amber inner); the energy it takes drawn into the core; architecture floating in it
          const a = f.a, rise = eout(cl(f.t / 0.55)), fade = sstep(0, 0.25, f.t) * (1 - sstep(f.life - 0.6, f.life, f.t)), Rd = (bar && bar.a === a ? bar.R : 3) * Tz, X0 = sx(a.x), Yg = sy(a.y), Y0 = Yg - Rd * 0.25 * rise, ry2 = Rd * 0.82 * (0.25 + 0.75 * rise), hc = bar && bar.hit ? Math.floor(Math.min(9, bar.hit[0] * 10) + 1) + ((bar.hit[1] / TAU) % 1 + 1) % 1 : 0, chg = bar && bar.a === a ? cl(bar.store / Math.max(1, ST().hp) * 2) : 0, hit = bar && bar.hit ? 1 - bar.hit[0] : 0;
          Q.quad(197, X0, Y0, Rd, 0, 0, ry2, COL.gold, 0.55 * fade, 0, g.t * 0.2, hc); if (!lowFx()) Q.quad(206, X0, Y0, Rd * 0.94, 0, 0, ry2 * 0.94, COL.amber, 0.5 * fade * rise, chg, -g.t * 0.12, hc); Q.quad(197, X0, Y0, Rd * 0.88, 0, 0, ry2 * 0.88, COL.amber, 0.35 * fade, 1, -g.t * 0.3, 0);
          const p = pts(a); if (p.core) for (let i = 0; i < 3; i++) { const an = -Math.PI / 2 + (i - 1) * 0.9 + 0.2 * Math.sin(g.t * 0.7 + i), ex = X0 + Math.cos(an) * Rd * 0.9, ey = Y0 + Math.sin(an) * ry2 * 0.9, dx = p.core[0] - ex, dy = p.core[1] - ey, L = Math.hypot(dx, dy) || 1; Q.quad(128, (ex + p.core[0]) / 2, (ey + p.core[1]) / 2, dx / 2, dy / 2, -dy / L * Tz * 0.12, dx / L * Tz * 0.12, COL.gold, (0.25 + 0.5 * chg + 0.5 * hit) * fade * rise, 6 + 8 * chg, i); }
          const nf = lowFx() ? 2 : 4; for (let i = 0; i < nf; i++) { const an = g.t * 0.35 + i / nf * TAU; parts.push({ m: 'mono', X: X0 + Math.cos(an) * Rd * 1.02, Y: Y0 - ry2 * 0.35 + Math.sin(an) * ry2 * 0.3 - Tz * 0.4 * Math.sin(g.t * 0.9 + i), z: Yg + Math.sin(an) * Rd * 0.5, s: Tz * 0.2 * rise, yaw: an + Math.PI / 2, tilt: 0.15 * Math.sin(g.t + i), a: fade * rise, gl: 0.5 + chg, g2: 0.5 }); }
          if (Math.hypot(me.x - a.x, me.y - a.y) < (bar ? bar.R : 3) * 1.6 + 0.5) { const pr = Tz * 0.9; Q.quad(197, sx(me.x), sy(me.y) - Tz * 0.45, pr, 0, 0, pr, COL.pale, 0.45 * fade, 0, g.t * 0.4, hc); } }
        else if (f.kind === 'arings') { const fade = sstep(0, 0.4, f.t) * (1 - sstep(f.life - 0.6, f.life, f.t)), X0 = sx(f.x), Y0 = sy(f.y); for (let i = 0; i < 3; i++) { const h = Tz * (3.2 + i * 0.9 - 1.6 * sstep(0.6, 2.2, f.t)); ring192(Q, X0, Y0 - h, Tz * (2.4 - i * 0.5), 0.35, 0.8 * fade, (i % 2 ? -1 : 1) * 1.8, 1); } }
        else if (f.kind === 'epill') epillParts(f, parts, 1);
      }
      fgClose(c);
      if (parts.length && glOn()) { c.save(); c.globalCompositeOperation = 'source-over'; GLB().drawParts(c, parts); c.restore(); }
    }
    function drawFx2d(c) { const Tz = T(); for (const f of FX) if (f.kind === 'cring' && f.m && !f.m.dead && Math.random() < 0.3) X.part({ kind: 'star', x: f.m.x + (Math.random() - 0.5), y: f.m.y - Math.random() * 1.2, vx: 0, vy: 1.2, life: 0.4, max: 0.4, size: 2.5, color: COL.gold });
      if (bar) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.strokeStyle = COL.gold; c.lineWidth = 2; c.beginPath(); c.ellipse(sx(bar.a.x), sy(bar.a.y) - Tz * 0.5, bar.R * Tz, bar.R * Tz * 0.8, 0, 0, TAU); c.stroke(); c.restore(); } }

    /* ---- the ultimate's picture (pure: drawDominion draws it for the Anima and could for a boss; nothing here touches the game) ---- */
    function ulScene(o) {
      const t = Math.max(0, o.t || 0), Tz = T(), X0 = sx(o.x), Y0 = sy(o.y), BX = sx(o.bx == null ? o.x : o.bx), BY = sy(o.by == null ? o.y : o.by);
      const p1 = sstep(0, UT.p1, t), p2 = sstep(UT.p1, UT.p2, t), p3 = sstep(UT.p2, UT.p3, t), p4 = sstep(UT.p3, UT.slam - 0.15, t), p5 = sstep(UT.slam, UT.p6, t), p6 = sstep(UT.p6, UT.len, t);
      const s1 = t >= UT.slam ? cl((t - UT.slam) / 1.2) : -1, s2 = t >= UT.pulse2 ? cl((t - UT.pulse2) / 1.4) : -1, sil = bump(t, UT.slam - 0.45, UT.slam - 0.3, UT.slam - 0.05, UT.slam);
      return { o, t, Tz, X0, Y0, BX, BY, p1, p2, p3, p4, p5, p6, s1, s2, sil, al: o.alpha == null ? 1 : o.alpha, seed: o.seed || 0, k: o.k || 3, pillars: o.pillars || pillarsOf({ x: o.x, y: o.y, k: o.k || 3, seed: o.seed || 0 }), R: CFG.ult.r * Tz };
    }
    // a pillar's state at t: its rise, drums lifting (the weight of heaven), collapsing inward (compression), breaking into light (dominion)
    function pillarPart(S, p) {
      const { t, Tz, X0, Y0 } = S, e0 = sstep(p.ts, p.ts + 0.6, t), h = e0 + 0.05 * bump(t, p.ts + 0.38, p.ts + 0.56, p.ts + 0.62, p.ts + 0.95) /* v430 BP: it breaks out with momentum and settles */, col = S.o && S.o.stand ? 0 : ein(S.p4) /* v429 TB: o.stand keeps them standing where they rose (the boss's shelters) */, dis = sstep(UT.slam - 0.05, UT.slam + 0.9, t), X1 = sx(p.x), Y1 = sy(p.y), cx = lerp(X1, X0, col * 0.7), cy = lerp(Y1, Y0, col * 0.7);
      const q = p._pp || (p._pp = { m: 'pillar', drums: [{}, {}, {}, {}, {}] }), drums = q.drums, shud = e0 > 0 && e0 < 1 ? Math.sin(t * 47 + p.i * 3) * Tz * 0.04 * (1 - e0) : 0; for (let i = 0; i < 5; i++) { const lf = S.p3 * (i >= 2 ? (i - 1) * 0.35 : 0) * (1 - col) + col * (i >= 1 ? i * 0.12 : 0); Object.assign(drums[i], { lift: Tz * lf * (0.8 + 0.2 * Math.sin(t * 1.3 + i + p.i)), rot: (1 - e0) * (i % 2 ? 0.9 : -0.9) * (0.3 + 0.15 * i) /* v430 BP: the drums turning into place as it rises */ + S.p3 * 0.3 * Math.sin(i * 1.7 + p.i) + col * 0.4 * (i % 2 ? 1 : -1), tip: col * 0.25 * (i % 2 ? 1 : -1), gl: 0.4 * S.p3 + col, dis: dis * sstep(0, 0.6, 1 - i * 0.15) }); }
      return Object.assign(q, { m: 'pillar', X: cx + shud, Y: cy, z: Y1, s: Tz * 0.48, h, t, gl: 0.3 + 0.5 * S.p2 + 0.8 * S.p4, g2: 0.6 + S.p3 + 2 * S.p4, yaw: p.an, lean: (X1 < X0 ? 1 : -1) * col * 0.6, drums, dis: Math.min(1, dis * 1.05), a: S.al }); /* v430 BP: pooled per pillar (no allocation a frame) */
    }
    function groundU(Q, S, parts, side) {
      const { t, Tz, X0, Y0, BX, BY, p1, p2, p3, p4, p5, p6, al } = S;
      // 1 the Taurus sigil under it; the ground trembles
      const sg = sstep(0, 1.2, t) * (1 - p6); if (sg > 0.01) { Q.quad(193, BX, BY, Tz * 3.6, 0, 0, Tz * 3.6 * FSY, COL.gold, sg * al, sstep(0, 1.2, t) + p4 * 0.5, t * 0.15, 1 + p4 * 0.6); Q.glow(BX, BY, Tz * 4, COL.amber, 0.25 * sg * al, FSY); }
      // 2 runic circles where the pillars rise
      for (const p of S.pillars) { const r0 = sstep(p.ts - 0.4, p.ts, t) * (1 - S.p4 * 0.6) * (1 - p6); if (r0 > 0.01) ring192(Q, sx(p.x), sy(p.y), Tz * 1.3, FSY, r0 * al, 1.2, 1); if (t > p.ts && t < p.ts + 0.9) { const u = (t - p.ts) / 0.9; Q.quad(90, sx(p.x), sy(p.y), Tz * 1.8 * eout(u) * 1.3, 0, 0, Tz * 1.8 * eout(u) * 1.3 * FSY, COL.dust, (1 - u) * 0.9 * al, 0.3, p.i * 3, u); Q.quad(89, sx(p.x), sy(p.y), Tz * 1.5, 0, 0, Tz * 1.5 * FSY, '#000000', 0.8 * al * (1 - p6), 1.03, p.i * 5, 0.5); } }
      // 3 concentric gravity fields expanding round it; 4 compressing to the centre
      if (p3 > 0.01 && t < UT.slam + 0.1) { const k2 = p3 * (1 - sstep(UT.slam - 0.05, UT.slam + 0.1, t)); Q.quad(194, X0, Y0, S.R * (0.55 + 0.45 * p3) * (1 - 0.5 * p4), 0, 0, S.R * (0.55 + 0.45 * p3) * (1 - 0.5 * p4) * FSY, COL.gold, 0.7 * k2 * al, 0.3 + 0.7 * p4, 0, 1); for (let i = 0; i < 3; i++) { const rr = S.R * (0.3 + 0.25 * i) * (1 - 0.7 * ein(p4)) * (0.6 + 0.4 * p3); ring192(Q, X0, Y0, rr, FSY, 0.7 * k2 * al, (i % 2 ? -1 : 1) * (0.6 + 2.5 * p4), 1); } }
      // 5 the slam and the second pulse: shockwaves across the floor, the network of glowing cracks, dust rolling out
      for (const [s, big] of [[S.s1, 1], [S.s2, 1.35]]) if (s >= 0 && s < 1) { const RR = S.R * 1.1 * big; Q.quad(196, X0, Y0, RR, 0, 0, RR * FSY, COL.gold, al * (1 - s * 0.5), eout(s) * 0.95, big * 7, 1.4 * (1 - s)); Q.quad(90, X0, Y0, RR * eout(s) * 1.1, 0, 0, RR * eout(s) * 1.1 * FSY, COL.dust, (1 - s) * 0.9 * al, 0.32, big * 5, s); }
      if (S.s1 >= 0) { const fr = sstep(UT.slam, UT.slam + 0.5, t) * 1.03, fade = 1 - p6 * 0.9; Q.quad(89, X0, Y0, S.R, 0, 0, S.R * FSY, '#000000', 0.9 * fade * al, fr, S.seed % 50, 0.6); Q.quad(88, X0, Y0, S.R, 0, 0, S.R * FSY, COL.amber, fade * al, fr, (S.seed % 50) + 3, 1.3 * (1 - 0.6 * p5) + (S.s2 >= 0 && S.s2 < 0.4 ? 0.8 : 0)); }
      // v430 BP: each pillar's emergence heaves the ground round it; the compression's lens closing in; the slam's layered shockwaves (the
      // upheaval of the floor's slabs, space bent outward, a late third ring under the two pulses)
      for (const p of S.pillars) { const u = (t - p.ts) / 0.8; if (u > 0 && u < 1) Q.quad(205, sx(p.x), sy(p.y), Tz * 2.0, 0, 0, Tz * 2.0 * FSY, COL.amber, (1 - u) * al, eout(u) * 0.9, p.i * 13 + 1, 1); }
      if (p4 > 0.01 && t < UT.slam) Q.quad(202, X0, Y0, S.R * 1.05, 0, 0, S.R * 1.05 * FSY, COL.gold, p4 * 0.8 * al, 0.9 - 0.75 * ein(p4), S.seed % 40, 0.8 + p4);
      if (S.s1 >= 0 && S.s1 < 1) { const u = S.s1; Q.quad(205, X0, Y0, S.R * 1.05, 0, 0, S.R * 1.05 * FSY, COL.amber, (1 - sstep(0.6, 1, u)) * al, eout(u) * 0.92, S.seed % 40 + 2, 1.3 * (1 - 0.5 * u)); Q.quad(202, X0, Y0, S.R * 1.3, 0, 0, S.R * 1.3 * FSY, COL.pale, (1 - u) * (1 - u) * al, 0.1 + 0.88 * eout(cl(u * 1.6)), S.seed % 40 + 5, 1.4); }
      { const u3 = t >= UT.slam + 0.28 ? cl((t - UT.slam - 0.28) / 1.0) : -1; if (u3 >= 0 && u3 < 1) Q.quad(196, X0, Y0, S.R * 0.8, 0, 0, S.R * 0.8 * FSY, COL.amber, al * (1 - u3), eout(u3) * 0.95, S.seed % 40 + 11, 0.9 * (1 - u3)); }
      if (p6 > 0.01) { const u = p6; Q.quad(199, X0, Y0 - Tz, S.R * 0.6, 0, 0, S.R * 0.45, COL.gold, Math.sin(Math.PI * u) * al, u, S.seed, 0.8); }
      if (!S.o.noPillars) /* v429 TB: the boss draws them itself, depth-sorted */ for (const p of S.pillars) if ((sy(p.y) > Y0 ? 1 : -1) === side && t > p.ts - 0.05) parts.push(pillarPart(S, p));
      void p1; void p2;
    }
    function skyU(Q, S, r) {
      const { t, Tz, X0, Y0, BX, BY, p1, p3, p4, p5, p6, al, sil } = S, cx = r && r.core ? r.core[0] : BX, cy = r && r.core ? r.core[1] : BY - Tz * 1.2, lq = lowFx();
      // 1 suspended stones rising slowly, dust hanging in the air
      const nR = Math.round(18 * (lq ? 0.5 : 1));
      for (let i = 0; i < nR; i++) { const an = i / nR * TAU + S.seed, d0 = Tz * (2.2 + 4.5 * ((i * 0.618) % 1)), rise = sstep(0.2 + i * 0.03, 1.6, t), into = ein(p3 * 0.6 + p4), out = S.s1 >= 0 ? eout(S.s1) : 0, fall = p6;
        if (rise < 0.01) continue; const sa = an + t * 0.25 * p3 + into * 1.8 /* v430 BP: spiralling in as they are drawn */; let x = BX + Math.cos(sa) * d0 * (1 - into * 0.85), y = BY + Math.sin(sa) * d0 * FSY * (1 - into * 0.85) - Tz * (0.6 + 1.8 * rise * (1 - fall) + 1.2 * into);
        if (out > 0) { x += Math.cos(an) * Tz * 7 * out; y += Math.sin(an) * Tz * 3 * out - Tz * 2 * Math.sin(Math.PI * out); }
        const fade = (1 - (S.s1 >= 0 ? sstep(0.6, 1, S.s1) : 0)) * (1 - sil * 0.3); Q.quad(80, x, y, Tz * (0.14 + 0.08 * (i % 3)), 0, 0, Tz * (0.14 + 0.08 * (i % 3)), COL.stone, fade * al, t * (1 + i % 3) + i, (S.seed | 0) + i, 1 + 0.9 * (0.4 * p3 + p4) * 0.5); }
      if (!lq) Q.quad(199, BX, BY - Tz * 2.5, Tz * 5, 0, 0, Tz * 3.5, COL.pale, 0.6 * p1 * (1 - p4) * al, 0.2, S.seed, 0.5);
      // 3 rings unfolding round the core, filaments of gold drawing the stones in, the gravity well at the reactor
      if (p3 > 0.01 && t < UT.slam + 0.2) { const k2 = p3 * (1 - sstep(UT.slam, UT.slam + 0.2, t)); for (let i = 0; i < 3; i++) { const rr = Tz * (1.4 + 0.8 * i) * (1 - 0.6 * p4); ring192(Q, cx, cy, rr, 0.55 + 0.15 * i, 0.85 * k2 * al, (i % 2 ? -1 : 1) * (1 + 4 * p4), 1); }
        Q.quad(195, cx, cy, Tz * 3.2 * (1 - 0.4 * p4), 0, 0, Tz * 2.6 * (1 - 0.4 * p4), COL.gold, 0.8 * k2 * al, 0.35, 2 + 4 * p4, 1);
        for (const p of S.pillars) { const px = sx(p.x), py = sy(p.y) - Tz * 2.2, dx = cx - px, dy = cy - py, L2 = Math.hypot(dx, dy) || 1; Q.quad(128, (px + cx) / 2, (py + cy) / 2, dx / 2, dy / 2, -dy / L2 * Tz * 0.12, dx / L2 * Tz * 0.12, COL.gold, 0.6 * k2 * al, 9, p.i); } }
      // 4 golden rings compressing on the centre; the silence; the slam's white-gold peak
      if (p4 > 0.01 && t < UT.slam + 0.05) for (let i = 0; i < 4; i++) { const v = ((t - UT.p3) * (0.8 + 2.2 * p4) + i / 4) % 1, rr = S.R * 0.9 * (1 - v); ring192(Q, X0, Y0 - Tz * 0.5, rr, 0.5, p4 * Math.sin(v * Math.PI) * al * (1 - sil * 0.7), 3, 1); }
      if (p4 > 0.01 && t < UT.slam) for (let i = 0; i < 3; i++) { const v = ((t - UT.p3) * (0.9 + 2.0 * p4) + i / 3) % 1, ox = (i - 1) * Tz * 1.6, hh = Tz * 3.6; Q.quad(204, X0 + ox, Y0 - hh, Tz * 1.5, 0, 0, hh, COL.gold, p4 * 0.55 * Math.sin(Math.PI * v) * (1 - sil * 0.7) * al, 0.3, i * 7 + 1, v); }   // v430 BP: pulses of weight driven down onto the centre
      if (sil > 0.01) { Q.star(cx, cy, Tz * (0.8 + 1.4 * sil), 0.7 * sil * al, COL.white); Q.glow(cx, cy, Tz * 2.4, COL.white, 0.3 * sil * al); }
      for (const [s, big] of [[S.s1, 1], [S.s2, 1.3]]) if (s >= 0 && s < 1) { const pk = 1 - sstep(0, 0.35, s); Q.glow(X0, Y0 - Tz, Tz * 6 * big, COL.white, 0.35 * pk * al); Q.glow(X0, Y0 - Tz, Tz * 3 * big, COL.pale, 0.45 * pk * al); for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + S.seed + big, L2 = S.R * (0.3 + 0.8 * eout(s)); Q.rbeam(X0, Y0 - Tz, X0 + Math.cos(an) * L2, Y0 - Tz + Math.sin(an) * L2 * 0.6, Tz * (0.4 - 0.25 * s), COL.gold, (1 - s) * 0.35 * al, 1, 0); } }
      // 5 the towering column of gravity above it
      const colk = bump(t, UT.pulse2 - 0.1, UT.pulse2 + 0.15, UT.p6, UT.p6 + 0.9); if (colk > 0.01) { const hh = Tz * 9; Q.quad(198, BX, BY - Tz * 1.5 - hh, Tz * 1.6, 0, 0, hh, COL.gold, colk * al, 0.28, S.seed, 2.5); Q.glow(BX, BY - Tz * 1.5, Tz * 3, COL.pale, 0.4 * colk * al); }
      // 6 the pillars and the monoliths breaking into gold dust; the stones settling
      if (S.s1 >= 0) for (const p of S.pillars) { const u = cl((t - UT.slam) / 1.6); if (u < 1) Q.quad(199, sx(p.x), sy(p.y) - Tz * 1.8, Tz * 1.8, 0, 0, Tz * 2.4, COL.gold, Math.sin(Math.PI * u) * al, u, p.i * 7, 1); }
      if (p5 > 0.01) Q.quad(199, BX, BY - Tz * 3, Tz * 4.5, 0, 0, Tz * 4, COL.gold, Math.sin(Math.PI * cl(p5 * 0.8 + p6 * 0.5)) * al, p6, S.seed + 3, 0.9);
    }
    // the whole picture: o (all optional but x, y, t): x, y the centre (tiles), bx, by Belial's floor point, t (s since it began), seed, k
    // (the form: the pillars' count), pillars (a list from pillarsOf, else made from seed), alpha, groundOnly, skyOnly, r (Belial's screen points)
    // without the GPU painter (no WebGL): the same beats drawn plainly on the canvas: the sigil, the pillars rising and leaning in,
    // the compression ring, the light column at the slam and the two shockwaves, all soft-edged
    function dominion2d(c, S) {
      const { t, Tz, X0, Y0, BX, BY, p3, p4, p6, al } = S, ring = (x, y, r, a, w, col) => { if (a <= 0.01 || r <= 1) return; c.globalAlpha = a * al; c.strokeStyle = col || COL.gold; for (const [k, ww] of [[0.35, 3], [1, 1]]) { c.globalAlpha = a * al * k; c.lineWidth = w * ww; c.beginPath(); c.ellipse(x, y, r, r * FSY, 0, 0, TAU); c.stroke(); } };
      c.save(); c.globalCompositeOperation = 'lighter';
      ring(BX, BY, Tz * 3.6, sstep(0, 1.2, t) * (1 - p6) * 0.6, 2);
      if (p3 > 0.01 && t < UT.slam + 0.1) ring(X0, Y0, S.R * (0.55 + 0.45 * p3) * (1 - 0.5 * p4), p3 * 0.5, 3);
      for (const [sv, big] of [[S.s1, 1], [S.s2, 1.35]]) if (sv >= 0 && sv < 1) ring(X0, Y0, S.R * 1.1 * big * eout(sv), (1 - sv) * 0.8, 4, COL.pale);
      const col = bump(t, UT.slam - 0.3, UT.slam, UT.slam + 0.25, UT.slam + 1.1); if (col > 0.01) { const w = Tz * 1.1, g = c.createLinearGradient(X0 - w, 0, X0 + w, 0); g.addColorStop(0, 'rgba(255,194,77,0)'); g.addColorStop(0.5, 'rgba(255,240,200,.9)'); g.addColorStop(1, 'rgba(255,194,77,0)'); c.globalAlpha = col * al * 0.8; c.fillStyle = g; c.fillRect(X0 - w, Y0 - Tz * 14, w * 2, Tz * 14); }
      c.globalCompositeOperation = 'source-over';
      const ps = (S.o.noPillars ? [] : S.pillars) /* v429 TB */.map(p => pillarPart(S, p)).filter(q => q.h > 0.02 && q.dis < 0.98).sort((a, b) => a.z - b.z);
      for (const q of ps) { const w = q.s * 0.85, H = q.s * 7.5 * q.h, a = al * (1 - q.dis); c.save(); c.globalAlpha = a; c.translate(q.X, q.Y); c.rotate(q.lean * 0.35);
        const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#9A8A70'); g.addColorStop(0.45, '#F2E8D2'); g.addColorStop(1, '#8A7A60'); c.fillStyle = g; c.fillRect(-w * 0.8, -H, w * 1.6, H);
        c.fillStyle = '#E8B850'; c.fillRect(-w, -H - q.s * 0.35, w * 2, q.s * 0.35); c.fillRect(-w * 1.05, -q.s * 0.3, w * 2.1, q.s * 0.3);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * Math.min(1, q.gl * 0.5); c.fillStyle = COL.amber; for (let i = 1; i < 4; i++) c.fillRect(-w * 0.8, -H * i / 4, w * 1.6, Math.max(1, q.s * 0.06)); c.restore(); }
      c.restore();
    }
    function drawDominion(c, o) {
      o = o || {}; const S = ulScene(o), on = gpu(); if (S.al <= 0.004) return S; if (!on) { if (!o.groundOnly) dominion2d(c, S); return S; }
      if (!o.skyOnly) { const Q = fgOpen(c), parts = []; groundU(Q, S, parts, -1); fgClose(c); if (parts.length && glOn()) { c.save(); c.globalCompositeOperation = 'source-over'; GLB().drawParts(c, parts); c.restore(); } }
      if (o.groundOnly) return S;
      const parts = []; if (!o.noPillars) /* v429 TB */ for (const p of S.pillars) if (sy(p.y) > S.Y0 && t9(S, p)) parts.push(pillarPart(S, p));
      if (parts.length && glOn()) { c.save(); c.globalCompositeOperation = 'source-over'; GLB().drawParts(c, parts); c.restore(); }
      const Q = fgOpen(c); skyU(Q, S, o.r || null); fgClose(c);
      return S;
    }
    const t9 = (S, p) => S.t > p.ts - 0.05;
    // v430 BP: the ultimate's sky for drawFx: its front pillars (one GPU pass), then a painter batch with the sky drawn into it, left open for the effects
    function ulSkyOpen(c) { const J = UL, r = J.a.blOut && J.a.blOut.r, S = ulScene({ x: J.x, y: J.y, bx: J.a.x, by: J.a.y, t: J.t, seed: J.seed, k: J.k, pillars: J.pillars }); if (S.al <= 0.004) return null;
      const parts = []; for (const p of S.pillars) if (sy(p.y) > S.Y0 && t9(S, p)) parts.push(pillarPart(S, p)); if (parts.length && glOn()) { c.save(); c.globalCompositeOperation = 'source-over'; GLB().drawParts(c, parts); c.restore(); }
      const Q = fgOpen(c); skyU(Q, S, r || null); return Q; }
    function drawULsky(c) { const J = UL; drawDominion(c, { x: J.x, y: J.y, bx: J.a.x, by: J.a.y, t: J.t, seed: J.seed, k: J.k, pillars: J.pillars, skyOnly: true, r: J.a.blOut && J.a.blOut.r }); }
    /* the light over the body (after it is drawn): the Core of Dominion's (FGFX 201: a dense heart, a limb, a ring of bent light, a
       controlled bloom; brighter as it charges or compresses; hidden as it faces away), the eyes, the maw when the jaw drops, the
       horn rings' glow and golden filaments from them to the core, the citadel's windows. r: its screen points, P its pose */
    function bodyLight(c, r, P, al, at) {
      if (!r) return; const Q = fgOpen(c), u = r.unit, cv = r.coreVis == null ? 1 : r.coreVis, core = Math.min(4, P.core || 0.85), ch = cl((core - 0.9) / 2), pl = 0.5 + 0.5 * Math.sin((at || 0) * (1.6 + ch * 3)), R = Math.max(4, r.coreR * (3 + 1.4 * ch));
      if (cv > 0.02) { Q.glow(r.core[0], r.core[1], R * 1.4, COL.amber, (0.12 + 0.18 * ch) * al * cv); Q.quad(201, r.core[0], r.core[1], R, 0, 0, R, '#FFB347', al * cv, r.coreR / R, pl, Math.min(1.2, 0.5 + 0.35 * ch + 0.2 * cl(P.glow || 0))); }
      for (const e of r.eyes) { Q.glow(e[0], e[1], u * 1.2, COL.amber, 0.45 * al * (P.eye || 1)); Q.star(e[0], e[1], u * (0.5 + 0.3 * (P.eye || 1)), 0.45 * al, COL.pale); }
      if ((P.jaw || 0) > 0.15) Q.glow(r.mouth[0], r.mouth[1], u * 2.4, COL.amber, 0.5 * al * cl(P.jaw));
      const hn = cl(P.horn || 0), rg = cl(((P.ringK || 1) - 1) / 4);
      const mc = cl(P.mech || 0); for (const h of r.hornRings) Q.glow(h[0], h[1], u * 2.2, COL.gold, (0.12 + 0.25 * hn + 0.15 * rg + 0.15 * mc) * al);
      if (mc > 0.05) for (const h of r.hornTips) { const fl = 0.5 + 0.5 * Math.sin((at || 0) * 13 + h[0]); Q.star(h[0], h[1], u * (0.9 + 1.4 * mc * fl), 0.4 * mc * al, COL.pale); Q.glow(h[0], h[1], u * 1.6, COL.amber, 0.3 * mc * al); }   // v430 BP: the horn engines working: their tips sparking
      if (hn > 0.3 || (P.k || 1) >= 3) { const fk = Math.max(hn, (P.k || 1) >= 3 ? 0.35 : 0) * al; for (let i = 0; i < r.hornRings.length; i += 2) { const h = r.hornRings[i], dx = r.core[0] - h[0], dy = r.core[1] - h[1], L = Math.hypot(dx, dy) || 1; Q.quad(128, (h[0] + r.core[0]) / 2, (h[1] + r.core[1]) / 2, dx / 2, dy / 2, -dy / L * u * 0.35, dx / L * u * 0.35, COL.gold, 0.5 * fk * cv, 7 + 6 * hn, i); } }
      if ((P.cit || 0) > 0.05 || (P.citUp || 0) > 0.05) Q.glow(r.back[0], r.back[1], u * 6, COL.amber, 0.22 * al * Math.max(P.cit || 0, P.citUp || 0));
      fgClose(c);
    }
    function drawBodyFx(c, a) { if (!gpu() || !a.blOut || !a.blOut.r) return; bodyLight(c, a.blOut.r, a.blP || {}, a.alpha == null ? 1 : a.alpha, a.at || 0); }
    /* screen-space: the world darkens for the ultimate (its own light kept), a little for the summoning */
    function drawCine(c, W, Hh) {
      let dim = 0, cx = W / 2, cy = Hh * 0.45, r0 = Math.min(W, Hh) * 0.2;
      if (UL) { const t = UL.t, a = UL.a, r = a.blOut && a.blOut.r; dim = 0.42 * sstep(0, 1.2, t) * (1 - sstep(UT.p6, UT.len, t)) + 0.25 * bump(t, UT.slam - 0.5, UT.slam - 0.3, UT.slam - 0.02, UT.slam) - 0.25 * bump(t, UT.slam, UT.slam + 0.05, UT.slam + 0.2, UT.slam + 0.6); if (r) { cx = r.core[0]; cy = r.core[1]; r0 = T() * 4; } }
      for (const a of list()) if (a.st === 'enter' && a.bl) dim = Math.max(dim, 0.28 * (1 - sstep(1.2, 2.2, Math.max(0, a.bl.en))));
      if (dim > 0.005) { c.save(); c.globalCompositeOperation = 'source-over'; const gr = c.createRadialGradient(cx, cy, r0, cx, cy, Math.max(W, Hh) * 0.75); gr.addColorStop(0, `rgba(10,6,2,${dim * 0.1})`); gr.addColorStop(0.4, `rgba(8,5,2,${dim * 0.7})`); gr.addColorStop(1, `rgba(4,2,1,${Math.min(0.9, dim * 1.2)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
    }
    // (a power on demand, aimed as the mind would aim it: for showcases and tests)
    function cast(a, kind) { stOf(a); if (a.bl.act) endAct(a); const c = crowd(a.x, a.y, 9, 2.5), m = H.near(a.x, a.y, 9).slice(-1)[0];
      if (kind === 'rush') { if (!m) return false; start(a, 'rush', { m }); } else if (kind === 'crown') { if (!c) return false; start(a, 'crown', { x: c.x, y: c.y }); } else if (kind === 'stamp') start(a, 'stamp', c ? { x: c.x, y: c.y } : null); else start(a, kind); return true; }
    /* v429 TB: (pure, for the boss) the risen World Pillars' parts at the scene o (as drawDominion's: x, y, bx, by, t, seed, k, pillars,
       stand), each with its pillar's index i: for BELIAL_GL.drawParts, drawn in the boss's own depth order */
    function domParts(o) { const S2 = ulScene(o || {}); return S2.pillars.filter(p => t9(S2, p)).map(p => Object.assign(pillarPart(S2, p), { i: p.i })); }
    return { tick, fin, cast, choose, update, stop, outK, descent, entrance, drawGround, drawFx, drawBodyFx, drawCine, drawDominion, bodyLight, pillarsOf, CFG, domParts /* v429 TB */,
      get barrier() { return bar; }, get ul() { return UL; }, get fx() { return FX; }, get held() { return held; }, get wardOn() { return !!wardOff; } };
  }
  return { create, CFG, UT, BIG, poseFor, easePose, ultPose };
})();
if (typeof self !== 'undefined') self.BELIAL_MOVES = BELIAL_MOVES;
