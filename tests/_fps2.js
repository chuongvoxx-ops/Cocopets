const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '110').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const floor of floors) {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate((pin) => { window.__pp.beginPlay(); if (pin != null) window.__pp.DunFiend.KIT.Q.pin = pin; }, process.env.QPIN != null ? +process.env.QPIN : null);
    await page.waitForTimeout(4000);
    const r = await page.evaluate(async () => {
      const D = window.__pp.arc.game._dbg; const samples = []; let last = performance.now();
      await new Promise(res => { let n = 0; const tick = () => { const now = performance.now(); samples.push(now - last); last = now; if (++n < 150) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
      samples.sort((a, b) => a - b); const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      return { floor: D.F.floor, id: D.FD && D.FD.FX.FD.id, act: D.g.boss && D.g.boss.act, q: window.__pp.DunFiend.KIT.Q.q, avg: +avg.toFixed(1), p50: +samples[75].toFixed(1), p90: +samples[135].toFixed(1), max: +samples[149].toFixed(1) };
    });
    console.log(JSON.stringify(r));
    await page.evaluate(() => { window.__pp.arc.quit && window.__pp.arc.quit(); }); await page.waitForTimeout(300);
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
