// Photographs normal Tower floors at the same moment of the same seeded game, so two builds can be compared picture by
// picture: the bot plays a few seconds by hand-stepped frames, then the frame is drawn and photographed; then the floor's
// boss is woken and fought a little and photographed too.
// usage: node tests/dun-shots.js tag [floors] [secs]   env: HTML, RNG   → shots/dun-<tag>-<floor>-{a,b}.jpg
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const tag = process.argv[2] || 'now', floors = (process.argv[3] || '3,14,22,38,51,63,102,114,118').split(',').map(Number), secs = +(process.argv[4] || 5);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  const seedJS = `(r => { let a = r >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })`;
  await page.addInitScript(`${seedJS}(${+(process.env.RNG || 12345)})`);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(([n, js, r]) => { eval(js)((r + n * 7919) >>> 0); window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, [fl, seedJS, +(process.env.RNG || 12345)]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const play = async (frames, boss) => page.evaluate(([frames, boss]) => {
      // (the game is held still between frames stepped here, so the photograph shows exactly the frame drawn last)
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, g = D.g, me = D.me, run = window.__run, c = document.getElementById('arcCanvas').getContext('2d'); G.update = () => {};
      if (!boss) { let a = (4242 + D.F.k * 7919) >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
      const W = A.W, H = A.H, tapW = (wx, wy) => { const X = Math.max(10, Math.min(W - 10, (wx - me.x) * 40 * g.zoom + W / 2)), Y = Math.max(10, Math.min(H - 10, (wy - me.y) * 40 * g.zoom + H / 2)); G.down(X, Y, 77); G.up(X, Y, 77); };
      const steer = (tx, ty, keep) => { const d = Math.hypot(tx - me.x, ty - me.y), sv = d > keep ? D.steerTo(tx, ty) : null, hx = 72, hy = H - 100; if (!sv) { if (D.stick.id === 88) G.up(hx, hy, 88); return; } if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + sv[0] * 44, hy + sv[1] * 44, 88); };
      let lastTap = -9;
      if (boss) D.wakeBoss();
      for (let i = 0; i < frames; i++) {
        let best = null, bd = 1e9; for (const m of D.mons) { if (m.dead || (!boss && m.act === 'sleep') || (boss && !m.boss)) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } }
        if (best) { steer(best.x, best.y, best.boss ? 3.2 : 2.2); if (g.t - lastTap > 0.26) { lastTap = g.t; tapW(best.x, best.y); } if (me.mp >= D.KIT.ult.cost && g.cdU <= 0) D.useUlt(); }
        me.hp = D.ST.hp; run(1 / 60); if (A.state !== 'play') break; c.save(); G.draw(c); c.restore();
      }
      return A.state;
    }, [frames, boss]);
    await play(Math.round(secs * 60), false);
    await page.screenshot({ path: path.resolve(__dirname, `../shots/dun-${tag}-${fl}-a.jpg`), quality: 82 });
    await play(150, true);
    await page.screenshot({ path: path.resolve(__dirname, `../shots/dun-${tag}-${fl}-b.jpg`), quality: 82 });
    console.log(fl, 'shot');
    await page.evaluate(() => { const G = window.__pp.arc.game; if (G && window.__run) G.update = window.__run; window.__run = null; window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(200);
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
