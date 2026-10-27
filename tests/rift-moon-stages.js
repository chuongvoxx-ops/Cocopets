// The Hollow Moon's three challenges: the Weighing, the Tide Run, the Black Sun Siege
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 82, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library'] }); const { page, errors, shot, start, run, exitStage } = T;
  const M = (f, a) => page.evaluate(f, a);
  let r;

  /* ---- THE WEIGHING ---- */
  await start('moon', 1); await run(4);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, mw = D.M.MW, d = D.M.marks.d; return { plates: mod.plates.length, door: d.every(p => D.M.G[p.ty * mw + p.tx] === 0), calves: S.calves.filter(m => !m.dead && m.heavy).length, hook: typeof mod.hook }; });
  ok(r.plates === 3 && r.door && r.calves >= 2 && r.hook === 'function', 'the Weighing: three scales, a shut moon gate, heavy mooncalves hunting ' + JSON.stringify(r)); await shot('moon-wei-a');
  // a landing outside a scale, or by a monster that isn't one of the heavy calves, weighs nothing
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, c = S.calves.find(m => !m.dead), p = mod.plates[0]; mod.hook(c, p.x + 4, p.y + 4); mod.hook({ x: p.x, y: p.y }, p.x, p.y); return mod.plates.map(q => q.w); });
  ok(r.every(w => w === 0), 'a landing off the scales (or by anything else) weighs nothing ' + JSON.stringify(r));
  const weigh = (shotAt) => M(async (shotAt) => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, raf = () => new Promise(r => requestAnimationFrame(r)); const log = []; let hurtOnPlate = 0, shots = 0;
    for (const pl of mod.plates) { const t1 = performance.now();
      while (!pl.lock && performance.now() - t1 < 45000) { await raf(); D.me.hp = D.ST.hp;
        const cr = S.calves.find(m => !m.dead && (m.crouchT > 0 || m.leapT > 0));
        if (cr) { if (Math.hypot(D.me.x - pl.x, D.me.y - pl.y) < 1.8 && cr.leapT > 0 && cr.leapT < 0.1) hurtOnPlate++; D.me.x = pl.x + 3.6; D.me.y = pl.y + 1.2; }
        else { D.me.x = pl.x; D.me.y = pl.y; for (const m of S.calves) if (!m.dead && Math.hypot(m.x - pl.x, m.y - pl.y) > 6) { m.x = pl.x + 4; m.y = pl.y + 2.5; } }
        D.me.vx = D.me.vy = 0; if (pl.i === 0 && pl.w === 1 && !shots) { shots = 1; window.__shotNow = 1; } }
      log.push({ i: pl.i, w: pl.w, lock: pl.lock, s: Math.round((performance.now() - t1) / 1000) }); }
    await new Promise(r => setTimeout(r, 1600)); return { log, locked: S.locked, done: D.RIFT.done, landed: S.landed }; }, shotAt);
  r = await weigh(); ok(r.locked === 3 && r.log.every(l => l.lock && l.w === 3) && r.done, 'three landings on each scale weigh it down; all three open the gate ' + JSON.stringify(r));
  await run(1.5); await shot('moon-wei-b');
  r = await M(() => { const D = window.__pp.arc.game._dbg, mw = D.M.MW, d = D.M.marks.d, S = D.RIFT.self.mod.S; return { door: d.every(p => D.M.G[p.ty * mw + p.tx] === 1), exit: !!D.RIFT.exit, calves: S.calves.filter(m => !m.dead).length, hook: D.RIFT.self.mod.hook }; });
  ok(r.door && r.exit && r.calves === 0 && r.hook === null, 'the gate opens, the calves fall still, the way on is shown ' + JSON.stringify(r));
  await exitStage();

  /* ---- THE TIDE RUN ---- */
  await start('moon', 3); await run(2);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, mw = D.M.MW; return { seals: mod.seals.filter(m => !m.dead).length, gates: mod.gates.map(g => g.tiles.every(t => D.M.G[t.ty * mw + t.tx] === 0)), tide: S.tideY, started: S.started }; });
  ok(r.seals === 3 && r.gates.every(Boolean) && !r.started, 'the Tide Run: three seals shut three ways up; the tide waits a moment ' + JSON.stringify(r));
  await run(5); r = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S; return { started: S.started, tide: S.tideY }; }); const t0 = r.tide;
  await run(2); r = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S; return { started: S.started, tide: S.tideY }; });
  ok(r.started && r.tide < t0, 'the tide rises ' + JSON.stringify({ t0, t1: r.tide }));
  // in the tide: it hurts, and drags you down
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; S.tideY = 57.5; D.me.x = 14.5; D.me.y = 59.5; const h0 = S.tideHits || 0, y0 = D.me.y; const t0 = performance.now(); while (performance.now() - t0 < 1500) { await new Promise(r => requestAnimationFrame(r)); S.tideY = 57.5; D.me.vx = D.me.vy = 0; } return { dmg: (S.tideHits || 0) - h0, dy: +(D.me.y - y0).toFixed(2) }; });
  ok(r.dmg > 0 && r.dy > 0.3, 'standing in the tide hurts and drags the pet down ' + JSON.stringify(r)); await shot('moon-tide-in');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; D.me.x = 14.5; D.me.y = 52; const m = D.X.spawnMon('dustwraith', 10.5, 60.5, { rift: true }); S.tideY = 57; for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r)); return m.dead; });
  ok(r, 'the tide drowns a monster it reaches');
  // the catch-up: far ahead of the tide, it rises fast
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; S.tideY = 60; D.me.x = 14.5; D.me.y = 44.5; const t0 = performance.now(), y0 = S.tideY; while (performance.now() - t0 < 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.x = 14.5; D.me.y = 44.5; } const dt = (performance.now() - t0) / 1000; return +((y0 - S.tideY) / dt).toFixed(2); });
  ok(r > 1.1, 'far ahead of it, the tide races to catch up (' + r + ' m/s)');
  r = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S; return { entered: S.entered, mobs: S.mobs.filter(m => !m.dead).length }; });
  ok(r.entered[0] && r.mobs >= 6, 'climbing into a cavern springs its ambush ' + JSON.stringify(r)); await shot('moon-tide-ambush');
  // breaking a seal crystal opens its way
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; D.RIFT.self.mod.S.tideY = 65; D.hitMon(mod.seals[0], 1e9, { flat: true }); for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r)); return { open: mod.gates.map(g => g.open), tiles: mod.gates[0].tiles.every(t => D.M.G[t.ty * mw + t.tx] === 1), seal0: mod.seals[0].maxhp, atk: D.ST.atk }; });
  ok(r.open[0] && !r.open[1] && r.tiles, 'breaking the first seal crystal opens the first way up ' + JSON.stringify(r));
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; for (const m of mod.seals) D.hitMon(m, 1e9, { flat: true }); for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r)); return { open: mod.gates.map(g => g.open), done: D.RIFT.done, exit: !!D.RIFT.exit, mobs: mod.S.mobs.filter(m => !m.dead).length }; });
  ok(r.open.every(Boolean) && r.done && r.exit && r.mobs === 0, 'the last seal holds the tide back: the way on opens ' + JSON.stringify(r));
  await exitStage();

  /* ---- THE BLACK SUN SIEGE ---- */
  await start('moon', 6); await run(7);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; return { wave: S.wave, lotus: mod.lotus.length, light: mod.lamp.light, mobs: S.mobs.length, umbral: S.mobs.filter(m => m.type === 'umbral').length }; });
  ok(r.wave === 0 && r.lotus === 3 && r.mobs > 4 && r.umbral > 0, 'the siege: wave one pours out of the sea, shades among it ' + JSON.stringify(r));
  // the shades go to the lamp and drink its light (the pet stays far off)
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; const l0 = mod.lamp.light; let drink = 0; const t0 = performance.now(); while (performance.now() - t0 < 6000) { await new Promise(r => requestAnimationFrame(r)); D.me.x = 12.5; D.me.y = 29.5; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; drink = Math.max(drink, S.mobs.filter(m => !m.dead && m.drink).length); } return { drink, l0: Math.round(l0), l1: Math.round(mod.lamp.light) }; });
  ok(r.drink >= 2 && r.l1 < r.l0, 'umbral shades run to the lamp and drink its light ' + JSON.stringify(r)); await shot('moon-siege-drink');
  // a charged lotus flares: everything near it burns
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, l = mod.lotus[0]; const near = []; for (let i = 0; i < 4; i++) near.push(D.X.spawnMon(i % 2 ? 'umbral' : 'tideling', l.x + Math.cos(i) * 2, l.y + Math.sin(i) * 1.5, { rift: true })); near.forEach(m => S.mobs.push(m)); const far = D.X.spawnMon('tideling', l.x + 9, l.y + 2, { rift: true }); S.mobs.push(far); const fh = far.hp;
    l.ch = 1; for (let i = 0; i < 50 && l.ch > 0; i++) { D.me.x = l.x; D.me.y = l.y; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); } return { flared: l.ch < 1, flares: S.flares, umbralDead: near.filter((m, i) => i % 2).every(m => m.dead), hurt: near.filter((m, i) => !(i % 2)).every(m => m.dead || m.hp < m.maxhp * 0.3), farSafe: far.hp === fh || far.dead === false }; });
  ok(r.flared && r.flares >= 1 && r.umbralDead && r.hurt && r.farSafe, 'standing on a lit lotus flares it: everything near it burns, nothing far away ' + JSON.stringify(r)); await shot('moon-siege-flare');
  // the light goes out; standing at the lamp lights it again
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, L = mod.lamp; L.light = 0.001; D.me.x = 12.5; D.me.y = 29.5; for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r)); const out = L.out; const t0 = performance.now(); while (performance.now() - t0 < 4000 && L.out) { D.me.x = L.x + 1.1; D.me.y = L.y + 0.6; D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; await new Promise(r => requestAnimationFrame(r)); } return { out, relit: !L.out, light: Math.round(L.light), s: Math.round((performance.now() - t0) / 100) / 10 }; });
  ok(r.out && r.relit && r.light >= 40, 'the light goes out; standing at the lamp lights it again ' + JSON.stringify(r));
  // the three waves: 50, 70, 90 (never more than 36 at once), the herald in the third
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; for (const m of S.mobs) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); const seen = [new Set(), new Set(), new Set()]; let maxAlive = 0, herald = null; const w0 = S.wave, p0 = S.poured; const t0 = performance.now();
    while (performance.now() - t0 < 150000 && !S.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; mod.lamp.light = 100; mod.lamp.out = false; const al = S.mobs.filter(m => !m.dead); maxAlive = Math.max(maxAlive, al.length); if (S.wave >= 0) for (const m of al) seen[S.wave].add(m); if (S.herald) herald = { r: S.herald.r, k: Math.round(S.herald.maxhp / 60), drink: S.herald.drinkK }; for (const m of al) if (Math.random() < 0.25) D.hitMon(m, 1e9, { flat: true }); }
    return { w0, p0, n: seen.map(s => s.size), maxAlive, herald, done: S.done }; });
  ok(r.n[1] === 70 && r.n[2] === 90 && r.maxAlive <= 36 && r.herald && r.herald.r > 0.8 && r.done, 'the waves: 70 then 90, never more than 36 at once, the Umbral Herald in the last ' + JSON.stringify(r));
  await run(1.5); await shot('moon-siege-won');
  // walk (not teleport) from the island up the bridge to the way on
  r = await M(async () => { const D = window.__pp.arc.game._dbg, E = D.RIFT.exit, mw = D.M.MW, tx = Math.floor(E.x); let br = 0; for (let y = Math.floor(E.y) + 1; y < D.M.MH; y++) { if (D.M.G[y * mw + tx] === 5) br++; else if (br) break; }
    let y = Math.floor(E.y) + 1; while (y < D.M.MH && D.M.G[y * mw + tx] !== 1 || y <= Math.floor(E.y) + br) y++; D.me.x = E.x; D.me.y = y + 1.5; const y0 = D.me.y;
    const t0 = performance.now(); while (performance.now() - t0 < 8000 && window.__pp.arc.state === 'play') { D.X.moveEnt(D.me, 0, -0.07); D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); }
    return { br, y0: +y0.toFixed(1), y1: +D.me.y.toFixed(1), state: window.__pp.arc.state, done: D.RIFT.done }; });
  ok(r.br >= 4 && r.done && r.state !== 'play', 'the light holds: a moonstone bridge rises, and the pet can WALK up it to the way on ' + JSON.stringify(r));
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 }); await page.waitForTimeout(600);

  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
