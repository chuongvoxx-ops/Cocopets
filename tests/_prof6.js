const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '110').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const floor of floors) {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(+(process.env.WAIT || 5000));
    const r = await page.evaluate((qpin) => {
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, FD = D.FD, c = document.querySelector('canvas').getContext('2d'), K = P.DunFiend.KIT, g = D.g;
      const fl = () => c.getImageData(0, 0, 1, 1);
      const time = (f, n) => { f(); fl(); const t0 = performance.now(); for (let i = 0; i < n; i++) { f(); fl(); } return +((performance.now() - t0) / n).toFixed(2); };
      K.Q.pin = qpin; const out = { id: FD.FX.FD.id, q: qpin };
      const boss = () => FD.drawBoss(c, g.boss, 200, 400);
      out.base = time(boss, 4);
      const abl = (name, setup, teardown) => { setup(); out['no_' + name] = time(boss, 4); teardown(); };
      const C2 = CanvasRenderingContext2D.prototype;
      let sv;
      abl('tufts', () => { sv = K.tufts; K.tufts = () => {}; }, () => K.tufts = sv);
      abl('clip', () => { sv = C2.clip; C2.clip = function () {}; }, () => C2.clip = sv);
      abl('stroke', () => { sv = C2.stroke; C2.stroke = function () {}; }, () => C2.stroke = sv);
      abl('fill', () => { sv = C2.fill; C2.fill = function () {}; }, () => C2.fill = sv);
      abl('rgrad', () => { sv = C2.createRadialGradient; C2.createRadialGradient = function () { return { addColorStop() {} }; }; }, () => C2.createRadialGradient = sv);
      abl('drawImage', () => { sv = C2.drawImage; C2.drawImage = function () {}; }, () => C2.drawImage = sv);
      abl('body', () => { sv = K.body; K.body = () => {}; }, () => K.body = sv);
      abl('tube', () => { sv = K.tube; K.tube = () => {}; }, () => K.tube = sv);
      abl('glow', () => { sv = K.glow; K.glow = () => {}; }, () => K.glow = sv);
      abl('shade', () => { sv = K.shade; K.shade = () => {}; }, () => K.shade = sv);
      abl('stage', () => { sv = K.stage; K.stage = (c, key, X, Y, w, h, oy, paint) => { c.save(); c.translate(X, Y); paint(c); c.restore(); }; }, () => K.stage = sv);
      K.Q.pin = null;
      return out;
    }, +(process.env.QPIN || 1));
    console.log(JSON.stringify(r));
    await page.evaluate(() => { window.__pp.arc.quit && window.__pp.arc.quit(); });
    await page.waitForTimeout(300);
  }
  await browser.close();
})();
