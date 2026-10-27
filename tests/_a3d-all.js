// All twelve remade Animas: first and final forms side by side.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(() => {
    const P = window.__pp, ids = P.ANIMA_ORDER, cw = 250, ch = 300, cols = 6, cv = document.createElement('canvas'); cv.width = cw * cols * 1.4; cv.height = (ch * 4 + 40) * 1.4; const c = cv.getContext('2d'); c.scale(1.4, 1.4);
    const g = c.createLinearGradient(0, 0, 0, ch * 4); g.addColorStop(0, '#2E2A5C'); g.addColorStop(1, '#16142E'); c.fillStyle = g; c.fillRect(0, 0, cw * cols, ch * 4 + 40);
    c.fillStyle = '#FFE37A'; c.font = '700 20px sans-serif'; c.textAlign = 'center'; c.fillText('The twelve Animas, cel-shaded 3D · first form and final form', cw * cols / 2, 28);
    ids.forEach((id, n) => { const col = n % cols, row = Math.floor(n / cols) * 2; [1, 3].forEach((k, j) => { const x = col * cw + cw / 2, y = 40 + (row + j) * ch + ch * 0.8; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y, 60, 12, 0, 0, Math.PI * 2); c.fill(); P.AnimaArt.draw(c, id, k, x, y, k === 3 ? 190 : 165, 1.3 + n * 0.3, { fk: 1 }); c.fillStyle = '#E8E0FF'; c.font = '600 13px sans-serif'; c.fillText(P.ANIMAS[id].forms[k - 1], x, y + 30); }); });
    return cv.toDataURL('image/jpeg', 0.88);
  });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/a3d-all.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
