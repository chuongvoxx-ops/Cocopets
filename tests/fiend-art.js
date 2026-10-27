// Paints a Super Fiend big, in several poses, plus its arena. usage: node tests/fiend-art.js [id] [T]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'nuckelavee', T = +(process.argv[3] || 34);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ id, T }) => {
    const P = window.__pp, D = P.FIEND_DEFS[id], FDn = P.FIENDS.find(f => f.id === id), K = P.DunFiend.KIT;
    const poses = D.artPoses || [{ name: 'idle' }];
    const cw = T * 17, ch = T * 13.5, cols = 3, rows = Math.ceil(poses.length / cols) + 1;
    const cv = document.createElement('canvas'); cv.width = cw * cols; cv.height = ch * rows; const c = cv.getContext('2d');
    const errs = [];
    poses.forEach((ps, i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      const g = c.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, '#20262A'); g.addColorStop(1, '#0A0C0E'); c.fillStyle = g; c.fillRect(x, y, cw, ch);
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(x, y + ch * (D.artY || 0.8)); c.lineTo(x + cw, y + ch * (D.artY || 0.8)); c.stroke();
      const mem = Object.assign({ gait: 0, spdK: 0 }, ps.mem || {}), m = Object.assign({ x: 0, y: 0, r: FDn.r, face: 1, phase: 1, t: 1, dmg: 10, act: 'circle' }, ps.m || {});
      const FX = { K, mem, m, S: { phase: ps.phase || 1, lv: ps.lv || ps.phase || 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {}, W: () => 400, H: () => 800 }, me: { x: 0, y: 5 }, C: { x: 0, y: 0, R: 15 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
      c.save(); try { D.draw(c, FX, m, x + cw / 2, y + ch * (D.artY || 0.8), T, ps.t || 1.3); } catch (e) { errs.push(ps.name + ': ' + e.message); } c.restore();
      c.fillStyle = '#FFE37A'; c.font = '700 13px sans-serif'; c.fillText(ps.name, x + 8, y + 18);
    });
    // the arena, painted small
    const ay = Math.floor(poses.length / cols + (poses.length % cols ? 1 : 0)) * ch, A = document.createElement('canvas'), AS = Math.min(ch, cw * 1.2), P2 = AS / 33; A.width = A.height = AS; const ac = A.getContext('2d'); ac.translate(AS / 2, AS / 2); ac.scale(P2, P2);
    try { D.paintGround(ac, { R: 15, rnd: P.mulberry32(5), K, FX: {} }); } catch (e) { errs.push('ground: ' + e.message); }
    try { if (D.sky) { c.save(); c.beginPath(); c.rect(cw, ay, cw * 2, ch); c.clip(); c.translate(cw, ay); D.sky(c, cw * 2, ch, 2, { x: 28, y: 28 }, T * 0.6, {}); c.restore(); } } catch (e) { errs.push('sky: ' + e.message); }
    c.drawImage(A, 0, ay, AS, AS);
    window.__artErrs = errs;
    return cv.toDataURL('image/jpeg', 0.88);
  }, { id, T });
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/fiend-art-${id}${process.env.SUF || ''}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('art errors', await page.evaluate(() => window.__artErrs));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
