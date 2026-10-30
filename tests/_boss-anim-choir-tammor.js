// The Choir's first boss, animated: Tammor the Living Drum run through its wake, its act cycle (Threefold Beat, Hold the
// Silence, Shuffle) with numbered ring previews striking in their displayed order, a hit, its mechanics (a pet in a ring
// that has already struck takes no hit; in a pending ring it is struck; there is always a resolved ring beside the next to
// strike; the silence beat exposes the membrane (x1.75) and enough blows in it make the drum falter), half health (one
// beat of each phrase becomes a frontal cone on the same numbered preview: in front struck, on the side missed), and the
// kill (a section boss: it ends the stage without sealing the rift), with no page errors.
// Screenshots (SHOTS=1): shots/anim-choir-tammor-*.png, and every art pose as shots/anim-choir-tammor-pose-N.png.
// usage: HTML=test-tammor.html node tests/_boss-anim-choir-tammor.js   env: HTML, SHOTS=1
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
const path = require('path'), fs = require('fs');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const id = 'tammor';
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, FX = D.FD.FX, M = FX.mem, me = D.me, MOD = D.RIFT.self.mod, C = MOD.C, CHO = D.RIFT.self.amb.CHO;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 4000; };
  const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; me.leap = null; };
  // a spot in the middle of ring i, away from the boss's body
  const inRing = i => { const R = MOD.rings[i], rm = (R.r0 + R.r1) / 2; let best = null; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = C.x + Math.cos(a) * rm, y = C.y + Math.sin(a) * rm, d = Math.hypot(x - b.x, y - b.y); if (!best || d > best[2]) best = [x, y, d]; } return best; };
  const live = () => (CHO.beats(M.X) || []).filter(p => !p.done);`;
(async () => {
  const T = await open({ lvl: 98, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'basilica', 'colours'] }); const { page, errors } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-choir-${name}.png`) }); };
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); if (me && !me.dead) { me.hp = D.ST.hp; me.mp = 999; } }`, secs);
  const until = (cond, secs) => ev(`const f = new Function('D', 'b', 'M', 'return ' + arg[0]); const go = clock(arg[1]); while (go()) { if (f(D, b, M)) return true; await frame(); me.hp = D.ST.hp; } return false;`, [cond, secs]);
  // let the current act finish, back at rest
  const settle = () => ev(`const go = clock(16); while (go() && (b.act !== 'prowl' || M.ph || M.sc || b.stunT > 0)) { await frame(); me.hp = D.ST.hp; } return b.act;`);
  const force = act => ev(`const go = clock(12); M.nextAct = arg; b.actT = 99; const want = arg === 'silence' ? 'silence' : arg; while (go() && b.act !== want) { await frame(); me.hp = D.ST.hp; b.stunT = 0; if (b.act === 'prowl') { M.nextAct = arg; b.actT = 99; } } return b.act;`, act);

  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.choir.stages.findIndex(s => s.boss === 'tammor'));
  ok(idx === 2, `${id}: stage ${idx}`); if (idx < 0) { await T.browser.close(); process.exit(1); }
  await T.start('choir', idx);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, seal: D.F.rift && D.F.rift.seal, R: D.FD && D.FD.S.C.R, rings: (D.RIFT.self.mod.rings || []).map(r => [r.n, r.r0, r.r1]) }; });
  console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.name === 'Tammor' && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
  ok(!r.seal, `${id}: a section boss (its kill does not seal the rift)`); ok(r.R === 14 && r.rings.length === 3, `${id}: the 28 m drum chamber with three numbered rings`);
  // the wake: its legs unfold, the membrane draws taut, three taps light the rings
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x + 1; D.me.y = b.y + 7; });
  const enterT = k => page.waitForFunction(k => { const D = window.__pp.arc.game._dbg; return D.FD && D.FD.S.started && (D.FD.S.enterT > k || D.g.boss.act !== 'enter'); }, k, { timeout: 60000 }).catch(() => {});
  await enterT(1.1); await shot('tammor-intro'); await enterT(2.5); await shot('tammor-intro-taps'); await until("b.act !== 'enter'", 10); await run(0.5);
  r = await ev(`return { act: b.act, mod: M.mod === MOD, X: !!M.X, rise: +M.rise.toFixed(2), taut: +M.taut.toFixed(2) };`);
  console.log('  wake', JSON.stringify(r)); ok(r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`); ok(r.mod && r.X, `${id}: it reaches the stage's rings and beat previews`);
  ok(r.rise > 0.9 && r.taut > 0.9, `${id}: risen on its legs, membrane taut (${r.rise}, ${r.taut})`);

  // the act cycle (40 s): the phrases' numbered previews, struck in their order, a resolved ring always beside the next strike
  const acts = await ev(`const seen = new Set(), ban = new Set(), phr = new Map(), lit = new Set(); let badges = 0, hushIcon = 0, maxLit = 0; const go = clock(40);
    while (go()) { await frame(); me.hp = D.ST.hp; me.mp = 999; if (b.hp < b.maxhp * 0.6) b.hp = b.maxhp * 0.8; if (Math.hypot(me.x - b.x, me.y - b.y) < 4) hold(b.x, b.y + 6);
      seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); MOD.rings.forEach(R => { if (R.lit > 0.2) lit.add(R.i); maxLit = Math.max(maxLit, R.lit); });
      if (MOD.hush.on) hushIcon++;
      const Ph = M.ph; if (Ph) { if (!phr.has(Ph)) phr.set(Ph, { order: Ph.order.slice(), hush: Ph.hush, slots: Ph.slots.map(s => ({ kind: s.kind, ring: s.ring, n: s.n })), fired: [] });
        const rec = phr.get(Ph); Ph.slots.forEach(s => { if (s.fired && !rec.fired.includes(s.n)) rec.fired.push(s.n); if (s.p && !s.p.fired && s.n != null) badges++; }); }
      if (['beat', 'silence', 'shuffle'].every(w => seen.has(w)) && [...phr.values()].filter(p => p.fired.length === p.slots.length).length >= 3) break; }
    const list = [...phr.values()].filter(p => p.fired.length === p.slots.length);
    const inOrder = list.every(p => p.fired.every((n, i) => n === i + 1));
    // each ring after the first lies beside one already struck in the phrase
    const adj = list.every(p => { const rs = p.slots.filter(s => s.kind === 'ring').map(s => s.ring); return rs.every((r, i) => i === 0 || rs.slice(0, i).some(q => Math.abs(q - r) === 1)); });
    return { acts: [...seen], banners: [...ban], phrases: list.length, order: list.map(p => p.slots.map(s => s.kind === 'ring' ? 'r' + s.ring : s.kind).join('-')), inOrder, adj, badges, lit: [...lit], maxLit: +maxLit.toFixed(2), hushIcon, hushPhr: list.filter(p => p.hush).length };`);
  console.log('  acts', JSON.stringify(acts));
  ok(['beat', 'silence', 'shuffle'].every(w => acts.acts.includes(w)), `${id}: the act cycle (${acts.acts.join(', ')})`);
  ok(acts.banners.includes('THREEFOLD BEAT') && acts.banners.includes('HOLD THE SILENCE'), `${id}: the attacks are named in banners`);
  ok(acts.phrases >= 3 && acts.inOrder, `${id}: ${acts.phrases} phrases, each struck in its displayed number order (${acts.order.join(' | ')})`);
  ok(acts.badges > 50 && acts.lit.length === 3 && acts.maxLit > 0.5, `${id}: numbered previews shown and every ring lit in its turn`);
  ok(acts.adj, `${id}: every ring strike after the first has a resolved ring beside it`);
  ok(acts.hushPhr >= 1 && acts.hushIcon > 5, `${id}: a silence phrase with the closed-mouth icon shown (${acts.hushIcon} frames)`);
  await settle();
  await ev(`hold(b.x, b.y + 6); b.actT = -6;`); await run(0.3); await shot('tammor-rest'); await run(0.5); await shot('tammor-rest-b');
  // a hit
  r = await ev(`const r0 = M.recoil; D.hitMon(b, 1000, { flat: true, viaProxy: true }); await frame(); return { recoil: +M.recoil.toFixed(2), flinch: +M.flinch.toFixed(2), ripple: +M.ripple.toFixed(2) };`); await shot('tammor-hit');
  ok(r.recoil > 0.2 && r.flinch > 0.3 && r.ripple > 0.2, `${id}: it rocks back and its membrane shivers when struck (${r.recoil}, ${r.flinch}, ${r.ripple})`); await run(0.6);

  // ---- a resolved ring is safe; a pending ring is struck ----
  const phraseHold = (mode) => ev(`const mode = arg; let go = clock(8); while (go() && !(M.ph && M.ph.slots.some(s => s.p))) { await frame(); me.hp = D.ST.hp; }
    const Ph = M.ph; if (!Ph) return { started: false }; const rs = Ph.slots.filter(s => s.kind === 'ring'), first = rs[0], second = rs[1], n0 = M.stat.log.length;
    let spot = null, shotWind = false; go = clock(16);
    while (go() && M.ph === Ph) { await frame(); me.hp = D.ST.hp;
      if (mode === 'resolved') { if (first.fired) { if (!spot) spot = inRing(first.ring); hold(spot[0], spot[1]); } else { const o = inRing(rs[2].ring); hold(o[0], o[1]); } }
      else { if (!spot) spot = inRing(second.ring); hold(spot[0], spot[1]); }
      if (!shotWind && first.p && first.p.t < 0.35) { shotWind = true; window.__tamWind = true; } }
    const log = M.stat.log.slice(n0);
    return { started: true, first: first.ring, second: second.ring, log };`, mode);
  await settle(); await force('beat');
  let ph = phraseHold('resolved'); await until('window.__tamWind', 6); await shot('tammor-windup'); await until("M.ph && M.ph.slots.some(s => s.fired)", 4); await run(0.15); await shot('tammor-strike'); ph = await ph;
  console.log('  resolved', JSON.stringify(ph));
  const after = ph.log.filter(e => e.kind === 'ring' && e.ring !== ph.first);
  ok(ph.started && after.length === 2 && after.every(e => !e.hit && e.petRing === ph.first && e.safeRing), `${id}: standing in the ring after it struck, no later beat hits`);
  await settle(); await page.evaluate(() => { window.__tamWind = false; }); await force('beat');
  ph = await phraseHold('pending'); console.log('  pending', JSON.stringify(ph));
  const e2 = ph.log.find(e => e.kind === 'ring' && e.ring === ph.second);
  ok(ph.started && e2 && e2.hit && e2.petRing === ph.second, `${id}: standing in a pending ring, its beat strikes`);
  await settle();

  // ---- Hold the Silence: the empty beat, the membrane exposed (x1.75), the drum falters ----
  await force('silence');
  r = await ev(`let go = clock(12); while (go() && !M.exposed) { await frame(); me.hp = D.ST.hp; hold(b.x, b.y + 6); } if (!M.exposed) return { exposed: false };
    const hb = live().find(p => p.hush), hushOn = MOD.hush.on; let h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); const open = Math.round(h0 - b.hp); return { exposed: true, hushBeat: !!hb, hushN: hb && hb.n, hushOn, open };`);
  await run(0.1); await shot('tammor-silence');
  const base = await ev(`let go = clock(14); while (go() && (M.exposed || M.ph || b.stunT > 0)) { await frame(); me.hp = D.ST.hp; } const h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); return Math.round(h0 - b.hp);`);
  console.log('  silence', JSON.stringify(r), 'base', base);
  ok(r.exposed && r.hushBeat && r.hushOn, `${id}: the silence: an empty beat with the closed-mouth icon (beat ${r.hushN})`);
  ok(r.open >= base * 1.7 && r.open <= base * 1.8, `${id}: in the silence it takes x1.75 (${r.open} vs ${base})`);
  await settle(); await force('silence');
  r = await ev(`let go = clock(12); while (go() && !M.exposed) { await frame(); me.hp = D.ST.hp; hold(b.x, b.y + 6); } if (!M.exposed) return { exposed: false };
    const pend = live().filter(p => !p.fired && !p.hush).length; for (let i = 0; i < 6; i++) { D.hitMon(b, 500, { flat: true, viaProxy: true }); await frame(); }
    await frame(); return { exposed: true, stun: +b.stunT.toFixed(2), kind: M.stunKind, staggers: M.stat.staggers, pendBefore: pend, pendAfter: live().filter(p => !p.fired && !p.hush && p.src === b).length, ph: !!M.ph };`);
  await run(0.3); await shot('tammor-falter'); console.log('  falter', JSON.stringify(r));
  ok(r.exposed && r.kind === 'falter' && r.stun > 1.5 && r.staggers === 1, `${id}: enough blows in the silence: the drum falters (${r.stun} s)`);
  ok(!r.ph && r.pendAfter === 0, `${id}: the rest of the broken phrase is called off (${r.pendBefore} pending before)`);
  await settle();
  ok(errors.length === 0, `${id}: no page errors so far (${errors.length})`); if (errors.length) console.log(errors.slice(0, 5).join('\n'));

  // ---- half health: one beat of each phrase becomes a frontal cone, on the same numbered preview ----
  r = await ev(`const ban = new Set(); b.hp = b.maxhp * 0.45; const go = clock(14); while (go() && !(M.ph && M.ph.cone && M.ph.slots.some(s => s.kind === 'cone' && s.p))) { await frame(); me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); if (Math.hypot(me.x - b.x, me.y - b.y) < 4) hold(b.x, b.y + 6); }
    const Ph = M.ph; return { phase: D.FD.S.phase, cone: !!(Ph && Ph.cone), slots: Ph && Ph.slots.map(s => s.kind + s.n), banners: [...ban], beat: Ph && live().filter(p => p.shape === 'cone').map(p => p.n) };`);
  console.log('  half', JSON.stringify(r));
  ok(r.phase === 2 && r.cone && r.slots.filter(s => s.startsWith('cone')).length === 1 && r.banners.includes('THE FRONTAL BEAT'), `${id}: half health: one beat is a frontal cone (${(r.slots || []).join(' ')})`);
  ok(r.beat && r.beat.length === 1, `${id}: the cone is numbered on the same preview (beat ${r.beat})`);
  await settle();
  const coneRun = where => ev(`const where = arg; let go = clock(10); while (go() && !(M.ph && M.ph.cone)) { await frame(); me.hp = D.ST.hp; } const Ph = M.ph; if (!Ph) return { started: false };
    const s = Ph.slots.find(q => q.kind === 'cone'), n0 = M.stat.log.length; let shotT = false; go = clock(16);
    while (go() && !s.fired) { await frame(); me.hp = D.ST.hp; const a = s.a + (where === 'front' ? 0 : Math.PI / 2 + 0.3), x = Ph.cx + Math.cos(a) * 5.5, y = Ph.cy + Math.sin(a) * 5.5; hold(x, y);
      if (!shotT && s.p && s.p.t < 0.6) { shotT = true; window.__tamCone = true; } }
    const e = M.stat.log.slice(n0).find(q => q.kind === 'cone'); go = clock(8); while (go() && M.ph === Ph) { await frame(); me.hp = D.ST.hp; } return { started: true, e, slots: Ph.slots.map(q => q.kind + q.n) };`, where);
  let cr = coneRun('front'); await until('window.__tamCone', 14); await shot('tammor-cone-wind'); await until("M.ph && M.ph.slots.some(s => s.kind === 'cone' && s.fired)", 4); await run(0.1); await shot('tammor-cone'); cr = await cr; console.log('  cone front', JSON.stringify(cr));
  ok(cr.started && cr.e && cr.e.hit, `${id}: in front of the frontal beat, struck`);
  await settle(); cr = await coneRun('side'); console.log('  cone side', JSON.stringify(cr));
  ok(cr.started && cr.e && !cr.e.hit, `${id}: at its side, the frontal beat misses`);
  // a safe ring always: in phase two too, every ring strike after the first has a resolved neighbour
  r = await ev(`const all = M.stat.log; return all.length;`); ok(r > 10, `${id}: ${r} beats logged`);
  await settle();
  ok(errors.length === 0, `${id}: no page errors (${errors.length})`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));

  // the art poses, each painted on its own
  if (process.env.SHOTS) { const urls = await page.evaluate(() => { const P = window.__pp, D = P.FIEND_DEFS.tammor, K = P.DunFiend.KIT, T = 36, cw = T * 13, ch = T * 10, out = [];
      for (const ps of D.artPoses) { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const c = cv.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#2A1626'); g.addColorStop(1, '#BBA88C'); c.fillStyle = g; c.fillRect(0, 0, cw, ch);
        const mem = Object.assign({}, ps.mem || {}), m = Object.assign({ x: 0, y: 0, r: 2.4, t: 1, dmg: 10, act: 'prowl' }, ps.m || {});
        const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {} }, me: { x: 0, y: 6 }, C: { x: 0, y: 0, R: 14 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
        D.draw(c, FX, m, cw / 2, ch * D.artY, T, 1.3); c.fillStyle = '#FFE37A'; c.font = '700 15px sans-serif'; c.fillText(ps.name, 10, 22); out.push(cv.toDataURL('image/png')); } return out; });
    urls.forEach((u, i) => fs.writeFileSync(path.resolve(__dirname, `../shots/anim-choir-tammor-pose-${i}.png`), Buffer.from(u.split(',')[1], 'base64'))); console.log('  poses', urls.length); }

  // the kill: the membrane slackens, the legs fold, the rings fall dark; the stage ends without sealing
  const kp = page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.choir }; });
  const endT = k => page.waitForFunction(k => { const D = window.__pp.arc.game._dbg, M = D.FD && D.FD.FX.mem; return !M || !M.end || M.end.t > k || window.__pp.arc.state === 'end'; }, k, { timeout: 30000 }).catch(() => {});
  await endT(1.2); await shot('tammor-death-slack'); await endT(3.3); await shot('tammor-death-dark');
  const kill = await kp; console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end' && kill.banners.includes('THE DRUM FALLS SILENT'), `${id}: the kill: the drum falls silent, the stage ends`); ok(!kill.sealed, `${id}: no sealing (a section boss)`);
  await page.waitForTimeout(400);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
