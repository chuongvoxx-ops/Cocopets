// (v463 SK) Khyros, the whole fight in shots and checks: its entrance (assembling out of a wireframe), stalking, Angle Stalk (the corner lit,
// the lane, the lunge, a lunge into a corner wedging it: the slits bared), Angled Jaw, Tail of Angles, a blow, the second phase (Hunt the
// Past: three marks, three lanes; the corner pups), the third (Stolen Exit: the sanctuary closed, the Memory Loom recording, the echo
// holding the plate open), the kill. No page errors. Shots (SHOTS=1) -> shots/v463-SK/<TAG>-d<DPR>[-2d]-NN-name.png and a sheet.
// env: HTML (test-sk.html), GL (1: the GPU forced on SwiftShader; 0: the 2D fallback), DPR (1), SHOTS, TAG (after | before), LOWFX
const { openSK } = require('./_sk-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const gl = process.env.GL !== '0', dpr = +(process.env.DPR || 1), tag = process.env.TAG || 'after', SH = !!process.env.SHOTS, T0 = Date.now(), el = () => ((Date.now() - T0) / 1000).toFixed(0) + 's';
  const G = await openSK({ gl, dpr }); const { ev } = G; const shots = [];
  const shot = async (n, cap) => { if (!SH) return; const f = await G.shot(`${tag}-d${dpr}${gl ? '' : '-2d'}${process.env.LOWFX ? '-low' : ''}-${n}`); shots.push(`${f}=${n}${cap ? ': ' + cap : ''}`); };
  const draw = n => ev(`for (let i = 0; i < ${n || 1}; i++) await frame();`);
  if (process.env.LOWFX) await ev(`P.st.lowFx = true;`);
  await G.start(); console.log('stage up', el());
  let r = await ev(`const bb = b || D.M.bossAt; me.x = bb.x + 1; me.y = bb.y + 5; let i = 0; while (!b && i++ < 200) adv(0.05); return { fd: !!D.FD, gl: !!(O && O.on && O.on()), fx: !!(O && O.fx && O.fx()), act: b && b.act, enterT: D.FD && D.FD.S.enterT };`);
  console.log('  wake', JSON.stringify(r), el()); ok(r.fd, 'the fiend fight is up'); ok(!gl || tag === 'before' || r.gl, `the GPU model is ${gl ? 'on' : 'off'} (${r.gl})`);
  await ev(`adv(0.9);`); await draw(2); await shot('01-enter', 'assembling out of a wireframe');
  if (gl && process.env.DIAG) { await ev(`window.__SSKY = 0; for (let k = 0; k < 2; k++) await frame();`); await shot('01x-ssky-off', 'the same, the Sepulchre sky (20s5) off'); await ev(`window.__SSKY = 1;`); }
  await ev(`adv(0.8);`); await draw(1); await shot('02-howl', 'its howl on entering');
  r = await ev(`adv(3.0); return { act: b.act };`); ok(r.act && r.act !== 'enter', `awake (${r.act})`);
  // stalking near the pet
  r = await ev(`until('prowl', 10); M.fade = M.fadeTo = 0; me.x = C.x + 7.5; me.y = C.y + 8.5; b.x = C.x + 3; b.y = C.y + 8.5; M.hd = 0.2; adv(0.6, () => { b.actT = 0; }); me.x = b.x + 1.5; me.y = b.y + 3; adv(0.3, () => { b.actT = 0; }); return { act: b.act, fade: +M.fade.toFixed(2) };`);
  await draw(1); await shot('03-prowl', 'stalking, head low, glaring'); console.log('  prowl', JSON.stringify(r));
  // Angle Stalk: the corner lit, the lane, the lunge
  r = await ev(`me.x = C.x - 6; me.y = C.y + 8.5; const okA = until('angle'); adv(0.5); return { okA, lanes: FX.S.tele.map(s => s.geo || s.shape), lit: M.litTo.slice() };`);
  console.log('  angle', JSON.stringify(r)); ok(r.okA && r.lanes.includes('line'), 'Angle Stalk: a lane from a lit corner');
  await draw(1); await shot('04-angle-tell', 'Angle Stalk: the corner lit, the lane, coiled in the alcove');
  r = await ev(`let i = 0; while (!M.lg && i++ < 80) adv(0.05); adv(0.08); return { lg: !!M.lg };`); await draw(1); await shot('05-lunge', 'the lunge out of the angle'); ok(r.lg, 'the lunge runs');
  await ev(`adv(1.4);`);
  // Angled Jaw
  r = await ev(`M.fade = M.fadeTo = 0; b.x = C.x + 7; b.y = C.y + 8; M.hd = Math.PI; const hp = [b.x - 3.4, b.y]; me.x = hp[0]; me.y = hp[1] + 0.6; let okS = false; for (let k = 0; k < 40 && !okS; k++) { okS = until('snap', 200); me.x = hp[0]; me.y = hp[1] + 0.6; } adv(0.45); return { okS, tele: FX.S.tele.map(s => s.geo || s.shape) };`);
  console.log('  snap', JSON.stringify(r)); ok(r.okS && r.tele.includes('cone'), 'Angled Jaw: its cone'); await draw(1); await shot('06-snap', 'Angled Jaw: the cone, the jaw gaping');
  await ev(`adv(1.2);`);
  // Tail of Angles
  r = await ev(`M.fade = M.fadeTo = 0; b.x = C.x - 7; b.y = C.y + 8; me.x = C.x - 1; me.y = C.y + 8.5; let okP = false; for (let k = 0; k < 40 && !okP; k++) { okP = until('spears', 300); me.x = C.x - 1; me.y = C.y + 8.5; } adv(0.6); return { okP, tele: FX.S.tele.map(s => s.geo || s.shape), sp: M.spears.map(s => s.st) };`);
  console.log('  spears', JSON.stringify(r)); ok(r.okP && r.tele.filter(g => g === 'circle').length === 3, 'Tail of Angles: three rings'); await draw(1); await shot('07-spears', 'Tail of Angles: the spears thrown');
  await ev(`adv(0.5);`); await draw(1); await shot('08-spears-hit', 'the spears strike');
  await ev(`adv(1.5);`);
  // a blow
  await ev(`until('prowl', 10); M.fade = M.fadeTo = 0; b.under = false; me.x = b.x + 1.5; me.y = b.y + 3; const h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); window.__skHit = h0 - b.hp; adv(0.1);`); await draw(1); await shot('09-hit', 'struck: it flinches');
  // a lunge into a corner: wedged, the slits bared
  r = await ev(`adv(1.0); const t0 = Date.now(); let i = 0; while (!(b.stunT > 0.5) && i++ < 1400) { me.x = C.x + 12 - 1.4; me.y = C.y + 12 - 1.4; me.vx = me.vy = 0; if (b.act === 'prowl' && b.actT > 0.3) b.actT = 9; if (b.act === 'snap' || b.act === 'spears' || b.act === 'howl') { b.act = 'prowl'; b.actT = 9; } if (b.hp < b.maxhp * 0.8) b.hp = b.maxhp * 0.8; adv(0.05); }
    me.x = b.x + 2; me.y = b.y + 3.5; adv(0.6); return { stun: +(b.stunT || 0).toFixed(2), weak: !!(FX.S.weak.slits && !FX.S.weak.slits.dead) };`);
  console.log('  stuck', JSON.stringify(r)); ok(r.stun > 0 && r.weak, 'a lunge into a corner wedges it: the slits bared'); await draw(1); await shot('10-stuck', 'STUCK IN THE ANGLE: the slits bared');
  await ev(`const w = FX.S.weak.slits; if (w) D.hitMon(w, 1000, { flat: true }); adv(0.1);`); await draw(1); await shot('11-stuck-hit', 'a blow on the slits');
  await ev(`adv(5); b.stunT = 0;`);
  // phase two: Hunt the Past
  r = await ev(`b.hp = b.maxhp * 0.62; adv(2.6); for (const q of D.mons) if (!q.dead && q.type === 'cornerpup') { q.x = C.x - 9; q.y = C.y + 6; } return { phase: FX.S.phase, pups: D.mons.filter(q => !q.dead && q.type === 'cornerpup').length };`);
  console.log('  phase2', JSON.stringify(r)); ok(r.phase === 2, 'phase two'); await draw(1); await shot('12-phase2', 'Hunt the Past: its banner, corner pups');
  await ev(`for (const q of D.mons) if (!q.dead && q.type === 'cornerpup') D.hitMon(q, 1e9, { flat: true }); adv(0.5);`);
  r = await ev(`M.nextSig = 'hunt'; const okH = until('hunt'); const spots = [[-8, 10.5], [10.5, 3], [-10.5, -4]]; let i = 0; while (i++ < 200) { const k = M.marks.length; if (k < 3) { me.x = C.x + spots[k][0]; me.y = C.y + spots[k][1]; } else { me.x = C.x + 1; me.y = C.y + 1.5; } adv(0.05); if (FX.S.tele.filter(s => (s.geo || s.shape) === 'line').length === 3 && M.qt > 4.6) break; }
    me.x = C.x - 3; me.y = C.y + 6; adv(0.05); return { okH, marks: M.marks.length, lanes: FX.S.tele.filter(s => (s.geo || s.shape) === 'line').length };`);
  console.log('  hunt', JSON.stringify(r)); ok(r.okH && r.marks === 3 && r.lanes === 3, 'Hunt the Past: three marks, three lanes'); await draw(1); await shot('13-hunt', 'Hunt the Past: the marks, the numbered lanes');
  await ev(`adv(0.9);`); await draw(1); await shot('14-hunt-lunge', 'a lunge through a mark');
  await ev(`adv(5); b.stunT = 0;`);
  // phase three: Stolen Exit
  r = await ev(`for (const q of D.mons) if (!q.dead && q.type === 'cornerpup') D.hitMon(q, 1e9, { flat: true }); b.hp = b.maxhp * 0.3; me.x = C.x; me.y = C.y + 4; let i = 0; while (b.act !== 'exit' && i++ < 200) adv(0.05); adv(1.0); return { phase: FX.S.phase, act: b.act, closed: +M.closedT.toFixed(1) };`);
  console.log('  exit', JSON.stringify(r)); ok(r.act === 'exit' && r.closed > 0, 'Stolen Exit: the sanctuary closed'); await draw(1); await shot('15-exit', 'Stolen Exit: the sanctuary closed, two lanes across it');
  r = await ev(`adv(2.5); for (const q of D.mons) if (!q.dead && q.type === 'cornerpup') D.hitMon(q, 1e9, { flat: true }); const Lm = M.loom; me.x = Lm.x; me.y = Lm.y; adv(1.2); const Pl = M.plate; let i = 0; while (Lm.st === 'rec' && i++ < 80) { me.x += (Pl.x - me.x) * 0.12; me.y += (Pl.y - me.y) * 0.12; if (i === 14) break; adv(0.05); } return { st: Lm.st };`);
  console.log('  loom', JSON.stringify(r)); await draw(1); await shot('16-loom', 'the Memory Loom records');
  r = await ev(`const Lm = M.loom, Pl = M.plate; let i = 0; while (Lm.st === 'rec' && i++ < 120) { me.x += (Pl.x - me.x) * 0.15; me.y += (Pl.y - me.y) * 0.15; adv(0.05); } me.x = C.x - 9; me.y = C.y + 7; i = 0; while (Lm.st === 'echo' && i++ < 140) adv(0.05); adv(1.0); return { st: Lm.st, held: +M.heldT.toFixed(1) };`);
  console.log('  echo', JSON.stringify(r)); ok(r.st === 'hold' && r.held > 0, 'the echo holds the plate: the sanctuary open'); await ev(`me.x = C.x + 2; me.y = C.y + 7; adv(0.1);`); await draw(1); await shot('17-held', 'the echo holds the plate open (gold)');
  // performance: frames drawn with it on screen (GL copies, ms)
  r = await ev(`await frame(); const S0 = typeof GLM !== 'undefined' ? Object.assign({}, GLM.stats) : {}, c0 = typeof PERF !== 'undefined' ? PERF.cpAcc : 0; const t0 = performance.now(); for (let i = 0; i < 6; i++) await frame(); const dt = (performance.now() - t0) / 6; const S1 = typeof GLM !== 'undefined' ? GLM.stats : {}; return { ms: +dt.toFixed(1), glmPasses: +(((S1.calls || 0) - (S0.calls || 0)) / 6).toFixed(2), glCopies: typeof PERF !== 'undefined' ? +((PERF.cpAcc - c0) / 6).toFixed(2) : null, dbg: O && O.__dbg ? O.__dbg.glStats : null, mem: O && O.__dbg ? O.__dbg.mem : null };`);
  console.log('  frames', JSON.stringify(r));
  // the kill: the sealing
  r = await ev(`b.under = false; b.stunT = 1; D.hitMon(b, 1e12, { flat: true }); adv(0.1); return { dead: !!b.dead };`); await draw(1); await shot('18-kill', 'the kill');
  r = await ev(`adv(3); await frame(); return { state: P.arc.state, dead: !!b.dead };`); console.log('  kill', JSON.stringify(r)); ok(r.dead, 'the kill');
  // memory on leaving the stage
  r = await ev(`P.closeArcade(true); await frame(); try { P.openMap(); } catch (e) {} await frame(); return { mem: O && O.__dbg ? O.__dbg.mem : null, glcv: typeof GLM !== 'undefined' && GLM.canvas ? GLM.canvas.width * GLM.canvas.height : 0 };`);
  console.log('  leave', JSON.stringify(r));
  console.log('errors', G.errors.length, G.errors.slice(0, 4)); ok(G.errors.length === 0, 'no page errors');
  if (SH && shots.length > 1) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(G.OUT, `${tag}-d${dpr}${gl ? '' : '-2d'}${process.env.LOWFX ? '-low' : ''}-sheet.png`), ...shots], { stdio: 'inherit' });
  console.log(fails ? `${fails} FAILED` : 'all ok', el()); await G.browser.close(); process.exit(fails ? 1 : 0);
})();
