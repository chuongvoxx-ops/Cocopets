// the Basilica core (20zt2): a leech spits, a scarab cone turns and calcifies to the root, screens shade and slide, a sentinel locks and charges, a pylon turns. HTML=test-bas.html node tests/_bas-mech.js
// the Basilica's shared mechanics: the brood's behaviour, Calcification, screens and shadows
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => {
  const T = await open({ lvl: 88, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors, shot, start, run } = T;
  await start('basilica', 0);
  // a clear spot: the start room's centre; everything else is cleared away so only what we place acts
  const setup = (type) => page.evaluate(async (type) => { const D = window.__pp.arc.game._dbg, X = D.RIFT.self.amb.C.X, me = D.me; for (const m of D.mons) if (!m.dead) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); }
    const s = D.M.start; me.x = s.x; me.y = s.y; me.vx = me.vy = 0; const q = X.freeSpot(s.x + 3, s.y, 0.6) || { x: s.x + 3, y: s.y }; const m = X.spawnMon(type, q.x, q.y, { pack: 990, rift: true, aggro: true }); m.aggro = true; return { mx: m.x, my: m.y, px: me.x, py: me.y }; }, type);
  const C = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb, c = A.BAS.calcify; return { drops: A.C.drops.length, sources: A.C.sources.length, k: c.k, stage: c.stage, rooted: c.rooted, seen: c.seen, hp: D.me.hp, maxhp: D.ST.hp, total: c.total }; });
  // 1. a leech spits a droplet
  let r = await setup('calciteleech'); let maxDrops = 0; for (let i = 0; i < 12; i++) { await run(0.4); const c = await C(); maxDrops = Math.max(maxDrops, c.drops); } ok(maxDrops > 0, 'a calcite leech spits petrification droplets', { maxDrops });
  // a droplet that lands adds a stage: park the pet right on the leech's line
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.RIFT.self.amb.BAS.calcify.reset(); window.__pp.st.dun.god = false; D.me.inv = 0; });
  let best = 0; for (let i = 0; i < 20; i++) { await run(0.4); const c = await C(); best = Math.max(best, c.k); if (best > 0) break; } ok(best > 0, 'a droplet that lands adds Calcification (god mode off: hurtPet must land)', { k: best });
  await page.evaluate(() => { window.__pp.st.dun.god = true; const D = window.__pp.arc.game._dbg; D.me.hp = D.ST.hp; });
  // 2. a scarab's cone turns, and standing in it calcifies to stage 3, roots and releases
  r = await setup('witnessscarab'); await run(0.3);
  const ang = async () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.mons.find(m => m.type === 'witnessscarab' && !m.dead); return m && m.gaze ? { a: m.gaze.a, open: m.gaze.open, x: m.x, y: m.y, mode: m.mode } : null; });
  const a0 = await ang(); await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, t0 = D.g.t; while (D.g.t - t0 < 1) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } }); const a1 = await ang();   // (one second of game time: the headless page runs slowly) ok(a0 && a1 && Math.abs(a1.a - a0.a) > 0.2 && Math.abs(a1.a - a0.a) < 1.2, 'the scarab\'s gaze cone turns slowly', { a0: a0 && a0.a.toFixed(2), a1: a1 && a1.a.toFixed(2), mode: a1 && a1.mode });
  // stand in the cone (held on the pet): the pet is put 2.5 tiles along the gaze, every frame, until it roots
  const hp0 = (await C()).hp;
  const res = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb, cal = A.BAS.calcify, m = D.mons.find(m => m.type === 'witnessscarab' && !m.dead); cal.reset(); const t0 = performance.now(); let seenFrames = 0, maxK = 0, rooted = false, rootedAt = 0;
    while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.mp = 999; if (!rooted) { const g = m.gaze; D.me.x = m.x + Math.cos(g.a) * 2.5; D.me.y = m.y + Math.sin(g.a) * 2.5; D.me.vx = D.me.vy = 0; } if (cal.seen) seenFrames++; maxK = Math.max(maxK, cal.k); if (cal.rooted > 0 && !rooted) { rooted = true; rootedAt = performance.now() - t0; D.me.hp = D.ST.hp; } if (rooted && cal.rooted <= 0 && cal.k === 0) break; }
    return { seenFrames, maxK, rooted, rootedAt: Math.round(rootedAt), k: cal.k, stage: cal.stage, total: cal.total, hp: D.me.hp, maxhp: D.ST.hp }; });
  ok(res.seenFrames > 20 && res.maxK >= 3 && res.rooted && res.rootedAt > 1800 && res.rootedAt < 4500, 'seen in the cone: three stages in ~2.4 s, then rooted', res);
  ok(res.k === 0 && res.stage === 0, 'released and reset after the root', { k: res.k, stage: res.stage });
  // the root hurt 20% of max HP (god mode is on in the test harness: hurtPet returns before damage, so we check the call path by the root count)
  ok(res.total >= 1, 'the root was counted', res.total);
  // leaving the cone clears the stages over 1.5 s
  const clr = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb, cal = A.BAS.calcify, m = D.mons.find(m => m.type === 'witnessscarab' && !m.dead); cal.reset(); cal.immune = 0; const g = m.gaze; const t0 = performance.now();
    while (performance.now() - t0 < 1300) { await new Promise(r => requestAnimationFrame(r)); D.me.x = m.x + Math.cos(g.a) * 2.5; D.me.y = m.y + Math.sin(g.a) * 2.5; }
    const kIn = cal.k; D.me.x = m.x + Math.cos(g.a + Math.PI) * 3; D.me.y = m.y + Math.sin(g.a + Math.PI) * 3; const t1 = performance.now(); let tClear = -1; while (performance.now() - t1 < 2500) { await new Promise(r => requestAnimationFrame(r)); D.me.x = m.x + Math.cos(g.a + Math.PI) * 3; D.me.y = m.y + Math.sin(g.a + Math.PI) * 3; if (cal.k <= 0 && tClear < 0) { tClear = performance.now() - t1; break; } }
    return { kIn, tClear: Math.round(tClear), k: cal.k }; });
  ok(clr.kIn > 1 && clr.tClear > 0 && clr.tClear < 1800, 'out of the cone the stages clear within 1.5 s', clr);
  // 3. a screen between the scarab and the pet: its shadow blocks the gaze; it slides between stops
  const scr = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb, { BAS, C, H } = A, X = C.X, cal = BAS.calcify, m = D.mons.find(m => m.type === 'witnessscarab' && !m.dead), g = m.gaze;
    m.stun = 0; const mx = m.x, my = m.y; const a = g.a, sx = m.x + Math.cos(a) * 1.6, sy = m.y + Math.sin(a) * 1.6, s2x = m.x + Math.cos(a + Math.PI / 2) * 2.5, s2y = m.y + Math.sin(a + Math.PI / 2) * 2.5;
    const scr = BAS.screen(X, H, { a: a + Math.PI / 2, len: 3, stops: [[sx, sy], [s2x, s2y]], i0: 0 });
    const px = m.x + Math.cos(a) * 3.2, py = m.y + Math.sin(a) * 3.2; cal.reset(); cal.immune = 0;
    const inSh = BAS.inShadow(px, py, g), seen = BAS.gazeSeen(px, py, g), cone = BAS.inCone(px, py, g), poly = BAS.shadowOf(scr, g);
    const t0 = performance.now(); let maxK = 0; while (performance.now() - t0 < 1500) { await new Promise(r => requestAnimationFrame(r)); g.a = a; m.x = mx; m.y = my; D.me.x = px; D.me.y = py; D.me.vx = D.me.vy = 0; maxK = Math.max(maxK, cal.k); }
    // slide it to the other stop: a second, then the pet is seen again
    const moved = scr.next(); const t1 = performance.now(); let kHalf = null; while (performance.now() - t1 < 1300) { await new Promise(r => requestAnimationFrame(r)); g.a = a; m.x = mx; m.y = my; D.me.x = px; D.me.y = py; if (performance.now() - t1 > 500 && kHalf == null) kHalf = scr.k; }
    const at = { i: scr.i, moving: scr.moving, x: scr.x, y: scr.y, want: [s2x, s2y] }; const t2 = performance.now(); let kAfter = 0; while (performance.now() - t2 < 1200) { await new Promise(r => requestAnimationFrame(r)); g.a = a; m.x = mx; m.y = my; D.me.x = px; D.me.y = py; kAfter = Math.max(kAfter, cal.k); }
    return { inSh, seen, cone, poly: !!poly, maxK, moved, kHalf, at, kAfter, screens: BAS.screens(X).length, objs: D.RIFT.objs.filter(o => o.kind === 'screen').length }; });
  ok(scr.cone && scr.inSh && !scr.seen && scr.poly, 'a screen between the eye and the pet: in the cone but in shadow, not seen', { cone: scr.cone, inSh: scr.inSh, seen: scr.seen });
  ok(scr.maxK < 0.2, 'standing in the shadow, no Calcification builds', scr.maxK);
  ok(scr.moved && scr.kHalf > 0.2 && scr.kHalf < 0.9 && scr.at.i === 1 && !scr.at.moving && Math.hypot(scr.at.x - scr.at.want[0], scr.at.y - scr.at.want[1]) < 0.05, 'the screen slides to its other stop in about a second', { moved: scr.moved, kHalf: scr.kHalf, at: scr.at });
  ok(scr.kAfter > 0.5, 'with the screen gone the gaze reaches the pet again', scr.kAfter);
  ok(scr.screens === 1 && scr.objs === 1, 'BAS.screens(X) and X.rift.objs list the screen', { screens: scr.screens, objs: scr.objs });
  await shot('bas-mech-screen');
  // 4. a sentinel locks a line, then charges
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb; A.C.screens.length = 0; for (let i = D.RIFT.objs.length - 1; i >= 0; i--) if (D.RIFT.objs[i].kind === 'screen' || D.RIFT.objs[i].kind === 'handle') D.RIFT.objs.splice(i, 1); });
  r = await setup('brokensentinel');
  const sen = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, m = D.mons.find(m => m.type === 'brokensentinel' && !m.dead); const px = D.me.x, py = D.me.y; const t0 = performance.now(); let maxLock = 0, lockLine = false, charged = false, warned = false, moved = 0, x0 = m.x, y0 = m.y;
    while (performance.now() - t0 < 5000) { await new Promise(r => requestAnimationFrame(r)); D.me.x = px; D.me.y = py; D.me.hp = D.ST.hp; if (m.lock) lockLine = true; maxLock = Math.max(maxLock, m.lockT || 0); if (m.wT > 0) warned = true; if (m.chT > 0) { charged = true; moved = Math.max(moved, Math.hypot(m.x - x0, m.y - y0)); } if (charged && !(m.chT > 0)) break; }
    return { maxLock, lockLine, warned, charged, moved: +moved.toFixed(2), mode: m.mode }; });
  ok(sen.lockLine && sen.maxLock >= 1 && sen.warned && sen.charged && sen.moved > 1.5, 'a broken sentinel locks its line for a second, then charges', sen);
  // the line breaks behind a wall: no charge
  const brk = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, X = D.RIFT.self.amb.C.X, m = D.mons.find(m => m.type === 'brokensentinel' && !m.dead); m.cd = 0; m.lockT = 0; m.chT = 0; m.wT = 0;
    // a wall between: a blank-prop solid tile right beside the sentinel toward the pet, the pet two tiles beyond
    const a = Math.atan2(D.me.y - m.y, D.me.x - m.x), tx = Math.floor(m.x + Math.cos(a) * 1.5), ty = Math.floor(m.y + Math.sin(a) * 1.5); X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, 0); X.retile();
    const px = tx + 0.5 + Math.cos(a) * 1.6, py = ty + 0.5 + Math.sin(a) * 1.6; const t0 = performance.now(); let maxLock = 0; while (performance.now() - t0 < 1800) { await new Promise(r => requestAnimationFrame(r)); D.me.x = px; D.me.y = py; m.x = tx + 0.5 - Math.cos(a) * 1.6; m.y = ty + 0.5 - Math.sin(a) * 1.6; maxLock = Math.max(maxLock, m.lockT || 0); }
    return { maxLock, los: X.los(m.x, m.y, px, py), tile: X.tileAt(tx, ty) }; });
  ok(!brk.los && brk.maxLock < 0.3, 'a wall between breaks the lock line: no charge', brk);
  // 5. a pylon: turns among its angles with a preview, its lid closing as it swings
  const pyl = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, A = D.RIFT.self.amb, { BAS, C, H } = A, X = C.X; for (const m of D.mons) if (!m.dead) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); }
    const s = D.M.start, p = BAS.pylon(X, H, { x: s.x + 4, y: s.y - 3, angles: [Math.PI / 2, Math.PI, 0], period: 2.5, len: 8, spread: 0.4 }); D.me.x = s.x; D.me.y = s.y; const a0 = p.a; let previewed = false, closed = false, minOpen = 1; const t0 = performance.now();
    while (performance.now() - t0 < 3600) { await new Promise(r => requestAnimationFrame(r)); if (p.preview != null) previewed = true; minOpen = Math.min(minOpen, p.open); if (p.open < 0.3) closed = true; D.me.x = s.x; D.me.y = s.y; }
    return { a0, a1: p.a, ai: p.ai, previewed, closed, minOpen, pylons: BAS.pylons(X).length, srcs: C.sources.length, open: p.src.open }; });
  ok(pyl.previewed && pyl.closed && pyl.ai === 1 && Math.abs(pyl.a1 - Math.PI) < 0.01 && pyl.open, 'a pylon previews, closes its lid, swings to the next angle and opens', pyl);
  await shot('bas-mech-pylon');
  ok(!errors.length, 'no page errors', errors.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await T.browser.close(); process.exit(bad ? 1 : 0);
})();
