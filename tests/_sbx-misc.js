// v443 SB: the pictures painted on the loading screen (none mid-play), drawn without the GPU painter (no live light, no
// errors), lowFx (fewer sparks), and every picture given back when the stage closes. Dev only.
// usage: HTML=<test html> node tests/_sbx-misc.js   env: SPEC (tower:5)
const { open } = require('./_sbx-lib');
(async () => {
  const T = await open({ dpr: 2 }); const { page, errors } = T, spec = process.env.SPEC || 'tower:5';
  await T.go(spec); const r = {};
  /* (the loading screen stops its jobs after 10 s, which a software rasteriser passes before reaching them: they are run here in full, as a phone runs them) */
  r.loadJobs = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, c = document.getElementById('arcCanvas').getContext('2d'), p0 = TRAP_ART.stats.painted, t0 = performance.now(); const jobs = G.preloadJobs ? G.preloadJobs(c) : []; for (const j of jobs) try { j(); } catch (e) {} return { jobs: jobs.length, ms: +(performance.now() - t0).toFixed(0), trapArtPainted: TRAP_ART.stats.painted - p0 }; });
  r.afterLoad = await page.evaluate(() => { const s = TRAP_ART.stats; return { cached: s.cached, px: s.px, painted: s.painted, paintMs: +s.paintMs.toFixed(0), base: TRAP_ART.base }; });
  await page.evaluate(() => { window.__p0 = TRAP_ART.stats.painted; }); await T.focus('saw', 0); await T.copies(30);
  r.play = await page.evaluate(() => { const s = TRAP_ART.stats; return { paintedInPlay: s.painted - window.__p0, misses: s.misses, draws: s.draws, laidGPU: s.laidGPU, laid2D: s.laid2D }; });
  const sparks = lf => page.evaluate(lf => { const P = window.__pp, G = P.arc.game, D = G._dbg, c = document.getElementById('arcCanvas').getContext('2d'); P.st.lowFx = lf; const n0 = TRAP_ART.stats.d2Ops + TRAP_ART.stats.gpuOps;
    for (let i = 0; i < 40; i++) { G.update(1 / 60); c.save(); G.draw(c); c.restore(); } P.st.lowFx = false; return +((TRAP_ART.stats.d2Ops + TRAP_ART.stats.gpuOps - n0) / 40).toFixed(1); }, lf);
  r.lightOpsPerFrame = { full: await sparks(false), lowFx: await sparks(true) };
  r.noGL = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, c = document.getElementById('arcCanvas').getContext('2d'); window.__DUN_GL = 0; const s0 = TRAP_ART.stats, a = s0.laidGPU + s0.laid2D, d0 = s0.draws;
    for (let i = 0; i < 40; i++) { G.update(1 / 60); c.save(); G.draw(c); c.restore(); } const s = TRAP_ART.stats; window.__DUN_GL = undefined; return { picturesDrawn: s.draws - d0, lightLaid: s.laidGPU + s.laid2D - a }; });
  r.closed = await page.evaluate(() => { const P = window.__pp; P.closeArcade(true); const s = TRAP_ART.stats; return { cached: s.cached, px: s.px, released: s.released }; });
  console.log(spec, JSON.stringify(r, null, 1)); console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
