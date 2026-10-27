// Leo (Michael)'s Astral Awakening, the Judgement of the Sun, against a Super Fiend: its column of sunlight should take
// three of the fiend's health bars (the attack itself adding a little), measured on a few fiends.
// usage: node tests/leo-sun.js [floors] [k]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '10,90,120').split(',').map(Number), K = +(process.argv[3] || 3);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], fails = [];
  for (const floor of floors) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
    page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
    await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
    await page.evaluate(K => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.animas.have.leo = K; P.st.animas.eq = 'leo'; P.openMap(); P.dun.setMapTab('dungeon', true); }, K);
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const G = window.__pp.arc.game, D = G._dbg, me = D.me, m = D.g.boss, FD = D.FD, AN = D.AN;
      for (let i = 0; i < 60 * 6; i++) { G.update(1 / 60); me.hp = D.ST.hp; }
      me.x = m.x; me.y = m.y + 5; AN.S.gauge = 1; AN.S.used = false; const ok = AN.summon();
      for (let i = 0; i < 60 * 6; i++) { G.update(1 / 60); me.hp = D.ST.hp; m.hp = Math.max(m.hp, m.maxhp * 0.9); }
      const a = AN.S.list[0]; const hp0 = m.hp; if (a) a.life = 0;
      let lowest = hp0;
      for (let i = 0; i < 60 * 5; i++) { G.update(1 / 60); me.hp = D.ST.hp; lowest = Math.min(lowest, m.hp); }
      const took = hp0 - lowest;
      return { ok, fiend: FD.S.D && FD.S.D.id, bars: FD.S.bars, barHP: Math.round(FD.barHP), took: Math.round(took), tookBars: +(took / FD.barHP).toFixed(2), state: a && a.st };
    });
    console.log(floor, JSON.stringify(r));
    if (!r.ok) fails.push(floor + ': Leo did not answer the summons');
    else if (!(r.tookBars >= 2.9 && r.tookBars <= 3.6)) fails.push(`${floor}: the Judgement of the Sun took ${r.tookBars} bars, wanted about 3`);
    await page.close();
  }
  if (errors.length) fails.push('page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(fails.length ? 'leo-sun FAIL\n - ' + fails.join('\n - ') : 'leo-sun OK');
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
