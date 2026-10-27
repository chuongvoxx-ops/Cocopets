const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, shot, start, run } = T;
  for (const [id, st] of [['aurora', 4]]) { await start(id, st); await run(1);
    const hold = async (secs, name) => { await page.evaluate(async secs => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { D.me.x = e.x + 0.3; D.me.y = e.y + 2.6; D.me.hp = D.ST.hp; for (const m of D.mons) if (!m.dead && !m.boss) { m.x = e.x + 12; m.y = e.y - 12; m.freeze = 1; } await new Promise(r => requestAnimationFrame(r)); } }, secs); await shot(name); };
    await hold(3.2, 'gate-shut-' + id); await page.evaluate(() => { window.__pp.arc.game._dbg.RIFT.self.done = true; }); await hold(3.6, 'gate-open-' + id); }
  console.log('errors', errors.length, errors.slice(0, 2)); process.exit(0); })();
