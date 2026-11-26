// (v451 TM, v457 TM4) Tiamat's rules, on the Tower (the 2D path: the rules do not depend on the picture; the GPU path's cleanup is checked by
// tests/_tm-shots.js). The arcade's loop is stopped and the summon's effect stepped by hand (ELEM.update), the monsters held still and
// crits off (Math.random held high while it is stepped), so every run is exact:
//   - the row (cost, the cooldown 45 s set when the cast commits), six-star only (ELEM_SIX), the short gesture
//   - per tier (evo 1 / 4 / 7): 6 / 8 / 10 lightning bolts while it flies, each picking its target (a glow on the floor) TUNE.tell before
//     it falls, each striking at its time, each hitting each enemy at most once (the target and a small splash); then the twirl and the
//     plunge (no hits), one impact at TUNE.impact (one Map for the event), then 1 / 2 / 3 aftershock pulses TUNE.pulseGap apart, each
//     pulse each monster once, the impact the largest single hit, the damage per monster exactly its hits' sum
//   - dt 1/60 vs 1/4: the same hits and the same damage on every monster
//   - a boss takes the damage but keeps its crowd-control immunity (no stun)
//   - the caster's defeat mid-cast: nothing lands after it (no bolt, impact or pulse), the effect gone within a second
//   - the footprint: only floor tiles (walkable, explored, in sight), capped by TUNE.patR
//   - the damage per enemy per tier (x DK): a crowd, and one enemy alone (every bolt finds it: the most one enemy can take)
// usage: HTML=<test html> node tests/_tm-tiamat.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('console', m => { if (/Tiamat/.test(m.text())) errors.push(m.text()); });
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 30000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Tia'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.st.dun.god = true; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2600);
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; });
  const rowInfo = await page.evaluate(() => { const P = window.__pp, mv = P.ELEM_LIST.thunder.ey_tiamat, six = P.skillsK ? P.skillsK.ELEM_SIX.thunder.ult : null, I = P.ELEM_IMPL.thunder.ult.tiamat;
    return { has: !!mv, cost: mv && mv.cost, cd: mv && mv.cd, lv: mv && mv.lv, six: six ? six.includes('tiamat') : null, impl: typeof I, tune: I && I.TUNE }; });
  ok(rowInfo.has && rowInfo.cost === 100 && rowInfo.cd === 45 && rowInfo.impl === 'function' && rowInfo.lv > 0, 'the row: Tiamat, Thunder Ult, 100 MP, cooldown 45 s, implemented', { cost: rowInfo.cost, cd: rowInfo.cd, lv: rowInfo.lv });
  ok(rowInfo.six === true, 'six-star only: on the Thunder six-star Ult list (ELEM_SIX)', rowInfo.six);
  const TU = rowInfo.tune;
  ok(TU.cd === 45 && TU.cd === rowInfo.cd, 'the cooldown in TUNE matches the row (45 s)');
  ok(TU.form1 < TU.bolt0 - TU.tell + 0.4 && TU.bolt1 < TU.tw0 && TU.tw0 < TU.tw1 && TU.tw1 < TU.impact, `the timeline: forms by ${TU.form1} s, bolts ${TU.bolt0}..${TU.bolt1} s, the twirl ${TU.tw0}..${TU.tw1} s, the plunge to the impact at ${TU.impact} s`);

  const run = (evo, dt, opt) => page.evaluate(async ([evo, dt, opt]) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, X = D.ELEM.H.X;
    if (!X.__isExp0) X.__isExp0 = X.isExp; X.isExp = opt.fog ? X.__isExp0 : () => true;
    if (!window.__tmRoom) window.__tmRoom = D.M.rooms.reduce((a, r) => (r.w * r.h > a.w * a.h ? r : a));
    const R = window.__tmRoom, T = { x: R.x + R.w / 2, y: R.y + R.h / 2 }; me.x = T.x - 3.5; me.y = T.y; me.dead = false; me.hp = D.ST.hp; me.mp = 999; D.g.cdU = 0; me.face = 1;
    D.cam.x = me.x; D.cam.y = me.y;   // (the camera on the pet: the flight is fitted to its view)
    const L = D.mons.filter(m => !m.boss && !m.dead), spots = opt.spots, used = [];
    for (let i = 0; i < L.length; i++) { const m = L[i]; if (i < spots.length) { m.x = T.x + spots[i][0]; m.y = T.y + spots[i][1]; m.hp = m.maxhp = 1e7; m.kbx = m.kby = 0; m.stun = 0; m.boss = !!spots[i][2]; m.act = 'chase'; used.push(m); } else { m.x = T.x + 80 + i; m.y = T.y + 80; } }
    for (const m of used) m.__hp0 = m.hp;
    const mv = P.ELEM_LIST.thunder.ey_tiamat, ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, evo, tier: evo >= 7 ? 2 : 1 });
    D.setKit('ult', ab); const MR = Math.random; Math.random = () => 0.999;
    let cd = null, gest = null, castOK = true;
    if (opt.real) { const mp0 = me.mp; D.useUlt(); cd = D.g.cdU; gest = me.castM; castOK = me.mp < mp0; D.ELEM.fx.length = 0; }
    // (the monsters' places from the floor map: 0, 1 in the impact, 2, 3 only in the pulses' reach, 4 far away, 5 a boss in the impact)
    let fx = null, I = P.ELEM_IMPL.thunder.ult.tiamat;
    if (opt.auto) { const W = I.lib.floorMap(D.ELEM.H, T.x, T.y, I.TUNE.patR), TU = I.TUNE;
      const near = W.tiles.filter(t => t.d < TU.impactR - 1.0 && !t.m).sort((p, q) => p.d - q.d), far = W.tiles.filter(t => t.d > TU.impactR + 0.65 && t.d < TU.patR - 0.25).sort((p, q) => p.d - q.d);
      const pick = [near[0], near[Math.floor(near.length * 0.8)], far[0], far[far.length - 1], { x: T.x + 40, y: T.y + 40 }, near[Math.floor(near.length / 2)]];
      used.forEach((m, i) => { const q = pick[i]; if (q) { m.x = q.x; m.y = q.y; } }); }
    D.ELEM.ult('tiamat', { a: 0, base: D.ST.atk * ab.mult, el: 'thunder', e8: 'thunder', evo, tx: T.x, ty: T.y, up: evo >= 7 });
    const rec = I.lib.last; fx = D.ELEM.fx.find(f => f.key === 'tiamat');
    const pos0 = used.map(m => [m.x, m.y]); let tt = 0, deadAt = -1, gone = -1;
    while (tt < 10) { if (opt.kill != null && tt >= opt.kill - 1e-9 && deadAt < 0) { me.dead = true; deadAt = tt; } D.ELEM.update(dt); tt += dt; used.forEach((m, i) => { m.x = pos0[i][0]; m.y = pos0[i][1]; }); if (gone < 0 && !D.ELEM.fx.includes(fx)) gone = tt; }
    Math.random = MR; me.dead = false;
    const out = { cd, gest, castOK, rec: { tier: rec.tier, pulses: rec.pulses, bolts: rec.bolts, tB: rec.tB, tw: rec.tw, tP: rec.tP, impactT: rec.impactT, DK: rec.DK, tiles: rec.tiles, impactN: rec.impactN, abort: rec.abort, T: rec.T, life: rec.life, plan: rec.plan }, gone, deadAt,
      tells: rec.tells.map(q => ({ k: q.k, t: +q.t.toFixed(4), i: used.indexOf(D.mons[q.id]) })), strikes: rec.strikes.map(q => ({ k: q.k, t: +q.t.toFixed(4), n: q.n, x: q.x, y: q.y, i: used.indexOf(D.mons[q.id]) })),
      mons: used.map((m, i) => ({ i, dmg: Math.round(m.__hp0 - m.hp), stun: +(m.stun || 0).toFixed(2), boss: !!m.boss, d: +Math.hypot(m.x - rec.T.x, m.y - rec.T.y).toFixed(2), x: m.x, y: m.y, r: m.r })),
      hits: rec.hits.map(h => ({ k: h.k, t: +h.t.toFixed(4), i: used.indexOf(D.mons[h.id]), boss: h.boss })), base: ab.mult * D.ST.atk };
    used.forEach(m => { m.boss = false; m.x = T.x + 60; m.y = T.y + 60; m.kbx = m.kby = 0; m.stun = 0; });
    if (fx) { const W = fx.S.W; let badT = 0; for (const t of W.tiles) if (D.blocked(t.x, t.y, 0.05, 0) || !X.isExp(t.x, t.y) || Math.hypot(t.x - W.cx, t.y - W.cy) > I.TUNE.patR + 0.01) badT++; out.floorBad = badT; }
    return out;
  }, [evo, dt, opt]);
  const spots = [[0.4, 0.3], [-2.0, 0.5], [0.2, 3.8], [-3.6, -2.4], [24, 24], [1.2, -0.8, true]];
  const per = {};
  const amt = (k, DK) => (k === 'impact' ? TU.impactK : /^pulse/.test(k) ? TU.pulseK : TU.boltK) * DK;
  for (const evo of [1, 4, 7]) {
    const a = await run(evo, 1 / 60, { spots, real: true, auto: true }), b = await run(evo, 1 / 4, { spots, auto: true });
    const NP = evo >= 7 ? 3 : evo >= 4 ? 2 : 1, NB = TU.bolts[evo >= 7 ? 2 : evo >= 4 ? 1 : 0], DK = a.rec.DK;
    ok(a.castOK && a.cd === 45 && a.gest <= 0.6, `evo ${evo}: the cast commits (MP spent), the cooldown 45 s starts with it, a short gesture (${a.gest} s)`, { cd: a.cd });
    ok(a.rec.pulses === NP && a.rec.bolts === NB && a.rec.tier === (evo >= 7 ? 3 : evo >= 4 ? 2 : 1), `evo ${evo}: tier ${a.rec.tier}: ${NB} bolts, one impact and ${NP} aftershock pulse(s)`, { bolts: a.rec.bolts, pulses: a.rec.pulses });
    // the bolts
    const tB = a.rec.tB;
    ok(tB.length === NB && tB.every((x, k) => Math.abs(x - (TU.bolt0 + (TU.bolt1 - TU.bolt0) * k / (NB - 1))) < 1e-9), `evo ${evo}: the bolts spread evenly over the flight, ${TU.bolt0} .. ${TU.bolt1} s`, tB.map(x => +x.toFixed(2)));
    ok(a.tells.length === NB && a.tells.every(q => q.t >= tB[q.k] - TU.tell - 1e-6 && q.t < tB[q.k] - TU.tell + 1 / 60 + 1e-3), `evo ${evo}: each bolt picks its target (its glow on the floor) ${TU.tell} s before it falls`, a.tells.map(q => [q.k, q.t, q.i]));
    ok(a.strikes.length === NB && a.strikes.every(q => q.t >= tB[q.k] - 1e-6 && q.t < tB[q.k] + 1 / 60 + 1e-3 && a.tells.find(w => w.k === q.k).t < q.t), `evo ${evo}: each bolt strikes at its time, after its tell`, a.strikes.map(q => [q.k, q.t, q.i, q.n]));
    const bk = k => a.hits.filter(h => h.k === 'bolt' + k);
    ok([...Array(NB).keys()].every(k => new Set(bk(k).map(h => h.i)).size === bk(k).length && bk(k).every(h => Math.abs(h.t - a.strikes.find(q => q.k === k).t) < 1e-6)), `evo ${evo}: each bolt hits each enemy at most once, at its strike`);
    ok([...Array(NB).keys()].every(k => bk(k).every(h => { const s = a.strikes.find(q => q.k === k), m = a.mons[h.i]; return Math.hypot(m.x - s.x, m.y - s.y) <= TU.boltR + m.r + 0.02; })), `evo ${evo}: a bolt hits only round its strike (its target and a splash of ${TU.boltR} tiles)`);
    const boltHits = a.hits.filter(h => /^bolt/.test(h.k)).length, struckIds = new Set(a.strikes.filter(q => q.i >= 0).map(q => q.i));
    ok(boltHits >= NB && a.strikes.every(q => q.i >= 0 && q.n >= 1), `evo ${evo}: every bolt finds an enemy (${boltHits} bolt hits on ${struckIds.size} different targets)`);
    ok(struckIds.size >= Math.min(4, NB), `evo ${evo}: the bolts spread over the enemies (${struckIds.size} targets of 5 in reach)`, [...struckIds]);
    // the impact and the pulses
    const imp = a.hits.filter(h => h.k === 'impact'), pk = k => a.hits.filter(h => h.k === 'pulse' + k);
    ok(imp.length && imp.every(h => h.t >= TU.impact - 1e-6 && h.t - TU.impact < 1 / 60 + 1e-3), `evo ${evo}: the impact lands at ${TU.impact} s (after the twirl ${a.rec.tw[0]}..${a.rec.tw[1]} s and the plunge), once a monster`, imp.map(h => [h.i, h.t]));
    ok(a.rec.tP.every((x, k) => Math.abs(x - (TU.impact + TU.pulseGap * (k + 1))) < 1e-9), `evo ${evo}: pulse k leaves at impact + ${TU.pulseGap} (k + 1)`, a.rec.tP);
    ok(new Set(imp.map(h => h.i)).size === imp.length && [...Array(NP).keys()].every(k => new Set(pk(k).map(h => h.i)).size === pk(k).length), `evo ${evo}: the impact and each pulse hit each monster at most once (the dragon's body, claws and bolts share the impact)`);
    ok([...Array(NP).keys()].every(k => pk(k).every(h => h.t >= a.rec.tP[k] - 1e-6 && h.t <= a.rec.tP[k] + TU.patR / TU.pulseV + 0.05)), `evo ${evo}: each pulse hits while its front travels`);
    ok(!a.hits.some(h => !/^bolt/.test(h.k) && h.t < TU.impact - 1e-6) && !a.hits.some(h => h.t > TU.bolt1 + 1 / 60 + 1e-3 && h.t < TU.impact - 1e-6), `evo ${evo}: before the impact only the bolts land (the twirl and the plunge are visual only)`);
    const m = a.mons;
    ok(imp.some(h => h.i === 0) && imp.some(h => h.i === 1) && !imp.some(h => h.i === 2 || h.i === 3), `evo ${evo}: the monsters in the impact take it, those beyond take the pulses only`, [m[0].d, m[1].d, m[2].d, m[3].d]);
    ok(m[4].dmg === 0, `evo ${evo}: a monster out of the view and the reach (${m[4].d} tiles) takes nothing`, m[4].dmg);
    const sums = m.map((x, i) => a.hits.filter(h => h.i === i).reduce((s, h) => s + amt(h.k, DK), 0));
    ok(m.every((x, i) => Math.abs(x.dmg - sums[i]) <= Math.max(2, sums[i] * 0.01)), `evo ${evo}: each monster's damage is exactly its hits (impact ${TU.impactK}, pulse ${TU.pulseK}, bolt ${TU.boltK} DK each)`, m.map((x, i) => [x.dmg, Math.round(sums[i])]));
    ok(TU.impactK > TU.pulseK * 3 && TU.impactK > TU.boltK * 5, `evo ${evo}: the impact is the largest single hit (${TU.impactK} DK vs a pulse's ${TU.pulseK}, a bolt's ${TU.boltK})`);
    ok(a.mons.every((x, i) => x.dmg === b.mons[i].dmg) && a.hits.length === b.hits.length && a.strikes.every((q, k) => q.i === b.strikes[k].i), `evo ${evo}: dt 1/60 and 1/4 give the same targets, hits and damage on every monster`, { a: a.mons.map(x => x.dmg), b: b.mons.map(x => x.dmg) });
    const B = m[5]; ok(B.boss && B.dmg > 0 && B.stun === 0 && m[0].stun > 0, `evo ${evo}: a boss takes the impact and the pulses (${B.dmg}) but keeps its immunity (no stun); a monster is stunned (${m[0].stun} s)`);
    ok(a.floorBad === 0 && a.rec.tiles > 20, `evo ${evo}: the footprint covers ${a.rec.tiles} floor tiles, every one walkable, explored and in reach`);
    ok(a.gone > 0 && a.gone < a.rec.life + 0.1 && a.gone < 8.6, `evo ${evo}: the effect is gone at ${a.gone.toFixed(2)} s`);
    // one enemy alone at the aim: every bolt finds it (the most one enemy can take)
    const s1 = await run(evo, 1 / 30, { spots: [[0.3, 0.2]] });
    per[evo] = { DK: +DK.toFixed(1), plan: a.rec.plan.speed + ' t/s',
      crowdDK: m.map(x => +(x.dmg / DK).toFixed(1)), crowdBolts: m.map((x, i) => a.hits.filter(h => h.i === i && /^bolt/.test(h.k)).length), aloneDK: +(s1.mons[0].dmg / DK).toFixed(1), aloneBolts: s1.hits.filter(h => /^bolt/.test(h.k)).length };
    ok(Math.abs(s1.mons[0].dmg / DK - (TU.impactK + NP * TU.pulseK + NB * TU.boltK)) < 0.05, `evo ${evo}: one enemy alone takes every bolt, the impact and the pulses: ${(TU.impactK + NP * TU.pulseK + NB * TU.boltK).toFixed(1)} DK (got ${(s1.mons[0].dmg / DK).toFixed(2)})`);
  }
  console.log('damage per tier (x DK; crowd: [impact, impact, pulses only, pulses only, far, boss]):', JSON.stringify(per));
  const fg = await run(1, 1 / 15, { spots, fog: true });
  ok(fg.floorBad === 0, `the footprint keeps out of the unexplored floor (${fg.rec.tiles} tiles, all explored)`, fg.floorBad);
  const k = await run(7, 1 / 60, { spots, kill: 1.5 });
  ok(k.hits.length === 0 && k.mons.every(x => x.dmg === 0) && k.gone > 0 && k.gone - k.deadAt <= 1.05, 'the caster falls before the first bolt: nothing lands, the summon gone within a second', { hits: k.hits.length, gone: k.gone, deadAt: k.deadAt });
  const k1 = await run(7, 1 / 60, { spots, kill: 3.0 });
  ok(k1.hits.length > 0 && k1.hits.every(h => /^bolt/.test(h.k) && h.t <= k1.deadAt + 1e-6) && k1.strikes.length < 10, 'the caster falls mid-flight: the bolts already struck stand, no bolt, impact or pulse after it', { strikes: k1.strikes.length, deadAt: k1.deadAt });
  const k2 = await run(7, 1 / 60, { spots, kill: TU.impact + 0.25 });
  ok(k2.hits.every(h => h.t <= k2.deadAt + 1 / 60 + 1e-6) && k2.hits.some(h => h.k === 'impact') && !k2.hits.some(h => /pulse/.test(h.k)), 'the caster falls after the impact: the pulses still to come are cancelled', { kinds: [...new Set(k2.hits.map(h => h.k))] });
  ok(!errors.length, 'no page errors', errors.slice(0, 5));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})();
