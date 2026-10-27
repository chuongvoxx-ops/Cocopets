// A full-screen vignette laid over the frame: a screen-sized picture copied pixel for pixel, against cheaper ways to
// darken the edges.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id=c width=780 height=1572 style="width:390px;height:786px"></canvas>');
  const r = await page.evaluate(() => {
    const cv = document.getElementById('c'), c = cv.getContext('2d');
    const W = 780, H = 1572;
    for (let i = 0; i < 300; i++) { c.fillStyle = `hsl(${i * 23},50%,60%)`; c.fillRect((i * 97) % W, (i * 53) % H, 60, 60); }
    const mk = (w, h, paint) => { const x = document.createElement('canvas'); x.width = w; x.height = h; paint(x.getContext('2d'), w, h); return x; };
    const vigP = (x, w, h) => { x.fillStyle = 'rgba(255,200,120,.08)'; x.fillRect(0, 0, w, h); const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); };
    const vigEdge = (x, w, h) => { const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); };
    const full = mk(W, H, vigP), half = mk(W / 2, H / 2, vigP), edge = mk(W, H, vigEdge);
    const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 12;
    const time = (key, f) => { fl(); const t0 = performance.now(); f(); fl(); T[key] = (T[key] || 0) + performance.now() - t0; };
    for (let n = -2; n < N; n++) {
      time('full 1:1', () => { c.imageSmoothingEnabled = false; c.drawImage(full, 0, 0); c.imageSmoothingEnabled = true; });
      time('half nearest 2x', () => { c.imageSmoothingEnabled = false; c.drawImage(half, 0, 0, W, H); c.imageSmoothingEnabled = true; });
      time('half smooth 2x', () => { c.drawImage(half, 0, 0, W, H); });
      time('gradient fill', () => vigP(c, W, H));
      time('grade fill + edge 1:1', () => { c.fillStyle = 'rgba(255,200,120,.08)'; c.fillRect(0, 0, W, H); c.drawImage(edge, 0, 0); });
      time('plain fill', () => { c.fillStyle = 'rgba(255,200,120,.08)'; c.fillRect(0, 0, W, H); });
      if (n === -1) for (const key in T) T[key] = 0;
    }
    return Object.fromEntries(Object.entries(T).map(([key, v]) => [key, +(v / N).toFixed(2)]));
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
