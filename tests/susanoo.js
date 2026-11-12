// Susano O (Dark's 12th Ultimate): the spec's §14 verify list, as far as logic can check it, on the real game.
// usage: HTML=test-susH.html EVO=4 node tests/susanoo.js          (A's 20k5w core; E's 20k5x moves when present)
// Each scenario starts a fresh floor and casts Susano O from the pet's kit. Visual items (the model, the cockpit's
// readability, the transformation's collision-free paths, the effects' look) are checked by the montages, not here;
// they are listed as 'manual' at the end. Dark Messiah's damage rank is tests/ult-damage-rank.js.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const EVO = +(process.env.EVO || 4);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'warning' && /Susano|Messiah/.test(m.text())) errors.push('console: ' + m.text()); });
  let bad = 0, n = 0; const ok = (c, m, x) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);
  // ---- the roster (§14: the Dark Ultimate list keeps its earlier entries; Susano O is the 12th) ----
  const ros = await page.evaluate(() => { const P = window.__pp, U = P.ELEM_MOVES.dark.ult; return { n: U.length, i: U.findIndex(r => r[0] === 'susanoo'), keys: U.map(r => r[0]), cd: (U.find(r => r[0] === 'susanoo') || [])[4], impl: typeof P.ELEM_IMPL.dark.ult.susanoo, SM: typeof self.SUSANOO_MOVES === 'object' ? Object.keys(self.SUSANOO_MOVES) : null }; });
  ok(ros.i === 11 && ros.keys[10] === 'dayofthedead', 'Susano O is the 12th Dark Ultimate, after Day of the Dead (earlier entries unchanged)', { i: ros.i, n: ros.n });
  ok(ros.cd === 240, 'its outer cooldown in the roster is 240 s', ros.cd);
  ok(ros.impl === 'function', 'U.susanoo is implemented');
  console.log('E\'s moves:', ros.SM ? ros.SM.join(',') : 'absent (A\'s stubs run)');
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Sus'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });
  /* a scenario: a fresh floor, monsters placed round the pet (sturdy, rooted), Susano O cast; fn runs in the page with
     helpers: step(s, each), S (the session), D, ctx hit log */
  async function scen(name, body, arg) {
    await page.evaluate(() => { const P = window.__pp; P.arc.paused = false; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => window.__pp.beginPlay());
    return page.evaluate(([evo, src, arg]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; P.arc.paused = true;
      for (let k = 0; k < 120; k++) G.update(1 / 60);
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
      for (let k = 0; k < 1500; k++) { const sx = me.x + (Math.random() - 0.5) * 34, sy = me.y + (Math.random() - 0.5) * 34; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.7) && W(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; }
      if (best) { me.x = best.x; me.y = best.y; }
      const spots = [[2.6, 0], [3.4, 1.2], [3.0, -1.4], [4.6, 0.4], [-2.8, 0.8], [0.6, 3.0]]; let i = 0;
      for (const m of D.mons) { if (m.boss) continue; if (i < spots.length) { let px = me.x + spots[i][0], py = me.y + spots[i][1]; for (let k = 0; k < 40 && !W(px, py); k++) { px = me.x + spots[i][0] * (1 - k / 40) + Math.cos(k) * 0.3; py = me.y + spots[i][1] * (1 - k / 40) + Math.sin(k) * 0.3; } spots[i] = [px - me.x, py - me.y]; } if (i < spots.length) Object.assign(m, { dead: false, x: me.x + spots[i][0], y: me.y + spots[i][1], hp: 1e8, maxhp: 1e8, still: true, spd: 0, atkCd: 99, dmg: 0, stun: 0, freeze: 0, falling: null, under: false, _tag: 'm' + i }); else Object.assign(m, { dead: true, x: me.x + 90 }); i++; }
      me.hp = D.ST.hp; me.mp = 999; me.dead = false; g.intro = 0; g.bossIntro = 0; g.cdU = 0;
      const kit0 = { s: D.KITR.strong && D.KITR.strong.key, s2: D.KITR.strong2 && D.KITR.strong2.key, d: D.KITR.dodge && D.KITR.dodge.key };
      const mv = P.ELEM_LIST.dark.ey_susanoo; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo }));
      const H = { P, G, D, me, g, kit0, log: [], hold: null };
      H.step = (s, each) => { const t1 = g.t + s; let k = 0; while (g.t < t1 - 1e-6 && k++ < 6000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); if (each && each() === true) break; } };
      H.until = (fn, cap) => { const t1 = g.t + (cap || 10); let k = 0; while (!fn() && g.t < t1 && k++ < 9000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); } return fn(); };
      H.S = () => g._susanoo;
      H.wrap = () => { const S = H.S(), X = S.X; if (X.__w) return; X.__w = 1; const h0 = X.hitMon; X.hitMon = (m, d, o) => { const r = h0(m, d, o); if (m && !m._tag) m._tag = 'n' + (H.nTag = (H.nTag || 0) + 1); const s2 = H.S(); H.log.push({ m: m && m._tag, d: r, nc: !!(s2 && s2.phase === 'messiah'), ph: s2 ? s2.phase : 'none', t: g.t }); return r; }; };   /* (every hit of the session, A's own Glides and Dive included; Dark Messiah's are the noCharge ones) */
      H.cast = () => { D.useUlt(); H.until(() => H.S() && H.S().phase === 'robot', 8); if (H.S()) H.wrap(); return H.S(); };
      H.labels = () => { const L = [], f0 = window.GFX_LABELS_PATCH; const GF = P.GFX, l0 = GF.labelS; GF.labelS = (c, s) => { L.push(String(s)); }; try { const cv = document.createElement('canvas'); cv.width = 400; cv.height = 900; const c = cv.getContext('2d'); const pic = (k, w, h, paint) => { const q = document.createElement('canvas'); q.width = Math.max(1, w | 0); q.height = Math.max(1, h | 0); try { paint(q.getContext('2d'), q.width, q.height); } catch (e) {} return q; };
        D.VEH.drawBtns(c, { B: D.vehBtns(), blitC: () => {}, hudPic: pic, glowPic: () => pic('', 4, 4, () => {}), touchUI: true }); } finally { GF.labelS = l0; } void f0; return L; };
      H.face = a => { const S = H.S(); S.mx = Math.cos(a); S.my = Math.sin(a); const K = P.arc.keys; if (K) { K.right = Math.cos(a) > 0.5; K.left = Math.cos(a) < -0.5; K.down = Math.sin(a) > 0.5; K.up = Math.sin(a) < -0.5; } H.step(1 / 60); };
      H.release = () => { const K = P.arc.keys; if (K) K.right = K.left = K.up = K.down = false; };
      H.press = k => { if (k === 'ult') D.useUlt(); else if (k === 'dodge') D.dodge(); else D.useStrong(k); };
      return (new Function('H', 'arg', src))(H, arg);
    }, [EVO, body, arg === undefined ? null : arg]);
  }
  const R = async (name, body, arg) => { try { return await scen(name, body, arg); } catch (e) { ok(false, name + ': ' + e.message.split('\n')[0]); return null; } };

  // ---- 1. the full sequence: robot (menu, x1.35, attacks, charge) -> Transform (held Ult) -> airship -> Dark Messiah -> exit ----
  const A = await R('full', `
    const { D, g, me } = H, S = H.cast(); if (!S) return { err: 'no session' };
    const out = { mv0: g.mvMods ? g.mvMods.susanoo : null, mvSet: S.stats.mvSet, leftR0: +S.leftR.toFixed(2), cdHeld: g.cdU, lab1: H.labels() };
    // robot attacks: Glides into the line of monsters, Death Ray (Strong 1), Dark Spikes; one hit per enemy per activation
    H.face(0); const n0 = H.log.length; const gs0 = S.stats.glides, pre = { busy: S.busy, cd: S.cd.dodge, locked: S.V.locked, glide: !!S.glide }; H.press('dodge'); H.release(); out.gdbg = { pre, started: S.stats.glides - gs0, v: [S.V.x - H.me.x, S.V.vx], mons: H.D.mons.filter(m => m._tag && !m.dead).map(m => [m._tag, +(m.x - S.V.x).toFixed(1), +(m.y - S.V.y).toFixed(1)]) }; H.step(1.2); out.glide = H.log.slice(n0).map(h => h.m); out.gdbg.after = [S.stats.glideHit, +S.V.x.toFixed(1)];
    const n1 = H.log.length; H.press('strong'); H.step(2.6); out.blade = H.log.slice(n1).map(h => h.m);
    const n2 = H.log.length; H.press('strong2'); H.step(3.6); out.spikes = H.log.slice(n2).map(h => h.m);
    out.chargeR = S.charge; out.robotHits = H.log.filter(h => h.ph === 'robot' && !h.nc).length;
    // Transform, the Ult key hammered every frame through the fold (a held press must not chain into the finisher)
    const hp0 = me.hp, ch0 = S.charge, cd0 = g.cdU; S.charge = Math.min(S.charge, 0.999); D.useUlt(); out.xf = S.phase; let k = 0;
    H.until(() => { if (k++ % 2 === 0) D.useUlt(); return S.phase === 'air'; }, 12);
    for (let j = 0; j < 8; j++) { D.useUlt(); H.step(1 / 60); }
    out.afterXf = { phase: S.phase, leftA: +S.leftA.toFixed(2), airGrants: S.stats.airGrants, messiah: S.stats.messiah, chargeKept: Math.abs(S.charge - Math.min(ch0, 0.999)) < 1e-6, hpKept: me.hp === hp0, mvSet: S.stats.mvSet, mv: g.mvMods ? g.mvMods.susanoo : null, cd: g.cdU, cd0 };
    out.lab2 = H.labels();
    // airship: the second Strong does nothing; Pulsar charges the same meter
    const cnt = () => [S.stats.blade, S.stats.spikes, S.stats.pulsar].join(','), s0 = cnt(); H.press('strong2'); H.step(0.3); out.s2 = { same: cnt() === s0, busy: S.busy };
    const c1 = S.charge, n3 = H.log.length; H.step(0.4); H.press('strong'); H.step(2.4); out.pulsar = H.log.slice(n3).map(h => h.m); out.chargeAirUp = S.charge > c1 || S.charge >= 0.999;
    const n4 = H.log.length; { const V = S.V, L = H.D.mons.filter(m => m._tag && !m.dead).sort((p, q) => Math.hypot(p.x - V.x, p.y - V.y) - Math.hypot(q.x - V.x, q.y - V.y)); H.face(L.length ? Math.atan2(L[0].y - V.y, L[0].x - V.x) : 0); } H.step(0.3); const dv0 = S.stats.dives, dpre = { busy: S.busy, cd: S.cd.dodge, locked: S.V.locked, z: +S.V.z.toFixed(2) }; H.press('dodge'); H.release(); H.step(1.4); out.dive = H.log.slice(n4).map(h => h.m); out.ddbg = { dpre, started: S.stats.dives - dv0, hit: S.stats.diveHit, bad: S.stats.diveBad, mons: H.D.mons.filter(m => m._tag && !m.dead).slice(0, 6).map(m => [m._tag, +(m.x - S.V.x).toFixed(1), +(m.y - S.V.y).toFixed(1)]) };
    // the finisher: not below full; then full and a fresh press
    S.charge = 0.5; H.step(0.4); D.useUlt(); H.step(0.1); out.notFull = S.phase;
    S.charge = 1; H.step(0.4); const n5 = H.log.length; D.useUlt(); out.msh = { phase: S.phase, flag: S.ctx.messiah };
    const tM = g.t; let exitT = null, cdAtExit = null, gone = null; H.until(() => { if (exitT == null && S.released) { exitT = g.t; cdAtExit = g.cdU; } return S.phase === 'gone' && g.t - (exitT || g.t) > 1; }, 24);
    const ML = H.log.slice(n5); const per = {}; for (const h of ML) per[h.m] = (per[h.m] || 0) + 1;
    out.mhits = { n: ML.length, per, allNC: ML.every(h => h.nc), chargeAfter: S.charge, dur: exitT ? +(exitT - tM).toFixed(2) : null };
    out.exit = { phase: S.phase, released: S.released, cdAtExit, cdSet: S.stats.cdSet, mvClear: S.stats.mvClear, mv: g.mvMods ? g.mvMods.susanoo : null, veh: !!(D.VEH && D.VEH.active), walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), pos: [+me.x.toFixed(2), +me.y.toFixed(2)], r: me.r, petAlt: !!me.petAlt, kitUlt: D.KITR.ult && D.KITR.ult.key, kit: { s: D.KITR.strong && D.KITR.strong.key, s2: D.KITR.strong2 && D.KITR.strong2.key }, kit0: H.kit0, airT: +S.stats.airT.toFixed(2), robotT: +S.stats.robotT.toFixed(2) };
    const tl = g.t; H.step(3); out.cdLater = g.cdU; out.cdDrop = +(out.exit.cdAtExit - g.cdU).toFixed(2); out.cdEl = +((g.t - tl) + (g.t - g.t)).toFixed(2); out.sinceExit = +(g.t - exitT).toFixed(2); out.cdSet2 = S.stats.cdSet; out.fx = D.ELEM.fx.map(f => f.key || '?');
    return out;`);
  if (A && !A.err) {
    ok(A.mv0 === 1.35 && A.mvSet === 1, 'the movement modifier is exactly 1.35, applied once', { mv: A.mv0, set: A.mvSet });
    ok(A.leftR0 > 34.5 && A.leftR0 <= 35, 'robot control starts at 35 s', A.leftR0);
    ok(['GLIDES', 'DEATH RAY', 'DARK SPIKES', 'TRANSFORM'].every(s => A.lab1.includes(s)), 'robot controls: Glides, Death Ray, Dark Spikes, Transform', A.lab1);
    const once = L => L.length === new Set(L).size;
    ok(A.glide.length > 0 && once(A.glide), 'Glides hits, one hit per enemy', A.glide.length ? A.glide : A.gdbg);
    ok(A.blade.length > 0 && once(A.blade), 'Death Ray hits, one hit per enemy', A.blade);
    ok(A.spikes.length > 0, 'Dark Spikes hits (an eruption and a burst: at most one hit each per enemy)', A.spikes);
    ok(Object.values(A.spikes.reduce((o, m) => (o[m] = (o[m] || 0) + 1, o), {})).every(c => c <= 2), 'Dark Spikes: no enemy hit more than twice (one per phase)');
    ok(A.chargeR > 0 && A.robotHits > 0, 'robot damage fills the meter', A.chargeR);
    ok(A.xf === 'xform', 'Transform commits from the robot (no meter needed)');
    ok(A.afterXf.phase === 'air' && A.afterXf.messiah === 0, 'Transform hands over to the playable airship; the hammered Ult never fires Dark Messiah', A.afterXf);
    ok(A.afterXf.leftA > 19.7 && A.afterXf.leftA <= 20 && A.afterXf.airGrants === 1, 'a fresh 20 s airship phase, granted exactly once', A.afterXf);
    ok(A.afterXf.chargeKept && A.afterXf.hpKept, 'Transform keeps the charge and HP');
    ok(A.afterXf.mvSet === 1 && A.afterXf.mv === 1.35 && A.afterXf.cd === A.afterXf.cd0, 'Transform neither re-applies x1.35 nor starts the outer cooldown', A.afterXf);
    ok(['DIVE', 'PULSAR'].every(s => A.lab2.includes(s)) && !A.lab2.includes('DARK SPIKES') && !A.lab2.includes('DEATH RAY') && A.lab2.some(s => /MESSIAH/.test(s)), 'airship controls: Dive, one Pulsar, Dark Messiah; no second Strong', A.lab2);
    ok(A.s2.same && !A.s2.busy, 'the second Strong binding does nothing in the airship', A.s2);
    ok(A.pulsar.length > 0 && A.chargeAirUp, 'Shockwave Pulsar hits and airship damage fills the same meter', A.pulsar);
    ok(A.dive.length > 0 && once(A.dive), 'Dive hits, one hit per enemy', A.dive.length ? A.dive : A.ddbg);
    ok(A.notFull === 'air', 'Dark Messiah does not start below full charge', A.notFull);
    ok(A.msh.phase === 'messiah' && A.msh.flag, 'Dark Messiah starts from the airship at full charge on a fresh press', A.msh);
    ok(A.mhits.n > 0 && Object.values(A.mhits.per).every(c => c === 1), 'Dark Messiah: one final explosion hit per enemy (no repeated hits)', A.mhits);
    ok(A.mhits.chargeAfter === 0, 'its damage never refills the meter (noCharge)', A.mhits);
    ok(A.exit.released && A.exit.phase === 'gone', 'the session ends after Dark Messiah', A.exit.phase);
    ok(Math.abs(A.exit.cdAtExit - 240) < 0.05 && Math.abs(240 - A.cdLater - A.sinceExit) < 0.1 && A.cdSet2 === 1, 'the 240 s cooldown starts once, at the final exit, and runs from there', { atExit: A.exit.cdAtExit, later: A.cdLater, sinceExit: A.sinceExit, sets: A.cdSet2 });
    ok(A.exit.mvClear === 1 && A.exit.mv == null, 'the x1.35 is removed once', A.exit);
    ok(A.exit.walk && !A.exit.blocked, 'the pet is set down on valid ground');
    ok(!A.exit.veh && !A.exit.petAlt && A.exit.kitUlt === 'ey_susanoo' && A.exit.kit.s === A.exit.kit0.s && A.exit.kit.s2 === A.exit.kit0.s2, 'controls and the kit are restored', A.exit);
    ok(!A.fx.some(k => /susano/i.test(k)), 'its effects are cleaned up', A.fx);
  } else ok(false, 'full sequence ran', A);

  // ---- 2. timers: robot timeout at 35 s; airship timeout 20 s after an EARLY Transform (no carried seconds); <= 55 s ----
  const B = await R('timers', `
    const { D, g } = H, S = H.cast(); const t0 = g.t; let tOut = null; H.until(() => { if (S.phase === 'out' && tOut == null) tOut = g.t; return S.phase === 'gone'; }, 45);
    const r1 = { robot: tOut ? +(tOut - t0).toFixed(2) : null, cd: g.cdU, cdSet: S.stats.cdSet };
    return r1;`);
  if (B) ok(B.robot != null && Math.abs(B.robot - 35) < 0.12 && B.cdSet === 1, 'robot control lasts exactly 35 s, then a safe exit (cooldown once)', B);
  const C2 = await R('early', `
    const { D, g } = H, S = H.cast(); H.step(5); D.useUlt(); H.until(() => S.phase === 'air', 12); const ta = g.t, leftA = S.leftA; let tOut = null;
    H.until(() => { if (S.phase === 'out' && tOut == null) tOut = g.t; return S.phase === 'gone'; }, 30);
    return { leftA: +leftA.toFixed(2), air: tOut ? +(tOut - ta).toFixed(2) : null, robotT: +S.stats.robotT.toFixed(2), airT: +S.stats.airT.toFixed(2) };`);
  if (C2) { ok(C2.air != null && Math.abs(C2.air - 20) < 0.12 && C2.leftA <= 20, 'an early Transform gives exactly 20 s of airship (no carried robot seconds)', C2);
    ok(C2.robotT + C2.airT <= 55.05, 'controllable time stays within 55 s', C2); }

  // ---- 3. boundary and cancellation cases ----
  const D1 = await R('xf-at-expiry', `
    const { D, g } = H, S = H.cast(); S.leftR = 1 / 120; D.useUlt(); H.step(0.05); const ph = S.phase; H.until(() => S.phase === 'gone' || S.phase === 'air', 12);
    return { first: ph, end: S.phase, grants: S.stats.airGrants };`);
  if (D1) ok((D1.end === 'air' && D1.grants === 1) || (D1.end === 'gone' && D1.grants === 0), 'Transform at the expiry boundary: exactly one of transform or timeout runs', D1);
  const D2 = await R('timeout-glide', `
    const { D, g, me } = H, S = H.cast(); S.mx = 1; S.my = 0; S.leftR = 0.15; const n0 = H.log.length; H.press('dodge'); H.until(() => S.phase === 'gone', 10); H.step(1);
    return { phase: S.phase, late: H.log.slice(n0).filter(h => h.ph === 'out' || h.ph === 'gone').length, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), pos: [+me.x.toFixed(2), +me.y.toFixed(2)], r: me.r, cd: S.stats.cdSet };`);
  if (D2) ok(D2.phase === 'gone' && D2.late === 0 && D2.walk && !D2.blocked && D2.cd === 1, 'timeout during Glides: a safe exit, no late hits', D2);
  const D3 = await R('timeout-dive', `
    const { D, g, me } = H, S = H.cast(); D.useUlt(); H.until(() => S.phase === 'air', 12); H.step(0.4); H.face(0); S.leftA = 0.2; const n0 = H.log.length; H.press('dodge'); H.until(() => S.phase === 'gone', 12); H.step(1);
    return { phase: S.phase, late: H.log.slice(n0).filter(h => h.ph === 'out' || h.ph === 'gone').length, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), pos: [+me.x.toFixed(2), +me.y.toFixed(2)], r: me.r };`);
  if (D3) ok(D3.phase === 'gone' && D3.late === 0 && D3.walk && !D3.blocked, 'timeout during a Dive: the pet is set down on valid ground, no late hits', D3);
  const D4 = await R('timeout-xform', `
    const { D, g, me } = H, S = H.cast(); D.useUlt(); H.step(0.8); const ph = S.phase; H.g.won = false; S.ctx.__force = 1; me.dead = false; D.party && 0;
    // a forced cancellation mid-fold: the floor's end (as the encounter ending) through the session's own exit
    H.g.over = true; H.step(0.3); H.g.over = false; H.until(() => S.phase === 'gone', 10);
    return { mid: ph, end: S.phase, grants: S.stats.airGrants, messiah: S.stats.messiah, hits: H.log.filter(h => h.nc).length, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)) };`);
  if (D4) ok(D4.mid === 'xform' && D4.end === 'gone' && D4.grants === 0 && D4.messiah === 0 && D4.hits === 0, 'cancellation mid-Transform: a safe return, no airship time, no free finisher damage', D4);
  const D5 = await R('messiah-near-expiry', `
    const { D, g } = H, S = H.cast(); D.useUlt(); H.until(() => S.phase === 'air', 12); H.step(0.4); S.charge = 1; S.leftA = 0.3; D.useUlt(); const ph = S.phase; H.step(1.0); const still = S.phase;
    H.until(() => S.phase === 'gone', 20); return { ph, still, end: S.phase, mh: H.log.filter(h => h.nc).length };`);
  if (D5) ok(D5.ph === 'messiah' && D5.still === 'messiah' && D5.end === 'gone' && D5.mh > 0, 'Dark Messiah started near expiry completes (its damage lands)', D5);
  const D6 = await R('defeat', `
    const { D, g, me } = H, S = H.cast(); D.useUlt(); H.until(() => S.phase === 'air', 12); H.step(0.4); S.charge = 1; D.useUlt(); H.step(1.0);
    const n0 = H.log.length; H.mortal = true; me.inv = 0; me.hp = 0; me.dead = true; H.step(4);
    return { phase: S.phase, dead: me.dead, after: H.log.length - n0, veh: !!(D.VEH && D.VEH.active), fx: D.ELEM.fx.map(f => f.key || '?') };`);
  if (D6) ok(D6.dead && D6.after === 0 && !D6.veh && !D6.fx.some(k => /susano/i.test(k)), 'pet defeat during Dark Messiah: it stays defeated, the beam and damage stop, controls are cleared', D6);
  const D7 = await R('robot-full-meter', `
    const { D, g } = H, S = H.cast(); S.charge = 1; H.step(0.4); D.useUlt(); H.step(0.1); return { phase: S.phase, messiah: S.stats.messiah };`);
  if (D7) ok(D7.phase === 'xform' && D7.messiah === 0, 'in robot form the Ult is Transform even with a full meter (Dark Messiah only from the airship)', D7);

  // ---- 4. the robot's basic sword swing (the game's basic-attack input), and none in the airship ----
  const SW = await R('swing', `
    const { D, g, G } = H, S = H.cast(); const tap = () => { H.P.arc.game.key('tap', true); H.P.arc.keys && (H.P.arc.keys.tap = false); };
    const c0 = S.charge, n0 = H.log.length; tap(); H.step(0.5); const one = H.log.slice(n0).filter(h => h.ph === 'robot').map(h => h.m), sw1 = S.stats.swings || 0;
    const n1 = H.log.length; H.step(0.1); tap(); H.step(0.5); const two = H.log.slice(n1).filter(h => h.ph === 'robot').map(h => h.m), sw2 = S.stats.swings || 0;
    const chargeUp = S.charge > c0;
    D.useUlt(); H.until(() => S.phase === 'air', 12); H.step(0.5); const n2 = H.log.length, s0 = S.stats.swings || 0; tap(); H.step(0.6); tap(); H.step(0.6);
    return { one, two, sw1, sw2, chargeUp, air: { swings: (S.stats.swings || 0) - s0, hits: H.log.slice(n2).length, busy: S.busy, phase: S.phase } };`);
  if (SW) { const once = L => L.length === new Set(L).size;
    ok(SW.sw1 === 1 && SW.one.length > 0 && once(SW.one), 'a basic attack swings the robot\'s sword: it hits, each target once per swing', SW);
    ok(SW.sw2 === 2 && SW.two.length > 0 && once(SW.two) && SW.chargeUp, 'the next swing at the attack cadence hits again (once each) and charges the meter', { sw2: SW.sw2, two: SW.two, chargeUp: SW.chargeUp });
    ok(SW.air.swings === 0 && SW.air.hits === 0 && SW.air.phase === 'air', 'in the airship the basic attack does nothing (no basic weapon)', SW.air); }
  // ---- (A, round 6) Glides: no cooldown, a 4-stage combo (presses chain 1 -> 2 -> 3 -> 4, then a new combo), one hit per enemy per stage, the finisher's shockwave ----
  const GC = await R('glides-combo', `
    const { D, g, me } = H, S = H.cast(); const out = {}; const dodge = () => D.dodge();
    H.face(0); H.release(); H.step(0.2); const per = { 1: [], 2: [], 3: [], 4: [] }, st0 = { ...S.stats }; let n0 = H.log.length, lastN = 0, waveTag = null, maxN = 0;
    dodge(); const seq = [];
    H.step(2.6, () => { const Gl = S.glide; if (Gl) { lastN = Gl.n; maxN = Math.max(maxN, Gl.n); if (!seq.length || seq[seq.length - 1] !== Gl.n) seq.push(Gl.n); }
      for (const h of H.log.slice(n0)) if (h.ph === 'robot' && lastN) per[lastN].push(h.m); n0 = H.log.length;
      // a monster placed just outside the blade but inside the shockwave right before the finisher's slam
      if (Gl && Gl.n === 4 && !waveTag) { const St = H.P.ELEM_IMPL.dark.ult.susanoo.TUNE.combo.st[3]; if (Gl.t >= St.prep + St.act - 1.5 / 60) { const m = D.mons.find(q => !q.dead && !q.boss && !Gl.hits.has(q)); if (m) { m.x = S.V.x; m.y = S.V.y + 3.3; m.hp = m.maxhp = 1e8; m.still = true; m.spd = 0; m.kbx = m.kby = 0; m.push = null; if (!m._tag) m._tag = 'w'; waveTag = m._tag; } } }
      if (Gl && !Gl.next && Gl.n < 4) dodge(); if (Gl && Gl.n === 4 && Gl.t > 0.1) {} });
    out.seq = seq; out.maxN = maxN; out.per = per; out.stats = { g1: (S.stats.glide1 || 0) - (st0.glide1 || 0), g2: (S.stats.glide2 || 0) - (st0.glide2 || 0), g3: (S.stats.glide3 || 0) - (st0.glide3 || 0), g4: (S.stats.glide4 || 0) - (st0.glide4 || 0), fin: (S.stats.finisherHit || 0) - (st0.finisherHit || 0) };
    out.wave = waveTag ? per[4].includes(waveTag) : null; out.waveTag = waveTag;
    // after the finisher: the combo resets; no cooldown (the next press starts stage 1 at once)
    H.until(() => !S.glide, 2); out.reset = S.comboN; dodge(); out.next = S.glide ? S.glide.n : null; out.cd = S.cd.dodge;
    // mashing: a stage can't be cut short (presses every frame give at most one stage per prep + act)
    H.until(() => !S.glide, 2); H.step(0.6); const m0 = S.stats.glides, t0 = g.t; H.step(1.0, () => { dodge(); }); out.mash = { stages: S.stats.glides - m0, secs: +(g.t - t0).toFixed(2) };
    return out;`);
  if (GC) { const once = L => L.length === new Set(L).size;
    ok(GC.seq.slice(0, 4).join() === '1,2,3,4' && GC.stats.g1 >= 1 && GC.stats.g2 >= 1 && GC.stats.g3 >= 1 && GC.stats.g4 >= 1, 'Glides chain 1 -> 2 -> 3 -> 4 on presses in the combo window', { seq: GC.seq, stats: GC.stats });
    ok([1, 2, 3, 4].every(k => once(GC.per[k])) && [1, 2, 3].some(k => GC.per[k].length > 0), 'one hit per enemy per stage', GC.per);
    ok(GC.stats.fin > 0 && GC.wave === true, 'the finisher slams with a dark shockwave beyond the blade', { fin: GC.stats.fin, wave: GC.wave, p4: GC.per[4] });
    ok(GC.reset === 0 && GC.next === 1 && GC.cd === 0, 'after the finisher the combo resets; no cooldown (the next press starts stage 1 at once)', { reset: GC.reset, next: GC.next, cd: GC.cd });
    ok(GC.mash.stages >= 2 && GC.mash.stages <= 5, 'mashing gives no more than about one stage per 0.27-0.5 s (no stage is cut short)', GC.mash);
  }
  ok(!errors.length, 'no page errors', errors.slice(0, 4));
  console.log('manual (montages / captures): cockpit readable in motion, attacks and the fold; the model matches the two-form concept; torso pitch, cockpit counter-rotation, helmet stow, wings, legs, thrusters, the rear skirt as dorsal cowling; the sword docks with no duplicate; Messiah fires from the docked sword focus clear of rider and hull; effects at Beast Machine / Sports Car quality.');
  await browser.close();
  console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok`); process.exit(bad ? 1 : 0);
})();
