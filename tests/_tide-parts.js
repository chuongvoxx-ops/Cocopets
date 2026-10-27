// The tide's soft band drawn several ways at radius 8 on floor 100's canvas: what each costs. env HTML, PIN, CAP
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => { window.__pp.dun.startDungeon(100, 7); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, run = window.__run; for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
    const FD = D.FD, FX = FD.FX, C = FX.C, c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
    for (let i = 0; i < 300; i++) run(1 / 60); c.save(); G.draw(c); c.restore();
    const T = FX.Tz(), N = 30, tr = c.getTransform(), X = FX.sx(C.x), Y = FX.sy(C.y), r = 8 * T, w = 1.3 * T, g0 = 0.5 - 0.55, g1 = 0.5 + 0.55, r0 = r - w * 0.68, r1 = r + w * 0.68;
    const time = (fn) => { fl(); const t0 = performance.now(); for (let i = 0; i < N; i++) { c.save(); c.setTransform(tr); fn(i); c.restore(); } fl(); return +((performance.now() - t0) / N).toFixed(2); };
    const grad = () => { const gr = c.createRadialGradient(X, Y, r0, X, Y, r1); [[0, 0], [0.14, 0.14], [0.34, 0.34], [0.58, 0.46], [0.76, 0.5], [0.84, 0.78], [0.92, 0.22], [1, 0]].forEach(([u, a]) => gr.addColorStop(u, `rgba(185,140,255,${a})`)); return gr; };
    const band = () => { c.beginPath(); c.arc(X, Y, r1, g1, g0 + Math.PI * 2); c.arc(X, Y, r0, g0 + Math.PI * 2, g1, true); c.closePath(); };
    const grad0 = () => { const gr = c.createRadialGradient(X, Y, 0, X, Y, r1), f = r0 / r1; gr.addColorStop(0, 'rgba(185,140,255,0)'); [[0, 0], [0.14, 0.14], [0.34, 0.34], [0.58, 0.46], [0.76, 0.5], [0.84, 0.78], [0.92, 0.22], [1, 0]].forEach(([u, a]) => gr.addColorStop(f + (1 - f) * u, `rgba(185,140,255,${a})`)); return gr; };
    const gradSm = () => { const gr = c.createRadialGradient(X, Y, r0, X, Y, r1); gr.addColorStop(0, 'rgba(185,140,255,0)'); gr.addColorStop(1, 'rgba(185,140,255,.5)'); return gr; };
    const ST = [[0, 0], [0.14, 0.14], [0.34, 0.34], [0.58, 0.46], [0.76, 0.5], [0.84, 0.78], [0.92, 0.22], [1, 0]];
    const pieces = () => { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < ST.length - 1; i++) { const a = r0 + (r1 - r0) * ST[i][0], b = r0 + (r1 - r0) * ST[i + 1][0], gr = c.createRadialGradient(X, Y, a, X, Y, b); gr.addColorStop(0, `rgba(185,140,255,${ST[i][1]})`); gr.addColorStop(1, `rgba(185,140,255,${ST[i + 1][1]})`); c.beginPath(); c.arc(X, Y, b, g1, g0 + Math.PI * 2); c.arc(X, Y, a, g0 + Math.PI * 2, g1, true); c.closePath(); c.fillStyle = gr; c.fill(); } };
    const sectors = n => () => { c.globalCompositeOperation = 'lighter'; const gr = grad(), a0 = g1, span = (g0 + Math.PI * 2) - g1; c.fillStyle = gr; for (let i = 0; i < n; i++) { const a = a0 + span * i / n, b = a0 + span * (i + 1) / n; c.beginPath(); c.arc(X, Y, r1, a, b); c.arc(X, Y, r0, b, a, true); c.closePath(); c.fill(); } };
    const lieA = (dash, gap) => () => { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.setLineDash([T * dash, T * gap]); c.lineDashOffset = 3; c.strokeStyle = 'rgba(185,140,255,.5)'; c.lineWidth = 2; for (const rr of [r - w * 0.45, r + w * 0.45]) { c.beginPath(); c.arc(X, Y, rr, g1, g0 + Math.PI * 2); c.stroke(); } };
    const lieM = () => { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = 'rgba(185,140,255,.5)'; c.lineWidth = 2; c.beginPath(); for (const rr of [r - w * 0.45, r + w * 0.45]) { const per = T * 0.8 / rr, on = T * 0.45 / rr, a1 = g0 + Math.PI * 2; for (let a = g1; a < a1; a += per) { c.moveTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); c.arc(X, Y, rr, a, Math.min(a1, a + on)); } } c.stroke(); };
    const lieL = () => { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = 'rgba(185,140,255,.5)'; c.lineWidth = 2; c.beginPath(); for (const rr of [r - w * 0.45, r + w * 0.45]) { const per = T * 0.8 / rr, on = T * 0.45 / rr, a1 = g0 + Math.PI * 2; for (let a = g1; a < a1; a += per) { const b = Math.min(a1, a + on); c.moveTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); c.lineTo(X + Math.cos((a + b) / 2) * rr, Y + Math.sin((a + b) / 2) * rr); c.lineTo(X + Math.cos(b) * rr, Y + Math.sin(b) * rr); } } c.stroke(); };
    return {
      lieDash: time(lieA(0.45, 0.35)), lieManualArcs: time(lieM), lieManualLines: time(lieL),
      sec8: time(sectors(8)), sec16: time(sectors(16)), sec32: time(sectors(32)), sec1: time(sectors(1)),
      pieces7: time(pieces),
      grad0Lighter: time(() => { c.globalCompositeOperation = 'lighter'; band(); c.fillStyle = grad0(); c.fill(); }),
      grad2stopLighter: time(() => { c.globalCompositeOperation = 'lighter'; band(); c.fillStyle = gradSm(); c.fill(); }),
      gradLighter: time(() => { c.globalCompositeOperation = 'lighter'; band(); c.fillStyle = grad(); c.fill(); }),
      gradOver: time(() => { band(); c.fillStyle = grad(); c.fill(); }),
      solidLighter: time(() => { c.globalCompositeOperation = 'lighter'; band(); c.fillStyle = 'rgba(185,140,255,.3)'; c.fill(); }),
      solidOver: time(() => { band(); c.fillStyle = 'rgba(185,140,255,.3)'; c.fill(); }),
      gradStroke: time(() => { c.globalCompositeOperation = 'lighter'; c.beginPath(); c.arc(X, Y, r, g1, g0 + Math.PI * 2); c.lineWidth = w * 1.36; c.strokeStyle = grad(); c.stroke(); }),
      // the band as many thin solid rings, of the gradient's alpha at their radius
      rings24: time(() => { c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 24; k++) { const u = (k + 0.5) / 24; c.beginPath(); c.arc(X, Y, r0 + (r1 - r0) * u, g1, g0 + Math.PI * 2); c.lineWidth = (r1 - r0) / 24 + 0.5; c.strokeStyle = 'rgba(185,140,255,.3)'; c.stroke(); } }),
    };
  });
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
