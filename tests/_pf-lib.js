// v430 PF: the frame profiler for the Drowned Belfry (dev only: everything here lives in the test, nothing in the game).
// A page with the GPU paths forced on the software rasteriser (as a phone's real GPU would take them), counters installed
// on the Canvas2D and WebGL prototypes before any game script, and a hand-driven frame loop that times each frame the way
// the arcade's own loop runs it (update, draw, the lens pass), with the engine's g.prof pieces for the per-stage breakdown.
// Measured per frame: total ms, update ms, draw ms, the pieces, FGFX flushes (count, ms, quads, draw calls, composites and
// their area), GLM passes (count, ms, draw calls, triangles), Canvas2D work (drawImage count and area, gradients, patterns,
// canvases made, 'lighter' / filter / shadow draws, readbacks), GL uploads and shader compiles, JS heap growth.
// usage: const { open } = require('./_pf-lib'); see tests/_pf-frame.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');

/* installed before any game script: wraps the 2D and WebGL calls with counters (window.__PFC) */
function install() {
  const C = window.__PFC = { on: false, z() { for (const k of Object.keys(this)) if (typeof this[k] === 'number') this[k] = 0; } };
  const K = ['di', 'diA', 'diGL', 'diGLA', 'diCv', 'diCvA', 'fill', 'stroke', 'fillRect', 'fillRectA', 'grad', 'pat', 'cvNew', 'cvResize', 'gid', 'pid', 'lighter', 'lighterA', 'filt', 'shad', 'clip',
    'glDraw', 'glVerts', 'glBuf', 'glBufB', 'glTex', 'glTexB', 'glCompile', 'glCompileMs', 'glLink', 'glLinkMs', 'glRead', 'glClear', 'glProg',
    'diGLr', 'glmR', 'fgFlush', 'fgMs', 'fgFill', 'fgFillV', 'fgLayers', 'cvResizeGLM', 'fgQuads', 'fgSmoke', 'fgDraws', 'fgComp', 'glmN', 'glmMs', 'glmA', 'glmDraw', 'glmVerts', 'diGLms'];
  for (const k of K) C[k] = 0;
  const now = () => performance.now();
  const P2 = CanvasRenderingContext2D.prototype, sc = c => { const m = c.getTransform(); return Math.abs(m.a * m.d - m.b * m.c); };
  const wrap = (P, name, f) => { const o = P[name]; if (!o) return; P[name] = function () { if (C.on) f.call(this, arguments); return o.apply(this, arguments); }; };
  const compOp = (c, A) => { if (c.globalCompositeOperation === 'lighter') { C.lighter++; C.lighterA += A; } if (c.filter && c.filter !== 'none') C.filt++; if (c.shadowBlur > 0 && c.shadowColor && !/,\s*0\)$|transparent/.test(c.shadowColor)) C.shad++; };
  { const o = P2.drawImage; P2.drawImage = function (s) { if (!C.on) return o.apply(this, arguments); const a = arguments, n = a.length, w = n >= 9 ? a[7] : n >= 5 ? a[3] : (s.width || 0), h = n >= 9 ? a[8] : n >= 5 ? a[4] : (s.height || 0), A = Math.abs(w * h) * sc(this);
    C.di++; C.diA += A; compOp(this, A); if (s && s.__pfGL) { /* (a WebGL canvas laid on the 2D one: the GPU's work and the copy are paid here) */ if (s.__pfDirty) { s.__pfDirty = 0; if (s.__pfGL === 'glm') C.glmR++; else C.diGLr++; }   /* (v440 SQ: a copy of new WebGL content: the GPU's work waited for once; a second drawImage of the same picture reuses it) */ const t = now(); const r = o.apply(this, a); const dt = now() - t; if (s.__pfGL === 'glm') { C.glmN++; C.glmMs += dt; C.glmA += A; } else { C.diGL++; C.diGLA += A; C.diGLms += dt; } return r; } else if (s instanceof HTMLCanvasElement) { C.diCv++; C.diCvA += A; } return o.apply(this, a); }; }
  wrap(P2, 'fill', function () { C.fill++; compOp(this, 0); }); wrap(P2, 'stroke', function () { C.stroke++; compOp(this, 0); });
  wrap(P2, 'fillRect', function (a) { const A = Math.abs(a[2] * a[3]) * sc(this); C.fillRect++; C.fillRectA += A; compOp(this, A); });
  wrap(P2, 'clip', function () { C.clip++; });
  /* (C.trace on: where each gradient, pattern and new canvas comes from, by the caller's line in the page) */
  const who = k => { if (!C.trace) return; const L = (new Error().stack || '').split('\n')[4] || '', m = L.match(/:(\d+):\d+\)?$/); const key = k + ' ' + (m ? m[1] : '?') + ' ' + (L.match(/at ([^ ]+) /) || [])[1]; C.trace[key] = (C.trace[key] || 0) + 1; };
  wrap(P2, 'createRadialGradient', function () { C.grad++; who('grad'); }); wrap(P2, 'createLinearGradient', function () { C.grad++; who('grad'); }); wrap(P2, 'createPattern', function () { C.pat++; who('pat'); });
  wrap(P2, 'getImageData', function (a) { if (a[2] * a[3] > 1) C.gid++; }); wrap(P2, 'putImageData', function () { C.pid++; });
  const ce = Document.prototype.createElement; Document.prototype.createElement = function (t) { if (C.on && /^canvas$/i.test(t)) { C.cvNew++; if (C.trace) { const L = (new Error().stack || '').split('\n')[2] || '', m = L.match(/:(\d+):\d+\)?$/); const key = 'canvas ' + (m ? m[1] : '?') + ' ' + (L.match(/at ([^ ]+) /) || [])[1]; C.trace[key] = (C.trace[key] || 0) + 1; } } return ce.apply(this, arguments); };
  for (const pr of ['width', 'height']) { const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, pr); Object.defineProperty(HTMLCanvasElement.prototype, pr, { get: d.get, set(v) { if (C.on && d.get.call(this) !== v) { C.cvResize++; if (this.__pfGL === 'glm') C.cvResizeGLM++; /* (v434 PO: the GLM canvas's own) */ if (C.trace) { const L = (new Error().stack || '').split('\n')[2] || '', m = L.match(/:(\d+):\d+\)?$/); const key = 'resize ' + (m ? m[1] : '?') + ' ' + (L.match(/at ([^ ]+) /) || [])[1]; C.trace[key] = (C.trace[key] || 0) + 1; } } d.set.call(this, v); }, configurable: true }); }
  const gc = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t) { const r = gc.apply(this, arguments); if (r && /webgl/.test(t)) { this.__pfGL = arguments[1] && arguments[1].depth ? 'glm' : 'fg'; r.__pfK = this.__pfGL; } return r; };
  for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const P = G.prototype;
    wrap(P, 'drawArrays', function (a) { C.glDraw++; C.glVerts += a[2]; }); wrap(P, 'drawElements', function (a) { C.glDraw++; C.glVerts += a[1]; if (this.__pfK === 'glm') { C.glmDraw++; C.glmVerts += a[1]; } });
    wrap(P, 'bufferData', a => { C.glBuf++; C.glBufB += a[1] && a[1].byteLength || 0; }); wrap(P, 'bufferSubData', a => { C.glBuf++; C.glBufB += a[2] && a[2].byteLength || 0; });
    wrap(P, 'texImage2D', a => { C.glTex++; const s = a[a.length - 1]; C.glTexB += s && (s.byteLength || (s.width * s.height * 4)) || 0; }); wrap(P, 'texSubImage2D', () => { C.glTex++; });
    wrap(P, 'readPixels', () => { C.glRead++; }); wrap(P, 'clear', () => { C.glClear++; }); wrap(P, 'useProgram', () => { C.glProg++; });
    for (const [nm, kc, km] of [['compileShader', 'glCompile', 'glCompileMs'], ['linkProgram', 'glLink', 'glLinkMs']]) { const o = P[nm]; P[nm] = function () { const t = now(); const r = o.apply(this, arguments); /* (the driver may defer: the status query forces it) */ try { if (nm === 'compileShader') this.getShaderParameter(arguments[0], this.COMPILE_STATUS); else this.getProgramParameter(arguments[0], this.LINK_STATUS); } catch (e) {} C[kc]++; C[km] += now() - t; (C.compiles = C.compiles || []).push([nm, +(now() - t).toFixed(1), C.on ? 'frame' : 'load']); return r; }; } }
  /* (v440 SQ) a WebGL canvas with new content since it was last laid (any draw or clear on its context) */
  for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const P = G.prototype; for (const nm of ['drawArrays', 'drawElements', 'clear']) { const o = P[nm]; P[nm] = function () { if (this.canvas) this.canvas.__pfDirty = 1; return o.apply(this, arguments); }; } }
}

async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: o.dpr || 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (/Failed to load resource/.test(m.text())) return; if (m.type() === 'error' || (m.type() === 'warning' && /GFX|GLM|shader/i.test(m.text()))) errors.push('console: ' + m.text().slice(0, 200)); });
  page.setDefaultTimeout(1800000);
  await page.addInitScript(install);
  // the GPU paths a real GPU takes, forced on the software rasteriser
  await page.addInitScript(gpu => { if (gpu) for (const f of ['__NG_GL', '__TTN_GL', '__DS_GL', '__BELK_GL', '__ULD_GL', '__NHALU_GL', '__VARKUL_GL', '__GLM_WARM']) window[f] = 1; }, o.gpu !== false);
  // (v434 PO) Rift 03's GPU bosses too (Sarrukh, Oneira, Thul-Ammon), at a phone's full resolution (HQ: not the software rasteriser's 0.45x; HQ=0 keeps 0.45x)
  await page.addInitScript(([gpu, hq]) => { if (gpu) { window.__SAR_GL = 1; window.__DB_GL = 1; if (hq) { window.__SAR_GLHQ = 1; window.__DB_GLHQ = 1; } } }, [o.gpu !== false, process.env.HQ !== '0']);
  if (o.flags) await page.addInitScript(f => Object.assign(window, f), o.flags);
  if (process.env.SP_OFF === '1') await page.addInitScript(() => { window.__SP_OFF = 1; });   // (v439 SP: any test run with v438's behaviour)   // (v439 SP: extra window flags, e.g. the Animas' GPU paths)
  if (o.init) for (const f of [].concat(o.init)) await page.addInitScript(f);         // (v439 SP: extra init scripts, e.g. GL counters)
  await page.goto('file://' + path.resolve(__dirname, '..', o.html || process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 900000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 30; P.st.unlockAll = true; P.st.dun.best = 120; P.openMap(); P.dun.setMapTab('rift', true); });
  const RIFT = o.rift || process.env.RIFT || 'belfry';   // (v434 PO: any rift; RIFT=dunes for Rift 03)
  const start = async stage => { await page.evaluate(([stage, rift]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; try { P.riftState().prog[rift] = stage; } catch (e) {} P.openMap(); P.dun.setMapTab('rift', true); P.startRift(rift, stage); }, [stage, RIFT]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    // the arcade's loop stopped: the frames are driven by hand from here (the same steps as arcFrame)
    await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(4242); }); };
  /* n frames of dt each; prof: the engine's per-piece times (each piece synced); returns per-frame rows */
  const frames = (n, opt) => page.evaluate(async ([n, opt]) => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), cv = c.canvas, C = window.__PFC;
    const NM = self.NIDHOGG_MOVES, F = NM && NM.FGFX;
    /* (the FGFX passes: count, time, quads, draw calls, composites; the area its triangles cover, the GPU's fill, in layer px) */
    if (F && !F.__pf) { const b0 = F.begin, fl = F.flush; let Qc = null; F.begin = function () { Qc = b0.apply(this, arguments); return Qc; };
      const tri = (A, n) => { let s = 0; for (let o = 0; o + 36 <= n * 12; o += 36) s += Math.abs((A[o + 12] - A[o]) * (A[o + 25] - A[o + 1]) - (A[o + 13] - A[o + 1]) * (A[o + 24] - A[o])) / 2; return s; };
      F.flush = function (cc) { if (!C.on) return fl.apply(this, arguments); if (Qc) C.fgFill += tri(Qc.lit, Qc.nl) + tri(Qc.smk, Qc.ns) + tri(Qc.wlit, Qc.nwl) + tri(Qc.wsmk, Qc.nws);
        /* (v434 PO) fgFillV: the fill the GPU really shades: each triangle cut to the layer, and to Q.clipTo's rectangles when the pass has them */
        if (Qc && !window.__PF_NOFILLV /* (v460 R3: off, so the heap counter sees the game's allocations only) */) { const RS = Qc.rl && Qc.rl.length && window.__PO_OFF !== 1 ? Qc.rl : [0, 0, Qc.W, Qc.Hh]; const clip = (P, R) => { for (const [ax, lim, sg] of [[0, R[0], 1], [0, R[2], -1], [1, R[1], 1], [1, R[3], -1]]) { const o = []; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], ip = (p[ax] - lim) * sg >= 0, iq = (q[ax] - lim) * sg >= 0; if (ip) o.push(p); if (ip !== iq) { const t = (lim - p[ax]) / (q[ax] - p[ax]); o.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } } P = o; if (!P.length) return 0; } let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
          for (const [A, n] of [[Qc.lit, Qc.nl], [Qc.smk, Qc.ns], [Qc.wlit, Qc.nwl], [Qc.wsmk, Qc.nws]]) for (let o = 0; o + 36 <= n * 12; o += 36) { const T3 = [[A[o], A[o + 1]], [A[o + 12], A[o + 13]], [A[o + 24], A[o + 25]]]; for (let r = 0; r < RS.length; r += 4) C.fgFillV += clip(T3, [RS[r], RS[r + 1], RS[r + 2], RS[r + 3]]); } }
        const s = F.stats, f0 = s.frames, d0 = C.diGL, t = performance.now(); const r = fl.apply(this, arguments); C.fgMs += performance.now() - t; C.fgFlush++; if (s.frames !== f0) { C.fgQuads += s.quads; C.fgSmoke += s.smoke; C.fgDraws += s.draws; } C.fgComp += C.diGL - d0; if (s.frames !== f0) C.fgLayers += s.comp || 0; /* (v434 PO: layers laid, each one copy of the GL canvas) */ return r; }; F.__pf = 1; }
    if (opt.off != null) window.__PF_OFF = opt.off;
    const rows = [], mem = () => (performance.memory ? performance.memory.usedJSHeapSize : 0), sync = () => c.getImageData(0, 0, 1, 1);
    for (let i = 0; i < n; i++) {
      if (opt.hold) opt.hold.forEach(f => (0, eval)(f));
      if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; }
      /* (v434 PO) extra counters: window.__PFX() returns { name: number } (a picture cache's paints, misses, ...): per-frame deltas as x_<name> */
      const X0 = window.__PFX ? window.__PFX() : null;
      sync(); C.z(); C.on = true; D.g.prof = opt.prof ? {} : null; const h0 = mem();
      const t0 = performance.now(); A.t += opt.dt; G.update(opt.dt); const t1 = performance.now();
      c.save(); G.draw(c); c.restore(); if (F && F.frameEnd) F.frameEnd(); /* v440 SQ: the arcade's frame end (the run of merged passes laid) */ const t2 = performance.now(); if (P.retro) P.retro.post(cv, c); sync(); const t3 = performance.now();
      C.on = false; const pr = D.g.prof || {}; D.g.prof = null;
      const r = { upd: t1 - t0, draw: t2 - t1, post: t3 - t2, tot: t3 - t0, heap: mem() - h0, pr };
      for (const k in C) if (typeof C[k] === 'number') r[k] = C[k];
      r.parts = D.parts ? D.parts.length : 0; r.fx = D.ELEM ? D.ELEM.fx.length : 0; r.mons = D.mons.filter(m => !m.dead).length;
      if (X0) { const X1 = window.__PFX(); for (const k in X1) r['x_' + k] = (X1[k] || 0) - (X0[k] || 0); }   /* (v434 PO) */
      rows.push(r);
    }
    return { rows, cv: [cv.width, cv.height], compiles: (C.compiles || []).filter(x => x[2] === 'frame') };
  }, [n, Object.assign({ dt: 1 / 60, prof: true }, opt || {})]);
  return { browser, page, errors, start, frames };
}

/* a summary of frame rows: mean, worst, p99, and the means of every counter and piece */
function summ(rows) {
  const s = {}, n = rows.length, keys = new Set(); rows.forEach(r => Object.keys(r).forEach(k => typeof r[k] === 'number' && keys.add(k)));
  for (const k of keys) s[k] = rows.reduce((a, r) => a + (r[k] || 0), 0) / n;
  const tt = rows.map(r => r.tot).sort((a, b) => a - b); s.worst = tt[n - 1]; s.p99 = tt[Math.min(n - 1, Math.floor(n * 0.99))]; s.med = tt[n >> 1];
  s.pr = {}; rows.forEach(r => { for (const k in r.pr) s.pr[k] = (s.pr[k] || 0) + r.pr[k] / n; });
  s.heapPos = rows.reduce((a, r) => a + Math.max(0, r.heap), 0) / n; s.n = n;
  return s;
}
module.exports = { open, summ };
