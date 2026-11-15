// Rift 0 (worker P): a CPU profile of a stage's first seconds after Start (or its loading with LOAD=1); prints the
// heaviest functions by self time. HTML=test-calP.html node tests/_cal-p-prof.js <stage> [secs]
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 1 }); const { page, errors } = T, s = +(process.argv[2] || 0), secs = +(process.argv[3] || 2);
  if (process.env.LOWFX) await page.evaluate(() => { window.__pp.st.lowFx = true; });
  const cdp = await page.context().newCDPSession(page); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  if (process.env.LOAD) await cdp.send('Profiler.start');
  await page.evaluate(async s => { const P = window.__pp; P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('caldera', s); while (P.arc.state !== 'ready') await new Promise(r => setTimeout(r, 5)); }, s);
  if (!process.env.LOAD) { await cdp.send('Profiler.start'); }
  if (!process.env.LOAD) await page.evaluate(async secs => { const P = window.__pp; P.beginPlay(); const D = P.arc.game._dbg, t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (D.me && !D.me.dead) D.me.hp = D.ST.hp; } }, secs);
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map(), byId = new Map(); for (const nd of profile.nodes) byId.set(nd.id, nd);
  const dt = profile.timeDeltas, cnt = new Map(); profile.samples.forEach((id, i) => cnt.set(id, (cnt.get(id) || 0) + (dt[i] || 0)));
  let tot = 0; for (const [id, us] of cnt) { const nd = byId.get(id), f = nd.callFrame, k = `${f.functionName || '(anon)'} :${f.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + us); tot += us; }
  const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 30));
  const par = new Map(); for (const nd of profile.nodes) for (const ch of nd.children || []) par.set(ch, nd.id);
  const hot = (process.env.HOT || 'drawImage,getImageData,putImageData,getContext,createPattern').split(','), callers = new Map();
  for (const [id, us] of cnt) { const nd = byId.get(id); if (!hot.includes(nd.callFrame.functionName)) continue; let p = par.get(id), chain = []; for (let k = 0; k < 3 && p; k++) { const f = byId.get(p).callFrame; chain.push(`${f.functionName || '(anon)'}:${f.lineNumber + 1}`); p = par.get(p); } const key = nd.callFrame.functionName + ' <- ' + chain.join(' <- '); callers.set(key, (callers.get(key) || 0) + us); }
  for (const [k, us] of [...callers].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log('  ', (us / 1000).toFixed(1).padStart(8), k);
  console.log('total ms', (tot / 1000).toFixed(0)); for (const [k, us] of top) console.log((us / 1000).toFixed(1).padStart(8), k);
  console.log('errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})();
