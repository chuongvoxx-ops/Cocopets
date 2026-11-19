// (v417 GH) God's Hand and Fault Line (Earth Strongs, 20k2nh / 20k2ni): the rules the user set, checked in the real game.
//   tiers (levels 1 / 4 / 7: size and radius, fissure counts), the aim, the cooldown starting at the commit, one damage event per monster per
//   cast (God's Hand: its dust and fragments never hit; Fault Line: crossing fissures never hit twice), bosses hurt but staggered only by the
//   game's own rule (a quarter of the stun, never pushed or lifted), frame-rate independence (the same hits with frames of 1/60 s .. 1 s),
//   cleanup (the pet down, the encounter over, the map left), and every beat drawn without errors.
// usage: HTML=test-gh.html node tests/_earth-strong-gh.js        GLFLAGS=__NG_GL (the GPU picture on the software rasteriser: slow)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  if (process.env.GLFLAGS) await page.addInitScript(fl => { for (const f of fl) window[f] = 1; }, process.env.GLFLAGS.split(','));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 180000 }); await page.waitForTimeout(300);
  const start = async () => {
    await page.evaluate(() => { const P = window.__pp; try { if (P.arc.state !== 'idle') P.closeArcade(); } catch (e) {} P.quickStart('GH'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 180000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 180000 });
    // the loop stopped: the test drives the game's clock itself; a helper kit in the page
    await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; const G = P.arc.game, D = G._dbg, me = D.me;
      for (let k = 0; k < 160; k++) G.update(1 / 60);
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let s = 777; const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
      let best = null; for (let k = 0; k < 3000; k++) { const sx = me.x + (rnd() - 0.5) * 44, sy = me.y + (rnd() - 0.5) * 44; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L) && W(sx, sy + L)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; }
      const T = window.__T = { G, D, me, P, home: best, log: [], pin: [] };
      // every elemental hit through the toolkit's door (the moves call X.hitMon at the time of the hit)
      const X = D.ELEM.H.X; if (!X.__ghWrap) { const o = X.hitMon; X.hitMon = (m, d, op) => { T.log.push({ m, d, stun: op && op.stun, kb: op && op.kb, t: D.g.t }); return o(m, d, op); }; X.__ghWrap = 1; }
      // lay out the pet and monsters (offsets from the open spot); every other monster far away and dead
      T.layout = (pet, list) => { me.x = best.x + pet[0]; me.y = best.y + pet[1]; me.dead = false; me.hp = D.ST.hp; me.mp = 999; me.push = me.dash = me.leap = me.dodge = null; me.face = 1; me.ax = 0; me.ay = -1; D.g.intro = 0; D.g.bossIntro = 0; D.g.cdS = 0; D.g.over = false; D.g.won = false;
        // (every monster of the floor gone, its reserve too, so none walks back in; fresh plain ones made where the test wants them)
        for (const m of D.mons) if (!m.fobj) Object.assign(m, { dead: true, x: best.x + 60, y: best.y + 60 }); if (D.g.reserve) D.g.reserve.length = 0;
        const out = []; list.forEach((q, i) => { let m; if (q.boss) { m = D.lesserBoss(best.x + q.x, best.y + q.y, 1, 'Test'); m.act = 'move'; } else m = D.X.spawnMon('blob', best.x + q.x, best.y + q.y, {});
          Object.assign(m, { dead: false, x: best.x + q.x, y: best.y + q.y, hp: 1e9, maxhp: 1e9, spd: 0, atkCd: 99, cd: 99, dmg: 0, stun: 0, freeze: 0, chill: 0, kbx: 0, kby: 0, z: 0, lifted: false, still: false, under: false, falling: null, aggro: false, mark: null, rxCd: 999 }); /* (rxCd: no elemental reaction of the game's own, from a mark left by the pet's trait, muddles the move's own stagger) */ m._q = q.id || ('m' + i); out.push(m); }); T.pin = out.filter(m => !m.boss).map(m => [m, m.x, m.y]);
        D.ELEM.fx.length = 0; T.log.length = 0; return out; };
      T.cast = (key, evo, o) => { o = o || {}; const mv = P.ELEM_LIST.earth['ex_' + key]; D.setKit('strong', Object.assign(P.elemAbility(mv, 'strong', P.st), { star: 6, mult: 1.2, cost: o.cost == null ? mv.cost : o.cost, cd: o.cd == null ? mv.cd : o.cd, tier: 1, evo }));
        const mp0 = me.mp; D.useStrong('strong'); const f = D.ELEM.fx.find(q => q.key === key); return { f, mp: mp0 - me.mp, cd: D.g.cdS }; };
      T.run = (secs, dt) => { const t0 = D.g.t; let k = 0; while (D.g.t - t0 < secs && k++ < 100000) { me.hp = D.ST.hp; G.update(dt || 1 / 60); for (const p of T.pin) { p[0].x = p[1]; p[0].y = p[2]; } } };   /* (T.pin: the test's monsters held where they were laid: a roused monster's own leaps never move it) */
      T.hitsOf = m => T.log.filter(e => e.m === m).length;
    }); };
  await start();
  const TUNE = await page.evaluate(() => ({ gh: JSON.parse(JSON.stringify(window.EARTH_STRONG_TUNE.godshand)), fl: JSON.parse(JSON.stringify(window.EARTH_STRONG_TUNE.faultline)), rows: window.__pp.ELEM_MOVES.earth.strong.filter(r => r[0] === 'godshand' || r[0] === 'faultline'), six: window.__pp.ELEM_SIX ? window.__pp.ELEM_SIX.earth : null, alias: window.__pp.ELEM_ALIAS ? window.__pp.ELEM_ALIAS.earth : null }));
  ok(TUNE.gh && TUNE.fl, 'the tuning tables are exposed (EARTH_STRONG_TUNE.godshand / .faultline)', Object.keys(TUNE.gh || {}).concat(Object.keys(TUNE.fl || {})).length);
  ok(TUNE.rows.length === 2 && TUNE.rows.some(r => r[0] === 'godshand' && r[4] === 12) && TUNE.rows.some(r => r[0] === 'faultline' && r[4] === 8), 'the rows: God\'s Hand 12 s, Fault Line 8 s', TUNE.rows.map(r => [r[0], r[1], r[3], r[4]]));
  const geo = await page.evaluate(() => ({ g: window.__pp.elemParse('e:earth:geode'), f: window.__pp.elemParse('e:earth:faultline') }));
  ok(geo.g && geo.g.key === 'godshand' && geo.f && geo.f.key === 'faultline', 'a saved Geode Burst reads as God\'s Hand, Faultline Fang\'s key as Fault Line', [geo.g && geo.g.key, geo.f && geo.f.key]);
  const impl = await page.evaluate(() => { const S = window.__pp.ELEM_IMPL.earth.strong; return { gh: typeof S.godshand, fl: typeof S.faultline, geode: typeof S.geode }; });
  ok(impl.gh === 'function' && impl.fl === 'function' && impl.geode === 'undefined', 'the implementations: godshand and faultline in, Geode Burst out', impl);

  /* ---------------- God's Hand ---------------- */
  for (const evo of [1, 4, 7]) {
    const r = await page.evaluate(evo => { const T = window.__T, D = T.D, tier = evo >= 7 ? 2 : evo >= 4 ? 1 : 0, Rr = window.EARTH_STRONG_TUNE.godshand.radius[tier];
      // the target 3.2 tiles up; two more inside the radius; one just outside it; one far
      const M = T.layout([0, 3.5], [{ x: 0, y: 0.3, id: 'aim' }, { x: Rr * 0.6, y: 0.3, id: 'in1' }, { x: -Rr * 0.55, y: -0.4, id: 'in2' }, { x: Rr + 1.3, y: 0.3, id: 'out' }, { x: 0, y: -6, id: 'far' }]);
      const c = T.cast('godshand', evo); const f = c.f; if (!f) return { err: 'no fx' };
      const tgt = { dx: f.x - M[0].x, dy: f.y - M[0].y }, gestPush = !!T.me.push;
      T.run(0.5); const freeAfterGesture = !T.me.push;
      T.run(window.EARTH_STRONG_TUNE.godshand.impact - 0.5 - 0.05); const before = T.log.length;
      T.run(0.1); const atImpact = T.log.length; const st = Object.fromEntries(M.map(m => [m._q, +(m.stun || 0).toFixed(2)])), kb = Object.fromEntries(M.map(m => [m._q, +Math.hypot(m.kbx || 0, m.kby || 0).toFixed(2)]));
      T.run(window.EARTH_STRONG_TUNE.godshand.life); const hits = Object.fromEntries(M.map(m => [m._q, T.hitsOf(m)]));
      return { tier: f.tier, R: f.R, tgt, mp: c.mp, cd: c.cd, gestPush, freeAfterGesture, before, atImpact, after: T.log.length, hits, st, kb, fxLeft: D.ELEM.fx.filter(q => q.key === 'godshand').length, size: window.EARTH_STRONG_TUNE.godshand.size[tier] };
    }, evo);
    const T0 = TUNE.gh;
    ok(!r.err && r.tier === (evo >= 7 ? 2 : evo >= 4 ? 1 : 0), `God's Hand level ${evo}: tier ${r.tier}`, r.err);
    ok(Math.abs(r.R / T0.radius[0] - [1, 1.2, 1.4][r.tier]) < 0.02 && Math.abs(r.size / T0.size[0] - [1, 1.2, 1.4][r.tier]) < 0.02, `  its radius and fist size x${[1, 1.2, 1.4][r.tier]} of Base`, { R: r.R, size: r.size });
    ok(Math.hypot(r.tgt.dx, r.tgt.dy) < 0.3, '  aimed: the fist comes down on the aimed monster', r.tgt);
    ok(r.mp === 30 && r.cd === 12, '  the cast commits: MP spent, the 12 s cooldown started at once', { mp: r.mp, cd: r.cd });
    ok(r.gestPush && r.freeAfterGesture, '  the pet held for the summoning gesture only, then free', { held: r.gestPush, free: r.freeAfterGesture });
    ok(r.before === 0 && r.atImpact === 3 && r.after === 3, '  ONE damage event: nothing before the impact, the three in the radius hit together, nothing after (dust, fragments, the crumble)', { before: r.before, atImpact: r.atImpact, after: r.after });
    ok(r.hits.aim === 1 && r.hits.in1 === 1 && r.hits.in2 === 1 && r.hits.out === 0 && r.hits.far === 0, '  each monster in the radius once; none outside', r.hits);
    ok(r.st.aim >= T0.stun - 0.1 && r.kb.aim > 0, '  a susceptible monster staggered and knocked back a little', { stun: r.st.aim, kb: r.kb.aim });
    ok(r.fxLeft === 0, '  the cast cleaned itself up at the end', r.fxLeft);
  }
  // a boss under the fist: damaged, a quarter of the stagger at most, never pushed
  { const r = await page.evaluate(() => { const T = window.__T, M = T.layout([0, 3.5], [{ x: 0, y: 0, id: 'boss', boss: true }, { x: 1.2, y: 0.2, id: 'mon' }]), b = M[0], x0 = b.x, y0 = b.y, hp0 = b.hp;
      const c = T.cast('godshand', 7); T.run(window.EARTH_STRONG_TUNE.godshand.impact - 0.03); b.stun = 0; T.run(0.05); const st = b.stun || 0, e = T.log.find(q => q.m === b), em = T.log.find(q => q.m === M[1]); T.run(0.4);
      return { boss: !!b.boss, dmg: hp0 - b.hp, hits: T.hitsOf(b), st, kbAsked: e ? e.kb : null, kbMon: em ? em.kb : null, stunAsked: e ? e.stun : null, z: b.z || 0, mon: T.hitsOf(M[1]), ok: !!c.f };
    });
    ok(r.boss && r.hits === 1 && r.dmg > 0, 'God\'s Hand on a boss: one hit, damage dealt', r);
    ok(r.st <= TUNE.gh.stun * 0.25 + 0.02 && r.kbAsked === 0 && r.kbMon > 0 && r.z === 0, '  the boss keeps the game\'s rule: a quarter of the stagger, no push asked of it (a monster beside it is knocked back), not lifted', { stun: r.st, kbAsked: r.kbAsked, kbMon: r.kbMon, z: r.z }); }
  // no monster in reach: the fist lands 3 tiles ahead (the game's aim)
  { const r = await page.evaluate(() => { const T = window.__T; T.layout([0, 3.5], []); const c = T.cast('godshand', 1), f = c.f; return { dx: f.x - T.me.x, dy: f.y - T.me.y }; });
    ok(Math.abs(Math.hypot(r.dx, r.dy) - 3) < 1.0 && r.dy < -2, 'no target: the fist comes down ahead of the pet, where it faces', r); }

  /* ---------------- Fault Line ---------------- */
  for (const evo of [1, 4, 7]) {
    const r = await page.evaluate(evo => { const T = window.__T, D = T.D, tier = evo >= 7 ? 2 : evo >= 4 ? 1 : 0;
      // the aim straight up: one monster dead ahead close (where the V's and the fan's fissures overlap), several down the middle and the sides, one off to the side
      const M = T.layout([0, 1.5], [{ x: 0, y: -1.4, id: 'near' }, { x: 0, y: -4.2, id: 'mid' }, { x: -1.35, y: -3.3, id: 'left' }, { x: 1.35, y: -3.3, id: 'right' }, { x: 4.2, y: -0.6, id: 'off' }]);
      const c = T.cast('faultline', evo), f = c.f; if (!f) return { err: 'no fx' }; if (f.fis.some(q => q.L < 4)) return { err: 'a fissure stopped at a wall: ' + f.fis.map(q => q.L.toFixed(2)) };
      const held = !!T.me.push; T.run(0.3); const free = !T.me.push; let zMax = 0; const t0 = D.g.t; while (D.g.t - t0 < 1.4) { T.run(1 / 60); zMax = Math.max(zMax, M[0].z || 0); } const own = Object.fromEntries(M.map(m => [m._q, (f.hits.has(m) ? 1 : 0) + (m.dead ? 'D' : '') + (m.under ? 'U' : '') + (m.falling ? 'F' : '') + (m.fobj ? 'O' : '')])), pos = Object.fromEntries(M.map(m => [m._q, [+(m.x - T.home.x).toFixed(2), +(m.y - T.home.y).toFixed(2)]]));
      T.run(window.EARTH_STRONG_TUNE.faultline.close + 1.5);
      // each monster's distance to the nearest fissure line, from the cast's own paths (they wander a little, cast by cast), less its reach (TUNE.width + the monster's radius)
      const W = window.EARTH_STRONG_TUNE.faultline.width, gap = m => { let b = 1e9; for (const q of f.fis) for (let k = 0; k < q.P.length - 1; k++) { const a = q.P[k], e = q.P[k + 1], dx = e[0] - a[0], dy = e[1] - a[1], L2 = dx * dx + dy * dy, u = Math.max(0, Math.min(1, ((m.x - a[0]) * dx + (m.y - a[1]) * dy) / (L2 || 1))); b = Math.min(b, Math.hypot(m.x - a[0] - dx * u, m.y - a[1] - dy * u)); } return +(b - W - m.r).toFixed(2); };
      return { n: f.fis.length, len: f.fis.map(q => +q.L.toFixed(2)), mp: c.mp, cd: c.cd, held, free, zMax, gaps: Object.fromEntries(M.map(m => [m._q, gap(m)])), own, pos, fr: f.fis.map(q => +q.fr.toFixed(2)), org: [+(f.x - T.home.x).toFixed(2), +(f.y - T.home.y).toFixed(2)], p0: f.fis.map(q => q.P.map(p => [+(p[0] - T.home.x).toFixed(2), +(p[1] - T.home.y).toFixed(2)])), mr: M.map(m => +m.r.toFixed(2)), hits: Object.fromEntries(M.map(m => [m._q, T.hitsOf(m)])), total: T.log.length, wedges: f.fis.reduce((a, q) => a + q.wedges.length, 0), fxLeft: D.ELEM.fx.filter(q => q.key === 'faultline').length };
    }, evo);
    ok(!r.err && r.n === [1, 2, 3][evo >= 7 ? 2 : evo >= 4 ? 1 : 0], `Fault Line level ${evo}: ${r.n} fissure(s)`, { len: r.len, wedges: r.wedges, err: r.err });
    ok(r.mp === 24 && r.cd === 8, '  the cast commits: MP spent, the 8 s cooldown started at once', { mp: r.mp, cd: r.cd });
    ok(r.held && r.free, '  the pet held for the stamp only, then free', { held: r.held, free: r.free });
    ok(r.hits.near === 1 && r.hits.off === 0 && Object.values(r.hits).every(n => n <= 1), '  the monster where the fissures overlap (V and fan) hit ONCE, the one off to the side never, none twice', r.hits);
    { const wrong = Object.keys(r.hits).filter(k => (r.gaps[k] < -0.03 && r.hits[k] !== 1) || (r.gaps[k] > 0.03 && r.hits[k] !== 0));
      ok(!wrong.length, '  exactly the monsters within reach of a fissure\'s line are hit (once), the rest never', wrong.length ? { hits: r.hits, gaps: r.gaps, own: r.own, pos: r.pos, org: r.org, mr: r.mr, p0: r.p0 } : { hits: r.hits, gaps: r.gaps }); }
    if (evo >= 4) ok(r.hits.left + r.hits.right >= 1, evo >= 7 ? '  the fan covers the sides' : '  the V\'s arms cover the sides', r.hits);
    ok(r.zMax > 0.1, '  a susceptible monster jolted up (and set back down)', +r.zMax.toFixed(2));
    ok(r.fxLeft === 0, '  the cast cleaned itself up at the end (the cracks closed)', r.fxLeft);
  }
  { const r = await page.evaluate(() => { const T = window.__T, M = T.layout([0, 1.5], [{ x: 0, y: -2.5, id: 'boss', boss: true }]), b = M[0], hp0 = b.hp; T.cast('faultline', 7); let st = -1, z = 0, moved = -1; const t0 = T.D.g.t;
      // (the boss's own stun and steps are its own: cleared each frame until the frame of the hit, which is read)
      while (T.D.g.t - t0 < 1.0) { if (st < 0) b.stun = 0; const x0 = b.x, y0 = b.y, n0 = T.hitsOf(b); T.run(1 / 60); z = Math.max(z, b.z || 0); if (st < 0 && T.hitsOf(b) > n0) { st = b.stun || 0; moved = Math.hypot(b.x - x0, b.y - y0); } } T.run(2.5);
      return { dmg: hp0 - b.hp, hits: T.hitsOf(b), st, z, moved }; });
    ok(r.hits === 1 && r.dmg > 0, 'Fault Line on a boss: one hit, damage dealt', r);
    ok(r.st >= 0 && r.st <= TUNE.fl.jolt * 0.25 + 0.02 && r.z === 0 && r.moved < 0.15, '  the boss is not lifted or moved by it, its stagger a quarter of the jolt at most', { stun: r.st, z: r.z, moved: r.moved }); }

  /* ---------------- frame-rate independence: the cast's own clock driven with frames of 1/60 s up to 1 s ---------------- */
  for (const key of ['godshand', 'faultline']) {
    const res = await page.evaluate(key => { const T = window.__T, D = T.D, out = {}, I = window.__pp.ELEM_IMPL.earth.strong[key]; I.dbg.seed = 4242;   // (one path for every frame length)
      for (const dt of [1 / 60, 1 / 20, 0.25, 0.5, 1.0]) {
        const lay = key === 'godshand' ? [{ x: 0, y: 0.3 }, { x: 1.2, y: 0.5 }, { x: -1.4, y: -0.3 }, { x: 3.9, y: 0.4 }] : [{ x: 0, y: -1.4 }, { x: 0, y: -4.2 }, { x: -1.35, y: -3.3 }, { x: 1.35, y: -3.3 }, { x: 0.3, y: -5.5 }, { x: 4.2, y: -0.6 }];
        const M = T.layout(key === 'godshand' ? [0, 3.5] : [0, 1.5], lay); const c = T.cast(key, 7), f = c.f; D.ELEM.fx.splice(D.ELEM.fx.indexOf(f), 1);   // (the cast driven on its own: the monsters stand still)
        let n = 0; while (f.life > 0 && n++ < 10000) { f.t += dt; f.life -= dt; f.update(dt, f); }
        if (f.onEnd) f.onEnd(f); D.ELEM.fx.length = 0;
        out[dt.toFixed(3)] = M.map(m => T.hitsOf(m)).join(''); }
      I.dbg.seed = 0; return out; }, key);
    const vals = Object.values(res); ok(vals.every(v => v === vals[0]) && /1/.test(vals[0]) && !/[2-9]/.test(vals[0]), `${key}: the same monsters hit once each whatever the frame length (1/60 s .. 1 s)`, res);
  }

  /* ---------------- cleanup ---------------- */
  for (const key of ['godshand', 'faultline']) {
    const r = await page.evaluate(key => { const T = window.__T, D = T.D, M = T.layout(key === 'godshand' ? [0, 3.5] : [0, 1.5], key === 'godshand' ? [{ x: 0, y: 0.3 }] : [{ x: 0, y: -4.5 }]), out = {};
      // the pet goes down mid-cast: nothing more lands, the cast is gone quickly
      T.cast(key, 4); T.run(0.25); T.me.dead = true; const n0 = T.log.length; T.D.ELEM.update(1 / 60); for (let k = 0; k < 40; k++) T.D.ELEM.update(1 / 60); out.deadHits = T.log.length - n0; out.deadLeft = D.ELEM.fx.filter(q => q.key === key).length; T.me.dead = false;
      // the encounter over (the floor won and left): the same
      T.layout(key === 'godshand' ? [0, 3.5] : [0, 1.5], key === 'godshand' ? [{ x: 0, y: 0.3 }] : [{ x: 0, y: -4.5 }]); T.cast(key, 4); T.run(0.25); D.g.over = true; const n1 = T.log.length; for (let k = 0; k < 40; k++) D.ELEM.update(1 / 60); out.overHits = T.log.length - n1; out.overLeft = D.ELEM.fx.filter(q => q.key === key).length; D.g.over = false;
      return out; }, key);
    ok(r.deadHits === 0 && r.deadLeft === 0, `${key}: the pet down mid-cast: no hit lands after, the cast is cleared`, r);
    ok(r.overHits === 0 && r.overLeft === 0, `${key}: the encounter over mid-cast: no hit lands after, the cast is cleared`, r);
  }
  // the map left mid-cast: the floor is torn down with its casts (nothing of them kept: no timers, no global state), and a new floor starts clean
  { await page.evaluate(() => { const T = window.__T; T.layout([0, 3.5], [{ x: 0, y: 0.3 }]); T.cast('godshand', 7); T.run(0.5); T.layout([0, 1.5], [{ x: 0, y: -3 }]); T.cast('faultline', 7); T.run(0.3); window.__pp.closeArcade(); });
    await page.waitForTimeout(300); await start();
    const r = await page.evaluate(() => { const T = window.__T; T.run(2.5); return { fx: T.D.ELEM.fx.length, state: window.__pp.arc.state }; });
    ok(r.fx === 0, 'the map left mid-cast: the next floor starts with no effects left over (and no errors)', r); }

  /* ---------------- every beat drawn ---------------- */
  for (const key of ['godshand', 'faultline']) for (const evo of [1, 7]) {
    const r = await page.evaluate(([key, evo]) => { const T = window.__T, P = T.P, G = T.G, c = P.arc.ctx || document.getElementById('arcCanvas').getContext('2d'); T.layout(key === 'godshand' ? [0, 3.5] : [0, 1.5], key === 'godshand' ? [{ x: 0, y: 0.3 }, { x: 1.2, y: 0.4 }] : [{ x: 0, y: -2 }, { x: 0.5, y: -4 }]);
      const f = T.cast(key, evo).f; let draws = 0; while (f.life > 0 && T.D.ELEM.fx.includes(f)) { T.run(0.12); G.draw(c); draws++; } return { draws }; }, [key, evo]);
    ok(r.draws > 10, `${key} level ${evo}: drawn through its whole cast`, r);
  }
  ok(!errors.length, 'no page errors', errors.slice(0, 6));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
