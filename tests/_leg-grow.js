// A Legendary in the room at each stage, side by side at the same zoom: how it grows. usage: node tests/_leg-grow.js [seed]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const seed = +(process.argv[2] || 11);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => window.__pp.quickStart('Bot'));
  const shots = [];
  for (const sg of [1, 2, 3, 4, 5, 6, 7]) {
    await page.evaluate(([seed, sg]) => {
      const P = window.__pp, g = P.summonGenome(6, P.mulberry32(seed)), line = P.evolveLine(g.form, sg, P.mulberry32(seed * 7)), p = P.newPetFields('Lumi', g);
      p.forms = line; p.stage = sg; for (let n = 2; n <= sg; n++) p.paid[n] = true; p.rarity = 5; P.st.others = [p]; P.switchPet(0); P.st.others = []; P.buildCompanions();
    }, [seed, sg]);
    await page.waitForTimeout(1600);
    const box = await page.evaluate(() => { const r = document.querySelector('#pet').getBoundingClientRect(); return { x: Math.max(0, r.x + r.width / 2 - 120), y: Math.max(0, r.bottom - 230), width: 240, height: 260 }; });
    const f = path.resolve(__dirname, `../shots/leggrow-${sg}.png`); await page.screenshot({ path: f, clip: box }); shots.push(f);
  }
  console.log('errors', errors);
  await browser.close();
})();
