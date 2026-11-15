// Rift 0 (worker P): the cost of painting a stage's ground chunks (DunWorld.chunk), every chunk of the map once, with a
// CPU profile of where the time goes. HTML=test-calP.html node tests/_cal-p-chunks.js <stage> [top]
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 1 }); const { page, start } = T, s = +(process.argv[2] || 0);
  if (process.env.LOWFX) await page.evaluate(() => { window.__pp.st.lowFx = true; });
  await page.evaluate(() => { window.__noPetGL = 1; }); await start('caldera', s);
  const cdp = await page.context().newCDPSession(page); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 }); await cdp.send('Profiler.start');
  const r = await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, M = D.M, CH = P.DunWorld.CH, TS = D.F && P.arc.game._dbg.cam ? null : null; const T = Math.round(P.arc.game.Tz ? P.arc.game.Tz() / (D.g.zoom || 1) : 48), k = Math.min(P.arc.dpr || 1, 1.5);
    const out = []; for (let cy = 0; cy * CH < M.MH; cy++) for (let cx = 0; cx * CH < M.MW; cx++) { const t = performance.now(); const cv = P.DunWorld.chunk(M, cx, cy, T, k); cv.getContext('2d').getImageData(0, 0, 1, 1); out.push(performance.now() - t); }
    out.sort((a, b) => a - b); return { MW: M.MW, MH: M.MH, T, k, n: out.length, tot: Math.round(out.reduce((a, b) => a + b, 0)), med: +out[out.length >> 1].toFixed(1), max: +out[out.length - 1].toFixed(1), min: +out[0].toFixed(1) }; });
  const { profile } = await cdp.send('Profiler.stop'); console.log(JSON.stringify(r));
  const byId = new Map(); for (const nd of profile.nodes) byId.set(nd.id, nd); const cnt = new Map(); profile.samples.forEach((id, i) => cnt.set(id, (cnt.get(id) || 0) + (profile.timeDeltas[i] || 0)));
  const self = new Map(); for (const [id, us] of cnt) { const f = byId.get(id).callFrame, kk = `${f.functionName || '(anon)'}:${f.lineNumber + 1}`; self.set(kk, (self.get(kk) || 0) + us); }
  // inclusive time per function
  const par = new Map(); for (const nd of profile.nodes) for (const ch of nd.children || []) par.set(ch, nd.id);
  const incl = new Map(); for (const [id, us] of cnt) { const seen = new Set(); let p = id; while (p) { const f = byId.get(p).callFrame, kk = `${f.functionName || '(anon)'}:${f.lineNumber + 1}`; if (!seen.has(kk)) { seen.add(kk); incl.set(kk, (incl.get(kk) || 0) + us); } p = par.get(p); } }
  const N = +(process.argv[3] || 25); console.log('-- self'); for (const [k2, us] of [...self].sort((a, b) => b[1] - a[1]).slice(0, N)) console.log((us / 1000).toFixed(1).padStart(8), k2);
  console.log('-- inclusive'); for (const [k2, us] of [...incl].sort((a, b) => b[1] - a[1]).slice(0, N)) console.log((us / 1000).toFixed(1).padStart(8), k2);
  await T.browser.close();
})();
