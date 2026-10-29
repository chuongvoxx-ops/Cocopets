// The Basilica of the Veiled Eye's last boss, animated: Gharaal the Buried Witness in the 38 m Sanctuary (four screens on
// E–W rails, the sealed wall-eye on the north wall). Its entrance (it heaves up out of the floor), the first act's cycle
// (Slabfall: three marked rectangles strike only inside them, then one limb is EXPOSED, a weak point x2; heaves between
// acts). Phase two, The Unveiling: the lids open one by one, the gaze holds; a pet in a screen's shadow is not seen, then
// a paddle arm drags that screen one rail stop; a pet in the open is struck and calcified (rooted). Phase three,
// Witnesses Within: two back eyes open 2 s apart, their cones' shadows meet at the calcite eye node only once the marked
// screen is slid; standing there the pet is safe; breaking the node forces the main eye shut and staggers it (back eyes
// x2). The kill: the wall-eye closes for good, plants regain colour, banners crumble, the sealing (THE VEIL SIGIL), the
// rift sealed. Every artPose painted (SHOTS=1 -> shots/anim-bas-gharaal-pose-*.png) and in-game shots.
// usage: HTML=test-gharaal.html node tests/_boss-anim-basilica-gharaal.js   env: SHOTS=1
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
const path = require('path'), fs = require('fs');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const id = 'gharaal';
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, S = D.FD.S, me = D.me, C = FX.C, AMB = D.RIFT.self.amb, BAS = AMB.BAS, mod = D.RIFT.self.mod;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 4000; };
  const hold = () => { if (me && !me.dead) { me.hp = D.ST.hp; me.mp = 999; } };
  const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };`;
(async () => {
  const T = await open({ lvl: 88, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'colours'] }); const { page, errors } = T;
  page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text().slice(0, 300)); });
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-bas-gharaal-${name}.png`) }); };
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); hold(); }`, secs);
  const until = (cond, secs) => ev(`const f = new Function('D', 'b', 'M', 'me', 'C', 'S', 'mod', 'return ' + arg[0]); const go = clock(arg[1]); while (go()) { if (f(D, b, M, me, C, S, mod)) return true; await frame(); hold(); } return false;`, [cond, secs]);
  const place = (x, y) => ev(`pin(C.x + arg[0], C.y + arg[1]);`, [x, y]);
  const settle = () => ev(`const go = clock(16); while (go()) { await frame(); hold(); if (b.stunT > 0) b.stunT = 0.01; if (b.act === 'idle' && !M.G && !M.W && !M.exposed && !M.drag && !S.tele.length && !(b.stunT > 0)) return true; } return false;`);
  const force = act => ev(`M.nextAct = arg; b.stunT = 0; b.act = 'idle'; b.actT = 99; const go = clock(4); while (go() && b.act !== arg) { await frame(); hold(); } return b.act;`, act);

  /* ---- the art: every pose painted big ---- */
  const poses = await page.evaluate(() => { const P = window.__pp, D = P.FIEND_DEFS.gharaal, K = P.DunFiend.KIT, T = 21, out = [], errs = [];
    (D.artPoses || []).forEach((ps, i) => { const cv = document.createElement('canvas'); cv.width = T * 20; cv.height = T * 17; const c = cv.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, '#26262C'); g.addColorStop(1, '#0C0C0E'); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      const mem = JSON.parse(JSON.stringify(ps.mem || {})), m = { x: 0, y: 0, r: 4.6, face: 1, phase: 1, t: 1, dmg: 10, act: 'idle', dead: !!mem.dead };
      const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {} }, me: { x: 1.5, y: 9 }, C: { x: 0, y: 10.5, R: 19 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
      try { D.draw(c, FX, m, cv.width / 2, T * 11.2, T, 1.3); } catch (e) { errs.push(ps.name + ': ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
      c.fillStyle = '#FFE37A'; c.font = '700 15px sans-serif'; c.fillText(ps.name, 10, 22); out.push({ name: ps.name, url: cv.toDataURL('image/png') }); });
    return { out, errs }; });
  ok(poses.out.length >= 8 && !poses.errs.length, `${id}: ${poses.out.length} art poses paint (${poses.errs.join('; ')})`);
  if (process.env.SHOTS) poses.out.forEach((p, i) => fs.writeFileSync(path.resolve(__dirname, `../shots/anim-bas-gharaal-pose-${i}.png`), Buffer.from(p.url.split(',')[1], 'base64')));

  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.basilica.stages.findIndex(s => s.boss === 'gharaal'));
  ok(idx === 8, `${id}: stage ${idx}`);
  await T.start('basilica', idx);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, seal: D.F.rift && D.F.rift.seal, scr: D.RIFT.self.mod.screens.length, eye: !!D.RIFT.self.mod.wallEye }; });
  console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.name === 'Gharaal' && r.bars > 10 && r.phases === 3 && r.seal && r.scr === 4 && r.eye, `${id}: a Super Fiend-class fight, the rift's last, four screens and the wall-eye`);
  await page.waitForFunction(() => window.__pp.arc.game._dbg.g.boss, null, { timeout: 20000 }); await run(1.2); await shot('intro');
  await until("b && b.act !== 'enter'", 12);
  r = await ev(`return { act: b.act, rise: M.rise, y: +(b.y - C.y).toFixed(2), wall: mod.wallEye.y - C.y };`);
  console.log('  wake', JSON.stringify(r)); ok(r.act !== 'enter' && r.rise > 0.95 && r.y < -8, `${id}: heaved up out of the floor below the wall-eye (${r.y} m)`);
  await settle(); await place(0, 4); await run(0.2); await shot('idle');
  r = await ev(`const bt0 = M.bt, x0 = M.arm ? 0 : 0; const go = clock(0.6); let br = new Set(); while (go()) { await frame(); hold(); br.add(Math.round(Math.sin(M.bt * 1.35) * 100)); } return { dt: M.bt - bt0, poses: br.size };`); ok(r.dt > 0.3 && r.poses > 3, `${id}: never still: it breathes (${r.poses} breath poses in ${r.dt.toFixed(2)} s)`);

  // ---- phase one: acts, Slabfall, the exposed limb ----
  const a1 = await T.watchActs(120, ['slab', 'heave'], 0.8); console.log('  acts1', JSON.stringify(a1)); ok(a1.acts.includes('slab') && a1.acts.includes('heave') && a1.banners.includes('SLABFALL'), `${id}: phase one: Slabfall and heaves (${a1.acts.join(', ')})`);
  await settle(); await place(0, 4); await force('slab');
  await until("S.tele.some(s => s.ink === 'slab' && s.age > s.t * 0.6)", 4); await shot('slab-marks');
  r = await ev(`const s0 = { ...M.stat }; const x = me.x, y = me.y; const go = clock(6); while (go() && !M.exposed) { await frame(); hold(); pin(x, y); } const w = S.weak.limb; let dmg = 0; if (w && !w.dead) { const h0 = b.hp; D.hitMon(w, 1000, { flat: true }); dmg = Math.round(h0 - b.hp); } return { slabs: M.stat.slabs - s0.slabs, hit: M.stat.slabHit - s0.slabHit, exp: !!M.exposed, fwd: w ? w.forward : 0, dmg };`);
  console.log('  slab', JSON.stringify(r)); ok(r.slabs === 3 && r.hit === 1, `${id}: three slabs fall, only the one on the pet strikes (${r.slabs}, hit ${r.hit})`); ok(r.exp && r.fwd === 2 && r.dmg >= 1900, `${id}: a limb is left EXPOSED: a weak point x${r.fwd} (${r.dmg} from 1000)`);
  await run(0.3); await shot('limb-exposed');
  await settle(); await place(2, 2); await force('heave'); await run(0.7); await shot('heave'); await settle();
  // a hit
  await ev(`D.hitMon(b, 1000, { flat: true, viaProxy: true });`); await run(0.08); await shot('hit');

  // ---- phase two: The Unveiling ----
  r = await ev(`b.hp = b.maxhp * 0.62; const go = clock(5); while (go() && S.phase < 2) { await frame(); hold(); } return S.phase;`); ok(r === 2, `${id}: phase two`);
  await settle(); await place(-3, 1); await force('unveil');
  await until("M.G && M.G.state === 'lids' && M.lid[1] > 0.6", 6); await shot('unveil-lids');
  // hidden: behind the NW screen, in its shadow from the eye
  r = await ev(`const s0 = { ...M.stat }; let go = clock(8); while (go() && !(M.G && M.G.state === 'hold')) { await frame(); hold(); } const scr = mod.screens[0], i0 = scr.i; let spot = null, shotT = false;
    go = clock(6); while (go() && M.G && !M.G.resolved) { await frame(); hold(); const P = BAS.shadowOf(scr, M.G.src); if (P) { const a = [(P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2], f = [(P[2][0] + P[3][0]) / 2, (P[2][1] + P[3][1]) / 2]; spot = [a[0] + (f[0] - a[0]) * 0.1, a[1] + (f[1] - a[1]) * 0.1]; pin(spot[0], spot[1]); } if (!shotT && M.G.t > M.G.castAt - 1) { shotT = true; window.__s = 1; } }
    const hid = M.G ? M.G.hid : null; go = clock(5); while (go() && !(M.stat.drags > s0.drags && !scr.moving)) { await frame(); hold(); }
    return { blocked: M.stat.gazeBlocked - s0.gazeBlocked, hit: M.stat.gazeHit - s0.gazeHit, hid, drags: M.stat.drags - s0.drags, i0, i1: scr.i, root: BAS.calcify.rooted };`);
  console.log('  unveil hidden', JSON.stringify(r)); ok(r.blocked === 1 && r.hit === 0 && r.root <= 0, `${id}: THE UNVEILING: in the NW screen's shadow the gaze does not see the pet`); ok(r.drags === 1 && r.i1 !== r.i0, `${id}: then a paddle arm drags that screen one stop (${r.i0} -> ${r.i1})`);
  await settle(); await place(0, 3); await force('unveil');
  await until("M.G && M.G.state === 'hold' && M.G.t > M.G.holdAt + 1", 9); await shot('unveil-gaze');
  r = await ev(`const s0 = { ...M.stat }; const x = C.x + 0.5, y = C.y + 2; let rooted = 0; const go = clock(8); while (go() && M.stat.gazeHit === s0.gazeHit && M.stat.gazeBlocked === s0.gazeBlocked) { await frame(); hold(); pin(x, y); } const g2 = clock(0.3); while (g2()) { await frame(); hold(); rooted = Math.max(rooted, BAS.calcify.rooted); } return { hit: M.stat.gazeHit - s0.gazeHit, rooted };`);
  console.log('  unveil open', JSON.stringify(r)); ok(r.hit === 1 && r.rooted > 0, `${id}: in the open the gaze strikes and calcifies (rooted ${r.rooted.toFixed(2)})`);
  await until("M.drag && M.drag.moved", 4); await run(0.2); await shot('drag');
  await settle();
  const a2 = await T.watchActs(120, ['unveil', 'heave', 'slab'], 0.6); console.log('  acts2', JSON.stringify(a2.acts)); ok(['unveil', 'heave', 'slab'].every(a => a2.acts.includes(a)), `${id}: phase two's cycle (${a2.acts.join(', ')})`);

  // ---- phase three: Witnesses Within ----
  await settle(); r = await ev(`b.hp = b.maxhp * 0.3; const go = clock(5); while (go() && S.phase < 3) { await frame(); hold(); } return S.phase;`); ok(r === 3, `${id}: phase three`);
  await settle(); await place(-6, 0); await force('witness');
  r = await ev(`let go = clock(3); while (go() && !(M.W && M.W.node)) { await frame(); hold(); } const W = M.W; if (!W) return { started: false }; const P = W.pick, s = P.scr, srcs = W.eyes.map(E => E.src);
    const both = () => srcs.every(src => BAS.inShadow(P.x, P.y, src)); const before = both();
    go = clock(5); while (go() && !(W.eyes[1].live)) { await frame(); hold(); }
    const live = M.stat.liveAt.slice(-2); const beforeSlide = both(); s.goTo(P.j); go = clock(2); while (go() && s.moving) { await frame(); hold(); } const after = both(); BAS.calcify.reset(); pin(P.x, P.y + 0.15);
    let maxK = 0; go = clock(2.5); while (go()) { await frame(); hold(); pin(P.x, P.y + 0.15); maxK = Math.max(maxK, BAS.calcify.k); }
    return { started: true, scr: mod.screens.indexOf(s), j: P.j, before, beforeSlide, after, gap: +(live[1] - live[0]).toFixed(2), maxK: +maxK.toFixed(2), inNodes: mod.nodes.includes(W.node), safeNow: srcs.every(src => !BAS.gazeSeen(me.x, me.y, src)) };`);
  console.log('  witness', JSON.stringify(r)); ok(r.started && Math.abs(r.gap - 2) < 0.15, `${id}: WITNESSES WITHIN: the second back eye opens ${r.gap} s after the first`);
  ok(!r.before && !r.beforeSlide && r.after, `${id}: the shared shadow covers the node only once screen ${r.scr} is slid to stop ${r.j}`); ok(r.maxK < 0.5 && r.safeNow && r.inNodes, `${id}: standing in the shared shadow the pet is not calcified (k ${r.maxK}); the node is in mod.nodes`);
  await shot('witness-safe');
  r = await ev(`const W = M.W, n = W.node; D.hitMon(n, 1e12, { flat: true }); const go = clock(0.8); while (go()) { await frame(); hold(); } const w = S.weak.beye0; let dmg = 0; if (w && !w.dead) { const h0 = b.hp; D.hitMon(w, 1000, { flat: true }); dmg = Math.round(h0 - b.hp); } return { shut: M.stat.shut, stun: +b.stunT.toFixed(2), lids: +Math.max(...M.lid).toFixed(2), gaze: !!M.G, W: !!M.W, dmg };`);
  console.log('  node', JSON.stringify(r)); ok(r.shut === 1 && r.stun > 3 && r.lids < 0.2 && !r.gaze && !r.W, `${id}: breaking the node forces the main eye shut and staggers it (stun ${r.stun})`); ok(r.dmg >= 1900, `${id}: its bare back eyes take double damage (${r.dmg})`);
  await shot('stagger');
  const a3 = await T.watchActs(120, ['witness', 'heave', 'unveil'], 0.25); console.log('  acts3', JSON.stringify(a3.acts)); ok(['witness', 'heave'].every(a => a3.acts.includes(a)), `${id}: phase three's cycle (${a3.acts.join(', ')})`);
  await until("M.W && M.W.eyes[1].live", 12); await place(0, 6); await run(0.3); await shot('witness-cones');
  let e2 = errors.length; ok(e2 === 0, `${id}: no page errors (${e2})`); if (e2) console.log(errors.slice(0, 5).join('\n'));

  // ---- the kill and the sealing ----
  await settle(); await place(0.5, 4);
  const k1 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, mod = D.RIFT.self.mod, M = D.FD.FX.mem, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const g0 = D.g.t, w0 = performance.now(); while (D.g.t - g0 < 1.6 && performance.now() - w0 < 12000) { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { dead: D.g.boss.dead, ban: [...ban] }; });
  await shot('dead');
  const k2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, mod = D.RIFT.self.mod, M = D.FD.FX.mem, ban = new Set(); const g0 = D.g.t, w0 = performance.now(); while (D.g.t - g0 < 6 && performance.now() - w0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { open: mod.wallEye.open, sealed: mod.wallEye.sealed, bloom: M.bloom, crumble: M.crumble, ban: [...ban] }; });
  await shot('victory');
  const k3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); const w0 = performance.now(); let shot = false; while (performance.now() - w0 < 120000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D.banners) D.banners.forEach(x => ban.add(x.s)); if (D.banners && D.banners.some(b => b.s === 'THE VEIL SIGIL')) break; } return { ban: [...ban] }; });
  await shot('sigil');
  const k4 = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game && P.arc.game._dbg, ban = new Set(); const w0 = performance.now(); while (performance.now() - w0 < 120000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D && D.banners) D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, ban: [...ban], sealed: !!P.riftState().seals.basilica }; });
  const all = new Set([...k1.ban, ...k2.ban, ...k3.ban, ...k4.ban]); console.log('  kill', JSON.stringify(k2), JSON.stringify([...all]), k4.state, k4.sealed);
  ok(k1.dead && k4.state === 'end', `${id}: the kill ends the stage`);
  ok(k2.open < 0.02 && k2.sealed, `${id}: the eye in the wall closes for good (open ${k2.open.toFixed(3)}, sealed)`); ok(k2.bloom > 0.9 && k2.crumble > 0.9, `${id}: the plants regain colour and the banners crumble (${k2.bloom.toFixed(2)}, ${k2.crumble.toFixed(2)})`);
  ok(all.has('THE WITNESS IS BURIED') && all.has('SEAL THE RIFT') && all.has('THE VEIL SIGIL') && k4.sealed, `${id}: the sealing (THE WITNESS IS BURIED … SEAL THE RIFT … THE VEIL SIGIL), the rift sealed`);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
