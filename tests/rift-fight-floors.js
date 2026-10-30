// Every rift's first fight floor is full of monsters (a regression: a misplaced line once left rifts 1-10 with only their mini boss)
// usage: node tests/rift-fight-floors.js   (HTML=test-x.html for a build of your own)
const L = require('./_rift-lib.js');
(async () => { const R = await L.open({ lvl: 60, unlockAll: true }); let bad = 0;
  const ids = await R.page.evaluate(() => Object.keys(window.__pp.RIFT_BY_ID));
  for (const id of ids) { const st = await R.page.evaluate(id => { const Rf = window.__pp.RIFT_BY_ID[id]; return Rf.stages.findIndex(s => s.kind === 'fight'); }, id); if (st < 0) continue;
    await R.start(id, st); await R.run(1); const n = await R.page.evaluate(() => window.__pp.arc.game._dbg.g.total);
    const ok = n >= 40; if (!ok) bad++; console.log((ok ? 'ok   ' : 'FAIL ') + id + ' fight floor monsters', n); }
  if (R.errors.length) { bad++; console.log('FAIL page errors', R.errors.slice(0, 4)); }
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await R.browser.close(); process.exit(bad ? 1 : 0); })();
