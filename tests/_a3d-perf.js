// Draw cost of an Anima at battle size: the 3D model against the old painter.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'aries';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(id => {
    const P = window.__pp, cv = document.createElement('canvas'); cv.width = 400; cv.height = 400; const c = cv.getContext('2d'), out = {};
    for (const legacy of [false, true]) for (let k = 1; k <= 3; k++) { const N = 60; for (let i = 0; i < 5; i++) P.AnimaArt.draw(c, id, k, 200, 300, 80, i, { legacy, mv: 1, ph: i }); const t0 = performance.now(); for (let i = 0; i < N; i++) P.AnimaArt.draw(c, id, k, 200, 300, 80, i * 0.1, { legacy, mv: 1, ph: i * 0.3 }); out[(legacy ? 'old' : '3d') + k] = +((performance.now() - t0) / N).toFixed(2); }
    return out;
  }, id);
  console.log(id, JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
