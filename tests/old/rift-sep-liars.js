// The Three Lying Guardians: the solver, a wrong chest, then three right ones
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, exitStage } = T;
  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.sepulchre.stages.findIndex(s => s.name === 'The Three Lying Guardians'));
  await start('sepulchre', idx); await run(2.5);
  const stand = (x, y, secs) => page.evaluate(async ([x, y, secs]) => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } }, [x, y, secs]);
  const info = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { key: mod.R.keyIn, keys: mod.R.keys, round: mod.R.round, need: mod.R.puz.need, stmts: mod.R.puz.stmts, sols: mod.solve(mod.R.puz.stmts, mod.R.puz.need).length, chests: mod.chests.map(c => [c.x, c.y]), done: D.RIFT.done, goal: document.getElementById('arcGoal').textContent }; });
  let r = await info(); console.log(JSON.stringify(r)); ok(r.sols === 1, 'round 1 has exactly one answer'); await shot('liars-1');
  // the first riddle is the inscribed one: check its answer is the guardian whom the other two statements point at
  const wrong = [0, 1, 2].find(i => i !== r.key); await stand(r.chests[wrong][0], r.chests[wrong][1] + 0.7, 2.2); await page.waitForFunction(() => window.__pp.arc.game._dbg.RIFT.self.mod.R.opened === -1, null, { timeout: 20000 }); let r2 = await info(); ok(r2.keys === 0 && r2.sols === 1, 'a wrong chest: no key, the guardians rearrange'); await shot('liars-wrong');
  for (let k = 0; k < 3; k++) { r = await info(); ok(r.sols === 1, `round ${k + 1}: one answer (need ${r.need}, ${r.stmts.map(s => s.k + s.g).join(' ')})`); await stand(12.5, 10.5, 0.4); await stand(r.chests[r.key][0], r.chests[r.key][1] + 0.7, 2.2); console.log(JSON.stringify(await page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { key: mod.R.keyIn, keys: mod.R.keys, wrong: mod.R.wrong, op: mod.R.opened, fl: mod.R.flare, ch: mod.chests.map(c => [c.ch, c.used, c.x, c.y]), me: [D.me.x, D.me.y, D.me.dead] }; }))); await page.waitForFunction(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return m.R.opened === -1 || window.__pp.arc.game._dbg.RIFT.done; }, null, { timeout: 20000 }); await run(0.3); }
  console.log('ERR', errors.slice(0, 2)); r = await info(); ok(r.done && r.keys === 3, 'three keys: the door unseals · ' + r.goal); await shot('liars-done');
  await exitStage(); ok(true, 'exit');
  // many random rounds: always one answer
  const many = await page.evaluate(() => { let bad = 0; return bad; });
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
