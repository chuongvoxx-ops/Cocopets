// The end of the fight, drawn whole: the rings breaking, the wings shedding, the fish coming down to rest. usage: node tests/_inf-end.js [T]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const T = +(process.argv[2] || 22);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ T }) => {
    const P = window.__pp, D = P.FIEND_DEFS.bahamut, K = P.DunFiend.KIT, times = [0.6, 1.4, 2.4, 4.6];
    const pw = Math.round(T * 36), ph = Math.round(T * 18), cv = document.createElement('canvas'); cv.width = pw; cv.height = ph * times.length; const c = cv.getContext('2d'); const errs = [];
    times.forEach((et, i) => {
      const y = i * ph, X = pw / 2, Yg = y + ph * 0.6 + 2.5 * T;
      const g = c.createLinearGradient(0, y, 0, y + ph); g.addColorStop(0, '#141B2A'); g.addColorStop(1, '#070A12'); c.fillStyle = g; c.fillRect(0, y, pw, ph);
      const mem = { art: 1, lv: 4, bt: 3 }, m = { x: 0, y: 0, r: 2.4, face: 1, t: 1, dmg: 10, act: 'circle' };
      const FX = { K, mem, m, S: { lv: 4, fast: 1, m, tele: [], hz: [], objs: [], weak: {} }, H: { part() {}, W: () => pw, H: () => ph }, me: { x: 0, y: 6 }, C: { x: 0, y: 0, R: 14.5 }, sx: v => X + v * T, sy: v => Yg + v * T, Tz: () => T };
      c.save(); c.beginPath(); c.rect(0, y, pw, ph); c.clip();
      try { const sc = document.createElement('canvas'); sc.width = sc.height = 8; D.dbgDraw(sc.getContext('2d'), FX, m, X, Yg, T, 1); mem.art = 0; mem.end = { t: et }; mem.tents.forEach((T2, j) => { T2.gone = j ? 1 : 0; }); for (let k = 0; k < 5; k++) D.update(FX, 0.0001); mem.end.t = et; D.drawFx(c, FX, T, et); } catch (e) { errs.push(et + ': ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
      c.restore(); c.fillStyle = '#FFE37A'; c.font = '700 16px sans-serif'; c.fillText('the end, t = ' + et, 10, y + 22);
    });
    window.__errs = errs; return cv.toDataURL('image/jpeg', 0.9);
  }, { T });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/inf-end.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('draw errors', await page.evaluate(() => window.__errs), 'page errors', errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
