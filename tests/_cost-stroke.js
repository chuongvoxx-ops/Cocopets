// What an outline costs here: strokes of smooth and straight paths with each join, against fills. usage: node tests/_cost-stroke.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const src = require('fs').readFileSync(path.resolve(__dirname, '../src/js/20h4-fiend-toon.js'), 'utf8');
  const r = await page.evaluate((src) => {
    const DunFiend = { KIT: { qq: () => 2, sh: h => h, Q: { flash: 0 } } }, hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const FiendToon = eval(src + '; FiendToon');
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; document.body.appendChild(cv); cv.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;z-index:99';
    const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); const fl = () => c.getImageData(0, 0, 1, 1), TN = FiendToon;
    // 31 plates of 8 points, ~30px across, on a grid
    const plates = []; for (let i = 0; i < 31; i++) { const cx = 40 + (i % 6) * 55, cy = 100 + Math.floor(i / 6) * 60, P = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; P.push([cx + Math.cos(a) * 22, cy + Math.sin(a) * 15]); } plates.push(P); }
    // a tentacle ribbon
    const N = 12, pts = []; for (let i = 0; i <= N; i++) { const u = i / N; pts.push([60 + u * 260, 500 + Math.sin(u * 5) * 60 + u * 150]); }
    const rib = TN.ribbon(pts, u => 26 * (1 - u * 0.7) + 3);
    const M = 20, out = {};
    const time = (name, f) => { f(); fl(); const t0 = performance.now(); for (let i = 0; i < M; i++) f(); fl(); out[name] = +((performance.now() - t0) / M * 1000).toFixed(0); };
    c.fillStyle = '#846256'; c.strokeStyle = '#1E0F0E'; c.lineWidth = 2;
    const strokeAll = (mk, join) => { c.lineJoin = join; c.lineCap = 'round'; c.beginPath(); plates.forEach(P => mk(P)(c)); c.stroke(); };
    time('fill_blobs', () => { c.beginPath(); plates.forEach(P => TN.blob(P)(c)); c.fill(); });
    time('fill_polys', () => { c.beginPath(); plates.forEach(P => TN.poly(P)(c)); c.fill(); });
    time('stroke_blob_round', () => strokeAll(TN.blob, 'round'));
    time('stroke_blob_miter', () => strokeAll(TN.blob, 'miter'));
    time('stroke_blob_bevel', () => strokeAll(TN.blob, 'bevel'));
    time('stroke_poly_round', () => strokeAll(TN.poly, 'round'));
    time('stroke_poly_miter', () => strokeAll(TN.poly, 'miter'));
    time('stroke_blob_each_round', () => { c.lineJoin = 'round'; plates.forEach(P => { c.beginPath(); TN.blob(P)(c); c.stroke(); }); });
    c.lineWidth = 2.5;
    time('rib_fill', () => { c.beginPath(); rib(c); c.fill(); });
    time('rib_stroke_round', () => { c.lineJoin = 'round'; c.beginPath(); rib(c); c.stroke(); });
    time('rib_stroke_miter', () => { c.lineJoin = 'miter'; c.beginPath(); rib(c); c.stroke(); });
    time('rib_stroke_bevel', () => { c.lineJoin = 'bevel'; c.beginPath(); rib(c); c.stroke(); });
    c.lineWidth = 6;
    time('rib_stroke6_round', () => { c.lineJoin = 'round'; c.beginPath(); rib(c); c.stroke(); });
    time('rib_stroke6_miter', () => { c.lineJoin = 'miter'; c.beginPath(); rib(c); c.stroke(); });
    time('ell_stroke_round', () => { c.lineJoin = 'round'; c.beginPath(); c.ellipse(200, 300, 120, 80, 0.3, 0, Math.PI * 2); c.stroke(); });
    time('ell_fill', () => { c.beginPath(); c.ellipse(200, 300, 120, 80, 0.3, 0, Math.PI * 2); c.fill(); });
    time('shape_rib', () => { TN.shape(c, rib, { col: '#FF9466', shade: '#E0603E', hi: '#FFD2B4', line: '#7A2618', lw: 2.5, r: 26 }); });
    time('shape_rib_noline', () => { TN.shape(c, rib, { col: '#FF9466', shade: '#E0603E', hi: '#FFD2B4', line: false, lw: 2.5, r: 26 }); });
    // the same under a clip to a 40-gon (as the scutes are painted inside the dome)
    c.save(); c.beginPath(); for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; c.lineTo(200 + Math.cos(a) * 190, 300 + Math.sin(a) * 260); } c.closePath(); c.clip();
    c.lineWidth = 2;
    time('C_fill_blobs', () => { c.beginPath(); plates.forEach(P => TN.blob(P)(c)); c.fill(); });
    time('C_fill_polys', () => { c.beginPath(); plates.forEach(P => TN.poly(P)(c)); c.fill(); });
    time('C_stroke_blob_round', () => strokeAll(TN.blob, 'round'));
    time('C_stroke_poly_miter', () => strokeAll(TN.poly, 'miter'));
    time('C_stroke_blob_each_round', () => { c.lineJoin = 'round'; plates.forEach(P => { c.beginPath(); TN.blob(P)(c); c.stroke(); }); });
    time('C_evenodd_polys', () => { c.beginPath(); plates.forEach(P => { TN.poly(P)(c); TN.poly(P.map(p => [p[0] * 0.95 + 2, p[1] * 0.95 + 2]))(c); }); c.fill('evenodd'); });
    c.restore();
    cv.remove(); return out;
  }, src);
  console.log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
