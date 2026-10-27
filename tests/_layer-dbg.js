const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl0 = +(process.argv[2] || 120);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl0);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update, K = P.DunFiend.KIT; G.update = () => {};
    for (let i = 0; i < 300; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; }
    const c = document.querySelector('canvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
    K.LAYERS.forEach(L => { L.n = 0; });
    const zs = [], ts = [], acc = {}; const wrap = (o, k) => { const f = o[k]; o[k] = function () { fl(); const t0 = performance.now(); try { return f.apply(this, arguments); } finally { fl(); (acc[k] = acc[k] || []).push(performance.now() - t0); } }; };
    ['drawArena', 'drawGround', 'drawBoss', 'drawFx', 'drawHud', 'drawObj'].forEach(k => wrap(FD, k));
    for (let i = 0; i < 60; i++) { const a = i * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); M.gap = 99; me.hp = D.ST.hp; fl(); const t0 = performance.now(); G.draw(c); fl(); ts.push(+(performance.now() - t0).toFixed(1)); zs.push(+FD.FX.Tz().toFixed(3)); }
    const per = {}; Object.keys(acc).forEach(k => { if (acc[k].length === 60) per[k] = acc[k].map(v => +v.toFixed(1)).join(' '); });
    const out = { per }; K.LAYERS.forEach((L, k) => { out[k] = { n: L.n, why: L.why, sig: L.sig, w: L.w, h: L.h, cv: [L.cv.width, L.cv.height] }; });
    const med = a => { const b = a.slice().sort((x, y) => x - y); return +b[b.length >> 1].toFixed(2); }; const parts = {}; Object.keys(acc).forEach(k => { parts[k] = { med: med(acc[k]), n: acc[k].length }; });
    G.update = run; return { layers: out, parts, T: [...new Set(zs)].slice(0, 6), ts: ts.join(' ') };
  });
  console.log(JSON.stringify(r, null, 1));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
