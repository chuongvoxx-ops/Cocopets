// Profiles a Super Fiend's drawing in detail. usage: node tests/fiend-prof.js [floor]
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
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(8000);
  const r = await page.evaluate(() => {
    const A = window.__pp.arc, G = A.game, D = G._dbg, FD = D.FD, c = document.querySelector('canvas').getContext('2d');
    const time = (f, n) => { f(); const t0 = performance.now(); for (let i = 0; i < n; i++) f(); return +((performance.now() - t0) / n).toFixed(2); };
    const m = D.g.boss, T = 40 * D.g.zoom;
    const out = { dpr: A.dpr, zoom: D.g.zoom, act: m && m.act, full: time(() => G.draw(c), 8), boss: time(() => FD.drawBoss(c, m, 200, 400), 8) };
    // the same frame drawn with the stage lighting skipped, to see what it costs
    const Q = window.__pp.DunFiend.KIT.Q; out.qNow = Q.q; [2, 1, 0].forEach(q => { Q.pin = q; out['boss_q' + q] = time(() => FD.drawBoss(c, m, 200, 400), 8); }); Q.pin = null;
    return out;
  });
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
