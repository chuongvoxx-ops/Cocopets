// The Borrowed Beast, played by the hook: each creature baited into its obstacle, then the three growths
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, exitStage } = T;
  await start('sepulchre', 2); await run(2);
  // hold the pet at (px, py) and the creature of a type at (mx, my) (until it acts), for up to secs; resolve when the group breaks
  const bait = (type, px, py, mx, my, gi, secs) => page.evaluate(async ([type, px, py, mx, my, gi, secs]) => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; const t0 = performance.now(); let placed = false;
    while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.x = px; D.me.y = py; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; const m = D.mons.find(q => !q.dead && q.type === type); if (m) { m.aggro = true; if (!placed || (!(m.windT > 0) && !(m.chargeT > 0) && !(m.aimT > 0) && type !== 'tombmole')) { m.x = mx; m.y = my; placed = true; if (type !== 'tombmole' && !(m.dazeT > 0)) m.cd = Math.min(m.cd, 0.2); } } if (mod.groups[gi].broken) return true; }
    return mod.groups[gi].broken; }, [type, px, py, mx, my, gi, secs]);
  const groups = await page.evaluate(() => window.__pp.arc.game._dbg.RIFT.self.mod.groups.map(g => ({ type: g.type, area: g.area, x: g.x, y: g.y })));
  console.log(JSON.stringify(groups));
  const gi = (type, area) => groups.findIndex(g => g.type === type && g.area === area);
  let i = gi('crack', 1), G = groups[i]; ok(await bait('tombram', G.x, G.y + 1.15, G.x, G.y + 4.5, i, 12), 'room 1: the ram charges through the pet into the cracked crystal'); await shot('beast-ram');
  i = gi('blue', 2); G = groups[i]; ok(await bait('tombeye', G.x, G.y + 1.15, G.x, G.y + 4.2, i, 12), 'room 2: the eye\'s beam runs past the pet and melts the blue crystal'); await shot('beast-eye');
  i = gi('plate', 3); G = groups[i]; ok(await bait('tombmole', G.x, G.y + 1.1, G.x, G.y + 3.5, i, 14), 'room 3: the mole erupts beside the plate and heaves it'); await shot('beast-mole');
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.x = 13; D.me.y = 9; }); await run(1.5);
  let r = await page.evaluate(() => ({ court: window.__pp.arc.game._dbg.RIFT.self.mod.S.court, types: window.__pp.arc.game._dbg.mons.filter(m => !m.dead).map(m => m.type).join() })); ok(r.court, 'in the court: all three loose · ' + r.types); await shot('beast-court');
  i = gi('crack', 4); G = groups[i]; ok(await bait('tombram', G.x, G.y + 1.15, G.x, G.y + 4.5, i, 12), 'court: ram into the cracked growth');
  i = gi('blue', 4); G = groups[i]; ok(await bait('tombeye', G.x, G.y + 1.15, G.x, G.y + 4.2, i, 12), 'court: eye into the blue growth');
  i = gi('plate', 4); G = groups[i]; ok(await bait('tombmole', G.x, G.y + 1.1, G.x, G.y + 3.5, i, 14), 'court: mole under the plate');
  await run(2.5); r = await page.evaluate(() => ({ done: window.__pp.arc.game._dbg.RIFT.done, goal: document.getElementById('arcGoal').textContent })); ok(r.done, 'the guardian wakes and steps aside · ' + r.goal); await shot('beast-woke');
  // a creature killed too soon returns from its nest (checked on the eye before the court? here: kill one now that nothing is needed: no respawn)
  await exitStage(); ok(true, 'exit');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
