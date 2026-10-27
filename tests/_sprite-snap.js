// Many small pictures drawn pixel for pixel: at fractions of a pixel against at whole pixels.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id=c width=780 height=1572 style="width:390px;height:786px"></canvas>');
  const r = await page.evaluate(() => {
    const cv = document.getElementById('c'), c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
    const sprites = [80, 120, 160].map(n => { const s = document.createElement('canvas'); s.width = s.height = n; const x = s.getContext('2d'); x.fillStyle = '#7A63B8'; x.beginPath(); x.arc(n / 2, n / 2, n * 0.4, 0, 6.283); x.fill(); x.lineWidth = 4; x.strokeStyle = '#222'; x.stroke(); return s; });
    const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 12;
    const time = (key, f) => { fl(); const t0 = performance.now(); f(); fl(); T[key] = (T[key] || 0) + performance.now() - t0; };
    for (let n = -2; n < N; n++) {
      time('60 sprites fractional', () => { for (let i = 0; i < 60; i++) { const s = sprites[i % 3], x = (i * 37.37 + n * 0.31) % 360, y = (i * 53.71) % 760; c.drawImage(s, x, y, s.width / 2, s.height / 2); } });
      time('60 sprites whole px', () => { for (let i = 0; i < 60; i++) { const s = sprites[i % 3], x = Math.round(((i * 37.37 + n * 0.31) % 360) * 2) / 2, y = Math.round(((i * 53.71) % 760) * 2) / 2; c.drawImage(s, x, y, s.width / 2, s.height / 2); } });
      if (n === -1) for (const key in T) T[key] = 0;
    }
    return Object.fromEntries(Object.entries(T).map(([key, v]) => [key, +(v / N).toFixed(2)]));
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
