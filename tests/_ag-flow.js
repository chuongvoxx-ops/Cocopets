// v435 AG: the Gate of Aries end to end.
// Run A (the built-in stand-in guardian): the gate opens from the Rift UI once the caldera is sealed; the three yards played
// through the stage's own flip() and pour(): wrong pours (quenched, cold, a brazier short) fail and retry with the levers kept,
// the levers lock while the ember runs, the ram switch rocks over and springs back after a failed pour, the hint after three
// fails; the door opens (fire up the jambs, the bar, the leaves), the pet crosses, the door seals, the Forge Warden rises and
// falls -> X.winStage -> the gate is done and Aries is unlocked; closing the stage lets go of everything.
// Run B (a stand-in ARIES_BOSS, window.__AG_BOSS): begin() gets the altar's geometry and hooks; update/drawGround/goal/stop.
// Run C (window.__AG_NOBOSS = 1): the old flow, Aries wakes as the door seals. Also: the developer unlock opens the gate unsealed.
// HTML=test-ag.html node tests/_ag-flow.js   (SHOTS=1 takes the shots into shots/v435-AG/ with the GPU painter forced on, GL=1 forces it without shots, DPR=3 for the DPR 3 set, ONLY=A|B|C)
const { open } = require('./_ag-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const DPR = +(process.env.DPR || 1), SH = !!process.env.SHOTS, GL = SH || process.env.GL === '1', tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR;
(async () => {
  const runOne = async (mode) => {
    const T = await open({ dpr: DPR, seal: mode !== 'C' }); const { page, M, run, runG, goTo, until, errors } = T;
    const shot = async name => { if (SH) await T.shot('v435-AG', `${name}-${tag}`); };
    await page.evaluate(([m, gl]) => { window.__AG_FAST = 3; if (gl) window.__NG_GL = 1; if (m === 'A' && window.ARIES_GATE) window.__AG_BOSS = window.ARIES_GATE.STANDIN;   /* (v435 SB: ARIES_BOSS now holds the altar; run A keeps the stand-in it was written for; the real boss: tests/_sb-*.js) */ if (m === 'C') window.__AG_NOBOSS = 1; if (m === 'B') { const L = window.__AGLOG = { begin: null, upd: 0, dg: 0, stop: 0 }; window.__AG_BOSS = { begin(X, H, self, A) { L.begin = A; L.A = A; }, update() { L.upd++; }, drawGround() { L.dg++; }, stop() { L.stop++; }, active: () => true, goal: () => 'Defeat the stand-in' }; } }, [mode, GL]);
    // the Rift UI: the caldera's gate listed (first), open once sealed (or with the developer unlock)
    let r = await M(m => { const P = window.__pp; if (m === 'C') P.st.unlockAll = true; P.renderRift(); const g = [...document.querySelectorAll('.rf-gate')]; const first = g[0] ? g[0].textContent : ''; return { n: g.length, first, aries: g.filter(e => /Ramforge/.test(e.textContent)).length, btn: !!(g[0] && g[0].querySelector('[data-rift="gate"][data-id="caldera"]')), open: P.gateOpen('caldera'), dup: g.filter(e => /Switchyard/.test(e.textContent)).length }; }, mode);
    ok(r.aries === 1 && /Ramforge/.test(r.first) && r.btn && r.open && r.dup === 0 && r.n === 12, `${mode}: the Rift UI lists the Ramforge first, open (${mode === 'C' ? 'developer unlock' : 'caldera sealed'}), with its Trial button; Rift 12's unbuilt Aries gate left off ` + JSON.stringify(r));
    if (mode === 'A') { r = await M(() => { const P = window.__pp; P.riftState().seals.caldera = 0; const o = P.gateOpen('caldera'); P.riftState().seals.caldera = 1; return o; }); ok(r === false, 'A: unsealed and without the developer unlock the gate stays shut'); }
    if (mode === 'A' && SH) { await M(() => { const P = window.__pp; P.renderRift(); const e = document.querySelector('.rf-gates'); if (e) e.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(300); await shot('ui-gates'); }
    await M(() => { const P = window.__pp; const b = document.querySelector('[data-rift="gate"][data-id="caldera"]'); if (b) b.click(); else P.startGate('caldera'); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 }); await M(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
    ok(await until('m.R.mode === "play" && !!m.yard', 0, 60), `${mode}: the switchyard's first yard is laid`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, Mp = D.M, bi = n => window.__pp.BIOME_ORDER[Mp.BI[n]], at = (x, y) => Mp.G[y * Mp.MW + x];
      return { phase: m.S.phase, arena: bi(12 * Mp.MW + 16), chamber: bi(27 * Mp.MW + 16), A: Mp.marks.A && Mp.marks.A[0], door: at(16, 21), props: [...new Set(D.propList.map(p => p.kind))].sort().join(','), ap: window.ARIES_PROPS.stats, edge: (Mp.decalsByChunk.get('1,1') || []).some(d => d.kind === 'agedge'), btn: !!document.getElementById('agPour'), gl: !!(window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX && window.NIDHOGG_MOVES.FGFX.usable()), name: D.F.name }; });
    ok(r.phase === 'puzzle' && r.arena === 'agaltar' && r.chamber === 'agyard' && r.btn, `${mode}: the gate loads: the yard's land and the altar's, the Pour button ` + JSON.stringify({ phase: r.phase, arena: r.arena, chamber: r.chamber, gl: r.gl, name: r.name }));
    ok(r.A && Math.abs(r.A.x - 16.5) < 0.01 && r.door === 0 && r.edge && /agpillar/.test(r.props) && /agruin/.test(r.props), `${mode}: the altar's mark at its centre, the door shut, its edge over the chunks, the columns as props ` + r.props);
    r.jobs = await M(() => window.__pp.RIFT_GATES.caldera.preload({ T: window.ARIES_PROPS.base || 48, k: 1 }).length);
    ok(r.ap.cached >= 12 && r.jobs === 23, `${mode}: the loading pass is handed every picture (a slow software GPU may run out of loading time first: the rest are painted in the first frames) ` + JSON.stringify({ cached: r.ap.cached, jobs: r.jobs, ms: Math.round(r.ap.paintMs) }));
    const pourRun = async () => { await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.pour()); await until('m.R.run && m.R.run.done', 0, 90); const o = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod, run = m.R.run; return { done: run && run.done, dead: run && run.dead, why: m.R.lastFail, braz: run ? run.braz.size : 0, kindled: run && run.kindled, lit: m.S.lit, fails: m.R.fails.slice() }; }); await until('!m.R.run || (m.R.run.done && !m.R.run.dead)', 0, 30); return o; };
    if (mode === 'A') {
      await goTo(15.0, 27.3); await runG(1.4); await shot('yard1');
      // yard 1: A points east (a quench trough) -> fail; the levers lock while it runs; A west, B west -> quenched again; B north -> the west furnace
      r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod, p = m.pour(); return { p, locked: m.flip('A') === false, cur: m.yard.nodes.A.cur, again: m.pour() }; });
      ok(r.p && r.locked && r.cur === 1 && r.again === false, 'A: while the ember runs the levers are locked and it cannot be poured twice ' + JSON.stringify(r));
      await until('m.R.run && m.R.run.trail.length > 8', 0, 30); await shot('yard1-ember');
      await until('m.R.run && m.R.run.done', 0, 60); await run(0.25); await shot('yard1-quench');
      r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return { why: m.R.lastFail, fails: m.R.fails[0], steam: m.S.steam.length }; });
      ok(r.why === 'quench' && r.fails === 1 && r.steam > 0, 'A: yard 1, A east: the ember is quenched (steam), one fail ' + JSON.stringify(r));
      await until('!m.R.run', 0, 30);
      r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return { flipped: m.flip('A'), cur: m.yard.nodes.A.cur, b: m.yard.nodes.B.cur }; }); ok(r.flipped && r.cur === 0 && r.b === 1, 'A: the lever turns once the ember is gone, the other keeps its setting ' + JSON.stringify(r));
      r = await pourRun(); ok(r.dead && r.why === 'quench' && r.fails[0] === 2, 'A: A west, B west: quenched in the west trough ' + JSON.stringify(r));
      // the lever by standing at it (the engine's channel): B
      r = await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, o = m.lev.find(l => l.node && l.node.id === 'B'); D.me.x = o.x + 0.3; D.me.y = o.y + 0.2; D.me.vx = D.me.vy = 0; const t0 = performance.now(); while (performance.now() - t0 < 20000 && m.yard.nodes.B.cur !== 0) { await new Promise(r => requestAnimationFrame(r)); D.me.vx = D.me.vy = 0; } return m.yard.nodes.B.cur; });
      ok(r === 0, 'A: standing still beside lever B turns it (north)');
      r = await pourRun(); ok(!r.dead && r.lit === 1, 'A: A west, B north: the west furnace wakes, the first socket lights ' + JSON.stringify(r));
      await goTo(13.5, 26.0); await runG(1.0); await shot('yard1-furnace');
      ok(await until('m.R.yard === 1 && m.R.mode === "play"', 0, 60), 'A: the second yard is laid');
      r = await M(() => window.ARIES_PROPS.stats.cached); ok(r >= 15, 'A: by now every picture in view has been painted ' + r);
      // yard 2: A east -> the east furnace cold; A west, E west -> quenched; E north, D north -> quenched; D east -> kindled, the east furnace wakes
      r = await pourRun(); ok(r.why === 'cold' && !r.kindled, 'A: yard 2, straight to the east furnace: too cold ' + JSON.stringify(r));
      await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.flip('A')); r = await pourRun(); ok(r.why === 'quench', 'A: E pointing west: quenched ' + JSON.stringify(r));
      await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.flip('E')); r = await pourRun(); ok(r.why === 'quench' && r.kindled, 'A: through the kiln (kindled), D west: quenched ' + JSON.stringify(r));
      r = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.hint()); ok(r && /lever/i.test(r.label) && Math.abs(r.x - (12.5 + 0.95)) < 0.01, 'A: after three failed pours the hint points at lever D ' + JSON.stringify(r));
      await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.flip('D'));
      await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.pour()); await until('m.R.run && m.R.run.kindled', 0, 60); await goTo(14.6, 28.2); await runG(0.12); await shot('yard2-kiln');
      await until('m.R.run && m.R.run.done', 0, 60); r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return { dead: m.R.run.dead, lit: m.S.lit, furn: m.S.furn }; });
      ok(!r.dead && r.lit === 2 && r.furn.E === 1, 'A: kindled, D east: the east furnace wakes ' + JSON.stringify(r));
      ok(await until('m.R.yard === 2 && m.R.mode === "play"', 0, 60), 'A: the third yard is laid');
      // yard 3: P east, Wv south -> quenched; Wv north -> the door with one brazier; P west, Z north -> quenched; Z south -> both braziers, the door
      r = await pourRun(); ok(r.why === 'quench' && r.braz === 1, 'A: yard 3, the ram switch east: brazier 2, quenched ' + JSON.stringify(r));
      r = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.yard.nodes.P.cur); ok(r === 1, 'A: after the failed pour the ram switch springs back to where it was set');
      await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.flip('Wv')); r = await pourRun(); ok(r.why === 'braz' && r.braz === 1, 'A: to the door with one brazier: the door stays dark ' + JSON.stringify(r));
      await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.flip('P')); r = await pourRun(); ok(r.why === 'quench' && r.braz === 1, 'A: the ram switch west, Z north: quenched after brazier 1 ' + JSON.stringify(r));
      await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.flip('Z'));
      await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.pour()); r = await until('m.R.run && m.R.run.braz.size === 1 && m.R.run.visits >= 4', 0, 60); await goTo(16.5, 28.0); await runG(0.1); await shot('yard3-loop');
      r = await until('m.R.run && m.R.run.braz.size === 2', 0, 60); r = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.yard.nodes.P.cur); ok(r === 0, 'A: on its second pass the ram switch sent the ember east and rocked back');
      await shot('yard3-braziers'); await until('m.R.run && m.R.run.done', 0, 60);
      r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return { dead: m.R.run && m.R.run.dead, lit: m.S.lit, mode: m.R.mode, btn: !!document.getElementById('agPour') }; });
      ok(!r.dead && r.lit === 3 && r.mode === 'won' && !r.btn, 'A: both braziers, the door fed: the yard is done, its button gone ' + JSON.stringify(r));
      ok(await until('m.S.phase === "opening"', 0, 60), 'A: the great door begins to open');
      await goTo(16.5, 26.0); await until('m.S.climb >= a', 0.7, 60); await shot('door-climb'); await until('m.S.bar >= a', 0.5, 60); await shot('door-bar'); await until('m.S.open >= a', 0.45, 60); await shot('door-parting');
    } else { await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.solve()); ok(await until('m.S.phase === "opening"', 0, 60), `${mode}: (solved) the door opens`); }
    ok(await until('m.S.phase === "open"', 0, 300), `${mode}: the door opens fully`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, Mp = D.M, at = (x, y) => Mp.G[y * Mp.MW + x]; return { tiles: [at(15, 21), at(16, 21), at(17, 21)], hint: !!D.RIFT.hintObj(), goal: document.getElementById('arcGoal').textContent }; });
    ok(r.tiles.every(t => t === 1) && r.hint && /great door/i.test(r.goal), `${mode}: the door's three tiles are floor, the way is pointed out ` + JSON.stringify(r));
    if (mode === 'A') { await goTo(16.5, 25.0); await runG(1.4); await shot('door-open'); }
    await goTo(16.5, 21.5); await run(0.3); await goTo(16.5, 19.4); await run(0.3);
    ok(await until('m.S.phase === "boss" || m.S.phase === "won"', 0, 30), `${mode}: crossing into the altar seals the door`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, Mp = D.M, at = (x, y) => Mp.G[y * Mp.MW + x]; return { phase: m.S.phase, tiles: [at(15, 21), at(16, 21), at(17, 21)], me: [D.me.x, D.me.y], done: D.RIFT.done }; });
    ok(r.tiles.every(t => t === 0) && r.me[1] < 21, `${mode}: the door is shut again, the pet on the altar ` + JSON.stringify({ tiles: r.tiles, me: r.me }));
    if (mode === 'A') {
      ok(r.phase === 'boss', 'A: the stand-in guardian takes the altar ' + r.phase);
      ok(await until('window.ARIES_GATE.STANDIN.S && window.ARIES_GATE.STANDIN.S.m', 0, 30), 'A: the Forge Warden rises');
      r = await M(() => { const S = window.ARIES_GATE.STANDIN.S, m = S.m; return { name: m.bname, hp: m.hp, boss: m.boss, goal: document.getElementById('arcGoal').textContent, heat: window.__pp.arc.game._dbg.RIFT.self.mod.S.heat }; });
      ok(/Forge Warden/.test(r.name) && r.hp > 0 && /Forge Warden/.test(r.goal) && r.heat > 1, 'A: the Warden in the goal line, the altar\'s fire raised ' + JSON.stringify(r));
      await goTo(16.5, 15.5); await runG(1.5); await shot('arena-standin');
      await M(() => { const m = window.ARIES_GATE.STANDIN.S.m; m.x = 27.5; m.y = 15.0; m.aggro = false; m.spd0 = m.spd; m.stunT = 999; });   // (the Warden held aside for the views)
      for (const [n, x, y] of [['arena', 16.5, 12.9], ['arena-north', 16.5, 5.6], ['arena-west', 6.4, 12.5], ['arena-east', 26.4, 11.0], ['arena-south', 16.5, 19.2]]) { await goTo(x, y); await runG(1.6); await shot(n); }
      await M(() => { window.__pp.st.lowFx = true; }); await goTo(16.5, 12.9); await runG(1.2); await shot('arena-lowfx'); await M(() => { window.__pp.st.lowFx = false; });
      await M(() => { const D = window.__pp.arc.game._dbg, m = window.ARIES_GATE.STANDIN.S.m; D.hitMon(m, m.hp * 10, { flat: true }); if (!m.dead) { m.hp = 0; m.dead = true; } });
      ok(await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 60000 }).then(() => true, () => false), 'A: the Warden falls: the stage is won');
      await page.waitForTimeout(800);
      r = await M(() => { const P = window.__pp; return { gate: P.riftState().gates.caldera, have: P.st.animas.have.aries, txt: (document.getElementById('arcPanel') || {}).textContent || '' }; });
      ok(r.gate === 1 && r.have >= 1 && /Samael|Aries/.test(r.txt), 'A: the gate is done and Aries (Samael) is unlocked ' + JSON.stringify({ gate: r.gate, have: r.have }));
    } else if (mode === 'B') {
      const A = await M(() => { const A = window.__AGLOG.begin; return A && { cx: A.cx, cy: A.cy, rx: A.rx, ry: A.ry, sen: A.sen, ax0: A.ax0, ax1: A.ax1, ay0: A.ay0, ay1: A.ay1, door: A.door, inC: A.inside(A.cx, A.cy), inOut: A.inside(A.cx + A.rx + 1, A.cy), glyph: A.glyph.length, rings: A.rings, arch: A.arch }; });
      ok(r.phase === 'boss' && A && Math.abs(A.cx - 16.5) < 0.01 && A.rx > 10.5 && A.ry > 7.5 && A.ax1 - A.ax0 >= 20 && A.door && A.inC && !A.inOut && A.glyph === 3 && A.rings.length === 2 && A.arch, 'B: ARIES_BOSS.begin gets the altar and its hooks ' + JSON.stringify(A));
      await M(() => window.__AGLOG.A.heat(2)); await runG(2.0); r = await M(() => ({ upd: window.__AGLOG.upd, dg: window.__AGLOG.dg, goal: document.getElementById('arcGoal').textContent, heat: window.__pp.arc.game._dbg.RIFT.self.mod.S.heatK }));
      ok(r.upd >= 2 && r.dg >= 2 && /stand-in/.test(r.goal) && r.heat > 1.5, 'B: the boss\'s update, drawGround and goal are called; heat() raises the floor\'s fire ' + JSON.stringify(r));
    } else {
      ok(r.phase === 'won' && r.done, 'C: without the boss, Aries wakes as before ' + JSON.stringify({ phase: r.phase, done: r.done }));
      ok(await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 30000 }).then(() => true, () => false), 'C: the gate is won (the stage ends)');
      r = await M(() => window.__pp.riftState().gates.caldera); ok(r === 1, 'C: the gate is marked done');
    }
    r = await M(async () => { const P = window.__pp; P.closeArcade(true); await new Promise(r => setTimeout(r, 400)); return { live: !!window.ARIES_GATE.live, cached: window.ARIES_PROPS.stats.cached, btn: !!document.getElementById('agPour'), stand: window.ARIES_GATE.STANDIN.active(), stop: window.__AGLOG ? window.__AGLOG.stop : null }; });
    ok(!r.live && r.cached === 0 && !r.btn && !r.stand && (mode !== 'B' || r.stop >= 1), `${mode}: closing the stage releases the gate, its pictures and its boss ` + JSON.stringify(r));
    ok(!errors.length, `${mode}: no page errors ` + errors.slice(0, 3).join(' | '));
    await T.browser.close(); };
  for (const m of (process.env.ONLY || 'A,B,C').split(',')) await runOne(m);
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
