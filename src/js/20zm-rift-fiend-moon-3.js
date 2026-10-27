/* ---------- YLTH-MORA, THE HOLLOW HEART ----------
   The Hollow Moon's last boss, in the Heart of the Moon: a round island of pale pearl-sand and shell some thirty-one
   metres across, adrift on the silver-black inner sea, tide pools in its sand and coral round its rim, four tide-lanterns
   standing on it, pale lotus burning gold on the water round it.
   Ylth-Mora is the thing at the moon's heart that pulls: an enormous translucent jellyfish-heart risen out of the sea at
   the north, a vast glassy bell of pearl and teal with the BLACK SUN inside it (a dark disc in a pale gold corona), ribbed
   with silver veins that pulse with its beat, a fringe of long trailing tendrils going down into the water, a ring of pale
   eye-pearls round its rim that open and close, and six smaller arms that rise and fall out of the sea round the island.
   It breathes slowly; everything round it sways toward it; struck, it flinches back.
   The Pull (its signature, all fight): the whole island is dragged toward it in waves (soft arrows, the sand streaming);
   walk against it while tendrils strike shown circles near the bell.
   Tendril Slam / Sweep: tendrils rise out of the sea and slam down along shown lanes, or one sweeps a shown arc.
   Eclipse (from 65%): the black sun flares dark: the island dims to a soft circle of light round the pet, the eye-pearls
   open and loose slow motes of light. Stand by each of the four tide-lanterns to light it; all four lit, the eclipse
   breaks early and it reels.
   The High Tide (once, at 45%): the sea rises over the rim and an army pours out of it, three hundred tidelings and
   eclipse moths (no more than sixty at once); it is sealed away meanwhile and keeps up a light Pull. When the tide is
   spent it collapses onto the sand, its black heart bared.
   The Weight of the Heart (once, at 20%): it pulls everything into its heart: the island crumbles from the rim inward and
   the pull grows. Its collapse drops three moonpearls: carry each into the bell's reach and its heart breaks open; then
   finish it.
   The big mechanics are sequenced, never stacked. Its fall hands over to the rift's sealing: the black sun goes out and
   a pale dawn fills the hollow. */
RiftFiend.define({ id: 'ylthmora', name: 'Ylth-Mora', title: 'The Hollow Heart', color: '#A9C8F0', glow: '#7FD8E0', accent: '#FFF0B8', biome: 'innertide', r: 3.4, els: ['water', 'dark', 'light'], phases: 3, cuts: [1, 0.65, 0.3] }, (() => {
  const { TAU, TN } = RiftFiend, K = DunFiend.KIT, { INK, SILVER, MOONSTONE, MOON_HI, INDIGO, TIDE, TIDE_HI, PEARL, GOLD, GOLD_HI, BLACKSUN, ROSE } = MOON;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u, smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const sf = (FX, k) => { const s = FX.H.sfx; if (s && s[k]) s[k](); };
  const LINE = '#1A2234', TEND_B = { col: '#8CC4D6', shade: '#5A94AC', shade2: '#3F7088', hi: '#E2F6FA', line: LINE }, ROSE_HI = '#FFB8D6';
  /* the island (about the arena's centre C): its radius; the bell's axis on the sea (BY), its rim's height, half-width and
     depth, the dome's height, the sun inside; how far it slumps forward onto the sand when spent */
  const ISL = 15.6, BY = -18.2, RZ = 4.4, BW = 9.4, RIMK = 0.3, BH = 7.8, SUN_H = 3.3, SUN_R = 2.3, SAGDY = 7.2, SAG_RZ = 0.9, BOSS_Y = -24;
  const FOOT = [0, -15.0], REACH = [0, -12.2], REACH_R = 2.8, CR_MIN = 9.6;
  const LANTERNS = [[-9.2, -3.2], [9.2, -3.2], [-6.6, 7.6], [6.6, 7.6]];
  const ARMS = [-124, -56, 180, 0, 128, 52].map((dg, i) => { const a = dg * Math.PI / 180, r = ISL + 1.5; return { i, x: Math.cos(a) * r, y: Math.sin(a) * r, ph: i * 1.7 }; });
  // the eye-pearls round the front of its rim, the fringe between them, the long tendrils trailing behind
  const EYE_PHI = Array.from({ length: 9 }, (_, i) => Math.PI * (0.1 + 0.8 * i / 8));
  const FRINGE = Array.from({ length: 10 }, (_, i) => ({ phi: Math.PI * (0.05 + 0.9 * i / 9), ph: i * 1.31, len: 0.8 + ((i * 7) % 5) * 0.18 }));
  const BACKT = Array.from({ length: 7 }, (_, i) => ({ phi: Math.PI * (1.08 + 0.84 * i / 6), ph: i * 2.1 }));
  const VEINS = Array.from({ length: 9 }, (_, i) => Math.PI * (0.07 + 0.86 * i / 8));
  const CRACKS = (() => { const R = mulberry32(8123), out = []; for (let k = 0; k < 3; k++) { const a0 = -Math.PI / 2 + (k - 1) * 1.9 + (R() - 0.5) * 0.4, pts = [[0, 0]]; let x = 0, z = 0; for (let j = 0; j < 6; j++) { const a = a0 + (R() - 0.5) * 0.9; x += Math.cos(a) * (0.7 + R() * 0.5); z -= Math.sin(a) * (0.7 + R() * 0.5); pts.push([x, z]); } out.push(pts); } return out; })();
  const CYC1 = ['pull', 'slam', 'sweep', 'slam', 'pull', 'sweep'], CYC2 = ['pull', 'slam', 'sweep', 'pull', 'slam', 'eclipse'], CYC3 = ['pull', 'sweep', 'slam', 'eclipse', 'pull', 'slam'];
  const HORDE = 200, HORDE_CAP = 50, WAVE = 50, HORDE_MIX = [['tideling', 55], ['eclipsemoth', 45]], TIDE_AT = 0.45, WT_AT = 0.2, PULL_V = 2.6;
  const PEARL_AT = [[-5.8, -1.4], [6.0, -0.4], [0.3, 1.8]];   // high on the island, clear of the buttons
  // the pull comes in waves
  const wave = t => 0.35 + 0.65 * (0.5 - 0.5 * Math.cos(TAU * t / 2.4));
  let darkCv = null;
  return {
    arenaR: 19, firstAct: 'breathe', ambient: 'motes',
    artPoses: [{ name: 'breathing', mem: { demo: 1 } }, { name: 'collapsed on the sand', mem: { demo: 1, demoSag: 1 } }, { name: 'eclipse', mem: { demo: 1, demoDark: 1 } }],
    phaseNames: ['The Pull', 'Eclipse', 'The Weight of the Heart'],
    start(C) { return { x: C.x + 0.5, y: C.y + 3.5 }; },
    // the walkable ground is the island, less the lanterns' feet
    carve(set, C) { const RR = Math.ceil(C.R) + 2; for (let y = -RR; y <= RR; y++) for (let x = -RR; x <= RR; x++) { const wx = Math.floor(C.x) + x, wy = Math.floor(C.y) + y, cx = wx + 0.5 - C.x, cy = wy + 0.5 - C.y;
        if (Math.hypot(cx, cy) > ISL - 0.15 || LANTERNS.some(L => Math.abs(cx - L[0]) < 0.5 && Math.abs(cy - L[1]) < 0.5)) set(wx, wy, T_SOLID); } },
    props(C) { return LANTERNS.map((L, i) => ({ kind: 'lantern', i, x: C.x + L[0], y: C.y + L[1] + 0.3 })).concat(ARMS.map(A => ({ kind: 'arm', i: A.i, x: C.x + A.x, y: C.y + A.y }))); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'lantern') drawLantern(c, FX, p, X, Y, T, t); else if (p.kind === 'arm') drawArm(c, FX, p, X, Y, T, t); },
    paintGround(c, A) { paintIsland(c, A); },
    sky(c, W, H, t, cam, T, FX) { paintSky(c, W, H, T, !!(FX && FX.m && FX.m.dead)); },
    skyKey(FX) { return FX.m && FX.m.dead ? 'dawn' : 'hollow'; },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    camFocus(FX, m) { const C = FX.C, M = FX.mem; if (!M.P) return null;
      if (m.dead) return M.deadT != null && M.deadT < 3.5 ? { x: C.x, y: C.y - 16, k: 0.7, zoom: 0.42 } : null;
      if (m.act === 'enter') return { x: C.x, y: C.y - 20, k: 0.7, zoom: 0.4 };
      if (m.stunT > 0) return { x: C.x, y: C.y - 13, k: 0.5, zoom: 0.45 };
      if (M.wt) return { x: C.x, y: C.y - 9, k: 0.85, zoom: 0.4 };
      // the tide and the eclipse: close on the pet and following it, as in a dungeon (the bell sinks away meanwhile)
      if (M.hd || M.ecl) return { x: FX.me.x, y: FX.me.y, k: 0, zoom: 0.7 };
      return { x: C.x, y: C.y - 21.5, k: 0.55, zoom: 0.4 }; },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.noTouch = true; m.touchK = 0;
      Object.assign(M, { bt: 0, q: [], qt: 0, seen: {}, picks: 0, nextSig: null, recoil: 0, why: null, wasStun: false, roared: false, beat: 0, beatT: 2, pull: 0, pl: null, sway: 0, look: [0, 0.4], actEnd: 0,
        eyes: EYE_PHI.map((a, i) => ({ i, b: 1, open: i % 2 === 0, ot: 1 + i * 0.6, bl: 0, bt: 1.5 + i * 0.5 })),
        lan: LANTERNS.map(() => ({ lit: 0, on: false, ch: 0 })),
        tend: [], ecl: null, hd: null, hdDone: false, wt: null, wtDone: false, CR: ISL, surges: [], falls: [], ripples: [], tideK: 0, dark: 0, sunK: 1, flare: 0, dawn: 0, cracks: 0, fellCd: 0,
        stat: { pulls: 0, pullMoved: 0, stabs: 0, stabHit: 0, lanes: 0, laneHit: 0, sweeps: 0, sweepHit: 0, eclipses: 0, eclEarly: 0, eclPassed: 0, motes: 0, lit: 0, poured: 0, fell: 0, pearls: 0, broken: 0, bared: 0 } });
      M.P = { sag: 0, wake: 0, rec: 0, sink: 0 }; m.x = C.x; m.y = C.y + BOSS_Y; },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; resetAll(FX, m); M.recoil = 1; FX.H.shake(10, 0.5); FX.H.flash(0.2, TIDE_HI); sf(FX, 'hum');
      if (lv === 2) { M.nextSig = 'eclipse'; M.picks = 0; minions(FX, ['tideling', 'eclipsemoth']); FX.H.banner('ECLIPSE', 'The black sun will flare dark: light the four tide-lanterns to break it', GOLD_HI, 2.8, true); }
      if (lv >= 3) { M.nextSig = 'pull'; M.picks = 0; minions(FX, ['eclipsemoth', 'tideling']); FX.H.banner('IT PULLS HARDER', 'Its weight grows: everything quickens', TIDE_HI, 2.6, true); } },
    ai(FX, m, dt) {
      const M = FX.mem, lv = FX.S.lv; m.actT += dt; m.noTouch = true;
      M.qt += dt; while (M.q.length && M.q[0].at <= M.qt) M.q.shift().fn();
      // the high tide once, at 45%; the weight of the heart once, at 20%
      if (!M.hdDone && !M.hd && lv >= 2 && m.act === 'breathe' && m.hp <= m.maxhp * TIDE_AT) startTide(FX, m);
      else if (!M.wtDone && !M.wt && lv >= 3 && m.act === 'breathe' && m.hp <= m.maxhp * WT_AT) startWeight(FX, m);
      switch (m.act) {
        case 'breathe': if (m.actT > (lv >= 3 ? 1.2 : lv >= 2 ? 1.5 : 1.8) / FX.S.fast) choose(FX, m); break;
        case 'pull': pullTick(FX, m, dt); break;
        case 'slam': case 'sweep': if (!M.q.length && m.actT > M.actEnd && !FX.S.tele.some(s => s.ink && !s.done)) endAct(m); break;
        case 'eclipse': eclipseTick(FX, m, dt); break;
        case 'tide': tideTick(FX, m, dt); break;
        case 'weight': weightTick(FX, m, dt); break;
      }
      if (!m.under) FX.parts(partsList(FX, m));
    },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; const h = heartAt(FX); FX.weak('heart', h[0], h[1] - h[2], 2.4, M.why === 'broken' ? 3 : 2.5, m.stunT > 0.05 && M.P.sag > 0.6);
      M.shT = (M.shT || 0) - dt; if (M.shT <= 0) { M.shT = 0.4; FX.H.sparks(h[0] + FX.rnd(-1.4, 1.4), h[1] - h[2] + FX.rnd(-1, 1), GOLD_HI, 4, 3); } if (!m.under) FX.parts(partsList(FX, m)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, C = FX.C, me = FX.me; if (!m || !M.P) return; M.bt += dt;
      M.recoil = decay(M.recoil, dt, 2.2); M.beat = decay(M.beat, dt, 2.4); M.flare = decay(M.flare, dt, 1.5); M.fellCd -= dt;
      if (m.dead) { deadTick(FX, m, dt); return; }
      // (it cannot be beaten past the high tide or the weight of the heart before they are answered; while its heart is
      // weighed every blow is held)
      if (M.wt) { if (m.hp < M.wt.hp0) m.hp = M.wt.hp0; }
      else { if (!M.hdDone && m.hp < m.maxhp * 0.4) m.hp = m.maxhp * 0.4; if (!M.wtDone && m.hp < m.maxhp * 0.16) m.hp = m.maxhp * 0.16; }
      if (!(m.stunT > 0)) { if (FX.S.weak.heart) FX.weak('heart', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.why = null; M.recoil = 1; FX.H.text(C.x, C.y - 9, 'It rises from the sand again', TIDE_HI, 13); sf(FX, 'hum'); } } else M.wasStun = true;
      if (m.act === 'enter' && (FX.S.enterT || 0) > 1.8 && !M.roared) { M.roared = true; M.recoil = 1; M.flare = 1; FX.H.shake(10, 0.8); FX.H.flash(0.22, TIDE_HI); sf(FX, 'hum'); }
      // its beat: slow, the veins pulsing with it
      M.beatT -= dt; if (M.beatT <= 0) { M.beatT = FX.S.lv >= 3 ? 1.6 : 2.1; M.beat = 1; }
      M.sway = Math.sin(M.bt * 0.23) * 1.2;
      // the eye-pearls: they open and close in turn, follow the pet, all open for an eclipse, shut when struck
      M.look[0] = toward(M.look[0], clamp((me.x - C.x) / 12, -1, 1), dt, 5); M.look[1] = toward(M.look[1], clamp((me.y - (C.y + BY)) / 22, -0.3, 1), dt, 5);
      for (const e of M.eyes) { e.ot -= dt; if (e.ot <= 0) { e.ot = 1.8 + Math.random() * 3.4; e.open = !e.open; } e.bt -= dt; if (e.bt <= 0) { e.bt = 2.5 + Math.random() * 3; e.bl = 1; } e.bl = decay(e.bl, dt, 5);
        const wantOpen = M.ecl ? 1 : m.stunT > 0 ? 0 : e.open ? 1 : 0.15, blink = e.bl > 0 && !M.ecl ? Math.sin(e.bl * Math.PI) : 0, wk = clamp((M.P.wake - 0.5 - e.i * 0.04) / 0.3, 0, 1);
        e.b = toward(e.b, Math.max(1 - wantOpen * wk, blink, M.recoil * 0.6), dt, 9); }
      lanterns(FX, m, dt);
      pullApply(FX, m, dt);
      tendrils(FX, m, dt);
      flyers(FX, m, dt);
      for (const r of M.ripples) r.t += dt; while (M.ripples.length && M.ripples[0].t > 1.6) M.ripples.shift();
      M.tideK = toward(M.tideK, M.hd ? 1 : 0, dt, M.hd ? 0.8 : 0.6); M.sink = toward(M.sink || 0, M.hd ? 1 : 0, dt, M.hd ? 0.9 : 1.1); M.dark = toward(M.dark, M.ecl ? 1 : 0, dt, M.ecl ? 1.6 : 1.2);
      // the rim falls into the sea while its heart is weighed: a pet past the crumbled edge falls in and is thrown back
      if (M.CR < ISL - 0.05) { const dx = me.x - C.x, dy = me.y - C.y, d = Math.hypot(dx, dy) || 1; if (d > M.CR - 0.15 && M.fellCd <= 0 && !me.dead) { M.fellCd = 0.8; M.stat.fell++; FX.hurt(m.dmg * 0.45); me.push = { vx: -dx / d * 11, vy: -dy / d * 11, t: 0.28 }; FX.H.text(me.x, me.y - 1.6, 'The rim gives way!', ROSE_HI, 13); FX.H.sparks(me.x, me.y, TIDE_HI, 10, 5); sf(FX, 'splash'); } }
      easePose(FX, m, dt); },
    dmgK(FX, m) { const M = FX.mem; M.recoil = Math.max(M.recoil || 0, 0.45); return M.wt ? 0.3 : 0.85; },
    onWeakHit(FX) { FX.mem.recoil = 1; },
    // (it cannot fall before its heart has been broken open)
    holdOn(FX, m) { return !FX.mem.wtDone; },
    keep: { every: 2, pad: 2 },
    draw(c, FX, m, X, Y, T, t) { Y += (m.z || 0) * T * 4; if (!(FX.S && FX.S.started)) { demoPaint(c, FX, m, X, Y, T, t); return; } const M = FX.mem, sk = M && M.sink || 0; if (sk > 0.97) return; if (sk > 0.01) { c.save(); c.globalAlpha = 1 - smooth(sk); Y += smooth(sk) * T * 2.5; } const P3 = TN.cam(X, Y, T, m); paintAll(c, FX, m, P3, T); if (sk > 0.01) c.restore(); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.2 : 1.2, true); }
  function at(M, dt, fn) { M.q.push({ at: M.qt + dt, fn }); M.q.sort((a, b) => a.at - b.at); }
  function endAct(m) { m.act = 'breathe'; m.actT = 0; }
  function onIsle(C, x, y, pad) { return Math.hypot(x - C.x, y - C.y) < ISL - (pad || 0); }
  function inside(C, x, y, pad) { const dx = x - C.x, dy = y - C.y, d = Math.hypot(dx, dy), R = ISL - (pad || 0); return d > R ? { x: C.x + dx / d * R, y: C.y + dy / d * R } : { x, y }; }
  function minions(FX, types) { const C = FX.C, me = FX.me, alive = FX.H.mons.filter(q => !q.dead && q.fminion && !q.horde).length; types.slice(0, Math.max(0, 3 - alive)).forEach((ty, i) => { const a = Math.atan2(me.y - C.y, me.x - C.x) + Math.PI + (i - 0.5) * 1.1, p = inside(C, C.x + Math.cos(a) * 9, C.y + Math.sin(a) * 8, 2); splash(FX, p.x, p.y, 1.4); const q = FX.minion(ty, p.x, p.y); if (q) q.cd = 1.5; }); }
  function splash(FX, x, y, r) { FX.H.ring(x, y, 0.2, r, 0.4, TIDE_HI, 0.35); for (let i = 0; i < 8; i++) FX.H.part({ kind: 'spark', x: x + FX.rnd(-0.4, 0.4), y, vx: FX.rnd(-3, 3), vy: FX.rnd(-6, -2.5), g: 12, life: 0.6, max: 0.6, size: 3, color: Math.random() < 0.5 ? TIDE_HI : PEARL }); }
  function resetAll(FX, m) { const M = FX.mem; M.q.length = 0; FX.S.tele.length = 0; M.pl = null; if (M.ecl) endEclipse(FX, m, null); for (const tn of M.tend) tendBack(tn); FX.untarget(false); m.act = 'breathe'; m.actT = 0; }
  function choose(FX, m) { const M = FX.mem, lv = FX.S.lv; m.actT = 0; let a = M.nextSig; M.nextSig = null;
    if (!a) { const cyc = lv >= 3 ? CYC3 : lv >= 2 ? CYC2 : CYC1; a = cyc[M.picks++ % cyc.length]; }
    if (a === 'pull') return startPull(FX, m); if (a === 'slam') return startSlam(FX, m); if (a === 'sweep') return startSweep(FX, m); if (a === 'eclipse' && lv >= 2) return startEclipse(FX, m); return startPull(FX, m); }
  function easePose(FX, m, dt) { const M = FX.mem, P = M.P, e = FX.S.enterT || 0;
    P.sag = toward(P.sag, m.stunT > 0 ? 1 : 0, dt, m.stunT > 0 ? 2.0 : 1.4);
    P.wake = toward(P.wake, m.act === 'enter' ? clamp((e - 0.2) / 2.6, 0, 1) : 1, dt, 3); P.rec = M.recoil; }
  /* the bell's frame now: its axis on the sea, its rim's height, its breath; spent, it slumps forward onto the sand */
  function frameOf(FX) { const M = FX.mem, C = FX.C, P = M.P, sag = smooth(P.sag), bt = M.bt || 0;
    const pc = 0.5 + 0.5 * Math.sin(bt * 0.9), rec = P.rec || 0;
    return { bx: C.x + (M.sway || 0) * (1 - sag), by: C.y + BY + sag * SAGDY, rz: lerp(RZ, SAG_RZ, sag) + rec * 0.4 - (1 - smooth(P.wake)) * 15 - (P.sink || 0) * 16 + Math.sin(bt * 0.8) * 0.25 * (1 - sag),
      kx: (1 - 0.035 * pc) * (1 + sag * 0.07), kz: (1 + 0.045 * pc) * (1 - sag * 0.2) * (1 - rec * 0.06), pc, roll: Math.sin(bt * 0.31) * 0.03 - rec * 0.05 + sag * 0.04, sag, bt }; }
  // a point of the bell: u across, h up from the rim's plane, d toward the viewer (ground)
  function bellPt(F, u, h, d) { const k = F.kx * (1 - 0.06 * F.pc * (1 - clamp(h / BH, 0, 1))), x = u * k, z = h * F.kz, cr = Math.cos(F.roll), sr = Math.sin(F.roll); return [F.bx + x * cr - z * sr, F.by + (d || 0), F.rz + x * sr + z * cr]; }
  function sunAt(F) { return bellPt(F, 0, SUN_H * (1 - F.sag * 0.25), 0); }
  function heartAt(FX) { return sunAt(frameOf(FX)); }
  function eyeAt(F, i) { const a = EYE_PHI[i]; return bellPt(F, Math.cos(a) * BW * 1.02, 0.05, Math.sin(a) * BW * RIMK); }
  /* the hit proxies on its body: the bell, its rim, and the trailing tendrils where they meet the water by the shore */
  function partsList(FX, m) { const C = FX.C, F = frameOf(FX), hit = (key, p, r) => ({ key, dx: p[0] - m.x, dy: p[1] - p[2] - m.y, r });
    const out = [hit('bell', bellPt(F, 0, BH * 0.5, 0), 4.2), hit('bellW', bellPt(F, -6.2, BH * 0.25, 0), 2.8), hit('bellE', bellPt(F, 6.2, BH * 0.25, 0), 2.8), hit('rim', bellPt(F, 0, 0, BW * RIMK), 2.6)];
    for (const k of [-1, 0, 1]) out.push(hit('fr' + k, [F.bx + k * 4.6, C.y - ISL + 0.7 + Math.abs(k) * 0.6, 0], 1.7));
    return out; }

  /* ---- the attack tendrils: each rises out of the sea at its root and does one thing, then sinks back ---- */
  function rootN(FX, x) { const C = FX.C, rx = clamp(x - C.x, -ISL * 0.8, ISL * 0.8); return [C.x + rx, C.y - Math.sqrt(Math.max(0, (ISL + 1.0) ** 2 - rx * rx))]; }
  function addTend(FX, o) { const tn = Object.assign({ t: 0, st: 'rise', lift: 1, w: 1.0, px: null, pts: null, side: Math.random() < 0.5 ? -1 : 1 }, o); tn.tip = [tn.root[0], tn.root[1], -1.5]; FX.mem.tend.push(tn); FX.mem.ripples.push({ x: tn.root[0], y: tn.root[1], t: 0, r: 1.6 }); return tn; }
  function tendBack(tn) { if (tn.px) { tn.px.dead = true; tn.px = null; } if (tn.st !== 'back') { tn.st = 'back'; tn.t = 0; } }
  function tendrils(FX, m, dt) { const M = FX.mem, bt = M.bt;
    for (let i = M.tend.length - 1; i >= 0; i--) { const tn = M.tend[i]; tn.t += dt; let tgt = null, rate = 4, lift = tn.lift;
      if (tn.st === 'rise') { tgt = tn.hover; lift = 1; rate = 3.5; }
      else if (tn.st === 'strike') { if (tn.kind === 'sweep') { const u = clamp(tn.t / 0.35, 0, 1), a = lerp(tn.a0, tn.a1, smooth(u)); tgt = [tn.root[0] + Math.cos(a) * tn.len, tn.root[1] + Math.sin(a) * tn.len, 0.5]; tn.tip[0] = tgt[0]; tn.tip[1] = tgt[1]; lift = 0.15; rate = 30; if (u >= 1) { tn.st = 'lie'; tn.t = 0; } }
        else { tgt = tn.hit; lift = tn.kind === 'lane' ? 0 : 0.2; rate = 24; if (tn.t > 0.14) { tn.st = 'lie'; tn.t = 0; if (tn.kind === 'lane' && !tn.light) { const mx = (tn.root[0] + tn.hit[0]) / 2, my = (tn.root[1] + tn.hit[1]) / 2; tn.px = FX.obj({ kind: 'part', x: mx, y: my, r: 1.3, hp: 1e12, forward: 1.5, front: true }); } } } }
      else if (tn.st === 'lie') { tgt = tn.kind === 'sweep' ? null : tn.hit; rate = 20; lift = tn.kind === 'lane' ? 0 : 0.2; if (tn.t > (tn.hold || 0.7)) tendBack(tn); }
      else if (tn.st === 'back') { tgt = [tn.root[0], tn.root[1], -2.4]; rate = 3; lift = 0.6; if (tn.t > 1.1) { if (tn.px) tn.px.dead = true; M.tend.splice(i, 1); continue; } }
      if (tgt) for (let k = 0; k < 3; k++) tn.tip[k] = toward(tn.tip[k], tgt[k], dt, rate);
      tn.lift = toward(tn.lift, lift, dt, tn.st === 'strike' ? 14 : 5);
      // its points: from the root in the water, arching up (lift) and over to the tip
      const R0 = [tn.root[0], tn.root[1], -0.6], T3 = tn.tip, n = 18, pts = [], up = tn.lift * 5.5;
      // (raised, it bends to one side and its tip hooks over: a rearing tentacle, not a pillar)
      const hx = T3[0] - R0[0], hy = T3[1] - R0[1], hl = Math.hypot(hx, hy), px = hl > 0.5 ? -hy / hl : 1, py = hl > 0.5 ? hx / hl : 0, bend = tn.lift * 2.2 * tn.side;
      const P1 = [lerp(R0[0], T3[0], 0.25) + px * bend, lerp(R0[1], T3[1], 0.25) + py * bend, Math.max(R0[2], T3[2]) * 0.4 + 0.5 + up * 1.2], P2 = [lerp(R0[0], T3[0], 0.72) - px * bend * 0.7, lerp(R0[1], T3[1], 0.72) - py * bend * 0.7, T3[2] + 0.2 + up * 0.75 + tn.lift * 1.6];
      for (let j = 0; j <= n; j++) { const u = j / n, a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c2 = 3 * (1 - u) * u * u, d = u ** 3, wob = Math.sin(bt * 2.2 - u * 7 + tn.root[0]) * (0.25 + (1 - tn.lift) * 0.3) * u * (1 - u) * 4;
        const dx = T3[0] - R0[0], dy = T3[1] - R0[1], dl = Math.hypot(dx, dy) || 1;
        pts.push([a * R0[0] + b * P1[0] + c2 * P2[0] + d * T3[0] - dy / dl * wob, a * R0[1] + b * P1[1] + c2 * P2[1] + d * T3[1] + dx / dl * wob, Math.max(-0.6, a * R0[2] + b * P1[2] + c2 * P2[2] + d * T3[2])]); }
      tn.pts = pts; if (tn.px && !tn.px.dead) { const p = pts[Math.round(n * 0.6)]; tn.px.x = p[0]; tn.px.y = p[1]; } } }

  /* ---- The Pull: the island dragged toward it in waves; tendrils stab shown circles near the bell ---- */
  function startPull(FX, m) { const M = FX.mem, lv = FX.S.lv, f = FX.S.fast; m.act = 'pull'; m.actT = 0; M.q.length = 0; M.stat.pulls++;
    M.pl = { t: 0, T: (lv >= 3 ? 7.4 : 6.4) / f, k: 0, y0: FX.me.y }; const n = lv >= 3 ? 5 : 4;
    for (let i = 0; i < n; i++) at(M, (1.0 + i * 1.2) / f, () => { if (m.act === 'pull') stabOne(FX, m, false, true); });
    say(FX, 'pull', 'THE PULL', 'It drags the island toward it in waves: walk against it, out of the shown circles', TIDE_HI); }
  function pullTick(FX, m, dt) { const M = FX.mem, L = M.pl; if (!L) { endAct(m); return; } L.t += dt;
    L.k = L.t < 0.5 ? L.t / 0.5 * wave(L.t) : L.t > L.T - 0.5 ? Math.max(0, (L.T - L.t) / 0.5) * wave(L.t) : wave(L.t);
    if (L.t >= L.T && !M.q.length && !FX.S.tele.some(s => s.ink && !s.done)) { M.pl = null; endAct(m); } }
  // how hard it pulls now, and the pull on the pet (toward the bell's foot)
  function pullApply(FX, m, dt) { const M = FX.mem, me = FX.me, C = FX.C; let want = 0;
    if (m.stunT > 0) want = 0; else if (M.pl) want = M.pl.k; else if (M.hd) want = 0.34 * wave(M.bt); else if (M.wt) want = (0.42 + 0.36 * Math.min(1, M.wt.t / 26)) * wave(M.bt);
    M.pull = toward(M.pull, want, dt, 5);
    if (M.pull > 0.01 && !me.dead && !(FX.g.cineT > 0)) { const dx = C.x + FOOT[0] - me.x, dy = C.y + FOOT[1] - me.y, d = Math.hypot(dx, dy); if (d > 1.2) { const v = PULL_V * M.pull * dt; FX.push(dx / d * v, dy / d * v); } } }
  function stabOne(FX, m, light, nearBell) { const M = FX.mem, me = FX.me, C = FX.C, f = FX.S.fast;
    let x = me.x + (me.vx || 0) * 0.25, y = me.y + (me.vy || 0) * 0.25; if (nearBell) { x = clamp(x + FX.rnd(-1.4, 1.4), C.x - 9, C.x + 9); y = C.y + clamp(y - C.y, -13.4, -9.4) + FX.rnd(-0.6, 0.6); }
    const p = inside(C, x, y, 1.6), r = light ? 1.6 : 2.2, Wt = (light ? 1.3 : 1.2) / f, root = rootN(FX, p.x);
    const tn = addTend(FX, { kind: 'stab', root, hover: [p.x, p.y - 0.6, 7.5], hit: [p.x, p.y, 0.35], hold: 0.6, light, w: light ? 0.8 : 1.0 }); sf(FX, 'whoosh');
    FX.tele({ shape: 'fn', kind: 'circle', test: (px, py, rr) => Math.hypot(px - p.x, py - p.y) < r + (rr || 0), x: p.x, y: p.y, r, t: Wt, dmg: m.dmg * (light ? 0.55 : 1.3), col: TIDE_HI, ink: 'stab', fn: s => { M.stat.stabs++; if (FX.inShape(s, me.x, me.y, me.r)) M.stat.stabHit++; tn.st = 'strike'; tn.t = 0; splash(FX, s.x, s.y, r); FX.H.shake(5, 0.15); sf(FX, 'thud'); } }); }

  /* ---- Tendril Slam: tendrils rise out of the sea and slam down along shown lanes, one after another ---- */
  function startSlam(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, lv = FX.S.lv, f = FX.S.fast; m.act = 'slam'; m.actT = 0; M.q.length = 0;
    const n = lv >= 3 ? 4 : lv >= 2 ? 3 : 2, sd = Math.random() < 0.5 ? -1 : 1, offs = [0, 4.8 * sd, -4.8 * sd, 9.6 * sd].slice(0, n), w = 2.4, tilt = FX.rnd(-0.12, 0.12);
    offs.forEach((o, k) => { const a = Math.PI / 2 + tilt, ca = Math.cos(a), sa = Math.sin(a), tx = me.x + o, ty = me.y;
      // the lane's origin: where the line through its mark leaves the island to the north, out in the water
      let u = 0; while (u < 40 && Math.hypot(tx - ca * u - C.x, ty - sa * u - C.y) < ISL + 1.0) u += 0.25; const ox = tx - ca * u, oy = ty - sa * u;
      let e = 1; while (e < 40 && !(e > 4 && !onIsle(C, ox + ca * e, oy + sa * e, 0.6))) e += 0.25; if (e < 6) return;
      const len = e, Wt = (1.5 + k * 0.42) / f, root = [ox, oy];
      const tn = addTend(FX, { kind: 'lane', root, hover: [ox + ca * 3, oy + sa * 3, 8.5], hit: [ox + ca * (len - 0.3), oy + sa * (len - 0.3), 0.3], hold: 1.3, w: 1.15 });
      FX.tele({ shape: 'fn', kind: 'lane', test: (px, py, rr) => { const rx = px - ox, ry = py - oy, al = rx * ca + ry * sa, of = Math.abs(-rx * sa + ry * ca); return al > -(rr || 0) && al < len + (rr || 0) && of < w / 2 + (rr || 0); }, x: ox, y: oy, a, len, w, t: Wt, num: k + 1, dmg: m.dmg * 1.4, col: TIDE_HI, ink: 'lane',
        fn: s => { M.stat.lanes++; if (FX.inShape(s, me.x, me.y, me.r)) M.stat.laneHit++; tn.st = 'strike'; tn.t = 0; FX.H.shake(8, 0.22); sf(FX, 'crash'); for (let q = 3; q < len; q += 3) splash(FX, ox + ca * q, oy + sa * q, 0.9); } }); });
    sf(FX, 'whoosh'); M.actEnd = 1.5 / f + n * 0.42 / f + 1.6;
    say(FX, 'slam', 'TENDRIL SLAM', 'Tendrils rise out of the sea and slam the shown lanes: step out of them', TIDE_HI); }

  /* ---- Tendril Sweep: a great tendril rises at the island's side and sweeps the shown arc ---- */
  function startSweep(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, lv = FX.S.lv, f = FX.S.fast; m.act = 'sweep'; m.actT = 0; M.q.length = 0;
    const s0 = me.x < C.x ? -1 : 1, sides = lv >= 2 ? [s0, -s0] : [s0];
    sides.forEach((sd, k) => at(M, k * 1.15 / f, () => { if (m.act !== 'sweep') return; const py = C.y + clamp(me.y - C.y, -8, 6) + FX.rnd(-1, 1), dy = py - C.y, px = C.x + sd * (Math.sqrt(Math.max(0, ISL * ISL - dy * dy)) + 1.0);
      const a = Math.atan2(me.y - py, me.x - px), spread = 0.52, len = 17.5, dir = Math.random() < 0.5 ? 1 : -1, a0 = a - spread * dir, a1 = a + spread * dir, Wt = 1.8 / f;
      const tn = addTend(FX, { kind: 'sweep', root: [px, py], hover: [px + Math.cos(a0) * 4, py + Math.sin(a0) * 4, 9], a0, a1, len: len * 0.92, hold: 0.5, w: 1.25 });
      FX.tele({ shape: 'fn', kind: 'cone', test: (x, y, rr) => { const d = Math.hypot(x - px, y - py); if (d > len + (rr || 0) || d < 1) return false; return Math.abs(K.angTo(a, Math.atan2(y - py, x - px))) < spread + (rr || 0) / Math.max(0.6, d); }, x: px, y: py, a, spread, len, dir, t: Wt, dmg: m.dmg * 1.45, col: TIDE_HI, ink: 'sweep',
        fn: s => { M.stat.sweeps++; if (FX.inShape(s, me.x, me.y, me.r)) M.stat.sweepHit++; tn.st = 'strike'; tn.t = 0; FX.H.shake(9, 0.3); sf(FX, 'crash'); } }); sf(FX, 'whoosh'); }));
    M.actEnd = (sides.length - 1) * 1.15 / f + 1.8 / f + 1.3;
    say(FX, 'sweep', 'TENDRIL SWEEP', 'A great tendril sweeps the shown arc: get out of it', TIDE_HI); }

  /* ---- Eclipse: the black sun flares dark; the eye-pearls loose slow motes; four tide-lanterns to light ---- */
  function startEclipse(FX, m) { const M = FX.mem, f = FX.S.fast; m.act = 'eclipse'; m.actT = 0; M.q.length = 0; M.stat.eclipses++;
    M.ecl = { t: 0, T: 17 / f, fireT: 1.6, shot: 0 }; for (const L of M.lan) { L.on = false; L.ch = 0; } M.flare = 1; FX.H.flash(0.25, INDIGO); FX.H.shake(8, 0.5); sf(FX, 'hum');
    say(FX, 'eclipse', 'ECLIPSE', 'The black sun flares dark: dodge the motes and stand by each tide-lantern to light it', GOLD_HI); }
  function eclipseTick(FX, m, dt) { const M = FX.mem, E = M.ecl; if (!E) { endAct(m); return; } E.t += dt;
    E.fireT -= dt; if (E.fireT <= 0 && E.t < E.T - 1) { E.fireT = (FX.S.lv >= 3 ? 1.25 : 1.5) / FX.S.fast; const F = frameOf(FX), idx = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5).slice(0, 3); idx.forEach((i, k) => FX.H.after(k * 0.16, () => { if (M.ecl) fireMote(FX, m, F, i); })); }
    if (M.lan.every(L => L.on)) return endEclipse(FX, m, true);
    if (E.t >= E.T) endEclipse(FX, m, false); }
  // a mote of light: it drops from its eye-pearl to the shore, then drifts slowly at the pet
  function fireMote(FX, m, F, i) { const M = FX.mem, C = FX.C, e = eyeAt(F, i), ys = C.y - Math.sqrt(Math.max(0, ISL * ISL - (e[0] - C.x) ** 2)) + 1.2, z0 = (ys - e[1]) + e[2];
    M.falls.push({ kind: 'mote', x: e[0], y: ys, z0, t: 0, dur: 0.38 }); M.eyes[i].b = 0; }
  function moteLand(FX, m, d) { const me = FX.me, M = FX.mem; M.stat.motes++; const a = Math.atan2(me.y - d.y, me.x - d.x); FX.bullet(d.x, d.y, a, 3.1, { dmg: m.dmg * 0.55, color: GOLD_HI, core: '#FFFFFF', r: 0.3, style: 'orb', life: 7 }); FX.H.ring(d.x, d.y, 0.1, 0.8, 0.25, GOLD_HI, 0.3); }
  function endEclipse(FX, m, early) { const M = FX.mem; if (!M.ecl) return; M.ecl = null;
    if (early === true) { M.stat.eclEarly++; FX.H.flash(0.3, GOLD_HI); FX.H.banner('THE LANTERNS BURN', 'The eclipse breaks: it reels onto the sand, its black heart bared', GOLD_HI, 2.4, true, true); bare(FX, m, 'eclipse'); return; }
    if (early === false) { M.stat.eclPassed++; FX.H.banner('THE ECLIPSE PASSES', 'The black sun dims again', MOON_HI, 1.6, true); endAct(m); } }
  function lanterns(FX, m, dt) { const M = FX.mem, me = FX.me, C = FX.C;
    M.lan.forEach((L, i) => { const P = LANTERNS[i], near = Math.hypot(me.x - C.x - P[0], me.y - C.y - P[1] - 0.3) < 1.75;
      if (M.ecl && !L.on && near && !me.dead) { L.ch += dt; if (L.ch >= 0.6) { L.on = true; L.ch = 0; M.stat.lit++; const n = M.lan.filter(q => q.on).length; FX.H.text(C.x + P[0], C.y + P[1] - 2.4, `LANTERN LIT · ${n}/4`, GOLD_HI, 14); FX.H.sparks(C.x + P[0], C.y + P[1] - 1.4, GOLD_HI, 14, 4); sf(FX, 'chime'); } }
      else if (!near) L.ch = decay(L.ch, dt, 2);
      if (!M.ecl) L.on = false; L.lit = toward(L.lit, L.on ? 1 : 0, dt, L.on ? 6 : 1.5); }); }

  /* ---- The High Tide: the sea rises over the rim and an army pours out of it; it is sealed away meanwhile ---- */
  function startTide(FX, m) { const M = FX.mem; resetAll(FX, m); m.act = 'tide'; m.actT = 0; FX.untarget(true); M.recoil = 1; FX.H.shake(12, 0.9); FX.H.flash(0.3, TIDE_HI); sf(FX, 'hum');
    M.hd = { left: HORDE, wave: 0, wl: Math.min(WAVE, HORDE), gap: 0, list: [], pending: 0, acc: 0, n: 0, maxAlive: 0 };
    FX.H.banner('THE HIGH TIDE', 'The sea rises over the rim and an army pours out of it: hold the island!', TIDE_HI, 3, true, true); }
  function pourOne(FX, m) { const M = FX.mem, H2 = M.hd, C = FX.C, me = FX.me; let a = 0, x = C.x, y = C.y;
    for (let k = 0; k < 14; k++) { a = Math.random() * TAU; if (Math.sin(a) < -0.72) continue; const r = ISL - 1.3 - Math.random() * 2.2; x = C.x + Math.cos(a) * r; y = C.y + Math.sin(a) * r; if (Math.hypot(x - me.x, y - me.y) > 3.4) break; }
    let rr = Math.random() * 100, type = HORDE_MIX[0][0]; for (const [ty, w] of HORDE_MIX) { if (rr < w) { type = ty; break; } rr -= w; }
    const r0 = ISL + 2.2; M.surges.push({ x0: C.x + Math.cos(a) * r0, y0: C.y + Math.sin(a) * r0, x1: x, y1: y, t: 0, dur: 0.55 + Math.random() * 0.25, h: 1.4 + Math.random() * 1.4, type }); H2.pending++; H2.left--; }
  function landSurge(FX, m, s) { const M = FX.mem, H2 = M.hd; if (!H2) return; H2.pending--; if (m.dead) return; splash(FX, s.x1, s.y1, 1.0);
    const q = FX.minion(s.type, s.x1, s.y1); if (!q) return; q.horde = true; q.hp = q.maxhp = Math.max(30, Math.round(q.maxhp * 0.28)); q.xp = Math.max(1, Math.round((q.xp || 3) * 0.3)); q.coin = 0; q.cd = 1.0 + Math.random(); H2.list.push(q); H2.n++; M.stat.poured++; }
  function tideTick(FX, m, dt) { const M = FX.mem, H2 = M.hd; if (!H2) { endAct(m); return; } m.noTouch = true; m.under = true;
    H2.list = H2.list.filter(q => !q.dead); H2.maxAlive = Math.max(H2.maxAlive, H2.list.length + H2.pending);
    // the army comes in waves of fifty: the next only once the last is cleared
    if (H2.wl <= 0) { if (H2.left > 0 && H2.pending === 0 && H2.list.length === 0) { H2.gap += dt; if (H2.gap > 1.6) { H2.wave++; H2.wl = Math.min(WAVE, H2.left); H2.gap = 0; FX.H.banner(`WAVE ${H2.wave + 1} OF ${Math.ceil(HORDE / WAVE)}`, 'Another surge out of the sea', TIDE_HI, 1.6, true); FX.H.shake(6, 0.4); } } }
    else { H2.acc = Math.min(5, H2.acc + dt * 16);
      while (H2.acc >= 1 && H2.wl > 0 && H2.left > 0 && H2.list.length + H2.pending < HORDE_CAP) { H2.acc -= 1; H2.wl--; pourOne(FX, m); } }
    if (H2.left === 0 && H2.pending === 0 && H2.list.length === 0) { M.hd = null; M.hdDone = true; FX.untarget(false); FX.S.tele.length = 0; sf(FX, 'fanfare');
      FX.H.banner('THE TIDE IS SPENT', 'It collapses onto the sand: strike its black heart!', GOLD_HI, 2.6, true, true); bare(FX, m, 'tide'); } }
  function bare(FX, m, why) { const M = FX.mem; m.act = 'breathe'; m.actT = 0; M.q.length = 0; m.stunT = why === 'broken' ? 10 : why === 'tide' ? 8 : 5.5; M.why = why; M.stat.bared++; FX.untarget(false); M.recoil = 0; M.pl = null; FX.S.tele.length = 0;
    for (const tn of M.tend) tendBack(tn); FX.H.shake(14, 0.7); FX.H.flash(0.25, GOLD_HI); sf(FX, 'crash'); FX.H.after(0.7, () => { const C = FX.C; for (let i = 0; i < 6; i++) splash(FX, C.x + FX.rnd(-8, 8), C.y - ISL + FX.rnd(0.6, 3), 1.4); FX.H.shake(10, 0.4); sf(FX, 'thud'); }); }

  /* ---- The Weight of the Heart: the island crumbles from the rim inward; carry three moonpearls into its reach ---- */
  function startWeight(FX, m) { const M = FX.mem, C = FX.C; resetAll(FX, m); m.act = 'weight'; m.actT = 0; M.recoil = 1; M.flare = 1;
    M.wt = { t: 0, hp0: m.hp, n: 0, held: null, pearls: [], stabT: 3.4 };
    const F = frameOf(FX), S = sunAt(F); PEARL_AT.forEach((p, i) => { const pr = { i, x: C.x + p[0], y: C.y + p[1], st: 'fall', t: -i * 0.25, x0: S[0], y0: S[1], z0: S[2], dur: 1.15 }; M.wt.pearls.push(pr); });
    FX.H.shake(16, 1.0); FX.H.flash(0.35, TIDE_HI); sf(FX, 'hum');
    FX.H.banner('THE WEIGHT OF THE HEART', 'It pulls everything in: carry the three moonpearls into the bell\'s reach', GOLD_HI, 3.2, true, true); }
  function weightTick(FX, m, dt) { const M = FX.mem, W = M.wt, me = FX.me, C = FX.C; if (!W) { endAct(m); return; } W.t += dt; m.noTouch = true;
    M.CR = Math.max(CR_MIN, ISL - Math.max(0, W.t - 1.5) * 0.22);
    if (M.CR > CR_MIN && Math.random() < dt * 9) { const a = Math.random() * TAU; FX.H.part({ kind: 'smoke', x: C.x + Math.cos(a) * M.CR, y: C.y + Math.sin(a) * M.CR, vx: 0, vy: 0.6, g: 0, drag: 0.5, life: 0.9, max: 0.9, size: 3 + Math.random() * 2, color: '#C8C0CE' }); }
    for (const p of W.pearls) { p.t += dt;
      if (p.st === 'fall' && p.t >= p.dur) { p.st = 'lie'; p.t = 0; splash(FX, p.x, p.y, 1.0); FX.H.sparks(p.x, p.y - 0.4, PEARL, 10, 4); }
      else if (p.st === 'lie' && !W.held && !me.dead && Math.hypot(me.x - p.x, me.y - p.y) < 1.25) { p.st = 'held'; W.held = p; sf(FX, 'chime'); FX.H.text(me.x, me.y - 2, 'Carry it into the bell\'s reach!', GOLD_HI, 13); }
      else if (p.st === 'held') { p.x = me.x; p.y = me.y; if (Math.hypot(me.x - C.x - REACH[0], me.y - C.y - REACH[1]) < REACH_R) { const S = sunAt(frameOf(FX)); p.st = 'fly'; p.t = 0; p.x0 = me.x; p.y0 = me.y; p.z0 = 1.6; p.x1 = S[0]; p.y1 = S[1]; p.z1 = S[2]; W.held = null; sf(FX, 'whoosh'); } }
      else if (p.st === 'fly' && p.t >= 0.6) { p.st = 'in'; W.n++; M.stat.pearls++; M.cracks = W.n; M.recoil = 1; M.flare = 1; FX.H.shake(12, 0.4); FX.H.flash(0.2, GOLD_HI); sf(FX, 'crack');
        if (W.n < 3) FX.H.banner('THE HEART CRACKS', `${W.n} of 3 moonpearls`, GOLD_HI, 1.4, true); else return breakHeart(FX, m); } }
    // under pressure: a light tendril stab at the pet now and then
    W.stabT -= dt; if (W.stabT <= 0) { W.stabT = 3.4 / FX.S.fast; stabOne(FX, m, true, false); } }
  function breakHeart(FX, m) { const M = FX.mem, W = M.wt; M.wt = null; M.wtDone = true; M.stat.broken++; FX.S.tele.length = 0;
    m.hp = Math.min(W.hp0, m.maxhp * 0.06); const S = sunAt(frameOf(FX)); FX.H.boom(S[0], S[1] - S[2], 5, GOLD_HI, '#FFFFFF', { n: 50, shake: 22, smoke: 8 }); FX.H.flash(0.5, GOLD_HI);
    FX.H.banner('THE HOLLOW HEART BREAKS OPEN', 'Split by its own weight, it falls onto the sand: finish it!', GOLD_HI, 2.8, true, true); bare(FX, m, 'broken'); }

  /* ---- things in flight: the army leaping out of the sea, motes dropping from the eye-pearls ---- */
  function flyers(FX, m, dt) { const M = FX.mem;
    for (let i = M.surges.length - 1; i >= 0; i--) { const s = M.surges[i]; s.t += dt; if (s.t >= s.dur) { M.surges.splice(i, 1); landSurge(FX, m, s); } }
    for (let i = M.falls.length - 1; i >= 0; i--) { const d = M.falls[i]; d.t += dt; if (d.t >= d.dur) { M.falls.splice(i, 1); if (d.kind === 'mote' && !m.dead) moteLand(FX, m, d); } } }

  /* ---- fallen: the black sun goes out, the bell sinks back into the sea, and a pale dawn fills the hollow ---- */
  function deadTick(FX, m, dt) { const M = FX.mem, P = M.P;
    if (M.deadT == null) { M.deadT = 0; M.ecl = null; M.hd = null; M.wt = null; M.pl = null; M.q.length = 0; M.surges.length = 0; M.falls.length = 0; FX.S.tele.length = 0; for (const tn of M.tend) tendBack(tn); FX.weak('heart', 0, 0, 0, 0, false); }
    M.deadT += dt; M.sunK = toward(M.sunK, M.deadT > 0.7 ? 0 : 1, dt, 2.2); M.dark = toward(M.dark, 0, dt, 2); M.tideK = toward(M.tideK, 0, dt, 1); M.pull = 0;
    if (M.deadT > 0.9 && !M.out) { M.out = true; FX.H.flash(0.5, '#FFF4DE'); const S = heartAt(FX); FX.H.boom(S[0], S[1] - S[2], 4, PEARL, GOLD_HI, { n: 40, shake: 14, smoke: 6 }); sf(FX, 'chime'); }
    M.dawn = toward(M.dawn, M.deadT > 1.0 ? 1 : 0, dt, 0.7); P.sag = toward(P.sag, 0, dt, 1.1); P.sink = clamp((M.deadT - 1.9) / 3.2, 0, 1);
    for (const e of M.eyes) e.b = toward(e.b, 1, dt, 4);
    if (P.sink < 0.95 && Math.random() < dt * 22) { const F = frameOf(FX), p = bellPt(F, FX.rnd(-BW, BW), FX.rnd(0, BH), 0); FX.H.part({ kind: 'spark', x: p[0], y: p[1] - p[2], vx: FX.rnd(-0.6, 0.6), vy: FX.rnd(-2.4, -0.8), g: -0.6, drag: 0.4, life: 1.4, max: 1.4, size: 2 + Math.random() * 2, color: Math.random() < 0.6 ? PEARL : GOLD_HI }); }
    tendrils(FX, m, dt); for (const r of M.ripples) r.t += dt; easePoseDead(P, dt); }
  function easePoseDead(P, dt) { P.rec = 0; P.wake = 1; void dt; }

  /* ---------- the painting ---------- */
  function paintAll(c, FX, m, P3, T) { const M = FX.mem, P = M.P, F = frameOf(FX), lw = Math.max(1.2, T * 0.075), C = FX.C;
    const S = (u, h, d) => { const p = bellPt(F, u, h, d); return P3(p[0], p[1], p[2]); };
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // rising out of the sea (and sinking back): nothing below the waterline in front of it shows
    const hidden = P.wake < 0.995 || P.sink > 0.005;
    if (hidden) { const wl = P3(F.bx, C.y - ISL - 0.2 + F.sag * SAGDY, 0)[1]; c.beginPath(); c.rect(-1e4, -1e4, 2e4, 1e4 + wl); c.clip(); }
    const bt = M.bt, beat = M.beat || 0, dk = M.dark || 0, sunK = M.sunK == null ? 1 : M.sunK, vis = smooth((P.wake - 0.55) / 0.4) * (1 - P.sink);
    // the long tendrils trailing behind it into the water
    for (const B of BACKT) { const a = B.phi, u0 = Math.cos(a) * BW * 0.9, d0 = Math.sin(a) * BW * RIMK * 0.9, pts = [];
      for (let i = 0; i <= 12; i++) { const s = i / 12, sw = Math.sin(bt * 0.7 + B.ph - s * 3) * 0.9 * s; const p = bellPt(F, u0 * (1 + s * 0.35) + sw, -s * 1.2, d0 - s * 1.6); pts.push(P3(p[0], p[1], Math.max(0, p[2] * (1 - s)) + 0.0)); }
      if (vis > 0.02) TN.tubeLite(c, pts, u => T * (0.62 - u * 0.48), { col: '#5E8EA6', shade: '#3E6A82', shade2: '#2C5066', hi: '#A8D4E4', line: LINE, lw: lw * 0.8, alpha: 0.75 * vis, force: true }); }
    // a soft teal aura round it
    { const q = S(0, BH * 0.45, 0); K.glow(c, q[0], q[1], BW * T * 1.7, TIDE_HI, 0.2 * (1 - dk * 0.6) * (1 - P.sink)); }
    // the bell's outline: the dome over the rim's front arc
    const dome = [], N = 30; for (let i = 0; i <= N; i++) { const th = Math.PI * (1 - i / N), sn = Math.sin(th), fl = 1 + 0.05 * (1 - sn); dome.push(S(Math.cos(th) * BW * fl * 1.02, BH * Math.pow(sn, 0.78), 0)); }
    const front = []; for (let i = 1; i < N; i++) { const ph = Math.PI * i / N; front.push(S(Math.cos(ph) * BW * 1.07, 0, Math.sin(ph) * BW * RIMK)); }
    const outline = dome.concat(front), path = cc => { cc.moveTo(outline[0][0], outline[0][1]); for (let i = 1; i < outline.length; i++) cc.lineTo(outline[i][0], outline[i][1]); cc.closePath(); };
    // its inside: dark teal glass, deeper toward the rim
    { const top = S(0, BH, 0), bot = S(0, -0.5, BW * RIMK), g = c.createLinearGradient(0, top[1], 0, bot[1]); g.addColorStop(0, `rgba(58,96,124,${0.7 - dk * 0.2})`); g.addColorStop(0.55, `rgba(24,52,70,${0.66 - dk * 0.15})`); g.addColorStop(1, `rgba(16,40,54,${0.6})`); c.fillStyle = g; c.beginPath(); path(c); c.fill(); }
    // through the glass: the veins on its far side, the inner back of the rim
    c.save(); c.beginPath(); path(c); c.clip();
    c.strokeStyle = 'rgba(169,200,240,.22)'; c.lineWidth = T * 0.09; for (const a of VEINS) { c.beginPath(); for (let i = 0; i <= 10; i++) { const ps = i / 10 * Math.PI / 2, q = S(Math.sin(ps) * Math.cos(a) * BW, BH * Math.cos(ps), -Math.sin(ps) * Math.sin(a) * BW * RIMK); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke(); }
    c.strokeStyle = 'rgba(200,230,240,.28)'; c.lineWidth = T * 0.22; c.beginPath(); for (let i = 0; i <= 24; i++) { const ph = Math.PI * i / 24, q = S(Math.cos(ph) * BW * 1.02, 0, -Math.sin(ph) * BW * RIMK); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke();
    // the BLACK SUN: a pale gold corona (soft), a flare of darkness in an eclipse, the dark disc, its thin bright rim
    { const sp = sunAt(F), q = P3(sp[0], sp[1], sp[2]), R = SUN_R * T * (1 + beat * 0.04 + dk * 0.22) * (1 - F.sag * 0.1), cor = sunK * (0.75 + beat * 0.25 + M.flare * 0.3);
      if (dk > 0.02) K.shade(c, q[0], q[1], R * 3.4, R * 3.4, 0.75 * dk, '#04040C');
      K.glow(c, q[0], q[1], R * 3.6, GOLD, 0.5 * cor * (1 - dk * 0.5)); K.glow(c, q[0], q[1], R * 2.0, GOLD_HI, 0.6 * cor);
      // corona streamers: soft glows round its edge, turning slowly
      for (let k = 0; k < 8; k++) { const a = bt * 0.12 + k * TAU / 8, rr = R * (1.25 + 0.12 * Math.sin(bt * 1.3 + k * 2)); K.glow(c, q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr, R * 0.75, k % 2 ? GOLD_HI : GOLD, 0.32 * cor); }
      if (sunK > 0.02) { c.save(); c.globalAlpha = sunK; const g = c.createRadialGradient(q[0] - R * 0.25, q[1] - R * 0.3, R * 0.1, q[0], q[1], R); g.addColorStop(0, '#12121E'); g.addColorStop(0.8, BLACKSUN); g.addColorStop(1, '#1A1626'); c.fillStyle = g; c.beginPath(); c.arc(q[0], q[1], R, 0, TAU); c.fill();
        // its rim of light, feathered: a fine bright line in two softer ones
        c.globalCompositeOperation = 'lighter'; for (const [wk, a] of [[0.34, 0.12], [0.16, 0.3], [0.05, 0.85]]) { c.strokeStyle = `rgba(255,240,184,${a * cor})`; c.lineWidth = Math.max(1, R * wk); c.beginPath(); c.arc(q[0], q[1], R, 0, TAU); c.stroke(); }
        c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(80,90,140,.25)'; c.beginPath(); c.ellipse(q[0] - R * 0.35, q[1] - R * 0.4, R * 0.32, R * 0.16, -0.5, 0, TAU); c.fill(); c.restore(); }
      // its heart cracking (the moonpearls), and broken
      if (M.cracks > 0 && sunK > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let k = 0; k < Math.min(3, M.cracks); k++) { const pts = CRACKS[k]; for (const [wk, a] of [[0.3, 0.18], [0.1, 0.9]]) { c.strokeStyle = `rgba(255,240,184,${a * sunK})`; c.lineWidth = Math.max(1, T * wk); c.beginPath(); pts.forEach(([x, z], j) => { const X = q[0] + x * R * 0.45, Y = q[1] + z * R * 0.45; j ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); } } c.restore(); }
      // the weight of the heart: motes drawn spiralling into it
      if (M.wt) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 18; k++) { const u = (bt * 0.35 + k / 18) % 1, a = k * 2.4 + u * 5, rr = R * (3.6 - u * 2.6); c.globalAlpha = Math.sin(u * Math.PI) * 0.8; c.fillStyle = k % 3 ? PEARL : GOLD_HI; c.beginPath(); c.arc(q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr * 0.8, T * 0.12, 0, TAU); c.fill(); } c.restore(); } }
    c.restore();
    // the front glass: pearl and teal, cel-shaded, its outline drawn bold
    { const top = S(0, BH, 0), bot = S(0, 0, BW * RIMK), g = c.createLinearGradient(0, top[1], 0, bot[1]); g.addColorStop(0, 'rgba(244,238,246,.34)'); g.addColorStop(0.45, 'rgba(169,200,240,.14)'); g.addColorStop(1, 'rgba(127,216,224,.3)'); c.fillStyle = g; c.beginPath(); path(c); c.fill(); }
    TN.shape(c, path, { col: 'rgba(0,0,0,0)', shade: 'rgba(30,70,96,.34)', shade2: 'rgba(18,44,64,.42)', hi: 'rgba(244,238,246,.42)', line: 'rgba(24,30,48,.92)', lw: lw * 1.2, r: BW * T * 0.5, d1: 0.07, d2: 0.1, force: true, noFlash: false });
    // the silver veins down the front of the dome, pulsing with its beat (a wave of light running down them)
    { const ph = 1 - (M.beatT || 0) / 2.1;
      for (const hk of [0.42, 0.74]) { c.strokeStyle = 'rgba(217,222,232,.22)'; c.lineWidth = T * 0.07; c.beginPath(); for (let i = 0; i <= 24; i++) { const ph = Math.PI * i / 24, ps = Math.acos(Math.pow(hk, 1 / 0.9)), q = S(Math.cos(ph) * Math.sin(ps) * BW * 1.01, BH * hk, Math.sin(ph) * Math.sin(ps) * BW * RIMK); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke(); }
      for (const a of VEINS) { const pts = []; for (let i = 0; i <= 12; i++) { const ps = i / 12 * Math.PI / 2, wv = Math.sin(i * 1.3 + a * 5 + bt * 0.6) * 0.025 * Math.sin(ps * 2); pts.push(S(Math.sin(ps) * Math.cos(a + wv) * BW * 1.01, BH * Math.pow(Math.cos(ps), 0.9) * 1.0, Math.sin(ps) * Math.sin(a + wv) * BW * RIMK)); }
        const line = (col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); };
        line('rgba(24,30,48,.38)', T * 0.19); line(K.mixC(SILVER, '#6A7890', dk * 0.5), T * 0.095); line('rgba(255,255,255,.5)', T * 0.035);
        if (beat > 0.02 && sunK > 0.2) { const i0 = Math.floor(clamp(ph, 0, 1) * 10); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(226,238,255,${0.7 * beat})`; c.lineWidth = T * 0.2; c.beginPath(); for (let i = Math.max(0, i0 - 1); i <= Math.min(12, i0 + 2); i++) i === Math.max(0, i0 - 1) ? c.moveTo(pts[i][0], pts[i][1]) : c.lineTo(pts[i][0], pts[i][1]); c.stroke(); c.restore(); } } }
    // a soft teal glow inside the rim, the jelly lit from within
    for (let i = 0; i < 7; i++) { const ph = Math.PI * (0.12 + 0.76 * i / 6), q = S(Math.cos(ph) * BW * 0.92, 0.9, Math.sin(ph) * BW * RIMK * 0.8); K.glow(c, q[0], q[1], T * 2.6, TIDE_HI, 0.16 * (1 - dk * 0.7) * (0.8 + 0.2 * beat)); }
    // a glossy highlight high on the dome
    { const q = S(-BW * 0.42, BH * 0.78, 0); TN.spec(c, q[0], q[1], T * 1.5, -0.55, 0.55); const q2 = S(BW * 0.5, BH * 0.5, 0); TN.spec(c, q2[0], q2[1], T * 0.6, -0.9, 0.3); }
    // the rim: a thick pearl band along its front, scalloped lappets hanging under it
    { const pts = []; for (let i = 0; i <= 26; i++) { const ph = Math.PI * i / 26; pts.push(S(Math.cos(ph) * BW * 1.07, 0, Math.sin(ph) * BW * RIMK)); }
      for (let i = 0; i < 18; i++) { const ph = Math.PI * (i + 0.5) / 18, q = S(Math.cos(ph) * BW * 1.06, -0.15, Math.sin(ph) * BW * RIMK), r = T * 0.62;
        TN.shape(c, TN.ell(q[0], q[1] + r * 0.55, r, r * 0.8), { col: 'rgba(214,236,244,.62)', shade: 'rgba(90,148,172,.5)', hi: 'rgba(255,255,255,.55)', line: 'rgba(24,30,48,.8)', lw: lw * 0.8, r, force: true }); }
      TN.tubeLite(c, pts.slice().reverse(), () => T * 0.78, { col: '#E6EEF4', shade: '#A9C0D4', shade2: '#7E9AB4', hi: '#FFFFFF', line: LINE, lw, force: true }); }
    // the eye-pearls round the rim: pearls that open on a cold eye (gold in an eclipse)
    EYE_PHI.forEach((a, i) => { const e = M.eyes ? M.eyes[i] : { b: 0.5 }, p = eyeAt(F, i), q = P3(p[0], p[1], p[2]), r = T * 0.72;
      if (dk > 0.05 && e.b < 0.6) K.glow(c, q[0], q[1], r * 3, GOLD_HI, 0.5 * dk * (1 - e.b));
      TN.shape(c, TN.ell(q[0], q[1], r * 1.08, r * 0.96), { col: PEARL, shade: '#C8C0D8', shade2: '#A8A0C0', hi: '#FFFFFF', line: LINE, lw, r, force: true, spec: 0.7, specAt: [q[0] - r * 0.4, q[1] - r * 0.45] });
      if (e.b < 0.97) TN.eye(c, q[0], q[1] + r * 0.02, r * 0.82, { iris: dk > 0.3 ? GOLD : MOONSTONE, look: M.look || [0, 0.4], blink: e.b, lid: '#E4DCEA', line: LINE, white: '#FBF8FC', squash: 0.82, slit: true, irisR: 0.66, pupilR: 0.55 }); });
    // the fringe: long trailing tendrils from under the rim down into the water (below the surface, only faintly seen)
    for (const Fr of FRINGE) { const a = Fr.phi, w3 = [];
      for (let i = 0; i <= 12; i++) { const s = i / 12, sw = Math.sin(bt * 0.8 + Fr.ph - s * 3.4) * 0.7 * s + Math.sin(bt * 0.23) * 0.5 * s; const p = bellPt(F, Math.cos(a) * BW * (1.02 - s * 0.05) + sw, -0.3 - s * 0.4, Math.sin(a) * BW * RIMK * (1 - s * 0.6) + s * 0.2); w3.push([p[0], p[1], p[2] * (1 - s) - s * Fr.len * 0.9]); }
      const pts = w3.map(p => P3(p[0], p[1], p[2])); let k = w3.findIndex(p => p[2] < 0); if (k < 0) k = w3.length; const wf = u => T * (0.46 - u * 0.36), o = { col: 'rgba(196,228,238,.82)', shade: 'rgba(90,148,172,.7)', hi: 'rgba(255,255,255,.7)', line: 'rgba(24,30,48,.85)', lw: lw * 0.75, force: true };
      if (vis > 0.02) { if (k < w3.length) TN.tubeLite(c, pts, wf, Object.assign({}, o, { alpha: 0.26 * vis, line: false })); if (k >= 2) { const n = w3.length - 1, sub = pts.slice(0, Math.min(w3.length, k + 1)), kk = (sub.length - 1) / n; TN.tubeLite(c, sub, u => wf(u * kk), Object.assign({}, o, { alpha: vis })); }
        if (k < w3.length && k > 0) { const q = P3(w3[k][0], w3[k][1], 0); c.strokeStyle = `rgba(214,240,246,${0.3 * vis})`; c.lineWidth = Math.max(1, T * 0.045); c.beginPath(); c.ellipse(q[0], q[1], T * (0.42 + 0.12 * Math.sin(bt * 2 + Fr.ph)), T * 0.13, 0, 0, TAU); c.stroke(); } } }
    c.restore(); }
  function demoPaint(c, FX, m, X, Y, T, t) { const M = FX.mem || {}, C = FX.C || { x: m.x, y: m.y - BOSS_Y };
    if (!M.P) { M.P = { sag: M.demoSag ? 1 : 0, wake: 1, rec: 0, sink: 0 }; M.bt = M.bt || 2; M.sway = 0; M.recoil = 0; M.beat = 0.5; M.beatT = 1; M.dark = M.demoDark ? 1 : 0; M.sunK = 1; M.flare = 0; M.look = [0.1, 0.5]; M.cracks = 0; M.eyes = EYE_PHI.map((a, i) => ({ i, b: M.demoDark ? 0 : i % 2 ? 0.1 : 0.9 })); }
    const F2 = { C, mem: M, m, S: { enterT: 9 } }; const P3 = TN.cam(X, Y, T, m); paintAll(c, F2, m, P3, T); void t; }

  /* ---------- the island's things: the tide-lanterns, the arms rising and falling out of the sea ---------- */
  function drawLantern(c, FX, p, X, Y, T, t) { const M = FX.mem, L = M && M.lan ? M.lan[p.i] : { lit: 0, ch: 0, on: false }, lit = L.lit || 0, ecl = !!(M && M.ecl), lw = Math.max(1.2, T * 0.07), pu = 0.5 + 0.5 * Math.sin(t * 3 + p.i);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.fillStyle = 'rgba(14,20,36,.3)'; c.beginPath(); c.ellipse(X, Y, T * 0.95, T * 0.34, 0, 0, TAU); c.fill();
    if (lit > 0.02) K.glow(c, X, Y - T * 0.2, T * 4.2, GOLD, 0.35 * lit);
    // a pedestal of shell and a curved stem of pearl coral
    TN.shape(c, TN.ell(X, Y - T * 0.22, T * 0.62, T * 0.34), { col: '#DCD2E2', shade: '#B4A8C4', hi: '#FFFFFF', line: LINE, lw, r: T * 0.6, force: true });
    const st = [[X, Y - T * 0.3], [X - T * 0.08, Y - T * 1.2], [X + T * 0.12, Y - T * 2.0], [X + T * 0.45, Y - T * 2.35]];
    TN.tubeLite(c, st, u => T * (0.28 - u * 0.1), { col: '#E8D8E4', shade: '#BFA8C0', hi: '#FFFFFF', line: LINE, lw, force: true });
    // the lantern: a glass bulb hanging from the stem, dim moonstone; lit, burning gold
    const bx = X + T * 0.5, by = Y - T * 1.75, r = T * 0.48;
    if (ecl && !L.on) K.glow(c, bx, by, r * 3.2, MOON_HI, 0.25 + 0.2 * pu);
    if (lit > 0.02) { K.glow(c, bx, by, r * 4.5, GOLD_HI, 0.6 * lit); }
    TN.shape(c, TN.ell(bx, by, r, r * 1.12), { col: lit > 0.5 ? '#F4D27A' : '#9AB8DA', shade: lit > 0.5 ? '#D4A040' : '#6E8CB4', hi: lit > 0.5 ? '#FFF6D0' : '#D6E8FA', line: LINE, lw, r, force: true, spec: 0.8, specAt: [bx - r * 0.35, by - r * 0.4] });
    if (lit > 0.3) TN.twinkle(c, bx, by + r * 0.1, r * 0.55, '#FFFFFF', lit);
    c.fillStyle = '#C8B8D0'; c.beginPath(); c.ellipse(bx, by - r * 1.05, r * 0.42, r * 0.2, 0, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = lw * 0.8; c.stroke();
    // lighting it: a ring filling round it
    if (L.ch > 0) { c.lineWidth = Math.max(3, T * 0.16); c.strokeStyle = 'rgba(10,14,28,.5)'; c.beginPath(); c.arc(X, Y - T * 0.1, T * 1.35, 0, TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.beginPath(); c.arc(X, Y - T * 0.1, T * 1.35, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, L.ch / 0.6)); c.stroke(); }
    if (ecl && !L.on) label(c, 'LANTERN', X, Y - T * 3.1, T, GOLD_HI, Math.max(10, T * 0.55));
    c.restore(); }
  function drawArm(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, A = ARMS[p.i], lw = Math.max(1.2, T * 0.07), dead = FX.m && FX.m.dead, P = M.P || { sink: 0 };
    // it rises and falls: now high, curling toward the bell, now sunk to a coil at the water
    const hk = dead ? Math.max(0, 1 - (P.sink || 0) * 1.4) : 0.55 + 0.45 * Math.sin(t * 0.42 + A.ph), h = T * (0.6 + 3.6 * hk) * (1 + (M.pull || 0) * 0.15);
    const bx = FX.sx ? FX.sx(FX.C.x + (M.sway || 0)) : X, lean = clamp((bx - X) / (T * 14), -1, 1), sw = Math.sin(t * 0.9 + A.ph) * T * 0.35 + lean * T * (1.0 + (M.pull || 0) * 0.8);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // ripples round its foot
    c.strokeStyle = 'rgba(200,236,244,.35)'; c.lineWidth = Math.max(1, T * 0.06); for (let k = 0; k < 2; k++) { const u = (t * 0.45 + k * 0.5 + A.ph) % 1; c.globalAlpha = 1 - u; c.beginPath(); c.ellipse(X, Y, T * (0.7 + u * 1.3), T * (0.25 + u * 0.45), 0, 0, TAU); c.stroke(); } c.globalAlpha = 1;
    if (h > T * 0.3) { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10, cu = u * u; pts.push([X + sw * cu + Math.sin(u * 3 + t + A.ph) * T * 0.15 * u + lean * cu * cu * T * 1.2, Y - h * Math.sin(u * Math.PI * 0.5) + (u > 0.75 ? (u - 0.75) * 4 * T * 0.6 * hk : 0)]); }
      TN.tubeLite(c, pts, u => T * (0.72 - u * 0.6), Object.assign({ lw, force: true, alpha: dead ? Math.max(0, 1 - (P.sink || 0)) : 1 }, TEND_B));
      // silver nodules down it
      c.fillStyle = 'rgba(244,238,246,.85)'; for (const u of [0.25, 0.45, 0.65]) { const i = Math.round(u * 10), q = pts[i]; c.beginPath(); c.arc(q[0] + T * 0.12, q[1], T * 0.09 * (1.2 - u), 0, TAU); c.fill(); } }
    c.fillStyle = 'rgba(30,58,72,.55)'; c.beginPath(); c.ellipse(X, Y, T * 0.72, T * 0.26, 0, 0, TAU); c.fill();
    c.restore(); }
  function label(c, s, X, Y, T, col, sz) { c.save(); c.font = `900 ${Math.max(10, Math.round(sz || T * 0.46))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(8,10,22,.78)'; c.strokeText(s, X, Y); c.fillStyle = col; c.fillText(s, X, Y); c.restore(); }
  function paintTend(c, P3, T, tn, lw) { if (!tn.pts) return; const sp = tn.pts.map(p => P3(p[0], p[1], p[2])), n = sp.length - 1, w0 = T * (tn.w || 1);
    TN.tubeLite(c, sp, u => w0 * (1 - u * 0.75), Object.assign({ lw, force: true }, TEND_B));
    // a silver vein along it and pearl nodules
    c.strokeStyle = 'rgba(244,238,246,.7)'; c.lineWidth = Math.max(1, T * 0.07); c.beginPath(); for (let i = 1; i < n; i++) { const q = sp[i]; i === 1 ? c.moveTo(q[0], q[1] - w0 * 0.18 * (1 - i / n)) : c.lineTo(q[0], q[1] - w0 * 0.18 * (1 - i / n)); } c.stroke();
    for (const u of [0.3, 0.5, 0.7]) { const q = sp[Math.round(u * n)]; c.fillStyle = PEARL; c.beginPath(); c.arc(q[0], q[1] + w0 * 0.12, w0 * 0.14 * (1.2 - u), 0, TAU); c.fill(); } }

  /* ---------- the ground's living layer: the pull, the tide, the crumbling rim, telegraphs, the reach ---------- */
  function islePath(c, FX, r) { const C = FX.C; c.beginPath(); c.arc(FX.sx(C.x), FX.sy(C.y), r * FX.Tz(), 0, TAU); }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m; if (!M || !M.P || !m) return; const X0 = FX.sx(C.x), Y0 = FX.sy(C.y), bt = M.bt;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    // the water where tendrils break the surface
    for (const r of M.ripples) { const u = r.t / 1.6, X = FX.sx(r.x), Y = FX.sy(r.y); c.strokeStyle = `rgba(200,236,244,${0.5 * (1 - u)})`; c.lineWidth = Math.max(1, T * 0.08); c.beginPath(); c.ellipse(X, Y, r.r * T * (0.4 + u), r.r * T * (0.2 + u * 0.4), 0, 0, TAU); c.stroke(); }
    // the high tide over the rim
    if (M.tideK > 0.01) { const k = smooth(M.tideK), r0 = ISL - 2.0 * k; c.beginPath(); c.arc(X0, Y0, (ISL + 0.4) * T, 0, TAU); for (let i = 40; i >= 0; i--) { const a = i / 40 * TAU, rr = (r0 + Math.sin(a * 9 + bt * 1.6) * 0.22 + Math.sin(a * 5 - bt) * 0.18) * T; i === 40 ? c.moveTo(X0 + Math.cos(a) * rr, Y0 + Math.sin(a) * rr) : c.lineTo(X0 + Math.cos(a) * rr, Y0 + Math.sin(a) * rr); } c.closePath(); c.fillStyle = `rgba(22,54,70,${0.62 * k})`; c.fill('evenodd');
      for (const [w, a] of [[0.6, 0.08], [0.28, 0.2], [0.1, 0.55]]) { c.strokeStyle = `rgba(214,240,246,${a * k})`; c.lineWidth = Math.max(1, w * T); c.beginPath(); for (let i = 0; i <= 60; i++) { const a2 = i / 60 * TAU, rr = (r0 + Math.sin(a2 * 9 + bt * 1.6) * 0.22 + Math.sin(a2 * 5 - bt) * 0.18) * T; i ? c.lineTo(X0 + Math.cos(a2) * rr, Y0 + Math.sin(a2) * rr) : c.moveTo(X0 + Math.cos(a2) * rr, Y0 + Math.sin(a2) * rr); } c.stroke(); } }
    // the crumbled rim: the sea where the island was, its broken edge, the next ring to fall
    if (M.CR < ISL - 0.05) { const jag = a => (Math.sin(a * 13) * 0.18 + Math.sin(a * 29 + 1) * 0.12), rP = (a, R) => [X0 + Math.cos(a) * (R + jag(a)) * T, Y0 + Math.sin(a) * (R + jag(a)) * T];
      c.beginPath(); c.arc(X0, Y0, (ISL + 0.5) * T, 0, TAU); for (let i = 72; i >= 0; i--) { const p = rP(i / 72 * TAU, M.CR); i === 72 ? c.moveTo(p[0], p[1]) : c.lineTo(p[0], p[1]); } c.closePath(); c.fillStyle = 'rgba(10,20,30,.94)'; c.fill('evenodd');
      for (const [w, a] of [[0.7, 0.08], [0.3, 0.22], [0.1, 0.6]]) { c.strokeStyle = `rgba(232,240,246,${a})`; c.lineWidth = Math.max(1, w * T); c.beginPath(); for (let i = 0; i <= 72; i++) { const p = rP(i / 72 * TAU, M.CR + 0.05); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }
      // chunks of the island adrift
      for (let k = 0; k < 14; k++) { const a = k * 0.97 + Math.sin(bt * 0.2 + k) * 0.05, rr = M.CR + 0.8 + ((k * 0.61) % 1) * (ISL - M.CR + 0.4), p = [X0 + Math.cos(a) * rr * T, Y0 + Math.sin(a) * rr * T]; if (rr > ISL + 0.6) continue; c.fillStyle = '#B9B2C4'; c.beginPath(); c.ellipse(p[0], p[1] + Math.sin(bt * 1.4 + k) * T * 0.05, T * (0.35 + (k % 3) * 0.15), T * 0.2, k, 0, TAU); c.fill(); c.strokeStyle = 'rgba(232,240,246,.4)'; c.lineWidth = 1; c.stroke(); }
      if (M.wt && M.CR > CR_MIN + 0.1) { c.save(); c.setLineDash([T * 0.5, T * 0.35]); c.lineDashOffset = -t * T; c.strokeStyle = ROSE_HI; c.globalAlpha = 0.45 + 0.35 * Math.sin(t * 6); c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.arc(X0, Y0, (M.CR - 1.3) * T, 0, TAU); c.stroke(); c.restore(); } }
    // the pull: soft arrows and the sand streaming toward it
    if (M.pull > 0.02) { const k = Math.min(1, M.pull), Fx = C.x + FOOT[0], Fy = C.y + FOOT[1]; c.save(); islePath(c, FX, Math.min(ISL, M.CR) - 0.2); c.clip();
      const R2 = mulberry32(55); for (let i = 0; i < 70; i++) { const a = R2() * TAU, d = Math.sqrt(R2()) * ISL, x0 = C.x + Math.cos(a) * d, y0 = C.y + Math.sin(a) * d, dx = Fx - x0, dy = Fy - y0, dl = Math.hypot(dx, dy) || 1, u = (bt * (0.7 + R2() * 0.5) + R2()) % 1, s = u * 3.2, x = x0 + dx / dl * s, y = y0 + dy / dl * s, L = 0.5 + R2() * 0.6;
        c.strokeStyle = `rgba(70,110,150,${0.55 * k * Math.sin(u * Math.PI)})`; c.lineWidth = Math.max(1, T * 0.07); c.beginPath(); c.moveTo(FX.sx(x), FX.sy(y)); c.lineTo(FX.sx(x + dx / dl * L), FX.sy(y + dy / dl * L)); c.stroke(); }
      for (let gy = -12; gy <= 12; gy += 4) for (let gx = -12; gx <= 12; gx += 4) { const ox = (gy / 4) % 2 ? 2 : 0, x0 = C.x + gx + ox, y0 = C.y + gy; if (!onIsle(C, x0, y0, 1.2) || y0 - C.y < -11) continue; const dx = Fx - x0, dy = Fy - y0, dl = Math.hypot(dx, dy) || 1, u = (bt * 0.55 + (gx + gy) * 0.03) % 1, s = u * 1.6, x = x0 + dx / dl * s, y = y0 + dy / dl * s, X = FX.sx(x), Y = FX.sy(y), a = Math.atan2(dy, dx), al = 0.62 * k * Math.sin(u * Math.PI);
        c.save(); c.translate(X, Y); c.rotate(a); for (const [w, aa] of [[0.4, 0.22], [0.17, 1]]) { c.strokeStyle = `rgba(52,96,134,${al * aa})`; c.lineWidth = Math.max(1, T * w); c.beginPath(); c.moveTo(-T * 0.35, -T * 0.42); c.lineTo(T * 0.12, 0); c.lineTo(-T * 0.35, T * 0.42); c.stroke(); } c.restore(); }
      c.restore(); }
    // the bell's reach, while its heart is weighed
    if (M.wt) { const X = FX.sx(C.x + REACH[0]), Y = FX.sy(C.y + REACH[1]), r = REACH_R * T, pu = 0.5 + 0.5 * Math.sin(t * 4); K.glow(c, X, Y, r * 1.6, GOLD, 0.25 + 0.15 * pu); c.fillStyle = 'rgba(232,196,106,.16)'; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
      for (const rr of [r, r - T * 0.4]) { c.strokeStyle = 'rgba(30,24,10,.6)'; c.lineWidth = Math.max(3, T * 0.22); c.beginPath(); c.arc(X, Y, rr, 0, TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(2, T * 0.11); c.stroke(); }
      label(c, 'THE BELL\'S REACH', X, Y + r + T * 0.7, T, GOLD_HI, Math.max(11, T * 0.6)); }
    // the telegraphs: tide-dark marks on the pale sand, kept to the island
    for (const s of FX.S.tele) { if (s.done || !s.ink) continue; const u = clamp(s.age / s.t, 0, 1), hot = u > 0.72, edge = hot ? (Math.sin(t * 18) > 0 ? '#FFFFFF' : TIDE_HI) : TIDE_HI;
      c.save(); islePath(c, FX, Math.min(ISL, M.CR)); c.clip();
      if (s.kind === 'circle') { const X = FX.sx(s.x), Y = FX.sy(s.y), r = s.r * T; c.fillStyle = `rgba(10,22,44,${0.16 + u * 0.4})`; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(8,14,30,.85)'; c.lineWidth = Math.max(2, T * 0.14); c.stroke(); c.strokeStyle = edge; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke();
        c.strokeStyle = hot ? GOLD_HI : MOON_HI; c.globalAlpha = 0.55 + 0.45 * u; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.arc(X, Y, Math.max(1, r * (1 - u)), 0, TAU); c.stroke(); }
      else if (s.kind === 'lane') { const X = FX.sx(s.x), Y = FX.sy(s.y), L = s.len * T, w = s.w * T; c.translate(X, Y); c.rotate(s.a); c.fillStyle = `rgba(10,22,44,${0.14 + u * 0.38})`; c.fillRect(0, -w / 2, L, w); c.fillStyle = `rgba(127,216,224,${0.1 + u * 0.16})`; c.fillRect(0, -w / 2, L * u, w);
        c.strokeStyle = 'rgba(8,14,30,.85)'; c.lineWidth = Math.max(2, T * 0.14); c.strokeRect(0, -w / 2, L, w); c.strokeStyle = edge; c.lineWidth = Math.max(1.5, T * 0.08); c.strokeRect(0, -w / 2, L, w);
        c.strokeStyle = `rgba(226,238,255,${0.35 + 0.3 * u})`; c.lineWidth = Math.max(1.5, T * 0.1); for (let q = (t * 3) % 2.4 + 2; q < s.len - 1; q += 2.4) { c.beginPath(); c.moveTo((q - 0.5) * T, -w * 0.28); c.lineTo(q * T, 0); c.lineTo((q - 0.5) * T, w * 0.28); c.stroke(); } }
      else if (s.kind === 'cone') { const X = FX.sx(s.x), Y = FX.sy(s.y), L = s.len * T; c.beginPath(); c.moveTo(X, Y); c.arc(X, Y, L, s.a - s.spread, s.a + s.spread); c.closePath(); c.fillStyle = `rgba(10,22,44,${0.14 + u * 0.38})`; c.fill(); c.strokeStyle = 'rgba(8,14,30,.85)'; c.lineWidth = Math.max(2, T * 0.14); c.stroke(); c.strokeStyle = edge; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke();
        // the sweep's direction: an arrow along the arc
        const a0 = s.a - s.spread * s.dir, a1 = s.a + s.spread * s.dir, rr = L * 0.62; c.strokeStyle = `rgba(226,238,255,${0.4 + 0.4 * u})`; c.lineWidth = Math.max(2, T * 0.16); c.beginPath(); c.arc(X, Y, rr, Math.min(a0, a1) + 0.08, Math.max(a0, a1) - 0.08); c.stroke(); const ae = a1 - s.dir * 0.08, ex = X + Math.cos(ae) * rr, ey = Y + Math.sin(ae) * rr, ta = ae + s.dir * Math.PI / 2;
        c.beginPath(); c.moveTo(ex + Math.cos(ta) * T * 0.6, ey + Math.sin(ta) * T * 0.6); c.lineTo(ex + Math.cos(ta + 2.5) * T * 0.6, ey + Math.sin(ta + 2.5) * T * 0.6); c.moveTo(ex + Math.cos(ta) * T * 0.6, ey + Math.sin(ta) * T * 0.6); c.lineTo(ex + Math.cos(ta - 2.5) * T * 0.6, ey + Math.sin(ta - 2.5) * T * 0.6); c.stroke(); }
      c.restore(); }
    // tendrils lying on the sand
    const P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T], lw = Math.max(1.2, T * 0.075);
    if (!m.dead) for (const tn of M.tend) if (tn.lift < 0.25) paintTend(c, P3, T, tn, lw);
    // a pale dawn over the hollow once it falls
    if (M.dawn > 0.01) { const V = K.viewBox(c, 0); c.fillStyle = `rgba(255,236,214,${0.1 * M.dawn})`; c.fillRect(V[0], V[1], V[2] - V[0], V[3] - V[1]); K.glow(c, FX.sx(C.x), FX.sy(C.y + BY) - T * 6, T * 26, '#FFE8CC', 0.4 * M.dawn); }
    c.restore();
    // fallen, it is no longer among the living things on the field: its remains are laid down here, under them all
    if (m.dead && M.P.sink < 0.999) paintAll(c, FX, m, P3, T); }

  /* ---------- over everything: raised tendrils, the army leaping out of the sea, pearls, the eclipse, the counters ---------- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m, C = FX.C, me = FX.me; if (!m || !M.P) return; const P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T], lw = Math.max(1.2, T * 0.075);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    for (const tn of M.tend) if (tn.lift >= 0.25 || m.dead) paintTend(c, P3, T, tn, lw);
    // the army, leaping out of the sea
    for (const s of M.surges) { const u = clamp(s.t / s.dur, 0, 1), x = lerp(s.x0, s.x1, u), y = lerp(s.y0, s.y1, u), z = Math.sin(u * Math.PI) * s.h, p = P3(x, y, z), r = T * 0.42;
      c.fillStyle = 'rgba(200,236,244,.5)'; for (let k = 1; k <= 3; k++) { const u2 = Math.max(0, u - k * 0.08), q = P3(lerp(s.x0, s.x1, u2), lerp(s.y0, s.y1, u2), Math.sin(u2 * Math.PI) * s.h); c.beginPath(); c.arc(q[0], q[1], r * (0.5 - k * 0.1), 0, TAU); c.fill(); }
      TN.shape(c, TN.ell(p[0], p[1], r, r * 0.85), { col: s.type === 'tideling' ? '#5A8A96' : '#2A2640', shade: s.type === 'tideling' ? '#3A6470' : '#16142A', hi: s.type === 'tideling' ? '#9AD0D8' : '#5A5490', line: LINE, lw: lw * 0.8, r, force: true, spec: 0.6, specAt: [p[0] - r * 0.3, p[1] - r * 0.35] }); }
    // motes dropping from the eye-pearls
    for (const d of M.falls) { const u = clamp(d.t / d.dur, 0, 1), p = P3(d.x, d.y, d.z0 * (1 - u)); K.glow(c, p[0], p[1], T * 0.9, GOLD_HI, 0.8); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(p[0], p[1], T * 0.16, 0, TAU); c.fill(); }
    // the moonpearls: falling out of it, lying on the sand, carried over the pet, flying into its heart
    if (M.wt) for (const p of M.wt.pearls) { if (p.st === 'in') continue; let q;
      if (p.st === 'fall') { const u = clamp(p.t / p.dur, 0, 1); if (u <= 0) continue; q = P3(lerp(p.x0, p.x, u), lerp(p.y0, p.y, u), lerp(p.z0, 0.6, u) + Math.sin(u * Math.PI) * 5); }
      else if (p.st === 'lie') q = P3(p.x, p.y, 0.6 + Math.sin(t * 3 + p.i) * 0.15);
      else if (p.st === 'held') q = P3(me.x, me.y, 2.3 + Math.sin(t * 5) * 0.1);
      else { const u = smooth(clamp(p.t / 0.6, 0, 1)); q = P3(lerp(p.x0, p.x1, u), lerp(p.y0, p.y1, u), lerp(p.z0, p.z1, u) + Math.sin(u * Math.PI) * 3); }
      const r = T * 0.52, pu = 0.5 + 0.5 * Math.sin(t * 4 + p.i);
      if (p.st === 'lie') { c.fillStyle = 'rgba(14,20,36,.3)'; const g = P3(p.x, p.y, 0); c.beginPath(); c.ellipse(g[0], g[1], r * 1.2, r * 0.4, 0, 0, TAU); c.fill(); }
      K.glow(c, q[0], q[1], r * 3.4, MOON_HI, 0.45 + 0.25 * pu); K.glow(c, q[0], q[1], r * 1.8, GOLD_HI, 0.35);
      TN.shape(c, TN.ell(q[0], q[1], r, r), { col: PEARL, shade: '#C8C0DA', shade2: '#A8A2C4', hi: '#FFFFFF', line: LINE, lw, r, force: true, spec: 0.9, specAt: [q[0] - r * 0.35, q[1] - r * 0.4] });
      if (p.st === 'lie') label(c, 'MOONPEARL', q[0], q[1] - T * 1.3, T, '#FFFFFF', Math.max(10, T * 0.52)); }
    // the eclipse: the island dims to a soft circle of light round the pet (and round lit lanterns); the eye-pearls burn
    if (M.dark > 0.01) drawDark(c, FX, T, M.dark);
    if (M.dark > 0.05 && !m.dead) { const F = frameOf(FX); EYE_PHI.forEach((a, i) => { const e = M.eyes[i]; if (e.b > 0.7) return; const p = eyeAt(F, i), q = P3(p[0], p[1], p[2]); K.glow(c, q[0], q[1], T * 1.6, GOLD_HI, 0.75 * M.dark * (1 - e.b)); c.fillStyle = `rgba(255,248,220,${0.9 * M.dark * (1 - e.b)})`; c.beginPath(); c.arc(q[0], q[1], T * 0.2, 0, TAU); c.fill(); });
      const S = sunAt(F), q = P3(S[0], S[1], S[2]); K.glow(c, q[0], q[1], SUN_R * T * 2.6, GOLD, 0.3 * M.dark); }
    // the bared heart: a target ring on the black sun
    const wk = FX.S.weak.heart; if (wk && !wk.dead) { const S = heartAt(FX), p = P3(S[0], S[1], S[2]), pu = 0.5 + 0.5 * Math.sin(t * 7); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GOLD_HI; c.globalAlpha = 0.55 + 0.4 * pu; c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.arc(p[0], p[1], T * (SUN_R + 0.5 + pu * 0.3), 0, TAU); c.stroke(); c.restore(); label(c, 'BLACK HEART', p[0], p[1] - T * (SUN_R + 1.4), T, GOLD_HI, Math.max(11, T * 0.62)); }
    // the counters, over the pet
    const hy = FX.sy(me.y) - T * 2.4, hx = FX.sx(me.x);
    if (M.hd) { const left = M.hd.left + M.hd.list.length + M.hd.pending; label(c, `THE TIDE · WAVE ${M.hd.wave + 1}/${Math.ceil(HORDE / WAVE)} · ${left} left`, hx, hy, T, TIDE_HI, Math.max(12, T * 0.62)); }
    else if (M.ecl) { const n = M.lan.filter(L => L.on).length, left = Math.max(0, M.ecl.T - M.ecl.t); label(c, `ECLIPSE · LANTERNS ${n}/4 · ${left.toFixed(0)}s`, hx, hy, T, GOLD_HI, Math.max(12, T * 0.64)); lanternArrows(c, FX, T, t); }
    else if (M.wt) { label(c, M.wt.held ? 'CARRY IT INTO THE BELL\'S REACH' : `MOONPEARLS ${M.wt.n}/3`, hx, hy, T, GOLD_HI, Math.max(12, T * 0.64)); }
    c.restore(); }
  // during the eclipse, a gold arrow at the edge of the view toward each unlit lantern that is off screen
  function lanternArrows(c, FX, T, t) { const M = FX.mem, C = FX.C, V = K.viewBox(c, 0), SW = (typeof arc !== 'undefined' && arc.W) || V[2], SH = (typeof arc !== 'undefined' && arc.H) || V[3], x0 = 40, x1 = SW - 40, y0 = 160, y1 = SH - 200, cx = SW / 2, cy = SH / 2;
    LANTERNS.forEach((P, i) => { if (M.lan[i].on) return; const X = FX.sx(C.x + P[0]), Y = FX.sy(C.y + P[1]); if (X > x0 && X < x1 && Y > y0 && Y < y1) return;
      const dx = X - cx, dy = Y - cy, k = Math.min(Math.abs((x1 - cx) / (dx || 1e-6)), Math.abs((y1 - cy) / (dy || 1e-6)), 1), ex = cx + dx * k, ey = cy + dy * k, a = Math.atan2(dy, dx), pu = 0.5 + 0.5 * Math.sin(t * 6 + i);
      c.save(); c.translate(ex, ey); K.glow(c, 0, 0, 30, GOLD_HI, 0.35 + 0.25 * pu); c.fillStyle = GOLD_HI; c.strokeStyle = '#2B2433'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill(); c.stroke(); c.rotate(a); c.fillStyle = '#2B2433'; c.beginPath(); c.moveTo(9, 0); c.lineTo(-4, -7); c.lineTo(-4, 7); c.closePath(); c.fill(); c.restore();
      label(c, 'LANTERN', Math.max(x0 + 8, Math.min(x1 - 8, ex)), ey + 28, T, '#FFFFFF', 11); }); }
  // the eclipse's darkness: painted small (so its edges are soft), holes cut where there is light, laid over the view
  function drawDark(c, FX, T, a) { const M = FX.mem, C = FX.C, me = FX.me, V = K.viewBox(c, 0), W = V[2] - V[0], H = V[3] - V[1], s = 0.18, cw = Math.max(8, Math.ceil(W * s)), ch = Math.max(8, Math.ceil(H * s));
    if (!darkCv) darkCv = document.createElement('canvas'); if (darkCv.width !== cw || darkCv.height !== ch) { darkCv.width = cw; darkCv.height = ch; }
    const g = darkCv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, cw, ch); g.fillStyle = 'rgb(4,6,16)'; g.fillRect(0, 0, cw, ch);
    g.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, k) => { const X = (FX.sx(x) - V[0]) * s, Y = (FX.sy(y) - V[1]) * s, R = r * T * s, gr = g.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(0.5, `rgba(0,0,0,${k * 0.92})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X - R, Y - R, R * 2, R * 2); };
    hole(me.x, me.y - 0.4, 5.6, 1);
    M.lan.forEach((L, i) => { const P = LANTERNS[i]; hole(C.x + P[0], C.y + P[1] - 0.8, L.on ? 4.2 : 1.6, L.on ? 1 : 0.55); });
    c.save(); c.globalAlpha = 0.66 * a; c.imageSmoothingEnabled = true; c.drawImage(darkCv, 0, 0, cw, ch, V[0], V[1], W, H); c.restore(); }

  /* ---------- the ground: the Heart of the Moon, a pearl-sand island in the silver-black inner sea ---------- */
  function paintIsland(c, A) { const rnd = A.rnd, E = A.R + 1.5;
    // the sea round it: silver-black, its glints, rings of swell round the island, lotus burning gold on it
    { const g = c.createRadialGradient(0, 0, ISL, 0, 0, E); g.addColorStop(0, '#1C3846'); g.addColorStop(0.25, '#12242E'); g.addColorStop(0.8, '#0B1520'); g.addColorStop(1, 'rgba(10,18,28,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, E, 0, TAU); c.fill();
      c.lineCap = 'round'; for (let i = 0; i < 260; i++) { const a = rnd() * TAU, d = ISL + 0.6 + rnd() * (E - ISL - 1), x = Math.cos(a) * d, y = Math.sin(a) * d, w = 0.3 + rnd() * 0.9; c.strokeStyle = `rgba(217,222,232,${0.08 + rnd() * 0.22 * (1 - (d - ISL) / (E - ISL))})`; c.lineWidth = 0.05 + rnd() * 0.05; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y); c.stroke(); }
      for (const [r, a] of [[ISL + 0.9, 0.22], [ISL + 1.8, 0.13], [ISL + 3.0, 0.07]]) { c.strokeStyle = `rgba(200,236,244,${a})`; c.lineWidth = 0.09; c.beginPath(); for (let i = 0; i <= 120; i++) { const t2 = i / 120 * TAU, rr = r + Math.sin(t2 * 11 + r) * 0.12; i ? c.lineTo(Math.cos(t2) * rr, Math.sin(t2) * rr) : c.moveTo(Math.cos(t2) * rr, Math.sin(t2) * rr); } c.stroke(); }
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + 0.7 + i * (TAU - 1.4) / 8 + (rnd() - 0.5) * 0.2, d = ISL + 1.6 + rnd() * 1.8, x = Math.cos(a) * d, y = Math.sin(a) * d; lotus(c, x, y, 0.42 + rnd() * 0.18, rnd); } }
    // the shore: foam, feathered
    for (const [w, a] of [[0.9, 0.08], [0.45, 0.16], [0.16, 0.5]]) { c.strokeStyle = `rgba(244,238,246,${a})`; c.lineWidth = w; c.beginPath(); for (let i = 0; i <= 140; i++) { const t2 = i / 140 * TAU, rr = ISL + 0.15 + Math.sin(t2 * 17) * 0.08 + Math.sin(t2 * 7) * 0.06; i ? c.lineTo(Math.cos(t2) * rr, Math.sin(t2) * rr) : c.moveTo(Math.cos(t2) * rr, Math.sin(t2) * rr); } c.stroke(); }
    c.save(); c.beginPath(); c.arc(0, 0, ISL, 0, TAU); c.clip();
    // pearl sand, darker and wetter toward the shore
    { const g = c.createRadialGradient(0, 2, 1, 0, 0, ISL); g.addColorStop(0, '#EAE2EA'); g.addColorStop(0.62, '#DCD3DF'); g.addColorStop(0.9, '#C4BFD1'); g.addColorStop(1, '#A4AEBC'); c.fillStyle = g; c.fillRect(-ISL, -ISL, ISL * 2, ISL * 2);
      for (let i = 0; i < 18; i++) { const x = (rnd() * 2 - 1) * ISL * 0.85, y = (rnd() * 2 - 1) * ISL * 0.85, r = 2 + rnd() * 4, col = ['232,168,196', '169,200,240', '127,216,224', '200,180,240'][i % 4], gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(${col},.16)`); gg.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      const v = c.createLinearGradient(0, -ISL, 0, 2); v.addColorStop(0, 'rgba(120,170,200,.26)'); v.addColorStop(1, 'rgba(120,170,200,0)'); c.fillStyle = v; c.fillRect(-ISL, -ISL, ISL * 2, ISL + 2); }
    // the sand's grain, combed toward the bell by the pull
    c.lineCap = 'round'; for (let i = 0; i < 420; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (ISL - 0.4), x = Math.cos(a) * d, y = Math.sin(a) * d, dx = FOOT[0] - x, dy = FOOT[1] - y, dl = Math.hypot(dx, dy) || 1, L = 0.25 + rnd() * 0.5; c.strokeStyle = rnd() < 0.5 ? `rgba(150,140,170,${0.1 + rnd() * 0.1})` : `rgba(255,255,255,${0.2 + rnd() * 0.2})`; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx / dl * L, y + dy / dl * L); c.stroke(); }
    for (let k = 0; k < 7; k++) { const r = 2.5 + k * 1.8; c.strokeStyle = 'rgba(150,140,175,.12)'; c.lineWidth = 0.07; c.beginPath(); for (let i = 0; i <= 90; i++) { const t2 = i / 90 * TAU, rr = r + Math.sin(t2 * 6 + k) * 0.25; i ? c.lineTo(Math.cos(t2) * rr, 1 + Math.sin(t2) * rr * 0.92) : c.moveTo(Math.cos(t2) * rr, 1 + Math.sin(t2) * rr * 0.92); } c.stroke(); }
    // tide pools
    for (const [x, y, rx, ry] of [[-10.2, 3.6, 1.6, 0.9], [8.8, 2.4, 1.3, 0.75], [-3.4, 11.4, 1.5, 0.8], [11.0, 8.8, 1.0, 0.6], [-11.6, -6.8, 1.1, 0.6], [3.8, -6.6, 0.9, 0.5]]) {
      const g = c.createRadialGradient(x - rx * 0.2, y - ry * 0.2, 0.1, x, y, rx); g.addColorStop(0, '#3E7A8C'); g.addColorStop(0.7, '#2A5A6C'); g.addColorStop(1, '#1E4252'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(30,32,48,.55)'; c.lineWidth = 0.08; c.stroke();
      c.strokeStyle = 'rgba(127,216,224,.5)'; c.lineWidth = 0.06; c.beginPath(); c.ellipse(x, y, rx * 0.7, ry * 0.65, 0, Math.PI * 1.1, Math.PI * 1.8); c.stroke(); c.fillStyle = 'rgba(244,238,246,.85)'; c.beginPath(); c.arc(x + rx * 0.3, y + ry * 0.2, 0.12, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.05; c.beginPath(); c.ellipse(x, y, rx + 0.12, ry + 0.1, 0, 0, TAU); c.stroke(); }
    // shells strewn on the sand
    for (let i = 0; i < 46; i++) { const a = rnd() * TAU, d = 2 + Math.sqrt(rnd()) * (ISL - 3), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.16 + rnd() * 0.18, k = rnd(); c.save(); c.translate(x, y); c.rotate(rnd() * TAU);
      if (k < 0.5) { c.fillStyle = rnd() < 0.5 ? '#F6E8EE' : '#E8D4E0'; c.beginPath(); c.moveTo(0, s * 0.3); c.arc(0, s * 0.3, s, Math.PI * 1.15, Math.PI * 1.85); c.closePath(); c.fill(); c.strokeStyle = 'rgba(120,100,130,.5)'; c.lineWidth = 0.025; c.stroke(); for (let j = -2; j <= 2; j++) { c.beginPath(); c.moveTo(0, s * 0.3); c.lineTo(Math.sin(j * 0.28) * s * 0.9, s * 0.3 - Math.cos(j * 0.28) * s * 0.9); c.stroke(); } }
      else { c.strokeStyle = 'rgba(140,120,150,.55)'; c.lineWidth = 0.04; c.fillStyle = '#EFE2EA'; c.beginPath(); c.ellipse(0, 0, s * 0.8, s * 0.6, 0, 0, TAU); c.fill(); c.beginPath(); for (let j = 0; j <= 16; j++) { const aa = j / 16 * TAU * 1.6, rr = s * 0.7 * (1 - j / 18); j ? c.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr * 0.8) : c.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr * 0.8); } c.stroke(); }
      c.restore(); }
    // coral and shell along the rim
    for (let i = 0; i < 46; i++) { const a = i / 46 * TAU + (rnd() - 0.5) * 0.08, d = ISL - 0.5 - rnd() * 0.5, x = Math.cos(a) * d, y = Math.sin(a) * d, col = ['#E8A8C4', '#D8C8E8', '#F2D2E0', '#A9C8F0'][Math.floor(rnd() * 4)]; if (rnd() < 0.3) continue; coral(c, x, y, 0.42 + rnd() * 0.36, col, rnd); }
    c.restore();
    // the rim
    c.strokeStyle = 'rgba(30,32,48,.7)'; c.lineWidth = 0.14; c.beginPath(); c.arc(0, 0, ISL, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, ISL - 0.14, 0, TAU); c.stroke(); }
  // a clump of coral: rounded fingers standing up from a knot, knobbed at their tips
  function coral(c, x, y, s, col, rnd) { const n = 3 + Math.floor(rnd() * 3), tips = [];
    for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k - (n - 1) / 2) * 0.5 + (rnd() - 0.5) * 0.25, L = s * (0.65 + rnd() * 0.55); tips.push([x + Math.cos(a) * L, y + Math.sin(a) * L * 0.85, x + Math.cos(a) * L * 0.45 + (rnd() - 0.5) * s * 0.2, y + Math.sin(a) * L * 0.5]); }
    c.fillStyle = 'rgba(30,32,48,.18)'; c.beginPath(); c.ellipse(x, y + s * 0.08, s * 0.7, s * 0.22, 0, 0, TAU); c.fill();
    for (const [w, cc] of [[0.42, 'rgba(30,32,48,.75)'], [0.28, col]]) { c.strokeStyle = cc; c.lineWidth = s * w; c.beginPath(); for (const [tx, ty, mx, my] of tips) { c.moveTo(x, y); c.quadraticCurveTo(mx, my, tx, ty); } c.stroke(); }
    for (const [tx, ty] of tips) { c.fillStyle = col; c.beginPath(); c.arc(tx, ty, s * 0.19, 0, TAU); c.fill(); c.strokeStyle = 'rgba(30,32,48,.75)'; c.lineWidth = s * 0.07; c.stroke(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(tx - s * 0.06, ty - s * 0.06, s * 0.06, 0, TAU); c.fill(); } }
  // a pale lotus on the water, burning gold at its heart (its glow a soft sprite)
  function lotus(c, x, y, s, rnd) { c.save(); c.translate(x, y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(GOLD), -s * 3, -s * 3, s * 6, s * 6); c.restore();
    c.save(); c.translate(x, y); c.fillStyle = 'rgba(30,58,72,.7)'; c.beginPath(); c.ellipse(0, s * 0.25, s * 1.5, s * 0.55, 0, 0, TAU); c.fill();
    for (let k = 0; k < 7; k++) { const a = Math.PI + k / 6 * Math.PI, px = Math.cos(a) * s * 0.75, py = Math.sin(a) * s * 0.45; c.fillStyle = k % 2 ? '#F4EEF6' : '#E8D8EC'; c.beginPath(); c.ellipse(px, py, s * 0.42, s * 0.2, a + Math.PI / 2, 0, TAU); c.fill(); c.strokeStyle = 'rgba(30,32,48,.5)'; c.lineWidth = 0.03; c.stroke(); }
    c.fillStyle = GOLD_HI; c.beginPath(); c.arc(0, -s * 0.12, s * 0.22, 0, TAU); c.fill(); c.restore(); void rnd; }
  /* the backdrop: the hollow inside the moon: a dark dome of moonstone shell overhead, shell spires on the horizon, the
     silver-black sea; once it falls, a pale dawn */
  function paintSky(c, W, H, T, dawn) { const R = mulberry32(808), g = c.createLinearGradient(0, 0, 0, H);
    if (!dawn) { g.addColorStop(0, '#04050C'); g.addColorStop(0.3, '#0A0E1E'); g.addColorStop(0.5, '#142030'); g.addColorStop(0.56, '#0E1A26'); g.addColorStop(1, '#08101A'); }
    else { g.addColorStop(0, '#2A2E4E'); g.addColorStop(0.28, '#6A6A8E'); g.addColorStop(0.48, '#F2D6CA'); g.addColorStop(0.56, '#C8B8C4'); g.addColorStop(1, '#4A5A72'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const hz = H * 0.5;
    // the shell of the hollow moon overhead: great faint arcs and pale craters
    c.save(); for (let k = 0; k < 6; k++) { c.strokeStyle = dawn ? 'rgba(255,240,230,.12)' : `rgba(169,200,240,${0.05 + k * 0.01})`; c.lineWidth = 1.2 + k * 0.4; c.beginPath(); c.arc(W / 2, hz + H * 0.15, H * (0.32 + k * 0.12), Math.PI * 1.05, Math.PI * 1.95); c.stroke(); }
    for (let i = 0; i < 14; i++) { const x = R() * W, y = R() * hz * 0.8, r = 3 + R() * 10; c.strokeStyle = dawn ? 'rgba(255,240,230,.14)' : 'rgba(169,200,240,.08)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, 0, TAU); c.stroke(); }
    for (let i = 0; i < 70; i++) { c.globalAlpha = 0.2 + R() * 0.5; c.fillStyle = R() < 0.7 ? PEARL : GOLD_HI; c.beginPath(); c.arc(R() * W, R() * hz, 0.5 + R() * R() * 1.6, 0, TAU); c.fill(); } c.globalAlpha = 1;
    if (dawn) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7; blitSized(c, glowSprite('#FFE8CC'), W * 0.5 - W * 0.9, hz - H * 0.32, W * 1.8, H * 0.62); c.globalAlpha = 0.6; blitSized(c, glowSprite('#FFF6E8'), W * 0.5 - W * 0.35, hz - H * 0.12, W * 0.7, H * 0.24); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    // shell spires on the horizon, far off
    for (let i = 0; i < 9; i++) { const x = (i / 8) * W + (R() - 0.5) * W * 0.08, h = H * (0.05 + R() * 0.1), w = h * (0.16 + R() * 0.08); c.fillStyle = dawn ? '#5A5A78' : '#0C1624'; c.beginPath(); c.moveTo(x - w, hz); for (let k = 0; k <= 6; k++) { const u = k / 6; c.lineTo(x - w * (1 - u) + Math.sin(u * 9) * w * 0.15, hz - h * u); } for (let k = 6; k >= 0; k--) { const u = k / 6; c.lineTo(x + w * (1 - u) + Math.sin(u * 9 + 1) * w * 0.15, hz - h * u); } c.closePath(); c.fill();
      c.strokeStyle = dawn ? 'rgba(255,236,214,.5)' : 'rgba(169,200,240,.35)'; c.lineWidth = 1; c.beginPath(); for (let k = 1; k < 6; k++) { const u = k / 6; c.moveTo(x - w * (1 - u), hz - h * u); c.lineTo(x + w * (1 - u) * 0.6, hz - h * u - h * 0.04); } c.stroke(); }
    // the sea: glints and swells, lotus lights far off
    c.lineCap = 'round'; for (let i = 0; i < 90; i++) { const y = hz + 4 + Math.pow(R(), 1.6) * (H - hz), x = R() * W, w = 6 + R() * 26 * (y - hz) / (H - hz); c.strokeStyle = dawn ? `rgba(255,236,220,${0.12 + R() * 0.2})` : `rgba(217,222,232,${0.05 + R() * 0.12})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y); c.stroke(); }
    c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { const x = R() * W, y = hz + 6 + R() * (H - hz) * 0.7, r = 4 + R() * 6; c.globalAlpha = 0.5; blitSized(c, glowSprite(GOLD), x - r * 2, y - r, r * 4, r * 2); } c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.restore(); void T; }
})());
