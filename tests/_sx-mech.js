// v445 SB: Asmodeus's mechanics, one by one, on the real gate (the Scorpio gate when it hands its arena to SCORPIO_BOSS, else the Aries
// altar with the same contract): every power fires and hits the pet for what TUNE says, and each answer works (stepping off a mark, a roll,
// a thread's gap, a spine's lee, a ring's gap, finding the real one, stepping off the ambush's glint); the parts (the pinned stinger breaks
// for good and takes a strike out of every Perdition, the crystal, the knots, the shells); Venom Debt on the pet (its ticks, its fading, the
// seal and its blow, Vigil Starlight, the bared Crucible); the phases; The Seventh Sin (the seals shelter, the debt amplifies, never lethal
// from full, broken stingers never fall, it cannot be harmed); the fall completes the gate and unlocks its Anima; the clean-up after the
// fall, the pet's death and the stage's end (Asmodeus's GPU buffers freed); the same fight at dt 1/60 and 1/4.
// usage: HTML=<test page> node tests/_sx-mech.js [powers,parts,debt,phases,cleanup,gpu,dt]
const L = require('./_sx-lib');
const ONLY = process.argv[2] || '';
let fails = 0; const ok = (c, msg, v) => { console.log((c ? 'PASS ' : 'FAIL ') + msg + (v !== undefined ? '  ' + JSON.stringify(v) : '')); if (!c) { fails++; process.exitCode = 1; } };
async function fresh(o) { const T = await L.open(Object.assign({ gl: false, lvl: 10 }, o || {})); T.info = await T.start(); await T.fight(); await T.ev(`SB.test.hold(true); return 1;`); return T; }
const RESET = `const home = () => { SB.test.abortActs(true); if (S.expose) { S.expose = null; S.m.stunT = 0; S.m.act = 'fight'; } S.m.x = S.home.x; S.m.y = S.home.y; S.B.x = S.m.x; S.B.y = S.m.y; S.B.vx = S.B.vy = 0;
    S.waves.length = 0; S.marks.length = 0; S.spines.length = 0; S.pools.length = 0; if (S.web) { SB.test.S.web.t = 99; step(0.05); } S.debt = 0; S.seal = null; S.idleT = 99; S.lashCd = 99; S.phase = 1; me.hp = D.ST.hp; me.inv = 0; me.chill = 0; S.realAt = null; }; home();
  const blowsOf = (secs, each, dt) => { const out = []; let last = g.dmgTaken; step(secs, t => { const r = each ? each(t) : null; if (g.dmgTaken > last + 1e-6) { out.push(+(g.dmgTaken - last).toFixed(2)); last = g.dmgTaken; } me.inv = 0; if (me.hp < D.ST.hp * 0.5) me.hp = D.ST.hp; return r; }, dt); return out; };
  const noDebt = () => { S.debt = 0; S.seal = null; };`;
const want = k => !ONLY || ONLY.split(',').includes(k);
const near = (a, b, e) => Math.abs(a - b) < (e == null ? 0.6 : e);
(async () => {
  let T;
  if (want('powers')) { T = await fresh();
  try {
    ok(T.info.door === 'open' && T.info.phase === 'boss', 'the real gate: its puzzle solved, its door opened, the pet through it: the door seals and the fight begins', T.info);
    const base = await T.ev(`return { TU: SB.TUNE, fk: S.fk, fd: S.fd, hp: S.m.maxhp, bar: S.barHP, dmg: S.m.dmg, max: D.ST.hp, mode: S.mode, boss: g.boss === S.m, still: S.m.still, home: S.home, objs: S.objs.length };`);
    const unit = base.dmg * base.fd, TU = base.TU; delete base.TU;
    ok(base.hp === TU.hp * base.fk && base.bar === TU.hp * base.fk / TU.bars && base.dmg === TU.dmg && base.boss && base.mode === 'fight' && base.still && base.objs === 3, 'the boss is up after its intro, its health and blows from TUNE, its three objects on the stage', base);
    // ---- Sevenfold Perdition: a still pet struck by every stinger (pdK) and a stack each; one that steps off each mark after it locks: nothing; a roll: nothing
    let r = await T.ev(`${RESET} const m = S.m, px = m.x + 0.4, py = m.y + 4.8; hold(px, py); const A = SB.test.force('perd'); const d0 = S.stat.stacks; const blows = blowsOf(A.end + 0.3, () => { hold(px, py); noDebt(); }); return { n: A.n, blows, stacks: S.stat.stacks - d0 };`);
    ok(r.n === TU.pdN[0] && r.blows.filter(b => near(b, unit * TU.pdK)).length === r.n && r.stacks === r.n, 'Perdition: every stinger strikes a still pet for pdK x unit and lays a stack of Venom Debt', r);
    r = await T.ev(`${RESET} const m = S.m; let px = m.x + 0.4, py = m.y + 4.8; hold(px, py); const A = SB.test.force('perd'); const h0 = g.dmgTaken; step(A.end + 0.3, () => { const k = S.marks.find(q => !q.done && q.t >= q.tell - q.lock && !q.moved); if (k) { k.moved = 1; px = k.x + (px > m.x ? -1 : 1) * (k.R + 1.0); } hold(px, py); me.inv = 0; noDebt(); }); return { took: g.dmgTaken - h0, made: S.stat.perd };`);
    ok(r.took === 0, 'Perdition: stepping off each mark once it locks takes nothing', r);
    r = await T.ev(`${RESET} const m = S.m, px = m.x + 0.4, py = m.y + 4.8; hold(px, py); const A = SB.test.force('perd'); const h0 = g.dmgTaken; step(A.end + 0.3, () => { hold(px, py); me.dodge = { t: 0.05, dur: 0.3, vx: 0, vy: 0, perf: false }; }); me.dodge = null; return { took: g.dmgTaken - h0, debt: S.debt };`);
    ok(r.took === 0 && r.debt === 0, 'Perdition: rolling through the strikes takes nothing and no debt', r);
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m, px = m.x + 0.4, py = m.y + 4.8; hold(px, py); const A = SB.test.force('perd'); const f0 = S.stat.finHit; const blows = blowsOf(A.end + 0.3, () => { hold(px, py); noDebt(); }); return { n: A.n, blows, fin: S.stat.finHit - f0 };`);
    ok(r.n === TU.pdN[2] && r.fin === 1 && r.blows.filter(b => near(b, unit * TU.finK)).length === 1, 'Perdition (phase III): pdN[2] strikes, then all seven impale the pet\'s place (finK x unit)', r);
    // ---- the Tail Lash: a pet crowding it; out of the arc: nothing
    r = await T.ev(`${RESET} const m = S.m, px = m.x + 0.3, py = m.y + m.r + 1.2; hold(px, py); SB.test.hold(false); S.lashCd = 0; S.idleT = 99; const l0 = S.stat.lash; const blows = blowsOf(1.2, () => { hold(px, py); noDebt(); }); SB.test.hold(true); return { lash: S.stat.lash - l0, blows };`);
    ok(r.lash === 1 && r.blows.length === 1 && near(r.blows[0], unit * TU.lashK), 'Tail Lash: a pet crowding it is lashed for lashK x unit (a glint across the arc first)', r);
    r = await T.ev(`${RESET} const m = S.m; hold(m.x + 0.3, m.y + m.r + 1.2); const A = SB.test.force('lash'); const h0 = g.dmgTaken; step(A.tell - 0.15, () => hold(m.x + 0.3, m.y + m.r + 1.2)); const bx = m.x - Math.cos(A.a) * (m.r + 2.5), by = m.y - Math.sin(A.a) * (m.r + 2.5); step(0.8, () => { hold(bx, by); me.inv = 0; }); return { took: g.dmgTaken - h0 };`);
    ok(r.took === 0, 'Tail Lash: stepping out of its arc takes nothing', r);
    // ---- Scarlet Rupture: in the open its rings strike (ruK, more for debt); in a spine's lee nothing; the eruption (phase III)
    r = await T.ev(`${RESET} const m = S.m; const A = SB.test.force('rupt'); const nS = S.spines.length; let best = null; for (let i = 0; i < 64 && !best; i++) { const an = i / 64 * 6.283, x = m.x + Math.cos(an) * 4.5, y = m.y + Math.sin(an) * 4.5; if (SB.test.AR && !SB.test.S.spines.some(q => Math.hypot(q.x - x, q.y - y) < 3)) best = { x, y }; }
      hold(best.x, best.y); S.debt = 3; const blows = blowsOf(A.dur, () => { hold(best.x, best.y); S.debt = 3; }); return { nS, pillars: SB.test.AR.pillars.length, blows, n: A.n, hit: S.stat.ruptHit };`);
    r.blows = r.blows.filter(b => b > 2); ok(r.nS + r.pillars >= 4 && r.nS >= 2 && r.blows.length === r.n && near(r.blows[0], unit * TU.ruK * (1 + TU.ruDebtK * 3), 1), 'Rupture: crystal spines rise (with the arena\'s columns, four covers at least); its rings strike a pet in the open for ruK x unit, harder for each stack it carries', r);
    r = await T.ev(`${RESET} S.phase = 2; const m = S.m; const A = SB.test.force('rupt'); const sp = S.spines[0], dx = sp.x - m.x, dy = sp.y - m.y, d = Math.hypot(dx, dy), px = sp.x + dx / d * 1.2, py = sp.y + dy / d * 1.2; hold(px, py); const c0 = S.stat.ruptCover;
      const blows = blowsOf(A.dur, () => { hold(px, py); noDebt(); }); S.phase = 1; return { blows, cover: S.stat.ruptCover - c0, n: A.n };`);
    ok(r.blows.length === 0 && r.cover === r.n && r.n === TU.ruN[1], 'Rupture: in a spine\'s lee its rings pass (every ring, phase II: two)', r);
    r = await T.ev(`${RESET} const m = S.m; const A = SB.test.force('rupt'); const sp = S.spines[0]; hold(sp.x + 0.05, sp.y); step(0.5, () => { me.inv = 0; }); const d = Math.hypot(me.x - sp.x, me.y - sp.y); return { d, r: sp.r };`);
    ok(r.d >= r.r, 'Rupture: a spine is an obstacle: the pet is pushed out of it', r);
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m; const A = SB.test.force('rupt'); const sp = S.spines[0], dx = sp.x - m.x, dy = sp.y - m.y, d = Math.hypot(dx, dy); let px = sp.x + dx / d * 1.2, py = sp.y + dy / d * 1.2; const e0 = S.stat.eruptHit;
      const blows = blowsOf(A.dur, () => { hold(px, py); noDebt(); }); S.phase = 1; return { blows, erupt: S.stat.eruptHit - e0, made: S.stat.erupt };`);
    ok(r.erupt === 1 && r.blows.length === 1 && near(r.blows[0], unit * TU.erK), 'Rupture (phase III): sheltered from the rings, the eruption under a pet that stays strikes it (erK x unit)', r);
    // ---- Crimson Labyrinth: threads (one a stinger), a touch binds (webK, a stack, a slow); a gap passes; the pull
    r = await T.ev(`${RESET} S.phase = 2; const m = S.m; hold(m.x + 0.5, m.y + 5); const A = SB.test.force('lab'); step(A.cast + 0.2, () => hold(m.x + 0.5, m.y + 5)); const W = S.web; W.spin = 0;
      const q = W.threads[0], ux = Math.cos(q.a), uy = Math.sin(q.a), al = (q.g1 + q.len) / 2, px = W.x + ux * al - uy * 1.2, py = W.y + uy * al + ux * 1.2; hold(px, py); step(1.0, () => { hold(px, py); noDebt(); me.inv = 0; me.chill = 0; }); const d0 = S.stat.stacks, w0 = S.stat.webHit;
      const qx = W.x + ux * al + uy * 1.2, qy = W.y + uy * al - ux * 1.2; const blows = []; let last = g.dmgTaken, t = 0; while (t < 0.6) { const u = Math.min(1, t / 0.4); me.x = px + (qx - px) * u; me.y = py + (qy - py) * u; U.update(1 / 30); t += 1 / 30; if (g.dmgTaken > last) { blows.push(+(g.dmgTaken - last).toFixed(2)); last = g.dmgTaken; } }
      const chill = me.chill; return { n: W.threads.length, blows, stacks: S.stat.stacks - d0, hit: S.stat.webHit - w0, chill };`);
    ok(r.n === 7 && r.hit === 1 && r.blows.length >= 1 && near(r.blows[0], unit * TU.webK) && r.stacks === 1 && r.chill > 0, 'Labyrinth: seven threads; walking through one binds (webK x unit, a stack, a slow)', r);
    r = await T.ev(`const noDebt = () => { S.debt = 0; S.seal = null; }; const W = S.web; me.chill = 0; step(1.0, () => hold(me.x, me.y)); const q = W.threads[1], ux = Math.cos(q.a), uy = Math.sin(q.a), al = (q.g0 + q.g1) / 2, px = W.x + ux * al - uy * 1.2, py = W.y + uy * al + ux * 1.2, qx = W.x + ux * al + uy * 1.2, qy = W.y + uy * al - ux * 1.2; hold(px, py); step(1.0, () => { hold(px, py); noDebt(); me.inv = 0; });
      const h0 = g.dmgTaken, w0 = S.stat.webHit; let t = 0; while (t < 0.6) { const u = Math.min(1, t / 0.4); me.x = px + (qx - px) * u; me.y = py + (qy - py) * u; me.inv = 0; U.update(1 / 30); t += 1 / 30; } return { took: g.dmgTaken - h0, hit: S.stat.webHit - w0, gap: +(q.g1 - q.g0).toFixed(2) };`);
    ok(r.took === 0 && r.hit === 0 && r.gap >= 1.2, 'Labyrinth: slipping through a thread\'s dark gap passes', r);
    r = await T.ev(`const noDebt = () => { S.debt = 0; S.seal = null; }; const W = S.web, q = W.threads[2]; const k0 = S.stat.knots; for (let i = 0; i < 40 && !q.cut; i++) { D.hitMon(q.knot.m, 60, { noCrit: true }); step(0.05); } const cut = q.cut; const ux = Math.cos(q.a), uy = Math.sin(q.a), al = (q.g1 + q.len) / 2, px = W.x + ux * al - uy * 1.2, py = W.y + uy * al + ux * 1.2, qx = W.x + ux * al + uy * 1.2, qy = W.y + uy * al - ux * 1.2; hold(px, py); step(1.0, () => { hold(px, py); noDebt(); me.inv = 0; });
      const h0 = g.dmgTaken; let t = 0; while (t < 0.6) { const u = Math.min(1, t / 0.4); me.x = px + (qx - px) * u; me.y = py + (qy - py) * u; me.inv = 0; U.update(1 / 30); t += 1 / 30; } return { cut, knots: S.stat.knots - k0, took: g.dmgTaken - h0, parts: S.parts.length };`);
    ok(r.cut && r.knots === 1 && r.took === 0, 'Labyrinth: striking a thread\'s amber knot snaps it: the way is open', r);
    r = await T.ev(`const noDebt = () => { S.debt = 0; S.seal = null; }; const W = S.web; W.spin = 0; W.t = 1; let px = W.x + 6, py = W.y; const q = W.threads.find(z => !z.cut); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; const x = W.x + Math.cos(a) * 5, y = W.y + Math.sin(a) * 5; if (SB.test.S.web.threads.every(z => z.cut || Math.abs(Math.sin(a - z.a)) * 5 > 1.2 || Math.cos(a - z.a) < 0)) { px = x; py = y; break; } }
      me.x = px; me.y = py; me.vx = me.vy = 0; const d0 = Math.hypot(me.x - W.x, me.y - W.y); step(1.5, () => { me.inv = 0; noDebt(); }); const d1 = Math.hypot(me.x - W.x, me.y - W.y); S.phase = 1; return { d0, d1, pull: TU.webPull[1] };`);
    ok(r.d0 - r.d1 > 0.5 && r.d0 - r.d1 < 1.2, 'Labyrinth: the web draws the pet toward its heart (webPull tiles a second)', r);
    // ---- Eclipse Molt: the shells and the real one; a shell struck cracks and bursts; the real one struck: found, exposed; none found: the ambush
    r = await T.ev(`${RESET} S.phase = 2; const m = S.m; hold(m.x + 0.4, m.y + 4.6); S.realAt = 0; const A = SB.test.force('molt'); step(1.3, () => hold(me.x, me.y)); const M = S.molt; const nS = M.shells.length, hunt = M.hunt, under = m.under, onReal = Math.hypot(m.x - M.real.x, m.y - M.real.y) < 0.01;
      const s = M.shells[0]; hold(s.x + TU.mtR - 0.6, s.y); const b0 = S.stat.shellHit; D.hitMon(s.part.m, 40, { noCrit: true }); const blows = blowsOf(TU.mtCrack + 0.3, () => { hold(s.x + TU.mtR - 0.6, s.y); noDebt(); }); const burst = s.done;
      hold(m.x + 0.5, m.y + 2.6); D.hitMon(m, 40, { noCrit: true }); step(0.1); return { nS, hunt, under, onReal, blows, burst, shellHit: S.stat.shellHit - b0, found: S.stat.moltFound, expose: !!S.expose, molt: !!S.molt, parts: S.parts.length };`);
    ok(r.nS === TU.mtN[1] && r.hunt && !r.under && r.onReal, 'Molt (phase II): two shells and the real one rise round the pet', r);
    ok(r.burst && r.shellHit === 1 && r.blows.length === 1 && near(r.blows[0], unit * TU.mtK), 'Molt: a shell struck cracks and bursts (mtK x unit round it)', r);
    ok(r.found === 1 && r.expose && !r.molt && r.parts === 0, 'Molt: the real one struck staggers out of the molt, EXPOSED; its shells crumble', r);
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m; hold(m.x + 0.4, m.y + 4.6); const A = SB.test.force('molt'); step(1.3, () => hold(me.x, me.y)); const nS = S.molt.shells.length; const px = me.x, py = me.y; const a0 = S.stat.ambushHit; const blows = blowsOf(TU.mtHunt[2] + 1.5, () => { hold(px, py); noDebt(); }); return { nS, blows, amb: S.stat.ambushHit - a0, molt: !!S.molt };`);
    ok(r.nS === TU.mtN[2] && r.amb === 1 && r.blows.some(b => near(b, unit * TU.mtAmbK)) && !r.molt, 'Molt (phase III): three shells; found by no one, it strikes from behind a pet that stays (mtAmbK x unit)', r);
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m; hold(m.x + 0.4, m.y + 4.6); const A = SB.test.force('molt'); step(1.3, () => hold(me.x, me.y)); let px = me.x, py = me.y; const a0 = S.stat.ambushHit; const h0 = g.dmgTaken;
      step(TU.mtHunt[2] + 1.5, () => { const M = S.molt; if (M && M.amb && !M.amb.done && !M.moved) { M.moved = 1; const sh = M.shells.map(s => Math.hypot(s.x - M.amb.x, s.y - M.amb.y)); px = M.amb.x + (M.amb.x > SB.test.AR.cx ? -1 : 1) * (TU.mtAmbR + 1.2); } hold(px, py); me.inv = 0; noDebt(); });
      return { amb: S.stat.ambushHit - a0, made: S.stat.ambush };`);
    ok(r.amb === 0 && r.made >= 1, 'Molt: stepping off the ambush\'s violet glint takes nothing', r);
    // ---- the phase-break roar: a gapped ring of blades
    r = await T.ev(`${RESET} const m = S.m; hold(m.x, m.y + 5); const A = SB.test.start('roar'); step(0.5); const w = S.waves.find(q => q.tag === 'roar'); let a = 0; for (let i = 0; i < 64; i++) { const an = i / 64 * 6.283; if (w.gaps.every(q => Math.abs(((an - q.a + 9.42) % 6.283) - 3.1416) > q.w / 2 + 0.25) && Math.sin(an) > 0.2) { a = an; break; } }
      const px = m.x + Math.cos(a) * 5, py = m.y + Math.sin(a) * 5; const blows = blowsOf(1.5, () => { hold(px, py); noDebt(); }); let b = 0; const g0 = w.gaps[0]; S.acts.length = 0; return { blows, n: S.stat.roarHit, gaps: w.gaps.length };`);
    ok(r.blows.length === 1 && near(r.blows[0], unit * TU.roarK) && r.gaps === TU.roarGapN, 'the roar: its ring strikes a pet out of its gaps for roarK x unit', r);
    r = await T.ev(`${RESET} S.gapOff = 0; const m = S.m; const A = SB.test.start('roar'); const a = 0, px = m.x + Math.cos(a) * 5, py = m.y + Math.sin(a) * 5; hold(px, py); const h0 = g.dmgTaken; step(2, () => { hold(px, py); me.inv = 0; }); S.gapOff = null; S.acts.length = 0; return { took: g.dmgTaken - h0 };`);
    ok(r.took === 0, 'the roar: standing in a gap, it passes', r);
  } catch (e) { ok(false, 'powers threw', String(e && e.stack || e).slice(0, 600)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- the parts: the pinned stinger (breaks for good, one fewer strike after), the crystal
  if (want('parts')) { T = await fresh();
  try {
    const TU = await T.ev(`return SB.TUNE;`);
    let r = await T.ev(`${RESET} const m = S.m, px = m.x + 1.8, py = m.y + 4.6; hold(px, py); const A = SB.test.force('perd'); step(A.end + 0.2, () => { hold(px, py); noDebt(); }); const PN = S.pin; const inMons = PN && D.mons.includes(PN.part.m); const j = PN && PN.j; const hp0 = SB.test.realHp();
      let hits = 0; while (S.pin && hits < 60) { D.hitMon(PN.part.m, 60, { noCrit: true }); hits++; step(0.05, () => { hold(px, py); noDebt(); }); } const hp1 = SB.test.realHp();
      return { pinned: !!PN, inMons, j, first: SB.test.BREAK[0], broke: S.stat.broke, broken: S.tails[j].broken, expose: !!S.expose, n: 7 - S.brokenN, lost: hp0 - hp1, hits, inMons2: D.mons.includes(PN.part.m), unf: S.B.unf };`);
    ok(r.pinned && r.inMons && r.j === r.first, 'Perdition: its last blade is pinned in the floor (the outermost tail first), a part the pet can strike', r);
    ok(r.broke === 1 && r.broken && r.expose && r.n === 6 && !r.inMons2, 'the pinned stinger struck to nothing breaks for good: one stinger fewer, Asmodeus EXPOSED', r);
    ok(r.lost >= TU.hp * (await T.ev(`return S.fk;`)) * TU.stingBreak + TU.stingHP * (await T.ev(`return S.fk;`)) * TU.stingFwd * 0.9, 'a broken stinger wounds it (stingBreak of its health, and a share of every blow on the blade)', r);
    r = await T.ev(`${RESET} const m = S.m, px = m.x + 1.8, py = m.y + 4.6; hold(px, py); const A = SB.test.force('perd'); return { n: A.n, pinJ: A.pinJ, want: SB.test.BREAK[1] };`);
    ok(r.n === TU.pdN[0] - 1 && r.pinJ === r.want, 'one stinger fewer in every Perdition after; the next tail in turn is pinned next', r);
    r = await T.ev(`${RESET} const m = S.m, px = m.x + 1.8, py = m.y + 4.6; hold(px, py); const A = SB.test.force('perd'); step(A.end + 0.2, () => { hold(px, py); noDebt(); }); const PN = S.pin; D.hitMon(PN.part.m, 300, { noCrit: true }); step(TU.pinT + 0.3, () => { hold(px, py); noDebt(); });
      return { pin: !!S.pin, parts: S.parts.length, hp: S.tails[PN.j].hp, broken: S.tails[PN.j].broken, acts: S.acts.length };`);
    ok(!r.pin && r.parts === 0 && !r.broken && r.hp < TU.stingHP * (await T.ev(`return S.fk;`)) && r.hp > 0 && r.acts === 0, 'left alone, the pinned stinger pulls free after pinT; the damage on it is kept for the next time', r);
    r = await T.ev(`${RESET} S.phase = 2; const m = S.m; hold(m.x + 0.5, m.y + 4.0); const A = SB.test.force('rupt'); const C = S.crystal, inMons = D.mons.includes(C.part.m); const hp0 = SB.test.realHp(); let hits = 0; while (S.crystal && hits < 80) { D.hitMon(C.part.m, 60, { noCrit: true }); hits++; step(0.05, () => noDebt()); }
      const hp1 = SB.test.realHp(); const blows = blowsOf(3, () => noDebt()); S.phase = 1; return { inMons, hits, broke: S.stat.ruptBroke, expose: !!S.expose, lost: hp0 - hp1, blows, t: +A.t.toFixed(2), shat: A.shat };`);
    ok(r.inMons && r.broke === 1 && r.expose && r.blows.length === 0 && r.hits * 0.05 < r.shat && r.lost >= TU.hp * (await T.ev(`return S.fk;`)) * TU.ruBreak, 'Rupture: the crystal struck to nothing before it is grown shatters inward: a heavy wound, EXPOSED, no rings', r);
  } catch (e) { ok(false, 'parts threw', String(e && e.stack || e).slice(0, 600)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- Venom Debt on the pet: its ticks, its fading, the seal, the starlight, the bared Crucible
  if (want('debt')) { T = await fresh();
  try {
    const TU = await T.ev(`return SB.TUNE;`), unit = TU.dmg * (await T.ev(`return S.fd;`));
    let r = await T.ev(`${RESET} hold(S.m.x + 2, S.m.y + 5); SB.test.addDebt(3); const blows = blowsOf(TU.debtTick * 2 + 0.05, () => hold(me.x, me.y)); return { blows, debt: S.debt };`);
    ok(r.blows.length === 2 && r.blows.every(b => near(b, unit * TU.debtK * 3, 0.05)) && r.debt === 3, 'Venom Debt: each stack ticks a little venom (debtK x unit a stack, every debtTick)', r);
    r = await T.ev(`const inv = []; step(TU.debtTick + 0.05, () => { inv.push(me.inv); hold(me.x, me.y); }); return { maxInv: Math.max(...inv) };`);
    ok(r.maxInv < 0.05, 'Venom Debt: its ticks never shield the pet from the next blow (no invulnerability after a tick)', r);
    r = await T.ev(`${RESET} hold(S.m.x + 2, S.m.y + 5); SB.test.addDebt(2); step(TU.debtFade + 0.2, () => { hold(me.x, me.y); me.hp = D.ST.hp; }); const a = S.debt; step(TU.debtFade, () => { hold(me.x, me.y); me.hp = D.ST.hp; }); return { a, b: S.debt };`);
    ok(r.a === 1 && r.b === 0, 'Venom Debt: a stack fades after debtFade s without a new one', r);
    r = await T.ev(`${RESET} hold(S.m.x + 2, S.m.y + 5); SB.test.addDebt(7); const seal = !!S.seal, pools = S.pools.filter(p => !p.used).length, p = S.pools[0]; const dp = p ? Math.hypot(p.x - me.x, p.y - me.y) : -1, dm = p ? Math.hypot(p.x - S.m.x, p.y - S.m.y) : -1;
      const blows = blowsOf(TU.sealT + 0.2, () => hold(me.x, me.y)); return { seal, pools, dp, dm, blows, debt: S.debt, hit: S.stat.sealHit };`);
    ok(r.seal && r.pools === 1 && r.dp > 2 && r.dp < 8.5 && r.dm > 3, 'the seal ripens at seven stacks: a pool of Vigil Starlight wells up within reach, away from Asmodeus', r);
    ok(r.hit === 1 && r.blows.some(b => near(b, unit * TU.sealK)) && r.debt === TU.sealLeft, 'left to ripen, the seal bursts (sealK x unit) and leaves a brand of sealLeft stacks', r);
    r = await T.ev(`${RESET} hold(S.m.x + 2, S.m.y + 5); SB.test.addDebt(7); const p = S.pools.find(q => !q.used); const h0 = g.dmgTaken, s0 = S.stat.sealHit; step(0.3, () => hold(me.x, me.y)); step(TU.poolStand + 0.15, () => hold(p.x, p.y)); const d1 = S.debt; step(TU.sealT, () => hold(p.x, p.y)); return { d1, seal: !!S.seal, sealHit: S.stat.sealHit - s0, used: p.used, cleanse: S.stat.poolUse };`);
    ok(r.d1 === 0 && !r.seal && r.sealHit === 0 && r.used, 'standing in the starlight burns every stack away and breaks the seal (no burst)', r);
    r = await T.ev(`${RESET} hold(S.m.x + 2, S.m.y + 5); SB.test.addDebt(TU.poolAt - 1); step(0.2, () => hold(me.x, me.y)); const a = S.pools.length; SB.test.addDebt(1); S.poolCd = 0; step(0.2, () => hold(me.x, me.y)); return { a, b: S.pools.filter(p => !p.used).length };`);
    ok(r.a === 0 && r.b === 1, 'Vigil Starlight wells up once the pet carries poolAt stacks', r);
    r = await T.ev(`${RESET} const m = S.m; SB.test.addDebt(5); SB.test.force('expose'); S.debt = 5; const yaw = S.B.yaw; hold(m.x + Math.cos(yaw) * 3, m.y + Math.sin(yaw) * 3); const h0 = m.hp; D.hitMon(m, 100, { noCrit: true }); const dHit = h0 - m.hp; step(0.05); D.hitMon(m, 100, { noCrit: true }); const d1 = S.debt;
      hold(m.x - Math.cos(yaw) * 3, m.y - Math.sin(yaw) * 3); D.hitMon(m, 100, { noCrit: true }); step(0.05); const d2 = S.debt; step(TU.exposeT + 0.2); const h1 = m.hp; D.hitMon(m, 100, { noCrit: true }); const dPlain = h1 - m.hp; return { d1, d2, dHit, dPlain, expose: !!S.expose };`);
    ok(r.d1 === 3 && r.d2 === 3, 'EXPOSED: every blow on the bared Crucible from the front burns a stack away; from behind none', r);
    ok(near(r.dHit / r.dPlain, 1.5, 0.05) && !r.expose, 'EXPOSED: it takes x1.5 (the engine\'s stunned boss); it ends on time', r);
  } catch (e) { ok(false, 'debt threw', String(e && e.stack || e).slice(0, 600)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- phases, The Seventh Sin and the fall: the gate completes and the Anima is unlocked; the clean-up after the fall
  if (want('phases')) { T = await fresh(); let TU0 = null;
  try {
    TU0 = await T.ev(`return SB.TUNE;`);
    let r = await T.ev(`const m = S.m, out = {}; SB.test.hold(false); hold(m.x, m.y + 5); const refill = () => { me.hp = D.ST.hp; me.inv = 0; S.debt = 0; S.seal = null; }; const bars = () => Math.ceil(SB.test.realHp() / S.barHP - 1e-9);
      out.bars0 = bars(); m.hp = m.maxhp * 0.67; step(0.2, refill); D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1, refill); out.ph2 = S.phase; out.roar2 = S.acts.length && S.acts[0].kind; let web2 = false; step(6.5, () => { refill(); hold(m.x, m.y + 5); if (S.web) web2 = true; }); out.web2 = web2;
      step(6, refill); SB.test.abortActs(true); if (S.expose) SB.test.S.expose.t = 99; step(0.6, refill); m.hp = m.maxhp * 0.34; D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1, refill); out.ph3 = S.phase; let web3 = false, molt3 = false; step(10, () => { refill(); hold(m.x, m.y + 5); if (S.web) web3 = true; if (S.molt) molt3 = true; }); out.web3 = web3; out.molt3 = molt3;
      return out;`);
    ok(r.bars0 === TU0.bars && r.ph2 === 2 && r.roar2 === 'roar' && r.web2 && r.ph3 === 3 && r.web3 && r.molt3, 'phases: II at 66% (a roar, then a Labyrinth), III at 33% (a roar, a Labyrinth, an Eclipse Molt)', r);
    r = await T.ev(`const m = S.m, out = {}; SB.test.hold(true); SB.test.abortActs(true); if (S.expose) { S.expose = null; m.stunT = 0; m.act = 'fight'; } const RS = P.riftState(), gate = D.F.rift.id, an = gate === 'dunes' ? 'scorpio' : 'aries'; out.before = { gate: RS.gates[gate] || 0, anima: (P.st.animas.have || {})[an] || 0 };
      SB.test.breakStinger(SB.test.BREAK[0]); SB.test.breakStinger(SB.test.BREAK[1]); if (S.expose) { S.expose = null; m.stunT = 0; m.act = 'fight'; }
      m.hp = m.maxhp * 0.06; D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.sin = !!S.sin; out.pad = !!S.pad; out.refs = S.sin ? S.sin.refs.length : 0; const h0 = SB.test.realHp(); D.hitMon(m, 5000, { noCrit: true }); step(0.05); out.harm = h0 - SB.test.realHp();
      out.inside = S.sin.refs.every(q => SB.test.AR && Math.pow(Math.abs((q.x - SB.test.AR.cx) / SB.test.AR.rx), SB.test.AR.n) + Math.pow(Math.abs((q.y - SB.test.AR.cy) / SB.test.AR.ry), SB.test.AR.n) < 1);
      const UT = ASMODEUS_MOVES.UT; let marks = 0; const seen = new Set(); let a = 0; const s0 = S.stat.sinHit; step(UT.det - S.sin.t - 0.4, () => { for (const k of S.marks) if (!seen.has(k) && (k.tag === 'sin' || k.tag === 'sin7')) { seen.add(k); marks++; } a += 0.12; hold(m.x + Math.cos(a) * 4.8, m.y + 3.4 + Math.sin(a) * 1.4); me.hp = D.ST.hp; me.inv = 0; S.debt = 0; });
      out.marks = marks; out.sinHit = S.stat.sinHit - s0; const q = S.sin.refs[0]; step(0.3, () => hold(q.x, q.y)); const H0 = g.dmgTaken; step(3, () => { hold(q.x, q.y); return S.stat.sinTs > 0; }); step(0.1, () => hold(q.x, q.y)); out.tookSafe = g.dmgTaken - H0; out.safe = S.stat.sinSafe;
      out.objs0 = (D.RIFT && D.RIFT.objs || []).filter(o => /^sx/.test(o.kind)).length; const S0 = S; step(1.0); out.mode = S0.mode; out.cine = g.cineT > 0; step(4.0); out.won = g.won; out.mode2 = S0.mode; out.cine2 = g.cineT;
      out.objs1 = (D.RIFT && D.RIFT.objs || []).filter(o => /^sx/.test(o.kind)).length; out.inst = !!S0.inst; out.active = SB.active(); out.dead = m.dead; out.guard = !!m.guardFn; out.parts = D.mons.filter(q => q.fobj && !q.dead).length; out.chill = me.chill;
      let n = 0; while (P.arc.state === 'play' && n++ < 600) U.update(1 / 30); out.state = P.arc.state; out.after = { gate: RS.gates[gate] || 0, anima: (P.st.animas.have || {})[an] || 0 }; out.gate = gate; return out;`);
    ok(r.sin && r.pad && r.harm < 1 && r.refs >= 4 && r.inside, 'The Seventh Sin at 5%: the seals light inside the arena; it cannot be harmed through it', r);
    ok(r.marks === 7 - 2 && r.sinHit === 0, 'The Seventh Sin: one mark for each stinger left (two broken: five), each on the pet\'s place; a pet that keeps moving takes none', r);
    ok(r.tookSafe === 0 && r.safe === 1, 'The Seventh Sin: in a lit seal with no debt, the Testament passes', r);
    ok(r.mode === 'dead' && r.cine && r.won && r.mode2 === 'over' && r.cine2 === 0 && r.objs1 === 0 && !r.inst && !r.active && r.dead && !r.guard && r.parts === 0, 'the fall: the Last Whisper, then winStage; every hold, object, part and effect given back', r);
    ok(!r.before.gate && !r.before.anima && r.state === 'end' && r.after.gate === 1 && r.after.anima >= 1, `the win completes the gate and unlocks its Anima (${r.gate === 'dunes' ? 'scorpio' : 'the stand-in altar: aries'})`, r);
  } catch (e) { ok(false, 'phases threw', String(e && e.stack || e).slice(0, 600)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close();
  // the Testament's blows: outside a seal (from full: never lethal; with debt: more), in one with debt (only the debt)
  const tsCase = async (inSeal, debt, hpK) => { const T2 = await fresh(); try { return await T2.ev(`${RESET} S.phase = 3; const m = S.m; hold(m.x + 3, m.y + 4); const J = SB.test.force('sin'), UT = ASMODEUS_MOVES.UT; let a = 0;
      step(UT.det - 0.5, () => { a += 0.12; hold(m.x + Math.cos(a) * 4.8, m.y + 3.4 + Math.sin(a) * 1.4); me.hp = D.ST.hp; me.inv = 0; S.debt = 0; S.seal = null; });
      let best = J.refs[0]; if (!arg.inSeal) { let bd = -1; for (let i = 0; i < 48; i++) { const an = i / 48 * 6.283, x = SB.test.AR.cx + Math.cos(an) * 2.5, y = SB.test.AR.cy + 2 + Math.sin(an) * 1.5; const d = Math.min(...J.refs.map(p => Math.hypot(p.x - x, p.y - y))); if (d > bd && Math.hypot(x - m.x, y - m.y) > 2) { bd = d; best = { x, y }; } } }
      hold(best.x, best.y); step(0.1, () => hold(best.x, best.y)); S.debt = arg.debt; S.seal = null; const ts0 = S.stat.sinTs; step(3, () => { if (S.sin && S.sin.t < UT.det - 0.15) { hold(best.x, best.y); me.hp = D.ST.hp; S.debt = 0; return; } if (!arg.armed) { arg.armed = 1; S.debt = arg.debt; me.hp = D.ST.hp * arg.hpK; } hold(best.x, best.y); me.inv = 0; return S.stat.sinTs > ts0; }); /* (the strikes' hit-stops hold its clock back: stepped until the Testament) */ const H0 = 0; return { took: +(D.ST.hp * arg.hpK - Math.max(0, me.hp)).toFixed(1), max: D.ST.hp, hp: me.hp, dead: me.dead, ts: S.stat.sinTs };`, { inSeal, debt, hpK }); } finally { await T2.browser.close(); } };
  { const TU = TU0; let a = await tsCase(false, 0, 1); ok(!a.dead && a.hp >= 1 && near(a.took, Math.min(a.max * TU.tsK, a.max - 1), 1.5), 'the Testament outside a seal, no debt, from full: tsK of its health, never lethal', a);
    let b = await tsCase(false, 7, 1); ok(!b.dead && b.took > a.took + a.max * TU.tsDebt * 5, 'the Testament outside a seal with seven stacks: far heavier (tsDebt a stack), still never lethal from full', b);
    let c = await tsCase(true, 5, 1); ok(near(c.took, c.max * TU.tsIn * 5, 1.5) && !c.dead, 'the Testament in a seal with five stacks: only the debt detonates (tsIn a stack)', c);
    let d = await tsCase(false, 7, 0.5); ok(d.dead, 'the Testament outside a seal with debt, from half health: it can knock the pet out', d); }
  }
  // ---- the pet's death mid-power, then the stage's end mid-power
  if (want('cleanup')) { T = await fresh();
  try {
    let r = await T.ev(`${RESET} S.phase = 2; const m = S.m; hold(m.x + 0.5, m.y + 4.6); SB.test.force('lab'); step(1.6, () => hold(me.x, me.y)); const A = SB.test.start('perd'); step(A.end + 0.2, () => { hold(me.x, me.y); me.hp = D.ST.hp; }); SB.test.addDebt(4); const busy = S.acts.length, pin = !!S.pin, web = !!S.web;
      me.hp = 1; me.inv = 0; step(2, () => { if (!me.dead) { hold(m.x + 0.5, m.y + 4.6); me.inv = 0; } }); return { busy, pin, web, dead: me.dead, acts: S.acts.length, marks: S.marks.filter(k => !k.done).length, debt: S.debt, pinAfter: !!S.pin, active: SB.active() };`);
    ok(r.busy > 0 && r.pin && r.web && r.dead && r.acts === 0 && r.marks === 0 && r.debt === 0 && !r.pinAfter, 'the pet\'s death: its powers called off, the pinned stinger pulled free, the debt gone with the pet', r);
  } catch (e) { ok(false, 'death threw', String(e && e.message || e)); }
  await T.browser.close();
  T = await fresh();
  try {
    const r = await T.ev(`${RESET} S.phase = 3; const m = S.m; hold(m.x + 0.5, m.y + 4.6); SB.test.force('lab'); step(1.6, () => hold(me.x, me.y)); SB.test.start('molt'); step(1.6, () => hold(me.x, me.y)); SB.test.addDebt(3); const before = SB.active(), parts = S.parts.length, gg = g, mm = m, mons = D.mons;
      P.closeArcade(true); await new Promise(r => setTimeout(r, 300)); return { before, parts, after: SB.active(), S: !!SB.test.S, boss: !!(gg.boss && !gg.boss.dead), guard: !!mm.guardFn, bar: !!mm.ownBar, under: !!mm.under, liveParts: mons.filter(q => q.fobj && !q.dead).length };`);
    ok(r.before && r.parts >= 5 && !r.after && !r.S && !r.boss && !r.guard && !r.bar && !r.under && r.liveParts === 0, 'the stage\'s end (the map closed mid-molt inside a web): the fight let go at once, its parts off the stage', r);
  } catch (e) { ok(false, 'exit threw', String(e && e.message || e)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- Asmodeus's GPU buffers: up while it is drawn, freed when it falls (the software rasteriser forced on)
  if (want('gpu')) { T = await fresh({ gl: true });
  try {
    await T.M(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const r = await T.ev(`const G = window.ASMODEUS_GL, out = { gl: G.usable(), up: G.gpuCount() }; SB.test.fall(false); step(5); out.after = G.gpuCount(); out.mode = SB.test.S ? SB.test.S.mode : null; out.won = g.won; return out;`);
    ok(r.gl && r.up > 0 && r.after === 0 && r.mode === 'over' && r.won, 'GPU: Asmodeus\'s buffers are up while it is drawn and freed when it falls (ASMODEUS_GL.release through its effect layer\'s stop)', r);
  } catch (e) { ok(false, 'gpu threw', String(e && e.message || e)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- the same scripted fight at dt 1/60 and dt 1/4
  if (want('dt')) { const res = {};
  for (const fps of [60, 4]) { T = await fresh();
    try { res[fps] = await T.ev(`${RESET} const dt = arg, m = S.m, out = {}; let px = m.x + 0.4, py = m.y + 4.8; hold(px, py); let A = SB.test.force('perd'); out.perd = blowsOf(A.end + 0.3, () => { hold(px, py); noDebt(); }, dt).length;
        home(); A = SB.test.force('rupt'); let best = null; for (let i = 0; i < 64 && !best; i++) { const an = i / 64 * 6.283, x = m.x + Math.cos(an) * 4.5, y = m.y + Math.sin(an) * 4.5; if (!S.spines.some(q => Math.hypot(q.x - x, q.y - y) < 3)) best = { x, y }; } out.rupt = blowsOf(A.dur, () => { hold(best.x, best.y); noDebt(); }, dt).length;
        home(); A = SB.test.force('rupt'); const sp = S.spines[0], dx = sp.x - m.x, dy = sp.y - m.y, d = Math.hypot(dx, dy); out.ruptCover = blowsOf(A.dur, () => { hold(sp.x + dx / d * 1.2, sp.y + dy / d * 1.2); noDebt(); }, dt).length;
        home(); SB.test.addDebt(7); out.seal = blowsOf(TU.sealT + 0.3, () => hold(me.x, me.y), dt).filter(b => b > 10).length;
        home(); S.phase = 3; const J = SB.test.force('sin'), q = J.refs[0], UT = ASMODEUS_MOVES.UT; let a = 0; step(UT.det - 0.5, () => { a += dt * 3.6; hold(m.x + Math.cos(a) * 4.8, m.y + 3.4 + Math.sin(a) * 1.4); me.hp = D.ST.hp; me.inv = 0; noDebt(); }, dt);
        const H0 = g.dmgTaken; step(4, () => { hold(q.x, q.y); return S.stat.sinTs > 0; }, dt); step(0.3, () => hold(q.x, q.y), dt); out.sin = Math.round(g.dmgTaken - H0); out.safe = S.stat.sinSafe;
        return out;`, 1 / fps); } catch (e) { res[fps] = String(e); }
    if (T.errors.length) { console.log('errors', JSON.stringify(T.errors.slice(0, 3))); fails++; process.exitCode = 1; } await T.browser.close(); }
  const a = res[60], b = res[4];
  ok(a && b && a.perd === b.perd && a.perd > 0 && a.rupt === b.rupt && a.rupt > 0 && a.ruptCover === 0 && b.ruptCover === 0 && a.seal === 1 && b.seal === 1 && a.sin === 0 && b.sin === 0 && a.safe === 1 && b.safe === 1,
    'frame-rate independence: the same blows and timing at dt 1/60 and 1/4', res); }
  console.log(fails ? `${fails} FAILED` : 'ALL OK');
})();
