// (v417 MH) Mercury's Hammer (Earth Strong, 20k2r): its rules, driven frame by frame in the real Tower game.
//   tiers        exact hits a monster ahead: 1 (Base), 2 (Adept), 4 (Celestial); the combo's strikes in the spec's order; the finisher
//                the heaviest strike and the only (and widest) ground impact
//   finisher     its contact and its shockwave are ONE event: a monster in both takes one hit; one in the shockwave only takes one;
//                one outside both takes none
//   dodge        a dodge in a strike's recovery ends the combo there (no later hit); a dodge that is over before the contact does not
//   tracking     the facing turns to the target no faster than TUNE.turn, the step toward a far target stays within its limit, a
//                dead target hands over to the next
//   bosses       a boss takes every strike's damage, its stun cut to a quarter (hitMon's rules), barely moved
//   cleanup      after the combo, on the pet's defeat, on leaving the floor: no fx left, the pet's hooks cleared
//   big dt       the same hits and damage when the game is stepped at 1/60, 1/4 and 1/2 s
// usage: HTML=test-mh.html node tests/_earth-strong-mh.js        (GLFLAGS=__NG_GL,__MH_GL: the GPU path, slow under software GL)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && /Hammer|GLM|GFX|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  const GL = (process.env.GLFLAGS || '').split(',').filter(Boolean);
  await page.addInitScript(fl => { window.__NG_GL = 0; window.__MH_GL = 0; for (const f of fl) window[f] = 1; }, GL);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  const start = async () => { await page.evaluate(() => { const P = window.__pp; try { if (P.arc.state !== 'idle') P.closeArcade(); } catch (e) {} P.quickStart('Hammer'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 900000 }); await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 900000 });
    await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; const G = P.arc.game, D = G._dbg; for (let k = 0; k < 120; k++) G.update(1 / 60);
      // an open place: the pet in the middle of the largest clear square found, the floor's monsters parked far off
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0), me = D.me; let s0 = 777; const rnd = () => { s0 = (s0 * 16807) % 2147483647; return (s0 - 1) / 2147483646; };
      let best = null; for (let k = 0; k < 3000; k++) { const sx = me.x + (rnd() - 0.5) * 50, sy = me.y + (rnd() - 0.5) * 50; if (!W(sx, sy)) continue; let L = 0; while (L < 6 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L) && W(sx, sy + L) && W(sx + L * 0.7, sy + L * 0.7) && W(sx - L * 0.7, sy - L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; }
      window.__HOME = best; me.x = best.x; me.y = best.y;
      // the floor's monsters, kept alive but parked far from it and made harmless; a test brings the ones it needs over
      window.__POOL = D.mons.filter(m => !m.boss && !m.dead && !m.fobj && !m.under && !m.falling);   // (parked where the farthest of them stands: a spot a monster can stand on)
      const far = window.__POOL.filter(m => !m.mv && D.walkAt(Math.floor(m.x), Math.floor(m.y))).sort((p, q) => Math.hypot(q.x - best.x, q.y - best.y) - Math.hypot(p.x - best.x, p.y - best.y))[0]; window.__PARK = { x: far.x, y: far.y };
      for (const m of window.__POOL) Object.assign(m, { x: window.__PARK.x, y: window.__PARK.y, hp: 1e9, maxhp: 1e9, still: true, spd: 0, atkCd: 99, dmg: 0, aggro: false });
      // count every strong hit by monster
      const X = D.ELEM.H.X; if (!X.__mhWrap) { const h0 = X.hitMon; X.hitMon = (m, dmg, o) => { if (o && o.src === 'strong' && window.__MHLOG) { const L = window.__MHLOG; L.push({ id: m.__id, dmg, stun: o.stun, kb: o.kb, t: D.g.t }); } return h0(m, dmg, o); }; X.__mhWrap = true; } }); };
  // a cast: monsters at offsets (tiles from the pet; [dx, dy, opts]), the aim at the first; returns after `secs` of game time stepped at dt
  const run = (o) => page.evaluate(async (o) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; const H0 = window.__HOME;
    me.x = H0.x; me.y = H0.y; me.dead = false; me.hp = D.ST.hp; me.mp = 999; me.dodge = null; me.z = 0; me.hopArmS = null; me.hopLean = 0; me.hopSq = 0; me.hopDX = 0; me.hopDY = 0; me.face = 1; g.cdS = 0; g.dodgeCd = 0; g.intro = 0; g.bossIntro = 0;
    const pool = window.__POOL.filter(m => !m.dead); for (const m of pool) Object.assign(m, { x: window.__PARK.x, y: window.__PARK.y });
    const ms = [];
    o.mons.forEach(([dx, dy, op], i) => { let m; if (op && op.boss) { m = D.lesserBoss(me.x + dx, me.y + dy, 0.5); m.spd = 0; m.atkCd = 99; m.dmg = 0; m.cd = 99; m.x = me.x + dx; m.y = me.y + dy; } else { m = pool[i]; delete m.falling; Object.assign(m, { dead: false, under: false, x: me.x + dx, y: me.y + dy, hp: 1e9, maxhp: 1e9, still: true, spd: 0, atkCd: 99, dmg: 0, stun: 0, kbx: 0, kby: 0, hop: null }); }
      m.__id = 'm' + i; m.__mh = true; m.hp = 1e9; m.maxhp = 1e9; m.stun = 0; ms.push(m); });
    g.stopT = o.stop ? 99 : 0;   // (a boss's own AI held by a time stop)
    for (let k = 0; k < 3; k++) G.update(1 / 60);
    for (const m of ms) { m.__x0 = m.x; m.__y0 = m.y; m.__hp0 = m.hp; m.stun = 0; }
    const pos0 = ms.map(m => [+(m.x - me.x).toFixed(2), +(m.y - me.y).toFixed(2), !!m.dead, !!m.under, m.falling, !!m.fobj, D.walkAt(Math.floor(m.x), Math.floor(m.y)), m.mv, m.type, m.hp]);
    const mv = P.ELEM_LIST.earth.ex_mercuryhammer; D.setKit('strong', Object.assign(P.elemAbility(mv, 'strong', P.st), { star: 5, mult: 1.2, cost: 0, cd: mv.cd, tier: 1, evo: o.evo }));
    window.__MHLOG = []; me.ax = 1; me.ay = 0;
    // (the aim: the game's own aim() takes the nearest monster, else the facing; o.late: monsters that appear only after the cast)
    const late = (o.late || []).map(i => ms[i]); for (const m of late) m.dead = true;
    D.useStrong('strong'); for (const m of late) m.dead = false; const F = D.ELEM.fx.find(f => f.key === 'mercuryhammer'); const cd0 = g.cdS;
    const T0 = g.t, faLog = [], pxy = [me.x, me.y]; let maxStun = {}, killed = false, dodged = false, deadAt = null, exitAt = null;
    let steps = 0; while (steps++ < 4000) { const e = g.t - T0; if (e > o.secs) break;
      if (o.dodgeAtSwing != null && !dodged && F) { const s = F.dbg.swings[o.dodgeAtSwing], go = o.dodgeIn === 'wind' ? F.dbgK() === o.dodgeAtSwing && F.dbgT() > 0.52 : s && s.n > 0; if (go) { dodged = true; me.dodge = null; g.dodgeCd = 0; D.dodge(); } }
      if (o.killAt != null && !killed && F && F.dbgK() === o.killAt && F.dbgPh() === 'swing' && F.dbg.swings[o.killAt]) { const tg = F.dbg.swings[o.killAt].tg; if (tg) { killed = tg.__id || '?'; tg.dead = true; } }
      if (o.dieAt != null && deadAt == null && e > o.dieAt) { deadAt = e; me.dead = true; }
      if (F) faLog.push(F.dbgFa());
      for (const m of ms) if (!m.boss && !m.dead) m.stun = Math.max(m.stun || 0, 0.02 + o.dt);   // (its own AI held: only the hammer acts on it)
      G.update(o.dt); for (const m of ms) maxStun[m.__id] = Math.max(maxStun[m.__id] || 0, m.stun || 0); if (deadAt == null) { me.hp = D.ST.hp; me.inv = 1; } }
    let maxTurn = 0; for (let i = 1; i < faLog.length; i++) maxTurn = Math.max(maxTurn, Math.abs(Math.atan2(Math.sin(faLog[i] - faLog[i - 1]), Math.cos(faLog[i] - faLog[i - 1]))));
    const hits = {}; for (const h of window.__MHLOG) hits[h.id] = (hits[h.id] || 0) + 1; const dmg = {}; for (const h of window.__MHLOG) dmg[h.id] = (dmg[h.id] || 0) + h.dmg;
    const left = D.ELEM.fx.filter(f => /^mercuryhammer/.test(f.key)).length, hooks = { arm: me.hopArmS, lean: me.hopLean, sq: me.hopSq, dx: me.hopDX, dy: me.hopDY, z: me.z };
    const out = { hits, dmg, log: window.__MHLOG.map(h => [h.id, +h.dmg.toFixed(1), h.stun]), swings: F ? F.dbg.swings.map(s => [s.kind, s.n, +s.dmg.toFixed(1)]) : null, impacts: F ? F.dbg.impacts.map(i => [+i.R.toFixed(2), i.n]) : null, cancelled: F ? F.dbg.cancelled : null,
      retargets: F ? F.dbg.retargets : 0, killed, stepped: F ? +F.dbg.stepped.toFixed(3) : 0, moved: +Math.hypot(me.x - pxy[0], me.y - pxy[1]).toFixed(3), maxTurn: +maxTurn.toFixed(4), fa: faLog.length ? +faLog[faLog.length - 1].toFixed(3) : null, left, hooks, cd0, maxStep: F ? F.dbg.maxStep : 0, ph: F ? F.dbgPh() : null, armsT: F ? F.dbg.armsT : null,
      pos0, end: ms.map(m => [+(m.x - me.x).toFixed(2), +(m.y - me.y).toFixed(2), !!m.dead, !!m.under, m.falling, m.z, m.hop, m.act]), boss: ms.filter(m => m.boss).map(m => ({ id: m.__id, hp: m.__hp0 - m.hp, moved: +Math.hypot(m.x - m.__x0, m.y - m.__y0).toFixed(3), stun: +(maxStun[m.__id] || 0).toFixed(3) })), stuns: maxStun, base: D.ST.atk };
    for (const m of ms) { if (m.boss) { const i = D.mons.indexOf(m); if (i >= 0) D.mons.splice(i, 1); } else Object.assign(m, { x: window.__PARK.x, y: window.__PARK.y }); }
    me.dead = false; g.stopT = 0; return out; }, o);
  await start();
  const TUNE = await page.evaluate(() => { const T = self.EARTH_STRONG_TUNE && self.EARTH_STRONG_TUNE.mercuryhammer; return T && { finR: T.finR, reach: T.reach, turn: T.turn, step: T.step, stepFin: T.stepFin, w: T.w, COMBO: T.COMBO }; });
  ok(!!TUNE, 'TUNE exposed on EARTH_STRONG_TUNE.mercuryhammer', TUNE);
  /* ---- the three tiers: one monster ahead (1.6 tiles), the combos in order, the finisher heaviest and the only, widest, ground impact ---- */
  const WANT = { 1: [['smash'], 1], 4: [['broad', 'smash'], 2], 7: [['sweepR', 'sweepL', 'ascend', 'smash'], 4] };
  const tierRes = {};
  for (const evo of (process.env.EVOS || "1,4,7").split(",").map(Number)) { const r = await run({ evo, secs: 6, dt: 1 / 60, mons: [[1.6, 0], [1.2, 0.9], [2.0, -0.5]] }); tierRes[evo] = r;
    const [order, n] = WANT[evo];
    ok(JSON.stringify(r.swings.map(s => s[0])) === JSON.stringify(order), `evo ${evo}: the combo is ${order.join(' > ')}`, r.swings);
    ok(['m0', 'm1', 'm2'].every(id => r.hits[id] === n), `evo ${evo}: exactly ${n} hit(s) on each monster ahead`, { hits: r.hits, pos: r.pos0, end: r.end });
    const fin = r.swings[r.swings.length - 1]; ok(r.swings.slice(0, -1).every(s => s[2] < fin[2]), `evo ${evo}: the finisher is the strongest strike`, r.swings.map(s => s[2]));
    ok(r.impacts.length === 1 && r.impacts[0][0] === TUNE.finR[[1, 4, 7].indexOf(evo)], `evo ${evo}: one ground impact, the finisher's (radius ${TUNE.finR[[1, 4, 7].indexOf(evo)]})`, r.impacts);
    ok(r.left === 0 && !r.hooks.arm && !r.hooks.lean && !r.hooks.sq && !r.hooks.dx && !r.hooks.z, `evo ${evo}: cleaned up after the combo (no fx, the pet's hooks cleared)`, { left: r.left, hooks: r.hooks, ph: r.ph });
    ok(r.cd0 === 10, `evo ${evo}: the cooldown (10 s) is taken when the cast commits`, r.cd0); }
  ok(TUNE.finR[0] < TUNE.finR[1] && TUNE.finR[1] < TUNE.finR[2], 'the finisher\'s impact widens with the tier', TUNE.finR);
  if (tierRes[1] && tierRes[4] && tierRes[7]) ok(tierRes[1].dmg.m0 < tierRes[4].dmg.m0 && tierRes[4].dmg.m0 < tierRes[7].dmg.m0, 'total damage on a monster grows with the tier', [tierRes[1].dmg.m0, tierRes[4].dmg.m0, tierRes[7].dmg.m0].map(v => +v.toFixed(1)));
  /* ---- the finisher: contact + shockwave = one event ---- */
  { const R = TUNE.finR[0]; const r = await run({ evo: 1, secs: 3, dt: 1 / 60, mons: [[1.7, 0], [1.8, 0.05], [1.8 + R * 0.75, -1.2], [1.8 + R + 1.6, 0]] });
    ok(r.hits.m0 === 1 && r.hits.m1 === 1, 'a monster under the hammer and in the shockwave takes ONE finisher hit', r.hits);
    ok(r.hits.m2 === 1, 'a monster in the shockwave only takes one hit', r.hits);
    ok(!r.hits.m3, 'a monster beyond the shockwave takes none', r.hits); }
  /* ---- dodge-cancel ---- */
  { const r = await run({ evo: 7, secs: 6, dt: 1 / 60, mons: [[1.6, 0]], dodgeAtSwing: 0 });
    ok(r.cancelled === 'dodge' && r.hits.m0 === 1, 'a dodge in the first strike\'s recovery ends the combo there (1 of 4 hits)', { c: r.cancelled, hits: r.hits, swings: r.swings });
    ok(r.left === 0 && !r.hooks.arm && !r.hooks.lean && !r.hooks.z, 'the cancelled combo cleans up (the hammer breaks away, hooks cleared)', { left: r.left, hooks: r.hooks });
    const r2 = await run({ evo: 7, secs: 6, dt: 1 / 60, mons: [[1.6, 0]], dodgeAtSwing: 0, dodgeIn: 'wind' });
    ok(r2.cancelled == null && r2.swings.length === 4, 'a dodge during a wind-up (over before the contact) does not cancel: all four strikes are made', { c: r2.cancelled, swings: r2.swings }); }
  /* ---- tracking: a target off the aim, a far target, a dead target ---- */
  { const r = await run({ evo: 7, secs: 6, dt: 1 / 60, mons: [[0.2, -1.7]], late: [0] });
    ok(r.maxTurn <= TUNE.turn / 60 + 1e-3, `the facing turns no faster than ${TUNE.turn} rad/s`, r.maxTurn);
    ok(r.hits.m0 >= 3, 'it turns onto a target off to the side and hits it', { hits: r.hits, fa: r.fa });
    const r2 = await run({ evo: 7, secs: 6, dt: 1 / 60, mons: [[3.8, 0]] });
    ok(r2.stepped <= 3 * TUNE.step + TUNE.stepFin + 1e-6 && r2.moved <= 3 * TUNE.step + TUNE.stepFin + 0.05 && r2.stepped > 0, 'limited forward movement toward a far target', { stepped: r2.stepped, moved: r2.moved });
    const r3 = await run({ evo: 7, secs: 6, dt: 1 / 60, mons: [[1.6, 0], [-2.3, 0.1]], killAt: 1 });
    ok(r3.killed === 'm0' && r3.retargets >= 1 && r3.hits.m1 >= 1, 'a target killed mid-combo hands over to the next (it turns round onto the one behind and strikes it)', { killed: r3.killed, retargets: r3.retargets, hits: r3.hits, fa: r3.fa }); }
  /* ---- bosses ---- */
  { const r = await run({ evo: 7, secs: 6, dt: 1 / 60, mons: [[1.8, 0, { boss: true }]], stop: true }); const b = r.boss[0] || {};
    ok(r.hits.m0 === 4 && b.hp > 0, 'a boss takes every strike\'s damage', { hits: r.hits, boss: b });
    ok(b.stun <= 0.5 * 0.25 + 1e-6, 'its stagger is cut to a quarter (hitMon\'s boss rule)', b);
    ok(b.moved < 0.4, 'a boss is barely moved', b); }
  /* ---- cleanup on defeat and on leaving the floor ---- */
  { const r = await run({ evo: 7, secs: 3, dt: 1 / 60, mons: [[1.6, 0]], dieAt: 1.1 });
    ok((r.cancelled === 'death' || r.cancelled === 'swap') && r.hits.m0 <= 2 && r.left === 0 && !r.hooks.arm && !r.hooks.lean && !r.hooks.z, 'the pet\'s defeat ends it: no further hits, no fx, hooks cleared', { c: r.cancelled, hits: r.hits, left: r.left, hooks: r.hooks });
    const ex = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; const H0 = window.__HOME; me.x = H0.x; me.y = H0.y; me.dead = false; D.g.cdS = 0; me.mp = 999;
      const mv = P.ELEM_LIST.earth.ex_mercuryhammer; D.setKit('strong', Object.assign(P.elemAbility(mv, 'strong', P.st), { star: 5, mult: 1.2, cost: 0, cd: 10, tier: 1, evo: 7 })); D.useStrong('strong'); for (let k = 0; k < 70; k++) G.update(1 / 60);
      const mid = { fx: D.ELEM.fx.filter(f => /^mercuryhammer/.test(f.key)).length, arm: !!me.hopArmS }; P.closeArcade(); return mid; });
    await start();
    const after = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me; for (let k = 0; k < 30; k++) window.__pp.arc.game.update(1 / 60); return { fx: D.ELEM.fx.filter(f => /^mercuryhammer/.test(f.key)).length, arm: me.hopArmS, lean: me.hopLean, z: me.z }; });
    ok(ex.fx >= 1 && after.fx === 0 && !after.arm && !after.lean && !after.z, 'leaving the floor mid-combo leaves nothing behind on the next', { mid: ex, after }); }
  /* ---- big steps: the same hits and damage at 1/60, 1/4 and 1/2 s ---- */
  for (const evo of [1, 4, 7]) { const R = []; for (const dt of [1 / 60, 0.25, 0.5]) R.push(await run({ evo, secs: 8, dt, mons: [[1.6, 0], [1.3, 0.8]] }));
    const same = R.every(r => r.hits.m0 === R[0].hits.m0 && r.hits.m1 === R[0].hits.m1 && Math.abs(r.dmg.m0 - R[0].dmg.m0) < 1e-6);
    ok(same && R[0].hits.m0 === WANT[evo][1] && R.every(r => r.maxStep <= 1 / 60 + 1e-9 && r.left === 0), `evo ${evo}: identical hits and damage stepped at 1/60, 1/4, 1/2 s (internal step <= 1/60)`, R.map(r => [r.hits, +r.dmg.m0.toFixed(1), +r.maxStep.toFixed(4)])); }
  ok(errors.length === 0, 'no page errors', errors.slice(0, 5));
  console.log(bad ? `${bad} FAILED` : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
