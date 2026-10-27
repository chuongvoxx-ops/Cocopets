// What a half-resolution light layer costs the page itself (no flush timed): painted and laid over the screen in the same
// frame, painted but laid down a frame later, and painted without being laid down. usage: node tests/_cost-lc.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id="m" width="780" height="1688" style="width:390px;height:844px"></canvas>');
  const r = await page.evaluate(() => {
    const m = document.getElementById('m'), c = m.getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
    const mk = () => { const cv = document.createElement('canvas'); cv.width = 390; cv.height = 844; return cv; };
    const L = mk(); L.width = L.height = 128; { const g = L.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    const paint = (cv, n) => { const x = cv.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, 390, 844); x.fillStyle = 'rgba(4,3,12,.8)'; x.fillRect(0, 0, 390, 844); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < n; i++) x.drawImage(L, 100 + i * 7, 300 + (i % 5) * 30, 200, 200); x.globalCompositeOperation = 'source-over'; };
    const scene = () => { c.fillStyle = '#334'; c.fillRect(0, 0, 780, 1688); };
    const A = mk(), B = mk(), out = {}, F = 30;
    const time = (name, frame) => { for (let i = 0; i < 3; i++) { frame(i); fl(); } let tot = 0; for (let i = 0; i < F; i++) { const t0 = performance.now(); frame(i); tot += performance.now() - t0; fl(); } out[name] = +(tot / F).toFixed(2); };
    time('scene_only', () => { scene(); });
    time('paint_and_lay_same_frame', () => { scene(); paint(A, 6); c.drawImage(A, 0, 0, 780, 1688); });
    time('paint_lay_last_frames', i => { scene(); const cur = i % 2 ? A : B, prev = i % 2 ? B : A; paint(cur, 6); c.drawImage(prev, 0, 0, 780, 1688); });
    time('paint_only', () => { scene(); paint(A, 6); });
    time('lay_only', () => { scene(); c.drawImage(A, 0, 0, 780, 1688); });
    return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
