// The same frames drawn two ways, the order turned about each round (A B B A) so neither is always first after the
// game's step: usage node tests/_ab-skip.js floor secs rounds   env: V='{"name":{SKIP flags}}' (two variants), HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 14), secs = +(process.argv[3] || 3), rounds = +(process.argv[4] || 40);
  const V = JSON.parse(process.env.V || '{"A":{},"B":{"fogDirect":1}}'), names = Object.keys(V);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 12345);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => { window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, fl);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
  // (the game is held still from here on, so the steps it takes are only the probe's own, and every run plays alike)
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(([secs, rounds, V, names]) => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, g = D.g, me = D.me, run = window.__run, c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1); G.update = () => {};
    { let a = (4242 + D.F.k * 7919) >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    const W = A.W, H = A.H, tapW = (wx, wy) => { const X = Math.max(10, Math.min(W - 10, (wx - me.x) * 40 * g.zoom + W / 2)), Y = Math.max(10, Math.min(H - 10, (wy - me.y) * 40 * g.zoom + H / 2)); G.down(X, Y, 77); G.up(X, Y, 77); };
    const steer = (tx, ty, keep) => { const d = Math.hypot(tx - me.x, ty - me.y), sv = d > keep ? D.steerTo(tx, ty) : null, hx = 72, hy = H - 100; if (!sv) { if (D.stick.id === 88) G.up(hx, hy, 88); return; } if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + sv[0] * 44, hy + sv[1] * 44, 88); };
    let lastTap = -9;
    const bot = () => { let best = null, bd = 1e9; for (const m of D.mons) { if (m.dead || m.act === 'sleep') continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } } if (!best) return; steer(best.x, best.y, 2.2); if (g.t - lastTap > 0.26) { lastTap = g.t; tapW(best.x, best.y); } };
    for (let i = 0; i < secs * 60; i++) { bot(); me.hp = D.ST.hp; run(1 / 60); if (i % 2 === 0) { c.save(); G.draw(c); c.restore(); } }
    const rec = {}; names.forEach(n => rec[n] = []);
    const one = n => { Object.keys(D.SKIP).forEach(x => delete D.SKIP[x]); Object.assign(D.SKIP, V[n]); fl(); const t0 = performance.now(); c.save(); G.draw(c); c.restore(); fl(); rec[n].push(performance.now() - t0); };
    for (let k = 0; k < rounds; k++) { bot(); me.hp = D.ST.hp; run(1 / 60); const order = k % 2 ? names.slice().reverse() : names; c.save(); G.draw(c); c.restore(); order.forEach(one); }
    Object.keys(D.SKIP).forEach(x => delete D.SKIP[x]); G.update = run;
    const med = a => { const b = a.slice().sort((x, y) => x - y); return +b[b.length >> 1].toFixed(2); };
    const out = {}; names.forEach(n => out[n] = med(rec[n])); return out;
  }, [secs, rounds, V, names]);
  console.log(fl, JSON.stringify(r), 'errors', errors.length);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
