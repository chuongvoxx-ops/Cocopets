// v430 BW: the Belfry's exit doors in their stages, before and after (the same script on either build): D2's exit (std),
// the Clapper Counterweights' lift (with the old cage beside it: the stray brass outline), D3's exit (boss entrance), the
// Hall of Three Tides' north gate; closed, then the stage's door told to open (the stage marked done; the lift's own unlock
// where the build has it), frames as it opens. OUT=dir PREFIX=before|after DPR=1|3 STAGES=3,4,6,1
const { open } = require('./_bw-lib');
const fs = require('fs'), path = require('path');
(async () => {
  const dpr = +(process.env.DPR || 1), out = process.env.OUT || path.resolve(__dirname, '../shots/v430-BW'), pre = process.env.PREFIX || 'after', stages = (process.env.STAGES || '3,4,6,1').split(',').map(Number);
  fs.mkdirSync(out, { recursive: true }); const T = await open({ dpr }); const { page, errors } = T; const shots = [];
  const HOLD = 'const DS = BEL.dungeonCtx(D.g), C = BEL.ctx(D.g), e = D.RIFT.exit, g = (DS && DS.mini) || (C.guard && C.guard.m); if (g && !g.dead && e) { g.x = e.x + 7; g.y = e.y + 5; g.vx = g.vy = 0; }';   // (shots only: the guardian waiting by the door stepped aside, out of the picture)
  const shot = async name => { const f = path.join(out, `${pre}-door-${name}-dpr${dpr}.png`); await T.shot(f); shots.push(f); };
  for (const sg of stages) { await T.start(sg); await T.runG(0.3);
    if (sg === 1) {   // the hall: stand before the north gate, then choose it (it opens)
      const p = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e9, { flat: true }); const g = D.RIFT.objs.filter(o => o.kind === 'belgate').find(o => o.B === 'N'); return g ? { x: g.x, y: g.y } : null; });
      if (!p) continue; await T.goTo(p.x, p.y + 1.0); await T.runG(0.5);
      const wasOpen = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, g = D.RIFT.objs.filter(o => o.kind === 'belgate').find(o => o.B === 'N'), RS = window.__pp.riftState(), h = RS.hall ? (RS.hall.belfry || Object.values(RS.hall)[0]) : null; if (h && h.sel === 'N') { g.use(g); return true; } return false; });   // (a gate already chosen is shut first)
      await T.runG(wasOpen ? 3.2 : 3.0); await shot('hall-N-closed');
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg, g = D.RIFT.objs.filter(o => o.kind === 'belgate').find(o => o.B === 'N'); g.use(g); });
      for (const [n, s] of [['opening', 0.45], ['open', 1.6]]) { await T.runG(s); await shot('hall-N-' + n); } continue; }
    const name = sg === 3 ? 'std' : sg === 4 ? 'lift' : 'boss';
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; for (const m of D.mons) if (!m.dead && !m.boss && Math.hypot(m.x - e.x, m.y - e.y) < 9) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } D.me.x = e.x + 0.4; D.me.y = e.y + 3.2; });
    await T.runG(3.0, HOLD); await shot(name + '-closed');
    if (name === 'lift') {   // the lift unlocked the stage's own way, on either build: the leeches off the rack, the pans loaded to three and three, the drain pair beaten
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.belHold) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } }); await T.runG(0.3, HOLD);
      await page.evaluate(() => { const O = window.__pp.arc.game._dbg.RIFT.objs, cl = n => O.find(o => o.kind === 'clapper' && o.n === n), pan = i => O.find(o => o.kind === 'pan' && o.i === i); const c3 = cl(3); c3.use(c3); pan(0).use(); const c1 = cl(1); c1.use(c1); pan(1).use(); const c2 = cl(2); c2.use(c2); pan(1).use(); });
      await T.runG(1.3, HOLD); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.pack === 530) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } }); }
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.RIFT.self.done = true; const e = D.RIFT.exit; D.me.x = e.x + 1.6; D.me.y = e.y + 3.2; });
    const at = name === 'boss' ? [['unlocking', 0.9], ['opening', 1.6], ['open', 2.6]] : name === 'lift' ? [['opening', 1.0], ['open', 2.4]] : [['unlocking', 0.45], ['opening', 1.0], ['open', 1.8]];
    for (const [n, s] of at) { await T.runG(s, HOLD); await shot(name + '-' + n); } }
  console.log(JSON.stringify({ pre, dpr, shots: shots.length }));
  console.log('errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})();
