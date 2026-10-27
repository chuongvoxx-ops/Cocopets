// What a frame of the Pale Intellect fight costs, phase by phase, and where it goes (the brain, the lie, the obelisks,
// the air, the arena and sky, everything else). usage: node tests/pale-perf.js [q]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const qPin = process.argv[2] == null ? 2 : +process.argv[2];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const out = {};
  for (const [name, hp, hold] of [['phase1', 1, 0], ['phase2', 0.69, 4.5], ['phase3', 0.34, 4.5]]) {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), 100);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(q => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = q; }, qPin);
    await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
    const r = await page.evaluate(([hp, hold]) => {
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C; const run = G.update; G.update = () => {};
      const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } };
      step(5); const m = D.g.boss; if (hp < 1) { m.hp = m.maxhp * hp; step(hold); }
      me.x = C.x; me.y = C.y + 6; step(0.5);
      const c = document.querySelector('canvas').getContext('2d'), Dp = P.FIEND_DEFS.pale, acc = {};
      // every piece is timed with the canvas flushed before and after it, so its rasterising is counted, not just its calls
      const fl = () => c.getImageData(0, 0, 1, 1);
      const wrap = (o, k, tag) => { const f = o[k]; if (typeof f !== 'function') return () => {}; o[k] = function () { fl(); const t0 = performance.now(); try { return f.apply(this, arguments); } finally { fl(); acc[tag] = (acc[tag] || 0) + performance.now() - t0; } }; return () => { o[k] = f; }; };
      const un = [wrap(Dp, 'draw', 'brain'), wrap(Dp, 'drawProp', 'props'), wrap(Dp, 'drawFx', 'air'), wrap(Dp, 'drawArena', 'arena'), wrap(Dp, 'paintGround', 'ground'), wrap(Dp, 'sky', 'sky'), wrap(Dp, 'overlay', 'floorFx')];
      const N = 30; G.draw(c); Object.keys(acc).forEach(k => delete acc[k]);
      const PR = Dp._prof; PR.acc = {}; PR.on = 0;
      const live = v => { if (M.B) M.B.live = v; if (M.F) M.F.live = v; };
      const timeN = () => { const t0 = performance.now(); for (let i = 0; i < N; i++) { run(1 / 60); G.draw(c); fl(); } return (performance.now() - t0) / N; };
      live(true); const liveT = timeN(); live(false); const tot = timeN(); live(true); const liveT2 = timeN(); live(false); const tot2 = timeN(); live(false);
      // the frame with no brain and no props at all: what the arena and everything else cost
      const keep = [Dp.draw, Dp.drawProp, Dp.drawFx]; Dp.draw = () => {}; Dp.drawProp = () => {}; const bare = timeN(); Dp.drawFx = () => {}; const bare2 = timeN(); [Dp.draw, Dp.drawProp, Dp.drawFx] = keep;
      // the brain's own pieces, timed in a second pass
      PR.on = 1; for (let i = 0; i < N; i++) { run(1 / 60); G.draw(c); } PR.on = 0; const bp = {}; Object.keys(PR.acc).forEach(k => { bp[k] = +(PR.acc[k] / N).toFixed(2); });
      un.forEach(f => f());
      // the update alone
      const t1 = performance.now(); for (let i = 0; i < N; i++) run(1 / 60); const upd = (performance.now() - t1) / N;
      G.update = run;
      const per = {}; Object.keys(acc).forEach(k => { per[k] = +(acc[k] / N).toFixed(2); });
      return { phase: FD.S.phase, lie: !!M.F, frame: +((tot + tot2) / 2).toFixed(2), frameLive: +((liveT + liveT2) / 2).toFixed(2), noBrainNoProps: +bare.toFixed(2), noAir: +bare2.toFixed(2), update: +upd.toFixed(2), brainParts: bp };
    }, [hp, hold]);
    out[name] = r; console.log(name, JSON.stringify(r));
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(200);
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
