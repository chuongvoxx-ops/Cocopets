// A normal floor's frame by the dungeon's own pieces, like _fiend-prof.js does for a fiend's: the pet walking a little loop,
// 90 frames averaged after 70 drawn to settle. usage: node tests/_floor-prof.js floors   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '22,38').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 2468);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 120; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(n => { window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, fl);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); });
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const r = await page.evaluate(() => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g, me = D.me, c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1); const x0 = me.x, y0 = me.y;
      const stepDraw = i => { const a = i * 0.04; me.x = x0 + Math.sin(a) * 1.5; me.y = y0 + (1 - Math.cos(a)) * 0.8; window.__run(1 / 60); me.hp = D.ST.hp; };
      for (let i = 0; i < 70; i++) { stepDraw(i); c.save(); G.draw(c); c.restore(); }
      g.prof = {}; let tot = 0; const N = 90;
      for (let i = 0; i < N; i++) { stepDraw(70 + i); fl(); const t0 = performance.now(); c.save(); G.draw(c); c.restore(); fl(); tot += performance.now() - t0; }
      const out = {}; for (const k in g.prof) out[k] = +(g.prof[k] / N).toFixed(2); g.prof = null;
      return { frame: +(tot / N).toFixed(1), out };
    });
    console.log(`${fl}  frame ${r.frame} ms  |  ${Object.entries(r.out).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${v}`).join('  ')}`);
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
