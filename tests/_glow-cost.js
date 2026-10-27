// What a soft glow costs drawn the usual way (a 64px sprite stretched over its size) against a copy of it made at its own
// size and laid down whole (1:1, on whole pixels), additively, at several sizes. usage: node tests/_glow-cost.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; const c = cv.getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
    c.fillStyle = '#203040'; c.fillRect(0, 0, 780, 1688);
    const spr = document.createElement('canvas'); spr.width = spr.height = 64; { const g = spr.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(136,204,255,1)'); gr.addColorStop(0.22, 'rgba(136,204,255,.62)'); gr.addColorStop(0.55, 'rgba(136,204,255,.18)'); gr.addColorStop(1, 'rgba(136,204,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    const out = {};
    const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
    for (const D of [16, 40, 100, 240, 600]) {
      const pre = document.createElement('canvas'); pre.width = pre.height = D; pre.getContext('2d').drawImage(spr, 0, 0, D, D);
      const n = Math.max(4, Math.round(2e6 / (D * D))), cases = {
        stretched: () => { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; for (let i = 0; i < n; i++) c.drawImage(spr, 37.3 + (i * 13.7) % 300, 51.6 + (i * 29.1) % 900, D, D); },
        stretchedWhole: () => { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; for (let i = 0; i < n; i++) c.drawImage(spr, 37 + (i * 13) % 300, 51 + (i * 29) % 900, D, D); },
        sized1to1: () => { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; for (let i = 0; i < n; i++) c.drawImage(pre, 37 + (i * 13) % 300, 51 + (i * 29) % 900); },
        sizedBetween: () => { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; for (let i = 0; i < n; i++) c.drawImage(pre, 37.3 + (i * 13.7) % 300, 51.6 + (i * 29.1) % 900); },
      };
      out[D] = { n };
      for (const [nm, f] of Object.entries(cases)) { const a = []; for (let rep = 0; rep < 7; rep++) { fl(); const t0 = performance.now(); f(); fl(); a.push(performance.now() - t0); } c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; out[D][nm] = +(med(a) / n * 1000).toFixed(0); }
    }
    return out;
  });
  console.log('µs per glow (lighter, alpha .5), by its size in pixels');
  for (const [D, v] of Object.entries(r)) console.log(`${D.padStart(4)}px ×${String(v.n).padStart(5)}  stretched ${String(v.stretched).padStart(6)}  stretched@whole ${String(v.stretchedWhole).padStart(6)}  own-size 1:1 ${String(v.sized1to1).padStart(6)}  own-size between ${String(v.sizedBetween).padStart(6)}`);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
