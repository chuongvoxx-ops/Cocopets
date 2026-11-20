// v435 SB: Samael's mechanics, one by one, on the real Gate of Aries: every power fires and hits the pet for what TUNE says; a roll
// dodges, stepping out works; the fans' gaps, the rings' gaps and the spires' lee; the Overdrive's corona and its speed; the vents
// (the bared heart drains the Ruin, only from the front); the Cataclysm (harder, burning, then a vent and 25); burning ground; the
// phases; Wrath of the Fallen (a refuge shelters, never lethal from full, it cannot be harmed); the fall completes the gate and
// unlocks Samael; the clean-up after the fall, the pet's death and the stage's end (and Samael's GPU buffers freed); the same
// fight at dt 1/60 and 1/4.
// usage: HTML=test-sb.html node tests/_sb-mech.js [powers,state,phases,cleanup,gpu,dt]
const L = require('./_sb-lib');
const ONLY = process.argv[2] || '';
let fails = 0; const ok = (c, msg, v) => { console.log((c ? 'PASS ' : 'FAIL ') + msg + (v !== undefined ? '  ' + JSON.stringify(v) : '')); if (!c) { fails++; process.exitCode = 1; } };
async function fresh(o) { const T = await L.open(Object.assign({ gl: false, lvl: 10 }, o || {})); T.gate = await T.start(); await T.fight(); await T.ev(`SB.test.hold(true); return 1;`); return T; }
const RESET = `const home = () => { SB.test.abortActs(); S.m.x = S.home.x; S.m.y = S.home.y; S.B.x = S.m.x; S.B.y = S.m.y; S.B.z = 0; S.B.vx = S.B.vy = 0; S.trails.length = 0; S.spires.length = 0; S.waves.length = 0; S.marks.length = 0; S.cres.length = 0; S.vols.length = 0; S.lanes.length = 0;
    S.ruin = 0; S.over = 0; S.cata = 0; S.vent = null; S.m.stunT = 0; S.m.act = 'fight'; S.ventQ = 0; S.burn = null; S.idleT = 99; S.phase = 1; me.hp = D.ST.hp; me.inv = 0; }; home();
  const blowsOf = (secs, each, dt) => { const out = []; let last = g.dmgTaken; step(secs, t => { const r = each ? each(t) : null; if (g.dmgTaken > last + 1e-6) { out.push(+(g.dmgTaken - last).toFixed(2)); last = g.dmgTaken; } me.inv = 0; if (me.hp < D.ST.hp * 0.5) me.hp = D.ST.hp; return r; }, dt); return out; };`;
const SPOT = `const inC = (x, y) => Math.pow(Math.abs((x - SB.test.AR.cx) / (SB.test.AR.rx - 0.8)), 2.6) + Math.pow(Math.abs((y - SB.test.AR.cy) / (SB.test.AR.ry - 0.8)), 2.6) < 1;
      const spot = (A, wantGap, d) => { const gn = TU.imGapN[S.phase - 1], gaps = []; for (let j = 0; j < gn; j++) gaps.push(j / gn * 6.283); for (let i = 0; i < 96; i++) { const an = i / 96 * 6.283, dg = Math.min(...gaps.map(q => Math.abs(((an - q + 9.42) % 6.283) - 3.1416))), x = A.tx + Math.cos(an) * d, y = A.ty + Math.sin(an) * d;
        if (inC(x, y) && (wantGap ? dg < 0.05 : dg > TU.imGapW / 2 + 0.3)) return { x, y }; } return null; };`;
const want = k => !ONLY || ONLY.split(',').includes(k);
const near = (a, b, e) => Math.abs(a - b) < (e == null ? 0.6 : e);
(async () => {
  let T;
  if (want('powers')) { T = await fresh();
  try {
    ok(T.gate.door === 'open' && T.gate.phase === 'boss', 'the real gate: the switchyard solved, the door opened, the pet through it: the door seals and the fight begins', T.gate);
    const base = await T.ev(`return { TU: SB.TUNE, hp: S.m.maxhp, bar: S.barHP, dmg: S.m.dmg, max: D.ST.hp, mode: S.mode, boss: g.boss === S.m, fiend: S.m.fiend, still: S.m.still, home: S.home, objs: S.objs.length };`);
    const unit = base.dmg, TU = base.TU; delete base.TU;
    ok(base.hp === TU.hp && base.bar === TU.hp / TU.bars && base.dmg === TU.dmg && base.boss && base.mode === 'fight' && base.still && base.objs === 3, 'the boss is up after its intro, its health and blows from TUNE, its three objects on the stage', base);
    // ---- Hellbreak Charge: the lane, then the charge: a still pet in it struck for chK; rolling through: nothing; out of the lane: nothing
    let r = await T.ev(`${RESET} const m = S.m, px = m.x, py = m.y + 4.6; hold(px, py); const h0 = g.dmgTaken; const A = SB.test.force('charge'); const lane = S.lanes.length, tell = A.wind; let first = null, tHit = null, moved0 = 0, trails = 0; const c0 = S.stat.chargeHit;
      step(A.wind - 0.05, () => { hold(px, py); moved0 = Math.max(moved0, Math.hypot(m.x - S.home.x, m.y - S.home.y)); }); step(3.5, t => { hold(px, py); trails = Math.max(trails, S.trails.length); if (first == null && g.dmgTaken > h0) { first = g.dmgTaken - h0; tHit = t + A.wind; } me.inv = 0; me.hp = D.ST.hp; });
      return { lane, tell, first, tHit, moved0, hit: S.stat.chargeHit - c0, trails, D: A.D };`);
    ok(r.lane === 1 && r.moved0 < 0.05 && near(r.first, unit * TU.chK, 0.6) && r.tHit > r.tell && r.hit === 1, 'Charge: a lane of light first (it does not move during the tell), then the charge strikes the pet in the lane for chK x unit', r);
    ok(r.trails >= 3, 'Charge: it leaves burning ground behind it', r);
    r = await T.ev(`${RESET} const m = S.m, px = m.x, py = m.y + 4.6; hold(px, py); const h0 = g.dmgTaken; const A = SB.test.force('charge'); step(A.wind - 0.05, () => hold(px, py)); step(3, () => { hold(px, py); me.dodge = { t: 0.05, dur: 0.3, vx: 0, vy: 0, perf: false }; }); me.dodge = null; return { took: g.dmgTaken - h0 };`);
    ok(r.took === 0, 'Charge: rolling through the charge takes nothing', r);
    r = await T.ev(`${RESET} const m = S.m; hold(m.x, m.y + 4.6); const A = SB.test.force('charge'); step(0.3, () => hold(m.x, m.y + 4.6)); const qx = m.x - A.uy * 3.6 + A.ux * 2, qy = m.y + A.ux * 3.6 + A.uy * 2; const h0 = g.dmgTaken;
      step(4, () => { hold(qx, qy); me.inv = 0; }); return { took: g.dmgTaken - h0, q: [qx, qy] };`);
    ok(r.took === 0, 'Charge: stepping out of the lane before the charge takes nothing', r);
    r = await T.ev(`${RESET} S.phase = 2; const m = S.m; const A = SB.test.force('charge'); const px = m.x + A.ux * A.D + A.ux * 2.4, py = m.y + A.uy * A.D + A.uy * 2.4; hold(px, py); const h0 = g.dmgTaken; step(4, () => { hold(px, py); me.inv = 0; me.hp = D.ST.hp; }); S.phase = 1;
      return { took: Math.round(g.dmgTaken - h0), end: S.stat.chargeEnd };`);
    ok(r.took >= Math.round(unit * Math.min(TU.chEndK, TU.chShockK)) - 1, 'Charge (phase II): its end strikes in front of it (the horns and the shockwave)', r);
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m; hold(m.x, m.y + 5); const l0 = S.stat.lanes || 0; const A = SB.test.force('charge'); let segs = 0; step(9, () => { segs = Math.max(segs, A.seg + 1); me.inv = 0; me.hp = D.ST.hp; if (!S.acts.length) return true; }); S.phase = 1; return { segs, lanes: S.stat.lanes - l0, n: A.n, acts: S.acts.length };`);
    ok(r.segs === TU.chN[2] && r.lanes === TU.chN[2], 'Charge (phase III): three charges chained, each with its own lane, the last into a volcanic end', r);
    // ---- Horns of Perdition: a still pet in the aim is struck once a fan; one in each fan's gap is never struck
    r = await T.ev(`${RESET} const m = S.m, px = m.x + 0.3, py = m.y + 5.5; hold(px, py); const A = SB.test.force('perd'); const blows = blowsOf(A.dur + 1.5, () => hold(px, py)); return { n: A.n, blows, vols: A.vols.length };`);
    ok(r.n === TU.pdN[0] && r.blows.length === r.n && r.blows.every(b => near(b, unit * TU.pdK)), 'Perdition: every fan strikes a still pet for pdK x unit', r);
    r = await T.ev(`${RESET} const m = S.m; let px = m.x + 0.3, py = m.y + 5.5; hold(px, py); const A = SB.test.force('perd'); const gaps = []; const blows = blowsOf(A.dur + 1.5, () => { const V = S.vols.filter(v => !v.fired && !v.dead).slice(-1)[0];
        if (V && !V.seen && V.t > V.tell - 0.15) { V.seen = 1; const s = V.slots[V.gapJ]; px = V.x + s.ux * 5; py = V.y + s.uy * 5; gaps.push(V.gapJ); } hold(px, py); }); return { blows, gaps, slots: TU.pdSlots[0] };`);
    ok(r.blows.length === 0 && r.gaps.length === TU.pdN[0] && new Set(r.gaps).size >= 1, 'Perdition: standing in each fan\'s dark gap takes nothing', r);
    r = await T.ev(`${RESET} const m = S.m; let px = m.x + 0.3, py = m.y + 5.5; hold(px, py); const A = SB.test.force('perd'); const blows = blowsOf(A.dur + 1.5, () => { hold(px, py); me.dodge = { t: 0.05, dur: 0.3, vx: 0, vy: 0, perf: false }; }); me.dodge = null; return { blows };`);
    ok(r.blows.length === 0, 'Perdition: rolling through the crescents takes nothing', r);
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m, px = m.x + 0.4, py = m.y + 5.2; hold(px, py); const A = SB.test.force('perd'); const c0 = S.stat.crossHit; const blows = blowsOf(A.dur + 1.5, () => hold(px, py)); S.phase = 1; return { n: A.n, blows, cross: S.stat.crossHit - c0 };`);
    ok(r.n === TU.pdN[2] && r.cross === 1 && r.blows.filter(b => near(b, unit * TU.crossK)).length === 1, 'Perdition (phase III): five fans, then the cross detonates on a pet that stays (crossK x unit)', r);
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m; let px = m.x + 0.4, py = m.y + 5.2; hold(px, py); const A = SB.test.force('perd'); const c0 = S.stat.crossHit; step(A.dur + 1.5, () => { const k = S.marks[0]; if (k && !k.done) { px = k.x + 4; py = k.y; } hold(px, py); me.inv = 0; me.hp = D.ST.hp; }); S.phase = 1; return { cross: S.stat.crossHit - c0, made: S.stat.cross };`);
    ok(r.cross === 0 && r.made >= 1, 'Perdition (phase III): stepping off the cross\'s mark takes nothing', r);
    // ---- Furnace Overdrive: the corona's ticks inside, nothing outside; it quickens its powers; it vents when it burns out
    r = await T.ev(`${RESET} const m = S.m; hold(m.x + 2.5, m.y + 1.5); const A = SB.test.force('over'); const blows = blowsOf(A.wind + TU.ovDur[0] + 0.3, () => hold(m.x + 2.5, m.y + 1.5)); return { blows, ovHit: S.stat.ovHit, over: S.over, ventQ: S.ventQ };`);
    ok(r.blows.length >= Math.floor(TU.ovDur[0] / TU.ovTick) - 1 && r.blows.every(b => near(b, unit * TU.ovK, 0.3)) && r.over === 0, 'Overdrive: inside the corona, ticks of ovK x unit for its whole length', r);
    r = await T.ev(`step(0.2); return { vent: !!S.vent, dur: S.vent && S.vent.dur, stun: S.m.stunT > 0 };`);
    ok(r.vent && near(r.dur, TU.ventOver, 0.01) && r.stun, 'Overdrive: when the furnace burns out it vents (its heart bared, stunned)', r);
    r = await T.ev(`${RESET} const m = S.m; hold(m.x + TU.ovR + 1.2, m.y); const A = SB.test.force('over'); const blows = blowsOf(A.wind + 3, () => hold(m.x + TU.ovR + 1.2, m.y)); const sA = SB.test.start('perd'); step(1.0, () => hold(m.x + TU.ovR + 1.2, m.y)); const quick = sA.t;
      home(); const sB = SB.test.start('perd'); step(1.0, () => hold(m.x + TU.ovR + 1.2, m.y)); return { blows, quick: +quick.toFixed(3), plain: +sB.t.toFixed(3) };`);
    ok(r.blows.length === 0 && near(r.quick / r.plain, TU.ovRate, 0.03), 'Overdrive: outside the corona nothing; its powers run ovRate faster while it burns', r);
    // ---- First Impact: the landing spot follows the pet (it stays: struck for imK); stepping out after the lock: nothing; the rings' gaps and the spires' lee
    r = await T.ev(`${RESET} const m = S.m, px = m.x + 1.5, py = m.y + 5; hold(px, py); const A = SB.test.force('impact'); const i0 = S.stat.impactHit; const blows = blowsOf(A.t4 + 0.05, () => hold(px, py)); return { blows, tgt: [+A.tx.toFixed(2), +A.ty.toFixed(2)], p: [px, py], hit: S.stat.impactHit - i0, landed: A.landed, z: S.B.z };`);
    ok(r.landed && r.hit === 1 && r.blows.length === 1 && near(r.blows[0], unit * TU.imK), 'Impact: it lands on a pet that stays (the spot follows it) for imK x unit', r);
    r = await T.ev(`${RESET} const m = S.m; let px = m.x + 1.5, py = m.y + 5; hold(px, py); const A = SB.test.force('impact'); const h0 = g.dmgTaken, i0 = S.stat.impactHit; step(A.t4 + 0.05, t => { if (A.lock && !A.moved) { A.moved = 1; px = A.tx + TU.imR + 1.4; py = A.ty; } hold(px, py); me.inv = 0; });
      return { took: g.dmgTaken - h0, hit: S.stat.impactHit - i0, at: [px, py], tgt: [A.tx, A.ty] };`);
    ok(r.took === 0 && r.hit === 0, 'Impact: stepping out of the glowing spot once it locks takes nothing', r);
    r = await T.ev(`${RESET} ${SPOT} S.phase = 2; S.gapOff = 0; const m = S.m; let px = m.x + 1.5, py = m.y + 5; hold(px, py); const A = SB.test.force('impact'); step(A.t4 - 0.1, () => { if (A.lock && !A.moved) { A.moved = 1; const q = spot(A, false, 5.5); px = q.x; py = q.y; } hold(px, py); });
      const w0 = S.stat.waveHit; const blows = blowsOf(2.5, () => { S.spires.length = 0; hold(px, py); }); S.phase = 1; S.gapOff = null; return { blows, n: A.n, hit: S.stat.waveHit - w0, at: [px, py] };`);
    ok(r.n === TU.imWaves[1] && r.blows.length === r.n && r.blows.every(b => near(b, unit * TU.imWaveK)), 'Impact (phase II): each of its rings strikes a pet out of the gaps for imWaveK x unit', r);
    r = await T.ev(`${RESET} ${SPOT} S.phase = 2; S.gapOff = 0; const m = S.m; let px = m.x + 1.5, py = m.y + 5; hold(px, py); const A = SB.test.force('impact'); step(A.t4 - 0.1, () => { if (A.lock && !A.moved) { A.moved = 1; const q = spot(A, true, 4.6) || spot(A, true, 3.8); px = q.x; py = q.y; } hold(px, py); });
      const g0 = S.stat.waveGap; const blows = blowsOf(2.5, () => { S.spires.length = 0; hold(px, py); }); S.phase = 1; S.gapOff = null; return { blows, gap: S.stat.waveGap - g0, at: [px, py] };`);
    ok(r.blows.length === 0 && r.gap === TU.imWaves[1], 'Impact: standing in its rings\' dark gaps, they pass', r);
    r = await T.ev(`${RESET} const m = S.m; let px = m.x + 1.5, py = m.y + 5; hold(px, py); const A = SB.test.force('impact'); step(A.t4 + 0.12, () => hold(px, py)); const sp = S.spires[0], w = S.waves.find(q => q.tag === 'impact') || null; const c0 = S.stat.waveCover, n = S.spires.length;
      const dx = sp.x - A.tx, dy = sp.y - A.ty, d = Math.hypot(dx, dy); px = sp.x + dx / d * 1.15; py = sp.y + dy / d * 1.15; const blows = blowsOf(2.2, () => { for (const q of S.waves) q.gaps = []; hold(px, py); });   /* (no gaps: the spire's lee alone) */ return { n, blows, cover: S.stat.waveCover - c0, spires: S.spires.length };`);
    ok(r.n === TU.spires[0] && r.blows.length === 0 && r.cover === 1, 'Impact: molten spires rise round the landing; standing in a spire\'s lee, the ring passes', r);
    r = await T.ev(`${RESET} const m = S.m; hold(m.x + 1.5, m.y + 5); const A = SB.test.force('impact'); step(A.t4 + 0.3, () => hold(m.x + 1.5, m.y + 5)); const sp = S.spires[0]; hold(sp.x + 0.05, sp.y); step(0.2, () => { me.inv = 0; }); const d = Math.hypot(me.x - sp.x, me.y - sp.y); return { d, r: sp.r };`);
    ok(r.d >= r.r, 'Impact: a spire is an obstacle: the pet is pushed out of it', r);
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m, px = m.x + 1.5, py = m.y + 5; hold(px, py); const A = SB.test.force('impact'); const v0 = S.stat.volcHit; const blows = blowsOf(A.dur + 0.5, () => { S.spires.length = 0; hold(px, py); }); S.phase = 1; return { blows, volc: S.stat.volcHit - v0, n: A.n };`);
    ok(r.volc === 1 && r.blows.some(b => near(b, unit * TU.volcK)), 'Impact (phase III): the eruption on the spot strikes a pet that stays', r);
    // ---- the phase-break roar: a gapped ring
    r = await T.ev(`${RESET} const m = S.m; hold(m.x, m.y + 5); const A = SB.test.start('roar'); step(0.5); const w = S.waves.find(q => q.tag === 'roar'); let a = 0; for (let i = 0; i < 64; i++) { const an = i / 64 * 6.283; if (w.gaps.every(q => Math.abs(((an - q.a + 9.42) % 6.283) - 3.1416) > q.w / 2 + 0.25) && Math.sin(an) > 0.2) { a = an; break; } }
      const px = m.x + Math.cos(a) * 5, py = m.y + Math.sin(a) * 5; const blows = blowsOf(1.5, () => hold(px, py)); S.acts.length = 0; return { blows, n: S.stat.roarHit };`);
    ok(r.blows.length === 1 && near(r.blows[0], unit * TU.roarK), 'the roar: its ring strikes a pet out of its gaps for roarK x unit', r);
  } catch (e) { ok(false, 'powers threw', String(e && e.stack || e).slice(0, 600)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- Ruin Pressure, the vents, the Cataclysm, burning ground, the Wrath
  if (want('state')) { T = await fresh();
  try {
    const TU = await T.ev(`return SB.TUNE;`), unit = TU.dmg;
    let r = await T.ev(`${RESET} const m = S.m, px = m.x, py = m.y + 4.6; hold(px, py); SB.test.force('charge'); step(4, () => { hold(px, py); me.inv = 0; me.hp = D.ST.hp; }); return { ruin: +S.ruin.toFixed(2) };`);
    ok(r.ruin >= TU.ruinHit + TU.ruinLand && r.ruin < TU.ruinHit + TU.ruinLand + 16, 'Ruin: a blow on the pet builds ruinHit, a heavy landing ruinLand (and a little with time and the burning ground\'s ticks)', r);
    r = await T.ev(`${RESET} const m = S.m; S.ruin = 60; const V = SB.test.force('vent'); const yaw = S.B.yaw; hold(m.x + Math.cos(yaw) * 3, m.y + Math.sin(yaw) * 3); const r0 = S.ruin, h0 = m.hp; D.hitMon(m, 100, { noCrit: true }); const dHit = h0 - m.hp; step(0.1); D.hitMon(m, 100, { noCrit: true }); const r1 = S.ruin;
      hold(m.x - Math.cos(yaw) * 3, m.y - Math.sin(yaw) * 3); D.hitMon(m, 100, { noCrit: true }); step(0.1); const r2 = S.ruin; step(V.dur + 0.2); const h1 = m.hp; D.hitMon(m, 100, { noCrit: true }); const dPlain = h1 - m.hp; return { r0, r1, r2, dHit, dPlain, vent: !!S.vent, stun: m.stunT, drain: S.stat.drain };`);
    ok(near(r.r0 - r.r1, TU.ventDrain * 2, 0.6) && near(r.r1, r.r2, 0.2), 'the vent: blows from in front drain ventDrain each from the Ruin; from behind none', r);
    ok(near(r.dHit / r.dPlain, 1.5, 0.05) && !r.vent && r.stun === 0, 'the vent: the bared heart takes x1.5 (the engine\'s stunned boss); it ends on time', r);
    r = await T.ev(`${RESET} const m = S.m, px = m.x, py = m.y + 4.6; hold(px, py); S.ruin = TU.ruinMax - 1; SB.test.gain(2); const cata = S.cata; const A = SB.test.force('charge'); const blows = blowsOf(4, () => hold(px, py)); return { cata, blows, burn: S.stat.burnHit, ruin: S.ruin };`);
    ok(r.cata === TU.cataDur && near(r.blows[0], unit * TU.chK * TU.cataK) && r.burn === TU.burnN && r.blows.filter(b => near(b, unit * TU.burnK, 0.05)).length === TU.burnN, 'the Cataclysm: at full Ruin, blows x cataK, and each sets the pet burning (burnN ticks of burnK)', r);
    r = await T.ev(`const t = S.cata; step(t + 0.2, () => { me.hp = D.ST.hp; me.inv = 0; }); step(0.2); return { cata: S.cata, ruin: S.ruin, vent: !!S.vent, dur: S.vent && S.vent.dur };`);
    ok(r.cata === 0 && near(r.ruin, TU.ruinAfter, 1) && r.vent && near(r.dur, TU.ventCata, 0.01), 'the Cataclysm: after cataDur it vents and the Ruin falls to ruinAfter', r);
    r = await T.ev(`${RESET} const m = S.m; hold(m.x, m.y + 4.6); const A = SB.test.force('charge'); step(A.wind + A.ct + 0.4, () => { hold(m.x + 9, m.y); me.inv = 0; }); const q = S.trails[Math.floor(S.trails.length / 2)]; const blows = blowsOf(1.4, () => hold(q.x, q.y)); return { n: S.trails.length, blows };`);
    ok(r.n >= 3 && r.blows.length >= 2 && r.blows.every(b => near(b, unit * TU.trailK, 0.3)), 'burning ground: a pet standing in the charge\'s trail takes ticks of trailK x unit', r);
    // ---- Wrath of the Fallen: refuges; in one nothing; outside a crushing blow never lethal from full; it cannot be harmed through it
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m; hold(m.x + 3, m.y + 4); const J = SB.test.force('wrath'), UT = SAMAEL_MOVES.UT; const refs = J.refs.map(q => ({ x: +q.x.toFixed(2), y: +q.y.toFixed(2), kind: q.kind, inside: SB.test.AR && Math.pow(Math.abs((q.x - SB.test.AR.cx) / SB.test.AR.rx), 2.6) + Math.pow(Math.abs((q.y - SB.test.AR.cy) / SB.test.AR.ry), 2.6) < 1 }));
      const h0 = SB.test.realHp(); D.hitMon(m, 5000, { noCrit: true }); step(0.05); const h1 = SB.test.realHp(); const q = J.refs[1]; const H0 = g.dmgTaken; step(UT.hit + 0.8, () => { hold(q.x, q.y); me.inv = 0; }); return { refs, h0, h1, took: g.dmgTaken - H0, safe: S.stat.wrathSafe, hit: S.stat.wrathHit, mode: S.mode };`);
    ok(r.refs.length === 1 + TU.coolN && r.refs[0].kind === 'arch' && r.refs.every(q => q.inside) && near(r.h0, r.h1, 1) && r.took === 0 && r.safe === 1 && r.hit === 0, 'Wrath: refuges behind the horn monument and on two cooled channels; in one, nothing; it cannot be harmed through it', r);
    T.errors.length = 0; await T.browser.close(); T = await fresh();
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m; hold(m.x + 3, m.y + 4); const J = SB.test.force('wrath'), UT = SAMAEL_MOVES.UT; const q = J.refs[0]; const H0 = g.dmgTaken; step(UT.hit + 0.8, () => { hold(q.x, q.y); me.inv = 0; }); return { took: g.dmgTaken - H0, safe: S.stat.wrathSafe };`);
    ok(r.took === 0 && r.safe === 1, 'Wrath: behind the horn monument, nothing', r);
    await T.browser.close(); T = await fresh();
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m; const J = SB.test.force('wrath'), UT = SAMAEL_MOVES.UT; let best = null, bd = -1; for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283, x = SB.test.AR.cx + Math.cos(a) * 3.5, y = SB.test.AR.cy + Math.sin(a) * 2.5; const d = Math.min(...J.refs.map(p => Math.hypot(p.x - x, p.y - y))); if (d > bd) { bd = d; best = { x, y }; } }
      const H0 = g.dmgTaken; step(UT.hit + 0.8, () => { hold(best.x, best.y); }); return { took: g.dmgTaken - H0, hp: me.hp, max: D.ST.hp, hit: S.stat.wrathHit, dead: me.dead };`);
    ok(r.hit === 1 && r.took >= r.max * TU.wrK - 1 && !r.dead && r.hp >= 1, 'Wrath: outside a refuge, a crushing blow (wrK of its health), never lethal from full', r);
    await T.browser.close(); T = await fresh();
    r = await T.ev(`${RESET} S.phase = 3; const m = S.m; me.hp = D.ST.hp * 0.5; const J = SB.test.force('wrath'), UT = SAMAEL_MOVES.UT; for (const p of J.refs) p.x += 60; step(UT.hit + 0.8, () => { if (!me.dead) hold(S.m.x + 3, S.m.y + 3); }); return { dead: me.dead };`);
    ok(r.dead, 'Wrath: from half health it can knock the pet out', r);
  } catch (e) { ok(false, 'state threw', String(e && e.stack || e).slice(0, 600)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- phases, bars, the Wrath and the fall: the gate completes and Samael is unlocked; the clean-up after the fall
  if (want('phases')) { T = await fresh();
  try {
    const TU0 = await T.ev(`return SB.TUNE;`);
    const r = await T.ev(`const m = S.m, out = {}, UT = SAMAEL_MOVES.UT; hold(m.x, m.y + 5); const bars = () => Math.ceil(SB.test.realHp() / S.barHP - 1e-9), refill = () => { me.hp = D.ST.hp; me.inv = 0; };
      const RS = P.riftState(); out.before = { gate: RS.gates.caldera || 0, anima: (P.st.animas.have || {}).aries || 0 };
      out.bars0 = bars(); m.hp = m.maxhp * 0.67; step(0.2); D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.ph2 = S.phase; out.roar2 = S.acts.length && S.acts[0].kind; step(3.0, refill); out.over2 = S.over > 0; out.bars1 = bars();
      step(9, refill); m.hp = m.maxhp * 0.34; D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.ph3 = S.phase; step(1.8, refill); out.cata3 = S.cata > 0; step(14, refill);
      m.hp = m.maxhp * 0.06; D.hitMon(m, m.maxhp * 0.02, { noCrit: true }); step(0.1); out.wrath = !!S.wr; out.pad = !!S.pad; const q = S.wr ? S.wr.refs[0] : { x: m.x, y: m.y + 5 };
      step(UT.p5 - 0.2, () => { hold(q.x, q.y); refill(); }); out.objs0 = (D.RIFT && D.RIFT.objs || []).filter(o => /^sb/.test(o.kind)).length; out.modeW = S.mode;
      const S0 = S; step(0.5); out.mode = S0.mode; out.cine = g.cineT > 0; step(4.5); out.won = g.won; out.mode2 = S0.mode; out.cine2 = g.cineT;
      out.objs1 = (D.RIFT && D.RIFT.objs || []).filter(o => /^sb/.test(o.kind)).length; out.inst = !!S0.inst; out.active = SB.active(); out.dead = m.dead; out.guard = !!m.guardFn; out.burn = !!S0.burn;
      let n = 0; while (P.arc.state === 'play' && n++ < 600) U.update(1 / 30); out.state = P.arc.state;
      out.after = { gate: RS.gates.caldera || 0, anima: (P.st.animas.have || {}).aries || 0 }; return out;`);
    ok(r.bars0 === TU0.bars && r.ph2 === 2 && r.roar2 === 'roar' && r.over2 && r.ph3 === 3 && r.cata3, 'phases: II at 66% (a roar, then the Overdrive), III at 33% (a roar, then the Cataclysm State)', r);
    ok(r.wrath && r.pad && r.objs0 === 3 && r.modeW === 'fight', 'the last phase ends in Wrath of the Fallen at 5% (it cannot be harmed through it)', r);
    ok(r.mode === 'dead' && r.cine && r.won && r.mode2 === 'over' && r.cine2 === 0 && r.objs1 === 0 && !r.inst && !r.active && r.dead && !r.guard && !r.burn, 'the fall: it stands, roars and dissolves, then winStage; every hold, object and effect given back', r);
    ok(!r.before.gate && !r.before.anima && r.state === 'end' && r.after.gate === 1 && r.after.anima >= 1, 'the win completes the gate (gates.caldera) and unlocks Samael (animas.have.aries)', r);
  } catch (e) { ok(false, 'phases threw', String(e && e.stack || e).slice(0, 600)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- the pet's death mid-power, then the stage's end mid-power
  if (want('cleanup')) { T = await fresh();
  try {
    let r = await T.ev(`${RESET} const m = S.m; hold(m.x + 2, m.y + 1.5); S.ruin = 99; SB.test.gain(2); SB.test.force('over'); step(1.6, () => hold(m.x + 2, m.y + 1.5)); const A = SB.test.start('perd'); step(0.5, () => hold(m.x + 2, m.y + 1.5)); const busy = S.acts.length;
      me.hp = 1; me.inv = 0; step(2, () => { if (!me.dead) { hold(m.x + 2, m.y + 1.5); me.inv = 0; } }); return { busy, dead: me.dead, acts: S.acts.length, vols: S.vols.filter(v => !v.dead && !v.fired).length, burn: !!S.burn, active: SB.active() };`);
    ok(r.busy > 0 && r.dead && r.acts === 0 && r.vols === 0 && !r.burn, 'the pet\'s death: its powers called off, no burn left', r);
  } catch (e) { ok(false, 'death threw', String(e && e.message || e)); }
  await T.browser.close();
  T = await fresh();
  try {
    const r = await T.ev(`${RESET} const m = S.m; hold(m.x + 2, m.y + 5); S.ruin = 99; SB.test.gain(2); const A = SB.test.force('impact'); step(A.t2 + 0.2, () => hold(m.x + 2, m.y + 5)); const before = SB.active(), z0 = S.B.z, gg = g, mm = m, heat0 = D.RIFT.self.mod.S.heat;
      P.closeArcade(true); await new Promise(r => setTimeout(r, 300)); return { before, z0, heat0, after: SB.active(), S: !!SB.test.S, boss: !!(gg.boss && !gg.boss.dead), guard: !!mm.guardFn, bar: !!mm.ownBar, live: !!window.ARIES_GATE.live, cached: window.ARIES_PROPS.stats.cached };`);
    ok(r.before && r.z0 > 1 && !r.after && !r.S && !r.boss && !r.guard && !r.bar && !r.live && r.cached === 0, 'the stage\'s end (the map closed mid-leap, in the Cataclysm): the fight let go at once, the gate released', r);
  } catch (e) { ok(false, 'exit threw', String(e && e.message || e)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- Samael's GPU buffers: up while it is drawn, freed when it falls (the software rasteriser forced on)
  if (want('gpu')) { T = await fresh({ gl: true });
  try {
    await T.M(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const r = await T.ev(`const G = window.SAMAEL_GL, out = { gl: G.usable(), up: G.gpuCount() }; SB.test.fall(false); step(6); out.after = G.gpuCount(); out.mode = SB.test.S ? SB.test.S.mode : null; out.won = g.won; return out;`);
    ok(r.gl && r.up > 0 && r.after === 0 && r.mode === 'over' && r.won, 'GPU: Samael\'s buffers are up while it is drawn and freed when it falls (SAMAEL_GL.release through its effect layer\'s stop)', r);
  } catch (e) { ok(false, 'gpu threw', String(e && e.message || e)); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 5))); if (T.errors.length) { fails++; process.exitCode = 1; }
  await T.browser.close(); }
  // ---- the same scripted fight at dt 1/60 and dt 1/4
  if (want('dt')) { const res = {};
  for (const fps of [60, 4]) { T = await fresh();
    try { res[fps] = await T.ev(`${RESET} ${SPOT} const dt = arg, m = S.m, out = {}; let px = m.x, py = m.y + 4.6; hold(px, py); let b = blowsOf(0.01); SB.test.force('charge'); b = blowsOf(4.5, () => hold(px, py), dt); out.charge = b.slice(0, 1);
        home(); px = m.x + 0.3; py = m.y + 5.5; let A = SB.test.force('perd'); out.perd = blowsOf(A.dur + 1.5, () => hold(px, py), dt).length;
        home(); A = SB.test.force('over'); out.over = blowsOf(A.wind + TU.ovDur[0] + 0.3, () => hold(m.x + 2.5, m.y + 1.5), dt).length; out.vent = (step(0.3, null, dt), !!S.vent);
        home(); px = m.x + 1.5; py = m.y + 5; A = SB.test.force('impact'); out.impact = blowsOf(A.t4 + 0.05, () => hold(px, py), dt).slice(0, 1);
        home(); S.gapOff = 0; px = m.x + 1.5; py = m.y + 5; A = SB.test.force('impact'); step(A.t4 - 0.1, () => { if (A.lock && !A.moved) { A.moved = 1; const q = spot(A, false, 5.5); px = q.x; py = q.y; } hold(px, py); }, dt);
        out.wave = blowsOf(2.5, () => { S.spires.length = 0; hold(px, py); }, dt).length; S.gapOff = null;
        home(); S.phase = 3; const J = SB.test.force('wrath'), q = J.refs[0], H0 = g.dmgTaken; step(SAMAEL_MOVES.UT.hit + 0.8, () => hold(q.x, q.y), dt); out.wrath = Math.round(g.dmgTaken - H0); out.safe = S.stat.wrathSafe;
        return out;`, 1 / fps); } catch (e) { res[fps] = String(e); }
    if (T.errors.length) { console.log('errors', JSON.stringify(T.errors.slice(0, 3))); fails++; process.exitCode = 1; } await T.browser.close(); }
  const a = res[60], b = res[4];
  ok(a && b && a.charge.length === 1 && a.charge[0] === b.charge[0] && a.perd === b.perd && a.perd > 0 && Math.abs(a.over - b.over) <= 1 && a.over > 3 && a.vent && b.vent && a.impact[0] === b.impact[0] && a.wave === b.wave && a.wave > 0 && a.wrath === 0 && b.wrath === 0 && a.safe === 1 && b.safe === 1,
    'frame-rate independence: the same blows and timing at dt 1/60 and 1/4', res); }
  console.log(fails ? `${fails} FAILED` : 'ALL OK');
})();
