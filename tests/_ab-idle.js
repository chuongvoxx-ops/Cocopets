// (v420 AP) Abaddon's living motion: a strip of frames of its resting pose over a few seconds (the GPU model, or the cel model
// with gl 0), each frame its own cell, so the flexing arms, opening claws, swaying blades, bob and drift and the flourishes show.
// usage: HTML=test-ap.html node tests/_ab-idle.js [out.png] [gl 1|0] [frames] [seconds] [dpr]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT = process.argv[2] || 'shots/v420-AP/idle.png', GL = process.argv[3] !== '0', N = +(process.argv[4] || 10), SEC = +(process.argv[5] || 4.5), DPR = +(process.argv[6] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const CW = 290, W = CW * Math.min(N, 5), H = 330 * Math.ceil(N / 5);
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.addInitScript(gl => { window.__AB_GL = gl ? 1 : 0; window.__NG_GL = gl ? 1 : 0; window.__AB_GLHQ = 1; }, GL);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ap.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 400000 });
  const r = await page.evaluate(({ W, H, N, SEC, DPR, CW, GL }) => {
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(DPR, DPR); const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05070F'); g.addColorStop(1, '#0C1430'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (GL) window.ABADDON_GL.ensure(); const ms = [];
    for (let i = 0; i < N; i++) { const t = 5 + i * SEC / (N - 1), x = (i % 5) * CW + CW / 2, y = Math.floor(i / 5) * 330 + 290, t0 = performance.now();
      c.strokeStyle = 'rgba(120,150,220,.25)'; c.beginPath(); c.moveTo(x - CW / 2 + 8, y); c.lineTo(x + CW / 2 - 8, y); c.moveTo(x, y - 270); c.lineTo(x, y + 5); c.stroke();
      window.__pp.AnimaArt.draw(c, "cancer", 3, x, y, 205, t, {}); ms.push(Math.round(performance.now() - t0));
      c.fillStyle = '#C9D4F2'; c.font = '600 12px sans-serif'; c.textAlign = 'center'; c.fillText(`t ${(t - 5).toFixed(2)} s`, x, y + 22); }
    return { ms };
  }, { W, H, N, SEC, DPR, CW, GL });
  console.log(JSON.stringify(r)); await page.screenshot({ path: path.resolve(__dirname, '..', OUT) }); console.log('errors', errors.length, errors.slice(0, 4)); await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
