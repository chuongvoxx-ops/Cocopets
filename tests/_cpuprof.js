const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floor = +(process.argv[2] || 30);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); }); await page.waitForTimeout(4000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  await page.waitForTimeout(5000);
  const { profile } = await cdp.send('Profiler.stop');
  // self time per function
  const self = {}, byId = {}; profile.nodes.forEach(n => byId[n.id] = n);
  const dt = profile.timeDeltas; let total = 0;
  profile.samples.forEach((id, i) => { const n = byId[id], cf = n.callFrame, k = (cf.functionName || '(anon)') + ' ' + (cf.url || '').replace(/.*\//, '') + ':' + cf.lineNumber; self[k] = (self[k] || 0) + dt[i]; total += dt[i]; });
  const top = Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 28);
  console.log('total ms', (total / 1000).toFixed(0));
  top.forEach(([k, v]) => console.log((v / 1000).toFixed(0).padStart(6), (100 * v / total).toFixed(1).padStart(5) + '%', k));
  await browser.close();
})();
