// The treasure box (1000 crystals inside), the egg summon (10 for 1000) and the star odds.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const out = {};
  out.rates = await page.evaluate(() => { const P = window.__pp; P.quickStart('Summoner'); const R = P.mulberry32(99); const t = { 3: 0, 4: 0, 5: 0 }; for (let i = 0; i < 4000; i++) t[P.rollStars(R)]++; const g = P.summonGenome(5, P.mulberry32(5)); return { t, fiveOk: P.starsOf(P.rarityOf ? P.rarityOf(g.form) : 3) }; });
  // the treasure box
  await page.evaluate(() => { const P = window.__pp; P.st.crystals = 0; P.st.pearls = 5000; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.waitForTimeout(400); await page.screenshot({ path: path.resolve(__dirname, '../shots/summon-tower.png') });
  await page.evaluate(() => window.__pp.dun.openGiftShop()); await page.waitForTimeout(500);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/summon-giftshop.png') });
  await page.evaluate(() => window.__pp.dun.buyGift('pearls')); await page.waitForTimeout(900);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/summon-box-closed.png') });
  await page.click('#gwBox'); await page.waitForTimeout(3200);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/summon-box-open.png') });
  out.afterBox = await page.evaluate(() => ({ crystals: window.__pp.st.crystals, tiles: document.querySelectorAll('.gw-tile').length, firstTile: document.querySelector('.gw-tile small').textContent }));
  await page.click('[data-gw="done"]'); await page.waitForTimeout(300);
  // the summon
  await page.evaluate(() => window.__pp.openSummon()); await page.waitForTimeout(500);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/summon-sheet.png') });
  out.before = await page.evaluate(() => ({ pets: 1 + window.__pp.st.others.length, crystals: window.__pp.st.crystals }));
  await page.click('[data-go="summon-10"]'); await page.waitForTimeout(900);
  await page.click('#gwBox'); await page.waitForTimeout(3800);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/summon-result.png') });
  out.after = await page.evaluate(() => ({ pets: 1 + window.__pp.st.others.length, crystals: window.__pp.st.crystals, stars: window.__pp.st.others.map(p => window.__pp.starsOf(p.rarity)), title: document.querySelector('#gwTitle').textContent, comps: window.__pp.comps.length }));
  await page.click('[data-gw="done"]'); await page.waitForTimeout(300);
  // not enough crystals: the shop opens instead
  await page.evaluate(() => { window.__pp.st.crystals = 10; window.__pp.doSummon(10); }); await page.waitForTimeout(300);
  out.short = await page.evaluate(() => window.__pp.sheetKind);
  // a single egg from the egg screen follows the odds too
  out.single = await page.evaluate(() => { const P = window.__pp; P.closeSheet(); P.st.crystals = 500; P.doSummon(1); return { pets: 1 + P.st.others.length, crystals: P.st.crystals }; });
  await page.waitForTimeout(600); await page.click('#gwBox'); await page.waitForTimeout(2000);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/summon-single.png') });
  console.log(JSON.stringify(out, null, 1));
  console.log('errors:', errors.length); errors.slice(0, 8).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
