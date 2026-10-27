const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; document.body.appendChild(cv); cv.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;z-index:99';
    const c = cv.getContext('2d'); const fl = () => c.getImageData(0, 0, 1, 1);
    const mk = (w, h, cw, ch) => { const b = document.createElement('canvas'); b.width = w; b.height = h; const g = b.getContext('2d'); for (let i = 0; i < 300; i++) { g.fillStyle = `hsla(${i * 7},60%,50%,.8)`; g.beginPath(); g.arc(Math.random() * cw, Math.random() * ch, 30, 0, 7); g.fill(); } return b; };
    const L = mk(1000, 1000, 800, 800), E = mk(800, 800, 800, 800), B = mk(1782, 1782, 1782, 1782);
    const N = 40, out = {};
    const time = (name, f) => { f(0); fl(); const t0 = performance.now(); for (let i = 0; i < N; i++) f(i); fl(); out[name] = +((performance.now() - t0) / N * 1000).toFixed(0); };
    c.setTransform(1, 0, 0, 1, 0, 0);
    time('sub_origin', () => c.drawImage(L, 0, 0, 800, 800, 0, 300, 800, 800));
    time('whole_L', () => c.drawImage(L, 0, 300));
    time('whole_exact', () => c.drawImage(E, 0, 300));
    time('whole_exact_3arg', () => c.drawImage(E, 0, 300));
    time('whole_exact_5arg', () => c.drawImage(E, 0, 300, 800, 800));
    time('big_whole_offset', () => c.drawImage(B, -500, -40));
    time('big_sub_offset', () => c.drawImage(B, 500, 40, 780, 1688, 0, 0, 780, 1688));
    time('big_sub_offset_odd', () => c.drawImage(B, 501, 41, 780, 1688, 0, 0, 780, 1688));
    time('big_whole_offset_odd', () => c.drawImage(B, -501, -41));
    // a 'smoothing off' copy
    time('big_sub_nosmooth', () => { c.imageSmoothingEnabled = false; c.drawImage(B, 500, 40, 780, 1688, 0, 0, 780, 1688); c.imageSmoothingEnabled = true; });
    time('frac_nosmooth', () => { c.imageSmoothingEnabled = false; c.drawImage(E, 0.37, 300.6); c.imageSmoothingEnabled = true; });
    time('scaled_nosmooth', () => { c.imageSmoothingEnabled = false; c.drawImage(E, 0, 0, 780, 1688); c.imageSmoothingEnabled = true; });
    cv.remove(); return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
