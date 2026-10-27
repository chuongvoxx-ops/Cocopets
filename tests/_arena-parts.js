// What the arena layer's pieces cost on a fiend floor: the sky paint, the sky blit, the ground blit, the overlay.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '120').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
    await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update; G.update = () => {};
      for (let i = 0; i < 300; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } me.x = C.x; me.y = C.y + 5; for (let i = 0; i < 30; i++) run(1 / 60);
      const c = document.querySelector('canvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), N = 30, S = FD.S, A = P.arc;
      G.draw(c); fl();
      const W = A.W, H = A.H, cam = D.g.cam || {}, T = FD.FX.Tz();
      const time = f => { f(); fl(); const t0 = performance.now(); for (let i = 0; i < N; i++) { f(); fl(); } return +((performance.now() - t0) / N).toFixed(2); };
      const out = { T: +T.toFixed(1), arenaPx: S.arenaCv && S.arenaCv.width, skyPx: S.skyCv && [S.skyCv.width, S.skyCv.height], dpr: A.dpr };
      const R = C.R + 1.5, X = FD.FX.sx(C.x - R), Y = FD.FX.sy(C.y - R), s = R * 2 * T; out.dest = [Math.round(X), Math.round(Y), Math.round(s)];
      out.groundBlit = time(() => c.drawImage(S.arenaCv, X, Y, s, s));
      out.skyBlit = time(() => c.drawImage(S.skyCv, 0, 0, S.skyCv.width, S.skyCv.height, 0, 0, W, H));
      const sc = S.skyCv, c2 = sc.getContext('2d'), k = sc.width / W;
      out.skyPaint = time(() => { c2.setTransform(k, 0, 0, k, 0, 0); c2.fillStyle = '#05030A'; c2.fillRect(0, 0, W, H); FD.FX.def; });
      out.skyPaintAndBlit = time(() => { c2.setTransform(k, 0, 0, k, 0, 0); c2.fillStyle = '#05030A'; c2.fillRect(0, 0, W, H); c2.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(sc, 0, 0, sc.width, sc.height, 0, 0, W, H); });
      out.drawArena = time(() => FD.drawArena(c, W, H, cam, T, D.g.t));
      // a copy of the ground at the screen's own resolution
      const cv2 = document.createElement('canvas'); cv2.width = Math.ceil(s * A.dpr / 2); cv2.height = cv2.width; cv2.getContext('2d').drawImage(S.arenaCv, 0, 0, cv2.width, cv2.height);
      out.groundBlitHalf = time(() => c.drawImage(cv2, X, Y, s, s));
      const cv3 = document.createElement('canvas'); cv3.width = Math.ceil(s * A.dpr); cv3.height = cv3.width; cv3.getContext('2d').drawImage(S.arenaCv, 0, 0, cv3.width, cv3.height);
      out.groundBlit1x = time(() => c.drawImage(cv3, X, Y, s, s));
      // only the part on screen, from a screen-sized crop
      G.update = run; return out;
    });
    console.log(fl, JSON.stringify(r));
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
