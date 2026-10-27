const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.best = 120; P.anima.animaRecognise(); P.anima.equipAnima('ophiuchus'); P.st.animas.have.ophiuchus = 3; P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 60; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(13, 5); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me; const L = D.mons.filter(m => !m.dead && !m.boss); return { n: L.length, d: L.map(m => Math.round(Math.hypot(m.x - me.x, m.y - me.y))).sort((a, b) => a - b).slice(0, 12), under: L.filter(m => m.under).length, sleep: L.filter(m => m.act === 'sleep').length }; });
  console.log(JSON.stringify(r));
  const r2 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me; const L = D.mons.filter(m => !m.dead && !m.boss).slice(0, 7); return L.map((m, i) => { const p = D.X.walkPoint(me.x + Math.cos(i) * (2.5 + i * 0.4), me.y + Math.sin(i) * (2 + i * 0.3), m); return [Math.round(p.x - me.x), Math.round(p.y - me.y)]; }); });
  console.log('walk', JSON.stringify(r2));
  console.log('errors', errors);
  await browser.close();
})();
