// smoke: every stage of the Yuggoth Engine starts and runs; SHOTS=1 for pictures
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 40, seals: ['belfry'] }); const { page, errors, shot, start, run } = T;
  const n = await page.evaluate(() => window.__pp.RIFT_BY_ID.garden.stages.length);
  const only = process.argv.slice(2).map(Number);
  for (let st = 0; st < n; st++) { if (only.length && !only.includes(st)) continue;
    const e0 = errors.length; await start('garden', st); await run(3.5);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { biome: D.F.biome, name: D.F.rift.name, kind: D.F.rift.kind, types: [...new Set(D.mons.map(m => m.type))].join(','), n: D.mons.length, goal: document.getElementById('arcGoal').textContent }; });
    console.log(st, JSON.stringify(r), errors.length - e0 ? errors.slice(e0, e0 + 3) : ''); await shot('gdn-' + st);
  }
  console.log('errors', errors.length); process.exit(0);
})();
