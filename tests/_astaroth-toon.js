const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const P = window.__pp, D = P.FIEND_DEFS.astaroth, K = P.DunFiend.KIT, T = 21, cw = T * 19, ch = T * 14, poses = D.artPoses, errs = [];
    const cv = document.createElement('canvas'); cv.width = cw * 3; cv.height = ch * 4; const c = cv.getContext('2d');
    poses.forEach((ps, i) => [null, 'toon'].forEach((st, s) => { const x = (i % 3) * cw, y = (Math.floor(i / 3) * 2 + s) * ch;
      const g = c.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, s ? '#262A3A' : '#20262A'); g.addColorStop(1, '#0A0C10'); c.fillStyle = g; c.fillRect(x, y, cw, ch);
      const mem = Object.assign({ style: st }, JSON.parse(JSON.stringify(ps.mem || {}))), m = { x: 0, y: 0, r: 2.1, face: 1, phase: 1, t: 1, dmg: 10, act: 'circle' };
      const FX = { K, mem, m, S: { lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {} }, me: { x: 0, y: 5 }, C: { x: 0, y: 0, R: 15 }, g: { t: 1 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
      c.save(); try { c.beginPath(); c.rect(x, y, cw, ch); c.clip(); D.draw(c, FX, m, x + cw / 2 + (ps.mem && ps.mem.demoA != null ? Math.cos(ps.mem.demoA) * T * 3 : 0), y + ch * 0.6 + (ps.mem && ps.mem.demoA != null ? Math.sin(ps.mem.demoA) * T * 2.5 : 0), T, 1.3); } catch (e) { errs.push(ps.name + '/' + st + ': ' + e.message); } c.restore();
      c.fillStyle = s ? '#9FE8FF' : '#FFE37A'; c.font = '800 15px sans-serif'; c.fillText((s ? 'TOON TEST · ' : 'CURRENT · ') + ps.name, x + 10, y + 22); }));
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(0, ch * 2 - 1, cw * 3, 2);
    return { url: cv.toDataURL('image/jpeg', 0.9), errs };
  });
  fs.writeFileSync(path.resolve(__dirname, '../shots/astaroth-toon-test.jpg'), Buffer.from(r.url.split(',')[1], 'base64'));
  console.log('errs', r.errs, 'page', errors.slice(0, 3));
  await browser.close();
})();
