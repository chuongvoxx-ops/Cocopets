// What a face's surface costs: a 256px noise tile as a pattern turned and skewed onto a polygon (as the geometric fiends'
// faces are), filtered and unfiltered, against a flat colour fill of the same polygon. usage: node tests/_patfill-cost.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; const c = cv.getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
    c.fillStyle = '#203040'; c.fillRect(0, 0, 780, 1688);
    const tl = document.createElement('canvas'); tl.width = tl.height = 256; const g = tl.getContext('2d'); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.2})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    const P = c.createPattern(tl, 'repeat'), med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
    // twenty faces, triangles and quads of about 90x90 px, each with its own turn
    const faces = Array.from({ length: 20 }, (_, i) => { const x = 60 + (i % 5) * 140, y = 100 + Math.floor(i / 5) * 300, a = i * 0.7; return { pts: [[x, y], [x + 100 * Math.cos(a), y + 100 * Math.sin(a)], [x + 90 * Math.cos(a + 1.2), y + 90 * Math.sin(a + 1.2)], [x + 50 * Math.cos(a + 2.2), y + 50 * Math.sin(a + 2.2)]], m: [Math.cos(a) * 0.8, Math.sin(a) * 0.5, -Math.sin(a) * 0.6, Math.cos(a) * 0.9, x, y] }; });
    const path = f => { c.beginPath(); f.pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
    const cases = {
      flat: () => { for (const f of faces) { c.fillStyle = '#556677'; path(f); c.fill(); } },
      pattern: () => { c.imageSmoothingEnabled = true; c.globalAlpha = 0.85; for (const f of faces) { P.setTransform(new DOMMatrix(f.m)); c.fillStyle = P; path(f); c.fill(); } c.globalAlpha = 1; },
      patternNearest: () => { c.imageSmoothingEnabled = false; c.globalAlpha = 0.85; for (const f of faces) { P.setTransform(new DOMMatrix(f.m)); c.fillStyle = P; path(f); c.fill(); } c.globalAlpha = 1; c.imageSmoothingEnabled = true; },
      clipRect: () => { c.globalAlpha = 0.85; for (const f of faces) { c.save(); path(f); c.clip(); c.transform(...f.m); P.setTransform(new DOMMatrix()); c.fillStyle = P; c.fillRect(-20, -20, 180, 180); c.restore(); } c.globalAlpha = 1; },
    };
    const out = {};
    for (let rep = 0; rep < 2; rep++) for (const [nm, f] of Object.entries(cases)) { const a = []; for (let k = 0; k < 9; k++) { fl(); const t0 = performance.now(); f(); fl(); a.push(performance.now() - t0); } out[nm] = +med(a).toFixed(2); }
    return out;
  });
  console.log('20 faces of about 90px:', JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
