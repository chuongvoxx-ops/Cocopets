// All twelve Animas, three stages each, as they are painted now (the reference for the 3D remake).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const legacy = process.argv[2] !== 'new', only = process.argv[3] ? process.argv[3].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ legacy, only }) => {
    const P = window.__pp, ids = only || P.ANIMA_ORDER, cw = 200, ch = 200, cv = document.createElement('canvas'); cv.width = cw * 6 * 1.5; cv.height = ch * Math.ceil(ids.length / 2) * 1.5; const c = cv.getContext('2d'); c.scale(1.5, 1.5);
    c.fillStyle = '#211E44'; c.fillRect(0, 0, cv.width, cv.height);
    ids.forEach((id, n) => { for (let k = 1; k <= 3; k++) { const x = ((n % 2) * 3 + k - 1) * cw, y = Math.floor(n / 2) * ch; c.fillStyle = (n + k) % 2 ? '#2A2650' : '#25224A'; c.fillRect(x, y, cw, ch); P.AnimaArt.draw(c, id, k, x + cw / 2, y + ch * 0.84, 150, 1.3, { legacy, aura: false, fk: 1 }); c.fillStyle = '#FFF'; c.font = '11px sans-serif'; c.fillText(`${id} k${k}`, x + 5, y + 13); } });
    return cv.toDataURL('image/jpeg', 0.85);
  }, { legacy, only });
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/anima-ref-${legacy ? 'old' : 'new'}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
