// v434 PO: the JS CPU profile of Rift 03 frames (V8's sampling profiler through CDP): self time by function, mapped back
// to src/js, over N hand-driven frames of a scenario (as tests/_po-frame.js sets them up), after warming.
// usage: HTML=test-po.html STAGE=11 node tests/_po-cpu.js   env: N (6), BOSS=1, CROWD=1, ULT, AT, TOP (30), DPR (2)
process.env.RIFT = 'dunes';
const { open } = require('./_pf-lib');
const fs = require('fs'), path = require('path');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
(async () => {
  const html = process.env.HTML || 'test-po.html', T = await open({ html, dpr: +(process.env.DPR || 2), rift: 'dunes' }); const { page, errors, start, frames } = T;
  const STAGE = +(process.env.STAGE || 0), N = +(process.env.N || 6), boss = [3, 7, 11].includes(STAGE);
  await start(STAGE);
  await page.evaluate(([crowd, boss]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; for (let k = 0; k < 90; k++) G.update(1 / 60);
    if (crowd) D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).slice(0, 16).forEach((m, i) => { const b = i / 16 * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); });
    if (boss) { const b = D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt); if (b) { me.x = b.x; me.y = b.y + 6; } }
    D.g.intro = 0; D.banners.length = 0; for (let k = 0; k < (boss ? 900 : 120); k++) { me.hp = D.ST.hp; G.update(1 / 60); } }, [!!process.env.CROWD, boss]);
  await frames(12, { prof: false });
  if (process.env.ULT) { const u = process.env.ULT; await page.evaluate(([u, el, at]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.me.mp = 999; D.g.cdU = 0; D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; let k = 0; while (f && f.t < at && k++ < 900) { D.me.hp = D.ST.hp; G.update(1 / 60); } }, [u, EL[u], +(process.env.AT || { sunflare: 2.6, armageddon: 1.6, titan: 2.2, worldshaking: 1.2, deadscream: 2.0 }[u])]); await frames(2, { prof: false }); }
  const cdp = await page.context().newCDPSession(page);
  if (process.env.ALLOC) {   /* (the JS heap allocated a frame, by the function allocating it: V8's sampling heap profiler, every 1 kB) */
    await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.startSampling', { samplingInterval: 1024, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
    await frames(N, { prof: false }); const { profile: hp } = await cdp.send('HeapProfiler.stopSampling'); const by = new Map(); let all = 0;
    const walk = (n) => { const sz = n.selfSize || 0; if (sz) { const cf = n.callFrame, k = (cf.functionName || '(anon)') + ':' + (cf.lineNumber + 1); by.set(k, (by.get(k) || 0) + sz); all += sz; } (n.children || []).forEach(walk); }; walk(hp.head);
    const lines = fs.readFileSync(path.resolve(__dirname, '..', html), 'utf8').split('\n'), srcs = fs.readdirSync(path.resolve(__dirname, '../src/js')).map(f => [f, fs.readFileSync(path.resolve(__dirname, '../src/js', f), 'utf8').split('\n')]);
    const mapLn = s => s.replace(/:(\d+)/, (m, ln) => { const text = (lines[+ln - 1] || '').trim(); if (text.length < 15) return m; for (const [f, L] of srcs) { const i = L.findIndex(x => x.trim() === text); if (i >= 0) return ' ' + f.replace(/\.js$/, '') + '#' + (i + 1); } return m; });
    const raw = process.env.RAW ? (s => { const m = s.match(/:(\d+)/); return m ? s + '  | ' + (lines[+m[1] - 1] || '').trim().slice(0, 110) : s; }) : null;
    console.log(`stage ${STAGE}: JS allocated ${(all / N / 1024).toFixed(0)} kB a frame (sampled), by function:`); for (const [k, v] of [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 30))) console.log(`  ${(v / N / 1024).toFixed(1).padStart(8)} kB  ${raw ? raw(k) : mapLn(k)}`);
    console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close(); return; }
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  const fr = await frames(N, { prof: false }); const { profile } = await cdp.send('Profiler.stop');
  const tot = fr.rows.reduce((a, r) => a + r.tot, 0) / N;
  const byId = new Map(profile.nodes.map(n => [n.id, n])), self = new Map(); const dt = profile.timeDeltas; let all = 0;
  for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]), d = (dt[i + 1] || 0) / 1000; all += d; const cf = n.callFrame, k = (cf.functionName || '(anon)') + ':' + (cf.lineNumber + 1) + (cf.url ? '' : ' [' + cf.url + ']'); self.set(k, (self.get(k) || 0) + d); }
  const lines = fs.readFileSync(path.resolve(__dirname, '..', html), 'utf8').split('\n'), srcs = fs.readdirSync(path.resolve(__dirname, '../src/js')).map(f => [f, fs.readFileSync(path.resolve(__dirname, '../src/js', f), 'utf8').split('\n')]);
  const mapLn = s => s.replace(/:(\d+)/, (m, ln) => { const text = (lines[+ln - 1] || '').trim(); if (text.length < 15) return m; for (const [f, L] of srcs) { const i = L.findIndex(x => x.trim() === text); if (i >= 0) return ' ' + f.replace(/\.js$/, '') + '#' + (i + 1); } return m; });
  console.log(`stage ${STAGE} ${process.env.ULT || ''}: ${N} frames, ${tot.toFixed(0)} ms a frame; sampled ${(all / N).toFixed(0)} ms a frame (self time, ms a frame):`);
  for (const [k, v] of [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 30))) console.log(`  ${(v / N).toFixed(1).padStart(7)}  ${mapLn(k)}`);
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
