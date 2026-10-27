// One frame of a normal floor, the same in any build (the dice seeded, the game held still and stepped by hand, the pet
// walking a fixed little loop), photographed. usage: node tests/_floor-shot.js floor [frames]   env: HTML, TAG
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 22), NF = +(process.argv[3] || 150), tag = process.env.TAG || 'now';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 2468);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 120; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => { window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, fl);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  await page.evaluate(NF => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, c = document.getElementById('arcCanvas').getContext('2d'); const x0 = me.x, y0 = me.y;
    for (let i = 0; i < NF; i++) { const a = i * 0.04; me.x = x0 + Math.sin(a) * 1.5; me.y = y0 + (1 - Math.cos(a)) * 0.8; window.__run(1 / 60); me.hp = D.ST.hp; c.save(); G.draw(c); c.restore(); } }, NF);
  await page.waitForTimeout(50);
  await page.screenshot({ path: path.resolve(__dirname, `../shots/floor-${tag}-${fl}.png`) });
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
