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
    const r = await page.evaluate(() => {
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, FD = D.FD, c = document.querySelector('canvas').getContext('2d'), K = P.DunFiend.KIT, g = D.g, DF = P.FIEND_DEFS[FD.FX.FD.id];
      const fl = () => c.getImageData(0, 0, 1, 1);
      const time = (f, n) => { f(); fl(); const t0 = performance.now(); for (let i = 0; i < n; i++) { f(); fl(); } return +((performance.now() - t0) / n).toFixed(2); };
      const W = A.W || 390, H = A.H || 844, T = 40 * g.zoom, cam = { x: D.me.x, y: D.me.y }, FX = FD.FX;
      const out = { id: FD.FX.FD.id, act: g.boss && g.boss.act, q: K.Q.q };
      out.full = time(() => G.draw(c), 4);
      out.sky = DF.sky ? time(() => DF.sky(c, W, H, g.t, cam, T, FX), 4) : 0;
      out.overlay = DF.overlay ? time(() => { c.save(); DF.overlay(c, FX, g.t, T); c.restore(); }, 4) : 0;
      out.ground = time(() => FD.drawGround(c), 4);
      out.fx = time(() => FD.drawFx(c), 4);
      out.props = time(() => FD.S.props.forEach(p => FD.drawProp(c, p)), 4);
      out.objs = (FD.S.objs || []).length;
      K.Q.pin = 1; out.boss_q1 = time(() => FD.drawBoss(c, g.boss, 200, 400), 4); K.Q.pin = null;
      return out;
    });
    console.log(JSON.stringify(r));
    await page.evaluate(() => { window.__pp.arc.quit && window.__pp.arc.quit(); });
    await page.waitForTimeout(300);
  }
  await browser.close();
})();
