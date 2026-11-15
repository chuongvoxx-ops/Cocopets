// Rift 0 (worker P): micro-benchmarks, paused and repeated (the minimum of several runs, robust to a busy machine):
//  - every ground chunk of a stage painted once (DunWorld.chunk, script time; the raster flushed apart),
//  - the Fire Flan's gel rebuilt (deform) at the GPU grid 44x30, the "Fewer effects" grid 32x22 and the 2D grid 32x20,
//  - the bosses' rigs (Bomb King, Ifrit) and Ifrit's anchorAt (each a full rig).
// HTML=test-calP.html node tests/_cal-p-bench.js [stages...]   (default 0 3 6: the three dungeons)
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 1 }); const { page, start } = T; await page.evaluate(() => { window.__noPetGL = 1; });
  const stages = process.argv.slice(2).map(Number); if (!stages.length) stages.push(0, 3, 6);
  for (const s of stages) { await start('caldera', s);
    const r = await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, M = D.M, CH = P.DunWorld.CH, T = 48, k = 1, best = [];
      for (let rep = 0; rep < 3; rep++) { let js = 0, n = 0; for (let cy = 0; cy * CH < M.MH; cy++) for (let cx = 0; cx * CH < M.MW; cx++) { const t = performance.now(); P.DunWorld.chunk(M, cx, cy, T, k); js += performance.now() - t; n++; } best.push(js); }
      return { biome: D.F.biome, chunks: Math.round(M.MW / CH) * Math.round(M.MH / CH), scriptMs: Math.round(Math.min(...best)) }; });
    console.log(`stage ${s} ${r.biome}: all ${r.chunks} chunks painted, script ${r.scriptMs} ms (min of 3)`); }
  const g = await page.evaluate(() => { const FD = window.__pp.FIEND_DEFS, MD = FD.calflan.__dbg.MODEL, out = {}, P = { wob: 0.6, wt: 1.3, lobes: 0.5, lobeT: 2, pods: [{ L: 0.8, w: 0.5, a: 1, el: 0.3 }], H: 1.85, Rw: 1.62 };
    for (const [nu, nv] of [[44, 30], [32, 22], [32, 20]]) { const G = MD.mkGel(nu, nv); let best = 1e9; for (let rep = 0; rep < 5; rep++) { const t = performance.now(); for (let i = 0; i < 100; i++) { P.wt = i * 0.016; MD.deform(G, P); } best = Math.min(best, (performance.now() - t) / 100); } out[nu + 'x' + nv] = +best.toFixed(3); }
    const BK = FD.calbomb.MODEL, IF = FD.califrit.IFRIT.MODEL, tm = f => { let best = 1e9; for (let rep = 0; rep < 5; rep++) { const t = performance.now(); for (let i = 0; i < 50; i++) f(i); best = Math.min(best, (performance.now() - t) / 50); } return +best.toFixed(3); };
    out.bombRig = tm(i => BK.rig(BK.blankPose(), i * 0.016)); out.ifritRig = tm(i => IF.rig(IF.blankPose(), i * 0.016)); out.ifritAnchorAt = tm(i => IF.anchorAt('ventL', 0, 0, 0, IF.blankPose(), 1, i * 0.016)); return out; });
  console.log('Flan gel deform ms/frame', JSON.stringify(g)); await T.browser.close();
})();
