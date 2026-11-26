// v463 SE: the trials and a fight of each land played a few seconds in each mode: the GPU painter forced (the painted pieces
// and their light), no GPU (the old 2D pieces over the painted land), the painter off (__SEPP 0: everything the old art),
// lowFx. 0 page errors in each; the pieces' hooks draw only where they should. env: HTML (test-se.html), MODES (comma list)
const { open } = require('./_se-lib.js');
(async () => { const res = [], t0 = Date.now(); const ok = (n, p, i) => { res.push(!!p); console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${p ? 'OK  ' : 'FAIL'} ${n}${i ? ' · ' + i : ''}`); };
  const modes = (process.env.MODES || 'gpu,nogpu,off,lowfx').split(','), stages = process.env.STAGES ? process.env.STAGES.split(',').map(Number) : [1, 2, 4, 5, 8, 9, 0, 7];
  for (const mode of modes) {
    const T = await open({ gpu: mode === 'gpu' || mode === 'lowfx', noGL: mode === 'nogpu', off: mode === 'off', lowFx: mode === 'lowfx' });
    try { for (const i of stages) {
        await T.stage(i); await T.run(mode === 'gpu' || mode === 'lowfx' ? 1.5 : 2.5, 12);
        if (i === 2) await T.M(() => { const D = window.__pp.arc.game._dbg; D.me.y = 9; D.me.x = 13; }); if (i === 8) await T.M(() => { const D = window.__pp.arc.game._dbg; const m = D.RIFT.self.mod; m.switchEra(); }); if (i === 4) await T.M(() => { const D = window.__pp.arc.game._dbg; const m = D.RIFT.self.mod; m.turn('past'); });
        await T.run(0.8, 12);
        const r = await T.M(() => { const D = window.SEP_PROPS, G = window.__pp.arc.game._dbg, B = window.__pp.BIOMES[G.F.biome]; return { name: G.F.rift.name, hooks: D.stats.hooks, land: !!B.floorFn, cached: D.stats.cached, textures: D.stats.textures }; });
        const fight = i === 0 || i === 7, want = mode === 'gpu' || mode === 'lowfx' ? (fight ? true : r.hooks > 0) : r.hooks === 0;
        ok(`${mode} stage ${i} (${r.name}): plays; pieces ${mode === 'gpu' || mode === 'lowfx' ? 'painted' : 'old 2D'}; land ${mode === 'off' ? 'old' : 'painted'}`, want && r.land === (mode !== 'off'), JSON.stringify(r));
        await T.M(() => window.__pp.closeArcade(true)); await T.page.waitForTimeout(300);
        const rel = await T.M(() => window.SEP_PROPS.stats); if (rel.cached || rel.textures) ok(`${mode} stage ${i}: released on close`, false, JSON.stringify(rel)); } } catch (e) { ok(mode + ' no exception', false, e.message); }
    ok(`${mode}: 0 page errors`, T.errors.length === 0, JSON.stringify(T.errors.slice(0, 3))); await T.browser.close(); }
  const bad = res.filter(r => !r).length; console.log(bad ? `FAILED ${bad}/${res.length}` : `ALL OK (${res.length})`); process.exit(bad ? 1 : 0); })();
