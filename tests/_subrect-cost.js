// A kept picture laid down 1:1 on whole pixels: the whole canvas (5 arguments) against only its used part (9 arguments).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; const c = cv.getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
    c.fillStyle = '#203040'; c.fillRect(0, 0, 780, 1688);
    const L = document.createElement('canvas'); L.width = 900; L.height = 1100; const g = L.getContext('2d'); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${i % 255},120,200,.5)`; g.beginPath(); g.arc(Math.random() * 820, Math.random() * 1000, 20, 0, 6.28); g.fill(); }
    const w = 820, h = 1000, med = a => { const b = a.slice().sort((x, y) => x - y); return +b[b.length >> 1].toFixed(2); };
    const cases = {
      whole5: () => { c.imageSmoothingEnabled = false; c.drawImage(L, 0, 0, L.width, L.height); },
      whole3: () => { c.imageSmoothingEnabled = false; c.drawImage(L, 0, 0); },
      sub9: () => { c.imageSmoothingEnabled = false; c.drawImage(L, 0, 0, w, h, 0, 0, w, h); },
      sub9smooth: () => { c.imageSmoothingEnabled = true; c.drawImage(L, 0, 0, w, h, 0, 0, w, h); },
      whole5frac: () => { c.imageSmoothingEnabled = false; c.drawImage(L, 0.4, 0.3, L.width, L.height); },
      sub9frac: () => { c.imageSmoothingEnabled = false; c.drawImage(L, 0, 0, w, h, 0.4, 0.3, w, h); },
    };
    const out = {}; for (let rep = 0; rep < 2; rep++) for (const [nm, f] of Object.entries(cases)) { const a = []; for (let k = 0; k < 15; k++) { fl(); const t0 = performance.now(); f(); fl(); a.push(performance.now() - t0); } out[nm] = med(a); }
    return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
