// v426 TG: the old Unbroken Constellation (a build of git HEAD) for the before / after sheet: the chamber, mid-trace, the win.
// HTML=<path to the old build> DPR=1|3 node tests/_tg-before.js   -> shots/v426-TG/before-*.png
const { open } = require('./_tg-lib');
const DPR = +(process.env.DPR || 1), tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR;
(async () => { const T = await open({ dpr: DPR }); const { M, run, goTo } = T; await T.start();
  await M(async () => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; const t0 = performance.now(); while (performance.now() - t0 < 120000 && m.R.mode !== 'play') await new Promise(r => requestAnimationFrame(r)); });
  const st = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.stars.map(s => [s.x, s.y]));
  await goTo((st[0][0] + st[1][0]) / 2, st[0][1] + 1.2); await run(0.6); await T.shot('v426-TG', 'before-chamber-' + tag);
  await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; for (const i of [0, 1, 2, 3, 0]) m.visit(i); }); await goTo(st[0][0] - 1.3, st[0][1] - 1.4); await run(0.8); await T.shot('v426-TG', 'before-mid-trace-' + tag);
  const SOL = [[2, 4, 3, 1], [0, 1, 2, 3, 4, 2, 0, 5, 4], [2, 0, 1, 2, 3, 4, 5, 3, 6, 4]];
  await M(async SOL => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; const w = async n => { const t0 = performance.now(); while (performance.now() - t0 < 60000 && !(m.R.sky === n && m.R.mode === 'play')) await new Promise(r => requestAnimationFrame(r)); };
    for (const i of SOL[0]) m.visit(i); await w(1); for (const i of SOL[1]) m.visit(i); await w(2); for (const i of SOL[2]) m.visit(i); }, SOL);
  await run(2.0); await T.shot('v426-TG', 'before-win-' + tag);
  console.log('errors', T.errors.length); await T.browser.close(); })();
