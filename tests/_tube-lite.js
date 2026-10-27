// tube() against tubeLite(): what each costs, and both painted side by side for the eye. usage: node tests/_tube-lite.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 700, height: 700 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const src = require('fs').readFileSync(path.resolve(__dirname, '../src/js/20h4-fiend-toon.js'), 'utf8');
  const r = await page.evaluate((src) => {
    const DunFiend = { KIT: { qq: () => 2, sh: (h, k) => window.__pp.DunFiend.KIT.sh(h, k), Q: { flash: 0 } } }, hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const TN = eval(src + '; FiendToon');
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 1400; document.body.appendChild(cv); cv.style.cssText = 'position:fixed;left:0;top:0;width:700px;height:700px;z-index:99;background:#3A3230';
    const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); const fl = () => c.getImageData(0, 0, 1, 1);
    c.fillStyle = '#3A3230'; c.fillRect(0, 0, 700, 700);
    const tent = (x0, y0, a, len, w0, bend) => { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, aa = a + bend * u * u; pts.push([x0 + Math.cos(aa) * len * u, y0 + Math.sin(aa) * len * u]); } return { pts, wf: u => w0 * (1 - u * 0.72) + 2 }; };
    const set = []; for (let k = 0; k < 8; k++) set.push(tent(60, 40 + k * 40, -0.2 + k * 0.12, 250, 22, (k % 2 ? 1 : -1) * 0.9));
    const o = { col: '#FF9466', shade: '#E0603E', hi: '#FFD2B4', line: '#7A2618', lw: 2, d1: 0.18, d2: 0.38, spec: false };
    const og = Object.assign({ glowCol: '#FFC060', glowA: 0.4 }, o);
    set.forEach(t => TN.tube(c, t.pts, t.wf, o)); c.save(); c.translate(330, 0); set.forEach(t => TN.tubeLite(c, t.pts, t.wf, o)); c.restore();
    c.save(); c.translate(0, 360); set.forEach(t => TN.tube(c, t.pts, t.wf, og)); c.translate(330, 0); set.forEach(t => TN.tubeLite(c, t.pts, t.wf, og)); c.restore();
    fl(); const url = cv.toDataURL('image/png');
    const M = 20, out = {}, time = (name, f) => { f(); fl(); const t0 = performance.now(); for (let i = 0; i < M; i++) f(); fl(); out[name] = +((performance.now() - t0) / M / set.length * 1000).toFixed(0); };
    time('tube_us', () => set.forEach(t => TN.tube(c, t.pts, t.wf, o)));
    time('lite_us', () => set.forEach(t => TN.tubeLite(c, t.pts, t.wf, o)));
    time('tube_glow_us', () => set.forEach(t => TN.tube(c, t.pts, t.wf, og)));
    time('lite_glow_us', () => set.forEach(t => TN.tubeLite(c, t.pts, t.wf, og)));
    cv.remove(); return { out, url };
  }, src);
  console.log(JSON.stringify(r.out));
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/tube-lite.png'), Buffer.from(r.url.split(',')[1], 'base64'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
