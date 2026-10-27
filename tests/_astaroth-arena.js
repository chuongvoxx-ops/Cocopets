const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 100; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(50, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  for (const [n, wait] of [[0, 6000], [1, 3500]]) {
    await page.waitForTimeout(wait);
    for (const st of [null, 'toon']) { await page.evaluate(st => { const D = window.__pp.arc.game._dbg; D.FD.FX.mem.style = st; D.g.stopT = 0.6; }, st); await page.waitForTimeout(150); await page.screenshot({ path: path.resolve(__dirname, `../shots/ast-arena-${n}-${st || 'cur'}.png`) }); }
    await page.evaluate(() => { window.__pp.arc.game._dbg.FD.FX.mem.style = null; });
  }
  console.log('errors', errors.length, errors.slice(0, 3)); await browser.close();
})();
