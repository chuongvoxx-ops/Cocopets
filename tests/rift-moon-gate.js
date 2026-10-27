// The Silverline Basin (Pisces gate): catch the leaping star-fish in their silver ripples (twelve), avoid the eels,
// then catch the golden knot-fish three times in a row
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 82, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors, shot, start, run } = T;
  const M = (f, a) => page.evaluate(f, a);
  await start('moon', 'gate'); await run(4);
  let r = await M(() => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; return { phase: S.phase, leaps: S.leaps.length, name: D.F.rift.name, biome: D.F.biome }; });
  ok(r.phase === 'fish' && r.leaps >= 1, 'the basin: star-fish begin to leap ' + JSON.stringify(r)); await shot('moon-gate-a');
  // stand clear of a star's ripple: it lands on empty sand (missed)
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S, raf = () => new Promise(r => requestAnimationFrame(r)); let l = null; const t0 = performance.now(); while (performance.now() - t0 < 8000 && !l) { await raf(); l = S.leaps.find(q => q.kind === 'star'); }
    const m0 = S.misses, c0 = S.caught[0]; while (S.leaps.includes(l)) { await raf(); D.me.x = 19; D.me.y = 28.5; D.me.vx = D.me.vy = 0; if (Math.hypot(l.x - 19, l.y - 28.5) < 2) break; } return { missed: S.misses > m0, caught: S.caught[0] - c0 }; });
  ok(r.missed && r.caught === 0, 'a star that lands on empty sand is lost ' + JSON.stringify(r));
  // stand in an eel's ripple: it hurts
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S, raf = () => new Promise(r => requestAnimationFrame(r)); let l = null; const t0 = performance.now(); while (performance.now() - t0 < 20000 && !l) { await raf(); D.me.hp = D.ST.hp; l = S.leaps.find(q => q.kind === 'eel' && q.t < q.life - 0.3); }
    if (!l) return { none: true }; const e0 = S.eelHits, d0 = D.g.dmgTaken, c0 = S.caught[0] + S.caught[1]; while (S.leaps.includes(l)) { await raf(); D.me.x = l.x; D.me.y = l.y; D.me.vx = D.me.vy = 0; } await raf(); return { eel: S.eelHits - e0, dmg: Math.round(D.g.dmgTaken - d0), caught: S.caught[0] + S.caught[1] - c0 }; });
  ok(r.eel === 1 && r.caught === 0, 'an eclipse eel landing on the pet hurts it and catches nothing ' + JSON.stringify(r));
  // catch the stars: stand in each silver ripple as it lands
  const catchStars = () => M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S, raf = () => new Promise(r => requestAnimationFrame(r)); const t0 = performance.now(); let maxC = 0, lives = [];
    while (performance.now() - t0 < 90000 && S.phase === 'fish') { await raf(); D.me.hp = D.ST.hp; const st = S.leaps.filter(q => q.kind === 'star').sort((a, b) => (b.t / b.life) - (a.t / a.life)); maxC = Math.max(maxC, S.leaps.length); if (st[0]) { D.me.x = st[0].x; D.me.y = st[0].y; D.me.vx = D.me.vy = 0; lives.push(st[0].life); } if (S.caught[0] === 3 && !window.__mid) window.__mid = 1; }
    return { caught: S.caught, phase: S.phase, maxC, lifeMax: Math.max(...lives).toFixed(2), lifeMin: Math.min(...lives).toFixed(2) }; });
  r = await catchStars(); ok(r.caught[0] === 6 && r.caught[1] === 6 && r.phase === 'knot' && r.maxC <= 3 && +r.lifeMin < +r.lifeMax, 'twelve stars caught light both fish; the leaps quicken; then the knot ' + JSON.stringify(r));
  await run(1); await shot('moon-gate-b');
  // the golden knot: miss once (it starts again), then three in a row
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S, raf = () => new Promise(r => requestAnimationFrame(r)); const t0 = performance.now(); let reset = false, best = 0, k1 = -1;
    while (performance.now() - t0 < 30000 && !S.won) { await raf(); D.me.hp = D.ST.hp; const l = S.leaps.find(q => q.kind === 'knot');
      if (!l) continue; if (S.knot === 1 && !reset) { if (k1 < 0) k1 = 1; D.me.x = l.x + 4; D.me.y = l.y; if (l.t >= l.life - 0.03) reset = true; } else { D.me.x = l.x; D.me.y = l.y; } D.me.vx = D.me.vy = 0; best = Math.max(best, S.knot); await raf(); if (reset && S.knot === 0) reset = 'confirmed'; }
    return { won: S.won, knot: S.knot, reset, done: D.RIFT.done }; });
  ok(r.won && r.knot === 3 && r.reset === 'confirmed', 'a missed knot-fish starts the knot again; three in a row and Pisces wakes ' + JSON.stringify(r));
  await shot('moon-gate-c');
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 }); ok(true, 'the gate is won');
  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
