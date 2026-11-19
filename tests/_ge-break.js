// v423 GE: every garden prop kind breaks under the pet's attacks (shots/taps through the engine's prop path 20l, an area blow),
// in its own materials with its debris and GPU burst; the tile becomes floor; the effects clear; and nothing that gates
// progress is breakable (the puzzles, mini-games and boss arenas hold no props; every dungeon prop stands on its room's floor).
// Shots: shots/v423-GE/break-<kind>-a/b-dpr<k>.png (before / mid-break). env: HTML (test-ge.html), DPR (1), SHOTS=0 to skip shots
const { open, STAGES } = require('./_ge-lib.js');
(async () => {
  const dpr = +(process.env.DPR || 1), P = await open({ dpr }), M = P.M, res = [], t0 = Date.now(), shots = process.env.SHOTS !== '0';
  const ok = (name, pass, info) => { res.push([name, !!pass]); console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${pass ? 'OK  ' : 'FAIL'} ${name}${info ? ' · ' + info : ''}`); };
  try {
    await P.stage(STAGES.fight1); await P.run(1.5);
    // the progression check, on a real dungeon: every prop on a tile of a room (a break gives back that room's floor only)
    const prog = await M(() => { const D = window.__pp.arc.game._dbg, Mm = D.M; let off = 0; for (const p of D.propList) if (!(Mm.RM[p.k] >= 0)) off++; return { n: D.propList.length, off }; });
    ok('dungeon: every prop stands on its room\'s floor (no break opens a new route)', prog.off === 0, JSON.stringify(prog));
    const kinds = await M(() => window.GARDEN_PROPS.KINDS);
    for (const kind of kinds) {
      // a prop of this kind, near the pet's start, clear of monsters (an existing one, else one re-dressed as this kind)
      const pick = await M(kind => { const D = window.__pp.arc.game._dbg, me = D.me; for (const m of D.mons) if (!m.boss) { m.hp = 1e9; m.frozen = 99; }
        let best = null, bd = 1e9; for (const p of D.propList) { if (p.broken) continue; const d = (p.kind === kind ? 0 : 50) + Math.hypot(p.x - me.x, p.y - me.y); if (d < bd) { bd = d; best = p; } }
        if (!best) return null; if (best.kind !== kind) { best.kind = kind; best.gpHp = 0; best.hp = 2; } const hp0 = window.GARDEN_PROPS.HPK[kind];
        best.gpHp = 1; best.hp = hp0; me.x = best.x; me.y = best.y + 2.4; me.vx = me.vy = 0; window.__gePick = best; return { x: best.x, y: best.y, k: best.k, hp: best.hp, hp0 }; }, kind);
      if (!pick) { ok(`${kind}: found`, false); continue; }
      await P.run(0.4); if (shots) await P.shot('v423-GE', `break-${kind}-a-dpr${dpr}`);
      // struck: the hits it takes as single taps (the engine's own hitProp, as a shot that reaches it), the last through an area blow
      const r = await M(() => { const D = window.__pp.arc.game._dbg, p = window.__gePick; let hits = 0; while (p.hp > 1 && hits < 20) { D.RES.hitProp(p, 'leaf', 1); hits++; } const before = window.BREAK_FX.stats(); D.RES.areaHit(p.x, p.y - 0.3, 0.6, 10, { el: 'leaf', src: 'tap' }); hits++;
        return { hits, broken: !!p.broken, floor: D.M.G[p.k] === 1 || D.M.G[p.k] === D.X.T_FLOOR, parts: window.BREAK_FX.stats().parts + window.BREAK_FX.stats().shards, bursts: window.GARDEN_PROPS.BURSTS.length, before }; });
      await P.run(0.35); if (shots) await P.shot('v423-GE', `break-${kind}-b-dpr${dpr}`);
      { const s2 = await M(() => window.BREAK_FX.stats()); r.parts = Math.max(r.parts, s2.parts + s2.shards); }   // (the pieces come after its pre-crack)
      ok(`${kind}: breaks after ${pick.hp0} hits, shatters with its debris and light, the tile walkable`, r.broken && r.hits === pick.hp0 && r.floor && r.parts > 0 && r.bursts > 0, JSON.stringify(r));
    }
    await P.run(9, 20);
    const clean = await M(() => ({ bfx: window.BREAK_FX.stats(), bursts: window.GARDEN_PROPS.BURSTS.length }));
    ok('the breaks\' effects clear (pieces, particles, bursts)', clean.bursts === 0 && clean.bfx.parts === 0 && clean.bfx.shards === 0, JSON.stringify(clean));
    await M(() => window.__pp.closeArcade(true)); await P.page.waitForTimeout(300);
    // the progression check, on the stages that gate the way: no props at all (the hedge and every piece are not props)
    for (const k of ['march', 'starfall', 'gallery', 'orrubel']) { await P.stage(STAGES[k], { boss: k === 'orrubel' }); await P.run(0.6, 20);
      const q = await M(() => { const D = window.__pp.arc.game._dbg; return { props: D.propList.length, mprops: D.M.props.size }; });
      ok(`${k}: nothing breakable that gates progress`, q.props === 0 && q.mprops === 0, JSON.stringify(q)); await M(() => window.__pp.closeArcade(true)); await P.page.waitForTimeout(300); }
  } catch (e) { ok('no exception', false, e.message); }
  ok('0 page errors', P.errors.length === 0, JSON.stringify(P.errors.slice(0, 4)));
  const bad = res.filter(r => !r[1]); console.log(bad.length ? `FAILED ${bad.length}/${res.length}` : `ALL OK (${res.length})`);
  await P.browser.close(); process.exit(bad.length ? 1 : 0);
})();
