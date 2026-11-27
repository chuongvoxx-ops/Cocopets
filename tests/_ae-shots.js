// v470 AE: shots of the Pale Aurora's lands, props, puzzle pieces, doors and arenas -> shots/v470-AE/<TAG>-<scene>.png
// env: HTML, TAG (after), DPR (3), ONLY (comma list), LOWFX, NOGL, OFF=1 (__AURP = 0), FR (frames before a shot)
const { open } = require('./_ae-lib');
const near = kinds => ['prop', kinds];
const SCENES = [
  ['glacier-wide', 0, null], ['glacier-sky', 0, 'skytop'], ['obs-sky', 3, 'skytop'], ['white-sky', 7, 'skytop'], ['glacier-trees', 0, near(['icetree', 'frozenvane'])], ['glacier-crystal', 0, 'crystal'], ['glacier-tomato', 0, 'tomato'],
  ['wind', 1, 'wind'], ['wind-bridge', 1, 'windbridge'], ['door-wind', 1, 'door'],
  ['thul', 2, 'boss'],
  ['obs-wide', 3, null], ['obs-arch', 3, near(['obsarch', 'telescope'])], ['door-obs', 3, 'door'],
  ['aval', 4, 'aval'], ['aval-block', 4, 'avalblock'],
  ['nivora', 5, 'boss'],
  ['ember', 6, 'ember'], ['ember-carry', 6, 'embercarry'],
  ['white-wide', 7, null], ['white-props', 7, near(['stonearch', 'icetree', 'snowrock'])], ['door-white', 7, 'door'],
  ['ahuul', 8, 'boss'],
  ['broken', 0, 'broken'], ['thul-pillar', 2, 'aprop0'], ['nivora-scope', 5, 'aprop0'], ['nivora-vane', 5, 'aprop1'], ['ahuul-shelter', 8, 'aprop1'], ['ahuul-scope', 8, 'aprop6'],
];
(async () => {
  const tag = process.env.TAG || 'after', only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const T = await open({ dpr: +(process.env.DPR || 3), lowFx: !!process.env.LOWFX, noGL: !!process.env.NOGL, off: process.env.OFF === '1', fast: process.env.FULL !== '1' });
  let last = -1;
  for (const [name, si, what] of SCENES) { if (only && !only.includes(name)) continue;
    const t0 = Date.now();
    try {
      if (si !== last || what === 'broken') { await T.stage(si); last = si; }
      await T.freeze();
      if (Array.isArray(what)) { const r = await T.toProp(what[1]); console.log(name, JSON.stringify(r)); await T.run(0.5, 8); }
      else if (what === null) { await T.move(4, -3); await T.run(0.5, 8); }
      else if (what === 'crystal') { await T.M(() => { const D = window.__pp.arc.game._dbg, m = D.mons.find(q => q.type === 'aurcrystal'); if (m) { D.me.x = m.x + 1.5; D.me.y = m.y + 2; } }); await T.run(0.5, 8); }
      else if (what === 'tomato') { await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'tomato'); if (o) { D.me.x = o.x + 2.6; D.me.y = o.y + 1.2; } }); await T.run(0.4, 8);
        await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'tomato'); if (o) { D.me.x = o.x + 1.2; D.me.y = o.y + 1.0; } }); await T.run(1.0, 8); }
      else if (what === 'wind') { await T.run(1.6, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'vane'); if (o) { o.use(); D.me.x = o.x + 1.4; D.me.y = o.y + 1.0; } }); await T.run(1.0, 10); }
      else if (what === 'windbridge') { await T.M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod || {}; const B = (m.bridges || [])[0]; if (B) { B.wall = -B.wind; B.wallK = 1; D.me.x = (B.b.x0 + B.b.x1) / 2; D.me.y = B.b.y1 + 0.6; } }); await T.run(1.0, 10); }
      else if (what === 'aval') { await T.run(1.6, 10); await T.M(() => { const D = window.__pp.arc.game._dbg; D.me.x = 10; D.me.y = 9; }); await T.run(0.6, 10); }
      else if (what === 'avalblock') { await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.filter(o => o.kind === 'lever')[1]; if (o) { o.use(); D.me.x = 10; D.me.y = 11; } }); await T.run(1.2, 10); }
      else if (what === 'ember') { await T.run(1.6, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'bowl'); if (o) { D.me.x = o.x + 2.2; D.me.y = o.y + 2.4; } }); await T.run(0.6, 10); }
      else if (what === 'embercarry') { await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'bowl'); if (o) { o.use(); D.me.x = o.x + 0.5; D.me.y = o.y - 3; } }); await T.run(1.0, 10); }
      else if (what === 'door') { await T.M(() => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit, m = D.RIFT.self.mod; if (m && m.S) m.S.intro = true; if (e) { let best = null; const TF = D.X.T_FLOOR || 1; for (const [dx, dy] of [[0, 2], [1.5, 1.5], [-1.5, 1.5], [0, 3], [2.2, 0.5], [-2.2, 0.5], [0, 4]]) if (D.walkAt(Math.floor(e.x + dx), Math.floor(e.y + dy)) && D.M.G[Math.floor(e.y + dy) * D.M.MW + Math.floor(e.x + dx)] !== 5) { best = [e.x + dx, e.y + dy]; break; } if (best) { D.me.x = best[0]; D.me.y = best[1]; } if (D.cam) { D.cam.x = e.x; D.cam.y = e.y + 1.5; } } }); await T.run(1.2, 10); }
      else if (what === 'skytop') { await T.M(() => { const D = window.__pp.arc.game._dbg, M = D.M; for (let y = 0; y < M.MH; y++) { let hit = null; for (let x = 0; x < M.MW; x++) if (D.walkAt(x, y)) { hit = x; break; } if (hit != null) { D.me.x = hit + 0.5; D.me.y = y + 1.5; break; } } if (D.cam) { D.cam.x = D.me.x; D.cam.y = D.me.y - 5; } }); await T.run(0.8, 10); }
      else if (what === 'boss') { await T.run(2.5, 12); }
      else if (what.startsWith('aprop')) { const k = +what.slice(5); await T.run(1.5, 12); const r = await T.M(k => { const D = window.__pp.arc.game._dbg, FD = D.FD, S = FD && FD.S; if (!S) return null; const L = S.props.filter(p => p.kind !== 'husk'), objs = (S.objs || []).filter(o => o.kind === 'anchor'), p = L[k % Math.max(1, L.length)]; if (!p) return null; D.me.x = p.x + 0.5; D.me.y = p.y + 2.6; for (const m of D.mons) m.frozen = 99; return { kind: p.kind, n: L.length, anchors: objs.length, st: window.AUR_PROPS.arena.stats }; }, k); console.log(name, JSON.stringify(r)); await T.run(1.0, 12); await T.M(() => { const D = window.__pp.arc.game._dbg; console.log(''); return window.AUR_PROPS.arena.stats; }).then(x => console.log(name, 'arena', JSON.stringify(x))); }
      else if (what === 'broken') { const r = await T.toProp(['icetree', 'frozenvane', 'snowrock', 'icewedge', 'snowhill']); console.log(name, JSON.stringify(r));
        await T.M(() => { const D = window.__pp.arc.game._dbg, me = D.me, L = D.propList || []; let best = null, bd = 1e9; for (const p of L) { if (p.broken) continue; const d = Math.hypot(p.x - me.x, p.y - me.y); if (d < bd) { bd = d; best = p; } } if (best) { let n = 0; while (!best.broken && n++ < 30) D.RES.hitProp(best, 'gold', 1); } window.__aeBroke = best ? { x: best.x, y: best.y, kind: best.kind } : null; });
        await T.run(0.3, 8); }
      await T.frames(+(process.env.FR || 14));
      await T.M(() => { const D = window.__pp.arc.game._dbg; if (D.banners) D.banners.length = 0; }); await T.frames(2);
      await T.shot('v470-AE', `${tag}-${name}`);
    } catch (e) { console.log(name, 'ERR', String(e).slice(0, 300)); }
    console.log(name, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  console.log('errors', JSON.stringify(T.errors.slice(0, 6)));
  await T.browser.close();
})();
