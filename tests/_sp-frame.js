// v439 SP: frame cost in ordinary fights at a phone's size (390x844, DPR 3: the dungeon canvas then runs at its cap, arc.dpr 2),
// measured by tests/_pf-lib.js: a Rift 02 Garden fight stage (section 2 or 3) with a crowd round the pet, then the pet's skill,
// Sunflare, an Anima summoned (Asmodeus, Samael: at rest, in its Cataclysm State, in Furnace Overdrive, charging in the Cataclysm),
// every GPU path forced on the software rasteriser at a phone's resolution. Besides the PF counters, every GLM pass (its size in
// device px, items, draw calls, triangles) and the WebGL -> 2D copies of the frame (FGFX layers laid + GLM passes laid).
// usage: HTML=<test html> node tests/_sp-frame.js   env: STAGE (3: section 2's fight; 6: section 3's), SCN (base,skill,sunflare,
//   asmo,samael,cata,over,catacharge,wrath), F (8 frames each), N (20 monsters), K (the Animas' form, 3), LOW=1 (st.lowFx),
//   OFF=1 (window.__SP_OFF = 1: v438's behaviour), OUT=file.json, DPR (3), RIFT (garden), GQ (auto|high|balanced|perf: Settings > Visual
//   quality; the hand-driven frames never step Auto), SAME=1 (same-page A/B against __SP_OFF, with pixel comparisons into OUTDIR)
process.env.RIFT = process.env.RIFT || 'garden';
const { open, summ } = require('./_pf-lib');
const fs = require('fs'), path = require('path'); let TL = null, TS = null;
const SCN = (process.env.SCN || 'base,skill,sunflare,asmo,samael,cata').split(','), F = +(process.env.F || 8), NM = +(process.env.N || 20), K = +(process.env.K || 3);
const GLMLOG = () => { window.__SPT = { n: 0, px: 0, big: 0 };   /* (each GLM pass: its viewport, on the GLM context (the one made with a depth buffer)) */
  for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const P = G.prototype, o = P.viewport; P.viewport = function (x, y, w, h) { if (this.__pfK === 'glm' && w * h > 64) { const T = window.__SPT; T.n++; T.px += w * h; T.big = Math.max(T.big, w * h); } return o.apply(this, arguments); }; }
  window.__SPHOOK = () => true;
  window.__PFX = () => { const T = window.__SPT; return { glmPass: T.n, glmPx: T.px }; }; };
(async () => {
  const flags = { __SM_GL: 1, __SM_GLHQ: 1, __AS_GL: 1, __AS_GLHQ: 1, __BL_GL: 1, __BL_GLHQ: 1, __AB_GL: 1, __AB_GLHQ: 1 };
  if (process.env.OFF === '1') flags.__SP_OFF = 1;
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 3), rift: process.env.RIFT, flags, init: GLMLOG }); const { page, errors, start, frames } = T;
  await page.evaluate(([K, LOW, GQ]) => { const P = window.__pp; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.eq = 'aries'; P.st.animas.res = null; if (LOW) P.st.lowFx = true; P.st.dlv = 33; if (GQ) P.st.gq = GQ; }, [K, process.env.LOW === '1', process.env.GQ || '']);
  const out = { html: process.env.HTML, off: process.env.OFF === '1', low: process.env.LOW === '1', scen: {} };
  const t0 = Date.now(); await start(+(process.env.STAGE || 3));
  const info = await page.evaluate(NM => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; window.__SPHOOK();
    for (let k = 0; k < 90; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -7; dx <= 8 && ok; dx++) for (let dy = -5; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 1; me.y = best.y + 1; }
    const brood = D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still);
    brood.forEach((m, i) => { if (i < NM) { const b = i / NM * 6.283, r = 2.0 + (i % 4) * 1.0; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 1.5 + Math.sin(b) * r * 0.75, hp: 1e9, maxhp: 1e9, aggro: true, spd: 0, atkCd: 99, dmg: 0 }); } });
    g.intro = 0; D.banners.length = 0; D.SKIP.fog = true; me.face = 1;
    for (let k = 0; k < 120; k++) { me.hp = D.ST.hp; G.update(1 / 60); }
    window.__SPHOLD = () => { me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) { m.atkCd = 99; } if (D.eshots) D.eshots.length = 0; };
    return { me: [+me.x.toFixed(1), +me.y.toFixed(1)], mons: D.mons.filter(m => !m.dead).length, near: brood.length, biome: D.F.biome, name: D.F.name, dpr: P.arc.dpr, cv: [P.arc.ctx ? P.arc.ctx.canvas.width : 0, P.arc.ctx ? P.arc.ctx.canvas.height : 0], dunCap: P.arc.dunCap, retro: !!(P.retro && P.retro.on) };
  }, NM);
  console.log(`== stage ${process.env.STAGE || 3} loaded in ${((Date.now() - t0) / 1000).toFixed(0)} s`, JSON.stringify(info)); out.info = info;
  const HOLD = ['window.__SPHOLD()'];
  /* SAME=1: the same page and state, v438's behaviour (window.__SP_OFF = 1) and v439's alternating frame by frame (F a side), and the same
     frame (clock, dice, Date.now held) drawn off / on / off (the control), compared pixel by pixel and saved side by side (off | on | diff x16) */
  if (process.env.SAME === '1') { const OUTD = path.resolve(__dirname, '..', process.env.OUTDIR || 'shots/v439-SP'); fs.mkdirSync(OUTD, { recursive: true });
    const same = async name => { const r = await page.evaluate(async () => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d');
      const pn = performance.now.bind(performance), mr = Math.random, dn = Date.now, T0 = pn(), D0 = dn(); D.g.negT = 0; D.g.negF = 0; if (D.cam) D.cam.sm = 0;
      const draw = off => { window.__SP_OFF = off; performance.now = () => T0; Date.now = () => D0; let s = 777; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; try { c.save(); G.draw(c); c.restore(); if (P.retro) P.retro.post(cv, c); } finally { performance.now = pn; Math.random = mr; Date.now = dn; } return c.getImageData(0, 0, cv.width, cv.height); };
      const a = draw(1), b = draw(0), a0 = draw(1); window.__SP_OFF = 0; let n8 = 0, mx = 0, c8 = 0; const d = new Uint8ClampedArray(a.data.length);
      for (let i = 0; i < a.data.length; i += 4) { let m = 0, q = 0; for (let k = 0; k < 3; k++) { m = Math.max(m, Math.abs(a.data[i + k] - b.data[i + k])); q = Math.max(q, Math.abs(a.data[i + k] - a0.data[i + k])); } if (q > 8) c8++; if (m > 8) n8++; if (m > mx) mx = m; const e = Math.min(255, m * 16); d[i] = e; d[i + 1] = e; d[i + 2] = e; d[i + 3] = 255; }
      const sh = document.createElement('canvas'), w = cv.width, h = cv.height; sh.width = w * 3 + 16; sh.height = h; const x = sh.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, sh.width, h); x.putImageData(a, 0, 0); x.putImageData(b, w + 8, 0); x.putImageData(new ImageData(d, w, h), w * 2 + 16, 0);
      return { px: a.data.length / 4, n8, max: mx, ctrl8: c8, png: sh.toDataURL('image/png') }; });
      fs.writeFileSync(path.join(OUTD, `same-${name}.png`), Buffer.from(r.png.split(',')[1], 'base64')); delete r.png; return r; };
    const ab = async (name, extraHold) => { const on = [], off = []; for (let k = 0; k < F; k++) for (const o of k % 2 ? [0, 1] : [1, 0]) { await page.evaluate(o => { window.__SP_OFF = o; }, o); const r = (await frames(1, { prof: false, hold: HOLD.concat(extraHold || []) })).rows[0]; (o ? off : on).push(r); } await page.evaluate(() => { window.__SP_OFF = 0; });
      const md = (L, k) => { const v = L.map(r => r[k] || 0).sort((a, b) => a - b); return v[v.length >> 1]; }, mn = (L, k) => L.reduce((a, r) => a + (r[k] || 0), 0) / L.length;
      const S = L => ({ tot: +md(L, 'tot').toFixed(0), copies: +(mn(L, 'diGL') + mn(L, 'glmN')).toFixed(1), fgLayers: +mn(L, 'diGL').toFixed(1),   /* (v439 SP: every FGFX layer laid, counted at its drawImage: a kept wind pass is laid by FGFX itself, outside F.flush) */ glm: +mn(L, 'glmN').toFixed(1), compMpx: +(mn(L, 'diGLA') / 1e6).toFixed(2), glmLaidMpx: +(mn(L, 'glmA') / 1e6).toFixed(2), glmGLMpx: +(mn(L, 'x_glmPx') / 1e6).toFixed(2), fillMpx: +(mn(L, 'fgFillV') / 1e6).toFixed(2), di: +mn(L, 'di').toFixed(0), diMpx: +(mn(L, 'diA') / 1e6).toFixed(1), cvNew: +mn(L, 'cvNew').toFixed(1), heapKB: +(mn(L, 'heap') / 1e3).toFixed(0) });
      return { v438: S(off), v439: S(on) }; };
    global.__SAME = { same, ab }; }
  const measure = async (name, extraHold) => { if (global.__SAME) { await frames(3, { prof: false, hold: HOLD.concat(extraHold || []) }); const r = { same: await global.__SAME.same(name), ab: await global.__SAME.ab(name, extraHold) }; out.scen[name] = r; console.log(` ${name.padEnd(12)} ${JSON.stringify(r)}`); if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out)); return r; } await frames(4, { prof: false, hold: HOLD.concat(extraHold || []) }); const r = await frames(F, { prof: true, hold: HOLD.concat(extraHold || []) }); const s = summ(r.rows); out.scen[name] = { s, rows: r.rows, compiles: r.compiles };
    const pr = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, AN = D.AN, o = {}; for (const k of ['sm', 'as', 'bl', 'ab']) { const M = AN && AN[k]; if (M && M.fx && M.fx.length) { const c = {}; for (const f of M.fx) c[f.kind] = (c[f.kind] || 0) + 1; o[k] = c; } }
      const S = window.SAMAEL_GL && window.SAMAEL_GL.STATS; if (S && S.n) o.smGL = [S.W, S.H, S.items, +S.ms.toFixed(0)]; const S2 = window.ASMODEUS_GL && window.ASMODEUS_GL.STATS; if (S2 && S2.n) o.asGL = [S2.W, S2.H, S2.items]; o.texts = D.texts ? D.texts.length : -1; o.parts = D.parts.length; return o; });
    s.probe = pr;
    console.log(` ${name.padEnd(12)} ${line(s)}\n      ${JSON.stringify(pr)}`); if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
    if (process.env.TRACE === '1') {   // (where the frame's gradients, patterns, new canvases and canvas resizes come from: the page's line mapped to its source file)
      await page.evaluate(() => { window.__PFC.trace = {}; }); await frames(4, { prof: false, hold: HOLD.concat(extraHold || []) }); const tr = await page.evaluate(() => { const t = window.__PFC.trace; window.__PFC.trace = null; return t; });
      const html = path.resolve(__dirname, '..', process.env.HTML), lines = (TL = TL || fs.readFileSync(html, 'utf8').split('\n')), srcs = (TS = TS || fs.readdirSync(path.resolve(__dirname, '../src/js')).map(f => [f, fs.readFileSync(path.resolve(__dirname, '../src/js', f), 'utf8')]));
      for (const [k, n] of Object.entries(tr).sort((a, b) => b[1] - a[1]).slice(0, 18)) { const ln = +k.split(' ')[1], text = (lines[ln - 1] || '').trim().slice(0, 80), f = srcs.find(([, q]) => text.length > 20 && q.includes(text)); console.log(`   ${(n / 4).toFixed(1).padStart(6)}  ${k.padEnd(40)} ${f ? f[0] : '?'}  ${text.slice(0, 50)}`); } }
    return s; };
  const ev = (f, a) => page.evaluate(f, a);
  const reset = () => ev(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 60 * 12; k++) { window.__SPHOLD(); G.update(1 / 60); if ((!D.ELEM || !D.ELEM.fx.length)) break; } if (D.helpers) D.helpers.length = 0; });
  const summon = (id) => ev(([id, K]) => { const G = window.__pp.arc.game, D = G._dbg, AN = D.AN; if (!AN || !AN.kit) return 'no kit'; AN.S.list.forEach(a => { a.life = 0.01; }); for (let k = 0; k < 60 * 18 && AN.S.list.length; k++) { window.__SPHOLD(); G.update(1 / 60); } if (AN.stop) try { AN.stop(); } catch (e) {}
    AN.kit.main.id = id; AN.kit.main.k = K; AN.kit.res = null; AN.kit.resonance = null; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); const ok = AN.summon();
    for (let k = 0; k < 60 * 5.5; k++) { window.__SPHOLD(); G.update(1 / 60); } const a = AN.S.list[0]; return { ok, st: a && a.st, id: a && a.id }; }, [id, K]);
  for (const sc of SCN) {
    if (sc === 'base') await measure('base');
    else if (sc === 'skill') { const r = await ev(() => { const D = window.__pp.arc.game._dbg; D.g.cdS = 0; D.me.mp = 999; const n0 = D.ELEM ? D.ELEM.fx.length : 0; D.useStrong('strong'); return { kit: D.KIT.strong && (D.KIT.strong.id || D.KIT.strong.name), fx: (D.ELEM ? D.ELEM.fx.length : 0) - n0 }; }); console.log('  skill', JSON.stringify(r));
      await ev(() => { const G = window.__pp.arc.game; for (let k = 0; k < 20; k++) { window.__SPHOLD(); G.update(1 / 60); } }); await measure('skill'); await reset(); }
    else if (sc === 'sunflare') { await ev(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g; D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST.light.ey_sunflare, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); g.cdU = 0; const RU = D.RULES; if (RU && RU.blocks && !RU.__po) { const b0 = RU.blocks; RU.blocks = k => k === 'noult' ? false : b0.call(RU, k); RU.__po = 1; } D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; let k = 0; while (f && f.t < 2.6 && k++ < 600) { window.__SPHOLD(); G.update(1 / 60); } });
      await measure('sunflare'); await reset(); }
    else if (sc === 'wind') {   // stacked wind: Blades of Wind (its ring stays 20 s), then Coconut Cyclone and Gust of Wind cast into it, again and again
      const cast = k => ev(k => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.setKit('strong', Object.assign(P.elemAbility(P.ELEM_LIST.wind['ex_' + k], 'strong', P.st), { cost: 0, cd: 0, evo: 7 })); D.g.cdS = 0; D.me.mp = 999; D.useStrong('strong'); for (let i = 0; i < 30; i++) { window.__SPHOLD(); G.update(1 / 60); } }, k);
      await cast('windblades'); await cast('cyclone'); await cast('gust'); await cast('cyclone'); await cast('gust'); await measure('wind'); await reset(); }
    else if (sc === 'asmo') { console.log('  summon', JSON.stringify(await summon('scorpio'))); await measure('asmo'); }
    else if (sc === 'samael') { console.log('  summon', JSON.stringify(await summon('aries'))); await measure('samael', ['(() => { const a = window.__pp.arc.game._dbg.AN.S.list[0]; if (a && a.sm) { a.sm.gap = 9; a.life = 25; } })()']); }
    else if (sc === 'cata') { await ev(() => { const G = window.__pp.arc.game, a = G._dbg.AN.S.list[0]; if (!a || !a.sm) return; a.sm.ruin = 100; a.sm.cata = 12; a.sm.gap = 9; for (let k = 0; k < 60; k++) { window.__SPHOLD(); a.sm.gap = 9; G.update(1 / 60); } }); await measure('cata', ['(() => { const a = window.__pp.arc.game._dbg.AN.S.list[0]; if (a && a.sm) { a.sm.gap = 9; a.sm.cata = Math.max(a.sm.cata, 6); a.life = 25; } })()']); }
    else if (sc === 'catacharge') { await ev(() => { const G = window.__pp.arc.game, D = G._dbg, a = D.AN.S.list[0]; if (!a || !a.sm) return; a.sm.cata = 12; D.AN.sm.cast(a, 'charge'); for (let k = 0; k < 40; k++) { window.__SPHOLD(); G.update(1 / 60); } }); await measure('catacharge', ['(() => { const a = window.__pp.arc.game._dbg.AN.S.list[0]; if (a && a.sm) { a.sm.cata = Math.max(a.sm.cata, 6); a.life = 25; } })()']); }
    else if (sc === 'over') { await ev(() => { const G = window.__pp.arc.game, D = G._dbg, a = D.AN.S.list[0]; if (!a || !a.sm) return; a.sm.cata = 0; D.AN.sm.cast(a, 'over'); for (let k = 0; k < 120; k++) { window.__SPHOLD(); G.update(1 / 60); } }); await measure('over', ['(() => { const a = window.__pp.arc.game._dbg.AN.S.list[0]; if (a && a.sm) { a.sm.gap = 9; a.life = 25; } })()']); }
    else if (sc === 'wrath') { await ev(() => { const G = window.__pp.arc.game, D = G._dbg, a = D.AN.S.list[0]; if (!a) return; a.life = 0.01; for (let k = 0; k < 60 * 9.4; k++) { window.__SPHOLD(); G.update(1 / 60); } }); await measure('wrath'); }
  }
  out.errors = errors; if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  console.log('\npage errors', errors.length, errors.slice(0, 4));
  await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
function line(s) {
  const pr = Object.entries(s.pr).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ' ' + v.toFixed(0)).join(', ');
  const x = k => s['x_' + k] || 0;
  return `${s.tot.toFixed(0)} ms (med ${s.med.toFixed(0)}) draw ${s.draw.toFixed(0)} post ${s.post.toFixed(1)} | copies ${(s.fgLayers + s.glmN).toFixed(1)} (FGFX ${s.fgLayers.toFixed(1)} layers ${(s.diGLA / 1e6).toFixed(2)} Mpx in ${s.fgFlush.toFixed(1)} flushes, ${s.fgMs.toFixed(0)} ms; GLM ${s.glmN.toFixed(1)} laid / ${x('glmPass').toFixed(1)} passes ${(x('glmPx') / 1e6).toFixed(2)} Mpx GL (${(s.glmA / 1e6).toFixed(2)} laid) ${(s.glmVerts / 3e3).toFixed(0)}k tris ${s.glmDraw.toFixed(0)} draws, ${s.glmMs.toFixed(0)} ms) | fill ${(s.fgFillV / 1e6).toFixed(2)} Mpx | 2D di ${s.di.toFixed(0)} (${(s.diA / 1e6).toFixed(1)} Mpx) grad ${s.grad.toFixed(1)} cv+ ${s.cvNew.toFixed(1)} rsz ${s.cvResize.toFixed(1)} lighter ${s.lighter.toFixed(0)} (${(s.lighterA / 1e6).toFixed(1)} Mpx) | heap ${(s.heapPos / 1e3).toFixed(0)} kB | ${pr}`;
}
