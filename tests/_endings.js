// Every Super Fiend struck down: its last phase reached, a killing blow dealt, the ending played out with frames drawn
// through it. Reports whether the fight was won and any page errors. usage: node tests/_endings.js [floors]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '10,20,30,40,50,60,70,80,90,100,110,120').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    const e0 = errors.length;
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
    await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, run = G.update, c = document.querySelector('canvas').getContext('2d'); G.update = () => {};
      const step = (s, drawEvery) => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; if (drawEvery && i % drawEvery === 0) G.draw(c); } };
      step(4, 10); let m = D.g.boss; m.hp = m.maxhp * 0.05; step(5, 10);
      // the killing blow, struck again for a few frames in case it was shielded at that instant
      let tries = 0; while (!D.g.won && tries < 240) { m = D.g.boss; if (m && !m.dead) FD.FX.H.hitMon(m, m.hp * 3 + 1e7, {}); run(1 / 60); me.hp = D.ST.hp; if (tries % 6 === 0) G.draw(c); tries++; if (FD.FX.mem.end || (m && m.dead)) break; }
      step(12, 6);
      G.update = run; return { phase: FD.S.phase, won: !!D.g.won, end: !!(FD.FX.mem.end), state: P.arc.state, tries };
    });
    console.log(fl, JSON.stringify(r), 'errors', errors.length - e0, errors.slice(e0, e0 + 2));
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
