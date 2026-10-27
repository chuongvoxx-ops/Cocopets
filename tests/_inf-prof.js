// Where Bahamut's frame goes: wings, rings, tentacles, fish, at each quality. usage: node tests/_inf-prof.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(120, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(9000);
  const FLUSH = process.argv[2] === 'flush';
  const r = await page.evaluate((FLUSH) => {
    const A = window.__pp.arc, G = A.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, c = A.ctx || document.querySelector('#arcCanvas').getContext('2d'), Q = window.__pp.DunFiend.KIT.Q, out = {};
    A.paused = true; const m = D.g.boss;
    [1, 2, 1, 0, 1].forEach((q, qi) => { Q.pin = q; M.prof = { _flush: FLUSH }; const t0 = performance.now(); for (let i = 0; i < 8; i++) FD.drawBoss(c, m, 200, 300); const all = (performance.now() - t0) / 8; const o = { all: +all.toFixed(1) }; Object.keys(M.prof).filter(k => k[0] !== '_').forEach(k => { o[k] = +(M.prof[k] / 8).toFixed(1); }); out["q" + q + "_" + qi] = o; });
    M.prof = null; Q.pin = null; return out;
  }, FLUSH);
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
