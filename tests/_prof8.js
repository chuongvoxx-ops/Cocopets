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
      K.Q.pin = qpin; const by = {}, tot = {};
      const wrap = (k) => { const f = K[k]; K[k] = function () { const st = new Error().stack.split('\n').slice(2, 5).map(l => l.replace(/.*test.html:/, '').replace(/\)$/, '')).join('<'); const key = k + ' @ ' + st; by[key] = (by[key] || 0) + 1; tot[k] = (tot[k] || 0) + 1; return f.apply(this, arguments); }; };
      ['body', 'tube', 'tufts', 'glow', 'shade', 'eyeR'].forEach(wrap);
      FD.drawBoss(c, g.boss, 200, 400);
      K.Q.pin = null;
      const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 14);
      return { id: FD.FX.FD.id, act: g.boss.act, tot, top };
    }, +(process.env.QPIN || 1));
    console.log(JSON.stringify(r, null, 0));
    await page.evaluate(() => { window.__pp.arc.quit && window.__pp.arc.quit(); });
    await page.waitForTimeout(300);
  }
  await browser.close();
})();
