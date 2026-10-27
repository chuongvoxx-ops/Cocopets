const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 62, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora'] }); const { page, errors, start, run } = T;
  await start('yuggoth', 6); await run(0.5); console.log(await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return JSON.stringify({ m: (D.M.marks.m || []).length, v: (D.M.marks.v || []).length, b: (D.M.marks.b || []).length, mons: D.mons.length, total: D.g.total, start: D.M.start, E: D.M.marks.E }); }), errors.slice(0, 2)); process.exit(0); })();
