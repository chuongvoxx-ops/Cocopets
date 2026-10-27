// A Super Fiend fight photographed every so often while the pet fights it (the bot tapping it and using its abilities),
// to look for effects with hard edges. usage: node tests/_fiend-shots.js floor [shots] [gap frames]   env: HTML, TAG
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 100), n = +(process.argv[3] || 8), gap = +(process.argv[4] || 40), tag = process.env.TAG || 'now';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 4242);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 120; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => { window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, fl);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 1500 && !(D.g.boss && D.FD && D.FD.S.started); i++) window.__run(1 / 60); for (let i = 0; i < 240; i++) window.__run(1 / 60); });
  for (let k = 0; k < n; k++) {
    await page.evaluate(gap => {
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, g = D.g, me = D.me, run = window.__run, c = document.getElementById('arcCanvas').getContext('2d');
      const W = A.W, H = A.H, m = g.boss; let lastTap = window.__lt || -9;
      for (let i = 0; i < gap; i++) {
        if (m && !m.dead) { const X = Math.max(10, Math.min(W - 10, (m.x - me.x) * 40 * g.zoom + W / 2)), Y = Math.max(10, Math.min(H - 10, (m.y - me.y) * 40 * g.zoom + H / 2)); if (g.t - lastTap > 0.3) { lastTap = g.t; G.down(X, Y, 77); G.up(X, Y, 77); }
          ['strong', 'strong2', 'strong3'].forEach((k, j) => { const ab = D.KIT[k], cd = g[['cdS', 'cdS2', 'cdS3'][j]]; if (ab && me.mp > ab.cost && cd <= 0) D.useStrong(k); }); if (me.mp >= D.KIT.ult.cost && g.cdU <= 0) D.useUlt(); }
        me.hp = D.ST.hp; run(1 / 60);
      }
      window.__lt = lastTap; c.save(); G.draw(c); c.restore();
    }, gap);
    await page.screenshot({ path: path.resolve(__dirname, `../shots/fs-${tag}-${fl}-${k}.png`) });
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
