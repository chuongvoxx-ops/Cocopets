// v398 PR: the shrines and power stones repainted (20n9c-relics.js). For each land (two Tower floors, a Belfry dungeon, the
// Caldera) three shrines (two live, one used) and three power stones are set round the pet, and the scene shot with the old 2D
// art (window.__RELIC = 0, "before") and the new; then a shrine touched and a stone picked up, shot mid-burst.
//  shots/v398-rel-<land>-before|after.png, shots/v398-rel-burst.png; tests/_v398-relics-sheet.py builds shots/v398-shrines-drops.png
// usage: HTML=test-relPR.html [GPU=1] node tests/_v398-relics.js
process.env.HTML = process.env.HTML || 'test.html'; process.env.SHOTS = '1';
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 30 }); const { page, errors, start } = T; page.setDefaultTimeout(1200000);
  if (process.env.GPU === '1') await page.evaluate(() => { window.__NG_GL = 1; });   // (the GPU painter on swiftshader too: tests only)
  const gt = secs => page.evaluate(async secs => { const G = window.__pp.arc.game._dbg, t0 = G.g.t, w0 = performance.now(); while (G.g.t - t0 < secs && performance.now() - w0 < secs * 30000) { await new Promise(r => requestAnimationFrame(r)); if (G.me && !G.me.dead) { G.me.hp = G.ST.hp; } for (const m of G.mons) if (!m.boss) { m.aggro = false; m.x = -50; m.y = -50; } if (G.banners) G.banners.length = 0; } }, secs);
  const tower = async n => { await page.evaluate(n => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.st.unlockAll = true; P.st.dun.best = 99; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(n, 7); }, n); await page.waitForFunction(() => ['ready', 'play'].includes(window.__pp.arc.state), null, { timeout: 1200000 }); await page.evaluate(() => { if (window.__pp.arc.state === 'ready') window.__pp.beginPlay(); }); await page.waitForFunction(() => window.__pp.arc.state === 'play'); };
  const rift = async id => { const i = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID[id]; const i = R.stages.findIndex(s => s && s.kind === 'fight'); return i < 0 ? 0 : i; }, id); await page.evaluate(([id, i]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift(id, i); }, [id, i]); await page.waitForFunction(() => ['ready', 'play'].includes(window.__pp.arc.state), null, { timeout: 1200000 }); await page.evaluate(() => { if (window.__pp.arc.state === 'ready') window.__pp.beginPlay(); }); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1200000 }); };   // (the lib's start, with the patience a busy machine needs)
  // an open stretch of floor (5 x 5 tiles), the pet in it, the shrines and stones round it
  const stage = (mode) => page.evaluate(mode => { window.__RELIC = mode === 'before' ? 0 : 1; const D = window.__pp.arc.game._dbg, M = D.M, MW = M.MW, MH = M.MH, G = M.G;
    const fl = (x, y) => x > 0 && y > 0 && x < MW && y < MH && G[y * MW + x] === 1 && !(D.blocked && D.blocked(x + 0.5, y + 0.5, 0.3, 0));
    let best = null; const cx0 = Math.floor(D.me.x), cy0 = Math.floor(D.me.y); for (let r = 0; r < 60 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r && !best; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = cx0 + dx, y = cy0 + dy; let good = true; for (let j = -3; j <= 2 && good; j++) for (let i = -3; i <= 3 && good; i++) if (!fl(x + i, y + j)) good = false; if (good) best = [x, y]; }
    if (!best) best = [cx0, cy0]; const [x, y] = best; D.me.x = x + 0.5; D.me.y = y + 1.6; D.me.vx = D.me.vy = 0;
    for (const p of D.propList) if (Math.abs(p.x - x) < 4 && Math.abs(p.y - y) < 4) p.broken = true; for (const p of D.pots) if (Math.abs(p.x - x) < 4 && Math.abs(p.y - y) < 4) p.broken = true;
    D.shrines.length = 0; D.stones.length = 0;
    D.shrines.push({ x: x - 1.6, y: y - 1.6, kind: 'fury', t: 0.3, used: false }, { x: x + 0.5, y: y - 2.2, kind: 'arcane', t: 1.1, used: false }, { x: x + 2.6, y: y - 1.6, kind: 'guardian', t: 0, used: true });
    D.stones.push({ x: x - 1.8, y: y + 0.8, kind: 'multiply', t: 0.4, got: false }, { x: x + 0.2, y: y - 0.3, kind: 'thunder', t: 1.3, got: false }, { x: x + 2.4, y: y + 0.6, kind: 'frost', t: 2.2, got: false });
    return { at: best, biome: D.F.biome }; }, mode);
  const shots = []; const lands = [['tower12', () => tower(12)], ['belfry', () => rift('belfry')], ['caldera', () => rift('caldera')], ['tower47', () => tower(47)]];
  const L = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a), ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const [name, go] of lands) { if (ONLY && !ONLY.includes(name)) continue; L('start', name); await go(); L('started'); await gt(0.5); L('settled');
    for (const mode of ['before', 'after']) { const r = await stage(mode); await gt(1.6);
      const st = await page.evaluate(() => window.RELICS.stats); await page.screenshot({ path: path.resolve(__dirname, `../shots/v398-rel-${name}-${mode}.png`) }); shots.push(name + '-' + mode);
      console.log('shot', name, mode, r.biome, JSON.stringify(st)); }
    const st = await page.evaluate(() => window.RELICS.stats); ok(st.sprites > 0, `${name}: the painted shrines and stones drawn`, { sprites: st.sprites, fallbacks: st.fallbacks, gpu: st.gpuOn }); }
  // the bursts: the pet onto a live shrine, then a stone
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, s = D.shrines[0]; D.me.x = s.x; D.me.y = s.y + 0.2; }); await gt(0.25);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, s = D.stones[1]; if (s) D.takeStone(s); }); await gt(0.12);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/v398-rel-burst.png') });
  const b = await page.evaluate(() => ({ used: window.__pp.arc.game._dbg.shrines[0].used, bursts: window.RELICS.stats.bursts })); ok(b.used && b.bursts >= 2, 'a shrine touched and a stone picked up burst', b);
  ok(errors.length === 0, 'no page errors', errors.slice(0, 4)); console.log(`\n${fails ? 'FAILED ' + fails : 'all passed'} · page errors: ${errors.length}`); await T.browser.close(); process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
