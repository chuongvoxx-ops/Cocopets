// The Yuggoth Engine's last boss, animated: Nyar'zhul run through its wake, a full act cycle (the beat, Heartbeat Pulse,
// Piston Row, Cable Lash, Clamp, Overload), the pulse's ring dodged in its gap and by a roll, a piston row, a lash and a
// clamp (the clamp struck), the capacitors broken (the lens bared and struck), its minions, the Coolant Flood (it hurts off
// the grates and not on them), the Repair Swarm (300 mites, no more than 60 at once, those that reach a port mend it, it
// cannot be struck meanwhile, then it stalls), Overdrive (the pulses doubled), and the kill handing over to the rift's
// sealing, with no page errors; screenshots (SHOTS=1) into shots/anim-yug-<boss>*.png.
// usage: node tests/_boss-anim-yuggoth.js [nyarzhul]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { nyarzhul: ['beat', 'pulse', 'pistons', 'lash', 'clamp', 'overload'] };
const NAMES = { nyarzhul: 'Nyar\'zhul' };
const MINIONS = { nyarzhul: ['sparkmite', 'coilsentry', 'hullwing'] };
const WEAK = { nyarzhul: 'lens' };
const RX = 17, RY = 12, SRC = [0, -13.2], GRATES = [[-8.8, -3.4], [8.8, -3.4], [-4.8, 6.2], [4.8, 6.2], [0, 0.4]], CAPS = [[-14.9, -4.6], [14.9, -4.6], [-11.2, 7.7], [11.2, 7.7]];
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['nyarzhul'];
  const T = await open({ lvl: 62, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora'] }); const { page, errors, start, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-yug-${name}.png`) }); };
  // (wait in frames until a condition holds, keeping the pet alive; the condition is a function body over D, b, M, C)
  const until = (body, secs, keep) => page.evaluate(async ([body, secs, keep]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, f = new Function('D', 'b', 'M', 'C', body), k = keep ? new Function('D', 'b', 'M', 'C', keep) : null; const t0 = performance.now();
    while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (k) k(D, b, M, C); if (f(D, b, M, C)) return true; } return false; }, [body, secs, keep || null]);
  const force = act => page.evaluate(act => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; b.stunT = 0; M.nextSig = act; b.act = 'beat'; b.actT = 99; }, act);
  const clearMins = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.fminion && !m.swarm) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } });
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.yuggoth ? R.yuggoth.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 8, `${id}: stage ${idx}`); if (idx < 0) continue;
    await start('yuggoth', idx);
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 3 && r.seal, `${id}: a Super Fiend-class fight, the rift's last (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    // the arena: an oval 34 m across, the gantry to the heart's foot, the grates and capacitors on the floor
    r = await page.evaluate(([RX, RY, GRATES, CAPS]) => { const D = window.__pp.arc.game._dbg, M = D.M, C = M.FC, t = (x, y) => M.G[Math.floor(y) * M.MW + Math.floor(x)]; return { east: t(C.x + RX - 0.8, C.y), outE: t(C.x + RX + 0.8, C.y), south: t(C.x + 4, C.y + RY - 1.2), outS: t(C.x, C.y + RY + 0.8), floor: t(C.x, C.y), gantry: t(C.x, C.y - 14.4), pit: t(C.x + 4, C.y - 14.4), grates: GRATES.map(([x, y]) => t(C.x + x, C.y + y)), caps: CAPS.map(([x, y]) => t(C.x + x, C.y + y)), me: [D.me.x - C.x, D.me.y - C.y] }; }, [RX, RY, GRATES, CAPS]);
    console.log('  arena', JSON.stringify(r)); ok(r.east === r.floor && r.south === r.floor && r.outE !== r.floor && r.outS !== r.floor && r.gantry === r.floor && r.pit !== r.floor && r.grates.every(v => v === r.floor) && r.caps.every(v => v === r.floor) && Math.abs(r.me[0]) < RX && Math.abs(r.me[1]) < RY, `${id}: the 34 m oval, the gantry over the pit, grates and capacitors on the floor`);
    await run(0.6); await shot(id + '-intro'); await run(1.6); await shot(id + '-intro2');
    await run(3.2);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; return { act: b.act, wake: M.P.wake, beats: M.beats }; });
    console.log('  wake', JSON.stringify(r)); ok(r.act && r.act !== 'enter' && r.wake > 0.9 && r.beats >= 1, `${id}: awake and beating (${r.act}, ${r.beats} beats)`);
    // an act cycle, the boss kept above 80%
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, seen = new Set(), ban = new Set(); const t0 = performance.now();
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.hp < b.maxhp * 0.8) b.hp = b.maxhp * 0.8;
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 100]);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 5, `${id}: the attacks are named in banners`);
    await until("return b.act === 'beat' && !b.stunT && b.actT > 0.2", 25); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x + 2; D.me.y = C.y + 2; D.me.vx = D.me.vy = 0; D.g.boss.actT = -1; });
    await run(0.1); await shot(id); await run(0.35); await shot(id + '-b');
    const mv = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, a = JSON.stringify(M.cab[0].pts[12].map(v => v.toFixed(2))) + M.ap.toFixed(3); D.g.boss.actT = -1; await new Promise(r => setTimeout(r, 450)); return a !== JSON.stringify(M.cab[0].pts[12].map(v => v.toFixed(2))) + M.ap.toFixed(3); });
    ok(mv, `${id}: never still (its cables sway and its iris works)`);
    // Heartbeat Pulse: a ring on each beat with a gap; standing in the gap, and rolling through, it passes; standing in it, it strikes
    await force('pulse');
    const pu = await page.evaluate(async SRC => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ox = C.x + SRC[0], oy = C.y + SRC[1], out = { cases: [] }; const s0 = Object.assign({}, M.stat); let ring = null, mode = 0; const t0 = performance.now();
      while (performance.now() - t0 < 20000 && mode < 3) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'beat') { M.nextSig = 'pulse'; b.actT = 99; }
        if (!ring) { ring = M.rings.find(R => !R.hit && !R.passed && R.r < 3); if (ring) { ring.mode = mode; ring.h0 = M.stat.ringHit; ring.p0 = M.stat.ringPass; const d = 9, a = mode === 0 ? ring.gap : ring.gap + 0.9; D.me.x = ox + Math.cos(a) * d; D.me.y = oy + Math.sin(a) * d; D.me.vx = D.me.vy = 0; if (mode === 0) out.gapShot = true; } continue; }
        D.me.vx = D.me.vy = 0; const d = Math.hypot(D.me.x - ox, D.me.y - oy);
        if (mode === 1 && d - ring.r < 0.8 && !ring.dodged) { ring.dodged = true; D.me.dodge = { t: 0, dur: 0.3, vx: 0, vy: 0, perf: false }; }
        if (mode === 0 && !out.shot && ring.r > 6) { out.shot = true; break; }
        if (ring.hit || ring.passed) { out.cases.push({ mode, hit: M.stat.ringHit - ring.h0, pass: M.stat.ringPass - ring.p0 }); ring = null; mode++; } }
      out.gw = M.rings.length ? M.rings[0].gw : null; out.rings = M.stat.rings - s0.rings; return out; }, SRC);
    await shot(id + '-pulse');
    const pu2 = await page.evaluate(async SRC => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ox = C.x + SRC[0], oy = C.y + SRC[1], out = { cases: [] }; let ring = M.rings.find(R => R.mode === 0 && !R.hit && !R.passed) || null, mode = ring ? 0 : 1; if (ring) { ring.h0 = M.stat.ringHit; ring.p0 = M.stat.ringPass; } const t0 = performance.now();
      while (performance.now() - t0 < 25000 && mode < 3) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'beat') { M.nextSig = 'pulse'; b.actT = 99; }
        if (!ring) { ring = M.rings.find(R => !R.hit && !R.passed && R.r < 3); if (ring) { ring.h0 = M.stat.ringHit; ring.p0 = M.stat.ringPass; const d = 9, a = mode === 0 ? ring.gap : ring.gap + 0.9; D.me.x = ox + Math.cos(a) * d; D.me.y = oy + Math.sin(a) * d; } continue; }
        D.me.vx = D.me.vy = 0; const d = Math.hypot(D.me.x - ox, D.me.y - oy); if (mode === 1 && d - ring.r < 0.8 && !ring.dodged) { ring.dodged = true; D.me.dodge = { t: 0, dur: 0.3, vx: 0, vy: 0, perf: false }; }
        if (ring.hit || ring.passed) { out.cases.push({ mode, hit: M.stat.ringHit - ring.h0, pass: M.stat.ringPass - ring.p0 }); ring = null; mode++; } } return out; }, SRC);
    const cases = pu2.cases; console.log('  pulse', JSON.stringify(pu), JSON.stringify(cases));
    const cg = cases.find(c => c.mode === 0), cd = cases.find(c => c.mode === 1), ch = cases.find(c => c.mode === 2);
    ok(pu.rings > 0 && pu.gw > 0, `${id}: Heartbeat Pulse sends rings out over the floor, each with a gap`);
    ok(cg && cg.pass === 1 && cg.hit === 0, `${id}: standing in the ring's gap, it passes by`);
    ok(cd && cd.pass === 1 && cd.hit === 0, `${id}: rolling through the ring, it passes by`);
    ok(ch && ch.hit === 1, `${id}: standing in the ring's band, it strikes`);
    await until("return b.act === 'beat'", 15);
    // Piston Row: numbered lanes; standing in a lane already struck, the next ones miss
    await force('pistons');
    const pi = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, S = D.FD.S; const t0 = performance.now(); let lanes = []; while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; lanes = S.tele.filter(s => s.lane); if (lanes.length) break; }
      const labs = lanes.map(s => s.lane.lab), s0 = Object.assign({}, M.stat); D.me.x = C.x + 1; D.me.y = C.y - 7.8; D.me.vx = D.me.vy = 0; let shot = false;
      // (stand in lane 2 until lane 1 has struck, then step north into it)
      const l1 = lanes.find(s => s.lane.k === 0), l2 = lanes.find(s => s.lane.k === 1); while (performance.now() - t0 < 12000 && !l1.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + 1; D.me.y = C.y - 7.8; if (!shot && l1.age / l1.t > 0.75) { shot = true; window.__yugShot = 1; } }
      const split = l1.t !== l2.t; D.me.x = C.x + 1; D.me.y = C.y - 10.4; while (performance.now() - t0 < 16000 && S.tele.some(s => s.lane)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + 1; D.me.y = C.y - 10.4; }
      return { n: lanes.length, labs, split, hit: M.stat.laneHit - s0.laneHit, safe: M.stat.laneSafe - s0.laneSafe, act: b.act }; });
    console.log('  pistons', JSON.stringify(pi)); ok(pi.n === 9 && pi.labs.length === 9, `${id}: Piston Row: nine numbered lanes across the floor (${pi.labs.join(' ')})`);
    ok(pi.hit === 0 && pi.safe === 9, `${id}: in lane 2 until lane 1 strikes, then stepping into lane 1, every lane misses (hit ${pi.hit}, safe ${pi.safe})`);
    // (a shot of the pistons coming down)
    const ph0 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; return { hit: M.stat.laneHit, safe: M.stat.laneSafe }; });
    const pin = "D.me.x = C.x + 1; D.me.y = C.y + 0.2; D.me.vx = D.me.vy = 0;";
    await force('pistons'); await until("return D.FD.S.tele.some(s => s.lane && s.age / s.t > 0.8)", 8, pin); await shot(id + '-pistons'); await until("return D.FD.S.tele.some(s => s.lane && s.done)", 4, pin); await run(0.15); await shot(id + '-pistons-slam'); await until("return !D.FD.S.tele.some(s => s.lane)", 12, pin);
    const ph1 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; return { hit: M.stat.laneHit, safe: M.stat.laneSafe }; });
    ok(ph1.hit - ph0.hit === 1 && ph1.safe - ph0.safe === 8, `${id}: standing still in lane 5, only its own row strikes (hit ${ph1.hit - ph0.hit}, safe ${ph1.safe - ph0.safe})`); await until("return b.act === 'beat'", 12);
    // Cable Lash: a cable rears over a shown arc, then sweeps it; spent, it can be struck
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x - 7; D.me.y = C.y + 1; }); await force('lash');
    const la = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, S = D.FD.S; const t0 = performance.now(); let cone = null; while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x - 7; D.me.y = C.y + 1; cone = S.tele.find(s => s.shape === 'cone' && !s.done); if (cone && cone.age > cone.t * 0.7) break; }
      const cb = M.cab[0]; return { cone: !!cone, lift: cb.lift, mode: cb.mode, tipZ: cb.tip[2] }; });
    await shot(id + '-lash');
    const la2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const t0 = performance.now(); while (performance.now() - t0 < 4000 && M.cab[0].mode !== 'spent') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const cb = M.cab[0]; return { mode: cb.mode, px: !!(cb.px && !cb.px.dead), hit: M.stat.lashHit }; });
    await shot(id + '-lash-sweep');
    console.log('  lash', JSON.stringify(la), JSON.stringify(la2)); ok(la.cone && la.lift > 0.6 && la.tipZ > 3 && la.mode === 'rear', `${id}: Cable Lash: the cable rears over a shown arc`); ok(la2.mode === 'spent' && la2.px, `${id}: after the sweep the spent cable lies on the floor, open to blows`);
    await until("return b.act === 'beat'", 10);
    // Clamp: a shown circle under the pet, the cable rises over it and bites; the clamp holds and can be struck
    await force('clamp');
    const cl = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, S = D.FD.S; window.__ch0 = M.stat.clampHit; D.me.x = C.x + 3; D.me.y = C.y + 2; const t0 = performance.now(); let circ = null; while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; circ = S.tele.find(s => s.shape === 'circle' && !s.done); if (circ && circ.age > circ.t * 0.65) break; }
      const up = M.cab.find(q => q.mode === 'crear'); const out = { circ: !!circ, cx: circ ? circ.x - D.me.x : null, up: !!up, upZ: up ? up.tip[2] : 0 }; D.me.x += 4; D.me.vx = D.me.vy = 0; return out; });
    await shot(id + '-clamp');
    const cl2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; const t0 = performance.now(); let h = null; while (performance.now() - t0 < 4000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; h = M.cab.find(q => q.mode === 'hold' && q.px); if (h) break; } if (!h) return { hold: false };
      const hp0 = b.hp; D.hitMon(h.px, 1000, { flat: true }); return { hold: true, dmg: hp0 - b.hp, hit: M.stat.clampHit - window.__ch0, clamps: M.stat.clamps }; });
    await run(0.1); await shot(id + '-clamp-hold');
    console.log('  clamp', JSON.stringify(cl), JSON.stringify(cl2)); ok(cl.circ && cl.up && cl.upZ > 3, `${id}: Clamp: a cable rises over a shown circle`); ok(cl2.hold && cl2.dmg > 1000 && cl2.hit === 0, `${id}: out of the circle the bite misses; the clamp holds and struck it passes more than the blow to the heart (${Math.round(cl2.dmg || 0)})`);
    await until("return b.act === 'beat'", 12);
    // Overload: charged capacitors; break them all in time and the lens is bared
    await force('overload');
    const ov = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const t0 = performance.now(); while (performance.now() - t0 < 5000 && !M.ov) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } await new Promise(r => setTimeout(r, 900)); const caps = M.caps.filter(c => c.st === 'charged' && c.o && !c.o.dead); return { n: caps.length, W: M.ov && M.ov.W }; });
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, o = M.caps.find(c => c.st === 'charged').o; D.me.x = o.x + 1.4; D.me.y = o.y + 0.9; }); await run(0.2); await shot(id + '-overload');
    const st = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; for (const cp of M.caps) if (cp.st === 'charged' && cp.o) D.hitMon(cp.o, 1e12, { flat: true }); await new Promise(r => setTimeout(r, 1300)); const w = D.FD.S.weak[weak]; return { stun: b.stunT, weak: !!(w && !w.dead), fwd: w ? w.forward : 0, wy: w ? w.y - C.y : null, sag: M.P.sag, under: !!b.under, bared: M.stat.bared }; }, WEAK[id]);
    console.log('  overload', JSON.stringify(ov), JSON.stringify(st)); ok(ov.n === 2 && ov.W > 5, `${id}: Overload charges capacitors (${ov.n}, ${ov.W && ov.W.toFixed(1)} s)`);
    ok(st.stun > 0 && st.weak && st.fwd >= 2 && st.sag > 0.6 && !st.under && st.wy > -RY - 3.5 && st.wy < -RY + 1, `${id}: all charged ones broken, the heart sags onto its gantry: its lens bared (x${st.fwd})`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x + 0.6; D.me.y = C.y - 12.6; D.me.vx = D.me.vy = 0; }); await run(0.3); await shot(id + '-bared');
    const wh = await page.evaluate(weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, w = D.FD.S.weak[weak], h0 = b.hp; D.hitMon(w, 1000, { flat: true }); return h0 - b.hp; }, WEAK[id]);
    ok(wh > 2000, `${id}: the lens takes ${Math.round(wh)} from a blow of 1000`); await run(0.12); await shot(id + '-bared-hit');
    await until("return !(b.stunT > 0) && b.act === 'beat'", 10);
    // the overload missed: the charge leaps at the pet
    await force('overload'); const dis = await until("return M.stat.discharges > 0", 25); ok(dis, `${id}: unbroken, the capacitors discharge at the pet`); await until("return b.act === 'beat'", 8);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors in the first act (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // phase two: its minions; the Coolant Flood (hurts off the grates and not on them)
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.66; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p2.phase === 2, `${id}: phase two`); await run(0.5); await shot(id + '-phase');
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0, `${id}: second-act minions (${mins.join(', ')})`); await clearMins();
    const fl = await page.evaluate(async GR => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, out = {}; const t0 = performance.now(); if (b.hp < b.maxhp * 0.56) b.hp = b.maxhp * 0.62;
      while (performance.now() - t0 < 12000 && !M.fl) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'beat') { M.nextSig = 'flood'; b.actT = 99; } }
      out.rise = M.fl && M.fl.st; const s0 = Object.assign({}, M.stat); D.me.x = C.x + 2.5; D.me.y = C.y + 3; while (performance.now() - t0 < 20000 && M.fl && M.fl.st === 'rise') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (M.fl.lv > 0.5 && !out.half) { out.half = true; window.__yugHalf = 1; break; } } return out; }, GRATES);
    await shot(id + '-flood-rise');
    const fl2 = await page.evaluate(async GR => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; const t0 = performance.now(); while (performance.now() - t0 < 8000 && M.fl && M.fl.st === 'rise') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + 2.5; D.me.y = C.y + 3; }
      const s0 = Object.assign({}, M.stat); let t1 = performance.now(); while (performance.now() - t1 < 1500 && M.fl) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + 2.5; D.me.y = C.y + 3; D.me.vx = D.me.vy = 0; }
      const wet = { hits: M.stat.floodHits - s0.floodHits, wet: M.stat.floodWet - s0.floodWet, chill: D.me.chill };
      D.me.x = C.x + GR[4][0] + 0.3; D.me.y = C.y + GR[4][1] + 0.2; await new Promise(r => requestAnimationFrame(r)); await new Promise(r => requestAnimationFrame(r)); const s1 = Object.assign({}, M.stat); t1 = performance.now(); while (performance.now() - t1 < 2000 && M.fl && M.fl.st === 'full') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + GR[4][0] + 0.3; D.me.y = C.y + GR[4][1] + 0.2; D.me.vx = D.me.vy = 0; }
      return { wet, dry: { hits: M.stat.floodHits - s1.floodHits, wet: M.stat.floodWet - s1.floodWet, dry: M.stat.floodDry - s1.floodDry }, st: M.fl && M.fl.st }; }, GRATES);
    await shot(id + '-flood');
    console.log('  flood', JSON.stringify(fl), JSON.stringify(fl2)); ok(fl.rise === 'rise' && fl.half, `${id}: Coolant Flood: shown rising from the rim`);
    ok(fl2.wet.hits >= 2 && fl2.wet.wet > 1 && fl2.wet.chill > 0, `${id}: off the grates the coolant burns and slows (${fl2.wet.hits} ticks)`); ok(fl2.dry.hits === 0 && fl2.dry.wet === 0 && fl2.dry.dry > 1, `${id}: on a raised grate it never touches the pet (dry ${fl2.dry.dry.toFixed(1)} s)`);
    await until("return b.act === 'beat' && !M.fl", 15); await clearMins();
    // the Repair Swarm: half way down
    const sw = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; b.hp = b.maxhp * 0.5; const ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 30000 && b.act !== 'swarm') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); if (b.act !== 'beat' && b.act !== 'swarm' && !b.stunT && !M.fl) { b.act = 'beat'; b.actT = 99; } } D.banners.forEach(x => ban.add(x.s)); return { act: b.act, banners: [...ban] }; });
    console.log('  swarm', JSON.stringify(sw)); ok(sw.act === 'swarm' && sw.banners.includes('THE REPAIR SWARM'), `${id}: half way down, the repair swarm pours out`);
    await run(2.2); await shot(id + '-swarm');
    const sw2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; let maxAlive = 0; const t0 = performance.now(); while (performance.now() - t0 < 2500) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; maxAlive = Math.max(maxAlive, D.mons.filter(q => !q.dead && q.swarm).length); }
      const h0 = b.hp; D.hitMon(b, 1e6, { pierce: true }); const untouched = b.hp === h0, under = !!b.under, parts = D.mons.filter(q => !q.dead && q.fobj && q.kind === 'part').length;
      // a mite that reaches its port mends the heart
      const q = D.mons.find(q => !q.dead && q.swarm && !q.launch); const r0 = M.stat.repairs, hp1 = b.hp; let healed = 0, shown = false; if (q) { q.x = q.home.x + 0.2; q.y = q.home.y + 0.1; const t1 = performance.now(); while (performance.now() - t1 < 1500 && !q.dead) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } healed = b.hp - hp1; shown = D.banners.some(x => x.s === 'REPAIRING') || M.repairT > 0; }
      return { maxAlive, untouched, under, parts, mite: !!q, repairs: M.stat.repairs - r0, healed, shown, left: M.sw.left, list: M.sw.list.length }; });
    console.log('  swarm2', JSON.stringify(sw2)); ok(sw2.maxAlive > 20 && sw2.maxAlive <= 60, `${id}: the mites pour out, no more than sixty at once (${sw2.maxAlive})`);
    ok(sw2.untouched && sw2.under && sw2.parts === 0, `${id}: it cannot be struck while they pour`); ok(sw2.mite && sw2.repairs === 1 && sw2.healed > 0 && sw2.shown, `${id}: a mite reaching its port mends the heart (+${sw2.healed}, REPAIRING)`);
    await run(0.3); await shot(id + '-repair');
    const sw3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, kinds = new Set(); let maxAlive = 0, rings = 0; const r0 = M.stat.rings, p0 = M.stat.poured; const t0 = performance.now(); let shot = false;
      while (performance.now() - t0 < 150000 && M.sw) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const live = D.mons.filter(q => !q.dead && q.swarm); maxAlive = Math.max(maxAlive, live.length); for (const q of live) { kinds.add(q.type); if (!q.launch) { q.guardFn = null; D.hitMon(q, 1e9, { flat: true }); } } }
      await new Promise(r => setTimeout(r, 900)); const w = D.FD.S.weak.lens; return { done: M.swDone, poured: M.stat.poured, total: M.stat.poured, maxAlive, kinds: [...kinds], rings: M.stat.rings - r0, stun: b.stunT, stall: M.stall, weak: !!(w && !w.dead), fwd: w ? w.forward : 0, under: !!b.under, heat: M.P.heat }; });
    console.log('  swarm3', JSON.stringify(sw3)); ok(sw3.done && sw3.total === 300 && sw3.maxAlive <= 60, `${id}: all three hundred poured and cleared (never more than ${sw3.maxAlive} at once)`);
    ok(sw3.rings > 0, `${id}: it kept pulsing at the pet while they poured (${sw3.rings} rings)`);
    ok(sw3.stun > 0 && sw3.stall && sw3.weak && sw3.fwd >= 2.5 && !sw3.under, `${id}: spent, it overheats and stalls: its lens bared (x${sw3.fwd})`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x - 1.5; D.me.y = C.y - 11.6; }); await run(0.8); await shot(id + '-stall');
    await until("return !(b.stunT > 0)", 10);
    // phase three: Overdrive, the pulses doubled
    const p3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.28; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 3) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p3.phase === 3, `${id}: phase three`); await clearMins();
    const db = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; const t0 = performance.now(); const r0 = M.stat.rings; let beats0 = null; while (performance.now() - t0 < 15000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + 3; D.me.y = C.y + 4; if (b.act !== 'pulse' && beats0 == null) { if (b.act === 'beat') { M.nextSig = 'pulse'; b.actT = 99; } continue; } if (beats0 == null) beats0 = M.beats; if (M.beats - beats0 >= 2 && !(M.ring2T > 0)) break; }
      return { rings: M.stat.rings - r0, beats: M.beats - (beats0 || 0), act: b.act }; });
    console.log('  overdrive', JSON.stringify(db)); ok(db.rings >= 2 * db.beats && db.beats >= 2, `${id}: Overdrive: two rings to a beat (${db.rings} rings in ${db.beats} beats)`);
    await run(0.4); await shot(id + '-overdrive');
    const e2 = errors.length; ok(e2 === e0, `${id}: no page errors (${e2 - e0})`); if (e2 > e0) console.log(errors.slice(e0, e2).join('\n'));
    // the kill: the last boss of the rift hands over to the sealing
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.g.boss.stunT = 0; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); let shot = 0; while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (!shot && performance.now() - t0 > 2200) { shot = 1; break; } } return { banners: [...ban] }; });
    await shot(id + '-dead');
    const kill2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); const t0 = performance.now(); let shot = 0; while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (!shot && D.banners.some(b => b.s === 'RESONANCE')) { shot = 1; break; } } return { banners: [...ban] }; });
    await shot(id + '-seal');
    const kill3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D.banners) D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.yuggoth }; });
    const all = new Set([...kill.banners, ...kill2.banners, ...kill3.banners]); console.log('  kill', JSON.stringify(kill3.state), JSON.stringify([...all]), kill3.sealed); ok(kill3.state === 'end', `${id}: the kill ends the stage`);
    ok(all.has('THE ENGINE FALLS SILENT') && all.has('SEAL THE RIFT') && all.has('THE CHARGE SIGIL') && kill3.sealed, `${id}: the sealing (THE ENGINE FALLS SILENT … THE CHARGE SIGIL)`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
