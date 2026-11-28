// The Pale Aurora's bosses, animated: each fight run through its wake, a full act cycle, a hit, its mechanics (the
// crosswind's push toward the frozen rim; a vane turned into a windbreak that staggers it, the eye bared), phase two
// (the vane alternation, its minions) and the kill (a section boss's kill ends its stage; only the last seals the rift),
// with no page errors; screenshots (SHOTS=1) into shots/anim-aurora-<boss>*.png.
// usage: node tests/_boss-anim-aurora.js [nivora ...]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { nivora: ['crosswind', 'shear', 'pass', 'gaze'] };
const NAMES = { nivora: 'Nivora' };
const MINIONS = { nivora: ['veilray', 'frostlantern', 'rimescuttler'] };
const WEAK = { nivora: 'eye' };
const IDLE = { nivora: 'hover' };
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['nivora'];
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-aurora-${name}.png`) }); };
  // force the next act: the hover's choice is taken from the bag at once
  const force = (act, idle) => page.evaluate(async ([act, idle]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const t0 = performance.now();
    while (performance.now() - t0 < 12000 && !(b.act === idle && !(b.stunT > 0))) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
    M.bag = [act]; b.actT = 99; const t1 = performance.now(); while (performance.now() - t1 < 3000 && b.act !== act) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return b.act; }, [act, idle]);
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.aurora ? R.aurora.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx >= 0, `${id}: stage ${idx}`); if (idx < 0) continue;
    await T.start('aurora', idx);
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 6; });
    await run(1.0); await shot(id + '-intro');
    await run(5.0);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD, dmg: b && Math.round(b.dmg) }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act}, blow ${r.dmg})`);
    // an act cycle, the pet kept wandering round the platform
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C, seen = new Set(), ban = new Set(); const t0 = performance.now(); let a = 0;
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; a += 0.01; D.me.x = C.x + Math.cos(a) * 8; D.me.y = C.y + Math.sin(a) * 8;
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; }
      return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 120]);
    console.log('  acts', JSON.stringify(acts)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners (${acts.banners.join(' | ')})`);
    // two shots 0.4 s apart while it hovers (the pose should change between them)
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; const t0 = performance.now(); while (performance.now() - t0 < 12000 && !(b.act === 'hover' && b.actT < 0.5)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } });
    const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x; D.me.y = b.y + 3.6; D.me.vx = D.me.vy = 0; b.actT = Math.min(b.actT, 0.3); });
    await near(); await run(0.05); await shot(id); await run(0.35); await near(); await run(0.05); await shot(id + '-b');
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await run(0.12); await shot(id + '-hit'); await run(1.0);
    // CROSSWIND: the arrows and the frozen rim shown first; then the wind pushes the pet toward that rim
    ok(await force('crosswind', 'hover') === 'crosswind', `${id}: crosswind forced`);
    const cw = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, W = M.cw; if (!W) return null; const d = [Math.cos(W.a), Math.sin(W.a)];
      const lanes = D.zones.filter(z => z.kind === 'windlane').length, rim = FX.S.hz.some(z => z.kind === 'rim');
      // the pet stands downwind, held still each frame; how far each frame moves it, along the wind, before and during the blow
      const P0 = [C.x + d[0] * 4, C.y + d[1] * 4]; let pre = 0, np = 0, dur = 0, nd = 0; const t0 = performance.now();
      while (performance.now() - t0 < 4000 && M.cw && M.cw.t < M.cw.warn - 0.1) { D.me.x = P0[0]; D.me.y = P0[1]; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; pre += (D.me.x - P0[0]) * d[0] + (D.me.y - P0[1]) * d[1]; np++; }
      return { lanes, rim, a: W.a, warn: W.warn, pre: pre / Math.max(1, np), P0 }; });
    console.log('  crosswind', JSON.stringify(cw)); ok(cw && cw.lanes >= 4 && cw.rim, `${id}: the crosswind paints the platform with arrows and freezes the far rim`);
    await shot(id + '-crosswind-warn');
    const cw2 = await page.evaluate(async P0 => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, W = M.cw; if (!W) return null; const d = [Math.cos(W.a), Math.sin(W.a)]; let dur = 0, nd = 0; const t0 = performance.now();
      while (performance.now() - t0 < 4000 && M.cw && M.cw.t < M.cw.warn + 0.6) await new Promise(r => requestAnimationFrame(r));
      const t1 = performance.now(); while (performance.now() - t1 < 400 && M.cw) { D.me.x = P0[0]; D.me.y = P0[1]; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; dur += (D.me.x - P0[0]) * d[0] + (D.me.y - P0[1]) * d[1]; nd++; }
      // left to drift, the pet is carried out to the rim
      const t2 = performance.now(); while (performance.now() - t2 < 4000 && M.cw) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      return { dur: dur / Math.max(1, nd), dist: Math.hypot(D.me.x - C.x, D.me.y - C.y), R: C.R }; }, cw.P0);
    console.log('  blow', JSON.stringify(cw2)); ok(cw2 && cw2.dur > Math.max(0.02, cw.pre + 0.02), `${id}: the wind pushes the pet downwind (${(cw2 && cw2.dur || 0).toFixed(3)} a frame vs ${cw.pre.toFixed(3)} before)`);
    ok(cw2 && cw2.dist > cw2.R - 2.8, `${id}: left in the wind the pet is pushed out onto the frozen rim (${cw2 && cw2.dist.toFixed(1)} of ${cw2 && cw2.R})`);
    await shot(id + '-crosswind-blow');
    await run(1.5);
    // AURORA PASS and AURORA GAZE, caught in their wind-ups
    ok(await force('pass', 'hover') === 'pass', `${id}: pass forced`); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x + 2; D.me.y = C.y + 5; }); await run(0.6); await shot(id + '-pass-windup'); await run(0.8); await shot(id + '-pass');
    ok(await force('gaze', 'hover') === 'gaze', `${id}: gaze forced`); await run(1.25); await shot(id + '-gaze');
    // WING SHEAR: two lanes; the pet turns the vane by the first lane flown; it strikes the windbreak and is staggered, the eye bared
    ok(await force('shear', 'hover') === 'shear', `${id}: shear forced`); await run(0.4); await shot(id + '-shear-lanes');
    const sh = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss, S = M.sh; if (!S) return null; const L = S.lanes[0], i = L.vane, V = [C.x + (i ? 1 : -1) * 11.4, C.y + 0.4];
      const out = { lanes: S.lanes.map(l => l.vane), vane: i }; let t0 = performance.now(), shot = false;
      while (performance.now() - t0 < 5000 && !(M.bar[i] && M.bar[i].up)) { D.me.x = V[0]; D.me.y = V[1]; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (M.vch[i] > 0.1) out.ch = true; }
      out.barrier = !!(M.bar[i] && M.bar[i].up); out.lastVane = M.lastVane;
      return out; }, WEAK[id]);
    console.log('  shear', JSON.stringify(sh)); ok(sh && sh.ch && sh.barrier && sh.lastVane === sh.vane, `${id}: standing at a vane turns it and raises a windbreak across its lane`);
    await run(0.5); await shot(id + '-windbreak');
    const st = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss; const t0 = performance.now(); let seen = false;
      while (performance.now() - t0 < 9000 && !(b.stunT > 0)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'shear' && M.passK > 0.5) seen = true; }
      await new Promise(r => setTimeout(r, 700)); const w = FX.S.weak[weak]; return { flew: seen, stun: b.stunT, weak: !!(w && !w.dead), alt: M.alt, stag: M.stag, banners: D.banners.map(x => x.s) }; }, WEAK[id]);
    console.log('  stagger', JSON.stringify(st)); ok(st.flew && st.stun > 0 && st.weak && st.alt < 2.2, `${id}: it strikes the windbreak: STAGGERED, fallen low, the ${WEAK[id]} bared`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x; D.me.y = b.y + 3; }); await run(0.1); await shot(id + '-stagger');
    const wh = await page.evaluate(weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, w = D.FD.S.weak[weak]; const h0 = b.hp; if (w) D.hitMon(w, 1000, { flat: true }); return h0 - b.hp; }, WEAK[id]); ok(wh > 1500, `${id}: a blow to the bared eye lands heavy (${Math.round(wh)} of 1000)`);
    await run(6.5);
    r = await page.evaluate(weak => { const D = window.__pp.arc.game._dbg; const w = D.FD.S.weak[weak]; return { stun: D.g.boss.stunT, weak: !!(w && !w.dead), alt: D.FD.FX.mem.alt }; }, WEAK[id]); ok(!(r.stun > 0) && !r.weak, `${id}: it lifts back into the wind, the eye closed (${JSON.stringify(r)})`);
    // the phase change, the alternation of the vanes, and its minions
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; const ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const t1 = performance.now(); while (performance.now() - t1 < 600) { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { phase: D.FD.S.phase, banners: [...ban] }; });
    console.log('  phase', JSON.stringify(p2)); ok(p2.phase === 2 && p2.banners.some(s => /OPEN EYE/.test(s)), `${id}: phase two, named in a banner`); await shot(id + '-phase');
    ok(await force('shear', 'hover') === 'shear', `${id}: phase-two shear forced`);
    const s2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss, S = M.sh; if (!S) return null; const V = i => [C.x + (i ? 1 : -1) * 11.4, C.y + 0.4];
      const out = { lanes: S.lanes.map(l => l.vane), locked: S.locked, target: S.target, last: M.lastVane };
      // the vane used last time is frozen fast: standing at it does nothing
      let t0 = performance.now(); while (performance.now() - t0 < 1300) { const q = V(S.locked); D.me.x = q[0]; D.me.y = q[1]; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } out.lockedHeld = !(M.bar[S.locked] && M.bar[S.locked].up);
      return out; });
    console.log('  shear2', JSON.stringify(s2)); ok(s2 && s2.locked === s2.last && s2.target === 1 - s2.last && s2.lanes[0] === -1 && s2.lanes[1] === s2.target && s2.lockedHeld, `${id}: phase two: a cutting pass first, then only the lane by the vane not used last time (the other frozen)`);
    await shot(id + '-shear2');
    const s3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss, S = M.sh; if (!S) return null; const i = S.target, q = [C.x + (i ? 1 : -1) * 11.4, C.y + 0.4];
      let t0 = performance.now(); while (performance.now() - t0 < 6000 && !(M.bar[i] && M.bar[i].up)) { D.me.x = q[0]; D.me.y = q[1]; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const up = !!(M.bar[i] && M.bar[i].up); t0 = performance.now(); while (performance.now() - t0 < 9000 && !(b.stunT > 0)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { up, stun: b.stunT, last: M.lastVane, i }; });
    console.log('  stagger2', JSON.stringify(s3)); ok(s3 && s3.up && s3.stun > 0 && s3.last === s3.i, `${id}: phase two: the far vane's windbreak staggers it again`);
    await run(0.3); await shot(id + '-stagger2'); await run(5.5);
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 25000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size >= 2) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0, `${id}: phase-two minions (${mins.join(', ')})`);
    await run(2); await shot(id + '-late');
    ok(await force('crosswind', 'hover') === 'crosswind', `${id}: phase-two crosswind forced`); const g2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem; let n = 0; const t0 = performance.now(); while (performance.now() - t0 < 6000 && M.cw) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; n = Math.max(n, FX.S.tele.filter(s => s.shape === 'line').length); if (n && M.cw.t > M.cw.warn + 0.8) break; } return n; });
    ok(g2 >= 2, `${id}: phase two: ice shards ride the wind along shown lines (${g2})`); await shot(id + '-crosswind2');
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill: a section boss ends its stage, and does not seal the rift
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.aurora }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); ok(!kill.sealed, `${id}: a section boss does not seal the rift`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
