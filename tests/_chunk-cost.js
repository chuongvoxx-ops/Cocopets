// What painting one ground chunk costs on each kind of floor (the chunk painted, then read so it is really rasterised),
// and how many chunks a walk across a floor paints. usage: node tests/_chunk-cost.js [floors]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '3,6,14,22,43,51,63,102').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const r = await page.evaluate(() => {
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, W = P.DunWorld, M = D.M, sp = document.createElement('canvas'); sp.width = sp.height = 1; const sx = sp.getContext('2d');
      const times = []; for (let i = 0; i < 6; i++) { const cx = 1 + (i % 3), cy = 1 + Math.floor(i / 3); const t0 = performance.now(); const cv = W.chunk(M, cx, cy, 40, Math.min(A.dpr || 1, 1.5)); sx.drawImage(cv, 0, 0, 1, 1); sx.getImageData(0, 0, 1, 1); times.push(performance.now() - t0); }
      const b = times.slice().sort((a, b) => a - b);
      return { MW: M.MW, MH: M.MH, chunks: Math.ceil(M.MW / W.CH) * Math.ceil(M.MH / W.CH), med: +b[b.length >> 1].toFixed(1), max: +b[b.length - 1].toFixed(1) };
    });
    console.log(fl, JSON.stringify(r));
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
