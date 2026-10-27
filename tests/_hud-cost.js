// What the HUD's kinds of drawing cost on an ordinary canvas: outlined labels written afresh against kept as pictures,
// small rounded panels, gradient discs, glows.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id=c width=780 height=1572 style="width:390px;height:786px"></canvas>');
  const r = await page.evaluate(() => {
    const cv = document.getElementById('c'), c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
    const labels = ['HP 812 / 900', 'MP 41 / 120', 'ULT · 30 MP', 'S1 · 12', 'S2+ · 18', 'S3 · 22', 'DODGE', 'MOVE'];
    const font = '800 10px sans-serif';
    const pics = labels.map(s => { const k = 2, p = document.createElement('canvas'), g = p.getContext('2d'); g.font = font; const w = Math.ceil(g.measureText(s).width + 10), h = 20; p.width = w * k; p.height = h * k; g.setTransform(k, 0, 0, k, 0, 0); g.font = font; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineJoin = 'round'; g.strokeText(s, 5, h / 2); g.fillStyle = '#fff'; g.fillText(s, 5, h / 2); return { p, w, h }; });
    const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 20;
    const time = (key, f) => { fl(); const t0 = performance.now(); f(); fl(); T[key] = (T[key] || 0) + performance.now() - t0; };
    const glow = document.createElement('canvas'); glow.width = glow.height = 64; { const g = glow.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,220,120,1)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    for (let n = -2; n < N; n++) {
      time('8 labels stroke+fill', () => { c.font = font; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineJoin = 'round'; labels.forEach((s, i) => { c.strokeText(s, 20 + (i % 2) * 180, 60 + i * 80); c.fillStyle = '#fff'; c.fillText(s, 20 + (i % 2) * 180, 60 + i * 80); }); });
      time('8 labels fill only', () => { c.font = font; c.textBaseline = 'middle'; labels.forEach((s, i) => { c.fillStyle = '#fff'; c.fillText(s, 20 + (i % 2) * 180, 60 + i * 80); }); });
      time('8 label pictures', () => { pics.forEach((q, i) => c.drawImage(q.p, 15 + (i % 2) * 180, 50 + i * 80, q.w, q.h)); });
      time('12 rounded panels', () => { for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(12,9,26,.72)'; rr(10 + (i % 3) * 120, 20 + i * 60, 100, 20, 8); c.fill(); } });
      time('2 gradient discs', () => { for (let i = 0; i < 2; i++) { const gr = c.createRadialGradient(80, 650, 10, 80, 650, 48); gr.addColorStop(0, 'rgba(18,12,38,.18)'); gr.addColorStop(1, 'rgba(18,12,38,.5)'); c.fillStyle = gr; c.beginPath(); c.arc(80, 650, 48, 0, 6.283); c.fill(); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,.6)'; c.stroke(); } });
      time('2 glows', () => { c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(glow, 260, 600, 130, 130); c.drawImage(glow, 300, 500, 100, 100); c.restore(); });
      if (n === -1) for (const key in T) T[key] = 0;
    }
    return Object.fromEntries(Object.entries(T).map(([key, v]) => [key, +(v / N).toFixed(2)]));
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
