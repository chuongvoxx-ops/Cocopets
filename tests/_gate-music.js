// v449: the gates' music: Anima Gates in the puzzle, The Summoning (the anima's summoning song) once the boss fight begins.
// python3 src/build.py --web --test; HTML=dist/test.html node tests/_gate-music.js   (the website build: the Claude build carries no songs)
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
(async () => {
  { const T = await require('./_ag-lib').open({ html: process.env.HTML }); try {
      await T.M(() => window.__pp.startGate('caldera')); await T.page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 }); await T.M(() => window.__pp.beginPlay());
      await T.page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
      const w = await T.M(() => ({ want: window.__pp.music.want(), phase: window.__pp.arc.game._dbg.RIFT.self.mod.S.phase }));
      ok(w.phase === 'puzzle' && w.want === 'gates', 'Aries gate, the puzzle: Anima Gates as before ' + JSON.stringify(w)); } finally { await T.browser.close(); } }
  for (const [lib, name] of [['_sx-lib', 'Scorpio'], ['_sb-lib', 'Aries']]) {
    const L = require('./' + lib), T = await L.open({ god: true });
    try {
      const r = await T.start();
      const w = await T.page.evaluate(() => { const m = window.__pp.music, D = window.__pp.arc.game._dbg; return { want: m.want(), has: m.has('summon'), phase: D.RIFT.self.mod.S.phase }; });
      ok(w.phase === 'boss' && w.want === (w.has ? 'summon' : 'triumph'), `${name}: the boss fight plays the summoning's song ${JSON.stringify(w)}`);
    } finally { await T.browser.close(); }
  }
  console.log(bad ? `${bad} FAILED` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
