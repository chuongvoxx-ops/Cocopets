// The Animas menu: recognition, binding, ascension, resonance, unsealing and the home button.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.resolve(__dirname, `../shots/anui-${n}.png`) });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Taro'); P.st.dun.best = 9; P.st.coins = 99999; P.st.crystals = 2000; P.st.gems = { citrine: 20, emerald: 20, sapphire: 20, amethyst: 20, starstone: 10 }; P.st.stage = 6; });
  await page.waitForTimeout(600);
  await shot('home');
  await page.evaluate(() => window.__pp.openAnimas()); await page.waitForTimeout(500);
  const r1 = await page.evaluate(() => JSON.stringify(window.__pp.st.animas));
  console.log('after open', r1);
  await shot('sheet');
  // ascend Samael twice, bind Uriel via unseal, then resonance
  for (let i = 0; i < 2; i++) { await page.click('[data-go="an-asc"][data-id="aries"]'); await page.waitForTimeout(400); await page.click('.asc-ov'); await page.waitForTimeout(400); await page.waitForTimeout(2600); await page.click('.asc-ov'); await page.waitForTimeout(500); }
  await page.click('[data-go="an-pick"][data-id="libra"]'); await page.waitForTimeout(250);
  await page.click('[data-go="an-unseal"][data-id="libra"]'); await page.waitForTimeout(250);
  await page.waitForTimeout(2900); await page.click('.asc-ov'); await page.waitForTimeout(500);   // the unsealing rite
  await page.click('[data-go="an-res"][data-id="libra"]'); await page.waitForTimeout(300);
  const r2 = await page.evaluate(() => ({ an: window.__pp.st.animas, crystals: window.__pp.st.crystals, coins: window.__pp.st.coins, gems: window.__pp.st.gems }));
  console.log('after actions', JSON.stringify(r2));
  await shot('sheet2');
  await page.evaluate(() => { const s = document.querySelector('.sheet'); if (s) s.scrollTop = 900; }); await page.waitForTimeout(200);
  await shot('sheet3');
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
