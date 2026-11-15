// lead check: the three Caldera bosses' total health and blows at level 1 (HTML=test-lead.html node tests/_cal-lead-hp.js)
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 1 }); const { page, start, run } = T;
  for (const st of [1, 3, 5]) { await start('caldera', st); await run(6);
    console.log(st, JSON.stringify(await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const b = D.mons.find(m => m.type === 'boss' || m.fiend) || {}; return { name: b.bname, hp: Math.round(b.maxhp), dmg: b.dmg && +b.dmg.toFixed(1), goal: document.getElementById('arcGoal').textContent }; }))); }
  console.log('errors', T.errors.slice(0, 3)); await T.browser.close(); })();
