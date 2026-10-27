const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); const st = P.st; st.dlv = 40; st.unlockAll = true; st.energy = 100; st.dun.best = 120; st.dun.god = true; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(10, 7); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss && D.g.boss.act !== 'enter'; }, null, { timeout: 40000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg; A.paused = true; const m = D.g.boss; const before = { hp: m.hp, act: m.act, under: m.under, dead: m.dead };
    m.hp = 1; const dealt = D.hitMon(m, 50, {}); const after = { hp: m.hp, dead: m.dead, won: D.g.won };
    const log = []; for (let i = 0; i < 60 * 2; i++) { G.update(1 / 60); if (i % 20 === 0) log.push([+D.g.t.toFixed(2), D.picks.length, D.picks.filter(p => p.kind === 'acc').length, D.g.slowT, D.g.hitStop]); }
    return { before, dealt, after, log };
  });
  console.log(JSON.stringify(r)); console.log('errors', errors);
  await browser.close();
})();
