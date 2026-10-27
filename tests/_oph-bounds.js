// how far Anima Bahamut's picture reaches from its centre, in model units, per form (over a beat and a turn)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const D = window.__pp.FIEND_DEFS.bahamut.mini, T = 12, W = 900, H = 700, X = W / 2, Y = H * 0.6, out = {};
    for (const k of [1, 2, 3]) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const yaw of [-0.42, 0, 0.42]) for (const t of [0, 0.4, 0.8, 1.2, 1.6, 2.0]) for (const charge of [0, 1]) {
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
        const M = D.make({ k }); D.pose(M, 2 + t, { charge }); M.yaw = yaw; D.draw(c, M, X, Y, T, { q: 1 });
        const d = c.getImageData(0, 0, W, H).data;
        for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      }
      out[k] = { left: +((X - x0) / T).toFixed(2), right: +((x1 - X) / T).toFixed(2), up: +((Y - y0) / T).toFixed(2), down: +((y1 - Y) / T).toFixed(2) };
    }
    return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
