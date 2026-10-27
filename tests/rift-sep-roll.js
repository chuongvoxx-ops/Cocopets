// The Rolling Hour, played by the hook: blows do nothing, the roll smashes, GIANT and FIRE, 200 smashed
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 45, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, exitStage } = T;
  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.sepulchre.stages.findIndex(s => s.name === 'The Rolling Hour'));
  await start('sepulchre', idx); await run(3);
  // a normal blow does nothing
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const m = D.mons.find(q => !q.dead); const h0 = m.hp; D.hitMon(m, 1e6, {}); return { roll: D.g.rollOnly, dk: D.g.dodgeK, h0, h1: m.hp, dead: m.dead }; });
  ok(r.roll && r.h1 === r.h0 && !r.dead, 'an ordinary blow passes through: ' + JSON.stringify(r));
  // roll into a crowd: dodge toward it repeatedly
  const roll = secs => page.evaluate(async secs => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; let worst = 0, last = performance.now(), maxAlive = 0; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); const now = performance.now(); worst = Math.max(worst, now - last); last = now; D.me.hp = D.ST.hp; const m = mod.S.mob.filter(q => !q.dead).sort((a, b) => Math.hypot(a.x - D.me.x, a.y - D.me.y) - Math.hypot(b.x - D.me.x, b.y - D.me.y))[0]; maxAlive = Math.max(maxAlive, mod.S.mob.filter(q => !q.dead).length);
      if (m && !D.me.dodge && D.g.dodgeCd <= 0) { const dx = m.x - D.me.x, dy = m.y - D.me.y, d = Math.hypot(dx, dy) || 1; D.me.dodge = { t: 0, dur: 0.3, vx: dx / d * 12.5, vy: dy / d * 12.5, perf: false }; D.g.dodgeCd = 0.85 * D.g.dodgeK; } }
    return { smashed: mod.S.smashed, poured: mod.S.poured, best: mod.S.best, worst: Math.round(worst), maxAlive, done: D.RIFT.done }; }, secs);
  r = await roll(8); console.log('  roll', JSON.stringify(r)); ok(r.smashed > 5, 'rolling smashes them: ' + r.smashed); ok(r.maxAlive <= 46, 'never more than ~45 at once'); await shot('roll-crowd');
  // the power-ups
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; mod.S.pw.push({ kind: 'giant', x: D.me.x, y: D.me.y, t: 0 }, { kind: 'fire', x: D.me.x, y: D.me.y, t: 0 }); });
  r = await roll(2.5); const pk = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { giant: mod.S.giant, fire: mod.S.fire, petK: D.g.petK, trail: mod.S.trail.length }; });
  console.log('  pw', JSON.stringify(pk)); ok(pk.giant > 0 && pk.petK > 1.5, 'GIANT: the pet is huge'); ok(pk.fire > 0 && pk.trail > 3, 'FIRE: a burning trail'); await shot('roll-giant-fire');
  r = await roll(80); console.log('  end', JSON.stringify(r)); ok(r.done && r.smashed >= 200, 'two hundred smashed: done');
  const after = await page.evaluate(() => ({ roll: window.__pp.arc.game._dbg.g.rollOnly, dk: window.__pp.arc.game._dbg.g.dodgeK })); ok(!after.roll && after.dk === 1, 'blows work again after');
  await shot('roll-done'); await exitStage(); ok(true, 'exit');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
