// frost tomatoes and crystal trees: count, a close-up, arming, the burst freezing the pet
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, shot, start, run } = T;
  for (const st of [0, 1, 4, 6, 7]) { await start('aurora', st); await run(1.5); const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb; return { n: A.S.list.length, trees: (D.props || []).filter(p => p.kind === 'icetree' || p.k === 'icetree').length }; }); console.log('  stage', st, JSON.stringify(r)); ok(r.n >= 2, `stage ${st}: frost tomatoes laid out`); }
  await start('aurora', 0); await run(1.5);
  // a close look at a tomato (stand off to the side), then arm one and stay
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, q = D.RIFT.self.amb.S.list[0]; D.me.x = q.x + 2.6; D.me.y = q.y + 0.4; return { x: q.x, y: q.y }; }); await run(1.2); await shot('aur-tomato');
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb, q = A.S.list[0]; D.me.x = q.x + 1.2; D.me.y = q.y; await new Promise(r => setTimeout(r, 150)); const st1 = q.st; await new Promise(r => setTimeout(r, 1000)); return { st1 }; });
  ok(r.st1 === 'armed', 'walking past a tomato arms it'); await shot('aur-tomato-armed');
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb, q = A.S.list[0]; const t0 = performance.now(); while (performance.now() - t0 < 1300 && q.st === 'armed') { await new Promise(r => requestAnimationFrame(r)); if (q.st === 'armed') { D.me.x = q.x + 1.2; D.me.y = q.y; D.me.dodge = null; } } await new Promise(r => setTimeout(r, 100)); const fz = A.S.frz, x0 = D.me.x; return { st: q.st, fz, frozen: A.S.frozen }; });
  ok(r.st === 'gone' && r.frozen === 1 && r.fz > 0, 'two seconds later it bursts: the pet is frozen ' + JSON.stringify(r)); await shot('aur-tomato-frozen');
  // dodge away in time: not frozen
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb, q = A.S.list[1]; await new Promise(r => setTimeout(r, 2500)); D.me.x = q.x + 1.2; D.me.y = q.y; await new Promise(r => setTimeout(r, 300)); D.me.x = q.x + 6; await new Promise(r => setTimeout(r, 2200)); return { st: q.st, frozen: A.S.frozen }; });
  ok(r.st === 'gone' && r.frozen === 1, 'moving out of the ring in time: no freeze');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
