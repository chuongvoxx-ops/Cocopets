// Jaws (Water's 11th Ultimate: the flying shark and Leviathan, the anchored siege form): the spec's verify list
// (docs/elem-spec/water-jaws.md, last section) and the brief's decisions, as far as logic can check them, on the real game.
//   usage: HTML=test-jawH.html EVO=7 node tests/jaws.js
// The hooks it reads (g._jaws and its stats, the pool registry on ctx, JAWS_MOVES.stats, the plans on ctx) are listed in
// the brief's Notes (H); the accessors take the first name that exists. Visual items are listed as 'manual' at the end.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const EVO = +(process.env.EVO || 4);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'warning' && /Jaws|Leviathan|Shark Attack/.test(m.text())) errors.push('console: ' + m.text()); });
  let bad = 0, n = 0; const ok = (c, m, x) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);



  // ---- the model: one part set in both forms, the seat upright all the way through the transformation ----
  const ros = await page.evaluate(() => { const P = window.__pp, M = P.jaws || null, U = (P.ELEM_MOVES.water || {}).ult || [], I = (P.ELEM_IMPL.water || {}).ult || {};
    const out = { n: U.length, i: U.findIndex(r => r[0] === 'jaws'), cd: (U.find(r => r[0] === 'jaws') || [])[4], impl: typeof I.jaws, model: !!M, JM: typeof self.JAWS_MOVES === 'object' ? Object.keys(self.JAWS_MOVES) : null };
    if (M && M.rigOf && M.blankPose) { try { const names = x => { const p = M.blankPose(); p.xf = x; return M.rigOf(p).list.map(it => it.part).sort().join(','); }, n0 = names(0), nh = names(0.5), n1 = names(1); out.same = n0 === n1 && n0 === nh; out.parts = n0.split(',').length; let okSeat = 0, zs = [];
      for (let k = 0; k <= 10; k++) { const p = M.blankPose(); p.xf = k / 10; const a = M.anchorAt('seat', 0, 0, 0, 0, p), c = M.anchorAt('center', 0, 0, 0, 0, p); if (a && isFinite(a.x + a.y + a.z) && c && Math.hypot(a.x - c.x, a.y - c.y, a.z - c.z) < 3) okSeat++; zs.push(a ? +a.z.toFixed(2) : null); } out.seat = okSeat; out.seatZ = zs; } catch (e) { out.modelErr = String(e); } }
    return out; });
  if (ros.model && ros.same != null) { ok(ros.same && ros.parts > 8, 'one persistent part set: the identical list of parts at xf 0, 0.5 and 1', { items: ros.parts });
    ok(ros.seat === 11, 'the seat anchor stays on the hull at every step of the transformation', ros.seatZ); } else console.log('skip  model rig not exposed', ros.modelErr || '');
  if (ros.i >= 0) { ok(ros.i === 10 && ros.n === 11, 'Jaws is the 11th Water Ultimate', { i: ros.i, n: ros.n }); ok(ros.cd === 150, 'its outer cooldown in the roster is 150 s', ros.cd); } else console.log('skip  no roster row yet');
  console.log("E's moves:", ros.JM ? ros.JM.join(',') : 'absent');
  if (ros.impl !== 'function') { console.log('core absent: stopping'); await browser.close(); console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok (core absent)`); process.exit(1); }
  await page.evaluate(() => { const P = window.__pp, NEU = ['chill', 'leech', 'pierce', 'knock', 'shock']; let k = 0; do { P.quickStart('Jaw'); } while (!NEU.includes(P.dun.petKit(P.st).AB.twist) && ++k < 200); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });
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
      /* (no roster row until the core lands: a sibling Water ult's row under the key 'jaws' then) */ const WL = P.ELEM_LIST.water, sib = Object.values(WL).filter(r => r && r.slot === 'ult' || (r && r.kind === 'ult'))[0] || Object.values(WL).slice(-1)[0], mv = WL.ey_jaws || Object.assign({}, sib, { key: 'jaws', id: 'ey_jaws', name: 'Jaws' }); D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo }));
      const H = { P, G, D, me, g, kit0, log: [], hold: null };
      H.step = (s, each) => { const t1 = g.t + s; let k = 0; while (g.t < t1 - 1e-6 && k++ < 6000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); if (each && each() === true) break; } };
      H.until = (fn, cap) => { const t1 = g.t + (cap || 10); let k = 0; while (!fn() && g.t < t1 && k++ < 9000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); } return fn(); };
      H.S = () => g._jaws;
      /* tolerant accessors (see the Notes): the first name that exists */
      const pick = (o, names, d) => { for (const n of names) if (o && o[n] != null) return o[n]; return d; };
      H.pick = pick; const FINS = ['finisher', 'shark', 'sharkattack', 'ult', 'finish'], RIDE = ['fly', 'ride', 'play', 'air', 'siege', 'anchored', 'hold', 'leviathan'], TRANS = ['summon', 'anchor', 'anchoring', 'release', 'releasing', 'xform', 'transform', 'maw', 'hydrojet', 'out', 'gone'];
      const FIN = S => !!S && (FINS.includes(S.phase) || !!(S.ctx && (S.ctx.finisher)));
      H.fin = FIN; H.form = S => { const f = pick(S, ['form'], null); if (typeof f === 'string') return /lev|siege|sub/i.test(f) ? 'leviathan' : 'shark'; const x = pick(S, ['xf'], pick(S.V && S.V.pose, ['xf'], 0)); return x > 0.5 ? 'leviathan' : 'shark'; };
      H.xfDone = S => { const x = pick(S, ['xf'], pick(S.V && S.V.pose, ['xf'], 0)); return x <= 0.001 || x >= 0.999; };
      H.ready = S => !!S && !FIN(S) && !TRANS.includes(S.phase) && RIDE.includes(S.phase) && !S.busy && H.xfDone(S) && !S.maw && !S.jet;
      
      H.left = S => pick(S, ['left'], S.endT != null ? S.endT - g.t : null);
      H.st = (S, names) => pick(S.stats, names, pick(self.JAWS_MOVES && self.JAWS_MOVES.stats, names, 0));
      H.drifting = S => S.phase === 'maw' || !!S.maw;
      H.wrap = () => { const S = H.S(), X = S.X; if (X.__w) return; X.__w = 1; const h0 = X.hitMon; X.hitMon = (m, d, o) => { const r = h0(m, d, o); if (m && !m._tag) m._tag = 'n' + (H.nTag = (H.nTag || 0) + 1); const s2 = H.S(); H.log.push({ m: m && m._tag, d: r, raw: d, src: o && (o.src || o.tag || o.kind) || null, noC: !!(o && o.noCharge), nc: !!(s2 && FIN(s2)), ph: s2 ? s2.phase : 'none', form: s2 ? H.form(s2) : '', dr: !!(s2 && H.drifting(s2)), boss: !!(m && m.boss), frz: m ? m.freeze : 0, t: g.t }); return r; }; };   /* (every hit of the session, A's own Glides and Dive included; Dark Messiah's are the noCharge ones) */
      H.cast = () => { D.useUlt(); H.until(() => H.S() && H.ready(H.S()), 10); if (H.S()) H.wrap(); return H.S(); };
      H.labels = () => { if (!D.VEH || !D.VEH.drawBtns) return []; const L = [], f0 = window.GFX_LABELS_PATCH; const GF = P.GFX, l0 = GF.labelS; GF.labelS = (c, s) => { L.push(String(s)); }; try { const cv = document.createElement('canvas'); cv.width = 400; cv.height = 900; const c = cv.getContext('2d'); const pic = (k, w, h, paint) => { const q = document.createElement('canvas'); q.width = Math.max(1, w | 0); q.height = Math.max(1, h | 0); try { paint(q.getContext('2d'), q.width, q.height); } catch (e) {} return q; };
        D.VEH.drawBtns(c, { B: D.vehBtns(), blitC: () => {}, hudPic: pic, glowPic: () => pic('', 4, 4, () => {}), touchUI: true }); } finally { GF.labelS = l0; } void f0; return L; };
      H.face = a => { const S = H.S(); S.mx = Math.cos(a); S.my = Math.sin(a); const K = P.arc.keys; if (K) { K.right = Math.cos(a) > 0.5; K.left = Math.cos(a) < -0.5; K.down = Math.sin(a) > 0.5; K.up = Math.sin(a) < -0.5; } H.step(1 / 60); };
      H.release = () => { const K = P.arc.keys; if (K) K.right = K.left = K.up = K.down = false; };
      H.toggle = () => { const S = H.S(), c = S.ctx || {}; for (const f of [D.VEH && D.VEH.form, c.toggleForm, c.form, D.vehForm, S.toggleForm]) if (typeof f === 'function') { f.call(D.VEH, S); return true; } const K = P.arc.keys; if (K) { K.f = K.F = true; G.update(1 / 60); K.f = K.F = false; return true; } return false; };
      H.to = form => { const S = H.S(); if (H.form(S) === form && H.ready(S)) return true; H.until(() => H.ready(S), 6); H.toggle(); return H.until(() => H.form(S) === form && H.ready(S), 8); };
      H.pools = () => { const S = H.S(), L = pick(S, ['pools'], pick(S.ctx, ['pools'], [])); return (Array.isArray(L) ? L : Object.values(L)).filter(p => p && p.state !== 'consumed' && !p.dead); };
      H.pool = () => { const S = H.S(), c = S.ctx || {}; return c.pool || c.pools_ || { create: c.poolCreate, claim: c.poolClaim, release: c.poolRelease, consume: c.poolConsume }; };
      H.press = k => { if (k === 'ult') D.useUlt(); else if (k === 'dodge') D.dodge(); else D.useStrong(k); };
      return (new Function('H', 'arg', src))(H, arg);
    }, [EVO, body, arg === undefined ? null : arg]);
  }
  const R = async (name, body, arg) => { try { return await scen(name, body, arg); } catch (e) { ok(false, name + ': ' + e.message.split('\n')[0]); return null; } };

  const DUR = { 1: 30, 2: 30, 3: 30, 4: 45, 5: 45, 6: 45, 7: 60 }[EVO];
  const LIB = `
    const { D, g, me } = H; const S = H.cast(); if (!S) return { err: 'no session' };
    const ready = () => H.until(() => H.ready(S), 8);
    const cd = names => H.pick(S.cd, names, 0), cdS1 = () => cd(['s1', 'strong']), cdS2 = () => cd(['s2', 'strong2']), cdD = () => cd(['dodge']);
    const zero = () => { if (S.cd) for (const k in S.cd) S.cd[k] = 0; };
    const dl = () => S.endT != null ? S.endT : null;   /* the one deadline on the game clock */
    const only = () => { for (const m of D.mons) if (!m.dead && !m.boss && (!m._tag || m._tag[0] === 'n')) { m.dead = true; m.x += 90; } };
    const pins = () => D.mons.filter(m => m._tag && m._tag[0] === 'm' && !m.dead).map(m => [m, m.x, m.y]);
    const hold = P0 => { only(); for (const q of P0) { q[0].x = q[1]; q[0].y = q[2]; } };
    const PL = H.pool(), pools = H.pools, ids = () => pools().map(p => p.id), avail = () => pools().filter(p => p.state === 'available' || p.state == null), claimed = () => pools().filter(p => p.state === 'claimed');
    const mk = (x, y) => { try { return PL.create(x, y); } catch (e) { return null; } };
    /* n open-floor spots where a pool may form, at least minD apart and from the form (A's pools.valid / pools.snap) */
    const spots = (n, minD, near, rMin) => { const out = [], c = near || { x: S.V.x, y: S.V.y }; for (let r = rMin || 3; r < 22 && out.length < n; r += 0.5) for (let k = 0; k < 24 && out.length < n; k++) { const a = k * Math.PI / 12 + r, x0 = c.x + Math.cos(a) * r, y0 = c.y + Math.sin(a) * r; let q = { x: x0, y: y0 }; try { if (PL.snap) q = PL.snap(x0, y0, 1.5); } catch (e) { q = null; } if (!q || (PL.valid && !PL.valid(q.x, q.y)) || !D.walkAt(Math.floor(q.x), Math.floor(q.y)) || D.blocked(q.x, q.y, 0.5, 0)) continue; if (out.some(o => Math.hypot(o.x - q.x, o.y - q.y) < minD)) continue; out.push({ x: q.x, y: q.y }); } return out; };
    const perM = L => L.reduce((o, h) => (o[h.m] = (o[h.m] || 0) + 1, o), {});
    const aimAt = (x, y) => { const a = Math.atan2(y - S.V.y, x - S.V.x); if (H.form(S) === 'leviathan') { S.V.heading = a; if (S.ha != null) S.ha = a; if (S.au != null) S.au = a; } S.aim = { x, y }; if (S.ctx) S.ctx.aimPoint = { x, y }; H.face(a); H.release(); return a; };
  `;

  // ---- 1. both forms: commands, one timer, anchored aiming, Hydrojet, the form change keeps everything ----
  const A = await R('forms', LIB + `
    ready(); const out = { left0: +H.left(S).toFixed(2), form0: H.form(S), pools0: pools().length, charge0: S.charge, lab0: H.labels(), dl0: dl(), z0: +(S.V.z || 0).toFixed(2), pet0: !!(S.pet || me.petAlt || S.ctx) };
    const P0 = pins(); hold(P0);
    // a little real damage first, so there is charge and a cooldown to carry across
    H.press('strong'); H.until(() => H.log.length > 0, 4, ); H.step(0.4, () => hold(P0)); ready(); const ch1 = S.charge, np1 = pools().length, id1 = ids().join();
    out.anchorOK = H.to('leviathan'); out.form1 = H.form(S); out.lab1 = H.labels(); out.dl1 = dl(); out.ch1 = [ch1, S.charge]; out.pools1 = [np1, pools().length, id1 === ids().join()];
    // anchored: the stick turns the hull, the position holds
    const p0 = [S.V.x, S.V.y, S.V.z], h0 = S.V.heading; H.face(h0 + 2); const K = H.P.arc.keys; H.step(1.0); H.release(); out.hold = { moved: +Math.hypot(S.V.x - p0[0], S.V.y - p0[1]).toFixed(3), dz: +Math.abs(S.V.z - p0[2]).toFixed(3), turned: +Math.abs(S.V.heading - h0).toFixed(2) };
    // Hydrojet: a short hop, no damage, no pool, it settles anchored again
    zero(); const n0 = H.log.length, j0 = H.st(S, ['hydrojets', 'jets']), c0 = S.charge; H.face(0); H.press('dodge'); H.release(); H.step(0.15); const midPhase = S.phase; H.until(() => H.ready(S), 5);
    out.jet = { n: H.st(S, ['hydrojets', 'jets']) - j0, moved: +Math.hypot(S.V.x - p0[0], S.V.y - p0[1]).toFixed(2), hits: H.log.length - n0, form: H.form(S), charge: S.charge === c0, pools: pools().length, mid: midPhase }; const p1 = [S.V.x, S.V.y]; H.step(0.6); out.jet.settled = Math.hypot(S.V.x - p1[0], S.V.y - p1[1]) < 0.05;
    out.releaseOK = H.to('shark'); out.lab2 = H.labels(); out.dl2 = dl(); out.ch2 = S.charge; out.pools2 = pools().length; out.timerSets = H.st(S, ['timerSets']); out.left2 = +H.left(S).toFixed(2); out.t = g.t;
    out.anchors = H.st(S, ['anchors']); out.releases = H.st(S, ['releases']); return out;`);
  if (A && !A.err) { const has = (L, re) => L.some(s => re.test(s));
    ok(Math.abs(A.left0 - DUR) < 1.2, `the shared session lasts ${DUR} s at this tier`, A.left0);
    ok(A.form0 === 'shark' && A.pools0 === 0 && A.charge0 === 0, 'it begins as the shark with an empty gauge and no pools', [A.form0, A.pools0, A.charge0]);
    ok(has(A.lab0, /MAW/) && has(A.lab0, /WATER RAY/) && has(A.lab0, /ROLLING WAVE/) && has(A.lab0, /ANCHOR/) && has(A.lab0, /SHARK ATTACK/), 'shark commands: Maw, Water Ray, Rolling Wave, Anchor, Shark Attack', A.lab0);
    ok(A.anchorOK && A.form1 === 'leviathan', 'Anchor works in the air with no pool needed', [A.anchorOK, A.form1, A.pools1]);
    ok(has(A.lab1, /HYDROJET/) && has(A.lab1, /DEPTH CHARGE/) && has(A.lab1, /MAELSTROM/) && has(A.lab1, /RELEASE/) && has(A.lab1, /SHARK ATTACK/) && !has(A.lab1, /^MAW/), 'Leviathan commands: Hydrojet, Depth Charge, Maelstrom, Release, Shark Attack', A.lab1);
    ok(A.dl0 != null && A.dl1 === A.dl0 && A.dl2 === A.dl0 && A.timerSets <= 1, 'exactly one timer: Anchor and Release never restart or extend it', { dl: [A.dl0, A.dl1, A.dl2], sets: A.timerSets });
    ok(A.ch1[1] === A.ch1[0] && A.ch2 === A.ch1[0] && A.ch1[0] > 0, 'the gauge is kept across both form changes, and the changes themselves charge nothing', [A.ch1, A.ch2]);
    ok(A.pools1[0] === A.pools1[1] && A.pools1[2] && A.pools2 === A.pools1[0] && A.pools1[0] >= 1, 'pools are kept through the form changes', [A.pools1, A.pools2]);
    ok(A.hold.moved < 0.1 && A.hold.dz < 0.1 && A.hold.turned > 0.3, 'anchored: the stick turns the hull, position and altitude hold', A.hold);
    ok(A.jet.n === 1 && A.jet.moved > 0.8 && A.jet.hits === 0 && A.jet.form === 'leviathan' && A.jet.charge && A.jet.settled, 'Hydrojet: a hop with no damage and no charge, settling anchored in Leviathan form', A.jet);
    ok(A.releaseOK && has(A.lab2, /MAW/) && has(A.lab2, /ANCHOR/), 'Release returns the same shark and its commands', A.lab2);
  } else ok(false, 'forms sequence ran', A);

  // ---- 2. shared slot cooldowns across a form change ----
  const C = await R('cooldowns', LIB + `
    ready(); const P0 = pins(); hold(P0); const out = {};
    H.press('strong'); H.step(0.5, () => hold(P0)); H.until(() => H.ready(S), 5); const c1 = cdS1(); H.to('leviathan'); const c1b = cdS1(), d0 = H.st(S, ['depth', 'depthCharges']); if (c1b > 0.05) { H.press('strong'); H.step(0.1); } out.s1 = { after: +c1.toFixed(2), inLev: +c1b.toFixed(2), fired: H.st(S, ['depth', 'depthCharges']) - d0 };
    zero(); H.until(() => H.ready(S), 5); H.face(0); H.press('dodge'); H.release(); H.until(() => H.ready(S), 5); const cdj = cdD(); H.to('shark'); out.dodge = { afterJet: +cdj.toFixed(2), inShark: +cdD().toFixed(2) };
    zero(); H.until(() => H.ready(S), 5); H.press('strong2'); H.step(0.5, () => hold(P0)); H.until(() => H.ready(S), 5); const c2 = cdS2(); H.to('leviathan'); out.s2 = { after: +c2.toFixed(2), inLev: +cdS2().toFixed(2) }; return out;`);
  if (C && !C.err) { ok(C.s1.after > 0.3 && C.s1.inLev > 0 && C.s1.inLev <= C.s1.after && C.s1.fired === 0, 'Water Ray then Anchor: Depth Charge is not ready (one cooldown for the slot)', C.s1);
    ok(C.s2.after > 0.3 && C.s2.inLev > 0 && C.s2.inLev <= C.s2.after, 'Rolling Wave then Anchor: Maelstrom shares its cooldown', C.s2);
    ok(C.dodge.inShark <= C.dodge.afterJet + 1e-6, 'Hydrojet then Release: the Dodge recovery is not reset', C.dodge); } else ok(false, 'cooldowns ran', C);

  // ---- 3. the pool registry: creation, refresh, at most three, oldest available replaced, claims count, a cancelled claim is released ----
  const PO = await R('pools', LIB + `
    ready(); const P0 = pins(); hold(P0); const out = {}; if (!PL || !PL.create) out.noApi = true;
    // a real Water Ray: one explosion hit per enemy, one pool, and the pool itself neither hits nor charges
    const n0 = H.log.length; H.press('strong'); H.until(() => pools().length > 0, 5, ); H.step(0.8, () => hold(P0)); const L = H.log.slice(n0), ch = S.charge, nl = H.log.length; H.step(1.5, () => hold(P0));
    out.ray = { per: perM(L), pools: pools().length, laterHits: H.log.length - nl, laterCharge: S.charge - ch, state: pools()[0] && pools()[0].state };
    if (out.noApi) return out;
    const p0 = pools()[0]; if (!p0) return Object.assign(out, { noPool: true }); const x = p0.x, y = p0.y, c0 = S.charge, h0 = H.log.length;
    mk(x + 0.3, y); out.refresh = { pools: pools().length, sameId: pools()[0].id === p0.id, stat: H.st(S, ['poolsRefreshed']) };
    const SP = spots(6, 3.5, { x, y }, 4.5); out.spots = SP.length; if (SP.length < 5) return Object.assign(out, { fewSpots: true }); mk(SP[0].x, SP[0].y); mk(SP[1].x, SP[1].y); out.three = pools().length; const idsA = pools().slice().sort((a, b) => a.born - b.born).map(p => p.id); mk(SP[2].x, SP[2].y); const idsB = ids(); out.four = { n: idsB.length, oldestGone: !idsB.includes(idsA[0]) && idsA.slice(1).every(i => idsB.includes(i)) };
    out.silent = { hits: H.log.length - h0, charge: S.charge - c0 };
    // claims: a claimed pool is never the one replaced; all three claimed = no new pool, and Water Ray still hits
    const B = pools().slice().sort((a, b) => a.born - b.born); PL.claim(B[0].id); mk(SP[3].x, SP[3].y); const idsC = ids(); out.claimKept = { n: idsC.length, claimedStill: idsC.includes(B[0].id), secondOldestGone: !idsC.includes(B[1].id) };
    for (const p of pools()) if (p.state !== 'claimed') PL.claim(p.id); const idsD = ids().join(); const r = mk(SP[4].x, SP[4].y); zero(); H.until(() => H.ready(S), 5); const n1 = H.log.length; H.press('strong'); H.step(1.6, () => hold(P0));
    out.allClaimed = { n: pools().length, same: ids().join() === idsD, created: !!r && ids().includes(r.id || r), rayHits: H.log.length - n1 };
    const one = pools()[0]; PL.release(one.id); out.released = { state: pools().find(p => p.id === one.id).state, stat: H.st(S, ['claimsReleased']) };
    PL.consume(pools()[1].id); out.consumed = pools().length; return out;`);
  if (PO && !PO.err) {
    ok(Object.keys(PO.ray.per).length > 0 && Object.values(PO.ray.per).every(c => c === 1), 'Water Ray: one explosion hit per enemy (no frame-by-frame beam hits)', PO.ray.per);
    ok(PO.ray.pools === 1 && PO.ray.laterHits === 0 && PO.ray.laterCharge === 0, 'it leaves one pool, and the pool neither damages nor charges', PO.ray);
    if (PO.noPool || PO.fewSpots) ok(false, 'the pool registry cases could be set up', PO); else if (PO.noApi) console.log('skip  pool registry API not found on ctx (create / claim / release / consume)'); else {
      ok(PO.refresh.pools === 1 && PO.refresh.sameId, 'a Water Ray on an existing pool refreshes it (no stacking)', PO.refresh);
      ok(PO.three === 3 && PO.four.n === 3 && PO.four.oldestGone, 'at most three pools: a fourth replaces the oldest available', [PO.three, PO.four]);
      ok(PO.silent.hits === 0 && PO.silent.charge === 0, 'creating, refreshing and replacing pools deals no damage and charges nothing', PO.silent);
      ok(PO.claimKept.n === 3 && PO.claimKept.claimedStill && PO.claimKept.secondOldestGone, 'a claimed pool is never the one replaced', PO.claimKept);
      ok(PO.allClaimed.n === 3 && PO.allClaimed.same && !PO.allClaimed.created && PO.allClaimed.rayHits > 0, 'claims count toward the limit: with three claimed, Water Ray still hits but makes no pool', PO.allClaimed);
      ok(PO.released.state === 'available', 'a cancelled claim is released back to available', PO.released);
      ok(PO.consumed === 2, 'a consumed pool leaves the registry', PO.consumed); }
  } else ok(false, 'pools ran', PO);

  // ---- 4. Depth Charge: plain, empowered (one amplified blast an enemy, the pool consumed), a shot finishing after Release ----
  const DC = await R('depth', LIB + `
    ready(); const P0 = pins().slice(0, 3); for (const m of D.mons) if (!m.boss && !P0.some(q => q[0] === m)) { m.dead = true; m.x += 90; } const T = P0[0];
    for (const q of P0) { const i = P0.indexOf(q); q[1] = S.V.x + 4.5 + 0.5 * i; q[2] = S.V.y + (i - 1) * 0.6; } hold(P0); H.to('leviathan'); zero(); const out = {};
    const keep = () => { for (const m of D.mons) if (!m.dead && !m.boss && !P0.some(q => q[0] === m)) { m.dead = true; m.x += 90; } for (const q of P0) { q[0].x = q[1]; q[0].y = q[2]; } };
    const shot = () => { zero(); H.until(() => { keep(); return H.ready(S); }, 5); keep(); aimAt(T[1], T[2]); const n0 = H.log.length, c0 = S.charge; H.press('strong'); let k = 0; H.until(() => { hold(P0); return H.log.length > n0; }, 6); H.step(1.2, () => hold(P0)); const L = H.log.slice(n0); return { per: perM(L), dmg: L.filter(h => h.m === 'm0').reduce((a, h) => a + h.raw, 0), charged: S.charge > c0 || S.charge >= 1, src: [...new Set(L.map(h => h.src))] }; };
    out.plain = shot(); out.plainDbg = { heading: +S.V.heading.toFixed(2), want: +Math.atan2(T[2] - S.V.y, T[1] - S.V.x).toFixed(2), d: +Math.hypot(T[1] - S.V.x, T[2] - S.V.y).toFixed(1), plan: S.ctx.depthPlan ? [+(S.ctx.depthPlan.x - T[1]).toFixed(1), +(S.ctx.depthPlan.y - T[2]).toFixed(1)] : null, depth: H.st(S, ['depth']), form: H.form(S), z: +S.V.z.toFixed(1) }; out.plainPools = pools().length;
    if (PL && PL.create) { mk(T[1], T[2]); const id = pools()[0] && pools()[0].id; out.emp = shot(); out.empPool = { left: pools().length, stat: H.st(S, ['depthEmp', 'empowered']), consumed: !ids().includes(id) };
      // a launched shot keeps its claim and lands after Release
      mk(T[1], T[2]); const id2 = pools()[0] && pools()[0].id; zero(); H.until(() => { keep(); return H.ready(S); }, 5); keep(); aimAt(T[1], T[2]); const n0 = H.log.length; H.press('strong'); H.until(() => !S.busy || claimed().length > 0, 2); const claimedAtLaunch = claimed().length; H.toggle(); H.until(() => { hold(P0); return H.form(S) === 'shark' && H.ready(S); }, 8); H.step(1.5, () => hold(P0));
      const L = H.log.slice(n0); out.after = { claimedAtLaunch, form: H.form(S), per: perM(L), dmg: L.filter(h => h.m === 'm0').reduce((a, h) => a + h.raw, 0), consumed: !ids().includes(id2) }; }
    return out;`);
  if (DC && !DC.err) { const once = o => Object.keys(o).length > 0 && Object.values(o).every(c => c === 1);
    ok(once(DC.plain.per) && DC.plain.charged, 'plain Depth Charge: one blast per enemy, it charges the gauge', [DC.plain, DC.plainDbg]);
    if (DC.emp) { const k = DC.emp.dmg / Math.max(1, DC.plain.dmg);
      ok(once(DC.emp.per), 'empowered Depth Charge: one amplified blast per enemy (the geyser adds no hit)', DC.emp);
      ok(k > 1.8 && k < 3.5, 'the empowered blast is substantially stronger (about 2.5x)', +k.toFixed(2));
      ok(DC.empPool.consumed && DC.empPool.left === 0, 'the pool it used is consumed', DC.empPool);
      ok(DC.after.form === 'shark' && once(DC.after.per) && DC.after.dmg > DC.plain.dmg * 1.8 && DC.after.consumed, 'a shot launched before Release still lands empowered and consumes its claimed pool', DC.after); } else console.log('skip  empowered Depth Charge (no pool API)');
  } else ok(false, 'Depth Charge ran', DC);

  // ---- 5. Maelstrom: refused with no pool; finite ticks at any frame rate; shared registries; a resisting boss still damaged; only captured pools consumed ----
  const maelAt = fps => R('maelstrom@' + fps, LIB + `
    ready(); const fps = arg, out = {}; const P0 = pins(); H.to('leviathan'); zero();
    const m0 = H.st(S, ['mael', 'maelstroms']), r0 = H.st(S, ['maelRefused']); H.press('strong2'); H.step(0.3); out.refused = { started: H.st(S, ['mael', 'maelstroms']) - m0, stat: H.st(S, ['maelRefused']) - r0, cd: cdS2(), plan: !!(S.ctx.maelPlan && S.ctx.maelPlan.t0 != null) };
    if (!PL || !PL.create) return Object.assign(out, { noApi: true });
    // two overlapping pools with three enemies in the overlap, a third pool apart with one enemy and a real boss
    const SQ = spots(3, 7), A0 = SQ[0], B0 = SQ[1]; if (!A0 || !B0) return Object.assign(out, { noSpots: true }); const ax = A0.x, ay = A0.y, bx = B0.x, by = B0.y; mk(ax - 1.1, ay); mk(ax + 1.1, ay); mk(bx, by); const cap = ids(); out.made = cap.length;
    for (const q of P0) { const i = P0.indexOf(q); if (i < 3) { q[1] = ax + (i - 1) * 0.5; q[2] = ay + (i - 1) * 0.3; } else if (i === 3) { q[1] = bx; q[2] = by + 0.4; } else { q[0].dead = true; q[0].x += 90; } } const PP = P0.filter(q => !q[0].dead); hold(PP);
    let boss = null; try { boss = D.lesserBoss(bx + 1.2, by, 0.5, 'Test'); boss.hp = boss.maxhp = 1e9; boss._tag = 'boss'; } catch (e) {} const bp = boss ? [boss.x, boss.y] : null; let bossPull = null; if (boss) { try { const q = [boss.x, boss.y], r = S.ctx.H.pull(boss, bx, by, 1); bossPull = { ret: !!r, moved: +Math.hypot(boss.x - q[0], boss.y - q[1]).toFixed(3) }; } catch (e) { bossPull = { err: String(e) }; } }
    // one loose ordinary enemy at a pool's rim: it should be pulled inward
    const loose = P0[4] ? P0[4][0] : null; if (loose) { loose.dead = false; loose.hp = 1e9; loose.still = false; loose.spd = 0; loose.stun = 99; loose.x = bx - 3.4; loose.y = by - 0.2; } const ld0 = loose ? Math.hypot(loose.x - bx, loose.y - by) : 0;
    zero(); H.until(() => H.ready(S), 5); const n0 = H.log.length; H.press('strong2'); const G = H.G; let k = 0, late = null, made = false, ldMin = ld0;
    while (k++ < 20000) { me.inv = 1; me.hp = Math.max(me.hp, 1); for (const q of PP) { q[0].x = q[1]; q[0].y = q[2]; } G.update(1 / fps); const pl = S.ctx.maelPlan; if (loose) { loose.stun = 99; ldMin = Math.min(ldMin, Math.hypot(loose.x - bx, loose.y - by)); }
      if (pl && pl.t0 != null && !made && g.t > pl.t0 + 0.5) { made = true; late = SQ[2] ? mk(SQ[2].x, SQ[2].y) : null; }   /* a pool made after the capture */
      if (pl && pl.t0 != null && cap.every(i => !ids().includes(i)) && !S.busy && g.t > ((pl.burst != null ? pl.burst : pl.burstAt) || 0) + 0.8) break; if (S.phase === 'gone') break; }
    const pl = S.ctx.maelPlan || {}, AT = Array.isArray(pl.at) ? pl.at : [], L = H.log.slice(n0), isB = h => /burst/i.test(h.src || '') || ((pl.burst != null ? pl.burst : pl.burstAt) != null && Math.abs(h.t - (pl.burst != null ? pl.burst : pl.burstAt)) < 0.5 / Math.min(fps, 60) + 0.03 && h.t >= (pl.burst != null ? pl.burst : pl.burstAt) - 1e-6);
    const ticks = L.filter(h => !isB(h) && /^m|^boss/.test(h.m)), bursts = L.filter(h => isB(h) && /^m|^boss/.test(h.m)); only(); let dup = 0; const seen = {}; for (const h of ticks) { let b = 0; for (let j = 1; j < AT.length; j++) if (Math.abs(h.t - AT[j]) < Math.abs(h.t - AT[b])) b = j; const key = h.m + ':' + b; if (seen[key]) dup++; seen[key] = 1; }
    out.run = { nTicks: Array.isArray(pl.at) ? pl.at.length : pl.ticks, fired: pl.fired, perTick: perM(ticks), perBurst: perM(bursts), dup, boss: boss ? { hits: L.filter(h => h.m === 'boss').length, pull: bossPull, ownMoves: +Math.hypot(boss.x - bp[0], boss.y - bp[1]).toFixed(2) } : null, pulled: loose ? +(ld0 - ldMin).toFixed(2) : null,
      capturedGone: cap.every(i => !ids().includes(i)), lateKept: late ? ids().includes(late.id || late) : null, poolsLeft: pools().length, form: H.form(S), src: [...new Set(L.map(h => h.src))] };
    return out;`, fps);
  const M60 = await maelAt(60), M20 = await maelAt(20), M144 = await maelAt(144);
  if (M60 && !M60.err) { ok(M60.refused.started === 0 && !M60.refused.plan && M60.refused.cd < 0.05, 'Maelstrom with no pool is refused (nothing starts, no cooldown spent)', M60.refused);
    if (M60.noApi) console.log('skip  Maelstrom with pools (no pool API)'); else { const MR = [M60, M20, M144].filter(m => m && m.run).map(m => m.run), r = M60.run;
      ok(r.nTicks > 0 && Object.keys(r.perTick).length >= 4 && Object.values(r.perTick).every(c => c <= r.nTicks), 'Maelstrom damages on finite scheduled ticks', { ticks: r.nTicks, per: r.perTick });
      ok(MR.length === 3 && MR.every(x => x.fired === x.nTicks && x.nTicks === r.nTicks) && MR.every(x => ['m0', 'm1', 'm2', 'm3'].every(k => x.perTick[k] === r.perTick[k])), 'the tick count and the hits per held enemy are the same at 20, 60 and 144 fps', MR.map(x => [x.fired, x.perTick]));
      ok(MR.every(x => x.dup === 0), 'overlapping whirlpools never hit an enemy twice in one tick (a shared registry per tick)', MR.map(x => x.dup));
      ok(Object.keys(r.perBurst).length >= 4 && Object.values(r.perBurst).every(c => c === 1), 'the final burst hits each enemy once across all pools', r.perBurst);
      if (r.boss) ok(r.boss.hits > 0 && r.boss.pull && !r.boss.pull.ret && r.boss.pull.moved === 0, 'a boss resists the pull (the moves\' own pull call leaves it in place) and is still damaged', r.boss); else console.log('skip  no lesser boss available');
      if (r.pulled != null) ok(r.pulled > 0.3, 'an ordinary enemy at the rim is pulled inward', r.pulled);
      ok(r.capturedGone && r.lateKept !== false, 'it consumes its captured pools and only those (a pool made later is kept)', { gone: r.capturedGone, lateKept: r.lateKept, left: r.poolsLeft }); }
  } else ok(false, 'Maelstrom ran', M60);

  // ---- 5b. Maelstrom with one, two and three pools: more ground, the same damage on an enemy ----
  const maelN = k => R('maelstrom-pools@' + k, LIB + `
    ready(); const n = arg; const P0 = pins(); const SQ = spots(n, 7); if (SQ.length < n) return { fewSpots: SQ.length }; for (const q of SQ) mk(q.x, q.y); const cap = ids();
    const PP = []; for (const q of P0) { const i = P0.indexOf(q); if (i < n) { q[1] = SQ[i].x + 0.3; q[2] = SQ[i].y; PP.push(q); } else { q[0].dead = true; q[0].x += 90; } } hold(PP); H.to('leviathan'); zero(); H.until(() => H.ready(S), 5);
    const n0 = H.log.length, c0 = S.charge; H.press('strong2'); H.until(() => { hold(PP); const pl = S.ctx.maelPlan, tb = pl && (pl.burst != null ? pl.burst : pl.burstAt); return pl && tb != null && g.t > tb + 0.8 && !S.busy; }, 14);
    const L = H.log.slice(n0).filter(h => /^m/.test(h.m)), tot = {}; for (const h of L) tot[h.m] = +((tot[h.m] || 0) + h.raw / S.DK).toFixed(2);
    return { made: cap.length, tot, per: perM(L), gone: cap.every(i => !ids().includes(i)), left: pools().length, charged: S.charge > c0 || S.charge >= 1, cd: +cdS2().toFixed(2) };`, k);
  const MN = [await maelN(1), await maelN(2), await maelN(3)];
  if (MN.every(m => m && !m.err && !m.fewSpots)) {
    ok(MN.every((m, i) => m.made === i + 1 && Object.keys(m.tot).length === i + 1 && m.gone && m.left === 0), 'Maelstrom with one, two and three pools: every captured pool strikes its enemy and is consumed', MN.map(m => [m.made, Object.keys(m.tot).length, m.left]));
    ok(MN.every(m => Object.values(m.tot).every(v => Math.abs(v - MN[0].tot.m0) < 0.05)), 'an enemy in a pool takes the same Maelstrom whatever the number of pools', MN.map(m => m.tot));
    ok(MN.every(m => m.charged && m.cd > 0.5), 'it charges the gauge and spends the slot cooldown', MN.map(m => m.cd));
    console.log('      Maelstrom on one enemy:', MN[0].tot.m0, 'DK (', MN[0].per.m0, 'hits )');
  } else ok(false, 'Maelstrom with 1 / 2 / 3 pools ran', MN);

  // ---- 5c. Rolling Wave: one hit as it passes, movable enemies carried toward the aim, a rooted enemy and a boss stay and are still damaged ----
  const WAVE = LIB + `
    ready(); const P0 = pins(); for (const q of P0.slice(3)) { q[0].dead = true; q[0].x += 90; } const A0 = P0[0][0], B0 = P0[1][0], T0 = P0[2][0];
    let best = { a: 0, L: 0 }; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; let L = 0; while (L < 9 && D.walkAt(Math.floor(S.V.x + Math.cos(a) * L), Math.floor(S.V.y + Math.sin(a) * L)) && !D.blocked(S.V.x + Math.cos(a) * L, S.V.y + Math.sin(a) * L, 0.5, 0)) L += 0.25; if (L > best.L) best = { a, L }; }
    const a = best.a, ca = Math.cos(a), sa = Math.sin(a), far = Math.min(6.5, best.L - 0.6);
    /* the aim: a rooted enemy (or a real boss) far down the line; a movable one and a rooted one near the shark, either side of the line */
    let boss = null; if (arg) { try { boss = D.lesserBoss(S.V.x + ca * 2.2 + sa * 1.9, S.V.y + sa * 2.2 - ca * 1.9, 0.5, 'Test'); boss.hp = boss.maxhp = 1e9; boss._tag = 'boss'; boss.spd = 0; boss.atkCd = 99; } catch (e) {} } T0.x = S.V.x + ca * far; T0.y = S.V.y + sa * far;
    const tg = T0, bb = boss ? [boss.x, boss.y] : null; let bossPull = null; if (boss) { try { const q = [boss.x, boss.y], r = S.ctx.H.pull(boss, T0.x, T0.y, 1); bossPull = { ret: !!r, moved: +Math.hypot(boss.x - q[0], boss.y - q[1]).toFixed(3) }; } catch (e) {} } A0.still = false; A0.spd = 0; A0.stun = 99; A0.x = S.V.x + ca * 2.2 - sa * 1.9; A0.y = S.V.y + sa * 2.2 + ca * 1.9; B0.x = S.V.x + ca * 2.2 + sa * 1.9; B0.y = S.V.y + sa * 2.2 - ca * 1.9; B0.still = false; B0.spd = 0; B0.stun = 99; if (boss) { B0.dead = true; B0.x += 90; }
    const dist = m => Math.hypot(m.x - tg.x, m.y - tg.y), dA = dist(A0), b0 = [B0.x, B0.y], t0 = [tg.x, tg.y]; H.face(a); const n0 = H.log.length; H.press('strong2'); const aimed = S.ctx.target ? S.ctx.target() : null; H.step(0.2); H.release(); H.step(2.3);   /* (the stick held at the press: the aim is the enemy on its line) */
    const L = H.log.slice(n0);
    return { line: +best.L.toFixed(1), boss: !!boss, per: perM(L.filter(h => /^m|boss/.test(h.m))), bossPull, bossOwnMoves: boss ? +Math.hypot(boss.x - bb[0], boss.y - bb[1]).toFixed(2) : null, aimOff: aimed ? +Math.hypot(aimed.x - tg.x, aimed.y - tg.y).toFixed(2) : null, carried: +(dA - dist(A0)).toFixed(2), carried2: +(Math.hypot(b0[0] - t0[0], b0[1] - t0[1]) - dist(B0)).toFixed(2), target: +Math.hypot(tg.x - t0[0], tg.y - t0[1]).toFixed(2), walk: !!D.walkAt(Math.floor(A0.x), Math.floor(A0.y)) };`;
  const RW = await R('wave', WAVE, false), RB = await R('wave+boss', WAVE, true);
  if (RW && !RW.err) { ok(RW.per.m0 === 1 && RW.per.m1 === 1 && RW.per.m2 === 1, 'Rolling Wave hits each enemy once as it passes', RW.per);
    ok(RW.carried > 1 && RW.carried2 > 1 && RW.walk && RW.target < 0.3, 'movable enemies on both sides are gathered toward the aimed point, on valid ground', RW); } else ok(false, 'Rolling Wave ran', RW);
  if (RB && !RB.err && RB.boss) ok(RB.per.boss === 1 && RB.bossPull && !RB.bossPull.ret && RB.bossPull.moved === 0, "a boss in the wave is damaged once and resists the push (the moves' own pull call leaves it in place)", RB); else console.log('skip  Rolling Wave against a boss', RB && RB.err);

  // ---- 6. the gauge and Shark Attack, from each form, with no pools ----
  const sharkFrom = form => R('shark-attack@' + form, LIB + `
    ready(); const form = arg, out = {}; const P0 = pins(); for (const q of P0) { const i = P0.indexOf(q), a = i / P0.length * 6.283; q[1] = S.V.x + Math.cos(a) * 2.0; q[2] = S.V.y + Math.sin(a) * 1.4; } hold(P0); const xy0 = [S.V.x, S.V.y];
    // nothing but real damage charges it
    const c0 = S.charge; H.to('leviathan'); H.face(0); zero(); H.press('dodge'); H.release(); H.until(() => H.ready(S), 5); H.to('shark'); if (PL && PL.create) { const q = spots(1, 3)[0]; if (q && mk(q.x, q.y)) PL.consume(pools()[0].id); } S.V.x = me.x = xy0[0]; S.V.y = me.y = xy0[1]; out.idle = S.charge - c0;
    S.charge = 0.5; H.step(0.4, () => hold(P0)); D.useUlt(); H.step(0.2, () => hold(P0)); out.notFull = H.fin(S) || S.used;
    if (form === 'leviathan') H.to('leviathan'); out.form = H.form(S); out.pools = pools().length; S.charge = 1; H.step(0.5, () => hold(P0)); out.lab = H.labels().filter(s => /SHARK/.test(s));
    const n0 = H.log.length; D.useUlt(); H.step(0.1); out.started = H.fin(S) || S.used; let formMid = null, relT = null, chMax = 0;
    H.until(() => { hold(P0); if (S.used) chMax = Math.max(chMax, S.charge < 1 ? S.charge : 0); { const sp = S.ctx.sharkPlan, tb = sp && (sp.tBeam != null ? sp.tBeam : sp.beamAt); if (sp && formMid == null && tb != null && g.t >= tb) formMid = H.form(S); } if (relT == null && S.released) relT = g.t; return S.phase === 'gone'; }, 40); H.step(1.5);
    const sp = S.ctx.sharkPlan || {}, tB = sp.tBeam != null ? sp.tBeam : sp.beamAt, tJ = sp.tBite != null ? sp.tBite : sp.biteAt; const L = H.log.slice(n0).filter(h => /^m/.test(h.m)), per = perM(L), bySrc = {}; for (const h of L) { const k = /beam|bite/.test(h.src || '') ? h.src : tB != null && Math.abs(h.t - tB) < 0.05 ? 'beam' : tJ != null && Math.abs(h.t - tJ) < 0.05 ? 'bite' : 'other'; (bySrc[k] = bySrc[k] || []).push(h.m); }
    out.events = { beam: (bySrc.beam || []).length, beamOnce: new Set(bySrc.beam || []).size, bite: (bySrc.bite || []).length, biteOnce: new Set(bySrc.bite || []).size, other: (bySrc.other || []).length };
    D.useUlt(); H.step(0.2);
    out.per = per; out.bySrc = Object.fromEntries(Object.entries(bySrc).map(e => [e[0], e[1].length + '/' + new Set(e[1]).size])); out.total = +(L.filter(h => h.m === 'm0').reduce((a, h) => a + h.raw, 0) / S.DK).toFixed(1); out.noC = L.every(h => h.noC || h.nc); out.formMid = formMid;
    out.late = L.filter(h => relT != null && h.t > relT).length; out.used = S.used; out.sharks = H.st(S, ['shark', 'sharkAttacks']); out.recharged = chMax; out.cd = g.cdU; out.cdSet = H.st(S, ['cdSet']); out.walk = !!D.walkAt(Math.floor(me.x), Math.floor(me.y)); out.veh = !!(D.VEH && D.VEH.active); out.poolsEnd = pools().length; out.fx = D.ELEM.fx.filter(f => /jaws/i.test(f.key || '')).length; return out;`, form);
  const SA = await sharkFrom('shark'), SL = await sharkFrom('leviathan');
  for (const [nm, T] of [['the shark', SA], ['Leviathan', SL]]) { if (!T || T.err) { ok(false, 'Shark Attack from ' + nm + ' ran', T); continue; }
    if (nm === 'the shark') { ok(T.idle === 0, 'Anchor, Hydrojet, Release and pool changes charge nothing', T.idle); ok(!T.notFull, 'Shark Attack does not start below a full gauge'); }
    ok(T.started && T.pools === 0 && T.lab.length > 0, `Shark Attack starts from ${nm} at full gauge with zero pools`, { form: T.form, pools: T.pools, lab: T.lab });
    ok(T.events.beam === 6 && T.events.beamOnce === 6 && T.events.bite === 6 && T.events.biteOnce === 6 && T.events.other === 0, 'two authored events: one sky-beam hit and one jaw-closure hit per enemy, nothing else', { events: T.events, per: T.per });
    ok(T.noC && T.recharged === 0, 'its own damage does not recharge the gauge', { noCharge: T.noC, charge: T.recharged });
    ok(T.used && T.sharks === 1 && T.late === 0, 'one Shark Attack per summon; nothing lands after the release', { sharks: T.sharks, late: T.late });
    ok(Math.abs(T.cd - 150) < 4 && T.cdSet <= 1 && T.walk && !T.veh && T.poolsEnd === 0 && T.fx === 0, 'after it: the 150 s cooldown set once, the pet on valid ground, pools and effects cleared', T);
    if (nm === 'Leviathan' && T.formMid) ok(T.formMid === 'shark', 'from Leviathan it folds back to the shark before the dive', T.formMid);
    console.log(`      Shark Attack total on one enemy: ${T.total} DK`); }

  // ---- 7. free flight, offshore expiry; timeout in each state; defeat ----
  const O = await R('offshore', LIB + `
    ready(); const TU = S.ctx.TUNE || {}, margin = TU.margin || 16, t0 = g.t; let offT = 0, stalls = 0, lastX = S.V.x, lastT = g.t; const K = H.P.arc.keys; K.left = true; const dur0 = H.left(S);
    H.until(() => { const x = S.V.x; if (!D.walkAt(Math.floor(x), Math.floor(S.V.y))) offT += 1 / 60; if (g.t - lastT >= 0.6) { if (x > -margin + 1 && lastX - x < 0.4) stalls++; lastX = x; lastT = g.t; } return x <= -margin + 0.3 || g.t - t0 > Math.min(22, dur0 - 3); }, 24); K.left = false;
    const far = { x: +S.V.x.toFixed(1), offT: +offT.toFixed(1), stalls, safe: S.safe ? [+S.safe.x.toFixed(1), +S.safe.y.toFixed(1), !!D.walkAt(Math.floor(S.safe.x), Math.floor(S.safe.y))] : null };
    const anchored = H.to('leviathan'); if (S.endT != null) S.endT = g.t + 0.3; else S.left = 0.3; H.until(() => S.phase === 'gone', 14); H.step(1);
    return { far, anchored, end: S.phase, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), shark: H.st(S, ['shark']), veh: !!(D.VEH && D.VEH.active), cdSet: H.st(S, ['cdSet']), cd: g.cdU, pools: pools().length };`);
  if (O && !O.err) { ok(O.far.offT > 0.5 && O.far.stalls === 0 && O.far.x < 0, 'the shark flies freely over unwalkable ground and off the map', O.far);
    if (O.far.safe) ok(O.far.safe[2], 'the tracked safe-return point stays on valid ground', O.far.safe);
    ok(O.anchored, 'Anchor is allowed offshore');
    ok(O.end === 'gone' && O.walk && !O.blocked && !O.veh && !O.shark && Math.abs(O.cd - 150) < 4 && O.cdSet <= 1, 'expiry offshore in Leviathan form: safe return, no finisher, the 150 s cooldown once', O); } else ok(false, 'offshore ran', O);
  const tmo = state => R('timeout@' + state, LIB + `
    ready(); const state = arg, P0 = pins(); hold(P0); if (PL && PL.create) mk(S.V.x + 4, S.V.y);
    const cut = () => { if (S.endT != null) S.endT = g.t + 0.12; else S.left = 0.12; };
    if (state === 'siege') H.to('leviathan'); if (state === 'anchoring') { H.toggle(); H.step(0.2); } if (state === 'maw') { H.press('dodge'); H.step(0.15); } if (state === 'shot') { H.to('leviathan'); zero(); H.press('strong'); H.step(0.1); }
    const ph = S.phase, n0 = H.log.length, t0 = g.t; cut(); let relT = null; H.until(() => { if (relT == null && S.released) relT = g.t; return S.phase === 'gone'; }, 14); H.step(2.5);
    return { ph, end: S.phase, late: H.log.slice(n0).filter(h => relT != null && h.t > relT + 0.05).length, fin: H.st(S, ['shark']), walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), veh: !!(D.VEH && D.VEH.active), petAlt: !!me.petAlt, cd: g.cdU, cdSet: H.st(S, ['cdSet']), pools: pools().length, fx: D.ELEM.fx.filter(f => /jaws/i.test(f.key || '')).length, lab: H.labels().filter(s => /ANCHOR|RELEASE/.test(s)).length };`, state);
  for (const st of ['shark', 'siege', 'anchoring', 'maw', 'shot']) { const T = await tmo(st); if (!T || T.err) { ok(false, 'timeout in ' + st + ' ran', T); continue; }
    ok(T.end === 'gone' && T.fin === 0 && T.late === 0 && T.walk && !T.blocked && !T.veh && !T.petAlt && T.pools === 0 && T.fx === 0 && T.lab === 0 && Math.abs(T.cd - 150) < 5 && T.cdSet <= 1, `timeout (${st}): safe exit, no finisher, no later damage, pools, effects and the form control gone, the cooldown once`, T); }
  const DF = await R('defeat', LIB + `
    ready(); const P0 = pins(); hold(P0); if (PL && PL.create) { mk(P0[0][1], P0[0][2]); H.to('leviathan'); zero(); H.press('strong2'); H.until(() => S.ctx.maelPlan && S.ctx.maelPlan.t0 != null, 4); H.step(0.5, () => hold(P0)); }
    const n0 = H.log.length; H.mortal = true; me.inv = 0; me.hp = 0; me.dead = true; H.step(4);
    return { dead: me.dead, after: H.log.length - n0, veh: !!(D.VEH && D.VEH.active), pools: pools().length, fx: D.ELEM.fx.filter(f => /jaws/i.test(f.key || '')).length };`);
  if (DF && !DF.err) ok(DF.dead && DF.after === 0 && !DF.veh && DF.pools === 0 && DF.fx === 0, 'defeat during Maelstrom: its ticks stop, the pet stays defeated, pools and effects cleared', DF); else ok(false, 'defeat ran', DF);

  // ---- 8. the environment: a named prop broken by the attacks; doors and bridges kept ----
  const E1 = await R('smash', LIB + `
    ready(); const vs = S.vs || null, X = S.X; if (!X.carProps || (vs && !vs.props)) return { noHook: true };
    const m0 = D.mons.find(m => m._tag === 'm0'); for (const m of D.mons) if (!m.boss) { m.dead = true; m.x += 90; }
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.55, 0), sm = p => vs ? !!vs.smashable(Math.floor(p.x), Math.floor(p.y)) : true;
    const spotFor = (p, dist) => { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, x = p.x - Math.cos(a) * dist, y = p.y - Math.sin(a) * dist; if (!W(x, y)) continue; let clear = true; for (let q = 0.4; q < dist - 0.7 && clear; q += 0.3) if (D.blocked(x + Math.cos(a) * q, y + Math.sin(a) * q, 0.3, 0)) clear = false; if (clear && !D.propList.some(o => o !== p && !o.broken && Math.hypot(o.x - x, o.y - y) < 1.2)) return { x, y, a }; } return null; };
    const cand = D.propList.filter(p => !p.broken && sm(p)).map(p => [p, Math.hypot(p.x - S.V.x, p.y - S.V.y)]).sort((a, b) => a[1] - b[1]).map(q => q[0]);
    const put = sp => { S.V.x = me.x = sp.x; S.V.y = me.y = sp.y; S.V.vx = S.V.vy = 0; H.face(sp.a); H.step(0.25); S.V.x = me.x = sp.x; S.V.y = me.y = sp.y; H.release(); };
    const prot = () => D.propList.filter(p => /door|gate|stair|bridge|exit/i.test(p.kind) && !p.broken).length, pr0 = prot(), sm0 = H.st(S, ['smashed', 'smash']), out = {};
    const tryAt = (btn, dist, wait, form, enemy) => { for (const p of cand) { if (p.broken) continue; const sp = spotFor(p, dist); if (!sp) continue; H.to(form); zero(); put(sp); H.until(() => H.ready(S), 6); S.V.x = me.x = sp.x; S.V.y = me.y = sp.y; const ex = p.x - Math.cos(sp.a) * 1.1, ey = p.y - Math.sin(sp.a) * 1.1; if (enemy && m0) { m0.dead = false; m0.hp = 1e9; m0.x = ex; m0.y = ey; } aimAt(p.x, p.y); H.press(btn); H.step(wait, () => { if (enemy && m0) { m0.x = ex; m0.y = ey; } }); if (m0) { m0.dead = true; m0.x += 90; } return { kind: p.kind, broken: !!p.broken }; } return null; };
    out.ray = tryAt('strong', 4, 3, 'shark'); out.wave = tryAt('strong2', 3, 4, 'shark'); out.maw = tryAt('dodge', 4.2, 4, 'shark', true); out.depth = tryAt('strong', 4, 4, 'leviathan');
    out.stat = H.st(S, ['smashed', 'smash']) - sm0; out.protectedBroken = pr0 - prot(); return out;`);
  if (E1 && !E1.err) { if (E1.noHook) console.log('skip  no smash hook on this floor'); else {
    for (const [k, nm] of [['ray', 'Water Ray'], ['wave', 'Rolling Wave'], ['maw', 'Maw'], ['depth', 'Depth Charge']]) ok(!!E1[k] && E1[k].broken, nm + ' breaks a smashable prop', E1[k] || E1);
    ok(E1.stat >= 3, 'the session counts what it smashed', E1.stat); ok(E1.protectedBroken === 0, 'doors, gates, stairs and bridges are kept', E1.protectedBroken); } } else ok(false, 'smash ran', E1);

  ok(!errors.length, 'no page errors', errors.slice(0, 4));
  console.log('manual (montages / captures): the cel shading and blue / chrome materials; the transformation with its parts connected; the pet visible and upright in the cockpit; the pool indicators; the starry ocean and the spirit jaws; sound.');
  await browser.close();
  console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok`); process.exit(bad ? 1 : 0);
})();
