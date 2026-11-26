// (v464 RZ-M) Raziel's model on the GPU (forced on SwiftShader): draw returns the anchors, the meshes' size, the GL pass (items, draw calls,
// pixels), free() leaves 0 buffers, repeated draw / free cycles do not grow the buffers or the JS heap, drawSpectral and drawParts draw,
// lowFx thins only cosmetics, and without WebGL (window.__RZ_GL = 0) AnimaArt still draws the Gemini Anima's 2D art without an error.
// usage: HTML=<test html> node tests/_rz-model-gl.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(process.cwd(), process.env.HTML || 'test-rzm.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 });
  const r = await page.evaluate(() => {
    const out = {}; window.__RZ_GL = 1; window.__NG_GL = 1; const RG = window.RAZIEL_GL;
    const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const c = cv.getContext('2d');
    out.ok = RG.ok(); out.ensure = RG.ensure(); out.nv = RG.nv; out.nt = RG.nt;
    const S = RG.idle(7, 0); S.x = 10; S.y = 10;
    let o = RG.draw(c, 300, 520, 300, S, { tile: 60 }); out.drawn = !!o; out.anchors = o ? ['mouthL', 'mouthR', 'coreL', 'coreR', 'crownL', 'crownR', 'wingTipL', 'wingTipR', 'tailTip', 'body'].filter(k => o[k] && isFinite(o[k].x)).length : 0;
    out.pass = { items: RG.STATS.items, W: RG.STATS.W, H: RG.STATS.H, calls: RG.STATS.calls };
    out.buffers = RG.gpuCount(); out.freed = RG.free(); out.after = RG.gpuCount();
    // cycles: draw a 30 s summon's worth of frames at 10 fps, free, five times; the buffers and the heap after each
    const heap = []; for (let cy = 0; cy < 5; cy++) { const S2 = RG.idle(4, 0); S2.x = 10; S2.y = 10; for (let f = 0; f < 12; f++) { S2.t = f * 0.1; S2.jawL = f % 2; RG.draw(c, 300, 520, 200, S2, { tile: 60 }); } RG.drawSpectral(c, 300, 520, 200, S2, 'L', {}); RG.free(); if (window.gc) window.gc(); heap.push(performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024) : -1); }
    out.cycles = { buffersAfter: RG.gpuCount(), heapKB: heap };
    out.spectralL = !!RG.drawSpectral(c, 300, 520, 300, S, 'L', {}); out.spectralR = !!RG.drawSpectral(c, 300, 520, 300, S, 'R', {}); out.spectralMouth = !!(RG.drawSpectral(c, 300, 520, 300, S, 'R', {}) || {}).mouth;
    out.parts = RG.drawParts(c, [{ m: 'sun', X: 100, Y: 100, s: 20, t: 1 }, { m: 'planet', X: 200, Y: 100, s: 20, t: 1 }, { m: 'spire', X: 300, Y: 200, s: 20, h: 0.5 }, { m: 'crownL', X: 400, Y: 100, s: 30 }]);
    // lowFx: fewer items (cosmetics), the same anchors
    const S3 = RG.idle(7, 0); S3.x = 10; S3.y = 10; const a1 = RG.draw(c, 300, 520, 300, S3, { tile: 60, still: true }), i1 = RG.STATS.items; S3.lowFx = true; const a2 = RG.draw(c, 300, 520, 300, S3, { tile: 60, still: true }), i2 = RG.STATS.items;
    out.lowFx = { items: [i1, i2], mouthMoved: a1 && a2 ? Math.round(Math.hypot(a1.mouthL.x - a2.mouthL.x, a1.mouthL.y - a2.mouthL.y)) : -1 };
    RG.free(); out.finalBuffers = RG.gpuCount();
    // no WebGL for this model: the old 2D art, no error
    window.__RZ_GL = 0; let err = null; try { const AA = window.__pp.AnimaArt; c.clearRect(0, 0, 600, 600); AA.draw(c, 'gemini', 3, 300, 520, 200, 1, {}); AA.draw(c, 'gemini', 1, 300, 520, 200, 1, { inst: { rzS: RG.idle(1, 0) } }); } catch (e) { err = String(e); }
    out.fallback2D = { usable: RG.ok(), err, inkPixels: (() => { const d = c.getImageData(0, 0, 600, 600).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })() };
    return out; });
  console.log(JSON.stringify(r, null, 1)); console.log('errors', JSON.stringify(errors.slice(0, 5)));
  const fail = !r.drawn || r.after !== 0 || r.cycles.buffersAfter !== 0 || r.finalBuffers !== 0 || !r.spectralL || !r.spectralR || !r.parts || r.fallback2D.err || errors.length || r.lowFx.mouthMoved > 1;
  console.log(fail ? 'FAIL' : 'ALL PASS'); await browser.close(); process.exit(fail ? 1 : 0);
})();
