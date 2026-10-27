// Renders every Anima at all three Ascension stages. usage: node tests/anima-sheet.js [ids] [px]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : null, px = +(process.argv[3] || 150);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ only, px }) => {
    const P = window.__pp, ids = only || P.ANIMA_ORDER, cw = px * 1.35, ch = px * 1.35;
    const cv = document.createElement('canvas'); cv.width = cw * 3 * 2; cv.height = ch * ids.length * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    ids.forEach((id, row) => { for (let k = 1; k <= 3; k++) { const x = (k - 1) * cw, y = row * ch, A = P.ANIMAS[id]; const g = c.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, A.realm === 'heaven' ? '#3A3A78' : '#2A1530'); g.addColorStop(1, '#151528'); c.fillStyle = g; c.fillRect(x, y, cw, ch); try { P.AnimaArt.draw(c, id, k, x + cw / 2, y + ch * 0.82, px * (0.62 + k * 0.12), 0.8); } catch (e) { c.fillStyle = '#F00'; c.fillText('ERR ' + e.message, x + 4, y + 20); } c.fillStyle = '#FFF'; c.font = '700 11px sans-serif'; c.fillText(A.forms[k - 1], x + 6, y + ch - 6); P.AnimaArt.sigil(c, id, x + cw - 16, y + 16, 18, A.color, 0.9); } });
    return cv.toDataURL();
  }, { only, px });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/anima-sheet.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
