// Rift 0 core: the three lands in the core's own showcase floors (CAL.placeholder), with their props, lava, a vent and the
// brood in play; and, with GPU=1, the same with the GPU painter forced on. HTML=test-calC.html node tests/_cal-c-lands.js [ashen|foundry|heartward]
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path');
const { open } = require('./_rift-lib');
const want = process.argv.slice(2);
(async () => {
  const T = await open({ lvl: 1 }); const { page, start, run, errors } = T;
  await start('caldera', 0); await run(0.3);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; window.__CAL = D.RIFT.self.amb.CAL; window.__S0 = window.__pp.RIFT_BY_ID.caldera.stages[0]; });
  const shot = n => page.screenshot({ path: path.resolve(__dirname, `../shots/cal-land-${n}${process.env.GPU ? '-gpu' : ''}.png`) });
  for (const [bi, name] of [['ashen', 'The Ashen Hollows'], ['foundry', 'The Runebound Foundry'], ['heartward', 'The Heartward Descent']]) { if (want.length && !want.includes(bi)) continue;
    await page.evaluate(([bi, name]) => { const R = window.__pp.RIFT_BY_ID.caldera; R.stages[0] = Object.assign({ biome: bi }, window.__CAL.placeholder(bi, name, 'Showcase'), { kind: 'puzzle', trial: true }); }, [bi, name]);
    await start('caldera', 0); if (process.env.GPU) await page.evaluate(() => { window.__NG_GL = 1; }); await run(2.5);
    // stand by the lava pool, then by the first pack, then at the bridge
    const m = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, mk = D.M.marks; return { P: mk.P && mk.P[0], a: mk.a && mk.a[0], c: mk.c && mk.c[0], S: D.M.start }; });
    await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; }, [m.S.x, m.S.y - 1]); await run(1.5); await shot(bi + '-1');
    await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; for (const q of D.mons) q.aggro = true; }, [m.a.x + 2, m.a.y + 2]); await run(3); await shot(bi + '-2');
    await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; }, [m.P.x - 1.5, m.P.y + 2]); await run(2.5); await shot(bi + '-3');
    console.log(bi, 'ok', errors.length);
  }
  await page.evaluate(() => { window.__pp.RIFT_BY_ID.caldera.stages[0] = window.__S0; });
  console.log('errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})();
