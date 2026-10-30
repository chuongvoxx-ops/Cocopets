// the Choir core (20zy2): the brood behave (a mite widens then pulses; an eel lights three mouth lights then fires three
// notes; a hush moth silences a pad until hit), a pad charges and latches, a countdown border runs out, beats strike in
// order, and the live cap holds. Game-time waits (the headless page runs at ~5 fps). HTML=test-cho.html node tests/_cho-mech.js
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => {
  const T = await open({ lvl: 98, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'basilica', 'colours'] }); const { page, errors, shot, start, run } = T;
  await start('choir', 0);
  // (the game-time helper lives in the page: G(secs, each) waits that many seconds of game time, calling each per frame)
  await page.evaluate(() => { window.G = (secs, each) => new Promise(res => { const D = window.__pp.arc.game._dbg, t0 = D.g.t; const f = () => { const r = each && each(D.g.t - t0); if (r === true || D.g.t - t0 >= secs) return res(); requestAnimationFrame(f); }; f(); }); });
  const setup = (type, dist) => page.evaluate(([type, dist]) => { const D = window.__pp.arc.game._dbg, X = D.RIFT.self.amb.C.X, me = D.me; for (const m of D.mons) if (!m.dead) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } D.g.reserve.length = 0;
    const s = D.M.start; me.x = s.x; me.y = s.y; me.vx = me.vy = 0; const q = X.freeSpot(s.x + dist, s.y, 0.6) || { x: s.x + dist, y: s.y }; const m = X.spawnMon(type, q.x, q.y, { pack: 990, rift: true, aggro: true }); m.aggro = true; m.cd = 0.3; window.M0 = m; return { mx: m.x, my: m.y }; }, [type, dist]);
  // 1. a bell mite: its shell widens (0.8 s, a ring shown), then it pulses
  await setup('bellmite', 1.8);
  const mite = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, m = window.M0, px = D.me.x, py = D.me.y; let wStart = -1, pulseAt = -1, maxWid = 0, modes = new Set(), warned = false;
    await window.G(8, t => { D.me.x = px; D.me.y = py; D.me.hp = D.ST.hp; if (m.wid > 0 && wStart < 0) wStart = t; maxWid = Math.max(maxWid, m.wid || 0); if (m.mode) modes.add(m.mode); if (D.zones.some(z => z.kind === 'warn' && z.src === m)) warned = true; if ((m.pulses || 0) > 0 && pulseAt < 0) { pulseAt = t; return true; } });
    return { wStart: +wStart.toFixed(2), pulseAt: +pulseAt.toFixed(2), widenFor: +(pulseAt - wStart).toFixed(2), maxWid: +maxWid.toFixed(2), modes: [...modes], warned }; });
  ok(mite.wStart >= 0 && mite.pulseAt > mite.wStart && mite.widenFor > 0.5 && mite.widenFor < 1.2 && mite.maxWid > 0.8 && mite.warned && mite.modes.includes('w4'), 'a bell mite widens its shell (~0.8 s, ring shown), then pulses', mite);
  await shot('cho-mech-mite');
  // 2. a pipe eel: three mouth lights one by one, then three shots one a beat
  await setup('pipeeel', 5);
  const eel = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, m = window.M0, px = D.me.x, py = D.me.y; const seq = []; let lastL = 0, firstShotAt = -1, maxLights = 0, shotsSeen = 0, eshots = new Set();
    await window.G(10, t => { D.me.x = px; D.me.y = py; D.me.hp = D.ST.hp; const L = m.lights || 0; if (L !== lastL && m.litT !== undefined) { seq.push([L, +t.toFixed(2)]); lastL = L; } maxLights = Math.max(maxLights, L); for (const e of D.eshots) if (e.src === m) eshots.add(e); if ((m.shots || 0) > shotsSeen) { if (shotsSeen === 0) firstShotAt = t; shotsSeen = m.shots; } if (shotsSeen >= 3) return true; });
    const lit3 = (seq.find(s => s[0] === 3) || [0, -1])[1]; return { seq, maxLights, lit3, firstShotAt: +firstShotAt.toFixed(2), shots: shotsSeen, eshots: eshots.size }; });
  ok(eel.maxLights === 3 && eel.seq.slice(0, 3).map(s => s[0]).join() === '1,2,3' && eel.lit3 >= 0 && eel.firstShotAt >= eel.lit3 && eel.shots === 3 && eel.eshots === 3, 'a pipe eel lights its three mouth lights one by one, then fires three notes', eel);
  await shot('cho-mech-eel');
  // 3. a hush moth: settles on a pad and silences it (no steps) until a hit interrupts it
  await setup('hushmoth', 3);
  const moth = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb, { CHO, C } = A, X = C.X, m = window.M0, s = D.M.start; let steps = 0;
    const p = CHO.pad(X, { x: s.x - 2.5, y: s.y + 0.5, sym: 2, label: 'TEST', onStep: () => steps++ }); m.cd = 0; const px = s.x + 2, py = s.y;
    let silAt = -1; await window.G(10, t => { D.me.x = px; D.me.y = py; D.me.hp = D.ST.hp; if (CHO.silenced(p)) { silAt = t; return true; } });
    // walk onto the pad while it is hushed: no step
    await window.G(0.6, () => { D.me.x = p.x; D.me.y = p.y; }); const stepsHushed = steps; await window.G(0.5, () => { D.me.x = px; D.me.y = py; });
    const stillSil = CHO.silenced(p);
    // a hit interrupts it
    D.hitMon(m, 5, { flat: true }); let freedAt = -1; await window.G(2, t => { D.me.x = px; D.me.y = py; if (!CHO.silenced(p)) { freedAt = t; return true; } });
    await window.G(0.6, () => { D.me.x = p.x; D.me.y = p.y; }); const stepsAfter = steps;
    window.PAD = p; return { silAt: +silAt.toFixed(2), stepsHushed, stillSil, freedAt: +freedAt.toFixed(2), stepsAfter, interrupts: m.interrupts || 0, silences: m.silences || 0, alive: !m.dead }; });
  ok(moth.silAt >= 0 && moth.silences >= 1, 'a hush moth flies to the drum pad and silences it', moth);
  ok(moth.stepsHushed === 0 && moth.stillSil, 'a silenced pad takes no step while the moth holds it', moth);
  ok(moth.freedAt >= 0 && moth.interrupts === 1 && moth.stepsAfter === 1, 'a hit interrupts the moth: the pad is free and takes steps again', moth);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, CHO = D.RIFT.self.amb.CHO; CHO.unpad(D.RIFT.self.amb.C.X, window.PAD); for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); });
  // 4. a charge pad: standing charges it; stepping off it keeps trickling for the 2 s latch, then pauses (never erases); full fires once
  const pad = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, { CHO, C } = D.RIFT.self.amb, X = C.X, s = D.M.start; let fulls = 0; const p = CHO.pad(X, { x: s.x, y: s.y - 2, need: 5, latch: 2, sym: 4, onFull: () => fulls++ }); const off = [s.x + 3, s.y + 1];
    await window.G(1.5, () => { D.me.x = p.x; D.me.y = p.y; }); const on15 = p.charge;
    await window.G(1.0, () => { D.me.x = off[0]; D.me.y = off[1]; }); const latch1 = p.charge, latching = p.charging;
    await window.G(2.5, () => { D.me.x = off[0]; D.me.y = off[1]; }); const paused = p.charge, latchT = p.latchT;
    await window.G(1.5, () => { D.me.x = off[0]; D.me.y = off[1]; }); const still = p.charge;
    await window.G(4, () => { D.me.x = p.x; D.me.y = p.y; if (p.full) return true; }); await window.G(0.5, () => { D.me.x = p.x; D.me.y = p.y; });
    // a countdown border runs out and calls back
    let ended = -1; p.countdown(1.2, () => { ended = D.g.t; }); const c0 = D.g.t; await window.G(2, () => { D.me.x = off[0]; D.me.y = off[1]; if (ended > 0) return true; });
    const r = { on15: +on15.toFixed(2), latch1: +latch1.toFixed(2), latching, paused: +paused.toFixed(2), latchT, still: +still.toFixed(2), full: p.full, fulls, countdown: +(ended - c0).toFixed(2) }; window.PAD = p; return r; });
  ok(pad.on15 > 1.2 && pad.on15 < 1.8, 'standing on a charge pad charges it', pad.on15);
  ok(pad.latching && pad.latch1 > pad.on15 + 0.7, 'stepping off: the latch keeps it trickling', pad);
  ok(pad.latchT === 0 && Math.abs(pad.paused - (pad.on15 + 2)) < 0.4 && pad.still === pad.paused, 'after the 2 s latch the charge pauses, never erased', pad);
  ok(pad.full && pad.fulls === 1, 'back on the pad it fills, and onFull fires once', pad);
  ok(pad.countdown > 1.0 && pad.countdown < 1.6, 'a countdown border runs out and calls back', pad.countdown);
  await shot('cho-mech-pad');
  // 5. a phrase of beats strikes in its numbered order; the one under the pet reports a hit; a hush beat never hurts
  const bt = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, { CHO, C } = D.RIFT.self.amb, X = C.X, me = D.me, x = me.x, y = me.y, order = [];
    CHO.unpad(X, window.PAD);
    const ps = CHO.phrase(X, [{ shape: 'ring', x, y, r0: 2, r1: 4 }, { shape: 'disc', x, y, r1: 1.5, dmg: 1 }, { shape: 'lane', x: x - 6, y: y + 3, a: 0, len: 12, w: 2, hush: true }], { lead: 1.2, gap: 0.6 });
    ps.forEach(p => { p.fn = (q, hit) => order.push([q.n, hit]); });
    const nums = ps.map(p => p.n), drawn = CHO.beats(X).length; await window.G(4, () => { D.me.x = x; D.me.y = y; if (order.length >= 3) return true; });
    return { nums, drawn, order, left: CHO.beats(X).filter(p => !p.done).length }; });
  ok(bt.nums.join() === '1,2,3' && bt.drawn === 3 && bt.order.map(o => o[0]).join() === '1,2,3', 'a phrase of beats strikes in its numbered order', bt);
  ok(bt.order[0][1] === false && bt.order[1][1] === true && bt.order[2][1] === false, 'only the beat under the pet hits (the ring around it and the hush beat do not)', bt.order);
  // a screenshot of the previews mid-count
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, { CHO, C } = D.RIFT.self.amb, X = C.X, x = D.me.x, y = D.me.y; CHO.phrase(X, [{ shape: 'ring', x, y, r0: 0, r1: 2.2 }, { shape: 'ring', x, y, r0: 2.2, r1: 4.4 }, { shape: 'cone', x, y, a: -1.2, len: 6, spread: 0.5, echo: true }, { shape: 'lane', x: x - 5, y: y + 4, a: 0, len: 10, w: 2, hush: true }], { lead: 6, gap: 1 }); CHO.pad(X, { x: x + 3, y: y - 3, sym: 1, need: 4 }).light(true).countdown(5); });
  await run(0.8); await shot('cho-mech-beats'); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, { CHO, C } = D.RIFT.self.amb; CHO.clearBeats(C.X); C.pads.length = 0; });
  // 6. the rift's tuning (Rift 9's as it stands) and the live cap: never more than sixty on the field
  const rf = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.choir; return { ease: R.ease, monEase: R.monEase, miniDmg: R.miniDmg, liveCap: R.liveCap, monCount: R.monCount, miniHp: R.stages.filter(s => s.mini).map(s => s.hpK), sigil: R.sigil, lvl: R.lvl, plan: window.__pp.RIFT_PLAN.find(r => r.id === 'choir').sigil }; });
  ok(rf.ease === 0.55 && rf.monEase === 0.35 && rf.miniDmg === 0.7 && rf.liveCap === 60 && rf.monCount === 0.65 && rf.miniHp.every(v => v === 0.294) && rf.sigil === 'Rhythm' && rf.plan === 'Rhythm', 'the Choir carries Rift 9\'s tuning and the Rhythm sigil', rf);
  for (const st of [0, 3, 6]) { await start('choir', st); await run(2.5);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const live = D.mons.filter(m => !m.dead && !m.fobj && !m.boss); return { live: live.length, reserve: D.g.reserve.length, cap: D.F.liveCap, all: live.length + D.g.reserve.length, eel: live.filter(m => m.type === 'pipeeel').length + D.g.reserve.filter(m => m.type === 'pipeeel').length }; });
    ok(r.cap === 60 && r.live <= 60, `stage ${st}: at most sixty on the field (${r.live} out, ${r.reserve} waiting)`, r);
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; for (const m of D.mons.filter(m => !m.dead && !m.boss && !m.fobj).slice(0, 30)) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } });
    await run(2.5); const q = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { live: D.mons.filter(m => !m.dead && !m.fobj && !m.boss).length, reserve: D.g.reserve.length }; });
    ok(q.live <= 60, `stage ${st}: still at most sixty after a wave falls and the waiting walk in`, q); }
  ok(!errors.length, 'no page errors', errors.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await T.browser.close(); process.exit(bad ? 1 : 0);
})();
