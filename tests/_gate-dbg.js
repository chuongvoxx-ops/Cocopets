const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, start, run } = T; const logs = []; page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  await start('sepulchre', 0); await run(1); const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.RIFT.self.done = true; return { ex: D.RIFT.exit, rg: typeof riftGate }; }); await run(1); console.log(JSON.stringify(r), logs.slice(0, 5)); process.exit(0); })();
