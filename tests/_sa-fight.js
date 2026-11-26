// (v463 SA) Threnn / Vaul, the whole fight on the GPU (or the 2D fallback): the entrance, every act (forced through the fight's own
// choosing), its tell and its strike, the stun (Threnn's core cracked; Vaul woven, the eye bared), the second phase, its fall (the GPU
// ending), the GL copies a frame (GLM passes and FGFX flushes, counted over real frames), the GPU buffers let go on the next stage.
// No page errors. Shots (SHOTS=1) -> shots/v463-SA/<TAG>-<boss>-d<DPR>-NN-name.png and a sheet.
// env: HTML (test-sa.html), BOSS (threnn | vaul), GL (1 the GPU forced on SwiftShader; 0 the 2D fallback), DPR (1), SHOTS, TAG (after | before), QUICK
const { openSA } = require('./_sa-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const boss = process.env.BOSS || 'threnn', gl = process.env.GL !== '0', dpr = +(process.env.DPR || 1), tag = process.env.TAG || 'after', SH = !!process.env.SHOTS, T0 = Date.now(), el = () => ((Date.now() - T0) / 1000).toFixed(0) + 's';
  const G = await openSA({ boss, gl, dpr, html: process.env.HTML || 'test-sa.html' }); const { ev } = G; const shots = [];
  const shot = async (n, cap) => { if (!SH) return; const f = await G.shot(`${tag}-${boss}-d${dpr}${gl ? '' : '-2d'}-${n}`); shots.push(`${f}=${n}${cap ? ': ' + cap : ''}`); };
  const draw = n => ev(`for (let i = 0; i < ${n || 1}; i++) await frame();`);
  await G.start(); console.log('stage up', el());
  let r = await ev(`const bb = D.mons.find(q => q.boss) || D.M.bossAt; me.x = bb.x; me.y = bb.y + 6; adv(0.6); let i = 0; while (!b && i++ < 200) adv(0.05); adv(0.9); return { fd: !!D.FD, gl: !!(O && O.on && O.on()), fx: !!(O && O.fx && O.fx()), act: b && b.act };`);
  console.log('  wake', JSON.stringify(r), el()); ok(r.fd, 'the fiend fight is up'); ok(tag === 'before' || r.gl === gl, `the GPU model is ${gl ? 'on' : 'off'} (${r.gl})`);
  await draw(1); await shot('01-enter', 'its entrance');
  r = await ev(`adv(4.0); me.x = b.x + 1; me.y = b.y + 5; return { act: b.act };`); await draw(1); await shot('02-awake', 'awake'); ok(r.act && r.act !== 'enter', `awake (${r.act})`);
  const IDLE = boss === 'threnn' ? 'drift' : 'stalk', ACTS = boss === 'threnn' ? [['bite', 'Afterimage Bite', 0.6], ['borrow', 'Borrowed Moment', 0.7], ['toll', 'Hour Toll', 0.6]] : [['record', 'Recorded Blasts', 0.5], ['rush', 'Mirror Rush', 0.6], ['volley', 'Spike Volley', 0.6], ['lash', 'Light Lash', 0.6], ['mirror', 'Mirror Pursuit', 0.6]];
  let n = 10;
  for (const [k, nm, wf] of process.env.ACTS ? ACTS.filter(a => process.env.ACTS.split(',').includes(a[0])) : process.env.QUICK ? ACTS.slice(0, 1) : ACTS) {
    const s0 = await ev(`const k = arg; b.stunT = 0; FX.S.tele.length = 0; FX.S.hz.length = 0; me.x = b.x + 1.2; me.y = b.y + 5.5;
      for (let i = 0; i < 400 && b.act !== k; i++) { if (${boss === 'threnn'}) { M.nextAct = k; M.orbs = []; } else { if (k === 'mirror') { M.copy = null; M.mirrorCd = -1; } else { M.bag = [k]; M.mirrorCd = 99; } } b.act = '${IDLE}'; b.actT = 99; U.update(0.02); }
      window.__saF = window.__saF || {}; for (const s of FX.S.tele) if (!s.__w) { s.__w = 1; const f = s.fn; s.fn = x => { window.__saF[k] = (window.__saF[k] || 0) + 1; if (f) f(x); }; }
      return { act: b.act, teles: FX.S.tele.length, wait: FX.S.tele.length ? Math.max(...FX.S.tele.map(s => s.t)) : 1, geo: FX.S.tele.map(s => (s.geo || s.shape) + (s.sa ? '*' : '')), labels: FX.S.tele.map(s => s.label || s.ord || '').join('') };`, k);
    console.log(`  ${k}`, JSON.stringify(s0)); ok(s0.act === k, `${nm}: started (${s0.teles} warnings: ${[...new Set(s0.geo)].join(',')})`);
    const tw = k === 'record' ? 4.8 : Math.min(2.5, s0.wait * wf); await ev(`adv(${tw.toFixed(3)});`); await draw(1); await shot(`${n}a-${k}-tell`, `${nm}: its tell`);
    r = await ev(`const k = arg; let i = 0; while (!(window.__saF[k] > 0) && i++ < 160) { adv(0.05); for (const s of FX.S.tele) if (!s.__w) { s.__w = 1; const f = s.fn; s.fn = x => { window.__saF[k] = (window.__saF[k] || 0) + 1; if (f) f(x); }; } } adv(0.12); return { fired: window.__saF[k] || 0 };`, k);
    await draw(1); await shot(`${n}b-${k}-strike`, `${nm}: the strike`); ok(r.fired > 0 || k === 'mirror' || k === 'borrow', `${nm}: its blow fired (${r.fired})`); n++;
    if (k === 'borrow' || k === 'bite' || k === 'mirror' || k === 'record') { await ev(`adv(${k === 'mirror' ? 2.5 : 1.0});`); await draw(1); await shot(`${n - 1}c-${k}-after`, `${nm}: after`); }
    await ev(`adv(1.6); FX.S.tele.length = 0; FX.S.hz.length = 0;`); }
  // the stun
  if (boss === 'threnn') r = await ev(`b.stunT = 0; M.nextAct = 'borrow'; b.act = 'drift'; b.actT = 99; let core = null, i = 0; while (!core && i++ < 400) { if (b.act === 'drift' && !M.bm) { M.nextAct = 'borrow'; b.actT = 99; } U.update(0.03); core = D.mons.find(q => q.fobj && q.kind === 'core' && !q.dead); }
    if (core) D.hitMon(core, 1e12, { flat: true }); adv(1.0); return { core: !!core, stun: +(b.stunT || 0).toFixed(2), weak: !!(FX.S.weak.core && !FX.S.weak.core.dead) };`);
  else r = await ev(`b.stunT = 0; M.copy = null; M.mirrorCd = -1; b.act = 'stalk'; b.actT = 99; let i = 0; while (!M.copy && i++ < 300) U.update(0.03); if (M.copy) { const C = FX.C; M.copy.x = C.x + Math.cos(Math.PI / 2 - 1.2) * 7.4; M.copy.y = C.y + Math.sin(Math.PI / 2 - 1.2) * 7.4; M.copy.q = []; adv(0.3); me.x = C.x; me.y = C.y + C.R - 1.8; adv(1.6); }
    return { copy: !!M.copy, held: !!(M.copy && M.copy.held), stun: +(b.stunT || 0).toFixed(2), weak: !!(FX.S.weak.eye && !FX.S.weak.eye.dead) };`);
  console.log('  stun', JSON.stringify(r)); ok(r.stun > 0 && r.weak, `the stun and its weak point (${JSON.stringify(r)})`); await ev(`me.x = b.x + 1; me.y = b.y + 4.5;`); await draw(1); await shot('30-stunned', boss === 'threnn' ? 'cracked: out of time' : 'woven: the eye bared');
  await ev(`adv(6.5); b.stunT = 0;`);
  r = await ev(`const f = D.FD.S; b.hp = b.maxhp * 0.45; adv(3.0); me.x = b.x + 1; me.y = b.y + 5; return { phase: f.phase };`); await draw(1); await shot('40-phase2', 'the second phase'); ok(r.phase >= 2, `phase two (${r.phase})`);
  if (boss === 'threnn') { await ev(`M.nextAct = 'still'; b.act = 'drift'; b.actT = 99; let i = 0; while (b.act !== 'still' && i++ < 300) { M.nextAct = 'still'; U.update(0.02); } adv(1.2);`); await draw(1); await shot('41-still', 'the stolen second: a lane and the seconds'); }
  else { await ev(`M.bag = ['lash']; b.act = 'stalk'; b.actT = 99; let i = 0; while (b.act !== 'lash' && i++ < 300) U.update(0.02); adv(0.8);`); await draw(1); await shot('41-lash2', 'two waves of lashes'); }
  // the GL copies a frame: GLM passes and FGFX flushes over a few real frames
  r = await ev(`await frame(); const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; let fl = 0; const n0 = O && O.__dbg ? O.__dbg.glStats.frames : 0; const f0 = F && F.flush; if (F) F.flush = function () { fl++; return f0.apply(this, arguments); };
    const N = 3; for (let i = 0; i < N; i++) { adv(0.05); await frame(); } if (F) F.flush = f0; const gp = (O && O.__dbg ? O.__dbg.glStats.frames : 0) - n0; return { glmPerFrame: gp / N, fgfxPerFrame: fl / N, stats: O && O.__dbg ? O.__dbg.glStats : null };`);
  console.log('  copies', JSON.stringify(r)); const COP = r;
  // its fall
  r = await ev(`const P2 = P; b.stunT = 0; D.hitMon(b, 1e12, { pierce: true }); adv(1.4); return { dead: b.dead, husk: !!M.husk, end: !!(M.g3 && M.g3.end) };`); await draw(1); await shot('50-fall', 'its fall'); console.log('  fall', JSON.stringify(r));
  ok(r.dead && (!gl || (r.husk && r.end)), `its fall (${JSON.stringify(r)})`);
  await ev(`adv(1.8);`); await draw(1); await shot('51-fallen', 'fallen');
  // the next stage lets go of the GPU buffers
  if (gl && !process.env.QUICK) { r = await ev(`await new Promise(r => setTimeout(r, 4500)); P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('sepulchre', 0); return true;`); await G.page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 2400000 });
    r = await ev(`const MS = P.FIEND_DEFS[arg].MODEL.__dbg.MESH; return { meshes: MS ? Object.keys(MS).length : 0, onGPU: MS ? Object.values(MS).filter(q => q && q.gl).length : 0, glmCanvas: P.FIEND_DEFS[arg].MODEL.__dbg.glmCanvas };`, boss); console.log('  release', JSON.stringify(r)); ok(r.onGPU === 0, `the next stage: its ${r.meshes} meshes hold no GPU buffers (${r.onGPU}); the GLM canvas ${r.glmCanvas} px`); }
  console.log('errors', G.errors.length, G.errors.slice(0, 5)); ok(G.errors.length === 0, 'no page errors');
  await G.browser.close(); if (SH && shots.length) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(G.OUT, `${tag}-${boss}-d${dpr}${gl ? '' : '-2d'}-sheet.png`), ...shots], { stdio: 'inherit' });
  console.log(JSON.stringify({ copies: COP }), el()); console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
})();
