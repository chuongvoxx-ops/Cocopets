const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => { const P = window.__pp, out = { h: Array(12).fill(0), w: {}, uniq: new Set() }; for (let i = 0; i < 400; i++) { const g = P.summonGenome(6, P.mulberry32(1000 + i)), f = g.form; out.h[Math.floor((f.pal.h || 0) / 30) % 12]++; out.w[f.x.leg.w] = (out.w[f.x.leg.w] || 0) + 1; out.uniq.add(f.pal.base + f.x.leg.a + f.x.leg.b + f.x.leg.c); } out.uniq = out.uniq.size; return out; });
  console.log(JSON.stringify(r)); await browser.close();
})();
