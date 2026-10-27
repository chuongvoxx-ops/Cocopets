const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => { const P = window.__pp, out = []; for (const sd of [11, 47]) { let f = P.summonGenome(6, P.mulberry32(sd)).form; const R = P.mulberry32(sd * 3); for (let s = 2; s <= 7; s++) { const e = P.__extra; const res = window.__pp.evolveForm ? window.__pp.evolveForm(f, R, s) : null; if (!res) return 'no evolveForm'; out.push(sd + ' ' + s + ': ' + res.changes.join(' / ')); f = res.form; } } return out; });
  console.log(Array.isArray(r) ? r.join('\n') : r); await browser.close();
})();
