// The Basilica's second boss, animated: Thessarym the Veil Serpent (stage 5, The Reliquary). Its wake (the ring rising
// out of the floor), the act cycle (Passing Judgement, Unveiling, slithering between places round the rim), Passing
// Judgement (numbered segment eyes open; their gaze lanes fire in that order; a pet in a lane is judged, one outside
// every lane is not), the weak points (the open red eye x1.75, open segment eyes x1.4), Unveiling (the beam locks onto
// the pet, FREEZES, fires; a pet in the open is burnt, a pet behind a screen moved into the beam is not: the head REELS,
// its red eye x2), half health (THE TAIL SWEEP: the tail lashes round the ring while the beam charges; a pet in the open
// is struck, one in a screen's lee is not), the art poses (a sheet, SHOTS=1), and the kill (a section boss: the stage
// ends, no sealing), with no page errors. Screenshots into shots/anim-basilica-thessarym-*.png.
// usage: HTML=test-thessarym.html node tests/_boss-anim-basilica-thessarym.js   env: SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path'), fs = require('fs');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const id = 'thessarym', STAGE = 5;
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, me = D.me, C = FX.C, W = () => D.FD.S.weak, BAS = window.__pp.BAS || D.RIFT.self.amb.BAS, scr = D.RIFT.self.mod.screens;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 4000; };
  const hold = () => { me.hp = D.ST.hp; me.mp = 999; if (BAS.calcify) { BAS.calcify.k = 0; BAS.calcify.rooted = 0; } };
  const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
  const live = o => !!(o && !o.dead);`;
(async () => {
  const T = await open({ lvl: 92, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors } = T;
  fs.mkdirSync(path.resolve(__dirname, '../shots'), { recursive: true });
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-basilica-thessarym-${name}.png`) }); };
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); if (me && !me.dead) hold(); }`, secs);
  const until = (cond, secs) => ev(`const f = new Function('D', 'b', 'M', 'me', 'return ' + arg[0]); const go = clock(arg[1]); while (go()) { if (f(D, b, M, me)) return true; await frame(); hold(); } return false;`, [cond, secs]);
  // force the next act (taken when it has slithered to its place)
  const force = act => ev(`b.stunT = 0; if (b.act !== 'slither') { M.J = null; M.U = null; M.SW = null; b.act = 'slither'; b.actT = 0; } let go = clock(14); while (go() && b.act !== arg) { await frame(); hold(); b.stunT = 0; if (b.act === 'slither') { M.nextAct = arg; M.wait = 0; } } return b.act;`, act);
  const settle = () => ev(`const go = clock(14); while (go() && (b.act !== 'slither' || b.stunT > 0 || M.J || M.U || M.SW)) { await frame(); hold(); } return b.act;`);

  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.basilica.stages.findIndex(s => s.boss === 'thessarym'));
  ok(idx === STAGE, `${id}: stage ${idx}`);
  await T.start('basilica', idx);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, seal: D.F.rift && D.F.rift.seal, R: D.FD && D.FD.S.C.R, screens: D.RIFT.self.mod.screens.length }; });
  console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.name === 'Thessarym' && r.phases === 2 && r.R === 16 && r.screens === 2 && !r.seal, `${id}: a fiend fight (${r.bars} bars, ${r.phases} phases) in the 32 m reliquary with its two screens`);
  // the wake: the ring rises out of the floor
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss || D.M.bossAt; D.me.x = b.x + 1; D.me.y = b.y + 6; });
  await until('D.g.boss && D.g.boss.act === "enter" && M.rise > 0.35', 15); await shot('rise'); await until('b.act !== "enter"', 15); await run(1.0);
  r = await ev(`return { act: b.act, rise: +M.rise.toFixed(2), chain: M.chain.length };`); console.log('  wake', JSON.stringify(r)); ok(r.act !== 'enter' && r.rise > 0.95 && r.chain === 9, `${id}: awake, risen (${r.act})`);
  await ev(`pin(b.x + 1.5, b.y + 6);`); await run(0.1); await shot('idle'); await run(0.4); await ev(`pin(b.x + 1.5, b.y + 6);`); await run(0.05); await shot('idle-b');
  // the act cycle (40 s, the pet kept near)
  let acts = await ev(`const seen = new Set(), ban = new Set(); let laneIn = 0, homes = new Set(); const go = clock(40); while (go()) { await frame(); hold(); b.stunT = 0; if (b.hp < b.maxhp * 0.6) b.hp = b.maxhp * 0.8; seen.add(b.act); homes.add(M.home); D.banners.forEach(x => ban.add(x.s)); if (Math.hypot(me.x - b.x, me.y - b.y) > 11) pin(b.x + (C.x - b.x) * 0.5, b.y + (C.y - b.y) * 0.5); if (seen.has('judge') && seen.has('unveil') && seen.has('recoil') && homes.size >= 3) break; } return { acts: [...seen], banners: [...ban], homes: [...homes] };`);
  console.log('  acts', JSON.stringify(acts)); ok(['judge', 'unveil', 'slither'].every(a => acts.acts.includes(a)), `${id}: the act cycle (${acts.acts.join(', ')})`);
  ok(acts.banners.includes('PASSING JUDGEMENT') && acts.banners.includes('UNVEILING'), `${id}: the attacks are named in banners`);
  ok(acts.homes.length >= 2, `${id}: it slithers between its places (${acts.homes.join(',')})`);
  await settle();

  // ---- Passing Judgement: in a lane, then out of every lane ----
  const judge = mode => ev(`const mode = arg; let go = clock(4); while (go() && !(M.J && M.J.t > 0.1)) { await frame(); hold(); } const J = M.J; if (!J) return { started: false };
    const s0 = { ...M.stat, order: M.stat.order.slice() }; const L0 = J.lanes[0], ca = Math.cos(L0.a), sa = Math.sin(L0.a); let spot = { x: L0.x + ca * 7, y: L0.y + sa * 7 };
    const inAny = (x, y, pad) => J.lanes.some(L => { const c2 = Math.cos(L.a), s2 = Math.sin(L.a), rx = x - L.x, ry = y - L.y, al = rx * c2 + ry * s2, of = Math.abs(-rx * s2 + ry * c2); return al > 0 && al < L.len && of < L.w / 2 + pad; });
    if (mode === 'out') { spot = null; for (let d = 4; d < 13 && !spot; d += 0.5) for (let k = 0; k < 24 && !spot; k++) { const a = k / 24 * Math.PI * 2, x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d; if (FX.inArena(x, y, 1.5) && !inAny(x, y, 1.2)) spot = { x, y }; } }
    const nums = J.lanes.map(L => L.num), opened = new Set(); let maxEyes = 0, eyeWk = 0, segWk = 0;
    go = clock(10); while (go() && M.J === J) { await frame(); hold(); pin(spot.x, spot.y); maxEyes = Math.max(maxEyes, M.segEye.filter(v => v > 0.5).length); M.segNum.forEach(n => n && opened.add(n)); if (live(W().eye)) eyeWk++; if (Object.keys(W()).some(k => k.startsWith('seg') && live(W()[k]))) segWk++; }
    return { started: true, n: J.n, nums, order: M.stat.order.slice(s0.order.length), hit: M.stat.laneHit - s0.laneHit, miss: M.stat.laneMiss - s0.laneMiss, maxEyes, opened: opened.size, eyeWk, segWk };`, mode);
  await force('judge');
  const jShot = until('M.J && M.J.t > 1.2', 4); let jd = judge('in'); await jShot; await shot('judge-lanes'); await until('M.J && M.J.lanes.some(L => L.st === "hot")', 4); await shot('judge-fire'); await until('M.J && M.J.lanes.filter(L => L.st === "closed").length >= 2', 5); await shot('judge-closed'); jd = await jd;
  console.log('  judge in', JSON.stringify(jd));
  ok(jd.started && jd.n === 4 && jd.opened === 4 && jd.maxEyes >= 3, `${id}: Passing Judgement: ${jd.n} segment eyes open, numbered (${jd.opened} numbers shown)`);
  ok(JSON.stringify(jd.order) === JSON.stringify([1, 2, 3, 4]), `${id}: their lanes fire in numbered order (${jd.order.join(' > ')})`);
  ok(jd.hit >= 1, `${id}: a pet standing in lane 1 is judged (${jd.hit} hit, ${jd.miss} missed)`);
  ok(jd.eyeWk > 0 && jd.segWk > 0, `${id}: the red eye and the open segment eyes are weak points while it judges`);
  await settle(); await force('judge'); jd = await judge('out'); console.log('  judge out', JSON.stringify(jd)); ok(jd.started && jd.hit === 0 && jd.miss === 4, `${id}: a pet outside every lane is never judged`);
  // the weak points' multipliers (taken while the eyes are open)
  await settle(); await force('judge');
  let wk = await ev(`let go = clock(4); while (go() && !(live(W().eye) && Object.keys(W()).some(k => k.startsWith('seg') && live(W()[k])))) { await frame(); hold(); }
    const out = {}; const e = W().eye, sk = Object.keys(W()).find(k => k.startsWith('seg') && live(W()[k])); let h0 = b.hp; if (live(e)) { D.hitMon(e, 1000, { flat: true }); out.eye = Math.round(h0 - b.hp); } h0 = b.hp; if (sk) { D.hitMon(W()[sk], 1000, { flat: true }); out.seg = Math.round(h0 - b.hp); } h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); return out;`);
  console.log('  weak', JSON.stringify(wk)); ok(wk.eye >= wk.body * 1.7 && wk.seg >= wk.body * 1.35 && wk.body > 0, `${id}: the open red eye takes ${wk.eye}, an open segment eye ${wk.seg}, the body ${wk.body}`);
  await settle();

  // ---- Unveiling: the beam locks on, freezes and fires; a screen moved into it blocks it, and the head reels ----
  const unveil = mode => ev(`const mode = arg; let go = clock(4); while (go() && !(M.U && M.U.st === 'open')) { await frame(); hold(); } const U = M.U; if (!U) return { started: false }; const s0 = { ...M.stat };
    const h = { x: M.chain[0][0], y: M.chain[0][1] }; let spot = null, moved = null;
    if (mode === 'screen') { let best = null; scr.forEach((s, si) => s.stops.forEach((st, i) => { const dx = st[0] - h.x, dy = st[1] - h.y, d = Math.hypot(dx, dy), x = st[0] + dx / d * 1.4, y = st[1] + dy / d * 1.4, cost = (i === s.i ? 99 : Math.abs(i - s.i)) + (FX.inArena(x, y, 1.2) ? 0 : 99) + (d < 4 ? 99 : 0); if (!best || cost < best.cost) best = { si, i, x, y, cost }; })); moved = { si: best.si, from: scr[best.si].i, to: best.i }; scr[best.si].goTo(best.i); spot = { x: best.x, y: best.y }; }
    else { spot = null; for (let d = 6; d < 12 && !spot; d += 0.5) for (let k = 0; k < 24 && !spot; k++) { const a = k / 24 * Math.PI * 2, x = h.x + Math.cos(a) * d, y = h.y + Math.sin(a) * d, src = { x: h.x, y: h.y, len: 30 }; if (FX.inArena(x, y, 1.5) && !BAS.inShadow(x, y, src) && Math.abs(x - C.x) < 3) spot = { x, y }; } }
    let frozenA = null, aLock = [], blockedSeen = false; go = clock(9); while (go() && M.U === U) { await frame(); hold(); pin(spot.x, spot.y); if (U.st === 'lock') aLock.push(U.a); if (U.st === 'frozen' && frozenA == null) frozenA = U.a; if (U.st === 'fire' && frozenA != null && Math.abs(U.a - frozenA) > 1e-6) frozenA = 'moved'; if (U.st === 'fire' && BAS.inShadow(me.x, me.y, U.src)) blockedSeen = true; }
    const g2 = clock(0.3); while (g2()) { await frame(); hold(); pin(spot.x, spot.y); }
    return { started: true, moved, frozen: frozenA !== 'moved' && frozenA != null, tracked: aLock.length > 2 && Math.abs(aLock[aLock.length - 1] - aLock[0]) >= 0, ticks: M.stat.beamTicks - s0.beamTicks, blocked: M.stat.blocked - s0.blocked, reels: M.stat.reels - s0.reels, blockedSeen, stun: +b.stunT.toFixed(2), kind: M.stunKind, sweeps: M.stat.sweeps - s0.sweeps, swHit: M.stat.sweepHit - s0.sweepHit, swShadow: M.stat.sweepShadow - s0.sweepShadow };`, mode);
  await force('unveil');
  const uLock = until('M.U && M.U.st === "lock" && M.U.t > 0.8', 4), uFire = until('M.U && M.U.st === "fire" && M.U.t > 0.5', 6);
  let uv = unveil('open'); await uLock; await shot('unveil-lock'); await uFire; await shot('unveil-fire'); uv = await uv; console.log('  unveil open', JSON.stringify(uv));
  ok(uv.started && uv.frozen && uv.ticks >= 3 && uv.reels === 0, `${id}: Unveiling: the beam locks on, FREEZES and fires; a pet in the open is burnt (${uv.ticks} ticks)`);
  await settle(); await force('unveil');
  const sFire = until('M.U && M.U.st === "fire" && M.U.t > 0.6', 7);
  uv = unveil('screen'); await sFire; await shot('unveil-screen'); await until('b.stunT > 0.6', 3); await shot('reel'); uv = await uv; console.log('  unveil screen', JSON.stringify(uv));
  ok(uv.started && uv.frozen && uv.blockedSeen && uv.ticks === 0 && uv.moved && uv.moved.from !== uv.moved.to, `${id}: a screen moved into the frozen beam (screen ${uv.moved && uv.moved.si}: stop ${uv.moved && uv.moved.from} > ${uv.moved && uv.moved.to}) blocks it: no damage`);
  ok(uv.blocked === 1 && uv.reels === 1 && uv.kind === 'reel', `${id}: the beam fully blocked, the head REELS`);
  wk = await ev(`let go = clock(2); while (go() && !(b.stunT > 0 && live(W().eye))) { await frame(); hold(); } const out = {}; let h0 = b.hp; if (live(W().eye)) { D.hitMon(W().eye, 1000, { flat: true }); out.eye = Math.round(h0 - b.hp); } h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); out.stun = b.stunT; return out;`);
  console.log('  reel', JSON.stringify(wk)); ok(wk.eye >= 1900 && wk.body >= 1400, `${id}: while it reels the red eye takes ${wk.eye} (x2) and the body ${wk.body} (x1.5)`);
  await settle();

  // ---- half health: THE TAIL SWEEP while the beam charges ----
  r = await ev(`const ban = new Set(); b.stunT = 0; b.hp = b.maxhp * 0.45; const go = clock(5); while (go() && D.FD.S.phase < 2) { await frame(); hold(); } const g2 = clock(2.5); while (g2()) { await frame(); hold(); D.banners.forEach(x => ban.add(x.s)); } return { phase: D.FD.S.phase, banners: [...ban] };`);
  console.log('  phase 2', JSON.stringify(r)); ok(r.phase === 2 && r.banners.includes('THE TAIL SWEEP'), `${id}: half health: THE TAIL SWEEP`);
  await settle(); await force('unveil');
  const swShot = until('M.SW && M.SW.t > M.SW.show + 0.4', 6);
  uv = unveil('open'); await swShot; await shot('sweep'); uv = await uv; console.log('  sweep open', JSON.stringify(uv));
  ok(uv.sweeps === 1 && uv.swHit === 1, `${id}: the tail sweeps the ring while the beam charges and strikes a pet in the open`);
  await settle(); await force('unveil');
  uv = await unveil('screen'); console.log('  sweep screen', JSON.stringify(uv));
  ok(uv.sweeps === 1 && uv.swHit === 0 && uv.swShadow === 1 && uv.ticks === 0, `${id}: in a screen's lee the pet is safe from both the sweep and the beam`);
  await settle();
  acts = await ev(`const seen = new Set(); let sweeps = M.stat.sweeps; const go = clock(40); while (go()) { await frame(); hold(); b.stunT = 0; if (b.hp < b.maxhp * 0.2) b.hp = b.maxhp * 0.4; seen.add(b.act); if (Math.hypot(me.x - b.x, me.y - b.y) > 11) pin(b.x + (C.x - b.x) * 0.5, b.y + (C.y - b.y) * 0.5); if (seen.has('judge') && M.stat.sweeps > sweeps) break; } return { acts: [...seen], sweeps: M.stat.sweeps - sweeps, n: M.stat.order.length };`);
  console.log('  acts p2', JSON.stringify(acts)); ok(acts.acts.includes('judge') && acts.sweeps >= 1, `${id}: phase two's cycle: judgement and the sweep with the beam`);
  await settle();
  r = await ev(`await (async () => { M.nextAct = 'judge'; const go = clock(14); while (go() && !M.J) { await frame(); hold(); if (b.act === 'slither') { M.nextAct = 'judge'; M.wait = 0; } } })(); return { n: M.J && M.J.n };`); ok(r.n === 5, `${id}: phase two judges with five eyes`);
  await settle();

  // ---- the art poses: a sheet ----
  if (process.env.SHOTS) { const url = await page.evaluate(() => { const P = window.__pp, D = P.FIEND_DEFS.thessarym, K = P.DunFiend.KIT, T = 46, cw = T * 9, ch = T * 7, cols = 2, poses = D.artPoses, rows = Math.ceil(poses.length / cols);
      const cv = document.createElement('canvas'); cv.width = cw * cols; cv.height = ch * rows; const c = cv.getContext('2d'), errs = [];
      poses.forEach((ps, i) => { const x = (i % cols) * cw, y = Math.floor(i / cols) * ch; const g = c.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, '#CFC7B0'); g.addColorStop(1, '#B8B09A'); c.fillStyle = g; c.fillRect(x, y, cw, ch);
        const mem = Object.assign({ bt: 1.3 + i * 0.7 }, JSON.parse(JSON.stringify(ps.mem || {}))), m = { x: 0, y: 0, r: 2.4, t: 1, dmg: 10, act: 'slither', hitSq: 0 };
        const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {} }, me: { x: 0, y: 5 }, C: { x: 0, y: 0, R: 16 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
        c.save(); try { D.draw(c, FX, m, x + cw / 2, y + ch * D.artY, T, 1.3); } catch (e) { errs.push(ps.name + ': ' + e.message); } c.restore();
        c.fillStyle = '#1A1A1E'; c.font = '700 15px sans-serif'; c.fillText(ps.name, x + 8, y + 20); });
      window.__artErrs = errs; return cv.toDataURL('image/png'); });
    fs.writeFileSync(path.resolve(__dirname, '../shots/anim-basilica-thessarym-poses.png'), Buffer.from(url.split(',')[1], 'base64'));
    const ae = await page.evaluate(() => window.__artErrs); ok(!ae.length, `${id}: every art pose paints (${ae.join('; ')})`); }

  const e1 = errors.length; ok(e1 === 0, `${id}: no page errors (${e1})`); if (e1) console.log(errors.slice(0, 6).join('\n'));
  // the kill (a section boss: it ends the stage without sealing the rift)
  const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); let shotAt = null; while (performance.now() - t0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (!shotAt && D.FD.FX.mem.end && D.FD.FX.mem.end.t > 2.2) { shotAt = 1; break; } } return { state: P.arc.state, banners: [...ban], end: !!D.FD.FX.mem.end }; });
  await shot('death');
  const fin = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D && D.banners) D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.basilica }; });
  console.log('  kill', JSON.stringify(kill), JSON.stringify(fin)); ok(kill.end && fin.state === 'end', `${id}: the kill: its eyes close one by one, the stone settles, and the stage ends`); ok(!fin.sealed, `${id}: no sealing (a section boss)`);
  await page.waitForTimeout(400);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
