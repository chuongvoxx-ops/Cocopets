// Anima Bahamut's three forms side by side, then its final form turning, drawn the way the Tower draws it (through its
// cached picture, so anything the cache would clip shows clipped). usage: node tests/_oph-wings.js [out] [size]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'oph-wings', size = +(process.argv[3] || 150);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  if (process.env.NOCACHE) await page.evaluate(() => { window.__nocache = true; });
  if (process.env.TUNE) await page.evaluate(js => { const PA = window.__pp.FIEND_DEFS.bahamut.mini.PAIRS; (new Function('PA', js))(PA); }, process.env.TUNE);
  const url = await page.evaluate((size) => {
    const P = window.__pp, cw = 620, ch = 460, cells = [[1, 0], [2, 0], [3, 0], [3, 1], [3, 0.5], [3, -1]];
    const cv = document.createElement('canvas'); cv.width = cw * 3; cv.height = ch * 2; const c = cv.getContext('2d');
    c.fillStyle = '#141A22'; c.fillRect(0, 0, cv.width, cv.height);
    cells.forEach(([k, fk], i) => {
      const cx = (i % 3) * cw, cy = Math.floor(i / 3) * ch, X0 = cx + cw / 2, fy = cy + ch * 0.82, inst = window.__nocache ? null : {};
      c.save(); c.beginPath(); c.rect(cx, cy, cw, ch); c.clip();
      // a grid of tiles to judge size by: the Tower's tile here is size / 2.2
      const tile = size / (k === 3 ? 2.2 : k === 2 ? 1.9 : 1.6); c.strokeStyle = 'rgba(255,255,255,.07)'; for (let gx = X0 % tile; gx < cx + cw; gx += tile) { c.beginPath(); c.moveTo(gx, cy); c.lineTo(gx, cy + ch); c.stroke(); }
      for (let t = 0; t < 2; t++) P.AnimaArt.draw(c, 'ophiuchus', k, X0, fy, size, 2.0 + t * 0.04, { inst, fk, flip: fk < 0, aura: false, q: 1 });
      c.restore();
      c.fillStyle = '#FFE37A'; c.font = '700 15px sans-serif'; c.fillText(`form ${k} · fk ${fk}`, cx + 10, cy + 20);
    });
    return cv.toDataURL('image/jpeg', 0.9);
  }, size);
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/${out}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
