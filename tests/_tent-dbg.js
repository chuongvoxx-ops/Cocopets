// debug: which nerves lie near a screen point in the phase 2 'rest' frame of _pale-px (same steps), and how close they come
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const PX = +(process.argv[2] || 219), PY = +(process.argv[3] || 306.5);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 777);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const phase of [1, 2]) {
    await page.evaluate(() => { window.__pp.dun.startDungeon(100, 7); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; let a = 4242; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, 2);
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const got = await page.evaluate(([phase, PX, PY]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, run = window.__run; for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
      const FD = D.FD, FX = FD.FX, M = FX.mem, me = D.me, C = FX.C, m = D.g.boss, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), TN = P.FiendToon;
      const frame = (draw) => { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; me.x = C.x + 1; me.y = C.y + 5; if (draw) { c.save(); G.draw(c); c.restore(); } };
      for (let i = 0; i < 300; i++) frame(i > 240); if (phase > 1) { m.hp = m.maxhp * ([1, 0.66, 0.31][phase - 1]); for (let i = 0; i < 400; i++) frame(i > 340); }
      for (let i = 0; i < 60; i++) frame(true);
      const rec = []; const f1 = TN.tubesLite, f2 = TN.tubeLite, fr = TN.ribbon;
      TN.tubesLite = function (c2, list, o) { rec.push({ kind: "batch", n: list.length, w0: list[0].wf(0), lw: o.lw, pts: list.map(e => e.pts.map(p => [+p[0].toFixed(1), +p[1].toFixed(1)])) }); return f1.apply(this, arguments); };
      TN.tubeLite = function (c2, pts) { rec.push({ kind: 'one', near: Math.min(...pts.map(p => Math.hypot(p[0] - PX, p[1] - PY))) }); return f2.apply(this, arguments); };
      frame(true); TN.tubesLite = f1; TN.tubeLite = f2;
      return { phase: FD.S.phase, rec };
    }, [phase, PX, PY]);
    console.log(JSON.stringify(got));
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__run; window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
