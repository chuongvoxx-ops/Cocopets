// The Archer's Horizon (Sagittarius gate): flip mirrors so the bolts from the plates pass through every star; 3 rounds
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 92, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'colours'] }); const { page, errors, shot, start, run } = T;
  const M = (f, a) => page.evaluate(f, a);
  await start('colours', 'gate'); await run(2.5);
  let r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { round: mod.S.round, mir: mod.S.mir.length, stars: mod.S.lit.length, plates: mod.plates().length }; });
  ok(r.round === 0 && r.mir === 1 && r.stars === 1 && r.plates === 1, 'round one: one plate, one mirror, one star ' + JSON.stringify(r)); await shot('col-gate-a');
  // walking past a mirror doesn't flip it; standing at its foot does
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, m = mod.S.mir[0], p = mod.at(m.i, m.j), s0 = m.s; const raf = () => new Promise(r => requestAnimationFrame(r));
    for (let i = 0; i < 3; i++) { D.me.x = p.x; D.me.y = p.y + 0.6; await raf(); } D.me.x = p.x + 3; D.me.y = p.y + 3; for (let i = 0; i < 4; i++) await raf(); const passed = m.s === s0;
    const t0 = performance.now(); while (performance.now() - t0 < 1500 && m.s === s0) { D.me.x = p.x; D.me.y = p.y + 0.6; await raf(); } const flipped = m.s !== s0; D.me.x = p.x + 3; D.me.y = p.y + 3; for (let i = 0; i < 4; i++) await raf(); return { passed, flipped }; });
  ok(r.passed && r.flipped, 'passing a mirror leaves it; standing at its foot flips it ' + JSON.stringify(r));
  // solve each round: try mirror settings until one lights an unlit star from some plate, set the mirrors, stand on the plate
  const solveRound = () => M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, raf = () => new Promise(r => requestAnimationFrame(r)); const r0 = S.round; let shots = 0;
    for (let guard = 0; guard < 6 && S.round === r0 && !S.won && !S.lit.every(Boolean); guard++) { const n = S.mir.length; let plan = null;
      for (let mask = 0; mask < (1 << n) && !plan; mask++) { const save = S.mir.map(m => m.s); S.mir.forEach((m, k) => { m.s = mask >> k & 1 ? '/' : '\\'; }); for (const pl of mod.plates()) { const tr = mod.trace(pl.col); if (tr.hits.some(h => !S.lit[h])) { plan = { mask, pl }; break; } } S.mir.forEach((m, k) => { m.s = save[k]; }); }
      if (!plan) return { stuck: true, round: S.round };
      for (let k = 0; k < S.mir.length; k++) { const m = S.mir[k], want = plan.mask >> k & 1 ? '/' : '\\'; if (m.s === want) continue; const p = mod.at(m.i, m.j); const t0 = performance.now(); while (performance.now() - t0 < 2000 && m.s !== want) { D.me.x = p.x; D.me.y = p.y + 0.6; D.me.hp = D.ST.hp; await raf(); } D.me.x = p.x + 1.6; D.me.y = p.y + 1.6; for (let i = 0; i < 3; i++) await raf(); }
      const lit0 = S.lit.filter(Boolean).length, t1 = performance.now(); while (performance.now() - t1 < 6000 && S.lit.filter(Boolean).length === lit0 && S.round === r0) { D.me.x = plan.pl.x; D.me.y = plan.pl.y; D.me.hp = D.ST.hp; await raf(); } shots = S.shots; D.me.x = plan.pl.x; D.me.y = plan.pl.y - 2; await raf(); }
    const t2 = performance.now(); while (performance.now() - t2 < 4000 && S.round === r0 && !S.won) await raf();
    return { round: r0, next: S.round, won: S.won, shots, flips: S.flips }; });
  for (let k = 0; k < 3; k++) { r = await solveRound(); ok(!r.stuck && (k < 2 ? r.next === k + 1 : r.won), `round ${k + 1}: the mirrors set and bolts loosed, every star lit ` + JSON.stringify(r)); if (k < 2) { await run(2.4); await shot('col-gate-' + 'bc'[k]); } }
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 }); ok(true, 'the gate is won');
  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
