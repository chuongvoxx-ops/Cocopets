// v423 GE: contact-sheet shots of every garden room type and each mini-game.
// env: HTML (test-ge.html), DPR (1), OUT (shots dir name, v423-GE), PRE (file name prefix: 'before' | 'after'), ONLY (comma list of keys), LOWFX=1
const { open, STAGES } = require('./_ge-lib.js');
(async () => {
  const dpr = +(process.env.DPR || 1), out = process.env.OUT || 'v423-GE', pre = process.env.PRE || 'after', only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const P = await open({ dpr, lowFx: !!process.env.LOWFX });
  const tag = n => `${pre}-${n}${process.env.LOWFX ? '-lowfx' : ''}-dpr${dpr}`, want = k => !only || only.includes(k);
  const t0 = Date.now(), log = s => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${s}`);
  try {
    for (const k of ['fight1', 'fight2', 'fight3']) { if (!want(k)) continue; await P.stage(STAGES[k]); await P.run(3.2); await P.shot(out, tag(k)); log(k); }
    if (want('march')) { await P.stage(STAGES.march); await P.run(3.2); await P.M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; m.warp(40); m.setN(40); }); await P.run(1.8); await P.shot(out, tag('march')); log('march');
      await P.M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; m.warp(176.5); m.setN(30); }); await P.run(5); await P.shot(out, tag('march-boss')); log('march-boss'); }
    if (want('starfall')) { await P.stage(STAGES.starfall); await P.run(5); await P.shot(out, tag('starfall')); log('starfall'); }
    if (want('gallery')) { await P.stage(STAGES.gallery); await P.run(5); await P.shot(out, tag('gallery')); log('gallery'); }
    for (const k of ['orrubel', 'ambrel', 'calyx']) { if (!want(k)) continue; await P.stage(STAGES[k], { boss: true }); await P.run(1.5, 30); await P.shot(out, tag(k)); log(k); }
  } catch (e) { console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(P.errors.slice(0, 6)));
  await P.browser.close();
})();
