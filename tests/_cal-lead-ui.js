const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html')); await p.waitForFunction(() => window.__pp); await p.evaluate(() => window.__pp.quickStart('Bot'));
  await p.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('rift', true); }); await p.waitForTimeout(800);
  await p.screenshot({ path: 'shots/cal-lead-rifttab.png' });
  console.log('errors', errs.slice(0, 3)); await b.close(); })();
