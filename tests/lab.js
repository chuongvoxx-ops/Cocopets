// Laboratory room, studio cosmetics, crystal pill and mansion text in dark mode. usage: node tests/lab.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, colorScheme: 'dark' });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.resolve(__dirname, `../shots/lab-${n}.png`) });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(400);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Taro'); P.st.coins = 99999; P.st.crystals = 5000; });
  await page.waitForTimeout(800);
  await page.evaluate(() => { const P = window.__pp; P.startAdopt && 0; P.buildRoom('lab'); });
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => { const P = window.__pp; return { type: P.st.room.type, rooms: P.st.house.rooms.map(r => r.type), btn: !document.querySelector('#labBtn').hidden }; });
  console.log('after build', JSON.stringify(r));
  await page.evaluate(() => window.__pp.closeSheet()); await page.waitForTimeout(500);
  await shot('room');
  await page.click('#labBtn'); await page.waitForTimeout(500); await shot('fuse');
  await page.click('[data-go="laboratory"][data-tab="shop"]'); await page.waitForTimeout(400); await shot('shop');
  await page.click('[data-go="laboratory"][data-tab="studio"]'); await page.waitForTimeout(400);
  for (const id of ['coat', 'eyes', 'aura', 'halo', 'rare']) { await page.click(`[data-go="cos"][data-id="${id}"]`); await page.waitForTimeout(350); }
  const after = await page.evaluate(() => { const P = window.__pp, f = P.st.forms[P.st.stage - 1]; return { crystals: P.st.crystals, pal: f.pal.name, aura: f.x && f.x.aura, halo: f.x && f.x.halo }; });
  console.log('studio', JSON.stringify(after));
  await shot('studio');
  await page.click('[data-go="cos"][data-id="clear"]'); await page.waitForTimeout(300);
  await page.evaluate(() => window.__pp.closeSheet()); await page.waitForTimeout(400);
  await page.click('#roomName'); await page.waitForTimeout(900); await shot('mansion');
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
