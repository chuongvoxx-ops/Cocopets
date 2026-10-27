// How long each fiend's ground picture takes to paint (a forced repaint of the arena layer, less a normal one).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '10,20,30,40,50,60,70,80,90,100,110,120').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
    await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, run = G.update; G.update = () => {};
      for (let i = 0; i < 200; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; }
      const c = document.querySelector('canvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), A = P.arc, T = FD.FX.Tz();
      const once = () => { fl(); const t0 = performance.now(); FD.drawArena(c, A.W, A.H, { x: me.x, y: me.y }, T, D.g.t); fl(); return performance.now() - t0; };
      once(); const base = (once() + once() + once()) / 3;
      const rep = []; for (let i = 0; i < 3; i++) { FD.S.arenaK = -1; rep.push(once()); }
      G.update = run; return { T: +T.toFixed(1), px: FD.S.arenaCv.width, base: +base.toFixed(1), paint: +(rep.reduce((a, b) => a + b) / 3 - base).toFixed(1) };
    });
    console.log(fl, JSON.stringify(r));
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
