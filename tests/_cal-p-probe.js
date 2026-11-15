// Rift 0 loading/performance probe (worker P). Per stage:
//  - load: ms from startRift to the ready card (the loading screen's work; noisy under load);
//  - lazy: what was still made AFTER Start in the first PLAY s of play (work the loading screen left undone): prop
//    sprites, monster sprites, ground chunks, patterns, glow sprites, boss meshes — count and ms;
//  - draw cost (2D path in headless): the whole game.draw and the rift's layers (everyStage = amb, the stage's own =
//    mod, the fiend def's draw/drawFx/paintGround = fiend), each called REP times back to back with the game paused, the
//    minimum and median of those (robust to a busy machine; relative numbers only, swiftshader is no phone).
// HTML=test-calP.html node tests/_cal-p-probe.js [stage...]     LOWFX=1 "Fewer effects"; PLAY (game s, 6); REP (25)
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 1 }); const { page, errors } = T;
  if (process.env.LOWFX) await page.evaluate(() => { window.__pp.st.lowFx = true; });
  // (the pet's own GPU picture read back into the 2D frame costs more than everything else under swiftshader: off, so
  // the stage's own cost shows; PETGL=1 keeps it)
  if (!process.env.PETGL) await page.evaluate(() => { window.__noPetGL = 1; });
  // BASE=1: the loading pass as it was before (no preloadMore in 20b, no Rf.preload in 20zz5)
  if (process.env.BASE) await page.evaluate(() => { window.__PRELOAD_MORE = 0; window.__CAL_WARM = 0; });
  // count every picture made: wrap the makers the game calls through their modules
  await page.evaluate(() => { const P = window.__pp, now = () => performance.now(), L = window.__lazy = { on: false, ev: {} };
    const wrap = (o, k, name, keyOf) => { if (!o || typeof o[k] !== 'function' || o[k].__w) return; const f = o[k]; const w = function () { const t = now(); try { return f.apply(this, arguments); } finally { const d = now() - t; if (L.on && d > 0.25) { const e = L.ev[name] || (L.ev[name] = { n: 0, ms: 0, max: 0 }); e.n++; e.ms += d; e.max = Math.max(e.max, d); } } }; w.__w = 1; o[k] = w; };
    wrap(P.DunWorld, 'propSprite', 'prop'); wrap(P.DunWorld, 'chunk', 'chunk'); wrap(P.DunWorld, 'pattern', 'pattern'); wrap(P.DunArt, 'monSprite', 'mon');
    wrap(window, 'glowSprite', 'glowSpr'); });
  const n = await page.evaluate(() => window.__pp.RIFT_BY_ID.caldera.stages.length);
  const only = process.argv.slice(2).map(Number), rows = [], REP = +(process.env.REP || 25), PLAY = +(process.env.PLAY || 6);
  for (let s = 0; s < n; s++) { if (only.length && !only.includes(s)) continue;
    const load = await page.evaluate(async s => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true);
      const t0 = performance.now(); P.startRift('caldera', s); while (P.arc.state !== 'ready') await new Promise(r => setTimeout(r, 5)); return Math.round(performance.now() - t0); }, s);
    const r = await page.evaluate(async ([REP, PLAY]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, now = () => performance.now(), L = window.__lazy, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d');
      const hold = () => { if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } };
      const meshes = () => { const o = {}; try { o.flan = !!(window.__pp.FIEND_DEFS.calflan && FIEND_DEFS.calflan.MODEL); } catch (e) {} return o; };
      L.ev = {}; L.on = true; P.beginPlay();
      // play: the pet walks toward the nearest monster / the boss, so the floor scrolls and things wake as in a real run
      const ws = (() => { try { const W = D.RIFT.self.amb.CAL.warmStats; return Object.assign({}, W, { ms: Math.round(W.ms) }); } catch (e) { return null; } })(); const t0 = now(), g0 = D.g.t; let fr = 0;
      while (D.g.t - g0 < PLAY && now() - t0 < 90000) { await new Promise(r => requestAnimationFrame(r)); hold(); fr++; const b = D.mons.find(m => (m.boss || m.fiend) && !m.dead);
        const tg = b || D.mons.filter(m => !m.dead).sort((p, q) => Math.hypot(p.x - D.me.x, p.y - D.me.y) - Math.hypot(q.x - D.me.x, q.y - D.me.y))[0]; if (tg) { const dx = tg.x - D.me.x, dy = tg.y - D.me.y, d = Math.hypot(dx, dy); if (d > 3) { D.me.x += dx / d * 0.12; D.me.y += dy / d * 0.12; } } }
      L.on = false; const lazy = JSON.parse(JSON.stringify(L.ev));
      // the draw cost, paused: REP back-to-back draws of the same frame
      const A = D.RIFT.self.amb, M = D.RIFT.self.mod, FDd = D.F.fiend && P.FIEND_DEFS[D.F.fiend.id], acc = { amb: [], mod: [], fiend: [] };
      const wraps = []; const wrap = (o, k, key) => { if (!o || typeof o[k] !== 'function') return; const f = o[k]; wraps.push([o, k, f]); o[k] = function () { const t = now(); try { return f.apply(this, arguments); } finally { acc[key].cur += now() - t; } }; };
      for (const key of ['amb', 'mod', 'fiend']) acc[key].cur = 0;
      wrap(A, 'drawGround', 'amb'); wrap(A, 'drawOver', 'amb'); wrap(M, 'drawGround', 'mod'); wrap(M, 'drawOver', 'mod'); if (FDd) { wrap(FDd, 'draw', 'fiend'); wrap(FDd, 'drawFx', 'fiend'); wrap(FDd, 'paintGround', 'fiend'); wrap(FDd, 'sky', 'fiend'); }
      const tot = []; for (let i = 0; i < REP; i++) { for (const key of ['amb', 'mod', 'fiend']) acc[key].cur = 0; c.save(); const t = now(); G.draw(c); tot.push(now() - t); c.restore(); for (const key of ['amb', 'mod', 'fiend']) acc[key].push(acc[key].cur); if (i % 5 === 4) await new Promise(r => setTimeout(r, 0)); }
      for (const [o, k, f] of wraps) o[k] = f;
      const st = a => { const s2 = a.slice().sort((p, q) => p - q); return [+s2[0].toFixed(2), +s2[s2.length >> 1].toFixed(2)]; };
      return { warm: ws, frames: fr, gt: +(D.g.t - g0).toFixed(1), boss: (D.mons.find(m => m.fiend) || {}).act || null, lazy, draw: st(tot), amb: st(acc.amb), mod: st(acc.mod), fiend: st(acc.fiend), edges: A.edges ? A.edges.length : 0, mons: D.mons.length, monCache: P.DunArt.monCache.size, monMB: +([...P.DunArt.monCache.values()].reduce((a, v) => a + v.cv.width * v.cv.height * 4, 0) / 1048576).toFixed(1), biome: D.F.biome, kind: D.F.rift.kind }; }, [REP, PLAY]);
    rows.push(Object.assign({ s, load }, r)); console.log(s, JSON.stringify(rows[rows.length - 1]));
  }
  const lz = o => Object.entries(o).map(([k, e]) => `${k} ${e.n}/${e.ms.toFixed(0)}ms(max ${e.max.toFixed(0)})`).join(', ') || '-';
  console.log('\nstage kind     biome       load  | draw min/med | amb min/med | mod min/med | fiend min/med | lazy after Start (n/ms)');
  for (const r of rows) console.log(`${String(r.s).padEnd(5)} ${r.kind.padEnd(8)} ${r.biome.padEnd(11)} ${String(r.load).padStart(5)} | ${r.draw.join('/').padStart(11)} | ${r.amb.join('/').padStart(10)} | ${r.mod.join('/').padStart(10)} | ${r.fiend.join('/').padStart(12)} | ${lz(r.lazy)} | warm ${r.warm ? `${r.warm.jobs} jobs ${r.warm.ms}ms mons ${r.warm.mons}${r.warm.boss ? ' boss ' + r.warm.boss : ''}` : '-'}`);
  console.log('errors', errors.length, errors.slice(0, 5)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})();
