// (v423 GO) Orrubel the Seed-Mother, its whole fight: the entrance, every attack (Pollen Breath, Root Spears, Seed Bombs, Petal
// Slam: each forced, caught in its wind-up and its strike, its blow checked to fire), a hit, the peel (a Cradle Pod broken, the eye
// bared), the second phase (the roar, the pods back, the bombs hatching), the defeat (its fall) to the stage's end, then the
// clean-up (the dead stage let go when the next is made). No page errors. Shots (SHOTS=1) -> shots/v423-GO/<TAG>-NN-name.png.
// env: HTML (test-go.html), GL (1: the GPU model forced on SwiftShader; 0: the 2D fallback), DPR (1), SHOTS, TAG (after|before),
//      FRAMES (real frames drawn per game second during the attacks: 0 none (fast), default 2 with GL)
const { openGO } = require('./_go-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const glEnv = process.env.GL !== '0', gl = glEnv && process.env.TAG !== 'before', dpr = +(process.env.DPR || 1), tag = process.env.TAG || 'after', SH = !!process.env.SHOTS, FR = process.env.FRAMES != null ? +process.env.FRAMES : (gl ? 2 : 4);
  const T0 = Date.now(), el = () => ((Date.now() - T0) / 1000).toFixed(0) + 's';
  const G = await openGO({ gl: glEnv, dpr }); const { page, errors, ev } = G; const shots = [];
  const shot = async (n, cap) => { if (!SH) return; const f = await G.shot(`${tag}-d${dpr}${glEnv ? '' : '-2d'}-${n}`); shots.push(`${f}=${n}${cap ? ': ' + cap : ''}`); };
  const draw = n => ev(`for (let i = 0; i < ${n || 1}; i++) await frame();`);
  await G.start(); console.log('stage up', el());
  // the wake: the pet walks up; the fight starts; the entrance (it comes down, rears, roars, lands)
  let r = await ev(`const bb = D.mons.find(q => q.boss) || D.M.bossAt; me.x = bb.x; me.y = bb.y + 5.2; adv(1.0); return { fd: !!D.FD, started: !!(D.FD && D.FD.S.started), gl: !!(O && O.on()), fx: !!(O && O.fx()), hd: typeof O };`);
  console.log('  wake', JSON.stringify(r), el()); ok(r.fd, 'the fiend fight is up');
  await draw(2); console.log('  first frames drawn (shaders compiled)', el());
  r = await ev(`adv(0.5); return { act: D.g.boss && D.g.boss.act, gl: !!(O && O.on()) };`); await draw(1); await shot('01-intro', 'it comes down into the Cradle Bed');
  ok(!glEnv || !gl || r.gl, `the GPU model is ${gl ? 'on' : 'off'} (${r.gl})`);
  r = await ev(`adv(4.2); const bb = D.g.boss; return { act: bb && bb.act, enter: bb && bb.act === 'enter' };`); await draw(1); await shot('02-wake', 'landed, it paces');
  ok(r.act && r.act !== 'enter', `awake (${r.act})`);
  // pacing round the pet (feet planted, stepping in turn)
  r = await ev(`b.act = 'circle'; b.actT = -3; adv(1.4); const S = M.g3; return { steps: S ? S.feet.map(f => +(f.lift || 0).toFixed(2)) : null, spd: +(M.spdK || 0).toFixed(2) };`); await draw(1); await shot('03-pace', 'pacing: roots stepping, eggs swinging');
  console.log('  pace', JSON.stringify(r));
  // every attack: forced (the def's test hook; on a build without it, the act is drawn from its own choice until it comes up)
  const ACTS = [['breath', 'Pollen Breath', 5.0], ['spears', 'Root Spears', 4.5], ['bombs', 'Seed Bombs', 5.5], ['slam', 'Petal Slam', 4.5]];
  for (const [k, nm, dd] of ACTS) {
    const s0 = await ev(`window.__goFired = window.__goFired || {}; b.stunT = 0; me.x = b.x + 0.3; me.y = b.y + ${dd}; adv(0.3); const k = arg;
      if (DEF.force) DEF.force(FX, k); else for (let i = 0; i < 500 && b.act !== k; i++) { FX.S.tele.length = 0; M.lobs.length = 0; b.stunT = 0; b.act = 'circle'; b.actT = 99; me.x = b.x + 0.3; me.y = b.y + (k === 'bombs' ? 7.2 : ${dd}); U.update(0.001); if (b.act !== k) { FX.S.tele.length = 0; M.lobs.length = 0; b.act = 'circle'; b.actT = 0; } }
      for (const s of FX.S.tele) if (!s.__w) { s.__w = 1; const f = s.fn; s.fn = x => { window.__goFired[k] = (window.__goFired[k] || 0) + 1; if (f) f(x); }; }
      return { act: b.act, teles: FX.S.tele.length, wait: Math.max(...FX.S.tele.map(s => s.t)), geo: FX.S.tele.map(s => s.geo || s.shape) };`, k);
    console.log(`  ${k}`, JSON.stringify(s0)); ok(s0.act === k && s0.teles > 0, `${nm}: started, ${s0.teles} warning(s) (${[...new Set(s0.geo)].join(',')})`);
    // the wind-up: about 60% into its first warning, frames along the way
    const wind = Math.min(...[s0.wait]) * 0.5, nfr = Math.max(0, Math.round(wind * FR));
    for (let i = 0; i < nfr; i++) { await ev(`adv(${(wind / (nfr + 1)).toFixed(3)});`); await draw(1); }
    await ev(`adv(${(wind / (nfr + 1)).toFixed(3)});`); await draw(1); await shot(`1${ACTS.findIndex(a => a[0] === k)}a-${k}-wind`, `${nm}: the wind-up (its tell)`);
    // the strike: just after its (first) blow
    r = await ev(`const k = arg[0]; let n = 0; while (!(window.__goFired[k] > 0) && n++ < 120) adv(0.05); adv(arg[1]); const S = M.g3; return { fired: window.__goFired[k] || 0, breath: +(M.breath || 0).toFixed(2), spears: S ? S.spears.length : -1, fx: S ? S.fx.map(f => f.kind) : [], lobs: M.lobs.length, slam: M.slam };`, [k, k === 'slam' ? 0.12 : k === 'spears' ? 0.08 : 0.1]);
    await draw(1); await shot(`1${ACTS.findIndex(a => a[0] === k)}b-${k}-strike`, `${nm}: the strike`);
    console.log(`  ${k} strike`, JSON.stringify(r)); ok(r.fired > 0, `${nm}: its blow fired (${r.fired})`);
    if (gl) { const vis = k === 'breath' ? r.breath > 0 : k === 'spears' ? r.spears > 0 : k === 'bombs' ? r.fx.includes('burst') : r.fx.includes('slamw'); ok(vis, `${nm}: its GPU visual is up (${JSON.stringify(r.fx)})`); }
    // the rest of the act (its recovery), then all its warnings fired
    r = await ev(`const k = arg; let n = 0; while ((b.act === k || FX.S.tele.length) && n++ < 200) adv(0.05); return { act: b.act, left: FX.S.tele.length, fired: window.__goFired[k] };`, k);
    ok(r.left === 0 && r.act !== k, `${nm}: recovered (${r.act}; ${r.fired} blows fired)`);
  }
  // a blow on it
  await ev(`b.act = 'circle'; b.actT = -2; me.x = b.x; me.y = b.y + 3.5; adv(0.5); D.hitMon(b, 1000, { flat: true }); adv(0.05);`); await draw(1); await shot('20-hit', 'struck: squashed, petals flare');
  // the peel: a Cradle Pod broken; the eye bared (its weak point up)
  r = await ev(`const o = D.mons.find(q => q.fobj && q.kind === 'pod' && !q.dead); if (o) D.hitMon(o, 1e12, { flat: true }); adv(0.9); return { pod: !!o, stun: +(b.stunT || 0).toFixed(2), open: +(M.open || 0).toFixed(2), weak: !!(D.FD.S.weak.eye && !D.FD.S.weak.eye.dead) };`);
  await draw(1); await shot('21-peel', 'a Cradle Pod broken: the petals peel, the eye bared');
  console.log('  peel', JSON.stringify(r)); ok(r.stun > 0 && r.weak && r.open > 0.6, 'the peel: stunned, open, its eye a weak point');
  r = await ev(`D.hitMon(D.FD.S.weak.eye || b, 400, { flat: true }); adv(2.0); return { open: +(M.open || 0).toFixed(2) };`); await draw(1); await shot('22-peel-hit', 'the bared eye struck');
  r = await ev(`adv(4.5); return { stun: +(b.stunT || 0).toFixed(2), open: +(M.open || 0).toFixed(2), act: b.act };`); console.log('  after peel', JSON.stringify(r)); ok(r.open < 0.5, 'the bud closes again');
  // the second phase: the roar, the pods grown back, its brood (bombs that hatch)
  r = await ev(`b.stunT = 0; b.hp = b.maxhp * 0.45; let n = 0; while (D.FD.S.phase < 2 && n++ < 80) adv(0.05); adv(0.3); return { phase: D.FD.S.phase, lv: D.FD.S.lv, roar: +(M.roar || 0).toFixed(2), pods: D.mons.filter(q => q.fobj && q.kind === 'pod' && !q.dead).length };`);
  await draw(1); await shot('30-phase', 'the second phase: it rears and roars');
  console.log('  phase', JSON.stringify(r)); ok(r.phase === 2, `the second phase (${r.phase}, act ${r.lv}; pods ${r.pods})`);
  r = await ev(`let n = 0; const seen = new Set(); while (n++ < 260) { adv(0.05); for (const q of D.mons) if (!q.dead && (q.type === 'egg' || q.type === 'thornling')) seen.add(q.type); if (seen.size && n > 40) break; } return { minions: [...seen], lobs: M.lobs.length };`);
  await draw(1); await shot('31-brood', 'its brood: the eggs hatch');
  console.log('  brood', JSON.stringify(r)); ok(r.minions.length > 0, `its brood hatches (${r.minions.join(', ')})`);
  for (const [k, nm] of ACTS) { const f = await ev(`return (window.__goFired || {})[arg] || 0;`, k); ok(f > 0, `${nm}: fired over the fight (${f})`); }
  const e0 = errors.length; ok(e0 === 0, `no page errors in the fight (${e0})`); if (e0) console.log(errors.slice(0, 5).join('\n'));
  // the defeat: its fall, then the stage's end
  r = await ev(`window.__goOld = D.FD; for (const q of D.mons) if (!q.dead && !q.boss && !q.fobj) { q.hp = 0; q.dead = true; } b.stunT = 0; D.hitMon(b, 1e12, { pierce: true }); adv(0.7); const S = M.g3; return { dead: !!b.dead, end: !!(S && S.end), husk: !!M.husk };`);
  await draw(1); await shot('40-fall-a', 'its fall: it shudders, light leaking from its seams');
  console.log('  fall', JSON.stringify(r)); ok(r.dead, 'it falls'); if (gl) ok(r.end && r.husk, 'its own fall is staged (the husk drawn on)');
  await ev(`adv(1.0);`); await draw(1); await shot('41-fall-b', 'the petals burst off');
  r = await ev(`adv(2.4); const S = M.g3; return { eggs: S ? S.eggs.filter(e => e.free).length : 0, t: S && S.end ? +S.end.t.toFixed(2) : null };`); await draw(1); await shot('42-fall-c', 'withered: the eye closed, the petals on the moss');
  console.log('  withered', JSON.stringify(r));
  r = await ev(`let n = 0; while (P.arc.state !== 'end' && n++ < 400) { adv(0.05); if (n % 40 === 0) await frame(); } return { state: P.arc.state, won: D.g.won };`);
  ok(r.state === 'end' && r.won, `the stage ends in a win (${r.state})`);
  const e1 = errors.length; ok(e1 === 0, `no page errors to the end (${e1})`); if (e1 > e0) console.log(errors.slice(e0, e0 + 5).join('\n'));
  // the clean-up: the closed stage's pictures given back; the next stage made lets go of this file's pointers
  r = await ev(`const F0 = window.__goOld; P.closeArcade(true); await frame(); const arena = !!(F0 && F0.S.arenaCv); const st = P.RIFT_BY_ID.garden.stages.findIndex(s => s.boss === 'orrubel'); P.openMap(); P.dun.setMapTab('rift', true); P.startRift('garden', 0); await new Promise(res => setTimeout(res, 500));
    const O2 = P.FIEND_DEFS.orrubel.MODEL; return { arenaKept: arena, pods: O2 ? O2.__dbg.pods : -1, last: O2 ? !!O2.__dbg.last : null, stats: O2 ? O2.__dbg.glStats : null };`);
  console.log('  cleanup', JSON.stringify(r)); ok(!r.arenaKept, 'the closed stage gave its arena picture back'); if (gl) ok(r.pods === 0 && r.last === false, 'the next stage let go of the pod pictures and the last view');
  const e2 = errors.length; ok(e2 === 0, `no page errors at all (${e2})`); if (e2 > e1) console.log(errors.slice(e1, e1 + 5).join('\n'));
  await G.browser.close(); console.log('done', el(), fails ? `${fails} FAILED` : 'all ok');
  if (SH && shots.length) require('child_process').execFileSync('python3', [require('path').join(__dirname, '_go-sheet.py'), `${tag}-d${dpr}${glEnv ? '' : '-2d'}`, '--cols', '4', '--w', dpr > 1 ? '260' : '260', '--title', `Orrubel the Seed-Mother - ${tag} (${glEnv ? 'GPU' : '2D fallback'}, DPR ${dpr})`, ...shots], { stdio: 'inherit' });
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
