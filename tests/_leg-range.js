const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => { const P = window.__pp, out = {}; for (const w of ['angel', 'dragon']) { const L = { w, a: '#ffffff', b: '#888888', c: '#ff0000' }; out[w] = { r1: P.legRange(L, 1, 1).map(Math.round), r07: P.legRange(L, 0.7, 0.7).map(Math.round), r05: P.legRange(L, 0.7, 0.5).map(Math.round), lay: [2, 3, 4].map(n => JSON.stringify(P.legLayout(L, n))) }; } return out; });
  console.log(JSON.stringify(r, null, 1)); await browser.close();
})();
