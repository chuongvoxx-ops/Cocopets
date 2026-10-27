// The Hollow Moon's last boss, animated: Ylth-Mora run through its rise out of the sea, its first act cycle (breathe, The
// Pull, Tendril Slam, Tendril Sweep), the Pull dragging an idle pet toward it (tendril circles near the bell), the slams
// striking inside their lanes only, the sweep striking inside its arc only, its minions, the Eclipse (the island dims but
// the pet's circle stays lit; the eye-pearls loose motes; the four tide-lanterns lit end it early and it reels), the
// High Tide (200 tidelings and eclipse moths in four waves of 50, it cannot be struck meanwhile, a light Pull,
// then it collapses onto the sand), the Weight of the Heart (the rim crumbles inward, a pet past it falls in and is
// thrown back, its health held; three moonpearls carried into the bell's reach break its heart open), and the kill
// handing over to the rift's sealing (the black sun goes out, a pale dawn); no page errors; screenshots (SHOTS=1) into
// shots/anim-moon-<boss>*.png.
// usage: node tests/_boss-anim-moon-ylthmora.js [ylthmora]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { ylthmora: ['breathe', 'pull', 'slam', 'sweep'] };
const NAMES = { ylthmora: 'Ylth-Mora' };
const MINIONS = { ylthmora: ['tideling', 'eclipsemoth'] };
const WEAK = { ylthmora: 'heart' };
const ISL = 15.6;
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['ylthmora'];
  const T = await open({ lvl: 82, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library'] }); const { page, errors, start, run } = T;
  page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text().slice(0, 300)); });
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-moon-${name}.png`) }); };
  // (wait in frames until a condition holds, keeping the pet alive; the condition is a function body over D, b, M, C)
  const until = (body, secs, keep) => page.evaluate(async ([body, secs, keep]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, f = new Function('D', 'b', 'M', 'C', body), k = keep ? new Function('D', 'b', 'M', 'C', keep) : null; const t0 = performance.now();
    while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (window.__pp.arc.state !== 'play') return false; D.me.hp = D.ST.hp; D.me.mp = 999; if (k) k(D, b, M, C); if (f(D, b, M, C)) return true; } return false; }, [body, secs, keep || null]);
  const force = act => page.evaluate(act => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; b.stunT = 0; M.nextSig = act; b.act = 'breathe'; b.actT = 99; }, act);
  const clearMins = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.fminion && !m.horde) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } });
  const place = (x, y) => page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x + x; D.me.y = C.y + y; D.me.vx = D.me.vy = 0; D.me.push = null; }, [x, y]);
  // the brightness of the game's canvas in a box about a point of the world (for the eclipse)
  const lum = (x, y, half) => page.evaluate(([x, y, half]) => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, C = FX.C, cv = document.getElementById('arcCanvas'), g = cv.getContext('2d'), k = cv.width / cv.getBoundingClientRect().width;
    const X = FX.sx(C.x + x) * k, Y = FX.sy(C.y + y) * k, h = half * k; const d = g.getImageData(Math.max(0, Math.round(X - h)), Math.max(0, Math.round(Y - h)), Math.round(h * 2), Math.round(h * 2)).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 4) { s += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; n++; } return n ? s / n : 0; }, [x, y, half]);
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.moon ? R.moon.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 9, `${id}: stage ${idx}`); if (idx < 0) continue;

    /* ---- the fight ---- */
    await start('moon', idx);
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 3 && r.seal, `${id}: a Super Fiend-class fight, the rift's last (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    // the arena: a round island some 31 m across in the sea, four tide-lanterns, six arms round it
    r = await page.evaluate(ISL => { const D = window.__pp.arc.game._dbg, M = D.M, C = M.FC, t = (x, y) => M.G[Math.floor(y) * M.MW + Math.floor(x)], fl = t(C.x + 2, C.y + 2), props = D.FD.S.props;
      return { e: t(C.x + ISL - 0.8, C.y) === fl, oE: t(C.x + ISL + 0.8, C.y) !== fl, s: t(C.x, C.y + ISL - 0.8) === fl, oS: t(C.x, C.y + ISL + 0.8) !== fl, n: t(C.x, C.y - ISL + 0.8) === fl, oN: t(C.x, C.y - ISL - 0.8) !== fl, diag: t(C.x + 10.6, C.y + 10.6) === fl, oDiag: t(C.x + 11.6, C.y + 11.6) !== fl, lanterns: props.filter(p => p.kind === 'lantern').length, arms: props.filter(p => p.kind === 'arm').length }; }, ISL);
    console.log('  arena', JSON.stringify(r)); ok(r.e && r.oE && r.s && r.oS && r.n && r.oN && r.diag && r.oDiag, `${id}: the Heart of the Moon: a round island ~31 m across in the sea`); ok(r.lanterns === 4 && r.arms === 6, `${id}: four tide-lanterns on it, six arms rising out of the sea round it`);
    await run(0.8); await shot(id + '-intro'); await run(1.4); await shot(id + '-intro2');
    await until("return b.act !== 'enter'", 12);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; return { act: b.act, wake: M.P.wake, eyes: M.eyes.map(e => +e.b.toFixed(2)) }; });
    console.log('  wake', JSON.stringify(r)); ok(r.act && r.act !== 'enter' && r.wake > 0.9, `${id}: risen out of the sea (${r.act})`);
    await run(1.5); r = await page.evaluate(() => window.__pp.arc.game._dbg.FD.FX.mem.eyes.map(e => +e.b.toFixed(2))); ok(r.some(v => v < 0.5) && r.some(v => v > 0.5), `${id}: its eye-pearls, some open and some closed (${r.join(' ')})`);
    // an act cycle, the boss kept above 80%
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, seen = new Set(), ban = new Set(); const t0 = performance.now();
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.hp < b.maxhp * 0.8) b.hp = b.maxhp * 0.8;
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 70]);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(['THE PULL', 'TENDRIL SLAM', 'TENDRIL SWEEP'].every(s => acts.banners.includes(s)), `${id}: the attacks are named in banners`);
    await until("return b.act === 'breathe' && !b.stunT && !D.FD.S.tele.length", 25); await place(2, 6); await page.evaluate(() => { window.__pp.arc.game._dbg.g.boss.actT = -3; });
    await run(0.2); await shot(id); await run(0.5); await shot(id + '-b');
    const mv = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, a = JSON.stringify([M.sway.toFixed(3), M.bt.toFixed(2)]); D.g.boss.actT = -1; await new Promise(r => setTimeout(r, 450)); return a !== JSON.stringify([M.sway.toFixed(3), M.bt.toFixed(2)]); });
    ok(mv, `${id}: never still (it breathes and sways)`);

    // The Pull: an idle pet is dragged toward it; tendrils strike shown circles near the bell
    await place(0, 6); await force('pull');
    const pl = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, S = D.FD.S; const y0 = D.me.y, x0 = D.me.x, out = { circles: [], maxPull: 0 }; const t0 = performance.now(); let shot = false;
      while (performance.now() - t0 < 4000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; out.maxPull = Math.max(out.maxPull, M.pull); for (const s of S.tele) if (s.ink === 'stab' && !s.counted) { s.counted = true; out.circles.push(+(s.y - C.y).toFixed(1)); } if (!shot && performance.now() - t0 > 2500) { shot = true; window.__pl = 1; } }
      out.moved = +(y0 - D.me.y).toFixed(2); out.dx = +(D.me.x - x0).toFixed(2); out.act = b.act; return out; });
    await shot(id + '-pull');
    console.log('  pull', JSON.stringify(pl)); ok(pl.moved > 2 && Math.abs(pl.dx) < 1.5 && pl.maxPull > 0.6, `${id}: THE PULL drags an idle pet toward it (${pl.moved} m north in 4 s)`);
    ok(pl.circles.length >= 2 && pl.circles.every(y => y < -8.5), `${id}: meanwhile tendrils strike shown circles near the bell (${pl.circles.join(', ')})`);
    await until("return b.act === 'breathe'", 12, "D.me.x = C.x; D.me.y = C.y + 6;");

    // Tendril Slam: shown lanes; standing still in the first, only the first strikes
    await place(-1, 4); const ls0 = await page.evaluate(() => { const M = window.__pp.arc.game._dbg.FD.FX.mem; return { lanes: M.stat.lanes, hit: M.stat.laneHit }; }); await force('slam');
    const sl = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, S = D.FD.S; const s0 = Object.assign({}, M.stat), out = { lanes: 0 }; const t0 = performance.now(); const x = D.me.x, y = D.me.y; let shotDone = false;
      while (performance.now() - t0 < 9000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; const ls = S.tele.filter(s => s.ink === 'lane'); out.lanes = Math.max(out.lanes, ls.length); if (!shotDone && ls.length && ls[0].age > ls[0].t * 0.7) { shotDone = true; out.inFirst = D.FD.FX.inShape(ls[0], x, y, 0.4); out.inOthers = ls.slice(1).some(s => D.FD.FX.inShape(s, x, y, 0.4)); window.__sl = 1; break; } }
      return out; });
    await shot(id + '-slam');
    const sl2 = await page.evaluate(async s0 => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const t0 = performance.now(); const x = D.me.x, y = D.me.y; let lie = 0, nibHit = 0;
      while (performance.now() - t0 < 9000 && (b.act === 'slam' || D.FD.S.tele.some(s => s.ink === 'lane'))) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = x; D.me.y = y; const tn = M.tend.find(q => q.px && !q.px.dead); if (tn && !nibHit) { const h0 = b.hp; D.hitMon(tn.px, 1000, { flat: true }); nibHit = h0 - b.hp; lie = 1; } }
      return { lanes: M.stat.lanes - s0.lanes, hit: M.stat.laneHit - s0.hit, lie, nibHit }; }, ls0);
    console.log('  slam', JSON.stringify(sl), JSON.stringify(sl2)); ok(sl.lanes >= 2 && sl.inFirst && !sl.inOthers, `${id}: TENDRIL SLAM: ${sl.lanes} shown lanes, the first through the pet`);
    ok(sl2.lanes >= 2 && sl2.hit === 1, `${id}: they hurt inside their lanes only (${sl2.hit} of ${sl2.lanes} struck the pet, in the first lane alone)`);
    ok(sl2.lie && sl2.nibHit > 1000, `${id}: a tendril left lying on the sand can be struck for more (${Math.round(sl2.nibHit)})`);
    await until("return b.act === 'breathe'", 10);

    // Tendril Sweep: a shown arc; outside it, it misses; inside it, it strikes
    const sweep = async inside => { await place(inside ? 3 : -3, 2); await force('sweep'); return page.evaluate(async inside => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, S = D.FD.S, FX = D.FD.FX; const s0 = { n: M.stat.sweeps, hit: M.stat.sweepHit }; const t0 = performance.now(); let moved = false, spot = null;
      while (performance.now() - t0 < 9000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const s = S.tele.find(q => q.ink === 'sweep' && !q.done);
        if (s && !moved && s.age > s.t * 0.4) { moved = true; // stand well inside it, or step well out of it
          if (inside) spot = { x: s.x + Math.cos(s.a) * 8, y: s.y + Math.sin(s.a) * 8 }; else { for (let k = 0; k < 60 && !spot; k++) { const x = C.x + (Math.random() - 0.5) * 20, y = C.y + (Math.random() - 0.5) * 18; if (Math.hypot(x - C.x, y - C.y) < 13 && !FX.inShape(s, x, y, 1.5)) spot = { x, y }; } } }
        if (spot) { D.me.x = spot.x; D.me.y = spot.y; D.me.vx = D.me.vy = 0; }
        if (M.stat.sweeps > s0.n) { window.__sw = 1; break; } }
      return { n: M.stat.sweeps - s0.n, hit: M.stat.sweepHit - s0.hit }; }, inside); };
    const swOut = await sweep(false); await shot(id + '-sweep'); await until("return b.act === 'breathe'", 10); const swIn = await sweep(true); await until("return b.act === 'breathe'", 10);
    console.log('  sweep', JSON.stringify(swOut), JSON.stringify(swIn)); ok(swOut.n >= 1 && swOut.hit === 0, `${id}: TENDRIL SWEEP: outside its shown arc it misses`); ok(swIn.n >= 1 && swIn.hit === 1, `${id}: inside its arc it strikes`);
    let e2 = errors.length; ok(e2 === e0, `${id}: no page errors in the first act (${e2 - e0})`); if (e2 > e0) console.log(errors.slice(e0, e2).join('\n'));

    // phase two: its minions, and the Eclipse
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.62; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p2.phase === 2, `${id}: phase two`);
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0, `${id}: second-act minions (${mins.join(', ')})`); await clearMins();
    await place(1.5, 3); await run(0.3);
    const bright0 = { pet: await lum(1.5, 2.6, 22), far: await lum(1.5, -3.6, 26) };
    const ec = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(); const t0 = performance.now();
      while (performance.now() - t0 < 15000 && !(M.ecl && M.dark > 0.97)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + 1.5; D.me.y = C.y + 3; D.banners.forEach(x => ban.add(x.s)); if (b.act === 'breathe' && !M.ecl && !b.stunT) { M.nextSig = 'eclipse'; b.actT = 99; } }
      return { on: !!M.ecl, dark: M.dark, eyesOpen: M.eyes.filter(e => e.b < 0.3).length, ban: [...ban], zoom: +D.g.zoom.toFixed(2) }; });
    await run(1.2);
    const bright1 = { pet: await lum(1.5, 2.6, 22), far: await lum(1.5, -3.6, 26) };
    await shot(id + '-eclipse');
    const ec2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const t0 = performance.now(); const m0 = M.stat.motes; while (performance.now() - t0 < 3500 && M.stat.motes - m0 < 3) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { motes: M.stat.motes - m0, shots: D.FD.FX.H.eshots ? D.FD.FX.H.eshots.length : -1 }; });
    console.log('  eclipse', JSON.stringify(ec), JSON.stringify(ec2), 'bright', JSON.stringify(bright0), JSON.stringify(bright1));
    ok(ec.on && ec.ban.includes('ECLIPSE') && ec.eyesOpen >= 7, `${id}: ECLIPSE: the black sun flares dark, its eye-pearls open (${ec.eyesOpen} of 9)`);
    ok(bright1.far < bright0.far * 0.62 && bright1.pet > bright0.pet * 0.72, `${id}: the island dims (${Math.round(bright0.far)} → ${Math.round(bright1.far)}) but the pet's circle stays lit (${Math.round(bright0.pet)} → ${Math.round(bright1.pet)})`);
    ok(ec.zoom >= 0.6, `${id}: the eclipse: the camera closes on the pet and follows it (zoom ${ec.zoom})`); ok(ec2.motes >= 3, `${id}: the eye-pearls loose slow motes of light (${ec2.motes})`);
    const lt = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(), FD = window.__pp.FIEND_DEFS; const s0 = Object.assign({}, M.stat), lit = [];
      for (let i = 0; i < 4; i++) { const p = M.lan[i]; const L = [[-9.2, -3.2], [9.2, -3.2], [-6.6, 7.6], [6.6, 7.6]][i]; const t0 = performance.now(); while (performance.now() - t0 < 1500 && !p.on && M.ecl) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + L[0] + 1.0; D.me.y = C.y + L[1] + 0.9; D.me.vx = D.me.vy = 0; D.banners.forEach(x => ban.add(x.s)); } lit.push(p.on || !M.ecl);
        if (i === 2) window.__lt3 = M.lan.filter(q => q.on).length; }
      await new Promise(r => setTimeout(r, 900)); D.banners.forEach(x => ban.add(x.s)); const w = D.FD.S.weak.heart;
      return { lit, early: M.stat.eclEarly - s0.eclEarly, ecl: !!M.ecl, stun: b.stunT, weak: !!(w && !w.dead), fwd: w ? w.forward : 0, ban: [...ban] }; });
    await place(0.5, -8); await run(1.2); await shot(id + '-eclipse-broken');
    const lt2 = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, w = D.FD.S.weak[weak], h0 = b.hp; if (!w) return { dmg: 0 }; D.hitMon(w, 1000, { flat: true }); return { dmg: h0 - b.hp, sag: M.P.sag, wy: w.y - D.FD.FX.C.y }; }, WEAK[id]);
    console.log('  lanterns', JSON.stringify(lt), JSON.stringify(lt2)); ok(lt.lit.every(Boolean) && lt.early === 1 && !lt.ecl && lt.ban.includes('THE LANTERNS BURN'), `${id}: standing by each of the four tide-lanterns lights it, and all four lit end the eclipse early`);
    ok(lt.stun > 0 && lt.weak && lt2.sag > 0.6 && lt2.dmg > 2000 && lt2.wy > -ISL, `${id}: it reels onto the sand, its black heart bared and in reach (${Math.round(lt2.dmg)} from a blow of 1000)`);
    await until("return !(b.stunT > 0) && b.act === 'breathe'", 12); await clearMins();

    // the High Tide: at 45% the sea rises and 300 pour out of it
    const hd = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; b.stunT = 0; b.hp = b.maxhp * 0.44; const ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 30000 && b.act !== 'tide') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } D.banners.forEach(x => ban.add(x.s)); return { act: b.act, banners: [...ban] }; });
    console.log('  tide', JSON.stringify(hd)); ok(hd.act === 'tide' && hd.banners.includes('THE HIGH TIDE'), `${id}: at 45% THE HIGH TIDE rises over the rim`);
    await place(1, 4); await run(2.6); await shot(id + '-tide');
    const hd2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; let maxAlive = 0, pullMax = 0; const t0 = performance.now(); while (performance.now() - t0 < 2500) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; maxAlive = Math.max(maxAlive, D.mons.filter(q => !q.dead && q.horde).length + M.hd.pending); pullMax = Math.max(pullMax, M.pull); }
      const h0 = b.hp; D.hitMon(b, 1e6, { pierce: true }); return { maxAlive, untouched: b.hp === h0, under: !!b.under, parts: D.mons.filter(q => !q.dead && q.fobj && q.kind === 'part').length, pullMax: +pullMax.toFixed(2), tideK: +M.tideK.toFixed(2), zoom: +D.g.zoom.toFixed(2), sink: +(M.sink || 0).toFixed(2) }; });
    console.log('  tide2', JSON.stringify(hd2)); ok(hd2.maxAlive > 30 && hd2.maxAlive <= 50, `${id}: the army pours out, a wave of fifty at most (${hd2.maxAlive})`); ok(hd2.zoom >= 0.6 && hd2.sink > 0.97, `${id}: the tide: the camera closes on the pet and the bell sinks out of sight (zoom ${hd2.zoom}, sink ${hd2.sink})`); ok(hd2.untouched && hd2.under && hd2.parts === 0, `${id}: it is sealed away (cannot be struck) while the tide runs`); ok(hd2.pullMax > 0.1 && hd2.pullMax < 0.5 && hd2.tideK > 0.8, `${id}: a light Pull meanwhile (${hd2.pullMax}), the sea risen over the rim`);
    const hd3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, kinds = new Set(); let maxAlive = 0, label = 0, maxWave = 0; const t0 = performance.now();
      while (performance.now() - t0 < 150000 && M.hd) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const live = D.mons.filter(q => !q.dead && q.horde); maxAlive = Math.max(maxAlive, live.length + (M.hd ? M.hd.pending : 0)); if (M.hd) maxWave = Math.max(maxWave, M.hd.wave); for (const q of live) { kinds.add(q.type); q.guardFn = null; D.hitMon(q, 1e9, { flat: true }); } }
      await new Promise(r => setTimeout(r, 1500)); const w = D.FD.S.weak.heart; return { done: M.hdDone, poured: M.stat.poured, maxAlive, maxWave, zoom: +D.g.zoom.toFixed(2), sink: +(M.sink || 0).toFixed(2), kinds: [...kinds], stun: b.stunT, weak: !!(w && !w.dead), under: !!b.under, sag: +M.P.sag.toFixed(2), ban: D.banners.map(x => x.s) }; });
    console.log('  tide3', JSON.stringify(hd3)); ok(hd3.done && hd3.poured === 200 && hd3.maxAlive <= 50 && hd3.maxWave === 3, `${id}: all 200 poured in four waves of 50 and cleared (never more than ${hd3.maxAlive} at once)`); ok(hd3.sink < 0.3 && hd3.zoom < 0.5, `${id}: the tide spent, the bell rises again and the camera draws back out (zoom ${hd3.zoom}, sink ${hd3.sink})`);
    ok(MINIONS[id].every(k => hd3.kinds.includes(k)), `${id}: the army is tidelings and eclipse moths (${hd3.kinds.join(', ')})`);
    ok(hd3.stun > 0 && hd3.weak && !hd3.under && hd3.sag > 0.6, `${id}: the tide spent, it collapses onto the sand, its black heart bared`);
    await place(0.5, -9); await run(1.0); await shot(id + '-collapsed');
    await until("return !(b.stunT > 0)", 12);

    // phase three, and the Weight of the Heart
    const p3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.28; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 3) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p3.phase === 3, `${id}: phase three`); await clearMins();
    await until("return b.act === 'breathe' && !b.stunT", 15);
    const wt = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(); b.hp = b.maxhp * 0.19; const t0 = performance.now(); while (performance.now() - t0 < 25000 && b.act !== 'weight') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } D.banners.forEach(x => ban.add(x.s)); return { act: b.act, ban: [...ban], hp: b.hp / b.maxhp, cr: M.CR }; });
    console.log('  weight', JSON.stringify(wt)); ok(wt.act === 'weight' && wt.ban.includes('THE WEIGHT OF THE HEART'), `${id}: at 20% THE WEIGHT OF THE HEART`);
    await place(-3, 5.5); await run(5.5); await shot(id + '-weight');
    const wt2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; const cr0 = M.CR, h0 = b.hp; D.hitMon(b, 1e6, { flat: true }); await new Promise(r => setTimeout(r, 120)); const held = Math.abs(b.hp - h0) < 1; const f0 = M.stat.fell; let pullMax = 0;
      // stand past the crumbled edge: it gives way
      const t0 = performance.now(); let fellPushed = false; while (performance.now() - t0 < 1500) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; pullMax = Math.max(pullMax, M.pull); if (performance.now() - t0 < 120) { D.me.x = C.x + M.CR + 0.4; D.me.y = C.y + 0.5; } if (M.stat.fell > f0) { fellPushed = true; } }
      const after = Math.hypot(D.me.x - C.x, D.me.y - C.y);
      return { cr0: +cr0.toFixed(2), cr: +M.CR.toFixed(2), held, fell: M.stat.fell - f0, after: +after.toFixed(2), pearls: M.wt.pearls.map(p => p.st), pullMax: +pullMax.toFixed(2) }; });
    console.log('  weight2', JSON.stringify(wt2)); ok(wt2.cr0 < ISL - 0.5 && wt2.cr < wt2.cr0, `${id}: the island crumbles from the rim inward (${ISL} → ${wt2.cr0} → ${wt2.cr} m)`);
    ok(wt2.fell >= 1 && wt2.after < wt2.cr, `${id}: a pet past the crumbled edge falls in and is thrown back`); ok(wt2.held, `${id}: while its heart is weighed its health is held`);
    ok(wt2.pearls.length === 3 && wt2.pearls.every(s => s === 'lie'), `${id}: its collapse drops three moonpearls on the sand`);
    const cp = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(), steps = []; const W = M.wt;
      for (let i = 0; i < 3; i++) { const p = W.pearls[i]; let t0 = performance.now(); while (performance.now() - t0 < 1500 && p.st === 'lie') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = p.x; D.me.y = p.y; D.me.vx = D.me.vy = 0; } const held = p.st === 'held';
        if (i === 0) { window.__held = 1; await new Promise(r => setTimeout(r, 50)); }
        t0 = performance.now(); while (performance.now() - t0 < 3000 && M.wt && p.st !== 'in') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + 0.3; D.me.y = C.y - 12.0; D.me.vx = D.me.vy = 0; D.banners.forEach(x => ban.add(x.s)); }
        steps.push({ held, st: p.st, n: M.wt ? M.wt.n : 3 }); }
      await new Promise(r => setTimeout(r, 900)); D.banners.forEach(x => ban.add(x.s)); const w = D.FD.S.weak.heart;
      return { steps, done: M.wtDone, stun: b.stunT, weak: !!(w && !w.dead), fwd: w ? w.forward : 0, hpK: +(b.hp / b.maxhp).toFixed(3), ban: [...ban], cracks: M.cracks }; });
    await place(0.5, -6); await run(1.5); await shot(id + '-heart-broken');
    console.log('  pearls', JSON.stringify(cp)); ok(cp.steps.every(s => s.held && s.st === 'in') && cp.steps.map(s => s.n).join() === '1,2,3', `${id}: each moonpearl picked up and carried into the bell's reach (1, 2, 3)`);
    ok(cp.done && cp.ban.includes('THE HOLLOW HEART BREAKS OPEN') && cp.stun > 5 && cp.weak && cp.fwd >= 3 && cp.hpK <= 0.061, `${id}: the third breaks its heart open: a long stagger, nearly spent (${cp.hpK * 100}% left)`);
    e2 = errors.length; ok(e2 === e0, `${id}: no page errors (${e2 - e0})`); if (e2 > e0) console.log(errors.slice(e0, e2).join('\n'));
    // the kill: the last boss of the rift hands over to the sealing
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (performance.now() - t0 > 2000) break; } return { banners: [...ban], dead: D.g.boss.dead }; });
    await shot(id + '-dead');
    const kill2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, M = D.FD.FX.mem, ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (D.banners.some(b => b.s === 'RESONANCE')) break; } return { banners: [...ban], sun: M.sunK, dawn: M.dawn, sky: D.FD.S.skyKey }; });
    await shot(id + '-seal');
    const kill3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D.banners) D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.moon }; });
    const all = new Set([...kill.banners, ...kill2.banners, ...kill3.banners]); console.log('  kill', JSON.stringify(kill3.state), JSON.stringify([...all]), kill3.sealed, kill2.sun, kill2.dawn, kill2.sky);
    ok(kill.dead && kill3.state === 'end', `${id}: the kill ends the stage`);
    ok(all.has('THE HOLLOW HEART IS STILL') && all.has('SEAL THE RIFT') && all.has('THE WEIGHT SIGIL') && kill3.sealed, `${id}: the sealing (THE HOLLOW HEART IS STILL … THE WEIGHT SIGIL)`);
    ok(kill2.sun < 0.1 && kill2.dawn > 0.8 && /dawn/.test(kill2.sky || ''), `${id}: fallen, the black sun goes out and a pale dawn fills the hollow`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
