// v428 GA: the Garden's sky anchored to the stage — the same stage shot at three camera positions (HTML=..., GL=1 forces the GPU)
const L = require('./_ge-lib');
(async () => {
  const T = await L.open({ gl: process.env.GL === '1', dpr: 1 }); const tag = process.env.TAG || 'after';
  try { await T.stage(0);
    for (const [i, dx] of [[0, 0], [1, 5], [2, 10]]) {
      await T.M(dx => { const D = window.__pp.arc.game._dbg, me = D.me; if (!me.__x0) { me.__x0 = me.x; me.__y0 = me.y; } let best = null; for (let d = 0; d < 6 && !best; d += 0.5) for (const s of [1, -1]) { const x = me.__x0 + dx + d * s; if (D.walkAt(Math.floor(x), Math.floor(me.__y0))) { best = x; break; } } if (best != null) { me.x = best; me.y = me.__y0; } D.g.cam && (D.g.cam.x = me.x, D.g.cam.y = me.y); }, dx);
      await T.run(1.2); await T.shot('v428-GA', tag + '-' + i); }
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } finally { await T.browser.close(); }
})();
