// v430 PF: frame cost in the Drowned Belfry, ordinary play and big ultimates, measured by tests/_pf-lib.js.
// Scenarios: crowd (the Drowned Lower Church, a dungeon floor, a crowd of brood fighting the pet), hall (the Hall of Three
// Tides, its water), boss (Uldroth's arena on its GPU sea), storm (the Storm Galleries in rain). Each: F frames of normal
// play, then each ultimate cast in it (Sunflare, Armageddon, Titan, World Shaking, Dead Scream), the first frames after the
// cast (shader compiles, warming) and F frames in its busiest stretch.
// usage: HTML=test-pf.html node tests/_pf-frame.js     env: SCN=crowd,hall,boss,storm  ULTS=sunflare,armageddon,...
//        F=frames per sample (12)  OUT=file.json (rows and summaries)  DPR (2)  PROF=0 (no per-piece syncs)
const { open, summ } = require('./_pf-lib');
const fs = require('fs');
const SCN = (process.env.SCN || 'crowd,hall,boss,storm').split(','), ULTS = (process.env.ULTS || 'sunflare,armageddon,titan,worldshaking,deadscream').split(','), F = +(process.env.F || 12);
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
const AT = { sunflare: 2.6, armageddon: 1.6, titan: 2.2, worldshaking: 1.2, deadscream: 2.0 };   // (seconds into the cast: its busiest stretch)
const STAGE = { crowd: 0, hall: 1, boss: 7, storm: 6 };
(async () => {
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 2) }); const { page, errors, start, frames } = T;
  const out = { html: process.env.HTML, scen: {} };
  for (const sc of SCN) {
    const t0 = Date.now(); await start(STAGE[sc]);
    // the setting: an open spot, the pet in it; a crowd of brood round it (fighting, unkillable), the boss awake in its arena
    const info = await page.evaluate(sc => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g;
      for (let k = 0; k < 90; k++) G.update(1 / 60);
      if (sc === 'hall') { me.x = 52.5; me.y = 59.5; }
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
      if (sc !== 'hall') { let best = null; for (let k = 0; k < 3000; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.7) && W(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; } if (best && sc !== 'boss') { me.x = best.x; me.y = best.y + 2; } }
      const boss = D.mons.find(m => m.boss && !m.dead); if (sc === 'boss' && boss) { me.x = boss.x; me.y = boss.y + 4.5; if (D.wakeBoss) try { D.wakeBoss(); } catch (e) {} }
      const brood = D.mons.filter(m => !m.boss && !m.dead), N = sc === 'crowd' || sc === 'storm' ? 16 : sc === 'hall' ? 8 : 0;
      brood.forEach((m, i) => { if (i < N) { const b = i / N * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); } });
      g.intro = 0; g.bossIntro = 0; D.banners.length = 0; me.face = 1; if (D.SKIP) D.SKIP.fog = true;
      for (let k = 0; k < 120 || (g.bossIntro > 0 && k < 900); k++) { me.hp = D.ST.hp; G.update(1 / 60); }
      return { me: [+me.x.toFixed(1), +me.y.toFixed(1)], mons: D.mons.filter(m => !m.dead).length, boss: !!boss, biome: D.F.biome, name: D.F.rift && D.F.rift.name };
    }, sc);
    console.log(`\n== ${sc} (stage ${STAGE[sc]}, loaded in ${((Date.now() - t0) / 1000).toFixed(0)} s)`, JSON.stringify(info));
    const S = out.scen[sc] = { info, base: null, ults: {} };
    await frames(30, { prof: false });   // (warm: the ground's chunks and the monsters' pictures painted, as the loading screen and the first seconds do)
    let r = await frames(F, { prof: process.env.PROF !== '0' }); S.base = summ(r.rows); S.cv = r.cv; S.baseRows = r.rows;
    console.log(` base  ${line(S.base)}`);
    for (const u of ULTS) {
      // (the Ultimate in the kit, prepared as a stage prepares its party's Ultimates when it is made (their .warm), and some frames
      // played, so the first frames of the cast are what a player's first cast costs, not a test's late kit swap)
      await page.evaluate(([u, el]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; const mv = P.ELEM_LIST[el]['ey_' + u]; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); const I = P.ELEM_IMPL && P.ELEM_IMPL[el] && P.ELEM_IMPL[el].ult[u]; if (I && I.warm) try { I.warm({ evo: 7, T: () => (G.Tz ? G.Tz() : 48) }); } catch (e) {} }, [u, EL[u]]);
      await frames(12, { prof: false });
      const cast = await page.evaluate(([u, el]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g, me = D.me;
        me.mp = 999; g.cdU = 0; g.intro = 0; g.bossIntro = 0; const bs = D.mons.find(m => m.boss && !m.dead); if (bs && D.FD) { me.x = bs.x + 0.5; me.y = bs.y + 3.2; me.vx = me.vy = 0; }   // (in a boss arena, cast at the boss)
        const n0 = D.ELEM ? D.ELEM.fx.length : 0; D.useUlt(); window.__PF_F = D.ELEM && D.ELEM.fx[D.ELEM.fx.length - 1]; return { fx: (D.ELEM ? D.ELEM.fx.length : 0) - n0 }; }, [u, EL[u]]);
      // the first frames of the cast (its pictures and programs warming), then on to its busiest stretch
      r = await frames(6, { prof: false }); const first = summ(r.rows), comp = r.compiles;
      await page.evaluate(at => { const G = window.__pp.arc.game, D = G._dbg, f = window.__PF_F; let k = 0; while (f && f.t < at && k++ < 600) { D.me.hp = D.ST.hp; D.me.mp = 999; G.update(1 / 60); } }, AT[u]);
      r = await frames(F, { prof: process.env.PROF !== '0' }); const busy = summ(r.rows);
      S.ults[u] = { cast, first, busy, compiles: comp, rows: r.rows };
      console.log(` ${u.padEnd(12)} first ${first.tot.toFixed(0)} ms (worst ${first.worst.toFixed(0)}, compiles ${comp.length}) | busy ${line(busy)}`);
      // the cast ends: its effects run out before the next one
      await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 60 * 14; k++) { D.me.hp = D.ST.hp; G.update(1 / 60); if (!D.ELEM || !D.ELEM.fx.length) break; } if (D.helpers) D.helpers.length = 0; });
    }
  }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  console.log('\npage errors', errors.length, errors.slice(0, 4));
  await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
function line(s) {
  const pr = Object.entries(s.pr).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ' ' + v.toFixed(1)).join(', ');
  return `frame ${s.tot.toFixed(1)} ms (med ${s.med.toFixed(1)}, p99 ${s.p99.toFixed(1)}, worst ${s.worst.toFixed(1)}) upd ${s.upd.toFixed(1)} draw ${s.draw.toFixed(1)} post ${s.post.toFixed(1)} | FGFX ${s.fgFlush.toFixed(1)} flushes ${s.fgMs.toFixed(1)} ms, ${s.fgQuads.toFixed(0)}+${s.fgSmoke.toFixed(0)} quads, ${s.fgDraws.toFixed(1)} draws, ${s.fgComp.toFixed(1)} composites (${(s.diGLA / 1e6).toFixed(1)} Mpx, ${s.diGLms.toFixed(1)} ms), fill ${(s.fgFill / 1e6).toFixed(2)} Mpx | GLM ${s.glmN.toFixed(1)} layers ${s.glmMs.toFixed(1)} ms ${s.glmDraw.toFixed(0)} draws | 2D di ${s.di.toFixed(0)} (${(s.diA / 1e6).toFixed(1)} Mpx) grad ${s.grad.toFixed(1)} cv+ ${s.cvNew.toFixed(1)} lighter ${s.lighter.toFixed(0)} (${(s.lighterA / 1e6).toFixed(1)} Mpx) shadow ${s.shad.toFixed(1)} filt ${s.filt.toFixed(1)} | GL tex ${s.glTex.toFixed(1)} buf ${(s.glBufB / 1e3).toFixed(0)} kB | heap+ ${(s.heapPos / 1e3).toFixed(0)} kB | parts ${s.parts.toFixed(0)} | ${pr}`;
}
