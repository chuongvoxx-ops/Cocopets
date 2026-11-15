// Rift 0's three puzzle trials (worker S): the Ashen Hollows (four hollows of brood, the Frozen Causeway), the Runebound
// Foundry (four forge halls, the bomb lesson, the Three Rune Rings), the Heartward Descent (vents, falls, three ledges of
// brood, the overlook). About forty brood in each; both puzzles solved from scrambled states and through their hints; the
// latches checked. HTML=test-calS.html node tests/_cal-s-stages.js (SHOTS=1: shots/cal-s-*.png)
const { openCal } = require('./_cal-s-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x === undefined ? '' : ' ' + JSON.stringify(x))); if (!c) fails++; };
(async () => {
  const T = await openCal(); const { page, errors, goal } = T; const M = (f, a) => page.evaluate(f, a);
  const shot = async n => { if (process.env.SHOTS) await T.shotP(n); };
  const exitStage = async () => { await M(async () => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; await window.__w(6, () => { D.me.x = e.x; D.me.y = e.y; }, () => D.g.won); }); await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 120000 }); await page.waitForTimeout(600); };
  const start = async k => { await T.startTrial(k); await T.setupW(); await M(() => { // clear the brood room by room: walk in, let a wave rise, strike it down (counting what rose)
      window.__clear = async (upto) => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.brood; const seen = []; let guard = 0;
        while (!B.done && guard++ < 80 && (upto == null || B.i < upto)) { const R = B.room(); if (B.wave < 0) { const p = R.spots[2]; D.me.x = p.x; D.me.y = (R.y0 + R.y1) / 2; D.me.vx = D.me.vy = 0; await window.__w(0.5); continue; }
          if (B.live.length) { seen.push(B.live.map(m => m.calType || m.type).sort().join('+')); window.__kill(B.live); } await window.__w(1.9); }
        return { done: B.done, i: B.i, total: B.total, killed: B.killed(), all: B.all.length, waves: seen }; }; }); };
  console.log('rift:', JSON.stringify(T.calInfo));
  const idx = { H: await T.trial('HOLLOWS'), F: await T.trial('FOUNDRY'), D: await T.trial('DESCENT') }; console.log('trials at', JSON.stringify(idx));
  let r;

  /* ======================= pure checks ======================= */
  r = await M(() => { const CS = self.__CAL_STAGES, H = CS.HOLLOWS; const sol = { J: 0, K: 1, k: 2, I: 0, V: 0 }; const f = H.flow(sol);
    const need = {}; for (const id in H.cells) need[id] = ['N', 'E', 'S', 'W'].filter((d, i) => H.cells[id].need & (1 << i)).join(''); const got = {}; for (const id in sol) got[id] = ['N', 'E', 'S', 'W'].filter((d, i) => H.portsOf(H.cells[id].kind, sol[id]) & (1 << i)).join('');
    let bad = 0, few = 0; for (let n = 0; n < 300; n++) { const s = H.scramble(); const f2 = H.flow(s); if (f2.basins[0] && f2.basins[1]) bad++; if (Object.keys(s).filter(id => H.portsOf(H.cells[id].kind, s[id]) !== H.cells[id].need).length < 3) few++; }
    return { basins: f.basins, mist: f.mist.length, need, got, bad, few }; });
  ok(r.basins[0] && r.basins[1] && r.mist === 0 && r.need.J === 'NEW' && r.need.K === 'ES' && r.need.k === 'SW' && r.need.I === 'NS' && r.need.V === 'NS' && JSON.stringify(r.need) === JSON.stringify(r.got), 'causeway: the spec\'s connections feed both basins', r);
  ok(r.bad === 0 && r.few === 0, 'causeway: random starts never solved, always 3+ pieces wrong', r);
  r = await M(() => { const F = self.__CAL_STAGES.FOUNDRY, apply = (s, l) => s.map((v, i) => (v + F.levers[l][i]) % 3); let bad = 0;
    for (let a = 0; a < 27; a++) { let s = [a % 3, Math.floor(a / 3) % 3, Math.floor(a / 9)]; const p = F.plan(s); if (!p) { bad++; continue; } for (const l of p) s = apply(s, l); if (s.join() !== '0,1,2') bad++; } return { bad, p0: F.plan([0, 0, 0]) }; });
  ok(r.bad === 0 && r.p0.join() === 'A,C,C', 'rune rings: all 27 states solve by the plan; from the start A, C, C', r);

  const ONLY = process.env.ONLY || 'HFD';   // (ONLY=D runs just the Descent)
  if (ONLY.includes('H')) {
  /* ======================= THE ASHEN HOLLOWS ======================= */
  await start('HOLLOWS'); await T.runG(1.6);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, Mx = D.M, mw = Mx.MW; return { pieces: mod.pieces.length, bridge: Mx.marks.b.every(p => Mx.G[p.ty * mw + p.tx] === 2), hatch: Mx.marks.h.every(p => Mx.G[p.ty * mw + p.tx] === 0), gates: ['1', '2', '3'].map(ch => Mx.marks[ch].every(p => Mx.G[p.ty * mw + p.tx] === 0)), exit: !!D.RIFT.exit, total: mod.brood.total, live: D.mons.filter(m => !m.dead).length, runnels: (Mx.marks.r || []).length, startLava: mod.lava.set.has(Math.floor(Mx.start.y) * mw + Math.floor(Mx.start.x)) }; });
  ok(r.pieces === 5 && r.bridge && r.hatch && r.gates.every(Boolean) && !r.exit && r.runnels > 10 && !r.startLava, 'hollows: four hollows behind slag gates, the hatch shut, the causeway\'s bridge lava', r);
  ok(r.total >= 36 && r.total <= 44 && r.live === 0, 'hollows: about forty brood, rising room by room (none out at the start)', { total: r.total, live: r.live });
  await shot('hollows-start');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, me = D.me, p = D.M.marks.r[3]; me.x = p.x; me.y = p.y + 2.2; await window.__w(0.3); const hp0 = me.hp, b0 = mod.lava.burns;
    await window.__w(0.4, () => { if (mod.lava.burns === b0) { me.x = p.x; me.y = p.y; } }, null, false); return { hp0, hp: me.hp, burns: mod.lava.burns - b0, onLava: mod.lava.set.has(Math.floor(me.y) * D.M.MW + Math.floor(me.x)), max: D.ST.hp }; });
  ok(r.burns === 1 && r.hp < r.hp0 && r.hp0 - r.hp <= r.max * 0.12 && !r.onLava, 'hollows: a runnel burns a little and puts the pet back on safe ground', r);
  // the first hollow: slugs alone, wave by wave; its gate lifts when they are down
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.brood, R = B.room(); D.me.x = R.spots[2].x; D.me.y = (R.y0 + R.y1) / 2; await window.__w(0.6); const w1 = B.live.map(m => m.calType).sort().join(); const g1 = D.M.marks['1'].every(p => D.M.G[p.ty * D.M.MW + p.tx] === 0);
    window.__kill(B.live); await window.__w(2); const w2 = B.live.map(m => m.calType).sort().join(); window.__kill(B.live); await window.__w(2.2); await window.__w(1); return { w1, w2, g1, open: D.M.marks['1'].every(p => D.M.G[p.ty * D.M.MW + p.tx] === 1), i: B.i, goal: document.getElementById('arcGoal').textContent }; });
  ok(r.w1 === 'cinderslug,cinderslug,cinderslug' && r.w2.split(',').every(t => t === 'cinderslug') && r.g1 && r.open && r.i === 1, 'hollows: the first hollow teaches cinder slugs alone (3, then 4); its slag gate lifts when they fall', r);
  await shot('hollows-wave');
  r = await M(() => window.__clear()); ok(r.done && r.killed === r.total && r.total === r.all, 'hollows: the brood cleared hollow by hollow', r);
  ok(r.waves[0].split('+').every(t => t === 'basaltcrawler') && r.waves[2].split('+').every(t => t === 'emberwisp') && r.waves.some(w => new Set(w.split('+')).size === 3), 'hollows: crawlers alone, then wisps alone, then all three kinds mixed', r.waves);
  await T.runG(1.4);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; D.me.x = 16.5; D.me.y = 19; await window.__w(0.6); const f = mod.S.flow; return { hatch: mod.hatch.open, entered: mod.S.entered, basins: f.basins, mist: f.mist.length, live: D.mons.filter(m => !m.dead).length, goal: document.getElementById('arcGoal').textContent }; });
  ok(r.hatch && r.entered && !(r.basins[0] && r.basins[1]) && r.mist > 0 && r.live === 0 && /Frost to both basins/.test(r.goal), 'hollows: the hatch opens on the cavern; the causeway starts scrambled, misting; no monsters', r);
  await T.runG(0.5); await shot('hollows-causeway');
  const turnTo = ids => M(async ids => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, CS = self.__CAL_STAGES.HOLLOWS;
    for (const id of ids) { const i = mod.pieces.findIndex(p => p.id === id); let n = 0; while (CS.portsOf(CS.cells[id].kind, mod.S.rot[id]) !== CS.cells[id].need && n < 4) { const u = await window.__use('calconduit', i, [0.05, 0.1]); await window.__w(0.15, () => { D.me.x = mod.pieces[i].x + 2.6; D.me.y = mod.pieces[i].y + 1.5; }); if (u) n++; else break; } }
    await window.__w(1.6, () => { D.me.x = 16.5; D.me.y = 19; }); return { basins: mod.S.flow.basins, primed: mod.S.primed }; }, ids);
  r = await turnTo(['J', 'K', 'I']); ok(r.basins[0] && !r.primed, 'hollows: one branch alone never primes', r);
  r = await turnTo(['k', 'V']); await T.runG(1.4); r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return { basins: m.S.flow.basins, primed: m.S.primed }; });
  ok(r.basins[0] && r.basins[1] && r.primed, 'hollows: both branches at once prime the reservoir', r);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; const u = await window.__use('calreservoir', 0, [1.3, 0]); await window.__w(4, () => { D.me.x = 16.5; D.me.y = 12; }, () => mod.S.latched); const mw = D.M.MW;
    return { used: u, latched: mod.S.latched, bridge: D.M.marks.b.every(p => D.M.G[p.ty * mw + p.tx] === 5), exit: !!D.RIFT.exit }; });
  ok(r.used && r.latched && r.bridge && r.exit, 'hollows: the pet releases the frost; the bridge sets for good; the door to Fire Flan opens', r);
  await T.runG(0.6); await shot('hollows-latched');
  await exitStage(); r = await T.rs(); ok(r.prog.caldera === idx.H + 1, 'hollows: the door ends the stage (checkpoint: Fire Flan next)', r.prog);
  await start('HOLLOWS'); await T.runG(1.4); await M(() => window.__clear());
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; await window.__w(1.4); D.me.x = 16.5; D.me.y = 19; await window.__w(0.8); mod.S.cavT = 41; await window.__w(0.4); const steps = []; let guard = 0;
    while (!mod.S.primed && guard++ < 25) { const h = mod.hint(); if (!h) break; const i = mod.pieces.findIndex(p => Math.abs(p.x - h.x) < 0.01 && Math.abs(p.y - h.y) < 0.01); if (i < 0) break; steps.push(mod.pieces[i].id); await window.__use('calconduit', i, [0.05, 0.1]); await window.__w(0.15, () => { D.me.x = 16.5; D.me.y = 19; }); }
    await window.__w(1.8, () => { D.me.x = 16.5; D.me.y = 19; }, () => mod.S.primed); return { hint: mod.S.hint, steps, primed: mod.S.primed }; });
  ok(r.hint && r.steps.length >= 3 && r.primed, 'hollows: after the delay, following the traced hint alone primes the reservoir', r);

  }
  if (ONLY.includes('F')) {
  /* ======================= THE RUNEBOUND FOUNDRY ======================= */
  await start('FOUNDRY'); await T.runG(1.6);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; return { door: D.M.marks.D.every(p => D.M.G[p.ty * mw + p.tx] === 0), gates: ['1', '2', '3', '4'].map(ch => D.M.marks[ch].every(p => D.M.G[p.ty * mw + p.tx] === 0)), rings: mod.S.rings, total: mod.brood.total, levers: D.RIFT.objs.filter(o => o.kind === 'callever').length }; });
  ok(r.door && r.gates.every(Boolean) && r.rings.join() === '0,0,0' && r.levers === 3 && r.total >= 36 && r.total <= 44, 'foundry: four halls behind portcullises (the last guards the ring hall), about forty brood, the door shut', r);
  await shot('foundry-start');
  r = await M(() => window.__clear(2)); ok(r.i === 2 && r.waves[0].split('+').every(t => t === 'furnaceimp') && r.waves[2].split('+').every(t => t === 'runicsentinel'), 'foundry: imps alone, then sentinels alone', r.waves);
  // the bomb hall: the lesson inside an ordinary pack
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.brood, R = B.room(); D.me.x = R.spots[2].x; D.me.y = (R.y0 + R.y1) / 2; await window.__w(0.5); const types = B.live.map(m => m.calType || m.type).sort().join();
    for (const m of B.live) if (!m.calTutorial) { m.aggro = false; m.cd = 99; m.atkCd = 99; }
    await window.__w(5, () => { for (const m of B.live) if (!m.calTutorial) { m.aggro = false; m.cd = 99; } }, () => mod.bomb.st === 'ground' && mod.bomb.safe());
    return { types, st: mod.bomb.st, safe: mod.bomb.safe(), goal: document.getElementById('arcGoal').textContent, hint: (mod.hint() || {}).label }; });
  ok(r.types === 'bomblarva,furnaceimp,runicsentinel' && r.st === 'ground' && r.safe && /Return the bomb/.test(r.goal) && r.hint === 'RETURN IT', 'foundry: the bomb hall\'s first wave is an imp, a sentinel and a bomb larva; it lands and the goal says to return it', r);
  await T.runG(0.3); await shot('foundry-bomb');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.bomb, foes = mod.brood.live.filter(m => m !== B.m && !m.dead), hp0 = foes.map(m => m.hp), me0 = D.me.hp;
    D.hitMon(B.m, 3, {}); await window.__w(2.5, () => { for (const m of foes) { m.aggro = false; m.cd = 99; m.atkCd = 99; } }, () => B.st === 'done' && foes.some(m => m.dead || m.hp < m.maxhp), false);
    return { st: B.st, returned: B.returned, dmg: foes.map((m, i) => m.dead ? 'dead' : +(hp0[i] - m.hp).toFixed(1)), pet: +(me0 - D.me.hp).toFixed(1) }; });
  ok(r.returned === 1 && r.dmg.some(d => d === 'dead' || d > 0) && r.pet <= 0, 'foundry: hit while safe, the bomb flies back into a foe; the pet takes nothing', r);
  r = await M(() => window.__clear()); ok(r.done && r.killed === r.total, 'foundry: all four halls cleared', { killed: r.killed, total: r.total });
  ok(r.waves.some(w => w.includes('bomblarva') && w.includes('runicsentinel') && w.includes('furnaceimp')), 'foundry: the great forge mixes all three kinds', r.waves.slice(-3));
  await T.runG(1.4);
  r = await M(() => { const D = window.__pp.arc.game._dbg; return D.M.marks['4'].every(p => D.M.G[p.ty * D.M.MW + p.tx] === 1); }); ok(r, 'foundry: the last portcullis rises on the ring hall');
  const pull = id => M(async id => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, i = mod.levers.findIndex(l => l.id === id); const u = await window.__use('callever', i, [0.1, 0.9]); await window.__w(0.2, () => { D.me.x = 17.5; D.me.y = 15; }); return { u, rings: mod.S.rings.slice(), solved: mod.S.solved }; }, id);
  r = await pull('A'); ok(r.rings.join() === '1,1,0', 'foundry: A: Chain, Chain, Eye', r); r = await pull('C'); ok(r.rings.join() === '2,1,1', 'foundry: C: Crown, Chain, Chain', r);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; await window.__use('calreset', 0, [0.1, 0.9]); await window.__w(0.2, () => { D.me.x = 17.5; D.me.y = 15; }); return mod.S.rings.slice(); }); ok(r.join() === '0,0,0', 'foundry: reset sets every ring to EYE', r);
  for (const l of ['B', 'B', 'A', 'C', 'B', 'A', 'A']) await pull(l);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, F = self.__CAL_STAGES.FOUNDRY, s0 = mod.S.rings.slice(), plan = F.plan(s0), moves = []; let guard = 0;
    while (!mod.S.solved && guard++ < 6) { await window.__use('callectern', 0, [0.1, 0.9]); await window.__w(0.2, () => { D.me.x = 17.5; D.me.y = 15; }); const want = mod.S.hintMove; if (!want) return { err: 'no hint' }; moves.push(want);
      await window.__use('callever', mod.levers.findIndex(l => l.id === want), [0.1, 0.9]); await window.__w(0.2, () => { D.me.x = 17.5; D.me.y = 15; }); }
    await window.__w(4, null, () => !!D.RIFT.exit); return { s0, plan, moves, solved: mod.S.solved, opened: mod.S.opened, exit: !!D.RIFT.exit, beat: mod.S.beatT > 0 }; });
  ok(r.solved && r.moves.length === r.plan.length && r.opened && r.exit && r.beat, 'foundry: from a scramble, "show next move" solves it in the fewest moves; the iris, the door, the heartbeat, the way on', r);
  await shot('foundry-open');
  await exitStage(); r = await T.rs(); ok(r.prog.caldera === idx.F + 1, 'foundry: the door ends the stage (Bomb King next)', r.prog);

  }
  if (ONLY.includes('D')) {
  /* ======================= THE HEARTWARD DESCENT ======================= */
  await start('DESCENT'); await T.runG(1.4);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; const hp0 = D.me.hp, s = D.M.start, v = mod.vents[0]; let sawWarn = false, sawErupt = false;
    await window.__w(9, () => { D.me.x = s.x; D.me.y = s.y; if (v.ph === 'warn') sawWarn = true; if (v.ph === 'erupt') sawErupt = true; }, () => mod.S.demo === 2, false);
    return { sawWarn, sawErupt, demo: mod.S.demo, lost: hp0 - D.me.hp, live: mod.vents.filter(q => q.live).map(q => q.lane), total: mod.brood.total, gates: ['X', 'U', 'W'].map(ch => D.M.marks[ch].every(p => D.M.G[p.ty * D.M.MW + p.tx] === 0)) }; });
  ok(r.sawWarn && r.sawErupt && r.demo === 2 && r.lost === 0 && r.live.join() === '0,0,0', 'descent: the first vent shows itself harmlessly, then the first causeway runs', r);
  ok(r.total >= 36 && r.total <= 44 && r.gates.every(Boolean), 'descent: about forty brood on three ledges; three slag gates shut', r);
  await shot('descent-demo');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, v = mod.vents[1]; D.me.hp = D.ST.hp; const hp0 = D.me.hp; let at = null;
    await window.__w(8, () => { if (!at && mod.S.falls === 0) { D.me.x = v.x; D.me.y = v.y; D.me.inv = 0; } }, () => mod.S.falls > 0 && (at = at || 1), false); await window.__w(0.1, null, null, false);
    return { falls: mod.S.falls, lost: +(hp0 - D.me.hp).toFixed(1), max: D.ST.hp, ledge: mod.ledgeOf(D.me.y) }; });
  ok(r.falls === 1 && r.lost > 0 && r.lost <= r.max * 0.12 && r.ledge === 0, 'descent: an eruption throws the pet back to ledge 0 (~10%)', r);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.brood, R = B.room(); D.me.x = 16.5; D.me.y = (R.y0 + R.y1) / 2; await window.__w(0.6); const w1 = B.live.map(m => m.calType).sort().join(); return { w1, room: B.i, wave: B.wave }; });
  ok(r.w1 === 'ashenknight,ashenknight' && r.room === 0 && r.wave === 0, 'descent: on the first ledge, two ashen knights rise first', r);
  await shot('descent-ledge1');
  r = await M(() => window.__clear(1)); r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; await window.__w(1.6); return { x: D.M.marks.X.every(p => D.M.G[p.ty * D.M.MW + p.tx] === 1), lane2: mod.vents.filter(v => v.lane === 1 && v.live).length, lane3: mod.vents.filter(v => v.lane === 2 && v.live).length }; });
  ok(r.x && r.lane2 === 3 && r.lane3 === 0, 'descent: the first ledge clear, its slag gives way and the second causeway wakes', r);
  r = await M(() => window.__clear()); ok(r.done && r.killed === r.total && r.waves.some(w => w.split('+').every(t => t === 'crystalwisp')), 'descent: all three ledges cleared (crystal wisps taught alone)', { killed: r.killed, total: r.total, waves: r.waves });
  // the Ember Court: twelve dodged throws open the way to the overlook
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; await window.__w(1.6); const w = D.M.marks.W.every(p => D.M.G[p.ty * D.M.MW + p.tx] === 1); const c = mod.ecIn ? null : 0;
    D.me.x = 16.5; D.me.y = 27.5; await window.__w(0.6); const C = mod.court; return { w, on: C.on, exit: !!D.RIFT.exit, live: D.mons.filter(m => !m.dead).length, idols: Object.keys(mod.idols).length, y: D.M.marks.Y.every(p => D.M.G[p.ty * D.M.MW + p.tx] === 0), goal: document.getElementById('arcGoal').textContent }; });
  ok(r.w && r.on && !r.exit && r.live === 0 && r.idols === 6 && r.y && /Dodged 0\/12/.test(r.goal), 'descent: the last slag gives way on the Ember Court: six furnace idols, no monsters, the gate shut, "Dodged 0/12"', r);
  await M(() => { // __court(secs, mode, until): 'roll' presses DODGE (the real key) as a ball reaches the pet; 'stand' does nothing; 'step' side-steps at the last moment
    window.__force = n => { const C = window.__pp.arc.game._dbg.RIFT.self.mod.court; C.winds.length = 0; C.balls.length = 0; C.count = n; C.next = 0.01; };
    window.__court = async (secs, mode, until, keepHp) => { const P = window.__pp, G = P.arc.game, D = G._dbg, mod = D.RIFT.self.mod, C = mod.court, me = D.me; const home = { x: 16.5, y: 25.5 };
      await window.__w(secs, () => { if (mode !== 'free') { const d0 = Math.hypot(me.x - home.x, me.y - home.y); if (!me.dodge && d0 > 0.05 && mode !== 'step') { me.x += (home.x - me.x) * 0.2; me.y += (home.y - me.y) * 0.2; } }
        for (const b of C.balls) { if (b.res) continue; const dd = Math.hypot(me.x - (b.kind === 'lob' ? b.tx : b.x), me.y - (b.kind === 'lob' ? b.ty : b.y));
          if (mode === 'roll' && !me.dodge && (b.kind === 'lob' ? b.dur - b.t < 0.12 && dd < b.R : dd < b.r + 0.9)) G.key('dodge', true);
          if (mode === 'step' && b.kind !== 'lob' && dd < 1.4) { const v = Math.hypot(b.vx, b.vy) || 1; me.x += -b.vy / v * 0.25; me.y += b.vx / v * 0.25; }
          if (mode === 'step' && b.kind === 'lob' && dd < b.R + 0.3) { me.x += (me.x - b.tx) / (dd || 1) * 0.2; me.y += (me.y - b.ty) / (dd || 1) * 0.2; } } }, until, keepHp); return { count: C.count, hits: C.hits, voids: C.voids, far: C.far, log: C.log.slice(), done: C.done, winds: C.winds.length, balls: C.balls.length }; }; });
  // the first, teaching throw: slow, from the front, TAP DODGE!
  r = await M(async () => { const D = window.__pp.arc.game._dbg, C = D.RIFT.self.mod.court; await window.__court(4, 'stand', () => C.winds.length > 0 && C.winds[0].t > 0.6); const w = C.winds[0]; return { teach: w && w.teach, from: w && w.th.id, prompt: C.prompt > 0, dur: w && w.dur, speed: w && w.speed }; });
  ok(r.teach && r.from === 'NE' && r.prompt && r.dur >= 1.4 && r.speed < 5, 'descent: the first throw is a slow teaching throw from the front, with the TAP DODGE prompt', r);
  await shot('court-teach');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, C = D.RIFT.self.mod.court, hp0 = D.me.hp; const o = await window.__court(5, 'stand', () => C.hits > 0, false); return Object.assign(o, { lost: +(hp0 - D.me.hp).toFixed(1), max: D.ST.hp }); });
  ok(r.hits === 1 && r.count === 0 && r.lost > 0 && r.lost <= r.max * 0.08, 'descent: a throw that hits only chips (≤8%) and does not count', r);
  r = await M(async () => { const C = window.__pp.arc.game._dbg.RIFT.self.mod.court; return window.__court(6, 'roll', () => C.count >= 1); });
  ok(r.count === 1 && r.log.includes('roll'), 'descent: rolling through a throw with the DODGE key counts it', r);
  r = await M(async () => { const C = window.__pp.arc.game._dbg.RIFT.self.mod.court; return window.__court(6, 'step', () => C.count >= 2); });
  ok(r.count === 2 && r.log.includes('step'), 'descent: side-stepping a throw at close range counts it too', r);
  r = await M(async () => { const C = window.__pp.arc.game._dbg.RIFT.self.mod.court, h0 = C.hits; const o = await window.__court(6, 'stand', () => C.hits > h0); return o; });
  ok(r.count === 2 && r.hits >= 2, 'descent: a later hit never resets the counter', r);
  // the escalation: crossfire, the rolling ball, the lobbed ball, the final volley
  r = await M(async () => { const C = window.__pp.arc.game._dbg.RIFT.self.mod.court; window.__force(5); await window.__court(4, 'stand', () => C.winds.length >= 2); return { ids: C.winds.map(w => w.th.id), n: C.winds.length }; });
  ok(r.n >= 2 && r.ids.includes('W') && r.ids.includes('E'), 'descent: at five, a crossfire from both sides at once', r);
  await shot('court-crossfire');
  r = await M(async () => { const C = window.__pp.arc.game._dbg.RIFT.self.mod.court; await window.__court(5, 'roll', () => !C.winds.length && !C.balls.length); window.__force(7); await window.__court(3, 'roll', () => C.winds.length > 0); const k1 = C.winds.map(w => w.kind);
    await window.__court(6, 'roll', () => !C.winds.length && !C.balls.length); window.__force(8); await window.__court(4, 'stand', () => C.balls.some(b => b.kind === 'lob' && b.t > 0.5)); const k2 = C.balls.map(b => b.kind); return { k1, k2 }; });
  ok(r.k1.includes('roll') && r.k2.includes('lob'), 'descent: then a rolling ball, then a lobbed ball with its landing circle', r);
  await shot('court-lob');
  r = await M(async () => { const C = window.__pp.arc.game._dbg.RIFT.self.mod.court; await window.__court(5, 'roll', () => !C.balls.length && !C.winds.length); window.__force(9); await window.__court(3, 'roll', () => C.winds.length + C.balls.length >= 2); return { ids: C.winds.map(w => w.th.id), balls: C.balls.length, count: C.count }; });
  ok(r.ids.length + r.balls >= 2, 'descent: from nine, the final volley of three quick throws', r);
  await shot('court-volley');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, C = mod.court; const o = await window.__court(40, 'roll', () => C.done); await window.__w(2, null, () => !!D.RIFT.exit);
    return Object.assign(o, { exit: !!D.RIFT.exit, gate: D.M.marks.Y.every(p => D.M.G[p.ty * D.M.MW + p.tx] === 1), cool: Object.values(mod.idols).every(i => i.cool > 0), goal: document.getElementById('arcGoal').textContent }); });
  ok(r.done && r.count === 12 && r.exit && r.gate && r.cool, 'descent: twelve dodged: the idols go dark, the gate and the way to Ifrit open', r);
  await M(() => { const D = window.__pp.arc.game._dbg; D.me.x = 16.5; D.me.y = 22; }); await T.runG(1.2); await shot('court-done');
  await M(() => { const D = window.__pp.arc.game._dbg; D.me.x = 16.5; D.me.y = 14; }); await T.runG(1.0); await shot('descent-overlook');
  await exitStage(); r = await T.rs(); ok(r.prog.caldera === idx.D + 1, 'descent: the door ends the stage (Ifrit next)', r.prog);

  }
  ok(errors.length === 0, 'no page errors', errors.slice(0, 4));
  console.log(fails ? `${fails} FAILED` : 'all ok'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
