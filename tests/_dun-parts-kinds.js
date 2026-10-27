// What the particles on a normal floor are, by kind, during the bot's fight. usage: node tests/_dun-parts-kinds.js [floor] [secs]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 14), secs = +(process.argv[3] || 8);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate((secs) => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, g = D.g, me = D.me, run = G.update; G.update = () => {};
    const W = A.W, H = A.H, tapW = (wx, wy) => { const X = Math.max(10, Math.min(W - 10, (wx - me.x) * 40 * g.zoom + W / 2)), Y = Math.max(10, Math.min(H - 10, (wy - me.y) * 40 * g.zoom + H / 2)); G.down(X, Y, 77); G.up(X, Y, 77); };
    const steer = (tx, ty, keep) => { const d = Math.hypot(tx - me.x, ty - me.y), sv = d > keep ? D.steerTo(tx, ty) : null, hx = 72, hy = H - 100; if (!sv) { if (D.stick.id === 88) G.up(hx, hy, 88); return; } if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + sv[0] * 44, hy + sv[1] * 44, 88); };
    let lastTap = -9; const kinds = {}, vis = {}; let n = 0;
    for (let i = 0; i < secs * 60; i++) {
      let best = null, bd = 1e9; for (const m of D.mons) { if (m.dead || m.act === 'sleep') continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } }
      if (best) { steer(best.x, best.y, 2.2); if (g.t - lastTap > 0.26) { lastTap = g.t; tapW(best.x, best.y); } ['strong', 'strong2', 'strong3'].forEach((k, j) => { const ab = D.KIT[k], cd = g[['cdS', 'cdS2', 'cdS3'][j]]; if (ab && me.mp > ab.cost && cd <= 0 && bd < 5) D.useStrong(k); }); if (me.mp >= D.KIT.ult.cost && g.cdU <= 0) D.useUlt(); }
      me.hp = D.ST.hp; run(1 / 60);
      if (i % 10 === 0) { n++; const vx = W / 2 / (40 * g.zoom) + 1, vy = H / 2 / (40 * g.zoom) + 1; for (const p of D.parts) { kinds[p.kind] = (kinds[p.kind] || 0) + 1; if (Math.abs(p.x - me.x) < vx && Math.abs(p.y - me.y) < vy) vis[p.kind] = (vis[p.kind] || 0) + 1; } }
    }
    G.update = run; const o = {}; for (const k in kinds) o[k] = [+(kinds[k] / n).toFixed(1), +((vis[k] || 0) / n).toFixed(1)]; return o;
  }, secs);
  console.log(fl, JSON.stringify(Object.entries(r).sort((a, b) => b[1][0] - a[1][0])));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
