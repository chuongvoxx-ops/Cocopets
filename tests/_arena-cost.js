// The ground of a Super Fiend floor, piece by piece: the sky copied whole, the arena's picture laid down as the game lays
// it (and whether that copy is exact), and the fiend's overlay, each flushed and timed. usage: node tests/_arena-cost.js floors
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '10,70,100').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(([n, cap]) => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(n, 7); }, [fl, +(process.env.CAP || 0)]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 1200 && !D.g.boss; i++) window.__run(1 / 60); for (let i = 0; i < 300; i++) window.__run(1 / 60); });
    const r = await page.evaluate(() => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, S = FD.S, FX = FD.FX, C = FX.C, c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
      for (let i = 0; i < 10; i++) { window.__run(1 / 60); c.save(); G.draw(c); c.restore(); }
      const med = a => { const b = a.slice().sort((x, y) => x - y); return +b[b.length >> 1].toFixed(2); }, time = f => { const a = []; for (let i = 0; i < 15; i++) { fl(); const t0 = performance.now(); f(); fl(); a.push(performance.now() - t0); } return med(a); };
      const k = P.arc.dpr, T = FX.Tz(), R = C.R + 1.5, x = FX.sx(C.x - R), y = FX.sy(C.y - R), kk = S.arenaP / T;
      const base = () => { c.setTransform(k, 0, 0, k, 0, 0); };
      const sky = time(() => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(S.skyFull || S.arenaCv, 0, 0); c.restore(); });
      const arenaGame = time(() => { base(); P.DunFiend.KIT.blit1(c, S.arenaCv, x, y, kk); });
      const arenaWhole = time(() => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(S.arenaCv, Math.round(x * k), Math.round(y * k)); c.restore(); });
      const clear = time(() => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#05030A'; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); });
      const whole = time(() => { base(); FD.drawArena(c, P.arc.W, P.arc.H, null, T, D.g.t); });
      return { k, T: +T.toFixed(2), arenaP: S.arenaP, exact: Math.abs(k - kk) <= kk * 0.003, arenaPx: S.arenaCv.width + 'x' + S.arenaCv.height, sky: !!S.skyFull, skyPx: S.skyFull ? S.skyFull.width + 'x' + S.skyFull.height : '-', t: { sky, arenaGame, arenaWhole, clear, whole } };
    });
    console.log(fl, JSON.stringify(r));
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
