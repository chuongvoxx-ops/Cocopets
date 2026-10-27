// The summon gauge in real play: hits fill it, the button summons once per floor, the cinematic freezes the fight.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 2; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const rec = await page.evaluate(() => { const P = window.__pp; const got = P.st.animas; return { have: Object.keys(got.have), eq: got.eq }; });
  console.log('recognised', JSON.stringify(rec));
  await page.evaluate(() => window.__pp.dun.startDungeon(2, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(500);
  const k0 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { kit: !!D.AN.kit, g: D.AN.S.gauge }; });
  console.log('kit', JSON.stringify(k0));
  // tapping early does nothing but tell you the gauge
  await page.touchscreen.tap(58, 844 - 272);
  await page.waitForTimeout(200);
  // take some hits
  for (let i = 0; i < 6; i++) { await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.inv = 0; D.X.hurtPet(D.ST.hp * 0.08, null); }); await page.waitForTimeout(120); }
  const g1 = await page.evaluate(() => window.__pp.arc.game._dbg.AN.S.gauge);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/ang-half.png') });
  for (let i = 0; i < 6 && (await page.evaluate(() => window.__pp.arc.game._dbg.AN.S.gauge)) < 1; i++) { await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.inv = 0; D.X.hurtPet(D.ST.hp * 0.08, null); }); await page.waitForTimeout(120); }
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/ang-full.png') });
  const g2 = await page.evaluate(() => window.__pp.arc.game._dbg.AN.S.gauge);
  // bring a monster close and watch it freeze
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me; const m = D.mons.find(m => !m.dead && !m.boss); const p = D.X.walkPoint(me.x + 2, me.y, m); m.x = p.x; m.y = p.y; m.aggro = true; window.__m = m; });
  await page.touchscreen.tap(58, 844 - 272);
  await page.waitForTimeout(150);
  const c1 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { cine: !!D.AN.S.cine, cineT: D.g.cineT, mx: window.__m.x, used: D.AN.S.used }; });
  await page.waitForTimeout(900);
  const c2 = await page.evaluate(() => ({ mx: window.__m.x }));
  await page.waitForTimeout(2000);
  const c3 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { cine: !!D.AN.S.cine, list: D.AN.S.list.map(a => a.id + ':' + a.st) }; });
  await page.touchscreen.tap(58, 844 - 272);
  await page.waitForTimeout(16000);
  const c4 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { list: D.AN.S.list.length, used: D.AN.S.used, theme: !!D.AN.S.theme }; });
  await page.screenshot({ path: path.resolve(__dirname, '../shots/ang-after.png') });
  console.log(JSON.stringify({ g1, g2, c1, c2, c3, c4 }));
  console.log('errors', errors.length, errors.slice(0, 4));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
