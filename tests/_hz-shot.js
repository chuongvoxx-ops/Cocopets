// The plain hazards a fiend leaves on the floor (a line and a cone with no painter of their own), laid beside the pet in a
// Super Fiend fight and photographed. usage: node tests/_hz-shot.js [floor]   env: HTML, TAG
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 40), tag = process.env.TAG || 'now';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 99);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  await page.evaluate(() => {
    const D = window.__pp.arc.game._dbg, G = window.__pp.arc.game, c = document.getElementById('arcCanvas').getContext('2d');
    for (let i = 0; i < 1200 && !D.g.boss; i++) window.__run(1 / 60);
    const FD = D.FD, FX = FD.FX, M = FX.mem, me = D.me; for (let i = 0; i < 240; i++) { window.__run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; }
    FD.S.hz.length = 0; M.job = null; M.gap = 99;
    FX.hz({ kind: 'testLine', shape: 'line', x: me.x - 4, y: me.y - 2.5, a: 0.25, len: 8, w: 1.9, life: 30, dps: 0, col: '#8FE0FF' });
    FX.hz({ kind: 'testCone', shape: 'cone', x: me.x + 3.5, y: me.y + 1.5, a: -2.2, len: 6, spread: 0.3, life: 30, dps: 0, col: '#FFD08A' });
    for (let i = 0; i < 40; i++) { window.__run(1 / 60); M.gap = 99; me.hp = D.ST.hp; c.save(); G.draw(c); c.restore(); }
  });
  await page.waitForTimeout(80);
  await page.screenshot({ path: path.resolve(__dirname, `../shots/hz-${tag}-${fl}.png`) });
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
