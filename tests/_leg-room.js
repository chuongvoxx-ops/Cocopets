// A Legendary as the pet you play with, at a few stages: frames of its room a moment apart (lights circling, wings
// beating), close on the pet. usage: node tests/_leg-room.js [seed] [stages]   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const seed = +(process.argv[2] || 11), stages = (process.argv[3] || '3,7').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => window.__pp.quickStart('Bot'));
  for (const sg of stages) {
    const info = await page.evaluate(([seed, sg]) => {
      const P = window.__pp, g = P.summonGenome(6, P.mulberry32(seed)), line = P.evolveLine(g.form, sg, P.mulberry32(seed * 7)), p = P.newPetFields('Lumi', g);
      p.forms = line; p.stage = sg; for (let n = 2; n <= sg; n++) p.paid[n] = true; p.rarity = 5;
      P.st.others = [p]; P.switchPet(0); return { lights: !!document.querySelector('#pet .p-lights-f'), stage: P.st.stage };
    }, [seed, sg]);
    await page.waitForTimeout(900);
    const box = await page.evaluate(() => { const r = document.querySelector("#pet .pet-rig svg").getBoundingClientRect(), sh = document.querySelector("#pet .pet-shadow").getBoundingClientRect(); return { x: Math.max(0, r.x - 30), y: Math.max(0, r.y - 30), width: Math.min(390, r.width + 60), height: Math.max(r.bottom, sh.bottom) - r.y + 60 }; });
    for (let i = 0; i < +(process.env.N || 3); i++) { await page.screenshot({ path: path.resolve(__dirname, `../shots/legroom-${sg}-${i}.png`), clip: box }); await page.waitForTimeout(+(process.env.GAP || 650)); }
    const L = await page.evaluate(() => [...document.querySelectorAll('#pet .p-wp')].map(e => (e.getAttribute('transform') || '').slice(0, 14)).concat([...document.querySelectorAll('.pet.comp .p-wp')].slice(0, 2).map(e => 'comp ' + (e.getAttribute('transform') || '').slice(0, 14))));
    console.log('stage', sg, JSON.stringify(info), L.join(' | '));
  }
  console.log('errors', errors);
  await browser.close();
})();
