// v440 SQ: a sustained session, headless Chromium on this machine (SwiftShader as the GPU: not a phone, not phone numbers), on the
// arcade's own loop: the in-game benchmark's Long run (Settings > Run benchmark > Long run: everything at once in the Garden, the
// Belfry's pack with stacked wind and its draining hall, the Belfry's first boss, 20 s each, every phase in a freshly entered stage:
// ultimates every 6 s, the Anima summoned again and again, rooms left and entered ~40 times), with the GPU paths forced (FGFX, GLM:
// Samael). Every SAMPLE s of wall time (after a full garbage collection): the frame intervals of the last stretch (median, p95), the JS
// heap, canvases made / still alive / in the page, WebGL contexts and objects alive (buffers, textures, framebuffers, programs,
// shaders), event listeners and timers alive, the dungeon's effect lists and the game's picture caches.
// usage: HTML=<test html> node tests/_sq-long.js   env: MIN (13: wall minutes), SAMPLE (30 s), DPR (1), OUT (json), ANIMA (aries)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
function counters() {
  const R = window.__RC = { cvNew: 0, cvGone: 0, ctx: 0, ctxGone: 0, gl: { buf: 0, tex: 0, fb: 0, rb: 0, prog: 0, sh: 0 }, lis: 0, lisBy: {}, iv: new Set(), to: new Set(), raf: new Set() };
  const fr = new FinalizationRegistry(k => { if (k === 'cv') R.cvGone++; else if (k && k.gl) { R.ctxGone++; for (const q in k.gl) R.gl[q] -= k.gl[q]; } });
  const ce = Document.prototype.createElement; Document.prototype.createElement = function (t) { const e = ce.apply(this, arguments); if (/^canvas$/i.test(t)) { R.cvNew++; fr.register(e, 'cv'); } return e; };
  const gc0 = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t) { const had = this.__rcCtx; const r = gc0.apply(this, arguments); if (r && /webgl/.test(t) && !had) { this.__rcCtx = 1; R.ctx++; r.__rc = { gl: { buf: 0, tex: 0, fb: 0, rb: 0, prog: 0, sh: 0 } }; fr.register(r, r.__rc); } return r; };
  for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const P = G.prototype;
    for (const [mk, dl, k] of [['createBuffer', 'deleteBuffer', 'buf'], ['createTexture', 'deleteTexture', 'tex'], ['createFramebuffer', 'deleteFramebuffer', 'fb'], ['createRenderbuffer', 'deleteRenderbuffer', 'rb'], ['createProgram', 'deleteProgram', 'prog'], ['createShader', 'deleteShader', 'sh']]) {
      const a = P[mk], d = P[dl]; P[mk] = function () { const o = a.apply(this, arguments); if (o) { R.gl[k]++; if (this.__rc) this.__rc.gl[k]++; } return o; }; P[dl] = function (o) { if (o && !o.__rcDel) { o.__rcDel = 1; R.gl[k]--; if (this.__rc) this.__rc.gl[k]--; } return d.apply(this, arguments); }; } }
  const ae = EventTarget.prototype.addEventListener, re = EventTarget.prototype.removeEventListener, LS = new WeakMap();
  const lset = (tg, t) => { let m = LS.get(tg); if (!m) LS.set(tg, m = new Map()); let q = m.get(t); if (!q) m.set(t, q = new Set()); return q; };
  EventTarget.prototype.addEventListener = function (t, f) { if (f) { const q = lset(this, t); if (!q.has(f)) { q.add(f); R.lis++; if (this === window || this === document) R.lisWD = (R.lisWD || 0) + 1; R.lisBy[t] = (R.lisBy[t] || 0) + 1; } } return ae.apply(this, arguments); };
  EventTarget.prototype.removeEventListener = function (t, f) { if (f) { const q = lset(this, t); if (q.has(f)) { q.delete(f); R.lis--; if (this === window || this === document) R.lisWD = (R.lisWD || 0) - 1; R.lisBy[t] = (R.lisBy[t] || 1) - 1; } } return re.apply(this, arguments); };
  const si = window.setInterval, ci = window.clearInterval, st = window.setTimeout, ct = window.clearTimeout, ra = window.requestAnimationFrame, ca = window.cancelAnimationFrame;
  window.setInterval = function () { const id = si.apply(this, arguments); R.iv.add(id); return id; }; window.clearInterval = function (id) { R.iv.delete(id); return ci.apply(this, arguments); };
  window.setTimeout = function (f) { const a = [].slice.call(arguments); let id; if (typeof f === 'function') a[0] = function () { R.to.delete(id); return f.apply(this, arguments); }; id = st.apply(this, a); R.to.add(id); return id; }; window.clearTimeout = function (id) { R.to.delete(id); return ct.apply(this, arguments); };
  window.requestAnimationFrame = function (f) { let id; id = ra.call(this, function (t) { R.raf.delete(id); return f(t); }); R.raf.add(id); return id; }; window.cancelAnimationFrame = function (id) { R.raf.delete(id); return ca.apply(this, arguments); };
}
(async () => {
  const MIN = +(process.env.MIN || 13), SAMPLE = +(process.env.SAMPLE || 30), OUT = process.env.OUT;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: +(process.env.DPR || 1), hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text().slice(0, 200)); });
  await page.addInitScript(counters);
  await page.addInitScript(lpt => { for (const f of ['__NG_GL', '__SM_GL', '__AS_GL', '__BELK_GL', '__GLM_WARM']) window[f] = 1; window.__BENCH_LONG = 1e9; window.__BENCH_LPT = lpt; }, +(process.env.LPT || 0));   // (LPT: the Long run's phases shortened to LPT s of play, so a slow machine still leaves and enters many rooms)
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(500);
  await page.evaluate(an => { const P = window.__pp; P.quickStart('Bot'); P.st.dlv = 33; P.st.energy = 50; const R = P.riftState(); R.prog.garden = 3; P.st.dun.best = Math.max(P.st.dun.best || 0, 40); P.st.unlockAll = true; P.st.fps = true; P.st.fpsD = true; if (an) { P.ANIMA_ORDER.forEach(x => P.st.animas.have[x] = 3); P.st.animas.eq = an; P.st.animas.res = null; } }, process.env.ANIMA == null ? 'aries' : process.env.ANIMA);
  const before = await page.evaluate(() => { const P = window.__pp; return { energy: P.st.energy, coins: P.st.coins, lvl: P.st.dlv, prog: JSON.stringify(P.riftState().prog) }; });
  console.log('started', await page.evaluate(() => window.PERF.bench({ long: true })), JSON.stringify(before));
  const sample = () => page.evaluate(async (span) => { if (window.gc) { window.gc(); await new Promise(r => setTimeout(r, 50)); window.gc(); }
    const R = window.__RC, P = window.__pp, A = P.arc, D = A.game && A.game._dbg, S = window.PERF.stats(span * 1000), F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX, B = window.PERF.B, AN = D && D.AN;
    const sz = n => { try { const v = (0, eval)(n); return v == null ? null : v.size != null ? v.size : v.length; } catch (e) { return null; } };
    const caches = window.PERF.mem ? window.PERF.mem() : {};
    const L = {}; if (D) { for (const k of ['parts', 'zones', 'texts', 'rings', 'bolts', 'shots', 'eshots', 'helpers', 'mons', 'amb', 'banners']) L[k] = D[k] ? D[k].length : null; L.fx = D.ELEM ? D.ELEM.fx.length : null; L.anima = AN && AN.S ? AN.S.list.length : null; L.animaFx = AN && AN.S && AN.S.fx ? AN.S.fx.length : null; }
    return { t: performance.now(), frames: S.n, med: +S.med.toFixed(1), p95: +S.p95.toFixed(1), o50: S.o50, js: +(S.upd + S.draw + S.post).toFixed(1), heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
      cv: { made: R.cvNew, alive: R.cvNew - R.cvGone, inPage: document.querySelectorAll('canvas').length }, gl: Object.assign({ ctx: R.ctx - R.ctxGone }, R.gl), lis: R.lis, lisWD: R.lisWD || 0, timers: { iv: R.iv.size, to: R.to.size, raf: R.raf.size }, lists: L, caches,
      bench: B ? { ph: B.ph, play: +B.play.toFixed(0), stages: B.stages, stg: B.stg } : null, state: A.state, fg: F ? { canvas: (F.stats.W || 0) + 'x' + (F.stats.H || 0), runs: F.stats.runs || 0 } : null, fx: window.FXB ? window.FXB.state() : null }; }, SAMPLE);
  const rows = [], t0 = Date.now(); let done = null;
  while (Date.now() - t0 < MIN * 60000) { await page.waitForTimeout(SAMPLE * 1000); const r = await sample(); r.wall = +((Date.now() - t0) / 1000).toFixed(0); rows.push(r);
    console.log(`${String(r.wall).padStart(5)}s play ${r.bench ? r.bench.play : '-'}s st ${r.bench ? r.bench.stages : '-'} | med ${r.med} p95 ${r.p95} (${r.frames} fr) | heap ${r.heapMB} MB | cv ${r.cv.alive}/${r.cv.made} (${r.cv.inPage} in page) | gl ctx ${r.gl.ctx} buf ${r.gl.buf} tex ${r.gl.tex} fb ${r.gl.fb} prog ${r.gl.prog} | lis ${r.lis} (win/doc ${r.lisWD}) | iv ${r.timers.iv} to ${r.timers.to} raf ${r.timers.raf} | parts ${r.lists.parts} fx ${r.lists.fx} mons ${r.lists.mons} | sized ${r.caches.sized}/${r.caches.sizedSeen} ${r.caches.sizedMpx}Mpx text ${r.caches.text} free ${r.caches.textFree} fx$ ${r.caches.fx} glow ${r.caches.glow} mc ${r.caches.mcCv}`);
    if (OUT) fs.writeFileSync(OUT, JSON.stringify({ rows, errors }, null, 1));
    done = await page.evaluate(() => { const o = document.getElementById('benchOut'); return o ? o.querySelector('pre').textContent : null; }); if (done) break; }
  if (!done) { await page.evaluate(() => { window.__BENCH_LONG = 1; }); for (let k = 0; k < 120 && !done; k++) { await page.waitForTimeout(2000); done = await page.evaluate(() => { const o = document.getElementById('benchOut'); return o ? o.querySelector('pre').textContent : null; }); } }
  console.log('\n' + (done || '(no results card)'));
  const after = await page.evaluate(() => { const P = window.__pp; return { energy: P.st.energy, coins: P.st.coins, lvl: P.st.dlv, prog: JSON.stringify(P.riftState().prog), arc: P.arc.open }; });
  console.log('after', JSON.stringify(after), 'kept nothing:', Math.abs(after.energy - before.energy) < 0.05 && after.lvl === before.lvl && after.prog === before.prog && after.coins === before.coins && !after.arc);
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ rows, errors, card: done, before, after }, null, 1));
  console.log('page errors', errors.length, JSON.stringify(errors.slice(0, 5))); await browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
