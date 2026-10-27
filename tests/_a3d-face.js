// Close-ups of an Anima's face at a few turns.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2], K = +(process.argv[3] || 3), size = +(process.argv[4] || 520), fy = +(process.argv[5] || 0.95);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ id, K, size, fy }) => {
    const P = window.__pp, yaws = [0, 0.45, 0.85, 1.25], cw = 330, ch = 300, cv = document.createElement('canvas'); cv.width = cw * yaws.length; cv.height = ch; const c = cv.getContext('2d');
    yaws.forEach((y, i) => { c.save(); c.beginPath(); c.rect(i * cw, 0, cw, ch); c.clip(); c.fillStyle = i % 2 ? '#2A2650' : '#25224A'; c.fillRect(i * cw, 0, cw, ch); P.AnimaArt.draw(c, id, K, i * cw + cw / 2, ch * fy + size * 0.55, size, 1.3, { aura: false, yaw: y }); c.restore(); c.fillStyle = '#FFF'; c.font = '13px sans-serif'; c.fillText('yaw ' + y, i * cw + 6, 16); });
    return cv.toDataURL('image/jpeg', 0.9);
  }, { id, K, size, fy });
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/face-${id}-${K}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
