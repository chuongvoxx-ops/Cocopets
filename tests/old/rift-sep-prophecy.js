// The Broken Prophecy: clues determine one order; tablets carried into sockets; a wrong set is counted; two prophecies
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, exitStage } = T;
  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.sepulchre.stages.findIndex(s => s.name === 'The Broken Prophecy'));
  await start('sepulchre', idx); await run(2.5);
  // the generator: many sets, each with exactly one order and 4-7 clues
  const gen = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; let bad = 0, n = 0, lens = []; for (let k = 0; k < 30; k++) { const order = mod.PERMS[Math.floor(Math.random() * 720)]; const cl = mod.clueSet(order); if (!cl) { bad++; continue; } n++; lens.push(cl.length); const sols = mod.PERMS.filter(P => { const ps = []; P.forEach((e, i) => { ps[e] = i; }); return cl.every(q => q.test(ps)); }); if (sols.length !== 1 || sols[0].join() !== order.join()) bad++; } return { bad, n, lens: lens.join(',') }; });
  ok(gen.bad === 0, 'clue sets always give exactly one order ' + JSON.stringify(gen));
  const stand = (x, y, secs) => page.evaluate(async ([x, y, secs]) => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } }, [x, y, secs]);
  // read every clue
  const stones = await page.evaluate(() => window.__pp.arc.game._dbg.RIFT.self.mod.stones.map(s => [s.x, s.y]));
  for (const [x, y] of stones) await stand(x, y + 1, 0.25);
  let r = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { seen: mod.stones.filter(s => s.seen && s.clue).length, n: mod.R.clues.length }; }); ok(r.seen === r.n, `all ${r.n} clues found and listed`); await shot('prophecy-clues');
  async function place(wrongFirst) { const info = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { order: mod.R.order, sockets: mod.sockets.map(s => [s.obj.x, s.obj.y]) }; });
    let ord = info.order.slice(); if (wrongFirst) [ord[0], ord[1]] = [ord[1], ord[0]];
    for (let i = 0; i < 6; i++) { const t = await page.evaluate(e => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod, T0 = mod.R.tabs.find(q => q.e === e); return T0.at ? [T0.at.obj.x, T0.at.obj.y] : [T0.x, T0.y]; }, ord[i]);
      await stand(3, 10, 0.3); await stand(t[0], t[1] + (t[1] < 4 ? 0 : 0.3), 1.6); await stand(3, 10, 0.3); await stand(info.sockets[i][0], info.sockets[i][1], 1.6); }
    return page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { set: mod.sockets.filter(s => s.tab).length, right: mod.R.right, round: mod.R.round, playT: mod.R.playT, done: window.__pp.arc.game._dbg.RIFT.done }; }); }
  r = await place(true); ok(r.set === 6 && r.right === 4, 'a wrong order: told how many are right ' + JSON.stringify(r)); await shot('prophecy-wrong');
  // fix the first two by swapping
  const fix = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return mod.sockets.map(s => [s.obj.x, s.obj.y]); });
  await stand(fix[0][0], fix[0][1], 1.6); await stand(3, 10, 0.3); await stand(fix[1][0], fix[1][1], 1.6); await stand(3, 10, 0.3); await stand(fix[0][0], fix[0][1], 1.6);
  await run(0.5); r = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { right: mod.R.right, playT: mod.R.playT, round: mod.R.round }; }); ok(r.right === 6, 'swapped: the prophecy holds ' + JSON.stringify(r)); await shot('prophecy-holds');
  await page.waitForFunction(() => window.__pp.arc.game._dbg.RIFT.self.mod.R.round === 1, null, { timeout: 20000 });
  r = await page.evaluate(() => ({ dmg: window.__pp.arc.game._dbg.RIFT.self.mod.R.damaged })); ok(r.dmg >= 0, 'the second prophecy has a cracked tablet');
  for (const [x, y] of stones) await stand(x, y + 1, 0.25);
  await shot('prophecy-2'); r = await place(false); await run(5); r = await page.evaluate(() => ({ done: window.__pp.arc.game._dbg.RIFT.done })); ok(r.done, 'the second prophecy holds: done');
  await exitStage(); ok(true, 'exit');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
