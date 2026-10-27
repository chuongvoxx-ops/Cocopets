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
      K.Q.pin = qpin; const C2 = CanvasRenderingContext2D.prototype, sv = C2.drawImage, log = [];
      C2.drawImage = function (img, ...a) { let dw, dh; if (a.length >= 8) { dw = a[6]; dh = a[7]; } else if (a.length >= 4) { dw = a[2]; dh = a[3]; } else { dw = img.width; dh = img.height; } const m = this.getTransform(); const sc = Math.hypot(m.a, m.b); log.push({ px: Math.round(Math.abs(dw * dh) * sc * sc), src: img.width + 'x' + img.height, op: this.globalCompositeOperation, where: new Error().stack.split('\n')[2].replace(/.*\//, '').slice(0, 60) }); return sv.apply(this, [img, ...a]); };
      const which = process_env => 0;
      if (qpin === 'frame') G.draw(c); else FD.drawBoss(c, g.boss, 200, 400);
      C2.drawImage = sv; K.Q.pin = null;
      log.sort((x, y) => y.px - x.px);
      return { id: FD.FX.FD.id, n: log.length, totalMpx: +(log.reduce((s, l) => s + l.px, 0) / 1e6).toFixed(2), top: log.slice(0, 12) };
    }, process.env.QPIN === 'frame' ? 'frame' : +(process.env.QPIN || 1));
    console.log(JSON.stringify(r, null, 0));
    await page.evaluate(() => { window.__pp.arc.quit && window.__pp.arc.quit(); });
    await page.waitForTimeout(300);
  }
  await browser.close();
})();
