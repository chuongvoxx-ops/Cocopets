// Ophiuchus's Ascension ceremony, frame by frame. usage: node tests/_oph-asc.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Taro'); P.st.dun.best = 120; P.anima.animaRecognise(); P.st.animas.have.ophiuchus = 3; P.ascendCinematic('ophiuchus', 3, () => {}); });
  const t0 = Date.now(), files = [];
  for (const ms of [800, 1800, 2400, 2900, 4300]) { const w = ms - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); const f = path.resolve(__dirname, `../shots/oph-asc-${ms}.png`); await page.screenshot({ path: f }); files.push(f); }
  console.log(files.join(' ')); console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
