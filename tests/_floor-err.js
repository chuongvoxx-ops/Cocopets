const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const n = +(process.argv[2] || 102);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  page.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(1, 4).join(' | ')));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 300)); });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  await page.evaluate(n => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.best = 199; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); try { P.dun.startDungeon(n, 1234 + n); } catch (e) { console.error('start: ' + e.message + ' ' + e.stack.split('\n').slice(1,3).join(' | ')); } }, n);
  await page.waitForTimeout(3000);
  console.log('state', await page.evaluate(() => window.__pp.arc.state));
  await browser.close();
})();
