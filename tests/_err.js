const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', m => { if (m.type() === 'error') console.log('CON', m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(__dirname, '..', 'test.html')); await p.waitForTimeout(4000); console.log('pp', await p.evaluate(() => !!window.__pp)); await b.close(); })();
