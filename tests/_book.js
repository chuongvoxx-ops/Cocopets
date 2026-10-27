const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Taro'); P.st.dun.best = 45; P.st.dun.seen = { blob: 3, bossking: 2, bosshydra: 1, fiendnuckelavee: 1 }; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.renderDungeon(); });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => { const secs = [...document.querySelectorAll('.dun-book .sec')].map(e => e.textContent); const el = document.querySelector('.dun-book'); el.scrollIntoView(); const imgs = [...el.querySelectorAll('img')].filter(i => i.src.length > 200).length; return { secs, imgs, cards: el.querySelectorAll('.mb-card').length, subs: [...el.querySelectorAll('.tray-sub')].map(e => e.textContent) }; });
  await page.evaluate(() => { const h = [...document.querySelectorAll('.dun-book .sec')].find(e => e.textContent === 'Bosses'); h.scrollIntoView(); }); await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/book-bosses.png') });
  console.log(JSON.stringify(r)); console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
