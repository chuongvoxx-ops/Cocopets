// The Yuggoth Engine's bosses, animated: each fight run through its wake, a full act cycle, a hit, its mechanics (the
// grounding surge hurting in the coolant and not on dry steel; the arc web shown, then live; breaking the overcharging
// pylon's cap staggers it and bares the core; failing gives the nova), phase two (the split ring's spokes, its minions)
// and the kill (a section boss's kill ends its stage; only the last seals the rift), with no page errors; screenshots
// (SHOTS=1) into shots/anim-yuggoth-<boss>*.png.
// usage: node tests/_boss-anim-yuggoth.js [ixvorra ...]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { ixvorra: ['web', 'surge', 'lash', 'overload'] };
const NAMES = { ixvorra: 'Ix-Vorra' };
const MINIONS = { ixvorra: ['coilsentry', 'sparkmite'] };
const WEAK = { ixvorra: 'core' };
const IDLE = { ixvorra: 'hover' };
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['ixvorra'];
  const T = await open({ lvl: 62, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora'] }); const { page, errors, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-yuggoth-${name}.png`) }); };
  // force the next act: the hover's choice is taken from the bag at once
  const force = (act, idle) => page.evaluate(async ([act, idle]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const t0 = performance.now();
    while (performance.now() - t0 < 15000 && !(b.act === idle && !(b.stunT > 0))) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
    M.bag = [act]; b.actT = 99; const t1 = performance.now(); while (performance.now() - t1 < 3000 && b.act !== act) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return b.act; }, [act, idle]);
  // every blow the pet would take is logged (the test runs in god mode, so nothing actually lands)
  const logHurts = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, H = D.FD.FX.H; if (!H.__orig) { H.__orig = H.hurtPet; H.hurtPet = (d, s, o) => { (window.__hurts = window.__hurts || []).push({ d, t: performance.now(), dot: !!(o && o.dot) }); return H.__orig(d, s, o); }; } window.__hurts = []; });
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.yuggoth ? R.yuggoth.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 5, `${id}: stage ${idx}`); if (idx < 0) continue;
    await T.start('yuggoth', idx);
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 2 && !r.seal, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases, no seal)`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 6; });
    await run(1.0); await shot(id + '-intro');
    await run(5.0);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD, dmg: b && Math.round(b.dmg) }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act}, blow ${r.dmg})`);
    // the pylons are solid
    const solid = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; return [0, 1, 2, 3].map(i => { const a = Math.PI / 4 + i * Math.PI / 2; return D.blocked(C.x + Math.cos(a) * 9.5, C.y + Math.sin(a) * 9.5, 0.3); }); });
    ok(solid.every(Boolean), `${id}: the four pylons are solid (${solid})`);
    // an act cycle, the pet kept wandering round the hall
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C, seen = new Set(), ban = new Set(); const t0 = performance.now(); let a = 0;
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; a += 0.01; D.me.x = C.x + Math.cos(a) * 7; D.me.y = C.y + Math.sin(a) * 7;
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; }
      return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 150]);
    console.log('  acts', JSON.stringify(acts)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners (${acts.banners.join(' | ')})`);
    // two shots 0.4 s apart while it hovers (the pose should change between them)
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; const t0 = performance.now(); while (performance.now() - t0 < 15000 && !(b.act === 'hover' && b.actT < 0.5 && !(b.stunT > 0))) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } });
    const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x; D.me.y = b.y + 3.8; D.me.vx = D.me.vy = 0; b.actT = Math.min(b.actT, 0.3); });
    await near(); await run(0.05); await shot(id); await run(0.35); await near(); await run(0.05); await shot(id + '-b');
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await run(0.12); await shot(id + '-hit'); await run(1.0);

    // GROUNDING SURGE: standing in the coolant when it surges hurts badly; on dry steel it does not
    for (const wet of [true, false]) {
      ok(await force('surge', IDLE[id]) === 'surge', `${id}: surge forced (${wet ? 'in coolant' : 'on steel'})`); await logHurts();
      const sg = await page.evaluate(async wet => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss; const S = M.sg; if (!S) return null;
        const P = wet ? [C.x + 4.5, C.y + 0.6] : [C.x + 0.4, C.y + 7.6]; let shotAt = null; const t0 = performance.now();
        while (performance.now() - t0 < 6000 && M.sg) { D.me.x = P[0]; D.me.y = P[1]; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (M.sg && M.sg.t > M.sg.warn * 0.6 && shotAt == null) shotAt = M.sg.t; if (M.sg && M.sg.t > M.sg.warn + 0.3) break; }
        const hs = (window.__hurts || []).slice(); return { warn: S.warn, big: hs.filter(h => !h.dot && h.d > b.dmg * 1.6).length, dots: hs.filter(h => h.dot).length, all: hs.length, dmg: b.dmg }; }, wet);
      console.log('  surge', wet ? 'wet' : 'dry', JSON.stringify(sg));
      if (wet) ok(sg && sg.big >= 1, `${id}: the grounding surge hurts badly in the coolant (${sg && sg.big} heavy blow, ${sg && sg.dots} ticks)`);
      else ok(sg && sg.all === 0, `${id}: on dry steel the surge does not touch the pet (${sg && sg.all} blows)`);
      if (wet) { await force('surge', IDLE[id]); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x + 0.4; D.me.y = C.y + 7.6; }); await run(0.9); await shot(id + '-surge-warn'); await run(1.4); await shot(id + '-surge-live'); await run(1.5); }
    }
    // ARC WEB: dashed first, then live; a pet on a live beam is struck
    ok(await force('web', IDLE[id]) === 'web', `${id}: web forced`); await logHurts();
    const web = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C; const W = M.web; if (!W) return null; const out = { kind: W.kind, n: W.beams.length, preLive: W.live };
      const end = e => e === 'N' ? [C.x + Math.cos(W.node.a + W.rot) * W.node.r, C.y + Math.sin(W.node.a + W.rot) * W.node.r] : [C.x + Math.cos(Math.PI / 4 + e * Math.PI / 2 + W.rot) * 9.5, C.y + Math.sin(Math.PI / 4 + e * Math.PI / 2 + W.rot) * 9.5];
      // off the beams while it is dashed: a point well clear of every line
      let t0 = performance.now(); while (performance.now() - t0 < 4000 && !W.live) { D.me.x = C.x + 0.3; D.me.y = C.y + 12.5; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } out.pre = (window.__hurts || []).length; out.live = W.live;
      t0 = performance.now(); while (performance.now() - t0 < 1200 && M.web) { const b = W.beams[0], A = end(b.a), B = end(b.b); D.me.x = (A[0] + B[0]) / 2; D.me.y = (A[1] + B[1]) / 2; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      out.hit = (window.__hurts || []).length; return out; });
    console.log('  web', JSON.stringify(web)); ok(web && web.n >= 3 && !web.preLive && web.live && web.pre === 0 && web.hit >= 1, `${id}: the arc web is dashed first, then live, and a live beam strikes (${web && web.kind}, ${web && web.n} beams)`);
    await run(0.1); await shot(id + '-web');
    await run(2.5);
    // CABLE LASH: a shown arc
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1; D.me.y = b.y + 4.5; }); ok(await force('lash', IDLE[id]) === 'lash', `${id}: lash forced`); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1; D.me.y = b.y + 4.5; });
    const lash = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.FD.S.tele.filter(s => s.shape === 'cone').length; }); ok(lash >= 1, `${id}: the cable lash shows its arc (${lash})`);
    await run(0.6); await shot(id + '-lash-windup'); await run(0.55); await shot(id + '-lash'); await run(1.5);

    // OVERLOAD, failed: the meter fills and it looses a shown nova
    ok(await force('overload', IDLE[id]) === 'overload', `${id}: overload forced (to fail)`); await logHurts();
    const nv = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss; const O = M.ov; if (!O) return null; const out = { i: O.i, cap: !!(O.obj && !O.obj.dead) };
      let t0 = performance.now(); while (performance.now() - t0 < 4000 && O.t <= 0) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } out.draining = O.t > 0; O.t = O.dur - 0.4;
      t0 = performance.now(); let tele = null; while (performance.now() - t0 < 3000 && !tele) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; tele = D.FD.S.tele.find(s => s.nova); } out.tele = !!tele; out.r = tele && tele.r; out.banner = D.banners.some(x => /NOVA/.test(x.s));
      out.capGone = !O.obj || O.obj.dead; return out; });
    console.log('  nova', JSON.stringify(nv)); ok(nv && nv.cap && nv.draining && nv.tele && nv.r >= 9 && nv.banner && nv.capGone, `${id}: the meter fills: it looses a great shown nova (r ${nv && nv.r})`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 2; D.me.y = b.y + 3; }); await run(0.6); await shot(id + '-nova-warn');
    const nh = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; const t0 = performance.now(); while (performance.now() - t0 < 3000 && D.FD.S.tele.some(s => s.nova)) { D.me.x = b.x + 2; D.me.y = b.y + 3; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return (window.__hurts || []).filter(h => h.d > b.dmg * 2).length; });
    ok(nh >= 1, `${id}: the nova strikes the pet close by (${nh})`); await run(0.15); await shot(id + '-nova');
    await run(2.0);

    // OVERLOAD, answered: the overcharging pylon's cap broken: OVERLOADED, staggered, the ring parted, the core bared
    ok(await force('overload', IDLE[id]) === 'overload', `${id}: overload forced`);
    const ov = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C; const O = M.ov; if (!O) return null; const a = Math.PI / 4 + O.i * Math.PI / 2;
      let t0 = performance.now(); while (performance.now() - t0 < 4000 && O.t < 1.5) { D.me.x = C.x + Math.cos(a) * 7.8; D.me.y = C.y + Math.sin(a) * 7.8; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      return { i: O.i, fill: O.fill, hp: O.obj.hp, maxhp: O.obj.maxhp, invuln: !!O.obj.invuln, hot: M.caps[O.i].hot }; });
    console.log('  overload', JSON.stringify(ov)); ok(ov && ov.fill > 0 && ov.hot > 0 && !ov.invuln && ov.maxhp > 1000, `${id}: a pylon OVERCHARGES, its meter filling, its cap open to blows`);
    await shot(id + '-overcharge');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, O = D.FD.FX.mem.ov; D.hitMon(O.obj, O.obj.maxhp * 0.6, { flat: true }); }); await run(0.3); await shot(id + '-cap-cracked');
    const st = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss, O = M.ov; const i = O.i; D.hitMon(O.obj, 1e9, { flat: true });
      await new Promise(r => setTimeout(r, 700)); const w = FX.S.weak[weak]; return { stun: b.stunT, weak: !!(w && !w.dead), open: M.open, spin: M.spinRate, cap: M.caps[i].k, banners: D.banners.map(x => x.s), ov: !!M.ov }; }, WEAK[id]);
    console.log('  stagger', JSON.stringify(st)); ok(st.stun > 0 && st.weak && st.open > 0.6 && st.spin < 0.1 && st.cap === 0 && !st.ov && st.banners.some(s => /OVERLOADED/.test(s)), `${id}: the cap breaks: OVERLOADED, staggered, the ring stopped and parted, the ${WEAK[id]} bared`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x; D.me.y = b.y + 3.2; }); await run(0.1); await shot(id + '-stagger');
    const wh = await page.evaluate(weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, w = D.FD.S.weak[weak]; const h0 = b.hp; if (w) D.hitMon(w, 1000, { flat: true }); return h0 - b.hp; }, WEAK[id]); ok(wh > 2000, `${id}: a blow to the bared core lands heavy (${Math.round(wh)} of 1000)`);
    await run(7.5);
    r = await page.evaluate(weak => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const w = D.FD.S.weak[weak]; return { stun: D.g.boss.stunT, weak: !!(w && !w.dead), open: M.open, caps: M.caps.map(q => +q.k.toFixed(2)) }; }, WEAK[id]);
    console.log('  after', JSON.stringify(r)); ok(!(r.stun > 0) && !r.weak && r.caps.every(k => k >= 1), `${id}: it recovers, the core closed, the broken cap re-formed (${r.caps})`);

    // the phase change, the split ring, its spokes and its minions
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; const ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const t1 = performance.now(); while (performance.now() - t1 < 1800) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } return { phase: D.FD.S.phase, banners: [...ban], split: D.FD.FX.mem.split }; });
    console.log('  phase', JSON.stringify(p2)); ok(p2.phase === 2 && p2.banners.some(s => /SPLIT RING/.test(s)) && p2.split > 0.9, `${id}: phase two, the ring split in two, named in a banner`); await shot(id + '-phase');
    ok(await force('spokes', IDLE[id]) === 'spokes', `${id}: spokes forced`); await logHurts();
    const sp = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss, S = M.sp; if (!S) return null; let t0 = performance.now();
      while (performance.now() - t0 < 5000 && M.sp && !S.on) { D.me.x = b.x + 0.5; D.me.y = b.y + 12; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const a0 = S.a, b0 = S.b, pre = (window.__hurts || []).length;
      t0 = performance.now(); while (performance.now() - t0 < 1500 && M.sp) { D.me.x = b.x + Math.cos(S.a) * 6; D.me.y = b.y + Math.sin(S.a) * 6; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      return { on: S.on, da: S.a - a0, db: S.b - b0, pre, hit: (window.__hurts || []).length - pre }; });
    console.log('  spokes', JSON.stringify(sp)); ok(sp && sp.on && Math.abs(sp.da) > 0.2 && Math.sign(sp.da) === -Math.sign(sp.db) && sp.hit >= 1, `${id}: phase two: the split ring throws counter-rotating spokes across the hall, and they strike`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 2.5; D.me.y = b.y + 5; }); await run(0.3); await shot(id + '-spokes');
    await run(3.5);
    // phase two: the web turns
    ok(await force('web', IDLE[id]) === 'web', `${id}: phase-two web forced`);
    const w2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, W = M.web; if (!W) return null; const t0 = performance.now(); while (performance.now() - t0 < 6000 && M.web && !(W.live && W.t > W.warn + 1.5)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { w: W.w, rot: W.rot }; });
    ok(w2 && w2.w && Math.abs(w2.rot) > 0.1, `${id}: phase two: the arc web turns round the hall (${w2 && w2.rot.toFixed(2)})`); await shot(id + '-web2');
    await run(2.5);
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 25000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size >= 2) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length >= 2, `${id}: phase-two minions (${mins.join(', ')})`);
    // phase two: the overload still staggers it
    ok(await force('overload', IDLE[id]) === 'overload', `${id}: phase-two overload forced`);
    const s2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, b = D.g.boss; const O = M.ov; if (!O) return null; const t0 = performance.now(); while (performance.now() - t0 < 4000 && O.t <= 0.5) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } D.hitMon(O.obj, 1e9, { flat: true }); await new Promise(r => setTimeout(r, 400)); return { stun: b.stunT, open: M.open }; });
    ok(s2 && s2.stun > 0, `${id}: phase two: breaking the cap staggers it again`); await run(0.4); await shot(id + '-stagger2'); await run(5.5);
    await run(2); await shot(id + '-late');
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill: a section boss ends its stage, and does not seal the rift
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.yuggoth }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); ok(!kill.sealed, `${id}: a section boss does not seal the rift`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
