// v463 SS: the far views' frame cost in the Sepulchre (Rift 04): each stage asked, the pet at the map's top edge (the view past
// it on the screen) or, in an arena, north of the court; F frames stepped by hand at DPR 3 with the GPU paths forced (tests/_pf-lib.js).
// Per stage: total / draw ms, FGFX flushes and GL layers laid (each one copy of the GL canvas), 2D drawImage count and area, gradients,
// canvases made, the view's own counters. OFF=1 runs with window.__SSKY = 0 (the old look) for the same build.
// usage: HTML=... node tests/_ss-frame.js   env: STAGES=1,4,7,3,6,10  F=6  DPR=3  OFF=1  OUT=file.json
process.env.RIFT = 'sepulchre';
const { open, summ } = require('./_pf-lib');
const fs = require('fs');
(async () => {
  const flags = process.env.OFF === '1' ? { __SSKY: 0 } : {};
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 3), rift: 'sepulchre', flags });
  const { page, errors, start, frames } = T; const out = {};
  await page.evaluate(() => { window.__pp.RIFT_BY_ID.sepulchre.stages.forEach(s => { if (s.mod === 'random') s.mod = null; }); window.__pp.st.gq = 'balanced'; });
  try {
    for (const i of (process.env.STAGES || '1,4,7,3,6,10').split(',').map(Number)) { await start(i);
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.M; if (D.FD) { const C = M.FC; D.me.x = C.x; D.me.y = C.y - C.R + 3; return; } let y0 = 1e9, x0 = 0; for (let y = 0; y < M.MH && y0 === 1e9; y++) for (let x = 0; x < M.MW; x++) if (D.walkAt(x, y)) { y0 = y; x0 = x; break; } D.me.x = x0 + 0.5; D.me.y = y0 + 0.5; if (D.cam) { D.cam.x = D.me.x; D.cam.y = D.me.y; } });
      await frames(12, { prof: false }); const r = await frames(+(process.env.F || 6), { prof: true }); const s = summ(r.rows);
      const pick = ['tot', 'draw', 'fgFlush', 'fgLayers', 'diGL', 'di', 'diA', 'grad', 'pat', 'cvNew', 'clip', 'fgQuads', 'heapPos'];
      out[i] = Object.fromEntries(pick.map(k => [k, +(+s[k] || 0).toFixed(k === 'diA' ? 0 : 2)])); out[i].cv = r.cv;
      out[i].sky = await page.evaluate(() => { const S = window.SEP_SKY, D = window.__pp.arc.game._dbg; if (!S) return null; const st = S.stats; return { px: st.px, MB: +(st.px * 4 / 1048576).toFixed(1), cached: st.cached, strips: st.strips, painted: st.painted, paintMs: Math.round(st.paintMs), arenaRects: st.arenaRects, seenN: st.seenN, seenA: st.seenA, skyFull: D.FD && D.FD.S && D.FD.S.skyFull ? D.FD.S.skyFull.width : null }; });
      console.log('stage', i, JSON.stringify(out[i])); }
    await page.evaluate(() => { const P = window.__pp; P.closeArcade(true); }); await page.waitForTimeout(500);
    console.log('after close', JSON.stringify(await page.evaluate(() => { const S = window.SEP_SKY; if (!S) return null; const s = S.stats; return { px: s.px, cached: s.cached, strips: s.strips, live: !!S.LIVE, released: s.released }; })));
    console.log('errors', JSON.stringify(errors.slice(0, 5)));
    if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  } finally { await T.browser.close(); }
})();
