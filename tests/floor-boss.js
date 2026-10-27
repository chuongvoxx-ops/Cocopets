// Floor bosses (not the Super Fiends): once every monster is down the boss drops in beside the pet, on an act's
// finale floor too, and the camera keeps the pet on screen; its health is 4x and its blows 1.3x what they were.
// usage: node tests/floor-boss.js   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 60; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const out = {};
  // (32 lies in the keys band: its keys are held first; 48 in the four-guardian band: the first of the four is measured)
  for (const n of [8, 16, 32, 48]) {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 11), n);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); });
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    out[n] = await page.evaluate(() => {
      const D = window.__pp.arc.game._dbg, me = D.me, run = window.__run;
      for (let i = 0; i < 120; i++) run(1 / 60);
      // every monster down at once, wherever the pet is
      D.mons.forEach(m => { if (!m.dead) { m.hp = 0; m.dead = true; } }); if (D.g.gremlin) D.g.gremlin.dead = true; if (D.RULES) D.RULES.keys.forEach(k => { k.st = 'done'; });
      for (let i = 0; i < 60 * 6 && !(D.g.boss && D.g.boss.act !== 'sleep' && D.g.boss.hp > 0 && D.g.bossIntro <= 0); i++) { run(1 / 60); me.hp = D.ST.hp; }
      const b = D.g.boss; if (!b) return { none: true };
      let far = 0; for (let i = 0; i < 120; i++) { run(1 / 60); me.hp = D.ST.hp; const c = D.cam; if (c) far = Math.max(far, Math.hypot(c.x - me.x, c.y - me.y)); }
      return { act: !b.mini, dist: +Math.hypot(b.x - me.x, b.y - me.y).toFixed(1), awake: b.act !== 'sleep', maxhp: Math.round(b.maxhp), dmg: +b.dmg.toFixed(1), camFar: +far.toFixed(1) };
    });
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__run; window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
    console.log('  floor', n, JSON.stringify(out[n]));
  }
  ok(Object.values(out).every(r => !r.none && r.awake && r.dist < 7), 'every floor boss drops in beside the pet and comes for it (act bosses too)');
  ok(Object.values(out).some(r => r.act), 'an act boss floor is among them');
  ok(Object.values(out).every(r => r.camFar < 0 || r.camFar <= 4.2), `the camera stays on the pet (at most ${Math.max(...Object.values(out).map(r => r.camFar))} tiles off)`);
  if (process.env.BASE) { const B = JSON.parse(process.env.BASE); for (const n in B) { ok(Math.abs(out[n].maxhp / B[n].maxhp - 4) < 0.05 && Math.abs(out[n].dmg / B[n].dmg - 1.3) < 0.02, `floor ${n}: health x${(out[n].maxhp / B[n].maxhp).toFixed(2)}, blows x${(out[n].dmg / B[n].dmg).toFixed(2)}`); } }
  console.log('JSON ' + JSON.stringify(out));
  console.log('errors', errors.length, errors.slice(0, 3)); ok(!errors.length, 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
