// What each pass of the dark floors' overlay costs (half-resolution layer, flushed after each), and some alternatives.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id=c width=780 height=1688 style="width:390px;height:844px"></canvas>');
  const r = await page.evaluate(() => {
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
    const main = document.getElementById('c'), c = main.getContext('2d');
    // a busy world on the main canvas
    for (let i = 0; i < 300; i++) { c.fillStyle = `hsl(${i * 23},50%,40%)`; c.fillRect((i * 97) % 780, (i * 53) % 1688, 60, 60); }
    const L = mk(128), g = L.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,.85)'); gr.addColorStop(0.8, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const fog = mk(80, 80), fx = fog.getContext('2d'); fx.fillStyle = '#0a0814'; fx.fillRect(0, 0, 80, 80); fx.clearRect(20, 20, 30, 30);
    const vig = mk(195, 422), vx = vig.getContext('2d'), vg = vx.createRadialGradient(97, 211, 60, 97, 211, 232); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); vx.fillStyle = vg; vx.fillRect(0, 0, 195, 422);
    const vigF = mk(780, 1688), vfx = vigF.getContext('2d'); vfx.drawImage(vig, 0, 0, 780, 1688);
    const run = (cw, ch, k, opts) => {
      const lc = mk(cw, ch), lx = lc.getContext('2d'), T = {}, fl = x => x.getImageData(0, 0, 1, 1);
      const time = (key, f, x) => { const t0 = performance.now(); f(); fl(x); T[key] = (T[key] || 0) + performance.now() - t0; };
      const N = 8;
      for (let n = 0; n < N; n++) {
        time('clear+fill', () => { lx.globalCompositeOperation = 'source-over'; lx.globalAlpha = 1; lx.clearRect(0, 0, cw, ch); lx.fillStyle = 'rgba(4,3,12,.8)'; lx.fillRect(0, 0, cw, ch); }, lx);
        time('light big', () => { lx.globalCompositeOperation = 'destination-out'; const s = 273 * k; lx.drawImage(L, 195 * k - s, 422 * k - s, s * 2, s * 2); }, lx);
        time('light big 1:1', () => { lx.globalCompositeOperation = 'destination-out'; const s = Math.round(273 * k); if (!run.big || run.big.width !== s * 2) { run.big = mk(s * 2); run.big.getContext('2d').drawImage(L, 0, 0, s * 2, s * 2); } lx.drawImage(run.big, Math.round(195 * k - s), Math.round(422 * k - s)); }, lx);
        time('light big 1:1 frac', () => { lx.globalCompositeOperation = 'destination-out'; const s = Math.round(273 * k); lx.drawImage(run.big, 195.37 * k - s, 422.61 * k - s); }, lx);
        time('lights small x5', () => { for (let i = 0; i < 5; i++) { const s = 132 * k; lx.globalAlpha = 0.85; lx.drawImage(L, (60 + i * 70) * k - s, (200 + i * 120) * k - s, s * 2, s * 2); } lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over'; }, lx);
        time('fog', () => { lx.imageSmoothingEnabled = true; lx.drawImage(fog, 10, 10, 30, 40, 0, 0, 30 * 44 * k, 40 * 44 * k); }, lx);
        time('vig', () => { lx.drawImage(opts.vigFull ? vigF : vig, 0, 0, cw, ch); }, lx);
        time('final', () => { c.save(); c.imageSmoothingEnabled = !opts.nearest; c.drawImage(lc, 0, 0, 780, 1688); c.restore(); }, c);
      }
      return Object.fromEntries(Object.entries(T).map(([key, v]) => [key, +(v / N).toFixed(2)]));
    };
    return { half: run(390, 844, 1, {}), halfNearest: run(390, 844, 1, { nearest: true }), full: run(780, 1688, 2, { vigFull: true }) };
  });
  for (const k in r) console.log(k, JSON.stringify(r[k]), 'sum', Object.values(r[k]).reduce((s, v) => s + v, 0).toFixed(1));
  await browser.close();
})();
