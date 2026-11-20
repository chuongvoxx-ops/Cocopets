// v433 DE: every dunes prop kind breaks under the pet's attacks (the engine's prop path 20l: taps, an area blow), in its own
// materials with its debris and GPU burst; the tile becomes floor; the effects clear; no prop stands off its room's floor (a
// break opens no route); the puzzles and boss arenas hold no props; a stage's close frees every picture and texture.
// Shots: shots/v433-DE/break-<kind>-a/b.png. env: HTML (test-de.html), SHOTS=0 to skip shots, GPU=1 (the GPU painter forced)
const { open } = require('./_de-lib.js');
const BIO_STAGE = { dunes: 0, mesa: 5, nightdune: 8 };
const KIND_BIO = { dunerock: 'dunes', bones: 'dunes', ribarch: 'dunes', jawtooth: 'dunes', menhir: 'dunes', sanddrift: 'dunes', mesarock: 'mesa', pinkcrystal: 'mesa', crystalout: 'mesa', claypillar: 'mesa', relic: 'mesa', tumbleweed: 'mesa', nightrock: 'nightdune', gravestone: 'nightdune', bonecairn: 'nightdune', glowshroom: 'nightdune', deadtree: 'nightdune', deadshrub: 'nightdune', skullpile: 'nightdune' };
(async () => {
  const P = await open({ gpu: process.env.GPU === '1' }), M = P.M, res = [], t0 = Date.now(), shots = process.env.SHOTS !== '0';
  const ok = (name, pass, info) => { res.push([name, !!pass]); console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${pass ? 'OK  ' : 'FAIL'} ${name}${info ? ' · ' + info : ''}`); };
  try {
    for (const bio of ['dunes', 'mesa', 'nightdune']) {
      await P.stage(BIO_STAGE[bio]); await P.run(1.2, 20);
      const prog = await M(() => { const D = window.__pp.arc.game._dbg, Mm = D.M; let off = 0; const kinds = {}; for (const p of D.propList) { if (!(Mm.RM[p.k] >= 0)) off++; kinds[p.kind] = (kinds[p.kind] || 0) + 1; } return { n: D.propList.length, off, kinds, land: !!window.__pp.BIOMES[D.F.biome].floorFn, decals: Object.keys((Mm.decalsByChunk ? [...Mm.decalsByChunk.values()].flat() : []).reduce((a, d) => (a[d.kind] = 1, a), {})) }; });
      ok(`${bio}: props on their rooms' floors; the land painted; its own decals`, prog.off === 0 && prog.land, JSON.stringify(prog));
      for (const kind of Object.keys(KIND_BIO).filter(k => KIND_BIO[k] === bio)) {
        const pick = await M(kind => { const D = window.__pp.arc.game._dbg, me = D.me; for (const m of D.mons) if (!m.boss) { m.hp = 1e9; m.frozen = 99; }
          let best = null, bd = 1e9; for (const p of D.propList) { if (p.broken) continue; const d = (p.kind === kind ? 0 : 50) + Math.hypot(p.x - me.x, p.y - me.y); if (d < bd) { bd = d; best = p; } }
          if (!best) return null; const real = best.kind === kind; if (!real) best.kind = kind; const hp0 = window.DUNE_PROPS.HPK[kind];
          best.dpHp = 1; best.hp = hp0; me.x = best.x; me.y = best.y + 2.2; me.vx = me.vy = 0; const D2 = window.__pp.arc.game._dbg; if (D2.cam) { D2.cam.x = me.x; D2.cam.y = me.y - 1; } window.__dePick = best; return { real, hp0 }; }, kind);
        if (!pick) { ok(`${kind}: found`, false); continue; }
        await P.run(0.3, 20); if (shots) await P.shot('v433-DE', `break-${kind}-a`);
        const r = await M(() => { const D = window.__pp.arc.game._dbg, p = window.__dePick; let hits = 0; while (p.hp > 1 && hits < 20) { D.RES.hitProp(p, 'gold', 1); hits++; } D.RES.areaHit(p.x, p.y - 0.3, 0.6, 10, { el: 'gold', src: 'tap' }); hits++;
          return { hits, broken: !!p.broken, floor: D.M.G[p.k] === D.X.T_FLOOR || D.M.G[p.k] === 1, parts: window.BREAK_FX.stats().parts + window.BREAK_FX.stats().shards, bursts: window.DUNE_PROPS.BURSTS.length }; });
        await P.run(0.3, 20); if (shots) await P.shot('v433-DE', `break-${kind}-b`);
        { const s2 = await M(() => window.BREAK_FX.stats()); r.parts = Math.max(r.parts, s2.parts + s2.shards); }
        ok(`${kind}${pick.real ? '' : ' (re-dressed)'}: breaks after ${pick.hp0} hits, shatters with its debris and light, the tile walkable`, r.broken && r.hits === pick.hp0 && r.floor && r.parts > 0 && r.bursts > 0, JSON.stringify(r));
      }
      await P.run(4, 30);
      const clean = await M(() => ({ bfx: window.BREAK_FX.stats(), bursts: window.DUNE_PROPS.BURSTS.length, st: window.DUNE_PROPS.stats }));
      ok(`${bio}: the breaks' effects clear`, clean.bursts === 0, JSON.stringify({ bursts: clean.bursts, cached: clean.st.cached, textures: clean.st.textures, px: clean.st.px }));
      await M(() => window.__pp.closeArcade(true)); await P.page.waitForTimeout(400);
      const rel = await M(() => window.DUNE_PROPS.stats);
      ok(`${bio}: closing the stage frees every picture and texture`, rel.cached === 0 && rel.textures === 0, JSON.stringify({ cached: rel.cached, textures: rel.textures }));
    }
    for (const i of [2, 4, 9, 3]) { await P.stage(i); await P.run(0.5, 30);
      const q = await M(() => { const D = window.__pp.arc.game._dbg; return { props: D.propList.length }; });
      ok(`stage ${i}: nothing breakable that gates progress (no props)`, q.props === 0, JSON.stringify(q)); await M(() => window.__pp.closeArcade(true)); await P.page.waitForTimeout(300); }
  } catch (e) { ok('no exception', false, e.message); }
  ok('0 page errors', P.errors.length === 0, JSON.stringify(P.errors.slice(0, 4)));
  const bad = res.filter(r => !r[1]); console.log(bad.length ? `FAILED ${bad.length}/${res.length}` : `ALL OK (${res.length})`);
  await P.browser.close(); process.exit(bad.length ? 1 : 0);
})();
