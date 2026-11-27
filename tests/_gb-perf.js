// v468 GB: GPU counters in the encounter's busiest moments (SwiftShader: the COUNTS are meaningful, its milliseconds are not):
// per drawn frame, the GL passes (GLM.render calls: Raziel, its props, spectral constructs; each is one copy onto the 2D canvas),
// the painter's (FGFX) flushes, quads and composited area. SCENES=p1,p2,m1,m2,m3,m4,m5,b1,b2,b3,b5,para,sun  DPR=1 SHOT=1 (also save shots)
const { open } = require('./_gb-lib');
const SC = (process.env.SCENES || 'p2,m3,m4,m5,b1,b3,b5,sun').split(','), DPR = +process.env.DPR || 1, SHOT = process.env.SHOT === '1';
const PRE = `const s = T.S; me.dead = false; GB.begin(s.X, s.H, s.self, s.A); T.skipIntro(); step(0.3); const A = T.S.A; const pass = id => { for (let i = 1; i < id; i++) if (!T.S.res[i]) T.S.res[i] = 'pass'; };`;
const SET = {
  p1: `hold(T.S.m.x + 1.5, T.S.m.y + 5.5); T.act('infernal'); step(1.7);`,
  p2: `pass(2); T.S.phase = 2; T.setK(0.75); hold(T.S.m.x - 3, T.S.m.y + 5); T.act('zero'); step(0.6); T.S.acts.push(...[]); T.act('meteor'); step(1.0);`,
  p5: `pass(6); T.S.phase = 5; T.setK(0.12); hold(T.S.m.x + 2, T.S.m.y + 5); T.act('fang'); step(0.5); T.act('guillotine'); step(1.2);`,
  m1: `T.start(1); hold(A.cx + 2, A.cy + 6); step(3.6);`,
  m2: `pass(2); T.start(2); hold(A.cx - 3, A.cy + 5); step(3.0);`,
  m3: `pass(3); T.start(3); hold(A.cx, A.cy + 5); step(4.5); const D3 = T.S.mech.data; for (const c of D3.cores) if (c.P) c.P.m.hp *= 0.6; step(0.8);`,
  m4: `pass(4); T.start(4); hold(A.cx + 3, A.cy + 5); step(4.6);`,
  m5: `pass(5); T.start(5); hold(A.cx + 5, A.cy + 4); step(6.4);`,
  b1: `pass(6); T.start(6); hold(A.cx - 3, A.cy + 3); step(6.0);`,
  b2: `pass(6); T.start(6); const M6 = T.S.mech; step(1); M6.data.st = M6.data.beams.s2b || 30; step(2.2);`,
  b3: `pass(6); T.start(6); const M6 = T.S.mech; step(1); M6.data.stage = 3; M6.data.st = 0; step(5.0);`,
  b4: `pass(6); T.start(6); const M6 = T.S.mech; step(1); M6.data.stage = 3; M6.data.st = 30; step(0.6);`,
  b5: `pass(6); T.start(6); const M6 = T.S.mech; step(1); M6.data.stage = 4; M6.data.frags = { F: { x: A.cx - 4, y: A.cy }, I: { x: A.cx + 4, y: A.cy } }; M6.data.got = { F: true, I: true }; hold(A.cx, A.cy); step(2.8);`,
  para: `T.start(1); T.markFail(1, 'test'); T.S.res[1] = 'fail'; T.S.mech = null; T.S.mode = 'fight'; T.start(2); T.markFail(2, 'test'); step(2.8);`,
  dead: `pass(7); T.S.phase = 5; T.S.res = [null, 'pass', 'pass', 'pass', 'pass', 'pass', 'pass']; T.setK(0.01); GB.onBossDeath(T.S.m); step(6.5);`,
  sun: `pass(6); T.S.phase = 5; T.setK(0.12); hold(T.S.m.x + 2, T.S.m.y + 5); T.act('fang'); step(0.4);`,
};
(async () => {
  const H = await open({ gl: true, dpr: DPR, lowFx: process.env.LOW === '1' });
  try { await H.start(); await H.fight();
    await H.M(() => { if (window.__glWrap) return; window.__glWrap = 1; window.__C = { gl: 0, q: 0 }; const C = window.__C, R = RAZIEL_GL;
      for (const k of ['draw', 'drawParts', 'drawSpectral']) { const f0 = R[k]; R[k] = function () { const r = f0.apply(this, arguments); if (r) C.gl++; return r; }; }
      const F = NIDHOGG_MOVES.FGFX, b0 = F.begin; F.begin = function () { const Q = b0.apply(this, arguments); if (Q && !Q.__gbw) { Q.__gbw = 1; for (const k of ['quad', 'shape', 'trap', 'smoke', 'satin']) { const f1 = Q[k]; if (typeof f1 === 'function') Q[k] = function () { C.q++; return f1.apply(this, arguments); }; } } return Q; }; });
    for (const k of SC) { const body = SET[k]; if (!body) continue;
      await H.ev(PRE + body + ` return 1;`);
      if (k === 'sun') { await H.page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg; const mv = P.ELEM_LIST.light.ey_sunflare; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.me.mp = 999; D.g.cdU = 0; D.g.intro = 0; D.useUlt(); for (let i = 0; i < 80; i++) G.update(1 / 30); }); }
      // three drawn frames (the game's own loop: the arcade is paused, its draw runs); then the counters of the last
      await H.M(() => { window.__pp.arc.paused = false; });
      const r = await H.page.evaluate(() => new Promise(res => { const C = window.__C, F = NIDHOGG_MOVES.FGFX, P = self.PERF, sv = () => { const s0 = typeof F.stats === 'function' ? F.stats() : F.stats; const GS = GEMINI_BOSS.test.S; return { mine: (GS && GS.glN) || 0, fr: (GS && GS.drawN) || 0, cpx: s0.cpxF || 0, runs: s0.runs || 0, cp: P ? P.cpAcc : 0 }; };
        let n = 0, a = null; const tick = () => { n++; if (n === 2) { C.gl = 0; C.q = 0; a = sv(); } if (n < 8) requestAnimationFrame(tick); else { const b = sv(), fr = Math.max(1, b.fr - a.fr); res({ frames: fr, modelPassesPerFrame: +(C.gl / fr).toFixed(2), bossPassesPerFrame: +((b.mine - a.mine) / fr).toFixed(2), glCopiesPerFrame: +((b.cp - a.cp) / fr).toFixed(2), fgxRunsPerFrame: +((b.runs - a.runs) / fr).toFixed(2), fgxQuadsPerFrame: Math.round(C.q / fr), compositePxPerFrame: Math.round((b.cpx - a.cpx) / fr), rz: RAZIEL_GL.STATS ? { items: RAZIEL_GL.STATS.items, calls: RAZIEL_GL.STATS.calls, tris: RAZIEL_GL.STATS.tris } : null }); } };
        requestAnimationFrame(tick); }));
      await H.M(() => { window.__pp.arc.paused = true; });
      const s2 = await H.ev(`return { mode: T.S ? T.S.mode : null, mech: T.S && T.S.mech ? T.S.mech.id + ':' + (T.S.mech.data.stage || T.S.mech.data.phase || '') : 0, haz: T.S ? T.S.haz.length : 0, fx: T.S ? T.S.fx.length : 0, ul: !!(T.S && T.S.ul), elem: D.ELEM ? D.ELEM.fx.length : 0, gpu: RAZIEL_GL.gpuCount() };`);
      console.log(k, JSON.stringify(Object.assign(r, s2)));
      if (SHOT) await H.shot('v468-GB', `${k}-dpr${DPR}${process.env.LOW === '1' ? '-low' : ''}`); }
    const after = await H.ev(`GB.stop(); return { gpu: RAZIEL_GL.gpuCount(), active: GB.active() };`); console.log('after stop', JSON.stringify(after));
  } catch (e) { console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 8)));
  await H.browser.close();
})();
