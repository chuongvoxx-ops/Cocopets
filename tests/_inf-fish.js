// A close look at Bahamut's fish alone, in its poses. usage: node tests/_inf-serp.js [T]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const T = +(process.argv[2] || 100);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ T }) => {
    const P = window.__pp, D = P.FIEND_DEFS.bahamut, K = P.DunFiend.KIT;
    const poses = [
      { name: 'idle', mem: {} }, { name: 'idle, watching left', mem: { look: [-1, 0.2] } }, { name: 'idle, watching right', mem: { look: [1, 0.3] } },
      { name: 'casting', mem: { castK: 1 } }, { name: 'curled round its jewel', mem: { curl: 1 } }, { name: 'at rest', mem: { rest: 1 }, hc: 0.75 },
      { name: 'the end: looks at you', mem: { end: { t: 6 } }, hc: 0.75 }, { name: 'watching north', mem: { look: [0, -1] } }, { name: 'eyes closed (intro)', mem: { eyes: 0.0001 } },
    ];
    const pw = Math.round(T * 5.6), ph = Math.round(T * 6.6), cols = 3, rows = 3;
    const cv = document.createElement('canvas'); cv.width = pw * cols; cv.height = ph * rows; const c = cv.getContext('2d'); const errs = [];
    poses.forEach((ps, i) => {
      const x = (i % cols) * pw, y = Math.floor(i / cols) * ph;
      const g = c.createLinearGradient(0, y, 0, y + ph); g.addColorStop(0, '#1C2740'); g.addColorStop(1, '#0B1020'); c.fillStyle = g; c.fillRect(x, y, pw, ph);
      const mem = Object.assign({ art: 1, lv: 1, dbgOnly: 'fish' }, ps.mem), m = { x: 0, y: 0, r: 2.4, face: 1, t: 1, dmg: 10, act: 'circle' };
      const FX = { K, mem, m, S: { lv: 1, fast: 1, m, tele: [], hz: [], objs: [], weak: {} }, H: { part() {}, W: () => 400, H: () => 800 }, me: { x: 0, y: 5 }, C: { x: 0, y: 0, R: 14.5 }, sx: v => v * T, sy: v => v * T, Tz: () => T };
      c.save(); c.beginPath(); c.rect(x, y, pw, ph); c.clip();
      try { D.dbgDraw(c, FX, m, x + pw / 2, y + ph * 0.6 + (ps.hc || 3.8) * T, T, 1.3); } catch (e) { errs.push(ps.name + ': ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
      c.restore(); c.fillStyle = '#FFE37A'; c.font = '700 18px sans-serif'; c.fillText(ps.name, x + 10, y + 24);
    });
    window.__errs = errs; return cv.toDataURL('image/jpeg', 0.9);
  }, { T });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/inf-fish.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('draw errors', await page.evaluate(() => window.__errs), 'page errors', errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
