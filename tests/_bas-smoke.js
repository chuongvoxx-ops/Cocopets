// smoke: every stage of the Basilica starts and runs; SHOTS=1 for pictures. HTML=test-bas.html node bas-smoke.js [stage...]
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 88, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors, shot, start, run } = T;
  const n = await page.evaluate(() => window.__pp.RIFT_BY_ID.basilica.stages.length);
  const only = process.argv.slice(2).map(Number);
  console.log('stages', n, await page.evaluate(() => window.__pp.RIFT_BY_ID.basilica.stages.map((s, i) => i + ':' + s.kind + ':' + s.name).join(' | ')));
  for (let st = 0; st < n; st++) { if (only.length && !only.includes(st)) continue;
    const e0 = errors.length; await start('basilica', st); await run(3.5);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const C = D.RIFT.self.amb.C; return { biome: D.F.biome, name: D.F.rift.name, kind: D.F.rift.kind, types: [...new Set(D.mons.map(m => m.type))].join(','), n: D.mons.length, goal: document.getElementById('arcGoal').textContent, screens: C.screens.length, pylons: C.pylons.length, sources: C.sources.length, objs: D.RIFT.objs.map(o => o.kind).join(','), mod: Object.keys(D.RIFT.self.mod).join(',') }; });
    console.log(st, JSON.stringify(r), errors.length - e0 ? errors.slice(e0, e0 + 3) : ''); await shot('bas-' + st);
  }
  console.log('errors', errors.length, errors.slice(0, 5)); await T.browser.close(); process.exit(0);
})();
