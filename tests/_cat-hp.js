const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, start, run } = T;
  await start('library', 0); await run(4);
  console.log(await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const m = D.mons.filter(q => !q.dead).map(q => q.type + ':' + Math.round(q.maxhp)); return { m: m.slice(0, 6), atk: D.ST.atk, hp: D.ST.hp }; }));
  await start('library', 1); await run(3); console.log(await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.mons.filter(q => !q.dead && q.boss).map(q => (q.bname || q.type) + ':' + Math.round(q.maxhp)); }));
  process.exit(0); })();
