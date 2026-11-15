// Rift 0's three trials (worker S): the Ashen Hollows (Frozen Causeway), the Runebound Foundry (Three Rune Rings, bomb
// lesson), the Heartward Descent (vents, falls, ledges). Solves both puzzles from scrambled states and through their hints,
// and checks the latches. HTML=test-calS.html node tests/_cal-s-stages.js   (SHOTS=1 for pictures in shots/cal-s-*.png)
const { openCal } = require('./_cal-s-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x === undefined ? '' : ' ' + JSON.stringify(x))); if (!c) fails++; };
(async () => {
  const T = await openCal(); const { page, errors, start, goal } = T; const M = (f, a) => page.evaluate(f, a);
  const shot = async n => { if (process.env.SHOTS) await T.shotP(n); };
  // walk into the exit and wait (in game time, then for the end screen; slow pages need the long wait)
  const exitStage = async () => { await M(async () => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; await window.__w(6, () => { D.me.x = e.x; D.me.y = e.y; }, () => D.g.won); }); await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 120000 }); await page.waitForTimeout(600); };
  console.log('rift:', JSON.stringify(T.calInfo));
  let r;

  /* ======================= pure checks ======================= */
  r = await M(() => { const CS = self.__CAL_STAGES, H = CS.HOLLOWS; const sol = { J: 0, K: 1, k: 2, I: 0, V: 0 }; const f = H.flow(sol);
    const need = {}; for (const id in H.cells) need[id] = ['N', 'E', 'S', 'W'].filter((d, i) => H.cells[id].need & (1 << i)).join(''); const got = {}; for (const id in sol) got[id] = ['N', 'E', 'S', 'W'].filter((d, i) => H.portsOf(H.cells[id].kind, sol[id]) & (1 << i)).join('');
    let bad = 0, few = 0; for (let n = 0; n < 300; n++) { const s = H.scramble(); const f2 = H.flow(s); if (f2.basins[0] && f2.basins[1]) bad++; if (Object.keys(s).filter(id => H.portsOf(H.cells[id].kind, s[id]) !== H.cells[id].need).length < 3) few++; }
    const half = H.flow({ J: 0, K: 1, k: 0, I: 0, V: 0 });
    return { basins: f.basins, mist: f.mist.length, need, got, bad, few, half: half.basins, halfMist: half.mist.map(m => m.id + m.d) }; });
  ok(r.basins[0] && r.basins[1] && r.mist === 0, 'causeway: the authored solution feeds both basins and mists nowhere', r);
  ok(r.need.J === 'NEW' && r.need.K === 'ES' && r.need.k === 'SW' && r.need.I === 'NS' && r.need.V === 'NS' && JSON.stringify(r.need) === JSON.stringify(r.got), 'causeway: the pieces need exactly the spec\'s connections (T: N W E; elbows E S / W S; straights N S)', r.need);
  ok(r.bad === 0 && r.few === 0, 'causeway: 300 random starts: never already solved, always three or more pieces wrong', { bad: r.bad, few: r.few });
  ok(r.half[0] && !r.half[1] && r.halfMist.length > 0, 'causeway: a broken east branch stops (mist) while the west still flows', r);
  r = await M(() => { const F = self.__CAL_STAGES.FOUNDRY, apply = (s, l) => s.map((v, i) => (v + F.levers[l][i]) % 3); let worst = 0, badSolve = 0, n = 0;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) { let s = [a, b, c]; const p = F.plan(s); n++; if (!p) { badSolve++; continue; } for (const l of p) s = apply(s, l); if (s.join() !== '0,1,2') badSolve++; worst = Math.max(worst, p.length); }
    const p0 = F.plan([0, 0, 0]); let s = [0, 0, 0]; const steps = []; for (const l of ['A', 'C', 'C']) { s = apply(s, l); steps.push(s.slice()); }
    return { n, badSolve, worst, p0, steps, levers: F.levers }; });
  ok(r.n === 27 && r.badSolve === 0, 'rune rings: from each of the 27 states the breadth-first plan reaches EYE CHAIN CROWN', r);
  ok(JSON.stringify(r.steps) === JSON.stringify([[1, 1, 0], [2, 1, 1], [0, 1, 2]]), 'rune rings: the spec\'s solution A, C, C: Chain-Chain-Eye, Crown-Chain-Chain, Eye-Chain-Crown', r.steps);
  ok(r.p0.length === 3 && r.p0.filter(l => l === 'A').length === 1 && r.p0.filter(l => l === 'C').length === 2, 'rune rings: the shortest plan from the start is one A and two Cs', r.p0);
  ok(JSON.stringify(r.levers) === JSON.stringify({ A: [1, 1, 0], B: [0, 1, 1], C: [1, 0, 1] }), 'rune rings: A turns left+middle, B middle+right, C left+right', r.levers);

  /* ======================= THE ASHEN HOLLOWS ======================= */
  await start('caldera', 0); await T.setupW(); await T.runG(1.6);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, Mx = D.M, mw = Mx.MW; return { pieces: mod.pieces.length, bridge: Mx.marks.b.every(p => Mx.G[p.ty * mw + p.tx] === 2), hatch: Mx.marks.h.every(p => Mx.G[p.ty * mw + p.tx] === 0), exit: !!D.RIFT.exit, runnels: (Mx.marks.r || []).length, p1: mod.P1.map(m => m.calType), p2: mod.P2.map(m => m.calType), p3: mod.P3.length, start: [Mx.start.x, Mx.start.y], startLava: mod.lava.set.has(Math.floor(Mx.start.y) * mw + Math.floor(Mx.start.x)) }; });
  ok(r.pieces === 5 && r.bridge && r.hatch && !r.exit && r.runnels > 10 && !r.startLava, 'hollows: five pieces, the bridge is lava, the hatch shut, no exit; runnels on the floor, none under the start', r);
  ok(r.p1.join() === 'cinderslug,cinderslug' && r.p2.join() === 'basaltcrawler' && r.p3 === 0, 'hollows: two cinder slugs first, a lone basalt crawler in the second hollow, nothing mixed yet', r);
  await shot('hollows-start');
  // lava contact: a modest burn and back to safe ground
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, me = D.me, p = D.M.marks.r[3]; me.x = p.x; me.y = p.y + 2.2; await window.__w(0.3); const hp0 = me.hp, b0 = mod.lava.burns;
    await window.__w(0.4, () => { if (mod.lava.burns === b0) { me.x = p.x; me.y = p.y; } }, null, false); const r = { hp0, hp: me.hp, burns: mod.lava.burns - b0, onLava: mod.lava.set.has(Math.floor(me.y) * D.M.MW + Math.floor(me.x)), dist: Math.hypot(me.x - p.x, me.y - p.y), max: D.ST.hp }; return r; });
  ok(r.burns === 1 && r.hp < r.hp0 && r.hp0 - r.hp <= r.max * 0.12 && !r.onLava && r.dist > 0.8, 'hollows: stepping into a runnel burns a little (≤12%) and puts the pet back on safe ground', r);
  // the brood in order
  const killList = which => M(async w => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; window.__kill(mod[w]); await window.__w(0.8); return { p1: mod.P1.length, p2: mod.P2.map(m => m.calType), p3: mod.P3.map(m => m.calType), step: mod.S.step2, hatch: mod.hatch.open }; }, which);
  await killList('P1'); r = await killList('P2'); ok(r.p2.join() === 'basaltcrawler,emberwisp' && r.p3.length === 0, 'hollows: the crawler down, a lone ember wisp comes', r);
  r = await killList('P2'); ok(r.p3.sort().join() === 'basaltcrawler,cinderslug,emberwisp' && !r.hatch, 'hollows: then one of each together, the hatch still shut', r);
  await shot('hollows-mixed');
  r = await killList('P3'); await T.runG(1.2); r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; return { hatch: mod.hatch.open, tiles: D.M.marks.h.every(p => D.M.G[p.ty * mw + p.tx] === 1), live: D.mons.filter(m => !m.dead).length, goal: document.getElementById('arcGoal').textContent }; });
  ok(r.hatch && r.tiles && r.live === 0, 'hollows: all seven down, the maintenance hatch opens; nothing alive (no monsters during the puzzle)', r);
  // into the cavern: the puzzle starts
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; D.me.x = 16.5; D.me.y = 19; await window.__w(0.6); const f = mod.S.flow; return { entered: mod.S.entered, rot: Object.assign({}, mod.S.rot), basins: f.basins, mist: f.mist.length, fed: [...f.fed], goal: document.getElementById('arcGoal').textContent, live: D.mons.filter(m => !m.dead).length }; });
  ok(r.entered && !(r.basins[0] && r.basins[1]) && r.mist > 0 && r.fed.includes('Q') && r.live === 0, 'hollows: the causeway starts scrambled: the frost runs from the reservoir and mists where it breaks; no monsters', r);
  ok(/Frost to both basins/.test(r.goal), 'hollows: the goal says to bring the frost to both basins', r.goal);
  await T.runG(0.5); await shot('hollows-causeway');
  // the reservoir refuses before both basins flow
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; await window.__use('calreservoir', 0, [1.3, 0]); return { surge: mod.S.surge, latched: mod.S.latched }; });
  ok(r.surge === 0 && !r.latched, 'hollows: the reservoir does nothing until both basins flow', r);
  // solve it by standing at the pieces: turn each wrong one as often as it needs; the west branch first (one basin only: no prime)
  const turnTo = (ids) => M(async ids => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, CS = self.__CAL_STAGES.HOLLOWS, uses = [];
    for (const id of ids) { const i = mod.pieces.findIndex(p => p.id === id); let n = 0; while (CS.portsOf(CS.cells[id].kind, mod.S.rot[id]) !== CS.cells[id].need && n < 4) { const u = await window.__use('calconduit', i, [0.05, 0.1]); await window.__w(0.15, () => { D.me.x = mod.pieces[i].x + 2.6; D.me.y = mod.pieces[i].y + 1.5; }); if (u) n++; else break; } uses.push(n); }
    await window.__w(1.6, () => { D.me.x = 16.5; D.me.y = 19; }); return { uses, basins: mod.S.flow.basins, fill: mod.S.fill.slice(), primed: mod.S.primed, turns: mod.S.turns }; }, ids);
  r = await turnTo(['J', 'K', 'I']); ok(r.basins[0] && !r.primed, 'hollows: the west branch alone fills its basin, but nothing is primed (both are needed at once)', r);
  // break the west again while turning the east: never both at once -> no prime
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, i = mod.pieces.findIndex(p => p.id === 'K'); await window.__use('calconduit', i, [0.05, 0.1]); await window.__w(0.2, () => { D.me.x = 16.5; D.me.y = 19; }); return { basins: mod.S.flow.basins, rot: mod.S.rot.K }; });
  ok(!r.basins[0], 'hollows: turning the west elbow away stops the west branch', r);
  r = await turnTo(['k', 'V']); ok(r.basins[1] && !r.basins[0] && !r.primed, 'hollows: the east branch now flows but the west is broken: still not primed', r);
  r = await turnTo(['K']); await T.runG(1.4); r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return { basins: m.S.flow.basins, fill: m.S.fill, primed: m.S.primed, goal: document.getElementById('arcGoal').textContent }; });
  ok(r.basins[0] && r.basins[1] && r.primed && /release the frost/.test(r.goal), 'hollows: both branches flowing at once: both basins cold, the reservoir is primed', r);
  await shot('hollows-primed');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; const u = await window.__use('calreservoir', 0, [1.3, 0]); const s0 = mod.S.surge; await window.__w(4, () => { D.me.x = 16.5; D.me.y = 12; }, () => mod.S.latched); const mw = D.M.MW;
    return { used: u, surge: s0 > 0, latched: mod.S.latched, bridge: D.M.marks.b.every(p => D.M.G[p.ty * mw + p.tx] === 5), exit: !!D.RIFT.exit, done: D.RIFT.done }; });
  ok(r.used && r.surge && r.latched && r.bridge && r.exit && r.done, 'hollows: the pet releases the frost: the surge runs, both bridge halves set (walkable), the far door opens', r);
  await T.runG(0.6); await shot('hollows-latched');
  // the latch is permanent: turning pieces now does nothing, the bridge stays
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, rot0 = JSON.stringify(mod.S.rot); await window.__use('calconduit', 0, [0.05, 0.1]); await window.__w(1); const mw = D.M.MW; return { same: JSON.stringify(mod.S.rot) === rot0, latched: mod.S.latched, bridge: D.M.marks.b.every(p => D.M.G[p.ty * mw + p.tx] === 5) }; });
  ok(r.same && r.latched && r.bridge, 'hollows: once latched, the pieces are fixed and the bridge stays', r);
  // the shrine heals in full
  r = await M(async () => { const D = window.__pp.arc.game._dbg; D.me.hp = 5; let h = 0; await window.__use(D.RIFT.objs.some(o => o.kind === 'calspring') ? 'calspring' : 'calshrine', 0, [0, 1.2]); await window.__w(0.1, null, null, false); h = D.me.hp; return { hp: h, max: D.ST.hp }; });
  ok(r.hp >= r.max - 0.5, 'hollows: the frost shrine before Fire Flan restores the pet in full', r);
  await exitStage(); r = await T.rs(); ok(r.prog.caldera === 1, 'hollows: the far door ends the stage (the checkpoint: the next stage is Fire Flan)', r.prog);

  // a second visit: solve from a fresh scramble by following the hint alone
  await start('caldera', 0); await T.setupW(); await T.runG(1.4);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; for (const L of ['P1', 'P2', 'P2', 'P3']) { window.__kill(mod[L]); await window.__w(0.6); } D.me.x = 16.5; D.me.y = 19; await window.__w(0.8);
    const before = mod.hint(); mod.S.cavT = 41; await window.__w(0.4); const steps = []; let guard = 0;
    while (!mod.S.primed && guard++ < 25) { const h = mod.hint(); if (!h) break; const i = mod.pieces.findIndex(p => Math.abs(p.x - h.x) < 0.01 && Math.abs(p.y - h.y) < 0.01); if (i < 0) break; steps.push(mod.pieces[i].id); await window.__use('calconduit', i, [0.05, 0.1]); await window.__w(0.15, () => { D.me.x = 16.5; D.me.y = 19; }); }
    await window.__w(1.8, () => { D.me.x = 16.5; D.me.y = 19; }, () => mod.S.primed); const h2 = mod.hint();
    return { before: before && before.label, hint: mod.S.hint, steps, primed: mod.S.primed, h2: h2 && h2.label }; });
  ok(r.before !== 'TURN THIS' && r.hint && r.steps.length >= 3 && r.primed && r.h2 === 'RELEASE', 'hollows: after the delay the hint traces the piece that breaks the flow; following it alone primes the reservoir', r);
  await shot('hollows-hint');

  /* ======================= THE RUNEBOUND FOUNDRY ======================= */
  await start('caldera', 2); await T.setupW(); await T.runG(1.6);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; return { door: D.M.marks.D.every(p => D.M.G[p.ty * mw + p.tx] === 0), rings: mod.S.rings, p1: mod.P1.map(m => m.calType), p2: mod.P2.map(m => m.calType), grates: D.M.marks.g.length, levers: D.RIFT.objs.filter(o => o.kind === 'callever').length, reset: D.RIFT.objs.some(o => o.kind === 'calreset'), lect: D.RIFT.objs.some(o => o.kind === 'callectern') }; });
  ok(r.door && r.rings.join() === '0,0,0' && r.levers === 3 && r.reset && r.lect, 'foundry: the pressure door is shut, all three rings at EYE, three levers, a reset and a lectern', r);
  ok(r.p1.join() === 'furnaceimp,furnaceimp' && r.p2.join() === 'runicsentinel' && r.grates > 30, 'foundry: two furnace imps, a lone runic sentinel; grated walkways over the lava', r);
  await shot('foundry-start');
  // the levers light their rings on approach
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, out = {}; for (const L of mod.levers) { D.me.x = L.x + 1.2; D.me.y = L.y + 0.9; await window.__w(0.25, () => { D.me.x = L.x + 1.6; D.me.y = L.y + 1.0; }); out[L.id] = mod.S.near; } D.me.x = 17.5; D.me.y = 30; await window.__w(0.2); out.far = mod.S.near; return out; });
  ok(r.A === 'A' && r.B === 'B' && r.C === 'C' && r.far === null, 'foundry: nearing a lever highlights it (and its two rings)', r);
  // pull A, C, C: the spec's solution
  const pull = id => M(async id => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, i = mod.levers.findIndex(l => l.id === id); const u = await window.__use('callever', i, [0.1, 0.9]); await window.__w(0.2, () => { D.me.x = 17.5; D.me.y = 15; }); return { u, rings: mod.S.rings.slice(), solved: mod.S.solved }; }, id);
  r = await pull('A'); ok(r.rings.join() === '1,1,0', 'foundry: A once: Chain, Chain, Eye', r);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, L = D.RIFT.self.mod.levers[2]; D.me.x = L.x + 1.4; D.me.y = L.y + 1.0; }); await T.runG(0.3); await shot('foundry-near-C');
  r = await pull('C'); ok(r.rings.join() === '2,1,1', 'foundry: C once: Crown, Chain, Chain', r);
  // reset, then a scramble of random pulls, then solve by asking the lectern for the next move each time
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; await window.__use('calreset', 0, [0.1, 0.9]); await window.__w(0.2, () => { D.me.x = 17.5; D.me.y = 15; }); return mod.S.rings.slice(); });
  ok(r.join() === '0,0,0', 'foundry: the reset lever sets every ring back to EYE', r);
  const seq = ['B', 'B', 'A', 'C', 'B', 'A', 'A']; for (const l of seq) await pull(l);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, F = self.__CAL_STAGES.FOUNDRY, s0 = mod.S.rings.slice(), plan = F.plan(s0), moves = []; let guard = 0;
    while (!mod.S.solved && guard++ < 6) { await window.__use('callectern', 0, [0.1, 0.9]); await window.__w(0.2, () => { D.me.x = 17.5; D.me.y = 15; }); const h = mod.hint(), want = mod.S.hintMove; if (!want || !h || !h.label.includes(want)) return { err: 'no hint', h, want }; moves.push(want);
      const i = mod.levers.findIndex(l => l.id === want); await window.__use('callever', i, [0.1, 0.9]); await window.__w(0.2, () => { D.me.x = 17.5; D.me.y = 15; }); }
    return { s0, plan, moves, solved: mod.S.solved, hints: mod.S.hints }; });
  ok(r.solved && r.moves.length === r.plan.length && r.moves.length <= 4, 'foundry: from a scrambled state, "show next move" (breadth-first from the current state) solves it in the shortest number of moves', r);
  // a stale hint is never shown after the rings move
  ok(await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return m.S.solved && m.S.hintMove === null; }), 'foundry: solved, the hint clears');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; await window.__w(0.9); const mid = mod.S.iris; await window.__w(3, null, () => mod.S.opened); const mw = D.M.MW; await window.__w(1.6); return { mid, opened: mod.S.opened, tiles: D.M.marks.D.every(p => D.M.G[p.ty * mw + p.tx] === 1), beat: mod.S.beatT > 0, exit: !!D.RIFT.exit }; });
  ok(r.mid > 0.2 && r.mid < 1 && r.opened && r.tiles && r.beat && !r.exit, 'foundry: solved, the rings close into an iris, the door opens and the heartbeat starts (the exit waits for the brood)', r);
  await shot('foundry-open');
  // the bomb lesson: the sentinel down brings the ordinary pack with the bomb larva; hit it while safe: it flies into a foe
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; window.__kill(mod.P1); window.__kill(mod.P2); D.me.x = 17.5; D.me.y = 24; await window.__w(0.8); const p3 = mod.P3.map(m => m.calType);
    for (const m of mod.P3) { m.aggro = false; m.cd = 99; m.atkCd = 99; }
    await window.__w(4, () => { D.me.x = 17.5; D.me.y = 24; for (const m of mod.P3) if (m !== mod.bomb.m) { m.x = m.x0 || (m.x0 = m.x); m.y = m.y0 || (m.y0 = m.y); m.aggro = false; } }, () => mod.bomb.st === 'ground');
    return { p3, st: mod.bomb.st, own: mod.bomb.own, safe: mod.bomb.safe(), goal: document.getElementById('arcGoal').textContent, hint: (mod.hint() || {}).label }; });
  ok(r.p3.length === 2 && r.st === 'ground' && r.safe && /Return the bomb/.test(r.goal) && r.hint === 'RETURN IT', 'foundry: then an imp and a sentinel with a bomb larva: it lands and the goal says to return it', r);
  await T.runG(0.3); await shot('foundry-bomb');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.bomb, foes = mod.P3.filter(m => m !== B.m && !m.dead), hp0 = foes.map(m => m.hp), me0 = D.me.hp;
    D.hitMon(B.m, 3, {}); await window.__w(0.12, null, null, false); const st1 = B.st; await window.__w(2.5, () => { for (const m of foes) { m.aggro = false; m.cd = 99; m.atkCd = 99; } }, () => B.st === 'done' && foes.some(m => m.dead || m.hp < m.maxhp), false);
    return { st1, st: B.st, own: B.own, returned: B.returned, dmg: foes.map((m, i) => m.dead ? 'dead' : +(hp0[i] - m.hp).toFixed(1)), pet: +(me0 - D.me.hp).toFixed(1) }; });
  ok(r.st1 === 'thrown' && r.st === 'done' && r.returned === 1 && r.dmg.some(d => d === 'dead' || d > 0) && r.pet <= 0, 'foundry: hit while safe, the bomb flies back and bursts on a foe; the pet takes nothing', r);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; window.__kill(mod.P3); await window.__w(1.2); return { exit: !!D.RIFT.exit, done: D.RIFT.done }; });
  ok(r.exit && r.done, 'foundry: door open and the foundry clear: the way to the Bomb King opens', r);
  // a second bomb left alone: it flashes red (a shown circle) and bursts weakly
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.bomb; B.spawn({ x: D.me.x + 2, y: D.me.y }, 999); const hp0 = D.me.hp; let warned = false;
    await window.__w(9, () => { if (B.st === 'ground') { D.me.x = B.m.x + 0.4; D.me.y = B.m.y; } if (D.zones.some(z => z.kind === 'warn')) warned = true; }, () => B.st === 'done', false); return { st: B.st, warned, lost: +(hp0 - D.me.hp).toFixed(1), max: D.ST.hp }; });
  ok(r.st === 'done' && r.warned && r.lost > 0 && r.lost <= r.max * 0.08, 'foundry: a bomb left on the floor shows its circle, then bursts for a little (the lesson is safe)', r);

  /* ======================= THE HEARTWARD DESCENT ======================= */
  await start('caldera', 4); await T.setupW(); await T.runG(1.4);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; const hp0 = D.me.hp; const v = mod.vents[0]; let sawWarn = false, sawErupt = false, liveEarly = false;
    await window.__w(9, () => { D.me.x = 16.5; D.me.y = 68.5; if (v.ph === 'warn') sawWarn = true; if (v.ph === 'erupt') sawErupt = true; if (mod.vents.some(q => q.live) && !sawErupt) liveEarly = true; }, () => mod.S.demo === 2, false);
    return { sawWarn, sawErupt, demo: mod.S.demo, liveEarly, lost: hp0 - D.me.hp, live: mod.vents.filter(q => q.live).map(q => q.lane) }; });
  ok(r.sawWarn && r.sawErupt && r.demo === 2 && !r.liveEarly && r.lost === 0, 'descent: the first vent shows itself once (glow and hiss, then erupt) while the pet is safe on the ledge', r);
  ok(r.live.join() === '0,0,0', 'descent: after the demonstration the first causeway\'s three vents run; the second\'s are still', r);
  await shot('descent-demo');
  // an eruption under the pet throws it off: back on the last ledge, a modest penalty
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, v = mod.vents[1]; D.me.hp = D.ST.hp; const hp0 = D.me.hp; let at = null;
    await window.__w(8, () => { if (!at && mod.S.falls === 0) { D.me.x = v.x; D.me.y = v.y; D.me.inv = 0; } }, () => mod.S.falls > 0 && (at = at || { x: D.me.x, y: D.me.y }), false); await window.__w(0.1, null, null, false);
    return { falls: mod.S.falls, lost: +(hp0 - D.me.hp).toFixed(1), max: D.ST.hp, at: [+D.me.x.toFixed(1), +D.me.y.toFixed(1)], ledge: mod.ledgeOf(D.me.y) }; });
  ok(r.falls === 1 && r.lost > 0 && r.lost <= r.max * 0.12 && r.ledge === 0, 'descent: an eruption throws the pet off the causeway: back on ledge 0, ~10% lost', r);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; D.me.x = 16.5; D.me.y = 54; await window.__w(0.4); const asleep = mod.G1.every(m => !m.aggro); D.me.x = 16.5; D.me.y = 50; await window.__w(0.6); return { asleep, awake: mod.S.awake[0], aggro: mod.G1.filter(m => m.aggro).length, g1: mod.G1.map(m => m.calType), g2: mod.G2.map(m => m.calType).sort(), bar: D.M.marks.X.every(p => D.M.G[p.ty * D.M.MW + p.tx] === 0) }; });
  ok(r.asleep && r.awake && r.aggro === 2 && r.g1.join() === 'ashenknight,ashenknight' && r.bar, 'descent: the two ashen knights wait until the pet is on their ledge; the next causeway is barred', r);
  ok(r.g2.join() === 'ashenknight,crystalwisp,crystalwisp', 'descent: the second group is a knight and two crystal wisps', r.g2);
  await shot('descent-ledge1');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; window.__kill(mod.G1); await window.__w(1.0); return { open: mod.S.open[0], tiles: D.M.marks.X.every(p => D.M.G[p.ty * D.M.MW + p.tx] === 1), lane2: mod.vents.filter(v => v.lane === 1 && v.live).length, g2: mod.G2.every(m => !m.aggro) }; });
  ok(r.open && r.tiles && r.lane2 === 3 && r.g2, 'descent: the ledge clear, the slag gives way and the second causeway\'s vents wake (the next group still waits)', r);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; D.me.x = 16.5; D.me.y = 27; await window.__w(0.6); const aw = mod.S.awake[1]; window.__kill(mod.G2); await window.__w(1.2); return { aw, open: mod.S.open[1], exit: !!D.RIFT.exit, done: D.RIFT.done }; });
  ok(r.aw && r.open && r.exit && r.done, 'descent: the second ledge\'s group wakes, falls; the overlook opens with the way to Ifrit', r);
  await M(() => { const D = window.__pp.arc.game._dbg; D.me.x = 16.5; D.me.y = 15; }); await T.runG(1.0); await shot('descent-overlook');
  await exitStage(); r = await T.rs(); ok(r.prog.caldera === 5, 'descent: the door ends the stage (next: Ifrit)', r.prog);

  ok(errors.length === 0, 'no page errors', errors.slice(0, 4));
  console.log(fails ? `${fails} FAILED` : 'all ok'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
