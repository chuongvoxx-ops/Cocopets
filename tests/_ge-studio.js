// v423 GE: a studio sheet of every garden picture and texture (no stage played): shots/v423-GE/<OUT>.png
// env: HTML (test-ge.html), P (px a tile, 80), OUT (studio), ONLY (comma list of picture names)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1700 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ge.html'));
  await page.waitForFunction(() => window.__pp && window.GARDEN_PROPS, null, { timeout: 60000 });
  const res = await page.evaluate(([P, only]) => { const G = window.GARDEN_PROPS, out = [];
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 1700; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#1B0D22'; document.body.appendChild(cv); const c = cv.getContext('2d'); c.fillStyle = '#2A1834'; c.fillRect(0, 0, 1400, 1700);
    let x = 10, y = 10, rowH = 0; const put = (s, label) => { if (!s) { out.push(label + ': null'); return; } const w = s.cv.width, h = s.cv.height; if (x + w > 1390) { x = 10; y += rowH + 18; rowH = 0; } c.drawImage(s.cv, x, y); c.fillStyle = '#fff'; c.font = '11px sans-serif'; c.fillText(label, x, y + h + 12); x += w + 12; rowH = Math.max(rowH, h); };
    const names = only ? only.split(',') : [...G.KINDS, 'dtuft', 'dflower', 'dfern', 'droot', 'dmoss', 'thorn', 'moon', 'isle'];
    for (const n of names) { const vs = n === 'moon' ? [0, 1, 2] : [0, 1]; for (const v of vs) { const t0 = performance.now(); const s = G.sprite(n, v, n === 'moon' ? 50 : n === 'isle' ? 40 : P); out.push(`${n}/${v}: ${(performance.now() - t0).toFixed(0)} ms ${s ? s.cv.width + 'x' + s.cv.height : 'null'}`); put(s, n + v); } }
    if (!only) for (const tn of ['floor', 'bank', 'roof', 'cliff', 'bridge', 'bunder']) { const t0 = performance.now(); const t = G.tex(tn, P); out.push(`tex ${tn}: ${(performance.now() - t0).toFixed(0)} ms`); put(t ? { cv: t.cv } : null, 'tex ' + tn); }
    return out; }, [+(process.env.P || 80), process.env.ONLY || null]);
  console.log(res.join('\n'));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', 'v423-GE', (process.env.OUT || 'studio') + '.png') });
  console.log('errors', JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})();
