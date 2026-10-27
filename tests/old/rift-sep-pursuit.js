// Borrowed Pursuit, played by the hook
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, killAll, exitStage } = T;
  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.sepulchre.stages.findIndex(s => s.name === 'Borrowed Pursuit'));
  await start('sepulchre', idx); await run(2);
  const walk = (pts, secs) => page.evaluate(async ([pts, secs]) => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); const u = Math.min(1, (performance.now() - t0) / (secs * 1000)) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(u)), f = u - i, a = pts[i], b = pts[i + 1] || a; D.me.x = a[0] + (b[0] - a[0]) * Math.min(1, f); D.me.y = a[1] + (b[1] - a[1]) * Math.min(1, f); D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; D.me.dodge = null; } }, [pts, secs]);
  const stand = (x, y, secs) => walk([[x, y], [x, y]], secs);
  const info = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { B: mod.beacons.map(b => ({ x: b.x, y: b.y, lit: b.lit, g: b.guards.filter(m => !m.dead).length })), on: mod.S.on, lag: mod.S.lag, resets: mod.S.resets, C: mod.C, done: D.RIFT.done, goal: document.getElementById('arcGoal').textContent }; });
  let r = await info(); console.log(JSON.stringify(r));
  await killAll(); const [b1, b2, b3] = r.B, C = r.C;
  await walk([[C.x, C.y + 10], [b1.x, b1.y + 0.6]], 0.6); await stand(b1.x, b1.y + 0.6, 3.2); r = await info(); ok(r.B[0].lit && r.on, 'beacon 1 lit: the echo wakes'); await killAll();
  // by the sanctuary to beacon 2: the echo loses the trail and falls behind
  await walk([[b1.x, b1.y + 0.6], [C.x, C.y - 2], [C.x, C.y], [C.x + 2, C.y + 1], [b2.x, b2.y + 0.6]], 2.2); await shot('pursuit-echo');
  await killAll(); await stand(b2.x, b2.y + 0.6, 3.2); r = await info(); ok(r.B[1].lit, 'beacon 2 lit while the echo is behind'); ok(r.lag >= 6, 'through the sanctuary the echo fell behind: ' + r.lag + ' s');
  // stand still too long: caught
  await stand(b2.x, b2.y + 0.6, 7); r = await info(); ok(r.resets >= 1, 'standing still, the echo catches you: back to the last beacon'); await shot('pursuit-caught');
  await killAll(); const cur = await page.evaluate(() => [window.__pp.arc.game._dbg.me.x, window.__pp.arc.game._dbg.me.y]);
  await walk([cur, [C.x + 1.5, C.y], [C.x, C.y], [C.x - 2, C.y + 1], [b3.x, b3.y + 0.6]], 2.2); await killAll(); await stand(b3.x, b3.y + 0.6, 3.2); r = await info(); ok(r.B[2].lit && r.done, 'beacon 3: the stairs fold · ' + r.goal); await shot('pursuit-done');
  await exitStage(); ok(true, 'exit');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
