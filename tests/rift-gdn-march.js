// The Seedling March (the Garden of Unborn Stars, stage 2): an army run up a moss lane. The march goes by itself and the
// keys / stick only steer; gates change the army's number; a number block shot down gives its prize; thornling crowds
// clash number against number; the Milkcap Colossus falls and the way opens; out of hearts, the march restarts at the
// last bloom post.   usage: node tests/rift-gdn-march.js   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 22, seals: ['belfry'] }); const { page, errors, shot, start, run, state, exitStage, rs } = T;
  const D = f => page.evaluate(f);
  const S = () => D(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, S = m.S; return { t: S.t, mode: S.mode, phase: S.phase, d: S.d, y: S.y, n: S.n, hearts: S.hearts, bow: S.bow, spread: S.spread, clash: !!S.clash, restarts: S.restarts, cp: S.cp.d, x: D.me.x, done: D.RIFT.done, kinds: m.E.filter(e => !e.gone).map(e => e.k) }; });
  // hold the pet at lane x (and optionally pump a crowd's number up when it comes into view) until cond holds
  const drive = (x, cond, secs, o) => page.evaluate(async ([x, cond, secs, o]) => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, f = new Function('S', 'm', 'D', 'return ' + cond), log = { clash: null, end: null, gates: [], maxBoss: 0 };
    const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (x != null) D.me.x = x;
      if (o && o.crowd) for (const e of m.E) if (e.k === 'crowd' && !e.pumped) { e.pumped = true; e.n = e.n0 = o.crowd; e.hp = o.crowd * 3; }
      if (m.S.clash && !log.clash) log.clash = { army: m.S.clash.armyN, crowd: m.S.clash.clashN, armyNow: m.S.n };
      if (log.clash && !m.S.clash && !log.end) log.end = { army: m.S.n, crowds: m.S.crowds };
      if (f(m.S, m, D)) return Object.assign(log, { met: true }); } return Object.assign(log, { met: false }); }, [x, cond, secs, o || null]);
  await start('garden', 1);
  let r = await D(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; return { name: D.F.rift.name, kind: D.F.rift.kind, stage: window.__pp.RIFT_BY_ID.garden.stages[1].name, how: window.__pp.RIFT_BY_ID.garden.stages[1].how, n: m.S.n, monsters: D.mons.length }; });
  console.log('  start', JSON.stringify({ name: r.name, n: r.n }));
  ok(r.name === 'The Seedling March' && r.stage === 'The Seedling March' && r.kind === 'puzzle', 'stage 2 of the Garden is the Seedling March (the race is gone)');
  ok(r.n === 8 && r.monsters === 0 && /steer/i.test(r.how) && /green/.test(r.how) && /bloom post/.test(r.how), 'eight seedlings to start, no engine monsters; the how-to explains steering, gates and checkpoints');
  await shot('march-intro');
  r = await drive(null, "S.mode === 'run'", 12); ok(r.met, 'after the intro the march begins');
  // constant forward motion; the keys steer
  let a = await S(); await run(1.2); let b = await S(); ok((b.d - a.d) / (b.t - a.t) > 3 && b.y < a.y, `the army marches up the lane by itself (${((b.d - a.d) / (b.t - a.t)).toFixed(1)} tiles a second)`);
  await page.keyboard.down('ArrowRight'); await run(0.6); await page.keyboard.up('ArrowRight'); const c1 = await S(); await page.keyboard.down('ArrowLeft'); await run(0.6); await page.keyboard.up('ArrowLeft'); const c2 = await S();
  ok(c1.x > b.x + 1 && c2.x < c1.x - 1, `the move keys steer left and right (x ${b.x.toFixed(1)} → ${c1.x.toFixed(1)} → ${c2.x.toFixed(1)})`);
  // a good gate: the left one of the first pair is +10
  r = await drive(6, "m.E.some(e => e.k === 'gate' && e.pick)", 8); b = await S(); ok(r.met && b.n === 18, `through the green +10 gate: 8 → ${b.n}`);
  await run(0.2); await shot('march-gate');
  // the crossbow block (15): steer under it and shoot it down
  r = await drive(8, 'S.bow', 8); b = await S(); ok(r.met && b.bow && b.n === 18 && !b.kinds.includes('block'), 'the number block is shot down: the seed crossbow is won, no seedling lost');
  await shot('march-block');
  // the second pair: ×2 on the right
  r = await drive(10, "m.E.filter(e => e.k === 'gate' && e.pick).length && S.d > 35", 8); b = await S(); ok(r.met && b.n === 36, `through the ×2 gate: 18 → ${b.n}`);
  // a crowd of thornlings (made bigger here so it surely lives to meet the army): both counts drop in the clash
  r = await drive(8, 'S.clash', 14, { crowd: 60 }); await run(0.25); await shot('march-clash'); const r2 = await drive(8, 'S.crowds >= 1 && !S.clash', 8); console.log('  clash', JSON.stringify([r.clash, r2.end])); b = await S();
  ok(r.met && r.clash && r.clash.crowd > 0 && r2.met && b.n < r.clash.army && b.n > 0 && !b.kinds.includes('crowd'), `the crowds clash: thornlings ${r.clash && r.clash.crowd} → 0, seedlings ${r.clash && r.clash.army} → ${b.n}`);
  // a bad gate: ÷2 on the left of the pair at 72
  await D(() => window.__pp.arc.game._dbg.RIFT.self.mod.warp(67)); a = await S();
  r = await drive(5.5, "m.E.some(e => e.k === 'gate' && e.pick)", 6); b = await S(); ok(r.met && b.n === Math.floor(a.n / 2) && b.n < a.n, `through the rose ÷2 gate: ${a.n} → ${b.n}`);
  // the bloom post at 80 is the checkpoint
  r = await drive(8, 'S.cp.d === 80', 6); b = await S(); ok(r.met && b.hearts === 3, `past the bloom post: the checkpoint is at ${b.cp}`);
  // marching alone: no seedlings and one heart left, a thornling crowd overruns the pet: the march restarts at the post
  await D(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; m.setN(0); m.S.hearts = 1; });
  await run(0.4); await shot('march-alone');
  r = await drive(10.6, 'S.restarts >= 1 && S.mode === "run"', 16, { crowd: 30 }); b = await S(); console.log('  lost', JSON.stringify({ d: b.d, n: b.n, hearts: b.hearts }));
  ok(r.met && b.restarts === 1 && Math.abs(b.d - 80) < 3.5 && b.n >= 12 && b.hearts === 3 && b.phase === 'course', `out of hearts the march begins again at the bloom post (${b.d.toFixed(1)}), ${b.n} seedlings regrown, three hearts`);
  // the Milkcap Colossus: shoot its number down, hack at it, dodge its rings; it falls and the way opens
  await D(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; m.warp(176); m.setN(150); m.S.bow = m.S.spread = true; });
  r = await drive(null, "S.phase === 'boss' && m.B && !m.B.enter", 12); const hp0 = await D(() => window.__pp.arc.game._dbg.RIFT.self.mod.B.hp);
  await run(0.8); await shot('march-boss');
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; const t0 = performance.now(); let contact = false, rings = 0, low = 1e9; while (performance.now() - t0 < 90000 && !D.RIFT.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const B = m.B; if (B && B.contact) contact = true; if (B) low = Math.min(low, B.hp); rings = Math.max(rings, m.rings.length);
      const rg = m.rings.find(q => !q.hit && q.kind === 'roots'), want = rg ? (rg.x < 8 ? Math.min(11.5, rg.x + 3.6) : Math.max(4.5, rg.x - 3.6)) : 8; D.me.x += Math.max(-0.15, Math.min(0.15, want - D.me.x)); } return { done: D.RIFT.done, contact, rings, exit: D.RIFT.exit && D.RIFT.exit.label, n: m.S.n }; });
  console.log('  boss', JSON.stringify(r)); ok(r.done && r.rings > 0 && r.exit === 'The Garden\'s heart', `the Colossus (${Math.round(hp0)}) is shot (and hacked, if the army reaches it) down, its rings dodged: the way to the Garden's heart opens`);
  await run(1.2); await shot('march-win');
  r = await S(); ok(r.done, 'the stage is done');
  await exitStage(); r = await rs(); ok(r.prog.garden === 2, 'through the way on: the checkpoint moves to stage 3');
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
