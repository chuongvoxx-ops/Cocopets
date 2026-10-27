// The Library of Unwritten Lives' first boss, animated: Syllax the Bookwyrm run through its wake, a full act cycle, a
// hit, its mechanics (Sentence Break: the Missing Word's lane is safe and the rest of the line hurts; from half health
// two lines in the order their dots give; Errata: only the genuine head bites, the copy's cone is harmless and one hit
// pops the copy; a missed Cover Snap sticks it in the floor, its gold eye bared), the Unbinding (its pages swarm while
// it is out of reach; torn pages leave it MISBOUND), phase two and its minions, and the kill (a section boss's kill ends
// its stage; only the last seals the rift), with no page errors; screenshots (SHOTS=1) into shots/anim-library-<boss>*.png.
// usage: node tests/_boss-anim-library-syllax.js [syllax]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { syllax: ['sentence', 'bite', 'lash', 'errata'] };
const WANT_A = { syllax: ['sentence', 'bite', 'lash', 'errata'] }, WANT_B = { syllax: ['sentence', 'errata', 'bite', 'lash'] };
const NAMES = { syllax: 'Syllax' };
const MINIONS = { syllax: ['loosepage', 'marginworm'] };
const WEAK = { syllax: 'eye' };
const IDLE = { syllax: 'crawl' };
const LAST = null;   // (the boss whose kill seals the rift; none of these yet)
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(WANT);
  const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, errors, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-library-${name}.png`) }); };
  // force the next act: it is taken at the crawl's next choice
  const force = (act, idle, waitAct, extraMs) => page.evaluate(async ([act, idle, waitAct, extraMs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; M.nextAct = act; M.lashWait = 0; b.stunT = 0; b.act = idle; b.actT = 9; const t0 = performance.now(); while (performance.now() - t0 < 8000 && b.act !== waitAct) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; b.stunT = 0; if (b.act === idle) { M.nextAct = act; M.lashWait = 0; b.actT = 9; } } const t1 = performance.now(); while (performance.now() - t1 < extraMs) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return b.act; }, [act, idle, waitAct, extraMs]);
  // wait (holding the pet's hp) until a condition on (D, b, M) holds
  const until = (cond, ms) => page.evaluate(async ([cond, ms]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, f = new Function('D', 'b', 'M', 'return ' + cond); const t0 = performance.now(); while (performance.now() - t0 < ms) { if (f(D, b, M)) return true; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return false; }, [cond, ms]);
  const settle = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const t0 = performance.now(); while (performance.now() - t0 < 6000 && (M.lines || M.bite || M.ls || M.er || b.act !== 'crawl')) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; b.stunT = 0; } return b.act; });
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.library ? R.library.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 2, `${id}: stage ${idx}`); if (idx < 0) continue;
    await T.start('library', idx);
    // the fiend: its definition, name and bars
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    ok(!r.seal, `${id}: a section boss (its kill does not seal the rift)`);
    // the wake and the intro
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 6; });
    await run(0.5); await shot(id + '-intro'); await run(0.9); await shot(id + '-intro-land');
    await run(4.6);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`);
    // the Reading Circle: 28 m across, shelves round its far rim, low stacks along its near one
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, S = D.FD.S; return { R: S.C.R, cases: S.props.filter(p => p.kind === 'case').length, low: S.props.filter(p => p.kind !== 'case').length, segs: 5 }; });
    console.log('  arena', JSON.stringify(r)); ok(r.R > 13 && r.R < 14.5 && r.cases >= 10 && r.low >= 4, `${id}: the Reading Circle (${(r.R * 2).toFixed(1)} m, ${r.cases} bookcases)`);
    // the act cycle: the pet kept close
    const cycle = (want, secs) => page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, seen = new Set(), ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.stunT > 0) b.stunT = 0; if (b.hp < b.maxhp * 0.55 && D.FD.S.phase < 2) b.hp = b.maxhp * 0.8; if (Math.hypot(D.me.x - b.x, D.me.y - b.y) > 6.5) { const p = { x: b.x + 3.0, y: b.y + 2.6 }; const dx = p.x - D.FD.FX.C.x, dy = p.y - D.FD.FX.C.y, d = Math.hypot(dx, dy); if (d > D.FD.FX.C.R - 2) { p.x = D.FD.FX.C.x + dx / d * (D.FD.FX.C.R - 2); p.y = D.FD.FX.C.y + dy / d * (D.FD.FX.C.R - 2); } D.me.x = p.x; D.me.y = p.y; } seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [want, secs]);
    let acts = await cycle(WANT_A[id], 75);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT_A[id].every(w => acts.acts.includes(w)), `${id}: the act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners`);
    await settle();
    // two shots 0.4 s apart while it crawls (the pose should change between them)
    const idleShots = async (idle, tag) => { await page.evaluate(async idle => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = D.FD.FX.C.x; D.me.y = D.FD.FX.C.y + 6; const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(b.act === idle && b.actT > 0.8 && performance.now() - t0 > 2500)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === idle) b.actT = Math.min(b.actT, 1.0); } }, idle);
      const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x + 1.2; D.me.y = b.y + 4.4; D.me.vx = D.me.vy = 0; });
      await near(); await run(0.05); await shot(id + tag); await run(0.35); await near(); await run(0.05); await shot(id + tag + '-b'); };
    await idleShots(IDLE[id], '');
    await page.evaluate(() => { window.__pp.arc.game._dbg.g.taps = 0; });
    // ---- Sentence Break: the Missing Word's lane is safe, the rest of the line hurts ----
    const lineRun = (where) => page.evaluate(async where => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; const t0 = performance.now(); while (performance.now() - t0 < 3000 && !M.lines) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      if (!M.lines) return null; const L = M.lines[0], s0 = { ...M.stat }, o = where === 'gap' ? L.gapC : L.gapC + (L.gapC > 0 ? -4.6 : 4.6), s = 1.0, px = C.x + L.d[0] * s + L.e[0] * o, py = C.y + L.d[1] * s + L.e[1] * o; let shown = false;
      const t1 = performance.now(); while (performance.now() - t1 < 9000 && !(L.passed || L.hit || L.done)) { await new Promise(r => requestAnimationFrame(r)); D.me.x = px; D.me.y = py; D.me.vx = D.me.vy = 0; D.me.dodge = 0; D.me.hp = D.ST.hp; b.stunT = 0; if (L.run) shown = true; }
      return { n: M.lines ? M.lines.length : 0, gapW: L.gapW, gapC: +L.gapC.toFixed(1), hit: L.hit, passed: L.passed, inGap: L.inGap, lineHit: M.stat.lineHit - s0.lineHit, gapSafe: M.stat.gapSafe - s0.gapSafe, shown }; }, where);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x; D.me.y = C.y + 3; });
    let w = await force('sentence', IDLE[id], 'sentence', 500); console.log('  wind-up', w); await shot(id + '-sentence-shown');
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, C = D.FD.FX.C; const L = M.lines && M.lines[0]; if (!L) return; const t0 = performance.now(); while (performance.now() - t0 < 4000 && !(L.run && L.s > -3)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + L.d[0] * 3 + L.e[0] * L.gapC; D.me.y = C.y + L.d[1] * 3 + L.e[1] * L.gapC; } });
    await shot(id + '-sentence-run');
    let ln = await lineRun('gap'); console.log('  gap', JSON.stringify(ln)); ok(ln && ln.n === 1 && ln.passed && !ln.hit && ln.inGap && ln.gapSafe === 1 && ln.lineHit === 0, `${id}: standing in the Missing Word's lane, the line passes round the pet (gap ${ln && ln.gapW} m)`);
    await shot(id + '-sentence-pass'); await settle();
    w = await force('sentence', IDLE[id], 'sentence', 0);
    ln = await lineRun('off'); console.log('  off', JSON.stringify(ln)); ok(ln && ln.hit && ln.lineHit === 1 && !ln.inGap, `${id}: off the lane, the sentence strikes`);
    await settle();
    // ---- Cover Snap: the jaws gape first; a miss sticks it in the floor, its gold eye bared ----
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 0.6; D.me.y = b.y + 4.2; });
    w = await force('bite', IDLE[id], 'bite', 260); console.log('  wind-up', w);
    r = await page.evaluate(() => { const M = window.__pp.arc.game._dbg.FD.FX.mem; return { jaw: +M.jaw.toFixed(2) }; }); ok(r.jaw > 0.6, `${id}: the cover-jaws gape before the snap (${r.jaw} rad)`);
    await until('M.bite && M.bite.locked', 2000); await run(0.35); await shot(id + '-bite'); await until('!M.bite || M.bite.snapped', 2000); await run(0.05); await shot(id + '-bite-snap'); await settle();
    const stag = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(); M.stuckCd = 0; b.stunT = 0;
      M.nextAct = 'bite'; b.act = 'crawl'; b.actT = 9; let t0 = performance.now(); while (performance.now() - t0 < 4000 && !(M.bite && M.bite.locked)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'crawl') { M.nextAct = 'bite'; b.actT = 9; } }
      if (!M.bite) return { started: false };
      // out of the cone: beside and behind the head
      const a = M.bite.a; let p = { x: b.x - Math.cos(a) * 3.2 + Math.cos(a + 1.57) * 2.5, y: b.y - Math.sin(a) * 3.2 + Math.sin(a + 1.57) * 2.5 }; const dc = Math.hypot(p.x - C.x, p.y - C.y); if (dc > C.R - 1.5) { p = { x: b.x + Math.cos(a + 1.9) * 3.5, y: b.y + Math.sin(a + 1.9) * 3.5 }; }
      t0 = performance.now(); while (performance.now() - t0 < 3000 && !(b.stunT > 0)) { await new Promise(r => requestAnimationFrame(r)); D.me.x = p.x; D.me.y = p.y; D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      const t1 = performance.now(); while (performance.now() - t1 < 300) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      const wk = D.FD.S.weak[weak], out = { started: true, stun: +b.stunT.toFixed(1), kind: M.stunKind, weak: !!(wk && !wk.dead), banners: [...ban], stuck: M.stat.stuck };
      if (wk && !wk.dead) { let h0 = b.hp; D.hitMon(wk, 1000, { flat: true }); out.viaW = Math.round(h0 - b.hp); h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); }
      return out; }, WEAK[id]);
    console.log('  stuck', JSON.stringify(stag)); ok(stag.started && stag.stun > 2.5 && stag.kind === 'stuck' && stag.weak, `${id}: a missed snap: STUCK in the floor, its ${WEAK[id]} bared`);
    ok(stag.banners.includes('STUCK!'), `${id}: the stagger is taught in a banner`);
    ok(stag.viaW >= stag.body * 2, `${id}: the gold eye takes ${stag.viaW} where the covers take ${stag.body}`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1.2; D.me.y = b.y + 4.0; }); await run(0.5); await shot(id + '-stuck'); await run(0.8); await shot(id + '-stuck-b');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.boss.stunT = 0; }); await run(1.0); await settle();
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1; D.me.y = b.y + 4.4; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await run(0.1); await shot(id + '-hit'); await run(0.8);
    // ---- Ribbon Lash: the ribbon coils and whips a shown arc ----
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const P = M.trail, A = M.tacc; let i = 0; while (i < A.length - 1 && A[i] < 6.2) i++; const q = P[i]; D.me.x = q[0] + 1.5; D.me.y = q[1] + 2.2; });
    w = await force('lash', IDLE[id], 'lash', 520); console.log('  wind-up', w); await shot(id + '-lash'); await until("!M.ls || M.ls.struck", 2000); await run(0.08); await shot(id + '-lash-b'); await settle();
    // ---- Errata: the genuine head (its solid gold shadow) bites; the copy's dashed cone is harmless ----
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C; D.FD.FX.mem.stuckCd = 0; D.me.x = C.x; D.me.y = C.y + 2; });
    w = await force('errata', IDLE[id], 'errata', 0); console.log('  wind-up', w);
    const er = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX; let t0 = performance.now(); while (performance.now() - t0 < 4000 && !(M.er && M.er.fake)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; b.stunT = 0; if (M.er && M.er.copy) M.er.copy.invuln = true; }   // (held from the companions' blows while it is measured)
      const E = M.er; if (!E || !E.fake) return { started: !!E }; const o = E.copy, Fk = E.fake, s0 = { ...M.stat };
      const real = FX.S.tele.filter(s => s.dmg > 0 && !s.done), atHead = real.filter(s => Math.hypot(s.x - b.x, s.y - b.y) < 0.6).length, atCopy = real.filter(s => Math.hypot(s.x - o.x, s.y - o.y) < 2).length;
      // the pet inside the copy's cone but outside the real one
      const rt = real.find(s => s.real); let spot = null; for (let d = 2; d <= 5.5 && !spot; d += 0.5) for (const da of [0, 0.25, -0.25, 0.45, -0.45]) { const x = Fk.x + Math.cos(Fk.a + da) * d, y = Fk.y + Math.sin(Fk.a + da) * d; if (FX.inArena(x, y, 1) && FX.inShape({ shape: 'cone', x: Fk.x, y: Fk.y, a: Fk.a, len: Fk.len, spread: Fk.spread }, x, y, 0.3) && !(rt && FX.inShape(rt, x, y, 1.0))) { spot = { x, y }; break; } }
      const info = { started: true, copy: !!(o && o.fobj && o.kind === 'copy'), atHead, atCopy, real: real.length, spot: !!spot };
      if (spot) { t0 = performance.now(); while (performance.now() - t0 < 4000 && !Fk.snapped) { await new Promise(r => requestAnimationFrame(r)); D.me.x = spot.x; D.me.y = spot.y; D.me.hp = D.ST.hp; } const t1 = performance.now(); while (performance.now() - t1 < 300) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } }
      Object.assign(info, { fakeIn: M.stat.fakeIn - s0.fakeIn, biteHit: M.stat.biteHit - s0.biteHit, stuck: M.stat.stuck - s0.stuck, copyGone: !o || o.dead }); return info; });
    console.log('  errata', JSON.stringify(er)); ok(er.copy && er.atHead >= 1 && er.atCopy === 0, `${id}: Errata: a copy head, but only the genuine head's cone is a real strike`);
    ok(er.spot && er.fakeIn === 1 && er.biteHit === 0 && er.copyGone, `${id}: inside the copy's dashed cone the pet is unharmed; the copy dissolves`);
    ok(er.stuck === 1, `${id}: the genuine head, missing, sticks in the floor`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.boss.stunT = 0; }); await run(0.6); await settle();
    // the shot of both heads, then the copy popped by one hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x; D.me.y = C.y + 2.5; });
    w = await force('errata', IDLE[id], 'errata', 0);
    await until('M.er && M.er.copy && M.er.copy.rise > 0.95', 3000); await run(0.1); await shot(id + '-errata'); await until('M.er && M.er.fake', 2000); await run(0.25); await shot(id + '-errata-b');
    const pop = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, E = M.er; if (!E || !E.copy) return { ok: false }; const o = E.copy, n0 = M.stat.copyPopped; D.hitMon(o, 50, { flat: true }); await new Promise(r => setTimeout(r, 150)); return { ok: true, dead: o.dead, popped: M.stat.copyPopped - n0, fake: !!(M.er && M.er.fake) }; });
    console.log('  pop', JSON.stringify(pop)); ok(pop.ok && pop.dead && pop.popped === 1 && !pop.fake, `${id}: one hit pops the copy (and its fake cone goes with it)`);
    await run(0.2); await shot(id + '-errata-pop');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.boss.stunT = 0; }); await run(1.2); await page.evaluate(() => { window.__pp.arc.game._dbg.g.boss.stunT = 0; }); await settle();
    // ---- the Unbinding: half health; its pages swarm while it is out of reach; torn pages leave it MISBOUND ----
    const ub = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, ban = new Set(), seen = new Set(); b.stunT = 0; b.hp = b.maxhp * 0.45; let under = false, maxLive = 0;
      let t0 = performance.now(); while (performance.now() - t0 < 6000 && !(b.act === 'unbind' && M.ub && M.ub.n >= 6)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      under = !!b.under; const hp0 = b.hp; D.hitMon(b, 1e6, { flat: true }); const struck = Math.round(hp0 - b.hp);
      return { phase: D.FD.S.phase, act: b.act, under, struck, banners: [...ban], open: +M.openK.toFixed(2) }; });
    console.log('  unbind', JSON.stringify(ub)); ok(ub.phase === 2 && ub.act === 'unbind' && ub.under && ub.struck === 0 && ub.banners.includes('UNBOUND!'), `${id}: half health: UNBOUND, its covers open and it is out of reach`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1.5; D.me.y = b.y + 5; }); await run(0.6); await shot(id + '-unbind');
    const sw = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, ban = new Set(), types = new Set(); let killed = 0, maxLive = 0; const t0 = performance.now();
      while (performance.now() - t0 < 16000 && b.act === 'unbind') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; D.banners.forEach(x => ban.add(x.s)); const live = D.mons.filter(q => !q.dead && q.horde); maxLive = Math.max(maxLive, live.length); live.forEach(q => types.add(q.type));
        // tear up the landed ones, now and then
        if (Math.random() < 0.08) { const q = live.find(q => !q.launch); if (q) { D.hitMon(q, 1e9, { flat: true }); killed++; } } }
      const t1 = performance.now(); while (performance.now() - t1 < 500) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      return { act: b.act, stun: +b.stunT.toFixed(1), kind: M.stunKind, torn: M.stat.torn, rebound: M.stat.rebound, poured: M.stat.poured, killed, maxLive, types: [...types], banners: [...ban], under: !!b.under, weak: !!(D.FD.S.weak.eye && !D.FD.S.weak.eye.dead) }; });
    console.log('  swarm', JSON.stringify(sw)); ok(sw.types.includes('loosepage') && sw.types.includes('marginworm') && sw.maxLive >= 5 && sw.maxLive <= 9, `${id}: the pages swarm (${sw.poured} poured, up to ${sw.maxLive} at once: ${sw.types.join(', ')})`);
    ok(sw.torn >= 3 && sw.kind === 'misbound' && sw.stun > 3 && sw.weak && !sw.under && sw.banners.includes('MISBOUND!'), `${id}: re-bound with ${sw.torn} pages torn: MISBOUND, reeling, its eye bared`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1.2; D.me.y = b.y + 4.2; }); await run(0.3); await shot(id + '-misbound');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.boss.stunT = 0; }); await run(1.2);
    // ---- phase two: two sentences, in the order of their dots ----
    await settle();
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x; D.me.y = C.y + 2; for (const q of D.mons) if (!q.dead && !q.boss && !q.fobj) q.dead = true; });
    w = await force('sentence', IDLE[id], 'sentence', 700); console.log('  wind-up', w); await shot(id + '-sentence2-shown');
    const two = (order) => page.evaluate(async order => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; let t0 = performance.now(); while (performance.now() - t0 < 3000 && !M.lines) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      if (!M.lines || M.lines.length < 2) return { n: M.lines ? M.lines.length : 0 }; const [A, B] = M.lines, s0 = { ...M.stat }, info = { n: 2, orders: [A.order, B.order], later: +(B.delay - A.delay).toFixed(2), same: Math.abs(A.a - B.a) < 1e-6, apart: +Math.abs(A.gapC - B.gapC).toFixed(1) };
      const sp = order === 'right' ? 0.5 : 6.5, at = L => ({ x: C.x + L.d[0] * sp + L.e[0] * L.gapC, y: C.y + L.d[1] * sp + L.e[1] * L.gapC }); let shot2 = false;
      t0 = performance.now(); while (performance.now() - t0 < 12000 && !(A.done && B.done) && !(A.hit || B.hit)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; b.stunT = 0; D.me.dodge = 0;
        // the right order: lane one until its line has passed, then lane two; the wrong one: lane two from the start
        const p = order === 'right' ? (A.passed ? at(B) : at(A)) : at(B); D.me.x = p.x; D.me.y = p.y; D.me.vx = D.me.vy = 0;
        if (order === 'right' && A.passed && !shot2) { shot2 = true; window.__syl2 = 1; } }
      Object.assign(info, { hitA: A.hit, hitB: B.hit, passA: A.passed, passB: B.passed, gapSafe: M.stat.gapSafe - s0.gapSafe, lineHit: M.stat.lineHit - s0.lineHit }); return info; }, order);
    let tw = await two('right'); console.log('  two', JSON.stringify(tw));
    ok(tw.n === 2 && tw.orders[0] === 1 && tw.orders[1] === 2 && tw.later > 1 && tw.same && tw.apart >= 3, `${id}: from half health two lines, the second ${tw.later} s after the first, their lanes ${tw.apart} m apart (marked one dot, two dots)`);
    ok(!tw.hitA && !tw.hitB && tw.gapSafe === 2 && tw.lineHit === 0, `${id}: lane one, then lane two: both lines pass round the pet`);
    await settle();
    w = await force('sentence', IDLE[id], 'sentence', 0);
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, C = D.FD.FX.C; const t0 = performance.now(); while (performance.now() - t0 < 4000 && !(M.lines && M.lines[0].run && M.lines[0].s > -1.5)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (M.lines) { const L = M.lines[0]; D.me.x = C.x + L.d[0] * 3 + L.e[0] * L.gapC; D.me.y = C.y + L.d[1] * 3 + L.e[1] * L.gapC; } } });
    await shot(id + '-sentence2-run');
    tw = await two('wrong'); console.log('  wrong', JSON.stringify(tw)); ok(tw.n === 2 && tw.hitA && tw.lineHit >= 1, `${id}: in lane two when line one comes, it strikes (the order matters)`);
    await settle();
    await idleShots(IDLE[id], '-p2');
    acts = await cycle(WANT_B[id], 90);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT_B[id].every(w => acts.acts.includes(w)), `${id}: phase two's act cycle (${acts.acts.join(', ')})`);
    // minions
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 25000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; D.g.boss.stunT = 0; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && !m.horde && types.includes(m.type)) seen.add(m.type); if (seen.size >= types.length) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length === MINIONS[id].length, `${id}: minions in phase two (${mins.join(', ')})`);
    await run(0.6); await shot(id + '-brood');
    await run(1);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill (for a section boss, it ends the stage without sealing the rift)
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.library }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); if (id !== LAST) ok(!kill.sealed, `${id}: no sealing (a section boss)`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
