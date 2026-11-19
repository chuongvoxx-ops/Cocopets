// v423 GE: every garden room type loads and plays with the new art, each mini-game's win path runs (through its own APIs),
// no page errors, and the garden's pictures and textures are given back when each stage closes.
// env: HTML (test-ge.html), DPR (1), LOWFX=1, ONLY (comma list of stage keys)
const { open, STAGES } = require('./_ge-lib.js');
(async () => {
  const dpr = +(process.env.DPR || 1), only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const P = await open({ dpr, lowFx: !!process.env.LOWFX }), M = P.M, res = [], t0 = Date.now(), log = s => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${s}`);
  const ok = (name, pass, info) => { res.push([name, !!pass]); log(`${pass ? 'OK  ' : 'FAIL'} ${name}${info ? ' · ' + info : ''}`); };
  const stats = () => M(() => { const G = window.GARDEN_PROPS; return G ? G.stats : null; });
  const closeAndCheck = async name => { await M(() => { const P2 = window.__pp; if (P2.arc.open) P2.closeArcade(true); }); await P.page.waitForTimeout(400); const s = await stats(); ok(`${name}: pictures freed on exit`, s && s.cached === 0 && s.textures === 0, s ? `cached ${s.cached} textures ${s.textures} released ${s.released}` : 'no GARDEN_PROPS'); };
  const won = () => M(() => !!window.__pp.arc.game._dbg.g.won);
  const waitWon = async secs => { for (let i = 0; i < secs * 4; i++) { if (await won()) return true; await P.run(0.25, 20); } return won(); };
  const want = k => !only || only.includes(k);
  try {
    // the land in every dungeon: floor, walls, cliffs, bridges from the painted textures; the props from the painted pictures
    for (const k of ['fight1', 'fight2', 'fight3']) { if (!want(k)) continue; await P.stage(STAGES[k]); await P.run(2);
      const s = await M(() => { const D = window.__pp.arc.game._dbg, G = window.GARDEN_PROPS, B = window.__pp.BIOMES.garden, kinds = {}; for (const p of D.propList) kinds[p.kind] = (kinds[p.kind] || 0) + 1;
        return { st: G.stats, gap: B.gap, roof: typeof B.roofFn, props: D.propList.length, kinds: Object.keys(kinds).filter(k => G.KINDS.includes(k)).length, painted: Object.keys(window.__pp.DunWorld.PROPS).filter(k => G.KINDS.includes(k) && window.__pp.DunWorld.PROPS[k].__gpp).length }; });
      ok(`${k}: land + props painted`, s.st.textures >= 4 && s.gap === 'gardenvoid' && s.roof === 'function' && s.painted === 9 && s.kinds >= 3, JSON.stringify({ tex: s.st.textures, painted: s.st.painted, props: s.props, kinds: s.kinds, ms: Math.round(s.st.paintMs + s.st.texMs) }));
      await closeAndCheck(k); }
    // the Seedling March: the course, then the Colossus brought low, then the walk to the Garden's heart
    if (want('march')) { await P.stage(STAGES.march); await P.run(3.2);
      await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; m.warp(176.5); m.setN(40); }); await P.run(6, 20);
      const b = await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; if (m.B) { m.B.hp = 6; m.B.enter = false; } return !!m.B; });
      const w = await waitWon(40); const lane = await M(() => window.GARDEN_PROPS.stats.textures); ok('march: the Colossus falls and the march reaches the heart', b && w, `boss ${b} won ${w} lane textures ${lane}`); await closeAndCheck('march'); }
    // the Falling Nursery: the last star caught, the star-bud blooms, through the door
    if (want('starfall')) { await P.stage(STAGES.starfall); await P.run(1.6);
      await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, need = D.RIFT.self.S.need || 24; m.R.mode = 'run'; m.R.caught = need - 1; m.stars.length = 0; m.stars.push({ x: D.me.x, y: D.me.y, t: 0, dur: 0.3, shard: false, ph: 0 }); });
      await P.run(1); const done = await M(() => window.__pp.arc.game._dbg.RIFT.self.done);
      await M(() => { const D = window.__pp.arc.game._dbg, ex = D.RIFT.exit; D.me.x = ex.x; D.me.y = ex.y + 0.2; }); const w = await waitWon(8); ok('starfall: the star-bud blooms and the way opens', done && w, `done ${done} won ${w}`); await closeAndCheck('starfall'); }
    // the Seedshot Gallery: the last pod shot down, the hedge withers, through it
    if (want('gallery')) { await P.stage(STAGES.gallery); await P.run(1.6);
      await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, need = D.RIFT.self.S.need || 24; m.R.mode = 'run'; m.R.pops = need - 1; m.pods.length = 0; m.pods.push({ x: D.me.x, y: D.me.y - 2.2, dir: 1, kind: 'pod', hp: 1, spd: 0, ph: 0, t: 0, hitT: 0 }); });
      let done = false; for (let i = 0; i < 40 && !done; i++) { done = await M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; const p = m.pods[0]; if (p) { p.x = D.me.x; p.y = D.me.y - 2.2; const a0 = D.toWorld(0, 0), a1 = D.toWorld(100, 100), kx = 100 / (a1[0] - a0[0]), ky = 100 / (a1[1] - a0[1]); D.tapAt((p.x - a0[0]) * kx, (p.y - a0[1]) * ky); } return D.RIFT.self.done; }); await P.run(0.25, 20); }
      await M(() => { const D = window.__pp.arc.game._dbg, ex = D.RIFT.exit; D.me.x = ex.x; D.me.y = ex.y + 0.2; }); const w = await waitWon(8); ok('gallery: the hedge withers and the way opens', done && w, `done ${done} won ${w}`); await closeAndCheck('gallery'); }
    // the three boss rooms: the arena painted through the garden's hooks, the trees round its rim
    for (const k of ['orrubel', 'ambrel', 'calyx']) { if (!want(k)) continue; await P.stage(STAGES[k], { boss: true }); await P.run(2, 30);
      const s = await M(() => { const D = window.__pp.arc.game._dbg, G = window.GARDEN_PROPS; return { arena: !!(D.FD && D.FD.S.arenaCv), hooked: !!(G && G.AR && G.AR.trees && G.AR.trees.length), st: G.stats }; });
      ok(`${k}: arena painted, rim dressed`, s.arena && s.hooked, JSON.stringify({ trees: s.hooked, tex: s.st.textures, painted: s.st.painted })); await closeAndCheck(k); }
  } catch (e) { ok('no exception', false, e.message); }
  ok('0 page errors', P.errors.length === 0, JSON.stringify(P.errors.slice(0, 4)));
  const bad = res.filter(r => !r[1]); console.log(bad.length ? `FAILED ${bad.length}/${res.length}` : `ALL OK (${res.length})`);
  await P.browser.close(); process.exit(bad.length ? 1 : 0);
})();
