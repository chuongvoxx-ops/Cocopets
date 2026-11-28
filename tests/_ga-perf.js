// (v475 GA) Gabriel's cost per drawn frame in real places (SwiftShader: the COUNTS are meaningful; GL milliseconds are not; the update's
// CPU ms is): the model's GL passes (GABRIEL_GL draw / drawParts / drawSpectral; each one GL copy), the FGFX painter's flushes (each one GL copy) and quads, update ms and draw ms (median of F frames).
// Windows: base (no Anima), enter, a Thresher at lv7, the Sanctuary's dome, Eden Reborn's paradise (P4) and its opening (P5); SUN=1 casts
// Sunflare as the ultimate starts. After: Gabriel gone, GABRIEL_GL.gpuCount(), heap.
// usage: HTML=test-ga.html PLACE=tower|belfry|garden|dunes|crowd [GL=0] [SUN=1] [LOW=1] [F=4] node tests/_ga-perf.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const PLACE = process.env.PLACE || 'tower', GL = process.env.GL !== '0', F = +(process.env.F || 4), SUN = process.env.SUN === '1';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('console', m => { if (/Gabriel|GLM|GFX/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(gl => { window.__OLD = 0; window.__NG_GL = gl ? 1 : 0; window.__GB_GL = gl ? 1 : 0; window.__SP_OFF = 1; let sd = 4242; Math.random = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; }, GL);
  await page.addInitScript(o => { window.__OLD = o; }, process.env.OLD ? 1 : 0);
  await page.goto('file://' + path.resolve(process.env.HTML || 'test-ga.html')); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  await page.evaluate(([pl, low, stg]) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'virgo'; P.st.animas.res = null; if (low) P.st.lowFx = true;
    if (pl === 'tower' || pl === 'crowd') P.dun.startDungeon(3, 5); else P.startRift(pl, stg); }, [PLACE, process.env.LOW === '1', +(process.env.STAGE || 0)]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 400000 });
  const setup = await page.evaluate(([pl, sun]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; for (let k = 0; k < 30; k++) G.update(1 / 30);
    if (!AN.kit || (!AN.gb && !window.__OLD)) return 'no Gabriel kit'; AN.kit.main.k = 3; D.g.intro = 0; D.god = true;
    // the monsters brought round the pet, held (crowd: every one of the floor's)
    const L = D.mons.filter(m => !m.dead).slice(0, pl === 'crowd' ? 40 : 10); L.forEach((m, i) => { const an = i * 2.4, r = 2 + (i % 5) * 0.8; Object.assign(m, { x: me.x + Math.cos(an) * r, y: me.y + Math.sin(an) * r * 0.7, hp: 1e7, maxhp: 1e7, atkCd: 99, spd: 0 }); m.hx = m.x; m.hy = m.y; });
    const ctx = P.arc.ctx || document.getElementById('arcCanvas').getContext('2d'), C = window.__C = { gl: 0, q: 0, fl: 0 };
    { const GG = window.GABRIEL_GL; if (GG) for (const k of ['draw', 'drawAnima', 'drawParts', 'drawSpectral']) { const f0 = GG[k]; GG[k] = function () { const r = f0.apply(this, arguments); if (r) C.gl++; return r; }; } }
    const FG = window.NIDHOGG_MOVES.FGFX, b0 = FG.begin; FG.begin = function () { C.fl++; const Q = b0.apply(this, arguments); if (Q && !Q.__w) { Q.__w = 1; for (const k of ['quad', 'shape', 'trap', 'smoke', 'satin', 'sshadow']) { const f1 = Q[k]; if (typeof f1 === 'function') Q[k] = function () { C.q++; return f1.apply(this, arguments); }; } } return Q; };
    const hold = () => { for (const m of L) { m.x = m.hx; m.y = m.hy; m.atkCd = 99; } me.hp = D.ST.hp; D.eshots.length = 0; };
    const stepN = (sec) => { const n = Math.round(sec * 30); for (let i = 0; i < n; i++) { G.update(1 / 30); hold(); } };
    const med = a => a.slice().sort((p, q) => p - q)[a.length >> 1];
    window.__PF = { G, D, AN, me, ctx, stepN, hold, measure: (n) => { const up = [], dr = []; const cp0 = self.PERF ? self.PERF.cpAcc : 0; C.gl = 0; C.q = 0; C.fl = 0;
      for (let i = 0; i < n; i++) { let t = performance.now(); G.update(1 / 30); hold(); up.push(performance.now() - t); t = performance.now(); G.draw(ctx); dr.push(performance.now() - t); }
      const a = AN.S.list[0]; return { st: a ? a.st + (AN.gb && AN.gb.ul && AN.gb.ul.ul ? ' ult ' + AN.gb.ul.ul.t.toFixed(1) : '') : 'gone', updMs: +med(up).toFixed(2), drawMs: Math.round(med(dr)), modelPasses: +(C.gl / n).toFixed(1), fgFlushes: +(C.fl / n).toFixed(1), fgQuads: Math.round(C.q / n) }; } };
    if (sun) { const mv = P.ELEM_LIST.light.ey_sunflare; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); }
    return { mons: L.length }; }, [PLACE, SUN]);
  console.log(PLACE, 'setup', JSON.stringify(setup)); if (typeof setup === 'string') { await browser.close(); process.exit(1); }
  if (GL) console.log('model', await page.evaluate(() => { const G = window.GABRIEL_GL; if (!G) return 'none'; G.warm(); for (let i = 0; i < 600 && !G.ready(); i++) G.step && G.step(60); return G.ready(); }));
  const W = async (name, prep) => { const r = await page.evaluate(([prep, n]) => { const PF = window.__PF; (new Function('PF', prep))(PF); return PF.measure(n); }, [prep, F]); console.log(PLACE + (SUN ? '+sun' : ''), name, JSON.stringify(r)); };
  await W('base', 'PF.stepN(0.2);');
  await W('enter', 'const AN = PF.AN; Object.assign(AN.S, { gauge: 1, used: false, cine: null }); const ok = AN.summon(); if (!ok) console.log("summon refused"); PF.stepN(2.8);');
  if (process.env.OLD) { await page.evaluate(() => { window.__OLD = 1; }); await W('fight', 'PF.stepN(4);'); await W('finale', 'const a = PF.AN.S.list[0]; if (a) a.life = 0.05; PF.stepN(1.0);'); } else {
  await W('thresher7', 'const AN = PF.AN; PF.stepN(2.5); const a = AN.S.list[0]; a.life = 25; AN.gb.cast(a, "thr"); PF.stepN(2.0);');
  await W('sanctuary', 'const AN = PF.AN, a = AN.S.list[0]; PF.stepN(3); AN.gb.cast(a, "sanct"); PF.stepN(1.8);');
  await W('ultP4', 'const AN = PF.AN, a = AN.S.list[0]; PF.stepN(1); a.life = 0.05; PF.stepN(0.1); if (' + SUN + ') { PF.me.mp = 999; PF.D.g.cdU = 0; PF.D.useUlt(); } PF.stepN(7.9);');
  await W('ultP5', 'PF.stepN(3.1);'); }
  const after = await page.evaluate(() => { const PF = window.__PF; PF.stepN(5); if (window.gc) window.gc(); const G = window.GABRIEL_GL; return { list: PF.AN.S.list.length, gpu: G && G.gpuCount ? G.gpuCount() : null, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1e6).toFixed(1) : null }; });
  console.log(PLACE, 'after', JSON.stringify(after)); console.log('errors', JSON.stringify(errors.slice(0, 5))); await browser.close(); })();
