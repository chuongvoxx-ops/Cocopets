// (v433 DB) Oneira the Listening Shell / Thul-Ammon the Sand Kraken, the whole fight: the entrance, every act (forced through the def's
// test hook, or on a build without it drawn from its own choice), its wind-up and its strike, the stun (Oneira's four stones lit and
// cracked: deafened; Thul-Ammon's three anchors broken: the head sinks), the second phase, a blow on it and on its weak point (its
// effective health), then a blow of its on the pet (god mode off: the pet's loss). No page errors. Shots (SHOTS=1) ->
// shots/v433-DB/<TAG>-<boss>-NN-name.png.   env: HTML (test-db.html), BOSS (oneira | thulammon), GL (1 the GPU forced on
// SwiftShader; 0 the 2D fallback), DPR (1), SHOTS, TAG (after | before), OUT (the shots' folder)
const { openDB } = require('./_db-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const boss = process.env.BOSS || 'oneira', gl = process.env.GL !== '0', dpr = +(process.env.DPR || 1), tag = process.env.TAG || 'after', SH = !!process.env.SHOTS;
  const QUICK = !!process.env.QUICK, T0 = Date.now(), el = () => ((Date.now() - T0) / 1000).toFixed(0) + 's';
  const G = await openDB({ boss, gl, dpr, out: process.env.OUT ? path.resolve(process.env.OUT) : undefined }); const { ev } = G; const shots = [];
  const shot = async (n, cap) => { if (!SH) return; const f = await G.shot(`${tag}-${boss}-d${dpr}${gl ? '' : '-2d'}-${n}`); shots.push(`${f}=${n}${cap ? ': ' + cap : ''}`); };
  const draw = n => ev(`for (let i = 0; i < ${n || 1}; i++) await frame();`);
  if (process.env.LOWFX) await ev(`P.st.lowFx = true;`);
  await G.start(); console.log('stage up', el());
  let r = await ev(`const bb = D.mons.find(q => q.boss) || D.M.bossAt; me.x = bb.x; me.y = bb.y + 6; adv(0.6); return { fd: !!D.FD, gl: !!(O && O.on && O.on()), fx: !!(O && O.fx && O.fx()) };`);
  console.log('  wake', JSON.stringify(r), el()); ok(r.fd, 'the fiend fight is up'); ok(!gl || tag === 'before' || r.gl, `the GPU model is ${gl ? 'on' : 'off'} (${r.gl})`);
  await draw(2); console.log('  first frames drawn', el());
  r = await ev(`let i = 0; while (!b && i++ < 200) adv(0.05); adv(0.9); return { act: b && b.act, enterT: FX.S.enterT, waited: i };`); console.log('  enter', JSON.stringify(r)); await draw(1); await shot('01-enter', 'its entrance');
  r = await ev(`adv(4.0); return { act: b.act };`); await draw(1); await shot('02-awake', 'awake'); ok(r.act && r.act !== 'enter', `awake (${r.act})`);
  const ACTS = boss === 'oneira' ? [['echo', 'Echo Call', 0.5], ['beam', 'Listening Beam', 0.75], ['chorus', 'Grub Chorus', 0.6], ['slam', 'Shell Slam', 0.6]]
    : [['sweep', 'Tentacle Sweep', 0.6], ['slam', 'Tentacle Slam', 0.6], ['ink', 'Ink of Sand', 0.6], ['grasp', 'Grasp', 0.6], ['sandfall', 'Sandfall', 0.45]];
  let n = 10;
  for (const [k, nm, wf] of QUICK ? ACTS.slice(-1) : ACTS) {
    const s0 = await ev(`window.__dbFired = window.__dbFired || {}; b.stunT = 0; me.x = b.x + 1.2; me.y = b.y + 5.5; adv(0.2); const k = arg; FX.S.tele.length = 0;
      if (DEF.force) DEF.force(FX, k); else for (let i = 0; i < 600 && b.act !== k; i++) { FX.S.tele.length = 0; if (M.beams) M.beams.length = 0; if (M.lobs) M.lobs.length = 0; b.stunT = 0; b.act = '${boss === 'oneira' ? 'circle' : 'idle'}'; b.actT = 99; U.update(0.001); }
      for (const s of FX.S.tele) if (!s.__w) { s.__w = 1; const f = s.fn; s.fn = x => { window.__dbFired[k] = (window.__dbFired[k] || 0) + 1; if (f) f(x); }; }
      return { act: b.act, teles: FX.S.tele.length, wait: FX.S.tele.length ? Math.min(...FX.S.tele.map(s => s.t)) : 0, geo: FX.S.tele.map(s => s.geo || s.shape) };`, k);
    console.log(`  ${k}`, JSON.stringify(s0)); ok(s0.act === k && s0.teles > 0, `${nm}: started, ${s0.teles} warning(s) (${[...new Set(s0.geo)].join(',')})`);
    await ev(`adv(${(s0.wait * wf).toFixed(3)});`); await draw(1); await shot(`${n}a-${k}-wind`, `${nm}: its tell`);
    r = await ev(`const k = arg; let i = 0; while (!(window.__dbFired[k] > 0) && i++ < 120) adv(0.05); adv(0.15); return { fired: window.__dbFired[k] || 0, fx: M.g3 ? M.g3.fx.map(f => f.kind) : [] };`, k);
    await draw(1); await shot(`${n}b-${k}-strike`, `${nm}: the strike`); ok(r.fired > 0, `${nm}: its blow fired (${r.fired}; fx ${[...new Set(r.fx)].join(',')})`); n++;
    if (k === 'beam' || k === 'ink' || k === 'sandfall') { await ev(`adv(1.0);`); await draw(1); await shot(`${n - 1}c-${k}-after`, `${nm}: after`); }
    await ev(`adv(1.6); FX.S.tele.length = 0; if (M.beams) M.beams.length = 0;`);
  }
  // the stun
  if (boss === 'oneira') { r = await ev(`b.act = 'circle'; b.actT = -9; FX.S.tele.length = 0; adv(0.3); let n2 = 0; for (const h of M.stones) { const o = h.obj; if (!o || o.dead) continue; o.lit = 6; o.invuln = false; } adv(0.2); await frame(); for (const h of M.stones) { const o = h.obj; if (!o || o.dead) continue; D.hitMon(o, o.hp + 10, { flat: true }); n2++; } adv(1.6); return { n: n2, stun: +(b.stunT || 0).toFixed(2), slump: +(M.slump || 0).toFixed(2) };`); }
  else { r = await ev(`b.act = 'idle'; b.actT = -9; FX.S.tele.length = 0; adv(1.5); let n2 = 0; for (const Tk of M.tents) { if (n2 >= 3) break; const o = Tk.anchor; if (!o || o.dead) continue; D.hitMon(o, o.hp + 10, { flat: true }); n2++; } adv(1.6); return { n: n2, stun: +(b.stunT || 0).toFixed(2), sink: +(M.sink || 0).toFixed(2) };`); }
  console.log('  stun', JSON.stringify(r)); ok(r.stun > 0, `${boss === 'oneira' ? 'deafened' : 'the head sinks'} (${JSON.stringify(r)})`); await draw(1); await shot('30-stunned', boss === 'oneira' ? 'deafened: the mantle bared' : 'sunk: the eye bared');
  // its health: a flat blow of 1000 on its body, and one on its weak point while it is down
  r = await ev(`const K = D.F.rift && D.F.rift.foeK; const wk = FX.S.weak[arg]; const h0 = b.hp; D.hitMon(b, 1000, { flat: true }); const dBody = h0 - b.hp; const h1 = b.hp; if (wk && !wk.dead) D.hitMon(wk, 1000, { flat: true }); const dWeak = h1 - b.hp;
    return { maxhp: Math.round(b.maxhp), bossK: K ? K.boss : 1, dmgK: DEF.dmgK ? +DEF.dmgK(FX, b, {}).toFixed(3) : 1, dBody: Math.round(dBody), dWeak: Math.round(dWeak), weakK: wk ? +wk.forward.toFixed(3) : null, effHp: Math.round(b.maxhp / (DEF.dmgK ? DEF.dmgK(FX, b, {}) : 1)) };`, boss === 'oneira' ? 'mantle' : 'eye');
  console.log('  health', JSON.stringify(r)); const H = r;
  await ev(`adv(6); b.stunT = 0;`);
  // the second phase
  r = await ev(`const f = D.FD.S; b.hp = b.maxhp * 0.48; adv(3.0); return { phase: f.phase, lv: f.lv, tents: M.tents ? M.tents.filter(t => !t.asleep).length : null };`); await draw(1); await shot('40-phase2', 'the second phase'); console.log('  phase', JSON.stringify(r));
  if (boss === 'oneira') { await ev(`me.x = b.x + 1.2; me.y = b.y + 6; DEF.force ? DEF.force(FX, 'beam') : 0; adv(1.6);`); await draw(1); await shot('41-beam2', 'two beams'); }
  else { await ev(`me.x = b.x + 1.2; me.y = b.y + 6; DEF.force ? DEF.force(FX, 'sweep') : 0; adv(0.9);`); await draw(1); await shot('41-sweep2', 'three arms sweep'); }
  const st = await ev(`return O && O.__dbg ? O.__dbg.glStats : null;`); console.log('  gl', JSON.stringify(st));
  if (QUICK) { console.log('errors', G.errors.length, G.errors.slice(0, 5)); ok(G.errors.length === 0, 'no page errors'); await G.browser.close(); if (SH && shots.length) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(G.OUT, `${tag}-${boss}-d${dpr}${gl ? '' : '-2d'}-sheet.png`), ...shots], { stdio: 'inherit' }); console.log(fails ? `${fails} FAILED` : 'all ok', el()); process.exit(fails ? 1 : 0); }
  // a blow of its on the pet (a new stage, god mode off)
  await ev(`P.st.dun.god = false;`); await G.start();
  r = await ev(`const bb = D.mons.find(q => q.boss) || D.M.bossAt; me.x = bb.x; me.y = bb.y + 6; adv(0.6); adv(5.5); const K = D.F.rift && D.F.rift.foeK;
    b.stunT = 0; me.x = b.x + 0.4; me.y = b.y + (arg === 'oneira' ? 3.4 : 6); me.hp = D.ST.hp; me.inv = 0; adv(0.05); FX.S.tele.length = 0; if (M.beams) M.beams.length = 0;
    const mk = { shape: 'circle', x: me.x, y: me.y, r: 1.5, t: 0.3, dmg: b.dmg * 1.5, col: '#FFFFFF' }; const s = FX.tele(mk);
    let i = 0; const hp0 = me.hp; while (!s.done && i++ < 40) { me.x = s.x; me.y = s.y; U.update(0.05); } const lost = hp0 - me.hp;
    return { dmg: +b.dmg.toFixed(2), tele: +(b.dmg * 1.5).toFixed(2), lost: +lost.toFixed(2), foeDmg: K ? K.dmg : 1, petHp: D.ST.hp };`, boss);
  console.log('  blow', JSON.stringify(r)); const BL = r;
  // and one of its own acts at the pet (its own path: Oneira's Shell Slam / Thul-Ammon's Tentacle Slam)
  r = await ev(`me.x = b.x + 1; me.y = b.y + 6; adv(0.05); me.hp = D.ST.hp; me.inv = 0; b.stunT = 0; FX.S.tele.length = 0; if (DEF.force) DEF.force(FX, 'slam'); else { for (let i = 0; i < 600 && b.act !== 'slam'; i++) { FX.S.tele.length = 0; b.act = '${boss === 'oneira' ? 'circle' : 'idle'}'; b.actT = 99; U.update(0.001); } }
    const s = FX.S.tele.find(q => q.dmg > 0) || FX.S.tele[0]; if (!s) return { none: true }; const geo = s.geo || s.shape;
    const place = () => { me.x = geo === 'ring' ? s.x + Math.cos((s.gaps ? s.gaps[0][0] : 0) + Math.PI * 0.5 + 0.9) * (s.r0 + s.r1) / 2 : s.x; me.y = geo === 'ring' ? s.y + Math.sin((s.gaps ? s.gaps[0][0] : 0) + Math.PI * 0.5 + 0.9) * (s.r0 + s.r1) / 2 : s.y; };
    let ok2 = false; for (let a = 0; a < 12 && !ok2; a++) { place(); ok2 = FX.inShape(s, me.x, me.y, me.r); if (!ok2 && s.gaps) s.gaps[0][0] += 0.5; }
    const hp0 = me.hp; me.inv = 0; let i = 0; while (!s.done && i++ < 80) { place(); me.inv = 0; U.update(0.05); } return { dmg: +s.dmg.toFixed(2), lost: +(hp0 - me.hp).toFixed(2), inShape: ok2 };`);
  console.log('  act blow', JSON.stringify(r));
  console.log('RESULT', JSON.stringify({ boss, tag, health: H, blow: BL, actBlow: r }));
  console.log('errors', G.errors.length, G.errors.slice(0, 5)); ok(G.errors.length === 0, 'no page errors');
  await G.browser.close();
  if (SH && shots.length) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(G.OUT, `${tag}-${boss}-d${dpr}${gl ? '' : '-2d'}-sheet.png`), ...shots], { stdio: 'inherit' });
  console.log(fails ? `${fails} FAILED` : 'all ok', el()); process.exit(fails ? 1 : 0);
})();
