// The backdrop alone on a floor: the canvas transform it is drawn under and its cost (flushed), drawn a number of times.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 6);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => { window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, fl);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate((soft) => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, DW = P.DunWorld, o = DW.backdrop; let c = document.getElementById('arcCanvas').getContext('2d');
    let info = null; DW.backdrop = function (cx, kind, W, H, ...rest) { const M = cx.getTransform(); info = { kind, W, H, M: [M.a, M.b, M.c, M.d, M.e, M.f] }; return o.call(this, cx, kind, W, H, ...rest); };
    c.save(); G.draw(c); c.restore(); DW.backdrop = o;
    if (soft) { const cv = document.createElement('canvas'); cv.width = Math.round(A.W * A.dpr); cv.height = Math.round(A.H * A.dpr); c = cv.getContext('2d', { willReadFrequently: true }); c.setTransform(A.dpr, 0, 0, A.dpr, 0, 0); }
    const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 12, W = A.W, H = A.H;
    const time = (k, f) => { fl(); const t0 = performance.now(); f(); fl(); T[k] = (T[k] || 0) + performance.now() - t0; };
    for (let n = 0; n < 3; n++) { c.save(); o.call(DW, c, info.kind, W, H, 10, 12, 44, n * 0.13); c.restore(); } fl();
    for (let n = 0; n < N; n++) {
      time('backdrop', () => { c.save(); o.call(DW, c, info.kind, W, H, 10 + n * 0.37, 12 + n * 0.21, 44, n * 0.13); c.restore(); });
      time('plain', () => { c.fillStyle = '#123'; c.fillRect(0, 0, W, H); });
    }
    return { info, T: Object.fromEntries(Object.entries(T).map(([k, v]) => [k, +(v / N).toFixed(2)])) };
  }, process.env.CANVAS === 'soft');
  console.log(fl, JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
