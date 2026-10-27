const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; document.body.appendChild(cv); cv.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;z-index:99';
    const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); const fl = () => c.getImageData(0, 0, 1, 1);
    // a long curved ribbon from the upper left to the lower right
    const N = 30, pts = []; for (let i = 0; i <= N; i++) { const u = i / N; pts.push([30 + u * 330, 60 + u * 700 + Math.sin(u * 6) * 60]); }
    const rib = (a, b, w) => { const L = [], R = []; for (let i = a; i <= b; i++) { const p = pts[i], q = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy), ww = w * (1 - i / N * 0.7); L.push([p[0] - dy / d * ww, p[1] + dx / d * ww]); R.push([p[0] + dy / d * ww, p[1] - dx / d * ww]); } c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let i = 1; i < L.length; i++) c.lineTo(L[i][0], L[i][1]); for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); };
    const M = 30, out = {};
    const time = (name, f) => { f(); fl(); const t0 = performance.now(); for (let i = 0; i < M; i++) f(); fl(); out[name] = +((performance.now() - t0) / M * 1000).toFixed(0); };
    c.fillStyle = 'rgba(120,200,255,.2)';
    time('whole_over', () => { rib(0, N, 30); c.fill(); });
    time('whole_lighter', () => { c.globalCompositeOperation = 'lighter'; rib(0, N, 30); c.fill(); c.globalCompositeOperation = 'source-over'; });
    time('chunks6_lighter', () => { c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { rib(k * 5, k * 5 + 5, 30); c.fill(); } c.globalCompositeOperation = 'source-over'; });
    time('chunks10_lighter', () => { c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 10; k++) { rib(k * 3, k * 3 + 3, 30); c.fill(); } c.globalCompositeOperation = 'source-over'; });
    time('stroke_poly', () => { c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(120,200,255,.2)'; c.lineWidth = 40; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.globalCompositeOperation = 'source-over'; });
    time('thin_whole', () => { c.globalCompositeOperation = 'lighter'; rib(0, N, 6); c.fill(); c.globalCompositeOperation = 'source-over'; });
    time('narrow_bbox_whole', () => { c.globalCompositeOperation = 'lighter'; c.save(); c.translate(0, 0); const P2 = pts.map(p => [p[0] * 0.15 + 150, p[1]]); const L = P2.map(p => [p[0] - 30, p[1]]), R = P2.map(p => [p[0] + 30, p[1]]); c.beginPath(); c.moveTo(L[0][0], L[0][1]); L.forEach(p => c.lineTo(p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); c.fill(); c.restore(); c.globalCompositeOperation = 'source-over'; });
    cv.remove(); return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
