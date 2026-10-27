// The Sea of Fallen Colours' first boss, animated: Grisaille the Thief of Hues run through its wake, a full act cycle, a
// hit, its mechanics (Drain: the grey ring spreads; inside it the pet is drained and slowed, outside it is not; Pincer
// Crush: inside the shown circle the great claw crushes, outside it misses, the claw stuck in the sand is a weak spot,
// and the small claw's shown line snips a pet on it and misses one off it; Prism Beams: three lines a volley, three
// volleys turning between them, a pet on a line is struck and one in a gap is not; Hue Theft: the shell is a weak point
// while it drinks, enough blows CRACK it (a stagger, its heart bared x2.5), else the flare strikes inside its circle and
// not outside), its spot (pinned out toward the rim, it scuttles home), the Brood (at half health: thirty greylings, at
// most six at once, while it hides in its shell out of reach; a counter runs down; cleared, it is EXPOSED), phase two
// (two snips, five beams, greylings now and then), and the kill (a section boss: it ends its stage without sealing the
// rift), with no page errors; screenshots (SHOTS=1) into shots/anim-colours-grisaille*.png.
// Waits are counted in game time (D.g.t), with a generous wall-clock cap, so a loaded machine only makes it slower.
// usage: node tests/_boss-anim-colours-grisaille.js   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const id = 'grisaille', IDLE = 'sit';
const WANT_A = ['crush', 'drain', 'beams', 'theft'], WANT_B = ['beams', 'crush', 'theft', 'drain'];
// in-page helpers: a frame, and a game-time clock with a wall-clock cap (x4)
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, me = D.me, C = FX.C;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 4000; };
  const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; me.leap = null; };`;
(async () => {
  const T = await open({ lvl: 92, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-colours-${name}.png`) }); };
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); if (me && !me.dead) { me.hp = D.ST.hp; me.mp = 999; } }`, secs);
  // force the next act: it is taken at the rest's next choice
  const force = (act, extra) => ev(`const [act, extra] = arg; M.nextAct = act; M.sc = null; b.stunT = 0; b.act = 'sit'; b.actT = 9; let go = clock(8); while (go() && b.act !== act) { await frame(); me.hp = D.ST.hp; b.stunT = 0; if (b.act === 'sit' && !M.sc) { M.nextAct = act; b.actT = 9; } } go = clock(extra); while (go()) { await frame(); me.hp = D.ST.hp; } return b.act;`, [act, extra || 0]);
  const until = (cond, secs) => ev(`const f = new Function('D', 'b', 'M', 'return ' + arg[0]); const go = clock(arg[1]); while (go()) { if (f(D, b, M)) return true; await frame(); me.hp = D.ST.hp; } return false;`, [cond, secs]);
  const settle = () => ev(`const go = clock(9); while (go() && (M.dr || M.cr || M.bm || M.th || M.sc || b.act !== 'sit' || b.stunT > 0)) { await frame(); me.hp = D.ST.hp; b.stunT = 0; } return b.act;`);
  // put the pet somewhere on the beach (kept inside it); a crab far from its hollow is set back in it first
  const place = (dx, dy) => ev(`const [dx, dy] = arg; if (Math.hypot(b.x - M.home.x, b.y - M.home.y) > 1.5) { b.x = M.home.x; b.y = M.home.y; } let x = b.x + dx, y = b.y + dy; const d = Math.hypot(x - C.x, y - C.y); if (d > C.R - 1.5) { x = C.x + (x - C.x) / d * (C.R - 1.5); y = C.y + (y - C.y) / d * (C.R - 1.5); } hold(x, y);`, [dx, dy]);
  // a weak point's blow against the body's
  const ratio = key => ev(`const wk = D.FD.S.weak[arg], out = { weak: !!(wk && !wk.dead) }; if (out.weak) { let h0 = b.hp; D.hitMon(wk, 1000, { flat: true }); out.viaW = Math.round(h0 - b.hp); h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); } return out;`, key);

  const idx = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID; return R && R.colours ? R.colours.stages.findIndex(s => s.boss === 'grisaille') : -1; });
  ok(idx === 2, `${id}: stage ${idx}`); if (idx < 0) { await T.browser.close(); process.exit(1); }
  const stg = await page.evaluate(i => { const s = window.__pp.RIFT_BY_ID.colours.stages[i]; return { bossName: s.goal, bossRoom: s.name }; }, idx);
  ok(stg.bossName === 'Grisaille, the Thief of Hues' && stg.bossRoom === 'The Bleached Cove', `${id}: the stage names it (${stg.bossName}, ${stg.bossRoom})`);
  await T.start('colours', idx);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
  console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === 'Grisaille' && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
  ok(!r.seal, `${id}: a section boss (its kill does not seal the rift)`);
  // the wake and the intro: it bursts up out of the sand in its hollow
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x + 1; D.me.y = b.y + 7; });
  await run(0.7); await shot(id + '-intro'); await run(1.4); await shot(id + '-intro-risen');
  await run(4.2);
  r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD }; });
  console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`);
  // the Bleached Cove: some 30 m across, coral and driftwood round its rim, its hollow near the heart
  r = await ev(`const S = D.FD.S; return { R: S.C.R, coral: S.props.filter(p => p.kind === 'bleachcoral').length, drift: S.props.filter(p => p.kind === 'driftwood').length, shards: S.props.filter(p => p.kind === 'prismshard').length, home: +Math.hypot(M.home.x - C.x, M.home.y - C.y).toFixed(1) };`);
  console.log('  arena', JSON.stringify(r)); ok(r.R > 14 && r.R < 16 && r.coral >= 5 && r.drift >= 4 && r.shards >= 1 && r.home < 3, `${id}: the Bleached Cove (${(r.R * 2).toFixed(1)} m, ${r.coral} coral, ${r.drift} driftwood, its hollow near the heart)`);

  // the act cycle: the pet kept close
  const cycle = (want, secs) => ev(`const [want, secs] = arg, seen = new Set(), ban = new Set(); let maxRim = 0; const go = clock(secs); while (go()) { await frame(); me.hp = D.ST.hp; me.mp = 999; if (b.stunT > 0) b.stunT = 0; if (b.hp < b.maxhp * 0.55 && D.FD.S.phase < 2) b.hp = b.maxhp * 0.8;
      if (Math.hypot(me.x - b.x, me.y - b.y) > 9 && !b.under) { const p = { x: b.x + 2.0, y: b.y + 5.5 }; const dx = p.x - C.x, dy = p.y - C.y, d = Math.hypot(dx, dy); if (d > C.R - 2) { p.x = C.x + dx / d * (C.R - 2); p.y = C.y + dy / d * (C.R - 2); } me.x = p.x; me.y = p.y; }
      if (b.act !== 'sit') maxRim = Math.max(maxRim, Math.hypot(b.x - C.x, b.y - C.y) / C.R);
      seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban], maxRim: +maxRim.toFixed(2) };`, [want, secs]);
  let acts = await cycle(WANT_A, 90);
  console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners), 'maxRim', acts.maxRim); ok(WANT_A.every(w => acts.acts.includes(w)), `${id}: the act cycle (${acts.acts.join(', ')})`);
  ok(acts.banners.length >= 3, `${id}: the attacks are named in banners`); ok(acts.maxRim < 0.6, `${id}: it acts near the cove's heart (out to ${acts.maxRim} R)`);
  await settle();
  // two shots 0.4 s apart while it sits (the pose should change between them)
  const idleShots = async tag => { await ev(`const go = clock(6); const g0 = D.g.t; while (go() && !(b.act === 'sit' && b.actT > 0.6 && !M.sc && D.g.t - g0 > 2)) { await frame(); me.hp = D.ST.hp; if (b.act === 'sit') b.actT = Math.min(b.actT, 0.8); }`);
    const near = () => ev(`M.sc = null; M.scCd = 9; D.g.taps = 4; hold(b.x + 1.4, b.y + 6.4);`);
    await near(); await run(0.05); await shot(id + tag); await run(0.35); await near(); await run(0.05); await shot(id + tag + '-b'); };
  await ev(`b.x = M.home.x; b.y = M.home.y;`);
  await idleShots('');
  await page.evaluate(() => { window.__pp.arc.game._dbg.g.taps = 0; });
  // its spot: set down out toward the rim, it scuttles back to its hollow before it acts
  const rim = await ev(`await (async () => { const go = clock(9); while (go() && (b.act !== 'sit' || b.stunT > 0 || M.sc)) { await frame(); me.hp = D.ST.hp; b.stunT = 0; } })();
    const a = Math.PI * 0.25; b.x = C.x + Math.cos(a) * C.R * 0.72; b.y = C.y + Math.sin(a) * C.R * 0.72; M.sc = null; M.scCd = 9; b.actT = 0; hold(C.x - 4, C.y + 5); let ran = false, actedFar = false, side = 0; const go = clock(6);
    while (go()) { await frame(); me.hp = D.ST.hp; b.stunT = 0; if (M.sc) { ran = true; side = Math.max(side, Math.abs(Math.cos(M.hd - M.sc.a))); } if (b.act !== 'sit' && Math.hypot(b.x - C.x, b.y - C.y) > C.R * 0.55) actedFar = true; if (ran && !M.sc && b.act === 'sit') break; }
    return { ran, actedFar, d: +(Math.hypot(b.x - C.x, b.y - C.y) / C.R).toFixed(2), home: +Math.hypot(b.x - M.home.x, b.y - M.home.y).toFixed(2), side: +side.toFixed(2) };`);
  console.log('  rim', JSON.stringify(rim)); ok(rim.ran && !rim.actedFar && rim.d < 0.3 && rim.home < 0.5, `${id}: pinned out by the rim, it scuttles home to its hollow (${rim.d} R from the heart) before it acts`);
  await settle();

  // ---- Pincer Crush: the great claw slams the shown circle (inside crushed, outside missed); stuck, the claw is a weak
  // spot; then the small claw snips along its shown line (on it snipped, off it missed) ----
  const crush = (where, snip) => ev(`const [where, snip] = arg; let go = clock(6); while (go() && !(M.cr && M.cr.state === 'shown')) { await frame(); me.hp = D.ST.hp; b.stunT = 0; }
    const Cr = M.cr; if (!Cr || Cr.state !== 'shown') return { started: false }; const s0 = { ...M.stat };
    let px = Cr.tx, py = Cr.ty; if (where !== 'in') { const a0 = Math.atan2(C.y - Cr.ty, C.x - Cr.tx); for (let k = 0; k < 24; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.26, x = Cr.tx + Math.cos(a) * (Cr.r + 1.4), y = Cr.ty + Math.sin(a) * (Cr.r + 1.4); if (FX.inArena(x, y, 1.2) && Math.hypot(x - b.x, y - b.y) > 2.5) { px = x; py = y; break; } } }
    let stuck = false, weak = false, viaW = 0, body = 0, sn = 0, snW = 0, snOn = null; const SNS = [];
    go = clock(9); while (go() && M.cr === Cr && Cr.state !== 'pull') { await frame(); me.hp = D.ST.hp; b.stunT = 0;
      if (Cr.state === 'shown' || Cr.state === 'slam') hold(px, py);
      const S = Cr.sn; if (S && (S.state === 'shown' || S.state === 'snip')) { if (!SNS.includes(S)) SNS.push(S); const al = S.len * 0.6, off = snip === 'on' ? 0 : 2.6; hold(S.ox + S.d[0] * al - S.d[1] * off, S.oy + S.d[1] * al + S.d[0] * off); }
      if (Cr.state === 'stuck') { stuck = true; const wk = D.FD.S.weak.claw; if (wk && !wk.dead) { weak = true; if (!viaW) { let h0 = b.hp; D.hitMon(wk, 1000, { flat: true }); viaW = Math.round(h0 - b.hp); h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); body = Math.round(h0 - b.hp); } } } }
    const g2 = clock(0.6); while (g2()) { await frame(); me.hp = D.ST.hp; }
    return { started: true, r: Cr.r, hit: M.stat.crushHit - s0.crushHit, miss: M.stat.crushMiss - s0.crushMiss, stuck, weak, viaW, body, weakAfter: !!(D.FD.S.weak.claw && !D.FD.S.weak.claw.dead), snips: M.stat.snips - s0.snips, snipHit: M.stat.snipHit - s0.snipHit, snipMiss: M.stat.snipMiss - s0.snipMiss, lines: SNS.map(S => +S.len.toFixed(1)), lunge: +Cr.lunge.toFixed(1) };`, [where, snip]);
  await place(1.5, 6); let w = await force('crush', 0); console.log('  wind-up', w);
  await until("M.cr && M.cr.state === 'shown' && M.cr.age - M.cr.t0 > 0.6", 4); await shot(id + '-crush-shown');
  let cr = await crush('in', 'on'); console.log('  crush in', JSON.stringify(cr));
  ok(cr.started && cr.hit === 1 && cr.miss === 0, `${id}: Pincer Crush: inside the shown circle (r ${cr.r} m) the great claw crushes`);
  ok(cr.stuck && cr.weak && cr.viaW >= cr.body * 1.6 && !cr.weakAfter, `${id}: the great claw stuck in the sand is a weak spot (${cr.viaW} vs ${cr.body}), gone once it is pulled free`);
  ok(cr.snips === 1 && cr.snipHit === 1 && cr.lines.length === 1, `${id}: then the small claw snips along its shown line (${cr.lines} m) and catches a pet on it`);
  await settle(); await place(1.5, 6); w = await force('crush', 0);
  await until("M.cr && M.cr.sn && M.cr.sn.state === 'shown' && M.cr.age - M.cr.sn.t0 > 0.35", 5); await shot(id + '-crush-snip'); await settle();
  await place(-1.5, 6); w = await force('crush', 0);
  cr = await crush('out', 'off'); console.log('  crush out', JSON.stringify(cr));
  ok(cr.started && cr.hit === 0 && cr.miss === 1, `${id}: outside the circle, the crush misses`); ok(cr.snips === 1 && cr.snipHit === 0 && cr.snipMiss === 1, `${id}: off the snip's line, the snip misses`);
  // the pet hugging it: the circle still finds the pet
  await settle(); await place(0.6, 2.4); w = await force('crush', 0);
  cr = await crush('in', 'off'); console.log('  crush hug', JSON.stringify(cr)); ok(cr.started && cr.hit === 1, `${id}: a pet hugging it is still under the claw`);
  await settle();
  // a hit
  r = await ev(`b.x = M.home.x; b.y = M.home.y; hold(b.x + 1, b.y + 6); const r0 = M.recoil; D.hitMon(b, 1000, { flat: true, viaProxy: true }); await frame(); return { r0: +r0.toFixed(2), recoil: +M.recoil.toFixed(2) };`); await shot(id + '-hit');
  ok(r.recoil > 0.2 && r.recoil > r.r0 + 0.1, `${id}: it rocks back when struck (${r.r0} to ${r.recoil})`); await run(0.8);

  // ---- Drain: the grey ring spreads from it; inside, the pet is drained and slowed; outside, nothing ----
  const drain = where => ev(`const where = arg; let go = clock(6); while (go() && !(M.dr && M.dr.state === 'spread')) { await frame(); me.hp = D.ST.hp; b.stunT = 0; }
    const Dr = M.dr; if (!Dr) return { started: false }; const s0 = { ...M.stat }, c0 = Dr.cur; let c1 = 0, chill = 0, insideSeen = false;
    const px = Dr.x + (where === 'in' ? 1.2 : 1.6), py = Dr.y + (where === 'in' ? Dr.r - 1.6 : Dr.r + 1.6);
    go = clock(8); while (go() && M.dr === Dr) { await frame(); me.hp = D.ST.hp; b.stunT = 0; hold(px, py); c1 = Math.max(c1, Dr.cur); if (Dr.state === 'drain') { chill = Math.max(chill, me.chill || 0); if (Dr.inside) insideSeen = true; } }
    return { started: true, r: Dr.r, c0: +c0.toFixed(1), c1: +c1.toFixed(1), ticks: M.stat.drainTicks - s0.drainTicks, chill: +chill.toFixed(2), insideSeen, act: b.act };`, where);
  await place(1.5, 5); w = await force('drain', 0); console.log('  wind-up', w);
  const drShot = until("M.dr && M.dr.state === 'drain' && M.dr.age - M.dr.t1 > 0.7", 6);
  let dr = drain('in'); await drShot; await shot(id + '-drain'); dr = await dr; console.log('  drain in', JSON.stringify(dr));
  ok(dr.started && dr.c0 < dr.r * 0.4 && dr.c1 >= dr.r - 0.01, `${id}: Drain: a grey ring spreads from it (${dr.c0} m to ${dr.c1} m)`);
  ok(dr.insideSeen && dr.ticks >= 4 && dr.chill > 0.2, `${id}: inside the ring the pet is drained (${dr.ticks} ticks) and slowed`);
  await settle(); await place(1.5, 5); w = await force('drain', 0);
  dr = await drain('out'); console.log('  drain out', JSON.stringify(dr)); ok(dr.started && !dr.insideSeen && dr.ticks === 0, `${id}: stepped out of the ring, the pet keeps its colour`);
  await settle();

  // ---- Prism Beams: single-colour beams along shown lines, three volleys turning between them; on a line struck, in a gap not ----
  const beams = where => ev(`const where = arg; let go = clock(6); while (go() && !(M.bm && M.bm.state === 'shown')) { await frame(); me.hp = D.ST.hp; b.stunT = 0; }
    const B = M.bm; if (!B) return { started: false }; const s0 = { ...M.stat };
    go = clock(12); while (go() && M.bm === B) { await frame(); me.hp = D.ST.hp; b.stunT = 0; const a = B.a0 + (where === 'on' ? 0 : Math.PI / B.n); hold(B.x + Math.cos(a) * 5, B.y + Math.sin(a) * 5); }
    const angs = B.angs.map(a => +a.toFixed(2)), turns = angs.slice(1).map((a, i) => +Math.abs(a - angs[i]).toFixed(2));
    return { started: true, n: B.n, vol: B.angs.length, volleys: M.stat.volleys - s0.volleys, hit: M.stat.beamHit - s0.beamHit, miss: M.stat.beamMiss - s0.beamMiss, turns };`, where);
  await place(1.5, 6); w = await force('beams', 0); console.log('  wind-up', w);
  const bmShot = until("M.bm && M.bm.state === 'shown' && M.bm.age - M.bm.t0 > 0.5", 5), bmShot2 = bmShot.then(() => until("M.bm && M.bm.state === 'fire' && M.bm.age - M.bm.t1 > 0.06", 5));
  let bm = beams('gap'); await bmShot; await shot(id + '-beams-shown'); await bmShot2; await shot(id + '-beams-fire'); bm = await bm; console.log('  beams gap', JSON.stringify(bm));
  ok(bm.started && bm.n === 3 && bm.vol === 3 && bm.turns.every(t => t > 0.2), `${id}: Prism Beams: ${bm.n} lines a volley, ${bm.vol} volleys, turning between them (${bm.turns})`);
  ok(bm.hit === 0 && bm.miss === 3, `${id}: standing in the gaps, no beam strikes`);
  await settle(); await place(1.5, 6); w = await force('beams', 0);
  bm = await beams('on'); console.log('  beams on', JSON.stringify(bm)); ok(bm.started && bm.hit === 3, `${id}: on a line, each volley strikes`);
  await settle();

  // ---- Hue Theft: the shell is a weak point while it drinks; left alone it flares (inside struck, outside not);
  // struck enough, it CRACKS: a stagger, the heart bared ----
  const theft = where => ev(`const where = arg; let go = clock(6); while (go() && !(M.th && M.th.state === 'drink')) { await frame(); me.hp = D.ST.hp; b.stunT = 0; }
    const Th = M.th; if (!Th) return { started: false }; const s0 = { ...M.stat }; let weak = false, maxLit = 0, shownAt = 0;
    const px = Th.x + 1.2, py = Th.y + (where === 'in' ? Th.fr - 1.8 : Th.fr + 1.5);
    go = clock(9); while (go() && b.act === 'theft') { await frame(); me.hp = D.ST.hp; hold(px, py); const wk = D.FD.S.weak.shell; if (wk && !wk.dead) weak = true; maxLit = Math.max(maxLit, Th.lit); if (Th.shown && !shownAt) shownAt = Th.lit; }
    const g2 = clock(0.3); while (g2()) { await frame(); me.hp = D.ST.hp; }
    return { started: true, weak, maxLit, shownAt, fr: Th.fr, flares: M.stat.flares - s0.flares, hit: M.stat.flareHit - s0.flareHit, miss: M.stat.flareMiss - s0.flareMiss, cracks: M.stat.cracks - s0.cracks };`, where);
  await place(1.5, 5); w = await force('theft', 0); console.log('  wind-up', w);
  await until("M.th && M.th.state === 'drink' && M.th.age - M.th.t0 > 0.3", 4);
  let rt = await ratio('shell'); console.log('  shell', JSON.stringify(rt)); ok(rt.weak && rt.viaW >= rt.body * 1.8, `${id}: Hue Theft: while it drinks, the shell is a weak point (${rt.viaW} vs ${rt.body})`);
  const thShot = until('M.th && M.th.lit >= 3', 5), thShot2 = thShot.then(() => until('M.th && M.th.lit >= 5 && M.th.age - M.th.t5 > 0.3', 5));
  let th = theft('in'); await thShot; await shot(id + '-theft'); await thShot2; await shot(id + '-theft-flare'); th = await th; console.log('  theft in', JSON.stringify(th));
  ok(th.started && th.maxLit === 6 && th.shownAt === 5 && th.flares === 1 && th.cracks === 0, `${id}: left alone, its six facets light one by one and it flares (circle shown from the fifth)`);
  ok(th.hit === 1 && th.miss === 0, `${id}: inside the flare's circle (r ${th.fr} m), the flare strikes`);
  await settle(); await place(1.5, 5); w = await force('theft', 0);
  th = await theft('out'); console.log('  theft out', JSON.stringify(th)); ok(th.started && th.flares === 1 && th.hit === 0 && th.miss === 1, `${id}: clear of the circle, the flare misses`);
  await settle(); await place(1.5, 5); w = await force('theft', 0);
  let ck = await ev(`const ban = new Set(); let go = clock(6); while (go() && !(M.th && M.th.state === 'drink' && M.th.lit >= 2)) { await frame(); me.hp = D.ST.hp; }
    const s0 = { ...M.stat }, need = M.th ? M.th.need : 0; let n = 0; go = clock(5); while (go() && b.act === 'theft') { await frame(); me.hp = D.ST.hp; const wk = D.FD.S.weak.shell; if (wk && !wk.dead && n < 20) { D.hitMon(wk, 5, { flat: true }); n++; } }
    const g2 = clock(0.3); while (g2()) { await frame(); me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
    return { need, n, cracks: M.stat.cracks - s0.cracks, flares: M.stat.flares - s0.flares, stun: +b.stunT.toFixed(1), kind: M.stunKind, banners: [...ban], heart: !!(D.FD.S.weak.heart && !D.FD.S.weak.heart.dead), shellWeak: !!(D.FD.S.weak.shell && !D.FD.S.weak.shell.dead), heartK: +M.heart.toFixed(2) };`);
  console.log('  crack', JSON.stringify(ck)); ok(ck.cracks === 1 && ck.n === ck.need && ck.flares === 0 && ck.stun > 3 && ck.kind === 'cracked' && ck.heart && !ck.shellWeak && ck.banners.includes('CRACKED!'), `${id}: ${ck.need} blows on the shell CRACK it: it reels (${ck.stun} s), its heart bared, no flare`);
  await ev(`hold(b.x + 1.2, b.y + 6);`); await run(0.25); await shot(id + '-cracked');
  rt = await ratio('heart'); console.log('  heart', JSON.stringify(rt)); ok(rt.weak && rt.viaW >= rt.body * 2.4, `${id}: cracked, the heart takes ${rt.viaW} where the body takes ${rt.body}`);
  await ev(`b.stunT = 0;`); await settle();
  r = await ev(`await (async () => { const go = clock(1); while (go()) await frame(); })(); return { heart: !!(D.FD.S.weak.heart && !D.FD.S.weak.heart.dead) };`); ok(!r.heart, `${id}: the shell knits shut: no heart once it recovers`);

  // ---- the Brood: half health; hidden in its shell, out of reach, thirty greylings, six at most; cleared, EXPOSED ----
  const ub = await ev(`const ban = new Set(); b.stunT = 0; b.hp = b.maxhp * 0.45;
    const go = clock(8); while (go() && !(b.act === 'brood' && M.br && M.br.spawned >= 4)) { await frame(); me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
    const under = !!b.under, hp0 = b.hp; D.hitMon(b, 1e6, { flat: true }); const struck = Math.round(hp0 - b.hp);
    return { phase: D.FD.S.phase, act: b.act, under, struck, banners: [...ban], hide: +M.hide.toFixed(2), parts: Object.values(D.FD.S.partsMap || {}).filter(o => o && !o.dead).length, home: +Math.hypot(b.x - M.home.x, b.y - M.home.y).toFixed(2) };`);
  console.log('  brood', JSON.stringify(ub)); ok(ub.phase === 2 && ub.act === 'brood' && ub.under && ub.struck === 0 && ub.parts === 0 && ub.banners.includes('THE BROOD') && ub.hide > 0.8 && ub.home < 1.2, `${id}: half health: THE BROOD: it hides in its shell in its hollow, out of reach`);
  await ev(`hold(b.x + 1.5, b.y + 6.5);`); await run(0.8); await shot(id + '-brood');
  const sw = await ev(`const ban = new Set(), types = new Set(), counts = []; let killed = 0, maxLive = 0, underAll = true, hits = 0; const go = clock(80);
    while (go() && b.act === 'brood') { await frame(); if (b.act !== 'brood') { counts.push(0); break; } me.hp = D.ST.hp; me.mp = 999; D.banners.forEach(x => ban.add(x.s)); const live = D.mons.filter(q => !q.dead && q.horde); maxLive = Math.max(maxLive, live.length); live.forEach(q => types.add(q.type)); if (!b.under) underAll = false;
      if (M.br) { const left = M.br.total - M.br.killed; if (!counts.length || counts[counts.length - 1] !== left) counts.push(left); }
      if (Math.random() < 0.1) { const hp0 = b.hp; D.hitMon(b, 1000, { flat: true }); if (b.hp < hp0) hits++; }
      if (Math.random() < 0.12) { const q = live[0]; if (q) { D.hitMon(q, 1e9, { flat: true }); killed++; } } }
    const g2 = clock(0.5); while (g2()) { await frame(); me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
    const mono = counts.every((c, i) => !i || c < counts[i - 1]);
    return { act: b.act, stun: +b.stunT.toFixed(1), kind: M.stunKind, poured: M.stat.poured, killedStat: M.stat.killed, killed, maxLive, types: [...types], banners: [...ban], under: !!b.under, underAll, hits, heart: !!(D.FD.S.weak.heart && !D.FD.S.weak.heart.dead), first: counts[0], last: counts[counts.length - 1], steps: counts.length, mono };`);
  console.log('  swarm', JSON.stringify(sw));
  ok(sw.types.length === 1 && sw.types[0] === 'greyling' && sw.killedStat === 30 && sw.maxLive >= 3 && sw.maxLive <= 6, `${id}: the brood bursts up out of the sand (${sw.killedStat} cleared, up to ${sw.maxLive} at once: ${sw.types.join(', ')})`);
  ok(sw.underAll && sw.hits === 0, `${id}: hidden the whole time: no blow lands on it`);
  ok(sw.first === 30 && sw.last === 0 && sw.mono && sw.steps >= 20, `${id}: its counter runs down from ${sw.first} to ${sw.last}`);
  ok(sw.kind === 'exposed' && sw.stun > 5 && sw.heart && !sw.under && sw.banners.includes('EXPOSED!'), `${id}: the brood cleared: EXPOSED (${sw.stun} s), its heart bare`);
  rt = await ratio('heart'); console.log('  exposed', JSON.stringify(rt)); ok(rt.weak && rt.viaW >= rt.body * 2.5, `${id}: exposed, the heart takes ${rt.viaW} where the body takes ${rt.body}`);
  await ev(`hold(b.x + 1.2, b.y + 6);`); await run(0.3); await shot(id + '-exposed');
  await ev(`b.stunT = 0;`); await run(1.2);

  // ---- phase two: the cycle, two snips, five beams, greylings crawling out now and then ----
  await settle();
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const q of D.mons) if (!q.dead && !q.boss && !q.fobj) q.dead = true; });
  await place(-1.5, 6); w = await force('crush', 0); cr = await crush('out', 'off'); console.log('  crush p2', JSON.stringify(cr));
  ok(cr.started && cr.snips === 2 && cr.snipHit === 0 && cr.lines.length === 2, `${id}: in phase two the small claw snips twice`);
  await settle(); await place(1.5, 6); w = await force('beams', 0); bm = await beams('gap'); console.log('  beams p2', JSON.stringify(bm)); ok(bm.n === 5 && bm.hit === 0, `${id}: in phase two, five beams a volley (and still gaps to stand in)`);
  await settle(); await place(1.5, 6); w = await force('beams', 0); await until("M.bm && M.bm.state === 'fire' && M.bm.age - M.bm.t1 > 0.06", 6); await shot(id + '-beams-p2'); await settle();
  await idleShots('-p2');
  acts = await cycle(WANT_B, 90);
  console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners), 'maxRim', acts.maxRim); ok(WANT_B.every(w => acts.acts.includes(w)), `${id}: phase two's act cycle (${acts.acts.join(', ')})`);
  const mins = await ev(`const seen = new Set(); const go = clock(40); while (go()) { await frame(); me.hp = D.ST.hp; me.mp = 999; b.stunT = 0; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && !m.horde && m.type === 'greyling') seen.add(m.type); if (seen.size) break; } return [...seen];`);
  console.log('  minions', JSON.stringify(mins)); ok(mins.length === 1, `${id}: greylings crawl out of the sand in phase two`);
  await run(0.6); await shot(id + '-greylings-p2');
  await run(1);
  ok(errors.length === 0, `${id}: no page errors (${errors.length})`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  // the kill (a section boss: it ends the stage without sealing the rift)
  const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.colours }; });
  console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); ok(!kill.sealed, `${id}: no sealing (a section boss)`);
  await page.waitForTimeout(400);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
