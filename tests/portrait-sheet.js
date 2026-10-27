// Paints every Anima's portrait at the given stage(s). usage: node tests/portrait-sheet.js [ids|all] [stages e.g. 3 or 1,2,3] [w] [h]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : null, ks = (process.argv[3] || '3').split(',').map(Number), W = +(process.argv[4] || 240), H = +(process.argv[5] || 320);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(({ only, ks, W, H }) => {
    const P = window.__pp, ids = only || P.ANIMA_ORDER, cols = only ? ks.length * ids.length : 4, list = []; ids.forEach(id => ks.forEach(k => list.push([id, k])));
    const per = only ? list.length : 4, rows = Math.ceil(list.length / per), cv = document.createElement('canvas'); cv.width = W * per; cv.height = H * rows; const c = cv.getContext('2d'); const times = [];
    list.forEach(([id, k], i) => { const t0 = performance.now(); try { const p = P.AnimaPortrait.render(id, k, W, H, { dpr: 1 }); c.drawImage(p, (i % per) * W, Math.floor(i / per) * H); } catch (e) { c.fillStyle = '#F00'; c.font = '12px sans-serif'; c.fillText('ERR ' + e.message, (i % per) * W + 4, Math.floor(i / per) * H + 20); } times.push(Math.round(performance.now() - t0)); });
    return { url: cv.toDataURL('image/jpeg', 0.9), times };
  }, { only, ks, W, H });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/portrait-sheet.jpg'), Buffer.from(r.url.split(',')[1], 'base64'));
  console.log('ms', r.times.join(','), 'errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
