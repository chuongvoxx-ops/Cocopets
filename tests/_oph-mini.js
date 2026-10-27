// Ophiuchus drawn small, as an Anima: a strip of frames, idle, charging and aligned. usage: node tests/_oph-mini.js [T=7]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const T = +(process.argv[2] || 7);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(([T, Q]) => {
    const D = window.__pp.FIEND_DEFS.bahamut.mini, M = D.make({ lv: 1 });
    const pw = Math.round(T * 22), ph = Math.round(T * 18), cv = document.createElement('canvas'); cv.width = pw * 4; cv.height = ph * 2; const c = cv.getContext('2d');
    c.fillStyle = '#1B2033'; c.fillRect(0, 0, cv.width, cv.height);
    const t0 = performance.now(); let n = 0;
    for (let f = 0; f < 8; f++) {
      for (let k = 0; k < 18; k++) { M.charge = f >= 4 ? Math.min(1, (f - 4) / 2) : 0; M.align = f >= 6 ? 1 : 0; D.step(M, 1 / 60); }
      const x = (f % 4) * pw + pw / 2, y = Math.floor(f / 4) * ph + ph * 0.45; const a = performance.now(); D.draw(c, M, x, y, T, { q: Q }); n += performance.now() - a;
    }
    return { url: cv.toDataURL('image/png'), ms: +(n / 8).toFixed(2) };
  }, [T, +(process.argv[3] || 0)]);
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/oph-mini.png'), Buffer.from(r.url.split(',')[1], 'base64'));
  console.log('draw ms', r.ms, 'errors', errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
