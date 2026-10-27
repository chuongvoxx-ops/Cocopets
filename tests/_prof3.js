// real raster cost: flush the GPU queue with a 1px readback after each draw; count kit primitives per boss frame
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floor = +(process.argv[2] || 110);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(6000);
  const r = await page.evaluate(() => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, FD = D.FD, c = document.querySelector('canvas').getContext('2d'), K = P.DunFiend.KIT;
    const time = (f, n) => { f(); c.getImageData(0, 0, 1, 1); const t0 = performance.now(); for (let i = 0; i < n; i++) { f(); c.getImageData(0, 0, 1, 1); } return +((performance.now() - t0) / n).toFixed(2); };
    const m = D.g.boss, out = { act: m && m.act, qNow: K.Q.q };
    const Q = K.Q; [2, 1, 0].forEach(q => { Q.pin = q; out['boss_q' + q] = time(() => FD.drawBoss(c, m, 200, 400), 5); }); Q.pin = 0;
    out.fullNoBoss = time(() => { const b = D.g.boss; D.g.boss = null; try { G.draw(c); } finally { D.g.boss = b; } }, 5);
    out.full = time(() => G.draw(c), 5);
    // counts
    const cnt = {}; const wrap = (obj, k) => { const f = obj[k]; obj[k] = function () { cnt[k] = (cnt[k] || 0) + 1; return f.apply(this, arguments); }; };
    ['body', 'tube', 'tufts', 'glow', 'shade', 'patt', 'stage', 'eyeR', 'teeth'].forEach(k => wrap(K, k));
    const C2 = CanvasRenderingContext2D.prototype, saved = {}; ['fill', 'stroke', 'clip', 'createRadialGradient', 'createLinearGradient', 'drawImage', 'fillRect', 'save'].forEach(k => { saved[k] = C2[k]; C2[k] = function () { cnt['ctx.' + k] = (cnt['ctx.' + k] || 0) + 1; return saved[k].apply(this, arguments); }; });
    let blends = 0; const d = Object.getOwnPropertyDescriptor(C2, 'globalCompositeOperation'); Object.defineProperty(C2, 'globalCompositeOperation', { set(v) { if (v !== 'source-over' && v !== 'lighter') blends++; d.set.call(this, v); }, get() { return d.get.call(this); }, configurable: true });
    FD.drawBoss(c, m, 200, 400);
    Object.keys(saved).forEach(k => C2[k] = saved[k]); Object.defineProperty(C2, 'globalCompositeOperation', d);
    cnt.blendsNonLighter = blends; out.counts = cnt; Q.pin = null;
    return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
