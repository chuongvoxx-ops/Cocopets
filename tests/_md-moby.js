// (v450 MD, v455 MD2: the damage moved to the tail-slap) Moby Dick's rules, on the Tower (the 2D path: the rules do not depend on the picture; the GPU path's cleanup is checked
// by tests/_md-shots.js). The arcade's loop is stopped and the summon's effect stepped by hand (ELEM.update), the monsters held
// still and crits off (Math.random held high while it is stepped), so every run is exact:
//   - the row (cost, the cooldown 40 s set when the cast commits), six-star only (ELEM_SIX), the short gesture
//   - per tier (evo 1 / 4 / 7): one tail-slap at TUNE.slap (nothing from the breach or the dive before it), then 1 / 2 / 3 rings
//     TUNE.ringGap apart from the same strike, each ring each monster once, the slap the largest single hit (TUNE.slam DK vs
//     TUNE.ring DK), the damage per monster by where it stands (in the slap, only in the rings' reach, out of reach)
//   - the slap lands with the flukes: at TUNE.slap the posed flukes' underside is at the water and their middle at the aim
//   - dt 1/60 vs 1/4: the same hits and the same damage on every monster
//   - a boss takes the damage but keeps its crowd-control immunity (no stun, no shove)
//   - the caster's defeat mid-cast: no slam or ring after it, the effect gone within a second
//   - the water: only floor tiles (walkable, explored), capped by TUNE.waterR
// usage: HTML=<test html> node tests/_md-moby.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 30000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Moby'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.st.dun.god = true; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2600);
  // the loop stopped: from here every step is by hand
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; });
  const rowInfo = await page.evaluate(() => { const P = window.__pp, mv = P.ELEM_LIST.water.ey_mobydick, six = P.skillsK ? P.skillsK.ELEM_SIX.water.ult : null, I = P.ELEM_IMPL.water.ult.mobydick;
    return { has: !!mv, cost: mv && mv.cost, cd: mv && mv.cd, six: six ? six.includes('mobydick') : null, impl: typeof I, tune: I && I.TUNE }; });
  ok(rowInfo.has && rowInfo.cost === 100 && rowInfo.cd === 40 && rowInfo.impl === 'function', 'the row: Moby Dick, Water Ult, 100 MP, cooldown 40 s, implemented', { cost: rowInfo.cost, cd: rowInfo.cd });
  ok(rowInfo.six === true, 'six-star only: on the Water six-star Ult list (ELEM_SIX)', rowInfo.six);
  const TU = rowInfo.tune;

  /* one cast, stepped: monsters placed (dx, dy from the pet, along +x), hp high, held still; returns per-monster damage and the hits */
  const run = (evo, dt, opt) => page.evaluate(async ([evo, dt, opt]) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, X = D.ELEM.H.X;
    if (!X.__isExp0) X.__isExp0 = X.isExp; X.isExp = opt.fog ? X.__isExp0 : () => true;   // (the room for the test is open: the fog lifted, except in the fog check)
    // the floor's largest room: the aim at its middle, the pet 3.5 tiles west of it
    if (!window.__mdRoom) window.__mdRoom = D.M.rooms.reduce((a, r) => (r.w * r.h > a.w * a.h ? r : a));
    const R = window.__mdRoom, T = { x: R.x + R.w / 2, y: R.y + R.h / 2 }; me.x = T.x - 3.5; me.y = T.y; me.dead = false; me.hp = D.ST.hp; me.mp = 999; D.g.cdU = 0; me.face = 1;
    const L = D.mons.filter(m => !m.boss && !m.dead), spots = opt.spots; const used = [];
    for (let i = 0; i < L.length; i++) { const m = L[i]; if (i < spots.length) { m.x = T.x + spots[i][0]; m.y = T.y + spots[i][1]; m.hp = m.maxhp = 1e7; m.kbx = m.kby = 0; m.stun = 0; m.boss = !!spots[i][2]; m.act = 'chase'; used.push(m); } else { m.x = T.x + 80 + i; m.y = T.y + 80; } }
    for (const m of used) m.__hp0 = m.hp;
    const mv = P.ELEM_LIST.water.ey_mobydick, ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, evo, tier: evo >= 7 ? 2 : 1 });
    D.setKit('ult', ab); const MR = Math.random; Math.random = () => 0.999;
    // the cast as the game makes it (useUlt), but at a set aim: the Ult's path in 20b (MP, cooldown, gesture) checked once by opt.real
    let cd = null, gest = null, castOK = true;
    if (opt.real) { const mp0 = me.mp; D.useUlt(); cd = D.g.cdU; gest = me.castM; castOK = me.mp < mp0; D.ELEM.fx.length = 0; }
    D.ELEM.ult('mobydick', { a: 0, base: D.ST.atk * ab.mult, el: 'water', e8: 'water', evo, tx: T.x, ty: T.y, up: evo >= 7 });
    const I = P.ELEM_IMPL.water.ult.mobydick, rec = I.lib.last, fx = D.ELEM.fx.find(f => f.key === 'mobydick');
    // the monsters' places from the water (spots with 'auto'): 0, 1 under the slap, 2, 3 only in the rings' reach, 4 far away, 5 a boss under the slap
    if (opt.auto && fx) { const W = fx.S.W, TU = I.TUNE;
      const far = W.tiles.filter(t => t.d > TU.slamR + 1.3 && t.d < TU.ringR - 1 && !t.m).sort((p, q) => p.d - q.d);
      const near = W.tiles.filter(t => t.d < 2.4 && !t.m);
      const pick = [near[0], near[Math.floor(near.length / 2)], far[0], far[far.length - 1], { x: T.x + 40, y: T.y + 40 }, near[near.length - 1]];
      used.forEach((m, i) => { const q = pick[i]; if (q) { m.x = q.x; m.y = q.y; } }); }
    // the contact: the flukes posed at TUNE.slap (the model's mesh), their lowest point and their middle against the aim
    let contact = null; if (fx && self.MOBY_GL) { const G = self.MOBY_GL; G.pose(I.lib.poseAt(fx.S, I.TUNE.slap)); const fl = G.flukeLow(); contact = { z: +fl.z.toFixed(4), d: +Math.hypot(fx.S.O.x + fl.x - T.x, fx.S.O.y + fl.y - T.y).toFixed(3) };
      G.pose(I.lib.poseAt(fx.S, I.TUNE.slap - 0.05)); contact.zBefore = +G.flukeLow().z.toFixed(3); }
    const pos0 = used.map(m => [m.x, m.y]); let tt = 0, deadAt = -1, gone = -1;
    while (tt < 10) { if (opt.kill != null && tt >= opt.kill - 1e-9 && deadAt < 0) { me.dead = true; deadAt = tt; } D.ELEM.update(dt); tt += dt; used.forEach((m, i) => { m.x = pos0[i][0]; m.y = pos0[i][1]; }); if (gone < 0 && !D.ELEM.fx.includes(fx)) gone = tt; }
    Math.random = MR; me.dead = false;
    const out = { contact, cd, gest, castOK, rec: { tier: rec.tier, rings: rec.rings, tR: rec.tR, impact: rec.impact, DK: rec.DK, tiles: rec.tiles, quads: rec.quads, slamN: rec.slamN, abort: rec.abort, T: rec.T }, gone, deadAt,
      mons: used.map((m, i) => ({ i, dmg: Math.round(m.__hp0 - m.hp), stun: +(m.stun || 0).toFixed(2), kb: +Math.hypot(m.kbx || 0, m.kby || 0).toFixed(2), boss: !!m.boss, d: +Math.hypot(m.x - rec.T.x, m.y - rec.T.y).toFixed(2), onW: !!(fx && fx.S.W.on(m.x, m.y)) })),
      hits: rec.hits.map(h => ({ k: h.k, t: +h.t.toFixed(3), i: used.indexOf(D.mons[h.id]), boss: h.boss })), base: ab.mult * D.ST.atk };
    used.forEach(m => { m.boss = false; m.x = T.x + 60; m.y = T.y + 60; m.kbx = m.kby = 0; m.stun = 0; });
    // the water's tiles: every one a walkable, explored floor tile within the radius
    if (fx) { const W = fx.S.W; let badT = 0; for (const t of W.tiles) if (D.blocked(t.x, t.y, 0.05, 0) || !X.isExp(t.x, t.y) || Math.hypot(t.x - W.cx, t.y - W.cy) > TU_R + 0.01) badT++; out.waterBad = badT; }
    return out;
  }, [evo, dt, opt]);
  // the monsters: two in the slam (beside the aim and on the body's line), two only in the rings' reach, one out of reach, one a boss in the slam
  const spots = [[0.4, 0.3], [-2.2, 0.5], [0.2, 3.9], [-3.6, -3.4], [24, 24], [1.2, -0.8, true]];
  await page.evaluate(R => { window.TU_R = R; }, TU.waterR);
  const per = {};
  for (const evo of [1, 4, 7]) {
    const a = await run(evo, 1 / 60, { spots, real: true, auto: true }), b = await run(evo, 1 / 4, { spots, auto: true });
    if (a.err) { ok(false, a.err); break; }
    const NR = evo >= 7 ? 3 : evo >= 4 ? 2 : 1, DK = a.rec.DK;
    ok(a.castOK && a.cd === 40 && a.gest <= 0.6, `evo ${evo}: the cast commits (MP spent), the cooldown 40 s starts with it, a short gesture (${a.gest} s)`, { cd: a.cd });
    ok(a.rec.rings === NR && a.rec.tier === (evo >= 7 ? 3 : evo >= 4 ? 2 : 1), `evo ${evo}: tier ${a.rec.tier}, ${NR} tidal ring(s) after one slam`, { rings: a.rec.rings, tR: a.rec.tR });
    const slam = a.hits.filter(h => h.k === 'slam'), ringK = k => a.hits.filter(h => h.k === 'ring' + k);
    ok(slam.length && slam.every(h => h.t >= TU.slap - 1e-6 && h.t - TU.slap < 1 / 60 + 1e-3), `evo ${evo}: the tail-slap lands at ${TU.slap} s, once a monster`, slam.map(h => [h.i, h.t]));
    ok(a.hits.every(h => h.t >= TU.slap - 1e-6) && b.hits.every(h => h.t >= TU.slap - 1e-6), `evo ${evo}: the breach and the dive deal nothing (no hit before the slap)`);
    ok(a.contact && Math.abs(a.contact.z) < 0.02 && a.contact.d < 0.25 && a.contact.zBefore > 0.3, `evo ${evo}: at the slap the flukes meet the water (lowest point ${a.contact && a.contact.z}) over the aim (${a.contact && a.contact.d} tiles), raised just before (${a.contact && a.contact.zBefore})`);
    const once = new Set(slam.map(h => h.i)).size === slam.length && [...Array(NR).keys()].every(k => new Set(ringK(k).map(h => h.i)).size === ringK(k).length);
    ok(once, `evo ${evo}: each beat hits each monster at most once (one slap, each ring once)`);
    ok([...Array(NR).keys()].every(k => ringK(k).every(h => h.t >= a.rec.tR[k] - 1e-6 && h.t <= a.rec.tR[k] + TU.ringR / TU.ringV + 0.05)), `evo ${evo}: ring k leaves the slap at + ${TU.ringDelay} + ${TU.ringGap} k and hits while its front travels`, a.rec.tR);
    const m = a.mons;
    ok(m[0].dmg > 0 && m[1].dmg > 0 && slam.some(h => h.i === 0) && slam.some(h => h.i === 1), `evo ${evo}: the monsters under the slap take it`, [m[0].dmg, m[1].dmg]);
    ok(m[2].dmg > 0 && m[3].dmg > 0 && !slam.some(h => h.i === 2 || h.i === 3), `evo ${evo}: the monsters beyond the slap take only the rings`, [m[2], m[3], a.rec.T]);
    ok(m[4].dmg === 0, `evo ${evo}: a monster beyond the rings' reach (${m[4].d} tiles) takes nothing`, m[4].dmg);
    const expS = TU.slam * DK, expR = TU.ring * DK;
    ok(Math.abs(m[0].dmg - (expS + NR * expR)) / (expS + NR * expR) < 0.02, `evo ${evo}: in the slap: slap ${expS.toFixed(0)} + ${NR} x ring ${expR.toFixed(0)} = ${(expS + NR * expR).toFixed(0)} (got ${m[0].dmg})`);
    ok(expS > expR * 3, `evo ${evo}: the slap is the largest single hit (${(TU.slam).toFixed(1)} DK vs a ring's ${(TU.ring).toFixed(1)} DK)`);
    ok(a.mons.every((x, i) => x.dmg === b.mons[i].dmg) && a.hits.length === b.hits.length, `evo ${evo}: dt 1/60 and 1/4 give the same damage on every monster`, { a: a.mons.map(x => x.dmg), b: b.mons.map(x => x.dmg) });
    const B = m[5]; ok(B.boss && B.dmg > 0 && B.stun === 0 && B.kb === 0 && m[0].stun > 0, `evo ${evo}: a boss takes the slap (${B.dmg}) but keeps its immunity (no stun, no shove); a monster is stunned (${m[0].stun} s)`);
    ok(a.waterBad === 0 && a.rec.tiles > 20, `evo ${evo}: the water covers ${a.rec.tiles} floor tiles (${a.rec.quads} quads), every one walkable, explored and in reach`);
    ok(a.gone > 0 && a.gone < 9.5, `evo ${evo}: the effect is gone at ${a.gone.toFixed(2)} s`);
    per[evo] = { base: +a.base.toFixed(1), DK: +DK.toFixed(1), slam: +(expS / a.base).toFixed(2), ring: +(expR / a.base).toFixed(2), inSlam: +(m[0].dmg / a.base).toFixed(2), ringsOnly: +(m[2].dmg / a.base).toFixed(2), total6: a.mons.reduce((s, x) => s + x.dmg, 0) };
  }
  console.log('damage per tier (x the cast\'s base):', JSON.stringify(per));
  // the fog: with the floor's real exploration, the water lies only on explored tiles
  const fg = await run(1, 1 / 15, { spots, fog: true });
  ok(fg.waterBad === 0, `the water keeps out of the unexplored floor (${fg.rec.tiles} tiles, all explored)`, fg.waterBad);
  // the caster's defeat 1.5 s in (before the slap): no slap, no ring, gone within a second
  const k = await run(7, 1 / 60, { spots, kill: 1.5 });
  ok(k.hits.length === 0 && k.mons.every(x => x.dmg === 0) && k.gone > 0 && k.gone - k.deadAt <= 1.05, 'the caster falls mid-cast: no slap or ring after it, the summon gone within a second', { hits: k.hits.length, gone: k.gone, deadAt: k.deadAt });
  const k2 = await run(7, 1 / 60, { spots, kill: TU.slap + 0.25 });
  ok(k2.hits.every(h => h.t <= k2.deadAt + 1 / 60 + 1e-6) && k2.hits.some(h => h.k === 'slam') && !k2.hits.some(h => /ring[12]/.test(h.k)), 'the caster falls after the slap: the rings still to come are cancelled', { hits: k2.hits.map(h => h.k + '@' + h.t) });
  ok(!errors.length, 'no page errors', errors.slice(0, 5));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})();
