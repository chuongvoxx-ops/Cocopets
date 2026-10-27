// What each pass of the boss lighting costs on a canvas the size of a floor boss's (each flushed), full and half resolution.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const r = await page.evaluate(() => {
    const mk = (w) => { const c = document.createElement('canvas'); c.width = c.height = w; return c; };
    const out = {};
    for (const size of [700, 900]) {
      const cv = mk(size), a = cv.getContext('2d');
      // a boss-like silhouette: a few blobs and strokes
      const paint = () => { a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1; a.clearRect(0, 0, size, size); for (let i = 0; i < 40; i++) { a.fillStyle = `hsl(${i * 37},60%,50%)`; a.beginPath(); a.ellipse(size / 2 + Math.cos(i) * size * 0.2, size / 2 + Math.sin(i * 1.7) * size * 0.2, size * 0.12, size * 0.08, i, 0, 6.283); a.fill(); a.lineWidth = 4; a.strokeStyle = '#1a1030'; a.stroke(); } };
      const fl = x => x.getImageData(0, 0, 1, 1);
      const T = {}, time = (k, f, x) => { const t0 = performance.now(); f(); fl(x); T[k] = (T[k] || 0) + performance.now() - t0; };
      const b = mk(size).getContext('2d'), lo = Math.ceil(size / 2), bl = mk(lo).getContext('2d');
      const N = 6; const n0 = mk(48), nc = n0.getContext('2d'); for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { nc.fillStyle = `rgba(0,0,0,${Math.random() * 0.4})`; nc.fillRect(x, y, 1, 1); } const pat = a.createPattern(n0, 'repeat');
      for (let n = 0; n < N; n++) {
        paint(); fl(a);
        time('b.draw', () => { b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, size, size); b.drawImage(cv, 0, 0); }, b);
        time('b.dstOut', () => { b.globalCompositeOperation = 'destination-out'; b.drawImage(cv, 5, 6); }, b);
        time('b.srcIn', () => { b.globalCompositeOperation = 'source-in'; b.fillStyle = '#FFF4E0'; b.fillRect(0, 0, size, size); }, b);
        time('b.atopFill', () => { b.globalCompositeOperation = 'source-atop'; b.fillStyle = '#FFF4E0'; b.fillRect(0, 0, size, size); }, b);
        time('b.srcInPic', () => { b.globalCompositeOperation = 'source-in'; b.drawImage(cv, 0, 0); }, b);
        time('a.noise', () => { a.globalCompositeOperation = 'source-atop'; a.globalAlpha = 0.1; a.fillStyle = pat; a.fillRect(0, 0, size, size); a.globalAlpha = 1; }, a);
        time('lo.draw', () => { bl.globalCompositeOperation = 'source-over'; bl.clearRect(0, 0, lo, lo); bl.drawImage(cv, 0, 0, lo, lo); }, bl);
        time('lo.dstOut', () => { bl.globalCompositeOperation = 'destination-out'; bl.drawImage(cv, 2.5, 3, lo, lo); }, bl);
        time('lo.srcIn', () => { bl.globalCompositeOperation = 'source-in'; bl.fillStyle = '#120820'; bl.fillRect(0, 0, lo, lo); }, bl);
        time('a.grad', () => { a.globalCompositeOperation = 'source-atop'; const g = a.createLinearGradient(0, size * 0.25, 0, size); g.addColorStop(0, 'rgba(20,8,40,0)'); g.addColorStop(1, 'rgba(20,8,40,.42)'); a.fillStyle = g; a.fillRect(0, 0, size, size); }, a);
        time('a.atopPic', () => { a.globalCompositeOperation = 'source-atop'; a.drawImage(b.canvas, 0, 0); }, a);
        time('a.lighter', () => { a.globalCompositeOperation = 'lighter'; a.globalAlpha = 0.75; a.drawImage(b.canvas, 0, 0); a.globalAlpha = 1; }, a);
        time('a.loUp', () => { a.globalCompositeOperation = 'source-atop'; a.globalAlpha = 0.55; a.drawImage(bl.canvas, 0, 0, lo, lo, 0, 0, size, size); a.globalAlpha = 1; }, a);
      }
      out[size] = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, +(v / N).toFixed(2)]));
    }
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
