// A showcase of one remade Anima: old vs new for each stage, a turn, and a walk cycle.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'aries';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(id => {
    const P = window.__pp, W = 1500, H = 1130, cv = document.createElement('canvas'); cv.width = W * 1.5; cv.height = H * 1.5; const c = cv.getContext('2d'); c.scale(1.5, 1.5);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2E2A5C'); g.addColorStop(1, '#16142E'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const A = P.ANIMAS[id], lab = (s, x, y, sz, col) => { c.fillStyle = col || '#FFFFFF'; c.font = `700 ${sz || 15}px sans-serif`; c.textAlign = 'center'; c.fillText(s, x, y); };
    const floor = (x, y, r) => { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x, y, r, r * 0.2, 0, 0, Math.PI * 2); c.fill(); };
    lab(`${A.name} · ${A.sign}: old painted sprite → cel-shaded 3D`, W / 2, 34, 20, '#FFE37A');
    for (let k = 1; k <= 3; k++) { const x0 = (k - 1) * 500 + 250, y = 330;
      lab(A.forms[k - 1], x0, 62, 16, '#D8D0FF');
      floor(x0 - 110, y, 70); P.AnimaArt.draw(c, id, k, x0 - 110, y, 210, 1.3, { legacy: true, aura: false }); lab('old', x0 - 110, y + 34, 13, '#A8A0D0');
      floor(x0 + 110, y, 70); P.AnimaArt.draw(c, id, k, x0 + 110, y, 210, 1.3, { aura: false, fk: 1 }); lab('new', x0 + 110, y + 34, 13, '#FFE37A'); }
    lab('Turning round (a real 3D turn, through the front)', W / 2, 410, 16, '#D8D0FF');
    [1, 0.6, 0.25, 0, -0.3, -0.65, -1].forEach((fk, i) => { const x = 140 + i * 205, y = 640; floor(x, y, 62); P.AnimaArt.draw(c, id, 2, x, y, 190, 1.3 + i * 0.1, { aura: false, fk, flip: fk < 0 }); });
    lab('Walking: legs swing and bend at the knee, the head nods, ears and tail bounce', W / 2, 720, 16, '#D8D0FF');
    for (let i = 0; i < 6; i++) { const x = 150 + i * 240, y = 960, ph = i / 6 * Math.PI * 2; floor(x, y, 62); P.AnimaArt.draw(c, id, 3, x, y, 200, 1 + i * 0.12, { aura: false, fk: 1, mv: 1, ph }); }
    lab('Strike: rears back, then butts forward', W / 2, 1010, 14, '#A8A0D0');
    [0.15, 0.3, 0.46, 0.7].forEach((atk, i) => { const x = 380 + i * 250, y = 1100; P.AnimaArt.draw(c, id, 1, x, y, 120, 1, { aura: false, fk: 1, atk }); });
    return cv.toDataURL('image/jpeg', 0.9);
  }, id);
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/a3d-show-${id}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
