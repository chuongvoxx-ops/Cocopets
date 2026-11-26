// v453 GP: frame cost in Rift 02 (The Garden of Unborn Stars), against the Drowned Belfry as the reference, measured by
// tests/_pf-lib.js as v430 PF / v434 PO did. At the user's phone: DPR 3 (390x844), the visual quality Balanced (canvas at
// 1.5 px a point) or High (GQ=high), every GPU path forced on as a phone takes it (the Garden's bosses at full resolution).
// Scenarios (rift stage):
//   Garden  g1 0 / g2 3 / g3 6 (exploring each section's fight stage: the pet walking, the camera easing), g1C / g2C / g3C (the
//           same stages crowded: 16 of the pack round the pet at the stage's densest trap cluster, the traps firing), march 1 /
//           starfall 4 / gallery 7 (the puzzles), orrubel 2 / ambrel 5 / calyx 8 (the boss fights, awake)
//   Belfry  b1 0 (exploring), b1C 0 (crowd, PF's), hall 1 (the Hall of Three Tides), storm 6 (crowd in rain), uldroth 7 (boss)
// Each: F frames of play, then each Ultimate (ULTS) cast in it (ULTSIN limits where): its first frames and its busiest stretch.
// Besides the PF counters: the Garden's picture caches per frame (GARDEN_PROPS / GARDEN_TRAPS paints and misses; for the
// Belfry BELPROPS), GL copies a frame (WebGL canvases with new content laid on the 2D one).
// usage: HTML=test-gp.html node tests/_gp-frame.js   env: SCN=g1,g1C,...  ULTS=sunflare,armageddon (or none)  ULTSIN=g2C,orrubel
//        F (10)  OUT=file.json  DPR (3)  GQ (balanced | high)  PROF=0  WALK=0  OFF=1 (window.__GP_OFF = 1 throughout)
const { open, summ } = require('./_pf-lib');
const fs = require('fs');
const SCN = (process.env.SCN || 'g1,g1C,orrubel').split(','), F = +(process.env.F || 10);
const ULTS = (process.env.ULTS || 'none').split(',').filter(u => u && u !== 'none');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
const AT = { sunflare: 2.6, armageddon: 1.6, titan: 2.2, worldshaking: 1.2, deadscream: 2.0 };
const DEF = { g1: ['garden', 0, 'land'], g1C: ['garden', 0, 'crowd'], march: ['garden', 1, 'puzzle'], orrubel: ['garden', 2, 'boss'], g2: ['garden', 3, 'land'], g2C: ['garden', 3, 'crowd'], starfall: ['garden', 4, 'puzzle'], ambrel: ['garden', 5, 'boss'], g3: ['garden', 6, 'land'], g3C: ['garden', 6, 'crowd'], gallery: ['garden', 7, 'puzzle'], calyx: ['garden', 8, 'boss'],
  b1: ['belfry', 0, 'land'], b1C: ['belfry', 0, 'crowd'], hall: ['belfry', 1, 'land'], storm: ['belfry', 6, 'crowd'], uldroth: ['belfry', 7, 'boss'] };
// (the pet walks back and forth along open floor: the camera eases after it every frame, as in play)
const WALK = `(() => { const D = window.__pp.arc.game._dbg, me = D.me; if (!me || me.dead || D.FD) return; me.__wd = me.__wd || 1; const nx = me.x + me.__wd * 0.06; if (D.walkAt(Math.floor(nx), Math.floor(me.y)) && !D.blocked(nx, me.y, 0.4, 0)) { me.x = nx; me.face = me.__wd; } else me.__wd = -me.__wd; })()`;
const PFX = () => { window.__PFX = () => { const o = {}; const P = window.GARDEN_PROPS, T = window.GARDEN_TRAPS, B = window.BELPROPS, BT = window.BEL_TRAPS;
  try { if (P) { const s = P.stats; o.propPaint = s.painted; o.propMiss = s.misses; o.propTex = s.tex; o.propDraws = s.draws; } } catch (e) {}
  try { if (T) { const s = T.stats; o.trapPaint = s.painted; o.trapMiss = s.misses; o.trapGpu = s.gpu; } } catch (e) {}
  try { if (B && B.stats) { const s = B.stats; o.belPaint = s.painted || 0; o.belMiss = s.misses || 0; } } catch (e) {}
  try { if (window.__GPS) Object.assign(o, window.__GPS()); } catch (e) {}
  return o; }; };
(async () => {
  const rift = DEF[SCN[0]][0];
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 3), rift, flags: { __ORB_GL: 1, __GB_GL: 1, __GB_GLHQ: 1 } }); const { page, errors, start, frames } = T;
  await page.evaluate(([gq, off]) => { window.__pp.st.gq = gq; if (off) window.__GP_OFF = 1; }, [process.env.GQ || 'balanced', process.env.OFF === '1']);
  await page.evaluate(PFX);
  const out = { html: process.env.HTML, gq: process.env.GQ || 'balanced', scen: {} };
  for (const sc of SCN) {
    const [rf, stage, kind] = DEF[sc]; if (rf !== rift) throw new Error('one rift a run: ' + sc);
    const t0 = Date.now(); if (stage !== out.lastStage || process.env.FRESH === '1') await start(stage); out.lastStage = stage;   // (a crowd after its own stage's walk: the same page, the pack gathered)
    const info = await page.evaluate(([sc, kind]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g;
      for (let k = 0; k < 90; k++) G.update(1 / 60);
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
      let traps = 0;
      if (sc === 'hall') { me.x = 52.5; me.y = 59.5; }
      if (kind === 'crowd') {   // (the busiest trap cluster: the pet beside the trap with most others within 6 tiles; the Belfry: PF's open spot)
        const TR = window.GARDEN_TRAPS, Fs = TR && D.F.rift && D.F.rift.id === 'garden' ? TR.fields().filter(f => f.live) : [], L = Fs.length ? Fs[Fs.length - 1].traps : []; let best = null;
        for (const tp of L) { const n = L.filter(q => Math.hypot(q.x - tp.x, q.y - tp.y) < 6).length; if (!best || n > best.n) best = { tp, n }; }
        if (best) { const tp = best.tp; for (const [dx, dy] of [[0, 1.8], [1.6, 0.6], [-1.6, 0.6], [0, -1.8], [2.5, 0], [-2.5, 0]]) if (W(tp.x + dx, tp.y + dy)) { me.x = tp.x + dx; me.y = tp.y + dy; break; } traps = best.n; }
        else { let bb = null; for (let k = 0; k < 3000; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; if (!W(sx, sy)) continue; let Lr = 0; while (Lr < 7 && W(sx + Lr, sy) && W(sx - Lr, sy) && W(sx, sy - Lr * 0.7) && W(sx, sy + Lr * 0.7)) Lr += 0.25; if (!bb || Lr > bb.L) bb = { x: sx, y: sy, L: Lr }; } if (bb) { me.x = bb.x; me.y = bb.y; } }
      }
      const boss = kind === 'boss' ? (D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt)) : null;
      if (boss) { me.x = boss.x; me.y = boss.y + 6; if (D.wakeBoss && !D.FD) try { D.wakeBoss(); } catch (e) {} }
      const brood = D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still), N = kind === 'crowd' ? 16 : 0;
      brood.forEach((m, i) => { if (i < N) { const b = i / N * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); } });
      g.intro = 0; g.bossIntro = 0; D.banners.length = 0; me.face = 1;
      for (let k = 0; k < 120 || (kind === 'boss' && k < 600 && !(D.FD && D.FD.S && D.FD.S.started)); k++) { me.hp = D.ST.hp; G.update(1 / 60); }
      if (kind === 'boss') for (let k = 0; k < 240; k++) { me.hp = D.ST.hp; G.update(1 / 60); }   // (awake: a few seconds of its acts)
      const b2 = D.g.boss || D.mons.find(q => q.boss && !q.dead);
      const cv = P.arc.ctx ? P.arc.ctx.canvas : document.getElementById('arcCanvas');
      return { me: [+me.x.toFixed(1), +me.y.toFixed(1)], mons: D.mons.filter(m => !m.dead).length, traps, boss: b2 ? (b2.type || b2.id || 'boss') + ':' + (b2.act || '') : null, fd: !!D.FD, biome: D.F.biome, name: D.F.name || (D.F.rift && D.F.rift.name), zoom: +(D.g.zoom || 1).toFixed(3), cv: [cv.width, cv.height], dpr: +P.arc.dpr };
    }, [sc, kind]);
    console.log(`\n== ${sc} (${rf} ${stage}, ${kind}, loaded in ${((Date.now() - t0) / 1000).toFixed(0)} s)`, JSON.stringify(info));
    const S = out.scen[sc] = { info, base: null, ults: {} };
    const hold = kind === 'land' && process.env.WALK !== '0' && sc !== 'hall' ? [WALK] : null;
    await frames(24, { prof: false, hold });   // (warm: the pictures painted, as the loading screen and the first seconds do)
    let r = await frames(F, { prof: process.env.PROF !== '0', hold }); S.base = summ(r.rows); S.cv = r.cv; S.baseRows = r.rows; S.compiles = r.compiles;
    console.log(` base  ${line(S.base)}`);
    for (const u of (kind === 'puzzle' || process.env.ULTSIN && !process.env.ULTSIN.split(',').includes(sc) ? [] : ULTS)) {
      await page.evaluate(([u, el]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; const mv = P.ELEM_LIST[el]['ey_' + u]; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); const I = P.ELEM_IMPL && P.ELEM_IMPL[el] && P.ELEM_IMPL[el].ult[u]; if (I && I.warm) try { I.warm({ evo: 7, T: () => (G.Tz ? G.Tz() : 48) }); } catch (e) {} }, [u, EL[u]]);
      await frames(8, { prof: false });
      const cast = await page.evaluate(([u]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g, me = D.me;
        me.mp = 999; g.cdU = 0; g.intro = 0; const RU = D.RULES; if (RU && RU.blocks && !RU.__po) { const b0 = RU.blocks; RU.blocks = k => k === 'noult' ? false : b0.call(RU, k); RU.__po = 1; } const n0 = D.ELEM ? D.ELEM.fx.length : 0; D.useUlt(); window.__PF_F = D.ELEM && D.ELEM.fx[D.ELEM.fx.length - 1]; return { fx: (D.ELEM ? D.ELEM.fx.length : 0) - n0 }; }, [u]);
      r = await frames(5, { prof: false }); const first = summ(r.rows), comp = r.compiles;
      await page.evaluate(at => { const G = window.__pp.arc.game, D = G._dbg, f = window.__PF_F; let k = 0; while (f && f.t < at && k++ < 600) { D.me.hp = D.ST.hp; D.me.mp = 999; G.update(1 / 60); } }, AT[u]);
      r = await frames(F, { prof: process.env.PROF !== '0' }); const busy = summ(r.rows);
      S.ults[u] = { cast, first, busy, compiles: comp, rows: r.rows };
      console.log(` ${u.padEnd(12)} first ${first.tot.toFixed(0)} ms (worst ${first.worst.toFixed(0)}, compiles ${comp.length}) | busy ${line(busy)}`);
      await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 60 * 14; k++) { D.me.hp = D.ST.hp; G.update(1 / 60); if (!D.ELEM || !D.ELEM.fx.length) break; } if (D.helpers) D.helpers.length = 0; });
    }
    if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  console.log('\npage errors', errors.length, errors.slice(0, 4));
  await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
function line(s) {
  const pr = Object.entries(s.pr).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ' ' + v.toFixed(1)).join(', ');
  const x = k => (s['x_' + k] || 0).toFixed(1);
  return `frame ${s.tot.toFixed(1)} ms (med ${s.med.toFixed(1)}, p99 ${s.p99.toFixed(1)}, worst ${s.worst.toFixed(1)}) upd ${s.upd.toFixed(1)} draw ${s.draw.toFixed(1)} post ${s.post.toFixed(1)} | GL copies ${(s.diGLr + s.glmR).toFixed(1)} | FGFX ${s.fgFlush.toFixed(1)} passes ${s.fgMs.toFixed(1)} ms, ${s.fgQuads.toFixed(0)}+${s.fgSmoke.toFixed(0)} quads, ${s.fgLayers.toFixed(1)} layers ${s.fgComp.toFixed(1)} composites (${(s.diGLA / 1e6).toFixed(2)} Mpx, ${s.diGLms.toFixed(1)} ms), fill ${(s.fgFill / 1e6).toFixed(2)} / shaded ${(s.fgFillV / 1e6).toFixed(2)} Mpx | GLM ${s.glmN.toFixed(1)} layers ${s.glmMs.toFixed(1)} ms ${(s.glmA / 1e6).toFixed(2)} Mpx ${s.glmDraw.toFixed(0)} draws resize ${s.cvResize.toFixed(1)} (GLM ${s.cvResizeGLM.toFixed(1)}) | 2D di ${s.di.toFixed(0)} (${(s.diA / 1e6).toFixed(1)} Mpx) fill ${s.fill.toFixed(0)} grad ${s.grad.toFixed(1)} pat ${s.pat.toFixed(1)} cv+ ${s.cvNew.toFixed(1)} clip ${s.clip.toFixed(0)} lighter ${s.lighter.toFixed(0)} (${(s.lighterA / 1e6).toFixed(1)} Mpx) fillRect ${(s.fillRectA / 1e6).toFixed(1)} Mpx | pics prop ${x('propPaint')}/${x('propMiss')} trap ${x('trapPaint')}/${x('trapMiss')} bel ${x('belPaint')}/${x('belMiss')} | GL tex ${s.glTex.toFixed(1)} buf ${(s.glBufB / 1e3).toFixed(0)} kB compile ${s.glCompile.toFixed(1)} | heap+ ${(s.heapPos / 1e3).toFixed(0)} kB | parts ${s.parts.toFixed(0)} fx ${s.fx.toFixed(1)} mons ${s.mons.toFixed(0)} | ${pr}`;
}
