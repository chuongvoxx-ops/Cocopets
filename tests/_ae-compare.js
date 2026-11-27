// v470 AE: side-by-side comparison shots at DPR 3: the Garden (Rift 02) and the Dunes (Rift 03) beside the Aurora's three lands
// -> shots/v470-AE/cmp-<TAG>-<scene>.png. env: HTML, TAG, ONLY
const { open } = require('./_ae-lib');
const SC = [['garden', 'garden', 0], ['dunes', 'dunes', 0], ['glacier', 'aurora', 0], ['obs', 'aurora', 3], ['white', 'aurora', 7]];
(async () => { const T = await open({ dpr: 3, fast: true }), only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const [name, id, i] of SC) { if (only && !only.includes(name)) continue; const t0 = Date.now();
    try { await T.M(() => { const P = window.__pp; for (const k of ['garden', 'dunes', 'sepulchre', 'belfry']) P.riftState().seals[k] = 1; });
      await T.stageRift(id, i); await T.freeze(); await T.move(3, -2); await T.run(0.6, 8); await T.frames(14); await T.M(() => { const D = window.__pp.arc.game._dbg; if (D.banners) D.banners.length = 0; }); await T.frames(2);
      await T.shot('v470-AE', `cmp-${process.env.TAG || 'a'}-${name}`); } catch (e) { console.log(name, 'ERR', String(e).slice(0, 200)); } console.log(name, ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
  console.log('errors', JSON.stringify(T.errors.slice(0, 4))); await T.browser.close(); })();
