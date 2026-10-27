// screenshots: the Team feed panel for a resting pet, and the Feed tray's special foods
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const uid = await page.evaluate(() => { const P = window.__pp; P.quickStart('Lead'); const f = P.newPetFields('Pal', P.makeGenome(P.mulberry32(9))); f.dlv = 18; P.st.others.push(f); Object.assign(P.st.pantry, { ambrosia: 2, honeycomb: 3, feast: 1, hearttart: 4, sundae: 2, carrot: 5 }); return f.uid; });
  await page.evaluate(u => window.__pp.team.openTeam(u), uid); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.tm-feed').scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/feed-team.png') });
  await page.evaluate(() => window.__pp.closeSheet()); await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('#btnFeed').click()); await page.waitForTimeout(400);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/feed-tray.png') });
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
