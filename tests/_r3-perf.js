// v460 R3: Rift 03 (The Mouth Beneath the Dunes) frame survey, before any change and after: the three dungeons under the
// same conditions (exploring: the pet walking, the camera easing; crowded: 16 of the brood round the pet at the stage's
// densest trap cluster, the traps firing), the three bosses awake, and each boss with a six-star summon cast in its arena
// (its first frames, the "spike", and its busiest stretch). Counters from tests/_pf-lib.js (FGFX passes, GL layers, GLM
// passes and canvas reallocations, 2D area, gradients, canvases, shader compiles, buffer/texture uploads, heap) plus the
// game's live entity counts (monsters alive / awake / in the list, traps live and ticked, enemy shots, zones, particles,
// Ultimate effects, timers) and the time the traps' and monsters' updates take.
// Stages are found by name / boss, so the same script runs on the twelve-stage (v458) and the eight-stage (v460) route.
// usage: HTML=test-r3b.html node tests/_r3-perf.js   env: SCN=d1,d1C,d2,d2C,d3,d3C,sarrukh,oneira,thul  SUMMONS=tiamat,mobydick,nidhogg
//        F (frames, 8)  DPR (3)  GQ (balanced)  OUT=file.json  R3OFF=1 (window.__R3_OFF = 1)  HQ=0 (bosses at the soft 0.45x)
process.env.RIFT = 'dunes';
const { open, summ } = require('./_pf-lib');
const fs = require('fs');
const SCN = (process.env.SCN || 'd1,d1C,d2,d2C,d3,d3C,sarrukh,oneira,thul').split(','), F = +(process.env.F || 8);
const SUMMONS = (process.env.SUMMONS || 'tiamat,mobydick,nidhogg').split(',').filter(u => u && u !== 'none');
const EL = { tiamat: 'thunder', mobydick: 'water', nidhogg: 'fire', goldeneagle: 'wind', snakeflame: 'fire', jaws: 'water', fenrir: 'ice', susanoo: 'dark', sunflare: 'light', armageddon: 'fire' };
const AT = { tiamat: 3.0, mobydick: 2.6, nidhogg: 2.5, goldeneagle: 2.2, snakeflame: 1.6, jaws: 2.5, fenrir: 2.5, susanoo: 3.0, sunflare: 2.6, armageddon: 1.6 };
const WHERE = { d1: ['name', 'The Buried Road'], d2: ['name', 'The Rust Flats'], d3: ['name', 'The Moonlit Barrows'], sarrukh: ['boss', 'sarrukh'], oneira: ['boss', 'oneira'], thul: ['boss', 'thulammon'], glide: ['name', 'The Sandstorm Flight'], echo: ['name', 'The Echo Chamber'] };
const KIND = sc => /C$/.test(sc) ? 'crowd' : ['sarrukh', 'oneira', 'thul'].includes(sc) ? 'boss' : ['glide', 'echo'].includes(sc) ? 'puzzle' : 'land';
const WALK = `(() => { const D = window.__pp.arc.game._dbg, me = D.me; if (!me || me.dead || D.FD) return; me.__wd = me.__wd || 1; const nx = me.x + me.__wd * 0.06; if (D.walkAt(Math.floor(nx), Math.floor(me.y)) && !D.blocked(nx, me.y, 0.4, 0)) { me.x = nx; me.face = me.__wd; } else me.__wd = -me.__wd; })()`;
// the update's own pieces: the dune traps' ticks and the monsters' turns timed (wrapped in the page, test only)
const INSTR = () => { window.__R3T = { trap: 0, trapN: 0, ticked: 0 };
  window.__R3wrap = () => { const T = window.DUNE_TRAPS; if (!T) return; for (const f of T.fields()) { if (f.__r3) continue; f.__r3 = 1; const t0 = f.tick; f.tick = function () { const a = performance.now(); const r = t0.apply(this, arguments); window.__R3T.trap += performance.now() - a; window.__R3T.trapN++; return r; }; } };
  window.__R3P = []; try { if (typeof GLM !== 'undefined' && !GLM.__r3) { GLM.__r3 = 1; const r0 = GLM.render; GLM.render = function (W, H, S) { if (W * H > 64) { window.__R3P.push([W, H, S && S.keep ? +S.keep : 0]); if (window.__R3P.length > 64) window.__R3P.shift(); } return r0.apply(this, arguments); }; } } catch (e) {}
  window.__PFX = () => { const o = {}; const T = window.__R3T; o.trapMs = T.trap; o.trapTicks = T.trapN; return o; }; };
(async () => {
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 3), rift: 'dunes', flags: Object.assign({ __PF_NOFILLV: 1, __TM_GL: 1, __MD_GL: 1, __GE_GL: 1, __NIDHOGG_GL: 1 }, process.env.R3OFF === '1' ? { __R3_OFF: 1 } : {}) });
  const { page, errors, start, frames } = T;
  await page.evaluate(INSTR);
  if (process.env.BAND !== '1') await page.evaluate(() => { window.__pp.RIFT_BY_ID.dunes.stages.forEach(s => { if (s.mod === 'random') s.mod = null; }); });   // (no random hand of rules: a rolled 'horde' doubles the monsters; BAND=1 keeps the rolled mods)
  await page.evaluate(gq => { window.__pp.st.gq = gq; }, process.env.GQ || 'balanced');
  const route = await page.evaluate(() => window.__pp.RIFT_BY_ID.dunes.stages.map(s => s.kind[0] + ':' + (s.boss || s.name)).join(' | '));
  console.log('route', route);
  const out = { html: process.env.HTML, r3off: process.env.R3OFF === '1', route, scen: {} };
  const census = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me, TR = window.DUNE_TRAPS, Fs = TR ? TR.fields() : [], L = Fs.length ? Fs[Fs.length - 1].traps : [];
    const live = D.mons.filter(m => !m.dead), awake = live.filter(m => m.aggro && !m.fobj), near = live.filter(m => Math.hypot(m.x - me.x, m.y - me.y) < 13);
    return { monList: D.mons.length, alive: live.length, awake: awake.length, near13: near.length, fobj: live.filter(m => m.fobj).length, reserve: (D.g.reserve || []).length, trapFields: Fs.length, traps: L.length, trapsNear13: L.filter(t => Math.hypot(t.x - me.x, t.y - me.y) < 13).length,
      eshots: D.eshots.length, zones: D.zones.length, parts: D.parts.length, fx: D.ELEM ? D.ELEM.fx.length : 0, helpers: (D.helpers || []).length, rings: (D.rings || []).length, texts: (D.texts || []).length, hazards: (D.hazards || []).length, rooms: D.M.rooms.length,
      tele: D.FD && D.FD.S ? D.FD.S.tele.length : 0, hz: D.FD && D.FD.S ? D.FD.S.hz.length : 0, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1e6).toFixed(1) : 0 }; });
  for (const sc of SCN) {
    const base = sc.replace(/C$/, ''), kind = KIND(sc), w = WHERE[base];
    const idx = await page.evaluate(w => window.__pp.RIFT_BY_ID.dunes.stages.findIndex(s => s[w[0]] === w[1]), w);
    if (idx < 0) { console.log('no stage for', sc); continue; }
    const t0 = Date.now(); await start(idx);
    const info = await page.evaluate(([kind]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g;
      for (let k = 0; k < 90; k++) G.update(1 / 60);
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
      let traps = 0;
      if (kind === 'crowd') { const TR = window.DUNE_TRAPS, Fs = TR ? TR.fields() : [], L = Fs.length ? Fs[Fs.length - 1].traps : []; let best = null;
        for (const tp of L) { const n = L.filter(q => Math.hypot(q.x - tp.x, q.y - tp.y) < 6).length; if (!best || n > best.n) best = { tp, n }; }
        if (best) { const tp = best.tp; for (const [dx, dy] of [[0, 1.8], [1.6, 0.6], [-1.6, 0.6], [0, -1.8], [2.5, 0], [-2.5, 0]]) if (W(tp.x + dx, tp.y + dy)) { me.x = tp.x + dx; me.y = tp.y + dy; break; } traps = best.n; } }
      const boss = kind === 'boss' ? (D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt)) : null;
      if (boss) { me.x = boss.x; me.y = boss.y + 6; }
      const brood = D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still), N = kind === 'crowd' ? 16 : 0;
      brood.forEach((m, i) => { if (i < N) { const b = i / N * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); } });
      g.intro = 0; D.banners.length = 0; me.face = 1;
      for (let k = 0; k < 120 || (kind === 'boss' && k < 600 && !(D.FD && D.FD.S && D.FD.S.started && (D.g.boss || D.mons.find(q => q.boss && !q.dead)) && (D.g.boss || D.mons.find(q => q.boss)).act !== 'enter')); k++) { me.hp = D.ST.hp; G.update(1 / 60); }
      if (kind === 'boss') for (let k = 0; k < 240; k++) { me.hp = D.ST.hp; G.update(1 / 60); }
      const b2 = D.g.boss || D.mons.find(q => q.boss && !q.dead);
      if (b2) { b2.hp = b2.maxhp; }   // (kept awake and alive through the summons)
      return { me: [+me.x.toFixed(1), +me.y.toFixed(1)], traps, boss: b2 ? (b2.fiend || b2.type) + ':' + b2.act : null, biome: D.F.biome, name: D.F.rift && D.F.rift.name, zoom: +D.g.zoom.toFixed(3) };
    }, [kind]);
    await page.evaluate(() => window.__R3wrap());
    console.log(`\n== ${sc} (stage ${idx}, ${kind}, loaded in ${((Date.now() - t0) / 1000).toFixed(0)} s)`, JSON.stringify(info));
    const S = out.scen[sc] = { idx, info, ults: {} };
    const hold = kind === 'land' ? [WALK] : null;
    await frames(16, { prof: false, hold });
    // the update alone (no drawing): 60 steps, the traps' share
    S.upd = await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; const T = window.__R3T; T.trap = 0; T.trapN = 0; const t = performance.now(); for (let k = 0; k < 60; k++) { D.me.hp = D.ST.hp; G.update(1 / 60); } const ms = (performance.now() - t) / 60; return { updMs: +ms.toFixed(2), trapMs: +(T.trap / 60).toFixed(3) }; });
    let r = await frames(F, { prof: true, hold }); S.base = summ(r.rows); S.baseRows = r.rows.map(x => x.tot); S.compiles = r.compiles; S.census = await census();
    console.log(` base  ${line(S.base)} | upd-only ${S.upd.updMs} ms (traps ${S.upd.trapMs}) | ${JSON.stringify(S.census)}`);
    if (kind === 'boss' || (process.env.SUMALL === '1' && kind !== 'puzzle')) for (const u of SUMMONS) {
      await page.evaluate(([u, el]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; const mv = P.ELEM_LIST[el]['ey_' + u]; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); /* (as the loading screen warms the party's Ultimate: StageLoad / 20b) */ const I = P.ELEM_IMPL && P.ELEM_IMPL[el] && P.ELEM_IMPL[el].ult[u]; if (I && I.warm) try { I.warm({ evo: 7, T: () => (G.Tz ? G.Tz() : 48) }); } catch (e) {} }, [u, EL[u]]);
      await frames(4, { prof: false });
      const c0 = await census();
      const cast = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g, me = D.me; me.mp = 999; g.cdU = 0; g.intro = 0; const RU = D.RULES; if (RU && RU.blocks && !RU.__po) { const b0 = RU.blocks; RU.blocks = k => k === 'noult' ? false : b0.call(RU, k); RU.__po = 1; } const n0 = D.ELEM ? D.ELEM.fx.length : 0; const t = performance.now(); D.useUlt(); const ms = performance.now() - t; window.__PF_F = D.ELEM && D.ELEM.fx[D.ELEM.fx.length - 1]; return { fx: (D.ELEM ? D.ELEM.fx.length : 0) - n0, castMs: +ms.toFixed(1) }; });
      r = await frames(6, { prof: false }); const first = summ(r.rows), firstRows = r.rows.map(x => ({ tot: +x.tot.toFixed(0), glmN: x.glmN, glmR: x.cvResizeGLM, glBufKB: Math.round(x.glBufB / 1024), glTex: x.glTex, comp: x.glCompile, cvNew: x.cvNew, heapKB: Math.round(x.heap / 1024) })), comp = r.compiles;
      await page.evaluate(at => { const G = window.__pp.arc.game, D = G._dbg, f = window.__PF_F; let k = 0; while (f && f.t < at && k++ < 900) { D.me.hp = D.ST.hp; D.me.mp = 999; const b = D.g.boss; if (b) b.hp = Math.max(b.hp, b.maxhp * 0.6); G.update(1 / 60); } }, AT[u]);
      r = await frames(F, { prof: true }); const busy = summ(r.rows); const cb = await census(); cb.glmPasses = await page.evaluate(() => window.__R3P.slice(-6).map(p => p.join('x')).join(' '));
      S.ults[u] = { cast, first, firstRows, busy, busyRows: r.rows.map(x => x.tot), compiles: comp, census0: c0, census: cb };
      console.log(` ${u.padEnd(10)} cast ${cast.castMs} ms, fx ${cast.fx} | first ${JSON.stringify(firstRows)} | busy ${line(busy)} | ${JSON.stringify(cb)}`);
      await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 60 * 40; k++) { D.me.hp = D.ST.hp; const b = D.g.boss; if (b) b.hp = Math.max(b.hp, b.maxhp * 0.6); G.update(1 / 60); if (!D.ELEM || !D.ELEM.fx.length) break; } if (D.helpers) D.helpers.length = 0; });
      if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
    }
    if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  console.log('\npage errors', errors.length, errors.slice(0, 4));
  await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
function p95(L) { const v = L.slice().sort((a, b) => a - b); return v[Math.min(v.length - 1, Math.floor(v.length * 0.95))]; }
function line(s) {
  const pr = Object.entries(s.pr).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + ' ' + v.toFixed(0)).join(', ');
  return `avg ${s.tot.toFixed(0)} ms (med ${s.med.toFixed(0)}, worst ${s.worst.toFixed(0)}) upd ${s.upd.toFixed(1)} draw ${s.draw.toFixed(0)} | FGFX ${s.fgFlush.toFixed(1)}p ${s.fgMs.toFixed(0)} ms layers ${s.fgLayers.toFixed(1)} | GLM ${s.glmN.toFixed(1)} passes ${s.glmMs.toFixed(0)} ms, GLM canvas realloc ${s.cvResizeGLM.toFixed(2)}/f, all resizes ${s.cvResize.toFixed(2)} | 2D ${(s.diA / 1e6).toFixed(1)} Mpx, grad ${s.grad.toFixed(1)}, cvNew ${s.cvNew.toFixed(2)} | glBuf ${(s.glBufB / 1024).toFixed(0)} kB, tex ${s.glTex.toFixed(1)}, compiles ${s.glCompile.toFixed(2)} | heap ${(s.heapPos / 1024).toFixed(0)} kB/f | ${pr}`;
}
module.exports = { p95 };
