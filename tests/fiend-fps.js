// Measures real frame pacing on a Super Fiend floor. usage: node tests/fiend-fps.js [floor] [hpf]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floor = +(process.argv[2] || 10), hpf = +(process.argv[3] || 0);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 60; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 0; }); await page.waitForTimeout(6000);
  if (hpf) await page.evaluate(h => { const m = window.__pp.arc.game._dbg.g.boss; if (m) m.hp = m.maxhp * h; }, hpf);
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(3000);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const now = performance.now(), t = D.g.t; const out = window.__fp ? { wall: +((now - window.__fp.now) / 1000).toFixed(2), game: +(t - window.__fp.t).toFixed(2) } : null; window.__fp = { now, t }; return { out, act: D.g.boss && D.g.boss.act, ph: D.FD.S.phase, parts: D.parts.length, eshots: D.eshots.length, mons: D.mons.length, tele: D.FD.S.tele.length, hz: D.FD.S.hz.length }; });
    console.log(JSON.stringify(r));
  }
  const prof = await page.evaluate(() => { const A = window.__pp.arc, G = A.game, c = document.querySelector('canvas').getContext('2d'); const time = (f, n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) f(); return +((performance.now() - t0) / n).toFixed(2); }; return { upd: time(() => G.update(1 / 60), 20), draw: time(() => G.draw(c), 10) }; });
  console.log(JSON.stringify(prof)); console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
