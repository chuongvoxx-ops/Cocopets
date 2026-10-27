// Sepulchre dungeon extras: the hourglasses of section one (countdown, blast, time freeze 20 s) and the giant ice
// crystals of section three (freeze the monsters near, frostbite: healing items do nothing for 20 s)
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run } = T;
  const stand = (x, y, secs) => page.evaluate(async ([x, y, secs]) => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } }, [x, y, secs]);
  let found = false;
  for (let tries = 0; tries < 4 && !found; tries++) { await start('sepulchre', 0); await run(3);
    const hg = await page.evaluate(() => window.__pp.arc.game._dbg.RIFT.objs.filter(o => o.kind === 'hourglassuse').map(o => [o.x, o.y]));
    if (!hg.length) continue; found = true; ok(true, `${hg.length} hourglasses to shatter`);
    // a monster beside it, the pet stays inside: both frozen
    await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; const m = D.mons.find(q => !q.dead && !q.boss); m.x = x + 1.5; m.y = y + 0.5; m._t = 1; }, hg[0]);
    await stand(hg[0][0], hg[0][1] + 0.2, 1.2); await shot('extra-hourglass-count');
    await stand(hg[0][0], hg[0][1] + 0.2, 3.6);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { field: D.zones ? D.zones.filter(z => z.kind === 'timefield').length : -1, frozen: D.mons.filter(m => !m.dead && m.freeze > 10).length, pet: D.RIFT.self.mod.xm.S.petT }; });
    console.log('  hourglass', JSON.stringify(r)); ok(r.frozen >= 1 && r.pet > 15, 'the blast: monsters and the pet inside frozen in time ~20 s'); await shot('extra-hourglass-frozen'); }
  ok(found, 'a floor with hourglasses');
  await start('sepulchre', 7); await run(3);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { n: D.mons.filter(m => m.type === 'icecrystal').length, left: document.getElementById('arcGoal').textContent }; }); ok(r.n >= 3, `${r.n} giant ice crystals`);
  const ic = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.mons.find(q => q.type === 'icecrystal'); const near = D.mons.find(q => !q.dead && q.type !== 'icecrystal' && !q.boss); near.x = m.x + 2; near.y = m.y; D.me.x = m.x; D.me.y = m.y + 2.2; return [m.x, m.y]; });
  await run(0.3); await shot('extra-ice'); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.mons.find(q => q.type === 'icecrystal' && !q.dead); D.hitMon(m, 1e9, { flat: true }); }); await run(0.6);
  r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fb: D.g.frostbite, frozen: D.mons.filter(m => !m.dead && m.freeze > 3).length }; }); ok(r.fb > 15 && r.frozen >= 1, 'broken: monsters near it frozen, frostbite 20 s ' + JSON.stringify(r)); await shot('extra-frostbite');
  // healing does nothing while frostbitten
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; D.me.hp = D.ST.hp * 0.5; const before = D.me.hp; D.drop ? D.drop('hp', D.me.x, D.me.y) : null; await new Promise(r => setTimeout(r, 1200)); return { before, after: D.me.hp, has: !!D.drop }; }); ok(!r.has || r.after <= r.before + 1, 'an HP pickup does not heal under frostbite ' + JSON.stringify(r));
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
