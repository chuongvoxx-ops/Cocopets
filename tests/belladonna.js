// Belladonna (Wind's 11th Ultimate): the spec's verify list and the brief's decisions (docs/WIND-BELLADONNA-BRIEF.md),
// as far as logic can check them, on the real game.   usage: HTML=test-belH.html EVO=4 node tests/belladonna.js
// The hooks it reads (BELLADONNA_MODEL.COUNTS and anchors, g._belladonna and its stats, BELLADONNA_MOVES.stats, the
// plans on ctx) are listed in the brief's Notes (H, 2026-11-12); the accessors take the first name that exists.
// Visual items (the look, the pet never covered, motion) are for the montages; they are listed as 'manual' at the end.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const EVO = +(process.env.EVO || 4);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'warning' && /Belladonna|Twister/.test(m.text())) errors.push('console: ' + m.text()); });
  let bad = 0, n = 0; const ok = (c, m, x) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);


  // ---- the roster and the model's fixed counts ----
  const ros = await page.evaluate(() => { const P = window.__pp, U = P.ELEM_MOVES.wind.ult, M = typeof BELLADONNA_MODEL !== 'undefined' ? BELLADONNA_MODEL : (P.belladonna || self.BELLADONNA_MODEL || null);
    return { n: U.length, i: U.findIndex(r => r[0] === 'belladonna'), cd: (U.find(r => r[0] === 'belladonna') || [])[4], impl: typeof P.ELEM_IMPL.wind.ult.belladonna, counts: M && M.COUNTS ? Object.assign({}, M.COUNTS) : null, model: !!M, BM: typeof self.BELLADONNA_MOVES === 'object' ? Object.keys(self.BELLADONNA_MOVES) : null, cousins: [typeof P.ELEM_IMPL.wind.ult.flowerhurricane, typeof P.ELEM_IMPL.wind.ult.terribletornado] }; });
  ok(ros.i === 10 && ros.n === 11, 'Belladonna is the 11th Wind Ultimate', { i: ros.i, n: ros.n });
  ok(ros.cd === 120, 'its outer cooldown in the roster is 120 s', ros.cd);
  ok(ros.cousins.every(t => t === 'function'), 'Flower Hurricane and Terrible Tornado are still implemented');
  if (ros.counts) { const C = ros.counts, g1 = (o, names) => { for (const k of names) if (o[k] != null) return o[k]; return null; };
    ok(g1(C, ['leaves', 'leaf']) === 4, 'the model has exactly 4 outer leaves', C);
    ok(g1(C, ['swords', 'sword']) === 8, 'exactly 8 swords on the ring', C);
    ok(g1(C, ['tentG', 'greenTentacles', 'green']) === 6, 'exactly 6 green tentacles', C);
    ok(g1(C, ['tentW', 'whiteTentacles', 'white8', 'whiteT']) === 8, 'exactly 8 white tentacles', C);
  } else console.log('skip  BELLADONNA_MODEL.COUNTS not exposed yet' + (ros.model ? '' : ' (no model)'));
  /* the numeric guard, as Jaws's (a phase channel read as a distance makes parts drift out over a session): every item
     centre within 9.0 tiles of the origin (worst 7.8 now, at a white tendril's tip; +15 %), with sway, ringSpin and spin to 6000 */
  const EXT = await page.evaluate(() => { const M = window.__pp.belladonna; if (!M || !M.rigOf || !M.PARTS || !M.anchorAt) return null; const P0 = M.blankPose(), A0 = M.rigOf(P0).A, an = M.anchorAt('top', 0, 0, 0, P0), k = Math.abs(A0.top[2]) > 1e-3 ? an.z / A0.top[2] : an.x / A0.top[0]; let worst = 0, at = '';
    for (const big of [0, 60, 600, 6000]) for (const ph of [0, 1.3, 2.9, 4.4].map(v => v + big)) for (const bank of [-0.5, 0, 0.5]) for (const lean of [-0.4, 0, 0.4]) for (const bloom of [0.5, 1, 1.3]) {
      const P = Object.assign(M.blankPose(), { sway: ph, ringSpin: ph * 1.7, spin: ph * 0.6, bank, lean, bloom, flutter: 2, accX: 1.5, accY: 1.5 }), R = M.rigOf(P);
      for (const it of R.list) { const Pt = M.PARTS[it.part]; if (!Pt || !Pt.c) continue; const c = [0, 1, 2].map(i => it.o[i] + it.R.x[i] * Pt.c[0] * it.s + it.R.y[i] * Pt.c[1] * it.s + it.R.z[i] * Pt.c[2] * it.s), d = Math.hypot(c[0], c[1], c[2]) * k; if (d > worst) { worst = d; at = { part: it.part, phase: ph, bank, lean, bloom }; } } }
    return { worst: +worst.toFixed(2), at, k }; });
  if (EXT) ok(EXT.worst <= 9.0, 'no part drifts: every part centre within 9.0 tiles at any sway / ring-spin phase, bank, lean and bloom', EXT); else console.log('skip  BELLADONNA_MODEL.rigOf not exposed');
  console.log('E\'s moves:', ros.BM ? ros.BM.join(',') : 'absent');
  if (ros.impl !== 'function') { console.log('core absent: stopping' ); await browser.close(); console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok (core absent)`); process.exit(1); }
  ok(true, 'U.belladonna is implemented');
  /* (a pet whose twist adds no hits of its own, as in the damage audit: the hit counts below are the moves' alone) */
  await page.evaluate(() => { const P = window.__pp, NEU = ['chill', 'leech', 'pierce', 'knock', 'shock']; let k = 0; do { P.quickStart('Bel'); } while (!NEU.includes(P.dun.petKit(P.st).AB.twist) && ++k < 200); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });
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
      const mv = P.ELEM_LIST.wind.ey_belladonna; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo }));
      const H = { P, G, D, me, g, kit0, log: [], hold: null };
      H.step = (s, each) => { const t1 = g.t + s; let k = 0; while (g.t < t1 - 1e-6 && k++ < 6000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); if (each && each() === true) break; } };
      H.until = (fn, cap) => { const t1 = g.t + (cap || 10); let k = 0; while (!fn() && g.t < t1 && k++ < 9000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); } return fn(); };
      H.S = () => g._belladonna;
      /* tolerant accessors (see the Notes): the first name that exists */
      const pick = (o, names, d) => { for (const n of names) if (o && o[n] != null) return o[n]; return d; };
      H.pick = pick; const FINS = ['finisher', 'twister', 'ult', 'finish'], RIDE = ['fly', 'ride', 'play', 'air'];
      const FIN = S => !!S && (FINS.includes(S.phase) || !!(S.ctx && (S.ctx.finisher || S.ctx.twister)));
      H.fin = FIN; H.ready = S => RIDE.includes(S.phase) && !S.swoosh && !S.dive && !(S.V && S.V.locked);
      H.form = S => { const f = pick(S, ['form'], pick(S.V, ['form'], null)); return f === 1 || f === 'wolf' ? 'wolf' : 'bike'; };
      H.left = S => pick(S, ['left'], S.endT != null ? S.endT - g.t : null);
      H.st = (S, names) => pick(S.stats, names, pick(self.BELLADONNA_MOVES && self.BELLADONNA_MOVES.stats, names, 0));
      H.swooshing = S => S.phase === 'swoosh' || !!S.swoosh || !!S.dive; H.drifting = H.swooshing;
      H.wrap = () => { const S = H.S(), X = S.X; if (X.__w) return; X.__w = 1; const h0 = X.hitMon; X.hitMon = (m, d, o) => { const r = h0(m, d, o); if (m && !m._tag) m._tag = 'n' + (H.nTag = (H.nTag || 0) + 1); const s2 = H.S(); H.log.push({ m: m && m._tag, d: r, raw: d, nc: !!(s2 && FIN(s2)), ph: s2 ? s2.phase : 'none', form: s2 ? H.form(s2) : '', dr: !!(s2 && H.drifting(s2)), boss: !!(m && m.boss), frz: m ? m.freeze : 0, t: g.t }); return r; }; };   /* (every hit of the session, A's own Glides and Dive included; Dark Messiah's are the noCharge ones) */
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

  const DUR = 45;   /* (v321: 45 s at every evo) */
  const LIB = `
    const { D, g, me } = H; const S = H.cast(); if (!S) return { err: 'no session' };
    const ready = () => H.until(() => H.ready(S) && !S.busy, 8);
    const cd = names => H.pick(S.cd, names, 0), cdS1 = () => cd(['s1', 'wild', 'wildflowers', 'strong']), cdS2 = () => cd(['s2', 'ring', 'ringblade', 'strong2']), cdD = () => cd(['dodge', 'swoosh']);
    const only = () => { for (const m of D.mons) if (!m.dead && !m.boss && (!m._tag || m._tag[0] === 'n')) { m.dead = true; m.x += 90; } };
    const pins = () => D.mons.filter(m => m._tag && m._tag[0] === 'm' && !m.dead).map(m => [m, m.x, m.y]);
    const hold = P0 => { only(); for (const q of P0) { q[0].x = q[1]; q[0].y = q[2]; } };
    const model = () => H.P.belladonna || (typeof BELLADONNA_MODEL !== 'undefined' ? BELLADONNA_MODEL : self.BELLADONNA_MODEL);
    const BMr = () => { try { const B = self.BELLADONNA_MOVES; return B && B.ringState ? B.ringState(S.ctx) : null; } catch (e) { return null; } }; const ringState = () => { const e = BMr(); return e && e !== 'overhead' ? e : typeof S.ring === 'string' ? S.ring : H.pick(S, ['ringState'], H.pick(self.BELLADONNA_MOVES && self.BELLADONNA_MOVES.stats, ['ringState'], null)); };
  `;

  // ---- 1. the form: commands, the model live (8 swords pointing outward, 8 white tentacles forward), Swoosh, Wildflowers, Ring Blade ----
  const A = await R('moves', LIB + `
    ready(); const P0 = pins(); const out = { left0: +H.left(S).toFixed(2), lab: H.labels(), z: +(S.V.z || 0).toFixed(2), cdHeld: g.cdU };
    // the drawn model: sword tips farther from the ring centre than their hilts; white tentacle tips nearer the camera than their roots
    try { const M = model(), a = n => { try { return (M.anchorAt ? M.anchorAt(n, 0, 0, 0, S.V.pose || M.blankPose()) : null) || M.anchor(n); } catch (e) { return null; } }, rc = a('ring'); H.step(0.2);
      if (M && rc) { let outw = 0, ns = 0; for (let i = 0; i < 8; i++) { const t = a('sword' + i), h = a('hilt' + i); if (!t) continue; ns++; const dt = Math.hypot(t.x - rc.x, t.y - rc.y, (t.z - rc.z)), dh = h ? Math.hypot(h.x - rc.x, h.y - rc.y, (h.z - rc.z)) : 0; if (dt > dh + 0.05) outw++; } out.swords = { n: ns, outward: outw };
        let fw = 0, nw = 0; for (let i = 0; i < 8; i++) { const t = a('tw' + i) || a('tentW' + i), r = a('twRoot' + i) || a('tentWroot' + i); if (!t || !r) continue; nw++; let gx = 0, gy = 0, gn = 0; for (let j = 0; j < 6; j++) { const q = a('tg' + j), q0 = a('tgRoot' + j); if (q && q0) { gx += q.x - q0.x; gy += q.y - q0.y; gn++; } } /* forward = away from where the green rear tentacles trail */ const F = a('forward'); if (F) { gx = -F.x; gy = -F.y; gn = 1; } if (gn && (t.x - r.x) * -gx + (t.y - r.y) * -gy > 0 && Math.hypot(t.x - r.x, t.y - r.y, t.z - r.z) > 1) fw++; } out.white = { n: nw, forward: fw }; } } catch (e) { out.modelErr = String(e); }
    // Swoosh: one hit per enemy per activation
    const c00 = S.charge; const sw0 = H.st(S, ['swooshes']), n0 = H.log.length; H.face(0); H.press('dodge'); H.release(); H.until(() => H.swooshing(S), 1); H.until(() => { const pl = S.ctx.swooshPlan; if (pl && out.chAt0 == null && g.t >= pl.t0) { S.charge = 0; out.chAt0 = 0; }   /* (emptied as the slams begin: at Celestial the swoop alone may already have filled it) */ return !H.swooshing(S) && H.ready(S); }, 8); H.step(0.3);
    { const pl = S.ctx.swooshPlan || null, L = H.log.slice(n0).filter(h => /^m/.test(h.m)), t0 = pl ? pl.t0 : 1e9, AT = pl ? pl.at : [];
      /* the slams: each hit assigned to the slam whose deadline it is nearest; a slam hits an enemy at most once */
      const per = {}; let dup = 0; for (const h of L) if (h.t >= t0 - 1e-6) { let b = 0; for (let j = 1; j < AT.length; j++) if (Math.abs(h.t - AT[j].t) < Math.abs(h.t - AT[b].t)) b = j; const k = h.m + ':' + b; if (per[k]) dup++; per[k] = (per[k] || 0) + 1; }
      const fin = AT.find(e => e.kind === 'final'), finHits = fin ? L.filter(h => Math.abs(h.t - fin.t) < 0.03).map(h => h.m) : [], inFin = fin ? D.mons.filter(m => m._tag && m._tag[0] === 'm' && !m.dead && Math.hypot(m.x - fin.x, m.y - fin.y) < fin.r - 0.3).map(m => m._tag) : [];
      const tipD = L.filter(h => h.t >= t0 && (!fin || Math.abs(h.t - fin.t) >= 0.03)).map(h => +(h.raw / S.DK).toFixed(2)), finD = L.filter(h => fin && Math.abs(h.t - fin.t) < 0.03).map(h => +(h.raw / S.DK).toFixed(2));
      out.swoosh = { started: H.st(S, ['swooshes']) - sw0, hits: L.filter(h => h.t < t0).map(h => h.m), z: +(S.V.z || 0).toFixed(2), plan: pl ? { tips: AT.filter(e => e.kind === 'tip').length, finals: AT.filter(e => e.kind === 'final').length, fired: pl.fired, done: AT.every(e => e.done) } : null,
        slamDup: dup, finHits, inFin, tipDK: [...new Set(tipD)], finDK: [...new Set(finD)], slamCharge: +((S.charge - (out.chAt0 != null ? out.chAt0 : S.charge))).toFixed(4), slamStat: H.st(S, ['slamHits']) }; } ready();
    // Wildflowers: one field; ticks on a fixed cadence; a recast refreshes (never two fields, never double ticks)
    for (const q of P0) { q[1] = S.V.x + 2 + 0.5 * P0.indexOf(q); q[2] = S.V.y + (P0.indexOf(q) % 2 ? 0.6 : -0.6); } hold(P0); H.face(0); H.release();
    const n1 = H.log.length, c0 = S.charge; H.press('strong'); let maxF = 0; const tW = g.t; H.until(() => { hold(P0); maxF = Math.max(maxF, H.st(S, ['fields'])); return g.t - tW > 1.2; }, 3);
    const plan1 = S.ctx.wildPlan ? Object.assign({}, S.ctx.wildPlan) : null; if (S.cd) for (const k of ['s1', 'wild', 'wildflowers', 'strong']) if (k in S.cd) S.cd[k] = 0; H.step(0.35, () => hold(P0)); H.press('strong');   // the recast, mid-field
    H.until(() => { hold(P0); maxF = Math.max(maxF, H.st(S, ['fields'])); return g.t - tW > 7; }, 9);
    const WL = H.log.slice(n1), per = {}; for (const h of WL) (per[h.m] = per[h.m] || []).push(+h.t.toFixed(3)); const one = Object.values(per).sort((a, b) => b.length - a.length)[0] || [], gaps = one.slice(1).map((t, i) => +(t - one[i]).toFixed(3));
    out.wild = { casts: H.st(S, ['wild', 'wildflowers']), maxFields: maxF, ticksOnOne: one.length, odd: (() => { const ev = (plan1 && (plan1.every || plan1.tick)) || 0.5; return gaps.filter(d => Math.abs(d - ev) > 0.06).length; })(), gapMin: gaps.length ? Math.min(...gaps) : null, gapMax: gaps.length ? Math.max(...gaps) : null, plan: plan1, chargeUp: S.charge > c00, charge: [c00, +c0.toFixed(3), +S.charge.toFixed(3)], span: one.length ? +(one[one.length - 1] - one[0]).toFixed(2) : 0 }; ready();
    // Ring Blade: sweep + flourish once per enemy; no recast while away; the return harmless
    const n2 = H.log.length, r0 = H.st(S, ['ring', 'ringThrows']); hold(P0); H.press('strong2'); let st1 = ringState(); let agree = true; H.until(() => { hold(P0); st1 = ringState(); return st1 !== 'overhead'; }, 1.5); if (BMr() && typeof S.ring === 'string' && BMr() !== S.ring) agree = false; if (S.cd) for (const k of ['s2', 'ring', 'ringblade', 'strong2']) if (k in S.cd) S.cd[k] = 0; H.press('strong2'); H.step(0.1, () => hold(P0));
    const throwsMid = H.st(S, ['ring', 'ringThrows']) - r0; let sawRet = false, hitsInReturn = 0, lastLen = H.log.length; H.until(() => { hold(P0); const rs = ringState(); if (rs === 'returning') { sawRet = true; hitsInReturn += H.log.length - lastLen; } lastLen = H.log.length; return rs === 'overhead' && !S.busy; }, 9); H.step(0.3);
    const RL = H.log.slice(n2).map(h => h.m), rper = RL.reduce((o, m) => (o[m] = (o[m] || 0) + 1, o), {});
    out.cds = { s1: S.cdMax && S.cdMax.s1, s2: S.cdMax && S.cdMax.s2 }; out.ring = { agree, core: S.ring, stateOut: st1, throwsMid, per: rper, sawReturn: sawRet, hitsInReturn, back: ringState() };
    return out;`);
  if (A && !A.err) { const has = (L, re) => L.some(s => re.test(s)), once = L => L.length === new Set(L).size;
    ok(Math.abs(A.left0 - DUR) < 1.2, `the flight lasts ${DUR} s at this tier`, A.left0);
    ok(has(A.lab, /SWOOSH/) && has(A.lab, /WILDFLOWER/) && has(A.lab, /RING/) && has(A.lab, /TWISTER/), 'the commands: Swoosh, Wildflowers, Ring Blade, Twister', A.lab);
    ok(A.z > 0.5, 'it flies (a cruise height above the floor)', A.z);
    if (A.swords && A.swords.n) ok(A.swords.n === 8 && A.swords.outward === 8, 'the 8 swords point radially outward on the drawn model', A.swords); else console.log('skip  sword anchors not exposed yet', A.modelErr || '');
    if (A.white && A.white.n) ok(A.white.n === 8 && A.white.forward === 8, 'the 8 white tentacles reach forward', A.white); else console.log('skip  white tentacle anchors not exposed yet');
    ok(A.swoosh.started === 1 && A.swoosh.hits.length > 0 && once(A.swoosh.hits), 'Swoosh: its swoop hits each enemy once', A.swoosh.hits);
    ok(A.swoosh.plan && A.swoosh.plan.tips === 6 && A.swoosh.plan.finals === 1 && A.swoosh.plan.done, 'the slam phase: six tentacle slams and a final slam, all on their deadlines', A.swoosh.plan);
    ok(A.swoosh.slamDup === 0 && A.swoosh.finHits.length >= A.swoosh.inFin.length && A.swoosh.inFin.every(m => A.swoosh.finHits.includes(m)), 'each slam hits an enemy at most once; the final slam hits every enemy within its radius', { dup: A.swoosh.slamDup, final: A.swoosh.finHits, within: A.swoosh.inFin });
    ok(A.swoosh.tipDK.every(v => Math.abs(v - 0.8) < 0.05) && A.swoosh.finDK.every(v => Math.abs(v - 2.0) < 0.05) && A.swoosh.finDK.length === 1, 'slam damage: 0.8 DK a tentacle slam, 2.0 DK the final slam', { tips: A.swoosh.tipDK, final: A.swoosh.finDK });
    ok(A.swoosh.slamCharge > 0, 'the slams charge the gauge', A.swoosh.slamCharge);
    ok(A.wild.maxFields <= 1 && A.wild.casts >= 2, 'Wildflowers: a recast refreshes the one field (never two)', A.wild);
    ok(A.wild.ticksOnOne > 3 && A.wild.gapMin != null && A.wild.gapMin > 0.2 && A.wild.odd === 0, 'Wildflowers ticks on one fixed cadence through a recast (the clock is never reset; never a double tick)', A.wild);
    ok(A.wild.chargeUp, 'real damage charges the gauge', A.wild.charge);
    ok(A.ring.stateOut === 'outbound' || A.ring.stateOut === 'returning', 'Ring Blade throws the ring (outbound)', A.ring.stateOut);
    ok(A.ring.agree, 'the core and the moves agree on the ring state while it is away', { core: A.ring.core, moves: A.ring.stateOut });
    ok(A.cds && Math.abs(A.cds.s1 - 1.0) < 0.05 && Math.abs(A.cds.s2 - 1.5) < 0.05, 'cooldowns: Wildflowers 1.0 s, Ring Blade 1.5 s (from the catch)', A.cds);
    ok(A.ring.throwsMid === 1, 'no recast while the ring is away', A.ring.throwsMid);
    ok(Object.keys(A.ring.per).length > 0 && Object.values(A.ring.per).every(c => c <= 2), 'Ring Blade: at most the sweep and the flourish per enemy', A.ring.per);
    ok(A.ring.sawReturn && A.ring.hitsInReturn === 0 && A.ring.back === 'overhead', 'the return is harmless and the ring comes back overhead', A.ring);
  } else ok(false, 'moves sequence ran', A);

  // ---- 1b. Wildflowers: recasting whenever it is ready never lowers the damage (v321: a recast extends the field on the same clock) ----
  const WR = await R('wild-recast', LIB + `
    ready(); const P0 = pins().slice(0, 1); for (const m of D.mons) if (!m.boss && !P0.some(q => q[0] === m)) { m.dead = true; m.x += 90; } P0[0][1] = S.V.x + 3; P0[0][2] = S.V.y; hold(P0);
    const run = spam => { H.until(() => { hold(P0); return H.ready(S) && !(S.ctx.wildPlan && S.ctx.wildPlan.fired < S.ctx.wildPlan.ticks && g.t < 99999 && S.wild); }, 8); H.step(0.5, () => hold(P0)); if (S.cd) S.cd.s1 = 0;
      const n0 = H.log.length, t0 = g.t; H.face(0); H.release(); H.press('strong'); const pt0 = S.ctx.wildPlan ? S.ctx.wildPlan.t0 : null; let casts = 1, t0s = new Set([pt0]);
      H.until(() => { hold(P0); if (spam && (S.cd ? S.cd.s1 <= 0 : true) && !S.busy && H.ready(S) && g.t - t0 < 5) { H.press('strong'); casts++; const p = S.ctx.wildPlan; if (p) t0s.add(p.t0); } return g.t - t0 >= 6; }, 7);
      const L = H.log.slice(n0).filter(h => h.m === 'm0'); return { casts, dk: +(L.reduce((a, h) => a + h.raw, 0) / S.DK).toFixed(2), hits: L.length, t0s: t0s.size }; };
    return { once: run(false), spam: run(true) };`);
  if (WR && !WR.err) ok(WR.spam.casts > 2 && WR.spam.dk >= WR.once.dk - 0.01 && WR.spam.t0s === 1, 'Wildflowers recast whenever ready never deals less than a single cast (one tick clock across the recasts)', WR); else ok(false, 'Wildflowers recast ran', WR);

  // ---- 2. flight over gaps and offshore; the tracked safe return; expiry offshore ----
  const O = await R('offshore', LIB + `
    ready(); const TU = S.ctx.TUNE || {}, wallZ = TU.wallZ || 3.2, cruise = TU.cruise || 2.4, margin = TU.margin || 16, t0 = g.t; const lows = []; let minX = 1e9, offMax = 0, wallT = 0, lowInWall = 0, zMax = 0, stalls = 0, lastX = S.V.x, lastT = g.t; const K = H.P.arc.keys; K.left = true;
    if (S.endT != null) S.endT = g.t + 60; S.left = 60; const offT0 = H.st(S, ['offT']);
    /* straight at whatever lies to the left: walls, props, gaps, then the map's edge and the open air out to the margin */
    H.until(() => { const x = S.V.x, y = S.V.y; minX = Math.min(minX, x); const off = !D.walkAt(Math.floor(x), Math.floor(y)); if (off) offMax += 1 / 60; zMax = Math.max(zMax, S.V.z);
      if (x > 0.5 && D.blocked(x, y, 0.1, 1)) {   /* (mode 1: what stops a flyer, i.e. solid walls, not gaps) */ wallT += 1 / 60; if (S.V.z < wallZ - 0.36) { lowInWall++; if (lows.length < 6) lows.push([+x.toFixed(2), +y.toFixed(2), +S.V.z.toFixed(2), S.ctx.groundAt ? !!S.ctx.groundAt(x, y) : null]); } }
      if (g.t - lastT >= 0.6) { if (x > -margin + 1 && lastX - x < 0.5) stalls++; lastX = x; lastT = g.t; }
      return x <= -margin + 0.3 || g.t - t0 > 22; }, 24); H.step(0.6);
    const far = { x: +S.V.x.toFixed(1), z: +S.V.z.toFixed(2), margin, cruise, wallZ, wallT: +wallT.toFixed(2), lowInWall, lows, zMax: +zMax.toFixed(2), stalls, offStat: +(H.st(S, ['offT']) - offT0).toFixed(1) };
    const at = { x: +S.V.x.toFixed(1), y: +S.V.y.toFixed(1), offMap: S.V.x < 0, offT: +offMax.toFixed(1), safe: S.safe ? [+S.safe.x.toFixed(1), +S.safe.y.toFixed(1), !!D.walkAt(Math.floor(S.safe.x), Math.floor(S.safe.y))] : null };
    // let the timer run out there
    if (S.endT != null) S.endT = g.t + 0.3; else S.left = 0.3; H.until(() => S.phase === 'gone', 14); K.left = false; H.step(1);
    return { far, offshoreExit: H.st(S, ['offshoreExit']), at, end: S.phase, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), pos: [+me.x.toFixed(1), +me.y.toFixed(1)], twister: H.st(S, ['twister']), veh: !!(D.VEH && D.VEH.active), cdSet: H.st(S, ['cdSet']), cd: g.cdU };`);
  if (O && !O.err) {
    ok(O.at.offT > 0.5, 'it flies over ground it could not walk on (gaps, walls, open air)', O.at);
    ok(O.far.stalls === 0 && O.far.lowInWall === 0, 'free flight: nothing on the floor stops it, and it is never inside a wall or prop below the crossing height', O.far);
    if (O.far.wallT > 0.1) ok(O.far.zMax >= O.far.wallZ - 0.3, 'it climbs to the crossing height over walls and props', O.far); else console.log('skip  no wall on this line');
    ok(O.far.x <= -O.far.margin + 0.6 && Math.abs(O.far.z - O.far.cruise) < 0.4 && O.far.offStat > 0.5, 'off the map edge it keeps flying at the cruise height out to the margin', O.far);
    ok(O.offshoreExit === 1, 'the offshore expiry is counted once', O.offshoreExit);
    if (O.at.safe) ok(O.at.safe[2], 'the tracked safe-return point is on valid ground while offshore', O.at.safe);
    ok(O.end === 'gone' && O.walk && !O.blocked && !O.veh, 'expiry offshore: the pet is set down on valid ground', O);
    ok(!O.twister, 'expiry grants no Twister');
  } else ok(false, 'offshore ran', O);

  const SWW = await R('swoosh-wall', LIB + `
    ready(); const wallZ = (S.ctx.TUNE && S.ctx.TUNE.wallZ) || 3.2; const m0 = D.mons.find(m => m._tag === 'm0'); for (const m of D.mons) if (!m.boss && m !== m0) { m.dead = true; m.x += 90; }
    const isWall = (x, y) => D.blocked(x, y, 0.1, 1) && !D.propList.some(p => !p.broken && Math.hypot(p.x - x, p.y - y) < 1.2), W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.4, 0);
    /* a standing spot hard against a wall, with open floor 4 tiles back from it */
    let pick = null; for (let r = 1; r < 14 && !pick; r += 0.5) for (let k = 0; k < 16 && !pick; k++) { const a = k * Math.PI / 8, x = S.V.x + Math.cos(a) * r, y = S.V.y + Math.sin(a) * r; if (!W(x, y)) continue; for (let j = 0; j < 4; j++) { const b = j * Math.PI / 2; if (isWall(x + Math.cos(b) * 0.8, y + Math.sin(b) * 0.8) && W(x - Math.cos(b) * 4, y - Math.sin(b) * 4)) { pick = { x, y, b }; break; } } }
    if (!pick) return { none: true };
    const out = { tries: 0, started: 0, bad: 0, low: 0, hits: 0 };
    for (let i = 0; i < 3; i++) { m0.dead = false; m0.hp = 1e9; const px = pick.x, py = pick.y; S.V.x = me.x = px - Math.cos(pick.b) * 4; S.V.y = me.y = py - Math.sin(pick.b) * 4; S.V.vx = S.V.vy = 0; H.release(); H.until(() => { m0.x = px; m0.y = py; return H.ready(S) && !S.busy && !(cdD() > 0); }, 6); H.step(0.5, () => { m0.x = px; m0.y = py; });
      const s0 = H.st(S, ['swooshes']), b0 = H.st(S, ['swooshBad']), n0 = H.log.length; S.ctx.swooshPlan = null; H.face(pick.b); H.press('dodge'); H.release(); out.tries++;
      H.until(() => { m0.x = px; m0.y = py; if (isWall(S.V.x, S.V.y) && S.V.z < wallZ - 0.36) out.low++; return g.t > 0 && !H.swooshing(S) && H.ready(S) && H.st(S, ['swooshes']) > s0; }, 6);
      out.started += H.st(S, ['swooshes']) - s0; out.bad += H.st(S, ['swooshBad']) - b0; const pl = S.ctx.swooshPlan, t0 = pl ? pl.t0 : 1e9; out.hits += H.log.slice(n0).filter(h => h.m === 'm0' && h.t < t0).length; }
    out.spot = H.st(S, ['swooshSpot']); return out;`);
  if (SWW && !SWW.err) { if (SWW.none) console.log('skip  no spot against a wall found'); else {
    ok(SWW.started === SWW.tries && SWW.bad === 0, 'Swoosh at an enemy tucked against a wall is never refused', SWW);
    ok(SWW.low === 0 && SWW.hits === SWW.tries, 'its pass never goes through the wall below the crossing height, and its swoop still hits once a press', SWW); } } else ok(false, 'swoosh by a wall ran', SWW);

  // ---- 3. Twister: full gauge only, once, six tornadoes, the ring recalled first, a shared registry, frame-rate independent ticks ----
  const twAt = fps => R('twister@' + fps, LIB + `
    ready(); const fps = arg; /* (the storm's phase comes from where it starts: the same x + y every run, so the three frame rates see one geometry) */ { const y = Math.round(S.V.y * 8) / 8, x = (window.__belSum = window.__belSum || Math.round(S.V.x + S.V.y)) - y; S.V.x = me.x = x; S.V.y = me.y = y; S.V.vx = S.V.vy = 0; H.release(); } const xy0 = [S.V.x, S.V.y]; const P0 = pins(); for (const q of P0) { const i = P0.indexOf(q), a = i / P0.length * 6.283; const tu = (self.BELLADONNA_MOVES && self.BELLADONNA_MOVES.TUNE && self.BELLADONNA_MOVES.TUNE.twister) || {}, oR = tu.orbitR || 4.3; /* (three on the funnels' orbit, three under the storm round the flower: both from E's own numbers) */ const rr = i % 2 ? oR : Math.min(2.2, (tu.core || 3) * 0.6); q[1] = S.V.x + Math.cos(a) * rr; q[2] = S.V.y + Math.sin(a) * rr * 0.55; } hold(P0);
    S.charge = 0.5; H.step(0.3, () => hold(P0)); D.useUlt(); H.step(0.15, () => hold(P0)); const notFull = H.fin(S);
    // throw the ring, then press Twister while it is away: it must be recalled before the storm
    H.press('strong2'); H.until(() => { hold(P0); return ringState() !== 'overhead'; }, 1.5); S.charge = 1; H.step(0.3, () => hold(P0)); const awayAtPress = ringState(); const n0 = H.log.length, tw0 = H.st(S, ['twisterTicks']); S.V.x = me.x = xy0[0]; S.V.y = me.y = xy0[1]; D.useUlt(); H.step(0.05); const started = H.fin(S) || S.used;
    const G = H.G; let relT = null, k = 0, maxTw = 0, ringAtStorm = null; while (!(S.phase === 'gone' && relT != null && g.t - relT > 1) && k++ < 12000) { me.inv = 1; me.hp = Math.max(me.hp, 1); hold(P0); G.update(1 / fps); { const q = S.ctx.twisterPlan; maxTw = Math.max(maxTw, q && q.n != null ? q.n : H.st(S, ['twisters', 'tornadoes'])); } const pl = S.ctx.twisterPlan; if (pl && pl.t0 != null && ringAtStorm == null) ringAtStorm = ringState(); if (relT == null && S.released) relT = g.t; }
    D.useUlt(); const again = H.st(S, ['twister']);
    const pl = S.ctx.twisterPlan || null, L = H.log.slice(n0).filter(h => h.nc && pl && pl.t0 != null && h.t >= pl.t0 - 1e-6 && /^m/.test(h.m)) /* (the storm's own hits: a recalled ring may still land its sweep before the storm begins) */, per = {}; for (const h of L) (per[h.m] = per[h.m] || []).push(+h.t.toFixed(3));
    // per enemy: never two hits in one tick slot (the shared registry), whatever the overlap of the six funnels
    let dup = 0, dupM = null; const TT = pl ? (Array.isArray(pl.at) ? pl.at : Array.isArray(pl.ticks) ? pl.ticks : null) : null, nT = pl ? (Array.isArray(pl.ticks) ? pl.ticks.length : pl.ticks) : 0, tick = TT && TT.length > 1 ? TT[1] - TT[0] : (pl && pl.tick) || 0.25; for (const m in per) { const ts = per[m], seen = {}; for (let i = 0; i < ts.length; i++) { let b; if (TT) { b = 0; for (let j = 1; j < TT.length; j++) if (Math.abs(ts[i] - TT[j]) < Math.abs(ts[i] - TT[b])) b = j; } else b = Math.round(ts[i] / tick); if (seen[b]) { dup++; dupM = m; } seen[b] = 1; } }
    const counts = Object.values(per).map(a => a.length);
    const dupLog = dup ? Object.entries(per).filter(e => e[0] === dupM).map(e => ({ m: e[0], t: e[1].map(t => +(t - pl.t0).toFixed(2)), d: L.filter(h => h.m === e[0]).map(h => Math.round(h.d)), ph: L.filter(h => h.m === e[0]).map(h => h.ph), tk: (TT || []).map(t => +(t - pl.t0).toFixed(2)) }))[0] : null;
    const lastHit = L.length ? Math.max(...L.map(h => h.t)) : null, pulseAt20 = !!(TT && lastHit != null && Math.abs(lastHit - TT[TT.length - 1]) < 0.06 + 1 / fps);
    return { nAt: TT ? TT.length : null, pulseAt20, dupLog, notFull, started, awayAtPress, ringAtStorm, maxTw, plan: pl && { ticks: nT, tick, n: pl.n }, hitsAll: L.length, fired: pl && pl.fired != null ? pl.fired : H.st(S, ['twisterTicks']) - tw0, perMax: counts.length ? Math.max(...counts) : 0, perMin: counts.length ? Math.min(...counts) : 0, nMons: counts.length, dup, late: H.log.slice(n0).filter(h => relT != null && h.t > relT).length, used: S.used, again, cd: g.cdU, cdSet: H.st(S, ['cdSet']), walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), veh: !!(D.VEH && D.VEH.active), petAlt: !!me.petAlt };`, fps);
  const T60 = await twAt(60), T20 = await twAt(20), T144 = await twAt(144);
  if (T60 && !T60.err) { const TR = [T60, T20, T144].filter(t => t && !t.err);
    ok(!T60.notFull, 'Twister does not start below a full gauge');
    ok(T60.started && T60.perMax > 0, 'Twister starts at full gauge and deals damage', { per: [T60.perMin, T60.perMax], mons: T60.nMons });
    ok(T60.maxTw === 6, 'exactly six tornadoes', T60.maxTw);
    ok(T60.awayAtPress !== 'overhead' ? T60.ringAtStorm === 'overhead' : true, 'a thrown ring is recalled before the storm', { atPress: T60.awayAtPress, atStorm: T60.ringAtStorm });
    ok([T60, T20, T144].every(t => t && t.dup === 0), 'overlapping funnels never hit an enemy twice in one tick (the shared registry)', [T60, T20, T144].map(t => t && (t.dupLog || t.dup)));
    ok(TR.length === 3 && TR.every(t => t.plan && t.fired === t.plan.ticks) && new Set(TR.map(t => t.fired)).size === 1, 'the tick count is the same at 20, 60 and 144 fps', TR.map(t => t.fired));
    ok(TR.every(t => t.perMax <= (t.plan ? t.plan.ticks : 99) && Math.abs(t.hitsAll - TR[0].hitsAll) <= 3), 'six held enemies take the same hits at every frame rate (never more than one a tick)', TR.map(t => [t.perMin, t.perMax, t.hitsAll]));
    ok(TR.every(t => t.plan && t.plan.ticks === 20 && t.nAt === 20 && t.fired === 20 && t.pulseAt20 && t.perMax <= 20), 'the settled plan: 20 scheduled ticks, the final pulse is the 20th (no extra hit)', TR.map(t => [t.plan && t.plan.ticks, t.nAt, t.fired, t.pulseAt20, t.perMax]));
    ok(T60.late === 0, 'the dissolve deals no damage', T60.late);
    ok(T60.used && T60.again === 1, 'one Twister per summon', { used: T60.used, twisters: T60.again });
    ok(Math.abs(T60.cd - 120) < 4 && T60.cdSet <= 1 && T60.walk && !T60.veh && !T60.petAlt, 'after it: the 120 s cooldown set once, the pet on valid ground, controls restored', T60);
  } else ok(false, 'Twister ran', T60);

  // ---- 4. timeout, defeat ----
  const T1 = await R('timeout', LIB + `
    ready(); const t0 = g.t, left0 = H.left(S); let tOut = null; H.until(() => { if (tOut == null && (S.phase === 'out' || S.released)) tOut = g.t; return S.phase === 'gone'; }, 50); H.step(1.5);
    let fxGone = null; H.until(() => { if (!D.ELEM.fx.some(f => /belladonna/i.test(f.key || ''))) { fxGone = 1; return true; } return false; }, 10);
    return { left0: +left0.toFixed(2), ran: tOut ? +(tOut - t0).toFixed(2) : null, fin: H.log.filter(h => h.nc).length, tw: H.st(S, ['twister']), cdSet: H.st(S, ['cdSet']), cd: g.cdU, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), veh: !!(D.VEH && D.VEH.active), petAlt: !!me.petAlt, fxGone };`);
  if (T1 && !T1.err) {
    ok(T1.ran != null && Math.abs(T1.ran - T1.left0) < 0.15, 'the flight ends exactly at its timer', T1);
    ok(T1.fin === 0 && !T1.tw, 'timeout grants no free finisher');
    ok(T1.walk && !T1.blocked && !T1.veh && !T1.petAlt && T1.fxGone, 'timeout: safe return, controls restored, effects cleaned up', T1);
    ok(Math.abs(T1.cd - 120) < 4 && T1.cdSet <= 1, 'the 120 s cooldown starts once at the exit', { cd: T1.cd, sets: T1.cdSet });
  } else ok(false, 'timeout ran', T1);
  const T4 = await R('defeat', LIB + `
    ready(); S.charge = 1; H.step(0.4); D.useUlt(); H.until(() => H.log.some(h => h.nc), 12); const n0 = H.log.length; H.mortal = true; me.inv = 0; me.hp = 0; me.dead = true; const tD = g.t;
    /* (the exit's dissolve is decoration that runs its course: 1.85 s of falling petals, each living up to 2.2 s, so the
       shared 'belladonna-moves' effect ends 3.6 to 4.05 s after the defeat. Wait for it, capped at 6 s, rather than
       sampling at exactly 4 s, which raced it about one run in three.) */
    const fxOf = () => D.ELEM.fx.filter(f => /belladonna/i.test(f.key || '')).map(f => f.key || '?');
    H.until(() => g.t - tD >= 2 && !fxOf().length, 6); const goneAt = +(g.t - tD).toFixed(2); H.step(Math.max(0, 4 - (g.t - tD)));
    return { dead: me.dead, after: H.log.length - n0, veh: !!(D.VEH && D.VEH.active), goneAt, fx: fxOf() };`);
  if (T4 && !T4.err) ok(T4.dead && T4.after === 0 && !T4.veh && !T4.fx.some(k => /belladonna/i.test(k)), 'pet defeat during Twister: the storm and its damage stop, the pet stays defeated, cleanup', T4);

  // ---- 5. the environment: attacks smash props; doors and bridges stay (deterministic: set beside a known prop) ----
  const E1 = await R('smash', LIB + `
    ready(); const vs = S.vs || null, X = S.X; if (!X.carProps || (vs && !vs.props)) return { noHook: true };
    const m0 = D.mons.find(m => m._tag === 'm0'); for (const m of D.mons) if (!m.boss) { m.dead = true; m.x += 90; }
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.55, 0), sm = p => vs ? !!vs.smashable(Math.floor(p.x), Math.floor(p.y)) : true;
    const spotFor = (p, dist) => { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, x = p.x - Math.cos(a) * dist, y = p.y - Math.sin(a) * dist; if (!W(x, y)) continue; let clear = true; for (let q = 0.4; q < dist - 0.7 && clear; q += 0.3) if (D.blocked(x + Math.cos(a) * q, y + Math.sin(a) * q, 0.3, 0)) clear = false; if (clear && !D.propList.some(o => o !== p && !o.broken && Math.hypot(o.x - x, o.y - y) < 1.2)) return { x, y, a }; } return null; };
    const cand = D.propList.filter(p => !p.broken && sm(p)).map(p => [p, Math.hypot(p.x - S.V.x, p.y - S.V.y)]).sort((a, b) => a[1] - b[1]).map(q => q[0]);
    const put = sp => { S.V.x = me.x = sp.x; S.V.y = me.y = sp.y; S.V.vx = S.V.vy = 0; H.face(sp.a); H.step(0.25); S.V.x = me.x = sp.x; S.V.y = me.y = sp.y; H.release(); };
    const out = { cands: cand.length, sm0: H.st(S, ['smashed', 'smash']) }, prot = () => D.propList.filter(p => /door|gate|stair|bridge|exit/i.test(p.kind) && !p.broken).length, pr0 = prot();
    const tryAt = (btn, dist, wait, skip) => { for (const p of cand) { if (p.broken || p === skip) continue; const sp = spotFor(p, dist); if (!sp) continue; put(sp); H.until(() => H.ready(S) && !S.busy, 6); S.V.x = me.x = sp.x; S.V.y = me.y = sp.y; H.face(sp.a); H.press(btn); H.release(); H.step(wait); return { p, kind: p.kind, broken: !!p.broken }; } return null; };
    const w = tryAt('strong', 2.0, 4.5), r = tryAt('strong2', 3.0, 5, w && w.p);
    /* Swoosh: its pass round an enemy standing one tile short of a prop */
    let sw = null; for (const p of cand) { if (p.broken) continue; const sp = spotFor(p, 4.2); if (!sp) continue; const ex = p.x - Math.cos(sp.a) * 1.1, ey = p.y - Math.sin(sp.a) * 1.1; if (!m0) break; m0.dead = false; m0.hp = 1e9; put(sp); H.until(() => { m0.x = ex; m0.y = ey; return H.ready(S) && !S.busy && !(cdD() > 0); }, 6); S.V.x = me.x = sp.x; S.V.y = me.y = sp.y; H.step(0.4, () => { m0.x = ex; m0.y = ey; }); const s0 = H.st(S, ['swooshes']); H.face(sp.a); H.press('dodge'); H.release(); H.until(() => { m0.x = ex; m0.y = ey; return !H.swooshing(S) && H.ready(S) && H.st(S, ['swooshes']) > s0; }, 6); H.step(0.3); sw = { kind: p.kind, broken: !!p.broken, started: H.st(S, ['swooshes']) - s0, swooshSmash: H.st(S, ['swooshSmash']) }; break; }
    if (m0) { m0.dead = true; m0.x += 90; }
    out.stat = H.st(S, ['smashed', 'smash']) - out.sm0;
    /* the Swoosh's slams: with no enemy anywhere, a press beside props; every smashable prop well inside a slam's circle breaks */
    if (m0) { m0.dead = true; m0.x += 90; } let sl = null; const dbg = [];
    /* where a press from a spot ends its swoop varies, so: one press to learn the offset from the start to the slam centre, then
       presses from spots placed so that centre lands on a smashable prop (any prop well inside a slam circle counts) */
    let off = null; { H.until(() => H.ready(S) && !S.busy && !(cdD() > 0), 6); const x0 = S.V.x, y0 = S.V.y, a0 = 0; S.ctx.swooshPlan = null; H.face(a0); H.press('dodge'); H.release(); H.until(() => !H.swooshing(S) && H.ready(S), 6); const pl = S.ctx.swooshPlan; if (pl) off = { d: Math.hypot(pl.x - x0, pl.y - y0), a: Math.atan2(pl.y - y0, pl.x - x0) - a0 }; }
    for (const p of cand) { if (sl || !off || dbg.length > 8) break; if (p.broken) continue; for (let k = 0; k < 8 && !sl; k++) { const a = k * Math.PI / 4, sx = p.x - Math.cos(a + off.a) * off.d, sy = p.y - Math.sin(a + off.a) * off.d; if (!W(sx, sy)) continue;
      put({ x: sx, y: sy, a }); H.until(() => H.ready(S) && !S.busy && !(cdD() > 0), 6); S.V.x = me.x = sx; S.V.y = me.y = sy; const before = D.propList.filter(q => !q.broken && sm(q)); S.ctx.swooshPlan = null; H.face(a); H.press('dodge'); H.release(); H.until(() => !H.swooshing(S) && H.ready(S), 6); const pl = S.ctx.swooshPlan; if (!pl) continue;
      const cov = before.filter(q => pl.at.some(e => Math.hypot(q.x - e.x, q.y - e.y) < e.r - 0.3)); dbg.push([+Math.hypot(pl.x - p.x, pl.y - p.y).toFixed(1), cov.length]); if (cov.length) sl = { covered: cov.length, broken: cov.filter(q => q.broken).length, kinds: cov.map(q => q.kind) }; break; } }
    out.slam = sl || { none: true, off, dbg };
    /* Twister: hovering beside a prop, no enemy anywhere: a tick's own circles break it */
    let tw = null; for (const p of cand) { if (p.broken) continue; const sp = spotFor(p, 2.0); if (!sp) continue; put(sp); H.until(() => H.ready(S) && !S.busy, 6); S.V.x = me.x = sp.x; S.V.y = me.y = sp.y; S.charge = 1; H.step(0.6); D.useUlt(); H.until(() => S.phase === 'gone', 14); tw = { kind: p.kind, broken: !!p.broken, used: S.used }; break; }
    if (w) delete w.p; if (r) delete r.p; out.wild = w; out.ring = r; out.swoosh = sw; out.twister = tw;
    out.protectedBroken = pr0 - prot(); return out;`);
  if (E1 && !E1.err) { if (E1.noHook) console.log('skip  no smash hook on this floor');
    else { ok(!!E1.wild && E1.wild.broken, 'Wildflowers cast beside a smashable prop breaks it', E1.wild || E1);
      ok(!!E1.ring && E1.ring.broken, 'Ring Blade thrown at a smashable prop breaks it', E1.ring || E1);
      ok(!!E1.swoosh && E1.swoosh.started === 1 && E1.swoosh.broken, "Swoosh's pass breaks a prop beside its target", E1.swoosh || E1);
      ok(!!E1.slam && !E1.slam.none && E1.slam.broken === E1.slam.covered, "the Swoosh's slams break the props inside their circles", E1.slam);
      ok(!!E1.twister && E1.twister.used && E1.twister.broken, 'a Twister tick breaks a prop with no enemy near', E1.twister || E1);
      ok(E1.stat >= 3, 'the session counts what it smashed', E1.stat);
      ok(E1.protectedBroken === 0, 'doors, gates, stairs and bridges are kept', E1.protectedBroken); } }

  ok(!errors.length, 'no page errors', errors.slice(0, 4));
  console.log('manual (montages / captures): 1 pink flower, 1 white inner flower, 1 ring with a clear gap; the pet visible at the centre and never covered; tentacles never attack; breathing motion; ribbon and blossom look; sound.');
  await browser.close();
  console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok`); process.exit(bad ? 1 : 0);
})();
