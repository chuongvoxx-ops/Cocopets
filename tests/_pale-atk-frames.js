// Frames on floor 100 while one attack runs (forced, the pet circling), against the same stretch with no attack: so a new
// attack's own drawing shows. usage: node tests/_pale-atk-frames.js   env: HTML, PIN, CAP
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 4242);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const [lv, name, cyc] of [[2, 'none', -1], [2, 'twinTides', 1], [2, 'racing', 4], [2, 'falseAwakening', 0], [3, 'none', -1], [3, 'watchers', 2], [3, 'collapse', 3]]) {
    await page.evaluate(cap => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(100, 7); }, +(process.env.CAP || 0));
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const r = await page.evaluate(([lv, cyc]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, c = document.getElementById('arcCanvas').getContext('2d'), run = window.__run, fl = () => c.getImageData(0, 0, 1, 1);
      for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
      const FD = D.FD, FX = FD.FX, M = FX.mem, m = D.g.boss, me = D.me, C = FX.C;
      for (let i = 0; i < 300; i++) { run(1 / 60); me.hp = D.ST.hp; M.gap = 99; }
      m.hp = m.maxhp * (lv === 2 ? 0.66 : 0.31); for (let i = 0; i < 420; i++) { run(1 / 60); me.hp = D.ST.hp; M.gap = 99; }
      let a = 0; const frame = () => { a += 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); me.hp = D.ST.hp; };
      for (let i = 0; i < 40; i++) { frame(); M.gap = 99; c.save(); G.draw(c); c.restore(); }
      if (cyc >= 0) { M.job = null; M.lieFirst = false; M.sigCd = 99; M.nameCd = 99; M.cyc = cyc; M.gap = 0; } else M.gap = 99;
      const rec = []; let name = null;
      for (let i = 0; i < 180; i++) { frame(); if (cyc < 0) M.gap = 99; if (M.job && !name) name = M.job.name; if (name && !M.job) M.gap = 99; fl(); const t0 = performance.now(); c.save(); G.draw(c); c.restore(); fl(); rec.push(performance.now() - t0); }
      const b = rec.slice().sort((x, y) => x - y);
      return { lv: FD.S.lv, job: name, med: +b[b.length >> 1].toFixed(1), p90: +b[Math.floor(b.length * 0.9)].toFixed(1), max: +b[b.length - 1].toFixed(1), mean: +(rec.reduce((s, v) => s + v, 0) / rec.length).toFixed(1) };
    }, [lv, cyc]);
    console.log(`stage ${r.lv} ${String(r.job || 'none').padEnd(15)} median ${r.med}  p90 ${r.p90}  max ${r.max}  mean ${r.mean}`);
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__run; window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
