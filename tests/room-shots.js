// The main room in several themes and lights. usage: node tests/room-shots.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Mochi'); const R = P.mulberry32(23), g = P.makeGenome(R); P.st.forms = P.evolveLine(g.form, 7, R); P.st.stage = 7; P.buildRoom && null; });
  await page.waitForTimeout(600);
  const shots = [['meadow', 'day'], ['cabin', 'day'], ['candy', 'dusk'], ['observatory', 'night'], ['cloud', 'day'], ['seaside', 'day']];
  for (const [theme, sky] of shots) {
    await page.evaluate(([theme, sky]) => { const r = document.querySelector('#room'); r.dataset.theme = theme; r.dataset.sky = sky; document.querySelector('#window').dataset.sky = sky; }, [theme, sky]);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.resolve(__dirname, `../shots/room-${theme}.png`) });
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
