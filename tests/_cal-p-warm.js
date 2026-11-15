// Rift 0 (worker P): the loading screen's warm-up. Every stage loads with Rf.preload's jobs run (CAL.warmStats), no page
// errors, the brood's pose pictures made before Start, the ring of ground chunks painted, and a boss stage's model drawn
// once; then the same with WebGL taken away (GLM.ok false: every boss must fall back to 2D, the warm-up must not break),
// and with the warm-up off (__CAL_WARM = 0, __PRELOAD_MORE = 0) as before.
// HTML=test-calP.html node tests/_cal-p-warm.js [stage...]
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 1 }); const { page, errors, start, run } = T; let bad = 0;
  await page.evaluate(() => { window.__noPetGL = 1; });
  const ok = (c, msg) => { if (!c) bad++; console.log(c ? 'ok  ' : 'FAIL', msg); };
  const only = process.argv.slice(2).map(Number), n = await page.evaluate(() => window.__pp.RIFT_BY_ID.caldera.stages.length);
  const info = () => page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, A = D.RIFT.self.amb, W = A.CAL.warmStats, MC = P.DunArt.monCache, MODES = A.CAL.MODES;
    const posed = [...MC.keys()].filter(k => { const p = k.split('|'); return MODES[p[0]] && p[4] && p[4] !== ''; }).length;
    return { W: Object.assign({}, W, { ms: Math.round(W.ms) }), posed, kind: D.F.rift.kind, boss: D.F.fiend ? D.F.fiend.id : null, err: null }; });
  for (const mode of ['warm', 'nogl', 'off']) {
    await page.evaluate(m => { window.__CAL_WARM = m === 'off' ? 0 : undefined; window.__PRELOAD_MORE = m === 'off' ? 0 : undefined;
      const G = window.__pp.FIEND_DEFS.calflan.__dbg.GLM; if (G) { if (!G.__ok0) G.__ok0 = G.ok; G.ok = m === 'nogl' ? () => false : G.__ok0; } }, mode);
    for (let s = 0; s < n; s++) { if (only.length ? !only.includes(s) : mode !== 'warm' && s % 3 !== 2 && s !== 0) continue;
      await page.evaluate(() => { try { window.__pp.arc.game._dbg.RIFT.self.amb.CAL.warmStats = { jobs: 0, mons: 0, ms: 0 }; } catch (e) {} });   // (cleared: an 'off' load must leave it so)
      const e0 = errors.length; await start('caldera', s); const r = await info(); await run(1.2);
      const e = errors.length - e0;
      if (mode === 'off') ok(r.W.jobs === 0 && !e, `${mode} stage ${s} (${r.kind}): no warm-up jobs, plays (${e} errors)`);
      else { ok(r.W.jobs > 0 && !e, `${mode} stage ${s} (${r.kind}${r.boss ? ' ' + r.boss : ''}): ${r.W.jobs} jobs, ${r.W.ms} ms, ${r.W.mons} brood pictures, ${r.posed} posed in the cache, gl ${r.W.gl} glm ${r.W.glm}; ${e} errors`);
        if (!r.boss) ok(r.posed > 20, `  the brood's poses made before Start (${r.posed})`);
        if (r.boss) ok(r.W.boss === r.boss && (mode !== 'nogl' || !r.W.gl), `  boss ${r.boss} warmed${mode === 'nogl' ? ' on the 2D fallback' : ''}`); }
      if (e) console.log('   ', errors.slice(e0, e0 + 3)); }
  }
  console.log(bad ? `FAILED ${bad}` : 'all ok', 'errors', errors.length); await T.browser.close(); process.exit(bad || errors.length ? 1 : 0);
})();
