// The Room That Remembers, played by the hook: the flood catch first, then the full road through time
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run, exitStage } = T;
  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.sepulchre.stages.findIndex(s => s.name === 'The Room That Remembers'));
  await start('sepulchre', idx); await run(2.5);
  const P = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.M.marks, f = ch => [m[ch][0].x, m[ch][0].y]; return { s: f('s'), k: f('k'), p: f('p'), u: f('u'), n: f('n'), t: f('t'), Q: f('Q'), Y: f('Y'), E: f('E') }; });
  const use = async (pt, dy) => { await page.evaluate(async ([x, y]) => { const D = window.__pp.arc.game._dbg; for (let k = 0; k < 10; k++) { await new Promise(r => requestAnimationFrame(r)); D.me.x = x + 1.6; D.me.y = y + 1.6; } }, pt); await page.evaluate(async ([x, y, secs]) => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } }, [pt[0], pt[1] + (dy || 0.4), 1.6]); await run(0.6); };
  const R = () => page.evaluate(() => { const r = window.__pp.arc.game._dbg.RIFT.self.mod.R; return { era: r.era, carry: r.carry, root: r.root, flooded: r.flooded, eroded: r.eroded, kept: !!r.statueKept, gate: r.gate, sluice: r.sluice, drain: r.drain, planted: r.planted, done: window.__pp.arc.game._dbg.RIFT.done, goal: document.getElementById('arcGoal').textContent }; });
  let r = await R(); ok(r.era === 'present', 'starts in the Present · ' + r.goal); await shot('rem-present');
  await use(P.s); r = await R(); ok(r.carry === 'seed', 'took the seed');
  await use(P.Q, 0); r = await R(); ok(r.era === 'past' && r.carry === 'seed', 'into the Past, the seed carried through'); await shot('rem-past');
  await use(P.p); r = await R(); ok(r.planted && !r.carry, 'planted in the riverside bed');
  await use(P.u, 0.6); r = await R(); ok(r.sluice === 'garden', 'sluice to the garden');
  await use(P.Q, 0); r = await R(); ok(r.era === 'present' && r.root && r.flooded, 'the Present remembers: a root across the chasm, but the hollow flooded (no drain)'); await shot('rem-flooded');
  await use(P.Q, 0); await use(P.n); r = await R(); ok(r.drain, 'in the Past: the drain plug pulled');
  await use(P.Q, 0); r = await R(); ok(r.root && !r.flooded, 'back: the hollow has drained, the root stays'); await shot('rem-root');
  await use(P.k); r = await R(); ok(r.carry === 'slab', 'over the root: took the roof slab');
  await use(P.Y, 0); r = await R(); ok(r.era === 'past' && r.carry === 'slab', 'into the Past at the far anchor with the slab');
  await use(P.t, 1.3); r = await R(); ok(!r.carry, 'the statue sheltered'); await shot('rem-shelter');
  await use(P.Y, 0); r = await R(); ok(r.kept, 'the Present: the statue still stands');
  await use(P.Q, 0); await use(P.u, 0.6); r = await R(); ok(r.sluice === 'wall', 'the sluice now against the wall');
  await use(P.Q, 0); r = await R(); ok(r.eroded && r.root && !r.flooded, 'the Present: the wall worn through, the root still there, no flood');
  await use(P.t, 1.3); r = await R(); ok(r.gate && r.done, 'the statue\'s switch opens the gate · ' + r.goal); await shot('rem-gate');
  await exitStage(); ok(true, 'exit');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
