// v463 SE: shots of the Sepulchre's lands, props and puzzle pieces -> shots/v463-SE/<TAG>-<scene>.png
// env: HTML (test-se.html), TAG (after), DPR (1), ONLY (comma list of scene names), LOWFX, NOGL, OFF=1 (__SEPP = 0)
const { open } = require('./_se-lib');
const near = (kinds) => ['prop', kinds];
const SCENES = [
  ['halls-wide', 0, null], ['halls-tomb', 0, near(['boxtomb', 'sepurn'])], ['halls-hour', 0, near(['hourglass', 'fallstone', 'stopclock'])], ['halls-more', 0, near(['mourner', 'dialslab', 'stopclock'])],
  ['court', 1, 'court'], ['beast', 2, 'beast'], ['beast-court', 2, 'beastcourt'],
  ['ages', 4, 'ages'], ['ages-past', 4, 'agespast'], ['siege', 5, 'siege'], ['siege-awake', 5, 'siegeawake'],
  ['stairs-wide', 7, null], ['stairs-obelisk', 7, near(['voidobelisk', 'cornerglow', 'glassshard'])], ['stairs-more', 7, near(['hourlamp', 'floatstair', 'stairstub'])], ['stairs-bridge', 7, 'bridge'],
  ['door-beast', 2, 'door'], ['door-ages', 4, 'door'], ['door-siege', 5, 'door'], ['door-roll', 9, 'door'],
  ['remember', 8, 'remember'], ['remember-anchor', 8, 'remanchor'], ['remember-past', 8, 'rempast'], ['remember-statue', 8, 'remstatue'], ['roll', 9, 'roll'],
];
(async () => {
  const tag = process.env.TAG || 'after', only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const T = await open({ dpr: +(process.env.DPR || 1), lowFx: !!process.env.LOWFX, noGL: !!process.env.NOGL, gpu: process.env.GPU !== '0', off: process.env.OFF === '1', fast: process.env.FULL !== '1' });
  let last = -1;
  for (const [name, si, what] of SCENES) { if (only && !only.includes(name)) continue;
    const t0 = Date.now();
    try {
      if (si !== last) { await T.stage(si); last = si; }
      if (Array.isArray(what)) { const r = await T.toProp(what[1]); console.log(name, JSON.stringify(r)); await T.run(0.6, 8); }
      else if (what === null) { await T.move(5, -3); await T.run(0.6, 8); }
      else if (what === 'court') { await T.run(4, 10); }
      else if (what === 'beast') { await T.run(2.5, 10); }
      else if (what === 'beastcourt') { await T.M(() => { const D = window.__pp.arc.game._dbg; D.me.y = 9; D.me.x = 13; if (D.cam) { D.cam.x = D.me.x; D.cam.y = D.me.y; } }); await T.run(0.8, 10); }
      else if (what === 'ages') { await T.run(2, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, L = D.RIFT.objs.find(o => o.kind === 'agelever'); D.me.x = L.x + 1.5; D.me.y = L.y + 0.4; }); await T.run(0.8, 10); }
      else if (what === 'agespast') { await T.M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; if (m && m.turn) m.turn('past'); D.me.x = 13; D.me.y = 12; }); await T.run(1.0, 10); }
      else if (what === 'siege') { await T.run(2, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'wake'); if (o) { D.me.x = o.x + 2; D.me.y = o.y + 0.5; } }); await T.run(0.8, 10); }
      else if (what === 'siegeawake') { await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'wake'); if (o) o.use(); }); await T.run(0.5, 10);
        await T.M(() => { const D = window.__pp.arc.game._dbg, m = D.mons.find(q => q.type === 'sepstatue' && q.awake); if (m) { m.hp = m.maxhp * 0.45; D.me.x = m.x + 2.2; D.me.y = m.y + 1.2; } for (const q of D.mons) if (q.type !== 'sepstatue') q.frozen = 99; }); await T.run(0.6, 10); }
      else if (what === 'bridge') { await T.M(() => { const D = window.__pp.arc.game._dbg, M = D.M || D.F && D.F.M; const G = (D.M || {}).G; if (!G) return; const MW = D.M.MW; for (let i = 0; i < G.length; i++) if (G[i] === 3) { D.me.x = i % MW + 0.5; D.me.y = Math.floor(i / MW) + 0.5; break; } if (D.cam) { D.cam.x = D.me.x; D.cam.y = D.me.y; } }); await T.run(0.6, 8); }
      else if (what === 'remember') { await T.run(2, 10); }
      else if (what === 'rempast') { await T.M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; if (m && m.switchEra) m.switchEra(); }); await T.run(1.2, 10); }
      else if (what === 'remanchor') { await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'anchor'); D.me.x = o.x + 1.6; D.me.y = o.y - 1.2; }); await T.run(0.6, 10); }
      else if (what === 'remstatue') { await T.M(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'statue'); D.me.x = o.x + 1.8; D.me.y = o.y + 1.4; }); await T.run(0.6, 10); }
      else if (what === 'door') { await T.M(() => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; if (e) { D.me.x = e.x + 0.4; D.me.y = e.y + 3.2; } for (const m of D.mons) if (!m.boss) m.frozen = 99; }); await T.run(1.2, 10); }
      else if (what === 'roll') { await T.run(8, 12); }
      await T.frames(+(process.env.FR || 14));   /* (the ground's chunks are painted one a frame without the loading pass) */
      await T.M(() => { const D = window.__pp.arc.game._dbg; if (D.banners) D.banners.length = 0; }); await T.frames(2);
      await T.shot('v463-SE', `${tag}-${name}`);
    } catch (e) { console.log(name, 'ERR', String(e).slice(0, 200)); }
    console.log(name, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  console.log('errors', JSON.stringify(T.errors.slice(0, 6)));
  await T.browser.close();
})();
