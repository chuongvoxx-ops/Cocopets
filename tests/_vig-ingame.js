// A screen-sized picture copied pixel for pixel onto the game's own canvas, between frames of a real floor.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl0 = +(process.argv[2] || 14);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => { window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, fl0);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), run = G.update; G.update = () => {};
    const full = document.createElement('canvas'); full.width = cv.width; full.height = cv.height; { const x = full.getContext('2d'), w = full.width, h = full.height; x.fillStyle = 'rgba(255,200,120,.08)'; x.fillRect(0, 0, w, h); const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }
    const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 12;
    const time = (key, f) => { fl(); const t0 = performance.now(); f(); fl(); T[key] = (T[key] || 0) + performance.now() - t0; };
    const copy = () => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(full, 0, 0); c.restore(); };
    for (let n = -2; n < N; n++) {
      run(1 / 60);
      time('frame', () => { c.save(); G.draw(c); c.restore(); });
      time('copy after frame', copy);
      time('frame + copy', () => { c.save(); G.draw(c); c.restore(); copy(); });
      if (n === -1) for (const key in T) T[key] = 0;
    }
    G.update = run;
    return { size: [cv.width, cv.height], T: Object.fromEntries(Object.entries(T).map(([key, v]) => [key, +(v / N).toFixed(2)])) };
  });
  console.log(fl0, JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
