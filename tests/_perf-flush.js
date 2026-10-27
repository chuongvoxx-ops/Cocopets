// Times the Super Fiend's drawing pieces. usage: node tests/fiend-perf.js [floor]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floor = +(process.argv[2] || 10);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(9000);
  const r = await page.evaluate(() => {
    const A = window.__pp.arc, G = A.game, D = G._dbg, FD = D.FD, c = A.ctx || document.querySelector('#arcCanvas').getContext('2d');
    const time = (f, n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) f(); return +((performance.now() - t0) / n).toFixed(2); };
    const m = D.g.boss, cam = { x: D.me.x, y: D.me.y };
    return { upd: time(() => G.update(1 / 60), 20), full: time(() => G.draw(c), 10), arena: time(() => FD.drawArena(c, A.W, A.H, cam, 40 * D.g.zoom, D.g.t), 10), boss: time(() => FD.drawBoss(c, m, 200, 400), 10), bossFlush: time(() => { FD.drawBoss(c, m, 200, 400); c.getImageData(0, 0, 1, 1); }, 10), fullFlush: time(() => { G.draw(c); c.getImageData(0, 0, 1, 1); }, 10), ground: time(() => FD.drawGround(c), 10) };
  });
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
