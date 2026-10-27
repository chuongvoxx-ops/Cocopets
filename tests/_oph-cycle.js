// Ophiuchus's final form through one wing beat: the top row as the menus draw it, the bottom row as the Tower does
// (each summoned one on its own cached canvas, which must not clip the higher wings). usage: node tests/_oph-cycle.js [size=170]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const size = +(process.argv[2] || 170);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(size => {
    const P = window.__pp, N = 6, cw = size * 1.5, ch = size * 1.45, cv = document.createElement('canvas'); cv.width = cw * N; cv.height = ch * 2; const c = cv.getContext('2d');
    c.fillStyle = '#1B2033'; c.fillRect(0, 0, cv.width, cv.height);
    const inst = {};
    for (let i = 0; i < N; i++) {
      const t = 0.3 + i * (2.42 / N);
      c.strokeStyle = 'rgba(255,255,255,.15)'; c.strokeRect(i * cw + 0.5, 0.5, cw - 1, ch - 1); c.strokeRect(i * cw + 0.5, ch + 0.5, cw - 1, ch - 1);
      P.AnimaArt.draw(c, 'ophiuchus', 3, i * cw + cw / 2, ch * 0.85, size, t, {});
      // the Tower path: step its own state up to t, then draw from its cache
      for (let s = inst._t || 0; s < t; s += 1 / 30) P.AnimaArt.draw(document.createElement('canvas').getContext('2d'), 'ophiuchus', 3, 0, 0, size, s, { inst, aura: false });
      inst._t = t; P.AnimaArt.draw(c, 'ophiuchus', 3, i * cw + cw / 2, ch + ch * 0.85, size, t, { inst });
    }
    return cv.toDataURL();
  }, size);
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/oph-cycle.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
