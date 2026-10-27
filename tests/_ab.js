// A/B of builds on one fight: each round runs every build in turn (a fresh page each), so drift falls on all alike.
// usage: node tests/_ab.js floor cut rounds a.html b.html ...   → mean and median frame per build, per round and overall
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const [fl, cut, rounds, ...files] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const res = {}; files.forEach(f => { res[f] = []; });
  for (let r = 0; r < +rounds; r++) for (const f of files) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
    await page.goto('file://' + path.resolve(__dirname, '..', f));
    await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
    await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), +fl);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
    await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
    const v = await page.evaluate((cut) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update; G.update = () => {};
      const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; } };
      step(5); const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(5); }
      const c = document.querySelector('canvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), rec = [];
      for (let i = 0; i < 100; i++) { const a = i * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; fl(); const t0 = performance.now(); G.draw(c); fl(); if (i >= 20) rec.push(performance.now() - t0); }
      G.update = run; return rec;
    }, +cut);
    res[f].push(v); await page.close();
    const b = v.slice().sort((x, y) => x - y); console.log('round', r, f, 'mean', (v.reduce((a, x) => a + x, 0) / v.length).toFixed(1), 'med', b[b.length >> 1].toFixed(1), 'p90', b[Math.floor(b.length * 0.9)].toFixed(1));
  }
  for (const f of files) { const all = res[f].flat(), b = all.slice().sort((x, y) => x - y); console.log('ALL', f, 'mean', (all.reduce((a, x) => a + x, 0) / all.length).toFixed(2), 'med', b[b.length >> 1].toFixed(1), 'p90', b[Math.floor(b.length * 0.9)].toFixed(1)); }
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
