// The Pale Aurora's last boss, animated: Ahuul run through its wake, a full act cycle (Horizon Sweep, the bow after it,
// Starfall), a hit, the sweep dodged by crossing to the other half, Breath of Winter (the star ember carried into the lit
// shelter: a warm bubble that keeps the frost off), its minions, The Sky Descends (the wind toward the edge, the safe
// shelter outside the shadow, the ice anchor broken: its head hauled down, the throat bared), and the kill handing over to
// the rift's sealing, with no page errors; screenshots (SHOTS=1) into shots/anim-aur-<boss>*.png.
// usage: node tests/_boss-anim-aurora.js [ahuul]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { ahuul: ['glide', 'sweep', 'bow', 'starfall'] };
const NAMES = { ahuul: 'Ahuul' };
const MINIONS = { ahuul: ['rimescuttler', 'frostlantern'] };
const WEAK = { ahuul: 'throat' };
const RX = 18, RY = 13, SH = [[-11.4, 1.6], [11.4, 1.6], [0, 9.2]], PED = [0, 1.2];
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['ahuul'];
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, start, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-aur-${name}.png`) }); };
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.aurora ? R.aurora.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 8, `${id}: stage ${idx}`); if (idx < 0) continue;
    await start('aurora', idx);
    // the fiend: its definition, name and bars
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 3 && r.seal, `${id}: a Super Fiend-class fight, the rift's last (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    // the arena: an oval 36 m across, three buttresses walled round their hearths, the pet starting on the snow
    r = await page.evaluate(([RX, RY, SH]) => { const D = window.__pp.arc.game._dbg, M = D.M, C = M.FC, t = (x, y) => M.G[Math.floor(y) * M.MW + Math.floor(x)]; return { east: t(C.x + RX - 0.8, C.y), outE: t(C.x + RX + 0.8, C.y), south: t(C.x + 6, C.y + RY - 1.4), outN: t(C.x + 4, C.y - RY - 0.8), floor: t(C.x, C.y), nooks: SH.map(([x, y]) => t(C.x + x, C.y + y)), walls: SH.map(([x, y], k) => t(C.x + x + [-2.6, 2.6, 0][k], C.y + y + [0, 0, 2.6][k])), me: [D.me.x - C.x, D.me.y - C.y] }; }, [RX, RY, SH]);
    console.log('  arena', JSON.stringify(r)); ok(r.east === r.floor && r.south === r.floor && r.outE !== r.floor && r.outN !== r.floor && r.nooks.every(v => v === r.floor) && r.walls.every(v => v !== r.floor) && Math.abs(r.me[0]) < RX && Math.abs(r.me[1]) < RY, `${id}: the 36 m oval with three walled shelters`);
    // the wake and the intro (it rises out of the cloud sea beyond the northern rim)
    await run(0.6); await shot(id + '-intro'); await run(1.4); await shot(id + '-intro2');
    await run(3.5);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD, alpha: D.FD.FX.mem.P.alpha }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter' && r.alpha > 0.9, `${id}: awake and acting (${r.act})`);
    // an act cycle: the pet on the snow, the boss kept above 70%
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C, seen = new Set(), ban = new Set(); const t0 = performance.now();
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.hp < b.maxhp * 0.8) b.hp = b.maxhp * 0.8;
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 80]);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners`);
    // two shots 0.4 s apart while it glides (the pose should change between them)
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C; const t0 = performance.now(); while (performance.now() - t0 < 12000 && !(b.act === 'glide' && b.actT > 0.3)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } D.me.x = C.x + 2; D.me.y = C.y + 1; D.me.vx = D.me.vy = 0; b.actT = 0; });
    await run(0.05); await shot(id); await page.evaluate(() => { window.__pp.arc.game._dbg.g.boss.actT = 0; }); await run(0.4); await shot(id + '-b');
    const mv = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, a = JSON.stringify(M.G.fins['1'].tip.map(v => v.toFixed(2))); D.g.boss.actT = 0; await new Promise(r => setTimeout(r, 500)); return a !== JSON.stringify(M.G.fins['1'].tip.map(v => v.toFixed(2))); });
    ok(mv, `${id}: never still (its fins scull while it glides)`);
    // Horizon Sweep: the fin lifted over the pet's half; the pet crosses to the other half and the stroke misses
    const sw = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; D.me.x = C.x - 6; D.me.y = C.y + 2; b.act = 'glide'; b.actT = 0; M.nextSig = 'sweep'; const safe0 = M.stat.sweepSafe, hit0 = M.stat.sweepHit; let side = 0, lifted = 0; const t0 = performance.now();
      while (performance.now() - t0 < 9000 && !(b.act === 'sweep' && M.sw && M.sw.t0 && D.FD.S.t - M.sw.t0 > 0.9)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'glide') b.actT = Math.max(b.actT, 99); }
      if (M.sw) { side = M.sw.side; lifted = M.P[side < 0 ? 'lW' : 'lE']; } return { side, lifted, safe0, hit0, act: b.act }; });
    console.log('  sweep', JSON.stringify(sw)); ok(sw.side === -1 && sw.lifted > 0.8, `${id}: Horizon Sweep lifts the fin over the pet's half (side ${sw.side}, lift ${sw.lifted.toFixed(2)})`);
    await shot(id + '-sweep-lift');
    const sw2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; D.me.x = C.x + 6; D.me.y = C.y + 2; D.me.vx = D.me.vy = 0; const t0 = performance.now(); while (performance.now() - t0 < 5000 && !(M.sw && M.sw.k > 0.4)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { safe: M.stat.sweepSafe, hit: M.stat.sweepHit }; });
    await shot(id + '-sweep-strike');
    ok(sw2.safe === sw.safe0 + 1 && sw2.hit === sw.hit0, `${id}: crossing to the other half, the stroke misses`);
    const bow = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C; const t0 = performance.now(); while (performance.now() - t0 < 5000 && b.act !== 'bow') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } await new Promise(r => setTimeout(r, 900)); D.me.x = C.x + 1; D.me.y = C.y - 6.5; const h = D.FD.FX.mem.headC; return { act: b.act, headY: h[1] - h[2] - C.y, k: window.__pp.FIEND_DEFS.ahuul.dmgK(D.FD.FX, b) }; });
    console.log('  bow', JSON.stringify(bow)); ok(bow.act === 'bow' && bow.headY > -RY + 0.5 && bow.k > 1, `${id}: after the pass the head comes low over the snow, open to blows (x${bow.k})`);
    await run(0.3); await shot(id + '-bow');
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.under = false; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await run(0.12); await shot(id + '-hit'); await run(1.5);
    // phase two: Breath of Winter. The ember carried from the pedestal into the lit shelter keeps the frost off
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.hp = b.maxhp * 0.6; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p2.phase === 2, `${id}: phase two`); await run(0.4); await shot(id + '-phase');
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 8000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0, `${id}: second-act minions (${mins.join(', ')})`);
    const clearMins = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.fminion) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } });
    await clearMins();
    const br = await page.evaluate(async ([SH, PED]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, out = { sts: [] }; let shotAt = null; const t0 = performance.now();
      while (performance.now() - t0 < 30000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.hp < b.maxhp * 0.45) b.hp = b.maxhp * 0.6; for (const m of D.mons) if (!m.dead && m.fminion) D.hitMon(m, 1e9, { flat: true });
        if (b.act !== 'breath' && !out.seen) { if (b.act === 'glide' || b.act === 'bow' || b.act === 'starfall') { M.nextSig = 'breath'; b.act = 'glide'; b.actT = 99; } continue; }
        out.seen = true; const B = M.br; if (!B) break; out.k = B.k; const E = M.ember; if (!out.sts.includes(E.st)) out.sts.push(E.st);
        if (B.st === 'inhale') { if (E.st === 'rest') { if (!out.inhaleShot) out.inhaleShot = D.FD.S.t; D.me.x = C.x + PED[0] + 2; D.me.y = C.y + PED[1] + 1.2; if (D.FD.S.t - out.inhaleShot > 1.2) { D.me.x = E.x; D.me.y = E.y + 0.3; } } else if (E.st === 'carry') { const N = [C.x + SH[B.k][0], C.y + SH[B.k][1]], dx = N[0] - D.me.x, dy = N[1] - D.me.y, d = Math.hypot(dx, dy); if (d > 0.1) { D.me.x += dx / d * Math.min(d, 0.25); D.me.y += dy / d * Math.min(d, 0.25); } } }
        if (B.st === 'exhale') { out.exhale = true; out.bubble = !!M.bubble; if (!out.mid && D.FD.S.t - B.t1 > 1.4) { out.mid = true; break; } } }
      return out; }, [SH, PED]);
    console.log('  breath', JSON.stringify(br)); ok(br.seen && br.sts.includes('carry') && br.sts.includes('placed') && br.exhale && br.bubble, `${id}: Breath of Winter: the ember carried into the lit shelter opens a warm bubble`);
    await shot(id + '-breath');
    const br2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const f0 = M.stat.frost, w0 = M.stat.warm; const t0 = performance.now(); while (performance.now() - t0 < 6000 && M.frost) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } await new Promise(r => setTimeout(r, 1200)); return { frost: M.stat.frost - f0, warm: M.stat.warm - w0, ember: M.ember.st, act: b.act }; });
    console.log('  breath2', JSON.stringify(br2)); ok(br2.frost === 0 && br2.warm > 1, `${id}: inside the bubble the frost never touches it (warm ${br2.warm.toFixed(1)} s)`);
    ok(br2.ember === 'rest' || br2.ember === 'return', `${id}: the ember goes back to its pedestal`);
    // a breath caught while it draws in the cold, for the screenshots
    if (process.env.SHOTS) { await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; const t0 = performance.now(); while (performance.now() - t0 < 14000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; for (const m of D.mons) if (!m.dead && m.fminion) D.hitMon(m, 1e9, { flat: true }); if (b.act !== 'breath') { if (b.act === 'glide' || b.act === 'bow' || b.act === 'starfall') { M.nextSig = 'breath'; b.act = 'glide'; b.actT = 99; } continue; } D.me.x = C.x + 3; D.me.y = C.y + 3; if (D.FD.S.t - M.br.t0 > 3) break; } }); await shot(id + '-inhale');
      await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const t0 = performance.now(); while (performance.now() - t0 < 9000 && !(M.frost && M.frost.age > 1.2)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } }); await shot(id + '-frost'); await run(4); }
    await clearMins();
    // phase three: The Sky Descends. The wind toward the edge, the lit shelter outside the shadow, then the anchor
    const p3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.3; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 3) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p3.phase === 3, `${id}: phase three`);
    const rise = await page.evaluate(async ([SH]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, out = {}; const inPoly = (P, x, y) => { let s = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], c = P[j]; if ((a[1] > y) !== (c[1] > y) && x < (c[0] - a[0]) * (y - a[1]) / (c[1] - a[1]) + a[0]) s = !s; } return s; }; const t0 = performance.now();
      while (performance.now() - t0 < 25000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.hp < b.maxhp * 0.2) b.hp = b.maxhp * 0.3;
        if (b.act !== 'rise' && !out.seen) { if (b.act === 'glide' || b.act === 'bow' || b.act === 'starfall') { M.nextSig = 'rise'; b.act = 'glide'; b.actT = 99; } continue; }
        if (!out.seen) { out.seen = true; out.under = !!b.under; out.safe = M.rs.safe; D.me.x = C.x; D.me.y = C.y + 2; }
        if (M.wind && out.x0 == null) { out.x0 = D.me.x; out.wt = D.FD.S.t; }
        if (M.wind && out.x0 != null && out.pushed == null && D.FD.S.t - out.wt > 0.8) { out.pushed = (D.me.x - out.x0) * out.safe; const N = [C.x + SH[M.rs.k][0], C.y + SH[M.rs.k][1]]; out.nookInShadow = M.G.shadow.some(P => inPoly(P, N[0], N[1])); out.centreInShadow = M.G.shadow.some(P => inPoly(P, C.x, C.y + 2)); out.shotT = D.FD.S.t; }
        if (out.pushed != null) { const N = [C.x + SH[M.rs.k][0], C.y + SH[M.rs.k][1]]; if (D.FD.S.t - out.shotT > 0.6) { D.me.x = N[0]; D.me.y = N[1]; D.me.vx = D.me.vy = 0; } if (!out.mid && D.FD.S.t - out.shotT > 0.3) { out.mid = true; break; } } }
      return out; }, [SH]);
    console.log('  rise', JSON.stringify(rise)); ok(rise.seen && rise.under && rise.pushed > 0.5 && !rise.nookInShadow && rise.centreInShadow, `${id}: The Sky Descends: overhead, its shadow over the summit, the wind pushing toward the lit shelter outside it`);
    await shot(id + '-rise');
    const fall = await page.evaluate(async ([SH]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, s0 = Object.assign({}, M.stat); const t0 = performance.now(); while (performance.now() - t0 < 9000 && b.act !== 'tether') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (M.rs) { const N = [C.x + SH[M.rs.k][0], C.y + SH[M.rs.k][1]]; D.me.x = N[0]; D.me.y = N[1]; D.me.vx = D.me.vy = 0; } }
      await new Promise(r => setTimeout(r, 400)); const A = M.teth && M.teth.o; return { act: b.act, safe: M.stat.safe - s0.safe, hit: M.stat.shadowHit - s0.shadowHit, anchor: !!(A && !A.dead), ax: A ? A.x - C.x : null, ay: A ? A.y - C.y : null }; }, [SH]);
    console.log('  fall', JSON.stringify(fall)); ok(fall.safe === 1 && fall.hit === 0 && fall.act === 'tether' && fall.anchor && Math.hypot(fall.ax / RX, fall.ay / RY) < 1, `${id}: sheltered outside the shadow when the sky falls; the ice anchor grounded on the summit`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, A = M.teth.o; D.me.x = A.x + 1.2; D.me.y = A.y + 1.0; D.me.vx = D.me.vy = 0; }); await run(0.4); await shot(id + '-anchor');
    const stun = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, A = M.teth.o; D.hitMon(A, 1e9, { flat: true }); await new Promise(r => setTimeout(r, 1300)); const w = D.FD.S.weak[weak], C = D.FD.FX.C; return { stun: b.stunT, weak: !!(w && !w.dead), wy: w ? w.y - C.y : null, wx: w ? w.x - C.x : null, under: !!b.under, thr: M.P.throat }; }, WEAK[id]);
    console.log('  stun', JSON.stringify(stun)); ok(stun.stun > 0 && stun.weak && !stun.under && Math.hypot(stun.wx / RX, stun.wy / RY) < 1 && stun.thr > 0.5, `${id}: the anchor broken, the chain hauls its head down: the throat bared on the summit (${WEAK[id]})`);
    await shot(id + '-stun');
    await page.evaluate(weak => { const D = window.__pp.arc.game._dbg; const w = D.FD.S.weak[weak]; if (w) D.hitMon(w, 2000, { flat: true }); }, WEAK[id]);
    await run(0.15); await shot(id + '-stun-hit'); await run(6.5);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b.act, stun: b.stunT, over: D.FD.FX.mem.P.over }; });
    console.log('  after', JSON.stringify(r)); ok(!(r.stun > 0) && r.act !== 'tether', `${id}: it tears free and fights on`);
    await run(1.5);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill: the last boss of the rift hands over to the sealing
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.aurora }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`);
    ok(kill.banners.includes('THE WHITE HORIZON DISSOLVES') && kill.banners.includes('SEAL THE RIFT') && kill.banners.includes('THE SHELTER SIGIL') && kill.sealed, `${id}: the sealing (THE WHITE HORIZON DISSOLVES … THE SHELTER SIGIL)`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
