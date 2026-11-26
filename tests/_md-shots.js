// (v450 MD, v455 MD2) Moby Dick in the game: a strip of the sequence's phases per tier on the Tower (the largest room, monsters round the aim),
// every GPU path forced on the software rasteriser (FGFX, GLM), at a phone's size (390 x 844) and DPR (env DPR, default 1). The arcade's
// loop is stopped and frames stepped by hand (update 1/30 between shots, a full draw at each). Also checks: no page errors, the GLM
// buffers back to 0 after leaving the stage mid-cast, a second cast reusing the mesh, the 2D path (NOGL=1: no WebGL at all).
// usage: HTML=<test html> [DPR=3] [EVOS=1,4,7] [NOGL=1] node tests/_md-shots.js     (pngs into shots/v455-MD2/, or OUT=dir)
const { open } = require('./_pf-lib');
const path = require('path'), fs = require('fs');
(async () => {
  const DPR = +(process.env.DPR || 1), EVOS = (process.env.EVOS || '1,4,7').split(',').map(Number), NOGL = process.env.NOGL === '1', OUT = process.env.OUT || path.resolve(__dirname, '../shots/v455-MD2');
  fs.mkdirSync(OUT, { recursive: true });
  const T = await open({ html: process.env.HTML, dpr: DPR, gpu: !NOGL, flags: Object.assign(NOGL ? { __NG_GL: 0, __MD_GL: 0 } : { __MD_GL: 1, __MD_GLHQ: 1 }, process.env.DBG ? { __MDDBG: 1 } : {}) });
  const { page, errors } = T;
  if (NOGL) await page.evaluate(() => { HTMLCanvasElement.prototype.getContext = (o => function (t) { return /webgl/.test(t) ? null : o.apply(this, arguments); })(HTMLCanvasElement.prototype.getContext); });
  const DUN = (process.env.DUN || '3,11').split(',').map(Number);   // (v455 MD2: DUN=d,f another floor)
  await page.evaluate(DUN => { const P = window.__pp; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(DUN[0], DUN[1]); }, DUN);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.game._dbg.g.intro = 0; });
  const step = (secs, draw) => page.evaluate(([secs, draw]) => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX;
    const n = Math.max(1, Math.round(secs * 30)); for (let i = 0; i < n; i++) { if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } A.t += 1 / 30; G.update(1 / 30); for (const m of D.mons) if (m.__hold) { m.x = m.__hold[0]; m.y = m.__hold[1]; } }
    if (draw) { c.save(); G.draw(c); c.restore(); if (F && F.frameEnd) F.frameEnd(); if (P.retro) P.retro.post(c.canvas, c); } return D.g.t; }, [secs, draw]);
  const shot = async name => { await step(1 / 30, true); await page.screenshot({ path: path.join(OUT, name + '.png') }); };
  const PET = (process.env.PET || '-2.0,2.8').split(',').map(Number);   // (v455 MD2: the pet's place from the aim: up-right of it by default, a natural aim; v450's scene was -3.6,0.6)
  const ROOM = +(process.env.ROOM || 0);
  const setup = async evo => { await page.evaluate(([evo, PET, ROOM]) => {
    const P = window.__pp, D = P.arc.game._dbg, me = D.me, X = D.ELEM.H.X; X.isExp = () => true;   // (the test's room is open: no fog)
    const R = window.__mdRoom || (window.__mdRoom = D.M.rooms.slice().sort((a, b) => b.w * b.h - a.w * a.h)[ROOM] || D.M.rooms[0]), T = { x: R.x + R.w / 2, y: R.y + R.h / 2 };   // (ROOM: the n-th largest room, 0 the largest)
    me.x = T.x + PET[0]; me.y = T.y + PET[1]; me.dead = false; me.face = 1; D.g.cdU = 0; me.mp = 999;
    // ten monsters round the aim, held in place (so every strip shows the same scene), the rest far away
    const L = D.mons.filter(m => !m.boss && !m.dead); let i = 0;
    const spots = [[0.3, -0.2], [-1.4, 1.1], [1.6, 1.4], [2.6, -1.3], [-0.6, -2.4], [3.4, 2.6], [-2.6, -1.6], [0.8, 3.4], [4.2, 0.2], [-3.3, 2.9]];
    for (const m of L) { if (i < spots.length) { m.x = T.x + spots[i][0]; m.y = T.y + spots[i][1]; m.hp = m.maxhp = 1e7; m.__hold = [m.x, m.y]; m.act = 'chase'; i++; } else { m.x = T.x + 80; m.y = T.y + 80; m.__hold = [m.x, m.y]; } }
    D.zones.length = 0; D.eshots.length = 0; window.__mdT = T;
  }, [evo, PET, ROOM]);
  await step(1.5, false);   // (the camera settles on the pet)
  return page.evaluate(evo => { const P = window.__pp, D = P.arc.game._dbg, T = window.__mdT; D.zones.length = 0; D.eshots.length = 0;
    const mv = P.ELEM_LIST.water.ey_mobydick, ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, evo, tier: evo >= 7 ? 2 : 1 }); D.setKit('ult', ab);
    D.ELEM.ult('mobydick', { a: 0, base: D.ST.atk * ab.mult, el: 'water', e8: 'water', evo, tx: T.x, ty: T.y, up: evo >= 7 });
    const f = D.ELEM.fx.find(q => q.key === 'mobydick'); const H = D.ELEM.H, lib = P.ELEM_IMPL.water.ult.mobydick.lib; if (window.__MDDBG && f) { const V = { cx: D.me.x - (H.sx(D.me.x) - P.arc.W / 2) / H.X.Tz(), cy: D.me.y - (H.sy(D.me.y) - P.arc.H / 2) / H.X.Tz(), hw: P.arc.W / 2 / H.X.Tz() / lib.TUNE.zoomOut, hh: P.arc.H / 2 / H.X.Tz() / lib.TUNE.zoomOut, dbg: [] }; lib.choosePath(f.S.W, T.x, T.y, D.me, V); window.__MDDBG = V.dbg; } const sc = p => p ? [Math.round(H.sx(p.x)), Math.round(H.sy(p.y))] : null; const ap = f ? Array.from({ length: 12 }, (_, i) => { const P = f.S.path, u = i / 11; return f.S.W.on(P.B.x + (P.S.x - P.B.x) * u, P.B.y + (P.S.y - P.B.y) * u) ? 1 : 0; }).join('') : '';   /* (v455 MD2: the approach's course over the water, B .. its start) */
    return { ap, psi: f ? f.S.path.psi : 0, life: f ? f.life : 0, tiles: f ? f.S.W.tiles.length : 0, yaw: f ? +f.S.path.yaw.toFixed(2) : null, dbg: window.__MDDBG, scr: f ? { B: sc(f.S.path.B), E: sc(f.S.path.E), T: sc(T), me: sc(D.me), Tz: H.X.Tz(), W: P.arc.W, H: P.arc.H } : null };
  }, evo); };
  const TU = await page.evaluate(() => window.__pp.ELEM_IMPL.water.ult.mobydick.TUNE);
  // the beats (v455 MD2): the water forming, the approach, the breach, the arc, the dive, the tail standing, the slap, the rings, the swim away, the water settling
  const PH = process.env.PH ? JSON.parse(process.env.PH) : [['01-form', 0.5], ['02-approach', 1.2], ['03-breach', TU.breach + 0.1], ['04-emerge', TU.breach + 0.38], ['05-apex', TU.apex], ['06-dive', TU.reenter + 0.06],
    ['07-submerge', TU.reenter + 0.35], ['08-tailup', TU.whip], ['09-slap', TU.slap + 0.02], ['10-ring', TU.slap + 0.4], ['11-rings', TU.slap + 1.0], ['12-away', TU.slap + 1.5], ['13-settle', -0.7]];
  const res = {};
  for (const evo of EVOS) {
    const S = await setup(evo); let t = 0; res[evo] = S;
    for (const [nm, at] of PH) { const tt = at < 0 ? S.life + at : at; if (tt <= t) continue; await step(tt - t - 1 / 30, false); t = tt; await shot(`game-${NOGL ? '2d' : 'gl'}-e${evo}-d${DPR}-${nm}`); }
    await step(S.life - t + 0.3, false);
    res[evo].fxLeft = await page.evaluate(() => window.__pp.arc.game._dbg.ELEM.fx.length);
  }
  // the GPU buffers: in use after a cast, back to 0 when the stage is left mid-cast; the mesh kept for the next cast
  const gpu = await page.evaluate(() => { const G = self.MOBY_GL; return { nv: G.nv, n: G.gpuCount() }; });
  await setup(4); await step(2.4, true);
  const mid = await page.evaluate(() => ({ n: self.MOBY_GL.gpuCount(), fx: window.__pp.arc.game._dbg.ELEM.fx.length }));
  await page.evaluate(() => window.__pp.closeArcade(true));
  const after = await page.evaluate(() => ({ n: self.MOBY_GL.gpuCount(), nv: self.MOBY_GL.nv, open: window.__pp.arc.open }));
  console.log(JSON.stringify({ res, gpu, mid, after }));
  console.log(errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 6)) : 'no page errors');
  await T.browser.close();
})();
