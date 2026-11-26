// (v433 DA) Sarrukh the Bloom Serpent, its whole fight on the GPU model (or the 2D fallback with GL=0): the entrance, every act (Sand Wake,
// Breach, Spit Grit: each forced, caught in its tell and its strike, its blow checked to fire), a Resonator Spire broken (forced up in
// bloom, the heart a weak point), the measures (its health x foeK.boss: a blow on its body and on its heart, with K and with K = 1; its
// blows x foeK.dmg: a Sand Wake's and a spat grain's, with the rift's K and with 1), the second phase (two wakes, skitters), its fall to
// the stage's end, the clean-up. No page errors. Shots (SHOTS=1) -> shots/v433-DA/<TAG>-d<DPR>-NN-name.png.
// env: HTML (test-da.html), GL (1: forced on SwiftShader; 0: the 2D fallback), DPR (1), SHOTS, TAG (after|before), FRAMES (real frames a game second)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../shots/v433-DA');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const glEnv = process.env.GL !== '0', tag = process.env.TAG || 'after', gl = glEnv && tag !== 'before', dpr = +(process.env.DPR || 1), SH = !!process.env.SHOTS, FR = process.env.FRAMES != null ? +process.env.FRAMES : 1;
  const T0 = Date.now(), el = () => ((Date.now() - T0) / 1000).toFixed(0) + 's'; fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Sarrukh|GLM|GFX/.test(m.text())) errors.push('console: ' + m.text()); });
  const html = process.env.HTML || 'test-da.html'; await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 300000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = false; P.st.energy = 100; P.st.dlv = 40; P.st.unlockAll = true; P.st.dun.best = Math.max(P.st.dun.best || 0, 160);
    if (o.gl) { window.__SAR_GL = 1; window.__NG_GL = 1; } else { window.__SAR_GL = 0; window.__NG_GL = 0; window.__SAR_FX = 0; } }, { gl: glEnv });
  const PRE = `const P = window.__pp, U = P.arc.game, D = U && U._dbg, b = D && (D.g.boss || D.mons.find(q => q.boss)), FX = D && D.FD && D.FD.FX, M = FX && FX.mem, me = D && D.me, DEF = P.FIEND_DEFS.sarrukh, O = DEF && DEF.MODEL || null;
    const top = () => { if (me && !me.dead) { me.hp = Math.max(D.ST.hp, 5000); me.mp = 999; } };   /* v460 R3: a deep pool (Sarrukh's x3 blows, v460, can take more than a level-32 pet's whole health in one hit) */
    const adv = (secs, each) => { const n = Math.max(1, Math.round(secs / 0.05)); for (let i = 0; i < n; i++) { top(); if (each) each(i); U.update(0.05); } top(); };
    const frame = () => new Promise(r => requestAnimationFrame(() => r()));`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const shots = []; const shot = async (n, cap) => { if (!SH) return; const f = path.join(OUT, `${tag}-d${dpr}${glEnv ? '' : '-2d'}-${n}.png`); await page.screenshot({ path: f, timeout: 0 }); shots.push(`${f}=${n}${cap ? ': ' + cap : ''}`); };
  const draw = n => ev(`for (let i = 0; i < ${n || 1}; i++) await frame();`);
  // the stage: the Dunes' section whose boss is Sarrukh
  await page.evaluate(v458 => { const P = window.__pp; P.openMap(); P.dun.setMapTab('rift', true); const R = P.RIFT_BY_ID.dunes, i = R.stages.findIndex(s => s.boss === 'sarrukh'); if (v458) { R.bossHpK = 2; delete R.bossDmgK; } /* (v460 R3: V458=1 plays it at v458's boss numbers) */ P.startRift('dunes', i); }, process.env.V458 === '1');
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 2400000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 2400000 }); await page.evaluate(() => { window.__pp.arc.paused = true; });
  console.log('stage up', el());
  let r = await ev(`const bb = D.mons.find(q => q.boss) || D.M.bossAt; me.x = bb.x; me.y = bb.y + 5.2; adv(1.0); return { fd: !!D.FD, started: !!(D.FD && D.FD.S.started), gl: !!(O && O.on()), fx: !!(O && O.fx()), foeK: D.F.rift && D.F.rift.foeK, bossK: M && M.bossK };`);
  console.log('  wake', JSON.stringify(r), el()); ok(r.fd, 'the fiend fight is up'); ok(!gl || r.gl, `the GPU model is ${gl ? 'on' : 'off'} (${r.gl})`);
  await draw(2); console.log('  first frames drawn', el());
  r = await ev(`adv(1.6); return { act: D.g.boss && D.g.boss.act, mode: M.mode };`); await draw(1); await shot('01-enter', 'it heaves up out of the Gullet and roars');
  r = await ev(`adv(3.6); const bb = D.g.boss; return { act: bb && bb.act, mode: M.mode };`); await draw(1); await shot('02-hunt', 'under the sand: its wake circles the pet');
  ok(r.act && r.act !== 'enter', `awake (${r.act}, ${r.mode})`);
  r = await ev(`return { foeK: D.F.rift && D.F.rift.foeK, bossK: M && M.bossK };`); ok(tag === 'before' || r.bossK === (r.foeK ? r.foeK.boss : 1), `its health K is the rift's foeK.boss (${r.bossK}; foeK ${JSON.stringify(r.foeK)})`);
  const force = k => ev(`window.__daFired = window.__daFired || {}; b.stunT = 0; me.x = b.x + 0.3; me.y = b.y + 4.5; adv(0.2); const k = arg; b.act = 'hunt'; b.actT = 0;
      if (DEF.force) DEF.force(FX, k); else for (let i = 0; i < 400 && b.act !== k; i++) { FX.S.tele.length = 0; b.stunT = 0; b.act = 'hunt'; b.actT = 99; me.x = b.x + 0.3; me.y = b.y + 4.5; U.update(0.001); if (b.act !== k) { FX.S.tele.length = 0; b.act = 'hunt'; b.actT = 0; } }
      for (const s of FX.S.tele) if (!s.__w) { s.__w = 1; const f = s.fn; s.fn = x => { window.__daFired[k] = (window.__daFired[k] || 0) + 1; if (f) f(x); }; }
      return { act: b.act, teles: FX.S.tele.length, wait: Math.max(...FX.S.tele.map(s => s.t)), geo: FX.S.tele.map(s => (s.sar || '') + ':' + (s.geo || s.shape)) };`, k);
  const ACTS = [['wake', 'Sand Wake'], ['breach', 'Breach'], ['spit', 'Spit Grit']];
  for (const [k, nm] of ACTS) { const s0 = await force(k); console.log(`  ${k}`, JSON.stringify(s0)); ok(s0.act === k && s0.teles > 0, `${nm}: started, ${s0.teles} warning(s) (${[...new Set(s0.geo)].join(',')})`);
    if (gl) ok(s0.geo.every(g => g.startsWith(k === 'breach' ? 'breach' : k) && g.endsWith(':' + (k === 'wake' ? 'line' : 'circle'))), `${nm}: its warning is light in the sand (marked)`);
    const wind = s0.wait * 0.6, nfr = Math.max(0, Math.round(wind * FR)); for (let i = 0; i < nfr; i++) { await ev(`adv(${(wind / (nfr + 1)).toFixed(3)});`); await draw(1); }
    await ev(`adv(${(wind / (nfr + 1)).toFixed(3)});`); await draw(1); await shot(`1${ACTS.findIndex(a => a[0] === k)}a-${k}-tell`, `${nm}: the tell`);
    r = await ev(`const k = arg[0]; let n = 0; while (!(window.__daFired[k] > 0) && n++ < 120) adv(0.05); adv(arg[1]); const S = M.g3; return { fired: window.__daFired[k] || 0, mode: M.mode, fx: S ? S.fx.map(f => f.kind) : [], rise: +(M.rise || 0).toFixed(2) };`, [k, k === 'spit' ? 1.2 : k === 'breach' ? 0.45 : 0.3]);
    await draw(1); await shot(`1${ACTS.findIndex(a => a[0] === k)}b-${k}-strike`, `${nm}: the strike`); console.log(`  ${k} strike`, JSON.stringify(r)); ok(r.fired > 0, `${nm}: its blow fired (${r.fired})`);
    if (k === 'breach') { r = await ev(`adv(0.5); return { mode: M.mode, q: FX.S.tele.filter(s => s.sar === 'quake' || s.shape === 'ring').length };`); await draw(1); await shot('11c-breach-land', 'Breach: it comes down; Quake Rings roll out'); console.log('  quake', JSON.stringify(r)); }
    r = await ev(`const k = arg; let n = 0; while ((b.act === k || FX.S.tele.some(s => !s.done)) && n++ < 240) adv(0.05); return { act: b.act, left: FX.S.tele.filter(s => !s.done).length };`, k);
    ok(r.left === 0 && r.act !== k, `${nm}: recovered (${r.act})`); }
  // the resonance: a spire broken while it is under -> forced up in bloom, its heart a weak point
  r = await ev(`b.act = 'hunt'; b.actT = -3; M.mode = 'under'; adv(0.3); const o = D.mons.find(q => q.fobj && q.kind === 'spire' && !q.dead); if (o) D.hitMon(o, 1e12, { flat: true }); adv(1.0); return { spire: !!o, stun: +(b.stunT || 0).toFixed(2), bloom: +(M.bloom || 0).toFixed(2), weak: !!(D.FD.S.weak.throat && !D.FD.S.weak.throat.dead), mode: M.mode };`);
  await draw(1); await shot('20-resonance', 'a spire broken: forced up in bloom, the heart bared'); console.log('  resonance', JSON.stringify(r)); ok(r.stun > 0 && r.weak && r.bloom > 0.6, 'the resonance: forced up, in bloom, its heart a weak point');
  // its health x foeK.boss: the same blow on its body and on its heart, with its K and with K = 1
  r = await ev(`const W = D.FD.S.weak.throat, hit = (q, d) => { const h0 = b.hp; D.FD.S.roarT = 0; D.hitMon(q, d, { flat: true }); return h0 - b.hp; };
    const K = M.bossK; const body2 = hit(b, 500), weak2 = W ? hit(W, 500) : null; M.bossK = 1; if (W) W.forward = 2.4; const body1 = hit(b, 500), weak1 = W ? hit(W, 500) : null; M.bossK = K; if (W) W.forward = 2.4 / K;
    return { K, body: [+body2.toFixed(1), +body1.toFixed(1)], weak: weak2 == null ? null : [+weak2.toFixed(1), +weak1.toFixed(1)], maxhp: Math.round(b.maxhp), barHP: Math.round(D.FD.barHP), bars: D.FD.S.bars };`);
  console.log('  health', JSON.stringify(r)); if (tag !== 'before') { ok(r.K === (+process.env.BOSSK || 6) && Math.abs(r.body[1] / r.body[0] - r.K) < 0.05, `its body takes a blow at 1/${r.K} (v460 R3: foeK.boss 6, three times v458's 2; BOSSK=2 for a v458 build): ${r.body[0]} (K ${r.K}) vs ${r.body[1]} (K 1): effective health x${(r.body[1] / r.body[0]).toFixed(2)}`); ok(r.weak && Math.abs(r.weak[1] / r.weak[0] - r.K) < 0.05, `its heart too: ${r.weak && r.weak[0]} vs ${r.weak && r.weak[1]} (x${r.weak && (r.weak[1] / r.weak[0]).toFixed(2)})`); }
  await draw(1); await shot('21-heart-hit', 'its bared heart struck');
  r = await ev(`adv(6.5); return { stun: +(b.stunT || 0).toFixed(2), mode: M.mode, bloom: +(M.bloom || 0).toFixed(2) };`); console.log('  after', JSON.stringify(r)); ok(!(r.stun > 0), 'it dives again');
  // its blows x foeK.dmg: a Sand Wake's (the engine's hurt, its own) and a spat grain's (a shot it fired: wornBy), with the rift's K and with 1
  if (tag !== 'before') { r = await ev(`const fk = D.F.rift && D.F.rift.foeK, K0 = fk ? fk.dmg : 1, god = P.st.dun.god; P.st.dun.god = false; const res = {};
    const meas = async (k, place) => { const out = []; for (const dk of [K0, 1]) { if (fk) fk.dmg = dk; let got = null; for (let tries = 0; tries < 6 && got == null; tries++) { FX.S.tele.length = 0; D.eshots && (D.eshots.length = 0); b.stunT = 0; b.act = 'hunt'; b.actT = 0; me.inv = 0; adv(0.1); DEF.force(FX, k); let n = 0;
          while (got == null && n++ < 160) { place(); me.hp = 5000; me.inv = 0; me.dodge = null; me.dash = null; U.update(0.05); if (me.hp < 5000) got = 5000 - me.hp; if (b.act !== k && !FX.S.tele.length && n > 20) break; } } out.push(got == null ? null : +got.toFixed(1)); } return out; };
    res.wake = await meas('wake', () => { const W = M.wk; if (W) { me.x = W.x0 + Math.cos(W.a) * 3.5; me.y = W.y0 + Math.sin(W.a) * 3.5; } });
    res.spit = await meas('spit', () => { if (M.sp && M.sp.go && M.rise > 0.7) { const a = FX.angPet(b.x, b.y); me.x = b.x + Math.cos(a) * 3.2; me.y = b.y + Math.sin(a) * 3.2; } else { me.x = b.x + 0.4; me.y = b.y + 5.2; } });
    if (fk) fk.dmg = K0; P.st.dun.god = god; FX.S.tele.length = 0; b.act = 'hunt'; b.actT = 0; adv(0.5); res.dmg = Math.round(b.dmg); res.K = K0; return res;`);
  console.log('  blows', JSON.stringify(r)); if (tag !== 'before') for (const k of ['wake', 'spit']) { const v = r[k]; ok(v && v[0] != null && v[1] != null && Math.abs(v[0] / v[1] - 2) < 0.08, `its ${k} blow x2 (the rift's foe blow; v460's x3 is in its m.dmg ${r.dmg}): ${v && v[0]} (foeK.dmg ${r.K}) vs ${v && v[1]} (1)`); } }
  // the second phase: the roar, two wakes, skitters
  r = await ev(`me.hp = D.ST.hp; b.stunT = 0; b.hp = b.maxhp * 0.45; let n = 0; while (D.FD.S.phase < 2 && n++ < 80) adv(0.05); adv(0.4); return { phase: D.FD.S.phase, lv: D.FD.S.lv, roar: +(M.roar || 0).toFixed(2) };`);
  await draw(1); await shot('30-phase', 'the second phase: it rears and roars'); console.log('  phase', JSON.stringify(r)); ok(r.phase >= 2, `the second phase (${r.phase})`);
  r = await ev(`let n = 0, sk = 0; while (n++ < 400) { adv(0.05); sk = D.mons.filter(q => !q.dead && q.type === 'skitter').length; if (sk && n > 60) break; } return { skitters: sk };`);
  await draw(1); await shot('31-brood', 'skitters burst from the sand'); console.log('  brood', JSON.stringify(r)); ok(r.skitters > 0, `skitters (${r.skitters})`);
  for (const [k, nm] of ACTS) { const f = await ev(`return (window.__daFired || {})[arg] || 0;`, k); ok(f > 0, `${nm}: fired over the fight (${f})`); }
  const e0 = errors.length; ok(e0 === 0, `no page errors in the fight (${e0})`); if (e0) console.log(errors.slice(0, 5).join('\n'));
  // its fall, then the stage's end
  r = await ev(`window.__daOld = D.FD; for (const q of D.mons) if (!q.dead && !q.boss && !q.fobj) { q.hp = 0; q.dead = true; } b.stunT = 0; FX.untarget(false); b.under = false; D.hitMon(b, 1e12, { pierce: true }); adv(0.8); const S = M.g3; return { dead: !!b.dead, end: !!(S && S.end), husk: !!M.husk };`);
  await draw(1); await shot('40-fall-a', 'its fall: it heaves up in full bloom'); console.log('  fall', JSON.stringify(r)); ok(r.dead, 'it falls'); if (gl) ok(r.end && r.husk, 'its own fall is staged (the husk drawn on)');
  await ev(`adv(0.9);`); await draw(1); await shot('41-fall-b', 'the bloom bursts; the blades drop');
  await ev(`adv(1.0);`); await draw(1); await shot('42-fall-c', 'it topples onto the sand');
  r = await ev(`adv(2.4); const S = M.g3; return { t: S && S.end ? +S.end.t.toFixed(2) : null, sink: S && S.end ? +S.end.sink.toFixed(2) : null };`); await draw(1); await shot('43-fall-d', 'it sinks; the sand closes over it'); console.log('  sunk', JSON.stringify(r));
  r = await ev(`let n = 0; while (P.arc.state !== 'end' && n++ < 400) { adv(0.05); if (n % 40 === 0) await frame(); } return { state: P.arc.state, won: D.g.won };`);
  ok(r.state === 'end' && r.won, `the stage ends in a win (${r.state})`);
  const e1 = errors.length; ok(e1 === 0, `no page errors to the end (${e1})`); if (e1 > e0) console.log(errors.slice(e0, e0 + 5).join('\n'));
  // the clean-up: the closed stage's pictures given back; the next stage made lets go of this file's pointers
  r = await ev(`const F0 = window.__daOld; P.closeArcade(true); await frame(); const arena = !!(F0 && F0.S.arenaCv); P.openMap(); P.dun.setMapTab('rift', true); P.startRift('dunes', 0); await new Promise(res => setTimeout(res, 600));
    const O2 = P.FIEND_DEFS.sarrukh.MODEL; return { arenaKept: arena, spires: O2 ? O2.__dbg.spires : -1, last: O2 ? !!O2.__dbg.last : null, stats: O2 ? O2.__dbg.glStats : null };`);
  console.log('  cleanup', JSON.stringify(r)); ok(!r.arenaKept, 'the closed stage gave its arena picture back'); if (gl) ok(r.spires === 0 && r.last === false, 'the next stage let go of the spire pictures and the last view');
  const e2 = errors.length; ok(e2 === 0, `no page errors at all (${e2})`); if (e2 > e1) console.log(errors.slice(e1, e1 + 5).join('\n'));
  await browser.close(); console.log('done', el(), fails ? `${fails} FAILED` : 'all ok');
  if (SH && shots.length) require('child_process').execFileSync('python3', [path.join(__dirname, '_da-sheet.py'), `${tag}-d${dpr}${glEnv ? '' : '-2d'}`, '--cols', '4', '--w', '260', ...shots], { stdio: 'inherit' });
})();
