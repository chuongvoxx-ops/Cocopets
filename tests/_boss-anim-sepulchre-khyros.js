// The Sepulchre of Borrowed Hours' last boss, animated: Khyros run through its wake, a full act cycle, a hit, its stun
// (a lunge baited into a corner: stuck in the angle, the flank slits bared), Hunt the Past (three numbered marks laid by
// the outer wall, three lunges, the last wedging it in a corner), Stolen Exit (the sanctuary closed; the Memory Loom's
// echo holding the release plate opens it), its minions, and the kill handing over to the rift's sealing, with no page
// errors; screenshots (SHOTS=1) into shots/anim-sep-<boss>*.png.
// usage: node tests/_boss-anim-sepulchre.js [khyros ...]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { khyros: ['prowl', 'angle', 'snap', 'spears'] };
const NAMES = { khyros: 'Khyros' };
const MINIONS = { khyros: ['cornerpup'] };
const WEAK = { khyros: 'slits' };
const HS = 12, SR = 5.5;
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['khyros'];
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, start, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-sep-${name}.png`) }); };
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.sepulchre ? R.sepulchre.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx >= 0, `${id}: stage ${idx}`); if (idx < 0) continue;
    await start('sepulchre', idx);
    // the fiend: its definition, name and bars
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 3 && r.seal, `${id}: a Super Fiend-class fight, the rift's last (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    // the arena: a square of floor (its corners walkable, the disc outside it wall), the pet starting inside it
    r = await page.evaluate(HS => { const D = window.__pp.arc.game._dbg, M = D.M, C = M.FC, t = (x, y) => M.G[Math.floor(y) * M.MW + Math.floor(x)]; return { corner: t(C.x + HS - 0.6, C.y + HS - 0.6), out: t(C.x + HS + 0.6, C.y), side: t(C.x, C.y - HS + 0.5), floor: t(C.x, C.y), me: [D.me.x - C.x, D.me.y - C.y] }; }, HS);
    console.log('  arena', JSON.stringify(r)); ok(r.corner === r.floor && r.side === r.floor && r.out !== r.floor && Math.abs(r.me[0]) < HS && Math.abs(r.me[1]) < HS, `${id}: the square arena with walkable corners`);
    // the wake and the intro (it assembles at the head of the sanctuary)
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 4; });
    await run(1.0); await shot(id + '-intro'); await run(1.0); await shot(id + '-intro2');
    await run(4.0);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`);
    // an act cycle: the pet kept close (inside the square, out of the ring), the boss kept above 70%
    const acts = await page.evaluate(async ([want, secs, HS, SR]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C, seen = new Set(), ban = new Set(); const t0 = performance.now();
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.hp < b.maxhp * 0.8) b.hp = b.maxhp * 0.8;
        if (Math.hypot(D.me.x - b.x, D.me.y - b.y) > 6.5 && b.act === 'prowl') { const p = { x: b.x + 3.5, y: b.y + 2.5 }; p.x = Math.max(C.x - HS + 1.2, Math.min(C.x + HS - 1.2, p.x)); p.y = Math.max(C.y - HS + 1.2, Math.min(C.y + HS - 1.2, p.y)); const dx = p.x - C.x, dy = p.y - C.y, d = Math.hypot(dx, dy) || 1; if (d < SR + 1) { p.x = C.x + dx / d * (SR + 1); p.y = C.y + dy / d * (SR + 1); } D.me.x = p.x; D.me.y = p.y; }
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 80, HS, SR]);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners`);
    // two shots 0.4 s apart while it prowls (the pose should change between them)
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; const t0 = performance.now(); while (performance.now() - t0 < 8000 && !(b.act === 'prowl' && b.actT > 0.6 && D.FD.FX.mem.fade < 0.05 && performance.now() - t0 > 1500)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'prowl') b.actT = Math.min(b.actT, 0.8); } });
    const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C; D.g.taps = 4; D.me.x = Math.max(C.x - 10.5, Math.min(C.x + 10.5, b.x)); D.me.y = Math.max(C.y - 10.5, Math.min(C.y + 10.5, b.y + 3.6)); D.me.vx = D.me.vy = 0; const B = D.g.boss; if (B.act === 'prowl') B.actT = 0; });
    await near(); await run(0.05); await shot(id); await run(0.35); await near(); await run(0.05); await shot(id + '-b');
    // a wind-up: the first telegraphed act, caught in its wait
    const wind = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.act = 'prowl'; b.actT = 9; const t0 = performance.now(); while (performance.now() - t0 < 6000 && (b.act === 'prowl' || b.actT < 0.7)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'prowl') b.actT = 9; } return b.act; });
    console.log('  wind-up', wind); await shot(id + '-windup');
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.FD.FX.mem.fadeTo = 0; D.FD.FX.mem.fade = 0; b.under = false; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await run(0.12); await shot(id + '-hit'); await run(1.5);
    // the stun: the pet waits in a corner; a lane from the next corner runs along the wall into it, and the lunge wedges it
    const stun = await page.evaluate(async ([weak, HS]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; let lane = null, shotAt = null; const t0 = performance.now();
      while (performance.now() - t0 < 40000 && !(b.stunT > 0.5)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.hp < b.maxhp * 0.8) b.hp = b.maxhp * 0.8; D.me.x = C.x + HS - 1.4; D.me.y = C.y + HS - 1.4; D.me.vx = D.me.vy = 0; if (b.act === 'prowl' && b.actT > 0.3) b.actT = 9; if (b.act === 'snap' || b.act === 'spears') { b.act = 'prowl'; b.actT = 9; } if (b.act === 'angle' && !lane) lane = D.FD.S.tele.filter(s => s.shape === 'line').length; }
      await new Promise(r => setTimeout(r, 500)); const w = D.FD.S.weak[weak]; return { stun: b.stunT, stuck: M.stuck, weak: !!(w && !w.dead), lane, act: b.act }; }, [WEAK[id], HS]);
    console.log('  stun', JSON.stringify(stun)); ok(stun.stun > 0 && stun.weak, `${id}: a lunge into a corner wedges it, the weak point bared (${WEAK[id]})`);
    await shot(id + '-stun');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; const w = D.FD.S.weak.slits; if (w) D.hitMon(w, 2000, { flat: true }); });
    await run(0.15); await shot(id + '-stun-hit'); await run(4.5);
    // phase two: Hunt the Past. The marks are laid along the south wall, then the pet hides in the ring; the last lane
    // runs along the wall into a corner and wedges it
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.6; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p2.phase === 2, `${id}: phase two`); await run(0.4); await shot(id + '-phase');
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 16000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0, `${id}: phase-two minions (${mins.join(', ')})`);
    const pups = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.type === 'cornerpup') D.hitMon(m, 1e9, { flat: true }); });
    await pups();
    const hunt = await page.evaluate(async ([HS]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, spots = [[-6, HS - 1.2], [0, HS - 1.2], [6, HS - 1.2]]; let marks = 0, lanes = 0, labels = [], stunned = false, seenHunt = false; const t0 = performance.now();
      while (performance.now() - t0 < 40000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.hp < b.maxhp * 0.45) b.hp = b.maxhp * 0.6; for (const m of D.mons) if (!m.dead && m.type === 'cornerpup') D.hitMon(m, 1e9, { flat: true });
        if (!seenHunt) { if (b.act === 'prowl' && !(b.stunT > 0)) { M.nextSig = 'hunt'; b.actT = 9; } if (b.act === 'snap' || b.act === 'spears' || b.act === 'angle' || b.act === 'howl') { M.q.length = 0; M.lg = null; b.act = 'prowl'; b.actT = 9; M.nextSig = 'hunt'; } }
        if (b.act === 'hunt') { seenHunt = true; const k = M.marks.length, s = spots[Math.min(2, k)]; if (k < 3) { D.me.x = C.x + s[0]; D.me.y = C.y + s[1]; } else { D.me.x = C.x; D.me.y = C.y; } D.me.vx = D.me.vy = 0; marks = Math.max(marks, k); const L = D.FD.S.tele.filter(s => s.shape === 'line'); lanes = Math.max(lanes, L.length); L.forEach(s => { if (s.label && !labels.includes(s.label)) labels.push(s.label); }); }
        if (seenHunt && b.stunT > 0.5) { stunned = true; break; } if (seenHunt && b.act === 'recover') break; }
      return { seenHunt, marks, lanes, labels, stunned, stun: b.stunT, act: b.act }; }, [HS]);
    console.log('  hunt', JSON.stringify(hunt)); ok(hunt.seenHunt && hunt.marks === 3 && hunt.lanes === 3 && hunt.labels.length === 3, `${id}: Hunt the Past: three numbered marks, three lanes`);
    ok(hunt.stunned, `${id}: marks by the outer wall: the last lunge runs into a corner and wedges it`);
    await shot(id + '-hunt-stuck'); await run(5.5);
    // a hunt caught mid-way for the screenshots: the marks laid, the lanes shown
    if (process.env.SHOTS) { await page.evaluate(async ([HS]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; b.stunT = 0; M.q.length = 0; M.lg = null; b.act = 'prowl'; b.actT = 9; M.nextSig = 'hunt'; const spots = [[-8, HS - 1.5], [HS - 1.5, 3], [-HS + 1.5, -4]]; const t0 = performance.now(); while (performance.now() - t0 < 12000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'hunt') { const k = M.marks.length; if (k < 3) { D.me.x = C.x + spots[k][0]; D.me.y = C.y + spots[k][1]; } else { D.me.x = C.x + 1; D.me.y = C.y + 1.5; } if (D.FD.S.tele.filter(s => s.shape === 'line').length === 3 && M.qt > 4.6) break; } } }, [HS]); await shot(id + '-hunt'); await run(0.9); await shot(id + '-hunt-lunge'); await run(5); }
    // phase three: Stolen Exit. The sanctuary closes; the loom records the walk to the plate; the echo holds it open
    const p3 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; b.stunT = 0; b.hp = b.maxhp * 0.3; const t0 = performance.now(); let exit = false, closed = 0, lanes = 0; while (performance.now() - t0 < 12000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === 'exit') { exit = true; closed = Math.max(closed, M.closedT); lanes = Math.max(lanes, D.FD.S.tele.filter(s => s.shape === 'line').length); } if (exit && M.qt > 1.2) break; } return { phase: D.FD.S.phase, exit, closed, lanes }; });
    console.log('  phase3', JSON.stringify(p3)); ok(p3.phase === 3 && p3.exit && p3.closed > 10 && p3.lanes === 2, `${id}: phase three: Stolen Exit closes the sanctuary with two crossing lanes`);
    await shot(id + '-exit');
    const loom = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, Lm = M.loom, Pl = M.plate, C = D.FD.FX.C; const out = { sts: [] }; const t0 = performance.now(); let phase = 0;
      while (performance.now() - t0 < 20000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.hp < b.maxhp * 0.2) b.hp = b.maxhp * 0.3; if (!out.sts.includes(Lm.st)) out.sts.push(Lm.st);
        if (b.act === 'exit' && phase === 0) { D.me.x = C.x - 8; D.me.y = C.y + 2; continue; }
        if (Lm.st === 'ready') { D.me.x = Lm.x; D.me.y = Lm.y; phase = 1; }
        else if (Lm.st === 'rec') { const dx = Pl.x - D.me.x, dy = Pl.y - D.me.y, d = Math.hypot(dx, dy); if (d > 0.1) { D.me.x += dx / d * Math.min(d, 0.12); D.me.y += dy / d * Math.min(d, 0.12); } out.closedDuringRec = M.closedT > 0 && !(M.heldT > 0); }
        else if (Lm.st === 'echo') { D.me.x = C.x - 9; D.me.y = C.y - 3; out.echo = true; }
        else if (Lm.st === 'hold') { out.held = M.heldT; out.open = !(M.closedT > 0) || M.heldT > 0; out.closedT = M.closedT; break; } }
      return out; });
    console.log('  loom', JSON.stringify(loom)); ok(loom.echo && loom.held > 7 && loom.open && loom.closedT > 0 && loom.closedDuringRec, `${id}: the loom's echo holds the plate: the stolen sanctuary is open for eight seconds`);
    await run(0.6); await shot(id + '-echo');
    await run(1.5);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill: the last boss of the rift hands over to the sealing
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.sepulchre }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`);
    ok(kill.banners.includes('THE FALLING STONE LANDS') && kill.banners.includes('SEAL THE RIFT') && kill.banners.includes('THE MEMORY SIGIL') && kill.sealed, `${id}: the sealing (THE FALLING STONE LANDS … THE MEMORY SIGIL)`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
