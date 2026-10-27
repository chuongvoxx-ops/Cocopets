const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(() => {
    const P = window.__pp, D = P.FIEND_DEFS.aion, K = P.DunFiend.KIT, T = 34, cw = T * 13, ch = T * 12, styles = [['real', 'REALISTIC'], ['toon', 'CEL-SHADED'], ['hybrid', 'HYBRID (chosen)']], rows = [{}, { demo: 'lance' }];
    const cv = document.createElement('canvas'); cv.width = cw * 3; cv.height = ch * 2; const c = cv.getContext('2d');
    rows.forEach((extra, r) => styles.forEach(([st, label], i) => { const x = i * cw, y = r * ch; const g = c.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, '#20262A'); g.addColorStop(1, '#0A0C0E'); c.fillStyle = g; c.fillRect(x, y, cw, ch);
      const mem = Object.assign({ style: st }, extra), m = { x: 0, y: 0, r: 2.6, face: 1, phase: 1, t: 1, dmg: 10, act: 'float' };
      const FX = { K, mem, m, S: { lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {} }, me: { x: 0, y: 5 }, C: { x: 0, y: 0, R: 15 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
      c.save(); D.draw(c, FX, m, x + cw / 2, y + ch * 0.86, T, 1.3); c.restore(); c.fillStyle = '#FFE37A'; c.font = '800 17px sans-serif'; c.fillText(label + (r ? ' · knot' : ''), x + 10, y + 24); }));
    return cv.toDataURL('image/jpeg', 0.9);
  });
  fs.writeFileSync(path.resolve(__dirname, '../shots/aion-style-test.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
})();
