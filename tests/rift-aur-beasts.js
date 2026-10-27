// the summit's beasts in the third dungeon: yetis leap and throw, ice golems slam and shrug off blows until cracked
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, shot, start, run } = T;
  await start('aurora', 7); await run(1.5);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { yeti: D.mons.filter(m => m.type === 'yeti').length, golem: D.mons.filter(m => m.type === 'icegolem').length }; });
  console.log('  ', JSON.stringify(r)); ok(r.yeti >= 5 && r.golem >= 5, 'the third dungeon is full of yetis and ice golems');
  // a yeti: watch it leap and throw
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, y = D.mons.find(m => m.type === 'yeti'), seen = new Set(); for (const m of D.mons) if (m !== y && !m.boss) { m.freeze = 99; } D.me.x = y.x + 4; D.me.y = y.y; y.aggro = true; const t0 = performance.now(); while (performance.now() - t0 < 12000 && seen.size < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (y.hop) seen.add('leap'); if (y.mode === 'throw') seen.add('throw'); if (y.hop && y.hop.t > y.hop.wind + 0.2 && !window._shotY) window._shotY = 1; } return [...seen]; });
  ok(r.includes('leap') && r.includes('throw'), 'a yeti leaps onto a shown circle and hurls snowballs: ' + r.join());
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, y = D.mons.find(m => m.type === 'yeti'); D.me.x = y.x + 2.5; D.me.y = y.y + 0.5; }); await run(0.4); await shot('aur-yeti');
  // a golem: half damage until cracked, then a slam
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, g = D.mons.find(m => m.type === 'icegolem'); g.freeze = 0; g.aggro = true; D.me.x = g.x + 1.8; D.me.y = g.y; await new Promise(r => setTimeout(r, 300)); const h0 = g.hp; D.hitMon(g, 100, { flat: true }); const took = h0 - g.hp; D.hitMon(g, g.maxhp * 0.8, { flat: true }); await new Promise(r => setTimeout(r, 200)); const cracked = g.cracked; let slam = false; const t0 = performance.now(); while (performance.now() - t0 < 8000 && !slam) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = g.x + 1.8; D.me.y = g.y; if (g.slamT > 0) slam = true; } return { took, cracked, slam }; });
  console.log('  golem', JSON.stringify(r)); ok(r.took > 30 && r.took < 70 && r.cracked && r.slam, 'an ice golem shrugs off half a blow, cracks open, then winds up its slam');
  await run(0.5); await shot('aur-golem');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
