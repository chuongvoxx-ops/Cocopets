// What a Super Fiend's own painting would cost without each kind of drawing call: the fiend painted live into a canvas
// like the screen (flushed once a paint, medians over repeats), whole and then with one kind of call skipped at a time.
// usage: node tests/_paint-ablate.js floor [cut] [reps]   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl0 = +(process.argv[2] || 10), cut = +(process.argv[3] || 1), reps = +(process.argv[4] || 9);
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
  const r = await page.evaluate(([cut, reps]) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, run = window.__run;
    const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; } };
    step(5); const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(5); }
    const sc = document.getElementById('arcCanvas'), c0 = sc.getContext('2d');
    for (let i = 0; i < 6; i++) { run(1 / 60); c0.save(); G.draw(c0); c0.restore(); }
    const cv = document.createElement('canvas'); cv.width = sc.width; cv.height = sc.height; const g = cv.getContext('2d'), k = P.arc.dpr, fl = () => g.getImageData(0, 0, 1, 1);
    const Pr = CanvasRenderingContext2D.prototype, orig = { fill: Pr.fill, stroke: Pr.stroke, drawImage: Pr.drawImage, fillRect: Pr.fillRect, clip: Pr.clip };
    const isGlow = img => img && img.width === 64 && img.height === 64;
    const skips = {
      none: null,
      glowSprites: (n, ctx, a) => n === 'drawImage' && isGlow(a[0]),
      allImages: (n, ctx, a) => n === 'drawImage',
      lighter: (n, ctx) => ctx.globalCompositeOperation === 'lighter',
      gradFills: (n, ctx) => (n === 'fill' || n === 'fillRect') && !(typeof ctx.fillStyle === 'string'),
      colFills: (n, ctx) => (n === 'fill' || n === 'fillRect') && typeof ctx.fillStyle === 'string' && ctx.globalCompositeOperation === 'source-over',
      strokes: n => n === 'stroke',
      clips: n => n === 'clip',
    };
    const T = FD.FX.Tz(), X = FD.FX.sx(m.x), Y = FD.FX.sy(m.y), KQ = P.DunFiend.KIT.Q, live0 = KQ.live; KQ.live = true;
    const out = {};
    const once = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(k, 0, 0, k, 0, 0); fl(); const t0 = performance.now(); FD.drawBoss(g, m, X, Y); fl(); return performance.now() - t0; };
    const order = Object.keys(skips);
    // interleaved, so drift in the machine falls alike on every variant
    const acc = {}; order.forEach(n => { acc[n] = []; });
    for (let rep = 0; rep < reps; rep++) for (const nm of order) {
      const sk = skips[nm]; if (sk) for (const n of Object.keys(orig)) Pr[n] = function (...a) { if (this === g && sk(n, this, a)) { if (n === 'clip') return orig[n].apply(this, a); return; } return orig[n].apply(this, a); };
      if (nm === 'clips') Pr.clip = function () {};   // (a skipped clip draws everything it held, so this is only a hint)
      try { acc[nm].push(once()); } finally { Object.assign(Pr, orig); }
    }
    KQ.live = live0;
    const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
    order.forEach(n => { out[n] = +med(acc[n]).toFixed(1); });
    return { T: +T.toFixed(1), out };
  }, [cut, reps]);
  const base = r.out.none; console.log(`floor ${fl0}  T ${r.T}  whole paint ${base} ms`);
  for (const [n, v] of Object.entries(r.out)) if (n !== 'none') console.log(`  without ${n.padEnd(12)} ${String(v).padStart(6)} ms  (${(base - v >= 0 ? '-' : '+') + Math.abs(base - v).toFixed(1)})`);
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
