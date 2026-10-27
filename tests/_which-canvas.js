const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { window.__pp.quickStart('Bot'); });
  await page.waitForTimeout(500);
  console.log(await page.evaluate(() => { const c = document.querySelector('canvas'); const chain = []; let e = c; while (e && chain.length < 6) { chain.push(e.tagName + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').join('.') : '')); e = e.parentElement; } return JSON.stringify({ chain, w: c.width, h: c.height, style: c.getAttribute('style') }); }));
  await browser.close();
})();
