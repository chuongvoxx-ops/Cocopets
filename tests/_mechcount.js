const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 62, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora'] }); const { page, errors, start, run } = T;
  for (const st of [0, 0, 3, 3, 7, 7]) { await start('yuggoth', st); await run(1); console.log(st, await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return JSON.stringify({ mech: D.mons.filter(m => m.type === 'warmech').length, hound: D.mons.filter(m => m.type === 'mechhound').length, cells: D.mons.filter(m => m.type === 'chargecell').length, eggs: D.mons.filter(m => m.type === 'mechegg').length, all: D.mons.length }); })); }
  console.log('errors', errors.length, errors.slice(0, 2)); process.exit(0); })();
