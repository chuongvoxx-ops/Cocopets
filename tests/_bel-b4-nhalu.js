// Nhalu the Lantern Eel (Belfry boss 2, worker B4). Parts (env PART=gpu|2d|mech|fight, default all):
//   gpu   the fight loads with the eel drawn on the GPU (GLM, materials 105..109) and the FGFX layer; 7 bars, its health
//   2d    the same with WebGL off for it (the existing 2D Nhalu, DunBoss 'nhalu', drawn with the same fight)
//   mech  Lantern Hunt and Thunderwater (a pet left in the marked lane is struck, one that moves lane is not); the wheel
//         drains the marked lane and beaches it for 8 s at its damage window; at 50% two lanes charge in sequence and one
//         lane is always safe (a pet that leaves the first lane and steps back into its spent water is never struck);
//         the two leeches relock the wheel until they are defeated
//   fight a level-10 pet played by a bot that uses the mechanics; it should win in about 105 s of game time
// Every part: no page errors. usage: node tests/_bel-b4-nhalu.js   (HTML=test-belB4.html by default)
const { openBel } = require('./_bel-b4-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s, x === undefined ? '' : JSON.stringify(x)); if (!c) fails++; };
const PART = process.env.PART || 'all', want = p => PART === 'all' || PART.split(',').includes(p);

async function partLoad(gl) {
  const T = await openBel({ gl }); const { ev, errors } = T;
  await T.start();
  const r = await ev(`let frames0 = DEF.MODEL.__dbg.glStats.frames, w0 = performance.now(), g0 = D.g.t; while (performance.now() - w0 < 600000 && (D.g.t - g0 < 7 || (arg && DEF.MODEL.__dbg.glStats.frames - frames0 < 3))) { await frame(); me.hp = D.ST.hp; }
    const s = DEF.MODEL.__dbg.glStats;
    return { rift: window.__BELRIFT, bars: D.F.fiend.bars, hp: Math.round(b.hp), maxhp: Math.round(b.maxhp), barHP: Math.round(D.FD.barHP), act: b.act, gl: DEF.MODEL.__dbg.gl, frames: s.frames - frames0, tris: s.meshTris, ms: s.ms, box: s.box, wall: Math.round((performance.now() - w0) / 1000),
      fx: !!(self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX && self.NIDHOGG_MOVES.FGFX.usable()), lvl: D.ST.L, petHp: D.ST.hp, parts: Object.keys(FX.S.partsMap || {}).filter(k => FX.S.partsMap[k] && !FX.S.partsMap[k].dead), inNave: Math.abs(b.x - C.x) < L.NX && Math.abs(b.y - C.y) < L.NY,
      breaks: (M.breaks || []).filter(o => !o.dead).length, old2d: M.stat.old2d || 0, hpAmp: +M.hpAmp.toFixed(3) };`, gl);
  console.log(gl ? 'gpu' : '2d', JSON.stringify(r));
  ok(r.bars === 7, `${gl ? 'GPU' : '2D'}: seven health bars`, r.bars);
  ok(r.hp > 0 && r.hp === r.maxhp && Math.abs(r.maxhp / r.barHP - 7) < 0.6, 'its health fills the bars', [r.hp, r.barHP]);
  ok(r.lvl === 10, 'a level-10 pet', r.lvl);
  if (!gl) { ok(r.inNave && r.act !== 'enter', 'it has swum into the nave', [r.act]); ok(r.parts.length === 5, 'head, three lantern segments and the tail can be struck', r.parts); }   // (on swiftshader a GPU frame is slow and game time crawls: these are checked in 2D)
  ok(r.breaks === 6, 'six breakables stand in the nave', r.breaks);
  if (gl) { ok(r.gl && r.frames > 5 && r.tris > 5000, 'drawn on the GPU (GLM)', [r.gl, r.frames, r.tris, r.ms]); ok(r.fx, 'the FGFX painter is live for its effects'); }
  else ok(!r.gl && r.old2d > 5, 'where the GPU is off: the existing 2D Nhalu (DunBoss nhalu)', [r.gl, r.old2d]);
  // a breakable struck down goes through BREAK_FX
  if (!gl) { const br = await ev(`const o = M.breaks.find(q => !q.dead), n0 = self.BREAK_FX ? BREAK_FX.stats().shards + BREAK_FX.stats().parts : -1; D.hitMon(o, 1e6, { flat: true }); const go = clock(2.5); while (go()) await frame(); const s = self.BREAK_FX ? BREAK_FX.stats() : null; return { dead: o.dead, broken: M.stat.broken, fx: s ? s.shards + s.parts : -1, n0 };`);
  ok(br.dead && br.broken === 1 && br.fx > br.n0, 'a sea-glass growth shatters through BREAK_FX', br); }
  ok(errors.length === 0, `${gl ? 'GPU' : '2D'}: no page errors`, errors.slice(0, 4));
  await T.browser.close();
}

async function partMech() {
  const T = await openBel({ gl: false }); const { ev, errors } = T;
  await T.start();
  await ev(`const go = clock(5); while (go() && b.act === 'enter') await frame();`);
  // ---- Lantern Hunt: a pet that stays in the marked lane is struck by the Thunderwater; one that moves is not ----
  const h1 = await ev(`put(L.laneX(C, 1), C.y + 5); DEF.force(FX, 'hunt', { lane: 1 }); const lane = M.lanes[1], a = lane.armed, d0 = M.stat.disHit, x0 = M.stat.discharges;
    const tele = { T: a && a.T, sym: a && a.sym }; let lit = 0, bound = 0; const go = clock(3.6); while (go()) { await frame(); put(L.laneX(C, 1), C.y + 5); me.hp = D.ST.hp; lit = Math.max(lit, Math.max(...M.bulbs.map(q => q.g))); }
    return { tele, lit: +lit.toFixed(2), hit: M.stat.disHit - d0, dis: M.stat.discharges - x0 };`);
  ok(h1.tele.T >= 2.5 && h1.tele.T <= 3 && h1.tele.sym >= 1 && h1.tele.sym <= 3, 'Lantern Hunt: the charged lane is marked 2.5-3 s ahead with its bulb\'s symbol', h1.tele);
  ok(h1.lit > 1.5, 'its bulb lights', h1.lit);
  ok(h1.dis === 1 && h1.hit === 1, 'Thunderwater discharges in that lane and strikes a pet left in it', h1);
  const h2 = await ev(`put(L.laneX(C, 1), C.y + 5); DEF.force(FX, 'hunt', { lane: 1 }); const d0 = M.stat.disHit, x0 = M.stat.discharges; let go = clock(1.0); while (go()) { await frame(); me.hp = D.ST.hp; }
    go = clock(2.8); while (go()) { await frame(); put(L.laneX(C, 2), C.y + 5); me.hp = D.ST.hp; } return { hit: M.stat.disHit - d0, dis: M.stat.discharges - x0 };`);
  ok(h2.dis === 1 && h2.hit === 0, 'a pet that moves to another lane is not struck', h2);
  // ---- Drain-and-Bite: the wheel drains the marked lane, the eel beaches for 8 s ----
  const dr = await ev(`DEF.force(FX, 'drain', { lane: 0 }); let go = clock(16); put(C.x + 6, C.y - 6); while (go() && !M.wheels[0].exposed) { await frame(); me.hp = D.ST.hp; }
    const exposed = M.wheels[0].exposed, other = M.wheels[1].exposed, laneEel = L.laneOf(C, b.x); const W = M.wheels[0]; let t0 = D.g.t, beachAt = null, wet = 1;
    go = clock(3); while (go() && !M.beach) { await frame(); put(W.x + 0.6, W.y - 0.2); D.stick.x = D.stick.y = 0; me.hp = D.ST.hp; } beachAt = D.g.t - t0;
    const beached = !!M.beach, stun = +b.stunT.toFixed(2), k = M.beach ? FX.S.D.dmgK(FX, b, {}) / M.hpAmp / DEF.TUNE.kSwim : 0; let k0 = 0;
    go = clock(1.6); while (go()) { await frame(); me.hp = D.ST.hp; } wet = +M.lanes[0].wet.toFixed(2);
    const t1 = D.g.t; go = clock(11); while (go() && M.beach) { await frame(); me.hp = D.ST.hp; put(C.x + 7, C.y + 8); } const beachLen = +(D.g.t - t1 + 1.6 + (D.g.t - D.g.t)).toFixed(1);
    go = clock(1.5); while (go()) { await frame(); me.hp = D.ST.hp; }
    return { exposed, other, laneEel, beachAt: +beachAt.toFixed(2), beached, stun, k: +k.toFixed(2), wet, beachLen, wetAfter: +M.lanes[0].wet.toFixed(2), beachT: +M.stat.beachT.toFixed(1), drained: M.stat.drained };`);
  ok(dr.exposed && !dr.other && dr.laneEel === 0, 'Drain-and-Bite: it lies along the marked lane and one wheel is exposed', dr);
  ok(dr.beached && dr.beachAt < 1.5 && dr.drained === 1, 'the pet uses the wheel (0.75 s) and the lane drains: it beaches', dr);
  ok(dr.wet < 0.15, 'the marked lane runs dry', dr.wet);
  ok(dr.stun >= 7.5 && dr.beachT >= 7.6 && dr.beachT <= 9.2, 'beached for about 8 s', [dr.stun, dr.beachT]);
  ok(dr.k > 2.5, 'its damage window: blows land about three times harder while it is beached', dr.k);
  ok(dr.wetAfter > 0.6, 'then the water returns', dr.wetAfter);
  // ---- 50%: two lanes in sequence, never three at once; leave the first, then step back into its spent water ----
  const sq = await ev(`b.hp = b.maxhp * 0.48; let go = clock(3.5); while (go()) { await frame(); me.hp = D.ST.hp; }
    const phase = FX.S.phase, out = []; let maxArmed = 0, noSafe = 0, hits0 = M.stat.disHit;
    for (const start of [0, 1, 2, 1]) { put(L.laneX(C, start), C.y + 4); DEF.force(FX, 'hunt2', { lane: start }); const A = M.ac, la = A.lanes[0], lb = A.lanes[1]; let tB = null, dA = null, dB = null, t0 = D.g.t;
      go = clock(5.6); while (go()) { await frame(); me.hp = D.ST.hp; const t = D.g.t - t0, n = M.lanes.filter(q => q.armed).length; maxArmed = Math.max(maxArmed, n); if (n >= 3) noSafe++;
        if (tB == null && M.lanes[lb].armed) tB = t; if (dA == null && M.lanes[la].fx > 0) dA = t; if (dB == null && M.lanes[lb].fx > 0 && tB != null) dB = t;
        // the player's answer: out of the first lane into the second's neighbour (or the other lane), then back into the first's spent water
        if (dA == null) put(L.laneX(C, lb), C.y + 4); else put(L.laneX(C, la), C.y + 4); }
      out.push({ la, lb, tB: tB && +tB.toFixed(2), dA: dA && +dA.toFixed(2), dB: dB && +dB.toFixed(2) }); }
    return { phase, out, maxArmed, noSafe, hits: M.stat.disHit - hits0 };`);
  ok(sq.phase === 2, 'below 50%: the second phase', sq.phase);
  ok(sq.out.every(o => o.la !== o.lb && o.tB > 1 && o.dA > 2.4 && o.dB > o.dA + 1), 'two lanes charge in sequence, the second after the first', sq.out);
  ok(sq.maxArmed === 2 && sq.noSafe === 0, 'never three lanes at once: one lane is always safe', [sq.maxArmed, sq.noSafe]);
  ok(sq.hits === 0, 'leaving the first lane, then stepping into its discharged water, is never struck', sq.hits);
  // ---- leeches: two crawl to the exposed wheel and relock it until they are defeated ----
  const lc = await ev(`DEF.force(FX, 'drain', { lane: 2 }); let go = clock(16); put(C.x - 7, C.y - 8); while (go() && !M.wheels[1].exposed) { await frame(); me.hp = D.ST.hp; put(C.x - 7, C.y - 8); }
    const spawned = M.leeches.length, isMon = M.leeches.every(q => q.m.type === 'leech'); go = clock(12); while (go() && !M.wheels[1].locked) { await frame(); me.hp = D.ST.hp; put(C.x - 7, C.y - 8); }
    const locked = M.wheels[1].locked, refused = DEF.useWheel(FX, 1) === false && !M.beach;
    for (const q of M.leeches.slice()) D.hitMon(q.m, 1e9, { flat: true }); go = clock(0.5); while (go()) { await frame(); me.hp = D.ST.hp; }
    const unlocked = !M.wheels[1].locked, used = M.wheels[1].exposed && DEF.useWheel(FX, 1) === true;
    return { spawned, isMon, locked, refused, unlocked, used, beached: !!M.beach, kills: M.stat.leechKill, locks: M.stat.leechLock };`);
  ok(lc.spawned === 2 && lc.isMon, 'two bell leeches (the rift\'s MON leech) come for the wheel', lc);
  ok(lc.locked && lc.refused, 'a leech that reaches the wheel relocks it', lc);
  ok(lc.unlocked && lc.used && lc.beached && lc.kills >= 2, 'defeated, the wheel turns again and the eel beaches', lc);
  ok(errors.length === 0, 'mech: no page errors', errors.slice(0, 4));
  await T.browser.close();
}

async function partFight() {
  const T = await openBel({ gl: false }); const { ev, errors } = T;
  await T.start();
  await ev(`D.g.taps = 9; const go = clock(8); while (go() && b.act === 'enter') await frame();`);
  const res = await ev(`const MAXT = arg.maxT, t0 = D.g.t, st = D.stick, TM = DEF.TM;
    let lost = 0, hpPrev = me.hp, deaths = 0, phaseT = {}, lastPh = FX.S.phase, rolls = 0, maxArmed = 0, noSafe = 0, worst = 0, win = [];
    const steer = (dx, dy) => { const l = Math.hypot(dx, dy); st.id = 'bot'; st.ox = 0; st.oy = 0; if (l < 0.05) { st.x = 0; st.y = 0; return; } st.x = dx / l * 46; st.y = dy / l * 46; };
    const goTo = (x, y, stop) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < (stop || 0.3)) steer(0, 0); else steer(dx, dy); return d; };
    const tap = t => { if (!t) return; const dx = t.x - me.x, dy = t.y - me.y, d = Math.hypot(dx, dy) || 1; D.g.tapAim = { t, x: dx / d, y: dy / d, a: Math.atan2(dy, dx), tap: true, px: t.x, py: t.y }; D.g.tapBuf = 0.35; };
    const partsAlive = () => Object.values(FX.S.partsMap || {}).filter(o => o && !o.dead);
    while (D.g.t - t0 < MAXT && !b.dead) { await frame();
      const now = D.g.t - t0; if (me.hp < hpPrev) { lost += hpPrev - me.hp; win.push([now, hpPrev - me.hp]); } win = win.filter(w => now - w[0] < 20); worst = Math.max(worst, win.reduce((a, w) => a + w[1], 0));
      if (me.hp <= 0 || me.dead) deaths++; me.hp = D.ST.hp; hpPrev = me.hp;
      if (FX.S.phase !== lastPh) { lastPh = FX.S.phase; phaseT[lastPh] = +now.toFixed(1); }
      const armed = M.lanes.filter(q => q.armed), na = armed.length; maxArmed = Math.max(maxArmed, na); if (na >= 3) noSafe++;
      // 1. danger: out of an armed lane into the nearest safe one (the spent water counts as safe)
      const myL = L.laneOf(C, me.x); let mv = null;
      if (armed.some(q => L.inLane(C, q.i, me.x, me.y, me.r))) { let best = null, bd = 1e9; for (let i = 0; i < 3; i++) { if (M.lanes[i].armed) continue; const d = Math.abs(L.laneX(C, i) - me.x); if (d < bd) { bd = d; best = i; } } if (best != null) mv = [L.laneX(C, best) - me.x, 0]; }
      const B = M.ac && M.ac.bite; if (!mv && B && !B.hit) { const s = { shape: 'line', x: B.x, y: B.y, a: B.a, len: B.len, w: B.w }; if (FX.inShape(s, me.x, me.y, me.r + 0.4)) { const px = -Math.sin(B.a), py = Math.cos(B.a), side = (me.x - B.x) * px + (me.y - B.y) * py; mv = [px * Math.sign(side || 1), py * Math.sign(side || 1)]; if (TM.bite - B.t < 0.5 && D.g.dodgeCd <= 0 && D.dodge) { D.dodge(); rolls++; } } }
      if (mv) { steer(mv[0], mv[1]); }
      // 2. leeches first, then the exposed wheel, else the eel
      const lee = M.leeches.map(q => q.m).filter(q => q && !q.dead).sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0];
      const W = M.wheels.find(w => w.exposed);
      let target = null;
      if (lee && (!W || W.locked || Math.hypot(lee.x - me.x, lee.y - me.y) < 5)) { target = lee; if (!mv) goTo(lee.x, lee.y, 1.4); }
      else if (W && !W.locked) { if (!mv) { const d = goTo(W.x + 0.5, W.y - 0.2, 0.35); if (d < 0.35) { steer(0, 0); me.vx = me.vy = 0; } } target = null; }
      else { const ps = partsAlive().sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y)); target = ps[0] || b;
        if (!mv) { const d = Math.hypot(target.x - me.x, target.y - me.y); if (d > 2.6) goTo(target.x, target.y + 0.8, 2.2); else steer(0, 0); } }
      if (target) { tap(target); if (D.g.cdS <= 0 && me.mp > 25 && D.useStrong) { try { D.useStrong(0); } catch (e) {} } } }
    st.id = null; st.x = st.y = 0;
    const tEnd = D.g.t - t0; let after = 0; const go = clock(7); while (go()) await frame();
    return { dead: b.dead, t: +tEnd.toFixed(1), phaseT, lost: Math.round(lost), lostPerMin: +(lost / tEnd * 60).toFixed(1), worst20: Math.round(worst), petHp: D.ST.hp, deaths, rolls, maxArmed, noSafe, stat: M.stat, burst: M.bulbs.filter(q => q.burst).length, won: D.g.won, state: window.__pp.arc.state, kit: D.KITR && D.KITR.normal ? D.KITR.normal.key : null, species: window.__pp.st.genome ? window.__pp.st.genome.species || window.__pp.st.genome.sp : null };`, { maxT: +(process.env.MAXT || 300) });
  const s = res.stat; delete res.stat; console.log('result', JSON.stringify(res)); console.log('stat', JSON.stringify(s));
  ok(res.dead, `a level-10 pet defeats Nhalu in ${res.t} s of game time (target ~105 s)`);
  ok(res.t > 70 && res.t < 150, 'about the target time (the starter kit moves it: seeds 3 and 7 straddle ~105 s)', [res.t, res.kit]);
  ok(res.phaseT[2] > 0, 'both phases', res.phaseT);
  ok(s.hunts > 0 && s.drained > 0 && s.beached > 0, 'Lantern Hunts, drains and beachings all happen', [s.hunts, s.hunt2s, s.drained, s.beached]);
  ok(res.maxArmed <= 2 && res.noSafe === 0, 'never without a safe lane', [res.maxArmed, res.noSafe]);
  ok(res.burst === 3 && res.won, 'its fall: all three bulbs burst, the stage is won', [res.burst, res.won, res.state]);
  ok(errors.length === 0, 'fight: no page errors', errors.slice(0, 4));
  await T.browser.close();
}

(async () => {
  if (want('gpu')) await partLoad(true);
  if (want('2d')) await partLoad(false);
  if (want('mech')) await partMech();
  if (want('fight')) await partFight();
  console.log(fails ? `${fails} FAILED` : 'all ok'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL (exception)', e && e.message); process.exit(1); });
