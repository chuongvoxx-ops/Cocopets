// v445 AG: the Gate of Scorpio (the Amber Vigil and the Amber Sanctum) end to end.
// Run A (the built-in stand-in guardian): the gate opens from the Rift UI once the dunes are sealed; the courtyard's rules
// through the stage's own state: held in a gaze the pet is seen and carried back to the sanctuary (a shard it carries flies
// home), a shadow hides it, a chime turns its watch-stone to the sound, a taut ruby thread binds and rings, three catches tire
// the vigil; then every shard fetched and brought home unseen with no chime rung (planned on the gate's own rules by
// tests/_sg-plan.js and walked by the stones' clock while the game judges it); the door opens (the shards rise into the star,
// it ignites, the pincers open, the tail lifts, the leaves part), the pet crosses, the door seals, the Amber Warden rises and
// falls -> X.winStage -> the gate is done and Scorpio is unlocked; closing the stage lets go of everything.
// Run B (a stand-in SCORPIO_BOSS, window.__SG_BOSS): begin() gets the sanctum's geometry and hooks; update/drawGround/goal/stop.
// Run C (window.__SG_NOBOSS = 1): Scorpio wakes as the door seals. Run D (the real SCORPIO_BOSS, when it is built in): it begins.
// HTML=<test build> node tests/_sg-flow.js   (SHOTS=1 takes the shots into shots/v445-AG/ with the GPU painter forced on, DPR=3 for the DPR 3 set, ONLY=A|B|C|D)
const { open } = require('./_sg-lib');
const { plan, drive } = require('./_sg-plan');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const DPR = +(process.env.DPR || 1), SH = !!process.env.SHOTS, GL = SH || process.env.GL === '1', tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR;
(async () => {
  const runOne = async (mode) => {
    const T = await open({ dpr: DPR, seal: mode !== 'C' }); const { page, M, run, runG, goTo, until, errors } = T;
    const shot = async name => { if (SH) await T.shot('v445-AG', `${name}-${tag}`); };
    const has = await M(() => typeof SCORPIO_BOSS !== 'undefined' && !!SCORPIO_BOSS);
    if (mode === 'D' && !has) { console.log('skip D: no SCORPIO_BOSS in this build'); await T.browser.close(); return; }
    await page.evaluate(([m, gl]) => { if (gl) window.__NG_GL = 1; if (m === 'A') window.__SG_BOSS = window.SCORPIO_GATE.STANDIN; if (m === 'C') window.__SG_NOBOSS = 1;
      if (m === 'B') { const L = window.__SGLOG = { begin: null, upd: 0, dg: 0, stop: 0 }; window.__SG_BOSS = { begin(X, H, self, A) { L.begin = A; L.A = A; }, update() { L.upd++; }, drawGround() { L.dg++; }, stop() { L.stop++; }, active: () => true, goal: () => 'Defeat the stand-in' }; } }, [mode, GL]);
    // the Rift UI: the dunes' gate listed, open once sealed (or with the developer unlock), its Trial button
    let r = await M(m => { const P = window.__pp; if (m === 'C') P.st.unlockAll = true; P.renderRift(); const g = [...document.querySelectorAll('.rf-gate')]; const e = g.find(x => /Amber Vigil/.test(x.textContent)); return { n: g.length, txt: e ? e.textContent : '', btn: !!document.querySelector('[data-rift="gate"][data-id="dunes"]'), open: P.gateOpen('dunes') }; }, mode);
    ok(/Amber Vigil/.test(r.txt) && /watch-stones/.test(r.txt) && /5–10 min/.test(r.txt) && r.btn && r.open, `${mode}: the Rift UI lists the Amber Vigil, open (${mode === 'C' ? 'developer unlock' : 'dunes sealed'}), with its Trial button ` + JSON.stringify({ n: r.n, txt: r.txt.slice(0, 120) }));
    if (mode === 'A') { r = await M(() => { const P = window.__pp; P.riftState().seals.dunes = 0; const o = P.gateOpen('dunes'); P.riftState().seals.dunes = 1; return o; }); ok(r === false, 'A: unsealed and without the developer unlock the gate stays shut'); }
    if (mode === 'A' && SH) { await M(() => { const P = window.__pp; P.renderRift(); const b = document.querySelector('[data-rift="sel"][data-id="dunes"]'); if (b) b.click(); const e = document.querySelector('.rf-gates'); if (e) e.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(400); await shot('ui-gates'); }
    await M(() => { const P = window.__pp; const b = document.querySelector('[data-rift="gate"][data-id="dunes"]'); if (b) b.click(); else P.startGate('dunes'); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 }); await M(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
    ok(await until('m.R.mode === "play"', 0, 60), `${mode}: the vigil begins`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, Mp = D.M, bi = n => window.__pp.BIOME_ORDER[Mp.BI[n]], at = (x, y) => Mp.G[y * Mp.MW + x];
      return { phase: m.S.phase, arena: bi(13 * Mp.MW + 17), chamber: bi(30 * Mp.MW + 17), A: Mp.marks.A && Mp.marks.A[0], door: at(17, 22), cover: at(8, 27), coverProp: Mp.props.get(27 * Mp.MW + 8), stone: at(10, 29), pillar: at(14, 9), edge: (Mp.decalsByChunk.get('1,1') || []).some(d => d.kind === 'sgedge'), sp: window.SCORPIO_PROPS.stats, name: D.F.name, me: [D.me.x, D.me.y], safe: m.inSafe(D.me.x, D.me.y), stones: m.stones.length };
    });
    ok(r.phase === 'puzzle' && r.arena === 'vigilsanct' && r.chamber === 'vigil' && r.name === 'The Gate of Scorpio' && r.safe && r.stones === 4, `${mode}: the gate loads: the courtyard's land and the sanctum's, the pet in the sanctuary, four watch-stones ` + JSON.stringify({ phase: r.phase, arena: r.arena, chamber: r.chamber, name: r.name, me: r.me }));
    ok(r.A && Math.abs(r.A.x - 17.5) < 0.01 && r.door === 0 && r.cover === 0 && r.coverProp === 'sgnone' && r.stone === 0 && r.pillar === 0 && r.edge, `${mode}: the sanctum's mark at its centre, the door shut, the cover, stones and the sanctum's columns solid (drawn by the gate), its edge over the chunks`);
    r.jobs = await M(() => window.__pp.RIFT_GATES.dunes.preload({ T: window.SCORPIO_PROPS.base || 48, k: 1, F: window.__pp.arc.game._dbg.F }).length);
    ok(r.sp.cached >= 15 && r.jobs >= 40, `${mode}: the loading pass is handed every picture and the sky's (a slow software GPU may run out of loading time first: the rest are painted in the first frames) ` + JSON.stringify({ cached: r.sp.cached, jobs: r.jobs, ms: Math.round(r.sp.paintMs) }));
    if (mode === 'A') {
      await runG(4.2); await shot('vigil-start');
      // (a spot lit by a gaze now and for the next second, and one in a shadow: in a gaze's angle and reach, cover between, unlit by any stone for 1.6 s)
      const spot1 = kind => M(kind => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, G = m.geo, t = m.R.sclk, sl = m.R.slow, GS = window.SCORPIO_GATE;
        for (let y = G.CH.y0 + 0.75; y < G.CH.y1 + 0.5; y += 0.5) for (let x = G.CH.x0 + 0.75; x < G.CH.x1 + 0.5; x += 0.5) { if (m.blocked(x, y) || m.blocked(x + 0.3, y) || m.blocked(x - 0.3, y) || m.blocked(x, y + 0.3) || m.blocked(x, y - 0.3) || m.inSafe(x, y) || m.threadHit(x, y, t) || Math.hypot(x - 17.5, y - 24.6) < 5) continue;
          let good = true; for (let k = 0; k <= (kind === 'lit' ? 8 : 16) && good; k++) { const tt = t + k * 0.1 * sl; if (kind === 'lit') good = m.litAt(x, y, tt); else good = !m.litAt(x, y, tt); }
          if (!good) continue; if (kind === 'lit') return [x, y];
          const sh = GS.STONES.find(s => { const a = GS.schedA(s, t + 0.3 * sl), dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy); let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); return d < s.range - 0.3 && d > 1.2 && Math.abs(da) < s.half * 0.7; }); if (sh) return [x, y, sh.id]; } return null; }, kind);
      const spot = async kind => { for (let i = 0; i < 40; i++) { const p = await spot1(kind); if (p) return p; await runG(0.25); } return null; };
      // seen: held in a gaze the light brightens on the pet, then the vigil carries it back to the sanctuary
      let p = await spot('lit'); ok(!!p, 'A: a spot in a gaze for the next second ' + JSON.stringify(p));
      if (p) { await goTo(p[0], p[1]); r = await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, me = D.me, x = me.x, y = me.y, r0 = performance.now(); let mx = 0, t0 = D.g.t; while (performance.now() - r0 < 20000 && m.R.seenN === 0) { me.x = x; me.y = y; me.vx = me.vy = 0; mx = Math.max(mx, m.R.meter); await new Promise(r => requestAnimationFrame(r)); } return { seen: m.R.seenN, after: +(D.g.t - t0).toFixed(2), mx: +mx.toFixed(2), by: m.R.by }; });
        ok(r.seen === 1 && r.after > 0.3 && r.after < 2.5 && r.mx > 0.5, 'A: held in a gaze, the light brightens on the pet for a moment, then it is seen ' + JSON.stringify(r));
        await shot('vigil-seen'); await runG(1.2); r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; return { me: [+D.me.x.toFixed(2), +D.me.y.toFixed(2)], safe: m.inSafe(D.me.x, D.me.y), meter: m.R.meter }; });
        ok(r.safe && r.meter === 0, 'A: carried back to the sanctuary ' + JSON.stringify(r)); }
      // a carried shard flies home when the pet is seen
      await goTo(6.5, 32.2); r = await until('!!m.R.carry', 0, 20); ok(r, 'A: walking up to the Claw\'s altar takes its shard');
      await runG(0.4); await shot('vigil-carry');
      p = await spot('lit'); ok(!!p, 'A: (another spot in a gaze) ' + JSON.stringify(p)); if (p) { await goTo(p[0], p[1]); r = await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, me = D.me, x = me.x, y = me.y, r0 = performance.now(); while (performance.now() - r0 < 20000 && m.R.seenN < 2) { me.x = x; me.y = y; me.vx = me.vy = 0; await new Promise(r => requestAnimationFrame(r)); } const sh = m.shards.find(s => s.id === 'W'); return { seen: m.R.seenN, carry: !!m.R.carry, state: sh.state, fly: m.R.flyHome.length }; });
        ok(r.seen === 2 && !r.carry && r.state === 'altar' && r.fly === 1, 'A: seen with a shard: it flies home to its altar ' + JSON.stringify(r)); await runG(1.2); }
      // a shadow hides the pet: in a gaze's angle and reach, cover between
      p = await spot('shadow'); ok(!!p, 'A: a spot in a shadow cast across a gaze ' + JSON.stringify(p));
      if (p) { await goTo(p[0], p[1]); r = await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, me = D.me, x = me.x, y = me.y, n0 = m.R.seenN, t0 = D.g.t; let hid = 0, mx = 0; while (D.g.t - t0 < 1.4) { me.x = x; me.y = y; me.vx = me.vy = 0; if (m.R.hidden) hid++; mx = Math.max(mx, m.R.meter); await new Promise(r => requestAnimationFrame(r)); } return { seen: m.R.seenN - n0, hid, mx }; });
        ok(r.seen === 0 && r.hid > 0 && r.mx === 0, 'A: in a shadow across the gaze the pet stays hidden (its tell shown) ' + JSON.stringify(r)); await shot('vigil-shadow'); }
      // a chime turns its watch-stone to the sound for seven seconds
      await goTo(19.6, 23.6); r = await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, ok = m.ring('C1'), s = m.stones.find(s => s.id === 'W2'), t0 = D.g.t; while (D.g.t - t0 < 1.4) await new Promise(r => requestAnimationFrame(r)); const ch = m.CHM.find(c => c.id === 'C1'), want = Math.atan2(ch.y - s.y, ch.x - s.x); let d = s.a - want; d = Math.atan2(Math.sin(d), Math.cos(d)); return { ok, look: !!(s.look && s.look.chime), d: +Math.abs(d).toFixed(3), dur: s.look ? s.look.dur : 0 }; });
      ok(r.ok && r.look && r.d < 0.12 && r.dur === 7, 'A: the east chime rung: its watch-stone turns to stare at the sound ' + JSON.stringify(r)); await shot('vigil-chime');
      r = await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, s = m.stones.find(s => s.id === 'W2'), t0 = D.g.t; while (D.g.t - t0 < 6.5 && s.look) await new Promise(r => requestAnimationFrame(r)); return { look: !!s.look, t: +(D.g.t - t0).toFixed(1) }; });
      ok(!r.look, 'A: then it turns back to its sweep ' + JSON.stringify(r));
      // a taut ruby thread binds and rings: the stones near turn toward the pet
      r = await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, me = D.me, r0 = performance.now(); while (performance.now() - r0 < 30000 && !(m.taut('T1', m.R.sclk) > 0.95 && m.taut('T1', m.R.sclk + 0.5) > 0.95)) await new Promise(r => requestAnimationFrame(r));
        const b0 = m.R.binds; me.x = 17.5; me.y = 27.55; me.vx = me.vy = 0; for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r)); return { binds: m.R.binds - b0, held: m.R.held > 0, looks: m.stones.filter(s => s.look && !s.look.chime).map(s => s.id) }; });
      ok(r.binds === 1 && r.held && r.looks.length >= 2, 'A: a taut thread binds the pet and rings: the stones near turn toward it ' + JSON.stringify(r)); await runG(0.3); await shot('vigil-thread');
      r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod, T = window.SCORPIO_GATE.THREADS[0]; let slack = 0; for (let k = 0; k < 52; k++) if (m.taut('T1', k * 0.1) === 0) slack++; return slack; }); ok(r >= 18 && r <= 22, 'A: each thread hangs slack two seconds in every 5.2 ' + r);
      await goTo(17.5, 24.6); await runG(2.8);
      // three catches tire the vigil
      for (let i = 0; i < 6; i++) { if (await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.R.seenN >= 3)) break; p = await spot('lit'); if (!p) continue; await goTo(p[0], p[1]);
        await M(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, me = D.me, x = me.x, y = me.y, n0 = m.R.seenN, t0 = D.g.t; while (D.g.t - t0 < 2.5 && m.R.seenN === n0) { me.x = x; me.y = y; me.vx = me.vy = 0; await new Promise(r => requestAnimationFrame(r)); } }); await runG(1.5); }
      r = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; return { seen: m.R.seenN, slow: m.R.slow }; });
      ok(r.seen >= 3 && Math.abs(r.slow - (r.seen >= 6 ? 0.66 : 0.8)) < 1e-6, 'A: seen three times, the vigil tires: its stones turn a fifth slower ' + JSON.stringify(r));
      // every shard fetched and brought home unseen, no chime rung (planned on the gate's own rules, walked by the stones' clock)
      const legs = []; for (const id of ['W', 'E', 'S']) { await M(() => { const D = window.__pp.arc.game._dbg; D.me.x = 17.5; D.me.y = 24.6; }); await runG(0.2);
        let P = await plan(page, { altar: id }); let d1 = P.ok ? await drive(page, P) : null; if (id === 'E' && SH) await shot('vigil-east');
        let Q = P.ok && d1 && d1.carry === id ? await plan(page, { safe: true }) : { ok: false }; let d2 = Q.ok ? await drive(page, Q) : null;
        legs.push({ id, out: P.ok ? +(P.secs).toFixed(1) : null, back: Q.ok ? +(Q.secs).toFixed(1) : null, seen: (d1 ? d1.seen : 9) + (d2 ? d2.seen : 9), binds: (d1 ? d1.binds : 0) + (d2 ? d2.binds : 0), banked: d2 ? d2.banked.length : 0 });
        ok(P.ok && Q.ok && d1.carry === id && d2 && d2.seen === 0 && d1.seen === 0 && d2.banked.includes(id), `A: the shard of ${id === 'W' ? 'the Claw' : id === 'E' ? 'the Sting' : 'the Heart'} fetched and brought home unseen with no chime rung ` + JSON.stringify(legs[legs.length - 1])); }
      ok(await until('m.S.phase === "opening"', 0, 30), 'A: the third shard home: the great door begins to open');
      await goTo(17.5, 27.5); await until('m.S.rise >= a', 0.6, 60); await shot('door-rise'); await until('m.S.ignite >= a', 0.9, 60); await shot('door-ignite');
      await until('m.S.claw >= a', 0.6, 60); await shot('door-claw'); await until('m.S.uncoil >= a', 0.8, 60); await shot('door-uncoil'); await until('m.S.open >= a', 0.5, 60); await shot('door-parting');
    } else { await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.solve()); ok(await until('m.S.phase === "opening"', 0, 60), `${mode}: (solved) the door opens`); }
    ok(await until('m.S.phase === "open"', 0, 300), `${mode}: the door opens fully`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, Mp = D.M, at = (x, y) => Mp.G[y * Mp.MW + x]; return { tiles: [at(16, 22), at(17, 22), at(18, 22)], hint: !!D.RIFT.hintObj(), goal: document.getElementById('arcGoal').textContent, claw: m.S.claw, uncoil: m.S.uncoil, ignite: m.S.ignite }; });
    ok(r.tiles.every(t => t === 1) && r.hint && /great door/i.test(r.goal) && r.claw === 1 && r.uncoil === 1 && r.ignite === 1, `${mode}: the door's three tiles are floor, the pincers open, the tail lifted, the star burning, the way pointed out ` + JSON.stringify(r));
    if (mode === 'A') { await goTo(17.5, 26.0); await runG(1.4); await shot('door-open'); }
    await goTo(17.5, 22.5); await run(0.3); await goTo(17.5, 20.4); await run(0.3);
    ok(await until('m.S.phase === "boss" || m.S.phase === "won"', 0, 30), `${mode}: crossing into the sanctum seals the door`);
    r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, Mp = D.M, at = (x, y) => Mp.G[y * Mp.MW + x]; return { phase: m.S.phase, tiles: [at(16, 22), at(17, 22), at(18, 22)], me: [D.me.x, D.me.y], done: D.RIFT.done }; });
    ok(r.tiles.every(t => t === 0) && r.me[1] < 22, `${mode}: the door is shut again, the pet in the sanctum ` + JSON.stringify({ tiles: r.tiles, me: r.me }));
    if (mode === 'A') {
      ok(r.phase === 'boss', 'A: the stand-in guardian takes the sanctum ' + r.phase);
      ok(await until('window.SCORPIO_GATE.STANDIN.S && window.SCORPIO_GATE.STANDIN.S.m', 0, 30), 'A: the Amber Warden drops in');
      r = await M(() => { const S = window.SCORPIO_GATE.STANDIN.S, m = S.m, md = window.__pp.arc.game._dbg.RIFT.self.mod; return { name: m.bname, hp: m.hp, goal: document.getElementById('arcGoal').textContent, sig: md.S.sig, moon: md.S.moon, uncoil: +md.S.uncoil.toFixed(2) }; });
      ok(/Amber Warden/.test(r.name) && r.hp > 0 && /Amber Warden/.test(r.goal) && r.sig > 1 && r.moon > 1, 'A: the Warden in the goal line, the sigil and the moon raised ' + JSON.stringify(r));
      await goTo(17.5, 16.5); await runG(1.5); await shot('arena-standin');
      r = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.S.uncoil); ok(r < 0.6, 'A: the door sealed, its scorpion curls its tail back down ' + r.toFixed(2));
      await M(() => { const m = window.SCORPIO_GATE.STANDIN.S.m; m.x = 28.0; m.y = 15.5; m.aggro = false; m.stunT = 999; });   // (the Warden held aside for the views)
      for (const [n, x, y] of [['arena', 17.5, 13.9], ['arena-north', 17.5, 8.0], ['arena-west', 7.4, 13.5], ['arena-east', 27.0, 12.0], ['arena-south', 17.5, 20.2]]) { await goTo(x, y); await runG(1.6); await shot(n); }
      if (SH) { await M(() => { window.__pp.st.lowFx = true; }); await goTo(17.5, 13.9); await runG(1.2); await shot('arena-lowfx'); await M(() => { window.__pp.st.lowFx = false; }); }
      await M(() => { const D = window.__pp.arc.game._dbg, m = window.SCORPIO_GATE.STANDIN.S.m; D.hitMon(m, m.hp * 10, { flat: true }); if (!m.dead) { m.hp = 0; m.dead = true; } });
      ok(await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 60000 }).then(() => true, () => false), 'A: the Warden falls: the stage is won');
      await page.waitForTimeout(800);
      r = await M(() => { const P = window.__pp; return { gate: P.riftState().gates.dunes, have: P.st.animas.have.scorpio, txt: (document.getElementById('arcPanel') || {}).textContent || '' }; });
      ok(r.gate === 1 && r.have >= 1 && /Asmodeus|Scorpio/.test(r.txt), 'A: the gate is done and Scorpio (Asmodeus) is unlocked ' + JSON.stringify({ gate: r.gate, have: r.have }));
    } else if (mode === 'B') {
      const A = await M(() => { const A = window.__SGLOG.begin; return A && { cx: A.cx, cy: A.cy, rx: A.rx, ry: A.ry, sen: A.sen, ax0: A.ax0, ax1: A.ax1, ay0: A.ay0, ay1: A.ay1, door: A.door, inC: A.inside(A.cx, A.cy), inOut: A.inside(A.cx + A.rx + 1, A.cy), rings: A.rings, anchors: A.anchors.length, a0: A.anchors[0], pillars: A.pillars.length, ruins: A.ruins.length, fonts: A.fonts.length, crown: A.crown, solidP: A.pillars.every(p => A.solid(p.x, p.y)), solidA: A.anchors.slice(1).every(p => A.solid(p.x, p.y)), fontFree: A.fonts.every(f => !A.solid(f.x, f.y) && A.inside(f.x, f.y)), centreFree: !A.solid(A.cx, A.cy), fn: ['sigil', 'moon', 'web', 'font', 'inside', 'solid'].every(k => typeof A[k] === 'function') }; });
      ok(r.phase === 'boss' && A && Math.abs(A.cx - 17.5) < 0.01 && A.rx > 11 && A.ry > 8 && A.ax1 - A.ax0 >= 21 && A.door && A.inC && !A.inOut && A.rings.length === 2 && A.anchors === 7 && A.pillars === 4 && A.ruins === 6 && A.fonts === 3 && A.crown && A.solidP && A.solidA && A.fontFree && A.centreFree && A.fn, 'B: SCORPIO_BOSS.begin gets the sanctum and its hooks ' + JSON.stringify(A));
      await M(() => { const A = window.__SGLOG.A; A.sigil(2); A.moon(2); A.web(0); A.font(1, 2); }); await runG(2.5); r = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S; return { upd: window.__SGLOG.upd, dg: window.__SGLOG.dg, goal: document.getElementById('arcGoal').textContent, sig: +S.sigK.toFixed(2), moon: +S.moonK.toFixed(2), web: +S.webK.toFixed(2), font: S.fontK.map(k => +k.toFixed(2)) }; });
      ok(r.upd >= 2 && r.dg >= 2 && /stand-in/.test(r.goal) && r.sig > 1.6 && r.moon > 1.6 && r.web < 0.4 && r.font[1] > 1.6 && r.font[0] < 0.5, 'B: the boss\'s update, drawGround and goal are called; sigil(), moon(), web() and font() move the sanctum\'s light ' + JSON.stringify(r));
    } else if (mode === 'C') {
      ok(r.phase === 'won' && r.done, 'C: without the boss, Scorpio wakes as before ' + JSON.stringify({ phase: r.phase, done: r.done }));
      ok(await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 30000 }).then(() => true, () => false), 'C: the gate is won (the stage ends)');
      r = await M(() => window.__pp.riftState().gates.dunes); ok(r === 1, 'C: the gate is marked done');
    } else {
      await runG(3.0); r = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; return { phase: m.S.phase, goal: document.getElementById('arcGoal').textContent, boss: !!(D.g.boss || D.mons.find(q => q.boss)) }; });
      ok(r.phase === 'boss' && /Asmodeus|Fester/.test(r.goal), 'D: the real SCORPIO_BOSS begins in the sanctum ' + JSON.stringify(r));
    }
    r = await M(async () => { const P = window.__pp; P.closeArcade(true); await new Promise(r => setTimeout(r, 400)); return { live: !!window.SCORPIO_GATE.live, cached: window.SCORPIO_PROPS.stats.cached, stand: window.SCORPIO_GATE.STANDIN.active(), stop: window.__SGLOG ? window.__SGLOG.stop : null }; });
    ok(!r.live && r.cached === 0 && !r.stand && (mode !== 'B' || r.stop >= 1), `${mode}: closing the stage releases the gate, its pictures and its boss ` + JSON.stringify(r));
    ok(!errors.length, `${mode}: no page errors ` + errors.slice(0, 3).join(' | '));
    await T.browser.close(); };
  for (const m of (process.env.ONLY || 'A,B,C,D').split(',')) await runOne(m);
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
