// Bahamut as an Anima turning round: frames from facing right to facing left (as the Tower draws it, squash included).
// usage: node tests/_oph-turn.js [out]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'oph-turn';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(() => {
    const P = window.__pp, fks = [1, 0.6, 0.25, 0, -0.25, -0.6, -1], cw = 300, ch = 330, cv = document.createElement('canvas'); cv.width = cw * fks.length; cv.height = ch; const c = cv.getContext('2d');
    c.fillStyle = '#141A22'; c.fillRect(0, 0, cv.width, ch);
    fks.forEach((fk, i) => {
      const X0 = i * cw + cw / 2, fy = ch * 0.85, size = 230, inst = {};
      // the Tower squashes a flat Anima by |fk| as it turns; a true model is drawn whole
      const is3d = (P.typeof3d = true), tk = 1; c.save();
      P.AnimaArt.draw(c, 'ophiuchus', 3, X0, fy, size, 2.0, { inst, fk, flip: fk < 0, aura: false, q: 1 });
      // second call on the same instance after a short step, so its picture is fresh
      c.restore(); c.fillStyle = 'rgba(20,26,34,1)'; c.fillRect(i * cw, 0, cw, ch); c.save();
      P.AnimaArt.draw(c, 'ophiuchus', 3, X0, fy, size, 2.04, { inst, fk, flip: fk < 0, aura: false, q: 1 });
      c.restore();
      c.fillStyle = '#FFE37A'; c.font = '700 14px sans-serif'; c.fillText('fk ' + fk, i * cw + 10, 20);
    });
    return cv.toDataURL('image/jpeg', 0.88);
  });
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/${out}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
