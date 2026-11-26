// v433 DE: the puzzles and a fight of each land played a few seconds in each mode: the GPU painter forced (the painted pieces
// and their light), no GPU (the old 2D pieces over the painted land), the painter off (__DPP 0: everything the old art), lowFx.
// 0 page errors in each; the pieces' hooks draw only where they should. env: HTML (test-de.html)
const { open } = require('./_de-lib.js');
(async () => { const res = [], t0 = Date.now(); const ok = (n, p, i) => { res.push(!!p); console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${p ? 'OK  ' : 'FAIL'} ${n}${i ? ' · ' + i : ''}`); };
  for (const mode of ['gpu', 'nogpu', 'off', 'lowfx']) {
    const T = await open({ gpu: mode === 'gpu' || mode === 'lowfx', off: mode === 'off', lowFx: mode === 'lowfx' });
    try { for (const i of [1, 4, 7, 3]) {   // v462 R3b: the Grub Mounds back
          // v460 R3: the two puzzles and the Rust Flats (the eight-stage route)
        await T.stage(i); await T.run(mode === 'gpu' || mode === 'lowfx' ? 1.5 : 3, 12);
        const r = await T.M(() => { const D = window.DUNE_PROPS, B = window.__pp.BIOMES[window.__pp.arc.game._dbg.F.biome]; return { hooks: D.stats.hooks, land: !!B.floorFn, cached: D.stats.cached }; });
        const want = mode === 'gpu' || mode === 'lowfx' ? (i === 3 ? true : r.hooks > 0) : r.hooks === 0;
        ok(`${mode} stage ${i}: plays; pieces ${mode === 'gpu' || mode === 'lowfx' ? 'painted' : 'old 2D'}; land ${mode === 'off' ? 'old' : 'painted'}`, want && r.land === (mode !== 'off'), JSON.stringify(r));
        await T.M(() => window.__pp.closeArcade(true)); await T.page.waitForTimeout(300); } } catch (e) { ok(mode + ' no exception', false, e.message); }
    ok(`${mode}: 0 page errors`, T.errors.length === 0, JSON.stringify(T.errors.slice(0, 3))); await T.browser.close(); }
  const bad = res.filter(r => !r).length; console.log(bad ? `FAILED ${bad}/${res.length}` : `ALL OK (${res.length})`); process.exit(bad ? 1 : 0); })();
