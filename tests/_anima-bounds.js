// How far each Anima's painted body reaches, in model units, against the offscreen box (-98..98, -116..54).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const P = window.__pp, out = {};
    P.ANIMA_ORDER.forEach(id => { for (let k = 1; k <= 3; k++) {
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const c = cv.getContext('2d');
      let mx = [1e9, -1e9, 1e9, -1e9];
      for (const t of [0.3, 1.7, 3.1]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 600, 600); c.setTransform(1, 0, 0, 1, 300, 400); const L = { b: [], f: [], back(fn) { this.b.push(fn); }, fx(fn) { this.f.push(fn); } }; P.AnimaArt.P[id](c, k, t, L);
        const d = c.getImageData(0, 0, 600, 600).data; for (let y = 0; y < 600; y += 2) for (let x = 0; x < 600; x += 2) if (d[(y * 600 + x) * 4 + 3] > 20) { mx[0] = Math.min(mx[0], x - 300); mx[1] = Math.max(mx[1], x - 300); mx[2] = Math.min(mx[2], y - 400); mx[3] = Math.max(mx[3], y - 400); } }
      out[id + k] = mx; } });
    return out;
  });
  const BOX = [-98, 98, -116, 54];
  for (const [k, v] of Object.entries(r)) { const over = v[0] < BOX[0] || v[1] > BOX[1] || v[2] < BOX[2] || v[3] > BOX[3]; console.log(k.padEnd(13), JSON.stringify(v), over ? 'OVER' : ''); }
  console.log('errors', errors);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
