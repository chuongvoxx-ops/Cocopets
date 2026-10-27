// How much of painting Bahamut is the page's own work (its geometry worked out, every drawing call made) and how much is
// the canvas filling pixels: the whole colossus painted live (nothing kept) onto the screen's canvas, and the same onto a
// canvas one pixel across, where the calls are made but nearly nothing is filled. usage: node tests/_bh-js.js   env: HTML, PIN, CAP
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 12345);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(cap => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(120, 7); }, +(process.env.CAP || 0));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = window.__run, K = P.DunFiend.KIT;
    for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
    const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } }; step(5);
    const scr = document.getElementById('arcCanvas'), c = scr.getContext('2d'), tiny = document.createElement('canvas'); tiny.width = scr.width; tiny.height = scr.height; const t1 = tiny.getContext('2d');
    for (let i = 0; i < 70; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; c.save(); G.draw(c); c.restore(); }
    const m = D.g.boss, X = FD.FX.sx(m.x), Y = FD.FX.sy(m.y), T = FD.FX.Tz(), def = P.FIEND_DEFS.bahamut, tr = c.getTransform();
    // (the other canvas is the screen's size, so the same parts are culled, but everything is clipped to one pixel of it)
    const paint = (g) => { g.save(); g.setTransform(tr); if (g === t1) { g.beginPath(); g.rect(-tr.e / tr.a, -tr.f / tr.d, 1 / tr.a, 1 / tr.d); g.clip(); } def.draw(g, FD.FX, m, X, Y, T, D.g.t); g.restore(); };
    const fl = g => g.getImageData(0, 0, 1, 1);
    const time = (g, n) => { K.Q.live = true; let tot = 0; for (let i = 0; i < n; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; fl(g); const t0 = performance.now(); paint(g); fl(g); tot += performance.now() - t0; } K.Q.live = false; return tot / n; };
    const out = { full: [], tiny: [] };
    for (let rd = 0; rd < 4; rd++) { out.full.push(time(c, 30)); out.tiny.push(time(t1, 30)); }
    const avg = a => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
    return { full: avg(out.full), tiny: avg(out.tiny), dpr: P.arc.dpr };
  });
  console.log(`Bahamut painted whole, live, at ${r.dpr}x: ${r.full} ms; the same calls onto a canvas clipped to one pixel: ${r.tiny} ms (the page's own share ${Math.round(r.tiny / r.full * 100)}%)`);
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
