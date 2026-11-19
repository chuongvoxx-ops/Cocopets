// v426 TG: the Gate of Taurus end to end. Run A: no boss (window.__TG_NOBOSS = 1): the three skies traced through the stage's
// own visit() (a wrong move refused, an undo taken back), the great door opens, the pet walks into the court, the door seals,
// Taurus wakes (the old win), the stage closes and lets go of everything. Run B: a stand-in boss (window.__TG_BOSS): begin()
// gets the court's geometry, update/drawGround/goal are called, stop() when the stage closes; the court's views and lowFx.
// HTML=test-tg.html node tests/_tg-flow.js   (SHOTS=1 takes the shots into shots/v426-TG/, DPR=3 for the DPR 3 set, ONLY=A|B)
const { open } = require('./_tg-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const DPR = +(process.env.DPR || 1), SH = !!process.env.SHOTS, tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR;
const SOL = [[0, 1, 2, 3, 0, 2, 4, 3, 1], [0, 1, 2, 3, 4, 2, 0, 5, 4], [2, 0, 1, 2, 3, 4, 5, 3, 6, 4]];
(async () => {
  const runOne = async (mode) => {
    const T = await open({ dpr: DPR }); const { page, M, run, goTo, errors } = T;
    await page.evaluate(m => { if (m === 'A') window.__TG_NOBOSS = 1; else { const L = window.__TGLOG = { begin: null, upd: 0, stop: 0, dg: 0 }; window.__TG_BOSS = { begin(X, H, self, A) { L.begin = A; }, update() { L.upd++; }, drawGround() { L.dg++; }, stop() { L.stop++; }, active: () => true, goal: () => 'Defeat the stand-in' }; } window.__NG_GL = 1; }, mode);
    const shot = async name => { if (SH) await T.shot('v426-TG', `${name}-${tag}`); };
    await T.start(); await run(0.5); await M(async () => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; const t0 = performance.now(); while (performance.now() - t0 < 120000 && m.R.mode !== 'play') await new Promise(r => requestAnimationFrame(r)); });
    let r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, Mp = D.M, bi = n => window.__pp.BIOME_ORDER[Mp.BI[n]]; const at = (x, y) => Mp.G[y * Mp.MW + x];
      return { phase: m.S.phase, mode: m.R.mode, arena: bi(12 * Mp.MW + 16), chamber: bi(27 * Mp.MW + 16), A: Mp.marks.A && Mp.marks.A[0], door: at(16, 21), props: D.propList.map(p => p.kind).sort().join(','), tp: window.TAURUS_PROPS.stats, edge: (Mp.decalsByChunk.get('1,1') || []).some(d => d.kind === 'tgedge'), stars: m.stars.length, gl: !!(window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX && window.NIDHOGG_MOVES.FGFX.usable()) }; });
    ok(r.phase === 'puzzle' && r.arena === 'taurcourt' && r.chamber === 'meadow' && r.stars === 5, `${mode}: the gate loads: the vault's land and the court's, the first sky ` + JSON.stringify({ phase: r.phase, mode: r.mode, arena: r.arena, chamber: r.chamber, stars: r.stars, gl: r.gl }));
    ok(r.A && Math.abs(r.A.x - 16.5) < 0.01 && r.door === 0 && r.edge, `${mode}: the court's mark at its centre, the door shut, its edge laid over the chunks`);
    ok(/tgcolumn/.test(r.props) && /tgruin/.test(r.props), `${mode}: the vault's columns and the court's pillars stand as props`);
    ok(r.tp.cached >= 10, `${mode}: the pictures painted at loading ` + JSON.stringify(r.tp));
    const tr = (sky, n) => M(async ([path, n]) => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; for (let k = 0; k < n; k++) { const s = m.stars[path[k]]; D.me.x = s.x + 0.6; D.me.y = s.y + 0.5; m.visit(path[k]); await new Promise(r => setTimeout(r, 60)); } return { used: m.R.used.size, mode: m.R.mode, sky: m.R.sky }; }, [SOL[sky], n]);
    const waitSky = n => M(async n => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; const t0 = performance.now(); while (performance.now() - t0 < 60000 && !(m.R.sky === n && m.R.mode === 'play')) await new Promise(r => requestAnimationFrame(r)); return m.R.sky === n && m.R.mode === 'play'; }, n);
    if (mode === 'A') { await goTo(16.5, 32.4); await run(0.5); await shot('chamber'); await goTo(16.5, 24.5); await run(0.5); await shot('chamber-north'); }
    // sky 1: a wrong move (no line joins), the first four lines, an undo
    r = await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; m.visit(0); m.visit(4); const a = m.R.path.length; m.visit(1); m.visit(0); const b = m.R.used.size; m.undo(); const c2 = m.R.used.size; m.restart(); return { a, b, c2, after: m.R.path.length }; });
    ok(r.a === 1 && r.b === 1 && r.c2 === 0 && r.after === 0, `${mode}: no line between 0 and 4 is refused; a line walked twice is refused; undo and start over take lines back ` + JSON.stringify(r));
    r = await tr(0, 5); ok(r.used === 4, `${mode}: sky 1 half traced ` + JSON.stringify(r));
    if (mode === 'A') { await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; D.me.x = 15.2; D.me.y = 28.6; }); await run(0.8); await shot('puzzle-mid-trace'); }
    r = await M(async rest => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; for (const i of rest) m.visit(i); return { used: m.R.used.size, mode: m.R.mode, lit: m.S.lit }; }, SOL[0].slice(5));
    ok(r.used === 8 && r.mode === 'between' && r.lit === 1, `${mode}: sky 1 traced: the first stud lights ` + JSON.stringify(r));
    ok(await waitSky(1), `${mode}: sky 2 loads`);
    r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; m.visit(1); return m.R.path.length; }); ok(r === 0, `${mode}: sky 2 must begin at the bright star`);
    r = await tr(1, 9); ok(r.used === 8, `${mode}: sky 2 traced ` + JSON.stringify(r));
    ok(await waitSky(2), `${mode}: sky 3 loads`);
    r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; m.visit(4); m.visit(6); const p = m.R.path.length; m.restart(); return p; }); ok(r === 1, `${mode}: the dark star cannot be reached before the bridge`);
    if (mode === 'A') { r = await tr(2, 4); await M(() => { const D = window.__pp.arc.game._dbg; D.me.x = 19.5; D.me.y = 29.0; }); await run(0.8); await shot('puzzle-bridge'); await M(async rest => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; for (const i of rest) m.visit(i); }, SOL[2].slice(4)); }
    else await tr(2, 10);
    r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return { mode: m.R.mode, used: m.R.used.size, lit: m.S.lit, btn: !!document.querySelector('.rift-trace') }; });
    ok(r.mode === 'won' && r.used === 9 && r.lit === 3 && !r.btn, `${mode}: sky 3 traced: the puzzle is done, its buttons gone ` + JSON.stringify(r));
    const until = (f, a, secs) => M(async ([f, a, secs]) => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, fn = new Function('m', 'a', 'return ' + f); const t0 = performance.now(); while (performance.now() - t0 < secs * 1000 && !fn(m, a)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return fn(m, a); }, [f, a, secs]);
    ok(await until('m.S.phase === "opening"', 0, 60), `${mode}: the great door begins to open`);
    if (mode === 'A') { await goTo(16.5, 26.0); await until('m.S.openT >= a', 1.3, 60); await shot('door-seam'); await until('m.S.open >= a', 0.45, 60); await shot('door-parting'); await until('m.S.open >= a', 0.98, 60); await shot('door-light'); }
    ok(await until('m.S.phase === "open"', 0, 300), `${mode}: the door opens fully`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, Mp = D.M, at = (x, y) => Mp.G[y * Mp.MW + x]; return { tiles: [at(15, 21), at(16, 21), at(17, 21)], hint: !!D.RIFT.hintObj(), goal: document.getElementById('arcGoal').textContent }; });
    ok(r.tiles.every(t => t === 1) && r.hint && /great door/i.test(r.goal), `${mode}: the door's three tiles are floor, the way is pointed out ` + JSON.stringify(r));
    if (mode === 'A') { await goTo(16.5, 25.0); await run(1.6); await shot('door-open'); }
    await goTo(16.5, 21.5); await run(0.3); await goTo(16.5, 19.4); await run(0.3);
    ok(await until('m.S.phase === "boss" || m.S.phase === "won"', 0, 30), `${mode}: crossing into the court seals the door`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, Mp = D.M, at = (x, y) => Mp.G[y * Mp.MW + x]; return { phase: m.S.phase, tiles: [at(15, 21), at(16, 21), at(17, 21)], me: [D.me.x, D.me.y], done: D.RIFT.done, log: window.__TGLOG || null }; });
    ok(r.tiles.every(t => t === 0) && r.me[1] < 21, `${mode}: the door is shut again, the pet inside the court ` + JSON.stringify({ tiles: r.tiles, me: r.me }));
    if (mode === 'A') {
      ok(r.phase === 'won' && r.done, `A: without the boss, Taurus wakes as before ` + JSON.stringify({ phase: r.phase, done: r.done }));
      await run(0.6); await shot('arena-won');
      ok(await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 30000 }).then(() => true, () => false), 'A: the gate is won (the stage ends)');
    } else {
      const A = r.log && r.log.begin; ok(r.phase === 'boss' && A && Math.abs(A.cx - 16.5) < 0.01 && A.rx > 10.5 && A.ry > 7.5 && A.ax1 - A.ax0 >= 20 && A.ay1 - A.ay0 >= 14 && A.door, `B: TAURUS_BOSS.begin gets the court ` + JSON.stringify(A));
      await run(1.0); r = await M(() => ({ upd: window.__TGLOG.upd, dg: window.__TGLOG.dg, goal: document.getElementById('arcGoal').textContent }));
      ok(r.upd >= 2 && r.dg >= 2 && /stand-in/.test(r.goal), `B: the boss's update, drawGround and goal are called ` + JSON.stringify(r));
      await goTo(16.5, 12.9); await run(1.4); await shot('arena'); await goTo(16.5, 6.6); await run(1.4); await shot('arena-north'); await goTo(7.5, 12.5); await run(1.4); await shot('arena-west'); await goTo(25.5, 12.5); await run(1.4); await shot('arena-east'); await goTo(16.5, 19.0); await run(1.4); await shot('arena-south');
      await M(() => { window.__pp.st.lowFx = true; }); await goTo(16.5, 12.9); await run(1.0); await shot('arena-lowfx'); await M(() => { window.__pp.st.lowFx = false; });
    }
    r = await M(async () => { const P = window.__pp; P.closeArcade(true); await new Promise(r => setTimeout(r, 400)); return { live: !!window.TAURUS_GATE.live, cached: window.TAURUS_PROPS.stats.cached, btn: !!document.querySelector('.rift-trace'), stop: window.__TGLOG ? window.__TGLOG.stop : null }; });
    ok(!r.live && r.cached === 0 && !r.btn && (mode !== 'B' || r.stop >= 1), `${mode}: closing the stage releases the gate, its pictures and (B) stops the boss ` + JSON.stringify(r));
    ok(!errors.length, `${mode}: no page errors ` + errors.slice(0, 3).join(' | '));
    await T.browser.close(); };
  for (const m of (process.env.ONLY || 'A,B').split(',')) await runOne(m);
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
