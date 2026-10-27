// The Sea of Fallen Colours' three challenges: the Painted Horde, the Three Lenses, the Colourfall
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 92, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors, shot, start, run, exitStage } = T;
  const M = (f, a) => page.evaluate(f, a);
  let r;
  /* ---- THE PAINTED HORDE ---- */
  await start('colours', 1); await run(6);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, mw = D.M.MW; return { fonts: mod.fonts.length, door: D.M.marks.d.every(p => D.M.G[p.ty * mw + p.tx] === 0), wave: S.wave, tints: [...new Set(S.mobs.map(m => m.tint))] }; });
  ok(r.fonts === 3 && r.door && r.wave === 0 && r.tints.join() === 'R', 'the Painted Horde: three fonts, a shut gate, wave one painted red ' + JSON.stringify(r));
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, m = S.mobs.find(q => !q.dead); m.hp = m.maxhp; let h0 = m.hp; D.hitMon(m, 1000, { flat: true }); const grey = Math.round(h0 - m.hp);
    const f = mod.fonts.find(q => q.k === 'R'); for (let i = 0; i < 6; i++) { D.me.x = f.x; D.me.y = f.y; await new Promise(r => requestAnimationFrame(r)); } h0 = m.hp; D.hitMon(m, 1000, { flat: true }); const red = Math.round(h0 - m.hp);
    D.me.x = f.x + 4; D.me.y = f.y + 4; return { grey, red, paint: S.paint }; });
  ok(r.paint === 'R' && r.red === 1000 && r.grey <= 350, 'blows barely bite on a monster of another colour; stepping into the red font, they bite on the red ones ' + JSON.stringify(r)); await shot('col-horde');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; const seen = [new Set(), new Set(), new Set()], tints = [new Set(), new Set(), new Set()]; let maxAlive = 0; const t0 = performance.now();
    while (performance.now() - t0 < 120000 && !S.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const al = S.mobs.filter(m => !m.dead); maxAlive = Math.max(maxAlive, al.length); if (S.wave >= 0) for (const m of al) { seen[S.wave].add(m); tints[S.wave].add(m.tint); } for (const m of al) if (Math.random() < 0.25) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } }
    return { n: seen.map(s => s.size), tints: tints.map(t => [...t].sort().join('')), maxAlive, done: S.done }; });
  ok(r.n[1] === 45 && r.n[2] === 60 && r.tints[1] === 'B' && r.tints[2] === 'BRY' && r.maxAlive <= 28 && r.done, 'the waves: blue, then every colour at once; never more than 28 alive; the shore is painted ' + JSON.stringify(r));
  r = await M(() => { const D = window.__pp.arc.game._dbg, mw = D.M.MW; return { door: D.M.marks.d.every(p => D.M.G[p.ty * mw + p.tx] === 1), exit: !!D.RIFT.exit }; }); ok(r.door && r.exit, 'the gate opens ' + JSON.stringify(r));
  await exitStage();
  /* ---- THE THREE LENSES ---- */
  await start('colours', 3); await run(2.5);
  const catchAt = i => M(async i => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, l = mod.lenses[i]; const n0 = l.n; const t0 = performance.now();
    while (performance.now() - t0 < 15000 && l.n === n0) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const ray = S.rays.find(m => !m.dead); if (!ray) continue; for (const m of S.rays) if (m !== ray && !m.dead) m.cd = 9;
      if (!(ray.aimT > 0)) { ray.x = l.x - 4.5; ray.y = l.y + 0.3; ray.cd = Math.min(ray.cd, 0.2); } D.me.x = l.x + 2.3; D.me.y = l.y + 0.3; D.me.vx = D.me.vy = 0; }
    return { n: l.n, lit: l.lit }; }, i);
  r = await catchAt(0); ok(r.n === 1, 'a lens between the pet and a prism ray catches its beam ' + JSON.stringify(r)); await shot('col-lens');
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, l = mod.lenses[1], h = mod.hook; return { through: !!h.clip(l.x - 5, l.y, 0, 9), miss: !!h.clip(l.x - 5, l.y + 3, 0, 9), behind: !!h.clip(l.x + 1, l.y, 0, 9) }; });
  ok(r.through && !r.miss && !r.behind, 'a beam is caught only by a lens on its line, ahead of the ray ' + JSON.stringify(r));
  for (const i of [0, 1, 1, 2, 2]) await catchAt(i);
  await run(1.2); r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; return { lit: mod.lenses.map(l => l.lit), done: D.RIFT.done, door: D.M.marks.d.every(p => D.M.G[p.ty * mw + p.tx] === 1) }; });
  ok(r.lit.every(Boolean) && r.done && r.door, 'two catches light each lens; all three open the reef ' + JSON.stringify(r)); await shot('col-lens-done');
  await exitStage();
  /* ---- THE COLOURFALL ---- */
  await start('colours', 6); await run(4);
  r = await M(() => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S; return { orbs: S.orbs.length, got: S.got }; }); ok(r.orbs >= 1, 'the Colourfall: a true colour washes up ' + JSON.stringify(r));
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S, o = S.orbs[0]; const m0 = S.missed; D.me.x = o.x + 6; D.me.y = o.y; const t0 = performance.now(); while (performance.now() - t0 < 12000 && S.orbs.includes(o)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = o.x + 6; D.me.y = o.y; } return { missed: S.missed - m0, got: S.got }; });
  ok(r.missed >= 1 && r.got === 0, 'one left alone fades away ' + JSON.stringify(r)); await shot('col-fall');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; let met = 0; const t0 = performance.now(); while (performance.now() - t0 < 60000 && !S.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const o = S.orbs[0]; if (o) { D.me.x = o.x; D.me.y = o.y; } } return { got: S.got, stains: S.stains, done: S.done, exit: !!D.RIFT.exit }; });
  ok(r.got === 12 && r.stains > 3 && r.done && r.exit, 'twelve caught under the falling colour: a bridge of light rises ' + JSON.stringify(r));
  r = await M(async () => { const D = window.__pp.arc.game._dbg, E = D.RIFT.exit, mw = D.M.MW, tx = Math.floor(E.x); let y = Math.floor(E.y) + 1; while (D.M.G[y * mw + tx] === 1) y++; while (D.M.G[y * mw + tx] !== 1 && y < D.M.MH) y++; D.me.x = E.x; D.me.y = y + 1.5;
    const t0 = performance.now(); while (performance.now() - t0 < 8000 && window.__pp.arc.state === 'play') { D.X.moveEnt(D.me, 0, -0.07); D.me.vx = D.me.vy = 0; D.me.hp = D.ST.hp; await new Promise(r => requestAnimationFrame(r)); } return window.__pp.arc.state; });
  ok(r !== 'play', 'the pet walks the bridge of light to the way on (' + r + ')');
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 });
  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
