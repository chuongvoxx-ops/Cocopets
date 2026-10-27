// The sky backdrop's pieces on an ordinary (graphics-chip) canvas: a vertical gradient done three ways, and clouds.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id=c width=780 height=1572 style="width:390px;height:786px"></canvas>');
  const r = await page.evaluate(() => {
    const cv = document.getElementById('c'), c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
    const W = 390, H = 786, k = 2;
    const col = document.createElement('canvas'); col.width = 1; col.height = H * k; { const x = col.getContext('2d'), g = x.createLinearGradient(0, 0, 0, H * k); g.addColorStop(0, '#79C3EE'); g.addColorStop(1, '#DFF4FF'); x.fillStyle = g; x.fillRect(0, 0, 1, H * k); }
    const colP = c.createPattern(col, 'repeat');
    const col64 = document.createElement('canvas'); col64.width = 64; col64.height = H * k; { const x = col64.getContext('2d'); x.drawImage(col, 0, 0, 64, H * k); }
    const col64P = c.createPattern(col64, 'repeat');
    const full = document.createElement('canvas'); full.width = W * k; full.height = H * k; { const x = full.getContext('2d'); x.drawImage(col, 0, 0, W * k, H * k); }
    const cloud = (sc) => { const cv2 = document.createElement('canvas'); cv2.width = Math.ceil(220 * sc * k); cv2.height = Math.ceil(110 * sc * k); const x = cv2.getContext('2d'); x.scale(sc * k, sc * k); [[60, 70, 38], [100, 55, 48], [150, 66, 40], [125, 80, 34], [80, 82, 30]].forEach(([a, b, r]) => { const g = x.createRadialGradient(a - r * 0.3, b - r * 0.4, r * 0.1, a, b, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E6F3FF'); x.fillStyle = g; x.beginPath(); x.arc(a, b, r, 0, 6.283); x.fill(); }); return cv2; };
    const c1 = cloud(1), c6 = cloud(0.6), c1x = (() => { const cv2 = document.createElement('canvas'); cv2.width = 220; cv2.height = 110; cv2.getContext('2d').drawImage(c1, 0, 0, 220, 110); return cv2; })();
    const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 12;
    const time = (key, f) => { fl(); const t0 = performance.now(); f(); fl(); T[key] = (T[key] || 0) + performance.now() - t0; };
    for (let n = -2; n < N; n++) {
      time('gradient fill', () => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#79C3EE'); g.addColorStop(1, '#DFF4FF'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
      time('1px column pattern', () => { colP.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0])); c.fillStyle = colP; c.fillRect(0, 0, W, H); });
      time('64px column pattern', () => { col64P.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0])); c.fillStyle = col64P; c.fillRect(0, 0, W, H); });
      time('full image 1:1', () => { c.drawImage(full, 0, 0, W, H); });
      time('8 clouds 1:1 pinned', () => { c.globalAlpha = 0.9; for (let i = 0; i < 8; i++) c.drawImage(i % 2 ? c1 : c6, Math.round((i * 47 + n) * 2) / 2, Math.round((i * 90) * 2) / 2, (i % 2 ? c1 : c6).width / 2, (i % 2 ? c1 : c6).height / 2); c.globalAlpha = 1; });
      time('8 clouds scaled (old)', () => { c.globalAlpha = 0.9; for (let i = 0; i < 8; i++) { const sc = i % 2 ? 1 : 0.6; c.drawImage(c1x, i * 47 + n + 0.3, i * 90 + 0.7, 220 * sc, 110 * sc); } c.globalAlpha = 1; });
      if (n === -1) for (const key in T) T[key] = 0;
    }
    return Object.fromEntries(Object.entries(T).map(([key, v]) => [key, +(v / N).toFixed(2)]));
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
