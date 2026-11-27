// v472 YE: a route through every Yuggoth Engine stage (Rift 06): each loads and plays with no page errors; the land is the painted one
// (its floor, walls, cliffs, bridges; its far view 'yug*'), its props painted (no old 2D drawn), the exit is the Belfry's door in
// the Engine's theme (std / boss), the trials' pieces painted, a prop of each kind breaks (debris, burst, walkable tile, bursts
// clear), the GPU counters in the busiest moment, and every picture / texture given back when the stage is left.
// env: HTML; MODE gl (default) | nogl (no WebGL: the 2D fallback) | lowfx; ONLY (comma list of stage numbers)
const { open } = require('./_ye-lib');
const MODE = process.env.MODE || 'gl', ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
(async () => {
  const T = await open({ noGL: MODE === 'nogl', noWebGL: MODE === 'nogl', lowFx: MODE === 'lowfx', fast: true }), M = T.M, res = [], t0 = Date.now();
  const ok = (name, pass, info) => { res.push([name, !!pass]); console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${pass ? 'OK  ' : 'FAIL'} ${name}${info ? ' · ' + info : ''}`); };
  try {
    const n = await M(() => window.__pp.RIFT_BY_ID.yuggoth.stages.length); ok('the rift has nine stages', n === 9, String(n));
    for (let S = 0; S < n; S++) { if (ONLY && !ONLY.includes(S)) continue; const e0 = T.errors.length;
      await T.stage(S); await T.freeze(); await T.run(1.5, 30);
      const r = await M(async () => { const P = window.__pp, D = P.arc.game._dbg, A = window.YUG_PROPS, K = window.YUG_SKY, F = D.F, B = P.BIOMES[F.biome] || {}, fr = () => new Promise(r => requestAnimationFrame(r)), NG = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX;
        const s0 = A.stats, k0 = K.stats; let frames = 0, maxQ = 0, maxCp = 0; const cp0 = self.PERF ? PERF.cpAcc : 0, fl0 = NG && NG.stats ? NG.stats.frames : 0, tt = performance.now();
        // walk the pet along the stage a little so more of it (and its gaps) is drawn
        const me = D.me; if (F.fiend && D.FD && D.FD.S) { const p = (D.FD.S.props || [])[0] || (D.FD.S.objs || []).find(o => o.kind === 'cell'); if (p) { me.x = p.x + 0.5; me.y = p.y + 2.5; } } const x0 = me.x, y0 = me.y;   /* (v472 YE: in an arena, start by one of its pieces) */ /* v472 YE-fix: the comment above was a line comment that hid the 3 s measuring loop (0 frames) */ while (performance.now() - tt < 3000) { await fr(); frames++; me.hp = D.ST.hp; const u = frames / 60; const nx = x0 + Math.sin(u) * 3, ny = y0 - Math.min(4, u * 1.5); if (D.walkAt(Math.floor(nx), Math.floor(ny))) { me.x = nx; me.y = ny; } if (NG && NG.stats) maxQ = Math.max(maxQ, NG.stats.quads || 0); if (self.PERF) maxCp = Math.max(maxCp, PERF.cpF || 0); }
        const s1 = A.stats, k1 = K.stats, live = window.BEL_DOORS && window.BEL_DOORS.live, props = (D.propList || []).filter(p => !p.broken);
        return { biome: F.biome, kind: F.rift.kind, name: F.rift.name, fiend: !!F.fiend, gap: B.gap, landFn: !!B.floorFn && B.floorUnder === true, land: s1.land, pieces: s1.pieces - s0.pieces, draws: s1.draws - s0.draws, painted: s1.painted, tex: s1.textures, sky: k1.frames - k0.frames, skyQuads: k1.quads - k0.quads, arena: k1.arena, arenaFloor: k1.arenaFloor || 0, hidden: k1.hidden || 0, aprops: window.YUG_ARENA ? window.YUG_ARENA.stats : null, fid: F.fiend ? F.fiend.id : null,
          door: live && live.D && live.D.th ? live.D.th.id + '/' + live.kind : null, propKinds: [...new Set(props.map(p => p.kind))], ready: !!(A.live && A.gpuOK()), frames, gl: { flushesPerFrame: NG && NG.stats ? +((NG.stats.frames - fl0) / frames).toFixed(2) : null, copiesPerFrame: self.PERF ? +((PERF.cpAcc - cp0) / frames).toFixed(2) : null, maxCopies: maxCp, maxQuads: maxQ } }; });
      console.log('stage ' + S + ' ' + JSON.stringify(r));
      const gpu = MODE !== 'nogl';
      if (!r.fiend) {
        ok(`stage ${S} (${r.name}): the land painted (floor ${r.land} tiles, ${r.tex} textures) and its far view '${r.gap}' (${r.sky} frames)`, r.landFn && r.land > 0 && /^yug/.test(r.gap) && r.sky > 0);
        ok(`stage ${S}: props painted (${r.draws} draws) of kinds ${r.propKinds.join(',')}`, r.propKinds.length === 0 || r.painted > 0);
        ok(`stage ${S}: the exit is the Belfry's door in the Engine's theme (${r.door})`, !!r.door && /^yug/.test(r.door) && (r.door.endsWith(S === 1 || S === 4 || S === 7 ? '/boss' : '/std')));
        if (r.kind === 'trial' || r.kind === 'puzzle') ok(`stage ${S}: the trial's pieces ${gpu ? 'painted (' + r.pieces + ')' : 'their old 2D art'}`, gpu ? r.pieces > 0 && r.ready : !r.ready);
      } else { ok(`stage ${S} (${r.name}): the arena's far view is the Engine's (${r.arena} skies painted, ${r.arenaFloor} floors)`, r.arena > 0 && r.arenaFloor > 0);
        ok(`stage ${S}: the arena's props painted (${JSON.stringify(r.aprops)})`, r.aprops && r.aprops[r.fid] > 0 && r.aprops.fallback === 0); }
      ok(`stage ${S}: no page errors`, T.errors.length === e0, JSON.stringify(T.errors.slice(e0, e0 + 3)));
      // a prop of each kind breaks
      if (!r.fiend && r.propKinds.length) { const b = await M(() => { const D = window.__pp.arc.game._dbg, A = window.YUG_PROPS, out = {}; for (const m of D.mons) if (!m.boss) { m.hp = 1e9; m.frozen = 99; }
          for (const kind of A.KINDS) { const p = (D.propList || []).find(q => q.kind === kind && !q.broken); if (!p) continue; let hits = 0; while (!p.broken && hits < 40) { D.RES.hitProp(p, 'gold', 1); hits++; } out[kind] = { hits, broken: !!p.broken, floor: D.walkAt(Math.floor(p.x), Math.floor(p.y)) }; }
          return { out, bursts: A.BURSTS.length, breaks: A.stats.breaks }; });
        ok(`stage ${S}: props break with debris and a burst, the tile walkable`, Object.values(b.out).every(q => q.broken && q.floor) && b.breaks > 0, JSON.stringify(b));
        await T.run(2.2, 30); const cl = await M(() => window.YUG_PROPS.BURSTS.length); ok(`stage ${S}: the breaks' bursts clear`, cl === 0, String(cl)); }
      await M(() => window.__pp.closeArcade(true)); await T.page.waitForTimeout(500);
      const rel = await M(() => ({ p: window.YUG_PROPS.stats, s: window.YUG_SKY.stats, glm: typeof GLM !== 'undefined' && GLM.stats ? GLM.stats.buffers : null }));
      ok(`stage ${S}: leaving gives back every picture and texture (props ${rel.p.cached}, textures ${rel.p.textures}, sky ${rel.s.cached})`, rel.p.cached === 0 && rel.p.textures === 0 && rel.s.cached === 0, 'GLM buffers ' + rel.glm);
    }
  } catch (e) { ok('ran', false, String(e).slice(0, 300)); }
  const nf = res.filter(r => !r[1]).length; console.log(`${res.length - nf}/${res.length} passed (${MODE})`); console.log('errors', JSON.stringify(T.errors.slice(0, 5))); await T.browser.close(); process.exit(nf ? 1 : 0);
})();
