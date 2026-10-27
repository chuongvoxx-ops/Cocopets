const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, errors, shot, start, run } = T;
  await start('library', 1); await run(9);
  const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const sh = D.mons.find(m => m.type === 'tottershelf' && !m.dead); const others = D.mons.filter(m => !m.dead && !m.boss && m.type !== 'tottershelf').slice(0, 4);
    D.me.x = sh.x - 3; D.me.y = sh.y; others.forEach((m, i) => { m.x = sh.x + 1.5 + i * 0.9; m.y = sh.y + (i % 2 ? 0.3 : -0.3); m.still = true; m.hp = m.maxhp; });
    for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r)); return { n: others.length, hp: others.map(m => Math.round(m.hp / m.maxhp * 100)) }; });
  await shot('lib-totter-a');
  const r2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const sh = D.mons.find(m => m.type === 'tottershelf' && !m.dead); const others = D.mons.filter(m => !m.dead && !m.boss && m.type !== 'tottershelf' && m.still); D.hitMon(sh, 1e9, { flat: true }); for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r)); return others.map(m => m.dead ? 'dead' : Math.round(m.hp / m.maxhp * 100)); });
  await shot('lib-totter-b'); console.log(JSON.stringify(r), JSON.stringify(r2), errors.slice(0, 2)); process.exit(0); })();
