// Photographs every Super Fiend arena in its first and last phase, the pet a little below the centre.
// usage: node tests/fiend-gallery.js <tag> [floors]   → shots/<tag>-<floor>-p<phase>.jpg
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const tag = process.argv[2] || 'gal', floors = (process.argv[3] || '10,20,30,40,50,60,70,80,90,100,110,120').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const PH = (process.env.PH || 'first,last').split(',');
  for (const fl of floors) {
    const info = await page.evaluate(n => { const P = window.__pp, F = P.FIENDS[(n / 10 - 1) % 12]; return { id: F.id, cuts: F.cuts || [1, 0.66, 0.33] }; }, fl);
    const want = PH.map(p => p === 'first' ? 0 : p === 'last' ? info.cuts.length - 1 : +p - 1);
    for (const ph of [...new Set(want)]) {
      await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
      await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
      await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
      const r = await page.evaluate(([cut]) => {
        const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update; G.update = () => {};
        const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; } };
        step(5); const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(5); }
        me.x = C.x; me.y = C.y + 5; step(1.2);
        G.draw(document.querySelector('canvas').getContext('2d'));
        window.__hold = () => { G.update = run; };
        return { phase: FD.S.phase };
      }, [info.cuts[ph]]);
      await page.screenshot({ path: path.resolve(__dirname, `../shots/${tag}-${fl}-p${r.phase}.jpg`), quality: 80 });
      console.log(fl, info.id, 'phase', r.phase);
      await page.evaluate(() => { window.__hold && window.__hold(); window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
    }
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
