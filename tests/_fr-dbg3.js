const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([n, seed]) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(n, seed); }, [25, 2525]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(3000);
  const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, k = D.RULES.keys[1]; D.me.x = k.x; D.me.y = k.y; const log = []; const t0 = performance.now(); while (performance.now() - t0 < 700) { await new Promise(r => requestAnimationFrame(r)); log.push([k.st, D.me.x.toFixed(2), D.me.y.toFixed(2), k.shards.filter(q => q.got).length, k.shards.map(q => Math.hypot(q.x - k.x, q.y - k.y).toFixed(1)).join('/')]); } return { k: [k.x, k.y, k.room], log: log.filter((_, i) => i % 6 === 0) }; });
  console.log(JSON.stringify(r)); await browser.close();
})();
