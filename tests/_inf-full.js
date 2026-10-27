// A close look at Bahamut's gyroscope: the four rings and the serpent, no tentacles. usage: node tests/_inf-gyro.js [T]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const T = +(process.argv[2] || 70);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ T }) => {
    const P = window.__pp, D = P.FIEND_DEFS.bahamut, K = P.DunFiend.KIT;
    const poses = [{ name: 'stage I', mem: { lv: 1 }, bt: 1.3 }, { name: 'stage IV', mem: { lv: 4 }, bt: 7.7 }];
    const pw = Math.round(T * 40), ph = Math.round(T * 22), cols = 1;
    const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph * poses.length; const c = cv.getContext('2d'); const errs = [];
    poses.forEach((ps, i) => {
      const x = 0, y = i * ph;
      const g = c.createLinearGradient(0, y, 0, y + ph); g.addColorStop(0, '#141B2A'); g.addColorStop(1, '#070A12'); c.fillStyle = g; c.fillRect(x, y, pw, ph);
      const mem = Object.assign({ art: 1, bt: ps.bt }, ps.mem), m = { x: 0, y: 0, r: 2.4, face: 1, t: 1, dmg: 10, act: 'circle' };
      const FX = { K, mem, m, S: { lv: ps.mem.lv, fast: 1, m, tele: [], hz: [], objs: [], weak: {} }, H: { part() {}, W: () => 400, H: () => 800 }, me: { x: 0, y: 5 }, C: { x: 0, y: 0, R: 14.5 }, sx: v => v * T, sy: v => v * T, Tz: () => T };
      c.save(); c.beginPath(); c.rect(x, y, pw, ph); c.clip();
      try { D.dbgDraw(c, FX, m, x + pw / 2, y + ph * 0.62 + 3.8 * T, T, 1.3); } catch (e) { errs.push(ps.name + ': ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
      c.restore(); c.fillStyle = '#FFE37A'; c.font = '700 18px sans-serif'; c.fillText(ps.name, x + 10, y + 24);
    });
    window.__errs = errs; return cv.toDataURL('image/jpeg', 0.9);
  }, { T });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/inf-full.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('draw errors', await page.evaluate(() => window.__errs), 'page errors', errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
