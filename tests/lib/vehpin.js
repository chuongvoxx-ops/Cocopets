// Shared harness for pinning a ridden ult's gameplay before its look is remade (Nidhogg, Beast Machine, Sports Car).
// It measures what the player gets (durations, every move's hits and damage per hit, cadences, the meter, the finisher,
// the exit, the camera, scenery smashing) on the real game and compares it with a stored baseline
// (tests/baseline/<key>-evo<N>.json, written by the first run or by UPDATE=1). A remake that changes only the look keeps
// every strict field; soft fields (how many enemies a cast happened to reach, the camera offset) print WARN, never fail.
// Used by tests/nidhogg.js, tests/beast.js, tests/car.js.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');

module.exports = async function vehpin(U) {
  const EVO = +(process.env.EVO || 4), UPDATE = process.env.UPDATE === '1';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  let bad = 0, n = 0, warn = 0; const ok = (c, m, x) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  const soft = (c, m, x) => { if (!c) { warn++; console.log('WARN ' + m, x === undefined ? '' : JSON.stringify(x)); } };
  /* GLFLAGS=__NIDHOGG_GL,__NG_GL (comma list): set before any game script, to run on the forced GPU path (the user: the 2D version need not be tested beyond smoke) */
  if (process.env.GLFLAGS) await page.addInitScript(fl => { for (const f of fl) window[f] = 1; }, process.env.GLFLAGS.split(','));
  await page.goto('file://' + path.resolve(__dirname, '..', '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp, NEU = ['chill', 'leech', 'pierce', 'knock', 'shock']; let k = 0; do { P.quickStart('Pin'); } while (!NEU.includes(P.dun.petKit(P.st).AB.twist) && ++k < 200); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });

  /* the static part: every gameplay number the core and the move files expose, flattened */
  const tune = await page.evaluate(U => { const P = window.__pp, out = {}, flat = (o, pre, d) => { if (d > 4 || o == null) return; for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') out[pre + k] = v; else if (Array.isArray(v)) out[pre + k] = JSON.stringify(v); else if (v && typeof v === 'object' && !(v instanceof Element)) flat(v, pre + k + '.', d + 1); } };
    const I = P.ELEM_IMPL[U.el].ult[U.key]; if (I && I.TUNE) flat(I.TUNE, 'core.', 0); for (const [nm, ex] of U.tunes) { let v = null; try { v = eval(ex); } catch (e) {} if (v) flat(v, nm + '.', 0); } return out; }, U);

  async function scen(name, body, arg) {
    await page.evaluate(() => { const P = window.__pp; P.arc.paused = false; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => window.__pp.beginPlay());
    return page.evaluate(([evo, U, src, arg]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; P.arc.paused = true;
      for (let k = 0; k < 120; k++) G.update(1 / 60);
      const R0 = Math.random; if (!U.rawRandom) Math.random = () => 0.08 + 0.92 * R0();   /* (no crits: the 8 % roll never lands) */
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
      for (let k = 0; k < 1500; k++) { const sx = me.x + (Math.random() - 0.5) * 34, sy = me.y + (Math.random() - 0.5) * 34; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.7) && W(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; }
      if (best && !U.noMove) { me.x = best.x; me.y = best.y; }
      const mons = D.mons.filter(m => !m.boss); let i = 0; for (const m of mons) { if (i < 6) Object.assign(m, { dead: false, x: me.x + 30, y: me.y, hp: 1e9, maxhp: 1e9, still: true, spd: 0, atkCd: 99, dmg: 0, stun: 0, freeze: 0, falling: null, under: false, _tag: 'm' + i }); else Object.assign(m, { dead: true, x: me.x + 90 }); i++; }
      me.hp = D.ST.hp; me.mp = 999; me.dead = false; g.intro = 0; g.bossIntro = 0; g.cdU = 0; g.cleared = true;
      D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[U.el]['ey_' + U.key], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo }));
      const DK = D.ST.atk * 1.2 * (1 + 0.08 * (evo - 1));
      const H = { P, G, D, me, g, DK, log: [], U };
      H.step = (s, each) => { const t1 = g.t + s; let k = 0; while (g.t < t1 - 1e-6 && k++ < 9000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); if (each && each() === true) break; } };
      H.until = (fn, cap) => { const t1 = g.t + (cap || 10); let k = 0; while (!fn() && g.t < t1 && k++ < 12000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); } return fn(); };
      H.S = () => g[U.g];
      H.body = S => S[U.body];
      H.ready = S => !!S && S.phase === U.ready && !S.busy && !(H.body(S) && H.body(S).locked) && !U.busyKeys.some(k => S[k]);
      H.zero = S => { for (const k of Object.keys(S)) if (/^cd[A-Z]/.test(k) && typeof S[k] === 'number') S[k] = 0; };
      H.wrap = S => { const X = S.X; if (X.__w) return; X.__w = 1; const h0 = X.hitMon; X.hitMon = (m, d, o) => { const r = h0(m, d, o); const s2 = H.S(); H.log.push({ m: m && m._tag, raw: d, d: r, nc: !!(o && o.noCharge), ph: s2 ? s2.phase : 'none', t: g.t }); return r; }; };
      H.cast = () => { D.useUlt(); let S = null; H.until(() => (S = H.S()) && H.ready(S), 14); if (S) { H.left0 = S.left != null ? S.left : S.endT - g.t; H.wrap(S); H.step(0.3); } return S; };
      H.labels = () => { if (!D.VEH || !D.VEH.drawBtns) return []; const L = []; const GF = P.GFX, l0 = GF.labelS; GF.labelS = (c, s) => { L.push(String(s)); }; try { const cv = document.createElement('canvas'); cv.width = 400; cv.height = 900; const c = cv.getContext('2d'); const pic = (k, w, h, paint) => { const q = document.createElement('canvas'); q.width = Math.max(1, w | 0); q.height = Math.max(1, h | 0); try { paint(q.getContext('2d'), q.width, q.height); } catch (e) {} return q; };
        D.VEH.drawBtns(c, { B: D.vehBtns(), blitC: () => {}, hudPic: pic, glowPic: () => pic('', 4, 4, () => {}), touchUI: true }); } finally { GF.labelS = l0; } return L; };
      H.heading = S => { const b = H.body(S); return b ? (b.heading != null ? b.heading : b.a != null ? b.a : 0) : 0; };
      H.press = k => { if (k === 'ult') D.useUlt(); else if (k === 'dodge') D.dodge(); else if (k === 'jump') { if (D.VEH && D.VEH.jump) D.VEH.jump(0, 0); } else D.useStrong(k); };
      H.st = (S, k) => { if (k.startsWith('obj:')) { const o = S[k.slice(4)], seen = S.__seen || (S.__seen = new Set()); if (o && typeof o === 'object') seen.add(o); return seen.size; } return (S.stats && S.stats[k]) || 0; };   /* ('obj:drift': activations counted as new objects in S.drift, where the stat counts hits) */
      H.mons = () => D.mons.filter(m => m._tag && !m.dead);
      try { return (new Function('H', 'arg', src))(H, arg); } finally { Math.random = R0; if (!U.keepAlive) { const S = H.S(); if (S && !S.released) { if (S.left != null) S.left = 0; if (S.endT != null) S.endT = g.t; H.until(() => S.released && S.phase === 'gone', 15); H.step(0.5); } } }   /* (every ride is ended before the next floor, as play would) */
    }, [EVO, U, body, arg === undefined ? null : arg]);
  }
  const R = async (name, body, arg) => { try { return await scen(name, body, arg); } catch (e) { ok(false, name + ': ' + e.message.split('\n')[0]); return null; } };

  /* ---- 1. the ride: duration, labels, camera ---- */
  const A = await R('ride', `
    const { D, g, me } = H; const S = H.cast(); if (!S) return { err: 'no session' };
    const b = H.body(S), out = { left: +H.left0.toFixed(2), labels: H.labels().filter(s => !/^\\d+s$/.test(s)).map(s => s.replace(/\\d+%/, '%')), z: +((b && b.z) || 0).toFixed(2) };
    H.step(1.5); const cam = D.cam; out.zoom = +g.zoom.toFixed(3); out.camOff = cam ? +Math.hypot(cam.x - me.x, cam.y - me.y).toFixed(2) : null; out.CD = S.CD; return out;`);
  /* ---- 2. each move: damage per hit, who it reaches, how soon it can go again, the meter ---- */
  const moveRun = mv => R('move ' + mv.btn, `
    const { D, g, me } = H, mv = arg; const S = H.cast(); if (!S) return { err: 'no session' };
    const a = H.heading(S), ca = Math.cos(a), sa = Math.sin(a), M = H.mons();
    M.forEach((m, i) => { const r = mv.dist + (i % 3) * 0.6, off = (Math.floor(i / 3) ? 1 : -1) * (i % 3 === 1 ? 0.8 : 0.3); m.x = me.x + ca * r - sa * off; m.y = me.y + sa * r + ca * off; m.hp = 1e9; });
    const pos = M.map(m => [m.x, m.y]), pin = () => M.forEach((m, i) => { m.x = pos[i][0]; m.y = pos[i][1]; m.dead = false; });
    H.zero(S); S.charge = 0; H.step(0.2, pin); const n0 = H.log.length, s0 = H.st(S, mv.stat), d0 = H.st(S, 'dealt'), c0 = H.st(S, 'charged'), t0 = g.t;
    H.press(mv.btn); let again = null, k = 0;
    /* the cadence: a fresh press every 0.3 s until the move's counter goes up again */
    H.until(() => { pin(); H.st(S, mv.stat); if (S.phase !== H.U.ready) return true; const u = H.st(S, mv.stat) - s0; if (u >= 2 && again == null) again = g.t - t0; if (u < 2 && g.t - t0 >= 0.3 * (k + 1)) { k++; H.press(mv.btn); } return again != null || g.t - t0 > mv.wait; }, mv.wait + 1); H.step(again != null ? 0 : 0.5, pin);
    const L = H.log.slice(n0).filter(h => /^m/.test(h.m)), first = L.filter(h => h.t < t0 + Math.max(again || 99, mv.win || 0) - 1e-6), per = {}; for (const h of first) per[h.m] = (per[h.m] || 0) + 1;
    const dk = [...new Set(first.map(h => Math.round(h.raw / H.DK * 20) / 20))].sort((x, y) => x - y), dealt = H.st(S, 'dealt') - d0, ch = H.st(S, 'charged') - c0;
    const allLog = H.log.slice(n0); return { dbgAll: allLog.length + " hits, first: " + JSON.stringify(allLog.slice(0, 4).map(h => [h.m, +(h.raw / H.DK).toFixed(2), +(h.t - t0).toFixed(2)])), uses: H.st(S, mv.stat) - s0, again: again != null ? +again.toFixed(1) : null, dk, enemies: Object.keys(per).length, maxPer: Math.max(0, ...Object.values(per)), hits: first.length, chargeK: ch > 0 ? +(dealt / H.DK / ch).toFixed(2) : null, noCharge: first.filter(h => h.nc).length };`, mv);
  const MV = {}; for (const mv of U.moves) MV[mv.btn] = await moveRun(mv);
  /* ---- 3. the finisher on one target in front: damage, noCharge, one use, the exit, the cooldown ---- */
  const F = await R('finisher', `
    const { D, g, me } = H; const S = H.cast(); if (!S) return { err: 'no session' };
    const a = H.heading(S), M = H.mons(); M.forEach((m, i) => { if (i) { m.dead = true; m.x += 90; } }); const T = M[0]; T.x = me.x + Math.cos(a) * H.U.finDist; T.y = me.y + Math.sin(a) * H.U.finDist; const tp = [T.x, T.y];
    S.charge = 1; H.step(0.3, () => { T.x = tp[0]; T.y = tp[1]; }); const n0 = H.log.length; H.press('ult'); H.step(0.1); const started = S.phase !== H.U.ready; let rel = null, chUp = 0; const ch0 = S.charge;
    H.until(() => { T.x = tp[0]; T.y = tp[1]; if (!S.released && S.charge > ch0 + 1e-9) chUp = Math.max(chUp, S.charge - ch0); if (rel == null && S.released) rel = g.t; return S.phase === 'gone' && rel != null && g.t - rel > 1.5; }, 30);
    D.useUlt(); H.step(0.3);
    const L = H.log.slice(n0).filter(h => h.m === 'm0'); return { started, dk: +(L.reduce((s, h) => s + h.raw, 0) / H.DK).toFixed(2), dkSet: [...new Set(L.map(h => Math.round(h.raw / H.DK * 20) / 20))].sort((x, y) => x - y), hits: L.length, allNoCharge: L.every(h => h.nc), recharged: +chUp.toFixed(4), late: L.filter(h => rel != null && h.t > rel + 0.05).length, cd: +g.cdU.toFixed(1), used: S.used, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), veh: !!(D.VEH && D.VEH.active), fx: D.ELEM.fx.length };`);
  /* ---- 4. timeout: the exit with no finisher, the cooldown once ---- */
  const T = await R('timeout', `
    const { D, g, me } = H; const S = H.cast(); if (!S) return { err: 'no session' }; const n0 = H.log.length;
    if (S.left != null) S.left = 0.2; if (S.endT != null) S.endT = g.t + 0.2; let rel = null; H.until(() => { if (rel == null && S.released) rel = g.t; return S.phase === 'gone'; }, 12); H.step(1.5);
    return { gone: S.phase === 'gone', fin: H.log.slice(n0).filter(h => h.nc).length, cd: +g.cdU.toFixed(1), walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, (me.r || 0.3) * 0.9, 0), veh: !!(D.VEH && D.VEH.active) };`);
  /* ---- 5. scenery: a smashable prop in the way of the dodge move, another at the strong attack's aim; doors, gates, stairs and bridges kept ---- */
  const E = await R('smash', `
    const { D, g, me } = H; const S = H.cast(); if (!S) return { err: 'no session' }; const vs = S.vs || null; if (!vs || !vs.props) return { noHook: true };
    for (const m of D.mons) { m.dead = true; m.x += 90; }
    const Wk = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.6, 0), sm = p => !!vs.smashable(Math.floor(p.x), Math.floor(p.y));
    const spotFor = (p, dist) => { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, x = p.x - Math.cos(a) * dist, y = p.y - Math.sin(a) * dist; if (!Wk(x, y)) continue; let clear = true; for (let q = 0.5; q < dist - 0.8 && clear; q += 0.3) if (D.blocked(x + Math.cos(a) * q, y + Math.sin(a) * q, 0.35, 0)) clear = false; if (clear && !D.propList.some(o => o !== p && !o.broken && Math.hypot(o.x - x, o.y - y) < 1.4)) return { x, y, a }; } return null; };
    const cand = D.propList.filter(p => !p.broken && sm(p)).sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y));
    const prot = () => D.propList.filter(p => /door|gate|stair|bridge|exit/i.test(p.kind) && !p.broken).length, pr0 = prot();
    const body = H.body(S), put = sp => { me.x = body.x = sp.x; me.y = body.y = sp.y; if (body.heading != null) body.heading = sp.a; if (body.a != null) body.a = sp.a; for (const k of ['vx', 'vy', 'speed']) if (body[k] != null) body[k] = 0; };
    const out = {}; for (const [btn, dist] of H.U.smash) { out[btn] = null; for (const p of cand) { if (p.broken) continue; const sp = spotFor(p, dist); if (!sp) continue; H.until(() => H.ready(S), 6); H.zero(S); put(sp); H.step(0.1); put(sp); const K = H.P.arc.keys; K.right = Math.cos(sp.a) > 0.5; K.left = Math.cos(sp.a) < -0.5; K.down = Math.sin(sp.a) > 0.5; K.up = Math.sin(sp.a) < -0.5; H.press(btn); H.step(0.15); K.right = K.left = K.up = K.down = false; H.step(3.5); out[btn] = { kind: p.kind, broken: !!p.broken }; break; } }
    out.protectedBroken = pr0 - prot(); out.smashStat = H.st(S, 'smash'); return out;`);

  /* ---- the fingerprint and the comparison ---- */
  const fp = { evo: EVO, tune, ride: A, moves: MV, finisher: F, timeout: T, smash: E };
  const file = path.resolve(__dirname, '..', 'baseline', `${U.key}-evo${EVO}.json`);
  let base = null; try { base = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {}
  const okRun = [A, F, T, E].every(x => x && !x.err) && Object.values(MV).every(x => x && !x.err);
  ok(okRun, 'every scenario ran', { ride: A && A.err, fin: F && F.err, moves: Object.fromEntries(Object.entries(MV).map(([k, v]) => [k, v && v.err])) });
  /* behaviour that must hold whatever the baseline says */
  if (A && !A.err) { ok(Math.abs(A.left - U.dur[EVO >= 7 ? 2 : EVO >= 4 ? 1 : 0]) < 0.3, `the ride lasts ${U.dur[EVO >= 7 ? 2 : EVO >= 4 ? 1 : 0]} s at this evo`, A.left); ok(U.labels.every(re => A.labels.some(s => re.test(s))), 'the commands on the buttons', A.labels); }
  for (const mv of U.moves) { const r = MV[mv.btn]; if (r && !r.err) ok(r.uses >= 1 && r.hits > 0 && r.noCharge === 0, `${mv.name}: it fires, lands hits and charges the meter`, r); }
  if (F && !F.err) ok(F.started && F.hits > 0 && F.recharged === 0 && F.late === 0 && F.used && Math.abs(F.cd - (A && A.CD || 120)) < 3 && F.walk && !F.veh, `${U.fin}: one finisher, it does not recharge the meter, nothing after the release, the cooldown, the pet on valid ground`, F);
  if (T && !T.err) ok(T.gone && T.fin === 0 && Math.abs(T.cd - (A && A.CD || 120)) < 3 && T.walk && !T.blocked && !T.veh, 'timeout: no finisher, the cooldown, the pet on valid ground', T);
  if (E && !E.err) { if (E.noHook) console.log('skip  no smash hook on this floor'); else { for (const [btn] of U.smash) ok(!!E[btn] && E[btn].broken, `${U.names[btn]} breaks a smashable prop in its way`, E[btn]); ok(E.protectedBroken === 0, 'doors, gates, stairs and bridges are kept', E.protectedBroken); } }
  if (!base || UPDATE) { if (okRun) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(fp, null, 1)); console.log('baseline written: ' + path.relative(process.cwd(), file)); } }
  else {
    const td = Object.keys(Object.assign({}, base.tune, fp.tune)).filter(k => JSON.stringify(base.tune[k]) !== JSON.stringify(fp.tune[k]));
    ok(td.length === 0, 'every gameplay number (core and move TUNE) is as in the baseline', td.slice(0, 12).map(k => [k, base.tune[k], fp.tune[k]]));
    if (A && base.ride) { ok(Math.abs(A.left - base.ride.left) < 0.05 && A.CD === base.ride.CD, 'duration and cooldown as in the baseline', [base.ride.left, A.left, base.ride.CD, A.CD]); ok(JSON.stringify(A.labels) === JSON.stringify(base.ride.labels), 'the same buttons', [base.ride.labels, A.labels]);
      ok(Math.abs(A.zoom - base.ride.zoom) < 0.02, 'the camera zoom while riding', [base.ride.zoom, A.zoom]); soft(A.camOff == null || A.camOff <= (base.ride.camOff || 0) + 0.6, 'the camera stays on the ride', [base.ride.camOff, A.camOff]); }
    for (const mv of U.moves) { const r = MV[mv.btn], b = base.moves[mv.btn]; if (!r || r.err || !b) continue;
      ok(JSON.stringify(r.dk) === JSON.stringify(b.dk), `${mv.name}: the same damage per hit (x DK)`, [b.dk, r.dk]);
      ok((r.again == null) === (b.again == null) && (r.again == null || Math.abs(r.again - b.again) <= 0.31), `${mv.name}: the same cadence`, [b.again, r.again]);
      ok(r.chargeK == null || b.chargeK == null || Math.abs(r.chargeK / b.chargeK - 1) < 0.03, `${mv.name}: the meter fills at the same rate`, [b.chargeK, r.chargeK]);
      soft(r.enemies >= b.enemies - 1 && r.maxPer === b.maxPer, `${mv.name}: reaches about as many enemies, as many times`, { base: [b.enemies, b.maxPer, b.hits], now: [r.enemies, r.maxPer, r.hits] }); }
    if (F && base.finisher) { if (U.finExact) ok(Math.abs(F.dk / base.finisher.dk - 1) < 0.03 && F.hits === base.finisher.hits, `${U.fin}: the same damage and hits on one target`, [base.finisher.dk, F.dk, base.finisher.hits, F.hits]);
      else { (U.finSoft ? soft : ok)(U.finSoft ? F.dkSet.every(v => base.finisher.dkSet.includes(v) || v <= Math.max(...base.finisher.dkSet)) : JSON.stringify(F.dkSet) === JSON.stringify(base.finisher.dkSet), `${U.fin}: the same damage per hit (x DK)`, [base.finisher.dkSet, F.dkSet]); soft(Math.abs(F.dk / base.finisher.dk - 1) < 0.2, `${U.fin}: about the same total on one target (it moves, so the count varies)`, [base.finisher.dk, F.dk, base.finisher.hits, F.hits]); } }
  }
  ok(!errors.length, 'no page errors', errors.slice(0, 3));
  await browser.close();
  console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok` + (warn ? ` (${warn} WARN)` : '')); process.exit(bad ? 1 : 0);
};
