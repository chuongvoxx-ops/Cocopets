// Pinned pattern fills on an ordinary canvas with tiles of various sizes: powers of two against others.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id=c width=780 height=1572 style="width:390px;height:786px"></canvas>');
  const r = await page.evaluate(() => {
    const cv = document.getElementById('c'), c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
    const W = 390, H = 786;
    const tile = (w, h) => { const t = document.createElement('canvas'); t.width = w; t.height = h; const x = t.getContext('2d'), g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#79C3EE'); g.addColorStop(1, '#DF44FF'); x.fillStyle = g; x.fillRect(0, 0, w, h); return c.createPattern(t, 'repeat'); };
    const sizes = [[256, 256], [384, 384], [192, 192], [512, 512], [1, 2048], [16, 2048], [1, 1572], [256, 1572], [780, 1572]];
    const pats = sizes.map(([w, h]) => tile(w, h));
    const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 10;
    const time = (key, f) => { fl(); const t0 = performance.now(); f(); fl(); T[key] = (T[key] || 0) + performance.now() - t0; };
    for (let n = -2; n < N; n++) {
      sizes.forEach(([w, h], i) => time(w + 'x' + h, () => { pats[i].setTransform(new DOMMatrix([0.5, 0, 0, 0.5, n, 0])); c.fillStyle = pats[i]; c.fillRect(0, 0, W, H); }));
      if (n === -1) for (const key in T) T[key] = 0;
    }
    return Object.fromEntries(Object.entries(T).map(([key, v]) => [key, +(v / N).toFixed(2)]));
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
