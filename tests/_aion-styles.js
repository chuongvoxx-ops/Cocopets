// the same frozen moment of the floor-40 fight, painted in both styles
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 80; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(40, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  const shots = (process.env.AT || '7,12').split(',').map(Number); let tPrev = 0;
  for (const [n, at] of shots.entries()) {
    await page.waitForTimeout((at - tPrev) * 1000); tPrev = at;
    if (process.env.HPF && n === 1) await page.evaluate(h => { const m = window.__pp.arc.game._dbg.g.boss; if (m) m.hp = m.maxhp * h; }, +process.env.HPF);
    for (const st of ['real', 'toon']) {
      await page.evaluate(st => { const D = window.__pp.arc.game._dbg; D.FD.FX.mem.style = st; D.g.stopT = 0.6; }, st);
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.resolve(__dirname, `../shots/aion-${n}-${st}.png`) });
    }
    await page.evaluate(() => { window.__pp.arc.game._dbg.FD.FX.mem.style = null; });
  }
  const info = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.g.boss; return { hp: m && Math.round(m.hp), max: m && Math.round(m.maxhp), act: m && m.act, ph: m && m.phase, casts: (D.FD.FX.mem.casts || []).map(c => c.kind) }; });
  console.log(JSON.stringify(info)); console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
