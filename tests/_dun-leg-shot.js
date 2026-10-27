// A Celestial six-star on a Tower floor: a few frames of it floating over its magic circle. usage: node tests/_dun-leg-shot.js [floor] [seed]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 8), seed = +(process.argv[3] || 23);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([fl, seed]) => {
    const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60;
    const g = P.summonGenome(6, P.mulberry32(seed)), line = P.evolveLine(g.form, 7, P.mulberry32(seed * 7)), p = P.newPetFields('Lumi', g); p.forms = line; p.stage = 7; for (let n = 2; n <= 7; n++) p.paid[n] = true; p.rarity = 5; p.dlv = 40;
    P.st.others = [p]; P.switchPet(0); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(fl, 1000 + fl);
  }, [fl, seed]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { await page.screenshot({ path: path.resolve(__dirname, `../shots/dunleg-${i}.png`), clip: { x: 95, y: 300, width: 200, height: 260 } }); await page.waitForTimeout(700); }
  await page.screenshot({ path: path.resolve(__dirname, '../shots/dunleg-full.png') });
  console.log('errors', errors);
  await browser.close();
})();
