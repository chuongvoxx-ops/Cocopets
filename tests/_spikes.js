const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 20; P.st.abOv = { el: 'fire', strong: 'spikes' }; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 3));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.mp = 999; D.setKit('strong', Object.assign({}, D.KIT.strong, { key: 's_spikes', el: 'fire', name: 'Spike Bloom' })); D.useStrong('strong'); return D.KIT.strong.key; });
  await page.waitForTimeout(260); await page.screenshot({ path: path.resolve(__dirname, '../shots/spikes-fire.png') });
  await page.waitForTimeout(400); await page.screenshot({ path: path.resolve(__dirname, '../shots/spikes-fire2.png') });
  console.log(r, 'errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
