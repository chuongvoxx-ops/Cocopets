// The Hollow Moon's first boss, animated: Tsukimochi the Moon Rabbit run through its wake, a full act cycle, a hit, its
// mechanics (Pestle Slam: a pet on the lane is pounded, one off it is missed, and the pestle stuck fast at the lane's end
// is a weak spot; Moon Leap: it lands on the shown circle, hurting inside and not outside, leaves it STUCK (its ears in
// the ground) with its crescent bared, and sends out a shockwave ring that a roll passes through; Elixir Brew: the
// swelling mortar is a weak point and enough blows on it CRACK it and stagger the rabbit, else the cone of elixir
// splashes and leaves a slowing puddle; Mochi Shake: mochi fall onto their circles and roll exactly along their lanes,
// one through the pet, even when the pet hugs the rabbit), its spot (pinned out toward the rim, it hops home), the
// Warren (at half health: thirty moon bunnies, a few at a time, while it is curled up out of reach; a counter runs down;
// cleared, it is EXPOSED), phase two and its minions, and the kill (a section boss: it ends its stage without sealing
// the rift), with no page errors; screenshots (SHOTS=1) into shots/anim-moon-<boss>*.png.
// Waits are counted in game time (D.g.t), with a generous wall-clock cap, so a loaded machine only makes it slower.
// usage: node tests/_boss-anim-moon-tsukimochi.js [tsukimochi]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { tsukimochi: ['pestle', 'leap', 'brew', 'mochi'] };
const WANT_A = { tsukimochi: ['pestle', 'leap', 'brew', 'mochi'] }, WANT_B = { tsukimochi: ['leap', 'pestle', 'mochi', 'brew'] };
const NAMES = { tsukimochi: 'Tsukimochi' };
const MINIONS = { tsukimochi: ['moonbun'] };
const WEAK = { tsukimochi: 'crescent' };
const IDLE = { tsukimochi: 'sit' };
const LAST = null;   // (the boss whose kill seals the rift; not this one)
// in-page helpers: a frame, and a game-time clock with a wall-clock cap (x4)
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, me = D.me, C = FX.C;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 4000; };`;
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(WANT);
  const T = await open({ lvl: 82, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library'] }); const { page, errors } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-moon-${name}.png`) }); };
  // run a body of code in the page (PRE's names in scope), with an argument
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  // run the game for some game seconds, the pet's hp held
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); if (me && !me.dead) { me.hp = D.ST.hp; me.mp = 999; } }`, secs);
  // force the next act: it is taken at the rest's next choice
  const force = (act, idle, waitAct, extra) => ev(`const [act, idle, waitAct, extra] = arg; M.nextAct = act; M.hop = null; b.stunT = 0; b.act = idle; b.actT = 9; let go = clock(8); while (go() && b.act !== waitAct) { await frame(); me.hp = D.ST.hp; b.stunT = 0; if (b.act === idle && !M.hop) { M.nextAct = act; b.actT = 9; } } go = clock(extra); while (go()) { await frame(); me.hp = D.ST.hp; } return b.act;`, [act, idle, waitAct, extra || 0]);
  // wait (holding the pet's hp) until a condition on (D, b, M) holds
  const until = (cond, secs) => ev(`const f = new Function('D', 'b', 'M', 'return ' + arg[0]); const go = clock(arg[1]); while (go()) { if (f(D, b, M)) return true; await frame(); me.hp = D.ST.hp; } return false;`, [cond, secs]);
  const settle = () => ev(`const go = clock(9); while (go() && (M.sl || M.lp || M.bw || M.mc || M.hop || M.mochi.length || M.waves.length || b.act !== 'sit' || b.stunT > 0)) { await frame(); me.hp = D.ST.hp; b.stunT = 0; } return b.act;`);
  // put the pet somewhere in the crater (kept inside it); a boss far from the crater's heart is set back near it first
  const place = (dx, dy) => ev(`const [dx, dy] = arg; if (Math.hypot(b.x - C.x, b.y - C.y) > C.R * 0.45) { b.x = C.x; b.y = C.y - 2; } let x = b.x + dx, y = b.y + dy; const d = Math.hypot(x - C.x, y - C.y); if (d > C.R - 1.5) { x = C.x + (x - C.x) / d * (C.R - 1.5); y = C.y + (y - C.y) / d * (C.R - 1.5); } me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null;`, [dx, dy]);
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.moon ? R.moon.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 2, `${id}: stage ${idx}`); if (idx < 0) continue;
    const stg = await page.evaluate(i => { const s = window.__pp.RIFT_BY_ID.moon.stages[i]; return { bossName: s.goal, bossRoom: s.name }; }, idx);
    ok(stg.bossName === 'Tsukimochi, the Moon Rabbit' && stg.bossRoom === 'The Great Crater', `${id}: the stage names it (${stg.bossName}, ${stg.bossRoom})`);
    await T.start('moon', idx);
    // the fiend: its definition, name and bars
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    ok(!r.seal, `${id}: a section boss (its kill does not seal the rift)`);
    // the wake and the intro: it drops out of the sky beside its mortar
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x + 1; D.me.y = b.y + 7; });
    await run(0.5); await shot(id + '-intro'); await run(1.6); await shot(id + '-intro-land');
    await run(4.2);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`);
    // the Great Crater: some 29 m across, boulders round its rim, the mortar near its heart
    r = await ev(`const S = D.FD.S; return { R: S.C.R, rocks: S.props.filter(p => p.kind === 'rock').length, mo: +Math.hypot(M.mo.x - C.x, M.mo.y - C.y).toFixed(1), home: +Math.hypot(M.home.x - C.x, M.home.y - C.y).toFixed(1) };`);
    console.log('  arena', JSON.stringify(r)); ok(r.R > 13.5 && r.R < 15.5 && r.rocks >= 14 && r.mo < 3 && r.home < 4, `${id}: the Great Crater (${(r.R * 2).toFixed(1)} m, ${r.rocks} rim boulders, its mortar and its spot near the heart)`);
    // the act cycle: the pet kept close
    const cycle = (want, secs) => ev(`const [want, secs] = arg, seen = new Set(), ban = new Set(); let maxRim = 0; const go = clock(secs); while (go()) { await frame(); me.hp = D.ST.hp; me.mp = 999; if (b.stunT > 0) b.stunT = 0; if (b.hp < b.maxhp * 0.55 && D.FD.S.phase < 2) b.hp = b.maxhp * 0.8;
        if (Math.hypot(me.x - b.x, me.y - b.y) > 9 && !b.under) { const p = { x: b.x + 2.0, y: b.y + 5.5 }; const dx = p.x - C.x, dy = p.y - C.y, d = Math.hypot(dx, dy); if (d > C.R - 2) { p.x = C.x + dx / d * (C.R - 2); p.y = C.y + dy / d * (C.R - 2); } me.x = p.x; me.y = p.y; }
        if (b.act !== 'sit' && b.act !== 'leap') maxRim = Math.max(maxRim, Math.hypot(b.x - C.x, b.y - C.y) / C.R);
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban], maxRim: +maxRim.toFixed(2) };`, [want, secs]);
    let acts = await cycle(WANT_A[id], 90);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners), 'maxRim', acts.maxRim); ok(WANT_A[id].every(w => acts.acts.includes(w)), `${id}: the act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners`);
    await settle();
    // two shots 0.4 s apart while it sits (the pose should change between them)
    const idleShots = async (idle, tag) => { await ev(`const go = clock(6); const g0 = D.g.t; while (go() && !(b.act === arg && b.actT > 0.6 && !M.hop && D.g.t - g0 > 2)) { await frame(); me.hp = D.ST.hp; if (b.act === arg) b.actT = Math.min(b.actT, 0.8); }`, idle);
      const near = () => ev(`M.hop = null; M.hopCd = 9; D.g.taps = 4; me.x = b.x + 1.4; me.y = b.y + 6.4; me.vx = me.vy = 0;`);
      await near(); await run(0.05); await shot(id + tag); await run(0.35); await near(); await run(0.05); await shot(id + tag + '-b'); };
    await ev(`b.x = M.home.x; b.y = M.home.y;`);
    await idleShots(IDLE[id], '');
    await page.evaluate(() => { window.__pp.arc.game._dbg.g.taps = 0; });
    // its spot: set down out toward the rim, it bounds back home (near the crater's heart) before it acts
    const rim = await ev(`await (async () => { const go = clock(9); while (go() && (b.act !== 'sit' || b.stunT > 0 || M.hop)) { await frame(); me.hp = D.ST.hp; b.stunT = 0; } })();
      const a = Math.PI * 0.25; b.x = C.x + Math.cos(a) * C.R * 0.75; b.y = C.y + Math.sin(a) * C.R * 0.75; M.hop = null; M.hopCd = 9; b.actT = 0; me.x = C.x - 4; me.y = C.y + 5; let hopped = false, actedFar = false; const go = clock(6);
      while (go()) { await frame(); me.hp = D.ST.hp; b.stunT = 0; if (M.hop) hopped = true; if (b.act !== 'sit' && Math.hypot(b.x - C.x, b.y - C.y) > C.R * 0.55) actedFar = true; if (hopped && !M.hop && b.act === 'sit') break; }
      return { hopped, actedFar, d: +(Math.hypot(b.x - C.x, b.y - C.y) / C.R).toFixed(2), home: +Math.hypot(b.x - M.home.x, b.y - M.home.y).toFixed(2) };`);
    console.log('  rim', JSON.stringify(rim)); ok(rim.hopped && !rim.actedFar && rim.d < 0.4 && rim.home < 0.5, `${id}: pinned out by the rim, it hops home to its mortar (${rim.d} R from the heart) before it acts`);
    await settle();

    // ---- Pestle Slam: a pet on its lane is pounded, one off it is missed; the stuck pestle is a weak spot ----
    const slam = off => ev(`const off = arg; let go = clock(6); while (go() && !(M.sl && M.sl.state === 'shown')) { await frame(); me.hp = D.ST.hp; b.stunT = 0; }
      const S = M.sl; if (!S || S.state !== 'shown') return { started: false }; const s0 = { ...M.stat };
      // on the lane where it was aimed, or stepped off it sideways
      const al = Math.min(S.len - 0.8, Math.max(0.6, Math.hypot(me.x - S.ox, me.y - S.oy))), px = S.ox + S.d[0] * al - S.d[1] * off, py = S.oy + S.d[1] * al + S.d[0] * off; let stuck = false, weak = false, viaW = 0, body = 0, hpAt = 0;
      go = clock(6); while (go() && M.sl === S && S.state !== 'pull') { await frame(); me.hp = D.ST.hp; b.stunT = 0; if (S.state === 'shown' || S.state === 'slam') { me.x = px; me.y = py; me.vx = me.vy = 0; me.dodge = null; me.push = null; }
        if (S.state === 'stuck') { stuck = true; const wk = D.FD.S.weak.pestle; if (wk && !wk.dead) { weak = true; if (!viaW) { let h0 = b.hp; D.hitMon(wk, 1000, { flat: true }); viaW = Math.round(h0 - b.hp); h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); body = Math.round(h0 - b.hp); } } } }
      const g2 = clock(0.3); while (g2()) { await frame(); me.hp = D.ST.hp; }
      return { started: true, len: +S.len.toFixed(1), lunge: +S.lunge.toFixed(1), at: +al.toFixed(1), hit: M.stat.slamHit - s0.slamHit, miss: M.stat.slamMiss - s0.slamMiss, stuck, weak, viaW, body, weakAfter: !!(D.FD.S.weak.pestle && !D.FD.S.weak.pestle.dead) };`, off);
    await place(1.6, 6.3); let w = await force('pestle', IDLE[id], 'pestle', 0); console.log('  wind-up', w);
    await until("M.sl && M.sl.state === 'shown' && M.sl.age - M.sl.t0 > 0.5", 4); await shot(id + '-pestle-lane');
    let sl = await slam(0); console.log('  pestle on', JSON.stringify(sl));
    ok(sl.started && sl.hit === 1 && sl.miss === 0, `${id}: Pestle Slam: a pet on the lane (${sl.at} m along ${sl.len} m) is pounded`);
    ok(sl.stuck && sl.weak && sl.viaW >= sl.body * 1.5 && !sl.weakAfter, `${id}: the pestle sticks fast at the lane's end: a weak spot (${sl.viaW} vs ${sl.body}), gone once it is pulled free`);
    await settle(); await place(1.6, 6.3); w = await force('pestle', IDLE[id], 'pestle', 0);
    await until("M.sl && M.sl.state === 'stuck'", 5); await run(0.15); await shot(id + '-pestle-stuck'); await settle();
    await place(-1.2, 6.3); w = await force('pestle', IDLE[id], 'pestle', 0);
    sl = await slam(2.9); console.log('  pestle off', JSON.stringify(sl)); ok(sl.started && sl.hit === 0 && sl.miss === 1, `${id}: off the lane, the pestle misses`);
    // the pet hugging it: the lane starts at its side, and still finds the pet
    await settle(); await place(0.9, 1.6); w = await force('pestle', IDLE[id], 'pestle', 0);
    sl = await slam(0); console.log('  pestle hug', JSON.stringify(sl)); ok(sl.started && sl.hit === 1, `${id}: a pet hugging it is still on the lane (${sl.at} m along)`);
    await settle();

    // ---- Moon Leap: it lands on the shown circle; inside hurts, outside does not; it is STUCK, the crescent bared ----
    const leap = where => ev(`const where = arg; let go = clock(6); while (go() && !(M.lp && M.lp.tx != null)) { await frame(); me.hp = D.ST.hp; b.stunT = 0; }
      const L = M.lp; if (!L || L.tx == null) return { started: false }; const s0 = { ...M.stat }, tx = L.tx, ty = L.ty, rr = L.r, tele = FX.S.tele.find(s => s.shape === 'circle' && Math.hypot(s.x - tx, s.y - ty) < 0.01);
      // outside: just past the circle's edge, toward the crater's heart if that is clear of the mortar, else round it
      let px = tx + 0.6, py = ty + 0.4; if (where !== 'in') { const a0 = Math.atan2(C.y - ty, C.x - tx); for (let k = 0; k < 24; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.26, x = tx + Math.cos(a) * (rr + 1.6), y = ty + Math.sin(a) * (rr + 1.6); if (FX.inArena(x, y, 1.2) && Math.hypot(x - M.mo.x, y - M.mo.y) > 2.6) { px = x; py = y; break; } } }
      let under = false, maxAlt = 0; go = clock(6); while (go() && !(b.stunT > 0)) { await frame(); me.hp = D.ST.hp; me.x = px; me.y = py; me.vx = me.vy = 0; me.dodge = null; me.push = null; if (b.under) under = true; maxAlt = Math.max(maxAlt, M.alt); }
      const out = { started: true, shown: !!tele, r: rr, landD: +Math.hypot(b.x - tx, b.y - ty).toFixed(2), leapIn: M.stat.leapIn - s0.leapIn, leapOut: M.stat.leapOut - s0.leapOut, under, maxAlt: +maxAlt.toFixed(1), stun: +b.stunT.toFixed(1), kind: M.stunKind, waves: M.waves.length, mo: +Math.hypot(tx - M.mo.x, ty - M.mo.y).toFixed(1) };
      const g2 = clock(0.25); while (g2()) { await frame(); me.hp = D.ST.hp; }
      const wk = D.FD.S.weak.crescent; out.weak = !!(wk && !wk.dead); out.notUnder = !b.under; out.ears = +M.earStuck.toFixed(2);
      return out;`, where);
    await place(1.5, 6); w = await force('leap', IDLE[id], 'leap', 0); console.log('  wind-up', w);
    await until('M.crouch > 0.8', 3); await shot(id + '-leap-crouch');
    const leapShot = until('M.lp && M.lp.state === "air" && M.lp.tele && M.lp.tele.age > M.lp.tele.t * 0.6', 5);
    let lp = leap('in'); await leapShot; await shot(id + '-leap-shadow'); lp = await lp;
    console.log('  leap in', JSON.stringify(lp));
    ok(lp.started && lp.shown && lp.landD < 0.05 && lp.under && lp.maxAlt > 10 && lp.mo >= 3.5, `${id}: Moon Leap: it leaps out of sight (untargetable) and lands on the shown circle (r ${lp.r} m), clear of its mortar`);
    ok(lp.leapIn === 1 && lp.leapOut === 0, `${id}: inside the circle, the landing strikes`);
    ok(lp.stun > 2.5 && lp.kind === 'stuck' && lp.weak && lp.notUnder && lp.ears > 0.5, `${id}: landed, it is STUCK, its ears in the ground (${lp.stun} s), its crescent bared`);
    // the stagger: the crescent takes more than the body
    let stag = await ev(`const ban = new Set(); D.banners.forEach(x => ban.add(x.s)); const wk = D.FD.S.weak.crescent, out = { banners: [...ban] }; if (wk && !wk.dead) { let h0 = b.hp; D.hitMon(wk, 1000, { flat: true }); out.viaW = Math.round(h0 - b.hp); h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); } return out;`);
    console.log('  stuck', JSON.stringify(stag)); ok(stag.banners.includes('STUCK!'), `${id}: the stagger is taught in a banner`); ok(stag.viaW >= stag.body * 2, `${id}: the crescent takes ${stag.viaW} where the fur takes ${stag.body}`);
    await ev(`me.x = b.x + 1.5; me.y = b.y + 6.2;`); await run(0.2); await shot(id + '-stuck'); await run(0.5); await shot(id + '-stuck-b');
    await ev(`b.stunT = 0;`); await settle();
    // outside the circle: no landing blow; then the shockwave ring rolls over a pet that stands still (it strikes) ...
    await place(1.5, 6); w = await force('leap', IDLE[id], 'leap', 0);
    lp = await leap('out'); console.log('  leap out', JSON.stringify(lp)); ok(lp.started && lp.leapIn === 0 && lp.leapOut === 1 && lp.landD < 0.05, `${id}: outside the circle, the landing misses`);
    let wv = await ev(`const s0 = { ...M.stat }, x = me.x, y = me.y; const go = clock(5); while (go() && M.waves.length) { await frame(); me.hp = D.ST.hp; me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; } return { hit: M.stat.waveHit - s0.waveHit, pass: M.stat.wavePass - s0.wavePass };`);
    console.log('  wave stand', JSON.stringify(wv)); ok(wv.hit === 1 && wv.pass === 0, `${id}: the shockwave ring strikes a pet standing in its way`);
    await ev(`b.stunT = 0;`); await settle();
    // ... and a roll through it passes
    await place(1.5, 6); w = await force('leap', IDLE[id], 'leap', 0); lp = await leap('out');
    wv = await ev(`const s0 = { ...M.stat }, x = me.x, y = me.y; const go = clock(5); while (go() && M.waves.length) { await frame(); me.hp = D.ST.hp; me.x = x; me.y = y; me.vx = me.vy = 0; me.push = null; const w = M.waves[0]; if (w && w.t >= w.delay && Math.abs(Math.hypot(me.x - w.x, me.y - w.y) - w.r) < 0.75 && !me.dodge) me.dodge = { t: 0, dur: 0.3, vx: 0, vy: 0, perf: false }; } return { hit: M.stat.waveHit - s0.waveHit, pass: M.stat.wavePass - s0.wavePass };`);
    console.log('  wave roll', JSON.stringify(wv)); ok(wv.hit === 0 && wv.pass === 1, `${id}: rolling through the shockwave ring, the pet comes through unharmed`);
    await ev(`b.stunT = 0;`); await settle();
    // a shot of the ring rolling out
    await place(1.5, 6); w = await force('leap', IDLE[id], 'leap', 0); await leap('out'); await until('M.waves[0] && M.waves[0].r > 5.5', 3); await shot(id + '-wave');
    await ev(`b.stunT = 0;`); await settle();
    // a hit
    await ev(`b.x = M.home.x; b.y = M.home.y; me.x = b.x + 1; me.y = b.y + 6; D.hitMon(b, 1000, { flat: true, viaProxy: true });`); await run(0.1); await shot(id + '-hit'); await run(0.8);

    // ---- Elixir Brew: the swelling mortar is a weak point; strike it enough and it cracks; else the cone splashes ----
    await settle(); await place(0.3, 5.5); w = await force('brew', IDLE[id], 'brew', 0); console.log('  wind-up', w);
    let bw = await ev(`const s0 = { ...M.stat }, old = new Set(D.FD.S.hz); let weak = false, maxSwell = 0, viaW = 0, body = 0, x = me.x, y = me.y; const go = clock(7); while (go() && b.act === 'brew') { await frame(); me.hp = D.ST.hp; if (M.bw && M.bw.state === 'home') { x = M.home.x + 0.3; y = M.home.y + 5.5; } me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; maxSwell = Math.max(maxSwell, M.swell);
        const wk = D.FD.S.weak.mortar; if (wk && !wk.dead) { weak = true; if (!viaW && M.bw && M.bw.pAge > 0.5) { let h0 = b.hp; D.hitMon(wk, 1000, { flat: true }); viaW = Math.round(h0 - b.hp); h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); body = Math.round(h0 - b.hp); } } }
      const g2 = clock(0.3); while (g2()) { await frame(); me.hp = D.ST.hp; }
      return { weak, maxSwell: +maxSwell.toFixed(2), viaW, body, splashHit: M.stat.splashHit - s0.splashHit, cracks: M.stat.cracks - s0.cracks, puddle: D.FD.S.hz.filter(z => !old.has(z) && z.shape === 'cone' && z.slow).length, slowed: me.chill > 0 };`);
    console.log('  brew', JSON.stringify(bw)); ok(bw.weak && bw.maxSwell > 0.8 && bw.viaW >= bw.body * 1.8, `${id}: Elixir Brew: the swelling mortar is a weak point (${bw.viaW} vs ${bw.body})`);
    ok(bw.splashHit === 1 && bw.cracks === 0 && bw.puddle === 1 && bw.slowed, `${id}: left alone, it splashes a cone of sticky elixir that strikes and lingers, slowing`);
    await run(0.3); await shot(id + '-brew-splash'); await settle();
    await place(0.3, 5.5); w = await force('brew', IDLE[id], 'brew', 0);
    await until("M.bw && M.bw.state === 'pound' && M.bw.pAge > 1.4", 4); await shot(id + '-brew-swell');
    bw = await ev(`const s0 = { ...M.stat }, ban = new Set(), old = new Set(D.FD.S.hz); let n = 0; const need = M.bw ? M.bw.need : 0; const go = clock(5); while (go() && b.act === 'brew') { await frame(); me.hp = D.ST.hp; const wk = D.FD.S.weak.mortar; if (wk && !wk.dead && n < 20) { D.hitMon(wk, 5, { flat: true }); n++; } }
      const g2 = clock(0.3); while (g2()) { await frame(); me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      return { need, n, cracks: M.stat.cracks - s0.cracks, splashHit: M.stat.splashHit - s0.splashHit, stun: +b.stunT.toFixed(1), kind: M.stunKind, banners: [...ban], weak: !!(D.FD.S.weak.crescent && !D.FD.S.weak.crescent.dead), mortarWeak: !!(D.FD.S.weak.mortar && !D.FD.S.weak.mortar.dead), puddle: D.FD.S.hz.filter(z => !old.has(z) && z.shape === 'cone' && z.slow).length };`);
    console.log('  crack', JSON.stringify(bw)); ok(bw.cracks === 1 && bw.n === bw.need && bw.splashHit === 0 && bw.puddle === 0 && bw.stun > 2.5 && bw.kind === 'cracked' && bw.weak && !bw.mortarWeak && bw.banners.includes('CRACKED!'), `${id}: ${bw.need} blows on the swelling mortar CRACK it: it reels (${bw.stun} s), its crescent bared, no splash`);
    await run(0.1); await shot(id + '-cracked');
    await ev(`b.stunT = 0;`); await settle();

    // ---- Mochi Shake: mochi fall onto their circles and roll exactly along their lanes, one through the pet ----
    const shake = stepOut => ev(`const stepOut = arg; let go = clock(6); while (go() && !M.mochi.length) { await frame(); me.hp = D.ST.hp; b.stunT = 0; }
      if (!M.mochi.length) return { started: false }; const s0 = { ...M.stat }, rocks = M.mochi.slice(), x0 = me.x, y0 = me.y;
      const perp = (R, x, y) => Math.abs((x - R.S[0]) * R.e[0] + (y - R.S[1]) * R.e[1]), through = rocks.filter(R => perp(R, x0, y0) < 0.3).length;
      let spot = { x: x0, y: y0 }; if (stepOut) { spot = null; for (let d = 2.5; d < 9 && !spot; d += 0.5) for (let k = 0; k < 16 && !spot; k++) { const a = k / 16 * Math.PI * 2, x = x0 + Math.cos(a) * d, y = y0 + Math.sin(a) * d; if (FX.inArena(x, y, 1.5) && Math.hypot(x - b.x, y - b.y) > 4.5 && Math.hypot(x - M.mo.x, y - M.mo.y) > 2.4 && rocks.every(R => perp(R, x, y) > R.r + 1.4)) spot = { x, y }; } }
      const start = rocks.map(R => ({ x: R.x, y: R.y })), along = rocks.map(() => 0); let dev = 0;
      go = clock(9); while (go() && M.mochi.length) { await frame(); me.hp = D.ST.hp; b.stunT = 0; if (spot) { me.x = spot.x; me.y = spot.y; } me.vx = me.vy = 0; me.dodge = null; me.push = null;
        rocks.forEach((R, i) => { if (R.state === 'roll') { dev = Math.max(dev, perp(R, R.x, R.y)); along[i] = Math.max(along[i], (R.x - R.S[0]) * R.d[0] + (R.y - R.S[1]) * R.d[1]); } }); }
      return { started: true, n: rocks.length, through, spot: !!spot, startOk: rocks.every((R, i) => Math.hypot(start[i].x - R.S[0], start[i].y - R.S[1]) < 0.01), dev: +dev.toFixed(3), rolled: rocks.every((R, i) => along[i] >= R.len * 0.97), done: M.stat.mochiDone - s0.mochiDone, hit: M.stat.mochiHit - s0.mochiHit, land: M.stat.mochiLand - s0.mochiLand };`, stepOut);
    await place(3.5, 6.5); w = await force('mochi', IDLE[id], 'mochi', 0); console.log('  wind-up', w);
    const shakeShot = until('M.mochi.length && M.mochi[0].t > M.mochi[0].fall * 0.6', 5);
    let sk = shake(false); await shakeShot; await shot(id + '-mochi-lanes');
    await until("M.mochi.some(R => R.state === 'roll' && R.s > 3)", 4); await shot(id + '-mochi-roll');
    sk = await sk; console.log('  mochi stand', JSON.stringify(sk));
    ok(sk.started && sk.n === 3 && sk.startOk && sk.rolled && sk.done === sk.n && sk.dev < 0.02, `${id}: Mochi Shake: ${sk.n} mochi drop on their circles and roll the whole length of their lanes (off by ${sk.dev} m)`);
    ok(sk.through === 1 && sk.hit === 1, `${id}: one lane runs through the pet, and its mochi strikes it`);
    await settle(); await place(3.5, 6.5); w = await force('mochi', IDLE[id], 'mochi', 0);
    sk = await shake(true); console.log('  mochi out', JSON.stringify(sk)); ok(sk.started && sk.spot && sk.hit === 0 && sk.land === 0, `${id}: stepped out of the lanes, the mochi roll past`);
    // the pet hugging the rabbit: a lane through it all the same
    await settle(); await place(0.9, 1.3); w = await force('mochi', IDLE[id], 'mochi', 0);
    sk = await shake(false); console.log('  mochi hug', JSON.stringify(sk)); ok(sk.started && sk.through >= 1, `${id}: a pet hugging it still has a lane through it`);
    await settle();

    // ---- the Warren: half health; curled up out of reach, it lets out thirty, a few at a time; cleared, it is EXPOSED ----
    const ub = await ev(`const ban = new Set(); b.stunT = 0; b.hp = b.maxhp * 0.45;
      const go = clock(8); while (go() && !(b.act === 'warren' && M.wr && M.wr.spawned >= 4)) { await frame(); me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      const under = !!b.under, hp0 = b.hp; D.hitMon(b, 1e6, { flat: true }); const struck = Math.round(hp0 - b.hp);
      return { phase: D.FD.S.phase, act: b.act, under, struck, banners: [...ban], seal: +M.seal.toFixed(2), curl: +M.curl.toFixed(2), parts: Object.values(D.FD.S.partsMap || {}).filter(o => o && !o.dead).length, home: +Math.hypot(b.x - M.home.x, b.y - M.home.y).toFixed(2) };`);
    console.log('  warren', JSON.stringify(ub)); ok(ub.phase === 2 && ub.act === 'warren' && ub.under && ub.struck === 0 && ub.parts === 0 && ub.banners.includes('THE WARREN') && ub.curl > 0.8, `${id}: half health: THE WARREN: it curls up behind its ears, out of reach`);
    await ev(`me.x = b.x + 1.5; me.y = b.y + 6.5;`); await run(0.8); await shot(id + '-warren');
    const sw = await ev(`const ban = new Set(), types = new Set(), counts = []; let killed = 0, maxLive = 0, underAll = true, hits = 0; const go = clock(70);
      while (go() && b.act === 'warren') { await frame(); if (b.act !== 'warren') { counts.push(0); break; } me.hp = D.ST.hp; me.mp = 999; D.banners.forEach(x => ban.add(x.s)); const live = D.mons.filter(q => !q.dead && q.horde); maxLive = Math.max(maxLive, live.length); live.forEach(q => types.add(q.type)); if (!b.under) underAll = false;
        if (M.wr) { const left = M.wr.total - M.wr.killed; if (!counts.length || counts[counts.length - 1] !== left) counts.push(left); }
        if (Math.random() < 0.1) { const hp0 = b.hp; D.hitMon(b, 1000, { flat: true }); if (b.hp < hp0) hits++; }
        // clear the landed ones, now and then
        if (Math.random() < 0.12) { const q = live.find(q => !q.launch); if (q) { D.hitMon(q, 1e9, { flat: true }); killed++; } } }
      const g2 = clock(0.5); while (g2()) { await frame(); me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      const mono = counts.every((c, i) => !i || c < counts[i - 1]);
      return { act: b.act, stun: +b.stunT.toFixed(1), kind: M.stunKind, poured: M.stat.poured, killedStat: M.stat.killed, killed, maxLive, types: [...types], banners: [...ban], under: !!b.under, underAll, hits, weak: !!(D.FD.S.weak.crescent && !D.FD.S.weak.crescent.dead), first: counts[0], last: counts[counts.length - 1], steps: counts.length, mono };`);
    console.log('  swarm', JSON.stringify(sw));
    ok(sw.types.length === 1 && sw.types[0] === 'moonbun' && sw.killedStat === 30 && sw.maxLive >= 3 && sw.maxLive <= 5, `${id}: the warren pours out of the mortar (${sw.killedStat} cleared, up to ${sw.maxLive} at once: ${sw.types.join(', ')})`);
    ok(sw.underAll && sw.hits === 0, `${id}: curled up the whole time: no blow lands on it`);
    ok(sw.first === 30 && sw.last === 0 && sw.mono && sw.steps >= 20, `${id}: its counter runs down from ${sw.first} to ${sw.last}`);
    ok(sw.kind === 'exposed' && sw.stun > 5 && sw.weak && !sw.under && sw.banners.includes('EXPOSED!'), `${id}: the warren cleared: EXPOSED (${sw.stun} s), its crescent bare`);
    stag = await ev(`const wk = D.FD.S.weak.crescent, out = {}; if (wk && !wk.dead) { let h0 = b.hp; D.hitMon(wk, 1000, { flat: true }); out.viaW = Math.round(h0 - b.hp); h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); } return out;`);
    console.log('  exposed', JSON.stringify(stag)); ok(stag.viaW >= stag.body * 2.5, `${id}: exposed, the crescent takes ${stag.viaW} where the fur takes ${stag.body}`);
    await ev(`me.x = b.x + 1.2; me.y = b.y + 6;`); await run(0.3); await shot(id + '-exposed');
    await ev(`b.stunT = 0;`); await run(1.2);

    // ---- phase two: the cycle, two pestle lanes, five mochi, bunnies hopping out now and then ----
    await settle();
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const q of D.mons) if (!q.dead && !q.boss && !q.fobj) q.dead = true; });
    await place(1.6, 6.3); w = await force('pestle', IDLE[id], 'pestle', 0);
    const two = await ev(`const s0 = { ...M.stat }; const go = clock(10); while (go() && b.act === 'pestle') { await frame(); me.hp = D.ST.hp; if (M.sl && M.sl.state === 'shown') { me.x = M.sl.ox + M.sl.d[1] * 3.4; me.y = M.sl.oy - M.sl.d[0] * 3.4; } } return { slams: M.stat.slams - s0.slams, hits: M.stat.slamHit - s0.slamHit };`);
    console.log('  two slams', JSON.stringify(two)); ok(two.slams === 2 && two.hits === 0, `${id}: in phase two the pestle comes down along two lanes in a row`);
    await settle(); await place(3.5, 6.5); w = await force('mochi', IDLE[id], 'mochi', 0); sk = await shake(true); console.log('  mochi p2', JSON.stringify(sk)); ok(sk.n === 5 && sk.dev < 0.02, `${id}: in phase two, five mochi`);
    await settle();
    await idleShots(IDLE[id], '-p2');
    acts = await cycle(WANT_B[id], 90);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT_B[id].every(w => acts.acts.includes(w)), `${id}: phase two's act cycle (${acts.acts.join(', ')})`);
    // minions
    const mins = await ev(`const types = arg, seen = new Set(); const go = clock(40); while (go()) { await frame(); me.hp = D.ST.hp; me.mp = 999; b.stunT = 0; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && !m.horde && types.includes(m.type)) seen.add(m.type); if (seen.size >= types.length) break; } return [...seen];`, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length === MINIONS[id].length, `${id}: moon bunnies in phase two (${mins.join(', ')})`);
    await run(0.6); await shot(id + '-bunnies-p2');
    await run(1);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill (a section boss: it ends the stage without sealing the rift)
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.moon }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); if (id !== LAST) ok(!kill.sealed, `${id}: no sealing (a section boss)`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
