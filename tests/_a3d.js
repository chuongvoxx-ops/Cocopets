// Review sheet for the cel-shaded 3D Animas: each stage at rest, turning, walking and striking.
// usage: node tests/_a3d.js [id] [px] [bg]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'aries', px = +(process.argv[3] || 150), legacy = process.argv[4] === 'legacy';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ id, px, legacy }) => {
    const P = window.__pp, cw = px * 1.3, ch = px * 1.35;
    const cols = [['rest →', { fk: 1 }], ['rest ←', { fk: -1, flip: true }], ['turning', { fk: 0.35 }], ['front', { fk: 0 }], ['walk 0', { fk: 1, mv: 1, ph: 0 }], ['walk 1', { fk: 1, mv: 1, ph: 1.05 }], ['walk 2', { fk: 1, mv: 1, ph: 2.1 }], ['walk 3', { fk: 1, mv: 1, ph: 3.14 }], ['wind up', { fk: 1, atk: 0.25 }], ['strike', { fk: 1, atk: 0.46 }], ['blink', { fk: 1, blink: 0.5 }]];
    const cv = document.createElement('canvas'); cv.width = cw * cols.length * 2; cv.height = ch * 3 * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    for (let k = 1; k <= 3; k++) cols.forEach(([lab, o], i) => {
      const x = i * cw, y = (k - 1) * ch; c.fillStyle = (i + k) % 2 ? '#2A2650' : '#25224A'; c.fillRect(x, y, cw, ch);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + cw / 2, y + ch * 0.86, px * 0.34, px * 0.07, 0, 0, Math.PI * 2); c.fill();
      P.AnimaArt.draw(c, id, k, x + cw / 2, y + ch * 0.86, px * 0.78, 1.3, Object.assign({ aura: false, legacy }, o));
      c.fillStyle = '#FFF'; c.font = '11px sans-serif'; c.fillText(`${lab} · k${k}`, x + 5, y + 14);
    });
    return cv.toDataURL('image/jpeg', 0.88);
  }, { id, px, legacy });
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/a3d-${id}${legacy ? '-old' : ''}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
