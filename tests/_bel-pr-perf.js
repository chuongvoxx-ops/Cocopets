// v392 PR: the per-frame cost of drawing the Belfry's props, the old 2D art against the repainted pictures, in the same page
// and the same view (window.__BELP 0 / 1 alternated, five rounds, medians). The engine's g.prof pieces 'ground' (the stage's
// floor dressing: the dais, the foundry, the chapel) and 'ents' (props, objects, monsters, the pet) are timed per frame at
// phone size; the GPU light pass is off (window.__BEL_GL = 0) so only the 2D drawing is measured. Also the one-time painting.
// usage: HTML=test-calPR.html node tests/_bel-pr-perf.js
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 14 }); const { page, errors, start } = T; page.setDefaultTimeout(300000);
  await page.evaluate(() => { window.__BEL_GL = 0; window.__BELP = 1; });
  const idx = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.belfry, f = re => R.stages.findIndex(s => s && re.test(s.name || '')); return { hall: f(/Hall of Three Tides/), tide: f(/Tide Walk/) }; });
  const at = (x, y) => page.evaluate(([x, y]) => { const G = window.__pp.arc.game._dbg; G.me.x = x; G.me.y = y; G.me.vx = G.me.vy = 0; for (const m of G.mons) if (!m.boss) { m.aggro = false; m.x = -50; m.y = -50; } if (G.banners) G.banners.length = 0; }, [x, y]);
  const useGate = async B => { await page.evaluate(B => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'belgate' && o.B === B); D.me.x = o.x + 0.3; D.me.y = o.y + 0.25; o.used = false; o.ch = 0; }, B); await page.evaluate(() => { for (let i = 0; i < 30; i++) window.__pp.arc.game.update(1 / 30); }); };
  const meas = name => page.evaluate(async name => { const D = window.__pp.arc.game._dbg, raf = () => new Promise(r => requestAnimationFrame(r)); window.__BELP = 1; for (let i = 0; i < 12; i++) await raf();   // (painted first: the warm-up's work, not the frame's)
    const S0 = window.BELPROPS.stats, runs = { old: [], new: [] };
    for (let k = 0; k < 5; k++) for (const mode of ['old', 'new']) { window.__BELP = mode === 'old' ? 0 : 1; await raf(); await raf(); D.g.prof = {}; const n = 8; for (let i = 0; i < n; i++) await raf(); const P = D.g.prof; D.g.prof = null; runs[mode].push(((P.ground || 0) + (P.ents || 0)) / n); }
    window.__BELP = 1; const med = a => { const b = a.slice().sort((x, y) => x - y); return +b[b.length >> 1].toFixed(2); };
    return { at: name, oldMs: med(runs.old), newMs: med(runs.new), sprites: S0.sprites, painted: S0.painted, paintMs: +S0.paintMs.toFixed(0), draws: S0.draws }; }, name);
  const out = [];
  await page.evaluate(() => { const RS = window.__pp.riftState(); if (RS.hall) delete RS.hall.belfry; }); await start('belfry', idx.hall); await at(52.5, 59.5); out.push(await meas('hall: dais, sockets, channels, ribs'));
  await at(52.5, 47.5); out.push(await meas('hall: gates, plaques, medallions'));
  await useGate('E'); await at(82, 45.6); out.push(await meas('east foundry: pit, halves, moulds, drains'));
  await page.evaluate(() => { const RS = window.__pp.riftState(); if (RS.hall) delete RS.hall.belfry; }); await start('belfry', idx.hall); await useGate('W'); await at(24.5, 57.6); out.push(await meas('west chapel: pedestal, crystal'));
  if (idx.tide >= 0) { await start('belfry', idx.tide); await at(13, 30); out.push(await meas('tide ramp: rift props (cached by the engine either way)')); }
  for (const r of out) console.log(`${r.at.padEnd(58)} old 2D ${String(r.oldMs).padStart(6)} ms/frame · repainted ${String(r.newMs).padStart(6)} ms/frame   (pictures ${r.sprites}, painted ${r.painted} in ${r.paintMs} ms total, once)`);
  console.log('PERFAB ' + JSON.stringify(out)); console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
