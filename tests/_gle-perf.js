// v451 GE, v455 GE2: Golden Eagle's frame cost on a crowded dungeon floor (44 monsters held in and round the waves' path), at a phone's size (390x844, DPR 3), every
// GPU path forced on the software rasteriser (as a phone's GPU takes them), measured by tests/_pf-lib.js: idle (no cast) and each phase of
// the cast. Per scenario: this machine's frame ms (median; SwiftShader: the GPU's work is paid on the CPU here), the JS ms (the frame less
// the GPU copies' waits), the WebGL -> 2D copies a frame (FGFX layers laid + GLM passes laid), GLM passes and their GL pixels, the composite
// area (Mpx), GLM triangles, FGFX quads, gradients, canvases resized.
// The same scene and phases run on the v452 build (before the rework: its own timeline's phases) and on this one (the reworked
// timeline's matching phases, from the move's choreo), so the two tables compare.
// usage: HTML=<test html> node tests/_gle-perf.js   env: F (frames a scenario, 4), DPR (3), EVO (7), GQ (high|balanced|perf), LOW (1)
const { open } = require('./_pf-lib');
const GLMLOG = () => { window.__SPT = { n: 0, px: 0, big: 0 };
  for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const P = G.prototype, o = P.viewport; P.viewport = function (x, y, w, h) { if (this.__pfK === 'glm' && w * h > 64) { const T = window.__SPT; T.n++; T.px += w * h; T.big = Math.max(T.big, w * h); } return o.apply(this, arguments); }; }
  window.__PFX = () => { const T = window.__SPT; return { glmPass: T.n, glmPx: T.px }; }; };
(async () => {
  const F = +(process.env.F || 4), EVO = +(process.env.EVO || 7);
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 3), flags: { __GE_GL: 1, __GE_GLHQ: 1 }, init: GLMLOG }); const { page, errors, frames } = T;
  const ev = (f, a) => page.evaluate(f, a);
  await ev(o => { const P = window.__pp; if (o.gq) P.st.gq = o.gq; if (o.low) P.st.lowFx = true; P.st.devMoves = true; if (P.arc.open) P.closeArcade(true); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); }, { gq: process.env.GQ || '', low: process.env.LOW === '1' });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000, polling: 1000 }); await ev(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 600000 });
  const info = await ev(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(4242);
    const G = P.arc.game, D = G._dbg, me = D.me, g = D.g; for (let k = 0; k < 60; k++) G.update(1 / 60); g.intro = 0; g.bossIntro = 0; D.banners.length = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.4, 0);
    let best = null, bs = -1; for (let k = 0; k < 3000; k++) { const sx = Math.floor(me.x + (Math.random() - 0.5) * 80) + 0.5, sy = Math.floor(me.y + (Math.random() - 0.5) * 80) + 0.5; if (!W(sx, sy)) continue; let n = 0; for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) if (dx * dx + dy * dy <= 25 && W(sx + dx, sy + dy)) n++; if (n > bs) { bs = n; best = { x: sx, y: sy }; } }
    window.__T = best; me.x = best.x; me.y = best.y + 3.0; if (!W(me.x, me.y)) { me.x = best.x; me.y = best.y + 1; }
    const L = D.mons.filter(m => !m.dead && !m.boss && !m.fiend && !m.fobj).slice(0, 44); const put = [];
    L.forEach((m, i) => { let x = best.x + 30, y = best.y + 30; for (let j = 0; j < 200; j++) { const a = i * 2.39 + j * 0.53, r = 0.8 + (i % 9) * 0.6 + j * 0.03, qx = best.x + Math.cos(a) * r, qy = best.y + Math.sin(a) * r; if (W(qx, qy) && put.every(p => Math.hypot(p[0] - qx, p[1] - qy) > 0.55)) { x = qx; y = qy; break; } } put.push([x, y]); m.__px = [x, y]; Object.assign(m, { x, y, hp: 1e12, maxhp: 1e12, aggro: true }); });
    window.__GEH = () => { me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) { m.atkCd = 99; m.cd = 99; m.spd = 0; if (m.__px) { m.x = m.__px[0]; m.y = m.__px[1]; m.kbx = m.kby = 0; } } if (D.eshots) D.eshots.length = 0; D.banners.length = 0; D.texts && (D.texts.length = Math.min(D.texts.length, 40)); };
    for (let k = 0; k < 60; k++) { window.__GEH(); G.update(1 / 60); }
    const near = D.mons.filter(m => !m.dead && Math.hypot(m.x - best.x, m.y - best.y) < 7).length;
    return { open: bs, mons: D.mons.filter(m => !m.dead).length, near, cv: [document.getElementById('arcCanvas').width, document.getElementById('arcCanvas').height] }; });
  console.log('setup', JSON.stringify(info));
  const md = (L, k) => { const v = L.map(r => r[k] || 0).sort((a, b) => a - b); return v[v.length >> 1]; }, mn = (L, k) => L.reduce((a, r) => a + (r[k] || 0), 0) / L.length;
  const S = L => ({ ms: +md(L, 'tot').toFixed(0), js: +(md(L, 'tot') - md(L, 'glmMs') - md(L, 'diGLms')).toFixed(0), copies: +(mn(L, 'diGL') + mn(L, 'glmN')).toFixed(1), fg: +mn(L, 'diGL').toFixed(1), glm: +mn(L, 'glmN').toFixed(1),
    glmMpx: +(mn(L, 'x_glmPx') / 1e6).toFixed(2), compMpx: +((mn(L, 'diGLA') + mn(L, 'glmA')) / 1e6).toFixed(2), ktri: +(mn(L, 'glmVerts') / 3e3).toFixed(0), fgQuads: +mn(L, 'fgQuads').toFixed(0), grad: +mn(L, 'grad').toFixed(1), rsz: +mn(L, 'cvResize').toFixed(1), parts: +mn(L, 'parts').toFixed(0) });
  const rows = {};
  const measure = async name => { const r = await frames(F, { prof: false, hold: ['window.__GEH()'] }); rows[name] = S(r.rows); console.log(` ${name.padEnd(8)} ${JSON.stringify(rows[name])}`); };
  await measure('idle');
  await ev(evo => { const P = window.__pp, D = P.arc.game._dbg, T = window.__T; window.__GEH(); D.ELEM.ult('goldeneagle', { a: -Math.PI / 2, base: 50, el: 'wind', e8: 'wind', evo, tx: T.x, ty: T.y - 4, up: evo >= 7 }); window.__t0 = D.g.t; }, EVO);
  const to = t => ev(t => { const G = window.__pp.arc.game, D = G._dbg; while (D.g.t - window.__t0 < t - 1e-6) { window.__GEH(); G.update(1 / 60); } }, t);
  const PHS = await ev(evo => { const GE = window.__pp.ELEM_IMPL.wind.ult.goldeneagle; if (!GE.choreo) return [['enter', 0.6], ['hover', 1.3], ['wave1', 1.75], ['waves', 2.6], ['inhale', 4.4], ['final', 5.6], ['leave', 6.3], ['fade', 6.9]];
    const c = GE.choreo(GE.tierOf(evo), 0, 1), L = c.TR[c.NB - 1]; return [['enter', 0.6], ['hover', 1.3], ['wave1', c.TR[0] + 0.15], ['waves', c.TR[1] + 0.4], ['inhale', c.W1 + 0.4], ['final', L + 0.3], ['leave', c.T_LEAVE + 0.4], ['fade', c.T_LEAVE + 1.1]]; }, EVO);
  console.log('phases', JSON.stringify(PHS));
  for (const [name, t] of PHS) { await to(t); await measure(name); }
  const after = await ev(() => { const D = window.__pp.arc.game._dbg, G = window.GOLDEAGLE_GL; return { fx: D.ELEM.fx.length, gpu: G.gpuCount(), stats: G.STATS, tris: G.triCount ? G.triCount() : null }; });
  console.log('after', JSON.stringify(after)); console.log('TABLE', JSON.stringify(rows));
  console.log('errors', JSON.stringify(errors.slice(0, 5))); await T.browser.close();
})();
