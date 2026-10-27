const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const W = 594, Hh = 713, A = document.createElement('canvas'); A.width = W + 4; A.height = Hh + 4; const a = A.getContext('2d');
    const paint = () => { a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, A.width, A.height); for (let i = 0; i < 40; i++) { a.fillStyle = `hsl(${i * 9},50%,45%)`; a.beginPath(); a.ellipse(100 + (i * 37) % 400, 100 + (i * 53) % 500, 60, 40, i, 0, 7); a.fill(); } };
    const B = document.createElement('canvas'), hw = Math.ceil(W / 3), hh = Math.ceil(Hh / 3); B.width = hw; B.height = hh; const b = B.getContext('2d');
    const BF = document.createElement('canvas'); BF.width = W; BF.height = Hh; const bf = BF.getContext('2d');
    const fl = () => a.getImageData(0, 0, 1, 1), N = 20, out = {};
    const time = (name, f) => { paint(); f(); fl(); let tot = 0; for (let i = 0; i < N; i++) { paint(); fl(); const t0 = performance.now(); f(); fl(); tot += performance.now() - t0; } out[name] = +(tot / N).toFixed(2); };
    const grads = () => { a.globalCompositeOperation = 'source-atop'; const ao = a.createLinearGradient(0, Hh * 0.45, 0, Hh); ao.addColorStop(0, 'rgba(4,2,8,0)'); ao.addColorStop(1, 'rgba(4,2,8,.45)'); a.fillStyle = ao; a.fillRect(0, 0, W, Hh); const side = a.createLinearGradient(W * 0.2, Hh * 0.1, W, Hh * 0.9); side.addColorStop(0, 'rgba(4,2,8,0)'); side.addColorStop(1, 'rgba(4,2,8,.25)'); a.fillStyle = side; a.fillRect(0, 0, W, Hh); a.globalCompositeOperation = 'source-over'; };
    const band3 = (dx, dy) => { b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, hw, hh); b.drawImage(A, 0, 0, W, Hh, 0, 0, hw, hh); b.globalCompositeOperation = 'destination-out'; b.drawImage(A, 0, 0, W, Hh, dx, dy, hw, hh); b.globalCompositeOperation = 'source-in'; b.fillStyle = '#fff'; b.fillRect(0, 0, hw, hh); a.globalCompositeOperation = 'lighter'; a.globalAlpha = 0.4; a.drawImage(B, 0, 0, hw, hh, 0, 0, W, Hh); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; };
    const band3_parts = {};
    const bandFull = (dx, dy) => { bf.setTransform(1, 0, 0, 1, 0, 0); bf.globalAlpha = 1; bf.globalCompositeOperation = 'source-over'; bf.clearRect(0, 0, W, Hh); bf.imageSmoothingEnabled = false; bf.drawImage(A, 0, 0); bf.globalCompositeOperation = 'destination-out'; bf.drawImage(A, dx, dy); bf.globalCompositeOperation = 'source-in'; bf.fillStyle = '#fff'; bf.fillRect(0, 0, W, Hh); a.globalCompositeOperation = 'lighter'; a.globalAlpha = 0.4; a.imageSmoothingEnabled = false; a.drawImage(BF, 0, 0); a.imageSmoothingEnabled = true; a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; };
    time('grads', grads);
    time('band3', () => band3(1, 1.2));
    time('band3x2', () => { band3(1, 1.2); band3(-1.3, -0.9); });
    time('bandFull', () => bandFull(2, 2));
    time('bandFullx2', () => { bandFull(2, 2); bandFull(-3, -2); });
    // the parts of band3
    time('b_down', () => { b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, hw, hh); b.drawImage(A, 0, 0, W, Hh, 0, 0, hw, hh); });
    time('b_up_lighter', () => { a.globalCompositeOperation = 'lighter'; a.globalAlpha = 0.4; a.drawImage(B, 0, 0, hw, hh, 0, 0, W, Hh); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; });
    time('b_up_lighter_whole', () => { a.globalCompositeOperation = 'lighter'; a.globalAlpha = 0.4; a.drawImage(B, 0, 0, W, Hh); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; });
    time('b_up_atop_whole', () => { a.globalCompositeOperation = 'source-atop'; a.globalAlpha = 0.4; a.drawImage(B, 0, 0, W, Hh); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over'; });
    time('paint_only', () => {});
    return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
