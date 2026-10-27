const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const page = await b.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html')); await page.waitForFunction(() => window.__pp);
  console.log(await page.evaluate(() => { const P = window.__pp; const g = P.summonGenome(6, P.mulberry32(11)), line = P.evolveLine(g.form, 7, P.mulberry32(77)), p = P.newPetFields('S', g); p.forms = line; p.stage = 3; try { return String(P.legScale(p)) + ' ' + typeof P.legScale; } catch (e) { return e.message; } }));
  await b.close(); })();
