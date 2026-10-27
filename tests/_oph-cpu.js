// Where the small drawing's time goes, without rasterising (script cost only). usage: node tests/_oph-cpu.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const D = window.__pp.FIEND_DEFS.bahamut.mini, M = D.make({ lv: 1 }), cv = document.createElement('canvas'); cv.width = 300; cv.height = 300; const c = cv.getContext('2d');
    const out = {};
    for (const q of [0, 1]) { for (let i = 0; i < 5; i++) D.draw(c, M, 150, 150, 7, { q }); M.prof = {}; const t0 = performance.now(); for (let i = 0; i < 30; i++) { D.step(M, 1 / 60); D.draw(c, M, 150, 150, 7, { q }); } const all = (performance.now() - t0) / 30; const o = { all: +all.toFixed(2) }; Object.keys(M.prof).filter(k => k[0] !== '_').forEach(k => { o[k] = +(M.prof[k] / 30).toFixed(2); }); out['q' + q] = o; M.prof = null; }
    c.getImageData(0, 0, 1, 1); return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
