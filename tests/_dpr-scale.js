// How a fiend frame's cost scales with the canvas resolution (is it fill-bound or call-bound?). usage: node tests/_dpr-scale.js floors
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '120').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    const out = {};
    for (const cap of [2, 1.5, 1]) {
      await page.evaluate(c => { window.__pp.arc.dunCap = c; }, cap);
      await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
      await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
      await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
      const r = await page.evaluate(() => {
        const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update; G.update = () => {};
        for (let i = 0; i < 300; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } me.x = C.x; me.y = C.y + 5; for (let i = 0; i < 30; i++) run(1 / 60);
        const c = document.querySelector('canvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), N = 24;
        const timeN = () => { for (let i = 0; i < 3; i++) { run(1 / 60); G.draw(c); } fl(); const t0 = performance.now(); for (let i = 0; i < N; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; G.draw(c); fl(); } return +((performance.now() - t0) / N).toFixed(1); };
        const frame = timeN(); const keep = FD.drawBoss; FD.drawBoss = () => {}; const noBoss = timeN(); FD.drawBoss = keep;
        G.update = run; return { dpr: P.arc.dpr, frame, noBoss, boss: +(frame - noBoss).toFixed(1) };
      });
      out['x' + cap] = r;
      await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
    }
    console.log(fl, JSON.stringify(out));
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
