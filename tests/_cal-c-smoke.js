// Rift 0 core smoke: every trial stage (and, with ALL=1, the boss stages) starts and runs with no page errors; SHOTS=1 for pictures.
// HTML=test-calC.html node tests/_cal-c-smoke.js [stage...]
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 1 }); const { page, errors, shot, start, run } = T;
  const info = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.caldera; return { n: R.stages.length, list: R.stages.map((s, i) => i + ':' + s.kind + ':' + s.name + ':' + (s.biome || '')).join(' | ') }; });
  console.log('stages', info.n, info.list);
  const only = process.argv.slice(2).map(Number);
  let bad = 0;
  for (let st = 0; st < info.n; st++) { if (only.length ? !only.includes(st) : (st % 2 && !process.env.ALL)) continue;
    const e0 = errors.length; await start('caldera', st); await run(+(process.env.RUN || 3.5));
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const A = D.RIFT.self.amb, C = A.C; return { biome: D.F.biome, kind: D.F.rift.kind, types: [...new Set(D.mons.map(m => m.type))].join(','), n: D.mons.length, goal: document.getElementById('arcGoal').textContent, lava: C.lava.length, vents: C.vents.length, glows: A.glows.length, edges: A.edges.length, objs: D.RIFT.objs.map(o => o.kind).join(','), hp: Math.round(D.ST.hp), atk: Math.round(D.ST.atk), t: +D.g.t.toFixed(1) }; });
    const e = errors.length - e0; if (e) bad++;
    console.log(st, JSON.stringify(r), e ? errors.slice(e0, e0 + 3) : ''); await shot('cal-' + st);
  }
  console.log('errors', errors.length, errors.slice(0, 5)); await T.browser.close(); process.exit(bad || errors.length ? 1 : 0);
})();
