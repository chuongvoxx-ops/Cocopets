// The Basilica of the Veiled Eye's three challenges: the Blind Pilgrimage (1), the Witness Containment (3), the Procession of Stone (7)
// HTML=test-bas.html node tests/rift-bas-stages.js   (SHOTS=1 for pictures)
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x === undefined ? '' : ' ' + JSON.stringify(x))); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 90, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors, start, run, exitStage, goal } = T;
  // (a stage started straight after another keeps the last one's result card up in the harness: hide it for the pictures)
  const shot = async n => { await page.evaluate(() => { const p = document.getElementById('arcPanel'); if (p && window.__pp.arc.state === 'play') p.style.display = 'none'; }); await T.shot(n); await page.evaluate(() => { const p = document.getElementById('arcPanel'); if (p) p.style.display = ''; }); };
  const M = (f, a) => page.evaluate(f, a);
  let r;
  // wait on GAME time (the headless page draws few frames a second): __w(secs, each(), until()) -> frames
  const setupW = () => M(() => { window.__gms = () => window.__pp.arc.game._dbg.g.t * 1000; window.__w = async (secs, each, until) => { const D = window.__pp.arc.game._dbg, g0 = D.g.t; let f = 0; while (D.g.t - g0 < secs && !(until && until())) { await new Promise(r => requestAnimationFrame(r)); f++; if (D.me && !D.me.dead && !window.__nohp) D.me.hp = D.ST.hp; if (each) each(); } return f; }; });
  const runG = secs => M(s => window.__w(s), secs);
  // hold the pet somewhere for a while (health kept full), the screen/pylons running
  const holdAt = (x, y, secs) => M(async ([x, y, secs]) => { const D = window.__pp.arc.game._dbg, cal = D.RIFT.self.amb.BAS.calcify; let maxK = 0, seen = 0, f = 0; await window.__w(secs, () => { f++; D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; maxK = Math.max(maxK, cal.k); if (cal.seen) seen++; }); return { maxK, seen, f }; }, [x, y, secs]);

  /* ======================= THE BLIND PILGRIMAGE ======================= */
  await start('basilica', 1); await setupW(); await runG(2);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; return { secs: mod.secs.length, at: mod.secs.map(s => s.scr.i), pylons: mod.secs.map(s => s.pyl.angles.length), door: D.M.marks.d.every(p => D.M.G[p.ty * mw + p.tx] === 0), exit: !!D.RIFT.exit, mons: D.mons.filter(m => !m.dead).map(m => m.type + ':' + m.rmark).sort().join(',') }; });
  ok(r.secs === 3 && r.at.every(i => i === 0) && r.pylons.every(n => n === 3) && r.door && !r.exit, 'the Pilgrimage: three pylons of three angles, three screens parked aside, the ossuary door shut', r);
  ok(r.mons === 'brokensentinel:n,brokensentinel:n,calciteleech:k,calciteleech:k,calciteleech:l,calciteleech:l,witnessscarab:w', 'guards: two leeches and two sentinels at the first screen; a scarab and two leeches at the final crossing', r.mons);
  ok(/slide the screen/.test(await goal()), 'the goal says to slide the screen', await goal());
  // clear the first screen's guards out of the way of the geometry checks (the final guards stay for the latch test)
  await M(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && (m.rmark === 'l' || m.rmark === 'n')) D.hitMon(m, 1e9, { flat: true }); });
  // seen in the open: the screen aside, the pylon held looking straight down the walkway
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, s = mod.secs[0], B = D.RIFT.self.amb.BAS; s.pyl.setAngle(0); s.pyl.hold = true; B.calcify.reset(); B.calcify.immune = 0; const px = s.p.x, py = s.p.y + 5; return { px, py, seen: B.gazeSeen(px, py, s.pyl.src) }; });
  const P0 = r; ok(r.seen, 'on the walkway with the screen aside, the pet is in the eye\'s cone and seen');
  r = await holdAt(P0.px, P0.py, 1.4); ok(r.maxK > 1 && r.seen > 20, 'being seen builds Calcification', r);
  // slide the screen by its handle (the pet stands at it)
  r = await M(async () => { const D = window.__pp.arc.game._dbg, s = D.RIFT.self.mod.secs[0], h = s.scr.handle; h.used = false; h.ch = 0; const t0 = __gms(); while (__gms() - t0 < 2600) { await new Promise(r => requestAnimationFrame(r)); D.me.x = h.x - 0.3; D.me.y = h.y + 0.3; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; if (s.scr.i === 1 && !s.scr.moving) break; } return { i: s.scr.i, moving: s.scr.moving }; });
  ok(r.i === 1 && !r.moving, 'standing at its handle slides the screen to the stop in front of the eye', r);
  r = await M(([px, py]) => { const D = window.__pp.arc.game._dbg, s = D.RIFT.self.mod.secs[0], B = D.RIFT.self.amb.BAS; const res = []; for (let a = 0; a < 3; a++) { s.pyl.setAngle(a); res.push(B.gazeSeen(px, py, s.pyl.src) ? 1 : 0); } s.pyl.setAngle(0); return { inSh: B.inShadow(px, py, s.pyl.src), seenAtAngles: res }; }, [P0.px, P0.py]);
  ok(r.inSh && r.seenAtAngles.every(v => !v), 'with the screen in front of the eye the same spot is in its shadow at every one of the pylon\'s angles', r);
  r = await holdAt(P0.px, P0.py, 2.2); ok(r.seen === 0, 'standing in the shadow nothing is seen and the stages crumble', r); await shot('bas-pil-shadow');
  // reversible: slide it back aside and in again
  r = await M(async () => { const D = window.__pp.arc.game._dbg, s = D.RIFT.self.mod.secs[0]; const w = async () => { const t0 = __gms(); while (__gms() - t0 < 1600 && s.scr.moving) await new Promise(r => requestAnimationFrame(r)); }; s.scr.goTo(0); await new Promise(r => requestAnimationFrame(r)); await w(); const a = s.scr.i; s.scr.goTo(1); await new Promise(r => requestAnimationFrame(r)); await w(); return [a, s.scr.i]; });
  ok(r[0] === 0 && r[1] === 1, 'the screen\'s positions are reversible', r);
  // cross every walkway inside its shadow: the pet walks up its middle to the screen, steps round it and climbs the stair
  for (let k = 0; k < 3; k++) {
    r = await M(async k => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = D.RIFT.self.amb.BAS, s = mod.secs[k], cal = B.calcify; for (const q of mod.secs) q.pyl.hold = false; s.scr.goTo(1); const t0 = __gms(); while (__gms() - t0 < 1500 && s.scr.moving) await new Promise(r => requestAnimationFrame(r));
      cal.reset(); const path = []; for (let y = s.p.y + 9; y > s.p.y + 2.8; y -= 0.5) path.push([s.p.x, y]); if (k < 2) { for (let x = s.p.x; Math.abs(x - s.door.x) > 0.3; x += Math.sign(s.door.x - s.p.x) * 0.5) path.push([x, s.p.y + 2.9]); for (let y = s.p.y + 2.9; y > s.p.y - 2.2; y -= 0.5) path.push([s.door.x, y]); } else path.push([mod.latch.x, mod.latch.y + 0.6]);
      let seenAny = 0; for (const [x, y] of path) for (let a = 0; a < 3; a++) { s.pyl.setAngle(a); if (B.gazeSeen(x, y, s.pyl.src)) seenAny++; } s.pyl.setAngle(0);
      // walk it, a step a frame
      let maxK = 0; for (const [x, y] of path) { D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; await new Promise(r => requestAnimationFrame(r)); await new Promise(r => requestAnimationFrame(r)); maxK = Math.max(maxK, cal.k); }
      for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r));
      return { seenAny, maxK: +maxK.toFixed(2), crossed: mod.S.crossed, goal: document.getElementById('arcGoal').textContent }; }, k);
    ok(r.seenAny === 0 && r.maxK < 1.5 && r.crossed === Math.min(2, k + 1), `walkway ${k + 1}: the whole way up inside the shadow is unseen at every angle; ${k < 2 ? 'the stair beside the eye is reached' : 'the latch is reached'}`, r);
  }
  ok(/scarab/.test(await goal()), 'the goal names the final guards', await goal());
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, L = mod.latch; L.obj.used = false; L.obj.ch = 0; const t0 = __gms(); while (__gms() - t0 < 1200) { await new Promise(r => requestAnimationFrame(r)); D.me.x = L.x + 0.5; D.me.y = L.y + 0.5; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } return { open: L.open, done: D.RIFT.done }; });
  ok(!r.open && !r.done, 'the latch refuses while its guards stand', r); await shot('bas-pil-latch');
  // a root in the open: three stages, rooted, released
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = D.RIFT.self.amb.BAS, cal = B.calcify, s = mod.secs[2]; s.scr.goTo(0); const t0 = __gms(); while (__gms() - t0 < 1500 && s.scr.moving) await new Promise(r => requestAnimationFrame(r)); s.pyl.setAngle(0); s.pyl.hold = true; cal.reset(); const tot = cal.total; const t1 = __gms(); let rooted = false;
    while (__gms() - t1 < 5000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (cal.rooted > 0) rooted = true; if (!rooted) { D.me.x = s.p.x; D.me.y = s.p.y + 4; } if (rooted && cal.rooted <= 0) break; } s.pyl.hold = false; s.scr.goTo(1); const t2 = __gms(); while (__gms() - t2 < 1500 && s.scr.moving) await new Promise(r => requestAnimationFrame(r)); return { rooted, roots: cal.total - tot, k: cal.k }; });
  ok(r.rooted && r.roots === 1 && r.k === 0, 'held in the open the pet calcifies to the root, then is released', r);
  await M(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); });
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, L = mod.latch, mw = D.M.MW; L.obj.used = false; L.obj.ch = 0; const t0 = __gms(); while (__gms() - t0 < 1500 && !L.open) { await new Promise(r => requestAnimationFrame(r)); D.me.x = L.x + 0.5; D.me.y = L.y + 0.5; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } return { open: L.open, done: D.RIFT.done, exit: !!D.RIFT.exit, door: D.M.marks.d.every(p => D.M.G[p.ty * mw + p.tx] === 1) }; });
  ok(r.open && r.done && r.exit && r.door, 'guards down, the latch in the last shadow opens Eshra\'s ossuary', r);
  await runG(1.5); await shot('bas-pil-done'); await exitStage();

  /* ======================= THE WITNESS CONTAINMENT ======================= */
  await start('basilica', 3); await setupW(); await runG(1.5);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW, G = D.M.G; const rimOK = mod.basins.map(b => { const at = (dx, dy) => G[Math.floor(b.y + dy) * mw + Math.floor(b.x + dx)]; let rim = 0; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2; if (at(Math.cos(a) * 3, Math.sin(a) * 3) === 0) rim++; } return { rim, gaps: [at(3, 0), at(-3, 0)].every(t => t === 1) && [at(0, 3), at(0, -3)].every(t => t === 0), inside: at(0, 0) === 1 }; }); return { basins: mod.basins.length, pens: mod.pens.length, locks: mod.locks.slice(), rimOK, door: D.M.marks.d.every(p => D.M.G[p.ty * mw + p.tx] === 0) }; });
  ok(r.basins === 3 && r.pens === 3 && r.door && r.locks.every(k => k === 0) && r.rimOK.every(q => q.rim > 36 && q.gaps && q.inside), 'the Containment: three basins (a high rim, two gaps, an open floor), three pens, three open-eyed locks on a shut door', r);
  const waitScarab = n => M(async n => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; const t0 = __gms(); while (__gms() - t0 < 9000 && !(S.released >= n && S.scarab && !S.scarab.dead)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const g = S.group.filter(m => !m.dead).map(m => m.type).sort().join(','); return { released: S.released, alive: !!(S.scarab && !S.scarab.dead), group: g, goal: document.getElementById('arcGoal').textContent }; }, n);
  r = await waitScarab(1); ok(r.released === 1 && r.alive && r.group === 'calciteleech,calciteleech,witnessscarab' && /lure witness 1\/3/.test(r.goal), 'the first witness leaves its pen with two leeches; the goal says to lure it into a basin', r);
  await runG(1); await shot('bas-con-witness');
  // killed INSIDE an empty basin: it purifies it and closes a lock
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, sc = S.scarab, b = mod.basins[0]; sc.x = b.x + 0.4; sc.y = b.y; D.me.x = b.x + 4.5; D.me.y = b.y; D.hitMon(sc, 1e9, { flat: true }); for (let i = 0; i < 40; i++) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { pure: mod.basins.map(q => q.pure), n: S.pure, lock: mod.locks[0], stones: S.stones.length, inside: S.inside }; });
  ok(r.pure[0] && r.n === 1 && r.lock > 0.5 && r.stones === 0 && r.inside === 1, 'a witness killed inside an empty basin purifies it and closes one lock', r);
  await shot('bas-con-pure');
  // killed OUTSIDE: an eye stone drops, the pet carries it into an empty basin
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; await window.__w(5); return { released: S.released, goal: document.getElementById('arcGoal').textContent }; });
  ok(r.released === 1 && /defeat its escort/.test(r.goal), 'the next pen waits while the witness\'s escort stands', r);
  const killGroup = () => M(() => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; for (const m of S.group) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); });
  await killGroup();
  r = await waitScarab(2); ok(r.released === 2 && r.alive && r.group === 'calciteleech,calciteleech,witnessscarab', 'its escort down, the second witness comes out with its own two leeches', r);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, sc = S.scarab, s0 = D.M.start; sc.x = s0.x; sc.y = s0.y + 2; D.me.x = s0.x + 5; D.me.y = s0.y + 2; D.hitMon(sc, 1e9, { flat: true }); for (let i = 0; i < 20; i++) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { stones: S.stones.length, n: S.pure, outside: S.outside, goal: document.getElementById('arcGoal').textContent, st: S.stones[0] && { x: S.stones[0].x, y: S.stones[0].y } }; });
  ok(r.stones === 1 && r.n === 1 && r.outside === 1 && /eye stone/.test(r.goal), 'a witness killed outside the basins drops its eye stone (no lock closes)', r);
  await shot('bas-con-stone');
  const ST0 = r.st;
  r = await M(async st => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; for (let i = 0; i < 10; i++) { D.me.x = st.x; D.me.y = st.y; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); } const carried = !!S.carry; const g1 = document.getElementById('arcGoal').textContent;
    // carried over a basin already pure: nothing; then into an empty one
    const b0 = mod.basins[0]; for (let i = 0; i < 10; i++) { D.me.x = b0.x; D.me.y = b0.y; await new Promise(r => requestAnimationFrame(r)); } const still = !!S.carry;
    const b = mod.basins.find(q => !q.pure); const path = []; for (let i = 0; i <= 30; i++) path.push([b0.x + 4 + (b.x - b0.x - 4) * i / 30, b0.y + (b.y - b0.y) * i / 30]);
    D.me.x = b0.x + 4; for (const [x, y] of path) { D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; await new Promise(r => requestAnimationFrame(r)); } for (let i = 0; i < 10; i++) await new Promise(r => requestAnimationFrame(r));
    return { carried, g1, still, carry: !!S.carry, n: S.pure, placed: S.placed, pure: mod.basins.map(q => q.pure) }; }, ST0);
  ok(r.carried && /carry the eye stone/.test(r.g1) && r.still && !r.carry && r.n === 2 && r.placed === 1, 'walking over the stone picks it up; a pure basin will not take it; carried into an empty basin it closes the second lock', r);
  // the third witness, with a sentinel: killed inside the last empty basin
  await killGroup(); r = await waitScarab(3); ok(r.released === 3 && r.group === 'brokensentinel,calciteleech,calciteleech,witnessscarab', 'the last witness comes with two leeches and a sentinel', r);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, sc = S.scarab, b = mod.basins.find(q => !q.pure); sc.x = b.x - 0.3; sc.y = b.y + 0.3; D.me.x = b.x + 4.5; D.me.y = b.y; D.hitMon(sc, 1e9, { flat: true }); for (let i = 0; i < 30; i++) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const g = document.getElementById('arcGoal').textContent; const doneEarly = D.RIFT.done;
    for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); for (let i = 0; i < 40; i++) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const mw = D.M.MW; return { n: S.pure, g, doneEarly, done: D.RIFT.done, exit: !!D.RIFT.exit, door: D.M.marks.d.every(p => D.M.G[p.ty * mw + p.tx] === 1), locks: mod.locks.map(k => +k.toFixed(2)) }; });
  ok(r.n === 3 && /defeat the last/.test(r.g) && !r.doneEarly, 'three locks closed, the escorts must still fall', r);
  ok(r.done && r.exit && r.door && r.locks.every(k => k >= 0.99), 'escorts down: the locks retract and the way to Thessarym opens', r);
  await runG(1.5); await shot('bas-con-done'); await exitStage();

  /* ======================= THE PROCESSION OF STONE ======================= */
  await M(() => { window.__pp.st.dun.god = false; }); await start('basilica', 7); await setupW();   // (god mode is read when a stage starts: off here so the root's damage lands; health is refilled every frame)
  await runG(2);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; return { pylons: mod.pylons.length, major: mod.major, len: mod.scr.len, i: mod.scr.i, locked: mod.scr.locked, arch: D.M.marks.a.every(p => D.M.G[p.ty * mw + p.tx] === 0), gates: mod.gates.map(G => G.open), mons: D.mons.filter(m => !m.dead).map(m => m.type + ':' + m.rmark).sort().join(',') }; });
  ok(r.pylons === 3 && r.major.length === 3 && r.len >= 6 && r.i === 0 && r.locked && r.arch && r.gates.every(o => !o), 'the Procession: a broad screen at the first of three stops, waiting; three pylons; alcove gates and the arch shut', r);
  ok(r.mons === 'brokensentinel:n,calciteleech:k,calciteleech:k,calciteleech:l,calciteleech:l,witnessscarab:w', 'guards: two leeches at stop 1, a sentinel and two leeches at stop 2, a scarab at the final arch', r.mons);
  // keep the guards of the stops out of the way (the scarab of the arch stays)
  await M(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.rmark !== 'w') D.hitMon(m, 1e9, { flat: true }); });
  const route = k => M(k => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = D.RIFT.self.amb.BAS, s = mod.scr, h = s.handle, L = mod.latches[k], pyl = mod.pylons[k]; const pts = [[h.x, h.y + 0.4]]; for (let x = h.x; x > 5.4; x -= 0.5) pts.push([x, s.y + 1.6]); pts.push([L.x + 1.5, L.y], [L.x, L.y]);
    for (let x = s.x - 2; x <= s.x + 2; x += 1) pts.push([x, s.y + 2.2]); let seen = 0; const bad = []; for (const [x, y] of pts) for (let a = 0; a < 3; a++) { pyl.setAngle(a); for (const q of mod.pylons) if (B.gazeSeen(x, y, q.src)) { seen++; bad.push([+x.toFixed(1), +y.toFixed(1), a]); } } let open = 0; for (let x = s.x - 3; x <= s.x + 3; x += 1) for (let a = 0; a < 3; a++) { pyl.setAngle(a); if (B.gazeSeen(x, s.y - 2.5, pyl.src)) open++; } let gap = 0; for (let a = 0; a < 3; a++) { pyl.setAngle(a); if (B.gazeSeen(s.x + 5, s.y + 1.8, pyl.src)) gap++; } pyl.setAngle(0); return { seen, bad: bad.slice(0, 4), open, gap }; }, k);
  const holdHandle = () => M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, h = mod.scr.handle; h.used = false; h.ch = 0; const t0 = __gms(); while (__gms() - t0 < 1300) { await new Promise(r => requestAnimationFrame(r)); D.me.x = h.x; D.me.y = h.y + 0.4; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } return { held: mod.S.held, adv: mod.S.advancing, moving: mod.scr.moving, gate: mod.gates[Math.min(1, mod.S.stop)] && mod.gates[Math.min(1, mod.S.stop)].open, goal: document.getElementById('arcGoal').textContent }; });
  const openLatch = k => M(async k => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, L = mod.latches[k]; L.obj.used = false; L.obj.ch = 0; const t0 = __gms(); while (__gms() - t0 < 1800 && !L.open) { await new Promise(r => requestAnimationFrame(r)); D.me.x = L.x + 0.6; D.me.y = L.y; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; } return { open: L.open, goal: document.getElementById('arcGoal').textContent }; }, k);
  const follow = to => M(async to => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, s = mod.scr, cal = D.RIFT.self.amb.BAS.calcify; const r0 = cal.total; let maxK = 0; const t0 = __gms(); while (__gms() - t0 < 15000 && !(mod.S.stop === to && !mod.S.advancing && !s.moving)) { await new Promise(r => requestAnimationFrame(r)); D.me.x = s.x - 0.8; D.me.y = s.y + 2.0; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; maxK = Math.max(maxK, cal.k); } return { stop: mod.S.stop, y: +s.y.toFixed(2), roots: cal.total - r0, maxK: +maxK.toFixed(2), t: Math.round(__gms() - t0), locked: s.locked }; }, to);
  for (let k = 0; k < 2; k++) {
    r = await route(k); ok(r.seen === 0 && r.open > 3 && r.gap > 0, `stop ${k + 1}: the pylon watches the ground ahead and the open east gap; from the handle along the screen's lee into the west alcove, no eye sees the pet at any angle`, r);
    ok(new RegExp(`Stop ${k + 1}/3 · hold the screen's handle`).test(await goal()), `stop ${k + 1}: the goal says to hold the handle`, await goal());
    r = await holdHandle(); ok(r.held && !r.adv && !r.moving && r.gate && /open the latch/.test(r.goal), `stop ${k + 1}: holding the handle keeps the screen and lifts the alcove gate`, r);
    if (k === 0) { await shot('bas-pro-held');
      r = await holdHandle(); ok(r.held && !r.adv && !r.moving, 'the screen never leaves while the latch is shut (the handle again only holds it again)', r); }
    r = await openLatch(k); ok(r.open && /release the screen's handle/.test(r.goal), `stop ${k + 1}: the latch in the alcove opens; the goal says to release the handle`, r);
    r = await holdHandle(); ok(r.adv || r.moving, `stop ${k + 1}: releasing the handle sends the screen on`, r);
    r = await follow(k + 1); ok(r.stop === k + 1 && r.roots === 0 && r.locked, `the pet walks behind the moving screen to stop ${k + 2} without being rooted`, r);
  }
  // a failed gaze: rooted in the open north of the screen, the pet is set back behind it (and the root hurts)
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = D.RIFT.self.amb.BAS, cal = B.calcify, pyl = mod.pylons[2], s = mod.scr; pyl.setAngle(0); pyl.hold = true; let spot = null; for (let d = 2; d < 8 && !spot; d += 0.5) for (const da of [0, 0.2, -0.2]) { const x = pyl.x + Math.cos(pyl.a + da) * d, y = pyl.y + Math.sin(pyl.a + da) * d; if (!D.blocked(x, y, 0.45, 0) && B.gazeSeen(x, y, pyl.src) && y < s.y - 0.8) { spot = [x, y]; break; } }
    if (!spot) return { spot: null }; D.me.inv = 0; cal.k = 0; cal.immune = 0; cal.rooted = 0; const hp0 = D.ST.hp; D.me.hp = hp0; const ret0 = mod.S.returns; let rooted = false, at = null; const t0 = __gms();
    while (__gms() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); if (cal.rooted > 0 && !rooted) { rooted = true; at = { x: D.me.x, y: D.me.y, hp: D.me.hp }; } if (!rooted) { D.me.x = spot[0]; D.me.y = spot[1]; D.me.vx = D.me.vy = 0; D.me.mp = 999; D.me.inv = 0; if (D.me.hp < hp0 * 0.5) D.me.hp = hp0; } if (rooted && cal.rooted <= 0) break; }
    pyl.hold = false; const want = [mod.S.last[0] - 0.8, mod.S.last[1] + 2.2]; const res = { spot, rooted, returns: mod.S.returns - ret0, at, want, hp0, released: { x: D.me.x, y: D.me.y }, safe: !B.gazeSeen(D.me.x, D.me.y, pyl.src) }; D.me.hp = D.ST.hp; return res; });
  ok(r.spot && r.rooted && r.returns === 1 && r.at && Math.hypot(r.at.x - r.want[0], r.at.y - r.want[1]) < 0.8 && r.safe, 'a failed gaze roots the pet and sets it back behind the screen at its stop, out of sight', r);
  ok(r.at && r.at.hp < r.hp0 - 1, 'and the root hurts', r.at && { hp: r.at.hp, hp0: r.hp0 });
  await shot('bas-pro-root');
  ok(/defeat the witness scarab/.test(await goal()), 'at the final arch the goal names the witness scarab', await goal());
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; const early = mod.S.parking || mod.S.done; for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); const t0 = __gms(); while (__gms() - t0 < 5000 && !D.RIFT.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { early, done: D.RIFT.done, parked: mod.S.parked, sx: +mod.scr.x.toFixed(1), exit: !!D.RIFT.exit, arch: D.M.marks.a.every(p => D.M.G[p.ty * mw + p.tx] === 1), pylonsOpen: D.RIFT.self.amb.C.sources.filter(s => s.pylon).length }; });
  ok(!r.early && r.done && r.parked && r.exit && r.arch && r.pylonsOpen === 0, 'the scarab falls: the screen parks in the sanctuary wall, the eyes go blind, the arch opens', r);
  await runG(1.5); await shot('bas-pro-done'); await exitStage();

  await M(() => { window.__pp.st.dun.god = true; });
  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
