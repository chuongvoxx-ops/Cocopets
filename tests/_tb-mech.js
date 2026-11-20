// v429 TB: Belial's mechanics, one by one, on the real Gate of Taurus: every power fires and hits the pet for what TUNE says; a roll
// dodges, stepping out works; the Crown slows and pulls but can be walked out of; the Carapace stores and releases (or breaks); the
// stampede's rings and rocks; the tail's sweep; a World Pillar's lee shelters from Dominion (never lethal from full); the phases turn;
// the defeat completes the gate and wakes the Taurus Anima; the clean-up after the defeat, the pet's death and the stage's end (and
// Belial's GPU buffers freed); the same fight at dt 1/60 and 1/4.
// usage: HTML=test-tb.html node tests/_tb-mech.js [only]
const L = require('./_tb-lib');
const ONLY = process.argv[2] || '';
let fails = 0; const ok = (c, msg, v) => { console.log((c ? 'PASS ' : 'FAIL ') + msg + (v !== undefined ? '  ' + JSON.stringify(v) : '')); if (!c) { fails++; process.exitCode = 1; } };
async function fresh(o) { const T = await L.open(Object.assign({ gl: false, lvl: 30 }, o || {})); T.gate = await T.start(); await T.fight(); await T.ev(`TB.test.hold(true); return 1;`); return T; }
const RESET = `const home = () => { S.m.x = S.home.x; S.m.y = S.home.y; S.B.x = S.m.x; S.B.y = S.m.y; S.B.vx = S.B.vy = 0; }; home();`;
const want = k => !ONLY || ONLY.split(',').includes(k);
(async () => {
  let T;
  if (want('powers')) { T = await fresh();
  try {
    ok(T.gate.skies.join() === '8,8,9' && T.gate.lit === 3 && T.gate.door === 'open' && T.gate.phase === 'boss', 'the real gate: three skies traced, the door opened, the pet through it: the door seals and the fight begins', T.gate);
    const base = await T.ev(`return { TU: TB.TUNE, hp: S.m.maxhp, bar: S.barHP, dmg: S.m.dmg, max: D.ST.hp, mode: S.mode, boss: g.boss === S.m, fiend: S.m.fiend, still: S.m.still, home: S.home, at: [S.m.x, S.m.y], gl: !!(window.BELIAL_GL && window.BELIAL_GL.usable()) };`);
    const unit = base.dmg, TU = base.TU; delete base.TU;
    ok(base.hp === TU.hp && base.bar === TU.hp / TU.bars && base.dmg === TU.dmg && base.boss && base.mode === 'fight' && base.still, 'the boss is up after its intro, its health and blows from TUNE', base);
    // ---- Thronebreaker Rush: the lane, then the charge: a still pet in it struck for rushK; rolling through: nothing; out of the lane: nothing
    let r = await T.ev(`${RESET} const m = S.m, px = m.x, py = m.y + 4.6; hold(px, py); me.hp = D.ST.hp; me.inv = 0; const h0 = g.dmgTaken; const A = TB.test.force('rush'); const lane = S.lanes.length, tell = A.wind; let first = null, tHit = null, moved0 = 0;
      step(0.9, () => { hold(px, py); moved0 = Math.max(moved0, Math.hypot(m.x - S.home.x, m.y - S.home.y)); }); step(3.5, t => { if (!me.dead) { me.x = me.x; } if (first == null && g.dmgTaken > h0) { first = g.dmgTaken - h0; tHit = t + 0.9; } me.inv = 0; me.hp = D.ST.hp; });
      return { lane, tell, first, tHit, moved0, hit: S.stat.rushHit, endM: [+m.x.toFixed(2), +m.y.toFixed(2)], D: A.D };`);
    ok(r.lane === 1 && r.moved0 < 0.05 && Math.abs(r.first - unit * TU.rushK) < 1 && r.tHit > r.tell && r.hit === 1, 'Rush: a lane of light first (it does not move during the tell), then the charge strikes the pet in the lane for rushK x unit', r);
    r = await T.ev(`${RESET} const m = S.m, px = m.x, py = m.y + 4.6; hold(px, py); me.hp = D.ST.hp; me.inv = 0; const h0 = g.dmgTaken; const A = TB.test.force('rush');
      step(A.wind - 0.05, () => hold(px, py)); step(3, () => { hold(px, py); me.dodge = { t: 0.05, dur: 0.3, vx: 0, vy: 0, perf: false }; }); me.dodge = null; return { took: g.dmgTaken - h0 };`);
    ok(r.took === 0, 'Rush: rolling through the charge takes nothing', r);
    r = await T.ev(`${RESET} const m = S.m; hold(m.x, m.y + 4.6); me.hp = D.ST.hp; me.inv = 0; const A = TB.test.force('rush'); step(0.3, () => hold(m.x, m.y + 4.6)); const qx = m.x - A.uy * 3.4, qy = m.y + 4.6 * 0 + A.ux * 3.4 + A.uy * 3; const h0 = g.dmgTaken;
      step(4, () => { hold(qx, qy); me.inv = 0; }); return { took: g.dmgTaken - h0, q: [qx, qy] };`);
    ok(r.took === 0, 'Rush: stepping out of the lane before the charge takes nothing', r);
    r = await T.ev(`${RESET} S.phase = 2; const m = S.m; const A = TB.test.force('rush'); const px = m.x + A.ux * A.D + A.ux * 2.6 + 0.3, py = m.y + A.uy * A.D + A.uy * 2.6; hold(px, py); me.inv = 0; const h0 = g.dmgTaken; step(4, () => { hold(px, py); me.inv = 0; me.hp = D.ST.hp; }); S.phase = 1;
      return { took: Math.round(g.dmgTaken - h0), end: S.stat.rushEnd, shockR: TB.TUNE.rushShockR[1] };`);
    ok(r.took >= Math.round(unit * Math.min(TU.rushEndK, TU.rushShockK)) - 1, 'Rush (phase II): its end strikes in front of it (the horn thrust and the shockwave)', r);
    // ---- Crown of Burdens: the field opens (no pull, no slow), then the pet is slowed and dragged in, pressed; the core collapses on a pet that stays
    r = await T.ev(`${RESET} const m = S.m; hold(m.x + 3, m.y + 5); me.hp = D.ST.hp; me.inv = 0; TB.test.force('crown'); step(0.4); const f = S.fields[0]; const p0 = { x: f.x + f.R * 0.75, y: f.y }; hold(p0.x, p0.y);
      const h0 = g.dmgTaken; step(f.open - 0.15); const moved0 = Math.hypot(me.x - p0.x, me.y - p0.y), slow0 = g.mvMods && g.mvMods.tbcrown;
      const d0 = Math.hypot(me.x - f.x, me.y - f.y); step(1.0, () => { me.inv = 0; }); const d1 = Math.hypot(me.x - f.x, me.y - f.y), slow1 = g.mvMods && g.mvMods.tbcrown;
      step(5, () => { if (S.fields.length && !S.fields[0].end) me.hp = D.ST.hp; me.inv = 0; }); return { moved0, slow0: slow0 || 0, d0, d1, slow1, after: (g.mvMods && g.mvMods.tbcrown) || 0, took: Math.round(g.dmgTaken - h0), ticks: S.stat.crownHit };`);
    ok(r.moved0 < 0.01 && !r.slow0 && r.d1 < r.d0 - 0.8 && r.slow1 === TU.crSlow && !r.after, 'Crown: no pull or slow while it opens; then the pet is slowed (crSlow) and dragged in; the slow gone after', r);
    ok(r.took >= Math.round(unit * (TU.crK * 3 + TU.crEndK)) - 2, 'Crown: ticks of crK and the collapse (crEndK) on a pet that stays', r);
    r = await T.ev(`${RESET} const m = S.m; hold(m.x + 3, m.y + 5); me.hp = D.ST.hp; TB.test.force('crown'); step(0.4); const f = S.fields[0]; hold(f.x + 1.2, f.y); step(f.open + 0.2); const h0 = g.dmgTaken; let slowSeen = 0;
      step(4, () => { const dx = me.x - f.x, dy = me.y - f.y, d = Math.hypot(dx, dy) || 1, sp = 4.3 * ((g.mvMods && g.mvMods.tbcrown) || 1) / 30; if (g.mvMods && g.mvMods.tbcrown) slowSeen = 1; if (d < f.R + 1.5) S.X.moveEnt(me, dx / d * sp, dy / d * sp, 0); });
      return { out: Math.hypot(me.x - f.x, me.y - f.y), R: f.R, slowSeen, slowNow: (g.mvMods && g.mvMods.tbcrown) || 0, collapse: Math.round(g.dmgTaken - h0) };`);
    ok(r.out > r.R && r.slowSeen && !r.slowNow, 'Crown: walking out against the pull (at its slowed speed) escapes the field, and the slow lifts', r);
    // ---- Citadel Carapace: blows soak into the barrier and are stored; past its pool it breaks: it staggers, nothing is released
    r = await T.ev(`${RESET} const m = S.m; hold(m.x, m.y + 4); TB.test.force('car'); step(1.2); const PD = S.pad, pool = PD ? PD.pool : 0, h0 = TB.test.realHp(), w0 = S.stat.carWave;
      for (let i = 0; i < 4; i++) { D.hitMon(m, pool * 0.2, { noCrit: true }); step(0.05); } const h1 = TB.test.realHp(), left = S.pad ? S.pad.left : -1, store0 = S.store, R1 = TB.test.carR();
      D.hitMon(m, pool * 0.5, { noCrit: true }); step(0.05); const out = { pool, h0, h1, left, store0, R1, h2: TB.test.realHp(), broke: S.stat.carBroke, stun: m.stunT, store: S.store, pad: S.pad && S.pad.kind }; step(3.4); out.stun2 = m.stunT; out.act = m.act; out.waves = S.stat.carWave - w0; return out;`);
    ok(r.pool > 0 && Math.abs(r.h1 - r.h0) < 1 && r.left > 0 && r.store0 > r.pool * 0.75 && r.R1 > TU.carR0 && r.broke === 1 && r.stun > 2 && r.h2 < r.h0 && r.store === 0 && !r.pad, 'Carapace: blows soak into the barrier and are stored (its reach grows); past its pool it breaks: it staggers, the rest gets through, the store scatters', r);
    ok(r.stun2 <= 0 && r.act === 'fight' && r.waves === 0, 'Carapace broken: no retaliation; the stagger ends', r);
    // unbroken: what it stored comes back as a wave scaled by it, on a pet in its reach; a pet that stopped and stood back is not reached
    r = await T.ev(`${RESET} const m = S.m; S.dps = TB.TUNE.refDps; hold(m.x, m.y + 3); me.hp = D.ST.hp; me.inv = 0; TB.test.force('car'); step(1.2); const pool = S.pad.pool; for (let i = 0; i < 6; i++) { D.hitMon(m, pool * 0.1, { noCrit: true }); step(0.2, () => hold(m.x, m.y + 3)); }
      const k1 = TB.test.carMul(), R1 = TB.test.carR(), st = S.store, H0 = g.dmgTaken; let tr = null; step(TB.TUNE.carDur + 1, t => { hold(m.x, m.y + 3); if (tr == null && g.dmgTaken > H0) tr = t; }); return { pool, st, k1, R1, took: g.dmgTaken - H0, waves: S.stat.carWave, broke: S.stat.carBroke, hit: S.stat.carHit, tr };`);
    ok(r.st >= r.pool * 0.55 && r.k1 > 1 && r.R1 > TU.carR0 && Math.abs(r.took - unit * TU.carK * r.k1) < 2 && r.broke === 1, 'Carapace unbroken: the stored force is released as a wave (carK x its charge) on a pet in its reach', r);
    r = await T.ev(`${RESET} const m = S.m; S.store = 0; me.hp = D.ST.hp; me.inv = 0; TB.test.force('car'); const H0 = g.dmgTaken; step(TB.TUNE.carDur + 2.5, () => hold(m.x, m.y + TB.TUNE.carR0 + 1.2)); return { took: g.dmgTaken - H0, waves: S.stat.carWave };`);
    ok(r.took === 0 && r.waves >= 2, 'Carapace: unprovoked, its small wave misses a pet that stood back', r);
    // ---- Graviton Stampede: each stomp a ring that strikes a pet in its reach for stK; rocks rise round the pet and fall for rockK
    r = await T.ev(`${RESET} const m = S.m, px = m.x + 0.4, py = m.y + 3.4; hold(px, py); me.hp = D.ST.hp; me.inv = 0; const A = TB.test.force('stamp'); const H0 = g.dmgTaken, s0 = S.stat.stampHit, k0 = S.stat.rockHit; const blows = [];
      let last = g.dmgTaken; step(A.dur + 2.5, () => { hold(px, py); me.inv = 0; me.hp = D.ST.hp; if (g.dmgTaken > last) { blows.push(Math.round(g.dmgTaken - last)); last = g.dmgTaken; } }); return { n: A.n, stomps: S.stat.stampHit - s0, rocks: S.stat.rockHit - k0, blows };`);
    ok(r.stomps === r.n && r.blows.filter(b => b === Math.round(unit * TU.stK)).length === r.n, 'Stampede: every stomp\'s ring strikes a still pet in its reach for stK x unit', r);
    ok(r.rocks >= 2 && r.blows.filter(b => b === Math.round(unit * TU.rockK)).length >= 2, 'Stampede: the rocks raised round the pet fall on it for rockK x unit', r);
    r = await T.ev(`${RESET} const m = S.m; let px = m.x, py = TB.test.AR.cy + TB.test.AR.ry - 0.7; hold(px, py); me.hp = D.ST.hp; me.inv = 0; const A = TB.test.force('stamp'); const s0 = S.stat.stampHit, H0 = g.dmgTaken; let side = 1, steps = 0, far = 1e9;
      step(A.dur + 2.5, () => { const live = S.rocks.filter(q => !q.dud && !q.hit); if (live.some(q => Math.hypot(q.x - px, q.y - py) < q.R + 0.6)) { let best = null; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, x = px + Math.cos(a) * 3, y = py + Math.sin(a) * 3; if (!(Math.pow(Math.abs((x - TB.test.AR.cx) / (TB.test.AR.rx - 0.7)), 2.6) + Math.pow(Math.abs((y - TB.test.AR.cy) / (TB.test.AR.ry - 0.7)), 2.6) < 1)) continue; const d = Math.min(...live.map(q => Math.hypot(q.x - x, q.y - y))) + Math.min(2, Math.hypot(x - m.x, y - m.y) - 6); if (!best || d > best.d) best = { x, y, d }; } if (best) { px = best.x; py = best.y; steps++; } } hold(px, py); me.inv = 0; far = Math.min(far, Math.hypot(px - m.x, py - m.y)); }); return { stomps: S.stat.stampHit - s0, took: g.dmgTaken - H0, steps, far, reach: A.R };`);
    ok(r.stomps === 0 && r.took === 0, 'Stampede: beyond its reach the rings miss, and stepping off the rocks\' rings takes nothing', r);
    r = await T.ev(`${RESET} const m = S.m, px = m.x, py = m.y + 3.4; hold(px, py); me.hp = D.ST.hp; me.inv = 0; const A = TB.test.force('stamp'); const H0 = g.dmgTaken; step(A.dur + 2.5, () => { hold(px, py); me.dodge = { t: 0.05, dur: 0.3, vx: 0, vy: 0, perf: false }; }); me.dodge = null; return { took: g.dmgTaken - H0 };`);
    ok(r.took === 0, 'Stampede: rolling through its rings takes nothing', r);
    // ---- the tail anchor: a pet that stays close is punished (a glowing tell first)
    r = await T.ev(`${RESET} const m = S.m; me.hp = D.ST.hp; me.inv = 0; TB.test.hold(false); S.idleT = 99; S.swCd = 0; S.near = 0; const H0 = g.dmgTaken; let t1 = null, tell = null; step(4, t => { hold(m.x + 1.4, m.y + 2.4); if (tell == null && S.sweeps.length) tell = t; if (t1 == null && g.dmgTaken > H0) t1 = t; }); TB.test.hold(true); S.acts.length = 0;
      return { took: g.dmgTaken - H0, t1, tell, n: S.stat.swHit };`);
    ok(Math.abs(r.took - unit * TU.swK) < 1 && r.tell > TU.swNear - 0.1 && r.t1 > r.tell + 0.4, 'Tail sweep: after the pet lingers close, a glowing tell, then the swK blow', r);
    // ---- Dominion of the World Pillar: pillars rise, each with a lee behind it; in a lee: nothing; it cannot be harmed meanwhile
    r = await T.ev(`${RESET} S.phase = 2; const m = S.m; me.hp = D.ST.hp; me.inv = 0; const J = TB.test.force('dom'); const K = TB.TUNE.domT; step(K[2] + 0.2); const ps = J.pillars, inA = (x, y) => { const A = TB.test.AR; return Math.pow(Math.abs((x - A.cx) / A.rx), 2.6) + Math.pow(Math.abs((y - A.cy) / A.ry), 2.6) < 1; };
      const behind = ps.every(p => ((p.lee.x - p.x) * (p.x - m.x) + (p.lee.y - p.y) * (p.y - m.y)) > 0), inside = ps.every(p => inA(p.lee.x, p.lee.y) && inA(p.x, p.y));
      const p = ps[0]; const H0 = g.dmgTaken, h0 = TB.test.realHp(); D.hitMon(m, 5000, { noCrit: true }); step(0.05); const h1 = TB.test.realHp();
      step(K[7], () => { if (S.dom) hold(p.lee.x, p.lee.y); me.inv = 0; }); S.phase = 1; return { n: ps.length, behind, inside, took: g.dmgTaken - H0, safe: S.stat.domSafe, h0, h1, done: !S.dom, pad: S.pad };`);
    ok(r.n === TU.domN[0] && r.behind && r.inside && r.took === 0 && r.safe >= 1 && Math.abs(r.h1 - r.h0) < 1 && r.done && !r.pad, 'Dominion: World Pillars rise, each lee behind its pillar inside the court; standing in one, nothing; it cannot be harmed meanwhile', r);
    r = await T.ev(`${RESET} const m = S.m; me.hp = D.ST.hp; me.inv = 0; const J = TB.test.force('dom'); const K = TB.TUNE.domT; step(K[2] + 0.2); let best = null, bd = -1; for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283, x = m.x + Math.cos(a) * 3.5, y = m.y + Math.sin(a) * 3; const d = Math.min(...J.pillars.map(p => Math.hypot(p.lee.x - x, p.lee.y - y))); if (d > bd) { bd = d; best = { x, y }; } }
      const H0 = g.dmgTaken; step(K[7], () => { hold(best.x, best.y); }); return { took: g.dmgTaken - H0, hp: me.hp, max: D.ST.hp, hit: S.stat.domHit, dead: me.dead, bd };`);
    ok(r.hit >= 1 && r.took >= r.max * TU.domK - 1 && !r.dead && r.hp >= 1, 'Dominion: outside a lee, a crushing blow (domK of its health), never lethal from full', r);
    r = await T.ev(`${RESET} const m = S.m; me.hp = D.ST.hp * 0.5; me.inv = 0; const J = TB.test.force('dom'); const K = TB.TUNE.domT; step(K[2] + 0.2); for (const p of J.pillars) p.lee.x += 60; const H0 = g.dmgTaken; step(K[7], () => { if (!me.dead) hold(m.x, m.y + 4); }); return { took: g.dmgTaken - H0, dead: me.dead };`);
    ok(r.dead, 'Dominion: from half health it can knock the pet out', r);
  } catch (e) { ok(false, 'powers threw', String(e && e.stack || e).slice(0, 600)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- phases, bars and the win: the gate completes and the Taurus Anima wakes; the clean-up after the defeat
  if (want('phases')) { T = await fresh();
  try {
    const TU0 = await T.ev(`return TB.TUNE;`);
    const r = await T.ev(`const m = S.m, out = {}; hold(m.x, m.y + 5); const bars = () => Math.ceil(TB.test.realHp() / S.barHP - 1e-9), refill = () => { me.hp = D.ST.hp; };
      const RS = P.riftState(); out.before = { gate: RS.gates.garden || 0, anima: (P.st.animas.have || {}).taurus || 0 };
      out.bars0 = bars(); m.hp = m.maxhp * 0.67; step(0.2); D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.ph2 = S.phase; out.dom2 = S.dom ? S.dom.pillars.length : 0; out.bars1 = bars();
      step(11, refill); out.domDone = !S.dom; m.hp = m.maxhp * 0.34; D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.ph3 = S.phase; out.dom3 = S.dom ? S.dom.pillars.length : 0; step(11, refill);
      m.hp = m.maxhp * 0.13; D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.desp = !!S.dom && S.dom.desp; out.domD = S.dom ? S.dom.pillars.length : 0; step(11, refill);
      out.goal = D.RIFT ? D.RIFT.goal() : null; const objs = D.RIFT && D.RIFT.objs; out.objs0 = objs ? objs.filter(o => /^tb/.test(o.kind)).length : -1;
      TB.test.hold(false); S.idleT = 0; step(2, refill); out.slowKey = !!(g.mvMods && 'tbcrown' in g.mvMods);
      D.hitMon(m, 1e9, { noCrit: true }); step(0.1); out.dead = m.dead; out.mode = S.mode; out.cine = g.cineT > 0; const S0 = S; step(TB.TUNE.death + 0.3); out.won = g.won; out.mode2 = S0.mode; out.cine2 = g.cineT;
      out.objs1 = objs ? objs.filter(o => /^tb/.test(o.kind)).length : -1; out.inst = !!S0.inst; out.slow = !!(g.mvMods && g.mvMods.tbcrown); out.active = TB.active(); out.gateGoal = D.RIFT.goal();
      let n = 0; while (P.arc.state === 'play' && n++ < 600) U.update(1 / 30); out.state = P.arc.state;
      out.after = { gate: RS.gates.garden || 0, anima: (P.st.animas.have || {}).taurus || 0 }; return out;`);
    ok(r.bars0 === TU0.bars && r.ph2 === 2 && r.dom2 === 6 && r.domDone && r.ph3 === 3 && r.dom3 === 5 && r.desp && r.domD === 4, 'phases: II at 66% and III at 33%, each with Dominion (6 then 5 pillars); the last Dominion near 12% (4 pillars)', r);
    ok(r.objs0 === 6, 'its six objects on the stage (ground, body, sky, three pillar layers)', r);
    ok(r.dead && r.mode === 'dead' && r.cine && r.won && r.mode2 === 'over' && r.cine2 === 0 && r.objs1 === 0 && !r.inst && !r.slow && !r.active, 'the defeat: its cinematic, then winStage; every hold, object and effect given back', r);
    ok(!r.before.gate && !r.before.anima && r.state === 'end' && r.after.gate === 1 && r.after.anima >= 1, 'the win completes the gate (gates.garden) and wakes the Taurus Anima (animas.have.taurus), exactly as the gate\'s own win did', r);
  } catch (e) { ok(false, 'phases threw', String(e && e.stack || e).slice(0, 600)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- the pet's death mid-power, then the stage's end mid-power
  if (want('cleanup')) { T = await fresh();
  try {
    let r = await T.ev(`${RESET} const m = S.m; hold(m.x + 2, m.y + 5); TB.test.force('crown'); step(0.4); const f = S.fields[0]; hold(f.x, f.y); step(f.open + 0.8, () => hold(f.x, f.y)); const slow0 = g.mvMods && g.mvMods.tbcrown;
      me.hp = 1; me.inv = 0; step(2, () => { if (!me.dead) { hold(f.x, f.y); me.inv = 0; } }); return { slow0, dead: me.dead, slow: (g.mvMods && g.mvMods.tbcrown) || 0, acts: S.acts.length, fields: S.fields.filter(q => !q.end).length, active: TB.active() };`);
    ok(r.slow0 > 0 && r.dead && !r.slow && r.acts === 0 && r.fields === 0, 'the pet\'s death: its powers called off, the slow lifted', r);
  } catch (e) { ok(false, 'death threw', String(e && e.message || e)); }
  await T.browser.close();
  T = await fresh();
  try {
    const r = await T.ev(`${RESET} const m = S.m; hold(m.x + 2, m.y + 5); TB.test.force('crown'); step(0.4); const f = S.fields[0]; hold(f.x, f.y); step(f.open + 0.8, () => hold(f.x, f.y)); const before = TB.active(), slow0 = g.mvMods.tbcrown, gg = g;
      P.closeArcade(true); await new Promise(r => setTimeout(r, 300)); return { before, slow0, after: TB.active(), S: !!TB.test.S, boss: !!(gg.boss && !gg.boss.dead), slow: (gg.mvMods && gg.mvMods.tbcrown) || 0, live: !!window.TAURUS_GATE.live, cached: window.TAURUS_PROPS.stats.cached };`);
    ok(r.before && r.slow0 > 0 && !r.after && !r.S && !r.boss && !r.slow && !r.live && r.cached === 0, 'the stage\'s end (the map closed mid-power): the fight let go at once, the slow lifted, the gate released', r);
  } catch (e) { ok(false, 'exit threw', String(e && e.message || e)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- Belial's GPU buffers: up while it is drawn, freed when it falls (the software rasteriser forced on)
  if (want('gpu')) { T = await fresh({ gl: true });
  try {
    await T.M(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const r = await T.ev(`const G = window.BELIAL_GL, out = { gl: G.usable(), up: G.gpuCount() }; D.hitMon(S.m, 1e9, { noCrit: true }); step(TB.TUNE.death + 0.3); out.after = G.gpuCount(); out.mode = S.mode; return out;`);
    ok(r.gl && r.up > 0 && r.after === 0 && r.mode === 'over', 'GPU: Belial\'s buffers are up while it is drawn and freed when it falls (BELIAL_GL.release through its effect layer\'s stop)', r);
  } catch (e) { ok(false, 'gpu threw', String(e && e.message || e)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- the same scripted fight at dt 1/60 and dt 1/4
  if (want('dt')) { const res = {};
  for (const fps of [60, 4]) { T = await fresh();
    try { res[fps] = await T.ev(`${RESET} const dt = arg, m = S.m, out = {}; let px = m.x, py = m.y + 4.6; hold(px, py); me.hp = D.ST.hp; me.inv = 0; let H0 = g.dmgTaken; TB.test.force('rush'); let first = null; step(4.5, () => { if (first == null && g.dmgTaken > H0) first = g.dmgTaken - H0; hold(px, py); me.inv = 0; me.hp = D.ST.hp; }, dt); out.rush = Math.round(first);
        home(); hold(m.x + 3, m.y + 5); TB.test.force('crown'); step(0.4, null, dt); const f = S.fields[0]; hold(f.x + f.R * 0.75, f.y); step(f.open, null, dt); const d0 = Math.hypot(me.x - f.x, me.y - f.y); step(1.0, () => { me.inv = 0; }, dt); out.pull = +(d0 - Math.hypot(me.x - f.x, me.y - f.y)).toFixed(2); step(5, () => { me.hp = D.ST.hp; }, dt); out.slow = (g.mvMods && g.mvMods.tbcrown) || 0;
        home(); S.dps = TB.TUNE.refDps; H0 = g.dmgTaken; me.hp = D.ST.hp; me.inv = 0; const still = () => { hold(m.x, m.y + 3); g.normalT = 1; };   // (the pet's own blows held back: only the scripted ones charge the barrier)
        TB.test.force('car'); step(1.2, still, dt); const pool = S.pad.pool; for (let i = 0; i < 6; i++) { D.hitMon(m, pool * 0.1, { noCrit: true }); step(0.25, still, dt); } H0 = g.dmgTaken; let tc = null; step(TB.TUNE.carDur + 1, t => { still(); if (tc == null && g.dmgTaken > H0) tc = t; }, dt); out.car = Math.round(g.dmgTaken - H0); out.carAt = tc;
        home(); px = m.x + 0.4; py = m.y + 3.4; me.inv = 0; const s0 = S.stat.stampHit; let A = TB.test.force('stamp'); step(A.dur + 2.5, () => { hold(px, py); me.inv = 0; me.hp = D.ST.hp; }, dt); out.stomps = S.stat.stampHit - s0;
        home(); px = m.x; py = TB.test.AR.cy + TB.test.AR.ry - 0.7; me.inv = 0; const k0 = S.stat.rockAim; A = TB.test.force('stamp'); step(A.dur + 2.5, () => { hold(px, py); me.inv = 0; me.hp = D.ST.hp; }, dt); out.rocks = S.stat.rockAim - k0;   // (rocks alone: beyond the rings, so no ring's blink of safety shares a frame with a rock)
        home(); me.hp = D.ST.hp; me.inv = 0; H0 = g.dmgTaken; const J = TB.test.force('dom'); step(TB.TUNE.domT[7] + 0.5, () => hold(m.x + 30, m.y), dt); out.dom = Math.round(g.dmgTaken - H0) > 0; out.domDone = !S.dom;
        return out;`, 1 / fps); } catch (e) { res[fps] = String(e); }
    if (T.errors.length) { console.log('errors', JSON.stringify(T.errors.slice(0, 3))); fails++; process.exitCode = 1; } await T.browser.close(); }
  const a = res[60], b = res[4];
  ok(a && b && a.rush === b.rush && a.rush > 0 && Math.abs(a.pull - b.pull) < 0.6 && !a.slow && !b.slow && a.car === b.car && a.car > 0 && Math.abs(a.carAt - b.carAt) < 0.3 && a.stomps === b.stomps && a.rocks === b.rocks && a.dom === b.dom && a.domDone && b.domDone, 'frame-rate independence: the same blows, pull and timing at dt 1/60 and 1/4', res); }
  console.log(fails ? `${fails} FAILED` : 'ALL OK');
})();
