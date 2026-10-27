// Walk-cycle and strike frames for every Anima. usage: node tests/anima-pose.js [ids] [k] [px]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : null, K = +(process.argv[3] || 2), px = +(process.argv[4] || 110);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ only, K, px }) => {
    const P = window.__pp, ids = only || P.ANIMA_ORDER, cw = px * 1.25, ch = px * 1.3, cols = 10;
    const cv = document.createElement('canvas'); cv.width = cw * cols * 2; cv.height = ch * ids.length * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    c.fillStyle = '#1A1838'; c.fillRect(0, 0, cw * cols, ch * ids.length);
    ids.forEach((id, row) => {
      for (let i = 0; i < cols; i++) {
        const x = i * cw, y = row * ch, walk = i < 6, ph = i / 6 * Math.PI * 2, atk = walk ? -1 : [0.2, 0.32, 0.45, 0.7][i - 6];
        c.fillStyle = (i + row) % 2 ? '#22204A' : '#1E1C42'; c.fillRect(x, y, cw, ch);
        c.strokeStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(x + 4, y + ch * 0.86); c.lineTo(x + cw - 4, y + ch * 0.86); c.stroke();
        P.AnimaArt.draw(c, id, K, x + cw / 2, y + ch * 0.86, px * 0.62, 1 + ph * 0.2, { mv: walk ? 1 : 0, ph, atk: atk >= 0 ? atk : null, aura: false });
        c.fillStyle = '#FFF'; c.font = '700 9px sans-serif'; c.fillText(walk ? `walk ${i}` : `strike ${atk}`, x + 4, y + 11);
      }
      c.fillStyle = '#FFE37A'; c.font = '800 10px sans-serif'; c.fillText(id + ' · ' + P.AnimaArt.LOCO[id], 4, row * ch + ch - 4);
    });
    return cv.toDataURL();
  }, { only, K, px });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/anima-pose.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
