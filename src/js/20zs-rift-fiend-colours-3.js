/* ---------- CHROMATICA, THE COLOUR WITHOUT A NAME ----------
   The Sea of Fallen Colours' last boss, in the Drained Lake: the colour that fell from between the stars came down into a
   lake, and a round floor of pale stone some thirty metres across stands over it, dark and drained grey; the lake round
   it is a dead grey mirror.
   Chromatica is the colour itself, closed up: a perfect dark sphere five metres across hovering a metre over a well in
   the floor, matte and almost light-absorbing, crossed by three broad angular fissures. Two thick crescent ribbons orbit
   it on different tilted planes, amber outside and cyan inside, both with pale edges; it turns slowly against them. When
   it attacks, the fissure that faces you opens into a geometric eye.
   I   Orbital Cut (above 70%): one ribbon flies out along a marked band round it and sweeps it: step inside or outside
       the band. The ribbon comes back slowly, and while it is away the sphere is UNGUARDED.
       Draining Drops: drained colour falls on shown circles and pools grey for a while.
   II  Chromatic Burden (70% to 35%): the pet is marked SUN (amber) or MOON (cyan) and one opposite mote falls somewhere
       reachable (never inside an unresolved hazard: a circle still to strike, a band, a grey pool). Carry it to one of
       the four beacons before the next pulse; a clean neutralise leaves its eye open, a weak point x2.5. Too late, the
       mark bursts on the pet.
   III Conjunction (below 35%): a third, broken white ring rises round it: the countdown. Three symbols appear over the
       sphere in order: a ribbon sweep, a mark detonation and a straight eye beam, each with its arc of the ring.
       Neutralising the mark raises a small shield at that beacon; standing behind it, the eye beam is turned back on
       itself and the eye is blinded, open (x2.5).
   The big mechanics are sequenced, never stacked. Its fall hands over to the rift's sealing: the comet's fissure closes
   into a white star, and the lake gradually regains a reflective blue surface. */
RiftFiend.define({ id: 'chromatica', name: 'Chromatica', title: 'The Colour Without a Name', color: '#1A1A30', glow: '#E8E0FF', accent: '#FFFFFF', biome: 'huedeep', r: 2.6, els: ['light', 'dark'], phases: 3, cuts: [1, 0.7, 0.35] }, (() => {
  const { TAU, TN } = RiftFiend, K = DunFiend.KIT, { UNSEEN, UNSEEN2 } = COL;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u, smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const sf = (FX, k) => { const s = FX.H.sfx; if (s && s[k]) s[k](); };
  const LINE = '#090912', WHITE = '#F6F2FF', GREY = '#A6A6B4', GOLD = '#FFE37A', ROSE = '#FF7A9A';
  /* the two colours it is torn between: amber (the sun) and cyan (the moon) */
  const AMB = { col: '#FFA53A', shade: '#D8761F', shade2: '#A85418', hi: '#FFD898', pale: '#FFF4DC', name: 'SUN' };
  const CYN = { col: '#4FD8F0', shade: '#2A9CC6', shade2: '#1C76A0', hi: '#BDF6FF', pale: '#EEFFFF', name: 'MOON' };
  const KIND = { sun: AMB, moon: CYN };
  /* the floor's radius, the well under the sphere, the sphere (radius, hover, its centre's height), the body camera's
     elevation (it is drawn as a true sphere: an orthographic view from a little above) */
  const FLOOR = 15, PIT = 2.7, SR = 2.5, HOV = 1.0, SZ = HOV + SR, EL = 0.36, CE = Math.cos(EL), SE = Math.sin(EL);
  /* the ribbons: orbit radius, width, plane tilt and yaw, the crescent's arc, spin speed, slab thickness */
  const RIB = [{ k: 0, C: AMB, R: 4.35, w: 1.15, tilt: -0.45, yaw: 0.25, arc: 4.4, v: 0.55, th: 0.26 }, { k: 1, C: CYN, R: 3.4, w: 0.95, tilt: 0.75, yaw: 2.2, arc: 4.0, v: 0.8, th: 0.22 }];
  const BEACONS = [[-8.4, -6.6], [8.4, -6.6], [-10.6, 1.8], [10.6, 1.8]], BEACON_R = 1.9, MOTE_R = 1.3, DET_R = 2.6, SHIELD_R = 1.5;
  const BAND_W = 3.2, RET = 3.4, PULSE = 9.5, RING3_R = 5.7, BEAM_W = 2.2;
  /* the Conjunction's clock (seconds): the symbols appear, the mark is given, the ribbon's band is shown and sweeps, the
     mark detonates, the beam is shown, locks and fires */
  const CJ = { sym: [0.3, 0.9, 1.5], mark: 1.0, cutAt: 2.8, cut: 5.0, det: 9.4, beam: 10.0, lock: 11.8, fire: 12.4, end: 13.4 };
  /* the three fissures, as [longitude, latitude] on the sphere; the first (the comet's fissure) is the one that opens */
  const FIS = [[[-1.0, 0.13], [-0.66, -0.07], [-0.33, 0.1], [0, -0.05], [0.33, 0.11], [0.66, -0.06], [1.0, 0.12]],
    [[1.75, 0.98], [1.98, 0.62], [2.3, 0.74], [2.55, 0.36], [2.86, 0.44], [3.12, 0.04]],
    [[3.85, -0.12], [4.1, -0.44], [4.42, -0.3], [4.72, -0.66], [5.02, -0.55], [5.3, -0.92]]];
  const CYC1 = ['cut', 'drops', 'cut', 'cut', 'drops'], CYC2 = ['burden', 'cut', 'drops', 'cut', 'burden', 'drops'], CYC3 = ['cut', 'drops', 'cut', 'conj', 'drops', 'cut', 'conj'];
  const ATTACKS = { cut: 1, drops: 1, burden: 1, conj: 1 };
  // the screen offset (in metres) of a body point a (east), b (toward the viewer), h (up) from the sphere's centre, and its depth
  const bx = (a) => a, by = (b, h) => b * SE - h * CE, bd = (b, h) => b * CE + h * SE;
  return {
    arenaR: 19, firstAct: 'hover', ambient: 'motes',
    artPoses: [{ name: 'hovering', mem: { demo: 1 } }, { name: 'its eye open', mem: { demo: 1, demoEye: 1 } }, { name: 'the final stage', mem: { demo: 1, demoRing: 1, demoEye: 1 } }],
    phaseNames: ['Orbital Cut', 'Chromatic Burden', 'Conjunction'],
    start(C) { return { x: C.x + 0.5, y: C.y + 9 }; },
    // the walkable ground is the round floor, less the well under the sphere and the beacons' feet
    carve(set, C) { const RR = Math.ceil(C.R) + 2; for (let y = -RR; y <= RR; y++) for (let x = -RR; x <= RR; x++) { const wx = Math.floor(C.x) + x, wy = Math.floor(C.y) + y, cx = wx + 0.5 - C.x, cy = wy + 0.5 - C.y, d = Math.hypot(cx, cy);
        if (d > FLOOR - 0.15 || d < PIT || BEACONS.some(B => Math.abs(cx - B[0]) < 0.5 && Math.abs(cy - B[1]) < 0.5)) set(wx, wy, T_SOLID); } },
    props(C) { return BEACONS.map((B, i) => ({ kind: 'beacon', i, x: C.x + B[0], y: C.y + B[1] + 0.3 })); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'beacon') drawBeacon(c, FX, p, X, Y, T, t); },
    paintGround(c, A) { paintFloor(c, A); },
    sky(c, W, H, t, cam, T, FX) { paintSky(c, W, H, !!(FX && FX.mem && FX.mem.blue > 0.5)); },
    skyKey(FX) { return FX.mem && FX.mem.blue > 0.5 ? 'blue' : 'drained'; },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    camFocus(FX, m) { const C = FX.C, M = FX.mem, me = FX.me; if (!M.P) return null;
      if (m.dead) return M.deadT != null && M.deadT < 4.6 ? { x: C.x, y: C.y - 4.5, k: 0.75, zoom: 0.46 } : null;
      if (m.act === 'enter') return { x: C.x, y: C.y - 5, k: 0.8, zoom: 0.44 };
      if (m.stunT > 0) return { x: C.x, y: C.y - 3.5, k: 0.5, zoom: 0.5 };
      // the Conjunction: between the pet and the sphere (its symbols and ring stay in view), closer in
      if (M.cj) return { x: C.x, y: C.y - 4.5, k: 0.55, zoom: 0.48 };
      // a mark to answer: close on the pet and following it, as in a dungeon (gold arrows point the way off screen)
      if (M.bur) return { x: me.x, y: me.y, k: 0, zoom: 0.7 };
      return { x: C.x, y: C.y - 3.5, k: 0.45, zoom: 0.5 }; },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.noTouch = true; m.touchK = 0;
      Object.assign(M, { bt: 0, q: [], qt: 0, seen: {}, picks: 0, nextSig: null, recoil: 0, why: null, wasStun: false, roared: false, actEnd: 0, spin: [0.4, 2.6], rot: 0, eye: 0, eyeWant: 0,
        rs: RIB.map(r => ({ st: 'home', out: 0, rad: r.R, rb: r.R, sweep: 0, t: 0, dir: 1, tele: null })), cut: null, cutN: 0, bur: null, markN: Math.random() < 0.5 ? 0 : 1, cj: null, shield: null, beamFx: null,
        bflash: BEACONS.map(() => 0), ring3K: 0, ringFill: [0, 0, 0], fisK: 1, star: 0, blue: 0, sink: 0, sigil: 0, lastMote: null, pulse: 0,
        stat: { cuts: 0, cutHit: 0, drops: 0, dropHit: 0, marks: 0, motes: 0, moteBad: 0, moteHz: 0, held: 0, neut: 0, clean: 0, det: 0, detHit: 0, shields: 0, beams: 0, beamHit: 0, blocked: 0, conj: 0, bared: 0 } });
      M.P = { wake: 0, rec: 0 }; m.x = C.x; m.y = C.y; },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; resetAll(FX, m); M.recoil = 1; FX.H.shake(10, 0.5); FX.H.flash(0.2, WHITE); sf(FX, 'hum');
      if (lv === 2) { M.nextSig = 'burden'; M.picks = 0; minions(FX, ['chromawraith', 'huewisp']); FX.H.banner('CHROMATIC BURDEN', 'It marks you SUN or MOON: carry the opposite mote to a beacon before the next pulse', GOLD, 2.8, true); }
      if (lv >= 3) { M.nextSig = 'conj'; M.picks = 0; minions(FX, ['prismray', 'greyling']); FX.H.banner('THE THIRD RING', 'A broken white ring rises round it: it counts down what is shown over the sphere', WHITE, 2.8, true); } },
    ai(FX, m, dt) {
      const M = FX.mem, lv = FX.S.lv; m.actT += dt; m.noTouch = true;
      M.qt += dt; while (M.q.length && M.q[0].at <= M.qt) M.q.shift().fn();
      switch (m.act) {
        case 'hover': if (m.actT > (lv >= 3 ? 1.1 : lv >= 2 ? 1.35 : 1.6) / FX.S.fast) choose(FX, m); break;
        case 'cut': if (!M.cut || M.rs.every(r => r.st === 'home')) { M.cut = null; endAct(m); } break;
        case 'drops': case 'burden': if (!M.q.length && m.actT > M.actEnd && !FX.S.tele.some(s => s.ink === 'drop' && !s.done)) endAct(m); break;
        case 'conj': conjTick(FX, m, dt); break;
      }
      FX.parts(partsList(FX, m));
    },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; const e = eyeWorld(FX, m), on = (M.why === 'eye' || M.why === 'blind') && m.stunT > 0.05 && M.eye > 0.5;
      FX.weak('eye', e[0], e[1], 1.4, 2.5, on);
      M.shT = (M.shT || 0) - dt; if (M.shT <= 0) { M.shT = 0.35; FX.H.sparks(e[0] + FX.rnd(-0.8, 0.8), e[1] + FX.rnd(-0.6, 0.6), M.why === 'blind' ? GOLD : WHITE, 4, 3); }
      FX.parts(partsList(FX, m)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, me = FX.me, lv = FX.S.lv; if (!m || !M.P) return; M.bt += dt;
      M.recoil = decay(M.recoil, dt, 2.2); M.pulse = decay(M.pulse, dt, 1.4); for (let i = 0; i < M.bflash.length; i++) M.bflash[i] = decay(M.bflash[i], dt, 1.2);
      // the ribbons orbit one way; the body turns slowly the other, unless an eye is opening (the comet's fissure turns to face you)
      for (let k = 0; k < 2; k++) M.spin[k] += dt * RIB[k].v * (lv >= 3 ? 1.25 : 1) * (m.dead ? 0.4 : 1);
      const eyeOn = !m.dead && (ATTACKS[m.act] || M.cj || (m.stunT > 0 && (M.why === 'eye' || M.why === 'blind')));
      M.eyeWant = eyeOn ? 1 : 0;
      if (eyeOn) { const want = Math.PI / 2 + Math.round((M.rot - Math.PI / 2) / TAU) * TAU; M.rot = toward(M.rot, want, dt, 3.2); } else M.rot -= dt * 0.22 * (m.dead ? 0.3 : 1);
      const facing = Math.abs(K.angTo(M.rot, Math.PI / 2)) < 0.35;
      M.eye = toward(M.eye, eyeOn && facing ? 1 : 0, dt, eyeOn ? 5 : 3.5);
      ribbonsTick(FX, m, dt);
      if (m.dead) { deadTick(FX, m, dt); return; }
      if (!(m.stunT > 0)) { if (FX.S.weak.eye) FX.weak('eye', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.why = null; M.recoil = 1; FX.H.text(m.x, m.y - SZ - SR - 1, 'Its eye narrows again', WHITE, 13); sf(FX, 'hum'); } } else M.wasStun = true;
      if (m.act === 'enter' && (FX.S.enterT || 0) > 1.8 && !M.roared) { M.roared = true; M.recoil = 1; M.pulse = 1; FX.H.shake(10, 0.8); FX.H.flash(0.22, WHITE); sf(FX, 'hum'); }
      M.P.wake = toward(M.P.wake, m.act === 'enter' ? clamp(((FX.S.enterT || 0) - 0.2) / 2.4, 0, 1) : 1, dt, 3); M.P.rec = M.recoil;
      burdenTick(FX, m, dt);
      if (M.shield) M.shield.t += dt;
      if (M.beamFx) { M.beamFx.t += dt; if (M.beamFx.t > 0.55) M.beamFx = null; }
      // the third ring: risen in the final stage; during a Conjunction its three arcs fill as the countdown
      M.ring3K = toward(M.ring3K, lv >= 3 ? 1 : 0, dt, 1.2);
      if (M.cj) { const t = M.cj.t * FX.S.fast, seg = [[0, CJ.cut], [CJ.cut, CJ.det], [CJ.det, CJ.fire]]; M.ringFill = seg.map(([a, b]) => clamp((t - a) / (b - a), 0, 1)); }
      else for (let i = 0; i < 3; i++) M.ringFill[i] = decay(M.ringFill[i], dt, 1.5);
      if (me.dead && M.bur) M.bur = null; },
    // (the ribbons guard it: away on an Orbital Cut, it is unguarded)
    dmgK(FX, m) { const M = FX.mem; M.recoil = Math.max(M.recoil || 0, 0.4); return M.rs.some(r => r.st === 'ret' && r.out > 0.3) ? 1.5 : 0.75; },
    onWeakHit(FX) { FX.mem.recoil = 1; },
    draw(c, FX, m, X, Y, T, t) { Y += (m.z || 0) * T * 4; if (!(FX.S && FX.S.started)) { demoPaint(c, FX, m, X, Y, T); return; } paintBody(c, FX, m, X, Y, T, false); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.2 : 1.2, true); }
  function at(M, dt, fn) { M.q.push({ at: M.qt + dt, fn }); M.q.sort((a, b) => a.at - b.at); }
  function endAct(m) { m.act = 'hover'; m.actT = 0; }
  function onFloor(C, x, y, pad) { return Math.hypot(x - C.x, y - C.y) < FLOOR - (pad || 0); }
  function inside(C, x, y, pad) { const dx = x - C.x, dy = y - C.y, d = Math.hypot(dx, dy) || 1, R = FLOOR - (pad || 0), r0 = PIT + 1.2; return d > R ? { x: C.x + dx / d * R, y: C.y + dy / d * R } : d < r0 ? { x: C.x + dx / d * r0, y: C.y + dy / d * r0 } : { x, y }; }
  function minions(FX, types) { const C = FX.C, me = FX.me, alive = FX.H.mons.filter(q => !q.dead && q.fminion && !q.horde).length; types.slice(0, Math.max(0, 3 - alive)).forEach((ty, i) => { const a = Math.atan2(me.y - C.y, me.x - C.x) + Math.PI + (i - 0.5) * 1.1, p = inside(C, C.x + Math.cos(a) * 9, C.y + Math.sin(a) * 8, 2); FX.H.ring(p.x, p.y, 0.2, 1.4, 0.4, UNSEEN, 0.35); const q = FX.minion(ty, p.x, p.y); if (q) q.cd = 1.5; }); }
  function resetAll(FX, m) { const M = FX.mem; M.q.length = 0; FX.S.tele.length = 0; M.bur = null; M.cj = null; M.shield = null; M.cut = null; M.beamFx = null; for (const rs of M.rs) ribbonBack(FX, rs); FX.untarget(false); m.act = 'hover'; m.actT = 0; }
  function choose(FX, m) { const M = FX.mem, lv = FX.S.lv; m.actT = 0; let a = M.nextSig; M.nextSig = null;
    if (!a) { const cyc = lv >= 3 ? CYC3 : lv >= 2 ? CYC2 : CYC1; a = cyc[M.picks++ % cyc.length]; }
    // (one mark at a time; nothing new is begun while a ribbon is still on its way home)
    if (M.bur && (a === 'burden' || a === 'conj')) a = 'drops';
    if ((a === 'burden' && lv < 2) || (a === 'conj' && lv < 3)) a = 'cut';
    if (a === 'cut' && M.rs.some(r => r.st !== 'home')) a = 'drops';
    if (a === 'cut') return startCut(FX, m, false); if (a === 'burden') return startBurden(FX, m); if (a === 'conj') return startConj(FX, m); return startDrops(FX, m, M.bur ? 2 : lv >= 3 ? 5 : lv >= 2 ? 4 : 3, false); }
  // a stagger: its eye held open and in reach
  function bare(FX, m, why, secs) { const M = FX.mem; m.act = 'hover'; m.actT = 0; M.q.length = 0; m.stunT = secs; M.why = why; M.stat.bared++; FX.S.tele.length = 0; M.cj = null; M.cut = null; M.recoil = 1;
    for (const rs of M.rs) ribbonBack(FX, rs); FX.untarget(false); FX.H.shake(12, 0.6); sf(FX, 'crash'); }
  /* the body's frame now: how high its centre stands (it drops out of the sky as it wakes, and dwindles as it dies) */
  function frameOf(FX) { const M = FX.mem, P = M.P || { wake: 1 }, wake = smooth(P.wake), sk = M.sink || 0; return { lift: SZ + (1 - wake) * 15 + Math.sin((M.bt || 0) * 0.8) * 0.12 * wake + sk * 2.6, sc: 1 - smooth(sk) * 0.86, wake, a: (0.2 + 0.8 * wake) * (1 - smooth((sk - 0.55) / 0.45)) }; }
  // a point on the sphere (unit): longitude about the vertical (turned by the body's rotation), latitude up
  function sph(M, lon, lat) { const lo = lon + (M.rot || 0), cl = Math.cos(lat); return [cl * Math.cos(lo), cl * Math.sin(lo), Math.sin(lat)]; }
  // where the comet's eye is, as a point on the ground whose screen position is the eye's (for its weak point)
  function eyeWorld(FX, m) { const M = FX.mem, F = frameOf(FX), p = sph(M, 0, 0); return [m.x + bx(p[0]) * SR * F.sc, m.y + by(p[1], p[2]) * SR * F.sc - F.lift]; }
  /* the hit proxies: its body, struck anywhere */
  function partsList(FX, m) { const F = frameOf(FX); return [{ key: 'body', dx: 0, dy: -F.lift, r: 2.7 * F.sc }]; }

  /* ---- the ribbons: home on their orbits, or flown out along a band (an Orbital Cut), sweeping it, and home again ---- */
  function ribbonBack(FX, rs) { if (rs.st === 'out' || rs.st === 'strike') { rs.st = 'ret'; rs.t = 0; rs.rb = rs.rad; rs.retT = RET / FX.S.fast; } rs.tele = null; }
  function ribbonsTick(FX, m, dt) { const M = FX.mem;
    M.rs.forEach((rs, k) => { rs.t += dt; const R0 = RIB[k].R;
      if (rs.st === 'out') { const s = rs.tele; if (!s || !FX.S.tele.includes(s)) { ribbonBack(FX, rs); return; } const u = s.age / s.t; rs.out = toward(rs.out, u > 0.58 ? 1 : 0, dt, 7); rs.rad = lerp(R0, rs.rb, smooth(rs.out)); }
      else if (rs.st === 'strike') { rs.out = 1; rs.rad = rs.rb; rs.sweep = rs.dir * TAU * smooth(rs.t / 0.38); if (rs.t >= 0.38) { M.spin[k] += rs.sweep; rs.sweep = 0; rs.st = 'ret'; rs.t = 0; rs.retT = RET / FX.S.fast; } }
      else if (rs.st === 'ret') { const u = clamp(rs.t / (rs.retT || RET), 0, 1); rs.rad = lerp(rs.rb, R0, smooth(u)); rs.out = 1 - smooth((u - 0.5) / 0.5); if (u >= 1) { rs.st = 'home'; rs.out = 0; rs.rad = R0; } } }); }

  /* ---- Orbital Cut: a ribbon flies out along a marked band round it and sweeps it; it comes home slowly ---- */
  function startCut(FX, m, conj, Wt) { const M = FX.mem, me = FX.me, lv = FX.S.lv, f = FX.S.fast; if (!conj) { m.act = 'cut'; m.actT = 0; M.q.length = 0; }
    const d = clamp(Math.hypot(me.x - m.x, me.y - m.y), 5.4, 12.6), k0 = M.cutN++ % 2, list = [{ k: k0, rb: d }];
    // (in the final stage it sometimes sends both: two bands, a safe ring between and beyond them)
    if (lv >= 3 && !conj && M.cutN % 2 === 0) list.push({ k: 1 - k0, rb: clamp(d >= 9 ? d - 5.2 : d + 5.2, 4.6, 13) });
    Wt = Wt || (lv >= 3 ? 1.75 : 1.9) / f; M.cut = { conj, list };
    for (const L of list) { const r0 = L.rb - BAND_W / 2, r1 = L.rb + BAND_W / 2, cx = m.x, cy = m.y, rs = M.rs[L.k];
      const s = FX.tele({ shape: 'fn', kind: 'band', test: (px, py, rr) => { const dd = Math.hypot(px - cx, py - cy); return dd > r0 - (rr || 0) && dd < r1 + (rr || 0); }, x: cx, y: cy, r0, r1, rk: L.k, t: Wt, dmg: m.dmg * 1.35, col: RIB[L.k].C.col, ink: 'cut',
        fn: s => { M.stat.cuts++; const hit = FX.inShape(s, me.x, me.y, me.r); if (hit) M.stat.cutHit++; rs.st = 'strike'; rs.t = 0; rs.tele = null; FX.H.shake(9, 0.3); sf(FX, 'crash');
          if (M.cj && conj) { M.cj.fired[0] = M.cj.t; M.cj.res[0] = hit ? 'x' : 'ok'; } } });
      rs.st = 'out'; rs.t = 0; rs.rb = L.rb; rs.tele = s; rs.dir = Math.random() < 0.5 ? 1 : -1; }
    sf(FX, 'whoosh');
    if (!conj) say(FX, 'cut', list.length > 1 ? 'DOUBLE CUT' : 'ORBITAL CUT', list.length > 1 ? 'Both ribbons fly out along their bands: stand between or beyond them' : 'A ribbon flies out along the marked band: step inside or outside it', list.length > 1 ? WHITE : RIB[k0].C.col); }

  /* ---- Draining Drops: drained colour falls on shown circles, then pools grey for a while ---- */
  function startDrops(FX, m, n, quiet) { const M = FX.mem, me = FX.me, C = FX.C, f = FX.S.fast; if (m.act !== 'burden') { m.act = 'drops'; m.actT = 0; M.q.length = 0; }
    const pts = [];
    for (let k = 0; k < n; k++) { let p = null; for (let tr = 0; tr < 16 && !p; tr++) { const a = Math.random() * TAU, d = k === 0 ? 0.25 : 2.4 + Math.random() * 3.4, x = me.x + (k === 0 ? (me.vx || 0) * 0.3 : 0) + Math.cos(a) * d, y = me.y + (k === 0 ? (me.vy || 0) * 0.3 : 0) + Math.sin(a) * d;
        if (onFloor(C, x, y, 1.0) && Math.hypot(x - m.x, y - m.y) > PIT + 1.2 && pts.every(q => Math.hypot(q.x - x, q.y - y) > 2.7)) p = { x, y }; } if (p) pts.push(p); }
    pts.forEach((p, k) => { const r = 1.7, Wt = (1.3 + k * 0.2) / f;
      FX.tele({ shape: 'fn', kind: 'drop', test: (px, py, rr) => Math.hypot(px - p.x, py - p.y) < r + (rr || 0), x: p.x, y: p.y, r, t: Wt, dmg: m.dmg * 1.1, col: GREY, ink: 'drop',
        fn: s => { M.stat.drops++; if (FX.inShape(s, me.x, me.y, me.r)) M.stat.dropHit++; FX.H.ring(p.x, p.y, 0.2, r, 0.35, '#D8D8E4', 0.35); for (let i = 0; i < 7; i++) FX.H.part({ kind: 'spark', x: p.x + FX.rnd(-0.4, 0.4), y: p.y, vx: FX.rnd(-3, 3), vy: FX.rnd(-6, -2.5), g: 12, life: 0.55, max: 0.55, size: 3, color: i % 2 ? '#E2E2EA' : '#9A9AA8' }); sf(FX, 'thud');
          FX.hz({ x: p.x, y: p.y, r: 1.75, shape: 'circle', life: 4.6, dps: m.dmg * 0.22, tick: 0.4, slow: true, ink: 'pool', draw: drawPool }); } }); });
    M.actEnd = Math.max(m.act === 'burden' ? M.actEnd : 0, (1.3 + n * 0.2) / f + 0.4);
    if (!quiet) say(FX, 'drops', 'DRAINING DROPS', 'Drained colour falls on the shown circles and pools grey: stay out of both', '#E2E2EA'); }

  /* ---- Chromatic Burden: a mark on the pet, an opposite mote somewhere reachable, four beacons, a pulse ---- */
  function startBurden(FX, m) { const M = FX.mem, f = FX.S.fast; m.act = 'burden'; m.actT = 0; M.q.length = 0; M.actEnd = 1.4 / f;
    // (drops first: the mote that follows is never laid inside them)
    startDrops(FX, m, 3, true);
    at(M, 0.55 / f, () => { if (m.act === 'burden' && !M.bur) giveMark(FX, m, false, PULSE / f); }); }
  function inHazard(FX, x, y, pad) { const S = FX.S; return S.tele.some(s => !s.done && FX.inShape(s, x, y, pad)) || S.hz.some(z => FX.inShape(z, x, y, pad)); }
  // the opposite mote: some way from the pet, up the screen if it can be, on the floor, never inside an unresolved hazard
  function spawnMote(FX, m, kind) { const M = FX.mem, me = FX.me, C = FX.C, S = FX.S;
    const okAt = (x, y) => onFloor(C, x, y, 1.6) && Math.hypot(x - m.x, y - m.y) > PIT + 1.6 && BEACONS.every(B => Math.hypot(x - C.x - B[0], y - C.y - B[1]) > 2.4) && !inHazard(FX, x, y, 1.0);
    let best = null, bs = 1e9;
    // (best some three or four metres up the screen and to one side: in the upper half with the camera on the pet, but
    // below the band where the banners show, and clear of the buttons)
    for (const d of [5, 4.5, 5.5, 6.5, 7.5, 8.5]) for (let j = 0; j < 24; j++) { const a = j / 24 * TAU, x = me.x + Math.cos(a) * d, y = me.y + Math.sin(a) * d; if (!okAt(x, y)) continue;
      const ax = Math.abs(x - me.x), s = Math.abs(y - me.y + 3.4) * 1.2 + Math.max(0, 2.6 - ax) + Math.max(0, ax - 5.4) * 3 + Math.abs(d - 5) * 0.3; if (s < bs) { bs = s; best = { x, y }; } }
    for (let k = 0; k < 300 && !best; k++) { const a = Math.random() * TAU, d = PIT + 2 + Math.random() * (FLOOR - PIT - 4), x = C.x + Math.cos(a) * d, y = C.y + Math.sin(a) * d; if (okAt(x, y)) best = { x, y }; }
    if (!best) best = inside(C, me.x, me.y - 4, 2);
    const nHz = S.tele.filter(s => !s.done).length + S.hz.length, bad = inHazard(FX, best.x, best.y, 0);
    M.lastMote = { x: best.x, y: best.y, hz: nHz, bad, dx: best.x - me.x, dy: best.y - me.y }; M.stat.motes++; if (bad) M.stat.moteBad++; if (nHz) M.stat.moteHz++;
    FX.H.ring(best.x, best.y, 0.2, 1.3, 0.4, KIND[kind === 'sun' ? 'moon' : 'sun'].col, 0.35);
    return { x: best.x, y: best.y, st: 'lie', age: 0, kind: kind === 'sun' ? 'moon' : 'sun' }; }
  function giveMark(FX, m, conj, T) { const M = FX.mem, me = FX.me, kind = M.markN++ % 2 ? 'moon' : 'sun', Kc = KIND[kind], Ko = KIND[kind === 'sun' ? 'moon' : 'sun'];
    const mote = spawnMote(FX, m, kind); M.bur = { kind, t: 0, T, conj, mote }; M.stat.marks++;
    FX.H.ring(me.x, me.y, 0.3, 2.0, 0.4, Kc.col, 0.4); FX.H.sparks(me.x, me.y - 1, Kc.col, 12, 4); sf(FX, 'chime');
    if (!conj) say(FX, 'burden', 'CHROMATIC BURDEN', `You bear the ${Kc.name}: carry the ${Ko.name} mote to a beacon before the next pulse`, Kc.col);
    else FX.H.text(me.x, me.y - 2.6, `${Kc.name} MARK: the ${Ko.name} mote to a beacon`, Kc.col, 13); }
  function nearBeacon(FX, x, y, r) { const C = FX.C; let best = -1, bd2 = r; BEACONS.forEach((B, i) => { const d = Math.hypot(x - C.x - B[0], y - C.y - B[1] - 0.3); if (d < bd2) { bd2 = d; best = i; } }); return best; }
  function burdenTick(FX, m, dt) { const M = FX.mem, B = M.bur, me = FX.me; if (!B) return; B.t += dt; const mo = B.mote;
    if (mo.st === 'lie') { mo.age += dt; if (!me.dead && Math.hypot(me.x - mo.x, me.y - mo.y) < MOTE_R) { mo.st = 'held'; M.stat.held++; sf(FX, 'chime'); FX.H.sparks(me.x, me.y - 1, KIND[mo.kind].col, 10, 4); } }
    else if (mo.st === 'held') { mo.x = me.x; mo.y = me.y; const i = nearBeacon(FX, me.x, me.y, BEACON_R); if (i >= 0) return neutralise(FX, m, i); }
    if (B.t >= B.T) detonate(FX, m); }
  function neutralise(FX, m, i) { const M = FX.mem, B = M.bur, C = FX.C, P = BEACONS[i], x = C.x + P[0], y = C.y + P[1] + 0.3; M.bur = null; M.stat.neut++; M.bflash[i] = 1;
    FX.H.sparks(x, y - 1.6, AMB.col, 12, 5); FX.H.sparks(x, y - 1.6, CYN.col, 12, 5); FX.H.ring(x, y, 0.3, 2.2, 0.45, WHITE, 0.45); FX.H.flash(0.15, WHITE); sf(FX, 'chime');
    if (B.conj) { M.shield = { i, x, y, t: 0 }; M.stat.shields++; if (M.cj) M.cj.res[1] = 'ok'; FX.H.banner('A SHIELD RISES', 'Stand behind it when the eye fires', WHITE, 1.8, true); return; }
    M.stat.clean++; FX.H.banner('BALANCED', 'The colours cancel out: its eye stays open, strike it!', GOLD, 2.2, true, true); bare(FX, m, 'eye', 6.5); }
  function detonate(FX, m) { const M = FX.mem, B = M.bur, me = FX.me, Kc = KIND[B.kind]; M.bur = null; M.stat.det++; M.pulse = 1;
    if (!me.dodge) M.stat.detHit++; FX.hurt(m.dmg * 2.0); FX.H.boom(me.x, me.y, DET_R, Kc.col, '#FFFFFF', { n: 30, shake: 12, smoke: 3 }); FX.H.ring(m.x, m.y, SR, FLOOR, 0.7, Kc.col, 0.3); sf(FX, 'crash');
    if (B.conj && M.cj) M.cj.res[1] = 'x';
    FX.H.banner('THE MARK BURSTS', `Too late: the ${KIND[B.mote.kind].name} mote to a beacon, before the pulse`, Kc.col, 1.6, true); }

  /* ---- Conjunction: three events shown in order over the sphere, the third ring counting them down ---- */
  function startConj(FX, m) { const M = FX.mem; m.act = 'conj'; m.actT = 0; M.q.length = 0; M.stat.conj++; M.shield = null;
    M.cj = { t: 0, sym: [-1, -1, -1], fired: [-1, -1, -1], res: [null, null, null], given: false, cut: false, beam: null, kind: null };
    FX.H.flash(0.2, WHITE); FX.H.shake(8, 0.5); sf(FX, 'hum');
    say(FX, 'conj', 'CONJUNCTION', 'Three events, in order: a ribbon sweep, the mark, the eye beam. The white ring counts them down', WHITE); }
  function conjTick(FX, m, dt) { const M = FX.mem, J = M.cj, f = FX.S.fast; if (!J) { endAct(m); return; } J.t += dt; const t = J.t * f;
    for (let i = 0; i < 3; i++) if (J.sym[i] < 0 && t >= CJ.sym[i]) { J.sym[i] = J.t; sf(FX, 'chime'); }
    if (!J.given && t >= CJ.mark) { J.given = true; giveMark(FX, m, true, (CJ.det - CJ.mark) / f); J.kind = M.bur ? M.bur.kind : null; }
    if (!J.cut && t >= CJ.cutAt) { J.cut = true; if (M.rs.some(r => r.st !== 'home')) { J.fired[0] = J.t; J.res[0] = 'ok'; } else startCut(FX, m, true, (CJ.cut - CJ.cutAt) / f); }
    if (J.fired[1] < 0 && t >= CJ.det) { J.fired[1] = J.t; if (!J.res[1]) J.res[1] = M.bur ? 'x' : 'ok'; }
    if (!J.beam && t >= CJ.beam) startBeam(FX, m);
    if (t >= CJ.end) { M.cj = null; M.shield = null; endAct(m); } }
  // the eye beam: a straight line from the sphere at the pet, following it until it locks; a shield on the line stops it
  function startBeam(FX, m) { const M = FX.mem, J = M.cj, me = FX.me, f = FX.S.fast, lock = (CJ.lock - CJ.beam) / f;
    const s = FX.tele({ shape: 'fn', kind: 'beam', x: m.x, y: m.y, a: Math.atan2(me.y - m.y, me.x - m.x), len: 21, reach: 21, w: BEAM_W, t: (CJ.fire - CJ.beam) / f, lockT: lock, dmg: m.dmg * 1.7, col: UNSEEN, ink: 'beam', block: null,
      test: (px, py, rr) => { const rx = px - s.x, ry = py - s.y, ca = Math.cos(s.a), sa = Math.sin(s.a), al = rx * ca + ry * sa, of = Math.abs(-rx * sa + ry * ca); return al > PIT - 0.5 && al < s.reach + (rr || 0) && of < s.w / 2 + (rr || 0); },
      tick: (dt, s) => { if (s.age < s.lockT) s.a = K.lerpA(s.a, Math.atan2(me.y - s.y, me.x - s.x), Math.min(1, dt * 6)); const Sh = M.shield; s.block = null; s.reach = s.len;
        if (Sh) { const rx = Sh.x - s.x, ry = Sh.y - s.y, ca = Math.cos(s.a), sa = Math.sin(s.a), al = rx * ca + ry * sa, of = Math.abs(-rx * sa + ry * ca); if (al > 0 && of < SHIELD_R + s.w * 0.25) { s.block = Sh; s.reach = Math.max(PIT, al - SHIELD_R * 0.55); } } },
      fn: s => { M.stat.beams++; const blocked = !!s.block, hit = !blocked && FX.inShape(s, me.x, me.y, me.r); if (hit) M.stat.beamHit++; if (J) { J.fired[2] = J.t; J.res[2] = blocked || !hit ? 'ok' : 'x'; }
        M.beamFx = { a: s.a, reach: s.reach, block: blocked, t: 0 }; FX.H.shake(blocked ? 14 : 10, 0.4); sf(FX, 'crash');
        if (blocked) { M.stat.blocked++; const Sh = s.block; FX.H.boom(Sh.x, Sh.y - 0.6, 1.8, WHITE, GOLD, { n: 30, shake: 10, smoke: 2 }); FX.H.flash(0.3, WHITE);
          FX.H.banner('THE EYE IS BLINDED', 'Your shield turned its beam back on it: strike the open eye!', GOLD, 2.4, true, true); FX.H.after(0.25, () => { if (!m.dead) bare(FX, m, 'blind', 6.5); }); } } });
    J.beam = s; FX.H.text(me.x, me.y - 2.6, 'THE EYE TAKES AIM', ROSE, 13); sf(FX, 'whoosh'); }

  /* ---- fallen: its fissures close, the comet's fissure into a white star; the lake turns blue and clear ---- */
  function deadTick(FX, m, dt) { const M = FX.mem;
    if (M.deadT == null) { M.deadT = 0; M.bur = null; M.cj = null; M.cut = null; M.shield = null; M.beamFx = null; M.q.length = 0; FX.S.tele.length = 0; FX.weak('eye', 0, 0, 0, 0, false); }
    M.deadT += dt; const T = M.deadT;
    M.fisK = toward(M.fisK, T > 0.3 ? 0 : 1, dt, 2.2); M.ring3K = toward(M.ring3K, 0, dt, 1.5);
    M.star = toward(M.star, T > 0.9 ? 1 : 0, dt, 2.4);
    if (T > 1.5 && !M.out) { M.out = true; const F = frameOf(FX); FX.H.flash(0.5, '#FFFFFF'); FX.H.boom(m.x, m.y - F.lift, 3.5, WHITE, '#FFFFFF', { n: 40, shake: 14, smoke: 4 }); sf(FX, 'chime'); }
    // the well under it closes over (the floor is whole again, and the pet can cross it to seal the rift)
    if (T > 2.0 && !M.closed) { M.closed = true; const G = FX.H.M, C = FX.C; for (let y = Math.floor(C.y - PIT - 1); y <= Math.ceil(C.y + PIT + 1); y++) for (let x = Math.floor(C.x - PIT - 1); x <= Math.ceil(C.x + PIT + 1); x++) if (Math.hypot(x + 0.5 - C.x, y + 0.5 - C.y) < PIT + 0.2) G.G[y * G.MW + x] = T_FLOOR; }
    M.shut = toward(M.shut || 0, T > 2.0 ? 1 : 0, dt, 1.6);
    M.blue = toward(M.blue, T > 1.4 ? 1 : 0, dt, 0.55); M.sink = clamp((T - 2.3) / 2.2, 0, 1); M.sigil = clamp((T - 3.6) / 1.6, 0, 1);
    if (M.sink < 0.9 && Math.random() < dt * 18) { const F = frameOf(FX), a = Math.random() * TAU; FX.H.part({ kind: 'spark', x: m.x + Math.cos(a) * SR * F.sc, y: m.y - F.lift + Math.sin(a) * SR * F.sc, vx: FX.rnd(-0.6, 0.6), vy: FX.rnd(-2.2, -0.6), g: -0.5, drag: 0.4, life: 1.3, max: 1.3, size: 2 + Math.random() * 2, color: Math.random() < 0.5 ? WHITE : (Math.random() < 0.5 ? AMB.col : CYN.col) }); } }

  /* ---------- the painting ---------- */
  /* the samples of one ribbon's crescent, home on its tilted orbit or flown out flat along its band (blended by out);
     returned as runs of samples on the far side of the sphere and on the near side, each with its mean depth */
  function ribbonRuns(FX, m, X, Y, Xc, Yc, T, F) { const M = FX.mem, out = [], N = 40;
    RIB.forEach((rib, k) => { const rs = M.rs[k], e = smooth(rs.out || 0), flown = (rs.out || 0) > 0.02, yw = rib.yaw + Math.sin((M.bt || 0) * 0.05 + k * 1.7) * 0.35, tl = rib.tilt + Math.sin((M.bt || 0) * 0.21 + k * 2) * 0.06, cy = Math.cos(yw), sy = Math.sin(yw), ct = Math.cos(tl), st = Math.sin(tl);
      const z = lerp(F.lift, 0.95, e), bw = lerp(rib.w, BAND_W * 0.9, e), sc = F.sc, s0 = M.spin[k] + (rs.sweep || 0);
      const S = []; for (let i = 0; i <= N; i++) { const u = i / N, th = s0 + u * rib.arc, tp = Math.pow(Math.sin(Math.PI * u), 0.55), cth = Math.cos(th), sth = Math.sin(th);
        const pt = (rr, rg) => { const x0 = rr * cth, y0 = rr * sth, b1 = y0 * ct, h1 = y0 * st, a = x0 * cy - b1 * sy, b = x0 * sy + b1 * cy;
          const P0 = [Xc + bx(a) * T * sc, Yc + by(b, h1) * T * sc], P1 = [X + rg * cth * T, Y + rg * sth * T - z * T]; return [lerp(P0[0], P1[0], e), lerp(P0[1], P1[1], e), lerp(bd(b, h1), rg * sth, e)]; };
        const ro = rib.R + rib.w / 2 * tp, ri = rib.R - rib.w / 2 * tp * 0.8, go = (rs.rad || rib.R) + bw / 2 * tp, gi = (rs.rad || rib.R) - bw / 2 * tp * 0.8;
        const o = pt(ro, go), n = pt(ri, gi); S.push({ o, i: n, d: (o[2] + n[2]) / 2 }); }
      // runs of one side, sharing their boundary sample so there is no seam
      let cur = null; for (let i = 0; i <= N; i++) { const side = S[i].d >= 0 ? 1 : -1; if (!cur || cur.side !== side) { if (cur) cur.s.push(S[i]); cur = { side, s: cur ? [S[i - 1], S[i]] : [S[i]], k, flown, th: lerp(rib.th, 0.3, e) * T * (flown ? 1 : sc) }; out.push(cur); } else cur.s.push(S[i]); }
    });
    out.forEach(r => { r.dep = r.s.reduce((a, q) => a + q.d, 0) / r.s.length; }); return out; }
  function paintRun(c, r, T, alpha) { if (r.s.length < 2) return; const C = RIB[r.k].C, lw = Math.max(1.3, T * 0.075), th = r.th;
    const path = (cc, dy) => { cc.beginPath(); r.s.forEach((q, i) => i ? cc.lineTo(q.o[0], q.o[1] + dy) : cc.moveTo(q.o[0], q.o[1] + dy)); for (let i = r.s.length - 1; i >= 0; i--) cc.lineTo(r.s[i].i[0], r.s[i].i[1] + dy); cc.closePath(); };
    c.save(); c.globalAlpha *= alpha; c.lineJoin = 'round'; c.lineCap = 'round';
    // the slab's edge (its thickness), then its face: flat colour, a shade along the inner edge, pale edges, a bold outline
    const edge = (key, dy) => { c.beginPath(); r.s.forEach((q, i) => i ? c.lineTo(q[key][0], q[key][1] + dy) : c.moveTo(q[key][0], q[key][1] + dy)); };
    path(c, th); c.fillStyle = C.shade2; c.fill(); c.strokeStyle = LINE; c.lineWidth = lw; edge('o', th); c.stroke(); edge('i', th); c.stroke();
    path(c, 0); c.fillStyle = C.col; c.fill();
    c.beginPath(); r.s.forEach((q, i) => i ? c.lineTo(q.i[0], q.i[1]) : c.moveTo(q.i[0], q.i[1])); for (let i = r.s.length - 1; i >= 0; i--) { const q = r.s[i]; c.lineTo(lerp(q.i[0], q.o[0], 0.32), lerp(q.i[1], q.o[1], 0.32)); } c.closePath(); c.fillStyle = C.shade; c.fill();
    c.strokeStyle = C.pale; c.lineWidth = Math.max(2, T * 0.17); c.beginPath(); r.s.forEach((q, i) => i ? c.lineTo(q.o[0], q.o[1]) : c.moveTo(q.o[0], q.o[1])); c.stroke();
    c.lineWidth = Math.max(1.5, T * 0.1); c.strokeStyle = C.hi; c.beginPath(); r.s.forEach((q, i) => i ? c.lineTo(lerp(q.o[0], q.i[0], 0.62), lerp(q.o[1], q.i[1], 0.62)) : c.moveTo(lerp(q.o[0], q.i[0], 0.62), lerp(q.o[1], q.i[1], 0.62))); c.stroke();
    c.strokeStyle = LINE; c.lineWidth = lw; edge('o', 0); c.stroke(); edge('i', 0); c.stroke();
    c.restore(); }
  /* the whole body: its shadow, the ribbons' far halves, the sphere, the ribbons' near halves (those still at home) */
  function paintBody(c, FX, m, X, Y, T, all) { const M = FX.mem, F = frameOf(FX), me = FX.me, Xc = X, Yc = Y - F.lift * T, R = SR * T * F.sc;
    if (F.a < 0.01) return;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.globalAlpha *= F.a;
    K.shade(c, X, Y + T * 0.1, SR * T * (0.5 + 0.45 * F.wake) * F.sc, SR * T * 0.34 * F.sc, 0.55 * F.wake);
    // its pull on the light: a soft dark halo, and the faint unseen colour leaking round its limb
    K.shade(c, Xc, Yc, R * 1.55, R * 1.55, 0.4, '#04040A');
    K.glow(c, Xc, Yc, R * 1.45, UNSEEN, 0.1 * M.fisK + M.recoil * 0.06);
    const runs = ribbonRuns(FX, m, X, Y, Xc, Yc, T, F);
    runs.filter(r => r.side < 0).sort((a, b) => a.dep - b.dep).forEach(r => paintRun(c, r, T, 1));
    // a pet behind it can still be seen through it
    const behind = me && me.y < m.y - 0.3 && Math.abs(me.x - m.x) < SR + 0.8 && me.y > m.y - F.lift - SR - 1;
    paintSphere(c, FX, m, Xc, Yc, R, T, behind ? 0.55 : 1);
    runs.filter(r => r.side > 0 && (all || !r.flown)).sort((a, b) => a.dep - b.dep).forEach(r => paintRun(c, r, T, 1));
    c.restore(); }
  function paintSphere(c, FX, m, Xc, Yc, R, T, alpha) { const M = FX.mem, lw = Math.max(1.6, T * 0.11);
    c.save(); c.globalAlpha *= alpha;
    TN.shape(c, TN.ell(Xc, Yc, R, R), { col: '#18192D', shade: '#10111C', shade2: '#0A0A12', hi: '#25273F', line: LINE, lw, r: R, d1: 0.07, d2: 0.16, force: true,
      inner: cc => { paintFissures(cc, FX, Xc, Yc, R, T); if (M.eye > 0.02) paintEye(cc, FX, m, Xc, Yc, R, T); } });
    // a thin rim of the cyan and the amber on its limb, feathered (the two colours it is torn between)
    c.globalCompositeOperation = 'lighter';
    for (const [w, a] of [[0.16, 0.07], [0.07, 0.16], [0.025, 0.4]]) { c.lineWidth = Math.max(1, R * w); c.strokeStyle = `rgba(79,216,240,${a * M.fisK})`; c.beginPath(); c.arc(Xc, Yc, R * (1 - w * 0.5), Math.PI * 0.95, Math.PI * 1.45); c.stroke(); c.strokeStyle = `rgba(255,165,58,${a * M.fisK})`; c.beginPath(); c.arc(Xc, Yc, R * (1 - w * 0.5), Math.PI * 1.95, Math.PI * 2.4); c.stroke(); }
    c.restore();
    // fallen: the comet's fissure closes into a white star
    if (M.star > 0.01) { const p = sph(M, 0, 0), x = Xc + bx(p[0]) * R, y = Yc + by(p[1], p[2]) * R, s = R * (0.25 + 0.55 * M.star); K.glow(c, x, y, s * 2.6, '#FFFFFF', 0.55 * M.star); TN.twinkle(c, x, y, s, '#FFFFFF', M.star); TN.twinkle(c, x, y, s * 0.45, '#FFFFFF', M.star); } }
  /* the three broad angular fissures: dark cracks with the unseen colour inside them, turning with the body */
  function paintFissures(c, FX, Xc, Yc, R, T) { const M = FX.mem, k = M.fisK; if (k < 0.02) return;
    FIS.forEach((F, fi) => { const pts = []; for (let j = 0; j < F.length - 1; j++) for (let s = 0; s < 3; s++) { const u = s / 3, lon = lerp(F[j][0], F[j + 1][0], u), lat = lerp(F[j][1], F[j + 1][1], u), p = sph(M, lon, lat); pts.push([Xc + bx(p[0]) * R, Yc + by(p[1], p[2]) * R, bd(p[1], p[2])]); }
      { const L = F[F.length - 1], p = sph(M, L[0], L[1]); pts.push([Xc + bx(p[0]) * R, Yc + by(p[1], p[2]) * R, bd(p[1], p[2])]); }
      // runs on the near side, faded toward the limb
      let run = []; const flush = () => { if (run.length > 1) { const dep = run.reduce((a, q) => a + q[2], 0) / run.length, va = clamp(dep * 2.2, 0, 1) * k, open = fi === 0 ? M.eye : 0;
          const line = (col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); run.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); };
          c.save(); c.lineJoin = 'miter'; c.miterLimit = 3; c.lineCap = 'butt'; c.globalAlpha *= va;
          line('#050508', R * (0.2 + open * 0.05)); line(fi === 1 ? UNSEEN2 : fi === 2 ? '#B07CFF' : UNSEEN, R * 0.11); line('rgba(255,240,255,.85)', Math.max(1, R * 0.03)); c.restore(); } run = []; };
      pts.forEach(q => { if (q[2] > 0.04) run.push(q); else flush(); }); flush(); }); }
  /* the geometric eye the comet's fissure opens into: an angular lens, a diamond iris, a slit pupil that finds the pet */
  function paintEye(c, FX, m, Xc, Yc, R, T) { const M = FX.mem, me = FX.me, p = sph(M, 0, 0), dep = bd(p[1], p[2]); if (dep < 0.2) return;
    const o = smooth(M.eye), x = Xc + bx(p[0]) * R, y = Yc + by(p[1], p[2]) * R, sq = clamp(dep, 0.4, 1), ew = R * 0.62 * sq, eh = R * 0.34 * o, blind = M.why === 'blind' && FX.m.stunT > 0;
    const lx = me ? clamp((me.x - m.x) / 10, -1, 1) * ew * 0.32 : 0, ly = me ? clamp((me.y - m.y) / 10, -0.5, 1) * eh * 0.35 : 0;
    const lens = (kx, ky) => { c.beginPath(); c.moveTo(x - ew * kx, y); c.lineTo(x - ew * 0.42 * kx, y - eh * ky); c.lineTo(x + ew * 0.42 * kx, y - eh * ky); c.lineTo(x + ew * kx, y); c.lineTo(x + ew * 0.42 * kx, y + eh * ky); c.lineTo(x - ew * 0.42 * kx, y + eh * ky); c.closePath(); };
    K.glow(c, x, y, ew * 1.6, UNSEEN, 0.28 * o);
    c.save(); c.lineJoin = 'miter';
    lens(1.12, 1.25); c.fillStyle = '#040408'; c.fill();
    if (eh > 0.6) { lens(1, 1); c.fillStyle = blind ? '#FFF8E0' : '#EDE8FA'; c.fill(); c.save(); lens(1, 1); c.clip();
      // the band of shade under its upper lid
      c.fillStyle = 'rgba(70,60,110,.35)'; c.fillRect(x - ew, y - eh, ew * 2, eh * 0.45);
      const ir = Math.min(eh * 0.95, ew * 0.42), ix = x + lx, iy = y + ly;
      const dia = (r, col) => { c.beginPath(); c.moveTo(ix, iy - r); c.lineTo(ix + r * 0.86, iy); c.lineTo(ix, iy + r); c.lineTo(ix - r * 0.86, iy); c.closePath(); c.fillStyle = col; c.fill(); };
      dia(ir, blind ? GOLD : UNSEEN); dia(ir * 0.66, blind ? '#FFF4C8' : UNSEEN2); c.strokeStyle = LINE; c.lineWidth = Math.max(1, T * 0.05); dia(ir, 'rgba(0,0,0,0)'); c.stroke();
      const pw = blind ? ir * 0.08 : ir * 0.2; c.beginPath(); c.moveTo(ix, iy - ir * 0.92); c.lineTo(ix + pw, iy); c.lineTo(ix, iy + ir * 0.92); c.lineTo(ix - pw, iy); c.closePath(); c.fillStyle = '#05050A'; c.fill();
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(ix - ir * 0.42, iy - ir * 0.5); c.lineTo(ix - ir * 0.22, iy - ir * 0.62); c.lineTo(ix - ir * 0.3, iy - ir * 0.3); c.closePath(); c.fill();
      c.restore(); }
    lens(1, 1); c.strokeStyle = LINE; c.lineWidth = Math.max(1.5, T * 0.09); c.stroke();
    c.restore(); }
  function demoPaint(c, FX, m, X, Y, T) { const M = FX.mem || {};
    if (!M.P) Object.assign(M, { P: { wake: 1, rec: 0 }, bt: 3, spin: [0.6, 2.4], rot: M.demoEye ? Math.PI / 2 : 1.2, eye: M.demoEye ? 1 : 0, recoil: 0, rs: RIB.map(r => ({ st: 'home', out: 0, rad: r.R, rb: r.R, sweep: 0 })), fisK: 1, star: 0, sink: 0, ring3K: M.demoRing ? 1 : 0, ringFill: [1, 0.55, 0] });
    const F2 = { mem: M, m, C: FX.C || { x: m.x, y: m.y }, me: { x: m.x + 2, y: m.y + 9 }, S: { lv: M.demoRing ? 3 : 1 } };
    paintBody(c, F2, m, X, Y, T, true); if (M.demoRing) paintRing3(c, F2, X, Y - frameOf(F2).lift * T, T, 0); }

  /* ---------- the floor's things: the beacons ---------- */
  function drawBeacon(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, B = M.bur, held = !!(B && B.mote && B.mote.st === 'held'), want = !!B, fl = M.bflash ? M.bflash[p.i] : 0, lw = Math.max(1.3, T * 0.075), pu = 0.5 + 0.5 * Math.sin(t * 5 + p.i), sh = M.shield && M.shield.i === p.i;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.fillStyle = 'rgba(8,8,16,.35)'; c.beginPath(); c.ellipse(X, Y, T * 0.95, T * 0.34, 0, 0, TAU); c.fill();
    if (held || fl > 0.02) K.glow(c, X, Y - T * 1.6, T * 3.6, WHITE, 0.3 * (held ? 0.6 + 0.4 * pu : 0) + 0.6 * fl);
    // a plinth of grey stone and a short column
    TN.shape(c, TN.ell(X, Y - T * 0.18, T * 0.72, T * 0.32), { col: '#6A6A76', shade: '#4C4C58', hi: '#8E8E9A', line: LINE, lw, r: T * 0.7, force: true });
    const col = [[X - T * 0.3, Y - T * 0.2], [X - T * 0.24, Y - T * 1.3], [X + T * 0.24, Y - T * 1.3], [X + T * 0.3, Y - T * 0.2]];
    TN.shape(c, TN.poly(col), { col: '#7A7A86', shade: '#5A5A66', hi: '#A2A2AE', line: LINE, lw, r: T * 0.4, force: true });
    // its lens: half sun, half moon, grey and dim until a mote is borne to it
    const lx = X, ly = Y - T * 1.75, r = T * 0.5, k = held ? 1 : want ? 0.55 : fl > 0.02 ? 1 : 0.18, mix = (h) => K.mixC('#8A8A96', h, k);
    TN.shape(c, TN.ell(lx, ly, r * 1.18, r * 1.18), { col: '#55555F', shade: '#3E3E48', hi: '#7A7A86', line: LINE, lw, r, force: true });
    c.save(); c.beginPath(); c.arc(lx, ly, r, 0, TAU); c.clip(); c.fillStyle = mix(AMB.col); c.fillRect(lx - r, ly - r, r, r * 2); c.fillStyle = mix(CYN.col); c.fillRect(lx, ly - r, r, r * 2);
    c.fillStyle = mix(AMB.hi); c.beginPath(); c.arc(lx - r * 0.42, ly - r * 0.1, r * 0.26, 0, TAU); c.fill(); c.fillStyle = K.mixC('#55555F', '#0E1030', k); c.beginPath(); c.arc(lx + r * 0.5, ly - r * 0.08, r * 0.3, 0, TAU); c.fill(); c.fillStyle = mix(CYN.col); c.beginPath(); c.arc(lx + r * 0.62, ly - r * 0.14, r * 0.26, 0, TAU); c.fill(); c.restore();
    c.strokeStyle = LINE; c.lineWidth = lw; c.beginPath(); c.arc(lx, ly, r, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(lx, ly - r); c.lineTo(lx, ly + r); c.stroke();
    if (held || fl > 0.3) TN.twinkle(c, lx, ly - r * 1.6, r * 0.45 * (0.7 + 0.3 * pu), '#FFFFFF', 0.9);
    if (held && !sh) label(c, 'BEACON', X, Y - T * 3.0, T, '#FFFFFF', Math.max(10, T * 0.5));
    c.restore(); }
  function label(c, s, X, Y, T, col, sz) { c.save(); c.font = `900 ${Math.max(10, Math.round(sz || T * 0.46))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(8,8,18,.8)'; c.strokeText(s, X, Y); c.fillStyle = col; c.fillText(s, X, Y); c.restore(); }
  // a grey pool of drained colour, feathered at its edge
  function drawPool(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), r = z.r * T, fade = Math.min(1, z.age / 0.3, (z.life - z.age) / 0.6); if (fade <= 0) return;
    c.globalAlpha = fade; const g = c.createRadialGradient(X, Y, r * 0.1, X, Y, r * 1.08); g.addColorStop(0, 'rgba(150,150,164,.5)'); g.addColorStop(0.65, 'rgba(122,122,136,.42)'); g.addColorStop(0.88, 'rgba(110,110,124,.22)'); g.addColorStop(1, 'rgba(110,110,124,0)'); c.fillStyle = g; c.beginPath(); c.arc(X, Y, r * 1.08, 0, TAU); c.fill();
    for (let k = 0; k < 2; k++) { const u = ((t * 0.5 + k * 0.5 + z.x) % 1 + 1) % 1; c.strokeStyle = `rgba(214,214,224,${0.3 * (1 - u)})`; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.ellipse(X, Y, r * (0.3 + u * 0.6), r * (0.2 + u * 0.4), 0, 0, TAU); c.stroke(); } c.globalAlpha = 1; }

  /* ---------- the ground's living layer: the blue coming back, the telegraphs, the mark's circle ---------- */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m, me = FX.me; if (!M || !M.P || !m) return; const X0 = FX.sx(C.x), Y0 = FX.sy(C.y);
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    // the lake regaining its blue: a clear reflective surface, feathered at its far edge, the white star mirrored in it
    if (M.blue > 0.01) { const E = (C.R + 1.5) * T, k = smooth(M.blue), g = c.createRadialGradient(X0, Y0, FLOOR * T, X0, Y0, E);
      g.addColorStop(0, `rgba(84,168,236,${0.9 * k})`); g.addColorStop(0.45, `rgba(46,120,210,${0.85 * k})`); g.addColorStop(0.85, `rgba(32,86,176,${0.6 * k})`); g.addColorStop(1, 'rgba(32,86,176,0)');
      c.fillStyle = g; c.beginPath(); c.arc(X0, Y0, E, 0, TAU); c.arc(X0, Y0, FLOOR * T, 0, TAU, true); c.fill();
      c.strokeStyle = `rgba(230,246,255,${0.35 * k})`; c.lineWidth = Math.max(1, T * 0.06); for (let i = 0; i < 26; i++) { const a = i * 2.39 + Math.sin(t * 0.2 + i) * 0.02, d = FLOOR + 0.8 + ((i * 0.37) % 1) * 3.6, x = X0 + Math.cos(a) * d * T, y = Y0 + Math.sin(a) * d * T, w = T * (0.4 + (i % 3) * 0.3) * (0.7 + 0.3 * Math.sin(t * 1.3 + i)); c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y); c.stroke(); }
      K.glow(c, X0, Y0 - (FLOOR + 2.2) * T, T * 2.4, '#FFFFFF', 0.45 * k); }
    // the floor closing over the well once it has fallen
    if (M.shut > 0.01) { const k = smooth(M.shut), r = PIT * T * (0.35 + 0.65 * k), g = c.createRadialGradient(X0, Y0 + T * 0.5, T * 0.3, X0, Y0, PIT * T); g.addColorStop(0, '#585864'); g.addColorStop(1, '#4A4A55'); c.save(); c.globalAlpha = k; c.fillStyle = g; c.beginPath(); c.arc(X0, Y0, PIT * T + 1, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(16,16,24,.4)'; c.lineWidth = Math.max(1, T * 0.07); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(X0 + Math.cos(a) * r * 0.3, Y0 + Math.sin(a) * r * 0.3); c.lineTo(X0 + Math.cos(a) * PIT * T, Y0 + Math.sin(a) * PIT * T); c.stroke(); } c.beginPath(); c.arc(X0, Y0, r * 0.3, 0, TAU); c.stroke();
      K.glow(c, X0, Y0, PIT * T * 1.2, '#FFFFFF', 0.25 * (1 - k)); c.restore(); }
    // the telegraphs, kept to the floor
    for (const s of FX.S.tele) { if (s.done || !s.ink) continue; const u = clamp(s.age / s.t, 0, 1), hot = u > 0.72, col = s.col || WHITE, edge = hot ? (Math.sin(t * 18) > 0 ? '#FFFFFF' : col) : col;
      c.save(); c.beginPath(); c.arc(X0, Y0, FLOOR * T, 0, TAU); c.clip();
      if (s.kind === 'drop') { const X = FX.sx(s.x), Y = FX.sy(s.y), r = s.r * T; c.fillStyle = `rgba(10,10,22,${0.16 + u * 0.4})`; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(6,6,14,.85)'; c.lineWidth = Math.max(2, T * 0.14); c.stroke(); c.strokeStyle = edge; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke();
        c.strokeStyle = hot ? '#FFFFFF' : '#D8D8E4'; c.globalAlpha = 0.55 + 0.45 * u; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.arc(X, Y, Math.max(1, r * (1 - u)), 0, TAU); c.stroke(); }
      else if (s.kind === 'band') { const X = FX.sx(s.x), Y = FX.sy(s.y), r0 = s.r0 * T, r1 = s.r1 * T, rgb = hexRGB(col).join(',');
        c.beginPath(); c.arc(X, Y, r1, 0, TAU); c.arc(X, Y, r0, 0, TAU, true); c.fillStyle = `rgba(10,10,24,${0.14 + u * 0.36})`; c.fill(); c.fillStyle = `rgba(${rgb},${0.06 + u * 0.16})`; c.fill();
        for (const rr of [r0, r1]) { c.beginPath(); c.arc(X, Y, rr, 0, TAU); c.strokeStyle = 'rgba(6,6,14,.85)'; c.lineWidth = Math.max(2, T * 0.15); c.stroke(); c.strokeStyle = edge; c.lineWidth = Math.max(1.5, T * 0.085); c.stroke(); }
        // the ribbon's shadow coming round the band, and two chevrons at the pet's side: out of the band either way
        const ra = M.spin[s.rk] + RIB[s.rk].arc / 2; c.strokeStyle = `rgba(${rgb},${0.25 + 0.35 * u})`; c.lineWidth = (r1 - r0) * 0.6; c.lineCap = 'butt'; c.beginPath(); c.arc(X, Y, (r0 + r1) / 2, ra - 0.5, ra + 0.5); c.stroke(); c.lineCap = 'round';
        const pa = Math.atan2(me.y - s.y, me.x - s.x), ca = Math.cos(pa), sa = Math.sin(pa), chev = (rr, dir) => { const cx = X + ca * rr, cy = Y + sa * rr, L = T * 0.45, nx = ca * dir, ny = sa * dir; c.beginPath(); c.moveTo(cx - ny * L - nx * L * 0.6, cy + nx * L - ny * L * 0.6); c.lineTo(cx + nx * L * 0.4, cy + ny * L * 0.4); c.lineTo(cx + ny * L - nx * L * 0.6, cy - nx * L - ny * L * 0.6); c.stroke(); };
        for (const [w, cc] of [[0.26, 'rgba(6,6,14,.8)'], [0.13, '#FFFFFF']]) { c.strokeStyle = cc; c.lineWidth = Math.max(2, T * w); chev(r0 - T * 0.55, -1); chev(r1 + T * 0.55, 1); } }
      else if (s.kind === 'beam') { const X = FX.sx(s.x), Y = FX.sy(s.y), w = s.w * T, L0 = (PIT - 0.4) * T, L = s.reach * T, locked = s.age >= s.lockT; c.translate(X, Y); c.rotate(s.a);
        c.fillStyle = `rgba(10,8,24,${0.16 + u * 0.36})`; c.fillRect(L0, -w / 2, L - L0, w); c.fillStyle = `rgba(224,76,255,${0.08 + u * 0.18})`; c.fillRect(L0, -w / 2, (L - L0) * u, w);
        c.strokeStyle = 'rgba(6,6,14,.85)'; c.lineWidth = Math.max(2, T * 0.14); c.strokeRect(L0, -w / 2, L - L0, w); c.strokeStyle = locked ? (Math.sin(t * 20) > 0 ? '#FFFFFF' : UNSEEN) : UNSEEN; c.lineWidth = Math.max(1.5, T * 0.08); c.strokeRect(L0, -w / 2, L - L0, w);
        if (s.block) { const L2 = s.len * T; c.fillStyle = 'rgba(255,227,122,.12)'; c.fillRect(L + SHIELD_R * 0.9 * T, -w * 0.45, L2 - L - SHIELD_R * 0.9 * T, w * 0.9); c.setLineDash([T * 0.4, T * 0.35]); c.strokeStyle = 'rgba(255,227,122,.55)'; c.lineWidth = Math.max(1.5, T * 0.07); c.strokeRect(L + SHIELD_R * 0.9 * T, -w * 0.45, L2 - L - SHIELD_R * 0.9 * T, w * 0.9); c.setLineDash([]); } }
      c.restore(); }
    // the mark's reach round the pet: it fills as the pulse nears
    if (M.bur && !me.dead) { const B = M.bur, Kc = KIND[B.kind], X = FX.sx(me.x), Y = FX.sy(me.y), r = DET_R * T, urg = smooth((B.t - (B.T - 2.5)) / 2.5), rgb = hexRGB(Kc.col).join(',');
      c.fillStyle = `rgba(${rgb},${0.05 + 0.2 * urg})`; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(6,6,14,.6)'; c.lineWidth = Math.max(2, T * 0.12); c.stroke(); c.strokeStyle = urg > 0.6 && Math.sin(t * 16) > 0 ? '#FFFFFF' : Kc.col; c.lineWidth = Math.max(1.5, T * 0.07); c.stroke(); }
    c.restore();
    // fallen, it is no longer among the living things on the field: its remains are laid down here, under them all
    if (m.dead) paintBody(c, FX, m, FX.sx(m.x), FX.sy(m.y), T, true); }

  /* ---------- over everything: flown ribbons, drops, the mote, the shield, the beam, the third ring, the counters ---------- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m, me = FX.me; if (!m || !M.P) return; const X = FX.sx(m.x), Y = FX.sy(m.y), F = frameOf(FX), Xc = X, Yc = Y - F.lift * T, lw = Math.max(1.3, T * 0.075);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    if (!m.dead) ribbonRuns(FX, m, X, Y, Xc, Yc, T, F).filter(r => r.side > 0 && r.flown).sort((a, b) => a.dep - b.dep).forEach(r => paintRun(c, r, T, 1));
    // drained colour falling onto its circles
    for (const s of FX.S.tele) if (s.ink === 'drop' && !s.done) { const u = s.age / s.t; if (u < 0.45) continue; const h = Math.pow((1 - u) / 0.55, 2) * 9, x = FX.sx(s.x), y = FX.sy(s.y) - h * T, r = T * 0.32; c.fillStyle = 'rgba(200,200,214,.35)'; c.beginPath(); c.ellipse(x, y - r * 2, r * 0.45, r * 1.6, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(x, y - r * 1.9); c.quadraticCurveTo(x + r, y - r * 0.2, x, y + r * 0.6); c.quadraticCurveTo(x - r, y - r * 0.2, x, y - r * 1.9); c.fillStyle = '#B4B4C2'; c.fill(); c.strokeStyle = LINE; c.lineWidth = lw * 0.8; c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.2, r * 0.18, 0, TAU); c.fill(); }
    // the opposite mote: lying on the floor, or borne over the pet
    if (M.bur) { const mo = M.bur.mote, Ko = KIND[mo.kind], r = T * 0.48, held = mo.st === 'held', bob = Math.sin(t * 3) * 0.15, q = held ? [FX.sx(me.x) + Math.cos(t * 2.6) * T * 1.0, FX.sy(me.y) - (0.9 + bob) * T + Math.sin(t * 2.6) * T * 0.4] : [FX.sx(mo.x), FX.sy(mo.y) - (0.9 + bob) * T];
      if (!held) { c.fillStyle = 'rgba(8,8,16,.35)'; c.beginPath(); c.ellipse(FX.sx(mo.x), FX.sy(mo.y), r * 1.2, r * 0.4, 0, 0, TAU); c.fill(); K.glow(c, FX.sx(mo.x), FX.sy(mo.y), r * 3, Ko.col, 0.3); }
      K.glow(c, q[0], q[1], r * 3.2, Ko.col, 0.5); motePaint(c, q[0], q[1], held ? r * 0.8 : r, mo.kind, lw, t);
      if (!held) label(c, `${Ko.name} MOTE`, q[0], FX.sy(mo.y) + T * 0.75, T, Ko.pale, Math.max(11, T * 0.5)); }
    // the shield at a beacon: a small curved wall of light facing the sphere, its edges soft
    if (M.shield) { const Sh = M.shield, a = Math.atan2(m.y - Sh.y, m.x - Sh.x), g = smooth(Sh.t / 0.4), X1 = FX.sx(Sh.x) + Math.cos(a) * T * 0.9, Y1 = FX.sy(Sh.y) + Math.sin(a) * T * 0.9, w = SHIELD_R * T * g, h = T * 2.2 * g;
      K.glow(c, X1, Y1 - h * 0.5, w * 1.8, '#FFF4D0', 0.45);
      c.save(); c.translate(X1, Y1); const sk = Math.sin(a); c.beginPath(); c.moveTo(-w, 0); c.bezierCurveTo(-w, -h * 0.8, -w * 0.5, -h * (1.05 + sk * 0.1), 0, -h * (1.1 + sk * 0.1)); c.bezierCurveTo(w * 0.5, -h * (1.05 + sk * 0.1), w, -h * 0.8, w, 0); c.quadraticCurveTo(0, h * 0.18 * (sk > 0 ? -1 : 1), -w, 0); c.closePath();
      c.fillStyle = 'rgba(255,246,214,.42)'; c.fill(); c.strokeStyle = 'rgba(255,236,170,.9)'; c.lineWidth = Math.max(2, T * 0.12); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(-w * 0.6, -h * 0.25); c.quadraticCurveTo(-w * 0.55, -h * 0.85, 0, -h * 0.95); c.stroke(); c.restore();
      if (M.cj && M.cj.beam && !M.cj.beam.done) label(c, M.cj.beam.block ? 'BEHIND THE SHIELD' : 'GET BEHIND THE SHIELD', FX.sx(Sh.x), FX.sy(Sh.y) - T * 3.3, T, GOLD, Math.max(11, T * 0.5)); }
    // the eye beam as it fires: soft at every edge, white at its heart; turned back by a shield
    if (M.beamFx) { const B = M.beamFx, k = 1 - B.t / 0.55, p = sph(M, 0, 0), ex = Xc + bx(p[0]) * SR * T * F.sc, ey = Yc + by(p[1], p[2]) * SR * T * F.sc, gx = X + Math.cos(B.a) * B.reach * T, gy = Y + Math.sin(B.a) * B.reach * T - T * 1.0;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const [w, a, col] of [[BEAM_W * 1.3, 0.1, UNSEEN], [BEAM_W * 0.85, 0.18, UNSEEN], [BEAM_W * 0.5, 0.32, '#FFB8FF'], [BEAM_W * 0.18, 0.8, '#FFFFFF']]) { c.strokeStyle = col; c.globalAlpha = a * k; c.lineWidth = w * T; c.beginPath(); c.moveTo(ex, ey); c.lineTo(gx, gy); c.stroke(); }
      if (B.block) K.glow(c, gx, gy, T * 3.2, '#FFF4D0', 0.9 * k); c.restore(); }
    // the third ring and the Conjunction's symbols, over the sphere
    if (!m.dead && M.ring3K > 0.02) paintRing3(c, FX, Xc, Yc, T, t);
    // unguarded while a ribbon is away
    if (!m.dead && !(m.stunT > 0) && M.rs.some(r => r.st === 'ret' && r.out > 0.3)) label(c, 'UNGUARDED', Xc, Yc + (SR * F.sc + 0.75) * T, T, WHITE, Math.max(11, T * 0.55));
    // the open eye: a target ring
    const wk = FX.S.weak.eye; if (wk && !wk.dead) { const p = sph(M, 0, 0), x = Xc + bx(p[0]) * SR * T * F.sc, y = Yc + by(p[1], p[2]) * SR * T * F.sc, pu = 0.5 + 0.5 * Math.sin(t * 7); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GOLD; c.globalAlpha = 0.55 + 0.4 * pu; c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.arc(x, y, T * (1.6 + pu * 0.25), 0, TAU); c.stroke(); c.restore(); label(c, M.why === 'blind' ? 'BLINDED EYE · STRIKE IT' : 'OPEN EYE · STRIKE IT', x, Yc - (SR * F.sc + 0.8) * T, T, GOLD, Math.max(11, T * 0.6)); }
    // the mark over the pet, its countdown round it
    if (M.bur && !me.dead) { const B = M.bur, Kc = KIND[B.kind], x = FX.sx(me.x), y = FX.sy(me.y) - T * 2.45, r = T * 0.42, left = Math.max(0, B.T - B.t), held = B.mote.st === 'held';
      c.lineWidth = Math.max(3, T * 0.16); c.strokeStyle = 'rgba(8,8,18,.6)'; c.beginPath(); c.arc(x, y, r * 1.7, 0, TAU); c.stroke(); c.strokeStyle = left < 2.5 && Math.sin(t * 14) > 0 ? '#FFFFFF' : Kc.col; c.beginPath(); c.arc(x, y, r * 1.7, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(left / B.T, 0, 1)); c.stroke();
      motePaint(c, x, y, r, B.kind, lw, t);
      label(c, held ? `TO A BEACON · ${Math.ceil(left)}` : `${Kc.name} MARK · ${Math.ceil(left)}`, x, y - T * 1.3, T, held ? '#FFFFFF' : Kc.pale, Math.max(12, T * 0.56)); }
    // gold arrows at the edge of the view toward what to reach, when it is off screen
    if (M.bur && !me.dead) { const mo = M.bur.mote; if (mo.st === 'lie') edgeArrow(c, FX, mo.x, mo.y, `${KIND[mo.kind].name} MOTE`, t, 0); else { const C = FX.C; let bi = 0, bd2 = 1e9; BEACONS.forEach((B, i) => { const d = Math.hypot(me.x - C.x - B[0], me.y - C.y - B[1]); if (d < bd2) { bd2 = d; bi = i; } }); edgeArrow(c, FX, C.x + BEACONS[bi][0], C.y + BEACONS[bi][1], 'BEACON', t, 1); } }
    else if (M.shield && M.cj && M.cj.beam) edgeArrow(c, FX, M.shield.x, M.shield.y, 'SHIELD', t, 2);
    // fallen: the white star rising out of it, and the Balance Sigil about it: a sun and a crescent orbiting one centre
    if (m.dead && M.star > 0.01) { const sk = smooth(M.sink), p = sph(M, 0, 0), x = lerp(Xc + bx(p[0]) * SR * T * F.sc, Xc, sk), y = lerp(Yc + by(p[1], p[2]) * SR * T * F.sc, Yc - T * 1.5, sk), s = T * (0.6 + 0.9 * sk) * M.star;
      if (sk > 0.05) { K.glow(c, x, y, s * 3.2, '#FFFFFF', 0.5 * sk); TN.twinkle(c, x, y, s, '#FFFFFF', sk); TN.twinkle(c, x, y, s * 0.5, '#FFFFFF', sk); }
      if (M.sigil > 0.01) { const g = smooth(M.sigil), Ro = T * 2.4 * g, a = t * 0.9; c.save(); c.globalAlpha = g; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.ellipse(x, y, Ro, Ro * 0.92, 0, 0, TAU); c.stroke();
        motePaint(c, x + Math.cos(a) * Ro, y + Math.sin(a) * Ro * 0.92, T * 0.45 * g, 'sun', lw, t); motePaint(c, x - Math.cos(a) * Ro, y - Math.sin(a) * Ro * 0.92, T * 0.45 * g, 'moon', lw, t); c.restore(); } }
    c.restore(); }
  /* a sun (amber disc with short rays) or a moon (a cyan crescent): marks, motes, symbols, the sigil */
  function motePaint(c, x, y, r, kind, lw, t) { const Kc = KIND[kind]; c.save(); c.lineJoin = 'round';
    if (kind === 'sun') { c.fillStyle = Kc.col; c.strokeStyle = LINE; c.lineWidth = Math.max(1, lw * 0.8); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + (t || 0) * 0.6; c.beginPath(); c.moveTo(x + Math.cos(a - 0.2) * r * 1.05, y + Math.sin(a - 0.2) * r * 1.05); c.lineTo(x + Math.cos(a) * r * 1.55, y + Math.sin(a) * r * 1.55); c.lineTo(x + Math.cos(a + 0.2) * r * 1.05, y + Math.sin(a + 0.2) * r * 1.05); c.closePath(); c.fill(); c.stroke(); }
      TN.shape(c, TN.ell(x, y, r, r), { col: Kc.col, shade: Kc.shade, hi: Kc.hi, line: LINE, lw, r, force: true, spec: 0.8, specAt: [x - r * 0.35, y - r * 0.4] }); }
    else { const path = cc => { cc.arc(x, y, r, Math.PI * 0.32, Math.PI * 1.68, false); cc.arc(x + r * 0.42, y - r * 0.08, r * 0.78, Math.PI * 1.52, Math.PI * 0.48, true); cc.closePath(); };
      TN.shape(c, path, { col: Kc.col, shade: Kc.shade, hi: Kc.hi, line: LINE, lw, r, force: true, spec: 0.8, specAt: [x - r * 0.55, y - r * 0.3] }); }
    c.restore(); }
  /* the third, broken white ring: three arcs about the sphere that fill as the Conjunction's countdown; the three
     symbols over the sphere, in order: the ribbon sweep, the mark, the eye beam */
  function paintRing3(c, FX, Xc, Yc, T, t) { const M = FX.mem, J = M.cj, k = M.ring3K, R = RING3_R * T, w = Math.max(4, T * 0.34), gap = 0.26, rot0 = -Math.PI / 2 - TAU / 6 + (J ? 0 : (M.bt || 0) * 0.04), lw = Math.max(1.3, T * 0.075);
    c.save(); c.globalAlpha *= k; c.lineCap = 'butt';
    for (let i = 0; i < 3; i++) { const a0 = rot0 + i * TAU / 3 + gap / 2, a1 = rot0 + (i + 1) * TAU / 3 - gap / 2, fill = M.ringFill ? M.ringFill[i] : 0;
      c.strokeStyle = LINE; c.lineWidth = w + 4; c.beginPath(); c.arc(Xc, Yc, R, a0, a1); c.stroke();
      c.strokeStyle = 'rgba(200,196,220,.55)'; c.lineWidth = w; c.beginPath(); c.arc(Xc, Yc, R, a0, a1); c.stroke();
      if (fill > 0.002) { const ae = a0 + (a1 - a0) * fill; c.strokeStyle = WHITE; c.lineWidth = w * 0.86; c.beginPath(); c.arc(Xc, Yc, R, a0, ae); c.stroke(); if (fill < 1) K.glow(c, Xc + Math.cos(ae) * R, Yc + Math.sin(ae) * R, w * 2.6, '#FFFFFF', 0.5); }
      // its broken ends: angular notches
      for (const a of [a0, a1]) { const cx = Xc + Math.cos(a) * R, cy = Yc + Math.sin(a) * R; c.fillStyle = LINE; c.beginPath(); c.moveTo(cx + Math.cos(a) * w * 0.9, cy + Math.sin(a) * w * 0.9); c.lineTo(cx - Math.sin(a) * w * 0.35 * (a === a0 ? 1 : -1), cy + Math.cos(a) * w * 0.35 * (a === a0 ? 1 : -1)); c.lineTo(cx - Math.cos(a) * w * 0.9, cy - Math.sin(a) * w * 0.9); c.closePath(); c.fill(); } }
    c.restore();
    if (!J) return;
    const act = J.fired.findIndex(v => v < 0);
    for (let i = 0; i < 3; i++) { if (J.sym[i] < 0) continue; const ap = smooth((J.t - J.sym[i]) / 0.35), x = Xc + (i - 1) * 1.75 * T, y = Yc - (SR + 1.75) * T + (1 - ap) * T * 0.6, pu = act === i ? 1 + 0.14 * Math.sin(t * 8) : 1, r = T * 0.66 * pu, done = J.fired[i] >= 0;
      c.save(); c.globalAlpha *= ap * (done ? 0.6 : 1);
      c.fillStyle = '#14142A'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = lw * 2.2; c.stroke(); c.strokeStyle = act === i ? '#FFFFFF' : 'rgba(220,216,240,.8)'; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke();
      if (i === 0) { c.lineCap = 'round'; c.strokeStyle = LINE; c.lineWidth = r * 0.42; c.beginPath(); c.arc(x, y, r * 0.55, Math.PI * 0.75, Math.PI * 2.25); c.stroke(); c.strokeStyle = AMB.col; c.lineWidth = r * 0.28; c.stroke(); c.fillStyle = AMB.pale; c.beginPath(); const ea = Math.PI * 2.25, ex = x + Math.cos(ea) * r * 0.55, ey = y + Math.sin(ea) * r * 0.55; c.moveTo(ex + r * 0.28, ey - r * 0.05); c.lineTo(ex - r * 0.1, ey + r * 0.3); c.lineTo(ex - r * 0.12, ey - r * 0.28); c.closePath(); c.fill(); }
      else if (i === 1) { if (J.kind) motePaint(c, x, y, r * 0.5, J.kind, lw * 0.8, t); else { c.fillStyle = AMB.col; c.beginPath(); c.arc(x, y, r * 0.5, Math.PI / 2, Math.PI * 1.5); c.fill(); c.fillStyle = CYN.col; c.beginPath(); c.arc(x, y, r * 0.5, -Math.PI / 2, Math.PI / 2); c.fill(); } }
      else { const ew = r * 0.62, eh = r * 0.36; c.beginPath(); c.moveTo(x - ew, y); c.lineTo(x - ew * 0.4, y - eh); c.lineTo(x + ew * 0.4, y - eh); c.lineTo(x + ew, y); c.lineTo(x + ew * 0.4, y + eh); c.lineTo(x - ew * 0.4, y + eh); c.closePath(); c.fillStyle = '#EDE8FA'; c.fill(); c.strokeStyle = LINE; c.lineWidth = lw * 0.8; c.stroke(); c.fillStyle = UNSEEN; c.beginPath(); c.moveTo(x, y - eh * 0.85); c.lineTo(x + eh * 0.7, y); c.lineTo(x, y + eh * 0.85); c.lineTo(x - eh * 0.7, y); c.closePath(); c.fill(); c.fillStyle = '#05050A'; c.fillRect(x - r * 0.05, y - eh * 0.7, r * 0.1, eh * 1.4); }
      // its number, and once it has passed, whether it was answered
      label(c, String(i + 1), x + r * 0.78, y - r * 0.78, T, '#FFFFFF', Math.max(10, T * 0.42));
      if (done && J.res[i]) label(c, J.res[i] === 'ok' ? '✓' : '✗', x, y + r * 1.25, T, J.res[i] === 'ok' ? '#9CF0B8' : ROSE, Math.max(11, T * 0.55));
      c.restore(); } }
  // during a mark, a gold arrow at the edge of the view toward the mote or the nearest beacon when it is off screen
  function edgeArrow(c, FX, wx, wy, s, t, i) { const V = K.viewBox(c, 0), SW = (typeof arc !== 'undefined' && arc.W) || V[2], SH = (typeof arc !== 'undefined' && arc.H) || V[3], x0 = 40, x1 = SW - 40, y0 = 160, y1 = SH - 200, cx = SW / 2, cy = SH / 2, X = FX.sx(wx), Y = FX.sy(wy);
    if (X > x0 && X < x1 && Y > y0 && Y < y1) return;
    const dx = X - cx, dy = Y - cy, k = Math.min(Math.abs((x1 - cx) / (dx || 1e-6)), Math.abs((y1 - cy) / (dy || 1e-6)), 1), ex = cx + dx * k, ey = cy + dy * k, a = Math.atan2(dy, dx), pu = 0.5 + 0.5 * Math.sin(t * 6 + i);
    c.save(); c.translate(ex, ey); K.glow(c, 0, 0, 30, GOLD, 0.35 + 0.25 * pu); c.fillStyle = GOLD; c.strokeStyle = '#2B2433'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill(); c.stroke(); c.rotate(a); c.fillStyle = '#2B2433'; c.beginPath(); c.moveTo(9, 0); c.lineTo(-4, -7); c.lineTo(-4, 7); c.closePath(); c.fill(); c.restore();
    label(c, s, Math.max(x0 + 24, Math.min(x1 - 24, ex)), ey + 28, 20, '#FFFFFF', 11); }

  /* ---------- the ground: the Drained Lake, a round floor of pale stone over grey water ---------- */
  function paintFloor(c, A) { const rnd = A.rnd, E = A.R + 1.5;
    // the lake round it: a dead grey mirror, a few last specks of colour sinking in it
    { const g = c.createRadialGradient(0, 0, FLOOR, 0, 0, E); g.addColorStop(0, '#2A2A34'); g.addColorStop(0.3, '#1C1C24'); g.addColorStop(0.85, '#121218'); g.addColorStop(1, 'rgba(18,18,24,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, E, 0, TAU); c.fill();
      c.lineCap = 'round'; for (let i = 0; i < 220; i++) { const a = rnd() * TAU, d = FLOOR + 0.6 + rnd() * (E - FLOOR - 1), x = Math.cos(a) * d, y = Math.sin(a) * d, w = 0.3 + rnd() * 0.9; c.strokeStyle = `rgba(196,196,208,${0.05 + rnd() * 0.16 * (1 - (d - FLOOR) / (E - FLOOR))})`; c.lineWidth = 0.05 + rnd() * 0.04; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y); c.stroke(); }
      for (const [r, a] of [[FLOOR + 0.8, 0.2], [FLOOR + 1.8, 0.12], [FLOOR + 3.0, 0.06]]) { c.strokeStyle = `rgba(190,190,204,${a})`; c.lineWidth = 0.08; c.beginPath(); for (let i = 0; i <= 120; i++) { const t2 = i / 120 * TAU, rr = r + Math.sin(t2 * 11 + r) * 0.1; i ? c.lineTo(Math.cos(t2) * rr, Math.sin(t2) * rr) : c.moveTo(Math.cos(t2) * rr, Math.sin(t2) * rr); } c.stroke(); }
      for (let i = 0; i < 14; i++) { const a = rnd() * TAU, d = FLOOR + 1 + rnd() * 3.5; c.fillStyle = COL.HUE[i % 6]; c.globalAlpha = 0.18 + rnd() * 0.15; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 0.07 + rnd() * 0.06, 0, TAU); c.fill(); } c.globalAlpha = 1; }
    // the floor's edge stones, a lip over the water
    c.fillStyle = '#26262E'; c.beginPath(); c.arc(0, 0.25, FLOOR + 0.1, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, FLOOR, 0, TAU); c.clip();
    // pale stone drained to grey: rings of paving, staggered seams, faint stains where colour once lay
    { const g = c.createRadialGradient(0, 2, 2, 0, 0, FLOOR); g.addColorStop(0, '#53535E'); g.addColorStop(0.6, '#474752'); g.addColorStop(1, '#383842'); c.fillStyle = g; c.fillRect(-FLOOR, -FLOOR, FLOOR * 2, FLOOR * 2);
      for (let i = 0; i < 12; i++) { const x = (rnd() * 2 - 1) * FLOOR * 0.8, y = (rnd() * 2 - 1) * FLOOR * 0.8, r = 1.5 + rnd() * 3.5, gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(${hexRGB(COL.HUE[i % 6]).join(',')},.06)`); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); } }
    const rings = []; for (let r = PIT + 0.7; r < FLOOR; r += 1.55) rings.push(r); rings.push(FLOOR);
    c.lineCap = 'round';
    rings.forEach((r, i) => { c.strokeStyle = 'rgba(16,16,24,.42)'; c.lineWidth = 0.07; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(210,210,222,.12)'; c.lineWidth = 0.04; c.beginPath(); c.arc(0, 0, r + 0.07, 0, TAU); c.stroke();
      if (i < rings.length - 1) { const n = Math.round(r * 1.25), off = (i % 2) * 0.5; for (let k = 0; k < n; k++) { const a = (k + off) / n * TAU; c.strokeStyle = 'rgba(16,16,24,.36)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a) * rings[i + 1], Math.sin(a) * rings[i + 1]); c.stroke(); } } });
    // an engraved ring with twelve marks about the well: the sun and the moon in balance, once
    c.strokeStyle = 'rgba(220,220,232,.18)'; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, 7.6, 0, TAU); c.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 7.2, Math.sin(a) * 7.2); c.lineTo(Math.cos(a) * 8.0, Math.sin(a) * 8.0); c.stroke(); }
    for (let i = 0; i < 500; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(20,20,28,.25)' : 'rgba(230,230,240,.1)'; c.fillRect((rnd() * 2 - 1) * FLOOR, (rnd() * 2 - 1) * FLOOR, 0.06, 0.06); }
    for (let i = 0; i < 10; i++) { let x = (rnd() * 2 - 1) * FLOOR * 0.8, y = (rnd() * 2 - 1) * FLOOR * 0.8; c.strokeStyle = 'rgba(14,14,20,.4)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 1.6; y += (rnd() - 0.5) * 1.6; c.lineTo(x, y); } c.stroke(); }
    // the well under the sphere: the lake seen through the floor, the fallen colour glowing faintly down there
    { const g = c.createRadialGradient(0, 0, 0, 0, 0, PIT); g.addColorStop(0, '#16102A'); g.addColorStop(0.7, '#0C0A18'); g.addColorStop(1, '#06060C'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, PIT, 0, TAU); c.fill();
      const g2 = c.createRadialGradient(0, 0.4, 0, 0, 0.4, PIT * 0.9); g2.addColorStop(0, 'rgba(224,76,255,.28)'); g2.addColorStop(0.6, 'rgba(76,255,216,.08)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(-PIT, -PIT, PIT * 2, PIT * 2); }
    c.restore();
    for (const [r, w, col] of [[PIT, 0.16, 'rgba(10,10,16,.9)'], [PIT + 0.1, 0.05, 'rgba(220,220,232,.3)'], [FLOOR, 0.16, 'rgba(10,10,16,.85)'], [FLOOR - 0.13, 0.05, 'rgba(230,230,240,.32)']]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); } }
  /* the backdrop: a night drained of colour over a dead grey lake, the scar where the colour fell; once it falls, a clear
     blue dusk */
  function paintSky(c, W, H, blue) { const R = mulberry32(4243), g = c.createLinearGradient(0, 0, 0, H), hz = H * 0.5;
    if (!blue) { g.addColorStop(0, '#050508'); g.addColorStop(0.32, '#0E0E16'); g.addColorStop(0.5, '#22222C'); g.addColorStop(0.56, '#16161E'); g.addColorStop(1, '#0C0C12'); }
    else { g.addColorStop(0, '#142252'); g.addColorStop(0.3, '#2A4C92'); g.addColorStop(0.5, '#9CC8F2'); g.addColorStop(0.56, '#3E7CC4'); g.addColorStop(1, '#183A74'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { c.globalAlpha = (blue ? 0.3 : 0.15) + R() * 0.45; c.fillStyle = blue ? '#FFFFFF' : '#B8B8C4'; c.beginPath(); c.arc(R() * W, R() * hz * 0.95, 0.5 + R() * R() * 1.6, 0, TAU); c.fill(); } c.globalAlpha = 1;
    // the scar where it fell: a long soft streak down the sky
    if (!blue) { c.save(); c.lineCap = 'round'; for (const [w, a] of [[26, 0.05], [12, 0.08], [4, 0.16]]) { c.strokeStyle = `rgba(224,76,255,${a})`; c.lineWidth = w; c.beginPath(); c.moveTo(W * 0.88, H * 0.04); c.quadraticCurveTo(W * 0.66, H * 0.22, W * 0.52, hz - 6); c.stroke(); } c.restore(); }
    else { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7; blitSized(c, glowSprite('#FFFFFF'), W * 0.5 - 50, H * 0.14 - 50, 100, 100); c.globalAlpha = 0.5; blitSized(c, glowSprite('#CFE6FF'), W * 0.5 - W * 0.6, hz - H * 0.18, W * 1.2, H * 0.3); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    // the far shore: low grey hills
    c.fillStyle = blue ? '#2E4E80' : '#121218'; c.beginPath(); c.moveTo(0, hz); for (let x = 0; x <= W; x += W / 24) c.lineTo(x, hz - 6 - Math.abs(Math.sin(x * 0.013 + 1)) * 16 - R() * 5); c.lineTo(W, hz); c.closePath(); c.fill();
    c.lineCap = 'round'; for (let i = 0; i < 80; i++) { const y = hz + 4 + Math.pow(R(), 1.6) * (H - hz), x = R() * W, w = 6 + R() * 26 * (y - hz) / (H - hz); c.strokeStyle = blue ? `rgba(230,244,255,${0.12 + R() * 0.25})` : `rgba(190,190,204,${0.04 + R() * 0.1})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y); c.stroke(); } }
})());
