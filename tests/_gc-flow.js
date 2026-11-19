// v420 GC: the Gate of Cancer end to end. Run A: no boss (window.__CX_NOBOSS = 1): the riddles (a wrong answer resets them),
// solved through the stage's answer hooks; the moon gate opens; the pet walks into the arena; the gate seals; Cancer wakes
// (the old win); the stage closes and lets go of everything. Run B: a stand-in boss (window.__CX_BOSS): begin() is called with
// the arena's geometry, update() every frame, stop() when the stage closes. Run C (ONLY=C): the real boss (CANCER_BOSS, 20o2):
// it begins when the gate seals; a shot of the fight in the arena; closing the stage stops it.
// HTML=test-gc.html node tests/_gc-flow.js   (SHOTS=1 also takes the shots into shots/v420-GC/, DPR=3 for the DPR 3 set)
const { open } = require('./_gc-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const DPR = +(process.env.DPR || 1), SH = !!process.env.SHOTS, tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR;
(async () => {
  const runOne = async (mode) => {
    const T = await open({ dpr: DPR }); const { page, M, run, goTo, errors } = T;
    await page.evaluate(m => { if (m === 'A') window.__CX_NOBOSS = 1; else if (m === 'C') {} else { const L = window.__CXLOG = { begin: null, upd: 0, stop: 0, dg: 0 }; window.__CX_BOSS = { begin(X, H, self, A) { L.begin = A; }, update() { L.upd++; }, drawGround() { L.dg++; }, stop() { L.stop++; }, active: () => true, goal: () => 'Defeat the stand-in' }; } window.__NG_GL = 1; }, mode);
    const shot = async name => { if (SH) await T.shot('v420-GC', `${name}-${tag}`); };
    await T.start(); await run(1.0);
    let r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, Mp = D.M, bi = n => window.__pp.BIOME_ORDER[Mp.BI[n]]; const at = (x, y) => Mp.G[y * Mp.MW + x];
      return { phase: m.S.phase, biome: D.F.biome, arena: bi(13 * Mp.MW + 16), chamber: bi(26 * Mp.MW + 16), A: Mp.marks.A && Mp.marks.A[0], door: at(16, 21), props: D.propList.map(p => p.kind).sort().join(','), cp: window.CANCER_PROPS.stats, fill: Mp.fill, edge: (Mp.decalsByChunk.get('1,1') || []).some(d => d.kind === 'cxedge') }; });
    ok(r.phase === 'riddle' && r.biome === 'nursery' && r.arena === 'lunarfloor' && r.chamber === 'nursery', `${mode}: the gate loads: the shell's land and the arena's ` + JSON.stringify({ phase: r.phase, arena: r.arena, chamber: r.chamber }));
    ok(r.A && Math.abs(r.A.x - 16.5) < 0.01 && r.door === 0 && r.edge, `${mode}: the arena's mark at its centre, the gate shut, its edge laid over the chunks`);
    ok(/cxpillar/.test(r.props) && /cxcoral/.test(r.props) && /cxscallop/.test(r.props), `${mode}: the moonstone pillars, coral and scallops stand as props`);
    ok(r.cp.cached >= 6, `${mode}: the pictures painted at loading (the rest within a small budget a frame) ` + JSON.stringify(r.cp));
    if (mode === 'A') { await run(4.0); await goTo(16.5, 31.3); await run(0.4); await shot('chamber'); await goTo(13.0, 24.0); await run(0.6); await shot('chamber-pools'); }
    // to the clam: it opens its card
    await goTo(16.5, 27.6);
    r = await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; const t0 = performance.now(); while (performance.now() - t0 < 40000 && !(m.R.open && m.R.clamT >= 1)) { await new Promise(r => requestAnimationFrame(r)); D.me.x = 16.5; D.me.y = 27.6; D.me.vx = D.me.vy = 0; } return { open: m.R.open, card: !!document.querySelector('.rift-riddle .rr-q'), k: m.R.clamT, cached: window.CANCER_PROPS.stats.cached }; });
    ok(r.open && r.card && r.cached >= 12, `${mode}: standing beside the clam opens its riddle card (every picture painted by now) ` + JSON.stringify(r));
    if (mode === 'A') { await M(() => { const D = window.__pp.arc.game._dbg; D.me.x = 18.6; D.me.y = 27.4; }); await run(2.6); await M(() => { const e = document.querySelector('.rift-riddle'); if (e) e.style.display = 'none'; }); await shot('clam-open'); await M(() => { const e = document.querySelector('.rift-riddle'); if (e) e.style.display = ''; }); }
    if (mode === 'A') { // a wrong answer: all three begin again
      r = await M(async () => { const m = window.__pp.arc.game._dbg.RIFT.self.mod, i = m.rightIndex(); m.answer(i); await new Promise(r => setTimeout(r, 900)); const s1 = m.R.solved; const w = (m.rightIndex() + 1) % 5; m.answer(w); await new Promise(r => setTimeout(r, 1100)); return { s1, s2: m.R.solved, idx: m.R.idx, lit: m.S.lit, open: m.R.open }; });
      ok(r.s1 === 1 && r.s2 === 0 && r.idx === 0 && r.lit === 0 && r.open, `${mode}: one right, then a wrong answer: the riddles begin again ` + JSON.stringify(r));
    }
    // three right answers in a row (through the stage's own hooks)
    r = await M(async () => { const m = window.__pp.arc.game._dbg.RIFT.self.mod, seen = []; for (let k = 0; k < 3; k++) { const i = m.rightIndex(); seen.push(m.R.choices[i]); m.answer(i); await new Promise(r => setTimeout(r, k < 2 ? 900 : 1100)); } return { seen, phase: m.S.phase, card: !!document.querySelector('.rift-riddle'), lit: m.S.lit }; });
    ok(r.phase === 'opening' && !r.card && r.lit === 3 && r.seen.sort().join() === 'A candle,A river,Death', `${mode}: three right in a row: the card closes, the moon gate begins to open ` + JSON.stringify(r));
    // the opening: frames along it
    const until = (f, a, secs) => M(async ([f, a, secs]) => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, fn = new Function('m', 'a', 'return ' + f); const t0 = performance.now(); while (performance.now() - t0 < secs * 1000 && !fn(m, a)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return fn(m, a); }, [f, a, secs]);
    if (mode === 'A') { await until('m.S.openT >= a', 1.3, 60); await shot('door-seam'); await until('m.S.open >= a', 0.45, 60); await shot('door-parting'); await until('m.S.open >= a', 0.98, 60); await shot('door-light'); }
    ok(await until('m.S.phase === "open"', 0, 300), `${mode}: the gate opens fully`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, Mp = D.M, at = (x, y) => Mp.G[y * Mp.MW + x]; return { tiles: [at(15, 21), at(16, 21), at(17, 21)], hint: !!D.RIFT.hintObj(), goal: document.getElementById('arcGoal').textContent }; });
    ok(r.tiles.every(t => t === 1) && r.hint && /moon gate/i.test(r.goal), `${mode}: the gate's three tiles are floor, the way is pointed out ` + JSON.stringify(r));
    if (mode === 'A') { await goTo(16.5, 24.6); await run(1.6); await shot('door-open'); }
    // through the gate: it seals behind
    await goTo(16.5, 21.5); await run(0.3); await goTo(16.5, 19.4); await run(0.3);
    ok(await until('m.S.phase === "boss" || m.S.phase === "won"', 0, 30), `${mode}: crossing into the arena seals the gate`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, Mp = D.M, at = (x, y) => Mp.G[y * Mp.MW + x]; return { phase: m.S.phase, tiles: [at(15, 21), at(16, 21), at(17, 21)], me: [D.me.x, D.me.y], done: D.RIFT.done, log: window.__CXLOG || null }; });
    ok(r.tiles.every(t => t === 0) && r.me[1] < 21, `${mode}: the gate is shut again, the pet inside the arena ` + JSON.stringify({ tiles: r.tiles, me: r.me }));
    if (mode === 'A') {
      ok(r.phase === 'won' && r.done, `A: without the boss, Cancer wakes as before ` + JSON.stringify({ phase: r.phase, done: r.done }));
      await run(0.6); await shot('arena-won');
      ok(await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 30000 }).then(() => true, () => false), 'A: the gate is won (the stage ends)');
    } else if (mode === 'C') {
      ok(r.phase === 'boss', 'C: the real boss begins as the gate seals');
      const b = await until('(() => { const g = window.__pp.arc.game._dbg.g; return g.boss && !g.boss.dead && (g.bossIntro || 0) <= 0 && g.t > a; })()', 0, 240);
      await M(() => { const D = window.__pp.arc.game._dbg; D.me.x = 16.5; D.me.y = 16.5; }); await run(3.0);
      r = await M(() => { const D = window.__pp.arc.game._dbg, B = D.g.boss; return { boss: !!B, name: B && B.bname, act: B && B.act, hp: B && Math.round(B.hp / B.maxhp * 100), at: B && [+B.x.toFixed(1), +B.y.toFixed(1)], active: typeof window.CANCER_BOSS_ACTIVE === 'function' ? window.CANCER_BOSS_ACTIVE() : null }; });
      ok(b && r.boss, 'C: the boss is up in the arena ' + JSON.stringify(r)); await shot('arena-boss'); await run(2.0); await shot('arena-boss-2');
    } else {
      const A = r.log && r.log.begin; ok(r.phase === 'boss' && A && Math.abs(A.cx - 16.5) < 0.01 && A.rx > 10.5 && A.ry > 7.5 && A.ax1 - A.ax0 >= 20 && A.ay1 - A.ay0 >= 14 && A.door, `B: CANCER_BOSS.begin gets the arena ` + JSON.stringify(A));
      await run(1.0); r = await M(() => ({ upd: window.__CXLOG.upd, dg: window.__CXLOG.dg, goal: document.getElementById('arcGoal').textContent }));
      ok(r.upd >= 2 && r.dg >= 2 && /stand-in/.test(r.goal), `B: the boss's update, drawGround and goal are called ` + JSON.stringify(r));
      await goTo(16.5, 13.4); await run(1.4); await shot('arena'); await goTo(16.5, 7.2); await run(1.4); await shot('arena-north'); await goTo(8.0, 15.0); await run(1.4); await shot('arena-west'); await goTo(16.5, 19.0); await run(1.4); await shot('arena-south');
      // lowFx: the arena still stands, only its decoration lighter
      await M(() => { window.__pp.st.lowFx = true; }); await goTo(16.5, 13.4); await run(1.0); if (SH) await shot('arena-lowfx'); await M(() => { window.__pp.st.lowFx = false; });
    }
    // the stage closes: everything let go
    r = await M(async () => { const P = window.__pp; P.closeArcade(true); await new Promise(r => setTimeout(r, 400)); return { live: !!window.CANCER_GATE.live, cached: window.CANCER_PROPS.stats.cached, card: !!document.querySelector('.rift-riddle'), stop: window.__CXLOG ? window.__CXLOG.stop : null }; });
    ok(!r.live && r.cached === 0 && !r.card && (mode !== 'B' || r.stop >= 1), `${mode}: closing the stage releases the gate, its pictures and (B) stops the boss ` + JSON.stringify(r));
    ok(!errors.length, `${mode}: no page errors ` + errors.slice(0, 3).join(' | '));
    await T.browser.close(); };
  for (const m of (process.env.ONLY || 'A,B').split(',')) await runOne(m);
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
