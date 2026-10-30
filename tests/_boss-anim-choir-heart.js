// The Choir Before Creation's last boss, animated: The Heart That Hears in the 36 m Resonating Bowl (four quadrants, four
// great inward horns, four drum pads). Its entrance (it rises from the dais, the tendrils anchor), never still. Phase one,
// Pulse Measure: three numbered quadrants strike in order; a pet in a resolved quadrant is safe, one left in a struck
// quadrant is hit; the lower surface is a weak point x1.5. Phase two, Dissonance: a freshly struck quadrant strikes again
// after its echo outline (stepping in early is hit, waiting is safe); two hush moths hush a great horn while the main
// preview (numbered floor sectors, the ring's arcs) stays. Phase three, The Unfinished Chord: charging the indicated pad
// makes its shelter; sheltered = no hit from the whole-arena pulse, unsheltered = hit; then the ring breaks open (x2).
// The kill: silence, one gentle chord, the dark seed; the sealing (THE RHYTHM SIGIL), the rift sealed. Every artPose
// painted (SHOTS=1 -> shots/anim-cho-heart-pose-*.png) and in-game shots.
// usage: HTML=test-heart.html node tests/_boss-anim-choir-heart.js   env: SHOTS=1, POSES_ONLY=1
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
const path = require('path'), fs = require('fs');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const id = 'heart';
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, S = D.FD.S, me = D.me, C = FX.C, AMB = D.RIFT.self.amb, CHO = AMB.CHO, mod = D.RIFT.self.mod, RX = AMB.C.X;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 12000; };
  const hold = () => { if (me && !me.dead) { me.hp = D.ST.hp; me.mp = 999; } };
  const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
  const QAM = q => -Math.PI / 4 + q * Math.PI / 2, inQ = (q, d) => [C.x + Math.cos(QAM(q)) * (d || 9), C.y + Math.sin(QAM(q)) * (d || 9)];`;
(async () => {
  const T = await open({ lvl: 98, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'colours', 'basilica'] }); const { page, errors } = T;
  page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text().slice(0, 300)); });
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-cho-heart-${name}.png`) }); };
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); hold(); }`, secs);
  const until = (cond, secs) => ev(`const f = new Function('D', 'b', 'M', 'me', 'C', 'S', 'mod', 'return ' + arg[0]); const go = clock(arg[1]); while (go()) { if (f(D, b, M, me, C, S, mod)) return true; await frame(); hold(); } return false;`, [cond, secs]);
  const place = (x, y) => ev(`pin(C.x + arg[0], C.y + arg[1]);`, [x, y]);
  const settle = () => ev(`const go = clock(20); while (go()) { await frame(); hold(); if (b.stunT > 0) b.stunT = 0.01; if (b.act === 'idle' && !M.A && !(b.stunT > 0) && !CHO.beats(RX).some(p => !p.done)) return true; } return false;`);
  const force = act => ev(`M.nextAct = arg; b.stunT = 0; b.act = 'idle'; b.actT = 99; const go = clock(4); while (go() && b.act !== arg) { await frame(); hold(); } return b.act;`, act);

  /* ---- the art: every pose painted big ---- */
  const poses = await page.evaluate(PT => { const P = window.__pp, D = P.FIEND_DEFS.heart, K = P.DunFiend.KIT, T = PT, out = [], errs = [];
    (D.artPoses || []).forEach((ps, i) => { const cv = document.createElement('canvas'); cv.width = T * 20; cv.height = T * 17; const c = cv.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, '#2A1825'); g.addColorStop(1, '#0E070C'); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      const mem = JSON.parse(JSON.stringify(ps.mem || {})), m = { x: 0, y: 0, r: 3, face: 1, phase: 1, t: 1, dmg: 10, act: 'idle', dead: !!mem.dead };
      const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {} }, me: { x: 1.5, y: 9 }, C: { x: 0, y: 0, R: 18 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
      try { D.draw(c, FX, m, cv.width / 2, T * 13.2, T, 1.3); } catch (e) { errs.push(ps.name + ': ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
      c.fillStyle = '#FFE37A'; c.font = '700 15px sans-serif'; c.fillText(ps.name, 10, 22); out.push({ name: ps.name, url: cv.toDataURL('image/png') }); });
    return { out, errs }; }, +(process.env.POSE_T || 21));
  ok(poses.out.length >= 8 && !poses.errs.length, `${id}: ${poses.out.length} art poses paint (${poses.errs.join('; ')})`);
  if (process.env.SHOTS) poses.out.forEach((p, i) => fs.writeFileSync(path.resolve(__dirname, `../shots/anim-cho-heart-pose-${process.env.POSE_T ? 'big-' : ''}${i}.png`), Buffer.from(p.url.split(',')[1], 'base64')));
  if (process.env.POSES_ONLY) { console.log('errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(fails ? 1 : 0); }

  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.choir.stages.findIndex(s => s.boss === 'heart'));
  ok(idx === 8, `${id}: stage ${idx}`);
  await T.start('choir', idx);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, seal: D.F.rift && D.F.rift.seal, q: mod.quads.length, h: mod.horns.length, p: mod.pads.length }; });
  console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.name === 'The Heart That Hears' && r.bars > 10 && r.phases === 3 && r.seal && r.q === 4 && r.h === 4 && r.p === 4, `${id}: a Super Fiend-class fight, the rift's last; four quadrants, horns and pads`);
  await page.waitForFunction(() => window.__pp.arc.game._dbg.g.boss, null, { timeout: 20000 }); await run(1.4); await shot('intro');
  await until("M.anc && M.anc[1] > 0.5 && M.anc[1] < 1", 8); await shot('anchoring');
  await until("b && b.act !== 'enter'", 12);
  r = await ev(`return { act: b.act, rise: M.rise, anc: M.anc, dx: +(b.x - C.x).toFixed(2), dy: +(b.y - C.y).toFixed(2) };`);
  console.log('  wake', JSON.stringify(r)); ok(r.act !== 'enter' && r.rise > 0.95 && r.anc.every(a => a > 0.95) && Math.abs(r.dx) < 0.1 && Math.abs(r.dy) < 0.1, `${id}: rose from the dais at the bowl's centre, its four tendrils anchored`);
  await settle(); await place(2, 6); await run(0.3); await shot('idle');
  r = await ev(`const bt0 = M.bt; const go = clock(0.8); const zs = new Set(); while (go()) { await frame(); hold(); zs.add(Math.round(Math.sin(M.bt * 1.05) * 100)); } return { dt: M.bt - bt0, poses: zs.size };`); ok(r.dt > 0.4 && r.poses > 3, `${id}: never still: it bobs and breathes (${r.poses} poses in ${r.dt.toFixed(2)} s)`);

  // ---- phase one: Pulse Measure ----
  const a1 = await T.watchActs(300, ['measure', 'swell'], 0.85); console.log('  acts1', JSON.stringify(a1)); ok(a1.acts.includes('measure') && a1.acts.includes('swell') && a1.banners.includes('PULSE MEASURE'), `${id}: phase one: Pulse Measure and its swell (${a1.acts.join(', ')})`);
  await settle(); await place(0, 7); await force('measure');
  r = await ev(`const A = M.A, ord = A.order.slice(), beats = CHO.beats(RX).filter(p => p.shape === 'sector' && !p.done).map(p => ({ n: p.n, a0: +p.a0.toFixed(2), t: +p.t.toFixed(2) }));
    const free = [0, 1, 2, 3].find(q => !ord.includes(q)); let p = inQ(ord[1]); pin(p[0], p[1]); const l0 = M.log.length; let shotT = false;
    let go = clock(6); while (go() && M.log.length - l0 < 1) { await frame(); hold(); pin(p[0], p[1]); if (!shotT && A.t > A.lead - 1.2) { shotT = true; window.__shotMeasure = 1; } }
    p = inQ(ord[0]); go = clock(6); while (go() && M.log.length - l0 < 3) { await frame(); hold(); pin(p[0], p[1]); }
    const log = M.log.slice(l0); return { ord, free, beats, log };`);
  console.log('  measure', JSON.stringify(r));
  ok(r.beats.length === 3 && r.beats.map(x => x.n).join() === '1,2,3', `${id}: PULSE MEASURE: three numbered quadrant previews (${r.beats.map(x => x.n + '@' + x.t).join(' ')})`);
  ok(r.log.length === 3 && r.log.map(x => x.q).join() === r.ord.join() && r.log.every((x, i) => !i || x.t >= r.log[i - 1].t), `${id}: the quadrants strike in their numbered order (${r.log.map(x => x.q).join(' -> ')})`);
  ok(r.log.every(x => !x.hit), `${id}: a pet stepping into the quadrant that has just resolved is never struck`);
  await settle(); await force('measure'); await until("M.A && M.A.t > M.A.lead - 1.1", 5); await shot('measure-preview');
  r = await ev(`const A = M.A, ord = A.order.slice(), p = inQ(ord[2]); const l0 = M.log.length; const go = clock(8); while (go() && M.log.length - l0 < 3) { await frame(); hold(); pin(p[0], p[1]); } return { log: M.log.slice(l0) };`);
  ok(r.log.length === 3 && r.log[2].hit && !r.log[0].hit && !r.log[1].hit, `${id}: a pet left in the third quadrant is struck by it (and only it)`);
  await run(0.05); await shot('measure-strike');
  // the weak point: the lower surface between the tendrils, under the pet's quadrant
  await settle(); await place(3, 3);
  r = await ev(`await frame(); await frame(); const w = S.weak.under; let dmg = 0; if (w && !w.dead) { const h0 = b.hp; D.hitMon(w, 1000, { flat: true }); dmg = Math.round(h0 - b.hp); } const h1 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); return { fwd: w ? w.forward : 0, dmg, body: Math.round(h1 - b.hp), q: M.wq };`);
  console.log('  weak', JSON.stringify(r)); ok(r.fwd === 1.5 && r.dmg >= 1400 && r.dmg <= 1600, `${id}: its lower surface is a weak point x1.5 (${r.dmg} from 1000; the body takes ${r.body})`);
  await run(0.08); await shot('hit');

  // ---- phase two: Dissonance ----
  r = await ev(`b.hp = b.maxhp * 0.62; const go = clock(6); while (go() && S.phase < 2) { await frame(); hold(); } return S.phase;`); ok(r === 2, `${id}: phase two`);
  await settle(); await place(0, 7); await force('dissonance');
  r = await ev(`const A = M.A, E = A.echo; if (!E) return { echo: false }; const free = [0, 1, 2, 3].find(q => !A.order.includes(q)); let p = inQ(free); pin(p[0], p[1]); const l0 = M.log.length;
    let go = clock(8); while (go() && !M.log.slice(l0).some(x => x.q === E.q && !x.echo)) { await frame(); hold(); pin(p[0], p[1]); } const mainT = D.g.t;
    p = inQ(E.q); go = clock(4); while (go() && !M.log.slice(l0).some(x => x.echo)) { await frame(); hold(); pin(p[0], p[1]); }
    const ev = M.log.slice(l0).find(x => x.echo); return { echo: true, q: E.q, n: E.n, outline: E.p.echo, gap: ev ? +(ev.t - mainT).toFixed(2) : null, hit: ev ? ev.hit : null };`);
  console.log('  echo early', JSON.stringify(r)); ok(r.echo && r.outline && /'/.test(r.n), `${id}: DISSONANCE: an off-beat echo with its smaller second outline (${r.n})`); ok(r.hit === true && r.gap > 0.2, `${id}: stepping into the freshly struck quadrant before its echo is struck (${r.gap} s after)`);
  await settle(); await force('dissonance');
  r = await ev(`const A = M.A, E = A.echo; const free = [0, 1, 2, 3].find(q => !A.order.includes(q)); let p = inQ(free); pin(p[0], p[1]); const l0 = M.log.length; let shotE = false;
    let go = clock(9); while (go() && !M.log.slice(l0).some(x => x.echo)) { await frame(); hold(); pin(p[0], p[1]); if (!shotE && M.log.slice(l0).some(x => x.q === E.q)) shotE = true; }
    p = inQ(E.q); go = clock(6); while (go() && M.log.length - l0 < 4) { await frame(); hold(); pin(p[0], p[1]); } const L = M.log.slice(l0); return { log: L, qHits: L.filter(x => x.hit).length };`);
  console.log('  echo waited', JSON.stringify(r)); ok(r.log.length === 4 && r.qHits === 0, `${id}: waiting for the echo before stepping in is safe`);
  // the moths: two hush a great horn; the main preview stays legible
  await settle();
  r = await ev(`let go = clock(60), seen = null; M.mothCd = 0; while (go() && !seen) { if (b.act === 'idle' && !b.stunT) { M.nextAct = 'dissonance'; b.actT = 99; } await frame(); hold(); pin(C.x, C.y + 8);
      const h = mod.horns.find(h => h.obscured); if (h && M.A && M.A.beats && M.A.t > 0.4) { const live = CHO.beats(RX).filter(p => !p.done && !p.fired && p.shape === 'sector' && p.n != null && !p.echo); if (live.length >= 2) seen = { horn: h.i, live: live.length, nums: live.map(p => p.n), arcs: M.arcs.filter(a => a && a.n != null).length, lit: mod.quads.filter(q => q.lit > 0.2).length, moths: M.moths.filter(x => !x.dead).length, settled: M.moths.filter(x => x.settled).length, preview: true }; } }
    return seen || { horn: -1, stat: M.stat, moths: M.moths.length };`);
  console.log('  moths', JSON.stringify(r)); ok(r.horn >= 0 && r.moths === 2 && r.settled >= 1, `${id}: two hush moths settle on great horn ${r.horn} and hush it`); ok(r.live >= 2 && r.arcs >= 2 && r.lit >= 2, `${id}: while it is hushed the main preview stays: ${r.live} numbered sectors on the floor, ${r.arcs} arcs on the ring`);
  await shot('moths');
  r = await ev(`const mm = M.moths.find(x => x.settled && !x.dead); if (!mm) return { none: true }; const h = mm.hornTo; D.hitMon(mm, 5, { flat: true }); const go = clock(1.5); while (go()) { await frame(); hold(); } return { interrupted: !mm.settled || mm.dead, ints: mm.interrupts || 0 };`);
  ok(r.interrupted, `${id}: striking a moth interrupts its hush (${JSON.stringify(r)})`);
  await until("M.A && M.A.echo && M.A.t > M.A.lead + 0.2", 20); await shot('dissonance');
  let e2 = errors.length; ok(e2 === 0, `${id}: no page errors so far (${e2})`); if (e2) console.log(errors.slice(0, 5).join('\n'));

  // ---- phase three: The Unfinished Chord ----
  await settle(); r = await ev(`b.hp = b.maxhp * 0.3; const go = clock(6); while (go() && S.phase < 3) { await frame(); hold(); } return { ph: S.phase, moths: M.moths.filter(x => !x.dead).length };`); ok(r.ph === 3 && r.moths === 0, `${id}: phase three (the moths scatter)`);
  await settle(); await place(0, 7); await force('chord');
  r = await ev(`const A = M.A, pad = A.pad; if (!A || A.kind !== 'chord') return { started: false }; const steps = A.steps.slice(), qp = A.qp, nums = CHO.beats(RX).filter(p => !p.done).map(p => p.n).join();
    const beforeOn = { active: pad.active, hi: pad.hi, shelterOn: pad.shelterOn }; let shots = 0;
    // charge on the pad straight away
    let go = clock(8); while (go() && !pad.full) { await frame(); hold(); pin(pad.x, pad.y); } const fullAt = +A.t.toFixed(2), shelterEarly = CHO.sheltered(RX, pad.x, pad.y);
    // the first step must have struck (wait on the pad), then step off into its resolved quadrant until the second (the pad's own quadrant) has struck
    let p = [C.x + Math.cos(-Math.PI / 4 + steps[0] * Math.PI / 2) * 9, C.y + Math.sin(-Math.PI / 4 + steps[0] * Math.PI / 2) * 9]; const l0 = M.log.length - (M.log.length && M.log[M.log.length - 1].q === steps[0] ? 1 : 0);
    go = clock(8); while (go() && !M.log.slice(l0).some(x => x.q === steps[0])) { await frame(); hold(); pin(pad.x, pad.y); }
    go = clock(8); while (go() && !M.log.slice(l0).some(x => x.q === qp)) { await frame(); hold(); pin(p[0], p[1]); }
    // back onto the pad for the third step and the pulse
    go = clock(12); let shelterAt = null; while (go() && !A.sus) { await frame(); hold(); pin(pad.x + 0.4, pad.y + 0.3); if (shelterAt == null && pad.shelterOn) shelterAt = +A.t.toFixed(2); }
    const inDome = CHO.sheltered(RX, me.x, me.y), h0 = M.stat.chordHit; window.__chordShot = 1;
    go = clock(4); while (go() && M.A === A) { await frame(); hold(); pin(pad.x + 0.4, pad.y + 0.3); }
    return { started: true, steps, qp, nums, beforeOn, fullAt, step3T: +A.step3T.toFixed(2), shelterEarly, shelterAt, inDome, log: M.log.slice(l0), hits: M.stat.chordHit - h0, safe: M.stat.chordSafe, stun: +b.stunT.toFixed(2), opens: M.stat.opens, sheltered: M.stat.openSheltered };`);
  console.log('  chord sheltered', JSON.stringify(r));
  ok(r.started && r.nums === '1,2,3,4' && r.steps[1] === r.qp && r.beforeOn.active && r.beforeOn.hi, `${id}: THE UNFINISHED CHORD: a four-step sequence, the indicated pad lit (step 2 strikes its quadrant)`);
  ok(r.fullAt < r.step3T && !r.shelterEarly && r.shelterAt >= r.step3T && r.inDome, `${id}: charging the indicated pad (full at ${r.fullAt} s) makes its shelter, raised after step three (${r.shelterAt} s)`);
  ok(r.log.length === 3 && r.log.every(x => !x.hit), `${id}: stepping off for step two and back is safe (${r.log.map(x => x.q + (x.hit ? '!' : '')).join(' ')})`);
  ok(r.hits === 0 && r.safe >= 3, `${id}: sheltered, the sustained whole-arena pulse does not hit (${r.safe} ticks spared)`);
  ok(r.opens >= 1 && r.sheltered >= 1 && r.stun > 6, `${id}: after the sheltered pulse the ring breaks open for a long window (${r.stun} s)`);
  await run(0.4); await shot('ring-open');
  r = await ev(`await frame(); const w = S.weak.under; let dmg = 0; if (w && !w.dead) { const h0 = b.hp; D.hitMon(w, 1000, { flat: true }); dmg = Math.round(h0 - b.hp); } return { fwd: w ? w.forward : 0, dmg };`);
  console.log('  open weak', JSON.stringify(r)); ok(r.fwd === 2 && r.dmg >= 1900, `${id}: with the ring open its lower surface takes double damage (${r.dmg})`);
  // unsheltered: stand in the one quadrant the steps never strike, away from the pad
  await settle(); await force('chord');
  r = await ev(`const A = M.A; const p = [C.x + Math.cos(-Math.PI / 4 + A.free * Math.PI / 2) * 13, C.y + Math.sin(-Math.PI / 4 + A.free * Math.PI / 2) * 13]; const h0 = M.stat.chordHit, l0 = M.log.length; let shotP = false;
    let go = clock(30); while (go() && M.A === A) { await frame(); hold(); pin(p[0], p[1]); if (A.sus && !shotP) { shotP = true; window.__pulse = 1; } } return { hits: M.stat.chordHit - h0, stepHits: M.log.slice(l0).filter(x => x.hit).length, sheltered: CHO.sheltered(RX, p[0], p[1]), stun: +b.stunT.toFixed(2) };`);
  console.log('  chord open', JSON.stringify(r)); ok(r.hits >= 1 && r.stepHits === 0 && !r.sheltered, `${id}: unsheltered, the whole-arena pulse hits (${r.hits} ticks)`);
  await settle(); await place(0, 7); await force('chord'); await until("M.A && M.A.kind === 'chord' && M.A.t > 2.2", 6); await shot('chord-preview');
  await ev(`const A = M.A; const go = clock(16); while (go() && !(A.sus && A.sus.t > 0.5)) { await frame(); hold(); pin(A.pad.x + 0.3, A.pad.y + 0.4); }`); await shot('chord-pulse');
  const a3 = await T.watchActs(400, ['chord', 'dissonance', 'swell'], 0.3); console.log('  acts3', JSON.stringify(a3.acts)); ok(['chord', 'dissonance'].every(a => a3.acts.includes(a)), `${id}: phase three's cycle (${a3.acts.join(', ')})`);
  e2 = errors.length; ok(e2 === 0, `${id}: no page errors (${e2})`); if (e2) console.log(errors.slice(0, 5).join('\n'));

  // ---- the kill and the sealing ----
  await settle(); await place(0.5, 7);
  const k1 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, ban = new Set(), C = D.RIFT.self.amb.C; D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const g0 = D.g.t, w0 = performance.now(); let sil = 0; while (D.g.t - g0 < 1.0 && performance.now() - w0 < 12000) { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); sil = Math.max(sil, C.silentT); } return { dead: D.g.boss.dead, ban: [...ban], sil }; });
  await shot('dead');
  const k2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, ban = new Set(); const g0 = D.g.t, w0 = performance.now(); while (D.g.t - g0 < 3.4 && performance.now() - w0 < 40000) { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { seed: M.seed, sigil: M.sigil, chorded: !!M.chorded, ban: [...ban], rem: !!M.rem }; });
  await shot('victory-seed');
  const k3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); const w0 = performance.now(); while (performance.now() - w0 < 120000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D.banners) D.banners.forEach(x => ban.add(x.s)); if (D.banners && D.banners.some(b => b.s === 'THE RHYTHM SIGIL')) break; } return { ban: [...ban] }; });
  await shot('sigil');
  const k4 = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game && P.arc.game._dbg, ban = new Set(); const w0 = performance.now(); while (performance.now() - w0 < 120000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D && D.banners) D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, ban: [...ban], sealed: !!P.riftState().seals.choir }; });
  const all = new Set([...k1.ban, ...k2.ban, ...k3.ban, ...k4.ban]); console.log('  kill', JSON.stringify(k1.sil), JSON.stringify(k2), JSON.stringify([...all]), k4.state, k4.sealed);
  ok(k1.dead && k4.state === 'end', `${id}: the kill ends the stage`);
  ok(k1.sil > 1.5, `${id}: every pipe falls silent (silence ${k1.sil.toFixed(2)} s)`);
  ok(k2.chorded && k2.seed > 0.95 && k2.sigil > 0.5 && k2.rem, `${id}: then one gentle chord, and the heart is a dark seed round the Rhythm Sigil (seed ${k2.seed.toFixed(2)}, sigil ${k2.sigil.toFixed(2)})`);
  ok(all.has('THE HEART FALLS SILENT') && all.has('SEAL THE RIFT') && all.has('THE RHYTHM SIGIL') && k4.sealed, `${id}: the sealing (THE HEART FALLS SILENT … SEAL THE RIFT … THE RHYTHM SIGIL), riftState().seals.choir`);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
