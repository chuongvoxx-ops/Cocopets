// The cost of each step of a kept creature (paint steps, the light pass) on a beast fiend floor.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl0 = +(process.argv[2] || 80);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl0);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update, K = P.DunFiend.KIT; G.update = () => {};
    for (let i = 0; i < 300; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; }
    const c = document.querySelector('canvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), rec = [];
    for (let i = 0; i < 30; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; fl(); const t0 = performance.now(); FD.drawBoss(c, D.g.boss, FD.FX.sx(D.g.boss.x), FD.FX.sy(D.g.boss.y)); fl(); rec.push(+(performance.now() - t0).toFixed(1)); }
    // the light pass alone, on the kept canvas, at full and at the old sharpness
    G.update = run; return rec.join(' ');
  });
  console.log(fl0, 'boss per frame', r);
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
