// The ground left by reactions, photographed: a Magma pool and a Mire beside the pet, on a normal floor and in a Super
// Fiend's arena. usage: node tests/_magma-shot.js tag [floors]   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const tag = process.argv[2] || 'now', floors = (process.argv[3] || '3,90').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(n => { window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, fl);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    await page.evaluate(() => {
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, me = D.me, run = window.__run, c = document.getElementById('arcCanvas').getContext('2d');
      D.g.intro = 0; for (let i = 0; i < 90; i++) { me.hp = D.ST.hp; run(1 / 60); }
      D.RX.zones.push({ kind: 'magma', x: me.x + 1.6, y: me.y + 1.2, r: 1.7, life: 5, tick: 0.4, tk: 9, d: 0, col: '#FF6A1E', age: 1 });
      D.RX.zones.push({ kind: 'mire', x: me.x - 1.8, y: me.y + 1.6, r: 1.6, life: 5, tick: 0.4, tk: 9, d: 0, col: '#9A7A4A', age: 1 });
      for (let i = 0; i < 40; i++) { me.hp = D.ST.hp; run(1 / 60); }
      c.save(); G.draw(c); c.restore();
    });
    await page.screenshot({ path: path.resolve(__dirname, `../shots/magma-${tag}-${fl}.png`) });
    console.log(fl, 'shot');
    await page.evaluate(() => { const G = window.__pp.arc.game; if (G && window.__run) G.update = window.__run; window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(200);
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
