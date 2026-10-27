// Where a Super Fiend's own painting goes: one paint of the fiend into a canvas the size of the view, every drawing call
// flushed and timed on its own, summed by kind (method, fill kind, blend) and by the line that made it.
// usage: node tests/_paint-prof.js floor [cut] [top]   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl0 = +(process.argv[2] || 10), cut = +(process.argv[3] || 1), top = +(process.argv[4] || 18);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 777);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl0);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 1200 && !D.g.boss; i++) window.__run(1 / 60); });
  const r = await page.evaluate(([cut, top]) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = window.__run;
    const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; } };
    step(5); const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(5); }
    // draw a few whole frames first, as the game does (pictures, tiles and sprites made)
    const sc = document.getElementById('arcCanvas'), c0 = sc.getContext('2d');
    for (let i = 0; i < 6; i++) { run(1 / 60); c0.save(); G.draw(c0); c0.restore(); }
    // the fiend painted live into a canvas like the screen, at the screen's scale
    const cv = document.createElement('canvas'); cv.width = sc.width; cv.height = sc.height; const g = cv.getContext('2d'), k = P.arc.dpr;
    const fl = () => g.getImageData(0, 0, 1, 1);
    // what a flush costs with nothing to flush (taken off every timed call)
    let ov = 0; { const a = []; for (let i = 0; i < 60; i++) { fl(); const t0 = performance.now(); fl(); a.push(performance.now() - t0); } a.sort((x, y) => x - y); ov = a[a.length >> 1]; }
    const Pr = CanvasRenderingContext2D.prototype, names = ['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText', 'strokeText', 'clip', 'clearRect', 'putImageData'];
    const orig = {}; names.forEach(n => { orig[n] = Pr[n]; });
    const byKind = {}, bySite = {}; let tot = 0, calls = 0;
    const kindOf = (ctx, n, args) => { const fs = n.startsWith('stroke') ? ctx.strokeStyle : ctx.fillStyle, st = typeof fs === 'string' ? 'col' : fs instanceof CanvasGradient ? 'grad' : fs instanceof CanvasPattern ? 'pat' : '?';
      const tr = ctx.getTransform(), sk = Math.abs(tr.b) > 1e-6 || Math.abs(tr.c) > 1e-6 ? 'skew' : 'axis';
      let extra = ''; if (n === 'drawImage') { const img = args[0], dw = args.length >= 5 ? args[args.length - 2] : img.width, dh = args.length >= 5 ? args[args.length - 1] : img.height, sw = args.length === 9 ? args[3] : img.width; extra = ` ${Math.abs(dw * tr.a / sw - 1) < 0.01 ? '1:1' : 'scaled'} ${img.width}x${img.height}`; }
      return `${n}${n === 'drawImage' || n === 'clip' || n === 'clearRect' ? '' : ' ' + st} ${ctx.globalCompositeOperation}${extra} ${sk}`; };
    const siteOf = () => { const s = (new Error().stack || '').split('\n'); const L = s.slice(3, 6).map(x => { const m2 = x.match(/at (\S+) .*:(\d+):\d+\)?$/) || x.match(/:(\d+):\d+$/); return m2 ? (m2[2] ? m2[1] + ':' + m2[2] : 'L' + m2[1]) : x.trim().slice(0, 40); }); return L.join(' < '); };
    names.forEach(n => { Pr[n] = function (...a) { if (this !== g) return orig[n].apply(this, a); fl(); const kd = kindOf(this, n, a), site = siteOf(); const t0 = performance.now(); const res = orig[n].apply(this, a); fl(); const dt = Math.max(0, performance.now() - t0 - ov); tot += dt; calls++;
      (byKind[kd] = byKind[kd] || [0, 0]); byKind[kd][0] += dt; byKind[kd][1]++; (bySite[site] = bySite[site] || [0, 0]); bySite[site][0] += dt; bySite[site][1]++; return res; }; });
    const T = FD.FX.Tz(), X = FD.FX.sx(m.x), Y = FD.FX.sy(m.y), Dd = FD.S.D || null;
    // the engine's own boss draw, with no picture kept, onto the test canvas
    const KQ = P.DunFiend.KIT.Q, live0 = KQ.live; KQ.live = true;
    let err = null;
    const runs = [];
    for (let rep = 0; rep < 2; rep++) {
      for (const n of Object.keys(byKind)) delete byKind[n]; for (const n of Object.keys(bySite)) delete bySite[n]; tot = 0; calls = 0;
      g.setTransform(1, 0, 0, 1, 0, 0); orig.clearRect.call(g, 0, 0, cv.width, cv.height);
      g.setTransform(k, 0, 0, k, 0, 0); fl(); const t0 = performance.now();
      try { FD.drawBoss(g, m, X, Y); } catch (e) { err = e.message + ' ' + (e.stack || '').split('\n')[1]; }
      fl(); runs.push(performance.now() - t0);
    }
    KQ.live = live0; names.forEach(n => { Pr[n] = orig[n]; });
    const srt = o => Object.entries(o).sort((a, b) => b[1][0] - a[1][0]).slice(0, top).map(([k2, v]) => `${v[0].toFixed(2).padStart(7)} ms ${String(v[1]).padStart(4)}×  ${k2}`);
    return { ov: +ov.toFixed(3), T: +T.toFixed(1), k, wall: runs.map(x => +x.toFixed(1)), tot: +tot.toFixed(1), calls, err, kinds: srt(byKind), sites: srt(bySite) };
  }, [cut, top]);
  console.log(`floor ${fl0}  T ${r.T} k ${r.k}  flush ${r.ov} ms (taken off each call)  paint (unflushed wall) ${r.wall.join('/')} ms  timed sum ${r.tot} ms over ${r.calls} calls  ${r.err || ''}`);
  console.log('-- by kind'); r.kinds.forEach(l => console.log(l)); console.log('-- by site'); r.sites.forEach(l => console.log(l));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
