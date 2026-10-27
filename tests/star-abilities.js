// Every four-, five- and six-star Strong and Ultimate fires in the Tower without errors; one screenshot each (SHOTS=1).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const kits = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Star'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30;
    // how often do pets land in each star tier, and do their kits come from the pools?
    const tally = { 3: 0, 4: 0, 5: 0, 6: 0 }, sample = [];
    for (let i = 0; i < 300; i++) { const gn = P.makeGenome(P.mulberry32(i * 31 + 7)), f = P.newPetFields('P' + i, gn); const k = P.dun.petKit(f).kit; tally[k.strong.star || 3]++; if (k.strong.star && sample.length < 4) sample.push([k.strong.star, k.strong.key, k.ult.key]); }
    P.openMap(); P.dun.setMapTab('dungeon', true);
    return { tally, sample };
  });
  console.log('tiers', JSON.stringify(kits));
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 11));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2600);
  const pools = await page.evaluate(() => { const P = window.__pp.STAR_POOLS; return { s4: Object.keys(P[4].strong), u4: Object.keys(P[4].ult), s5: Object.keys(P[5].strong), u5: Object.keys(P[5].ult), s6: Object.keys(P[6].strong), u6: Object.keys(P[6].ult) }; });
  const results = [];
  const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const fire = async (slot, key, star) => {
    if (ONLY && !ONLY.includes(key)) return;
    const before = errors.length;
    const r = await page.evaluate(([slot, key, star]) => {
      const P = window.__pp, D = P.arc.game._dbg, me = D.me, pool = P.STAR_POOLS[star][slot === 'ult' ? 'ult' : 'strong'][key];
      // a ring of sturdy monsters around the pet, plus one in front
      let i = 0; for (const m of D.mons) { if (m.boss || m.dead) continue; m.hp = 1e7; m.maxhp = 1e7; if (i < 6) { let ok = false; for (let k = 0; k < 24 && !ok; k++) { const aa = i + k * 0.7, rr = 1.6 + (i % 3) * 0.7 + k * 0.1, x = me.x + Math.cos(aa) * rr, y = me.y + Math.sin(aa) * rr; if (D.walkAt(x, y) && D.walkAt(x + 0.4, y) && D.walkAt(x - 0.4, y) && D.walkAt(x, y + 0.4) && D.walkAt(x, y - 0.4)) { m.x = x; m.y = y; ok = true; } } if (!ok) { m.x = me.x; m.y = me.y; } } else { m.x = me.x + 60; m.y = me.y; m.dead = true; } m.freeze = 0; m.stun = 0; m.falling = null; m.under = false; m.still = true; m.mv = 1; i++; }
      me.hp = D.ST.hp;
      me.mp = 999; D.g.cdS = 0; D.g.cdU = 0; D.g.swapCd = 0; me.dead = false; D.g.intro = 0; D.g.bossIntro = 0;
      const ab = { slot, own: true, star, key: (slot === 'ult' ? 'y_' : 'x_') + key, name: pool.name, glyph: pool.glyph, el: 'fire', mult: 1.2, cost: 0, cd: 0, desc: pool.desc, tier: 1 };
      D.setKit(slot === 'ult' ? 'ult' : 'strong', ab);
      const live = D.mons.filter(m => !m.dead).length, hp0 = D.mons.filter(m => !m.dead).reduce((a, m) => a + m.hp, 0);
      if (slot === 'ult') D.useUlt(); else D.useStrong('strong');
      return { live, hp0 };
    }, [slot, key, star]);
    await page.waitForTimeout(+(process.env.SHOT_MS || 650));
    if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/star-${slot}-${key}.png`) });
    await page.waitForTimeout(2600);
    const after = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { hp1: D.mons.filter(m => !m.dead).reduce((a, m) => a + m.hp, 0), fx: D.STAR.fx.length, dead: D.mons.filter(m => m.dead).length, bad: D.mons.filter(m => !m.dead && !(m.hp >= 0)).map(m => m.type + ':' + m.hp + ' fz=' + m.freeze + ' ch=' + m.chill) }; });
    if (after.bad.length) console.log('bad hp', after.bad);
    const dmg = r.hp0 - after.hp1 + (after.dead ? 0 : 0);
    results.push({ slot, key, star, dmg: Math.round(dmg), dead: after.dead, live: r.live, errs: errors.length - before });
  };
  for (const k of pools.s4) await fire('strong', k, 4);
  for (const k of pools.u4) await fire('ult', k, 4);
  for (const k of pools.s5) await fire('strong', k, 5);
  for (const k of pools.u5) await fire('ult', k, 5);
  for (const k of pools.s6) await fire('strong', k, 6);
  for (const k of pools.u6) await fire('ult', k, 6);
  // give long ults time to run down, then make sure nothing is left stuck
  await page.waitForTimeout(6000);
  const tail = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fx: D.STAR.fx.length, state: window.__pp.arc.state, petHP: Math.round(D.me.hp), collapse: !!D.g.collapse, eclipse: D.g.eclipseT }; });
  for (const r of results) console.log(`${r.star}★ ${r.slot.padEnd(6)} ${r.key.padEnd(12)} dmg ${String(r.dmg).padStart(6)} live ${r.live} dead ${r.dead} ${r.errs ? 'ERRORS ' + r.errs : ''}`);
  console.log('tail', JSON.stringify(tail));
  const zero = results.filter(r => r.dmg <= 0).map(r => r.key);
  console.log('no damage:', zero.join(', ') || 'none');
  console.log('errors:', errors.length); errors.slice(0, 12).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
