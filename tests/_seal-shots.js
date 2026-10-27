// pictures of the rift sealing: the fracture, resonance, closing
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, shot, start, run } = T;
  const id = process.argv[2] || 'aurora', st = +(process.argv[3] || 8);
  await start(id, st); await run(6);
  console.log(await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; if (!b) return 'no boss'; b.under = false; D.hitMon(b, 1e12, { pierce: true }); return JSON.stringify({ hp: b.hp, dead: b.dead, act: b.act }); }));
  const seen = {}; const t0 = Date.now();
  while (Date.now() - t0 < 30000) { const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.RIFT.self.cine; return { st: window.__pp.arc.state, step: C ? C.step : -1, t: C ? C.t : 0 }; }); if (r.st === 'end') break; if (!seen['_' + r.step]) { seen['_' + r.step] = 1; console.log(JSON.stringify(r)); }
    const key = r.step + (r.step === 2 && r.t > 2 ? 'b' : '') + (r.step === 3 && r.t > 0.7 ? 'b' : ''); if (r.step >= 1 && !seen[key]) { seen[key] = 1; await page.waitForTimeout(r.step === 1 ? 600 : 250); await shot('seal-' + key); }
    await page.waitForTimeout(80); }
  console.log(Object.keys(seen).join(','), 'errors', errors.length, errors.slice(0, 2)); process.exit(0);
})();
