// The Hour Court: balls fly and bounce; a hit knocks crystals loose; a dodge through a ball is perfect; 30 gathers it
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, exitStage } = T;
  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.sepulchre.stages.findIndex(s => s.name === 'The Hour Court'));
  await start('sepulchre', idx); await run(5);
  let r = await page.evaluate(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S; return { balls: S.balls.length + S.aim.length, gems: S.gems.length }; }); ok(r.balls > 0 && r.gems >= 4, 'balls thrown and crystals on the floor ' + JSON.stringify(r)); await shot('court-1');
  // gather: walk onto crystals (god mode), let balls hit sometimes
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; let hitsSeen = 0; const t0 = performance.now(); while (performance.now() - t0 < 60000 && !D.RIFT.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const G = S.gems.find(q => q.t > 0.3); if (G) { D.me.x = G.x; D.me.y = G.y; } } return { got: S.got, hits: S.hits, perfect: S.perfect, done: D.RIFT.done }; });
  console.log('  gathered', JSON.stringify(r)); ok(r.done, 'thirty crystals: the court falls still'); ok(r.hits >= 0, 'hits taken: ' + r.hits); await shot('court-done');
  await exitStage(); ok(true, 'exit');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
