// (v418 AB) the Anima screen on Abaddon: its portraits (three forms, the tile, the splash) on the GPU model or the cel-shaded one.
// usage: HTML=test-ab.html node tests/_ab-ui.js [gl 1|0] [dpr]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const GL = process.argv[2] === '1', DPR = +(process.argv[3] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(([gl, k]) => { window.__AB_GL = gl ? 1 : 0; window.__AB_GLHQ = 1; window.__ABK = k; }, [GL, +(process.env.K || 2)]);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ab.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 400000 });
  const r = await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.animas.have.cancer = +(window.__ABK || 2); P.st.animas.have.aries = 1; P.st.animas.eq = 'cancer'; const t0 = performance.now(); P.openAnimas('cancer'); return { ms: Math.round(performance.now() - t0), gl: window.ABADDON_GL.usable(), title: (document.querySelector('.an-cap h3') || {}).textContent, tag: (document.querySelectorAll('.an-realm')[0] || {}).textContent }; });
  console.log(JSON.stringify(r));
  await page.waitForTimeout(800);
  const f = `shots/v418-AB/ui-animas-${GL ? 'gl' : 'cel'}-d${DPR}.png`; await page.screenshot({ path: path.resolve(__dirname, '..', f) });
  // the three forms' portraits large, side by side
  await page.evaluate(() => { const P = window.__pp; const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#05070F;display:flex;flex-wrap:wrap;gap:6px;padding:6px;align-content:flex-start';
    for (const k of [1, 2, 3]) { const im = new Image(); im.src = P.AnimaPortrait ? P.AnimaPortrait.portrait('cancer', k, 186, 240) : AnimaPortrait.portrait('cancer', k, 186, 240); im.style.width = '186px'; d.appendChild(im); }
    const im2 = new Image(); im2.src = (P.AnimaArt || AnimaArt).picture('cancer', 3, 120); im2.style.cssText = 'width:120px;background:#223'; d.appendChild(im2); document.body.appendChild(d); });
  await page.waitForTimeout(500);
  const f2 = `shots/v418-AB/ui-portraits-${GL ? 'gl' : 'cel'}-d${DPR}.png`; await page.screenshot({ path: path.resolve(__dirname, '..', f2) });
  console.log(f, f2, 'errors', errors.length, JSON.stringify(errors.slice(0, 4)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
