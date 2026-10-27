// The ram at forms 2 and 3, standing and running, from a few angles: only the forelegs should burn. usage: node tests/_aries-legs.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(() => {
    const A = window.__pp.AnimaArt, px = 200, poses = [[2, 0, {}], [3, 0, {}], [3, 0.4, { mv: 1, ph: 0.3 }], [3, 0.9, { mv: 1, ph: 2.0, flip: true }], [3, 1.4, { yaw: 1.6 }], [3, 2, { yaw: 0.2 }]];
    const cv = document.createElement('canvas'); cv.width = px * 1.4 * 3; cv.height = px * 1.4 * 2; const c = cv.getContext('2d'); c.fillStyle = '#20263A'; c.fillRect(0, 0, cv.width, cv.height);
    poses.forEach(([k, t, o], i) => { const x = (i % 3 + 0.5) * px * 1.4, y = (Math.floor(i / 3) + 0.85) * px * 1.4; A.draw(c, 'aries', k, x, y, px, 3 + t, o); });
    return cv.toDataURL('image/png');
  });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/aries-legs.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
