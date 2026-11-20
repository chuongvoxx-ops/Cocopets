// v433 DS: the dunes' far views — each land at its map's edges (top, left, right, bottom) and the arenas (HTML=..., TAG=before|after, STAGES=0,5,8, DPR=1|3, LOWFX=1, NOGL=1)
const L = require('./_ds-lib');
(async () => {
  const dpr = +(process.env.DPR || 1), T = await L.open({ dpr, lowFx: process.env.LOWFX === '1', noGL: process.env.NOGL === '1', off: process.env.OFF === '1' }); const tag = process.env.TAG || 'after', sfx = (process.env.LOWFX === '1' ? '-lowfx' : '') + (process.env.NOGL === '1' ? '-nogl' : '') + '-dpr' + dpr;
  // (the GPU forced on only for the shot itself: a couple of frames, then off again, so the loading and the play stay quick)
  const glShot = async name => { if (process.env.NOGL !== '1') await T.M(() => { window.__NG_GL = 1; }); await T.frames(2); await T.shot('v433-DS', name); await T.M(() => { window.__NG_GL = undefined; }); };
  try {
    const list = (process.env.STAGES || '0').split(',').map(Number), views = (process.env.VIEWS || 'top,left,right,bottom').split(',');
    for (const i of list) { const boss = [3, 7, 11].includes(i); await T.stage(i, { boss }); await T.run(0.6);
      if (boss) { for (const [n, dx, dy] of [['n', 0, -10], ['s', 3, 9]].filter(q => views.includes('bottom') || q[0] === 'n')) { await T.M(([dx, dy]) => { const D = window.__pp.arc.game._dbg, C = D.M.FC; D.me.x = C.x + dx; D.me.y = C.y + dy; }, [dx, dy]); await T.run(0.6); await glShot(`${tag}-s${i}-${n}${sfx}`); } continue; }
      const bb = await T.M(() => { const D = window.__pp.arc.game._dbg, M = D.M; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < M.MH; y++) for (let x = 0; x < M.MW; x++) if (D.walkAt(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x0, y0, x1, y1, D.me.x, D.me.y]; });
      const at = { top: [(bb[0] + bb[2]) / 2, bb[1] + 2], left: [bb[0] + 2, (bb[1] + bb[3]) / 2], right: [bb[2] - 2, (bb[1] + bb[3]) / 2], bottom: [(bb[0] + bb[2]) / 2, bb[3] - 2] };
      for (const n of views) { const [x, y] = at[n]; await T.M(([x, y]) => { const D = window.__pp.arc.game._dbg; let best = null; for (let r = 0; r < 14 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (D.walkAt(Math.floor(x + dx), Math.floor(y + dy))) { best = [Math.floor(x + dx) + 0.5, Math.floor(y + dy) + 0.5]; break; } } if (best) { D.me.x = best[0]; D.me.y = best[1]; for (const k of Object.keys(D.explored || {})) void k; } }, [x, y]);
        await T.run(0.5); await glShot(`${tag}-s${i}-${n}${sfx}`); } }
    console.log('gl', JSON.stringify(await T.M(() => { const F = window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX; return F ? F.info() : null; })));
    console.log('stats', JSON.stringify(await T.M(() => window.DUNE_SKY ? window.DUNE_SKY.stats : null)));
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } finally { await T.browser.close(); }
})();
