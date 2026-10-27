const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 1200, height: 560 } });
  await p.goto('file://' + path.resolve(__dirname, '../test.html')); await p.waitForFunction(() => window.__pp); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 560; Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(cv); const c = cv.getContext('2d'); c.fillStyle = '#3A2238'; c.fillRect(0, 0, 1200, 560);
    const A = window.__pp.DunArt, W = window.__pp.DunWorld; let x = 90;
    for (const [t, mode, col, r] of [['warmech', '', '#4E5668', 60], ['warmech', 'block', '#4E5668', 60], ['mechhound', '', '#5A6278', 46], ['mechegg', '', '#3A3240', 48], ['mechegg', 'block', '#3A3240', 48], ['eggling', '', '#6A7488', 34]]) { c.save(); c.translate(x, 200); A.MP[t](c, r, 0.2, { color: col, mode }); c.restore(); x += 180; }
    x = 120; for (const [k, v] of [['biotube', 0], ['biotube', 1], ['xenospire', 0], ['vertebra', 1], ['metalspike', 0]]) { c.save(); c.translate(x, 540); W.PROPS[k](c, 34, v); c.restore(); x += 230; }
    return 'ok'; });
  console.log(r); await p.screenshot({ path: path.resolve(__dirname, '../shots/mecha-sheet.png') }); await b.close(); })();
