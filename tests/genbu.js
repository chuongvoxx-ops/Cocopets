// Genbu (Earth's mechanical turtle; Calamity turns it into a drilling vehicle): the spec's verify line and its gameplay rules
// (scratchpad genbu/genbu-spec.txt; A's brief when it lands), on the real game.   usage: HTML=test-xyz.html EVO=4 node tests/genbu.js
// Skeleton: the model checks run as soon as the model is exposed; the scenarios are written against A's hook names.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const EVO = +(process.env.EVO || 4);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'warning' && /Genbu|Calamity/.test(m.text())) errors.push('console: ' + m.text()); });
  let bad = 0, n = 0; const ok = (c, m, x) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  if (process.env.GLFLAGS) await page.addInitScript(fl => { for (const f of fl) window[f] = 1; }, process.env.GLFLAGS.split(','));   // (GLFLAGS=__GENBU_GL: the GPU model and its effects, forced under software GL)
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);



  // ---- 0. the roster, the model: one connected part set at every transform value, four track pods ----
  const ros = await page.evaluate(() => { const P = window.__pp, U = (P.ELEM_MOVES.earth || {}).ult || [], I = (P.ELEM_IMPL.earth || {}).ult || {}, M = P.genbu || ((P.ELEM_IMPL.earth || {}).ult && P.ELEM_IMPL.earth.ult.genbu && P.ELEM_IMPL.earth.ult.genbu.__dbg ? P.ELEM_IMPL.earth.ult.genbu.__dbg.MODEL : null) || null;
    const out = { i: U.findIndex(r => r[0] === 'genbu'), cd: (U.find(r => r[0] === 'genbu') || [])[4], impl: typeof I.genbu, model: !!M };
    if (M && M.rigOf && M.blankPose) { try { const names = x => { const p = M.blankPose(); p.xf = x; return M.rigOf(p).list.map(it => it.part).sort().join(','); }, n0 = names(0); out.same = [0.25, 0.5, 0.75, 1].every(x => names(x) === n0); out.parts = n0.split(',').length;
      out.pods = [0, 0.5, 1].map(x => { const p = M.blankPose(); p.xf = x; return M.rigOf(p).list.filter(it => /track|pod|cassette/i.test(it.part)).length; }); out.counts = M.COUNTS || null;
      let fin = true, seat = true; for (let k = 0; k <= 20; k++) { const x = k <= 10 ? k / 10 : (20 - k) / 10, A = M.rigOf(Object.assign(M.blankPose(), { xf: x })).A; if (!A.seat) seat = false; for (const v of Object.values(A)) if (Array.isArray(v) && !v.every(Number.isFinite)) fin = false; }
      const Ad = M.rigOf(Object.assign(M.blankPose(), { xf: 1 })).A, k0 = (() => { const p = M.blankPose(), a = M.anchorAt('seat', 0, 0, 0, 0, p), r = M.rigOf(p).A.seat; return a.z / r[2]; })(); out.connect = { fin, seat }; out.trackZ = [0, 1, 2, 3].map(i => Ad['track' + i] ? +(Ad['track' + i][2] * k0).toFixed(2) : null); } catch (e) { out.modelErr = String(e); } }
    return out; });
  if (ros.model && ros.same != null) { ok(ros.same, 'turtle and drill forms: the identical part set at xf 0, 0.25, 0.5, 0.75 and 1', { parts: ros.parts });
    ok(ros.connect && ros.connect.fin && ros.connect.seat, 'the forms connect: xf 0 to 1 and back, every anchor finite, the seat always there', ros.connect);
    ok(ros.trackZ.every(z => z != null && Math.abs(z) < 0.35), 'in drill form the four track pods touch the floor', ros.trackZ);
    ok(ros.pods.every(n => n === ros.pods[0]) && (!ros.counts || (ros.counts.tracks || ros.counts.pods || 4) === 4), 'four persistent track units, the same in every form', { pods: ros.pods, counts: ros.counts }); } else console.log('skip  model rig not exposed yet', ros.modelErr || '');
  if (ros.impl !== 'function') { console.log('core absent: stopping'); await browser.close(); console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok (core absent)`); process.exit(1); }
  await page.evaluate(() => { const P = window.__pp, NEU = ['chill', 'leech', 'pierce', 'knock', 'shock']; let k = 0; do { P.quickStart('Gen'); } while (!NEU.includes(P.dun.petKit(P.st).AB.twist) && ++k < 200); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });
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
      if (best) { me.x = best.x; me.y = best.y; } const c0 = { x: me.x, y: me.y };
      const spots = [[2.6, 0], [3.4, 1.2], [3.0, -1.4], [4.6, 0.4], [-2.8, 0.8], [0.6, 3.0]]; let i = 0;
      for (const m of D.mons) { if (m.boss) continue; if (i < spots.length) { let px = me.x + spots[i][0], py = me.y + spots[i][1]; for (let k = 0; k < 40 && !W(px, py); k++) { px = me.x + spots[i][0] * (1 - k / 40) + Math.cos(k) * 0.3; py = me.y + spots[i][1] * (1 - k / 40) + Math.sin(k) * 0.3; } spots[i] = [px - me.x, py - me.y]; } if (i < spots.length) Object.assign(m, { dead: false, x: me.x + spots[i][0], y: me.y + spots[i][1], hp: 1e8, maxhp: 1e8, still: true, spd: 0, atkCd: 99, dmg: 0, stun: 0, freeze: 0, falling: null, under: false, _tag: 'm' + i }); else Object.assign(m, { dead: true, x: me.x + 90 }); i++; }
      me.hp = D.ST.hp; me.mp = 999; me.dead = false; g.intro = 0; g.bossIntro = 0; g.cdU = 0;
      const kit0 = { s: D.KITR.strong && D.KITR.strong.key, s2: D.KITR.strong2 && D.KITR.strong2.key, d: D.KITR.dodge && D.KITR.dodge.key };
      const mv = P.ELEM_LIST.earth.ey_genbu; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo }));
      const H = { P, G, D, me, g, kit0, log: [], hold: null };
      H.step = (s, each) => { const t1 = g.t + s; let k = 0; while (g.t < t1 - 1e-6 && k++ < 6000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); if (each && each() === true) break; } };
      H.until = (fn, cap) => { const t1 = g.t + (cap || 10); let k = 0; while (!fn() && g.t < t1 && k++ < 9000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); } return fn(); };
      H.S = () => g._genbu;
      /* tolerant accessors (see the Notes): the first name that exists */
      const pick = (o, names, d) => { for (const n of names) if (o && o[n] != null) return o[n]; return d; };
      H.pick = pick; const FINS = ['calamity', 'finisher', 'ult', 'xform', 'drill', 'roam', 'climax', 'crumble'], RIDE = ['ride', 'walk', 'play'];
      const FIN = S => !!S && (FINS.includes(S.phase) || !!(S.ctx && (S.ctx.finisher || S.ctx.calamity)));
      H.fin = FIN; H.ready = S => RIDE.includes(S.phase) && !S.roll && !S.jump && !S.busy && !(S.V && S.V.locked);
      H.form = S => { const f = pick(S, ['form'], pick(S.V, ['form'], null)); return f === 1 || f === 'wolf' ? 'wolf' : 'bike'; };
      H.left = S => pick(S, ['left'], S.endT != null ? S.endT - g.t : null);
      H.st = (S, names) => pick(S.stats, names, pick(self.GENBU_MOVES && self.GENBU_MOVES.stats, names, 0));
      H.rolling = S => S.phase === 'roll' || !!S.roll; H.drifting = H.rolling;
      H.wrap = () => { const S = H.S(), X = S.X; if (X.__w) return; X.__w = 1; const h0 = X.hitMon; X.hitMon = (m, d, o) => { const r = h0(m, d, o); if (m && !m._tag) m._tag = 'n' + (H.nTag = (H.nTag || 0) + 1); const s2 = H.S(); H.log.push({ m: m && m._tag, d: r, raw: d, nc: !!(s2 && FIN(s2)), ph: s2 ? s2.phase : 'none', form: s2 ? H.form(s2) : '', dr: !!(s2 && H.drifting(s2)), boss: !!(m && m.boss), frz: m ? m.freeze : 0, t: g.t }); return r; }; };   /* (every hit of the session, A's own Glides and Dive included; Dark Messiah's are the noCharge ones) */
      H.cast = () => { D.useUlt(); H.until(() => H.S() && H.ready(H.S()), 10); const S = H.S(); if (S) { H.wrap(); const b = S.body; b.x = b.prevX = c0.x; b.y = b.prevY = c0.y; me.x = c0.x; me.y = c0.y; } return S; };   /* (v336: Genbu now surfaces in front of the pet; the scenarios start it in the arena's open centre, as before) */
      H.labels = () => { const L = [], f0 = window.GFX_LABELS_PATCH; const GF = P.GFX, l0 = GF.labelS; GF.labelS = (c, s) => { L.push(String(s)); }; try { const cv = document.createElement('canvas'); cv.width = 400; cv.height = 900; const c = cv.getContext('2d'); const pic = (k, w, h, paint) => { const q = document.createElement('canvas'); q.width = Math.max(1, w | 0); q.height = Math.max(1, h | 0); try { paint(q.getContext('2d'), q.width, q.height); } catch (e) {} return q; };
        D.VEH.drawBtns(c, { B: D.vehBtns(), blitC: () => {}, hudPic: pic, glowPic: () => pic('', 4, 4, () => {}), touchUI: true }); } finally { GF.labelS = l0; } void f0; return L; };
      H.face = a => { const S = H.S(); S.mx = Math.cos(a); S.my = Math.sin(a); const K = P.arc.keys; if (K) { K.right = Math.cos(a) > 0.5; K.left = Math.cos(a) < -0.5; K.down = Math.sin(a) > 0.5; K.up = Math.sin(a) < -0.5; } H.step(1 / 60); };
      H.release = () => { const K = P.arc.keys; if (K) K.right = K.left = K.up = K.down = false; };
      H.press = k => { if (k === 'ult') D.useUlt(); else if (k === 'dodge') D.dodge(); else if (k === 'jump') { if (D.VEH && D.VEH.jump) D.VEH.jump(0, 0); } else D.useStrong(k); };
      H.dbg = () => P.ELEM_IMPL.earth.ult.genbu.__dbg;
      return (new Function('H', 'arg', src))(H, arg);
    }, [EVO, body, arg === undefined ? null : arg]);
  }
  const R = async (name, body, arg) => { try { return await scen(name, body, arg); } catch (e) { ok(false, name + ': ' + e.message.split('\n')[0]); return null; } };

  const DUR = { 1: 20, 2: 20, 3: 20, 4: 25, 5: 25, 6: 25, 7: 35 }[EVO];
  const LIB = `
    const { D, g, me } = H; const S = H.cast(); if (!S) return { err: 'no session' };
    const ready = () => H.until(() => H.ready(S) && (!S.ctx.drill || S.ctx.drill.state === 'docked'), 10);
    const zero = () => { ready(); for (const k of Object.keys(S)) if (/^cd[A-Z]/.test(k) && typeof S[k] === 'number') S[k] = 0; if (S.cd) for (const k in S.cd) S.cd[k] = 0; };
    const only = () => { for (const m of D.mons) if (!m.dead && !m.boss && (!m._tag || m._tag[0] === 'n')) { m.dead = true; m.x += 90; } };
    const pins = () => D.mons.filter(m => m._tag && m._tag[0] === 'm' && !m.dead).map(m => [m, m.x, m.y]);
    const hold = P0 => { only(); for (const q of P0) { q[0].x = q[1]; q[0].y = q[2]; } };
    const perM = L => L.reduce((o, h) => (o[h.m] = (o[h.m] || 0) + 1, o), {});
    const B = () => S.ctx.body, ahead = (d, side) => { const b = B(), a = b.a; return [b.x + Math.cos(a) * d - Math.sin(a) * (side || 0), b.y + Math.sin(a) * d + Math.cos(a) * (side || 0)]; };
    const place = (P0, d, spread) => { P0.forEach((q, i) => { const p = ahead(d + (i % 3) * 0.5, (i % 2 ? 1 : -1) * (spread || 0.6) * Math.ceil(i / 2) * 0.5); q[1] = p[0]; q[2] = p[1]; }); hold(P0); };
  `;
  /* 1. the ride: duration, the commands, Shell Roll and Jump both there and distinct (one right after the other, neither merged) */
  const A = await R('ride', LIB + `
    ready(); const out = { left: +H.left(S).toFixed(2), labels: H.labels(), jumpBtn: !!(D.VEH && D.VEH.jump) };
    const P0 = pins(); P0.forEach(q => { q[0].dead = true; q[0].x += 90; }); const r0 = H.st(S, ['roll']), j0 = H.st(S, ['jump']);
    H.press('dodge'); H.step(0.15); const rolling = !!S.ctx.roll; H.press('jump'); H.until(() => !S.ctx.roll, 3); H.until(() => H.st(S, ['jump']) > j0, 1.5); const jumpAfter = H.st(S, ['jump']) - j0;
    H.until(() => H.ready(S), 4); H.press('jump'); H.step(0.25); const inJump = H.st(S, ['jump']) - j0 >= 2; H.press('dodge'); H.until(() => H.ready(S) && H.st(S, ['roll']) > r0 + 1, 5);
    out.seq = { rolling, jumpAfterRoll: jumpAfter, inJump, rolls: H.st(S, ['roll']) - r0, jumps: H.st(S, ['jump']) - j0 }; return out;`);
  if (A && !A.err) { const has = re => A.labels.some(s => re.test(s));
    ok(Math.abs(A.left - DUR) < 1.2, `the form lasts ${DUR} s at this evo`, A.left);
    ok(has(/SHELL ROLL/) && has(/ROCK YOU/) && has(/DRILL CANNON/) && has(/CALAMITY/) && (has(/JUMP/) || A.jumpBtn), 'the commands: Shell Roll, Jump, Rock You, Drill Cannon, Calamity', A.labels);
    ok(A.seq.rolling && A.seq.jumpAfterRoll === 1 && A.seq.inJump && A.seq.rolls === 2 && A.seq.jumps === 2, 'Shell Roll and Jump are separate: a Jump pressed in a roll goes after it, a roll pressed in a jump goes after it', A.seq);
  } else ok(false, 'ride ran', A);
  /* 1b. the summon (v336): it drills up out of the ground in front of the pet (from below the floor, drill form), the pet waits on the ground, then climbs on */
  const SM = await R('summon', `
    const { D, g, me } = H; D.useUlt(); const S = H.S(); if (!S) return { err: 'no session' }; let riseMin = 0, xfMax = 0, petStill = true, apart = 0, n = 0;
    H.until(() => { n++; if (S.phase === 'summon') { riseMin = Math.min(riseMin, S.rise || 0); xfMax = Math.max(xfMax, S.P.xf || 0); if (S.t < S.ctx.SUMMON.mount0 && Math.hypot(me.x - S.petX0, me.y - S.petY0) > 0.05) petStill = false; apart = Math.max(apart, Math.hypot(S.body.x - S.petX0, S.body.y - S.petY0)); } return S.phase === 'walk'; }, 6);
    const seat = S.ctx.anchor('seat'); return { walk: S.phase === 'walk', riseMin: +riseMin.toFixed(2), xfMax: +xfMax.toFixed(2), petStill, apart: +apart.toFixed(2), onSeat: Math.hypot(me.x - S.body.x, me.y - S.body.y) < 0.05, seat: !!seat };`);
  if (SM && !SM.err) ok(SM.walk && SM.riseMin < -1.5 && SM.xfMax > 0.9 && SM.petStill && SM.apart > 1 && SM.onSeat, 'the summon: Genbu drills up from under the floor in front of the pet, which waits, then climbs on', SM); else ok(false, 'summon ran', SM);
  /* 2. Shell Roll: one hit per enemy per roll (the spikes never add a hit) */
  const RL = await R('roll', LIB + `
    ready(); const P0 = pins(); place(P0, 3.2, 0.8); zero(); const n0 = H.log.length; H.face(B().a); H.press('dodge'); H.release(); H.until(() => !S.ctx.roll && H.ready(S), 4); H.step(0.2);
    const L = H.log.slice(n0).filter(h => /^m/.test(h.m)); return { per: perM(L), dk: [...new Set(L.map(h => +(h.raw / S.DK).toFixed(2)))], hits: L.length, stat: H.st(S, ['rollHit']) };`);
  if (RL && !RL.err) ok(Object.keys(RL.per).length >= 1 && Object.values(RL.per).every(c => c === 1), 'Shell Roll: one hit per enemy per roll, whatever the spikes touch', RL); else ok(false, 'roll ran', RL);
  /* 3. Jump: repeated at the configured cadence, every landing on valid ground inside the arena, the stomp once per enemy per landing */
  const J = await R('jump', LIB + `
    ready(); const P0 = pins(); place(P0, 4.2, 0.8); zero(); const n0 = H.log.length, j0 = H.st(S, ['jump']), lands = []; let lastT = null;
    H.face(B().a); const t0 = g.t; H.until(() => { hold(P0); const jl = S.ctx.jumpLand; if (jl && jl.t !== lastT) { lastT = jl.t; lands.push({ t: +(jl.t - t0).toFixed(2), walk: !!D.walkAt(Math.floor(B().x), Math.floor(B().y)), blocked: D.blocked(B().x, B().y, 0.5, 0) }); } if (H.ready(S)) H.press('jump'); return lands.length >= 3 || g.t - t0 > 8; }, 9); H.release();
    const L = H.log.slice(n0).filter(h => /^m/.test(h.m)), byLand = {}; for (const h of L) { const k = lands.findIndex(l => Math.abs(h.t - t0 - l.t) < 0.1); const key = h.m + ':' + k; byLand[key] = (byLand[key] || 0) + 1; }
    return { jumps: H.st(S, ['jump']) - j0, lands, dup: Object.values(byLand).filter(c => c > 1).length, hits: L.length, gaps: lands.slice(1).map((l, i) => +(l.t - lands[i].t).toFixed(2)) };`);
  if (J && !J.err) { ok(J.lands.length >= 3 && J.lands.every(l => l.walk && !l.blocked), 'Jump repeats and every landing is on valid ground', J.lands);
    ok(J.hits > 0 && J.dup === 0, 'each landing stomp hits an enemy at most once', { hits: J.hits, dup: J.dup }); console.log('      jump cadence (s between landings):', J.gaps.join(', ')); } else ok(false, 'jump ran', J);
  /* 4. Rock You: two damage phases (eruption, explosion), each at most once per enemy; the debris deals nothing */
  const RK = await R('rock', LIB + `
    ready(); const P0 = pins(); place(P0, 4, 0.5); zero(); const n0 = H.log.length; H.press('strong'); let plan = null, bG = null; H.until(() => { hold(P0); if (S.ctx.rockPlan) plan = S.ctx.rockPlan; if (plan && plan.burst && bG == null) bG = g.t; return bG != null && g.t - bG > 0.8; }, 6);   /* (bG: the burst on the game clock; the plan keeps its own clock) */ H.step(0.6, () => hold(P0));
    const L = H.log.slice(n0).filter(h => /^m/.test(h.m)), bt = bG != null ? bG : 1e9, ph1 = L.filter(h => h.t < bt - 0.02), ph2 = L.filter(h => h.t >= bt - 0.02);
    return { crystals: plan ? plan.crystals.length : 0, p1: perM(ph1), p2: perM(ph2), dk1: [...new Set(ph1.map(h => +(h.raw / S.DK).toFixed(2)))], dk2: [...new Set(ph2.map(h => +(h.raw / S.DK).toFixed(2)))], late: L.filter(h => h.t > bt + 0.1).length };`);
  if (RK && !RK.err) { ok(Object.keys(RK.p1).length >= 1 && Object.values(RK.p1).every(c => c === 1), 'Rock You eruption: one hit per enemy across all the crystals', RK);
    ok(Object.keys(RK.p2).length >= 1 && Object.values(RK.p2).every(c => c === 1) && RK.late === 0, 'Rock You explosion: one hit per enemy, and nothing after it (debris is picture only)', RK); } else ok(false, 'Rock You ran', RK);
  /* 5. Drill Cannon (v336): fired at the target, it stays there drilling (a tick cadence per enemy), explodes once, a new bit materialises; no second cannon meanwhile */
  const DC = await R('cannon', LIB + `
    ready(); const P0 = pins(); place(P0, 5, 0.4); zero(); const n0 = H.log.length, d0 = H.st(S, ['drill']), r0 = H.st(S, ['rock']), ro0 = H.st(S, ['roll']); H.press('strong2'); const states = [], maxR = { d: 0 }; let away = false, tried = false, imp = null;
    H.until(() => { hold(P0); const d = S.ctx.drill; if (!states.length || states[states.length - 1] !== d.state) states.push(d.state); if (d.state === 'out' || d.state === 'drill') { away = true; maxR.d = Math.max(maxR.d, Math.hypot(d.x - B().x, d.y - B().y)); if (!tried && d.state === 'drill') { tried = true; H.press('strong2'); } } if (d.impact) imp = d.impact; return away && d.state === 'docked'; }, 8); H.step(0.3, () => hold(P0));
    const L = H.log.slice(n0).filter(h => /^m/.test(h.m)), it = imp ? imp.t : 1e9, TD = S.ctx.TUNE, isImp = h => Math.abs(h.t - it) <= 0.02 && h.raw / S.DK > (TD.drill.dmg + TD.drill.impact) / 2 * (TD.dmgK || 1), route = L.filter(h => h.t < it + 0.02 && !isImp(h)), im = L.filter(isImp)   /* (the impact by its damage (3.2 x DK; a route tick is 0.9): a tick on the frame before it is a route hit) */, byM = {}; for (const h of route) (byM[h.m] = byM[h.m] || []).push(h.t);
    const gapMin = Math.min(9, ...Object.values(byM).flatMap(ts => ts.slice(1).map((t, i) => t - ts[i])));
    return { states, maxR: +maxR.d.toFixed(2), casts: H.st(S, ['drill']) - d0, lockout: { rock: H.st(S, ['rock']) - r0, roll: H.st(S, ['roll']) - ro0 }, routePer: Object.fromEntries(Object.entries(byM).map(([k, v]) => [k, v.length])), gapMin: +gapMin.toFixed(2), imp: perM(im), docked: S.ctx.drill.state, docks: H.st(S, ['docks']) };`);
  if (DC && !DC.err) { ok(DC.states.includes('out') && DC.states.includes('drill') && DC.states.includes('mat') && !DC.states.includes('back') && DC.docked === 'docked', 'Drill Cannon: the bit is fired, drills where it lands, and a new one materialises (no return trip)', DC.states);
    ok(DC.maxR <= 9.6, 'its route stays within its 9-tile bound', DC.maxR);
    ok(Object.keys(DC.routePer).length >= 1 && Object.values(DC.routePer).every(c => c <= 4) && DC.gapMin >= 0.28, 'drilling in place: at most 4 grinding hits per enemy, never closer than 0.3 s apart', DC);
    ok(Object.keys(DC.imp).length >= 1 && Object.values(DC.imp).every(c => c === 1), 'the final impact hits each enemy once', DC.imp);
    ok(DC.casts === 1, 'no second Drill Cannon until the new bit has materialised', DC.casts); } else ok(false, 'Drill Cannon ran', DC);
  /* 6 + 7. the gauge, Calamity pressed while the bit is away (recall first), the roam, the eight drills, the crumble, the cooldown */
  const CAL = await R('calamity', LIB + `
    ready(); const P0 = pins(); place(P0, 4, 0.8);
    const c0 = S.charge; H.step(1.5); const idleCharge = S.charge - c0;   /* (standing about charges nothing) */
    zero(); H.press('strong2'); H.until(() => S.ctx.drill.state === 'out', 2); S.charge = 1; H.press('ult'); let sawRecall = false, xfWhileAway = false;
    const n0 = H.log.length, depth = { min: 9, max: -9 }; let strongs = null, drills = null, burstT = null, phases = [], outside = 0, dT0 = null, dT1 = null;
    const K = H.P.arc.keys; let k = 0;
    H.until(() => { hold(P0); const c = S.ctx.calamity; if (c) { if (!phases.length || phases[phases.length - 1] !== c.phase) phases.push(c.phase); if (c.phase === 'recall') sawRecall = true; if (c.phase === 'xform' && S.ctx.drill.state !== 'docked') xfWhileAway = true;
        if (c.phase === 'drill') { if (dT0 == null) dT0 = g.t; dT1 = g.t; k++; const b = B(); depth.min = Math.min(depth.min, b.z); depth.max = Math.max(depth.max, b.z); if (!D.walkAt(Math.floor(b.x), Math.floor(b.y))) outside++;
          K.right = (k % 240) < 120; K.left = !K.right; if (k === 30) H.press('dodge'); if (k === 150) H.press('jump'); if (k === 60 && strongs == null) { const r0 = H.st(S, ['rock']), d0 = H.st(S, ['drill']); H.press('strong'); H.step(0.05); H.press('strong2'); strongs = H.st(S, ['rock']) - r0 + H.st(S, ['drill']) - d0; } }
        if (c.drills && !drills) drills = c.drills.length; if (c.burstDone && burstT == null) burstT = g.t; } return S.released; }, 40); K.left = K.right = false; H.step(2);
    const L = H.log.slice(n0).filter(h => /^m/.test(h.m)), post = L.filter(h => burstT != null && h.t > burstT + 0.02);
    return { idleCharge, drillLen: dT0 == null ? 0 : +(dT1 - dT0).toFixed(2), drillDur: S.ctx.TUNE.cal.dur[S.tier], sawRecall, xfWhileAway, phases, depth: { min: +depth.min.toFixed(2), max: +depth.max.toFixed(2) }, outside, strongs, drills, charged: +H.st(S, ['charged']).toFixed(4), chargeEnd: +S.charge.toFixed(3), noChargeAll: L.every(h => h.nc), post: post.length,
      dives: H.st(S, ['dives']), rises: H.st(S, ['rises']), walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), cd: +g.cdU.toFixed(1), cdSet: H.st(S, ['cdSet']), veh: !!(D.VEH && D.VEH.active), drillState: S.ctx.drill && S.ctx.drill.state };`);
  if (CAL && !CAL.err) {
    ok(CAL.idleCharge === 0, 'standing about charges nothing (the gauge fills from mounted attacks only)', CAL.idleCharge);
    ok(CAL.sawRecall && !CAL.xfWhileAway, 'Calamity pressed while the bit is away recalls it, and the transform waits for the dock', { recall: CAL.sawRecall, xfAway: CAL.xfWhileAway, phases: CAL.phases });
    ok(CAL.dives >= 1 && CAL.rises >= 1 && CAL.depth.min < -0.8 && CAL.depth.min >= -1.2 && CAL.depth.max <= 1.5, 'Calamity is steerable: one command drills under and rises, within the depth and height bounds', { dives: CAL.dives, rises: CAL.rises, depth: CAL.depth });
    ok(CAL.outside === 0, 'it never leaves walkable space', CAL.outside);
    ok(Math.abs(CAL.drillLen - CAL.drillDur) < 0.3, 'Calamity drills for its full time (16 / 18 / 20 s)', { len: CAL.drillLen, dur: CAL.drillDur });
    ok(CAL.strongs === 0, 'Rock You and Drill Cannon are refused during Calamity', CAL.strongs);
    ok(CAL.drills === 8, 'exactly eight climax drills', CAL.drills);
    ok(CAL.noChargeAll, "Calamity's hits are all noCharge (they never charge the gauge)", { noCharge: CAL.noChargeAll, chargeEnd: CAL.chargeEnd });
    ok(CAL.post === 0, 'the crumble deals no damage after the burst', CAL.post);
    ok(CAL.walk && !CAL.blocked && !CAL.veh && CAL.drillState === 'docked' && Math.abs(CAL.cd - 120) < 4 && CAL.cdSet <= 1, 'after the crumble: the pet on valid ground, controls restored, the 120 s cooldown set once', CAL);
  } else ok(false, 'Calamity ran', CAL);
  /* 7b. the overlap policy: monsters packed among the drills take at most one eruption hit and exactly one burst hit each */
  const OV = await R('overlap', LIB + `
    ready(); const P0 = pins(); P0.forEach((q, i) => { const a = i / P0.length * 6.283; q[1] = B().x + Math.cos(a) * 1.2; q[2] = B().y + Math.sin(a) * 1.2; }); hold(P0);
    S.charge = 1; H.press('ult'); let c = null; H.until(() => { hold(P0); c = S.ctx.calamity; return c && c.phase === 'drill'; }, 6); if (c && c.left != null) c.left = 0.05;
    const n0 = H.log.length; let bt = null, ct = null; H.until(() => { hold(P0); const cc = S.ctx.calamity; if (cc && cc.phase === 'climax' && ct == null) ct = g.t; if (cc && cc.burstDone && bt == null) bt = g.t; return S.released; }, 25);
    const L = H.log.slice(n0).filter(h => /^m/.test(h.m)), er = L.filter(h => bt != null && ct != null && h.t >= ct && h.t < bt - 0.05),   /* (the climax's eruptions only: the roam's own hits and emergences come before it) */ bu = L.filter(h => bt != null && h.t >= bt - 0.05 && h.t <= bt + 0.02);
    return { erupt: perM(er), burst: perM(bu), bt };`);
  if (OV && !OV.err) ok(OV.bt != null && Object.values(OV.erupt).every(c => c <= 1) && Object.keys(OV.burst).length >= 1 && Object.values(OV.burst).every(c => c === 1), 'the overlap policy: at most one eruption hit and exactly one burst hit per enemy, however many drills reach it', OV); else ok(false, 'overlap ran', OV);
  /* 8. exits: timeout in each state, defeat underground; nothing left behind */
  const exitIn = st => R('exit@' + st, LIB + `
    ready(); const st = arg; if (st === 'cannon') { zero(); H.press('strong2'); H.until(() => S.ctx.drill.state === 'out', 2); } if (st === 'roll') { H.press('dodge'); H.step(0.2); } if (st === 'jump') { H.press('jump'); H.step(0.3); }
    if (st === 'under') { S.charge = 1; H.press('ult'); H.until(() => S.ctx.calamity && S.ctx.calamity.phase === 'drill', 6); H.press('dodge'); H.until(() => B().under, 2); H.mortal = true; me.inv = 0; me.hp = 0; me.dead = true; }
    else S.left = 0.05;
    H.until(() => S.released, 15); const tr = g.t, n0 = H.log.length; H.step(2.5);
    return { st, released: S.released, dead: me.dead, under: !!(S.ctx.body && S.ctx.body.under), drill: S.ctx.drill && S.ctx.drill.state, late: H.log.length - n0, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), veh: !!(D.VEH && D.VEH.active), cd: +g.cdU.toFixed(1), cdSet: H.st(S, ['cdSet']) };`, st);
  for (const st of ['walk', 'roll', 'jump', 'cannon', 'under']) { const T = await exitIn(st); if (!T || T.err) { ok(false, 'exit in ' + st + ' ran', T); continue; }
    ok(T.released && !T.under && T.drill === 'docked' && T.late === 0 && T.walk && !T.veh && T.cdSet <= 1 && (st === 'under' ? T.dead : Math.abs(T.cd - 120) < 4), `${st === 'under' ? 'defeat underground' : 'timeout (' + st + ')'}: released on valid ground, no underground state, the bit docked, no later damage, the cooldown once`, T); }
  ok(!errors.length, 'no page errors', errors.slice(0, 4));
  await browser.close();
  console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok`); process.exit(bad ? 1 : 0);
})();
