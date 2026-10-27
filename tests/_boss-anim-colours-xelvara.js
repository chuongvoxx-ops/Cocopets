// The Sea of Fallen Colours' second boss, animated: Xelvara the Comet Brood run through its wake, a full act cycle, a
// hit, its mechanics (Rim Pulse: its rim segments draw in (the tell), then snap open and a shockwave ring rolls out: a
// pet standing in its way is struck, one in a shown GAP or rolling through comes through; Fragment Volleys: the fragment
// that brightens names the attack (AMBER: comet shards on shown circles, CYAN: beams along shown lines from the bell,
// WHITE: a slow star orb that hunts the pet and bursts on its circle), each struck inside and missed outside; the bright
// fragment is a weak point, and enough blows OVERLOAD it: the volley is spent and it sinks, staggered; Tentacle Slam: two
// tentacles slam shown lanes, striking a pet in one and missing one beside them), the damage windows (the bell sunk low,
// the four tentacles RESTING ON THE FLOOR, their tips weak points ×2 and the core ×2.5), its drift back to the island's
// middle, the Comet Brood (half health: sealed out of reach, thirty hatchlings, six at most at once, a counter running
// down; cleared, it is EXPOSED), phases two and three, its minions, and the kill (a section boss: it ends its stage
// without sealing the rift), with no page errors; screenshots (SHOTS=1) into shots/anim-colours-xelvara*.png.
// Waits are counted in game time (D.g.t), with a generous wall-clock cap, so a loaded machine only makes it slower.
// usage: node tests/_boss-anim-colours-xelvara.js   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const id = 'xelvara', IDLE = 'drift', STAGE = 5;
// in-page helpers: a frame, and a game-time clock with a wall-clock cap (x4)
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, me = D.me, C = FX.C, W = () => D.FD.S.weak;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 4000; };
  const hold = () => { me.hp = D.ST.hp; me.mp = 999; };
  const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
  const live = (o) => !!(o && !o.dead);`;
(async () => {
  const T = await open({ lvl: 92, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-colours-${name}.png`) }); };
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); if (me && !me.dead) hold(); }`, secs);
  // force the next act (taken at the drift's next choice; the boss set back over its spot first)
  const force = (act, col, extra) => ev(`const [act, col, extra] = arg; b.x = M.home.x; b.y = M.home.y; M.nextAct = act; if (col != null) M.nextCol = col; b.stunT = 0; b.act = 'drift'; b.actT = 9; let go = clock(8); while (go() && b.act !== act) { await frame(); hold(); b.stunT = 0; if (b.act === 'drift') { M.nextAct = act; if (col != null) M.nextCol = col; b.actT = 9; } } go = clock(extra); while (go()) { await frame(); hold(); } return b.act;`, [act, col == null ? null : col, extra || 0]);
  const until = (cond, secs) => ev(`const f = new Function('D', 'b', 'M', 'me', 'return ' + arg[0]); const go = clock(arg[1]); while (go()) { if (f(D, b, M, me)) return true; await frame(); hold(); } return false;`, [cond, secs]);
  const settle = () => ev(`const go = clock(12); while (go() && (M.rp || M.fv || M.ts || M.waves.length || M.orb || M.beams.length || b.act !== 'drift' || b.stunT > 0 || M.rest > 0.05 || D.FD.S.tele.length)) { await frame(); hold(); b.stunT = 0; } return b.act;`);
  // the pet placed relative to the boss's ground point (kept on the island)
  const place = (dx, dy) => ev(`const [dx, dy] = arg; let x = b.x + dx, y = b.y + dy; const d = Math.hypot(x - C.x, y - C.y); if (d > C.R - 1.5) { x = C.x + (x - C.x) / d * (C.R - 1.5); y = C.y + (y - C.y) / d * (C.R - 1.5); } pin(x, y);`, [dx, dy]);
  const idx = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID; return R && R.colours ? R.colours.stages.findIndex(s => s.boss === 'xelvara') : -1; });
  ok(idx === STAGE, `${id}: stage ${idx}`); if (idx < 0) { await T.browser.close(); process.exit(1); }
  const stg = await page.evaluate(i => { const s = window.__pp.RIFT_BY_ID.colours.stages[i]; return { bossName: s.goal, bossRoom: s.name, kind: s.kind, seal: s.seal }; }, idx);
  ok(stg.kind === 'boss' && stg.bossName === 'Xelvara, the Comet Brood' && stg.bossRoom === 'The Refracting Lagoon', `${id}: the stage names it (${stg.bossName}, ${stg.bossRoom})`);
  await T.start('colours', idx);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal, biome: D.F.biome }; });
  console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === 'Xelvara' && r.bars > 10 && r.phases === 3 && r.biome === 'prismreef', `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases, ${r.biome})`);
  ok(!r.seal, `${id}: a section boss (its kill does not seal the rift)`);
  // the wake and the intro: it comes down out of the light over the island's middle
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x + 1; D.me.y = b.y + 7; });
  await run(0.6); await shot('xelvara-intro'); await run(1.6); await shot('xelvara-intro-land');
  await run(4.2);
  r = await ev(`return { act: b.act, fd: !!D.FD, alt: +M.alt.toFixed(2) };`); console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter' && Math.abs(r.alt - 3.7) < 0.6, `${id}: awake and hovering (${r.act}, ${r.alt} m up)`);
  // the Refracting Lagoon: some 29 m of glass sand, reef props round its rim, its spot near the heart
  r = await ev(`const S = D.FD.S; return { R: S.C.R, props: S.props.length, kinds: [...new Set(S.props.map(p => p.kind))], home: +Math.hypot(M.home.x - C.x, M.home.y - C.y).toFixed(1), x: +Math.hypot(b.x - C.x, b.y - C.y).toFixed(1) };`);
  console.log('  arena', JSON.stringify(r)); ok(r.R > 13.5 && r.R < 15.5 && r.props >= 16 && r.kinds.length >= 4 && r.home < 2 && r.x < 3, `${id}: the Refracting Lagoon (${(r.R * 2).toFixed(1)} m, ${r.props} reef props: ${r.kinds.join(', ')}), it hovers near the middle`);
  // the act cycle: the pet kept close
  const cycle = (want, secs) => ev(`const [want, secs] = arg, seen = new Set(), ban = new Set(); let maxOff = 0; const go = clock(secs); while (go()) { await frame(); hold(); if (b.stunT > 0) b.stunT = 0; if (b.hp < b.maxhp * 0.55 && D.FD.S.phase < 2) b.hp = b.maxhp * 0.8;
      if (Math.hypot(me.x - b.x, me.y - b.y) > 9 && !b.under) { pin(b.x + 2.0, b.y + 5.5); }
      maxOff = Math.max(maxOff, Math.hypot(b.x - C.x, b.y - C.y)); seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban], maxOff: +maxOff.toFixed(2) };`, [want, secs]);
  let acts = await cycle(['pulse', 'volley', 'slam'], 90);
  console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners), 'maxOff', acts.maxOff); ok(['pulse', 'volley', 'slam'].every(w => acts.acts.includes(w)), `${id}: the act cycle (${acts.acts.join(', ')})`);
  ok(acts.banners.length >= 3 && acts.banners.includes('RIM PULSE') && acts.banners.includes('TENTACLE SLAM'), `${id}: the attacks are named in banners`);
  ok(acts.maxOff < 4, `${id}: it keeps near the island's middle (at most ${acts.maxOff} m off)`);
  await settle();
  // two shots 0.4 s apart while it drifts (its pose should change between them)
  const idleShots = async tag => { await ev(`const go = clock(6); const g0 = D.g.t; while (go() && !(b.act === 'drift' && b.actT > 0.4 && D.g.t - g0 > 1.5)) { await frame(); hold(); if (b.act === 'drift') b.actT = Math.min(b.actT, 0.5); }`);
    const near = () => ev(`D.g.taps = 4; b.actT = Math.min(b.actT, 0.3); pin(b.x + 1.4, b.y + 6.4);`);
    await near(); await run(0.05); await shot('xelvara' + tag); await run(0.35); await near(); await run(0.05); await shot('xelvara' + tag + '-b'); };
  await idleShots('');
  await page.evaluate(() => { window.__pp.arc.game._dbg.g.taps = 0; });
  // the swim: between acts its rim draws in and snaps open over and over, and the fragments circle
  r = await ev(`let lo = 9, hi = -9; const f0 = M.fo; const go = clock(3); while (go()) { await frame(); hold(); b.actT = Math.min(b.actT, 0.3); lo = Math.min(lo, M.c); hi = Math.max(hi, M.c); } return { lo: +lo.toFixed(2), hi: +hi.toFixed(2), turned: +(M.fo - f0).toFixed(2) };`);
  console.log('  swim', JSON.stringify(r)); ok(r.hi > 0.3 && r.lo < -0.3 && r.turned > 1.5, `${id}: it swims: the rim draws in (${r.hi}) and snaps open (${r.lo}), the fragments circle`);
  // its spot: set down out by the rim, it swims back toward the middle before it acts
  const rim = await ev(`await (async () => { const go = clock(9); while (go() && (b.act !== 'drift' || b.stunT > 0)) { await frame(); hold(); b.stunT = 0; } })();
    const a = Math.PI * 0.25; b.x = C.x + Math.cos(a) * C.R * 0.72; b.y = C.y + Math.sin(a) * C.R * 0.72; b.actT = 9; pin(C.x - 4, C.y + 5); let actedFar = false, back = false; const s0 = M.stat.homeDrifts; const go = clock(10);
    while (go()) { await frame(); hold(); b.stunT = 0; if (b.act !== 'drift' && Math.hypot(b.x - M.home.x, b.y - M.home.y) > 2.6) actedFar = true; if (b.act !== 'drift') { back = true; break; } }
    return { actedFar, back, drifts: M.stat.homeDrifts - s0, d: +Math.hypot(b.x - M.home.x, b.y - M.home.y).toFixed(2) };`);
  console.log('  rim', JSON.stringify(rim)); ok(rim.back && !rim.actedFar && rim.drifts === 1 && rim.d < 2.5, `${id}: set out by the rim, it swims back over its spot (${rim.d} m) before it acts`);
  await settle();

  // ---- Rim Pulse: the segments draw in (the tell), then snap open; a ring rolls out with three gaps ----
  const pulse = mode => ev(`const mode = arg; let go = clock(6); while (go() && !(M.rp && M.rp.state === 'draw')) { await frame(); hold(); }
    const R = M.rp; if (!R) return { started: false }; const s0 = { ...M.stat }, d0 = 6.5; let a = Math.atan2(me.y - b.y, me.x - b.x); const gaps = R.gaps.slice();
    if (mode === 'gap') { a = gaps.reduce((p, g) => Math.abs(((g - a + 9 * Math.PI) % (2 * Math.PI)) - Math.PI) < Math.abs(((p - a + 9 * Math.PI) % (2 * Math.PI)) - Math.PI) ? g : p, gaps[0]); }
    const px = b.x + Math.cos(a) * d0, py = b.y + Math.sin(a) * d0, inGap0 = gaps.some(g => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) < 0.17); let maxC = -9, minC = 9, snapped = false, glowSegs = false;
    go = clock(8); while (go() && (M.rp === R || M.waves.length)) { await frame(); hold(); pin(px, py); if (R.state === 'draw') maxC = Math.max(maxC, M.c); if (R.state !== 'draw') { snapped = true; minC = Math.min(minC, M.c); }
      const w = M.waves[0]; if (mode === 'roll' && w && Math.abs(Math.hypot(me.x - w.x, me.y - w.y) - w.r) < 0.8 && !me.dodge) me.dodge = { t: 0, dur: 0.3, vx: 0, vy: 0, perf: false }; }
    return { started: true, n: R.n, gaps: gaps.length, inGap0, maxC: +maxC.toFixed(2), minC: +minC.toFixed(2), snapped, waves: M.stat.waves - s0.waves, hit: M.stat.waveHit - s0.waveHit, pass: M.stat.wavePass - s0.wavePass, gap: M.stat.waveGap - s0.waveGap, roll: M.stat.waveRoll - s0.waveRoll };`, mode);
  await place(0.6, 6.5); let w = await force('pulse'); console.log('  wind-up', w);
  const pdShot = until("M.rp && M.rp.state === 'draw' && M.rp.t > M.rp.dur * 0.7", 4);
  let pl = pulse('stand'); await pdShot; await shot('xelvara-pulse-draw'); pl = await pl; console.log('  pulse stand', JSON.stringify(pl));
  ok(pl.started && pl.maxC > 0.85 && pl.snapped && pl.minC < -0.5, `${id}: Rim Pulse: its segments draw in (${pl.maxC}) as the tell, then snap open (${pl.minC})`);
  ok(pl.gaps === 3 && !pl.inGap0 && pl.waves === 1 && pl.hit === 1 && pl.pass === 0, `${id}: the shockwave ring strikes a pet standing in its way (out of its ${pl.gaps} gaps)`);
  await settle(); await place(0.6, 6.5); w = await force('pulse');
  pl = await pulse('gap'); console.log('  pulse gap', JSON.stringify(pl)); ok(pl.started && pl.hit === 0 && pl.gap === 1 && pl.pass === 1, `${id}: standing in a shown GAP, the ring passes by`);
  await settle(); await place(0.6, 6.5); w = await force('pulse');
  pl = await pulse('roll'); console.log('  pulse roll', JSON.stringify(pl)); ok(pl.started && pl.hit === 0 && pl.roll === 1, `${id}: rolling through the ring, the pet comes through unharmed`);
  await settle(); await place(0.6, 6.5); w = await force('pulse'); await until('M.waves[0] && M.waves[0].r > 5', 4); await shot('xelvara-pulse-ring'); await settle();
  // a hit
  await ev(`b.x = M.home.x; b.y = M.home.y; pin(b.x + 1, b.y + 6); D.hitMon(b, 1000, { flat: true, viaProxy: true });`); await run(0.1); await shot('xelvara-hit'); await run(0.8);

  // ---- Fragment Volleys: the colour that brightens names the attack ----
  const volley = (col, mode) => ev(`const [col, mode] = arg; let go = clock(6); while (go() && !(M.fv && M.fv.state !== 'end' && (M.fv.t > 0.4 || M.fv.state === 'fire'))) { await frame(); hold(); }
    const V = M.fv; if (!V) return { started: false }; const ban = new Set(); D.banners.forEach(x => ban.add(x.s)); const br = M.br.map(v => +v.toFixed(2)), wk = W().frag, wkAt = wk ? [wk.x, wk.y] : null, fq = D.FD.FX.mem, s0 = JSON.parse(JSON.stringify(M.stat));
    const x0 = me.x, y0 = me.y; let kinds = null, spot = null, orbD0 = null, orbD1 = null, orbMoved = 0;
    go = clock(12); while (go() && M.fv === V && V.state !== 'end') { await frame(); hold();
      const tl = D.FD.S.tele.filter(s => V.teles.includes(s)); if (tl.length && !kinds) kinds = tl.map(s => s.kind);
      if (mode === 'in') pin(x0, y0);
      else if (col === 0) { if (!spot && tl.length) { for (let d = 1.5; d < 10 && !spot; d += 0.5) for (let k = 0; k < 16 && !spot; k++) { const a = k / 16 * Math.PI * 2, x = x0 + Math.cos(a) * d, y = y0 + Math.sin(a) * d; if (FX.inArena(x, y, 1.5) && tl.every(s => Math.hypot(x - s.x, y - s.y) > s.r + 1.2)) spot = { x, y }; } } pin(spot ? spot.x : x0, spot ? spot.y : y0); }
      else if (col === 1) { if (!spot && tl.length) { const a = tl[0].a + 0.4, d = Math.hypot(x0 - b.x, y0 - b.y); spot = { x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d }; } pin(spot ? spot.x : x0, spot ? spot.y : y0); }
      else if (col === 2) { const O = M.orb; if (O) { if (orbD0 == null) orbD0 = Math.hypot(O.x - x0, O.y - y0); if (O.state === 'hunt') { const a = Math.atan2(me.y - O.y, me.x - O.x), q = FX.clampArena({ x: O.x + Math.cos(a) * 5.5, y: O.y + Math.sin(a) * 5.5 }, 1.5); if (Math.hypot(q.x - O.x, q.y - O.y) < 4.5) { q.x = O.x - Math.cos(a) * 5.5; q.y = O.y - Math.sin(a) * 5.5; } pin(q.x, q.y); } else pin(me.x, me.y); } } }
    if (col === 2 && mode === 'in') orbD1 = 0;
    const g2 = clock(0.4); while (g2()) { await frame(); hold(); }
    const st = M.stat, d = k => st[k] - s0[k];
    return { started: true, i: V.i, need: V.need, banners: [...ban], br, weak: !!wkAt, kinds, cometHit: d('cometHit'), cometMiss: d('cometMiss'), beamHit: d('beamHit'), beamMiss: d('beamMiss'), orbHit: d('orbHit'), orbMiss: d('orbMiss'), orbTouch: d('orbTouch'), orbs: d('orbs'), orbD0: orbD0 == null ? null : +orbD0.toFixed(1) };`, [col, mode]);
  const LABEL = ['AMBER · COMET SHARDS', 'CYAN · PRISM BEAMS', 'WHITE · STAR ORB'];
  // AMBER: comet shards on circles round the pet
  await settle(); await place(1.0, 6.5); w = await force('volley', 0); console.log('  wind-up', w);
  const amberTell = until('M.fv && M.fv.state === "tell" && M.fv.t > 0.8', 3), amberShot = until('M.fv && M.fv.state === "fire" && D.FD.S.tele.some(s => s.kind === "comet" && s.age > s.t * 0.7)', 6);
  let vl = volley(0, 'in'); await amberTell; await shot('xelvara-amber-tell'); await amberShot; await shot('xelvara-amber-fall'); vl = await vl; console.log('  amber in', JSON.stringify(vl));
  ok(vl.started && vl.i === 0 && vl.banners.includes(LABEL[0]) && vl.br[0] > 0.8 && vl.br[1] < 0.2 && vl.br[2] < 0.2 && vl.weak, `${id}: the AMBER fragment brightens (${vl.br.join('/')}) and is named: "${LABEL[0]}"; it is a weak point`);
  ok(vl.kinds && vl.kinds.length === 5 && vl.kinds.every(k => k === 'comet') && vl.cometHit === 1 && vl.cometMiss === 4, `${id}: amber: ${vl.kinds && vl.kinds.length} comet shards fall on shown circles, the one on the pet strikes it`);
  await settle(); await place(1.0, 6.5); w = await force('volley', 0);
  vl = await volley(0, 'out'); console.log('  amber out', JSON.stringify(vl)); ok(vl.started && vl.cometHit === 0 && vl.cometMiss === 5, `${id}: amber: out of the circles, every comet misses`);
  // CYAN: beams along shown lines from the bell
  await settle(); await place(1.0, 6.5); w = await force('volley', 1);
  const cyanShot = until('M.fv && M.fv.state === "fire" && D.FD.S.tele.some(s => s.kind === "beam" && s.age > s.t * 0.6)', 6), cyanFire = until('M.beams.length && M.beams[0].t > 0.05', 8);
  vl = volley(1, 'in'); await cyanShot; await shot('xelvara-cyan-lines'); await cyanFire; await shot('xelvara-cyan-fire'); vl = await vl; console.log('  cyan on', JSON.stringify(vl));
  ok(vl.started && vl.i === 1 && vl.banners.includes(LABEL[1]) && vl.br[1] > 0.8 && vl.br[0] < 0.2 && vl.weak, `${id}: the CYAN fragment brightens and is named: "${LABEL[1]}"`);
  ok(vl.kinds && vl.kinds.length === 3 && vl.kinds.every(k => k === 'beam') && vl.beamHit === 1 && vl.beamMiss === 2, `${id}: cyan: ${vl.kinds && vl.kinds.length} beams along shown lines from the bell, the one through the pet strikes it`);
  await settle(); await place(1.0, 6.5); w = await force('volley', 1);
  vl = await volley(1, 'out'); console.log('  cyan between', JSON.stringify(vl)); ok(vl.started && vl.beamHit === 0 && vl.beamMiss === 3, `${id}: cyan: between the lines, every beam misses`);
  // WHITE: a slow star orb that hunts the pet, then bursts on its circle
  await settle(); await place(1.0, 6.5); w = await force('volley', 2);
  const whiteShot = until('M.orb && M.orb.state === "hunt" && M.orb.t > 1.6', 6), whiteLock = until('M.orb && M.orb.state === "lock" && M.orb.lockT > 0.6', 10);
  vl = volley(2, 'in'); await whiteShot; await shot('xelvara-white-orb'); await whiteLock; await shot('xelvara-white-lock'); vl = await vl; console.log('  white still', JSON.stringify(vl));
  ok(vl.started && vl.i === 2 && vl.banners.includes(LABEL[2]) && vl.br[2] > 0.8 && vl.br[0] < 0.2 && vl.weak, `${id}: the WHITE fragment brightens and is named: "${LABEL[2]}"`);
  ok(vl.orbs === 1 && vl.orbTouch >= 1 && vl.orbHit === 1 && vl.orbMiss === 0, `${id}: white: the orb hunts down a pet that stands still (it stings ${vl.orbTouch}x) and its burst strikes it`);
  await settle(); await place(1.0, 6.5); w = await force('volley', 2);
  vl = await volley(2, 'out'); console.log('  white away', JSON.stringify(vl)); ok(vl.started && vl.orbTouch === 0 && vl.orbHit === 0 && vl.orbMiss === 1, `${id}: white: kept clear of the orb and out of its circle, the burst misses`);

  // ---- the stagger: enough blows on the bright fragment OVERLOAD it; it sinks, its tentacles on the floor ----
  await settle(); await place(1.0, 6.5); w = await force('volley', 0);
  await until('M.fv && M.fv.state === "tell" && M.fv.t > 0.5', 3);
  let ov = await ev(`const s0 = { ...M.stat }, ban = new Set(), V = M.fv, need = V ? V.need : 0, x0 = me.x, y0 = me.y; let n = 0; const go = clock(6); while (go() && b.act === 'volley') { await frame(); hold(); pin(x0, y0); const wk = W().frag; if (live(wk) && n < 20) { D.hitMon(wk, 5, { flat: true }); n++; } }
    const g2 = clock(0.9); while (g2()) { await frame(); hold(); pin(x0, y0); D.banners.forEach(x => ban.add(x.s)); }
    const tips = [0, 1, 2, 3].map(i => W()['tip' + i]).filter(live), core = W().core;
    return { need, n, overloads: M.stat.overloads - s0.overloads, cometHit: M.stat.cometHit - s0.cometHit, comets: D.FD.S.tele.filter(s => s.kind === 'comet' && !s.done).length, stun: +b.stunT.toFixed(1), kind: M.stunKind, banners: [...ban], rest: +M.rest.toFixed(2), alt: +M.alt.toFixed(2), tips: tips.length, tipD: tips.map(t => +Math.hypot(t.x - b.x, t.y - b.y).toFixed(1)), tipIn: tips.every(t => FX.inArena(t.x, t.y, 0.3)), core: live(core), frag: live(W().frag), under: !!b.under };`);
  console.log('  overload', JSON.stringify(ov));
  ok(ov.overloads === 1 && ov.n === ov.need && ov.cometHit === 0 && ov.comets === 0 && ov.kind === 'overload' && ov.stun > 3.5 && ov.banners.includes('OVERLOADED!') && !ov.frag, `${id}: ${ov.need} blows on the bright fragment OVERLOAD it: its volley is spent (no comet falls), it is staggered (${ov.stun} s)`);
  ok(ov.rest > 0.85 && ov.alt < 2.2 && ov.tips === 4 && ov.tipD.every(d => d > 4.3 && d < 5.8) && ov.tipIn && ov.core && !ov.under, `${id}: the damage window: the bell sinks (${ov.alt} m), its four tentacles rest on the floor (tips ${ov.tipD.join('/')} m out), tips and core are weak points`);
  let dmg = await ev(`const out = {}; const t0 = W().tip0, cr = W().core; if (live(t0)) { let h0 = b.hp; D.hitMon(t0, 1000, { flat: true }); out.tip = Math.round(h0 - b.hp); } if (live(cr)) { let h0 = b.hp; D.hitMon(cr, 1000, { flat: true }); out.core = Math.round(h0 - b.hp); } let h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); return out;`);
  console.log('  window', JSON.stringify(dmg)); ok(dmg.tip >= dmg.body * 1.9 && dmg.core >= dmg.body * 2.4, `${id}: a tentacle tip takes ${dmg.tip}, the core ${dmg.core}, the bell ${dmg.body}`);
  await ev(`pin(b.x + 1.5, b.y + 6.8);`); await run(0.2); await shot('xelvara-overload'); await run(0.5); await shot('xelvara-overload-b');
  r = await ev(`const go = clock(8); while (go() && b.stunT > 0) { await frame(); hold(); } const g2 = clock(1.2); while (g2()) { await frame(); hold(); } return { stun: b.stunT, tips: [0, 1, 2, 3].filter(i => live(W()['tip' + i])).length, core: live(W().core), rest: +M.rest.toFixed(2), alt: +M.alt.toFixed(2) };`);
  console.log('  risen', JSON.stringify(r)); ok(r.tips === 0 && !r.core && r.rest < 0.2 && r.alt > 2.8, `${id}: the window closes: it rises again (${r.alt} m), the weak points gone`);
  await settle();

  // ---- Tentacle Slam: two tentacles rear up and slam shown lanes ----
  const slam = mode => ev(`const mode = arg; let go = clock(6); while (go() && !(M.ts && M.ts.cur && M.ts.cur.lanes.length === 2)) { await frame(); hold(); }
    const S = M.ts; if (!S || !S.cur) return { started: false }; const s0 = { ...M.stat }, L = S.cur.lanes, x0 = me.x, y0 = me.y, d0 = Math.hypot(x0 - b.x, y0 - b.y);
    const sd = Math.sign(Math.atan2(Math.sin(L[1].a - L[0].a), Math.cos(L[1].a - L[0].a))) || 1, a = L[0].a - sd * 0.55, px = mode === 'off' ? b.x + Math.cos(a) * d0 : x0, py = mode === 'off' ? b.y + Math.sin(a) * d0 : y0;
    const reared = new Set(), lay = []; let lie = 0; go = clock(8); while (go() && M.ts === S && S.wave < 1) { await frame(); hold(); pin(px, py); L.forEach(l => { const t = M.tent[l.i]; if (t && t.st === 'lift' && t.k > 0.9) reared.add(l.i); if (t && t.st === 'lie') { lie++; if (!lay.includes(l.i)) lay.push(l.i); } }); }
    return { started: true, lanes: L.length, through: Math.abs(Math.atan2(Math.sin(L[0].a - Math.atan2(y0 - b.y, x0 - b.x)), Math.cos(L[0].a - Math.atan2(y0 - b.y, x0 - b.x)))) < 0.05, two: L[0].i !== L[1].i, reared: reared.size, lay: lay.length, hit: M.stat.slamHit - s0.slamHit, miss: M.stat.slamMiss - s0.slamMiss };`, mode);
  await place(1.0, 6.5); w = await force('slam'); console.log('  wind-up', w);
  await until('M.ts && M.ts.cur && M.ts.cur.t > M.ts.cur.rise + 0.4', 4); await shot('xelvara-slam-lanes');
  const slamLie = until('M.tent.some(t => t && t.st === "lie" && t.t > 0.15)', 6);
  let sl = slam('on'); await slamLie; await shot('xelvara-slam-lie'); sl = await sl; console.log('  slam on', JSON.stringify(sl));
  ok(sl.started && sl.lanes === 2 && sl.two && sl.through && sl.reared === 2 && sl.lay === 2, `${id}: Tentacle Slam: two tentacles rear up and slam down along their 2 lanes, one through the pet`);
  ok(sl.hit === 1 && sl.miss === 1, `${id}: a pet in a lane is struck`);
  await settle(); await place(1.0, 6.5); w = await force('slam');
  sl = await slam('off'); console.log('  slam off', JSON.stringify(sl)); ok(sl.started && sl.hit === 0 && sl.miss === 2, `${id}: stepped out of the lanes, both slams miss`);
  await settle();

  // ---- the Comet Brood: half health; sealed out of reach, it births thirty hatchlings; cleared, EXPOSED ----
  const bd = await ev(`const ban = new Set(); b.stunT = 0; b.hp = b.maxhp * 0.45;
    const go = clock(9); while (go() && !(b.act === 'brood' && M.bd && M.bd.spawned >= 4)) { await frame(); hold(); D.banners.forEach(x => ban.add(x.s)); }
    const under = !!b.under, hp0 = b.hp; D.hitMon(b, 1e6, { flat: true }); const struck = Math.round(hp0 - b.hp);
    return { phase: D.FD.S.phase, act: b.act, under, struck, banners: [...ban], seal: +M.seal.toFixed(2), c: +M.c.toFixed(2), alt: +M.alt.toFixed(2), parts: Object.values(D.FD.S.partsMap || {}).filter(o => o && !o.dead).length };`);
  console.log('  brood', JSON.stringify(bd)); ok(bd.phase === 2 && bd.act === 'brood' && bd.under && bd.struck === 0 && bd.parts === 0 && bd.banners.includes('THE COMET BROOD') && bd.seal > 0.8 && bd.c > 0.8, `${id}: half health: THE COMET BROOD: it rises (${bd.alt} m) and seals itself in its bell, out of reach`);
  await ev(`pin(b.x + 1.5, b.y + 6.5);`); await run(0.8); await shot('xelvara-brood');
  const sw = await ev(`const ban = new Set(), types = new Set(), cols = new Set(), counts = []; let maxLive = 0, underAll = true, hits = 0, shotT = 0; const go = clock(75);
    while (go() && b.act === 'brood') { await frame(); if (b.act !== 'brood') break; hold(); D.banners.forEach(x => ban.add(x.s)); const lv = D.mons.filter(q => !q.dead && q.horde); maxLive = Math.max(maxLive, lv.length); lv.forEach(q => { types.add(q.type); cols.add(q.color); }); if (!b.under) underAll = false;
      if (M.bd) { const left = M.bd.total - M.bd.killed; if (!counts.length || counts[counts.length - 1] !== left) counts.push(left); }
      if (Math.random() < 0.1) { const hp0 = b.hp; D.hitMon(b, 1000, { flat: true }); if (b.hp < hp0) hits++; }
      if (Math.random() < 0.12) { const q = lv.find(q => !q.launch); if (q) D.hitMon(q, 1e9, { flat: true }); } }
    // (the last kill exposes it at once: the counter's last step is to nothing left)
    { const left = M.bd ? M.bd.total - M.bd.killed : 30 - M.stat.killed; if (counts[counts.length - 1] !== left) counts.push(left); }
    const g2 = clock(0.6); while (g2()) { await frame(); hold(); D.banners.forEach(x => ban.add(x.s)); }
    const mono = counts.every((c, i) => !i || c < counts[i - 1]);
    return { act: b.act, stun: +b.stunT.toFixed(1), kind: M.stunKind, spawned: M.stat.spawned, killed: M.stat.killed, maxLive, types: [...types], cols: cols.size, banners: [...ban], under: !!b.under, underAll, hits, tips: [0, 1, 2, 3].filter(i => live(W()['tip' + i])).length, core: live(W().core), first: counts[0], last: counts[counts.length - 1], steps: counts.length, mono, rest: +M.rest.toFixed(2) };`);
  console.log('  swarm', JSON.stringify(sw));
  ok(sw.types.length === 1 && sw.types[0] === 'comethatch' && sw.killed === 30 && sw.maxLive >= 3 && sw.maxLive <= 6 && sw.cols === 3, `${id}: the brood arcs out of its rim (${sw.killed} cleared, up to ${sw.maxLive} at once, in ${sw.cols} colours)`);
  ok(sw.underAll && sw.hits === 0, `${id}: sealed the whole time: no blow lands on it`);
  ok(sw.first === 30 && sw.last === 0 && sw.mono && sw.steps >= 20, `${id}: its counter runs down from ${sw.first} to ${sw.last}`);
  ok(sw.kind === 'exposed' && sw.stun > 5 && sw.tips === 4 && sw.core && !sw.under && sw.banners.includes('EXPOSED!'), `${id}: the brood cleared: EXPOSED (${sw.stun} s), its tentacles on the floor, tips and core bare`);
  dmg = await ev(`const out = {}; const t0 = W().tip2, cr = W().core; if (live(t0)) { let h0 = b.hp; D.hitMon(t0, 1000, { flat: true }); out.tip = Math.round(h0 - b.hp); } if (live(cr)) { let h0 = b.hp; D.hitMon(cr, 1000, { flat: true }); out.core = Math.round(h0 - b.hp); } let h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); return out;`);
  console.log('  exposed', JSON.stringify(dmg)); ok(dmg.tip >= dmg.body * 1.9 && dmg.core >= dmg.body * 2.4, `${id}: exposed, a tip takes ${dmg.tip}, the core ${dmg.core}, the bell ${dmg.body}`);
  await ev(`pin(b.x + 1.2, b.y + 6.5);`); await run(0.3); await shot('xelvara-exposed'); await run(2.2); await ev(`pin(b.x + 1.2, b.y + 6.5);`); await run(0.1); await shot('xelvara-exposed-b');
  await ev(`b.stunT = 0;`); await run(1.2);

  // ---- phase two: two pulses, more comets and beams; hatchlings now and then ----
  await settle();
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const q of D.mons) if (!q.dead && !q.boss && !q.fobj) q.dead = true; });
  await place(0.6, 6.5); w = await force('pulse');
  r = await ev(`const s0 = M.stat.waves; const go = clock(12); while (go() && (b.act === 'pulse' || M.waves.length)) { await frame(); hold(); } return { waves: M.stat.waves - s0 };`);
  console.log('  p2 pulse', JSON.stringify(r)); ok(r.waves === 2, `${id}: in phase two the rim pulses twice`);
  await settle(); await place(1.0, 6.5); w = await force('volley', 0);
  r = await ev(`await (async () => { const go = clock(5); while (go() && !(M.fv && M.fv.state === 'fire')) { await frame(); hold(); } })(); return { comets: D.FD.S.tele.filter(s => s.kind === 'comet' && !s.done).length };`); console.log('  p2 amber', JSON.stringify(r)); ok(r.comets === 7, `${id}: in phase two, seven comets`);
  await settle(); await place(1.0, 6.5); w = await force('volley', 1);
  r = await ev(`await (async () => { const go = clock(5); while (go() && !(M.fv && M.fv.state === 'fire')) { await frame(); hold(); } })(); return { beams: D.FD.S.tele.filter(s => s.kind === 'beam' && !s.done).length };`); console.log('  p2 cyan', JSON.stringify(r)); ok(r.beams === 4, `${id}: in phase two, four beams`);
  await settle();
  await idleShots('-p2');
  const mins = await ev(`const seen = new Set(); M.trickleT = Math.min(M.trickleT, 2); const go = clock(40); while (go()) { await frame(); hold(); b.stunT = 0; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && !m.horde && m.type === 'comethatch') seen.add(m.type); if (seen.size) break; } return [...seen];`);
  console.log('  minions', JSON.stringify(mins)); ok(mins.length === 1, `${id}: comet hatchlings arc out now and then in phase two (${mins.join(', ')})`);
  await run(0.8); await shot('xelvara-hatchlings-p2');
  acts = await cycle(['pulse', 'volley', 'slam'], 90); console.log('  acts p2', JSON.stringify(acts.acts)); ok(['pulse', 'volley', 'slam'].every(w => acts.acts.includes(w)) && acts.maxOff < 4, `${id}: phase two's act cycle (${acts.acts.join(', ')})`);
  await settle();

  // ---- phase three, the Comet Storm: two fragments to each volley, two waves of tentacles ----
  r = await ev(`const ban = new Set(); b.stunT = 0; b.hp = b.maxhp * 0.22; const go = clock(5); while (go() && D.FD.S.phase < 3) { await frame(); hold(); } const g2 = clock(2.5); while (g2()) { await frame(); hold(); D.banners.forEach(x => ban.add(x.s)); } return { phase: D.FD.S.phase, lv: D.FD.S.lv, banners: [...ban] };`);
  console.log('  p3', JSON.stringify(r)); ok(r.phase === 3 && r.banners.includes('THE COMET STORM'), `${id}: a quarter health: THE COMET STORM`);
  await settle(); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const q of D.mons) if (!q.dead && !q.boss && !q.fobj) q.dead = true; });
  await place(1.0, 6.5); w = await force('slam');
  r = await ev(`const s0 = M.stat.slams, used = new Set(); const go = clock(14); while (go() && b.act === 'slam') { await frame(); hold(); M.tent.forEach((t, i) => { if (t) used.add(i); }); } return { slams: M.stat.slams - s0, used: used.size };`);
  console.log('  p3 slam', JSON.stringify(r)); ok(r.slams === 4 && r.used === 4, `${id}: in the Comet Storm two tentacles slam, then the other two`);
  await settle(); await place(1.0, 6.5); w = await force('volley', 0);
  r = await ev(`const s0 = M.stat.volleys, cols = new Set(); const go = clock(16); while (go() && b.act === 'volley') { await frame(); hold(); if (M.fv) cols.add(M.fv.i); } return { volleys: M.stat.volleys - s0, cols: [...cols] };`);
  console.log('  p3 volley', JSON.stringify(r)); ok(r.volleys === 1 && r.cols.length === 2, `${id}: in the Comet Storm each volley brightens two fragments in turn (${r.cols.join(', ')})`);
  await settle(); await place(1.0, 6.5); w = await force('volley', 1); await until('M.fv && M.fv.state === "fire" && D.FD.S.tele.some(s => s.kind === "beam" && s.age > s.t * 0.5)', 6); await shot('xelvara-p3-beams');
  await settle();
  const e1 = errors.length; ok(e1 === 0, `${id}: no page errors (${e1})`); if (e1) console.log(errors.slice(0, 6).join('\n'));
  // the kill (a section boss: it ends the stage without sealing the rift)
  const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.colours }; });
  console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); ok(!kill.sealed, `${id}: no sealing (a section boss)`);
  await page.waitForTimeout(400);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
