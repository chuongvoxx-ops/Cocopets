// How long a Tower floor takes to be ready to play (its map, its pictures, the pets' pictures and parts), for a team
// of six-stars or ordinary pets; best of a few. usage: node tests/_load-time.js   env: HTML, LEG=1
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(leg => {
    const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60;
    const mk = sd => { const g = leg ? P.summonGenome(6, P.mulberry32(sd)) : P.summonGenome(4, P.mulberry32(sd)), line = P.evolveLine(g.form, 7, P.mulberry32(sd * 7)), p = P.newPetFields('L' + sd, g); p.forms = line; p.stage = 7; for (let n = 2; n <= 7; n++) p.paid[n] = true; if (leg) p.rarity = 5; p.dlv = 40; return p; };
    P.st.others = [mk(11), mk(23), mk(47)]; P.switchPet(0); P.st.party = P.st.others.map(p => p.uid); P.openMap(); P.dun.setMapTab('dungeon', true);
  }, !!process.env.LEG);
  const ts = [];
  for (let i = 0; i < 4; i++) {
    const t = await page.evaluate(async n => { const P = window.__pp, t0 = performance.now(); P.dun.startDungeon(n, 1000 + n); while (P.arc.state !== 'ready') await new Promise(r => setTimeout(r, 5)); const dt = performance.now() - t0; P.closeArcade(true); return dt; }, 8 + i);
    ts.push(Math.round(t)); await page.waitForTimeout(300);
  }
  console.log('ready in', ts.join(' '), 'ms');
  await browser.close();
})();
