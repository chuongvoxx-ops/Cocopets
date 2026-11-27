// v468 GB (tests/_gb-gemini-shots.js): screenshots of the Gemini boss on the GPU (SwiftShader: slow; keep the list short). SCENES=intro,p1,m1,... DPR=1|3 LOW=1
// OUT=shots/v468-GB. Each scene: a fresh begin (reset), then what it needs, stepped at 1/30 s, then one shot.
const { open } = require('./_gb-lib');
const SC = (process.env.SCENES || 'p1,m1,m2').split(','), DPR = +process.env.DPR || 1, OUT = process.env.OUT || 'v468-GB';
const SET = {
  intro: `step(3.0);`,
  p1: `T.skipIntro(); step(0.3); hold(T.S.m.x + 1.5, T.S.m.y + 5.5); T.act('infernal'); step(1.7);`,
  talon: `T.skipIntro(); step(0.3); hold(T.S.m.x - 2, T.S.m.y + 5); T.act('talon'); step(1.6);`,
  fang: `T.skipIntro(); step(0.3); hold(T.S.m.x + 2, T.S.m.y + 5); T.act('fang'); step(1.3);`,
  p2: `T.skipIntro(); step(0.3); T.start(1); T.resolve(1); T.S.phase = 2; T.setK(0.75); T.S.vuln = null; hold(T.S.m.x - 3, T.S.m.y + 5); T.act('zero'); step(1.2); T.act('eruption'); step(1.0);`,
  m1: `T.skipIntro(); step(0.3); T.start(1); hold(T.S.A.cx + 2, T.S.A.cy + 6); step(3.6);`,
  m1w3: `T.skipIntro(); step(0.3); T.start(1); const M = T.S.mech; step(2.1); M.data.wi = 1; M.data.phase = 'gap'; M.data.pt = 99; step(2.8);`,
  m2: `T.skipIntro(); step(0.3); T.start(1); T.resolve(1); T.S.vuln = null; T.start(2); hold(T.S.A.cx - 3, T.S.A.cy + 5); step(3.0);`,
  m2x: `T.skipIntro(); step(0.3); T.start(1); T.resolve(1); T.S.vuln = null; T.start(2); hold(T.S.A.cx - 3, T.S.A.cy + 5); const DD = T.S.mech.data; step(DD.ends[0] + 0.3);`,
  seal: `T.skipIntro(); step(0.3); T.start(1); T.markFail(1, 'test'); step(0.5);`,
  m3: `T.skipIntro(); step(0.3); for (let i = 1; i < 3; i++) T.S.res[i] = 'pass'; T.start(3); hold(T.S.A.cx, T.S.A.cy + 5); step(4.5); for (const c of T.S.mech.data.cores) if (c.P) c.P.m.hp *= c.side === 'L' ? 0.55 : 0.8; step(0.8);`,
  m4: `T.skipIntro(); step(0.3); for (let i = 1; i < 4; i++) T.S.res[i] = 'pass'; T.start(4); hold(T.S.A.cx + 3, T.S.A.cy + 5); step(4.6);`,
  m5: `T.skipIntro(); step(0.3); for (let i = 1; i < 5; i++) T.S.res[i] = 'pass'; T.start(5); const sp = T.S.mech.data.sph[0]; hold(sp.mir.x, sp.mir.y + 2.6); step(sp.tA - 1.2);`,
  b1: `T.skipIntro(); step(0.3); for (let i = 1; i < 6; i++) T.S.res[i] = 'pass'; T.start(6); hold(T.S.A.cx - 3, T.S.A.cy + 3); step(6.0);`,
  b4: `T.skipIntro(); step(0.3); for (let i = 1; i < 6; i++) T.S.res[i] = 'pass'; T.start(6); const M6 = T.S.mech; step(1); M6.data.stage = 3; M6.data.st = 30; hold(T.S.A.cx + 2, T.S.A.cy + 4); step(1.5);`,
  dead: `T.skipIntro(); step(0.3); T.S.phase = 5; T.S.res = [null, 'pass', 'pass', 'pass', 'pass', 'pass', 'pass']; T.setK(0.01); GB.onBossDeath(T.S.m); step(9.0);`,
  para: `T.skipIntro(); step(0.3); T.start(1); T.markFail(1, 'test'); T.S.res[1] = 'fail'; T.S.mech = null; T.S.mode = 'fight'; T.start(2); T.markFail(2, 'test'); step(2.9);`,
};
(async () => {
  const GL = process.env.GL !== '0'; const H = await open({ gl: GL, dpr: DPR, lowFx: process.env.LOW === '1' }); const fs = require('fs'), path = require('path');
  try { await H.start(); await H.fight();
    for (const k of SC) { const body = SET[k]; if (!body) continue; const t0 = Date.now();
      await H.ev(`const s = T.S; GB.begin(s.X, s.H, s.self, s.A); ` + body + ` return 1;`);
      await H.shot(OUT, `${k}-dpr${DPR}${process.env.LOW === '1' ? '-low' : ''}${GL ? '' : '-2d'}`);
      const st = await H.ev(`const N = NIDHOGG_MOVES.FGFX, R = RAZIEL_GL; return { mode: T.S.mode, mech: T.S.mech ? T.S.mech.id : 0, fg: N ? (typeof N.stats === 'function' ? N.stats() : N.stats) : null, gpu: R ? R.gpuCount() : -1, usable: N ? N.usable() : null };`);
      console.log(k, ((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify(st).slice(0, 400)); }
  } catch (e) { console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 8)));
  fs.mkdirSync(path.resolve(__dirname, '..', 'shots', OUT), { recursive: true }); fs.writeFileSync(path.resolve(__dirname, '..', 'shots', OUT, 'done.txt'), `shots ${SC.join(',')} dpr ${DPR} ${new Date().toISOString()}\n`, { flag: 'a' });
  await H.browser.close();
})();
