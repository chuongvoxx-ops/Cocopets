// probe: are the claws' drawn angles along their motion? prints per claw: motion angle, rot, tilt
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Star'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 11));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(1500);
  await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, pool = P.STAR_POOLS[4].ult.wolves; for (const m of D.mons) { m.dead = true; m.x += 80; }
    D.me.mp = 999; D.g.cdU = 0; D.setKit('ult', { slot: 'ult', own: true, star: 4, key: 'y_wolves', name: pool.name, glyph: pool.glyph, el: 'fire', mult: 1.2, cost: 0, cd: 0, desc: pool.desc, tier: 1 }); D.useUlt(); });
  for (let s = 0; s < 4; s++) { await page.waitForTimeout(250);
    const r = await page.evaluate(() => window.__pp.arc.game._dbg.STAR.fx.filter(f => f.kind === 'claw').map(f => { const a = f.trail[0], b = f.trail[2] || a; const mv = Math.atan2(a[1] - b[1], a[0] - b[0]); return [mv.toFixed(2), (+f.rot).toFixed(2), f.tilt.toFixed(2)].join(' '); }));
    console.log(r.join(' | ')); }
  await browser.close();
})();
