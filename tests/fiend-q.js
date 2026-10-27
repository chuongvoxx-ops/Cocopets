// The flushed frame on a floor at each fiend quality, and with pieces taken away: the boss, the screen overlay, the
// sky, the props. Works on normal floors too (they have no fiend). usage: node tests/fiend-q.js floors [cut]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '120').split(',').map(Number), cut = +(process.argv[3] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => { window.__pp.beginPlay(); });
    const fiend = fl % 10 === 0;
    if (fiend) await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
    const r = await page.evaluate(([cut, fiend]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, me = D.me, run = G.update, Q = P.DunFiend.KIT.Q; G.update = () => {};
      const M = FD ? FD.FX.mem : null;
      const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; } };
      Q.pin = 2; step(5);
      if (fiend) { const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(5); } const C = FD.FX.C; me.x = C.x; me.y = C.y + 5; step(0.6); }
      const c = document.querySelector('canvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), N = 24;
      const timeN = () => { for (let i = 0; i < 3; i++) { run(1 / 60); G.draw(c); } fl(); const t0 = performance.now(); for (let i = 0; i < N; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; G.draw(c); fl(); } return +((performance.now() - t0) / N).toFixed(1); };
      const out = { phase: FD ? FD.S.phase : 0 };
      out.q2 = timeN(); Q.pin = 1; out.q1 = timeN(); Q.pin = 0; out.q0 = timeN(); Q.pin = 2;
      D.SKIP.overlay = true; D.SKIP.light = true; out.noOverlay = timeN(); D.SKIP.overlay = false; D.SKIP.light = false;
      if (FD) { const Dp = P.FIEND_DEFS[FD.FX.def ? FD.FX.def.id : '']; }
      if (FD) { const keep = FD.drawBoss; FD.drawBoss = () => {}; out.noBoss = timeN(); FD.drawBoss = keep;
        const kp = FD.drawProp; FD.drawProp = () => {}; out.noProps = timeN(); FD.drawProp = kp;
        const ka = FD.drawArena; FD.drawArena = (c2, W, H) => { c2.fillStyle = '#000'; c2.fillRect(0, 0, W, H); }; out.noArena = timeN(); FD.drawArena = ka; }
      // a bare frame: just a clear
      const t0 = performance.now(); for (let i = 0; i < N; i++) { c.fillStyle = '#123'; c.fillRect(0, 0, 400, 900); fl(); } out.clear = +((performance.now() - t0) / N).toFixed(1);
      const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; const t1 = performance.now(); for (let i = 0; i < N; i++) { c.drawImage(cv, 0, 0, 390, 844); fl(); } out.blit = +((performance.now() - t1) / N).toFixed(1);
      Q.pin = null; G.update = run; return out;
    }, [cut, fiend]);
    console.log(fl, JSON.stringify(r));
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
