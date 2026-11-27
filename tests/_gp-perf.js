// v468 GP: Clash of the Twins' drawing cost in its busiest moments, on the GPU (SwiftShader here: counts are meaningful, ms are not).
// Per drawn frame: Raziel-painter passes (each a GL pass and a copy: the guardians, pillars, gate), FGFX flushes and quads, FGFX
// composites (copies) and their area in px, and the JS draw time. Scenes: track (stage I), twin (stage III: both breathing, crossing, a
// Thermal Shock, debris), lock (the Paradox's double lock), boom (the convergence's explosion), gate (opening), sun (twin + Sunflare).
// Then: after the stage closes every GPU buffer of the gate's own meshes is given back (GEMINI_GUARD.gpuCount() 0).
// HTML=test-gp.html DPR=1|3 LOW=1 SHOT=1 node tests/_gp-perf.js
const { open } = require('./_gp-lib');
const DPR = +(process.env.DPR || 1), LOW = process.env.LOW === '1', SHOT = process.env.SHOT === '1';
const SET = {
  track: `const L = m.GU.L, p = m.PIL[0]; step(12, () => { heal(); const o = m.mouthOf(L), dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy); hold(p.x + dx / d * 2.3, p.y + dy / d * 2.3); return L.st === 'track' && L.tt > 1.2; });`,
  twin: `m.stage(3); step(4, () => { heal(); hold(21.5, 46); }); const L = m.GU.L, U2 = m.GU.R, CC = GG.CC; for (const G of [L, U2]) { G.st = 'breath'; G.tt = 0.4; G.lockO = m.mouthOf(G); G.lockA = m.aimAt(G, CC.x, CC.y + 1.5); G.charge = 1; G.jaw = 1; G.cd = 99; }
    step(0.25, () => { heal(); hold(21.5, 46); for (const G of [L, U2]) { if (G.st !== 'breath') { G.st = 'breath'; G.tt = 0.5; } } }); R.fx.push({ k: 'burst', x: m.PIL[4].x, y: m.PIL[4].y, el: 'ice', t: 0.4, life: 2.0 }); m.PIL[4].broken = true; m.PIL[4].brokeT = 0.5;`,
  lock: `m.paradox(); step(10, () => { heal(); hold(21.5, 39); return R.st === 'plock'; }); step(0.5, () => { heal(); hold(21.5, 42); });`,
  boom: `m.paradox(); step(10, () => { heal(); hold(21.5, 39); return R.st === 'plock'; }); step(4, () => { heal(); hold(21.5, 45); return R.st === 'cine'; }); step(5.1, () => heal());`,
  gate: `m.solve(); step(3.2, () => heal());`,
  sun: `m.stage(3); step(4, () => { heal(); hold(21.5, 46); }); const L = m.GU.L, U2 = m.GU.R, CC = GG.CC; for (const G of [L, U2]) { G.st = 'breath'; G.tt = 0.4; G.lockO = m.mouthOf(G); G.lockA = m.aimAt(G, CC.x, CC.y + 1.5); G.charge = 1; G.jaw = 1; G.cd = 99; }`,
};
(async () => {
  const out = {}; let fails = 0;
  for (const k of Object.keys(SET)) {
    const H = await open({ gl: true, dpr: DPR, lowFx: LOW }); try { await H.start();
      await H.M(() => { if (window.__glWrap) return; window.__glWrap = 1; window.__C = { rz: 0, fl: 0, q: 0, comp: 0, cpx: 0 }; const C = window.__C; const R0 = window.RAZIEL_GL, d0 = R0.drawParts, d1 = R0.draw; R0.drawParts = function () { C.rz++; return d0.apply(this, arguments); }; R0.draw = function () { C.rz++; return d1.apply(this, arguments); };
        const F = window.NIDHOGG_MOVES.FGFX, f0 = F.flush; F.flush = function () { const fr0 = F.stats.frames, r = f0.apply(this, arguments); const s1 = F.stats; if (s1.frames !== fr0) { C.fl++; C.q += s1.quads || 0; C.comp += s1.comp || 0; C.cpx += s1.compPx || 0; } return r; }; });
      await H.ev(`window.__RZ_GLHQ = 0;` + SET[k]);
      if (k === 'sun') await H.page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg; const mv = P.ELEM_LIST.light.ey_sunflare; if (D.setKit && mv) { D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.me.mp = 999; D.g.cdU = 0; D.g.intro = 0; D.useUlt(); for (let i = 0; i < 40; i++) G.update(1 / 30); } });
      const r = await H.page.evaluate(() => { const C = window.__C, F = window.NIDHOGG_MOVES.FGFX, A = window.__pp.arc, G = A.game, c = A.ctx || document.querySelector('#arcCanvas').getContext('2d'); G.draw(c); try { if (F.frameEnd) F.frameEnd(); } catch (e) {}
        C.rz = 0; C.fl = 0; C.q = 0; C.comp = 0; C.cpx = 0; const r0 = F.stats.runs || 0, N = 3; let ms = 0; for (let i = 0; i < N; i++) { const t = performance.now(); G.draw(c); try { if (F.frameEnd) F.frameEnd(); } catch (e) {} ms += performance.now() - t; }
        return { frames: N, rzPasses: +(C.rz / N).toFixed(2), fgxFlush: +(C.fl / N).toFixed(2), fgxQuads: Math.round(C.q / N), fgxComp: +(C.comp / N).toFixed(2), fgxRuns: +(((F.stats.runs || 0) - r0) / N).toFixed(2), compArea: Math.round(C.cpx / N), screenPx: Math.round(c.canvas.width * c.canvas.height), drawMs: +(ms / N).toFixed(1) }; });
      const s = await H.ev(`return { st: R.st, phase: S.phase, gg: window.GEMINI_GUARD.gpuCount() };`); out[k] = Object.assign(r, s); console.log(k, JSON.stringify(out[k]));
      if (SHOT) await H.shot('v468-GP', `perf-${k}-dpr${DPR}${LOW ? '-low' : ''}`);
      if (k === 'gate') { await H.M(() => window.__pp.closeArcade(true)); await H.page.waitForTimeout(500); const g = await H.page.evaluate(() => ({ gg: window.GEMINI_GUARD.gpuCount(), rz: window.RAZIEL_GL.gpuCount(), live: !!window.GEMINI_GATE.live })); console.log('  after close', JSON.stringify(g)); if (g.gg !== 0 || g.rz !== 0 || g.live) { fails++; console.log('FAIL the gate\'s GPU meshes are given back when the stage closes'); } else console.log('ok   the gate\'s GPU meshes and Raziel\'s are given back when the stage closes (0 buffers)'); }
      if (H.errors.length) { fails++; console.log('errors', H.errors.slice(0, 3)); }
    } catch (e) { console.log('ERR', k, e.message); fails++; } await H.browser.close(); }
  console.log(JSON.stringify(out)); process.exit(fails ? 1 : 0);
})();
