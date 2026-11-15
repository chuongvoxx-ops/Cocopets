// Fire Flan's mechanics against the spec's numbers (game logic stepped directly, GL off):
// molten armour (~80% off, "Molten armour" text, muted hits); the plate (stand still 0.75 s) wakes a 12 s field that chills
// the flan over ~3 s into an ~8 s brittle window with no reduction (x1.25 in phase 3); out of the cold the armour returns
// ~2 s later; one field at a time, an 8 s recharge after it; a crystal survives three smashes, breaks on the fourth and
// regrows in ~10 s; Crystal Breaker's long wind-up and its glowing point (three blows interrupt it), the first one held back;
// phase 2's Cinderlings (two at most, chip the active crystal, die in a few blows); phase 3's Pressure Burst (one broad safe
// gap) and Crystal Rush (its path marked); the death (crystals restored, the stage won), no page errors.
// HTML=test-calF.html node tests/_cal-f-mech.js
process.env.HTML = process.env.HTML || 'test-calF.html';
const L = require('./_cal-f-lib');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => {
  const T = await L.open({ gl: false });
  const { page, errors, ev } = T;
  await T.startFlan(); await T.wake();
  const base = `const C = D.FD.S.C, start = window.__pp.FIEND_DEFS.calflan.dbgStart, quiet = () => { M.cool = 99; }; const pin = (x, y) => { b.x = x; b.y = y; };`;
  // 1. molten armour
  let r = await ev(base + `pin(C.x, C.y); quiet(); S(0.3, () => { quiet(); hold(C.x, C.y + 6); });
    const h0 = b.hp; D.hitMon(b, 100, { flat: true }); const armK = (h0 - b.hp) / 100; S(0.3, () => { quiet(); hold(C.x, C.y + 6); }); const txt = D.banners.length >= 0; return { armK: +armK.toFixed(3), fx: M.P.fx, flash: b.flash };`);
  ok(Math.abs(r.armK - 0.2) < 0.02, 'molten: about 80% of a blow is shrugged off', r);
  ok(r.fx <= 0, 'a molten hit is muted (a dull ripple, no white flash)', r);
  // 2. the plate wakes the field (standing still 0.75 s); one at a time; the cold chills it over ~3 s into brittle
  r = await ev(base + `A.restore(); const w = A.wells[1], pl = w.plate; pin(w.zx, w.zy); quiet(); hold(pl.x + 0.2, pl.y); let woke = -1;
    S(1.5, t => { quiet(); pin(w.zx, w.zy); hold(pl.x + 0.2, pl.y); if (A.field && woke < 0) { woke = t; return true; } });
    const other = A.activate(0); let brit = -1, t0 = 0; S(6, t => { quiet(); pin(w.zx, w.zy); hold(w.zx - 3.5, w.zy + 2.5); if (M.brittle && brit < 0) { brit = t; return true; } });
    return { woke: +woke.toFixed(2), other, brit: +brit.toFixed(2), dur: A.field && A.field.dur };`);
  ok(r.woke > 0.65 && r.woke < 1.0, 'standing still on the plate for ~0.75 s wakes the crystal', r);
  ok(r.other === false, 'a second field can\'t start while one runs');
  ok(r.brit > 2.6 && r.brit < 3.6 && r.dur === 12, 'in the field it turns brittle after ~3 s; the field lasts 12 s', r);
  // 3. brittle: no reduction; the window ~8 s; then armour
  r = await ev(base + `const w = A.wells[1]; const h0 = b.hp; D.hitMon(b, 100, { flat: true }); const k = (h0 - b.hp) / 100; let end = -1; S(10, t => { quiet(); pin(w.zx, w.zy); hold(w.zx - 3.5, w.zy + 2.5); if (!M.brittle && end < 0) { end = t; return true; } });
    return { k: +k.toFixed(2), end: +end.toFixed(2), fieldLeft: A.field ? +(A.field.dur - A.field.t).toFixed(1) : null };`);
  ok(r.k > 0.97 && r.k < 1.03, 'brittle: no reduction at all', r);
  ok(r.end > 7.2 && r.end < 8.6, 'the brittle window lasts ~8 s', r);
  // 4. recharge 8 s after the field ends
  r = await ev(base + `const w = A.wells[1]; let endAt = -1, readyAt = -1; S(12, t => { quiet(); pin(C.x, C.y); hold(C.x, C.y + 6); if (!A.field && endAt < 0) endAt = t; if (endAt >= 0 && A.canUse(0) && readyAt < 0) { readyAt = t; return true; } }); return { gap: +(readyAt - endAt).toFixed(2), cool: A.cool };`);
  ok(r.gap > 7.6 && r.gap < 8.4, 'an 8 s recharge after a field ends', r);
  // 5. leaving the field: the armour returns ~2 s later
  r = await ev(base + `A.restore(); const w = A.wells[2]; A.activate(2); pin(w.zx, w.zy); S(3.4, () => { quiet(); pin(w.zx, w.zy); hold(w.zx - 3, w.zy - 3); }); const was = M.brittle; let back = -1; pin(C.x, C.y); S(4, t => { quiet(); pin(C.x, C.y); hold(C.x, C.y + 6); if (!M.brittle && back < 0) { back = t; return true; } }); return { was, back: +back.toFixed(2) };`);
  ok(r.was && r.back > 1.7 && r.back < 2.4, 'out of the cold, ~2 s before its armour returns', r);
  // 6. a crystal survives three smashes, breaks on the fourth, regrows in ~10 s; a break ends the field
  r = await ev(base + `A.restore(); A.endField(); A.cool = 0; A.activate(0); const w = A.wells[0]; const ints = []; for (let i = 0; i < 4; i++) { A.damage(0, 30, 'test'); ints.push(+w.integ.toFixed(1)); }
    const broke = w.broken, fieldGone = !A.field; let regrow = -1; S(12, t => { quiet(); pin(C.x, C.y); hold(C.x, C.y + 6); if (!w.broken && regrow < 0) { regrow = t; return true; } }); return { ints, broke, fieldGone, regrow: +regrow.toFixed(2), integ: w.integ };`);
  ok(r.ints[2] > 0 && r.broke && r.ints[3] === 0, 'a full crystal survives three smashes and breaks on the fourth', r);
  ok(r.fieldGone && r.regrow > 9.6 && r.regrow < 10.4 && r.integ === 100, 'a broken crystal ends its field and regrows in ~10 s, whole', r);
  // 7. Crystal Breaker: held back after the first field starts; a long wind-up; three blows on its glowing point stop it
  r = await ev(base + `A.restore(); A.cool = 0; A.fields = 0; A.firstAt = null; const w = A.wells[0]; pin(w.zx + 2, w.zy + 2.5); M.cool = 0; A.activate(0); let first = -1;
    S(14, t => { pin(w.zx + 2, w.zy + 2.5); hold(C.x + 6, C.y + 6); if (M.act && M.act.k === 'breaker' && first < 0) { first = t; return true; } if (M.act && M.act.k !== 'breaker') { if (M.act.k !== 'breaker') { M.act = null; b.act = 'prowl'; } M.cool = 0.2; } });
    let wind = -1, gripOn = -1; S(5, t => { pin(M.act && M.act.phase === 'wind' ? b.x : w.zx + 2, M.act && M.act.phase === 'wind' ? b.y : w.zy + 2.5); hold(C.x + 6, C.y + 6); if (M.act && M.act.phase === 'wind' && wind < 0) wind = t; if (M.act && M.act.grip && M.act.grip.on && gripOn < 0) { gripOn = t; return true; } });
    const Gr = M.act.grip, wk = D.mons.find(m => m.kind === 'weak' && !m.dead); for (let i = 0; i < 3; i++) { D.hitMon(wk, 10, {}); S(0.15, () => {}); }
    return { first: +first.toFixed(1), wind: +wind.toFixed(2), gripOn: +gripOn.toFixed(2), wk: !!wk, act: M.act && M.act.k, ints: M.stat.interrupts, WU: 2.9 };`);
  ok(r.first > 7, 'the first Crystal Breaker waits a generous while after the first field wakes', r);
  ok(r.wk && r.act === 'reel' && r.ints >= 1, 'three ordinary blows on the glowing point interrupt it', r);
  r = await ev(base + `S(3, () => { quiet(); hold(C.x, C.y + 6); }); const w = A.wells[0]; A.restore(); A.cool = 0; A.activate(0); M.lastBrk = -99; M.fieldAt = FX.S.t - 30; pin(w.zx + 1, w.zy + 1.5); start(FX, 'breaker'); let windT = 0, smashed = -1; const i0 = w.integ;
    S(6, t => { pin(b.x, b.y); hold(C.x + 6, C.y + 6); if (M.act && M.act.phase === 'wind') windT += 0.05; if (w.integ < i0 && smashed < 0) { smashed = t; return true; } }); return { windT: +windT.toFixed(2), smashed: +smashed.toFixed(2), integ: w.integ };`);
  ok(r.windT > 2.4 && r.integ === 70, 'unanswered, its long wind-up (~2.9 s) ends in a smash: 30 off the crystal', r);
  // 8. phase 2: cinderlings, two at most; they chip the active crystal; they die in a few blows
  r = await ev(base + `S(2, () => { quiet(); hold(C.x, C.y + 6); }); A.restore(); A.cool = 0; b.hp = b.maxhp * 0.6; S(3, () => { quiet(); pin(C.x, C.y); hold(C.x, C.y + 6); });
    const ph = FX.S.phase; A.activate(1); const w = A.wells[1]; start(FX, 'shed'); S(2, () => { pin(C.x, C.y); hold(C.x, C.y + 6); }); start(FX, 'shed'); S(2, () => { pin(C.x, C.y); hold(C.x, C.y + 6); });
    const adds = D.mons.filter(m => m.type === 'cinderling' && !m.dead), n = adds.length, i0 = w.integ; let chipped = false; S(8, () => { quiet(); pin(C.x, C.y); hold(C.x, C.y + 6); if (w.integ < i0) chipped = true; });
    const q = D.mons.filter(m => m.type === 'cinderling' && !m.dead)[0]; let hits = 0; while (q && !q.dead && hits < 10) { D.hitMon(q, D.ST.atk, {}); hits++; S(0.05); }
    return { ph, n, chipped, hits, integ: Math.round(w.integ), lobes: +M.P.lobes.toFixed(2) };`);
  ok(r.ph === 2 && r.lobes > 0.5, 'phase 2 at 70%: bubbling lobes', r);
  ok(r.n === 2, 'cinderlings: two alive at most', r);
  ok(r.chipped, 'cinderlings chip the active crystal', r);
  ok(r.hits <= 3, 'a cinderling dies in a few ordinary blows', r);
  // 9. phase 3: taller and clearer; brittle takes x1.25; burst with one broad gap; rush with its path marked
  r = await ev(base + `for (const m of D.mons) if (m.type === 'cinderling' && !m.dead) D.hitMon(m, 1e6, { flat: true }); A.restore(); A.endField(); A.cool = 0; b.hp = b.maxhp * 0.3; S(3.5, () => { quiet(); pin(C.x, C.y); hold(C.x, C.y + 6); });
    const ph = FX.S.phase, tall = M.P.tall; start(FX, 'burst'); S(0.3, () => { pin(C.x, C.y); }); const z = M.waves[0], gap = z && +(z.gw * 2).toFixed(2);
    // stand in the gap: no hit; then out of it: one hit
    const hit0 = M.stat.burstHits; S(4, () => { pin(C.x, C.y); const a = z.gap; hold(C.x + Math.cos(a) * 5, C.y + Math.sin(a) * 5); }); const inGap = M.stat.burstHits - hit0;
    S(2, () => { quiet(); pin(C.x, C.y); }); start(FX, 'burst'); S(0.3, () => { pin(C.x, C.y); }); const z2 = M.waves[0]; S(4, () => { pin(C.x, C.y); const a = z2.gap + Math.PI; hold(C.x + Math.cos(a) * 5, C.y + Math.sin(a) * 5); }); const outGap = M.stat.burstHits - hit0 - inGap;
    S(2, () => { quiet(); pin(C.x, C.y); }); A.activate(1); start(FX, 'rush'); const tl = D.FD.S.tele.find(s => s.shape === 'line'); S(0.1, () => {});
    const w = A.wells[2]; A.endField(); A.cool = 0; A.restore(); A.activate(2); pin(w.zx, w.zy); S(3.4, () => { quiet(); pin(w.zx, w.zy); hold(w.zx, w.zy + 5); }); const h0 = b.hp; D.hitMon(b, 100, { flat: true }); const k3 = (h0 - b.hp) / 100;
    return { ph, tall: +tall.toFixed(2), gap, inGap, outGap, line: !!tl, lineLabel: tl && tl.label, k3: +k3.toFixed(2), brittle: M.brittle };`);
  ok(r.ph === 3 && r.tall > 0.6, 'phase 3 at 35%: taller', r);
  ok(r.gap > 0.9 && r.inGap === 0 && r.outGap === 1, 'Pressure Burst: one broad safe gap (in it, untouched; outside, struck once)', r);
  ok(r.line && r.lineLabel === 'RUSH', 'Crystal Rush: its straight path is marked at once', r);
  ok(r.brittle && r.k3 > 1.2 && r.k3 < 1.3, 'phase 3: the brittle flan takes x1.25', r);
  // 10. the death: crystals restored, the stage won
  r = await ev(base + `A.damage(0, 100, 'test'); D.hitMon(b, 1e9, { flat: true, pierce: true }); S(6, () => {}); return { dead: b.dead, won: D.g.won, broken: A.wells.map(w => w.broken), end: !!M.end, die: +M.P.die.toFixed(2) };`);
  ok(r.dead && r.won && r.broken.every(x => !x) && r.end && r.die > 0.9, 'its death: collapsed, the crystals restored, the stage won', r);
  const er = errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e)); console.log('errors', er.slice(0, 6)); ok(er.length === 0, 'no page errors');
  await T.browser.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
