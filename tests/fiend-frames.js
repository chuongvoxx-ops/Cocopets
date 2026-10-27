// The frame as the game draws it on each Super Fiend floor and phase: every frame flushed and timed on its own, after a
// warm-up, reported as the median and the 90th percentile (spikes show there). With HTML=other.html for an A/B.
// usage: node tests/fiend-frames.js [floors] [phases: first,last or all]   → bat/fiend-frames-<tag>.json (TAG env)
// (drawn on the game's own canvas, as the arcade draws it; the game held still from the start and the dice seeded, so two
// builds play alike; 'cpu' is what the page spends issuing a frame, before the drawing is finished)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '10,20,30,40,50,60,70,80,90,100,110,120').split(',').map(Number), which = process.argv[3] || 'all';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 12345);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const all = {};
  for (const fl of floors) {
    const info = await page.evaluate(n => { const P = window.__pp, F = P.FIENDS[(n / 10 - 1) % 12]; return { id: F.id, cuts: F.cuts || [1, 0.66, 0.33] }; }, fl);
    const phs = which === 'all' ? info.cuts.map((_, i) => i) : /^[1-9]$/.test(which) ? [+which - 1] : which === 'first' ? [0] : which === 'last' ? [info.cuts.length - 1] : [0, info.cuts.length - 1];
    all[fl] = { id: info.id };
    for (const ph of phs) {
      await page.evaluate(([n, cap]) => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(n, 7); }, [fl, +(process.env.CAP || 0)]);
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
      await page.evaluate(([n, pin]) => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; let a = (777 + n * 7919) >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, [fl, +(process.env.PIN || 2)]);
      await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 1200 && !D.g.boss; i++) window.__run(1 / 60); });
      const r = await page.evaluate(([cut, ev, NF]) => {
        const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = window.__run; G.update = () => {};
        // (EV=1.5: as on a device that keeps missing frames, its pictures repainted less often)
        if (ev && P.DunFiend.KIT.stretch) P.DunFiend.KIT.Q.ev = ev;
        const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; } };
        step(5); const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(5); }
        // the pet circles a little below the centre so the camera moves as it does in a fight
        const c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), rec = [], cpu = [];
        // a second of the fight drawn first, as the game draws it: the pictures it keeps (the arena at the settled zoom
        // among them, made once the zoom has held) are made before anything is timed
        for (let i = 0; i < 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; c.save(); G.draw(c); c.restore(); }
        // (one frame in five timed without the flush, the others whole: five, prime to both two and three, so pictures
        // painted every other frame or every third fall alike into the frames timed whole: with one in three, a fiend that
        // repaints every third frame had one of its three frames, always the same one, left out of the timing)
        for (let i = 0; i < NF; i++) { const a = i * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; const nf = i % 5 === 2; fl(); const t0 = performance.now(); c.save(); G.draw(c); c.restore(); if (!nf) fl(); const t1 = performance.now(); if (nf) fl(); if (i >= 24) (nf ? cpu : rec).push(t1 - t0); }
        G.update = run; const b = rec.slice().sort((x, y) => x - y), cb = cpu.slice().sort((x, y) => x - y);
        return { phase: FD.S.phase, med: +b[b.length >> 1].toFixed(1), p90: +b[Math.floor(b.length * 0.9)].toFixed(1), mean: +(rec.reduce((a, v) => a + v, 0) / rec.length).toFixed(1), cpu: +cb[cb.length >> 1].toFixed(1) };
      }, [info.cuts[ph], +(process.env.EV || 0), +(process.env.FRAMES || 120)]);
      all[fl]['p' + r.phase] = r;
      console.log(fl, info.id, JSON.stringify(r));
      await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
    }
  }
  require('fs').writeFileSync(path.resolve(__dirname, `../bat/fiend-frames-${process.env.TAG || 'now'}.json`), JSON.stringify(all, null, 1));
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
