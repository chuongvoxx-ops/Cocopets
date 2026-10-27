/* ---------- THE SELENARCH, THE WEIGHING ENGINE ----------
   The Hollow Moon's second boss, fought in the Balance Hall deep in the Hollow Shafts: a broad floor of pale moonstone
   plates some thirty metres across, laid in rings like an orrery's dial, its north edge falling away into the indigo
   void of the moon's hollow, boulders drifting at its rim where the pull is weak. Two great plate-circles are set in
   the floor, one under the reach of each pan.
   The Selenarch hangs over the north edge: a colossal balance of silver and moonstone. A faceted moonstone keel and a
   silver column hold up its hub, where a single pale lens-eye looks out through an iris of moonstone blades and
   follows the pet; a long beam pivots across the hub, a gold pointer over it reading a dial, and from the beam's ends
   two great silver pans hang on chains. Three armillary rings of moonstone turn round the hub, runes glowing along them.
   The Tilt: it tips the beam; the whole hall's pull leans to the low side (big soft arrows, drifting dust) and drags
   the pet that way for a few seconds while the low edge grinds: walk against it. (From a third of its health the tilt
   swings both ways.)
   Pan Drop: a pan swings out on its chains and slams a shown circle (a heavy blow), leaving a shock ring for a moment.
   Twice, one pan after the other, from half health.
   Ring Sweep: its outer armillary ring drops and rolls out across the hall along a shown arc: stand in its glowing gap
   or dodge through it. Twice from half health.
   Counterweight (its stagger): it tilts and moonstone weights fall from the low pan. Carry one onto the HIGH plate
   (gold): it rises into that pan and the beam swings the other way; carry the next onto the plate that is now high and
   the balance levels and JAMS: the engine sags, its iris opens and the lens is bared (a weak point, two and a half
   times the blow). Too slow and the scales tip back: it swings a pan at you.
   Gravity Inversion (from half health): the hall's pull flips toward the engine, loose rocks and the rim's boulders
   rise... and the rocks rain back down on shown circles; then its pans spill a short wave of crater wisps and
   mooncalves.
   The Scales Run Wild (from a third): everything faster, the tilt swinging both ways.
   It is never still: the rings turn and precess, the beam rocks on its pivot, the pans sway on their chains, the lens
   tracks and the iris breathes; it jolts on a hit, and it comes down out of the hollow on entering. */
RiftFiend.define({ id: 'selenarch', hpK: 1.25, dmgK: 1.25, name: 'The Selenarch', title: 'The Weighing Engine', color: '#D9DEE8', glow: '#A9C8F0', accent: '#E2EEFF', biome: 'shafts', r: 3.0, els: ['earth', 'light'], phases: 3, cuts: [1, 0.5, 0.3] }, (() => {
  const { TAU, TN, hit } = RiftFiend;
  const { MOONSTONE, MOON_HI, INDIGO, GOLD, GOLD_HI } = MOON;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const hr = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const FX0 = DunFiend.KIT, mixC = FX0.mixC, rgba = FX0.rgba;
  const LINE = '#161A34', SIL = '#D9DEE8', SIL_SH = '#98A0BC', SIL_HI = '#FFFFFF', SIL_DK = '#5E6486', MS = MOONSTONE, MS_SH = '#6F8DC8', MS_HI = MOON_HI, MS_DK = '#3C4C8C', GOLD_SH = '#A6812C';
  const HOSTILE = '#FF4D6D', SAFE = '#8FFFE0', PULLC = '#D8E6FF';
  // the hall: a disc ARENA round its centre, cut off along a chord at the north where it falls into the void; the engine
  // hangs over that edge (its ground point MY north of the centre)
  const ARENA = 14.5, CHORD = -7.2, MY = -5.3, ALT = 1.0, HUBZ = 3.75, L = 5.0, CHAIN = 2.3, PAN_R = 1.35, PLATE_R = 2.4, EDGE = 8.6, PULL = 2.7, SINE = 0.42, COSE = 0.91, PICK_R = 1.3, BEAM_DY = -0.3;
  const PLATES = [[-6.3, -1.4], [6.3, -1.4]];
  // the armillary rings: radius, half-width, and the axis each turns about (rocking slowly, always turned well toward the
  // camera, so a ring rings the hub and never cuts edge-on across the lens)
  const RINGS = [{ r: 2.2, w: 0.17, n: bt => [0.22 * Math.sin(bt * 0.31), 1, 0.3 + 0.12 * Math.sin(bt * 0.23)] }, { r: 2.65, w: 0.19, n: bt => [0.16 * Math.sin(bt * 0.27 + 1), 0.48, 1] }, { r: 3.05, w: 0.21, n: bt => [0.85 * Math.sin(bt * 0.11 + 1.2), 0.55, 0.5 + 0.2 * Math.cos(bt * 0.17)] }];
  // the rim's floating boulders and the two gravity rings flanking the engine, in the void round the floor
  const RIM = [[-15.6, 2.5, 1.2], [15.9, 0.8, 1.35], [-13.6, 9.6, 1.0], [13.4, 9.8, 1.15], [-6.4, 15.8, 0.95], [7.4, 15.6, 1.1], [-15.2, -4.6, 0.9], [15.4, -5.2, 1.0], [0.6, 16.4, 0.8]];
  const GRAV = [[-11.6, -9.2], [11.6, -9.2]];
  const onFloor = (C, x, y, pad) => Math.hypot(x - C.x, y - C.y) < ARENA - (pad || 0) && y - C.y > CHORD + (pad || 0);
  const clampFloor = (C, p, pad) => { pad = pad || 0; p.y = Math.max(p.y, C.y + CHORD + pad); const dx = p.x - C.x, dy = p.y - C.y, d = Math.hypot(dx, dy), R = ARENA - pad; if (d > R) { p.x = C.x + dx / d * R; p.y = C.y + dy / d * R; } return p; };
  const plateAt = (C, i) => [C.x + PLATES[i][0], C.y + PLATES[i][1]];
  const fastK = FX => (1 + (FX.S.lv - 1) * 0.12) * FX.S.fast;
  const highOf = s => s > 0 ? 0 : 1;   // the low side s (1 east, -1 west): the plate on the other side is high
  return {
    arenaR: ARENA, firstAct: 'hover', artY: 0.9,
    artPoses: [{ name: 'weighing, the rings turning', mem: { alt: 1.0 } }, { name: 'tilted east', mem: { alt: 1.0, tilt: 0.3, menace: 1 } }, { name: 'jammed: sagging, the lens bared', mem: { alt: 1.0, sag: 1, shut: 0 } }],
    phaseNames: ['The Balance Hall', 'Gravity Inversion', 'The Scales Run Wild'],
    start(C) { return { x: C.x + 0.5, y: C.y + 9.5 }; },
    props: C => RIM.map((q, i) => ({ kind: 'boulder', i, x: C.x + q[0], y: C.y + q[1], s: q[2] })).concat(GRAV.map((q, i) => ({ kind: 'gravring', i, x: C.x + q[0], y: C.y + q[1] }))),
    // (north of the chord is the void)
    carve(set, C) { const RR = Math.ceil(C.R) + 2; for (let y = -RR; y <= RR; y++) for (let x = -RR; x <= RR; x++) { const wx = Math.floor(C.x) + x, wy = Math.floor(C.y) + y; if (wy + 0.5 - C.y < CHORD) set(wx, wy, T_SOLID); } },
    paintGround(c, A) { paintHall(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, t, cam, T); },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.spin || m.dead) return null; if (m.act === 'enter') return { x: m.x, y: m.y - 2.5, k: 0.55 }; const x = m.x, y = m.y - 4.2, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.5, 6 / d) }; },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.x = C.x; m.y = C.y + MY; m.noTouch = true;
      Object.assign(M, { bt: 0, alt: 12, wake: 0, tilt: 0, tiltV: 0, tiltW: 0, recoil: 0, roar: 0, menace: 0, sag: 0, jam: 0, shut: 1, irisT: 2.5, iris: 0, spin: [0, 0, 0], spinK: 0.2, ringOut: 0, look: [0, 0.6],
        pull: [0, 0], pullW: [0, 0], arrow: { ux: 1, uy: 0, k: 0, kW: 0, warn: false }, flip: 0, flipW: 0, lift: 0, liftW: 0,
        panFx: [null, null], panW: [0, 0], weights: [], carry: null, cw: null, tl: null, pd: null, sw: null, inv: null, rocks: [], rubble: [], spill: [], seen: {}, bag: null, last: null, queue: null, restT: 1, wasStun: false, wasEnter: true, roared: false, hintT: 0, dustT: 0 }); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; endAll(FX); m.act = 'hover'; m.actT = 0; M.roar = 1; M.recoil = 1; M.menace = 1;
      FX.H.shake(12, 0.6); FX.H.flash(0.25, MS_HI); FX.H.sfx.crash(); FX.H.sfx.hum(); FX.H.ring(m.x, m.y, 0.5, 10, 1, MS_HI, 0.45); sparkle(FX, m.x, m.y - 4, 24, MS_HI);
      if (lv === 2) M.queue = 'invert';
      if (lv >= 3) { FX.H.banner('THE SCALES RUN WILD', 'Everything comes faster · the tilt swings both ways', MS_HI, 2.8, true); M.queue = 'tilt'; } },
    ai(FX, m, dt) {
      const M = FX.mem, P = FX.S.lv, f = fastK(FX); m.actT += dt; m.noTouch = true;
      let menace = 0;
      switch (m.act) {
        case 'hover': hold(FX, m, M, dt); if (M.queue || m.actT > (P >= 2 ? 1.1 : 1.5) / f) { m.actT = 0; choose(FX, m); } break;
        case 'rest': hold(FX, m, M, dt); if (m.actT > M.restT) { m.act = 'hover'; m.actT = 0; } break;
        case 'tilt': runTilt(FX, m, M, dt); menace = 0.8; break;
        case 'pan': runPan(FX, m, M, dt); menace = 1; break;
        case 'sweep': runSweep(FX, m, M, dt); menace = 0.9; break;
        case 'weigh': runWeigh(FX, m, M, dt); menace = 0.35; break;
        case 'invert': runInvert(FX, m, M, dt); menace = 1; break;
        default: m.act = 'hover'; m.actT = 0;
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 2.2);
      FX.parts(bodyParts(FX, m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.sag = Math.min(1, M.sag + dt * 1.8); M.shut = toward(M.shut, 0, dt, 5); M.menace = decay(M.menace, dt, 4); m.noTouch = true; M.tiltW = 0;
      const p = pose(FX, m, M), q = p.g(0, 0.4, 0); FX.weak('lens', q[0], q[1], 1.7, 2.5, m.stunT > 0.05);
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.32; const a = Math.random() * TAU, s = p.g(Math.cos(a) * 1.2, 0.3, Math.sin(a) * 1.0); FX.H.part({ kind: 'spark', x: s[0], y: s[1], vx: Math.cos(a) * 3, vy: -2 - Math.random() * 2, g: 9, life: 0.5, max: 0.5, size: 2, color: Math.random() < 0.5 ? GOLD_HI : MS_HI }); FX.H.shake(1.2, 0.08); }
      FX.parts(bodyParts(FX, m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, me = FX.me; if (!m) return; M.bt += dt; const stun = m.stunT > 0, P = FX.S.lv;
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.4); if (!stun) { M.sag = decay(M.sag, dt, 0.9); M.shut = toward(M.shut, m.act === 'enter' ? 1 : 0.55 - (M.menace || 0) * 0.12, dt, 3); }
      // the beam on its pivot: a spring toward where it is weighed, so it overshoots and rocks
      const kS = stun ? 30 : 12, acc = (M.tiltW - M.tilt) * kS - M.tiltV * (stun ? 9 : 3.6); M.tiltV += acc * dt; M.tilt += M.tiltV * dt; M.tilt = clamp(M.tilt, -0.45, 0.45);
      // the rings turn (fast in the inversion, stopped dead when it is jammed); the ring thrown out regrows
      M.spinK = toward(M.spinK, stun ? 0 : m.act === 'invert' ? 2.2 : m.act === 'enter' ? 0.2 + (M.wake || 0) : 0.55 + (M.menace || 0) * 0.5, dt, stun ? 6 : 1.5);
      for (let k = 0; k < 3; k++) M.spin[k] += dt * M.spinK * (k === 1 ? -1.1 : 0.9 + k * 0.15);
      if (!M.sw) M.ringOut = decay(M.ringOut, dt, 0.8);
      M.flip = toward(M.flip, M.flipW, dt, 2.2); M.lift = toward(M.lift, M.liftW, dt, 1.2);
      // the hall's pull: it eases toward what the act wants, and drags the pet
      M.pull = [toward(M.pull[0], M.pullW[0], dt, 3.5), toward(M.pull[1], M.pullW[1], dt, 3.5)]; const pl = Math.hypot(M.pull[0], M.pull[1]);
      if (pl > 0.02 && !me.dead) { FX.push(M.pull[0] * dt, M.pull[1] * dt); if ((M.dustT -= dt) <= 0) { M.dustT = 0.05; dust(FX, M); } }
      M.arrow.k = toward(M.arrow.k, M.arrow.kW, dt, 4);
      // the lens follows the pet; the iris breathes and now and then snaps narrow
      M.look = [toward(M.look[0], clamp((me.x - m.x) / 7, -1, 1), dt, 4), toward(M.look[1], clamp((me.y - m.y) / 9, -0.3, 1), dt, 4)];
      M.irisT -= dt; if (M.irisT <= 0) { M.irisT = 2.2 + Math.random() * 3; M.iris = 1; } M.iris = decay(M.iris, dt, 3);
      updPans(FX, m, M, dt); updWeights(FX, m, M, dt);
      M.rocks = M.rocks.filter(r => (r.t += dt) < r.dur); M.rubble = M.rubble.filter(r => (r.t += dt) < 3.2); M.spill = M.spill.filter(s => (s.t += dt) < s.dur);
      if (!stun) { if (FX.S.weak.lens) FX.weak('lens', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.jam = 0; M.recoil = 1; M.roar = 0.6; FX.H.text(m.x, m.y - 7, 'The engine shakes itself free', MS_HI, 13); FX.H.sfx.hum();
          const p = pose(FX, m, M); [-1, 1].forEach((sd, i) => { if (M.panW[i]) { const q = panLocal(M, p, sd); const g0 = p.g(q[0], q[1], q[2]); crumble(FX, g0[0], g0[1], 12); } }); M.panW = [0, 0]; } } else M.wasStun = true;
      // the entrance: down out of the hollow, the rings spinning up, the iris opening
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.wake = clamp((e - 0.2) / 2.2, 0, 1); M.alt = lerp(12, ALT, 1 - Math.pow(1 - M.wake, 3));
        if (e > 2.0 && !M.roared) { M.roared = true; M.roar = 1; M.recoil = 0.6; FX.H.sfx.crash(); FX.H.sfx.hum(); FX.H.shake(9, 0.4); FX.H.ring(m.x, m.y, 0.3, 8, 1, MS_HI, 0.4); sparkle(FX, m.x, m.y - 3, 20, MS_HI); } }
      else { M.wake = toward(M.wake, 1, dt, 3); M.alt = toward(M.alt, ALT, dt, 2); if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; FX.H.sfx.whoosh(); } }
      if ((m.hitSq || 0) > 0.5) M.recoil = Math.max(M.recoil, 0.45);
      if (P < 2) M.liftW = 0; },
    dmgK() { return 1; },
    keep: { steps: 2, pad: 7 },
    draw(c, FX, m, X, Y, T, t, step) { drawEngine(c, FX, m, X, Y, T, t, step); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'boulder') drawBoulder(c, FX, p, X, Y, T, t); else if (p.kind === 'gravring') drawGravRing(c, FX, p, X, Y, T, t); },
    drawObj() {},
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    drawFx(c, FX, T, t) { if (!FX.mem || !FX.mem.spin) return; drawRocks(c, FX, T, t); drawPansFx(c, FX, T, t); drawWeightsFx(c, FX, T, t); drawSpill(c, FX, T, t); },
  };

  /* ---- choosing ---- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.4 : 1.2, true); }
  function toRest(m, M, t) { m.act = 'rest'; m.actT = 0; M.restT = t; }
  function brood(FX) { return FX.H.mons.filter(q => !q.dead && !q.boss && !q.fobj && (q.type === 'craterwisp' || q.type === 'mooncalf')).length; }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv; let a;
    if (M.queue) { a = M.queue; M.queue = null; }
    else {
      // (a shuffled round of its moves, so none is long missing; never the same twice running)
      if (!M.bag || !M.bag.length) { M.bag = (P >= 2 ? ['tilt', 'pan', 'sweep', 'weigh', 'invert', 'pan', 'tilt'] : ['tilt', 'pan', 'sweep', 'weigh', 'pan']).sort(() => Math.random() - 0.5); if (M.bag[M.bag.length - 1] === M.last) M.bag.unshift(M.bag.pop()); }
      a = M.bag.pop(); if (a === 'invert' && P < 2) a = 'pan'; }
    const go = { tilt: startTilt, pan: startPan, sweep: startSweep, weigh: startWeigh, invert: startInvert }[a]; if (!go) { m.act = 'hover'; m.actT = 0; return; } M.last = a; go(FX, m); }
  // between its moves it hangs over the north edge, edging a little after the pet, levelling its beam
  function hold(FX, m, M, dt) { const C = FX.C, me = FX.me, tx = C.x + clamp((me.x - C.x) * 0.1, -1.0, 1.0), dx = tx - m.x; m.x += clamp(dx, -0.6 * dt, 0.6 * dt); m.y = C.y + MY;
    M.tiltW = 0; M.pullW = [0, 0]; M.arrow.kW = 0; }
  function arrowSet(M, ux, uy, k, warn) { M.arrow.ux = ux; M.arrow.uy = uy; M.arrow.kW = k; M.arrow.warn = warn; }
  function endAll(FX, keepPans) { const M = FX.mem;
    if (M.tl) { if (M.tl.hz) M.tl.hz.life = Math.min(M.tl.hz.life, M.tl.hz.age); M.tl = null; }
    M.pd = null; M.sw = null; if (M.inv) { M.inv = null; } M.flipW = 0; M.liftW = 0; M.cw = null;
    M.weights.forEach(w => { if (w.st === 'fall' || w.st === 'ground' || w.st === 'carried') { w.st = 'gone'; crumble(FX, w.x, w.y, 8); } }); M.weights = M.weights.filter(w => w.st === 'rise' && keepPans); M.carry = null;
    M.pullW = [0, 0]; M.tiltW = 0; M.arrow.kW = 0; if (!keepPans) M.panW = [0, 0];
    M.panFx.forEach(F => { if (F && F.st === 'swing') { F.st = 'back'; F.t = 0; F.from = panFxPos(FX, FX.m, M, F); } }); }
  /* ---- little effects ---- */
  function sparkle(FX, x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 5; FX.H.part({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 2, g: 5, life: 0.4 + Math.random() * 0.4, max: 0.8, size: 2 + Math.random() * 1.5, color: i % 3 ? col : '#FFFFFF' }); } }
  function shards(FX, x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 5; FX.H.part({ kind: 'shard', x, y: y - 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 3.5, g: 11, life: 0.5 + Math.random() * 0.35, max: 0.85, size: 2.5 + Math.random() * 3, rot: Math.random() * 3, vr: 6, color: i % 3 ? '#B8C4EC' : '#E2EEFF' }); } }
  function crumble(FX, x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 1 + Math.random() * 2.5; FX.H.part({ kind: 'glow', x: x + Math.cos(a) * 0.3, y: y + Math.sin(a) * 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 1.2, life: 0.6 + Math.random() * 0.4, max: 1.0, size: 0.35 + Math.random() * 0.3, color: i % 2 ? MS_HI : MS }); } }
  // dust drifting with the pull, round the pet
  function dust(FX, M) { const me = FX.me, l = Math.hypot(M.pull[0], M.pull[1]) || 1; for (let i = 0; i < 2; i++) { const x = me.x + FX.rnd(-7, 7), y = me.y + FX.rnd(-8, 6); if (!onFloor(FX.C, x, y, 0.4)) continue;
      FX.H.part({ kind: 'dot', x, y, vx: M.pull[0] * 2.4 + FX.rnd(-0.3, 0.3), vy: M.pull[1] * 2.4 + FX.rnd(-0.3, 0.3), life: 1.0, max: 1.0, size: 1.6 + Math.random() * 1.6, color: Math.random() < 0.5 ? PULLC : '#B9C6EA' }); } }

  /* ---- The Tilt: the beam tips; the hall's pull leans to the low side, and its edge grinds ---- */
  function startTilt(FX, m) { const M = FX.mem, C = FX.C, P = FX.S.lv, f = fastK(FX), s = Math.random() < 0.5 ? 1 : -1;
    const T = M.tl = { s, t: 0, warn: 1.5 / f, live: P >= 3 ? 2.7 : 4.0, swing: P >= 3, swung: false, calm: true, calmT: 0, felt: false, sides: [s] };
    T.total = T.warn + T.live + (T.swing ? 0.9 + T.live : 0);
    T.hz = FX.hz({ shape: 'fn', kind: 'grind', test: (x, y) => !!M.tl && !M.tl.calm && onFloor(C, x, y, -0.8) && (x - C.x) * M.tl.s > EDGE, x: C.x, y: C.y, dps: m.dmg * 0.55, tick: 0.3, life: T.total + 0.6, draw: () => {} });
    m.act = 'tilt'; m.actT = 0; M.roar = 0.5; FX.H.sfx.hum();
    say(FX, 'tilt', 'THE TILT', P >= 3 ? 'The beam tips, then swings back: the pull drags you to the low side · walk against it, off the grinding edge' : `The beam tips ${s > 0 ? 'east' : 'west'}: the hall's pull drags you that way · walk against it, keep off the grinding edge`, HOSTILE); }
  function runTilt(FX, m, M, dt) { const T = M.tl, me = FX.me, P = FX.S.lv; if (!T) { toRest(m, M, 1); return; } hold(FX, m, M, dt); T.t += dt; const lt = T.t - T.warn;
    if (lt < 0) { M.tiltW = T.s * 0.12 * ease(T.t / T.warn); arrowSet(M, T.s, 0, 0.85, true); T.calm = true; return; }
    if (T.swing && !T.swung && lt >= T.live) { T.swung = true; T.s = -T.s; T.sides.push(T.s); T.calmT = 0.9; T.felt = false; FX.H.text(me.x, me.y - 2.2, 'IT SWINGS BACK!', HOSTILE, 15); FX.H.sfx.whoosh(); M.recoil = 0.5; }
    if (T.calmT > 0) { T.calmT -= dt; T.calm = true; M.tiltW = T.s * 0.12; arrowSet(M, T.s, 0, 0.85, true); return; }
    T.calm = false; M.tiltW = T.s * 0.3; M.pullW = [T.s * PULL * (P >= 3 ? 1.08 : 1), 0]; arrowSet(M, T.s, 0, 1, false);
    if (!T.felt) { T.felt = true; FX.H.sfx.crash(); FX.H.shake(8, 0.4); M.recoil = 0.6; }
    if (T.t >= T.total) { if (T.hz) T.hz.life = Math.min(T.hz.life, T.hz.age + 0.05); M.tl = null; toRest(m, M, 1.0); } }

  /* ---- Pan Drop: a pan swings out on its chains and slams a shown circle, leaving a shock ring ---- */
  function startPan(FX, m) { const M = FX.mem, P = FX.S.lv, me = FX.me; M.pd = { n: P >= 2 ? 2 : 1, sent: 0, landed: 0, next: null, endT: 0 }; m.act = 'pan'; m.actT = 0; M.roar = 0.6; FX.H.sfx.hum();
    queuePan(FX, m, me.x >= m.x ? 1 : 0, 1.55 / fastK(FX));
    say(FX, 'pan', 'PAN DROP', P >= 2 ? 'Both pans swing down on the shown circles, one after the other: get out of them' : 'A pan swings down and slams the shown circle: get out of it · mind the shock ring it leaves', HOSTILE); }
  function queuePan(FX, m, i, wait) { const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, r = P >= 2 ? 2.4 : 2.6;
    const q = clampFloor(C, { x: me.x + (me.vx || 0) * 0.2, y: me.y + (me.vy || 0) * 0.2 }, 1.0);
    const s = FX.tele({ shape: 'circle', x: q.x, y: q.y, r, t: wait, dmg: m.dmg * 1.9, col: HOSTILE, pan: i, fn: s2 => slamPan(FX, i, s2) });
    M.panFx[i] = { i, st: 'swing', t: 0, wait, x: q.x, y: q.y, r, tele: s, from: null };
    if (M.pd) M.pd.sent++; FX.H.sfx.whoosh(); }
  function slamPan(FX, i, s) { const M = FX.mem, m = FX.m; if (!m || m.dead) return; const F = M.panFx[i]; if (F) { F.st = 'down'; F.t = 0; }
    FX.H.sfx.crash(); FX.H.sfx.thud(); FX.H.shake(11, 0.4); FX.H.ring(s.x, s.y, s.r * 0.4, s.r + 1.3, 0.45, MS_HI, 0.25); shards(FX, s.x, s.y, 16); M.rubble.push({ x: s.x, y: s.y, r: s.r * 0.8, t: 0, seed: Math.random() * 9 });
    FX.hz({ shape: 'ring', kind: 'shock', x: s.x, y: s.y, r0: s.r, r1: s.r + 1.0, dps: m.dmg * 0.45, tick: 0.3, life: 1.6, col: MS_HI, draw: (c, z, FX2, T, t) => drawShock(c, FX, z, T, t) });
    M.recoil = Math.max(M.recoil, 0.5); if (M.pd) M.pd.landed++; }
  function runPan(FX, m, M, dt) { const D = M.pd; if (!D) { toRest(m, M, 1); return; } hold(FX, m, M, dt);
    // (the first pan's weight tips the beam toward it as it swings)
    const F = M.panFx.find(q => q && q.st === 'swing'); if (F) M.tiltW = (F.i ? 1 : -1) * 0.16;
    if (D.landed === D.sent && D.sent < D.n) { if (D.next == null) D.next = 0.35; D.next -= dt; if (D.next <= 0) { D.next = null; const k = M.panFx[1] && M.panFx[1].st !== 'back' ? 0 : M.panFx[0] && M.panFx[0].st !== 'back' ? 1 : (FX.me.x >= m.x ? 1 : 0); queuePan(FX, m, k, 1.15 / fastK(FX)); } }
    if (D.landed >= D.n || (D.sent >= D.n && !M.panFx.some(q => q && q.st === 'swing'))) { D.endT += dt; if (D.endT > 0.9) { M.pd = null; toRest(m, M, 1.0); } } }
  function updPans(FX, m, M, dt) { M.panFx.forEach((F, i) => { if (!F) return; F.t += dt;
      if (F.st === 'swing' && !FX.S.tele.includes(F.tele) && F.t < F.wait - 0.05) { F.from = panFxPos(FX, m, M, F); F.st = 'back'; F.t = 0; }
      if (F.st === 'down' && F.t > 0.5) { F.from = panFxPos(FX, m, M, F); F.st = 'back'; F.t = 0; }
      if (F.st === 'back' && F.t > 0.9) M.panFx[i] = null; }); }
  // a pan in the world while it is off its hook: [x, y, z] (true world), out of its rest place and back
  function panRestWorld(FX, m, M, i) { const p = pose(FX, m, M), q = panLocal(M, p, i ? 1 : -1), g = p.g(q[0], q[1], q[2]); return [g[0], p.hy, p.hy - g[1]]; }
  function panFxPos(FX, m, M, F) { const R = panRestWorld(FX, m, M, F.i);
    if (F.st === 'swing') { const u = clamp(F.t / F.wait, 0, 1);
      if (u < 0.66) { const e = ease(u / 0.66); return [lerp(R[0], F.x, e), lerp(R[1], F.y, e), lerp(R[2], 4.4, e) + Math.sin(Math.PI * e) * 1.4]; }
      if (u < 0.86) { const k = (u - 0.66) / 0.2; return [F.x, F.y, 4.4 + 0.9 * ease(k)]; }
      const k = (u - 0.86) / 0.14; return [F.x, F.y, lerp(5.3, 0.4, k * k)]; }
    if (F.st === 'down') return [F.x, F.y, 0.4 + Math.sin(Math.min(1, F.t / 0.25) * Math.PI) * 0.18];
    const A = F.from || [F.x, F.y, 0.4], e = ease(F.t / 0.9); return [lerp(A[0], R[0], e), lerp(A[1], R[1], e), lerp(A[2], R[2], e) + Math.sin(Math.PI * e) * 1.6]; }

  /* ---- Ring Sweep: the outer ring drops and rolls out across the hall; stand in its gap ---- */
  function startSweep(FX, m) { const M = FX.mem, P = FX.S.lv; M.sw = { waves: P >= 2 ? 2 : 1, wave: 0, cur: null, gap: 0, endT: 0, lastG: null }; nextSweep(FX, m, M); m.act = 'sweep'; m.actT = 0; M.roar = 0.5;
    say(FX, 'sweep', 'RING SWEEP', P >= 2 ? 'Its rings roll out across the hall, one after the other: stand in each glowing gap, or dodge through' : 'An armillary ring rolls out across the hall: stand in its glowing gap, or dodge through it', HOSTILE); }
  function nextSweep(FX, m, M) { const me = FX.me, f = fastK(FX), cx = m.x, cy = m.y + 0.4, ap = clamp(Math.atan2(me.y - cy, me.x - cx), 0.3, Math.PI - 0.3), dp = Math.max(3, Math.hypot(me.x - cx, me.y - cy)), W = M.sw;
    // (the gap a few steps to one side of the pet, never where it stands; the next on its other side)
    const side = W.lastG == null ? (Math.random() < 0.5 ? 1 : -1) : (angTo(ap, W.lastG) > 0 ? -1 : 1), gw = clamp(1.7 / dp, 0.14, 0.32);
    let g = clamp(ap + side * (0.42 + Math.random() * 0.25), 0.3, Math.PI - 0.3); if (Math.abs(angTo(g, ap)) < gw + 0.18) g = clamp(ap - side * (gw + 0.45), 0.3, Math.PI - 0.3);
    W.cur = { t: 0, warn: (W.wave ? 1.3 : 1.8) / f, r: 2.9, v: 8.5 * f, w: 1.0, g, gw, a0: -0.3, a1: Math.PI + 0.3, cx, cy, hit: false, rolled: false };
    W.lastG = g; W.wave++; M.ringOut = 1; FX.H.sfx.hum(); }
  function inArc(S, a) { return (a >= S.a0 && a <= S.a1) || a <= S.a1 - TAU; }
  function runSweep(FX, m, M, dt) { const W = M.sw, me = FX.me; if (!W) { toRest(m, M, 1); return; } hold(FX, m, M, dt); const S = W.cur;
    if (S) { S.t += dt;
      if (S.t >= S.warn) { if (!S.rolled) { S.rolled = true; FX.H.sfx.whoosh(); FX.H.shake(6, 0.3); M.recoil = 0.5; } const r0 = S.r; S.r += S.v * dt;
        const d = Math.hypot(me.x - S.cx, me.y - S.cy), a = Math.atan2(me.y - S.cy, me.x - S.cx), inGap = Math.abs(angTo(S.g, a)) < S.gw;
        // (the band is struck wherever it passed this frame, so a fast ring cannot skip over the pet)
        if (!S.hit && !me.dead && inArc(S, a) && !inGap && d > r0 - S.w / 2 - me.r * 0.5 && d < S.r + S.w / 2 + me.r * 0.5) { S.hit = true; FX.hurt(FX.m.dmg * 1.5); FX.H.shake(5, 0.2); }
        if (S.r > 19) { W.cur = null; W.gap = 0.3; } } }
    else { W.gap -= dt; if (W.gap <= 0) { if (W.wave < W.waves) nextSweep(FX, m, M); else { W.endT += dt; if (W.endT > 0.4) { M.sw = null; toRest(m, M, 0.9); } } } } }

  /* ---- Counterweight: weights fall from the low pan; carry them onto the HIGH plate; two in a row jams it ---- */
  function startWeigh(FX, m) { const M = FX.mem, s = Math.random() < 0.5 ? 1 : -1; M.cw = { s, n: 0, t: 0, spawnT: 0.8 }; m.act = 'weigh'; m.actT = 0; M.roar = 0.4; FX.H.sfx.chime();
    say(FX, 'weigh', 'COUNTERWEIGHT', 'Moonstone weights fall: carry one onto the HIGH plate (gold) · two in a row jams the engine', GOLD_HI); }
  function runWeigh(FX, m, M, dt) { const W = M.cw; if (!W) { toRest(m, M, 1); return; } hold(FX, m, M, dt); W.t += dt;
    M.tiltW = W.s * 0.3; M.pullW = [W.s * 1.1, 0]; arrowSet(M, W.s, 0, 0.45, false);
    if (W.spawnT != null) { W.spawnT -= dt; if (W.spawnT <= 0) { W.spawnT = null; dropWeight(FX, m, M); } } }
  function dropWeight(FX, m, M) { const W = M.cw, C = FX.C, me = FX.me, P = FX.S.lv, s = W.s, src = panRestWorld(FX, m, M, s > 0 ? 1 : 0); let spot = null;
    for (let k = 0; k < 60 && !spot; k++) { const x = C.x + s * (1.5 + Math.random() * 8), y = C.y + FX.rnd(-1.5, 8.5); if (!onFloor(C, x, y, 1.6)) continue; const dm = Math.hypot(x - me.x, y - me.y);
      if (k < 50 && (dm < 3 || dm > 11)) continue; if (PLATES.some((q, i) => Math.hypot(x - plateAt(C, i)[0], y - plateAt(C, i)[1]) < PLATE_R + 1.2)) continue; spot = [x, y]; }
    if (!spot) spot = [C.x + s * 3, C.y + 4];
    const TL = (P >= 2 ? 9.5 : 11.5) / FX.S.fast, w = { st: 'fall', t: 0, fly: 0.9, x0: src[0], y0: src[1], z0: src[2], x: spot[0], y: spot[1], life: TL, TL, n: W.n, seed: Math.random() * 9 };
    M.weights.push(w); FX.tele({ shape: 'circle', x: spot[0], y: spot[1], r: 0.95, t: 0.9, dmg: 0, col: GOLD_HI });
    FX.H.sfx.pop(); FX.H.text(spot[0], spot[1] - 1.8, W.n ? 'Another weight!' : 'A counterweight!', GOLD_HI, 14); M.recoil = Math.max(M.recoil, 0.3); }
  function updWeights(FX, m, M, dt) { const me = FX.me, C = FX.C, W = M.cw; M.hintT -= dt;
    for (const w of M.weights) { w.t += dt;
      if (w.st === 'fall') { if (w.t >= w.fly) { w.st = 'ground'; w.t = 0; FX.H.sfx.thud(); FX.H.ring(w.x, w.y, 0.2, 1.3, 0.35, GOLD_HI, 0.45); crumble(FX, w.x, w.y, 6); } continue; }
      if (w.st === 'ground' || w.st === 'carried') { w.life -= dt; if (w.life <= 0 && W) { scalesTip(FX, m, M); return; } }
      if (w.st === 'ground' && !M.carry && !me.dead && Math.hypot(me.x - w.x, me.y - w.y) < PICK_R) { w.st = 'carried'; M.carry = w; FX.H.sfx.chime(); FX.H.text(me.x, me.y - 2, 'To the HIGH plate!', GOLD_HI, 14);
        if (!M.seen.carry) { M.seen.carry = true; FX.H.banner('CARRY IT UP', 'Walk the weight onto the gold HIGH plate, against the pull', GOLD_HI, 2.0, true); } }
      if (w.st === 'carried') { w.x = me.x; w.y = me.y; if (W && !me.dead) { const hi = highOf(W.s), ph = plateAt(C, hi), pl = plateAt(C, 1 - hi);
          if (Math.hypot(me.x - ph[0], me.y - ph[1]) < PLATE_R) placeWeight(FX, m, M, w, hi);
          else if (Math.hypot(me.x - pl[0], me.y - pl[1]) < PLATE_R && M.hintT <= 0) { M.hintT = 2; FX.H.text(me.x, me.y - 2.2, 'This plate is LOW: the other one!', '#FFFFFF', 13); } } }
      if (w.st === 'rise' && w.t >= 0.75) { w.st = 'pan'; M.panW[w.plate]++; FX.H.sfx.thud(); M.recoil = Math.max(M.recoil, 0.5); M.tiltV += (w.plate ? 1 : -1) * 1.2;
        if (W && m.act === 'weigh') { if (W.n >= 2) jam(FX, m); else { W.s = -W.s; W.spawnT = 0.75; FX.H.shake(6, 0.3); FX.H.sfx.crash(); FX.H.text(m.x, m.y - 6.5, 'ONE! The beam swings: now the OTHER plate is high', GOLD_HI, 14); } } } }
    M.weights = M.weights.filter(w => w.st !== 'gone' && w.st !== 'pan'); }
  function placeWeight(FX, m, M, w, i) { const W = M.cw, C = FX.C, p = plateAt(C, i); w.st = 'rise'; w.t = 0; w.plate = i; w.x = p[0]; w.y = p[1]; M.carry = null; W.n++;
    FX.H.sfx.chime(); FX.H.ring(p[0], p[1], 0.3, PLATE_R + 0.6, 0.5, GOLD_HI, 0.55); sparkle(FX, p[0], p[1] - 0.5, 16, GOLD_HI); FX.H.text(p[0], p[1] - 2.2, W.n >= 2 ? 'LEVEL!' : 'WEIGHED!', GOLD_HI, 16); }
  function scalesTip(FX, m, M) { endAll(FX); FX.H.banner('THE SCALES TIP BACK', 'Too slow: it swings a pan at you', HOSTILE, 1.6, true); FX.H.sfx.crash(); startPan(FX, m); }
  /* ---- jammed (its stagger): the balance levelled twice over, the engine sags and its lens is bared ---- */
  function jam(FX, m) { const M = FX.mem, P = FX.S.lv; if (!m || m.dead) return; endAll(FX, true); FX.S.tele.length = 0;
    m.stunT = P >= 2 ? 5.5 : 6.5; m.act = 'rest'; m.actT = 0; M.restT = 1.4; M.recoil = 1; M.jam = 1; M.tiltW = 0;
    FX.H.banner('JAMMED!', 'Two counterweights level the beam: the engine sags, its lens bared · strike the lens!', GOLD_HI, 2.6, true);
    FX.H.shake(15, 0.6); FX.H.flash(0.3, '#FFF4D0'); FX.H.sfx.crash(); FX.H.sfx.crack(); sparkle(FX, m.x, m.y - 4, 30, GOLD_HI); }

  /* ---- Gravity Inversion: the pull flips toward the engine, the rocks rise and rain down; its pans spill a wave ---- */
  function startInvert(FX, m) { const M = FX.mem, C = FX.C, P = FX.S.lv;
    M.inv = { t: 0, rise: 1.9, vol: 0, nVol: 3, volT: 0, per: P >= 3 ? 6 : 5, waveT: null, waved: false, nWave: P >= 3 ? 5 : 4, endT: null };
    for (let i = 0; i < 16; i++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * 12, x = C.x + Math.cos(a) * d, y = C.y + 2 + Math.sin(a) * d * 0.8; if (!onFloor(C, x, y, 0.8)) continue; M.rocks.push({ x, y, t: -Math.random() * 0.5, dur: 2.0 + Math.random() * 0.4, s: 0.3 + Math.random() * 0.35, seed: Math.random() * 9, up: true }); }
    M.flipW = 1; M.liftW = 1; m.act = 'invert'; m.actT = 0; M.roar = 1; FX.H.sfx.hum(); FX.H.shake(8, 0.6); FX.H.flash(0.2, MS_HI);
    say(FX, 'invert', 'GRAVITY INVERSION', 'The pull flips toward the engine and the rocks rise... they fall on the shown circles · then its pans spill wisps and mooncalves', MS_HI); }
  function runInvert(FX, m, M, dt) { const I = M.inv, f = fastK(FX); if (!I) { toRest(m, M, 1); return; } hold(FX, m, M, dt); I.t += dt;
    if (!I.waved) { M.pullW = [0, -1.5]; arrowSet(M, 0, -1, 0.5, false); M.tiltW = Math.sin(I.t * 2.2) * 0.08; }
    if (I.t >= I.rise && I.vol < I.nVol) { I.volT -= dt; if (I.volT <= 0) { I.volT = 0.95 / f; rainVolley(FX, m, M, I); I.vol++; } }
    if (I.vol >= I.nVol && I.waveT == null) I.waveT = 1.5;
    if (I.waveT != null && !I.waved) { I.waveT -= dt; if (I.waveT <= 0) { I.waved = true; M.flipW = 0; M.liftW = 0; M.pullW = [0, 0]; spillWave(FX, m, M, I); I.endT = 1.6; } }
    if (I.endT != null) { I.endT -= dt; if (I.endT <= 0) { M.inv = null; toRest(m, M, 1.4); } } }
  function rainVolley(FX, m, M, I) { const C = FX.C, me = FX.me, f = fastK(FX), pts = [];
    const first = clampFloor(C, { x: me.x + (me.vx || 0) * 0.3, y: me.y + (me.vy || 0) * 0.3 }, 1.0); pts.push([first.x, first.y]);
    for (let k = 0; pts.length < I.per && k < 80; k++) { const a = Math.random() * TAU, d = 2.4 + Math.random() * 5.5, x = me.x + Math.cos(a) * d, y = me.y + Math.sin(a) * d; if (!onFloor(C, x, y, 1.0)) continue; if (pts.some(q => Math.hypot(q[0] - x, q[1] - y) < 2.5)) continue; pts.push([x, y]); }
    pts.forEach(([x, y], k) => FX.tele({ shape: 'circle', x, y, r: 1.5, t: (1.2 + k * 0.06) / f, dmg: m.dmg * 1.15, col: HOSTILE, rock: { s: 0.5 + Math.random() * 0.25, seed: Math.random() * 9 }, fn: s => { FX.H.sfx.thud(); FX.H.shake(4, 0.15); shards(FX, s.x, s.y, 9); M.rubble.push({ x: s.x, y: s.y, r: 0.9, t: 0, seed: Math.random() * 9 }); } }));
    FX.H.sfx.whoosh(); }
  function spillWave(FX, m, M, I) { const C = FX.C;
    FX.H.text(m.x, m.y - 6.5, 'Its pans spill their brood!', MS_HI, 15); FX.H.sfx.splash(); M.recoil = 0.7;
    for (let k = 0; k < I.nWave; k++) { const i = k % 2, type = k % 2 ? 'mooncalf' : 'craterwisp', q = clampFloor(C, { x: plateAt(C, i)[0] + FX.rnd(-2, 2), y: C.y - 2.6 + FX.rnd(0, 4.5) }, 1.5), src = panRestWorld(FX, m, M, i);
      M.spill.push({ x0: src[0], y0: src[1], z0: src[2], x: q.x, y: q.y, t: -k * 0.12, dur: 0.95 + 0.3, fly: 0.9, type });
      FX.tele({ shape: 'circle', x: q.x, y: q.y, r: 1.0, t: 0.9 + k * 0.12, dmg: m.dmg * 0.5, col: HOSTILE, fn: s => { FX.H.sfx.pop(); FX.H.ring(s.x, s.y, 0.2, 1.4, 0.4, MS_HI, 0.35); crumble(FX, s.x, s.y, 8); if (FX.m && !FX.m.dead && brood(FX) < 7) FX.minion(type, s.x, s.y); } }); } }

  /* ---- the body: its pose, and the places of its parts ---- */
  function pose(FX, m, M) { const bt = M.bt || 0, wk = M.wake == null ? 1 : M.wake, sag = M.sag || 0, rc = M.recoil || 0, hs = m.hitSq || 0;
    const S = lerp(0.72, 1, wk) * (1 + (M.roar || 0) * 0.03 + hs * 0.02);
    const z0 = (M.alt == null ? ALT : M.alt) + Math.sin(bt * 0.8) * 0.12 * (1 - sag) - rc * 0.16 - sag * 0.7;
    const hx = m.x + Math.sin(bt * 0.21) * 0.2 + rc * 0.09 * Math.sin(bt * 31), hy = m.y + sag * 0.7, hz = z0 + HUBZ * S * (1 - sag * 0.28);
    const tilt = (M.tilt || 0) + Math.sin(bt * 1.3) * 0.012 * (1 - sag) + rc * 0.035 * Math.sin(bt * 23) + sag * 0.012 * Math.sin(bt * 19);
    const pit = sag * 0.22 + rc * 0.05, cp = Math.cos(pit), sp = Math.sin(pit);
    // a point of the machine (dx east, dy south, dz up, about the hub) as the ground point it is seen over, and how near it is
    const g = (dx, dy, dz) => { const y1 = dy * cp + dz * sp, z1 = dz * cp - dy * sp; return [hx + dx * S, hy - hz + (y1 * SINE - z1 * COSE) * S]; };
    const near = (dx, dy, dz) => { const y1 = dy * cp + dz * sp, z1 = dz * cp - dy * sp; return y1 * COSE + z1 * SINE; };
    return { S, z0, hx, hy, hz, tilt, sag, bt, wk, g, near, ca: Math.cos(tilt), sa: Math.sin(tilt) }; }
  // along the beam (u from the pivot, off across it)
  function beamPt(p, u, off) { return [u * p.ca + off * p.sa, BEAM_DY, -u * p.sa + off * p.ca]; }
  // where a pan hangs (sd -1 west, 1 east): below its hook, swung out and up in the inversion, swaying
  function panLocal(M, p, sd) { const h = beamPt(p, sd * L, -0.12), f = (M.flip || 0) * 0.72, bt = p.bt, sw = 1 - (M.sag || 0) * 0.7;
    return [h[0] + CHAIN * sd * Math.sin(f * Math.PI) * 0.6 + Math.sin(bt * 0.9 + sd) * 0.12 * sw, h[1] + Math.sin(bt * 0.7 + sd * 2) * 0.12 * sw, h[2] - CHAIN * Math.cos(f * Math.PI) + Math.sin(bt * 1.4 + sd) * 0.05]; }
  function unit(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function ringBasis(p, k, M) { const R = RINGS[k], n0 = R.n(p.bt), sg = M.sag || 0, n = unit([n0[0] + sg * 0.25 * (k - 1), n0[1], n0[2] + sg * 0.35]);
    const u = unit(cross(n, [0, 0, 1])), v = cross(n, u); return { u, v, r: R.r }; }
  function ringPt(B, ph, r) { return [r * (Math.cos(ph) * B.u[0] + Math.sin(ph) * B.v[0]), r * (Math.cos(ph) * B.u[1] + Math.sin(ph) * B.v[1]), r * (Math.cos(ph) * B.u[2] + Math.sin(ph) * B.v[2])]; }
  function bodyParts(FX, m, M) { const p = pose(FX, m, M), at = q => { const g = p.g(q[0], q[1], q[2]); return [g[0], g[1], 0]; };
    const out = [hit('hub', at([0, 0.3, 0]), 1.7, m), hit('column', at([0, 0, -1.9]), 1.1, m), hit('keel', at([0, 0, -3.4]), 0.9, m)];
    [-1, 1].forEach((sd, i) => { if (!M.panFx[i]) out.push(hit('pan' + i, at(panLocal(M, p, sd)), 1.4, m)); out.push(hit('arm' + i, at(beamPt(p, sd * L * 0.6, 0)), 1.0, m)); });
    return out; }

  /* ---- painting the engine ---- */
  function drawEngine(c, FX, m, X, Y, T, t, step) {
    const M = FX.mem; if (!M.spin) return; const p = pose(FX, m, M), lw = Math.max(1.3, T * 0.06), go = i => step == null || step === i, S = p.S;
    const sc = q => [X + (q[0] - m.x) * T, Y + (q[1] - m.y) * T], Q = (dx, dy, dz) => sc(p.g(dx, dy, dz));
    if (go(0)) {
      // its shadow on the plates and the pale light it throws there
      const g0 = [X + (p.hx - m.x) * T, Y + (p.hy - m.y) * T], k = 1 / (1 + p.z0 * 0.15); FX.K.shade(c, g0[0], g0[1], T * 3.2 * k, T * 1.3 * k, 0.45, '#0A0A22');
      FX.K.glow(c, g0[0], g0[1] - T * 0.2, T * 3.2, MS, 0.22 + (M.menace || 0) * 0.1 + (1 - M.shut) * 0.25);
      [-1, 1].forEach((sd, i) => { if (M.panFx[i]) return; const q = p.g(...panLocal(M, p, sd)); FX.K.shade(c, X + (q[0] - m.x) * T, g0[1] + T * 0.1, T * 1.3, T * 0.5, 0.3, '#0A0A22'); });
      paintRings(c, FX, m, M, p, Q, T, lw, false);
      paintKeel(c, M, p, Q, T, lw);
      paintBeam(c, M, p, Q, T, lw);
      [-1, 1].forEach((sd, i) => { if (!M.panFx[i]) paintPanAt(c, M, p, Q, T, lw, sd, i); }); }
    if (go(1)) { paintHub(c, FX, m, M, p, Q, T, lw); paintRings(c, FX, m, M, p, Q, T, lw, true); } }
  /* the armillary rings: moonstone bands with runes, the half behind the hub painted first, the half before it last */
  function paintRings(c, FX, m, M, p, Q, T, lw, front) {
    for (let k = 0; k < 3; k++) { let al = 1, r = RINGS[k].r; if (k === 2 && M.ringOut > 0) { al = clamp(1 - M.ringOut * 1.6, 0, 1); r *= lerp(1, 0.5, M.ringOut); } if (al <= 0.02) continue;
      const B = ringBasis(p, k, M), N = 44, pts = [];
      for (let j = 0; j <= N; j++) { const ph = j / N * TAU, q = ringPt(B, ph, r); pts.push({ q, n: p.near(q[0], q[1] + 0.05, q[2]), ph }); }
      // runs of the ring on the wanted side (each a point longer at both ends, so the halves meet)
      const runs = []; let cur = null; for (let j = 0; j <= N; j++) { const on = front ? pts[j].n >= 0 : pts[j].n < 0; if (on) { if (!cur) { cur = []; if (j > 0) cur.push(pts[j - 1]); } cur.push(pts[j]); } else if (cur) { cur.push(pts[j]); runs.push(cur); cur = null; } } if (cur) runs.push(cur);
      const wPx = T * RINGS[k].w * 2 * p.S, col = k === 1 ? '#9DBBEA' : MS;
      c.save(); c.globalAlpha = al;
      runs.forEach(run => { const sp = run.map(o => Q(...o.q)); if (sp.length < 2) return;
        TN.tubeLite(c, sp, () => wPx, { col: front ? col : mixC(col, '#3A4888', 0.4), shade: front ? '#7F9CD2' : '#4C5E9E', hi: front ? '#F2F7FF' : '#A8BEE8', line: LINE, lw: lw * 0.85, d1: 0.2, d2: 0.26 });
        // a gold seam along its middle and runes glowing in it, running round as it turns
        c.strokeStyle = rgba(GOLD, front ? 0.85 : 0.5); c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); sp.forEach((q, j) => j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke();
        // runes cut along it (running round as it turns), one in three lit
        for (let j = 1; j < run.length - 1; j++) { const ph = run[j].ph + M.spin[k], kk = ((ph / TAU * 12) % 1 + 1) % 1; if (kk > 0.3) continue; const s = sp[j], s2 = sp[j + 1], a = Math.atan2(s2[1] - s[1], s2[0] - s[0]), lit = Math.floor(((ph / TAU * 12) % 12 + 12) % 12) % 3 === 0;
          c.save(); c.translate(s[0], s[1]); c.rotate(a); c.strokeStyle = lit ? rgba('#FFFFFF', front ? 0.95 : 0.5) : rgba(MS_DK, front ? 0.8 : 0.5); c.lineWidth = Math.max(1, T * 0.045); c.beginPath(); c.moveTo(-T * 0.08, -wPx * 0.25); c.lineTo(0, wPx * 0.22); c.lineTo(T * 0.08, -wPx * 0.25); c.stroke(); c.restore();
          if (lit && front) FX.K.glow(c, s[0], s[1], T * 0.36, MS_HI, 0.35 + 0.25 * Math.sin(p.bt * 3 + j + k)); } });
      c.restore(); } }
  /* the keel and the column: a faceted moonstone point under a silver collar, the column up to the hub */
  function paintKeel(c, M, p, Q, T, lw) { const S = p.S;
    // the keel: an inverted crystal, five facets seen
    const top = -2.75, tip = -4.05, kw = 1.0, ks = [[-kw, top], [-kw * 0.62, top - 0.55], [0, tip], [kw * 0.62, top - 0.55], [kw, top]].map(([x, z]) => Q(x, 0.2, z));
    TN.shape(c, TN.poly(ks), { col: MS, shade: MS_SH, hi: MS_HI, line: LINE, lw, r: T * 1.2 * S, d1: 0.08, d2: 0.16, spec: 0.5, specAt: Q(-0.35, 0.2, top - 0.35), force: true,
      inner: g => { g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = Math.max(1, T * 0.03); const a = Q(-kw * 0.25, 0.25, top), b = Q(0, 0.25, tip), d = Q(kw * 0.35, 0.25, top); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.stroke();
        g.save(); g.globalCompositeOperation = 'lighter'; const q = Q(0, 0.25, top - 0.6); const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], T * 0.9); gr.addColorStop(0, rgba(MS_HI, 0.6)); gr.addColorStop(1, rgba(MS_HI, 0)); g.fillStyle = gr; g.fillRect(q[0] - T, q[1] - T, T * 2, T * 2); g.restore(); } });
    // the collar: a silver disc with a gold rim, seen from a little above
    const cz = -2.72, cr = 1.35, rim = (rr, dz) => { const out = []; for (let j = 0; j < 24; j++) { const a = j / 24 * TAU; out.push(Q(Math.cos(a) * rr, Math.sin(a) * rr, dz)); } return out; };
    TN.shape(c, TN.poly(rim(cr, cz - 0.28)), { col: SIL_SH, shade: SIL_DK, hi: SIL, line: LINE, lw, r: T * 0.8, spec: false, force: true });
    TN.shape(c, TN.poly(rim(cr, cz)), { col: SIL, shade: SIL_SH, hi: SIL_HI, line: LINE, lw, r: T * 1.0, d1: 0.08, d2: 0.18, spec: 0.5, specAt: Q(-0.6, -0.3, cz), force: true,
      inner: g => { g.strokeStyle = GOLD; g.lineWidth = Math.max(1.5, T * 0.07); g.beginPath(); rim(cr * 0.82, cz).forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke(); } });
    // the column: silver, tapering, banded with moonstone
    const cb = cz + 0.02, ct = -0.7, wb = 0.52, wt = 0.38, col = [[-wb, cb], [-wt, ct], [wt, ct], [wb, cb]].map(([x, z]) => Q(x, 0, z));
    TN.shape(c, TN.poly(col), { col: SIL, shade: SIL_SH, hi: SIL_HI, line: LINE, lw, r: T * 0.7 * S, d1: 0.12, d2: 0.26, spec: false, force: true,
      inner: g => { for (const [z, w] of [[-2.25, 0.5], [-1.6, 0.46], [-1.0, 0.41]]) { const a = Q(-w, 0, z), b = Q(w, 0, z), mid = Q(0, w, z); g.strokeStyle = MS_SH; g.lineWidth = Math.max(2, T * 0.13); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(mid[0], mid[1] + (mid[1] - a[1]), b[0], b[1]); g.stroke(); g.strokeStyle = MS_HI; g.lineWidth = Math.max(1, T * 0.04); g.stroke(); } } }); }
  /* the beam on its pivot, the dial and the gold pointer over it */
  function paintBeam(c, M, p, Q, T, lw) { const S = p.S;
    // the dial: a gold arc of ticks over the hub on two struts, a crescent crowning it (fixed: the pointer reads it)
    const DR = 1.95, d0 = Math.PI / 2 - 0.5, d1 = Math.PI / 2 + 0.5, dial = []; for (let j = 0; j <= 16; j++) { const a = lerp(d0, d1, j / 16); dial.push(Q(Math.cos(a) * DR, -0.45, Math.sin(a) * DR)); }
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const a of [d0, d1]) { const A = Q(Math.cos(a) * 0.9, -0.45, Math.sin(a) * 0.9), B = Q(Math.cos(a) * DR, -0.45, Math.sin(a) * DR); c.strokeStyle = LINE; c.lineWidth = T * 0.16 + lw * 2; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.strokeStyle = SIL_SH; c.lineWidth = T * 0.16; c.stroke(); }
    c.strokeStyle = LINE; c.lineWidth = T * 0.2 + lw * 2; c.beginPath(); dial.forEach((q, j) => j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = T * 0.2; c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(1, T * 0.05); c.stroke();
    for (let j = 0; j <= 8; j++) { const a = lerp(d0, d1, j / 8), A = Q(Math.cos(a) * (DR - 0.22), -0.44, Math.sin(a) * (DR - 0.22)), B = Q(Math.cos(a) * (DR - (j % 4 ? 0.36 : 0.5)), -0.44, Math.sin(a) * (DR - (j % 4 ? 0.36 : 0.5))); c.strokeStyle = j === 4 ? GOLD_HI : GOLD_SH; c.lineWidth = Math.max(1.2, T * (j === 4 ? 0.07 : 0.04)); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); }
    // the crescent crown
    const cq = Q(0, -0.45, DR + 0.6), cr = T * 0.62 * S, ix = cq[0] + cr * 0.5, iy = cq[1] - cr * 0.28, ir = cr * 0.8, cres = [];
    for (let j = 0; j <= 40; j++) { const a = j / 40 * TAU, x = cq[0] + Math.cos(a) * cr, y = cq[1] + Math.sin(a) * cr; if (Math.hypot(x - ix, y - iy) >= ir) cres.push([x, y, a]); }
    if (cres.length > 2) { const i0 = cres.findIndex((q, j) => j > 0 && q[2] - cres[j - 1][2] > 0.2), outer = i0 > 0 ? cres.slice(i0).concat(cres.slice(0, i0)) : cres, A = outer[0], B = outer[outer.length - 1], a0 = Math.atan2(B[1] - iy, B[0] - ix), a1 = Math.atan2(A[1] - iy, A[0] - ix);
      TN.shape(c, cc => { cc.moveTo(A[0], A[1]); outer.forEach(q => cc.lineTo(q[0], q[1])); cc.arc(ix, iy, ir, a0, a1, true); cc.closePath(); }, { col: GOLD, shade: GOLD_SH, hi: GOLD_HI, line: LINE, lw, r: cr, d1: 0.12, d2: 0.24, spec: false, force: true }); }
    FX0.glow(c, cq[0], cq[1], T * 1.1, GOLD_HI, 0.35 + 0.15 * Math.sin(p.bt * 1.7));
    // the pointer: a gold needle standing up from the pivot, square to the beam
    const pa = [p.sa, p.ca], P0 = Q(pa[0] * 0.5, -0.38, pa[1] * 0.5), P1 = Q(pa[0] * (DR - 0.15), -0.38, pa[1] * (DR - 0.15)); c.strokeStyle = LINE; c.lineWidth = T * 0.12 + lw * 2; c.beginPath(); c.moveTo(P0[0], P0[1]); c.lineTo(P1[0], P1[1]); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = T * 0.12; c.stroke();
    c.fillStyle = MS_HI; c.strokeStyle = LINE; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(P1[0], P1[1] - T * 0.22); c.lineTo(P1[0] + T * 0.12, P1[1]); c.lineTo(P1[0], P1[1] + T * 0.14); c.lineTo(P1[0] - T * 0.12, P1[1]); c.closePath(); c.fill(); c.stroke();
    c.restore();
    // the beam: silver, thickest at the pivot, a gold inlay down it, moonstone runes, crescent hooks at its ends
    const N = 18, top = [], bot = []; for (let j = 0; j <= N; j++) { const u = lerp(-L, L, j / N), e = Math.abs(u) / L, h = 0.25 + 0.17 * (1 - e) * (1 - e) + (e > 0.9 ? (e - 0.9) * 1.4 : 0); top.push(Q(...beamPt(p, u, h))); bot.push(Q(...beamPt(p, u, -h))); }
    TN.shape(c, TN.poly(top.concat(bot.reverse())), { col: SIL, shade: SIL_SH, hi: SIL_HI, line: LINE, lw: lw * 1.1, r: T * 0.5 * S, d1: 0.14, d2: 0.3, spec: false, force: true,
      inner: g => { const mid = []; for (let j = 0; j <= N; j++) mid.push(Q(...beamPt(p, lerp(-L * 0.93, L * 0.93, j / N), 0))); g.strokeStyle = GOLD; g.lineWidth = Math.max(1.2, T * 0.06); g.beginPath(); mid.forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); } });
    c.save(); c.globalCompositeOperation = 'lighter'; for (let j = 1; j < 10; j++) { if (j === 5) continue; const u = lerp(-L * 0.85, L * 0.85, j / 10), q = Q(...beamPt(p, u, 0)), a = 0.55 + 0.45 * Math.sin(p.bt * 2.2 - j * 0.8); FX0.glow(c, q[0], q[1], T * 0.38, MS_HI, 0.5 * a); c.fillStyle = rgba('#FFFFFF', 0.8 * a); c.beginPath(); c.arc(q[0], q[1], T * 0.06, 0, TAU); c.fill(); } c.restore();
    for (const sd of [-1, 1]) { const h = Q(...beamPt(p, sd * L, 0)), r = T * 0.36 * S; c.fillStyle = GOLD; c.strokeStyle = LINE; c.lineWidth = lw; c.beginPath(); c.arc(h[0], h[1], r, 0, TAU); c.fill(); c.stroke(); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(h[0] - r * 0.3, h[1] - r * 0.3, r * 0.3, 0, TAU); c.fill();
      const hk = Q(...beamPt(p, sd * L, -0.12)); c.strokeStyle = LINE; c.lineWidth = T * 0.1 + lw * 1.6; c.beginPath(); c.arc(hk[0], hk[1] + T * 0.18, T * 0.16, -Math.PI * 0.1, Math.PI * 1.1); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = T * 0.1; c.stroke(); } }
  /* a pan hanging on its chains (also painted in flight, off the hook, by drawPansFx) */
  function paintPanAt(c, M, p, Q, T, lw, sd, i) { const pl = panLocal(M, p, sd), hk = Q(...beamPt(p, sd * L, -0.2)), cs = Q(...pl);
    const rimL = th => Q(pl[0] + Math.cos(th) * PAN_R * 0.9, pl[1] + Math.sin(th) * PAN_R * 0.9, pl[2] + 0.04);
    paintPan(c, cs, hk, [rimL(Math.PI * 7 / 6), rimL(Math.PI * 11 / 6)], [rimL(Math.PI / 2)], T * p.S, lw, M.panW[i] || 0, p.bt + i * 2, 0); }
  // cs: the pan's centre on screen, hk: the hook its chains rise to (or null), back/front: the chains' feet on the rim
  function paintPan(c, cs, hk, back, front, s, lw, load, bt, glowK) { const rx = PAN_R * s, ry = rx * 0.36, dep = s * 0.8;
    if (hk) back.forEach(q => chain(c, hk, q, s, lw));
    // the bowl: silver, hanging under the rim; moonstone runes round its front, a crystal pendant under it
    const bowl = cc => { cc.moveTo(cs[0] - rx, cs[1]); cc.ellipse(cs[0], cs[1], rx, ry, 0, Math.PI, 0, true); cc.bezierCurveTo(cs[0] + rx * 0.98, cs[1] + dep * 0.75, cs[0] + rx * 0.5, cs[1] + dep, cs[0], cs[1] + dep); cc.bezierCurveTo(cs[0] - rx * 0.5, cs[1] + dep, cs[0] - rx * 0.98, cs[1] + dep * 0.75, cs[0] - rx, cs[1]); cc.closePath(); };
    const pq = [cs[0], cs[1] + dep]; c.fillStyle = MS; c.strokeStyle = LINE; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(pq[0] - s * 0.14, pq[1] - s * 0.04); c.lineTo(pq[0], pq[1] + s * 0.42); c.lineTo(pq[0] + s * 0.14, pq[1] - s * 0.04); c.closePath(); c.fill(); c.stroke();
    TN.shape(c, bowl, { col: SIL, shade: SIL_SH, hi: SIL_HI, line: LINE, lw, r: rx * 0.9, d1: 0.1, d2: 0.24, spec: 0.55, specAt: [cs[0] - rx * 0.55, cs[1] + dep * 0.45], force: true,
      inner: g => { g.save(); g.globalCompositeOperation = 'lighter'; for (let j = 0; j < 5; j++) { const a = Math.PI * (0.18 + j * 0.16), x = cs[0] + Math.cos(a) * rx * 0.78, y = cs[1] + ry * 0.5 + Math.sin(a) * (dep - ry * 0.5) * 0.7; const k = 0.5 + 0.5 * Math.sin(bt * 2 + j); g.fillStyle = rgba(MS_HI, 0.35 + 0.4 * k + glowK * 0.3); g.beginPath(); g.ellipse(x, y, s * 0.07, s * 0.12, 0, 0, TAU); g.fill(); } g.restore();
        g.strokeStyle = 'rgba(40,46,90,.35)'; g.lineWidth = Math.max(1, s * 0.03); g.beginPath(); g.ellipse(cs[0], cs[1] + dep * 0.2, rx * 0.94, dep * 0.6, 0, 0.15, Math.PI - 0.15); g.stroke(); } });
    // the dish seen from above: its inside, and a thick gold rim
    c.fillStyle = '#6E7698'; c.beginPath(); c.ellipse(cs[0], cs[1], rx * 0.92, ry * 0.86, 0, 0, TAU); c.fill();
    const gi = c.createLinearGradient(cs[0], cs[1] - ry, cs[0], cs[1] + ry); gi.addColorStop(0, 'rgba(20,24,56,.55)'); gi.addColorStop(1, 'rgba(230,238,255,.25)'); c.fillStyle = gi; c.fill();
    c.strokeStyle = LINE; c.lineWidth = s * 0.16 + lw * 1.6; c.beginPath(); c.ellipse(cs[0], cs[1], rx, ry, 0, 0, TAU); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = s * 0.16; c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(1, s * 0.04); c.beginPath(); c.ellipse(cs[0], cs[1] - s * 0.03, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    // the weights it holds
    for (let j = 0; j < load; j++) weightIcon(c, cs[0] + (j - (load - 1) / 2) * s * 0.7, cs[1] + s * 0.05, s * 0.75, 1, bt);
    if (hk) front.forEach(q => chain(c, hk, q, s, lw)); }
  // a chain of silver links from a to b
  function chain(c, a, b, s, lw) { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, n = Math.max(2, Math.round(d / (s * 0.26))), ang = Math.atan2(dy, dx);
    c.save(); c.strokeStyle = 'rgba(20,24,52,.55)'; c.lineWidth = Math.max(1, s * 0.05); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, x = a[0] + dx * u, y = a[1] + dy * u; c.save(); c.translate(x, y); c.rotate(ang);
      if (k % 2) { c.strokeStyle = LINE; c.lineWidth = Math.max(1.5, s * 0.09); c.beginPath(); c.moveTo(-s * 0.13, 0); c.lineTo(s * 0.13, 0); c.stroke(); c.strokeStyle = SIL_SH; c.lineWidth = Math.max(1, s * 0.05); c.stroke(); }
      else { c.strokeStyle = LINE; c.lineWidth = Math.max(1.2, s * 0.05) + 1.4; c.beginPath(); c.ellipse(0, 0, s * 0.15, s * 0.075, 0, 0, TAU); c.stroke(); c.strokeStyle = SIL; c.lineWidth = Math.max(1, s * 0.05); c.stroke(); }
      c.restore(); }
    c.restore(); }
  /* the hub: a silver housing ringed in gold, the lens-eye in it behind an iris of moonstone blades */
  function paintHub(c, FX, m, M, p, Q, T, lw) { const S = p.S, me = FX.me, ring = (r, dy) => { const out = []; for (let j = 0; j < 30; j++) { const a = j / 30 * TAU; out.push(Q(Math.cos(a) * r, dy, Math.sin(a) * r)); } return out; };
    const RO = 1.36, RI = 0.96, bare = 1 - M.shut;
    // the housing: a thick silver ring
    TN.shape(c, TN.poly(ring(RO, 0.2)), { col: SIL_SH, shade: SIL_DK, hi: SIL, line: LINE, lw, r: T * 0.8, spec: false, force: true });
    TN.shape(c, cc => { TN.poly(ring(RO, 0.32))(cc); TN.poly(ring(RI, 0.32).reverse())(cc); }, { col: SIL, shade: SIL_SH, hi: SIL_HI, line: LINE, lw, r: T * 0.7 * S, d1: 0.1, d2: 0.22, spec: 0.6, specAt: Q(-0.75, 0.32, 0.75), force: true,
      inner: g => { g.strokeStyle = GOLD; g.lineWidth = Math.max(1.5, T * 0.07); g.beginPath(); ring((RO + RI) / 2 + 0.06, 0.32).forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke();
        for (let j = 0; j < 8; j++) { const a = j / 8 * TAU + 0.2, q = Q(Math.cos(a) * (RO + RI) / 2, 0.33, Math.sin(a) * (RO + RI) / 2); g.fillStyle = MS_HI; g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.arc(q[0], q[1], T * 0.08, 0, TAU); g.fill(); g.stroke(); } } });
    // the lens: pale moonstone, its iris and pupil turned on the pet
    const lc = Q(0, 0.34, 0), lr = RI * T * S, lry = lr * COSE, look = M.look || [0, 0.6], stun = m.stunT > 0;
    c.save(); c.beginPath(); c.ellipse(lc[0], lc[1], lr, lry, 0, 0, TAU); c.clip();
    const gr = c.createRadialGradient(lc[0] - lr * 0.3, lc[1] - lr * 0.35, lr * 0.05, lc[0], lc[1], lr); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, MS_HI); gr.addColorStop(1, MS_SH); c.fillStyle = gr; c.fillRect(lc[0] - lr, lc[1] - lr, lr * 2, lr * 2);
    const jit = stun ? [Math.sin(p.bt * 9) * 0.25, Math.cos(p.bt * 7) * 0.2] : [0, 0], ix = lc[0] + (look[0] + jit[0]) * lr * 0.34, iy = lc[1] + (look[1] * 0.8 - 0.1 + jit[1]) * lry * 0.34;
    const ir = lr * (0.5 + bare * 0.08), pr = ir * (0.42 - (M.iris || 0) * 0.16 + bare * 0.12 + (M.menace || 0) * -0.06);
    c.fillStyle = INDIGO; c.beginPath(); c.arc(ix, iy, ir, 0, TAU); c.fill(); c.fillStyle = '#4C58A8'; c.beginPath(); c.arc(ix, iy + ir * 0.12, ir * 0.82, 0, TAU); c.fill();
    c.strokeStyle = rgba(MS_HI, 0.55); c.lineWidth = Math.max(1, T * 0.03); for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; c.beginPath(); c.moveTo(ix + Math.cos(a) * pr * 1.2, iy + Math.sin(a) * pr * 1.2); c.lineTo(ix + Math.cos(a) * ir * 0.85, iy + Math.sin(a) * ir * 0.85); c.stroke(); }
    c.fillStyle = '#0C0A22'; c.beginPath(); c.arc(ix, iy, pr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(ix - ir * 0.38, iy - ir * 0.42, ir * 0.2, ir * 0.13, -0.5, 0, TAU); c.fill(); c.beginPath(); c.arc(ix + ir * 0.3, iy + ir * 0.28, ir * 0.07, 0, TAU); c.fill();
    // the iris of blades closing over it: an annulus of moonstone, its blade seams spiralling in
    const ap = lr * (1 - 0.6 * M.shut);
    if (M.shut > 0.03) { c.fillStyle = mixC(MS_SH, MS, 0.4); c.beginPath(); c.ellipse(lc[0], lc[1], lr + 2, lry + 2, 0, 0, TAU); c.ellipse(lc[0], lc[1], ap, ap * COSE, 0, 0, TAU, true); c.fill('evenodd');
      c.strokeStyle = LINE; c.lineWidth = Math.max(1, T * 0.04); for (let j = 0; j < 7; j++) { const a0 = j / 7 * TAU + p.bt * 0.1; c.beginPath(); for (let k = 0; k <= 6; k++) { const u = k / 6, a = a0 + u * 0.9, r = lerp(ap, lr, u); k ? c.lineTo(lc[0] + Math.cos(a) * r, lc[1] + Math.sin(a) * r * COSE) : c.moveTo(lc[0] + Math.cos(a) * r, lc[1] + Math.sin(a) * r * COSE); } c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.ellipse(lc[0], lc[1], ap + 1, (ap + 1) * COSE, 0, Math.PI * 1.05, Math.PI * 1.7); c.stroke(); }
    c.restore();
    c.strokeStyle = LINE; c.lineWidth = lw; c.beginPath(); c.ellipse(lc[0], lc[1], lr, lry, 0, 0, TAU); c.stroke();
    FX0.glow(c, lc[0], lc[1], T * (1.8 + bare * 1.6), MS_HI, 0.14 + bare * 0.45 + (M.menace || 0) * 0.08);
    if (bare > 0.5) FX0.glow(c, lc[0], lc[1], T * 0.9, '#FFFFFF', (bare - 0.5) * 0.9); }

  /* ---- live things over the scene ---- */
  // the pans in flight: chains reaching back to the beam's hooks, a shadow growing under them
  function drawPansFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || m.dead || !M.spin) return; const p = pose(FX, m, M);
    M.panFx.forEach((F, i) => { if (!F) return; const w = panFxPos(FX, m, M, F), sd = i ? 1 : -1, hkG = p.g(...beamPt(p, sd * L, -0.2)), hk = [FX.sx(hkG[0]), FX.sy(hkG[1])], cs = [FX.sx(w[0]), FX.sy(w[1]) - w[2] * T];
      const s = T * p.S, gx = FX.sx(w[0]), gy = FX.sy(w[1]), k = 1 / (1 + w[2] * 0.25); FX.K.shade(c, gx, gy, T * PAN_R * 1.2 * k, T * PAN_R * 0.55 * k, 0.35 + 0.25 * (1 - k), '#0A0A22');
      const rim = th => [cs[0] + Math.cos(th) * PAN_R * s * 0.9, cs[1] + Math.sin(th) * PAN_R * s * 0.9 * SINE];
      paintPan(c, cs, hk, [rim(Math.PI * 7 / 6), rim(Math.PI * 11 / 6)], [rim(Math.PI / 2)], s, Math.max(1.3, T * 0.06), M.panW[i] || 0, p.bt + i * 2, F.st === 'swing' ? 0.6 : 0); }); }
  // the rising rocks of the inversion, and the falling ones over their circles
  function drawRocks(c, FX, T, t) { const M = FX.mem; c.save();
    M.rocks.forEach(r => { if (r.t < 0) return; const u = r.t / r.dur, z = 9.5 * ease(u) * (r.up ? 1 : 0) + 0.1, a = Math.min(1, (1 - u) / 0.25, r.t / 0.2), X = FX.sx(r.x), Y = FX.sy(r.y); c.globalAlpha = a;
      FX.K.shade(c, X, Y, T * r.s * 1.4 / (1 + z * 0.3), T * r.s * 0.5 / (1 + z * 0.3), 0.35, '#0A0A22'); rock(c, X, Y - z * T, T * r.s, r.seed, t * (1 + hr(r.seed)) + r.seed); });
    c.globalAlpha = 1;
    FX.S.tele.forEach(s => { if (!s.rock || s.done) return; const u = s.age / s.t, X = FX.sx(s.x), Y = FX.sy(s.y); if (u < 0.55) return; const k = (u - 0.55) / 0.45, z = 10 * (1 - k * k);
      FX.K.shade(c, X, Y, T * s.r * 0.75 * (0.4 + 0.6 * k), T * s.r * 0.3 * (0.4 + 0.6 * k), 0.45, '#0A0A22');
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(MS), X - T * 0.4, Y - z * T - T * 2.4, T * 0.8, T * 2.8); c.restore();
      rock(c, X, Y - z * T, T * s.rock.s * 1.5, s.rock.seed, t * 3 + s.rock.seed); });
    c.restore(); }
  function rock(c, x, y, r, seed, rot) { const R = mulberry32(Math.floor(seed * 1000) + 7), pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + rot * 0.4, k = 0.78 + R() * 0.3; pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.85]); }
    TN.shape(c, TN.poly(pts), { col: '#7E86AC', shade: '#4E5480', hi: '#B8C2E4', line: LINE, lw: Math.max(1.2, r * 0.12), r, d1: 0.14, d2: 0.28, spec: false, force: true,
      inner: g => { g.fillStyle = 'rgba(30,32,60,.35)'; g.beginPath(); g.ellipse(x + r * 0.2, y + r * 0.1, r * 0.18, r * 0.1, 0, 0, TAU); g.fill(); g.fillStyle = rgba(MS_HI, 0.7); g.beginPath(); g.moveTo(x - r * 0.3, y - r * 0.2); g.lineTo(x - r * 0.1, y - r * 0.5); g.lineTo(x + r * 0.05, y - r * 0.15); g.closePath(); g.fill(); } }); }
  // the weights falling from the low pan, rising from a plate into its pan, carried over the pet; the hint to the high plate
  function drawWeightsFx(c, FX, T, t) { const M = FX.mem, m = FX.m, me = FX.me, C = FX.C; if (!m || !M.spin) return; const p = pose(FX, m, M);
    for (const w of M.weights) {
      if (w.st === 'fall') { const u = clamp(w.t / w.fly, 0, 1), x = lerp(w.x0, w.x, u), y = lerp(w.y0, w.y, u), z = lerp(w.z0, 0.3, u) + Math.sin(Math.PI * u) * 2.5; weightIcon(c, FX.sx(x), FX.sy(y) - z * T, T * 0.8, 1, t); }
      else if (w.st === 'rise') { const sd = w.plate ? 1 : -1, q = p.g(...panLocal(M, p, sd)), u = ease(w.t / 0.75), x0 = FX.sx(w.x), y0 = FX.sy(w.y), x1 = FX.sx(q[0]), y1 = FX.sy(q[1]);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * (1 - u * 0.5); softBeam(c, x0, y0, x1, y1, T * 1.4, GOLD_HI); c.restore();
        weightIcon(c, lerp(x0, x1, u), lerp(y0 - T * 0.4, y1, u) - Math.sin(Math.PI * u) * T * 0.8, T * 0.8, 1, t); }
      else if (w.st === 'carried' && !me.dead) { const X = FX.sx(me.x), Y = FX.sy(me.y) - T * 2.2 + Math.sin(t * 3) * T * 0.08; FX0.glow(c, X, Y, T * 1.2, GOLD, 0.7); weightIcon(c, X, Y, T * 0.85, 1, t); timerRing(c, X, Y + T * 0.05, T * 0.62, w.life / w.TL, t);
        // an arrow at its feet pointing to the high plate
        if (M.cw) { const ph = plateAt(C, highOf(M.cw.s)), a = Math.atan2(ph[1] - me.y, ph[0] - me.x), d = Math.hypot(ph[0] - me.x, ph[1] - me.y); if (d > PLATE_R) { const ax = FX.sx(me.x) + Math.cos(a) * T * 1.6, ay = FX.sy(me.y) + Math.sin(a) * T * 1.6; c.save(); c.translate(ax, ay); c.rotate(a); c.globalAlpha = 0.75 + 0.25 * Math.sin(t * 6); c.fillStyle = GOLD_HI; c.strokeStyle = 'rgba(20,16,40,.75)'; c.lineWidth = 3; c.beginPath(); c.moveTo(T * 0.55, 0); c.lineTo(-T * 0.25, -T * 0.38); c.lineTo(-T * 0.08, 0); c.lineTo(-T * 0.25, T * 0.38); c.closePath(); c.stroke(); c.fill(); c.restore(); } } } }
    // over the high plate while it waits for a weight: a bobbing gold chevron
    if (M.cw && m.act === 'weigh') { const ph = plateAt(C, highOf(M.cw.s)), X = FX.sx(ph[0]), Y = FX.sy(ph[1]) - T * (2.6 + 0.25 * Math.sin(t * 4)); c.save(); c.globalAlpha = 0.9; c.fillStyle = GOLD_HI; c.strokeStyle = 'rgba(20,16,40,.75)'; c.lineWidth = 3; c.beginPath(); c.moveTo(X - T * 0.45, Y - T * 0.3); c.lineTo(X + T * 0.45, Y - T * 0.3); c.lineTo(X, Y + T * 0.3); c.closePath(); c.stroke(); c.fill(); c.restore(); label(c, 'HIGH', X, Y - T * 0.75, Math.round(T * 0.55), GOLD_HI, 0.95); } }
  // the brood spilled from the pans, tumbling down to their circles
  function drawSpill(c, FX, T, t) { const M = FX.mem; M.spill.forEach(s => { if (s.t < 0 || s.t > s.fly) return; const u = s.t / s.fly, x = lerp(s.x0, s.x, u), y = lerp(s.y0, s.y, u), z = lerp(s.z0, 0.4, u) + Math.sin(Math.PI * u) * 2, X = FX.sx(x), Y = FX.sy(y) - z * T;
      FX0.glow(c, X, Y, T * 1.1, s.type === 'craterwisp' ? MS_HI : '#E8E4EE', 0.7); c.fillStyle = s.type === 'craterwisp' ? MS_HI : '#D6D2DA'; c.strokeStyle = LINE; c.lineWidth = 2; c.beginPath(); c.arc(X, Y, T * 0.32, 0, TAU); c.fill(); c.stroke(); }); }
  function weightIcon(c, x, y, s, lit, t) { c.save(); c.translate(x, y); const w = s * 0.5, h = s * 0.5, lw = Math.max(1.2, s * 0.08);
    FX0.shade(c, 0, h * 0.55, w * 1.2, w * 0.35, 0.4, '#0A0A22');
    // a squat moonstone weight: a tapered body, a lit top, a gold ring handle
    TN.shape(c, TN.poly([[-w, h * 0.5], [-w * 0.72, -h * 0.35], [w * 0.72, -h * 0.35], [w, h * 0.5]]), { col: MS, shade: MS_SH, hi: MS_HI, line: LINE, lw, r: s * 0.6, d1: 0.1, d2: 0.22, spec: false, force: true,
      inner: g => { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-w, -h * 0.05, w * 2, h * 0.1); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(MS_HI, 0.55 + 0.3 * Math.sin((t || 0) * 4)); g.beginPath(); g.moveTo(-w * 0.12, h * 0.35); g.lineTo(0, -h * 0.05); g.lineTo(w * 0.12, h * 0.35); g.closePath(); g.fill(); g.restore(); } });
    c.fillStyle = '#E8F0FF'; c.strokeStyle = LINE; c.lineWidth = lw; c.beginPath(); c.ellipse(0, -h * 0.35, w * 0.72, h * 0.2, 0, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = LINE; c.lineWidth = s * 0.1 + lw * 1.6; c.beginPath(); c.ellipse(0, -h * 0.62, w * 0.36, h * 0.3, 0, Math.PI, 0); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = s * 0.1; c.stroke();
    c.restore(); }
  function timerRing(c, x, y, r, f, t) { f = clamp(f, 0, 1); c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(10,10,30,.55)'; c.lineWidth = 5; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.strokeStyle = f < 0.3 ? mixC(HOSTILE, '#FFFFFF', 0.5 + 0.5 * Math.sin(t * 14)) : GOLD_HI; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke(); c.restore(); }
  // a soft column of light between two screen points (feathered along both edges and both ends)
  function softBeam(c, x0, y0, x1, y1, w, col) { const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy); if (d < 2) return; c.save(); c.translate(x0, y0); c.rotate(Math.atan2(dy, dx)); blitSized(c, beamSprite(col), -w * 0.3, -w / 2, d + w * 0.6, w); c.restore(); }
  function label(c, s, x, y, px, col, a) { c.save(); c.globalAlpha = a == null ? 1 : a; c.font = `900 ${px}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = Math.max(3, px * 0.24); c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); c.restore(); }
  // a feathered ring on the floor: layered strokes, widest the faintest
  function softRing(c, X, Y, r, w, col, a, a0, a1) { c.save(); c.lineCap = 'round'; [[2.2, 0.12], [1.5, 0.22], [1.0, 0.4], [0.5, 0.75]].forEach(([k, al]) => { c.globalAlpha = a * al; c.strokeStyle = col; c.lineWidth = Math.max(1, w * k); c.beginPath(); c.arc(X, Y, Math.max(0.5, r), a0 == null ? 0 : a0, a1 == null ? TAU : a1); c.stroke(); }); c.restore(); }
  // the shock ring a pan leaves
  function drawShock(c, FX, z, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), u = z.age / z.life, a = Math.min(1, z.age / 0.12) * (1 - u), r = (z.r0 + z.r1) / 2 * T * (1 + u * 0.08), w = (z.r1 - z.r0) * T;
    c.save(); softRing(c, X, Y, r, w * 0.7, '#5A6CB8', a * 0.4); softRing(c, X, Y, r, w * 0.4, HOSTILE, a * 0.45);
    c.strokeStyle = rgba('#FFFFFF', a * 0.7); c.lineWidth = Math.max(1, T * 0.05); for (let j = 0; j < 10; j++) { const b = j / 10 * TAU + t * 2, r0 = r - w * 0.4, r1 = r + w * 0.4; c.beginPath(); c.moveTo(X + Math.cos(b) * r0, Y + Math.sin(b) * r0); c.lineTo(X + Math.cos(b + 0.08) * (r0 + r1) / 2, Y + Math.sin(b + 0.08) * (r0 + r1) / 2); c.lineTo(X + Math.cos(b) * r1, Y + Math.sin(b) * r1); c.stroke(); }
    c.restore(); }

  /* ---- on the plates, under everything: the plate-circles' state, the grinding edge, the pull's arrows, the sweep, the weights ---- */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m; if (!M || !C || !M.spin) return;
    // rubble where the pans and rocks came down
    M.rubble.forEach(r => { const X = FX.sx(r.x), Y = FX.sy(r.y), a = Math.min(1, (3.2 - r.t) / 1.0); c.save(); c.globalAlpha = 0.5 * a; c.strokeStyle = '#3A3E6E'; c.lineWidth = Math.max(1, T * 0.05); for (let j = 0; j < 7; j++) { const b = j / 7 * TAU + r.seed; c.beginPath(); c.moveTo(X + Math.cos(b) * r.r * 0.2 * T, Y + Math.sin(b) * r.r * 0.2 * T); c.lineTo(X + Math.cos(b + 0.2) * r.r * 0.6 * T, Y + Math.sin(b + 0.2) * r.r * 0.6 * T); c.lineTo(X + Math.cos(b) * r.r * T, Y + Math.sin(b) * r.r * T); c.stroke(); } c.restore(); });
    // the plate-circles: during the weighing the high one burns gold and the low one dims; each joined to its pan by a thread of light
    const W = M.cw && m && m.act === 'weigh' ? M.cw : null, p = m && !m.dead ? pose(FX, m, M) : null;
    for (let i = 0; i < 2; i++) { const q = plateAt(C, i), X = FX.sx(q[0]), Y = FX.sy(q[1]), r = PLATE_R * T, hi = W && highOf(W.s) === i, lo = W && !hi, pul = 0.6 + 0.4 * Math.sin(t * 5);
      c.save(); c.globalCompositeOperation = 'lighter';
      if (hi) { c.globalAlpha = 0.3 + 0.15 * pul; blitSized(c, glowSprite(GOLD), X - r * 1.3, Y - r * 1.3, r * 2.6, r * 2.6); softRing(c, X, Y, r * 0.96, T * 0.3, GOLD, 0.6 + 0.2 * pul); }
      else { c.globalAlpha = lo ? 0.12 : 0.18 + 0.06 * Math.sin(t * 1.3 + i); blitSized(c, glowSprite(MS), X - r, Y - r, r * 2, r * 2); }
      if (p && !M.panFx[i] && (hi || (M.panW[i] && m.stunT > 0))) { const pq = p.g(...panLocal(M, p, i ? 1 : -1)); c.globalAlpha = hi ? 0.32 + 0.12 * pul : 0.3; softBeam(c, X, Y, FX.sx(pq[0]), FX.sy(pq[1]) + T * 0.6, T * 1.6, hi ? GOLD_HI : MS_HI); }
      c.restore();
      if (lo) label(c, 'LOW', X, Y + r * 0.15, Math.round(T * 0.5), '#C9D2F0', 0.55); }
    drawGrind(c, FX, T, t); drawArrows(c, FX, T, t); drawSweep(c, FX, T, t);
    // the weights on the floor, waiting to be carried
    M.weights.forEach(w => { if (w.st !== 'ground') return; const X = FX.sx(w.x), Y = FX.sy(w.y), pul = 0.6 + 0.4 * Math.sin(t * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.3 * pul; blitSized(c, glowSprite(GOLD), X - T * 1.5, Y - T * 1.5, T * 3, T * 3); c.restore();
      softRing(c, X, Y, PICK_R * T * (0.95 + 0.05 * pul), T * 0.14, GOLD_HI, 0.75);
      weightIcon(c, X, Y - T * 0.3, T * 0.95, 1, t); timerRing(c, X, Y - T * 0.35, T * 0.78, w.life / w.TL, t); label(c, 'TAKE', X, Y - T * 1.55, Math.round(T * 0.46), GOLD_HI, 0.85); }); }
  // the low edge grinding while the hall is tilted: soft red light along it, moonstone teeth rising from the rim
  function drawGrind(c, FX, T, t) { const M = FX.mem, Tl = M.tl, C = FX.C; if (!Tl) return; const live = !Tl.calm, u = live ? 1 : clamp(Tl.t / Tl.warn, 0, 1) * 0.7, s = Tl.s;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let y = C.y + CHORD + 0.8; y < C.y + ARENA; y += 1.8) { const xe = Math.sqrt(Math.max(0, ARENA * ARENA - (y - C.y) ** 2)); if (xe < EDGE + 0.5) continue; const xm = C.x + s * (EDGE + xe) / 2, wd = (xe - EDGE); c.globalAlpha = (0.2 + 0.1 * Math.sin(t * 7 + y)) * u; blitSized(c, glowSprite(HOSTILE), FX.sx(xm) - wd * T * 0.75, FX.sy(y) - T * 1.6, wd * T * 1.5, T * 3.2); }
    c.restore();
    // its boundary: a soft dashed line, and teeth along the rim
    c.save(); c.lineCap = 'round'; const x0 = FX.sx(C.x + s * EDGE), y0 = FX.sy(C.y + CHORD + 0.5), y1 = FX.sy(C.y + Math.sqrt(ARENA * ARENA - EDGE * EDGE) - 0.3);
    [[0.45, 0.12], [0.22, 0.25], [0.09, 0.8]].forEach(([w, a]) => { c.globalAlpha = a * u; c.strokeStyle = HOSTILE; c.lineWidth = Math.max(1, w * T); c.setLineDash([T * 0.6, T * 0.45]); c.lineDashOffset = -t * T * 2 * (live ? 1 : 0.3); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.stroke(); }); c.setLineDash([]); c.restore();
    for (let k = 0; k < 22; k++) { const a = -0.55 + k / 21 * 1.75, ang = s > 0 ? a : Math.PI - a, x = C.x + Math.cos(ang) * (ARENA - 0.35), y = C.y + Math.sin(ang) * (ARENA - 0.35); if (y < C.y + CHORD + 0.3) continue; const X = FX.sx(x), Y = FX.sy(y), h = T * (0.35 + 0.35 * hr(k)) * (live ? 0.75 + 0.25 * Math.sin(t * 18 + k) : u * 0.8);
      if (h < 2) continue; c.fillStyle = mixC(MS, '#FFD0DA', 0.3); c.strokeStyle = LINE; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X - T * 0.16, Y); c.lineTo(X + (hr(k + 3) - 0.5) * T * 0.15, Y - h); c.lineTo(X + T * 0.16, Y); c.closePath(); c.fill(); c.stroke(); }
    if (!live) label(c, s > 0 ? 'LOW SIDE →' : '← LOW SIDE', FX.sx(FX.me.x + s * 3.4), FX.sy(FX.me.y) - T * 1.9, Math.round(T * 0.55), HOSTILE, 0.7 + 0.3 * Math.sin(t * 8)); }
  // the hall's pull: big soft chevrons on the plates round the pet, drifting the way it drags
  function drawArrows(c, FX, T, t) { const M = FX.mem, A = M.arrow, me = FX.me, C = FX.C; if (A.k < 0.03) return; const ux = A.ux, uy = A.uy, sp = 3.4, ph = (t * (A.warn ? 0.8 : 2.2)) % sp, px = -uy, py = ux;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; const pul = A.warn ? 0.55 + 0.45 * Math.sin(t * 7) : 1;
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
      // (a grid fixed to the hall and scrolling along the pull)
      const ax = Math.round(me.x / sp) * sp + (i * px + j * ux) * sp + ux * ph, ay = Math.round(me.y / sp) * sp + (i * py + j * uy) * sp + uy * ph; if (!onFloor(C, ax, ay, 0.8)) continue;
      const d = Math.hypot(ax - me.x, ay - me.y), fade = clamp(1.15 - d / 8.5, 0, 1) * clamp(Math.min(ph / 0.8, (sp - ph) / 0.8) + 0.4, 0, 1); if (fade < 0.04) continue;
      const X = FX.sx(ax), Y = FX.sy(ay), s = T * 1.0, tip = [X + ux * s, Y + uy * s], b1 = [X - ux * s * 0.2 + px * s * 0.9, Y - uy * s * 0.2 + py * s * 0.9], b2 = [X - ux * s * 0.2 - px * s * 0.9, Y - uy * s * 0.2 - py * s * 0.9];
      [[1.1, 0.07, '#1E2460'], [0.7, 0.1, '#1E2460'], [0.55, 0.2, PULLC], [0.3, 0.62, '#FFFFFF']].forEach(([w, a, col]) => { c.globalAlpha = Math.min(1, a * A.k * fade * pul); c.strokeStyle = col; c.lineWidth = w * T; c.beginPath(); c.moveTo(b1[0], b1[1]); c.lineTo(tip[0], tip[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }); }
    c.restore(); }
  // the ring sweep: while it waits, where it will roll (faint ripples) and the glowing gap (a safe lane); then the ring itself
  function drawSweep(c, FX, T, t) { const M = FX.mem, W = M.sw, S = W && W.cur; if (!S) return; const X = FX.sx(S.cx), Y = FX.sy(S.cy), u = clamp(S.t / S.warn, 0, 1), RMAX = 18;
    const segs = [[S.a0, S.g - S.gw], [S.g + S.gw, S.a1]];
    c.save();
    if (!S.rolled) {
      // ripples of where it will roll, in the hostile red, fading out with distance
      for (let k = 0; k < 5; k++) { const rr = (4 + k * 3 + (t * 3) % 3) * T, a = (0.55 - k * 0.07) * (0.5 + 0.5 * u); segs.forEach(([a0, a1]) => softRing(c, X, Y, rr, T * 0.26, HOSTILE, a, a0, a1)); }
      // the safe lane: soft mint light down the gap, chevrons running out along it
      c.globalCompositeOperation = 'lighter';
      for (let k = 1; k <= 7; k++) { const rr = k * 2.3, gx = X + Math.cos(S.g) * rr * T, gy = Y + Math.sin(S.g) * rr * T, wd = Math.max(1.2, rr * S.gw * 2) * T; c.globalAlpha = (0.45 + 0.15 * Math.sin(t * 5 - k)) * (0.6 + 0.4 * u); blitSized(c, glowSprite(SAFE), gx - wd * 0.7, gy - wd * 0.7, wd * 1.4, wd * 1.4); }
      c.globalCompositeOperation = 'source-over';
      [S.g - S.gw, S.g + S.gw].forEach(a => { [[0.42, 0.1], [0.22, 0.22], [0.09, 0.45]].forEach(([w, al]) => { c.globalAlpha = al * (0.6 + 0.4 * u); c.strokeStyle = SAFE; c.lineWidth = Math.max(1, w * T); c.lineCap = 'round'; c.beginPath(); c.moveTo(X + Math.cos(a) * 3.5 * T, Y + Math.sin(a) * 3.5 * T); c.lineTo(X + Math.cos(a) * RMAX * T, Y + Math.sin(a) * RMAX * T); c.stroke(); }); });
      c.globalAlpha = 1; const lr = clamp(Math.hypot(FX.me.x - S.cx, FX.me.y - S.cy) + 2.8, 5, 13); label(c, 'GAP', X + Math.cos(S.g) * lr * T, Y + Math.sin(S.g) * lr * T - T * 0.9, Math.round(T * 0.52), SAFE, 0.7 + 0.3 * Math.sin(t * 6));
      // the ring settling onto the floor round the engine
      segs.forEach(([a0, a1]) => softRing(c, X, Y, S.r * T, T * 0.5, MS_HI, 0.5 * u, a0, a1)); }
    else { const R = S.r * T, w = S.w * T;
      c.globalCompositeOperation = 'lighter'; segs.forEach(([a0, a1]) => { softRing(c, X, Y, R, w * 1.4, HOSTILE, 0.35, a0, a1); softRing(c, X, Y, R, w * 0.9, MS_HI, 0.5, a0, a1); }); c.globalCompositeOperation = 'source-over';
      // the ring: a moonstone hoop sliding on its side, a gold seam, runes
      segs.forEach(([a0, a1]) => { c.lineCap = 'round'; c.strokeStyle = LINE; c.lineWidth = w * 0.62 + 3; c.beginPath(); c.arc(X, Y, R, a0, a1); c.stroke(); c.strokeStyle = MS; c.lineWidth = w * 0.62; c.stroke(); c.strokeStyle = MS_HI; c.lineWidth = w * 0.2; c.beginPath(); c.arc(X, Y - w * 0.12, R, a0, a1); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.arc(X, Y, R, a0, a1); c.stroke();
        c.fillStyle = '#FFFFFF'; for (let a = a0 + 0.04; a < a1; a += 2.2 / Math.max(4, S.r)) { c.beginPath(); c.arc(X + Math.cos(a) * R, Y + Math.sin(a) * R, Math.max(1.2, T * 0.06), 0, TAU); c.fill(); } }); }
    c.restore(); }

  /* ---- the rim's floating boulders and the two gravity rings ---- */
  function drawBoulder(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, lift = (M.lift || 0) * (2.5 + hr(p.i) * 2.5), z = 1.1 + Math.sin(t * 0.55 + p.i * 1.7) * 0.28 + lift, r = p.s * T * 1.15, yy = Y - z * T;
    FX0.shade(c, X, Y, r * 0.9 / (1 + z * 0.2), r * 0.3 / (1 + z * 0.2), 0.2, '#05050F');
    c.save(); c.strokeStyle = rgba(MS, 0.3); c.lineWidth = 1.5; c.setLineDash([3, 6]); c.beginPath(); c.moveTo(X, Y - T * 0.1); c.lineTo(X, yy + r * 0.6); c.stroke(); c.restore();
    const R = mulberry32(31 + p.i * 17), pts = []; for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, k = 0.8 + R() * 0.28; pts.push([X + Math.cos(a) * r * k, yy + Math.sin(a) * r * k * 0.72]); }
    TN.shape(c, TN.blob(pts), { col: '#646A92', shade: '#3E4270', hi: '#9AA2CC', line: LINE, lw: Math.max(1.3, T * 0.06), r, d1: 0.12, d2: 0.26, spec: false, force: true,
      inner: g => { for (let i = 0; i < 3; i++) { const cx = X + (R() - 0.5) * r * 1.1, cy = yy + (R() - 0.6) * r * 0.6, cr = r * (0.1 + R() * 0.1); g.fillStyle = 'rgba(30,32,60,.35)'; g.beginPath(); g.ellipse(cx, cy, cr, cr * 0.5, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy, cr, cr * 0.5, 0, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
        // a vein of moonstone crystal in it
        g.fillStyle = MS_HI; g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.moveTo(X - r * 0.2, yy - r * 0.42); g.lineTo(X - r * 0.05, yy - r * 0.95); g.lineTo(X + r * 0.12, yy - r * 0.4); g.closePath(); g.fill(); g.stroke(); } });
    FX0.glow(c, X - r * 0.05, yy - r * 0.6, r * 0.8, MS_HI, 0.3); }
  function drawGravRing(c, FX, p, X, Y, T, t) { const z = 2.6 + Math.sin(t * 0.4 + p.i * 2) * 0.2, cx = X, cy = Y - z * T, lw = Math.max(1.3, T * 0.06);
    FX0.glow(c, cx, cy, T * 2.4, MS, 0.35);
    for (let k = 0; k < 2; k++) { const rot = t * (0.3 + k * 0.17) * (p.i ? 1 : -1) + k * 1.2, rx = T * (1.7 - k * 0.35), ry = rx * (0.35 + 0.3 * Math.abs(Math.sin(t * 0.25 + k + p.i))); c.save(); c.translate(cx, cy); c.rotate(rot);
      c.lineWidth = T * 0.16 + lw * 2; c.strokeStyle = LINE; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.stroke(); c.lineWidth = T * 0.16; c.strokeStyle = SIL; c.stroke(); c.lineWidth = T * 0.05; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, -T * 0.03, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.restore(); }
    FX0.glow(c, cx, cy, T * 0.9, MS_HI, 0.8); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(cx, cy, T * 0.14, 0, TAU); c.fill(); }

  /* ---- the Balance Hall: rings of moonstone plates on an island in the hollow, the two plate-circles, the north edge ---- */
  function floorPath(c) { const a0 = Math.asin(clamp(CHORD / ARENA, -1, 1)); c.beginPath(); c.arc(0, 0, ARENA, a0, Math.PI - a0); c.closePath(); }
  function paintHall(c, A) { const R = A.R, rnd = A.rnd, E = R + 1.5;
    // the void: deep indigo, fading out at the edges into the backdrop, motes and faint rings of the pull
    let g = c.createRadialGradient(0, -2, 4, 0, 0, E * 1.05); g.addColorStop(0, '#120E30'); g.addColorStop(0.75, '#0E0B26'); g.addColorStop(1, 'rgba(12,10,30,0)'); c.fillStyle = g; c.fillRect(-E, -E, E * 2, E * 2);
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const x = (rnd() * 2 - 1) * E, y = -E + rnd() * 8, r = 3 + rnd() * 4; const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, 'rgba(90,110,210,.16)'); gg.addColorStop(1, 'rgba(90,110,210,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); } c.restore();
    c.strokeStyle = 'rgba(169,200,240,.1)'; c.lineWidth = 0.08; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(0, CHORD - 1.5, 6 + i * 3.2, 1.6 + i * 0.8, 0, Math.PI, TAU); c.stroke(); }
    for (let i = 0; i < 90; i++) { const x = (rnd() * 2 - 1) * E, y = (rnd() * 2 - 1) * E; if (Math.hypot(x, y) < R + 0.4 && y > CHORD) continue; c.fillStyle = `rgba(210,225,255,${0.15 + rnd() * 0.45})`; c.beginPath(); c.arc(x, y, 0.03 + rnd() * 0.06, 0, TAU); c.fill(); }
    // the island's south face: a thick ledge of moonstone falling away, crystals hanging under it
    const a0 = Math.asin(clamp(CHORD / R, -1, 1)), face = []; for (let j = 0; j <= 40; j++) { const a = lerp(a0, Math.PI - a0, j / 40); face.push([Math.cos(a) * R, Math.sin(a) * R]); }
    c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); face.forEach(([x, y], j) => j ? c.lineTo(x, y + 1.6) : c.moveTo(x, y + 1.6)); face.slice().reverse().forEach(([x, y]) => c.lineTo(x, y + 0.5)); c.closePath(); c.fill();
    g = c.createLinearGradient(0, R - 1, 0, R + 1.3); g.addColorStop(0, '#5A6298'); g.addColorStop(1, '#2A2C58'); c.fillStyle = g; c.beginPath(); face.forEach(([x, y], j) => j ? c.lineTo(x, y + 1.1) : c.moveTo(x, y + 1.1)); face.slice().reverse().forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,22,52,.5)'; c.lineWidth = 0.05; for (let j = 2; j < 40; j += 3) { const [x, y] = face[j]; c.beginPath(); c.moveTo(x, y + 0.05); c.lineTo(x + (rnd() - 0.5) * 0.3, y + 1.05); c.stroke(); }
    for (let j = 1; j < 40; j += 2) { const [x, y] = face[j]; if (rnd() < 0.4) continue; const h = 0.3 + rnd() * 0.7, w = 0.12 + rnd() * 0.12; c.fillStyle = rnd() < 0.5 ? '#8EA8E0' : '#6E86C4'; c.beginPath(); c.moveTo(x - w, y + 1.05); c.lineTo(x, y + 1.05 + h); c.lineTo(x + w, y + 1.05); c.closePath(); c.fill(); }
    // the plates: rings round the hall's heart, each plate its own pale tone with a lit bevel and dark seams
    c.save(); floorPath(c); c.clip();
    c.fillStyle = '#7C86BA'; c.fillRect(-R, -R, R * 2, R * 2);
    const tones = ['#8A95C8', '#929DCE', '#848FC2', '#99A4D3', '#8C96C6'], RS = [0, 2.3, 4.5, 6.8, 9.1, 11.4, 13.7, 16];
    for (let k = 0; k < RS.length - 1; k++) { const r0 = RS[k], r1 = RS[k + 1], n = k === 0 ? 1 : Math.max(6, Math.round(TAU * (r0 + r1) / 2 / 2.7)), off = rnd() * TAU;
      for (let j = 0; j < n; j++) { const b0 = off + j / n * TAU + 0.012, b1 = off + (j + 1) / n * TAU - 0.012;
        c.fillStyle = tones[Math.floor(rnd() * tones.length)]; c.beginPath(); if (k === 0) c.arc(0, 0, r1 - 0.05, 0, TAU); else { c.arc(0, 0, r1 - 0.05, b0, b1); c.arc(0, 0, r0 + 0.05, b1, b0, true); c.closePath(); } c.fill();
        if (k > 0) { c.strokeStyle = 'rgba(235,242,255,.32)'; c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, r1 - 0.1, b0 + 0.02, b1 - 0.02); c.stroke(); c.strokeStyle = 'rgba(40,44,96,.35)'; c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, r0 + 0.1, b0 + 0.02, b1 - 0.02); c.stroke();
          // a few soft clouds of tone and specks in the stone
          for (let q = 0; q < 2; q++) { const a = lerp(b0, b1, rnd()), rr = lerp(r0, r1, rnd()), x = Math.cos(a) * rr, y = Math.sin(a) * rr, s = 0.3 + rnd() * 0.6; const gg = c.createRadialGradient(x, y, 0, x, y, s); gg.addColorStop(0, rnd() < 0.5 ? 'rgba(255,255,255,.14)' : 'rgba(40,44,100,.14)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - s, y - s, s * 2, s * 2); } } } }
    c.strokeStyle = 'rgba(40,42,92,.6)'; c.lineWidth = 0.07; for (let k = 1; k < RS.length - 1; k++) { c.beginPath(); c.arc(0, 0, RS[k], 0, TAU); c.stroke(); }
    // silver inlay rings and a constellation scattered in gold
    c.strokeStyle = 'rgba(232,238,250,.55)'; c.lineWidth = 0.08; for (const r of [RS[2], RS[5]]) { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
    c.strokeStyle = 'rgba(232,196,106,.55)'; c.lineWidth = 0.05; c.fillStyle = 'rgba(255,240,184,.8)';
    for (let s = 0; s < 4; s++) { let x = (rnd() * 2 - 1) * 9, y = 1 + rnd() * 10; if (Math.hypot(x, y) > 12) continue; c.beginPath(); c.moveTo(x, y); const st = [[x, y]]; for (let j = 0; j < 4; j++) { x += (rnd() - 0.5) * 3; y += (rnd() - 0.5) * 2.4; st.push([x, y]); c.lineTo(x, y); } c.stroke(); st.forEach(([sx, sy]) => { c.beginPath(); c.arc(sx, sy, 0.09, 0, TAU); c.fill(); }); }
    // the heart of the hall: a gold balance inlaid in a rune circle
    c.strokeStyle = 'rgba(232,196,106,.7)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, 2.0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-1.3, -0.5); c.lineTo(1.3, -0.5); c.moveTo(0, -1.2); c.lineTo(0, 1.1); c.moveTo(-0.6, 1.1); c.lineTo(0.6, 1.1); c.stroke();
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 1.3, -0.5); c.lineTo(sd * 0.95, 0.3); c.moveTo(sd * 1.3, -0.5); c.lineTo(sd * 1.65, 0.3); c.stroke(); c.beginPath(); c.arc(sd * 1.3, 0.3, 0.42, 0, Math.PI); c.closePath(); c.stroke(); }
    c.fillStyle = 'rgba(232,196,106,.6)'; for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; c.beginPath(); c.arc(Math.cos(a) * 1.65, Math.sin(a) * 1.65, j % 3 ? 0.05 : 0.09, 0, TAU); c.fill(); }
    // moonstone chips and hairline cracks
    for (let i = 0; i < 26; i++) { const x = (rnd() * 2 - 1) * 12, y = CHORD + rnd() * 20; if (Math.hypot(x, y) > R - 1) continue; c.save(); c.translate(x, y); c.rotate(rnd() * 3); c.fillStyle = 'rgba(200,220,255,.6)'; c.beginPath(); c.moveTo(0, -0.18); c.lineTo(0.09, 0); c.lineTo(0, 0.12); c.lineTo(-0.09, 0); c.closePath(); c.fill(); c.restore(); }
    c.strokeStyle = 'rgba(40,44,96,.4)'; c.lineWidth = 0.04; for (let i = 0; i < 10; i++) { let x = (rnd() * 2 - 1) * 11, y = CHORD + 1 + rnd() * 18; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rnd() - 0.5) * 1.4; y += (rnd() - 0.5) * 1.4; c.lineTo(x, y); } c.stroke(); }
    // the plate-circles: raised discs of polished moonstone, a silver rim, a rune ring and a pan in gold at their heart
    PLATES.forEach(([x, y], i) => { const r = PLATE_R;
      c.fillStyle = 'rgba(20,20,60,.35)'; c.beginPath(); c.ellipse(x + 0.12, y + 0.22, r + 0.1, r, 0, 0, TAU); c.fill();
      g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, 0.2, x, y, r); g.addColorStop(0, '#D6E2FF'); g.addColorStop(0.6, '#A8B8EA'); g.addColorStop(1, '#8496D4'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.strokeStyle = '#2A2E66'; c.lineWidth = 0.12; c.stroke(); c.strokeStyle = '#E8EEFA'; c.lineWidth = 0.14; c.beginPath(); c.arc(x, y, r - 0.16, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(42,46,102,.45)'; c.lineWidth = 0.05; c.beginPath(); c.arc(x, y, r - 0.5, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(60,70,150,.55)'; for (let j = 0; j < 16; j++) { const a = j / 16 * TAU; c.save(); c.translate(x + Math.cos(a) * (r - 0.34), y + Math.sin(a) * (r - 0.34)); c.rotate(a + Math.PI / 2); if (j % 2) c.fillRect(-0.05, -0.1, 0.1, 0.2); else { c.beginPath(); c.arc(0, 0, 0.08, 0, TAU); c.fill(); } c.restore(); }
      c.strokeStyle = 'rgba(232,196,106,.85)'; c.lineWidth = 0.09; c.beginPath(); c.arc(x, y - 0.1, 0.9, 0.1, Math.PI - 0.1); c.stroke(); c.beginPath(); c.moveTo(x - 0.88, y); c.lineTo(x, y - 1.0); c.lineTo(x + 0.88, y); c.stroke(); c.beginPath(); c.arc(x, y - 1.05, 0.13, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.45, r * 0.32, r * 0.12, -0.5, 0, TAU); c.fill(); });
    // under the engine: a dark dais of moonstone at the edge, a rune circle its keel points to
    g = c.createRadialGradient(-0.6, MY - 0.8, 0.3, 0, MY, 2.6); g.addColorStop(0, '#A4B2E4'); g.addColorStop(1, '#6C78B2'); c.fillStyle = g; c.beginPath(); c.arc(0, MY, 2.6, 0, TAU); c.fill(); c.strokeStyle = '#2A2E66'; c.lineWidth = 0.1; c.stroke(); c.strokeStyle = 'rgba(232,238,250,.6)'; c.lineWidth = 0.1; c.beginPath(); c.arc(0, MY, 2.4, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(169,200,240,.7)'; c.lineWidth = 0.06; c.beginPath(); c.arc(0, MY, 1.6, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(226,238,255,.7)'; for (let j = 0; j < 10; j++) { const a = j / 10 * TAU; c.beginPath(); c.arc(Math.cos(a) * 2.0, MY + Math.sin(a) * 2.0, 0.07, 0, TAU); c.fill(); }
    c.restore();
    // the rim: a silver edge round the island, brighter along the north lip where it falls into the void
    c.lineJoin = 'round'; floorPath(c); c.strokeStyle = '#2A2C5A'; c.lineWidth = 0.18; c.stroke(); floorPath(c); c.strokeStyle = 'rgba(226,234,252,.7)'; c.lineWidth = 0.07; c.stroke();
    const xc = Math.sqrt(R * R - CHORD * CHORD); c.strokeStyle = 'rgba(169,200,240,.8)'; c.lineWidth = 0.12; c.beginPath(); c.moveTo(-xc + 0.2, CHORD + 0.1); c.lineTo(xc - 0.2, CHORD + 0.1); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; g = c.createLinearGradient(0, CHORD - 2.2, 0, CHORD); g.addColorStop(0, 'rgba(120,150,240,0)'); g.addColorStop(1, 'rgba(120,150,240,.22)'); c.fillStyle = g; c.beginPath(); c.moveTo(-xc, CHORD); c.lineTo(xc, CHORD); c.lineTo(xc * 0.8, CHORD - 2.2); c.lineTo(-xc * 0.8, CHORD - 2.2); c.closePath(); c.fill(); c.restore(); }
  /* the hollow over the hall: indigo dark, vast moonstone ribs of the cavern, far boulders, the silver rings of the pull */
  function paintSky(c, W, H, t, cam, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#07061A'); g.addColorStop(0.45, '#110D2E'); g.addColorStop(1, '#0B0920'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(83); c.save();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; blitSized(c, glowSprite('#4A5AC8'), -W * 0.2, H * 0.02, W * 1.4, H * 0.45); c.globalAlpha = 0.12; blitSized(c, glowSprite('#A9C8F0'), W * 0.2, -H * 0.05, W * 0.6, H * 0.3); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // the cavern's ribs: great pale arches of moonstone, lost in the dark
    for (let i = 0; i < 4; i++) { const sd = i % 2 ? 1 : -1, x0 = W / 2 + sd * W * (0.55 + i * 0.12), w = 26 + i * 8; c.globalAlpha = 0.35 - i * 0.05; c.strokeStyle = '#3A4280'; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, H * 0.75); c.quadraticCurveTo(x0 - sd * W * 0.1, H * 0.05, W / 2 - sd * W * 0.08, -H * 0.05); c.stroke(); c.globalAlpha *= 0.6; c.strokeStyle = '#7A90D8'; c.lineWidth = w * 0.15; c.stroke(); }
    c.globalAlpha = 1;
    // silver rings of the pull, far off
    for (let i = 0; i < 3; i++) { const x = W * (0.2 + i * 0.3), y = H * (0.12 + (i % 2) * 0.08), rx = 40 + i * 16; c.save(); c.translate(x, y); c.rotate(-0.3 + i * 0.35); c.strokeStyle = 'rgba(217,222,232,.22)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, rx, rx * 0.3, 0, 0, TAU); c.stroke(); c.restore(); }
    // far boulders drifting in the hollow
    for (let i = 0; i < 9; i++) { const x = R() * W, y = H * (0.05 + R() * 0.5), s = 8 + R() * 22; c.fillStyle = 'rgba(32,30,70,.9)'; c.beginPath(); for (let j = 0; j < 9; j++) { const a = j / 9 * TAU, k = 0.8 + R() * 0.3; j ? c.lineTo(x + Math.cos(a) * s * k, y + Math.sin(a) * s * k * 0.7) : c.moveTo(x + Math.cos(a) * s * k, y + Math.sin(a) * s * k * 0.7); } c.closePath(); c.fill(); c.strokeStyle = 'rgba(169,200,240,.3)'; c.lineWidth = 1.5; c.stroke(); }
    for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(210,225,255,${0.2 + R() * 0.5})`; c.beginPath(); c.arc(R() * W, R() * H, R() < 0.15 ? 1.4 : 0.7, 0, TAU); c.fill(); }
    c.restore(); }
})());
