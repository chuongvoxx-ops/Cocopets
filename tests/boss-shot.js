// an in-game screenshot of a boss fight. usage: node tests/boss-shot.js [id] [floor]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'dragon', floor = +(process.argv[3] || 3);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(400);
  await page.evaluate(() => { const P = window.__pp; if (!P.st) P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.st.dlv = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(f => window.__pp.dun.startDungeon(f, 99), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(id => { const D = window.__pp.arc.game._dbg; D.setBoss(id); window.__pp.beginPlay(); D.g.intro = 0.3; D.SKIP.fog = true; }, id);
  await page.waitForTimeout(500);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.mons.slice().forEach(m => { if (!m.boss || m.brute) D.hitMon(m, 1e9); }); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; if (!D.g.boss) D.wakeBoss(); });
  await page.waitForTimeout(3200);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; if (b) { const p = D.X.walkPoint(b.x + 2.5, b.y + 1.5, { r: 0.3, mv: 0 }); D.me.x = p.x; D.me.y = p.y; } });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.resolve(__dirname, `../shots/boss-${id}.png`) });
  console.log('saved', id, 'errors', errors.length);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
