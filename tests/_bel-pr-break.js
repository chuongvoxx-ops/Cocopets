// v392 PR: the Belfry's props break as the Caldera's do (BREAK_FX, in their own material, cut from their new pictures), and
// the objective pieces do not. Every breakable kind on the rift's stages is hit by an Ultimate-sized area (the engine's own
// RES.areaHit, the path areas and Ultimates take) and must break with a BREAK_FX burst; the hall's foundry dressing must
// also break to shots; then an area over the whole map must leave every objective piece (gates, door, sockets, pedestals,
// crystals, plaques, valves, pans, clappers, the lift) standing and the hall's state unchanged.
// usage: HTML=test-calPR.html node tests/_bel-pr-break.js
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 14 }); const { page, errors, start } = T; page.setDefaultTimeout(300000);
  await page.evaluate(() => { window.__BEL_GL = 0; });   // (the GPU light off: the logic is what is tested)
  const idx = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.belfry, f = re => R.stages.findIndex(s => s && re.test(s.name || '')); return { hall: f(/Hall of Three Tides/), clap: f(/Clapper/), tide: f(/Tide Walk/), church: f(/Lower Church/) }; });
  const step = n => page.evaluate(n => { for (let i = 0; i < n; i++) window.__pp.arc.game.update(1 / 30); }, n);
  // one of each breakable kind on a stage: an area on it, the burst counted
  const breakEach = async (name, si) => { if (si < 0) return; await start('belfry', si); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.boss) { m.dead = true; m.hp = 0; } });
    const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, out = {}, BF = self.BREAK_FX; const seen = new Set();
      for (const p of D.propList) { if (p.broken || !/^bel/.test(p.kind) || seen.has(p.kind)) continue; seen.add(p.kind); const s0 = BF.stats(); D.me.x = p.x; D.me.y = p.y + 2.5; D.RES.areaHit(p.x, p.y - 0.3, 0.5, 9999, { src: 'ult' }); if (!p.broken) D.RES.areaHit(p.x, p.y - 0.3, 0.5, 9999, { src: 'ult' });
        let s1 = BF.stats(); for (let i = 0; i < 24 && s1.shards === 0; i++) { window.__pp.arc.game.update(1 / 30); s1 = BF.stats(); } const K = BF.KIND[p.kind] || {}; out[p.kind] = { broken: !!p.broken, shards: s1.shards, mat: K.mat || BF.matOf(p.kind), newArt: !!(window.BELPROPS && window.BELPROPS.DEF[p.kind]) }; }
      return out; });
    const kinds = Object.keys(r); ok(kinds.length > 0 && kinds.every(k => r[k].broken && r[k].shards > 0), `${name}: every breakable kind breaks through BREAK_FX (${kinds.length} kinds)`, r); return r; };
  const all = {}; for (const [n, si] of [['church', idx.church], ['clappers', idx.clap], ['tide', idx.tide]]) Object.assign(all, await breakEach(n, si) || {});
  // the hall: the foundry's dressing (moulds, bell halves, hung bells) breaks to areas and to shots; nothing objective does
  await page.evaluate(() => { const RS = window.__pp.riftState(); if (RS.hall) delete RS.hall.belfry; }); await start('belfry', idx.hall);
  const hall = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, G = window.__pp.arc.game, BF = self.BREAK_FX, M = D.RIFT.self.mod, PS = () => Object.assign({}, M.PS());
    const dress = D.propList.filter(p => p.belDress); const kinds = [...new Set(dress.map(p => p.kind))];
    // a shot through the first mould
    const p0 = dress.find(p => p.kind === 'belfoundmould'); const s0 = BF.stats().shards; for (let k = 0; k < 4 && !p0.broken; k++) { D.shots.push({ x: p0.x, y: p0.y - 0.35, vx: 0, vy: 0, r: 0.14, dmg: 1, life: 0.2, t: 0, pierce: 0, hits: null, style: 'bolt', el: 'light', src: 'normal' }); for (let i = 0; i < 3; i++) G.update(1 / 30); }
    for (let i = 0; i < 24 && BF.stats().shards === 0; i++) G.update(1 / 30); const shot = { broken: !!p0.broken, shards: BF.stats().shards > 0 }; void s0;
    // the rest by an Ultimate-sized area each
    const res = {}; for (const p of dress) { if (p.broken) continue; D.RES.areaHit(p.x, p.y - 0.3, 0.5, 9999, { src: 'ult' }); if (!p.broken) D.RES.areaHit(p.x, p.y - 0.3, 0.5, 9999, { src: 'ult' }); for (let i = 0; i < 3; i++) G.update(1 / 30); res[p.kind + p.v] = !!p.broken; }
    // the objective pieces: an area over the whole map, three times, then their state
    const objs0 = D.RIFT.objs.map(o => o.kind + (o.B || '') + (o.i != null ? o.i : '')), ps0 = PS(), gates0 = (D.M.marks['1'] || []).concat(D.M.marks['2'] || [], D.M.marks['3'] || []).map(t => D.M.G[t.ty * D.M.MW + t.tx]);
    for (let k = 0; k < 3; k++) { D.RES.areaHit(52.5, 54.5, 80, 99999, { src: 'ult' }); for (let i = 0; i < 3; i++) G.update(1 / 30); }
    const objs1 = D.RIFT.objs.map(o => o.kind + (o.B || '') + (o.i != null ? o.i : '')), gates1 = (D.M.marks['1'] || []).concat(D.M.marks['2'] || [], D.M.marks['3'] || []).map(t => D.M.G[t.ty * D.M.MW + t.tx]);
    const objBroken = D.RIFT.objs.filter(o => o.broken || o.dead).map(o => o.kind);
    return { kinds, n: dress.length, shot, res, objsSame: JSON.stringify(objs0) === JSON.stringify(objs1), nObjs: objs1.length, objKinds: [...new Set(objs1)].join(','), objBroken, psSame: JSON.stringify(ps0) === JSON.stringify(PS()), gatesSame: JSON.stringify(gates0) === JSON.stringify(gates1), cage: M.trials.E && M.trials.E.cage }; });
  ok(hall.n === 8 && hall.kinds.length === 3, 'the hall: the foundry dressing stands as 8 breakable props (moulds, bell halves, hung bells)', hall.kinds);
  ok(hall.shot.broken && hall.shot.shards, 'the hall: a shot breaks a mould (BREAK_FX burst from its picture)', hall.shot);
  ok(Object.values(hall.res).every(Boolean), 'the hall: areas and Ultimates break every piece of the foundry dressing', hall.res);
  ok(hall.objsSame && hall.objBroken.length === 0 && hall.psSame && hall.gatesSame && hall.cage === 1, 'the hall: gates, door, sockets, pedestals, crystals, plaques survive an Ultimate over the whole map; the hall\'s state is unchanged', { n: hall.nObjs, kinds: hall.objKinds, broken: hall.objBroken, ps: hall.psSame, gates: hall.gatesSame, cage: hall.cage });
  // the puzzle stages' objective pieces (pans, clappers, the lift, valves) stand through it too
  for (const [n, si] of [['clappers', idx.clap], ['tide', idx.tide]]) { if (si < 0) continue; await start('belfry', si);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, G = window.__pp.arc.game, o0 = D.RIFT.objs.map(o => o.kind + (o.i != null ? o.i : '') + (o.n || '')); for (let k = 0; k < 3; k++) { D.RES.areaHit(D.M.MW / 2, D.M.MH / 2, 90, 99999, { src: 'ult' }); for (let i = 0; i < 3; i++) G.update(1 / 30); } const o1 = D.RIFT.objs.map(o => o.kind + (o.i != null ? o.i : '') + (o.n || '')); return { same: JSON.stringify(o0) === JSON.stringify(o1), kinds: [...new Set(D.RIFT.objs.map(o => o.kind))].join(','), broken: D.RIFT.objs.filter(o => o.broken).map(o => o.kind) }; });
    ok(r.same && !r.broken.length, `${n}: its objective pieces (${r.kinds}) are not breakable`, r); }
  console.log('kinds broken:', Object.keys(all).join(', '));
  ok(errors.length === 0, 'no page errors', errors.slice(0, 4)); console.log(`\n${fails ? 'FAILED ' + fails : 'all passed'} · page errors: ${errors.length}`); await T.browser.close(); process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
