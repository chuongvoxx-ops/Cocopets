const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, start, run } = T;
  await start('library', 1); await run(4);
  const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, o = {}; for (const m of D.mons) if (!m.dead) o[(m.boss ? 'BOSS ' : '') + m.type] = [Math.round(m.maxhp), Math.round(m.dmg)]; return o; });
  await start('library', 2); await run(4); const b = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.F.fiend ? 'fiend bars ' + JSON.stringify([D.F.hpMul, D.F.dmgMul, D.F.monHp, D.F.monDmg]) : JSON.stringify([D.F.hpMul, D.F.dmgMul, D.F.monHp, D.F.monDmg]); });
  console.log(JSON.stringify(r), b); process.exit(0); })();
