// The Hall in Two Ages, played by the hook
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, killAll, exitStage } = T;
  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.sepulchre.stages.findIndex(s => s.name === 'The Hall in Two Ages'));
  await start('sepulchre', idx); await run(2);
  const walk = (pts, secs) => page.evaluate(async ([pts, secs]) => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); const u = Math.min(1, (performance.now() - t0) / (secs * 1000)) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(u)), f = u - i, a = pts[i], b = pts[i + 1] || a; D.me.x = a[0] + (b[0] - a[0]) * Math.min(1, f); D.me.y = a[1] + (b[1] - a[1]) * Math.min(1, f); D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } }, [pts, secs]);
  const stand = (x, y, secs) => walk([[x, y], [x, y]], secs);
  const info = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, G = D.M.G, MW = D.M.MW; return { age: mod.S.age, braced: mod.S.braced, farOn: mod.S.farOn, L1: [mod.L1.x, mod.L1.y], L2: [mod.L2.x, mod.L2.y], C: [mod.catchObj.x, mod.catchObj.y], b: mod.bridge.map(t => G[t.ty * MW + t.tx]).join(''), w: mod.wall.map(t => G[t.ty * MW + t.tx]).join(''), bx: mod.bridge[1].x, goal: document.getElementById('arcGoal').textContent, done: D.RIFT.done }; });
  let r = await info(); console.log(JSON.stringify(r)); ok(r.age === 'present' && /^2+$/.test(r.b) && /^1+$/.test(r.w), 'starts in the Present: bridge broken, wall down');
  await killAll(); await shot('ages-present');
  await walk([[r.L1[0], r.L1[1] + 1], [r.L1[0], r.L1[1] + 0.6]], 0.5); await stand(r.L1[0], r.L1[1] + 0.6, 1.2); r = await info(); ok(r.age === 'past' && /^1+$/.test(r.b) && /^0+$/.test(r.w), 'the lever turns to the Past: bridge whole, wall up'); await shot('ages-past');
  await walk([[r.bx, 15], [r.bx, 7.2]], 2); r = await info(); ok(r.farOn, 'across: the far guards wake');
  await stand(r.C[0], r.C[1] + 0.6, 1.2); r = await info(); ok(r.braced, 'the catch braces the bridge');
  await stand(r.L2[0], r.L2[1] + 0.6, 1.2); r = await info(); ok(r.age === 'present' && /^1+$/.test(r.b) && /^1+$/.test(r.w), 'the far lever to the Present: wall down, braced bridge stays'); await shot('ages-braced');
  await killAll(); await run(1); r = await info(); ok(r.done, 'far guards cleared: done · ' + r.goal);
  await exitStage(); ok(true, 'exit');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
