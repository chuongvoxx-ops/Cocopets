// What a screen-filling pattern costs: the pattern enlarged by the screen's scale (as the backdrops are now), and one made
// at the screen's own resolution laid down pixel for pixel, at whole and at fractional offsets.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id=c width=780 height=1688 style="width:390px;height:844px"></canvas>');
  const r = await page.evaluate(() => {
    const c = document.getElementById('c').getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
    const mkTile = k => { const cv = document.createElement('canvas'); cv.width = cv.height = 128 * k; const x = cv.getContext('2d'); x.scale(k, k); x.fillStyle = '#1E4A47'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 26; i++) { x.strokeStyle = 'rgba(150,230,210,.2)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(i * 5, i * 4); x.quadraticCurveTo(i * 5 + 9, i * 4 - 4, i * 5 + 18, i * 4); x.stroke(); } return cv; };
    const p1 = c.createPattern(mkTile(1), 'repeat'), p2 = c.createPattern(mkTile(2), 'repeat');
    const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 10;
    const time = (k, f) => { fl(); const t0 = performance.now(); f(); fl(); T[k] = (T[k] || 0) + performance.now() - t0; };
    for (let n = 0; n < N; n++) {
      const e = 123.37 + n * 1.1, f = 77.61 + n * 0.7;
      time('1x tile, scaled', () => { p1.setTransform(new DOMMatrix([1, 0, 0, 1, e, f])); c.fillStyle = p1; c.fillRect(0, 0, 390, 844); });
      time('2x tile, 1:1 whole px', () => { p2.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, Math.round(e * 2) / 2, Math.round(f * 2) / 2])); c.fillStyle = p2; c.fillRect(0, 0, 390, 844); });
      time('2x tile, 1:1 frac', () => { p2.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, e, f])); c.fillStyle = p2; c.fillRect(0, 0, 390, 844); });
      time('plain fill', () => { c.fillStyle = '#1E4A47'; c.fillRect(0, 0, 390, 844); });
    }
    return Object.fromEntries(Object.entries(T).map(([k, v]) => [k, +(v / N).toFixed(2)]));
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
