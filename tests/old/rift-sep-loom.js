// The Memory Loom, played by the hook: record, send out, cross; second room in order; guards; exit
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, killAll, exitStage } = T;
  await start('sepulchre', 1); await run(2);
  const walk = (pts, secs) => page.evaluate(async ([pts, secs]) => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); const u = Math.min(1, (performance.now() - t0) / (secs * 1000)) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(u)), f = u - i, a = pts[i], b = pts[i + 1] || a; D.me.x = a[0] + (b[0] - a[0]) * Math.min(1, f); D.me.y = a[1] + (b[1] - a[1]) * Math.min(1, f); D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } }, [pts, secs]);
  const stand = (x, y, secs) => walk([[x, y], [x, y]], secs);
  const info = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { L: mod.looms.map(l => ({ x: l.x, y: l.y, mode: l.mode, n: l.pts.length })), d1: mod.d1.open, l1: mod.d1.latched, b2: mod.S.b2, goal: document.getElementById('arcGoal').textContent, P: D.M.marks.P[0], ord: mod.order, K: D.M.marks.K[0], d1y: mod.d1.tiles[0].y, done: D.RIFT.done }; });
  let r = await info(); console.log(JSON.stringify(r));
  await killAll();
  const L0 = r.L[0];
  await stand(L0.x, L0.y, 1.2); r = await info(); ok(r.L[0].mode === 'rec', 'standing on the loom starts a recording');
  await walk([[L0.x, L0.y], [r.P.x, r.P.y]], 2); await stand(r.P.x, r.P.y, 6.5); r = await info(); ok(r.L[0].mode === 'idle' && r.L[0].n > 40, 'eight seconds recorded: ' + r.L[0].n + ' points');
  await shot('loom-rec');
  await walk([[r.P.x, r.P.y], [L0.x, L0.y]], 1.5); await stand(L0.x, L0.y, 1.2); r = await info(); ok(r.L[0].mode === 'play', 'standing on it again sends the echo out');
  await stand(L0.x - 2, L0.y - 2, 4); r = await info(); ok(r.d1, 'the echo on the plate opens the door'); await shot('loom-echo');
  const dx = 11.5 + 1, d1y = r.d1y; await walk([[L0.x - 2, L0.y - 2], [dx, d1y + 1.5], [dx, d1y - 1.6]], 1.8); r = await info(); const pp = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return [D.me.x, D.me.y, D.RIFT.self.mod.d1.tiles.map(t => t.tx + ',' + t.ty + ':' + D.M.G[t.ty * D.M.MW + t.tx]).join(' '), D.RIFT.self.mod.S.d1t, D.RIFT.self.mod.looms[0].mode, D.RIFT.self.mod.looms[0].play && D.RIFT.self.mod.looms[0].play.t]; }); console.log(JSON.stringify(pp), r.d1, r.d1y); ok(r.l1, 'through the door: it latches');
  await run(1.5); await killAll(); await run(0.5);
  const L1 = r.L[1]; await stand(L1.x, L1.y, 1.2);
  const a = r.ord[0], b = r.ord[1]; await walk([[L1.x, L1.y], [a.x, a.y], [b.x, b.y]], 3); await stand(b.x, b.y, 4.5);
  await walk([[b.x, b.y], [L1.x, L1.y]], 1.5); await stand(L1.x, L1.y, 1.2); r = await info(); console.log(JSON.stringify(r.L), r.goal); ok(r.L[1].mode === 'play', 'second echo out');
  await walk([[L1.x, L1.y], [r.K.x, r.K.y + 0.6]], 1); await stand(r.K.x, r.K.y + 0.6, 5); r = await info(); ok(r.b2, 'echo held 1 then 2, the switch pulled: the second door opens'); await shot('loom-room2');
  await killAll(); await run(1); r = await info(); ok(r.done, 'guards down: done · ' + r.goal);
  await exitStage(); ok(true, 'exit');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
