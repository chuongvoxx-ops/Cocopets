// v392 PR: the Drowned Belfry's props on the GPU. Pictures at 390x844 (DPR 2, or DPR1=1) of every place that has props,
// and the per-frame cost of drawing them (the engine's g.prof pieces 'ground' + 'ents', where the props are drawn).
// usage: HTML=test-calPR.html TAG=after node tests/_bel-pr-props.js [hall sockets east platform west north cistern tide nave perf]
//   -> shots/bel-pr-<TAG>-<name>.png ; env GL=0 forces the 2D fallback (window.__BEL_GL = 0)
process.env.HTML = process.env.HTML || 'test.html'; if (process.env.DPR1 !== '1') process.env.SHOTS = '1';
const { open } = require('./_rift-lib');
const path = require('path');
const TAG = process.env.TAG || 'after';
(async () => {
  const T = await open({ lvl: 14 }); const { page, errors, start } = T; page.setDefaultTimeout(300000);
  await page.evaluate(gl => { window.__BELP_GL = gl === '0' ? 0 : 1; if (gl === '0') window.__BEL_GL = 0; }, process.env.GL || '');
  const idx = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.belfry, f = re => R.stages.findIndex(s => s && re.test(s.name || '')); return { hall: f(/Hall of Three Tides/), clap: f(/Clapper/), tide: f(/Tide Walk/), church: f(/Lower Church/), nave: R.stages.findIndex(s => s && s.boss === 'belnhalu') }; });
  const gt = secs => page.evaluate(async secs => { const G = window.__pp.arc.game._dbg, t0 = G.g.t, w0 = performance.now(); while (G.g.t - t0 < secs && performance.now() - w0 < secs * 30000) { await new Promise(r => requestAnimationFrame(r)); if (G.me && !G.me.dead) { G.me.hp = G.ST.hp; G.me.mp = 999; } } }, secs);
  const step = (secs, o) => page.evaluate(async ([secs, o]) => { const D = window.__pp.arc.game._dbg, t0 = D.g.t; while (D.g.t - t0 < secs) { window.__pp.arc.game.update(1 / 30); if (!D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } if (o && o.stay) { D.me.x = o.stay[0]; D.me.y = o.stay[1]; D.me.vx = D.me.vy = 0; } } }, [secs, o || null]);
  const at = (x, y) => page.evaluate(([x, y]) => { const G = window.__pp.arc.game._dbg; G.me.x = x; G.me.y = y; G.me.vx = G.me.vy = 0; }, [x, y]);
  const peace = () => page.evaluate(() => { const G = window.__pp.arc.game._dbg; for (const m of G.mons) if (!m.boss) { m.aggro = false; m.x = -50; m.y = -50; } });
  const snap = async name => { await page.evaluate(() => { const D = window.__pp.arc.game._dbg; if (D.banners) D.banners.length = 0; }); await gt(0.4); await page.screenshot({ path: path.resolve(__dirname, `../shots/bel-pr-${TAG}-${name}.png`) }); console.log('shot', name); };
  const useGate = async B => { await page.evaluate(B => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'belgate' && o.B === B); D.me.x = o.x + 0.3; D.me.y = o.y + 0.25; D.me.vx = D.me.vy = 0; o.used = false; o.ch = 0; }, B); await step(1.0); };
  const fresh = () => page.evaluate(() => { const RS = window.__pp.riftState(); if (RS.hall) delete RS.hall.belfry; });
  // the frame's cost: 'ground' (the stage's floor dressing: dais, foundry, chapel) + 'ents' (props and objects), ms per frame
  const perf = name => page.evaluate(async name => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r)); D.g.prof = {}; const n = 12; for (let i = 0; i < n; i++) await new Promise(r => requestAnimationFrame(r)); const P = D.g.prof; D.g.prof = null;
    const o = { at: name }; for (const k of ['world', 'ground', 'picks', 'ents']) o[k] = +((P[k] || 0) / n).toFixed(2); o.props = +(o.ground + o.ents).toFixed(2); const S = self.BELPGL ? self.BELPGL.stats : null; if (S) o.gl = { renders: S.renders, renderMs: +S.renderMs.toFixed(0), sprites: S.sprites, live: S.draws }; return o; }, name);
  const want = process.argv.slice(2), W = n => !want.length || want.includes(n), PERF = [];
  if (W('hall') || W('sockets') || W('perf')) { await fresh(); await start('belfry', idx.hall); await peace(); await at(52.5, 59.5); await gt(1.5); if (W('hall')) await snap('hall'); if (W('perf')) PERF.push(await perf('hall'));
    if (W('sockets')) { await page.evaluate(() => { const D = window.__pp.arc.game._dbg, H = D.RIFT.self.hall; H.PS.dep = 'EW'; H.PS.earn = 'EW'; H.S.grip.E = H.S.grip.W = 1; H.S.chan.E = H.S.chan.W = 1; }); await at(52.5, 57.2); await gt(1.2); await snap('sockets'); }
    await at(52.5, 47.5); await gt(1); await snap('gates'); }
  if (W('east') || W('platform') || W('perf')) { await fresh(); await start('belfry', idx.hall); await useGate('E'); await at(82, 45.6); await step(0.3); await peace(); await gt(1.6); await peace(); if (W('east')) await snap('east'); if (W('perf')) PERF.push(await perf('east'));
    await at(75, 45.2); await peace(); await gt(1); if (W('east')) await snap('east-bells');
    if (W('platform')) { await at(93.0, 57.0); await peace(); await gt(1.2); await snap('east-platform'); } }
  if (W('west') || W('perf')) { await fresh(); await start('belfry', idx.hall); await useGate('W'); await at(24.5, 57.6); await gt(3.6); await peace(); await gt(0.5); await peace(); if (W('west')) await snap('west'); if (W('perf')) PERF.push(await perf('west')); }
  if (W('north')) { await fresh(); await start('belfry', idx.hall); await useGate('N'); await at(52.5, 9.5); await gt(1.2); await snap('north-arch'); }
  // the densest group of the rift's own props in a phone's view (the pet just south of it)
  const cluster = (k) => page.evaluate(k => { const D = window.__pp.arc.game._dbg, L = D.propList.filter(p => /^bel/.test(p.kind) && !p.broken); let best = null, bn = -1; for (const p of L) { const kinds = new Set(), n = L.filter(q => Math.abs(q.x - p.x) < 4.5 && q.y - p.y > -3 && q.y - p.y < 6 && kinds.add(q.kind)).length + kinds.size * 3; if (n > bn) { bn = n; best = p; } } const r = (L.sort((a, b) => Math.hypot(a.x - (best || a).x, a.y - (best || a).y) - Math.hypot(b.x - (best || b).x, b.y - (best || b).y))[k] || best); return r ? { x: r.x, y: r.y + 3.2, n: bn } : null; }, k || 0);
  if (W('cistern') && idx.clap >= 0) { await start('belfry', idx.clap); await peace(); { const q = await cluster(0); if (q) await at(q.x, q.y); } await gt(2); await snap('cistern'); if (W('perf') || true) PERF.push(await perf('cistern')); await at(30, 21); await gt(1.2); await snap('cistern-lift'); }
  if (W('tide') && idx.tide >= 0) { await start('belfry', idx.tide); await peace(); await gt(1.5); await snap('tide-foot'); { const q = await cluster(0); if (q) await at(q.x, q.y); } await peace(); await gt(1.5); await snap('tide-landing'); PERF.push(await perf('tide')); }
  if (W('church') && idx.church >= 0) { await start('belfry', idx.church); await peace(); { const q = await cluster(0); if (q) await at(q.x, q.y); } await peace(); await gt(1.5); await snap('church'); }
  if (W('nave') && idx.nave >= 0) { await start('belfry', idx.nave); await gt(3); await snap('nave'); }
  if (PERF.length) console.log('PERF ' + TAG + ' ' + JSON.stringify(PERF));
  console.log('page errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
