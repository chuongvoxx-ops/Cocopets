// One Anima at several turns, big, for checking its 3D build.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'cancer', K = +(process.argv[3] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ id, K }) => {
    const P = window.__pp, yaws = [0, 0.4, 0.8, 1.2, 1.57, 2.4], cw = 330, ch = 330, cv = document.createElement('canvas'); cv.width = cw * yaws.length; cv.height = ch; const c = cv.getContext('2d');
    yaws.forEach((y, i) => { c.fillStyle = i % 2 ? '#2A2650' : '#25224A'; c.fillRect(i * cw, 0, cw, ch); P.AnimaArt.draw(c, id, K, i * cw + cw / 2, ch * 0.82, 230, 1.3, { aura: false, yaw: y }); c.fillStyle = '#FFF'; c.font = '13px sans-serif'; c.fillText('yaw ' + y, i * cw + 6, 16); });
    return cv.toDataURL('image/jpeg', 0.88);
  }, { id, K });
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/a3d-yaw-${id}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
