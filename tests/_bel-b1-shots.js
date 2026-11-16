// v391 B1: pictures of the Belfry's lands at 390x844, DPR 2 -> shots/bel-b1-*.png (the contact sheet and the floor's seam
// check: tests/_bel-b1-sheet.py). usage: HTML=test-bel1.html node tests/_bel-b1-shots.js [name...]   env: GL=0 the 2D path
process.env.HTML = process.env.HTML || 'test.html'; if (process.env.DPR1 !== '1') process.env.SHOTS = '1';
const { open } = require('./_rift-lib');
const path = require('path');
(async () => {
  const T = await open({ lvl: 14 }); const { page, errors, start } = T;
  if (process.env.GL === '0') await page.evaluate(() => { window.__BEL_GL = 0; });
  if (process.env.GPU === '1') await page.evaluate(() => { window.__NG_GL = 1; });   // (the GPU painter on swiftshader too: tests only)
  const gt = secs => page.evaluate(async secs => { const G = window.__pp.arc.game._dbg, t0 = G.g.t, w0 = performance.now(); while (G.g.t - t0 < secs && performance.now() - w0 < secs * 20000) { await new Promise(r => requestAnimationFrame(r)); if (G.me && !G.me.dead) { G.me.hp = G.ST.hp; G.me.mp = 999; } } }, secs);
  const at = (x, y, o) => page.evaluate(([x, y, o]) => { const G = window.__pp.arc.game._dbg; G.me.x = x; G.me.y = y; G.me.vx = G.me.vy = 0; if (o && o.calm) { const C = G.RIFT.self.amb.C; C.calm = C.calmTo = o.calm; } if (o && o.peace) for (const m of G.mons) if (!m.boss) m.aggro = false; }, [x, y, o || null]);
  const snap = async name => { await page.screenshot({ path: path.resolve(__dirname, `../shots/bel-b1-${name}${process.env.GPU === '1' ? '-gpu' : ''}.png`) }); console.log('shot', name); };
  const want = process.argv.slice(2); const W = n => !want.length || want.includes(n);
  // v392 B1: the Drowned Lower Church (the regular dungeon first): its causeway, narthex, nave, a chapel, the choir and Gloomfin
  if (W('church')) { await start('belfry', 0); const P0 = n => page.evaluate(n => { const G = window.__pp.arc.game._dbg, mk = G.M.marks; return n === 'S' ? mk.S[0] : mk[n][0]; }, n);
    const calm = () => page.evaluate(() => { for (const m of window.__pp.arc.game._dbg.mons) m.aggro = false; });
    const shotAt = async (x, y, name) => { await at(x, y); await calm(); await gt(2.2); await page.screenshot({ path: path.resolve(__dirname, `../shots/bel-b1-v392-${name}.png`) }); console.log('shot v392', name); };
    await shotAt(29.5, 88, 'causeway'); await shotAt(29.5, 68, 'narthex'); await shotAt(29.5, 44, 'nave'); await shotAt(5.5, 42, 'chapel'); await shotAt(29.5, 16, 'choir');
    await page.evaluate(() => { const G = window.__pp.arc.game._dbg, m = G.mons.find(q => q.belGuard === 'church'); G.me.x = m.x; G.me.y = m.y + 4.5; }); await gt(3); await page.screenshot({ path: path.resolve(__dirname, '../shots/bel-b1-v392-gloomfin.png') }); console.log('shot v392 gloomfin'); }
  // the hall (worker B2's stage, or the stand-in): the causeway with its waves, the vestibule
  if (W('causeway') || W('hall')) { await start('belfry', 1); const S = await page.evaluate(() => { const G = window.__pp.arc.game._dbg, S = G.RIFT.self.S; return { cw: S.causeway, MW: G.M.MW, MH: G.M.MH, st: G.M.start }; });
    if (W('causeway')) { await at((S.cw.x0 + S.cw.x1) / 2, (S.cw.y0 + S.cw.y1) / 2 + 2); await gt(4); await snap('causeway'); }
    if (W('hall')) { await at(S.st.x, S.cw.y0 - 9); await gt(2.5); await snap('hall'); } }
  if (W('cistern')) { await start('belfry', 3); await page.evaluate(() => { const G = window.__pp.arc.game._dbg, o = G.RIFT.objs.find(o => o.kind === 'clapper' && o.n === 2); for (const m of G.mons) if (m.type === 'leech') m.aggro = false; G.me.x = o.x + 0.8; G.me.y = o.y + 0.3; }); await gt(1.5); await at(15, 17); await gt(2.5); await snap('cistern'); await at(33, 12, { peace: 1 }); await gt(2); await snap('cistern-rack'); await at(30, 21, { peace: 1 }); await gt(2); await snap('cistern-lift'); }
  if (W('tide')) { await start('belfry', 5); await gt(2); await snap('tide-foot'); await page.evaluate(() => { const G = window.__pp.arc.game._dbg; G.me.y -= 6; }); await gt(1); const L = await page.evaluate(() => { const L = window.__pp.arc.game._dbg.RIFT.self.mod.legs[0]; return { x: L.valve.x, y: L.valve.y }; }); await at(L.x - 4, L.y + 3); await page.evaluate(() => { const R = window.__pp.arc.game._dbg.RIFT.self.mod.R; R.timer = 3.0; }); await gt(1.2); await snap('tide-warn'); await gt(2.5); await snap('tide-surge');
    await page.evaluate(() => { const G = window.__pp.arc.game._dbg; G.me.x = 13; G.me.y = 30; }); await gt(2); await snap('tide-landing2'); await page.evaluate(() => { const G = window.__pp.arc.game._dbg; G.me.x = 13; G.me.y = 9; for (const m of G.mons) if (!m.boss) m.aggro = false; }); await gt(2); await snap('tide-doors'); }
  // the boss stages (workers B3-B5 own the arenas; these are for the sheet)
  for (const [s, n] of [[2, 'baptism'], [4, 'nave'], [6, 'platform']]) if (W(n)) { await start('belfry', s); await gt(4); await snap(n); }
  // the brood, close: a pack posed in a clear spot of the cistern
  if (W('brood')) { await start('belfry', 3); await page.evaluate(() => { const G = window.__pp.arc.game._dbg, X = G.RIFT.self, cx = 19.5, cy = 18.5; G.me.x = cx; G.me.y = cy + 2.6; const list = G.mons.filter(m => !m.boss).slice(0, 6); list.forEach((m, i) => { m.x = cx - 3 + (i % 3) * 3; m.y = cy - 1 + Math.floor(i / 3) * 2.2; m.aggro = false; m.mode = ['', 'raise', 'side', '', 'bright', 'spit'][i]; m.frozenPose = 1; }); G.g.zoom = 1.6; }); await gt(0.3); await snap('brood'); }
  console.log('errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})();
