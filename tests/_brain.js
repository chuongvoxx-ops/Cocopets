// The Pale Intellect's brain drawn big in a few states, to judge its look. usage: node tests/_brain.js [T]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const T = +(process.argv[2] || 30);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(T => {
    const D = window.__pp.FIEND_DEFS.pale, cw = T * 13, ch = T * 13, cv = document.createElement('canvas'); cv.width = cw * 3; cv.height = ch * 2; const c = cv.getContext('2d');
    const mkT = (mode) => [0, 1, 2, 3, 4, 5, 6, 7].map(j => { const a = j / 8 * Math.PI * 2 + Math.PI / 8, ca = Math.cos(a), sa = Math.sin(a); return mode === 'spider' ? { tx: ca * 5.6, ty: sa * 4.2, tz: 8.6, mx: ca * 4.4, my: sa * 3.4, mz: 9.6, pulses: [0.3, 0.7] } : { tx: ca * 3.4 + Math.sin(j) * 0.8, ty: sa * 2.6 + 0.6, tz: 0.3, mx: ca * 3.6, my: sa * 2.8 + 0.4, mz: 3.4, pulses: [((j * 0.37) % 1)] }; });
    const poses = [{ name: 'listening', B: { z: 5, tents: mkT() } }, { name: 'turned', B: { z: 5, yaw: 0.5, tents: mkT() } }, { name: 'parted: the core', B: { z: 4, sp: 1.2, tents: mkT() } },
      { name: 'an illusion', B: { z: 5, ghost: 1, a: 0.85, tents: mkT() } }, { name: 'III: white fissure, legs up', B: { z: 5, white: 1, fis: 1, tents: mkT('spider') } }, { name: 'small (in game)', B: { z: 5, tents: mkT() }, k: 0.75 }];
    poses.forEach((ps, i) => {
      const x = (i % 3) * cw, y = Math.floor(i / 3) * ch; const g = c.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, '#20182A'); g.addColorStop(1, '#0A080E'); c.fillStyle = g; c.fillRect(x, y, cw, ch);
      const TT = T * (ps.k || 1), X = x + cw / 2, Y = y + ch * 0.86, P = { sx: v => X + v * TT, sy: v => Y + v * TT, Tz: () => TT };
      const B = Object.assign({ x: 0, y: 0 }, ps.B); c.save(); try { D.drawBrain(c, P, B, TT, 1.3); } catch (e) { c.fillStyle = '#F00'; c.fillText(e.message, x + 10, y + 40); } c.restore();
      c.fillStyle = '#FFE37A'; c.font = '700 13px sans-serif'; c.fillText(ps.name, x + 8, y + 18);
    });
    return cv.toDataURL('image/jpeg', 0.9);
  }, T);
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/brain.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
