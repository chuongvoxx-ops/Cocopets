// Bahamut photographed in its fight at each of its four stages, the pet a few steps in front of it so the colossus
// fills the view as it does when you face it. usage: node tests/_bh-shots.js [stages e.g. 1,2,3,4]   env: HTML, TAG
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const stages = (process.argv[2] || '1,2,3,4').split(',').map(Number), tag = process.env.TAG || 'now';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 777);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const lv of stages) {
    await page.evaluate(cap => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(120, 7); }, +(process.env.CAP || 0));
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    await page.evaluate(lv => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, c = document.getElementById('arcCanvas').getContext('2d');
      for (let i = 0; i < 1200 && !D.g.boss; i++) window.__run(1 / 60);
      const FD = D.FD, M = FD.FX.mem, m = D.g.boss, me = D.me, step = (n, draw) => { for (let i = 0; i < n; i++) { window.__run(1 / 60); M.gap = 99; me.hp = D.ST.hp; me.x = m.x + 0.5; me.y = m.y + 6.5; if (draw) { c.save(); G.draw(c); c.restore(); } } };
      step(300, false);
      const cuts = FD.S.cuts || [1, 0.75, 0.5, 0.25]; if (lv > 1) { m.hp = m.maxhp * ([1, 0.74, 0.49, 0.24][lv - 1]); step(600, false); }
      M.job = null; FD.S.hz.length = 0; step(150, true);
    }, lv);
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.resolve(__dirname, `../shots/bh-${tag}-${lv}.png`) });
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__run; window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
