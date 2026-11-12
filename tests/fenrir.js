// Fenrir (Ice's 11th Ultimate): the spec's verify list and the brief's (docs/ICE-FENRIR-BRIEF.md), as far as logic can
// check it, on the real game.   usage: HTML=test-fenH.html EVO=4 node tests/fenrir.js   (A's 20k8n core, E's 20k8o moves)
// Each scenario starts a fresh floor and casts Susano O from the pet's kit. Visual items (the model, the cockpit's
// readability, the transformation's collision-free paths, the effects' look) are checked by the montages, not here;
// they are listed as 'manual' at the end. The damage audit is tests/ult-damage-rank.js.
// The hooks it reads (g._fenrir and its stats) are listed in the brief's Notes (H, 2026-11-12); `pick` below takes the
// first name that exists, so a renamed field needs one line here.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const EVO = +(process.env.EVO || 4);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'warning' && /Fenrir|Frozen|Diamond/.test(m.text())) errors.push('console: ' + m.text()); });
  let bad = 0, n = 0; const ok = (c, m, x) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);

  // ---- the roster ----
  const ros = await page.evaluate(() => { const P = window.__pp, U = P.ELEM_MOVES.ice.ult; return { n: U.length, i: U.findIndex(r => r[0] === 'fenrir'), old: U.findIndex(r => r[0] === 'diamonddust'), cd: (U.find(r => r[0] === 'fenrir') || [])[4], impl: typeof P.ELEM_IMPL.ice.ult.fenrir, old2: typeof P.ELEM_IMPL.ice.ult.diamonddust, FM: typeof self.FENRIR_MOVES === 'object' ? Object.keys(self.FENRIR_MOVES) : null }; });
  ok(ros.i === 10 && ros.n === 11, 'Fenrir is the 11th Ice Ultimate', ros);
  ok(ros.cd === 120, 'its outer cooldown in the roster is 120 s', ros.cd);
  ok(ros.impl === 'function', 'U.fenrir is implemented');
  ok(ros.old === 1 && ros.old2 === 'function', 'the old Ice ult Diamond Dust is still the 2nd and still implemented');
  console.log('E\'s moves:', ros.FM ? ros.FM.join(',') : 'absent');
  if (ros.impl !== 'function') { await browser.close(); console.log('core absent: stopping'); process.exit(1); }
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Fen'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });
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
      const mv = P.ELEM_LIST.ice.ey_fenrir; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo }));
      const H = { P, G, D, me, g, kit0, log: [], hold: null };
      H.step = (s, each) => { const t1 = g.t + s; let k = 0; while (g.t < t1 - 1e-6 && k++ < 6000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); if (each && each() === true) break; } };
      H.until = (fn, cap) => { const t1 = g.t + (cap || 10); let k = 0; while (!fn() && g.t < t1 && k++ < 9000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); } return fn(); };
      H.S = () => g._fenrir;
      /* tolerant accessors (see the Notes): the first name that exists */
      const pick = (o, names, d) => { for (const n of names) if (o && o[n] != null) return o[n]; return d; };
      H.pick = pick; const FINS = ['finisher', 'dust', 'frozen', 'ult', 'finish'], RIDE = ['ride', 'bike', 'wolf', 'drive', 'run', 'play'];
      const FIN = S => !!S && (FINS.includes(S.phase) || !!(S.ctx && (S.ctx.finisher || S.ctx.frozen || S.ctx.dust)));
      H.fin = FIN; H.ready = S => RIDE.includes(S.phase) && !S.drift && !(S.V && S.V.locked);
      H.form = S => { const f = pick(S, ['form'], pick(S.V, ['form'], null)); return f === 1 || f === 'wolf' ? 'wolf' : 'bike'; };
      H.left = S => pick(S, ['left'], S.endT != null ? S.endT - g.t : null);
      H.st = (S, names) => pick(S.stats, names, pick(self.FENRIR_MOVES && self.FENRIR_MOVES.stats, names, 0));
      H.drifting = S => S.phase === 'drift' || !!S.drift;
      H.wrap = () => { const S = H.S(), X = S.X; if (X.__w) return; X.__w = 1; const h0 = X.hitMon; X.hitMon = (m, d, o) => { const r = h0(m, d, o); if (m && !m._tag) m._tag = 'n' + (H.nTag = (H.nTag || 0) + 1); const s2 = H.S(); H.log.push({ m: m && m._tag, d: r, nc: !!(s2 && FIN(s2)), ph: s2 ? s2.phase : 'none', form: s2 ? H.form(s2) : '', dr: !!(s2 && H.drifting(s2)), boss: !!(m && m.boss), frz: m ? m.freeze : 0, t: g.t }); return r; }; };   /* (every hit of the session, A's own Glides and Dive included; Dark Messiah's are the noCharge ones) */
      H.cast = () => { D.useUlt(); H.until(() => H.S() && H.ready(H.S()), 10); if (H.S()) H.wrap(); return H.S(); };
      H.labels = () => { const L = [], f0 = window.GFX_LABELS_PATCH; const GF = P.GFX, l0 = GF.labelS; GF.labelS = (c, s) => { L.push(String(s)); }; try { const cv = document.createElement('canvas'); cv.width = 400; cv.height = 900; const c = cv.getContext('2d'); const pic = (k, w, h, paint) => { const q = document.createElement('canvas'); q.width = Math.max(1, w | 0); q.height = Math.max(1, h | 0); try { paint(q.getContext('2d'), q.width, q.height); } catch (e) {} return q; };
        D.VEH.drawBtns(c, { B: D.vehBtns(), blitC: () => {}, hudPic: pic, glowPic: () => pic('', 4, 4, () => {}), touchUI: true }); } finally { GF.labelS = l0; } void f0; return L; };
      H.face = a => { const S = H.S(); S.mx = Math.cos(a); S.my = Math.sin(a); const K = P.arc.keys; if (K) { K.right = Math.cos(a) > 0.5; K.left = Math.cos(a) < -0.5; K.down = Math.sin(a) > 0.5; K.up = Math.sin(a) < -0.5; } H.step(1 / 60); };
      H.release = () => { const K = P.arc.keys; if (K) K.right = K.left = K.up = K.down = false; };
      H.press = k => { if (k === 'ult') D.useUlt(); else if (k === 'dodge') D.dodge(); else D.useStrong(k); };
      return (new Function('H', 'arg', src))(H, arg);
    }, [EVO, body, arg === undefined ? null : arg]);
  }
  const R = async (name, body, arg) => { try { return await scen(name, body, arg); } catch (e) { ok(false, name + ': ' + e.message.split('\n')[0]); return null; } };

  const DUR = { 1: 20, 2: 20, 3: 20, 4: 25, 5: 25, 6: 25, 7: 35 }[EVO], NPROJ = EVO >= 7 ? 6 : EVO >= 4 ? 4 : 2;
  // helpers used inside scenarios (strings): wait until controllable; a Drift to its end
  const LIB = `
    const { D, g, me } = H; const S = H.cast(); if (!S) return { err: 'no session' };
    const ready = () => H.until(() => H.ready(S) && !S.busy, 8);
    const drift = () => { const f0 = H.form(S), d0 = H.st(S, ['drifts']); H.face(0); H.press('dodge'); H.release(); H.until(() => H.drifting(S), 1); H.until(() => !H.drifting(S) && H.ready(S), 8); H.step(0.15); return { from: f0, to: H.form(S), drifts: H.st(S, ['drifts']) - d0 }; };
    const cdS2 = () => H.pick(S.cd, ['s2', 'strong2', 'wheel', 'somersault'], 0), cdCan = () => H.pick(S.cd, ['cannon', 's1', 'strong'], 0);
  `;

  // ---- 1. the bike: menu, Ice Cannon's projectiles, Somersault (no switch), Drift -> wolf (once), the wolf's menu, Spinning Wheel, Drift back ----
  const A = await R('forms', LIB + `
    ready(); const out = { form0: H.form(S), left0: +H.left(S).toFixed(2), lab1: H.labels(), cdHeld: g.cdU };
    // Ice Cannon: projectiles launched per activation
    const sh0 = H.st(S, ['shots', 'cannonShots', 'projectiles']), n0 = H.log.length; H.press('strong'); H.step(3.2); out.shots = H.st(S, ['shots', 'cannonShots', 'projectiles']) - sh0; out.cannonHits = H.log.slice(n0).length; out.formAfterCannon = H.form(S); ready();
    // Somersault: stays a bike, two damage events at most per enemy (growth, shatter), starts the shared cooldown
    const sw0 = H.st(S, ['switches']), n1 = H.log.length; H.press('strong2'); H.step(0.2); out.cdS2 = +cdS2().toFixed(2); H.until(() => !S.busy, 6); H.step(1.5); out.som = H.log.slice(n1).map(h => h.m); out.formAfterSom = H.form(S); out.swSom = H.st(S, ['switches']) - sw0; ready();
    // Drift (bike -> wolf): sweep hits once per enemy, endpoint spikes, one switch; the timer, gauge and cooldowns carried
    const c0 = S.charge, sp0 = H.st(S, ['spikes', 'driftSpikes']), sw1 = H.st(S, ['switches']), n2 = H.log.length, cdB = +cdS2().toFixed(2), tB = g.t, leftB = H.left(S), cdU0 = g.cdU;
    out.drift1 = drift(); const DL = H.log.slice(n2); out.d1 = { hits: DL.length, per: DL.reduce((o, h) => (o[h.m] = (o[h.m] || 0) + 1, o), {}), spikes: H.st(S, ['spikes', 'driftSpikes']) - sp0, switches: H.st(S, ['switches']) - sw1,
      leftOK: Math.abs((leftB - (g.t - tB)) - H.left(S)) < 0.06, chargeKept: S.charge >= c0 - 1e-9, cdCarried: Math.abs(Math.max(0, cdB - (g.t - tB)) - cdS2()) < 0.08, cdB, cdNow: +cdS2().toFixed(2), cdU: g.cdU === cdU0 };
    out.lab2 = H.labels();
    // the wolf's Spinning Wheel shares Somersault's cooldown (still running from the bike?) and never switches form
    S.cd && ('s2' in S.cd ? S.cd.s2 = 0 : 0); H.until(() => cdS2() <= 0, 8); const sw2 = H.st(S, ['switches']), n3 = H.log.length; H.press('strong2'); H.step(0.2); out.cdWheel = +cdS2().toFixed(2); H.until(() => !S.busy, 8); H.step(0.5); out.wheel = H.log.slice(n3).map(h => h.m); out.formAfterWheel = H.form(S); out.swWheel = H.st(S, ['switches']) - sw2; ready();
    // the wolf's Ice Cannon: same count
    const sh1 = H.st(S, ['shots', 'cannonShots', 'projectiles']); H.until(() => cdCan() <= 0, 8); H.press('strong'); H.step(3.2); out.shotsWolf = H.st(S, ['shots', 'cannonShots', 'projectiles']) - sh1; ready();
    // Drift back (wolf -> bike)
    const sp1 = H.st(S, ['spikes', 'driftSpikes']); H.until(() => H.pick(S.cd, ['dodge', 'drift'], 0) <= 0, 6); out.drift2 = drift(); out.spikes2 = H.st(S, ['spikes', 'driftSpikes']) - sp1; out.lab3 = H.labels();
    out.totals = { drifts: H.st(S, ['drifts']), spikes: H.st(S, ['spikes', 'driftSpikes']), switches: H.st(S, ['switches']), menuSets: H.st(S, ['menuSets']) };
    return out;`);
  if (A && !A.err) {
    const has = (L, re) => L.some(s => re.test(s)), once = L => L.length === new Set(L).size;
    ok(A.form0 === 'bike', 'the summon starts in motorcycle form', A.form0);
    ok(Math.abs(A.left0 - DUR) < 1.2, `the summon lasts ${DUR} s at this tier`, A.left0);
    ok(has(A.lab1, /CANNON/) && has(A.lab1, /DRIFT/) && has(A.lab1, /SOMERSAULT/) && has(A.lab1, /DIAMOND|DUST/) && !has(A.lab1, /WHEEL|FROZEN/), 'motorcycle commands: Ice Cannon, Somersault, Drift, Diamond Dust', A.lab1);
    ok(A.shots === NPROJ, `Ice Cannon launches exactly ${NPROJ} projectiles (motorcycle)`, A.shots);
    ok(A.formAfterCannon === 'bike' && A.formAfterSom === 'bike' && A.swSom === 0, 'Ice Cannon and Somersault never switch form', A);
    ok(A.som.length > 0 && Object.values(A.som.reduce((o, m) => (o[m] = (o[m] || 0) + 1, o), {})).every(c => c <= 2), 'Somersault hits: at most the growth and the shatter per enemy', A.som);
    ok(A.cdS2 > 0, 'Somersault starts the shared second-Strong cooldown', A.cdS2);
    ok(A.drift1.from === 'bike' && A.drift1.to === 'wolf' && A.drift1.drifts === 1 && A.d1.switches === 1, 'a completed Drift turns the motorcycle into the wolf, exactly once', A.drift1);
    ok(A.d1.spikes === 1, 'the Drift ends in its ice-spike eruption (one per Drift)', A.d1.spikes);
    ok(A.d1.hits > 0 && Object.values(A.d1.per).every(c => c <= 2), 'Drift damages: at most the sweep and the spikes per enemy', A.d1.per);
    ok(A.d1.leftOK && A.d1.chargeKept && A.d1.cdU, 'the form switch keeps the timer running, the gauge and the outer cooldown untouched', A.d1);
    ok(A.d1.cdCarried, 'the shared second-Strong cooldown is carried across the switch (not reset)', { before: A.d1.cdB, now: A.d1.cdNow });
    ok(has(A.lab2, /CANNON/) && has(A.lab2, /DRIFT/) && has(A.lab2, /WHEEL/) && has(A.lab2, /FROZEN/) && !has(A.lab2, /SOMERSAULT|DIAMOND/), 'wolf commands: Ice Cannon, Spinning Wheel, Drift, Frozen', A.lab2);
    ok(A.wheel.length > 0 && A.cdWheel > 0 && A.formAfterWheel === 'wolf' && A.swWheel === 0, 'Spinning Wheel hits, uses the shared cooldown and never switches form', { hits: A.wheel.length, cd: A.cdWheel });
    ok(A.shotsWolf === NPROJ, `Ice Cannon launches exactly ${NPROJ} projectiles (wolf)`, A.shotsWolf);
    ok(A.drift2.from === 'wolf' && A.drift2.to === 'bike' && A.spikes2 === 1 && has(A.lab3, /SOMERSAULT/), 'Drift from the wolf: spikes, then back to the motorcycle and its commands', A.drift2);
    ok(A.totals.drifts === 2 && A.totals.spikes === 2 && A.totals.switches === 2, 'two Drifts: two eruptions, two switches, nothing else switched', A.totals);
  } else ok(false, 'forms sequence ran', A);

  // ---- 2. the gauge and Diamond Dust (bike): full gauge only, once, freezes monsters but never a boss, no damage at the exit ----
  const B = await R('dust', LIB + `
    ready(); let boss = null; try { boss = D.lesserBoss(S.V.x + 2.2, S.V.y - 1.6, 0.5, 'Test'); } catch (e) { boss = null; } if (boss) { boss.hp = boss.maxhp = 1e8; boss.act = 'move'; boss.cd = 99; boss.dmg = 0; boss.x = S.V.x + 2.2; boss.y = S.V.y - 1.6; boss._tag = 'boss'; boss.chill = 0; }
    S.charge = 0.5; H.step(0.4); D.useUlt(); H.step(0.2); const notFull = H.fin(S); S.charge = 1; H.step(0.4); const n0 = H.log.length, sw0 = H.st(S, ['switches']); D.useUlt(); H.step(0.1); const started = H.fin(S) || S.used;
    let relT = null, frozen = 0, bossFrozen = 0, bossChill = 0; H.until(() => { for (const m of D.mons) if (m._tag && !m.dead) { if (m.boss) { bossFrozen = Math.max(bossFrozen, m.freeze || 0); bossChill = Math.max(bossChill, m.chill || 0); if (boss) { boss.cd = 99; } } else if (m.freeze > 0) frozen = Math.max(frozen, m.freeze); } if (relT == null && S.released) relT = g.t; return S.phase === 'gone' && relT != null && g.t - relT > 1.5; }, 30);
    const L = H.log.slice(n0), per = L.reduce((o, h) => (o[h.m] = (o[h.m] || 0) + 1, o), {}), late = L.filter(h => relT != null && h.t > relT).length;
    const dustN = H.st(S, ['dust']); let fxGone = null; const tg0 = g.t; H.until(() => { if (!D.ELEM.fx.some(f => /fenrir/i.test(f.key || ''))) { fxGone = +(g.t - relT).toFixed(2); return true; } return false; }, 12);
    return { notFull, started, per, n: L.length, frozen: +frozen.toFixed(2), bossFrozen, hasBoss: !!boss, bossHit: per.boss || 0, bossChill: +bossChill.toFixed(2), sw: H.st(S, ['switches']) - sw0, late, used: S.used, dustN, fxGone, chargeAfter: S.charge, cdAtExit: g.cdU, cdSet: H.st(S, ['cdSet']), walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), veh: !!(D.VEH && D.VEH.active), petAlt: !!me.petAlt, fx: D.ELEM.fx.map(f => f.key || '?'), dealtNC: S.charge };`);
  if (B && !B.err) {
    ok(!B.notFull, 'Diamond Dust does not start below a full gauge');
    ok(B.started && B.n > 0, 'Diamond Dust starts at full gauge and deals damage', B.per);
    ok(B.frozen > 2.5 && B.frozen <= 3.05, 'it freezes ordinary monsters for about 3 s through the Ice status', B.frozen);
    ok(B.hasBoss && B.bossHit > 0 && B.bossFrozen === 0 && B.bossChill > 0, 'a real boss is hit and chilled, never frozen (the game\'s boss rule)', { boss: B.hasBoss, hit: B.bossHit, frozen: B.bossFrozen, chill: B.bossChill });
    ok(B.sw === 0, 'Diamond Dust\'s burnout does not trigger the Drift form switch', B.sw);
    ok(B.late === 0, 'the exit (dissolve) deals no damage', B.late);
    ok(B.used && B.dustN === 1, 'one finisher per summon (the gauge is spent: used)', { used: B.used, dust: B.dustN });
    ok(Math.abs(B.cdAtExit - 120) < 4 && B.walk && !B.veh && !B.petAlt, 'after it: the 120 s cooldown runs, the pet stands on valid ground, controls are restored', B);
    ok(B.fxGone != null && B.fxGone < 8, 'its effects are all gone within 8 s of the release', B.fxGone);
  } else ok(false, 'Diamond Dust ran', B);

  // ---- 3. Frozen (wolf): the beam damages for exactly 5.00 s, in fixed ticks, the same count at 60 and at 20 fps ----
  const frozenAt = fps => R('frozen@' + fps, LIB + `
    ready(); drift(); const fps = arg; S.charge = 1; H.until(() => H.ready(S) && !S.busy, 6); H.step(0.4);
    { // three rooted targets in a row straight ahead of the wolf, on open floor with a clear line (the beam locks on the nearest and reaches 10 tiles)
      const V = S.V, W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let dir = 0, bestL = -1;
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; let L = 0; while (L < 8 && W(V.x + Math.cos(a) * (L + 0.5), V.y + Math.sin(a) * (L + 0.5))) L += 0.5; if (L > bestL) { bestL = L; dir = a; } }
      const tg = D.mons.filter(m => m._tag && !m.dead && !m.boss); tg.forEach((m, i) => { const d = i < 3 ? Math.max(1.8, Math.min(bestL - 1.8, 2.6 + i * 1.0)) : 60 + i; m.x = V.x + Math.cos(dir) * d; m.y = V.y + Math.sin(dir) * d; m.still = true; m.kbx = m.kby = 0; m.freeze = 0; if (i >= 3) m.dead = true; });
      H.face(dir); H.release(); H.placed = { bestL, n: Math.min(3, tg.length) }; H.pins = tg.slice(0, 3).map(m => [m, m.x, m.y]); } const n0 = H.log.length, sw0 = H.st(S, ['switches']); const ft0 = H.st(S, ['frozenTicks']), ovs = []; { const c = S.ctx, o0 = c.hitOval; if (o0 && !c.__ov) { c.__ov = 1; c.hitOval = (cx, cy, rx, ry, ang, d, o) => { const n = o0(cx, cy, rx, ry, ang, d, o); ovs.push([+(cx - S.V.x).toFixed(1), +(cy - S.V.y).toFixed(1), +rx.toFixed(1), +ry.toFixed(1), +ang.toFixed(2), n]); return n; }; } }
    D.useUlt(); H.step(0.05); const started = H.fin(S) || S.used;
    const G = H.G; let relT = null, k = 0; while (!(S.phase === 'gone' && relT != null && g.t - relT > 1) && k++ < 9000) { me.inv = 1; me.hp = Math.max(me.hp, 1); for (const m of D.mons) if (!m.dead && (!m._tag || m._tag[0] === 'n')) { m.dead = true; m.x += 90; }   /* (only the placed targets: the beam locks on the nearest enemy and would swing after a newcomer) */ for (const q of H.pins) { q[0].x = q[1]; q[0].y = q[2]; }   /* (held in place: the floor's monsters walk) */ G.update(1 / fps); if (relT == null && S.released) relT = g.t; if (S.ctx.frozenPlan && S.ctx.frozenPlan.t0 != null && !H.tr0) H.tr0 = D.mons.filter(m => m._tag && !m.dead).map(m => [m._tag, +m.x.toFixed(1), +m.y.toFixed(1), +S.V.x.toFixed(1), +S.V.y.toFixed(1), +S.V.heading.toFixed(2)]); if (S.ctx.frozenPlan && S.ctx.frozenPlan.fired === 19 && !H.tr1) H.tr1 = D.mons.filter(m => m._tag && !m.dead).map(m => [m._tag, +m.x.toFixed(1), +m.y.toFixed(1), +S.V.x.toFixed(1), +S.V.y.toFixed(1), +S.V.heading.toFixed(2)]); }
    const L = H.log.slice(n0), ts = L.map(h => h.t), per = {}; for (const h of L) (per[h.m] = per[h.m] || []).push(+h.t.toFixed(3));
    const one = Object.values(per).sort((a, b) => b.length - a.length)[0] || [], gaps = one.slice(1).map((t, i) => +(t - one[i]).toFixed(3)), plan = S.ctx.frozenPlan || null;
    return { started, form: H.form(S), placed: H.placed, perN: Object.fromEntries(Object.entries(per).map(([k, v]) => [k, v.length])), ticks: one.length, span: one.length ? +(one[one.length - 1] - one[0]).toFixed(3) : 0, gapMin: Math.min(...gaps), gapMax: Math.max(...gaps), plan: plan && { dur: +(plan.t1 - plan.t0).toFixed(3), ticks: plan.ticks, tick: plan.tick }, statTicks: H.st(S, ['frozenTicks']) - ft0, ovs: [ovs[0], ovs[9], ovs[19]], tgt: [H.tr0, H.tr1], sw: H.st(S, ['switches']) - sw0, late: L.filter(h => relT != null && h.t > relT).length, n: L.length };`, fps);
  const F60 = await frozenAt(60), F20 = await frozenAt(20), F30 = await frozenAt(30), F144 = await frozenAt(144);
  if (F60 && F20 && !F60.err && !F20.err) {
    ok(F60.started && F60.ticks > 1, 'Frozen starts from the wolf at full gauge and ticks', F60);
    const win = F => F.plan ? F.plan.dur : F.span + (F.gapMax || 0);
    ok(Math.abs(win(F60) - 5) < 0.02 + (F60.plan ? 0 : 0.06), 'the damaging beam lasts exactly 5.00 s', { window: win(F60), ticks: F60.ticks, plan: F60.plan });
    const FR = [F60, F20, F30, F144].filter(f => f && !f.err);
    ok(FR.length === 4 && FR.every(f => f.statTicks === 20 && f.plan && f.plan.ticks === 20 && Math.abs(f.plan.dur - 5) < 1e-6), 'exactly 20 ticks fire over 5.00 s at 20, 30, 60 and 144 fps', FR.map(f => f.statTicks));
    ok(FR.every(f => f.placed && Object.keys(f.perN).length === f.placed.n && Object.values(f.perN).every(c => c === 20)), 'every target standing in the beam takes all 20 ticks, at every frame rate', FR.map(f => f.perN));
    ok(FR.every(f => Math.abs(f.gapMin - 0.25) < 0.06 && Math.abs(f.gapMax - 0.25) < 0.06), 'ticks are 0.25 s apart on the game clock', FR.map(f => [f.gapMin, f.gapMax]));
    ok(F60.sw === 0 && F60.late === 0, 'Frozen never switches form; its exit shatter deals no damage', { sw: F60.sw, late: F60.late });
  } else ok(false, 'Frozen ran', { F60, F20 });

  // ---- 4. timeout without a finisher; one guarded cleanup; a committed finisher near expiry completes; defeat ----
  const T1 = await R('timeout', LIB + `
    ready(); const t0 = g.t, left0 = H.left(S); let tOut = null; H.until(() => { if (tOut == null && (S.phase === 'out' || S.released)) tOut = g.t; return S.phase === 'gone'; }, 50); H.step(1);
    return { left0: +left0.toFixed(2), ran: tOut ? +(tOut - t0).toFixed(2) : null, finHits: H.log.filter(h => h.nc).length, dust: H.st(S, ['dust']), frozen: H.st(S, ['frozen']), cdSet: H.st(S, ['cdSet']), cd: g.cdU, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), veh: !!(D.VEH && D.VEH.active), petAlt: !!me.petAlt, fx: D.ELEM.fx.map(f => f.key || '?'), mv: g.mvMods ? Object.keys(g.mvMods) : [] };`);
  if (T1 && !T1.err) {
    ok(T1.ran != null && Math.abs(T1.ran - T1.left0) < 0.15, 'the summon ends exactly at its timer', T1);
    ok(T1.finHits === 0 && !T1.dust && !T1.frozen, 'timeout grants no free finisher');
    ok(T1.walk && !T1.blocked && !T1.veh && !T1.petAlt && !T1.fx.some(k => /fenrir/i.test(k)) && !T1.mv.some(k => /fenrir/i.test(k)), 'timeout: safe dismount, controls restored, effects cleaned up', T1);
    ok(Math.abs(T1.cd - 120) < 2.5 && (T1.cdSet === 0 || T1.cdSet === 1), 'the 120 s cooldown starts once at the exit', { cd: T1.cd, sets: T1.cdSet });
  } else ok(false, 'timeout ran', T1);
  const T2 = await R('timeout-drift', LIB + `
    ready(); const end = g.t + 0.25; if (S.endT != null) S.endT = end; else S.left = 0.25; H.face(0); H.press('dodge'); H.release(); H.until(() => S.phase === 'gone', 10); H.step(1);
    return { phase: S.phase, late: H.log.filter(h => h.ph === 'out' || h.ph === 'gone').length, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0) };`);
  if (T2 && !T2.err) ok(T2.phase === 'gone' && T2.late === 0 && T2.walk && !T2.blocked, 'timeout during a Drift: a safe exit, no late hits', T2);
  const T3 = await R('finisher-near-expiry', LIB + `
    ready(); S.charge = 1; H.step(0.4); if (S.endT != null) S.endT = g.t + 0.3; else S.left = 0.3; D.useUlt(); const st = H.fin(S); H.step(1.0); const still = H.fin(S) || S.phase === 'out'; H.until(() => S.phase === 'gone', 30);
    return { st, still, hits: H.log.filter(h => h.nc).length };`);
  if (T3 && !T3.err) ok(T3.st && T3.hits > 0, 'a finisher committed just before expiry completes', T3);
  const T4 = await R('defeat', LIB + `
    ready(); drift(); S.charge = 1; H.until(() => H.ready(S), 6); H.step(0.4); D.useUlt(); H.until(() => H.log.some(h => h.nc), 12); const n0 = H.log.length; H.mortal = true; me.inv = 0; me.hp = 0; me.dead = true; H.step(4);
    return { dead: me.dead, after: H.log.length - n0, veh: !!(D.VEH && D.VEH.active), fx: D.ELEM.fx.map(f => f.key || '?') };`);
  if (T4 && !T4.err) ok(T4.dead && T4.after === 0 && !T4.veh && !T4.fx.some(k => /fenrir/i.test(k)), 'pet defeat during Frozen: the beam and its damage stop, the pet stays defeated, cleanup', T4);

  // ---- 5. the environment: attacks smash props; doors and bridges stay ----
  const E1 = await R('smash', LIB + `
    ready(); const X = S.X, P0 = X.carProps; if (!P0) return { noHook: true };
    const props = D.propList.filter(p => !p.broken), near = props.map(p => [p, Math.hypot(p.x - me.x, p.y - me.y)]).sort((a, b) => a[1] - b[1]).slice(0, 6).map(q => q[0]);
    const kinds0 = {}; for (const p of D.propList) kinds0[p.kind] = (kinds0[p.kind] || 0) + (p.broken ? 0 : 1);
    const M = D.M, bridges0 = M && M.tiles ? Array.from(M.tiles).filter(t => t === (self.T_BRIDGE != null ? self.T_BRIDGE : -99)).length : null;
    const b0 = D.propList.filter(p => p.broken).length, sm0 = H.st(S, ['smashed', 'smash']);
    // drive at the nearest props and attack there: a Drift through them, then the cannon and the second Strong
    for (const p of near.slice(0, 3)) { const a = Math.atan2(p.y - S.V.y, p.x - S.V.x); H.face(a); H.step(Math.min(1.5, Math.hypot(p.x - S.V.x, p.y - S.V.y) / 6)); H.until(() => H.pick(S.cd, ['dodge', 'drift'], 0) <= 0 && H.ready(S), 4); H.face(a); H.press('dodge'); H.release(); H.until(() => !H.drifting(S) && H.ready(S), 8); H.press('strong'); H.step(1.5); }
    const doors = D.propList.filter(p => /door|gate|stair|bridge/i.test(p.kind)), bridges1 = M && M.tiles ? Array.from(M.tiles).filter(t => t === (self.T_BRIDGE != null ? self.T_BRIDGE : -99)).length : null;
    return { broke: D.propList.filter(p => p.broken).length - b0, stat: H.st(S, ['smashed', 'smash']) - sm0, protectedBroken: doors.filter(p => p.broken).length, bridges0, bridges1, nearKinds: near.map(p => p.kind) };`);
  if (E1 && !E1.err) { if (E1.noHook) console.log('skip  no smash hook on this floor');
    else { ok(E1.broke > 0, 'Fenrir\'s attacks and driving smash environmental props', E1);
      ok(E1.protectedBroken === 0 && E1.bridges0 === E1.bridges1, 'doors, gates, stairs and bridges are kept', E1); } }

  ok(!errors.length, 'no page errors', errors.slice(0, 4));
  console.log('manual (montages / captures): transformation clearances and the continuous seat; exactly two tyres and two cannons in both forms; the pet in the open on the saddle, never yawed; spikes drawn at every Drift endpoint; effect quality; sound.');
  await browser.close();
  console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok`); process.exit(bad ? 1 : 0);
})();
