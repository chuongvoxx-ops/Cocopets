// The Library of Unwritten Lives' last boss, animated: Nhalex run through its wake, its first act cycle (think, Quill
// Stabs, Quill Sentence), the stabs dodged and struck (a stuck nib passes more than the blow), the Quill Sentence's lines
// striking in their NUMBERED order (standing in line 2, line 1 misses and line 2 strikes), its minions, the Unwritten
// Ending (a copy's tether is false; the real one's, broken, stops the major attack and bares its core; unbroken, the
// major attack lands), the Unwritten (240 of the brood, never more than 50 at once, it cannot be struck meanwhile, then
// it sags), False Salvation (the real shelter is safe, the decoy is not, the numbered line between them), the Last Page
// (the DPS check: PASSED by a bot striking the core steadily, so it collapses; FAILED by idling, so it detonates and
// every pet in a party of three is knocked out, the run ending as a wipe), and the kill handing over to the rift's
// sealing; no page errors; screenshots (SHOTS=1) into shots/anim-lib-<boss>*.png.
// usage: node tests/_boss-anim-library-nhalex.js [nhalex]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { nhalex: ['think', 'stab', 'sentence'] };
const NAMES = { nhalex: 'Nhalex' };
const MINIONS = { nhalex: ['marginworm', 'inkstalker', 'falsefolio'] };
const WEAK = { nhalex: 'core' };
const AP = 17;
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['nhalex'];
  const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, errors, start, run } = T;
  page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text().slice(0, 300)); });
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-lib-${name}.png`) }); };
  // (wait in frames until a condition holds, keeping the pet alive; the condition is a function body over D, b, M, C)
  const until = (body, secs, keep) => page.evaluate(async ([body, secs, keep]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, f = new Function('D', 'b', 'M', 'C', body), k = keep ? new Function('D', 'b', 'M', 'C', keep) : null; const t0 = performance.now();
    while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (window.__pp.arc.state !== 'play') return false; D.me.hp = D.ST.hp; D.me.mp = 999; if (k) k(D, b, M, C); if (f(D, b, M, C)) return true; } return false; }, [body, secs, keep || null]);
  const force = act => page.evaluate(act => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; b.stunT = 0; M.nextSig = act; b.act = 'think'; b.actT = 99; }, act);
  const clearMins = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.fminion && !m.horde) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } });
  const place = (x, y) => page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x + x; D.me.y = C.y + y; D.me.vx = D.me.vy = 0; }, [x, y]);
  // a party of three: two more pets of the same level beside the lead
  const party = await page.evaluate(() => { const P = window.__pp; for (let i = 0; i < 2; i++) { const gn = P.makeGenome(P.mulberry32(i * 77 + 5)), f = P.newPetFields('Pal' + i, gn); f.dlv = 72; P.st.others.push(f); } P.st.party = null; return P.partyPets().map(p => p.name); });
  console.log('  party', JSON.stringify(party));
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.library ? R.library.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 9, `${id}: stage ${idx}`); if (idx < 0) continue;

    /* ---- the DPS check FAILED: idling through the Last Page, it detonates and the whole party falls ---- */
    await start('library', idx); await run(4.5);
    const fl0 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; M.hdDone = true; b.stunT = 0; b.hp = b.maxhp * 0.17; return { party: D.party.length }; });
    ok(fl0.party === 3, `${id}: a party of three goes in (${fl0.party})`);
    const flA = await until("return b.act === 'lastpage' && M.lp && M.lp.st === 'cast'", 25, "D.me.x = C.x + 9; D.me.y = C.y + 8; D.me.vx = D.me.vy = 0; window.__ban = window.__ban || new Set(); D.banners.forEach(x => window.__ban.add(x.s));");
    const ban0 = await page.evaluate(() => [...(window.__ban || [])]);
    await run(1.2); await shot(id + '-lastpage-idle');
    const fl1 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, P = window.__pp, ban = new Set(); let blowShot = false, maxAtk = 0, other = 0; const hp0 = b.hp; const t0 = performance.now();
      while (performance.now() - t0 < 40000 && P.arc.state === 'play') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (!D.me.dead) { D.me.hp = D.ST.hp; D.me.x = C.x + 9; D.me.y = C.y + 8; D.me.vx = D.me.vy = 0; }
        for (const s of D.FD.S.tele) { if (s.ink === 'stab') maxAtk = Math.max(maxAtk, s.dmg / b.dmg); else if (s.ink) other++; }
        if (M.lp && M.lp.st === 'blow' && M.lp.t > 0.8 && !blowShot) { blowShot = true; window.__blow = 1; break; } }
      return { ban: [...ban], hp0, hp: b.hp, maxAtk, other, st: M.lp && M.lp.st }; });
    await shot(id + '-lastpage-blow');
    const fl2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, P = window.__pp, ban = new Set(); const t0 = performance.now(); let downAll = false, deadMe = false;
      while (performance.now() - t0 < 15000 && P.arc.state === 'play') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (D.party.every(m => m.down)) downAll = true; if (D.me.dead) deadMe = true; }
      const panel = document.querySelector('#arcPanel'); return { ban: [...ban], state: P.arc.state, downAll, deadMe, n: D.party.length, failed: M.stat.lpFailed, wiped: M.stat.wiped, passed: M.stat.lpPassed, sealed: !!P.riftState().seals.library, msg: panel ? panel.innerText.replace(/\s+/g, ' ').slice(0, 160) : '' }; });
    await page.waitForTimeout(500); await shot(id + '-wipe');
    const fban = new Set([...ban0, ...fl1.ban, ...fl2.ban]);
    console.log('  lastpage fail', JSON.stringify(flA), JSON.stringify(Object.assign({}, fl1, { ban: undefined })), JSON.stringify(Object.assign({}, fl2, { ban: undefined })), JSON.stringify([...fban]));
    ok(flA && fban.has('THE LAST PAGE'), `${id}: near the end it stops and begins THE LAST PAGE`);
    ok(fl1.hp === fl1.hp0 && fl1.maxAtk > 0 && fl1.maxAtk <= 0.6 && fl1.other === 0, `${id}: while the page runs its health is held, and its only attacks are light stabs (x${fl1.maxAtk.toFixed(2)})`);
    ok(fban.has('THE LAST PAGE IS WRITTEN') && fl2.failed === 1 && fl2.wiped === 1 && fl2.passed === 0, `${id}: idling, the ward holds and it detonates`);
    ok(fl2.downAll && fl2.deadMe && fl2.n === 3 && fban.has('THE PARTY FALLS'), `${id}: the explosion knocks out EVERY pet in the party (${fl2.n}): THE PARTY FALLS`);
    ok(fl2.state === 'end' && !fl2.sealed, `${id}: the run ends as a wipe (${fl2.state}${fl2.msg ? ': ' + fl2.msg.slice(0, 80) : ''})`);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors in the failed run (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));

    /* ---- the full fight ---- */
    await start('library', idx);
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal, party: D.party.length }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 3 && r.seal, `${id}: a Super Fiend-class fight, the rift's last (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    // the arena: an octagon some 34 m across, flat sides north, south, east and west, eight books at its corners
    r = await page.evaluate(AP => { const D = window.__pp.arc.game._dbg, M = D.M, C = M.FC, t = (x, y) => M.G[Math.floor(y) * M.MW + Math.floor(x)], fl = t(C.x, C.y), books = D.FD.S.props.filter(p => p.kind === 'book');
      return { e: t(C.x + AP - 0.8, C.y) === fl, oE: t(C.x + AP + 0.8, C.y) !== fl, s: t(C.x, C.y + AP - 0.8) === fl, oS: t(C.x, C.y + AP + 0.8) !== fl, n: t(C.x + 3, C.y - AP + 0.8) === fl, diag: t(C.x + 11.2, C.y + 11.2) === fl, oDiag: t(C.x + 12.6, C.y + 12.6) !== fl, books: books.length, solid: books.every(p => t(p.x, p.y - 0.3) !== fl), me: [D.me.x - C.x, D.me.y - C.y] }; }, AP);
    console.log('  arena', JSON.stringify(r)); ok(r.e && r.oE && r.s && r.oS && r.n && r.diag && r.oDiag, `${id}: the Final Archive: a 34 m octagon`); ok(r.books === 8 && r.solid, `${id}: eight enormous books round its boundary, standing on solid feet`);
    await run(0.6); await shot(id + '-intro'); await run(1.6); await shot(id + '-intro2');
    await run(3.0);
    await until("return b.act !== 'enter'", 12);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; return { act: b.act, wake: M.P.wake, eyes: M.eyes.map(e => +e.b.toFixed(2)) }; });
    console.log('  wake', JSON.stringify(r)); ok(r.act && r.act !== 'enter' && r.wake > 0.9 && r.eyes.some(v => v < 0.5), `${id}: awake, its eyes open (${r.act})`);
    // an act cycle, the boss kept above 80%
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, seen = new Set(), ban = new Set(); const t0 = performance.now();
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.hp < b.maxhp * 0.8) b.hp = b.maxhp * 0.8;
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 60]);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.includes('QUILL STABS') && acts.banners.includes('QUILL SENTENCE'), `${id}: the attacks are named in banners`);
    await until("return b.act === 'think' && !b.stunT && !D.FD.S.tele.length", 25); await place(2, 4); await page.evaluate(() => { window.__pp.arc.game._dbg.g.boss.actT = -1; });
    await run(0.1); await shot(id); await run(0.4); await shot(id + '-b');
    const mv = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, a = JSON.stringify(M.tend[0].pts[10].map(v => v.toFixed(2))) + M.ringA.toFixed(3) + M.roll.toFixed(3); D.g.boss.actT = -1; await new Promise(r => setTimeout(r, 450)); return a !== JSON.stringify(M.tend[0].pts[10].map(v => v.toFixed(2))) + M.ringA.toFixed(3) + M.roll.toFixed(3); });
    ok(mv, `${id}: never still (its tendrils curl, its page ring turns, it rolls as it thinks)`);

    // Quill Stabs: shown circles under the pet; stepping out they miss; standing in, they strike; a stuck nib takes blows
    await force('stab');
    const sb = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, S = D.FD.S; const s0 = Object.assign({}, M.stat), out = { circles: 0 }; const t0 = performance.now(); let k = 0;
      D.me.x = C.x + 1; D.me.y = C.y + 3;
      // (the first circle: stand in it; every later one: step 4 m out of it)
      while (performance.now() - t0 < 9000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const cs = S.tele.filter(s => s.ink === 'stab' && !s.done); out.circles = Math.max(out.circles, cs.length);
        for (const s of cs) { if (s.mode == null) s.mode = k++ ? 'out' : 'in'; if (s.age > s.t * 0.6 && !s.moved) { s.moved = true; if (s.mode === 'in') { D.me.x = s.x; D.me.y = s.y; } else { D.me.x = s.x + (s.x < C.x ? 4.2 : -4.2); D.me.y = s.y; } D.me.vx = D.me.vy = 0; } }
        // (a nib stuck in the floor: strike it)
        const st = M.tend.find(q => q.mode === 'stuck' && q.px && !q.px.dead); if (st && out.nib == null) { out.stuck = true; const h0 = b.hp; D.hitMon(st.px, 1000, { flat: true }); out.nib = h0 - b.hp; }
        if (b.act !== 'stab' && M.stat.stabs - s0.stabs > 0) break; }
      out.stabs = M.stat.stabs - s0.stabs; out.hit = M.stat.stabHit - s0.stabHit; return out; });
    console.log('  stabs', JSON.stringify(sb)); ok(sb.circles >= 2 && sb.stabs >= 2, `${id}: Quill Stabs: shown circles, each a quill stabbing down (${sb.stabs})`);
    ok(sb.hit === 1, `${id}: standing in the first circle it strikes; stepping out of the next it misses (${sb.hit} of ${sb.stabs})`);
    ok(sb.stuck && sb.nib > 1000, `${id}: a nib left stuck in the floor passes more than the blow (${Math.round(sb.nib || 0)})`);
    await until("return b.act === 'think'", 10);

    // Quill Sentence: three numbered lines, striking in their NUMBERED order
    await place(0, 3); await force('sentence');
    const se = await page.evaluate(async AP => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, S = D.FD.S, FX = D.FD.FX; const t0 = performance.now(); let lines = [];
      while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; lines = S.tele.filter(s => s.ink === 'line' && s.num); if (lines.length === 3) break; }
      const by = k => lines.find(s => s.num === k), info = lines.map(s => ({ num: s.num, t: +s.t.toFixed(2) })).sort((a, b) => a.num - b.num);
      // a point in line 2 alone (not in line 1 or 3), on the floor
      const inOct = (dx, dy, pad) => { for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; if (Math.abs(dx * Math.cos(a) + dy * Math.sin(a)) > AP - pad) return false; } return true; };
      let spot = null; for (let r = 0; r < 14 && !spot; r += 0.5) for (let a = 0; a < 6.28 && !spot; a += 0.2) { const x = C.x + Math.cos(a) * r, y = C.y + Math.sin(a) * r; if (inOct(x - C.x, y - C.y, 2) && FX.inShape(by(2), x, y, -0.4) && !FX.inShape(by(1), x, y, 0.8) && !FX.inShape(by(3), x, y, 0.8)) spot = { x, y }; }
      const s0 = { hit: M.stat.sentHit, ord: M.stat.sentOrder.length }; const out = { info, spot: !!spot, writes: [] };
      if (spot) { D.me.x = spot.x; D.me.y = spot.y; }
      while (performance.now() - t0 < 14000 && !by(1).done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (spot) { D.me.x = spot.x; D.me.y = spot.y; D.me.vx = D.me.vy = 0; } if (!out.shot && by(1).age / by(1).t > 0.85) { out.shot = true; window.__libShot = 1; } }
      out.after1 = M.stat.sentHit - s0.hit;
      while (performance.now() - t0 < 16000 && !by(2).done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (spot) { D.me.x = spot.x; D.me.y = spot.y; D.me.vx = D.me.vy = 0; } }
      out.after2 = M.stat.sentHit - s0.hit; D.me.x = C.x + 30; return out; }, AP);
    await shot(id + '-sentence');
    const se2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; const t0 = performance.now(); while (performance.now() - t0 < 6000 && D.FD.S.tele.some(s => s.ink === 'line')) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + 14; D.me.y = C.y + 2; } return { order: M.stat.sentOrder.slice(-3) }; });
    console.log('  sentence', JSON.stringify(se), JSON.stringify(se2));
    ok(se.info.length === 3 && se.info[0].t < se.info[1].t && se.info[1].t < se.info[2].t, `${id}: Quill Sentence: three lines marked 1, 2 and 3, timed in that order (${se.info.map(i => i.num + '@' + i.t).join(' ')})`);
    ok(JSON.stringify(se2.order) === '[1,2,3]', `${id}: they strike in their NUMBERED order (${se2.order.join(', ')})`);
    ok(se.spot && se.after1 === 0 && se.after2 === 1, `${id}: standing in line 2 alone, line 1 misses and line 2 strikes (${se.after1}, ${se.after2})`);
    await until("return b.act === 'think'", 10);
    // a shot of the lines being written
    await place(0, 4); await force('sentence'); await until("return D.FD.S.tele.filter(s => s.ink === 'line' && s.writeAt != null).length >= 3", 6); await run(0.6); await shot(id + '-sentence-write'); await until("return b.act === 'think'", 12, "D.me.x = C.x + 14; D.me.y = C.y;");
    await force('stab'); await until("return D.FD.S.tele.some(s => s.ink === 'stab' && s.age / s.t > 0.7)", 6); await shot(id + '-stab'); await until("return b.act === 'think'", 10);
    let e2 = errors.length; ok(e2 === e0, `${id}: no page errors in the first act (${e2 - e0})`); if (e2 > e0) console.log(errors.slice(e0, e2).join('\n'));

    // phase two: its minions, and the Unwritten Ending
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.66; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p2.phase === 2, `${id}: phase two`);
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0, `${id}: second-act minions (${mins.join(', ')})`); await clearMins();
    const en = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(); const t0 = performance.now();
      while (performance.now() - t0 < 15000 && !(M.end && M.end.list.every(L => L.on && L.a > 0.9))) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); if (b.act === 'think' && !M.end) { M.nextSig = 'ending'; b.actT = 99; } }
      const E = M.end; if (!E) return { ok: false };
      return { ok: true, n: E.list.length, real: E.list.filter(L => L.real).length, knots: E.list.filter(L => L.knot && !L.knot.dead).length, books: M.books.filter(k => k.open > 0.5).length, shut: M.eyes.filter(e => e.shut).length, W: E.W, ban: [...ban] }; });
    await place(0, 2); await run(0.3); await shot(id + '-ending');
    const en2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, E = M.end; const s0 = Object.assign({}, M.stat); const fake = E.list.find(L => !L.real), real = E.list.find(L => L.real);
      D.hitMon(fake.knot, 1e9, { flat: true }); await new Promise(r => setTimeout(r, 300)); const afterFake = { st: M.end && M.end.st, falseKnots: M.stat.falseKnots - s0.falseKnots, stun: b.stunT || 0 };
      D.me.x = real.kx; D.me.y = real.ky + 1.6; D.hitMon(real.knot, 1e9, { flat: true }); await new Promise(r => setTimeout(r, 900)); const w = D.FD.S.weak.core;
      return { afterFake, broken: M.stat.endingsBroken - s0.endingsBroken, stun: b.stunT, weak: !!(w && !w.dead), fwd: w ? w.forward : 0, majorTele: D.FD.S.tele.some(s => s.ink === 'major'), sag: M.P.sag }; });
    await place(0, -5.5); await run(1.8); await shot(id + '-ending-broken');
    const en3 = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, w = D.FD.S.weak[weak], h0 = b.hp; D.hitMon(w, 1000, { flat: true }); const dmg = h0 - b.hp; const m0 = M.stat.majors; const t0 = performance.now(); while (performance.now() - t0 < 8000 && (b.stunT > 0 || b.act !== 'think')) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { dmg, majors: M.stat.majors - m0, totalMajors: M.stat.majors }; }, WEAK[id]);
    console.log('  ending', JSON.stringify(en), JSON.stringify(en2), JSON.stringify(en3));
    ok(en.ok && en.n === 3 && en.real === 1 && en.knots === 3 && en.books === 3 && en.shut === 3, `${id}: Unwritten Ending: three books open (of eight), three projections, one real, its eyes closed one by one`);
    ok(en2.afterFake.falseKnots === 1 && en2.afterFake.st === 'open' && !en2.afterFake.stun, `${id}: a copy's tether, broken, changes nothing (a false ending)`);
    ok(en2.broken === 1 && en2.stun > 0 && en2.weak && en2.fwd >= 2 && !en2.majorTele && en3.majors === 0 && en3.totalMajors === 0, `${id}: the real projection's tether, broken, stops the major attack and it reels, its core bared (x${en2.fwd})`);
    ok(en3.dmg > 2000, `${id}: the bared core takes ${Math.round(en3.dmg)} from a blow of 1000`);
    // left alone, the ending is written
    await force('ending');
    const ef = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(); const m0 = M.stat.majors, h0 = M.stat.majorHit; const t0 = performance.now(); let sh = false;
      while (performance.now() - t0 < 22000 && M.stat.majors === m0) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x + 2; D.me.y = C.y + 5; D.banners.forEach(x => ban.add(x.s)); if (!sh && D.FD.S.tele.some(s => s.ink === 'major' && s.age > 0.8)) { sh = true; window.__sh = 1; } }
      return { majors: M.stat.majors - m0, hit: M.stat.majorHit - h0, ban: [...ban] }; });
    await shot(id + '-ending-written');
    console.log('  ending fail', JSON.stringify(ef)); ok(ef.majors === 1 && ef.hit === 1 && ef.ban.includes('THE ENDING IS WRITTEN'), `${id}: unbroken, THE ENDING IS WRITTEN: the big hit lands`);
    await until("return b.act === 'think' && !M.end", 10); await clearMins();

    // the Unwritten: half way down, 240 of the brood pour out of its pages
    const hd = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; b.hp = b.maxhp * 0.5; const ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 30000 && b.act !== 'horde') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } D.banners.forEach(x => ban.add(x.s)); return { act: b.act, banners: [...ban] }; });
    console.log('  horde', JSON.stringify(hd)); ok(hd.act === 'horde' && hd.banners.includes('THE UNWRITTEN POUR OUT'), `${id}: half way down, the unwritten pour out of its pages`);
    await run(2.4); await shot(id + '-horde');
    const hd2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; let maxAlive = 0; const t0 = performance.now(); while (performance.now() - t0 < 2500) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; maxAlive = Math.max(maxAlive, D.mons.filter(q => !q.dead && q.horde).length + M.hd.pending); }
      const h0 = b.hp; D.hitMon(b, 1e6, { pierce: true }); return { maxAlive, untouched: b.hp === h0, under: !!b.under, parts: D.mons.filter(q => !q.dead && q.fobj && q.kind === 'part').length, drops: M.drops.length }; });
    console.log('  horde2', JSON.stringify(hd2)); ok(hd2.maxAlive > 20 && hd2.maxAlive <= 50, `${id}: they pour out, no more than fifty at once (${hd2.maxAlive})`); ok(hd2.untouched && hd2.under && hd2.parts === 0, `${id}: it cannot be struck while they pour`);
    const hd3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, kinds = new Set(); let maxAlive = 0; const s0 = M.stat.stabs; const t0 = performance.now();
      while (performance.now() - t0 < 150000 && M.hd) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const live = D.mons.filter(q => !q.dead && q.horde); maxAlive = Math.max(maxAlive, live.length); for (const q of live) { kinds.add(q.type); q.guardFn = null; D.hitMon(q, 1e9, { flat: true }); } }
      await new Promise(r => setTimeout(r, 900)); const w = D.FD.S.weak.core; return { done: M.hdDone, poured: M.stat.poured, maxAlive, kinds: [...kinds], stabs: M.stat.stabs - s0, stun: b.stunT, weak: !!(w && !w.dead), under: !!b.under, sag: M.P.sag }; });
    console.log('  horde3', JSON.stringify(hd3)); ok(hd3.done && hd3.poured === 240 && hd3.maxAlive <= 50, `${id}: all 240 poured and cleared`);
    ok(['marginworm', 'inkstalker', 'falsefolio'].every(k => hd3.kinds.includes(k)), `${id}: the unwritten are the rift's brood (${hd3.kinds.join(', ')})`);
    ok(hd3.stabs > 0, `${id}: meanwhile it only stabs now and then (${hd3.stabs})`); ok(hd3.stun > 0 && hd3.weak && !hd3.under, `${id}: emptied, it sags, its core bared`);
    await place(0, -5.5); await run(2.0); await shot(id + '-emptied');
    await until("return !(b.stunT > 0)", 10);

    // phase three: False Salvation
    const p3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.3; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 3) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p3.phase === 3, `${id}: phase three`); await clearMins();
    const sv = async (where) => page.evaluate(async where => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; const t0 = performance.now(); while (performance.now() - t0 < 15000 && !M.salv) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'think') { M.nextSig = 'salvation'; b.actT = 99; } }
      const S2 = M.salv; if (!S2) return { ok: false }; const s0 = Object.assign({}, M.stat), line = D.FD.S.tele.find(s => s.salvLine), fin = D.FD.S.tele.find(s => s.ink === 'salv'); const out = { ok: true, num: line && line.num, lineFirst: line && fin && line.t < fin.t, d: Math.hypot(S2.real.x - S2.decoy.x, S2.real.y - S2.decoy.y) };
      const tgt = S2[where]; let shot = false; while (performance.now() - t0 < 25000 && M.salv && M.stat.salvs === s0.salvs + 0 && !(fin && fin.done)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const lineOn = line && !line.done; if (!lineOn || M.salv.t > 0.5) { D.me.x = tgt.x; D.me.y = tgt.y; } D.me.vx = D.me.vy = 0; if (!shot && M.salv.t > 3.6) { shot = true; window.__sv = 1; } }
      return Object.assign(out, { safe: M.stat.salvSafe - s0.salvSafe, decoy: M.stat.salvDecoy - s0.salvDecoy, hit: M.stat.salvHit - s0.salvHit }); }, where);
    const svA = await sv('real'); await shot(id + '-salvation');
    await until("return b.act === 'think'", 8); await force('salvation'); await run(2.0); await shot(id + '-salvation-cast'); const svB = await sv('decoy');
    console.log('  salvation', JSON.stringify(svA), JSON.stringify(svB));
    ok(svA.ok && svA.num === 1 && svA.lineFirst && svA.d > 8, `${id}: False Salvation: two shelters far apart, a numbered quill line (1) striking first`);
    ok(svA.safe === 1 && svA.decoy === 0 && svA.hit === 0, `${id}: in the real shelter (double gold ring, gold shadow) the cast passes over`);
    ok(svB.ok && svB.decoy === 1 && svB.safe === 0, `${id}: in the decoy (dashed violet) it strikes`);
    await until("return b.act === 'think'", 8); await clearMins();
    e2 = errors.length; ok(e2 === e0, `${id}: no page errors before the last page (${e2 - e0})`); if (e2 > e0) console.log(errors.slice(e0, e2).join('\n'));

    // the DPS check PASSED: a bot striking the bared core steadily (taps, strong attacks, its ultimate) breaks the ward in time
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.17; });
    const lp0 = await until("return b.act === 'lastpage' && M.lp && M.lp.st === 'cast'", 20, "D.me.x = C.x; D.me.y = C.y - 4.5;");
    const lpI = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; return { ward: M.lp.ward, max: M.lp.max, barHP: D.FD.barHP, wardK: window.__pp.FIEND_DEFS.nhalex.lastPage.wardK, T: M.lp.T, maxhp: D.g.boss.maxhp, hp: D.g.boss.hp }; });
    await run(0.5); await shot(id + '-lastpage');
    const bot = await page.evaluate(async () => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, g = D.g, me = D.me; const L = M.lp, t0 = performance.now(), out = { taps: 0, strongs: 0, ults: 0 }; let shotMid = false, tLast = 0;
      while (performance.now() - t0 < 24000 && M.lp && M.lp.st === 'cast') { await new Promise(r => requestAnimationFrame(r)); me.hp = D.ST.hp;
        const w = D.FD.S.weak.core; if (!w || w.dead) continue;
        // stand just in front of the core and strike it
        if (Math.hypot(me.x - w.x, me.y - (w.y + 1.8)) > 1.2) { me.x = w.x + 0.3; me.y = w.y + 1.8; me.vx = me.vy = 0; }
        if (g.t - tLast > 0.26) { tLast = g.t; const sx = FX.sx(w.x), sy = FX.sy(w.y); G.down(sx, sy, 77); G.up(sx, sy, 77); out.taps++; }
        ['strong', 'strong2', 'strong3'].forEach((k, i) => { const ab = D.KIT[k], cd = g[['cdS', 'cdS2', 'cdS3'][i]]; if (ab && me.mp >= ab.cost && cd <= 0) { D.useStrong(k); out.strongs++; } });
        if (D.KIT.ult && me.mp >= D.KIT.ult.cost && g.cdU <= 0) { D.useUlt(); out.ults++; }
        if (!shotMid && L.ward < L.max * 0.55) { shotMid = true; out.mid = { left: +(L.T - L.t).toFixed(1) }; break; } }
      return out; });
    await shot(id + '-lastpage-ward');
    const bot2 = await page.evaluate(async () => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, g = D.g, me = D.me; const L = M.lp, t0 = performance.now(), ban = new Set(); let tLast = 0, used = null; const hpHeld = b.hp;
      while (performance.now() - t0 < 24000 && M.lp && M.lp.st === 'cast') { await new Promise(r => requestAnimationFrame(r)); me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s));
        const w = D.FD.S.weak.core; if (!w || w.dead) continue;
        if (Math.hypot(me.x - w.x, me.y - (w.y + 1.8)) > 1.2) { me.x = w.x + 0.3; me.y = w.y + 1.8; me.vx = me.vy = 0; }
        if (g.t - tLast > 0.26) { tLast = g.t; const sx = FX.sx(w.x), sy = FX.sy(w.y); G.down(sx, sy, 77); G.up(sx, sy, 77); }
        ['strong', 'strong2', 'strong3'].forEach((k, i) => { const ab = D.KIT[k], cd = g[['cdS', 'cdS2', 'cdS3'][i]]; if (ab && me.mp >= ab.cost && cd <= 0) D.useStrong(k); });
        if (D.KIT.ult && me.mp >= D.KIT.ult.cost && g.cdU <= 0) D.useUlt(); }
      used = L.t; await new Promise(r => setTimeout(r, 700)); D.banners.forEach(x => ban.add(x.s)); const w = D.FD.S.weak.core;
      return { used: +used.toFixed(1), T: L.T, dealt: Math.round(L.dealt), passed: M.stat.lpPassed, lpDone: M.lpDone, stun: b.stunT, weak: !!(w && !w.dead), fwd: w ? w.forward : 0, hpK: +(b.hp / b.maxhp).toFixed(3), hpHeld: hpHeld === L.hp0, ban: [...ban], state: P.arc.state }; });
    await place(0.5, -5.5); await run(2.4); await shot(id + '-collapse');
    console.log('  lastpage pass', JSON.stringify(lp0), JSON.stringify(lpI), JSON.stringify(bot), JSON.stringify(bot2));
    ok(lp0 && Math.abs(lpI.ward - lpI.barHP * lpI.wardK) < 1 && lpI.T >= 15 && lpI.T <= 20, `${id}: THE LAST PAGE: a ${lpI.T} s countdown and a ward of ${Math.round(lpI.ward)} damage (${lpI.wardK} bars of ${Math.round(lpI.barHP)})`);
    ok(bot2.passed === 1 && bot2.lpDone && bot2.used < bot2.T * 0.9, `${id}: a bot striking the core steadily breaks the ward in time (${bot2.used} s of ${bot2.T}, ${bot.taps} taps, ${bot.strongs} strong, ${bot.ults} ult)`);
    ok(bot2.ban.includes('THE LAST PAGE IS TORN') && bot2.stun > 5 && bot2.weak && bot2.fwd >= 3 && bot2.hpK <= 0.061, `${id}: the page tears: it collapses, a long stagger, nearly spent (${bot2.hpK * 100}% left)`);
    e2 = errors.length; ok(e2 === e0, `${id}: no page errors (${e2 - e0})`); if (e2 > e0) console.log(errors.slice(e0, e2).join('\n'));
    // the kill: the last boss of the rift hands over to the sealing
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (performance.now() - t0 > 2400) break; } return { banners: [...ban], dead: D.g.boss.dead }; });
    await shot(id + '-dead');
    const kill2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, M = D.FD.FX.mem, ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); if (D.banners.some(b => b.s === 'RESONANCE')) break; } return { banners: [...ban], lit: M.lit || 0, sky: D.FD.S.skyKey }; });
    await shot(id + '-seal');
    const kill3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D.banners) D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.library }; });
    const all = new Set([...kill.banners, ...kill2.banners, ...kill3.banners]); console.log('  kill', JSON.stringify(kill3.state), JSON.stringify([...all]), kill3.sealed, kill2.lit, kill2.sky);
    ok(kill.dead && kill3.state === 'end', `${id}: the kill ends the stage`);
    ok(all.has('THE MIND FALLS SILENT') && all.has('SEAL THE RIFT') && all.has('THE TRUTH SIGIL') && kill3.sealed, `${id}: the sealing (THE MIND FALLS SILENT … THE TRUTH SIGIL)`);
    ok(kill2.lit === 7 && /open/.test(kill2.sky || ''), `${id}: fallen, the black moon opens into a skylight and the model of Gaia lights seven points`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
