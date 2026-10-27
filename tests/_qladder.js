const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floor = +(process.argv[2] || 190);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); }); await page.waitForTimeout(+(process.env.WAIT || 9000));
  for (const q of [2, 1, 0]) {
    await page.evaluate(q => { window.__pp.DunFiend.KIT.Q.pin = q; window.__pp.arc.game._dbg.g.stopT = 9; }, q);
    await page.waitForTimeout(250);
    const [bx, by] = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.g.boss; return [D.FD.FX.sx(m.x), D.FD.FX.sy(m.y)]; });
    await page.screenshot({ path: path.resolve(__dirname, `../shots/q${q}-${floor}.png`), clip: { x: Math.max(0, Math.min(390 - 300, bx - 150)), y: Math.max(0, Math.min(844 - 300, by - 200)), width: 300, height: 300 } });
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
