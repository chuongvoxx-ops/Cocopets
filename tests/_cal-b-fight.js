// Bomb King (Rift 0, worker B): a level-1 starter plays the whole fight with a bot that uses the mechanics as a player
// would: it returns every bomb it can (walks over and hits it while it shows RETURN), keeps clear of armed ones, steps
// into a volley's gap and the orbit's opening (or rolls through), strikes the core when it is open, and in a detonation
// returns the supplied bomb (or, with NOBOMB=1, batters the core, or with SHELTER=1 runs for the nearest SAFE side).
// Measures the fight's length in game time, the damage taken (the pet is topped up, so the run always ends), the
// mechanics' counts, and checks the spec's rules on the way (phases at 70% and 35%, at most two grounded larvae, a
// supplied bomb at every detonation's start, shelters intact, no death explosion).
// usage: HTML=test-calB.html node tests/_cal-b-fight.js   env: SHOTS=1, NOBOMB=1, SHELTER=1, MAXT=400, EASE
const { openCal } = require('./_cal-b-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s, x === undefined ? '' : JSON.stringify(x)); if (!c) fails++; };
(async () => {
  const T = await openCal({ gl: false }); const { page, errors, shot, start, ev } = T;
  await start();
  await ev(`D.g.taps = 9; const go = clock(8); while (go() && b.act === 'enter') await frame();`);
  const info = await ev(`return { rift: window.__CALRIFT, n: D.F.n, hp: Math.round(b.maxhp), eff: M.effHp, bars: D.F.fiend.bars, dmg: +b.dmg.toFixed(2), petHp: D.ST.hp, atk: D.ST.atk, lvl: D.ST.L, kit: D.KITR.normal.key, act: b.act };`);
  console.log('setup', JSON.stringify(info));
  const mode = process.env.SHELTER ? 'shelter' : process.env.NOBOMB ? 'core' : 'bomb';
  const shotsAt = process.env.SHOTS ? [6, 30, 60, 90, 120, 150] : [];
  const res = await ev(`const mode = arg.mode, MAXT = arg.maxT, TM = DEF.TM, SH = DEF.SHELTERS, C = FX.C, t0 = D.g.t, st = D.stick;
    let lost = 0, worst = 0, win = [], hpPrev = me.hp, deaths = 0, maxGround = 0, supSeen = 0, charges = 0, shelterOk = true, phaseT = {}, lastPh = FX.S.phase, rolls = 0, booms = 0;
    const tiles0 = M.sh.map(s => SH.list(C)[s.i]);
    const steer = (dx, dy) => { const l = Math.hypot(dx, dy); st.id = 'bot'; st.ox = 0; st.oy = 0; if (l < 0.05) { st.x = 0; st.y = 0; return; } st.x = dx / l * 46; st.y = dy / l * 46; };
    const goTo = (x, y, stop) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < (stop || 0.3)) steer(0, 0); else steer(dx, dy); return d; };
    const tap = t => { if (!t) return; const dx = t.x - me.x, dy = t.y - me.y, d = Math.hypot(dx, dy) || 1; D.g.tapAim = { t, x: dx / d, y: dy / d, a: Math.atan2(dy, dx), tap: true, px: t.x, py: t.y }; D.g.tapBuf = 0.35; };
    const core = () => FX.S.objs.find(o => o.isCore && !o.dead);
    while (D.g.t - t0 < MAXT && !b.dead) { await frame();
      const now = D.g.t - t0; if (me.hp < hpPrev) { const d = hpPrev - me.hp; lost += d; win.push([now, d]); } win = win.filter(w => now - w[0] < 20); worst = Math.max(worst, win.reduce((a, w) => a + w[1], 0));
      if (me.hp <= 0 || me.dead) deaths++; me.hp = D.ST.hp; hpPrev = me.hp; me.mp = Math.max(me.mp, 0);
      if (FX.S.phase !== lastPh) { lastPh = FX.S.phase; phaseT[lastPh] = +now.toFixed(1); }
      const ground = M.bombs.filter(q => !q.sup && (q.st === 'safe' || q.st === 'armed')).length; maxGround = Math.max(maxGround, ground);
      if (arg.shots.length && now >= arg.shots[0]) { arg.shots.shift(); window.__SHOTNOW = (window.__SHOTNOW || 0) + 1; }
      const A = M.ac, counting = A && A.k === 'charge' && A.phase === 'count';
      if (counting && !A.botSeen) { A.botSeen = true; charges++; if (M.sup) supSeen++; }
      // 1. danger first: an armed bomb close by, the orbit's ring about to reach the pet, a volley lane over the pet
      let mv = null;
      for (const q of M.bombs) if (q.st === 'armed' && Math.hypot(me.x - q.x, me.y - q.y) < TM.larvaR + 1.1) mv = [me.x - q.x, me.y - q.y];
      const orb = FX.S.hz.find(z => z.kind === 'orbit'); if (!mv && orb) { const d = Math.hypot(me.x - orb.x, me.y - orb.y), a = Math.atan2(me.y - orb.y, me.x - orb.x), da = Math.atan2(Math.sin(orb.ga - a), Math.cos(orb.ga - a));
        if (d > orb.r - 0.6 && d < orb.r + 3.2 && Math.abs(da) > TM.orbitGap * 0.7) { mv = [-Math.sin(a) * Math.sign(da), Math.cos(a) * Math.sign(da)]; if (d - orb.r < 1.0 && D.g.dodgeCd <= 0) { D.dodge(); rolls++; } } }
      if (!mv && M.ac && M.ac.lanes && M.ac.o) for (const k of M.ac.lanes) { const a = M.ac.a + k * TM.spread, s = { shape: 'line', x: M.ac.o.x, y: M.ac.o.y, a, len: 17, w: TM.volleyR * 2 }; if (FX.inShape(s, me.x, me.y, me.r + 0.3)) { const px = -Math.sin(a), py = Math.cos(a), side = (me.x - s.x) * px + (me.y - s.y) * py; mv = [px * Math.sign(side || 1), py * Math.sign(side || 1)]; } }
      if (!mv) for (const e of D.eshots) { if (!e.calFire) continue; const rx = me.x - e.x, ry = me.y - e.y, v = Math.hypot(e.vx, e.vy), al = (rx * e.vx + ry * e.vy) / v, of = Math.abs(-rx * e.vy + ry * e.vx) / v; if (al > 0 && al < 3 && of < 0.8) { mv = [-e.vy, e.vx]; if (al < 1.2 && D.g.dodgeCd <= 0) { D.dodge(); rolls++; } } }
      // 2. a bomb to return (the supplied one first), else the King
      const ret = M.bombs.filter(q => (q.o || (q.lm && !q.lm.dead)) && (q.st === 'supplied' || (q.st === 'safe' && q.ft < TM.safe - 0.25))).map(q => { q.tg = q.o || q.lm; return q; }).sort((p, q) => (q.sup ? 1 : 0) - (p.sup ? 1 : 0) || Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0];
      let target = null;
      if (counting) { const left = TM.charge - A.t, ns = SH.nearestShelter(C, me.x, me.y), runT = ns.d / 4.2 + 0.6;
        const useBomb = mode === 'bomb' && ret && ret.sup, needCore = mode === 'core' && (A.dealt || 0) < A.need;
        if (mode === 'shelter' || (!useBomb && (left < runT || !needCore))) { if (SH.safeOf(C, me.x, me.y) < 0) goTo(ns.p.x, ns.p.y, 0.4); else steer(0, 0); mv = null; target = core() || b; tap(target); continue; }
        if (useBomb) { target = ret.tg; } else target = core() || b; }
      else if (ret && mode !== 'shelter-only') target = ret.tg;
      else target = (M.exposed && core()) || b;
      if (mv) { steer(mv[0], mv[1]); }
      else if (ret && target === ret.tg) goTo(ret.x, ret.y, 1.3);
      else { const cg = { x: b.x, y: b.y - M.zc * 0.695 }, d = Math.hypot(me.x - cg.x, me.y - cg.y); if (d > 5.5) goTo(cg.x, cg.y + 1, 4.5); else if (d < 3.2) steer(me.x - cg.x, me.y - cg.y); else steer(0, 0); }
      tap(target); if (D.g.cdS <= 0 && me.mp > 25 && D.useStrong) { try { D.useStrong(0); } catch (e) {} }
      for (const s of M.sh) if (!SH.list(C)[s.i]) shelterOk = false; }
    st.id = null; st.x = st.y = 0;
    const tEnd = D.g.t - t0;
    // after it falls: the ending (no blast), the shell cracked, the stage won
    let hurtAfter = 0, hp0 = me.hp; const go = clock(7); while (go()) { await frame(); if (me.hp < hp0) hurtAfter += hp0 - me.hp; hp0 = me.hp; }
    return { mode, dead: b.dead, t: +tEnd.toFixed(1), phaseT, lost: Math.round(lost), lostPerMin: +(lost / tEnd * 60).toFixed(1), worst20: Math.round(worst), petHp: D.ST.hp, deaths, rolls, maxGround, charges, supSeen, shelterOk, stat: M.stat, end: M.end && +M.end.t.toFixed(1), crack: +M.crack.toFixed(2), passage: +M.passage.toFixed(2), hurtAfter: Math.round(hurtAfter), won: D.g.won, state: window.__pp.arc.state };`,
    { mode, maxT: +(process.env.MAXT || 420), shots: shotsAt });
  const s = res.stat; delete res.stat; console.log('result', JSON.stringify(res)); console.log('stat', JSON.stringify(s));
  ok(res.dead, `the King falls (${res.mode}) in ${res.t} s of game time (target ~150 s)`);
  ok(res.phaseT[2] > 0 && res.phaseT[3] > res.phaseT[2], 'three phases in order', res.phaseT);
  ok(res.maxGround <= 2, 'never more than two grounded larvae', res.maxGround);
  ok(res.charges >= 1 && res.supSeen === res.charges, 'every detonation starts with a supplied bomb', [res.charges, res.supSeen]);
  ok(s.volleys > 0 && s.orbits > 0 && s.vents > 0 && s.larvae > 0, 'volley, orbit, vent and larvae all happen', [s.volleys, s.orbits, s.vents, s.larvae]);
  if (res.mode === 'bomb') ok(s.returns > 0 && s.staggers > 0 && s.intBomb > 0, 'bombs returned, staggers and a bomb-broken detonation', [s.returns, s.staggers, s.intBomb]);
  if (res.mode === 'core') ok(s.intCore > 0, 'core damage breaks a detonation', s.intCore);
  if (res.mode === 'shelter') ok(s.blasts > 0 && s.sheltered === s.blasts && s.blastHit === 0, 'every blast weathered on a SAFE side', [s.blasts, s.sheltered]);
  ok(res.hurtAfter === 0 && res.crack > 0.95, 'no death explosion: the shell cracks open, nothing hurts after', [res.hurtAfter, res.crack]);
  ok(errors.length === 0, 'no page errors', errors.slice(0, 5));
  console.log(fails ? `${fails} FAILED` : 'all ok');
  await T.browser.close(); process.exit(fails ? 1 : 0);
})();
