// (v475 GM) Gabriel's model on the GPU (SwiftShader): every form draws in each mesh set, the shader compiles (no GL warnings),
// drawSpectral / drawParts / drawAnima draw, lowFx thins only cosmetics, free() leaves 0 buffers, repeated draw / free cycles do not
// grow the buffers or the meshes, the 2D fallback draws without WebGL. Costs per pass (SwiftShader: counts are real, times are not).
// usage: HTML=<test html> node tests/_gm-gl.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text().slice(0, 600)); });
  await page.goto('file://' + path.resolve(process.cwd(), process.env.HTML || 'test-gm.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  const r = await page.evaluate(() => {
    window.__GB_GL = 1; const G = window.GABRIEL_GL, out = { fails: [] }, ok = (c, m) => { if (!c) out.fails.push(m); };
    const cv = document.createElement('canvas'); cv.width = 390; cv.height = 844; document.body.appendChild(cv); const c = cv.getContext('2d');
    ok(G.usable(), 'usable'); G.ensure(true); G.ensure(false); out.tris = { full: G.nt, lod: G.ntL };
    const cost = (ev, o, S0) => { const S = Object.assign(G.idle(ev, 1), S0 || {}); c.clearRect(0, 0, 390, 844); const t0 = performance.now(), a = G.draw(c, 195, 600, 146, S, Object.assign({ tile: 47, still: true }, o)); return { ok: !!a, lod: a && a.lod, items: G.STATS.items, batches: G.STATS.batches, tris: G.STATS.tris, calls: G.STATS.calls, passes: G.STATS.passes, W: G.STATS.W, H: G.STATS.H, ms: Math.round(performance.now() - t0) }; };
    out.l1lod = cost(1, { lod: true }); out.l7lod = cost(7, { lod: true }); out.l7full = cost(7, { full: true });
    out.l7lodUlt = cost(7, { lod: true }, { heartOpen: 1, heartSplit: 1, restraintsOpen: 1, orRise: 1, crownOpen: 1, wingShape: 'ult', wing: 1 });
    // far petals: a second pass, the body's box unchanged
    const P = []; for (let i = 0; i < 12; i++) P.push(i < 4 ? { free: 1, x: -3 + i * 2, y: 3, z: 0.5, ang: 1.5 } : { free: 0 }); out.far = cost(7, { lod: true }, { petals: P }); ok(out.far.passes === 2, 'far petals -> 2 passes (' + out.far.passes + ')');
    // lowFx: fewer cosmetic parts, the same anatomy
    window.__pp.quickStart('Bot'); window.__pp.st.lowFx = true; out.l7low = cost(7, { lod: true }); window.__pp.st.lowFx = false; ok(out.l7low.tris < out.l7lod.tris, 'lowFx thins');
    // spectral, parts, drawAnima (collection), lights
    const Ssp = G.idle(7, 1); ok(!!G.drawSpectral(c, 195, 600, 300, Ssp, { still: true }), 'spectral');
    ok(G.drawParts(c, [{ m: 'heart', X: 100, Y: 100, s: 20 }, { m: 'heartBig', X: 200, Y: 200, s: 8 }, { m: 'petal', X: 300, Y: 100, s: 15, o: 1 }, { m: 'lotus', X: 100, Y: 300, s: 20 }, { m: 'lily', X: 200, Y: 300, s: 20 }, { m: 'ring', X: 300, Y: 300, s: 30 }, { m: 'feather', X: 300, Y: 400, s: 20 }]), 'drawParts');
    window.__pp.AnimaArt.draw(c, 'virgo', 3, 195, 700, 200, 1, {}); const inst = { gbS: G.idle(4, 1) }; window.__pp.AnimaArt.draw(c, 'virgo', 2, 195, 700, 200, 1, { inst }); ok(inst.gbOut && inst.gbOut.heart, 'drawAnima writes gbOut');
    // free: 0 buffers; three draw / free cycles: the same counts each time
    const counts = []; for (let i = 0; i < 3; i++) { cost(7, { lod: true }); cost(1, { full: true }); counts.push(G.gpuCount()); G.free(); counts.push(G.gpuCount()); }
    out.cycles = counts; ok(counts[1] === 0 && counts[3] === 0 && counts[5] === 0, 'free -> 0'); ok(counts[2] <= counts[0] && counts[4] === counts[2], 'no growth');
    // the 2D fallback without WebGL
    window.__GB_GL = 0; ok(!G.usable(), 'off'); let e2 = null; try { window.__pp.AnimaArt.draw(c, 'virgo', 3, 195, 700, 200, 1, {}); window.__pp.AnimaArt.draw(c, 'virgo', 1, 195, 700, 200, 1, { inst: { gbS: Object.assign(G.idle(1, 1), { heartOpen: 1, orRise: 1 }) } }); } catch (e) { e2 = String(e); } ok(!e2, '2D fallback ' + e2);
    ok(!!G.solve(195, 600, 146, G.idle(7, 1), { tile: 47 }), 'solve without GL'); window.__GB_GL = 1;
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  const errs = errors.filter(e => !/GPU stall|TUNNEL|swiftshader|SwiftShader|WebGL/.test(e) || /Gabriel GL|GLM shader/.test(e));
  console.log('errors', JSON.stringify(errs.slice(0, 6)));
  const bad = r.fails.length + errs.length; console.log(bad ? 'FAILED ' + bad : 'all ok');
  await browser.close(); process.exit(bad ? 1 : 0);
})();
