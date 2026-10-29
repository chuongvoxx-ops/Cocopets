// The Suspended Garden (Libra gate): the board leans toward the pet; roll the pearl into three blossom cups past the holes
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 92, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'colours', 'basilica'] }); const { page, errors, shot, start, run } = T;
  const M = (f, a) => page.evaluate(f, a);
  await start('basilica', 'gate'); await run(2.5);
  let r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { intro: mod.S.intro, cups: mod.cups.map(c => c.state), pearl: mod.S.pearl.state, tx: mod.S.tx, goal: document.getElementById('arcGoal').textContent }; });
  ok(!r.intro && r.cups.join() === 'open,bud,bud' && Math.abs(r.tx) < 0.1, 'the board hangs level, the first blossom open ' + JSON.stringify(r)); await shot('bas-gate-a');
  // stand at the right edge: the board leans right and the pearl rolls that way, faster and faster
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, p = S.pearl, raf = () => new Promise(r => requestAnimationFrame(r));
    p.x = mod.CX; p.y = mod.CY; p.vx = p.vy = 0; p.state = 'roll'; const x0 = p.x, sp = [];
    const t0 = performance.now(); while (performance.now() - t0 < 2000) { D.me.x = mod.CX + 4.2; D.me.y = mod.CY; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; await raf(); sp.push(p.vx); }
    return { tx: S.tx, ty: S.ty, moved: p.x - x0, v1: sp[Math.floor(sp.length / 3)], v2: sp[sp.length - 1], state: p.state, petZ: D.me.z }; });
  ok(r.tx > 0.5 && r.moved > 0.25 && r.v2 > r.v1 && r.v1 > 0 && r.petZ < 0, 'the board leans toward the pet and the pearl speeds down the low side ' + JSON.stringify(r)); await shot('bas-gate-tilt');
  // and the other way: up toward a far corner
  await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; D.me.x = mod.CX - 4.3; D.me.y = mod.CY - 3.3; const p = mod.S.pearl; p.x = mod.CX; p.y = mod.CY; p.vx = p.vy = 0; }); await run(2);
  r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { tx: mod.S.tx, ty: mod.S.ty }; }); ok(r.tx < -0.5 && r.ty < -0.5, 'standing in a far corner leans the board there ' + JSON.stringify(r)); await shot('bas-gate-corner');
  // a pearl rolled into a hole falls through and a new one appears at the centre
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, p = S.pearl, h = mod.holes[0], raf = () => new Promise(r => requestAnimationFrame(r)), f0 = S.falls;
    D.me.x = mod.CX; D.me.y = mod.CY; p.state = 'roll'; p.x = h.x + 0.9; p.y = h.y; p.vx = -3; p.vy = 0; let fell = false; const t0 = performance.now();
    while (performance.now() - t0 < 1500 && !fell) { D.me.x = mod.CX; D.me.y = mod.CY; await raf(); fell = p.state === 'fall'; }
    const t1 = performance.now(); while (performance.now() - t1 < 9000 && p.state !== 'roll') { D.me.x = mod.CX; D.me.y = mod.CY; await raf(); }
    return { fell, falls: S.falls - f0, state: p.state, atCentre: Math.hypot(p.x - mod.CX, p.y - mod.CY) < 0.3, cup: mod.cups[0].state }; });
  ok(r.fell && r.falls === 1 && r.state === 'roll' && r.atCentre && r.cup === 'open', 'the pearl falls through a hole and a new one appears at the centre ' + JSON.stringify(r));
  // steer the pearl into each blossom in turn by where the pet stands (a little controller: lean toward the cup, damp the speed, shy from holes)
  const steer = (n) => M(async (n) => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, p = S.pearl, raf = () => new Promise(r => requestAnimationFrame(r)), cl = (v, a, b) => Math.max(a, Math.min(b, v)), d0 = S.delivered, f0 = S.falls, seen = { weights: 0, drift: false };
    const t0 = performance.now(); while (performance.now() - t0 < 60000 && S.delivered === d0 && !S.won) { await raf(); D.me.hp = D.ST.hp; const cup = mod.openCup() || mod.cups[n]; seen.weights = Math.max(seen.weights, S.weights.length); if (S.drift) seen.drift = true;
      if (p.state !== 'roll') { D.me.x = mod.CX; D.me.y = mod.CY; continue; }
      let ax = (cup.x - p.x) * 2.2 - p.vx * 2.4, ay = (cup.y - p.y) * 2.2 - p.vy * 2.4;
      for (const h of mod.allHoles()) { const dx = p.x - h.x, dy = p.y - h.y, d = Math.hypot(dx, dy); if (d < 1.9) { const k = (1.9 - d) * 9 / (d || 0.1); ax += dx * k; ay += dy * k; } }
      const tx = cl(ax / 6.5, -1, 1) - S.wt.x, ty = cl(ay / 6.5, -1, 1) - S.wt.y; D.me.x = mod.CX + cl(tx, -0.95, 0.95) * mod.HW; D.me.y = mod.CY + cl(ty, -0.95, 0.95) * mod.HH; D.me.vx = D.me.vy = 0; }
    const t1 = performance.now(); while (performance.now() - t1 < 2500 && p.state !== 'roll' && !S.won) await raf();
    return { delivered: S.delivered, cups: mod.cups.map(c => c.state), falls: S.falls - f0, won: S.won, seen, goal: document.getElementById('arcGoal').textContent }; }, n);
  for (let k = 0; k < 3; k++) { r = await steer(k); const want = ['done', 'done', 'done'].map((s, i) => i <= k ? 'done' : i === k + 1 ? 'open' : 'bud').join();
    ok(r.delivered === k + 1 && r.cups.join() === want && (k < 2 || r.won), `blossom ${k + 1} filled, in order ` + JSON.stringify(r));
    if (k === 0) { await run(5.5); const w = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.S.weights.length); ok(w > 0, 'gold weights drop after the first blossom (' + w + ')'); await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; D.me.x = mod.CX + 1.5; D.me.y = mod.CY + 2.5; }); await run(1.6); await shot('bas-gate-b'); }
    if (k === 1) { r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { drift: !!mod.S.drift, holes: mod.allHoles().length }; }); ok(r.drift && r.holes === 5, 'a wandering hole after the second ' + JSON.stringify(r)); await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; D.me.x = mod.CX - 2; D.me.y = mod.CY + 3.2; }); await run(2.5); await shot('bas-gate-c'); } }
  await shot('bas-gate-d');
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 }); ok(true, 'the gate is won');
  r = await T.rs(); ok(r.gates && r.gates.basilica === 1, 'the Libra gate is recorded');
  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
