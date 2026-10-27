// The Three Statues, played by the hook: wake each, masons mend it, the mob is capped, smash it; 200/300/400 poured
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 45, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, exitStage } = T;
  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.sepulchre.stages.findIndex(s => s.name === 'The Three Statues'));
  await start('sepulchre', idx); await run(2.5);
  let r = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { n: mod.statues.length, hp: mod.statues.map(m => m.maxhp), atk: window.__pp.arc.game._dbg.ST.atk }; });
  console.log(JSON.stringify(r)); ok(r.n === 3, 'three statues');
  for (let i = 0; i < 3; i++) {
    const w = await page.evaluate(i => { const D = window.__pp.arc.game._dbg; const o = D.RIFT.objs.filter(o => o.kind === 'wake')[i]; return [o.x, o.y]; }, i);
    await page.evaluate(async w => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < 1500) { await new Promise(r => requestAnimationFrame(r)); D.me.x = w[0]; D.me.y = w[1] + 0.3; D.me.vx = D.me.vy = 0; } }, w);
    r = await page.evaluate(() => window.__pp.arc.game._dbg.RIFT.self.mod.S.cur); ok(r === i, `statue ${i + 1} wakes`);
    // let the mob pour in and the masons mend a damaged statue; watch the alive count and frame time
    const m1 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, m = mod.statues[mod.S.cur]; m.hp = m.maxhp * 0.5; let maxAlive = 0, frames = 0, worst = 0, last = performance.now(); const t0 = performance.now(); while (performance.now() - t0 < 7000) { await new Promise(r => requestAnimationFrame(r)); const now = performance.now(); worst = Math.max(worst, now - last); last = now; frames++; D.me.hp = D.ST.hp; maxAlive = Math.max(maxAlive, D.mons.filter(q => !q.dead && !q.still).length); } return { maxAlive, fps: frames / 7, worst: Math.round(worst), hp: m.hp / m.maxhp, menders: mod.S.mob.filter(q => q.mending).length }; });
    console.log('  mob', JSON.stringify(m1)); ok(m1.maxAlive <= 46, `the mob is capped (${m1.maxAlive} alive at most)`); ok(m1.hp > 0.5, `the masons mend the statue (${(m1.hp * 100).toFixed(0)}%)`);
    if (i === 0) await shot('siege-mob');
    // fight it out: masons down, statue struck by normal blows, until it falls
    const fin = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, m = mod.statues[mod.S.cur], N = [200, 300, 400][mod.S.cur]; const t0 = performance.now(); while (performance.now() - t0 < 60000 && !m.dead) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; for (const q of mod.S.mob) if (!q.dead) D.hitMon(q, 1e9, { flat: true }); if (mod.S.poured >= N) D.hitMon(m, m.maxhp * 0.05, {}); } return { dead: m.dead, poured: mod.S.poured, N, broken: mod.S.broken }; });
    console.log('  fin', JSON.stringify(fin)); ok(fin.dead && fin.poured === fin.N, `statue ${i + 1} broken after all ${fin.N} poured in`);
    await run(1);
  }
  if (true) await shot('siege-done');
  r = await page.evaluate(() => ({ done: window.__pp.arc.game._dbg.RIFT.done, left: window.__pp.arc.game._dbg.mons.filter(m => !m.dead).length })); ok(r.done && r.left === 0, 'all three broken: done, the mob gone');
  await exitStage(); ok(true, 'exit');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
