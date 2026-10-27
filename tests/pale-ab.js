// A/B: the flushed frame cost of the brain fight in each phase, for two builds. usage: node tests/pale-ab.js a.html b.html
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const files = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const res = {};
  for (let round = 0; round < 2; round++) for (const f of files) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
    await page.goto('file://' + path.resolve(__dirname, '..', f));
    await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
    await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
    for (const [ph, hp] of [[1, 1], [2, 0.69], [3, 0.34]]) {
      await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), 100);
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
      await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
      await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
      const ms = await page.evaluate(hp => {
        const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update; G.update = () => {};
        const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } };
        step(5); const m = D.g.boss; if (hp < 1) { m.hp = m.maxhp * hp; step(4.5); } me.x = C.x; me.y = C.y + 6; step(0.5);
        const c = document.querySelector('canvas').getContext('2d'), N = 40; for (let i = 0; i < 5; i++) { run(1 / 60); G.draw(c); }
        const t0 = performance.now(); for (let i = 0; i < N; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; G.draw(c); c.getImageData(0, 0, 1, 1); } const r = (performance.now() - t0) / N;
        G.update = run; return +r.toFixed(2);
      }, hp);
      (res[f] = res[f] || { 1: [], 2: [], 3: [] })[ph].push(ms);
      await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
    }
    await page.close();
  }
  for (const f of files) console.log(f, JSON.stringify(Object.fromEntries(Object.entries(res[f]).map(([k, v]) => ['phase' + k, +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)]))));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
