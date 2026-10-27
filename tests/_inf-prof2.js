// Bahamut's frame, rasterised section by section, as medians over many draws. usage: node tests/_inf-prof2.js [n=30]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const NI = +(process.argv[2] || 30);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(120, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  await page.evaluate(() => { window.__pp.arc.paused = true; const G = window.__pp.arc.game, D = G._dbg; for (let i = 0; i < 60 * 8; i++) { G.update(1 / 60); D.me.x = D.FD.FX.C.x; D.me.y = D.FD.FX.C.y + 8.5; } });
  const r = await page.evaluate((NI) => {
    const A = window.__pp.arc, G = A.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, c = A.ctx || document.querySelector('#arcCanvas').getContext('2d'), Q = window.__pp.DunFiend.KIT.Q, out = {};
    const m = D.g.boss, X = FD.FX.sx(m.x), Y = FD.FX.sy(m.y);
    const med = a => { const b = a.slice().sort((x, y) => x - y); return +b[Math.floor(b.length / 2)].toFixed(2); };
    [2, 1, 0].forEach(q0 => { const q = q0; Q.pin = q; const rec = {}; for (let i = 0; i < NI + 3; i++) { M.prof = { _flush: true }; c.getImageData(0, 0, 1, 1); const t0 = performance.now(); FD.drawBoss(c, m, X, Y); c.getImageData(0, 0, 1, 1); const all = performance.now() - t0; if (i < 3) continue; (rec.all = rec.all || []).push(all); Object.keys(M.prof).filter(k => k[0] !== '_').forEach(k => (rec[k] = rec[k] || []).push(M.prof[k])); }
      const o = {}; Object.keys(rec).forEach(k => { o[k] = med(rec[k]); }); out['q' + q0] = o; });
    // the whole frame, as the game draws it
    Q.pin = null; const rf = []; for (let i = 0; i < NI; i++) { const t0 = performance.now(); G.draw(c); c.getImageData(0, 0, 1, 1); rf.push(performance.now() - t0); } out.frame = med(rf);
    M.prof = null; return out;
  }, NI);
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
