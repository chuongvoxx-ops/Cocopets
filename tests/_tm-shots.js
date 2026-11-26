// (v451 TM, v454 TM2) Tiamat in the game: a strip of the sequence's phases per tier on the Tower (the largest room, monsters round the aim),
// every GPU path forced on the software rasteriser (FGFX, GLM), at a phone's size (390 x 844) and DPR (env DPR, default 1). The arcade's
// loop is stopped and frames stepped by hand (update 1/30 between shots, a full draw at each). Also checks: no page errors, the GLM
// buffers back to 0 after leaving the stage mid-cast, a second cast reusing the meshes, the 2D path (NOGL=1: no WebGL at all).
// usage: HTML=<test html> [DPR=3] [EVOS=1,4,7] [NOGL=1] node tests/_tm-shots.js     (pngs into shots/v454-TM2/, SHOTDIR= to change)
const { open } = require('./_pf-lib');
const path = require('path'), fs = require('fs');
(async () => {
  const DPR = +(process.env.DPR || 1), EVOS = (process.env.EVOS || '1,4,7').split(',').map(Number), NOGL = process.env.NOGL === '1', OUT = path.resolve(__dirname, '../shots/' + (process.env.SHOTDIR || 'v454-TM2'));
  fs.mkdirSync(OUT, { recursive: true });
  const T = await open({ html: process.env.HTML, dpr: DPR, gpu: !NOGL, flags: NOGL ? { __NG_GL: 0, __TM_GL: 0 } : { __TM_GL: 1, __TM_GLHQ: 1 } });
  const { page, errors } = T;
  if (NOGL) await page.evaluate(() => { HTMLCanvasElement.prototype.getContext = (o => function (t) { return /webgl/.test(t) ? null : o.apply(this, arguments); })(HTMLCanvasElement.prototype.getContext); });
  await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.game._dbg.g.intro = 0; });
  const step = (secs, draw) => page.evaluate(([secs, draw]) => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX;
    const n = Math.max(1, Math.round(secs * 30)); for (let i = 0; i < n; i++) { if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } A.t += 1 / 30; G.update(1 / 30); for (const m of D.mons) if (m.__hold) { m.x = m.__hold[0]; m.y = m.__hold[1]; } }
    if (draw) { c.save(); G.draw(c); c.restore(); if (F && F.frameEnd) F.frameEnd(); if (P.retro) P.retro.post(c.canvas, c); } return D.g.t; }, [secs, draw]);
  const shot = async name => { await step(1 / 30, true); await page.screenshot({ path: path.join(OUT, name + '.png') }); };
  const setup = async evo => { await page.evaluate(evo => {
    const P = window.__pp, D = P.arc.game._dbg, me = D.me, X = D.ELEM.H.X; X.isExp = () => true;   // (the test's room is open: no fog)
    const R = window.__tmRoom || (window.__tmRoom = D.M.rooms.reduce((a, r) => (r.w * r.h > a.w * a.h ? r : a))), T = { x: R.x + R.w / 2, y: R.y + R.h / 2 };
    me.x = T.x - 3.6; me.y = T.y + 0.6; me.dead = false; me.face = 1; D.g.cdU = 0; me.mp = 999;
    const L = D.mons.filter(m => !m.boss && !m.dead); let i = 0;
    const spots = [[0.3, -0.2], [-1.4, 1.1], [1.6, 1.4], [2.6, -1.3], [-0.6, -2.4], [3.4, 2.2], [-2.6, -1.6], [0.8, 3.4], [4.0, 0.2], [-3.3, 2.6]];
    for (const m of L) { if (i < spots.length) { m.x = T.x + spots[i][0]; m.y = T.y + spots[i][1]; m.hp = m.maxhp = 1e7; m.__hold = [m.x, m.y]; m.act = 'chase'; i++; } else { m.x = T.x + 80; m.y = T.y + 80; m.__hold = [m.x, m.y]; } }
    D.zones.length = 0; D.eshots.length = 0; window.__tmT = T;
  }, evo);
  await step(1.5, false);   // (the camera settles on the pet)
  return page.evaluate(evo => { const P = window.__pp, D = P.arc.game._dbg, T = window.__tmT; D.zones.length = 0; D.eshots.length = 0;
    const mv = P.ELEM_LIST.thunder.ey_tiamat, ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, evo, tier: evo >= 7 ? 2 : 1 }); D.setKit('ult', ab);
    D.ELEM.ult('tiamat', { a: 0, base: D.ST.atk * ab.mult, el: 'thunder', e8: 'thunder', evo, tx: T.x, ty: T.y, up: evo >= 7 });
    const f = D.ELEM.fx.find(q => q.key === 'tiamat'); return { life: f ? f.life : 0, tiles: f ? f.S.W.tiles.length : 0, hover: f ? f.S.H : null };
  }, evo); };
  const PH = [['01-forks', 0.42], ['02-form', 0.92], ['03-hover', 1.24], ['04-roar', 1.62], ['05-charge', 2.02], ['06-fold', 2.38], ['07-dive', 2.7], ['08-impact', 2.9], ['09-pulse', 3.36], ['10-pulses', 4.27], ['11-fade', -0.35]];
  const res = {};
  for (const evo of EVOS) {
    const S = await setup(evo); let t = 0; res[evo] = S;
    for (const [nm, at] of PH) { const tt = at < 0 ? S.life + at : at; if (tt <= t) continue; if (evo === 1 && nm === '10-pulses') continue; await step(tt - t - 1 / 30, false); t = tt; await shot(`game-${NOGL ? '2d' : 'gl'}-e${evo}-d${DPR}-${nm}`); }
    await step(S.life - t + 0.3, false);
    res[evo].fxLeft = await page.evaluate(() => window.__pp.arc.game._dbg.ELEM.fx.length);
  }
  // the GPU buffers: in use after a cast, back to 0 when the stage is left mid-cast; the meshes kept for the next cast
  const gpu = await page.evaluate(() => { const G = self.TIAMAT_GL; return { nv: G.nv, n: G.gpuCount() }; });
  await setup(4); await step(1.6, true);
  const mid = await page.evaluate(() => ({ n: self.TIAMAT_GL.gpuCount(), fx: window.__pp.arc.game._dbg.ELEM.fx.length }));
  await page.evaluate(() => window.__pp.closeArcade(true));
  const after = await page.evaluate(() => ({ n: self.TIAMAT_GL.gpuCount(), nv: self.TIAMAT_GL.nv, open: window.__pp.arc.open }));
  console.log(JSON.stringify({ res, gpu, mid, after }));
  console.log(errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 6)) : 'no page errors');
  await T.browser.close();
})();
