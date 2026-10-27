// What a frame costs on each Super Fiend floor, phase by phase, and where it goes: the sky, the arena's ground picture,
// its overlay, hazards and telegraphs, the fiend, its objects and props, its effects, its HUD, and everything else.
// Every piece is timed with the canvas flushed around it, so its rasterising is counted. usage: node tests/fiend-cost.js [floors]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '10,20,30,40,50,60,70,80,90,100,110,120').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const all = {};
  for (const fl of floors) {
    const phases = await page.evaluate(n => { const P = window.__pp, F = P.FIENDS[(n / 10 - 1) % 12]; return { id: F.id, cuts: F.cuts || [1, 0.66, 0.33] }; }, fl);
    all[fl] = { id: phases.id };
    for (let ph = 0; ph < phases.cuts.length; ph++) {
      await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
      await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
      await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
      const r = await page.evaluate(([cut, id]) => {
        const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update, Dp = P.FIEND_DEFS[id]; G.update = () => {};
        const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; } };
        step(5); const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(5); }
        me.x = C.x; me.y = C.y + 5; step(0.6);
        const c = document.querySelector('canvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), acc = {}, un = [];
        const wrap = (o, k, tag) => { const f = o && o[k]; if (typeof f !== 'function') return; o[k] = function () { fl(); const t0 = performance.now(); try { return f.apply(this, arguments); } finally { fl(); acc[tag] = (acc[tag] || 0) + performance.now() - t0; } }; un.push(() => { o[k] = f; }); };
        // the def's sky and overlay run inside drawArena: they are taken out of it below
        wrap(Dp, 'sky', 'sky'); wrap(Dp, 'overlay', 'overlay');
        wrap(FD, 'drawArena', 'arena'); wrap(FD, 'drawGround', 'ground'); wrap(FD, 'drawBoss', 'boss'); wrap(FD, 'drawObj', 'objs'); wrap(FD, 'drawProp', 'props'); wrap(FD, 'drawFx', 'fx'); wrap(FD, 'drawHud', 'hud');
        const N = 30; for (let i = 0; i < 4; i++) { run(1 / 60); G.draw(c); } Object.keys(acc).forEach(k => delete acc[k]);
        const t0 = performance.now(); for (let i = 0; i < N; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; G.draw(c); fl(); } const frame = (performance.now() - t0) / N;
        un.forEach(f => f()); G.update = run;
        const per = {}; Object.keys(acc).forEach(k => { per[k] = +(acc[k] / N).toFixed(1); });
        if (per.arena != null) per.arenaOwn = +(per.arena - (per.sky || 0) - (per.overlay || 0)).toFixed(1);
        const tracked = ['arena', 'ground', 'boss', 'objs', 'props', 'fx', 'hud'].reduce((a, k) => a + (per[k] || 0), 0);
        return { phase: FD.S.phase, frame: +frame.toFixed(1), rest: +(frame - tracked).toFixed(1), per };
      }, [phases.cuts[ph], phases.id]);
      all[fl]['p' + (ph + 1)] = r;
      console.log(fl, phases.id, 'phase', r.phase, JSON.stringify(r));
      await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
    }
  }
  require('fs').writeFileSync(path.resolve(__dirname, '../bat/fiend-cost.json'), JSON.stringify(all, null, 1));
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
