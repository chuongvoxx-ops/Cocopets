// The Hollow Moon's second boss, the Selenarch (the Weighing Engine), animated: the fight run through its wake, a full act
// cycle, a hit, its mechanics (the tilt drags an idle pet the shown way and its low edge grinds; a pan drop hurts inside
// its circle only; the ring sweep's gap is safe and the rest of the ring strikes; weights carried onto the HIGH plate
// swing the beam and, two in a row, jam it: staggered, sagging, the lens bared ×2.5; the low plate takes no weight; the
// half-health gravity inversion pulls toward the engine, rains rocks on shown circles and spills a wave of wisps and
// mooncalves; from a third the tilt swings both ways), the kill (a section boss's kill ends its stage and does not seal
// the rift), with no page errors; screenshots (SHOTS=1) into shots/anim-moon-<boss>*.png.
// usage: node tests/_boss-anim-moon-selenarch.js [selenarch]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { selenarch: ['tilt', 'pan', 'sweep', 'weigh'] };
const NAMES = { selenarch: 'The Selenarch' };
const MINIONS = { selenarch: ['craterwisp', 'mooncalf'] };
const WEAK = { selenarch: 'lens' };
const IDLE = { selenarch: 'hover' };
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['selenarch'];
  const T = await open({ lvl: 82, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library'] }); const { page, errors, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-moon-${name}.png`) }); };
  // force the next act: the hover's choice is taken from the bag at once
  const force = (act, idle) => page.evaluate(async ([act, idle]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const t0 = performance.now();
    while (performance.now() - t0 < 15000 && !(b.act === idle && !(b.stunT > 0) && !(D.FD.S.roarT > 0))) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
    M.queue = null; M.bag = [act]; b.actT = 99; const t1 = performance.now(); while (performance.now() - t1 < 3000 && b.act !== act) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return b.act; }, [act, idle]);
  // every blow the pet would take is logged (the test runs in god mode, so nothing actually lands)
  const logHurts = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, H = D.FD.FX.H; if (!H.__orig) { H.__orig = H.hurtPet; H.hurtPet = (d, s, o) => { (window.__hurts = window.__hurts || []).push({ d, t: performance.now(), dot: !!(o && o.dot) }); return H.__orig(d, s, o); }; } window.__hurts = []; });
  // wait out whatever it is doing, and clear the floor of its brood (not its body proxies)
  const calm = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, b = D.g.boss; const t0 = performance.now();
    while (performance.now() - t0 < 15000 && !(b.act === 'hover' && !(b.stunT > 0) && !(D.FD.S.roarT > 0))) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
    for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } await new Promise(r => setTimeout(r, 300)); });
  const hold = (x, y, secs, until) => page.evaluate(async ([x, y, secs, until]) => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem; const t0 = performance.now(); const f = until ? new Function('D', 'FX', 'M', 'return ' + until) : null;
    while (performance.now() - t0 < secs * 1000) { D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (f && f(D, FX, M)) break; } }, [x, y, secs, until || null]);
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.moon ? R.moon.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 5, `${id}: stage ${idx}`); if (idx < 0) continue;
    await T.start('moon', idx);
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 3 && !r.seal, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases, no seal)`);
    await run(0.4); await shot(id + '-start');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x; D.me.y = C.y + 2; });
    await run(1.6); await shot(id + '-intro');
    await run(4.5);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD, dmg: b && Math.round(b.dmg) }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act}, blow ${r.dmg})`);
    // north of the hall is the void; the floor reaches east and west
    const solid = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; return { north: D.blocked(C.x, C.y - 8.2, 0.2), edge: D.blocked(C.x + 15.2, C.y, 0.2), floor: !D.blocked(C.x + 12.5, C.y + 2, 0.2) && !D.blocked(C.x - 6.3, C.y - 1.4, 0.3) && !D.blocked(C.x, C.y + 12, 0.3) }; });
    ok(solid.north && solid.edge && solid.floor, `${id}: the north is the void and the plates reach out to the rim (${JSON.stringify(solid)})`);
    // an act cycle, the pet kept wandering round the hall
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C, seen = new Set(), ban = new Set(); const t0 = performance.now(); let a = 0;
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; a += 0.012; D.me.x = C.x + Math.cos(a) * 8.5; D.me.y = C.y + 3.5 + Math.sin(a) * 5.5;
        if (b.hp < b.maxhp * 0.6) b.hp = b.maxhp * 0.9; seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; }
      return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 180]);
    console.log('  acts', JSON.stringify(acts)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners (${acts.banners.join(' | ')})`);
    await calm();
    // two shots 0.4 s apart while it hovers (the pose should change between them)
    const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x + 0.5; D.me.y = b.y + 7.5; D.me.vx = D.me.vy = 0; b.actT = Math.min(b.actT, 0.3); });
    await near(); await run(0.05); await shot(id); await run(0.35); await near(); await run(0.05); await shot(id + '-b');
    const poseOf = () => page.evaluate(() => { const M = window.__pp.arc.game._dbg.FD.FX.mem; return { spin: M.spin.map(v => +v.toFixed(3)), tilt: +M.tilt.toFixed(4), look: M.look.map(v => +v.toFixed(3)) }; });
    const pose = await poseOf(); await run(0.4); const pose2 = await poseOf();
    ok(JSON.stringify(pose) !== JSON.stringify(pose2), `${id}: never still: its rings turn and its beam rocks between frames`);
    // a hit: it recoils
    const rec = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; D.hitMon(b, 1000, { flat: true, viaProxy: true }); await new Promise(r => setTimeout(r, 60)); return M.recoil; }); await run(0.06); await shot(id + '-hit');
    ok(rec > 0.2, `${id}: a blow makes it recoil (${rec.toFixed(2)})`); await run(1.0);

    // THE TILT: arrows show the way; an idle pet slides that way; the low edge grinds, the high one does not
    await calm(); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x; D.me.y = C.y + 2; });
    ok(await force('tilt', IDLE[id]) === 'tilt', `${id}: tilt forced`); await logHurts();
    const tw = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, Tl = M.tl; let ax = null; const t0 = performance.now();
      while (performance.now() - t0 < 3000 && Tl.t < Tl.warn - 0.1) { D.me.x = C.x; D.me.y = C.y + 2; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (M.arrow.k > 0.2) ax = M.arrow.ux; }
      return { s: Tl.s, ax, k: +M.arrow.k.toFixed(2), warnHurts: (window.__hurts || []).length }; });
    await run(0.0); await shot(id + '-tilt-warn');
    const tl = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, Tl = M.tl; const t0 = performance.now(); while (performance.now() - t0 < 3000 && Tl.calm) { D.me.x = C.x; D.me.y = C.y + 2; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      // (left alone, the pet slides)
      D.me.x = C.x; D.me.y = C.y + 2; D.me.vx = D.me.vy = 0; const x0 = D.me.x; const t1 = performance.now(); while (performance.now() - t1 < 1500) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { dx: +(D.me.x - x0).toFixed(2), dy: +(D.me.y - C.y - 2).toFixed(2), tilt: +M.tilt.toFixed(2) }; });
    await shot(id + '-tilt');
    console.log('  tilt', JSON.stringify(tw), JSON.stringify(tl)); ok(tw.ax === tw.s && tl.dx * tw.s > 2 && Math.abs(tl.dy) < 1 && tl.tilt * tw.s > 0.15, `${id}: the tilt's arrows point to the low side and an idle pet slides that way (${tl.dx} m, beam ${tl.tilt})`);
    await logHurts();
    const gr = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, s = M.tl.s; let t0 = performance.now(); while (performance.now() - t0 < 1000) { D.me.x = C.x + s * 11.5; D.me.y = C.y + 2; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const low = (window.__hurts || []).filter(h => h.dot).length; window.__hurts = [];
      t0 = performance.now(); while (performance.now() - t0 < 900 && M.tl) { D.me.x = C.x - s * 11.5; D.me.y = C.y + 2; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const high = (window.__hurts || []).filter(h => h.dot).length; return { low, high }; });
    console.log('  grind', JSON.stringify(gr)); ok(gr.low >= 2 && gr.high === 0, `${id}: the low edge grinds (${gr.low} ticks), the high edge is safe`);
    await run(2.5);

    // PAN DROP: it hurts inside its circle, and only there (the shock ring is a step beyond it)
    for (const inside of [true, false]) {
      await calm(); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x + 3; D.me.y = C.y + 3; });
      ok(await force('pan', IDLE[id]) === 'pan', `${id}: pan drop forced (${inside ? 'standing in it' : 'standing clear'})`); await logHurts();
      const pd = await page.evaluate(async inside => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss, s = FX.S.tele.find(q => q.pan != null); if (!s) return null; const out = { r: s.r, t: s.t };
        const P = inside ? [s.x + 0.3, s.y - 0.2] : [s.x + s.r + 2.3, s.y]; const t0 = performance.now(); let shotPos = null;
        while (performance.now() - t0 < 4500 && !(M.pd == null)) { D.me.x = P[0]; D.me.y = P[1]; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (!shotPos && M.panFx.some(F => F && F.st === 'down')) shotPos = true; }
        const hs = (window.__hurts || []).slice(); return Object.assign(out, { big: hs.filter(h => !h.dot && h.d > b.dmg * 1.5).length, all: hs.length, down: !!shotPos }); }, inside);
      console.log('  pan', inside ? 'in' : 'out', JSON.stringify(pd));
      if (inside) ok(pd && pd.big >= 1 && pd.down, `${id}: the pan slams its circle with a heavy blow (${pd && pd.big})`);
      else ok(pd && pd.all === 0, `${id}: a pet clear of the circle (and its shock ring) is untouched (${pd && pd.all} blows)`);
    }
    // shots of a drop: the pan swinging out over its circle, then the slam
    await calm(); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x + 2.5; D.me.y = C.y + 2.5; }); await force('pan', IDLE[id]);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, s = D.FD.S.tele.find(q => q.pan != null); if (s) { D.me.x = s.x + s.r + 2.5; D.me.y = s.y + 1.5; } });
    await run(1.0); await shot(id + '-pan-swing'); await run(0.62); await shot(id + '-pan-slam'); await run(1.6);

    // RING SWEEP: its gap is safe; the rest of the ring strikes
    for (const inGap of [true, false]) {
      await calm(); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x - 1; D.me.y = C.y + 3; });
      ok(await force('sweep', IDLE[id]) === 'sweep', `${id}: ring sweep forced (${inGap ? 'in the gap' : 'out of it'})`); await logHurts();
      const sw = await page.evaluate(async inGap => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, S = M.sw && M.sw.cur; if (!S) return null; const a = inGap ? S.g : S.g + (S.g < Math.PI / 2 ? 0.75 : -0.75), d = 8;
        const P = [S.cx + Math.cos(a) * d, S.cy + Math.sin(a) * d]; const t0 = performance.now(); while (performance.now() - t0 < 5000 && M.sw && M.sw.cur === S) { D.me.x = P[0]; D.me.y = P[1]; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
        return { g: +S.g.toFixed(2), gw: +S.gw.toFixed(2), r: +S.r.toFixed(1), hits: (window.__hurts || []).filter(h => !h.dot).length }; }, inGap);
      console.log('  sweep', inGap ? 'gap' : 'ring', JSON.stringify(sw));
      if (inGap) ok(sw && sw.r > 15 && sw.hits === 0, `${id}: the ring rolls out past a pet standing in its gap, unharmed`);
      else ok(sw && sw.hits >= 1, `${id}: the ring strikes a pet out of the gap (${sw && sw.hits})`);
    }
    await calm(); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x + 1; D.me.y = C.y + 4; }); await force('sweep', IDLE[id]);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, S = M.sw.cur; D.me.x = S.cx + Math.cos(S.g) * 8; D.me.y = S.cy + Math.sin(S.g) * 8; });
    await run(1.2); await shot(id + '-sweep-warn'); await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, S = M.sw.cur; const t0 = performance.now(); while (performance.now() - t0 < 3000 && !(S.r > 6.5)) await new Promise(r => requestAnimationFrame(r)); }); await shot(id + '-sweep'); await run(2.5);

    // COUNTERWEIGHT: a weight carried onto the low plate does nothing; onto the high plate it swings the beam; the next onto the new high plate jams it
    await calm(); ok(await force('weigh', IDLE[id]) === 'weigh', `${id}: counterweight forced`);
    const cw1 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, W = M.cw; let t0 = performance.now(); while (performance.now() - t0 < 4000 && !M.weights.some(w => w.st === 'ground')) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const w = M.weights.find(w => w.st === 'ground'); if (!w) return null; const s0 = W.s, tilt0 = M.tilt;
      t0 = performance.now(); while (performance.now() - t0 < 1500 && !M.carry) { D.me.x = w.x; D.me.y = w.y; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const carry = !!M.carry, hi = s0 > 0 ? 0 : 1, P = [[-6.3, -1.4], [6.3, -1.4]];
      // the low plate first: no weighing
      t0 = performance.now(); while (performance.now() - t0 < 700) { D.me.x = C.x + P[1 - hi][0]; D.me.y = C.y + P[1 - hi][1]; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const lowN = W.n, stillCarry = !!M.carry; return { s0, tilt0: +tilt0.toFixed(2), carry, lowN, stillCarry, hi }; });
    console.log('  weigh 1', JSON.stringify(cw1)); ok(cw1 && cw1.carry && cw1.tilt0 * cw1.s0 > 0.1 && cw1.lowN === 0 && cw1.stillCarry, `${id}: a weight falls from the low pan; walking over it takes it up; the LOW plate takes no weight`);
    await page.evaluate(i => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C, P = [[-6.3, -1.4], [6.3, -1.4]]; D.me.x = C.x + P[i][0] * 0.55; D.me.y = C.y + P[i][1] + 2.4; }, cw1 ? cw1.hi : 0); await run(0.15); await shot(id + '-carry');
    const cw2 = await page.evaluate(async hi => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, W = M.cw, P = [[-6.3, -1.4], [6.3, -1.4]]; const s0 = W.s;
      let t0 = performance.now(); while (performance.now() - t0 < 2000 && !(W.s !== s0)) { D.me.x = C.x + P[hi][0]; D.me.y = C.y + P[hi][1]; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const n1 = W.n, s1 = W.s, panW = M.panW.slice(); t0 = performance.now(); while (performance.now() - t0 < 1500 && (M.tilt * s1 < 0.1)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { n1, s0, s1, panW, tilt: +M.tilt.toFixed(2) }; }, cw1 ? cw1.hi : 0);
    console.log('  weigh 2', JSON.stringify(cw2)); ok(cw2.n1 === 1 && cw2.s1 === -cw2.s0 && cw2.panW[cw1.hi] === 1 && cw2.tilt * cw2.s1 > 0.09, `${id}: carried onto the HIGH plate it rises into that pan and the beam swings the other way`);
    const jm = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, W = M.cw, b = D.g.boss, P = [[-6.3, -1.4], [6.3, -1.4]]; let t0 = performance.now();
      while (performance.now() - t0 < 4000 && !M.weights.some(w => w.st === 'ground')) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const w = M.weights.find(w => w.st === 'ground'); if (!w) return null;
      t0 = performance.now(); while (performance.now() - t0 < 1500 && !M.carry) { D.me.x = w.x; D.me.y = w.y; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const hi = W.s > 0 ? 0 : 1; t0 = performance.now(); while (performance.now() - t0 < 2500 && !(b.stunT > 0)) { D.me.x = C.x + P[hi][0]; D.me.y = C.y + P[hi][1]; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      await new Promise(r => setTimeout(r, 900)); const wk = FX.S.weak[weak]; return { stun: +b.stunT.toFixed(2), weak: !!(wk && !wk.dead), k: wk && wk.forward, sag: +M.sag.toFixed(2), shut: +M.shut.toFixed(2), panW: M.panW.slice(), banners: D.banners.map(x => x.s) }; }, WEAK[id]);
    console.log('  jammed', JSON.stringify(jm)); ok(jm && jm.stun > 0 && jm.weak && jm.k === 2.5 && jm.sag > 0.6 && jm.shut < 0.3 && jm.banners.some(s => /JAMMED/.test(s)), `${id}: the second weight onto the new high plate JAMS it: staggered, sagging, the lens bared (×${jm && jm.k})`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1.2; D.me.y = b.y + 3.5; }); await run(0.1); await shot(id + '-jammed');
    const wh = await page.evaluate(weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, w = D.FD.S.weak[weak]; const h0 = b.hp; if (w) D.hitMon(w, 1000, { flat: true }); return h0 - b.hp; }, WEAK[id]); ok(wh > 2000, `${id}: a blow to the bared lens lands heavy (${Math.round(wh)} of 1000)`);
    await run(6.5);
    r = await page.evaluate(weak => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const w = D.FD.S.weak[weak]; return { stun: D.g.boss.stunT, weak: !!(w && !w.dead), panW: M.panW.slice(), shut: +M.shut.toFixed(2) }; }, WEAK[id]);
    console.log('  after', JSON.stringify(r)); ok(!(r.stun > 0) && !r.weak && r.panW[0] === 0 && r.panW[1] === 0, `${id}: it shakes itself free, the iris closing, the weights gone`);
    // too slow: the scales tip back and it swings a pan
    await calm(); await force('weigh', IDLE[id]);
    const slow = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss, C = FX.C; let t0 = performance.now(); while (performance.now() - t0 < 4000 && !M.weights.some(w => w.st === 'ground')) { D.me.x = C.x; D.me.y = C.y + 11; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const w = M.weights.find(w => w.st === 'ground'); if (w) w.life = 0.2; t0 = performance.now(); while (performance.now() - t0 < 1500 && b.act === 'weigh') { D.me.x = C.x; D.me.y = C.y + 11; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { act: b.act, banners: D.banners.map(x => x.s) }; });
    console.log('  too slow', JSON.stringify(slow)); ok(slow.act === 'pan' && slow.banners.some(s => /TIP BACK/.test(s)), `${id}: a weight left too long: the scales tip back and a pan swings`);
    await run(3);

    // the phase change at half health: GRAVITY INVERSION: the pull flips toward it, rocks rain on shown circles, its pans spill a wave
    await calm(); await logHurts();
    // (every rock it drops is counted as it is shown)
    await page.evaluate(() => { const FX = window.__pp.arc.game._dbg.FD.FX; window.__rocks = 0; if (!FX.__tele) { FX.__tele = FX.tele; FX.tele = o => { if (o.rock) window.__rocks++; return FX.__tele(o); }; } });
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; const ban = new Set(); let t0 = performance.now();
      while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      t0 = performance.now(); while (performance.now() - t0 < 5000 && !M.inv) { D.me.x = C.x; D.me.y = C.y + 6; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      const I = M.inv; if (!I) return { phase: D.FD.S.phase, banners: [...ban] };
      // (left alone during the rise, the pet is dragged toward the engine)
      t0 = performance.now(); while (performance.now() - t0 < 500) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } const y0 = D.me.y; t0 = performance.now(); while (performance.now() - t0 < 900) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      return { phase: D.FD.S.phase, banners: [...ban], dy: +(D.me.y - y0).toFixed(2), rocks: M.rocks.length, lift: +M.lift.toFixed(2) }; });
    console.log('  phase 2', JSON.stringify(p2)); ok(p2.phase === 2 && p2.banners.some(s => /GRAVITY INVERSION/.test(s)) && p2.dy < -0.6 && p2.rocks >= 6 && p2.lift > 0.3, `${id}: phase two: GRAVITY INVERSION: the rocks rise, the pull drags toward the engine (${p2.dy} m)`);
    await shot(id + '-invert-rise');
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX; const t0 = performance.now(); while (performance.now() - t0 < 5000 && !FX.S.tele.some(s => s.rock && s.age > s.t * 0.72)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } }); await shot(id + '-invert-rain');
    const rain = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C; let t0 = performance.now(), aim = null;
      while (performance.now() - t0 < 9000 && M.inv && !M.inv.waved) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp;
        // (stand in a fresh rock's circle to feel it)
        if (!aim || aim.done) aim = FX.S.tele.find(s => s.rock && !s.done && s.age < s.t * 0.5) || aim; if (aim && !aim.done) { D.me.x = aim.x; D.me.y = aim.y; } else { D.me.x = C.x + 9; D.me.y = C.y + 9; } }
      return { rocks: window.__rocks, big: (window.__hurts || []).filter(h => !h.dot).length }; });
    console.log('  rain', JSON.stringify(rain)); ok(rain.rocks >= 12 && rain.big >= 1, `${id}: the rocks rain back down on ${rain.rocks} shown circles, and strike`);
    await shot(id + '-invert-after');
    const wave = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(), C = D.FD.FX.C; const t0 = performance.now(); while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; D.me.x = C.x; D.me.y = C.y + 9; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size >= 2) break; } return [...seen]; }, MINIONS[id]);
    console.log('  wave', JSON.stringify(wave)); ok(wave.length >= 2, `${id}: its pans spill a wave (${wave.join(', ')})`);
    await run(0.6); await shot(id + '-wave');
    // the inversion comes round again in the second phase's moves
    await calm(); ok(await force('invert', IDLE[id]) === 'invert', `${id}: inversion forced again`); await run(1.0); await shot(id + '-invert-2'); await calm();

    // the third phase: the scales run wild; the tilt swings both ways
    const p3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss; b.hp = b.maxhp * 0.27; const ban = new Set(), sides = new Set(); let t0 = performance.now();
      while (performance.now() - t0 < 4000 && D.FD.S.phase < 3) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      t0 = performance.now(); while (performance.now() - t0 < 16000) { D.me.x = C.x; D.me.y = C.y + 3; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); if (M.tl && !M.tl.calm) sides.add(M.tl.s); if (b.act !== 'tilt' && sides.size) break; }
      return { phase: D.FD.S.phase, banners: [...ban], sides: [...sides], lv: FX.S.lv }; });
    console.log('  phase 3', JSON.stringify(p3)); ok(p3.phase === 3 && p3.banners.some(s => /SCALES RUN WILD/.test(s)) && p3.sides.length === 2, `${id}: phase three: the scales run wild and the tilt swings both ways`);
    await run(0.3); await shot(id + '-late');
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill: a section boss ends its stage, and does not seal the rift
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.moon }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); ok(!kill.sealed, `${id}: a section boss does not seal the rift`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
