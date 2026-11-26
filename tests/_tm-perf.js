// (v451 TM) Tiamat's frame cost in a crowded Tower battle: 44 monsters awake round the aim (attacking: their own effects run),
// a phone's screen (390 x 844, DPR 3 by default), every GPU path forced on the software rasteriser (tests/_pf-lib.js counters).
// Phases: idle (before the cast), forks, forming, roar, charge, dive, impact, pulse 1, pulse 3 (Celestial), fade, after.
// Per phase (F frames of 1/60 s, frames stepped by hand): this machine's frame ms (median), JS ms (the frame less the GPU copies' waits),
// the WebGL -> 2D copies a frame (FGFX composites + GLM passes), GLM passes and GL pixels, FGFX quads. Read the ms relatively: the
// software rasteriser is many times slower than a phone's GPU.
// usage: HTML=<test html> node tests/_tm-perf.js    env: DPR (3), F (6), EVO (7), GQ (high|balanced|perf), LOW=1 (Fewer effects), OUT=file.json
const { open } = require('./_pf-lib');
const fs = require('fs'), path = require('path');
const GLMLOG = () => { window.__SPT = { n: 0, px: 0 };
  for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const P = G.prototype, o = P.viewport; P.viewport = function (x, y, w, h) { if (this.__pfK === 'glm' && w * h > 64) { const T = window.__SPT; T.n++; T.px += w * h; } return o.apply(this, arguments); }; }
  window.__PFX = () => { const T = window.__SPT; return { glmPass: T.n, glmPx: T.px }; }; };
(async () => {
  const DPR = +(process.env.DPR || 3), F = +(process.env.F || 6), EVO = +(process.env.EVO || 7);
  const T = await open({ html: process.env.HTML, dpr: DPR, flags: { __TM_GL: 1, __TM_GLHQ: 1 }, init: GLMLOG }); const { page, errors, frames } = T;
  await page.evaluate(([gq, low]) => { const P = window.__pp; if (gq) P.st.gq = gq; P.st.lowFx = !!low; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); }, [process.env.GQ || 'high', process.env.LOW === '1']);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.game._dbg.g.intro = 0; Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(4242); });
  // the crowd: 44 monsters on the floor round the aim (the largest room and the floor round it), awake, hp held high
  const crowd = await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, X = D.ELEM.H.X; X.isExp = () => true;
    const R = D.M.rooms.reduce((a, r) => (r.w * r.h > a.w * a.h ? r : a)), T = { x: R.x + R.w / 2, y: R.y + R.h / 2 }; me.x = T.x - 3.2; me.y = T.y + 0.8; window.__tmT = T;
    const L = D.mons.filter(m => !m.boss && !m.dead), spots = []; for (let r = 1; r < 9 && spots.length < 60; r += 0.9) for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283 + r, x = T.x + Math.cos(a) * r, y = T.y + Math.sin(a) * r * 0.8; if (!D.blocked(x, y, 0.4, 0)) spots.push([x, y]); }
    let n = 0; for (const m of L) { if (n < 44 && n < spots.length) { m.x = spots[n][0]; m.y = spots[n][1]; m.hp = m.maxhp = 1e9; m.act = 'chase'; m.sleep = false; n++; } }
    return { n, all: D.mons.length }; });
  const ff = secs => page.evaluate(secs => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg; const n = Math.round(secs * 30); for (let i = 0; i < n; i++) { D.me.hp = D.ST.hp; D.me.mp = 999; for (const m of D.mons) if (m.hp < 1e8 && m.maxhp >= 1e9) m.hp = 1e9; A.t += 1 / 30; G.update(1 / 30); } return D.g.t; }, secs);
  await ff(1.5);
  const md = (L, k) => { const v = L.map(r => r[k] || 0).sort((a, b) => a - b); return v[v.length >> 1]; }, mn = (L, k) => L.reduce((a, r) => a + (r[k] || 0), 0) / L.length;
  const S = L => ({ ms: +md(L, 'tot').toFixed(1), js: +(md(L, 'tot') - md(L, 'glmMs') - md(L, 'diGLms')).toFixed(1), copies: +(mn(L, 'diGL') + mn(L, 'glmN')).toFixed(1), fg: +mn(L, 'diGL').toFixed(1), glm: +mn(L, 'glmN').toFixed(1),
    glmMpx: +(mn(L, 'x_glmPx') / 1e6).toFixed(3), fgQuads: +mn(L, 'fgQuads').toFixed(0), fgFlush: +mn(L, 'fgFlush').toFixed(1), mons: Math.round(mn(L, 'mons')), fx: Math.round(mn(L, 'fx')) });
  const out = { dpr: DPR, evo: EVO, crowd, phases: {} };
  out.phases.idle = S((await frames(F, { prof: false })).rows);
  await page.evaluate(evo => { const P = window.__pp, D = P.arc.game._dbg, T = window.__tmT, mv = P.ELEM_LIST.thunder.ey_tiamat, ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, evo, tier: evo >= 7 ? 2 : 1 }); D.setKit('ult', ab);
    D.ELEM.ult('tiamat', { a: 0, base: D.ST.atk * ab.mult, el: 'thunder', e8: 'thunder', evo, tx: T.x, ty: T.y, up: evo >= 7 }); window.__tmT0 = D.g.t; }, EVO);
  const life = await page.evaluate(() => { const f = window.__pp.arc.game._dbg.ELEM.fx.find(q => q.key === 'tiamat'); return f ? f.life : 0; });
  const PH = [['forks', 0.4], ['form', 0.95], ['roar', 1.6], ['charge', 2.0], ['dive', 2.7], ['impact', 2.9], ['pulse1', 3.36], ['pulse3', 4.26], ['fade', life - 0.4], ['after', life + 0.4]];
  let t = 0;
  for (const [nm, at] of PH) { if (at > t) await ff(at - t); const L = (await frames(F, { prof: false })).rows; t = at + F / 60; out.phases[nm] = S(L); }
  out.glm = await page.evaluate(() => ({ stats: self.TIAMAT_GL.STATS, nv: self.TIAMAT_GL.nv, tris: self.TIAMAT_GL.ntri, gpu: self.TIAMAT_GL.gpuCount() }));
  console.log('phase      ms     js  copies  fg  glm  glmMpx  fgQuads  mons fx');
  for (const k in out.phases) { const p = out.phases[k]; console.log(k.padEnd(9), String(p.ms).padStart(6), String(p.js).padStart(6), String(p.copies).padStart(6), String(p.fg).padStart(4), String(p.glm).padStart(4), String(p.glmMpx).padStart(7), String(p.fgQuads).padStart(7), String(p.mons).padStart(5), String(p.fx).padStart(3)); }
  console.log(JSON.stringify({ crowd: out.crowd, glm: out.glm })); console.log(errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 5)) : 'no page errors');
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  await T.browser.close();
})();
