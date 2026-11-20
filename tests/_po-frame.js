// v434 PO: frame cost in Rift 03 (The Mouth Beneath the Dunes), measured by tests/_pf-lib.js (RIFT=dunes), as v430 PF did
// for the Drowned Belfry. Scenarios (stage): dunes 0 / flats 5 / night 8 (exploration: the pet walking, the camera easing),
// dunesC 1 / flatsC 6 / nightC 10 (big fights: 16 of the pack round the pet at the stage's busiest trap cluster, the traps
// firing), glide 2 / echo 4 / mounds 9 (the puzzles), sarrukh 3 / oneira 7 / thul 11 (the boss fights, awake). Each: F frames
// of play, then each Ultimate cast in it (ULTS), its first frames and F frames in its busiest stretch. Besides the PF
// counters: the dunes' picture caches per frame (DUNE_PROPS / DUNE_SKY / DUNE_TRAPS paints and misses), GLM triangles.
// usage: HTML=test-po.html node tests/_po-frame.js   env: SCN=dunes,dunesC,...  ULTS=sunflare,armageddon,titan,worldshaking,deadscream
//        (or none)  F (12)  OUT=file.json  DPR (2)  PROF=0  WALK=0 (the pet stands)
process.env.RIFT = 'dunes';
const { open, summ } = require('./_pf-lib');
const fs = require('fs');
const SCN = (process.env.SCN || 'dunes,dunesC,sarrukh').split(','), F = +(process.env.F || 12);
const ULTS = (process.env.ULTS || 'sunflare,armageddon,titan,worldshaking,deadscream').split(',').filter(u => u && u !== 'none');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
const AT = { sunflare: 2.6, armageddon: 1.6, titan: 2.2, worldshaking: 1.2, deadscream: 2.0 };
const STAGE = { dunes: 0, dunesC: 1, glide: 2, sarrukh: 3, echo: 4, flats: 5, flatsC: 6, oneira: 7, night: 8, mounds: 9, nightC: 10, thul: 11 };
const KIND = sc => /C$/.test(sc) ? 'crowd' : ['sarrukh', 'oneira', 'thul'].includes(sc) ? 'boss' : ['glide', 'echo', 'mounds'].includes(sc) ? 'puzzle' : 'land';
// (the pet walks back and forth along open floor: the camera eases after it every frame, as in play)
const WALK = `(() => { const D = window.__pp.arc.game._dbg, me = D.me; if (!me || me.dead || D.FD) return; me.__wd = me.__wd || 1; const nx = me.x + me.__wd * 0.06; if (D.walkAt(Math.floor(nx), Math.floor(me.y)) && !D.blocked(nx, me.y, 0.4, 0)) { me.x = nx; me.face = me.__wd; } else me.__wd = -me.__wd; })()`;
const PFX = () => { window.__PFX = () => { const o = {}; const P = window.DUNE_PROPS, S = window.DUNE_SKY, T = window.DUNE_TRAPS, G = (() => { try { return window.__pp.FIEND_DEFS.calflan.__dbg.GLM; } catch (e) { return null; } })();
  try { if (P) { const s = P.stats; o.propPaint = s.painted; o.propMiss = s.misses; o.propTex = s.tex; o.propCached = s.cached; o.propRel = s.released; } } catch (e) {}
  try { if (S) { const s = S.stats; o.skyPaint = s.painted; o.skyMiss = s.misses; o.skyCached = s.cached + s.strips + s.sands; o.skyRel = s.released; } } catch (e) {}
  try { if (T) { const s = T.stats; o.trapPaint = s.painted; o.trapMiss = s.misses; o.trapGpu = s.gpu; } } catch (e) {}
  try { if (G) { const s = G.stats; o.glmCalls = s.calls; o.glmTris = s.tris; } } catch (e) {}
  return o; }; };
(async () => {
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 2), rift: 'dunes' }); const { page, errors, start, frames } = T;
  await page.evaluate(PFX);
  const out = { html: process.env.HTML, scen: {} };
  for (const sc of SCN) {
    const t0 = Date.now(); await start(STAGE[sc]); const kind = KIND(sc);
    const info = await page.evaluate(([sc, kind]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g;
      for (let k = 0; k < 90; k++) G.update(1 / 60);
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
      let traps = 0;
      if (kind === 'crowd') {   // (the busiest trap cluster: the pet beside the trap with most others within 6 tiles)
        const TR = window.DUNE_TRAPS, Fs = TR ? TR.fields() : [], L = Fs.length ? Fs[Fs.length - 1].traps : []; let best = null;
        for (const tp of L) { const n = L.filter(q => Math.hypot(q.x - tp.x, q.y - tp.y) < 6).length; if (!best || n > best.n) best = { tp, n }; }
        if (best) { const tp = best.tp; for (const [dx, dy] of [[0, 1.8], [1.6, 0.6], [-1.6, 0.6], [0, -1.8], [2.5, 0], [-2.5, 0]]) if (W(tp.x + dx, tp.y + dy)) { me.x = tp.x + dx; me.y = tp.y + dy; break; } traps = best.n; }
      }
      const boss = kind === 'boss' ? (D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt)) : null;
      if (boss) { me.x = boss.x; me.y = boss.y + 6; }
      const brood = D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still), N = kind === 'crowd' ? 16 : 0;
      brood.forEach((m, i) => { if (i < N) { const b = i / N * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); } });
      g.intro = 0; D.banners.length = 0; me.face = 1;
      for (let k = 0; k < 120 || (kind === 'boss' && k < 600 && !(D.FD && D.FD.S && D.FD.S.started && (D.g.boss || D.mons.find(q => q.boss && !q.dead)) && (D.g.boss || D.mons.find(q => q.boss)).act !== 'enter')); k++) { me.hp = D.ST.hp; G.update(1 / 60); }
      if (kind === 'boss') for (let k = 0; k < 240; k++) { me.hp = D.ST.hp; G.update(1 / 60); }   // (awake: a few seconds of its acts)
      const b2 = D.g.boss || D.mons.find(q => q.boss && !q.dead);
      return { me: [+me.x.toFixed(1), +me.y.toFixed(1)], mons: D.mons.filter(m => !m.dead).length, traps, boss: b2 ? (b2.type || b2.id || 'boss') + ':' + b2.act : null, fd: !!D.FD, biome: D.F.biome, name: D.F.name || (D.F.rift && D.F.rift.name), zoom: +D.g.zoom.toFixed(3) };
    }, [sc, kind]);
    console.log(`\n== ${sc} (stage ${STAGE[sc]}, ${kind}, loaded in ${((Date.now() - t0) / 1000).toFixed(0)} s)`, JSON.stringify(info));
    const S = out.scen[sc] = { info, base: null, ults: {} };
    const hold = kind === 'land' && process.env.WALK !== '0' ? [WALK] : null;
    await frames(30, { prof: false, hold });   // (warm: the pictures painted, as the loading screen and the first seconds do)
    let r = await frames(F, { prof: process.env.PROF !== '0', hold }); S.base = summ(r.rows); S.cv = r.cv; S.baseRows = r.rows; S.compiles = r.compiles;
    console.log(` base  ${line(S.base)}`);
    for (const u of (kind === 'puzzle' || process.env.ULTSIN && !process.env.ULTSIN.split(',').includes(sc) ? [] : ULTS)) {
      await page.evaluate(([u, el]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; const mv = P.ELEM_LIST[el]['ey_' + u]; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); const I = P.ELEM_IMPL && P.ELEM_IMPL[el] && P.ELEM_IMPL[el].ult[u]; if (I && I.warm) try { I.warm({ evo: 7, T: () => (G.Tz ? G.Tz() : 48) }); } catch (e) {} }, [u, EL[u]]);
      await frames(12, { prof: false });
      const cast = await page.evaluate(([u]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g, me = D.me;
        me.mp = 999; g.cdU = 0; g.intro = 0; const RU = D.RULES; if (RU && RU.blocks && !RU.__po) { const b0 = RU.blocks; RU.blocks = k => k === 'noult' ? false : b0.call(RU, k); RU.__po = 1; }   /* (a stage rolled 'Cursed: no Ultimates': lifted for the test) */ const n0 = D.ELEM ? D.ELEM.fx.length : 0; D.useUlt(); window.__PF_F = D.ELEM && D.ELEM.fx[D.ELEM.fx.length - 1]; return { fx: (D.ELEM ? D.ELEM.fx.length : 0) - n0 }; }, [u]);
      r = await frames(6, { prof: false }); const first = summ(r.rows), comp = r.compiles;
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
  return `frame ${s.tot.toFixed(1)} ms (med ${s.med.toFixed(1)}, p99 ${s.p99.toFixed(1)}, worst ${s.worst.toFixed(1)}) upd ${s.upd.toFixed(1)} draw ${s.draw.toFixed(1)} post ${s.post.toFixed(1)} | FGFX ${s.fgFlush.toFixed(1)} flushes ${s.fgMs.toFixed(1)} ms, ${s.fgQuads.toFixed(0)}+${s.fgSmoke.toFixed(0)} quads, ${s.fgComp.toFixed(1)} composites (${(s.diGLA / 1e6).toFixed(1)} Mpx, ${s.diGLms.toFixed(1)} ms), fill ${(s.fgFill / 1e6).toFixed(2)} Mpx | GLM ${s.glmN.toFixed(1)} layers ${s.glmMs.toFixed(1)} ms ${s.glmDraw.toFixed(0)} draws ${(s.x_glmTris / 1e3 || 0).toFixed(0)}k tris resize ${s.cvResize.toFixed(1)} | 2D di ${s.di.toFixed(0)} (${(s.diA / 1e6).toFixed(1)} Mpx) grad ${s.grad.toFixed(1)} pat ${s.pat.toFixed(1)} cv+ ${s.cvNew.toFixed(1)} gid ${s.gid.toFixed(1)} lighter ${s.lighter.toFixed(0)} (${(s.lighterA / 1e6).toFixed(1)} Mpx) fillRect ${(s.fillRectA / 1e6).toFixed(1)} Mpx | pics prop ${x('propPaint')}/${x('propMiss')} sky ${x('skyPaint')}/${x('skyMiss')} trap ${x('trapPaint')}/${x('trapMiss')} | GL tex ${s.glTex.toFixed(1)} buf ${(s.glBufB / 1e3).toFixed(0)} kB | heap+ ${(s.heapPos / 1e3).toFixed(0)} kB | parts ${s.parts.toFixed(0)} | ${pr}`;
}
