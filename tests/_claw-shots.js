// Frames of the Spirit Wolves ult (claw marks) in flight. usage: node tests/_claw-shots.js [floor]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const floor = +(process.argv[2] || 3);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Star'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(f => window.__pp.dun.startDungeon(f, 11), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  // every monster here has been met before, so no "new monster" banners cover the shots
  await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg; P.st.dun.seen = P.st.dun.seen || {}; D.mons.forEach(m => { P.st.dun.seen[m.type] = 1; }); });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(1800);
  await page.evaluate(() => {
    const P = window.__pp, D = P.arc.game._dbg, me = D.me, pool = P.STAR_POOLS[4].ult.wolves;
    let i = 0; for (const m of D.mons) { if (m.boss || m.dead) continue; m.hp = 1e7; m.maxhp = 1e7;
      if (i < 7) { let ok = false; for (let k = 0; k < 40 && !ok; k++) { const aa = i * 0.9 + k * 0.37, rr = 2.6 + (i % 3) * 1.3 + k * 0.05, x = me.x + Math.cos(aa) * rr, y = me.y + Math.sin(aa) * rr; if (D.walkAt(x, y) && D.walkAt(x + 0.4, y) && D.walkAt(x - 0.4, y) && D.walkAt(x, y + 0.4) && D.walkAt(x, y - 0.4)) { m.x = x; m.y = y; ok = true; } } if (!ok) { m.x = me.x + 1; m.y = me.y; } }
      else { m.x = me.x + 60; m.y = me.y; m.dead = true; }
      m.freeze = 0; m.stun = 0; m.falling = null; m.under = false; m.aggro = true; i++; }
    me.hp = D.ST.hp; me.mp = 999; D.g.cdU = 0; D.g.intro = 0; D.g.bossIntro = 0;
    const ab = { slot: 'ult', own: true, star: 4, key: 'y_wolves', name: pool.name, glyph: pool.glyph, el: 'fire', mult: 1.2, cost: 0, cd: 0, desc: pool.desc, tier: 1 };
    D.setKit('ult', ab); D.useUlt(); me.mp = 0; D.g.cdU = 99; D.g.taps = 9;
    // the game loop is held from here and stepped by hand, so each shot is at exactly its time
    const G = P.arc.game; window.__hold = G.update; G.update = () => {};
  });
  const times = (process.env.TIMES || '150,400,750,1200,1900,2900').split(',').map(Number);
  let last = 0; const files = [];
  for (const t of times) { await page.evaluate(n => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < n; i++) { window.__hold(1 / 60); D.me.hp = D.ST.hp; D.me.mp = 0; } }, Math.round((t - last) / 1000 * 60)); last = t; await page.waitForTimeout(120); const f = path.resolve(__dirname, `../shots/claw-${t}.png`); await page.screenshot({ path: f }); files.push(f); }
  const info = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fx: D.STAR.fx.map(f => f.kind).join(','), hurt: D.mons.filter(m => !m.dead && m.hp < 1e7).length }; });
  console.log(JSON.stringify(info));
  console.log(files.join('\n'));
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
