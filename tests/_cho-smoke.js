// smoke: every stage of the Choir starts and runs with no page errors; SHOTS=1 for pictures. HTML=test-cho.html node tests/_cho-smoke.js [stage...]
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 98, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'basilica', 'colours'] }); const { page, errors, shot, start, run } = T;
  const n = await page.evaluate(() => window.__pp.RIFT_BY_ID.choir.stages.length);
  const only = process.argv.slice(2).map(Number);
  console.log('stages', n, await page.evaluate(() => window.__pp.RIFT_BY_ID.choir.stages.map((s, i) => i + ':' + s.kind + ':' + s.name).join(' | ')));
  let bad = 0;
  for (let st = 0; st < n; st++) { if (only.length && !only.includes(st)) continue;
    const e0 = errors.length; await start('choir', st); await run(+(process.env.RUN || 3.5));
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const A = D.RIFT.self.amb, C = A.C; return { biome: D.F.biome, name: D.F.rift.name, kind: D.F.rift.kind, types: [...new Set(D.mons.map(m => m.type))].join(','), n: D.mons.length, goal: document.getElementById('arcGoal').textContent, pads: C.pads.length, beats: C.beats.length, mouths: A.mouths.length, objs: D.RIFT.objs.map(o => o.kind).join(','), mod: Object.keys(D.RIFT.self.mod).join(','), t: +D.g.t.toFixed(1) }; });
    const e = errors.length - e0; if (e) bad++;
    console.log(st, JSON.stringify(r), e ? errors.slice(e0, e0 + 3) : ''); await shot('cho-' + st);
  }
  console.log('errors', errors.length, errors.slice(0, 5)); await T.browser.close(); process.exit(bad || errors.length ? 1 : 0);
})();
