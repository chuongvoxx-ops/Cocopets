// The Sea of Fallen Colours' last boss, animated: Chromatica, the Colour Without a Name, run through its descent over
// the Drained Lake (a round floor ~30 m across, the well under it, four beacons), the body turning against its two
// ribbons, its first act cycle (Orbital Cut, Draining Drops): inside the cut's band it strikes, inside or outside it
// misses, the ribbon flies out and comes home slowly while the sphere is unguarded; the drops strike their circles only
// and pool grey. Phase two, Chromatic Burden: a SUN or MOON mark, one opposite mote laid reachable and never inside an
// unresolved hazard (even with the floor north of the pet paved with pools), carried to a beacon before the pulse it
// leaves the eye open (a weak point x2.5); too late, the mark bursts on the pet. Phase three, Conjunction: the third
// broken white ring (only in the final stage) counts down three events whose symbols appear over the sphere in order
// (ribbon, mark, eye); neutralising the mark raises a shield at that beacon, and standing behind it blocks the eye beam
// and blinds the eye (x2.5); played badly, all three land. The kill hands over to the rift's sealing: the comet's fissure
// closes into a white star and the lake turns blue; no page errors. Screenshots (SHOTS=1) into shots/anim-col-*.png.
// Waits are counted in game time (D.g.t), with a generous wall-clock cap, so a loaded machine only makes it slower.
// usage: node tests/_boss-anim-colours-chromatica.js   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const id = 'chromatica', FLOOR = 15, PIT = 2.7, BEACONS = [[-8.4, -6.6], [8.4, -6.6], [-10.6, 1.8], [10.6, 1.8]];
// in-page helpers: a frame, a game-time clock with a wall-clock cap (x4), the pet's hp held
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, S = D.FD.S, me = D.me, C = FX.C;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 4000; };
  const hold = () => { if (me && !me.dead) { me.hp = D.ST.hp; me.mp = 999; } };
  const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
  const BEACONS = ${JSON.stringify(BEACONS)};`;
(async () => {
  const T = await open({ lvl: 92, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors } = T;
  page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text().slice(0, 300)); });
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-col-${name}.png`) }); };
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); hold(); }`, secs);
  const until = (cond, secs, keep) => ev(`const f = new Function('D', 'b', 'M', 'me', 'C', 'S', 'return ' + arg[0]), k = arg[2] ? new Function('D', 'b', 'M', 'me', 'C', 'S', arg[2]) : null; const go = clock(arg[1]); while (go()) { if (f(D, b, M, me, C, S)) return true; await frame(); hold(); if (k) k(D, b, M, me, C, S); } return false;`, [cond, secs, keep || null]);
  const place = (x, y) => ev(`pin(C.x + arg[0], C.y + arg[1]);`, [x, y]);
  // wait for it to be idle: no mark, no Conjunction, the ribbons home, nothing shown (a stagger is cut short)
  const settle = () => ev(`const go = clock(14); while (go()) { await frame(); hold(); if (b.stunT > 0) b.stunT = 0.01; if (b.act === 'hover' && !M.bur && !M.cj && !S.tele.length && M.rs.every(r => r.st === 'home') && !(b.stunT > 0)) return true; } return false;`);
  // its next act: taken at its next choice
  const force = act => ev(`M.nextSig = arg; b.stunT = 0; b.act = 'hover'; b.actT = 99; const go = clock(4); while (go() && b.act !== arg) { await frame(); hold(); } return b.act;`, act);
  const clearMins = () => ev(`for (const m of D.mons) if (!m.dead && m.fminion) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); }`);
  const banners = () => ev(`return D.banners.map(x => x.s);`);

  const idx = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID; return R && R.colours ? R.colours.stages.findIndex(s => s.boss === 'chromatica') : -1; });
  ok(idx === 9, `${id}: stage ${idx}`);
  const stg = await page.evaluate(i => { const R = window.__pp.RIFT_BY_ID.colours, s = R.stages[i]; return { goal: s.goal, name: s.name, seal: !!s.seal, sigil: R.sigil, sealing: R.sealing }; }, idx);
  console.log('  stage', JSON.stringify(stg)); ok(stg.goal === 'Chromatica, the Colour Without a Name' && stg.name === 'The Drained Lake' && stg.seal && stg.sigil === 'Balance', `${id}: the stage names it (${stg.goal}, ${stg.name}), the rift's last, its sigil the ${stg.sigil}`);

  /* ---- the fight ---- */
  await T.start('colours', idx);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, title: D.F.fiend && D.F.fiend.title, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
  console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === 'Chromatica' && r.title === 'The Colour Without a Name' && r.bars > 10 && r.phases === 3 && r.seal, `${id}: a Super Fiend-class fight, the rift's last (${r.bars} bars, ${r.phases} phases)`);
  // the arena: a round floor ~30 m across over the lake, a well under the sphere, four beacons
  r = await ev(`const G = D.M, t = (x, y) => G.G[Math.floor(y) * G.MW + Math.floor(x)], fl = t(C.x + 5, C.y + 5);
    return { e: t(C.x + 14.2, C.y) === fl, oE: t(C.x + 15.8, C.y) !== fl, s: t(C.x, C.y + 14.2) === fl, oS: t(C.x, C.y + 15.8) !== fl, n: t(C.x, C.y - 14.2) === fl, oN: t(C.x, C.y - 15.8) !== fl, pit: t(C.x, C.y) !== fl, rim: t(C.x + 3.4, C.y) === fl, beacons: S.props.filter(p => p.kind === 'beacon').length, bx: +(b ? 0 : 0) };`);
  console.log('  arena', JSON.stringify(r)); ok(r.e && r.oE && r.s && r.oS && r.n && r.oN, `${id}: the Drained Lake: a round floor ~30 m across over the water`); ok(r.pit && r.rim && r.beacons === 4, `${id}: a well under the sphere, four beacons on the floor`);
  await run(0.9); await shot('intro'); await run(1.2); await shot('intro2');
  await until("b && b.act !== 'enter'", 12);
  r = await ev(`return { act: b.act, wake: M.P.wake, x: +(b.x - C.x).toFixed(2), y: +(b.y - C.y).toFixed(2) };`);
  console.log('  wake', JSON.stringify(r)); ok(r.act !== 'enter' && r.wake > 0.9 && Math.abs(r.x) < 0.01 && Math.abs(r.y) < 0.01, `${id}: it has come down over the well at the floor's heart (${r.act})`);
  // the body turns one way, the ribbons the other
  await settle(); await place(1, 8);
  r = await ev(`b.actT = -9; const r0 = M.rot, s0 = M.spin.slice(), go = clock(1.2); while (go()) { await frame(); hold(); b.actT = Math.min(b.actT, -5); } b.actT = 0; return { dRot: M.rot - r0, dA: M.spin[0] - s0[0], dC: M.spin[1] - s0[1] };`);
  console.log('  turn', JSON.stringify(r)); ok(r.dRot < -0.1 && r.dA > 0.3 && r.dC > 0.3, `${id}: never still: the sphere turns (${r.dRot.toFixed(2)}) against its two ribbons (+${r.dA.toFixed(2)}, +${r.dC.toFixed(2)})`);
  await place(1, 8); await run(0.1); await shot('idle');

  // the first act cycle, kept above 80%
  const acts = await ev(`const seen = new Set(), ban = new Set(); let ring = 0; const go = clock(60); while (go()) { await frame(); hold(); if (b.hp < b.maxhp * 0.8) b.hp = b.maxhp * 0.8; seen.add(b.act); ring = Math.max(ring, M.ring3K); D.banners.forEach(x => ban.add(x.s)); if (seen.has('cut') && seen.has('drops') && ban.has('ORBITAL CUT') && ban.has('DRAINING DROPS')) break; } return { acts: [...seen], banners: [...ban], ring };`);
  console.log('  acts', JSON.stringify(acts)); ok(['hover', 'cut', 'drops'].every(a => acts.acts.includes(a)), `${id}: the first act's cycle (${acts.acts.join(', ')})`);
  ok(['ORBITAL CUT', 'DRAINING DROPS'].every(s => acts.banners.includes(s)), `${id}: its attacks are named in banners`); let ring12 = acts.ring;

  // ---- Orbital Cut: inside the band it strikes; inside or outside it, it misses; the ribbon comes home slowly ----
  const cut = (where, tag) => ev(`const [where, tag] = arg; const s0 = { n: M.stat.cuts, hit: M.stat.cutHit }; let go = clock(4), s = null; while (go() && !(s = S.tele.find(q => q.ink === 'cut' && !q.done))) { await frame(); hold(); }
      if (!s) return { started: false }; const a = Math.atan2(me.y - s.y, me.x - s.x), mid = (s.r0 + s.r1) / 2, rr = where === 'in' ? mid : where === 'inner' ? s.r0 - 1.3 : s.r1 + 1.3, x = s.x + Math.cos(a) * rr, y = s.y + Math.sin(a) * rr, rs = M.rs[s.rk]; let outAt = 0, radAt = 0, shot = false;
      go = clock(5); while (go() && M.stat.cuts === s0.n) { await frame(); hold(); pin(x, y); if (!shot && s.age > s.t * 0.7 && tag) { shot = true; window.__cutShot = 1; } outAt = rs.out; radAt = rs.rad; }
      const gS = D.g.t; let shotS = false; go = clock(1.2); while (go()) { await frame(); hold(); if (rs.st === 'strike') { if (!shotS && rs.t > 0.15) { shotS = true; } } else break; }
      return { started: true, rb: +mid.toFixed(2), at: +rr.toFixed(2), n: M.stat.cuts - s0.n, hit: M.stat.cutHit - s0.hit, outAt: +outAt.toFixed(2), radAt: +radAt.toFixed(2), k: s.rk };`, [where, tag || '']);
  await settle(); await place(0, 8); await force('cut');
  await until("S.tele.some(q => q.ink === 'cut' && q.age > q.t * 0.55)", 4); await shot('cut-band');
  let ct = await cut('in', 'x'); console.log('  cut in', JSON.stringify(ct));
  ok(ct.started && ct.n === 1 && ct.hit === 1, `${id}: ORBITAL CUT: standing in its marked band (${(ct.rb - 1.6).toFixed(1)}–${(ct.rb + 1.6).toFixed(1)} m), the ribbon strikes`);
  ok(ct.outAt > 0.9 && Math.abs(ct.radAt - ct.rb) < 0.3, `${id}: the ribbon flies out along the band (out ${ct.outAt}, at ${ct.radAt} m of ${ct.rb})`);
  await run(0.12); await shot('cut-sweep');
  // the ribbon comes home slowly; while it is away the sphere is unguarded
  r = await ev(`const g0 = D.g.t; let h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); const away = Math.round(h0 - b.hp); const go = clock(8); while (go() && M.rs.some(q => q.st !== 'home')) { await frame(); hold(); } const back = +(D.g.t - g0).toFixed(2); h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); return { away, home: Math.round(h0 - b.hp), back };`);
  console.log('  return', JSON.stringify(r)); ok(r.back > 2.5, `${id}: the ribbon comes home slowly (${r.back} s)`); ok(r.away >= r.home * 1.8, `${id}: while it is away the sphere is UNGUARDED (${r.away} vs ${r.home} from a blow of 1000)`);
  await settle(); await place(0, 8); await force('cut'); ct = await cut('inner'); console.log('  cut inner', JSON.stringify(ct)); ok(ct.started && ct.n === 1 && ct.hit === 0, `${id}: inside the band (at ${ct.at} m), the cut misses`);
  await settle(); await place(0, 7); await force('cut'); ct = await cut('outer'); console.log('  cut outer', JSON.stringify(ct)); ok(ct.started && ct.n === 1 && ct.hit === 0, `${id}: outside the band (at ${ct.at} m), the cut misses`);

  // ---- Draining Drops: they strike their circles only, and pool grey (slowing) ----
  await settle(); await place(-2, 8); await force('drops');
  let dr = await ev(`const s0 = { n: M.stat.drops, hit: M.stat.dropHit }, x = me.x, y = me.y; let n = 0, shot = false, slowed = false, pools = 0; const go = clock(6); while (go()) { await frame(); hold(); pin(x, y); const ds = S.tele.filter(q => q.ink === 'drop'); n = Math.max(n, ds.length + M.stat.drops - s0.n); if (!ds.length && M.stat.drops > s0.n) { pools = S.hz.filter(z => z.ink === 'pool').length; const g2 = clock(0.4); while (g2()) { await frame(); hold(); pin(x, y); if (me.chill > 0) slowed = true; } break; } }
    return { n, drops: M.stat.drops - s0.n, hit: M.stat.dropHit - s0.hit, pools, slowed };`);
  console.log('  drops', JSON.stringify(dr)); ok(dr.drops >= 3 && dr.hit === 1, `${id}: DRAINING DROPS: ${dr.drops} circles strike, only the one under the pet hurts`); ok(dr.pools === dr.drops && dr.slowed, `${id}: each leaves a grey pool that slows (${dr.pools})`);
  await run(0.2); await shot('drops-pools');
  let e2 = errors.length; ok(e2 === 0, `${id}: no page errors in the first act (${e2})`); if (e2) console.log(errors.join('\n'));

  /* ---- phase two: Chromatic Burden ---- */
  r = await ev(`b.stunT = 0; b.hp = b.maxhp * 0.62; const go = clock(5); while (go() && S.phase < 2) { await frame(); hold(); } return { phase: S.phase, lv: S.lv };`);
  ok(r.phase === 2, `${id}: phase two`);
  const mins = await ev(`const seen = new Set(), go = clock(6); while (go()) { await frame(); hold(); for (const m of D.mons) if (!m.dead && m.fminion) seen.add(m.type); if (seen.size) break; } return [...seen];`);
  console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0 && mins.every(t => ['chromawraith', 'huewisp', 'greyling', 'prismray'].includes(t)), `${id}: its minions (${mins.join(', ')})`); await clearMins();
  // a mark, the opposite mote (never in a hazard: the drops just shown), carried to a beacon before the pulse
  await settle(); await place(0, 9); await force('burden');
  const bu = await ev(`const go = clock(4); while (go() && !M.bur) { await frame(); hold(); } if (!M.bur) return { started: false }; const B = M.bur, mo = B.mote, L = M.lastMote;
    const g2 = clock(1.1); while (g2()) { await frame(); hold(); }
    return { started: true, kind: B.kind, mote: mo.kind, T: +B.T.toFixed(2), hz: L.hz, bad: L.bad, d: +Math.hypot(L.dx, L.dy).toFixed(2), dy: +L.dy.toFixed(2), onFloor: Math.hypot(mo.x - C.x, mo.y - C.y) < ${FLOOR} - 1.4, offWell: Math.hypot(mo.x - C.x, mo.y - C.y) > ${PIT} + 1.4, zoom: +D.g.zoom.toFixed(2), petY: Math.round(FX.sy(me.y)), moteY: Math.round(FX.sy(mo.y)), H: window.__pp.arc.H };`);
  console.log('  burden', JSON.stringify(bu)); ok(bu.started && (bu.kind === 'sun' ? bu.mote === 'moon' : bu.mote === 'sun'), `${id}: CHROMATIC BURDEN: a ${bu.kind} mark on the pet, and one ${bu.mote} mote`);
  ok(bu.hz >= 1 && !bu.bad && bu.onFloor && bu.offWell && bu.d >= 4 && bu.d <= 9.5, `${id}: the mote lies within reach (${bu.d} m) and not in any of the ${bu.hz} unresolved hazards`);
  ok(bu.dy < 0 && bu.moteY < bu.petY && bu.moteY > 150, `${id}: it lies up the screen from the pet, clear of the buttons (${bu.moteY} px vs the pet's ${bu.petY})`); ok(bu.zoom >= 0.65, `${id}: the camera closes on the pet meanwhile (zoom ${bu.zoom})`);
  await shot('burden');
  r = await ev(`const mo = M.bur.mote; let go = clock(2); while (go() && mo.st === 'lie') { await frame(); hold(); pin(mo.x, mo.y); } const held = mo.st === 'held'; pin(me.x + 1.5, me.y); go = clock(0.6); while (go()) { await frame(); hold(); } return { held };`);
  ok(r.held, `${id}: the pet picks up the mote`); await shot('burden-held');
  r = await ev(`const s0 = { ...M.stat }, B = M.bur, P = BEACONS[0]; let tLeft = 0; const ban = new Set(); let go = clock(3); while (go() && M.bur) { await frame(); hold(); tLeft = B.T - B.t; pin(C.x + P[0] + 1.0, C.y + P[1] + 1.0); D.banners.forEach(x => ban.add(x.s)); }
    go = clock(1.4); while (go()) { await frame(); hold(); D.banners.forEach(x => ban.add(x.s)); } const w = S.weak.eye; let dmg = 0; if (w && !w.dead) { const h0 = b.hp; D.hitMon(w, 1000, { flat: true }); dmg = Math.round(h0 - b.hp); }
    return { clean: M.stat.clean - s0.clean, det: M.stat.det - s0.det, left: +tLeft.toFixed(2), stun: +b.stunT.toFixed(2), why: M.why, weak: !!(w && !w.dead), fwd: w ? w.forward : 0, dmg, eye: +M.eye.toFixed(2), ban: [...ban] };`);
  console.log('  neutralise', JSON.stringify(r)); ok(r.clean === 1 && r.det === 0 && r.left > 0 && r.ban.includes('BALANCED'), `${id}: borne to a beacon before the pulse (${r.left} s to spare), the mark is neutralised: BALANCED`);
  ok(r.stun > 3 && r.why === 'eye' && r.weak && r.fwd === 2.5 && r.dmg >= 2400 && r.eye > 0.9, `${id}: a clean neutralise leaves its eye open: a weak point x${r.fwd} (${r.dmg} from a blow of 1000)`);
  await place(0.5, 6.5); await run(0.15); await shot('eye-open');
  // too late: the mark bursts on the pet at the pulse
  await settle(); await place(0, 9); await force('burden');
  r = await ev(`const s0 = { ...M.stat }, ban = new Set(); let go = clock(4); while (go() && !M.bur) { await frame(); hold(); } const B = M.bur; if (!B) return { started: false }; const g0 = D.g.t, x = me.x, y = me.y; let shot = false;
    go = clock(14); while (go() && M.bur === B) { await frame(); hold(); pin(x, y); D.banners.forEach(q => ban.add(q.s)); if (!shot && B.T - B.t < 1.2) { shot = true; window.__det = 1; } } const took = D.g.t - g0;
    go = clock(0.5); while (go()) { await frame(); hold(); D.banners.forEach(q => ban.add(q.s)); }
    return { started: true, det: M.stat.det - s0.det, hit: M.stat.detHit - s0.detHit, clean: M.stat.clean - s0.clean, took: +took.toFixed(2), T: +B.T.toFixed(2), stun: +(b.stunT || 0).toFixed(2), ban: [...ban] };`);
  console.log('  burst', JSON.stringify(r)); ok(r.started && r.det === 1 && r.hit === 1 && r.clean === 0 && Math.abs(r.took - r.T) < 0.4 && r.ban.includes('THE MARK BURSTS'), `${id}: not neutralised, the mark bursts on the pet at the pulse (${r.took} s)`);
  ok(!(r.stun > 0), `${id}: and no opening comes of it`);
  // the mote never lies inside an unresolved hazard: the floor up the screen from the pet paved with grey pools
  await settle(); await place(0, 9);
  r = await ev(`const n0 = S.hz.length; for (let gy = -9.6; gy <= -1.5; gy += 2.2) for (let gx = -8.8; gx <= 8.8; gx += 2.2) FX.hz({ x: me.x + gx, y: me.y + gy, r: 1.75, shape: 'circle', life: 14, ink: 'pool' }); return S.hz.length - n0;`);
  const paved = r; await force('burden');
  r = await ev(`let go = clock(4); while (go() && !M.bur) { await frame(); hold(); } if (!M.bur) return { started: false }; const mo = M.bur.mote, L = M.lastMote, near = Math.min(...S.hz.map(z => Math.hypot(z.x - mo.x, z.y - mo.y) - z.r));
    return { started: true, hz: L.hz, bad: L.bad, inAny: S.hz.some(z => FX.inShape(z, mo.x, mo.y, 0)) || S.tele.some(s => !s.done && FX.inShape(s, mo.x, mo.y, 0)), near: +near.toFixed(2), onFloor: Math.hypot(mo.x - C.x, mo.y - C.y) < ${FLOOR} - 1.4, offWell: Math.hypot(mo.x - C.x, mo.y - C.y) > ${PIT} + 1.4, d: +Math.hypot(L.dx, L.dy).toFixed(1), badAll: M.stat.moteBad, motes: M.stat.motes };`);
  console.log('  paved', paved, JSON.stringify(r)); ok(r.started && r.hz >= paved && !r.bad && !r.inAny && r.near > 0.5 && r.onFloor && r.offWell, `${id}: with ${paved} pools paving the way, the mote still lies clear of every hazard (${r.near} m from the nearest edge, ${r.d} m away)`);
  await run(0.4); await shot('burden-paved');
  r = await ev(`const mo = M.bur.mote, P = BEACONS[1]; let go = clock(2); while (go() && mo.st === 'lie') { await frame(); hold(); pin(mo.x, mo.y); } go = clock(2); while (go() && M.bur) { await frame(); hold(); pin(C.x + P[0] - 1.0, C.y + P[1] + 1.0); } S.hz.length = 0; b.stunT = 0; return { done: !M.bur, badAll: M.stat.moteBad, motes: M.stat.motes };`);
  ok(r.done && r.badAll === 0 && r.motes >= 3, `${id}: no mote of ${r.motes} ever lay inside a hazard`);
  r = await ev(`let ring = 0; const go = clock(1); while (go()) { await frame(); hold(); ring = Math.max(ring, M.ring3K); } return ring;`); ring12 = Math.max(ring12, r);
  ok(ring12 < 0.05, `${id}: the third ring is not there before the final stage (${ring12.toFixed(3)})`);
  e2 = errors.length; ok(e2 === 0, `${id}: no page errors in the second act (${e2})`); if (e2) console.log(errors.join('\n'));

  /* ---- phase three: Conjunction ---- */
  await settle(); await clearMins();
  r = await ev(`b.stunT = 0; b.hp = b.maxhp * 0.3; const ban = new Set(); let go = clock(5); while (go() && S.phase < 3) { await frame(); hold(); } M.nextSig = 'drops'; go = clock(2.5); while (go()) { await frame(); hold(); D.banners.forEach(x => ban.add(x.s)); } return { phase: S.phase, ring: +M.ring3K.toFixed(2), ban: [...ban] };`);
  console.log('  phase3', JSON.stringify(r)); ok(r.phase === 3 && r.ring > 0.85, `${id}: phase three: the third broken white ring rises (${r.ring})`);
  await clearMins(); await place(0, 9);
  // played well: out of the ribbon's band, the mote to the east beacon, then behind its shield when the eye fires
  const good = ev(`const ban = new Set(), log = { fills: [], mono: true, beforeCut: null, atFire: null }, s0 = { ...M.stat }; let go = clock(8); while (go() && b.act !== 'conj') { await frame(); hold(); b.stunT = 0; if (b.act === 'hover' && !M.cj) { M.nextSig = 'conj'; b.actT = 99; } }
      const J = M.cj; if (!J) return { started: false }; const P = BEACONS[3], ux = P[0] / Math.hypot(P[0], P[1]), uy = P[1] / Math.hypot(P[0], P[1]); let last = [0, 0, 0], band = null, shieldAt = null, blockAt = null, phase = 'mote';
      go = clock(18); while (go() && M.cj === J) { await frame(); hold(); D.banners.forEach(x => ban.add(x.s)); const f = M.ringFill.slice(); if (f.some((v, i) => v < last[i] - 1e-6)) log.mono = false; last = f;
        if (J.fired[0] >= 0 && !log.beforeCut) log.beforeCut = f.map(v => +v.toFixed(2));
        const bt = S.tele.find(q => q.ink === 'cut' && !q.done), bm = S.tele.find(q => q.ink === 'beam' && !q.done);
        if (bm) { blockAt = !!bm.block; if (bm.age > bm.t - 0.05) log.atFire = f.map(v => +v.toFixed(2)); }
        if (M.bur && M.bur.mote.st === 'lie') pin(M.bur.mote.x, M.bur.mote.y);
        else if (M.bur && M.bur.mote.st === 'held') pin(C.x + P[0] - 0.4, C.y + P[1] + 1.2);
        else if (bt) { band = { r0: bt.r0, r1: bt.r1 }; const d = Math.hypot(me.x - C.x, me.y - C.y); if (d > bt.r0 - 1.2 - 0.4 && d < bt.r1 + 1.2) { const a = Math.atan2(me.y - C.y, me.x - C.x), rr = bt.r0 - 1.4; pin(C.x + Math.cos(a) * rr, C.y + Math.sin(a) * rr); } }
        else if (M.shield) { if (!shieldAt) shieldAt = { i: M.shield.i, d: +Math.hypot(M.shield.x - C.x - P[0], M.shield.y - C.y - P[1]).toFixed(2), t: J.t }; if (J.fired[0] >= 0) { const R0 = Math.hypot(P[0], P[1]) + 2.4; pin(C.x + ux * R0, C.y + uy * R0 + 0.3); } }
        if (J.fired[2] >= 0) break; }
      const g2 = clock(1.6); while (g2()) { await frame(); hold(); D.banners.forEach(x => ban.add(x.s)); }
      const w = S.weak.eye; let dmg = 0; if (w && !w.dead) { const h0 = b.hp; D.hitMon(w, 1000, { flat: true }); dmg = Math.round(h0 - b.hp); }
      return { started: true, sym: J.sym.map(v => +v.toFixed(2)), fired: J.fired.map(v => +v.toFixed(2)), res: J.res, kind: J.kind, log, band, shieldAt, blockAt, cutHit: M.stat.cutHit - s0.cutHit, det: M.stat.det - s0.det, shields: M.stat.shields - s0.shields, blocked: M.stat.blocked - s0.blocked, beams: M.stat.beams - s0.beams, beamHit: M.stat.beamHit - s0.beamHit, stun: +b.stunT.toFixed(2), why: M.why, weak: !!(w && !w.dead), fwd: w ? w.forward : 0, dmg, ban: [...ban] };`);
  // (pictures while it runs: the symbols, the band, the shield and the beam)
  await until("M.cj && M.cj.sym[2] >= 0 && M.cj.t > 2.0", 10); await shot('conj-symbols');
  await until("M.cj && S.tele.some(q => q.ink === 'cut' && q.age > q.t * 0.6)", 8); await shot('conj-band');
  await until("M.cj && S.tele.some(q => q.ink === 'beam' && q.age > q.t * 0.55)", 12); await shot('conj-shield');
  await until("M.beamFx && M.beamFx.t > 0.05", 6); await shot('conj-beam');
  const cg = await good; console.log('  conj good', JSON.stringify(cg));
  ok(cg.started && cg.ban.includes('CONJUNCTION'), `${id}: CONJUNCTION`);
  ok(cg.sym.every(v => v >= 0) && cg.sym[0] < cg.sym[1] && cg.sym[1] < cg.sym[2] && cg.sym[2] < cg.fired[0], `${id}: its three symbols appear over the sphere in order (${cg.sym.join(', ')} s), before the first event`);
  ok(cg.fired.every(v => v >= 0) && cg.fired[0] < cg.fired[1] && cg.fired[1] < cg.fired[2], `${id}: the events come in that order: the ribbon sweep, the mark, the eye beam (${cg.fired.join(', ')} s)`);
  ok(cg.log.mono && cg.log.beforeCut && cg.log.beforeCut[0] > 0.95 && cg.log.beforeCut[1] < 0.1 && cg.log.atFire && cg.log.atFire.every(v => v > 0.95), `${id}: the third ring is the countdown: its arcs fill in turn, one to each event (${JSON.stringify(cg.log.beforeCut)} at the sweep, ${JSON.stringify(cg.log.atFire)} at the beam)`);
  ok(cg.cutHit === 0 && cg.res[0] === 'ok' && cg.band, `${id}: out of the ribbon's band, its sweep misses`);
  ok(cg.det === 0 && cg.res[1] === 'ok' && cg.shields === 1 && cg.shieldAt && cg.shieldAt.i === 3 && cg.shieldAt.d < 0.6, `${id}: the mark neutralised at the east beacon raises a small shield there`);
  ok(cg.blockAt && cg.blocked === 1 && cg.beamHit === 0 && cg.beams === 1 && cg.res[2] === 'ok' && cg.ban.includes('THE EYE IS BLINDED'), `${id}: standing behind it, the shield blocks the eye beam: THE EYE IS BLINDED`);
  ok(cg.stun > 3 && cg.why === 'blind' && cg.weak && cg.fwd === 2.5 && cg.dmg >= 2400, `${id}: blinded, the eye is open: a weak point x${cg.fwd} (${cg.dmg} from a blow of 1000)`);
  await place(0.5, 6.5); await run(0.15); await shot('blinded');
  // played badly: standing in the band, the mark left, no shield: all three land
  await settle(); await place(0, 9);
  const cb = await ev(`const s0 = { ...M.stat }; let go = clock(8); while (go() && b.act !== 'conj') { await frame(); hold(); b.stunT = 0; if (b.act === 'hover' && !M.cj) { M.nextSig = 'conj'; b.actT = 99; } }
      const J = M.cj; if (!J) return { started: false }; let x = me.x, y = me.y; go = clock(18); while (go() && M.cj === J) { await frame(); hold(); const bt = S.tele.find(q => q.ink === 'cut' && !q.done); if (bt) { const a = Math.atan2(y - C.y, x - C.x), rr = (bt.r0 + bt.r1) / 2; x = C.x + Math.cos(a) * rr; y = C.y + Math.sin(a) * rr; } pin(x, y); if (J.fired[2] >= 0) break; }
      return { started: true, res: J.res, cutHit: M.stat.cutHit - s0.cutHit, det: M.stat.det - s0.det, detHit: M.stat.detHit - s0.detHit, beamHit: M.stat.beamHit - s0.beamHit, blocked: M.stat.blocked - s0.blocked, shields: M.stat.shields - s0.shields };`);
  console.log('  conj bad', JSON.stringify(cb)); ok(cb.started && cb.cutHit === 1 && cb.det === 1 && cb.detHit === 1 && cb.beamHit === 1 && cb.blocked === 0 && cb.shields === 0 && cb.res.every(v => v === 'x'), `${id}: played badly, all three land: the sweep, the mark's burst and the beam (no shield)`);
  await run(0.3); await shot('conj-after');
  e2 = errors.length; ok(e2 === 0, `${id}: no page errors (${e2})`); if (e2) console.log(errors.join('\n'));

  /* ---- the kill: the last boss of the rift hands over to the sealing ---- */
  await settle(); await place(0.5, 8);
  const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const g0 = D.g.t, w0 = performance.now(); while (D.g.t - g0 < 2.2 && performance.now() - w0 < 12000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } const M = D.FD.FX.mem; return { banners: [...ban], dead: D.g.boss.dead, fis: M.fisK, star: M.star }; });
  await shot('dead');
  const kill2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, M = D.FD.FX.mem, ban = new Set(); const g0 = D.g.t, w0 = performance.now(); let blueAt = null; while (D.g.t - g0 < 30 && performance.now() - w0 < 120000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (blueAt == null && M.blue > 0.8) blueAt = D.g.t - g0; if (D.banners.some(b => b.s === 'RESONANCE')) break; } return { banners: [...ban], fis: M.fisK, star: M.star, blue: M.blue, blueAt, sigil: M.sigil, sky: D.FD.S.skyKey }; });
  await shot('seal');
  const kill3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); const w0 = performance.now(); let shot = false; while (performance.now() - w0 < 120000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D.banners) D.banners.forEach(x => ban.add(x.s)); if (!shot && D.banners && D.banners.some(b => b.s === 'THE BALANCE SIGIL')) { shot = true; window.__sig = 1; break; } } return { banners: [...ban] }; });
  await shot('sigil');
  const kill4 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); const w0 = performance.now(); while (performance.now() - w0 < 120000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D.banners) D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.colours }; });
  const all = new Set([...kill.banners, ...kill2.banners, ...kill3.banners, ...kill4.banners]); console.log('  kill', JSON.stringify(kill4.state), JSON.stringify([...all]), kill4.sealed, JSON.stringify(kill2));
  ok(kill.dead && kill4.state === 'end', `${id}: the kill ends the stage`);
  ok(all.has('THE NAMELESS COLOUR IS STILL') && all.has('SEAL THE RIFT') && all.has('THE BALANCE SIGIL') && kill4.sealed, `${id}: the sealing (THE NAMELESS COLOUR IS STILL … SEAL THE RIFT … THE BALANCE SIGIL), the rift sealed`);
  ok(kill2.fis < 0.1 && kill2.star > 0.9, `${id}: fallen, its fissures close and the comet's fissure becomes a white star`);
  ok(kill2.blue > 0.8 && kill2.blueAt > 1.5 && /blue/.test(kill2.sky || ''), `${id}: the lake gradually regains a reflective blue surface (${kill2.blueAt && kill2.blueAt.toFixed(1)} s)`);
  ok(kill2.sigil > 0.5, `${id}: the Balance Sigil over it: a sun and a crescent orbiting one centre`);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
