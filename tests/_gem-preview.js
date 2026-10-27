// Big preview of the Gemini twins: final form large, plus all three forms. usage: node tests/_gem-preview.js [t] [out]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const T = +(process.argv[2] || 0.8), out = process.argv[3] || 'gd-preview';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(T => {
    const P = window.__pp, W = 1100, H = 560, cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1A2250'); g.addColorStop(1, '#0B0E22'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    P.AnimaArt.draw(c, 'gemini', 3, 260, 520, 440, T);
    [1, 2, 3].forEach((k, i) => P.AnimaArt.draw(c, 'gemini', k, 600 + i * 170, 500, 90 + k * 30, T));
    P.AnimaArt.draw(c, 'gemini', 3, 1020, 300, 110, T, { flip: true, fk: -1 });
    return cv.toDataURL();
  }, T);
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/${out}.png`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
