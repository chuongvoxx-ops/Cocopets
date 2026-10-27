// Pattern fills on the game's own canvas: the backdrop's water pattern against a test tile, pinned pixel for pixel.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => { window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, 6);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, A = P.arc, G = A.game, cv = document.querySelector('canvas'), c = cv.getContext('2d'), DW = P.DunWorld;
    G.update = () => {};
    const mkTile = k => { const t = document.createElement('canvas'); t.width = t.height = 128 * k; const x = t.getContext('2d'); x.scale(k, k); x.fillStyle = '#1E4A47'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 26; i++) { x.strokeStyle = 'rgba(150,230,210,.2)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(i * 5, i * 4); x.quadraticCurveTo(i * 5 + 9, i * 4 - 4, i * 5 + 18, i * 4); x.stroke(); } return t; };
    const pT = c.createPattern(mkTile(2), 'repeat'), pW = DW.pattern('water', 2), pW1 = DW.pattern('water', 1);
    const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 12, W = A.W, H = A.H;
    const time = (k, f) => { fl(); const t0 = performance.now(); f(); fl(); T[k] = (T[k] || 0) + performance.now() - t0; };
    const pin = (p, e, f, k) => p.setTransform(new DOMMatrix([1 / k, 0, 0, 1 / k, Math.round(e * k) / k, Math.round(f * k) / k]));
    for (let n = -2; n < N; n++) {
      const e = 123.37 + n * 1.1, f = 77.61 + n * 0.7;
      time('test tile 1:1', () => { pin(pT, e, f, 2); c.fillStyle = pT; c.fillRect(0, 0, W, H); });
      time('water 1:1', () => { pin(pW, e, f, 2); c.fillStyle = pW; c.fillRect(0, 0, W, H); });
      time('water 1x scaled', () => { pW1.setTransform(new DOMMatrix([1, 0, 0, 1, e, f])); c.fillStyle = pW1; c.fillRect(0, 0, W, H); });
      time('plain', () => { c.fillStyle = '#123'; c.fillRect(0, 0, W, H); });
      if (n === -1) for (const k in T) T[k] = 0;
    }
    return { size: [cv.width, cv.height], T: Object.fromEntries(Object.entries(T).map(([k, v]) => [k, +(v / N).toFixed(2)])) };
  });
  console.log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
