const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  let first = null; page.on('pageerror', e => { if (!first) first = e.message; });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([n, seed]) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(n, seed); }, [25, 2525]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(500);
  const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const out = []; for (let i = 0; i < 4; i++) { const k = D.RULES.keys[i]; D.me.x = k.x; D.me.y = k.y; const t0 = performance.now(); while (performance.now() - t0 < 700) await new Promise(r => requestAnimationFrame(r)); const bad = D.picks.filter(p => !isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z)); const badM = D.mons.filter(m => !isFinite(m.x) || !isFinite(m.y)); out.push([k.kind.id, k.st, bad.length, badM.length, bad[0] && JSON.stringify(bad[0]), badM[0] && badM[0].type]); if (k.kind.id === 'keeper') { D.hitMon(k.keeper, 1e12, {}); const t1 = performance.now(); while (performance.now() - t1 < 600) await new Promise(r => requestAnimationFrame(r)); const bad2 = D.picks.filter(p => !isFinite(p.x) || !isFinite(p.y)); out.push(['after keeper', bad2.length, bad2[0] && JSON.stringify(bad2[0])]); } } return out; });
  console.log(JSON.stringify(r, null, 1)); console.log('first error', first);
  await browser.close();
})();
