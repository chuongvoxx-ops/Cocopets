// v420 CB: Abaddon's mechanics, one by one: every power fires and hits the pet for what TUNE says; a roll dodges; the Eclipse
// stores and releases; a moonlight pocket shelters from the Ninth Tide; the phases turn; the bars and the win; the clean-up
// after the defeat, the pet's death and the stage's end; the same fight at dt 1/60 and 1/4.
// usage: HTML=test-cb.html node tests/_cb-mech.js [real]   (real: on ENV's gate in 20o, the door's arena)
const L = require('./_cb-lib');
const REAL = process.argv[2] === 'real';
const ok = (c, msg, v) => { console.log((c ? 'PASS ' : 'FAIL ') + msg + (v !== undefined ? '  ' + JSON.stringify(v) : '')); if (!c) process.exitCode = 1; };
async function fresh(o) { const T = await L.open(Object.assign({ gl: false, lvl: 30, real: REAL }, o || {})); await T.start(); if (REAL) await T.ev(`step(1); return 1;`); await T.fight(); await T.ev(`CB.test.hold(true); return 1;`); return T; }
(async () => {
  let T = await fresh();
  try {
    const base = await T.ev(`return { TU: CB.TUNE, hp: S.m.maxhp, bar: S.barHP, dmg: S.m.dmg, hard: S.m.belHard, max: D.ST.hp, mode: S.mode, boss: g.boss === S.m, fiend: S.m.fiend, still: S.m.still, intro: g.bossIntro };`);
    const unit = base.dmg * base.hard, TU = base.TU; delete base.TU;
    ok(base.hp === TU.hp && base.bar === TU.hp / TU.bars && base.dmg === TU.dmg && base.hard === TU.hard && base.boss && base.mode === 'fight', 'the boss is up after its intro, its health and blows from TUNE', base);
    // ---- Crescent Reavers: the pet still on a crossing: one blow of revK; rolling: none
    let r = await T.ev(`const m = S.m; hold(m.x, m.y + 5); me.hp = D.ST.hp; const h0 = g.dmgTaken; CB.test.force('rev'); let first = null;
      step(4, () => { hold(m.x, m.y + 5); if (first == null && g.dmgTaken > h0) first = g.dmgTaken - h0; }); return { first, n: S.stat.revHit, slashes: S.stat.rev };`);
    ok(Math.abs(r.first - unit * TU.revK) < 1, 'Reavers: a slash through the still pet hits for revK x unit', r);
    r = await T.ev(`const m = S.m; hold(m.x, m.y + 5); me.hp = D.ST.hp; const h0 = g.dmgTaken, p0 = g.perfects || 0; CB.test.force('rev');
      step(4, () => { hold(m.x, m.y + 5); me.dodge = { t: 0.05, dur: 0.3, vx: 0, vy: 0, perf: false }; }); me.dodge = null; return { took: g.dmgTaken - h0, perfects: (g.perfects || 0) - p0 };`);
    ok(r.took === 0, 'Reavers: rolling through the blades takes nothing', r);
    // ---- Gravitational Tide: the field opens (no pull), then lifts and drags the pet in, ticks, and collapses in its core
    r = await T.ev(`const m = S.m; hold(m.x, m.y + 5); me.hp = D.ST.hp; CB.test.force('tide'); const f = S.fields[0]; const p0 = { x: me.x + f.R * 0.8, y: me.y }; hold(p0.x, f.y);
      const h0 = g.dmgTaken; let moved0 = 0, zMax = 0; step(f.open - 0.05, () => {}); moved0 = Math.hypot(me.x - p0.x, me.y - f.y);
      const d0 = Math.hypot(me.x - f.x, me.y - f.y); step(1.0, () => { zMax = Math.max(zMax, me.z || 0); }); const d1 = Math.hypot(me.x - f.x, me.y - f.y);
      step(4, () => { if (S.fields.length && !S.fields[0].end) { me.hp = D.ST.hp; } zMax = Math.max(zMax, me.z || 0); }); return { moved0, d0, d1, zMax, took: g.dmgTaken - h0, z: me.z, ticks: S.stat.tideHit };`);
    ok(r.moved0 < 0.01 && r.d1 < r.d0 - 1.5 && r.zMax > 0.3 && r.z === 0, 'Tide: no pull while it opens; then the pet is lifted and dragged in; set down after', r);
    ok(r.took >= unit * (TU.tideK * 2 + TU.tideEndK) - 1, 'Tide: ticks of tideK and the core\'s collapse (tideEndK) on a pet that stays', r);
    r = await T.ev(`const m = S.m; hold(m.x, m.y + 5); me.hp = D.ST.hp; CB.test.force('tide'); const f = S.fields[0]; const h0 = g.dmgTaken; step(f.open + 0.2, () => {});
      // the pet runs straight out against the pull at its walking speed
      step(3.5, t => { const dx = me.x - f.x, dy = me.y - f.y, d = Math.hypot(dx, dy) || 1; if (d < f.R + 1.5) D.moveEnt ? D.moveEnt(me, dx / d * 4.3 / 30, dy / d * 4.3 / 30) : (me.x += dx / d * 4.3 / 30, me.y += dy / d * 4.3 / 30); });
      return { out: Math.hypot(me.x - f.x, me.y - f.y), R: f.R, took: g.dmgTaken - h0 };`);
    ok(r.out > r.R, 'Tide: walking out against the pull escapes the field', r);
    // ---- Lunar Carapace: hits soak into the shell, not its health; broken: it staggers; what it soaked is stored
    r = await T.ev(`const m = S.m; hold(m.x, m.y + 6); CB.test.force('car'); step(1.2); const PD = S.pad, pool = PD ? PD.pool : 0, h0 = CB.test.realHp();
      for (let i = 0; i < 4; i++) { D.hitMon(m, pool * 0.2, { noCrit: true }); step(0.05); } const h1 = CB.test.realHp(), left = S.pad ? S.pad.left : -1, store0 = S.store;
      D.hitMon(m, pool * 0.5, { noCrit: true }); step(0.05); return { pool, h0, h1, left, h2: CB.test.realHp(), broke: S.stat.carBroke, stun: m.stunT, store: S.store, store0, pad: S.pad && S.pad.kind };`);
    ok(r.pool > 0 && Math.abs(r.h1 - r.h0) < 1 && r.left > 0 && r.broke === 1 && r.stun > 2 && r.h2 < r.h0 && r.store > 0, 'Carapace: blows soak into the shell; past its pool it breaks, it staggers, the rest gets through, the soak is stored', r);
    r = await T.ev(`const m = S.m; step(3.5); return { stun: m.stunT, act: m.act };`);
    ok(r.stun <= 0 && r.act === 'fight', 'Carapace: the stagger ends', r);
    // ---- Eclipse Requiem: hits on the seal are stored, its reach grows, the shockwave scales; backing off beyond the reach is safe
    r = await T.ev(`const m = S.m; S.store = 0; hold(m.x, m.y + 3); me.hp = D.ST.hp; const A = CB.test.force('ecl'); step(0.4); const h0 = CB.test.realHp(), R0 = CB.test.eclR();
      for (let i = 0; i < 10; i++) { D.hitMon(m, 300, { noCrit: true }); step(0.1, () => hold(m.x, m.y + 3)); } const h1 = CB.test.realHp(), R1 = CB.test.eclR(), k1 = CB.test.eclMul(), st = S.store, H0 = g.dmgTaken;
      step(A.seal, () => hold(m.x, m.y + 3)); return { h0, h1, R0, R1, k1, st, took: g.dmgTaken - H0, after: CB.test.realHp(), hits: S.stat.eclHit };`);
    ok(Math.abs(r.h1 - r.h0) < 1 && r.st >= 2999 && r.R1 > r.R0 && r.k1 > 1, 'Eclipse: blows on the seal are stored (health untouched), its reach and blow grow', r);
    ok(Math.abs(r.took - unit * TU.eclK * r.k1) < 2, 'Eclipse: the requiem hits the pet in reach for eclK x its charge', r);
    r = await T.ev(`const m = S.m; S.store = 0; me.hp = D.ST.hp; const A = CB.test.force('ecl'); const H0 = g.dmgTaken; step(A.seal + 1, () => hold(m.x, m.y + CB.TUNE.eclR0 + 1.2)); return { took: g.dmgTaken - H0 };`);
    ok(r.took === 0, 'Eclipse: unprovoked, its small requiem misses a pet that stood back', r);
    // ---- the claw sweep: a pet that stays close is punished
    r = await T.ev(`const m = S.m; me.hp = D.ST.hp; CB.test.hold(false); S.idleT = 99; S.swCd = 0; S.near = 0; const H0 = g.dmgTaken; let t1 = null; step(3, t => { hold(m.x + 1.2, m.y + 2); if (t1 == null && g.dmgTaken > H0) t1 = t; }); CB.test.hold(true); S.acts.length = 0; return { took: g.dmgTaken - H0, t1, n: S.stat.swHit };`);
    ok(Math.abs(r.took - unit * TU.swK) < 1 && r.t1 > 0.9, 'Claw sweep: after the pet lingers, a glowing tell, then swR blow', r);
    // ---- The Ninth Tide: a pocket of moonlight shelters; outside, the crushing blow (never lethal from full health)
    r = await T.ev(`const m = S.m; me.hp = D.ST.hp; const J = CB.test.force('t9'); step(CB.TUNE.t9Open + 0.1); const p = J.pockets[0]; const H0 = g.dmgTaken, h0 = CB.test.realHp(); D.hitMon(m, 5000, { noCrit: true }); step(0.05); const h1 = CB.test.realHp();
      step(CB.TUNE.t9Len, () => { if (S.t9 && S.t9.pockets[0]) hold(S.t9.pockets[0].x, S.t9.pockets[0].y); }); return { took: g.dmgTaken - H0, safe: S.stat.t9Safe, np: J.pockets.length, h0, h1, done: !S.t9, pad: S.pad };`);
    ok(r.took === 0 && r.safe >= 1 && r.np === 2 && Math.abs(r.h1 - r.h0) < 1 && r.done && !r.pad, 'Ninth Tide: two pockets; standing in one, nothing; it cannot be harmed while it calls the Tide', r);
    r = await T.ev(`const m = S.m; me.hp = D.ST.hp; const J = CB.test.force('t9'); step(CB.TUNE.t9Open + 0.1); const far = () => { let best = null, bd = -1; for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283, x = S.m.x + Math.cos(a) * 5, y = S.m.y + 3 + Math.sin(a) * 3; const d = Math.min(...J.pockets.map(p => Math.hypot(p.x - x, p.y - y))); if (d > bd && CB.test.AR && true) { bd = d; best = { x, y }; } } return best; }, q = far();
      const H0 = g.dmgTaken; step(CB.TUNE.t9Len, () => hold(q.x, q.y)); return { took: g.dmgTaken - H0, hp: me.hp, max: D.ST.hp, hit: S.stat.t9Hit, dead: me.dead };`);
    ok(r.hit >= 1 && r.took >= r.max * 0.79 && !r.dead && r.hp >= 1, 'Ninth Tide: outside a pocket, a heavy blow (~t9K of its health), never lethal from full', r);
    r = await T.ev(`const m = S.m; me.hp = D.ST.hp * 0.5; const J = CB.test.force('t9'); step(CB.TUNE.t9Open + 0.1); const q = { x: S.m.x, y: S.m.y + 4 }; for (const p of J.pockets) p.x += 50; const H0 = g.dmgTaken; step(CB.TUNE.t9Len, () => { if (!me.dead) hold(q.x, q.y); }); return { took: g.dmgTaken - H0, dead: me.dead };`);
    ok(r.dead, 'Ninth Tide: from half health it can knock the pet out', r);
  } catch (e) { ok(false, 'mechanics threw', String(e && e.message || e)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) process.exitCode = 1;
  await T.browser.close();
  // ---- phases, bars and the win; the clean-up after the defeat
  T = await fresh();
  try {
    const r = await T.ev(`const m = S.m, out = {}; hold(m.x, m.y + 6); const bars = () => Math.ceil(CB.test.realHp() / S.barHP - 1e-9);
      out.bars0 = bars(); const refill = () => { me.hp = D.ST.hp; }; m.hp = m.maxhp * 0.67; step(0.2); D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.ph2 = S.phase; out.t9a = !!S.t9; out.bars1 = bars();
      step(9, refill); out.t9aDone = !S.t9; m.hp = m.maxhp * 0.34; D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.ph3 = S.phase; out.t9b = !!S.t9; step(9, refill);
      m.hp = m.maxhp * 0.13; D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.desp = !!S.t9 && S.t9.desp; step(1.2, refill); out.np = S.t9 && S.t9.pockets.length; step(9, refill);
      out.goal = D.RIFT ? D.RIFT.goal() : null; const mod = S.modRef; out.hooked = !!(mod && mod.cam && mod.onBossDeath);
      const R = window.__cbGate || {}; const objs = D.RIFT && D.RIFT.objs; out.objs0 = objs ? objs.filter(o => /^cb/.test(o.kind)).length : -1;
      D.hitMon(m, 1e9, { noCrit: true }); step(0.1); out.dead = m.dead; out.mode = S.mode; out.cine = g.cineT > 0; step(CB.TUNE.death + 0.3); out.won = g.won; out.mode2 = S.mode; out.cine2 = g.cineT;
      out.objs1 = objs ? objs.filter(o => /^cb/.test(o.kind)).length : -1; out.camAfter = mod ? (mod.cam ? 'own' : 'none') : 'nomod'; out.z = me.z || 0; out.active = CB.active();
      return out;`);
    ok(r.bars0 === 10 && r.ph2 === 2 && r.t9a && r.ph3 === 3 && r.t9b && r.desp && r.np === 1, 'phases: II at 66% and III at 33%, each with the Ninth Tide; the last Tide near 12%', r);
    ok(r.objs0 === 3 && r.hooked, 'its three objects on the stage, the gate module chained', r);
    ok(r.dead && r.mode === 'dead' && r.cine && r.won && r.mode2 === 'over' && r.cine2 === 0 && r.objs1 === 0 && r.z === 0 && !r.active, 'the defeat: its cinematic, then winStage; every hold, object and hook given back', r);
  } catch (e) { ok(false, 'phases threw', String(e && e.message || e)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) process.exitCode = 1;
  await T.browser.close();
  // ---- the pet's death mid-power, then the stage's end mid-power
  T = await fresh();
  try {
    let r = await T.ev(`const m = S.m; hold(m.x, m.y + 5); CB.test.force('tide'); const f = S.fields[0]; hold(f.x, f.y); step(f.open + 0.8, () => hold(f.x, f.y)); const z0 = me.z;
      me.hp = 1; step(2, () => { if (!me.dead) hold(f.x, f.y); }); return { z0, dead: me.dead, z: me.z || 0, acts: S.acts.length, fields: S.fields.filter(q => !q.end).length, petZ: S.petZ };`);
    ok(r.z0 > 0.2 && r.dead && r.z === 0 && r.acts === 0 && r.fields === 0, 'the pet\'s death: its powers called off, the pet set down', r);
  } catch (e) { ok(false, 'death threw', String(e && e.message || e)); }
  await T.browser.close();
  T = await fresh();
  try {
    const r = await T.ev(`const m = S.m; hold(m.x, m.y + 5); CB.test.force('tide'); step(1.5); const before = CB.active(); P.closeArcade(true); return { before, after: CB.active(), S: !!CB.test.S, boss: !!(g.boss && !g.boss.dead) };`);
    ok(r.before && !r.after && !r.S && !r.boss, 'the stage\'s end (the map closed mid-power): the fight let go at once', r);
  } catch (e) { ok(false, 'exit threw', String(e && e.message || e)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) process.exitCode = 1;
  await T.browser.close();
  // ---- the same scripted fight at dt 1/60 and dt 1/4
  const res = {};
  for (const fps of [60, 4]) { T = await fresh();
    try { res[fps] = await T.ev(`const dt = arg, m = S.m, out = {}; hold(m.x, m.y + 5); me.hp = D.ST.hp; let H0 = g.dmgTaken; CB.test.force('rev'); step(4, () => hold(m.x, m.y + 5), dt); out.rev = Math.round(g.dmgTaken - H0);
        CB.test.force('tide'); const f = S.fields[0]; hold(f.x + f.R * 0.9, f.y); step(f.open, null, dt); const d0 = Math.hypot(me.x - f.x, me.y - f.y); step(1.0, null, dt); out.pull = +(d0 - Math.hypot(me.x - f.x, me.y - f.y)).toFixed(2); step(4, () => { me.hp = D.ST.hp; }, dt); out.z = me.z || 0;
        S.store = 0; H0 = g.dmgTaken; me.hp = D.ST.hp; const A = CB.test.force('ecl'); let tr = null; step(A.seal + 1, t => { hold(m.x, m.y + 3); if (tr == null && g.dmgTaken > H0) tr = t; }, dt); out.ecl = Math.round(g.dmgTaken - H0); out.eclAt = tr;
        H0 = g.dmgTaken; me.hp = D.ST.hp; const J = CB.test.force('t9'); step(CB.TUNE.t9Len + 0.5, () => hold(m.x + 30, m.y), dt); out.t9 = Math.round(g.dmgTaken - H0) > 0; out.t9done = !S.t9;
        return out;`, 1 / fps); } catch (e) { res[fps] = String(e); }
    if (T.errors.length) { console.log('errors', JSON.stringify(T.errors.slice(0, 3))); process.exitCode = 1; } await T.browser.close(); }
  const a = res[60], b = res[4];
  ok(a && b && a.rev === b.rev && Math.abs(a.pull - b.pull) < 0.6 && a.z === 0 && b.z === 0 && a.ecl === b.ecl && Math.abs(a.eclAt - b.eclAt) < 0.3 && a.t9 === b.t9 && a.t9done && b.t9done, 'frame-rate independence: the same blows, pull and timing at dt 1/60 and 1/4', res);
})();
