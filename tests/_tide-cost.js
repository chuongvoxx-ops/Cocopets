// What a tide costs to draw on floor 100's canvas at a few sizes, and which part of it: env HTML, PIN, CAP
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(cap => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(100, 7); }, +(process.env.CAP || 0));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, run = window.__run; for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
    const FD = D.FD, FX = FD.FX, C = FX.C, c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), Dp = P.FIEND_DEFS.pale, dt = Dp._t.drawTide;
    for (let i = 0; i < 300; i++) run(1 / 60); c.save(); G.draw(c); c.restore();
    const T = FX.Tz(), N = 30, tr = c.getTransform();
    const time = (fn) => { fl(); const t0 = performance.now(); for (let i = 0; i < N; i++) { c.save(); c.setTransform(tr); fn(i); c.restore(); } fl(); return +((performance.now() - t0) / N).toFixed(2); };
    const out = { T };
    for (const rad of [4, 8, 12]) {
      const tide = (real, forming) => ({ x: C.x, y: C.y, r: rad, w: 1.3, ga: 0.5, gw: 0.55, t: forming ? 0.2 : 2, form: 1.15, v: 5.5, hit: 0, real });
      out['r' + rad] = { real: time(i => dt(c, FX, tide(true, false), T, 3 + i * 0.016)), forming: time(i => dt(c, FX, tide(true, true), T, 3 + i * 0.016)), lie: time(i => dt(c, FX, tide(false, false), T, 3 + i * 0.016)) };
    }
    return out;
  });
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
