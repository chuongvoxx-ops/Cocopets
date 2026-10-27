// Fog over most of the screen in the open: enlarged straight onto the screen (and the vignette copied over it), against
// both laid into a half-resolution layer first and that copied up square by square.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id=c width=780 height=1572 style="width:390px;height:786px"></canvas>');
  const r = await page.evaluate(() => {
    const cv = document.getElementById('c'), c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
    const W = 390, H = 786, T = 44;
    for (let i = 0; i < 300; i++) { c.fillStyle = `hsl(${i * 23},50%,60%)`; c.fillRect((i * 37) % W, (i * 23) % H, 30, 30); }
    const mk = (w, h) => { const x = document.createElement('canvas'); x.width = w; x.height = h; return x; };
    const fog = mk(80, 80), fx = fog.getContext('2d'); fx.fillStyle = '#07050E'; fx.fillRect(0, 0, 80, 80); fx.clearRect(30, 30, 6, 8);
    const vigP = (x, w, h) => { const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); };
    const vigFull = mk(780, 1572); vigP(vigFull.getContext('2d'), 780, 1572);
    const lc = mk(390, 786), lx = lc.getContext('2d'), vigH = mk(390, 786); vigP(vigH.getContext('2d'), 390, 786);
    const fl = () => c.getImageData(0, 0, 1, 1), Tm = {}, N = 12;
    const time = (key, f) => { fl(); const t0 = performance.now(); f(); fl(); Tm[key] = (Tm[key] || 0) + performance.now() - t0; };
    for (const cover of [1, 0.5, 0.25]) {
      const tw = Math.ceil(W / T * cover) + 2, th = Math.ceil(H / T) + 2;
      for (let n = -2; n < N; n++) {
        time('direct ' + cover, () => { c.save(); c.imageSmoothingEnabled = true; c.globalAlpha = 0.94; c.drawImage(fog, 25, 25, tw, th, -T + n * 0.3, -T, tw * T, th * T); c.restore(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(vigFull, 0, 0); c.restore(); });
        time('layer ' + cover, () => { lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalAlpha = 1; lx.clearRect(0, 0, 390, 786); lx.imageSmoothingEnabled = true; lx.globalAlpha = 0.94; lx.drawImage(fog, 25, 25, tw, th, (-T + n * 0.3), -T, tw * T, th * T); lx.globalAlpha = 1; lx.drawImage(vigH, 0, 0); c.save(); c.imageSmoothingEnabled = false; c.drawImage(lc, 0, 0, W, H); c.restore(); });
        if (n === -1) { delete Tm['direct ' + cover]; delete Tm['layer ' + cover]; }
      }
    }
    return Object.fromEntries(Object.entries(Tm).map(([key, v]) => [key, +(v / N).toFixed(2)]));
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
