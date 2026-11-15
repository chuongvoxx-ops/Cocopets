// Bomb King: a smoke run: start the test rift's boss stage, watch it wake, report the numbers, a few screenshots.
const { openCal } = require('./_cal-b-lib');
(async () => {
  const T = await openCal({ gl: !!process.env.GL }); const { page, errors, shot, start, ev } = T;
  await start();
  let r = await ev(`return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, hp: b && Math.round(b.maxhp), dmg: b && +b.dmg.toFixed(1), petHp: D.ST.hp, petAtk: D.ST.atk, lvl: D.ST.L, R: D.FD && D.FD.S.C.R, n: D.F.n, hpMul: D.F.hpMul, dmgMul: D.F.dmgMul, kit: D.KITR && D.KITR.normal && D.KITR.normal.key };`);
  console.log('fight', JSON.stringify(r));
  await ev(`const go = clock(1.2); while (go()) await frame();`); await shot('smoke-intro');
  await ev(`const go = clock(4); while (go()) await frame();`); await shot('smoke-awake');
  r = await ev(`const go = clock(14); const acts = new Set(); while (go()) { await frame(); acts.add(b.act); me.hp = D.ST.hp; } return { acts: [...acts], stat: M.stat, zc: +M.zc.toFixed(2), gl: DEF.MODEL.__dbg.glStats };`);
  console.log('acts', JSON.stringify(r));
  await shot('smoke-later');
  console.log(errors.length ? 'ERRORS\n' + errors.join('\n') : 'no page errors');
  await T.browser.close();
})();
