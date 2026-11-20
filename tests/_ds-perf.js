// v433 DS: the far view's cost and memory: its CPU time a frame (no GPU, after warming), the painted pictures' pixels at the
// stage's DPR, the loading jobs' time, and that everything is given back when the stage closes (STAGES=0,5,8 DPR=1|3)
const L = require('./_ds-lib');
(async () => {
  const dpr = +(process.env.DPR || 1), T = await L.open({ dpr });
  try { for (const i of (process.env.STAGES || '0').split(',').map(Number)) { await T.stage(i, { boss: [3, 7, 11].includes(i) }); await T.run(0.4);
      const r = await T.M(dpr => { const S = window.DUNE_SKY, Lv = S.LIVE, cv = document.createElement('canvas'); cv.width = 390 * dpr; cv.height = 844 * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        const V = S.view(Lv.X); V.W = 390; V.H = 844; V.k = dpr; const hy = V.hy, out = {}; for (const [n, dy] of [['sky', -0.8], ['horizon', 0], ['deep', 0.6]]) { const V2 = Object.assign({}, V, { sy: y => (y - (hy + dy * V.span)) * V.T + 422, sx: x => (x - 30) * V.T + 195 }); S.vista(c, V2, { gpu: false }); const t0 = performance.now(); for (let k = 0; k < 20; k++) S.vista(c, V2, { gpu: false }); out[n] = +((performance.now() - t0) / 20).toFixed(2); }
        const st = S.stats; return { land: Lv.land, fiend: Lv.fiend, msPerFrame: out, px: st.px, MB: +(st.px * 4 / 1048576).toFixed(1), cached: st.cached, strips: st.strips, sands: st.sands, paintMs: Math.round(st.paintMs), painted: st.painted }; }, dpr);
      console.log('stage', i, JSON.stringify(r)); }
    await T.M(() => { const P = window.__pp; P.closeArcade(true); }); await T.page.waitForTimeout(500);
    console.log('after close', JSON.stringify(await T.M(() => { const s = window.DUNE_SKY.stats; return { px: s.px, cached: s.cached, strips: s.strips, live: !!window.DUNE_SKY.LIVE, released: s.released }; })));
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } finally { await T.browser.close(); }
})();
